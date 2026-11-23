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
import { snowLook } from './finish.js';

const SECRET = 'harbourlight';

// A floe: a flat top over its outline, raw sides down into the water (white at the top, green-blue below).
function floeGeo(poly, depth) {
  const P = [], N = [], C = [], top = [0.9, 0.95, 1.0], lip = [0.7, 0.86, 0.95], low = [0.18, 0.42, 0.52];
  let cu = 0, cv = 0; for (const [u, v] of poly) { cu += u; cv += v; } cu /= poly.length; cv /= poly.length;
  const tri = (a, b, c, ca, cb, cc, want) => {
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    if (n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0) { [b, c] = [c, b]; [cb, cc] = [cc, cb]; n = n.map(x => -x); }
    const l = Math.hypot(...n) || 1; n = n.map(x => x / l);
    for (const [p, col] of [[a, ca], [b, cb], [c, cc]]) { P.push(...p); N.push(...n); C.push(...col); }
  };
  for (let i = 0; i < poly.length; i++) {
    const [ua, va] = poly[i], [ub, vb] = poly[(i + 1) % poly.length], out = [(ua + ub) / 2 - cu, 0, (va + vb) / 2 - cv];
    tri([cu, 0, cv], [ua, 0, va], [ub, 0, vb], top, top, top, [0, 1, 0]);
    tri([ua, 0, va], [ub, 0, vb], [ub, -0.06, vb], lip, lip, lip, out); tri([ua, 0, va], [ub, -0.06, vb], [ua, -0.06, va], lip, lip, lip, out);
    tri([ua, -0.06, va], [ub, -0.06, vb], [ub, -depth, vb], lip, lip, low, out); tri([ua, -0.06, va], [ub, -depth, vb], [ua, -depth, va], lip, low, low, out);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  return g;
}

// The water: deep and dark, ripples that catch the moon in a road towards it, and slow pale bands of shimmer.
function waterMaterial() {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uT: { value: 0 }, uMoon: { value: new THREE.Vector2(0.928, -0.373) },
      uDeep: { value: new THREE.Color(0x0a1426) }, uSky: { value: new THREE.Color(0x2c3d66) }, uShim: { value: new THREE.Color(0xa8c8f0) },
    }]),
    vertexShader: `
      varying vec3 vW;
      #include <fog_pars_vertex>
      void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform float uT; uniform vec2 uMoon; uniform vec3 uDeep, uSky, uShim;
      varying vec3 vW;
      #include <fog_pars_fragment>
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
      void main() {
        vec2 p = vW.xz;
        vec3 V = cameraPosition - vW; float dist = length(V); V /= dist;
        float near = clamp(1.0 - dist / 140.0, 0.0, 1.0);
        float rip = noise(p * vec2(1.3, 5.5) + vec2(uT * 0.3, uT * 0.1)) * 0.55 + noise(p * vec2(3.4, 9.0) - vec2(uT * 0.42, -uT * 0.2)) * 0.45;
        float fres = pow(1.0 - max(V.y, 0.0), 5.0);
        vec3 col = uDeep + uSky * fres * 0.55;
        vec2 d = normalize(vW.xz - cameraPosition.xz + vec2(1e-4));
        float road = pow(max(dot(d, uMoon), 0.0), 24.0);
        float glint = smoothstep(0.74, 0.95, rip) * near;
        col += uShim * glint * (0.06 + 1.3 * road);
        col += vec3(0.02, 0.045, 0.06) * smoothstep(0.5, 0.95, noise(p * vec2(0.35, 0.6) + vec2(uT * 0.06, uT * 0.02)));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
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
    // the water
    { const w = L.water, m = this.water = new THREE.Mesh(new THREE.PlaneGeometry(w.x1 - w.x0 + 1, w.z1 - w.z0 + 20), waterMaterial());
      m.rotation.x = -Math.PI / 2; m.position.set((w.x0 + w.x1) / 2 - 0.5, WATER_Y, (w.z0 + w.z1) / 2); m.updateMatrix(); m.matrixAutoUpdate = false; m.frustumCulled = false; g.add(m); }
    // the floes: the chain's, one mesh each; the loose ones and the bits, instanced by outline
    const iceM = snowLook(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, emissive: new THREE.Color(0.2, 0.27, 0.42), emissiveIntensity: 0.75 }), { drift: 0, moon: 0.5, sheen: 0.4 });      // (faces turned to the moon lit, the far ice catching it: src/finish.js)
    this.floes = L.floes;
    let ph = 1;
    for (const f of L.floes) { f.p1 = (ph = (ph * 7.13) % 6.283); f.p2 = (ph * 3.7) % 6.283; f.p3 = (ph * 5.3) % 6.283; f.p0 = (ph * 2.1) % 6.283; f.w1 = 1.1 + (ph % 0.5); }
    for (const f of L.floes.filter(q => q.route)) { const m = f.mesh = new THREE.Mesh(floeGeo(f.poly, 0.36), iceM); m.matrixAutoUpdate = false; g.add(m); }
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
    // the breakwater, at the height of whatever is under each one (so over every ramp, never through anything). A pulse
    // runs along it towards the light while the toy is near.
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
        uniforms: { uT: { value: 0 }, uOn: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: 'uniform float uT; uniform float uOn; attribute float lum; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float i = lum; float p = 0.5 + 0.5 * sin(i * 0.55 - uT * 7.0); vA = uOn * (0.35 + 0.65 * p * p * p); gl_PointSize = clamp(90.0 / -mv.z, 2.0, 14.0); gl_Position = projectionMatrix * mv; }',
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
    const stoneM = new THREE.MeshStandardMaterial({ color: 0x8d9096, roughness: 0.95, ...em(0x24272e, 0.6) });
    const doorM = new THREE.MeshStandardMaterial({ map: door, roughness: 0.7, emissiveMap: door, ...em(0xffffff, 0.25) });
    const scarfM = new THREE.MeshStandardMaterial({ map: scarf, roughness: 1, emissiveMap: scarf, ...em(0xffffff, 0.3), side: THREE.DoubleSide, alphaTest: 0.5 });
    const ironM = new THREE.MeshStandardMaterial({ color: 0x1d2026, roughness: 0.5, metalness: 0.4, ...em(0x0c0e14, 0.6) });
    const warm = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 1.35, 0.62) });
    const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    P.add(box(W, wallTop, D), wallM, cx, y + wallTop / 2, cz);                                         // the walls
    P.add(box(W + 0.02, 0.12, D + 0.02), redM, cx, y + wallTop - 0.06, cz);                             // the fascia under the roof
    P.add(box(W, 0.1, D), roofM, cx, y + wallTop + 0.05, cz);                                          // the roof
    P.add(box(W - 0.02, 0.04, D - 0.02), snowM, cx, y + H.h - 0.02, cz);                                // and its snow, at the top you land on
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
  active(k) { return !!this.L && !k.room && k.pos.x > this.L.lsd.x0 - 10; },

  update(dt, k) {
    const L = this.L, v = k.v, G = k.G;
    this.t += dt;
    if (this.wayM) { const d = Math.hypot(v.pos.x - (L.way[0][0] + 10), v.pos.z - 64), want = d < 34 ? 1 : 0, u = this.wayM.uniforms; u.uT.value = this.t; u.uOn.value += (want - u.uOn.value) * Math.min(1, dt * 2); this.way.visible = u.uOn.value > 0.01; }
    this.water.material.uniforms.uT.value = this.t;
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

  reset(k) { if (this.seq) { const v = k.v; v.group.rotation.x = v.group.rotation.z = 0; if (v.shadow) v.shadow.visible = true; this.seq = null; k.G.held = false; } this._fx && this.fxEl && this._fx(0); this.show = 0; this.armed = true; },
  spots() { const L = this.L; return L ? [{ kind: 'secret', id: SECRET, name: 'The harbour light (drive the floes)', x: L.light.x, y: 1.3, z: L.light.z }] : []; },
});
