// The sledding hill (features.js), in the south-west quarter of Butler Field between the cross path and the band shell.
// A real hill of snow, the kind every Chicago park piles up: a flat top with a warming hut and a string of lights round
// it, steps up the steep north face for people, a packed path up the west flank for anything on wheels, bare trees and
// buried bushes on its sides, drifts the wind has laid on it, sled tracks down every face, and sleds left lying about.
//
// Down its south-east face winds the sled run: a gate at the top, a drop, a banked hairpin right, a kicker, a banked
// hairpin left, a tunnel through a big drift, a banked right-hander, a second kicker and the finish, with a snow fence
// across the run-out. The clock starts at the gate; under GOOD seconds is the secret.
//
// The ground is one heightfield (sledland.js): the car drives on exactly the triangles that are drawn. The hill is one
// mesh, the props another, the bulbs one instanced mesh, the wires one more. Nothing moves but the clock and the twinkle.
import * as THREE from 'three';
import { feature } from './features.js';
import { buildLand, TOP, RUN_W, RUN_LIP, PATH_W, FINISH_S, TUNNEL, KICKERS, STAIR } from './sledland.js';
import { Bulbs, Wire, canvasTex, C, TAU } from './glowkit.js';

const GOOD = 14;                                  // seconds, gate to finish
const AREA = { x0: 298, x1: 388, z0: 108, z1: 218 };

const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const col = hex => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const SNOW = [0.86, 0.89, 0.96];

// Everything solid is built into one of these and drawn as one mesh: vertex colours, and lit a little from within by
// its own colour (as everything out of doors is here, so that it reads at night).
class Parts {
  constructor() { this.g = []; }
  // `snowy`: faces turned up further than this get snow on them instead of their colour.
  add(geo, c, M, snowy = 0) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone(); if (M) g.applyMatrix4(M);
    if (!g.attributes.normal) g.computeVertexNormals();
    const n = g.attributes.position.count, cc = new Float32Array(n * 3), N = g.attributes.normal;
    for (let i = 0; i < n; i++) { const s = snowy && N.getY(i) > snowy; cc.set(s ? SNOW : c, i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); this.g.push(g); return g;
  }
  box(w, h, d, c, M, snowy) { return this.add(new THREE.BoxGeometry(w, h, d), c, M, snowy); }
  mesh(glow = 0.22) {
    let n = 0; for (const g of this.g) n += g.attributes.position.count;
    const P = new Float32Array(n * 3), Nn = new Float32Array(n * 3), Cc = new Float32Array(n * 3); let o = 0;
    for (const g of this.g) { P.set(g.attributes.position.array, o * 3); Nn.set(g.attributes.normal.array, o * 3); Cc.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); geo.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, emissive: new THREE.Color(glow, glow, glow * 1.15) });
    m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vColor;'); };
    const mesh = new THREE.Mesh(geo, m); mesh.matrixAutoUpdate = false; return mesh;
  }
}
const M4 = (x, y, z, ry = 0, rx = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(s, s, s));
// A round rod from a to b (radius r0 at a, r1 at b).
function rod(P, a, b, r0, r1, c, snowy = 0, sides = 6) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length(); if (len < 1e-4) return;
  const g = new THREE.CylinderGeometry(r1, r0, len, sides, 1, true); g.translate(0, len / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  P.add(g, c, new THREE.Matrix4().compose(a, q, new THREE.Vector3(1, 1, 1)), snowy);
}

feature({
  id: 'sledding',
  secrets: [['sledding', 'Sledding']],
  init(k) {
    if (!k.plan.lakefront) return;
    const t0 = performance.now();
    const L = this.L = buildLand(), hAt = L.heightAt;
    this.k = k; this.t = 0;
    const g = this.g = new THREE.Group(); g.name = 'sledhill'; k.group.add(g);
    const O = this.O = k.plan.obstacles;
    // The ground, for the car: one surface over the whole hill whose height is the heightfield's, and a hill (it pulls
    // you down its slopes, and there is no getting under it). In plan.hills too, so that tyre tracks follow it.
    const S = this.surf = { skin: 'snow', hill: true, axis: 'hill', fn: hAt, x0: L.x0, x1: L.x1, z0: L.z0, z1: L.z1, h0: 0, h1: L.top, thick: 0, cx: (L.x0 + L.x1) / 2, cz: (L.z0 + L.z1) / 2, rx: (L.x1 - L.x0) / 2, rz: (L.z1 - L.z0) / 2, H: L.top, sled: true };
    k.plan.surfaces.push(S); if (k.plan.hills) k.plan.hills.push(S);
    // The top of the drift over the tunnel: a slab to drive across, with the bore under it.
    const T = L.tun, ft = T.floorAt;
    this.roof = { skin: 'snow', x0: T.x0, x1: T.x1, z0: T.z - TUNNEL.half, z1: T.z + TUNNEL.half, axis: null, h0: T.top, h1: T.top, thick: TUNNEL.thick, sled: true };
    k.plan.surfaces.push(this.roof); if (k.plan.slabs) k.plan.slabs.push(this.roof);

    g.add(this._ground(k));
    const P = new Parts(), B = this.bulbs = new Bulbs(), Wr = new Wire(0.012);
    this._tunnel(P, B, k);
    this._summit(P, B, Wr, k);
    this._stairs(P);
    this._path(P, B);
    this._gates(P, B, Wr, k);
    this._nature(P);
    this._sleds(P);
    g.add(P.mesh());
    B.build(g); const wm = Wr.mesh(); if (wm) g.add(wm);

    // The clock: from the gate on the top to the line at the bottom, along the run.
    const run = L.run, at = s => run[Math.min(run.length - 1, Math.round(s / 0.25))];
    const g0 = at(1.2), fin = at(FINISH_S);
    this.at = { x: TOP.x + 2, y: hAt(TOP.x + 2, TOP.z), z: TOP.z };
    this.timer = k.timer({
      id: 'sledding', name: 'SLED RUN', limit: 60, min: 4,
      start: { x0: TOP.x - 1, x1: g0.x, z0: g0.z - 3, z1: g0.z + 3, y0: L.top - 0.8 },
      finish: { x0: fin.x - RUN_W - 1.6, x1: fin.x + RUN_W + 1.6, z0: fin.z, z1: fin.z + 5 },
      inside: p => { const n = L.node(p.x, p.z); return n >= 0 && L.along[n] > 0.6; },      // (on the run, or close beside it, and past the gate)
      onStart: () => k.synth.chime([523, 784], { gap: 0.1, dur: 0.5 }),
      onFinish: t => { if (t < GOOD) { if (k.find('sledding')) k.callout('SLEDDING'); k.synth.chime([523, 659, 784, 1047]); } else k.say(`${t.toFixed(1)} s. Under ${GOOD} and the hill is yours.`, 3.5); },
    });
    this.built = performance.now() - t0;
  },

  // ============================================================ the ground
  _ground(k) {
    const L = this.L, { x0, z0, step, nx, nz, W, h } = L, sx = nx * step, sz = nz * step;
    const idx = [], pos = [], uv = [], uv1 = [], map = new Int32Array(W * (nz + 1)).fill(-1);
    const vert = n => {
      if (map[n] >= 0) return map[n];
      const i = n % W, j = (n - i) / W, x = x0 + i * step, z = z0 + j * step, y = h[n];
      // (the field's snow is drawn 3 cm under the ground the wheels run on: at its foot the hill comes down to meet it)
      map[n] = pos.length / 3; pos.push(x, y > 0.0005 ? y + 0.002 - 0.032 * (1 - Math.min(1, y / 0.15)) : -0.06, z); uv.push(x / 6, z / 6); uv1.push(i / nx, j / nz);
      return map[n];
    };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
      if (Math.max(h[a], h[b], h[c], h[d]) <= 0.0005) continue;
      const A = vert(a), Bv = vert(b), Cv = vert(c), D = vert(d);
      idx.push(A, Cv, Bv, Bv, Cv, D);            // (the same two triangles heightAt interpolates on)
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('uv1', new THREE.Float32BufferAttribute(uv1, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const { macro, norm } = this._paint(sx, sz);
    const m = new THREE.Mesh(geo, this._snowMat(k, macro, norm)); m.name = 'sledhill-ground'; m.matrixAutoUpdate = false; return m;
  },
  // The field's own snow (museum.js), so that the foot of the hill cannot be told from the field, times a picture of the
  // whole hill (its light and shade, its marks) read off uv1: 1.25 x what the picture holds, so that 204 is unchanged.
  _snowMat(k, macro, norm, tint = 1) {
    const tile = k.museum.snowTex.clone(); tile.needsUpdate = true;
    const mat = new THREE.MeshStandardMaterial({ map: tile, roughness: 1, emissiveMap: tile, emissive: new THREE.Color(0.2, 0.25, 0.4).multiplyScalar(tint), emissiveIntensity: 0.55, color: new THREE.Color(tint, tint, tint) });
    if (macro) {
      mat.normalMap = norm; mat.normalScale = new THREE.Vector2(1, 1);
      mat.onBeforeCompile = sh => {
        sh.uniforms.uMacro = { value: macro };
        sh.fragmentShader = 'uniform sampler2D uMacro;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  { vec3 mc = texture2D(uMacro, vNormalMapUv).rgb * 1.25; totalEmissiveRadiance *= mc; diffuseColor.rgb *= mc; }');
      };
    }
    return mat;
  },

  // The marks on the snow, painted once over the whole hill: sled tracks down the run and down every open face,
  // footprints up the path, the wind's ripples, dye lines across the run at the gate, the kickers and the finish.
  // Two textures over the hill's own uv1: what it glows (the colour of it at night) and how it is dented (a normal map).
  _paint(sx, sz) {
    const L = this.L, TW = 1200, TH = Math.round(TW * sz / sx), px = x => (x - L.x0) / sx * TW, pz = z => (z - L.z0) / sz * TH, ppm = TW / sx;
    const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH; const c = cv.getContext('2d');
    const hv = document.createElement('canvas'); hv.width = TW; hv.height = TH; const d = hv.getContext('2d');
    const r = rng(77), kindAt = (x, z) => { const n = L.node(x, z); return n < 0 ? 0 : L.kind[n]; };
    d.fillStyle = 'rgb(128,128,128)'; d.fillRect(0, 0, TW, TH);
    // The light and shade of the hill, as the moon low over the lake (east, a little north) lights it: flat snow is left
    // as it is, faces to the moon brighter, faces away from it and the hollows darker. Worked out at each grid point,
    // then laid over the whole picture smoothly.
    { const { W, nz, h, step } = L, sc = document.createElement('canvas'); sc.width = W; sc.height = nz + 1; const sg = sc.getContext('2d'), im = sg.createImageData(W, nz + 1);
      const lx = 0.887, ly = 0.292, lz = -0.357;
      for (let j = 0; j <= nz; j++) for (let i = 0; i < W; i++) {
        const n = j * W + i, a = h[i > 0 ? n - 1 : n], b = h[i < W - 1 ? n + 1 : n], u = h[j > 0 ? n - W : n], v = h[j < nz ? n + W : n];
        const gx = (b - a) / (2 * step), gz = (v - u) / (2 * step), l = Math.hypot(gx, 1, gz), dot = (-gx * lx + ly - gz * lz) / l, lap = (a + b + u + v - 4 * h[n]) / (step * step);
        const f = Math.max(0.7, Math.min(1.24, 1 + 0.6 * (dot - ly) - Math.max(-0.04, Math.min(0.12, lap * 0.1)))), o = n * 4;
        im.data[o] = im.data[o + 1] = 204 * f; im.data[o + 2] = Math.min(255, 204 * f * 1.02); im.data[o + 3] = 255;
      }
      sg.putImageData(im, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(sc, 0, 0, TW, TH); }
    // wind-polished patches and soft blue shadows in the snow
    for (let i = 0; i < 260; i++) { const x = r() * TW, y = r() * TH, R = (2 + r() * 6) * ppm; const gr = c.createRadialGradient(x, y, 0, x, y, R); const a = 0.05 + r() * 0.08; gr.addColorStop(0, r() < 0.5 ? `rgba(230,236,245,${a * 1.5})` : `rgba(150,168,205,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(x - R, y - R, 2 * R, 2 * R); }
    // the ripples: short wavy crests across the wind (from the north-west), on the open snow only
    d.lineCap = 'round';
    for (let i = 0; i < 5200; i++) {
      const x = L.x0 + r() * sx, z = L.z0 + r() * sz, kd = kindAt(x, z); if (kd && kd !== 4 && kd !== 5) continue; if (L.heightAt(x, z) < 0.05) continue;
      const len = (0.6 + r() * 2.2), a = Math.PI * 0.25 + (r() - 0.5) * 0.5, ux = Math.cos(a), uz = Math.sin(a);
      const X = px(x), Y = pz(z);
      d.lineWidth = 1.6; d.strokeStyle = 'rgba(160,160,160,0.55)'; d.beginPath(); d.moveTo(X, Y); d.quadraticCurveTo(X + ux * len * ppm * 0.5 + uz * 3, Y + uz * len * ppm * 0.5 - ux * 3, X + ux * len * ppm, Y + uz * len * ppm); d.stroke();
      d.strokeStyle = 'rgba(100,100,100,0.45)'; d.beginPath(); d.moveTo(X + 1.5, Y + 1.5); d.quadraticCurveTo(X + ux * len * ppm * 0.5 + uz * 3 + 1.5, Y + uz * len * ppm * 0.5 - ux * 3 + 1.5, X + ux * len * ppm + 1.5, Y + uz * len * ppm + 1.5); d.stroke();
    }
    // a groove: dark in the height, a little darker and bluer in the glow
    const groove = (pts, wide, deep, tint = 0.32) => {
      if (pts.length < 2) return;
      const line = (ctx, w, style, off = 0) => { ctx.lineWidth = w; ctx.strokeStyle = style; ctx.beginPath(); ctx.moveTo(px(pts[0][0]) + off, pz(pts[0][1]) + off); for (const p of pts) ctx.lineTo(px(p[0]) + off, pz(p[1]) + off); ctx.stroke(); };
      line(d, Math.max(1.5, wide * ppm * 1.8), `rgba(150,150,150,${0.5 * deep})`, -1);
      line(d, Math.max(1, wide * ppm), `rgba(40,40,40,${deep})`);
      line(c, Math.max(1, wide * ppm), `rgba(120,138,180,${tint})`);
    };
    c.lineCap = c.lineJoin = d.lineJoin = 'round';
    // down the run: runners in pairs, riding high round the banks; and the wide smear of saucers
    const run = L.run;
    for (let t = 0; t < 16; t++) {
      const o0 = (r() - 0.5) * 2.6, ph = r() * TAU, sled = r() < 0.75, pts = [[], []];
      for (let i = 0; i < run.length; i += 2) {
        const p = run[i], nx = -p.tz, nz = p.tx, bank = (p.bank || 0) * -Math.sign(p.kk || 0) * 0.55;
        const o = Math.max(-RUN_W + 0.2, Math.min(RUN_W - 0.2, o0 + 0.35 * Math.sin(p.s * 0.09 + ph) + bank));
        if (sled) for (const [m, sd] of [[0, -0.2], [1, 0.2]]) pts[m].push([p.x + nx * (o + sd), p.z + nz * (o + sd)]);
        else pts[0].push([p.x + nx * o, p.z + nz * o]);
      }
      if (sled) { groove(pts[0], 0.05, 0.75); groove(pts[1], 0.05, 0.75); } else groove(pts[0], 0.55, 0.22, 0.12);
    }
    // down the open faces: from high on the hill straight down the fall line, until the snow runs out or meets the run
    const fall = (x, z, sled) => {
      const pts = []; let px0 = x, pz0 = z;
      for (let i = 0; i < 260; i++) {
        const e = 0.3, hh = L.heightAt(px0, pz0), gx = L.heightAt(px0 + e, pz0) - L.heightAt(px0 - e, pz0), gz = L.heightAt(px0, pz0 + e) - L.heightAt(px0, pz0 - e), gl = Math.hypot(gx, gz);
        if (hh < 0.08 || gl < 1e-3) break; const kd = kindAt(px0, pz0); if (kd && kd !== 5 && kd !== 4 && i > 2) break;
        pts.push([px0, pz0]); px0 -= gx / gl * 0.4 + (r() - 0.5) * 0.04; pz0 -= gz / gl * 0.4 + (r() - 0.5) * 0.04;
      }
      if (pts.length < 6) return;
      if (sled) { const off = (pp, s) => pp.map((p, i) => { const q = pp[Math.min(pp.length - 1, i + 1)], o = pp[Math.max(0, i - 1)], l = Math.hypot(q[0] - o[0], q[1] - o[1]) || 1; return [p[0] - (q[1] - o[1]) / l * s, p[1] + (q[0] - o[0]) / l * s]; }); groove(off(pts, 0.2), 0.05, 0.7); groove(off(pts, -0.2), 0.05, 0.7); }
      else groove(pts, 0.6, 0.25, 0.12);
    };
    for (let i = 0; i < 70; i++) {
      const a = r() * TAU, rr = TOP.r + 0.6 + r() * 5, x = TOP.x + Math.cos(a) * rr, z = TOP.z + Math.sin(a) * rr;
      fall(x, z, r() < 0.7);
    }
    for (let i = 0; i < 50; i++) { const x = L.x0 + r() * sx, z = L.z0 + r() * sz; if (L.heightAt(x, z) > 2 && !kindAt(x, z)) fall(x, z, r() < 0.6); }
    // up the path: footprints, two by two, and the odd set wandering off it
    const path = L.path;
    for (let w = 0; w < 7; w++) {
      const o0 = (r() - 0.5) * 1.8, ph = r() * TAU;
      for (let i = 0, f = 0; i < path.length; i += 1.4 + r() * 0.3, f++) {
        const p = path[Math.floor(i)], nx = -p.tz, nz = p.tx, o = o0 + 0.3 * Math.sin(p.s * 0.2 + ph) + (f % 2 ? 0.13 : -0.13);
        const x = p.x + nx * o, z = p.z + nz * o, a = Math.atan2(p.tz, p.tx);
        for (const [ctx, st] of [[d, 'rgba(60,60,60,0.7)'], [c, 'rgba(140,150,180,0.35)']]) { ctx.fillStyle = st; ctx.beginPath(); ctx.ellipse(px(x), pz(z), 0.15 * ppm, 0.055 * ppm, a, 0, TAU); ctx.fill(); }
      }
    }
    // dye: red across the run at the gate and at the finish, blue at the lip of each kicker
    const dye = (s, style, wide) => { const p = run[Math.min(run.length - 1, Math.round(s / 0.25))], nx = -p.tz, nz = p.tx; c.lineWidth = wide * ppm; c.strokeStyle = style; c.beginPath(); c.moveTo(px(p.x - nx * (RUN_W + 0.4)), pz(p.z - nz * (RUN_W + 0.4))); c.lineTo(px(p.x + nx * (RUN_W + 0.4)), pz(p.z + nz * (RUN_W + 0.4))); c.stroke(); };
    dye(1.2, 'rgba(204,40,40,0.9)', 0.12); dye(FINISH_S, 'rgba(204,40,40,0.9)', 0.12);
    for (const q of KICKERS) { dye(q.s + q.len - 0.05, 'rgba(40,90,204,0.85)', 0.1); dye(q.s + q.len * 0.4, 'rgba(40,90,204,0.4)', 0.06); }
    // packed and a little icy-blue down the run, trodden grey up the path
    const band = (P, wide, style) => { c.lineWidth = wide * ppm; c.strokeStyle = style; c.beginPath(); c.moveTo(px(P[0].x), pz(P[0].z)); for (const p of P) c.lineTo(px(p.x), pz(p.z)); c.stroke(); };
    c.save(); c.globalCompositeOperation = 'multiply'; band(run, RUN_W * 2, 'rgb(208,224,255)'); band(L.path, PATH_W * 2, 'rgb(236,234,236)'); c.restore();
    const macro = new THREE.CanvasTexture(cv); macro.colorSpace = THREE.NoColorSpace; macro.flipY = false; macro.anisotropy = 4;
    // the normal map, from the dents
    const src = d.getImageData(0, 0, TW, TH).data, out = new Uint8Array(TW * TH * 4), Hh = (x, y) => src[((y < 0 ? 0 : y >= TH ? TH - 1 : y) * TW + (x < 0 ? 0 : x >= TW ? TW - 1 : x)) * 4] / 255;
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
      const gx = (Hh(x + 1, y) - Hh(x - 1, y)) * 3.2, gy = (Hh(x, y + 1) - Hh(x, y - 1)) * 3.2, l = Math.hypot(gx, gy, 1), o = (y * TW + x) * 4;
      out[o] = (0.5 - gx / l * 0.5) * 255; out[o + 1] = (0.5 - gy / l * 0.5) * 255; out[o + 2] = (0.5 + 0.5 / l) * 255; out[o + 3] = 255;
    }
    const norm = new THREE.DataTexture(out, TW, TH, THREE.RGBAFormat); norm.channel = 1; norm.wrapS = norm.wrapT = THREE.ClampToEdgeWrapping;
    norm.generateMipmaps = true; norm.minFilter = THREE.LinearMipmapLinearFilter; norm.magFilter = THREE.LinearFilter; norm.anisotropy = 4; norm.needsUpdate = true;
    return { macro, norm };
  },

  // ============================================================ the tunnel through the drift
  _tunnel(P, B, k) {
    const L = this.L, T = L.tun, f = T.floorAt, half = TUNNEL.half, R = half - 0.3, spring = 1.0, crown = 1.55;
    const snowM = this._snowMat(k, null, null, 0.85); snowM.side = THREE.DoubleSide;
    // the vault: half an ellipse from wall to wall, following the floor
    const pos = [], uv = [], idx = [], NA = 14, xs = [];
    for (let x = T.x0; x <= T.x1 + 1e-6; x += 0.5) xs.push(x);
    xs.forEach((x, a) => { const fy = f(x); for (let i = 0; i <= NA; i++) { const th = Math.PI * i / NA; pos.push(x, fy + spring + (crown - spring) * Math.sin(th), T.z - R * Math.cos(th)); uv.push(x / 6, th * R / 6); } });
    for (let a = 0; a < xs.length - 1; a++) for (let i = 0; i < NA; i++) { const p = a * (NA + 1) + i, q = p + NA + 1; idx.push(p, q, p + 1, p + 1, q, q + 1); }
    // the top over the bore, level with the drift either side
    const base = pos.length / 3; for (const [x, z] of [[T.x0, T.z - half], [T.x1, T.z - half], [T.x1, T.z + half], [T.x0, T.z + half]]) { pos.push(x, T.top + 0.006, z); uv.push(x / 6, z / 6); }
    idx.push(base, base + 3, base + 1, base + 1, base + 3, base + 2);
    const vg = new THREE.BufferGeometry(); vg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); vg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); vg.setIndex(idx); vg.computeVertexNormals();
    // the two faces of the drift, with the arch through them
    const faces = [];
    for (const x of [T.x0, T.x1]) {
      const fy = f(x), sh = new THREE.Shape([[-half, -0.3], [half, -0.3], [half, T.top - fy], [-half, T.top - fy]].map(([u, v]) => new THREE.Vector2(u, v)));
      const hole = new THREE.Path(); hole.moveTo(-R, -0.1); hole.lineTo(-R, spring);
      for (let i = 1; i <= NA; i++) { const th = Math.PI - Math.PI * i / NA; hole.lineTo(R * Math.cos(th), spring + (crown - spring) * Math.sin(th)); }
      hole.lineTo(R, -0.1); hole.lineTo(-R, -0.1); sh.holes.push(hole);
      const fg = new THREE.ShapeGeometry(sh, 4); fg.rotateY(-Math.PI / 2); fg.translate(x, fy, T.z);
      const p = fg.attributes.position, u = fg.attributes.uv; for (let i = 0; i < p.count; i++) u.setXY(i, p.getZ(i) / 6, p.getY(i) / 6);
      faces.push(fg);
      // lights round the arch, blue and white, and a row of them along the top of the drift
      for (let i = 0; i <= 16; i++) { const th = Math.PI * i / 16; B.add(x + (x === T.x0 ? -0.04 : 0.04), fy + spring + (crown - spring) * Math.sin(th) + 0.1, T.z - (R + 0.1) * Math.cos(th), i % 2 ? C.ice : C.white, i / 16, 1, 0.05); }
      for (let z = T.z - half; z <= T.z + half + 1e-6; z += 0.5) B.add(x, T.top + 0.08, z, C.blue, z * 0.2, 0, 0.045);
    }
    const fm = new THREE.Mesh(new THREE.BufferGeometry(), snowM);
    { const all = [vg, ...faces].map(q => q.index ? q.toNonIndexed() : q); let n = 0; for (const q of all) n += q.attributes.position.count; const Pp = new Float32Array(n * 3), Nn = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0; for (const q of all) { if (!q.attributes.normal) q.computeVertexNormals(); Pp.set(q.attributes.position.array, o * 3); Nn.set(q.attributes.normal.array, o * 3); U.set(q.attributes.uv.array, o * 2); o += q.attributes.position.count; } fm.geometry.setAttribute('position', new THREE.BufferAttribute(Pp, 3)); fm.geometry.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); fm.geometry.setAttribute('uv', new THREE.BufferAttribute(U, 2)); }
    fm.matrixAutoUpdate = false; this.g.add(fm);
    // The walls of the bore and of the cuts either end are walls, as high as the drift beside them.
    for (let x = Math.floor(T.cx - T.hx - 5); x < T.cx + T.hx + 5; x += 1) {
      let lo = 99; for (let u = x; u <= x + 1; u += 0.25) lo = Math.min(lo, Math.max(0, T.driftAt(u, T.z + half + 0.6) - 0.12), Math.max(0, T.driftAt(u, T.z - half - 0.6) - 0.12));
      const fy = Math.min(f(x), f(x + 1)); if (lo - fy < 0.3) continue;
      for (const s of [-1, 1]) this.O.push({ x0: x, x1: x + 1, z0: s < 0 ? T.z - half : T.z + half - 0.42, z1: s < 0 ? T.z - half + 0.42 : T.z + half, y0: fy - 0.6, y1: Math.min(lo, T.top - 0.12) });
    }
    void P;
  },

  // ============================================================ the top: the hut, the sign, the lights round it
  _summit(P, B, Wr, k) {
    const L = this.L, hAt = L.heightAt, top = hAt(TOP.x, TOP.z);
    const wood = col(0x5b3a22), dark = col(0x2e1d12), trim = col(0x7d2a22), green = col(0x22503a), stone = col(0x6f6a62);
    // The warming hut on the north side of the top, its door to the south: boards, a snowy gable roof, a lit window,
    // a stovepipe, a bench by the door and a lantern over it.
    const hx = 330, hz = 138.7, hw = 3.0, hd = 2.2, fy = Math.max(hAt(hx - hw / 2, hz - hd / 2), hAt(hx + hw / 2, hz - hd / 2), hAt(hx - hw / 2, hz + hd / 2), hAt(hx + hw / 2, hz + hd / 2));
    P.box(hw, 2.3, hd, wood, M4(hx, fy + 1.15 - 0.1, hz));
    for (let x = hx - hw / 2 + 0.15; x < hx + hw / 2; x += 0.3) P.box(0.03, 2.25, 0.02, dark, M4(x, fy + 1.1, hz + hd / 2 + 0.01));       // board joints
    for (const s of [-1, 1]) { const roof = new THREE.BoxGeometry(hw + 0.5, 0.12, hd / 2 / Math.cos(0.6) + 0.35); P.add(roof, wood, M4(hx, fy + 2.2 + 0.55, hz + s * hd / 4 + s * 0.08, 0, s * 0.6), 0.3); }
    { const gab = new THREE.BufferGeometry(); const y0 = fy + 2.2, y1 = fy + 2.2 + Math.tan(0.6) * hd / 2 + 0.05; for (const x of [hx - hw / 2, hx + hw / 2]) { gab.setAttribute('position', new THREE.Float32BufferAttribute([x, y0, hz - hd / 2, x, y0, hz + hd / 2, x, y1, hz, x, y0, hz + hd / 2, x, y0, hz - hd / 2, x, y1, hz], 3)); gab.computeVertexNormals(); P.add(gab.clone(), wood); } }
    P.box(0.9, 1.9, 0.06, dark, M4(hx - 0.7, fy + 0.95, hz + hd / 2 + 0.03));                                      // the door
    P.box(1.15, 0.08, 0.1, trim, M4(hx + 0.75, fy + 1.0, hz + hd / 2 + 0.05)); P.box(1.15, 0.08, 0.1, trim, M4(hx + 0.75, fy + 1.82, hz + hd / 2 + 0.05));
    { const win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.72), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.0, 0.45) })); win.position.set(hx + 0.75, fy + 1.41, hz + hd / 2 + 0.035); win.matrixAutoUpdate = false; win.updateMatrix(); this.g.add(win); }
    rod(P, new THREE.Vector3(hx + 0.9, fy + 2.4, hz - 0.4), new THREE.Vector3(hx + 0.9, fy + 3.6, hz - 0.4), 0.09, 0.09, col(0x2a2a2a), 0, 8);
    P.box(1.6, 0.07, 0.4, wood, M4(hx + 0.75, fy + 0.45, hz + hd / 2 + 0.45), 0.5); for (const dx of [-0.65, 0.65]) P.box(0.08, 0.42, 0.34, dark, M4(hx + 0.75 + dx, fy + 0.22, hz + hd / 2 + 0.45));
    B.add(hx - 0.7, fy + 2.15, hz + hd / 2 + 0.2, C.warm, 0, 2, 0.07);
    this.O.push({ x0: hx - hw / 2 - 0.05, x1: hx + hw / 2 + 0.05, z0: hz - hd / 2 - 0.05, z1: hz + hd / 2 + 0.7, y0: fy - 1, y1: fy + 3.6 });
    // The sign on the end wall that faces the top of the path: carved, painted, the name in cream on green with a toboggan under it.
    const tex = canvasTex(1024, 320, (c, w, h) => {
      c.fillStyle = '#5a3a22'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(30,18,8,${0.15 + Math.random() * 0.2})`; c.lineWidth = 1 + Math.random() * 2; c.beginPath(); const y = Math.random() * h; c.moveTo(0, y); c.bezierCurveTo(w * 0.3, y + 8, w * 0.6, y - 8, w, y + 3); c.stroke(); }
      const rr = (x, y, ww, hh, rad) => { c.beginPath(); c.moveTo(x + rad, y); c.arcTo(x + ww, y, x + ww, y + hh, rad); c.arcTo(x + ww, y + hh, x, y + hh, rad); c.arcTo(x, y + hh, x, y, rad); c.arcTo(x, y, x + ww, y, rad); c.closePath(); };
      rr(18, 18, w - 36, h - 36, 40); c.fillStyle = '#1f4a36'; c.fill(); c.lineWidth = 8; c.strokeStyle = '#c8402e'; rr(34, 34, w - 68, h - 68, 30); c.stroke();
      c.fillStyle = '#f3ead2'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = "800 118px Georgia, 'Times New Roman', serif"; c.fillText('SLEDDING HILL', w / 2, h * 0.43);
      // a toboggan with a curl, flying, with lines behind it
      c.strokeStyle = '#f3ead2'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(w / 2 - 110, h * 0.78); c.lineTo(w / 2 + 80, h * 0.78); c.arc(w / 2 + 80, h * 0.78 - 24, 24, Math.PI / 2, -Math.PI / 2 + 0.6, true); c.stroke();
      c.lineWidth = 5; for (const dy of [-12, 0, 12]) { c.beginPath(); c.moveTo(w / 2 - 170, h * 0.75 + dy); c.lineTo(w / 2 - 130, h * 0.75 + dy); c.stroke(); }
      const flake = (x, y, s) => { c.lineWidth = 4; for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; c.beginPath(); c.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s); c.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); c.stroke(); } };
      c.strokeStyle = '#bfe0f2'; flake(110, h / 2, 34); flake(w - 110, h / 2, 34);
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.625), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, emissiveMap: tex, emissive: new THREE.Color(0.6, 0.6, 0.6) }));
    sign.position.set(hx - hw / 2 - 0.05, fy + 1.55, hz); sign.rotation.y = -Math.PI / 2; sign.matrixAutoUpdate = false; sign.updateMatrix(); this.g.add(sign);
    P.box(0.04, 0.72, 2.1, dark, M4(hx - hw / 2 - 0.02, fy + 1.55, hz));                                  // its backing board
    B.add(hx - hw / 2 - 0.25, fy + 2.05, hz - 1.15, C.warm, 0.3, 2, 0.05); B.add(hx - hw / 2 - 0.25, fy + 2.05, hz + 1.15, C.warm, 0.6, 2, 0.05);
    // Lights strung on poles right round the top, over the run and the path where they leave it.
    const R = TOP.r + 0.9, poles = [];
    for (const deg of [-55, -25, 20, 50, 80, 110, 140, 175, -150, -118]) { const a = deg * Math.PI / 180, x = TOP.x + Math.cos(a) * R, z = TOP.z + Math.sin(a) * R, y = hAt(x, z); poles.push([x, y, z]); }
    const palette = [C.red, C.green, C.gold, C.blue, C.warm, C.pink];
    let nb = 0;
    poles.forEach(([x, y, z], i) => {
      rod(P, new THREE.Vector3(x, y - 0.3, z), new THREE.Vector3(x, y + 3.0, z), 0.05, 0.04, dark, 0.7, 6);
      this.O.push({ x0: x - 0.08, x1: x + 0.08, z0: z - 0.08, z1: z + 0.08, y0: y - 1, y1: y + 3 });
      const [x2, y2, z2] = poles[(i + 1) % poles.length], a = [x, y + 2.95, z], b = [x2, y2 + 2.95, z2], pts = [];
      for (let t = 0; t <= 1.0001; t += 1 / 16) pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - 0.55 * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t]);
      Wr.stroke(pts, [0.08, 0.08, 0.09]);
      for (let j = 1; j < 16; j += 1.4) { const p = pts[Math.floor(j)]; B.add(p[0], p[1] - 0.07, p[2], palette[nb++ % palette.length], nb * 0.13, 0, 0.055); }
    });
    // a pair of old millstones somebody set as seats at the top, and a bin
    for (const [x, z] of [[326.2, 146.5], [327.5, 147.6]]) { const y = hAt(x, z); P.add(new THREE.CylinderGeometry(0.42, 0.45, 0.42, 16), stone, M4(x, y + 0.19, z), 0.6); this.O.push({ x0: x - 0.45, x1: x + 0.45, z0: z - 0.45, z1: z + 0.45, y0: y - 1, y1: y + 0.42 }); }
    { const x = 333.4, z = 137.8, y = hAt(x, z); P.add(new THREE.CylinderGeometry(0.24, 0.22, 0.85, 12, 1), green, M4(x, y + 0.42, z), 0.7); this.O.push({ x0: x - 0.26, x1: x + 0.26, z0: z - 0.26, z1: z + 0.26, y0: y - 1, y1: y + 0.86 }); }
    void top; void trim; void k;
  },

  // ============================================================ the steps up the north face
  _stairs(P) {
    const L = this.L, st = STAIR, len = st.z1 - st.z0, top = L.heightAt(st.x, st.z1 - 0.3), n = Math.round(top / 0.14), run = len / n, rise = top / n;
    const tread = col(0x6b4a2c), rail = col(0x4a3220), x = st.x;
    for (let i = 0; i < n; i++) {
      const z = st.z0 + (i + 0.5) * run, y = (i + 1) * rise;
      P.box(1.7, 0.07, run + 0.04, tread, M4(x, y - 0.035, z), 0.6);                       // the tread, snow on it
      P.box(1.7, rise, 0.05, col(0x5a3d24), M4(x, y - rise / 2, z - run / 2 + 0.025));       // the riser
    }
    for (const s of [-1, 1]) {
      const xs = x + s * 0.9;
      P.box(0.07, 0.24, len, rail, new THREE.Matrix4().makeRotationX(-Math.atan2(top, len)).premultiply(new THREE.Matrix4().makeTranslation(xs, top / 2 - 0.02, (st.z0 + st.z1) / 2)));      // the stringer
      for (let z = st.z0 + 0.3; z < st.z1; z += 2.2) { const y = (z - st.z0) / len * top; rod(P, new THREE.Vector3(xs, y - 0.2, z), new THREE.Vector3(xs, y + 0.95, z), 0.045, 0.045, rail, 0.7, 6); }
      rod(P, new THREE.Vector3(xs, 0.95, st.z0 + 0.3), new THREE.Vector3(xs, top + 0.95, st.z1), 0.035, 0.035, rail, 0.6, 6);
    }
    this.O.push({ x0: x - 1.0, x1: x + 1.0, z0: st.z0 - 0.2, z1: st.z1, y0: -1, y1: top + 1.2 });
  },

  // ============================================================ the path up, with lanterns
  _path(P, B) {
    const L = this.L, path = L.path, post = col(0x3a2a1a), iron = col(0x1c1c1e);
    for (let s = 3; s < L.pathLen - 5; s += 8) {
      const p = path[Math.round(s / (L.pathLen / path.length))] || path[path.length - 1], side = 1, d = PATH_W + 0.75, x = p.x - p.tz * d * side, z = p.z + p.tx * d * side, y = L.heightAt(x, z);
      rod(P, new THREE.Vector3(x, y - 0.3, z), new THREE.Vector3(x, y + 1.05, z), 0.045, 0.04, post, 0.7, 6);
      P.box(0.16, 0.2, 0.16, iron, M4(x, y + 1.15, z)); P.add(new THREE.ConeGeometry(0.15, 0.1, 4), iron, M4(x, y + 1.3, z, Math.PI / 4), 0.5);
      B.add(x, y + 1.15, z, C.warm, s * 0.07, 2, 0.06);
      this.O.push({ x0: x - 0.1, x1: x + 0.1, z0: z - 0.1, z1: z + 0.1, y0: y - 1, y1: y + 1.35 });
    }
  },

  // ============================================================ the gate at the top, the line at the bottom, the snow fence
  _gates(P, B, Wr, k) {
    const L = this.L, run = L.run, at = s => run[Math.min(run.length - 1, Math.round(s / 0.25))];
    const banner = (a, b) => canvasTex(512, 96, (c, w, h) => { const n = 16, q = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) { c.fillStyle = (i + j) % 2 ? a : b; c.fillRect(i * q, j * h / 3, q, h / 3); } });
    const arch = (s, tex, lights, wide) => {
      const p = at(s), nx = -p.tz, nz = p.tx, d = RUN_W + wide, H = 2.6, pts = [];
      for (const sd of [-1, 1]) {
        const x = p.x + nx * d * sd, z = p.z + nz * d * sd, y = L.heightAt(x, z); pts.push([x, y, z]);
        rod(P, new THREE.Vector3(x, y - 0.4, z), new THREE.Vector3(x, y + H, z), 0.07, 0.06, col(0x2e1d12), 0.7, 8);
        this.O.push({ x0: x - 0.1, x1: x + 0.1, z0: z - 0.1, z1: z + 0.1, y0: y - 1, y1: y + H });
      }
      const y = Math.max(pts[0][1], pts[1][1]) + H - 0.3, l = Math.hypot(pts[1][0] - pts[0][0], pts[1][2] - pts[0][2]);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(l, 0.42), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, color: new THREE.Color(1.25, 1.25, 1.25) }));
      m.position.set((pts[0][0] + pts[1][0]) / 2, y, (pts[0][2] + pts[1][2]) / 2); m.rotation.y = Math.atan2(-(pts[1][2] - pts[0][2]), pts[1][0] - pts[0][0]); m.matrixAutoUpdate = false; m.updateMatrix(); this.g.add(m);
      for (let i = 0; i <= 14; i++) { const t = i / 14; B.add(pts[0][0] + (pts[1][0] - pts[0][0]) * t, y + 0.26, pts[0][2] + (pts[1][2] - pts[0][2]) * t, lights[i % lights.length], t * 3, 1, 0.05); }
      return pts;
    };
    arch(1.2, banner('#1e6a3e', '#f4f1e8'), [C.green, C.white], 0.5);
    arch(FINISH_S, banner('#b3261e', '#f4f1e8'), [C.red, C.white], 1.0);
    // a red slatted snow fence across the end of the run-out, to stop anybody running on into the path
    const end = run[run.length - 1], fz = end.z + 2.6, fx0 = end.x - 6.5, fx1 = end.x + 6.5, red = col(0xb4362a), wire = [0.25, 0.25, 0.27];
    for (let x = fx0; x <= fx1; x += 0.11) { const y = L.heightAt(x, fz); P.box(0.04, 1.15, 0.015, red, M4(x, y + 0.55, fz, 0, 0, (Math.sin(x * 13) * 0.03))); }
    for (let x = fx0; x <= fx1 + 1e-6; x += 2.6) { const y = L.heightAt(x, fz); rod(P, new THREE.Vector3(x, y - 0.3, fz - 0.03), new THREE.Vector3(x, y + 1.3, fz - 0.03), 0.03, 0.03, col(0x3b3b3b), 0, 6); }
    for (const hy of [0.15, 0.6, 1.05]) { const pts = []; for (let x = fx0; x <= fx1 + 1e-6; x += 0.5) pts.push([x, L.heightAt(x, fz) + hy, fz + 0.012]); Wr.stroke(pts, wire, null, 0.006); }
    this.O.push({ x0: fx0 - 0.05, x1: fx1 + 0.05, z0: fz - 0.08, z1: fz + 0.06, y0: -1, y1: 1.3 });
    // bamboo stakes down both sides of the run, so that it can be read from the snow at a toy's height
    for (let s = 5; s < FINISH_S - 2; s += 7) for (const sd of [-1, 1]) {
      const p = at(s), nx = -p.tz, nz = p.tx, d = (RUN_W + 0.9) * sd, x = p.x + nx * d, z = p.z + nz * d;
      if (s > TUNNEL.s0 - 6 && s < TUNNEL.s1 + 6) continue;
      const y = L.heightAt(x, z);
      rod(P, new THREE.Vector3(x, y - 0.2, z), new THREE.Vector3(x, y + 0.75, z), 0.014, 0.012, col(0xc9a24a), 0, 5);
      P.add(new THREE.CylinderGeometry(0.016, 0.016, 0.12, 5), col(sd < 0 ? 0xd2482a : 0x2a6ad2), M4(x, y + 0.7, z));
      this.O.push({ x0: x - 0.03, x1: x + 0.03, z0: z - 0.03, z1: z + 0.03, y0: y - 1, y1: y + 0.75 });
    }
    // marker poles round the outsides of the turns, lit at the top
    for (const s of [24, 32.5, 41, 69, 77.5, 86, 115, 121]) {
      const p = at(s), sg = Math.sign(p.kk || 1), nx = -p.tz, nz = p.tx, d = -(RUN_W + RUN_LIP - 0.2) * sg, x = p.x + nx * d, z = p.z + nz * d, y = L.heightAt(x, z);
      rod(P, new THREE.Vector3(x, y - 0.3, z), new THREE.Vector3(x, y + 1.2, z), 0.022, 0.018, col(0xd85a1e), 0, 6);
      B.add(x, y + 1.25, z, C.orange, s * 0.1, 0, 0.05);
      this.O.push({ x0: x - 0.05, x1: x + 0.05, z0: z - 0.05, z1: z + 0.05, y0: y - 1, y1: y + 1.2 });
    }
    void k;
  },

  // ============================================================ trees and bushes
  _nature(P) {
    const L = this.L, r = rng(31), bark = col(0x3d2f25), twig = col(0x4a3c30);
    const ok = (x, z, m) => { const n = L.node(x, z); return n >= 0 && L.gap[n] > m && !L.kind[n] && L.heightAt(x, z) > 0.2 && !this.O.some(o => x > o.x0 - m && x < o.x1 + m && z > o.z0 - m && z < o.z1 + m); };
    // bare trees: a trunk dividing and dividing again, snow along the tops of the boughs
    const tree = (x, z, s, seed) => {
      const rr = rng(seed), y = L.heightAt(x, z) - 0.15;
      const grow = (a, dir, len, rad, depth) => {
        const b = a.clone().addScaledVector(dir, len); rod(P, a, b, rad, rad * 0.72, depth > 3 ? bark : twig, 0.55, depth > 3 ? 7 : 4);
        if (depth === 0) return;
        const n = depth > 3 ? 2 + (rr() < 0.5 ? 1 : 0) : 2;
        for (let i = 0; i < n; i++) {
          const yaw = rr() * TAU, tilt = 0.35 + rr() * 0.5, nd = new THREE.Vector3(Math.sin(tilt) * Math.cos(yaw), Math.cos(tilt), Math.sin(tilt) * Math.sin(yaw)).lerp(dir, 0.35).normalize();
          grow(b, nd, len * (0.62 + rr() * 0.18), rad * 0.62, depth - 1);
        }
      };
      grow(new THREE.Vector3(x, y, z), new THREE.Vector3((rr() - 0.5) * 0.12, 1, (rr() - 0.5) * 0.12).normalize(), 1.9 * s, 0.17 * s, 5);
      this.O.push({ x0: x - 0.22 * s, x1: x + 0.22 * s, z0: z - 0.22 * s, z1: z + 0.22 * s, y0: y - 1, y1: y + 6 * s });
    };
    let nt = 0; for (const [x, z, s] of [[312, 133, 1.15], [351, 128, 1.0], [373.5, 150, 0.9], [322.5, 176, 1.05], [348.5, 191.5, 0.95], [361, 167, 0.8], [313, 157, 0.85], [342, 121, 0.9]]) if (ok(x, z, 1.4)) tree(x, z, s, 100 + nt++);
    this.trees = nt;
    // bushes buried to their shoulders, a few twigs showing
    const bush = (x, z, s) => {
      const y = L.heightAt(x, z), n = 4 + Math.floor(r() * 4); let ext = 0;
      for (let i = 0; i < n; i++) {
        const a = r() * TAU, d = r() * 0.55 * s, rad = (0.32 + r() * 0.28) * s, bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d, by = L.heightAt(bx, bz) + rad * 0.35;
        const g = new THREE.SphereGeometry(rad, 10, 7), p = g.attributes.position; for (let j = 0; j < p.count; j++) { const f = 1 + Math.sin(p.getX(j) * 11 + i * 2) * Math.cos(p.getZ(j) * 9 - i) * 0.1; p.setXYZ(j, p.getX(j) * f, p.getY(j) * f * 0.72, p.getZ(j) * f); }
        g.computeVertexNormals(); P.add(g, col(0x3c4636), M4(bx, by, bz), 0.15); ext = Math.max(ext, d + rad);
      }
      for (let i = 0; i < 6; i++) { const a = r() * TAU, b = new THREE.Vector3(x + Math.cos(a) * 0.5 * s, y + 0.45 * s + r() * 0.3, z + Math.sin(a) * 0.5 * s); rod(P, new THREE.Vector3(x + Math.cos(a) * 0.2 * s, y + 0.2, z + Math.sin(a) * 0.2 * s), b, 0.012, 0.006, twig, 0, 3); }
      this.O.push({ x0: x - ext * 0.8, x1: x + ext * 0.8, z0: z - ext * 0.8, z1: z + ext * 0.8, y0: y - 1, y1: y + 0.8 * s });
    };
    const spots = [[318.5, 146], [313.5, 170], [321, 188], [316, 201.5], [326, 205], [340, 152], [355.5, 152], [365, 134], [330, 165], [333, 184.5], [356, 184.5], [377, 163], [372.5, 194], [311, 141], [345, 128.5], [337.5, 136.5]];
    let nb = 0; for (const [x, z] of spots) { if (ok(x, z, 1.0)) { bush(x, z, 0.9 + r() * 0.5); nb++; } }
    this.bushes = nb;
  },

  // ============================================================ sleds left lying about
  _sleds(P) {
    const L = this.L, wood = col(0x9a6a3c), rope = col(0xc9b48a), up = new THREE.Vector3(0, 1, 0);
    const lay = (x, z, yaw, build, rad) => {
      const e = 0.3, y = L.heightAt(x, z), n = new THREE.Vector3(L.heightAt(x - e, z) - L.heightAt(x + e, z), 2 * e, L.heightAt(x, z - e) - L.heightAt(x, z + e)).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(up, n).multiply(new THREE.Quaternion().setFromAxisAngle(up, yaw)), M = new THREE.Matrix4().compose(new THREE.Vector3(x, y + 0.02, z), q, new THREE.Vector3(1, 1, 1));
      build(M); this.O.push({ x0: x - rad, x1: x + rad, z0: z - rad, z1: z + rad, y0: y - 0.5, y1: y + 0.3 });
    };
    // a wooden toboggan: three long boards, cross bars, the front curled up and back, a rope along the side
    const toboggan = M => {
      const add = (geo, c, m) => P.add(geo, c, m.clone().premultiply(M));
      for (const dx of [-0.15, 0, 0.15]) {
        add(new THREE.BoxGeometry(0.14, 0.02, 1.5), wood, new THREE.Matrix4().makeTranslation(dx, 0.02, -0.15));
        for (let i = 1; i <= 7; i++) { const a = i / 7 * Math.PI * 0.95, R = 0.17; add(new THREE.BoxGeometry(0.14, 0.02, 0.08), wood, new THREE.Matrix4().makeRotationX(-a).premultiply(new THREE.Matrix4().makeTranslation(dx, 0.02 + R - Math.cos(a) * R, 0.6 + Math.sin(a) * R))); }
      }
      for (const z of [-0.75, -0.35, 0.05, 0.45]) add(new THREE.BoxGeometry(0.48, 0.025, 0.04), col(0x7a5030), new THREE.Matrix4().makeTranslation(0, 0.045, z));
      for (const sd of [-1, 1]) add(new THREE.CylinderGeometry(0.008, 0.008, 1.3, 4), rope, new THREE.Matrix4().makeRotationX(Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(sd * 0.25, 0.08, -0.1)));
    };
    // a plastic saucer: a shallow dish with two handles
    const saucer = c => M => {
      const prof = [[0, 0.02], [0.2, 0.025], [0.3, 0.05], [0.34, 0.09], [0.33, 0.1]].map(([a, b]) => new THREE.Vector2(a, b));
      P.add(new THREE.LatheGeometry(prof, 20), c, M);
      for (const sd of [-1, 1]) P.add(new THREE.TorusGeometry(0.05, 0.012, 4, 8, Math.PI), c, new THREE.Matrix4().makeTranslation(sd * 0.3, 0.1, 0).premultiply(M));
    };
    lay(334.5, 145.5, 0.4, toboggan, 0.9);
    lay(373.5, 199.5, -1.1, toboggan, 0.9);
    lay(347, 122.5, 2.0, toboggan, 0.9);
    lay(327.5, 139.3, 1.4, saucer(col(0x2f62c8)), 0.4);
    lay(361.5, 201.5, 0, saucer(col(0xd2302a)), 0.4);
    lay(309.5, 150, 0, saucer(col(0x2e9a54)), 0.4);
    lay(339, 198.5, 0, saucer(col(0xe2b21e)), 0.4);
  },

  active(k) { const p = k.pos; return !!this.L && p.x > AREA.x0 && p.x < AREA.x1 && p.z > AREA.z0 && p.z < AREA.z1; },
  update(dt, k) {
    this.t += dt; if (this.bulbs.u) this.bulbs.u.uT.value = this.t;
    const v = k.v, L = this.L;
    if (k.close(this.at, 5, 1.5)) k.once('sled-start', 'The top of the sledding hill. The clock starts at the gate.', 5);
    this.timer.update(dt);
    // Packed snow is quick: on the run, going down it, a push along the way you are going.
    if (v.kind === 'car' && !v.air && v.on === this.surf) {
      const n = L.node(v.pos.x, v.pos.z);
      if (n >= 0 && (L.kind[n] === 1 || L.kind[n] === 2)) {
        const tx = L.tan[n * 2], tz = L.tan[n * 2 + 1], along = v.vel.x * tx + v.vel.z * tz, sp = Math.hypot(v.vel.x, v.vel.z);
        if (along > 0.3 && sp < 12.5) { const f = 1 + 2.6 * dt / Math.max(sp, 0.5); v.vel.x *= f; v.vel.z *= f; }
      }
    }
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'sledding', name: `Sledding (under ${GOOD} s)`, ...this.at }] : []; },
  reset() { if (this.timer) this.timer.cancel(); },
});
