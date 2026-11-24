// Edvard Munch, The Girl by the Window (1893), Gallery 245. The word: moonbeam.
//
// A dark room at night, hatched in violet-brown, blue and green; a window with a cross of glazing bars and a pale lace
// curtain drawn back; and on the floorboards the moonlight, two pale blue panes with his red-brown line round them and
// the bar's shadow between. What comes out of the picture is that light, and nothing else. Look, and his night runs out
// over the gallery floor from under the frame, in his own hatched strokes; a lamp across the street lays a long, faint,
// warm window on it. Then the moon clears a cloud and the window's light falls on the floor: four panes of pale blue
// paint with the cross of the bars in them, the lace curtain's shadow down one side, breathing, dust alight in the
// beam. It creeps over the floor as the moon goes round. A cloud crosses the moon: the panes dim almost to nothing,
// the dust goes out, the lamp's warm window is all there is, and the room holds its breath. The cloud passes and the
// light comes back, clearer than before, and the curtain lets its breath go.
//
// Music, very quietly: the opening of Grieg's Arietta, Lyric Pieces Op. 12 No. 1 (1867): the first phrase before the
// cloud, left hanging on its F while the light is gone, the answer (which comes home to E flat) as it returns.
//
// Nothing is solid. While the toy is near the light stays out after the look, and the toy throws a shadow in it.
// With "Reduce motion and flashing" on, everything goes at six tenths of the speed (the music too) and the dust does
// not shimmer. The light is paint on the floor; none of it falls on this picture or on any other.
//
// What it does not do: the girl does not come out, in any form (no figure, no shadow of one, no hand on the curtain),
// and nothing sets the player to watching her, because hers is a private moment; and it is quiet, not eerie, because
// this is a still picture of a night, not a frightening one.
import * as THREE from 'three';
import { lifeFor, ease, ramp, lerp, radialTexture } from '../paintlife.js';
import { strokes as strokeTex } from './brush.js';
import { score } from './stagecraft.js';

// The window's light on the floor (stage metres: u along the wall, out from it): the middle of its wall-side edge, how
// wide and how long it lies, how far it leans (u per metre out), and how far a ray runs along the floor for each metre
// it falls.
const UC = 0.55, O0 = 0.52, WID = 1.3, LEN = 1.62, LEAN = -0.46, RUN = 0.8;
const NIGHT = { u: 0, out: 1.15, ru: 2.9, ro: 2.7 };              // the night on the floor: its middle, and how far it reaches
const SWEEP = 2.9, SOFT = 1.15;                                   // a cloud's edge: how far it travels across, and how soft it is
const LAMP = { u: 0.1, out: 1.0, w: 0.95, len: 2.1, lean: 0.4 };  // the lamp's window: long and faint
const MOTES = 150, TOP = 0.92;                                    // dust in the beam, and how high it is seen (below any picture)
const E = 0.42;                                                   // the Arietta: a quaver (Poco andante e sostenuto)
const T_M1 = 1.0, T_M2 = 5.2;                                     // its first phrase; and its answer, as the moon returns
// Grieg, Arietta, Op. 12 No. 1, bars 1 to 8, in E flat, 2/4 (the top voice and the bass; his inner semiquavers are left
// out). [quavers from the top of the phrase, midi note, length in quavers]
const PHRASE1 = [[0, 79, 1], [1, 79, 1], [2, 79, 1], [3, 79, 1], [4, 79, 1], [5, 76, 1], [6, 77, 3.4]];
const PHRASE2 = [[0, 77, 1], [1, 77, 1], [2, 77, 1], [3, 77, 1], [4, 77, 1], [5, 74, 1], [6, 75, 2],
  [8, 75, 1], [9, 75, 1], [10, 74, 1], [11, 74, 1], [12, 72, 1], [13, 72, 1], [14, 70, 2],
  [16, 75, 1], [17, 75, 1], [18, 74, 1], [19, 70, 0.5], [19.5, 74, 0.5], [20, 72, 1], [21, 72, 1], [22, 70, 3.4]];
const BASS1 = [[0, 51, 8]], BASS2 = [[0, 51, 8], [8, 48, 2], [10, 46, 2], [12, 45, 2], [14, 50, 2], [16, 48, 2], [18, 46, 2], [20, 45, 2], [22, 50, 3.4]];
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
// The curtain's breaths (story seconds: when, how long, how deep), and after them one every so often.
const BREATHS = [[2.1, 1.7, 0.5], [6.3, 2.9, 1.0]];

const MOON_GLSL = /* glsl */`
uniform vec3 uO; uniform vec4 uAx, uWin, uMoon, uCloud, uCurt;
float mH(vec2 p) { p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 19.19); return fract(p.x * p.y); }
float mN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mH(i), mH(i + vec2(1.0, 0.0)), f.x), mix(mH(i + vec2(0.0, 1.0)), mH(i + vec2(1.0, 1.0)), f.x), f.y); }
// A floor point in the window's own terms: x across it (0 to 1), y from the sill (0) to the top (1).
vec2 mWin(vec2 q, vec4 win, float lean) { float o = q.y - win.y; return vec2((q.x - win.x - lean * o) / win.z + 0.5, o / win.w); }
// How far inside a pane (metres; negative: under the frame or a glazing bar).
float mPane(vec2 w, vec2 size) {
  float o = min(min(w.x, 1.0 - w.x) * size.x, min(w.y, 1.0 - w.y) * size.y);
  return min(o, min((abs(w.x - 0.5) - 0.034) * size.x, (abs(w.y - 0.6) - 0.021) * size.y));
}
// The sky: how much of the moon comes through just now (a cloud's shadow has a leading and a trailing edge).
float mSky(vec2 q) {
  float s = dot(q - vec2(0.12, 1.3), vec2(0.78, 0.62)) + 0.5 * (mN(q * 0.9 + uCloud.w * 0.11) - 0.5);
  float band = smoothstep(uCloud.y - ${SOFT.toFixed(2)}, uCloud.y + ${SOFT.toFixed(2)}, s) * (1.0 - smoothstep(uCloud.x - ${SOFT.toFixed(2)}, uCloud.x + ${SOFT.toFixed(2)}, s));
  return 1.0 - (1.0 - uCloud.z) * band;
}
// The lace curtain, drawn back down one side: how much light it lets through (1: clear glass). A veil hanging in folds,
// sprigs worked into it, a row of eyelets and a scalloped edge along its hem.
float mCurtain(vec2 w) {
  float y = clamp(w.y, 0.0, 1.0), t = uCurt.y, b = uCurt.x;
  float hem = 0.1 + 0.3 * pow(y, 1.5) + b * 0.16 * (0.3 + 0.7 * y) + 0.012 * uCurt.z * sin(y * 15.0 - t * 1.2) * (0.6 + b);
  hem += 0.013 * abs(sin(y * 31.0 + 0.4));
  float e = hem - w.x, inC = smoothstep(-0.008, 0.012, e);
  vec2 m = vec2(e * uWin.z + 0.02 * sin(y * 7.0 + t * 0.5), y * uWin.w);        // metres in from the hem, and along it
  float fold = 0.5 + 0.5 * sin(m.x * 30.0 + 1.6 * sin(m.y * 3.0 + t * 0.45) + b * 2.5);
  vec2 g = vec2(m.x / 0.17, m.y / 0.15); g.y += 0.5 * floor(g.x); vec2 c = (fract(g) - 0.5) * vec2(0.17, 0.15) + (vec2(mH(floor(g) + 1.3), mH(floor(g) + 5.1)) - 0.5) * 0.05;
  float hs = mH(floor(g)), r = length(c), th = atan(c.y, c.x) + hs * 6.0, big = 0.03 + 0.024 * mH(floor(g) + 3.7);
  float sprig = (1.0 - smoothstep(-0.006, 0.02, r - big * (0.7 + 0.3 * cos((hs > 0.5 ? 5.0 : 6.0) * th)))) * smoothstep(0.004, 0.02, r) * smoothstep(0.06, 0.1, m.x);
  float eyes = smoothstep(0.55, 0.9, cos(m.y * 6.2832 / 0.062)) * smoothstep(0.012, 0.022, m.x) * (1.0 - smoothstep(0.036, 0.05, m.x));
  float edge = 1.0 - smoothstep(0.0, 0.014, m.x);
  float net = 0.5 + 0.5 * sin(m.x * 6.2832 / 0.021) * sin(m.y * 6.2832 / 0.021);
  float through = (0.31 + 0.06 * net) * (0.72 + 0.4 * fold) * (1.0 - 0.5 * sprig) * (1.0 - 0.45 * edge) + 0.5 * eyes;
  return mix(1.0, min(through, 0.92), inC);
}
`;

lifeFor(154235, {
  title: /^The Girl by the Window/,
  word: 'moonbeam',
  stage: { out: 2.5, half: 1.5, cam: { dist: 3.25, height: 1.42, side: 0.55, fov: 56, lookU: -0.05, lookOut: 1.0, lookH: 0.5, floorOut: 2.45 } },
  wake: 2.4, ret: 2.6,
  linger: { near: 4, max: 40 },

  build(L) {
    const P = L.pal, col = (h, a = 0.2) => P.near(h, a), hex = c => '#' + c.clone().getHexString();
    const O = L.floor(0, 0);
    const u = this.u = {
      uO: { value: O.clone() }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) },
      uWin: { value: new THREE.Vector4(UC, O0, WID, LEN) }, uMoon: { value: new THREE.Vector4(LEAN, 0, RUN, 0) },      // lean, the moon, the run, -
      uCloud: { value: new THREE.Vector4(50, -9, 0, 0) },        // leading edge, trailing edge, how much comes through, time
      uCurt: { value: new THREE.Vector4(0, 0, 1, 0) },           // its breath, time, its ripple, -
    };
    // ---------------------------------------------------------- his paint: the dark room, and the light on its floor
    // (short hatched strokes, laid slanting as he laid them; each texture's alpha is a stroke's own number, so edges
    // break up a stroke at a time)
    this.tDark = strokeTex({ size: 512, base: hex(col('#2b2430', 0.35)), n: 2500, len: [22, 46], width: [5, 11], bend: 0.3, lift: 0.1, seed: 154,
      angle: (x, y, r) => -0.62 + (r() - 0.5) * 0.7,
      colors: [[hex(col('#2e2733', 0.4)), 4], [hex(col('#43343c', 0.4)), 3], [hex(col('#4d342f', 0.3)), 2.4], [hex(col('#2b335c', 0.3)), 2], [hex(col('#3a4468', 0.3)), 1], [hex(col('#2f4640', 0.3)), 1.2], [hex(col('#5a3d52', 0.3)), 1]] });
    this.tLight = strokeTex({ size: 512, base: hex(col('#94aedb', 0.12)), n: 2300, len: [24, 52], width: [6, 13], bend: 0.22, lift: 0.2, seed: 235,
      angle: (x, y, r) => -0.3 + (r() - 0.5) * 0.55,
      colors: [[hex(col('#a9c2e8', 0.12)), 4], [hex(col('#c7d9f1', 0.1)), 2.4], [hex(col('#e6edf7', 0.06)), 0.9], [hex(col('#7f9cd4', 0.12)), 2.6], [hex(col('#cfc0e2', 0.1)), 1.3], [hex(col('#9ccdc8', 0.1)), 1], [hex(col('#6a84c6', 0.12)), 1.3]] });
    const fu = this.fu = {
      tDark: { value: this.tDark }, tLight: { value: this.tLight },
      uNight: { value: new THREE.Vector2(0, 0) },                // how far it has spread, how deep it is
      uLamp: { value: new THREE.Vector4(LAMP.u, LAMP.out, LAMP.w, LAMP.len) }, uLampK: { value: new THREE.Vector2(LAMP.lean, 0) },
      uToy: { value: new THREE.Vector3(9, 9, 0) },
      uRim: { value: col('#6f382e', 0.12) }, uLampC: { value: col('#e39a72', 0.1) },
    };
    const fm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
    fm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u, fu);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D tDark, tLight; uniform vec2 uNight, uLampK; uniform vec4 uLamp; uniform vec3 uToy, uRim, uLampC;
${MOON_GLSL}
vec3 munchC; float munchA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz, q = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw)); float hh = lifeP.y - uO.y, wallp = step(0.05, hh);
  vec2 tq = mix(q, vec2(q.x, -hh), wallp);
  vec4 sd = texture2D(tDark, tq / 1.75), sl = texture2D(tLight, tq / 1.5 + vec2(0.37, 0.11));
  // his night: out from under the picture over the floor, its edge breaking up a stroke at a time; fainter up the wall's foot
  float rr = length((q - vec2(${NIGHT.u.toFixed(2)}, ${NIGHT.out.toFixed(2)})) / vec2(${NIGHT.ru.toFixed(2)}, ${NIGHT.ro.toFixed(2)}));
  float reach = max(uNight.x, 0.03), far = length(vec2(q.x * 0.8, q.y + hh)) / (3.6 * reach);
  float night = uNight.y * (1.0 - smoothstep(0.3, 1.0, rr + (sd.a - 0.6) * 0.55)) * (1.0 - smoothstep(0.75, 1.0, far + (sd.a - 0.6) * 0.3));
  night *= mix(1.0, 0.92 * (1.0 - smoothstep(0.0, 0.7, hh + (sd.a - 0.6) * 0.1)), wallp);
  vec3 C = sd.rgb * 0.6; float A = night * 0.9, la = 0.0, moonL = 0.0; vec3 add = vec3(0.0);
  if (wallp < 0.5) {
    float bias = (sl.a - 0.62) * 0.075;
    // the lamp across the street: a long warm window, soft, far out over the floor
    vec2 w2 = mWin(q, uLamp, uLampK.x); float d2 = mPane(w2, uLamp.zw);
    float lamp = uLampK.y * smoothstep(-0.09, 0.09, d2 + bias * 2.0) * (1.0 - 0.5 * clamp(w2.y, 0.0, 1.0)) * night;
    // the moon through the window: the panes, the bars' shadow, the lace, and whatever stands in the light
    vec2 w = mWin(q, uWin, uMoon.x); float d = mPane(w, uWin.zw) + bias, soft = 0.012 + 0.02 * clamp(w.y, 0.0, 1.0);
    float sky = uMoon.y * mSky(q), pane = smoothstep(-soft, soft, d), cur = mCurtain(w);
    vec2 dl = vec2(uMoon.x, 1.0) * uMoon.z * 0.36, pa = q - uToy.xy; float hs = clamp(dot(pa, dl) / dot(dl, dl), 0.0, 1.0);
    float shd = uToy.z * (1.0 - smoothstep(0.12, 0.2, length(pa - dl * hs) + hs * 0.03));
    moonL = sky * pane * cur * (1.0 - 0.86 * shd);
    // his red-brown line where the light stops, and in the bars' shadow
    float rim = (1.0 - pane) * (1.0 - smoothstep(0.025, 0.085, -d)) * sky * smoothstep(0.34, 0.75, sd.a);
    C = mix(C, uRim * (0.45 + 0.5 * sl.a), rim * 0.62); A = max(A, rim * 0.6);
    la = smoothstep(0.0, 0.5, moonL) * 0.96;
    add = uLampC * lamp * (1.0 - 0.9 * la) * (1.0 - 0.72 * sky) * 0.17 * (0.6 + 0.8 * sl.a);      // (seen when the moon is not: the eye has opened)
  }
  vec3 lightC = sl.rgb * mix(0.4, 0.74, moonL) * mix(vec3(0.7, 0.84, 1.14), vec3(1.0), smoothstep(0.1, 0.9, moonL));
  C = mix(C, lightC, la); A = max(A, la);
  munchC = C * A + add; munchA = A;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = munchC; diffuseColor.a = munchA;\n#include <opaque_fragment>');
    };
    fm.customProgramCacheKey = () => 'munch-moon-floor';
    {
      const f = (x, z) => L.floor(x, z).setY(L.y + 0.012), w = (x, h) => L.floor(x, -0.004).setY(L.y + h), q = [];
      const quad = (a, b, c, e) => { for (const v of [a, b, c, a, c, e]) q.push(v.x, v.y, v.z); };
      quad(f(-3.4, 4.3), f(3.4, 4.3), f(3.4, -L.wall + 0.01), f(-3.4, -L.wall + 0.01));
      quad(w(-3.0, 0.013), w(3.0, 0.013), w(3.0, 0.96), w(-3.0, 0.96));
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(q, 3)); g.computeVertexNormals();
      this.ground = new THREE.Mesh(g, fm); this.ground.renderOrder = 5; L.add(this.ground);
    }

    // ---------------------------------------------------------- dust in the beam: lit where the light is, dark in the bars' shadow
    // (each mote belongs to a ray: aC is where that ray meets the floor, and how high up it the mote starts)
    const pos = new Float32Array(MOTES * 12), aC = new Float32Array(MOTES * 12), aK = new Float32Array(MOTES * 8), idx = [];
    for (let i = 0; i < MOTES; i++) {
      const fo = O0 + 0.05 + L.rand() * (LEN - 0.1), fx = UC + LEAN * (fo - O0) + (L.rand() - 0.5) * (WID + 0.1), h = L.rand() * L.rand() * TOP * 1.2, s = L.rand(), sz = 0.026 + 0.034 * L.rand() * L.rand();
      for (let k = 0; k < 4; k++) { pos.set([k % 2 ? 0.5 : -0.5, k < 2 ? -0.5 : 0.5, 0], (i * 4 + k) * 3); aC.set([fx, fo, h], (i * 4 + k) * 3); aK.set([s, sz], (i * 4 + k) * 2); }
      idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3);
    }
    const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); mg.setAttribute('aC', new THREE.BufferAttribute(aC, 3)); mg.setAttribute('aK', new THREE.BufferAttribute(aK, 2)); mg.setIndex(idx);
    const mu = this.mu = { uTw: { value: 1 }, uDust: { value: col('#cfe0f6', 0.1) }, tDot: { value: radialTexture() } };
    const mm = new THREE.ShaderMaterial({
      uniforms: { ...u, ...mu }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`
attribute vec3 aC; attribute vec2 aK; uniform float uTw;
${MOON_GLSL}
varying vec2 vQ; varying float vB;
void main() {
  float s = aK.x, t = uCloud.w;
  float h = 0.03 + mod(aC.z - t * 0.012 * (0.4 + s), ${TOP.toFixed(2)});
  vec2 f = aC.xy + vec2(0.07 * sin(t * (0.21 + 0.2 * s) + s * 40.0), 0.08 * cos(t * (0.17 + 0.15 * s) + s * 23.0)) + uCurt.x * vec2(0.07, 0.05) * (0.3 + s);
  f.x += (uMoon.x - (${LEAN.toFixed(2)})) * (aC.y - uWin.y);                         // (the beam leans as the moon goes round)
  vec2 g = f - vec2(uMoon.x, 1.0) * uMoon.z * h, w = mWin(f, uWin, uMoon.x);          // back up its ray from the floor
  float lit = uMoon.y * mSky(f) * smoothstep(-0.02, 0.03, mPane(w, uWin.zw)) * mCurtain(w);
  vB = lit * (1.0 - uTw + uTw * (0.55 + 0.45 * sin(t * (0.5 + 0.8 * s) + s * 50.0))) * smoothstep(0.03, 0.14, g.y) * smoothstep(0.0, 0.1, h) * (1.0 - smoothstep(${(TOP - 0.2).toFixed(2)}, ${TOP.toFixed(2)}, h));
  vQ = position.xy * 2.0;
  vec3 c = uO + vec3(uAx.x, 0.0, uAx.y) * g.x + vec3(uAx.z, 0.0, uAx.w) * g.y + vec3(0.0, h, 0.0);
  vec4 mv = viewMatrix * vec4(c, 1.0); mv.xy += position.xy * aK.y * (vB > 0.004 ? 1.0 : 0.0);
  gl_Position = projectionMatrix * mv;
}`,
      fragmentShader: /* glsl */`
uniform vec3 uDust; uniform sampler2D tDot;
varying vec2 vQ; varying float vB;
void main() {
  float a = vB * texture2D(tDot, vQ * 0.5 + 0.5).a;
  gl_FragColor = vec4(uDust * a * 0.9, a);
}`,
    });
    this.dust = new THREE.Mesh(mg, mm); this.dust.renderOrder = 6; L.add(this.dust);
    this.T = 0; this.off = 0; this.speed = 1;
    this.hide();
  },

  hide() { this.ground.visible = false; this.dust.visible = false; this.fu.uNight.value.set(0, 0); this.u.uMoon.value.y = 0; this.fu.uToy.value.z = 0; },

  // The quiet band: the Arietta's melody and bass, and the draught at the curtain. `slow` stretches it all (1: as written).
  band(L, slow) {
    const s = score(L), at = (t0, k) => (t0 + k * E) * slow, len = d => Math.max(0.3, d * E * slow * 1.5);
    const mel = { type: 'sine', vol: 0.02, attack: 0.03, over: 2, overVol: 0.22 }, low = { type: 'sine', vol: 0.016, attack: 0.05, over: 2, overVol: 0.3 };
    for (const [k, m, d] of PHRASE1) s.note(at(T_M1, k), midiHz(m), len(d), mel);
    for (const [k, m, d] of BASS1) s.note(at(T_M1, k), midiHz(m), len(d), low);
    for (const [k, m, d] of PHRASE2) s.note(at(T_M2, k), midiHz(m), len(d), mel);
    for (const [k, m, d] of BASS2) s.note(at(T_M2, k), midiHz(m), len(d), low);
    for (const [t, d, a] of BREATHS) s.hit(t * slow, { d: d * slow, vol: 0.006 * a, bp: 380, q: 0.6, attack: 0.9 * slow });      // the draught, hardly there
    return s.done();
  },

  start(L, resumed) {
    if (resumed) { this.off = this.T - L.t; this.sc.from(1e9); return; }              // (it was still out: carry on from where it is, without the music)
    this.T = 0; this.off = 0; this.speed = L.calm ? 0.6 : 1;
    this.mu.uTw.value = L.calm ? 0 : 1; this.u.uCurt.value.z = L.calm ? 0.4 : 1;
    this.sc = this.band(L, 1 / this.speed); this.sc.from(0);
    if (!this.told && !L.quiet) { this.told = true; L.k.say('Moonlight comes in at the window and lies on the floor.', 4); }
  },
  end() { this.hide(); },
  reset() { this.told = false; this.hide(); },

  // The curtain's breath at story-time t: a slow rise and fall under everything, and now and then a longer one.
  breath(t) {
    let b = 0.16 + 0.14 * Math.sin(t * 0.8);
    const one = (t0, d, a) => { const x = (t - t0) / d; if (x > 0 && x < 1) b += a * Math.sin(Math.PI * Math.pow(x, 0.62)); };
    for (const [t0, d, a] of BREATHS) one(t0, d, a);
    if (t > 12) { const n = Math.floor((t - 12) / 6.5); one(12 + n * 6.5 + 0.8, 2.6, 0.45 + 0.4 * (((n * 7) % 5) / 4)); }
    return b;
  },
  // The sky at story-time t, into c: a cloud's leading and trailing edges across the floor, and how much comes through it.
  sky(t, c) {
    const A = -SWEEP, B = SWEEP;
    if (t < 3.2) c.set(50, lerp(A, B, ramp(t, 0.8, 2.4)), 0.0, 0);                                   // the moon comes clear
    else if (t < 9) c.set(lerp(A, B, ramp(t, 3.5, 4.6)), lerp(A, B, ramp(t, 5.1, 6.1)), 0.15, 0);     // the cloud: over, held, away
    else { const n = Math.floor((t - 9) / 13), t0 = 14 + n * 13; c.set(lerp(A, B, ramp(t, t0, t0 + 1.9)), lerp(A, B, ramp(t, t0 + 2.2, t0 + 4.4)), 0.3 + 0.3 * ((n * 3) % 4) / 3, 0); }      // thinner ones, now and then
    return c;
  },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return', U = this.u, F = this.fu;
    if (showing) this.T = L.t + this.off; else this.T += dt;
    const T = this.T, t = T * this.speed;
    const out = back ? 1 - ease.inOut(ramp(L.ret, 0, 0.6)) : 1, away = back ? 1 - ease.inOut(ramp(L.ret, 0.3, 1)) : 1;
    // ---- the night
    F.uNight.value.set((0.04 + 0.96 * ease.out(ramp(t, 0.05, 1.9))) * (0.25 + 0.75 * away), ease.smooth(ramp(t, 0, 0.9)) * away);
    // ---- the moon: clearer after the cloud; going round, so the light leans less and lies further out
    const round = 1 - Math.exp(-t / 22);
    U.uMoon.value.x = LEAN + 0.3 * round; U.uMoon.value.y = lerp(0.72, 1, ease.smooth(ramp(t, 4.6, 5.3))) * out;
    U.uWin.value.y = O0 + 0.1 * round; U.uWin.value.w = LEN + 0.14 * round;
    this.sky(t, U.uCloud.value); U.uCloud.value.w = t;
    U.uCurt.value.x = this.breath(t); U.uCurt.value.y = t;
    F.uLampK.value.y = ease.smooth(ramp(t, 0.5, 1.8)) * away;
    // ---- the toy in the light: its shadow
    const toy = L.k.G.vehicle, on = toy && toy.group && toy.group.visible && Math.abs(toy.pos.y - L.y) < 0.4;
    if (on) { const dx = toy.pos.x - L.cx, dz = toy.pos.z - L.cz; F.uToy.value.set(dx * L.tx + dz * L.tz, dx * L.nx + dz * L.nz, 1); } else F.uToy.value.z = 0;
    this.ground.visible = F.uNight.value.y > 0.002; this.dust.visible = U.uMoon.value.y > 0.01;
    if (showing) this.sc.play(L.t);
    L.voice().place();
  },
});
