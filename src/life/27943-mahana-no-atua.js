// Paul Gauguin, Mahana no atua (Day of the God) (1894), Gallery 247. The word: tide.
//
// The bottom third of his picture is a pool, painted as flat shapes of colour that are reflections and are also just
// shapes: ultramarine, violet, pink, a yellow, an orange, a dark blue-black, a red. Look at it and that pool comes out
// from under the frame as a slow tide across the floor, made of those flat shapes in his colours, laid in three
// layers one over another like his planes of colour, each wobbling sideways the way a reflection does. Its edge laps in
// and out with a pale line of foam. Flowers float out on it from under the frame (tiare, white and starry, a few red
// hibiscus, two green leaves) and turn slowly as they go. Then a long swell comes up by the wall and rolls out across
// it: the layers lift and part, the flowers ride up, and as the crest passes the shapes behind it turn over into a new
// arrangement, as the colours of a reflection do when the water moves; a warm light comes up with it. The flowers
// gather and circle. Music: the flute's opening phrase from Debussy's Prélude à l'après-midi d'un faune (1894, the year
// of the picture; Debussy and Gauguin knew each other in Mallarmé's circle), over a quiet harp and the lapping water.
//
// It is made only of his colour, his pattern and the pool; nothing in it imitates the people or the god in the picture.
// When you stop looking it stays while the toy is near: drive into it and the shapes swirl round the toy, rings spread
// from it, and the flowers bob away and drift back. Then the tide draws back in under the frame, taking the flowers.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, shape } from '../paintlife.js';

const HALF = 1.75, REACH = 1.95;        // the tide: either side of the middle, and how far it comes out (m)
const NU = 56, NO = 30;                 // its grid (for the swell)
const NF = 15;                          // flowers and leaves
const RING = [0.05, 1.02];              // the middle of the flowers' circle (along, out)
const T_SWELL = 3.9, SWELL = 2.6;       // the swell: when it starts by the wall, and how long it takes to cross
// Debussy, Prélude à l'après-midi d'un faune (1894): the flute's first phrase, down through a tritone and back. 9/8,
// très modéré. Beats are quavers' worth here.
const FAUN = [['C#5', 0, 1.5], ['C5', 1.5, 0.25], ['B4', 1.75, 0.25], ['A#4', 2.0, 0.34], ['A4', 2.34, 0.33], ['G#4', 2.67, 0.33], ['G4', 3.0, 1.5],
  ['A4', 4.6, 0.45], ['A#4', 5.05, 0.45], ['B4', 5.5, 0.5], ['C#5', 6.0, 2.6]];
const FAUN_BEAT = 0.62, T_FAUN = 2.5;
const midi = n => { const m = /^([A-G])(b|#)?(\d)$/.exec(n), k = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0); return 440 * Math.pow(2, (k + 12 * (+m[3] + 1) - 69) / 12); };

const GLSL_NOISE = /* glsl */`
float tHash(vec2 p) { p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 19.19); return fract(p.x * p.y); }
float tNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(tHash(i), tHash(i + vec2(1.0, 0.0)), f.x), mix(tHash(i + vec2(0.0, 1.0)), tHash(i + vec2(1.0, 1.0)), f.x), f.y); }
float tField(vec2 p) { return 0.65 * tNoise(p) + 0.35 * tNoise(p * 2.13 + 7.3); }
`;

lifeFor(27943, {
  title: /^Mahana no atua/,
  word: 'tide',
  stage: { out: 1.95, half: 1.7 },
  wake: 2.4, ret: 2.4,
  linger: { near: 4.5, max: 40 },

  build(L) {
    const P = L.pal, col = (h, a = 0.2) => P.near(h, a);
    // his pool's colours (nudged a little towards what the picture's own palette holds)
    const C = {
      deep: col('#1f3f8f'), ultra: col('#2f5fb5'), cerul: col('#5aa7c6'), violet: col('#6a4f9c'), pink: col('#e09aa8'), rose: col('#c9708a'),
      yellow: col('#ecc04e'), orange: col('#e0863a'), cream: col('#f1e3b6'), navy: col('#17203a'), red: col('#c8402e'), green: col('#6f9d4a'),
    };
    const v3 = c => new THREE.Vector3(c.r, c.g, c.b);
    this.u = {
      uT: { value: 0 }, uFront: { value: 0 }, uSwell: { value: new THREE.Vector3(-1, 0, 0) }, uRe: { value: new THREE.Vector2(0, 0) }, uToy: { value: new THREE.Vector3(9, 9, 0) }, uWarm: { value: 0 },
      cA: { value: [C.deep, C.ultra, C.violet, C.pink, C.cerul].map(v3) }, cB: { value: [C.yellow, C.orange, C.pink, C.cream].map(v3) }, cC: { value: [C.navy, C.red, C.cerul, C.rose].map(v3) },
    };
    // ---------------------------------------------------------- the tide: three layers of a grid laid on the floor
    const nv = 3 * (NU + 1) * (NO + 1), pos = new Float32Array(nv * 3), st = new Float32Array(nv * 3), idx = [], p = new THREE.Vector3();
    for (let l = 0; l < 3; l++) for (let j = 0; j <= NO; j++) for (let i = 0; i <= NU; i++) {
      const v = l * (NU + 1) * (NO + 1) + j * (NU + 1) + i, u = (i / NU - 0.5) * 2 * HALF, o = -L.wall + 0.005 + (j / NO) * (REACH + 0.35);
      L.floor(u, o, p); pos.set([p.x, L.y, p.z], v * 3); st.set([u, o, l], v * 3);
    }
    for (let l = 0; l < 3; l++) for (let j = 0; j < NO; j++) for (let i = 0; i < NU; i++) { const a = l * (NU + 1) * (NO + 1) + j * (NU + 1) + i; idx.push(a, a + NU + 1, a + 1, a + 1, a + NU + 1, a + NU + 2); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSt', new THREE.BufferAttribute(st, 3)); geo.setIndex(idx);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false });
    const u = this.u;
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      const decl = `uniform float uT, uFront, uWarm; uniform vec3 uSwell, uToy; uniform vec2 uRe;\n`;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aSt; varying vec3 vSt;\n' + decl)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  vSt = aSt;
  { float sw = uSwell.y * exp(-pow((aSt.y - uSwell.x) / 0.26, 2.0)) * (0.85 + 0.15 * sin(aSt.x * 3.0 + uT));
    float rip = 0.0025 * sin(aSt.x * 9.0 + aSt.y * 5.0 + uT * 1.7) + 0.003 * uToy.z * exp(-length(aSt.xy - uToy.xy) * 6.0) * sin(length(aSt.xy - uToy.xy) * 40.0 - uT * 6.0);
    transformed.y += 0.011 + aSt.z * 0.0085 + sw * (1.0 + 0.35 * aSt.z) + rip; }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vSt;\n' + decl + 'uniform vec3 cA[5], cB[4], cC[4];\n' + GLSL_NOISE)
        .replace('#include <color_fragment>', `#include <color_fragment>
  {
    float U = vSt.x, O = vSt.y; int layer = int(vSt.z + 0.5);
    // where the water reaches: a broad lobe out of the wall, its edge lapping
    float lap = 0.07 * sin(uT * 1.05 + U * 2.3) + 0.04 * sin(uT * 1.85 - U * 5.1) + 0.025 * sin(U * 11.0 + uT * 0.7) + 0.1 * sin(U * 1.7 + 1.3);
    float front = uFront * (${REACH.toFixed(2)} * sqrt(max(0.0, 1.0 - 0.92 * (U / ${HALF.toFixed(2)}) * (U / ${HALF.toFixed(2)}))) + lap) + uSwell.z * exp(-pow(U * 0.8, 2.0));
    float e = front - O;
    float inset = float(layer) * 0.05;
    if (e < inset) discard;
    // a reflection's sideways wobble, and the water turning round the toy
    vec2 p = vec2(U, O);
    p.x += 0.045 * sin(O * 15.0 + uT * 1.5) + 0.018 * sin(O * 37.0 - uT * 2.3);
    vec2 d = p - uToy.xy; float r = length(d), a = uToy.z * 2.4 * exp(-r * r * 10.0), ca = cos(a), sa = sin(a);
    p = uToy.xy + vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y);
    // the shapes: long and flat, as his are (stretched along the wall); behind the swell's crest, a new arrangement
    float behind = smoothstep(uSwell.x + 0.12, uSwell.x - 0.12, O);
    vec2 q = vec2(p.x * 0.85, p.y * 2.1);
    q += 0.32 * vec2(sin(q.y * 1.9 + uT * 0.22 + sin(q.x * 1.3)), sin(q.x * 1.4 - uT * 0.18));
    vec2 off = mix(vec2(uRe.x, 0.0), vec2(uRe.y, 3.7), behind);
    vec3 c;
    if (layer == 0) {
      float f = tField(q * 1.1 + off + vec2(uT * 0.03, 0.0));
      float k = f * 5.0; int i = int(clamp(floor(k), 0.0, 4.0));
      c = cA[0];
      for (int j = 1; j < 5; j++) if (j == i) c = cA[j];
      // a pale line of foam along the edge, and a fainter one behind it
      float fw = fwidth(e) * 1.5 + 0.004;
      c = mix(c, cB[3], 1.0 - smoothstep(0.018, 0.018 + fw, e));
      c = mix(c, mix(c, cB[3], 0.55), smoothstep(0.075, 0.075 + fw, e) * (1.0 - smoothstep(0.09, 0.09 + fw, e)));
    } else if (layer == 1) {
      float f = tField(q * 0.9 + off * 1.3 + vec2(11.0 - uT * 0.025, 4.0));
      float aa = fwidth(f) * 1.2; if (f < 0.6 - aa) discard;
      int i = int(clamp(floor((f - 0.6) * 12.0), 0.0, 3.0));
      c = cB[0]; for (int j = 1; j < 4; j++) if (j == i) c = cB[j];
    } else {
      float f = tField(q * 0.75 + off * 0.8 + vec2(-5.0 + uT * 0.02, 9.0)), g = tField(q * 1.3 + off + vec2(23.0, -uT * 0.03));
      float aa = fwidth(f) * 1.2;
      if (f > 0.7) c = mix(cC[2], cC[0], smoothstep(0.735, 0.735 + aa, f));          // a dark shape with his pale blue rim
      else if (g > 0.74) c = mix(cC[3], cC[1], smoothstep(0.77, 0.77 + fwidth(g), g));
      else discard;
    }
    // rings spreading from the toy, and the warm light on it all
    float ring = uToy.z * exp(-r * 4.5) * smoothstep(0.75, 1.0, sin(r * 42.0 - uT * 5.0));
    c = mix(c, cB[3], ring * 0.6 * (layer == 0 ? 1.0 : 0.5));
    float lit = 0.8 + uWarm * (0.12 + 0.28 * exp(-((U - 0.0) * (U - 0.0) * 0.6 + (O - 1.0) * (O - 1.0) * 1.4)));
    diffuseColor.rgb = c * lit * vec3(1.0, 0.97, 0.92);
  }`);
    };
    mat.customProgramCacheKey = () => 'gauguin-tide';
    this.tide = L.add(new THREE.Mesh(geo, mat)); this.tide.visible = false;

    // ---------------------------------------------------------- flowers and leaves
    const petal = (len, wid, c) => { const g = shape.ball(1, c, 1); shape.move(g, len * 0.55, 0, 0, 0, 0, 0, len * 0.5, 0.008, wid * 0.5); return g; };
    const tiare = () => {
      const white = col('#f6f2e4', 0.12), cream = col('#efe1b4', 0.15), parts = [];
      for (let i = 0; i < 6; i++) { const g = petal(0.072, 0.036, i % 2 ? white : cream); shape.paint(g, c => (c.x < 0.012 ? cream : null)); shape.move(g, 0, 0.004, 0, 0, (i / 6) * Math.PI * 2, 0.12); g.rotateY(0.3); parts.push(g); }
      parts.push(shape.move(shape.ball(0.012, col('#e9c25a', 0.2), 1), 0, 0.012, 0, 0, 0, 0, 1, 0.7, 1));
      return shape.merge(parts);
    };
    const hibiscus = () => {
      const red = col('#d23a34', 0.15), dark = col('#8a1c24', 0.15), parts = [];
      for (let i = 0; i < 5; i++) { const g = petal(0.085, 0.07, red); shape.paint(g, c => (c.x < 0.02 ? dark : null)); shape.move(g, 0, 0.006, 0, 0, (i / 5) * Math.PI * 2, 0.32); parts.push(g); }
      parts.push(shape.move(shape.cyl(0.003, 0.003, 0.06, 5, col('#f0d060', 0.2)), 0.015, 0.03, 0, 0, 0, -0.9), shape.move(shape.ball(0.008, col('#e8b040', 0.2), 1), 0.04, 0.052, 0));
      return shape.merge(parts);
    };
    const leaf = () => { const g = shape.ball(1, col('#5f8f3e', 0.2), 1); shape.move(g, 0, 0, 0, 0, 0, 0, 0.11, 0.006, 0.035); shape.paint(g, c => (Math.abs(c.z) < 0.004 ? col('#a8c46a', 0.2) : null)); return g; };
    const rig = this.rig = L.rig(NF, 9000, L.paint({ glow: 0.5, rough: 0.7 }));
    const gT = rig.geo(tiare()), gH = rig.geo(hibiscus()), gL = rig.geo(leaf());
    this.fl = Array.from({ length: NF }, (_, i) => {
      const kind = i % 5 === 2 ? 'h' : i === 6 || i === 13 ? 'l' : 't';
      const inst = rig.add(kind === 'h' ? gH : kind === 'l' ? gL : gT); rig.show(inst, false);
      return { inst, kind, te: 1.0 + i * 0.16 + L.rand() * 0.1, u0: (L.rand() - 0.5) * 2 * (L.hw - 0.05), th0: (i / NF) * Math.PI * 2, rr: 0.55 + L.rand() * 0.3, spin: (L.rand() - 0.5) * 1.2, yaw: L.rand() * 6.3, s: kind === 'l' ? 1 : 0.95 + L.rand() * 0.35, u: 0, o: -0.2, vu: 0, vo: 0, ph: L.rand() * 6 };
    });
    // ---------------------------------------------------------- warm light: on the water, and round the frame on the wall
    this.light = L.glows([{ w: 3.2, d: 2.2, u: 0, out: 1.0, color: col('#ffb870', 0.15), strength: 0.55 }, { wall: true, w: 2.4, d: 2.0, u: 0, v: -0.1, color: col('#ffc080', 0.15), strength: 0.8 }]);
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(0, 0, 0, 'YXZ'); this.v = new THREE.Vector3(); this.sc = new THREE.Vector3();
    this.lap = L.voice().loop({ lp: 520, hp: 90 });
    this.hide();
  },

  hide() { for (const f of this.fl) { this.rig.show(f.inst, false); f.on = false; } this.tide.visible = false; this.light.set(0, 0); this.light.set(1, 0); this.u.uFront.value = 0; this.free = false; },

  start(L, resumed) {
    if (resumed && this.free) return;
    this.hide(); this.sfx = {}; this.nextN = 0;
    const v = L.voice();
    // a harp, up: E major, its sixth and ninth (Debussy's key)
    ['E3', 'B3', 'E4', 'F#4', 'G#4', 'B4', 'C#5', 'E5', 'F#5', 'G#5'].forEach((n, i) => this.pluck(L, midi(n), i * 0.055, 0.02));
    L.k.synth.noise(1.6, { vol: 0.012, lp: 700, at: 0.2 });
  },
  back(L) { this.f0 = this.u.uFront.value; for (const f of this.fl) { f.bu = f.u; f.bo = f.o; } this.w0 = this.u.uWarm.value; for (let i = 0; i < 6; i++) this.pluck(L, midi(['G#5', 'E5', 'C#5', 'B4', 'G#4', 'E4'][i]), i * 0.07, 0.014); },
  end(L) { this.hide(); this.lap.set(0); },
  reset(L) { this.hide(); },

  // the swell's height at (along, out) now, for the flowers to ride (the same as the shader's)
  swellAt(u, o) { const s = this.u.uSwell.value; return s.y * Math.exp(-(((o - s.x) / 0.26) ** 2)) * (0.85 + 0.15 * Math.sin(u * 3 + this.u.uT.value)); },
  frontAt(u) { const t = this.u.uT.value, U = u / HALF; return this.u.uFront.value * (REACH * Math.sqrt(Math.max(0, 1 - 0.92 * U * U)) + 0.07 * Math.sin(t * 1.05 + u * 2.3) + 0.1 * Math.sin(u * 1.7 + 1.3)); },

  update(L, dt) {
    const ph = L.phase, t = L.t, showing = ph === 'wake' || ph === 'play', back = ph === 'return', U = this.u, k = L.k;
    if (ph === 'linger' && !this.free) { this.free = true; this.freeT = 0; for (const f of this.fl) { f.vu = 0; f.vo = 0; } }
    this.clock = (this.clock || 0) + dt; U.uT.value = this.clock;
    // ---- the tide: out, the swell, the light; back in
    if (showing && !this.free) {
      U.uFront.value = ease.out(ramp(t, 0.15, 2.7));
      const sw = ramp(t, T_SWELL, T_SWELL + SWELL), idle = t > 10 ? ((t - 10) % 9) / 3.2 : 9;
      if (sw > 0 && sw < 1) U.uSwell.value.set(-0.2 + sw * (REACH + 0.5), 0.045 * Math.sin(Math.PI * Math.min(1, sw * 1.4)), 0.22 * Math.sin(Math.PI * sw));
      else if (idle < 1) U.uSwell.value.set(-0.2 + idle * (REACH + 0.5), 0.02 * Math.sin(Math.PI * idle), 0.08 * Math.sin(Math.PI * idle));
      else U.uSwell.value.set(-1, 0, 0);
      // the arrangement ahead of the crest is the old one, behind it the new: each swell turns it over once
      const n = Math.floor(Math.max(0, t - T_SWELL) / 9) + (t > T_SWELL ? 1 : 0);
      if (sw >= 1 || idle >= 1) U.uRe.value.set(n * 2.9, n * 2.9); else U.uRe.value.set((n - 1) * 2.9, n * 2.9);
      U.uWarm.value = ease.smooth(ramp(t, 0.3, 2.5)) * 0.6 + 0.4 * ease.smooth(ramp(t, T_SWELL + 0.4, T_SWELL + 1.8));
    } else if (this.free && !back) { U.uFront.value = Math.max(U.uFront.value, 1); U.uSwell.value.set(-1, 0, 0); }
    else if (back) { const e = ease.inOut(L.ret); U.uFront.value = this.f0 * (1 - e); U.uWarm.value = this.w0 * (1 - e); U.uSwell.value.set(-1, 0, -0.1 * Math.sin(Math.PI * L.ret)); }
    this.tide.visible = U.uFront.value > 0.002;
    this.light.set(0, U.uWarm.value * U.uFront.value); this.light.set(1, U.uWarm.value * 0.9);
    // ---- the toy in the water
    const toy = k.G.vehicle, tl = toy ? L.local(toy.pos.x, toy.pos.z) : { u: 9, out: 9 };
    const inWater = toy && Math.abs(toy.pos.y - L.y) < 0.3 && tl.out < this.frontAt(tl.u) && Math.abs(tl.u) < HALF;
    const sp = toy && inWater ? Math.hypot(toy.vel.x, toy.vel.z) : 0;
    this.toyK = (this.toyK || 0) + ((inWater ? 0.35 + Math.min(0.65, sp * 0.5) : 0) - (this.toyK || 0)) * Math.min(1, dt * 3);
    U.uToy.value.set(tl.u, tl.out, this.toyK);
    if (inWater && sp > 0.4 && this.clock > (this.plipAt || 0)) { this.plipAt = this.clock + 0.25 + Math.random() * 0.3; L.voice().note(700 + Math.random() * 500, 0.09, { vol: 0.012, type: 'sine', to: 1300 + Math.random() * 400 }); }
    // ---- flowers
    const r = this.rig;
    for (let i = 0; i < NF; i++) {
      const f = this.fl[i];
      if (back) {
        const e = ease.inOut(ramp(L.ret, 0.0, 0.85)), to = -L.wall - 0.06, tu = Math.max(-L.hw + 0.1, Math.min(L.hw - 0.1, f.bu));
        f.u = f.bu + (tu - f.bu) * e; f.o = Math.min(f.bo + (to - f.bo) * e, this.frontAt(f.u) - 0.06);
      } else if (this.free) {
        // bob away from the toy, take a little of its push, drift back round the circle
        this.freeT += dt / NF;
        const du = f.u - tl.u, dout = f.o - tl.out, d = Math.hypot(du, dout);
        if (inWater && d < 0.42 && d > 1e-4) { const push = (0.42 - d) * 6 / d; f.vu += du * push * dt; f.vo += dout * push * dt; if (toy) { const lv = L.local(toy.pos.x + toy.vel.x, toy.pos.z + toy.vel.z); f.vu += (lv.u - tl.u) * 0.9 * dt * (0.42 - d) * 3; f.vo += (lv.out - tl.out) * 0.9 * dt * (0.42 - d) * 3; } }
        const th = f.th0 + this.clock * 0.12, gu = RING[0] + Math.cos(th) * f.rr * 1.25, go = RING[1] + Math.sin(th) * f.rr * 0.7;
        f.vu += (gu - f.u) * 0.25 * dt; f.vo += (go - f.o) * 0.25 * dt;
        const damp = Math.exp(-dt * 1.4); f.vu *= damp; f.vo *= damp;
        f.u += f.vu * dt; f.o += f.vo * dt;
        f.u = Math.max(-HALF + 0.1, Math.min(HALF - 0.1, f.u)); f.o = Math.max(0.05, Math.min(this.frontAt(f.u) - 0.08, f.o));
      } else if (showing) {
        // out from under the frame on the tide, out to the circle, and round it slowly
        const tt = t - f.te; if (tt < 0) { f.on = false; r.show(f.inst, false); continue; }
        const th = f.th0 + Math.max(0, t - 6) * 0.12, gu = RING[0] + Math.cos(th) * f.rr * 1.25, go = RING[1] + Math.sin(th) * f.rr * 0.7;
        const e = ease.inOut(clamp01(tt / 4.2)), su = f.u0 + (gu - f.u0) * e, so = -L.wall - 0.04 + (go + L.wall + 0.04) * e + 0.18 * Math.sin(Math.PI * e);
        f.u = su + 0.05 * Math.sin(tt * 0.9 + f.ph) * e; f.o = Math.min(so, this.frontAt(su) - 0.06);
      } else { f.on = false; r.show(f.inst, false); continue; }
      const grow = back ? 1 - ramp(L.ret, 0.75, 1) : this.free ? 1 : ease.outBack(clamp01((t - f.te) / 0.5));
      if (grow <= 0.01) { r.show(f.inst, false); f.on = false; continue; }
      if (!f.on) { r.show(f.inst, true); f.on = true; }
      const h = this.swellAt(f.u, f.o) * 1.7, p = L.floor(f.u, f.o, this.v), bob = 0.004 * Math.sin(this.clock * 1.6 + f.ph);
      const tilt = this.u.uSwell.value.y > 0.005 ? (this.swellAt(f.u, f.o + 0.05) - this.swellAt(f.u, f.o - 0.05)) * 6 : 0;
      f.yaw += f.spin * dt * (0.3 + Math.hypot(f.vu, f.vo) * 4);
      r.put(f.inst, p.x, L.y + 0.04 + h + bob, p.z, f.yaw, 0.05 * Math.sin(this.clock * 1.3 + f.ph) - tilt, 0.05 * Math.cos(this.clock * 1.1 + f.ph), f.s * grow);
    }
    // ---- sound: the water lapping, the flute, a harp under the swell
    const near = Math.max(0, 1 - Math.hypot(k.G.camera.position.x - L.cx, k.G.camera.position.z - L.cz) / 11);
    this.lap.set(U.uFront.value > 0.01 ? (0.012 + 0.008 * Math.sin(this.clock * 1.05)) * near * U.uFront.value : 0, 0.4);
    if (showing && !this.free) {
      const v = L.voice();
      while (this.nextN < FAUN.length && T_FAUN + FAUN[this.nextN][1] * FAUN_BEAT < t + 0.2) { const [n, b, d] = FAUN[this.nextN++]; this.flute(L, midi(n), Math.max(0, T_FAUN + b * FAUN_BEAT - t), d * FAUN_BEAT); }
      if (!this.sfx.harp && t > T_SWELL + 0.5) { this.sfx.harp = 1; ['E3', 'B3', 'G#4', 'D#5', 'F#5'].forEach((n, i) => this.pluck(L, midi(n), i * 0.11, 0.016)); }
      if (!this.sfx.harp2 && t > T_FAUN + 6.0 * FAUN_BEAT) { this.sfx.harp2 = 1; ['A2', 'E3', 'C#4', 'E4', 'G#4'].forEach((n, i) => this.pluck(L, midi(n), i * 0.12, 0.014)); }
    }
    L.voice().place();
  },

  // ---------------------------------------------------------------- the instruments, made here
  pluck(L, f, at = 0, vol = 0.02) { const v = L.voice(); v.note(f, 1.6, { at, vol, type: 'triangle', attack: 0.003 }); v.note(f * 2, 0.5, { at, vol: vol * 0.35, type: 'sine', attack: 0.002 }); },
  // a flute: a breathy sine with a little vibrato coming in after the attack
  flute(L, f, at, dur) {
    const v = L.voice(), c = v.ctx, out = v.out(); if (!c || !out) return;
    const t = c.currentTime + at, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o2.type = 'triangle'; o2.frequency.setValueAtTime(f * 2, t);
    lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.5, dur * 0.6)); lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    const g2 = c.createGain(); g2.gain.value = 0.12; o2.connect(g2); g2.connect(g);
    const vol = 0.032, end = t + dur;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.07); g.gain.setValueAtTime(vol, Math.max(t + 0.07, end - 0.12)); g.gain.linearRampToValueAtTime(0, end + 0.05);
    o.connect(g); g.connect(out); for (const x of [o, o2, lfo]) { x.start(t); x.stop(end + 0.1); }
    // breath
    v.note(f * 3.01, 0.08, { at, vol: 0.004, type: 'sine', attack: 0.01 });
  },
});
