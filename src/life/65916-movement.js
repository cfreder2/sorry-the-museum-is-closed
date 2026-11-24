// Marsden Hartley, Movement (1913), Gallery 392. The word: orbit.
//
// He painted it in Berlin, in flat, hot colour inside a heavy black line. Low in the middle sits a big red disc with a
// pale heart. Up to its right is a smaller orange disc with a white egg in it, and from that one a band of ochre
// sweeps down round the red disc and off the bottom of the canvas, carrying seven white arrowheads, each bigger than the
// one before, every point turned towards the orange disc. It is how a painter who cannot make a thing move shows that
// it is moving: a body, and its wake spreading out behind it. The title says the rest.
//
// So here it moves. The red disc drops out from under the frame, lands heavily, bounces once and rolls out to sit on
// the floor. The orange one comes out under the frame's right corner, drops onto its path and sets off round the red
// one: an ellipse tilted up towards the wall, so that it is slowest at the top, by the wall, then falls away down the
// left, skims the floor across the front (a knock; the red disc rocks, and its heart warms as the small one goes by)
// and climbs the right side back to the top. Behind it, in the air along the way it has come, it lays his ochre band,
// widening, black-edged, a pale yellow down its inner side; and the white arrowheads stream out along it, each born
// small at the disc and growing as it falls behind, the last of them left standing where it is before the band ends
// in a lifted brush's ragged edge. Once each time round, at the top, the room shows what the canvas shows: the
// orange disc up to the right of the red one, its band curving down and away from it.
//
// The music is Bach's two-part Invention in F (No. 8, BWV 779, 1723): one hand sets off alone and the other follows it
// note for note, a bar behind, as the arrowheads follow the disc. The museum says Hartley sought to make his painting
// more like music; the year before, in Paris, he had named a picture for Bach's preludes and fugues (Musical Theme
// No. 2, 1912, now in Madrid). The red disc lands on the first bar's silent beat, the orange one sets off as the
// second hand comes in, and it skims the floor on the first beat of the bar where both hands run. Once round is four
// bars. (Bach's first Prelude is already van Gogh's, in Gallery 241.)
//
// When you stop looking it stays while the toy is near, and then the wake is the toy's as well: drive, and the ochre
// band and the white arrowheads are painted on the floor behind the toy. The orange disc hops over the toy if it is
// in the way, and the red one can be nudged aside and comes back. Then the band is drawn in, and the discs go back up
// under the frame.
//
// Everything is flat and drawn, as he drew it: the discs are cards that face you, the band is a ribbon of paint.
// Kandinsky's Improvisation, the next picture along, plays its shapes as the notes of a tune; nothing here is a note.
// The stage is kept to a metre and a half from the wall: the room's stunt ramp begins at 1.7 m.
// What it does not do: the black peak with its white ovals, the zigzags, the green wavy line and the eye-shape in the
// yellow triangle stay in the picture (a peak with two ovals can be taken for a hooded face, and a wavy green line let
// loose in a room for a snake); the discs go their own way and nothing watches or follows the toy; and though the
// picture was made on the eve of a war there are no drums, no marching and no emblems here, only two discs and a
// trail of paint.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01 } from '../paintlife.js';
import { score, noise, hump } from './stagecraft.js';
import { hz } from './tunes.js';

const TAU = Math.PI * 2;
// ---------------------------------------------------------------- the music: J. S. Bach, Invention No. 8 in F, BWV 779
// (1723), bars 1 to 12 (to the cadence in C, which leads back to the top), both hands, after the Bach-Gesellschaft
// text. A note is a quaver; `/` a semiquaver; `*2` a crotchet; r a quaver's rest.
const R3 = s => `${s} ${s} ${s}`;
const RH = ['r F4 A4 F4 C5 F4', 'F5 E5/ D5/ C5/ D5/ C5/ Bb4/ A4/ Bb4/ A4/ G4/', 'F4 A4 C5 A4 F5 C5', R3('A5/ C6/ Bb5/ C6/'), R3('F5/ A5/ G5/ A5/'),
  R3('D5/ F5/ E5/ F5/'), 'B4 G4 D5 B4 F5 D5', 'G5/ A5/ G5/ F5/ E5/ F5/ E5/ D5/ C5/ D5/ C5/ Bb4/', 'A4 D5/ C5/ B4/ C5/ B4/ A4/ G4/ A4/ G4/ F4/',
  'E4/ F4/ E4/ D4/ C4 C5/ B4/ C5 E4', 'F4 C5 E4 C5 D4 B4', 'C5*2 r r r r'];
const LH = ['r r r r r r', 'r F3 A3 F3 C4 F3', 'F4 E4/ D4/ C4/ D4/ C4/ Bb3/ A3/ Bb3/ A3/ G3/', 'F3 A3 C4 A3 F4 C4', R3('A4/ C5/ Bb4/ C5/'), R3('F4/ A4/ G4/ A4/'),
  R3('D4/ F4/ E4/ F4/'), 'B3 G3 C4 G3 E4 C4', 'F4/ G4/ F4/ E4/ D4/ E4/ D4/ C4/ B3/ C4/ B3/ A3/', 'G3 C4/ B3/ A3/ B3/ A3/ G3/ F3/ G3/ F3/ E3/',
  'D3/ E3/ D3/ C3/ G3/ F3/ E3/ F3/ G3 G2', 'r C3 E3 C3 G3 C3'];
const QUAVER = 0.26, BAR = 6 * QUAVER;               // (a crotchet = 115)
function part(bars, vol) {
  const ev = []; let t = 0;
  for (const bar of bars) for (const tok of bar.split(/\s+/).filter(Boolean)) {
    const m = /^([A-G][b#]?\d|r)(\/|\*\d)?$/.exec(tok), len = !m[2] ? 1 : m[2] === '/' ? 0.5 : +m[2].slice(1);
    if (m[1] !== 'r') ev.push({ t: t * QUAVER, f: hz(m[1]), d: 0.2 + len * QUAVER * 1.25, vol, type: 'triangle', attack: 0.004, over: 2, overVol: 0.22 });
    t += len;
  }
  return ev;
}

// ---------------------------------------------------------------- the timing (seconds of show)
const T_MUSIC = 0.6;                                 // bar 1: the first hand, alone
const T_SKIM = T_MUSIC + 3 * BAR;                    // bar 4, where both hands run: the orange disc skims the floor on its first beat
const T_LAUNCH = T_SKIM - 3.296;                     // so it sets off this long before (top to bottom, with its easing in, takes 3.3 s): as the second hand comes in
const T_ORB = 4 * BAR;                               // once round: four bars
const RR = 0.3, RO = 0.18;                           // the red disc's radius, the orange one's (m): as 5 to 3, as he has them
const G = 9.8, BOUNCE = t => G * t * t / 8;          // how high a bounce that lasts t seconds goes
const TR0 = 0, TR2 = T_MUSIC, TR3 = T_MUSIC + QUAVER, TR4 = 1.95;        // the red disc: out, (falls,) lands on the bar's silent beat, lands again on its first note, in its place
const TO0 = T_LAUNCH - 0.62, TO1 = TO0 + 0.2;        // the orange one: out from under the rail, then down onto its path

// ---------------------------------------------------------------- the two discs and the orbit (metres: along the wall, out from it, up)
const RED = [-0.05, 1.0], RED0 = [0.1, 0.07];        // where the red disc sits, and where it comes out from under the rail
// The orange disc's path: an ellipse round the red disc, tilted up towards the wall (and a little to the right), so
// that it skims the floor in front and is highest at the back, up to the right of the red disc, as it is in the picture.
const RING = { cu: 0.15, cout: 0.95, A: 1.05, B: 0.37, gu: 0.1, go: 0.95, low: RO + 0.03, swing: 2.6 };
const EDGE = 0.94;                                   // a disc's rim on its card
const TONE = 0.8;                                    // his colours a little under full strength: paint in a lit room, not lamps
const NT = 512;
function ring() {
  const { cu, cout, A, B, gu, go, low, swing } = RING, amp = Math.hypot(gu * A, go * B), hc = low + amp, t0 = Math.atan2(-go * B, gu * A);
  // th: how far round from the top, the way it goes (at the top, to the left; down the left side; across the front)
  const at = (th, o) => { const t = t0 - th; o.u = cu + A * Math.cos(t); o.out = cout + B * Math.sin(t); o.h = hc + gu * (o.u - cu) - go * (o.out - cout); return o; };
  const sT = new Float32Array(NT + 1), U = new Float32Array(NT + 1), O = new Float32Array(NT + 1), H = new Float32Array(NT + 1), tS = new Float32Array(NT + 1), p = at(0, {}), q = {};
  for (let i = 1; i <= NT; i++) { at(i / NT * TAU, q); sT[i] = sT[i - 1] + Math.hypot(q.u - p.u, q.out - p.out, q.h - p.h); p.u = q.u; p.out = q.out; p.h = q.h; }
  const P = sT[NT];
  for (let j = 0, k = 0; j <= NT; j++) { const s = j / NT * P; while (k < NT - 1 && sT[k + 1] < s) k++; at((k + (s - sT[k]) / (sT[k + 1] - sT[k] || 1)) / NT * TAU, q); U[j] = q.u; O[j] = q.out; H[j] = q.h; }
  // its speed: slowest over the top, fastest at the bottom, as a thing that climbs and falls goes (the time at each point)
  for (let j = 1; j <= NT; j++) { const h = (H[j] + H[j - 1]) / 2; tS[j] = tS[j - 1] + (P / NT) / Math.sqrt(1 + swing * (hc + amp - h) / (2 * amp)); }
  for (let j = 0; j <= NT; j++) tS[j] *= T_ORB / tS[NT];
  const nrm = [-gu, 1, go].map(x => x / Math.hypot(gu, 1, go));      // the plane it lies in faces up and out into the room
  return {
    P, nrm, top: at(0, {}), bottom: H.indexOf(Math.min(...H)) / NT * P,      // (bottom: how far round its lowest point is)
    // how far round it has gone (metres of path) tau seconds after setting off from the top
    s(tau) {
      const laps = Math.floor(tau / T_ORB), t = tau - laps * T_ORB; let a = 0, b = NT;
      while (b - a > 1) { const m = (a + b) >> 1; if (tS[m] <= t) a = m; else b = m; }
      return laps * P + (a + (t - tS[a]) / (tS[b] - tS[a] || 1)) * P / NT;
    },
    // the point of the path at arc length s (it wraps), and the way it heads there
    arc(s, o) {
      s -= Math.floor(s / P) * P; const x = Math.min(NT - 1e-4, s / P * NT), i = Math.floor(x), f = x - i;
      o.u = U[i] + (U[i + 1] - U[i]) * f; o.out = O[i] + (O[i + 1] - O[i]) * f; o.h = H[i] + (H[i + 1] - H[i]) * f;
      const du = U[i + 1] - U[i], dout = O[i + 1] - O[i], dh = H[i + 1] - H[i], l = Math.hypot(du, dout, dh) || 1; o.du = du / l; o.dout = dout / l; o.dh = dh / l; return o;
    },
  };
}

// ---------------------------------------------------------------- the wake: his band and his arrowheads
const NSEG = 44;
const RHO = 1.36, LNR = Math.log(RHO);               // each arrowhead this much further back, and bigger, than the one before
// [width at the head, widening per metre, the first arrowhead's distance behind, the radius of what makes it, its length,
//  how far the head goes for each new arrowhead]; the band starts at the rim of what makes it, cut to its curve
const WAKE = [[0.11, 0.105, 0.22, RO * 1.02, 1.6, 0.43], [0.085, 0.13, 0.3, 0.22, 1.05, 0.3]];        // the orange disc's; the toy's
const HP = 72;                                       // points of the toy's track kept

const GLSL_NOISE = /* glsl */`
float mH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float mN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mH(i), mH(i + vec2(1.0, 0.0)), f.x), mix(mH(i + vec2(0.0, 1.0)), mH(i + vec2(1.0, 1.0)), f.x), f.y); }
float mH1(float n) { return fract(sin(n * 91.345 + 3.1) * 47453.5453); }
`;


lifeFor(65916, {
  title: /^Movement$/,
  word: 'orbit',
  stage: { out: 1.6, half: 1.5, cam: { dist: 3.0, side: 0.25, height: 0.8, fov: 62, lookU: 0.15, lookOut: 0.4, lookH: 1.0, floorOut: 1.5 } },
  wake: 2.2, ret: 2.2,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.18) => P.near(h, a).multiplyScalar(TONE), v3 = c => new THREE.Vector3(c.r, c.g, c.b);
    this.cH = L.cy - L.y; this.railH = L.rail - L.y;
    this.ring = ring();
    this.v = new THREE.Vector3();
    this.po = { u: 0, out: 0, h: 0, s: 0, sq: 0 }; this.pr = { u: 0, out: 0, h: 0, s: 0, sq: 0 }; this.a = {};
    this.bo = { u: 0, out: 0, h: 0, s: 0 }; this.br = { u: 0, out: 0, h: 0, s: 0 };
    this.red = { du: 0, dout: 0, vu: 0, vout: 0, roll: 0, x: 0, z: 0, seen: false }; this.ora = { roll: 0, x: 0, z: 0, seen: false };
    this.toy = { x: new Float32Array(HP), z: new Float32Array(HP), n: 0, head: 0, S: 0, still: 9, cyc: 0 };
    this.S = 0;

    // ---------------------------------------------------------- the discs: two cards that face you, drawn as he drew them
    const ink = col('#231f1e', 0.1);
    const base = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.instanceCount = 2;
    const dyn = (n, k) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(n * k), k); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.aPos = dyn(2, 4); this.aSize = dyn(2, 4);
    geo.setAttribute('aPos', this.aPos); geo.setAttribute('aSize', this.aSize); geo.setAttribute('aKind', new THREE.InstancedBufferAttribute(new Float32Array([0, 1]), 1));
    const UD = {
      uInk: { value: v3(ink) }, uRed: { value: v3(col('#b7302a')) }, uRedHot: { value: v3(col('#d34422')) }, uCrimson: { value: v3(col('#74212a')) },
      uHeart: { value: v3(col('#f0b6a2', 0.1)) }, uPale: { value: v3(col('#e9a79a', 0.1)) }, uOrange: { value: v3(col('#d2691f')) }, uYellow: { value: v3(col('#eda21a')) },
      uRust: { value: v3(col('#a5361c')) }, uEgg: { value: v3(col('#fbf6e2', 0.08)) }, uEgg2: { value: v3(col('#f3dc9c', 0.1)) },
    };
    const dmat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false });
    dmat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, UD);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec4 aPos, aSize; attribute float aKind; varying vec2 vQ; varying vec3 vK;`)
        .replace('#include <project_vertex>', `vec4 mvPosition = modelViewMatrix * vec4(aPos.xyz, 1.0);
  { float c = cos(aPos.w), s = sin(aPos.w); mvPosition.xy += vec2(c * position.x - s * position.y, s * position.x + c * position.y) * aSize.xy; }
  gl_Position = projectionMatrix * mvPosition;
  vQ = position.xy * 2.0; vK = vec3(aKind, aSize.z, aSize.w);`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec2 vQ; varying vec3 vK; uniform vec3 uInk, uRed, uRedHot, uCrimson, uHeart, uPale, uOrange, uYellow, uRust, uEgg, uEgg2;
${GLSL_NOISE}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  {
    vec2 q = vQ; float r = length(q), a = atan(q.y, q.x), sd = vK.x * 7.3, lit = vK.y; vec2 dir = q / max(r, 1.0e-3);
    // the brush: round and round with the form, and a broader scumble across it
    float n1 = mN(q * 8.0 + sd), n2 = mN(dir * 3.2 + vec2(r * 12.0, -r * 9.0) + sd), n3 = mN(dir * 7.0 + vec2(r * 4.0, r * 5.0) + sd * 2.0);
    float rim = ${EDGE.toFixed(2)} + 0.016 * sin(a * 3.0 + sd) + 0.012 * sin(a * 7.0 + 2.0 * sd) + 0.03 * (n3 - 0.5);
    float d = r - rim; if (d > 0.0) discard;
    vec3 c;
    if (vK.x < 0.5) {
      // the big red disc: vermilion, a crimson shadow low on the left, a hotter disc within it, and the pale heart
      vec2 qi = q - vec2(-0.05, 0.07); float ri = length(qi), band = smoothstep(0.50, 0.60, ri + 0.07 * (n1 - 0.5));
      c = mix(uRedHot, uRed, band);
      c = mix(c, uCrimson, 0.75 * band * smoothstep(0.25, -0.55, q.y + 0.45 * q.x) * (0.45 + 0.9 * n2));
      c = mix(c, uCrimson, 0.5 * (1.0 - smoothstep(0.0, 0.06, abs(ri - 0.57))) * step(0.42, n3));
      c = mix(c, uOrange, 0.45 * (1.0 - band) * smoothstep(0.55, 0.9, n2));
      c *= 0.78 + 0.42 * n2;
      c = mix(c, uCrimson, 0.4 * smoothstep(0.55, 0.8, n3) * band);                               // darker strokes dragged round it
      float hr = length((q - vec2(-0.11, 0.13)) * vec2(1.0, 0.82)) + 0.16 * (n1 - 0.5) + 0.05 * (n2 - 0.5);
      c = mix(c, uHeart * (0.86 + 0.2 * n3), (1.0 - smoothstep(0.05, 0.17, hr)) * (0.8 + 0.2 * lit));
      c = mix(c, uPale, 0.4 * step(0.86, mN(dir * 9.0 + vec2(r * 30.0, r * 23.0) + sd * 3.0)) * step(0.6, n1) * band);      // the ground showing through
      c *= 1.0 + 0.06 * lit;
    } else {
      // the orange disc: orange turning to yellow on one side, rust low down, and the white egg in its black line
      c = mix(uOrange, uYellow, smoothstep(-0.25, 0.55, 0.8 * q.x + 0.35 * q.y + 0.5 * (n1 - 0.5)));
      c = mix(c, uRust, 0.8 * smoothstep(0.35, 0.9, r) * smoothstep(0.1, -0.7, q.y + 0.3 * q.x + 0.4 * (n2 - 0.5)));
      c *= 0.84 + 0.3 * n2;
      vec2 e = q - vec2(-0.16, 0.08); e = vec2(0.94 * e.x + 0.34 * e.y, -0.34 * e.x + 0.94 * e.y);
      float er = length(e / vec2(0.25, 0.36)) + 0.14 * (n1 - 0.5), ea = atan(e.y, e.x);
      if (er < 1.16 + 0.2 * sin(ea + 0.6) + 0.08 * sin(ea * 3.0 + 2.0) && mN(vec2(ea * 1.6, 3.0) + sd) > 0.26) c = uInk * (0.8 + 0.4 * n1);      // (its black line: heavier on one side, and broken)
      if (er < 1.0) c = mix(uEgg, uEgg2, smoothstep(0.35, 0.8, mN(e * vec2(5.0, 12.0) + 4.0))) * (0.9 + 0.12 * n3);
    }
    // his black line round it, thick and thin
    float lw = (vK.x < 0.5 ? 0.115 : 0.15) * (1.0 + 0.42 * sin(a + 4.4 + sd)) + 0.035 * (n1 - 0.5);
    if (-d < lw) c = uInk * (0.78 + 0.45 * n2);
    diffuseColor.rgb = c;
  }`);
    };
    dmat.customProgramCacheKey = () => 'hartley-discs';
    this.discs = L.add(new THREE.Mesh(geo, dmat)); this.discs.name = 'discs';

    // ---------------------------------------------------------- the wakes: two ribbons of paint (the orange disc's in the
    // air along its path, the toy's on the floor), one draw call
    const nv = 2 * (NSEG + 1) * 2, wpos = new Float32Array(nv * 3), waw = new Float32Array(nv * 3), idx = [];
    for (let k = 0; k < 2; k++) for (let i = 0; i <= NSEG; i++) for (let s = 0; s < 2; s++) {
      const d = WAKE[k][4] * i / NSEG, v = (k * (NSEG + 1) + i) * 2 + s;
      waw[v * 3] = (s ? 1 : -1) * this.half(k, d); waw[v * 3 + 1] = d; waw[v * 3 + 2] = k;
    }
    for (let k = 0; k < 2; k++) for (let i = 0; i < NSEG; i++) { const a = (k * (NSEG + 1) + i) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const wgeo = new THREE.BufferGeometry();
    wgeo.setAttribute('position', new THREE.BufferAttribute(wpos, 3).setUsage(THREE.DynamicDrawUsage)); wgeo.setAttribute('aW', new THREE.BufferAttribute(waw, 3)); wgeo.setIndex(idx);
    this.uWake = [new THREE.Vector4(), new THREE.Vector4()];        // each: its length now, how far the next arrowhead has got, how many have been born
    const UW = {
      uWake: { value: this.uWake }, uShape: { value: WAKE.map(W => new THREE.Vector4(W[0], W[1], W[2], W[3])) },
      uInk: { value: v3(ink) }, uOchre: { value: v3(col('#cf9a50')) }, uOrangeD: { value: v3(col('#c07a34')) }, uYellow: { value: v3(col('#f1dc86', 0.12)) },
      uWhite: { value: v3(col('#f6f1e4', 0.08)) }, uPinkW: { value: v3(col('#eab9ae', 0.1)) },
    };
    const wmat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
    wmat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, UW);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aW; varying vec3 vW;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vW = aW;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vW; uniform vec4 uWake[2]; uniform vec4 uShape[2]; uniform vec3 uInk, uOchre, uOrangeD, uYellow, uWhite, uPinkW;
${GLSL_NOISE}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  {
    vec4 U = vW.z > 0.5 ? uWake[1] : uWake[0], S = vW.z > 0.5 ? uShape[1] : uShape[0];
    float x = vW.x, d = vW.y, len = U.x;
    if (len < 0.03 || d < 0.0 || d * d + x * x < S.w * S.w) discard;
    float w = S.x + S.y * d, xn = x / w;
    float n1 = mN(vec2(d * 5.0, x * 38.0) + vW.z * 9.0), n2 = mN(vec2(d * 26.0, x * 11.0) + 3.7), n3 = mN(vec2(d * 9.0, x * 9.0) + 11.0);
    float edge = abs(xn) + (0.005 / w) * (n2 - 0.5) * 2.0 + 0.07 * (mN(vec2(d * 3.0, sign(x) * 5.0 + vW.z)) - 0.5);      // a loaded brush's edge
    if (edge > 1.0) discard;
    // its end is where the brush was lifted: a little ragged, bristle by bristle
    if (d > len * (0.955 + 0.03 * mN(vec2(x * 110.0, 2.0 + vW.z * 5.0)) + 0.015 * mN(vec2(x * 270.0, 7.0)))) discard;
    // the band: ochre, laid along the way it goes, a darker orange dragged through it, his pale yellow down the inside of the curve
    vec3 c = uOchre * (0.84 + 0.3 * n1);
    c = mix(c, uOrangeD, 0.8 * smoothstep(0.52, 0.78, mN(vec2(d * 3.3 + 7.0, x * 24.0))));
    if (vW.z < 0.5) c = mix(c, uYellow, smoothstep(-0.56, -0.74, xn + 0.16 * (n1 - 0.5)) * (0.75 + 0.25 * n1));
    // its black edges: heavy on the inside of the curve, lighter and broken on the outside
    float m = w * (1.0 - edge), lw = xn < 0.0 ? 0.012 + 0.13 * w + 0.012 * n3 : 0.008 + 0.07 * w * step(0.3, n3) + 0.006 * n1;
    float inkK = 1.0 - smoothstep(lw, lw + 0.005, m);
    // the white arrowheads, each pointing the way it is going, each a size bigger than the one in front
    float qq = log(max(d, 1.0e-3) / S.z) / ${LNR.toFixed(5)} - U.y;
    for (int j = 0; j < 2; j++) {
      float k = floor(qq) + float(j); if (k < 0.0) continue;
      float dk = S.z * exp((k + U.y) * ${LNR.toFixed(5)}), wk = S.x + S.y * dk, id = k - U.z;
      float h1 = mH1(id), h2 = mH1(id + 17.3), grow = smoothstep(-0.1, 0.9, k + U.y) * (1.0 - smoothstep(0.84 * len, 0.95 * len, dk * 1.1));      // (the newest is still opening; the last closes before the band ends)
      float xc = (x - wk * 0.16 * (h1 - 0.5)) / (0.6 * wk * grow + 1.0e-4);
      float arm = xc < 0.0 ? 1.0 + 0.3 * (h2 - 0.5) : 1.0 - 0.3 * (h2 - 0.5), ax = abs(xc) / arm;
      float off = abs((d - dk) / dk - 0.075 * (2.0 * ax - 1.0)) * dk + 0.022 * dk * (mN(vec2(d, x) * (5.0 / dk) + id) - 0.5);
      float th = (0.036 + 0.012 * h1) * dk * grow, ow = 0.006 + 0.024 * dk;
      if (off < th + ow && ax < 1.0 + ow / (0.6 * wk)) inkK = 1.0;
      if (off < th && ax < 1.0) { inkK = 0.0; c = mix(uWhite, uPinkW, 0.85 * smoothstep(0.5, 0.8, mN(vec2(d * 28.0, x * 28.0) + id))) * (0.9 + 0.14 * n1); }
    }
    diffuseColor.rgb = mix(c, uInk * (0.8 + 0.4 * n1), inkK);
  }`);
    };
    wmat.customProgramCacheKey = () => 'hartley-wake';
    this.wake = L.add(new THREE.Mesh(wgeo, wmat)); this.wake.name = 'wake'; this.wake.renderOrder = 5;

    // ---------------------------------------------------------- under the discs: a soft shadow each, and the red one's warm
    // light on the floor (darkening and light in one draw call: the colour is added, the alpha takes away)
    const pb = new THREE.PlaneGeometry(1, 1); pb.rotateX(-Math.PI / 2);
    const sgeo = new THREE.InstancedBufferGeometry(); sgeo.index = pb.index; sgeo.setAttribute('position', pb.attributes.position); sgeo.instanceCount = 4;
    this.aP = dyn(4, 4); this.aG = dyn(4, 3); sgeo.setAttribute('aP', this.aP); sgeo.setAttribute('aG', this.aG);
    const smat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
    const US = { uFloorY: { value: L.y + 0.018 } };
    smat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, US);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aP; attribute vec3 aG; uniform float uFloorY; varying vec2 vS; varying vec4 vG;')
        .replace('#include <begin_vertex>', 'vec3 transformed = vec3(position.x * aP.z * 2.0 + aP.x, uFloorY, position.z * aP.z * 2.0 + aP.y);\n  vS = position.xz * 2.0; vG = vec4(aG, aP.w);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vS; varying vec4 vG;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n  { float f = 1.0 - smoothstep(0.0, 1.0, length(vS)); f *= f; diffuseColor = vec4(vG.rgb * f, vG.a * f); }');
    };
    smat.customProgramCacheKey = () => 'hartley-shade';
    this.shade = L.add(new THREE.Mesh(sgeo, smat)); this.shade.name = 'shade'; this.shade.renderOrder = 6;
    this.glowR = col('#e2401f', 0.2); this.glowO = col('#e58a1e', 0.2);

    // ---------------------------------------------------------- the two hands, round and round for as long as you look
    this.band = score(L).loop(T_MUSIC, 12 * BAR, [...part(RH, 0.03), ...part(LH, 0.034)]).done();
    this.TR1 = TR2 - Math.sqrt(2 * (this.railH - 2 * RR - 0.02) / G);        // (the red disc is let go so as to land on the beat)
    this.hide();
  },

  // half the width of wake k's band, d metres behind its head (the ribbon is cut a little wider than the paint)
  half(k, d) { return (WAKE[k][0] + WAKE[k][1] * d) * 1.12 + 0.012; },
  P(L, u, h, out, into) { return L.at(u, h - this.cH, out, into); },

  hide() {
    this.aSize.array.fill(0); this.aSize.needsUpdate = true; this.aP.array.fill(0); this.aP.needsUpdate = true;
    this.uWake[0].set(0, 0, 0, 0); this.uWake[1].set(0, 0, 0, 0);
  },
  start(L, resumed) {
    if (resumed) { this.shift = Math.max(0, this.T - L.t); this.mShift = T_MUSIC - 0.2 - L.t; }
    else {
      this.shift = 0; this.mShift = 0; this.T = 0; this.lastT = 0; this.tau = 0; this.S = 0;
      Object.assign(this.red, { du: 0, dout: 0, vu: 0, vout: 0, roll: 0, seen: false }); Object.assign(this.ora, { roll: 0, seen: false });
      Object.assign(this.toy, { n: 0, S: 0, still: 9, cyc: 0 });
    }
    this.band.from(L.t + this.mShift);
    this.sfxT = L.t + this.shift; this.sfxS = this.S; if (!resumed) this.skimT = -99;
  },
  back(L) {
    this.bT = this.T;
    this.orange(L, this.bT, this.po); this.bo.u = this.po.u; this.bo.out = this.po.out; this.bo.h = this.po.h; this.bo.s = this.po.s;
    this.redAt(L, this.bT, this.pr); this.br.u = this.pr.u + this.red.du; this.br.out = this.pr.out + this.red.dout; this.br.h = this.pr.h; this.br.s = this.pr.s;
    if (!L.quiet) ['F5', 'C5', 'A4', 'F4'].forEach((n, i) => L.voice().note(hz(n), 0.5, { at: 0.1 + i * QUAVER, vol: 0.022, type: 'triangle', attack: 0.004 }));
  },
  end(L) { this.hide(); },
  reset(L) { this.hide(); this.T = 0; },

  // ---------------------------------------------------------------- the red disc at show-time T: out from under the rail,
  // a heavy fall, one low bounce, and it rolls out to its place
  redAt(L, T, o) {
    const TR1 = this.TR1, k = 1 - Math.pow(1 - ramp(T, TR1, TR4), 2);
    o.u = RED0[0] + (RED[0] - RED0[0]) * k; o.out = RED0[1] + (RED[1] - RED0[1]) * k;
    o.s = T < TR0 ? 0 : ease.out(ramp(T, TR0, TR1));
    const h0 = this.railH - RR * o.s - 0.02;
    if (T < TR1) o.h = h0;
    else if (T < TR2) { const s = (T - TR1) / (TR2 - TR1); o.h = h0 - (h0 - RR) * s * s; }
    else if (T < TR3) { const s = (T - TR2) / (TR3 - TR2); o.h = RR + 4 * BOUNCE(TR3 - TR2) * s * (1 - s); }
    else o.h = RR;
    o.sq = 0.2 * hump(T, TR2 - 0.02, TR2 + 0.15) + 0.09 * hump(T, TR3 - 0.02, TR3 + 0.13);
    return o;
  },
  // ---------------------------------------------------------------- the orange disc: out from under the rail, down onto the
  // top of its path, and then round the red one for good
  orange(L, T, o) {
    const top = this.ring.top;
    o.s = T < TO0 ? 0 : ease.out(ramp(T, TO0, TO1)); o.sq = 0;
    if (T < T_LAUNCH) {
      const k = ease.outBack(ramp(T, TO1, T_LAUNCH)), h0 = this.railH - RO * o.s - 0.02;
      o.u = top.u; o.out = 0.06 + (top.out - 0.06) * k; o.h = h0 + (top.h - h0) * k;
    } else {
      const a = this.ring.arc(this.S, this.a);
      o.u = a.u; o.out = a.out; o.h = a.h;
      const ds = (this.S - this.ring.bottom) / this.ring.P, x = (ds - Math.round(ds)) * this.ring.P; o.sq = 0.1 * Math.exp(-x * x / 0.03);      // (it flattens a little as it skims the floor)
    }
    return o;
  },

  // ---------------------------------------------------------------- each frame
  update(L, dt) {
    const ph = L.phase, back = ph === 'return', linger = ph === 'linger', showing = !back && !linger, calm = L.calm, ring = this.ring;
    let T;
    if (back) T = this.bT;
    else if (linger) T = this.T = this.T + dt;
    else T = this.T = L.t + this.shift;
    // the orbit's own clock: it eases into its going, and goes at half speed when motion is reduced
    if (!back) {
      const dT = Math.max(0, T - this.lastT), x = T - T_LAUNCH; this.lastT = T;
      if (x > 0) { this.tau += Math.min(dT, x) * Math.min(1, 0.35 + 2.2 * x) * (calm ? 0.5 : 1); this.S = ring.s(this.tau); }
    }
    // ---- sound: the tune a little ahead of the clock; the red disc's landings, and the orange one's skim, as they happen
    if (showing) {
      this.band.play(L.t + this.mShift);
      if (!L.quiet) {
        if (this.sfxT < TR2 && T >= TR2) this.knock(L, 'thud', 1, calm);
        if (this.sfxT < TR3 && T >= TR3) this.knock(L, 'thud', 0.4, calm);
        if (!this.told && T > T_LAUNCH + 0.4) { this.told = true; L.k.say('The orange disc goes round the red one, trailing its white arrows, to a Bach invention. Hartley wanted his painting to be more like music.', 5.5); }
      }
      this.sfxT = T;
    }
    if (!back) { const lap = s => Math.floor((s - ring.bottom) / ring.P); if (lap(this.S) > lap(this.sfxS)) { this.skimT = T; if (!L.quiet) this.knock(L, 'tok', 0.45, calm); } this.sfxS = this.S; }
    const cam = L.k.G.camera, ce = cam.matrixWorld.elements, rx = ce[0], rz = ce[2];      // (the camera's right, for a disc's rolling)
    const toy = L.k.G.vehicle, tl = linger && toy && toy.group.visible && Math.abs(toy.pos.y - L.y) < 0.15 ? L.local(toy.pos.x, toy.pos.z) : null;      // (on this floor, not up on the stunt kit or in the air)
    const SP = this.aP.array, SG = this.aG.array;

    // ---- the orange disc
    const o = this.orange(L, T, this.po); let near = 0, gone = 0;
    if (back) {
      const e = ease.inOut(ramp(L.ret, 0.2, 0.8)); o.s = this.bo.s * (1 - ease.in(ramp(L.ret, 0.56, 0.82))); o.sq = 0;      // (once its band is in)
      o.u = this.bo.u + (0.3 - this.bo.u) * e; o.out = this.bo.out + (0.07 - this.bo.out) * e; o.h = this.bo.h + (this.railH - 0.02 - RO * o.s - this.bo.h) * e;
      gone = ease.inOut(ramp(L.ret, 0, 0.26));
    } else if (tl && T > T_LAUNCH) o.h += 0.36 * (1 - ease.smooth(ramp(Math.hypot(tl.u - o.u, tl.out - o.out), 0.26, 0.66))) * (1 - ramp(o.h, 0.4, 0.7));        // it hops over the toy
    this.put(L, 1, o, RO, this.ora, rx, rz, 0);
    // ---- the red disc: it turns slowly where it sits, and brightens a little as the small one goes by in front
    const r = this.redAt(L, T, this.pr), R = this.red;
    if (!back && T > T_LAUNCH) near = 1 - ease.smooth(ramp(Math.hypot(o.u - RED[0], o.out - RED[1], o.h - RR), 0.5, 1.15));
    if (back) {
      const e1 = ease.inOut(ramp(L.ret, 0.08, 0.62)), e2 = ease.inOut(ramp(L.ret, 0.62, 1));
      r.u = this.br.u + (0.0 - this.br.u) * e1; r.out = this.br.out + (0.42 - this.br.out) * e1 - 0.33 * e2; r.s = this.br.s * (1 - ease.in(ramp(L.ret, 0.76, 1)));
      r.h = this.br.h + (RR - this.br.h) * e1 + (this.railH - RR * r.s - 0.02 - RR) * e2; r.sq = 0;
    } else {
      // pushed aside by the toy, softly, and it comes back
      if (tl) { const du = r.u + R.du - tl.u, dout = r.out + R.dout - tl.out, d = Math.hypot(du, dout); if (d < RR + 0.22 && d > 1e-4) { R.vu += du / d * 9 * dt; R.vout += dout / d * 9 * dt; } }
      if (linger || R.du || R.dout) {
        R.vu += (-6 * R.du - 2.6 * R.vu) * dt; R.vout += (-6 * R.dout - 2.6 * R.vout) * dt; R.du += R.vu * dt; R.dout += R.vout * dt;
        if (!linger && Math.abs(R.du) + Math.abs(R.dout) < 3e-4) R.du = R.dout = R.vu = R.vout = 0;
        r.u += R.du; r.out = Math.max(0.4, r.out + R.dout);
      }
    }
    const x = T - this.skimT, rock = (calm ? 0.07 : 0.15) * Math.exp(-x * 2.2) * Math.sin(x * 8) * (1 - L.ret);        // (it rocks as the small one skims by)
    this.put(L, 0, r, RR, R, rx, rz, near, T > TR4 && !back ? 0.1 * dt * (calm ? 0.5 : 1) : 0, rock);
    this.aPos.needsUpdate = true; this.aSize.needsUpdate = true;

    // ---- under them: shadows that gather as they come down, and the red one's light
    const sh = (i, p, rad, k) => { L.floor(p.u, p.out, this.v); SP[i * 4] = this.v.x; SP[i * 4 + 1] = this.v.z; SP[i * 4 + 2] = rad; SP[i * 4 + 3] = k; };
    const down = (p, rad) => p.s * clamp01(1 - (p.h - rad) / 0.7);
    sh(0, r, RR * 1.35, 0.5 * down(r, RR)); sh(1, o, RO * 1.5, 0.44 * down(o, RO));
    sh(2, r, 0.95, 0); sh(3, o, 0.45, 0);
    const gR = down(r, RR) * (0.2 + 0.16 * near), gO = down(o, RO) * 0.12;
    SG.fill(0, 0, 6); SG[6] = this.glowR.r * gR; SG[7] = this.glowR.g * gR; SG[8] = this.glowR.b * gR; SG[9] = this.glowO.r * gO; SG[10] = this.glowO.g * gO; SG[11] = this.glowO.b * gO;
    this.aP.needsUpdate = true; this.aG.needsUpdate = true;

    // ---- the orange disc's wake, laid along the way it has come, in the plane of its path
    const WP = this.wake.geometry.attributes.position.array, W0 = WAKE[0], N = ring.nrm;
    if (T > T_LAUNCH) {
      const S = this.S;
      for (let i = 0; i <= NSEG; i++) {
        const d = W0[4] * i / NSEG, a = ring.arc(S - d, this.a), hw = this.half(0, d);
        // across it: square to the way it goes, in the path's own plane, outwards (away from the middle of the ellipse)
        let nu = N[1] * a.dout - N[2] * a.dh, nh = N[2] * a.du - N[0] * a.dout, nout = N[0] * a.dh - N[1] * a.du;
        if (nu * (a.u - RING.cu) + nout * (a.out - RING.cout) < 0) { nu = -nu; nh = -nh; nout = -nout; }
        const j = i * 6;
        this.P(L, a.u - nu * hw, a.h - nh * hw, a.out - nout * hw, this.v); WP[j] = this.v.x; WP[j + 1] = this.v.y; WP[j + 2] = this.v.z;
        this.P(L, a.u + nu * hw, a.h + nh * hw, a.out + nout * hw, this.v); WP[j + 3] = this.v.x; WP[j + 4] = this.v.y; WP[j + 5] = this.v.z;
      }
      this.uWake[0].set(Math.min(W0[4], S) * (1 - gone), S / W0[5] - Math.floor(S / W0[5]), Math.floor(S / W0[5]), 0);
    } else this.uWake[0].x = 0;

    // ---- and the toy's: where it has driven, while it is out here with them
    this.track(L, tl, dt, WP, L.y + 0.015, back);
    this.wake.geometry.attributes.position.needsUpdate = true;
    L.voice().place();
  },

  // a disc's card: where it is, how it has rolled (as much as it has moved across your view), its squash on landing
  put(L, i, p, rad, st, rx, rz, lit, turn = 0, rock = 0) {
    const AP = this.aPos.array, AS = this.aSize.array, sq = p.sq || 0;
    this.P(L, p.u, p.h - rad * sq * p.s, p.out, this.v);
    if (st.seen && p.s > 0) st.roll -= ((this.v.x - st.x) * rx + (this.v.z - st.z) * rz) / rad;
    st.roll -= turn; st.x = this.v.x; st.z = this.v.z; st.seen = p.s > 0;
    const size = 2 * rad / EDGE * p.s;
    AP[i * 4] = this.v.x; AP[i * 4 + 1] = this.v.y; AP[i * 4 + 2] = this.v.z; AP[i * 4 + 3] = st.roll + rock;
    AS[i * 4] = size * (1 + 0.55 * sq); AS[i * 4 + 1] = size * (1 - sq); AS[i * 4 + 2] = lit; AS[i * 4 + 3] = 0;
  },
  // the toy's track (a ring of the points it has been through), and its wake painted on the floor along it
  track(L, tl, dt, WP, y, back) {
    const t = this.toy, U = this.uWake[1], W = WAKE[1], inside = tl && Math.abs(tl.u) < 2.6 && tl.out > 0.3 && tl.out < 3.6;
    if (!inside) t.still += dt * 3;
    else {
      const last = (t.head + HP - 1) % HP, moved = t.n ? Math.hypot(tl.u - t.x[last], tl.out - t.z[last]) : 1;
      if (moved > 0.04) {
        if (t.n && moved > 0.5) { t.n = 0; t.S = 0; }                               // (it was lifted and put down somewhere else)
        t.x[t.head] = tl.u; t.z[t.head] = tl.out; t.head = (t.head + 1) % HP; if (t.n) t.S += moved; t.n = Math.min(HP, t.n + 1); t.still = 0;
        const cyc = Math.floor(t.S / W[5]);
        if (cyc !== t.cyc) { t.cyc = cyc; if (!L.quiet) { noise(L.voice(), 0, { d: 0.07, vol: 0.007, bp: 1500, q: 1.2, attack: 0.012 }); if (!this.told2) { this.told2 = true; L.k.say('Now the white arrows trail you.', 3.5); } } }
      } else t.still += dt;
    }
    const fade = Math.max(clamp01((t.still - 1.4) / 1.2), back ? ramp(L.ret, 0, 0.3) : 0);
    if (fade >= 1) { t.n = 0; t.S = 0; }
    if (t.n < 3) { U.x = 0; return; }
    // walk back along the track, laying a cross-section every so far
    const base = (NSEG + 1) * 6; let k = (t.head + HP - 1) % HP, left = t.n - 1, d0 = 0, px = t.x[k], pz = t.z[k], seg = 1e-4, qx = px, qz = pz, tu = 0, tv = 1, total = 0;
    const next = () => { if (left <= 0) return false; k = (k + HP - 1) % HP; left--; qx = px; qz = pz; px = t.x[k]; pz = t.z[k]; seg = Math.hypot(qx - px, qz - pz) || 1e-4; tu = (qx - px) / seg; tv = (qz - pz) / seg; d0 = total; total += seg; return true; };
    next();
    for (let i = 0; i <= NSEG; i++) {
      const d = W[4] * i / NSEG; while (d > total && next());
      const f = clamp01((d - d0) / seg), u = qx + (px - qx) * f, out = qz + (pz - qz) * f, hw = this.half(1, d), j = base + i * 6;
      L.floor(u - tv * hw, out + tu * hw, this.v); WP[j] = this.v.x; WP[j + 1] = y; WP[j + 2] = this.v.z;
      L.floor(u + tv * hw, out - tu * hw, this.v); WP[j + 3] = this.v.x; WP[j + 4] = y; WP[j + 5] = this.v.z;
    }
    U.set(Math.min(W[4], total) * (1 - fade), t.S / W[5] - Math.floor(t.S / W[5]), Math.floor(t.S / W[5]), 0);
  },

  // a landing: the red disc's is a soft heavy thud, the orange one's skim a knock (softer still, and slower to speak,
  // when motion and flashing are reduced)
  knock(L, kind, k, calm) {
    const v = L.voice(); if (!v.ctx) return;
    if (calm) k *= 0.5;
    if (kind === 'thud') { v.note(74, 0.5, { vol: 0.085 * k, type: 'sine', to: 42, attack: calm ? 0.05 : 0.008 }); noise(v, 0, { d: 0.32, vol: 0.03 * k, lp: 230, attack: calm ? 0.05 : 0.006 }); }
    else { v.note(208, 0.24, { vol: 0.05 * k, type: 'sine', to: 132, attack: calm ? 0.03 : 0.005 }); noise(v, 0, { d: 0.1, vol: 0.011 * k, lp: 900, attack: calm ? 0.03 : 0.004 }); }
  },
});
