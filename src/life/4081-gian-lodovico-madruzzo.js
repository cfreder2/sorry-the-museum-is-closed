// Giovanni Battista Moroni, Gian Lodovico Madruzzo (1551–52), Gallery 206. The word: stay.
//
// A young churchman of Trent stands full length in black on a pavement of olive, terracotta and cream tiles, his gloves in
// one hand; with the other he points one finger down, and behind his robe his dog, white with brown ears, has stopped
// where the finger says and only looks out at us. That finger is the one thing happening in the picture, and it is what
// a painter asks of a sitter too. Look at it and his pavement comes out from under the picture across the gallery floor,
// tile by tile, and the dog walks out along it, nose down, tail going, as far as the tiles go. At the last tile it stops,
// looks at us, and lifts a forepaw out over the museum's floor; then it looks back, up at the hand in the picture, puts
// the paw down, turns, trots to its place below that hand, turns about to face us as it stands in the picture, and sits.
// The eight chords of the passamezzo antico (the ground every lutenist in Italy played in the 1550s; Ortiz printed
// his divisions on it in Rome in 1553) are plucked once each under it, the last as it sits. While you keep looking it
// stays: its tail sweeps the tiles now and then, it tilts its head, it glances up at the hand, and it does not get up.
// When you stop it gets up and goes back in under the picture, and the tiles go back after it.
//
// The dog is a smooth body under a coat of fine wisps of paint, as he painted it; the tiles are flat, mottled, with his
// stippled joints. Nothing climbs the wall. The man is not made and nothing of his is touched or played with: he was a
// real person and a cleric, so the show is only his dog and his floor, the toy cannot push either, and nothing lingers.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { score, hump, hz } from './stagecraft.js';

const TAU = Math.PI * 2;
const SC = 1.28;                                // the dog: about half a metre to the top of its head
const HOME = 0.38;                              // where it comes out from under the picture, along the wall: under the dog in it
const P = 0.33, NARROW = 0.115;                  // the pavement: one repeat, and its narrow band (a big olive square, a small
                                                // terracotta one, cream oblongs between), at the dog's scale
const PAVE = { u: 0.06, ru: 0.93, ro: 1.2, x0: 0.047, y0: -0.08 };      // its patch (middle along the wall, reach along and out); where the pattern sits
const OUT = 1.62, HALF = 1.2;                   // the floor the patch may cover
const LB = 0.13 * SC;                           // hips to the middle of the back, and the middle to the shoulders
const STRIDE = 0.4 * SC;                        // a trot: one full stride
const HAND = [0.3, -0.09];                      // the tip of the pointing finger, on the canvas (along, up from its middle)
// The times (show seconds).
const T_LAY = [0.05, 1.6], T_OUT = 0.9, T_EDGE = 3.3, T_PAW = [3.62, 3.94], T_PAWDOWN = [4.62, 4.95];
const T_P1 = [4.95, 5.58], T_B = [5.56, 6.5], T_P2 = [6.5, 7.06], T_SIT = [7.24, 7.72], T_IDLE = 7.95;
const TURN1 = 2.62, TURN2 = -1.98;              // the two turns (radians; left is positive): about, at the edge; and to face us, at its place
const PER = 6.4;                                // while it stays: its tail every PER seconds, the rest every two
// The way out, shoulders first: (along, out), from inside the wall to the last tile.
const WAY = [[HOME, -1.0], [HOME, -0.5], [HOME, 0.02], [0.33, 0.36], [0.16, 0.66], [0.0, 0.86], [-0.085, 1.04], [-0.12, 1.2]];
// The passamezzo antico, in G: one chord a second from T0, the seventh bar split, the last an open fifth (midi notes).
const T0 = 0.8;
const GROUND = [[0, [55, 62, 67, 70]], [1, [53, 60, 65, 69]], [2, [55, 62, 67, 70]], [3, [50, 57, 62, 66]], [4, [58, 65, 70, 74]], [5, [53, 60, 65, 69]], [6, [55, 62, 67, 70]], [6.5, [50, 57, 62, 66]], [7, [43, 55, 62, 67]]];

const smooth = ease.smooth, wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const win = (t, a, b, e = 0.3) => smooth(ramp(t, a, a + e)) * (1 - smooth(ramp(t, b - e, b)));      // 1 between a and b, eased at both ends
// One foot's cycle (u in 0..1): planted and sliding back under the body for the first half, lifted and swung forward for
// the second. g: where it is along its stride (+1 ahead, -1 behind); the lift is foot.h.
const foot = { g: 0, h: 0 };
const step = u => { u -= Math.floor(u); if (u < 0.5) { foot.g = 1 - 4 * u; foot.h = 0; } else { const w = (u - 0.5) * 2; foot.g = -1 + 2 * smooth(w); foot.h = Math.sin(Math.PI * w); } return foot; };

lifeFor(4081, {
  title: /^Gian Lodovico Madruzzo/,
  word: 'stay',
  // (a tall work, hung low: the camera stands back and low, so the whole of it is in view with the pointing hand, and the
  // floor below it where the dog goes)
  stage: { out: 1.5, half: 1.15, cam: { dist: 3.3, height: 0.62, side: 0.2, fov: 58, lookU: 0.06, lookOut: 0.3, lookH: 1.2 } },
  wake: 2, ret: 2.6,

  build(L) {
    const col = (h, a = 0.06) => L.pal.near(h, a);
    // The night's finish brightens what glows by itself about 1.7 times (measured on the screen): the colour to hand it,
    // for an unlit thing to come out as `hex`. (What the room's lamps light comes out near enough as it is given.)
    const shown = hex => col(hex, 0.04).multiplyScalar(0.59);
    const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), M4 = () => new THREE.Matrix4();
    this.v = V3(); this.w = V3(); this.j = V3(); this.g = V3(); this.nb = V3();
    this.e = new THREE.Euler(); this.q = new THREE.Quaternion(); this.s3 = V3(); this.l = M4();
    this.M = { tmp: M4(), hind: M4(), fore: M4(), neck: M4(), head: M4(), ear: [M4(), M4()], lid: [M4(), M4()], tail: [M4(), M4()], up: [M4(), M4(), M4(), M4()], lo: [M4(), M4(), M4(), M4()], ft: [M4(), M4()], paw: [M4(), M4(), M4(), M4()] };
    this.o = { mu: 0, mo: 0, aF: 0, aH: 0, phi: 0, amp: 0, piv: 0, pivR: 0, vis: false }; this.o0 = { ...this.o }; this.ik = { p1: 0, roll: 0, p2: 0 };
    this.p3 = V3(); this.t3 = V3();

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

    // ---------------------------------------------------------- shapes: smooth forms, shaded as he shades, under fine wisps
    const own = (g, c) => {
      g = g.index ? g.toNonIndexed() : g;
      for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n);
      const a = new Float32Array(g.attributes.position.count * 3), cc = new THREE.Color(c);
      for (let i = 0; i < a.length; i += 3) { a[i] = cc.r; a[i + 1] = cc.g; a[i + 2] = cc.b; }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
    };
    const ell = (C, R, c, detail = 2, rx = 0, ry = 0, rz = 0) => shape.move(shape.ball(1, c, detail), C[0], C[1], C[2], rx, ry, rz, R[0], R[1], R[2]);
    const limb = (a, b, r0, r1, c, seg = 12, rings = 3) => {
      const A = V3(...a), Bv = V3(...b), len = A.distanceTo(Bv), g = own(new THREE.CylinderGeometry(r1, r0, len, seg, rings), c);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), Bv.clone().sub(A).normalize()));
      const m = A.clone().add(Bv).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return g;
    };
    // A form lofted along z through stations [z, y (its middle), w (half width), hu, hd (half heights, up and down), e (2: round;
    // more: squarer)], smooth through them and closed to a point at each end: one skin, no seams (the head).
    const cat = (a, b, c, d, t) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    const station = (st, f) => { const n = st.length, i = Math.max(0, Math.min(n - 2, Math.floor(f))), t = f - i; return [0, 1, 2, 3, 4, 5].map(k => cat(st[Math.max(i - 1, 0)][k], st[i][k], st[i + 1][k], st[Math.min(i + 2, n - 1)][k], t)); };
    const loft = (st, c, rings = 44, seg = 40) => {
      const pos = [], idx = [];
      for (let i = 0; i <= rings; i++) {
        const [z, y, w, hu, hd, e] = station(st, (i / rings) * (st.length - 1)), end = i === 0 || i === rings;
        for (let j = 0; j < seg; j++) { const a = (j / seg) * TAU, cs = Math.cos(a), sn = Math.sin(a), pw = 2 / Math.max(1.5, e); pos.push(end ? 0 : Math.max(0, w) * Math.sign(cs) * Math.pow(Math.abs(cs), pw), y + (end ? 0 : Math.max(0, sn > 0 ? hu : hd) * Math.sign(sn) * Math.pow(Math.abs(sn), pw)), z); }
      }
      for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) { const a = i * seg + j, b = i * seg + (j + 1) % seg, d = a + seg, f = b + seg; idx.push(a, b, d, b, f, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      return own(g, c);
    };
    // Every vertex its colour, from where it is and which way it faces (a tone runs smoothly over a form).
    const vpaint = (g, fn) => { const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, v = V3(), nn = V3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); nn.fromBufferAttribute(n, i); const k = fn(v, nn); c.setXYZ(i, k.r, k.g, k.b); } c.needsUpdate = true; return g; };
    const KEY = V3(-0.32, 0.86, 0.4).normalize();          // his light: high, from the left
    // (the white of it is a warm grey white, as he painted it; the brown of its ears nearly black in their shadow)
    const Wh = { hi: col('#dbd7c2'), mid: col('#b6b29d'), lo: col('#8b8773'), deep: col('#6a6658') };
    const Br = { hi: col('#7d5437'), mid: col('#573623'), lo: col('#37241a'), deep: col('#211610') };
    const ss = THREE.MathUtils.smoothstep;
    const toneOf = (T, key = KEY) => (n, j = 0, into = new THREE.Color()) => { const k = n.dot(key) + j; return k < -0.25 ? into.copy(T.deep).lerp(T.lo, ss(k, -0.9, -0.25)) : k < 0.3 ? into.copy(T.lo).lerp(T.mid, ss(k, -0.25, 0.3)) : into.copy(T.mid).lerp(T.hi, ss(k, 0.3, 0.95)); };
    const white = toneOf(Wh), brown = toneOf(Br);
    const wf = (C, R, detail = 2, rx = 0) => vpaint(ell(C, R, Wh.mid, detail, rx), (v, n) => white(n));
    const wl = (a, b, r0, r1, seg, rings, tone = white) => vpaint(limb(a, b, r0, r1, Wh.mid, seg, rings), (v, n) => tone(n));
    const lathe = prof => vpaint(shape.lathe(prof, 16, Wh.mid), (v, n) => white(n));
    // (a part that is carried pitched has the light turned the other way in its own space: the neck, the thigh)
    const keyAt = pitch => KEY.clone().applyAxisAngle(V3(1, 0, 0), -pitch), whiteAt = pitch => toneOf(Wh, keyAt(pitch));
    // Wisps: fine leaves of paint lying along the coat, their tips a little lifted and a little lighter. list: { p, n, dir, l, w, lift, c }
    const wisps = list => {
      const pos = [], nor = [], cl = [], side = V3(), a = V3(), b = V3(), c = V3(), d = V3(), tip = new THREE.Color();
      for (const s of list) {
        side.crossVectors(s.n, s.dir).normalize();
        a.copy(s.p).addScaledVector(s.dir, -s.l * 0.22).addScaledVector(s.n, 0.0008);
        b.copy(s.p).addScaledVector(s.dir, s.l * 0.2).addScaledVector(side, s.w / 2).addScaledVector(s.n, 0.0016 + s.lift * s.l * 0.25);
        c.copy(s.p).addScaledVector(s.dir, s.l * 0.2).addScaledVector(side, -s.w / 2).addScaledVector(s.n, 0.0016 + s.lift * s.l * 0.25);
        d.copy(s.p).addScaledVector(s.dir, s.l * 0.78).addScaledVector(side, (s.lean || 0) * s.l).addScaledVector(s.n, 0.0012 + s.lift * s.l);
        tip.copy(s.c).lerp(s.tipTo || Wh.hi, s.tip == null ? 0.16 : s.tip);
        for (const [q, k] of [[a, s.c], [b, s.c], [c, s.c], [c, s.c], [b, s.c], [d, tip]]) { pos.push(q.x, q.y, q.z); nor.push(s.n.x, s.n.y, s.n.z); cl.push(k.r, k.g, k.b); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
      return g;
    };
    // A coat of wisps over an ellipsoid: n tries, lying the way `flow` runs; keep(p, n) leaves some out.
    const coat = (C, R, n, { flow = V3(0, -0.6, -1), tone = white, l = [0.012, 0.022], w = [0.0045, 0.008], lift = [0.02, 0.1], keep = null, grow = 1.0, lean = 0.1, jit = 0.12, tip, tipTo } = {}) => {
      const list = [];
      for (let i = 0; i < n; i++) {
        const y = 1 - 2 * L.rand(), ph = L.rand() * TAU, s = Math.sqrt(Math.max(0, 1 - y * y));
        const p = V3(C[0] + R[0] * grow * s * Math.cos(ph), C[1] + R[1] * grow * y, C[2] + R[2] * grow * s * Math.sin(ph));
        const nn = V3((p.x - C[0]) / (R[0] * R[0]), (p.y - C[1]) / (R[1] * R[1]), (p.z - C[2]) / (R[2] * R[2])).normalize();
        const q1 = L.rand(), q2 = L.rand(), q3 = L.rand(), q4 = L.rand(), q5 = L.rand();
        if (keep && !keep(p, nn)) continue;
        const f = (typeof flow === 'function' ? flow(p, nn) : flow).clone(); f.addScaledVector(nn, -f.dot(nn)); if (f.lengthSq() < 1e-6) continue; f.normalize();
        list.push({ p, n: nn, dir: f, l: lerp(l[0], l[1], q1), w: lerp(w[0], w[1], q2), lift: lerp(lift[0], lift[1], q3), lean: (q4 - 0.5) * 2 * lean, c: tone(nn, (q5 - 0.5) * jit), tip, tipTo });
      }
      return list;
    };
    // The same down a limb from a to b (radius ra to rb): on the side keep(t, n) says.
    const fringe = (a, b, ra, rb, n, { flow = V3(0, -1, -0.5), tone = white, l = [0.012, 0.022], w = [0.0045, 0.008], lift = [0.03, 0.14], keep = null, lean = 0.12, tip, tipTo } = {}) => {
      const A = V3(...a), Bv = V3(...b), ax = Bv.clone().sub(A), len = ax.length(); ax.normalize();
      const e1 = V3().crossVectors(ax, Math.abs(ax.z) < 0.9 ? V3(0, 0, 1) : V3(1, 0, 0)).normalize(), e2 = V3().crossVectors(ax, e1), list = [];
      for (let i = 0; i < n; i++) {
        const t = L.rand(), ph = L.rand() * TAU, q1 = L.rand(), q2 = L.rand(), q3 = L.rand(), q4 = L.rand(), q5 = L.rand();
        const nn = e1.clone().multiplyScalar(Math.cos(ph)).addScaledVector(e2, Math.sin(ph));
        if (keep && !keep(t, nn)) continue;
        const f = flow.clone(); f.addScaledVector(nn, -f.dot(nn)); if (f.lengthSq() < 1e-6) continue; f.normalize();
        const kl = typeof l === 'function' ? l(t) : l;
        list.push({ p: A.clone().addScaledVector(ax, t * len).addScaledVector(nn, lerp(ra, rb, t)), n: nn, dir: f, l: lerp(kl[0], kl[1], q1), w: lerp(w[0], w[1], q2), lift: lerp(lift[0], lift[1], q3), lean: (q4 - 0.5) * 2 * lean, c: tone(nn, (q5 - 0.5) * 0.12), tip, tipTo });
      }
      return list;
    };
    const inside = (p, list, k = 0.9) => list.some(([C, R]) => ((p.x - C[0]) / R[0]) ** 2 + ((p.y - C[1]) / R[1]) ** 2 + ((p.z - C[2]) / R[2]) ** 2 < k);

    // ---------------------------------------------------------- the dog
    // Its own metres; +z is the way it faces, +x its left. Each part hangs from its own joint.
    const rig = this.rig = L.rig(26, 150000, L.paint({ glow: 0.42, rough: 0.92, side: THREE.DoubleSide }));
    {
      // the forehand, from the middle of the back: the deep chest, the shoulders, the breast with its longer wavy coat
      const CHEST = [[0, -0.022, 0.1], [0.061, 0.08, 0.092]], WITH = [[0, 0.018, 0.1], [0.044, 0.042, 0.072]], BREAST = [[0, -0.03, 0.172], [0.041, 0.054, 0.036]], NB = [[0, 0.03, 0.158], [0.042, 0.044, 0.048]];
      const SH = s => [[s * 0.041, -0.024, 0.124], [0.028, 0.06, 0.043]];
      const parts = [wf(...CHEST, 5), wf(...WITH, 3), wf(...BREAST, 3), wf(...NB, 3), wf(...SH(1), 3), wf(...SH(-1), 3)];
      const all = [CHEST, WITH, BREAST, NB, SH(1), SH(-1)], not = me => p => !inside(p, all.filter(x => x !== me));
      const ws = [...coat(...CHEST, 700, { keep: not(CHEST) }), ...coat(...WITH, 150, { keep: (p, n) => n.y > 0 && !inside(p, [CHEST, NB]) }), ...coat(...NB, 120, { keep: not(NB), flow: V3(0, -0.8, -0.6) })];
      for (const s of [1, -1]) ws.push(...coat(...SH(s), 120, { keep: (p, n) => n.x * s > 0.1 && !inside(p, [CHEST]), flow: V3(0, -1, -0.45) }));
      // (the breast: longer, hanging, wavy, the lightest of it, as he paints it)
      ws.push(...coat(...BREAST, 320, { keep: (p, n) => n.z > -0.1, flow: V3(0, -1, 0.05), l: [0.018, 0.034], w: [0.005, 0.009], lift: [0.02, 0.12], lean: 0.34, tip: 0.35 }));
      ws.push(...coat(...CHEST, 110, { keep: (p, n) => n.y < -0.6, flow: V3(0, -1, -0.3), l: [0.016, 0.028], lift: [0.2, 0.5], lean: 0.25 }));      // under the chest
      parts.push(wisps(ws));
      this.gFore = rig.geo(shape.merge(parts));
    }
    {
      // the quarters, from the hips: the barrel running forward into the chest, the loin tucked up, the rump
      const BARREL = [[0, -0.002, 0.108], [0.056, 0.063, 0.108]], LOIN = [[0, 0.012, 0.04], [0.051, 0.052, 0.072]], RUMP = [[0, 0.004, -0.03], [0.057, 0.058, 0.066]];
      const parts = [wf(...BARREL, 5), wf(...LOIN, 3), wf(...RUMP, 5)];
      const ws = [...coat(...BARREL, 640, { keep: p => p.z < 0.15 && !inside(p, [LOIN, RUMP]) }), ...coat(...LOIN, 180, { keep: p => !inside(p, [BARREL, RUMP]) }), ...coat(...RUMP, 400, { keep: p => !inside(p, [LOIN, BARREL]), flow: V3(0, -0.8, -0.6) })];
      ws.push(...coat(...BARREL, 80, { keep: (p, n) => n.y < -0.65 && p.z < 0.15, flow: V3(0, -1, -0.3), l: [0.014, 0.026], lift: [0.2, 0.5], lean: 0.25 }));
      parts.push(wisps(ws));
      this.gHind = rig.geo(shape.merge(parts));
    }
    {
      // the neck, from its base, along +z to the head: thick at the shoulders, the throat full, the coat running down it
      const THR = [[0, -0.012, 0.04], [0.037, 0.04, 0.06]], wn = whiteAt(-0.85);
      const parts = [wl([0, 0, 0.0], [0, 0, 0.112], 0.054, 0.038, 16, 4, wn), vpaint(ell([0, -0.004, 0.004], [0.05, 0.046, 0.046], Wh.mid, 3), (v, n) => wn(n)), vpaint(ell(...THR, Wh.mid, 3), (v, n) => wn(n)), vpaint(ell([0, 0.004, 0.11], [0.037, 0.037, 0.03], Wh.mid, 3), (v, n) => wn(n))];
      const ws = fringe([0, 0, 0.0], [0, 0, 0.11], 0.052, 0.038, 420, { flow: V3(0, -0.45, -1), tone: wn });
      ws.push(...coat(...THR, 150, { keep: (p, n) => n.y < -0.2 && p.z < 0.085, flow: V3(0, -0.4, -1), l: [0.014, 0.026], lift: [0.03, 0.14], lean: 0.3, tip: 0.3, tone: wn }));
      parts.push(wisps(ws));
      this.gNeck = rig.geo(shape.merge(parts));
    }
    {
      // the head, from where it joins the neck: a broad white dome, the brown round each eye running back to the ear, a
      // long muzzle, deeper than it is wide, with soft lips and a liver nose; dark amber eyes under heavy lids
      const HEAD = [[-0.027, 0.012, 0, 0, 0, 2], [-0.02, 0.012, 0.024, 0.022, 0.022, 2], [0.0, 0.013, 0.038, 0.036, 0.034, 2], [0.022, 0.013, 0.042, 0.04, 0.04, 2], [0.044, 0.011, 0.0395, 0.0365, 0.041, 2.1],
        [0.06, 0.008, 0.034, 0.029, 0.04, 2.2], [0.074, 0.003, 0.0245, 0.0175, 0.036, 2.4], [0.09, 0.0, 0.0195, 0.0132, 0.0315, 2.7], [0.11, -0.001, 0.0185, 0.0122, 0.029, 2.8], [0.128, -0.002, 0.0172, 0.0115, 0.0255, 2.7], [0.139, -0.003, 0.0135, 0.009, 0.019, 2.3], [0.1445, -0.004, 0, 0, 0, 2]];
      // (where the skin of it is, over a point: for setting the eyes into the face)
      const zAt = z => { let lo = 0, hi = HEAD.length - 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (station(HEAD, m)[0] < z) lo = m; else hi = m; } return station(HEAD, lo); };
      const topY = (x, z) => { const [, y, w, hu, , e] = zAt(z), k = Math.abs(x) / w; return k >= 1 ? -1 : y + hu * Math.pow(1 - Math.pow(k, e), 1 / e); };
      const EX = 0.0232, EY = 0.0175; let EZ = 0.06; for (let i = 0, lo = 0.05, hi = 0.085; i < 30; i++) { EZ = (lo + hi) / 2; if (topY(EX, EZ) > EY) lo = EZ; else hi = EZ; }
      const EYE = s => V3(s * EX, EY, EZ - 0.0012), EARB = s => V3(s * 0.041, 0.012, 0.006);
      const seg = new THREE.Line3(), near = V3();
      const patch = v => {          // how brown it is here (0 white .. 1 brown)
        const s = v.x < 0 ? -1 : 1; seg.set(EYE(s), EARB(s)); seg.closestPointToPoint(v, true, near);
        const t = near.distanceTo(seg.start) / seg.distance(), r = lerp(0.0135, 0.03, t), dd = v.distanceTo(near);
        const blaze = ss(Math.abs(v.x), 0.0095, 0.0135);
        return (1 - ss(dd, r * 0.84, r * 1.1)) * blaze * (1 - ss(v.z, EZ + 0.008, EZ + 0.02)) * (1 - ss(v.y, 0.034, 0.045));
      };
      const mix = new THREE.Color(), dk = new THREE.Color();
      // (the skin of the head: white, the brown, the under jaw in shadow, and the line where the lips close)
      const hp = g => vpaint(g, (v, n) => {
        const c = white(n, 0.08).lerp(brown(n, 0.15, mix), patch(v));
        const lipY = -0.0165 - 0.004 * ss(v.z, 0.08, 0.135), lip = (1 - ss(Math.abs(v.y - lipY), 0.0008, 0.0026)) * ss(v.z, 0.078, 0.09) * ss(Math.abs(v.x), 0.006, 0.012);
        return c.lerp(dk.copy(Wh.deep).multiplyScalar(0.7), 0.6 * lip);
      });
      const SK = [[0, 0.014, 0.022], [0.041, 0.038, 0.046]];
      const parts = [hp(loft(HEAD, Wh.mid, 56, 48))];
      // the nose: liver brown, a little light on top, darker in the nostrils
      const nose = col('#5c4236'), noseD = col('#2a1b16'), noseL = col('#7c6054');
      parts.push(vpaint(ell([0, -0.001, 0.1385], [0.0112, 0.0092, 0.0078], nose, 3), (v, n) => (n.y > 0.55 ? noseL : nose)));
      for (const s of [1, -1]) parts.push(ell([s * 0.0048, -0.003, 0.1452], [0.0027, 0.0025, 0.0018], noseD, 1));
      // the eyes, set into the face the way it faces there: dark-rimmed, amber brown, a small point of light, the outer
      // corners a little lower (its look in the picture)
      const EN = V3(-(topY(EX + 0.002, EZ) - topY(EX - 0.002, EZ)) / 0.004, 1, -(topY(EX, EZ + 0.002) - topY(EX, EZ - 0.002)) / 0.004).normalize();
      const eyaw = Math.atan2(EN.x, EN.z) * 0.8, epitch = -Math.asin(EN.y) * 0.75;
      for (const s of [1, -1]) {
        const E = EYE(s), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(epitch, s * eyaw, -s * 0.16, 'YXZ'));
        const put = (x, y, z, R, c, d) => { const g = ell([x, y, z], R, c, d); g.applyQuaternion(q); g.translate(E.x, E.y, E.z); return g; };
        parts.push(put(0, 0, 0, [0.0086, 0.0064, 0.003], Br.deep, 3));
        parts.push(put(s * 0.0003, -0.0007, 0.0014, [0.0062, 0.0059, 0.003], col('#76501f'), 3));
        parts.push(put(s * 0.0003, -0.0005, 0.003, [0.0033, 0.0033, 0.0018], col('#0e0906'), 2));
        parts.push(put(s * 0.0003 - 0.0017, 0.0013, 0.0041, [0.0009, 0.0009, 0.0005], col('#d8d1bf'), 1));
      }
      this.eyeTurn = [eyaw, epitch];
      this.eye = [EX, EY, EZ];
      // a short coat back over the skull
      const cap = coat(...SK, 420, { keep: (p, n) => n.z < 0.45 && n.y > -0.6, flow: V3(0, -0.3, -1), l: [0.009, 0.016], w: [0.004, 0.007], lift: [0.01, 0.06], tip: 0.06 });
      for (const q of cap) q.c = white(q.n, 0.08).lerp(brown(q.n, 0.15, mix), patch(q.p));
      parts.push(wisps(cap));
      this.gHead = rig.geo(shape.merge(parts));
      // a lid: a brown shell over the top of the eye that turns about the line of its corners, as a lid does, so its edge
      // is always an arch (from the middle of the eyeball)
      {
        const pos = [], nor = [], cl = [], NA = 12, NT = 8, A = 0.0096, R = 0.0069, c = new THREE.Color(), n = V3();
        const at = (i, j) => { const ph = (-80 + 160 * i / NA) * Math.PI / 180, th = (-28 + 90 * j / NT) * Math.PI / 180; n.set(Math.sin(ph), Math.cos(ph) * Math.cos(th), Math.cos(ph) * Math.sin(th)); brown(n, 0.25, c); if (j === NT) c.lerp(Br.deep, 0.6); pos.push(A * n.x, R * n.y, R * n.z); nor.push(n.x, n.y, n.z); cl.push(c.r, c.g, c.b); };
        for (let i = 0; i < NA; i++) for (let j = 0; j < NT; j++) { at(i, j); at(i + 1, j); at(i + 1, j + 1); at(i, j); at(i + 1, j + 1); at(i, j + 1); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
        this.gLid = rig.geo(g);
      }
      // the ears, each from where it hangs: long brown leathers lying against the cheek, the hair on them wavy and long
      // at the ends; the lower half of its left one is white
      const ear = s => {
        const LEA = [[s * 0.004, -0.05, -0.002], [0.0085, 0.054, 0.03]];
        const pale = v => (s > 0 ? ss(-v.y, 0.052, 0.08) * (0.7 + 0.3 * Math.sin(v.z * 300)) : 0);
        const p = [vpaint(ell(...LEA, Br.mid, 4), (v, n) => brown(n, 0.05).lerp(white(n, 0, mix), pale(v))), vpaint(ell([s * 0.001, -0.006, 0.0], [0.0125, 0.013, 0.024], Br.mid, 3), (v, n) => brown(n, 0.1))];
        const ws = coat(...LEA, 260, { keep: (q, n) => n.x * s > -0.3, flow: V3(0, -1, -0.1), l: [0.014, 0.026], w: [0.0045, 0.008], lift: [0.02, 0.1], lean: 0.25, tone: (n, j) => brown(n, j + 0.1), tip: 0.25, tipTo: Br.hi });
        // (the feathering at the end hangs below the leather)
        const fe = coat([LEA[0][0], -0.09, -0.002], [0.0075, 0.02, 0.026], 110, { keep: (q, n) => n.y < 0.5, flow: V3(0, -1, -0.08), l: [0.018, 0.032], w: [0.0045, 0.008], lift: [0.0, 0.06], lean: 0.3, tone: s > 0 ? (n, j) => white(n, j - 0.1) : (n, j) => brown(n, j + 0.2), tip: s > 0 ? 0.3 : 0.25, tipTo: s > 0 ? Wh.hi : Br.hi });
        if (s > 0) for (const q of ws) if (q.p.y < -0.064) { q.c = white(q.n, -0.1); q.tipTo = Wh.hi; }
        p.push(wisps([...ws, ...fe]));
        return shape.merge(p);
      };
      this.gEar = [rig.geo(ear(1)), rig.geo(ear(-1))];
    }
    {
      // the tail, in two lengths, each from its own joint back along -z: a soft plume hanging under it
      const plume = (len, ra, rb, n, l) => wisps([...fringe([0, 0, 0], [0, 0, -len], ra, rb, n, { flow: V3(0, -1, -0.7), l, w: [0.005, 0.009], lift: [0.0, 0.05], keep: (t, nn) => nn.y < 0.1, lean: 0.18, tip: 0.3 }), ...fringe([0, 0, 0], [0, 0, -len], ra, rb, 60, { flow: V3(0, -0.3, -1), keep: (t, nn) => nn.y >= 0.1 })]);
      this.gTail = [
        rig.geo(shape.merge([wl([0, 0, 0.012], [0, 0, -0.098], 0.019, 0.0135, 12, 3), plume(0.098, 0.019, 0.0135, 200, t => [0.016 + 0.014 * t, 0.026 + 0.02 * t])])),
        rig.geo(shape.merge([wl([0, 0, 0.004], [0, 0, -0.1], 0.0135, 0.005, 12, 3), wf([0, 0, -0.1], [0.005, 0.005, 0.007], 2), plume(0.1, 0.0135, 0.0055, 200, t => [0.032 - 0.02 * t, 0.046 - 0.03 * t])])),
      ];
    }
    const AF = 0.088, BF = 0.15, AH = 0.115, BH = 0.115, MT = 0.06, PAWH = 0.025;
    this.len = { AF: AF * SC, BF: BF * SC, AH: AH * SC, BH: BH * SC, MT: MT * SC, PAWH: PAWH * SC };
    {
      // the legs, each length from its own joint down -y. Fore: the arm (mostly in the coat of the chest), the long
      // straight forearm feathered behind. Hind: a broad thigh, the second thigh down to the hock, the pastern.
      const back = (t, n) => n.z < -0.15, rest = (t, n) => n.z >= -0.15;
      this.gArm = rig.geo(shape.merge([wl([0, -0.004, 0], [0, -AF, 0], 0.0315, 0.0235, 14, 3), wf([0, -0.004, 0], [0.0312, 0.036, 0.034], 3), wf([0, -AF, 0], [0.0235, 0.0235, 0.0235], 3), wisps([...fringe([0, 0, 0], [0, -AF, 0], 0.032, 0.024, 150, { flow: V3(0, -1, -0.3) }), ...coat([0, -0.004, 0], [0.0312, 0.036, 0.034], 160, { flow: V3(0, -1, -0.35), keep: (p, n) => n.y > -0.3 })])]));
      this.gFore2 = rig.geo(shape.merge([lathe([[0.0146, -BF], [0.0142, -0.132], [0.0152, -0.11], [0.0185, -0.075], [0.0228, -0.035], [0.0236, -0.015], [0.0225, 0.004]]), wf([0, -BF, 0], [0.0146, 0.0146, 0.0146], 2),
        wisps([...fringe([0, 0, 0], [0, -BF * 0.92, 0], 0.0228, 0.015, 150, { keep: back, flow: V3(0, -1, -0.5), l: [0.014, 0.026], lift: [0.06, 0.26], tip: 0.3 }), ...fringe([0, 0, 0], [0, -BF, 0], 0.0228, 0.0142, 130, { keep: rest, flow: V3(0, -1, 0), l: [0.01, 0.018], lift: [0.01, 0.06] })])]));
      const HAUNCH = [[0, -0.04, -0.004], [0.033, 0.068, 0.05]];
      const wt = whiteAt(-0.4);
      this.gThigh = rig.geo(shape.merge([vpaint(ell(...HAUNCH, Wh.mid, 4), (v, n) => wt(n)), wl([0, -0.03, 0], [0, -AH - 0.004, 0], 0.034, 0.0232, 14, 3, wt), vpaint(ell([0, -AH, 0], [0.0232, 0.026, 0.0232], Wh.mid, 3), (v, n) => wt(n)),
        wisps([...coat(...HAUNCH, 300, { flow: V3(0, -1, -0.45), tone: wt }), ...coat(...HAUNCH, 90, { keep: (p, n) => n.z < -0.4, flow: V3(0, -1, -0.7), l: [0.018, 0.032], lift: [0.08, 0.3], lean: 0.25, tip: 0.3, tone: wt }), ...fringe([0, -0.06, 0], [0, -AH - 0.01, 0], 0.031, 0.0235, 140, { flow: V3(0, -1, -0.3), tone: wt })])]));
      this.gShank = rig.geo(shape.merge([lathe([[0.0148, -BH], [0.0142, -0.1], [0.0158, -0.075], [0.0205, -0.035], [0.0235, -0.01], [0.023, 0.004]]), wf([0, -BH, 0], [0.0148, 0.0148, 0.0148], 2),
        wisps([...fringe([0, 0, 0], [0, -BH * 0.85, 0], 0.0235, 0.016, 110, { keep: back, flow: V3(0, -1, -0.55), l: [0.014, 0.024], lift: [0.06, 0.24], tip: 0.3 }), ...fringe([0, 0, 0], [0, -BH, 0], 0.0235, 0.0142, 100, { keep: rest, flow: V3(0, -1, 0), l: [0.01, 0.018], lift: [0.01, 0.06] })])]));
      this.gFoot = rig.geo(shape.merge([wl([0, 0, 0], [0, -MT, 0], 0.0142, 0.0132, 12, 2), wf([0, -MT, 0], [0.0136, 0.0136, 0.0136], 2), wisps(fringe([0, 0, 0], [0, -MT, 0], 0.0142, 0.0132, 50, { flow: V3(0, -1, 0), l: [0.009, 0.015], lift: [0.01, 0.05] }))]));
      // a paw, from its joint (PAWH above the ground): broad, the four toes told apart, pale claws
      const paw = [wl([0, 0.004, 0], [0, -0.012, 0.006], 0.0142, 0.017, 12, 1), wf([0, -0.013, 0.015], [0.0225, 0.012, 0.03], 3)];
      for (const [x, z] of [[-0.016, 0.036], [-0.0054, 0.042], [0.0054, 0.042], [0.016, 0.036]]) {
        paw.push(vpaint(ell([x, -0.0155, z], [0.0062, 0.0092, 0.0112], Wh.mid, 2), (v, n) => white(n, 0.12)));
        paw.push(ell([x * 1.05, -0.021, z + 0.0105], [0.0018, 0.0022, 0.004], col('#77705f'), 1));
      }
      this.gPaw = rig.geo(shape.merge(paw));
    }
    const add = g => { const i = rig.add(g); rig.show(i, false); return i; };
    this.I = { hind: add(this.gHind), fore: add(this.gFore), neck: add(this.gNeck), head: add(this.gHead), ear: [add(this.gEar[0]), add(this.gEar[1])], lid: [add(this.gLid), add(this.gLid)], tail: [add(this.gTail[0]), add(this.gTail[1])],
      up: [add(this.gArm), add(this.gArm), add(this.gThigh), add(this.gThigh)], lo: [add(this.gFore2), add(this.gFore2), add(this.gShank), add(this.gShank)], ft: [add(this.gFoot), add(this.gFoot)], paw: [0, 1, 2, 3].map(() => add(this.gPaw)) };
    this.all = Object.values(this.I).flat();
    this.blobs = L.blobs(3, { y: L.y + 0.02, fade: true }); this.blobs.renderOrder = 6;

    // ---------------------------------------------------------- its ways
    const C3 = pts => { const c = new THREE.CatmullRomCurve3(pts.map(([u, o]) => V3(u, 0, o)), false, 'centripetal'); c.arcLengthDivisions = 300; c.updateArcLengths(); return c; };
    this.C3 = C3;
    this.A = { c: C3(WAY) }; this.A.len = this.A.c.getLength();
    // where it stands at the last tile; turned about there (TURN1), the way to its place; and turned to face us (TURN2)
    const e = this.edge = { ...this.o }; this.triple(this.A, this.A.len, e);
    const dir = a => [Math.sin(a), Math.cos(a)];
    {
      const a = e.aF + TURN1, [du, dout] = dir(a), d = 0.69, m = [e.mu, e.mo];
      const pts = [[m[0] - du * LB, m[1] - dout * LB], m, [m[0] + du * LB, m[1] + dout * LB], [m[0] + du * (LB + d * 0.5) + 0.012, m[1] + dout * (LB + d * 0.5)], [m[0] + du * (LB + d), m[1] + dout * (LB + d)]];
      this.B = { c: C3(pts) }; this.B.len = this.B.c.getLength(); this.aB = a;
      this.place = { ...this.o }; this.triple(this.B, this.B.len, this.place);
    }

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
      s.hit(T_SIT[1] + 0.05, { d: 0.3, vol: 0.011, lp: 800, attack: 0.06 });
      const rate = calm ? 0.75 : 1.5, thumps = [];
      for (let n = 0; ; n++) { const tt = 0.1 + (2 * n + 1) / (4 * rate); if (tt > 1.45) break; thumps.push({ t: tt, noise: true, d: 0.07, vol: 0.012, lp: 260, attack: 0.004 }, { t: tt, f: 92, d: 0.09, vol: 0.012, type: 'sine', attack: 0.004, to: 60 }); }
      s.loop(T_IDLE, PER, thumps);
      return s.done();
    };
    this.score = this.band(false); this.calmBand = false;
  },

  // Three points of it on a way, shoulders at arc s: the middle of its back (mu, mo) and the way each half faces.
  triple(W, s, o) {
    const c = W.c, len = W.len, p = this.p3, at = x => c.getPointAt(clamp01(x / len), p);
    at(s); const su = p.x, so = p.z; at(s - LB); const mu = p.x, mo = p.z; at(s - 2 * LB);
    o.mu = mu; o.mo = mo; o.aF = Math.atan2(su - mu, so - mo); o.aH = Math.atan2(mu - p.x, mo - p.z);
    return o;
  },
  // How far along the way out its shoulders are at t.
  sA(t) { const k = clamp01((t - T_OUT) / (T_EDGE - T_OUT)); return 2 * LB + (this.A.len - 2 * LB) * (1 - Math.pow(1 - k, 1.85)); },
  sB(t) { return 2 * LB + (this.B.len - 2 * LB) * smooth(ramp(t, T_B[0], T_B[1])); },
  // Where it is and how it is going, at show-time t.
  poseAt(t, o) {
    o.piv = 0; o.pivR = 0; o.amp = 0; o.phi = 0; o.vis = t >= T_OUT;
    if (t < T_EDGE) {
      const s = this.sA(t); this.triple(this.A, s, o);
      o.phi = s / STRIDE * TAU; o.amp = clamp01((this.sA(t + 0.04) - this.sA(t - 0.04)) / 0.08 / 0.34);
    } else if (t < T_P1[1]) {
      const e = this.edge, k = ramp(t, T_P1[0], T_P1[1]);
      o.mu = e.mu; o.mo = e.mo; o.aF = e.aF + TURN1 * ease.inOut(ramp(k, 0, 0.86)); o.aH = e.aH + (this.aB - e.aH) * ease.inOut(ramp(k, 0.14, 1));
      o.phi = TAU * 2 * smooth(k); o.piv = Math.sin(Math.PI * k); o.pivR = TURN1 / 8;
    } else if (t < T_B[1]) {
      const s = this.sB(t); this.triple(this.B, s, o);
      o.phi = s / STRIDE * TAU; o.amp = clamp01((this.sB(t + 0.04) - this.sB(t - 0.04)) / 0.08 / 0.34);
    } else {
      const e = this.place, k = ramp(t, T_P2[0], T_P2[1]);
      o.mu = e.mu; o.mo = e.mo; o.aF = e.aF + TURN2 * ease.inOut(ramp(k, 0, 0.86)); o.aH = e.aH + TURN2 * ease.inOut(ramp(k, 0.14, 1));
      o.phi = TAU * 1.5 * smooth(k); o.piv = k < 1 ? Math.sin(Math.PI * k) : 0; o.pivR = TURN2 / 6;
    }
    return o;
  },

  hideAll() { for (const i of this.all) this.rig.show(i, false); this.blobs.count = 0; },
  start(L) {
    this.hideAll(); this.lastT = -1; this.lastStep = 0;
    if (this.calmBand !== L.calm) { this.score = this.band(L.calm); this.calmBand = L.calm; }
    this.score.from(0);
    this.u.uSoft.value = L.calm ? 0.3 : 0.1;
    if (!this.told && !L.quiet) { this.told = true; L.k.say('His pavement comes out, and his dog, as far as the tiles go.', 4); }
  },
  back(L) {
    // where it is now, and its way home: turned to face the foot of the wall under the picture, then straight in
    const t = this.lastShow || 0, o = this.poseAt(t, this.o0);
    const R = this.R = { t, show: o.vis, sit: t >= T_SIT[0] ? ease.inOut(ramp(t, T_SIT[0], T_SIT[1])) : 0, lay: this.u.uLay.value, rev: t < 1.9, s0: this.sA(t) };
    if (!o.vis || R.rev) return;
    const aim = [HOME, Math.min(0.05, o.mo - 0.3)], a1 = Math.atan2(aim[0] - o.mu, aim[1] - o.mo), a0 = Math.atan2(Math.sin(o.aF) + Math.sin(o.aH), Math.cos(o.aF) + Math.cos(o.aH));
    R.turn = wrap(a1 - a0); R.aF = o.aF; R.aH = o.aH; R.a1 = a1;
    const du = Math.sin(a1), dout = Math.cos(a1), pts = [[o.mu - du * LB, o.mo - dout * LB], [o.mu, o.mo], [o.mu + du * LB, o.mo + dout * LB]];
    if (Math.hypot(aim[0] - pts[2][0], aim[1] - pts[2][1]) > 0.12 && aim[1] < pts[2][1]) pts.push(aim);
    pts.push([HOME, Math.min(-0.42, pts[pts.length - 1][1] - 0.3)], [HOME, -1.15]);
    R.W = { c: this.C3(pts) }; R.W.len = R.W.c.getLength();
  },
  end(L) { this.hideAll(); this.u.uLay.value = 0; this.pave.visible = false; },
  reset(L) { this.end(L); this.told = false; },

  // out = T(x, y, z) · R(yaw, then roll, then pitch in the bone's own plane) · the dog's size
  world(out, x, y, z, yaw, pitch = 0, roll = 0) { this.e.set(pitch, yaw, roll, 'YZX'); return out.compose(this.v.set(x, y, z), this.q.setFromEuler(this.e), this.s3.set(SC, SC, SC)); },
  // out = parent · T · R (yaw, pitch, roll) · scale
  child(out, parent, x, y, z, yaw = 0, pitch = 0, roll = 0, sx = 1, sy = 1, sz = 1) { this.e.set(pitch, yaw, roll, 'YXZ'); this.l.compose(this.v.set(x, y, z), this.q.setFromEuler(this.e), this.s3.set(sx, sy, sz)); return out.multiplyMatrices(parent, this.l); },
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
    const rig = this.rig, M = this.M, I = this.I, o = this.o, R = this.R, r = ret ? L.ret : 0;

    // ---- the pavement
    const lay = showing ? ramp(t, T_LAY[0], T_LAY[1]) : ret && R ? R.lay * (1 - ease.inOut(ramp(r, 0.56, 1))) : 0;
    this.u.uLay.value = lay; this.pave.visible = lay > 0.002;

    // ---- where the dog is
    let sit = 0;
    if (ret && R) {
      if (!R.show) o.vis = false;
      else if (R.rev) { const s = lerp(R.s0, 2 * LB, ease.inOut(ramp(r, 0, 0.8))); this.triple(this.A, s, o); o.phi = s / STRIDE * TAU; o.amp = Math.sin(Math.PI * ramp(r, 0, 0.8)); o.piv = 0; o.vis = true; }
      else {
        const k = ramp(r, 0.06, 0.36), s = 2 * LB + (R.W.len - 2 * LB) * ease.inOut(ramp(r, 0.34, 0.95));
        if (r < 0.34) { o.mu = this.o0.mu; o.mo = this.o0.mo; o.aF = R.aF + wrap(R.a1 - R.aF) * ease.inOut(ramp(k, 0, 0.86)); o.aH = R.aH + wrap(R.a1 - R.aH) * ease.inOut(ramp(k, 0.14, 1)); o.phi = TAU * 1.5 * smooth(k); o.piv = Math.sin(Math.PI * k) * Math.min(1, Math.abs(R.turn) / 0.6); o.pivR = R.turn / 6; o.amp = 0; }
        else { this.triple(R.W, s, o); o.phi = s / STRIDE * TAU; o.amp = clamp01(Math.sin(Math.PI * ramp(r, 0.34, 0.95)) * 2.4); o.piv = 0; }
        o.vis = true; sit = R.sit * (1 - ease.inOut(ramp(r, 0, 0.13)));
      }
    } else if (showing) {
      this.poseAt(t, o);
      sit = ease.inOut(ramp(t, T_SIT[0], T_SIT[1]));
    } else o.vis = false;
    const shown = o.vis && o.mo > -0.95 && (showing || ret);
    for (const i of this.all) rig.show(i, shown);
    let nb = 0;
    if (shown) {
      // ---- what it is doing (all from the show's clock, so any moment can be posed)
      const idle = showing && t > T_IDLE ? t - T_IDLE : -1, tau = idle >= 0 ? idle % PER : -1, tau2 = idle >= 0 ? idle % (2 * PER) : -1;
      const sniff = showing ? win(t, 1.72, 3.38, 0.34) : 0;
      const glance = tau2 >= 0 ? win(tau2, 5.0, 6.5, 0.4) : 0;                                        // up at the hand, while it stays
      const us = showing ? Math.max(win(t, 3.3, 4.5, 0.3), smooth(ramp(t, 6.85, 7.2)) * (1 - glance)) : 0;
      const hand = showing ? Math.max(win(t, 4.25, 5.25, 0.34), glance) : 0;
      const liftK = showing ? smooth(ramp(t, T_PAW[0], T_PAW[1])) * (1 - smooth(ramp(t, T_PAWDOWN[0], T_PAWDOWN[1]))) : 0;
      const alert = showing ? win(t, 3.3, 4.4, 0.3) : 0;
      const tilt = tau2 >= 0 ? 0.3 * win(tau2, 2.5, 3.9, 0.3) - 0.24 * win(tau2, 9.3, 10.5, 0.3) : 0;
      const bl = (showing ? t : 0) % 3.1, blink = hump(bl, 2.9, 3.06);
      const moving = Math.max(o.amp, o.piv);

      // ---- the body: the quarters from the hips, the forehand from the middle of the back
      const y0 = L.yawOut, yawF = y0 + o.aF, yawH = y0 + o.aH;
      const settle = showing ? 0.012 * hump(t, T_SIT[1] - 0.1, T_SIT[1] + 0.26) : 0;
      const bob = 0.009 * o.amp * Math.abs(Math.cos(o.phi)) + 0.004 * o.piv * Math.abs(Math.cos(o.phi));
      const breath = sit * Math.sin(TAU * 0.42 * t);
      const pH = -0.56 * sit + 0.05 * sniff, pF = -0.8 * sit + 0.3 * sniff + 0.04 * liftK + 0.012 * breath + 0.02 * o.amp * Math.sin(o.phi * 2);
      const hipY = (lerp(0.27, 0.112, sit) + bob - settle + 0.004 * sniff) * SC;
      // (sitting, the shoulders stay over the forefeet and the hips come in under)
      const span = LB * (2 - Math.cos(pH) - Math.cos(pF)) * 0.92, lean = 0.02 * SC * liftK;
      const hu = o.mu - Math.sin(o.aH) * (LB - span) + Math.sin(o.aF) * lean, ho = o.mo - Math.cos(o.aH) * (LB - span) + Math.cos(o.aF) * lean;
      L.floor(hu, ho, this.g);
      this.world(M.hind, this.g.x, L.y + hipY, this.g.z, yawH, pH, 0.02 * o.amp * Math.sin(o.phi));
      rig.mat(I.hind, M.hind);
      this.w.set(0, 0.005, 0.13).applyMatrix4(M.hind);
      this.world(M.fore, this.w.x, this.w.y, this.w.z, yawF, pF, -0.02 * o.amp * Math.sin(o.phi));
      rig.mat(I.fore, M.fore);

      // ---- the neck and the head: where it looks (the way it goes; us; the hand in the picture)
      this.nb.set(0, 0.028, 0.166).applyMatrix4(M.fore);
      const cam = L.k.G.camera.position, nbv = this.nb;
      const dUs = wrap(Math.atan2(cam.x - nbv.x, cam.z - nbv.z) - yawF), elUs = Math.max(-0.35, Math.min(0.45, Math.atan2(cam.y - (nbv.y + 0.1), Math.hypot(cam.x - nbv.x, cam.z - nbv.z))));
      L.at(HAND[0], HAND[1], 0.02, this.v); const hx = this.v.x, hy = this.v.y, hz2 = this.v.z;
      let dHand = wrap(Math.atan2(hx - nbv.x, hz2 - nbv.z) - yawF); if (dHand < -2.2 && showing && t < 5.3) dHand += TAU;      // (at the edge: back over its left shoulder)
      const elHand = Math.min(0.95, Math.atan2(hy - (nbv.y + 0.1), Math.hypot(hx - nbv.x, hz2 - nbv.z)));
      const lead = o.piv * Math.sign(o.pivR) * 0.5;                                                   // (its head goes first into a turn)
      let look = us * Math.max(-1.9, Math.min(1.9, dUs)) + hand * Math.max(-2.5, Math.min(2.5, dHand)) + lead * (1 - hand) + 0.2 * sniff * Math.sin(t * 5.2);
      look = Math.max(-2.5, Math.min(2.5, look));
      const ny = Math.max(-1.05, Math.min(1.05, look * 0.45)), hyaw = Math.max(-1.45, Math.min(1.45, look - ny));
      const neckP = Math.max(-1.3, Math.min(1.1, -0.62 + 1.66 * sniff - 0.38 * alert * (1 - hand) - 0.5 * hand - 0.3 * sit * (1 - hand) + 0.05 * o.amp * Math.sin(o.phi * 2) + 0.05 * sniff * Math.sin(t * 9)));
      const headP = Math.max(-0.95, Math.min(1.3, 0.2 + 1.04 * sniff - us * (elUs + 0.04) - hand * (elHand * 0.8 + 0.1) + 0.16 * sit * (1 - hand) + 0.04 * o.amp * Math.sin(o.phi * 2 + 1)));
      this.world(M.neck, nbv.x, nbv.y, nbv.z, yawF + ny, neckP, 0); rig.mat(I.neck, M.neck);
      this.w.set(0, 0, 0.11).applyMatrix4(M.neck);
      this.e.set(headP, yawF + ny + hyaw, tilt, 'YXZ'); M.head.compose(this.w, this.q.setFromEuler(this.e), this.s3.set(SC, SC, SC)); rig.mat(I.head, M.head);
      // its ears hang as the head turns under them, lift a little when it attends, and bounce at the trot
      for (let k = 0; k < 2; k++) {
        const s = k ? -1 : 1, flap = 0.1 + 0.2 * alert + 0.1 * us * sit + 0.22 * o.amp * Math.abs(Math.sin(o.phi + k)) + 0.1 * o.piv;
        this.child(M.ear[k], M.head, s * 0.0395, 0.016, 0.006, 0, -headP * 0.82 + 0.1 * alert, s * flap - tilt * 0.8);
        rig.mat(I.ear[k], M.ear[k]);
        this.child(M.tmp, M.head, s * this.eye[0], this.eye[1], this.eye[2] - 0.0028, s * this.eyeTurn[0], this.eyeTurn[1], -s * 0.12);
        this.child(M.lid[k], M.tmp, 0, 0, 0, 0, 1.25 * blink - 0.14 * alert - 0.1 * hand - 0.12 * sit * us, 0);
        rig.mat(I.lid[k], M.lid[k]);
      }

      // ---- the tail
      let wag = 0, tailP = -0.5;
      if (ret) wag = 0.3 * Math.sin(TAU * (calm ? 1.2 : 2.4) * (R.t + L.r));
      else {
        const rate = calm ? 1.4 : 2.8, go = (1 - smooth(ramp(t, 3.3, 3.75))) + smooth(ramp(t, 5.3, 5.8)) * (1 - sit);
        wag = 0.42 * go * Math.sin(TAU * rate * t);
        tailP = -0.5 + 0.34 * alert - 0.5 * hand * (1 - sit) - 0.12 * smooth(ramp(t, 5.3, 5.8));
        if (tau >= 0) wag = 0.6 * win(tau, 0.02, 1.52, 0.22) * Math.sin(TAU * (calm ? 0.75 : 1.5) * (tau - 0.1));
      }
      this.w.set(0, 0.038, -0.088).applyMatrix4(M.hind);
      this.world(M.tail[0], this.w.x, Math.max(L.y + 0.022 * SC, this.w.y), this.w.z, yawH + wag, lerp(tailP, -0.34, sit), 0); rig.mat(I.tail[0], M.tail[0]);
      this.child(M.tail[1], M.tail[0], 0, 0, -0.098, wag * 0.9, lerp(0.34, 0.32, sit), 0); rig.mat(I.tail[1], M.tail[1]);

      // ---- the legs: each foot put where it should be, and the leg made to reach it
      const A4 = STRIDE / 4 * o.amp, len = this.len;
      for (let k = 0; k < 4; k++) {
        const front = k < 2, s = k % 2 ? -1 : 1, yaw = front ? yawF : yawH, sn = Math.sin(yaw), cs = Math.cos(yaw);
        const J = this.j; if (front) J.set(s * 0.041, -0.03, 0.128).applyMatrix4(M.fore); else J.set(s * 0.048, -0.005, -0.02).applyMatrix4(M.hind);
        const f = step(o.phi / TAU + (k === 1 || k === 2 ? 0.5 : 0));
        // the foot on the floor: under its joint; at the trot ahead and behind it; turning, to the side; sitting, set for that
        let fz = (front ? 0.012 + 0.02 * sit : lerp(-0.035, 0.118, sit)) * SC + A4 * f.g, lx = s * (front ? 0.006 : lerp(0.008, 0.034, sit)) * SC + (front ? 1 : -1) * o.pivR * LB * o.piv * f.g;
        let lift = (0.03 * o.amp + 0.02 * o.piv) * SC * f.h;
        let flex = 0.7 * f.h * o.amp;
        if (front && showing) {          // (a small shuffle as it sits down)
          const sh = hump(t, T_SIT[0] + (s > 0 ? 0.05 : 0.2), T_SIT[0] + (s > 0 ? 0.25 : 0.4)); lift += 0.012 * SC * sh;
        }
        if (k === 1) { fz += 0.085 * SC * liftK; lift += (0.07 + 0.004 * Math.sin(t * 7)) * SC * liftK; flex += 0.95 * liftK; }      // its right forepaw, out over the edge
        const gx = J.x + lx * cs + fz * sn, gz = J.z - lx * sn + fz * cs, W = this.w;
        if (front) {
          W.set(gx, L.y + len.PAWH + lift, gz);
          const ik = this.solve(J, W, yaw, len.AF, len.BF, -1);
          this.world(M.up[k], J.x, J.y, J.z, yaw, ik.p1, ik.roll); rig.mat(I.up[k], M.up[k]);
          this.child(M.lo[k], M.up[k], 0, -0.088, 0, 0, ik.p2, 0); rig.mat(I.lo[k], M.lo[k]);
          this.v.set(0, -0.15, 0).applyMatrix4(M.lo[k]); const wx = this.v.x, wy = this.v.y, wz = this.v.z;
          this.world(M.paw[k], wx, wy, wz, yaw, flex, 0); rig.mat(I.paw[k], M.paw[k]);
        } else {
          // the hind foot: the hock over the paw when it stands; laid forward along the floor when it sits; trailing in the air
          const gam = lerp(0, 1.42, sit) - 0.55 * f.h * o.amp, jy = L.y + len.PAWH + lift, hk = len.MT;
          W.set(gx - Math.sin(gam) * hk * sn, jy + Math.cos(gam) * hk, gz - Math.sin(gam) * hk * cs);
          const ik = this.solve(J, W, yaw, len.AH, len.BH, 1);
          this.world(M.up[k], J.x, J.y, J.z, yaw, ik.p1, ik.roll); rig.mat(I.up[k], M.up[k]);
          this.child(M.lo[k], M.up[k], 0, -0.115, 0, 0, ik.p2, 0); rig.mat(I.lo[k], M.lo[k]);
          this.v.set(0, -0.115, 0).applyMatrix4(M.lo[k]); const hx2 = this.v.x, hy2 = this.v.y, hz3 = this.v.z;
          this.world(M.ft[k - 2], hx2, hy2, hz3, yaw, -gam, 0); rig.mat(I.ft[k - 2], M.ft[k - 2]);
          this.world(M.paw[k], gx, jy, gz, yaw, 0.5 * f.h * o.amp, 0); rig.mat(I.paw[k], M.paw[k]);
        }
      }

      // ---- its shadow on the tiles
      this.w.set(0, 0, 0.1).applyMatrix4(M.fore); this.blobs.set(nb++, this.w.x, this.w.z, 0.125 * SC, 0.55);
      this.w.set(0, 0, 0.0).applyMatrix4(M.hind); this.blobs.set(nb++, this.w.x, this.w.z, (0.12 + 0.03 * sit) * SC, 0.55);
      this.w.set(0, 0, 0.06).applyMatrix4(M.head); this.blobs.set(nb++, this.w.x, this.w.z, 0.07 * SC, 0.3 + 0.2 * sniff);

      // ---- its feet on the tiles, as they fall
      if (showing && !L.quiet && this.lastT >= 0 && o.mo > 0.05) {
        const st = Math.floor(o.phi / Math.PI);
        if (st !== this.lastStep && moving > 0.25) { const v = L.voice(); v.note(2100 + 300 * (st % 2), 0.03, { vol: 0.0035 * moving, type: 'sine', attack: 0.002 }); v.note(190, 0.05, { vol: 0.006 * moving, type: 'sine', attack: 0.003, to: 120 }); }
        this.lastStep = st;
      }
    }
    this.blobs.count = nb;
    if (showing) this.score.play(t);
    L.voice().place();
    this.lastT = showing ? t : this.lastT;
  },
});
