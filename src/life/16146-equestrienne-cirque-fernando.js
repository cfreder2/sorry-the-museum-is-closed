// Henri de Toulouse-Lautrec, Equestrienne (At the Cirque Fernando) (1887-88), Gallery 242. The word: hoop.
//
// The picture is the moment before. A dapple grey leans into the bend of the ring, seen from behind; its rider is
// about to stand and leap; and at the very top, cut off by the frame, is what she is to leap through: a clown on a
// stool draped in red (you see only his baggy white legs and striped socks) holding out a big disc of white paper.
// The ring's red kerb sweeps right across the canvas and out of it. Everything in it is waiting for the paper to burst.
//
// Look at it and the ring comes out into the room as he cut it: his pale sawdust, brushed thin and round, spreads from
// under the frame, and the red kerb rises block by block round the back and the sides only, breaking off towards you as
// the frame breaks it off (you stand in the ring, as the painter does). The band plays the trumpet call that opens
// Suppé's Light Cavalry (1866). A little stool in a red cloth tumbles out from under the rail, and after it a white
// paper disc comes running on two legs in striped socks: the clown, hidden behind his hoop as the frame hides him in
// the picture. He hops up on the stool and shows the paper to the house. Then the galop from the same overture, whose
// rhythm is a canter's three beats, and the grey comes out from under the picture, riderless, in its green and gold
// pad, and canters the ring on the left lead, leaning in: a stride to a beat, a lap to four bars. As it goes up the
// right-hand side it is the horse of the picture, seen from behind. The drum rolls, the clown swings the hoop out
// over the track and braces, and on the downbeat of the tune's long high note the grey leaps and goes through the
// paper towards you: the disc splits into flaps, scraps fly and flutter down on the sawdust, a cymbal, and the house
// claps. The clown turns the torn hoop to the house. While you keep looking the galop comes round again and the grey
// goes through the open hoop once a lap. If the toy is standing on its track it swings wide of the toy and comes
// back to its line. When you stop, the grey canters back in under the picture, the clown bows, hops down and runs
// home behind his hoop, the stool tumbles after him, the kerb sinks and the sawdust draws back.
//
// The grey is the picture's great shape, and is made as he drew it: a heavy horse, broad in the quarters and thick in
// the neck, in flat greys (a light along the top, a lilac shade beneath) inside a dark blue-black contour wide enough
// to read as drawn from where you stand; its dapples are loose dabs of paint lying on the hide; its white tail, full
// at the dock and breaking into strands, is carried up and out to the off side as it is in the picture and follows
// the horse a moment late; and its hind legs are jointed as a horse's are (thigh, gaskin, cannon), so they fold and
// reach through the canter's three beats and the moment in the air. The clown, the stool,
// the kerb and the hoop are solid and outlined too, as his neighbour At the Moulin Rouge is. Never over the picture:
// nothing stands higher than the foot of the frame.
//
// The music. Franz von Suppé, Leichte Kavallerie (Light Cavalry), overture (Vienna, 1866; an operetta about a troop of
// hussars): no words are sung in the overture, and none are used here. The call is its first bar,
// checked against a printed piano edition. The galop is its Allegretto brillante in A, 6/8: the tune (bars 3 to 18,
// with its two-note upbeat) is set down note for note as two published arrangements, one for flute and one for
// violin, agree in giving it; the two bars of repeated E before it are the accompaniment's rhythm, from the flute
// setting; the oom-pah under it is ours. It is a soldiers' galop, chosen knowingly: it is written in the rhythm of a
// cantering horse, and nobody here is a soldier. Not Offenbach's galop, which the Moulin Rouge next door and
// Renoir's acrobats (the same circus) already play. What the Fernando's band really played is not recorded.
//
// What it does not do. The rider is not built: a young woman in a short costume, on a horse, above a camera on the
// floor, could not be shown with the care she is owed, so the leap that is hers in the picture is left to her there,
// and the caption says so. Monsieur Loyal and his whip stay in the picture too: no whip is in the room, nothing drives
// the grey but the music, it is never struck, frightened or made to fall, and the paper is only paper. The clown keeps
// to his stool by the wall, has no painted grin (neither clown shows his face in the picture) and watches the horse,
// never you. With "Reduce motion and flashing" on, the stool and the scraps turn at half speed and there is no cymbal
// crash or sudden tear, only the band, more quietly.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { score, inked, Bones, hump, turnTo, noise, hz } from './stagecraft.js';
import { strokes as floorStrokes } from './brush.js';

const TAU = Math.PI * 2;
// ---------------------------------------------------------------- the ring (stage terms: along the wall, out from it)
const CU = -0.1, CO = 1.28;                      // its middle
const R = 0.72;                                  // the track the grey canters
const RC = 1.2, CURB = 24;                       // the kerb's inner face; its blocks, ten degrees each, round the back
const RSAW = 1.04;                               // how far the sawdust comes towards you, where there is no kerb
const TH = 205 * Math.PI / 180;                  // where on the track the hoop is held (0: to your right; 90 degrees: nearest you)
const SC = 1.2;                                  // the grey, the clown and his things are built a little under this size
const RST = 1.12, STH = 0.2 * SC;                // the stool: how far from the middle, and how high
const HR = 0.25 * SC, HY = 0.46 * SC, GRIP = RST - R - HR;   // the hoop: its radius, the height of its middle over the track, the clown's reach
const PSI_P = TH + Math.PI - TAU, PSI_S = PSI_P - Math.PI / 2;      // the hoop held out over the track; and shown to the house
const NF = 14, TORN = [1, 5, 9, 12], NSCRAP = 8, NFLECK = 14;            // the paper's flaps, the ones that tear off, loose scraps; sawdust
// ---------------------------------------------------------------- the galop and the timeline (show seconds)
const BAR = 1.02, BEAT = BAR / 2, EIGHTH = BAR / 6, T0 = 1.2, tb = n => T0 + (n - 1) * BAR;
const LAP = 4 * BAR, T_BURST = tb(6);            // the nose goes through the paper on the downbeat of bar 6
const TJ = 0.27, T_PASS = T_BURST + 0.35;        // the leap: this long up and this long down; its top, the grey's middle in the hoop, this long after its nose
const T_JOIN = T_PASS - LAP;                     // the grey reaches the track (at the hoop's place, a lap before)
const SPEED = TAU * R / LAP, H0 = 0.305 * SC, HJ = HY - H0;      // its speed; the height of its middle; how high it leaps
const T_ST0 = 0.22, T_ST1 = 1.1;                 // the stool tumbles out
const T_RUN0 = 0.5, T_RUN1 = 1.72, T_UP = 2.12;  // the clown runs out, and hops up on it
const T_SW0 = T_BURST - 1.6, T_SW1 = T_BURST - 0.95;     // he swings the hoop out over the track
const CLEAR = 0.46;                              // how wide of the toy the grey passes, if the toy is standing on its track
// Suppé, Leichte Kavallerie (1866). The call: the overture's first bar (a beat is a crotchet). The galop: Allegretto
// brillante, 6/8, in A (a beat here is a quaver; R: a rest): bars 1 to 10, then 11 to 18 (the last two notes: the
// upbeat again, for going round).
const CALL = 'A4:2 E4:.5 A4:.167 A4:.167 A4:.166 C#5:.5 A4:.25 C#5:.25';
const G_IN = 'A4 R E4:.5 E4:.5 E4 R E4 | E4 R E4:.5 E4:.5 E4 R A4:.5 B4:.5 | ';
const G_A = 'C#5 R C#5:.5 C#5:.5 C#5 R A4:.5 B4:.5 | C#5 R C#5:.5 C#5:.5 C#5 R A4:.5 B4:.5 | C#5 R C#5:.5 C#5:.5 C#5 B4 C#5 | F#5:3 E5:3 | D5 R E4:.5 E4:.5 E4 R D5 | C#5 R E4:.5 E4:.5 E4 R C#5 | ';
const G_END1 = 'B4 C#5 B4 A4 G#4 F#4 | B4:2 E4:.5 E4:.5 E4:2 A4:.5 B4:.5 | ', G_END2 = 'B4 C#5 B4 F#4:2 G#4 | A4:2 R:3 A4:.5 B4:.5';
// The band under it (ours): a bass note and a chord to each half bar. [bass, chord] by midi number.
const CH = { A: [45, [61, 64, 69]], A2: [40, [61, 64, 69]], D: [50, [62, 66, 69]], E7: [40, [62, 64, 68]], E7b: [47, [62, 64, 68]], E: [40, [59, 64, 68]], B7: [47, [57, 59, 63]] };
const HARM_A = [['A', 'A2'], ['A', 'A2'], ['A', 'A2'], ['D', 'A2'], ['E7', 'E7b'], ['A', 'A2']];      // bars 3 to 8 (and 11 to 16)
const HARM = [['A', 'A2'], ['A', 'A2'], ...HARM_A, ['E', 'B7'], ['E', 'E'], ...HARM_A, ['E7', 'E7b'], ['A', 'A']];

// The grey's bones.
const ROOT = 0, NECK = 1, HEAD = 2, FU = 3, FL = 5, HT = 7, HG = 9, HL = 11, T1 = 13, T2 = 14, TS = 15, NSTR = 5, NBH = TS + NSTR;
// Its legs: side (+1: the near, left side), fore or hind, and when in the stride each comes down. The left lead, as it
// must be on this hand: the off hind, then the near hind and off fore together, then the near fore, on the beat.
const LEGS = [[1, 0, 0], [-1, 0, -1 / 6], [1, 1, -1 / 6], [-1, 1, -1 / 3]];

const hash = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
const frac = x => x - Math.floor(x);
const cr = (p0, p1, p2, p3, t) => 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);

// A soft form: rings (an ellipse rx by ry, its middle lifted cy) along z, smoothed between the sections given
// ([z, cy, rx, ry]); a0 to a1: the part of the way round that is made (0 is the top, a quarter turn is +x); paint(p, n)
// gives each vertex its colour. Comes back as the kit's shapes do (position, normal, color; not indexed).
function loft(secs, paint, { around = 14, sub = 3, a0 = 0, a1 = TAU } = {}) {
  const rings = [];
  for (let i = 0; i < secs.length - 1; i++) for (let j = 0; j < sub; j++) {
    const a = secs[Math.max(0, i - 1)], b = secs[i], c = secs[i + 1], d = secs[Math.min(secs.length - 1, i + 2)], t = j / sub;
    rings.push([lerp(b[0], c[0], t), cr(a[1], b[1], c[1], d[1], t), cr(a[2], b[2], c[2], d[2], t), cr(a[3], b[3], c[3], d[3], t)]);
  }
  rings.push(secs[secs.length - 1].slice());
  const closed = a1 - a0 > TAU - 1e-6, na = closed ? around : around + 1, pos = [], idx = [];
  for (const [z, cy, rx, ry] of rings) for (let k = 0; k < na; k++) { const a = a0 + (a1 - a0) * k / around; pos.push(Math.sin(a) * Math.max(rx, 2e-4), cy + Math.cos(a) * Math.max(ry, 2e-4), z); }
  for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < around; k++) {
    const k1 = closed ? (k + 1) % around : k + 1, a = i * na + k, b = i * na + k1, c = (i + 1) * na + k1, d = (i + 1) * na + k;
    idx.push(a, c, b, a, d, c);
  }
  let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  g = g.toNonIndexed();
  const p = g.attributes.position, n = g.attributes.normal, col = new Float32Array(p.count * 3), P = new THREE.Vector3(), N = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { const c = paint(P.fromBufferAttribute(p, i), N.fromBufferAttribute(n, i)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
// A limb: a loft made along z, hung down from its top (z becomes down; the sections' "up", cy, becomes forwards).
const limb = (secs, paint, o) => shape.move(loft(secs, paint, o), 0, 0, 0, Math.PI / 2);

lifeFor(16146, {
  title: /^Equestrienne/,
  word: 'hoop',
  // (the camera stands in the ring, to the left of its middle: the hoop's paper faces it, and the grey going up the
  // right-hand side is seen from behind and to its left, as the picture sees it)
  stage: { out: 2.3, half: 1.35, cam: { dist: 3.4, height: 0.85, side: -0.7, fov: 56, lookU: -0.12, lookOut: 0.95, lookH: 0.5, floorOut: 2.25 } },
  wake: 2, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.3) => P.near(h, a), mix = (a, b, k) => a.clone().lerp(b, k);
    const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), M4 = () => new THREE.Matrix4();
    this.B = new Bones(); this.V = V3(); this.W = V3(); this.X = V3(); this.Y = V3(); this.Z = V3(); this.m1 = M4(); this.m2 = M4(); this.o = {}; this.o2 = {};
    const ink = '#2b2c3b', THIN = 0.0034, INK = 0.0048;
    // his contour: the dark blue-black line he drew round the horse and round each of its forms, wide enough to read
    // as drawn from where you stand to look
    const line = '#1d2036', L_BODY = 0.0098, L_NECK = 0.0084, L_LEG = 0.0058, L_HEAD = 0.0056, L_TAIL = 0.0066;

    // ---------------------------------------------------------- the grey
    const gLight = col('#e6e2da', 0.2), gMid = col('#aeaab0', 0.25), gShade = col('#7f7890', 0.25), gDark = col('#55505f', 0.25), gSpot = col('#2c2d3d', 0.12);
    const hoof = col('#cdb98f', 0.3), hoofS = col('#8f8168', 0.3), tailC = col('#f0ece0', 0.2), tailS = col('#b9b3bf', 0.3);
    const padG = col('#2b4a37', 0.3), padG2 = col('#1f3a34', 0.3), gold = col('#d0ab3c', 0.3), white = col('#efece2', 0.2), red = col('#b03a2c', 0.35);
    // his flat greys: a light along the top, the grey of its side, a lilac shade underneath, with little between them
    const tone = (n, k = 1) => { const t = n.y + 0.25 * n.x, c = gMid.clone().lerp(gLight, ease.smooth(ramp(t, 0.3, 0.5))); return c.lerp(gShade, k * ease.smooth(ramp(-t, 0.38, 0.58))); };
    // a heavy horse, broad in the quarters, as he drew it
    const BODY = [[-0.234, 0.02, 0.004, 0.006], [-0.223, 0.018, 0.062, 0.072], [-0.186, 0.014, 0.097, 0.105], [-0.12, 0.01, 0.103, 0.109], [-0.045, 0.0, 0.087, 0.095], [0.035, -0.006, 0.089, 0.101], [0.105, -0.002, 0.087, 0.107], [0.16, 0.004, 0.077, 0.101], [0.198, 0.01, 0.053, 0.075], [0.215, 0.012, 0.004, 0.006]];
    const body = loft(BODY, (p, n) => tone(n), { around: 30, sub: 4 });
    // (a place on its hide: z along it, a round it from the spine, d clear of it)
    const hide = (z, a, d, into) => { let j = 0; while (j < BODY.length - 2 && BODY[j + 1][0] < z) j++; const t = (z - BODY[j][0]) / (BODY[j + 1][0] - BODY[j][0]), q = k => cr(BODY[Math.max(0, j - 1)][k], BODY[j][k], BODY[j + 1][k], BODY[Math.min(BODY.length - 1, j + 2)][k], t); return into.set(Math.sin(a) * (q(2) + d), q(1) + Math.cos(a) * (q(3) + d), z); };
    const over = (z0, z1, d) => { const a = [], n = 5, v = V3(); for (let i = 0; i <= n; i++) { const z = lerp(z0, z1, i / n), top = hide(z, 0, d, v).y, side = hide(z, Math.PI / 2, d, v); a.push([z, side.y, side.x, top - side.y]); } return a; };
    // The dapples, as he dabbed them on: loose touches of blue-black on the quarters, and of white along the flank.
    // Each is a little patch of paint lying on the hide, with a ragged edge.
    const dabs = (() => {
      const pos = [], cols = [], c0 = V3(), a0 = V3(), b0 = V3(), n0 = V3(), e1 = V3(), e2 = V3();
      const dab = (z, a, ra, rb, turn, c, seed) => {
        const N = 9, rim = [], at = (dz, ds, out) => hide(z + dz, a + ds / 0.1, 0.0022, out);
        at(0, 0, c0);
        for (let i = 0; i < N; i++) { const t = i / N * TAU, k = 0.78 + 0.44 * hash(seed + i, 3.3), x = Math.cos(t) * ra * k, y = Math.sin(t) * rb * k; rim.push(at(x * Math.cos(turn) - y * Math.sin(turn), x * Math.sin(turn) + y * Math.cos(turn), V3())); }
        for (let i = 0; i < N; i++) {
          a0.copy(rim[i]); b0.copy(rim[(i + 1) % N]); n0.crossVectors(e1.subVectors(a0, c0), e2.subVectors(b0, c0));
          const flip = n0.x * c0.x + n0.y * (c0.y - 0.01) < 0, A = flip ? b0 : a0, B2 = flip ? a0 : b0;
          pos.push(c0.x, c0.y, c0.z, A.x, A.y, A.z, B2.x, B2.y, B2.z); for (let j = 0; j < 3; j++) cols.push(c.r, c.g, c.b);
        }
      };
      for (const sd of [1, -1]) {
        // the big dark touches on the hip, as in the picture; then smaller ones scattered round them
        for (const [z, a, r] of [[-0.118, 1.0, 0.021], [-0.082, 1.26, 0.017], [-0.152, 1.3, 0.016], [-0.102, 0.7, 0.014], [-0.056, 1.0, 0.013], [-0.176, 0.9, 0.015]]) dab(z, sd * a, r, r * 0.62, 0.5 + z * 9, gSpot, z * 91 + sd);
        for (let i = 0; i < 21; i++) {
          const r1 = hash(i + (sd > 0 ? 0 : 50), 1.3), r2 = hash(i + (sd > 0 ? 0 : 50), 2.9), r3 = hash(i, 5.7), r4 = hash(i + 7, 8.1), fore = i > 18, pale = i % 3 === 0;
          const z = fore ? 0.15 + 0.045 * r1 : -0.205 + 0.2 * r1, a = sd * (fore ? 0.9 + 0.8 * r2 : 0.3 + 1.5 * r2), ra = (fore ? 0.006 : pale ? 0.011 : 0.008) + (fore ? 0.004 : 0.008) * r3;
          dab(z, a, ra, ra * (0.45 + 0.3 * r4), r4 * 3, pale ? gLight : mix(gSpot, gDark, fore ? 0.8 : 0.15 + 0.6 * r3), i * 13 + sd * 5);
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals(); return g;
    })();
    // the pad she rides on, green trimmed with gold, hanging down the shoulder; and the white girth
    const padPaint = (z0, z1, A) => (p, n) => { const a = Math.abs(Math.atan2(p.x, p.y)), trim = a > A - 0.17 || p.z < z0 + 0.012 || p.z > z1 - 0.012, dab = Math.sin(p.z * 210 + a * 3) * Math.sin(a * 13 + p.z * 40) > 0.62; return trim || dab ? mix(gold, padG, trim ? 0.05 : 0.2) : mix(padG, padG2, clamp01(0.5 - n.y * 0.6 + 0.3 * Math.sin(a * 4 + p.z * 30))); };
    const pad = loft(over(-0.04, 0.082, 0.007), padPaint(-0.04, 0.2, 1.22), { around: 26, sub: 4, a0: -1.22, a1: 1.22 });
    const drape = loft(over(0.074, 0.142, 0.0075), padPaint(-0.2, 0.142, 1.95), { around: 34, sub: 3, a0: -1.95, a1: 1.95 });
    const girth = loft(over(0.04, 0.054, 0.0105), (p, n) => mix(white, gShade, clamp01(-n.y * 0.8)), { around: 20, sub: 1 });
    const gBody = shape.merge([inked(body, L_BODY, line), inked(shape.merge([pad, drape, girth]), THIN, line), dabs]);

    const crest = col('#d2cdc6', 0.2);
    const neck = loft([[-0.03, -0.022, 0.056, 0.093], [0.02, -0.006, 0.056, 0.089], [0.075, 0.012, 0.046, 0.073], [0.13, 0.02, 0.038, 0.057], [0.172, 0.014, 0.033, 0.046], [0.19, 0.01, 0.015, 0.022]], (p, n) => tone(n), { around: 18, sub: 4 });
    // (its mane, hogged short: a pale ridge along the crest; and a forelock)
    const mane = loft([[0.0, 0.07, 0.002, 0.004], [0.03, 0.089, 0.009, 0.013], [0.09, 0.089, 0.01, 0.015], [0.15, 0.07, 0.009, 0.013], [0.183, 0.054, 0.002, 0.004]], (p, n) => mix(crest, gShade, clamp01(0.3 - n.x * 0.4)), { around: 8, sub: 3 });
    const gNeck = shape.merge([inked(neck, L_NECK, line), inked(mane, THIN, line)]);
    const headPaint = (p, n) => { const c = tone(n, 0.8); return p.z > 0.12 ? c.lerp(gDark, 0.6 * ease.smooth(ramp(p.z, 0.12, 0.175))) : c; };
    const skull = loft([[-0.02, 0.004, 0.006, 0.008], [-0.008, 0.004, 0.029, 0.033], [0.03, -0.008, 0.036, 0.049], [0.075, -0.006, 0.029, 0.037], [0.12, -0.001, 0.0225, 0.028], [0.165, 0.001, 0.0215, 0.025], [0.186, -0.001, 0.018, 0.02], [0.193, -0.002, 0.006, 0.007]], headPaint, { around: 16, sub: 3 });
    const bits = [];
    for (const s of [1, -1]) {
      bits.push(shape.move(shape.cone(0.0135, 0.052, 6, mix(gMid, gShade, 0.45)), s * 0.02, 0.052, -0.002, 0.3, 0, -s * 0.2));          // an ear
      bits.push(shape.move(shape.ball(0.0068, gSpot, 1), s * 0.031, 0.015, 0.042));                                                    // an eye
      bits.push(shape.move(shape.ball(0.0046, gSpot, 0), s * 0.0115, 0.006, 0.187));                                                   // a nostril
      bits.push(shape.move(shape.ball(0.0062, red, 1), s * 0.0235, -0.012, 0.152, 0, 0, 0, 0.5, 1, 1));                                // the red rosette at the bit
      bits.push(shape.move(shape.box(0.003, 0.0065, 0.12, white), s * 0.031, -0.004, 0.074, 0.06, -s * 0.085, 0));                     // the cheek strap
    }
    bits.push(shape.move(shape.cone(0.011, 0.04, 6, crest), 0, 0.032, 0.02, 1.9));                                                      // the forelock
    bits.push(shape.move(shape.cyl(0.0272, 0.0272, 0.0075, 12, white), 0, -0.002, 0.134, Math.PI / 2, 0, 0, 0.88, 1, 1.1));             // the noseband
    bits.push(shape.move(shape.cyl(0.033, 0.033, 0.0065, 12, white), 0, 0.002, 0.008, Math.PI / 2, 0, 0, 1, 1, 1.14));                  // the browband
    const gHead = shape.merge([inked(skull, L_HEAD, line), inked(shape.merge(bits), THIN, line)]);

    // Its legs. In front: the forearm, and the short cannon and hoof. Behind, in three, as a horse's hind leg is: the
    // great thigh running forward to the stifle, the gaskin back to the hock, the cannon down to the hoof.
    const legPaint = (len, d0, d1) => (p, n) => tone(n).lerp(gDark, clamp01(lerp(d0, d1, p.z / len)));
    const lowPaint = len => (p, n) => (p.z > len - 0.03 ? mix(hoof, hoofS, clamp01(0.4 - n.y * 0.6 + (p.z > len - 0.004 ? 0.6 : 0))) : tone(n).lerp(gDark, 0.72));
    const LOW = len => [[-0.008, 0, 0.014, 0.0155], [0.004, 0.001, 0.0185, 0.021], [0.022, 0, 0.0145, 0.0165], [len * 0.52, -0.001, 0.0132, 0.015], [len - 0.042, 0.0, 0.0148, 0.0172], [len - 0.03, 0.004, 0.0152, 0.018], [len - 0.016, 0.0075, 0.0185, 0.0226], [len - 0.001, 0.0095, 0.021, 0.0262], [len, 0.0095, 0.004, 0.005]];
    const gFU = inked(limb([[-0.016, 0, 0.024, 0.032], [0.012, 0.002, 0.033, 0.044], [0.05, 0.002, 0.028, 0.036], [0.1, 0, 0.0195, 0.0235], [0.14, 0, 0.0175, 0.0205], [0.154, 0, 0.013, 0.015]], legPaint(0.15, 0.05, 0.6), { around: 10, sub: 3 }), L_LEG, line);
    const gFL = inked(limb(LOW(0.11), lowPaint(0.11), { around: 10, sub: 2 }), L_LEG, line);
    const gHT = inked(limb([[-0.035, 0.004, 0.03, 0.05], [0.0, 0.004, 0.05, 0.074], [0.045, 0.0, 0.046, 0.062], [0.085, -0.002, 0.033, 0.043], [0.106, 0, 0.022, 0.028]], legPaint(0.1, 0, 0.25), { around: 12, sub: 3 }), L_LEG, line);
    const gHG = inked(limb([[-0.018, 0, 0.025, 0.033], [0.01, 0.001, 0.032, 0.043], [0.055, -0.002, 0.024, 0.031], [0.098, 0, 0.0185, 0.022], [0.116, 0, 0.014, 0.017]], legPaint(0.11, 0.25, 0.65), { around: 10, sub: 3 }), L_LEG, line);
    const gHL = inked(limb(LOW(0.105), lowPaint(0.105), { around: 10, sub: 2 }), L_LEG, line);
    // Its tail: no longer than from the dock to the hock, full at the dock, spreading into a fan and breaking into
    // five strands, in his grey-white strokes. His dark line runs only round the outside of it: round the dock and
    // the fan (not across the fan's end, where the strands leave it) and down the outer edge of the two outer strands.
    const edged = (g, d, keep) => {            // (the kit's inked line, kept only where keep(the middle of a face of it) says)
      const n = g.attributes.position.count, k = inked(g, d, line), P = k.attributes.position, out = new THREE.BufferGeometry(), idx = [], c = V3();
      for (let f = 0; f < n; f += 3) idx.push(f, f + 1, f + 2);
      for (let f = n; f < 2 * n; f += 3) { c.set(0, 0, 0); for (let j = 0; j < 3; j++) { c.x += P.getX(f + j) / 3; c.y += P.getY(f + j) / 3; c.z += P.getZ(f + j) / 3; } if (keep(c)) idx.push(f, f + 1, f + 2); }
      for (const name of ['position', 'normal', 'color']) { const A = k.attributes[name].array, a = new Float32Array(idx.length * 3); idx.forEach((v, i) => { a[i * 3] = A[v * 3]; a[i * 3 + 1] = A[v * 3 + 1]; a[i * 3 + 2] = A[v * 3 + 2]; }); out.setAttribute(name, new THREE.BufferAttribute(a, 3)); }
      return out;
    };
    const tailPaint = (p, n) => mix(tailC, tailS, clamp01(0.75 * Math.pow(0.5 + 0.5 * Math.sin(Math.atan2(p.x, p.y) * 7 + p.z * 22), 2.2) + clamp01(-n.y) * 0.3));
    const gT1 = inked(limb([[-0.012, 0, 0.009, 0.011], [0.01, 0, 0.018, 0.02], [0.045, 0.002, 0.028, 0.027], [0.092, 0.002, 0.034, 0.026]], tailPaint, { around: 12, sub: 3 }), L_TAIL, line);
    const gT2 = edged(limb([[-0.022, 0.002, 0.028, 0.022], [0.02, 0.002, 0.037, 0.024], [0.058, 0, 0.042, 0.02], [0.088, 0, 0.038, 0.014], [0.1, 0, 0.022, 0.007]], tailPaint, { around: 14, sub: 3 }), L_TAIL, c => c.y > -0.074);
    const STRANDS = [[-0.028, 0.36, 0.118, 0.2], [-0.014, 0.17, 0.098, 0.65], [0, 0, 0.126, 0], [0.014, -0.17, 0.104, 0.5], [0.028, -0.36, 0.112, 0.3]];     // [where on the fan's end, how far it leans out, how long, how grey]
    const gStr = STRANDS.map(([x, , len, grey], i) => {
      const tint = mix(tailC, tailS, grey), g = limb([[-0.026, 0, 0.007, 0.006], [0.004, 0, 0.0135, 0.0095], [len * 0.5, 0.003, 0.012, 0.008], [len * 0.85, 0.001, 0.007, 0.005], [len, 0, 0.001, 0.001]], (p, n) => mix(tint, tailS, clamp01(-n.y * 0.5 + 0.25 * Math.sin(p.z * 60 + i))), { around: 8, sub: 3 });
      return i === 0 || i === NSTR - 1 ? edged(g, L_TAIL * 0.8, c => c.x * x > 0.0015 && c.y < -0.012) : g;
    });

    // ---------------------------------------------------------- the clown, his stool, the hoop
    const suit = col('#ebe6d8', 0.25), suitS = col('#b9b3c0', 0.3), teal = col('#3f8f88', 0.3), sockY = col('#d2b03a', 0.3), sockB = col('#2a2622', 0.2), shoe = col('#2a2420', 0.2);
    const face = col('#eedfcd', 0.2), faceS = col('#d2b9ac', 0.25), hair = col('#d8672a', 0.35), hairS = col('#a94a22', 0.35), wood = col('#e4dcc9', 0.25), woodS = col('#aaa3ab', 0.3);
    const suitTone = n => mix(suit, suitS, clamp01(0.42 - 0.5 * n.y - 0.35 * n.x + 0.1));
    const MOONS = [[0.2, 0.6, 1], [0.235, -0.9, -1], [0.19, 2.4, 1], [0.245, -2.3, 1], [0.165, -0.2, -1], [0.215, 3.3, -1]];      // [how high, how far round, which way it opens]
    const suitPaint = (p, n) => {                           // (made along z: z is his height)
      const c = suitTone(n), a = Math.atan2(p.x, p.y);
      for (const [z, as, s] of MOONS) { const da = Math.atan2(Math.sin(a - as), Math.cos(a - as)) * 0.055, dz = p.z - z, d = Math.hypot(da, dz), d2 = Math.hypot(da - s * 0.011, dz - 0.004); if (d < 0.02 && d2 > 0.0155) c.lerp(teal, 0.9); }
      return c;
    };
    // (a loft stood up: along z becomes up, and what was the sections' "up" is his front)
    const stand = g => shape.move(g, 0, 0, 0, -Math.PI / 2);
    const torso = stand(loft([[0.135, 0, 0.012, 0.01], [0.15, 0, 0.05, 0.042], [0.185, 0.002, 0.062, 0.052], [0.23, 0.002, 0.058, 0.048], [0.268, 0, 0.047, 0.038], [0.288, 0, 0.022, 0.02], [0.296, 0, 0.004, 0.004]], suitPaint, { around: 18, sub: 3 }));
    const ruff = shape.move(shape.cyl(0.04, 0.034, 0.012, 14, suit), 0, 0.293, 0);
    shape.paint(ruff, (c, n) => (Math.sin(Math.atan2(c.x, c.z) * 7) > 0.2 ? suit : suitS));
    const gTorso = inked(shape.merge([torso, ruff]), INK, ink);
    const skullC = shape.move(shape.ball(0.033, face, 2), 0, 0.034, 0, 0, 0, 0, 0.94, 1.06, 0.98);
    shape.paint(skullC, (c, n) => (n.x * -0.55 + n.z * 0.5 + n.y * 0.45 < -0.05 ? faceS : null));
    const tuft = shape.move(shape.cone(0.017, 0.058, 8, hair), 0, 0.088, -0.004, -0.22); shape.paint(tuft, (c, n) => (n.x < -0.2 ? hairS : null));
    const sideHair = [-1, 1].map(s => shape.paint(shape.move(shape.ball(0.017, hair, 1), s * 0.03, 0.04, -0.008, 0, 0, 0, 0.8, 1.1, 1.1), (c, n) => (n.y < -0.2 || n.x < -0.5 ? hairS : null)));
    const backHair = shape.move(shape.ball(0.03, hair, 1), 0, 0.04, -0.012, 0, 0, 0, 0.95, 1, 0.9); shape.paint(backHair, (c, n) => (n.x < -0.3 || n.y < -0.3 ? hairS : null));
    const nose = shape.move(shape.ball(0.0075, mix(face, hair, 0.35), 1), 0, 0.03, 0.033);
    const gCHead = inked(shape.merge([skullC, nose, tuft, ...sideHair, backHair]), THIN, ink);
    const gArm = inked(shape.merge([limb([[-0.01, 0, 0.012, 0.012], [0.01, 0, 0.022, 0.022], [0.07, 0, 0.027, 0.025], [0.125, 0, 0.021, 0.02], [0.14, 0, 0.011, 0.011]], (p, n) => suitTone(n), { around: 10, sub: 3 }), shape.move(shape.ball(0.013, face, 1), 0, -0.15, 0)]), THIN, ink);
    const legC = limb([[-0.012, 0, 0.014, 0.014], [0.01, 0, 0.03, 0.03], [0.07, 0, 0.034, 0.032], [0.112, 0, 0.026, 0.025], [0.124, 0, 0.0135, 0.0135], [0.1245, 0, 0.012, 0.012], [0.146, 0, 0.0115, 0.0115], [0.1465, 0, 0.004, 0.004]],
      (p, n) => (p.z > 0.1245 ? (Math.floor((p.z - 0.1245) / 0.0056) % 2 ? sockB.clone() : sockY.clone()) : (Math.hypot(p.z - 0.06, Math.atan2(p.x, p.y) * 0.03 - 0.012) < 0.016 && Math.hypot(p.z - 0.064, Math.atan2(p.x, p.y) * 0.03 - 0.003) > 0.0125 ? teal.clone() : suitTone(n))), { around: 12, sub: 4 });
    const gLeg = inked(shape.merge([legC, shape.move(shape.ball(0.016, shoe, 1), 0, -0.152, 0.016, 0, 0, 0, 0.95, 0.62, 1.9)]), THIN, ink);
    // the stool: white legs with an arch between them, and the red cloth thrown over it, cut up into the middle of each side
    const st = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) st.push(shape.move(shape.box(0.013, 0.18, 0.013, wood), sx * 0.052, 0.09, sz * 0.052));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; st.push(shape.move(shape.box(0.1, 0.012, 0.008, woodS), Math.sin(a) * 0.052, 0.07, Math.cos(a) * 0.052, 0, a)); }
    const red2 = red.clone().multiplyScalar(0.72), cloth = [shape.move(shape.box(0.142, 0.014, 0.142, red), 0, 0.193, 0)];
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, c = i % 2 ? red2 : mix(red, red2, 0.3); for (const [x, w, h] of [[-0.05, 0.042, 0.094], [0, 0.06, 0.04], [0.05, 0.042, 0.094]]) cloth.push(shape.move(shape.move(shape.box(w, h, 0.005, c), x, 0.188 - h / 2, 0.072), 0, 0, 0, 0, a)); }
    const gStool = inked(shape.merge([...st, ...cloth]), THIN, ink);
    // the hoop's rim (lying in its own x and y, the way through it z)
    const rimG = (() => { const g = new THREE.TorusGeometry(HR, 0.0085, 8, 44).toNonIndexed(); g.deleteAttribute('uv'); const c = new Float32Array(g.attributes.position.count * 3), n = g.attributes.normal; for (let i = 0; i < n.count; i++) { const k = mix(wood, woodS, clamp01(0.4 - n.getY(i) * 0.5)); c[i * 3] = k.r; c[i * 3 + 1] = k.g; c[i * 3 + 2] = k.b; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return inked(g, THIN, ink); })();
    // a flap of its paper: a tenth of the disc, hinged at the rim (its own y runs in to the middle); both its faces
    const paper = col('#fff8e6', 0.1).multiplyScalar(1.3), paperS = col('#ddd6d2', 0.15).multiplyScalar(1.15), HP = HR - 0.004;
    const flap = (() => {
      const half = Math.PI / NF + 0.004, n = 4, pos = [], cols = [], th = 0.0011, C = (k) => mix(paperS, paper, k);
      const pt = (g, z) => [HP * Math.sin(g), HP * (1 - Math.cos(g)), z], apex = z => [0, HP, z];
      const tri = (a, b, c, ca, cb, cc) => { pos.push(...a, ...b, ...c); for (const k of [ca, cb, cc]) cols.push(k.r, k.g, k.b); };
      for (let i = 0; i < n; i++) { const g0 = -half + 2 * half * i / n, g1 = -half + 2 * half * (i + 1) / n; tri(pt(g0, th), pt(g1, th), apex(th), C(0.55), C(0.55), C(1)); tri(pt(g1, -th), pt(g0, -th), apex(-th), C(0.3), C(0.3), C(0.75)); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals(); return g;
    })();
    const scrap = (w, h, k) => { const g = shape.box(w, h, 0.0016, mix(paperS, paper, k)); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getX(i) > 0 && p.getY(i) > 0) p.setXY(i, p.getX(i) * 0.35, p.getY(i) * 1.25); g.computeVertexNormals(); return g; };
    // a block of the kerb: pale, panelled, towards the ring; its red top; (its own z points out of the ring)
    const kerbPale = col('#d9d1c6', 0.3), kerbS = col('#b0a9b3', 0.3), kerbRed = col('#a93429', 0.35), kerbRed2 = col('#7c2a25', 0.35);
    const kb = shape.box(0.212, 0.056, 0.06, kerbPale); shape.move(kb, 0, 0.028, 0);
    shape.paint(kb, (c, n) => (n.z < -0.5 ? null : n.z > 0.5 ? kerbRed2 : kerbS));
    const kTop = shape.move(shape.box(0.214, 0.015, 0.072, kerbRed), 0, 0.0625, 0); shape.paint(kTop, (c, n) => (n.y > 0.5 ? null : n.z < -0.5 ? mix(kerbRed, kerbRed2, 0.35) : kerbRed2));
    const kLine = shape.move(shape.box(0.004, 0.05, 0.004, col('#6d6877', 0.3)), 0.104, 0.028, -0.03);
    const gKerb = inked(shape.merge([kb, kTop, kLine]), THIN, ink);
    const gFleck = shape.move(shape.ball(0.011, col('#d8d0c4', 0.3), 0), 0, 0, 0, 0, 0, 0, 1, 0.55, 1.2);

    // ---------------------------------------------------------- one rig for all of it
    const rig = this.rig = L.rig(NBH + 6 + 2 + NF + TORN.length + NSCRAP + NFLECK + CURB, 110000, L.paint({ glow: 0.5, rough: 1 }));
    const add = g => rig.add(rig.geo(g));
    const gid = { fu: rig.geo(gFU), fl: rig.geo(gFL), ht: rig.geo(gHT), hg: rig.geo(gHG), hl: rig.geo(gHL), arm: rig.geo(gArm), leg: rig.geo(gLeg), flap: rig.geo(flap), kerb: rig.geo(gKerb), fleck: rig.geo(gFleck) };
    this.H = [add(gBody), add(gNeck), add(gHead), rig.add(gid.fu), rig.add(gid.fu), rig.add(gid.fl), rig.add(gid.fl), rig.add(gid.ht), rig.add(gid.ht), rig.add(gid.hg), rig.add(gid.hg), rig.add(gid.hl), rig.add(gid.hl), add(gT1), add(gT2), ...gStr.map(add)];
    this.HM = Array.from({ length: NBH }, M4); this.strands = STRANDS;
    this.C = { torso: add(gTorso), head: add(gCHead), arms: [rig.add(gid.arm), rig.add(gid.arm)], legs: [rig.add(gid.leg), rig.add(gid.leg)], M: Array.from({ length: 4 }, M4) };
    this.stool = add(gStool); this.rim = add(rimG); this.hoopM = M4();
    this.flaps = Array.from({ length: NF }, (_, i) => ({ inst: rig.add(gid.flap), a: (i + 0.5) / NF * TAU, torn: TORN.includes(i), rest: 0.75 + 0.5 * hash(i, 3.1), len: 0.62 + 0.36 * hash(i, 9.3), seed: hash(i, 7.7) * TAU }));
    // what flies: the three torn flaps, and loose scraps
    const sg = [scrap(0.07, 0.05, 0.9), scrap(0.05, 0.06, 0.6), scrap(0.085, 0.04, 1)].map(g => rig.geo(g));
    this.scraps = [];
    TORN.forEach((fi, j) => this.scraps.push({ inst: rig.add(gid.flap), flap: this.flaps[fi], j }));
    for (let j = 0; j < NSCRAP; j++) this.scraps.push({ inst: rig.add(sg[j % 3]), flap: null, j: j + TORN.length });
    this.scraps.forEach(s => {
      const r = k => hash(s.j * 3.7 + k, 16.146);
      s.a = s.flap ? s.flap.a : r(1) * TAU; s.rad = s.flap ? HR * 0.55 : HR * (0.15 + 0.6 * r(2));
      s.fwd = 0.75 + 1.25 * r(3); s.side = 0.35 + 0.9 * r(4); s.up = 0.35 + 1.25 * r(5); s.k = 2.6 + 1.6 * r(6); s.vt = 0.34 + 0.24 * r(7);
      s.spin = [2 + 5 * r(8), 2 + 6 * r(9), r(10) * TAU]; s.sway = 0.05 + 0.07 * r(11); s.lie = r(12) * TAU;
      // (when it comes down: found once, so that any moment can be posed)
      const y0 = HY + Math.sin(s.a) * s.rad, yAt = x => y0 + (s.up + s.vt) * (1 - Math.exp(-s.k * x)) / s.k - s.vt * x - 0.006;
      let lo = 0.05, hi = 8; for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (yAt(mid) > 0) lo = mid; else hi = mid; } s.land = hi; s.y0 = y0;
    });
    this.flecks = Array.from({ length: NFLECK }, (_, i) => ({ inst: rig.add(gid.fleck), i }));
    this.kerb = Array.from({ length: CURB }, (_, j) => { const deg = 155 + j * 10, end = Math.min(j, CURB - 1 - j); return { inst: rig.add(gid.kerb), th: deg * Math.PI / 180, t0: 0.22 + Math.abs(deg - 270) / 120 * 0.85, h: end === 0 ? 0.4 : end === 1 ? 0.72 : 1 }; });
    this.all = rig.count;

    // ---------------------------------------------------------- the sawdust: one mesh, one shader
    // His ring floor: pale, warm grey and lilac, brushed thin and round the ring; it runs to the kerb behind and at the
    // sides and breaks up stroke by stroke towards you. The grey's shadow and the stool's lie on it in his lilac.
    const saw = floorStrokes({ size: 256, seed: 16146, n: 1100, len: [9, 25], width: [1.6, 3.6], bend: 0.3, lift: 0.1, base: col('#c6beb7', 0.35).getStyle(),
      colors: [['#d3ccc3', 3], ['#bcb4b1', 3], ['#c8bfc6', 2], ['#dcd5c8', 1.4], ['#aba3a6', 1], ['#cfc3b2', 1]].map(([c, w]) => [col(c, 0.35).getStyle(), w]),
      angle: (x, y, r) => Math.atan2(y - 0.5, x - 0.5) + Math.PI / 2 + (r() - 0.5) * 0.55 });
    {
      const F = (u, o) => L.floor(u, o, V3()).toArray(), a = F(CU - 1.4, -L.wall), b = F(CU + 1.4, -L.wall), c = F(CU + 1.4, CO + 1.4), d = F(CU - 1.4, CO + 1.4);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
      const u = this.u = { uSpread: { value: 0 }, uDim: { value: 0.36 }, tSaw: { value: saw }, uO: { value: L.floor(CU, CO) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) },
        uRing: { value: new THREE.Vector4(RC, RSAW, R, CO) }, uSh: { value: new THREE.Vector4(0, 0, 0, 1) }, uShK: { value: 0 }, uSh2: { value: new THREE.Vector4(0, 0, 0.17, 0) }, uShade: { value: col('#8a8496', 0.3) } };
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
      m.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, u);
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform float uSpread, uDim, uShK; uniform vec3 uO, uShade; uniform vec4 uAx, uRing, uSh, uSh2; uniform sampler2D tSaw; vec3 fCol; float fA;')
          .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz, p = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw));       // along the wall and out from it, from the ring's middle
  float r = length(p);
  vec4 s1 = texture2D(tSaw, p / 2.7 + 0.5), s2 = texture2D(tSaw, p / 1.15 + 0.37);
  float front = smoothstep(0.3, 0.85, p.y), jit = (s1.a - 0.55) * 0.3 + (s2.a - 0.55) * 0.2;
  // to the kerb behind and at the sides; a ragged edge towards you, the boards showing between the last strokes
  float a = 1.0 - smoothstep(-0.012, 0.012, r - mix(uRing.x + 0.012, uRing.y + 0.1 + 0.09 * sin(atan(p.x, p.y) * 5.0 + 1.0), front) + jit * mix(0.04, 0.9, front));
  float thin = smoothstep(0.52, 1.12, r + 0.05 * sin(atan(p.x, p.y) * 7.0)), id = s1.a * 0.62 + s2.a * 0.38;
  a *= mix(1.0, smoothstep(thin * 0.92 - 0.04, thin * 0.92 + 0.05, id), front);
  float grow = length(p - vec2(0.0, -uRing.w)) + (s1.a - 0.55) * 0.4;
  fA = a * smoothstep(0.0, 0.06, uSpread * 3.0 - grow) * 0.96;
  vec3 c = s1.rgb * (1.0 - 0.08 * exp(-pow((r - uRing.z) / 0.11, 2.0)) * (0.4 + s2.a));        // the track, a little churned
  vec2 d = p - uSh.xy; float sh = exp(-(pow(dot(d, uSh.zw) / 0.3, 2.0) + pow(dot(d, vec2(-uSh.w, uSh.z)) / 0.125, 2.0))) * uShK;
  d = p - uSh2.xy; sh = max(sh, exp(-dot(d, d) / (uSh2.z * uSh2.z)) * uSh2.w);
  c = mix(c, uShade * 0.8, sh * 0.6);
  fCol = c * uDim * mix(0.8, 1.0, smoothstep(-1.2, 0.2, p.y));
}`)
          .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
      };
      m.customProgramCacheKey = () => 'lautrec-sawdust';
      this.floor = new THREE.Mesh(g, m); this.floor.position.y = 0.012; this.floor.renderOrder = 5; L.add(this.floor);
    }

    // ---------------------------------------------------------- where things go
    const ring = (th, r) => [CU + r * Math.cos(th), CO + r * Math.sin(th)];
    this.Q = ring(TH, RST);                                                 // the stool's place
    const C3 = pts => { const c = new THREE.CatmullRomCurve3(pts.map(([u, o]) => V3(u, 0, o)), false, 'centripetal'); c.arcLengthDivisions = 160; c.updateArcLengths(); return c; };
    // the grey's way in: from inside the wall under the picture, aslant, on to the track at the hoop's place
    { const [pu, po] = ring(TH, R), hu = Math.sin(TH), ho = -Math.cos(TH); this.entry = C3([[0.44, -0.86], [0.2, -0.42], [pu - hu * 0.62, po - ho * 0.62], [pu - hu * 0.25, po - ho * 0.25 + 0.012], [pu, po]]); this.entryLen = this.entry.getLength(); }
    // the clown's run: out from under the rail to the foot of his stool; the stool's tumble
    this.cRun = [[-0.7, -0.36], [-0.8, 0.14], [this.Q[0] + 0.075, this.Q[1] - 0.2]];
    this.sRun = [[-0.78, -0.32], this.Q];
    this.band = this.makeScore(L);
    this.crowd = L.voice().loop({ lp: 900, hp: 220 });
    this.hideAll();
  },

  // ---------------------------------------------------------- the band, on the show's clock
  makeScore(L) {
    const s = score(L), bpm = 60 / EIGHTH;
    // the call, on a cornet
    s.tune(CALL, 0.1, 60 / 0.27, { type: 'sawtooth', vol: 0.009, legato: 0.8 });
    s.tune(CALL, 0.1, 60 / 0.27, { type: 'triangle', vol: 0.034, legato: 0.8, over: 2, overVol: 0.3 });
    // the galop
    const tune = (sc, mel, t, vol) => { sc.tune(mel, t, bpm, { type: 'triangle', vol, over: 2, overVol: 0.32, legato: 0.78 }); sc.tune(mel, t, bpm, { type: 'sawtooth', vol: vol * 0.2, legato: 0.6 }); };
    const under = (sc, t, bar, vol) => HARM[bar - 1].forEach((h, i) => {
      const [bass, ch] = CH[h], at = t + i * BEAT;
      sc.note(at, hz(bass), 0.2, { type: 'triangle', vol: 0.04 * vol, attack: 0.005 });
      for (const m of ch) sc.note(at + 2 * EIGHTH, hz(m), 0.09, { type: 'triangle', vol: 0.0095 * vol, attack: 0.004 });
      sc.hit(at + 2 * EIGHTH, { d: 0.05, vol: 0.006 * vol, bp: 3000, q: 0.8 });
    });
    tune(s, G_IN + G_A + G_END1 + G_A + G_END2, T0, 0.032);
    for (let b = 1; b <= 18; b++) under(s, tb(b), b, b < 3 ? 0.7 : 1);
    // the drum: a roll that swells through bar 5, to the downbeat
    for (let t = tb(5) - 0.25; t < T_BURST - 0.03; t += 0.036) s.hit(t, { d: 0.05, vol: 0.004 + 0.022 * Math.pow(ramp(t, tb(5) - 0.25, T_BURST), 1.6), bp: 2400, q: 0.7 });
    // the house claps
    for (let i = 0; i < 80; i++) { const t = T_BURST + 0.45 + L.rand() * 2.3 * Math.sqrt(L.rand()); s.hit(t, { d: 0.035, vol: 0.009 + L.rand() * 0.011, bp: 1200 + L.rand() * 1800, q: 1.2 }); }
    // its hooves on the sawdust: the canter's three beats, the last on the beat; none while it is in the air
    const hooves = (sc, t, landing, k) => {
      const thud = (at, f, v) => { sc.note(at, f, 0.11, { type: 'sine', vol: 0.05 * v * k, to: f * 0.55, attack: 0.004 }); sc.hit(at, { d: 0.05, vol: 0.011 * v * k, lp: 500 }); };
      if (landing) { thud(t + 0.11, 84, 1.25); thud(t + 0.19, 96, 0.8); thud(t + 0.27, 104, 0.7); return; }
      thud(t - BEAT / 3, 104, 0.55); thud(t - BEAT / 6, 96, 0.65); thud(t, 82, 1);
    };
    // (beat n of the show: T0 + n beats; the grey takes off on beat 10, 18, 26 ... and lands a beat later)
    for (let n = 1; n < 36; n++) hooves(s, T0 + n * BEAT, n >= 11 && (n - 11) % 8 === 0, n < 3 ? 0.5 : 1);
    // while you keep looking: bars 3 to 18 again and again, more quietly; the hooves; a few hands each time it goes through
    const again = score(L), per = 16 * BAR;
    tune(again, G_A + G_END1 + G_A + G_END2, 0, 0.021);
    for (let b = 0; b < 16; b++) under(again, b * BAR, b + 3, 0.6);
    for (let n = 0; n < 32; n++) hooves(again, n * BEAT, (n - 7) % 8 === 0, 0.8);
    for (let lap = 0; lap < 4; lap++) for (let i = 0; i < 14; i++) again.hit(lap * LAP + 3 * BAR + 0.5 + L.rand() * 1.2, { d: 0.035, vol: 0.006 + L.rand() * 0.006, bp: 1300 + L.rand() * 1600, q: 1.2 });
    s.loop(tb(19), per, again.ev);
    return s.done();
  },

  hideAll() {
    const r = this.rig; for (let i = 0; i < this.all; i++) r.show(i, false);
    this.floor.visible = false; this.u.uSpread.value = 0; this.u.uShK.value = 0; this.u.uSh2.value.w = 0;
  },
  start(L, resumed) {
    if (!resumed) this.hideAll();
    this.band.from(L.t); this.lastT = L.t - 1e-3; this.home = null;
    if (!this.told && !L.quiet) { this.told = true; L.k.say('The Cirque Fernando, Montmartre. The band strikes up, and a clown holds out the paper hoop.', 4.5); }
  },
  back(L) {
    // where the grey is, and its way home: round to the middle of the ring and in under the picture
    const t = L.t, o = this.horseAt(L, t, this.o), J = this.jump(t);
    if (o.vis) {
      const pts = [[o.u, o.out], [o.u + o.hu * 0.26, o.out + o.ho * 0.26]];
      if (o.ho > -0.3 || o.out < 0.7) pts.push([lerp(o.u + o.hu * 0.45, CU, 0.75), lerp(o.out + o.ho * 0.3, CO - 0.1, 0.75)]);
      pts.push([0.16, 0.42], [0.3, -0.2], [0.42, -0.9]);
      const c = new THREE.CatmullRomCurve3(pts.map(([u, q]) => new THREE.Vector3(u, 0, q)), false, 'centripetal'); c.arcLengthDivisions = 160; c.updateArcLengths();
      this.home = { c, len: c.getLength(), ph: (t - T0) / BEAT, h: J.h, jw: J.w, jt: J.t, lean: o.lean };
    } else this.home = null;
    this.spread0 = this.u.uSpread.value;
    if (!L.quiet) { const v = L.voice(); if (v.ctx) { v.note(110, 0.16, { vol: 0.04, type: 'triangle', at: 0.05 }); v.note(165, 0.16, { vol: 0.03, type: 'triangle', at: 0.3 }); noise(v, 1.5, { d: 0.5, vol: 0.012, hp: 4200 }); } }
  },
  end() { this.hideAll(); this.crowd.set(0); },
  reset() { this.hideAll(); this.crowd.set(0); this.told = false; this.told2 = false; },

  // ---------------------------------------------------------- the grey: where it is at show-time t
  horseAt(L, t, o) {
    if (t >= T_JOIN) {
      const th = TH - TAU * (t - T_JOIN) / LAP, r = this.trackR(th), r2 = this.trackR(th - 0.03), c = Math.cos(th), s = Math.sin(th);
      o.u = CU + r * c; o.out = CO + r * s; o.hu = CU + r2 * Math.cos(th - 0.03) - o.u; o.ho = CO + r2 * Math.sin(th - 0.03) - o.out;
      const l = Math.hypot(o.hu, o.ho) || 1; o.hu /= l; o.ho /= l; o.lean = 1; o.vis = true; return o;
    }
    const k = 1 - SPEED * (T_JOIN - t) / this.entryLen;
    if (k <= 0) { o.vis = false; o.u = 0.44; o.out = -0.86; o.hu = 0; o.ho = 1; o.lean = 0; return o; }
    this.entry.getPointAt(k, this.V); this.entry.getTangentAt(Math.min(k, 0.999), this.W);
    o.u = this.V.x; o.out = this.V.z; o.hu = this.W.x; o.ho = this.W.z; o.lean = ease.smooth(ramp(k, 0.62, 1)); o.vis = true; return o;
  },
  // The track is a circle, but the toy may be standing on it (you park where you like to look): then the grey swings
  // wide of it, to the inside if there is room, and comes back to its line. Never at the hoop: there it goes over.
  trackR(th) {
    const T = this.toy; if (!T) return R;
    const d = Math.abs(Math.atan2(Math.sin(th - T.th), Math.cos(th - T.th))), h = Math.abs(Math.atan2(Math.sin(th - TH), Math.cos(th - TH)));
    return R + (T.r - R) * (1 - ease.smooth(ramp(d, 0.35, 1.05))) * ease.smooth(ramp(h, 0.3, 0.8));
  },
  // the leap: how high (h), how much of it is the leap's own pose (w), and where in it (t: -1 off the ground, 0 at the hoop, 1 down)
  jump(t) {
    const J = this.J || (this.J = { h: 0, w: 0, t: 0, n: -1 }), n = Math.round((t - T_PASS) / LAP);
    J.h = 0; J.w = 0; J.t = 0; J.n = n;
    if (n < 0) return J;
    const x = t - (T_PASS + n * LAP), a = Math.abs(x);
    if (a < TJ) J.h = HJ * (1 - (x / TJ) * (x / TJ));
    J.w = 1 - ease.smooth(ramp(a, TJ - 0.02, TJ + 0.15)); J.t = Math.max(-1, Math.min(1, x / TJ));
    return J;
  },

  // ---------------------------------------------------------- every frame
  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', Rr = showing ? 0 : L.ret, t = L.t, calm = L.calm, r = this.rig, B = this.B, U = this.u, V = this.V, o = this.o;
    this.floor.visible = true;
    U.uSpread.value = showing ? ease.out(ramp(t, 0.03, 1.5)) : this.spread0 * (1 - ease.inOut(ramp(Rr, 0.58, 1)));

    // ---- the kerb, block by block from the middle of the back
    for (const k of this.kerb) {
      const up = showing ? ease.outBack(ramp(t, k.t0, k.t0 + 0.32)) : 1 - ease.inOut(ramp(Rr, 0.5 + (k.t0 - 0.22) * 0.2, 0.74 + (k.t0 - 0.22) * 0.2));
      const on = up > 0.01 && (showing ? t > k.t0 : true); r.show(k.inst, on); if (!on) continue;
      const c = Math.cos(k.th), s = Math.sin(k.th); L.floor(CU + (RC + 0.03) * c, CO + (RC + 0.03) * s, V);
      r.put(k.inst, V.x, L.y - 0.002, V.z, L.yawOf(c, s), 0, 0, this.W.set(1, up * k.h, 1));
    }

    // ---- the grey (and where the toy stands, if it is in its way)
    { const v = L.k.G.vehicle; this.toy = null;
      if (v && v.group && v.group.visible && Math.abs(v.pos.y - L.y) < 0.5) { const q = L.local(v.pos.x, v.pos.z), du = q.u - CU, dout = q.out - CO, rt = Math.hypot(du, dout); if (Math.abs(rt - R) < CLEAR) this.toy = { th: Math.atan2(dout, du), r: Math.max(0.24, Math.min(1.04, rt + (rt >= R - 0.14 ? -CLEAR : CLEAR))), u: q.u, out: q.out }; else if (rt < RC) this.toy = { th: 0, r: R, u: q.u, out: q.out }; } }
    let hs = null;
    if (showing) {
      const H = this.horseAt(L, t, o);
      if (H.vis) { const J = this.jump(t); hs = this.hs || (this.hs = {}); hs.u = H.u; hs.out = H.out; hs.hu = H.hu; hs.ho = H.ho; hs.lean = H.lean; hs.ph = (t - T0) / BEAT; hs.h = J.h; hs.jw = J.w; hs.jt = J.t; hs.amp = 1; hs.slow = 0; }
    } else if (this.home) {
      const hm = this.home, k = ease.inOut(ramp(Rr, 0.02, 0.86)), c = hm.c, k2 = Math.min(1, k + 0.07), fall = 1 - ease.smooth(ramp(Rr, 0, 0.14));
      if (k < 0.995) {
        c.getPointAt(k, V); c.getTangentAt(Math.min(k, 0.995), this.W); c.getTangentAt(Math.min(k2, 0.995), this.X);
        hs = this.hs || (this.hs = {}); hs.u = V.x; hs.out = V.z; hs.hu = this.W.x; hs.ho = this.W.z;
        if (this.toy) { const du = hs.u - this.toy.u, dout = hs.out - this.toy.out, d = Math.hypot(du, dout) || 1e-3; if (d < CLEAR) { const push = (CLEAR - d) * ease.smooth(ramp(d, 0, 0.12) + 0.5); hs.u += du / d * push; hs.out += dout / d * push; } }
        hs.lean = Math.max(-1, Math.min(1, lerp((this.W.z * this.X.x - this.W.x * this.X.z) * 3.2, hm.lean, fall)));
        hs.ph = hm.ph + k * hm.len / (SPEED * BEAT); hs.h = hm.h * fall; hs.jw = hm.jw * fall; hs.jt = hm.jt; hs.amp = 0.9; hs.slow = k;
      }
    }
    const hOn = !!hs && hs.out > -L.wall - 0.5;
    for (const i of this.H) r.show(i, hOn);
    if (hOn) this.poseHorse(L, hs, t);
    U.uShK.value = hOn ? clamp01(1 - hs.h * 3.2) * ease.smooth(ramp(hs.out, -0.1, 0.25)) : 0;
    if (hOn) U.uSh.value.set(hs.u - CU + hs.ho * 0.06 * hs.lean, hs.out - CO - hs.hu * 0.06 * hs.lean, hs.hu, hs.ho);

    // ---- the stool, the clown, the hoop
    // (going home they do what they did coming out, backwards: the clown's own clock runs back from where it was)
    const cc = showing ? t : lerp(Math.min(t, T_UP + 0.05), T_RUN0 - 0.05, ease.inOut(ramp(Rr, 0.2, 0.84)));
    const sc = showing ? t : lerp(Math.min(t, T_ST1), T_ST0 - 0.02, ease.inOut(ramp(Rr, 0.42, 0.92)));
    this.poseStool(L, sc, calm);
    this.poseClown(L, t, cc, showing, Rr, hOn ? hs : null, calm);

    // ---- sawdust from its hooves
    this.dust(L, t, showing, calm);

    // ---- the sound of it
    L.voice().level = calm ? 0.6 : 1;
    if (showing) {
      this.band.play(t);
      if (!L.quiet && this.lastT < T_BURST - 0.3 && t >= T_BURST - 0.3) this.crash(L, T_BURST - t, calm);
      if (!L.quiet && !this.told2 && this.lastT < T_BURST + 0.5 && t >= T_BURST + 0.5) { this.told2 = true; L.k.say('Through the paper! In the picture that leap is still to come, and it is the rider’s.', 4.5); }
    }
    const cam = L.k.G.camera.position, near = Math.max(0, 1 - Math.hypot(cam.x - L.cx, cam.z - L.cz) / 12);
    const cheer = showing ? ease.out(ramp(t, T_BURST + 0.3, T_BURST + 0.6)) * (1 - ease.smooth(ramp(t, T_BURST + 2.0, T_BURST + 3.2))) : 0;
    this.crowd.set(L.quiet ? 0 : (calm ? 0.5 : 1) * near * (0.016 * cheer + (showing ? 0.004 * ramp(t, 0.6, 1.6) : 0)));
    L.voice().place(L.cx + L.nx * 1.1, L.cz + L.nz * 1.1);
    this.lastT = t;
  },

  // The paper tearing, the cymbal and the big drum: the only sudden sounds, so not at all when motion and flashing are
  // reduced (then only a soft brush of the cymbal).
  crash(L, at, calm) {
    const v = L.voice(); if (!v.ctx) return;
    if (calm) { noise(v, at, { d: 1.2, vol: 0.012, hp: 5200, attack: 0.25 }); return; }
    noise(v, at - 0.01, { d: 0.16, vol: 0.05, bp: 2300, q: 0.6, attack: 0.004 }); noise(v, at + 0.03, { d: 0.22, vol: 0.022, hp: 5200 });       // the paper
    noise(v, at, { d: 1.7, vol: 0.04, hp: 3900 }); noise(v, at, { d: 0.25, vol: 0.05, lp: 170 });                                             // cymbal, drum
    for (const m of [45, 57, 61, 64, 69]) v.note(hz(m), 0.9, { at: Math.max(0, at), vol: m < 50 ? 0.03 : 0.006, type: m < 50 ? 'triangle' : 'sawtooth', attack: 0.01 });
  },

  // ---------------------------------------------------------- the grey at a canter, and over
  // s: where (u, out), heading (hu, ho), ph (strides gone: the near fore comes down on each whole one), lean (into the
  // bend), h, jw, jt (the leap), amp.
  poseHorse(L, s, t) {
    const B = this.B, M = this.HM, a = TAU * s.ph, jw = s.jw, jt = s.jt, cw = 1 - jw, yaw = L.yawOf(s.hu, s.ho);
    const roll = -0.3 * s.lean * (1 - 0.6 * jw);
    // it rocks: down in front as the leading fore leg takes its weight, up as the hind legs come under it
    const rock = 0.075 * Math.cos(a - 0.6) * cw * s.amp + 0.24 * Math.sin(jt * Math.PI / 2) * jw;
    const bob = 0.011 * Math.cos(a - TAU * 0.48) * cw;
    L.floor(s.u, s.out, this.V);
    B.set(M[ROOT], this.V.x, L.y + H0 * Math.cos(roll) + bob * SC + s.h, this.V.z, yaw, rock, roll, SC);
    // the neck arched and the head tucked in, as he has it; stretched out over the leap
    const neckP = lerp(-1.0 - 0.55 * rock + 0.04 * Math.cos(a + 1), -0.5 - 0.5 * rock, jw);
    B.child(M[NECK], M[ROOT], 0, 0.062, 0.16, 0.1 * s.lean * cw, neckP, 0);
    B.child(M[HEAD], M[NECK], 0, 0.008, 0.17, 0.08 * s.lean * cw, lerp(2.05 + 0.05 * Math.sin(a + 0.6), 1.0, jw), 0);
    for (let i = 0; i < 4; i++) {
      const [side, hind, p] = LEGS[i], q = frac(s.ph - p), j = i & 1, lag = side > 0 ? 0 : 0.08;
      if (!hind) {
        // a fore leg: straight under its weight, from reaching forward to well back; then the knee folds and it is
        // carried forward, unfolding to reach again
        const D = 0.3; let ang, fold;
        if (q < D) { ang = lerp(-0.42, 0.4, q / D); fold = 0.02; }
        else { const x = (q - D) / (1 - D); ang = lerp(0.4, -0.42, ease.smooth(x)) - 0.34 * Math.sin(Math.PI * x) * (1 - 0.4 * x); fold = 1.3 * Math.pow(Math.sin(Math.PI * Math.pow(x, 0.85)), 1.15); }
        const x = jt - lag, ja = lerp(-1.15, -0.62, ease.smooth(ramp(x, 0.25, 1))), jf = lerp(1.9, 0.1, ease.smooth(ramp(x, 0.3, 0.95)));
        ang = lerp(ang * s.amp, ja, jw); fold = lerp(fold, jf, jw);
        B.child(M[FU + j], M[ROOT], side * 0.056, -0.045, 0.146, 0, ang, 0); B.child(M[FL + j], M[FU + j], 0, -0.15, 0, 0, fold, 0);
      } else {
        // a hind leg: sw is the whole leg's swing from the hip, fl how far stifle and hock are folded (the hoof
        // drawn up under it), ex how far they are opened in the push
        const D = 0.32; let sw, fl, ex;
        if (q < D) { const x = q / D; sw = lerp(-0.4, 0.42, x); fl = 0.12 * (1 - x) * (1 - x); ex = ease.smooth(ramp(x, 0.45, 1)) * 0.75; }
        else { const x = (q - D) / (1 - D); sw = lerp(0.42, -0.4, ease.smooth(x)); fl = Math.pow(Math.sin(Math.PI * Math.pow(x, 0.8)), 1.1) * 0.82 + 0.12 * ease.smooth(ramp(x, 0.85, 1)); ex = 0.75 * (1 - ease.smooth(ramp(x, 0, 0.2))); }
        const x = jt + lag, js = x < 0 ? lerp(0.55, -0.1, ease.smooth(ramp(x, -0.85, 0))) : lerp(-0.1, -0.36, ease.smooth(ramp(x, 0.2, 1)));
        const jf = x < 0 ? ease.smooth(ramp(x, -0.85, -0.05)) : lerp(1, 0.22, ease.smooth(ramp(x, 0.3, 1))), je = 1 - ease.smooth(ramp(x, -0.95, -0.5));
        sw = lerp(sw * s.amp, js, jw); fl = lerp(fl, jf, jw); ex = lerp(ex, je, jw);
        B.child(M[HT + j], M[ROOT], side * 0.063, -0.014, -0.155, 0, -0.45 + 0.92 * sw - 0.45 * fl + 0.1 * ex, 0);
        B.child(M[HG + j], M[HT + j], 0, -0.1, 0, 0, 0.95 + 0.75 * fl - 0.35 * ex, 0);
        B.child(M[HL + j], M[HG + j], 0, -0.11, 0, 0, -0.55 - 0.95 * fl + 0.3 * ex, 0);
      }
    }
    // Its tail: carried a little up and out to the off side, as he has it. It follows the horse a moment late, each
    // part after the one above it: streaming back in the canter, lifting and opening in the leap, and settling as it
    // goes home.
    const stream = 1 - 0.55 * (s.slow || 0), lift = jw * (1 - 0.35 * jt), late = jw * (1 - 0.35 * Math.max(-1, jt - 0.45)), tw = 0.09 * Math.sin(a * 0.5 + 1);
    B.child(M[T1], M[ROOT], 0, 0.094, -0.214, tw, 0.42 + 0.56 * stream + 0.07 * Math.sin(a - 0.9) * stream + 0.4 * lift, -0.3 * s.lean * stream - 0.05);
    B.child(M[T2], M[T1], 0, -0.086, 0, tw * 1.1 + 0.05, -0.34 + 0.13 * Math.sin(a - 1.9) * stream + 0.2 * late, 0.08 * s.lean);
    for (let i = 0; i < NSTR; i++) {
      const [x, out] = this.strands[i], k = i - (NSTR - 1) / 2, lag = 2.9 + 0.33 * Math.abs(k) + 0.2 * i;
      B.child(M[TS + i], M[T2], x, -0.08, 0.002 * (i % 2 ? 1 : -1), 0.1 * Math.sin(a * 0.5 - lag) * stream,
        -0.3 + 0.24 * Math.sin(a - lag) * stream + 0.3 * late - 0.04 * Math.abs(k), -out * (1 + 0.3 * Math.sin(a - lag + 1) * stream + 0.7 * late) + 0.06 * s.lean);
    }
    for (let i = 0; i < NBH; i++) this.rig.mat(this.H[i], M[i]);
  },

  // ---------------------------------------------------------- the stool: two tumbling hops to its place
  poseStool(L, c, calm) {
    const k = ramp(c, T_ST0, T_ST1), on = k > 0; this.rig.show(this.stool, on);
    this.u.uSh2.value.set(this.Q[0] - CU, this.Q[1] - CO, 0.17, on ? 0.75 * ease.smooth(ramp(k, 0.8, 1)) : 0);
    if (!on) return;
    const [a, b] = this.sRun, e = k * k * (3 - 2 * k) * 0.35 + k * 0.65, u = lerp(a[0], b[0], e), out = lerp(a[1], b[1], e);
    const hopY = k < 1 ? Math.abs(Math.sin(k * TAU)) * 0.17 * (1 - 0.35 * k) : 0, turns = calm ? 1 : 2;
    const settle = c > T_ST1 ? 1 - 0.1 * Math.exp(-(c - T_ST1) * 14) * Math.cos((c - T_ST1) * 30) : 1;
    L.floor(u, out, this.V);
    this.rig.put(this.stool, this.V.x, L.y + hopY + (k < 1 ? 0.1 * Math.sin(k * Math.PI) : 0), this.V.z, L.yawOf(-Math.cos(TH), -Math.sin(TH)), k < 1 ? TAU * turns * k : 0, 0, this.W.set(SC, settle * SC, SC));
  },

  // ---------------------------------------------------------- the clown and his hoop
  // t: the show's clock (the hoop's part); c: his own (it runs back when he goes home).
  poseClown(L, t, c, showing, Rr, hs, calm) {
    const r = this.rig, B = this.B, C = this.C, M = C.M, V = this.V, Q = this.Q;
    const on = c > T_RUN0; for (const i of [C.torso, C.head, ...C.arms, ...C.legs, this.rim]) r.show(i, on);
    if (!on) { for (const f of this.flaps) r.show(f.inst, false); for (const s of this.scraps) r.show(s.inst, false); return; }
    // where he is: running out, hopping up, or on his stool
    let u, out, y = 0, hu, ho, run = 0, lean = 0.1, dy = 0;
    const [p0, p1, p2] = this.cRun, home = !showing;
    if (c < T_RUN1) {
      const k = ramp(c, T_RUN0, T_RUN1), a = 1 - k; u = a * a * p0[0] + 2 * a * k * p1[0] + k * k * p2[0]; out = a * a * p0[1] + 2 * a * k * p1[1] + k * k * p2[1];
      hu = 2 * a * (p1[0] - p0[0]) + 2 * k * (p2[0] - p1[0]); ho = 2 * a * (p1[1] - p0[1]) + 2 * k * (p2[1] - p1[1]); run = 1; lean = 0.22;
      if (home) { hu = -hu; ho = -ho; }
    } else {
      const k = ease.smooth(ramp(c, T_RUN1, T_UP)); u = lerp(p2[0], Q[0], k); out = lerp(p2[1], Q[1], k); y = STH * ease.smooth(ramp(k, 0, 0.8)) + 0.12 * Math.sin(Math.PI * k);
      hu = Q[0] - p2[0]; ho = Q[1] - p2[1]; if (home) { hu = -hu; ho = -ho; }
    }
    const onStool = c >= T_UP;
    // the hoop's place: which way it is held out from him (psi, on the floor's plan), and how far up (el)
    let psi, el;
    const hl = Math.hypot(hu, ho) || 1, runPsi = Math.atan2(ho / hl, hu / hl), tau = t - T_BURST;
    if (!onStool) { const k = ease.smooth(ramp(c, T_RUN1, T_RUN1 + 0.2)); psi = turnTo(runPsi, PSI_S, k); el = lerp(1.32, 0.25, k); }
    else if (t < T_SW0) { psi = PSI_S + 0.05 * Math.sin(t * 1.9); el = 0.25 + 0.08 * hump(t, T_UP + 0.1, T_UP + 1.0) + 0.02 * Math.sin(t * 2.6); }
    else if (tau < 0) { const k = ease.outBack(ramp(t, T_SW0, T_SW1)); psi = lerp(PSI_S, PSI_P, k); el = 0.25 * (1 - ease.smooth(ramp(t, T_SW0, T_SW1))); }
    else {
      const n = Math.floor(tau / LAP), x = tau - n * LAP, w = 1 - ease.smooth(ramp(x, 0.8, 1.4)) + ease.smooth(ramp(x, LAP - 1.55, LAP - 0.95));
      const restPsi = PSI_P - (n ? 0.5 : 0.7), restEl = n ? 0.2 : 0.3 + 0.04 * Math.sin(t * (calm ? 2.5 : 5));
      psi = lerp(restPsi, PSI_P, w) + 0.3 * Math.exp(-3.4 * x) * Math.cos(7.5 * x) * ramp(x, 0, 0.06) * (n ? 0.5 : 1); el = lerp(restEl, 0, w);
      dy = (n ? 0.5 : 1) * 0.02 * Math.exp(-2.5 * x) * Math.abs(Math.sin(9 * x)) + (1 - w) * (n ? 0 : 0.012 * Math.abs(Math.sin(t * (calm ? 3 : 6))));
    }
    // (bracing as it comes; a bow before he goes)
    const brace = onStool && showing ? ease.smooth(ramp(tau, -0.7, -0.15)) * (1 - ramp(tau, 0, 0.12)) : 0, bow = home ? hump(Rr, 0.0, 0.22) : 0;
    dy -= 0.014 * brace; lean = onStool ? 0.06 + 0.1 * brace + 0.55 * bow : lean;
    if (home && onStool) { psi = turnTo(psi, PSI_S, ease.smooth(ramp(Rr, 0, 0.2))); el = lerp(el, 0.25, ease.smooth(ramp(Rr, 0, 0.2))); }
    const cp = Math.cos(psi), sp = Math.sin(psi), ce = Math.cos(el), se = Math.sin(el);
    // his body: turned mostly to the hoop
    const w = run ? c * TAU * 3.1 : 0, bodyYaw = run ? L.yawOf(hu, ho) : L.yawOf(Math.cos(psi + 0.35), Math.sin(psi + 0.35));
    L.floor(u, out, V);
    const fy = L.y + y + dy + (run ? 0.012 * Math.abs(Math.sin(w)) : 0);
    B.set(M[0], V.x, fy, V.z, bodyYaw, lean, 0, SC);
    r.mat(C.torso, M[0]);
    for (let s = 0; s < 2; s++) {
      const sw = run ? 0.75 * Math.sin(w + s * Math.PI) : onStool ? (s ? 0.08 : -0.08) * (1 + brace) : (s ? -0.5 : 0.35) * Math.sin(Math.PI * ramp(c, T_RUN1, T_UP));
      B.child(M[1], M[0], s ? -0.027 : 0.027, 0.152, 0, 0, sw - lean, s ? 0.05 : -0.05); r.mat(C.legs[s], M[1]);
    }
    // the hoop: held by its near edge at his chest; X runs out along it from his hands, Z is the way through it
    const gx = u + cp * GRIP, go = out + sp * GRIP, gy = fy + 0.268 * SC + 0.04 * se, hx = gx + cp * ce * HR, ho2 = go + sp * ce * HR, hy = gy + se * HR;
    const X = this.X.set(L.tx * cp * ce + L.nx * sp * ce, se, L.tz * cp * ce + L.nz * sp * ce), Z = this.Z.set(-L.tx * sp + L.nx * cp, 0, -L.tz * sp + L.nz * cp), Y = this.Y.crossVectors(Z, X);
    L.floor(hx, ho2, V);
    const HM = this.hoopM.makeBasis(X, Y, Z).setPosition(V.x, hy, V.z);
    r.mat(this.rim, HM);
    // his head: he watches the grey (the paper, until it comes)
    let look = bodyYaw;
    if (hs && onStool) look = turnTo(bodyYaw, L.yawOf(hs.u - u, hs.out - out), 1);
    let dl = Math.atan2(Math.sin(look - bodyYaw), Math.cos(look - bodyYaw)); dl = Math.max(-1.35, Math.min(1.35, dl));
    this.headYaw = this.headYaw == null || L.quiet ? dl : this.headYaw + (dl - this.headYaw) * 0.25;
    B.child(M[2], M[0], 0, 0.296, 0, this.headYaw, -0.1 - 0.5 * lean, 0); r.mat(C.head, M[2]);
    // his arms: from each shoulder to the rim
    for (let s = 0; s < 2; s++) {
      const S = this.W.set(s ? -0.056 : 0.056, 0.268, 0.004).applyMatrix4(M[0]), ga = Math.PI + (s ? -0.3 : 0.3) * (Y.y >= 0 ? 1 : -1);
      const G = V.set(Math.cos(ga) * HR, Math.sin(ga) * HR, 0).applyMatrix4(HM);
      this.arm(C.arms[s], S, G);
    }
    // the paper: whole, then flaps blown open the way the grey goes, some of them torn away (it gives a moment before
    // the beat, as its nose touches it)
    const tf = tau + 0.05, burst = tf >= 0, n = burst ? Math.floor(tf / LAP) : 0, x = burst ? tf - n * LAP : 0;
    const pass = burst ? ramp(x, 0, 0.1) * (1 - ease.smooth(ramp(x, 0.62, 1.0))) : 0, wf = calm ? 5 : 10;
    for (const f of this.flaps) {
      const vis = !(burst && f.torn); r.show(f.inst, vis); if (!vis) continue;
      let phi = 0;
      if (burst) phi = (n ? f.rest : f.rest * ease.out(ramp(x, 0, 0.14))) + (1.5 - f.rest) * pass * (n ? 0.8 : 1) + (x > 0.62 ? 0.22 * Math.exp(-2.4 * (x - 0.62)) * Math.sin(wf * (x - 0.62) + f.seed) : 0) + 0.04 * Math.sin(t * (calm ? 1.6 : 3.1) + f.seed);
      this.m1.makeRotationZ(f.a + Math.PI / 2); this.m2.makeRotationX(phi); this.m1.multiply(this.m2); if (burst) this.m1.multiply(this.m2.makeScale(1, lerp(1, f.len, ramp(tf, 0, 0.06)), 1));
      this.m1.setPosition(Math.cos(f.a) * (HR - 0.004), Math.sin(f.a) * (HR - 0.004), 0);
      r.mat(f.inst, this.m2.multiplyMatrices(HM, this.m1));
    }
    this.scrapsFly(L, tf, showing, Rr, calm);
  },
  // An arm from shoulder S to the hand's place G (it is a loose sleeve: it reaches).
  arm(inst, S, G) {
    const Y = this.Y2 || (this.Y2 = new THREE.Vector3()), X = this.X2 || (this.X2 = new THREE.Vector3()), Z = this.Z2 || (this.Z2 = new THREE.Vector3());
    Y.subVectors(S, G); const len = Y.length() || 1e-3; Y.multiplyScalar(1 / len);
    X.set(0, 0, 1).cross(Y); if (X.lengthSq() < 1e-4) X.set(1, 0, 0); X.normalize(); Z.crossVectors(X, Y);
    const k = Math.max(0.6, Math.min(1.5, len / (0.155 * SC)));
    this.rig.mat(inst, this.m1.makeBasis(X.multiplyScalar(SC), Y.multiplyScalar(k * SC), Z.multiplyScalar(SC)).setPosition(S.x, S.y, S.z));
  },

  // ---------------------------------------------------------- the torn paper: thrown the way the grey goes, fluttering down
  scrapsFly(L, tau, showing, Rr, calm) {
    const r = this.rig, on = tau >= 0, gone = showing ? 1 : 1 - ease.inOut(ramp(Rr, 0.25, 0.7));
    const hu = Math.sin(TH), ho = -Math.cos(TH), ru = -Math.cos(TH), ro = -Math.sin(TH), hc = [CU + R * Math.cos(TH), CO + R * Math.sin(TH)];
    for (const s of this.scraps) {
      const vis = on && gone > 0.02; r.show(s.inst, vis); if (!vis) continue;
      // (in the hoop's plane: across it is the way to the ring's middle, and up)
      const x = Math.min(tau, s.land), e = (1 - Math.exp(-s.k * x)) / s.k, ca = Math.cos(s.a), air = 1 - ease.smooth(ramp(tau, s.land - 0.12, s.land + 0.05));
      const across = ca * s.rad + (0.42 + 0.6 * ca) * s.side * e + s.sway * Math.sin(x * 4.2 + s.spin[2]) * Math.min(1, x * 2) * air, fwd = 0.04 + s.fwd * e;
      const u = hc[0] + ru * across + hu * fwd, out = hc[1] + ro * across + ho * fwd, y = Math.max(0.006, s.y0 + (s.up + s.vt) * e - s.vt * x - 0.006);
      L.floor(u, out, this.V);
      const sp = calm ? 0.5 : 1;
      r.put(s.inst, this.V.x, L.y + y + (1 - air) * 0.004, this.V.z, s.lie + x * s.spin[0] * sp * 0.6, (Math.PI / 2) * (1 - air) + air * (x * s.spin[1] * sp + s.spin[2]), air * Math.sin(x * s.spin[0] * sp) * 0.9, gone * (s.flap ? 0.62 : 1.15));
    }
  },

  // ---------------------------------------------------------- sawdust: kicked back from its hind feet each stride; a spray where it lands
  dust(L, t, showing, calm) {
    const r = this.rig, o = this.o2;
    for (const f of this.flecks) {
      let vis = false;
      if (showing) {
        const land = f.i >= 8;
        // (each fleck belongs to one stride's push, or to one landing)
        let t0, n;
        if (land) { n = Math.floor((t - T_PASS - TJ) / LAP); t0 = T_PASS + TJ + n * LAP; if (n < 0) t0 = -1; }
        else { n = Math.floor((t - T0) / BEAT - 0.72); t0 = T0 + (n + 0.72) * BEAT; const J = Math.abs(((t0 - T_PASS) / LAP - Math.round((t0 - T_PASS) / LAP)) * LAP); if (J < TJ + 0.05 && t0 > T_PASS - 1) t0 = -1; }
        const age = t - t0, r1 = hash(f.i, n), r2 = hash(f.i + 9.1, n), r3 = hash(f.i + 4.3, n);
        if (t0 > 0 && age >= 0 && age < 0.5) {
          const H = this.horseAt(L, t0, o);
          if (H.vis && H.out > 0.05) {
            const vy = (land ? 1.2 : 0.85) + 0.8 * r1, y = vy * age - 3.9 * age * age;
            if (y > 0) {
              const back = (land ? -0.25 + 0.9 * r2 : 0.35 + 0.5 * r2) * age + (land ? -0.12 : 0.17), side = (r3 - 0.5) * (land ? 0.9 : 0.4) * age - 0.07;
              L.floor(H.u - H.hu * back + H.ho * side, H.out - H.ho * back - H.hu * side, this.V);
              r.put(f.inst, this.V.x, L.y + 0.012 + y, this.V.z, r1 * 6, age * (calm ? 4 : 9) * (r2 - 0.5), 0, (0.55 + 0.7 * r3) * (land ? 1.15 : 1) * Math.min(1, (0.5 - age) * 6));
              vis = true;
            }
          }
        }
      }
      r.show(f.inst, vis);
    }
  },
});
