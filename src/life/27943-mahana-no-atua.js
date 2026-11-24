// Paul Gauguin, Mahana no atua (Day of the God) (1894), Gallery 247. The word: tide.
//
// The bottom third of his picture is a pool, painted as flat shapes of colour that are reflections and are also just
// shapes: ultramarine, violet, pink, a yellow, an orange, a dark blue-black, a red. Look at it and that pool comes out
// from under the frame as a slow tide across the floor, made of those flat shapes in his colours, laid in three
// layers one over another like his planes of colour, each wobbling sideways the way a reflection does. Its edge laps in
// and out with a pale line of foam. A few of the pool's own shapes come loose from under the frame (a patch of his
// yellow, his orange, rose, the red, cream, pale blue) and drift out on it, turning slowly. Then a long swell comes up by
// the wall and rolls out across it: the layers lift and part, the loose shapes ride up, and as the crest passes the shapes
// behind it turn over into a new arrangement, as the colours of a reflection do when the water moves; a warm light comes
// up with it. The loose shapes gather and circle. Music: the flute's opening phrase from Debussy's Prélude à l'après-midi d'un faune (1894, the year
// of the picture; Debussy and Gauguin knew each other in Mallarmé's circle), over a quiet harp and the lapping water.
//
// When you stop looking it stays while the toy is near: drive into it and the shapes swirl round the toy, rings spread
// from it, and the loose shapes bob away and drift back. Then the tide draws back in under the frame, taking them.
//
// It is made only of his colour, his pattern and the pool. No figure and no god leaves the picture, and nothing is
// brought in from outside it to stand for a place or a people (no flowers, no "island" music): the painting shows a
// Polynesian deity and women through a Frenchman's invention, and a second life as a toy is not ours to give them.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, shape } from '../paintlife.js';

const HALF = 1.75, REACH = 1.95;        // the tide: either side of the middle, and how far it comes out (m)
const NU = 56, NO = 30;                 // its grid (for the swell)
const NF = 15;                          // loose shapes of the pool
const RING = [0.05, 1.02];              // the middle of the loose shapes' circle (along, out)
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
  stage: { out: 1.95, half: 1.7, cam: { dist: 3.0, height: 1.6, side: 0.15, fov: 64, lookU: 0.0, lookOut: 1.0, lookH: 0.3, floorOut: 1.95 } },
  wake: 2.4, ret: 2.4,
  linger: { near: 4.5, max: 40 },

  build(L) {
    const P = L.pal, col = (h, a = 0.2) => P.near(h, a);
    // his pool's colours: deep and earthy, as he painted them (violet, ultramarine, rose, chrome yellow, the blue-black
    // with orange beside it), nudged a little towards what the picture's own palette holds
    const C = {
      deep: col('#1a2f73'), ultra: col('#2747a0'), cerul: col('#3f86a6'), violet: col('#4c3a80'), rose: col('#b25a74'), roseL: col('#c47c86'),
      yellow: col('#dca22a'), orange: col('#cc6a28'), cream: col('#e6d8ae'), pale: col('#86afbf'), navy: col('#141a30'), red: col('#b23628'),
    };
    const v3 = c => new THREE.Vector3(c.r, c.g, c.b);
    this.u = {
      uT: { value: 0 }, uFront: { value: 0 }, uSwell: { value: new THREE.Vector3(-1, 0, 0) }, uRe: { value: new THREE.Vector2(0, 0) }, uToy: { value: new THREE.Vector3(9, 9, 0) }, uWarm: { value: 0 },
      cA: { value: [C.rose, C.ultra, C.deep, C.violet, C.cerul].map(v3) }, cB: { value: [C.yellow, C.orange, C.roseL, C.pale].map(v3) }, cFoam: { value: v3(C.cream) }, cC: { value: [C.navy, C.red, C.cerul, C.rose].map(v3) },
    };
    // ---------------------------------------------------------- the tide: three thin layers of a grid laid on the floor
    const nv = 3 * (NU + 1) * (NO + 1), pos = new Float32Array(nv * 3), st = new Float32Array(nv * 3), idx = [], p = new THREE.Vector3();
    for (let l = 0; l < 3; l++) for (let j = 0; j <= NO; j++) for (let i = 0; i <= NU; i++) {
      const v = l * (NU + 1) * (NO + 1) + j * (NU + 1) + i, u = (i / NU - 0.5) * 2 * HALF, o = -L.wall + 0.005 + (j / NO) * (REACH + 0.45);
      L.floor(u, o, p); pos.set([p.x, L.y, p.z], v * 3); st.set([u, o, l], v * 3);
    }
    for (let l = 0; l < 3; l++) for (let j = 0; j < NO; j++) for (let i = 0; i < NU; i++) { const a = l * (NU + 1) * (NO + 1) + j * (NU + 1) + i; idx.push(a, a + NU + 1, a + 1, a + 1, a + NU + 1, a + NU + 2); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSt', new THREE.BufferAttribute(st, 3)); geo.setIndex(idx);
    // (matt, and see-through at its shallow edge: blended, drawn bottom layer first, writing no depth)
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false, transparent: true, depthWrite: false });
    const u = this.u;
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      const decl = `uniform float uT, uFront, uWarm; uniform vec3 uSwell, uToy; uniform vec2 uRe;\n`;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aSt; varying vec3 vSt;\n' + decl)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  vSt = aSt;
  { float sw = uSwell.y * exp(-pow((aSt.y - uSwell.x) / 0.28, 2.0)) * (0.85 + 0.15 * sin(aSt.x * 3.0 + uT));
    float rip = 0.0012 * sin(aSt.x * 9.0 + aSt.y * 5.0 + uT * 1.7) + 0.002 * uToy.z * exp(-length(aSt.xy - uToy.xy) * 6.0) * sin(length(aSt.xy - uToy.xy) * 40.0 - uT * 6.0);
    transformed.y += 0.004 + aSt.z * 0.0022 + sw * (1.0 + 0.15 * aSt.z) + rip; }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vSt;\n' + decl + 'uniform vec3 cA[5], cB[4], cC[4], cFoam;\nuniform sampler2D tRefl; uniform mat4 reflMatrix; uniform float reflOn; uniform float reflY;\n' + GLSL_NOISE)
        .replace('#include <color_fragment>', `#include <color_fragment>
  {
    float U = vSt.x, O = vSt.y; int layer = int(vSt.z + 0.5);
    // where the water reaches: a broad lobe out of the wall that breathes in and out, its edge lapping unevenly
    float breathe = 0.09 * sin(uT * 0.62) + 0.05 * sin(uT * 1.13 + 1.7);
    float lap = 0.06 * sin(uT * 1.05 + U * 2.3) + 0.035 * sin(uT * 1.9 - U * 5.1) + 0.02 * sin(U * 11.0 + uT * 0.8) + 0.1 * sin(U * 1.7 + 1.3) + 0.04 * (tNoise(vec2(U * 4.0, uT * 0.5)) - 0.5);
    float front = uFront * (${REACH.toFixed(2)} * sqrt(max(0.0, 1.0 - 0.92 * (U / ${HALF.toFixed(2)}) * (U / ${HALF.toFixed(2)}))) + lap + breathe) + uSwell.z * exp(-pow(U * 0.8, 2.0));
    float e = front - O;
    // the wash: as it draws back it leaves the floor wet just ahead of it, a thin dark sheen
    float wash = (0.04 + 0.05 * (0.5 + 0.5 * sin(uT * 0.62 - 1.2))) * uFront;
    if (layer == 0 && e < -wash) discard;
    if (layer > 0 && e < 0.03 * float(layer)) discard;
    // a reflection's sideways wobble, rippling, and the water turning round the toy
    vec2 p = vec2(U, O);
    p.x += 0.05 * sin(O * 15.0 + uT * 1.5) + 0.022 * sin(O * 37.0 - uT * 2.3) + 0.012 * sin(O * 71.0 + uT * 3.1);
    vec2 d = p - uToy.xy; float r = length(d), a = uToy.z * 2.4 * exp(-r * r * 10.0), ca = cos(a), sa = sin(a);
    p = uToy.xy + vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y);
    // the shapes: long and flat, as his are (stretched along the wall); behind the swell's crest, a new arrangement
    float behind = smoothstep(uSwell.x + 0.3, uSwell.x - 0.3, O);
    vec2 q = vec2(p.x * 0.85, p.y * 2.1);
    q += 0.32 * vec2(sin(q.y * 1.9 + uT * 0.22 + sin(q.x * 1.3)), sin(q.x * 1.4 - uT * 0.18));
    // (the two arrangements, ahead of the crest and behind it, are blended as shapes, not slid: a morph)
    vec2 oA = vec2(uRe.x, 0.0), oB = vec2(uRe.y, 3.7);
    vec3 c; float alpha = 1.0;
    if (layer == 0) {
      float f = behind <= 0.001 ? tField(q * 1.1 + oA + vec2(uT * 0.03, 0.0)) : behind >= 0.999 ? tField(q * 1.1 + oB + vec2(uT * 0.03, 0.0)) : mix(tField(q * 1.1 + oA + vec2(uT * 0.03, 0.0)), tField(q * 1.1 + oB + vec2(uT * 0.03, 0.0)), behind);
      int i = int(clamp(floor(f * 5.0), 0.0, 4.0));
      c = cA[0]; for (int j = 1; j < 5; j++) if (j == i) c = cA[j];
    } else if (layer == 1) {
      vec2 b1 = q * 0.9 + vec2(11.0 - uT * 0.025, 4.0);
      float f = behind <= 0.001 ? tField(b1 + oA * 1.3) : behind >= 0.999 ? tField(b1 + oB * 1.3) : mix(tField(b1 + oA * 1.3), tField(b1 + oB * 1.3), behind);
      float aa = fwidth(f) * 1.2; if (f < 0.6 - aa) discard;
      int i = int(clamp(floor((f - 0.6) * 12.0), 0.0, 3.0));
      c = cB[0]; for (int j = 1; j < 4; j++) if (j == i) c = cB[j];
      alpha = smoothstep(0.6 - aa, 0.6 + aa, f);
    } else {
      vec2 b2 = q * 0.75 + vec2(-5.0 + uT * 0.02, 9.0), b3 = q * 1.3 + vec2(23.0, -uT * 0.03);
      float f = behind <= 0.001 ? tField(b2 + oA * 0.8) : behind >= 0.999 ? tField(b2 + oB * 0.8) : mix(tField(b2 + oA * 0.8), tField(b2 + oB * 0.8), behind);
      float g = behind <= 0.001 ? tField(b3 + oA) : behind >= 0.999 ? tField(b3 + oB) : mix(tField(b3 + oA), tField(b3 + oB), behind);
      float aa = fwidth(f) * 1.2;
      if (f > 0.7) { c = mix(cC[2], cC[0], smoothstep(0.735, 0.735 + aa, f)); alpha = smoothstep(0.7, 0.7 + aa, f); }          // a dark shape with his blue rim
      else if (g > 0.74) { c = mix(cC[3], cC[1], smoothstep(0.77, 0.77 + fwidth(g), g)); alpha = smoothstep(0.74, 0.74 + fwidth(g), g); }
      else discard;
    }
    // water: shallow and see-through towards its edge (the floor shows), the upper shapes coming in further back
    if (layer == 0) alpha = e < 0.0 ? 0.0 : mix(0.3, 0.97, smoothstep(0.0, 0.26, e));
    else alpha *= 0.94 * smoothstep(0.03 * float(layer), 0.22 + 0.06 * float(layer), e);
    // the room in it, wobbling (the polished floor's own reflection), and the light glinting on ripples
    if (layer == 0 && e > 0.0) {
      vec4 rq = reflMatrix * vec4(lifeP, 1.0);
      vec2 ruv = rq.xy / rq.w + vec2(0.006 * sin(O * 30.0 + uT * 2.0) + 0.004 * sin(O * 63.0 - uT * 2.7), 0.004 * sin(U * 20.0 - uT * 1.5));
      float on = reflOn * (1.0 - step(0.06, abs(lifeP.y - reflY)));
      c = mix(c, c * 0.8 + min(texture2D(tRefl, ruv, 1.5).rgb, vec3(1.2)) * 0.28, 0.35 * on);
    }
    // (glints: thin streaks along the ripples, few, drifting)
    float rp = tNoise(vec2(U * 2.6 + uT * 0.3, O * 34.0 - uT * 1.4)) * tNoise(vec2(U * 6.0 - uT * 0.2, O * 9.0 + uT * 0.5));
    float glint = smoothstep(0.62, 0.8, rp) * (layer == 0 ? 1.0 : 0.0);
    // a thin foam that breaks and re-forms along the edge, and a fainter line of it left behind by the last wave
    float foam = 0.0;
    if (layer == 0) {
      float fe = abs(e - 0.02 - 0.01 * sin(U * 9.0 + uT * 2.0)), fw = 0.008 + fwidth(e);
      foam = (1.0 - smoothstep(0.0, fw, fe)) * smoothstep(0.32, 0.62, tNoise(vec2(U * 7.0 - uT * 0.6, uT * 0.4)));
      float fe2 = abs(e - 0.1 - 0.03 * sin(U * 4.0 - uT * 0.9)); foam += 0.45 * (1.0 - smoothstep(0.0, fw * 0.8, fe2)) * smoothstep(0.5, 0.75, tNoise(vec2(U * 5.0 + uT * 0.3, 7.0 + uT * 0.25)));
      if (e < 0.0) { c = vec3(0.035, 0.04, 0.055); alpha = 0.28 * smoothstep(-wash, 0.0, e); foam = 0.0; glint *= 0.4; }      // the wet floor
    }
    // rings spreading from the toy
    float ring = uToy.z * exp(-r * 3.2) * smoothstep(0.6, 0.95, sin(r * 38.0 - uT * 5.0));
    float lit = 0.6 + uWarm * (0.08 + 0.22 * exp(-(U * U * 0.6 + (O - 1.0) * (O - 1.0) * 1.4)));
    c = c * lit * vec3(1.0, 0.97, 0.93);
    c = mix(c, cFoam * 0.9, clamp(foam * 0.72 + ring * 0.6, 0.0, 1.0));
    c += vec3(1.0, 0.92, 0.78) * glint * 0.28;
    alpha = max(alpha, clamp(foam * 0.8 + ring * 0.5, 0.0, 1.0) * step(0.0, e));
    diffuseColor.rgb = c; diffuseColor.a = alpha;
  }`);
    };
    mat.customProgramCacheKey = () => 'gauguin-tide';
    this.tide = L.add(new THREE.Mesh(geo, mat)); this.tide.material.visible = false;
    Object.assign(u, L.mirrored(this.tide));        // (the room's reflection in the water: the floor's own; shown and hidden by its material)

    // ---------------------------------------------------------- shapes of the pool, loose on the tide
    // Each is one flat patch of one of the pool's own colours, with the soft lobed outline his shapes have, as if a piece
    // of a reflection had come away and gone drifting. (They were tiare and hibiscus once: flowers that are not in the
    // picture, brought in to say "Tahiti". Everything here is now from the canvas.)
    const isle = (hex, lobes) => {
      const c = col(hex, 0.12), parts = [];
      for (const [x, z, len, wid, yaw] of lobes) { const g = shape.ball(1, c, 1); shape.move(g, x, 0, z, 0, yaw, 0, len, 0.006, wid); parts.push(g); }
      return shape.merge(parts);
    };
    const ISLES = [
      ['#dca22a', [[0, 0, 0.07, 0.04, 0.2], [0.045, 0.02, 0.045, 0.03, -0.5], [-0.04, -0.015, 0.04, 0.028, 0.9]]],          // his yellow
      ['#cc6a28', [[0, 0, 0.06, 0.045, -0.3], [0.04, -0.025, 0.04, 0.026, 0.6]]],                                           // orange
      ['#c47c86', [[0, 0, 0.075, 0.035, 0.5], [-0.05, 0.02, 0.04, 0.03, -0.2], [0.05, 0.015, 0.035, 0.024, 1.1]]],          // rose
      ['#b23628', [[0, 0, 0.05, 0.04, 0], [0.035, 0.02, 0.03, 0.022, 0.8]]],                                                // the red
      ['#e6d8ae', [[0, 0, 0.055, 0.03, -0.6], [0.04, -0.01, 0.035, 0.022, 0.3]]],                                           // cream
      ['#86afbf', [[0, 0, 0.065, 0.04, 0.9], [-0.04, 0.025, 0.04, 0.025, 0.1]]],                                            // the pale blue
    ];
    const rig = this.rig = L.rig(NF, 9000, L.paint({ glow: 0.5, rough: 0.7 }));
    const gI = ISLES.map(([hex, lobes]) => rig.geo(isle(hex, lobes)));
    this.fl = Array.from({ length: NF }, (_, i) => {
      const kind = i % gI.length;
      const inst = rig.add(gI[kind]); rig.show(inst, false);
      return { inst, kind, te: 1.0 + i * 0.16 + L.rand() * 0.1, u0: (L.rand() - 0.5) * 2 * (L.hw - 0.05), th0: (i / NF) * Math.PI * 2, rr: 0.55 + L.rand() * 0.3, spin: (L.rand() - 0.5) * 1.2, yaw: L.rand() * 6.3, s: 1.1 + L.rand() * 0.6, u: 0, o: -0.2, vu: 0, vo: 0, ph: L.rand() * 6 };
    });
    // ---------------------------------------------------------- warm light: on the water, and round the frame on the wall
    this.light = L.glows([{ w: 3.0, d: 2.0, u: 0, out: 1.0, color: col('#ff9a50', 0.15), strength: 0.16 }, { wall: true, w: 2.4, d: 2.0, u: 0, v: -0.1, color: col('#ffc080', 0.15), strength: 0.8 }]);
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(0, 0, 0, 'YXZ'); this.v = new THREE.Vector3(); this.sc = new THREE.Vector3();
    this.lap = L.voice().loop({ lp: 520, hp: 90 });
    this.hide();
  },

  hide() { for (const f of this.fl) { this.rig.show(f.inst, false); f.on = false; } this.tide.material.visible = false; this.light.set(0, 0); this.light.set(1, 0); this.u.uFront.value = 0; this.free = false; },

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

  // the swell's height at (along, out) now, for the loose shapes to ride (the same as the shader's)
  swellAt(u, o) { const s = this.u.uSwell.value; return s.y * Math.exp(-(((o - s.x) / 0.28) ** 2)) * (0.85 + 0.15 * Math.sin(u * 3 + this.u.uT.value)); },
  frontAt(u) { const t = this.u.uT.value, U = u / HALF; return this.u.uFront.value * (REACH * Math.sqrt(Math.max(0, 1 - 0.92 * U * U)) + 0.06 * Math.sin(t * 1.05 + u * 2.3) + 0.1 * Math.sin(u * 1.7 + 1.3) + 0.09 * Math.sin(t * 0.62) + 0.05 * Math.sin(t * 1.13 + 1.7)); },

  update(L, dt) {
    const ph = L.phase, t = L.t, showing = ph === 'wake' || ph === 'play', back = ph === 'return', U = this.u, k = L.k;
    if (ph === 'linger' && !this.free) { this.free = true; this.freeT = 0; for (const f of this.fl) { f.vu = 0; f.vo = 0; } }
    this.clock = (this.clock || 0) + dt; U.uT.value = this.clock;
    // ---- the tide: out, the swell, the light; back in
    if (showing && !this.free) {
      U.uFront.value = ease.out(ramp(t, 0.15, 2.7));
      const sw = ramp(t, T_SWELL, T_SWELL + SWELL), idle = t > 10 ? ((t - 10) % 9) / 3.2 : 9;
      if (sw > 0 && sw < 1) U.uSwell.value.set(-0.2 + sw * (REACH + 0.5), 0.022 * Math.sin(Math.PI * Math.min(1, sw * 1.4)), 0.24 * Math.sin(Math.PI * sw));
      else if (idle < 1) U.uSwell.value.set(-0.2 + idle * (REACH + 0.5), 0.01 * Math.sin(Math.PI * idle), 0.1 * Math.sin(Math.PI * idle));
      else U.uSwell.value.set(-1, 0, 0);
      // the arrangement ahead of the crest is the old one, behind it the new: each swell turns it over once
      const n = Math.floor(Math.max(0, t - T_SWELL) / 9) + (t > T_SWELL ? 1 : 0);
      if (sw >= 1 || idle >= 1) U.uRe.value.set(n * 2.9, n * 2.9); else U.uRe.value.set((n - 1) * 2.9, n * 2.9);
      U.uWarm.value = ease.smooth(ramp(t, 0.3, 2.5)) * 0.6 + 0.4 * ease.smooth(ramp(t, T_SWELL + 0.4, T_SWELL + 1.8));
    } else if (this.free && !back) { U.uFront.value = Math.max(U.uFront.value, 1); U.uSwell.value.set(-1, 0, 0); }
    else if (back) { const e = ease.inOut(L.ret); U.uFront.value = this.f0 * (1 - e); U.uWarm.value = this.w0 * (1 - e); U.uSwell.value.set(-1, 0, -0.1 * Math.sin(Math.PI * L.ret)); }
    this.tide.material.visible = U.uFront.value > 0.002;
    this.light.set(0, U.uWarm.value * U.uFront.value); this.light.set(1, U.uWarm.value * 0.9);
    // ---- the toy in the water
    const toy = k.G.vehicle, tl = toy ? L.local(toy.pos.x, toy.pos.z) : { u: 9, out: 9 };
    const inWater = toy && Math.abs(toy.pos.y - L.y) < 0.3 && tl.out < this.frontAt(tl.u) && Math.abs(tl.u) < HALF;
    const sp = toy && inWater ? Math.hypot(toy.vel.x, toy.vel.z) : 0;
    this.toyK = (this.toyK || 0) + ((inWater ? 0.35 + Math.min(0.65, sp * 0.5) : 0) - (this.toyK || 0)) * Math.min(1, dt * 3);
    U.uToy.value.set(tl.u, tl.out, this.toyK);
    if (inWater && sp > 0.4 && this.clock > (this.plipAt || 0)) { this.plipAt = this.clock + 0.25 + Math.random() * 0.3; L.voice().note(700 + Math.random() * 500, 0.09, { vol: 0.012, type: 'sine', to: 1300 + Math.random() * 400 }); }
    // ---- the loose shapes
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
      r.put(f.inst, p.x, L.y + 0.016 + h + bob, p.z, f.yaw, 0.05 * Math.sin(this.clock * 1.3 + f.ph) - tilt, 0.05 * Math.cos(this.clock * 1.1 + f.ph), f.s * grow);
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
