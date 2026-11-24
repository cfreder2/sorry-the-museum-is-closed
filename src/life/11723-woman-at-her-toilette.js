// Berthe Morisot, Woman at Her Toilette (1875–80), Gallery 201. The word: powder.
//
// A dressing table after a ball: a tilted glass that gives back only paint, a crystal jar with a rosebud, two cream
// roses, and in its dish a swansdown powder puff; and the whole picture is laid in as if with that puff, in soft,
// feathery touches of silver white, grey, lavender, blue and rose that never quite settle into things. (Of her pictures
// in the 1880 exhibition, where this one hung, Charles Ephrussi wrote that she grinds flower petals onto her palette
// and spreads them on the canvas in airy touches.) So what comes out of the picture is the powder, and the powder is
// her paint.
//
// Look, and a few grains sift down from under the frame. The puff comes out after them from under the bottom rail,
// straight below its place in the picture, its slim ivory handle first (the pale stick that lies beside it on the
// table); it overhangs, teeters twice, and goes over, and falls slowly, turning over once, as a thing of down falls.
// Where it lands, on the first note of the voice, the powder goes up in a soft breath. And then, in the hanging
// powder, the picture paints itself without her: stroke after stroke is brushed into the air, each from one end to
// the other, in runs of her hatching, the brush going there and back: the silver and lilac of the wall; on the gold
// edge of the table the crystal jar in cold upright strokes, with its rosebud, and the two cream roses beside it; and
// the spray of her wall, leaf by leaf, blue and slate and mauve, with its touches of rose and green; last of all the
// glints on the glass. It is done as the voice reaches its long E flat, hangs there, a metre across, while the note
// is held, and then lets go: every stroke comes loose, turns over and falls, and lies on the floor as a thin dusting
// in her strokes, feathered out from where the puff fell, with the sprays in it. The puff hops once, softly, and lies
// along the wall. While you keep looking it pats down again somewhere else every so often, and one spray of the wall
// is brushed in over it and falls. The music is the opening of Fauré's "Après un rêve" (1877, the picture's own
// years, in Paris), very quietly: a bar of the piano's repeated chords while the puff comes out, then the voice, on a sine.
//
// Nothing is solid. While the toy is near, the powder stays out after the look: the toy leaves its tracks in the
// dusting and kicks a little up as it goes, and if it nudges the puff, the puff hops out of its way and pats down
// another small cloud. Then the powder lifts off the floor and is drawn back up under the frame, the puff with it.
// With "Reduce motion and flashing" on, the powder goes up more slowly, each stroke is brushed in more slowly, loose
// strokes turn at half the speed, the landing is softer and the later pats come less often; nothing here flashes.
//
// Never over a picture: the passage hangs below the height the look camera stands at, so from there it is under every
// frame (lower still on the left, where the next picture hangs lower); from anywhere else the guard dissolves whatever
// would cross a canvas.
//
// What it does not do: the woman does not come out, in any form (no figure, no hand to hold the puff or the brush, no
// mirror and no reflection), and nothing sets the player to watching her, because hers is a private moment; the show
// is the room's air, the things on her table and the painter's touch, not her.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, rng, canvasTexture } from '../paintlife.js';
import { score, noise, hz } from './stagecraft.js';

const BEAT = 60 / 66;                                     // Andantino
const T_M = 0.3, T_LAND = T_M + 3 * BEAT;                 // the piano's first bar; the puff lands on the voice's first note
const T_PEEP = 0.45, T_OUT = 1.3, T_TIP = 2.2;             // it edges out from under the rail; overhangs and tips; lets go
const T_HOP = T_LAND + 0.52, T_REST = T_HOP + 0.9;        // down again from its one soft hop; at rest
const T_PAT = 13.5, SPOTS = [[0.16, 0.74], [-0.42, 0.7], [-0.18, 0.62]];      // while you keep looking it pats down again now and then: when first, and where in turn
const Y_OUT = 2.54, Y_REST = 1.87;                         // the puff's turn: its handle out into the room and a little aside as it comes; along the wall as it lies
const HOLD = 3.95;                                        // the passage hangs until this long after the fall (the end of the voice's held E flat)
const LAND = [-0.26, 0.46], REST = [-0.18, 0.62];         // where it lands (straight under its place in the picture) and comes to rest (u along the wall, out from it)
const PR = 0.1, PH = PR * 0.76;                           // the puff: its radius and half its height (larger than life: the toy's size)
const PATCH = [-1.4, 0.02, 2.8, 1.75];                    // the dusted floor: u0, out0, width, depth (m)
const NB = 8;                                             // clouds: 0 the sift, 1 the fall, 2 the hop, 3 a later pat, 4 to 7 the toy's
const TOP = 1.0;                                          // loose powder stays under this (m): below the pictures from where you look

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
  // (a small work, hung high: the camera stands a little under its bottom rail, so everything below the camera's own
  // height is under every picture from there, wherever it is in the room)
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
      const flick = (len, wid, bend, hook, n, lw = 1, body = 0) => {
        if (body) { g.fillStyle = `rgba(232,232,232,${body})`; g.beginPath(); g.ellipse(0, bend * 0.6, len * 0.43, wid * 0.4, 0, 0, 7); g.fill(); }      // (the paint the brush was loaded with, under its streaks)
        for (let k = 0; k < n; k++) {
          const o = ((k + 0.5) / n - 0.5 + (r() - 0.5) * 0.5 / n) * wid, thin = 1 - Math.abs(o) / (wid * 0.5 + 0.01) * 0.3, x0 = -len / 2 * thin + r() * len * 0.3, x1 = len / 2 * thin - r() * len * 0.3, v = 205 + Math.floor(r() * 50);
          const y = x => { const t = 2 * x / len; return bend * (1 - t * t) + hook * Math.max(0, t) ** 3 + o * (1 - 0.45 * t * t); };
          g.strokeStyle = `rgba(${v},${v},${v},${0.5 + 0.45 * r()})`; g.lineWidth = (1.6 + r() * 2.2) * lw;
          g.beginPath(); for (let s = 0; s <= 8; s++) { const x = x0 + (x1 - x0) * s / 8; if (s) g.lineTo(x, y(x)); else g.moveTo(x, y(x)); } g.stroke();
        }
      };
      cell(0, () => flick(110, 30, 3, 0, 7, 1, 0.56)); cell(1, () => flick(106, 28, 12, 0, 6, 1, 0.5)); cell(2, () => flick(102, 24, 4, -16, 6, 1, 0.42));
      cell(3, () => flick(78, 44, 2, 0, 9, 1, 0.6)); cell(4, () => flick(112, 12, -6, 8, 4, 1.25));
      cell(5, () => { for (let k = 0; k < 17; k++) { g.save(); g.translate((r() - 0.5) * 92, (r() - 0.5) * 92); g.rotate((r() - 0.5) * 1.6); flick(6 + r() * 9, 3, 0, 0, 2, 0.6); g.restore(); } });
      cell(7, () => { g.translate(0, -13); flick(100, 10, 5, 0, 3); g.translate(6, 26); flick(84, 10, -4, 0, 3); });
      const img = g.getImageData(0, 0, W, H), d = img.data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 0) d[i] = d[i + 1] = d[i + 2] = 232;
      // (cell 6: a breath of powder: soft, and grainy, as powder is)
      for (let y = 128; y < 256; y++) for (let x = 256; x < 384; x++) { const i = (y * W + x) * 4, rr = Math.hypot(x - 320, y - 192) / 62, f = Math.max(0, 1 - rr); d[i] = d[i + 1] = d[i + 2] = 236; d[i + 3] = 255 * Math.pow(f, 1.4) * (0.45 + 0.55 * r()); }
      return dataTex(img, false);
    })();

    // ---------------------------------------------------------- the powder in the air: every mark a function of the clock
    // Each mark belongs to a cloud (uB: where on the floor, when, how hard). Loose powder is thrown out along the floor
    // and up, slowed at once by the air, hangs, turns, and comes down to lie; a stroke of a passage is brushed in where
    // it belongs, hangs, and then falls like the rest. One mesh, all of it worked out in the shader.
    const Q = [];
    const mark = (b, o) => Q.push({ b, delay: 0, hang: 0.4, fall: 0.1, ang: 0, reach: 0.2, rise: 0.2, len: 0.14, asp: 1, seed: R(), spin: (R() - 0.5) * 2.2, kind: 0, cell: [0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 7, 7][Math.floor(R() * 14)], c: col(weighted(AIR, R)), tx: 0, ty: 0, tz: 0, ta: 0, ...o });
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
    const breath = (b, n, far, big) => { for (let i = 0; i < n; i++) mark(b, { kind: 1, cell: 6, ang: Math.PI * (0.04 + 0.92 * R()), reach: (0.08 + 0.62 * R()) * far, rise: (0.06 + 0.5 * R()) * far, hang: 9, fall: 0, len: (0.42 + 0.4 * R()) * big, spin: 0, c: col(['#d6d4dc', '#dcd9d5', '#cfd3da'][i % 3]) }); };
    // A stroke of a passage, brushed into the air from one end to the other: where (along the wall and up, from where its
    // cloud began), the way it runs, how long it is, and when it is laid; and then when it comes loose and falls.
    const C4 = h => (typeof h === 'string' ? col(h, 0.08) : h);
    const laid = (b, X, Y, ang, len, when, c, o = {}) => mark(b, { kind: 4, delay: when, hang: (o.loose || HOLD) + 0.85 * R() - when, fall: 0.24 + 0.26 * R(), ang: Math.PI * (0.08 + 0.84 * R()), reach: 0.05 + 0.28 * R(), len, cell: 0, c: C4(c), tx: X, ty: Y, tz: (o.z == null ? 0.14 : o.z) + (R() - 0.5) * 0.07, ta: ang, spin: (R() - 0.5) * 2.6, ...o });
    const DEG = Math.PI / 180;
    // a run of her hatching: parallel strokes laid side by side, the brush going there and back
    const hatch = (b, gx, gy, a0, n, t0, hex, o = {}) => {
      const base = C4(hex), sp = 0.034 + 0.012 * R();
      for (let k = 0; k < n; k++) {
        const off = (k - (n - 1) / 2) * sp + (R() - 0.5) * sp * 0.7, len = (0.13 + 0.16 * R()) * (o.big || 1), along = (R() - 0.5) * 0.09;
        const x = gx - Math.sin(a0) * off + Math.cos(a0) * along, y = gy + Math.cos(a0) * off + Math.sin(a0) * along, half = Math.abs(Math.sin(a0)) * len * 0.45;
        if (y + half > (o.cap ? o.cap(x) : 9) || y - half < 0.1) continue;
        laid(b, x - (o.org || 0), y, a0 + (k % 2 ? Math.PI : 0) + (R() - 0.5) * 0.3, len, t0 + k * 0.045, base.clone().offsetHSL(0, 0, (R() - 0.5) * 0.07), { cell: [0, 1, 0, 3][k % 4], ...o, asp: (o.asp || 1) * (0.85 + 0.35 * R()) });
      }
    };
    // a fan of long leaves from one point, laid outwards one after another
    const fan = (b, cx, cy, degs, lens, hexes, t0, o = {}) => degs.forEach((d, k) => { const a = d * DEG + (R() - 0.5) * 0.1, len = lens[k % lens.length]; laid(b, cx + Math.cos(a) * len * 0.47 - (o.org || 0), cy + Math.sin(a) * len * 0.47, a, len, t0 + k * 0.04, hexes[k % hexes.length], { cell: [2, 4, 2, 4, 0][k % 5], asp: k % 5 === 4 ? 0.5 : 1.25, ...o }); });
    const LEAF = ['#4f7fae', '#46618a', '#7a6fa6', '#5f8ab5', '#9788b8', '#46618a', '#7a6fa6', '#7f9dbd'], ROSE = ['#c56a78', '#dc9a9e', '#ad5262'], GREEN = ['#7ba583', '#9dba92', '#5f8769'];
    const DIM = [['#a3a1a2', 4], ['#9b97ad', 4], ['#9099a8', 2.5], ['#ada5a8', 2], ['#b1aabf', 2.5]], PALE = [['#e2e0dc', 5], ['#d6d3d0', 3], ['#cdc8d9', 3], ['#d9dde3', 1.5], ['#decfcc', 1]];      // her wall: silver greys and lilacs, and the white scumbled over them

    // ---- 1: where it falls. First the powder itself (its breath, fine grains, a few loose flicks, motes that stay up)...
    breath(1, 16, 1, 1);
    thrown(1, 26, LAND, { cell: 5, big: 1.5 });
    thrown(1, 26, LAND, { high: 0.55 });
    for (let i = 0; i < 8; i++) mark(1, { kind: 2, ang: Math.PI * (0.08 + 0.84 * R()), reach: 0.1 + 0.6 * R(), rise: 0.28 + 0.6 * R(), len: 0.06 + 0.07 * R(), cell: R() < 0.4 ? 3 : 5, c: col(weighted(WHITES, R)) });
    // ...and then, in it, a passage of the picture without her, a metre across, hanging a hand's breadth in front of
    // where the puff fell: the wall's silver hatching; on the gold edge of the table the crystal jar with its rosebud,
    // and the two cream roses; and the spray of her wall, blue and slate and mauve, with its touches of rose.
    // (x along the wall, y up, in metres; lower on the left, where the next picture hangs lower)
    {
      const org = LAND[0], cap = x => (x < -0.4 ? 0.9 : 1.08), o1 = { org, cap };
      const when = gy => 0.3 + 0.5 * clamp01((gy - 0.2) / 0.82) + 0.08 * R();
      for (const [gx, gy, a0] of [[-0.6, 0.28, 0.95], [-0.25, 0.25, 1.05], [0.12, 0.26, -0.55], [0.36, 0.3, 0.9], [-0.62, 0.56, 1.3], [-0.4, 0.62, 0.75], [-0.12, 0.56, 0.6], [0.2, 0.52, -0.7], [0.36, 0.6, 1.1], [-0.58, 0.8, 0.8], [-0.25, 0.86, 1.15], [0.1, 0.9, -0.5]])
        hatch(1, gx + (R() - 0.5) * 0.05, gy + (R() - 0.5) * 0.05, a0 + (R() - 0.5) * 0.2, 6, when(gy), weighted(DIM, R), { ...o1, big: 1.2 });
      for (const [gx, gy, a0] of [[0.0, 0.4, 1.0], [0.36, 0.42, 0.8], [-0.03, 0.76, -0.65], [0.36, 0.76, 0.95], [-0.28, 0.98, 0.7]])
        hatch(1, gx + (R() - 0.5) * 0.05, gy + (R() - 0.5) * 0.05, a0 + (R() - 0.5) * 0.2, 5, when(gy) + 0.3, weighted(PALE, R), { ...o1, asp: 0.7 });
      const at = (X, Y, ang, len, when, c, o) => laid(1, X - org, Y, ang, len, when, c, { loose: HOLD + 0.2, ...o });
      // the edge of the table: gold, a touch of red at its end
      [[-0.62, '#c9963f'], [-0.44, '#b57d33'], [-0.27, '#d9aa58']].forEach(([x, c], i) => at(x, 0.405, 0.02, 0.27, 0.92 + i * 0.06, c, { cell: 4, asp: 1.9 }));
      at(-0.735, 0.41, 0.3, 0.07, 1.1, '#a9493d', { cell: 3 });
      // the jar: cold upright strokes of glass, its foot, its lid and knob
      const jx = -0.43;
      for (let i = 0; i < 7; i++) at(jx + (i - 3) * 0.031, 0.555 + (i % 2) * 0.008, (i % 2 ? -1 : 1) * Math.PI / 2, 0.27 - Math.abs(i - 3) * 0.008, 1.05 + i * 0.04, i === 0 || i === 6 ? '#63778c' : ['#b5c2cc', '#e1e8ec', '#c3ced6', '#eef2f3'][i % 4], { cell: 4, asp: i === 0 || i === 6 ? 1.3 : 1.7 });
      at(jx, 0.432, 0, 0.21, 1.32, '#6f8296', { cell: 0, asp: 0.45 }); at(jx, 0.697, Math.PI, 0.235, 1.37, '#7f92a5', { cell: 0, asp: 0.5 });
      at(jx - 0.03, 0.737, 0.3, 0.12, 1.42, '#dbe3e8', { cell: 1, asp: 0.7 }); at(jx + 0.035, 0.737, Math.PI - 0.3, 0.12, 1.45, '#93a4b4', { cell: 1, asp: 0.7 }); at(jx, 0.775, Math.PI / 2, 0.06, 1.48, '#c9d4da', { cell: 3 });
      // the two cream roses lying by it
      [[-0.655, 0.47], [-0.555, 0.482]].forEach(([cx, cy], r) => { for (let k = 0; k < 8; k++) { const ph = k / 8 * 6.2832 + r; at(cx + Math.cos(ph) * 0.04, cy + Math.sin(ph) * 0.03, ph + Math.PI / 2, 0.08 + 0.015 * R(), 1.5 + r * 0.16 + k * 0.02, ['#ecdfb8', '#dcc995', '#f3ebd2', '#cdb884'][k % 4], { cell: k % 2 ? 1 : 3, asp: 0.9 }); } at(cx, cy, 0.4, 0.05, 1.68 + r * 0.16, '#c2a875', { cell: 3 }); });
      // the rosebud on the jar, and its leaf
      at(jx + 0.03, 0.815, 0.5, 0.07, 1.68, GREEN[2], { cell: 4, asp: 1.4 }); at(jx - 0.02, 0.81, 2.4, 0.06, 1.7, GREEN[0], { cell: 4, asp: 1.4 });
      at(jx + 0.012, 0.862, 0.9, 0.065, 1.74, '#d98a8c', { cell: 3 }); at(jx - 0.006, 0.848, 2.2, 0.055, 1.77, '#c2686f', { cell: 3 });
      // the spray: its stem, three fans of leaves and a sprig, then the blossoms and the green
      [[0.0, 0.27, 0.03, 0.45], [0.03, 0.45, 0.06, 0.63], [0.06, 0.63, 0.1, 0.82]].forEach(([x0, y0, x1, y1], i) => at((x0 + x1) / 2, (y0 + y1) / 2, Math.atan2(y1 - y0, x1 - x0), Math.hypot(x1 - x0, y1 - y0) * 1.2, 1.0 + i * 0.05, '#56657c', { cell: 4, asp: 1.1 }));
      const os = { org, loose: HOLD + 0.2 };
      fan(1, 0.1, 0.83, [18, 40, 62, 84, 104, 126, 148, 165], [0.2, 0.23, 0.24, 0.2, 0.22, 0.24, 0.21, 0.17], LEAF, 1.15, os);
      fan(1, 0.055, 0.6, [25, 52, 128, 152, -20], [0.19, 0.17, 0.2, 0.18, 0.15], [LEAF[3], '#c0707e', LEAF[1], LEAF[2], LEAF[0]], 1.44, os);
      fan(1, 0.02, 0.4, [35, 140, 160], [0.15, 0.16, 0.13], [LEAF[4], LEAF[3], GREEN[0]], 1.6, os);
      at(0.26, 0.45, 60 * DEG, 0.17, 1.6, '#56657c', { cell: 4 }); fan(1, 0.3, 0.52, [30, 70, 110], [0.13, 0.14, 0.12], [LEAF[4], LEAF[7], GREEN[1]], 1.64, os);
      [[0.27, 0.97], [0.05, 1.03], [-0.1, 0.93], [0.22, 0.71], [-0.1, 0.71], [0.37, 0.62], [0.14, 0.47]].forEach(([x, y], k) => at(x, y, R() * 3.14, 0.065 + 0.02 * R(), 1.74 + k * 0.025, ROSE[k % 3], { cell: 3 }));
      [[0.3, 0.87], [-0.17, 0.52], [0.37, 0.4], [0.18, 0.3]].forEach(([x, y], k) => at(x, y, 0.4 + k, 0.085, 1.8 + k * 0.03, GREEN[k % 2], { cell: 4, asp: 1.3 }));
      // the cold glint of the glass, last
      [[-0.045, 0.6, 1.2, 0.075], [0.03, 0.52, 1.3, 0.06], [-0.02, 0.66, 0.1, 0.07], [0.06, 0.63, 1.4, 0.05]].forEach(([dx, y, a, l], k) => at(jx + dx, y, a, l, 1.82 + k * 0.035, '#f4f6f6', { cell: 4, asp: 1.5 }));
    }
    // ---- 2: its one soft hop
    thrown(2, 12, REST, { far: 0.5, high: 0.55, slow: 0.6, big: 0.8 });
    thrown(2, 5, REST, { far: 0.5, high: 0.55, slow: 0.6, cell: 5, big: 1.2 });
    breath(2, 3, 0.4, 0.6);
    // ---- 0: grains sifting down from under the rail
    const top = L.rail - L.y - 0.03;
    for (let i = 0; i < 24; i++) mark(0, { kind: 3, delay: 2.0 * (i + R()) / 24, ang: R() * 6.283, reach: 0.01 + 0.05 * R(), rise: top, fall: 0.5 + 0.3 * R(), len: 0.07 + 0.05 * R(), cell: R() < 0.6 ? 5 : 3, spin: (R() - 0.5) * 5, c: col(weighted(WHITES, R)) });
    // ---- 3: when it pats down again, later: a small breath of powder, and one spray of the wall brushed in over it
    breath(3, 3, 0.45, 0.7);
    thrown(3, 6, [0, 0.6], { far: 0.45, high: 0.5, slow: 0.6, cell: 5, big: 1.2 });
    {
      const o3 = { loose: 3.3, z: 0 };
      hatch(3, -0.03, 0.5, 0.95, 7, 0.3, '#a9a5b6', o3);
      [[0.0, 0.18, 0.02, 0.4], [0.02, 0.4, 0.05, 0.6]].forEach(([x0, y0, x1, y1], i) => laid(3, (x0 + x1) / 2, (y0 + y1) / 2, Math.atan2(y1 - y0, x1 - x0), Math.hypot(x1 - x0, y1 - y0) * 1.2, 0.6 + i * 0.06, '#56657c', { cell: 4, ...o3 }));
      fan(3, 0.05, 0.6, [25, 55, 85, 115, 150], [0.16, 0.19, 0.17, 0.19, 0.15], LEAF, 0.74, o3);
      fan(3, 0.02, 0.4, [30, 150], [0.14, 0.14], [LEAF[4], GREEN[0]], 0.96, o3);
      [[0.2, 0.72], [0.03, 0.8], [-0.1, 0.7]].forEach(([x, y], k) => laid(3, x, y, R() * 3.14, 0.065, 1.1 + k * 0.04, ROSE[k % 3], { cell: 3, ...o3 }));
    }
    // ---- 4 to 7: the toy's own little clouds (a nudge to the puff, its wheels in the dusting)
    for (let b = 4; b < NB; b++) for (let i = 0; i < 10; i++) { const rise = 0.04 + 0.24 * R(), hang = 0.1 + 0.2 * R(); mark(b, { ang: R() * 6.283, reach: 0.06 + 0.22 * R(), rise, hang, fall: rise / (0.45 + 0.5 * R()), len: 0.07 + 0.07 * R(), asp: 0.8 + 0.5 * R() }); }
    const N = this.marks = Q.length;
    const pos = new Float32Array(N * 12), uv = new Float32Array(N * 8), colr = new Float32Array(N * 12), aA = new Float32Array(N * 16), aB = new Float32Array(N * 16), aC = new Float32Array(N * 16), aD = new Float32Array(N * 16), idx = [];
    Q.forEach((m, i) => {
      const u0 = (m.cell % 4) / 4, v0 = Math.floor(m.cell / 4) / 2;
      for (let k = 0; k < 4; k++) {
        const x = k % 2 ? 0.5 : -0.5, y = k < 2 ? -0.5 : 0.5, j = i * 4 + k;
        pos.set([x, y, 0], j * 3); uv.set([u0 + (x + 0.5) / 4, v0 + (y + 0.5) / 2], j * 2); colr.set([m.c.r, m.c.g, m.c.b], j * 3);
        aA.set([m.b, m.delay, m.hang, m.fall], j * 4); aB.set([m.ang, m.reach, m.rise, m.len], j * 4); aC.set([m.seed, m.spin, m.asp, m.kind], j * 4); aD.set([m.tx, m.ty, m.tz, m.ta], j * 4);
      }
      idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3);
    });
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); cg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); cg.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    cg.setAttribute('aA', new THREE.BufferAttribute(aA, 4)); cg.setAttribute('aB', new THREE.BufferAttribute(aB, 4)); cg.setAttribute('aC', new THREE.BufferAttribute(aC, 4)); cg.setAttribute('aD', new THREE.BufferAttribute(aD, 4)); cg.setIndex(idx);
    const cu = this.cu = {
      uT: { value: 0 }, uRet: { value: 0 }, uSpin: { value: 1 }, uSoft: { value: 1 }, uO: { value: O.clone() }, uAx: { value: ax },
      uMouth: { value: new THREE.Vector3(LAND[0], L.rail - L.y - 0.06, 0.03) },
      uB: { value: Array.from({ length: NB }, () => new THREE.Vector4(0, 0, 0, 0)) },
    };
    const cm = new THREE.MeshBasicMaterial({ map: sheet, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
    cm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, cu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec4 aA, aB, aC, aD;
uniform float uT, uRet, uSpin, uSoft; uniform vec3 uO, uMouth; uniform vec4 uAx; uniform vec4 uB[${NB}];
varying float vPow, vLit, vWipe, vU;`).replace('#include <project_vertex>', /* glsl */`
  vec4 pB = uB[int(aA.x + 0.5)];
  float pS = aC.x, pKind = aC.w, pT = uT - pB.z - aA.y;
  float pOn = step(0.0, pT) * step(0.001, pB.w); pT = max(pT, 0.0);
  vec2 pD = vec2(cos(aB.x), sin(aB.x)), pQ;
  vec3 pTx = vec3(uAx.x, 0.0, uAx.y), pNx = vec3(uAx.z, 0.0, uAx.w), pDir;
  float pH, pA, pGrow = 1.0, pTurn, pWipe = 2.0;
  bool pHaze = pKind > 0.5 && pKind < 1.5;
  if (pKind > 3.5) {
    // a stroke of the passage: brushed in where it belongs, from one end to the other; it hangs; then it comes loose,
    // turns, drifts and falls like the rest
    float x = pT - aA.z, xp = max(x, 0.0), loose = smoothstep(0.0, 1.1, x);
    pQ = aD.xz + pD * aB.y * (1.0 - exp(-xp / 1.6)) + loose * 0.06 * vec2(sin(xp * (0.6 + 0.5 * pS) + pS * 40.0), cos(xp * (0.5 + 0.4 * pS) + pS * 23.0));
    pH = aD.y + 0.005 * sin(uT * 0.8 + pS * 30.0) * (1.0 - loose) - aA.w * (xp + 0.25 * log(1.0 + exp(-abs(x) * 4.0)));
    pA = pOn * smoothstep(0.0, 0.09, pH) * 0.96;
    pWipe = pT / (0.22 * uSoft);
    pDir = pTx * cos(aD.w) + vec3(0.0, sin(aD.w), 0.0);
    pTurn = uSpin * aC.y * (1.7 * (1.0 - exp(-xp / 1.4)) + 0.15 * xp);
  } else {
    float pE1 = 1.0 - exp(-pT / (0.34 * uSoft)), pE2 = 1.0 - exp(-pT / (0.5 * uSoft));
    // thrown out along the floor, and stopped almost at once by the air; then it creeps, turns with the room's air, wanders
    pQ = pD * aB.y * pB.w * (pE1 + 0.04 * pT / (1.0 + 0.25 * pT));
    float pSw = uSpin * 0.45 * (0.4 + pS) * (1.0 - exp(-pT / 2.4));
    pQ = vec2(pQ.x * cos(pSw) - pQ.y * sin(pSw), pQ.x * sin(pSw) + pQ.y * cos(pSw));
    pQ += smoothstep(0.15, 1.6, pT) * 0.07 * vec2(sin(pT * (0.45 + 0.5 * pS) + pS * 40.0), cos(pT * (0.38 + 0.4 * pS) + pS * 23.0));
    if (pKind > 2.5) pH = aB.z - aA.w * pT;                                           // a grain, sifting straight down
    else if (pKind > 1.5) pH = aB.z * pB.w * pE2 + 0.05 * sin(pT * (0.5 + pS) + pS * 9.0) * smoothstep(0.5, 2.0, pT);      // a mote: it stays up
    else { float x = pT - aA.z; pH = aB.z * pB.w * pE2 - aA.w * (max(x, 0.0) + 0.25 * log(1.0 + exp(-abs(x) * 4.0))); }   // up; it hangs; it comes down
    pH = min(pH, ${TOP.toFixed(2)});
    pA = pOn * smoothstep(0.0, 0.07, pT) * smoothstep(0.0, 0.09, pH); pGrow = 0.5 + 0.5 * smoothstep(0.0, 0.4, pT);
    if (pHaze) { pA *= 0.15 * (1.0 - smoothstep(1.4, 5.5, pT)); pGrow = 0.45 + 0.9 * pE1 + 0.06 * pT; } else pA *= 0.9;
    pDir = pTx * pD.x + pNx * pD.y + vec3(0.0, 0.6 * aB.z / max(aB.y, 0.08), 0.0);     // (a flick lies along the way it was thrown)
    pTurn = uSpin * aC.y * (1.8 * (1.0 - exp(-pT / 2.0)) + 0.12 * pT);
  }
  pQ += pB.xy; pQ.y = max(pQ.y, 0.05);
  vec3 pP = vec3(pQ.x, max(pH, 0.0) + 0.014, pQ.y);                                  // (along the wall, up, out from it)
  if (uRet > 0.0) {
    // going home: up off the floor from wherever it lies or hangs, and in under the frame, each in its own time
    float k = clamp((uRet - 0.02 - 0.36 * fract(pS * 7.31)) / 0.5, 0.0, 1.0); k = k * k * (3.0 - 2.0 * k);
    vec3 c1 = vec3(mix(pP.x, uMouth.x, 0.55), 0.35 + 0.5 * pP.y, max(0.16, pP.z * 0.45));
    vec3 m1 = uMouth + vec3((fract(pS * 3.7) - 0.5) * 0.1, 0.0, 0.0);
    pP = mix(mix(pP, c1, k), mix(c1, m1, k), k);
    float lift = pOn * smoothstep(0.0, 0.16, k) * (1.0 - smoothstep(0.82, 1.0, k));
    pA = pHaze ? pA * (1.0 - k) : max(pA * (1.0 - smoothstep(0.82, 1.0, k)), lift);
    pWipe = 2.0; pTurn += 2.0 * k * (pS - 0.5);
  }
  vec4 mvPosition = viewMatrix * vec4(uO + pTx * pP.x + pNx * pP.z + vec3(0.0, pP.y, 0.0), 1.0);
  vec2 pV = (viewMatrix * vec4(pDir, 0.0)).xy;
  float pAng = atan(pV.y, pV.x + 1.0e-4) + pTurn;
  vec2 pC = position.xy * aB.w * pGrow * vec2(1.0, aC.z) * step(0.003, pA);
  mvPosition.xy += vec2(pC.x * cos(pAng) - pC.y * sin(pAng), pC.x * sin(pAng) + pC.y * cos(pAng));
  gl_Position = projectionMatrix * mvPosition;
  vPow = pA; vLit = mix(0.78, 0.98, clamp(pP.y / 0.7, 0.0, 1.0));                     // (the light is from above: what is high is in it)
  vWipe = pWipe; vU = position.x + 0.5;
`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vPow, vLit, vWipe, vU;')
        .replace('#include <map_fragment>', '  { vec4 pTx = texture2D(map, vMapUv); diffuseColor.rgb *= pTx.rgb * vLit; diffuseColor.a *= pTx.a * vPow * (1.0 - smoothstep(vWipe - 0.14, vWipe, vU)); if (diffuseColor.a < 0.004) discard; }');
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
    const ci = gc.getImageData(0, 0, TW, TH), wi = gw.getImageData(0, 0, TW, TH), base = col('#d8d6d3').convertLinearToSRGB();
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
  float a = 0.64 * dc.a * step(0.012, wn) * smoothstep(wn - 0.05, wn + 0.03, uDust.x) * (1.0 - smoothstep(0.9 - wn, 1.02 - wn, uDust.y * 1.1));
  vec3 c = dc.rgb;
  // and under the strokes the fine powder itself: a soft bloom of the same paint, thickest where they are thickest
  vec4 vc = texture2D(tDust, uv, 3.8), vf = texture2D(tDust, uv, 5.6); float rn = length((q - uMid) / vec2(1.3, 1.22)), vw = 0.1 + 0.6 * rn;
  float veil = min(0.7, vc.a * 1.25 + vf.a * 0.75) * smoothstep(vw - 0.1, vw + 0.1, uDust.x) * (1.0 - smoothstep(0.85 - vw, 1.05 - vw, uDust.y * 1.1));
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

    // ---------------------------------------------------------- the puff: a soft body under a deep shell of fine down
    // (white where the light falls, rose-grey under it), on its slim handle: the pale stick that lies beside the puff in
    // the picture. The handle runs back along -z; turned to point out into the room, it comes out of the wall first.
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
      const down = ['#b3a3a9', '#c4b7bb', '#d5ccce', '#e4dfdd', '#efedea', '#f5f4f1', '#f9f8f6'].map(h => col(h, 0.05));
      const shade = (n, j = 0) => down[Math.max(0, Math.min(down.length - 1, Math.floor((n.dot(light) * 0.5 + 0.5) * down.length + j)))];
      // the body: an ellipsoid, its normals true (no facets)
      const ball = new THREE.IcosahedronGeometry(1, 3).toNonIndexed(), bp = ball.attributes.position, a = new V3(), n = [new V3(), new V3(), new V3()], p = [new V3(), new V3(), new V3()];
      for (let f = 0; f < bp.count; f += 3) {
        for (let k = 0; k < 3; k++) { a.fromBufferAttribute(bp, f + k); p[k].set(a.x * PR * 0.9, a.y * PH * 0.9, a.z * PR * 0.9); n[k].set(a.x / PR, a.y / PH, a.z / PR).normalize(); }
        tri(p[0], p[1], p[2], n, shade(n[0]), plain);
      }
      // the down: dabs standing off it all round, longer at the rim
      for (let i = 0; i < 460; i++) {
        const z = R() * 2 - 1, th = R() * 6.2832, s = Math.sqrt(1 - z * z), d = new V3(s * Math.cos(th), z, s * Math.sin(th));
        const pt = new V3(d.x * PR * 0.9, d.y * PH * 0.9, d.z * PR * 0.9), nm = new V3(d.x / PR, d.y / PH, d.z / PR).normalize();
        const up = new V3(R() - 0.5, R() - 0.5, R() - 0.5).addScaledVector(nm, 0.9).normalize(), u = up.clone().addScaledVector(nm, -up.dot(nm)).normalize(), sd = new V3().crossVectors(nm, u).normalize();
        const rim = 1 - Math.abs(d.y), l = 0.03 + 0.02 * R() + 0.01 * rim, w = 0.026 + 0.02 * R(), lift = 0.12 + 0.28 * R() + 0.2 * rim;
        const lo = pt.clone().addScaledVector(nm, 0.002).addScaledVector(u, -l * 0.4), hi = lo.clone().addScaledVector(u, l).addScaledVector(nm, lift * l);
        const q0 = lo.clone().addScaledVector(sd, -w / 2), q1 = lo.clone().addScaledVector(sd, w / 2), q2 = hi.clone().addScaledVector(sd, w / 2), q3 = hi.clone().addScaledVector(sd, -w / 2), c = shade(nm, (R() - 0.5) * 0.8);
        tri(q0, q1, q2, nm, c, [[0, 0], [0.5, 0], [0.5, 1]]); tri(q0, q2, q3, nm, c, [[0, 0], [0.5, 1], [0, 1]]);
      }
      // the handle: turned ivory, a collar where it meets the down, a little swell at its end
      const prof = [[0.0, -PR * 0.6], [0.017, -PR * 0.82], [0.019, -PR * 0.95], [0.011, -PR - 0.012], [0.0085, -PR - 0.05], [0.0075, -PR - 0.1], [0.0095, -PR - 0.14], [0.0115, -PR - 0.158], [0.008, -PR - 0.17], [0.0, -PR - 0.172]], seg = 12, ivory = [col('#b3a184', 0.08), col('#d6c9ac', 0.08), col('#efe6d0', 0.08)];
      for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < seg; j++) {
        const pt = (k, m) => new V3(prof[k][0] * Math.cos(m / seg * 6.2832), prof[k][0] * Math.sin(m / seg * 6.2832), prof[k][1]);
        const nr = (k, m) => { const k0 = Math.max(0, k - 1), k1 = Math.min(prof.length - 1, k + 1), dr = prof[k1][0] - prof[k0][0], dz = prof[k1][1] - prof[k0][1]; return new V3(-dz * Math.cos(m / seg * 6.2832), -dz * Math.sin(m / seg * 6.2832), dr).normalize(); };
        const A = pt(i, j), B = pt(i + 1, j), Cc = pt(i + 1, j + 1), D = pt(i, j + 1), nA = nr(i, j), nB = nr(i + 1, j), nC = nr(i + 1, j + 1), nD = nr(i, j + 1), k = nA.dot(light), c = ivory[k > 0.5 ? 2 : k > -0.1 ? 1 : 0];
        tri(A, B, Cc, [nA, nB, nC], c, plain); tri(A, Cc, D, [nA, nC, nD], c, plain);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N3, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C3, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U2, 2));
      this.puff = new THREE.Mesh(g, mat); L.add(this.puff);
    }
    this.T = 0; this.off = 0; this.pose = { u: 0, h: 0, out: 0, pitch: 0, roll: 0, yaw: 0, sy: 1, show: false };
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
    s.hit(T_LAND + 0.35, { d: 1.7, vol: 0.0045, bp: 2800, q: 0.7, attack: 0.6 });                        // the brush, hardly heard
    return s.done();
  },
  pouf(L, k = 1) { if (L.quiet) return; const v = L.voice(); noise(v, 0, { d: 0.14, vol: 0.012 * k, lp: 260, attack: 0.01 }); noise(v, 0.01, { d: 0.5, vol: 0.008 * k, bp: 1600, q: 0.5, attack: 0.03 }); },

  start(L, resumed) {
    if (resumed) { this.off = this.T - L.t; if (this.sc) this.sc.from(1e9); return; }      // (it was still out: carry on from where it is, without the music)
    this.hide(); this.wipe();
    this.T = 0; this.off = 0; this.pu = { u: REST[0], out: REST[1] }; this.hop = null; this.landT = -9; this.bi = 0; this.pi = 0; this.pats = [null, null, null]; this.kick = 0; this.last = null; this.ret0 = null; this.scripted = true; this.yaw = Y_REST; this.every = L.calm ? 15 : 11;
    this.cu.uSpin.value = L.calm ? 0.5 : 1; this.cu.uSoft.value = L.calm ? 1.7 : 1;
    const B = this.cu.uB.value;
    B[0].set(LAND[0], 0.03, 0.08, 1); B[1].set(LAND[0], LAND[1], T_LAND, 1); B[2].set(REST[0], REST[1], T_HOP, 1);
    this.sc = this.band(L); this.sc.from(0);
    if (!this.told && !L.quiet) { this.told = true; L.k.say('The powder comes up in her brushstrokes.', 4); }
  },
  back(L) { this.ret0 = { ...this.pose }; this.hop = null; },
  end() { this.hide(); },
  reset() { this.told = false; this.hide(); },

  // Where the puff is at clock T, into this.pose: out from under the rail, down first; it overhangs and teeters, twice,
  // and goes over; down, turning over once; one soft hop, turning to lie along the wall; at rest.
  fallen(L, T) {
    const o = this.pose, yR = this.yRail; o.show = T >= T_PEEP; o.roll = 0; o.pitch = 0; o.yaw = Y_OUT; o.sy = 1; o.u = LAND[0];
    if (T < T_OUT) { const k = ease.inOut(ramp(T, T_PEEP, T_OUT)); o.out = lerp(-L.wall - PR - 0.2, 0.01, k); o.h = yR; o.sy = 0.86; o.roll = 0.06 * Math.sin(T * 10) * Math.sin(k * Math.PI); }
    else if (T < T_TIP) {
      // (forward, back, further forward, back a little, and over)
      const k = ramp(T, T_OUT, T_TIP), K = [[0, 0], [0.2, 0.42], [0.42, 0.1], [0.64, 0.62], [0.8, 0.36], [1, 1.25]]; let i = 0; while (i < K.length - 2 && k > K[i + 1][0]) i++;
      const q = (k - K[i][0]) / (K[i + 1][0] - K[i][0]), e = i === K.length - 2 ? q * q : ease.smooth(q), lean = lerp(K[i][1], K[i + 1][1], e);
      o.pitch = -lean; o.out = 0.01 + 0.075 * Math.min(1, lean / 1.25 + k * 0.4); o.h = yR - 0.03 * (lean / 1.25); o.sy = lerp(0.86, 1, ease.smooth(k)); o.roll = 0.04 * Math.sin(k * 14) * (1 - k);
    } else if (T < T_LAND) {
      const s = ramp(T, T_TIP, T_LAND); o.h = lerp(yR - 0.03, PH, Math.pow(s, 1.75)); o.out = lerp(0.085, LAND[1], Math.pow(s, 1.2));
      o.pitch = -lerp(1.25, Math.PI * 2, s); o.roll = 0.16 * Math.sin(s * 5.5); o.u = LAND[0] + 0.02 * Math.sin(s * 6.5); o.sy = 1 + 0.06 * s;
    } else if (T < T_HOP) {
      const k = ramp(T, T_LAND, T_HOP); o.sy = 1 - 0.46 * Math.exp(-k * 9) + 0.07 * Math.sin(Math.PI * k);
      o.h = PH * o.sy + 0.1 * 4 * k * (1 - k); o.u = lerp(LAND[0], REST[0], k); o.out = lerp(LAND[1], REST[1], k); o.pitch = 0.22 * Math.sin(Math.PI * k) - 0.2 * ease.smooth(k); o.yaw = lerp(Y_OUT, Y_REST, ease.smooth(k));
    } else { o.u = REST[0]; o.out = REST[1]; this.sits(o, T - T_HOP); o.yaw = Y_REST; }
    return o;
  },
  // The puff mid-hop (k 0..1, h metres high), and sitting (x seconds after it came down): into the pose.
  hops(o, k, h) { o.sy = 1 - 0.25 * Math.exp(-k * 10) + 0.08 * Math.sin(Math.PI * k); o.h = PH * o.sy + h * 4 * k * (1 - k); o.pitch = -0.2 + 0.42 * Math.sin(Math.PI * k); o.roll = 0.2 * Math.sin(Math.PI * 2 * k); },
  sits(o, x) { o.sy = 1 - 0.2 * Math.exp(-x * 6) * Math.cos(x * 17); o.h = PH * o.sy; o.pitch = -0.2; o.roll = 0; },

  // A small cloud of the toy's own making, and the print it leaves.
  burst(u, out, hard) { this.cu.uB.value[4 + (this.bi++ % 4)].set(u, out, this.T, hard); },
  pat(u, out) { this.pats[this.pi++ % 3] = { u, out, t0: this.T }; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return', U = this.cu, F = this.fu;
    if (showing) this.T = L.t + this.off; else if (!back) this.T += dt;                    // (going back, the clock stands still, and it is all drawn home)
    const T = this.T, Rt = back ? L.ret : 0, o = this.pose;
    U.uT.value = T; U.uRet.value = Rt;
    if (ph === 'linger') this.scripted = false;                                             // (the look is over: the puff is the toy's now)

    // ---- the puff
    if (back && this.ret0) {
      // lifted with the powder: up off the floor, turning over, to the rail, and in under it
      const r = this.ret0, k = ease.inOut(ramp(Rt, 0.1, 0.78)), s1 = 1 - k, slide = ease.inOut(ramp(Rt, 0.78, 0.97));
      const cu = lerp(r.u, LAND[0], 0.5), ch = Math.max(r.h, 0.45), co = Math.max(0.2, r.out * 0.55);
      o.u = s1 * s1 * r.u + 2 * s1 * k * cu + k * k * LAND[0]; o.h = s1 * s1 * r.h + 2 * s1 * k * ch + k * k * this.yRail; o.out = s1 * s1 * r.out + 2 * s1 * k * co + k * k * 0.01 - slide * (L.wall + PR + 0.21);
      o.pitch = r.pitch * s1 + (L.calm ? 0 : 6.2832) * ease.smooth(ramp(Rt, 0.1, 0.7)); o.yaw = lerp(r.yaw, Y_OUT, ease.smooth(ramp(Rt, 0.1, 0.6))); o.roll = r.roll * s1; o.sy = lerp(r.sy, 0.86, ramp(Rt, 0.6, 0.8)); o.show = r.show && Rt < 0.97;
    } else if (!back) {
      this.fallen(L, T);
      if (T > T_REST) {
        const p = this.pu;
        if (showing && this.scripted) {
          // while you keep looking: now and then it pats down again somewhere else, and a spray of the wall is brushed in over it
          const n = Math.floor((T - T_PAT) / this.every);
          if (n >= 0) {
            const ts = T_PAT + n * this.every, from = n ? SPOTS[(n - 1) % 3] : REST, to = SPOTS[n % 3], k = clamp01((T - ts) / 0.55), e = ease.smooth(k);
            p.u = lerp(from[0], to[0], e); p.out = lerp(from[1], to[1], e); this.yaw = Y_REST + 0.9 * (n + e);
            if (k < 1) this.hops(o, k, 0.13); else this.sits(o, T - ts - 0.55);
            U.uB.value[3].set(to[0], to[1], ts + 0.55, 1);
            if (dt > 0 && T - dt < ts + 0.55 && T >= ts + 0.55) { this.pat(to[0], to[1]); this.pouf(L, 0.7); }
          }
        } else {
          const toy = L.k.G.vehicle, on = toy && toy.group && toy.group.visible && Math.abs(toy.pos.y - L.y) < 0.4, tq = on ? L.local(toy.pos.x, toy.pos.z) : null;
          // the toy nudges it: it hops out of the way, softly, and pats down where it lands (never off its own bit of floor)
          if (tq && !this.hop && Math.hypot(tq.u - p.u, tq.out - p.out) < (toy.radius || 0.19) + PR + 0.02) {
            const du = p.u - tq.u, dout = p.out - tq.out, l = Math.hypot(du, dout) || 1, sp = Math.hypot(toy.vel.x, toy.vel.z), far = 0.3 + Math.min(0.3, sp * 0.15);
            let tu = Math.max(-1.1, Math.min(1.1, p.u + du / l * far)), to = Math.max(0.3, Math.min(1.45, p.out + dout / l * far));
            if (Math.hypot(tu - p.u, to - p.out) < 0.18) { tu = p.u + (LAND[0] - p.u) * 0.6 + (du / l) * 0.1; to = p.out + (0.8 - p.out) * 0.6; }      // (cornered: over towards the middle)
            this.hop = { t0: T, fu: p.u, fo: p.out, tu, to, h: 0.12 + Math.min(0.08, sp * 0.04), y0: this.yaw };
            this.pouf(L, 0.5);
          }
          if (this.hop) {
            const hp = this.hop, k = clamp01((T - hp.t0) / 0.5), e = ease.smooth(k);
            p.u = lerp(hp.fu, hp.tu, e); p.out = lerp(hp.fo, hp.to, e); this.yaw = hp.y0 + 0.9 * e; this.hops(o, k, hp.h);
            if (k >= 1) { this.hop = null; this.landT = T; this.burst(p.u, p.out, 1); this.pat(p.u, p.out); this.pouf(L, 0.8); }
          } else this.sits(o, T - this.landT);
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
        o.u = p.u; o.out = p.out; o.yaw = this.yaw;
      }
    }
    const pf = this.puff; pf.visible = !!o.show;
    if (o.show) {
      L.floor(o.u, o.out, pf.position); pf.position.y = L.y + o.h;
      pf.quaternion.setFromEuler(this.e.set(o.pitch, L.yawOut + o.yaw, o.roll, 'YXZ'));
      const sx = 1 / Math.sqrt(Math.max(0.3, o.sy)); pf.scale.set(sx, o.sy, sx);
    }
    F.uSh.value.set(o.u, o.out, PR * (1.3 + 1.6 * clamp01((o.h - PH) / 0.5)), o.show && o.out > 0.02 ? 0.62 * clamp01(1 - (o.h - PH) / 0.55) * (1 - ramp(Rt, 0.1, 0.4)) : 0);

    // ---- the dusting: it settles, stroke by stroke; the light it hangs in; and all of it lifts again when it goes home
    const settle = T < 1.3 ? 0 : T < T_LAND ? 0.09 * ramp(T, 1.3, T_LAND) : 0.09 + 0.24 * ramp(T, T_LAND + 0.2, T_LAND + 3.4) + 0.67 * ease.smooth(ramp(T, T_LAND + HOLD - 0.1, T_LAND + HOLD + 3.8));      // (a little from the first breath of it; the rest as the passage comes down)
    F.uDust.value.set(settle, ease.inOut(ramp(Rt, 0, 0.6)), ease.smooth(ramp(T, T_LAND - 0.2, T_LAND + 1.4)) * (1 - ease.smooth(ramp(Rt, 0.2, 0.9))));
    this.pats.forEach((p, i) => { if (p) F.uPat.value[i].set(p.u, p.out, 0.27, 0.9 * ease.smooth(ramp(T - p.t0, 0.05, 0.6))); else F.uPat.value[i].w = 0; });
    this.cloud.visible = this.ground.visible = true;

    if (showing && this.sc) this.sc.play(L.t);
    L.voice().place();
  },
});
