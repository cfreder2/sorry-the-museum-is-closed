// The probe: a small saucer, and the keeper's log it leads you to (docs/FINALE.md,
// "The hooks"). One of three saucers in the game: this one is a scout, 80 cm across (bigger than your toy), nobody
// aboard; the Sub-level 9 toy (garage.js buildSaucer) is a model of the craft someone made; the craft itself waits in
// the hangar (craft.js, finale.js).
//
// How it goes:
//   * The first time you come in it is found scanning the picture in the entrance hall, and the lobby's robot sees it off
//     through the front doors (src/entry.js, which borrows this one: its model, _show and _hide, its notes).
//   * It comes back, but not at once. Once that is over, and you have looked at three more works (or spent three minutes
//     indoors since), and been in the building over a minute in all, a faint "?" sits in the entrance hall.
//   * Come back near the lobby and it slips in again by the front doors (low: the CLOSED sign hangs in the doorway),
//     flies to you through the doorways, past you, turns, and hangs in front of you a moment,
//     curious, its lamps chiming the call (src/motif.js).
//   (It used to come up out of a glowing grate in the lobby floor, once you had listened at it. The owner had the grate
//   taken out.)
//   * Then you herd it out. It keeps a few metres ahead of you along its way out (doorways, then the vent: the floor grid of
//     guardplan.js, never through a wall), facing you. Drive at it and it eases away; rush it and it goes faster; stop and
//     it stops, bobbing and chiming softly. It never runs off by itself. Wander off and it waits, or drifts back to where
//     you can see it.
//   * Out through the vent and onto the terrace, it takes off on its own: up over the front, across the roofs, low over
//     Butler Field and the ballpark and out over the frozen harbour to the light. The camera watches it go, then it is yours
//     again. It waits by the light, chiming, with the "?" on it, while you find your way across the floes.
//   * Get there and it circles the lantern once, the light flickers green, and it streaks straight up and is gone.
//   * At the foot of the light, the keeper's hut (drawn by harbour.js, solid in harbourplan.js), and on its step the log:
//     READ it. Clarice's last entries, and the new keeper's note pinned to the door. A page of the file ('lighthouse'),
//     and the "?" moves on to the rings over the silo ("under the ballfield").
//
// Saved in 'after-hours.probe': once it has come back in it counts as flown (quit in the middle and it is waiting at the light
// next time); 'gone' once it has left. Nothing is done per frame before it is due (a check twice a second), nor once it has
// gone, nor while it waits at the light and you are far away.
//
// For other modules: G.probe.where() is where the file's "?" should point while there is something here to follow (the
// hall it comes back to, the probe, the log), or null. src/story.js asks it first.

import * as THREE from 'three';
import { feature, features } from './features.js';
import { groundAt, confine } from './plan.js';
import { grid, path } from './guardplan.js';
import { story } from './story.js';
import { MOTIF, MOTIF_COLOURS, motifVoice } from './motif.js';
import * as TX from './textures.js';
import { night } from './garage.js';
const KEY = 'after-hours.probe';
export const GREEN = new THREE.Color(0.32, 1, 0.42);
const R = 0.4;             // its radius: 80 cm across, bigger than the car is long (it still clears the vent, 1.2 m by 0.75)
const FLY = 0.7;           // the height of its middle over the floor indoors (the pictures start at 0.8 m)
const LEAD = 3.2;          // how far ahead of you it keeps, along its way out (metres)
const NEAREST = 1.9;       // and never nearer than this
const CLEAR = R + 0.06;    // what it keeps between its rim and a wall, on its way through the doorways

let st = load();
function load() { let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { s = null; } return { stage: 'wait', ...(s || {}) }; }
function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* a private window: it lasts the visit */ } }

// ---------------------------------------------------------------- the probe itself
// A saucer of the same family as the garage's, but a working one: a lathed hull of pale metal that reflects the night
// (the garage's panorama, src/garage.js night()), a lip round the rim, panel lines, a lit band under the lip, a glass
// dome with a lens in it that turns to look at you (nobody aboard), and underneath, round the glowing emitter, a ring
// of fifteen lamps in the call's five colours with a bright one chasing round. Under it, a soft shimmering field.
//
// Every glow it makes (the halo, the field, the trail, the motes, the pool on the floor) is added with
// artSafe(): its light is scaled by what the frame already holds in alpha, and a work of art is drawn with alpha 0
// (src/finish.js keepTrue), so not one of them can land on a canvas, from any camera. The hull and the glass are
// things in the room and may pass in front of a picture, as the toy does.

// The hull's profile, outward from the middle of its underside and up over the rim to the seat of the dome
// (radius, height in metres for a radius of 0.4; scaled to R). Small bevels rather than hard corners, so every edge
// catches a highlight; the grooves are real dips, and the shader draws them dark as well.
const PROFILE = [
  [0, -0.088], [0.05, -0.089], [0.086, -0.091],                     // the emitter, a lens set in
  [0.092, -0.096], [0.1, -0.102], [0.111, -0.103], [0.12, -0.099],  // the lip round it
  [0.15, -0.094], [0.19, -0.087], [0.23, -0.0795], [0.265, -0.0725], [0.279, -0.0705],
  [0.288, -0.0715], [0.3, -0.0715], [0.312, -0.0685], [0.322, -0.0625],   // the bead the lamps sit on
  [0.35, -0.046], [0.372, -0.031],
  [0.386, -0.02], [0.394, -0.011], [0.399, -0.003], [0.4, 0.003],  // the band, the rim
  [0.398, 0.009], [0.392, 0.013], [0.384, 0.0145],                 // the lip
  [0.379, 0.0128], [0.374, 0.0152], [0.366, 0.02],                 // a groove inside it
  [0.33, 0.035], [0.29, 0.05], [0.252, 0.0615],
  [0.246, 0.0618], [0.242, 0.0603], [0.238, 0.0622], [0.231, 0.065],   // a panel line
  [0.2, 0.074], [0.17, 0.081], [0.152, 0.0855],
  [0.146, 0.089], [0.144, 0.096], [0.139, 0.1], [0.128, 0.1015],  // the collar the dome sits in
  [0.08, 0.103], [0, 0.104],
];
const S = R / 0.4;

const NOISE = /* glsl */`
  float pH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float pN(vec2 p, float per) {         // value noise, repeating every 'per' along x (round a cylinder)
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float x0 = mod(i.x, per), x1 = mod(i.x + 1.0, per);
    return mix(mix(pH(vec2(x0, i.y)), pH(vec2(x1, i.y)), f.x), mix(pH(vec2(x0, i.y + 1.0)), pH(vec2(x1, i.y + 1.0)), f.x), f.y);
  }`;
const PAL = /* glsl */`
  uniform vec3 uCols[5];
  vec3 pal5(float x) {                  // the call's five colours, round a loop (x: 0..1)
    x = fract(x) * 5.0; vec3 c = uCols[0];
    c = mix(c, uCols[1], clamp(x, 0.0, 1.0)); c = mix(c, uCols[2], clamp(x - 1.0, 0.0, 1.0)); c = mix(c, uCols[3], clamp(x - 2.0, 0.0, 1.0));
    c = mix(c, uCols[4], clamp(x - 3.0, 0.0, 1.0)); return mix(c, uCols[0], clamp(x - 4.0, 0.0, 1.0));
  }`;

// Light added to the frame, but only where the frame is not a work of art: the source is weighted by the destination's
// alpha (0 on a canvas: src/finish.js keepTrue), and the alpha is left as it was. The material's colour must already
// be multiplied by its own coverage (as an additive glow's is).
export function artSafe(m) {
  Object.assign(m, { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstAlphaFactor, blendDst: THREE.OneFactor,
    blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor, fog: false });
  return m;
}
// A glow on a surface of revolution (the field): scrolling noise, soft at the silhouette, brightest at one end.
export function beamMaterial(U, o) {
  const F = x => Number(x).toFixed(3);
  return artSafe(new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uCol: { value: new THREE.Color() }, uK: { value: 0 } },
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uCol; uniform float uK; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      ${NOISE}
      void main() {
        float v = clamp(${o.up ? '1.0 - vUv.y' : 'vUv.y'}, 0.0, 1.0);      // 1 at the bright end (clamped: with MSAA a varying can stray just outside)
        float s = ${o.up ? '-1.0' : '1.0'};
        float n = pN(vec2(vUv.x * ${F(o.n)}, vUv.y * ${F(o.m)} + s * uTime * ${F(o.speed)}), ${F(o.n)}) * 0.6 + pN(vec2(vUv.x * ${F(2 * o.n)}, vUv.y * ${F(2 * o.m + 1)} + s * uTime * ${F(o.speed * 1.7)}), ${F(2 * o.n)}) * 0.4;
        float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.4);
        float ring = pow(max(0.0, 0.5 + 0.5 * sin((vUv.y * ${F(o.rings)} + s * uTime * ${F(o.ringSpeed)}) * 6.2832)), 10.0);
        float a = pow(max(v, 1e-4), ${F(o.fall)}) * edge * (0.12 + 1.5 * n * n + 0.8 * ring) * smoothstep(0.0, 0.05, 1.0 - v);
        gl_FragColor = vec4(uCol * a * uK, 1.0);
      }`,
    side: THREE.DoubleSide,
  }));
}

function buildProbe() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body); g.name = 'probe';
  const env = night();
  const cols = MOTIF_COLOURS.map(c => new THREE.Color(c));
  // shared by the hull and the glows: the time, the call's colours, and a flash in one of them when a note sounds
  const U = { uTime: { value: 0 }, uCols: { value: cols }, uFlash: { value: 0 }, uFlashI: { value: 0 }, uFlashC: { value: GREEN.clone() }, uGlow: { value: GREEN.clone() } };

  // the hull: one lathed mesh, every detail on it drawn by its own shader
  const prof = PROFILE.map(([r, y]) => new THREE.Vector2(r * S, y * S));
  const hullGeo = new THREE.LatheGeometry(prof, 64);
  const metal = new THREE.MeshStandardMaterial({ color: 0xd4dbe0, metalness: 0.88, roughness: 0.2, envMap: env, envMapIntensity: 1.35, emissive: 0x161c20, emissiveIntensity: 1 });
  metal.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vHp;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvHp = position * ${(1 / S).toFixed(5)};`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vHp; uniform float uTime; uniform float uFlash; uniform float uFlashI; uniform vec3 uFlashC; uniform vec3 uGlow;
      ${PAL}
      float hHash(float n) { return fract(sin(n * 91.345) * 47453.21); }
      float hLine(float d, float w) { float fw = fwidth(d) + 1e-5; return 1.0 - smoothstep(w, w + fw * 1.5, abs(d)); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      float hr = length(vHp.xz), hy = vHp.y, ha = atan(vHp.z, abs(vHp.x) < 1e-5 ? 1e-5 : vHp.x), TAU = 6.2831853;
      float top = step(0.012, hy), under = 1.0 - step(-0.004, hy);
      // panel lines: rings, and seams across them (eight panels on top, ten underneath, offset)
      float seam = top * (hLine(hr - 0.2415, 0.0016) + hLine(hr - 0.379, 0.0014));
      seam += under * (hLine(hr - 0.19, 0.0012) + hLine(hr - 0.352, 0.0012));
      float a8 = ha / TAU * 8.0, a10 = ha / TAU * 10.0 + 0.5;
      seam += top * step(0.152, hr) * step(hr, 0.368) * hLine((fract(a8) - 0.5) * TAU / 8.0 * hr, 0.0013);
      seam += under * step(0.125, hr) * step(hr, 0.37) * (1.0 - step(0.268, hr) * step(hr, 0.334)) * hLine((fract(a10) - 0.5) * TAU / 10.0 * hr, 0.0012);
      seam = min(seam, 1.0);
      // each panel a shade apart, as if each were made separately
      float pid = top > 0.5 ? floor(a8) + floor(hr / 0.2415) * 9.0 : floor(a10) + 30.0 + floor(hr / 0.19) * 11.0;
      float ph = hHash(pid);
      diffuseColor.rgb *= (0.93 + 0.1 * ph) * (1.0 - 0.6 * seam);
      // inside the dome: dark
      diffuseColor.rgb *= 1.0 - 0.85 * step(hr, 0.13) * step(0.098, hy);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      roughnessFactor = clamp(roughnessFactor * (0.8 + 0.45 * ph) + seam * 0.3, 0.05, 1.0);`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
      // the night's colours in it, but mostly silver: a hint of the city, not a rainbow
      reflectedLight.indirectSpecular = mix(vec3(dot(reflectedLight.indirectSpecular, vec3(0.3, 0.55, 0.15))), reflectedLight.indirectSpecular, 0.45);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        vec3 glowC = mix(uGlow, uFlashC, uFlash);
        totalEmissiveRadiance *= 1.0 - seam;
        // a rim of its own light where the hull turns away from you
        float fres = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 4.0);
        totalEmissiveRadiance += glowC * fres * 0.3;
        // the emitter underneath, rippling
        float em = (1.0 - smoothstep(0.08, 0.088, hr)) * under;
        totalEmissiveRadiance += glowC * em * (1.3 + 0.9 * uFlash) * (0.7 + 0.3 * sin(hr * 150.0 - uTime * 5.0)) * (1.15 - hr * 6.0);
        // the lamps: ten round the bead, in the call's colours, a bright one chasing round
        float la = ha / TAU * 10.0, li = floor(la), lf = la - li - 0.5;
        float ld = length(vec2(lf * TAU * 0.3 / 10.0, hr - 0.3));
        float lamp = (1.0 - smoothstep(0.014, 0.018, ld)) * under;
        float spill = exp(-ld * ld / 0.0016) * under;
        float idx = mod(li + 10.0, 5.0);
        vec3 lc = pal5((idx + 0.02) / 5.0);
        float head = pow(fract((li + 10.0) / 10.0 + uTime * 0.45), 5.0);
        float hit = 1.0 - step(0.5, abs(idx - uFlashI));
        float lk = 1.6 + 4.0 * head + uFlash * (0.8 + 3.5 * hit);
        totalEmissiveRadiance += lc * (lamp * lk * (1.0 - 0.35 * smoothstep(0.0, 0.012, ld)) + spill * 0.2 * lk);
        // the lit band under the lip, light flowing slowly round it
        float lb = smoothstep(-0.0195, -0.0175, hy) * (1.0 - smoothstep(-0.0115, -0.0095, hy)) * step(0.38, hr);
        totalEmissiveRadiance += mix(glowC, vec3(1.0), 0.35) * lb * (0.75 + 0.45 * sin(ha * 3.0 - uTime * 1.8));
        // and the collar the dome sits in
        float cb = step(0.14, hr) * step(hr, 0.1458) * step(0.088, hy) * step(hy, 0.0985);
        totalEmissiveRadiance += glowC * cb * 0.9;
      }`);
  };
  metal.customProgramCacheKey = () => 'probe-hull';
  const hull = new THREE.Mesh(hullGeo, metal); body.add(hull);

  // the dome, clear in the middle, catching the light at its edge
  const domeM = new THREE.MeshStandardMaterial({ color: 0xb8f4dc, metalness: 0.1, roughness: 0.04, envMap: env, envMapIntensity: 1.8, transparent: true, opacity: 0.16, emissive: 0x1d6a4c, emissiveIntensity: 0.25, depthWrite: false });
  domeM.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      { float fr = pow(1.0 - saturate(abs(dot(normal, normalize(vViewPosition)))), 2.5); gl_FragColor.rgb += vec3(0.25, 0.75, 0.5) * fr * 0.35; gl_FragColor.a = mix(gl_FragColor.a, 0.8, fr); }`);
  };
  domeM.customProgramCacheKey = () => 'probe-dome';
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.126 * S, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), domeM);
  dome.scale.y = 0.92; dome.position.y = 0.1 * S; dome.renderOrder = 3; body.add(dome);
  // in it, nobody: a lens on a stalk, faintly lit, that turns to look at you
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.036 * S, 20, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.16, 0.62, 0.4) }));
  eye.scale.set(1, 1, 0.7); eye.position.set(0, 0.158 * S, 0.02 * S); body.add(eye);

  // a halo, for the bloom and for seeing it from far off
  const halo = new THREE.Sprite(artSafe(new THREE.SpriteMaterial({ map: TX.radial(0, 1.2), color: GREEN.clone() })));
  halo.renderOrder = 4; g.add(halo);
  // the field under it: a bell of shimmering light from the emitter down
  const fieldGeo = new THREE.CylinderGeometry(0.075 * S, 0.33 * S, 1, 40, 1, true).translate(0, -0.5, 0);
  const field = new THREE.Mesh(fieldGeo, beamMaterial(U, { up: false, n: 10, m: 3, speed: 1.1, rings: 3.5, ringSpeed: -0.9, fall: 1.3 }));
  field.position.y = -0.088 * S; field.renderOrder = 4; body.add(field);
  return { group: g, body, hull, halo, eye, field, U, cols };
}

// The trail: a ribbon of light along where it has been, turned to face the camera, tapering and fading with age, its
// colour running through the call's. A ring of points (the newest first, the head where it is now); each frame only the
// head moves, and a new point is laid down every `step` metres.
class Ribbon {
  constructor(n = 64) {
    this.N = n; this.n = 0; this.P = new Float32Array(n * 3); this.T = new Float32Array(n); this.C = new Float32Array(n * 3); this.hue = 0;
    const g = this.geo = new THREE.BufferGeometry(), V = n * 2;
    const at = (name, k) => { const a = new THREE.BufferAttribute(new Float32Array(V * k), k).setUsage(THREE.DynamicDrawUsage); g.setAttribute(name, a); return a; };
    this.pos = at('position', 3); this.tan = at('aTan', 3); this.k = at('aK', 2); this.col = at('color', 3);
    const side = new Float32Array(V), idx = [];
    for (let i = 0; i < n; i++) { side[i * 2] = -1; side[i * 2 + 1] = 1; if (i < n - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    g.setAttribute('aSide', new THREE.BufferAttribute(side, 1)); g.setIndex(idx); g.setDrawRange(0, 0);
    this.mat = artSafe(new THREE.ShaderMaterial({
      uniforms: { uK: { value: 1 } },
      vertexShader: /* glsl */`
        attribute vec3 aTan; attribute vec2 aK; attribute float aSide; attribute vec3 color;
        varying vec3 vC; varying float vA; varying float vS;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vec3 t = mat3(modelMatrix) * aTan, side = cross(t, cameraPosition - w.xyz);
          float l = length(side); side = l > 1e-6 ? side / l : vec3(0.0, 1.0, 0.0);
          w.xyz += side * aSide * aK.y;
          vC = color; vA = aK.x; vS = aSide;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */`
        uniform float uK; varying vec3 vC; varying float vA; varying float vS;
        void main() {
          float x = vS * vS;
          vec3 c = vC * exp(-x * 3.0) * 0.85 + mix(vC, vec3(1.0), 0.55) * exp(-x * 30.0) * 0.9;
          gl_FragColor = vec4(c * vA * uK, 1.0);
        }`,
      side: THREE.DoubleSide,
    }));
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.visible = false; this.mesh.renderOrder = 4;
  }
  reset() { this.n = 0; this.geo.setDrawRange(0, 0); this.mesh.visible = false; }
  // p: where the head is now; now: the clock; o: { step, life, width, hueRate }; cols: the call's colours
  update(p, now, o, cols) {
    const P = this.P, T = this.T, C = this.C, N = this.N;
    const lay = this.n < 2 || (P[3] - p.x) ** 2 + (P[4] - p.y) ** 2 + (P[5] - p.z) ** 2 > o.step * o.step;
    if (lay) {
      if (this.n >= 1) this.hue += Math.sqrt((P[3] - p.x) ** 2 + (P[4] - p.y) ** 2 + (P[5] - p.z) ** 2) * o.hueRate;
      P.copyWithin(3, 0, (N - 1) * 3); T.copyWithin(1, 0, N - 1); C.copyWithin(3, 0, (N - 1) * 3);
      this.n = Math.min(N, this.n + 1);
      const h = ((this.hue % 1) + 1) % 1 * 5, i = Math.floor(h), f = h - i, a = cols[i], b = cols[(i + 1) % 5];
      C[0] = a.r + (b.r - a.r) * f; C[1] = a.g + (b.g - a.g) * f; C[2] = a.b + (b.b - a.b) * f;
    }
    P[0] = p.x; P[1] = p.y; P[2] = p.z; T[0] = now;
    if (this.n < 2) { this.geo.setDrawRange(0, 0); return; }
    // the strip: each point twice, either side of the line; alpha and half-width from its age
    const pos = this.pos.array, tan = this.tan.array, K = this.k.array, col = this.col.array, n = this.n;
    let live = 0;
    for (let i = 0; i < n; i++) {
      const left = Math.max(0, 1 - (now - T[i]) / o.life), j0 = Math.max(0, i - 1) * 3, j1 = Math.min(n - 1, i + 1) * 3;
      const tx = P[j0] - P[j1], ty = P[j0 + 1] - P[j1 + 1], tz = P[j0 + 2] - P[j1 + 2];
      const a = left * left, w = o.width * (0.25 + 0.75 * Math.pow(left, 0.6));
      for (let s = 0; s < 2; s++) {
        const v = i * 2 + s;
        pos[v * 3] = P[i * 3]; pos[v * 3 + 1] = P[i * 3 + 1]; pos[v * 3 + 2] = P[i * 3 + 2];
        tan[v * 3] = tx; tan[v * 3 + 1] = ty; tan[v * 3 + 2] = tz;
        K[v * 2] = a; K[v * 2 + 1] = w;
        col[v * 3] = C[i * 3]; col[v * 3 + 1] = C[i * 3 + 1]; col[v * 3 + 2] = C[i * 3 + 2];
      }
      if (left > 0) live = i + 1;
    }
    this.n = live;                         // (points that have faded out are dropped; the head alone draws nothing)
    if (live < 2) { this.geo.setDrawRange(0, 0); return; }
    this.pos.needsUpdate = this.tan.needsUpdate = this.k.needsUpdate = this.col.needsUpdate = true;
    this.geo.setDrawRange(0, (this.n - 1) * 6); this.mesh.visible = true;
  }
}

// Motes: a few slow sparks shed from under it, in the call's colours, drifting and twinkling out. Each is written once,
// when it is shed; the shader moves it from there.
class Motes {
  constructor(n = 40) {
    this.N = n; this.i = 0; this.acc = 0;
    const g = this.geo = new THREE.BufferGeometry();
    this.pos = new THREE.BufferAttribute(new Float32Array(n * 3), 3); this.vel = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
    this.born = new THREE.BufferAttribute(new Float32Array(n * 2).fill(-999), 2); this.col = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
    g.setAttribute('position', this.pos); g.setAttribute('aV', this.vel); g.setAttribute('aB', this.born); g.setAttribute('color', this.col);
    this.mat = artSafe(new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uLife: { value: 2.2 }, uSize: { value: 0.03 }, uScale: { value: 600 }, uK: { value: 1 } },
      vertexShader: /* glsl */`
        uniform float uTime; uniform float uLife; uniform float uSize; uniform float uScale;
        attribute vec3 aV; attribute vec2 aB; attribute vec3 color; varying vec3 vC; varying float vA;
        void main() {
          float age = uTime - aB.x, f = age / uLife, s = aB.y * 6.2832;
          vec3 p = position + aV * age + vec3(sin(age * 2.1 + s), 0.0, cos(age * 1.7 + s)) * 0.04 * age;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float alive = step(0.0, f) * step(f, 1.0);
          vA = alive * sin(3.1416 * clamp(f, 0.0, 1.0)) * (0.55 + 0.45 * sin(uTime * 11.0 + s * 7.0));
          vC = color;
          gl_PointSize = alive * uSize * (0.6 + 0.8 * aB.y) * uScale / max(0.05, -mv.z);
          gl_Position = alive > 0.5 ? projectionMatrix * mv : vec4(2.0, 2.0, 2.0, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform float uK; varying vec3 vC; varying float vA;
        void main() {
          vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard;
          gl_FragColor = vec4((vC * exp(-r * 4.0) + vec3(exp(-r * 30.0)) * 0.7) * vA * uK, 1.0);
        }`,
    }));
    this.mesh = new THREE.Points(g, this.mat); this.mesh.frustumCulled = false; this.mesh.visible = false; this.mesh.renderOrder = 4;
  }
  reset() { this.born.array.fill(-999); this.born.needsUpdate = true; this.mesh.visible = false; this.acc = 0; }
  // shed `rate` a second round p (within `spread`), drifting at about `drift` (a Vector3) plus a little either way
  update(dt, p, now, o, cols) {
    this.acc += dt * o.rate;
    let any = false;
    while (this.acc >= 1) {
      this.acc -= 1; any = true;
      const i = this.i, a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * o.spread, c = cols[(Math.random() * 5) | 0];
      this.pos.setXYZ(i, p.x + Math.cos(a) * r, p.y - Math.random() * o.spread * 0.2, p.z + Math.sin(a) * r);
      this.vel.setXYZ(i, o.drift.x + (Math.random() - 0.5) * 0.12, o.drift.y - Math.random() * 0.1, o.drift.z + (Math.random() - 0.5) * 0.12);
      this.born.setXY(i, now, Math.random()); this.col.setXYZ(i, c.r, c.g, c.b);
      this.i = (i + 1) % this.N;
    }
    if (any) this.pos.needsUpdate = this.vel.needsUpdate = this.born.needsUpdate = this.col.needsUpdate = true;
    this.mat.uniforms.uTime.value = now; this.mat.uniforms.uLife.value = o.life; this.mat.uniforms.uSize.value = o.size;
    this.mesh.visible = true;
  }
}

// ---------------------------------------------------------------- the log and the note
const LOG = [
  ['Nov 28', 'Museum dark by six. Lights on again at two.'],
  ['Dec 2', 'Two “people” at the side door. A crate.'],
  ['Dec 5', 'More crates. Going down, not out.'],
  ['Dec 9', 'Green light under Butler Field. The snow glows.'],
  ['Dec 12', 'Five notes off the water. I hummed them back.'],
  ['Dec 13', 'They answered.'],
  ['Dec 14', 'Something small came to my window. It wants me to follow. I’m going to'],
];
const NOTE = ['We don’t know what happened to Clarice.', 'She kept saying the music came from under the ballfield.', 'Please leave her log where it is.'];
const HAND = '"Bradley Hand", "Segoe Print", "Marker Felt", "Comic Sans MS", cursive';
// Lines of `text` no wider than `w` in the canvas's current font.
function wrap(g, text, w) {
  const out = []; let line = '';
  for (const word of text.split(' ')) { const t = line ? line + ' ' + word : word; if (line && g.measureText(t).width > w) { out.push(line); line = word; } else line = t; }
  if (line) out.push(line); return out;
}
function logCard() {
  const W = 560, H = 760, X = 128, RW = W - X - 34, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = '#e8dfc6'; g.fillRect(12, 12, W - 24, H - 24);
  g.fillStyle = 'rgba(110,86,50,.08)'; for (let i = 0; i < 60; i++) g.fillRect(12 + (i * 89) % (W - 30), 12 + (i * 67) % (H - 30), 2 + (i * 11) % 36, 1);
  g.fillStyle = 'rgba(80,110,150,.85)'; g.font = '600 20px Georgia, serif'; g.fillText('HARBOUR LIGHT  ·  KEEPER’S LOG', 40, 56);
  g.strokeStyle = 'rgba(160,60,60,.45)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X - 10, 74); g.lineTo(X - 10, H - 30); g.stroke();
  g.strokeStyle = 'rgba(60,90,140,.2)'; for (let y = 104; y < H - 30; y += 42) { g.beginPath(); g.moveTo(30, y); g.lineTo(W - 30, y); g.stroke(); }
  g.fillStyle = 'rgba(40,60,90,.14)'; g.beginPath(); g.ellipse(W - 110, 170, 48, 32, 0.3, 0, 7); g.fill();        // a ring from a mug of something hot
  let y = 96; g.fillStyle = '#23305a';
  for (const [d, text] of LOG) {
    g.font = `21px ${HAND}`; g.fillText(d, 34, y);
    g.font = `24px ${HAND}`; for (const l of wrap(g, text, RW)) { g.fillText(l, X, y); y += 42; }
  }
  g.font = `italic 34px ${HAND}`; g.fillText('— C.', X + 150, y + 22);
  return cv;
}
function noteCard() {
  const W = 400, H = 360, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = '#f6f1c9'; g.fillRect(10, 10, W - 20, H - 20);
  g.fillStyle = '#b8342c'; g.beginPath(); g.arc(W / 2, 30, 9, 0, 7); g.fill();          // the drawing pin
  g.font = '600 23px "Courier New", ui-monospace, monospace'; g.fillStyle = '#1b1f2a';
  let y = 80; for (const para of NOTE) { for (const l of wrap(g, para, W - 64)) { g.fillText(l, 32, y); y += 32; } y += 18; }
  return cv;
}

feature({
  id: 'probe',

  init(k) {
    this.k = k; this.t = 0; this.checkT = 0; this.inT = 0; this.since = 0; this.seenAt = null; this.phase = 'idle';
    const P = k.plan, L = this.L = P.byId[P.front && P.front.a] || P.byId.lobby, vent = this.vent = P.vent;
    const H = this.hut = P.lakefront && P.lakefront.hut, light = this.light = P.lakefront && P.lakefront.light;
    if (!L || !vent || !H || !light) { this.off = true; return; }
    // Where it comes back to: inside the front doors, and the way in to there from over the terrace (low through the doorway).
    { const F = P.front, ok = F && F.along === 'x', fz = ok ? (F.z0 + F.z1) / 2 : (vent.z0 + vent.z1) / 2, x0 = ok ? F.x0 : vent.x0, x1 = ok ? F.x1 : vent.x1;
      this.spot = { x: Math.min(L.x1 - 1, x1 + 3.4), y: L.y, z: fz };
      this.wayIn = ok ? new THREE.CatmullRomCurve3([new THREE.Vector3(x0 - 7, L.y + 3.2, fz + 0.8), new THREE.Vector3(x0 - 2.6, L.y + 1.25, fz + 0.2), new THREE.Vector3(x0, L.y + 0.8, fz), new THREE.Vector3(x1 - 0.3, L.y + 0.82, fz),
        new THREE.Vector3(this.spot.x - 1.2, L.y + 0.78, fz), new THREE.Vector3(this.spot.x, L.y + FLY, fz)], false, 'centripetal') : null; }
    this.wait = { x: light.x - 1.2, y: 4.3, z: light.z + 6.5 };                                   // where it waits by the light
    const me = this;
    k.G.probe = { where: () => me.where(), get stage() { return st.stage; }, get phase() { return me.phase; } };
    const M = this.m = buildProbe(); M.group.visible = false; k.group.add(M.group);
    this.cols = M.cols; this.FLY = FLY;      // (FLY: for a test driver that places it)
    // the trail it leaves, so it is easy to follow: a ribbon of light in the call's colours, and a few slow motes
    this.ribbon = new Ribbon(); k.group.add(this.ribbon.mesh);
    this.motes = new Motes(); k.group.add(this.motes.mesh);
    // a pool of its light on the floor under it: green in the middle, the lamps' colours going round it
    this.pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), artSafe(new THREE.ShaderMaterial({
      uniforms: { uTime: M.U.uTime, uCols: M.U.uCols, uGlow: { value: GREEN.clone() }, uK: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uTime; uniform vec3 uGlow; uniform float uK; varying vec2 vUv;
        ${PAL}
        void main() {
          vec2 q = vUv * 2.0 - 1.0; float r = length(q), a = atan(q.y, abs(q.x) < 1e-5 ? 1e-5 : q.x) / 6.2832;
          float core = exp(-r * r * 9.0), rr = (r - 0.42) / 0.16, ring = exp(-rr * rr);
          vec3 c = uGlow * core + pal5(a + uTime * 0.07) * ring * 0.14;
          gl_FragColor = vec4(c * uK * (1.0 - smoothstep(0.75, 1.0, r)), 1.0);
        }`,
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    })));
    this.pool.renderOrder = 3; this.pool.visible = false; k.group.add(this.pool);
    for (const o of [M.group, this.ribbon.mesh, this.motes.mesh, this.pool]) o.userData.always = true;      // (it flies about: not for src/stream.js, which would go by where it stood when it was counted and hide it on a phone)
    this.pos = new THREE.Vector3(); this.v3 = new THREE.Vector3(); this.v4 = new THREE.Vector3(); this.v5 = new THREE.Vector3();
    // the card on screen when the log is read
    const el = this.cardEl = document.createElement('div'); el.id = 'keeperCard'; el.setAttribute('role', 'img');
    el.setAttribute('aria-label', 'The keeper’s log. ' + LOG.map(([d, t]) => d + ': ' + t).join(' ') + ' Signed C. A note pinned beside it: ' + NOTE.join(' '));
    el.style.cssText = 'position:fixed;left:50%;top:46%;transform:translate(-50%,-50%);width:min(92vw,620px);pointer-events:none;opacity:0;transition:opacity .25s;z-index:30;filter:drop-shadow(0 10px 24px rgba(0,0,0,.55))';
    document.body.appendChild(el);
    if (st.stage === 'flown') this._toLake();
  },

  // ---------------------------------------------------------------- where the "?" goes
  where() {
    if (this.off) return null;
    const ph = this.phase;
    if (ph === 'armed') return { x: this.spot.x, y: this.spot.y, z: this.spot.z };
    if (['rise', 'come', 'pass', 'look', 'herd'].includes(ph)) return { x: this.pos.x, y: this.L.y, z: this.pos.z };
    if (ph === 'takeoff' || ph === 'fly' || ph === 'lake' || ph === 'finale') return { x: this.wait.x, y: 0, z: this.wait.z };
    if (st.stage === 'gone' && !story.has('lighthouse')) return { x: this.hut.log.x, y: 0, z: this.hut.log.z };
    return null;
  },

  // ---------------------------------------------------------------- sounds
  _note(i, o = {}) {
    const S = this.k.sound, c = S && S.ctx; if (!c || c.state !== 'running' || !S.master) return;
    motifVoice(c, S.master, MOTIF[i].midi + (o.transpose == null ? 12 : o.transpose), c.currentTime + (o.at || 0), o.dur || 0.35, o.gain || 0.02);
    const ms = (o.at || 0) * 1000; setTimeout(() => { this.flashI = i; this.flash = 1; }, ms);
  },
  _call(beat = 0.28, gain = 0.03, transpose = 12) { let t = 0; MOTIF.forEach((n, i) => { this._note(i, { at: t, dur: n.beats * beat, gain, transpose }); t += n.beats * beat; }); return t; },
  _whoosh(up = true, vol = 0.035) {
    const S = this.k.sound, c = S && S.ctx; if (!c || c.state !== 'running' || !S.master) return;
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(up ? 320 : 1400, t); o.frequency.exponentialRampToValueAtTime(up ? 1800 : 260, t + 0.9);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
    o.connect(g); g.connect(S.master); o.start(t); o.stop(t + 1.05);
    this.k.synth.noise(0.7, { vol: vol * 0.6, lp: 2600 });
  },

  // ---------------------------------------------------------------- the probe, drawn where it is
  // opts: { tilt, roll (radians), floor (the floor under it, for the pool and the field; null: none), trail: false (none),
  //   wide: out of doors and far off (the glows grow with the camera's distance, so it can be followed across the
  //   grounds), step, life (the trail's spacing and how long it lasts), field: false }
  _show(dt, k, face, opts = {}) {
    const M = this.m, g = M.group, t = this.t, U = M.U, cols = this.cols;
    g.visible = true; g.position.copy(this.pos);
    if (face) { const want = Math.atan2(face.x - this.pos.x, face.z - this.pos.z); let d = want - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); g.rotation.y += d * Math.min(1, dt * 6); }
    M.body.rotation.x = Math.sin(t * 2.3) * 0.06 + (opts.tilt || 0); M.body.rotation.z = Math.cos(t * 1.9) * 0.06 + (opts.roll || 0);
    this.flash = Math.max(0, (this.flash || 0) - dt * 2.2);
    const f = this.flash, fc = cols[this.flashI || 0];
    U.uTime.value = t; U.uFlash.value = f; U.uFlashI.value = this.flashI || 0; U.uFlashC.value.copy(fc);
    const cam = k.G.camera ? k.G.camera.position : k.pos, far = cam.distanceTo(this.pos), wide = !!opts.wide;
    // the halo: faint indoors (the hull is the thing to see), and growing with distance outdoors so it stays a light in the sky
    M.halo.material.color.copy(GREEN).lerp(fc, f).multiplyScalar((wide ? 0.6 : 0.035) + f * 0.2);
    M.halo.scale.setScalar(wide ? Math.min(12, 1.8 + far * 0.045) : 1.4 * S);
    // the field under it, down to near the floor
    const fl = opts.floor, h = fl != null ? Math.max(0.04, Math.min(0.55 * S, this.pos.y - fl - 0.09 * S - 0.04)) : 0.6 * S;
    M.field.visible = opts.field !== false; M.field.scale.y = h;
    M.field.material.uniforms.uCol.value.copy(GREEN).lerp(fc, f * 0.8);
    M.field.material.uniforms.uK.value = (wide ? 0.6 : 0.15) * Math.min(1, h / 0.2) * (1 + f * 0.8);
    // the trail and the motes
    if (opts.trail !== false) {
      const o = this._tr || (this._tr = { step: 0, life: 0, width: 0, hueRate: 0 });
      o.step = opts.step || (wide ? 1.2 : 0.07); o.life = opts.life || (wide ? 3.2 : 1.5); o.hueRate = wide ? 0.025 : 0.35;
      o.width = wide ? Math.min(3, 0.12 + far * 0.018) : Math.min(0.12, 0.065 + far * 0.006) * S;
      const p = this.v5.set(this.pos.x, this.pos.y - (wide ? 0 : 0.03 * S), this.pos.z);
      this.ribbon.mat.uniforms.uK.value = wide ? 1.2 : 1;
      this.ribbon.update(p, t, o, cols);
      const m = this._mo || (this._mo = { rate: 0, spread: 0, drift: new THREE.Vector3(), life: 0, size: 0 });
      m.rate = wide ? 14 : 8; m.spread = (wide ? 0.5 : 0.28) * S; m.drift.set(0, wide ? -0.15 : -0.07, 0); m.life = wide ? 2.6 : 2.2; m.size = wide ? 0.06 + far * 0.004 : 0.03;
      p.y = this.pos.y - 0.08 * S;
      this.motes.update(dt, p, t, m, cols);
      const r = k.G.renderer, c = k.G.camera; if (r && c) this.motes.mat.uniforms.uScale.value = r.getContext().drawingBufferHeight / (2 * Math.tan(c.fov * Math.PI / 360));
    } else { this.ribbon.reset(); this.motes.mesh.visible = false; }
    // the pool of its light on the floor
    if (fl != null) {
      const hh = Math.max(0.1, this.pos.y - fl);
      this.pool.visible = true; this.pool.position.set(this.pos.x, fl + 0.014, this.pos.z); this.pool.scale.setScalar(1.0 + hh * 0.9);
      this.pool.material.uniforms.uK.value = (0.5 + f * 0.5) / (0.45 + hh * 1.4);
      this.pool.material.uniforms.uGlow.value.copy(GREEN).lerp(fc, f * 0.7);
    } else this.pool.visible = false;
  },
  _hide() { this.m.group.visible = false; this.ribbon.reset(); this.motes.reset(); this.pool.visible = false; },

  // ---------------------------------------------------------------- the way out: a line of points from you to the terrace
  _rooms(k) {
    const P = k.plan, L = this.L, ids = [L.id];
    for (const d of P.doors) {
      if (d.out || d.vent || d.hidden || d.shut || d.h < 1.3 || Math.abs(d.y - L.y) > 0.06) continue;
      const o = d.a === L.id ? d.b : d.b === L.id ? d.a : null, r = o && P.byId[o];
      if (r && !r.secret && Math.abs(r.y - L.y) < 0.06 && !ids.includes(o)) ids.push(o);
    }
    return ids;
  },
  _near(k) {        // in the lobby or a room off it, on its floor, and not far from where it comes in
    const p = k.pos, r = k.room;
    return !!r && (this.ids || (this.ids = this._rooms(k))).includes(r.id) && Math.abs(p.y - this.L.y) < 1.2 && Math.hypot(p.x - this.spot.x, p.z - this.spot.z) < 34;
  },
  _grid(k) { return this.g || (this.g = grid(k.plan, this.ids || (this.ids = this._rooms(k)), this.L.y)); },
  _way(k, ax, az, bx, bz) {
    const out = this._buf || (this._buf = new Float32Array(256)), g = this._grid(k);
    let n = path(g, ax, az, bx, bz, out, CLEAR); if (n < 2) n = path(g, ax, az, bx, bz, out, 0.3);      // (its whole rim clear of the walls, where there is room)
    const pts = []; for (let i = 0; i < n; i++) pts.push({ x: out[i * 2], z: out[i * 2 + 1] });
    return pts.length >= 2 ? pts : [{ x: ax, z: az }, { x: bx, z: bz }];
  },
  _buildRoute(k) {
    const p = k.pos, L = this.L, V = this.vent, vz = (V.z0 + V.z1) / 2, y = L.y;
    const pts = this._way(k, p.x, p.z, V.x1 + 0.8, vz).map(q => ({ x: q.x, y: y + FLY, z: q.z }));
    pts.push({ x: V.x1 + 0.15, y: y + 0.36, z: vz }, { x: V.x0 + 0.05, y: y + 0.36, z: vz });
    const ox = V.x0 - 2.6, gy = groundAt(k.plan, ox, vz, y + 0.5); pts.push({ x: ox, y: gy + FLY, z: vz });
    const S = [0]; for (let i = 1; i < pts.length; i++) S.push(S[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
    this.route = { pts, S, len: S[S.length - 1] };
  },
  _at(s, out) {
    const { pts, S } = this.route; s = Math.max(0, Math.min(this.route.len, s));
    let i = 1; while (i < S.length - 1 && S[i] < s) i++;
    const a = pts[i - 1], b = pts[i], f = S[i] > S[i - 1] ? (s - S[i - 1]) / (S[i] - S[i - 1]) : 1;
    return out.set(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, a.z + (b.z - a.z) * f);
  },
  _project(x, z) {
    const { pts, S } = this.route; let best = Infinity, bs = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz || 1e-9;
      const f = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2)), px = a.x + dx * f, pz = a.z + dz * f, d = (x - px) ** 2 + (z - pz) ** 2;
      if (d < best) { best = d; bs = S[i - 1] + Math.sqrt(l2) * f; }
    }
    return { s: bs, d: Math.sqrt(best) };
  },

  // ---------------------------------------------------------------- each frame
  active(k) { return !this.off && k.G.mode !== 'race' && !k.plan.racing && (this.phase !== 'idle' || st.stage === 'wait'); },
  update(dt, k) {
    this.t += dt;
    const ph = this.phase, G = k.G;
    if (ph === 'idle' || ph === 'armed') return this._due(dt, k);
    if (ph === 'rise') return this._rise(dt, k);
    if (ph === 'come') return this._come(dt, k);
    if (ph === 'pass') return this._pass(dt, k);
    if (ph === 'look') return this._look(dt, k);
    if (ph === 'herd') return this._herd(dt, k);
    if (ph === 'takeoff' || ph === 'fly') return this._fly(dt, k);
    if (ph === 'lake') return this._lake(dt, k);
    if (ph === 'finale') return this._finale(dt, k);
    void G;
  },

  // Is it time? Twice a second: the scene in the entrance hall over, works seen since, time indoors. Then, when you are near the lobby, in it comes.
  _due(dt, k) {
    if (st.stage !== 'wait') { this.phase = 'idle'; return; }
    const G = k.G, play = G.state === 'play', seenOff = !G.entry || (G.entry.stage !== 'wait' && !G.entry.busy);      // (it is the same saucer: it cannot come back before it has been seen off)
    if (play && k.room) { this.inT += dt; if (seenOff) this.since += dt; }
    if ((this.checkT -= dt) > 0) return;
    this.checkT = 0.5;
    if (!seenOff) return;
    const seen = G.museum.seenCount;
    if (this.seenAt == null) this.seenAt = seen;
    if (this.phase === 'idle') {
      if (this.inT < 75 || (seen - this.seenAt < 3 && this.since < 180)) return;
      this.phase = 'armed'; this._warm(k);
      if (k.room && !this._near(k)) k.say('Something is back in the entrance hall.', 0.5, 5);
    }
    if (play && !G.ride && !G.held && !G.study && this._near(k) && Math.hypot(k.pos.x - this.spot.x, k.pos.z - this.spot.z) > 1.4) this._start(k);
  },

  // Its shaders, compiled in the background once it is due, so it does not catch on the frame it first shows.
  _warm(k) {
    const G = k.G, r = G.renderer; if (this.warmed || !r || !r.compileAsync || !G.camera) return;
    this.warmed = true;
    for (const o of [this.m.group, this.ribbon.mesh, this.motes.mesh, this.pool]) { const v = o.visible; o.visible = true; r.compileAsync(o, G.camera, G.scene).catch(() => {}); o.visible = v; }
  },

  // ---------------------------------------------------------------- back in by the front doors
  _start(k) {
    this._warm(k);
    st.stage = 'flown'; save();          // from here on, a reload finds it waiting at the light
    this._buildRoute(k);
    this.phase = 'rise'; this.pt = 0;
    const S = this.spot, W = this.wayIn;
    if (W) W.getPointAt(0, this.pos); else this.pos.set(S.x, this.L.y + FLY + 1.6, S.z);
    this.m.group.rotation.y = 0;
    this.held = k.hold(() => {});
    k.synth.noise(0.5, { vol: 0.03, lp: 1200 }); this._whoosh(true, 0.025);
    // the camera: over your shoulder if the doors are in sight, else in the lobby looking at them
    const p = k.pos, inLobby = k.room && k.room.id === this.L.id, dx = S.x - p.x, dz = S.z - p.z, d = Math.hypot(dx, dz) || 1;
    const at = inLobby ? { x: p.x - dx / d * 1.0, y: p.y + 0.7, z: p.z - dz / d * 1.0 } : { x: S.x + 3, y: this.L.y + 1.3, z: S.z + 2.6 };
    confine(k.plan, at, 0.12, true, null, true);
    this.riseCam = at;
  },
  _rise(dt, k) {
    this.pt += dt; const t = this.pt, S = this.spot, W = this.wayIn, f = Math.min(1, t / 2.3), e = f * f * (3 - 2 * f);
    let q = null;
    if (W) { W.getPointAt(e, this.pos); q = W.getPointAt(Math.min(1, e + 0.04), this.v5); }      // in over the terrace, low through the doorway, and up to where it hangs
    else this.pos.set(S.x, S.y + FLY + 1.6 * (1 - e), S.z);
    this._show(dt, k, q, { floor: this.pos.x > S.x - 3.6 ? S.y : null, trail: !!W, tilt: 0.22 * (1 - e) });
    k.camClose = { at: this.riseCam, look: { x: this.pos.x, y: this.pos.y, z: this.pos.z } };
    if (t > 0.5 && !this.rang) { this.rang = true; this._note(0, { gain: 0.03, dur: 0.6 }); this._note(1, { gain: 0.03, dur: 0.6, at: 0.32 }); }
    if (t > 2.7) {
      this.rang = false;
      this.come = this._way(k, S.x, S.z, k.pos.x, k.pos.z); this.ci = 1;
      this.phase = 'come'; this.pt = 0;
    }
  },
  // to you, through the doorways (the same floor grid as the way out)
  _come(dt, k) {
    this.pt += dt; const p = k.pos, y = this.L.y + FLY;
    const q = this.come[this.ci], dx = q.x - this.pos.x, dz = q.z - this.pos.z, d = Math.hypot(dx, dz), sp = 6 * dt;
    if (d <= sp) { this.pos.x = q.x; this.pos.z = q.z; this.ci++; } else { this.pos.x += dx / d * sp; this.pos.z += dz / d * sp; }
    this.pos.y += (y - this.pos.y) * Math.min(1, dt * 4);
    this._show(dt, k, q, { floor: this.L.y, tilt: 0.22 });
    if (this.ci >= this.come.length || Math.hypot(p.x - this.pos.x, p.z - this.pos.z) < 2.6 || this.pt > 12) this._startPass(k);
  },
  // past you, round behind, and in front of your nose
  _startPass(k) {
    const v = k.v, p = k.pos, fx = Math.sin(v.yaw), fz = Math.cos(v.yaw), sx = fz, sz = -fx;
    const A = this.pos.clone(), side = ((this.pos.x - p.x) * sx + (this.pos.z - p.z) * sz) > 0 ? 1 : -1;
    const C = new THREE.Vector3(p.x + sx * side * 1.1 - fx * 1.8, p.y + 0.85, p.z + sz * side * 1.1 - fz * 1.8);
    const H = new THREE.Vector3(p.x + fx * 1.5, p.y + 0.45, p.z + fz * 1.5);
    confine(k.plan, H, R + 0.02, true); confine(k.plan, C, R + 0.02, true);
    this.passP = { A, C, H }; this.phase = 'pass'; this.pt = 0; this._whoosh(false, 0.02);
  },
  _pass(dt, k) {
    this.pt += dt; const f = Math.min(1, this.pt / 1.5), e = f * f * (3 - 2 * f), u = 1 - e, { A, C, H } = this.passP;
    this.pos.set(u * u * A.x + 2 * u * e * C.x + e * e * H.x, u * u * A.y + 2 * u * e * C.y + e * e * H.y, u * u * A.z + 2 * u * e * C.z + e * e * H.z);
    confine(k.plan, this.pos, R, true);
    this._show(dt, k, f > 0.6 ? k.pos : H, { floor: this.L.y, tilt: 0.3 * (1 - f) });
    if (f >= 1) { this.phase = 'look'; this.pt = 0; this.callLen = this._call(0.3, 0.035, 12); }
  },
  // a moment face to face, chiming the call
  _look(dt, k) {
    this.pt += dt; const H = this.passP.H, p = k.pos, t = this.t;
    this.pos.set(H.x + Math.sin(t * 1.7) * 0.03, H.y + Math.sin(t * 2.6) * 0.03, H.z + Math.cos(t * 1.3) * 0.03);
    this._show(dt, k, p, { floor: this.L.y });
    this.m.body.rotation.z += Math.sin(this.pt * 3) * 0.12;       // a curious tilt, one way, the other
    const dx = H.x - p.x, dz = H.z - p.z, d = Math.hypot(dx, dz) || 1, at = { x: p.x - dx / d * 0.62 + dz / d * 0.22, y: p.y + 0.3, z: p.z - dz / d * 0.62 - dx / d * 0.22 };
    confine(k.plan, at, 0.1, true, null, true);
    k.camClose = { at, look: { x: this.pos.x, y: this.pos.y, z: this.pos.z }, fov: 58 };
    if (this.pt > Math.max(2.2, this.callLen || 0)) {
      k.hold(null); this.held = null;
      const pr = this._project(p.x, p.z);
      this.s = Math.min(this.route.len, pr.s + LEAD); this.blend = 1; this.blendFrom = this.pos.clone();
      this.phase = 'herd'; this.pt = 0; this.idleT = 0; this.chimeT = 1.2; this.chimeI = 0; this.awayT = 0;
      this._whoosh(true, 0.015);
      k.say('It wants out. Herd it to the vent.', 0.3, 4);
    }
  },

  // ---------------------------------------------------------------- herding it out
  _herd(dt, k) {
    this.pt += dt;
    const p = k.pos, pr = this._project(p.x, p.z), s0 = this.s, len = this.route.len;
    const here = this._at(this.s, this.v3), dist = Math.hypot(p.x - here.x, p.z - here.z);
    const onWay = pr.d < 7 && (k.room ? this._near(k) || (k.room.id === this.L.id) : pr.s > len - 6);
    if (onWay) {
      const target = Math.min(len, pr.s + LEAD);
      if (target > this.s) { const gap = target - this.s, v = Math.min(11, 0.8 + gap * 3.2); this.s = Math.min(target, this.s + v * dt); }
      else if (target < this.s - 1.5 && dist > LEAD + 2.5) this.s = Math.max(target, this.s - 1.4 * dt);       // gone back in: it comes back to where you can see it
      if (pr.d < 2.5) this.s = Math.max(this.s, Math.min(len, pr.s + NEAREST));                                   // and is never caught
    }
    this.s = Math.max(0, Math.min(len, this.s));
    const moving = Math.abs(this.s - s0) > 0.003;
    this._at(this.s, this.pos);
    this.pos.y += Math.sin(this.t * 2.4) * 0.035; this.pos.x += Math.sin(this.t * 1.3) * 0.025;
    if (this.blend > 0) { this.blend = Math.max(0, this.blend - dt * 2.5); this.pos.lerp(this.blendFrom, this.blend * this.blend); }
    const S = this.route.S, n = S.length, floor = this.s < S[n - 3] ? this.L.y : this.s > S[n - 2] ? this.route.pts[n - 1].y - FLY : this.vent.y;      // (the last three points: into the vent, out of it, the terrace)
    this._show(dt, k, p, { floor, tilt: moving ? -0.18 : 0 });
    // still: it bobs and chimes softly, a note at a time
    if (moving) this.idleT = 0; else this.idleT += dt;
    if (this.idleT > 0.6 && (this.chimeT -= dt) <= 0) { this.chimeT = 2.4; this._note(this.chimeI, { gain: 0.012, dur: 0.5 }); this.chimeI = (this.chimeI + 1) % 5; }
    // out on the terrace with you: off it goes
    const V = this.vent, out = !k.room && !(p.x > V.x0 - 0.3 && p.x < V.x1 + 0.3 && p.z > V.z0 - 0.4 && p.z < V.z1 + 0.4);      // (out of the vent too, on the terrace)
    if (this.s >= len - 0.05 && out && dist < 8) return this._takeoff(k, true);
    // you went out some other way and are far off: it slips out of the vent and goes without you watching
    if (out && dist > 25) { this.awayT += dt; if (this.awayT > 15) { this.s = Math.min(len, this.s + 6 * dt); if (this.s >= len) return this._takeoff(k, false); } } else this.awayT = 0;
  },

  // ---------------------------------------------------------------- across the grounds to the light
  _takeoff(k, watched) {
    const a = this.pos.clone(), W = this.wait;
    const pts = [a, new THREE.Vector3(a.x - 3, a.y + 4, a.z - 0.5), new THREE.Vector3(a.x - 2, 25, a.z - 2), new THREE.Vector3(60, 30, 104), new THREE.Vector3(250, 30, 110),
      new THREE.Vector3(340, 14, 118), new THREE.Vector3(418, 10, 150), new THREE.Vector3(520, 8, 92), new THREE.Vector3(578, 5.5, 66), new THREE.Vector3(W.x - 4, W.y + 0.6, W.z + 4), new THREE.Vector3(W.x, W.y, W.z)];
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    this.flyLen = this.curve.getLength(); this.flyT = 0; this.flyDur = 22;
    this.phase = 'takeoff'; this.pt = 0; this.watched = watched;
    this.toy0 = k.pos.clone();
    if (watched) this.held = k.hold(() => {});
    this._whoosh(true, 0.04); this._call(0.16, 0.03, 12);
  },
  _fly(dt, k) {
    this.pt += dt; this.flyT += dt;
    // slow away, a long steady run, a slow arrival: speed ramps up over the first 8% of the time and down over the last 15%
    const f = Math.min(1, this.flyT / this.flyDur), a = 0.08, b = 0.85, vmax = 1 / (a / 2 + (b - a) + (1 - b) / 2);
    const u = f < a ? vmax * f * f / (2 * a) : f < b ? vmax * (a / 2 + (f - a)) : vmax * (a / 2 + (b - a) + ((1 - b) - (1 - f) ** 2 / (1 - b)) / 2);
    this.curve.getPointAt(Math.min(1, u), this.pos);
    this._show(dt, k, this.curve.getPointAt(Math.min(1, u + 0.01), this.v4), { wide: true, tilt: 0.35 });
    if (this.phase === 'takeoff') {
      const t = this.pt, p = this.toy0;
      if (this.watched) {
        // first from just behind the toy, looking up at it; then craning up high over the front, looking out after it
        const dx = this.pos.x - p.x, dz = this.pos.z - p.z, d = Math.hypot(dx, dz) || 1;
        const low = { x: p.x - dx / d * 1.4, y: p.y + 0.6, z: p.z - dz / d * 1.4 }, high = { x: p.x - 16, y: 36, z: p.z + 12 };
        const c = Math.min(1, Math.max(0, (t - 1.4) / 2.2)), e2 = k.G.set.reduce ? 0 : c * c * (3 - 2 * c);      // (Reduce motion: no crane up; it is watched go from where the camera stands)
        k.camClose = { at: { x: low.x + (high.x - low.x) * e2, y: low.y + (high.y - low.y) * e2, z: low.z + (high.z - low.z) * e2 }, look: { x: this.pos.x, y: this.pos.y, z: this.pos.z } };
      }
      if (t > (this.watched ? 5.2 : 0)) {
        this.phase = 'fly'; if (this.held) { k.hold(null); this.held = null; }
        if (this.watched) k.say('Off to the lake. To the harbour light.', 0.2, 5);
      }
    }
    if (f >= 1) this._toLake();
  },
  _toLake() { this.phase = 'lake'; this.pos.set(this.wait.x, this.wait.y, this.wait.z); this.chimeT = 1; this.chimeI = 0; this.ribbon.reset(); this.motes.reset(); this.pool.visible = false; this.m.group.visible = true; this.m.group.position.copy(this.pos); },

  // ---------------------------------------------------------------- waiting by the light
  _lake(dt, k) {
    const p = k.pos, W = this.wait, far = Math.hypot(p.x - W.x, p.z - W.z);
    if (far > 160) return;                                       // (nothing to do while you are a long way off)
    const t = this.t;
    this.pos.set(W.x + Math.sin(t * 0.7) * 0.25, W.y + Math.sin(t * 1.9) * 0.12, W.z + Math.cos(t * 0.6) * 0.2);
    this._show(dt, k, p, { wide: true, trail: false });
    if (far < 90 && (this.chimeT -= dt) <= 0) { this.chimeT = 3.2; this._note(this.chimeI, { gain: 0.016 * Math.max(0.3, 1 - far / 90), dur: 0.6 }); this.chimeI = (this.chimeI + 1) % 5; }
    // here: on the breakwater by the light (or flying up to it)
    const L = this.light, d = Math.hypot(p.x - L.x, p.z - (L.z + 3));
    if (k.G.state === 'play' && !k.G.held && !k.G.ride && ((k.v.kind === 'car' && p.y > 1.0 && d < 7) || (k.v.kind !== 'car' && d < 9 && p.y > 0.8))) this._startFinale(k);
  },

  // ---------------------------------------------------------------- once round the lantern, and up
  _startFinale(k) {
    this.phase = 'finale'; this.pt = 0; this.from = this.pos.clone();
    this.held = k.hold(() => {});
    const L = this.light, p = k.pos, dx = L.x - p.x, dz = L.z - p.z, d = Math.hypot(dx, dz) || 1;
    this.finCam = { x: p.x - dx / d * 1.6, y: p.y + 0.8, z: p.z - dz / d * 1.6 };
    this.a0 = Math.atan2(this.from.z - L.z, this.from.x - L.x);
    this.harbour = features.find(f => f.id === 'harbourlight');
    this.called = false;
  },
  _finale(dt, k) {
    this.pt += dt; const t = this.pt, L = this.light, cy = 5.5, r = 1.9;
    if (t < 1.0) {                    // to the lantern
      const f = t / 1.0, e = f * f * (3 - 2 * f); this.v3.set(L.x + Math.cos(this.a0) * r, cy, L.z + Math.sin(this.a0) * r); this.pos.lerpVectors(this.from, this.v3, e);
    } else if (t < 4.2) {             // once round it, the light gone green
      const f = (t - 1.0) / 3.2, a = this.a0 + f * Math.PI * 2; this.pos.set(L.x + Math.cos(a) * r, cy + Math.sin(f * Math.PI * 2) * 0.15, L.z + Math.sin(a) * r);
      if (this.harbour) this.harbour.green = Math.max(this.harbour.green || 0, 0.3);
    } else if (t < 4.9) {             // over the lantern a moment, the whole call, quick
      this.v3.set(L.x, cy + 1.4, L.z); this.pos.lerp(this.v3, Math.min(1, dt * 5));
      if (!this.called) { this.called = true; this._call(0.11, 0.04, 12); if (this.harbour) this.harbour.green = 0.6; }
    } else {                          // and up, faster and faster, gone
      if (!this.top) { this.top = this.pos.clone(); this._whoosh(true, 0.05); }
      const f = Math.min(1, (t - 4.9) / 2.2), e = Math.pow(f, 2.2); this.pos.set(this.top.x + 30 * e, this.top.y + 170 * e, this.top.z - 22 * e);
    }
    this._show(dt, k, t < 4.2 ? { x: L.x, z: L.z } : k.pos, { wide: true, step: 0.25, life: 2.4 });
    const look = t < 4.9 ? { x: L.x, y: cy, z: L.z } : { x: this.pos.x, y: Math.min(this.pos.y, this.finCam.y + 120), z: this.pos.z };
    k.camClose = { at: this.finCam, look, fov: t > 4.9 && !k.G.set.reduce ? 62 : 55 };      // (Reduce motion: no jump of the lens as it goes)
    if (t > 7.6) {
      this.top = null; k.hold(null); this.held = null; this._hide();
      this.phase = 'idle'; st.stage = 'gone'; save();
      k.say('Up, and gone. Not a sound.', 0.1, 4);
      if (!story.has('lighthouse')) k.say('A hut at the foot of the light. Something on the step.', 4.2, 5);
    }
  },

  // ---------------------------------------------------------------- the keeper's log, on the hut's step
  _logMeshes(k) {
    if (this.logG) return;
    const H = this.hut, g = this.logG = new THREE.Group(); g.name = 'keeper-log';
    const tl = new THREE.CanvasTexture(logCard()); tl.colorSpace = THREE.SRGBColorSpace; tl.anisotropy = 4;
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.025, 0.28), new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.8, emissive: 0x140c08, emissiveIntensity: 0.6 }));
    book.position.set(H.log.x, H.log.y + 0.0125, H.log.z); book.rotation.y = 0.18; g.add(book);
    const page = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.27).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tl, roughness: 0.9, emissiveMap: tl, emissive: 0xffffff, emissiveIntensity: 0.35 }));
    page.position.set(H.log.x, H.log.y + 0.026, H.log.z); page.rotation.y = 0.18 - Math.PI / 2; g.add(page);
    const tn = new THREE.CanvasTexture(noteCard()); tn.colorSpace = THREE.SRGBColorSpace;
    const note = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.165), new THREE.MeshStandardMaterial({ map: tn, roughness: 0.9, emissiveMap: tn, emissive: 0xffffff, emissiveIntensity: 0.35 }));
    note.position.set(H.x1 + 0.024, H.y + 0.72, H.door.z - 0.12); note.rotation.set(0, Math.PI / 2, 0.06); g.add(note);
    k.group.add(g);
  },
  _showCard(on) {
    const el = this.cardEl; el.innerHTML = '';
    if (on) {
      const a = logCard(), b = noteCard();
      a.style.cssText = 'width:66%;height:auto;display:block;transform:rotate(-1.2deg)';
      b.style.cssText = 'position:absolute;right:0;top:44%;width:38%;height:auto;transform:rotate(3deg);filter:drop-shadow(0 6px 12px rgba(0,0,0,.5))';
      el.style.position = 'fixed'; const box = document.createElement('div'); box.style.position = 'relative'; box.append(a, b); el.append(box);
      this.cardAt = { x: this.k.pos.x, z: this.k.pos.z, t: this.t };
    } else this.cardAt = null;
    el.style.opacity = on ? '1' : '0'; this.showing = on;
  },
  _read(k) {
    if (this.showing) { this._showCard(false); return; }
    this._showCard(true);
    if (story.add('lighthouse')) k.say('Clarice. She watched the museum from out here.', 0.6, 5);
  },

  near(v, k) {
    if (this.off || k.G.mode === 'race') return null;
    const A = this.hut.log, p = k.pos;
    if (Math.abs(p.y - A.y) < 0.8 && Math.abs(p.x - A.x) < 2 && Math.abs(p.z - A.z) < 2) {
      this._logMeshes(k);
      if (Math.hypot(p.x - A.x, p.z - A.z) < 0.95) return { verb: 'READ', hint: story.has('lighthouse') ? null : 'A logbook, left open on the step. E to read it.', act: () => this._read(k) };
    }
    if (this.cardAt && (Math.hypot(p.x - this.cardAt.x, p.z - this.cardAt.z) > 1.2 || this.t - this.cardAt.t > 20)) this._showCard(false);
    if (!this.logG && Math.abs(p.x - A.x) < 60 && Math.abs(p.z - A.z) < 60) this._logMeshes(k);
    return null;
  },
  spots() { return this.off ? [] : [{ kind: 'todo', id: 'keeper-log', name: 'Clarice’s log (the keeper’s hut)', x: this.hut.log.x, y: this.hut.log.y, z: this.hut.log.z }]; },
  // A new night: anything in the middle of happening is put where it would be saved.
  reset(k) {
    if (this.off) return;
    if (this.held) { k.hold(null); this.held = null; }
    if (this.cardEl) this._showCard(false);
    if (st.stage === 'flown') this._toLake(); else { this._hide(); this.phase = 'idle'; }
    this.inT = 0; this.since = 0; this.seenAt = null; this.top = null;
  },
  // A new game: it has not come up yet.
  fresh(k) {
    st = { stage: 'wait' }; save();      // (also on a night it is off: a new game begun then kept 'done', and no later night played it)
    if (this.off) return;
    if (this.held) { k.hold(null); this.held = null; }
    this._hide(); this.phase = 'idle'; this.inT = 0; this.since = 0; this.seenAt = null; this.top = null;
    if (this.cardEl) this._showCard(false);
  },
});
