// Claude Monet, Water Lilies (1906), Gallery 243. The word: ripple.
//
// His picture has no bank and no sky: it is all pond, and the sky and the willows are only in it as reflections. Look
// at it and three drops fall from under the bottom rail, and where they land the pond comes out across the floor, laid
// stroke by stroke in his broken blues, violets and greens (level strokes for the sky in the water, upright ones for the
// willows), and like his pond it holds the room: the floor's reflection shimmers in it, bent by every ripple. Lily pads
// slide out from under the frame and drift to rest, each with its little wake, flat planes of his greens with yellow and
// violet in them; and a frog rides out on the biggest. Buds come up through the pads and open, petal by petal, pink and
// white, each with a note of a harp. The frog says so (rib-bit), crouches, and leaps: a long arc over the water, and
// plop, a splash, and one ring that crosses the whole pond, rocking every pad and flower as it passes. Then two eyes come
// up, the frog swims to another pad, climbs out and sings. The opening of Beethoven's "Moonlight" Sonata (1801, the
// triplets Rellstab heard as moonlight on a lake) goes round, quietly, with the water, while you look; now and then a
// drop falls from the frame, and the frog changes pads.
//
// When you stop looking the pond stays while the toy is near: drive on it and it ripples round the wheels, the pads are
// nudged aside (never solid) and the frog jumps clear. Then the flowers close, the frog dives back under the frame, the
// pads drift home and the water goes back in after them.
//
// This is also the fourth choice for the Director's secret (src/secretclue.js: a touch on the signature, bottom right).
// Nothing here is on the picture or takes a touch, so that works as it always has.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, shape } from '../paintlife.js';
import { strokes, softDot } from './brush.js';
import { looper } from './tunes.js';

const OUT = 2.05, HALF = 1.6;                 // the pond: out from the wall, and either side of the middle (m)
const NR = 14, NP = 60;                       // ripples at once; drops and spray
const C = 0.42, RW = 0.06, RK = 80;          // ripples: speed (m/s), ring width (m), wave number (rad/m)
const FS = 2.1;                               // the frog's size (an 18 cm frog, the toy's size, so it reads across the room)
const T_JUMP = 6.7, T_PLOP = 7.25, T_UP = 8.1, T_SWIM = 8.45, T_CLIMB = 9.0, T_SING = 9.5;
// The pads, where they come to rest: [along, out, radius]. Open water left in front for the frog's plop (PLOP).
const PADS = [
  [-1.05, 0.5, 0.19], [-0.45, 0.38, 0.14], [0.2, 0.45, 0.16], [0.85, 0.55, 0.2],
  [-0.85, 1.0, 0.17], [1.1, 1.02, 0.16], [-1.2, 1.15, 0.13],
  [-0.55, 1.42, 0.22], [0.64, 1.36, 0.19], [-0.2, 1.86, 0.14], [0.45, 1.86, 0.13], [0.95, 1.5, 0.14], [-0.85, 1.6, 0.12],
];
const FROG_PAD = 7, SWIM_PAD = 8, PLOP = [0.04, 1.42], SURFACE = [0.3, 1.5];
const HOPS = [11, 10, 9, 7, 4, 8];            // the frog's pads while you keep looking, one every few seconds
// Blossoms: [pad, pink (0) / white (1) / rose (2), when the bud comes up]
const FLOWERS = [[4, 0, 3.3], [3, 1, 3.75], [9, 2, 4.2], [11, 0, 4.65], [1, 1, 5.1], [6, 2, 5.5]];
const RING = [[8, 1.0, -0.12], [8, 0.82, 0.25], [6, 0.64, 0.05]];        // petals per ring, size, turn
const BLOOM = 1.9;                            // a flower's size (an outer petal is 9.5 cm)
const OPEN = [-0.12, -0.55, -0.98], SHUT = -1.42;
// Moonlight Sonata, first movement (Beethoven, 1801): bars 1 to 4, the triplets and the bass octaves, in triplet quavers.
const MOON = (() => {
  const s = [], tri = (bar, beat, a, b, c) => { const t = bar * 12 + beat * 3; s.push([t, a, 1.6, 0.9], [t + 1, b, 1.6, 0.75], [t + 2, c, 1.6, 0.8]); };
  for (let b = 0; b < 4; b++) tri(0, b, 'G#3', 'C#4', 'E4');
  for (let b = 0; b < 4; b++) tri(1, b, 'G#3', 'C#4', 'E4');
  tri(2, 0, 'A3', 'C#4', 'E4'); tri(2, 1, 'A3', 'C#4', 'E4'); tri(2, 2, 'A3', 'D4', 'F#4'); tri(2, 3, 'A3', 'D4', 'F#4');
  tri(3, 0, 'G#3', 'C4', 'F#4'); tri(3, 1, 'G#3', 'C#4', 'E4'); tri(3, 2, 'G#3', 'C#4', 'D#4'); tri(3, 3, 'F#3', 'C4', 'D#4');
  s.push([0, 'C#2', 12, 1.3], [0, 'C#3', 12, 1], [12, 'B1', 12, 1.3], [12, 'B2', 12, 1], [24, 'A1', 6, 1.3], [24, 'A2', 6, 1], [30, 'F#1', 6, 1.3], [30, 'F#2', 6, 1], [36, 'G#1', 12, 1.3], [36, 'G#2', 12, 1]);
  return s;
})();
const HARP = [554.37, 659.25, 830.61, 1108.73, 1318.51, 1661.22];          // C# minor, for the flowers

lifeFor(16568, {
  title: /^Water Lilies$/,
  word: 'ripple',
  stage: { out: OUT, half: HALF },
  wake: 2, ret: 2.6,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.35) => P.near(h, a);
    this.v = new THREE.Vector3(); this.w = new THREE.Vector3(); this.qy = new THREE.Quaternion(); this.A = new THREE.Vector3(); this.B = new THREE.Vector3(); this.E2 = new THREE.Vector3(); this.lq = new THREE.Quaternion(); this.le = new THREE.Euler(0, 0, 0, 'YXZ'); this.q3 = new THREE.Quaternion(); this.m = new THREE.Matrix4(); this.m2 = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(0, 0, 0, 'YXZ'); this.s = new THREE.Vector3(1, 1, 1); this.one = new THREE.Vector3(1, 1, 1);
    // ---------------------------------------------------------- the pond: his strokes, holding the room
    const tex = strokes({
      size: 512, seed: 16568, n: 3400, len: [12, 34], width: [4, 9], bend: 0.3, lift: 0.14, base: col('#5a6c95', 0.4).getStyle(),
      colors: [['#6a80b8', 4], ['#8197c8', 3], ['#8a7fb8', 3], ['#a493c8', 2], ['#5f8a72', 1.6], ['#7aa07e', 1.1], ['#3f4f78', 2], ['#c8d0e8', 1.3], ['#c99ab8', 0.35], ['#a8c08a', 0.6]].map(([c, w]) => [col(c).getStyle(), w]),
      // level strokes for the sky in the water; upright ones, here and there, for the willows' reflections
      angle: (x, y, r) => (Math.sin(x * 6.3 * 2 + 1.1) * Math.cos(y * 6.3 + 0.4) > 0.62 ? Math.PI / 2 + (r() - 0.5) * 0.35 : (r() - 0.5) * 0.42),
    });
    // and his pond's own colours, where they are in it: the picture, read very small and soft, mirrored out from the wall
    // (its foot nearest the wall), so the violet shade, the pale sky and the green of the pads lie on the floor where they lie in it
    const field = new THREE.DataTexture(new Uint8Array(32 * 32 * 4).fill(160), 32, 32); field.colorSpace = THREE.SRGBColorSpace; field.magFilter = field.minFilter = THREE.LinearFilter; field.needsUpdate = true;
    const fill = im => { try { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d', { willReadFrequently: true }); g.filter = 'blur(1.5px)'; g.drawImage(im, -2, -2, 36, 36); field.image.data.set(g.getImageData(0, 0, 32, 32).data); field.needsUpdate = true; return true; } catch { return false; } };
    const im0 = L.art.tex && L.art.tex.image;
    if (!(im0 && im0.width > 32 && fill(im0)) && L.art.work.lq) { const im = new Image(); im.onload = () => fill(im); im.src = L.art.work.lq; }
    const u = this.u = {
      uSpread: { value: 0 }, uTime: { value: 0 }, tStroke: { value: tex }, tField: { value: field },
      uO: { value: L.floor(0, -L.wall) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uSize: { value: new THREE.Vector2(HALF, OUT + L.wall) },
      uRip: { value: Array.from({ length: NR }, () => new THREE.Vector4(0, 0, 9, 0)) }, uSky: { value: col('#d6dcf0', 0.25) }, uMix: { value: new THREE.Vector4(0.6, 0.26, 0.6, 0.12) },
    };
    const pond = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false });
    pond.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform float uSpread, uTime; uniform sampler2D tStroke, tField; uniform vec3 uO; uniform vec4 uAx; uniform vec2 uSize; uniform vec4 uRip[${NR}]; uniform vec3 uSky; uniform vec4 uMix;
uniform sampler2D tRefl; uniform mat4 reflMatrix; uniform float reflOn; uniform float reflY;
vec2 pGrad; float pCrest, pMask, pSo; vec3 pWater; float pId;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz; float su = dot(lq, uAx.xy), so = dot(lq, uAx.zw);
  pGrad = vec2(0.0); pCrest = 0.0;
  for (int i = 0; i < ${NR}; i++) {
    vec4 R = uRip[i]; if (R.z > 5.0) continue;
    vec2 dv = lifeP.xz - R.xy; float d = length(dv) + 1e-4, x = d - ${C.toFixed(3)} * R.z;
    float env = exp(-x * x / ${(RW * RW).toFixed(6)}), dec = R.w * exp(-R.z * 0.75) * env, ph = x * ${RK.toFixed(1)}, s = sin(ph);
    pGrad += dv / d * dec * (cos(ph) - x / ${(RW * RW * RK / 2).toFixed(6)} * s); pCrest += dec * max(s, 0.0);
  }
  pSo = so; vec2 suv = vec2(su, so) / 0.9, bend = pGrad * 0.03;
  vec4 s1 = texture2D(tStroke, suv + vec2(uTime * 0.011, uTime * 0.003) + bend), s2 = texture2D(tStroke, suv * 0.63 + vec2(0.37 - uTime * 0.007, 0.21) + bend * 1.3);
  pId = s1.a; pWater = mix(s1.rgb, s2.rgb, 0.33);
  vec3 fc = texture2D(tField, vec2(0.5 + su / (2.0 * uSize.x), 1.0 - clamp(so / uSize.y, 0.0, 1.0) * 0.62) + bend * 0.3).rgb;
  pWater = mix(pWater, fc * (0.45 + 1.25 * dot(pWater, vec3(0.3, 0.5, 0.2))), 0.62);
  float pl = dot(pWater, vec3(0.3, 0.5, 0.2)); pWater = max(mix(vec3(pl), pWater, 1.45), 0.0);
  float rr = pow(pow(abs(su) / uSize.x, 3.0) + pow(max(so, 0.0) / uSize.y, 3.0), 1.0 / 3.0);
  pMask = smoothstep(0.0, 0.03, uSpread * 1.2 - (rr * 0.82 + pId * 0.18)) * (1.0 - smoothstep(0.84, 0.98, rr + (pId - 0.55) * 0.2));
}`)
        .replace('#include <opaque_fragment>', `{
  vec4 rp = reflMatrix * vec4(lifeP, 1.0); vec2 ruv = rp.xy / rp.w + pGrad * 0.022 + vec2(sin(lifeP.z * 23.0 + uTime * 1.7), sin(lifeP.x * 19.0 - uTime * 1.3)) * 0.0016;
  float on = reflOn * (1.0 - step(0.08, abs(lifeP.y - reflY)));
  vec3 refl = min(texture2D(tRefl, ruv).rgb, vec3(2.2));
  vec3 col = pWater * uMix.x + refl * vec3(0.62, 0.68, 0.95) * uMix.y * on;
  col *= mix(0.62, 1.0, smoothstep(0.0, 0.9, pSo));             // darker by the wall, as his pond is in the willows' shade
  col += uMix.z * min(pCrest, 1.3) * uSky * smoothstep(0.42, 0.85, pId);           // the rings, in broken strokes
  col += uSky * uMix.w * pow(clamp(length(pGrad) * 0.6, 0.0, 1.0), 2.0);
  outgoingLight = col; diffuseColor.a = pMask * 0.95;
}
#include <opaque_fragment>`);
    };
    pond.customProgramCacheKey = () => 'lilies-pond';
    this.pond = L.decal({ w: 2 * HALF, d: OUT + L.wall, u: 0, out: (OUT - L.wall) / 2, material: pond });
    Object.assign(u, L.mirrored(this.pond));
    this.pond.position.y += 0.004; this.pond.renderOrder = 5;                      // (over the pool of light the room's lamp casts on the floor here: the pond is lit its own way)
    this.rips = Array.from({ length: NR }, () => ({ x: 0, z: 0, age: 9, amp: 0 })); this.ri = 0;

    // ---------------------------------------------------------- pads, flowers and the frog: one rig
    const rig = this.rig = L.rig(170, 16000, L.paint({ glow: 0.42, rough: 0.62, side: THREE.DoubleSide }));
    const greens = ['#4d7a3e', '#5f8c45', '#6f9a48', '#86ad55', '#a9bf62', '#5f8a7a', '#486e5a'].map(c => col(c, 0.3)), violet = col('#8a86b8', 0.3), pale = col('#d9d6a8', 0.3), rosy = col('#c99aa8', 0.3), dark = col('#2c4a3a', 0.3);
    const pad = seed => {
      const pos = [], keys = [], rings = 8, seg = 36, notch = 0.3, R = a => 1 + 0.05 * Math.sin(3 * a + seed) + 0.03 * Math.sin(7 * a + seed * 2);
      const pt = (r, a) => { const rad = r * R(a); return [Math.cos(a) * rad, 0.03 * Math.pow(r, 3) + 0.012 * Math.sin(a * 5 + seed) * r, Math.sin(a) * rad]; };
      for (let k = 0; k < rings; k++) for (let s = 0; s < seg; s++) {
        const a0 = notch + (Math.PI * 2 - 2 * notch) * s / seg, a1 = notch + (Math.PI * 2 - 2 * notch) * (s + 1) / seg, r0 = k / rings, r1 = (k + 1) / rings;
        const A = pt(r0, a0), B = pt(r1, a0), Cc = pt(r1, a1), D = pt(r0, a1);
        pos.push(...A, ...Cc, ...B); if (k) pos.push(...A, ...D, ...Cc);
        if (k === rings - 1) { const lip = [B[0], B[1] - 0.06, B[2]], lip2 = [Cc[0], Cc[1] - 0.06, Cc[2]]; pos.push(...B, ...Cc, ...lip2, ...B, ...lip2, ...lip); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
      g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(pos.length), 3));
      // his pads: dabs of green, each a short stroke laid out from the middle (the nearest of a scatter of stroke centres,
      // measured long along the radius and short across it), lighter to the rim, a yellow catch of light, the sky's
      // violet laid over some; a dark edge where the pad meets the water
      const dabs = Array.from({ length: 46 }, () => { const a = L.rand() * Math.PI * 2, r = Math.sqrt(L.rand()) * 0.98, q = L.rand(); return { x: Math.cos(a) * r, z: Math.sin(a) * r, a, c: q < 0.08 ? violet : q < 0.14 && r > 0.5 ? pale : q < 0.16 ? rosy : greens[Math.min(6, Math.floor(r * 3.4 + L.rand() * 3.2))] }; });
      shape.paint(g, (c, n) => {
        if (n.y < 0.3 && Math.hypot(c.x, c.z) > 0.9) return dark;
        let best = dabs[0], bd = 1e9; const ra = Math.atan2(c.z, c.x), ux = Math.cos(ra), uz = Math.sin(ra);
        for (const d of dabs) { const dx = c.x - d.x, dz = c.z - d.z, al = dx * ux + dz * uz, ac = -dx * uz + dz * ux, dd = al * al * 0.3 + ac * ac * 2.2; if (dd < bd) { bd = dd; best = d; } }
        return best.c;
      });
      return g;
    };
    const padG = [0, 1, 2, 3].map(i => rig.geo(pad(i * 1.7)));
    // a petal: from its base along +z, pointed, cupped; pink deepening to the base
    const petal = (tip, mid, base) => {
      const pos = [], nl = 6, nw = 4;
      const pt = (i, j) => { const z = i / nl, w = 0.36 * Math.pow(Math.sin(Math.PI * Math.min(1, z * 0.92 + 0.04)), 0.75), x = (j / nw - 0.5) * 2 * w; return [x, 0.16 * (x / 0.36) ** 2 + 0.05 * z * z, z]; };
      for (let i = 0; i < nl; i++) for (let j = 0; j < nw; j++) { const A = pt(i, j), B = pt(i + 1, j), Cc = pt(i + 1, j + 1), D = pt(i, j + 1); pos.push(...A, ...B, ...Cc, ...A, ...Cc, ...D); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
      g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(pos.length), 3));
      shape.paint(g, cc => (cc.z > 0.62 ? (L.rand() < 0.3 ? mid : tip) : cc.z > 0.28 ? (L.rand() < 0.3 ? tip : mid) : base));
      return g;
    };
    const petalG = [
      rig.geo(petal(col('#f2c4cc', 0.3), col('#e48a9c', 0.3), col('#c8506e', 0.3))),
      rig.geo(petal(col('#f6eef0', 0.25), col('#eed6dc', 0.25), col('#d9a0b0', 0.3))),
      rig.geo(petal(col('#f0a0b0', 0.3), col('#d86a84', 0.3), col('#b23e5c', 0.3))),
    ];
    const heart = shape.ball(0.5, col('#e8c04a', 0.3), 1); shape.paint(heart, () => (L.rand() < 0.4 ? col('#f0d878', 0.3) : null)); shape.move(heart, 0, 0, 0, 0, 0, 0, 1, 0.6, 1);
    const heartG = rig.geo(heart);
    // the frog, facing +z, sitting: in the pond's greens, a yellow throat, gold eyes
    const fg = [col('#5d8a3e', 0.3), col('#6f9a48', 0.3), col('#4a7238', 0.3), col('#86a852', 0.3)], fdark = col('#2f4a2a', 0.3), fbelly = col('#d8cf8a', 0.3);
    const body = shape.ball(1, fg[0], 2);
    { const p = body.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, x * 0.03 * (1 + 0.15 * z), y * 0.021 + 0.022 + z * 0.006, z * 0.04 - 0.004); } body.computeVertexNormals(); }
    const head = shape.ball(1, fg[1], 2);
    { const p = head.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * 0.026, p.getY(i) * 0.014 + 0.034, p.getZ(i) * 0.022 + 0.03); head.computeVertexNormals(); }
    const eyes = [-1, 1].flatMap(s => [shape.move(shape.ball(0.0085, col('#d8b84a', 0.25), 1), s * 0.015, 0.046, 0.033), shape.move(shape.ball(0.0045, col('#141414', 0.1), 1), s * 0.018, 0.0485, 0.038)]);
    const arms = [-1, 1].map(s => shape.move(shape.cyl(0.004, 0.0035, 0.026, 5, fg[2]), s * 0.022, 0.012, 0.03, 0, 0, s * 0.3));
    const fbody = shape.merge([body, head, ...eyes, ...arms]);
    shape.paint(fbody, (c, n) => { if (n.y < -0.35 && c.y < 0.03) return fbelly; if (c.y > 0.043 && Math.abs(Math.abs(c.x) - 0.016) < 0.01 && c.z > 0.025) return null; const q = L.rand(); return q < 0.14 ? fdark : q < 0.3 ? fg[3] : q < 0.5 ? fg[2] : null; });
    shape.move(fbody, 0, 0, 0, 0, 0, 0, FS);
    // a hind leg, folded along the body from the hip, pointing back (+x side; the other is mirrored)
    const leg = shape.merge([shape.move(shape.ball(1, fg[2], 1), 0.008, 0.008, 0.0, 0, 0, 0, 0.012, 0.009, 0.026), shape.move(shape.ball(1, fg[0], 1), 0.014, 0.004, 0.012, 0, 0, 0, 0.007, 0.006, 0.022), shape.move(shape.box(0.016, 0.003, 0.02, fg[3]), 0.016, 0.0, 0.03)]);
    shape.move(leg, 0, 0, 0, 0, 0, 0, FS);
    const legL = leg.clone(); { const p = legL.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, -p.getX(i)); legL.computeVertexNormals(); }
    const sac = shape.ball(0.5, col('#e8dc98', 0.3), 1); shape.move(sac, 0, 0, 0, 0, 0, 0, FS);
    const G = { body: rig.geo(fbody), legR: rig.geo(leg), legL: rig.geo(legL), sac: rig.geo(sac) };

    this.pads = PADS.map(([pu, po, r], i) => {
      const start = [Math.max(-0.38, Math.min(0.38, pu * 0.3 + (L.rand() - 0.5) * 0.15)), -L.wall - r - 0.02];
      return { i, home: [pu, po], r, start, ts: 0.9 + [3, 7, 1, 10, 5, 12, 0, 8, 4, 11, 2, 6, 9][i] * 0.14 + (i === FROG_PAD ? -0.1 : 0), swing: (L.rand() - 0.5) * 0.7, rot0: L.rand() * 6.3, rot1: L.rand() * 6.3,
        ph: L.rand() * 6.3, inst: rig.add(padG[i % 4]), lo: 0, lout: 0, vu: 0, vo: 0, at: [0, 0], y: 0, yaw: 0, tx: 0, tz: 0, M: new THREE.Matrix4(), shown: false, from: null };
    });
    this.flowers = FLOWERS.map(([pi, kind, tb], j) => ({ pad: pi, tb, petals: RING.flatMap(([n, sz, turn], ring) => Array.from({ length: n }, (_, k) => ({ inst: rig.add(petalG[kind]), ring, sz, yaw: (k / n) * Math.PI * 2 + turn + j, d: (L.rand() - 0.5) * 0.1 }))), heart: rig.add(heartG), note: HARP[j % HARP.length], sung: false, off: [0.03 * Math.cos(j * 2.1), 0.03 * Math.sin(j * 2.1)] }));
    this.frog = { body: rig.add(G.body), legR: rig.add(G.legR), legL: rig.add(G.legL), sac: rig.add(G.sac), p: new THREE.Vector3(), yaw: 0 };
    // ---------------------------------------------------------- drops from the frame, and the spray of the plop
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 3), 3).setUsage(THREE.DynamicDrawUsage));
    this.spray = L.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: col('#dfe6f6', 0.2), size: 0.05, map: softDot(), transparent: true, depthWrite: false, fog: false })));
    this.drops = Array.from({ length: NP }, () => ({ x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, on: false, rip: 0 }));
    this.lap = L.voice().loop({ lp: 700, hp: 160 });
    this.moon = looper(L.voice(), MOON, { len: 48, step: 0.32, type: 'triangle', vol: 0.016, ring: 1.4 });
    this.hideAll();
  },

  // ---------------------------------------------------------------- ripples (the same sum on the CPU, for the pads)
  ripple(x, z, amp) { const r = this.rips[this.ri = (this.ri + 1) % NR]; r.x = x; r.z = z; r.age = 0; r.amp = amp; },
  // height (m) and slope at (x, z)
  wave(x, z, o) {
    let h = 0, gx = 0, gz = 0;
    for (const r of this.rips) {
      if (r.age > 5) continue;
      const dx = x - r.x, dz = z - r.z, d = Math.hypot(dx, dz) + 1e-4, xx = d - C * r.age, env = Math.exp(-xx * xx / (RW * RW)), dec = r.amp * Math.exp(-r.age * 0.75) * env, ph = xx * RK;
      h += dec * Math.sin(ph); const g = dec * Math.cos(ph); gx += dx / d * g; gz += dz / d * g;
    }
    o.h = h * 0.008; o.gx = gx; o.gz = gz; return o;
  },

  hideAll() {
    const r = this.rig;
    for (const p of this.pads) { r.show(p.inst, false); p.shown = false; p.lo = p.lout = p.vu = p.vo = 0; }
    for (const f of this.flowers) { for (const q of f.petals) r.show(q.inst, false); r.show(f.heart, false); }
    const F = this.frog; for (const k of ['body', 'legR', 'legL', 'sac']) r.show(F[k], false);
    for (const d of this.drops) { d.on = false; d.y = -99; }
    for (const q of this.rips) q.age = 9;
  },

  start(L, resumed) {
    if (resumed) return;
    this.hideAll(); this.u.uSpread.value = 0; this.events = new Set(); this.lastT = -1; this.moon.reset(); this.hop = null; this.frogAt = FROG_PAD; this.flee = 0;
    // the sting: a harp run up through the chord, and the first drop
    const v = L.voice(); [277.18, 329.63, 415.3, 554.37, 659.25, 830.61, 1108.73].forEach((f, i) => { v.note(f, 1.4, { at: i * 0.055, vol: 0.02, type: 'triangle', attack: 0.004 }); v.note(f * 2, 0.5, { at: i * 0.055, vol: 0.006, type: 'sine', attack: 0.003 }); });
  },
  back(L) {
    for (const p of this.pads) p.from = p.shown ? [p.at[0] + p.lo, p.at[1] + p.lout] : null;
    this.fromSpread = this.u.uSpread.value; this.frogFrom = this.frog.shown ? (this.ff || (this.ff = new THREE.Vector3())).copy(this.frog.p) : null; this.frogYaw0 = this.frog.yaw;
    this.flowerK = this.flowers.map(f => f.open || 0);
  },
  end(L) { this.hideAll(); this.u.uSpread.value = 0; this.pond.material.visible = false; this.lap.set(0); },
  reset(L) { this.end(L); },

  // Once, when show-time first passes `at` (so sounds and ripples happen once, however the frames fall).
  once(key, at) { if (this.lastT < at && this.t >= at && !this.events.has(key)) { this.events.add(key); return true; } return false; },

  update(L, dt) {
    const ph = L.phase, t = L.t, showing = ph === 'wake' || ph === 'play', lingering = ph === 'linger', ret = ph === 'return';
    this.t = t; const v = L.voice(), rig = this.rig, k = L.k;
    for (const r of this.rips) r.age += dt;
    // ---- the water comes out
    let spread;
    if (showing || lingering) spread = Math.max(this.u.uSpread.value, ease.out(ramp(t, 0.55, 2.6)));
    else if (ret) spread = (this.fromSpread || 0) * (1 - ease.inOut(ramp(L.ret, 0.42, 1)));
    else spread = 0;
    this.u.uSpread.value = spread; this.u.uTime.value = t + L.r;
    this.pond.material.visible = spread > 0.002;
    // three drops from under the frame, then one now and then
    if (showing) {
      for (const [i, at, du] of [[0, 0.02, -0.18], [1, 0.3, 0.2], [2, 0.5, 0.02]]) if (this.once('drop' + i, at)) this.dropFrom(L, du);
      if (t > 11 && this.once('drip' + Math.floor(t / 3.1), Math.floor(t / 3.1) * 3.1 + 0.4)) this.dropFrom(L, (L.rand() - 0.5) * 0.7);
    }
    this.stepDrops(L, dt, showing || lingering);
    // ---- the pads drift out, and home again
    const o = this.wo || (this.wo = {});
    for (const p of this.pads) {
      let su, so, yaw;
      if (ret && p.from) {
        const s = ease.inOut(clamp01((L.ret - 0.12 - p.i * 0.025) / 0.68));
        su = p.from[0] + (p.start[0] - p.from[0]) * s; so = p.from[1] + (p.start[1] - p.from[1]) * s; yaw = p.rot1 + (p.rot0 - p.rot1) * s;
        if (s >= 1) { rig.show(p.inst, false); p.shown = false; continue; }
      } else if (showing || lingering) {
        const s = ease.out(clamp01((t - p.ts) / 2.4));
        if (t < p.ts) { if (p.shown) { rig.show(p.inst, false); p.shown = false; } continue; }
        const a = 1 - s, mu = (p.start[0] + p.home[0]) / 2 + p.swing * 0.5, mo = 0.3 + p.home[1] * 0.25;
        su = a * a * p.start[0] + 2 * a * s * mu + s * s * p.home[0]; so = a * a * p.start[1] + 2 * a * s * mo + s * s * p.home[1];
        // and then a slow drift, as on still water
        const dr = clamp01((t - p.ts - 2.4) / 3); su += Math.sin(t * 0.21 + p.ph) * 0.03 * dr; so += Math.cos(t * 0.17 + p.ph) * 0.02 * dr;
        yaw = p.rot0 + (p.rot1 - p.rot0) * s + Math.sin(t * 0.13 + p.ph) * 0.12 * dr;
        if (p.lastS < 0.98 && s >= 0.98 && !L.quiet) { /* settled */ }
        if (Math.floor((t - p.ts) * 3) !== p.wk && s < 0.9) { p.wk = Math.floor((t - p.ts) * 3); if (so > 0) this.ripple(L.floor(su, so, this.v).x, this.v.z, 0.35); }
        p.lastS = s;
      } else { if (p.shown) { rig.show(p.inst, false); p.shown = false; } continue; }
      p.at[0] = su; p.at[1] = so; p.yaw = yaw;
      // nudged by the toy (never solid), and back
      this.push(L, p, dt);
      L.floor(su + p.lo, so + p.lout, this.v);
      this.wave(this.v.x, this.v.z, o);
      p.y = L.y + 0.021 + o.h; p.tx = Math.max(-0.25, Math.min(0.25, o.gx * 0.012)); p.tz = Math.max(-0.25, Math.min(0.25, o.gz * 0.012));
      this.q.setFromEuler(this.e.set(p.tz, 0, -p.tx, 'YXZ')); this.q.multiply(this.qy.setFromAxisAngle(this.w.set(0, 1, 0), yaw));
      p.M.compose(this.v.setY(p.y), this.q, this.s.set(p.r, p.r, p.r));
      rig.mat(p.inst, p.M); if (!p.shown) { rig.show(p.inst, true); p.shown = true; }
    }
    // ---- the flowers: up through the pad, open petal by petal; shut and down when it is time to go
    for (const [j, f] of this.flowers.entries()) {
      const p = this.pads[f.pad];
      let up, open;
      if (ret) { up = 1 - ease.inOut(ramp(L.ret, 0.22, 0.45)); open = (this.flowerK[j] || 0) * (1 - ease.inOut(ramp(L.ret, 0, 0.3))); }
      else if (showing || lingering) { up = ease.outBack(ramp(t, f.tb, f.tb + 0.6)); open = ease.inOut(ramp(t, f.tb + 0.45, f.tb + 1.9)); }
      else up = open = 0;
      f.open = open;
      const vis = up > 0.01 && p.shown;
      rig.show(f.heart, vis); for (const q of f.petals) rig.show(q.inst, vis);
      if (!vis) continue;
      if (showing && this.once('bloom' + j, f.tb + 0.5)) { v.note(f.note, 2.2, { vol: 0.022, type: 'triangle', attack: 0.004 }); v.note(f.note * 1.5, 1.6, { at: 0.09, vol: 0.012, type: 'sine', attack: 0.004 }); v.note(f.note * 2, 1.2, { at: 0.18, vol: 0.01, type: 'sine', attack: 0.004 }); }
      // stand on the pad, rocking with it; a petal's ring opens in turn (outer first), and they breathe a little
      const sway = Math.sin(t * 1.1 + j) * 0.05 + (p.tx + p.tz) * 0.8, bs = up * BLOOM;
      this.m2.compose(this.w.set(f.off[0], 0.005, f.off[1]), this.q.setFromEuler(this.e.set(sway, 0, sway * 0.6, 'YXZ')), this.one);
      for (const q of f.petals) {
        const ko = ease.out(clamp01(open * 1.6 - q.ring * 0.3)), pitch = SHUT + (OPEN[q.ring] - SHUT) * ko + Math.sin(t * 1.4 + q.yaw * 3) * 0.03 * ko + q.d;
        this.local(p, q.yaw, pitch, 0.05 * q.sz * bs, 0);
        rig.mat(q.inst, this.m);
      }
      this.local(p, 0, 0, 0.026 * bs * (0.5 + 0.5 * open), 0.004 * bs); rig.mat(f.heart, this.m);
    }
    // ---- the frog
    this.frogStep(L, dt, showing, lingering, ret);
    // ---- sound: the water lapping, the sonata going round while you look
    const near = Math.max(0, 1 - Math.hypot(k.G.camera.position.x - L.cx, k.G.camera.position.z - L.cz) / 12);
    this.lap.set((showing || lingering ? 0.03 : ret ? 0.03 * (1 - L.ret) : 0) * spread * near * (0.8 + 0.2 * Math.sin(t * 0.9)));
    this.moon.run(showing && t > 3.4, 1);
    v.place();
    // ripples into the shader
    for (let i = 0; i < NR; i++) { const r = this.rips[i]; this.u.uRip.value[i].set(r.x, r.z, r.age, r.amp); }
    this.lastT = t;
  },

  // A part standing on pad p: turned `yaw` on it, pitched up `pitch`, scaled s, lifted y: into this.m.
  local(p, yaw, pitch, s, y) {
    this.q.setFromEuler(this.e.set(pitch, yaw, 0, 'YXZ'));
    this.m.compose(this.w.set(0, y, 0), this.q, this.s.set(s, s, s));
    // (the flower's sway and offset, then the pad's place and tilt, without its size)
    this.m.premultiply(this.m2);
    const P = this.pM || (this.pM = new THREE.Matrix4()), pos = this.pv || (this.pv = new THREE.Vector3()), rot = this.pq || (this.pq = new THREE.Quaternion()), sc = this.ps || (this.ps = new THREE.Vector3());
    p.M.decompose(pos, rot, sc); P.compose(pos, rot, this.one); this.m.premultiply(P);
  },

  // The toy pushes the pads aside (and they drift back); where it drives on the water, rings spread from its wheels.
  push(L, p, dt) {
    const k = L.k, G = k.G, veh = G.vehicle, lo0 = p.lo || 0, lout0 = p.lout || 0;
    let fu = -lo0 * 1.6 - (p.vu || 0) * 1.4, fo = -lout0 * 1.6 - (p.vo || 0) * 1.4;
    if (G.state === 'play' && veh && veh.group.visible && Math.abs(veh.pos.y - L.y) < 0.4) {
      const q = L.local(veh.pos.x, veh.pos.z), du = p.at[0] + lo0 - q.u, dout = p.at[1] + lout0 - q.out, d = Math.hypot(du, dout), reach = p.r + 0.22;
      if (d < reach && d > 1e-3) { const f = (reach - d) / reach * 9; fu += du / d * f; fo += dout / d * f; }
    }
    p.vu = (p.vu || 0) + fu * dt; p.vo = (p.vo || 0) + fo * dt;
    p.lo = lo0 + p.vu * dt; p.lout = lout0 + p.vo * dt;
  },

  dropFrom(L, du) {
    const d = this.drops.find(q => !q.on); if (!d) return;
    L.at(du, L.rail - 0.012 - L.cy, -L.wall + 0.03, this.v);
    d.x = this.v.x; d.y = this.v.y; d.z = this.v.z; d.vx = L.nx * 0.12; d.vz = L.nz * 0.12; d.vy = 0; d.on = true; d.rip = 0.9; d.drop = true;
  },
  splash(L, x, z, n, sp) {
    let c = 0;
    for (const d of this.drops) {
      if (d.on) continue; if (c++ >= n) break;
      const a = L.rand() * Math.PI * 2, s = sp * (0.35 + L.rand() * 0.65);
      d.x = x; d.y = L.y + 0.02; d.z = z; d.vx = Math.cos(a) * s * 0.45; d.vz = Math.sin(a) * s * 0.45; d.vy = s * (1.1 + L.rand() * 0.7); d.on = true; d.rip = 0; d.drop = false;
    }
  },
  stepDrops(L, dt, on) {
    const a = this.spray.geometry.attributes.position.array; let any = false;
    this.drops.forEach((d, i) => {
      if (d.on) {
        d.vy -= 9.8 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; any = true;
        if (d.y <= L.y + 0.01) {
          d.on = false;
          if (d.rip && on) { this.ripple(d.x, d.z, d.rip); this.splash(L, d.x, d.z, 6, 0.55); L.voice().note(1500 + L.rand() * 700, 0.14, { vol: 0.016, type: 'sine', to: 600 }); }
        }
      }
      a[i * 3] = d.x; a[i * 3 + 1] = d.on ? d.y : L.y - 9; a[i * 3 + 2] = d.z;
    });
    this.spray.geometry.attributes.position.needsUpdate = true; this.spray.visible = any;
  },

  // ---------------------------------------------------------------- the frog
  frogOn(L, pi, o) { const p = this.pads[pi]; return o.set(p.M.elements[12], p.y + 0.004, p.M.elements[14]); },
  frogStep(L, dt, showing, lingering, ret) {
    const F = this.frog, rig = this.rig, t = L.t, v = L.voice(), P = F.p, fp = this.pads[FROG_PAD];
    let mode = 'hidden', crouch = 0, legs = 0, pitch = 0, croak = 0, sink = 0;
    const face = this.faceYaw || (this.faceYaw = L.yawOut + 0.35);
    let yaw = face;
    const look = (x, z) => Math.atan2(x - P.x, z - P.z);
    if (showing || lingering) {
      const sw = this.pads[SWIM_PAD];
      if (t < T_JUMP - 0.45 || (t < T_JUMP && fp.shown)) {
        if (!fp.shown) mode = 'hidden';
        else { mode = 'sit'; this.frogOn(L, FROG_PAD, P); yaw = fp.yaw * 0.3 + face; if (t > 3.6 && t < 4.4) croak = Math.sin(clamp01((t - 3.6) / 0.8) * Math.PI); if (this.once('ribbit0', 3.75)) this.ribbit(L); }
        if (t > T_JUMP - 0.45) { crouch = ease.inOut(ramp(t, T_JUMP - 0.45, T_JUMP)); const pl = L.floor(PLOP[0], PLOP[1], this.w); yaw = look(pl.x, pl.z); }
      } else if (t < T_PLOP) {
        // the leap: up and over, legs out behind; a long arc, nose up then down
        const s = (t - T_JUMP) / (T_PLOP - T_JUMP), a = this.frogOn(L, FROG_PAD, this.A), b = L.floor(PLOP[0], PLOP[1], this.B);
        P.lerpVectors(a, b, s); P.y += 4 * 0.34 * s * (1 - s); mode = 'fly'; legs = ease.out(Math.min(1, s * 4)) * (1 - ramp(s, 0.75, 1) * 0.6); pitch = (s - 0.45) * 1.6; yaw = Math.atan2(b.x - a.x, b.z - a.z);
        if (this.once('jump', T_JUMP)) { this.ripple(a.x, a.z, 0.7); v.note(320, 0.09, { vol: 0.02, type: 'triangle', to: 520 }); }
      } else if (t < T_UP) {
        mode = 'hidden';
        if (this.once('plop', T_PLOP)) { const b = L.floor(PLOP[0], PLOP[1], this.w); this.ripple(b.x, b.z, 3.2); this.ripple(b.x, b.z, 1.4); this.rips[this.ri].age = -0.22; this.splash(L, b.x, b.z, 34, 1.15); this.plop(L, 1); }
      } else if (t < T_CLIMB) {
        // eyes up, and a swim to the next pad, a little V of ripples behind
        const s0 = L.floor(SURFACE[0], SURFACE[1], this.A), tgt = sw.shown ? this.frogOn(L, SWIM_PAD, this.B) : this.B.copy(s0), s = ease.inOut(ramp(t, T_SWIM, T_CLIMB));
        const edge = this.E2.lerpVectors(s0, tgt, 0.78);
        P.lerpVectors(s0, edge, s); P.y = L.y - 0.048 * FS + 0.003 * Math.sin(t * 9); mode = 'swim'; sink = 1; yaw = look(tgt.x, tgt.z);
        if (this.once('up', T_UP)) this.ripple(s0.x, s0.z, 0.6);
        if (s > 0 && s < 1 && Math.floor(t * 4) !== this.sk) { this.sk = Math.floor(t * 4); this.ripple(P.x, P.z, 0.32); }
      } else if (!this.hop && t < T_SING + 1.5) {
        const s = ease.out(ramp(t, T_CLIMB, T_CLIMB + 0.3)), b = this.frogOn(L, SWIM_PAD, this.B), a = this.A.lerpVectors(L.floor(SURFACE[0], SURFACE[1], this.E2), b, 0.78);
        a.y = L.y - 0.02; P.lerpVectors(a, b, s); P.y += 4 * 0.05 * s * (1 - s);
        mode = 'sit'; this.frogAt = SWIM_PAD; yaw = s < 1 ? look(b.x, b.z) : face + 0.1;
        if (t > T_SING && t < T_SING + 1) croak = Math.sin((t - T_SING) * Math.PI);
        if (this.once('ribbit1', T_SING + 0.1)) this.ribbit(L);
      } else {
        // while you keep looking: a hop to another pad every seven seconds or so; when the toy comes, a jump clear
        mode = 'sit';
        if (!this.hop) {
          const due = t > T_SING + 1.5 && Math.floor((t - T_SING - 1.5) / 7) !== this.hk;
          const toy = this.toyNear(L, this.frogAt);
          if (due || toy) {
            this.hk = Math.floor((t - T_SING - 1.5) / 7);
            let to = toy ? this.farPad(L) : HOPS[(this.hk + HOPS.length) % HOPS.length]; if (to === this.frogAt) to = HOPS[(this.hk + 1) % HOPS.length];
            this.hop = { from: this.frogAt, to, t0: t, dur: toy ? 0.55 : 0.65 }; this.ripple(P.x, P.z, 0.5);
          }
        }
        if (this.hop) {
          const h = this.hop, s = clamp01((t - h.t0) / h.dur), a = this.frogOn(L, h.from, this.A), b = this.frogOn(L, h.to, this.B);
          P.lerpVectors(a, b, s); P.y += 4 * (0.12 + 0.05 * a.distanceTo(b)) * s * (1 - s); legs = s < 0.8 ? 1 : 0; pitch = (s - 0.5) * 1.2; yaw = Math.atan2(b.x - a.x, b.z - a.z);
          if (s >= 1) { this.frogAt = h.to; this.hop = null; this.ripple(b.x, b.z, 0.55); this.plop(L, 0.35); this.faceYaw = L.yawOut + (L.rand() - 0.5) * 1.2; }
        } else { this.frogOn(L, this.frogAt, P); const k2 = (t - T_SING) % 5.3; croak = k2 < 0.8 ? Math.sin(k2 / 0.8 * Math.PI) * 0.8 : 0; if (k2 >= 0.05 && k2 - dt < 0.05 && showing) this.ribbit(L, 0.6); yaw = face; }
      }
    } else if (ret && this.frogFrom) {
      // a last leap, back to the wall under the frame, and in with a plop
      const s = ease.inOut(clamp01(L.ret / 0.42)), b = L.floor(0.05, -0.02, this.w);
      P.lerpVectors(this.frogFrom, b, s); P.y += 4 * 0.28 * s * (1 - s); mode = s < 1 ? 'fly' : 'hidden'; legs = 1; pitch = (s - 0.4) * 1.5; yaw = Math.atan2(b.x - this.frogFrom.x, b.z - this.frogFrom.z);
      if (s >= 1 && !this.dived) { this.dived = true; this.ripple(b.x, b.z, 1.2); this.plop(L, 0.6); }
    }
    if (!ret) this.dived = false;
    F.yaw = yaw; F.shown = mode !== 'hidden';
    for (const k of ['body', 'legR', 'legL', 'sac']) rig.show(F[k], F.shown);
    if (!F.shown) return;
    // squash in the crouch; legs from folded (0) to stretched out behind (1); the throat swells to croak
    const sy = 1 - 0.22 * crouch, sxz = 1 + 0.08 * crouch;
    this.q.setFromEuler(this.e.set(-pitch, yaw, 0, 'YXZ'));
    this.m.compose(P, this.q, this.s.set(sxz, sy, sxz)); rig.mat(F.body, this.m);
    for (const [side, inst] of [[1, F.legR], [-1, F.legL]]) {
      const hip = this.w.set(side * 0.02 * FS, 0.016 * FS * sy, -0.022 * FS).applyQuaternion(this.q).add(P);
      this.lq.setFromEuler(this.le.set(-legs * 0.5, side * legs * 0.25, 0, 'YXZ'));
      this.m.compose(hip, this.q3.copy(this.q).multiply(this.lq), this.s.set(1, 1 - 0.3 * crouch, 1 + legs * 0.9)); rig.mat(inst, this.m);
    }
    const cs = 0.018 + croak * 0.03;
    this.q.setFromEuler(this.e.set(-pitch, yaw, 0, 'YXZ'));
    this.m.compose(this.w.set(0, 0.022 * FS * sy, 0.044 * FS).applyQuaternion(this.q).add(P), this.q, this.s.set(cs * 1.2, cs, cs)); rig.mat(F.sac, this.m);
    if (sink) rig.show(F.sac, false);
  },
  toyNear(L, pi) {
    const G = L.k.G, veh = G.vehicle; if (!(G.state === 'play' && veh && veh.group.visible) || this.fleeT > L.t) return false;
    const p = this.pads[pi], d = Math.hypot(veh.pos.x - p.M.elements[12], veh.pos.z - p.M.elements[14]);
    if (d < 0.45) { this.fleeT = L.t + 1.4; return true; } return false;
  },
  farPad(L) {
    const veh = L.k.G.vehicle; let best = this.frogAt, bd = -1;
    for (const p of this.pads) { if (!p.shown || p.i === this.frogAt) continue; const d = Math.hypot(veh.pos.x - p.M.elements[12], veh.pos.z - p.M.elements[14]); if (d > bd && d < 2.2) { bd = d; best = p.i; } }
    return best;
  },
  ribbit(L, vol = 1) {
    const v = L.voice();
    for (const [at, f] of [[0, 196], [0.17, 165]]) { v.note(f, 0.09, { at, vol: 0.02 * vol, type: 'square', to: f * 0.8, attack: 0.004 }); v.note(f * 2, 0.07, { at, vol: 0.012 * vol, type: 'sawtooth', to: f * 1.4, attack: 0.004 }); }
  },
  plop(L, k) { const v = L.voice(); v.note(900, 0.16, { vol: 0.04 * k, type: 'sine', to: 170, attack: 0.002 }); v.note(1400, 0.08, { at: 0.03, vol: 0.015 * k, type: 'sine', to: 500 }); L.k.synth.noise(0.25, { vol: 0.03 * k, lp: 2200 }); },
});
