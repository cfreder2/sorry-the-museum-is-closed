// Francisco Goya, Boy on a Ram (1786–87), Gallery 217. The word: bleat.
//
// A cartoon for a tapestry for the royal palace: a small boy in a striped suit, a pink sash and a great ruffled collar,
// a straw hat with a blue lining and a pink bow, riding a big dark ram with a bell at its throat and holding his switch
// up, against a soft sky. Look at it and his sandy path comes out from under the picture across the floor, in Goya's
// light, feathery strokes, its edges going to green. A bell clanks inside the wall, and the ram trots out with the boy on
// its back, switch up, his legs swinging, the bell going with every stride. It stops broadside, as it stands in the
// picture; the boy lurches forward, his hat slips; the ram lowers its head, draws itself up, lifts its chin and BLEATS,
// a long quavering baa, its jaw going, its fleece shivering, the bell ringing; the boy throws his switch up and laughs
// and his hat jumps. From under the picture three lambs answer, meh, meh, meh, leaping out one after another, and fall
// in behind. Then a minuet starts (Petzold's Minuet in G, 1725, on a pipe, a courtly dance for a court cartoon) and the
// ram leads them round the floor in time with it, trotting on the beat, the lambs leaping in canon, one to a beat, and
// the boy conducting with his switch. When you stop, the ram trots back to the wall and in under the picture, and the
// lambs leap in after it, and the path goes back in.
//
// The ram and the lambs are smooth bodies under a shell of soft dabs of paint (his fleece, as he brushed it); the boy's
// clothes are painted in his stripes. Everything stays on the floor below the frame: nothing climbs the wall.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { strokes } from './brush.js';
import { score, Bones, hump, turnTo, noise } from './stagecraft.js';

const TAU = Math.PI * 2;
const SC = 1.2, LS = 1.42, BOY = 1.1;           // the ram (and the boy on it: 0.76 m to the top of his hat), the lambs
const OUT = 1.7, HALF = 1.3;                    // the floor the ground may cover: out from the wall, either side of the middle (m)
const PATCH = { u: -0.02, out: 0.74, ru: 1.16, ro: 0.72 };     // his ground: its middle and its reach (along, out)
const HOME = -0.16;                             // where the ram comes out from under the picture (along the wall)
const T_OUT = 0.55, T_HALT = 4.0, T_BLEAT = 4.55, BLEAT = 1.1, T_GO = 6.75;
const TL = [5.75, 6.05, 6.35], LAMB_IN = 1.2, LAMB_U = [0.06, -0.3, -0.62];
const BPM = 132, BEAT = 60 / BPM, T_MUS = 6.6;
const V = 0.3, STRIDE = 2 * V * BEAT;           // on the loop the ram trots one step to a beat
const GAP0 = 0.5, GAP = 0.32;                    // the lambs behind the ram, and behind each other
const CAM = [0.12, 2.45];                        // the look camera, along and out: the boy turns to it
// The way out (along, out) to where it stops broadside, and the round it leads the lambs (closed; starts where it stopped).
const LOOP = [[0.34, 0.95], [0.7, 1.02], [0.74, 1.16], [0.2, 1.22], [-0.45, 1.18], [-0.8, 1.0], [-0.56, 0.8], [-0.04, 0.8]];
// Christian Petzold, Minuet in G (1725), the melody and a bass a bar, on a pipe and a plucked string.
const MIN = 'D5 G4:.5 A4:.5 B4:.5 C5:.5 | D5 G4 G4 | E5 C5:.5 D5:.5 E5:.5 F#5:.5 | G5 G4 G4 | C5 D5:.5 C5:.5 B4:.5 A4:.5 | B4 C5:.5 B4:.5 A4:.5 G4:.5 | F#4 G4:.5 A4:.5 B4:.5 G4:.5 | A4:3 |'
  + ' D5 G4:.5 A4:.5 B4:.5 C5:.5 | D5 G4 G4 | E5 C5:.5 D5:.5 E5:.5 F#5:.5 | G5 G4 G4 | C5 D5:.5 C5:.5 B4:.5 A4:.5 | B4 C5:.5 B4:.5 A4:.5 G4:.5 | A4 B4:.5 A4:.5 G4:.5 F#4:.5 | G4:3';
const MIN_BASS = 'G3 B3 D4 | G3 B3 D4 | C4 E4 C4 | B3 D4 B3 | A3 C4 A3 | G3 B3 G3 | D3 F#3 D3 | D3 F#3 A3 | G3 B3 D4 | G3 B3 D4 | C4 E4 C4 | B3 D4 B3 | A3 C4 A3 | G3 B3 G3 | D3 F#3 D3 | G3 D3 G2';

const smoothStart = (x, a) => (x <= 0 ? 0 : x < a ? (x * x) / (2 * a) : x - a / 2);

lifeFor(111559, {
  title: /^Boy on a Ram/,
  word: 'bleat',
  stage: { out: 1.6, half: 1.3, cam: { dist: CAM[1], height: 0.76, side: CAM[0], fov: 66, lookU: 0.16, lookOut: 0.9, lookH: 0.8 } },
  wake: 2, ret: 2.6,

  build(L) {
    const P = L.pal, col = (h, a = 0.15) => P.near(h, a);
    const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
    this.v = V3(); this.w = V3(); this.d = V3(); this.sc = V3();
    this.B = new Bones();
    const M = () => new THREE.Matrix4();
    this.M = { root: M(), head: M(), jaw: M(), bell: M(), knot: M(), up: [M(), M(), M(), M()], lo: [M(), M(), M(), M()], seat: M(), torso: M(), arm: M(), hat: M(), legL: M(), legR: M(), lamb: [M(), M(), M()], ll: [0, 1, 2].map(() => [M(), M(), M(), M()]) };

    // ---------------------------------------------------------- his ground, spilled out of the foot of the picture
    // A patch of the picture's own sandy ochre (sampled from its foreground), only under where they go: his dabs laid
    // one way, a scumbled olive margin, and an edge that wanders and breaks up stroke by stroke. A tongue of it runs
    // back under the frame, where it comes from.
    const sand = strokes({
      size: 512, seed: 111559, n: 3200, len: [10, 26], width: [7, 13], bend: 0.3, lift: 0.18, base: col('#947e53', 0.1).getStyle(),
      colors: [['#9c8558', 3], ['#8c774e', 3], ['#a68e5e', 2.4], ['#b09566', 1.6], ['#857048', 1.6], ['#bca274', 0.7], ['#8e8064', 0.9], ['#a0805a', 0.9]].map(([c, w]) => [col(c, 0.1).getStyle(), w]),
      angle: (x, y, r) => (r() - 0.5) * 0.45 + 0.35,
    });
    const green = strokes({
      size: 256, seed: 1786, n: 1300, len: [12, 30], width: [5, 11], bend: 0.35, lift: 0.15, base: col('#55603e', 0.2).getStyle(),
      colors: [['#606c46', 3], ['#4e5c3a', 3], ['#727a52', 2], ['#46523a', 2], ['#56766e', 1], ['#7a7450', 1.5], ['#5a4e34', 1.2]].map(([c, w]) => [col(c, 0.2).getStyle(), w]),
      angle: (x, y, r) => (r() - 0.5) * 0.6 + 0.35,
    });
    {
      const F = (u, o) => L.floor(u, o, V3()).toArray(), pos = [];
      const a = F(-HALF, -L.wall), b = F(HALF, -L.wall), c = F(HALF, OUT), d = F(-HALF, OUT);
      pos.push(...a, ...b, ...c, ...a, ...c, ...d);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const u = this.u = { uSpread: { value: 0 }, tSand: { value: sand }, tGreen: { value: green }, uO: { value: L.floor(0, -L.wall) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uC: { value: new THREE.Vector4(PATCH.u, PATCH.out, PATCH.ru, PATCH.ro) }, uHome: { value: HOME } };
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
      m.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, u);
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform float uSpread, uHome; uniform vec3 uO; uniform vec4 uAx, uC; uniform sampler2D tSand, tGreen; vec3 fCol; float fA;')
          .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz; float su = dot(lq, uAx.xy), so = dot(lq, uAx.zw);
  vec4 s1 = texture2D(tSand, vec2(su, so) / 0.8), s2 = texture2D(tSand, vec2(su, so) / 1.9 + 0.27), g1 = texture2D(tGreen, vec2(su, so) / 0.6 + 0.41);
  // its outline: an irregular round, wandering, with a tongue back under the frame; broken by the strokes themselves
  vec2 d = vec2((su - uC.x) / uC.z, (so - uC.y) / uC.w); float ang = atan(d.y, d.x), rr = length(d);
  float wob = 1.0 + 0.15 * sin(3.0 * ang + 1.3) + 0.09 * sin(5.0 * ang + 0.4) + 0.05 * sin(9.0 * ang + 2.1);
  float e = rr / wob - 0.45 * exp(-max(so, 0.0) / 0.3) * exp(-pow((su - uHome) / 0.5, 2.0)) + (s1.a - 0.55) * 0.3 + (g1.a - 0.55) * 0.18;
  float core = 1.0 - smoothstep(0.66, 0.74, e), rim = 1.0 - smoothstep(0.8, 0.9, e);
  vec3 c = mix(g1.rgb * 0.9, mix(s1.rgb, s2.rgb, 0.3), core);
  // his soft light on the middle of it, a little cooler and darker towards its edge
  c *= mix(0.86, 1.04, exp(-rr * rr * 1.6));
  float id = mix(g1.a, s1.a, core);
  float grow = length(vec2((su - uHome) / uC.z, so / uC.w));
  fA = smoothstep(0.0, 0.03, uSpread * 1.35 - (grow * 0.8 + id * 0.2)) * rim * mix(0.6, 0.94, core);
  fCol = c;
}`)
          .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
      };
      m.customProgramCacheKey = () => 'goya-ground';
      this.path = new THREE.Mesh(g, m); this.path.position.y = 0.016; this.path.renderOrder = 5; L.add(this.path);
    }

    // ---------------------------------------------------------- shapes: smooth bodies under soft dabs of paint
    const own = (g, c) => {
      g = g.index ? g.toNonIndexed() : g;
      for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n);
      const a = new Float32Array(g.attributes.position.count * 3), cc = new THREE.Color(c);
      for (let i = 0; i < a.length; i += 3) { a[i] = cc.r; a[i + 1] = cc.g; a[i + 2] = cc.b; }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
    };
    const ell = (C, R, c, detail = 2, rx = 0) => shape.move(shape.ball(1, c, detail), C[0], C[1], C[2], rx, 0, 0, R[0], R[1], R[2]);
    const limb = (a, b, r0, r1, c, seg = 8, rings = 1) => {
      const A = V3(...a), Bv = V3(...b), len = A.distanceTo(Bv), g = own(new THREE.CylinderGeometry(r1, r0, len, seg, rings), c);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), Bv.clone().sub(A).normalize()));
      const m = A.clone().add(Bv).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return g;
    };
    // A point on an ellipsoid (centre C, radii R) at height y (-1..1) and angle ph, with its outward normal.
    const onEll = (C, R, y, ph) => {
      const s = Math.sqrt(Math.max(0, 1 - y * y)), p = V3(C[0] + R[0] * s * Math.cos(ph), C[1] + R[1] * y, C[2] + R[2] * s * Math.sin(ph));
      return { p, n: V3((p.x - C[0]) / (R[0] * R[0]), (p.y - C[1]) / (R[1] * R[1]), (p.z - C[2]) / (R[2] * R[2])).normalize() };
    };
    const tangent = (n, a) => { const ref = Math.abs(n.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0), t1 = V3().crossVectors(n, ref).normalize(), t2 = V3().crossVectors(n, t1); return t1.multiplyScalar(Math.cos(a)).addScaledVector(t2, Math.sin(a)); };
    const inside = (p, list, k = 0.82) => list.some(([C, R]) => ((p.x - C[0]) / R[0]) ** 2 + ((p.y - C[1]) / R[1]) ** 2 + ((p.z - C[2]) / R[2]) ** 2 < k);
    // Dabs: each a soft rounded lozenge of paint lying on the form, its lower edge lifted off it, the middle a little
    // lighter (the loaded brush). list: { p, n, up, l, w, lift, c }
    const dabs = list => {
      const pos = [], nor = [], cl = [], side = V3(), up = V3(), cen = V3(), rim = Array.from({ length: 8 }, () => V3()), lc = new THREE.Color();
      for (const d of list) {
        side.crossVectors(d.n, d.up).normalize(); up.crossVectors(side, d.n).normalize();
        cen.copy(d.p).addScaledVector(d.n, 0.0025);
        for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + 0.26, x = Math.cos(a) * d.w / 2, y = Math.sin(a) * d.l / 2; rim[k].copy(cen).addScaledVector(side, x * (1 - 0.25 * Math.max(0, Math.sin(a)))).addScaledVector(up, y).addScaledVector(d.n, d.lift * d.l * Math.max(0, -Math.sin(a)) - 0.0015); }
        lc.copy(d.c).multiplyScalar(1.02);
        for (let k = 0; k < 6; k++) {
          for (const [q, c] of [[cen, lc], [rim[k], d.c], [rim[(k + 1) % 6], d.c]]) { pos.push(q.x, q.y, q.z); nor.push(d.n.x, d.n.y, d.n.z); cl.push(c.r, c.g, c.b); }
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
      return g;
    };
    // Curls: a crescent stroke of lighter paint lying on the fleece, tapering at both ends, as he flicks the light onto
    // the wool. list: { p, n, up, r (the curl's radius), w (the stroke's width), c }
    const curls = list => {
      const pos = [], nor = [], cl = [], side = V3(), up = V3(), dir = V3(), rows = Array.from({ length: 7 }, () => [V3(), V3()]);
      for (const d of list) {
        side.crossVectors(d.n, d.up).normalize(); up.crossVectors(side, d.n).normalize();
        const a0 = d.a0 == null ? 0.4 : d.a0, span = d.span || 3.4;
        for (let k = 0; k <= 6; k++) {
          const a = a0 + span * k / 6, tp = Math.pow(Math.sin(Math.PI * k / 6), 0.6) * d.w / 2;
          dir.copy(side).multiplyScalar(Math.cos(a)).addScaledVector(up, Math.sin(a));
          rows[k][0].copy(d.p).addScaledVector(dir, d.r - tp).addScaledVector(d.n, 0.004); rows[k][1].copy(d.p).addScaledVector(dir, d.r + tp).addScaledVector(d.n, 0.0055);
        }
        for (let k = 0; k < 6; k++) {
          const [a, b] = rows[k], [c, e] = rows[k + 1];
          for (const q of [a, b, e, a, e, c]) { pos.push(q.x, q.y, q.z); nor.push(d.n.x, d.n.y, d.n.z); cl.push(d.c.r, d.c.g, d.c.b); }
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
      return g;
    };
    // Marks round a tube from a to b (radius r0 to r1): n of them, keep(t, ph) (t along it, ph round it), each laid along
    // the tube (turned by twist), coloured tone(t, ph, r). For stripes down a sleeve.
    const tubeMarks = (a, b, r0, r1, n, tone, { keep = null, twist = 0, l = [0.02, 0.03], w = [0.006, 0.009], lift = [0.02, 0.08] } = {}) => {
      const A = V3(...a), Bv = V3(...b), ax = Bv.clone().sub(A), len = ax.length(); ax.normalize();
      const e1 = V3().crossVectors(ax, Math.abs(ax.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0)).normalize(), e2 = V3().crossVectors(ax, e1), list = [];
      for (let i = 0; i < n; i++) {
        const t = L.rand(), ph = L.rand() * TAU; if (keep && !keep(t, ph)) continue;
        const nn = e1.clone().multiplyScalar(Math.cos(ph)).addScaledVector(e2, Math.sin(ph)), r = lerp(r0, r1, t);
        const tg = V3().crossVectors(nn, ax).normalize();
        list.push({ p: A.clone().addScaledVector(ax, t * len).addScaledVector(nn, r), n: nn, up: ax.clone().multiplyScalar(Math.cos(twist)).addScaledVector(tg, Math.sin(twist)), l: lerp(l[0], l[1], L.rand()), w: lerp(w[0], w[1], L.rand()), lift: lerp(lift[0], lift[1], L.rand()), c: tone(t, ph, L.rand()) });
      }
      return list;
    };
    // A coat of dabs over an ellipsoid: n of them, tone(n, p, r) their colour; keep(p, n) to leave some out.
    const fleece = (C, R, n, tone, { l = [0.032, 0.05], w = [0.026, 0.04], lift = [0.08, 0.26], keep = null, lean = null, dir = null, grow = 1.0, curl = 0 } = {}) => {
      const list = [];
      for (let i = 0; i < n; i++) {
        const s = onEll(C, [R[0] * grow, R[1] * grow, R[2] * grow], 1 - 2 * L.rand(), L.rand() * TAU);
        if (keep && !keep(s.p, s.n)) continue;
        const up = dir ? V3().crossVectors(s.n, dir(s.p, s.n)).normalize() : tangent(s.n, lean ? lean(s.p, s.n) : L.rand() * TAU);
        list.push({ p: s.p, n: s.n, up, l: lerp(l[0], l[1], L.rand()), w: lerp(w[0], w[1], L.rand()), lift: lerp(lift[0], lift[1], L.rand()), c: tone(s.n, s.p, L.rand()), r: curl * (0.7 + 0.6 * L.rand()), a0: L.rand() * TAU, span: 2.6 + L.rand() * 1.6 });
      }
      return list;
    };
    // Each vertex its own colour, from where it is (so a pattern runs smoothly over a form, never facet by facet).
    const vpaint = (g, fn) => { const p = g.attributes.position, c = g.attributes.color, v = V3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = fn(v); c.setXYZ(i, k.r, k.g, k.b); } c.needsUpdate = true; return g; };
    const pick = (list, r) => list[Math.min(list.length - 1, Math.floor(r * list.length))];
    const KEY = V3(-0.35, 0.85, 0.4).normalize();          // his light, from high on the left
    const toneOf = (hi, mid, lo) => (n, p, r) => { const k = n.dot(KEY) + (r - 0.5) * 0.25; return pick(k > 0.5 ? hi : k > 0.05 ? mid : lo, (r * 7.31) % 1); };

    // ---------------------------------------------------------- the ram
    const rig = this.rig = L.rig(40, 110000, L.paint({ glow: 0.4, rough: 0.88, side: THREE.DoubleSide }));
    const woolHi = ['#6a4c34', '#76563c', '#5e4430', '#80604a'].map(c => col(c)), woolMid = ['#45322a', '#4c3626', '#3e2e24', '#4a3428'].map(c => col(c)), woolLo = ['#2a1f18', '#30241b', '#352820', '#261d17', '#363034'].map(c => col(c));
    const ramWool0 = toneOf(woolHi, woolMid, woolLo), under = col('#2a1f17'), wmix = new THREE.Color();
    // (each dab drawn halfway to the tone of the fleece where it lies, so they sit together as one soft mass)
    const WD = col('#251b15'), WM = col('#3a2a20'), WH = col('#56402e');
    const fleeceTone = (n, into = new THREE.Color()) => { const k = n.dot(KEY); return k < 0 ? into.copy(WD).lerp(WM, THREE.MathUtils.smoothstep(k, -0.6, 0)) : into.copy(WM).lerp(WH, THREE.MathUtils.smoothstep(k, 0, 0.8)); };
    const ramWool = (n, p, r) => ramWool0(n, p, r).clone().lerp(fleeceTone(n, wmix), 0.78);
    // the light on it: curls of warm brown, thickest where the light falls, a few cool ones from the sky in the shade
    const curlTone = (n, p, r) => { const k = n.dot(KEY) + (r - 0.5) * 0.3; return k > 0.35 ? pick(woolHi, r) : k > -0.1 ? pick(woolMid, r).clone().lerp(woolHi[0], 0.4) : col('#4a4650').clone().lerp(WD, 0.4); };
    const lightKeep = (p, n) => n.dot(KEY) > -0.35 || L.rand() < 0.25;
    {
      const BODY = [[0, 0.24, -0.01], [0.112, 0.108, 0.195]], CHEST = [[0, 0.27, 0.13], [0.092, 0.102, 0.09]], RUMP = [[0, 0.255, -0.13], [0.104, 0.1, 0.09]];
      const smoothFleece = g => vpaint(g, v => fleeceTone(V3(v.x, v.y - 0.24, v.z * 0.6).normalize()).clone().multiplyScalar(0.8));
      const parts = [smoothFleece(ell(...BODY, under, 2)), smoothFleece(ell(...CHEST, under)), smoothFleece(ell(...RUMP, under))];
      const all = [BODY, CHEST, RUMP], wl = [];
      const WL = { l: [0.022, 0.034], w: [0.018, 0.027], lift: [0.12, 0.34] };
      wl.push(...fleece(...BODY, 880, ramWool, { ...WL, keep: p => !inside(p, [CHEST, RUMP]) }));
      wl.push(...fleece(...CHEST, 230, ramWool, { ...WL, keep: p => !inside(p, [BODY]) }));
      wl.push(...fleece(...RUMP, 170, ramWool, { ...WL, keep: p => !inside(p, [BODY]) }));
      const CU = { l: [0, 0], w: [0.005, 0.008], curl: 0.009, keep: lightKeep };
      const cl = [...fleece(...BODY, 300, curlTone, { ...CU, grow: 1.08, keep: (p, n) => lightKeep(p, n) && !inside(p, [CHEST, RUMP], 1.1) }), ...fleece(...CHEST, 80, curlTone, { ...CU, grow: 1.08, keep: (p, n) => lightKeep(p, n) && !inside(p, [BODY], 1.1) }), ...fleece(...RUMP, 70, curlTone, { ...CU, grow: 1.08, keep: (p, n) => lightKeep(p, n) && !inside(p, [BODY], 1.1) })];
      parts.push(curls(cl));
      const TAIL = [[0, 0.27, -0.222], [0.034, 0.042, 0.03]]; parts.push(ell(...TAIL, under)); wl.push(...fleece(...TAIL, 16, ramWool, { l: [0.022, 0.03], w: [0.018, 0.026] }));
      parts.push(dabs(wl));
      this.gBody = rig.geo(shape.merge(parts));
      void all;
    }
    let gold0;
    {
      // the head, from the top of the neck: a woolly neck and poll, a long Roman-nosed face sloping down to a soft muzzle,
      // amber eyes set back high on the side, ears drooping out sideways, and the horns, heavy ridged spirals curling
      // back, down and forward beside the head; his yellow collar
      const NECK = [[0, -0.02, -0.03], [0.064, 0.078, 0.072]], CRAN = [[0, 0.04, 0.025], [0.046, 0.05, 0.05]];
      const FD = col('#2c2119'), FM = col('#47342a'), FL = col('#6e5038');
      // the face lit as he lights it: warm along the bridge and the lit cheek, dark beneath
      const faceTone = (v, C) => { const n = V3(v.x - C[0], v.y - C[1], v.z - C[2]).normalize(), k = n.dot(KEY) + 0.25 * n.y; return (k < 0.1 ? FD.clone().lerp(FM, THREE.MathUtils.smoothstep(k, -0.5, 0.1)) : FM.clone().lerp(FL, THREE.MathUtils.smoothstep(k, 0.1, 0.9))); };
      const facePart = (C, R, rx = 0) => vpaint(ell(C, R, FM, 2, rx), v => faceTone(v, C));
      const parts = [ell(...NECK, under), facePart(...CRAN)];
      parts.push(facePart([0, 0.0, 0.08], [0.034, 0.042, 0.064], 0.66));                 // the long face
      parts.push(facePart([0, 0.026, 0.074], [0.026, 0.03, 0.056], 0.5));             // the Roman nose, arched
      parts.push(facePart([0, -0.03, 0.114], [0.023, 0.025, 0.024]));                   // the muzzle
      for (const s of [-1, 1]) parts.push(ell([s * 0.009, -0.03, 0.138], [0.004, 0.006, 0.003], col('#1a120e', 0.05), 1, 0.4));     // nostrils
      parts.push(ell([0, -0.05, 0.11], [0.016, 0.007, 0.026], col('#5a2420', 0.1), 1, 0.55));          // the mouth, seen when it opens
      for (const s of [-1, 1]) {
        parts.push(ell([s * 0.041, 0.047, 0.05], [0.007, 0.0095, 0.0095], col('#c08436', 0.1), 1));          // his amber eyes, set back
        parts.push(ell([s * 0.0455, 0.047, 0.051], [0.003, 0.0032, 0.0066], col('#140e0a', 0.05), 1));
        parts.push(ell([s * 0.042, 0.056, 0.05], [0.007, 0.003, 0.011], FL, 1));                             // the brow over it
        parts.push(shape.move(vpaint(ell([0, 0, 0], [0.034, 0.008, 0.015], FM, 2), v => (v.y > 0 ? FM : FD)), s * 0.062, 0.03, 0.012, 0, s * 0.25, -s * 0.62));     // the ear, drooping
        // a horn: a heavy ridged spiral, from the top of the head back, down round the ear and forward, beside the head
        const pts = [], N = 30, turns = 1.85 * Math.PI;
        for (let i = 0; i <= N; i++) { const q = i / N, a = q * turns, r = 0.054 * (1 - 0.6 * q); pts.push(V3(s * (0.036 + 0.066 * Math.sqrt(q)), 0.026 + r * Math.cos(a), -0.004 - r * Math.sin(a))); }
        const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 1, 8, false), tp = tube.attributes.position, tn = tube.attributes.normal;
        for (let i = 0; i < tp.count; i++) {      // (tapering: the tube's radius 1, scaled down along it)
          const seg = Math.floor(i / 9) / 48, r = 0.024 * (1 - 0.68 * seg), c = new THREE.Vector3(); tube.parameters.path.getPointAt(Math.min(1, seg), c);
          tp.setXYZ(i, c.x + tn.getX(i) * r, c.y + tn.getY(i) * r, c.z + tn.getZ(i) * r);
        }
        const horn = own(tube, col('#9a8460'));
        shape.paint(horn, (c, n, f) => (Math.floor(f / 16) % 2 === 0 ? col('#7a6646') : n.dot(KEY) > 0.3 ? col('#bca880') : null));
        parts.push(horn);
      }
      // wool on the poll and down the neck
      const wl = [...fleece(...NECK, 230, ramWool, { l: [0.02, 0.03], w: [0.017, 0.025], lift: [0.12, 0.34], keep: p => !inside(p, [CRAN], 1.0) }), ...fleece(...CRAN, 70, ramWool, { keep: (p, n) => n.z < 0.05 && n.y > -0.1 && Math.abs(n.x) < 0.75, l: [0.018, 0.028], w: [0.016, 0.024] })];
      parts.push(dabs(wl));
      parts.push(curls(fleece(...NECK, 90, curlTone, { l: [0, 0], w: [0.005, 0.008], curl: 0.009, grow: 1.08, keep: (p, n) => lightKeep(p, n) && !inside(p, [CRAN], 1.1) })));
      // his collar: a band of yellow cloth round the neck, a fold where it gathers at the throat
      const gold = ['#b49a48', '#c8ae58', '#9e8640', '#d4bc6a'].map(c => col(c, 0.1)); gold0 = gold[1];
      {
        const NA = 40, NV = 6, pos = [], idx = [];
        for (let i = 0; i <= NA; i++) for (let j = 0; j <= NV; j++) {
          const th = (i / NA) * TAU, v = j / NV, front = Math.exp(-Math.pow(Math.atan2(Math.sin(th - Math.PI / 2), Math.cos(th - Math.PI / 2)) / 0.3, 2));
          const bulge = 1 + 0.07 * Math.sin(Math.PI * v) + 0.1 * front * Math.sin(Math.PI * v) * (1 + 0.5 * Math.sin(v * TAU * 1.5));
          pos.push(Math.cos(th) * 0.069 * bulge, (v - 0.5) * 0.026 - 0.012 * front, Math.sin(th) * 0.08 * bulge);
        }
        for (let i = 0; i < NA; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
        const band = own(g, gold[0]); shape.move(band, 0, -0.05, -0.012, -0.75, 0, 0);
        vpaint(band, v => gold[1].clone().lerp(gold[2], 0.5 + 0.5 * Math.sin(v.x * 160 + v.z * 40)).lerp(gold[3], THREE.MathUtils.smoothstep(v.y, -0.06, -0.02) * 0.4));
        parts.push(band);
      }
      this.gHead = rig.geo(shape.merge(parts));
      this.gJaw = rig.geo(vpaint(ell([0, -0.012, 0.036], [0.02, 0.01, 0.038], FM, 2, 0.55), () => FD));
      // the bell, silver, hanging from the knot
      const bell = shape.lathe([[0.003, 0.004], [0.007, 0], [0.012, -0.006], [0.0155, -0.02], [0.019, -0.033], [0.023, -0.04], [0.0001, -0.04]], 14, col('#cfcfc6', 0.05));
      shape.paint(bell, (c, n) => (n.x < -0.3 && n.z > -0.2 ? col('#f4f2ea', 0.05) : n.x > 0.5 ? col('#8a8a84', 0.05) : c.y < -0.037 ? col('#4a4a46', 0.05) : null));
      this.gKnot = rig.geo(shape.merge([ell([0, 0.006, 0], [0.018, 0.013, 0.013], gold0, 1), ell([0.012, -0.004, 0.004], [0.01, 0.016, 0.006], gold0.clone().multiplyScalar(0.85), 1)]));
      this.gBell = rig.geo(shape.merge([bell, ell([0, -0.041, 0], [0.006, 0.006, 0.006], col('#5a5a54', 0.05), 1), own(new THREE.TorusGeometry(0.005, 0.0017, 4, 8), col('#9a9a90', 0.05))]));
      // legs: a woolly forearm or thigh, and a slim shank down to the hoof, pale at the fetlock as he paints it
      const up = [limb([0, 0.01, 0], [0, -0.085, 0], 0.031, 0.022, under)];
      up.push(dabs(fleece([0, -0.03, 0], [0.031, 0.05, 0.029], 40, ramWool, { l: [0.018, 0.026], w: [0.016, 0.022], keep: p => p.y > -0.075 })));
      up.push(curls(fleece([0, -0.03, 0], [0.031, 0.05, 0.029], 14, curlTone, { l: [0, 0], w: [0.004, 0.006], curl: 0.007, grow: 1.12, keep: p => p.y > -0.07 })));
      this.gUp = rig.geo(shape.merge(up));
      const shank = limb([0, 0, 0], [0, -0.068, 0], 0.0125, 0.0105, col('#33261c'));
      shape.paint(shank, c => (c.y < -0.054 ? col('#7a6a56') : null));
      this.gLo = rig.geo(shape.merge([shank, limb([0, -0.066, 0.002], [0, -0.082, 0.006], 0.0115, 0.0135, col('#1e1814')), ell([0, -0.056, 0], [0.0128, 0.007, 0.0128], col('#86765e'), 1)]));
    }

    // ---------------------------------------------------------- the boy
    const jacket = ['#c45a32', '#d0683a', '#b84e2c', '#dc7a44'].map(c => col(c)), stripe = ['#34452f', '#2c3b2a', '#3e4c36', '#47503a'].map(c => col(c, 0.1)), sash = col('#c97a7a', 0.1), sashHi = col('#e0a0a0', 0.1);
    const white = ['#f2ede2', '#e8e2d4', '#fbf7ee'].map(c => col(c, 0.1)), whiteSh = ['#c8c8cc', '#b8bcc8', '#d4d0c8'].map(c => col(c, 0.1));
    const skin = col('#eec4a2', 0.1), cheek = col('#e49a86', 0.1), hair = ['#a8643a', '#c07a48', '#8e5230'].map(c => col(c, 0.1));
    // his suit: orange-red, warm and cool by turns, crossed by dark green stripes running on the slant, soft-edged
    const SJ = new THREE.Color();
    const striped = c => SJ.copy(jacket[0]).lerp(jacket[3], 0.5 + 0.5 * Math.sin(c.y * 70 + c.x * 50)).lerp(jacket[2], 0.5 * Math.max(0, Math.sin(c.z * 60 - c.x * 30))).clone();
    // the stripes: dark strokes laid along lines running on the slant round the body, and down the sleeves and legs
    const SG = V3(150, 210, -60), onStripe = p => Math.cos(p.x * SG.x + p.y * SG.y + p.z * SG.z + 0.8 * Math.sin(p.y * 60)) > 0.93 && L.rand() < 0.75;
    const darkTone = (a, b, r) => pick(stripe, r);
    const bodyStripes = (C, Rr, n) => dabs(fleece(C, Rr, n, darkTone, { grow: 1.03, keep: p => onStripe(p), dir: () => SG, l: [0.014, 0.026], w: [0.0026, 0.0042], lift: [0.0, 0.03] }));
    const tubeStripes = (a, b, r0, r1, n, k = 5) => dabs(tubeMarks(a, b, r0 * 1.05, r1 * 1.05, n, darkTone, { keep: (t, ph) => Math.cos(ph * k + t * 4) > 0.9 && L.rand() < 0.8, twist: 0.25, l: [0.014, 0.022], w: [0.0024, 0.0038], lift: [0.0, 0.03] }));
        {
      // the torso, from the seat up: his jacket in its stripes, the pink sash, the great collar, his round face and
      // auburn hair, and his left hand forward on the rope
      const parts = [], PEL = [[0, 0.016, 0], [0.054, 0.032, 0.05]];
      parts.push(vpaint(ell(...PEL, jacket[0], 3), striped));
      const trunk = shape.lathe([[0.047, 0.0], [0.049, 0.015], [0.05, 0.03], [0.048, 0.045], [0.047, 0.06], [0.048, 0.076], [0.05, 0.092], [0.053, 0.102], [0.054, 0.11], [0.049, 0.119], [0.04, 0.126], [0.022, 0.13], [0.0001, 0.131]], 28, jacket[0]);
      shape.move(trunk, 0, 0, 0, 0, 0, 0, 1, 1, 0.8); vpaint(trunk, striped); parts.push(trunk);
      parts.push(bodyStripes([0, 0.065, 0], [0.05, 0.068, 0.04], 2600));
      const sh = shape.cyl(0.056, 0.055, 0.036, 16, sash); shape.move(sh, 0, 0.046, 0, 0, 0, 0, 1, 1, 0.84); shape.paint(sh, (c, n) => (n.x < -0.3 || c.y > 0.058 ? sashHi : null)); parts.push(sh);
      parts.push(ell([0.05, 0.044, 0.012], [0.016, 0.02, 0.014], sashHi, 1), ell([0.054, 0.024, 0.018], [0.01, 0.022, 0.008], sash, 1));     // the bow of his sash
      // the collar: a ruff of white frills lying out over his shoulders, open in a V at the front
      const ruff = [];
      for (let i = 0; i < 60; i++) {
        const a = L.rand() * TAU, fa = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(fa - Math.PI / 2) < 0.32) continue;     // (+z is his front)
        const r = 0.03 + L.rand() * 0.034, p = V3(Math.cos(a) * r, 0.126 - (r - 0.03) * 0.42 + L.rand() * 0.004, Math.sin(a) * r * 0.86);
        const n = V3(Math.cos(a) * 0.45, 1, Math.sin(a) * 0.4).normalize();
        ruff.push({ p, n, up: V3(Math.cos(a), -0.3, Math.sin(a)).normalize(), l: 0.026 + L.rand() * 0.014, w: 0.016 + L.rand() * 0.012, lift: 0.25 + L.rand() * 0.3, c: (L.rand() < 0.3 ? pick(whiteSh, L.rand()) : pick(white, L.rand())) });
      }
      parts.push(dabs(ruff));
      parts.push(limb([0, 0.12, 0], [0, 0.146, 0.002], 0.016, 0.015, skin));
      const HEAD = [[0, 0.172, 0.004], [0.04, 0.044, 0.04]];
      // (lit from high on the left, warm in the half-shade, the cheeks and the tip of the nose flushed, a soft chin)
      const skinLit = col('#f6dcc4', 0.05), skinShade = col('#cf9070', 0.08), rose = col('#e48a78', 0.05);
      parts.push(vpaint(ell(...HEAD, skin, 3), v => {
        const n = V3((v.x - HEAD[0][0]) / HEAD[1][0], (v.y - HEAD[0][1]) / HEAD[1][1], (v.z - HEAD[0][2]) / HEAD[1][2]).normalize();
        const k = n.dot(KEY) * 0.6 + n.z * 0.5, c = skinShade.clone().lerp(skin, THREE.MathUtils.smoothstep(k, -0.5, 0.35)).lerp(skinLit, THREE.MathUtils.smoothstep(k, 0.45, 1.0) * 0.7);
        let r = 0; for (const s of [-1, 1]) r += Math.exp(-(Math.pow(n.x - s * 0.5, 2) + Math.pow(n.y + 0.28, 2) * 1.4) / 0.045);
        r += 0.5 * Math.exp(-(n.x * n.x + Math.pow(n.y + 0.2, 2)) / 0.01) * Math.max(0, n.z);
        return c.lerp(rose, Math.min(0.55, r * 0.5));
      }));
      for (const s of [-1, 1]) {
        parts.push(ell([s * 0.0145, 0.177, 0.0378], [0.0046, 0.0052, 0.003], col('#3e2618', 0.05), 1));                 // his big dark eyes
        parts.push(ell([s * 0.0145, 0.1805, 0.0372], [0.0062, 0.0022, 0.0032], skinShade, 1));                          // their lids
        parts.push(ell([s * 0.015, 0.1875, 0.0355], [0.0072, 0.0014, 0.0024], hair[2].clone().lerp(skin, 0.4), 1));     // faint brows
      }
      parts.push(ell([0, 0.1595, 0.0395], [0.0058, 0.0026, 0.003], col('#c0685a', 0.05), 1), ell([0, 0.169, 0.0435], [0.004, 0.0055, 0.0036], skin, 1));
      parts.push(dabs(fleece(...HEAD, 46, (n, p, r) => pick(hair, r), { grow: 1.04, keep: (p, n) => n.z < 0.25 || p.y > 0.198, l: [0.018, 0.028], w: [0.014, 0.022], lift: [0.05, 0.2] })));
      // his left arm, forward and down to the rope at the ram's horns
      parts.push(vpaint(limb([0.05, 0.112, 0], [0.068, 0.068, 0.03], 0.0175, 0.015, jacket[1], 10, 6), striped), vpaint(limb([0.068, 0.068, 0.03], [0.04, 0.052, 0.076], 0.015, 0.013, jacket[2], 10, 6), striped));
      parts.push(tubeStripes([0.05, 0.112, 0], [0.068, 0.068, 0.03], 0.0175, 0.015, 220), tubeStripes([0.068, 0.068, 0.03], [0.04, 0.052, 0.076], 0.015, 0.013, 220));
      parts.push(shape.move(shape.cone(0.017, 0.018, 8, white[0]), 0.042, 0.053, 0.074, 1.3, 0.0, 0.5), ell([0.036, 0.05, 0.086], [0.012, 0.011, 0.013], skin, 1));
      this.gTorso = rig.geo(shape.merge(parts));
      // his right arm and the switch, from the shoulder: the forearm up, as he holds it in the picture
      const arm = [vpaint(limb([0, 0, 0], [-0.032, -0.048, 0.012], 0.0175, 0.015, jacket[1], 10, 6), striped), vpaint(limb([-0.032, -0.048, 0.012], [-0.04, 0.012, 0.03], 0.015, 0.013, jacket[2], 10, 6), striped)];
      arm.push(tubeStripes([0, 0, 0], [-0.032, -0.048, 0.012], 0.0175, 0.015, 220), tubeStripes([-0.032, -0.048, 0.012], [-0.04, 0.012, 0.03], 0.015, 0.013, 220));
      arm.push(shape.move(shape.cone(0.019, 0.02, 9, white[0]), -0.04, 0.008, 0.03, 0, 0, Math.PI), ell([-0.04, 0.026, 0.032], [0.012, 0.013, 0.012], skin, 1));
      arm.push(limb([-0.04, 0.0, 0.034], [-0.03, 0.27, -0.03], 0.0026, 0.0013, col('#2a2018', 0.05), 5));
      this.gArm = rig.geo(shape.merge(arm));
      // the hat: a wide straw brim lined with blue, a low crown, the pink bow on it
      const straw = ['#efe6cc', '#e2d6b4', '#f6f0dc', '#d8cca8'].map(c => col(c, 0.1)), lining = col('#6a88a2', 0.1);
      const brim = shape.cyl(0.072, 0.07, 0.004, 22, straw[0]); shape.paint(brim, (c, n) => (n.y < -0.5 ? lining : Math.abs(n.y) < 0.5 ? straw[3] : null));
      const crown = shape.lathe([[0.032, 0], [0.033, 0.012], [0.03, 0.026], [0.0001, 0.03]], 14, straw[1]); shape.paint(crown, c => (c.y < 0.006 ? lining : null));
      const hat = [brim, crown];
      hat.push(dabs(fleece([0, 0.004, 0], [0.066, 0.004, 0.066], 44, (n, p, r) => pick(straw, r), { keep: (p, n) => n.y > 0.5, l: [0.022, 0.03], w: [0.012, 0.018], lift: [0.0, 0.05], lean: p => Math.atan2(p.z, p.x) })));
      hat.push(ell([0.004, 0.03, 0.022], [0.016, 0.012, 0.011], col('#d898b0', 0.08), 1), ell([-0.012, 0.028, 0.024], [0.012, 0.01, 0.009], col('#e8b0c4', 0.08), 1), ell([0.02, 0.026, 0.026], [0.012, 0.009, 0.008], col('#c87e9c', 0.08), 1));
      this.gHat = rig.geo(shape.merge(hat));
      // his legs astride, each from the hip: striped breeches round the ram's sides, buff shoes with silver buckles
      const leg = s => {
        const p = [vpaint(limb([0, 0, 0], [s * 0.1, -0.072, 0.05], 0.023, 0.019, jacket[0], 10, 8), striped), vpaint(limb([s * 0.1, -0.072, 0.05], [s * 0.104, -0.155, 0.036], 0.0185, 0.015, jacket[2], 10, 6), striped)];
        p.push(tubeStripes([0, 0, 0], [s * 0.1, -0.072, 0.05], 0.023, 0.019, 320, 6), tubeStripes([s * 0.1, -0.072, 0.05], [s * 0.104, -0.155, 0.036], 0.0185, 0.015, 280, 6));
        p.push(ell([s * 0.104, -0.165, 0.05], [0.017, 0.013, 0.032], col('#d6ac70', 0.1), 1), ell([s * 0.104, -0.157, 0.068], [0.009, 0.006, 0.004], col('#d8d8d0', 0.05), 1));
        return shape.merge(p);
      };
      this.gLegR = rig.geo(leg(-1)); this.gLegL = rig.geo(leg(1));
    }

    // ---------------------------------------------------------- the lambs
    {
      const woolC = ['#f2e4c6', '#eedcba', '#f6ead0', '#ecd6b0'].map(c => col(c, 0.08)), woolM = ['#d8c6a4', '#d2bf9c', '#dccbaa'].map(c => col(c, 0.08)), woolS = ['#9ea4b2', '#a8aab4', '#949cac', '#b0aca8'].map(c => col(c, 0.08));
      const CL = col('#efdfc0', 0.08), CM = col('#cdbb98', 0.08), CS = col('#8e94a4', 0.08);
      const lambTone = (n, into = new THREE.Color()) => { const k = n.dot(KEY); return k < 0.05 ? into.copy(CS).lerp(CM, THREE.MathUtils.smoothstep(k, -0.6, 0.05)) : into.copy(CM).lerp(CL, THREE.MathUtils.smoothstep(k, 0.05, 0.7)); };
      const lw0 = toneOf(woolC, woolM, woolS), lw = (n, p, r) => lw0(n, p, r).clone().lerp(lambTone(n), 0.55), faceC = col('#e6cbb0', 0.1);
      const lambCurl = (n, p, r) => { const k = n.dot(KEY) + (r - 0.5) * 0.3; return k > 0.3 ? col('#fbf0d8', 0.05) : k > -0.1 ? col('#e4d2b0', 0.05) : col('#a6aab8', 0.05); };
      const BODY = [[0, 0.118, 0], [0.048, 0.046, 0.076]], SKULL = [[0, 0.168, 0.084], [0.026, 0.028, 0.032]];
      const smoothL = (C, R, d = 2) => vpaint(ell(C, R, CM, d), v => lambTone(V3((v.x - C[0]) / R[0], (v.y - C[1]) / R[1], (v.z - C[2]) / R[2]).normalize()).multiplyScalar(0.9));
      const parts = [smoothL(...BODY), vpaint(ell(...SKULL, faceC, 2), v => faceC.clone().lerp(col('#b8a090', 0.05), THREE.MathUtils.smoothstep(-(v.y - 0.168) / 0.028, 0.0, 1.0) * 0.55))];
      parts.push(ell([0, 0.157, 0.11], [0.016, 0.017, 0.022], col('#e6c0ac', 0.1), 1, 0.3), ell([0, 0.153, 0.13], [0.006, 0.004, 0.003], col('#6a4a44', 0.05), 1));
      for (const s of [-1, 1]) {
        parts.push(ell([s * 0.019, 0.174, 0.104], [0.0048, 0.0052, 0.004], col('#1e1612', 0.05), 1));
        parts.push(shape.move(ell([0, 0, 0], [0.022, 0.0055, 0.01], col('#e8b8a8', 0.1), 1), s * 0.03, 0.172, 0.07, 0, 0, -s * 0.65));
      }
      parts.push(ell([0, 0.134, -0.08], [0.015, 0.02, 0.014], woolC[0], 1));
      parts.push(dabs([...fleece(...BODY, 300, lw, { l: [0.016, 0.024], w: [0.014, 0.02], lift: [0.12, 0.32], keep: p => !inside(p, [SKULL]) }), ...fleece(...SKULL, 22, lw, { keep: (p, n) => n.y > 0.45 && n.z < 0.5, l: [0.013, 0.018], w: [0.011, 0.015] })]));
      parts.push(curls(fleece(...BODY, 120, lambCurl, { l: [0, 0], w: [0.0035, 0.0055], curl: 0.0065, grow: 1.1, keep: p => !inside(p, [SKULL], 1.2) })));
      this.gLamb = rig.geo(shape.merge(parts));
      this.gLambLeg = rig.geo(shape.merge([limb([0, 0.005, 0], [0, -0.08, 0], 0.0095, 0.0075, CM), limb([0, -0.078, 0.001], [0, -0.092, 0.003], 0.0078, 0.0088, col('#5a4a3e', 0.05))]));
      // (the legs: a pale shank with a dark hoof, from the hip at 0.09)
    }

    // ---------------------------------------------------------- put them together
    const add = g => { const i = rig.add(g); rig.show(i, false); return i; };
    this.ram = { body: add(this.gBody), head: add(this.gHead), jaw: add(this.gJaw), bell: add(this.gBell), knot: add(this.gKnot), up: [0, 1, 2, 3].map(() => add(this.gUp)), lo: [0, 1, 2, 3].map(() => add(this.gLo)) };
    this.boy = { torso: add(this.gTorso), arm: add(this.gArm), hat: add(this.gHat), legL: add(this.gLegL), legR: add(this.gLegR) };
    this.lambs = [0, 1, 2].map(j => ({ j, body: add(this.gLamb), legs: [0, 1, 2, 3].map(() => add(this.gLambLeg)), u: 0, out: 0, yaw: 0, from: null }));
    this.all = [this.ram.body, this.ram.head, this.ram.jaw, this.ram.bell, this.ram.knot, ...this.ram.up, ...this.ram.lo, ...Object.values(this.boy), ...this.lambs.flatMap(l => [l.body, ...l.legs])];
    this.blobs = L.blobs(6, { y: L.y + 0.02 }); this.blobs.renderOrder = 6;

    // ---------------------------------------------------------- the routes
    const C3 = pts => pts.map(([u, o]) => V3(u, 0, o));
    this.pathA = new THREE.CatmullRomCurve3(C3([[HOME, -L.wall - 0.56], [HOME, -0.02], [-0.1, 0.42], [0.1, 0.8], LOOP[0]]), false, 'centripetal'); this.pathA.arcLengthDivisions = 300; this.pathA.updateArcLengths();
    this.lenA = this.pathA.getLength();
    this.loop = new THREE.CatmullRomCurve3(C3(LOOP), true, 'centripetal'); this.loop.arcLengthDivisions = 400; this.loop.updateArcLengths();
    this.lenL = this.loop.getLength();
    this.p = V3(); this.tg = V3(); this.q = V3();
    this.pose = { u: 0, out: 0, du: 0, dout: 1, dist: 0, vis: false };
    this.lp = { u: 0, out: 0, du: 0, dout: 1, hop: 0, air: -1, dist: 0, vis: false };

    // ---------------------------------------------------------- the minuet
    const s = this.score = score(L);
    for (let r = 0, t0 = T_MUS; r < 4; r++) { const end = s.tune(MIN, t0, BPM, { type: 'triangle', vol: 0.02, over: 2, overVol: 0.35, legato: 0.8 }); s.tune(MIN_BASS, t0, BPM, { type: 'triangle', vol: 0.011, legato: 0.4, oct: 0 }); t0 = end; }
    s.done();
  },

  hideAll() { for (const i of this.all) this.rig.show(i, false); this.blobs.count = 0; },

  // ---------------------------------------------------------------- where everyone is, from show-time t
  // The ram along its way: how far it has gone (for its legs) and where it is.
  ramDist(t) {
    if (t < T_OUT) return 0;
    if (t < T_HALT) { const k = (t - T_OUT) / (T_HALT - T_OUT); return this.lenA * (1 - Math.pow(1 - k, 1.7)); }
    if (t < T_GO) return this.lenA;
    return this.lenA + V * smoothStart(t - T_GO, 0.6);
  },
  ramAt(t, o) {
    o.vis = t >= T_OUT; o.dist = this.ramDist(t);
    if (o.dist <= this.lenA) { const s = clamp01(o.dist / this.lenA); this.pathA.getPointAt(s, this.p); this.pathA.getTangentAt(Math.min(s, 0.995), this.tg); }
    else { const s = ((o.dist - this.lenA) / this.lenL) % 1; this.loop.getPointAt(s, this.p); this.loop.getTangentAt(s, this.tg); }
    o.u = this.p.x; o.out = this.p.z; o.du = this.tg.x; o.dout = this.tg.z;
    return o;
  },
  // Lamb j: out of the wall in three leaps to its place in the line behind the ram, then following it; on the minuet,
  // a leap a bar each, in canon.
  lambAt(j, t, o) {
    const k = (t - TL[j]) / LAMB_IN;
    o.vis = k >= 0; o.hop = 0; o.air = -1;
    const d = this.ramDist(t) - this.lenA - GAP0 - GAP * j, s = ((d / this.lenL) % 1 + 1) % 1;
    this.loop.getPointAt(s, this.p); this.loop.getTangentAt(s, this.tg);
    o.dist = d + 3;
    if (k < 1) {
      const e = ease.inOut(clamp01(k)), eu = LAMB_U[j], eo = -this.wallOut - 0.2;
      o.u = lerp(eu, this.p.x, e); o.out = lerp(eo, this.p.z, e); o.du = this.p.x - eu; o.dout = this.p.z - eo;
      const h = clamp01(k) * 3, f = h - Math.floor(h); o.hop = 0.1 * 4 * f * (1 - f) * (k < 1 ? 1 : 0); o.air = f;
      o.dist = 3 + k * 0.5;
      return o;
    }
    o.u = this.p.x; o.out = this.p.z; o.du = this.tg.x; o.dout = this.tg.z;
    if (t > T_MUS) {
      const b = (t - T_MUS) / BEAT, p = b % 3;
      if (p >= j && p < j + 0.9) { const f = (p - j) / 0.9; o.hop = 0.095 * 4 * f * (1 - f); o.air = f; }
    }
    return o;
  },

  start(L) {
    this.hideAll(); this.lastT = -1; this.wallOut = L.wall; this.score.from(0);
    // the sting: the bell, inside the wall, and a pipe's three notes
    if (!L.quiet) { this.bell(L, 0.45, 0.25); this.bell(L, 0.35, 0.62); L.voice().tune('G4:.5 B4:.5 D5', { bpm: 150, type: 'triangle', vol: 0.016, at: 0.05, legato: 0.7 }); }
  },
  back(L) {
    // note where everyone is, and work out their ways home
    const C = (pts) => { const c = new THREE.CatmullRomCurve3(pts.map(([u, o]) => new THREE.Vector3(u, 0, o)), false, 'centripetal'); c.arcLengthDivisions = 120; c.updateArcLengths(); return c; };
    const r = this.pose, t = this.lastShow || 0;
    this.ramAt(t, r);
    this.retFrom = { show: r.vis, dist: r.dist, t };
    if (r.vis) {
      const l = Math.hypot(r.du, r.dout) || 1, hu = r.u + r.du / l * 0.16, ho = r.out + r.dout / l * 0.16;
      this.retRam = C([[r.u, r.out], [hu, ho], [(hu + HOME) / 2, Math.max(0.3, ho * 0.6)], [HOME, 0.06], [HOME, -L.wall - 0.58]]);
    } else this.retRam = null;
    this.retLambs = this.lambs.map(lb => {
      const o = this.lambAt(lb.j, t, this.lp); if (!o.vis) return null;
      return C([[o.u, o.out], [(o.u + LAMB_U[lb.j]) / 2, Math.max(0.25, o.out * 0.55)], [LAMB_U[lb.j], 0.05], [LAMB_U[lb.j], -L.wall - 0.22]]);
    });
    this.spread0 = this.u.uSpread.value;
  },
  end(L) { this.hideAll(); this.u.uSpread.value = 0; this.path.visible = false; },
  reset(L) { this.end(L); },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', ret = ph === 'return';
    const t = showing ? L.t : this.lastShow || 0;
    if (showing) this.lastShow = L.t;
    this.wallOut = L.wall;
    // ---- the path
    let spread = 0;
    if (showing) spread = ease.out(ramp(t, 0.05, 2.0));
    else if (ret) spread = (this.spread0 || 0) * (1 - ease.inOut(ramp(L.ret, 0.5, 1)));
    this.u.uSpread.value = spread; this.path.visible = spread > 0.002;
    // ---- the ram and the boy
    const rig = this.rig, B = this.B, M = this.M, r = this.pose;
    let dist, speed, vis;
    if (ret) {
      if (!this.retRam) { vis = false; dist = 0; speed = 0; }
      else {
        const k = ease.inOut(ramp(L.ret, 0, 0.86)), c = this.retRam;
        c.getPointAt(k, this.p); c.getTangentAt(Math.min(k, 0.995), this.tg);
        r.u = this.p.x; r.out = this.p.z; r.du = this.tg.x; r.dout = this.tg.z; vis = r.out > -L.wall - 0.54;
        dist = this.retFrom.dist + k * c.getLength(); speed = Math.min(1, Math.sin(Math.PI * clamp01(L.ret / 0.86)) * 2.2);
      }
    } else {
      this.ramAt(t, r); vis = r.vis; dist = r.dist;
      speed = clamp01((this.ramDist(t + 0.05) - this.ramDist(t - 0.05)) / 0.1 / V);
    }
    const shown = vis && (showing || ret);
    for (const i of [this.ram.body, this.ram.head, this.ram.jaw, this.ram.bell, this.ram.knot, ...this.ram.up, ...this.ram.lo, ...Object.values(this.boy)]) rig.show(i, shown);
    let nb = 0;
    if (shown) {
      // the gait: a trot, diagonal pairs; on the loop, a step to a beat
      const phi = t > T_GO && !ret ? Math.PI * (t - T_MUS) / BEAT : dist / STRIDE * TAU, amp = Math.min(1, speed * 1.3);
      // the main moment: a halt, a gathering, and the bleat
      const antic = showing ? ease.smooth(ramp(t, T_HALT - 0.15, T_BLEAT - 0.05)) * (1 - ease.smooth(ramp(t, T_BLEAT - 0.05, T_BLEAT + 0.1))) : 0;
      const tb = t - T_BLEAT, raise = showing ? ease.out(ramp(tb, 0, 0.16)) * (1 - ease.inOut(ramp(tb, BLEAT - 0.12, BLEAT + 0.4))) : 0;
      const flut = Math.sin(TAU * 9 * tb), shiver = raise * 0.022 * flut;
      const lurch = showing ? hump(t, T_HALT - 0.12, T_HALT + 0.55) : 0;
      const bob = 0.011 * amp * Math.abs(Math.cos(phi)) - 0.008 * antic, yaw = L.yawOf(r.du, r.dout);
      L.floor(r.u, r.out, this.v);
      B.set(M.root, this.v.x, L.y + bob * SC, this.v.z, yaw, 0.02 * amp - 0.07 * antic - 0.08 * raise, shiver + 0.02 * amp * Math.sin(phi), SC);
      rig.mat(this.ram.body, M.root);
      // head, jaw, bell
      const headP = 0.08 + 0.05 * amp * Math.sin(phi * 2) + 0.34 * antic - 0.36 * raise + 0.08 * lurch;
      B.child(M.head, M.root, 0, 0.315, 0.19, 0.08 * Math.sin(t * 1.3) * (1 - raise), headP, shiver * 1.5);
      rig.mat(this.ram.head, M.head);
      B.child(M.jaw, M.head, 0, -0.04, 0.086, 0, raise * (0.36 + 0.12 * flut), 0); rig.mat(this.ram.jaw, M.jaw);
      const swing = 0.35 * amp * Math.sin(phi + 0.6) + raise * 0.25 * Math.sin(TAU * 4.5 * tb) - 0.3 * lurch;
      B.child(M.knot, M.root, 0, 0.246 + 0.02 * raise, 0.238 + 0.012 * raise, 0, 0, 0); rig.mat(this.ram.knot, M.knot);
      B.child(M.bell, M.knot, 0, -0.006, 0.004, 0, swing * 0.5, swing * 0.6); rig.mat(this.ram.bell, M.bell);
      // legs
      const HIPS = [[0.062, 0.18, 0.13], [-0.062, 0.18, 0.13], [0.066, 0.185, -0.13], [-0.066, 0.185, -0.13]];
      for (let k = 0; k < 4; k++) {
        const front = k < 2, ph = phi + (k === 1 || k === 2 ? Math.PI : 0), p = 0.42 * amp * Math.sin(ph), lift = amp * 0.85 * Math.max(0, -Math.cos(ph));
        const h = HIPS[k];
        B.child(M.up[k], M.root, h[0], h[1] + (front ? 0.02 * antic : 0), h[2], 0, p + (front ? -0.12 * antic : 0.1 * antic), 0); rig.mat(this.ram.up[k], M.up[k]);
        B.child(M.lo[k], M.up[k], 0, -0.085, 0, 0, front ? lift : lift * 0.5, 0); rig.mat(this.ram.lo[k], M.lo[k]);
      }
      // the boy: astride, his body turned to us (as he sits in the picture), bouncing with the trot
      const laugh = raise * Math.abs(Math.sin(TAU * 4 * tb));
      B.child(M.seat, M.root, 0, 0.334 + 0.012 * amp * Math.abs(Math.sin(phi + 0.5)) + 0.006 * laugh, -0.035, 0, 0, 0, BOY);
      const cam = L.floor(CAM[0], CAM[1], this.w), want = Math.atan2(cam.x - this.v.x, cam.z - this.v.z), twist = Math.max(-1.05, Math.min(1.05, turnTo(0, want - yaw, 1))) * 0.75;
      const lean = 0.06 * amp + 0.38 * lurch - 0.16 * raise + 0.04 * Math.sin(phi * 2) * amp;
      B.child(M.torso, M.seat, 0, 0, 0, twist, lean, 0.04 * Math.sin(t * 1.7)); rig.mat(this.boy.torso, M.torso);
      for (const [leg, s] of [[this.boy.legL, 1], [this.boy.legR, -1]]) {
        const lm = s > 0 ? M.legL : M.legR;
        B.child(lm, M.seat, s * 0.036, 0.004, 0.012, 0, -0.22 * amp * Math.sin(phi + (s > 0 ? 0 : Math.PI)) * 0.5 - 0.25 * raise * Math.abs(flut), s * (0.06 * amp * Math.abs(Math.sin(phi)) + 0.1 * raise));
        rig.mat(leg, lm);
      }
      // his switch arm: waving as they trot, thrown up at the bleat, conducting the minuet
      let ap = 0, ar = 0;
      if (ret || t < T_MUS) { ap = 0.25 * Math.sin(t * TAU * 1.2) * amp - 0.1; ar = -0.2 * Math.sin(t * TAU * 1.2 + 1.2) * amp; }
      else { const b = ((t - T_MUS) / BEAT) % 3, a = b / 3 * TAU; ap = 0.32 * Math.cos(a) - 0.05; ar = -0.3 * Math.sin(a); }
      ap += 0.2 * raise + 0.3 * lurch; ar += raise * (0.45 + 0.2 * Math.sin(TAU * 3 * tb));
      B.child(M.arm, M.torso, -0.05, 0.112, 0, 0, ap, ar); rig.mat(this.boy.arm, M.arm);
      // his hat: it slips at the halt and jumps at the bleat
      const hopT = tb - 0.12, hj = showing && hopT > 0 && hopT < 0.5 ? 4 * (hopT / 0.5) * (1 - hopT / 0.5) : 0;
      B.child(M.hat, M.torso, 0, 0.206 + 0.03 * hj, 0.002, 0.4 * hj, -0.2 + 0.24 * lurch + 0.16 * raise + 0.1 * hj, 0.06 * Math.sin(t * 2.1) + 0.08 * hj);
      rig.mat(this.boy.hat, M.hat);
      // shadows, front and back
      for (const zz of [0.12, -0.1]) { this.w.set(0, 0, zz).applyMatrix4(M.root); this.blobs.set(nb++, this.w.x, this.w.z, 0.13 * SC, 0.6); }
      // sounds, as they happen
      if (showing && !L.quiet && this.lastT >= 0) {
        const st = Math.floor(dist / (STRIDE / 2)), was = Math.floor(this.ramDist(this.lastT) / (STRIDE / 2));
        if (t <= T_GO && st > was && speed > 0.05) { this.clop(L, speed); if (st % 2 === 0) this.bell(L, 0.6 * speed + 0.2, 0); }
        if (t > T_GO) { const b0 = Math.floor((this.lastT - T_MUS) / BEAT), b1 = Math.floor((t - T_MUS) / BEAT); if (b1 > b0) { this.clop(L, speed); if (b1 % 3 === 0) this.bell(L, 0.45, 0); } }
        if (this.lastT < T_HALT && t >= T_HALT) this.bell(L, 0.9, 0.02);
        if (this.lastT < T_BLEAT && t >= T_BLEAT) { this.bleat(L, 158, BLEAT, 0.07, 9, [700, 1180]); this.bell(L, 0.7, 0.1); this.bell(L, 0.5, 0.35); }
        if (this.lastT < T_BLEAT + 0.15 && t >= T_BLEAT + 0.15) this.giggle(L);
      }
    }
    // ---- the lambs
    this.lambs.forEach(lb => {
      const o = this.lp; let on;
      if (ret) {
        const c = this.retLambs && this.retLambs[lb.j];
        if (!c) on = false;
        else {
          const k0 = 0.12 + lb.j * 0.08, k = clamp01((L.ret - k0) / 0.7), e = ease.inOut(k);
          c.getPointAt(e, this.p); c.getTangentAt(Math.min(e, 0.995), this.tg);
          o.u = this.p.x; o.out = this.p.z; o.du = this.tg.x; o.dout = this.tg.z;
          const h = k * 4, f = h - Math.floor(h); o.hop = k > 0 && k < 1 ? 0.09 * 4 * f * (1 - f) : 0; o.air = k > 0 && k < 1 ? f : -1; o.dist = 3 + k;
          on = o.out > -L.wall - 0.2;
        }
      } else on = showing && this.lambAt(lb.j, t, o).vis;
      rig.show(lb.body, on); for (const l of lb.legs) rig.show(l, on);
      if (!on) return;
      const yaw = L.yawOf(o.du, o.dout), air = o.air >= 0, pitch = air ? -0.16 * Math.cos(Math.PI * o.air) : 0;
      L.floor(o.u, o.out, this.v);
      B.set(M.lamb[lb.j], this.v.x, L.y + o.hop * LS, this.v.z, yaw, pitch, 0, LS); rig.mat(lb.body, M.lamb[lb.j]);
      const lphi = o.dist / 0.13 * TAU, moving = ret || t > T_GO || t < TL[lb.j] + LAMB_IN ? 1 : 0.15;
      const LH = [[0.026, 0.09, 0.046], [-0.026, 0.09, 0.046], [0.027, 0.09, -0.046], [-0.027, 0.09, -0.046]];
      for (let k = 0; k < 4; k++) {
        const front = k < 2, ph = lphi + (k === 1 || k === 2 ? Math.PI : 0);
        // in the air, legs bunched stiffly under (a lamb's leap); on the ground, a trot
        const p = air ? (front ? 0.3 : -0.3) * Math.sin(Math.PI * o.air) : 0.38 * moving * Math.sin(ph);
        B.child(M.ll[lb.j][k], M.lamb[lb.j], LH[k][0], LH[k][1], LH[k][2], 0, p, 0); rig.mat(lb.legs[k], M.ll[lb.j][k]);
      }
      this.blobs.set(nb++, this.v.x, this.v.z, 0.07 * LS * (1 - o.hop * 3), 0.5 * (1 - o.hop * 4));
      // their bleats as they come out, and now and then on the minuet
      if (showing && !L.quiet && this.lastT >= 0) {
        if (this.lastT < TL[lb.j] && t >= TL[lb.j]) this.bleat(L, [520, 600, 470][lb.j], 0.42, 0.035, 11.5, [950, 2000]);
        const tt = 15 + lb.j * 5.3; if (this.lastT < tt && t >= tt) this.bleat(L, [540, 610, 480][lb.j], 0.34, 0.025, 11.5, [950, 2000]);
      }
    });
    this.blobs.count = nb;
    // a bleat from the ram now and then while you stay
    if (showing && !L.quiet && this.lastT >= 0) for (const tt of [13.2, 24.5, 36]) if (this.lastT < tt && t >= tt) this.bleat(L, 150, 0.8, 0.05, 9, [700, 1180]);
    // ---- the minuet
    if (showing) this.score.play(t);
    L.voice().place();
    this.lastT = showing ? t : this.lastT;
  },

  // ---------------------------------------------------------------- sounds
  // A bleat: a buzzy voice through two formants, with the quaver of it (the flutter in pitch and loudness); baa for the
  // ram, a higher, shorter meh for a lamb.
  bleat(L, f0, dur, vol, rate, [F1, F2]) {
    const v = L.voice(), c = v.ctx, out = c && v.out(); if (!c || !out) return;
    const t = c.currentTime + 0.01, o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0 * 0.9, t); o.frequency.linearRampToValueAtTime(f0 * 1.07, t + 0.1); o.frequency.linearRampToValueAtTime(f0, t + dur * 0.6); o.frequency.linearRampToValueAtTime(f0 * 0.84, t + dur);
    const lfo = c.createOscillator(); lfo.frequency.value = rate;
    const am = c.createGain(); am.gain.value = 0.62; const lg = c.createGain(); lg.gain.value = 0.38; lfo.connect(lg); lg.connect(am.gain);
    const pg = c.createGain(); pg.gain.value = f0 * 0.03; lfo.connect(pg); pg.connect(o.frequency);
    const env = c.createGain(); env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(vol, t + 0.05); env.gain.setValueAtTime(vol, t + dur * 0.7); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(am);
    for (const [f, q, g, to] of [[F1, 4, 1, F1 * 0.82], [F2, 6, 0.6, F2 * 1.3], [F1 * 3.2, 3, 0.15, F1 * 3]]) {
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(f, t); bp.frequency.linearRampToValueAtTime(to, t + dur); bp.Q.value = q;
      const gg = c.createGain(); gg.gain.value = g; am.connect(bp); bp.connect(gg); gg.connect(env);
    }
    env.connect(out);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
    noise(v, 0, { d: dur * 0.8, vol: vol * 0.12, bp: F2, q: 2 });
  },
  // His sheep bell: a dull clank, a little different each time.
  bell(L, k, at) {
    const v = L.voice(); this.bn = (this.bn || 0) + 1; const f = 1180 * (1 + 0.018 * Math.sin(this.bn * 7.3));
    v.note(f, 0.55, { at, vol: 0.016 * k, type: 'sine', attack: 0.002 }); v.note(f * 2.72, 0.22, { at, vol: 0.008 * k, type: 'sine', attack: 0.002 }); v.note(f * 4.13, 0.1, { at, vol: 0.004 * k, type: 'sine', attack: 0.001 });
    noise(v, at, { d: 0.03, vol: 0.01 * k, bp: 3000, q: 2 });
  },
  clop(L, k) { const v = L.voice(); noise(v, 0, { d: 0.04, vol: 0.012 * k, bp: 1400, q: 2.5 }); v.note(420, 0.04, { vol: 0.006 * k, type: 'triangle', to: 260, attack: 0.002 }); },
  giggle(L) { const v = L.voice(); [0, 0.13, 0.25, 0.36].forEach((at, i) => v.note(880 - i * 40, 0.09, { at, vol: 0.012, type: 'sine', to: 980 - i * 40, attack: 0.01 })); },
});
