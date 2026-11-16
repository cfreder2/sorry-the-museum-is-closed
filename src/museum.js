// Builds the building from the plan, hangs the collection in it, and runs the
// one piece of magic: the picture lamps that come on as you arrive.

import * as THREE from 'three';
import * as TX from './textures.js';
import { T, RW, RD, LEN, HW, SPRING, VAULT_R, CORR, wallPoint, hang, heightOf, roomAt } from './plan.js';
import { imageUrl } from './collection.js';

// ---------------------------------------------------------------- geometry --

class Geo {
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

const WARM = new THREE.Color(1.0, 0.8, 0.56);

// Specks (dust, snow) that thin out with distance instead of piling up into a
// bright smear when a hundred of them land on the same few pixels.
function motes(color, size, alpha, near, far, additive) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color }, uSize: { value: size }, uAlpha: { value: alpha }, uFade: { value: new THREE.Vector2(near, far) } },
    vertexShader: `uniform float uSize; uniform vec2 uFade; varying float vA;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); float d = -mv.z;
        float px = uSize * projectionMatrix[1][1] * 400.0 / max(d, 0.05);
        vA = (1.0 - smoothstep(uFade.x, uFade.y, d)) * min(1.0, px);   // sub-pixel specks dim rather than clamp
        gl_PointSize = clamp(px, 1.0, 14.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uAlpha; varying float vA;
      void main() { vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.15, length(c)); gl_FragColor = vec4(uColor, a * vA * uAlpha); }`,
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}
const P3 = (x, y, z) => [x, y, z];

// ------------------------------------------------------------------ frames --
//
// A frame is built as rings of moulding, each a different width, depth and
// tone, so it has a profile that catches the lamp. Which one a picture gets
// depends on when and where it was painted, as it would in a museum.

const TONE = {
  gold: [0.8, 0.6, 0.24], pale: [0.9, 0.76, 0.42], deep: [0.56, 0.4, 0.14], cove: [0.34, 0.24, 0.085],
  ebony: [0.045, 0.04, 0.038], ebony2: [0.1, 0.09, 0.08], walnut: [0.24, 0.13, 0.07], oak: [0.42, 0.28, 0.15],
  white: [0.86, 0.84, 0.78], linen: [0.72, 0.68, 0.58], red: [0.36, 0.09, 0.06], brass: [0.6, 0.47, 0.2],
};

function frameStyle(work, mini) {
  if (mini) return 'box';
  const year = +(/(\d{4})/.exec(work.d || '') || [])[1] || 1800, h = work.id % 7;
  if (/pointill/i.test(work.s || '') || /Seurat|Signac/.test(work.a || '')) return 'white';      // as Seurat wanted them
  if (year < 1520) return h % 2 ? 'tabernacle' : 'gothic';
  if (year < 1700) return year >= 1600 && h < 3 ? 'ebony' : h === 6 ? 'walnut' : 'baroque';
  if (year < 1840) return h < 4 ? 'neoclassical' : 'baroque';
  if (year < 1905) return h === 0 ? 'walnut' : h < 4 ? 'salon' : h === 6 ? 'oak' : 'neoclassical';
  return h < 3 ? 'modern' : 'oak';
}

function buildFrame(g, p, style) {
  const hw = p.w / 2, hh = p.h / 2, f = p.frame;
  const at = { x: p.x - p.nx * 0.04, y: p.y, z: p.z - p.nz * 0.04 };
  const box = (u0, u1, y0, y1, d, tone) => { g.col = TONE[tone]; g.wallBox(at, p.nx, p.nz, u0, u1, y0, y1, 0, d); };
  // A ring of moulding from `a` to `b` out from the picture's edge, standing `d` off the wall.
  const ring = (a, b, d, tone) => {
    box(-hw - b, hw + b, hh + a, hh + b, d, tone); box(-hw - b, hw + b, -hh - b, -hh - a, d, tone);
    box(-hw - b, -hw - a, -hh - a, hh + a, d, tone); box(hw + a, hw + b, -hh - a, hh + a, d, tone);
  };
  // Carved lumps at the corners and the middle of each rail.
  const ornaments = (r, size, d, tone, centres) => {
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) box(sx * (hw + r) - size, sx * (hw + r) + size, sy * (hh + r) - size, sy * (hh + r) + size, d, tone);
    if (!centres) return;
    for (const sy of [-1, 1]) box(-size * 1.5, size * 1.5, sy * (hh + r) - size * 0.8, sy * (hh + r) + size * 0.8, d, tone);
    for (const sx of [-1, 1]) box(sx * (hw + r) - size * 0.8, sx * (hw + r) + size * 0.8, -size * 1.5, size * 1.5, d, tone);
  };
  let W = f;
  switch (style) {
    case 'baroque':
      ring(0, 0.12 * W, 0.034, 'pale'); ring(0.12 * W, 0.42 * W, 0.02, 'cove'); ring(0.42 * W, 0.86 * W, 0.066, 'gold'); ring(0.86 * W, W, 0.046, 'deep');
      ornaments(0.64 * W, 0.3 * W, 0.082, 'pale', true); break;
    case 'salon':
      ring(0, 0.1 * W, 0.03, 'pale'); ring(0.1 * W, 0.36 * W, 0.018, 'cove'); ring(0.36 * W, 0.9 * W, 0.058, 'gold'); ring(0.9 * W, W, 0.04, 'deep');
      ornaments(0.66 * W, 0.24 * W, 0.07, 'pale', p.w > 0.9); break;
    case 'neoclassical':
      W *= 0.8; ring(0, 0.15 * W, 0.03, 'pale'); ring(0.15 * W, 0.68 * W, 0.042, 'gold'); ring(0.68 * W, 0.74 * W, 0.064, 'pale'); ring(0.74 * W, W, 0.056, 'deep'); break;
    case 'ebony':
      W *= 0.78; ring(0, 0.1 * W, 0.03, 'pale'); ring(0.1 * W, 0.4 * W, 0.044, 'ebony'); ring(0.4 * W, 0.47 * W, 0.054, 'ebony2'); ring(0.47 * W, 0.82 * W, 0.046, 'ebony'); ring(0.82 * W, W, 0.062, 'ebony2'); break;
    case 'walnut':
      W *= 0.8; ring(0, 0.14 * W, 0.03, 'pale'); ring(0.14 * W, 0.56 * W, 0.048, 'walnut'); ring(0.56 * W, 0.63 * W, 0.058, 'oak'); ring(0.63 * W, W, 0.05, 'walnut'); break;
    case 'white':
      W *= 0.92; ring(0, 0.08 * W, 0.056, 'linen'); ring(0.08 * W, W, 0.05, 'white'); break;
    case 'modern':
      W = Math.max(0.022, W * 0.34); ring(0, W, 0.05, p.work.id % 2 ? 'ebony' : 'pale'); break;
    case 'oak':
      W *= 0.62; ring(0, 0.2 * W, 0.03, 'linen'); ring(0.2 * W, W, 0.046, 'oak'); break;
    case 'gothic':
      W *= 0.9; ring(0, 0.16 * W, 0.026, 'red'); ring(0.16 * W, 0.9 * W, 0.052, 'gold'); ring(0.9 * W, W, 0.064, 'deep'); break;
    case 'tabernacle': {
      // An altarpiece's little building: pilasters, a ledge underneath, a cornice on top.
      W *= 0.82; ring(0, 0.16 * W, 0.026, 'red'); ring(0.16 * W, W, 0.05, 'gold');
      box(-hw - 1.3 * W, hw + 1.3 * W, -hh - 1.5 * W, -hh - W, 0.085, 'deep'); box(-hw - 1.15 * W, hw + 1.15 * W, -hh - 1.75 * W, -hh - 1.5 * W, 0.06, 'gold');
      box(-hw - 1.2 * W, hw + 1.2 * W, hh + W, hh + 1.35 * W, 0.075, 'gold'); box(-hw - 1.4 * W, hw + 1.4 * W, hh + 1.35 * W, hh + 1.55 * W, 0.1, 'pale'); break;
    }
    default:        // the miniature rooms: a dark box with a brass edge
      ring(0, 0.25 * f, 0.075, 'brass'); ring(0.25 * f, f, 0.07, 'ebony');
  }
  g.col = null;
}

// The lamp does not simply come on. It catches, twice, like a tube warming up.
function flicker(e) {
  if (e < 0) return 0;
  if (e < 0.05) return 0.8;
  if (e < 0.13) return 0.08;
  if (e < 0.2) return 0.65;
  if (e < 0.29) return 0.2;
  const t = Math.min(1, (e - 0.29) / 0.7);
  return 0.55 + 0.45 * t * t * (3 - 2 * t);
}

export class Museum {
  constructor(plan, collection, mirror, maxAniso) {
    this.plan = plan;
    this.collection = collection;
    this.group = new THREE.Group();
    this.rooms = {};
    this.time = 0;
    this.onWake = null;         // (art, roomId) each time a lamp catches
    this.onRoomLit = null;      // (roomId) the first time a room is entered
    this.maxAniso = maxAniso;
    this.loading = 0;
    this.textures = { wallGlow: TX.wallGlow() };
    this.mirror = mirror;
    this._buildShell(mirror);
    this._buildHall();
    this._buildArt();
    this._buildFurniture();
    this._buildStunts();
    this.group.updateMatrixWorld(true);
  }

  // ------------------------------------------------------------------ shell --

  _buildShell(mirror) {
    const { plan } = this;
    const portals = new Geo();
    const stone = new Geo(), slate = new Geo();
    const ceilings = new Geo(), lay = new Geo();
    const woodTex = TX.wood();
    this.floors = [];

    for (const r of plan.rooms) {
      const walls = new Geo(), trim = new Geo();
      for (const w of plan.walls.filter(w => w.room === r)) {
        if (r.kind === 'hall' && w.side === 'e') continue;        // the east end is glass
        const q = (u0, u1, y0, y1) => walls.quad(
          Object.values(wallPoint(w, u0, y0)), Object.values(wallPoint(w, u1, y0)),
          Object.values(wallPoint(w, u1, y1)), Object.values(wallPoint(w, u0, y1)),
          [w.nx, 0, w.nz], [[u0 / 3, y0 / r.h], [u1 / 3, y0 / r.h], [u1 / 3, y1 / r.h], [u0 / 3, y1 / r.h]]);
        for (const s of w.segs) {
          q(s.lo, s.hi, 0, r.h);
          if (r.kind !== 'corridor') {
            const at = wallPoint(w, (s.lo + s.hi) / 2, 0), half = (s.hi - s.lo) / 2;
            trim.wallBox(at, w.nx, w.nz, -half, half, 0, 0.24, 0, 0.035);
            trim.wallBox(at, w.nx, w.nz, -half, half, r.h - 0.34, r.h, 0, 0.14);
            trim.wallBox(at, w.nx, w.nz, -half, half, r.h - 0.46, r.h - 0.34, 0, 0.06);
          }
        }
        for (const o of w.openings) q(o.lo, o.hi, o.h, r.h);
      }
      const tint = new THREE.Color(r.tint);
      const wallMat = new THREE.MeshStandardMaterial({
        color: tint, roughness: 0.94, metalness: 0,
        emissive: tint.clone().lerp(WARM, 0.35), emissiveMap: this.textures.wallGlow, emissiveIntensity: 0,
      });
      const trimMat = new THREE.MeshStandardMaterial({ color: 0xb9ae9b, roughness: 0.8, emissive: new THREE.Color(0.75, 0.62, 0.45), emissiveIntensity: 0 });
      this.group.add(walls.mesh(wallMat));
      if (!trim.empty) this.group.add(trim.mesh(trimMat));
      this.rooms[r.id] = { room: r, wallMat, trimMat, wake: 0, lit: false, arts: [], frameMats: [] };

      // Floors and ceilings.
      const fq = (g, x0, x1, z0, z1, s) => g.quad(P3(x0, 0, z0), P3(x1, 0, z0), P3(x1, 0, z1), P3(x0, 0, z1), [0, 1, 0],
        [[x0 / s, z0 / s], [x1 / s, z0 / s], [x1 / s, z1 / s], [x0 / s, z1 / s]]);
      if (r.kind === 'gallery') {
        const fl = new Geo();
        fq(fl, r.x0, r.x1, r.z0, r.z1, 1.7);
        const fm = mirror.patch(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.55, emissiveMap: woodTex, emissive: new THREE.Color(1, 0.86, 0.7), emissiveIntensity: 0.02 }), [0.02, 0.5]);
        this.floors.push(fl.mesh(fm));
        this.rooms[r.id].floorMat = fm;
        ceilings.quad(P3(r.x0, r.h, r.z0), P3(r.x1, r.h, r.z0), P3(r.x1, r.h, r.z1), P3(r.x0, r.h, r.z1), [0, -1, 0]);
        const m = 3.2;
        lay.quad(P3(r.x0 + m, r.h - 0.03, r.z0 + m), P3(r.x1 - m, r.h - 0.03, r.z0 + m), P3(r.x1 - m, r.h - 0.03, r.z1 - m), P3(r.x0 + m, r.h - 0.03, r.z1 - m), [0, -1, 0]);
      } else if (r.kind === 'hall') {
        fq(stone, r.x0, r.x1, r.z0, r.z1, 1.3);
      } else {
        fq(slate, r.x0, r.x1, r.z0, r.z1, 1.6);
        ceilings.quad(P3(r.x0, r.h, r.z0), P3(r.x1, r.h, r.z0), P3(r.x1, r.h, r.z1), P3(r.x0, r.h, r.z1), [0, -1, 0]);
      }
    }

    // Doorways: stone surround right through the wall, and a threshold.
    for (const d of plan.doors) {
      const j = 0.3, p = 0.07;
      if (d.along === 'z') {
        portals.box(d.x0 - j, d.x0, 0, d.h, d.z0 - p, d.z1 + p);
        portals.box(d.x1, d.x1 + j, 0, d.h, d.z0 - p, d.z1 + p);
        portals.box(d.x0 - j - 0.08, d.x1 + j + 0.08, d.h, d.h + 0.36, d.z0 - p - 0.03, d.z1 + p + 0.03);
      } else {
        portals.box(d.x0 - p, d.x1 + p, 0, d.h, d.z0 - j, d.z0);
        portals.box(d.x0 - p, d.x1 + p, 0, d.h, d.z1, d.z1 + j);
        portals.box(d.x0 - p - 0.03, d.x1 + p + 0.03, d.h, d.h + 0.36, d.z0 - j - 0.08, d.z1 + j + 0.08);
      }
      const g = d.id.startsWith('C-') ? slate : stone, s = g === slate ? 1.6 : 1.3;
      g.quad(P3(d.x0, 0, d.z0), P3(d.x1, 0, d.z0), P3(d.x1, 0, d.z1), P3(d.x0, 0, d.z1), [0, 1, 0],
        [[d.x0 / s, d.z0 / s], [d.x1 / s, d.z0 / s], [d.x1 / s, d.z1 / s], [d.x0 / s, d.z1 / s]]);
    }
    // Faintly self-lit, so a doorway always reads as a doorway in the dark.
    this.group.add(portals.mesh(new THREE.MeshStandardMaterial({ color: 0xa69c8a, roughness: 0.75, emissive: 0x8a7f6c, emissiveIntensity: 0.07 })));

    const floorMat = (map, rough, k, glow) => mirror.patch(new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: 0, emissiveMap: map, emissive: new THREE.Color(0.55, 0.66, 1), emissiveIntensity: glow }), k);
    this.floors.push(
      stone.mesh(floorMat(TX.marble(), 0.35, [0.04, 0.62], 0.05)),
      slate.mesh(floorMat(TX.slate(), 0.4, [0.05, 0.6], 0.03)),
    );
    this.group.add(...this.floors);

    // Gallery ceilings glow a little with their rooms; the passage's stays black.
    this.ceilMat = new THREE.MeshStandardMaterial({ color: 0x3a3632, roughness: 1, emissive: 0x6b5a45, emissiveIntensity: 0.03 });
    this.group.add(ceilings.mesh(this.ceilMat));
    this.group.add(lay.mesh(new THREE.MeshBasicMaterial({ map: TX.laylight(), color: new THREE.Color(0.34, 0.4, 0.56) })));

    // The number over each door, as the museum numbers them.
    const signs = new THREE.Group();
    for (const d of plan.doors) {
      if (d.a !== 'hall' && d.a !== 'C') continue;
      const set = this.collection.rooms[d.b];
      const isHall = d.a === 'hall';
      const title = isHall ? (set ? set.gallery : 'Gallery') : 'Miniature Rooms';
      const sub = isHall ? (set && set.names.length ? set.names.join('  ·  ') : '') : 'Gallery 11';
      const mat = new THREE.MeshBasicMaterial({ map: TX.sign(title, sub), transparent: true, depthWrite: false, color: new THREE.Color(0.95, 0.95, 0.95) });
      const w = isHall ? 6.2 : 2.8, h = w * 192 / 1024;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      const cx = (d.x0 + d.x1) / 2;
      if (isHall) {
        const north = d.z1 <= 0;
        m.position.set(cx, d.h + 0.36 + 0.75, north ? -HW + 0.03 : HW - 0.03);
        m.rotation.y = north ? 0 : Math.PI;
      } else {
        m.position.set(cx, d.h + 0.36 + 0.36, d.z1 + 0.03);   // inside the gallery, over the low door
      }
      signs.add(m);
    }
    this.group.add(signs);
  }

  // ------------------------------------------------------------------- hall --

  _buildHall() {
    const R = VAULT_R;
    // Glass barrel vault.
    const vault = new Geo();
    const na = 18;
    for (let i = 0; i < na; i++) {
      const a0 = Math.PI * i / na, a1 = Math.PI * (i + 1) / na, am = (a0 + a1) / 2;
      const pt = (x, a) => [x, SPRING + R * Math.sin(a), -R * Math.cos(a)];
      const v0 = R * a0 / 2.45, v1 = R * a1 / 2.45;
      vault.quad(pt(0, a0), pt(LEN, a0), pt(LEN, a1), pt(0, a1), [0, -Math.sin(am), Math.cos(am)], [[0, v0], [LEN / 2.1, v0], [LEN / 2.1, v1], [0, v1]]);
    }
    this.group.add(vault.mesh(new THREE.MeshBasicMaterial({ map: TX.vaultGlass(), color: new THREE.Color(0.75, 0.8, 0.95) })));

    // West lunette closes the vault with wall; the east end is all window.
    const lun = new Geo();
    for (let i = 0; i < na; i++) {
      const a0 = Math.PI * i / na, a1 = Math.PI * (i + 1) / na;
      const pt = a => [0, SPRING + R * Math.sin(a), -R * Math.cos(a)];
      const c = [0, SPRING, 0];
      lun.quad(c, pt(a0), pt(a1), c, [1, 0, 0], [[0, 1], [0, 1], [0, 1], [0, 1]]);
    }
    this.group.add(lun.mesh(this.rooms.hall.wallMat));

    const steel = new Geo();
    for (let z = -HW; z <= HW + 0.01; z += 2) {
      const top = SPRING + Math.sqrt(Math.max(0, R * R - z * z));
      steel.box(LEN - 0.08, LEN + 0.08, 0, top, z - 0.06, z + 0.06);
    }
    for (const y of [0.5, 3.2, 6.1, SPRING]) steel.box(LEN - 0.07, LEN + 0.07, y - 0.06, y + 0.06, -HW, HW);
    for (let i = 0; i <= na; i += 1) {       // arch rim
      const a = Math.PI * i / na, y = SPRING + R * Math.sin(a), z = -R * Math.cos(a);
      steel.box(LEN - 0.14, LEN + 0.14, y - 0.12, y + 0.12, z - 0.12, z + 0.12);
    }
    // Ribs along the vault.
    for (let x = 0; x <= LEN; x += 4.2) for (let i = 0; i < na; i++) {
      const a = Math.PI * (i + 0.5) / na, y = SPRING + (R - 0.1) * Math.sin(a), z = -(R - 0.1) * Math.cos(a);
      steel.box(x - 0.07, x + 0.07, y - 0.66, y + 0.66, z - 0.1, z + 0.1);
    }
    this.group.add(steel.mesh(new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.6 })));

    // Outside: a terrace under snow, and the city.
    const out = new THREE.Group();
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 260), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.05, 0.065, 0.11) }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(LEN + 60, -0.08, 0);
    const city = new THREE.Mesh(new THREE.PlaneGeometry(260, 130), new THREE.MeshBasicMaterial({ map: TX.skyline(), color: new THREE.Color(1.5, 1.5, 1.5), fog: false }));
    city.rotation.y = -Math.PI / 2; city.position.set(LEN + 95, 63, 0);
    out.add(ground, city);
    this.group.add(out);

    // Snow.
    const n = 700;
    const pos = new Float32Array(n * 3), seed = new Float32Array(n);
    const r = TX.rng(42);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = LEN + 1.5 + r() * 55; pos[i * 3 + 1] = r() * 26; pos[i * 3 + 2] = (r() - 0.5) * 90; seed[i] = r() * 100;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.snow = new THREE.Points(sg, motes(new THREE.Color(0.8, 0.86, 1), 0.07, 0.8, 70, 150, false));
    this.snow.userData.seed = seed;
    this.snow.frustumCulled = false;
    this.group.add(this.snow);

    // Moonlight: shafts falling from the vault, and what they land on.
    const add = (geo, map, color, opacity) => {
      const m = geo.mesh(new THREE.MeshBasicMaterial({ map, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      m.renderOrder = 5;
      this.group.add(m);
      return m;
    };
    const shafts = new Geo(), patches = new Geo();
    this.shaftSpots = [];
    const uvS = [[0, 1], [1, 1], [1, 0], [0, 0]];
    for (let i = 0; i < 5; i++) {
      const x = 12 + i * 15.5, z = (i % 2 ? 1 : -1) * 1.4;
      const top = [x + 7.5, 15.4], bot = [x, 0];
      shafts.quad(P3(top[0], top[1], z - 1.7), P3(top[0], top[1], z + 1.7), P3(bot[0], bot[1], z + 1.7), P3(bot[0], bot[1], z - 1.7), [1, 0, 0], uvS);
      shafts.quad(P3(top[0] - 1.7, top[1], z), P3(top[0] + 1.7, top[1], z), P3(bot[0] + 1.7, bot[1], z), P3(bot[0] - 1.7, bot[1], z), [0, 0, 1], uvS);
      patches.quad(P3(x - 2.6, 0.012, z - 2), P3(x + 2.6, 0.012, z - 2), P3(x + 2.6, 0.012, z + 2), P3(x - 2.6, 0.012, z + 2), [0, 1, 0]);
      this.shaftSpots.push({ x, z, tx: 7.5 / 15.4 });
    }
    // The window end throws a long pale rug of light down the hall.
    patches.quad(P3(LEN - 26, 0.012, -6.2), P3(LEN - 0.2, 0.012, -6.2), P3(LEN - 0.2, 0.012, 6.2), P3(LEN - 26, 0.012, 6.2), [0, 1, 0]);
    this.shaftMesh = add(shafts, TX.shaft(), new THREE.Color(0.5, 0.64, 1), 0.2);
    const patchMesh = add(patches, TX.moonPatch(), new THREE.Color(0.42, 0.55, 0.9), 0.26);
    patchMesh.material.polygonOffset = true; patchMesh.material.polygonOffsetFactor = -2; patchMesh.material.polygonOffsetUnits = -2;
    patchMesh.material.side = THREE.FrontSide;

    // Dust, which is only ever visible in a beam.
    const dn = 900, dp = new Float32Array(dn * 3), ds = new Float32Array(dn * 4);
    for (let i = 0; i < dn; i++) {
      const s = this.shaftSpots[i % this.shaftSpots.length];
      const y = r() * 14;
      ds[i * 4] = s.x + s.tx * y + (r() - 0.5) * 3; ds[i * 4 + 1] = y; ds[i * 4 + 2] = s.z + (r() - 0.5) * 3; ds[i * 4 + 3] = r() * 100;
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    this.dust = new THREE.Points(dg, motes(new THREE.Color(0.75, 0.85, 1.2), 0.016, 0.7, 5, 26, true));
    this.dust.userData.base = ds;
    this.dust.frustumCulled = false;
    this.group.add(this.dust);

    // Someone's balloon, lost on a field trip, still up against the glass.
    const balloon = new THREE.Group();
    const skin = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), new THREE.MeshStandardMaterial({ color: 0xc81e2a, roughness: 0.25, emissive: 0x50060a, emissiveIntensity: 0.6 }));
    skin.scale.y = 1.2;
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.04, 8), skin.material); knot.position.y = -0.19;
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 1.1, 4), new THREE.MeshBasicMaterial({ color: 0x9a9a9a })); string.position.y = -0.75;
    balloon.add(skin, knot, string);
    balloon.position.set(47, SPRING + R - 0.42, 0.6);
    this.balloon = balloon;
    this.group.add(balloon);
  }

  // -------------------------------------------------------------------- art --

  _buildArt() {
    const placements = hang(this.plan, this.collection);
    const unit = new THREE.PlaneGeometry(1, 1);
    const lqLoader = new THREE.TextureLoader();
    const blank = TX.flat(40, 36, 32);
    const frames = {};     // room -> [gilt Geo, dark Geo]
    const arms = new Geo();
    const paintings = placements.filter(p => p.kind === 'painting').length;
    const n = placements.length;

    const inst = (geo, mat, count) => {
      const m = new THREE.InstancedMesh(geo, mat, count);
      m.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      m.setColorAt(0, new THREE.Color(0, 0, 0));
      for (let i = 0; i < count; i++) m.setColorAt(i, new THREE.Color(0, 0, 0));
      m.frustumCulled = false;
      this.group.add(m);
      return m;
    };
    const additive = map => new THREE.MeshBasicMaterial({ map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, fog: false });
    this.lamps = inst(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), Math.max(1, paintings));
    this.washes = inst(unit, additive(TX.lampWash()), Math.max(1, paintings));
    this.pools = inst(unit, additive(TX.radial(0, 1)), n);
    this.cards = inst(unit, new THREE.MeshBasicMaterial({ color: 0xffffff }), n);
    this.pools.renderOrder = 4; this.washes.renderOrder = 4;

    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3();
    const E = new THREE.Euler();
    const flatQ = new THREE.Quaternion();
    let lampIdx = 0;
    this.arts = placements.map((p, i) => {
      const mini = p.kind === 'miniature';
      // Mostly self-lit: a headlamp should warm a picture, not bleach it.
      const mat = new THREE.MeshStandardMaterial({ color: 0x4c4c4c, map: blank, emissiveMap: blank, emissive: 0xffffff, emissiveIntensity: 0.03, roughness: 0.6, metalness: 0 });
      const mesh = new THREE.Mesh(unit, mat);
      mesh.position.set(p.x, p.y, p.z);
      mesh.rotation.y = p.rot;
      mesh.scale.set(p.w, p.h, 1);
      mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      this.group.add(mesh);
      const art = { ...p, i, mini, mesh, mat, lit: 0, wakeAt: -1, tier: 0, want: 0, busy: false, studied: false, lamp: -1, tex: null };
      this.rooms[p.room].arts.push(art);

      if (p.work.lq) lqLoader.load(p.work.lq, t => {
        t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = t.magFilter = THREE.LinearFilter;
        if (art.tier === 0) { mat.map = mat.emissiveMap = t; art.tex = t; mat.needsUpdate = true; } else t.dispose();
      });

      // The frame: see buildFrame.
      const f = p.frame, hw = p.w / 2, hh = p.h / 2;
      buildFrame(frames[p.room] || (frames[p.room] = new Geo()), p, frameStyle(p.work, mini));

      E.set(0, p.rot, 0); Q.setFromEuler(E);
      const tx = Math.cos(p.rot), tz = -Math.sin(p.rot);     // along the wall, to the viewer's right
      if (!mini) {
        // Picture lamp: a bright bar held off the wall on a short arm.
        const len = Math.min(1.3, Math.max(0.22, p.w * 0.42));
        const ly = p.y + hh + f + 0.17;
        V.set(p.x + p.nx * 0.2, ly, p.z + p.nz * 0.2);
        S.set(len, 0.028, 0.05);
        this.lamps.setMatrixAt(lampIdx, M.compose(V, Q, S));
        arms.wallBox({ x: p.x - p.nx * 0.04, y: ly, z: p.z - p.nz * 0.04 }, p.nx, p.nz, -0.012, 0.012, 0.0, 0.03, 0, 0.26);
        arms.wallBox({ x: p.x - p.nx * 0.04, y: ly, z: p.z - p.nz * 0.04 }, p.nx, p.nz, -len / 2 - 0.02, len / 2 + 0.02, 0.02, 0.055, 0.19, 0.3);
        const ww = p.w + 2.4, wh = p.h + 2.8;
        V.set(p.x - p.nx * 0.025, ly + 0.3 - wh / 2, p.z - p.nz * 0.025);
        S.set(ww, wh, 1);
        this.washes.setMatrixAt(lampIdx, M.compose(V, Q, S));
        art.lamp = lampIdx++;
      }
      // What the lamp spills on the floor.
      E.set(-Math.PI / 2, 0, 0); flatQ.setFromEuler(E);
      const reach = mini ? 1.5 : 2.2 + p.h * 0.4;
      V.set(p.x + p.nx * reach * 0.42, 0.014, p.z + p.nz * reach * 0.42);
      const along = p.w + (mini ? 1.2 : 2.6);
      S.set(p.nz !== 0 ? along : reach, p.nz !== 0 ? reach : along, 1);
      this.pools.setMatrixAt(i, M.compose(V, flatQ, S));
      // The label.
      const cw = mini ? 0.16 : 0.13, ch = mini ? 0.045 : 0.09;
      if (mini) V.set(p.x + p.nx * 0.03, p.y - hh - f - 0.1, p.z + p.nz * 0.03);
      else V.set(p.x + tx * (hw + f + 0.24) - p.nx * 0.03, 1.22, p.z + tz * (hw + f + 0.24) - p.nz * 0.03);
      S.set(cw, ch, 1);
      this.cards.setMatrixAt(i, M.compose(V, Q, S));
      return art;
    });
    this.lamps.count = Math.max(1, lampIdx); this.washes.count = Math.max(1, lampIdx);

    for (const [room, geo] of Object.entries(frames)) {
      // One material per room; each ring of moulding carries its own colour, and glows in it.
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.3, emissive: new THREE.Color(0.62, 0.56, 0.46), emissiveIntensity: 0.03 });
      mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n  totalEmissiveRadiance *= vColor.rgb;\n#endif'); };
      if (!geo.empty) this.group.add(geo.mesh(mat));
      this.rooms[room].frameMats = [mat];
    }
    if (!arms.empty) this.group.add(arms.mesh(new THREE.MeshStandardMaterial({ color: 0x4a3a1c, roughness: 0.5, metalness: 0.4 })));
    this._dirty = true;
    this._waking = new Set();
    this._col = new THREE.Color();
    for (const a of this.arts) this._paint(a);
  }

  _paint(a) {
    const c = this._col, b = a.boost || 0, l = a.lit * (1 + 1.6 * b);
    a.mat.emissiveIntensity = (a.mini ? 0.05 + 1.1 * a.lit : 0.035 + 0.88 * a.lit) * (1 + 0.5 * b);
    if (a.lamp >= 0) {
      this.lamps.setColorAt(a.lamp, c.setRGB(0.05 + 3.6 * l, 0.04 + 2.9 * l, 0.03 + 1.9 * l));
      this.washes.setColorAt(a.lamp, c.setRGB(0.34 * l, 0.26 * l, 0.17 * l));
    }
    const k = a.mini ? 0.2 : 0.17;
    this.pools.setColorAt(a.i, c.setRGB(k * l, k * 0.8 * l, k * 0.55 * l));
    const d = 0.02 + 0.4 * l;
    this.cards.setColorAt(a.i, c.setRGB(d, d * 0.96, d * 0.86));
    this._dirty = true;
  }

  // -------------------------------------------------------------- furniture --

  _buildFurniture() {
    const { plan } = this;
    const leather = new Geo(), metal = new Geo();
    const bench = (cx, cz, alongX) => {
      const L = 1.4, W = 0.38;
      const hx = alongX ? L : W, hz = alongX ? W : L;
      leather.box(cx - hx, cx + hx, 0.4, 0.5, cz - hz, cz + hz);
      plan.obstacles.push({ x0: cx - hx, x1: cx + hx, z0: cz - hz, z1: cz + hz, y0: 0.37, y1: 0.488, bench: true });
      plan.surfaces.push({ skin: 'bench', x0: cx - hx, x1: cx + hx, z0: cz - hz, z1: cz + hz, axis: null, h0: 0.5, h1: 0.5, thick: 0.1 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const lx = cx + sx * (hx - 0.07), lz = cz + sz * (hz - 0.07);
        metal.box(lx - 0.03, lx + 0.03, 0, 0.4, lz - 0.03, lz + 0.03);
        plan.obstacles.push({ x0: lx - 0.03, x1: lx + 0.03, z0: lz - 0.03, z1: lz + 0.03, y0: 0, y1: 0.4 });
      }
    };
    for (const r of plan.rooms) if (r.kind === 'gallery' && !plan.noBench.has(r.id)) bench((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, false);
    for (const x of [52, 62]) bench(x, 0, true);
    this.group.add(leather.mesh(new THREE.MeshStandardMaterial({ color: 0x45201b, roughness: 0.45, emissive: 0x45201b, emissiveIntensity: 0.4 })));
    this.group.add(metal.mesh(new THREE.MeshStandardMaterial({ color: 0x6d6a66, roughness: 0.35, metalness: 0.7 })));

    // The guard's desk, lamp left on.
    const desk = new Geo();
    const dx = 18.2, dz = -6.2;
    desk.box(dx - 1.1, dx + 1.1, 0, 1.02, dz - 0.5, dz + 0.5);
    desk.box(dx - 1.16, dx + 1.16, 1.02, 1.07, dz - 0.56, dz + 0.56);
    plan.obstacles.push({ x0: dx - 1.16, x1: dx + 1.16, z0: dz - 0.56, z1: dz + 0.56, y0: 0, y1: 1.5 });
    this.group.add(desk.mesh(new THREE.MeshStandardMaterial({ color: 0x2c1e14, roughness: 0.55, emissive: 0x2a1a0c, emissiveIntensity: 0.25 })));
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.26, 12, 1, false), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 1.5, 0.6) }));
    shade.rotation.z = Math.PI / 2; shade.position.set(dx + 0.1, 1.42, dz);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 6), new THREE.MeshStandardMaterial({ color: 0x8a6a2a, metalness: 0.6, roughness: 0.4 }));
    stem.position.set(dx + 0.1, 1.24, dz);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.1), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.9, 0.7, 0.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.set(dx + 0.05, 1.075, dz);
    this.group.add(shade, stem, glow);

  }

  // ------------------------------------------------------------------ stunts --

  _buildStunts() {
    const { plan } = this;
    const ply = new Geo(), stone = new Geo(), carpet = new Geo(), crate = new Geo(), wood = new Geo(), steel = new Geo();
    const led = new Geo(), arrows = new Geo(), track = new Geo(), trackArrows = new Geo(), rail = new Geo(), wire = new Geo();
    const n3 = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
    const ceilingAt = (x, z) => { const r = roomAt(plan, x, z); return !r ? 6 : r.kind === 'hall' ? SPRING + Math.sqrt(Math.max(0, VAULT_R * VAULT_R - z * z)) - 0.15 : r.h; };

    // One slab of a piece: the top following its slope, sides down to its base.
    const slab = (geo, s, x0, x1, z0, z1, along) => {
      const P = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], h = P.map(([x, z]) => heightOf(s, x, z));
      const base = i => (s.onTop != null ? s.onTop : s.thick ? h[i] - s.thick : 0);
      const top = i => [P[i][0], h[i], P[i][1]], bot = i => [P[i][0], base(i), P[i][1]];
      const dx = x1 - x0, dz = z1 - z0, nrm = n3(-(h[1] - h[0]) / dx, 1, -(h[3] - h[0]) / dz);
      geo.quad(top(0), top(1), top(2), top(3), nrm, along === 'z' ? [[0, z0], [1, z0], [1, z1], [0, z1]] : along === 'x' ? [[0, x0 / 1.2], [0, x1 / 1.2], [1, x1 / 1.2], [1, x0 / 1.2]] : [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]);
      if (s.thick && s.onTop == null) geo.quad(bot(0), bot(1), bot(2), bot(3), [0, -1, 0]);
      const N = [[0, 0, -1], [1, 0, 0], [0, 0, 1], [-1, 0, 0]];
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4, hi = h[i] - base(i), hj = h[j] - base(j);
        if (hi < 0.011 && hj < 0.011) continue;
        const len = Math.hypot(P[j][0] - P[i][0], P[j][1] - P[i][1]);
        geo.quad(bot(i), bot(j), top(j), top(i), N[i], [[0, 0], [len, 0], [len, hj], [0, hi]]);
      }
      return { h, top };
    };

    for (const s of plan.surfaces) {
      const { x0, x1, z0, z1, h0, h1 } = s;
      if (s.skin === 'ply' || s.skin === 'track') {
        const isTrack = s.skin === 'track', run = s.axis || s.run || 'x';
        // Curves are cut into slices; straight pieces are one slab.
        const n = s.curve ? 14 : 1, geo = isTrack ? track : ply;
        for (let i = 0; i < n; i++) {
          const a = i / n, b = (i + 1) / n;
          const rx0 = run === 'x' ? x0 + (x1 - x0) * a : x0, rx1 = run === 'x' ? x0 + (x1 - x0) * b : x1;
          const rz0 = run === 'z' ? z0 + (z1 - z0) * a : z0, rz1 = run === 'z' ? z0 + (z1 - z0) * b : z1;
          const { top } = slab(geo, s, rx0, rx1, rz0, rz1, isTrack ? run : null);
          // Light down both edges: a strip on plywood, a proper lip on track.
          const lipH = isTrack ? 0.06 : 0.03, edges = run === 'x' ? [[0, 1, 0.012], [3, 2, -0.012]] : [[0, 3, 0.012], [1, 2, -0.012]];
          for (const [i0, i1, off] of edges) {
            const p0 = top(i0), p1 = top(i1);
            if (run === 'x') { p0[2] += off; p1[2] += off; } else { p0[0] += off; p1[0] += off; }
            (isTrack && !s.lip ? rail : led).quad(p0, p1, [p1[0], p1[1] + lipH, p1[2]], [p0[0], p0[1] + lipH, p0[2]], run === 'x' ? [0, 0, 1] : [1, 0, 0]);
          }
          // Arrows running uphill on anything that slopes.
          if (s.axis && !isTrack) {
            const up = h1 > h0, e = 0.014, t = [0, 1, 2, 3].map(k => { const q = top(k); q[1] += e; return q; });
            const m = (run === 'x' ? z1 - z0 : x1 - x0) * 0.18, L0 = (run === 'x' ? rx0 : rz0) / 0.55, L1 = (run === 'x' ? rx1 : rz1) / 0.55;
            if (run === 'x') { t[0][2] += m; t[1][2] += m; t[2][2] -= m; t[3][2] -= m; arrows.quad(t[0], t[1], t[2], t[3], [0, 1, 0], up ? [[0, L0], [0, L1], [1, L1], [1, L0]] : [[0, -L0], [0, -L1], [1, -L1], [1, -L0]]); }
            else { t[0][0] += m; t[3][0] += m; t[1][0] -= m; t[2][0] -= m; arrows.quad(t[0], t[1], t[2], t[3], [0, 1, 0], up ? [[0, L0], [1, L0], [1, L1], [0, L1]] : [[0, -L0], [1, -L0], [1, -L1], [0, -L1]]); }
          }
        }
        // Hung from the ceiling on wires.
        if (s.hang) {
          const along = run === 'x' ? x1 - x0 : z1 - z0, count = Math.max(2, Math.round(along / 3.2) + 1);
          for (let i = 0; i < count; i++) for (const side of [0, 1]) {
            const t = i / (count - 1);
            const wx = run === 'x' ? x0 + (x1 - x0) * t : (side ? x1 - 0.03 : x0 + 0.03), wz = run === 'z' ? z0 + (z1 - z0) * t : (side ? z1 - 0.03 : z0 + 0.03);
            const y = heightOf(s, Math.min(x1, Math.max(x0, wx)), Math.min(z1, Math.max(z0, wz)));
            wire.box(wx - 0.006, wx + 0.006, y, ceilingAt(wx, wz), wz - 0.006, wz + 0.006);
          }
        }
      } else if (s.skin === 'stone') {
        stone.box(x0, x1, 0, h0, z0, z1, 1.3);
        if (s.carpet) carpet.box(x0, x1 + 0.012, Math.max(0, h0 - 0.19), h0 + 0.012, s.carpet[0], s.carpet[1]);
      } else if (s.skin === 'crate') {
        crate.box(x0, x1, 0, h0, z0, z1, 0.9);
      } else if (s.skin === 'table') {
        wood.box(x0 - 0.03, x1 + 0.03, h0 - 0.06, h0, z0 - 0.03, z1 + 0.03, 1.2);
        wood.box(x0 + 0.05, x1 - 0.05, h0 - 0.16, h0 - 0.06, z0 + 0.06, z0 + 0.09);
        wood.box(x0 + 0.05, x1 - 0.05, h0 - 0.16, h0 - 0.06, z1 - 0.09, z1 - 0.06);
      }
    }
    for (const o of plan.obstacles) {
      if (o.leg) wood.box(o.x0, o.x1, 0, o.y1, o.z0, o.z1);
      if (o.post) steel.box(o.x0, o.x1, 0, o.y1, o.z0, o.z1);
    }

    // Track laid flat on the floor: where to line up, and which way.
    for (const d of plan.decals) {
      const y = 0.007, len = (d.x1 - d.x0), w = d.z1 - d.z0;
      track.quad([d.x0, y, d.z0], [d.x1, y, d.z0], [d.x1, y, d.z1], [d.x0, y, d.z1], [0, 1, 0], [[0, 0], [0, len / 1.2], [1, len / 1.2], [1, 0]]);
      const k = len / 0.6, m = w * 0.22;
      trackArrows.quad([d.x0, y + 0.004, d.z0 + m], [d.x1, y + 0.004, d.z0 + m], [d.x1, y + 0.004, d.z1 - m], [d.x0, y + 0.004, d.z1 - m], [0, 1, 0],
        d.dir > 0 ? [[0, 0], [0, k], [1, k], [1, 0]] : [[0, k], [0, 0], [1, 0], [1, k]]);
    }

    // The loop: one ribbon of track taken right round, leaning sideways as it
    // goes so the way out sits beside the way in.
    for (const L of plan.loops) {
      const N = 56, r = L.r, hw = L.w / 2;
      const at = th => [L.x + L.dir * r * Math.sin(th), r - r * Math.cos(th), L.z + L.shift * th / (Math.PI * 2)];
      for (let i = 0; i < N; i++) {
        const t0 = Math.PI * 2 * i / N, t1 = Math.PI * 2 * (i + 1) / N, a = at(t0), b = at(t1), tm = (t0 + t1) / 2;
        const inward = [-L.dir * Math.sin(tm), Math.cos(tm), 0];
        track.quad([a[0], a[1], a[2] - hw], [b[0], b[1], b[2] - hw], [b[0], b[1], b[2] + hw], [a[0], a[1], a[2] + hw], inward,
          [[0, i * 0.24], [0, (i + 1) * 0.24], [1, (i + 1) * 0.24], [1, i * 0.24]]);
        for (const sgn of [-1, 1]) {
          const z0 = a[2] + sgn * hw, z1 = b[2] + sgn * hw, f = 0.05;
          led.quad([a[0], a[1], z0], [b[0], b[1], z1], [b[0] + inward[0] * f, b[1] + inward[1] * f, z1], [a[0] + inward[0] * f, a[1] + inward[1] * f, z0], [0, 0, sgn]);
        }
      }
      const x0 = L.x - 1.45, x1 = L.x + 1.45, za = L.z - 0.55, zb = L.z + 1.15, top = 2 * r + 0.16;
      for (const z of [za, zb]) steel.box(x0 - 0.04, x1 + 0.04, top, top + 0.07, z - 0.035, z + 0.035);
      for (const x of [x0, x1]) steel.box(x - 0.035, x + 0.035, top, top + 0.07, za, zb);
      steel.box(L.x - 0.03, L.x + 0.03, top - 0.16, top + 0.07, za, zb);
    }

    const D = THREE.DoubleSide;
    const std = (o) => new THREE.MeshStandardMaterial({ side: D, ...o });
    const plyTex = TX.plywood(), trackTex = TX.track(), crateTex = TX.crate();
    const put = (geo, mat) => { if (!geo.empty) { const m = geo.mesh(mat); this.group.add(m); return m; } };
    put(ply, std({ map: plyTex, roughness: 0.75, emissiveMap: plyTex, emissive: 0x8a7a66, emissiveIntensity: 0.16 }));
    put(stone, std({ color: 0xb7b0a3, roughness: 0.5, emissive: 0x39424f, emissiveIntensity: 0.22 }));
    put(carpet, std({ color: 0x7a1218, roughness: 0.95, emissive: 0x3a0508, emissiveIntensity: 0.3 }));
    put(crate, std({ map: crateTex, roughness: 0.85, emissiveMap: crateTex, emissive: 0x80705a, emissiveIntensity: 0.16 }));
    put(wood, std({ color: 0x6a4526, roughness: 0.5, emissive: 0x5a3a20, emissiveIntensity: 0.5 }));
    put(steel, std({ color: 0x1a1c20, roughness: 0.45, metalness: 0.6 }));
    put(wire, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.16, 0.18, 0.22) }));
    put(track, std({ map: trackTex, roughness: 0.45, emissiveMap: trackTex, emissive: 0xffffff, emissiveIntensity: 0.3, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    put(rail, std({ color: 0xc8501a, roughness: 0.5, emissive: 0xc8501a, emissiveIntensity: 0.35 }));
    put(led, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.22, 1.25, 1.45), side: D }));
    this.arrowTex = TX.chevrons();
    const arrowMat = new THREE.MeshBasicMaterial({ map: this.arrowTex, color: new THREE.Color(0.2, 0.75, 0.85), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: D, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    const a1 = put(arrows, arrowMat), a2 = put(trackArrows, arrowMat);
    for (const m of [a1, a2]) if (m) m.renderOrder = 6;

    // Mopped floor: a patch that mirrors like nothing else in the building.
    for (const p of plan.puddles) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(p.r, 44), this.mirror.patch(new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.05, transparent: true, opacity: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), [0.6, 0.4]));
      m.rotation.x = -Math.PI / 2; m.position.set(p.x, 0.004, p.z); m.updateMatrix(); m.matrixAutoUpdate = false;
      this.group.add(m); this.floors.push(m);
    }

    // Hoops: gold until you have been through them.
    this.hoops = plan.hoops.map(h => {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.05, 0.7, 0.14) });
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(h.r, 0.032, 10, 56), mat);
      mesh.position.set(h.x, h.y, h.z);
      if (h.axis === 'x') mesh.rotation.y = Math.PI / 2; else if (h.axis === 'y') mesh.rotation.x = Math.PI / 2;
      this.group.add(mesh);
      return { ...h, mesh, mat, done: false, pop: 0 };
    });
  }

  showHoops(on) { for (const h of this.hoops) { h.done = false; h.pop = 0; h.mesh.visible = on; h.mesh.scale.setScalar(1); } }
  get hoopsDone() { return this.hoops.reduce((n, h) => n + (h.done ? 1 : 0), 0); }

  // Did something moving from `a` to `b` pass through a hoop it had not been through?
  hoopHit(a, b) {
    for (const h of this.hoops) {
      if (h.done || !h.mesh.visible) continue;
      const k = h.axis, pa = a[k] - h[k], pb = b[k] - h[k];
      if (pa === pb || (pa < 0) === (pb < 0)) continue;
      const t = pa / (pa - pb), x = a.x + (b.x - a.x) * t - h.x, y = a.y + (b.y - a.y) * t - h.y, z = a.z + (b.z - a.z) * t - h.z;
      if (x * x + y * y + z * z > h.r * h.r) continue;
      h.done = true; h.pop = 1;
      return h;
    }
    return null;
  }

    // ------------------------------------------------------------------- life --

  sleep() {
    for (const s of Object.values(this.rooms)) { s.lit = false; s.wake = 0; }
    for (const a of this.arts) { a.lit = 0; a.wakeAt = -1; this._paint(a); }
    this._waking.clear();
  }

  wakeAll() {
    for (const s of Object.values(this.rooms)) s.lit = true;
    for (const a of this.arts) if (a.wakeAt < 0) { a.wakeAt = this.time + Math.random() * 1.5; this._waking.add(a); }
  }

  get litCount() { return this.arts.reduce((n, a) => n + (a.wakeAt >= 0 ? 1 : 0), 0); }
  get roomsLit() { return Object.values(this.rooms).filter(s => s.room.kind === 'gallery' && s.lit).length; }

  // Called every frame with wherever the vehicle is.
  update(dt, pos, roomId, cam) {
    this.time += dt;
    const t = this.time;
    const state = roomId && this.rooms[roomId];
    if (state) {
      const kind = state.room.kind;
      if (kind === 'gallery' && !state.lit) {
        state.lit = true;
        for (const a of state.arts) {
          a.wakeAt = t + 0.05 + Math.hypot(a.x - pos.x, a.z - pos.z) * 0.06 + Math.random() * 0.08;
          this._waking.add(a);
        }
        if (this.onRoomLit) this.onRoomLit(roomId, state);
      } else if (kind !== 'gallery') {
        // In the hall and the passage, lamps come on only as you draw near.
        const reach = kind === 'hall' ? 13 : 7.5;
        for (const a of state.arts) {
          if (a.wakeAt >= 0) continue;
          const d = Math.hypot(a.x - pos.x, a.z - pos.z);
          if (d < reach) { a.wakeAt = t + d * 0.03; this._waking.add(a); state.lit = true; }
        }
      }
    }
    for (const a of this._waking) {
      const e = t - a.wakeAt;
      if (e < 0) continue;
      if (!a.rang) { a.rang = true; if (this.onWake) this.onWake(a); }
      a.lit = this.calm ? Math.min(1, e / 0.9) ** 2 * (3 - 2 * Math.min(1, e / 0.9)) : flicker(e);
      this._paint(a);
      if (e > 1) { a.lit = 1; this._paint(a); this._waking.delete(a); a.rang = false; }
    }
    if (this._spot) { this._paint(this._spot); if (!this._spot.boost) this._spot = null; }
    for (const s of Object.values(this.rooms)) {
      const k = s.room.kind;
      const target = k === 'gallery' ? (s.lit ? 1 : 0) : 0;
      s.wake += (target - s.wake) * Math.min(1, dt * 1.1);
      const base = k === 'hall' ? 0.05 : k === 'corridor' ? 0.012 : 0.022;
      s.wallMat.emissiveIntensity = base + 0.34 * s.wake;
      s.trimMat.emissiveIntensity = 0.02 + 0.2 * s.wake;
      if (s.floorMat) s.floorMat.emissiveIntensity = 0.02 + 0.26 * s.wake;
      for (const m of s.frameMats) m.emissiveIntensity = 0.05 + 0.85 * s.wake;
    }
    this.ceilMat.emissiveIntensity = 0.03 + 0.2 * (this.roomsLit / 10);
    // Lamps in the hall and passage light their own frames; approximate with how many are on.
    for (const id of ['hall', 'C']) {
      const s = this.rooms[id];
      if (!s.arts.length) continue;
      const on = s.arts.reduce((n, a) => n + a.lit, 0) / s.arts.length;
      for (const m of s.frameMats) m.emissiveIntensity = 0.06 + 0.85 * on;
    }
    if (this._dirty) {
      this.lamps.instanceColor.needsUpdate = true; this.washes.instanceColor.needsUpdate = true;
      this.pools.instanceColor.needsUpdate = true; this.cards.instanceColor.needsUpdate = true;
      this._dirty = false;
    }
    this._weather(dt, t);
    this._stream(pos, cam, roomId);
  }

  _weather(dt, t) {
    const p = this.snow.geometry.attributes.position, seed = this.snow.userData.seed;
    for (let i = 0; i < p.count; i++) {
      let y = p.array[i * 3 + 1] - dt * (0.7 + (seed[i] % 1) * 0.6);
      if (y < 0) y += 26;
      p.array[i * 3 + 1] = y;
      p.array[i * 3 + 2] += Math.sin(t * 0.6 + seed[i]) * dt * 0.35;
    }
    p.needsUpdate = true;
    const d = this.dust.geometry.attributes.position, b = this.dust.userData.base;
    for (let i = 0; i < d.count; i++) {
      const s = b[i * 4 + 3];
      d.array[i * 3] = b[i * 4] + Math.sin(t * 0.11 + s) * 0.5;
      d.array[i * 3 + 1] = (b[i * 4 + 1] + t * 0.035 * (0.5 + (s % 1))) % 14;
      d.array[i * 3 + 2] = b[i * 4 + 2] + Math.cos(t * 0.09 + s * 1.7) * 0.5;
    }
    d.needsUpdate = true;
    this.balloon.position.y = SPRING + VAULT_R - 0.42 + Math.sin(t * 0.7) * 0.015;
    this.balloon.rotation.z = Math.sin(t * 0.5) * 0.05;
    this.shaftMesh.material.opacity = 0.19 + Math.sin(t * 0.23) * 0.02;
    if (!this.calm) this.arrowTex.offset.y = -(t * 0.9) % 1;
    for (const h of this.hoops) {
      if (h.pop > 0) { h.pop = Math.max(0, h.pop - dt * 1.6); h.mesh.scale.setScalar(1 + (this.calm ? 0 : h.pop * 0.5)); }
      const g = h.done ? 0.12 + h.pop * 2.5 : this.calm ? 1 : 0.85 + 0.15 * Math.sin(t * 3 + h.x);
      if (h.done) h.mat.color.setRGB(0.2 * g + h.pop, 1.2 * g + h.pop, 0.5 * g + h.pop); else h.mat.color.setRGB(1.05 * g, 0.7 * g, 0.14 * g);
    }
  }

  // ----------------------------------------------------------- image tiers --
  // 0 is the API's own tiny placeholder, 1 a 400 px image, 2 the 843 px image
  // the museum recommends, 3 a 1686 px image for the work being studied.

  _stream(pos, cam, roomId) {
    this._streamT = (this._streamT || 0) + 1;
    if (this._streamT % 12) return;
    const queue = [];
    for (const a of this.arts) {
      const d = Math.hypot(a.x - cam.x, a.z - cam.z);
      let want = d < 60 ? 1 : (a.tier >= 1 && d < 85 ? 1 : 0);
      const near = a.mini ? 5 : 13;
      if (d < near || (a.room === roomId && !a.mini && a.room !== 'hall')) want = 2;
      else if (a.tier === 2 && d < near + 9) want = 2;
      if (a.focus) want = 3;
      a.want = want;
      if (want > a.tier && !a.busy) queue.push([d - want * 4, a]);
      else if (want < a.tier && !a.busy) this._drop(a, want);
    }
    queue.sort((x, y) => x[0] - y[0]);
    for (const [, a] of queue) { if (this.loading >= 6) break; this._load(a, a.want); }
  }

  _drop(a, tier) {
    // Stepping down re-requests the smaller image; the browser has it cached.
    if (tier === 0) return;       // keep what we have rather than go back to a blur
    if (a.tier - tier >= 1 && tier >= 1) this._load(a, tier);
  }

  _load(a, tier) {
    const px = [0, 400, 843, 1686][tier];
    const url = imageUrl(a.work, px);
    if (url === a.url) { a.tier = tier; return; }       // an offline copy serves several tiers
    a.busy = true; this.loading++;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    const done = () => { a.busy = false; this.loading--; };
    img.onload = () => {
      const t = new THREE.Texture(img);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = this.maxAniso;
      t.needsUpdate = true;
      const old = a.tex;
      a.tex = t; a.tier = tier; a.url = url;
      a.mat.map = a.mat.emissiveMap = t; a.mat.needsUpdate = true;
      if (old) old.dispose();
      done();
    };
    img.onerror = () => { a.failed = (a.failed || 0) + 1; setTimeout(done, Math.min(60000, 4000 * a.failed)); };
    img.src = url;
  }

  // Single one work out: brighter lamp, brighter canvas. 0 puts it back.
  spotlight(art, k) {
    if (this._spot && this._spot !== art) { this._spot.boost = 0; this._paint(this._spot); }
    if (!art) { this._spot = null; return; }
    art.boost = k; this._spot = art;
    if (art.wakeAt < 0) { art.wakeAt = this.time; this._waking.add(art); }
  }

  // The work a jump from here will carry you past.
  beside(pos, vel, air, roomId) {
    const s = this.rooms[roomId];
    if (!s) return null;
    const mx = pos.x + vel.x * air * 0.5, mz = pos.z + vel.z * air * 0.5;
    let best = null, bd = s.room.kind === 'hall' ? 11 : 9.5;
    for (const a of s.arts) {
      const d = Math.hypot(a.x - mx, a.z - mz) - Math.min(1.5, a.w * 0.3);     // big pictures pull harder
      if (d < bd) { bd = d; best = a; }
    }
    return best;
  }

  // The work you would be looking at from here, if any.
  facing(pos, yaw, roomId) {
    const s = this.rooms[roomId];
    if (!s) return null;
    const fx = Math.sin(yaw), fz = Math.cos(yaw);
    let best = null, score = Infinity;
    for (const a of s.arts) {
      const dx = a.x - pos.x, dz = a.z - pos.z, d = Math.hypot(dx, dz);
      const reach = a.mini ? 3.2 : 5.5 + a.w * 0.6;
      if (d > reach) continue;
      const ahead = (dx * fx + dz * fz) / (d || 1);
      const sc = d - ahead * 2.2;
      if (sc < score) { score = sc; best = a; }
    }
    return best;
  }
}
