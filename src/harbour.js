// The open water of Monroe Harbor, beyond the broken edge of the ice (features.js). What is here: the water itself, dark
// with a cold shimmer on it; the floes, which float, bob, rock and (the loose ones) turn slowly about where they lie, and
// whose surfaces are kept where they are drawn (harbourplan.js); the bits of broken ice too small to stand on; the lamp at
// the top of the harbour light and its turning beam. And going in: drive off the ice into the water and there is a
// splash, "Brr! Too cold!", and you are back on the ice (or the breakwater, if that is nearer). Get to the light, by the
// chain of floes and the slab up onto the breakwater, and it flashes and sounds its horn: a secret.
import * as THREE from 'three';
import * as TX from './textures.js';
import { feature } from './features.js';
import { floeTop, floeBox, WATER_Y } from './harbourplan.js';
import { groundAt } from './plan.js';
import { iceMoon, noises, iceBlockMaterial } from './icelook.js';
import { dealLOD } from './harbourkit.js';

const SECRET = 'harbourlight';

// A floe: a top over its outline (snow, with the ice showing where the wind has swept it), broken off unevenly round
// the lip, and raw ice down its sides: thin and glowing at the lip, going dark green-blue down into the water. The top is at 0 over the whole outline, as the solid is (harbourplan.js
// floeTop); only the lip, inside the outline's edge, falls away below it. UVs for the snow picture (the material's
// map), colours for the ice.
function floeGeo(poly, depth) {
  const P = [], N = [], U = [], C = [], top = [1, 0, 0], lipC = [0.45, 1, 0], hi = [0, 0.55, 0.1], low = [0, 0.12, 1], BV = 0.05;      // (red a top, green thin, blue deep: icelook.js iceBlockMaterial)
  let cu = 0, cv = 0; for (const [u, v] of poly) { cu += u; cv += v; } cu /= poly.length; cv /= poly.length;
  const tri = (a, b, c, ca, cb, cc, ua, ub, uc, want) => {
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    if (n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0) { [b, c] = [c, b]; [cb, cc] = [cc, cb]; [ub, uc] = [uc, ub]; n = n.map(x => -x); }
    const l = Math.hypot(...n) || 1; n = want.length > 3 ? want.slice(0, 3) : n.map(x => x / l);
    for (const [p, col, uv] of [[a, ca, ua], [b, cb, ub], [c, cc, uc]]) { P.push(...p); N.push(...n); C.push(...col); U.push(...uv); }
  };
  // the outline, cut into pieces no longer than 0.45, each point with the lip broken back from it by its own amount
  const ring = [];
  { let h = 7; const rr = () => ((h = (h * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < poly.length; i++) {
      const [ua, va] = poly[i], [ub, vb] = poly[(i + 1) % poly.length], n = Math.max(1, Math.ceil(Math.hypot(ub - ua, vb - va) / 0.45));
      for (let k = 0; k < n; k++) { const u = ua + (ub - ua) * k / n, v = va + (vb - va) * k / n, dx = cu - u, dz = cv - v, d = Math.hypot(dx, dz) || 1, b = BV * (0.5 + 1.1 * rr()); ring.push({ u, v, iu: u + dx / d * b, iv: v + dz / d * b }); }
    } }
  const tUV = (u, v) => [u / 2.6, v / 2.6];
  let along = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], out = [(a.u + b.u) / 2 - cu, 0, (a.v + b.v) / 2 - cv], len = Math.hypot(b.u - a.u, b.v - a.v);
    tri([cu, 0, cv], [a.iu, 0, a.iv], [b.iu, 0, b.iv], top, top, top, tUV(cu, cv), tUV(a.iu, a.iv), tUV(b.iu, b.iv), [0, 1, 0]);
    const ol = Math.hypot(out[0], out[2]) || 1, ch = [out[0] / ol, 1.1, out[2] / ol];
    tri([a.iu, 0, a.iv], [b.iu, 0, b.iv], [b.u, -BV, b.v], top, top, lipC, tUV(a.iu, a.iv), tUV(b.iu, b.iv), tUV(b.u, b.v), ch); tri([a.iu, 0, a.iv], [b.u, -BV, b.v], [a.u, -BV, a.v], top, lipC, lipC, tUV(a.iu, a.iv), tUV(b.u, b.v), tUV(a.u, a.v), ch);
    const s0 = along / 0.7, s1 = (along + len) / 0.7, y1 = -depth;
    tri([a.u, -BV, a.v], [b.u, -BV, b.v], [b.u, y1, b.v], hi, hi, low, [s0, 0], [s1, 0], [s1, depth / 2.5], out); tri([a.u, -BV, a.v], [b.u, y1, b.v], [a.u, y1, a.v], hi, low, low, [s0, 0], [s1, depth / 2.5], [s0, depth / 2.5], out);
    along += len;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  return g;
}

// The water: deep and dark, out to the horizon. A slow swell under it, in long bands lying along the shore that come in
// dark and light; the moon's glitter, fine and soft (only where two trains of ripples cross), thick on the moon's own
// bearing and next to nothing off it, running together far out into a road that narrows to the horizon. Against the
// breakwater it lies glassy, with pancake ice crowded up to the stone and grease ice between the pancakes. It reads
// the ice's small tile of noise (icelook.js), which is mipmapped, so the far water is calm and never crawls. No fog
// on it: far out it goes over to the colour of the lake painted on the horizon (skyline.js), so the sheet has no end.
function waterMaterial(bw) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uT: { value: 0 }, uMoonAt: { value: new THREE.Vector3(631, 162, -90) }, uN: { value: noises() }, uBW: { value: new THREE.Vector4(bw.x0, bw.x1, bw.z0, bw.z1) },
      uDeep: { value: new THREE.Color(0x0a1426) }, uSky: { value: new THREE.Color(0x2c3d66) }, uShim: { value: new THREE.Color(0xa8c8f0) }, uFar: { value: new THREE.Color(0x1f2d4e).multiplyScalar(1.3) },
    },
    vertexShader: `
      varying vec3 vW;
      void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `
      uniform float uT; uniform vec3 uMoonAt; uniform sampler2D uN; uniform vec3 uDeep, uSky, uShim, uFar; uniform vec4 uBW;
      varying vec3 vW;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec2 p = vW.xz;
        vec3 V = cameraPosition - vW; float dist = length(V); V /= dist;
        float near = clamp(1.0 - dist / 140.0, 0.0, 1.0);
        float dBW = length(max(max(uBW.xz - p, p - uBW.yw), 0.0)), glass = 1.0 - smoothstep(1.0, 9.0, dBW);           // how near the breakwater: in its lee the water lies still
        float sw = texture2D(uN, p * vec2(0.013, 0.0042) + vec2(uT * 0.0045, uT * 0.001)).r;                           // the swell: 19 m from crest to crest, crests 60 m long, coming in
        float sw2 = texture2D(uN, p * vec2(0.031, 0.011) + vec2(uT * 0.007, -uT * 0.002)).g;
        float heave = clamp((sw - 0.5) * 2.3 + (sw2 - 0.5) * 0.9, -1.0, 1.0) * (1.0 - 0.6 * glass);
        float fres = pow(1.0 - max(V.y, 0.0), 5.0);
        vec3 col = uDeep * (1.0 + 0.45 * heave - 0.3 * glass) + uSky * fres * (0.5 + 0.5 * heave);                     // a swell's face is dark, its back takes the sky
        vec2 d = normalize(p - cameraPosition.xz + vec2(1e-4)), toM = normalize(uMoonAt.xz - cameraPosition.xz);
        float axis = max(dot(d, toM), 0.0);
        vec2 q = vec2(dot(p, toM), dot(p, vec2(-toM.y, toM.x)));                                                       // down the moon's bearing, and across it
        float ga = texture2D(uN, q * vec2(0.27, 0.075) + vec2(uT * 0.021, uT * 0.006), -1.0).b;
        float gb = texture2D(uN, q * vec2(0.19, 0.052) - vec2(uT * 0.017, -uT * 0.004), -1.0).b;
        float spark = max(ga + gb - 1.03, 0.0); spark = spark * spark * 30.0 * (1.0 - 0.85 * glass);
        col += uShim * spark * (pow(axis, 26.0) + 0.004) * (0.8 + 0.6 * heave) * (0.45 + 1.5 * near);
        col += uShim * pow(axis, 110.0) * 0.5 * (0.75 + 0.5 * heave) * smoothstep(40.0, 200.0, dist);
        float pm = 1.0 - smoothstep(0.25, 2.2 + 1.8 * sw2, dBW);                                                       // pancake ice: thick against the stone, thinning out
        if (pm > 0.0) {
          vec2 wv = texture2D(uN, p * 0.13).rg - 0.5; vec3 pan = vec3(0.0); float cover = 0.0;
          for (int k = 0; k < 2; k++) {                                                                                 // two sizes of them, the ground they are laid out on pulled about so no rows show
            float cell = k == 0 ? 0.56 : 0.31; vec2 g = (p + wv * (k == 0 ? 1.3 : 0.8) + float(k) * 3.7) / cell, gi = floor(g); float h1 = hash(gi), h2 = hash(gi + 17.3);
            vec2 c = fract(g) - 0.5 - (vec2(h1, h2) - 0.5) * 0.3; float r = length(c), rad = (0.2 + 0.14 * h2) * (1.0 + 0.13 * sin(atan(c.y, c.x) * 3.0 + h1 * 6.283));
            float disc = (1.0 - smoothstep(rad - 0.05, rad, r)) * step(fract(h1 * 7.31), pm * (k == 0 ? 1.0 : 1.5) - 0.12);
            vec3 pc = mix(vec3(0.075, 0.105, 0.15), vec3(0.16, 0.2, 0.275), smoothstep(rad - 0.13, rad - 0.045, r)) * (0.75 + 0.4 * h2);      // grey slush, its rim knocked up white
            pan = mix(pan, pc, disc); cover = max(cover, disc);
          }
          col = mix(col, vec3(0.05, 0.075, 0.11), pm * pm * 0.65 * (0.5 + ga));                                        // grease ice between them
          col = mix(col, pan, cover * (0.65 + 0.3 * pm));
        }
        col = mix(col, uFar * (0.9 + 0.5 * pow(axis, 60.0)), smoothstep(110.0, 330.0, dist));
        gl_FragColor = vec4(max(col, 0.0), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

// A beam from the lamp: a long cone, brightest at the lamp and fading out along it.
function beamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uI: { value: 0.3 }, uC: { value: new THREE.Color(1.0, 0.42, 0.36) } },
    vertexShader: `varying float vD; void main() { vD = length(position) / 18.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uI; uniform vec3 uC; varying float vD; void main() { float a = pow(max(0.0, 1.0 - vD), 2.2) * uI; gl_FragColor = vec4(uC * a, 1.0); }`,
  });
}

feature({
  id: 'harbourlight',
  secrets: [[SECRET, 'The harbour light']],

  init(k) {
    const L = k.plan.lakefront; if (!L || !L.floes) return;
    this.L = L; this.t = 0; this.M = new THREE.Matrix4(); this.Q = new THREE.Quaternion(); this.Qy = new THREE.Quaternion(); this.P = new THREE.Vector3(); this.S = new THREE.Vector3(); this.N = new THREE.Vector3(); this.UP = new THREE.Vector3(0, 1, 0);
    const g = this.g = new THREE.Group(); k.group.add(g);
    if (k.museum && k.museum.moonAt) iceMoon(k.museum.moonAt);
    // the water
    { const w = L.water, far = 480, m = this.water = new THREE.Mesh(new THREE.PlaneGeometry(w.x1 - w.x0 + 1, w.z1 - w.z0 + 20 + far * 2), waterMaterial(L.breakwater));      // (well past both ends of the harbour: the lake)
      m.rotation.x = -Math.PI / 2; m.position.set((w.x0 + w.x1) / 2 - 0.5, WATER_Y, (w.z0 + w.z1) / 2); m.updateMatrix(); m.matrixAutoUpdate = false; m.frustumCulled = false; g.add(m);
      if (k.museum && k.museum.moonAt) m.material.uniforms.uMoonAt.value.copy(k.museum.moonAt); }
    // the floes: the chain's, one mesh each; the loose ones and the bits, instanced by outline
    // (src/icelook.js: broken ice. The loose floes are half swept bare; the chain's keep their snow, which is what the wheels grip on them.)
    const iceM = iceBlockMaterial({ foot: -0.27, patch: 0.8, scale: 1.7 }), routeM = iceBlockMaterial({ foot: -0.27, patch: 0.2, scale: 1 });
    this.floes = L.floes;
    let ph = 1;
    for (const f of L.floes) { f.p1 = (ph = (ph * 7.13) % 6.283); f.p2 = (ph * 3.7) % 6.283; f.p3 = (ph * 5.3) % 6.283; f.p0 = (ph * 2.1) % 6.283; f.w1 = 1.1 + (ph % 0.5); }
    for (const f of L.floes.filter(q => q.route)) { const m = f.mesh = new THREE.Mesh(floeGeo(f.poly, 0.36), routeM); m.matrixAutoUpdate = false; g.add(m); }
    this.inst = L.floeShapes.map((sh, i) => {
      const list = L.floes.filter(f => !f.route && f.shape === i); if (!list.length) return null;
      const m = new THREE.InstancedMesh(floeGeo(sh, 0.36), iceM, list.length); m.frustumCulled = false; g.add(m); list.forEach((f, j) => { f.inst = m; f.ix = j; });
      return m;
    }).filter(Boolean);
    this.bits = L.bits;
    this.bitInst = L.floeShapes.map((sh, i) => {
      const list = L.bits.filter(b => b.sh === i); if (!list.length) return null;
      const m = new THREE.InstancedMesh(floeGeo(sh, 0.16), iceM, list.length); m.frustumCulled = false; g.add(m); list.forEach((b, j) => { b.inst = m; b.ix = j; b.ph = (b.x * 1.7 + b.z * 0.9) % 6.283; });
      return m;
    }).filter(Boolean);
    // the lamp, its glass, its glow and its beams
    { const t = L.light, y = 5.48; this.lampAt = new THREE.Vector3(t.x, y, t.z);
      this.glass = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.74, 16, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.3, 0.28), transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
      this.glass.position.set(t.x, y, t.z);
      this.lamp = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 0.7, 0.55), fog: false })); this.lamp.position.set(t.x, y, t.z);
      this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.radial(0, 1.6), color: new THREE.Color(1.0, 0.25, 0.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      this.glow.scale.set(3, 3, 1); this.glow.position.set(t.x, y, t.z);
      this.halo = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1.6), color: new THREE.Color(0.22, 0.05, 0.04), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      this.halo.rotation.x = -Math.PI / 2; this.halo.position.set(t.x, WATER_Y + 0.03, t.z);
      const cone = new THREE.ConeGeometry(1.1, 18, 20, 1, true).translate(0, -9, 0).rotateZ(Math.PI / 2);
      this.beamM = beamMaterial();
      this.beam = new THREE.Group(); this.beam.position.set(t.x, y, t.z);
      for (const a of [0, Math.PI]) { const b = new THREE.Mesh(cone, this.beamM); b.rotation.y = a; b.frustumCulled = false; this.beam.add(b); }
      g.add(this.glass, this.lamp, this.glow, this.halo, this.beam); }
    // the trail of lanterns (harbourplan.js): poles, and a warm glow at the top of each; the ones on floes ride on them
    { const pole = new THREE.CylinderGeometry(0.02, 0.025, 0.8, 5).translate(0, 0.4, 0), cage = new THREE.BoxGeometry(0.1, 0.13, 0.1).translate(0, 0.84, 0);
      const poleM = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 0.8, emissive: 0x0c0a08 }), lit = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.5, 0.6) });
      const n = L.trail.length, gp = new Float32Array(n * 3);
      this.trail = L.trail.map((q, i) => {
        const o = new THREE.Group(), p = new THREE.Mesh(pole, poleM), c = new THREE.Mesh(cage, lit); o.add(p, c);
        if (q.floe && q.floe.mesh) { o.position.set(q.x - q.floe.hx, 0, q.z - q.floe.hz); q.floe.mesh.add(o); } else { o.position.set(q.x, q.y, q.z); g.add(o); }
        gp.set([q.x, q.y + 0.84, q.z], i * 3); return q;
      });
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(gp, 3));
      this.trailGlow = new THREE.Points(gg, new THREE.PointsMaterial({ size: 1.1, map: TX.radial(0, 1.6), color: new THREE.Color(1.0, 0.62, 0.25), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false }));
      this.trailGlow.frustumCulled = false; g.add(this.trailGlow); }
    // The way across, lit along the ground: a line of small lights up the launch ramps, over the floes and up the slab to
    // the breakwater, at the height of whatever is under each one (so over every ramp, never through anything). They
    // burn steadily while the toy is near (no pulse runs along them: nothing on the ground points the way but the lit route).
    { const pts = [];
      for (let i = 0; i + 1 < L.way.length; i++) {
        const [xa, za] = L.way[i], [xb, zb] = L.way[i + 1], n = Math.max(1, Math.round(Math.hypot(xb - xa, zb - za) / 0.45));
        for (let j = 0; j < n; j++) {
          const x = xa + (xb - xa) * j / n, z = za + (zb - za) * j / n, y = groundAt(k.plan, x, z, 1.5, 3);
          if (y > -0.05 && !(L.wet(x, z) && y < 0.04)) pts.push(x, y + 0.035, z);           // nothing over the open water between floes
        }
      }
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const lum = new Float32Array(pts.length / 3).map((_, i) => i); gg.setAttribute('lum', new THREE.BufferAttribute(lum, 1));
      this.wayM = new THREE.ShaderMaterial({
        uniforms: { uOn: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: 'uniform float uOn; attribute float lum; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vA = uOn * (0.52 + 0.1 * sin(lum * 2.4)); gl_PointSize = clamp(90.0 / -mv.z, 2.0, 14.0); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float d = dot(c, c); if (d > 0.25) discard; gl_FragColor = vec4(vec3(0.62, 0.92, 1.0) * vA * (1.0 - d * 4.0), 1.0); }',
      });
      this.way = new THREE.Points(gg, this.wayM); this.way.frustumCulled = false; g.add(this.way); }
    if (L.hut) this._hut(k, L.hut);
    this.splash = k.puffs(90, { color: 0xd8f0ff, size: 0.08 });
    this.sparks = k.puffs(80, { color: 0xffd0c0, size: 0.14 });
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.4, 40), new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.visible = false; g.add(this.ring);
    this.show = 0; this.armed = true; this.seq = null; this.pew = 6;
    this._float(0);
  },

  // The keeper's hut (harbourplan.js has where, and its solids): white boards, a red fascia, a flat roof under snow, a
  // red door onto the lane with a stone step and a lamp over it, a lit window looking west at the city and the museum,
  // a lifebuoy on the wall, and a striped scarf on a hook by the door. Drawn once, as one mesh a material.
  _hut(k, H) {
    const P = k.parts(), y = H.y, cx = (H.x0 + H.x1) / 2, cz = (H.z0 + H.z1) / 2, W = H.x1 - H.x0, D = H.z1 - H.z0, wallTop = H.h - 0.14;
    const tex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
    const boards = tex(128, 128, (g, w, h) => { g.fillStyle = '#e9e6dc'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(70,64,56,.45)'; g.fillRect(x, 0, 2, h); g.fillStyle = `rgba(120,110,96,${0.04 + (x % 48) / 900})`; g.fillRect(x + 3, 0, 12, h); } for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(90,80,70,.12)'; g.fillRect((i * 37) % w, (i * 53) % h, 1, 6 + (i % 5) * 3); } });
    boards.wrapS = boards.wrapT = THREE.RepeatWrapping; boards.repeat.set(2.2, 1.6);
    const door = tex(64, 128, (g, w, h) => { g.fillStyle = '#9c2a26'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(40,8,8,.55)'; g.lineWidth = 3; g.strokeRect(8, 10, w - 16, 46); g.strokeRect(8, 66, w - 16, 52); g.fillStyle = '#d8c070'; g.beginPath(); g.arc(w - 12, 64, 3.5, 0, 7); g.fill(); });
    const scarf = tex(16, 128, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? '#efe9da' : '#c0392b'; g.fillRect(0, i * 17, w, 17); } g.fillStyle = '#c0392b'; for (let x = 1; x < w; x += 3) g.fillRect(x, 119, 1.4, 9); g.fillStyle = 'rgba(0,0,0,.14)'; for (let x = 0; x < w; x += 3) g.fillRect(x, 0, 1, 119); });
    const em = (c, i = 0.45) => ({ emissive: new THREE.Color(c), emissiveIntensity: i });
    const wallM = new THREE.MeshStandardMaterial({ map: boards, roughness: 0.85, emissiveMap: boards, ...em(0xffffff, 0.22) });
    const redM = new THREE.MeshStandardMaterial({ color: 0xb01c24, roughness: 0.6, ...em(0x3a0608, 0.8) });
    const roofM = new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.9, ...em(0x0c0e14, 0.6) });
    const snowM = new THREE.MeshStandardMaterial({ color: 0xeef3ff, roughness: 0.9, ...em(0x5a6680, 0.55) });
    const snowTex = k.museum && k.museum.snowTex, roofSnowM = snowTex ? new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.3, 0.36, 0.52), emissiveIntensity: 0.55 }) : snowM;
    const stoneM = new THREE.MeshStandardMaterial({ color: 0x8d9096, roughness: 0.95, ...em(0x24272e, 0.6) });
    const doorM = new THREE.MeshStandardMaterial({ map: door, roughness: 0.7, emissiveMap: door, ...em(0xffffff, 0.25) });
    const scarfM = new THREE.MeshStandardMaterial({ map: scarf, roughness: 1, emissiveMap: scarf, ...em(0xffffff, 0.3), side: THREE.DoubleSide, alphaTest: 0.5 });
    const ironM = new THREE.MeshStandardMaterial({ color: 0x1d2026, roughness: 0.5, metalness: 0.4, ...em(0x0c0e14, 0.6) });
    const warm = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 1.35, 0.62) });
    const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    P.add(box(W, wallTop, D), wallM, cx, y + wallTop / 2, cz);                                         // the walls
    P.add(box(W + 0.02, 0.12, D + 0.02), redM, cx, y + wallTop - 0.06, cz);                             // the fascia under the roof
    P.add(box(W, 0.1, D), roofM, cx, y + wallTop + 0.05, cz);                                          // the roof
    P.add(box(W + 0.06, 0.05, D + 0.06), roofSnowM, cx, y + H.h - 0.025, cz);                           // and its snow, at the top you land on, over the eaves a little
    for (const [dx, dz, w, d] of [[0, -(D + 0.06) / 2, W + 0.06, 0.07], [0, (D + 0.06) / 2, W + 0.06, 0.07], [-(W + 0.06) / 2, 0, 0.07, D + 0.06], [(W + 0.06) / 2, 0, 0.07, D + 0.06]]) P.add(new THREE.CylinderGeometry(0.035, 0.035, 1, 6).rotateZ(Math.PI / 2).rotateY(w > d ? 0 : Math.PI / 2), roofSnowM, cx + dx, y + H.h - 0.03, cz + dz, 0, 0, 0, w > d ? w : 1, 1, w > d ? 1 : d);      // a rounded lip of it along each edge
    P.add(box(0.03, H.door.h, H.door.w), doorM, H.x1 + 0.006, y + H.door.h / 2 + 0.06, H.door.z);      // the door
    P.add(box(0.05, 0.06, H.door.w + 0.14), redM, H.x1 + 0.01, y + H.door.h + 0.09, H.door.z);           // its lintel
    { const s = H.step; P.add(box(s.x1 - s.x0, s.h, s.z1 - s.z0), stoneM, (s.x0 + s.x1) / 2, y + s.h / 2, (s.z0 + s.z1) / 2); }
    // the window on the west wall, looking back at the city: lit from inside, with a frame and glazing bars
    P.add(box(0.02, 0.5, 0.64), warm, H.x0 - 0.004, y + 1.25, cz);
    P.add(box(0.04, 0.06, 0.74), redM, H.x0 - 0.012, y + 0.97, cz); P.add(box(0.04, 0.06, 0.74), redM, H.x0 - 0.012, y + 1.53, cz);
    for (const dz of [-0.35, 0, 0.35]) P.add(box(0.04, 0.56, dz ? 0.05 : 0.03), redM, H.x0 - 0.012, y + 1.25, cz + dz);
    P.add(box(0.04, 0.03, 0.64), redM, H.x0 - 0.012, y + 1.25, cz);
    // the lamp over the door, on an iron bracket
    P.add(box(0.2, 0.02, 0.02), ironM, H.x1 + 0.1, y + 2.0, H.door.z); P.add(new THREE.CylinderGeometry(0.05, 0.07, 0.07, 8), ironM, H.x1 + 0.2, y + 1.98, H.door.z);
    P.add(new THREE.SphereGeometry(0.035, 8, 6), warm, H.x1 + 0.2, y + 1.94, H.door.z);
    // a lifebuoy on the north wall, the side you come along the breakwater from
    { const seg = new THREE.TorusGeometry(0.2, 0.05, 6, 4, Math.PI / 4);
      for (let i = 0; i < 8; i++) P.add(seg, i % 2 ? snowM : redM, cx - 0.45, y + 1.2, H.z0 - 0.055, 0, 0, i * Math.PI / 4);
      P.add(box(0.04, 0.06, 0.03), ironM, cx - 0.45, y + 1.43, H.z0 - 0.02); }
    // a scarf left on a hook by the door: hers
    { const hz = H.door.z + H.door.w / 2 + 0.24, hy = y + 1.5;
      P.add(box(0.06, 0.015, 0.015), ironM, H.x1 + 0.03, hy, hz);
      P.add(new THREE.PlaneGeometry(0.09, 0.62), scarfM, H.x1 + 0.035, hy - 0.3, hz - 0.035, 0.05, Math.PI / 2, 0.04);
      P.add(new THREE.PlaneGeometry(0.09, 0.5), scarfM, H.x1 + 0.045, hy - 0.25, hz + 0.04, -0.06, Math.PI / 2, -0.07); }
    P.done(this.g);
    // the warm light round the lamp and the window
    const glowM = new THREE.SpriteMaterial({ map: TX.radial(0, 1.6), color: new THREE.Color(1.0, 0.66, 0.3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const a = new THREE.Sprite(glowM); a.position.set(H.x1 + 0.2, y + 1.92, H.door.z); a.scale.setScalar(0.9);
    const b = new THREE.Sprite(glowM); b.position.set(H.x0 - 0.1, y + 1.25, cz); b.scale.setScalar(1.3);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1.6), color: new THREE.Color(0.32, 0.22, 0.1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.position.set(H.x1 + 0.5, y + 0.012, H.door.z); pool.renderOrder = 2;
    this.g.add(a, b, pool);
  },

  // The lakefront, and nowhere else: nothing here moves while the toy is away from it.
  // (When the toy has gone, everything that is drawn two ways is left the far way: once, as it goes.)
  active(k) {
    const on = !!this.L && !k.room && k.pos.x > this.L.lsd.x0 - 10;
    if (!on && this.L && this.lodNear) { this.lodNear = false; if (this.L.lod) dealLOD(this.L.lod, 1e5, 0, 0); for (const b of this.L.heaveLOD || []) b.mesh.geometry = b.geos[2]; }
    return on;
  },

  update(dt, k) {
    const L = this.L, v = k.v, G = k.G;
    this.t += dt;
    if (this.wayM) { const d = Math.hypot(v.pos.x - (L.way[0][0] + 10), v.pos.z - 64), want = d < 34 ? 1 : 0, u = this.wayM.uniforms; u.uOn.value += (want - u.uOn.value) * Math.min(1, dt * 2); this.way.visible = u.uOn.value > 0.01; }
    this.water.material.uniforms.uT.value = this.t;
    if ((this.lodT = (this.lodT || 0) - dt) <= 0) { this.lodT = 0.3; this._lod(k); }
    this._float(dt, v);
    this.splash.update(dt); this.sparks.update(dt);
    if (this.ring.visible) { const r = this.ring; r.userData.t += dt; const u = r.userData.t / 1.1; r.scale.setScalar(1 + u * 5); r.material.opacity = 0.4 * (1 - u) * (1 - u); if (u >= 1) r.visible = false; }
    // the light: turning slowly; flashing and turning fast while it is being visited
    { const on = this.show > 0; this.show = Math.max(0, this.show - dt);
      this.beam.rotation.y += dt * (on ? 2.6 : 0.7);
      const flash = on ? 0.5 + 0.5 * Math.sign(Math.sin(this.t * 14)) : 1;
      this.beamM.uniforms.uI.value = on ? 0.22 + 0.3 * flash : 0.16;
      this.lamp.material.color.setRGB(3.2 * (on ? 0.4 + flash : 1), 0.7 * (on ? 0.4 + flash : 1), 0.55 * (on ? 0.4 + flash : 1));
      const s = on ? 3 + flash * 2.2 : 3 + Math.sin(this.t * 1.3) * 0.2; this.glow.scale.set(s, s, 1);
      this.halo.material.color.setRGB(0.22 * (on ? 0.6 + flash * 1.4 : 1), 0.05, 0.04);
      if (on && Math.random() < dt * 14) { const a = Math.random() * 6.283; this.sparks.emit(L.light.x + Math.cos(a) * 0.5, 5.5, L.light.z + Math.sin(a) * 0.5, 2, { spread: 0.2, up: 1.4, life: 1.4, out: 1.2, color: Math.random() < 0.5 ? 0xff5040 : 0xffffff }); } }
    // Green for a moment, flickering, while something circles the lantern (src/probe.js sets this.green, in seconds).
    if (this.green > 0 || this.wasGreen) {
      this.green = Math.max(0, (this.green || 0) - dt);
      const on = this.green > 0, f = on ? (Math.sin(this.t * 31) * Math.sin(this.t * 17.3) > -0.2 ? 1 : 0.25) : 0;
      if (on) { this.lamp.material.color.setRGB(0.5 * f, 3.0 * f, 0.9 * f); this.glow.material.color.setRGB(0.2, 1.0, 0.4).multiplyScalar(0.4 + 0.6 * f); this.beamM.uniforms.uC.value.setRGB(0.3, 1.0, 0.45); this.beamM.uniforms.uI.value = 0.3 * f; this.glass.material.color.setRGB(0.35, 0.95, 0.5); this.halo.material.color.setRGB(0.04, 0.22 * f, 0.08); }
      else { this.glow.material.color.setRGB(1.0, 0.25, 0.2); this.beamM.uniforms.uC.value.setRGB(1.0, 0.42, 0.36); this.glass.material.color.setRGB(0.9, 0.3, 0.28); }
      this.wasGreen = on;
    }
    // A shadow over the water lies on the water, not on the ground level the ice would be at.
    if (v.shadow && v.shadow.visible && v.shadow.position.y < 0.03 && L.wet(v.pos.x, v.pos.z)) { v.shadow.position.y = WATER_Y + 0.006; v.shadow.updateMatrix && v.shadow.updateMatrix(); }
    // At the light, a moment's look up at it as it flashes.
    if (this.show > 4.5 && Math.hypot(v.pos.x - L.light.x, v.pos.z - L.light.z) < 5) { const t = L.light; k.camClose = { at: { x: t.x - 2.6, y: 2.6, z: t.z + 6.2 }, look: { x: t.x, y: 4.4, z: t.z } }; }
    if (this.seq) return this._sequence(dt, k);
    if (v.kind !== 'car' || G.held || G.ride) return;
    this._lie(dt, k);
    // Gone in? On the water (nothing under it but the lake) and down at its level.
    if (!v.air && v.pos.y < 0.025 && L.wet(v.pos.x, v.pos.z)) return this._fallIn(k);
    // At the light.
    const d = Math.hypot(v.pos.x - L.light.x, v.pos.z - L.light.z);
    if (d < 2.6 && v.pos.y > 1.0 && this.armed) this._arrive(k);
    if (d > 7) this.armed = true;
    // Now and then the ice sings: the long falling "pew" a sheet of lake ice makes as it settles.
    if (Math.abs(v.pos.x - L.edgeX(v.pos.z)) < 30 && (this.pew -= dt) <= 0) {
      this.pew = 9 + Math.random() * 10;
      this._sing(k);
      const z = v.pos.z + (Math.random() - 0.5) * 30, x = L.edgeX(z);
      this.splash.emit(x + 0.2, WATER_Y + 0.05, z, 10, { spread: 0.4, up: 0.8, life: 1.2, out: 0.5 });
    }
  },

  // Every floe where it is now: bobbing, rocking, the loose ones turning slowly about where they lie. A toy on one is
  // carried with it. Their surfaces (harbourplan.js) are moved to match.
  _float(dt, v) {
    const t = this.t, M = this.M, Q = this.Q, Qy = this.Qy, P = this.P, S = this.S, N = this.N;
    const car = v && v.kind === 'car' && !v.air ? v : null;
    for (const f of this.floes) {
      const riding = car && Math.abs(car.pos.y - floeTop(f, car.pos.x, car.pos.z)) < 0.06;
      let nx = f.hx, nz = f.hz;
      if (f.drift) { const a = f.p0 + f.dw * t; nx += Math.cos(a) * f.drift; nz += Math.sin(a) * f.drift; }
      const oh = riding ? floeTop(f, car.pos.x, car.pos.z) : 0;
      if (riding) { car.pos.x += nx - f.x; car.pos.z += nz - f.z; }
      f.x = nx; f.z = nz;
      if (f.held) { f.h = f.top; f.gx = f.gz = 0; }           // the chain's floes are frozen fast: their ramps stay put
      else { f.h = f.top + 0.012 * Math.sin(f.w1 * t + f.p1) - (riding ? 0.012 : 0); f.gx = 0.006 * Math.sin(0.8 * t + f.p2); f.gz = 0.006 * Math.cos(0.65 * t + f.p3); }
      if (riding) { const nh = floeTop(f, car.pos.x, car.pos.z); if (nh > -Infinity && nh > oh) car.pos.y += nh - oh; }
      floeBox(f);
      N.set(-f.gx, 1, -f.gz).normalize(); Q.setFromUnitVectors(this.UP, N); Qy.setFromAxisAngle(this.UP, f.yaw); Q.multiply(Qy);
      M.compose(P.set(f.x, f.h, f.z), Q, S.set(f.sx, 1, f.sz));
      if (f.mesh) { f.mesh.matrix.copy(M); f.mesh.matrixWorldNeedsUpdate = true; } else f.inst.setMatrixAt(f.ix, M);
    }
    for (const m of this.inst) m.instanceMatrix.needsUpdate = true;
    if (this.trailGlow) { const a = this.trailGlow.geometry.attributes.position; this.trail.forEach((q, i) => { if (q.floe) a.setY(i, q.floe.h + 0.84 + q.floe.gx * (q.x - q.floe.x) + q.floe.gz * (q.z - q.floe.z)); }); a.needsUpdate = true; this.trailGlow.material.size = 1.0 + 0.08 * Math.sin(t * 9) * Math.sin(t * 5.3); }
    for (const b of this.bits) {
      const y = WATER_Y + 0.05 + 0.02 * Math.sin(1.4 * t + b.ph);
      Qy.setFromAxisAngle(this.UP, b.yaw + 0.05 * Math.sin(0.3 * t + b.ph)); N.set(0.03 * Math.sin(1.1 * t + b.ph), 1, 0.03 * Math.cos(0.9 * t + b.ph)).normalize(); Q.setFromUnitVectors(this.UP, N).multiply(Qy);
      M.compose(P.set(b.x, y, b.z), Q, S.set(b.rad, 1, b.rad)); b.inst.setMatrixAt(b.ix, M);
    }
    for (const m of this.bitInst) m.instanceMatrix.needsUpdate = true;
  },

  // What stands about in numbers is drawn two ways, and the heave of the ice three (lakefront.js): three times a second,
  // each can and bollard is dealt to its near mesh or its far one, and each band of the heave takes the geometry that suits
  // how far off the camera is.
  _lod(k) {
    const L = this.L, c = k.G.camera.position; this.lodNear = true;
    if (L.lod) dealLOD(L.lod, c.x, c.y, c.z);
    for (const b of L.heaveLOD || []) {
      const d = Math.hypot(Math.max(0, b.x0 - c.x, c.x - b.x1), c.y, Math.max(0, b.z0 - c.z, c.z - b.z1)), want = d < 26 ? 0 : d < 75 ? 1 : 2;
      const g = b.geos[want] || b.geos[2]; if (g && b.mesh.geometry !== g) b.mesh.geometry = g;
    }
  },

  // The lie of the ice under the wheels (icefield.js). A deep drift drags: the toy is slowed, the more the deeper the
  // snow, and throws it up behind (the same at any frame rate: a rate, not a step). And the first time in a while that
  // it runs out onto a refrozen lead, the thin new ice there groans under it.
  _lie(dt, k) {
    const L = this.L, F = L.iceField, v = k.v; if (!F || v.air) return;
    const x = v.pos.x, z = v.pos.z;
    if (v.on === L.heave) {
      const d = F.drift(x, z);
      if (d > 0.008) {
        const sp = Math.hypot(v.vel.x, v.vel.z), q = Math.exp(-Math.min(1, d / 0.05) * 1.5 * dt);
        v.vel.x *= q; v.vel.z *= q;
        if (sp > 1.5 && Math.random() < dt * sp * 5) this.splash.emit(x - v.vel.x / sp * 0.15, v.pos.y + 0.03, z - v.vel.z / sp * 0.15, 2, { spread: 0.12, up: 0.5 + sp * 0.12, life: 0.5, out: 0.5 });
        if (!this.inDrift && sp > 3) k.synth.noise(0.22, { vol: Math.min(0.1, sp * 0.012), lp: 900 });
        this.inDrift = true; return;
      }
    }
    this.inDrift = false;
    this.groan = Math.max(0, (this.groan || 0) - dt);
    if (Math.abs(v.pos.y) < 0.05 && x < L.edgeX(z) && x > F.x0 && F.tex(x, z, 2) > 0.6) { if (!this.onLead && this.groan <= 0 && Math.hypot(v.vel.x, v.vel.z) > 1) { this._groan(k); this.groan = 5; } this.onLead = true; } else this.onLead = false;
  },

  // ---------------------------------------------------------------- going in
  _fallIn(k) {
    const v = k.v, G = k.G;
    G.held = true; v.vel.set(0, 0, 0); v.air = false; v.airT = 0; v.vy = 0; v.rail = null; v.flip = v.spin = 0; if (v.speed !== undefined) v.speed = 0;
    this.seq = { t: 0, x: v.pos.x, y: v.pos.y, z: v.pos.z, yaw: v.yaw, placed: false };
    this.splash.emit(v.pos.x, WATER_Y + 0.05, v.pos.z, 34, { spread: 0.3, up: 2.2, life: 1.0, out: 1.4 });
    if (G.museum.winter && G.museum.winter.burst) G.museum.winter.burst(v.pos.x, WATER_Y + 0.05, v.pos.z, 26, 1.6);
    const r = this.ring; r.position.set(v.pos.x, WATER_Y + 0.02, v.pos.z); r.userData.t = 0; r.visible = true; r.updateMatrix();
    this._splashSound(k);
    k.callout('BRR! TOO COLD!');
    if (v.shadow) v.shadow.visible = false;
  },
  _sequence(dt, k) {
    const S = this.seq, v = k.v, G = k.G, calm = !!(G.set && G.set.reduce);
    S.t += dt; const t = S.t;
    if (!S.placed) {
      // down into the water, nose first, bobbing; then a cold white-blue fade
      const u = Math.min(1, t / 0.55), y = S.y + (WATER_Y - 0.12 - S.y) * (1 - (1 - u) * (1 - u)) + Math.sin(t * 12) * 0.015 * (1 - u);
      v.pos.set(S.x, y, S.z); v.vel.set(0, 0, 0); v.yaw = S.yaw; v.sync(0);
      if (!calm) v.group.rotation.x = -0.25 * u;
      this._fx(t < 0.45 ? 0 : Math.min(1, (t - 0.45) / 0.3));
      if (t > 0.8) {
        // the nearest safe place: back on the ice, or up on the breakwater
        let best = null, bd = Infinity; for (const p of this.L.safe) { const d = (p.x - S.x) ** 2 + (p.z - S.z) ** 2; if (d < bd) { bd = d; best = p; } }
        v.group.rotation.x = 0;
        v.place(best.x, best.z, best.yaw, best.y); G.camYaw = best.yaw; if (v.shadow) v.shadow.visible = true;
        S.placed = true; S.t2 = 0;
        if (G.museum.winter && G.museum.winter.burst) G.museum.winter.burst(best.x, best.y + 0.05, best.z, 14, 1.0);
      }
      return;
    }
    S.t2 += dt;
    this._fx(Math.max(0, 1 - S.t2 / 0.45));
    // a shake, like a wet dog
    if (!calm) v.group.rotation.z = S.t2 < 0.7 ? Math.sin(S.t2 * 40) * 0.08 * (1 - S.t2 / 0.7) : 0;
    if (S.t2 > 0.3) G.held = false;
    if (S.t2 > 0.75) { v.group.rotation.z = 0; this.seq = null; this._fx(0); }
  },
  _fx(a) {
    if (!this.fxEl) { const el = this.fxEl = document.createElement('div'); el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:28;opacity:0;background:radial-gradient(circle at 50% 55%, #f4fbff 0%, #cfe6fa 55%, #9fc2e6 100%)'; document.body.append(el); }
    this.fxEl.style.opacity = String(a);
  },

  // ---------------------------------------------------------------- at the light
  _arrive(k) {
    this.armed = false; this.show = 8;
    if (k.v.kind === 'car') k.find(SECRET);
    k.callout('YOU MADE IT!');
    this._horn(k, 0); this._horn(k, 3.2);
  },

  // ---------------------------------------------------------------- sounds
  _audio(k) { const s = k.sound, c = s && (s.ctx || s.ac || s.audio); if (!c || c.state !== 'running') return null; return { c, out: (s.master || s.out || s.bus) || c.destination }; },
  _horn(k, at) {
    const A = this._audio(k); if (!A) return; const { c, out } = A, t0 = c.currentTime + at;
    // a diaphone: a high note then a low one, the second groaning down, through a low-pass like a long trumpet
    const f = c.createBiquadFilter(), g = c.createGain(); f.type = 'lowpass'; f.frequency.value = 650; f.Q.value = 2; f.connect(g); g.connect(out);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.16, t0 + 0.12); g.gain.setValueAtTime(0.16, t0 + 1.0); g.gain.linearRampToValueAtTime(0.13, t0 + 1.15); g.gain.setValueAtTime(0.13, t0 + 2.0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.6);
    for (const [type, m] of [['sawtooth', 1], ['square', 0.5], ['sine', 0.5]]) {
      const o = c.createOscillator(), og = c.createGain(); o.type = type; og.gain.value = type === 'sine' ? 0.8 : 0.35;
      o.frequency.setValueAtTime(196 * m, t0); o.frequency.setValueAtTime(196 * m, t0 + 1.05); o.frequency.linearRampToValueAtTime(147 * m, t0 + 1.2); o.frequency.linearRampToValueAtTime(138 * m, t0 + 2.6);
      o.connect(og); og.connect(f); o.start(t0); o.stop(t0 + 2.7);
    }
  },
  _splashSound(k) {
    const A = this._audio(k); k.synth.noise(0.55, { vol: 0.16, lp: 1500 });
    if (!A) return; const { c, out } = A, t0 = c.currentTime;
    const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(700, t0); o.frequency.exponentialRampToValueAtTime(180, t0 + 0.25);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3); o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + 0.35);
  },
  _sing(k) {
    const A = this._audio(k); if (!A) return; const { c, out } = A, t0 = c.currentTime;
    for (const [d, v] of [[0, 0.035], [0.14, 0.015]]) {
      const o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(2600, t0 + d); o.frequency.exponentialRampToValueAtTime(260, t0 + d + 0.5);
      g.gain.setValueAtTime(0.0001, t0 + d); g.gain.exponentialRampToValueAtTime(v, t0 + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.55);
      o.connect(g); g.connect(out); o.start(t0 + d); o.stop(t0 + d + 0.6);
    }
  },

  // Thin ice taking a weight: a dull knock, then the crack running off through the sheet.
  _groan(k) {
    const A = this._audio(k); k.synth.noise(0.07, { vol: 0.07, lp: 500 });
    if (!A) return; const { c, out } = A, t0 = c.currentTime;
    const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(190, t0); o.frequency.exponentialRampToValueAtTime(58, t0 + 0.5);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6); o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + 0.65);
    for (const d of [0.09, 0.2, 0.36]) { const p = c.createOscillator(), pg = c.createGain(); p.type = 'sine'; p.frequency.setValueAtTime(1900 - d * 1500, t0 + d); p.frequency.exponentialRampToValueAtTime(320, t0 + d + 0.22);
      pg.gain.setValueAtTime(0.0001, t0 + d); pg.gain.exponentialRampToValueAtTime(0.02, t0 + d + 0.01); pg.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.24); p.connect(pg); pg.connect(out); p.start(t0 + d); p.stop(t0 + d + 0.26); }
  },

  reset(k) { if (this.seq) { const v = k.v; v.group.rotation.x = v.group.rotation.z = 0; if (v.shadow) v.shadow.visible = true; this.seq = null; k.G.held = false; } this._fx && this.fxEl && this._fx(0); this.show = 0; this.armed = true; },
  spots() { const L = this.L; return L ? [{ kind: 'secret', id: SECRET, name: 'The harbour light (drive the floes)', x: L.light.x, y: 1.3, z: L.light.z }] : []; },
});
