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
        float rip = noise(p * vec2(0.8, 2.4) + vec2(uT * 0.32, uT * 0.1)) * 0.6 + noise(p * vec2(2.1, 4.7) - vec2(uT * 0.45, -uT * 0.18)) * 0.4;
        float fres = pow(1.0 - max(V.y, 0.0), 5.0);
        vec3 col = uDeep + uSky * fres * 0.55;
        vec2 d = normalize(vW.xz - cameraPosition.xz + vec2(1e-4));
        float road = pow(max(dot(d, uMoon), 0.0), 24.0);
        float glint = smoothstep(0.68, 0.93, rip) * near;
        col += uShim * glint * (0.12 + 1.5 * road);
        col += uShim * 0.07 * smoothstep(0.5, 0.95, noise(p * 0.18 + vec2(uT * 0.04, uT * 0.02))) * near;
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
    uniforms: { uI: { value: 0.3 }, uC: { value: new THREE.Color(1.0, 0.28, 0.22) } },
    vertexShader: `varying float vD; void main() { vD = length(position) / 18.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uI; uniform vec3 uC; varying float vD; void main() { float a = pow(max(0.0, 1.0 - vD), 2.2) * uI; gl_FragColor = vec4(uC * a, 1.0); }`,
  });
}

feature({
  id: 'harbour',
  secrets: [[SECRET, 'The harbour light']],

  init(k) {
    const L = k.plan.lakefront; if (!L || !L.floes) return;
    this.L = L; this.t = 0; this.M = new THREE.Matrix4(); this.Q = new THREE.Quaternion(); this.Qy = new THREE.Quaternion(); this.P = new THREE.Vector3(); this.S = new THREE.Vector3(); this.N = new THREE.Vector3(); this.UP = new THREE.Vector3(0, 1, 0);
    const g = this.g = new THREE.Group(); k.group.add(g);
    // the water
    { const w = L.water, m = this.water = new THREE.Mesh(new THREE.PlaneGeometry(w.x1 - w.x0 + 1, w.z1 - w.z0 + 20), waterMaterial());
      m.rotation.x = -Math.PI / 2; m.position.set((w.x0 + w.x1) / 2 - 0.5, WATER_Y, (w.z0 + w.z1) / 2); m.updateMatrix(); m.matrixAutoUpdate = false; m.frustumCulled = false; g.add(m); }
    // the floes: the chain's, one mesh each; the loose ones and the bits, instanced by outline
    const iceM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, emissive: new THREE.Color(0.2, 0.27, 0.42), emissiveIntensity: 0.75 });
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
      this.halo = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1.6), color: new THREE.Color(0.5, 0.1, 0.08), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      this.halo.rotation.x = -Math.PI / 2; this.halo.position.set(t.x, WATER_Y + 0.03, t.z);
      const cone = new THREE.ConeGeometry(1.5, 18, 20, 1, true).translate(0, -9, 0).rotateZ(Math.PI / 2);
      this.beamM = beamMaterial();
      this.beam = new THREE.Group(); this.beam.position.set(t.x, y, t.z);
      for (const a of [0, Math.PI]) { const b = new THREE.Mesh(cone, this.beamM); b.rotation.y = a; b.frustumCulled = false; this.beam.add(b); }
      g.add(this.glass, this.lamp, this.glow, this.halo, this.beam); }
    this.splash = k.puffs(90, { color: 0xd8f0ff, size: 0.16 });
    this.sparks = k.puffs(80, { color: 0xffd0c0, size: 0.2 });
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 32), new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.visible = false; g.add(this.ring);
    this.show = 0; this.armed = true; this.seq = null; this.pew = 6;
    this._float(0);
  },

  // The lakefront, and nowhere else: nothing here moves while the toy is away from it.
  active(k) { return !!this.L && !k.room && k.pos.x > this.L.lsd.x0 - 10; },

  update(dt, k) {
    const L = this.L, v = k.v, G = k.G;
    this.t += dt;
    this.water.material.uniforms.uT.value = this.t;
    this._float(dt, v);
    this.splash.update(dt); this.sparks.update(dt);
    if (this.ring.visible) { const r = this.ring; r.userData.t += dt; const u = r.userData.t / 1.1; r.scale.setScalar(1 + u * 5); r.material.opacity = 0.7 * (1 - u); if (u >= 1) r.visible = false; }
    // the light: turning slowly; flashing and turning fast while it is being visited
    { const on = this.show > 0; this.show = Math.max(0, this.show - dt);
      this.beam.rotation.y += dt * (on ? 2.6 : 0.7);
      const flash = on ? 0.5 + 0.5 * Math.sign(Math.sin(this.t * 14)) : 1;
      this.beamM.uniforms.uI.value = on ? 0.35 + 0.5 * flash : 0.22;
      this.lamp.material.color.setRGB(3.2 * (on ? 0.4 + flash : 1), 0.7 * (on ? 0.4 + flash : 1), 0.55 * (on ? 0.4 + flash : 1));
      const s = on ? 3 + flash * 2.2 : 3 + Math.sin(this.t * 1.3) * 0.2; this.glow.scale.set(s, s, 1);
      this.halo.material.color.setRGB(0.5 * (on ? 0.6 + flash : 1), 0.1, 0.08);
      if (on && Math.random() < dt * 14) { const a = Math.random() * 6.283; this.sparks.emit(L.light.x + Math.cos(a) * 0.5, 5.5, L.light.z + Math.sin(a) * 0.5, 2, { spread: 0.2, up: 1.4, life: 1.4, out: 1.2, color: Math.random() < 0.5 ? 0xff5040 : 0xffffff }); } }
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
      f.h = f.top + 0.012 * Math.sin(f.w1 * t + f.p1) - (riding ? 0.012 : 0);
      f.gx = 0.006 * Math.sin(0.8 * t + f.p2); f.gz = 0.006 * Math.cos(0.65 * t + f.p3);
      if (riding) { const nh = floeTop(f, car.pos.x, car.pos.z); if (nh > -Infinity && nh > oh) car.pos.y += nh - oh; }
      floeBox(f);
      N.set(-f.gx, 1, -f.gz).normalize(); Q.setFromUnitVectors(this.UP, N); Qy.setFromAxisAngle(this.UP, f.yaw); Q.multiply(Qy);
      M.compose(P.set(f.x, f.h, f.z), Q, S.set(f.sx, 1, f.sz));
      if (f.mesh) f.mesh.matrix.copy(M); else f.inst.setMatrixAt(f.ix, M);
    }
    for (const m of this.inst) m.instanceMatrix.needsUpdate = true;
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
    k.say('Brr! Too cold!', 1.8);
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
        v.place(best.x, best.z, best.yaw, best.y); G.camYaw = best.yaw;
        S.placed = true; S.t2 = 0;
        if (G.museum.winter && G.museum.winter.burst) G.museum.winter.burst(best.x, best.y + 0.05, best.z, 14, 1.0);
        this._shiver(k);
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
    k.say('You made it to the harbour light!', 3);
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
  _shiver(k) {
    const A = this._audio(k); if (!A) return; const { c, out } = A, t0 = c.currentTime;
    // brrr: a buzzing lip-trill, wobbling
    const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = 150; lfo.type = 'square'; lfo.frequency.value = 26; lg.gain.value = 0.5; f.type = 'lowpass'; f.frequency.value = 900;
    lfo.connect(lg); lg.connect(g.gain); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.05, t0 + 0.05); g.gain.linearRampToValueAtTime(0.0001, t0 + 0.6);
    o.connect(f); f.connect(g); g.connect(out); o.frequency.linearRampToValueAtTime(120, t0 + 0.6); o.start(t0); lfo.start(t0); o.stop(t0 + 0.65); lfo.stop(t0 + 0.65);
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

  reset(k) { if (this.seq) { const v = k.v; v.group.rotation.x = v.group.rotation.z = 0; this.seq = null; k.G.held = false; } this._fx && this.fxEl && this._fx(0); this.show = 0; this.armed = true; },
  spots() { const L = this.L; return L ? [{ kind: 'secret', id: SECRET, name: 'The harbour light (drive the floes)', x: L.light.x, y: 1.3, z: L.light.z }] : []; },
});
