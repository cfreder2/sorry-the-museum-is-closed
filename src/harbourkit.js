// What a harbour has lying about in it in winter, as geometry (lakefront.js places and draws them; harbourplan.js has
// where they are and makes them solid): a mooring can, a cast-iron bollard with snow on its head, and a rowing boat left
// out too late and frozen in, full of snow to the gunwales. Each is one smooth form: lathed, or lofted through stations.
// The cans and the bollards come twice, one to be seen from near and a plain one for far off (harbour.js deals each
// instance into the one or the other as the camera moves), so a harbour full of them is a few thousand triangles.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { noises } from './icelook.js';

const tint = (g, f) => {
  const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const [r, gg, b] = typeof f === 'function' ? f(p.getX(i), p.getY(i), p.getZ(i)) : f; c[i * 3] = r; c[i * 3 + 1] = gg; c[i * 3 + 2] = b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
};
const lathe = (pts, seg = 24, n = 28) => new THREE.LatheGeometry(new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y))).getPoints(n), seg);

export const SNOW = [1, 1, 1];

// The material for the bollards and the boats: lit like everything else, and glowing a little by its own colour as the
// night's snow and ice do, so the snow on them is the snow beside them. Colours are in the vertices (white is snow).
export function kitMaterial(o = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, emissive: new THREE.Color(0.3, 0.36, 0.52), emissiveIntensity: 0.55, ...o });
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'); };
  return m;
}

// ---------------------------------------------------------------- the mooring can
// A steel can buoy: a drum with rounded shoulders, welded round its middle (the seam stands proud), a lifting eye on
// its crown, and on its shoulder the ring the mooring is made fast to, with a stub of chain hanging from it down onto
// the ice. Its middle is at y = 0; it floats (or is frozen in) with the ice 12 cm below that.
const CAN = [[0.3, -0.34], [0.39, -0.27], [0.42, -0.16], [0.42, -0.062], [0.437, -0.048], [0.437, -0.03], [0.42, -0.016], [0.42, 0.2], [0.405, 0.275], [0.35, 0.345], [0.24, 0.395], [0.1, 0.42], [0.0, 0.425]];
const CAN_Y0 = -0.34, CAN_H = 0.77, IRON_V = 0.012;
// (The paint is laid on by height: a vertex's v is how far up the can it is. Its ironwork reads the strip of bare iron along the picture's foot.)
const canUV = (g, iron) => { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) { if (iron) uv.setXY(i, 0.5, IRON_V); else uv.setY(i, (p.getY(i) - CAN_Y0) / CAN_H); } return g; };
export function canGeo(far = false) {
  if (far) return canUV(new THREE.LatheGeometry([[0.4, -0.2], [0.42, 0.2], [0.34, 0.35], [0.0, 0.425]].map(([x, y]) => new THREE.Vector2(x, y)), 7));
  const body = canUV(new THREE.LatheGeometry(CAN.map(([x, y]) => new THREE.Vector2(x, y)), 12));
  const link = () => new THREE.TorusGeometry(0.034, 0.0095, 3, 7).scale(1, 1.45, 1);
  const iron = [new THREE.TorusGeometry(0.06, 0.014, 3, 8).translate(0, 0.46, 0),                                  // the lifting eye
    new THREE.TorusGeometry(0.05, 0.012, 3, 8).rotateX(1.2).translate(0, 0.25, 0.425),                             // the mooring ring, on its lug
    new THREE.BoxGeometry(0.03, 0.05, 0.05).translate(0, 0.292, 0.385)];
  // the chain: links from the ring down the can's side and out over the ice, the last frozen half into it
  [[0, 0.165, 0.455, 0.1, 0], [0, 0.07, 0.47, 0.05, 1.57], [0, -0.03, 0.485, -0.3, 0], [0.01, -0.1, 0.545, -1.3, 1.57], [0.04, -0.118, 0.64, -1.5, 0.4]].forEach(([x, y, z, rx, ry]) => iron.push(link().rotateY(ry).rotateX(rx).translate(x, y, z)));
  return mergeGeometries([body, ...iron.map(g => canUV(g, true))]);
}
// Its paint, once round the can (u) and from its foot to its crown (v): white gone cream, chipped; rust weeping down
// from the seam, the ring's lug and the crown; a stain up from the waterline and a collar of ice frozen on at it; the
// band of colour is left white here and takes each can's own colour in the shader.
let CAN_TEX = null;
function canTexture() {
  if (CAN_TEX) return CAN_TEX;
  const W = 256, H = 128, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  let s = 9173; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646, Y = v => H * (1 - v);
  c.fillStyle = '#e4e0d2'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 500; i++) { const v = r() < 0.5 ? '255,252,240' : '120,112,96'; c.fillStyle = `rgba(${v},${r() * 0.1})`; c.fillRect(r() * W, r() * H, 2 + r() * 10, 1 + r() * 5); }      // weathered
  c.fillStyle = 'rgba(70,52,40,.55)'; c.fillRect(0, Y(0.4) - 1, W, 3); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, Y(0.41) - 1, W, 1);      // the weld
  const streak = (x, v0, len, w, a) => { for (const ox of [-W, 0, W]) { const g = c.createLinearGradient(0, Y(v0), 0, Y(v0 - len)); g.addColorStop(0, `rgba(122,60,24,${a})`); g.addColorStop(0.35, `rgba(140,78,34,${a * 0.6})`); g.addColorStop(1, 'rgba(140,78,34,0)'); c.fillStyle = g; c.fillRect(x + ox - w / 2, Y(v0), w, Y(v0 - len) - Y(v0)); } };
  for (let i = 0; i < 16; i++) streak(r() * W, 0.4, 0.07 + r() * 0.2, 2 + r() * 7, 0.3 + r() * 0.4);                // from the seam
  for (let i = 0; i < 9; i++) streak(r() * W, 0.98, 0.15 + r() * 0.3, 2 + r() * 6, 0.2 + r() * 0.3);                 // from the crown
  for (let i = 0; i < 5; i++) streak((r() - 0.5) * 14, 0.78, 0.2 + r() * 0.3, 3 + r() * 6, 0.45 + r() * 0.3);      // under the ring's lug (u = 0 is the can's +z, where it is)
  for (let i = 0; i < 60; i++) { const x = r() * W, y = r() * H, q = 1 + r() * 3.5; c.fillStyle = `rgba(110,56,26,${0.3 + r() * 0.5})`; c.beginPath(); c.ellipse(x, y, q, q * (0.5 + r()), r() * 3, 0, 7); c.fill(); }      // chips, rusted
  { const g = c.createLinearGradient(0, Y(0.36), 0, Y(0.2)); g.addColorStop(0, 'rgba(58,62,44,0)'); g.addColorStop(1, 'rgba(48,52,40,.8)'); c.fillStyle = g; c.fillRect(0, Y(0.36), W, Y(0.2) - Y(0.36)); }      // the waterline's stain
  for (let x = 0; x < W; x += 3) { const top = 0.3 + r() * 0.035; c.fillStyle = `rgba(232,240,250,${0.75 + r() * 0.25})`; c.fillRect(x, Y(top), 3, Y(0.2) - Y(top)); }      // ice frozen on where it meets the sheet
  c.fillStyle = '#3a2c24'; c.fillRect(0, H - 4, W, 4);                                                               // bare iron: the eye, the ring, the chain
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  return (CAN_TEX = t);
}
// Each can's band is its instance colour. Rime has built up on the side the wind is from, and snow sits on its crown.
export function canMaterial() {
  const m = new THREE.MeshStandardMaterial({ map: canTexture(), roughness: 0.62, metalness: 0.1, emissive: 0xffffff, emissiveIntensity: 1 });
  const u = { uCanN: { value: noises() } };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCanN;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        { vec3 cn = objectNormal;
          #ifdef USE_INSTANCING
            cn = mat3(instanceMatrix) * cn;
          #endif
          vCanN = normalize(mat3(modelMatrix) * cn); }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uCanN;\nvarying vec3 vCanN;')
      .replace('#include <color_fragment>', `
        { float band = smoothstep(0.455, 0.47, vMapUv.y) * (1.0 - smoothstep(0.6, 0.615, vMapUv.y)) * step(0.05, vMapUv.y);
          #ifdef USE_COLOR
            diffuseColor.rgb *= mix(vec3(1.0), vColor.rgb, band * 0.94);
          #endif
          vec3 cn = normalize(vCanN); float grain = texture2D(uCanN, vMapUv * vec2(3.0, 1.5)).b;
          float rime = smoothstep(0.45, 1.0, dot(cn, vec3(0.2425, 0.0, -0.9701)) + (grain - 0.5) * 0.9) * step(0.05, vMapUv.y);
          float cap = smoothstep(0.5, 0.82, cn.y + (grain - 0.5) * 0.25);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88, 0.92, 0.98), max(cap, rime * 0.7)); }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n\troughnessFactor = mix(roughnessFactor, 0.95, smoothstep(0.6, 0.9, diffuseColor.b));')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance = diffuseColor.rgb * vec3(0.19, 0.225, 0.325);');
  };
  return m;
}

// ---------------------------------------------------------------- the bollard
// A waisted iron post with a mushroom head, 34 cm tall, and the snow that sits on it.
export function bollardGeo(far = false) {
  if (far) return mergeGeometries([tint(new THREE.LatheGeometry([[0.11, 0], [0.08, 0.2], [0.132, 0.285]].map(([x, y]) => new THREE.Vector2(x, y)), 5), [0.06, 0.065, 0.08]),
    tint(new THREE.LatheGeometry([[0.14, 0.29], [0.115, 0.355], [0.0, 0.384]].map(([x, y]) => new THREE.Vector2(x, y)), 5), SNOW)]);
  const iron = tint(lathe([[0.12, 0], [0.12, 0.025], [0.09, 0.045], [0.078, 0.12], [0.078, 0.2], [0.088, 0.245], [0.13, 0.27], [0.135, 0.3], [0.1, 0.33], [0.0, 0.34]], 12, 14), [0.06, 0.065, 0.08]);
  const snow = tint(lathe([[0.137, 0.292], [0.142, 0.315], [0.12, 0.35], [0.06, 0.378], [0.0, 0.384]], 12, 5), SNOW);
  return mergeGeometries([iron, snow]);
}

// ---------------------------------------------------------------- the boat
// A clinker dinghy, 2.7 m, lofted through stations from the transom (u = 0) to the stem (u = 1), heaped with snow to
// just under the gunwale. It lies along z, bow to +z, its keel on y = 0. `hull`: its paint.
export function boatGeo(hull = [0.1, 0.24, 0.2]) {
  const LEN = 2.7, B = 0.56, D = 0.46, NS = 14, NT = 6, P = [], C = [], I = [];
  const beam = u => B * (u < 0.45 ? 0.76 + 0.24 * Math.sin(u / 0.45 * Math.PI / 2) : Math.pow(Math.cos((u - 0.45) / 0.55 * Math.PI / 2), 0.62));
  const keel = u => 0.03 * Math.pow(1 - u, 4) + 0.2 * Math.pow(u, 3.2), sheer = u => D * (1 + 0.55 * (u - 0.4) * (u - 0.4));
  const pt = (u, t, side) => { const b = Math.max(0.012, beam(u)), k = keel(u), s = sheer(u); return [side * b * Math.pow(Math.sin(t * Math.PI / 2), 0.72), k + (s - k) * Math.pow(1 - Math.cos(t * Math.PI / 2), 0.9), (u - 0.5) * LEN]; };
  const wood = [0.34, 0.22, 0.12], strake = [0.82, 0.84, 0.8];
  const grid = (rows, cols, at, col, flip) => { const o = P.length / 3; for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) { P.push(...at(i / rows, j / cols)); C.push(...col(i / rows, j / cols)); }
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const a = o + i * (cols + 1) + j, b = a + 1, c = a + cols + 1, d = c + 1; if (flip) I.push(a, b, c, b, d, c); else I.push(a, c, b, b, c, d); } };
  // the hull, from the port gunwale down round the keel and up to the starboard one; the planks told apart by their tone
  grid(NS, NT * 2, (u, v) => { const t = Math.abs(v * 2 - 1); return pt(u, t, v < 0.5 ? -1 : 1); }, (u, v) => { const t = Math.abs(v * 2 - 1); if (t > 0.8) return strake; const k = 0.82 + 0.3 * ((Math.round(t * NT) % 2) ? 1 : 0.4); return hull.map(c => c * k); }, false);
  // the gunwale: a rail of bare wood standing a little proud, inboard and out
  grid(NS, 2, (u, v) => { const [x, y, z] = pt(u, 1, -1); return [x * (1.03 - 0.1 * v), y + (v === 0.5 ? 0.022 : 0), z]; }, () => wood, true);
  grid(NS, 2, (u, v) => { const [x, y, z] = pt(u, 1, 1); return [x * (1.03 - 0.1 * v), y + (v === 0.5 ? 0.022 : 0), z]; }, () => wood, false);
  // the snow in her: heaped a little in the middle, to just under the rail
  grid(NS, 6, (u, v) => { const b = Math.max(0.012, beam(u)) * 0.95, x = (v * 2 - 1) * b, uu = Math.min(1, u * 1.02); return [x, sheer(u) - 0.012 + 0.06 * (1 - (x / b) * (x / b)) * Math.sin(Math.PI * uu), (u - 0.5) * LEN]; }, () => SNOW, true);
  // the transom
  grid(NT, 2, (t, v) => { const [x, y, z] = pt(0, t, 1); return [x * (v * 2 - 1), y, z]; }, t => (t > 0.8 ? strake : hull), true);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- near and far
// sets: [{ near, far: InstancedMesh, items: [{ x, z, M: Matrix4, col?: Color }], R2 }]. Each item goes into the near
// mesh if the camera (x, y, z) is within R of it, the far one if not. Only what has changed is written.
export function dealLOD(sets, x, y, z) {
  for (const g of sets) {
    let n = 0, f = 0;
    for (const it of g.items) {
      const near = (it.x - x) ** 2 + (it.z - z) ** 2 + y * y < g.R2, m = near ? g.near : g.far, i = near ? n++ : f++, was = m.userData.dealt || (m.userData.dealt = []);
      if (was[i] === it) continue;
      was[i] = it; m.setMatrixAt(i, it.M); if (it.col) m.setColorAt(i, it.col); m.userData.dirty = true;
    }
    for (const [m, c] of [[g.near, n], [g.far, f]]) {
      if (m.count !== c) { m.count = c; m.userData.dirty = true; if (m.userData.dealt) m.userData.dealt.length = c; }
      if (m.userData.dirty) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.computeBoundingSphere(); m.userData.dirty = false; }
    }
  }
}
