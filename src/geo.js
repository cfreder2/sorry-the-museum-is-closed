// A small builder of flat-sided geometry: quads and boxes, with normals, UVs and optional colour.

import * as THREE from 'three';

export class Geo {
  constructor() { this.p = []; this.n = []; this.uv = []; this.idx = []; this.c = []; this.col = null; }
  // Corners in order round the quad; `n` is the side it should face.
  quad(a, b, c, d, n, uv = [[0, 0], [1, 0], [1, 1], [0, 1]]) {
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0];
    let v = [a, b, c, d], t = uv;
    if (cx * n[0] + cy * n[1] + cz * n[2] < 0) { v = [a, d, c, b]; t = [uv[0], uv[3], uv[2], uv[1]]; }
    const i = this.p.length / 3;
    for (let k = 0; k < 4; k++) { this.p.push(...v[k]); this.n.push(...n); this.uv.push(...t[k]); if (this.col) this.c.push(...this.col); }
    this.idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
  }
  box(x0, x1, y0, y1, z0, z1, s = 1) {
    const dx = (x1 - x0) / s, dy = (y1 - y0) / s, dz = (z1 - z0) / s;
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], [[0, 0], [dx, 0], [dx, dy], [0, dy]]);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1], [[0, 0], [dx, 0], [dx, dy], [0, dy]]);
    this.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0], [[0, 0], [dz, 0], [dz, dy], [0, dy]]);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], [[0, 0], [dz, 0], [dz, dy], [0, dy]]);
    this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], [[0, 0], [dx, 0], [dx, dz], [0, dz]]);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], [[0, 0], [dx, 0], [dx, dz], [0, dz]]);
  }
  // A box described relative to a point on a wall: along the wall, up, and out from it.
  wallBox(at, nx, nz, u0, u1, y0, y1, d0, d1) {
    const horiz = nz !== 0;
    const a = horiz ? at.z + nz * d0 : at.x + nx * d0, b = horiz ? at.z + nz * d1 : at.x + nx * d1;
    const lo = Math.min(a, b), hi = Math.max(a, b);
    if (horiz) this.box(at.x + u0, at.x + u1, at.y + y0, at.y + y1, lo, hi);
    else this.box(lo, hi, at.y + y0, at.y + y1, at.z + u0, at.z + u1);
  }
  get empty() { return this.idx.length === 0; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    if (this.c.length) g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.idx);
    return g;
  }
  mesh(mat) { const m = new THREE.Mesh(this.build(), mat); m.matrixAutoUpdate = false; return m; }
}
