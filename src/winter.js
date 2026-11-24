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
import { onSnow, heightOf, carve } from './plan.js';
import { landAt, WIND } from './land.js';
import { snowLook } from './finish.js';
import { buildHills, hillMap } from './hills.js';      // the hills, drawn from their own shapes (hillshape.js)

export function buildWinter(museum, plan) {
  const G = plan.grounds, B = plan.bounds, group = museum.group;
  const fix = m => { m.matrixAutoUpdate = false; m.updateMatrix(); return m; };
  const add = (...ms) => { for (const m of ms) group.add(fix(m)); };
  const std = o => new THREE.MeshStandardMaterial(o);
  const snowTex = museum.snowTex;
  // The shovelled paths, less whatever of them a building now stands on: a path is not laid through a room.
  const openPaths = G.paths.flatMap(q => carve(q, plan.masses.filter(m => m.x0 < q.x1 && m.x1 > q.x0 && m.z0 < q.z1 && m.z1 > q.z0)));
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
    for (const q of openPaths) paths.quad([q.x0, 0.007, q.z0], [q.x1, 0.007, q.z0], [q.x1, 0.007, q.z1], [q.x0, 0.007, q.z1], [0, 1, 0], [[q.x0 / S, q.z0 / S], [q.x1 / S, q.z0 / S], [q.x1 / S, q.z1 / S], [q.x0 / S, q.z1 / S]]);
    // What came off the path lies in a bank down each side of it: on open ground that bank is part of the land (land.js:
    // the wheels ride it), and elsewhere, in the gardens, it is a low kerb of snow drawn here.
    const banked = (x, z) => landAt(plan.land, x, z) > 0.03;
    for (const q of openPaths) {
      const alongX = q.x1 - q.x0 > q.z1 - q.z0, a = alongX ? q.x0 : q.z0, b = alongX ? q.x1 : q.z1;
      for (const [edge, out] of alongX ? [[q.z0 - 0.16, q.z0 - 1.25], [q.z1 + 0.16, q.z1 + 1.25]] : [[q.x0 - 0.16, q.x0 - 1.25], [q.x1 + 0.16, q.x1 + 1.25]]) {
        let from = null;
        for (let u = a; u <= b + 0.26; u += 0.5) {
          const ok = u <= b && (alongX ? onSnow(plan, u, edge) && !banked(u, out) : onSnow(plan, edge, u) && !banked(out, u));
          if (ok && from === null) from = u;
          if (!ok && from !== null) { if (alongX) ridge.box(from, u - 0.5, 0, 0.075, edge - 0.16, edge + 0.16, 1.5); else ridge.box(edge - 0.16, edge + 0.16, 0, 0.075, from, u - 0.5, 1.5); from = null; }
        }
      }
    }
    const mat = std({ map: pv, roughness: 0.85, emissiveMap: pv, emissive: new THREE.Color(0.34, 0.38, 0.5), emissiveIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    add(paths.mesh(mat), ridge.mesh(snow));
    // No shovel leaves a ruled edge: along both sides of every path (these, and the park's east of Columbus Drive) the
    // snow runs in over the paving, thinning to nothing: translucent at its lip, drawn out in streaks down the wind, and
    // the stone dark and wet for a hand's width beyond it. One strip of the snow's own material down each edge, blended
    // (no cut-out: a cut-out edge is a row of teeth); it lies on the path, 1 cm over it.
    {
      const edge = new Geo(), LAP = 0.12, Y = 0.019;
      const all = [...openPaths, ...((plan.lakefront && plan.lakefront.paths) || [])];
      const snowy = (x, z) => onSnow(plan, x, z);
      for (const q of all) {
        const alongX = q.x1 - q.x0 > q.z1 - q.z0, a = alongX ? q.x0 : q.z0, b = alongX ? q.x1 : q.z1;
        if ((alongX ? q.z1 - q.z0 : q.x1 - q.x0) < 1.6) continue;
        for (const [e, s] of alongX ? [[q.z0, 1], [q.z1, -1]] : [[q.x0, 1], [q.x1, -1]]) {
          let from = null;
          for (let u = a; u <= b + 0.51; u += 0.5) {
            const ok = u <= b && (alongX ? snowy(u, e - s * 0.3) : snowy(e - s * 0.3, u));
            if (ok && from === null) from = u;
            if (!ok && from !== null) {
              // (wider on the edge the wind blows in over: the snow is carried further across the stone from there)
              const to = u - 0.5, W = 0.7 + 0.75 * Math.max(0, s * (alongX ? WIND[1] : WIND[0])), o = e - s * LAP, i = e + s * W, w = W + LAP;
              if (to - from > 0.4) { if (alongX) edge.quad([from, Y, o], [to, Y, o], [to, Y, i], [from, Y, i], [0, 1, 0], [[w, 1], [w, 1], [w, 0], [w, 0]]); else edge.quad([o, Y, from], [o, Y, to], [i, Y, to], [i, Y, from], [0, 1, 0], [[w, 1], [w, 1], [w, 0], [w, 0]]); }
              from = null;
            }
          }
        }
      }
      if (!edge.empty) {
        const st = snowTex.clone(); st.needsUpdate = true;
        const em = snowLook(std({ map: st, roughness: 0.95, emissiveMap: st, emissive: new THREE.Color(0.2, 0.25, 0.4), emissiveIntensity: 0.55, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
        // How much snow lies at each point of the strip is worked out there, from how far in over the paving it is (uv:
        // x, the strip's whole width in metres; y, 1 at its outer edge) and from the snow shader's own wind-laid tile
        // read lengthwise down the wind, so the lip is drawn out in streaks that way. Past the last of the snow, wet stone.
        const prev = em.onBeforeCompile;
        em.onBeforeCompile = (sh, r) => {
          prev.call(em, sh, r);
          sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `{
              float dm = (1.0 - vMapUv.y) * vMapUv.x, reach = vMapUv.x - 0.37;
              vec2 wq = vec2(-0.9435 * vSnowW.x + 0.3313 * vSnowW.y, -0.3313 * vSnowW.x - 0.9435 * vSnowW.y);
              float fine = texture2D(uSnowD, vec2(wq.y * 0.83, wq.x * 0.11)).b, broad = texture2D(uSnowD, vec2(wq.y * 0.19 + 0.4, wq.x * 0.027)).b;
              float s = (0.13 + reach * (0.15 + 0.95 * broad) - dm) * (1.8 / max(reach, 0.2)) + (fine - 0.45) * 2.1;
              float snowA = clamp(s, 0.0, 1.0) * 0.97, wet = clamp(s * 1.3 + 0.6, 0.0, 1.0) * 0.5, a = max(snowA, wet);
              outgoingLight = mix(vec3(0.004, 0.006, 0.012), outgoingLight, clamp(snowA / max(a, 0.001), 0.0, 1.0));
              diffuseColor.a = a;
            }
            #include <opaque_fragment>`);
        };
        em.customProgramCacheKey = () => 'snowlook-pathedge';
        const em2 = edge.mesh(em); em2.renderOrder = 1; add(em2);
      }
    }
    // Hollows where meltwater stood and froze (land.js PONDS): black ice with the snow blown thin over its edges. The
    // plan is told, so a wheel slides on it and it takes no tyre tracks and no glitter.
    for (const p of (plan.land && plan.land.ponds) || []) {
      const k = p.r * 0.72; plan.ice.push({ x0: p.x - k, x1: p.x + k, z0: p.z - k, z1: p.z + k, pond: true });
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d'), r = TX.rng(Math.round(p.x * 7 + p.z));
      const g = c.createRadialGradient(128, 128, 20, 128, 128, 128); g.addColorStop(0, '#0d1826'); g.addColorStop(0.75, '#152536'); g.addColorStop(1, '#2c4159'); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(150,185,215,${0.03 + r() * 0.06})`; c.beginPath(); c.ellipse(r() * 256, r() * 256, 10 + r() * 40, 6 + r() * 22, r() * 3, 0, 7); c.fill(); }      // cloudy ice
      c.strokeStyle = 'rgba(215,232,246,.5)'; c.lineWidth = 0.8;
      for (let i = 0; i < 7; i++) { let x = 128 + (r() - 0.5) * 60, y = 128 + (r() - 0.5) * 60, a = r() * 6.28; c.beginPath(); c.moveTo(x, y); for (let s = 0; s < 9; s++) { a += (r() - 0.5) * 0.9; x += Math.cos(a) * (8 + r() * 14); y += Math.sin(a) * (8 + r() * 14); c.lineTo(x, y); } c.stroke(); }      // cracks
      for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(225,238,250,${0.15 + r() * 0.3})`; c.beginPath(); c.arc(r() * 256, r() * 256, 0.5 + r() * 1.3, 0, 7); c.fill(); }      // bubbles
      for (let i = 0; i < 46; i++) { const a = r() * 6.28, d = 86 + r() * 44; c.fillStyle = `rgba(226,234,246,${0.25 + r() * 0.45})`; c.beginPath(); c.ellipse(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 8 + r() * 26, 5 + r() * 10, a + 1.57, 0, 7); c.fill(); }      // snow blown over the rim
      const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
      const n = 40, geo = new THREE.CircleGeometry(1, n), P = geo.attributes.position, U = geo.attributes.uv;
      for (let i = 1; i < P.count; i++) { const a = Math.atan2(P.getY(i), P.getX(i)), rr = (p.r + 0.35) * (1 + 0.07 * Math.sin(a * 3 + p.x) + 0.04 * Math.sin(a * 7 + p.z)); P.setXY(i, Math.cos(a) * rr, Math.sin(a) * rr); }
      for (let i = 0; i < P.count; i++) U.setXY(i, 0.5 + P.getX(i) / (2.3 * p.r), 0.5 + P.getY(i) / (2.3 * p.r));
      geo.rotateX(-Math.PI / 2); geo.translate(p.x, -0.012, p.z);
      add(new THREE.Mesh(geo, snowLook(std({ map: tx, roughness: 0.2, emissiveMap: tx, emissive: new THREE.Color(0.55, 0.62, 0.8), emissiveIntensity: 0.42, polygonOffset: true, polygonOffsetFactor: -1.5, polygonOffsetUnits: -1.5 }), { drift: 0, moon: 0, sheen: 0.5 })));
    }
    for (const c of G.plazas) {
      const g = new THREE.CircleGeometry(c.r, 48); g.rotateX(-Math.PI / 2); g.translate(c.x, 0.008, c.z);
      const p = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / S, p.getZ(i) / S);
      add(new THREE.Mesh(g, mat));
    }
  }

  // ------------------------------------------------------------------ hills
  // Shaped hills (hillshape.js) are one mesh, drawn by hills.js: scoured crests, soft hollows, the sled chute, bare ribs.
  group.add(buildHills(plan.hills || [], snowTex, museum));
  for (const h of plan.hills || []) {
    if (h.form) continue;                                 // (any left that is still a plain cosine mound)
    const n = Math.max(24, Math.round(h.rx * 3.2)), geo = new THREE.PlaneGeometry(h.rx * 2, h.rz * 2, n, n); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x / h.rx, z / h.rz); p.setY(i, d >= 1 ? -0.02 : heightOf(h, h.cx + x, h.cz + z) + 0.004); uv.setXY(i, (h.cx + x) / 6, (h.cz + z) / 6); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, snow); m.position.set(h.cx, 0, h.cz); add(m);
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
    }
    // The lights are wound round the outside of everything, boughs and the snow lying on them, so none is buried:
    // a string spiralling from the bottom to the top, and a ring of them along the hem of every tier.
    const env = yy => { let m = 0; for (let i = 0; i < tiers; i++) { const r = 3.5 - i * 0.52, y = 1.4 + i * 1.55, h = 2.9; if (yy >= y && yy <= y + h) m = Math.max(m, r * (1 - (yy - y) / h)); const y0 = y + h * 0.3 + 0.03; if (yy >= y0 && yy <= y0 + h * 0.7) m = Math.max(m, r * 0.76 * (1 - (yy - y0) / (h * 0.7))); } return m; };
    const bulb = (a, yy, out, k) => { const rr = env(yy) + out; P.push(Math.cos(a) * rr, yy, Math.sin(a) * rr); C.push(...palette[k % palette.length]); Ph.push(((k * 37) % 97) / 97); };
    const topY = 1.4 + (tiers - 1) * 1.55 + 2.9;
    for (let j = 0; j < 380; j++) { const t = j / 380; bulb(t * Math.PI * 2 * 11, 1.5 + t * (topY - 1.9), 0.09, j); }
    for (let i = 0; i < tiers; i++) { const r = 3.5 - i * 0.52, n = Math.round(r * 16); for (let j = 0; j < n; j++) bulb(j / n * Math.PI * 2 + i, 1.4 + i * 1.55 + 0.04, 0.06, j + i * 3); }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); bg.setAttribute('aPh', new THREE.Float32BufferAttribute(Ph, 1));
    bulbs = new THREE.Points(bg, new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 } },
      vertexShader: `attribute vec3 aCol; attribute float aPh; uniform float uT; varying vec3 vC;
        void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); float d = -mv.z;
          vC = aCol * (0.62 + 0.38 * sin(uT * (1.2 + aPh * 2.4) + aPh * 40.0));
          gl_PointSize = clamp(0.24 * projectionMatrix[1][1] * 400.0 / max(d, 0.05), 3.0, 26.0); gl_Position = projectionMatrix * mv; }`,
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
      b.parts = [put(new THREE.Group(), box, paper, b.x, b.h / 2, b.z, b.w, b.h, b.w), put(new THREE.Group(), box, gold, b.x, b.h / 2, b.z, b.w * 0.18, b.h + 0.012, b.w + 0.012), put(new THREE.Group(), box, gold, b.x, b.h / 2, b.z, b.w + 0.012, b.h + 0.012, b.w * 0.18)];
      add(...b.parts);       // kept, so that a parcel can be opened (src/presents.js)
    }
  }

  // ------------------------------------------------------------------ the snow glitters
  // A field of glints that stays put on the ground while it follows the camera about. Each one
  // flashes only from certain directions, so they come and go as you drive past.
  const TILE = 44, NG = 9000;
  // The hills, for the glints and the tyre tracks to follow. (One flat one if there are none, so the shader has something to read.)
  const HILLS = plan.hills && plan.hills.length ? plan.hills : [{ cx: 0, cz: 0, rx: 1, rz: 1, H: 0 }];
  const hillY = (x, z) => { let y = landAt(plan.land, x, z); for (const h of HILLS) if (h.H) y = Math.max(y, heightOf(h, x, z)); return y; };      // and the lie of the land (land.js)
  // How high a mark on the snow is drawn at (x, z): `lift` over the wheels' ground, as on the flat, where the land is
  // (the snow is drawn there to within a centimetre: snowfield.js); 2 cm clear on a hill, whose own mesh is coarser.
  const markY = (x, z, lift) => { const l = landAt(plan.land, x, z); let hl = 0; for (const h of HILLS) if (h.H) hl = Math.max(hl, heightOf(h, x, z)); return hl > l ? hl + 0.02 : l + lift; };
  // The land's heights for the shader: its grid as a texture, 0 to 2 m in the red, read between the points.
  // (every half metre over the part of it that is not flat, swells and drifts together)
  const LD = plan.land && plan.land.top ? plan.land : null, LS = 0.5, LR = LD && LD.rolls, LW = LD ? Math.ceil((LR.x1 - LR.x0) / LS) + 1 : 1, LH = LD ? Math.ceil((LR.z1 - LR.z0) / LS) + 1 : 1, landTex = (() => {
    const d = new Uint8Array(LW * LH);
    if (LD) for (let j = 0; j < LH; j++) for (let i = 0; i < LW; i++) d[j * LW + i] = Math.round(Math.min(1, landAt(LD, LR.x0 + i * LS, LR.z0 + j * LS) / 2) * 255);
    const t = new THREE.DataTexture(d, LW, LH, THREE.RedFormat); t.minFilter = t.magFilter = THREE.LinearFilter; t.colorSpace = THREE.NoColorSpace; t.unpackAlignment = 1; t.needsUpdate = true; return t;
  })(), landB = LD ? new THREE.Vector4(LR.x0, LR.z0, LW, LH) : new THREE.Vector4(0, 0, 1, 1);
  const HMAP = hillMap(HILLS, heightOf);
  let glints;
  {
    // Where there is snow to glitter: not in buildings, not on the streets, the paths, the ice or the kit.
    const S = 2, cw = Math.ceil((B.x1 - B.x0) * S), ch = Math.ceil((B.z1 - B.z0) * S), cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const c = cv.getContext('2d'), rect = (q, m = 0) => c.fillRect((q.x0 - m - B.x0) * S, (q.z0 - m - B.z0) * S, (q.x1 - q.x0 + 2 * m) * S, (q.z1 - q.z0 + 2 * m) * S);
    c.fillStyle = '#fff'; c.fillRect(0, 0, cw, ch); c.fillStyle = '#000';
    for (const m of plan.masses) rect(m, 0.5);
    for (const q of plan.paved) rect(q); for (const q of plan.ice) rect(q, 0.4);
    rect({ x0: G.rail.x0, x1: G.rail.x1, z0: B.z0, z1: B.z1 });
    for (const s of plan.surfaces) if (!s.hill && !plan.rooms.some(r => s.x0 >= r.x0 && s.x1 <= r.x1 && s.z0 >= r.z0 && s.z1 <= r.z1)) rect(s, 0.1);
    for (const d of plan.decals) rect(d, 0.1);
    for (const p of G.plazas) { c.beginPath(); c.arc((p.x - B.x0) * S, (p.z - B.z0) * S, p.r * S, 0, 7); c.fill(); }
    const mask = new THREE.CanvasTexture(cv); mask.flipY = false; mask.colorSpace = THREE.NoColorSpace; mask.minFilter = mask.magFilter = THREE.LinearFilter; mask.generateMipmaps = false;
    const P = new Float32Array(NG * 3), seed = new Float32Array(NG), r = TX.rng(907);
    for (let i = 0; i < NG; i++) { P[i * 3] = r() * TILE; P[i * 3 + 1] = 0; P[i * 3 + 2] = r() * TILE; seed[i] = r(); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    glints = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: { uCam: { value: new THREE.Vector3() }, uT: { value: 0 }, uMask: { value: mask }, uB: { value: new THREE.Vector4(B.x0, B.z0, 1 / (B.x1 - B.x0), 1 / (B.z1 - B.z0)) }, uTile: { value: TILE }, uHillMap: { value: HMAP.tex }, uHillBox: { value: HMAP.box }, uLand: { value: landTex }, uLandB: { value: landB } },
      vertexShader: `attribute float aSeed; uniform sampler2D uHillMap; uniform vec4 uHillBox; uniform vec3 uCam; uniform float uT, uTile; uniform sampler2D uMask, uLand; uniform vec4 uB, uLandB; varying float vA;
        void main() {
          vec2 w = uCam.xz + mod(position.xz - uCam.xz + uTile * 0.5, uTile) - uTile * 0.5;
          vec2 hq = (w - uHillBox.xy) * uHillBox.zw;              // the hills, as hills.js baked them (they have shapes of their own now)
          float gy = hq.x > 0.0 && hq.x < 1.0 && hq.y > 0.0 && hq.y < 1.0 ? texture2D(uHillMap, hq).r : 0.0;
          gy = max(gy, texture2D(uLand, ((w - uLandB.xy) / ${LS.toFixed(1)} + 0.5) / uLandB.zw).r * 2.0);
          vec4 mv = viewMatrix * vec4(w.x, gy + 0.03, w.y, 1.0); float d = -mv.z;
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
  // A wheel presses a rut into the snow, it does not paint a stripe on it: the ribbon is a rut seen from above. A lip of
  // snow squeezed up along each side, pale; inside each lip the wall of the rut, in shadow, darkest at the top; and the
  // packed floor between, a shade bluer than the snow, with the tread's chevrons pressed faintly into it.
  const rut = (() => {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, 64, 0);
    for (const [t, col] of [[0, 'rgba(226,235,250,0)'], [0.09, 'rgba(226,235,250,.14)'], [0.16, 'rgba(226,235,250,.2)'], [0.21, 'rgba(32,44,78,.7)'], [0.31, 'rgba(56,72,110,.5)'], [0.5, 'rgba(72,90,130,.4)'], [0.69, 'rgba(56,72,110,.5)'], [0.79, 'rgba(32,44,78,.7)'], [0.84, 'rgba(226,235,250,.2)'], [0.91, 'rgba(226,235,250,.14)'], [1, 'rgba(226,235,250,0)']]) g.addColorStop(t, col);
    c.fillStyle = g; c.fillRect(0, 0, 64, 128);
    c.fillStyle = 'rgba(30,40,68,.26)';
    for (let y = 0; y < 128; y += 16) { c.beginPath(); c.moveTo(15, y + 9); c.lineTo(32, y + 2); c.lineTo(49, y + 9); c.lineTo(49, y + 13); c.lineTo(32, y + 6); c.lineTo(15, y + 13); c.fill(); }
    c.fillStyle = 'rgba(232,240,252,.16)'; let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 40; i++) { const left = r() < 0.5; c.beginPath(); c.arc(left ? 2 + r() * 7 : 55 + r() * 7, r() * 128, 0.8 + r() * 1.8, 0, 7); c.fill(); }      // crumbs thrown out along the lips
    const t = new THREE.CanvasTexture(cv); t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  })();
  const NQ = 6000, HW = 0.044, TY = 0.004;
  const tp = new Float32Array(NQ * 12), tu = new Float32Array(NQ * 8), ti = new Uint16Array(NQ * 6);
  for (let q = 0; q < NQ; q++) ti.set([q * 4, q * 4 + 1, q * 4 + 2, q * 4, q * 4 + 2, q * 4 + 3], q * 6);
  const tg = new THREE.BufferGeometry(), tpa = new THREE.BufferAttribute(tp, 3), tua = new THREE.BufferAttribute(tu, 2);
  tpa.setUsage(THREE.DynamicDrawUsage); tua.setUsage(THREE.DynamicDrawUsage);
  tg.setAttribute('position', tpa); tg.setAttribute('uv', tua); tg.setIndex(new THREE.BufferAttribute(ti, 1));
  const tracks = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ map: rut, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  tracks.frustumCulled = false; tracks.renderOrder = 3; group.add(tracks);
  let head = 0;
  const last = [null, null];
  const lay = (i, x, z) => {
    const L = last[i], y1 = markY(x, z, TY);
    if (!L) { last[i] = { x, z, y: y1, d: 0, nx: 0, nz: 0, fresh: true }; return; }
    const dx = x - L.x, dz = z - L.z, d = Math.hypot(dx, dz);
    if (d < 0.07) return;
    if (d > 1.2) { last[i] = { x, z, y: y1, d: 0, nx: 0, nz: 0, fresh: true }; return; }
    const nx = -dz / d * HW, nz = dx / d * HW, ax = L.fresh ? nx : L.nx, az = L.fresh ? nz : L.nz, o = head * 12, u = head * 8, v0 = L.d / 0.24, v1 = (L.d + d) / 0.24;
    tp.set([L.x - ax, L.y, L.z - az, L.x + ax, L.y, L.z + az, x + nx, y1, z + nz, x - nx, y1, z - nz], o);
    tu.set([0, v0, 1, v0, 1, v1, 0, v1], u);
    tpa.addUpdateRange(o, 12); tua.addUpdateRange(u, 8); tpa.needsUpdate = tua.needsUpdate = true;
    head = (head + 1) % NQ;
    L.x = x; L.z = z; L.y = y1; L.d += d; L.nx = nx; L.nz = nz; L.fresh = false;
  };

  // ------------------------------------------------------------------ ploughed
  // A snowplough's blade (vehicles.js, car.blade) leaves a strip of packed snow a blade wide, a low white bank along each
  // side of it where the snow was pushed. The same kind of ribbon as the tyre tracks, wider, and one of them.
  const PQ = 2500, pp = new Float32Array(PQ * 12), pu = new Float32Array(PQ * 8), pi = new Uint16Array(PQ * 6);
  for (let q = 0; q < PQ; q++) pi.set([q * 4, q * 4 + 1, q * 4 + 2, q * 4, q * 4 + 2, q * 4 + 3], q * 6);
  const pg = new THREE.BufferGeometry(), ppa = new THREE.BufferAttribute(pp, 3), pua = new THREE.BufferAttribute(pu, 2);
  ppa.setUsage(THREE.DynamicDrawUsage); pua.setUsage(THREE.DynamicDrawUsage);
  pg.setAttribute('position', ppa); pg.setAttribute('uv', pua); pg.setIndex(new THREE.BufferAttribute(pi, 1));
  const plowT = (() => { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const c = cv.getContext('2d'), gr = c.createLinearGradient(0, 0, 64, 0);
    gr.addColorStop(0, 'rgba(250,252,255,0)'); gr.addColorStop(0.06, 'rgba(250,252,255,.95)'); gr.addColorStop(0.16, 'rgba(232,240,252,.85)'); gr.addColorStop(0.22, 'rgba(120,138,168,.62)');
    gr.addColorStop(0.78, 'rgba(120,138,168,.62)'); gr.addColorStop(0.84, 'rgba(232,240,252,.85)'); gr.addColorStop(0.94, 'rgba(250,252,255,.95)'); gr.addColorStop(1, 'rgba(250,252,255,0)');
    c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(90,105,135,${0.08 + Math.random() * 0.1})`; c.fillRect(16 + Math.random() * 32, Math.random() * 64, 1 + Math.random() * 3, 6 + Math.random() * 14); }      // the blade's scrape
    const t = new THREE.CanvasTexture(cv); t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const ploughed = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ map: plowT, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  ploughed.frustumCulled = false; ploughed.renderOrder = 2; group.add(ploughed);
  let phead = 0, plast = null;
  const plough = (x, z, hw) => {
    const L = plast, y1 = markY(x, z, TY * 0.6);
    if (!L) { plast = { x, z, y: y1, d: 0, nx: 0, nz: 0, fresh: true }; return; }
    const dx = x - L.x, dz = z - L.z, d = Math.hypot(dx, dz);
    if (d < 0.08) return;
    if (d > 1.2) { plast = { x, z, y: y1, d: 0, nx: 0, nz: 0, fresh: true }; return; }
    const nx = -dz / d * hw, nz = dx / d * hw, ax = L.fresh ? nx : L.nx, az = L.fresh ? nz : L.nz, o = phead * 12, u = phead * 8, v0 = L.d / 0.6, v1 = (L.d + d) / 0.6;
    pp.set([L.x - ax, L.y, L.z - az, L.x + ax, L.y, L.z + az, x + nx, y1, z + nz, x - nx, y1, z - nz], o);
    pu.set([0, v0, 1, v0, 1, v1, 0, v1], u);
    ppa.addUpdateRange(o, 12); pua.addUpdateRange(u, 8); ppa.needsUpdate = pua.needsUpdate = true;
    phead = (phead + 1) % PQ;
    L.x = x; L.z = z; L.y = y1; L.d += d; L.nx = nx; L.nz = nz; L.fresh = false;
  };

  // ------------------------------------------------------------------ snow thrown up
  // Clods and powder: each bit has a size of its own (a few big ones among many fine), and the fine ones thin to nothing as they go.
  const NS = 360, sp = new Float32Array(NS * 3).fill(-99), sv = new Float32Array(NS * 3), sl = new Float32Array(NS), sa = new Float32Array(NS), ss = new Float32Array(NS).fill(0.07);
  const sg = new THREE.BufferGeometry(), spa = new THREE.BufferAttribute(sp, 3), saa = new THREE.BufferAttribute(sa, 1), ssa = new THREE.BufferAttribute(ss, 1);
  spa.setUsage(THREE.DynamicDrawUsage); saa.setUsage(THREE.DynamicDrawUsage); ssa.setUsage(THREE.DynamicDrawUsage);
  sg.setAttribute('position', spa); sg.setAttribute('aA', saa); sg.setAttribute('aS', ssa);
  const spray = new THREE.Points(sg, new THREE.ShaderMaterial({
    vertexShader: `attribute float aA; attribute float aS; varying float vA; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vA = aA; gl_PointSize = clamp(aS * projectionMatrix[1][1] * 400.0 / max(-mv.z, 0.05), 1.0, 22.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; void main() { float a = smoothstep(0.5, 0.1, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(vec3(0.86, 0.9, 1.0), a * vA * 0.85); }`,
    transparent: true, depthWrite: false,
  }));
  spray.frustumCulled = false; group.add(spray);
  let next = 0, live = 0, owed = 0, airT = 0;
  const fling = (x, y, z, vx, vy, vz, life, size = 0.07) => { const i = next; next = (next + 1) % NS; sp[i * 3] = x; sp[i * 3 + 1] = y; sp[i * 3 + 2] = z; sv[i * 3] = vx; sv[i * 3 + 1] = vy; sv[i * 3 + 2] = vz; sl[i] = life; ss[i] = size; ssa.needsUpdate = true; live = Math.max(live, life); };

  return {
    // A puff of snow, as when a snowman comes apart.
    burst(x, y, z, n = 40, power = 3) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, s = Math.random() * power; fling(x + (Math.random() - 0.5) * 0.4, y + Math.random() * 0.8, z + (Math.random() - 0.5) * 0.4, Math.cos(a) * s, 1 + Math.random() * power, Math.sin(a) * s, 0.5 + Math.random() * 0.6); } },
    // Rub out the tracks: a new night.
    clear() { tp.fill(0); tpa.clearUpdateRanges(); tpa.needsUpdate = true; head = 0; last[0] = last[1] = null; pp.fill(0); ppa.clearUpdateRanges(); ppa.needsUpdate = true; phead = 0; plast = null; },
    // `car` is the car when it is the toy in use and its wheels are on the ground, else null.
    // hush: set true to put the glitter out for a while (the Home Run Derby, src/ballpark.js: nothing white flickering by the pitch)
    hush: false,
    update(dt, t, cam, car, calm) {
      const out = bulbs.visible = cam.y < 60; glints.visible = out && !this.hush;
      if (out) { glints.material.uniforms.uCam.value.copy(cam); glints.material.uniforms.uT.value = calm ? 0 : t; bulbs.material.uniforms.uT.value = calm ? 0 : t; }
      let laid = false;
      if (car && onSnow(plan, car.pos.x, car.pos.z)) {
        const s = Math.sin(car.yaw), c = Math.cos(car.yaw), bx = car.pos.x - s * 0.14, bz = car.pos.z - c * 0.14;
        lay(0, bx - c * 0.135, bz + s * 0.135); lay(1, bx + c * 0.135, bz - s * 0.135);
        laid = true;
        // A plough: the strip its blade has cleared, and the snow coming off the end of the blade (it is angled: off the right).
        const B = car.blade;
        if (B) {
          plough(car.pos.x + s * (B.z - 0.06), car.pos.z + c * (B.z - 0.06), B.hw);
          const v = Math.hypot(car.vel.x, car.vel.z);
          if (v > 0.6 && !calm) for (let k = 0; k < 2; k++) { const ex = car.pos.x + s * B.z - c * B.hw, ez = car.pos.z + c * B.z + s * B.hw; fling(ex, car.pos.y + 0.06, ez, -c * (0.8 + v * 0.35) + (Math.random() - 0.5) * 0.4, 0.5 + Math.random() * (0.4 + v * 0.15), s * (0.8 + v * 0.35) + (Math.random() - 0.5) * 0.4, 0.6 + Math.random() * 0.5); }
        } else plast = null;
        // Snow off the back wheels when it is moving, more of it when the wheels are slipping.
        // A tail of it off each back wheel, thrown back and up, longer the faster the car goes; in a slide it goes out
        // sideways, off the outside of the turn. So much a second, not so much a frame: the same at any frame rate.
        const v = Math.hypot(car.vel.x, car.vel.z), side = car.vel.x * c - car.vel.z * s, slip = Math.abs(side), R = Math.random;
        if (v > 1.2 && !calm) {
          owed = Math.min(12, owed + dt * (14 + v * 9 + Math.min(1, slip / 2) * 70));
          for (; owed >= 1; owed--) {
            const w = R() < 0.5 ? -1 : 1, big = R() < 0.14, out = side * (0.25 + R() * 0.35), up = (0.5 + R() * (0.7 + v * 0.16)) * (big ? 0.7 : 1);
            fling(bx + w * c * 0.135 + (R() - 0.5) * 0.04, car.pos.y + 0.03, bz - w * s * 0.135 + (R() - 0.5) * 0.04,
              -car.vel.x * (0.1 + R() * 0.16) + c * out + (R() - 0.5) * 0.5, up, -car.vel.z * (0.1 + R() * 0.16) - s * out + (R() - 0.5) * 0.5, big ? 0.45 + R() * 0.3 : 0.25 + R() * 0.35, big ? 0.034 + R() * 0.022 : 0.011 + R() * 0.017);
          }
        }
        // Coming down off a jump, a puff of it from under the car.
        if (airT > 0.3 && v > 1.5 && !calm) for (let i = 0, n = Math.min(34, 10 + airT * 30); i < n; i++) { const a = R() * 6.283, q = 0.5 + R() * 1.6; fling(car.pos.x + Math.cos(a) * 0.12, car.pos.y + 0.03, car.pos.z + Math.sin(a) * 0.12, Math.cos(a) * q + car.vel.x * 0.25, 0.6 + R() * 1.5, Math.sin(a) * q + car.vel.z * 0.25, 0.3 + R() * 0.4, 0.014 + R() * 0.03); }
      }
      airT = car ? 0 : Math.min(3, airT + dt);
      if (!laid) { last[0] = last[1] = null; plast = null; }
      if (live > 0) {
        live -= dt;
        for (let i = 0; i < NS; i++) {
          if (sl[i] <= 0) { sa[i] = 0; continue; }
          sl[i] -= dt; sv[i * 3 + 1] -= 6 * dt;
          sp[i * 3] += sv[i * 3] * dt; sp[i * 3 + 1] = Math.max(hillY(sp[i * 3], sp[i * 3 + 2]) + 0.01, sp[i * 3 + 1] + sv[i * 3 + 1] * dt); sp[i * 3 + 2] += sv[i * 3 + 2] * dt;
          sa[i] = Math.min(1, sl[i] * 4);
        }
        spa.needsUpdate = saa.needsUpdate = true;
      }
    },
  };
}
