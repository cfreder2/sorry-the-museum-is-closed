// Vasily Kandinsky, Improvisation No. 30 (Cannons) (1913), Gallery 392. The word: boom.
//
// Kandinsky heard colours: yellow was a trumpet, light blue a flute, dark blue a cello, green a violin, warm red a
// brass fanfare, orange a church bell; white a silence full of possibility, black a silence with nothing after it. In
// 1928 he staged Musorgsky's Pictures at an Exhibition (1874) with nothing but coloured shapes and lines moving on a
// stage. So here his picture is played. Black lines dart out from the frame's edges and hook in the air (pizzicato);
// three of his leaning towers spring up from under the bottom rail on the right, flat and outlined in black, one red
// with black windows; and the two little cannons of the lower right drop out from under the rail, drawn as he drew
// them (brown washes, a thick-and-thin black contour, black crescent wheels), roll out and lift their barrels.
// BOOM: the first fires, a grey puff with a jagged rim (his, from the bottom of the canvas) blooms at its mouth, and out
// of the puff, one by one, come the notes of the Promenade, each a flat shape in his colours (a blue field with its pale
// rim, a red arc, an orange block, a green leaf, a pale-blue fan, a yellow sun) sounding in its own colour's instrument
// as it is born and flying on a twisted brown-red cord, like the ones that cross his canvas, to its place. It is laid
// out like a score: the first bar, which rises, climbs the wall left of the frame; the second, which falls, lands in a
// row under the work. Higher notes hang higher. Then a timpani roll, both cannons together, the whole score rings once
// in order, and the open B-flat triad in it (the red arc, the blue fan, the yellow sun) holds while the rest dims. After
// that it improvises (the title's word): now and then one shape sounds and bobs. When you stop looking it stays while
// the toy is near: drive into the row and each shape plays its note; bump a cannon and it fires. Then everything goes
// back under the bottom rail.
//
// Everything is drawn from what is in this canvas; nothing in it is a firework. The tune is Musorgsky's (1874).
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, canvasTexture } from '../paintlife.js';
import { hump, noise } from './stagecraft.js';
import { hz } from './tunes.js';

const TAU = Math.PI * 2, decay = (T, t0, k) => (T >= t0 ? Math.exp(-(T - t0) * k) : 0);
const BEAT = 0.44;                                   // the Promenade, a little brisk (crotchet = 136)
const T1 = 1.9, T2 = T1 + 5 * BEAT;                  // the two bars: the first cannon, the second
const TROLL = 6.85, TB = 7.3, TS = 7.42, SWEEP = 0.06, TC = 8.35, TI = 9.6, IDLE = 0.64;
const FLY = 0.85;                                    // a note's flight from the puff to its place
// Musorgsky, Pictures at an Exhibition (1874), Promenade: the first two bars (5/4, 6/4). [note, beat, beats]
const MEL = [['G4', 0, 1], ['F4', 1, 1], ['Bb4', 2, 1], ['C5', 3, 0.5], ['F5', 3.5, 0.5], ['D5', 4, 1],
  ['C5', 5, 0.5], ['F5', 5.5, 0.5], ['D5', 6, 1], ['Bb4', 7, 1], ['C5', 8, 1], ['G4', 9, 1], ['F4', 10, 2]];
// Each pitch has one colour, and that colour its instrument, as he heard them: [shape kind, fill, rim, instrument,
// size (m), octave shift for the instrument]
const VOICES = {
  F4: [0, '#2b46a6', '#ecc9c0', 'cello', 0.26, -1],      // dark blue: a cello (his blue field, pale-rimmed)
  G4: [5, '#2c7656', '#cfe2a4', 'violin', 0.21, 0],       // green: a violin
  Bb4: [2, '#c8332a', '#f4ede0', 'horn', 0.23, 0],        // warm red: brass
  C5: [3, '#de7a2a', '#7a4426', 'bell', 0.17, 0],         // orange: a bell
  D5: [4, '#80c2de', '#f1f7f2', 'flute', 0.19, 0],        // light blue: a flute
  F5: [1, '#f2c936', '#fbf0c2', 'trumpet', 0.16, 0],      // yellow: a trumpet
};
const ASPECT = [[1.3, 1], [1, 1], [1.25, 0.8], [0.72, 1.05], [1, 1], [0.58, 1.12], [1, 1]];
// The first bar's places on the wall left of the frame [along, up, size]: worked out from the look camera so that no
// two touch, and none is over this frame or the Poplars beside it; the triad (B-flat, D, F) rises through them.
const CLIMB = { F4: [-2.38, 0.48, 1.25], G4: [-1.73, 0.61, 1.25], Bb4: [-1.17, 0.87, 1.25], C5: [-1.19, 1.43, 1.25], D5: [-0.86, 1.74, 1.16], F5: [-1.49, 2.23, 1.25] };
const ROW = { u0: -0.74, gap: 0.028, out: 0.3, k: 1.15 };                 // the second bar: a row under the work
const CHORD = { Bb4: 1, D5: 1, F5: 1 };
const NN = MEL.length, NPUFF = 2, NTOW = 3, NCAN = 2, NS = NN + NPUFF + NTOW + NCAN * 3;
const K_PUFF = 6, K_TOWER = 7, K_BARREL = 8, K_WHEEL = 9;
const NPT = 22, NHOOK = 4, MAXL = NHOOK + NCAN + NN;
const R_WHEEL = 0.13;
// the cannons: where they drop from (under the rail), where they stand (on the floor out in front), when, when they fire
const CAN = [
  { us: 0.38, u: 1.05, out: 0.95, tR: 0.35, fires: [T1, TB] },
  { us: 0.5, u: 1.55, out: 0.93, tR: 0.6, fires: [T2, TB] },
];
const HOOKS = [   // the black lines: which side of the frame, height they leave it at, heading, length, bend, curl, when
  { side: -1, h: 1.3, th: Math.PI + 0.12, len: 0.3, k1: 0.6, k2: 3.4, td: 0.12 },
  { side: -1, h: 2.27, th: Math.PI - 0.1, len: 0.32, k1: -0.5, k2: -3.2, td: 0.34 },
  { side: 1, h: 2.18, th: 0.12, len: 0.46, k1: 0.4, k2: 3.0, td: 0.56 },
  { side: 1, h: 2.33, th: 0.3, len: 0.36, k1: -0.3, k2: -2.8, td: 0.78 },
];
const TOWERS = [  // standing on the line of the bottom rail: along, half width, height, lean, when, colours
  { u: 0.86, w: 0.085, H: 0.95, tilt: 0.07, t0: 0.3, fill: '#b9d6de', rim: '#e9eee6' },
  { u: 1.08, w: 0.1, H: 1.15, tilt: -0.04, t0: 0.55, fill: '#d2402e', rim: '#5a2418', red: true },
  { u: 1.3, w: 0.075, H: 0.8, tilt: -0.08, t0: 0.8, fill: '#efe8d6', rim: '#d9c9a0' },
];
const BASE = 0.9;

const GLSL_NOISE = /* glsl */`
float kH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float kN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(kH(i), kH(i + vec2(1.0, 0.0)), f.x), mix(kH(i + vec2(0.0, 1.0)), kH(i + vec2(1.0, 1.0)), f.x), f.y); }
`;

lifeFor(8991, {
  title: /^Improvisation No. 30/,
  word: 'boom',
  stage: { out: 1.3, half: 2.2, cam: { dist: 3.0, side: 0, height: 1.25, fov: 62, lookU: 0, lookOut: 0.4, lookH: 1.05, floorOut: 1.05 } },
  wake: 2, ret: 2.0,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.22) => P.near(h, a);
    this.cH = L.cy - L.y;
    const at = (u, h, out, into) => L.at(u, h - this.cH, out, into);
    this.P = at;
    this.v = new THREE.Vector3(); this.w = new THREE.Vector3(); this.x = new THREE.Vector3(); this.y3 = new THREE.Vector3();
    this.cv = new THREE.Vector3(); this.side = new THREE.Vector3(); this.tan = new THREE.Vector3();
    this.po = { u: 0, out: 0, h: 0, s: 0, elev: 0, spin: 0, rec: 0 };

    // ---------------------------------------------------------- the notes: where each hangs, its colour, its instrument
    const rnd = L.rand;
    let ru = ROW.u0;
    this.N = MEL.map(([n, b], i) => {
      const V = VOICES[n], kind = V[0], tb = T1 + b * BEAT, up = b < 5, st = Math.log2(hz(n) / hz('F4')) * 12;
      // the row's wide shapes stand on end, so that seven fit under the work
      const upright = !up && n === 'F4', r = V[4] * (up ? CLIMB[n][2] : ROW.k), A = ASPECT[kind];
      let u, h, out;
      if (up) { u = CLIMB[n][0]; h = CLIMB[n][1]; out = 0.2; }
      else { const hw = r * (upright ? A[1] : A[0]); u = ru + hw; ru += 2 * hw + ROW.gap; h = 0.5 + st * 0.022; out = ROW.out; }
      return { n, i, kind, f: hz(n), inst: V[3], oct: V[5], tb, c: up ? 0 : 1, up, r, u, h, out, chord: up && !!CHORD[n],
        roll: (upright ? Math.PI / 2 : 0) + (rnd() - 0.5) * 0.3, spin: (rnd() - 0.5) * 5, ph: rnd() * TAU, seed: 1 + rnd() * 40, fill: col(V[1]), rim: col(V[2], 0.12),
        M: new THREE.Vector3(), S: new THREE.Vector3(), B: new THREE.Vector3(), P1: new THREE.Vector3(), P2: new THREE.Vector3(), bs: 1, du: 0, dh: 0, dout: 0, vu: 0, vh: 0, vout: 0, hit: -9 };
    });

    // ---------------------------------------------------------- every shape, one draw call: the notes and puffs face you;
    // the towers and the cannons are his drawing, flat, standing in the plane of the wall
    const base = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.instanceCount = NS;
    const dyn = (n, k) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(n * k), k); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.aPos = dyn(NS, 4); this.aSize = dyn(NS, 4);
    const aKind = new THREE.InstancedBufferAttribute(new Float32Array(NS * 2), 2), aCol = new THREE.InstancedBufferAttribute(new Float32Array(NS * 3), 3), aRim = new THREE.InstancedBufferAttribute(new Float32Array(NS * 3), 3);
    const setC = (A, i, c) => A.setXYZ(i, c.r * 0.94, c.g * 0.94, c.b * 0.94);
    this.N.forEach((s, i) => { aKind.setXY(i, s.kind, s.seed); setC(aCol, i, s.fill); setC(aRim, i, s.rim); });
    for (let p = 0; p < NPUFF; p++) { aKind.setXY(NN + p, K_PUFF, 3 + p * 7.7); setC(aCol, NN + p, col('#8f918c', 0.2)); setC(aRim, NN + p, col('#f2efe6', 0.1)); }
    TOWERS.forEach((tw, k) => { const j = NN + NPUFF + k; aKind.setXY(j, K_TOWER, tw.red ? 101 + k : 11 + k * 5); setC(aCol, j, col(tw.fill, 0.15)); setC(aRim, j, col(tw.rim, 0.1)); });
    this.C0 = NN + NPUFF + NTOW;          // the cannons' cards: barrel, wheel, back wheel
    for (let c = 0; c < NCAN; c++) {
      const j = this.C0 + c * 3;
      aKind.setXY(j, K_BARREL, 2 + c * 3.1); setC(aCol, j, col('#7a4a26', 0.2)); setC(aRim, j, col('#c9963e', 0.2));
      for (let w = 1; w < 3; w++) { aKind.setXY(j + w, K_WHEEL, 0.6 + c * 1.9 + w * 2.3); setC(aCol, j + w, col('#151313', 0.05)); setC(aRim, j + w, col('#151313', 0.05)); }
    }
    for (const [k, a] of [['aPos', this.aPos], ['aSize', this.aSize], ['aKind', aKind], ['aCol', aCol], ['aRim', aRim]]) geo.setAttribute(k, a);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false });
    const v3 = c => new THREE.Vector3(c.r, c.g, c.b);
    const U = { uRope: { value: v3(col('#7a3420', 0.15)) }, uDark: { value: v3(col('#1c1a1a', 0.1)) }, uOrange: { value: v3(col('#d9772e', 0.2)) }, uPink: { value: v3(col('#e6a7a0', 0.2)) }, uTan: { value: new THREE.Vector3(L.tx, 0, L.tz) } };
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec4 aPos, aSize; attribute vec2 aKind; attribute vec3 aCol, aRim; uniform vec3 uTan;
varying vec2 vQ, vK; varying vec3 vCol, vRim; varying vec2 vRing; varying float vAsp;`)
        .replace('#include <project_vertex>', `vec4 mvPosition;
  { float c = cos(aPos.w), s = sin(aPos.w); vec2 p = position.xy * aSize.xy * (1.0 + 0.14 * max(aSize.z, 0.0));
    p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    if (aKind.x > 6.5) mvPosition = modelViewMatrix * vec4(aPos.xyz + uTan * p.x + vec3(0.0, p.y, 0.0), 1.0);      // flat on the wall's plane
    else { mvPosition = modelViewMatrix * vec4(aPos.xyz, 1.0); mvPosition.xy += p; } }                            // facing you
  gl_Position = projectionMatrix * mvPosition;
  vQ = position.xy * 2.0; vK = aKind; vCol = aCol; vRim = aRim; vRing = aSize.zw; vAsp = aSize.x / max(aSize.y, 1.0e-4);`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec2 vQ, vK; varying vec3 vCol, vRim; varying vec2 vRing; varying float vAsp; uniform vec3 uRope, uDark, uOrange, uPink;
${GLSL_NOISE}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  {
    vec2 q = vQ; int T = int(vK.x + 0.5); float sd = vK.y;
    vec2 p = vec2(q.x * vAsp, q.y);                    // (for the flat drawings: units of half their height, both ways)
    float r = length(q), a = atan(q.y, q.x), d = 1.0, rimW = 0.16, rough = 1.0, ink = 0.0;
    vec3 fill = vCol, rim = vRim; bool cord = false, sun = false, drawn = false;
    if (T == 0) { d = r - (0.72 + 0.11 * sin(a * 2.0 + sd * 6.0) + 0.07 * sin(a * 3.0 - sd * 4.0) + 0.04 * sin(a * 5.0 + sd)); rimW = 0.2; cord = true; }
    else if (T == 1) { d = r - (0.9 + 0.035 * sin(a * 9.0 + sd)); sun = true; }
    else if (T == 2) { vec2 c = q - vec2(0.0, -0.95); float rr = length(c), aa = atan(c.x, c.y);
      float w = 0.27 * (1.0 - pow(clamp(abs(aa) / 1.0, 0.0, 1.0), 2.0)) + 0.02; d = max(abs(rr - 1.36) - w, abs(aa) - 1.02); rimW = 0.09; }
    else if (T == 3) { vec2 pp = vec2(q.x + 0.2 * q.y, q.y); d = max(abs(pp.x) - 0.58, abs(pp.y) - 0.86); rimW = 0.1; }
    else if (T == 4) { vec2 c = q - vec2(0.0, -0.92); float rr = length(c), aa = atan(c.x, c.y);
      d = max(max(abs(aa) - 0.56, rr - 1.78), 0.12 - rr); rimW = 0.0;
      fill = mix(fill, rim, 0.75 * step(0.35, sin(aa * 21.0 + sd + 2.0 * rr))); }
    else if (T == 5) { d = max(length(q - vec2(0.62, 0.0)) - 0.98, length(q + vec2(0.62, 0.0)) - 0.98); rimW = 0.14; cord = true; }
    else if (T == 6) { float sp = pow(0.5 + 0.5 * sin(a * 12.0 + 1.7 * sin(a * 5.0 + sd)), 3.0);
      d = r - (0.46 + 0.42 * sp + 0.06 * kN(vec2(a * 6.0, sd))); rimW = 0.34;
      if (length(q - vec2(0.12, 0.04)) < 0.17 + 0.1 * kN(q * 7.0 + sd)) fill = uDark; }
    else if (T == 7) {
      // a tower: a leaning shaft open at its foot, an onion dome, a spire; his black line round it, thick and thin
      drawn = true; rough = 0.25; float bw = vAsp * 0.62, tb = bw * (1.0 - 0.07 * (p.y + 1.0));
      float dB = max(abs(p.x) - tb, p.y - 0.6), rx = bw * 1.14, ry = 0.17;
      float dD = (length(vec2(p.x / rx, (p.y - 0.7) / ry)) - 1.0) * min(rx, ry);
      d = min(dB, dD);
      float lw = 0.028 + 0.022 * (0.5 + 0.5 * sin(p.y * 6.0 + sd));
      ink = 1.0 - step(lw, -d);
      if (abs(p.x + 0.012 * sin(p.y * 30.0)) < 0.02 && p.y > 0.84 && p.y < 0.99) { d = -1.0; ink = 1.0; }
      if (p.y < -0.9 + 0.12 * kN(vec2(p.x * 30.0, sd))) d = 1.0;                               // (its foot, loose)
      if (sd > 100.0 && abs(abs(p.x) - tb * 0.44) < tb * 0.17 && p.y > -0.4 && p.y < 0.32) ink = 1.0;      // the red one's windows
    }
    else if (T == 8) {
      // a cannon's barrel and breech: brown washes, an ochre top, an orange belly, a pink band, his contour
      drawn = true; rough = 0.5; float l0 = -vAsp * 0.92, l1 = vAsp * 0.7;
      float hh = 0.48 + 0.2 * clamp((p.x - l0) / (l1 - l0), 0.0, 1.0);
      d = min(max(abs(p.y) - hh, max(l0 - p.x, p.x - l1)), length(p - vec2(l1 + 0.05, 0.0)) - 0.66);
      if (p.y > 0.14) fill = rim; if (p.y < -0.3) fill = uOrange; if (abs(p.x - 0.45) < 0.2) fill = mix(fill, uPink, 0.8);
      float lw = 0.1 + 0.11 * (0.5 + 0.5 * sin(p.x * 1.7 + sd));
      ink = 1.0 - step(lw, -d);
      if (p.x < l0 + 0.24) ink = 1.0;
      if (abs(p.y - (0.3 + 0.05 * p.x)) < 0.05 + 0.03 * sin(p.x * 2.0 + sd) && p.x > l0 + 0.5 && p.x < l1 - 0.3 && kN(vec2(p.x * 3.0, sd)) > 0.25) ink = 1.0;
    }
    else if (T == 9) {
      // a wheel: his black crescent, open, thick on one side and thin on the other, with two spokes
      drawn = true; rough = 0.45; fill = uDark;
      float tw = 0.05 + 0.13 * pow(0.5 + 0.5 * cos(a - sd), 2.0), dR = abs(r - 0.8) - tw;
      if (cos(a - sd - 2.7) > 0.86) dR = 1.0;
      vec2 n1 = vec2(cos(sd * 1.7), sin(sd * 1.7)), n2 = vec2(cos(sd * 1.7 + 1.8), sin(sd * 1.7 + 1.8));
      float sp = min(abs(dot(q, n1)), abs(dot(q, n2))) - 0.05 * (1.0 - 0.5 * r);
      if (r > 0.8) sp = 1.0;
      d = min(min(dR, sp), r - 0.13); ink = 1.0;
    }
    // a loaded brush's edge, and (going) a dissolve in patches
    d += rough * (0.06 * (kN(q * 13.0 + sd * 13.0) - 0.5) + 0.035 * (kN(vec2(a * 18.0, r * 4.0 + sd)) - 0.5));
    d += vRing.y * (0.15 + 1.4 * kN(q * 4.0 + sd * 2.0));
    if (d > 0.0) discard;
    float sa = sd * 2.3; vec2 sq = vec2(cos(sa) * q.x - sin(sa) * q.y, sin(sa) * q.x + cos(sa) * q.y);
    vec3 c = fill * (0.86 + 0.24 * kN(sq * vec2(2.5, 16.0) + sd));
    if (drawn) c = mix(c, uDark, ink);
    else if (sun) { float core = 0.56 + 0.05 * sin(a * 7.0 + sd); c = r < core ? c : rim * (0.9 + 0.14 * kN(q * 9.0)); }
    else if (rimW > 0.0) { float k = 1.0 - smoothstep(rimW * (0.55 + 0.4 * max(vRing.x, 0.0)), rimW * (1.0 + 0.6 * max(vRing.x, 0.0)), -d); c = mix(c, rim * (0.9 + 0.14 * kN(q * 17.0 + sd)), k); }
    if (cord && -d < 0.055) c = mix(uRope, vec3(0.93, 0.78, 0.72), step(0.5, fract(a * 9.0 + sd)) * 0.45);
    float lit = max(vRing.x, 0.0), dim = max(-vRing.x, 0.0);
    c *= 1.0 + 0.3 * lit; c = mix(c, vec3(1.0, 0.98, 0.92), 0.14 * lit);
    c = mix(c, c * 0.1 + vec3(0.012), dim);
    diffuseColor.rgb = c;
  }`);
    };
    mat.customProgramCacheKey = () => 'kandinsky-shapes';
    this.shapes = L.add(new THREE.Mesh(geo, mat)); this.shapes.name = 'shapes';

    // ---------------------------------------------------------- the lines: black hooks, the cannons' black strokes, the cords
    const bristle = canvasTexture(128, 32, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      for (let b = 0; b < 16; b++) {
        const y = 4 + (b / 15) * 24, th = 1.5 + rnd() * 2.5, x0 = rnd() * 10, x1 = w - rnd() * 10, edge = 1 - Math.pow(Math.abs(y - 16) / 13, 3);
        g.fillStyle = `rgba(255,255,255,${(0.55 + 0.45 * rnd()) * edge})`; g.fillRect(x0, y, x1 - x0, th);
      }
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(0, 11, w, 10);
    }, false);
    bristle.wrapS = THREE.RepeatWrapping;
    const nv = MAXL * NPT * 2, lpos = new Float32Array(nv * 3), lcol = new Float32Array(nv * 3), luv = new Float32Array(nv * 2), idx = [];
    for (let l = 0; l < MAXL; l++) for (let j = 0; j < NPT; j++) for (let s = 0; s < 2; s++) { const v = (l * NPT + j) * 2 + s; luv[v * 2] = (j / (NPT - 1)) * 3 + l * 0.37; luv[v * 2 + 1] = s; }
    for (let l = 0; l < MAXL; l++) for (let j = 0; j < NPT - 1; j++) { const a = (l * NPT + j) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const ink = col('#171516', 0.08), ink2 = col('#2a2420', 0.1), cordA = col('#8a3a24', 0.15), cordB = col('#e7b7a6', 0.15);
    for (let l = 0; l < MAXL; l++) for (let j = 0; j < NPT; j++) {
      const c = l >= NHOOK + NCAN ? (j % 2 ? cordA : cordB) : (j % 3 ? ink : ink2);
      for (let s = 0; s < 2; s++) lcol.set([c.r, c.g, c.b], ((l * NPT + j) * 2 + s) * 3);
    }
    const lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3).setUsage(THREE.DynamicDrawUsage));
    lgeo.setAttribute('color', new THREE.BufferAttribute(lcol, 3)); lgeo.setAttribute('uv', new THREE.BufferAttribute(luv, 2)); lgeo.setIndex(idx);
    this.lines = L.add(new THREE.Mesh(lgeo, new THREE.MeshBasicMaterial({ map: bristle, vertexColors: true, alphaTest: 0.4, side: THREE.DoubleSide, fog: false })));
    this.lines.name = 'lines';
    this.path = new Float32Array(NPT * 3);
    this.cans = CAN.map(() => ({ extra: -99, B: { u: 0, out: 0, elev: 0, spin: 0 } }));

    // where each note is fired from (the mouth of its cannon at the moment it is born), and its flight: out along the
    // barrel, low across the floor under the frame, and up (or down) to its place
    for (const s of this.N) {
      this.muzzle(L, s.c, s.tb, s.M); at(s.u, s.h, s.out, s.S);
      s.P1.copy(s.M).add(this.x.set(-0.55 * L.tx, 0.22, -0.55 * L.tz)).addScaledVector(this.y3.set(L.nx, 0, L.nz), -0.15);
      if (s.up) at(s.u + 0.15, 0.62, s.out + 0.35, s.P2); else at(s.u + 0.25, s.h + 0.35, s.out + 0.25, s.P2);
    }

    this.ev = this.schedule();
    this.hide();
  },

  // ---------------------------------------------------------------- the score, on the show's clock
  schedule() {
    const E = [], add = (t, fn) => E.push({ t, fn });
    // the hooks dart out (pizzicato), the towers arrive (low strings), the wheels creak
    HOOKS.forEach((h, i) => add(h.td + 0.05, (L, at) => this.play(L, 'pizz', hz(['Bb3', 'F3', 'D4', 'Bb2'][i]), at, 0.4, 0.03)));
    TOWERS.forEach((w, i) => add(w.t0 + 0.55, (L, at) => this.play(L, 'pizz', hz(['F2', 'Bb2', 'D3'][i]), at, 0.6, 0.035)));
    CAN.forEach(c => add(c.tR + 0.1, (L, at) => noise(L.voice(), at, { d: 0.9, vol: 0.012, lp: 500, attack: 0.1 })));
    // the two bars: a cannon on each downbeat, and every note in its colour's voice as its shape is born
    add(T1, (L, at) => this.boom(L, hz('Bb2'), at, 1));
    add(T2, (L, at) => this.boom(L, hz('F2'), at, 0.9));
    for (const s of this.N) add(s.tb, (L, at) => this.play(L, s.inst, s.f * Math.pow(2, s.oct), at, Math.max(0.3, (MEL[s.i][2] * BEAT) * 0.95), 1));
    // the roll, the boom of both, the row ringing left to right, the chord
    for (let i = 0; i < 9; i++) add(TROLL + i * 0.05, (L, at) => this.play(L, 'timp', hz('F2'), at, 0.25, 0.012 + i * 0.004));
    add(TB, (L, at) => { this.boom(L, hz('Bb1'), at, 1.3); this.boom(L, hz('F2'), at + 0.02, 0.8); });
    for (const s of this.N) add(TS + s.i * SWEEP, (L, at) => this.play(L, s.inst, s.f * Math.pow(2, s.oct), at, 0.45, 0.55));
    add(TC, (L, at) => { this.play(L, 'cello', hz('Bb2'), at, 2.6, 1.1); this.play(L, 'horn', hz('F4'), at + 0.04, 2.4, 0.7); this.play(L, 'horn', hz('Bb4'), at + 0.08, 2.3, 0.6); this.play(L, 'trumpet', hz('D5'), at + 0.12, 2.2, 0.55); this.play(L, 'timp', hz('Bb1'), at, 1.8, 0.03); });
    // then it improvises: one shape at a time, softly
    for (let k = 0; k < 120; k++) { const i = this.idleOf(k); add(TI + k * IDLE + this.idleJit(k), (L, at) => { const s = this.N[i]; if (L.phase !== 'linger') this.play(L, s.inst, s.f * Math.pow(2, s.oct), at, 0.7, 0.42); }); }
    return E.sort((a, b) => a.t - b.t);
  },
  idleOf(k) { const x = Math.sin(k * 12.9898 + 4.1) * 43758.5453; return Math.floor((x - Math.floor(x)) * NN); },
  idleJit(k) { const x = Math.sin(k * 78.233 + 1.3) * 43758.5453; return ((x - Math.floor(x)) - 0.5) * 0.22; },

  hide() {
    this.aSize.array.fill(0); this.aSize.needsUpdate = true;
    this.lines.geometry.attributes.position.array.fill(0); this.lines.geometry.attributes.position.needsUpdate = true;
  },
  start(L, resumed) {
    if (resumed) { this.shift = Math.max(0, (this.T || 0) - L.t); }
    else { this.shift = 0; this.T = 0; for (const s of this.N) { s.du = s.dh = s.dout = s.vu = s.vh = s.vout = 0; s.hit = -9; } for (const c of this.cans) c.extra = -99; }
    const T0 = L.t + this.shift; this.cur = 0; while (this.cur < this.ev.length && this.ev[this.cur].t < T0) this.cur++;
  },
  back(L) {
    this.bT = this.T;
    for (const s of this.N) { this.notePos(L, s, this.bT, s.B); s.bs = this.noteScale(s, this.bT); }
    this.cans.forEach((c, i) => { this.pose(L, i, this.bT, this.po); c.B.u = this.po.u; c.B.out = this.po.out; c.B.elev = this.po.elev; c.B.spin = this.po.spin; });
    if (!L.quiet) ['Bb4', 'F4', 'D4', 'Bb3'].forEach((n, i) => this.play(L, 'pizz', hz(n), i * 0.16, 0.5, 0.022));
  },
  end(L) { this.hide(); },
  reset(L) { this.hide(); this.T = 0; },

  // ---------------------------------------------------------------- a cannon at show-time T: it drops out from under
  // the bottom rail (growing as it falls, bouncing), rolls out to its place, lifts its barrel; crouches, kicks, recoils
  pose(L, c, T, o) {
    const C = CAN[c], kd = ramp(T, C.tR, C.tR + 0.45), k = ease.inOut(ramp(T, C.tR + 0.45, C.tR + 1.2)), du = C.u - C.us, dout = C.out - 0.03;
    o.s = T < C.tR ? 0 : ease.outBack(Math.min(1, kd * 1.6)); o.h = 0.72 * ease.bounce(kd);
    o.u = C.us + du * k; o.out = 0.03 + dout * k;
    o.elev = 0.34 * ease.outBack(ramp(T, C.tR + 1.0, C.tR + 1.35));
    o.rec = 0;
    for (let n = 0; n <= C.fires.length; n++) {
      const age = T - (n < C.fires.length ? C.fires[n] : this.cans ? this.cans[c].extra : -99);
      if (age > -0.3 && age < 0) { const cr = ease.in((age + 0.3) / 0.3); o.rec += 0.016 * cr; o.elev -= 0.06 * cr; }      // (it crouches, then kicks)
      else if (age >= 0 && age < 1.2) { o.rec += 0.08 * (age < 0.08 ? ease.out(age / 0.08) : 1 - ease.inOut((age - 0.08) / 1.1)); o.elev += 0.24 * Math.exp(-age * 5) * Math.sin(Math.min(1, age / 0.06) * Math.PI / 2); }
    }
    o.spin = -(Math.hypot(du, dout) * k + o.rec) / R_WHEEL;
    return o;
  },
  // a point of the cannon (dx along the wall, dy up, from the foot of its wheel; turned by `turn`, about (px, py)), as
  // the cannon stands in pose o, into a world point
  cpt(L, o, dx, dy, into, turn = 0, px = 0, py = 0) {
    const s = o.s, c = Math.cos(turn), sn = Math.sin(turn), x = px + (dx - px) * c - (dy - py) * sn, y = py + (dx - px) * sn + (dy - py) * c;
    return this.P(o.u + o.rec + x * s, o.h + y * s, o.out, into);
  },
  muzzle(L, c, T, into) { this.pose(L, c, T, this.po); return this.cpt(L, this.po, -0.36, 0.23, into, -this.po.elev, 0.08, 0.23); },

  // ---------------------------------------------------------------- a note at show-time T
  notePos(L, s, T, into) {
    this.bez(s, ease.out(clamp01((T - s.tb) / FLY)), into);
    const settle = ramp(T, s.tb + FLY, s.tb + FLY + 0.6);
    into.y += 0.014 * Math.sin(T * 1.4 + s.ph) * settle + 0.05 * hump(T, TS + s.i * SWEEP, TS + s.i * SWEEP + 0.34);
    if (T > TI) { into.y += 0.018 * Math.sin((T - TI) * 0.5 + s.ph) * ramp(T, TI, TI + 2); this.v.set(L.tx, 0, L.tz).multiplyScalar(0.02 * Math.sin((T - TI) * 0.37 + s.ph * 2) * ramp(T, TI, TI + 2)); into.add(this.v); }
    return into;
  },
  bez(s, q, into) { const a = 1 - q; return into.set(0, 0, 0).addScaledVector(s.M, a * a * a).addScaledVector(s.P1, 3 * a * a * q).addScaledVector(s.P2, 3 * a * q * q).addScaledVector(s.S, q * q * q); },
  towerK(L, k, T, back) { const tw = TOWERS[k]; return back ? 1 - ease.inOut(ramp(L.ret, 0.3, 0.9)) : ease.outBack(ramp(T, tw.t0, tw.t0 + 0.6)); },
  noteScale(s, T) { return T < s.tb ? 0 : 0.25 + 0.75 * ease.outBack(clamp01((T - s.tb) / 0.32)); },
  // how lit a shape is now (above 0), or dimmed (below): born, rung in the sweep, the triad held, the improvisation
  ring(s, T) {
    let r = Math.max(decay(T, s.tb, 3.2), decay(T, TS + s.i * SWEEP, 3.6), decay(T, s.hit, 3.2));
    if (T > TI) { const k0 = Math.floor((T - TI) / IDLE); for (let k = Math.max(0, k0 - 2); k <= k0 + 1; k++) if (this.idleOf(k) === s.i) r = Math.max(r, decay(T, TI + k * IDLE + this.idleJit(k), 2.6)); }
    const held = ramp(T, TC - 0.1, TC + 0.3) * (1 - ramp(T, TC + 2.6, TC + 3.6));
    if (s.chord) r = Math.max(r, 0.5 * held);
    else if (held > 0) r = r * (1 - held) - 0.85 * held;
    return r;
  },

  // ---------------------------------------------------------------- each frame
  update(L, dt) {
    const ph = L.phase, back = ph === 'return', linger = ph === 'linger';
    let T;
    if (back) T = this.bT;
    else if (linger) T = this.T = (this.T || 0) + dt;
    else T = this.T = L.t + this.shift;
    // ---- sound, a little ahead
    if (!back) {
      const ahead = T + 0.12;
      while (this.cur < this.ev.length && this.ev[this.cur].t < ahead) { const e = this.ev[this.cur++]; if (!L.quiet && L.voice().ctx) e.fn(L, Math.max(0, e.t - T)); }
    }
    const AP = this.aPos.array, AS = this.aSize.array, cam = L.k.G.camera.position;
    // ---- the toy (while it lingers): it plays the shapes, and bumps the cannons
    const toy = L.k.G.vehicle, tl = linger && toy && Math.abs(toy.pos.y - L.y) < 0.4 ? L.local(toy.pos.x, toy.pos.z) : null;
    // ---- the cannons: three flat cards each (barrel, wheel, back wheel) and a black stroke
    for (let c = 0; c < NCAN; c++) {
      const o = this.pose(L, c, T, this.po), cn = this.cans[c], j = this.C0 + c * 3;
      if (back) { const B = cn.B, C = CAN[c], e1 = ease.inOut(ramp(L.ret, 0.05, 0.65)), e2 = ramp(L.ret, 0.65, 1);
        o.u = B.u + (C.us - B.u) * e1; o.out = B.out + (0.03 - B.out) * e1; o.elev = B.elev * (1 - e1); o.rec = 0;
        o.spin = B.spin + Math.hypot(C.us - B.u, 0.03 - B.out) * e1 / R_WHEEL; o.s = 1 - ease.in(e2); o.h = 0.72 * ease.inOut(e2); }
      if (tl && T - cn.extra > 1.6 && Math.hypot(tl.u - o.u, tl.out - o.out) < 0.3) { cn.extra = T; if (!L.quiet) this.boom(L, hz(c ? 'F2' : 'Bb2'), 0, 0.9); }
      if (o.s <= 0.01) { for (let w = 0; w < 3; w++) AS[(j + w) * 4] = AS[(j + w) * 4 + 1] = 0; this.noLine(NHOOK + c); continue; }
      // barrel (turned about its breech), then the wheel in front of it and the one behind
      this.cpt(L, o, -0.1, 0.23, this.x, -o.elev, 0.08, 0.23); this.put(AP, AS, j, this.x, -o.elev, 0.5 * o.s, 0.21 * o.s, 0, 0);
      this.cpt(L, o, 0, R_WHEEL, this.x); this.x.addScaledVector(this.y3.set(L.nx, 0, L.nz), 0.014); this.put(AP, AS, j + 1, this.x, o.spin, 2 * R_WHEEL * o.s, 2 * R_WHEEL * o.s, 0, 0);
      this.cpt(L, o, 0.13, R_WHEEL * 0.85, this.x); this.x.addScaledVector(this.y3, -0.028); this.put(AP, AS, j + 2, this.x, o.spin * 1.15 + 1.1, 1.7 * R_WHEEL * o.s, 1.7 * R_WHEEL * o.s, 0, 0);
      // his black diagonal across it
      for (let k = 0; k < NPT; k++) { const s = k / (NPT - 1); this.cpt(L, o, 0.3 - 0.58 * s, 0.02 + 0.5 * s + 0.04 * Math.sin(s * 3), this.x); this.x.addScaledVector(this.y3.set(L.nx, 0, L.nz), 0.02); this.path[k * 3] = this.x.x; this.path[k * 3 + 1] = this.x.y; this.path[k * 3 + 2] = this.x.z; }
      this.emit(NHOOK + c, 0.022 * o.s, 1, cam);
    }
    // ---- the notes
    for (const s of this.N) {
      const i = s.i, p = this.w;
      let sc, ringK = this.ring(s, T);
      if (back) {
        const e = ease.inOut(ramp(L.ret, i * 0.025, 0.62 + i * 0.025)), tu = Math.max(-L.hw + 0.12, Math.min(L.hw - 0.12, s.u * 0.4));
        if (s.up) this.P(s.u + 0.1, 0.62, 0.35, this.x); else this.P(tu, 0.8, 0.3, this.x); this.P(tu, 0.86, -0.12, this.y3);
        const a = 1 - e; p.set(0, 0, 0).addScaledVector(s.B, a * a).addScaledVector(this.x, 2 * a * e).addScaledVector(this.y3, e * e);
        sc = s.bs * (1 - ramp(e, 0.55, 1)); ringK *= 1 - e;
      } else {
        this.notePos(L, s, T, p); sc = this.noteScale(s, T);
        // pushed about by the toy, springing back
        if (tl) {
          const l = L.local(p.x, p.z), du = l.u + s.du - tl.u, dout = l.out + s.dout - tl.out, d = Math.hypot(du, dout);
          if (d < s.r * 0.8 + 0.2 && p.y + s.dh - L.y - s.r < 0.5 && d > 1e-4) {
            if (T - s.hit > 0.45) { s.hit = T; if (!L.quiet) this.play(L, s.inst, s.f * Math.pow(2, s.oct), 0, 0.8, 0.8); }
            s.vu += du / d * 1.2 * dt * 8; s.vout += dout / d * 1.2 * dt * 8; s.vh += 0.6 * dt * 8;
          }
        }
        if (linger || s.du || s.dh || s.dout) {
          s.vu += (-7 * s.du - 2.4 * s.vu) * dt; s.vh += (-7 * s.dh - 2.4 * s.vh) * dt; s.vout += (-7 * s.dout - 2.4 * s.vout) * dt;
          s.du += s.vu * dt; s.dh += s.vh * dt; s.dout += s.vout * dt;
          if (!linger && Math.abs(s.du) + Math.abs(s.dh) + Math.abs(s.dout) < 3e-4 && Math.abs(s.vu) + Math.abs(s.vh) + Math.abs(s.vout) < 3e-3) s.du = s.dh = s.dout = s.vu = s.vh = s.vout = 0;
          s.dout = Math.max(-0.2, s.dout);
          p.x += L.tx * s.du + L.nx * s.dout; p.z += L.tz * s.du + L.nz * s.dout; p.y += s.dh;
        }
      }
      const q = clamp01((T - s.tb) / FLY), roll = s.roll + (1 - ease.out(q)) * s.spin + 0.08 * Math.sin(T * 0.6 + s.ph) + 0.25 * hump(T, TS + i * SWEEP, TS + i * SWEEP + 0.5);
      const A = ASPECT[s.kind], size = 2 * s.r * sc * (1 + 0.1 * Math.max(ringK, 0) + 0.22 * decay(T, TS + i * SWEEP, 5) * (T < TS + i * SWEEP + 1 ? 1 : 0) + (s.chord && !back ? 0.12 * ramp(T, TC - 0.1, TC + 0.5) * (1 - ramp(T, TC + 2.6, TC + 3.6)) : 0));
      this.put(AP, AS, i, p, roll, size * A[0], size * A[1], ringK, 0);
    }
    // ---- the puffs: grey, jagged, at the mouth; they swell and break up (small enough to leave the row clear)
    for (let c = 0; c < NPUFF; c++) {
      const j = NN + c; let F = -99;
      for (const f of CAN[c].fires) if (f <= T && f > F) F = f;
      if (this.cans[c].extra <= T && this.cans[c].extra > F) F = this.cans[c].extra;
      const age = T - F;
      if (back || age > 2.4 || age < 0) { AS[j * 4] = AS[j * 4 + 1] = 0; continue; }
      this.muzzle(L, c, F, this.x); this.x.addScaledVector(this.y3.set(L.tx, 0, L.tz), -0.08).addScaledVector(this.v.set(L.nx, 0, L.nz), 0.1 + 0.06 * ease.out(age / 2.4)); this.x.y -= 0.05;
      const sz = (0.26 + 0.04 * c) * (F === TB ? 1.1 : 1) * ease.outBack(clamp01(age / 0.22)) * (1 + 0.1 * age);
      this.put(AP, AS, j, this.x, 0.3 * c + 0.15 * age, sz, sz * 0.92, Math.exp(-age * 6), ease.in(ramp(age, 0.35, 2.4)) * 1.05);
    }
    // ---- the towers: flat, outlined, standing on the line of the bottom rail and leaning; they spring up out of it
    for (let k = 0; k < NTOW; k++) {
      const tw = TOWERS[k], e = this.towerK(L, k, T, back), j = NN + NPUFF + k;
      if (e <= 0.01) { AS[j * 4] = AS[j * 4 + 1] = 0; continue; }
      const H = tw.H * e, tilt = tw.tilt * Math.min(1, e) + 0.03 * hump(T, TB, TB + 0.7) * (k - 1) + 0.008 * Math.sin(T * 0.8 + k);
      this.P(tw.u - Math.sin(tilt) * H / 2, BASE + Math.cos(tilt) * H / 2, 0.06, this.x);
      this.put(AP, AS, j, this.x, tilt, 2 * tw.w / 0.62, H, 0.35 * hump(T, TB, TB + 0.6), 0);
    }
    this.aPos.needsUpdate = true; this.aSize.needsUpdate = true;

    // ---- the hooks: out from the frame's edges, darting, then hanging and curling
    for (let i = 0; i < NHOOK; i++) {
      const hk = HOOKS[i], g = back ? 1 - ease.inOut(ramp(L.ret, 0.15 + i * 0.05, 0.75 + i * 0.05)) : ease.out(ramp(T, hk.td, hk.td + 0.32));
      if (g <= 0.01) { this.noLine(i); continue; }
      const whip = Math.exp(-Math.max(0, T - hk.td - 0.25) * 4) * Math.sin((T - hk.td) * 18) * (T > hk.td ? 1 : 0), tight = 0.5 * hump(T, TB, TB + 0.9);
      let u = hk.side * (L.hw + L.fw * 0.65), h = hk.h; const ds = hk.len * g / (NPT - 1);
      for (let j = 0; j < NPT; j++) {
        const s = j / (NPT - 1);
        this.P(u, h, 0.035 + 0.05 * s * g, this.x); this.path[j * 3] = this.x.x; this.path[j * 3 + 1] = this.x.y; this.path[j * 3 + 2] = this.x.z;
        const th = hk.th + hk.k1 * s * g + hk.k2 * Math.pow(s * g, 4) * (1 + 0.35 * whip + tight) + 0.07 * Math.sin(T * 1.3 + i + s * 3);
        u += Math.cos(th) * ds; h += Math.sin(th) * ds;
      }
      this.emit(i, 0.036, 1, cam);
    }
    // ---- the cords: from the cannon's mouth along each note's flight, fading once it is in place
    const c0 = NHOOK + NCAN;
    for (const s of this.N) {
      const l = c0 + s.i, wv = 0.012 * (1 - ramp(T, s.tb + FLY, s.tb + FLY + 1.3));
      if (back || T < s.tb || wv <= 0.0005) { this.noLine(l); continue; }
      const q = ease.out(clamp01((T - s.tb) / FLY));
      for (let j = 0; j < NPT; j++) { this.bez(s, q * j / (NPT - 1), this.x); this.path[j * 3] = this.x.x; this.path[j * 3 + 1] = this.x.y; this.path[j * 3 + 2] = this.x.z; }
      this.emit(l, wv, 3, cam);
    }
    this.lines.geometry.attributes.position.needsUpdate = true;
    L.voice().place();
  },

  put(AP, AS, j, p, roll, sx, sy, ring, erode) { AP[j * 4] = p.x; AP[j * 4 + 1] = p.y; AP[j * 4 + 2] = p.z; AP[j * 4 + 3] = roll; AS[j * 4] = sx; AS[j * 4 + 1] = sy; AS[j * 4 + 2] = ring; AS[j * 4 + 3] = erode; },
  noLine(l) { this.lines.geometry.attributes.position.array.fill(0, l * NPT * 6, (l + 1) * NPT * 6); },
  // this.path as a ribbon of width W facing the camera; profile 1: a dart (thick start, fine end), 3: a cord
  emit(l, W, prof, cam) {
    const A = this.lines.geometry.attributes.position.array, P = this.path;
    for (let j = 0; j < NPT; j++) {
      const a = Math.max(0, j - 1), b = Math.min(NPT - 1, j + 1), s = j / (NPT - 1);
      this.tan.set(P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]);
      this.cv.set(cam.x - P[j * 3], cam.y - P[j * 3 + 1], cam.z - P[j * 3 + 2]);
      this.side.crossVectors(this.tan, this.cv); const n = this.side.length() || 1;
      const w = W * (prof === 1 ? Math.min(1, s * 10 + 0.3) * (1 - 0.82 * s) : 0.6 + 0.4 * Math.min(1, s * 8)) * 0.5 / n;
      const o = (l * NPT + j) * 6;
      A[o] = P[j * 3] - this.side.x * w; A[o + 1] = P[j * 3 + 1] - this.side.y * w; A[o + 2] = P[j * 3 + 2] - this.side.z * w;
      A[o + 3] = P[j * 3] + this.side.x * w; A[o + 4] = P[j * 3 + 1] + this.side.y * w; A[o + 5] = P[j * 3 + 2] + this.side.z * w;
    }
  },

  // ---------------------------------------------------------------- the instruments (his colours' voices), made here
  play(L, kind, f, at = 0, dur = 0.5, vol = 1) {
    const v = L.voice(), c = v.ctx, out = v.out(); if (!c || !out) return;
    const t = c.currentTime + Math.max(0, at);
    const osc = (type, fr, g0, { lp = 0, q = 0.7, vib = 0, vibAt = 0.15, attack = 0.02, rel = 0.2, bright = 0, d = dur } = {}) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(fr, t);
      let node = o;
      if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = q; fl.frequency.setValueAtTime(lp, t); if (bright) { fl.frequency.setValueAtTime(lp * 0.4, t); fl.frequency.linearRampToValueAtTime(lp * bright, t + 0.05); fl.frequency.exponentialRampToValueAtTime(lp, t + 0.3); } o.connect(fl); node = fl; }
      let lfo = null;
      if (vib) { lfo = c.createOscillator(); const lg = c.createGain(); lfo.frequency.value = 5.4; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(fr * vib, t + vibAt + 0.25); lfo.connect(lg); lg.connect(o.frequency); }
      const end = t + d;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(g0, t + attack); g.gain.setValueAtTime(g0, Math.max(t + attack, end - rel * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, end + rel);
      node.connect(g); g.connect(out); o.start(t); o.stop(end + rel + 0.05); if (lfo) { lfo.start(t); lfo.stop(end + rel + 0.05); }
    };
    const V = 0.03 * vol;
    switch (kind) {
      case 'cello': osc('sawtooth', f, V * 0.55, { lp: f * 3.2, vib: 0.006, attack: 0.09, rel: 0.35 }); osc('sine', f, V * 0.5, { attack: 0.08, rel: 0.35 }); break;
      case 'violin': osc('sawtooth', f, V * 0.42, { lp: f * 4.5, q: 1.4, vib: 0.007, vibAt: 0.1, attack: 0.06, rel: 0.25 }); osc('triangle', f, V * 0.3, { attack: 0.05 }); break;
      case 'horn': osc('square', f, V * 0.3, { lp: f * 2.2, attack: 0.045, rel: 0.25 }); osc('sine', f, V * 0.55, { attack: 0.04, rel: 0.3 }); break;
      case 'bell': v.bell(f, Math.max(0, at), V * 1.1, 2.4); osc('triangle', f, V * 0.5, { attack: 0.004, rel: 0.6, d: Math.min(dur, 0.25) }); osc('sine', f * 2.76, V * 0.12, { attack: 0.002, rel: 0.5, d: 0.08 }); break;
      case 'flute': osc('sine', f, V * 0.9, { vib: 0.006, vibAt: 0.2, attack: 0.06, rel: 0.15 }); osc('triangle', f * 2, V * 0.1, { attack: 0.06, rel: 0.15 }); v.note(f * 3.01, 0.08, { at: Math.max(0, at), vol: V * 0.12, type: 'sine', attack: 0.01 }); break;
      case 'trumpet': osc('sawtooth', f, V * 0.42, { lp: f * 3.5, q: 1.2, bright: 2.2, vib: 0.005, vibAt: 0.2, attack: 0.025, rel: 0.15 }); osc('square', f, V * 0.08, { lp: f * 2, attack: 0.03 }); break;
      case 'pizz': osc('triangle', f, V * 1.1, { attack: 0.003, rel: 0.4, d: 0.02 }); osc('sine', f * 2, V * 0.3, { attack: 0.002, rel: 0.15, d: 0.01 }); break;
      case 'timp': { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * 1.02, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.6); o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.7);
        osc('sine', f * 1.5, vol * 0.3, { attack: 0.004, rel: 0.4, d: 0.02 }); noise(v, at, { d: 0.12, vol: vol * 0.5, lp: 900 }); break; }
    }
  },
  // a cannon: the timpani's boom, a thump in the floor and a little crack
  boom(L, f, at, k = 1) {
    const v = L.voice(); if (!v.ctx) return;
    if (L.calm) k *= 0.55;                                  // (reduced motion and flashing: no sudden bang; the crack is left out)
    this.play(L, 'timp', f, at, 1.5, 0.085 * k);
    noise(v, at, { d: 0.55, vol: 0.05 * k, lp: 240, attack: L.calm ? 0.05 : 0.004 });
    if (!L.calm) noise(v, at, { d: 0.07, vol: 0.014 * k, hp: 1800, attack: 0.001 });
  },
});
