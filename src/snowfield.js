// The snow on the land (land.js): wherever the open ground is not flat, the snow is drawn from the land itself, over
// every 2 m cell of its grid that is not level. It lies over the flat sheet (museum.js; the sheet runs on under it, out
// of sight: the land is never below the street) and wins where the two meet at street level, with the sheet's own
// texture at the sheet's own scale, so there is no seam.
//
// What is drawn is what the wheels are on. The land has swells tens of metres long and drifts and banks half a metre
// across, so each cell is drawn as finely as its own shape needs: 1 m where it is smooth, 50 cm on a drift, 25 cm
// (the drifts' own grid) on the steep face of one and on the bank beside a path; never more than a centimetre off the
// height the car is given. Where a fine cell meets a coarser one its edge is drawn as the coarser one draws it, so
// there is no crack. In blocks of 32 m, so what is off screen is not drawn; and a block more than BACK metres off is
// drawn at 1 m throughout (nothing is driving on it), a tenth of the triangles.

import * as THREE from 'three';
import { STEP, FINE, landAt } from './land.js';
import { snowLook } from './finish.js';

const B = 16;                     // cells to a block, each way
const BACK = 40;                  // metres: beyond this a block is drawn at 1 m
const TOL = 0.01;                 // metres: the most a cell's drawing may differ from the land
const Y = -0.03;                  // the snow is drawn this far below what the wheels are on, as the flat sheet is

export function buildSnowfield(museum, ground) {
  const L = museum.plan.land; if (!L || !L.top) return null;
  const geo = ground.geometry; geo.computeBoundingBox();
  const bb = geo.boundingBox, w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y, gx = ground.position.x, gz = ground.position.z;     // (the sheet's own mapping: u along x, v up its local y, which is -z)
  const mat = ground.material.clone(); mat.polygonOffset = true; mat.polygonOffsetFactor = -0.5; mat.polygonOffsetUnits = -0.5;
  // A park lamp's pool of light is a flat disc drawn 4 cm over the street (butlerfield.js). Where a bank or a drift
  // stands up through that disc, the disc is hidden and the snow would stand dark in the middle of the light: so the
  // land's own material adds the same light, from a small map of the lamps, to whatever of it is above the disc.
  const lampU = { uLampMap: { value: new THREE.DataTexture(new Uint8Array([0]), 1, 1, THREE.RedFormat) }, uLampB: { value: new THREE.Vector4(0, 0, 1, 1) }, uLampC: { value: new THREE.Color(0, 0, 0) } };
  lampU.uLampMap.value.needsUpdate = true;
  snowLook(mat);
  { const prev = mat.onBeforeCompile;
    mat.onBeforeCompile = (sh, r) => {
      prev.call(mat, sh, r); Object.assign(sh.uniforms, lampU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vLandY;').replace('#include <project_vertex>', '#include <project_vertex>\nvLandY = (modelMatrix * vec4(transformed, 1.0)).y;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uLampMap;\nuniform vec4 uLampB;\nuniform vec3 uLampC;\nvarying float vLandY;')
        .replace('#include <opaque_fragment>', 'outgoingLight += uLampC * (texture2D(uLampMap, (vSnowW - uLampB.xy) * uLampB.zw).r * smoothstep(0.034, 0.044, vLandY));\n#include <opaque_fragment>');
    };
    mat.customProgramCacheKey = () => 'snowlook-land'; }
  const lampLight = (lamps, R, colour) => {             // lamps: [[x, z]]; R: the pool's radius; colour: its light at the foot of the lamp
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const [x, z] of lamps) { x0 = Math.min(x0, x - R - 1); x1 = Math.max(x1, x + R + 1); z0 = Math.min(z0, z - R - 1); z1 = Math.max(z1, z + R + 1); }
    const S = 0.5, W = Math.ceil((x1 - x0) / S), H = Math.ceil((z1 - z0) / S), d = new Uint8Array(W * H);
    for (const [x, z] of lamps) { const i0 = Math.max(0, Math.floor((x - R - x0) / S)), i1 = Math.min(W - 1, Math.ceil((x + R - x0) / S)), j0 = Math.max(0, Math.floor((z - R - z0) / S)), j1 = Math.min(H - 1, Math.ceil((z + R - z0) / S));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const v = 1 - Math.hypot(x0 + (i + 0.5) * S - x, z0 + (j + 0.5) * S - z) / R; if (v > 0) d[j * W + i] = Math.min(255, d[j * W + i] + Math.round(v * 255)); } }
    const t = new THREE.DataTexture(d, W, H, THREE.RedFormat); t.minFilter = t.magFilter = THREE.LinearFilter; t.unpackAlignment = 1; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
    lampU.uLampMap.value.dispose(); lampU.uLampMap.value = t; lampU.uLampB.value.set(x0, z0, 1 / (W * S), 1 / (H * S)); lampU.uLampC.value.copy(colour);
  };
  const { X0, Z0, nx, nz, cells } = L, F = L.fine, R = Math.round(STEP / FINE), hAt = (x, z) => landAt(L, x, z);
  // How finely each cell must be drawn: 2, 4 or 8 to a side. A cell drawn at 1 m is wrong by what the drifts' grid
  // differs from the mean of its neighbours two points off; at 50 cm, of those next to it.
  const kOf = new Uint8Array(nx * nz), tol = TOL / (F ? F.q : 1);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    if (!cells[j * nx + i]) continue;
    let K = 2;
    if (F) {
      const i0 = Math.round((X0 + i * STEP - F.X0) / FINE), j0 = Math.round((Z0 + j * STEP - F.Z0) / FINE), M = F.nx + 1, g = F.h;
      if (i0 >= 2 && j0 >= 2 && i0 + R + 2 <= F.nx && j0 + R + 2 <= F.nz) {
        let e4 = 0, e2 = 0;
        for (let b = j0; b <= j0 + R; b++) for (let a = i0, k = b * M + i0; a <= i0 + R; a++, k++) {
          const v = g[k]; let e = Math.abs(v - (g[k - 2] + g[k + 2]) / 2); if (e > e4) e4 = e; e = Math.abs(v - (g[k - 2 * M] + g[k + 2 * M]) / 2); if (e > e4) e4 = e;
          e = Math.abs(v - (g[k - 1] + g[k + 1]) / 2); if (e > e2) e2 = e; e = Math.abs(v - (g[k - M] + g[k + M]) / 2); if (e > e2) e2 = e;
        }
        K = e4 < tol ? 2 : e2 < tol ? 4 : 8;
      }
    }
    kOf[j * nx + i] = K;
  }
  const kAt = (i, j) => i < 0 || j < 0 || i >= nx || j >= nz ? 0 : kOf[j * nx + i];
  const blocks = [], W8 = nx * R + 1;
  for (let bj = 0; bj < nz; bj += B) for (let bi = 0; bi < nx; bi += B) {
    // One block, drawn `fine` (each cell as it needs) or not (1 m throughout).
    const make = fine => {
      const pos = [], nor = [], uv = [], idx = [], at = new Map(), hs = new Map();
      const H = (I, J) => { const k = J * W8 + I; let v = hs.get(k); if (v === undefined) { v = hAt(X0 + I * FINE, Z0 + J * FINE); hs.set(k, v); } return v; };
      // The height drawn at a point of the 25 cm lattice: the land's, but along the edge between two cells no finer
      // than the coarser of them draws it (and along the edge of the block, as the 1 m drawing has it).
      const drawn = (I, J) => {
        const ex = I % R === 0, ez = J % R === 0;
        if (!fine || ex === ez) return H(I, J);                        // a corner, or inside a cell
        const ci = Math.floor(I / R), cj = Math.floor(J / R);
        let k;
        if (ex) k = ci % B === 0 ? 2 : Math.min(kAt(ci - 1, cj) || 8, kAt(ci, cj) || 8); else k = cj % B === 0 ? 2 : Math.min(kAt(ci, cj - 1) || 8, kAt(ci, cj) || 8);
        const st = R / k, t = ex ? J : I, t0 = Math.floor(t / st) * st; if (t0 === t) return H(I, J);
        const f = (t - t0) / st; return ex ? H(I, t0) * (1 - f) + H(I, t0 + st) * f : H(t0, J) * (1 - f) + H(t0 + st, J) * f;
      };
      const vert = (I, J, e) => {
        const k = J * W8 + I; let v = at.get(k); if (v !== undefined) return v;
        v = pos.length / 3; at.set(k, v);
        const x = X0 + I * FINE, z = Z0 + J * FINE;
        pos.push(x, drawn(I, J) + Y, z);
        const dx = (hAt(x + e, z) - hAt(x - e, z)) / (2 * e), dz = (hAt(x, z + e) - hAt(x, z - e)) / (2 * e), l = Math.hypot(dx, 1, dz);
        nor.push(-dx / l, 1 / l, -dz / l);
        uv.push((x - gx) / w + 0.5, (gz - z) / h + 0.5);
        return v;
      };
      for (let j = bj; j < Math.min(nz, bj + B); j++) for (let i = bi; i < Math.min(nx, bi + B); i++) {
        const K = fine ? kOf[j * nx + i] : cells[j * nx + i] ? 2 : 0; if (!K) continue;
        const st = R / K, e = Math.max(0.2, STEP / K / 2);
        for (let b = 0; b < K; b++) for (let a = 0; a < K; a++) {
          const I = i * R + a * st, J = j * R + b * st, p = vert(I, J, e), q = vert(I + st, J, e), r = vert(I, J + st, e), t = vert(I + st, J + st, e);
          if ((a + b) & 1) idx.push(p, r, t, p, t, q); else idx.push(p, r, q, q, r, t);      // (the diagonals turned about, so no grain shows in the drifts)
        }
      }
      if (!idx.length) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'land';
      return m;
    };
    const far = make(false); if (!far) continue;
    let allTwo = true; for (let j = bj; j < Math.min(nz, bj + B) && allTwo; j++) for (let i = bi; i < Math.min(nx, bi + B); i++) if (kOf[j * nx + i] > 2) { allTwo = false; break; }
    if (allTwo) { museum.group.add(far); blocks.push(far); continue; }       // smooth all over: one drawing does for near and far
    const near = make(true), c = far.geometry.boundingSphere.center, lod = new THREE.LOD();
    lod.position.set(c.x, 0, c.z); lod.matrixAutoUpdate = false; lod.updateMatrix(); lod.name = 'land';
    for (const m of [near, far]) { m.position.set(-c.x, 0, -c.z); m.updateMatrix(); }
    lod.addLevel(near, 0); lod.addLevel(far, BACK);
    museum.group.add(lod); blocks.push(lod);
  }
  return { mat, blocks, lampLight };
}
