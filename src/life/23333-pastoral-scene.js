// Giovanni Battista Piazzetta, Pastoral Scene (1740), Gallery 217. The word: paddle.
//
// One of two pictures of life-size country people he painted in Venice for Field Marshal von der Schulenburg. The
// museum says their meaning "remains mysterious"; what is not mysterious is the foot of it. Along the bottom edge runs
// a band of dark water, and everything in the picture that moves is in it: at the left a white dog swimming, only its
// head and one long ear above the water; at the right, in front of the reeds, a white duck up on its tail with its
// wings open, the water broken into pale dabs under it. The word comes from there: both of them paddle. And it is his
// light: almost the whole canvas is warm brown dark, and the things he wants seen are cream-white, come up out of it.
//
// Look at it and that band of water runs out over the floor from the foot of the wall under the picture: dark, with
// his level streaks drifting on it, the reeds standing up out of the shallows at the right, as they stand in the
// picture. The duck comes out through the reeds with its head down and floats. At the left, where his dog is, a ring
// spreads, and a white head comes up out of the water and paddles across: ears spread on the surface, forepaws coming
// up either side of its muzzle in the lilt of the tune, a wake of rings widening behind it, each white thing doubled
// by a pale broken reflection. The duck is having its bath: it dips its head and throws the water down its back,
// twice. The dog arrives and treads water to look. Then the main moment, which is the pose he painted: the duck
// gathers itself, stands up on its tail, bill to the ceiling, opens its wings and beats them, five beats, drops flying
// and rings racing out across the pool, the reeds shivering in the wind of it. The dog gets the lot, and looks away.
// The duck sits down again, shuffles its wings shut, wags its tail and says so, three times. The dog shakes its head,
// ears flying, a ring of drops, sneezes, and paddles off round the pool; the duck turns to watch it go. While you
// keep looking the dog goes round, the duck dabbles, and when the dog is back the duck takes its bath again (every
// four bars). When you stop, the duck goes home through the reeds, the dog swims back to where it came up and goes
// under, and the water drains back to the wall after them.
//
// The tune is the third movement of Vivaldi's "Spring" (La primavera, published 1725), which he headed "Danza
// pastorale": a pastoral dance for a pastoral scene, by a Venetian who was alive when this was painted in Venice. Its
// first three bars, as written: the first and second violins in thirds over the drone the viola and the bass hold (his
// sonnet says it is a bagpipe), loud and then soft as he marks them, and quiet throughout (con sordine). The duck's
// wingbeats fall on its quavers and the dog's forepaws on its long and short. (Sargent's fountain, in Gallery 273,
// has the opening of the same concerto's first movement; this is another movement, another tune, another room.)
//
// The stage is narrow because the room is: a stunt ramp stands 1.56 m out from this wall, right across it. The pool
// keeps within 0.95 m of the wall, and the look camera stands back above the ramp and looks down past its edge, so the
// ramp is out of the view and the whole of this very tall canvas is in it, the pool at its foot under the painted
// water. The dog's head and the duck are about half as big again as he painted them, to carry from there. Nothing
// stands higher than 0.6 m, under a picture hung at 1.04 m, and from the checks' nine cameras the guard has nothing to
// cut. Goya's sandy path next door (src/life/111559-boy-on-a-ram.js) reaches to about a metre from the middle of this
// picture; the pool stops short of it at 0.95, neither show stays out after its look, and the kit sends one home when
// the other begins. Three draw calls: the floor (water, rings, reflections, one shader), one rig (dog, duck, reeds:
// smooth forms under his soft dabs, locks and feathers) and the drops (soft quads, one instanced mesh). Nothing is
// solid, and nothing here is given to the toy to push. With "Reduce motion and flashing" on, the wings beat and the
// head shakes at half the rate, the broken water and the reflections do not flicker, and the sounds are softer.
//
// What it does not do: nobody comes out of the picture. Not the child, who is small and half-dressed, nor the woman,
// nor the two men behind the rock; the museum notes the child has been read as an infant Bacchus and that Piazzetta
// never said so, so the grapes stay in the basket too. And the dog does not hunt the duck, as it may be doing in the
// picture: here the duck is not chased, caught or frightened; it has its bath, and the dog is the one who gets wet.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture } from '../paintlife.js';
import { strokes } from './brush.js';
import { score, Bones, hump, turnTo, noise } from './stagecraft.js';

const TAU = Math.PI * 2;
const DG = 1.5, DS = 1.4;                       // the dog's head and the duck, against the models' own measure
const SURF = 0.016;                             // the water lies this far above the boards
const POOL = { u: -0.15, o: 0.3, a: 1.1, b: 0.58 };     // the pool: its middle and reach (along, out); it is cut off by the wall
const BEAT = 1, Q = BEAT / 3;                   // the dance: a dotted crotchet a second, three quavers in it
const T_MUS = 0.6;
const T_DUCK = [0.55, 2.0];                     // the duck comes out through the reeds
const T_DOG = 0.95, T_STOP = 4.3;               // the dog comes up out of the water and paddles across
const DIPS0 = [2.3, 3.35];                      // the duck's first two dips
const T_FLAP = 4.6, ROUND = 16;                 // the bath: on a bar line, and again every four bars
const T_GO = 7.8, T_ROUND = 12.2;               // the dog sets off round the pool, and is back this much later
const DUCK = [0.44, 0.5], STOP = [-0.2, 0.6];    // where the duck floats and where the dog treads water to watch
const DOG_IN = [[-0.96, 0.1], [-0.94, 0.2], [-0.86, 0.36], [-0.6, 0.48], STOP];        // (it comes up out of the water by the wall)
const DOG_LOOP = [STOP, [-0.05, 0.64], [-0.1, 0.71], [-0.32, 0.72], [-0.64, 0.66], [-0.86, 0.54], [-0.93, 0.39], [-0.82, 0.26], [-0.6, 0.29], [-0.4, 0.46]];
const HEAD = [0.35, 0.18];                      // the way the dog faces as it treads water (the way it came, and the way it will go)
const DUCK_IN = [[0.8, -0.5], [0.8, -0.02], [0.7, 0.3], DUCK];
const DOG_HOME = [-0.95, 0.12], DUCK_HOME = [0.8, -0.52], DEEP = 0.3;
const REEDS = [[0.58, 0.06, 0, 1.0, 0.3], [0.68, 0.17, 1, 0.8, 2.1], [0.93, 0.08, 2, 1.0, 4.0], [0.99, 0.24, 0, 0.78, 5.2], [0.9, 0.37, 1, 0.6, 1.2], [0.45, 0.04, 2, 0.6, 3.3], [1.04, 0.1, 1, 0.9, 0.9]];     // [along, out, which clump, size, turn]
const CAM = [0.15, 2.95, 1.6];                  // the look camera: along, out, up
const NR = 20, WAKE = 0.28, RING_LIFE = 2.7;    // rings on the water at once; the wake drops one this often
const N_FLAP = 18, N_SHAKE = 30, N_DIP = 8, N_CARD = 150;
// Antonio Vivaldi, La primavera (1725), III, "Danza pastorale", bars 1 to 3 (and again, softer, as he marks it): the
// first violin, the second a third under it, the viola's and the bass's drone. One beat here is a quaver.
const VLN1 = 'G#5:1.5 A5:.5 G#5 G#5:2 A5 A5:3 B5:2 A5 | G#5:1.5 A5:.5 G#5 G#5:2 A5 A5:3 B5:2 A5 | G#5:1.5 A5:.5 B5 B5:1.5 A5:.5 G#5 G#5:3 F#5:3';
const VLN2 = 'E5:1.5 F#5:.5 E5 E5:2 F#5 F#5:3 G#5:2 F#5 | E5:1.5 F#5:.5 E5 E5:2 F#5 F#5:3 G#5:2 F#5 | E5:1.5 F#5:.5 G#5 G#5:1.5 F#5:.5 E5 E5:3 D#5:3';
const DRONE = 'B3:12 | B3:12 | B3:12', BASS = 'E3:12 | E3:12 | E3:6 B2:6';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const curve = pts => { const c = new THREE.CatmullRomCurve3(pts.map(([u, o]) => V3(u, 0, o)), false, 'centripetal'); c.arcLengthDivisions = 300; c.updateArcLengths(); return c; };
// a journey: gets going, goes steadily, comes to rest (0..1 over 0..1)
const trip = (x, a = 0.12) => { x = clamp01(x); return x < a ? (x * x) / (2 * a) / (1 - a) : x > 1 - a ? 1 - ((1 - x) * (1 - x)) / (2 * a) / (1 - a) : (x - a / 2) / (1 - a); };

// Triangles gathered into one geometry, each wound to agree with the normal it is given (the paint is two-sided).
class Acc {
  constructor() { this.pos = []; this.nor = []; this.col = []; this.e1 = V3(); this.e2 = V3(); this.fn = V3(); }
  tri(a, b, c, na, nb, nc, ca, cb, cc) {
    this.fn.crossVectors(this.e1.subVectors(b, a), this.e2.subVectors(c, a));
    if (this.fn.dot(na) < 0) { let t = b; b = c; c = t; t = nb; nb = nc; nc = t; t = cb; cb = cc; cc = t; }
    for (const [p, n, k] of [[a, na, ca], [b, nb, cb], [c, nc, cc]]) { this.pos.push(p.x, p.y, p.z); this.nor.push(n.x, n.y, n.z); this.col.push(k.r, k.g, k.b); }
  }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3)); return g; }
}

lifeFor(23333, {
  title: /^Pastoral Scene/,
  word: 'paddle',
  stage: { out: 0.78, half: 1.3, cam: { dist: CAM[1], height: CAM[2], side: CAM[0], fov: 66, lookU: 0.02, lookOut: 0.5, lookH: 1.35 } },
  wake: 2, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.25) => P.near(h, a);
    this.v = V3(); this.w = V3(); this.p = V3(); this.tg = V3();
    this.B = new Bones();
    const M = () => new THREE.Matrix4();
    this.M = { dog: M(), back: M(), head: M(), ear: [M(), M()], paw: [M(), M()], duck: M(), neck: M(), neck0: M(), dhead: M(), bill: M(), wing: [M(), M()], tail: M(), reed: REEDS.map(M) };
    this.buildFloor(L, col);
    this.buildRig(L, col);
    this.buildCards(L, col);
    this.tgo = T_GO; this.tround = T_ROUND;
    this.pathIn = curve(DOG_IN); this.lenIn = this.pathIn.getLength();
    this.loop = new THREE.CatmullRomCurve3(DOG_LOOP.map(([u, o]) => V3(u, 0, o)), true, 'centripetal'); this.loop.arcLengthDivisions = 400; this.loop.updateArcLengths(); this.lenLoop = this.loop.getLength();
    this.duckIn = curve(DUCK_IN);
    this.dg = { u: 0, out: 0, du: 1, dout: 0, vis: false, speed: 0, rise: 1 }; this.dk = { u: 0, out: 0, du: 0, dout: 1, vis: false, speed: 0 }; this.tmp = { u: 0, out: 0, du: 0, dout: 1, vis: false, speed: 0, rise: 1 };
    this.rings = Array.from({ length: NR + 12 }, () => ({ u: 0, o: 0, age: 0, amp: 0 }));
    // the dance, six bars round and round (loud, then soft, as he has it)
    const s = this.score = score(L), soft = L.calm ? 0.75 : 1;
    for (let r = 0, t0 = T_MUS; r < 14; r++) {
      const k = (r % 2 ? 0.6 : 1) * soft;
      s.tune(VLN1, t0, 180, { type: 'triangle', vol: 0.017 * k, over: 2, overVol: 0.22, legato: 0.86 });
      s.tune(VLN2, t0, 180, { type: 'triangle', vol: 0.009 * k, legato: 0.86 });
      s.tune(DRONE, t0, 180, { type: 'sine', vol: 0.006 * k, legato: 1.0 });
      t0 = s.tune(BASS, t0, 180, { type: 'sine', vol: 0.009 * k, legato: 1.0 });
    }
    s.done();
    this.lap = L.voice().loop({ lp: 620, hp: 150 });
    this.hideAll();
  },

  // ---------------------------------------------------------------- the floor: his water, the rings, the reflections
  buildFloor(L, col) {
    const F = (u, o) => L.floor(u, o, V3()).toArray(), pos = [];
    const a = F(-1.62, -L.wall), b = F(1.2, -L.wall), c = F(1.2, 1.1), d = F(-1.62, 1.1);
    pos.push(...a, ...b, ...c, ...a, ...c, ...d);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    // his water's level streaks: long thin drags of a nearly dry brush, along the wall
    const streak = canvasTexture(256, 128, (x, w, h) => {
      x.fillStyle = 'rgb(84,84,84)'; x.fillRect(0, 0, w, h); x.lineCap = 'round';
      for (let i = 0; i < 120; i++) {
        const y = L.rand() * h, x0 = L.rand() * w, len = 30 + L.rand() * 170, v = 60 + Math.floor(L.rand() * 195);
        x.strokeStyle = `rgba(${v},${v},${v},${0.3 + 0.55 * L.rand()})`; x.lineWidth = 0.8 + L.rand() * 2.6;
        for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { x.beginPath(); x.moveTo(x0 + ox, y + oy); x.quadraticCurveTo(x0 + ox + len / 2, y + oy + (L.rand() - 0.5) * 3, x0 + ox + len, y + oy + (L.rand() - 0.5) * 2); x.stroke(); }
      }
    }, false);
    streak.wrapS = streak.wrapT = THREE.RepeatWrapping;
    // a field of his dabs, for where the water breaks and where its edge wanders (each dab's own number is in its alpha)
    const sand = strokes({
      size: 256, seed: 23333, n: 1900, len: [7, 18], width: [4, 9], bend: 0.35, lift: 0.16, base: col('#7a5f47', 0.3).getStyle(),
      colors: [['#93735a', 3], ['#7c6049', 3], ['#a98a6c', 1.8], ['#6d543e', 2]].map(([c, w]) => [col(c, 0.2).getStyle(), w]),
      angle: (x, y, r) => (r() - 0.5) * 0.9 + 0.1,
    });
    const u = this.u = {
      uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uPool: { value: new THREE.Vector4(POOL.u, POOL.o, POOL.a, POOL.b) },
      uSpread: { value: 0 }, uTime: { value: 0 }, uCalm: { value: 0 }, uDuck: { value: new THREE.Vector4(0, 0, 0, 0) }, uDog: { value: new THREE.Vector4(0, 0, 0, 0) }, uWide: { value: new THREE.Vector4(0.1, 0.08, 0, 0) }, cCream: { value: col('#d9c6a8', 0.25) },
      uRing: { value: Array.from({ length: NR }, () => new THREE.Vector4(0, 0, 0, 0)) }, tStreak: { value: streak }, tSand: { value: sand },
      cDeep: { value: col('#15110d', 0.2) }, cMid: { value: col('#241d17', 0.25) }, cStreak: { value: col('#3f4b48', 0.12) }, cGlint: { value: col('#8fa39a', 0.08) },
      cFoam: { value: col('#b9c9bc', 0.08) }, cShallow: { value: col('#3a2d21', 0.3) }, cWet: { value: col('#1a1410', 0.3) },
    };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform vec3 uO, cCream; uniform vec4 uAx, uPool, uDuck, uDog, uWide; uniform float uSpread, uTime, uCalm; uniform vec4 uRing[${NR}];
uniform sampler2D tStreak, tSand; uniform vec3 cDeep, cMid, cStreak, cGlint, cFoam, cShallow, cWet;
uniform sampler2D tRefl; uniform mat4 reflMatrix; uniform float reflOn; uniform float reflY;
vec3 fCol; float fA;
// The reflection of something white standing h high at p, w wide: a pale shape lying on the water from its foot towards the eye.
float mirrored(vec2 st, vec2 p, float h, float w, vec2 eye, float eyeH, float wob) {
  vec2 to = eye - p; float d = length(to) + 1e-4; to /= d;
  float len = h * d / max(0.2, eyeH + h), al = dot(st - p, to), ac = dot(st - p, vec2(-to.y, to.x)) + wob * (0.4 + al * 3.0);
  return smoothstep(-0.02, 0.05, al) * (1.0 - smoothstep(len * 0.45, len * 1.05, al)) * exp(-ac * ac / (w * w)) * step(0.001, h);
}
float poolD(vec2 q) { vec2 e = vec2((q.x - uPool.x) / uPool.z, (q.y - uPool.y) / uPool.w); float a = atan(e.y, e.x);
  return length(e) / (1.0 + 0.06 * sin(3.0 * a + 0.6) + 0.045 * sin(5.0 * a + 2.1) + 0.03 * sin(8.0 * a + 0.9)); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz; float su = dot(lq, uAx.xy), so = dot(lq, uAx.zw); vec2 st = vec2(su, so);
  vec4 bk = texture2D(tSand, st / 0.62), fine = texture2D(tSand, st / 0.34 + 0.31);
  float pd = poolD(st) + (bk.a - 0.55) * 0.05;
  if (pd > 1.06 || uSpread < 0.001) discard;          // (nothing of it out here: no need to work the rings out)
  float water = 1.0 - smoothstep(0.965, 1.0, pd), margin = (1.0 - smoothstep(1.0, 1.05, pd)) * (1.0 - water);
  // the rings: each a short train of ripples widening from where it began
  float rip = 0.0; vec2 grad = vec2(0.0);
  for (int i = 0; i < ${NR}; i++) {
    vec4 R = uRing[i]; if (R.w <= 0.0) continue;
    vec2 dv = st - R.xy; float d = length(dv) + 1e-4, x = d - (0.03 + 0.33 * R.z), wd = 0.034 + 0.024 * R.z;
    float env = exp(-x * x / (wd * wd)) * R.w * exp(-R.z * 0.85) * smoothstep(0.0, 0.1, R.z);
    rip += env * cos(x * 84.0); grad += dv / d * env * (-sin(x * 84.0));
  }
  // dark water, his level streaks drifting on it
  float sk = texture2D(tStreak, vec2(su * 0.5 + uTime * 0.011, so * 1.7 + rip * 0.012)).r, sk2 = texture2D(tStreak, vec2(su * 0.27 - uTime * 0.007 + 0.37, so * 0.9 + 0.5)).r;
  vec3 c = mix(cDeep, cMid, smoothstep(0.25, 0.8, sk * 0.6 + sk2 * 0.4));
  c = mix(c, cStreak, smoothstep(0.72, 0.95, sk) * 0.6);
  c = mix(c, cShallow, smoothstep(0.78, 1.0, pd) * 0.4);
  // the lit wall and the foot of the frame upside down in it, dimly, as dark water holds them; bent by the rings
  vec4 rp = reflMatrix * vec4(lifeP, 1.0); vec2 ruv = rp.xy / rp.w + grad * 0.022 + vec2(0.0, (sk - 0.5) * 0.004);
  float on = reflOn * (1.0 - step(0.08, abs(lifeP.y - reflY)));
  vec3 refl = min(texture2D(tRefl, ruv).rgb, vec3(1.3));
  c += refl * vec3(0.16, 0.145, 0.12) * on * (0.6 + 0.4 * sk2);
  {
    vec2 cq = cameraPosition.xz - uO.xz, eye = vec2(dot(cq, uAx.xy), dot(cq, uAx.zw)); float eyeH = cameraPosition.y - uO.y, wob = rip * 0.02 + 0.006 * sin(so * 70.0 + uTime * mix(2.6, 1.3, uCalm));
    float m = max(mirrored(st, uDuck.xy, uDuck.w, uWide.x, eye, eyeH, wob), mirrored(st, uDog.xy, uDog.w, uWide.y, eye, eyeH, wob));
    c = mix(c, cCream * (0.5 + 0.3 * sk), m * 0.42 * (0.3 + 0.7 * smoothstep(0.3, 0.75, sk)));      // (broken into his level streaks)
  }
  // his light comes from the left: it catches the near face of each ripple, and the far face is darker
  float lit = dot(grad, vec2(-0.8, 0.6));
  c += cGlint * max(lit, 0.0) * 0.62 * (0.55 + 0.6 * fine.a); c *= 1.0 - 0.32 * clamp(-lit, 0.0, 1.0);
  // the water broken into pale dabs under the duck's wings, and a little at the dog's chest
  float dd = length(st - uDuck.xy), dg = length(st - uDog.xy);
  float flick = mix(0.5 + 0.5 * sin(uTime * 17.0 + fine.a * 40.0), 0.6, uCalm);
  float churn = exp(-dd * dd / 0.016) * uDuck.z * smoothstep(0.55, 0.95, fine.a + 0.3 * flick) + exp(-dg * dg / 0.006) * uDog.z * smoothstep(0.6, 0.95, fine.a + 0.25 * flick);
  c = mix(c, mix(cGlint, cFoam, fine.a), clamp(churn, 0.0, 0.62));
  // where it meets the boards: a glint here and there, coming and going
  float lap = smoothstep(0.94, 0.968, pd) * (1.0 - smoothstep(0.968, 0.992, pd)) * smoothstep(0.6, 0.85, bk.a);
  c += cGlint * lap * (0.3 + 0.2 * mix(sin(uTime * 1.2 + su * 6.0), 0.0, uCalm));
  // it all comes from the foot of the wall, and goes back there
  float grow = smoothstep(0.0, 0.07, uSpread * 1.22 - so / 0.95 - bk.a * 0.14) * step(0.001, uSpread);
  fCol = c;
  fA = max(water * 0.97, margin * 0.36) * grow;
  if (water < 0.5) fCol = mix(cWet, fCol, water * 2.0);
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'piazzetta-pool';
    this.pool = new THREE.Mesh(g, m); this.pool.position.y = SURF; this.pool.renderOrder = 5; L.add(this.pool);
    Object.assign(u, L.mirrored(this.pool));          // (the room's own reflection: shown and hidden by its material)
  },

  // ---------------------------------------------------------------- the rig: the dog, the duck, the reeds
  buildRig(L, col) {
    const rig = this.rig = L.rig(34, 170000, L.paint({ glow: 0.34, rough: 0.92, side: THREE.DoubleSide }));
    const R = () => L.rand(), rr = (a, b) => a + (b - a) * L.rand(), pick = list => list[Math.min(list.length - 1, Math.floor(L.rand() * list.length))];
    const sst = THREE.MathUtils.smoothstep;
    const KEY = V3(-0.26, 0.92, 0.3).normalize();           // his light: high, from the left and a little in front
    // his whites: cream in the light, a warm grey in the half tone, grey-brown in the shade (umber only in the deepest)
    const WL = col('#eedcc0', 0.25), WM = col('#cbb497', 0.3), WS = col('#94806c', 0.3), WD = col('#59473a', 0.3);
    const RU = col('#8a5636', 0.3), RUD = col('#5a3a26', 0.3), INK = col('#1e1611', 0.3);
    // (the modelling is painted in softly, and mostly from above, so that a thing may turn or rear up and still be white)
    const tone = (n, j = 0, into = new THREE.Color()) => { const k = n.dot(KEY) * 0.5 + 0.5 + j; return k < 0 ? into.copy(WS).lerp(WD, clamp01(-k * 2)) : k < 0.45 ? into.copy(WS).lerp(WM, sst(k, 0, 0.45)) : into.copy(WM).lerp(WL, sst(k, 0.45, 0.92)); };
    const white = k => (k < 0.5 ? WS.clone().lerp(WM, clamp01(k * 2)) : WM.clone().lerp(WL, clamp01(k * 2 - 1)));
    const ell = (C, Rd, c, detail = 2, rx = 0) => shape.move(shape.ball(1, c, detail), C[0], C[1], C[2], rx, 0, 0, Rd[0], Rd[1], Rd[2]);
    // each vertex its own colour, from where it is and how it faces (so the modelling is soft, never facet by facet)
    const vpaint = (g, fn) => { const p = g.attributes.position, nn = g.attributes.normal, c = g.attributes.color, v = V3(), n = V3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); n.fromBufferAttribute(nn, i).normalize(); const k = fn(v, n); c.setXYZ(i, k.r, k.g, k.b); } return g; };
    // a point on an ellipsoid and its normal
    const onEll = (C, Rd, y, ph) => { const s = Math.sqrt(Math.max(0, 1 - y * y)), p = V3(C[0] + Rd[0] * s * Math.cos(ph), C[1] + Rd[1] * y, C[2] + Rd[2] * s * Math.sin(ph)); return { p, n: V3((p.x - C[0]) / (Rd[0] * Rd[0]), (p.y - C[1]) / (Rd[1] * Rd[1]), (p.z - C[2]) / (Rd[2] * Rd[2])).normalize() }; };
    // A dab: a soft rounded lozenge of paint lying on a form, its tail lifted off it, lighter along the middle (the
    // loaded brush). { p, n, up (the way it was drawn), l, w, lift, c }
    const cen = V3(), side = V3(), up = V3(), rim = Array.from({ length: 8 }, () => V3()), lc = new THREE.Color();
    const dab = (A, d) => {
      side.crossVectors(d.n, d.up).normalize(); up.crossVectors(side, d.n).normalize();
      cen.copy(d.p).addScaledVector(d.n, 0.002);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + 0.2, x = Math.cos(a) * d.w / 2, y = Math.sin(a) * d.l / 2; rim[k].copy(cen).addScaledVector(side, x * (1 - 0.3 * Math.max(0, -Math.sin(a)))).addScaledVector(up, y).addScaledVector(d.n, d.lift * d.l * Math.max(0, -Math.sin(a)) - 0.0012); }
      lc.copy(d.c).multiplyScalar(1.04);
      for (let k = 0; k < 8; k++) A.tri(cen, rim[k], rim[(k + 1) % 8], d.n, d.n, d.n, lc, d.c, d.c);
    };
    // dabs over an ellipsoid: n of them, drawn along dir(p, n), coloured c(p, n); keep(p, n) leaves some out
    const coat = (A, C, Rd, n, { l = [0.03, 0.045], w = [0.02, 0.03], lift = [0.08, 0.24], dir, c, keep = null, grow = 1.0 }) => {
      for (let i = 0; i < n; i++) {
        const s = onEll(C, [Rd[0] * grow, Rd[1] * grow, Rd[2] * grow], 1 - 2 * R(), R() * TAU); if (keep && !keep(s.p, s.n)) continue;
        const dv = dir(s.p, s.n), u2 = dv.clone().addScaledVector(s.n, -dv.dot(s.n)); if (u2.lengthSq() < 1e-6) continue;
        dab(A, { p: s.p, n: s.n, up: u2.normalize(), l: rr(l[0], l[1]), w: rr(w[0], w[1]), lift: rr(lift[0], lift[1]), c: c(s.p, s.n) });
      }
    };
    // A long stroke: a feather, a lock of wet hair, a reed. pts down its middle; wid(s) its width; flat (the way
    // across it, roughly); hint (the way its face looks); colour(s). A ridge along the middle catches the light.
    const tan = V3(), sd = V3(), nr = V3();
    const stroke = (A, pts, wid, flat, hint, colour, camber = 0.22) => {
      const n = pts.length, rows = [];
      for (let i = 0; i < n; i++) {
        tan.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
        sd.copy(flat).addScaledVector(tan, -flat.dot(tan)).normalize(); nr.crossVectors(sd, tan).normalize(); if (nr.dot(hint) < 0) nr.negate();
        const s = i / (n - 1), w = wid(s) / 2, c = colour(s);
        rows.push({ l: pts[i].clone().addScaledVector(sd, -w), m: pts[i].clone().addScaledVector(nr, camber * w), r: pts[i].clone().addScaledVector(sd, w), nl: nr.clone().addScaledVector(sd, -camber * 2).normalize(), nm: nr.clone(), nrr: nr.clone().addScaledVector(sd, camber * 2).normalize(), c: c.clone(), e: c.clone().multiplyScalar(0.86) });
      }
      for (let i = 0; i < n - 1; i++) {
        const a = rows[i], b = rows[i + 1];
        A.tri(a.l, a.m, b.m, a.nl, a.nm, b.nm, a.e, a.c, b.c); A.tri(a.l, b.m, b.l, a.nl, b.nm, b.nl, a.e, b.c, b.e);
        A.tri(a.m, a.r, b.r, a.nm, a.nrr, b.nrr, a.c, a.e, b.e); A.tri(a.m, b.r, b.m, a.nm, b.nrr, b.nm, a.c, b.e, b.c);
      }
    };
    const leaf = s => Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + 0.9 * s)), 0.55);          // a feather's outline: blunt at the root, round at the tip
    const mixc = (a, b, k) => a.clone().lerp(b, clamp01(k));

    // ---------------------------------------------------------- the dog: a white head on the water
    {
      const SK = [[0, 0.052, 0.006], [0.055, 0.05, 0.066]], MZ = [[0, 0.036, 0.1], [0.03, 0.026, 0.062]], BR = [[0, 0.052, 0.07], [0.025, 0.02, 0.052]], NK = [[0, 0.004, -0.045], [0.05, 0.05, 0.07]];
      // (as he has it: white on the crown and the cheek, a warm brown wash round the eye and along the muzzle)
      const wash = v => Math.min(1, 0.7 * Math.exp(-(Math.pow((Math.abs(v.x) - 0.03) / 0.018, 2) + Math.pow((v.y - 0.06) / 0.02, 2) + Math.pow((v.z - 0.066) / 0.026, 2))) + 0.7 * sst(v.z, 0.08, 0.125) * (1 - sst(v.z, 0.15, 0.165)) * sst(v.y, 0.012, 0.03));
      const fur = (v, n) => tone(n, 0.06).lerp(RU, 0.62 * wash(v)).lerp(RUD, 0.3 * sst(v.z, 0.125, 0.16));
      const parts = [vpaint(ell(...SK, WM, 3), fur), vpaint(ell(...MZ, WM, 3), fur), vpaint(ell(...BR, WM, 2), fur)];
      parts.push(vpaint(ell([0, 0.014, 0.086], [0.025, 0.014, 0.054], WM, 2), (v, n) => tone(n, -0.1)));              // the chin, in the water's shade
      for (const s of [-1, 1]) {
        parts.push(vpaint(ell([s * 0.029, 0.024, 0.052], [0.021, 0.024, 0.042], WM, 2), fur));                        // the jowl
        parts.push(ell([s * 0.0295, 0.066, 0.0625], [0.0086, 0.008, 0.0062], RU, 2), ell([s * 0.0303, 0.0662, 0.0652], [0.0062, 0.006, 0.0054], col('#22160f', 0.2), 2));      // a dark eye in its brown rim
        parts.push(ell([s * 0.0318, 0.0685, 0.0692], [0.002, 0.002, 0.0016], WL, 1));                                // and the light in it
        parts.push(vpaint(ell([s * 0.027, 0.0765, 0.054], [0.0155, 0.0062, 0.0145], WM, 2), (v, n) => tone(n, 0.16)));  // the brow
      }
      parts.push(ell([0, 0.04, 0.159], [0.012, 0.0105, 0.0105], INK, 2));                                              // the nose
      parts.push(ell([0, 0.0445, 0.163], [0.005, 0.0034, 0.005], col('#6a5a50', 0.2), 1));                             // (wet)
      parts.push(vpaint(ell(...NK, WM, 2), (v, n) => tone(n, 0.0)));                                                   // the neck, going under
      // wet hair, laid back from the muzzle over the crown in long soft dabs
      const A = new Acc(), back = V3(0, 0.15, -1), hair = (p, n) => tone(n, 0.06 + rr(-0.12, 0.1)).lerp(RU, 0.55 * wash(p));
      coat(A, ...SK, 260, { l: [0.034, 0.058], w: [0.012, 0.02], lift: [0.04, 0.16], dir: () => back, c: hair, keep: (p, n) => n.y > -0.25 && !(Math.abs(p.x) < 0.042 && p.z > 0.04 && p.y > 0.04 && p.y < 0.09) });
      coat(A, ...MZ, 70, { l: [0.02, 0.03], w: [0.009, 0.014], lift: [0.02, 0.08], dir: () => back, c: hair, keep: (p, n) => n.y > 0.1 && p.z < 0.145 });
      coat(A, ...NK, 80, { l: [0.04, 0.06], w: [0.013, 0.02], lift: [0.04, 0.16], dir: () => back, c: (p, n) => tone(n, rr(-0.1, 0.05)), keep: (p, n) => n.y > 0.1 && p.z < -0.02 });
      // and the long locks of a water dog, off the crown and down the cheeks, lifting at their ends
      for (let i = 0; i < 44; i++) {
        const s0 = onEll(SK[0], SK[1], rr(-0.15, 0.95), R() * TAU); if (s0.p.z > 0.04 || (Math.abs(s0.p.x) < 0.02 && s0.p.y < 0.07)) continue;
        const d = V3(s0.p.x * 2.2, -0.55 - 0.5 * Math.abs(s0.n.x), -1).normalize(); d.addScaledVector(s0.n, -d.dot(s0.n)).normalize();
        const len = rr(0.045, 0.085), ph = R() * TAU, j = rr(-0.12, 0.1), flat = V3().crossVectors(s0.n, d).normalize();
        const pts = [0, 1, 2, 3, 4].map(k => { const q = k / 4; return s0.p.clone().addScaledVector(d, len * q).addScaledVector(s0.n, 0.003 + 0.012 * q * q).addScaledVector(flat, 0.006 * Math.sin(q * 4 + ph)); });
        stroke(A, pts, q => 0.019 * leaf(q), flat, s0.n, q => white(0.5 + j + 0.38 * q));
      }
      parts.push(A.geo());
      this.gHead = rig.geo(shape.merge(parts));
      // an ear: long, feathered, hanging from its root (down -y), its face out to the side; the other is its mirror
      const ear = mx => {
        const E = new Acc(), out = V3(mx, 0, 0);
        const flap = vpaint(ell([mx * 0.004, -0.05, -0.004], [0.007, 0.056, 0.03], WM, 2), (v, n) => white(0.55).lerp(RU, 0.22 * sst(v.y, -0.03, 0.0)));
        for (let i = 0; i < 10; i++) {
          const z0 = -0.03 + 0.06 * (i / 9) + rr(-0.004, 0.004), len = rr(0.09, 0.135) * (1 - 0.25 * Math.abs(i / 9 - 0.45)), wav = rr(-0.012, 0.012), ph = R() * TAU, j = rr(-0.1, 0.1);
          const pts = [0, 1, 2, 3, 4, 5].map(k => { const s = k / 5; return V3(mx * (0.011 + 0.004 * Math.sin(s * 3 + ph)), -0.004 - len * s, z0 * (1 - 0.3 * s) + wav * Math.sin(s * 4 + ph) - 0.012 * s); });
          stroke(E, pts, s => 0.021 * leaf(s), V3(0, 0, 1), out, s => white(0.62 + j + 0.3 * s).lerp(RU, 0.3 * (1 - s) * (1 - s)));
        }
        return shape.merge([flap, E.geo()]);
      };
      this.gEar = [rig.geo(ear(1)), rig.geo(ear(-1))];
      // the back, awash behind the head: a wet ridge with the hair streaming off it
      const Bk = new Acc(), BK = [[0, -0.032, -0.15], [0.058, 0.045, 0.125]];
      coat(Bk, ...BK, 90, { l: [0.04, 0.06], w: [0.012, 0.02], lift: [0.02, 0.1], dir: () => V3(0, 0, -1), c: (p, n) => white(rr(0.1, 0.5)), keep: (p, n) => n.y > 0.45 });
      this.gBack = rig.geo(shape.merge([vpaint(ell(...BK, WM, 2), () => white(0.2)), Bk.geo()]));
      // a forepaw, coming up through the surface
      const paw = [vpaint(ell([0, 0, 0], [0.022, 0.017, 0.03], WM, 2), (v, n) => tone(n, 0.1))];
      for (const x of [-0.011, 0, 0.011]) paw.push(vpaint(ell([x, 0.002, 0.024], [0.0075, 0.009, 0.012], WM, 1), (v, n) => tone(n, 0.15)));
      this.gPaw = rig.geo(shape.merge(paw));
    }

    // ---------------------------------------------------------- the duck: white, pied with russet, an ochre bill
    {
      const HULL = [[0, 0.04, -0.005], [0.083, 0.07, 0.152]], BREAST = [[0, 0.05, 0.095], [0.064, 0.062, 0.072]], RUMP = [[0, 0.062, -0.125], [0.052, 0.042, 0.075]];
      // (pied as he has it: a russet patch low on the flank towards the tail, and one at the shoulder)
      const pied = p => Math.max(sst(-p.z, 0.01, 0.08) * sst(Math.abs(p.x), 0.04, 0.066) * (1 - sst(p.y, 0.062, 0.092)) * (0.6 + 0.4 * Math.sin(p.z * 70 + p.y * 40)), sst(p.z, 0.085, 0.12) * sst(p.y, 0.035, 0.06) * (1 - sst(p.y, 0.08, 0.1)) * sst(Math.abs(p.x), 0.012, 0.035) * 0.9) * 0.78;
      const plum = (v, n, j = 0) => tone(n, 0.1 + j).lerp(n.dot(KEY) > 0.1 ? RU : RUD, pied(v));
      const parts = [vpaint(ell(...HULL, WM, 3), plum), vpaint(ell(...BREAST, WM, 3), plum), vpaint(ell(...RUMP, WM, 2), plum)];
      const A = new Acc(), aft = V3(0, 0.1, -1), fc = (p, n) => plum(p, n, rr(-0.13, 0.1));
      coat(A, ...HULL, 200, { l: [0.045, 0.065], w: [0.032, 0.044], lift: [0.02, 0.08], dir: () => aft, c: fc, keep: (p, n) => p.y > 0.0 && p.z < 0.1 });
      coat(A, ...BREAST, 90, { l: [0.034, 0.05], w: [0.026, 0.036], lift: [0.02, 0.08], dir: () => V3(0, -0.8, -0.6), c: fc, keep: (p, n) => p.z > 0.07 });
      coat(A, ...RUMP, 50, { l: [0.04, 0.055], w: [0.026, 0.036], lift: [0.02, 0.08], dir: () => aft, c: fc, keep: (p, n) => p.y > 0.03 && p.z < -0.1 });
      parts.push(A.geo());
      this.gBody = rig.geo(shape.merge(parts));
      // the tail: a short fan, cocked up, the outer feathers dark at the tip as his are
      const T = new Acc();
      for (let i = 0; i < 7; i++) {
        const a = (i / 6 - 0.5) * 1.1, dir = V3(Math.sin(a) * 0.9, 0.42, -Math.cos(a)).normalize(), len = 0.09 - 0.012 * Math.abs(i - 3), flat = V3(Math.cos(a), 0, Math.sin(a)), j = rr(-0.08, 0.08), tipDark = Math.abs(i - 3) >= 2 ? 0.5 : 0.1;
        const pts = [0, 1, 2, 3, 4].map(k => V3(0, 0.002 * i, 0).addScaledVector(dir, len * k / 4).add(V3(0, 0.012 * (k / 4) * (k / 4), 0)));
        stroke(T, pts, s => 0.034 * leaf(s), flat, V3(0, 1, 0), s => white(0.5 + j + 0.4 * s).lerp(INK, tipDark * sst(s, 0.55, 0.95)));
      }
      this.gTail = rig.geo(T.geo());
      // the neck: from its root up, a little forward, thick where it leaves the breast; russet in a stripe down its front
      {
        const N = new Acc(), rings = 9, seg = 14, ptsN = [], fr = [];
        for (let i = 0; i <= rings; i++) { const s = i / rings; ptsN.push(V3(0, 0.128 * s, 0.03 * Math.sin(s * Math.PI * 0.9) - 0.006 * s)); }
        for (let i = 0; i <= rings; i++) {
          const s = i / rings, t = V3().subVectors(ptsN[Math.min(rings, i + 1)], ptsN[Math.max(0, i - 1)]).normalize(), ex = V3(1, 0, 0), ez = V3().crossVectors(ex, t).normalize(), rad = lerp(0.032, 0.02, Math.pow(s, 0.7)) * (1 + 0.1 * Math.sin(s * Math.PI));
          fr.push(Array.from({ length: seg + 1 }, (_, j) => { const a = j / seg * TAU, n = ex.clone().multiplyScalar(Math.cos(a)).addScaledVector(ez, Math.sin(a)), c = tone(n, 0.14); c.lerp(n.x < 0 ? RU : RUD, 0.85 * sst(n.dot(ez), 0.0, 0.6) * (1 - sst(s, 0.35, 0.75))); return { p: ptsN[i].clone().addScaledVector(n, rad), n, c }; }));
        }
        for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) { const a = fr[i][j], b = fr[i][j + 1], c = fr[i + 1][j + 1], d = fr[i + 1][j]; N.tri(a.p, b.p, c.p, a.n, b.n, c.n, a.c, b.c, c.c); N.tri(a.p, c.p, d.p, a.n, c.n, d.n, a.c, c.c, d.c); }
        this.gNeck = rig.geo(N.geo()); this.neckTop = ptsN[rings].clone();
      }
      // the head: round, a dark eye, the upper bill; and the lower bill by itself, to open
      const HD = [[0, 0.017, 0.012], [0.031, 0.029, 0.04]], BILL = col('#c99a4c', 0.2), BILLD = col('#8c6a3a', 0.25);
      const billTone = (v, n) => mixc(BILLD, BILL, 0.6 + 0.5 * n.dot(KEY));
      // (a russet smudge through the eye and down the cheek, as he has it)
      const head = [vpaint(ell(...HD, WM, 3), (v, n) => tone(n, 0.14).lerp(RU, 0.6 * Math.exp(-(Math.pow((Math.abs(v.x) - 0.026) / 0.012, 2) + Math.pow((v.y - 0.014) / 0.018, 2) + Math.pow((v.z - 0.016) / 0.024, 2)))))];
      // the bill: long, broad and flat, a little turned up at the nail
      head.push(vpaint(shape.move(shape.ball(1, BILL, 2), 0, 0.012, 0.075, -0.1, 0, 0, 0.019, 0.0075, 0.04), billTone), ell([0, 0.018, 0.112], [0.007, 0.0042, 0.005], BILLD, 1));
      for (const s of [-1, 1]) head.push(ell([s * 0.0262, 0.025, 0.028], [0.0046, 0.005, 0.005], INK, 1));
      this.gDHead = rig.geo(shape.merge(head));
      this.gBill = rig.geo(vpaint(ell([0, -0.003, 0.034], [0.0165, 0.005, 0.036], BILLD, 2), billTone));
      // A wing, open, from the shoulder: the span along x, the feathers pointing back (-z); the other is its mirror.
      // A full fan, as he paints it: long flight feathers under two rows of coverts, each a soft stroke, cream at the
      // tip and greyer towards the root; the outer primaries dark at the tip.
      const wing = mx => {
        const W = new Acc(), LE = [[0, 0, 0], [0.078, 0.004, -0.014], [0.155, 0.0, 0.01], [0.22, -0.004, -0.024]].map(([x, y, z]) => V3(mx * x, y, z));
        const lead = t => { const f = clamp01(t) * 3, i = Math.min(2, Math.floor(f)); return LE[i].clone().lerp(LE[i + 1], f - i); };
        const upv = V3(0, 1, 0);
        const feather = (root, ang, len, wd, y, shade, dark) => {
          const dir = V3(mx * Math.sin(ang), 0, -Math.cos(ang)), flat = V3(mx * Math.cos(ang), 0, Math.sin(ang)), j = rr(-0.07, 0.07);
          const pts = [0, 1, 2, 3, 4, 5].map(k => { const s = k / 5; return root.clone().addScaledVector(dir, len * s).add(V3(0, y - 0.014 * s * s * (len / 0.14), 0)); });
          stroke(W, pts, s => wd * leaf(s), flat, upv, s => white(shade + j + 0.32 * s).lerp(INK, dark * sst(s, 0.55, 0.94)));
        };
        for (let i = 0; i < 10; i++) { const s = i / 9; feather(lead(0.58 + 0.42 * s), lerp(0.3, 1.5, Math.pow(s, 0.85)), lerp(0.15, 0.185, Math.sin(Math.PI * (0.2 + 0.6 * s))), 0.043, -0.006 + 0.0005 * i, 0.4, s > 0.6 ? 0.6 : 0.1); }      // primaries
        for (let i = 0; i < 9; i++) { const s = i / 8; feather(lead(0.03 + 0.55 * s), lerp(-0.15, 0.3, s), lerp(0.125, 0.15, s), 0.043, -0.003 + 0.0005 * i, 0.5, 0.04); }                                                     // secondaries
        for (let i = 0; i < 12; i++) { const s = i / 11; feather(lead(0.02 + 0.96 * s).add(V3(0, 0, -0.004)), lerp(-0.1, 1.3, s * s) + rr(-0.08, 0.08), rr(0.07, 0.086), 0.037, 0.003 + 0.0004 * i, 0.62, 0); }                    // the greater coverts
        for (let i = 0; i < 11; i++) { const s = i / 10; feather(lead(0.0 + 0.97 * s).add(V3(0, 0, 0.006)), lerp(-0.1, 1.2, s * s) + rr(-0.1, 0.1), rr(0.04, 0.05), 0.03, 0.0065 + 0.0004 * i, 0.72, 0); }                          // the lesser, lightest
        const arm = vpaint(ell([mx * 0.105, 0.005, 0.004], [0.115, 0.009, 0.014], WM, 2), () => white(0.85));
        return shape.merge([arm, W.geo()]);
      };
      this.gWing = [rig.geo(wing(1)), rig.geo(wing(-1))];
    }

    // ---------------------------------------------------------- his reeds: long blades arcing over, olive and ochre
    {
      const greens = ['#6b6a3c', '#7d7a48', '#5a5e38', '#8c8456', '#9a8a50', '#66704e', '#b09a62'].map(c => col(c, 0.2)), dark = col('#3a3020', 0.3);
      const clump = (nb, seed) => {
        const C = new Acc();
        for (let i = 0; i < nb; i++) {
          const a = (i / nb) * TAU + seed + rr(-0.3, 0.3), len = rr(0.24, 0.42), lean = rr(0.05, 0.3), arc = R() < 0.4 ? rr(0.5, 0.95) : rr(0.08, 0.3), w0 = rr(0.02, 0.034), c0 = pick(greens), tip = mixc(c0, greens[6], 0.5);
          const dir = V3(Math.cos(a), 0, Math.sin(a)), flat = V3(-Math.sin(a), 0, Math.cos(a)), root = V3(Math.cos(a) * rr(0, 0.04), 0, Math.sin(a) * rr(0, 0.04));
          const pts = Array.from({ length: 9 }, (_, k) => { const s = k / 8; return root.clone().addScaledVector(dir, len * (lean * s + arc * s * s * 0.6)).add(V3(0, len * (s - arc * 0.62 * s * s * s), 0)); });
          stroke(C, pts, s => w0 * (1 - Math.pow(s, 1.6)) + 0.0015, flat, V3(dir.x * 0.5, 0.6, dir.z * 0.5), s => mixc(dark, c0, 0.35 + 1.6 * s).lerp(tip, sst(s, 0.5, 1.0)), 0.3);
        }
        return C.geo();
      };
      this.gReed = [rig.geo(clump(10, 0.4)), rig.geo(clump(9, 2.2)), rig.geo(clump(11, 4.1))];
    }

    const add = g => { const i = rig.add(g); rig.show(i, false); return i; };
    this.dog = { head: add(this.gHead), back: add(this.gBack), ear: [add(this.gEar[0]), add(this.gEar[1])], paw: [add(this.gPaw), add(this.gPaw)] };
    this.duck = { body: add(this.gBody), neck: add(this.gNeck), head: add(this.gDHead), bill: add(this.gBill), wing: [add(this.gWing[0]), add(this.gWing[1])], tail: add(this.gTail) };
    this.reeds = REEDS.map(r => add(this.gReed[r[2]]));
    this.all = [this.dog.head, this.dog.back, ...this.dog.ear, ...this.dog.paw, ...Object.values(this.duck).flat(), ...this.reeds];
  },

  // ---------------------------------------------------------------- the drops: soft quads, one instanced mesh
  buildCards(L, col) {
    const atlas = canvasTexture(128, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      // 0: a drop, bright in the middle
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      // 1: a dab of broken water: a few loaded strokes, ragged
      g.save(); g.beginPath(); g.rect(64, 0, 64, 64); g.clip(); g.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const y = 32 + (L.rand() - 0.5) * 26, half = 22 * Math.sqrt(Math.max(0.1, 1 - Math.pow((y - 32) / 16, 2))); g.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * L.rand()})`; g.lineWidth = 3 + L.rand() * 4; g.beginPath(); g.moveTo(96 - half * (0.6 + 0.4 * L.rand()), y); g.quadraticCurveTo(96, y - 5 + L.rand() * 4, 96 + half * (0.6 + 0.4 * L.rand()), y + (L.rand() - 0.5) * 4); g.stroke(); }
      g.restore();
    }, false);
    const geo = new THREE.PlaneGeometry(1, 1);
    this.aInfo = new THREE.InstancedBufferAttribute(new Float32Array(N_CARD * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(N_CARD * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aInfo', this.aInfo); geo.setAttribute('aCol', this.aCol);
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      sh.uniforms.tAtlas = { value: atlas };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aInfo; attribute vec3 aCol; varying vec3 vInfo; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <project_vertex>', `vec4 mvPosition = modelViewMatrix * vec4(instanceMatrix[3].xyz, 1.0);
  float cs = cos(aInfo.z), sn = sin(aInfo.z); vec2 q = vec2(cs * position.x - sn * position.y, sn * position.x + cs * position.y);
  mvPosition.xy += vec2(q.x * instanceMatrix[0][0], q.y * instanceMatrix[1][1]);
  vQ = position.xy + 0.5; vInfo = aInfo; vCol = aCol;
  gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D tAtlas; varying vec3 vInfo; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <map_fragment>', `{
  vec4 tx = texture2D(tAtlas, vec2((clamp(vQ.x, 0.02, 0.98) + (vInfo.x < 0.5 ? 0.0 : 1.0)) * 0.5, clamp(vQ.y, 0.02, 0.98)));
  float a = tx.a * vInfo.y; if (a < 0.01) discard;
  diffuseColor = vec4(vCol, a);
}`);
    };
    m.customProgramCacheKey = () => 'piazzetta-drops';
    const mesh = this.cards = new THREE.InstancedMesh(geo, m, N_CARD);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.count = 0; mesh.renderOrder = 7;
    L.add(mesh);
    const Rn = n => Array.from({ length: n }, () => ({ a: L.rand(), b: L.rand(), c: L.rand(), d: L.rand(), e: L.rand() }));
    this.rFlap = Rn(N_FLAP); this.rShake = Rn(N_SHAKE); this.rDip = Rn(N_DIP); this.rChurn = Rn(14);
    this.cDrop = [col('#c4d2c6', 0.06), col('#e9e2cf', 0.1), col('#9fb4aa', 0.08)];
    this.cm = new THREE.Matrix4(); this.nc = 0;
  },

  hideAll() { for (const i of this.all) this.rig.show(i, false); if (this.cards) this.cards.count = 0; },

  // ---------------------------------------------------------------- when things happen (all from show-time t)
  // The bath that is going on at t, or the last one: its number and when its wings open.
  bath(t) { const n = Math.max(0, Math.floor((t - T_FLAP + 3.2) / ROUND)); return { n, t0: T_FLAP + n * ROUND }; },
  beat(L) { return L.calm ? 2 * Q : Q; },
  beats(L) { return L.calm ? 3 : 5; },
  // The duck's dips before bath n (two, a while before it).
  dips(n) { return n === 0 ? DIPS0 : [T_FLAP + n * ROUND - 5.6, T_FLAP + n * ROUND - 3.1]; },

  // The dog on the water at t: up out of it by the wall and across; treading water by the duck; round the pool; back.
  dogAt(t, o) {
    o.vis = t >= T_DOG; o.rise = ease.out(ramp(t, T_DOG, T_DOG + 0.6));
    if (t < this.tgo) {
      const k = clamp01((t - T_DOG) / (T_STOP - T_DOG)), s = Math.min(0.9995, trip(k, 0.2));
      this.pathIn.getPointAt(s, this.p); this.pathIn.getTangentAt(s, this.tg);
      o.speed = k >= 1 ? 0 : clamp01((trip(k + 0.01, 0.2) - trip(k - 0.01, 0.2)) / 0.02 * 0.9);
    } else {
      const x = ((t - this.tgo) % ROUND) / this.tround;
      if (x >= 1) { this.p.set(STOP[0], 0, STOP[1]); this.tg.set(HEAD[0], 0, HEAD[1]).normalize(); o.speed = 0; }
      else { const s = trip(x) % 1; this.loop.getPointAt(s, this.p); this.loop.getTangentAt(s, this.tg); o.speed = clamp01((trip(x + 0.01) - trip(x - 0.01)) / 0.02 * 0.9); }
    }
    o.u = this.p.x; o.out = this.p.z; o.du = this.tg.x; o.dout = this.tg.z;
    return o;
  },
  // The duck at t: out through the reeds to its place, and there it stays, drifting a little.
  duckAt(t, o) {
    o.vis = t >= T_DUCK[0];
    const k = clamp01((t - T_DUCK[0]) / (T_DUCK[1] - T_DUCK[0])), s = ease.out(k) * 0.999;
    this.duckIn.getPointAt(s, this.p); this.duckIn.getTangentAt(s, this.tg);
    const st = ease.smooth(ramp(t, T_DUCK[1] - 0.3, T_DUCK[1] + 0.8));
    o.u = this.p.x + st * 0.014 * Math.sin(t * 0.53); o.out = this.p.z + st * 0.011 * Math.sin(t * 0.41 + 1);
    o.du = this.tg.x; o.dout = this.tg.z; o.speed = k >= 1 ? 0 : 1 - k;
    return o;
  },

  // The rings on the water at t (ages in seconds), into this.rings; returns how many. `shift` is added to every age
  // (the Return: the show's last rings go on widening).
  ringsAt(L, t, shift = 0) {
    const list = this.rings; let n = 0;
    const put = (u, o, t0, amp) => { const age = t - t0 + shift; if (age < 0 || age > RING_LIFE || n >= list.length) return; const r = list[n++]; r.u = u; r.o = o; r.age = age; r.amp = amp; };
    const o = this.tmp;
    // the dog's wake, and the duck's as it comes out
    put(DOG_IN[0][0], DOG_IN[0][1], T_DOG - 0.45, 0.5); put(DOG_IN[0][0], DOG_IN[0][1], T_DOG + 0.05, 0.9);
    for (let k = Math.max(Math.ceil((T_DOG + 0.4) / WAKE), Math.floor((t - RING_LIFE) / WAKE)); k * WAKE <= t; k++) { const tk = k * WAKE; this.dogAt(tk, o); if (o.speed > 0.08) put(o.u - o.du * 0.05, o.out - o.dout * 0.05, tk, 0.34 + 0.3 * o.speed); else if (k % 3 === 0) put(o.u, o.out, tk, 0.2); }
    for (let k = Math.ceil(T_DUCK[0] / 0.36); k * 0.36 < T_DUCK[1] && k * 0.36 <= t; k++) { const tk = k * 0.36; this.duckAt(tk, o); if (o.out > 0) put(o.u, o.out, tk, 0.42); }
    // the bath: a ring for every dip and every wingbeat, one as it sits down, and the dog's shake
    const b = this.bath(t), fb = this.beat(L), nb = this.beats(L);
    for (const n0 of [b.n - 1, b.n]) {
      if (n0 < 0) continue;
      const t0 = T_FLAP + n0 * ROUND;
      for (const td of this.dips(n0)) { put(DUCK[0], DUCK[1], td + 0.22, 0.6); put(DUCK[0], DUCK[1], td + 0.62, 0.5); }
      for (let j = 0; j < nb; j++) put(DUCK[0], DUCK[1], t0 + (j + 0.6) * fb, 1.0);
      put(DUCK[0], DUCK[1], t0 + (nb + 0.2) * fb + 0.22, 0.9);
      put(STOP[0], STOP[1], t0 + (nb + 0.2) * fb + 0.2, 0.7); put(STOP[0], STOP[1], t0 + (nb + 0.2) * fb + 0.6, 0.6);
    }
    return n;
  },

  start(L) {
    this.hideAll(); this.lastT = -1; this.lastShow = 0; this.score.from(0); this.retFrom = null;
    if (!L.quiet) { const v = L.voice(); this.plip(L, 0.5, 0.15); this.plip(L, 0.35, 0.5); noise(v, 0.55, { d: 0.7, vol: L.calm ? 0.003 : 0.005, hp: 2400, lp: 6500, attack: 0.25 }); }
  },
  back(L) {
    // note where they are, and work out their ways home: the dog under the wall where it came out, the duck into the reeds
    const t = this.lastShow || 0, d = this.dogAt(t, this.dg), k = this.duckAt(t, this.dk);
    this.retFrom = { t, spread: this.u.uSpread.value };
    this.retDog = d.vis ? curve([[d.u, d.out], [d.u + d.du * 0.12, d.out + d.dout * 0.12], [(d.u + DOG_HOME[0]) / 2 + 0.05, (d.out + DOG_HOME[1]) / 2 + 0.08], [DOG_HOME[0] + 0.1, DOG_HOME[1] + 0.08], DOG_HOME]) : null;
    this.retDuck = k.vis ? curve([[k.u, k.out], [(k.u + DUCK_HOME[0]) / 2, Math.max(0.2, k.out * 0.7)], [DUCK_HOME[0], 0.04], DUCK_HOME]) : null;
  },
  end(L) { this.hideAll(); this.u.uSpread.value = 0; this.pool.material.visible = false; this.lap.set(0); },
  reset(L) { this.end(L); },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', ret = ph === 'return', calm = L.calm;
    const t = showing ? L.t : this.lastShow || 0;
    if (showing) this.lastShow = L.t;
    this.tgo = T_GO + (calm ? 0.45 : 0); this.tround = T_ROUND - (calm ? 0.45 : 0);      // (with motion reduced the bath takes a little longer, so the dog waits a little longer)
    const rig = this.rig, B = this.B, M = this.M, u = this.u, fb = this.beat(L), nb = this.beats(L), fo = 0.2 * fb, FD = fb * nb + fo;     // (the wings are at the top of their first beat a fifth of a beat in)
    const rk = ret ? L.ret : 0, rt = ret ? L.r : 0, clock = t + rt;

    // ---- the water: out from the foot of the wall, and back
    const spread = showing ? Math.pow(ramp(t, 0.0, 1.6), 0.8) : ret ? (this.retFrom ? this.retFrom.spread : 1) * (1 - ease.inOut(ramp(rk, 0.45, 1))) : 0;
    u.uSpread.value = spread; u.uTime.value = clock; u.uCalm.value = calm ? 1 : 0; this.pool.material.visible = spread > 0.002;

    // ---- the bath: where in it we are
    const b = this.bath(t), tf = t - b.t0;                            // seconds since this bath's wings opened (negative: before)
    const gather = showing ? ease.smooth(ramp(tf, -0.36, -0.04)) * (1 - ease.smooth(ramp(tf, -0.04, 0.12))) : 0;
    const up = showing ? ease.outBack(ramp(tf, 0, 0.26)) * (1 - ease.inOut(ramp(tf, FD + 0.02, FD + 0.34))) : 0;     // standing on its tail
    const open = showing ? ease.out(ramp(tf, 0.02, 0.2)) * (1 - ease.inOut(ramp(tf, FD + 0.1, FD + 0.55))) : 0;      // the wings open
    const fphase = tf >= fo && tf < FD ? ((tf - fo) / fb) % 1 : -1;     // within a wingbeat: down in the first 0.45 of it, up in the rest
    const stroke = fphase < 0 ? (tf >= 0 && tf < fo ? 1 : 0) : fphase < 0.45 ? Math.cos(Math.PI * fphase / 0.45) : -Math.cos(Math.PI * (fphase - 0.45) / 0.55);     // 1 up, -1 down
    const sit = showing ? hump(tf, FD + 0.18, FD + 0.6) : 0;           // the sitting down again, and the plump of it
    const shuffle = showing ? hump(tf, FD + 0.5, FD + 0.78) + hump(tf, FD + 0.82, FD + 1.06) * 0.6 : 0;
    const wag = showing ? hump(tf, FD + 0.62, FD + 1.5) : 0;
    const TQ = FD + 0.6;                                               // its three quacks begin
    let quack = 0; if (showing) for (let i = 0; i < 3; i++) quack = Math.max(quack, hump(tf, TQ + i * Q, TQ + i * Q + 0.2));
    let dip = 0, toss = 0;
    if (showing) for (const td of this.dips(b.n).concat(this.dips(b.n + 1))) { dip = Math.max(dip, ease.smooth(ramp(t, td, td + 0.24)) * (1 - ease.smooth(ramp(t, td + 0.42, td + 0.6)))); toss = Math.max(toss, hump(t, td + 0.46, td + 0.95)); }
    // the dog's part in it: it flinches under the spray, then shakes its head, then sneezes
    const flinch = showing ? ease.smooth(ramp(tf, 0.1, 0.4)) * (1 - ease.smooth(ramp(tf, FD + 0.05, FD + 0.3))) : 0;
    const TS = FD + 0.12, SD = 0.78, shk = showing ? hump(tf, TS, TS + SD) : 0, sph = TAU * (calm ? 3.5 : 7) * (tf - TS);
    const sneeze = showing ? hump(tf, TS + SD + 0.14, TS + SD + 0.4) : 0;

    // ---- the duck
    const dk = this.dk; let duckOn, dyaw, dspeed, low = 0;
    if (ret) {
      if (!this.retDuck) duckOn = false;
      else {
        const k = ease.inOut(ramp(rk, 0.0, 0.8)); this.retDuck.getPointAt(k * 0.999, this.p); this.retDuck.getTangentAt(k * 0.999, this.tg);
        dk.u = this.p.x; dk.out = this.p.z; dyaw = turnTo(this.duckYaw || 0, L.yawOf(this.tg.x, this.tg.z), ease.smooth(ramp(rk, 0, 0.25))); duckOn = dk.out > -L.wall - 0.36; dspeed = Math.sin(Math.PI * clamp01(rk / 0.8)); low = ease.smooth(ramp(rk, 0.28, 0.5));
      }
    } else {
      this.duckAt(t, dk); duckOn = showing && dk.vis; dspeed = dk.speed; low = 1 - ease.smooth(ramp(t, T_DUCK[0] + 0.42, T_DUCK[0] + 0.95));      // (it comes under the wall with its head down)
      // it faces the way it comes, then watches the dog (a little behind where the dog is); for its bath it turns to the room
      const dgw = this.dogAt(Math.max(T_DOG, t - 0.4), this.tmp), watch = L.yawOf(dgw.u - dk.u, dgw.out - dk.out), front = L.yawOf(-0.24, 0.97);
      dyaw = turnTo(L.yawOf(dk.du, dk.dout), watch, ease.smooth(ramp(t, T_DUCK[1] - 0.5, T_DUCK[1] + 0.7)));
      dyaw = turnTo(dyaw, front, Math.max(ease.smooth(ramp(tf, -0.5, 0.05)) * (1 - ease.smooth(ramp(tf, FD + 0.5, FD + 1.6))), 0));
      this.duckYaw = dyaw;
    }
    for (const i of Object.values(this.duck).flat()) rig.show(i, !!duckOn);
    if (duckOn) {
      L.floor(dk.u, dk.out, this.v);
      const bob = 0.004 * Math.sin(clock * 2.3) + 0.05 * up - 0.012 * gather - 0.014 * sit + 0.006 * up * stroke - 0.008 * low;
      const pitch = -0.9 * up + 0.3 * dip - 0.16 * toss + 0.05 * gather + 0.05 * sit + 0.02 * Math.sin(clock * 1.7) + 0.05 * shuffle;
      const roll = 0.03 * Math.sin(clock * 1.3) + 0.1 * toss * Math.sin(t * 19) * (calm ? 0.4 : 1) + 0.07 * wag * Math.sin(tf * (calm ? 14 : 28));
      B.set(M.duck, this.v.x, L.y + SURF + bob * DS, this.v.z, dyaw + 0.1 * wag * Math.sin(tf * (calm ? 14 : 28)), pitch, roll, DS);
      rig.mat(this.duck.body, M.duck);
      B.child(M.tail, M.duck, 0, 0.078, -0.178, 0.5 * wag * Math.sin(tf * (calm ? 15 : 30)), -0.25 * dip + 0.2 * up, 0); rig.mat(this.duck.tail, M.tail);
      // the neck: forward and down into the water for a dip, thrown back for the toss; drawn in to gather; stretched up to the sky
      const np = 2.0 * dip - 0.75 * toss - 0.45 * gather * (1 - up) + 0.8 * up + (0.1 + 0.1 * Math.sin(clock * 0.9)) * (1 - up) * (1 - dip) * (1 - low) - 0.12 * quack + 1.3 * low;
      // (drawn in on its breast when it floats; long when it reaches down, or up)
      const nlen = 0.7 + 0.3 * Math.max(up, dip, 0.7 * toss, 0.6 * low, 0.5 * quack), nfat = 1.14 - 0.14 * up - 0.12 * gather;
      B.child(M.neck0, M.duck, 0, 0.088, 0.108, 0.25 * Math.sin(clock * 0.6) * (1 - up) * (1 - dip) * (1 - low), np, 0);
      this.w.set(nfat, nlen, nfat); M.neck.copy(M.neck0).scale(this.w); rig.mat(this.duck.neck, M.neck);
      const hp = -0.45 * np * (1 - up) * (1 - low) - 0.56 * up - 0.25 * quack * (1 - up) - 1.1 * low;
      B.child(M.dhead, M.neck0, this.neckTop.x, this.neckTop.y * nlen - 0.004, this.neckTop.z * nfat, 0.3 * Math.sin(clock * 0.47 + 1) * (1 - up) * (1 - dip) * (1 - low) - 1.0 * up, hp, 0); rig.mat(this.duck.head, M.dhead);
      const gape = 0.5 * quack + 0.22 * up * (0.5 + 0.5 * Math.sin(tf * 9));
      B.child(M.bill, M.dhead, 0, 0.0125, 0.038, 0, gape, 0); rig.mat(this.duck.bill, M.bill);
      // the wings: folded along the back, the feathers lying in over it; open, beating from the shoulder
      for (const s of [0, 1]) {
        const mx = s ? -1 : 1, o = clamp01(open + 0.12 * shuffle + 0.08 * gather + 0.1 * toss);
        const flapA = 0.34 + 0.7 * stroke, yawF = mx * lerp(1.44, 0.12 - 0.18 * stroke, o), rollF = mx * lerp(0.03, flapA, o), pitchF = lerp(0.24, -0.12 + 0.2 * stroke, o);
        this.w.set(lerp(0.62, 1.04, o), 1, lerp(0.5, 1.04, o));
        B.child(M.wing[s], M.duck, mx * lerp(0.05, 0.058, o), lerp(0.09, 0.092, o), lerp(0.062, 0.07, o), yawF, pitchF, rollF, this.w); rig.mat(this.duck.wing[s], M.wing[s]);
      }
    }
    this.w.set(1, 1, 1);

    // ---- the dog
    const dg = this.dg; let dogOn, gyaw, gspeed, under = 0;
    if (ret) {
      if (!this.retDog) dogOn = false;
      else {
        // home to where it came up, and under
        const k = ease.inOut(ramp(rk, 0.03, 0.8)); this.retDog.getPointAt(k * 0.999, this.p); this.retDog.getTangentAt(k * 0.999, this.tg);
        dg.u = this.p.x; dg.out = this.p.z; gyaw = L.yawOf(this.tg.x, this.tg.z); under = ease.inOut(ramp(rk, 0.66, 0.92)); dogOn = under < 0.995; gspeed = Math.sin(Math.PI * clamp01((rk - 0.03) / 0.77));
      }
    } else { this.dogAt(t, dg); dogOn = showing && dg.vis; gyaw = L.yawOf(dg.du, dg.dout); gspeed = dg.speed; under = 1 - dg.rise; }
    for (const i of [this.dog.head, this.dog.back, ...this.dog.ear, ...this.dog.paw]) rig.show(i, !!dogOn);
    if (dogOn) {
      L.floor(dg.u, dg.out, this.v);
      // the paddle: one forepaw on the beat, the other on the last quaver of it (the dance's long and short)
      const pb = ((clock - T_MUS) / BEAT % 1 + 1) % 1, amp = 0.45 + 0.55 * gspeed;
      const bob = 0.005 * Math.sin(TAU * pb) * amp - 0.012 * flinch + 0.01 * sneeze;
      B.set(M.dog, this.v.x, L.y + SURF + (bob - DEEP * under) * DG, this.v.z, gyaw, (ret ? 0.5 : -0.5) * Math.sin(Math.PI * under), 0, DG);
      B.child(M.back, M.dog, 0, 0, 0, -0.1 * shk * Math.sin(sph) * 0.3, 0.03 * Math.sin(TAU * pb + 1), 0.05 * Math.sin(TAU * pb) * amp); rig.mat(this.dog.back, M.back);
      const look = showing ? 1 - clamp01(gspeed * 2.5) : 0;
      const hyaw = 0.1 * Math.sin(clock * 1.1) * (1 - shk) * (1 - look) + 0.5 * shk * Math.sin(sph) + (0.6 * look - 0.8 * flinch) * (1 - shk);
      const hpitch = -0.24 + 0.05 * Math.sin(TAU * pb + 0.7) * amp + 0.3 * flinch * (1 - shk) + 0.1 * shk + 0.45 * sneeze - 0.06 * look * (1 - flinch);
      const hroll = 0.05 * Math.sin(TAU * pb) * amp + 0.62 * shk * Math.sin(sph + 0.5);
      B.child(M.head, M.dog, 0, 0.004, 0, hyaw, hpitch, hroll); rig.mat(this.dog.head, M.head);
      // the ears: spread on the water and trailing as it swims; flung out, one after the other, in the shake
      for (const s of [0, 1]) {
        const mx = s ? -1 : 1, fling = shk * (0.5 + 0.75 * Math.sin(sph - 1.2) * mx);
        const er = mx * (1.1 + 0.06 * Math.sin(clock * 2.1 + s * 2) - 0.25 * flinch * (1 - shk) + 0.3 * fling), ey = mx * (0.55 + 0.25 * gspeed - 0.3 * shk), ep = 0.2 - 0.25 * shk;
        B.child(M.ear[s], M.head, mx * 0.047, 0.066, -0.012, ey, ep, er); rig.mat(this.dog.ear[s], M.ear[s]);
        // a forepaw: down, forward and up through the surface, and down
        const q = ((pb - (s ? 2 / 3 : 0)) % 1 + 1) % 1, st = q < 0.5 ? q / 0.5 : -1, lift = st < 0 ? 0 : Math.sin(Math.PI * st);
        B.child(M.paw[s], M.dog, mx * 0.06, -0.05 + 0.06 * lift * amp, 0.035 + 0.085 * (st < 0 ? 0 : st), mx * 0.25, -0.9 + 1.3 * (st < 0 ? 0 : st), 0); rig.mat(this.dog.paw[s], M.paw[s]);
      }
    }

    // ---- the reeds: up out of the shallows, parting for the duck, shivering in the wind of its wings
    const wind = Math.max(up * (0.5 + 0.5 * Math.abs(stroke)), 0), rdown = ret ? ease.inOut(ramp(rk, 0.55, 1)) : 0;
    REEDS.forEach((r, i) => {
      const g = showing ? ease.outBack(ramp(t, 0.35 + i * 0.13, 1.25 + i * 0.13)) : ret ? 1 - rdown : 0;
      rig.show(this.reeds[i], g > 0.01); if (g <= 0.01) return;
      L.floor(r[0], r[1], this.v);
      const dx = r[0] - dk.u, dz = r[1] - dk.out, dd = Math.hypot(dx, dz) || 1, part = duckOn ? Math.max(0, 1 - dd / 0.3) * 0.5 : 0;
      const sway = 0.035 * Math.sin(clock * 1.1 + r[4]) + 0.07 * wind * Math.sin(clock * (calm ? 9 : 17) + i) + 0.04 * (1 - g);
      this.w.set(r[3] * (0.6 + 0.4 * g), r[3] * Math.max(0.02, g), r[3] * (0.6 + 0.4 * g));
      B.set(M.reed[i], this.v.x, L.y + SURF - 0.004, this.v.z, L.yawOut + r[4], sway + part * dz / dd * 0.8, -sway * 0.7 - part * dx / dd * 0.8 + 0.1 * wind, this.w); rig.mat(this.reeds[i], M.reed[i]);
    });
    this.w.set(1, 1, 1);

    // ---- the rings, and the broken water
    {
      const n = ret ? this.ringsAt(L, this.retFrom ? this.retFrom.t : t, rt) : showing ? this.ringsAt(L, t) : 0, list = this.rings, U = u.uRing.value;
      // (the strongest NR of them)
      let m = 0;
      for (let i = 0; i < n; i++) {
        const r = list[i], k = r.amp * Math.exp(-r.age * 0.8);
        if (m < NR) { U[m++].set(r.u, r.o, r.age, r.amp); continue; }
        let wi = -1, wk = k; for (let j = 0; j < NR; j++) { const kj = U[j].w * Math.exp(-U[j].z * 0.8); if (kj < wk) { wk = kj; wi = j; } }
        if (wi >= 0) U[wi].set(r.u, r.o, r.age, r.amp);
      }
      // the wakes of the two going home
      if (ret) for (const [on, o] of [[dogOn, dg], [duckOn, dk]]) if (on && m < NR && o.out > 0) { const a = (rt % WAKE); U[m++].set(o.u, o.out, a, 0.4); if (m < NR) U[m++].set(o.u, o.out, a + WAKE, 0.4); }
      if (ret && under > 0.5 && m < NR) U[m++].set(dg.u, dg.out, (under - 0.5) * 1.2, 0.9);
      for (; m < NR; m++) U[m].set(0, 0, 0, 0);
      const churn = showing ? Math.max(up * 0.9, sit * 0.8, dip * 0.5, toss * 0.6) : 0;
      u.uDuck.value.set(dk.u, dk.out, duckOn ? churn + 0.12 * dspeed : 0, duckOn ? DS * (0.15 + 0.13 * up) * (1 - low * 0.5) : 0); u.uWide.value.set(DS * (0.085 + 0.03 * open), DG * 0.07, 0, 0);
      u.uDog.value.set(dg.u + (dogOn ? dg.du * 0.13 : 0), dg.out + (dogOn ? dg.dout * 0.13 : 0), dogOn ? (0.35 + 0.4 * gspeed + 0.6 * shk) * (1 - under) : 0, dogOn ? DG * 0.085 * (1 - under) : 0);
    }

    // ---- the drops
    this.nc = 0;
    if (showing) this.spray(L, t, b, tf, fb, nb, fo, FD, TS, SD, dk, dg, up, sit, calm);
    this.cards.count = this.nc;
    if (this.nc) { this.cards.instanceMatrix.needsUpdate = true; this.aInfo.needsUpdate = true; this.aCol.needsUpdate = true; }

    // ---- sounds, as they happen
    this.lap.set((calm ? 0.007 : 0.011) * spread);
    if (showing && !L.quiet && this.lastT >= 0) {
      const was = this.lastT, hit = x => was < x && t >= x, soft = calm ? 0.6 : 1;
      // the forepaws
      if (dogOn && !shk) { const b0 = Math.floor((was - T_MUS) / BEAT * 3), b1 = Math.floor((t - T_MUS) / BEAT * 3); if (b1 > b0 && b1 % 3 !== 1) this.plip(L, (0.3 + 0.5 * gspeed) * soft, 0); }
      for (const td of this.dips(b.n).concat(this.dips(b.n + 1))) { if (hit(td + 0.2)) this.splash(L, 0.5 * soft); if (hit(td + 0.5)) this.splash(L, 0.7 * soft); }
      for (let j = 0; j < nb; j++) if (hit(b.t0 + fo + j * fb)) this.whoosh(L, soft);
      if (hit(b.t0 + FD + 0.2)) this.splash(L, 0.9 * soft);
      for (let i = 0; i < 3; i++) if (hit(b.t0 + TQ + i * Q)) this.quack(L, 0.036 * soft * (1 - 0.15 * i), 1 - 0.05 * i);
      if (hit(b.t0 + TS)) this.shakeSound(L, SD, calm);
      if (hit(b.t0 + TS + SD + 0.16)) noise(L.voice(), 0, { d: 0.1, vol: 0.016 * soft, bp: 700, q: 1.4 });
      if (hit(T_DUCK[0] + 0.5)) this.quack(L, 0.02 * soft, 1.08);
      if (hit(T_DOG + 0.05)) this.splash(L, 0.45 * soft);
    }
    if (showing) this.score.play(t);
    L.voice().place();
    this.lastT = showing ? t : this.lastT;
  },

  // One soft quad: where, how big, which (0 a drop, 1 a dab of broken water), how strong, which colour.
  card(x, y, z, size, kind, a, ci, turn = 0) {
    if (this.nc >= N_CARD || a <= 0.01) return;
    const i = this.nc++, m = this.cm; m.makeScale(size, size, 1); m.setPosition(x, y, z); this.cards.setMatrixAt(i, m);
    this.aInfo.setXYZ(i, kind, a, turn); const c = this.cDrop[ci]; this.aCol.setXYZ(i, c.r, c.g, c.b);
  },
  // The water that is in the air at t: off the wingtips at every beat, down the duck's back at a dip, off the dog's ears
  // in the shake; and the broken water under the duck.
  spray(L, t, b, tf, fb, nb, fo, FD, TS, SD, dk, dg, up, sit, calm) {
    const y0 = L.y + SURF, G = 9.8;
    // the duck's own axes on the floor (it faces the room for its bath)
    L.floor(dk.u, dk.out, this.v); const yaw = this.duckYaw || 0, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw), X = this.v.x, Z = this.v.z;
    if (tf > 0 && tf < FD + 1.0) {
      for (let j = 0; j < nb; j++) for (let k = 0; k < N_FLAP; k++) {
        const r = this.rFlap[(k + j * 7) % N_FLAP], s = k % 2 ? -1 : 1, age = tf - (fo + j * fb + (0.08 + 0.34 * r.a) * fb);
        if (age < 0) continue;
        const vs = s * (0.5 + 1.0 * r.b), vy = 0.5 + 1.1 * r.c, vf = 0.1 + (r.d - 0.3) * 1.2, h = (0.17 + 0.1 * r.e) * DS + vy * age - 0.5 * G * age * age;
        if (h < 0) continue;
        const ps = s * (0.2 + 0.16 * r.e) * DS + vs * age, pf = 0.04 + vf * age;
        this.card(X + rx * ps + fx * pf, y0 + h, Z + rz * ps + fz * pf, 0.011 + 0.014 * r.e, 0, Math.min(1, age * 16) * (0.5 + 0.5 * r.a), k % 3);
      }
    }
    for (const td of this.dips(b.n).concat(this.dips(b.n + 1))) {
      const a0 = t - td - 0.5; if (a0 < 0 || a0 > 0.9) continue;
      for (let k = 0; k < N_DIP; k++) { const r = this.rDip[k], age = a0 - 0.1 * r.a; if (age < 0) continue; const vy = 0.8 + 0.7 * r.b, h = 0.18 * DS + vy * age - 0.5 * G * age * age; if (h < 0) continue; const pf = 0.1 - (0.5 + 0.5 * r.c) * age, ps = (r.d - 0.5) * 0.5 * age + (r.d - 0.5) * 0.06; this.card(X + rx * ps + fx * pf, y0 + h, Z + rz * ps + fz * pf, 0.01 + 0.012 * r.e, 0, Math.min(1, age * 16) * 0.75, k % 3); }
    }
    // the water hopping round its breast and tail while the wings go, and as it sits down
    const ch = Math.max(up, sit * 0.9);
    if (ch > 0.05) for (let k = 0; k < 14; k++) {
      const r = this.rChurn[k], per = calm ? 0.5 : 0.22 + 0.12 * r.b, q = ((t / per + r.c) % 1), a = (k / 14) * TAU + 3 * r.d + Math.floor(t / per + r.c) * 2.4, rad = (0.11 + 0.08 * r.a) * DS;
      this.card(X + Math.cos(a) * rad, y0 + 0.01 + 0.07 * ch * 4 * q * (1 - q) * (0.5 + 0.5 * r.e), Z + Math.sin(a) * rad, 0.01 + 0.012 * r.e, 0, ch * 0.75 * Math.sin(Math.PI * q), k % 3);
    }
    // the dog's shake: a ring of drops off its ears
    const as = tf - TS;
    if (as > 0 && as < SD + 0.7) {
      L.floor(dg.u, dg.out, this.v); const DX = this.v.x, DZ = this.v.z;
      for (let k = 0; k < N_SHAKE; k++) {
        const r = this.rShake[k], age = as - 0.05 - (SD - 0.1) * (k / N_SHAKE); if (age < 0) continue;
        const th = TAU * r.a, vh = 0.5 + 0.9 * r.b, vy = 0.5 + 0.8 * r.c, h = 0.08 * DG + vy * age - 0.5 * G * age * age; if (h < 0) continue;
        this.card(DX + Math.cos(th) * (0.07 + vh * age), y0 + h, DZ + Math.sin(th) * (0.07 + vh * age), 0.009 + 0.012 * r.e, 0, Math.min(1, age * 18) * (0.55 + 0.45 * r.d), k % 3);
      }
    }
  },

  // ---------------------------------------------------------------- sounds
  // A forepaw through the surface: a small round drop of a note.
  plip(L, k, at) {
    const v = L.voice(); this.pn = (this.pn || 0) + 1; const f = 520 + 90 * Math.sin(this.pn * 5.1);
    v.note(f, 0.07, { at, vol: 0.011 * k, type: 'sine', to: f * 1.9, attack: 0.004 }); noise(v, at, { d: 0.05, vol: 0.006 * k, bp: 1700, q: 1.2 });
  },
  splash(L, k) { const v = L.voice(); noise(v, 0, { d: 0.26, vol: 0.02 * k, bp: 1500, q: 0.7, attack: 0.01 }); noise(v, 0.03, { d: 0.4, vol: 0.008 * k, hp: 3200, attack: 0.02 }); this.plip(L, 0.7 * k, 0.09); this.plip(L, 0.5 * k, 0.19); },
  // A wingbeat: the air under it, and the feathers.
  whoosh(L, k) { const v = L.voice(); noise(v, 0, { d: 0.14, vol: 0.026 * k, lp: 420, attack: 0.02 }); noise(v, 0.02, { d: 0.09, vol: 0.008 * k, bp: 2600, q: 1.5, attack: 0.01 }); noise(v, 0.1, { d: 0.12, vol: 0.006 * k, hp: 3500, attack: 0.01 }); },
  // The duck: a short reedy note falling a little, through a bill.
  quack(L, vol, pitch) {
    const v = L.voice(), c = v.ctx, out = c && v.out(); if (!c || !out) return;
    const t = c.currentTime + 0.01, d = 0.17, f0 = 430 * pitch, o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0 * 1.12, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.82, t + d);
    const env = c.createGain(); env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(vol, t + 0.018); env.gain.setValueAtTime(vol, t + d * 0.5); env.gain.exponentialRampToValueAtTime(0.0001, t + d);
    for (const [f, q, g] of [[1050, 5, 1], [2300, 7, 0.7], [3300, 5, 0.25]]) { const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; const gg = c.createGain(); gg.gain.value = g; o.connect(bp); bp.connect(gg); gg.connect(env); }
    env.connect(out); o.start(t); o.stop(t + d + 0.05);
  },
  // The dog shaking its head: its ears slapping, and the water coming off.
  shakeSound(L, d, calm) {
    const v = L.voice(), rate = calm ? 3.5 : 7, k = calm ? 0.6 : 1;
    for (let i = 0; i < Math.floor(d * rate * 2); i++) noise(v, i / (rate * 2), { d: 0.05, vol: 0.013 * k, bp: 850 + 120 * (i % 2), q: 1.3 });
    noise(v, 0.05, { d: d + 0.3, vol: 0.006 * k, hp: 3000, attack: 0.1 });
  },
});
