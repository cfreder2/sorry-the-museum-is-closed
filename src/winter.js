// Winter in the grounds.
//
// Paths shovelled through the snow; the big tree in the courtyard, lit; fountains with the water
// off and ice hanging from them; the sculpture that stands outdoors; wreaths on the lions. And the
// snow itself: it glitters as you move past it, and a car leaves its tyre tracks in it.
//
// The sculpture is placed and shaped from memory of the real grounds, not surveyed: Moore's Large
// Interior Form and David Smith's Cubi VII with the Calder in the North Garden, Milles's Fountain
// of the Tritons in the courtyard, and the arch of the Chicago Stock Exchange at the north-east corner.

import * as THREE from 'three';
import * as TX from './textures.js';
import { Geo } from './geo.js';
import { onSnow } from './plan.js';

export function buildWinter(museum, plan) {
  const G = plan.grounds, B = plan.bounds, group = museum.group;
  const fix = m => { m.matrixAutoUpdate = false; m.updateMatrix(); return m; };
  const add = (...ms) => { for (const m of ms) group.add(fix(m)); };
  const std = o => new THREE.MeshStandardMaterial(o);
  const snowTex = museum.snowTex;
  const snow = std({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.3, 0.36, 0.52), emissiveIntensity: 0.55 });
  const white = std({ color: 0xf2f5fb, roughness: 0.95, emissive: 0x596a8c, emissiveIntensity: 0.55 });
  const ice = std({ color: 0xcfe6f5, roughness: 0.1, transparent: true, opacity: 0.8, emissive: 0x5a7f9c, emissiveIntensity: 0.7 });
  const stone = std({ color: 0xa9a294, roughness: 0.85, emissive: 0x3a3f4d, emissiveIntensity: 0.45 });
  const bronze = std({ color: 0x4a3a28, roughness: 0.55, metalness: 0.4, emissive: 0x241a10, emissiveIntensity: 0.8 });
  const verdigris = std({ color: 0x4fa596, roughness: 0.6, metalness: 0.2, emissive: 0x1d4a42, emissiveIntensity: 0.8 });
  const put = (g, geo, mat, x, y, z, sx = 1, sy = sx, sz = sx) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); return m; };
  const ball = new THREE.SphereGeometry(1, 16, 12), cyl = new THREE.CylinderGeometry(1, 1, 1, 20), box = new THREE.BoxGeometry(1, 1, 1), spike = new THREE.ConeGeometry(1, 1, 6);

  // ------------------------------------------------------------------ paths
  {
    const pv = TX.paving(), S = 2.4, paths = new Geo(), ridge = new Geo();
    for (const q of G.paths) paths.quad([q.x0, 0.007, q.z0], [q.x1, 0.007, q.z0], [q.x1, 0.007, q.z1], [q.x0, 0.007, q.z1], [0, 1, 0], [[q.x0 / S, q.z0 / S], [q.x1 / S, q.z0 / S], [q.x1 / S, q.z1 / S], [q.x0 / S, q.z1 / S]]);
    // What came off the path lies in a low bank down each side of it, wherever there is snow beside it.
    for (const q of G.paths) {
      const alongX = q.x1 - q.x0 > q.z1 - q.z0, a = alongX ? q.x0 : q.z0, b = alongX ? q.x1 : q.z1;
      for (const edge of alongX ? [q.z0 - 0.16, q.z1 + 0.16] : [q.x0 - 0.16, q.x1 + 0.16]) {
        let from = null;
        for (let u = a; u <= b + 0.26; u += 0.5) {
          const ok = u <= b && (alongX ? onSnow(plan, u, edge) : onSnow(plan, edge, u));
          if (ok && from === null) from = u;
          if (!ok && from !== null) { if (alongX) ridge.box(from, u - 0.5, 0, 0.075, edge - 0.16, edge + 0.16, 1.5); else ridge.box(edge - 0.16, edge + 0.16, 0, 0.075, from, u - 0.5, 1.5); from = null; }
        }
      }
    }
    const mat = std({ map: pv, roughness: 0.85, emissiveMap: pv, emissive: new THREE.Color(0.34, 0.38, 0.5), emissiveIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    add(paths.mesh(mat), ridge.mesh(snow));
    for (const c of G.plazas) {
      const g = new THREE.CircleGeometry(c.r, 48); g.rotateX(-Math.PI / 2); g.translate(c.x, 0.008, c.z);
      const p = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / S, p.getZ(i) / S);
      add(new THREE.Mesh(g, mat));
    }
  }

  // ------------------------------------------------------------------ the tree
  let bulbs = null;
  {
    const t = G.tree, tg = new THREE.Group(); tg.position.set(t.x, 0, t.z);
    const green = std({ color: 0x1d4a2c, roughness: 0.9, emissive: 0x0c2414, emissiveIntensity: 0.85, flatShading: true });
    put(tg, cyl, std({ color: 0x3a2a1c, roughness: 0.9, emissive: 0x16100a, emissiveIntensity: 0.6 }), 0, 1.1, 0, 0.27, 2.2, 0.27);
    const P = [], C = [], Ph = [], palette = [[2.6, 0.35, 0.3], [2.6, 1.9, 0.5], [0.4, 2.2, 0.7], [0.5, 0.9, 2.8], [2.4, 2.2, 1.8]];
    const tiers = 6;
    for (let i = 0; i < tiers; i++) {
      const r = 3.5 - i * 0.52, y = 1.4 + i * 1.55, h = 2.9;
      put(tg, new THREE.ConeGeometry(r, h, 14), green, 0, y + h / 2, 0);
      put(tg, new THREE.ConeGeometry(r * 0.76, h * 0.7, 14), white, 0, y + h * 0.65 + 0.03, 0).rotation.y = 0.2;       // snow lying on the upper boughs
      const n = 44 - i * 5;
      for (let j = 0; j < n; j++) {
        const a = j * 2.399 + i, s = 0.22 + 0.76 * ((j * 0.618) % 1), rr = r * s * 1.04, c = palette[(j + i) % palette.length];
        P.push(Math.cos(a) * rr, y + h * (1 - s), Math.sin(a) * rr); C.push(...c); Ph.push(((j * 7 + i * 13) % 97) / 97);
      }
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); bg.setAttribute('aPh', new THREE.Float32BufferAttribute(Ph, 1));
    bulbs = new THREE.Points(bg, new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 } },
      vertexShader: `attribute vec3 aCol; attribute float aPh; uniform float uT; varying vec3 vC;
        void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); float d = -mv.z;
          vC = aCol * (0.62 + 0.38 * sin(uT * (1.2 + aPh * 2.4) + aPh * 40.0));
          gl_PointSize = clamp(0.2 * projectionMatrix[1][1] * 400.0 / max(d, 0.05), 2.0, 26.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vC; void main() { float a = smoothstep(0.5, 0.05, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(vC * a, a); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    bulbs.frustumCulled = false; tg.add(bulbs);
    const top = 1.4 + (tiers - 1) * 1.55 + 2.9;
    put(tg, new THREE.OctahedronGeometry(0.42), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.5, 0.9) }), 0, top + 0.3, 0, 1, 1.5, 0.5);
    const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.radial(0, 1), color: new THREE.Color(1.1, 0.8, 0.35), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    flare.position.set(0, top + 0.3, 0); flare.scale.setScalar(5.5); tg.add(flare);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.55, 0.38, 0.18), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.014; pool.renderOrder = 4; tg.add(pool);
    group.add(tg);
    // Parcels underneath, tied with ribbon.
    const gold = std({ color: 0xe2be5a, roughness: 0.5, emissive: 0x6a5216, emissiveIntensity: 0.7 });
    for (const b of G.parcels) {
      const paper = std({ color: b.c, roughness: 0.7, emissive: b.c, emissiveIntensity: 0.4 });
      add(put(new THREE.Group(), box, paper, b.x, b.h / 2, b.z, b.w, b.h, b.w), put(new THREE.Group(), box, gold, b.x, b.h / 2, b.z, b.w * 0.18, b.h + 0.012, b.w + 0.012), put(new THREE.Group(), box, gold, b.x, b.h / 2, b.z, b.w + 0.012, b.h + 0.012, b.w * 0.18));
    }
  }

  // ------------------------------------------------------------------ fountains, off for the winter
  {
    const basin = (g, r, h) => {
      const wall = new THREE.LatheGeometry([new THREE.Vector2(r, 0), new THREE.Vector2(r, h), new THREE.Vector2(r - 0.32, h), new THREE.Vector2(r - 0.32, 0.12)], 36);
      put(g, wall, std({ color: 0xa9a294, roughness: 0.85, emissive: 0x3a3f4d, emissiveIntensity: 0.45, side: THREE.DoubleSide }), 0, 0, 0);
      put(g, cyl, white, 0, 0.1, 0, r - 0.3, 0.2, r - 0.3);                         // snow where the water was
      for (let i = 0; i < 9; i++) { const a = i * 0.7; put(g, ball, white, Math.cos(a) * (r - 0.16), h + 0.01, Math.sin(a) * (r - 0.16), 0.2, 0.07, 0.2); }     // and along the rim
    };
    const icicles = (g, x, y, z, r, n) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283 + x, len = 0.16 + ((i * 37) % 10) / 28; const m = put(g, spike, ice, x + Math.cos(a) * r, y - len / 2, z + Math.sin(a) * r, 0.028, len, 0.028); m.rotation.x = Math.PI; } };
    const board = (x, z, yaw) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw;
      put(g, box, std({ color: 0x3a2a1c, roughness: 0.9, emissive: 0x16100a, emissiveIntensity: 0.6 }), 0, 0.33, -0.02, 0.035, 0.66, 0.035);
      put(g, new THREE.PlaneGeometry(0.72, 0.36), new THREE.MeshBasicMaterial({ map: TX.notice(['Fountain off', 'for the winter']), color: new THREE.Color(0.6, 0.58, 0.54), side: THREE.DoubleSide }), 0, 0.72, 0);
      group.add(g);
    };
    for (const f of G.fountains) {
      const g = new THREE.Group(); g.position.set(f.x, 0, f.z);
      if (f.kind === 'triton') {
        // Milles's Tritons: sea-men standing in the basin, each holding a great shell over his head for the water to fall from.
        basin(g, f.r, 0.55);
        put(g, cyl, stone, 0, 0.45, 0, 0.7, 0.9, 0.7);
        for (let i = 0; i < 3; i++) {
          const a = i * 2.094 + 0.4, x = Math.cos(a) * 1.25, z = Math.sin(a) * 1.25;
          for (const s of [-1, 1]) put(g, cyl, verdigris, x + Math.cos(a + 1.57) * 0.1 * s, 0.75, z + Math.sin(a + 1.57) * 0.1 * s, 0.075, 1.1, 0.075);    // legs
          put(g, cyl, verdigris, x, 1.72, z, 0.2, 0.9, 0.15); put(g, ball, verdigris, x, 2.32, z, 0.15);                                                        // body, head
          for (const s of [-1, 1]) put(g, cyl, verdigris, x + Math.cos(a + 1.57) * 0.24 * s, 2.5, z + Math.sin(a + 1.57) * 0.24 * s, 0.05, 0.85, 0.05);      // arms up
          put(g, ball, verdigris, x, 3.0, z, 0.62, 0.16, 0.62); put(g, ball, white, x, 3.1, z, 0.5, 0.1, 0.5);                                                 // the shell, with snow in it
          icicles(g, x, 2.93, z, 0.56, 7);
        }
        board(f.x + 0.4, f.z - f.r - 0.8, Math.PI);
      } else {
        basin(g, f.r, 0.45);
        put(g, cyl, stone, 0, 0.75, 0, 0.17, 1.5, 0.17);
        put(g, new THREE.LatheGeometry([new THREE.Vector2(0.1, 0.1), new THREE.Vector2(1.0, 0.36), new THREE.Vector2(1.05, 0.34), new THREE.Vector2(0.7, 0.12), new THREE.Vector2(0.15, 0)], 28), std({ color: 0xa9a294, roughness: 0.85, emissive: 0x3a3f4d, emissiveIntensity: 0.45, side: THREE.DoubleSide }), 0, 1.38, 0);
        put(g, ball, white, 0, 1.68, 0, 0.92, 0.14, 0.92);
        icicles(g, 0, 1.72, 0, 1.02, 13);
        board(f.x + f.r + 0.9, f.z + f.r + 0.4, Math.PI / 4);
      }
      group.add(g);
    }
    board(G.fountain.x - 4.6, G.fountain.z + 5.0, -Math.PI / 4);
  }

  // ------------------------------------------------------------------ sculpture out of doors
  {
    const steel = std({ color: 0xcfd6dc, roughness: 0.28, metalness: 0.85, emissive: 0x566270, emissiveIntensity: 0.6 });
    const terra = std({ color: 0xc79a6a, roughness: 0.85, emissive: 0x7a5230, emissiveIntensity: 0.6, side: THREE.DoubleSide }), terra2 = std({ color: 0xa6774c, roughness: 0.85, emissive: 0x5e3c20, emissiveIntensity: 0.6 });
    for (const s of G.sculpt) {
      const g = new THREE.Group(); g.position.set(s.x, 0, s.z);
      if (s.kind === 'moore') {
        // Large Interior Form: one tall upright of bronze, swelling and pinching, pierced near the top.
        put(g, box, stone, 0, 0.15, 0, 1.5, 0.3, 1.5);
        put(g, ball, bronze, 0, 1.45, 0, 0.5, 1.2, 0.4); put(g, ball, bronze, 0.12, 2.9, 0.05, 0.4, 1.05, 0.34);
        const ring = put(g, new THREE.TorusGeometry(0.42, 0.15, 10, 20), bronze, 0.02, 4.05, 0); ring.scale.set(1, 1.25, 1); ring.rotation.y = 0.5;
        put(g, ball, bronze, -0.05, 4.85, 0, 0.3, 0.5, 0.26);
        for (const [x, y, z] of [[0, 2.2, 0.3], [0.1, 4.6, 0.2]]) put(g, ball, white, x, y + 0.42, z - 0.3, 0.26, 0.06, 0.24);       // snow on its shoulders
      } else if (s.kind === 'cubi') {
        // Cubi VII: boxes and slabs of burnished steel balanced one on another on a post.
        put(g, box, steel, 0, 0.06, 0, 1.0, 0.12, 1.0); put(g, cyl, steel, 0, 0.6, 0, 0.14, 1.0, 0.14);
        const parts = [[0, 1.42, 0.85, 0.7, 0.3, 0.12], [-0.3, 2.1, 0.5, 0.95, 0.3, 0.42], [0.36, 2.55, 0.62, 0.5, 0.3, -0.5], [0.05, 3.02, 0.46, 0.46, 0.28, 0.2]];
        for (const [x, y, w, h, d, rz] of parts) put(g, box, steel, x, y, 0, w, h, d).rotation.z = rz;
        put(g, box, white, 0.05, 3.28, 0, 0.42, 0.05, 0.26).rotation.z = 0.2;
      } else if (s.kind === 'arch') {
        // The arch off the front of Adler and Sullivan's Stock Exchange, kept when the building came down:
        // a tall block of ornamented terracotta with one round-headed opening, wide enough to drive or fly through.
        const a = new Geo(), tr = new Geo(), X = 0.65, sp = 2.3, R = s.open, n = 14;
        a.box(-X, X, 0, s.h, -s.half, -R, 2); a.box(-X, X, 0, s.h, R, s.half, 2); a.box(-X, X, sp + R, s.h, -R, R, 2);
        for (let i = 0; i < n; i++) {
          const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n, z0 = R * Math.cos(a0), z1 = R * Math.cos(a1), y0 = sp + R * Math.sin(a0), y1 = sp + R * Math.sin(a1);
          for (const [x, nx] of [[-X, -1], [X, 1]]) a.quad([x, y0, z0], [x, y1, z1], [x, sp + R, z1], [x, sp + R, z0], [nx, 0, 0]);
          a.quad([-X, y0, z0], [X, y0, z0], [X, y1, z1], [-X, y1, z1], [0, -1, 0]);                    // the underside of the arch
          const am = (a0 + a1) / 2, zc = (R + 0.3) * Math.cos(am), yc = sp + (R + 0.3) * Math.sin(am);
          tr.box(-X - 0.08, X + 0.08, yc - 0.24, yc + 0.24, zc - 0.24, zc + 0.24);                       // the ring of blocks round it
        }
        tr.box(-X - 0.14, X + 0.14, s.h - 0.5, s.h, -s.half - 0.14, s.half + 0.14); tr.box(-X - 0.08, X + 0.08, 0, 0.5, -s.half - 0.08, -R); tr.box(-X - 0.08, X + 0.08, 0, 0.5, R, s.half + 0.08);
        tr.box(-X - 0.06, X + 0.06, sp - 0.22, sp, -s.half, -R); tr.box(-X - 0.06, X + 0.06, sp - 0.22, sp, R, s.half);
        g.add(a.mesh(terra), tr.mesh(terra2));
        put(g, box, white, 0, s.h + 0.06, 0, X * 2 + 0.2, 0.12, s.half * 2 + 0.2);
      }
      group.add(g);
    }
    // The lions get their wreaths every December.
    const fir = std({ color: 0x1f5a30, roughness: 0.9, emissive: 0x0e2a16, emissiveIntensity: 0.9, flatShading: true }), bow = std({ color: 0xc8261c, roughness: 0.7, emissive: 0x6a100a, emissiveIntensity: 0.8 });
    for (const l of plan.lions) {
      const g = new THREE.Group(); g.position.set(l.x - 1.42, 2.6, l.z);
      const w = put(g, new THREE.TorusGeometry(0.62, 0.15, 7, 18), fir, 0, 0, 0); w.rotation.y = Math.PI / 2;
      put(g, box, bow, -0.16, -0.62, 0, 0.08, 0.2, 0.42);
      for (const sz of [-1, 1]) put(g, box, bow, -0.16, -0.88, sz * 0.13, 0.06, 0.4, 0.13).rotation.x = sz * 0.3;
      g.rotation.z = -0.22;                                  // hung round the neck, lying back against the mane
      group.add(g);
    }
  }

  // ------------------------------------------------------------------ the snow glitters
  // A field of glints that stays put on the ground while it follows the camera about. Each one
  // flashes only from certain directions, so they come and go as you drive past.
  const TILE = 44, NG = 9000;
  let glints;
  {
    // Where there is snow to glitter: not in buildings, not on the streets, the paths, the ice or the kit.
    const S = 2, cw = Math.ceil((B.x1 - B.x0) * S), ch = Math.ceil((B.z1 - B.z0) * S), cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const c = cv.getContext('2d'), rect = (q, m = 0) => c.fillRect((q.x0 - m - B.x0) * S, (q.z0 - m - B.z0) * S, (q.x1 - q.x0 + 2 * m) * S, (q.z1 - q.z0 + 2 * m) * S);
    c.fillStyle = '#fff'; c.fillRect(0, 0, cw, ch); c.fillStyle = '#000';
    for (const m of plan.masses) rect(m, 0.5);
    for (const q of plan.paved) rect(q); for (const q of plan.ice) rect(q, 0.4);
    rect({ x0: G.rail.x0, x1: G.rail.x1, z0: B.z0, z1: B.z1 });
    for (const s of plan.surfaces) if (!plan.rooms.some(r => s.x0 >= r.x0 && s.x1 <= r.x1 && s.z0 >= r.z0 && s.z1 <= r.z1)) rect(s, 0.1);
    for (const d of plan.decals) rect(d, 0.1);
    for (const p of G.plazas) { c.beginPath(); c.arc((p.x - B.x0) * S, (p.z - B.z0) * S, p.r * S, 0, 7); c.fill(); }
    const mask = new THREE.CanvasTexture(cv); mask.flipY = false; mask.colorSpace = THREE.NoColorSpace; mask.minFilter = mask.magFilter = THREE.LinearFilter; mask.generateMipmaps = false;
    const P = new Float32Array(NG * 3), seed = new Float32Array(NG), r = TX.rng(907);
    for (let i = 0; i < NG; i++) { P[i * 3] = r() * TILE; P[i * 3 + 1] = 0; P[i * 3 + 2] = r() * TILE; seed[i] = r(); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    glints = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: { uCam: { value: new THREE.Vector3() }, uT: { value: 0 }, uMask: { value: mask }, uB: { value: new THREE.Vector4(B.x0, B.z0, 1 / (B.x1 - B.x0), 1 / (B.z1 - B.z0)) }, uTile: { value: TILE } },
      vertexShader: `attribute float aSeed; uniform vec3 uCam; uniform float uT, uTile; uniform sampler2D uMask; uniform vec4 uB; varying float vA;
        void main() {
          vec2 w = uCam.xz + mod(position.xz - uCam.xz + uTile * 0.5, uTile) - uTile * 0.5;
          vec4 mv = viewMatrix * vec4(w.x, 0.02, w.y, 1.0); float d = -mv.z;
          float m = texture2D(uMask, (w - uB.xy) * uB.zw).r;
          vec3 to = normalize(uCam - vec3(w.x, 0.0, w.y));
          float ph = aSeed * 6.2832 + dot(to, vec3(41.0, 23.0, 31.0)) * (2.0 + aSeed * 5.0) + uT * (0.2 + aSeed);
          float s = pow(max(0.0, sin(ph)), 20.0);
          vA = s * step(0.5, m) * (1.0 - smoothstep(16.0, 30.0, d)) * smoothstep(0.25, 1.2, d);
          gl_PointSize = clamp(0.05 * projectionMatrix[1][1] * 400.0 / max(d, 0.05), 1.5, 6.0);
          gl_Position = vA > 0.01 ? projectionMatrix * mv : vec4(2.0, 2.0, 2.0, 1.0);
        }`,
      fragmentShader: `varying float vA; void main() { float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(vec3(1.7, 1.9, 2.5) * a * vA, a * vA); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    glints.frustumCulled = false; glints.renderOrder = 5; group.add(glints);
  }

  // ------------------------------------------------------------------ tyre tracks
  // Two ribbons laid down behind the back wheels wherever the car is on snow. The oldest stretch is
  // taken up to lay the newest, so there is always about three hundred metres of track on the ground.
  const NQ = 6000, HW = 0.034, TY = 0.004;
  const tp = new Float32Array(NQ * 12), tu = new Float32Array(NQ * 8), ti = new Uint16Array(NQ * 6);
  for (let q = 0; q < NQ; q++) ti.set([q * 4, q * 4 + 1, q * 4 + 2, q * 4, q * 4 + 2, q * 4 + 3], q * 6);
  const tg = new THREE.BufferGeometry(), tpa = new THREE.BufferAttribute(tp, 3), tua = new THREE.BufferAttribute(tu, 2);
  tpa.setUsage(THREE.DynamicDrawUsage); tua.setUsage(THREE.DynamicDrawUsage);
  tg.setAttribute('position', tpa); tg.setAttribute('uv', tua); tg.setIndex(new THREE.BufferAttribute(ti, 1));
  const tracks = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ map: TX.tread(), transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  tracks.frustumCulled = false; tracks.renderOrder = 3; group.add(tracks);
  let head = 0;
  const last = [null, null];
  const lay = (i, x, z) => {
    const L = last[i];
    if (!L) { last[i] = { x, z, d: 0, nx: 0, nz: 0, fresh: true }; return; }
    const dx = x - L.x, dz = z - L.z, d = Math.hypot(dx, dz);
    if (d < 0.07) return;
    if (d > 1.2) { last[i] = { x, z, d: 0, nx: 0, nz: 0, fresh: true }; return; }
    const nx = -dz / d * HW, nz = dx / d * HW, ax = L.fresh ? nx : L.nx, az = L.fresh ? nz : L.nz, o = head * 12, u = head * 8, v0 = L.d / 0.24, v1 = (L.d + d) / 0.24;
    tp.set([L.x - ax, TY, L.z - az, L.x + ax, TY, L.z + az, x + nx, TY, z + nz, x - nx, TY, z - nz], o);
    tu.set([0, v0, 1, v0, 1, v1, 0, v1], u);
    tpa.addUpdateRange(o, 12); tua.addUpdateRange(u, 8); tpa.needsUpdate = tua.needsUpdate = true;
    head = (head + 1) % NQ;
    L.x = x; L.z = z; L.d += d; L.nx = nx; L.nz = nz; L.fresh = false;
  };

  // ------------------------------------------------------------------ snow thrown up
  const NS = 220, sp = new Float32Array(NS * 3).fill(-99), sv = new Float32Array(NS * 3), sl = new Float32Array(NS), sa = new Float32Array(NS);
  const sg = new THREE.BufferGeometry(), spa = new THREE.BufferAttribute(sp, 3), saa = new THREE.BufferAttribute(sa, 1);
  spa.setUsage(THREE.DynamicDrawUsage); saa.setUsage(THREE.DynamicDrawUsage);
  sg.setAttribute('position', spa); sg.setAttribute('aA', saa);
  const spray = new THREE.Points(sg, new THREE.ShaderMaterial({
    vertexShader: `attribute float aA; varying float vA; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vA = aA; gl_PointSize = clamp(0.07 * projectionMatrix[1][1] * 400.0 / max(-mv.z, 0.05), 1.0, 16.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; void main() { float a = smoothstep(0.5, 0.1, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(vec3(0.86, 0.9, 1.0), a * vA * 0.85); }`,
    transparent: true, depthWrite: false,
  }));
  spray.frustumCulled = false; group.add(spray);
  let next = 0, live = 0;
  const fling = (x, y, z, vx, vy, vz, life) => { const i = next; next = (next + 1) % NS; sp[i * 3] = x; sp[i * 3 + 1] = y; sp[i * 3 + 2] = z; sv[i * 3] = vx; sv[i * 3 + 1] = vy; sv[i * 3 + 2] = vz; sl[i] = life; live = Math.max(live, life); };

  return {
    // A puff of snow, as when a snowman comes apart.
    burst(x, y, z, n = 40, power = 3) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, s = Math.random() * power; fling(x + (Math.random() - 0.5) * 0.4, y + Math.random() * 0.8, z + (Math.random() - 0.5) * 0.4, Math.cos(a) * s, 1 + Math.random() * power, Math.sin(a) * s, 0.5 + Math.random() * 0.6); } },
    // Rub out the tracks: a new night.
    clear() { tp.fill(0); tpa.clearUpdateRanges(); tpa.needsUpdate = true; head = 0; last[0] = last[1] = null; },
    // `car` is the car when it is the toy in use and its wheels are on the ground, else null.
    update(dt, t, cam, car, calm) {
      const out = glints.visible = bulbs.visible = cam.y < 60;
      if (out) { glints.material.uniforms.uCam.value.copy(cam); glints.material.uniforms.uT.value = calm ? 0 : t; bulbs.material.uniforms.uT.value = calm ? 0 : t; }
      let laid = false;
      if (car && onSnow(plan, car.pos.x, car.pos.z)) {
        const s = Math.sin(car.yaw), c = Math.cos(car.yaw), bx = car.pos.x - s * 0.14, bz = car.pos.z - c * 0.14;
        lay(0, bx - c * 0.135, bz + s * 0.135); lay(1, bx + c * 0.135, bz - s * 0.135);
        laid = true;
        // Snow off the back wheels when it is moving, more of it when the wheels are slipping.
        const v = Math.hypot(car.vel.x, car.vel.z), slip = Math.abs(car.vel.x * c - car.vel.z * s);
        if (v > 1.5 && !calm) for (let k = 0; k < (slip > 1.2 ? 3 : 1); k++) {
          const side = Math.random() < 0.5 ? -1 : 1;
          fling(bx + side * c * 0.135, 0.03, bz - side * s * 0.135, -car.vel.x * 0.18 + (Math.random() - 0.5) * (0.6 + slip * 0.5), 0.5 + Math.random() * (0.6 + v * 0.12), -car.vel.z * 0.18 + (Math.random() - 0.5) * (0.6 + slip * 0.5), 0.3 + Math.random() * 0.3);
        }
      }
      if (!laid) last[0] = last[1] = null;
      if (live > 0) {
        live -= dt;
        for (let i = 0; i < NS; i++) {
          if (sl[i] <= 0) { sa[i] = 0; continue; }
          sl[i] -= dt; sv[i * 3 + 1] -= 6 * dt;
          sp[i * 3] += sv[i * 3] * dt; sp[i * 3 + 1] = Math.max(0.01, sp[i * 3 + 1] + sv[i * 3 + 1] * dt); sp[i * 3 + 2] += sv[i * 3 + 2] * dt;
          sa[i] = Math.min(1, sl[i] * 4);
        }
        spa.needsUpdate = saa.needsUpdate = true;
      }
    },
  };
}
