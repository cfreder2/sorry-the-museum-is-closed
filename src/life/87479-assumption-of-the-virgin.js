// Domenikos Theotokopoulos, called El Greco, The Assumption of the Virgin (1577–79), Gallery 211. The word: rise.
//
// His first great commission in Toledo, an altarpiece four metres high: below, the apostles round the empty tomb;
// above, the Virgin rising on a crescent moon among angels into light. Everything in it goes up, in his long
// flame-like forms, his cold silver light and his sharp blue, rose, yellow and green. Look at it and only two things
// come out of it, light and colour, and both rise, slowly, round it and never over it.
//
// A cold silver light comes up on the floor before the picture and at the foot of the wall under it, then climbs the
// wall behind the frame, level by level, to the bare wall over the arch. After it his colours come out from behind
// the top rail and the frame's shoulders and drift up to the ceiling as veils of silk: the blue and the rose of her
// robes, a little of his yellow and green at the corners, silver between them, leaning in together like one
// flame, their folds travelling up them, thinning to nothing as they climb. The eye makes the climb from the floor to
// them over the painting itself. While you keep looking they go on rising, and the light breathes slowly up the wall.
// When you stop, the veils sink back behind the frame and the light goes.
//
// The music is the opening of Tomás Luis de Victoria's motet for this feast, Vidi speciosam (published in Venice in
// 1572, five years before the picture was begun): "I saw the fair one rising like a dove above the streams of water".
// Bars 1 to 20, all six voices as he wrote them, at a singer's pace, quietly, on soft pipes: the three high voices,
// then the three low, then all together on "ascendentem", to the cadence. Then silence, and after a while, again.
//
// Nothing passes in front of the picture, or of the pictures hung close on either side: the veils keep to the bare
// wall over the frames, and the light is on the floor and on the wall behind them (the kit's guard is there for every
// camera, and from the checks' nine it has nothing to cut). With "Reduce motion and flashing" on, everything drifts
// at half the speed and the first chord comes in more slowly still. Two draw calls: the veils (one mesh) and the
// light (the kit's pools). There are no flowers: the legend fills the tomb with them, but he painted it empty.
//
// No figure leaves the picture, not the Virgin, not an angel, not an apostle, in any form, and there is nothing here
// for the toy to push, ride or drive through: it is an altarpiece of a belief many people hold, so only its light and
// its colours come out, and they only rise.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01 } from '../paintlife.js';

const TAU = Math.PI * 2;
const sstep = (a, b, x) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };
const hash = n => { const x = Math.sin(n * 127.1 + 11.7) * 43758.5453; return x - Math.floor(x); };

// ---------------------------------------------------------------- the music
// Tomás Luis de Victoria, Vidi speciosam, a 6 (Motecta, Venice 1572), in Assumptione Beatae Mariae Virginis: bars 1
// to 20, each voice as written, 'note:length' in crotchets (1 left out; R a rest), at the pitch of the performing
// edition it was checked against (Nancho Alvarez's, a minor third above the notation).
const VIDI = [
  'C5:6 D5:2 G4:1.5 A4:0.5 Bb4:0.5 C5:0.5 D5:1.5 C5:0.5 Bb4:2 A4:0.5 G4:0.5 A4:2 R:15 A4 A4 A4 Bb4:2 A4 Bb4 G4:0.5 A4:0.5 Bb4:0.5 C5:0.5 D5:0.5 Eb5:0.5 F5:2 E5:0.5 D5:0.5 E5:2 F5:1.5 Eb5:0.5 D5 C5 Eb5 D5:1.5 C5:0.25 Bb4:0.25 A4:0.5 Bb4:0.5 C5:2 C5:2 R:1 F5 F5 F5 D5:2 Bb4 Bb4 D5:1.5 C5:0.5 D5:0.5 Eb5:0.5 F5:2 E5:0.5 D5:0.5 E5:2 F5:4',   // Cantus I
  'A4:3 G4:0.5 F4:0.5 G4 A4 Bb4 D5:1.5 C5:0.5 Bb4:0.5 A4:0.5 G4 A4 Bb4:2 C5:4 R:14 C5:2 C5 C5 D5:2 C5 D5 Eb5 D5:1.5 C5:0.25 Bb4:0.25 A4:0.5 Bb4:0.5 C5:4 A4 F4 F4 F4 Bb4:1.5 A4:0.25 G4:0.25 F4:2 G4:2 R:1 C5 C5 C5 D5:2 Bb4 D5 Eb5:2 F5:1.5 Eb5:0.5 D5 C5 Bb4:4 C5:4',   // Cantus II
  'F4:3 E4:0.5 D4:0.5 E4 F4 Bb3 Bb4:1.5 A4:0.5 G4:0.5 F4:0.5 Eb4 D4 G4:2 F4:4 R:15 F4 F4 F4 F4:2 F4:2 Bb4:1.5 A4:0.5 G4 F4 G4:4 F4:2 R:7 G4 G4 G4 A4:2 Bb4:2 R:1 Bb4 G4 G4 Bb4:2 F4 F4 G4:1.5 F4:0.5 G4:0.5 A4:0.5 Bb4:2 A4:0.5 G4:0.5 A4:2',   // Altus
  'R:16 C4:6 D4:2 G3:1.5 A3:0.5 Bb3:0.5 C4:0.5 D4:1.5 C4:0.5 Bb3:2 A3:0.5 G3:0.5 A3 F3 F3 F3 Bb3:2 F3 Bb3 Eb3:0.5 F3:0.5 G3:0.5 A3:0.5 Bb3:0.5 C4:0.5 D4 C4:4 C4:2 R:9 C4 C4 C4 Bb3:0.5 C4:0.5 D4:0.5 Eb4:0.5 F4:2 Eb4:2 R:1 F4:2 F3 Bb3:2 G3:2 C4:4',   // Tenor I
  'R:16 A3:3 G3:0.5 F3:0.5 G3 A3 Bb3 D4:1.5 C4:0.5 Bb3:0.5 A3:0.5 G3 A3 Bb3:2 C4:4 R:11 G3 G3 G3 A3:2 Bb3 A3 G3:0.5 A3:0.5 Bb3:0.5 C4:0.5 D4:0.5 Eb4:0.5 F4:2 E4:0.5 D4:0.5 E4:2 F4:2 R:1 Bb3 Bb3 Bb3 Bb3:2 Bb3:2 R:1 C4 D4:0.5 C4:0.5 Bb3:0.5 A3:0.5 Bb3:2 F4:4',   // Tenor II
  'R:16 F3:3 E3:0.5 D3:0.5 E3 F3 Bb2 Bb3:1.5 A3:0.5 G3:0.5 F3:0.5 Eb3 D3 G3:2 F3:4 R:11 C3 C3 C3 F3:2 Bb2 F3 Eb3:0.5 F3:0.5 G3:0.5 A3:0.5 Bb3:0.5 C4:0.5 D4 C4:3 C3 F3:2 R:1 Bb2 Bb2 Bb2 Eb3:2 Bb2 Bb3:2 A3 G3:4 F3:4',   // Bassus
];
const CROTCHET = 0.6;                              // seconds (a minim of 50 to the minute: a singer's pace, not hurried)
const PHRASE = 80 * CROTCHET, AGAIN = PHRASE + 10; // twenty bars; and the silence before it is sung again
const VOICE_VOL = [0.017, 0.015, 0.015, 0.015, 0.015, 0.019];
const hz = n => { const m = /^([A-G])(#|b)?(\d)$/.exec(n), k = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return 440 * Math.pow(2, (k + 12 * (+m[3] + 1) - 69) / 12); };
const SUNG = VIDI.flatMap((line, v) => { let at = 0; const out = []; for (const tok of line.split(' ')) { const [n, len = '1'] = tok.split(':'), d = +len; if (n !== 'R') out.push({ v, t: at * CROTCHET, d: d * CROTCHET, f: hz(n), last: at + d >= 80 }); at += d; } return out; }).sort((a, b) => a.t - b.t);

// ---------------------------------------------------------------- the veils
const K = 10;                                      // segments in a veil
// Over the top rail, drawn from the back forward: x along it (-1..1), tall (of the wall there is over it), width (m),
// lean, colour, when (seconds after the first). Together one flame, not a crown: they lean in as they rise.
const OVER = [
  { x: -0.34, tall: 1.05, w: 0.36, lean: 0.1, c: 'silver', at: 0.3 }, { x: 0.42, tall: 0.96, w: 0.32, lean: -0.14, c: 'silver', at: 0.6 },
  { x: -0.95, tall: 0.5, w: 0.46, lean: 0.33, c: 'yellow', at: 1.4 }, { x: 0.95, tall: 0.44, w: 0.44, lean: -0.39, c: 'green', at: 1.6 },
  { x: -0.7, tall: 0.72, w: 0.5, lean: 0.22, c: 'pink', at: 1.0 }, { x: 0.74, tall: 0.6, w: 0.5, lean: -0.28, c: 'sky', at: 1.2 },
  { x: -0.42, tall: 0.95, w: 0.95, lean: 0.13, c: 'rose', at: 0.45 }, { x: 0.5, tall: 0.84, w: 0.95, lean: -0.19, c: 'pink', at: 0.7 },
  { x: 0.03, tall: 1.08, w: 0.28, lean: -0.01, c: 'silver', at: 0.1 },
  { x: 0.02, tall: 1, w: 1.2, lean: -0.01, c: 'blue', at: 0 },
];
// At the shoulders of the frame, above the pictures hung beside it: side, how far up the free edge it starts (0..1),
// tall, width, how far it stands out from the frame's side before it turns up and in, colour.
const SHOULDERS = [
  { side: -1, at: 0.12, tall: 0.24, w: 0.54, reach: 0.42, c: 'blue' }, { side: -1, at: 0.5, tall: 0.4, w: 0.38, reach: 0.34, c: 'silver' }, { side: -1, at: 0.85, tall: 0.56, w: 0.46, reach: 0.3, c: 'rose' },
  { side: 1, at: 0.18, tall: 0.22, w: 0.54, reach: 0.4, c: 'rose' }, { side: 1, at: 0.55, tall: 0.36, w: 0.38, reach: 0.34, c: 'silver' }, { side: 1, at: 0.88, tall: 0.5, w: 0.44, reach: 0.28, c: 'blue' },
];
const N_VEIL = OVER.length + SHOULDERS.length;
// his colours, each with the light he lays along its folds
const SILK = {
  blue: ['#1f4fae', '#a9c8ee'], sky: ['#4a7fca', '#dbe9fa'], rose: ['#a82a55', '#f0a8bb'], pink: ['#cf5c88', '#fddbe5'], yellow: ['#c79c2c', '#f7e6a4'], green: ['#4c7828', '#c6d680'], silver: ['#b9c6d8', '#ffffff'],
};
const T_OVER = 2.4, GROW = 3.8;                    // when the veils begin (show seconds), and how long each takes to rise

lifeFor(87479, {
  title: /^The Assumption of the Virgin/,
  word: 'rise',
  // (the whole altarpiece, from the floor before it to the ceiling over it, seen from low down: it soars)
  stage: { out: 2.0, half: 2.2, cam: { dist: 6.2, height: 0.95, side: 0, fov: 62, lookU: 0, lookOut: 0, lookH: 3.05, whole: false } },
  wake: 2, ret: 2.4,

  build(L) {
    const col = (h, a = 0.1) => L.pal.near(h, a);
    const R = L.room;
    this.railH = L.rail - L.y; this.crownH = L.crown - L.y; this.A0 = L.hw + L.fw;
    this.ceilH = Math.min((R && (R.ceil || R.h)) || this.crownH + 1.6, this.crownH + 2.1) - 0.2;
    // The pictures hung beside it on this wall: how high the wall is taken on either side (the veils at its shoulders
    // start above them).
    let topL = this.railH, topR = this.railH;
    for (const a of L.k.museum.arts) {
      if (a === L.art || a.room !== L.art.room || a.obj || a.nx !== L.art.nx || a.nz !== L.art.nz) continue;
      const q = L.local(a.x, a.z), fr = a.frame || 0.1, u0 = q.u - a.w / 2 - fr, u1 = q.u + a.w / 2 + fr, top = a.y + a.h / 2 + fr - L.y;
      if (Math.abs(q.out) > 0.3) continue;
      if (u1 > -this.A0 - 1.7 && u0 < -this.A0) topL = Math.max(topL, top);
      if (u0 < this.A0 + 1.7 && u1 > this.A0) topR = Math.max(topR, top);
    }
    this.topL = topL; this.topR = topR;
    this.p = { u: 0, h: 0, o: 0, tw: 0 };
    this.sx = new Float32Array(K + 1); this.sy = new Float32Array(K + 1); this.sz = new Float32Array(K + 1); this.sw = new Float32Array(K + 1); this.sa = new Float32Array(K + 1); this.st = new Float32Array(K + 1);
    this.buildVeils(L, col);
    // the light: cold and silver, as his is (a shade warmer over the arch, where he painted it gold)
    const silver = col('#cfdcf6', 0.03);
    this.light = L.glows([
      { u: 0, out: 0.9, w: 4.0, d: 2.8, color: silver, strength: 0.62 },                                   // on the floor before it
      { wall: true, u: 0, v: -L.hh - 0.25, w: 4.2, d: 1.6, color: silver, strength: 0.8 },                 // behind the foot of the frame
      { wall: true, u: 0, v: -0.1, w: 6.0, d: 3.8, color: silver, strength: 0.66 },                        // up the wall behind it
      { wall: true, u: 0, v: L.hh * 0.72, w: 5.6, d: 3.4, color: silver, strength: 0.66 },
      { wall: true, u: 0, v: L.hh + 0.6, w: 5.0, d: 4.8, color: col('#eef0ea', 0.03), strength: 0.5 },     // over the arch
    ]);
    this.bT = 0; this.clock = 0; this.mu = 0;
    this.clear(L);
  },

  buildVeils(L, col) {
    // A veil of his silk, along x (it wraps): thin, soft at its edges and uneven, two long folds each with its light
    // (one edge firm, the other falling away into the half-tone) and its hollow. Red: the light. Green: the shade.
    const W = 256, H = 128, d = new Uint8Array(W * H * 4);
    for (let y = 0; y < H; y++) {
      const v = (y + 0.5) / H, br = 0.5 * hash(Math.floor(y / 4) * 3.7) + 0.5 * hash(Math.floor(y / 4 + 0.5) * 9.1);
      for (let x = 0; x < W; x++) {
        const a = x / W * TAU;
        const vv = clamp01((v - 0.04 - 0.03 * Math.sin(a * 2 + 1)) / (0.92 + 0.03 * Math.sin(a * 3 + 4) - 0.03 * Math.sin(a * 2 + 1)));
        const fe = Math.pow(Math.sin(Math.PI * vv), 0.5);
        const wisp = (0.5 + 0.5 * Math.sin(a * 2 + 6 * v + 1)) * (0.5 + 0.5 * Math.sin(a * 3 - 4 * v + 2));
        const al = fe * (0.76 + 0.16 * wisp + 0.08 * br);
        const c1 = 0.32 + 0.06 * Math.sin(a + 0.6) + 0.03 * Math.sin(2 * a + 2), c2 = 0.67 + 0.05 * Math.sin(a + 3.5) + 0.025 * Math.sin(3 * a);
        const ridge = (q, w) => sstep(-0.03, 0.004, q) * Math.pow(1 - sstep(0, w, q), 1.3);
        const hollow = q => sstep(-0.22, -0.06, q) * (1 - sstep(-0.035, 0.0, q));
        const g1 = 0.4 + 0.6 * sstep(-0.4, 0.6, Math.sin(a + 0.8)), g2 = 0.35 + 0.65 * sstep(-0.4, 0.5, Math.sin(a + 3.6));
        const hi = Math.max(g1 * ridge(v - c1, 0.2), 0.85 * g2 * ridge(v - c2, 0.16)) * (0.85 + 0.15 * br);
        const sh = clamp01(0.75 * Math.max(hollow(v - c1), 0.9 * hollow(v - c2)) + 0.22 * sstep(0.78, 1, v));
        const i = (y * W + x) * 4; d[i] = Math.round(255 * clamp01(hi)); d[i + 1] = Math.round(255 * (1 - sh)); d[i + 2] = 0; d[i + 3] = Math.round(255 * clamp01(al));
      }
    }
    const tex = new THREE.DataTexture(d, W, H, THREE.RGBAFormat);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true;

    const nV = N_VEIL * (K + 1) * 2, pos = new Float32Array(nV * 3), colr = new Float32Array(nV * 3), hi = new Float32Array(nV * 3), uv = new Float32Array(nV * 2), al = new Float32Array(nV), idx = [];
    for (let i = 0; i < N_VEIL; i++) for (let j = 0; j < K; j++) { const a = (i * (K + 1) + j) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const paint = (i, name, rep) => {
      const c = col(SILK[name][0]), h = col(SILK[name][1], 0.03), off = L.rand();
      for (let j = 0; j <= K; j++) for (let s = 0; s < 2; s++) {
        const v = (i * (K + 1) + j) * 2 + s;
        colr[v * 3] = c.r; colr[v * 3 + 1] = c.g; colr[v * 3 + 2] = c.b; hi[v * 3] = h.r; hi[v * 3 + 1] = h.g; hi[v * 3 + 2] = h.b;
        uv[v * 2] = off + (j / K) * rep; uv[v * 2 + 1] = s;
      }
    };
    this.veils = [];
    const span = this.ceilH - this.crownH; let i = 0;
    const wave = () => ({ k: 2.2 + 1.3 * L.rand(), sp: 0.26 + 0.14 * L.rand(), ph: L.rand() * TAU });
    for (const T of OVER) {
      const h0 = this.crownH - 0.1, thin = T.c === 'silver';
      this.veils.push({ i, u0: T.x * (this.A0 - 0.2), h0, len: Math.min(this.ceilH - h0 + 0.05, span * T.tall + 0.1), lean: T.lean, side: 0, reach: 0, turn: 0, out: thin ? 0.1 : 0.16 + 0.26 * L.rand(), w: T.w * 0.5,
        amp: 0.09 + 0.05 * L.rand(), tw: thin ? 0.7 : 0.35, t0: T_OVER + T.at, a: thin ? 0.62 : 0.96, ...wave() });
      paint(i++, T.c, 0.55 + 0.2 * L.rand());
    }
    for (const T of SHOULDERS) {
      const from = (T.side < 0 ? this.topL : this.topR) + 0.34, to = this.crownH - 0.22, room = to - from, h0 = from + Math.max(0, room) * T.at;
      const tip = Math.min(this.ceilH - 0.15, this.crownH + span * T.tall);
      this.veils.push({ i, u0: T.side * (this.A0 - 0.05), h0, len: Math.max(0.5, tip - h0), lean: 0, side: T.side, reach: T.reach, turn: 0.12 + 0.25 * T.at, out: 0.08 + 0.12 * L.rand(), w: T.w * 0.5,
        amp: 0.06 + 0.04 * L.rand(), tw: 0.35, t0: T_OVER - 0.8 + 1.0 * T.at, a: 0.92, off: room < 0.5, ...wave() });
      paint(i++, T.c, 0.55 + 0.2 * L.rand());
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aA', new THREE.BufferAttribute(al, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(colr, 3)); geo.setAttribute('aHi', new THREE.BufferAttribute(hi, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const u = this.su = { uFlow: { value: 0 } };
    const m = new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aHi; attribute float aA; varying vec3 vHi; varying float vA;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vHi = aHi; vA = aA;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uFlow; varying vec3 vHi; varying float vA;')
        .replace('#include <map_fragment>', '')
        .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec4 tx = texture2D(map, vMapUv - vec2(uFlow, 0.0));      // (the folds travel up the cloth)
  vec3 c = diffuseColor.rgb * (0.5 + 0.5 * tx.g);
  diffuseColor.rgb = mix(c, vHi, tx.r * 0.72);
  diffuseColor.a = tx.a * vA;
  if (diffuseColor.a < 0.012) discard;
}`);
    };
    m.customProgramCacheKey = () => 'assumption-veil';
    this.silk = new THREE.Mesh(geo, m); this.silk.name = 'veils'; this.silk.renderOrder = 8;      // (after the room's own washes of light on the wall, which would bleach them)
    L.add(this.silk);
  },

  clear() {
    this.silk.visible = false;
    for (let i = 0; i < 5; i++) this.light.set(i, 0);
  },

  start(L) { this.bT = 0; this.mu = 0; this.choirUp(L); },
  back(L) { this.bT = L.t; this.choirDown(L, 0.55); },
  end() { this.clear(); },
  reset(L) { this.clear(); this.choirDown(L, 0.05); },

  update(L, dt) {
    const showing = L.phase === 'wake' || L.phase === 'play', back = L.phase === 'return';
    const calm = !!L.k.museum.calm;
    this.clock += dt * (calm ? 0.5 : 1);            // (what drifts and breathes, at half the speed when motion is reduced)
    const tt = showing ? L.t : this.bT, gone = back ? ease.inOut(ramp(L.ret, 0, 0.92)) : 0;
    this.drift(L, tt, gone);
    // ---- the light: on the floor, at the foot of the wall, then up the wall behind the frame to the arch; and a slow
    // swell that goes on climbing after it (one every fourteen seconds)
    const off = 1 - (back ? ease.smooth(L.ret) : 0);
    for (let i = 0; i < 5; i++) {
      const on = ease.smooth(ramp(tt, [0.1, 0.4, 1.2, 1.9, 2.6][i], [1.9, 2.2, 3.0, 3.9, 5.0][i]));
      const pass = i < 4 ? 1 - 0.3 * ease.smooth(ramp(tt, [3.2, 3.6, 4.4, 5.2][i], [5.4, 5.8, 6.6, 7.4][i])) : 1;      // (brightest as the light passes, then it settles)
      this.light.set(i, on * pass * off * (0.86 + 0.14 * Math.sin(this.clock * 0.45 - i * 0.9)));
    }
    if (showing) this.sing(L, L.t, calm);
    L.voice().place();
  },

  // ---------------------------------------------------------------- the veils, each frame
  veilAt(F, s, g, p) {
    const c = this.clock, len = F.len * g * (1 + 0.05 * Math.sin(c * F.sp * 0.7 + F.ph * 3)), a = s * len;
    const wave = Math.sin(F.k * s - c * F.sp + F.ph), wave2 = Math.sin(F.k * 0.6 * s - c * F.sp * 0.63 + F.ph * 2.3);
    p.u = F.u0 + a * F.lean + F.side * (F.reach * (1 - Math.pow(1 - s, 2.4)) - F.turn * a * s) * g + F.amp * Math.pow(s, 1.2) * wave * g;
    p.h = F.h0 + (F.side ? a * (0.3 + 0.7 * s) : a);
    p.o = -0.03 + 0.06 * Math.min(1, s * 7) + (F.out * Math.pow(s, 1.4) + 0.05 * s * wave2) * g;
    p.tw = F.tw * Math.sin(F.k * 0.7 * s - c * F.sp * 0.5 + F.ph * 1.7) * Math.min(1, s * 3);
    return p;
  },
  drift(L, tt, gone) {
    if (tt < T_OVER - 1) { this.silk.visible = false; return; }
    const SX = this.sx, SY = this.sy, SZ = this.sz, SW = this.sw, SA = this.sa, ST = this.st, p = this.p, c = this.clock;
    for (const F of this.veils) {
      const g = F.off ? 0 : ease.inOut(ramp(tt, F.t0, F.t0 + GROW)) * (1 - gone);
      for (let j = 0; j <= K; j++) {
        const s = j / K; this.veilAt(F, s, g, p);
        SX[j] = L.cx + L.tx * p.u + L.nx * p.o; SY[j] = L.y + Math.min(p.h, this.ceilH + 0.12); SZ[j] = L.cz + L.tz * p.u + L.nz * p.o;
        // (a veil: full at the root, a little wider, then narrowing; it does not end in a point but thins away)
        SW[j] = F.w * (0.86 + 0.26 * Math.sin(Math.PI * Math.min(1, s * 1.9))) * (1 - 0.5 * s) * (1 + 0.08 * Math.sin(F.k * 1.7 * s - c * F.sp * 1.3 + F.ph)) * (0.5 + 0.5 * g) * (F.side ? 0.22 + 0.78 * sstep(0.02, 0.34, s) : 1); ST[j] = p.tw;
        SA[j] = g > 0.015 ? sstep(0, 0.07, s) * (1 - sstep(0.55, 1, s)) * Math.min(1, g * 2.5) * (1 - gone) * F.a : 0;
      }
      this.strip(L, F.i);
    }
    const geo = this.silk.geometry; geo.attributes.position.needsUpdate = true; geo.attributes.aA.needsUpdate = true;
    this.silk.visible = true; this.su.uFlow.value = (c * 0.03) % 1;
  },
  // Lay veil i along the K + 1 points in the scratch arrays, its width in the plane of the wall and turned a little
  // about its own length, as silk turns.
  strip(L, i) {
    const SX = this.sx, SY = this.sy, SZ = this.sz, pos = this.silk.geometry.attributes.position.array, al = this.silk.geometry.attributes.aA.array;
    for (let j = 0; j <= K; j++) {
      const a = Math.max(0, j - 1), b = Math.min(K, j + 1);
      let tx = SX[b] - SX[a], ty = SY[b] - SY[a], tz = SZ[b] - SZ[a];
      const tl = Math.hypot(tx, ty, tz); if (tl > 1e-6) { tx /= tl; ty /= tl; tz /= tl; } else { tx = 0; ty = 1; tz = 0; }
      const cs = Math.cos(this.st[j]), sn = Math.sin(this.st[j]) * 0.8;
      let wx = ty * L.nz, wy = tz * L.nx - tx * L.nz, wz = -ty * L.nx;
      const wl = Math.hypot(wx, wy, wz) || 1; wx = wx / wl * cs + L.nx * sn; wy = wy / wl * cs; wz = wz / wl * cs + L.nz * sn;
      const w = this.sw[j], v = (i * (K + 1) + j) * 2;
      pos[v * 3] = SX[j] - wx * w; pos[v * 3 + 1] = Math.max(L.y + 0.004, SY[j] - wy * w); pos[v * 3 + 2] = SZ[j] - wz * w;
      pos[v * 3 + 3] = SX[j] + wx * w; pos[v * 3 + 4] = Math.max(L.y + 0.004, SY[j] + wy * w); pos[v * 3 + 5] = SZ[j] + wz * w;
      al[v] = al[v + 1] = this.sa[j];
    }
  },

  // ---------------------------------------------------------------- the voices
  // Soft pipes, one to a part: each note two voices a hair apart and a little of the octave above, swelling in and
  // dying away. All through one gain: it comes up gently when a show begins (more slowly still when motion is
  // reduced: no sudden first sound) and is let down when the look ends.
  choirUp(L) {
    const v = L.voice(), c = v.ctx, out = c && v.out(); if (!c || !out) return;
    if (!this.bus || this.busCtx !== c) {
      this.bus = c.createGain(); this.bus.gain.value = 0; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; lp.Q.value = 0.3;
      this.bus.connect(lp); lp.connect(out); this.busCtx = c;
    }
    const calm = !!L.k.museum.calm;
    this.bus.gain.cancelScheduledValues(c.currentTime); this.bus.gain.setTargetAtTime(calm ? 0.8 : 1, c.currentTime, calm ? 1.1 : 0.45);
  },
  choirDown(L, over) {
    const c = this.busCtx; if (!c || !this.bus) return;
    this.bus.gain.cancelScheduledValues(c.currentTime); this.bus.gain.setTargetAtTime(0, c.currentTime, over);
  },
  note(c, e, at) {
    const t0 = c.currentTime + Math.max(0, at), vol = VOICE_VOL[e.v], a = Math.min(0.22, e.d * 0.35), end = t0 + e.d, rel = e.last ? 1.6 : 0.25 + Math.min(0.4, e.d * 0.25);
    const g = c.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + a); g.gain.setValueAtTime(vol, Math.max(t0 + a, end - 0.05)); g.gain.linearRampToValueAtTime(vol * 0.7, end); g.gain.exponentialRampToValueAtTime(0.0001, end + rel);
    g.connect(this.bus);
    for (const [type, mul, k] of [['triangle', 1, 1], ['sine', 1.003, 0.8], ['sine', 2.001, 0.14]]) {
      const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = e.f * mul; og.gain.value = k;
      o.connect(og); og.connect(g); o.start(t0); o.stop(end + rel + 0.05);
    }
  },
  sing(L, t) {
    const v = L.voice(), c = v.ctx, to = t + 0.3, from = this.mu;
    if (to <= from) return;
    this.mu = to;
    if (L.quiet || !c) return;
    if (!this.bus || this.busCtx !== c) this.choirUp(L);
    if (!this.bus) return;
    for (let n = Math.max(0, Math.floor(from / AGAIN)); n * AGAIN < to; n++) {
      const b = n * AGAIN + 0.35;                  // (the first chord a moment after the light begins)
      if (b + PHRASE < from) continue;
      for (const e of SUNG) { const at = b + e.t; if (at >= from && at < to) this.note(c, e, at - t); }
    }
  },
});
