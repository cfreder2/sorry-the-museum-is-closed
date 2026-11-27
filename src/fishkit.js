// The fish of the harbour, built once for the ice fishing here (src/icefish.js) and for the ponds on the Moon (src/moonbase.js).
// buildKind(name) makes a kind's geometry and skins; new Fish(kit, kind, rng) one fish that swims (its body bends in the vertex
// shader). Lengths in metres; the body runs along x, head to +x.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const canvas = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const rng = s => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const lerp = (a, b, t) => a + (b - a) * t;
// A smooth curve through keys [s, value] (s from 0 at the snout to 1 at the root of the tail).
const curve = keys => s => { for (let i = 1; i < keys.length; i++) if (s <= keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i], t = (s - a) / (b - a), e = t * t * (3 - 2 * t); return lerp(va, vb, e); } return keys[keys.length - 1][1]; };

// ---------------------------------------------------------------- the fish
// Two kinds that really are caught through the ice off Chicago, and a third that nobody has caught there before: pale, and
// softly luminous, a green-white like the mice's (and, it turns out, the Moon's).
export const KINDS = {
  perch: {
    len: 0.24, top: curve([[0, 0.01], [0.06, 0.07], [0.18, 0.125], [0.34, 0.15], [0.5, 0.135], [0.7, 0.09], [0.86, 0.055], [1, 0.05]]),
    bot: curve([[0, -0.012], [0.06, -0.06], [0.2, -0.095], [0.38, -0.105], [0.55, -0.095], [0.72, -0.07], [0.88, -0.05], [1, -0.045]]),
    wid: curve([[0, 0.005], [0.08, 0.05], [0.22, 0.075], [0.4, 0.078], [0.6, 0.06], [0.82, 0.03], [1, 0.016]]),
    back: '#39461d', side: '#c8ac38', belly: '#efe6c6', bars: 7, fin: '#8a8a3a', low: '#e0662a',
    dorsal: [[0.3, 0.5, 0.42, true], [0.56, 0.74, 0.34, false]], tail: 0.36, eye: 0.13,
  },
  smelt: {
    len: 0.17, top: curve([[0, 0.006], [0.07, 0.05], [0.25, 0.075], [0.5, 0.08], [0.75, 0.06], [0.9, 0.04], [1, 0.035]]),
    bot: curve([[0, -0.012], [0.07, -0.045], [0.3, -0.07], [0.55, -0.068], [0.78, -0.05], [0.92, -0.035], [1, -0.032]]),
    wid: curve([[0, 0.004], [0.1, 0.035], [0.35, 0.045], [0.65, 0.04], [0.88, 0.022], [1, 0.012]]),
    back: '#4a6a62', side: '#c9d6d6', belly: '#f4f6f4', bars: 0, stripe: '#9fd0c8', fin: '#9fb0aa', low: '#c8d4d0',
    dorsal: [[0.45, 0.6, 0.3, false]], tail: 0.4, eye: 0.16,
  },
  glow: {
    len: 0.2, top: curve([[0, 0.008], [0.07, 0.06], [0.25, 0.095], [0.48, 0.1], [0.72, 0.07], [0.9, 0.045], [1, 0.04]]),
    bot: curve([[0, -0.012], [0.07, -0.055], [0.3, -0.085], [0.55, -0.08], [0.78, -0.055], [0.92, -0.04], [1, -0.036]]),
    wid: curve([[0, 0.004], [0.1, 0.04], [0.35, 0.055], [0.65, 0.048], [0.88, 0.025], [1, 0.014]]),
    back: '#bfe8d2', side: '#e6fbef', belly: '#f8fffa', bars: 0, stripe: '#a8ffcf', fin: '#c4ffdc', low: '#dcffe9',
    dorsal: [[0.36, 0.62, 0.5, false]], tail: 0.48, eye: 0.15, glow: true,
  },
};

function skin(K) {
  return canvas(256, 128, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, K.back); g.addColorStop(0.32, K.side); g.addColorStop(0.62, K.side); g.addColorStop(0.8, K.belly); g.addColorStop(1, K.belly);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const r = rng(K.bars * 31 + 7);
    // scales: rows of small arcs, catching the light
    c.strokeStyle = 'rgba(255,250,220,.13)'; c.lineWidth = 1;
    for (let y = 6; y < h * 0.85; y += 5) for (let x = 40 + (y % 10); x < w - 6; x += 7) { c.beginPath(); c.arc(x, y, 3, Math.PI * 0.6, Math.PI * 1.4); c.stroke(); }
    // the perch's dark saddles, wide on the back and narrowing down the flank
    for (let i = 0; i < K.bars; i++) {
      const x = w * (0.3 + i * 0.62 / K.bars) + (r() - 0.5) * 6, bw = 9 + r() * 6, deep = h * (0.52 + r() * 0.12);
      c.fillStyle = 'rgba(28,36,12,.62)'; c.beginPath(); c.moveTo(x - bw, 0); c.lineTo(x + bw, 0); c.quadraticCurveTo(x + bw * 0.5, deep * 0.6, x + 2, deep); c.quadraticCurveTo(x - bw * 0.6, deep * 0.6, x - bw, 0); c.fill();
    }
    if (K.stripe) { c.fillStyle = K.stripe; c.globalAlpha = 0.8; c.fillRect(w * 0.18, h * 0.44, w * 0.82, 5); c.globalAlpha = 1; }
    // the head: darker above, the gill cover's curve behind it
    const hg = c.createLinearGradient(0, 0, w * 0.22, 0); hg.addColorStop(0, 'rgba(30,30,20,.35)'); hg.addColorStop(1, 'rgba(30,30,20,0)'); c.fillStyle = hg; c.fillRect(0, 0, w * 0.22, h);
    c.strokeStyle = 'rgba(40,40,20,.55)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(w * 0.2, h * 0.18); c.quadraticCurveTo(w * 0.25, h * 0.55, w * 0.18, h * 0.86); c.stroke();
    c.strokeStyle = 'rgba(255,250,230,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(w * 0.21, h * 0.2); c.quadraticCurveTo(w * 0.26, h * 0.55, w * 0.19, h * 0.84); c.stroke();
    // the lateral line
    c.strokeStyle = 'rgba(30,30,20,.3)'; c.beginPath(); c.moveTo(w * 0.22, h * 0.3); c.quadraticCurveTo(w * 0.6, h * 0.22, w, h * 0.42); c.stroke();
  });
}
// Fin membrane: rays fanning out from the base, a little see-through.
function finSkin(color) {
  return canvas(64, 64, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.fillStyle = color; c.globalAlpha = 0.55; c.fillRect(0, 0, w, h); c.globalAlpha = 1;
    c.strokeStyle = 'rgba(255,255,240,.5)'; c.lineWidth = 1.2; for (let x = 2; x < w; x += 5) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + (x - w / 2) * 0.2, 0); c.stroke(); }
  });
}

// A flat fin in the body's own plane (z = 0), from its outline, with ray-mapped uvs.
function flatFin(outline) {
  const g = new THREE.ShapeGeometry(new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y))));
  const P = g.attributes.position, U = g.attributes.uv; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let i = 0; i < P.count; i++) { x0 = Math.min(x0, P.getX(i)); x1 = Math.max(x1, P.getX(i)); y0 = Math.min(y0, P.getY(i)); y1 = Math.max(y1, P.getY(i)); }
  for (let i = 0; i < P.count; i++) U.setXY(i, (P.getX(i) - x0) / (x1 - x0 || 1), (P.getY(i) - y0) / (y1 - y0 || 1));
  return g;
}

export function buildKind(name) {
  const K = KINDS[name], L = K.len, N = 30, R = 16, pos = [], uv = [], idx = [];
  const X = s => L * (0.5 - s);
  // The body: an ellipse at each step along it, its top and bottom where the profile says.
  for (let i = 0; i <= N; i++) {
    const s = i / N, t = K.top(s), b = K.bot(s), wd = K.wid(s), mid = (t + b) / 2, half = (t - b) / 2;
    for (let j = 0; j <= R; j++) {
      const a = (j / R) * Math.PI * 2, sa = Math.sin(a), ca = Math.cos(a);
      pos.push(X(s), mid + half * sa, wd * ca);
      uv.push(s, (sa + 1) / 2);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < R; j++) { const a = i * (R + 1) + j, b = a + R + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const body = new THREE.BufferGeometry(); body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); body.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); body.setIndex(idx); body.computeVertexNormals();
  // (the profiles are in metres for a 24 cm fish; a smaller kind is scaled whole below)
  const sc = L / 0.24; body.scale(1, sc, sc);
  // Fins.
  const fins = [], low = [], tailX = X(1), tb = K.top(1) * sc, bb = K.bot(1) * sc;
  // the tail: forked, two lobes
  const tl = K.tail * L;
  fins.push(flatFin([[tailX + 0.01, tb * 0.8], [tailX - tl * 0.55, tb + tl * 0.55], [tailX - tl, tb + tl * 0.62], [tailX - tl * 0.62, (tb + bb) / 2], [tailX - tl, bb - tl * 0.62], [tailX - tl * 0.55, bb - tl * 0.55], [tailX + 0.01, bb * 0.8]]));
  for (const [s0, s1, hgt, spiny] of K.dorsal) {
    const x0 = X(s0), x1 = X(s1), y0 = K.top(s0) * sc - 0.004, y1 = K.top(s1) * sc - 0.004, H = hgt * L * 0.3;
    const out = [[x0, y0]]; const n = spiny ? 9 : 6;
    for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(x0, x1, t), y = lerp(y0, y1, t), hh = H * (spiny ? Math.sin(Math.min(1, t * 1.6 + 0.15) * Math.PI * 0.75) : (1 - t * 0.6)); out.push([x, y + hh * (spiny && i % 2 ? 0.8 : 1)]); }
    out.push([x1, y1]); fins.push(flatFin(out));
  }
  // anal and pelvic fins (the perch's are orange), pectorals behind the gills, angled out
  { const s0 = 0.62, s1 = 0.78, x0 = X(s0), x1 = X(s1), y0 = K.bot(s0) * sc + 0.003, y1 = K.bot(s1) * sc + 0.003, H = 0.1 * L;
    low.push(flatFin([[x0, y0], [x0 - 0.01 * sc, y0 - H], [x1, y1 - H * 0.4], [x1, y1]])); }
  for (const side of [-1, 1]) {
    const s = 0.3, x = X(s), y = K.bot(s) * sc + 0.004, H = 0.12 * L;
    const g = flatFin([[x, y], [x - H * 0.6, y - H], [x - H * 1.1, y - H * 0.8], [x - H * 0.4, y]]); g.translate(-x, -y, 0); g.rotateX(side * 0.6); g.translate(x, y, side * K.wid(s) * sc * 0.6); low.push(g);
    const s2 = 0.22, x2 = X(s2), y2 = lerp(K.top(s2), K.bot(s2), 0.62) * sc, H2 = 0.15 * L;
    const p = flatFin([[x2, y2], [x2 - H2, y2 + H2 * 0.35], [x2 - H2 * 1.05, y2 - H2 * 0.25], [x2, y2 - H2 * 0.3]]); p.translate(-x2, -y2, 0); p.rotateX(side * 1.2); p.rotateY(side * -0.5); p.translate(x2, y2, side * K.wid(s2) * sc * 0.95); fins.push(p);
  }
  // Eyes: a dark pupil in a gold ring, either side.
  const eyes = [], s = K.eye, ex = X(s), ey = lerp(K.top(s), K.bot(s), 0.35) * sc, ez = K.wid(s) * sc * 0.82;
  for (const side of [-1, 1]) { const ring = new THREE.SphereGeometry(0.011 * sc, 10, 8); ring.scale(1, 1, 0.5); ring.translate(ex, ey, side * ez); eyes.push(ring); }
  const pupils = []; for (const side of [-1, 1]) { const p = new THREE.SphereGeometry(0.0065 * sc, 8, 6); p.translate(ex, ey, side * (ez + 0.004 * sc)); pupils.push(p); }
  return { K, body, fins: mergeGeometries(fins), low: mergeGeometries(low), eyes: mergeGeometries(eyes), pupils: mergeGeometries(pupils), skin: skin(K), finT: finSkin(K.fin), lowT: finSkin(K.low) };
}

// Swimming: the body bends in a wave that grows towards the tail (the vertex shader), each fish its own clock.
export function swimmer(mat, u) {
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = 'uniform float uT; uniform float uAmp; uniform float uLen;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      { float s = clamp((uLen * 0.5 - transformed.x) / uLen, 0.0, 1.0); float w = s * s * 0.9 + s * 0.1;
        transformed.z += sin(uT - s * 4.2) * uAmp * w * uLen; transformed.x -= abs(sin(uT - s * 4.2)) * uAmp * w * uLen * 0.25; }`);
  };
  mat.customProgramCacheKey = () => 'swimmer';
  return mat;
}

export class Fish {
  constructor(kit, kind, r) {
    const B = kit[kind], u = this.u = { uT: { value: r() * 10 }, uAmp: { value: 0.12 }, uLen: { value: B.K.len } };
    this.kind = kind; this.len = B.K.len * (0.85 + r() * 0.35);
    const g = this.g = new THREE.Group();
    const glow = !!B.K.glow, gl = glow ? new THREE.Color(0.62, 1, 0.74) : 0xffffff;      // (the glowing one lights itself, a soft green-white: no light is added for it)
    const bodyM = swimmer(new THREE.MeshStandardMaterial({ map: B.skin, roughness: 0.45, metalness: 0.15, emissive: gl, emissiveMap: B.skin, emissiveIntensity: glow ? 0.95 : 0.16 }), u);
    const finM = swimmer(new THREE.MeshStandardMaterial({ map: B.finT, transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 0.6, emissive: gl, emissiveMap: B.finT, emissiveIntensity: glow ? 1.1 : 0.16 }), u);
    const lowM = swimmer(new THREE.MeshStandardMaterial({ map: B.lowT, transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 0.6, emissive: gl, emissiveMap: B.lowT, emissiveIntensity: glow ? 1.1 : 0.2 }), u);
    const ringM = swimmer(new THREE.MeshStandardMaterial({ color: glow ? 0xd8ffe8 : 0xd9a830, roughness: 0.3, metalness: 0.4, emissive: glow ? 0x7adca0 : 0x6a4a10, emissiveIntensity: 0.6 }), u);
    const pupM = swimmer(new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.2 }), u);
    g.add(new THREE.Mesh(B.body, bodyM), new THREE.Mesh(B.fins, finM), new THREE.Mesh(B.low, lowM), new THREE.Mesh(B.eyes, ringM), new THREE.Mesh(B.pupils, pupM));
    g.scale.setScalar(this.len / B.K.len);
    this.p = new THREE.Vector3(); this.v = new THREE.Vector3(); this.to = new THREE.Vector3(); this.yaw = r() * 6.28; this.pitch = 0;
    this.state = 'cruise'; this.t = 0; this.wary = 0; this.mood = r();
  }
}

