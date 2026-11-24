// What a harbour has lying about in it in winter, as geometry (lakefront.js places and draws them; harbourplan.js has
// where they are and makes them solid): a mooring can, a cast-iron bollard with snow on its head, and a rowing boat left
// out too late and frozen in, full of snow to the gunwales. Each is one smooth form: lathed, or lofted through stations.
// Colours are in the vertices (white is snow), so each kind is one mesh, or one instanced mesh, in one material.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const tint = (g, f) => {
  const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const [r, gg, b] = typeof f === 'function' ? f(p.getX(i), p.getY(i), p.getZ(i)) : f; c[i * 3] = r; c[i * 3 + 1] = gg; c[i * 3 + 2] = b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
};
const lathe = (pts, seg = 24, n = 28) => new THREE.LatheGeometry(new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y))).getPoints(n), seg);

export const SNOW = [1, 1, 1];

// The material for all of it: lit like everything else, and glowing a little by its own colour as the night's snow
// and ice do (lakefront.js's slabs do the same), so snow on them is the snow beside them.
export function kitMaterial(o = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, emissive: new THREE.Color(0.3, 0.36, 0.52), emissiveIntensity: 0.55, ...o });
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'); };
  return m;
}

// A mooring can: a fat drum with rounded shoulders and a ring on top to pick it up by. Its middle is at the waterline.
// (The band of colour round it is a mesh of its own: lakefront.js.)
export function canGeo() {
  const body = lathe([[0.3, -0.34], [0.4, -0.25], [0.42, -0.1], [0.42, 0.2], [0.395, 0.3], [0.3, 0.375], [0.15, 0.415], [0.05, 0.425], [0.0, 0.426]], 16, 13);
  const ring = new THREE.TorusGeometry(0.075, 0.017, 5, 10).translate(0, 0.48, 0);
  return mergeGeometries([body, ring]);
}

// A bollard: a waisted iron post with a mushroom head, 34 cm tall, and the snow that sits on it.
export function bollardGeo() {
  const iron = tint(lathe([[0.12, 0], [0.12, 0.025], [0.09, 0.045], [0.078, 0.12], [0.078, 0.2], [0.088, 0.245], [0.13, 0.27], [0.135, 0.3], [0.1, 0.33], [0.0, 0.34]], 12, 16), [0.06, 0.065, 0.08]);
  const snow = tint(lathe([[0.137, 0.292], [0.142, 0.315], [0.12, 0.35], [0.06, 0.378], [0.0, 0.384]], 12, 6), SNOW);
  return mergeGeometries([iron, snow]);
}

// A clinker dinghy, 2.7 m, lofted through stations from the transom (u = 0) to the stem (u = 1), heaped with snow to
// just under the gunwale. It lies along z, bow to +z, its keel on y = 0. `hull`: its paint.
export function boatGeo(hull = [0.1, 0.24, 0.2]) {
  const LEN = 2.7, B = 0.56, D = 0.46, NS = 22, NT = 8, P = [], C = [], I = [];
  const beam = u => B * (u < 0.45 ? 0.76 + 0.24 * Math.sin(u / 0.45 * Math.PI / 2) : Math.pow(Math.cos((u - 0.45) / 0.55 * Math.PI / 2), 0.62));
  const keel = u => 0.03 * Math.pow(1 - u, 4) + 0.2 * Math.pow(u, 3.2), sheer = u => D * (1 + 0.55 * (u - 0.4) * (u - 0.4));
  const pt = (u, t, side) => { const b = Math.max(0.012, beam(u)), k = keel(u), s = sheer(u); return [side * b * Math.pow(Math.sin(t * Math.PI / 2), 0.72), k + (s - k) * Math.pow(1 - Math.cos(t * Math.PI / 2), 0.9), (u - 0.5) * LEN]; };
  const wood = [0.34, 0.22, 0.12], strake = [0.82, 0.84, 0.8];
  const grid = (rows, cols, at, col, flip) => { const o = P.length / 3; for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) { P.push(...at(i / rows, j / cols)); C.push(...col(i / rows, j / cols)); }
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const a = o + i * (cols + 1) + j, b = a + 1, c = a + cols + 1, d = c + 1; if (flip) I.push(a, b, c, b, d, c); else I.push(a, c, b, b, c, d); } };
  // the hull, from the port gunwale down round the keel and up to the starboard one; the planks told apart by their tone
  grid(NS, NT * 2, (u, v) => { const t = Math.abs(v * 2 - 1); return pt(u, t, v < 0.5 ? -1 : 1); }, (u, v) => { const t = Math.abs(v * 2 - 1); if (t > 0.86) return strake; const k = 0.82 + 0.3 * ((Math.round(t * NT) % 2) ? 1 : 0.4); return hull.map(c => c * k); }, false);
  // the gunwale: a rail of bare wood standing a little proud, inboard and out
  grid(NS, 2, (u, v) => { const [x, y, z] = pt(u, 1, -1); return [x * (1.03 - 0.1 * v), y + (v === 0.5 ? 0.022 : 0), z]; }, () => wood, true);
  grid(NS, 2, (u, v) => { const [x, y, z] = pt(u, 1, 1); return [x * (1.03 - 0.1 * v), y + (v === 0.5 ? 0.022 : 0), z]; }, () => wood, false);
  // the snow in her: heaped a little in the middle, to just under the rail
  grid(NS, 8, (u, v) => { const b = Math.max(0.012, beam(u)) * 0.95, x = (v * 2 - 1) * b, uu = Math.min(1, u * 1.02); return [x, sheer(u) - 0.012 + 0.06 * (1 - (x / b) * (x / b)) * Math.sin(Math.PI * uu), (u - 0.5) * LEN]; }, () => SNOW, true);
  // the transom
  grid(NT, 2, (t, v) => { const [x, y, z] = pt(0, t, 1); return [x * (v * 2 - 1), y, z]; }, t => (t > 0.86 ? strake : hull), true);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals();
  return g;
}
