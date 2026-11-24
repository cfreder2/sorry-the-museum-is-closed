// Winslow Homer, The Herring Net (1885), Gallery 161. The word: haul.
//
// His North Atlantic, in his own broad wet paint: a heavy grey-green swell with pale dragged crests and one dark
// emerald face, a brown fog for a sky, the schooners ghosts on the horizon, and in front the net's red keg float on
// its line. Look at it and the fog seeps out along the foot of the wall under the picture and his sea comes out of it
// across the floor, swell after swell, slow and heavy. The keg rides out on the first water, paying out its line of
// corks behind it; the far sails show in the fog and go on along it; a bell sounds somewhere out there, twice; and a
// loose shoal of herring comes in under the surface, turning together, each one a glint of silver when it rolls.
// Then the work, which the picture keeps: the line comes up out of the water, strung with drops, and is hauled in from
// the fog, hand over hand, a fathom at a time. The great swell is the moment: the sea draws down, it rises out of the
// fog and comes on with the shoal silver in its green face, the keg climbs it with the line bar-taut, spray smokes off
// the crest, and as it goes by the longest haul of all comes in down its back. While you keep looking the sea takes the
// line out again and it is hauled again: it is work, and it goes on. When you stop, the line is hauled home, the fog
// thins and the sea draws back in under the wall.
//
// This water is not the Cotopaxi's (src/life/76571-view-of-cotopaxi.js, two pictures along the same wall): that is
// a still gold lake, flat, with the room mirrored in it; this is opaque paint, heaped, moving. It keeps within 1.7 m
// of its own picture along the wall, most of a metre short of the lake's bank, and neither show stays out after its look.
// Nothing here rises above the knee: the fog and the sails stay under 0.75 m at the wall's foot (the frames start at
// a metre), so nothing passes in front of a picture and the guard has nothing to cut.
// Three draw calls: the sea (one displaced sheet, one shader), the rig (keg, corks, line) and the cards (fog, sails,
// herring, the keg's painted shell, spray and drops; one instanced shader).
//
// It does not bring out the two fishermen (the museum calls the younger a boy, and both are at work at the edge of
// danger), nor an empty dory, nor a net with fish in it: the hauling is done by hands the picture keeps, the herring
// swim free and are never caught, chased or touched by the toy, and there is no song, only the bell and the water.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture } from '../paintlife.js';
import { strokes } from './brush.js';
import { score } from './stagecraft.js';

const TAU = Math.PI * 2;
const sm = (x, a, b) => ease.smooth(ramp(x, a, b));
// ---------------------------------------------------------------- the sea: the same numbers here and in its shader
const SA = 1.5, SB = 1.85;                 // its reach along the wall (each way) and out into the room
const Y0 = 0.07, LIFT = 0.012;            // the water's own depth on the floor; the sheet lies this far over the floor
const dir = a => [Math.sin(a), Math.cos(a)];
const W1 = { a: 0.034, k: TAU / 0.95, w: TAU / 2.6, d: dir(0.42) };       // the swell: out of the fog, slanting to the right
const W2 = { a: 0.011, k: TAU / 0.43, w: TAU / 1.5, d: dir(-0.75) };      // a cross sea
const W3 = { a: 0.005, k: TAU / 0.33, w: TAU / 1.05, d: dir(1.15) };      // chop
const DB = dir(0.3);                                                       // the way the great swell goes
const GL = n => n.toFixed(5);
// ---------------------------------------------------------------- the line, and the timeline
const WU = 0.42, WH = 0.2;                // where the line goes into the fog (along the wall), and how high
const PSI = -0.33;                        // the way it lies from there: out, a little to the left
const D_FAR = 1.66, D_END = D_FAR - 0.24 - 0.42;
const HAULS = [{ t: 3.05, d: 0.85, by: 0.24, pre: 0.3 }, { t: 6.25, d: 1.15, by: 0.42, pre: 0.55 }];
const LOOP = { t: 8, P: 7.2, far: D_END + 0.24 + 0.37, hauls: [{ t: 3.2, d: 0.85, by: 0.24, pre: 0.3 }, { t: 5.5, d: 1.05, by: 0.37, pre: 0.5 }] };
const BIG = { t: 4.0, c: 0.65, B: 0.2, w: 0.3 }, BIG2 = { t: 3.3, c: 0.68, B: 0.11, w: 0.28 };
// two hands: half the haul, a breath, the other half
const pull = (t, h) => h.by * 0.5 * (ease.inOut(ramp(t, h.t, h.t + 0.45 * h.d)) + ease.inOut(ramp(t, h.t + 0.52 * h.d, h.t + h.d)));
const strain = (t, h) => sm(t, h.t - h.pre, h.t) * (1 - sm(t, h.t + h.d + 0.05, h.t + h.d + 0.55));
const spread = q => 0.5 * (ease.smooth(q) + ease.out(q));
const N_SEG = 14, N_CORK = 9, N_FOG = 30, N_WISP = 5, N_FISH = 38, N_KDAB = 24, N_KFOAM = 5, N_SPRAY = 26, N_SPLASH = 8, N_DROP = 16;
const KEG = { r: 0.088, hl: 0.13 };
const SAILS = [{ u: -1.05, s: 0.42, a: 0.6, flip: -1, v: 0.02 }, { u: 0.82, s: 0.26, a: 0.42, flip: 1, v: -0.011 }, { u: 1.12, s: 0.2, a: 0.32, flip: 1, v: -0.008 }];      // (flip 1: bows to the left)

lifeFor(25865, {
  title: /^The Herring Net/,
  word: 'haul',
  // (hung with its foot at 1.15 m: the camera stands low and back, so the whole work is there over its sea)
  stage: { out: 1.9, half: 1.7, cam: { dist: 3.1, height: 0.92, side: 0.3, fov: 56, lookU: 0, lookOut: 0.5, lookH: 0.95, floorOut: 1.6 } },
  wake: 2, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.22) => P.near(h, a);
    this.T3 = new THREE.Vector3(L.tx, 0, L.tz); this.N3 = new THREE.Vector3(L.nx, 0, L.nz); this.UP = new THREE.Vector3(0, 1, 0);
    this.WO = -L.wall - 0.15;                         // the line's far end: in the wall, behind the fog
    this.S = { t: 0, grow: 0, amp: 0, bs: -9, bb: 0, bw: 0.3, bore: 0, E: 0, e: 9, m: 0 };
    this.ln = { D: 0, taut: 0 };
    this.kg = { u: 0, o: 0, y: 0, nu: 0, no: 0, ny: 0, pu: 1, po: 0, on: false };
    this.v = new THREE.Vector3(); this.a = new THREE.Vector3(); this.b = new THREE.Vector3(); this.x3 = new THREE.Vector3(); this.y3 = new THREE.Vector3(); this.z3 = new THREE.Vector3(); this.p3 = new THREE.Vector3();
    this.m4 = new THREE.Matrix4(); this.kM = new THREE.Matrix4(); this.lp = new THREE.Vector3();
    this.calm = false; this.bT = 0; this.D0 = 0; this.g0 = 0; this.taut0 = 0;
    this.buildSea(L, col); this.buildRig(L, col); this.buildCards(L, col);
    this.bands = [this.makeScore(L, false), this.makeScore(L, true)]; this.band = this.bands[0];
    this.surf = L.voice().loop({ lp: 640, hp: 70 }); this.hiss = L.voice().loop({ lp: 5600, hp: 1700 });
    this.hideAll();
  },

  // ---------------------------------------------------------------- the sea's height (metres over the floor) at (u, out)
  sea(u, o) {
    const S = this.S, x = u / SA + 1e-5, y = Math.max(o, 0) / SB, th = Math.atan2(y, x);
    const r = Math.hypot(x, y) / (1 + 0.07 * Math.sin(3 * th + 1.0) + 0.045 * Math.sin(5 * th + 0.3) + 0.03 * Math.sin(8 * th + 2.1));
    const m = S.grow - r, E = ease.smooth(m / 0.34);
    S.m = m; S.E = E;
    if (E <= 0) { S.e = 9; return 0; }
    const f1 = (u * W1.d[0] + o * W1.d[1]) * W1.k - S.t * W1.w;
    let w = W1.a * (Math.sin(f1) - 0.2 * Math.cos(2 * f1));
    w += W2.a * Math.sin((u * W2.d[0] + o * W2.d[1]) * W2.k - S.t * W2.w);
    w += W3.a * Math.sin((u * W3.d[0] + o * W3.d[1]) * W3.k - S.t * W3.w);
    const e = (u * DB[0] + o * DB[1] - S.bs) / S.bw; S.e = e;
    const bg = S.bb * (Math.exp(-e * e * (e > 0 ? 1.7 : 0.7)) - 0.22 * Math.exp(-(e - 1.7) * (e - 1.7) * 0.9));
    const q = (m - 0.22) / 0.1;
    return LIFT + E * Math.max(0.012, Y0 + S.amp * w + bg) + S.bore * Math.exp(-q * q) * ease.smooth(m / 0.08);
  },

  buildSea(L, col) {
    const NX = 72, NZ = 56, u0 = -SA * 1.14, u1 = SA * 1.14, o0 = -L.wall - 0.02, o1 = SB * 1.1;
    const pos = [], uo = [], idx = [], v = new THREE.Vector3();
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
      const u = lerp(u0, u1, i / NX), o = lerp(o0, o1, j / NZ); L.floor(u, o, v);
      pos.push(v.x, v.y + LIFT, v.z); uo.push(u, o);
    }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + NX + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUO', new THREE.Float32BufferAttribute(uo, 2)); g.setIndex(idx);
    // his paint: long loaded strokes, laid along the swell
    const css = (h, a) => col(h, a).getStyle();
    const paint = strokes({
      size: 512, seed: 25865, n: 1700, len: [26, 130], width: [6, 24], bend: 0.3, lift: 0.2, base: css('#35423b', 0.2),
      colors: [['#1f2b25', 3], ['#33413a', 4], ['#46554d', 3], ['#586660', 2.2], ['#69756f', 1.2], ['#75735f', 0.9], ['#28402e', 1.6], ['#3d5058', 1.0]].map(([c, w]) => [css(c, 0.2), w]),
      angle: (x, y, r) => (r() - 0.5) * 0.75,
    });
    const u = this.su = {
      uT: { value: 0 }, uGrow: { value: 0 }, uAmp: { value: 0 }, uBore: { value: 0 }, uBig: { value: new THREE.Vector3(-9, 0, 0.3) }, tPaint: { value: paint },
      cSky: { value: col('#8a836c', 0.2) }, cGreenD: { value: col('#1b3a24', 0.2) }, cGreenL: { value: col('#357045', 0.12) }, cCrest: { value: col('#9f9c86', 0.2) },
      cFoam: { value: col('#cbc5af', 0.12) }, cFog: { value: col('#6a5d4a', 0.25) },
    };
    const v2 = d => `vec2(${GL(d[0])}, ${GL(d[1])})`;
    const HEAD = `
uniform float uT, uGrow, uAmp, uBore; uniform vec3 uBig;
varying vec2 vUO; varying vec4 vSea; varying vec2 vBg;
const vec2 D1 = ${v2(W1.d)}; const vec2 D2 = ${v2(W2.d)}; const vec2 D3 = ${v2(W3.d)}; const vec2 DBG = ${v2(DB)};
const float K1 = ${GL(W1.k)}; const float O1 = ${GL(W1.w)}; const float K2 = ${GL(W2.k)}; const float O2 = ${GL(W2.w)}; const float K3 = ${GL(W3.k)}; const float O3 = ${GL(W3.w)};`;
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: true, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec2 aUO;${HEAD}
float seaH(vec2 p, out float m, out float e) {
  vec2 q = vec2(p.x / ${GL(SA)} + 1.0e-5, max(p.y, 0.0) / ${GL(SB)}); float th = atan(q.y, q.x);
  float r = length(q) / (1.0 + 0.07 * sin(3.0 * th + 1.0) + 0.045 * sin(5.0 * th + 0.3) + 0.03 * sin(8.0 * th + 2.1));
  m = uGrow - r; float E = smoothstep(0.0, 0.34, m);
  float f1 = dot(p, D1) * K1 - uT * O1;
  float w = ${GL(W1.a)} * (sin(f1) - 0.2 * cos(2.0 * f1)) + ${GL(W2.a)} * sin(dot(p, D2) * K2 - uT * O2) + ${GL(W3.a)} * sin(dot(p, D3) * K3 - uT * O3);
  e = (dot(p, DBG) - uBig.x) / uBig.z;
  float bg = uBig.y * (exp(-e * e * (e > 0.0 ? 1.7 : 0.7)) - 0.22 * exp(-(e - 1.7) * (e - 1.7) * 0.9));
  float qb = (m - 0.22) / 0.1;
  return E * max(0.012, ${GL(Y0)} + uAmp * w + bg) + uBore * exp(-qb * qb) * smoothstep(0.0, 0.08, m);
}`).replace('#include <begin_vertex>', `#include <begin_vertex>
  float hm, he, hm2, he2; float h0 = seaH(aUO, hm, he);
  float hu = seaH(aUO + vec2(0.035, 0.0), hm2, he2), ho = seaH(aUO + vec2(0.0, 0.035), hm2, he2);
  transformed.y += h0; vUO = aUO; vSea = vec4(h0, (hu - h0) / 0.035, (ho - h0) / 0.035, hm); vBg = vec2(he, uBig.y * smoothstep(0.0, 0.34, hm));`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>${HEAD}
uniform sampler2D tPaint; uniform vec3 cSky, cGreenD, cGreenL, cCrest, cFoam, cFog; vec3 hCol; float hA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 p = vUO; float m = vSea.w, e = vBg.x, bk = clamp(vBg.y / 0.2, 0.0, 1.0);
  // his brush: long strokes laid along the crests, carried slowly with the water
  vec2 cd = vec2(D1.y, -D1.x); float along = dot(p, cd);
  vec2 tuv = vec2(along / 1.3, dot(p, D1) / 1.05 - uT * 0.045);
  vec4 tx = texture2D(tPaint, tuv);
  vec4 t2 = texture2D(tPaint, tuv * vec2(0.47, 0.61) + vec2(0.37, 0.11 + uT * 0.017));
  float f1 = dot(p, D1) * K1 - uT * O1, s1 = sin(f1), c1 = cos(f1);
  // deep in the troughs, lighter up the swell
  // (broader strokes laid over the small ones here and there)
  vec3 c = mix(tx.rgb, t2.rgb, 0.85 * smoothstep(0.66, 0.72, t2.a)) * mix(0.62, 1.2, smoothstep(-1.0, 1.1, s1 * uAmp + (t2.a - 0.6) * 0.6));
  // the backs of the swells and the flats hold the fog's light
  float back = clamp(0.3 + vSea.z * 2.4 + vSea.y * 0.8, 0.0, 1.0);
  c = mix(c, cSky * (0.75 + 0.5 * t2.a), back * 0.32);
  // the green of a swell's face, where it stands up thin towards you
  float gk = smoothstep(0.1, 0.9, -c1) * smoothstep(-0.2, 0.75, s1) * uAmp;
  c = mix(c, mix(cGreenD, cGreenL, smoothstep(0.3, 1.0, s1) * (0.5 + 0.5 * tx.a)) * (0.75 + 0.45 * t2.a), gk * 0.5);
  // its lit crest, dragged along in broken strokes; white only in patches
  float ck = smoothstep(0.7, 0.97, s1 + (tx.a - 0.6) * 0.55) * uAmp;
  float patchy = smoothstep(0.45, 0.85, t2.a * 0.6 + 0.4 * (0.5 + 0.5 * sin(along * 2.7 + uT * 0.35 + 1.3 * sin(along * 1.1 - uT * 0.2))));
  c = mix(c, cCrest, ck * 0.42);
  c = mix(c, cFoam, smoothstep(0.62, 0.98, ck * (0.45 + tx.a * 0.7)) * patchy);
  // the cross sea's small lights
  c = mix(c, cCrest, smoothstep(0.82, 1.0, sin(dot(p, D2) * K2 - uT * O2) + (t2.a - 0.6) * 0.4) * 0.22 * uAmp);
  // the great swell: its green face (thin and lit under the crest, deep lower down), its crest, the lace down its back
  float face = smoothstep(0.02, 0.45, e) * (1.0 - smoothstep(0.75, 1.5, e)) * bk;
  c = mix(c, mix(cGreenL, cGreenD, smoothstep(0.1, 0.95, e)) * (0.62 + 0.7 * tx.a), face * 0.8);
  float bc = (1.0 - smoothstep(0.0, 0.3, abs(e + 0.06))) * bk;
  c = mix(c, cCrest, bc * 0.7);
  c = mix(c, cFoam, smoothstep(0.4, 0.85, bc + (tx.a - 0.55) * 0.7) * step(0.02, bk));
  float lee = smoothstep(-2.4, -0.4, e) * (1.0 - smoothstep(-0.35, 0.0, e)) * bk;
  c = mix(c, cFoam, smoothstep(0.8, 0.94, t2.a + 0.12 * tx.a) * lee * 0.55);
  c *= 1.0 - 0.3 * smoothstep(0.9, 1.6, e) * (1.0 - smoothstep(1.8, 2.8, e)) * bk;
  // the far water going into the fog
  c = mix(c, cFog, (1.0 - smoothstep(0.02, 0.8, p.y)) * 0.55);
  // the first water over the floor, and the sea's edge: foam lace, breaking up stroke by stroke
  float qb = (m - 0.2) / 0.1, bore = exp(-qb * qb) * smoothstep(0.0, 0.03, uBore);
  c = mix(c, cFoam, smoothstep(0.62, 1.0, bore * (0.4 + tx.a * 0.75)) * 0.6);
  float lace = 1.0 - smoothstep(0.0, 0.13, m + (t2.a - 0.6) * 0.1);
  c *= 1.0 - 0.22 * lace;
  c = mix(c, cFoam * (0.7 + 0.25 * t2.a), lace * 0.42 * smoothstep(0.8, 0.92, tx.a));
  hCol = c; hA = smoothstep(0.0, 0.09, m + (tx.a - 0.66) * 0.15);
  if (hA < 0.03) discard;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = hCol; diffuseColor.a = hA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'herring-sea';
    this.water = new THREE.Mesh(g, m); this.water.renderOrder = 5;
    L.add(this.water);
  },

  // ---------------------------------------------------------------- the rig: the keg float, the corks, the line
  buildRig(L, col) {
    const rig = this.rig = L.rig(32, 5200, L.paint({ rough: 0.5, glow: 0.36 }));
    // the keg: a smooth cask lying on its side (its length along z), staves, hoops and heads painted in, not cut
    {
      const prof = [[0.0001, -KEG.hl], [KEG.r * 0.62, -KEG.hl]];
      for (let i = 0; i <= 14; i++) { const q = i / 14 * 2 - 1; prof.push([KEG.r * (1 - 0.3 * q * q), q * KEG.hl * 0.985]); }
      prof.push([KEG.r * 0.62, KEG.hl], [0.0001, KEG.hl]);
      const g = shape.lathe(prof, 28, 0xffffff), p = g.attributes.position, c = g.attributes.color, k = new THREE.Color();
      const body = col('#b04a2a', 0.18), light = col('#cf6a40', 0.15), hoop = col('#5e2618', 0.2), head = col('#743423', 0.2);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), q = Math.abs(y) / KEG.hl, a = Math.atan2(z, x), rr = Math.hypot(x, z) / KEG.r;
        const stave = 0.5 + 0.5 * Math.cos(a * 11);
        k.copy(body).lerp(light, 0.5 * stave * stave);
        const h = Math.max(sm(q, 0.24, 0.3) * (1 - sm(q, 0.4, 0.46)), sm(q, 0.74, 0.8) * (1 - sm(q, 0.9, 0.95)));
        k.lerp(hoop, 0.8 * h);
        if (q > 0.97 && rr < 0.7) k.copy(head).lerp(hoop, 0.5 * (1 - rr / 0.7));
        c.setXYZ(i, k.r, k.g, k.b);
      }
      this.gKeg = rig.geo(shape.move(g, 0, 0, 0, Math.PI / 2, 0, 0));
    }
    // a cork: a worn brown oval
    {
      const g = shape.ball(1, 0xffffff, 2), p = g.attributes.position, c = g.attributes.color, k = new THREE.Color(), top = col('#b08e5e', 0.2), low = col('#5f4a30', 0.2);
      for (let i = 0; i < p.count; i++) { k.copy(low).lerp(top, sm(p.getY(i), -0.5, 0.7)); c.setXYZ(i, k.r, k.g, k.b); }
      this.gCork = rig.geo(shape.move(g, 0, 0, 0, 0, 0, 0, 0.019, 0.013, 0.026));
    }
    // a length of the line (a unit one, from 0 to 1 up y; laid between two points)
    this.gLine = rig.geo(shape.move(shape.cyl(1, 1, 1, 8, col('#3e3222', 0.2)), 0, 0.5, 0));
    this.iKeg = rig.add(this.gKeg); this.iCork = Array.from({ length: N_CORK }, () => rig.add(this.gCork)); this.iSeg = Array.from({ length: N_SEG }, () => rig.add(this.gLine));
    this.parts = [this.iKeg, ...this.iCork, ...this.iSeg];
    this.pts = Array.from({ length: N_SEG + 1 }, () => new THREE.Vector3());
  },

  // ---------------------------------------------------------------- the cards: fog, sails, herring, dabs, spray
  buildCards(L, col) {
    const R = () => L.rand();
    const atlas = canvasTexture(512, 512, g => {
      g.clearRect(0, 0, 512, 512);
      const blob = (x, y, rx, ry, a, lum = 255) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(${lum},${lum},${lum},${a})`); gr.addColorStop(0.55, `rgba(${lum},${lum},${lum},${a * 0.55})`); gr.addColorStop(1, `rgba(${lum},${lum},${lum},0)`); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore(); };
      const cell = (x, y, f) => { g.save(); g.beginPath(); g.rect(x, y, 256, 256); g.clip(); f(x, y); g.restore(); };
      // 0: fog, soft and a little uneven
      cell(0, 0, () => { blob(128, 128, 112, 112, 0.5); for (let i = 0; i < 10; i++) blob(128 + (R() - 0.5) * 120, 128 + (R() - 0.5) * 70, 34 + R() * 40, 24 + R() * 26, 0.22); });
      // 1: a schooner in fog: her sails one soft stack, the hull a low line (bows to the left)
      cell(256, 0, X => {
        const sail = (pts, a = 0.9) => { g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(X + x, y) : g.moveTo(X + x, y))); g.closePath(); g.fill(); };
        g.shadowColor = 'rgba(255,255,255,0.85)'; g.shadowBlur = 9;
        sail([[44, 218], [216, 215], [204, 236], [66, 236]]);                           // hull
        sail([[162, 208], [162, 68], [222, 94], [232, 208]]);                           // mainsail
        sail([[163, 62], [163, 26], [214, 86]], 0.8);                                   // main topsail
        sail([[110, 208], [110, 80], [152, 98], [154, 208]]);                           // foresail
        sail([[104, 206], [104, 86], [66, 206]], 0.85);                                 // staysail
        sail([[101, 64], [26, 212], [58, 210]], 0.75);                                  // jib
      });
      // 2: one painted dab: a few loaded strokes over each other, ragged at the ends (red: lit to shaded)
      cell(0, 256, () => {
        g.lineCap = 'round';
        for (let i = 0; i < 14; i++) {
          const y = 384 + (R() - 0.5) * 120, half = 96 * Math.sqrt(Math.max(0.05, 1 - Math.pow((y - 384) / 70, 2) * 0.8)), x0 = 128 - half * (0.7 + 0.3 * R()), x1 = 128 + half * (0.7 + 0.3 * R());
          const v = Math.floor(120 + 135 * clamp01(0.55 - (y - 384) / 150 + (R() - 0.5) * 0.4));
          g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 16 + R() * 14; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(128, y - 8 + R() * 16, x1, y + (R() - 0.5) * 12); g.stroke();
        }
      });
      // 3: a herring: a slim spindle, head to the right, a forked tail (red: its back darker, its flank lit)
      cell(256, 256, X => {
        const cy = 384, gr = g.createLinearGradient(0, cy - 70, 0, cy + 70); gr.addColorStop(0, 'rgb(150,150,150)'); gr.addColorStop(0.45, 'rgb(255,255,255)'); gr.addColorStop(1, 'rgb(215,215,215)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(X + 236, cy); g.bezierCurveTo(X + 200, cy - 78, X + 110, cy - 66, X + 52, cy - 12); g.lineTo(X + 18, cy - 62); g.lineTo(X + 30, cy); g.lineTo(X + 18, cy + 62); g.lineTo(X + 52, cy + 12); g.bezierCurveTo(X + 110, cy + 66, X + 200, cy + 78, X + 236, cy); g.fill();
      });
    }, false);
    const n = this.NC = SAILS.length + N_FOG + N_WISP + N_FISH * 2 + N_KDAB + 1 + N_KFOAM + N_SPRAY + N_SPLASH + N_DROP;
    const geo = new THREE.PlaneGeometry(1, 1);
    this.aInfo = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aInfo', this.aInfo); geo.setAttribute('aCol', this.aCol);
    const cu = { tAtlas: { value: atlas } };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, cu);
      // kinds 0 to 3 face the camera (their size in the matrix's diagonal, a turn on the screen); 4 and 5 lie as their
      // matrix lays them (on the water)
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aInfo; attribute vec3 aCol; varying vec4 vInfo; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <project_vertex>', `vec4 mvPosition;
  vQ = position.xy + 0.5; vInfo = aInfo; vCol = aCol;
  if (aInfo.x > 3.5) mvPosition = modelViewMatrix * (instanceMatrix * vec4(position, 1.0));
  else {
    mvPosition = modelViewMatrix * vec4(instanceMatrix[3].xyz, 1.0);
    float cs = cos(aInfo.z), sn = sin(aInfo.z); vec2 q = position.xy * vec2(instanceMatrix[0][0], instanceMatrix[1][1]);
    mvPosition.xy += vec2(cs * q.x - sn * q.y, sn * q.x + cs * q.y);
  }
  gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D tAtlas; varying vec4 vInfo; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <map_fragment>', `{
  float kd = vInfo.x; vec2 cell = kd < 0.5 ? vec2(0.0, 1.0) : kd < 1.5 ? vec2(1.0, 1.0) : kd < 2.5 ? vec2(0.0, 1.0) : kd < 3.5 ? vec2(0.0, 0.0) : kd < 4.5 ? vec2(1.0, 0.0) : vec2(0.0, 0.0);
  vec4 tx = texture2D(tAtlas, (clamp(vQ, 0.03, 0.97) + cell) * 0.5);
  vec3 c = vCol; float a;
  if (kd < 0.5) a = smoothstep(0.0, 0.4, tx.a) * vInfo.y;                                                     // fog
  else if (kd < 1.5) a = smoothstep(0.04, 0.85, tx.a) * vInfo.y;                        // a sail in it
  else if (kd < 2.5) a = smoothstep(0.3, 0.55, tx.a) * vInfo.y;                         // a drop
  else if (kd < 3.5) { c = vCol * (0.62 + 0.55 * tx.r); a = smoothstep(0.25, 0.55, tx.a) * vInfo.y; }      // a dab of paint
  else if (kd < 4.5) { c = vCol * (0.6 + 0.45 * tx.r); a = smoothstep(0.2, 0.6, tx.a) * vInfo.y; }         // a herring
  else { c = vCol * (0.75 + 0.3 * tx.r); a = smoothstep(0.3, 0.6, tx.a) * vInfo.y; }                         // foam, lying on the water
  if (a < 0.01) discard;
  diffuseColor = vec4(c, a);
}`);
    };
    m.customProgramCacheKey = () => 'herring-cards';
    const mesh = this.cards = new THREE.InstancedMesh(geo, m, n);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.count = 0; mesh.renderOrder = 6;
    this.cM = mesh.instanceMatrix.array; this.n = 0;
    L.add(mesh);
    // each card's own numbers
    // the fog bank along the wall's foot: a low band, thick below and feathering upwards (the even ones), and looser
    // puffs over it and in front (the odd ones); the sails are drawn between the two
    const fogLo = col('#38352e', 0.12), fogHi = col('#5a5549', 0.12);
    this.FG = Array.from({ length: N_FOG }, (_, i) => {
      const a = R(), b = R(), c = R(), d = R(), band = i % 2 === 0, u = -1.9 + 3.8 * (i + a) / N_FOG;
      return band ? { band, u, h: 0.12 + 0.08 * b, o: 0.05 + 0.1 * c, w: 1.0 + 0.4 * d, sy: 0.55, al: 0.36 + 0.12 * a, v: 0.008 + 0.012 * b, ph: R() * TAU, c: fogLo.clone().lerp(fogHi, 0.3 * d) }
        : { band, u, h: 0.3 + 0.16 * b, o: 0.16 + 0.2 * c, w: 0.55 + 0.4 * d, sy: 0.4, al: 0.12 + 0.1 * a, v: -(0.006 + 0.016 * b), ph: R() * TAU, c: fogLo.clone().lerp(fogHi, 0.6 + 0.4 * d) };
    }).sort((p, q) => (q.band - p.band) || (p.o - q.o));
    this.WS = Array.from({ length: N_WISP }, (_, i) => ({ u: -1.2 + 2.4 * (i + R()) / N_WISP, o: 0.45 + 0.9 * R(), w: 0.7 + 0.4 * R(), al: 0.07 + 0.05 * R(), v: 0.03 + 0.03 * R(), ph: R() * TAU, c: fogHi }));
    this.cSail = col('#7a7360', 0.15);
    this.F = Array.from({ length: N_FISH }, () => ({ lag: 3.2 * R(), lat: (R() - 0.5) * 0.34, w: 0.6 + 0.8 * R(), ph: R() * TAU, len: 0.085 + 0.03 * R(), a: R(), yaw: (R() - 0.5) * 0.9 }));
    this.cBack = col('#566f7e', 0.15); this.cSilver = col('#f0efe6', 0.05); this.cFish = new THREE.Color();
    // the keg's painted shell: dabs all round it, lit as he lit it (from the fog's light above), and one wet gleam
    this.KD = Array.from({ length: N_KDAB }, (_, i) => { const a = (i + R()) / N_KDAB * TAU * 2, z = (i / (N_KDAB - 1) * 2 - 1) * 0.86 + (R() - 0.5) * 0.1, rr = KEG.r * (1 - 0.3 * z * z); return { p: new THREE.Vector3(Math.cos(a) * rr, Math.sin(a) * rr, z * KEG.hl), n: new THREE.Vector3(Math.cos(a), Math.sin(a), 0), s: 0.05 + 0.022 * R(), j: (R() - 0.5) * 0.4, k: R() }; });
    this.kHi = [col('#e08a58', 0.12), col('#cf6a40', 0.15), col('#e8a57a', 0.1)]; this.kMid = col('#aa4628', 0.18); this.kLo = col('#5a2318', 0.2); this.cGleam = col('#f0ebd7', 0.05); this.cK = new THREE.Color();
    this.KF = Array.from({ length: N_KFOAM }, (_, i) => ({ a: (i + R()) / N_KFOAM * TAU, r: 0.11 + 0.05 * R(), s: 0.09 + 0.05 * R(), ph: R() * TAU }));
    this.cFoam = col('#eee8d4', 0.1); this.cDrop = col('#f4f1e4', 0.05);
    this.SP = Array.from({ length: N_SPRAY }, () => ({ l: (R() - 0.5) * 1.8, P: 0.45 + 0.3 * R(), a: R(), b: R(), c: R() }));
    this.SQ = Array.from({ length: N_SPLASH }, (_, i) => ({ a: (i + R()) / N_SPLASH * TAU, b: R(), c: R() }));
    this.DR = Array.from({ length: N_DROP }, (_, i) => ({ s: 0.1 + 0.82 * (i + R()) / N_DROP, P: 0.5 + 0.4 * R(), a: R(), c: R() }));
    this.fp = new THREE.Vector3(); this.fx = new THREE.Vector3(); this.fy = new THREE.Vector3(); this.fn = new THREE.Vector3();
  },

  // ---------------------------------------------------------------- sound: the water, the bell, the rope
  // (calm: for "Reduce motion and flashing": everything softer and slower to come in, nothing sudden)
  makeScore(L, calm) {
    const s = score(L), v = calm ? 0.6 : 1, att = calm ? 0.04 : 0.006;
    const bell = (t, vol, list = null) => { for (const [m, g, d] of [[1, 1, 1], [2.01, 0.3, 0.6], [3.02, 0.1, 0.35], [5.4, 0.04, 0.15]]) { const e = { t, f: 587.33 * m, d: 3.4 * d, type: 'sine', vol: vol * g * v, attack: att }; if (list) list.push(e); else s.note(e.t, e.f, e.d, e); } };
    const creak = (t, list = null) => { const a = { t, f: 92, d: 0.42, type: 'sawtooth', vol: 0.005 * v, to: 118, attack: 0.09 }, b = { t, noise: true, d: 0.36, vol: 0.008 * v, bp: 520, q: 3, attack: 0.1 }; if (list) list.push(a, b); else { s.note(a.t, a.f, a.d, a); s.hit(b.t, b); } };
    const drips = (t, list = null) => { for (let i = 0; i < 4; i++) { const e = { t: t + 0.22 + i * 0.14, f: 1500 + 260 * ((i * 7) % 4), d: 0.05, type: 'sine', vol: 0.0035 * v, to: 2300, attack: 0.004 }; if (list) list.push(e); else s.note(e.t, e.f, e.d, e); } };
    s.hit(0.15, { d: 1.7, vol: 0.018 * v, lp: 800, hp: 120, attack: 0.6 });                  // the first water over the floor
    bell(2.55, 0.02); bell(3.0, 0.015);                                                      // somewhere in the fog
    for (const h of HAULS) { creak(h.t + 0.04); creak(h.t + 0.52 * h.d); drips(h.t - 0.1); }
    // the great swell: a long low rise, and its crest going by
    s.note(BIG.t + 0.5, 49, 3.1, { type: 'sine', vol: 0.05 * v, attack: 1.3 }); s.hit(BIG.t + 0.8, { d: 2.7, vol: 0.034 * v, lp: 380, hp: 60, attack: 1.2 });
    s.hit(6.2, { d: 1.4, vol: 0.02 * v, hp: 1600, lp: 7000, attack: 0.35 });
    bell(7.0, 0.016); bell(7.45, 0.012);
    // and on, while you look
    const ev = []; bell(1.0, 0.015, ev); bell(1.45, 0.011, ev);
    for (const h of LOOP.hauls) { creak(h.t + 0.04, ev); creak(h.t + 0.52 * h.d, ev); drips(h.t - 0.1, ev); }
    ev.push({ t: BIG2.t + 0.6, f: 55, d: 2.6, type: 'sine', vol: 0.028 * v, attack: 1.1 }, { t: BIG2.t + 0.9, noise: true, d: 2.2, vol: 0.018 * v, lp: 380, hp: 60, attack: 1.0 });
    s.loop(LOOP.t, LOOP.P, ev);
    return s.done();
  },

  hideAll() {
    this.cards.count = 0; this.cards.visible = false; this.water.visible = false;
    for (const i of this.parts) this.rig.show(i, false);
    this.rig.mesh.visible = false;
  },
  start(L, resumed) { if (!resumed) this.hideAll(); this.band.from(L.t); },
  back(L) { this.bT = L.t; this.lineAt(L.t, this.ln); this.D0 = this.ln.D; this.taut0 = this.ln.taut; this.g0 = this.S.grow; },
  end() { this.hideAll(); this.surf.set(0); this.hiss.set(0); },
  reset() { this.hideAll(); this.surf.set(0); this.hiss.set(0); },

  // ---------------------------------------------------------------- how much line is out, and how hard it is held
  lineAt(t, o) {
    if (t < LOOP.t) {
      o.D = D_FAR * spread(ramp(t, 0.55, 2.4)) - pull(t, HAULS[0]) - pull(t, HAULS[1]);
      o.taut = Math.max(0.4 * sm(t, 0.55, 0.95) * (1 - sm(t, 2.0, 2.7)), strain(t, HAULS[0]), strain(t, HAULS[1]));
    } else {
      // the sea takes it out again, and it is hauled again
      const q = (t - LOOP.t) % LOOP.P, h = LOOP.hauls;
      o.D = lerp(D_END, LOOP.far, ease.inOut(ramp(q, 0.3, 2.2))) - pull(q, h[0]) - pull(q, h[1]);
      o.taut = Math.max(0.3 * sm(q, 0.3, 0.7) * (1 - sm(q, 1.9, 2.5)), strain(q, h[0]), strain(q, h[1]));
    }
    return o;
  },
  // the great swell (and the lesser ones after): where its crest is, how high
  bigAt(t, S, calm) {
    let b = BIG, a = t - BIG.t;
    if (t >= LOOP.t) { b = BIG2; a = ((t - LOOP.t) % LOOP.P) - BIG2.t; }
    S.bw = b.w; S.bs = -0.35 + b.c * a; this.bc = b.c;
    S.bb = a <= 0 ? 0 : b.B * (calm ? 0.7 : 1) * sm(a, 0, 1.1) * (1 - sm(S.bs, 1.65, 2.25));
  },

  // ---------------------------------------------------------------- a card facing the camera; a card lying on the water
  bill(x, y, z, sx, sy, kind, a, rot, c, k = 1) {
    if (a <= 0.004 || this.n >= this.NC) return;
    const n = this.n++, M = this.cM, m = n * 16, I = this.aInfo.array, C = this.aCol.array;
    M[m] = sx; M[m + 1] = 0; M[m + 2] = 0; M[m + 3] = 0; M[m + 4] = 0; M[m + 5] = sy; M[m + 6] = 0; M[m + 7] = 0; M[m + 8] = 0; M[m + 9] = 0; M[m + 10] = 1; M[m + 11] = 0; M[m + 12] = x; M[m + 13] = y; M[m + 14] = z; M[m + 15] = 1;
    I[n * 4] = kind; I[n * 4 + 1] = a; I[n * 4 + 2] = rot; I[n * 4 + 3] = 0;
    C[n * 3] = c.r * k; C[n * 3 + 1] = c.g * k; C[n * 3 + 2] = c.b * k;
  },
  // on the water at (u, out), heading (du, dv), len long and wid wide, lift over it; true if there is water there
  afloat(L, u, o, du, dv, len, wid, lift, kind, a, c) {
    if (a <= 0.004 || this.n >= this.NC) return false;
    const h = this.sea(u, o), E = this.S.E; if (E < 0.25) return false;
    const hu = (this.sea(u + 0.03, o) - h) / 0.03, ho = (this.sea(u, o + 0.03) - h) / 0.03;
    const l = Math.hypot(du, dv) || 1; du /= l; dv /= l;
    const X = this.fx, Y = this.fy, N = this.fn, T = this.T3, O = this.N3;
    N.set(-hu * T.x - ho * O.x, 1, -hu * T.z - ho * O.z).normalize();
    X.set(du * T.x + dv * O.x, hu * du + ho * dv, du * T.z + dv * O.z).normalize();
    Y.crossVectors(N, X);
    L.floor(u, o, this.fp); this.fp.y = L.y + h + lift;
    const n = this.n++, M = this.cM, m = n * 16, I = this.aInfo.array, C = this.aCol.array, P = this.fp;
    M[m] = X.x * len; M[m + 1] = X.y * len; M[m + 2] = X.z * len; M[m + 3] = 0; M[m + 4] = Y.x * wid; M[m + 5] = Y.y * wid; M[m + 6] = Y.z * wid; M[m + 7] = 0;
    M[m + 8] = N.x; M[m + 9] = N.y; M[m + 10] = N.z; M[m + 11] = 0; M[m + 12] = P.x + N.x * 0.002; M[m + 13] = P.y; M[m + 14] = P.z + N.z * 0.002; M[m + 15] = 1;
    I[n * 4] = kind; I[n * 4 + 1] = a * sm(E, 0.25, 0.7); I[n * 4 + 2] = 0; I[n * 4 + 3] = 0;
    C[n * 3] = c.r; C[n * 3 + 1] = c.g; C[n * 3 + 2] = c.b;
    return true;
  },
  // a point of the line, s from the fog (0) to the keg (1): into v as (u, height over the floor, out)
  linePt(s, v) {
    const k = this.kg, ln = this.ln, tq = ease.smooth(ln.taut);
    const sag = (0.13 + 0.05 * Math.sin(this.S.t * 0.4)) * Math.sin(Math.PI * s) * (1 - tq) * Math.min(1, ln.D / 1.2);
    const u = WU + (k.nu - WU) * s + k.pu * sag, o = this.WO + (k.no - this.WO) * s + k.po * sag;
    const w = this.sea(u, o) + 0.007;
    const slack = Math.max(w, WH * (1 - sm(s * ln.D, 0.1, 0.55)));        // lying on the water; up out of it into the fog
    const chord = WH + 0.02 + (k.ny - WH - 0.02) * s;                      // held: straight from the fog to the keg
    return v.set(u, Math.max(w, lerp(slack, chord, tq)), o);
  },

  // ---------------------------------------------------------------- every frame
  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return';
    if (!showing && !back) return;
    const R = back ? L.ret : 0, t = showing ? L.t : this.bT + R * L.retDur, S = this.S, ln = this.ln, kg = this.kg;
    const calm = L.calm; if (calm !== this.calm) { this.calm = calm; this.band = this.bands[calm ? 1 : 0]; this.band.from(t); }
    const cam = L.k.G.camera, v = this.v;

    // ---- the sea
    S.t = t;
    S.grow = back ? this.g0 * (1 - ease.inOut(ramp(R, 0.3, 1))) : 1.06 * spread(ramp(t, 0.15, 2.3));
    S.amp = sm(t, 0.3, 2.2);
    S.bore = back ? 0 : 0.045 * sm(t, 0.15, 0.5) * (1 - sm(t, 1.5, 2.3));
    this.bigAt(t, S, calm); if (back) S.bb *= 1 - sm(R, 0, 0.35);
    const su = this.su; su.uT.value = t; su.uGrow.value = S.grow; su.uAmp.value = S.amp; su.uBore.value = S.bore; su.uBig.value.set(S.bs, S.bb, S.bw);
    this.water.visible = S.grow > 0.01;

    // ---- the line: how much is out, how hard it is held; at the Return it is hauled home
    if (back) { ln.D = this.D0 * (1 - ease.inOut(ramp(R, 0, 0.75))); ln.taut = Math.max(this.taut0 * (1 - sm(R, 0, 0.3)), sm(R, 0, 0.15)); }
    else this.lineAt(t, ln);
    const tq = ease.smooth(ln.taut);

    // ---- the keg: at the line's end, riding the water; lying across the swell when the line is slack, nose to the
    // fog when it is hauled
    const psi = PSI + 0.07 * Math.sin(0.43 * t + 1), sp = Math.sin(psi), cp = Math.cos(psi);
    const f1 = ((WU + ln.D * sp) * W1.d[0] + (this.WO + ln.D * cp) * W1.d[1]) * W1.k - t * W1.w;
    kg.u = WU + ln.D * sp + 0.018 * Math.cos(f1) * W1.d[0] * S.amp; kg.o = this.WO + ln.D * cp + 0.018 * Math.cos(f1) * W1.d[1] * S.amp;
    kg.pu = cp; kg.po = -sp;
    const hk = this.sea(kg.u, kg.o), eK = S.e, Ek = S.E;
    const hu = (this.sea(kg.u + 0.04, kg.o) - hk) / 0.04, ho = (this.sea(kg.u, kg.o + 0.04) - hk) / 0.04;
    kg.y = hk + 0.022; kg.on = kg.o > -L.wall - 0.3 && ln.D > 0.03;
    const beta = (0.95 + 0.2 * Math.sin(0.5 * t + 1)) * (1 - tq), ax = psi + Math.PI + beta, au = Math.sin(ax), ao = Math.cos(ax);
    const X = this.x3, Y = this.y3, Z = this.z3, T = this.T3, O = this.N3;
    Y.set(-hu * 0.8 * T.x - ho * 0.8 * O.x, 1, -hu * 0.8 * T.z - ho * 0.8 * O.z).normalize();
    Z.set(au * T.x + ao * O.x, 0.8 * (hu * au + ho * ao), au * T.z + ao * O.z).normalize();
    X.crossVectors(Y, Z).normalize(); Y.crossVectors(Z, X);
    const roll = (0.32 * Math.sin(t * 0.8 + 0.7) + 0.16 * Math.sin(t * 1.9)) * (calm ? 0.5 : 1), cr = Math.cos(roll), sr = Math.sin(roll);
    this.a.copy(X).multiplyScalar(cr).addScaledVector(Y, sr); this.b.copy(Y).multiplyScalar(cr).addScaledVector(X, -sr);
    L.floor(kg.u, kg.o, v); v.y = L.y + kg.y;
    this.kM.makeBasis(this.a, this.b, Z).setPosition(v);
    this.rig.show(this.iKeg, kg.on); if (kg.on) this.rig.mat(this.iKeg, this.kM);
    // its nose, where the line is made fast
    kg.nu = kg.u + au * KEG.hl * 0.95; kg.no = kg.o + ao * KEG.hl * 0.95; kg.ny = kg.y + Z.y * KEG.hl * 0.95 + 0.01;

    // ---- the line and its corks
    const pts = this.pts, lp = this.lp;
    for (let j = 0; j <= N_SEG; j++) { this.linePt(j / N_SEG, lp); L.floor(lp.x, lp.z, pts[j]); pts[j].y = L.y + lp.y; }
    for (let j = 0; j < N_SEG; j++) {
      const A = pts[j], B = pts[j + 1], on = ln.D > 0.05; this.rig.show(this.iSeg[j], on); if (!on) continue;
      Y.subVectors(B, A); X.crossVectors(Y, this.UP); if (X.lengthSq() < 1e-8) X.set(1, 0, 0); X.normalize(); Z.crossVectors(X, Y).normalize();
      this.m4.makeBasis(X.multiplyScalar(0.0065), Y, Z.multiplyScalar(0.0065)).setPosition(A); this.rig.mat(this.iSeg[j], this.m4);
    }
    for (let i = 0; i < N_CORK; i++) {
      const dist = 0.18 + 0.155 * i + 0.035 * Math.sin(i * 2.7), s = 1 - dist / Math.max(ln.D, 0.01), on = s > 0.02 && ln.D > 0.2; this.rig.show(this.iCork[i], on); if (!on) continue;
      this.linePt(s, lp); L.floor(lp.x, lp.z, v);
      this.rig.put(this.iCork[i], v.x, L.y + lp.y + 0.004, v.z, L.yawOf(-sp, -cp) + 0.3 * Math.sin(i * 2.3), 0.12 * Math.sin(t * 1.3 + i), 0.15 * Math.sin(t * 1.1 + i * 1.7));
    }
    this.rig.mesh.visible = kg.on || ln.D > 0.05;

    // ---- the cards, far to near
    this.n = 0;
    const out = back ? 1 - sm(R, 0.35, 1) : 1, rc = L.cy - L.y;
    // the fog: seeping out along the wall's foot from under the picture, lying there, drifting; and in it the far
    // sails, ghosting along
    for (let i = 0; i < N_FOG; i++) {
      const f = this.FG[i], u = ((f.u + f.v * t + 1.9) % 3.8 + 3.8) % 3.8 - 1.9;
      if (i === N_FOG / 2) for (let j = 0; j < SAILS.length; j++) {
        const s = SAILS[j], us = s.u + s.v * (t - 2), hs = this.sea(us, 0.03);
        const a = s.a * sm(t, 1.4 + j * 0.5, 3.4 + j * 0.5) * (1 - sm(Math.abs(us), 1.15, 1.5)) * (back ? 1 - sm(R, 0, 0.5) : 1);
        L.at(us, hs * 0.85 + s.s * 0.47 - rc, 0.03, v);
        this.bill(v.x, v.y, v.z, s.s * 0.92 * s.flip, s.s, 1, a, 0.035 * Math.sin(t * 0.9 + j * 2) + 0.05 * (S.bb / 0.2) * Math.sin(t * 2.1 + j), this.cSail);
      }
      const a = f.al * sm(t * 1.9 - Math.abs(u) * 0.9, 0.1, 1.4) * (1 - sm(Math.abs(u), 1.05, 1.75)) * out;
      L.at(u, f.h + 0.015 * Math.sin(0.5 * t + f.ph) - rc, f.o, v);
      this.bill(v.x, v.y, v.z, f.w, f.w * f.sy, 0, a, 0, f.c);
    }
    // the herring: a loose shoal under the surface, strung out along its own way, turning together; each one dark
    // from above, silver when it rolls
    const fa = (back ? 1 - sm(R, 0, 0.4) : 1), gl = calm ? 0.5 : 1;
    for (let i = 0; i < N_FISH; i++) {
      const f = this.F[i], tt = t - f.lag, a1 = 0.31 * tt + 1.0, a2 = 0.62 * tt + 1.4;
      const du = 0.155 * Math.cos(a1), dv = 0.186 * Math.cos(a2), l = Math.hypot(du, dv) || 1;
      const wv = Math.sin((calm ? 2.8 : 5.5) * t + f.ph), lat = f.lat * (1 + 0.25 * Math.sin(0.7 * t + f.ph)) + 0.01 * wv;
      const u = 0.42 + 0.5 * Math.sin(a1) - dv / l * lat, o = 0.92 + 0.3 * Math.sin(a2) + du / l * lat;
      // the turn of the shoal (how hard its way bends here), a roll of its own now and then, and the great swell's face
      const turn = Math.abs(du * -0.115 * Math.sin(a2) - dv * -0.048 * Math.sin(a1)) / (l * l * l) * 0.12;
      const own = Math.pow(Math.max(0, Math.sin(f.w * 1.9 * t + f.ph)), calm ? 4 : 10);
      this.sea(u, o); const e = S.e, inFace = (S.bb / 0.2) * sm(e, 0.0, 0.3) * (1 - sm(e, 0.7, 1.3));
      const flash = clamp01((own + 0.5 * sm(turn, 0.35, 1) * (0.5 + 0.5 * f.a) + 0.8 * inFace * (0.55 + 0.45 * Math.sin(t * 2.2 + f.ph))) * gl);
      this.cFish.copy(this.cBack).lerp(this.cSilver, flash);
      const wy = f.yaw + 0.16 * wv * (calm ? 0.5 : 1), hx = du / l - dv / l * wy, hy = dv / l + du / l * wy, al = fa * sm(tt, 1.7, 2.9);
      if (this.afloat(L, u, o, hx, hy, f.len, f.len * (0.26 + 0.14 * flash), 0.005, 4, (0.62 + 0.38 * flash) * al, this.cFish) && flash > 0.3) {
        // its flank catching the light: a glint, seen from wherever you stand
        const P = this.fp, g = sm(flash, 0.3, 1); this.bill(P.x, P.y + 0.006, P.z, f.len * 0.55 * g, f.len * 0.2 * g, 3, 0.9 * g * al * sm(S.E, 0.25, 0.7), f.yaw * 1.2, this.cSilver, 1.1);
      }
    }
    // foam round the keg, lying on the water
    if (kg.on && Ek > 0.3) for (let i = 0; i < N_KFOAM; i++) {
      const q = this.KF[i], a = q.a + 0.2 * Math.sin(t * 0.6 + q.ph), r = q.r * (1 + 0.15 * Math.sin(t * 1.4 + q.ph));
      this.afloat(L, kg.u + Math.cos(a) * r, kg.o + Math.sin(a) * r, -Math.sin(a), Math.cos(a), q.s, q.s * 0.45, 0.004, 5, (0.3 + 0.25 * Math.sin(t * 1.1 + q.ph) + 0.3 * tq) * out, this.cFoam);
    }
    // the keg's painted shell, and its wet gleam
    if (kg.on) {
      v.setFromMatrixPosition(this.kM).project(cam); const sx0 = v.x, sy0 = v.y;
      v.set(0, 0, 0.1).applyMatrix4(this.kM).project(cam);
      const rot = Math.atan2(v.y - sy0, (v.x - sx0) * (cam.aspect || 1.6));
      let best = -1, bl = 0.8;
      for (let i = 0; i < N_KDAB; i++) {
        const d = this.KD[i]; this.p3.copy(d.n).transformDirection(this.kM); const lit = clamp01(this.p3.y * 0.62 + 0.42 - 0.12 * (this.p3.x * O.x + this.p3.z * O.z));
        v.copy(d.p).applyMatrix4(this.kM);
        if (v.y < L.y + hk - 0.01 || this.p3.x * (cam.position.x - v.x) + this.p3.y * (cam.position.y - v.y) + this.p3.z * (cam.position.z - v.z) < 0.25 * cam.position.distanceTo(v)) continue;
        this.cK.copy(this.kLo).lerp(this.kMid, sm(lit, 0.1, 0.55)).lerp(this.kHi[i % 3], sm(lit, 0.5, 0.95) * (0.6 + 0.4 * d.k));
        this.bill(v.x, v.y, v.z, d.s, d.s * 0.4, 3, 0.94, rot + d.j, this.cK);
        if (lit > bl) { bl = lit; best = i; }
      }
      if (best >= 0) { const d = this.KD[best]; v.copy(d.p).multiplyScalar(1.04).applyMatrix4(this.kM); this.bill(v.x, v.y, v.z, 0.042, 0.014, 3, 0.9 * sm(bl, 0.8, 0.95), rot, this.cGleam, 1.25); }
    }
    // drops off the line as it comes up out of the water
    const drip = clamp01((ln.taut - 0.35) * 1.6) * out;
    if (drip > 0.01 && ln.D > 0.3) for (let i = 0; i < N_DROP; i++) {
      const d = this.DR[i]; if (calm && i % 2) continue;
      const age = ((t / d.P + d.a) % 1) * d.P; this.linePt(d.s, lp);
      const y = lp.y - 0.015 * age - 1.3 * age * age, w = this.sea(lp.x, lp.z); if (y < w + 0.004 || lp.z < 0.05) continue;
      L.floor(lp.x, lp.z, v);
      this.bill(v.x, L.y + y, v.z, 0.011 + 0.006 * d.c, 0.015 + 0.008 * d.c, 2, drip * (1 - age / d.P) * 0.9, 0, this.cDrop);
    }
    // spray smoking back off the great swell's crest; and where the keg shoulders through it
    const bk = S.bb / 0.2;
    if (bk > 0.05 && !calm) {
      for (let i = 0; i < N_SPRAY; i++) {
        const q = this.SP[i], age = ((t / q.P + q.a) % 1) * q.P, s0 = S.bs - this.bc * age - 0.03;
        const u0 = DB[0] * s0 + DB[1] * q.l, o0 = DB[1] * s0 - DB[0] * q.l; if (o0 < 0.1) continue;
        const hc = this.sea(u0 + DB[0] * this.bc * age, o0 + DB[1] * this.bc * age), E = S.E; if (E < 0.4) continue;
        const u = u0 + DB[0] * 0.25 * age, o = o0 + DB[1] * 0.25 * age, y = hc + (0.35 + 0.3 * q.b) * age - 1.5 * age * age;
        L.floor(u, o, v);
        this.bill(v.x, L.y + y, v.z, 0.014 + 0.016 * q.c, 0.014 + 0.016 * q.c, 2, bk * E * Math.sin(Math.PI * age / q.P) * 0.85 * (1 - 0.5 * Math.abs(q.l) / 0.9), 0, this.cDrop);
      }
      const since = eK < 0 ? -eK * S.bw / this.bc : -1;
      if (kg.on && since >= 0 && since < 0.7) for (let i = 0; i < N_SPLASH; i++) {
        const q = this.SQ[i], r = 0.07 + (0.22 + 0.2 * q.b) * since, y = kg.y + 0.03 + (0.5 + 0.35 * q.c) * since - 1.7 * since * since;
        L.floor(kg.u + Math.cos(q.a) * r, kg.o + Math.sin(q.a) * r, v);
        this.bill(v.x, L.y + y, v.z, 0.018 + 0.014 * q.c, 0.018 + 0.014 * q.c, 2, bk * (1 - since / 0.7) * 0.9, 0, this.cDrop);
      }
    }
    // thin fog over the water, nearer
    for (let i = 0; i < N_WISP; i++) {
      const f = this.WS[i], u = ((f.u + f.v * t + 1.5) % 3.0 + 3.0) % 3.0 - 1.5, hs = this.sea(u, f.o);
      const a = f.al * sm(t, 1.0, 2.6) * (1 - sm(Math.abs(u), 0.9, 1.5)) * S.E * out;
      L.at(u, hs + 0.2 + 0.02 * Math.sin(0.6 * t + f.ph) - rc, f.o, v);
      this.bill(v.x, v.y, v.z, f.w, f.w * 0.22, 0, a, 0, f.c);
    }
    this.cards.count = this.n; this.cards.visible = this.n > 0;
    this.cards.instanceMatrix.needsUpdate = true; this.aInfo.needsUpdate = true; this.aCol.needsUpdate = true;

    // ---- sound: the water itself (a surge as the great swell goes by), the bell and the rope on the show's clock
    if (showing) this.band.play(t);
    const near = L.quiet ? 0 : Math.max(0, 1 - Math.hypot(cam.position.x - L.cx, cam.position.z - L.cz) / 11), lv = (calm ? 0.6 : 1) * near * out, tau = calm ? 0.6 : 0.3;
    const sweep = 0.5 + 0.5 * Math.sin(0.45 * W1.k - t * W1.w);
    this.surf.set(lv * S.grow * (0.008 + 0.006 * sweep + 0.03 * bk), tau); this.hiss.set(lv * S.grow * (0.0016 + 0.002 * sweep + 0.012 * bk * sm(S.bs, 0.2, 1.2)), tau);
    L.voice().place(L.cx + L.nx, L.cz + L.nz);
  },
});
