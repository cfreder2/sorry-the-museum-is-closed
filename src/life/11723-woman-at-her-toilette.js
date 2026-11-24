// Berthe Morisot, Woman at Her Toilette (1875–80), Gallery 201. The word: powder.
//
// A dressing table after a ball: a tilted glass that gives back only paint, a crystal jar with a rosebud, two cream
// roses, and in its dish a swansdown powder puff; and the whole picture is laid in as if with that puff, in soft,
// feathery touches of silver white, grey, lavender, blue and rose that never quite settle into things. (Of her pictures
// in the 1880 exhibition, where this one hung, Charles Ephrussi wrote that she grinds flower petals onto her palette
// and spreads them on the canvas in airy touches.) So what comes out of the picture is the powder, and the powder is
// her paint.
//
// Look, and a few grains sift down from under the frame. The puff edges out after them from under the bottom rail,
// overhangs, tips, and falls, slowly, turning over once, as a thing of down falls. Where it lands the powder goes up:
// her own brushstrokes, loose in the air, flung out low across the floor and up in a soft dome, slowing at once,
// turning, catching the light as they hang, and coming down over the next few seconds to lie on the floor as a thin
// dusting, stroke by stroke, feathered out from where the puff fell, with the blue and rose sprays of her wall among
// it. The puff hops once, softly, and sits; a few motes stay up in the light, and now and then a few more grains sift
// down. The music is the opening of Fauré's "Après un rêve" (1877, the picture's own years, in Paris), very quietly:
// a bar of the piano's repeated chords while the puff comes out, and the voice comes in, on a sine, as it lands.
//
// Nothing is solid. While the toy is near, the powder stays out after the look: the toy leaves its tracks in the
// dusting and kicks a little up as it goes, and if it nudges the puff, the puff hops out of its way and pats down
// another small cloud. Then the powder lifts off the floor and is drawn back up under the frame, the puff with it.
// With "Reduce motion and flashing" on, the strokes turn at half the speed and the landing is softer; nothing here
// flashes in any case.
//
// What it does not do: the woman does not come out, in any form (no figure, no hand to hold the puff, no reflection in
// any glass), and nothing sets the player to watching her, because hers is a private moment; the show is the room's
// air and her touch, not her.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, rng, canvasTexture } from '../paintlife.js';
import { score, noise, hz } from './stagecraft.js';

const BEAT = 60 / 66;                                     // Andantino
const T_M = 0.3, T_LAND = T_M + 3 * BEAT;                 // the piano's first bar; the puff lands on the voice's first note
const T_PEEP = 0.45, T_OUT = 1.3, T_TIP = 2.2;             // it edges out from under the rail; overhangs and tips; lets go
const T_HOP = T_LAND + 0.52, T_REST = T_HOP + 0.9;        // down again from its one soft hop; at rest
const LAND = [-0.21, 0.46], REST = [-0.15, 0.62];         // where it lands (straight under its place in the picture) and comes to rest (u along the wall, out from it)
const PR = 0.085, PH = PR * 0.76;                         // the puff: its radius and half its height (larger than life: the toy's size)
const PATCH = [-1.4, 0.02, 2.8, 1.75];                    // the dusted floor: u0, out0, width, depth (m)
const NB = 8;                                             // clouds: 0 the sift, 1 the fall, 2 the hop, 3 a later sift, 4 to 7 the toy's
const TOP = 0.95;                                         // the powder stays under this (m): below the picture from where you look

// Gabriel Fauré, "Après un rêve", Op. 7 No. 1 (1877; words by Romain Bussine, a dreamer waking and asking the night
// to come back), in C minor, 3/4, Andantino: note for note from the Mutopia Project's public-domain engraving of the
// Choudens edition (in print by 1880). The voice, bars 2 to 15 ("Dans un sommeil que charmait ton image..."):
// [beats from the top of bar 2, midi note, beats].
const VOICE = [
  [0, 67, 1], [1, 72, 1], [2, 74, 1],
  [3, 75, 4 / 3], [13 / 3, 74, 1 / 3], [14 / 3, 72, 1 / 3], [5, 75, 1 / 3], [16 / 3, 74, 1 / 3], [17 / 3, 72, 1 / 3],
  [6, 72, 2], [8, 70, 1],
  [9, 73, 0.5], [9.5, 65, 0.5], [10, 73, 1], [11, 72, 0.5], [11.5, 71, 0.5],
  [12, 72, 1.5], [13.5, 72, 0.5], [14, 70, 0.75], [14.75, 68, 0.25],
  [15, 67, 4 / 3], [49 / 3, 68, 1 / 3], [50 / 3, 70, 1 / 3], [17, 68, 1 / 3], [52 / 3, 70, 1 / 3], [53 / 3, 72, 1 / 3],
  [18, 67, 3],
  [21, 67, 1], [22, 63, 2 / 3], [68 / 3, 65, 1 / 3], [23, 67, 2 / 3], [71 / 3, 68, 1 / 3],
  [24, 70, 4 / 3], [76 / 3, 65, 1 / 3], [77 / 3, 65, 1 / 3], [26, 65, 1 / 3], [79 / 3, 64, 1 / 3], [80 / 3, 65, 1 / 3],
  [27, 68, 2], [29, 67, 1],
  [30, 72, 1], [31, 72, 1.5], [32.5, 71, 0.5],
  [33, 70, 1], [34, 63, 1], [35, 63, 1],
  [36, 65, 4 / 3], [112 / 3, 66, 1 / 3], [113 / 3, 68, 1 / 3], [38, 66, 1 / 3], [115 / 3, 68, 1 / 3], [116 / 3, 70, 1 / 3],
  [39, 70, 2], [41, 63, 1],
];
// The piano's right hand, bars 1 to 15: six quaver chords a bar, as [chord, how many] runs.
const C = { i: [60, 63, 67], a: [58, 62, 63, 67], b: [57, 60, 63, 67], c: [57, 60, 63, 65], d: [56, 60, 62, 65], e: [56, 58, 62, 65], f: [56, 61, 65], g: [55, 61, 64], h: [56, 60, 64], j: [56, 60, 65], k: [53, 55, 59, 62], l: [53, 56, 60, 62], m: [55, 60, 63], n: [53, 58, 65] };
const CHORDS = [
  [[C.i, 6]], [[C.i, 4], [C.a, 2]], [[C.b, 4], [C.c, 2]], [[C.d, 4], [C.e, 2]], [[C.f, 4], [C.g, 2]], [[C.h, 4], [C.j, 2]], [[C.k, 4], [C.l, 2]], [[C.k, 6]],
  [[C.m, 6]], [[C.n, 6]], [[C.f, 4], [C.g, 2]], [[[53, 60, 65], 2], [[53, 60, 63], 2], [[53, 60, 62], 1], [[53, 59, 62], 1]], [[[51, 58, 63], 4], [C.m, 2]], [[[56, 63, 65], 4], [[56, 62, 65], 2]], [[[55, 58, 63, 67], 6]],
];
// Its left hand (the upper note of each octave): [beats from the top of bar 1, midi note, beats]. It rests for two bars.
const BASS = [[6, 41, 3], [9, 46, 3], [12, 39, 3], [15, 44, 2], [17, 38, 1], [18, 43, 6], [24, 48, 3], [27, 49, 3], [30, 46, 3], [33, 44, 3], [36, 43, 2], [38, 48, 1], [39, 47, 1], [40, 46, 2], [42, 39, 3]];

// Her touches, as she laid them here: silver whites and greys, with lavender, blue, rose and a little cream among them.
const TONES = [['#dddbd7', 22], ['#cbc9c6', 18], ['#b5b2b0', 12], ['#a3a2ac', 9], ['#b6b2c6', 9], ['#97a9ba', 6], ['#7f8fa8', 2.5], ['#ccb3ae', 6], ['#ad8a8c', 2], ['#d2c7ad', 5], ['#a5b0a3', 2], ['#b39a7a', 1]];
const WHITES = [['#e6e4e0', 5], ['#d9d7d3', 3], ['#c9c6c4', 1.5], ['#d3d0da', 1]];
const AIR = [['#e2e0dc', 10], ['#cfcdca', 13], ['#b9b6b4', 13], ['#a09fa9', 12], ['#b3aec6', 13], ['#93a6b9', 10], ['#7b8ca6', 5], ['#c9aca8', 9], ['#aa8587', 4], ['#d0c4a8', 6], ['#a2ae9f', 3], ['#b0966f', 2]];

// A texture straight from pixels (so colour is kept where nothing is painted: no dark fringe round a stroke).
function dataTex(img, srgb) {
  const t = new THREE.DataTexture(new Uint8Array(img.data), img.width, img.height, THREE.RGBAFormat);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}
const weighted = (set, rand) => { let tot = 0; for (const s of set) tot += s[1]; let r = rand() * tot; for (const s of set) if ((r -= s[1]) <= 0) return s[0]; return set[0][0]; };

lifeFor(11723, {
  title: /^Woman at Her Toilette/,
  word: 'powder',
  // (a small work, hung high: the camera stands at the height of its bottom rail, so everything under that height is
  // under the picture from there, wherever it is in the room)
  stage: { out: 1.5, half: 1.3, cam: { dist: 2.7, height: 1.06, side: 0.2, fov: 60, lookU: -0.08, lookOut: 0.45, lookH: 0.8, floorOut: 1.2 } },
  wake: 2, ret: 2.4,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.12) => P.near(h, a), R = L.rand;
    this.e = new THREE.Euler(0, 0, 0, 'YXZ');
    this.yRail = L.rail - L.y - PH - 0.008;                  // the puff's middle while it is under the bottom rail
    const O = L.floor(0, 0), ax = new THREE.Vector4(L.tx, L.tz, L.nx, L.nz);

    // ---------------------------------------------------------- her marks: feathered flicks of a loaded brush
    // (one sheet of eight: five flicks, a scatter of grains, a soft breath of dust, a pair of wisps; white, to be tinted)
    const sheet = (() => {
      const W = 512, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const g = cv.getContext('2d', { willReadFrequently: true }), r = rng(11723); g.lineCap = 'round'; g.lineJoin = 'round';
      const cell = (i, fn) => { g.save(); g.translate((i % 4) * 128 + 64, Math.floor(i / 4) * 128 + 64); fn(); g.restore(); };
      // (dry: a few bristle lines with the air between them, ragged at both ends, so a flick still shows its streaks when it is small)
      const flick = (len, wid, bend, hook, n, lw = 1) => {
        for (let k = 0; k < n; k++) {
          const o = ((k + 0.5) / n - 0.5 + (r() - 0.5) * 0.5 / n) * wid, thin = 1 - Math.abs(o) / (wid * 0.5 + 0.01) * 0.3, x0 = -len / 2 * thin + r() * len * 0.3, x1 = len / 2 * thin - r() * len * 0.3, v = 205 + Math.floor(r() * 50);
          const y = x => { const t = 2 * x / len; return bend * (1 - t * t) + hook * Math.max(0, t) ** 3 + o * (1 - 0.45 * t * t); };
          g.strokeStyle = `rgba(${v},${v},${v},${0.42 + 0.5 * r()})`; g.lineWidth = (1.6 + r() * 2.2) * lw;
          g.beginPath(); for (let s = 0; s <= 8; s++) { const x = x0 + (x1 - x0) * s / 8; if (s) g.lineTo(x, y(x)); else g.moveTo(x, y(x)); } g.stroke();
        }
      };
      cell(0, () => flick(110, 30, 3, 0, 7)); cell(1, () => flick(106, 28, 12, 0, 6)); cell(2, () => flick(102, 24, 4, -16, 6));
      cell(3, () => flick(78, 44, 2, 0, 9)); cell(4, () => flick(112, 12, -6, 8, 3));
      cell(5, () => { for (let k = 0; k < 17; k++) { g.save(); g.translate((r() - 0.5) * 92, (r() - 0.5) * 92); g.rotate((r() - 0.5) * 1.6); flick(6 + r() * 9, 3, 0, 0, 2, 0.6); g.restore(); } });
      cell(7, () => { g.translate(0, -13); flick(100, 10, 5, 0, 3); g.translate(6, 26); flick(84, 10, -4, 0, 3); });
      const img = g.getImageData(0, 0, W, H), d = img.data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 0) d[i] = d[i + 1] = d[i + 2] = 232;
      // (cell 6: a breath of powder: soft, and grainy, as powder is)
      for (let y = 128; y < 256; y++) for (let x = 256; x < 384; x++) { const i = (y * W + x) * 4, rr = Math.hypot(x - 320, y - 192) / 62, f = Math.max(0, 1 - rr); d[i] = d[i + 1] = d[i + 2] = 236; d[i + 3] = 255 * Math.pow(f, 1.4) * (0.45 + 0.55 * r()); }
      return dataTex(img, false);
    })();

    // ---------------------------------------------------------- the powder in the air: every mark a function of the clock
    // Each mark belongs to a cloud (uB: where on the floor, when, how hard): thrown out along the floor and up, slowed
    // at once by the air, hanging, turning, and coming down to lie. One mesh, all of it worked out in the shader.
    const Q = [];
    const mark = (b, o) => Q.push({ b, delay: 0, hang: 0.4, fall: 0.1, ang: 0, reach: 0.2, rise: 0.2, len: 0.14, asp: 1, seed: R(), spin: (R() - 0.5) * 2.2, kind: 0, cell: [0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 7, 7][Math.floor(R() * 14)], c: col(weighted(AIR, R)), ...o });
    const size = () => { const r = R(); return r < 0.6 ? 0.12 + 0.07 * R() : r < 0.85 ? 0.19 + 0.1 * R() : 0.07 + 0.04 * R(); };
    const thrown = (b, n, from, o = {}) => {
      for (let i = 0; i < n; i++) {
        const skirt = i % 20 < 11, r = R(), r2 = R();
        const ang = R() < 0.7 ? Math.PI * (0.05 + 0.9 * R()) : Math.PI * (1 + R());                  // mostly out into the room
        let reach = (skirt ? 0.32 + 0.78 * Math.pow(r, 0.8) : 0.08 + 0.55 * r) * (o.far || 1);
        if (Math.sin(ang) < 0) reach = Math.min(reach, (from[1] - 0.1) / -Math.sin(ang));          // never into the wall
        const rise = Math.min(TOP, (skirt ? 0.05 + 0.24 * r2 : 0.3 + 0.62 * r2) * (o.high || 1));
        const hang = skirt ? 0.25 + 0.8 * R() : 0.9 + 1.6 * R(), down = (skirt ? 1.3 + 2.6 * R() : 3.4 + 4.8 * R()) * (o.slow || 1);
        mark(b, { ang, reach, rise, hang, fall: rise / Math.max(0.45, down - hang), len: size() * (o.big || 1), asp: 0.75 + 0.6 * R(), ...(o.cell != null ? { cell: o.cell, c: col(weighted(WHITES, R)) } : {}) });
      }
    };
    // 1: where it falls: her flicks, a scatter of fine grains among them, motes that stay up, and its breath
    thrown(1, 118, LAND);
    thrown(1, 36, LAND, { cell: 5, big: 1.5 });
    for (let i = 0; i < 14; i++) mark(1, { kind: 2, ang: Math.PI * (0.08 + 0.84 * R()), reach: 0.1 + 0.6 * R(), rise: 0.28 + 0.6 * R(), len: 0.06 + 0.07 * R(), cell: R() < 0.4 ? 3 : 5, c: col(weighted(WHITES, R)) });
    for (let i = 0; i < 22; i++) mark(1, { kind: 1, cell: 6, ang: Math.PI * (0.04 + 0.92 * R()), reach: 0.08 + 0.62 * R(), rise: 0.06 + 0.5 * R(), hang: 9, fall: 0, len: 0.42 + 0.4 * R(), spin: 0, c: col(['#d6d4dc', '#dcd9d5', '#cfd3da'][i % 3]) });
    // 2: its one soft hop
    thrown(2, 26, REST, { far: 0.5, high: 0.55, slow: 0.6, big: 0.8 });
    thrown(2, 8, REST, { far: 0.5, high: 0.55, slow: 0.6, cell: 5, big: 1.2 });
    for (let i = 0; i < 4; i++) mark(2, { kind: 1, cell: 6, ang: Math.PI * (0.2 + 0.6 * R()), reach: 0.05 + 0.2 * R(), rise: 0.06 + 0.15 * R(), hang: 9, fall: 0, len: 0.28 + 0.15 * R(), spin: 0, c: col('#d6d4dc') });
    // 0 and 3: grains sifting down from under the rail
    const top = L.rail - L.y - 0.03;
    for (const [b, n, over] of [[0, 26, 2.0], [3, 14, 1.2]]) for (let i = 0; i < n; i++) mark(b, { kind: 3, delay: over * (i + R()) / n, ang: R() * 6.283, reach: 0.01 + 0.05 * R(), rise: top, fall: 0.5 + 0.3 * R(), len: 0.07 + 0.05 * R(), cell: R() < 0.6 ? 5 : 3, spin: (R() - 0.5) * 5, c: col(weighted(WHITES, R)) });
    // 4 to 7: the toy's own little clouds (a nudge to the puff, its wheels in the dusting)
    for (let b = 4; b < NB; b++) for (let i = 0; i < 12; i++) { const rise = 0.04 + 0.24 * R(), hang = 0.1 + 0.2 * R(); mark(b, { ang: R() * 6.283, reach: 0.06 + 0.22 * R(), rise, hang, fall: rise / (0.45 + 0.5 * R()), len: 0.07 + 0.07 * R(), asp: 0.8 + 0.5 * R() }); }
    const N = this.marks = Q.length;
    const pos = new Float32Array(N * 12), uv = new Float32Array(N * 8), colr = new Float32Array(N * 12), aA = new Float32Array(N * 16), aB = new Float32Array(N * 16), aC = new Float32Array(N * 16), idx = [];
    Q.forEach((m, i) => {
      const u0 = (m.cell % 4) / 4, v0 = Math.floor(m.cell / 4) / 2;
      for (let k = 0; k < 4; k++) {
        const x = k % 2 ? 0.5 : -0.5, y = k < 2 ? -0.5 : 0.5, j = i * 4 + k;
        pos.set([x, y, 0], j * 3); uv.set([u0 + (x + 0.5) / 4, v0 + (y + 0.5) / 2], j * 2); colr.set([m.c.r, m.c.g, m.c.b], j * 3);
        aA.set([m.b, m.delay, m.hang, m.fall], j * 4); aB.set([m.ang, m.reach, m.rise, m.len], j * 4); aC.set([m.seed, m.spin, m.asp, m.kind], j * 4);
      }
      idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3);
    });
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); cg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); cg.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    cg.setAttribute('aA', new THREE.BufferAttribute(aA, 4)); cg.setAttribute('aB', new THREE.BufferAttribute(aB, 4)); cg.setAttribute('aC', new THREE.BufferAttribute(aC, 4)); cg.setIndex(idx);
    const cu = this.cu = {
      uT: { value: 0 }, uRet: { value: 0 }, uSpin: { value: 1 }, uO: { value: O.clone() }, uAx: { value: ax },
      uMouth: { value: new THREE.Vector3(LAND[0], L.rail - L.y - 0.06, 0.03) },
      uB: { value: Array.from({ length: NB }, () => new THREE.Vector4(0, 0, 0, 0)) },
    };
    const cm = new THREE.MeshBasicMaterial({ map: sheet, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
    cm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, cu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec4 aA, aB, aC;
uniform float uT, uRet, uSpin; uniform vec3 uO, uMouth; uniform vec4 uAx; uniform vec4 uB[${NB}];
varying float vPow, vLit;`).replace('#include <project_vertex>', /* glsl */`
  vec4 pB = uB[int(aA.x + 0.5)];
  float pS = aC.x, pKind = aC.w, pT = uT - pB.z - aA.y;
  float pOn = step(0.0, pT) * step(0.001, pB.w); pT = max(pT, 0.0);
  vec2 pD = vec2(cos(aB.x), sin(aB.x));
  float pE1 = 1.0 - exp(-pT / 0.34), pE2 = 1.0 - exp(-pT / 0.5);
  // thrown out along the floor, and stopped almost at once by the air; then it creeps, turns with the room's air, wanders
  vec2 pQ = pD * aB.y * pB.w * (pE1 + 0.04 * pT / (1.0 + 0.25 * pT));
  float pSw = uSpin * 0.45 * (0.4 + pS) * (1.0 - exp(-pT / 2.4));
  pQ = vec2(pQ.x * cos(pSw) - pQ.y * sin(pSw), pQ.x * sin(pSw) + pQ.y * cos(pSw));
  pQ += smoothstep(0.15, 1.6, pT) * 0.07 * vec2(sin(pT * (0.45 + 0.5 * pS) + pS * 40.0), cos(pT * (0.38 + 0.4 * pS) + pS * 23.0));
  pQ += pB.xy; pQ.y = max(pQ.y, 0.05);
  float pH;
  if (pKind > 2.5) pH = aB.z - aA.w * pT;                                           // a grain, sifting straight down
  else if (pKind > 1.5) pH = aB.z * pB.w * pE2 + 0.05 * sin(pT * (0.5 + pS) + pS * 9.0) * smoothstep(0.5, 2.0, pT);      // a mote: it stays up
  else { float x = pT - aA.z; pH = aB.z * pB.w * pE2 - aA.w * (max(x, 0.0) + 0.25 * log(1.0 + exp(-abs(x) * 4.0))); }   // up; it hangs; it comes down
  pH = min(pH, ${TOP.toFixed(2)});
  float pA = pOn * smoothstep(0.0, 0.07, pT) * smoothstep(0.0, 0.09, pH), pGrow = 0.5 + 0.5 * smoothstep(0.0, 0.4, pT);
  bool pHaze = pKind > 0.5 && pKind < 1.5;
  if (pHaze) { pA *= 0.15 * (1.0 - smoothstep(1.4, 5.5, pT)); pGrow = 0.45 + 0.9 * pE1 + 0.06 * pT; } else pA *= 0.9;
  vec3 pP = vec3(pQ.x, max(pH, 0.0) + 0.014, pQ.y);                                  // (along the wall, up, out from it)
  if (uRet > 0.0) {
    // going home: up off the floor from wherever it lies or hangs, and in under the frame, each in its own time
    float k = clamp((uRet - 0.02 - 0.36 * fract(pS * 7.31)) / 0.5, 0.0, 1.0); k = k * k * (3.0 - 2.0 * k);
    vec3 c1 = vec3(mix(pP.x, uMouth.x, 0.55), 0.35 + 0.5 * pP.y, max(0.16, pP.z * 0.45));
    vec3 m1 = uMouth + vec3((fract(pS * 3.7) - 0.5) * 0.1, 0.0, 0.0);
    pP = mix(mix(pP, c1, k), mix(c1, m1, k), k);
    float lift = pOn * smoothstep(0.0, 0.16, k) * (1.0 - smoothstep(0.82, 1.0, k));
    pA = pHaze ? pA * (1.0 - k) : max(pA * (1.0 - smoothstep(0.82, 1.0, k)), lift);
  }
  vec3 pTx = vec3(uAx.x, 0.0, uAx.y), pNx = vec3(uAx.z, 0.0, uAx.w);
  vec4 mvPosition = viewMatrix * vec4(uO + pTx * pP.x + pNx * pP.z + vec3(0.0, pP.y, 0.0), 1.0);
  // a flick lies along the way it was thrown, and turns slowly as it hangs
  vec2 pV = (viewMatrix * vec4(pTx * pD.x + pNx * pD.y + vec3(0.0, 0.6 * aB.z / max(aB.y, 0.08), 0.0), 0.0)).xy;
  float pAng = atan(pV.y, pV.x + 1.0e-4) + uSpin * aC.y * (1.8 * (1.0 - exp(-pT / 2.0)) + 0.12 * pT);
  vec2 pC = position.xy * aB.w * pGrow * vec2(1.0, aC.z) * step(0.003, pA);
  mvPosition.xy += vec2(pC.x * cos(pAng) - pC.y * sin(pAng), pC.x * sin(pAng) + pC.y * cos(pAng));
  gl_Position = projectionMatrix * mvPosition;
  vPow = pA; vLit = mix(0.78, 0.97, clamp(pP.y / 0.7, 0.0, 1.0));                     // (the light is from above: what is high is in it)
`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vPow, vLit;')
        .replace('#include <map_fragment>', '  { vec4 pTx = texture2D(map, vMapUv); diffuseColor.rgb *= pTx.rgb * vLit; diffuseColor.a *= pTx.a * vPow; if (diffuseColor.a < 0.004) discard; }');
    };
    cm.customProgramCacheKey = () => 'morisot-powder';
    this.cloud = new THREE.Mesh(cg, cm); this.cloud.renderOrder = 6; L.add(this.cloud);

    // ---------------------------------------------------------- the dusting on the floor: painted once, stroke by stroke
    // Two pictures of the same strokes: their colour (and where there is paint at all), and WHEN each one comes down
    // (0..1 of the settling; nearest the fall first), so the floor is dusted a stroke at a time, and thins to nothing
    // at a broken edge. Feathered out from where the puff fell, the way the powder flew.
    const TW = 1024, TH = 640, px = TW / PATCH[2];
    const mk = () => { const c = document.createElement('canvas'); c.width = TW; c.height = TH; const g = c.getContext('2d', { willReadFrequently: true }); g.lineCap = 'round'; return g; };
    const gc = mk(), gw = mk(), tone = new THREE.Color(), hsl = {};
    gw.fillStyle = '#000'; gw.fillRect(0, 0, TW, TH);
    const feather = (x, y, a, len, wid, hex, when, n) => {
      const ca = Math.cos(a), sa = Math.sin(a), bend = (R() - 0.5) * len * 0.32, wv = Math.max(4, Math.round(when * 255));
      for (let k = 0; k < n; k++) {
        const o = (R() - 0.5) * wid, t0 = -0.5 + R() * 0.3, t1 = 0.5 - R() * 0.3, lw = 0.9 + R() * 1.6;
        tone.set(hex).getHSL(hsl); tone.setHSL(hsl.h, hsl.s, clamp01(hsl.l + (R() - 0.42) * 0.11));
        for (const [g, style, w] of [[gc, `rgba(${Math.round(tone.r * 255)},${Math.round(tone.g * 255)},${Math.round(tone.b * 255)},${(0.36 + 0.44 * R()).toFixed(2)})`, lw], [gw, `rgb(${wv},${wv},${wv})`, lw + 1.6]]) {
          g.strokeStyle = style; g.lineWidth = w; g.beginPath();
          for (let s = 0; s <= 6; s++) { const t = lerp(t0, t1, s / 6), lx = t * len, ly = (o + bend) * (1 - 4 * t * t) + o * 0.5; const X = x + lx * ca - ly * sa, Y = y + lx * sa + ly * ca; if (s) g.lineTo(X, Y); else g.moveTo(X, Y); }
          g.stroke();
        }
      }
    };
    const sx = u => (u - PATCH[0]) * px, sy = o => (o - PATCH[1]) * px, hexOf = c => '#' + c.getHexString();
    const cT = TONES.map(([h, w]) => [hexOf(col(h)), w]), cW = WHITES.map(([h, w]) => [hexOf(col(h)), w]);
    // (flung out in a few long tongues and many short ones, as a pouf of powder goes)
    const tongue = th => 0.5 + 0.5 * Math.sin(th * 5 + 1.3) * Math.sin(th * 3 + 0.4) + 0.25 * Math.sin(th * 11 + 2);
    for (let i = 0; i < 1900; i++) {
      const th = R() * 6.2832, lobe = clamp01(tongue(th)), rho = Math.pow(R(), 0.7) * (0.46 + 0.54 * lobe), ro = Math.sin(th) < 0 ? 0.5 : 1.22;
      const x = sx(LAND[0] + Math.cos(th) * rho * 1.3), y = sy(LAND[1] + Math.sin(th) * rho * ro);
      if (x < 10 || x > TW - 10 || y < 8 || y > TH - 10 || R() < ease.smooth(ramp(rho, 0.3, 0.98))) continue;                // thinning to nothing
      const len = (0.06 + 0.11 * R()) * px * (0.7 + 0.6 * rho), a = th + (R() < 0.3 ? Math.PI / 2 : 0) + (R() - 0.5) * 1.5;
      feather(x, y, a, len, len * (0.12 + 0.18 * R()), weighted(rho < 0.14 ? cW : cT, R), 0.12 + 0.5 * rho + 0.3 * R(), 4 + Math.floor(R() * 4));
    }
    // the sprays of her wall, lying in the powder: long thin leaves in her blue-greys and mauves, a touch of rose at their tips
    for (const [th, rho] of [[0.5, 0.56], [1.25, 0.62], [2.05, 0.6], [2.75, 0.5]]) {
      const bx = sx(LAND[0] + Math.cos(th) * rho * 1.3), by = sy(LAND[1] + Math.sin(th) * rho * 1.22), dir = th + (R() - 0.5) * 0.8, when = 0.5 + 0.3 * R();
      for (let k = 0; k < 7; k++) {
        const a = dir + (k - 3) * 0.25 + (R() - 0.5) * 0.22, len = (0.1 + 0.08 * R()) * px;
        feather(bx + Math.cos(a) * len * 0.55, by + Math.sin(a) * len * 0.55, a, len, len * 0.13, hexOf(col(['#8ea0b4', '#7e8ba3', '#9d97ad', '#93a6b6', '#a9a6ba'][k % 5], 0.1)), when + 0.02 * k, 4);
        if (k % 3 === 1) feather(bx + Math.cos(a) * len * 1.1, by + Math.sin(a) * len * 1.1, a + 1.2, 0.045 * px, 0.022 * px, hexOf(col(k % 2 ? '#b39092' : '#c4a3a0', 0.1)), when + 0.12, 4);
      }
    }
    // where the puff sat down, and under the rail where the first grains fell: white
    for (let i = 0; i < 26; i++) { const th = R() * 6.2832, d = 0.03 + 0.14 * R(); feather(sx(REST[0] + Math.cos(th) * d), sy(REST[1] + Math.sin(th) * d * 0.9), th + (R() - 0.5), (0.05 + 0.05 * R()) * px, 0.022 * px, weighted(cW, R), 0.16 + 0.12 * R(), 5); }
    for (let i = 0; i < 16; i++) feather(sx(LAND[0] + (R() - 0.5) * 0.14), sy(0.06 + R() * 0.07), R() * 3.14, (0.03 + 0.03 * R()) * px, 0.014 * px, weighted(cW, R), 0.02 + 0.06 * R(), 4);
    const ci = gc.getImageData(0, 0, TW, TH), wi = gw.getImageData(0, 0, TW, TH), base = col('#d8d6d3');
    for (let i = 0; i < ci.data.length; i += 4) if (ci.data[i + 3] === 0) { ci.data[i] = base.r * 255; ci.data[i + 1] = base.g * 255; ci.data[i + 2] = base.b * 255; }
    this.tDust = dataTex(ci, true); this.tWhen = dataTex(wi, false);
    // where the toy has driven: its tracks in the powder (drawn as it goes; wiped at each new show)
    this.wearG = document.createElement('canvas'); this.wearG.width = 256; this.wearG.height = 160;
    this.wear = this.wearG.getContext('2d'); this.wear.lineCap = 'round';
    this.tWear = new THREE.CanvasTexture(this.wearG); this.tWear.flipY = false; this.tWear.minFilter = this.tWear.magFilter = THREE.LinearFilter; this.tWear.generateMipmaps = false;
    const fu = this.fu = {
      tDust: { value: this.tDust }, tWhen: { value: this.tWhen }, tWear: { value: this.tWear }, uO: { value: O.clone() }, uAx: { value: ax },
      uPatch: { value: new THREE.Vector4(...PATCH) }, uDust: { value: new THREE.Vector3(0, 0, 0) },       // how far it has settled, how far it has lifted again, the light
      uSh: { value: new THREE.Vector4(0, 0, 0.1, 0) },                                                   // the puff's shadow: where, how wide, how dark
      uPat: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },                   // where the puff has patted down since: u, out, radius, how much
      uMid: { value: new THREE.Vector2(...LAND) }, uSilver: { value: col('#aab0c4', 0.1) },
    };
    const fm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
    fm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, fu);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D tDust, tWhen, tWear; uniform vec3 uO, uDust, uSilver; uniform vec4 uAx, uPatch, uSh, uPat[3]; uniform vec2 uMid;
vec3 dustC; float dustA;`)
        .replace('#include <map_fragment>', /* glsl */`#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz, q = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw)), uv = (q - uPatch.xy) / uPatch.zw;
  vec4 dc = texture2D(tDust, uv); float wn = texture2D(tWhen, uv).r;
  // a stroke lies there once the powder has had time to come down that far; and lifts again, the furthest first
  float a = 0.85 * dc.a * step(0.012, wn) * smoothstep(wn - 0.05, wn + 0.03, uDust.x) * (1.0 - smoothstep(0.9 - wn, 1.02 - wn, uDust.y * 1.1));
  vec3 c = dc.rgb;
  // and under the strokes the fine powder itself: a soft bloom of the same paint, thickest where they are thickest
  vec4 vc = texture2D(tDust, uv, 3.6); float rn = length((q - uMid) / vec2(1.3, 1.22)), vw = 0.1 + 0.6 * rn;
  float veil = min(0.62, vc.a * 1.15) * smoothstep(vw - 0.1, vw + 0.1, uDust.x) * (1.0 - smoothstep(0.85 - vw, 1.05 - vw, uDust.y * 1.1));
  { float na = a + veil * (1.0 - a); c = (c * a + vc.rgb * veil * (1.0 - a)) / max(na, 1.0e-4); a = na; }
  // where the puff has patted down since: a small print of the same strokes
  for (int i = 0; i < 3; i++) {
    vec4 p = uPat[i]; vec2 r = (q - p.xy) / p.z; float rr = length(r);
    if (p.w > 0.001 && rr < 1.0) {
      vec4 pc = texture2D(tDust, (uMid + r * 0.3 - uPatch.xy) / uPatch.zw);
      float pa = pc.a * p.w * (1.0 - smoothstep(0.5, 1.0, rr)) * (1.0 - uDust.y), na = pa + a * (1.0 - pa);
      c = (pc.rgb * 1.04 * pa + c * a * (1.0 - pa)) / max(na, 1.0e-4); a = na;
    }
  }
  a *= 1.0 - 0.9 * texture2D(tWear, uv).r;                                           // the toy's tracks
  // the light the powder hangs in, lying on the floor under it; and the puff's shadow
  vec2 lr = (q - uMid - vec2(0.0, 0.18)) / vec2(1.15, 0.95); float lg = uDust.z * exp(-dot(lr, lr) * 1.7);
  float sh = uSh.w * (1.0 - smoothstep(uSh.z * 0.35, uSh.z, length(q - uSh.xy)));
  dustC = (c * (0.8 + 0.24 * lg) * a + uSilver * lg * 0.085) * (1.0 - 0.55 * sh); dustA = a + (1.0 - a) * 0.5 * sh;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = dustC; diffuseColor.a = dustA;\n#include <opaque_fragment>');
    };
    fm.customProgramCacheKey = () => 'morisot-dusting';
    {
      const f = (u, o) => L.floor(u, o).setY(L.y + 0.012), q = [], a = f(PATCH[0], PATCH[1] + PATCH[3]), b = f(PATCH[0] + PATCH[2], PATCH[1] + PATCH[3]), c = f(PATCH[0] + PATCH[2], PATCH[1]), d = f(PATCH[0], PATCH[1]);
      for (const p of [a, b, c, a, c, d]) q.push(p.x, p.y, p.z);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(q, 3)); g.computeVertexNormals();
      this.ground = new THREE.Mesh(g, fm); this.ground.renderOrder = 5; L.add(this.ground);
    }

    // ---------------------------------------------------------- the puff: a soft body under a deep shell of down
    // (white where the light falls, her greys under it; an ivory button on top, so you can see it turn over)
    {
      const tex = canvasTexture(128, 128, (g, W, H) => {
        const img = g.createImageData(W, H), d = img.data, r = rng(41);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          if (x >= 64) { d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = 255; continue; }
          const u = (x + 0.5) / 64 * 2 - 1, v = (y + 0.5) / H * 2 - 1, comb = 0.5 + 0.5 * Math.sin(u * 26 + Math.sin(v * 5) * 1.5), rr = Math.hypot(u / (0.92 + 0.06 * Math.sin(v * 9)), v / 0.96);
          d[i] = d[i + 1] = d[i + 2] = 226 + 26 * comb; d[i + 3] = Math.max(0, Math.min(255, ((1 - rr) * 2.6 + (r() - 0.5) * 0.9 + (comb - 0.5) * 0.9 * Math.max(0, rr - 0.45)) * 255));      // (a soft round tuft, fine and ragged at its edge, like down)
        }
        g.putImageData(img, 0, 0);
      });
      const mat = new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, alphaTest: 0.5, roughness: 0.9, emissive: 0xffffff, emissiveIntensity: 0.8, side: THREE.DoubleSide });
      mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= diffuseColor.rgb;'); };
      mat.customProgramCacheKey = () => 'morisot-puff';
      const V3 = THREE.Vector3, P3 = [], N3 = [], C3 = [], U2 = [];
      const tri = (a, b, c, n, colr, uvs) => { [a, b, c].forEach((p, k) => { P3.push(p.x, p.y, p.z); const nn = Array.isArray(n) ? n[k] : n; N3.push(nn.x, nn.y, nn.z); C3.push(colr.r, colr.g, colr.b); U2.push(uvs[k][0], uvs[k][1]); }); };
      const plain = [[0.8, 0.5], [0.8, 0.5], [0.8, 0.5]], light = new V3(-0.35, 0.8, 0.45).normalize();
      const down = ['#b4b5b8', '#c4c4c5', '#d4d2d0', '#e3e1dd', '#eeedea', '#f5f4f1', '#f8f7f5'].map(h => col(h, 0.06));
      const shade = (n, j = 0) => down[Math.max(0, Math.min(down.length - 1, Math.floor((n.dot(light) * 0.5 + 0.5) * down.length + j)))];
      // the body: an ellipsoid, its normals true (no facets)
      const ball = new THREE.IcosahedronGeometry(1, 3).toNonIndexed(), bp = ball.attributes.position, a = new V3(), n = [new V3(), new V3(), new V3()], p = [new V3(), new V3(), new V3()];
      for (let f = 0; f < bp.count; f += 3) {
        for (let k = 0; k < 3; k++) { a.fromBufferAttribute(bp, f + k); p[k].set(a.x * PR * 0.9, a.y * PH * 0.9, a.z * PR * 0.9); n[k].set(a.x / PR, a.y / PH, a.z / PR).normalize(); }
        tri(p[0], p[1], p[2], n, shade(n[0]), plain);
      }
      // the down: dabs standing off it all round, longer at the rim
      for (let i = 0; i < 340; i++) {
        const z = R() * 2 - 1, th = R() * 6.2832, s = Math.sqrt(1 - z * z), d = new V3(s * Math.cos(th), z, s * Math.sin(th));
        const pt = new V3(d.x * PR * 0.9, d.y * PH * 0.9, d.z * PR * 0.9), nm = new V3(d.x / PR, d.y / PH, d.z / PR).normalize();
        const up = new V3(R() - 0.5, R() - 0.5, R() - 0.5).addScaledVector(nm, 0.9).normalize(), u = up.clone().addScaledVector(nm, -up.dot(nm)).normalize(), sd = new V3().crossVectors(nm, u).normalize();
        const rim = 1 - Math.abs(d.y), l = 0.034 + 0.022 * R() + 0.01 * rim, w = 0.036 + 0.024 * R(), lift = 0.12 + 0.28 * R() + 0.2 * rim;
        const lo = pt.clone().addScaledVector(nm, 0.002).addScaledVector(u, -l * 0.4), hi = lo.clone().addScaledVector(u, l).addScaledVector(nm, lift * l);
        const q0 = lo.clone().addScaledVector(sd, -w / 2), q1 = lo.clone().addScaledVector(sd, w / 2), q2 = hi.clone().addScaledVector(sd, w / 2), q3 = hi.clone().addScaledVector(sd, -w / 2), c = shade(nm, (R() - 0.5) * 0.8);
        tri(q0, q1, q2, nm, c, [[0, 0], [0.5, 0], [0.5, 1]]); tri(q0, q2, q3, nm, c, [[0, 0], [0.5, 1], [0, 1]]);
      }
      // the ivory button
      const prof = [[0, 0], [0.017, 0], [0.021, 0.007], [0.016, 0.017], [0.008, 0.022], [0, 0.023]], seg = 14, ivory = [col('#b9a98c', 0.1), col('#d9cdb2', 0.1), col('#efe6d0', 0.1)], y0 = PH * 0.9 - 0.004;
      for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < seg; j++) {
        const pt = (k, m) => new V3(prof[k][0] * Math.cos(m / seg * 6.2832), y0 + prof[k][1], prof[k][0] * Math.sin(m / seg * 6.2832));
        const nr = (k, m) => { const dr = prof[Math.min(prof.length - 1, k + 1)][0] - prof[Math.max(0, k - 1)][0], dy = prof[Math.min(prof.length - 1, k + 1)][1] - prof[Math.max(0, k - 1)][1]; return new V3(dy * Math.cos(m / seg * 6.2832), -dr, dy * Math.sin(m / seg * 6.2832)).normalize(); };
        const A = pt(i, j), B = pt(i + 1, j), Cc = pt(i + 1, j + 1), D = pt(i, j + 1), nA = nr(i, j), nB = nr(i + 1, j), nC = nr(i + 1, j + 1), nD = nr(i, j + 1), k = nA.dot(light), c = ivory[k > 0.55 ? 2 : k > 0 ? 1 : 0];
        tri(A, B, Cc, [nA, nB, nC], c, plain); tri(A, Cc, D, [nA, nC, nD], c, plain);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N3, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C3, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U2, 2));
      this.puff = new THREE.Mesh(g, mat); L.add(this.puff);
    }
    this.T = 0; this.off = 0; this.pose = { u: 0, h: 0, out: 0, pitch: 0, roll: 0, sy: 1, show: false };
    this.hide();
  },

  hide() {
    this.cloud.visible = false; this.ground.visible = false; this.puff.visible = false;
    this.fu.uDust.value.set(0, 0, 0); this.fu.uSh.value.w = 0; for (const p of this.fu.uPat.value) p.w = 0;
    for (const b of this.cu.uB.value) b.set(0, 0, 0, 0); this.cu.uRet.value = 0;
  },
  wipe() { this.wear.fillStyle = '#000'; this.wear.fillRect(0, 0, 256, 160); this.tWear.needsUpdate = true; },

  // The quiet band: Fauré's piano (its repeated chords, its bass) and the voice; and the powder's own small sounds.
  band(L) {
    const s = score(L), calm = L.calm;
    const voice = { type: 'sine', vol: 0.026, attack: 0.06, over: 2, overVol: 0.16 }, chord = { type: 'sine', vol: 0.0062, attack: 0.035 }, low = { type: 'sine', vol: 0.017, attack: 0.07, over: 2, overVol: 0.4 };
    CHORDS.forEach((bar, i) => { let e = 0; for (const [notes, n] of bar) for (let k = 0; k < n; k++, e++) for (const m of notes) s.note(T_M + (i * 3 + e * 0.5) * BEAT, hz(m), 0.52, chord); });
    for (const [k, m, d] of BASS) s.note(T_M + k * BEAT, hz(m), d * BEAT * 1.02, low);
    for (const [k, m, d] of VOICE) s.note(T_LAND + k * BEAT, hz(m), Math.max(0.3, d * BEAT * 1.06), voice);
    s.hit(0.2, { d: 1.9, vol: 0.0035, hp: 5200, attack: 0.5 });                                          // the first grains, sifting
    s.hit(T_LAND, { d: 0.2, vol: calm ? 0.014 : 0.026, lp: 240, attack: calm ? 0.04 : 0.006 });          // down: soft, no knock
    s.hit(T_LAND + 0.01, { d: 0.9, vol: calm ? 0.009 : 0.014, bp: 1500, q: 0.5, attack: 0.04 });         // pouf
    s.hit(T_HOP, { d: 0.5, vol: 0.006, bp: 1700, q: 0.5, attack: 0.03 });
    return s.done();
  },
  pouf(L, k = 1) { if (L.quiet) return; const v = L.voice(); noise(v, 0, { d: 0.14, vol: 0.012 * k, lp: 260, attack: 0.01 }); noise(v, 0.01, { d: 0.5, vol: 0.008 * k, bp: 1600, q: 0.5, attack: 0.03 }); },

  start(L, resumed) {
    if (resumed) { this.off = this.T - L.t; if (this.sc) this.sc.from(1e9); return; }      // (it was still out: carry on from where it is, without the music)
    this.hide(); this.wipe();
    this.T = 0; this.off = 0; this.pu = { u: REST[0], out: REST[1] }; this.hop = null; this.landT = -9; this.bi = 0; this.pi = 0; this.pats = [null, null, null]; this.kick = 0; this.last = null; this.ret0 = null;
    this.cu.uSpin.value = L.calm ? 0.5 : 1;
    const B = this.cu.uB.value;
    B[0].set(LAND[0], 0.03, 0.08, 1); B[1].set(LAND[0], LAND[1], T_LAND, 1); B[2].set(REST[0], REST[1], T_HOP, 1);
    this.sc = this.band(L); this.sc.from(0);
    if (!this.told && !L.quiet) { this.told = true; L.k.say('The powder puff tips off the dressing table. The powder comes up in brushstrokes.', 4); }
  },
  back(L) { this.ret0 = { ...this.pose }; this.hop = null; },
  end() { this.hide(); },
  reset() { this.told = false; this.hide(); },

  // Where the puff is at clock T, into this.pose: out from under the rail, over the edge, down, one soft hop, at rest.
  fallen(L, T) {
    const o = this.pose, yR = this.yRail; o.show = T >= T_PEEP; o.roll = 0; o.pitch = 0; o.sy = 1; o.u = LAND[0];
    if (T < T_OUT) { const k = ease.inOut(ramp(T, T_PEEP, T_OUT)); o.out = lerp(-L.wall - PR, 0.0, k); o.h = yR; o.sy = 0.84; o.roll = 0.07 * Math.sin(T * 10) * Math.sin(k * Math.PI); }
    else if (T < T_TIP) { const k = ramp(T, T_OUT, T_TIP), kk = k * k; o.out = 0.085 * kk; o.h = yR - 0.03 * kk; o.pitch = 1.25 * kk; o.sy = lerp(0.84, 1, ease.smooth(k)); o.roll = 0.05 * Math.sin(k * 9) * (1 - k); }
    else if (T < T_LAND) {
      const s = ramp(T, T_TIP, T_LAND); o.h = lerp(yR - 0.03, PH, Math.pow(s, 1.75)); o.out = lerp(0.085, LAND[1], Math.pow(s, 1.2));
      o.pitch = lerp(1.25, Math.PI * 2, s); o.roll = 0.16 * Math.sin(s * 5.5); o.u = LAND[0] + 0.02 * Math.sin(s * 6.5); o.sy = 1 + 0.06 * s;
    } else if (T < T_HOP) {
      const k = ramp(T, T_LAND, T_HOP); o.sy = 1 - 0.46 * Math.exp(-k * 9) + 0.07 * Math.sin(Math.PI * k);
      o.h = PH * o.sy + 0.1 * 4 * k * (1 - k); o.u = lerp(LAND[0], REST[0], k); o.out = lerp(LAND[1], REST[1], k); o.pitch = 0.22 * Math.sin(Math.PI * k);
    } else { const x = T - T_HOP; o.sy = 1 - 0.2 * Math.exp(-x * 6) * Math.cos(x * 17); o.h = PH * o.sy; o.u = REST[0]; o.out = REST[1]; o.pitch = 0.1 * (1 - Math.exp(-x * 3)); }
    return o;
  },

  // A small cloud of the toy's own making, and the print it leaves.
  burst(u, out, hard) { this.cu.uB.value[4 + (this.bi++ % 4)].set(u, out, this.T, hard); },
  pat(u, out) { this.pats[this.pi++ % 3] = { u, out, t0: this.T }; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return', U = this.cu, F = this.fu;
    if (showing) this.T = L.t + this.off; else if (!back) this.T += dt;                    // (going back, the clock stands still, and it is all drawn home)
    const T = this.T, Rt = back ? L.ret : 0, o = this.pose;
    U.uT.value = T; U.uRet.value = Rt;
    if (T >= 12) U.uB.value[3].set(LAND[0], 0.03, 12 + Math.floor((T - 12) / 9) * 9, 1);     // a few more grains, now and then

    // ---- the puff
    if (back && this.ret0) {
      // lifted with the powder: up off the floor, turning over, to the rail, and in under it
      const r = this.ret0, k = ease.inOut(ramp(Rt, 0.1, 0.78)), s1 = 1 - k, slide = ease.inOut(ramp(Rt, 0.78, 0.97));
      const cu = lerp(r.u, LAND[0], 0.5), ch = Math.max(r.h, 0.45), co = Math.max(0.2, r.out * 0.55);
      o.u = s1 * s1 * r.u + 2 * s1 * k * cu + k * k * LAND[0]; o.h = s1 * s1 * r.h + 2 * s1 * k * ch + k * k * this.yRail; o.out = s1 * s1 * r.out + 2 * s1 * k * co + k * k * 0.0 - slide * (L.wall + PR + 0.02);
      o.pitch = r.pitch + (L.calm ? 3.1416 : 6.2832) * k; o.roll = r.roll * s1; o.sy = lerp(r.sy, 0.84, ramp(Rt, 0.6, 0.8)); o.show = r.show && Rt < 0.97;
    } else if (!back) {
      this.fallen(L, T);
      if (T > T_REST) {
        const p = this.pu, toy = L.k.G.vehicle, on = toy && toy.group && toy.group.visible && Math.abs(toy.pos.y - L.y) < 0.4;
        const tq = on ? L.local(toy.pos.x, toy.pos.z) : null;
        // the toy nudges it: it hops out of the way, softly, and pats down where it lands (never off its own bit of floor)
        if (tq && !this.hop && Math.hypot(tq.u - p.u, tq.out - p.out) < (toy.radius || 0.19) + PR + 0.02) {
          let du = p.u - tq.u, dout = p.out - tq.out; const l = Math.hypot(du, dout) || 1, sp = Math.hypot(toy.vel.x, toy.vel.z), far = 0.3 + Math.min(0.3, sp * 0.15);
          let tu = Math.max(-1.1, Math.min(1.1, p.u + du / l * far)), to = Math.max(0.3, Math.min(1.45, p.out + dout / l * far));
          if (Math.hypot(tu - p.u, to - p.out) < 0.18) { tu = p.u + (LAND[0] - p.u) * 0.6 + (du / l) * 0.1; to = p.out + (0.8 - p.out) * 0.6; }      // (cornered: over towards the middle)
          this.hop = { t0: T, fu: p.u, fo: p.out, tu, to, h: 0.12 + Math.min(0.08, sp * 0.04) };
          this.pouf(L, 0.5);
        }
        if (this.hop) {
          const hp = this.hop, k = clamp01((T - hp.t0) / 0.5);
          p.u = lerp(hp.fu, hp.tu, ease.smooth(k)); p.out = lerp(hp.fo, hp.to, ease.smooth(k));
          o.sy = 1 - 0.25 * Math.exp(-k * 10) + 0.08 * Math.sin(Math.PI * k); o.h = PH * o.sy + hp.h * 4 * k * (1 - k); o.pitch = 0.1 + 0.3 * Math.sin(Math.PI * k); o.roll = 0.2 * Math.sin(Math.PI * 2 * k);
          if (k >= 1) { this.hop = null; this.landT = T; this.burst(p.u, p.out, 1); this.pat(p.u, p.out); this.pouf(L, 0.8); }
        } else { const x = T - this.landT; o.sy = 1 - 0.2 * Math.exp(-x * 6) * Math.cos(x * 17); o.h = PH * o.sy; o.pitch = 0.1; o.roll = 0; }
        o.u = p.u; o.out = p.out;
        // its wheels in the dusting: two tracks, and a little powder kicked up behind
        if (tq && toy.kind !== 'drone' && tq.u > PATCH[0] && tq.u < PATCH[0] + PATCH[2] && tq.out > PATCH[1] && tq.out < PATCH[1] + PATCH[3]) {
          const w = this.wear, kx = 256 / PATCH[2], x = (tq.u - PATCH[0]) * kx, y = (tq.out - PATCH[1]) * kx, la = this.last;
          if (la) {
            const dx = x - la.x, dy = y - la.y, d = Math.hypot(dx, dy);
            if (d > 0.6 && d < 40) {
              const ox = -dy / d * 0.075 * kx, oy = dx / d * 0.075 * kx; w.strokeStyle = 'rgba(255,255,255,0.9)'; w.lineWidth = 0.045 * kx;
              for (const sg of [-1, 1]) { w.beginPath(); w.moveTo(la.x + ox * sg, la.y + oy * sg); w.lineTo(x + ox * sg, y + oy * sg); w.stroke(); }
              this.tWear.needsUpdate = true; this.last = { x, y };
              this.kick += d / kx;
              if (this.kick > 0.34 && F.uDust.value.x > 0.3 && Math.hypot((tq.u - LAND[0]) / 1.0, (tq.out - LAND[1] - 0.1) / 0.95) < 1) { this.kick = 0; this.burst(tq.u, tq.out, 0.55); }
            } else if (d >= 40) this.last = { x, y };
          } else this.last = { x, y };
        } else this.last = null;
      }
    }
    const pf = this.puff; pf.visible = !!o.show;
    if (o.show) {
      L.floor(o.u, o.out, pf.position); pf.position.y = L.y + o.h;
      pf.quaternion.setFromEuler(this.e.set(o.pitch, L.yawOut, o.roll, 'YXZ'));
      const sx = 1 / Math.sqrt(Math.max(0.3, o.sy)); pf.scale.set(sx, o.sy, sx);
    }
    F.uSh.value.set(o.u, o.out, PR * (1.3 + 1.6 * clamp01((o.h - PH) / 0.5)), o.show && o.out > 0.02 ? 0.62 * clamp01(1 - (o.h - PH) / 0.55) * (1 - ramp(Rt, 0.1, 0.4)) : 0);

    // ---- the dusting: it settles, stroke by stroke; the light it hangs in; and all of it lifts again when it goes home
    const settle = T < 1.3 ? 0 : T < T_LAND ? 0.09 * ramp(T, 1.3, T_LAND) : 0.09 + 0.91 * (q => q * (1.6 - 0.6 * q))(ramp(T, T_LAND + 0.15, T_LAND + 7));
    F.uDust.value.set(settle, ease.inOut(ramp(Rt, 0, 0.6)), ease.smooth(ramp(T, T_LAND - 0.2, T_LAND + 1.4)) * (1 - ease.smooth(ramp(Rt, 0.2, 0.9))));
    this.pats.forEach((p, i) => { if (p) F.uPat.value[i].set(p.u, p.out, 0.27, 0.9 * ease.smooth(ramp(T - p.t0, 0.05, 0.6))); else F.uPat.value[i].w = 0; });
    this.cloud.visible = this.ground.visible = true;

    if (showing && this.sc) this.sc.play(L.t);
    L.voice().place();
  },
});
