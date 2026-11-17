// Clay. Sculpture is modelled the way a sculptor builds up a figure: lumps pressed together so
// they run into one another, and hollows scooped out. Each lump is a distance field; they are
// blended on a grid and the surface is then skinned (surface nets) into an ordinary mesh.
//
// The mesh carries its own shading in its vertex colours: crevices dark, shoulders light, a little
// moonlight from one side, and snow lying on whatever faces the sky. So a bronze reads as a bronze
// at night, when almost nothing in the scene is lit.

import * as THREE from 'three';

const smin = (a, b, k) => { if (k <= 0) return a < b ? a : b; const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const lin = hex => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const M = new THREE.Matrix4(), E = new THREE.Euler();

export class Clay {
  // lo, hi: the box the piece is modelled in, in metres. cell: how fine the grid is.
  constructor(lo, hi, cell) {
    this.o = lo; this.cell = cell;
    this.nx = Math.ceil((hi[0] - lo[0]) / cell) + 1; this.ny = Math.ceil((hi[1] - lo[1]) / cell) + 1; this.nz = Math.ceil((hi[2] - lo[2]) / cell) + 1;
    this.f = new Float32Array(this.nx * this.ny * this.nz).fill(9);
    this.pad = Math.max(0.12, cell * 5);         // how far round each lump the field is filled in
    this.k = 0.08;                               // how readily lumps run together, unless told otherwise
  }

  // Press a lump in (or, with cut, scoop one out) wherever fn says the distance to it is.
  _put(c, reach, o, fn) {
    const { cell, nx, ny, nz, f } = this, org = this.o, k = o.k ?? this.k, cut = !!o.cut, m = k + (cut ? cell * 2 : this.pad);
    const lim = (v, a, n, up) => Math.max(0, Math.min(n - 1, up ? Math.ceil((v - org[a]) / cell) : Math.floor((v - org[a]) / cell)));
    const i0 = lim(c[0] - reach - m, 0, nx), i1 = lim(c[0] + reach + m, 0, nx, 1), j0 = lim(c[1] - reach - m, 1, ny), j1 = lim(c[1] + reach + m, 1, ny, 1), k0 = lim(c[2] - reach - m, 2, nz), k1 = lim(c[2] + reach + m, 2, nz, 1);
    for (let kk = k0; kk <= k1; kk++) for (let j = j0; j <= j1; j++) {
      let q = i0 + nx * (j + ny * kk);
      const y = org[1] + j * cell, z = org[2] + kk * cell;
      for (let i = i0; i <= i1; i++, q++) {
        const d = fn(org[0] + i * cell, y, z), a = f[q];
        f[q] = cut ? -smin(-a, d, k) : smin(a, d, k);
      }
    }
    return this;
  }
  _frame(c, rot) {
    if (!rot) return null;
    const e = M.makeRotationFromEuler(E.set(rot[0], rot[1], rot[2])).elements;
    // rows of the inverse (the transpose): world offset -> the lump's own axes
    return [e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10]];
  }

  // A ball, or an egg with three radii, turned any way.
  blob(c, r, o = {}) {
    const R = typeof r === 'number' ? [r, r, r] : r, big = Math.max(R[0], R[1], R[2]), fr = this._frame(c, o.rot);
    const ix = 1 / R[0], iy = 1 / R[1], iz = 1 / R[2];
    return this._put(c, big, o, (x, y, z) => {
      let px = x - c[0], py = y - c[1], pz = z - c[2];
      if (fr) { const a = px * fr[0] + py * fr[1] + pz * fr[2], b = px * fr[3] + py * fr[4] + pz * fr[5], cc = px * fr[6] + py * fr[7] + pz * fr[8]; px = a; py = b; pz = cc; }
      const ax = px * ix, ay = py * iy, az = pz * iz, k0 = Math.sqrt(ax * ax + ay * ay + az * az);
      if (k0 < 1e-6) return -Math.min(R[0], R[1], R[2]);
      const bx = ax * ix, by = ay * iy, bz = az * iz, k1 = Math.sqrt(bx * bx + by * by + bz * bz);
      return k0 * (k0 - 1) / k1;
    });
  }
  // A limb: a rod from a to b, as thick as ra at one end and rb at the other.
  limb(a, b, ra, rb = ra, o = {}) {
    const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2], bb = bx * bx + by * by + bz * bz || 1e-9;
    const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    return this._put(c, Math.sqrt(bb) / 2 + Math.max(ra, rb), o, (x, y, z) => {
      const px = x - a[0], py = y - a[1], pz = z - a[2], h = Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / bb));
      const dx = px - bx * h, dy = py - by * h, dz = pz - bz * h;
      return Math.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * h);
    });
  }
  // A block with its corners rounded off.
  slab(c, half, round = 0.02, o = {}) {
    const fr = this._frame(c, o.rot), hx = half[0] - round, hy = half[1] - round, hz = half[2] - round;
    return this._put(c, Math.hypot(half[0], half[1], half[2]), o, (x, y, z) => {
      let px = x - c[0], py = y - c[1], pz = z - c[2];
      if (fr) { const a = px * fr[0] + py * fr[1] + pz * fr[2], b = px * fr[3] + py * fr[4] + pz * fr[5], cc = px * fr[6] + py * fr[7] + pz * fr[8]; px = a; py = b; pz = cc; }
      const qx = Math.abs(px) - hx, qy = Math.abs(py) - hy, qz = Math.abs(pz) - hz;
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - round;
    });
  }
  // A ring, lying flat unless turned.
  ring(c, R, r, o = {}) {
    const fr = this._frame(c, o.rot);
    return this._put(c, R + r, o, (x, y, z) => {
      let px = x - c[0], py = y - c[1], pz = z - c[2];
      if (fr) { const a = px * fr[0] + py * fr[1] + pz * fr[2], b = px * fr[3] + py * fr[4] + pz * fr[5], cc = px * fr[6] + py * fr[7] + pz * fr[8]; px = a; py = b; pz = cc; }
      return Math.hypot(Math.hypot(px, pz) - R, py) - r;
    });
  }

  _at(x, y, z) {                                  // the field anywhere, between the grid points
    const { cell, nx, ny, nz, f, o } = this, gx = (x - o[0]) / cell, gy = (y - o[1]) / cell, gz = (z - o[2]) / cell;
    if (gx < 0 || gy < 0 || gz < 0 || gx >= nx - 1 || gy >= ny - 1 || gz >= nz - 1) return 9;
    const i = gx | 0, j = gy | 0, k = gz | 0, tx = gx - i, ty = gy - j, tz = gz - k, q = i + nx * (j + ny * k), s = nx * ny;
    const a = f[q] + (f[q + 1] - f[q]) * tx, b = f[q + nx] + (f[q + nx + 1] - f[q + nx]) * tx, c = f[q + s] + (f[q + s + 1] - f[q + s]) * tx, d = f[q + s + nx] + (f[q + s + nx + 1] - f[q + s + nx]) * tx;
    return (a + (b - a) * ty) + ((c + (d - c) * ty) - (a + (b - a) * ty)) * tz;
  }

  // Skin it. hi and lo are the colour of the metal where it is rubbed and where it is not;
  // snow is how flat a surface must be to hold snow (0 for none).
  mesh({ hi = 0x7fc7b4, lo = 0x1f4f46, snow = 0.72, sun = [0.5, 0.62, -0.6], reach = 0.22 } = {}) {
    const { cell, nx, ny, nz, f, o } = this, s = nx * ny, id = new Int32Array(nx * ny * nz).fill(-1);
    const P = [], I = [];
    for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const q = i + nx * (j + ny * k);
      const v = [f[q], f[q + 1], f[q + nx], f[q + nx + 1], f[q + s], f[q + s + 1], f[q + s + nx], f[q + s + nx + 1]];
      let mask = 0;
      for (let c = 0; c < 8; c++) if (v[c] < 0) mask |= 1 << c;
      if (mask === 0 || mask === 255) continue;
      let px = 0, py = 0, pz = 0, n = 0;
      for (let c = 0; c < 8; c++) for (let b = 1; b < 8; b <<= 1) {
        if (c & b) continue;
        const d = c | b;
        if ((v[c] < 0) === (v[d] < 0)) continue;
        const t = v[c] / (v[c] - v[d]);
        px += (c & 1) + (b === 1 ? t : 0); py += ((c >> 1) & 1) + (b === 2 ? t : 0); pz += ((c >> 2) & 1) + (b === 4 ? t : 0); n++;
      }
      id[q] = P.length / 3;
      P.push(o[0] + (i + px / n) * cell, o[1] + (j + py / n) * cell, o[2] + (k + pz / n) * cell);
    }
    const quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) I.push(a, c, b, a, d, c); else I.push(a, b, c, a, c, d); };
    for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
      const q = i + nx * (j + ny * k), in0 = f[q] < 0;
      if (in0 !== (f[q + 1] < 0)) quad(id[q - nx - s], id[q - s], id[q], id[q - nx], !in0);
      if (in0 !== (f[q + nx] < 0)) quad(id[q - 1 - s], id[q - 1], id[q], id[q - s], !in0);
      if (in0 !== (f[q + s] < 0)) quad(id[q - 1 - nx], id[q - nx], id[q], id[q - 1], !in0);
    }
    const nv = P.length / 3, N = new Float32Array(nv * 3), C = new Float32Array(nv * 3), H = lin(hi), L = lin(lo), e = cell * 0.9;
    const sl = Math.hypot(sun[0], sun[1], sun[2]);
    for (let v = 0; v < nv; v++) {
      const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
      let gx = this._at(x + e, y, z) - this._at(x - e, y, z), gy = this._at(x, y + e, z) - this._at(x, y - e, z), gz = this._at(x, y, z + e) - this._at(x, y, z - e);
      const gl = Math.hypot(gx, gy, gz) || 1; gx /= gl; gy /= gl; gz /= gl;
      N[v * 3] = gx; N[v * 3 + 1] = gy; N[v * 3 + 2] = gz;
      // How shut in is this point? Walk out along the normal and see how soon something else is met.
      let occ = 0;
      for (const [h, w] of [[reach * 0.3, 1.5], [reach * 0.65, 1], [reach, 0.6]]) occ += Math.max(0, h - Math.min(h, this._at(x + gx * h, y + gy * h, z + gz * h))) / h * w;
      const open = Math.max(0, 1 - occ * 0.55), lam = Math.max(0, (gx * sun[0] + gy * sun[1] + gz * sun[2]) / sl), lit = (0.5 + 0.5 * lam) * (0.35 + 0.65 * open), t = Math.pow(open, 1.5) * (0.55 + 0.45 * lam);
      let r = (L[0] + (H[0] - L[0]) * t) * lit, g = (L[1] + (H[1] - L[1]) * t) * lit, b = (L[2] + (H[2] - L[2]) * t) * lit;
      if (snow && gy > snow && open > 0.5) {
        const k = Math.min(1, (gy - snow) / (1 - snow) * 2.2) * Math.min(1, (open - 0.5) * 4), w = 0.55 + 0.3 * lam;
        r += (w * 0.9 - r) * k; g += (w * 0.94 - g) * k; b += (w * 1.05 - b) * k;
      }
      C[v * 3] = r; C[v * 3 + 1] = g; C[v * 3 + 2] = b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(C, 3));
    geo.setIndex(nv > 65535 ? new THREE.BufferAttribute(new Uint32Array(I), 1) : I);
    return geo;
  }
}

// Metal that shows the shading it was cast with: lit a little by whatever lamp is about, and
// otherwise glowing faintly in its own painted colours, as everything outdoors does here.
export function cast(o = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.25, emissive: 0xffffff, emissiveIntensity: 0.62, ...o });
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'); };
  return m;
}
