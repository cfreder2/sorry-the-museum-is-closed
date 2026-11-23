// Vasily Kandinsky, Improvisation No. 30 (Cannons) (1913), Gallery 392. The word: boom.
//
// Kandinsky heard colours: yellow was a trumpet, light blue a flute, dark blue a cello, green a violin, warm red a
// brass fanfare, orange a church bell; white a silence full of possibility, black a silence with nothing after it. In
// 1928 he staged Musorgsky's Pictures at an Exhibition (1874) with nothing but coloured shapes and lines moving on a
// stage. So here his picture is played. The black lines dart out from behind the frame's left edge and hook in the air
// (pizzicato); three of his tilted towers slide out from behind its right edge, one with its red block; and the two
// little cannons of the lower right roll out from under the bottom rail, turn and lift their barrels. BOOM: the first
// fires, a grey puff with a jagged rim (his, from the bottom of the canvas) blooms at its mouth, and out of the puff,
// one by one, come the notes of the Promenade, each a flat shape in his colours (a blue field with its pale rim, a red
// arc, an orange block, a green leaf, a pale-blue fan, a yellow sun) sounding in its own colour's instrument as it is
// born and flying on a twisted brown-red cord, like the ones that cross his canvas, to hang in a row below the work:
// higher notes hang higher, so the row in the air is the tune's own shape. The second cannon fires for the second bar.
// Then a timpani roll, both cannons together, and the whole row rings once from left to right and settles into a
// B-flat chord in blue, red and yellow. After that it improvises (the title's word): now and then one shape sounds
// and bobs. When you stop looking it stays while the toy is near: drive into the shapes and each plays its note;
// bump a cannon and it fires. Then everything goes back under the bottom rail and behind the frame.
//
// Everything is drawn from what is in this canvas; nothing in it is a firework. The tune is Musorgsky's (1874).
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, shape, canvasTexture } from '../paintlife.js';
import { Bones, hump, noise } from './stagecraft.js';
import { hz } from './tunes.js';

const TAU = Math.PI * 2, wrap = a => a - TAU * Math.round(a / TAU), decay = (T, t0, k) => (T >= t0 ? Math.exp(-(T - t0) * k) : 0);
const BEAT = 0.44;                                   // the Promenade, a little brisk (crotchet = 136)
const T1 = 1.9, T2 = T1 + 5 * BEAT;                  // the two bars: the first cannon, the second
const TROLL = 6.85, TB = 7.3, TS = 7.42, SWEEP = 0.06, TC = 8.35, TI = 9.6, IDLE = 0.64;
const FLY = 0.8;                                     // a note's flight from the puff to its place
// Musorgsky, Pictures at an Exhibition (1874), Promenade: the first two bars (5/4, 6/4). [note, beat, beats]
const MEL = [['G4', 0, 1], ['F4', 1, 1], ['Bb4', 2, 1], ['C5', 3, 0.5], ['F5', 3.5, 0.5], ['D5', 4, 1],
  ['C5', 5, 0.5], ['F5', 5.5, 0.5], ['D5', 6, 1], ['Bb4', 7, 1], ['C5', 8, 1], ['G4', 9, 1], ['F4', 10, 2]];
// Each pitch has one colour, and that colour its instrument, as he heard them: [shape kind, fill, rim, instrument,
// height of its place (m), size (m), octave shift for the instrument]
const VOICES = {
  F4: [0, '#2b46a6', '#ecc9c0', 'cello', 0.32, 0.26, -1],      // dark blue: a cello (his blue field, pale-rimmed)
  G4: [5, '#2c7656', '#cfe2a4', 'violin', 0.41, 0.21, 0],       // green: a violin
  Bb4: [2, '#c8332a', '#f4ede0', 'horn', 0.5, 0.23, 0],        // warm red: brass
  C5: [3, '#de7a2a', '#7a4426', 'bell', 0.58, 0.17, 0],        // orange: a bell
  D5: [4, '#80c2de', '#f1f7f2', 'flute', 0.65, 0.19, 0],       // light blue: a flute
  F5: [1, '#f2c936', '#fbf0c2', 'trumpet', 0.74, 0.16, 0],      // yellow: a trumpet
};
// the first bar's places, along the wall (clear of this frame and of the Poplars beside it, seen from the look)
const COLUMN = { F4: -1.04, G4: -0.9, Bb4: -1.06, C5: -0.88, D5: -1.04, F5: -0.95 };
const ASPECT = [[1.3, 1], [1, 1], [1.25, 0.8], [0.72, 1.05], [1, 1], [0.58, 1.12], [1, 1]];
const NN = MEL.length, NPUFF = 2, NTOW = 3, NS = NN + NPUFF + NTOW;   // shapes: the notes, the two puffs, the towers' planes
const NPT = 22, NHOOK = 4, MAXL = NHOOK + NTOW * 4 + NN;
const R_WHEEL = 0.085, CS = 1.4;               // the wheel's radius (as built), and the cannons' scale
// the cannons: where they come out (under the rail), where they stand, where they aim, when they roll, when they fire
const CAN = [
  { us: 0.36, u: 0.62, out: 0.42, au: -1, ao: 0.42, tR: 0.5, fires: [T1, TB] },
  { us: 0.52, u: 1.02, out: 0.74, au: -1, ao: 0.3, tR: 0.8, fires: [T2, TB] },
];
const HOOKS = [   // the black lines: height they leave the frame at, heading, length, bend, curl, when
  { h: 1.22, th: Math.PI + 0.42, len: 0.6, k1: 0.5, k2: 3.0, td: 0.12 },
  { h: 1.58, th: Math.PI - 0.12, len: 0.68, k1: -0.35, k2: -3.2, td: 0.36 },
  { h: 1.93, th: Math.PI + 0.12, len: 0.56, k1: 0.55, k2: 3.4, td: 0.6 },
  { h: 2.17, th: Math.PI - 0.45, len: 0.48, k1: -0.25, k2: -2.6, td: 0.84 },
];
const TOWERS = [  // base along the wall, height, half width, lean, when it slides out, its coloured plane (from, to, colours)
  { u: 0.86, H: 1.74, w: 0.07, tilt: 0.1, t0: 0.3, p0: 0.98, p1: 1.42, fill: '#b9d6de', rim: '#e9eee6' },
  { u: 1.1, H: 2.14, w: 0.085, tilt: 0.035, t0: 0.55, p0: 0.92, p1: 1.5, fill: '#d2402e', rim: '#5a2418', red: true },
  { u: 1.33, H: 1.55, w: 0.064, tilt: -0.085, t0: 0.8, p0: 0.86, p1: 1.24, fill: '#efe8d6', rim: '#d9c9a0' },
];

const GLSL_NOISE = /* glsl */`
float kH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float kN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(kH(i), kH(i + vec2(1.0, 0.0)), f.x), mix(kH(i + vec2(0.0, 1.0)), kH(i + vec2(1.0, 1.0)), f.x), f.y); }
`;

lifeFor(8991, {
  title: /^Improvisation No. 30/,
  word: 'boom',
  stage: { out: 1.3, half: 1.9, cam: { dist: 2.7, side: -0.12, height: 1.2, fov: 56, lookU: -0.2, lookOut: 0.3, lookH: 1.08, floorOut: 0.9 } },
  wake: 2, ret: 2.0,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.22) => P.near(h, a);
    this.cH = L.cy - L.y;
    const at = (u, h, out, into) => L.at(u, h - this.cH, out, into);
    this.P = at;
    this.v = new THREE.Vector3(); this.w = new THREE.Vector3(); this.x = new THREE.Vector3(); this.y3 = new THREE.Vector3();
    this.cv = new THREE.Vector3(); this.side = new THREE.Vector3(); this.tan = new THREE.Vector3();
    this.bones = new Bones(); this.mBase = new THREE.Matrix4(); this.mPart = new THREE.Matrix4(); this.mBar = new THREE.Matrix4();
    this.po = { x: 0, z: 0, yaw: 0, elev: 0, spin: 0, turn: 0, rec: 0 };
    // (a tower's point j: du across it, h up it; leaning and swaying as tl says)
    this.tl = { tilt: 0, sway: 0, H: 1, ub: 0, out: 0 };
    this.putT = (j, du, h) => { const tl = this.tl, t2 = tl.tilt + tl.sway * h / tl.H, x = tl.ub + du * Math.cos(t2) - h * Math.sin(t2), y = du * Math.sin(t2) + h * Math.cos(t2); this.P(x, y, tl.out, this.x); this.path[j * 3] = this.x.x; this.path[j * 3 + 1] = this.x.y; this.path[j * 3 + 2] = this.x.z; };

    // ---------------------------------------------------------- the notes: where each hangs, its colour, its instrument
    const rnd = L.rand;
    this.N = MEL.map(([n, b], i) => {
      const V = VOICES[n], kind = V[0], tb = T1 + b * BEAT;
      // the first bar rises, so it climbs the bare wall left of the frame (his diagonal, up and to the left); the second
      // falls, so it lands in a row along the floor, under the work, where the toy can reach it. Higher notes, higher.
      const up = b < 5, st = Math.log2(hz(n) / hz('F4')) * 12;
      return { n, i, kind, f: hz(n), inst: V[3], oct: V[6], tb, c: up ? 0 : 1, up, r: V[5] * (up ? 1.0 : 0.84) * (0.95 + 0.1 * rnd()),
        u: up ? COLUMN[n] : -0.8 + (i - 6) * 0.152, h: up ? 0.96 + st * 0.108 : 0.3 + st * 0.042,
        out: up ? 0.2 + (rnd() - 0.5) * 0.06 : [0.34, 0.62, 0.46][i % 3] + (rnd() - 0.5) * 0.06,
        P1: new THREE.Vector3(), P2: new THREE.Vector3(),
        roll: (rnd() - 0.5) * 1.4, spin: (rnd() - 0.5) * 5, ph: rnd() * TAU, seed: 1 + rnd() * 40, fill: col(V[1]), rim: col(V[2], 0.12),
        M: new THREE.Vector3(), S: new THREE.Vector3(), B: new THREE.Vector3(), bs: 1, du: 0, dh: 0, dout: 0, vu: 0, vh: 0, vout: 0, hit: -9 };
    });

    // ---------------------------------------------------------- the shapes: flat, his, facing you; one draw call
    const base = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.instanceCount = NS;
    const dyn = (n, k) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(n * k), k); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.aPos = dyn(NS, 4); this.aSize = dyn(NS, 4);
    const aKind = new THREE.InstancedBufferAttribute(new Float32Array(NS * 2), 2), aCol = new THREE.InstancedBufferAttribute(new Float32Array(NS * 3), 3), aRim = new THREE.InstancedBufferAttribute(new Float32Array(NS * 3), 3);
    const setC = (A, i, c) => A.setXYZ(i, c.r * 0.94, c.g * 0.94, c.b * 0.94);
    this.N.forEach((s, i) => { aKind.setXY(i, s.kind, s.seed); setC(aCol, i, s.fill); setC(aRim, i, s.rim); });
    for (let p = 0; p < NPUFF; p++) { aKind.setXY(NN + p, 6, 3 + p * 7.7); setC(aCol, NN + p, col('#8f918c', 0.2)); setC(aRim, NN + p, col('#f2efe6', 0.1)); }
    TOWERS.forEach((tw, k) => { const j = NN + NPUFF + k; aKind.setXY(j, 3, tw.red ? 101 : 60 + k); setC(aCol, j, col(tw.fill, 0.15)); setC(aRim, j, col(tw.rim, 0.1)); });
    for (const [k, a] of [['aPos', this.aPos], ['aSize', this.aSize], ['aKind', aKind], ['aCol', aCol], ['aRim', aRim]]) geo.setAttribute(k, a);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false });
    const rope = col('#7a3420', 0.15), dark = col('#1c1a1a', 0.1);
    mat.onBeforeCompile = sh => {
      sh.uniforms.uRope = { value: new THREE.Vector3(rope.r, rope.g, rope.b) }; sh.uniforms.uDark = { value: new THREE.Vector3(dark.r, dark.g, dark.b) };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec4 aPos, aSize; attribute vec2 aKind; attribute vec3 aCol, aRim;
varying vec2 vQ, vK; varying vec3 vCol, vRim; varying vec2 vRing;`)
        .replace('#include <project_vertex>', `vec4 mvPosition = modelViewMatrix * vec4(aPos.xyz, 1.0);
  { float c = cos(aPos.w), s = sin(aPos.w); vec2 p = position.xy * aSize.xy * (1.0 + 0.14 * aSize.z);
    mvPosition.xy += vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
  gl_Position = projectionMatrix * mvPosition;
  vQ = position.xy * 2.0; vK = aKind; vCol = aCol; vRim = aRim; vRing = aSize.zw;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec2 vQ, vK; varying vec3 vCol, vRim; varying vec2 vRing; uniform vec3 uRope, uDark;
${GLSL_NOISE}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  {
    vec2 q = vQ; int T = int(vK.x + 0.5); float sd = vK.y;
    float r = length(q), a = atan(q.y, q.x), d = 1.0, rimW = 0.16;
    vec3 fill = vCol, rim = vRim; bool cord = false, sun = false;
    if (T == 0) { d = r - (0.72 + 0.11 * sin(a * 2.0 + sd * 6.0) + 0.07 * sin(a * 3.0 - sd * 4.0) + 0.04 * sin(a * 5.0 + sd)); rimW = 0.2; cord = true; }
    else if (T == 1) { d = r - (0.9 + 0.035 * sin(a * 9.0 + sd)); sun = true; }
    else if (T == 2) { vec2 c = q - vec2(0.0, -0.95); float rr = length(c), aa = atan(c.x, c.y);
      float w = 0.27 * (1.0 - pow(clamp(abs(aa) / 1.0, 0.0, 1.0), 2.0)) + 0.02; d = max(abs(rr - 1.36) - w, abs(aa) - 1.02); rimW = 0.09; }
    else if (T == 3) { vec2 p = vec2(q.x + 0.2 * q.y, q.y); d = max(abs(p.x) - 0.58, abs(p.y) - 0.86); rimW = 0.1;
      if (sd > 100.0 && abs(q.y - 0.12) < 0.34 && abs(abs(p.x) - 0.24) < 0.07) fill = uDark; }
    else if (T == 4) { vec2 c = q - vec2(0.0, -0.92); float rr = length(c), aa = atan(c.x, c.y);
      d = max(max(abs(aa) - 0.56, rr - 1.78), 0.12 - rr); rimW = 0.0;
      fill = mix(fill, rim, 0.75 * step(0.35, sin(aa * 21.0 + sd + 2.0 * rr))); }
    else if (T == 5) { d = max(length(q - vec2(0.62, 0.0)) - 0.98, length(q + vec2(0.62, 0.0)) - 0.98); rimW = 0.14; cord = true; }
    else { float sp = pow(0.5 + 0.5 * sin(a * 12.0 + 1.7 * sin(a * 5.0 + sd)), 3.0);
      d = r - (0.46 + 0.42 * sp + 0.06 * kN(vec2(a * 6.0, sd))); rimW = 0.34;
      if (length(q - vec2(0.12, 0.04)) < 0.17 + 0.1 * kN(q * 7.0 + sd)) fill = uDark; }
    // a loaded brush's edge, and (going) a dissolve in patches
    d += 0.06 * (kN(q * 13.0 + sd * 13.0) - 0.5) + 0.035 * (kN(vec2(a * 18.0, r * 4.0 + sd)) - 0.5);
    d += vRing.y * (0.15 + 1.4 * kN(q * 4.0 + sd * 2.0));
    if (d > 0.0) discard;
    float sa = sd * 2.3; vec2 sq = vec2(cos(sa) * q.x - sin(sa) * q.y, sin(sa) * q.x + cos(sa) * q.y);
    vec3 c = fill * (0.86 + 0.24 * kN(sq * vec2(2.5, 16.0) + sd));
    if (sun) { float core = 0.56 + 0.05 * sin(a * 7.0 + sd); c = r < core ? c : rim * (0.9 + 0.14 * kN(q * 9.0)); }
    else if (rimW > 0.0) { float k = 1.0 - smoothstep(rimW * (0.55 + 0.4 * vRing.x), rimW * (1.0 + 0.6 * vRing.x), -d); c = mix(c, rim * (0.9 + 0.14 * kN(q * 17.0 + sd)), k); }
    if (cord && -d < 0.055) c = mix(uRope, vec3(0.93, 0.78, 0.72), step(0.5, fract(a * 9.0 + sd)) * 0.45);
    c *= 1.0 + 0.3 * vRing.x; c = mix(c, vec3(1.0, 0.98, 0.92), 0.14 * vRing.x);
    diffuseColor.rgb = c;
  }`);
    };
    mat.customProgramCacheKey = () => 'kandinsky-shapes';
    this.shapes = L.add(new THREE.Mesh(geo, mat)); this.shapes.name = 'shapes';

    // ---------------------------------------------------------- the lines: black hooks, towers, the brown-red cords
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
      const c = l >= NHOOK + NTOW * 4 ? (j % 2 ? cordA : cordB) : (j % 3 ? ink : ink2);
      for (let s = 0; s < 2; s++) lcol.set([c.r, c.g, c.b], ((l * NPT + j) * 2 + s) * 3);
    }
    const lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3).setUsage(THREE.DynamicDrawUsage));
    lgeo.setAttribute('color', new THREE.BufferAttribute(lcol, 3)); lgeo.setAttribute('uv', new THREE.BufferAttribute(luv, 2)); lgeo.setIndex(idx);
    this.lines = L.add(new THREE.Mesh(lgeo, new THREE.MeshBasicMaterial({ map: bristle, vertexColors: true, alphaTest: 0.4, side: THREE.DoubleSide, fog: false })));
    this.lines.name = 'lines';
    this.path = new Float32Array(NPT * 3);

    // ---------------------------------------------------------- the cannons: his brown blocks on black crescent wheels
    const brown = col('#7a4a26'), ochre = col('#c9963e'), orange = col('#d9772e'), pink = col('#e6a7a0'), dbrown = col('#4a2c18'), black = col('#141212', 0.08);
    const barrel = shape.cyl(0.052, 0.04, 0.3, 14, brown); shape.move(barrel, 0, 0, 0.09, Math.PI / 2, 0, 0);
    shape.paint(barrel, (c, n) => (c.z > 0.21 ? dbrown : c.z > 0.02 && c.z < 0.07 ? pink : n.y > 0.45 ? ochre : n.y < -0.4 ? orange : null));
    const breech = shape.box(0.12, 0.11, 0.08, brown); shape.move(breech, 0, 0, -0.07);
    shape.paint(breech, (c, n) => (n.y > 0.5 ? ochre : n.x > 0.5 ? orange : n.z < -0.5 ? pink : null));
    const carriage = shape.box(0.1, 0.055, 0.27, dbrown); shape.move(carriage, 0, -0.06, -0.03);
    shape.paint(carriage, (c, n) => (n.y > 0.5 ? brown : null));
    const trail = shape.box(0.045, 0.03, 0.2, dbrown); shape.move(trail, 0, -0.1, -0.2, -0.45, 0, 0);
    const gBody = shape.merge([barrel, breech]), gCarr = shape.merge([carriage, trail]);
    // a wheel: a black crescent stroke, thick in the middle and thin at its ends, with two spokes
    const tor = new THREE.TorusGeometry(R_WHEEL, 0.016, 7, 30, 5.3).toNonIndexed(), tp = tor.attributes.position;
    for (let i = 0; i < tp.count; i++) {
      const x = tp.getX(i), y = tp.getY(i), z = tp.getZ(i), th = Math.atan2(y, x), q = ((th + TAU) % TAU) / 5.3, k = 0.18 + 0.82 * Math.pow(Math.sin(Math.PI * clamp01(q)), 0.55);
      const cx = Math.cos(th) * R_WHEEL, cy = Math.sin(th) * R_WHEEL; tp.setXYZ(i, cx + (x - cx) * k, cy + (y - cy) * k, z * k);
    }
    tor.deleteAttribute('uv'); tor.deleteAttribute('normal'); tor.computeVertexNormals();
    const cw = new Float32Array(tp.count * 3); for (let i = 0; i < tp.count; i++) cw.set([black.r, black.g, black.b], i * 3);
    tor.setAttribute('color', new THREE.BufferAttribute(cw, 3)); tor.rotateY(Math.PI / 2);
    const sp1 = shape.box(0.012, R_WHEEL * 1.9, 0.012, black), sp2 = shape.box(0.012, 0.012, R_WHEEL * 1.7, black); shape.move(sp2, 0, 0, 0, 0.5, 0, 0);
    const gWheel = shape.merge([tor, sp1, sp2]);
    const gStick = shape.cyl(0.009, 0.005, 0.46, 6, black); shape.move(gStick, 0, 0.23, 0);
    const rig = this.rig = L.rig(12, 9000, L.paint({ glow: 0.38, rough: 0.8 }));
    const ids = [rig.geo(gBody), rig.geo(gCarr), rig.geo(gWheel), rig.geo(gStick)];
    this.cans = CAN.map(() => ({ body: rig.add(ids[0]), carr: rig.add(ids[1]), wl: rig.add(ids[2]), wr: rig.add(ids[2]), stick: rig.add(ids[3]), extra: -99, B: { u: 0, out: 0, yaw: 0, elev: 0 } }));
    // where each note is fired from: the mouth of its cannon at the moment it is born
    // and its flight: out of the mouth along the barrel, then round under the frame and up (or down) to its place
    for (const s of this.N) {
      this.muzzle(L, s.c, s.tb, s.M); this.pose(L, s.c, s.tb, this.po); at(s.u, s.h, s.out, s.S);
      s.P1.set(Math.sin(this.po.yaw), 0, Math.cos(this.po.yaw)).multiplyScalar(0.55).add(s.M); s.P1.y += 0.3;
      if (s.up) at(s.u + 0.12, 0.45, s.out + 0.35, s.P2); else at(s.u + 0.2, s.h + 0.32, s.out + 0.1, s.P2);
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
    for (const c of this.cans) for (const k of ['body', 'carr', 'wl', 'wr', 'stick']) this.rig.show(c[k], false);
  },
  start(L, resumed) {
    if (resumed) { this.shift = Math.max(0, (this.T || 0) - L.t); }
    else { this.shift = 0; this.T = 0; for (const s of this.N) { s.du = s.dh = s.dout = s.vu = s.vh = s.vout = 0; s.hit = -9; } for (const c of this.cans) c.extra = -99; }
    const T0 = L.t + this.shift; this.cur = 0; while (this.cur < this.ev.length && this.ev[this.cur].t < T0) this.cur++;
  },
  back(L) {
    this.bT = this.T;
    for (const s of this.N) { this.notePos(L, s, this.bT, s.B); s.bs = this.noteScale(s, this.bT); }
    this.cans.forEach((c, i) => { this.pose(L, i, this.bT, this.po); c.B.u = this.po.u; c.B.out = this.po.out; c.B.yaw = this.po.yaw; c.B.elev = this.po.elev; c.B.spin = this.po.spin; });
    if (!L.quiet) ['Bb4', 'F4', 'D4', 'Bb3'].forEach((n, i) => this.play(L, 'pizz', hz(n), i * 0.16, 0.5, 0.022));
  },
  end(L) { this.hide(); },
  reset(L) { this.hide(); this.T = 0; },

  // ---------------------------------------------------------------- a cannon at show-time T (local: u, out, yaw)
  pose(L, c, T, o) {
    const C = CAN[c], k = ease.inOut(ramp(T, C.tR, C.tR + 1.0)), du = C.u - C.us, dout = C.out + 0.45, dist = Math.hypot(du, dout);
    o.u = C.us + du * k; o.out = -0.45 + dout * k;
    const yRoll = L.yawOf(du, dout), yAim = L.yawOf(C.au, C.ao), turn = wrap(yAim - yRoll) * ease.inOut(ramp(T, C.tR + 0.95, C.tR + 1.35));
    o.yaw = yRoll + turn; o.turn = turn;
    o.elev = 0.3 * ease.outBack(ramp(T, C.tR + 1.2, C.tR + 1.6));
    o.rec = 0;
    for (let n = 0; n <= C.fires.length; n++) {
      const age = T - (n < C.fires.length ? C.fires[n] : this.cans ? this.cans[c].extra : -99);
      if (age > -0.3 && age < 0) { const cr = ease.in((age + 0.3) / 0.3); o.rec += 0.016 * cr; o.elev -= 0.05 * cr; }      // (it crouches, then kicks)
      else if (age >= 0 && age < 1.2) { o.rec += 0.09 * (age < 0.08 ? ease.out(age / 0.08) : 1 - ease.inOut((age - 0.08) / 1.1)); o.elev += 0.22 * Math.exp(-age * 5) * Math.sin(Math.min(1, age / 0.06) * Math.PI / 2); }
    }
    const rec = o.rec;
    o.spin = (dist * k - rec) / (R_WHEEL * CS);
    return o;
  },
  // its matrices and the mouth of its barrel (world)
  place(L, o, into) {
    const p = L.floor(o.u, o.out, this.v), sy = Math.sin(o.yaw), cy = Math.cos(o.yaw);
    p.x -= sy * o.rec; p.z -= cy * o.rec;
    this.bones.set(this.mBase, p.x, L.y + 0.004, p.z, o.yaw, 0, 0, CS);
    this.bones.child(this.mBar, this.mBase, 0, 0.135, 0.02, 0, -o.elev, 0);
    if (into) into.set(0, 0, 0.25).applyMatrix4(this.mBar);
  },
  muzzle(L, c, T, into) { this.pose(L, c, T, this.po); this.place(L, this.po, into); return into; },

  // ---------------------------------------------------------------- a note at show-time T
  notePos(L, s, T, into) {
    this.bez(s, ease.out(clamp01((T - s.tb) / FLY)), into);
    const settle = ramp(T, s.tb + FLY, s.tb + FLY + 0.6);
    into.y += 0.014 * Math.sin(T * 1.4 + s.ph) * settle + 0.05 * hump(T, TS + s.i * SWEEP, TS + s.i * SWEEP + 0.34);
    if (T > TI) { into.y += 0.022 * Math.sin((T - TI) * 0.5 + s.ph) * ramp(T, TI, TI + 2); this.v.set(L.tx, 0, L.tz).multiplyScalar(0.03 * Math.sin((T - TI) * 0.37 + s.ph * 2) * ramp(T, TI, TI + 2)); into.add(this.v); }
    return into;
  },
  bez(s, q, into) { const a = 1 - q; return into.set(0, 0, 0).addScaledVector(s.M, a * a * a).addScaledVector(s.P1, 3 * a * a * q).addScaledVector(s.P2, 3 * a * q * q).addScaledVector(s.S, q * q * q); },
  towerK(L, k, T, back) { const tw = TOWERS[k]; return back ? 1 - ease.inOut(ramp(L.ret, 0.3, 0.9)) : ease.inOut(ramp(T, tw.t0, tw.t0 + 0.7)); },
  noteScale(s, T) { return T < s.tb ? 0 : 0.25 + 0.75 * ease.outBack(clamp01((T - s.tb) / 0.32)); },
  ring(s, T) {
    let r = Math.max(decay(T, s.tb, 3.2), decay(T, TS + s.i * SWEEP, 3.6), decay(T, s.hit, 3.2));
    if (s.n === 'Bb4' || s.n === 'D5' || s.n === 'F4' || s.n === 'F5') if (T >= TC) r = Math.max(r, 0.7 * Math.exp(-(T - TC) * 0.9));
    if (T > TI) { const k0 = Math.floor((T - TI) / IDLE); for (let k = Math.max(0, k0 - 2); k <= k0 + 1; k++) if (this.idleOf(k) === s.i) r = Math.max(r, decay(T, TI + k * IDLE + this.idleJit(k), 2.6)); }
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
    const R = back ? ease.inOut(L.ret) : 0;
    // ---- the toy (while it lingers): it plays the shapes, and bumps the cannons
    const toy = L.k.G.vehicle, tl = linger && toy && Math.abs(toy.pos.y - L.y) < 0.4 ? L.local(toy.pos.x, toy.pos.z) : null;
    // ---- the cannons
    this.cans.forEach((cn, c) => {
      const o = this.pose(L, c, T, this.po);
      if (back) { const B = cn.B, e1 = ease.inOut(ramp(L.ret, 0, 0.35)), e2 = ease.inOut(ramp(L.ret, 0.25, 0.95)), C = CAN[c];
        o.yaw = B.yaw + wrap(L.yawOf(C.u - C.us, C.out + 0.45) - B.yaw) * e1; o.elev = B.elev * (1 - e1); o.rec = 0;
        o.u = B.u + (C.us - B.u) * e2; o.out = B.out + (-0.45 - B.out) * e2; o.spin = B.spin - Math.hypot(C.us - B.u, -0.45 - B.out) * e2 / (R_WHEEL * CS); }
      if (tl && T - cn.extra > 1.6 && Math.hypot(tl.u - o.u, tl.out - o.out) < 0.3) { cn.extra = T; if (!L.quiet) this.boom(L, hz(c ? 'F2' : 'Bb2'), 0, 0.9); }
      const vis = o.out > -0.42;
      for (const k of ['body', 'carr', 'wl', 'wr', 'stick']) this.rig.show(cn[k], vis);
      if (!vis) return;
      this.place(L, o, null);
      this.rig.mat(cn.body, this.mBar);
      this.rig.mat(cn.carr, this.bones.child(this.mPart, this.mBase, 0, 0.135, 0, 0, 0, 0));
      const tw = o.turn * 0.075 / R_WHEEL;
      this.rig.mat(cn.wl, this.bones.child(this.mPart, this.mBase, -0.075, R_WHEEL, 0, 0, o.spin + tw, 0));
      this.rig.mat(cn.wr, this.bones.child(this.mPart, this.mBase, 0.075, R_WHEEL, 0, 0, o.spin - tw, 0));
      this.rig.mat(cn.stick, this.bones.child(this.mPart, this.mBase, 0.03, 0.0, -0.22, 0, 0.95 - 0.5 * o.elev, 0.1));
    });
    // ---- the shapes
    const AP = this.aPos.array, AS = this.aSize.array;
    for (const s of this.N) {
      const i = s.i, p = this.w;
      let sc, ringK = this.ring(s, T), go = 0;
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
        go = 0;
      }
      const q = clamp01((T - s.tb) / FLY), roll = s.roll + (1 - ease.out(q)) * s.spin + 0.12 * Math.sin(T * 0.6 + s.ph) + 0.25 * hump(T, TS + i * SWEEP, TS + i * SWEEP + 0.5);
      AP[i * 4] = p.x; AP[i * 4 + 1] = p.y; AP[i * 4 + 2] = p.z; AP[i * 4 + 3] = roll;
      const A = ASPECT[s.kind], size = 2 * s.r * sc * (1 + 0.1 * ringK + 0.28 * decay(T, TS + i * SWEEP, 5) * (T < TS + i * SWEEP + 1 ? 1 : 0));
      AS[i * 4] = size * A[0]; AS[i * 4 + 1] = size * A[1]; AS[i * 4 + 2] = ringK; AS[i * 4 + 3] = go;
    }
    // ---- the puffs: grey, jagged, at the mouth; they rise, swell and break up
    for (let c = 0; c < NPUFF; c++) {
      const j = NN + c; let F = -99;
      for (const f of CAN[c].fires) if (f <= T && f > F) F = f;
      if (this.cans[c].extra <= T && this.cans[c].extra > F) F = this.cans[c].extra;
      const age = T - F;
      if (back || age > 2.4 || age < 0) { AS[j * 4] = AS[j * 4 + 1] = 0; continue; }
      this.muzzle(L, c, F, this.x); this.pose(L, c, F, this.po);
      this.x.x += Math.sin(this.po.yaw) * 0.07; this.x.z += Math.cos(this.po.yaw) * 0.07; this.x.y += 0.03 + 0.1 * ease.out(age / 2.4);
      const sz = (0.3 + 0.12 * c) * (F === TB ? 1.35 : 1) * ease.outBack(clamp01(age / 0.22)) * (1 + 0.25 * age);
      AP[j * 4] = this.x.x; AP[j * 4 + 1] = this.x.y; AP[j * 4 + 2] = this.x.z; AP[j * 4 + 3] = 0.3 * c + 0.15 * age;
      AS[j * 4] = sz; AS[j * 4 + 1] = sz * 0.92; AS[j * 4 + 2] = Math.exp(-age * 6); AS[j * 4 + 3] = ease.in(ramp(age, 0.35, 2.4)) * 1.05;
    }
    // ---- the towers' coloured planes (one red, with its black windows)
    for (let k = 0; k < NTOW; k++) {
      const tw = TOWERS[k], e = this.towerK(L, k, T, back), j = NN + NPUFF + k;
      if (e <= 0.01) { AS[j * 4] = AS[j * 4 + 1] = 0; continue; }
      const tilt = tw.tilt * e, ub = tw.u - (1 - e) * (tw.u - 0.5), h = (tw.p0 + tw.p1) / 2;
      this.P(ub - Math.sin(tilt) * h, Math.cos(tilt) * h, -0.035 + 0.075 * e, this.x);
      AP[j * 4] = this.x.x; AP[j * 4 + 1] = this.x.y; AP[j * 4 + 2] = this.x.z; AP[j * 4 + 3] = tilt;
      AS[j * 4] = 2 * tw.w * 1.1 / 0.58; AS[j * 4 + 1] = (tw.p1 - tw.p0) / 0.86; AS[j * 4 + 2] = 0.35 * hump(T, TB, TB + 0.6); AS[j * 4 + 3] = 0;
    }
    this.aPos.needsUpdate = true; this.aSize.needsUpdate = true;

    // ---- the lines
    const cam = L.k.G.camera.position;
    // hooks: out from the frame's left edge, darting, then hanging and curling
    HOOKS.forEach((hk, i) => {
      const g = back ? 1 - ease.inOut(ramp(L.ret, 0.15 + i * 0.05, 0.75 + i * 0.05)) : ease.out(ramp(T, hk.td, hk.td + 0.32));
      if (g <= 0.01) return this.noLine(i);
      const whip = Math.exp(-Math.max(0, T - hk.td - 0.25) * 4) * Math.sin((T - hk.td) * 18) * (T > hk.td ? 1 : 0), tight = 0.5 * hump(T, TB, TB + 0.9);
      let u = -L.hw - L.fw * 0.65, h = hk.h, th = hk.th; const ds = hk.len * g / (NPT - 1);
      for (let j = 0; j < NPT; j++) {
        const s = j / (NPT - 1);
        this.P(u, h, 0.035 + 0.05 * s * g, this.x); this.path[j * 3] = this.x.x; this.path[j * 3 + 1] = this.x.y; this.path[j * 3 + 2] = this.x.z;
        const a = hk.th + hk.k1 * s * g + hk.k2 * Math.pow(s * g, 4) * (1 + 0.35 * whip + tight) + 0.07 * Math.sin(T * 1.3 + i + s * 3);
        th = a; u += Math.cos(th) * ds; h += Math.sin(th) * ds;
      }
      this.emit(i, 0.036, 1, cam);
    });
    // towers: two sides, an onion dome, a spire with a curl; sliding out from behind the right edge, then leaning
    TOWERS.forEach((tw, k) => {
      const e = this.towerK(L, k, T, back), base = NHOOK + k * 4;
      if (e <= 0.01) { for (let m = 0; m < 4; m++) this.noLine(base + m); return; }
      const tilt = tw.tilt * e, ub = tw.u - (1 - e) * (tw.u - 0.5), out = -0.025 + 0.075 * e, sway = 0.012 * Math.sin(T * 0.8 + k) * e + 0.02 * hump(T, TB, TB + 0.7);
      const tl = this.tl; tl.tilt = tilt; tl.sway = sway; tl.H = tw.H; tl.ub = ub; tl.out = out; const put = this.putT;
      const top = tw.H - 0.2;
      for (let side = 0; side < 2; side++) { const sg = side ? 1 : -1; for (let j = 0; j < NPT; j++) { const s = j / (NPT - 1); put(j, sg * tw.w * (1 - 0.18 * s) + 0.005 * Math.sin(s * 9 + k + side), s * top); } this.emit(base + side, 0.02, 4, cam); }
      for (let j = 0; j < NPT; j++) { const a = Math.PI * (1 - j / (NPT - 1)), bulge = 1.25 + 0.2 * Math.sin(a); put(j, Math.cos(a) * tw.w * 0.82 * bulge, top + Math.sin(a) * 0.17 * (1 + 0.15 * Math.cos(a * 2))); }
      this.emit(base + 2, 0.019, 2, cam);
      for (let j = 0; j < NPT; j++) { const s = j / (NPT - 1); put(j, s < 0.7 ? 0.006 * Math.sin(s * 8) : 0.035 * Math.sin((s - 0.7) / 0.3 * 3.6), top + 0.17 + (s < 0.7 ? s * 0.14 : 0.098 + 0.035 * (1 - Math.cos((s - 0.7) / 0.3 * 3.6)))); }
      this.emit(base + 3, 0.016, 1, cam);
    });
    // the cords: from the cannon's mouth along each note's flight, fading once it is in place
    const c0 = NHOOK + NTOW * 4;
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

  noLine(l) { this.lines.geometry.attributes.position.array.fill(0, l * NPT * 6, (l + 1) * NPT * 6); },
  // this.path as a ribbon of width W facing the camera; profile 1: a dart (thick start, fine end), 2: an even line
  // with soft ends, 3: a cord
  emit(l, W, prof, cam) {
    const A = this.lines.geometry.attributes.position.array, P = this.path;
    for (let j = 0; j < NPT; j++) {
      const a = Math.max(0, j - 1), b = Math.min(NPT - 1, j + 1), s = j / (NPT - 1);
      this.tan.set(P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]);
      this.cv.set(cam.x - P[j * 3], cam.y - P[j * 3 + 1], cam.z - P[j * 3 + 2]);
      this.side.crossVectors(this.tan, this.cv); const n = this.side.length() || 1;
      const w = W * (prof === 1 ? Math.min(1, s * 10 + 0.3) * (1 - 0.82 * s) : prof === 2 ? Math.min(1, s * 12 + 0.25, (1 - s) * 12 + 0.25) : prof === 4 ? (0.2 + 0.8 * s) * Math.min(1, (1 - s) * 12 + 0.3) : 0.6 + 0.4 * Math.min(1, s * 8)) * 0.5 / n;
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
    this.play(L, 'timp', f, at, 1.5, 0.085 * k);
    noise(v, at, { d: 0.55, vol: 0.05 * k, lp: 240, attack: 0.004 });
    noise(v, at, { d: 0.07, vol: 0.014 * k, hp: 1800, attack: 0.001 });
  },
});
