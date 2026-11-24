// Giovanni Battista Moroni, Gian Lodovico Madruzzo (1551–52), Gallery 206. The word: stay.
//
// A young churchman of Trent stands full length in black on a pavement of olive, terracotta and cream tiles, his gloves in
// one hand; with the other he points one finger down, and behind his robe his dog, white with brown ears, has stopped
// where the finger says and only looks out at us. That finger is the one thing happening in the picture, and it is what
// a painter asks of a sitter too. Look at it and his pavement comes out from under the picture across the gallery floor,
// tile by tile, and the dog walks out along it, nose down, tail going, as far as the tiles go. At the last tile it stops,
// looks at us, and lifts a forepaw out over the museum's floor; then it looks back, up at the hand in the picture, puts
// the paw down, turns about (its head first, its forehand walking round its quarters), trots to its place below that
// hand, turns to face us as it stands in the picture, and sits: haunches, then chest, its ears settling last. While you
// keep looking it stays: its tail sweeps the tiles now and then, it tilts its head, it glances up at the hand, and it
// does not get up. When you stop it gets up and goes back in under the picture, and the tiles go back after it.
//
// Under it, once each, a chord a second, the passamezzo antico: i, VII, i, V; III, VII, i and V, i, in G minor, the
// ground played all over Italy in his century (the order checked against the Wikipedia article "Passamezzo antico",
// which cites van der Merwe and Apel; the voicings are ours, and nothing here is quoted from a printed setting).
//
// The dog is one smooth body under a coat of soft dabs of paint, white broken with his warm greys, long on the ears, the
// breast, the backs of the legs and the tail; the tiles are flat, mottled, with his stippled joints. Every foot is put
// down where it will stand and stays there until it is lifted. Nothing climbs the wall. The man is not made and nothing
// of his is touched or played with: he was a real person and a cleric, so the show is only his dog and his floor, the toy
// cannot push either, and nothing lingers.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { score, hump, hz } from './stagecraft.js';

const TAU = Math.PI * 2;
const SC = 1.65;                                // the dog: about 0.64 m to the top of its head (it is the whole show)
const HOME = 0.38;                              // where it comes out from under the picture, along the wall: under the dog in it
const P = 0.42, NARROW = 0.145;                 // the pavement: one repeat, and its narrow band (a big olive square, a small
                                                // terracotta one, cream oblongs between), at the dog's scale
const PAVE = { u: 0.1, ru: 1.02, ro: 1.36, x0: 0.047, y0: -0.26 };      // its patch (middle along the wall, reach along and out); where the pattern sits
const OUT = 1.78, HALF = 1.3;                   // the floor the patch may cover
const LB = 0.13 * SC;                           // half its body: the hips to the middle of the back
const STRIDE = 0.36 * SC;                       // a trot: one full stride
const HAND = [0.3, -0.09];                      // the tip of the pointing finger, on the canvas (along, up from its middle)
// The times (show seconds).
const T_LAY = [0.05, 1.6], T_OUT = 0.85, T_EDGE = 3.3, T_PAW = [3.62, 3.94], T_PAWDOWN = [4.62, 4.95];
const T_T1 = [4.95, 5.62], T_B = [5.74, 6.52], T_T2 = [6.52, 7.08], T_SIT = [7.28, 7.6], T_IDLE = 7.98;
const TURN1 = 2.62, TURN2 = -1.98;              // the two turns (radians; left is positive): about, at the edge; and to face us, at its place
const PER = 6.4;                                // while it stays: its tail every PER seconds, the rest every two
// The way out, shoulders first: (along, out), from inside the wall to the last tile.
const WAY = [[HOME, -0.95], [HOME, -0.45], [HOME, 0.05], [0.34, 0.42], [0.17, 0.78], [0.0, 1.0], [-0.09, 1.2], [-0.13, 1.385]];
// The passamezzo antico, in G minor: one chord a second from T0, the seventh bar split, the last an open fifth (midi notes).
const T0 = 0.8;
const GROUND = [[0, [55, 62, 67, 70]], [1, [53, 60, 65, 69]], [2, [55, 62, 67, 70]], [3, [50, 57, 62, 66]], [4, [58, 65, 70, 74]], [5, [53, 60, 65, 69]], [6, [55, 62, 67, 70]], [6.5, [50, 57, 62, 66]], [7, [43, 55, 62, 67]]];
// The dog, in its own metres (from the hips; +z the way it faces, +x its left): where its legs join it, the lengths of
// them, and where each foot stands under it.
const JF = [0.046, -0.045, 0.245], JH = [0.045, -0.005, -0.01], NECK = [0, 0.02, 0.283], NL = 0.078, HS = 0.247, TAILB = [0, 0.04, -0.082];
const AF = 0.061, BF = 0.128, AH = 0.101, BH = 0.104, MT = 0.056, PAWH = 0.022;
const FOOT = [[0.05, 0.251], [-0.05, 0.251], [0.052, -0.05], [-0.052, -0.05]];      // (to its left, forward of the hips): fore left and right, hind left and right

const smooth = ease.smooth, wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const win = (t, a, b, e = 0.3) => smooth(ramp(t, a, a + e)) * (1 - smooth(ramp(t, b - e, b)));      // 1 between a and b, eased at both ends

lifeFor(4081, {
  title: /^Gian Lodovico Madruzzo/,
  word: 'stay',
  // (a tall work, hung low: the camera stands back and low, so the whole of it is in view with the pointing hand, and the
  // floor below it where the dog goes)
  stage: { out: 1.6, half: 1.2, cam: { dist: 3.5, height: 0.62, side: 0.2, fov: 58, lookU: 0.08, lookOut: 0.3, lookH: 1.22 } },
  wake: 2, ret: 2.6,

  build(L) {
    const col = (h, a = 0.06) => L.pal.near(h, a);
    // The night's finish brightens what glows by itself about 1.7 times (measured on the screen): the colour to hand it,
    // for an unlit thing to come out as `hex`. (What the room's lamps light comes out near enough as it is given.)
    const shown = hex => col(hex, 0.04).multiplyScalar(0.59);
    const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), M4 = () => new THREE.Matrix4();
    this.v = V3(); this.w = V3(); this.j = V3(); this.nb = V3(); this.p3 = V3();
    this.e = new THREE.Euler(); this.q = new THREE.Quaternion(); this.s3 = V3(); this.l = M4();
    this.M = { tmp: M4(), body: M4(), neck: M4(), head: M4(), ear: [M4(), M4()], lid: [M4(), M4()], tail: [M4(), M4()], up: [M4(), M4(), M4(), M4()], lo: [M4(), M4(), M4(), M4()], ft: [M4(), M4()], paw: [M4(), M4(), M4(), M4()] };
    this.ik = { p1: 0, roll: 0, p2: 0 }; this.pose = { hu: 0, ho: 0, a: 0 }; this.pose2 = { hu: 0, ho: 0, a: 0 }; this.cur = { g: null, x: 0 };
    this.F = [0, 1, 2, 3].map(() => ({ u: 0, o: 0, h: 0 })); this.up = [false, false, false, false];

    // ---------------------------------------------------------- his pavement
    // One sheet on the floor, the tiles worked out in its shader from where each point is: big olive squares, small
    // terracotta ones at their corners, cream oblongs between; each fired a little differently, mottled, with his fine
    // stippled joints. The patch is only as big as the dog's walk; its rim is whole tiles, some missing. It is laid tile
    // by tile, out from the foot of the wall (uLay), each tile growing to its size as it is set down.
    {
      const F = (u, o) => L.floor(u, o, V3()).toArray(), pos = [];
      const a = F(-HALF, -L.wall), b = F(HALF, -L.wall), c = F(HALF, OUT), d = F(-HALF, OUT);
      pos.push(...a, ...b, ...c, ...a, ...c, ...d);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const lin = h => { const k = shown(h); return new THREE.Vector3(k.r, k.g, k.b); };
      const u = this.u = { uLay: { value: 0 }, uSoft: { value: 0.1 }, uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) },
        uC: { value: new THREE.Vector4(PAVE.u, PAVE.ru, PAVE.ro, HOME) }, uG: { value: new THREE.Vector4(PAVE.x0, PAVE.y0, P, NARROW) },
        cOlive: { value: lin('#79755a') }, cTerra: { value: lin('#ba8670') }, cCreamA: { value: lin('#c9b49e') }, cCreamB: { value: lin('#b9a68e') }, cJoint: { value: lin('#8f8069') } };
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
      m.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, u);
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', `#include <common>
uniform float uLay, uSoft; uniform vec3 uO, cOlive, cTerra, cCreamA, cCreamB, cJoint; uniform vec4 uAx, uC, uG; vec3 fCol; float fA;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }`)
          .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz; float su = dot(lq, uAx.xy), so = dot(lq, uAx.zw);
  float PP = uG.z, NN = uG.w;
  vec2 g = vec2(su + uG.x, so - uG.y);
  vec2 cell = floor(g / PP), f = g - cell * PP;
  vec2 nar = step(f, vec2(NN));                                           // in the narrow band, along and out
  vec2 lo = mix(vec2(NN), vec2(0.0), nar), hi = mix(vec2(PP), vec2(NN), nar);
  vec2 hf = (hi - lo) * 0.5, tc = cell * PP + (lo + hi) * 0.5;            // this tile: its half size, its middle
  vec2 d = abs(g - tc), id = cell * 2.0 + (1.0 - nar);
  float h1 = h21(id), h2 = h21(id + 31.7), h3 = h21(id + 7.9);
  float both = nar.x * nar.y, none = (1.0 - nar.x) * (1.0 - nar.y);
  vec3 c = mix(mix(mix(cCreamA, cCreamB, step(0.45, h3)), cTerra, both), cOlive, none);
  c *= 0.92 + 0.16 * h1;                                                  // no two fired alike
  c *= 0.86 + 0.26 * vn(g * 70.0) * (0.55 + 0.45 * vn(g * 17.0));         // mottled, worn
  // where the pavement is: a rounded patch, its rim whole tiles, some missing
  vec2 tw = tc - vec2(uG.x, -uG.y);
  vec2 q = vec2((tw.x - uC.x) / uC.y, tw.y / uC.z);
  float e = pow(pow(abs(q.x), 4.0) + pow(abs(q.y), 4.0), 0.25) + (h2 - 0.5) * 0.3 * smoothstep(0.3, 0.75, abs(q.x));      // (whole along the front, where the dog stops)
  float there = step(e, 1.0) * step(-0.13, tw.y - hf.y);
  // laid one by one, out from where the dog comes in
  float key = length(vec2((tw.x - uC.w) * 0.75, tw.y)) / 1.72 * 0.84 + h1 * 0.16;
  float k = smoothstep(0.0, uSoft, uLay * (1.1 + uSoft) - key), grow = 0.6 + 0.4 * k;
  float edge = min(hf.x * grow - d.x, hf.y * grow - d.y);                 // metres in from this tile's edge
  float stip = 0.5 + 0.5 * sin((g.x - g.y) * 1100.0) * sin((g.x + g.y) * 1100.0);
  c = mix(cJoint * (0.82 + 0.3 * stip), c, smoothstep(0.0012, 0.0042, edge));
  fA = there * k * smoothstep(0.0, 0.0015, edge) * 0.97;
  fCol = c;
}`)
          .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
      };
      m.customProgramCacheKey = () => 'moroni-pavement';
      this.pave = new THREE.Mesh(g, m); this.pave.position.y = 0.016; this.pave.renderOrder = 5; L.add(this.pave);
    }

    // ---------------------------------------------------------- shapes: one smooth skin, shaded as he shades, under soft dabs
    const own = (g, c) => {
      g = g.index ? g.toNonIndexed() : g;
      for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n);
      const a = new Float32Array(g.attributes.position.count * 3), cc = new THREE.Color(c);
      for (let i = 0; i < a.length; i += 3) { a[i] = cc.r; a[i + 1] = cc.g; a[i + 2] = cc.b; }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
    };
    const ell = (C, R, c, detail = 2, rx = 0, ry = 0, rz = 0) => shape.move(shape.ball(1, c, detail), C[0], C[1], C[2], rx, ry, rz, R[0], R[1], R[2]);
    const limb = (a, b, r0, r1, c, seg = 10, rings = 2) => {
      const A = V3(...a), Bv = V3(...b), len = A.distanceTo(Bv), g = own(new THREE.CylinderGeometry(r1, r0, len, seg, rings, true), c);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), Bv.clone().sub(A).normalize()));
      const m = A.clone().add(Bv).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return g;
    };
    // A form lofted along z through stations [z, y (its middle), w (half width), hu, hd (half heights, up and down), e (2: round;
    // more: squarer)], smooth through them and closed to a point at each end: one skin, no seams (the body; the head).
    const cat = (a, b, c, d, t) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    const station = (st, f) => { const n = st.length, i = Math.max(0, Math.min(n - 2, Math.floor(f))), t = f - i; return [0, 1, 2, 3, 4, 5].map(k => cat(st[Math.max(i - 1, 0)][k], st[i][k], st[i + 1][k], st[Math.min(i + 2, n - 1)][k], t)); };
    const ring = (st, f, a, into) => { const [z, y, w, hu, hd, e] = station(st, f * (st.length - 1)), cs = Math.cos(a), sn = Math.sin(a), pw = 2 / Math.max(1.5, e); return into.set(Math.max(0, w) * Math.sign(cs) * Math.pow(Math.abs(cs), pw), y + Math.max(0, sn > 0 ? hu : hd) * Math.sign(sn) * Math.pow(Math.abs(sn), pw), z); };
    const loft = (st, c, rings = 30, seg = 22) => {
      const pos = [], idx = [], p = V3();
      for (let i = 0; i <= rings; i++) for (let j = 0; j < seg; j++) { ring(st, i / rings, (j / seg) * TAU, p); if (i === 0 || i === rings) { p.x = 0; p.y = station(st, (i / rings) * (st.length - 1))[1]; } pos.push(p.x, p.y, p.z); }
      for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) { const a = i * seg + j, b = i * seg + (j + 1) % seg, d = a + seg, f = b + seg; idx.push(a, b, d, b, f, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      return own(g, c);
    };
    // A point of such a skin, and the way it faces there (f along it, a round it).
    const skinAt = st => (f, a) => { const p = ring(st, f, a, V3()), d1 = ring(st, f + 0.012, a, V3()).sub(ring(st, f - 0.012, a, V3())), d2 = ring(st, f, a + 0.06, V3()).sub(ring(st, f, a - 0.06, V3())), n = d2.cross(d1).normalize(); if (n.x * p.x + n.y * (p.y - station(st, f * (st.length - 1))[1]) < 0) n.negate(); return { p, n }; };
    // Every vertex its colour, from where it is and which way it faces (a tone runs smoothly over a form).
    const vpaint = (g, fn) => { const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, v = V3(), nn = V3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); nn.fromBufferAttribute(n, i); const k = fn(v, nn); c.setXYZ(i, k.r, k.g, k.b); } c.needsUpdate = true; return g; };
    const KEY = V3(-0.32, 0.86, 0.4).normalize();          // his light: high, from the left
    // (the white of it is a warm grey white, as he painted it; the brown of its ears nearly black in their shadow)
    const Wh = { hi: col('#dbd7c2'), mid: col('#b6b29d'), lo: col('#8b8773'), deep: col('#6a6658') }, WARM = col('#a39a80');
    const Br = { hi: col('#7d5437'), mid: col('#573623'), lo: col('#37241a'), deep: col('#211610') };
    const ss = THREE.MathUtils.smoothstep;
    const toneOf = (T, key = KEY) => (n, j = 0, into = new THREE.Color()) => { const k = n.dot(key) + j; return k < -0.25 ? into.copy(T.deep).lerp(T.lo, ss(k, -0.9, -0.25)) : k < 0.3 ? into.copy(T.lo).lerp(T.mid, ss(k, -0.25, 0.3)) : into.copy(T.mid).lerp(T.hi, ss(k, 0.3, 0.95)); };
    const white = toneOf(Wh), brown = toneOf(Br);
    // (a part that is carried pitched has the light turned the other way in its own space: the neck, the thigh)
    const whiteAt = pitch => toneOf(Wh, KEY.clone().applyAxisAngle(V3(1, 0, 0), -pitch));
    const wf = (C, R, detail = 2, tone = white) => vpaint(ell(C, R, Wh.mid, detail), (v, n) => tone(n));
    const wl = (a, b, r0, r1, seg, rings, tone = white) => vpaint(limb(a, b, r0, r1, Wh.mid, seg, rings), (v, n) => tone(n));
    const lathe = (prof, tone = white) => vpaint(shape.lathe(prof, 10, Wh.mid), (v, n) => tone(n));
    // Dabs: soft lozenges of paint lying along the coat, each a little raised in the middle, its end lifted off the form
    // and a little lighter (the loaded brush). list: { p, n, dir, l, w, lift, lean, c, tip, tipTo }
    const dabs = list => {
      const pos = [], nor = [], cl = [], side = V3(), cen = V3(), heel = V3(), lf = V3(), rt = V3(), tp = V3(), lc = new THREE.Color(), tc = new THREE.Color();
      for (const s of list) {
        side.crossVectors(s.n, s.dir).normalize();
        cen.copy(s.p).addScaledVector(s.dir, s.l * 0.08).addScaledVector(s.n, 0.0024);
        heel.copy(s.p).addScaledVector(s.dir, -s.l * 0.42).addScaledVector(s.n, 0.0005);
        lf.copy(s.p).addScaledVector(s.dir, s.l * 0.05).addScaledVector(side, s.w / 2).addScaledVector(s.n, 0.001);
        rt.copy(s.p).addScaledVector(s.dir, s.l * 0.05).addScaledVector(side, -s.w / 2).addScaledVector(s.n, 0.001);
        tp.copy(s.p).addScaledVector(s.dir, s.l * 0.58).addScaledVector(side, (s.lean || 0) * s.l).addScaledVector(s.n, 0.0008 + s.lift * s.l);
        lc.copy(s.c).multiplyScalar(1.03); tc.copy(s.c).lerp(s.tipTo || Wh.hi, s.tip == null ? 0.2 : s.tip);
        for (const [q, k] of [[cen, lc], [heel, s.c], [rt, s.c], [cen, lc], [rt, s.c], [tp, tc], [cen, lc], [tp, tc], [lf, s.c], [cen, lc], [lf, s.c], [heel, s.c]]) { pos.push(q.x, q.y, q.z); nor.push(s.n.x, s.n.y, s.n.z); cl.push(k.r, k.g, k.b); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
      return g;
    };
    // One dab at p facing n, laid the way `flow` runs, in the coat's tone there (now and then one of his warm greys).
    const D = { flow: V3(0, -0.55, -1), tone: white, l: [0.02, 0.034], w: [0.011, 0.018], lift: [0.03, 0.12], lean: 0.1, jit: 0.14, warm: 0.3 };
    const dab = (p, n, o) => {
      const q1 = L.rand(), q2 = L.rand(), q3 = L.rand(), q4 = L.rand(), q5 = L.rand(), q6 = L.rand();
      const f = (typeof o.flow === 'function' ? o.flow(p, n) : o.flow).clone(); f.addScaledVector(n, -f.dot(n)); if (f.lengthSq() < 1e-6) return null; f.normalize();
      const kl = typeof o.l === 'function' ? o.l(p) : o.l, c = o.tone(n, (q5 - 0.5) * o.jit); if (q6 < o.warm) c.lerp(WARM, 0.45);
      return { p, n, dir: f, l: lerp(kl[0], kl[1], q1), w: lerp(o.w[0], o.w[1], q2), lift: lerp(o.lift[0], o.lift[1], q3), lean: (q4 - 0.5) * 2 * o.lean, c, tip: o.tip, tipTo: o.tipTo };
    };
    // A coat of them: over a lofted skin (between f[0] and f[1] along it), an ellipsoid, or down a limb; keep() leaves some out.
    const coatSkin = (at, n, o = {}) => { o = { ...D, f: [0.03, 0.97], ...o }; const list = []; for (let i = 0; i < n; i++) { const f = lerp(o.f[0], o.f[1], L.rand()), s = at(f, L.rand() * TAU); if (o.keep && !o.keep(s.p, s.n, f)) { L.rand(); continue; } const d = dab(s.p, s.n, o); if (d) list.push(d); } return list; };
    const coat = (C, R, n, o = {}) => {
      o = { ...D, ...o }; const list = [];
      for (let i = 0; i < n; i++) {
        const y = 1 - 2 * L.rand(), ph = L.rand() * TAU, s = Math.sqrt(Math.max(0, 1 - y * y)), p = V3(C[0] + R[0] * s * Math.cos(ph), C[1] + R[1] * y, C[2] + R[2] * s * Math.sin(ph));
        const nn = V3((p.x - C[0]) / (R[0] * R[0]), (p.y - C[1]) / (R[1] * R[1]), (p.z - C[2]) / (R[2] * R[2])).normalize();
        if (o.keep && !o.keep(p, nn)) continue; const d = dab(p, nn, o); if (d) list.push(d);
      }
      return list;
    };
    const fringe = (a, b, ra, rb, n, o = {}) => {
      o = { ...D, flow: V3(0, -1, -0.5), ...o };
      const A = V3(...a), Bv = V3(...b), ax = Bv.clone().sub(A), len = ax.length(); ax.normalize();
      const e1 = V3().crossVectors(ax, Math.abs(ax.z) < 0.9 ? V3(0, 0, 1) : V3(1, 0, 0)).normalize(), e2 = V3().crossVectors(ax, e1), list = [];
      for (let i = 0; i < n; i++) {
        const t = L.rand(), ph = L.rand() * TAU, nn = e1.clone().multiplyScalar(Math.cos(ph)).addScaledVector(e2, Math.sin(ph));
        if (o.keep && !o.keep(t, nn)) continue;
        const d = dab(A.clone().addScaledVector(ax, t * len).addScaledVector(nn, lerp(ra, rb, t)), nn, typeof o.lt === 'function' ? { ...o, l: o.lt(t) } : o); if (d) list.push(d);
      }
      return list;
    };

    // ---------------------------------------------------------- the dog
    // Its own metres; +z is the way it faces, +x its left. Each part hangs from its own joint.
    const rig = this.rig = L.rig(24, 66000, L.paint({ glow: 0.42, rough: 0.92, side: THREE.DoubleSide }));
    {
      // the body, from the hips: one skin from the rump to the breast. The quarters broad, the loin narrow and tucked up,
      // the chest deep between the elbows; the coat over it running back and down, long and wavy on the breast and under it
      const BODY = [[-0.098, 0.004, 0, 0, 0, 2], [-0.085, 0.004, 0.028, 0.028, 0.034, 2], [-0.05, 0.002, 0.05, 0.05, 0.058, 2], [-0.01, 0, 0.06, 0.058, 0.066, 2.1], [0.045, 0.004, 0.054, 0.057, 0.056, 2.1], [0.1, 0.004, 0.057, 0.058, 0.064, 2.1],
        [0.16, 0.002, 0.063, 0.058, 0.084, 2.1], [0.215, 0, 0.068, 0.058, 0.102, 2.1], [0.262, 0, 0.065, 0.057, 0.099, 2.1], [0.298, 0.006, 0.05, 0.049, 0.076, 2.1], [0.32, 0.012, 0, 0, 0, 2]];
      const at = skinAt(BODY), ws = coatSkin(at, 760, { l: [0.024, 0.04], w: [0.012, 0.019], lift: [0.05, 0.17] });
      ws.push(...coatSkin(at, 300, { f: [0.76, 0.985], keep: (p, n) => n.z > 0.1 || n.y < -0.4, flow: V3(0, -1, 0.05), l: [0.038, 0.064], w: [0.01, 0.016], lift: [0.06, 0.24], lean: 0.36, tip: 0.4, warm: 0.15 }));
      ws.push(...coatSkin(at, 170, { f: [0.25, 0.82], keep: (p, n) => n.y < -0.66, flow: V3(0, -1, -0.3), l: [0.03, 0.05], w: [0.009, 0.014], lift: [0.25, 0.6], lean: 0.28, tip: 0.3 }));
      this.gBody = rig.geo(shape.merge([vpaint(loft(BODY, Wh.mid, 30, 22), (v, n) => white(n)), dabs(ws)]));
    }
    {
      // the neck, from its base along +z to the head: short, thick where it leaves the shoulders, the coat running down it
      const wn = whiteAt(-0.65);
      const ws = fringe([0, 0, 0.005], [0, 0, NL], 0.053, 0.041, 180, { flow: V3(0, -0.45, -1), tone: wn, l: [0.022, 0.036], w: [0.011, 0.017], lift: [0.05, 0.16] });
      ws.push(...fringe([0, 0, 0.0], [0, 0, NL * 0.85], 0.054, 0.043, 80, { keep: (t, n) => n.y < -0.3, flow: V3(0, -0.5, -1), tone: wn, l: [0.024, 0.04], w: [0.009, 0.014], lift: [0.05, 0.2], lean: 0.3, tip: 0.35, warm: 0.1 }));
      this.gNeck = rig.geo(shape.merge([wl([0, 0, 0], [0, 0, NL + 0.003], 0.054, 0.04, 10, 2, wn), wf([0, -0.006, 0.002], [0.054, 0.052, 0.05], 2, wn), wf([0, 0.002, NL], [0.04, 0.04, 0.03], 2, wn), dabs(ws)]));
    }
    {
      // the head, from where it joins the neck: one skin, a broad white dome, the brown round each eye running back to the
      // ear, a long soft muzzle deeper than it is wide, a liver nose; amber eyes under heavy lids
      const HEAD = [[-0.027, 0.012, 0, 0, 0, 2], [-0.02, 0.012, 0.027, 0.022, 0.022, 2], [0.0, 0.013, 0.042, 0.036, 0.034, 2], [0.022, 0.013, 0.047, 0.04, 0.04, 2], [0.044, 0.011, 0.0435, 0.0365, 0.041, 2.1],
        [0.06, 0.008, 0.0365, 0.029, 0.04, 2.2], [0.074, 0.003, 0.0255, 0.0175, 0.036, 2.4], [0.09, 0.0, 0.0195, 0.0132, 0.0315, 2.7], [0.11, -0.001, 0.0185, 0.0122, 0.029, 2.8], [0.128, -0.002, 0.0172, 0.0115, 0.0255, 2.7], [0.139, -0.003, 0.0135, 0.009, 0.019, 2.3], [0.1445, -0.004, 0, 0, 0, 2]];
      // (where the skin of it is, over a point: for setting the eyes into the face)
      const zAt = z => { let lo = 0, hi = HEAD.length - 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (station(HEAD, m)[0] < z) lo = m; else hi = m; } return station(HEAD, lo); };
      const topY = (x, z) => { const [, y, w, hu, , e] = zAt(z), k = Math.abs(x) / w; return k >= 1 ? -1 : y + hu * Math.pow(1 - Math.pow(k, e), 1 / e); };
      const EX = 0.0248, EY = 0.0175; let EZ = 0.06; for (let i = 0, lo = 0.05, hi = 0.085; i < 30; i++) { EZ = (lo + hi) / 2; if (topY(EX, EZ) > EY) lo = EZ; else hi = EZ; }
      const EYE = s => V3(s * EX, EY, EZ - 0.0012), EARB = s => V3(s * 0.045, 0.012, 0.006);
      const seg = new THREE.Line3(), near = V3();
      const patch = v => {          // how brown it is here (0 white .. 1 brown)
        const s = v.x < 0 ? -1 : 1; seg.set(EYE(s), EARB(s)); seg.closestPointToPoint(v, true, near);
        const t = near.distanceTo(seg.start) / seg.distance(), r = lerp(0.0135, 0.03, t), dd = v.distanceTo(near);
        return (1 - ss(dd, r * 0.84, r * 1.1)) * ss(Math.abs(v.x), 0.0095, 0.0135) * (1 - ss(v.z, EZ + 0.008, EZ + 0.02)) * (1 - ss(v.y, 0.034, 0.045));
      };
      const mix = new THREE.Color(), dk = new THREE.Color();
      // (the skin of the head: white, the brown, and the line where the lips close)
      const parts = [vpaint(loft(HEAD, Wh.mid, 38, 28), (v, n) => {
        const c = white(n, 0.08).lerp(brown(n, 0.15, mix), patch(v));
        const lipY = -0.0165 - 0.004 * ss(v.z, 0.08, 0.135), lip = (1 - ss(Math.abs(v.y - lipY), 0.0008, 0.003)) * ss(v.z, 0.078, 0.09) * ss(Math.abs(v.x), 0.006, 0.012);
        return c.lerp(dk.copy(Wh.deep).multiplyScalar(0.7), 0.6 * lip);
      })];
      // the nose: liver brown, a little light on top, darker in the nostrils
      const nose = col('#5c4236'), noseD = col('#2a1b16'), noseL = col('#7c6054');
      parts.push(vpaint(ell([0, -0.001, 0.1385], [0.0112, 0.0092, 0.0078], nose, 2), (v, n) => (n.y > 0.55 ? noseL : nose)));
      for (const s of [1, -1]) parts.push(ell([s * 0.0048, -0.003, 0.1452], [0.0027, 0.0025, 0.0018], noseD, 0));
      // the eyes, set into the face the way it faces there: dark-rimmed, amber brown, a small point of light, the outer
      // corners a little lower (its look in the picture)
      const EN = V3(-(topY(EX + 0.002, EZ) - topY(EX - 0.002, EZ)) / 0.004, 1, -(topY(EX, EZ + 0.002) - topY(EX, EZ - 0.002)) / 0.004).normalize();
      const eyaw = Math.atan2(EN.x, EN.z) * 0.8, epitch = -Math.asin(EN.y) * 0.75;
      for (const s of [1, -1]) {
        const E = EYE(s), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(epitch, s * eyaw, -s * 0.16, 'YXZ'));
        const put = (x, y, z, R, c, d) => { const g = ell([x, y, z], R, c, d); g.applyQuaternion(q); g.translate(E.x, E.y, E.z); return g; };
        parts.push(put(0, 0, 0, [0.0086, 0.0064, 0.003], Br.deep, 2));
        parts.push(put(s * 0.0003, -0.0007, 0.0014, [0.0062, 0.0059, 0.003], col('#76501f'), 2));
        parts.push(put(s * 0.0003, -0.0005, 0.003, [0.0033, 0.0033, 0.0018], col('#0e0906'), 1));
        parts.push(put(s * 0.0003 - 0.0017, 0.0013, 0.0041, [0.0009, 0.0009, 0.0005], col('#d8d1bf'), 0));
      }
      this.eye = [EX, EY, EZ]; this.eyeTurn = [eyaw, epitch];
      // a short coat back over the skull
      const cap = coatSkin(skinAt(HEAD), 150, { f: [0.06, 0.46], keep: (p, n) => n.y > -0.5, flow: V3(0, -0.3, -1), l: [0.012, 0.02], w: [0.008, 0.012], lift: [0.01, 0.05], tip: 0.06, warm: 0 });
      for (const q of cap) q.c = white(q.n, 0.08).lerp(brown(q.n, 0.15, mix), patch(q.p));
      parts.push(dabs(cap));
      this.gHead = rig.geo(shape.merge(parts));
      // a lid: a brown shell over the top of the eye that turns about the line of its corners, as a lid does, so its edge
      // is always an arch (from the middle of the eyeball)
      {
        const pos = [], nor = [], cl = [], NA = 8, NT = 5, A = 0.0096, R = 0.0069, c = new THREE.Color(), n = V3();
        const at = (i, j) => { const ph = (-80 + 160 * i / NA) * Math.PI / 180, th = (-28 + 90 * j / NT) * Math.PI / 180; n.set(Math.sin(ph), Math.cos(ph) * Math.cos(th), Math.cos(ph) * Math.sin(th)); brown(n, 0.25, c); if (j === NT) c.lerp(Br.deep, 0.6); pos.push(A * n.x, R * n.y, R * n.z); nor.push(n.x, n.y, n.z); cl.push(c.r, c.g, c.b); };
        for (let i = 0; i < NA; i++) for (let j = 0; j < NT; j++) { at(i, j); at(i + 1, j); at(i + 1, j + 1); at(i, j); at(i + 1, j + 1); at(i, j + 1); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
        this.gLid = rig.geo(g);
      }
      // the ears, each from where it hangs: long brown leathers lying against the cheek, the hair on them wavy and long
      // at the ends; the lower half of its left one is white, as in the picture
      const ear = s => {
        const LEA = [[s * 0.004, -0.05, -0.002], [0.0085, 0.054, 0.03]], bt = (n, j) => brown(n, j + 0.1);
        const pale = v => (s > 0 ? ss(-v.y, 0.052, 0.08) * (0.7 + 0.3 * Math.sin(v.z * 300)) : 0);
        const ws = coat(...LEA, 100, { keep: (q, n) => n.x * s > -0.3, flow: V3(0, -1, -0.1), l: [0.02, 0.034], w: [0.009, 0.014], lift: [0.02, 0.1], lean: 0.25, tone: bt, tip: 0.25, tipTo: Br.hi, warm: 0 });
        if (s > 0) for (const q of ws) if (q.p.y < -0.064) { q.c = white(q.n, -0.1); q.tipTo = Wh.hi; }
        // (the feathering at the end hangs below the leather)
        ws.push(...coat([LEA[0][0], -0.09, -0.002], [0.0075, 0.02, 0.026], 46, { keep: (q, n) => n.y < 0.5, flow: V3(0, -1, -0.08), l: [0.024, 0.04], w: [0.008, 0.012], lift: [0.0, 0.06], lean: 0.3, tone: s > 0 ? (n, j) => white(n, j - 0.1) : (n, j) => brown(n, j + 0.2), tip: s > 0 ? 0.3 : 0.25, tipTo: s > 0 ? Wh.hi : Br.hi, warm: 0 }));
        return shape.merge([vpaint(ell(...LEA, Br.mid, 2), (v, n) => brown(n, 0.05).lerp(white(n, 0, mix), pale(v))), vpaint(ell([s * 0.001, -0.006, 0.0], [0.0125, 0.013, 0.024], Br.mid, 1), (v, n) => brown(n, 0.1)), dabs(ws)]);
      };
      this.gEar = [rig.geo(ear(1)), rig.geo(ear(-1))];
    }
    {
      // the tail, in two lengths, each from its own joint back along -z: a soft plume hanging under it
      const plume = (len, ra, rb, lt) => dabs([...fringe([0, 0, 0], [0, 0, -len], ra, rb, 110, { flow: V3(0, -1, -0.7), lt, w: [0.009, 0.014], lift: [0.0, 0.05], keep: (t, n) => n.y < 0.1, lean: 0.18, tip: 0.3, warm: 0.15 }), ...fringe([0, 0, 0], [0, 0, -len], ra, rb, 24, { flow: V3(0, -0.3, -1), keep: (t, n) => n.y >= 0.1, l: [0.016, 0.026], w: [0.008, 0.012] })]);
      this.gTail = [
        rig.geo(shape.merge([wl([0, 0, 0.012], [0, 0, -0.098], 0.015, 0.0105, 8, 2), plume(0.098, 0.015, 0.0105, t => [0.028 + 0.02 * t, 0.042 + 0.028 * t])])),
        rig.geo(shape.merge([wl([0, 0, 0.004], [0, 0, -0.1], 0.0105, 0.004, 8, 2), wf([0, 0, -0.1], [0.004, 0.004, 0.006], 1), plume(0.1, 0.0105, 0.0045, t => [0.048 - 0.028 * t, 0.068 - 0.042 * t])])),
      ];
    }
    this.len = { AF: AF * SC, BF: BF * SC, AH: AH * SC, BH: BH * SC, MT: MT * SC, PAWH: PAWH * SC };
    {
      // the legs, each length from its own joint down -y, slim. Fore: the arm, lying in the coat of the chest down to the
      // elbow; the long straight forearm, feathered behind. Hind: a flat broad thigh against the flank, the second
      // thigh down to the point of the hock, the pastern.
      const back = (t, n) => n.z < -0.2, feather = { keep: back, flow: V3(0, -1, -0.5), l: [0.028, 0.046], w: [0.008, 0.012], lift: [0.12, 0.38], tip: 0.3, warm: 0.1 };
      this.gArm = rig.geo(shape.merge([wl([0, 0.004, 0], [0, -AF, 0], 0.025, 0.02, 8, 1), wf([0, -AF, 0], [0.02, 0.02, 0.02], 1)]));
      this.gFore2 = rig.geo(shape.merge([lathe([[0.0128, -BF], [0.0124, -BF * 0.88], [0.0136, -BF * 0.67], [0.0166, -BF * 0.35], [0.0196, -BF * 0.1], [0.02, 0.002]]), wf([0, -BF, 0], [0.0128, 0.0128, 0.0128], 1),
        dabs([...fringe([0, -0.004, 0], [0, -BF * 0.9, 0], 0.0196, 0.0128, 72, feather), ...fringe([0, 0, 0], [0, -BF, 0], 0.0196, 0.0128, 30, { keep: (t, n) => n.z > 0, flow: V3(0, -1, 0), l: [0.016, 0.026], w: [0.008, 0.012], lift: [0.01, 0.05] })])]));
      const HAUNCH = [[0.002, -0.042, 0.0], [0.023, 0.066, 0.05]], wt = whiteAt(-0.4);
      this.gThigh = [1, -1].map(s => rig.geo(shape.merge([wf([s * HAUNCH[0][0], HAUNCH[0][1], HAUNCH[0][2]], HAUNCH[1], 3, wt), wl([0, -0.045, 0], [0, -AH - 0.002, 0], 0.026, 0.019, 8, 1, wt), wf([0, -AH, 0], [0.019, 0.021, 0.019], 1, wt),
        dabs([...coat([s * HAUNCH[0][0], HAUNCH[0][1], HAUNCH[0][2]], HAUNCH[1], 90, { keep: (p, n) => n.x * s > -0.2, flow: V3(0, -1, -0.45), tone: wt }), ...coat([s * HAUNCH[0][0], HAUNCH[0][1], HAUNCH[0][2]], HAUNCH[1], 70, { keep: (p, n) => n.z < -0.4, flow: V3(0, -1, -0.7), l: [0.034, 0.054], w: [0.009, 0.014], lift: [0.12, 0.38], lean: 0.25, tip: 0.3, tone: wt, warm: 0.1 })])])));
      this.gShank = rig.geo(shape.merge([lathe([[0.012, -BH], [0.012, -BH * 0.83], [0.0142, -BH * 0.52], [0.0185, -BH * 0.2], [0.0192, 0.002]]), wf([0, -BH, 0.001], [0.0126, 0.0138, 0.0142], 1),
        dabs([...fringe([0, 0, 0], [0, -BH * 0.8, 0], 0.019, 0.013, 54, { ...feather, l: [0.024, 0.04] }), ...fringe([0, 0, 0], [0, -BH, 0], 0.019, 0.012, 24, { keep: (t, n) => n.z > 0, flow: V3(0, -1, 0), l: [0.016, 0.026], w: [0.008, 0.012], lift: [0.01, 0.05] })])]));
      this.gFoot = rig.geo(shape.merge([wl([0, 0, 0], [0, -MT, 0], 0.0118, 0.011, 8, 1), wf([0, -MT, 0], [0.0114, 0.0114, 0.0114], 1)]));
      // a paw, from its joint (PAWH above the ground): broad, as he painted it, the four toes told apart
      const paw = [wl([0, 0.004, 0], [0, -0.011, 0.006], 0.0124, 0.0148, 8, 1), wf([0, -0.012, 0.0125], [0.0192, 0.0104, 0.0255], 2)];
      for (const [x, z] of [[-0.0138, 0.0305], [-0.0047, 0.0358], [0.0047, 0.0358], [0.0138, 0.0305]]) paw.push(vpaint(ell([x, -0.014, z], [0.0054, 0.0082, 0.0098], Wh.mid, 1), (v, n) => white(n, 0.12)));
      this.gPaw = rig.geo(shape.merge(paw));
    }
    const add = g => { const i = rig.add(g); rig.show(i, false); return i; };
    this.I = { body: add(this.gBody), neck: add(this.gNeck), head: add(this.gHead), ear: [add(this.gEar[0]), add(this.gEar[1])], lid: [add(this.gLid), add(this.gLid)], tail: [add(this.gTail[0]), add(this.gTail[1])],
      up: [add(this.gArm), add(this.gArm), add(this.gThigh[0]), add(this.gThigh[1])], lo: [add(this.gFore2), add(this.gFore2), add(this.gShank), add(this.gShank)], ft: [add(this.gFoot), add(this.gFoot)], paw: [0, 1, 2, 3].map(() => add(this.gPaw)) };
    this.all = Object.values(this.I).flat();
    this.blobs = L.blobs(3, { y: L.y + 0.02, fade: true }); this.blobs.renderOrder = 6;

    // ---------------------------------------------------------- its ways
    // A stretch of its way is a path (its shoulders along a curve, its hips following) or a turn (about a point between
    // its hips and the middle of its back: the forehand walks round, the quarters step round under it). Each has a whole
    // number of half strides, so every foot is on the floor at both ends.
    const C3 = pts => { const c = new THREE.CatmullRomCurve3(pts.map(([u, o]) => V3(u, 0, o)), false, 'centripetal'); c.arcLengthDivisions = 300; c.updateArcLengths(); return c; };
    const pathSeg = pts => { const c = C3(pts), len = c.getLength(), xa = 2 * LB, n = Math.max(1, Math.round(2 * (len - xa) / STRIDE)) / 2; return { kind: 'path', c, len, xa, xb: len, XS: (len - xa) / n }; };
    const turnSeg = (q, th) => { const n = Math.max(1, Math.round(2 * Math.abs(th) / 1.35)) / 2; return { kind: 'turn', pu: q.hu + Math.sin(q.a) * 0.5 * LB, po: q.ho + Math.cos(q.a) * 0.5 * LB, a0: q.a, th, xa: 0, xb: 1, XS: 1 / n }; };
    this.mk = { pathSeg, turnSeg };
    const q = { hu: 0, ho: 0, a: 0 };
    this.SA = pathSeg(WAY); this.segAt(this.SA, this.SA.xb, q);
    this.T1 = turnSeg(q, TURN1); this.segAt(this.T1, 1, q);
    {
      // (from where it stands after turning about, straight to its place: its shoulders to 0.32 m from the wall)
      const du = Math.sin(q.a), dout = Math.cos(q.a), sh = [q.hu + du * 2 * LB, q.ho + dout * 2 * LB], d = (sh[1] - 0.32) / -dout;
      this.SB = pathSeg([[q.hu, q.ho], sh, [sh[0] + du * d * 0.5 + 0.015, sh[1] + dout * d * 0.5], [sh[0] + du * d, sh[1] + dout * d]]);
    }
    this.segAt(this.SB, this.SB.xb, q); this.T2 = turnSeg(q, TURN2);

    // ---------------------------------------------------------- the sounds that keep the show's clock
    this.band = calm => {
      const s = score(L);
      // the tiles going down: a run of small clicks
      for (let i = 0; i < 13; i++) { const t = 0.12 + 1.4 * Math.pow(i / 12, 0.85); s.hit(t, { d: 0.035, vol: 0.006 + 0.004 * (i % 3 === 0), bp: 2300 + 500 * ((i * 7) % 5) / 4, q: 4 }); s.note(t, 1500 + 260 * ((i * 5) % 4), 0.05, { vol: 0.0028, type: 'sine', attack: 0.002 }); }
      // the ground, plucked: each chord spread from the bass up
      for (const [bar, ch] of GROUND) ch.forEach((m, i) => s.note(T0 + bar + i * 0.035, hz(m), 1.5 - i * 0.12, { vol: (i ? 0.011 : 0.014) * (bar === 7 ? 1.15 : 1), type: 'triangle', attack: 0.004, over: 2, overVol: 0.22 }));
      // nosing along the tiles
      for (const t of [2.0, 2.42, 2.86]) for (const k of [0, 0.11]) s.hit(t + k, { d: 0.075, vol: 0.007, hp: 1700, attack: 0.02 });
      // it sits: the breath out, and afterwards its tail on the tiles
      s.hit(T_SIT[1] + 0.2, { d: 0.3, vol: 0.011, lp: 800, attack: 0.06 });
      const rate = calm ? 0.75 : 1.5, thumps = [];
      for (let n = 0; ; n++) { const tt = 0.1 + (2 * n + 1) / (4 * rate); if (tt > 1.45) break; thumps.push({ t: tt, noise: true, d: 0.07, vol: 0.012, lp: 260, attack: 0.004 }, { t: tt, f: 92, d: 0.09, vol: 0.012, type: 'sine', attack: 0.004, to: 60 }); }
      s.loop(T_IDLE, PER, thumps);
      return s.done();
    };
    this.score = this.band(false); this.calmBand = false;
    this.fa = { u: 0, o: 0 };
  },

  // Where it stands at x along a stretch of its way: its hips (hu, ho: along, out) and the way it faces (a).
  segAt(g, x, q) {
    if (g.kind === 'path') {
      const p = this.p3; g.c.getPointAt(clamp01(x / g.len), p); const su = p.x, so = p.z; g.c.getPointAt(clamp01((x - 2 * LB) / g.len), p);
      q.a = Math.atan2(su - p.x, so - p.z); q.hu = su - Math.sin(q.a) * 2 * LB; q.ho = so - Math.cos(q.a) * 2 * LB;
    } else { q.a = g.a0 + g.th * x; q.hu = g.pu - Math.sin(q.a) * 0.5 * LB; q.ho = g.po - Math.cos(q.a) * 0.5 * LB; }
    return q;
  },
  // Foot k's place on the floor for its m-th step of a stretch: under its own joint as the dog stands half way through
  // that step (so it is neither ahead nor behind for more than a quarter of a stride), and at either end of the stretch
  // where it stands there.
  plant(g, k, m, o) {
    const off = k === 1 || k === 2 ? 0.5 : 0, q = this.segAt(g, Math.max(g.xa, Math.min(g.xb, g.xa + (m - off) * g.XS)), this.pose2), s = Math.sin(q.a), c = Math.cos(q.a), [lx, fz] = FOOT[k];
    o.u = q.hu + (s * fz + c * lx) * SC; o.o = q.ho + (c * fz - s * lx) * SC; return o;
  },
  // Foot k at x: down, where it was planted, for half of each stride (the diagonal pairs by turns: a trot); then lifted
  // (o.h, 0..1) and carried to where it is planted next. It never moves while it is down.
  footAt(g, x, k, o) {
    const off = k === 1 || k === 2 ? 0.5 : 0, u = (x - g.xa) / g.XS + 0.25 + off, n = Math.floor(u + 1e-9);
    if (u - n < 0.5) { o.h = 0; return this.plant(g, k, n, o); }
    const xs = Math.max(g.xa, g.xa + (n + 0.25 - off) * g.XS), xe = Math.min(g.xb, g.xa + (n + 0.75 - off) * g.XS), w = xe > xs + 1e-6 ? clamp01((x - xs) / (xe - xs)) : 1, e = smooth(w), a = this.plant(g, k, n, this.fa);
    const au = a.u, ao = a.o; this.plant(g, k, n + 1, o); o.u = lerp(au, o.u, e); o.o = lerp(ao, o.o, e); o.h = Math.sin(Math.PI * w); return o;
  },
  // Which stretch it is on at show-time t, and how far along it.
  where(t) {
    const c = this.cur;
    if (t < T_EDGE) { c.g = this.SA; c.x = c.g.xa + (c.g.xb - c.g.xa) * (1 - Math.pow(1 - clamp01((t - T_OUT) / (T_EDGE - T_OUT)), 1.5)); }
    else if (t < T_T1[1]) { c.g = this.T1; c.x = ease.inOut(ramp(t, T_T1[0], T_T1[1])); }
    else if (t < T_B[1]) { c.g = this.SB; c.x = c.g.xa + (c.g.xb - c.g.xa) * smooth(ramp(t, T_B[0], T_B[1])); }
    else { c.g = this.T2; c.x = ease.inOut(ramp(t, T_T2[0], T_T2[1])); }
    return c;
  },

  hideAll() { for (const i of this.all) this.rig.show(i, false); this.blobs.count = 0; },
  start(L) {
    this.hideAll(); this.lastT = -1; this.up.fill(false);
    if (this.calmBand !== L.calm) { this.score = this.band(L.calm); this.calmBand = L.calm; }
    this.score.from(0);
    this.u.uSoft.value = L.calm ? 0.3 : 0.1;
    if (!this.told && !L.quiet) { this.told = true; L.k.say('His pavement comes out, and his dog, as far as the tiles go.', 4); }
  },
  back(L) {
    // where it is now, and its way home: it turns to face the foot of the wall under the picture, then trots straight in
    // (still coming out of the wall, it backs in the way it came)
    const t = this.lastShow || 0, R = this.R = { t, show: t >= T_OUT, sit: 0, lay: this.u.uLay.value, rev: t < 1.9, x0: 0 };
    if (!R.show) return;
    const c = this.where(t); if (R.rev) { R.x0 = c.x; return; }
    const q = this.segAt(c.g, c.x, { hu: 0, ho: 0, a: 0 });
    R.sit = ease.inOut(ramp(t, T_SIT[0], T_SIT[1]));
    const pu = q.hu + Math.sin(q.a) * 0.5 * LB, po = q.ho + Math.cos(q.a) * 0.5 * LB, th = wrap(Math.atan2(HOME - pu, Math.min(0.05, po - 0.35) - po) - q.a);
    R.T = this.mk.turnSeg(q, th); R.tEnd = 0.1 + 0.26 * Math.min(1, Math.abs(th) / 1.6);
    this.segAt(R.T, 1, q);
    const du = Math.sin(q.a), dout = Math.cos(q.a), sh = [q.hu + du * 2 * LB, q.ho + dout * 2 * LB], pts = [[q.hu, q.ho], sh];
    if (sh[1] > 0.25) pts.push([HOME + (sh[0] - HOME) * 0.15, Math.min(0.08, sh[1] - 0.15)]);
    pts.push([HOME, Math.min(-0.5, pts[pts.length - 1][1] - 0.35)], [HOME, -1.5]);
    R.W = this.mk.pathSeg(pts);
  },
  end(L) { this.hideAll(); this.u.uLay.value = 0; this.pave.visible = false; },
  reset(L) { this.end(L); this.told = false; },

  // out = T(x, y, z) · R(yaw, then roll, then pitch in the bone's own plane) · the dog's size
  world(out, x, y, z, yaw, pitch = 0, roll = 0) { this.e.set(pitch, yaw, roll, 'YZX'); return out.compose(this.v.set(x, y, z), this.q.setFromEuler(this.e), this.s3.set(SC, SC, SC)); },
  // out = parent · T · R (yaw, pitch, roll)
  child(out, parent, x, y, z, yaw = 0, pitch = 0, roll = 0) { this.e.set(pitch, yaw, roll, 'YXZ'); this.l.compose(this.v.set(x, y, z), this.q.setFromEuler(this.e), this.s3.set(1, 1, 1)); return out.multiplyMatrices(parent, this.l); },
  // Two lengths a, b from joint J to target W, in the plane through them that holds the way it faces (yaw); the middle
  // joint bends forward (sign 1: a stifle) or back (-1: an elbow). Fills ik: the upper length's pitch and roll, the lower's pitch on it.
  solve(J, W, yaw, a, b, sign) {
    const dx = W.x - J.x, dy = W.y - J.y, dz = W.z - J.z, sn = Math.sin(yaw), cs = Math.cos(yaw);
    const fz = dx * sn + dz * cs, lx = dx * cs - dz * sn, D = Math.hypot(lx, dy);
    const c = Math.max(Math.abs(a - b) + 1e-4, Math.min(a + b - 1e-4, Math.hypot(fz, D))), tt = Math.atan2(fz, D);
    const al = Math.acos(Math.max(-1, Math.min(1, (a * a + c * c - b * b) / (2 * a * c)))), t1 = tt + sign * al;
    const t2 = Math.atan2(c * Math.sin(tt) - a * Math.sin(t1), c * Math.cos(tt) - a * Math.cos(t1));
    const ik = this.ik; ik.p1 = -t1; ik.roll = Math.atan2(lx, -dy); ik.p2 = -(t2 - t1); return ik;
  },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', ret = ph === 'return', calm = L.calm;
    const t = showing ? L.t : this.lastShow || 0;
    if (showing) this.lastShow = L.t;
    const rig = this.rig, M = this.M, I = this.I, R = this.R, r = ret ? L.ret : 0, c = this.cur, q = this.pose, F = this.F, len = this.len;

    // ---- the pavement
    const lay = showing ? ramp(t, T_LAY[0], T_LAY[1]) : ret && R ? R.lay * (1 - ease.inOut(ramp(r, 0.56, 1))) : 0;
    this.u.uLay.value = lay; this.pave.visible = lay > 0.002;

    // ---- where the dog is on its way
    let vis = false, sit = 0;
    if (ret && R) {
      if (R.show) {
        vis = true;
        if (R.rev) { c.g = this.SA; c.x = lerp(R.x0, c.g.xa, ease.inOut(ramp(r, 0, 0.8))); }
        else if (r < R.tEnd) { c.g = R.T; c.x = ease.inOut(ramp(r, 0.08, R.tEnd)); }
        else { c.g = R.W; c.x = c.g.xa + (c.g.xb - c.g.xa) * ease.inOut(ramp(r, R.tEnd, 0.95)); }
        sit = R.sit * (1 - ease.inOut(ramp(r, 0, 0.13)));
      }
    } else if (showing) { this.where(t); vis = t >= T_OUT; sit = ease.inOut(ramp(t, T_SIT[0], T_SIT[1])); }
    if (vis) this.segAt(c.g, c.x, q);
    const du = Math.sin(q.a), dout = Math.cos(q.a);
    const shown = vis && (showing || ret) && q.ho + dout * 2 * LB > -1.2;
    for (const i of this.all) rig.show(i, shown);
    let nb = 0;
    if (shown) {
      // ---- its feet on the floor, and how much of it is in the air (for the bob of a trot)
      let m = 0; for (let k = 0; k < 4; k++) { this.footAt(c.g, c.x, k, F[k]); m = Math.max(m, F[k].h); }

      // ---- what it is doing (all from the show's clock, so any moment can be posed)
      const idle = showing && t > T_IDLE ? t - T_IDLE : -1, tau = idle >= 0 ? idle % PER : -1, tau2 = idle >= 0 ? idle % (2 * PER) : -1;
      const sniff = showing ? win(t, 1.85, 3.38, 0.34) : 0;
      const glance = tau2 >= 0 ? win(tau2, 5.0, 6.5, 0.4) : 0;                                        // up at the hand, while it stays
      const us = showing ? Math.max(win(t, 3.3, 4.5, 0.3), smooth(ramp(t, 6.9, 7.2)) * (1 - glance)) : 0;
      const hand = showing ? Math.max(win(t, 4.25, 5.3, 0.34), glance) : 0;
      const liftK = showing ? smooth(ramp(t, T_PAW[0], T_PAW[1])) * (1 - smooth(ramp(t, T_PAWDOWN[0], T_PAWDOWN[1]))) : 0;
      const alert = showing ? win(t, 3.3, 4.4, 0.3) : 0;
      const tilt = tau2 >= 0 ? 0.3 * win(tau2, 2.5, 3.9, 0.3) - 0.24 * win(tau2, 9.3, 10.5, 0.3) : 0;
      const blink = hump((showing ? t : 0) % 3.1, 2.9, 3.06);
      // (a held look before it sets off for its place, and before it sits: its weight goes back, then into the move)
      const gather = showing ? hump(t, T_T1[1] - 0.06, T_B[0] + 0.14) + 0.6 * hump(t, T_T2[1] - 0.04, T_SIT[0] + 0.1) : 0;
      // (the sit: the haunches go down, then the chest comes down onto its forelegs, then it is still but for its breath)
      const sq = showing ? hump(t, T_SIT[1] - 0.1, T_SIT[1] + 0.14) : 0, chest = showing ? smooth(ramp(t, T_SIT[1] - 0.04, T_SIT[1] + 0.26)) : 1, bounce = showing ? hump(t, T_SIT[1] + 0.2, T_SIT[1] + 0.44) : 0;

      // ---- the body, from the hips: their height and the shoulders', and so how it is pitched
      const yH = lerp(HS, 0.11, sit) + 0.005 * m - 0.008 * sq - 0.008 * gather;
      const yS = HS + 0.005 * m - 0.045 * sniff - 0.006 * liftK - 0.008 * gather + sit * (0.018 - 0.014 * chest) - 0.005 * bounce + 0.003 * sit * Math.sin(TAU * 0.42 * t);
      const pitch = -Math.asin(Math.max(-0.9, Math.min(0.9, (yS - yH) / 0.26)));
      // (sitting, the shoulders stay over the forefeet and the hips come in under)
      const shift = (0.26 * (1 - Math.cos(pitch)) - 0.022 * gather + 0.02 * liftK) * SC, hu = q.hu + du * shift, ho = q.ho + dout * shift;
      const yaw = L.yawOut + q.a, sn = Math.sin(yaw), cs = Math.cos(yaw);
      L.floor(hu, ho, this.w);
      this.world(M.body, this.w.x, L.y + yH * SC, this.w.z, yaw, pitch, 0.025 * (F[0].h - F[1].h));
      rig.mat(I.body, M.body);

      // ---- the neck and the head: where it looks (the way it goes; us; the hand in the picture)
      const nbv = this.nb.set(NECK[0], NECK[1], NECK[2]).applyMatrix4(M.body), cam = L.k.G.camera.position;
      const dUs = wrap(Math.atan2(cam.x - nbv.x, cam.z - nbv.z) - yaw), elUs = Math.max(-0.35, Math.min(0.45, Math.atan2(cam.y - (nbv.y + 0.1), Math.hypot(cam.x - nbv.x, cam.z - nbv.z))));
      L.at(HAND[0], HAND[1], 0.02, this.v); const hx = this.v.x, hy = this.v.y, hz2 = this.v.z;
      let dHand = wrap(Math.atan2(hx - nbv.x, hz2 - nbv.z) - yaw); if (dHand < -2.2 && showing && t < 5.4) dHand += TAU;      // (at the edge: back over its left shoulder)
      const elHand = Math.min(0.95, Math.atan2(hy - (nbv.y + 0.1), Math.hypot(hx - nbv.x, hz2 - nbv.z)));
      const lead = c.g.kind === 'turn' ? Math.sign(c.g.th) * 0.6 * Math.sin(Math.PI * Math.min(1, c.x * 1.1 + 0.05)) : 0;      // (its head goes first into a turn)
      const look = Math.max(-2.5, Math.min(2.5, us * Math.max(-1.9, Math.min(1.9, dUs)) + hand * Math.max(-2.5, Math.min(2.5, dHand)) + lead * (1 - hand) + 0.2 * sniff * Math.sin(t * 5.2)));
      const ny = Math.max(-1.05, Math.min(1.05, look * 0.45)), hyaw = Math.max(-1.45, Math.min(1.45, look - ny));
      const neckP = Math.max(-1.2, Math.min(1.1, -0.42 + 1.42 * sniff - 0.4 * alert * (1 - hand) - 0.3 * hand - 0.34 * sit * (1 - hand) + 0.1 * gather + 0.05 * m + 0.05 * sniff * Math.sin(t * 9)));
      const headP = Math.max(-0.95, Math.min(1.3, 0.2 + 1.04 * sniff - us * (elUs + 0.04) - hand * (elHand * 0.86 + 0.12) + 0.16 * sit * (1 - hand) + 0.04 * m));
      this.world(M.neck, nbv.x, nbv.y, nbv.z, yaw + ny, neckP, 0); rig.mat(I.neck, M.neck);
      this.w.set(0, 0, NL).applyMatrix4(M.neck);
      this.e.set(headP, yaw + ny + hyaw, tilt, 'YXZ'); M.head.compose(this.w, this.q.setFromEuler(this.e), this.s3.set(SC, SC, SC)); rig.mat(I.head, M.head);
      // its ears hang as the head turns under them, lift a little when it attends, bounce at the trot and as it sits down
      for (let k = 0; k < 2; k++) {
        const s = k ? -1 : 1, flap = 0.1 + 0.2 * alert + 0.1 * us * sit + 0.2 * F[k].h + 0.34 * sq + 0.2 * bounce;
        this.child(M.ear[k], M.head, s * 0.0438, 0.016, 0.006, 0, -headP * 0.82 + 0.1 * alert, s * flap - tilt * 0.8);
        rig.mat(I.ear[k], M.ear[k]);
        this.child(M.tmp, M.head, s * this.eye[0], this.eye[1], this.eye[2] - 0.0028, s * this.eyeTurn[0], this.eyeTurn[1], -s * 0.12);
        this.child(M.lid[k], M.tmp, 0, 0, 0, 0, 1.25 * blink - 0.14 * alert - 0.1 * hand - 0.12 * sit * us, 0);
        rig.mat(I.lid[k], M.lid[k]);
      }

      // ---- the tail
      let wag = 0, tailP = -0.5;
      if (ret) wag = 0.3 * Math.sin(TAU * (calm ? 1.2 : 2.4) * (R.t + L.r));
      else {
        const rate = calm ? 1.4 : 2.8, go = (1 - smooth(ramp(t, 3.3, 3.75))) + smooth(ramp(t, 5.5, 6.0)) * (1 - sit);
        wag = 0.42 * go * Math.sin(TAU * rate * t);
        tailP = -0.5 + 0.34 * alert - 0.4 * hand * (1 - sit) - 0.1 * smooth(ramp(t, 5.5, 6.0));
        if (tau >= 0) wag = 0.6 * win(tau, 0.02, 1.52, 0.22) * Math.sin(TAU * (calm ? 0.75 : 1.5) * (tau - 0.1));
      }
      this.w.set(TAILB[0], TAILB[1], TAILB[2]).applyMatrix4(M.body);
      this.world(M.tail[0], this.w.x, Math.max(L.y + 0.02 * SC, this.w.y), this.w.z, yaw + wag, lerp(tailP, -0.3, sit), 0); rig.mat(I.tail[0], M.tail[0]);
      this.child(M.tail[1], M.tail[0], 0, 0, -0.098, wag * 0.9, lerp(0.34, 0.3, sit), 0); rig.mat(I.tail[1], M.tail[1]);

      // ---- the legs: each made to reach its foot
      for (let k = 0; k < 4; k++) {
        const front = k < 2, s = k % 2 ? -1 : 1, f = F[k], J = this.j, W = this.w;
        if (front) J.set(s * JF[0], JF[1], JF[2]).applyMatrix4(M.body); else J.set(s * JH[0], JH[1], JH[2]).applyMatrix4(M.body);
        let fu = f.u, fo = f.o, lift = 0.03 * SC * f.h, flex = 0.7 * f.h;
        if (!front) {          // (sitting: the hind feet come forward and out, beside the forefeet; a small step as they do)
          const tu = hu + (du * 0.105 + dout * s * 0.074) * SC, to = ho + (dout * 0.105 - du * s * 0.074) * SC;
          fu = lerp(fu, tu, sit); fo = lerp(fo, to, sit); lift += 0.05 * SC * sit * (1 - sit);
        } else if (k === 1) { fu += du * 0.085 * SC * liftK; fo += dout * 0.085 * SC * liftK; lift += (0.07 + 0.004 * Math.sin(t * 7)) * SC * liftK; flex += 0.95 * liftK; }      // its right forepaw, out over the edge
        L.floor(fu, fo, W); const gx = W.x, gz = W.z;
        if (front) {
          W.set(gx, L.y + len.PAWH + lift, gz);
          const ik = this.solve(J, W, yaw, len.AF, len.BF, -1);
          this.world(M.up[k], J.x, J.y, J.z, yaw, ik.p1, ik.roll); rig.mat(I.up[k], M.up[k]);
          this.child(M.lo[k], M.up[k], 0, -AF, 0, 0, ik.p2, 0); rig.mat(I.lo[k], M.lo[k]);
          this.v.set(0, -BF, 0).applyMatrix4(M.lo[k]); const wx = this.v.x, wy = this.v.y, wz = this.v.z;
          this.world(M.paw[k], wx, wy, wz, yaw, flex, 0); rig.mat(I.paw[k], M.paw[k]);
        } else {
          // the hind foot: the hock over the paw when it stands; laid forward along the floor when it sits; trailing in the air
          const gam = lerp(0, 1.42, sit) - 0.5 * f.h, jy = L.y + len.PAWH + lift, hk = len.MT;
          W.set(gx - Math.sin(gam) * hk * sn, jy + Math.cos(gam) * hk, gz - Math.sin(gam) * hk * cs);
          const ik = this.solve(J, W, yaw, len.AH, len.BH, 1);
          this.world(M.up[k], J.x, J.y, J.z, yaw, ik.p1, ik.roll); rig.mat(I.up[k], M.up[k]);
          this.child(M.lo[k], M.up[k], 0, -AH, 0, 0, ik.p2, 0); rig.mat(I.lo[k], M.lo[k]);
          this.v.set(0, -BH, 0).applyMatrix4(M.lo[k]); const kx = this.v.x, ky = this.v.y, kz = this.v.z;
          this.world(M.ft[k - 2], kx, ky, kz, yaw, -gam, 0); rig.mat(I.ft[k - 2], M.ft[k - 2]);
          this.world(M.paw[k], gx, jy, gz, yaw, 0.5 * f.h, 0); rig.mat(I.paw[k], M.paw[k]);
        }
        // a foot coming down on the tiles
        const up = f.h > 0.03; if (this.up[k] && !up && showing && !L.quiet && this.lastT >= 0 && fo > 0.05) { const v = L.voice(); v.note(2100 + 300 * (k % 2), 0.03, { vol: 0.003, type: 'sine', attack: 0.002 }); v.note(190, 0.05, { vol: 0.005, type: 'sine', attack: 0.003, to: 120 }); }
        this.up[k] = up;
      }

      // ---- its shadow on the tiles
      this.w.set(0, 0, 0.22).applyMatrix4(M.body); this.blobs.set(nb++, this.w.x, this.w.z, 0.12 * SC, 0.55);
      this.w.set(0, 0, 0.0).applyMatrix4(M.body); this.blobs.set(nb++, this.w.x, this.w.z, (0.11 + 0.03 * sit) * SC, 0.55);
      this.w.set(0, 0, 0.06).applyMatrix4(M.head); this.blobs.set(nb++, this.w.x, this.w.z, 0.07 * SC, 0.3 + 0.2 * sniff);
    }
    this.blobs.count = nb;
    if (showing) this.score.play(t);
    L.voice().place();
    this.lastT = showing ? t : this.lastT;
  },
});
