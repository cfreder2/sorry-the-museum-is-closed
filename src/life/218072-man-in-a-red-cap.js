// South German (possibly Ulm), Portrait of a Man in a Red Cap (c. 1480), Gallery 238. The word: pair.
//
// A small panel half a metre high: a man the museum does not name, in a red cap, and in his hand at the
// foot of the picture a stem of pinks, two flowers on the one stalk: one turned full face and dark at its lip, one in
// profile, turned the way he is turned. The museum says the flower "was frequently associated with marriage vows"
// (and could also speak of the Incarnation, and so of his hope of salvation), and that the portrait "was perhaps
// paired with one of the sitter's wife, the two closing to form a diptych": a thing kept in a chest and brought out
// for family or friends. Only this panel hangs here. What the picture itself still has of a pair is on the stem.
//
// So the stem grows, on the floor under the painted hand: up out of a small tuft to its knot, where his two long
// leaves spring (one sweeping up to the left to a point, one curling round to the right and back over the stem), on
// to the fork with its two short leaves, and then the two stalks, each ending in a bud. The buds open as he painted
// them, the upper one full face, the lower one in profile. They stand so a while. Then the one in profile turns its
// face up, the full-face one bows to it, and the two close face to face, as the two panels perhaps did; they hold,
// part (the upper one lifting first) and stand again as he painted them, and so on every sixteen seconds for as long
// as you look. When you stop they part, close to buds, and the stem draws back down into the floor.
//
// It is one mesh cut from one sheet of paint (two draw calls with its floor shadow), every point placed each frame:
// the stalks keep their length and bend to get where they are going, a petal stands in its calyx and turns outward
// near its foot. The manner is his: a dark red-brown line drawn round every leaf and round the toothed lip of every
// petal, the red loaded on in tongues over crimson with dark dabs inside the lip, the full-face flower nearly black at
// its heart with one pale stroke there, the stalks going red-brown above the fork, everything lit from the upper
// left. The colours are taken from the picture's own palette and were matched by measure against the painted flowers
// as the game shows them. Two things are mine and not his: the tuft at the foot (he painted the stem cut; a cut stem
// standing on a floor would be a thing held by no one), and the few plucked notes, which are no one's tune: two lines
// that come to one note as the flowers close.
//
// How far it reaches (measured over the whole run and every way of going back): along the wall from 0.31 m left of
// the picture's middle to 0.07 m right of it (the picture's own frame is 0.25 m either way), from 0.11 to 0.40 m out
// from the wall, and no higher than 0.98 m, which is 0.32 m under the frame. That is 0.24 m short of the frame of
// The Nativity, in Coffer on its right and 0.54 m short of the Holy Family on its left, with nothing under or before
// either; its one long leaf ends below the near edge of Fridrich Rorbach's frame, more than half a metre under it.
// The Adventures of Ulysses and its sea are on the opposite wall, 8.4 m away.
// With motion reduced the sway is halved and the notes are softer; at any setting nothing in it flashes, spins,
// overshoots or sounds suddenly.
//
// It does not bring out the man, his hand or his cap, invents no wife and no second panel, gives him no name, and
// leaves the back of the panel (Death, and its line of Ovid) where the museum keeps it, because the museum knows no
// more of him than this, and a warning of death is not a thing to act out under a man's face.
import * as THREE from 'three';
import { lifeFor, ease, ramp, lerp, clamp01, canvasTexture, rng } from '../paintlife.js';
import { score } from './stagecraft.js';
import { hz } from './tunes.js';

const TAU = Math.PI * 2;
const nrm = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };

// ---- where it stands, and its measures (metres; x along the wall to the viewer's right, y up, z out from the wall)
const U0 = -0.06, OUT0 = 0.22;                       // its foot: under the painted hand, a hand's breadth from the wall
const K = 1.2;                                       // and its size: the measures below are multiplied by this
const FORK = [-0.02, 0.48, 0.0];                     // where the side stalk leaves the stem
const NODE = 0.66;                                   // how far up the lower stem the two long leaves spring
const LA = 0.27, LB = 0.178, CAL = 0.046;             // the two stalks above the fork (each keeps its length); a calyx
const GF = 0.6;                                      // how much of the growing is spent reaching the fork
// A pose: where each calyx begins and which way its flower faces, measured from the fork.
//   bud    as it grows: both stalks nearly straight
//   seen   as he painted them: one flower full face, one in profile, turned the way the man is turned
//   shut   the two brought face to face
const AX = nrm(0.80, 0.60, 0.0), MEET = [-0.045, 0.165, 0.035], HALF = 0.060, BACK = 0.026;
const POSE = {
  bud: [0.035, 0.262, 0.02, ...nrm(0.05, 1, 0.10), -0.104, 0.142, 0.02, ...nrm(-0.5, 0.86, 0.1)],
  seen: [0.03, 0.235, 0.065, ...nrm(-0.04, 0.20, 0.98), -0.095, 0.145, 0.03, ...nrm(-0.62, 0.74, 0.26)],
  shut: [MEET[0] + AX[0] * HALF, MEET[1] + AX[1] * HALF, MEET[2] + AX[2] * HALF, -AX[0], -AX[1], -AX[2],
    MEET[0] - AX[0] * HALF, MEET[1] - AX[1] * HALF, MEET[2] - AX[2] * HALF, AX[0], AX[1], AX[2]],
};
// ---- the clock
const T_SEEN = [2.0, 3.6], T_OPEN_A = [2.0, 3.3], T_OPEN_B = [2.5, 3.8];
const T_SHUT = 5.0, SHUT = 2.4, T_PART = 4.6, PART = 2.0, AGAIN = 16;      // begins to close at 5 s, parts at 9.6 s, and again every 16 s

// ---- the sheet of paint the whole plant is cut from (1024 x 512)
const AW = 1024, AH = 512, ROW = { leaf: [256, 320], tuft: [320, 384], stem: [384, 448], pale: [448, 480] };
const ux = x => x / AW, vy = y => 1 - y / AH;

// The point s of the way along a curve that leaves P0 along T0 and arrives at P1 along T1 (both pulls m long), and
// which way it is going there: o[0..2], o[3..5].
function herm(o, P0, T0, P1, T1, m, s) {
  const s2 = s * s, s3 = s2 * s, a = 2 * s3 - 3 * s2 + 1, b = (s3 - 2 * s2 + s) * m, c = -2 * s3 + 3 * s2, d = (s3 - s2) * m;
  const da = 6 * s2 - 6 * s, db = (3 * s2 - 4 * s + 1) * m, dd = (3 * s2 - 2 * s) * m;
  for (let i = 0; i < 3; i++) { o[i] = a * P0[i] + b * T0[i] + c * P1[i] + d * T1[i]; o[3 + i] = da * P0[i] + db * T0[i] - da * P1[i] + dd * T1[i]; }
  const l = Math.hypot(o[3], o[4], o[5]);
  if (l > 1e-6) { o[3] /= l; o[4] /= l; o[5] /= l; } else { o[3] = T0[0]; o[4] = T0[1]; o[5] = T0[2]; }
  return o;
}
// The pull that keeps that curve close to `len` long (within a thirtieth, over every pose here): the more slack the
// stalk has between its two ends, the wider it bows. A stalk bends; it does not stretch. (A rule and not a search:
// where a stalk is nearly straight a search has nothing to hold on to, and the stalk would twitch.)
function hermFit(P0, P1, len) {
  const c = Math.hypot(P1[0] - P0[0], P1[1] - P0[1], P1[2] - P0[2]) || 1e-4;
  return c * Math.min(1.7, Math.max(0.45, 0.55 + 3.6 * (len / c - 1)));
}

lifeFor(218072, {
  title: /^Portrait of a Man in a Red Cap/,
  word: 'pair',
  stage: { out: 1.0, half: 0.8, cam: { dist: 1.95, side: 0.1, height: 0.72, fov: 50, lookU: -0.03, lookOut: 0.2, lookH: 1.05, floorOut: 0.3 } },
  wake: 2, ret: 2.2,

  build(L) {
    const P = L.pal, R = rng(218072), hex = (h, a = 0.22) => '#' + P.near(h, a).getHexString();
    const C = {
      ink: hex('#170807', 0.3), crim: hex('#3c1614', 0.15), red: hex('#742c2a', 0.15), verm: hex('#9a3a34', 0.1), fleck: hex('#b85048', 0.08),
      leaf: hex('#746638', 0.15), leafHi: hex('#927e48', 0.1), leafLo: hex('#383014', 0.15), line: hex('#241008'),
      tuft: hex('#5a5a2a', 0.15), tuftHi: hex('#7c7a42', 0.1), tuftLo: hex('#2a2a12', 0.15),
      stem: hex('#665e2e', 0.15), stemHi: hex('#84764a', 0.1), stemLo: hex('#2c260f', 0.15), pale: hex('#d8ccb0', 0.1),
    };

    // ---- the paint
    const tex = this.tex = canvasTexture(AW, AH, g => {
      g.clearRect(0, 0, AW, AH); g.lineCap = 'round'; g.lineJoin = 'round';
      // three petals: a red limb, crimson at the claw and again at the lip, the dark fanning out of the heart, the red
      // loaded on in tongues, dark dabs along inside the lip, and the lip cut in small teeth (the flower is called a
      // pink for that edge) and drawn round in dark, as he draws round everything
      for (let v = 0; v < 3; v++) {
        const r = rng(900 + v), teeth = [11, 9, 12][v], depth = [15, 18, 13][v], top = 12;
        g.save(); g.translate(v * 256, 0); g.beginPath(); g.rect(0, 0, 256, 256); g.clip();
        const arch = x => top + 22 * Math.pow(Math.abs(x / 128 - 1), 2);
        g.beginPath(); g.moveTo(-4, 260); g.lineTo(-4, arch(0) + depth);
        for (let i = 0; i < teeth; i++) {
          const xa = 256 * (i + 0.5) / teeth, xb = 256 * (i + 1) / teeth;
          g.lineTo(xa + (r() - 0.5) * 6, arch(xa) + (r() - 0.5) * 6);
          g.lineTo(xb + (r() - 0.5) * 4, arch(xb) + depth * (0.7 + 0.6 * r()));
        }
        g.lineTo(260, 260); g.closePath();
        const gr = g.createLinearGradient(0, 256, 0, top);
        gr.addColorStop(0, C.ink); gr.addColorStop(0.2, C.crim); gr.addColorStop(v === 1 ? 0.6 : 0.46, C.red); gr.addColorStop(0.84, C.red); gr.addColorStop(1, C.crim);
        g.fillStyle = gr; g.fill(); g.save(); g.clip();
        for (let i = 0; i < 9; i++) {       // the dark, fanning out of the heart
          const x = 256 * r(), y1 = 96 + 96 * r(); g.strokeStyle = C.ink; g.globalAlpha = 0.3 + 0.3 * r(); g.lineWidth = 3 + 5 * r();
          g.beginPath(); g.moveTo(128 + (x - 128) * 0.3, 252); g.quadraticCurveTo(128 + (x - 128) * 0.7, 170, x, y1); g.stroke();
        }
        for (let i = 0; i < (v === 1 ? 4 : 7); i++) {       // the red, loaded on in tongues
          const x = 22 + 212 * (i + 0.2 + 0.6 * r()) / (v === 1 ? 4 : 7), y0 = arch(x) + 46 + 30 * r(), len = 34 + 34 * r();
          g.strokeStyle = r() < 0.4 ? C.fleck : C.verm; g.globalAlpha = 0.7 + 0.25 * r(); g.lineWidth = 9 + 7 * r();
          g.beginPath(); g.moveTo(x, y0); g.lineTo(x + (128 - x) * 0.12, y0 + len); g.stroke();
        }
        g.fillStyle = C.ink;                // the dark dabs: a row inside the lip, a looser one lower
        for (let i = 0; i < teeth; i++) { const x = 256 * (i + 0.5 + (r() - 0.5) * 0.5) / teeth, y = arch(x) + depth + 12 + 9 * r(); g.globalAlpha = 0.5 + 0.35 * r(); g.beginPath(); g.ellipse(x, y, 4.5 + 3.5 * r(), 6 + 5 * r(), 0, 0, TAU); g.fill(); }
        for (let i = 0; i < 5; i++) { const x = 20 + 216 * r(), y = 112 + 46 * r(); g.globalAlpha = 0.35 + 0.35 * r(); g.beginPath(); g.ellipse(x, y, 4 + 3 * r(), 6 + 6 * r(), 0, 0, TAU); g.fill(); }
        g.globalAlpha = 0.9; g.strokeStyle = C.ink; g.lineWidth = 12; g.stroke(); g.restore(); g.restore(); g.globalAlpha = 1;
      }
      // the calyx: a green tube with a toothed lip, lit from the upper left as his whole picture is
      {
        g.save(); g.translate(768, 0); g.beginPath(); g.rect(0, 0, 256, 256); g.clip();
        g.beginPath(); g.moveTo(-4, 260); g.lineTo(-4, 70);
        for (let i = 0; i < 5; i++) { g.lineTo(256 * (i + 0.5) / 5, 14); g.lineTo(256 * (i + 1) / 5, 70); }
        g.lineTo(260, 70); g.lineTo(260, 260); g.closePath(); g.save(); g.clip();
        for (let x = 0; x < 256; x += 2) { const k = 0.5 + 0.5 * Math.cos(TAU * (x / 256 - 0.42)); g.fillStyle = k > 0.5 ? mix(C.stem, C.stemHi, (k - 0.5) * 2) : mix(C.stemLo, C.stem, k * 2); g.fillRect(x, 0, 2, 256); }
        g.strokeStyle = C.line; g.globalAlpha = 0.5; g.lineWidth = 3; for (let i = 0; i < 10; i++) { const x = 256 * (i + 0.5) / 10; g.beginPath(); g.moveTo(x, 40); g.lineTo(x, 256); g.stroke(); }
        g.globalAlpha = 0.9; g.lineWidth = 12; g.strokeStyle = C.line; g.stroke(); g.restore(); g.restore(); g.globalAlpha = 1;
      }
      // a leaf, along its length: the light along one edge, the shade along the other, his red-brown line round it
      const strip = (y0, y1, lo, mid, hi, line, seed) => {
        const r = rng(seed), h = y1 - y0, gr = g.createLinearGradient(0, y0, 0, y1);
        gr.addColorStop(0, line); gr.addColorStop(0.1, line); gr.addColorStop(0.17, hi); gr.addColorStop(0.32, hi); gr.addColorStop(0.5, mid); gr.addColorStop(0.78, lo); gr.addColorStop(0.88, line); gr.addColorStop(1, line);
        g.fillStyle = gr; g.fillRect(0, y0, AW, h);
        g.save(); g.beginPath(); g.rect(0, y0, AW, h); g.clip();
        for (let i = 0; i < 46; i++) { const x = AW * r(), y = y0 + h * (0.14 + 0.68 * r()), len = 60 + 200 * r(); g.strokeStyle = [hi, mid, lo, line][Math.floor(r() * 3.3)]; g.globalAlpha = 0.25 + 0.35 * r(); g.lineWidth = 2 + 4 * r(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y + (r() - 0.5) * 6); g.stroke(); }
        g.restore(); g.globalAlpha = 1;
      };
      strip(ROW.leaf[0], ROW.leaf[1], C.leafLo, C.leaf, C.leafHi, C.line, 31);
      strip(ROW.tuft[0], ROW.tuft[1], C.tuftLo, C.tuft, C.tuftHi, C.line, 32);
      // the stem, round its girth: light on the left, dark on the right and behind
      for (let y = ROW.stem[0]; y < ROW.stem[1]; y++) { const k = 0.5 + 0.5 * Math.cos(TAU * ((y - ROW.stem[0]) / (ROW.stem[1] - ROW.stem[0]) - 0.42)); g.fillStyle = k > 0.5 ? mix(C.stem, C.stemHi, (k - 0.5) * 2) : mix(C.stemLo, C.stem, k * 2); g.fillRect(0, y, AW, 1); }
      // the pale threads at a pink's heart (he gives the full-face flower one white stroke there)
      g.fillStyle = C.pale; g.fillRect(0, ROW.pale[0], AW, ROW.pale[1] - ROW.pale[0]);
    });
    tex.anisotropy = 4;

    // ---- the plant: one mesh, every point of it placed each frame
    const uv = [], col = [], idx = []; let nv = 0;
    const vert = (u, v, t) => { uv.push(u, v); col.push(t[0], t[1], t[2]); return nv++; };
    const W3 = [1, 1, 1];
    // a round stalk of n rings (six-sided: it is a centimetre thick)
    const tube = (n, row, t = W3, u0 = 0.01, u1 = 0.99) => {
      const o = nv;
      for (let j = 0; j < n; j++) for (let k = 0; k <= 6; k++) vert(lerp(u0, u1, j / (n - 1)), vy(lerp(row[0] + 1, row[1] - 1, k / 6)), t);
      for (let j = 0; j < n - 1; j++) for (let k = 0; k < 6; k++) { const a = o + j * 7 + k, b = a + 7; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      return o;
    };
    // a strap of n rows, three points across (it folds a little along its middle)
    const strap = (n, row, t = W3) => {
      const o = nv;
      for (let j = 0; j < n; j++) for (let k = 0; k < 3; k++) vert(lerp(0.01, 0.99, j / (n - 1)), vy(lerp(row[0] + 4, row[1] - 4, k / 2)), t);
      for (let j = 0; j < n - 1; j++) for (let k = 0; k < 2; k++) { const a = o + j * 3 + k, b = a + 3; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      return o;
    };
    const tint = k => [k, k * 0.96, k * 0.96];

    this.low = { o: tube(LOW_S.length, ROW.stem), n: LOW_S.length };
    // (above the fork his stalks go red-brown)
    this.stA = { o: tube(STALK_S.length, ROW.stem, [1.0, 0.9, 0.8]), n: STALK_S.length };
    this.stB = { o: tube(STALK_S.length, ROW.stem, [0.98, 0.86, 0.74]), n: STALK_S.length };

    // the leaves: where each springs, the curve it takes (four points, from its root), the plane it curls in, how it
    // turns its face along its length, its width
    const leaves = this.leaves = [];
    const leaf = (at, pts, np, tw, w, rows, row, t, grow) => leaves.push({ at, p: pts.flat(), np: nrm(...np), tw, w, rows, o: strap(rows, row, t), grow });
    // (the two long ones of the picture: one sweeping up to the left to a point, one curling round to the right and back over the stem)
    leaf('node', [[0, 0, 0], [-0.035, 0.05, 0.012], [-0.10, 0.085, 0.022], [-0.168, 0.21, 0.012]], [0, 0, 1], [0.7, 1.35], 0.021, 14, ROW.leaf, W3, [GF * NODE, GF * NODE + 0.42]);
    leaf('node', [[0, 0, 0], [0.085, -0.012, 0.022], [0.115, 0.15, 0.04], [-0.04, 0.128, 0.034]], [0, 0, 1], [0.75, 1.3], 0.021, 16, ROW.leaf, W3, [GF * NODE + 0.03, GF * NODE + 0.48]);
    // (the two short ones at the fork)
    leaf('fork', [[0, 0, 0], [0.012, 0.03, 0.012], [0.024, 0.06, 0.016], [0.02, 0.098, 0.012]], [0.2, 0, 1], [0.9, 1.2], 0.011, 8, ROW.leaf, tint(0.9), [GF, GF + 0.3]);
    leaf('fork', [[0, 0, 0], [-0.002, 0.03, -0.01], [-0.012, 0.055, -0.016], [-0.006, 0.086, -0.012]], [-0.3, 0, 1], [0.9, 1.2], 0.010, 8, ROW.leaf, tint(0.82), [GF + 0.04, GF + 0.34]);
    // (and the tuft it grows from, which is mine: he painted the stem cut. Narrow blades, low, in a darker green.)
    for (let i = 0; i < 9; i++) {
      const az = (i / 9) * TAU + 0.35 + (R() - 0.5) * 0.4, r = 0.075 + 0.05 * R(), h = 0.07 + 0.075 * R(), cx = Math.cos(az), cz = Math.sin(az) * 0.8;
      leaf('foot', [[0.006 * cx, 0, 0.006 * cz], [0.25 * r * cx, h * 0.75, 0.25 * r * cz], [0.7 * r * cx, h * 1.12, 0.7 * r * cz], [r * cx, h * (0.55 + 0.4 * R()), r * cz]], [-cz, 0, cx], [0.15, 0.35], 0.011 + 0.004 * R(), 7, ROW.tuft, tint(0.78 + 0.22 * R()), [0.02 * i, 0.3 + 0.02 * i]);
    }

    // the two flowers: a calyx and three rings of petals each
    const RINGS = [{ n: 11, len: 0.068, th: 1.70, w: 0.054 }, { n: 8, len: 0.054, th: 1.24, w: 0.046 }, { n: 5, len: 0.040, th: 0.68, w: 0.034 }];
    const flower = (tints, calT) => {
      const f = { cal: tube(4, [6, 250], calT, ux(768 + 3), ux(1024 - 3)), petals: [], sty: [strap(5, ROW.pale), strap(5, ROW.pale)] };
      // (the calyx is wrapped the other way: round it along the sheet, up it down the sheet)
      for (let j = 0; j < 4; j++) for (let k = 0; k <= 6; k++) { const i = (f.cal + j * 7 + k) * 2; uv[i] = ux(768 + 4 + 248 * k / 6); uv[i + 1] = vy(lerp(250, 16, CAL_S[j])); }
      RINGS.forEach((rg, q) => {
        for (let i = 0; i < rg.n; i++) {
          const cell = q === 2 ? 1 : (i + q) % 3 === 1 ? 2 : 0, o = nv, t = tint(tints[q] * (0.9 + 0.2 * R()));
          for (let j = 0; j < 4; j++) for (let k = 0; k < 3; k++) vert(ux(cell * 256 + 128 + (k - 1) * 119), vy(lerp(249, 5, PET_R[j])), t);
          for (let j = 0; j < 3; j++) for (let k = 0; k < 2; k++) { const a = o + j * 3 + k, b = a + 3; idx.push(a, a + 1, b, a + 1, b + 1, b); }
          f.petals.push({ o, q, az: (i + 0.5 * q + (R() - 0.5) * 0.3) / rg.n * TAU, len: rg.len * (0.92 + 0.16 * R()), th: rg.th + (R() - 0.5) * 0.2, w: rg.w * (0.92 + 0.16 * R()) });
        }
      });
      return f;
    };
    // (the full-face one is the darker in the picture, nearly black at its heart; the one in profile is the brighter)
    this.fA = flower([0.5, 0.96, 0.46], tint(0.95));
    this.fB = flower([0.98, 0.9, 0.62], tint(1.0));

    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(nv * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
    geo.setIndex(idx);
    const mat = new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    // (the under side of a petal or a leaf is the duller)
    mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n  if (!gl_FrontFacing) diffuseColor.rgb *= vec3(0.74, 0.70, 0.72);'); };
    mat.customProgramCacheKey = () => 'pinks218072';
    const mesh = this.mesh = new THREE.Mesh(geo, mat); mesh.name = 'stem-of-pinks';
    mesh.position.copy(L.floor(U0, OUT0)); mesh.rotation.y = L.yawOut; mesh.scale.setScalar(K); mesh.visible = false;
    L.add(mesh);
    this.shade = L.blobs(1, { fade: true }); this.shade.count = 0;
    this.foot = L.floor(U0, OUT0).clone();

    // ---- scratch, so that nothing is made while it plays
    this.S = { F: new Float64Array(3), Fc: new Float64Array(6), FcT: null, T0: new Float64Array(3), T1: new Float64Array(3), P1: new Float64Array(3), tip: new Float64Array(6), h: new Float64Array(6), ps: new Float64Array(12), an: new Float64Array(6), e: new Float64Array(6), row: new Float64Array(8) };
    this.S.FcT = this.S.Fc.subarray(3, 6);
    this.now = { g: 0, tf: 0, wP: 0, wA: 0, wB: 0, opA: 0, opB: 0 }; this.hold = { g: 0, tf: 0, wP: 0, wA: 0, wB: 0, opA: 0, opB: 0 };

    // ---- a few plucked notes, mine and no one's tune: two lines that come to one note as the flowers close
    const s = this.band = score(L), pl = (t, n, vol = 0.03, d = 1.3) => s.note(t, hz(n), d, { vol, type: 'triangle', attack: 0.006, over: 2, overVol: 0.18 });
    pl(0.3, 'D4', 0.022, 1.0); pl(0.95, 'A4', 0.022, 1.0); pl(1.55, 'D5', 0.024, 1.1);
    pl(2.15, 'E5', 0.028, 1.5); pl(2.7, 'C5', 0.026, 1.6);
    const fig = [];
    const fp = (t, n, vol = 0.028, d = 1.3) => fig.push({ t, f: hz(n), d, vol, type: 'triangle', attack: 0.006, over: 2, overVol: 0.18 });
    fp(0.1, 'E4', 0.024); fp(0.55, 'F4', 0.024); fp(1.0, 'G4', 0.024);              // the lower one turns up
    fp(0.95, 'D5'); fp(1.4, 'C5'); fp(1.85, 'B4'); fp(SHUT - 0.05, 'A4', 0.036, 2.8);   // the upper one bows; they meet on one note
    fp(T_PART, 'A4', 0.024); fp(T_PART + 0.45, 'C5', 0.024); fp(T_PART + 0.9, 'D5', 0.026, 1.8);
    fp(T_PART + 1.1, 'F4', 0.022); fp(T_PART + 1.6, 'D4', 0.022, 1.8);
    s.loop(T_SHUT, AGAIN, fig); s.done();
    this.told = 0;
  },

  start(L) { this.band.from(L.t); this.told = 0; },
  reset() { this.told = 0; if (this.mesh) { this.mesh.visible = false; this.shade.count = 0; } },
  back() { Object.assign(this.hold, this.now); },
  end() { this.mesh.visible = false; this.shade.count = 0; },

  update(L) {
    const S = this.S, N = this.now, H = this.hold, t = L.t, back = L.phase === 'return', calm = L.calm, pos = this.pos;
    // ---- how far along everything is
    if (!back) {
      N.tf = ease.out(ramp(t, 0, 0.85)); N.g = ease.inOut(ramp(t, 0.15, 1.95));
      N.wP = ease.inOut(ramp(t, T_SEEN[0], T_SEEN[1]));
      // (the one in profile turns its face up first, and then the full-face one bows to it: so no petal passes through
      // another. Parting, the upper one lifts away first.)
      const c = t < T_SHUT ? -1 : (t - T_SHUT) % AGAIN, d1 = SHUT, d2 = PART;
      N.wB = c < 0 ? 0 : ease.inOut(ramp(c, 0, 0.55 * d1)) - ease.inOut(ramp(c, T_PART + 0.45 * d2, T_PART + d2));
      N.wA = c < 0 ? 0 : ease.inOut(ramp(c, 0.3 * d1, d1)) - ease.inOut(ramp(c, T_PART, T_PART + 0.7 * d2));
      N.opA = ease.out(ramp(t, T_OPEN_A[0], T_OPEN_A[1])); N.opB = ease.out(ramp(t, T_OPEN_B[0], T_OPEN_B[1]));
    } else {
      const k = 1 - ease.inOut(ramp(L.ret, 0, 0.5)), d = 1 - ease.in(ramp(L.ret, 0.36, 0.98));
      N.wA = H.wA * (1 - ease.inOut(ramp(L.ret, 0, 0.34))); N.wB = H.wB * (1 - ease.inOut(ramp(L.ret, 0.14, 0.5)));
      N.wP = H.wP * k; N.opA = H.opA * k; N.opB = H.opB * k; N.g = H.g * d; N.tf = H.tf * (1 - ramp(L.ret, 0.7, 1));
    }
    const { g, tf, wP, wA, wB } = N, wC = wA * wB;
    const show = g > 0.001 || tf > 0.001; this.mesh.visible = show;
    if (!show) { this.shade.count = 0; return; }
    // (a flower pressed to another folds its outer petals in a little, and its heart opens flat against the other's)
    const opA = N.opA * (1 - 0.22 * wC), opB = N.opB * (1 - 0.22 * wC);
    const gl = clamp01(g / GF), ga = clamp01((g - GF) / (1 - GF)), gb = ramp(ga, 0.1, 1);
    // (it is never quite still: a slow sway, least at the foot)
    const sa = (calm ? 0.5 : 1) * g, s1 = Math.sin(t * 0.83) * sa, s2 = Math.sin(t * 0.61 + 1.3) * sa, s3 = Math.sin(t * 1.07 + 2.2) * sa;

    // ---- the stem, up to the fork
    S.F[0] = FORK[0] + 0.004 * s1; S.F[1] = FORK[1]; S.F[2] = FORK[2] + 0.003 * s2;
    for (let j = 0; j < this.low.n; j++) {
      const s = LOW_S[j] * gl; herm(S.h, ZERO, LEAN, S.F, RISE, 0.46, s);
      const tip = j === this.low.n - 1 && ga <= 0 ? 0.55 : 1, knot = 1 + 0.45 * Math.max(0, 1 - Math.abs(LOW_S[j] - NODE) / 0.035) + 0.4 * Math.max(0, 1 - Math.abs(LOW_S[j] - 1) / 0.035);
      ring(pos, this.low.o + j * 7, S.h, lerp(0.0062, 0.0052, s) * knot * tip * Math.min(1, gl * 6 + 0.3));
    }
    herm(S.Fc, ZERO, LEAN, S.F, RISE, 0.46, gl);      // the top of what has grown: the fork, once it is there

    // ---- the pose of the two stalks
    const ps = S.ps, B = POSE.bud, Q = POSE.seen, Z = POSE.shut;
    for (let i = 0; i < 12; i++) ps[i] = B[i] + (Q[i] - B[i]) * wP + (Z[i] - Q[i]) * (i < 6 ? wA : wB);
    // (the one that bows draws back a little as it comes round, as a head does)
    const bk = BACK * Math.sin(Math.PI * wA); ps[0] += AX[0] * bk; ps[1] += AX[1] * bk; ps[2] += AX[2] * bk;
    const fr = 1 - Math.max(wA, wB); ps[0] += 0.007 * s2 * fr; ps[2] += 0.006 * s3 * fr; ps[6] += 0.005 * s3 * fr; ps[8] += 0.005 * s1 * fr;
    ps[0] += 0.003 * s1 * (1 - fr); ps[6] += 0.003 * s1 * (1 - fr);      // (turned to each other, they sway as one)
    // the stalk to the upper flower
    this.stalk(this.stA, S, ps, 0, S.FcT, LA, ga, 0.0048, 0.0042);
    this.bloom(this.fA, S.tip, lerp(0.5, 1, g), opA, wC);
    // the side stalk and its flower
    this.stalk(this.stB, S, ps, 6, SIDE, LB, gb, 0.0042, 0.0037);
    this.bloom(this.fB, S.tip, gb > 0 ? lerp(0.42, 1, gb) : 0, opB, wC);

    // ---- the leaves
    for (const lf of this.leaves) {
      let k, ax, ay, az;
      if (lf.at === 'foot') { k = ease.out(ramp(tf, lf.grow[0], lf.grow[1] + 0.5)); ax = ay = az = 0; }
      else {
        k = ease.out(ramp(g, lf.grow[0], lf.grow[1]));
        if (lf.at === 'node') { herm(S.h, ZERO, LEAN, S.F, RISE, 0.46, NODE); ax = S.h[0]; ay = S.h[1]; az = S.h[2]; } else { ax = S.F[0]; ay = S.F[1]; az = S.F[2]; }
      }
      const p = lf.p, n = lf.rows, np = lf.np, sw = lf.at === 'foot' ? 0.004 : 0.012;
      for (let j = 0; j < n; j++) {
        const r = j / (n - 1), s = r * k, a = 1 - s, b0 = a * a * a, b1 = 3 * a * a * s, b2 = 3 * a * s * s, b3 = s * s * s;
        const d0 = 3 * a * a, d1 = 6 * a * s, d2 = 3 * s * s;
        let x = b0 * p[0] + b1 * p[3] + b2 * p[6] + b3 * p[9], y = b0 * p[1] + b1 * p[4] + b2 * p[7] + b3 * p[10], z = b0 * p[2] + b1 * p[5] + b2 * p[8] + b3 * p[11];
        let tx = d0 * (p[3] - p[0]) + d1 * (p[6] - p[3]) + d2 * (p[9] - p[6]), ty = d0 * (p[4] - p[1]) + d1 * (p[7] - p[4]) + d2 * (p[10] - p[7]), tz = d0 * (p[5] - p[2]) + d1 * (p[8] - p[5]) + d2 * (p[11] - p[8]);
        const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
        x += sw * s * s * s1; z += sw * s * s * s2;
        // across it: in the plane it curls in (q), or square to that plane (np), turning from the one to the other
        let qx = np[1] * tz - np[2] * ty, qy = np[2] * tx - np[0] * tz, qz = np[0] * ty - np[1] * tx; const ql = Math.hypot(qx, qy, qz) || 1; qx /= ql; qy /= ql; qz /= ql;
        const tw = lerp(lf.tw[0], lf.tw[1], Math.sin(Math.PI * Math.min(1, r * 1.25) * 0.5)), cw = Math.cos(tw), sn = Math.sin(tw);
        const wx = cw * np[0] + sn * qx, wy = cw * np[1] + sn * qy, wz = cw * np[2] + sn * qz;
        // (a blade: narrow where it leaves the stem, widest a third of the way out, drawn to a point)
        const hw = 0.5 * lf.w * Math.min(1, 0.35 + 0.65 * k * 1.4) * (k > 0.001 ? 1 : 0) * Math.pow(Math.sin(Math.PI * Math.pow(0.06 + 0.94 * r, 0.62) * 0.985), 0.8);
        // (and folded along its middle: the mid point stands off the two edges)
        const fx = ty * wz - tz * wy, fy = tz * wx - tx * wz, fz = tx * wy - ty * wx, fold = hw * 0.32;
        const o = (lf.o + j * 3) * 3;
        pos[o] = ax + x - wx * hw; pos[o + 1] = Math.max(0.002, ay + y - wy * hw); pos[o + 2] = az + z - wz * hw;
        pos[o + 3] = ax + x + fx * fold; pos[o + 4] = Math.max(0.002, ay + y + fy * fold); pos[o + 5] = az + z + fz * fold;
        pos[o + 6] = ax + x + wx * hw; pos[o + 7] = Math.max(0.002, ay + y + wy * hw); pos[o + 8] = az + z + wz * hw;
      }
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.shade.count = 1; this.shade.set(0, this.foot.x, this.foot.z, K * (0.05 + 0.08 * tf), 0.42 * tf);

    // ---- the sound, and what is said
    const v = L.voice(); v.level = calm ? 0.7 : 1;
    if (!back) {
      this.band.play(t);
      if (!L.quiet) {
        if (this.told < 1 && t > 3.7) { this.told = 1; L.k.say('He holds a stem of pinks: two flowers on one stalk.', 3); }
        if (this.told < 2 && t > T_SHUT + 1.2) { this.told = 2; L.k.say('The museum thinks his portrait was perhaps one of a pair, with one of his wife: two panels that closed together.', 6); }
      }
    }
    v.place();
  },

  // One stalk from the top of the stem to a calyx: it keeps its length and bends to get there. Leaves in S.tip where
  // it ends just now, and which way it points there.
  stalk(part, S, ps, i, T0, len, grown, r0, r1) {
    const P0 = S.Fc, pos = this.pos;
    S.P1[0] = S.F[0] + ps[i]; S.P1[1] = S.F[1] + ps[i + 1]; S.P1[2] = S.F[2] + ps[i + 2];
    const l = Math.hypot(ps[i + 3], ps[i + 4], ps[i + 5]) || 1; S.T1[0] = ps[i + 3] / l; S.T1[1] = ps[i + 4] / l; S.T1[2] = ps[i + 5] / l;
    S.T0[0] = T0[0]; S.T0[1] = T0[1]; S.T0[2] = T0[2];
    if (grown <= 0) {
      for (let j = 0; j < part.n; j++) { S.h[0] = P0[0]; S.h[1] = P0[1]; S.h[2] = P0[2]; S.h[3] = P0[3]; S.h[4] = P0[4]; S.h[5] = P0[5]; ring(pos, part.o + j * 7, S.h, 0); }
      for (let k = 0; k < 6; k++) S.tip[k] = P0[k];
      return;
    }
    const m = hermFit(P0, S.P1, len);
    for (let j = 0; j < part.n; j++) { const s = STALK_S[j] * grown; herm(S.h, P0, S.T0, S.P1, S.T1, m, s); ring(pos, part.o + j * 7, S.h, lerp(r0, r1, s)); }
    herm(S.tip, P0, S.T0, S.P1, S.T1, m, grown);
  },

  // One flower on the end of its stalk: at[0..2] where the calyx begins, at[3..5] the way it faces; k its size (a bud is
  // small), open 0..1, and how hard it is pressed against the other.
  bloom(f, at, k, open, press) {
    const pos = this.pos, e = this.S.e, ax = at[3], ay = at[4], az = at[5], row = this.S.row;
    frame(e, ax, ay, az);
    const cx = at[0], cy = at[1], cz = at[2], h = this.S.h;
    for (let j = 0; j < 4; j++) {
      const d = CAL * CAL_S[j] * k; h[0] = cx + ax * d; h[1] = cy + ay * d; h[2] = cz + az * d; h[3] = ax; h[4] = ay; h[5] = az;
      ring(pos, f.cal + j * 7, h, CAL_R[j] * k);
    }
    const ox = cx + ax * CAL * 0.72 * k, oy = cy + ay * CAL * 0.72 * k, oz = cz + az * CAL * 0.72 * k;
    for (const p of f.petals) {
      const th = lerp(0.05, p.th, open) + press * PRESS[p.q], len = p.len * k * lerp(0.5, 1, open), wt = p.w * k * lerp(0.34, 1, open);
      // a petal stands in the calyx and then turns outward: its bend is near its foot
      let hh = 0, rr = 0, r0 = 0; row[0] = 0; row[1] = 0;
      for (let j = 1; j < 4; j++) {
        const r1 = PET_R[j];
        for (let q = 0; q < 6; q++) { const r = r0 + (r1 - r0) * (q + 0.5) / 6, u = clamp01(r / 0.36), a = th * u * u * (3 - 2 * u), dl = (r1 - r0) / 6 * len; hh += Math.cos(a) * dl; rr += Math.sin(a) * dl; }
        row[j * 2] = hh; row[j * 2 + 1] = rr; r0 = r1;
      }
      const c = Math.cos(p.az), s = Math.sin(p.az);
      const dx = c * e[0] + s * e[3], dy = c * e[1] + s * e[4], dz = c * e[2] + s * e[5];
      const tx = -s * e[0] + c * e[3], ty = -s * e[1] + c * e[4], tz = -s * e[2] + c * e[5];
      for (let j = 0; j < 4; j++) {
        const hw = 0.5 * wt * (0.2 + 0.8 * Math.pow(PET_R[j], 0.75)), hj = row[j * 2], rj = row[j * 2 + 1];
        for (let q = 0; q < 3; q++) {
          const w = (q - 1) * hw, cup = q === 1 ? 0 : hw * 0.16, o = (p.o + j * 3 + q) * 3;
          pos[o] = ox + ax * (hj + cup) + dx * rj + tx * w; pos[o + 1] = oy + ay * (hj + cup) + dy * rj + ty * w; pos[o + 2] = oz + az * (hj + cup) + dz * rj + tz * w;
        }
      }
    }
    // the two pale threads at its heart, curling apart (a pink has two)
    for (let i = 0; i < 2; i++) {
      const sg = i ? -1 : 1, dx = sg * (0.94 * e[0] + 0.34 * e[3]), dy = sg * (0.94 * e[1] + 0.34 * e[4]), dz = sg * (0.94 * e[2] + 0.34 * e[5]);
      const tx = -0.34 * e[0] + 0.94 * e[3], ty = -0.34 * e[1] + 0.94 * e[4], tz = -0.34 * e[2] + 0.94 * e[5], len = 0.036 * k * open * (1 - 0.85 * press);      // (drawn in as the faces meet)
      for (let j = 0; j < 5; j++) {
        const r = j / 4, hj = len * (r - 0.3 * r * r * r), rj = len * 0.34 * r * r + 0.0012, hw = 0.0016 * k * open * (1 - 0.6 * r), o = (f.sty[i] + j * 3) * 3;
        for (let q = 0; q < 3; q++) { const w = (q - 1) * hw; pos[o + q * 3] = ox + ax * hj + dx * rj + tx * w; pos[o + q * 3 + 1] = oy + ay * hj + dy * rj + ty * w; pos[o + q * 3 + 2] = oz + az * hj + dz * rj + tz * w; }
      }
    }
  },
});

// ---- small things the frame-by-frame work shares
const ZERO = [0, 0, 0], LEAN = nrm(-0.10, 1, 0.03), RISE = nrm(0.07, 1, 0.0), SIDE = nrm(-0.55, 0.82, 0.12);
const LOW_S = [0, 0.1, 0.2, 0.32, 0.44, 0.56, NODE - 0.035, NODE, NODE + 0.035, 0.78, 0.88, 0.965, 1];
const STALK_S = [0, 0.04, 0.1, 0.17, 0.24, 0.31, 0.38, 0.45, 0.52, 0.59, 0.66, 0.72, 0.78, 0.83, 0.88, 0.92, 0.96, 1];
const CAL_S = [0, 0.3, 0.8, 1], CAL_R = [0.0062, 0.0095, 0.0118, 0.0135];
const PET_R = [0, 0.2, 0.58, 1], PRESS = [0, 0.17, 0.36];
// Two directions square to (x, y, z), turned with it the short way from straight up: e[0..2], e[3..5].
function frame(e, x, y, z) {
  const k = 1 / (1 + Math.max(-0.98, y));
  e[0] = 1 - k * x * x; e[1] = -x; e[2] = -k * x * z;
  e[3] = -k * x * z; e[4] = -z; e[5] = 1 - k * z * z;
}
const _e = new Float64Array(6);
// A six-sided ring of radius r round the point h[0..2], square to h[3..5].
function ring(pos, o, h, r) {
  frame(_e, h[3], h[4], h[5]);
  for (let k = 0; k <= 6; k++) {
    const a = k / 6 * TAU, c = Math.cos(a) * r, s = Math.sin(a) * r, i = (o + k) * 3;
    pos[i] = h[0] + c * _e[0] + s * _e[3]; pos[i + 1] = h[1] + c * _e[1] + s * _e[4]; pos[i + 2] = h[2] + c * _e[2] + s * _e[5];
  }
}
// Two '#rrggbb' colours mixed.
function mix(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), ch = sh => Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * clamp01(k));
  return 'rgb(' + ch(16) + ',' + ch(8) + ',' + ch(0) + ')';
}
