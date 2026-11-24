// Edouard Vuillard, Landscape: Window Overlooking the Woods (1899), Gallery 244. The word: verdure.
//
// The museum's entry says what it was for: "commissioned from the artist by Adam Natanson to decorate the library
// of his apartment" in Paris. It is not an easel picture. It is nearly four metres wide, it is painted thin and
// matte on a coarse canvas whose weave shows through, every field and tree is a flat shape filled with small
// close-toned dabs, and it has a border painted round it: a garland of fronds and pale rosettes along the top, dark
// boughs set with small white blossoms down both sides, russet corners, and along the bottom a plain brown band
// like a window's sill. Inside the border is the view from an upper window over a valley: a tiled roof just below
// us, a cream gable with its shutters open and a woman at work at the window behind a pot of red flowers, a wall
// of poplars, a steeple, a barn with someone leading a horse, someone bent over a garden bed. "Verdure" is the word
// for all that greenery; it is also the old word for a wall hanging woven with nothing but leaves, which is what
// this picture has made itself look like (the reading of it as a tapestry is the scholars', Gloria Groom's
// "Landscape as Decoration" in the museum's own list of writings on it; the museum's entry says only "to decorate
// the library").
//
// So what comes out is the thing it was painted to be: a hanging. Look at it and a long roll of cloth comes out
// of the wall under the picture and drops to the foot of the wall, its plain lining outwards; two cords come down
// from two rings high up. The cords take the strain, and the cloth is hauled up the wall in five heaves, the roll
// turning on the floor as it pays out, one end of the batten leading and then the other, as two cords never pull
// quite together, a ripple running down it from each heave. It goes up BEHIND the picture: you see it rise at
// either side, and over the top of the frame once it is past. It is his border, gone on beyond the frame: the
// dark of his side borders, covered with small scalloped masses of leaves in his dabs and his close tones (deep
// brown, olive brown, his green, here and there his ochre), buff where a bough's bark shows through, his small
// white blossoms in drifts; his garland of fronds and rosettes along its top; russet edges, as his corners are;
// his plain brown band at its foot. At the last heave the end of the roll comes off the floor, the whole cloth
// swings out, pats the wall three times, each softer, and hangs, levelled; a little dust comes off it in the
// lamp's light; its folds settle. The picture is then what its title says, a window, in a wall hung with leaves:
// the room it was painted for. After that it only hangs (it breathes, hardly at all, and now and then it
// settles). When you stop looking it is let down, rolls itself up and goes back into the wall.
//
// Nothing is ever in front of a picture. The cloth lies 6 mm off the wall, behind the plane of the canvas (which
// stands 4 cm off the wall) and behind the frame; where it is behind the picture and its frame its ripples are
// held to 2 cm, so it never comes through; a place is cut in it for the label, which stays in view with its green
// glow; the roll lies on the floor, under the frame's rail; the dust is let go only along the cloth's foot and
// down its sides; the kit's guard is there for the rest (from the look camera it has nothing to cut; from one of
// the checks' nine, grazing along the wall, it trims a few pixels of that dust). It
// ends 2.8 m either side of the picture's middle (the Vallotton, the only other picture in the room, begins 5.3 m
// to the left). Nothing is solid and nothing stays out after the look. One draw call: the cloth, its roll, the
// cords, the rings, the dust and the roll's shadow are one mesh, moved in its shader. The cloth is one texture,
// painted once, a step at a time between frames (a score of lobes to each family of tones are painted on a sheet
// beside it and laid on from there, so it is dry in about a tenth of a second's work): flat shapes cut with
// straight edges and filled with chips of close tones, as a weaver's or his are; nothing blended, no gloss; in
// the shader its edges are dragged a millimetre or two out of true, a little of its colour is taken out, and the
// ribs of a weave are laid over it. It is drawn after the picture lamp's wash on the wall, so that is not laid
// over it, and lit in its own shader from where that lamp is (and by the gallery's own lights when they are on).
// The look camera stands back across the room, square on, with the whole work and the whole hanging in view (on
// a phone held upright no camera in this room can hold a picture this wide: it sees the middle of it, the roll
// under it and the cloth coming out above it).
//
// The sounds are the work of hanging it: the roll landing, the cords, a pulley's creak and the cloth's rustle at
// each heave, the lath's pats on the wall. No tune: it was made for a library.
// With "Reduce motion and flashing" (read as it runs): the ripples, the tilt and the last swing are half as deep,
// the cloth is hauled without its jerk and sag, the roll lands without a bounce, there is half the dust, and the
// landing and the pats are quieter and eased in.
//
// Ours, not his: the hanging itself. The picture has only its painted border; the cloth is that border's leaves,
// blossoms and bands laid out again at their own size, not a copy of any part of the view, and the line the game
// says about it calls it that and no more ("a hanging ... in the leaves of its own painted border").
//
// What it does not do: the three people (the woman at her window, the one with the horse, the one in the garden)
// stay in the picture, because he made them a few dabs each, part of the pattern, and that is the point of them;
// the hanging does not copy the view or add to it; and nobody is seen hauling, because nobody in the picture is.
import * as THREE from 'three';
import { lifeFor, ease, ramp, lerp, rng } from '../paintlife.js';
import { LOWMEM } from '../budget.js';
import { score } from './stagecraft.js';

const TAU = Math.PI * 2;
// The cloth, in metres: W wide, HC long; hung, its top is TOP above the floor and its foot HEM.
const W = 5.6, HC = 3.56, HEM = 0.3, TOP = HC + HEM;
const R0 = 0.024, R_START = 0.105, KK = (R_START * R_START - R0 * R0) / HC;      // the roll: its core, its size, r^2 = R0^2 + KK * (what is still on it)
const O_WALL = -0.034, O_SKIRT = -0.002;                                        // where it lies: on the wall, and in front of the skirting
const RING_Y = TOP + 0.085, CORD_U = 2.42;
const P_END = HC + HEM - R0;                                                     // hauled this far, it hangs
// The heaves: [starts, takes, hauled to]. The first only takes the strain; the last takes the end of the roll off the floor.
const HEAVES = [[1.25, 0.32, 0.1], [1.95, 0.5, 1.0], [2.9, 0.5, 1.92], [3.85, 0.5, 2.82], [4.8, 0.5, 3.5], [5.8, 0.62, P_END]];
const T_FREE = 6.12, T_HUNG = 8.0;                                               // the foot leaves the floor; it has settled
const PAT = 0.62;                                                                // the swing: seconds from one pat on the wall to the next
const MOTES = 110;                                                               // the dust it lets go of
// The texture: PW x PH pixels for W x HC metres.
const PW = 2048, M = PW / W, PH = Math.round(HC * M);

// ------------------------------------------------------------------ his paint --
// The cloth, painted a step at a time (a generator: each yield is a place to stop for this frame). Everything is
// a flat shape filled with chips of two or three close tones; nothing is blended and nothing shines.
// (KS: the canvas is that much smaller than PW x PH, where memory is short; everything is still laid out in PW x PH.)
function* paintCloth(g, tone, seed, KS) {
  g.setTransform(KS, 0, 0, KS, 0, 0);
  const rand = rng(seed), R = (a, b) => a + (b - a) * rand(), pick = a => a[Math.floor(rand() * a.length) % a.length];
  // one colour, a little lighter or darker each time it is used (his close tones)
  const css = (h, j = 0.07) => { const c = tone(h), k = 1 + (rand() - 0.5) * 2 * j; return `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`; };
  // a chip: a small six-sided dab, never quite regular (x, y its middle, a its long half, b its short half, in pixels)
  const chip = (x, y, a, b, rot, col) => {
    const c = Math.cos(rot), s = Math.sin(rot); g.fillStyle = col; g.beginPath();
    for (let i = 0; i < 6; i++) { const t = i / 6 * TAU + R(-0.3, 0.3), k = R(0.72, 1.12), px = Math.cos(t) * a * k, py = Math.sin(t) * b * k; const X = x + px * c - py * s, Y = y + px * s + py * c; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }
    g.closePath(); g.fill();
  };
  const m = v => v * M;
  let ops = 0; const tick = n => (ops += n) > 900 ? (ops = 0, true) : false;
  // where things are (metres from the cloth's top left)
  const BAT = 0.036, BT = 0.19, BS = 0.075, BB0 = HC - 0.15, LATH = HC - 0.032;      // the batten; his border along the top; the edging; the plain band; the lath in the foot
  const FX0 = BS + 0.02, FX1 = W - BS - 0.02, FY0 = BAT + BT, FY1 = BB0;
  const WHITE = ['#c9d3c4', '#bcc8bb', '#d6dccb', '#b4c2b6'], BUFF = ['#a28b4b', '#b2a670', '#96824a', '#bfae72', '#8a7438'], GOLD = ['#cdb962', '#d6c46f', '#c4ac50', '#dccb82'];
  const hsh = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7 + seed * 0.37) * 43758.5453; return v - Math.floor(v); };
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return lerp(lerp(hsh(xi, yi), hsh(xi + 1, yi), sx), lerp(hsh(xi, yi + 1), hsh(xi + 1, yi + 1), sx), sy); };
  // a small blossom: five petals and a heart (s: a petal, in pixels); a rosette: two rings of petals
  const blossom = (x, y, s, cols) => { const a9 = R(0, TAU); for (let i = 0; i < 5; i++) { if (rand() < 0.16) continue; const a = a9 + i / 5 * TAU + R(-0.4, 0.4); chip(x + Math.cos(a) * s * R(0.85, 1.2), y + Math.sin(a) * s * R(0.85, 1.2), s * R(0.6, 1.05), s * R(0.5, 0.9), R(0, 3), css(pick(cols), 0.07)); } chip(x, y, s * 0.5, s * 0.5, 0, css('#6a5524', 0.05)); };
  const rosette = (x, y, s, cols, heart) => {
    for (let ring = 0; ring < 2; ring++) { const n = ring ? 6 : 9, rr = s * (ring ? 0.42 : 0.82); for (let i = 0; i < n; i++) { const a = i / n * TAU + R(-0.2, 0.2); chip(x + Math.cos(a) * rr, y + Math.sin(a) * rr, s * R(0.26, 0.36), s * R(0.2, 0.28), a, css(pick(cols), 0.06)); } }
    chip(x, y, s * 0.24, s * 0.22, 0, css(heart, 0.05));
  };

  // ---- the ground, under everything: the dark he leaves between one mass of leaves and the next
  g.fillStyle = css('#3b2d19', 0); g.fillRect(0, 0, PW, PH);
  for (let i = 0; i < 3000; i++) { chip(R(0, PW), R(0, PH), R(4, 8), R(2.5, 4.5), R(-0.6, 0.6), css(pick(['#433319', '#3a2c18', '#48381c', '#40351d']), 0.06)); if (tick(1)) yield; }

  // ---- the leaves: his side borders, gone on across the cloth. No bare ground and no stems: one scalloped mass of
  // leaves over another, the lower over the higher, each a few lobes; close tones, that keep together in drifts
  // (deep brown, the borders' olive brown, his green, and here and there his ochre).
  const FAM = [
    { base: ['#493a1b', '#44351a', '#4e3e1d'], lite: ['#5f4d22', '#58471f', '#665427'], dark: ['#39291a', '#3d2e18'] },
    { base: ['#5e4b20', '#59441c', '#625022'], lite: ['#796430', '#725d27', '#7f6a34'], dark: ['#493718', '#4e3c1d'] },
    { base: ['#4c4926', '#504d26', '#464322'], lite: ['#686434', '#605c2e', '#6d6736'], dark: ['#3d3b1e', '#39361c'] },
    { base: ['#6d5c26', '#726028', '#675622'], lite: ['#8c7836', '#907c3a', '#82702e'], dark: ['#57471d', '#51431c'] },
  ];
  const famAt = (x, y) => { const v = 0.62 * vn(x * 1.5 + 3.1, y * 1.7 + 7.7) + 0.38 * vn(x * 4.1 + 11.3, y * 3.7 + 1.9); return v < 0.36 ? 0 : v < 0.62 ? 1 : v < 0.85 ? 2 : 3; };
  // The lobes are painted once each, a score of them to a family, on a sheet beside the cloth, and laid on it from
  // there (turned over, larger, smaller): a lobe is not a circle, it is cut with seven or eight straight edges, as a
  // shape is in a weaving or under his brush; a flat tone, broken by a few broad chips of its near neighbours, with a
  // row of lighter chips along its top, a looser one inside it, and the dark under it. Below each is its shadow:
  // the same cut in the family's dark, the dark he leaves under a mass.
  const CELL = 56, VAR = 20, RREF = 19;
  const sheet = document.createElement('canvas'); sheet.width = CELL * VAR; sheet.height = CELL * (FAM.length * 2 + 1);
  {
    const cloth = g; g = sheet.getContext('2d');
    for (let f = 0; f < FAM.length; f++) {
      const F = FAM[f];
      for (let v = 0; v < VAR; v++) {
        const x = CELL * (v + 0.5), y = CELL * (2 * f + 0.5), rr = RREF, n = 7 + Math.floor(rand() * 2), a00 = R(0, TAU), p = [];
        for (let i = 0; i < n; i++) { const a = a00 + (i + R(-0.28, 0.28)) / n * TAU, k = rr * R(0.74, 1.14); p.push(Math.cos(a) * k * 1.12, Math.sin(a) * k * 0.9); }
        const lay = (yy, k) => { g.beginPath(); for (let i = 0; i < p.length; i += 2) { if (i) g.lineTo(x + p[i] * k, yy + p[i + 1] * k); else g.moveTo(x + p[i] * k, yy + p[i + 1] * k); } g.closePath(); g.fill(); };
        g.fillStyle = css(v % 7 === 3 ? '#382a1a' : pick(F.dark), 0.06); lay(y + CELL, 1.06);
        g.fillStyle = css(pick(F.base), 0.07); lay(y, 1);
        for (let i = 0; i < 3; i++) { const a = R(0, TAU), d = rr * R(0.1, 0.5); chip(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, rr * R(0.3, 0.46), rr * R(0.18, 0.3), R(-0.7, 0.7), css(pick(F.base), 0.1)); }
        const a0 = Math.PI * R(1.08, 1.2), a1 = Math.PI * R(1.8, 1.92), n1 = Math.max(3, Math.round(rr * (a1 - a0) / 6.0));
        for (let i = 0; i < n1; i++) { const a = a0 + (a1 - a0) * (i + R(0.2, 0.8)) / n1; chip(x + Math.cos(a) * rr * R(0.66, 0.8), y + Math.sin(a) * rr * R(0.6, 0.74), R(3, 4.8), R(1.9, 3), a + 1.57 + R(-0.5, 0.5), css(pick(F.lite), 0.09)); }
        const n2 = Math.max(2, Math.round(n1 * 0.8));
        for (let i = 0; i < n2; i++) { const a = Math.PI * R(0.9, 2.1), d = rr * R(0.05, 0.55); chip(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, R(2.8, 4.4), R(1.8, 2.8), R(-0.9, 0.9), css(rand() < 0.5 ? pick(F.lite) : rand() < 0.6 ? pick(F.base) : pick(F.dark), 0.1)); }
        for (let i = 0; i < n2; i++) { const a = Math.PI * R(0.05, 0.95), d = rr * R(0.25, 0.82); chip(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.85, R(2.8, 4.6), R(1.8, 2.8), R(-0.7, 0.7), css(rand() < 0.75 ? pick(F.dark) : pick(F.base), 0.08)); }
      }
      g = cloth; yield; g = sheet.getContext('2d');
    }
    // (and his small blossoms, white and gold, a few of each: five petals and a heart)
    for (let v = 0; v < VAR; v++) blossom(CELL * (v + 0.5), CELL * (FAM.length * 2 + 0.5), 3.0, v < 14 ? WHITE : GOLD);
    g = cloth;
  }
  const stamp = (v, row, x, y, k, flip) => { g.setTransform((flip ? -k : k) * KS, 0, 0, k * KS, x * KS, y * KS); g.drawImage(sheet, v * CELL, row * CELL, CELL, CELL, -CELL / 2, -CELL / 2, CELL, CELL); };
  {
    const rows = Math.round((FY1 - FY0) / 0.092), cols = Math.round((FX1 - FX0) / 0.15), lobes = [];
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const cx = FX0 + (i + (j % 2) * 0.5 + R(-0.34, 0.34)) / cols * (FX1 - FX0), cy = FY0 + (j + R(-0.32, 0.32)) / rows * (FY1 - FY0), r = R(0.066, 0.125), f = famAt(cx, cy), n = 3 + Math.floor(rand() * 3);
        lobes.length = 0;
        for (let q = 0; q < n; q++) { const a = Math.PI * (0.08 + 0.84 * (q + R(0.1, 0.9)) / n), d = r * R(0.3, 0.66); lobes.push(m(cx + Math.cos(a) * d * 1.35), m(cy - Math.sin(a) * d * 0.7), m(r * R(0.34, 0.6)) / RREF, Math.floor(rand() * VAR) % VAR, rand() < 0.5); }
        lobes.push(m(cx + R(-0.2, 0.2) * r), m(cy + r * 0.12), m(r * R(0.5, 0.64)) / RREF, Math.floor(rand() * VAR) % VAR, rand() < 0.5);
        for (let q = 0; q < lobes.length; q += 5) stamp(lobes[q + 3], 2 * f + 1, lobes[q], lobes[q + 1] + 1.7, lobes[q + 2] * 1.02, lobes[q + 4]);
        for (let q = 0; q < lobes.length; q += 5) stamp(lobes[q + 3], 2 * f, lobes[q], lobes[q + 1], lobes[q + 2], lobes[q + 4]);
        if (tick(lobes.length * 0.6)) { g.setTransform(KS, 0, 0, KS, 0, 0); yield; }
      }
    }
    g.setTransform(KS, 0, 0, KS, 0, 0);
  }
  // (buff where a bough's bark shows through the leaves: broken runs of pale chips, climbing)
  for (let bx = FX0 + R(0.15, 0.4); bx < FX1 - 0.1; bx += R(0.45, 0.8)) {
    const ph = R(0, TAU), amp = R(0.04, 0.09), xAt = y => bx + amp * Math.sin(y * 1.9 + ph) + 0.03 * Math.sin(y * 5.3 + ph * 2.0);
    for (let y = FY0 + 0.02; y < FY1 - 0.02; y += R(0.02, 0.032)) {
      const v = vn(y * 3.1 + bx * 3.0, bx * 7.7); if (v < 0.56) continue;
      const wide = (v - 0.56) * 60;
      for (let i = 0; i < 2; i++) chip(m(xAt(y)) + R(-1, 1) * (3 + wide), m(y) + R(-3, 3), R(4.5, 8), R(3, 4.8), R(1.1, 2.0), css(pick(BUFF), 0.07));
      if (rand() < 0.5) chip(m(xAt(y)) + (4 + wide) * 1.3, m(y) + R(-3, 3), R(4, 7), R(2.5, 4), R(1.1, 2.0), css(pick(['#3a2b18', '#44321a']), 0.06));
    }
    yield;
  }
  // (his small white blossoms, in drifts)
  for (let i = 0; i < 2600; i++) {
    const x = R(FX0, FX1), y = R(FY0, FY1); if (vn(x * 2.3 + 40.0, y * 2.6 + 9.0) < 0.44 + 0.3 * rand()) continue;
    stamp(rand() < 0.9 ? Math.floor(rand() * 14) % 14 : 14 + Math.floor(rand() * 6) % 6, FAM.length * 2, m(x), m(y), R(0.8, 1.17), rand() < 0.5);
  }
  g.setTransform(KS, 0, 0, KS, 0, 0);
  yield;

  // ---- his border. The top: an olive ochre band, fronds hatched across it, pale rosettes, a few orange flowers
  const y0 = m(BAT), y1 = m(BAT + BT);
  g.fillStyle = css('#6c5c2c', 0); g.fillRect(0, y0, PW, y1 - y0);
  for (let i = 0; i < 2600; i++) chip(R(0, PW), R(y0, y1), R(5, 10), R(2.5, 4.5), R(-0.35, 0.35), css(pick(['#7f6f38', '#6f5d2c', '#71633a', '#836f3a', '#614e29', '#665526', '#5d4d26']), 0.06));
  yield;
  // (the fronds: fans of short curved strokes, as he hatches them; and leaves lying along the band)
  g.lineCap = 'round';
  for (let x = m(0.1); x < PW - m(0.1); x += m(R(0.07, 0.13))) {
    const y = R(y0 + 8, y1 - 8), a0 = R(0, TAU), n = 5 + Math.floor(rand() * 5), len = m(R(0.05, 0.1)), col = css(pick(['#513c1e', '#4a3a1c', '#5b4a22', '#44401f']), 0.06);
    g.strokeStyle = col; g.lineWidth = R(1.6, 2.6);
    for (let i = 0; i < n; i++) { const a = a0 + (i - n / 2) * 0.17, ox = Math.cos(a0 + 1.57) * (i - n / 2) * 4.2, oy = Math.sin(a0 + 1.57) * (i - n / 2) * 4.2; g.beginPath(); g.moveTo(x + ox, y + oy); g.quadraticCurveTo(x + ox + Math.cos(a) * len * 0.5 + Math.sin(a) * 5, y + oy + Math.sin(a) * len * 0.5 - Math.cos(a) * 5, x + ox + Math.cos(a) * len, y + oy + Math.sin(a) * len); g.stroke(); }
    for (let i = 0; i < 4; i++) chip(x + R(-22, 22), y + R(-16, 16), R(6, 11), R(3, 5), R(-0.8, 0.8), css(pick(['#5a5a2e', '#62602f', '#4f4c26', '#6c6532']), 0.07));
    if (tick(n + 5)) yield;
  }
  for (let x = m(0.32); x < PW - m(0.3); x += m(R(0.26, 0.52))) {
    const y = R(y0 + m(0.05), y1 - m(0.05));
    rosette(x, y, m(R(0.026, 0.036)), rand() < 0.3 ? ['#d8cfa0', '#cfc592', '#e0d6a8'] : GOLD, '#8a7430');
    if (rand() < 0.55) rosette(x + m(R(0.05, 0.09)), y + R(-12, 12), m(R(0.016, 0.022)), ['#cdb962', '#bfa94e', '#d6c46f'], '#7a6628');
    if (rand() < 0.45) blossom(x - m(R(0.07, 0.13)), R(y0 + 10, y1 - 10), R(2.6, 3.4), ['#d99a1e', '#cf8d18', '#e0a52a']);
  }
  yield;
  // The sides: a narrow russet edging, the colour of his corners, with a few small flowers; and the corners themselves
  for (const sx of [0, 1]) {
    const x0 = sx ? PW - m(BS) : 0, x1 = sx ? PW : m(BS);
    g.fillStyle = css('#55371a', 0); g.fillRect(x0, y1, x1 - x0, m(BB0) - y1);
    for (let i = 0; i < 1300; i++) chip(R(x0, x1), R(y1, m(BB0)), R(4.5, 9), R(2.5, 4.5), R(0.9, 2.2), css(pick(['#593a1a', '#6a4120', '#4b2b10', '#674e23', '#5a3f1c', '#4f3216']), 0.07));
    yield;
    for (let y = y1 + 14; y < m(BB0) - 10; y += R(26, 60)) blossom(R(x0 + 7, x1 - 7), y, R(2.4, 3.2), rand() < 0.5 ? GOLD : WHITE);
    const cx0 = sx ? PW - m(BS + 0.1) : 0, cw = m(BS + 0.1);
    g.fillStyle = css('#5d3a1a', 0); g.fillRect(cx0, y0, cw, y1 - y0);
    for (let i = 0; i < 300; i++) chip(R(cx0, cx0 + cw), R(y0, y1), R(4, 8), R(2.5, 4), R(0, 3), css(pick(['#593a1a', '#6a4120', '#4b2b10', '#775a29', '#674e23']), 0.07));
    for (let i = 0; i < 7; i++) blossom(R(cx0 + 8, cx0 + cw - 8), R(y0 + 8, y1 - 8), R(2.4, 3.2), rand() < 0.5 ? GOLD : ['#cfc9a2', '#c9d3c4']);
    yield;
  }
  // The foot: his plain brown band, laid in long level touches
  const b0 = m(BB0), b1 = m(LATH);
  g.fillStyle = css('#72593a', 0); g.fillRect(0, b0, PW, b1 - b0);
  for (let i = 0; i < 2400; i++) chip(R(0, PW), R(b0, b1), R(7, 15), R(1.4, 2.4), R(-0.05, 0.05), css(pick(['#765e3c', '#6e5636', '#7c6542', '#695133', '#735b3a']), 0.045));
  yield;
  // (the line he draws between border and field: dark, and broken)
  g.fillStyle = css('#3a2a16', 0);
  for (let x = m(BS); x < PW - m(BS); x += R(8, 15)) { g.fillRect(x, y1 - 1.5 + R(-1, 1), R(6, 12), 3); g.fillRect(x, b0 - 1.5 + R(-1, 1), R(6, 12), 3); }
  for (let y = y1; y < b0; y += R(8, 15)) { g.fillRect(m(BS) - 1.5 + R(-1, 1), y, 3, R(6, 12)); g.fillRect(PW - m(BS) - 1.5 + R(-1, 1), y, 3, R(6, 12)); }
  // The batten along the top and the lath in the foot: plain wood
  for (const [a, b, cols] of [[0, y0, ['#6b4f2c', '#5d4324', '#7a5c34', '#553c20']], [b1, PH, ['#5d4324', '#553c20', '#6b4f2c']]]) {
    g.fillStyle = css(cols[0], 0); g.fillRect(0, a, PW, b - a);
    for (let i = 0; i < 420; i++) chip(R(0, PW), R(a, b), R(14, 40), R(1, 2), 0, css(pick(cols), 0.06));
    g.fillStyle = 'rgba(30,20,10,0.55)'; g.fillRect(0, a === 0 ? b - 2 : a, PW, 2);
  }
}

// ------------------------------------------------------------------ the cloth's shader --
const f3 = v => v.toFixed(4);
const CLOTH_GLSL = /* glsl */`
uniform vec3 uO; uniform vec4 uAx;
uniform vec4 uHaul;      // off the roll (m), lifted (m), the roll: how far out of place, how high above the floor
uniform vec4 uMove;      // a ripple: where it is (m from the top) and how deep; the swing at the foot (m); the folds (0..1)
uniform vec4 uMore;      // the belly while it is hauled; the time; the cords' end (m above the floor); rings and cords shown (0..1)
uniform vec4 uBox;       // the picture and its frame: half width, foot, top (above the floor); how far the cloth may come out behind it
uniform float uTilt;     // how much higher the batten's right end is than its middle (m)
uniform vec4 uPuff;      // seconds since each of the three puffs of dust (less than 0: not yet); how much of it there is
const float HC = ${f3(HC)}, R0 = ${f3(R0)}, KK = ${KK.toFixed(6)}, OW = ${f3(O_WALL)}, OS = ${f3(O_SKIRT)};
// Where the cloth is: x along the wall, s down it from its top edge -> (along, up, out), in metres.
vec3 clothAt(float x, float s) {
  float l = uHaul.x, Rl = sqrt(R0 * R0 + KK * (HC - l));
  if (s > l) {                                                    // still on the roll: wound round its lath, face inwards
    float r = sqrt(R0 * R0 + KK * (HC - s)), th = (2.0 / KK) * (Rl - r) + uHaul.z / Rl * 0.8;
    return vec3(x, Rl + uHaul.w + uHaul.y - r * sin(th), OS + Rl + uHaul.z - r * cos(th));
  }
  float free = smoothstep(0.0, 0.16, uHaul.y);
  // (the two cords never pull quite together: the batten goes up one end first, and the cloth with it)
  float y = Rl + l + uHaul.y + uHaul.w - s + uTilt * (x / ${f3(W / 2)}) * mix(1.0 - s / max(l, 0.3), 1.0, free);
  float lean = (1.0 - smoothstep(0.2, 0.5, y)) * (1.0 - free);    // over the skirting and onto the roll, until its foot is free
  float pin = smoothstep(0.0, 0.3, s) * mix(smoothstep(0.0, 0.4, l - s), 1.0, free), hang = s / max(l, 0.4);
  float d = uMove.y * exp(-pow((s - uMove.x) / 0.34, 2.0)) * (0.78 + 0.22 * sin(x * 1.9 + uMove.x * 1.3));
  d += uMore.x * sin(3.14159 * hang) * (0.75 + 0.25 * sin(x * 1.3 + uMore.y * 1.7));
  d *= pin;
  d += uMove.z * pow(hang, 1.7) * (0.86 + 0.14 * sin(x * 0.9 + 1.0));
  d += uMove.w * 0.016 * (0.5 + 0.5 * sin(x * 4.6 + 1.6 * sin(x * 1.7 + 0.5) + 0.35 * s)) * smoothstep(0.0, 0.6, s);
  float inx = 1.0 - smoothstep(uBox.x, uBox.x + 0.08, abs(x)), iny = smoothstep(uBox.y - 0.08, uBox.y, y) * (1.0 - smoothstep(uBox.z, uBox.z + 0.08, y));
  d = min(max(d, 0.0), mix(1.0, uBox.w, inx * iny));
  return vec3(x, y, mix(OW, OS + uHaul.z, lean) + d);
}
`;

lifeFor(109926, {
  title: /^Landscape: Window Overlooking/,
  word: 'verdure',
  // The work is 3.8 m wide and its frame's top is 3.4 m up: the look camera stands back across the room and keeps
  // the whole of it in view, with the hanging round it and the foot of the wall under it.
  // (It looks a hand's breadth left of the picture's middle, so the picture stands that much to the right on the
  // screen and its left edge is clear of the card with its title while that is up.)
  stage: { out: 1.2, half: 3.0, cam: { dist: 5.45, side: 0.001, height: 1.35, fov: 48, lookU: -0.28, lookOut: 0, lookH: 2.04 } },
  wake: 2, ret: 2.2,

  build(L) {
    const tone = h => { const c = L.pal.near(h, 0.12).convertLinearToSRGB(); return [c.r * 255, c.g * 255, c.b * 255]; };
    // ---- the cloth's paint: one canvas, painted a step at a time from now on (it is finished long before a look)
    const KS = LOWMEM ? 0.5 : 1, cv = document.createElement('canvas'); cv.width = Math.round(PW * KS); cv.height = Math.round(PH * KS);
    const g = cv.getContext('2d'); g.fillStyle = '#453620'; g.fillRect(0, 0, cv.width, cv.height);
    const tex = this.tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    const job = paintCloth(g, tone, 109926, KS); this.painted = false;
    // (and a small texture of chance, for the unevenness of a thing made by hand)
    const nd = new Uint8Array(64 * 64 * 4), nr = rng(244); for (let i = 0; i < nd.length; i++) nd[i] = Math.floor(nr() * 256);
    const noise = new THREE.DataTexture(nd, 64, 64, THREE.RGBAFormat); noise.wrapS = noise.wrapT = THREE.RepeatWrapping; noise.magFilter = THREE.LinearFilter; noise.minFilter = THREE.LinearMipmapLinearFilter; noise.generateMipmaps = true; noise.needsUpdate = true;
    let steps = 0;
    const step = () => {
      if (this.tex !== tex) return;                                 // (let go while it was being painted)
      const t0 = performance.now(); let r; do r = job.next(); while (!r.done && performance.now() - t0 < 5);
      // (should a look come before the paint is dry, what there is of it is shown, and the rest as it comes: the
      // cloth is still rolled up, back outwards, for the first two seconds of a show)
      if (r.done) { tex.needsUpdate = true; this.painted = true; } else { if (this.live && ++steps % 12 === 0) tex.needsUpdate = true; setTimeout(step, 0); }
    };
    setTimeout(step, 0);

    // ---- one mesh: the cloth (a grid, x along the wall and s down the cloth), two cords, two rings, the roll's shadow
    const NX = 56, NS = 148, pos = [], q = [], idx = [];
    for (let j = 0; j <= NS; j++) for (let i = 0; i <= NX; i++) { pos.push((i / NX - 0.5) * W, j / NS * HC, 0); q.push(i / NX, j / NS); }
    for (let j = 0; j < NS; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const quad = (kind, pts) => { const n = pos.length / 3; for (const [x, s, qx, qy] of pts) { pos.push(x, s, kind); q.push(qx, qy); } idx.push(n, n + 1, n + 2, n + 2, n + 1, n + 3); };
    for (const u of [-CORD_U, CORD_U]) {
      for (let k = 0; k < 8; k++) quad(1, [[u, k / 8, -1, k / 8], [u, k / 8, 1, k / 8], [u, (k + 1) / 8, -1, (k + 1) / 8], [u, (k + 1) / 8, 1, (k + 1) / 8]]);
      quad(2, [[u, RING_Y, -1, -1], [u, RING_Y, 1, -1], [u, RING_Y, -1, 1], [u, RING_Y, 1, 1]]);
    }
    quad(3, [[-W / 2 - 0.2, -0.02, -1, 0], [W / 2 + 0.2, -0.02, 1, 0], [-W / 2 - 0.2, 0.5, -1, 1], [W / 2 + 0.2, 0.5, 1, 1]]);
    // (and the dust a rolled cloth lets go of when it is shaken out: motes, along its foot and down its sides,
    // never where the picture is; each has its own number, kept in the fraction of its kind)
    for (let i = 0; i < MOTES; i++) {
      const side = L.rand() < 0.3, sg = L.rand() < 0.5 ? -1 : 1, x = side ? sg * (L.hw + L.fw + 0.08 + L.rand() * 0.6) : (L.rand() - 0.5) * (W - 0.1), y = side ? 0.7 + L.rand() * 1.9 : 0.3 + L.rand() * 0.34, kind = 4 + (i + 0.5) / MOTES * 0.9;
      quad(kind, [[x, y, -1, -1], [x, y, 1, -1], [x, y, -1, 1], [x, y, 1, 1]]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 2)); geo.setIndex(idx);

    const foot = L.bottom - L.y - L.fw, head = L.top - L.y + L.fw, o = L.floor(0, 0);
    // (where this work's label is, from the museum's own cards: the cloth has a place cut for it)
    const card = new THREE.Vector4(99, 99, 0, 0), cards = L.k.museum.cards;
    if (cards && L.art.i != null) {
      const mm = new THREE.Matrix4(), cp = new THREE.Vector3(), cq = new THREE.Quaternion(), cs = new THREE.Vector3();
      cards.getMatrixAt(L.art.i, mm); mm.decompose(cp, cq, cs);
      if (cs.x > 0.01) card.set(L.local(cp.x, cp.z).u, cp.y - L.y, cs.x / 2 + 0.004, cs.y / 2 + 0.004);
    }
    const U = this.U = {
      tCloth: { value: tex }, tNoise: { value: noise },
      uO: { value: new THREE.Vector3(o.x, L.y, o.z) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) },
      uHaul: { value: new THREE.Vector4(0, 0, -0.4, 0) }, uMove: { value: new THREE.Vector4(0, 0, 0, 0) }, uMore: { value: new THREE.Vector4(0, 0, RING_Y, 0) },
      uBox: { value: new THREE.Vector4(L.hw + L.fw + 0.03, foot - 0.03, head + 0.03, 0.02) },
      uCard: { value: card }, uTilt: { value: 0 }, uPuff: { value: new THREE.Vector4(-1, -1, -1, 0) }, uDustC: { value: new THREE.Color('#e9dcb8') },
      uLamp: { value: new THREE.Vector3(0, head + 0.2, 0.85) },      // the picture lamp (stood a little further out than it is: a soft light, not a raking one)
      uLight: { value: new THREE.Vector4(0.42, 1.25, 0, 0) },        // the room's own light on it, the lamp's; -; the roll's shadow
      uLining: { value: new THREE.Color('#6e6149') }, uCordC: { value: L.pal.near('#a8956a', 0.1) }, uBrass: { value: new THREE.Color('#b08a3c') },
    };
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: true, side: THREE.DoubleSide, forceSinglePass: true, fog: false });
    mat.clothTex = tex; mat.noiseTex = noise;                        // (so the kit finds the textures and lets them go with the rest, where memory is short)
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec2 aQ;
${CLOTH_GLSL}
varying vec3 vuL, vuN; varying vec3 vuQ; varying float vuS;`)
        .replace('#include <begin_vertex>', `
  float kind = position.z; vec3 loc; vec3 nrm = vec3(0.0, 0.0, 1.0); vuS = 0.0;
  if (kind < 0.5) {
    float x = position.x, s = position.y;
    loc = clothAt(x, s);
    vec3 ax = clothAt(x + 0.05, s) - clothAt(x - 0.05, s), as = clothAt(x, min(s + 0.03, HC)) - clothAt(x, max(s - 0.03, 0.0));
    nrm = normalize(cross(as, ax)); vuS = s;
  } else if (kind < 1.5) {                                        // a cord: from its ring down to the batten, or to its own loose end
    float v = position.y, y1 = uMore.z, slack = smoothstep(0.0, 0.6, y1 - (sqrt(R0 * R0 + KK * (HC - uHaul.x)) + uHaul.x + uHaul.y));
    y1 += (1.0 - slack) * uTilt * position.x / ${f3(W / 2)};
    loc = vec3(position.x + aQ.x * 0.0075 + slack * 0.03 * sin(v * 5.0 + uMore.y * 3.1) * v, mix(${f3(RING_Y)}, min(y1, ${f3(RING_Y)}), v), OW + 0.012 + slack * 0.02 * v);
  } else if (kind < 2.5) {
    loc = vec3(position.x + aQ.x * 0.034 * uMore.w, position.y + aQ.y * 0.034 * uMore.w, OW + 0.016);
  } else if (kind < 3.5) {
    loc = vec3(position.x, 0.012, position.y);
  } else {
    // a mote: shaken off at one of the three puffs, out into the room, then drifting and sinking in the lamp's light
    float sd = fract(kind) / 0.9, pf = floor(sd * 3.0), s2 = fract(sd * 37.7), s3 = fract(sd * 91.3);
    float age = pf < 0.5 ? uPuff.x : pf < 1.5 ? uPuff.y : uPuff.z, life = 1.4 + 1.2 * s2, a = age / life;
    float on = (age > 0.0 && a < 1.0) ? 1.0 : 0.0, puff = 1.0 - exp(-max(age, 0.0) * 2.4);
    loc = vec3(position.x + 0.05 * sin(age * 0.9 + sd * 77.0) + (s3 - 0.5) * 0.12 * puff,
               position.y + (s2 - 0.35) * 0.16 * puff - 0.04 * max(age, 0.0) + 0.02 * sin(age * 1.4 + sd * 40.0),
               OW + 0.03 + (0.07 + 0.2 * s3) * puff);
    float sz = (0.007 + 0.011 * s2 + 0.007 * puff) * on;
    loc.xy += aQ * sz; vuS = on * uPuff.w * pow(sin(3.14159 * clamp(a, 0.0, 1.0)), 0.7) * (0.5 + 0.5 * s3);
  }
  vuL = loc; vuN = nrm; vuQ = vec3(aQ, kind);
  vec3 transformed = uO + vec3(uAx.x, 0.0, uAx.y) * loc.x + vec3(0.0, loc.y, 0.0) + vec3(uAx.z, 0.0, uAx.w) * loc.z;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D tCloth; uniform vec3 uO, uLamp, uLining, uCordC, uBrass, uDustC; uniform vec4 uAx, uLight, uHaul, uBox, uMore, uCard;
varying vec3 vuL, vuN; varying vec3 vuQ; varying float vuS;
const float HC = ${f3(HC)}, R0 = ${f3(R0)}, KK = ${KK.toFixed(6)}, OS = ${f3(O_SKIRT)};
vec3 vuC; float vuA;
// (unevenness, from a small texture of chance: four numbers at a place given in millimetres; with distance it evens out to nothing)
uniform sampler2D tNoise;
#define vuZ(p) texture2D(tNoise, (p) / 64.0)`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  float kind = vuQ.z; vec3 n = normalize(vuN);
  // (which side of the cloth this is, from where the eye is: its face, or its lining)
  vec3 eye = vec3(dot(cameraPosition.xz - uO.xz, uAx.xy), cameraPosition.y - uO.y, dot(cameraPosition.xz - uO.xz, uAx.zw)) - vuL;
  bool lining = dot(n, eye) < 0.0; if (lining) n = -n;
  vec3 toL = uLamp - vuL; float dl = length(toL); toL /= dl;
  // the lamp over the picture: brightest under it, falling away down and along the wall; and the room's own dim light
  float lamp = uLight.y * max(dot(n, toL), 0.0) / (1.0 + dl * dl * 0.16);
  float lit = uLight.x + lamp;
  if (kind < 0.5) {
    // (his edges are dragged, not cut: each touch is read a millimetre or two out of true, where the eye is near enough to tell)
    vec2 mm = vec2(vuQ.x * ${f3(W)}, vuS) * 1000.0; float fw = max(fwidth(mm.y), 0.001), near = 1.0 - smoothstep(0.6, 2.2, fw), mid = 1.0 - smoothstep(2.0, 7.0, fw);
    vec4 z1 = vuZ(mm * 0.37), z2 = vuZ(mm * 0.9 + 7.0), z3 = vuZ(mm * 0.11 + 3.0), z4 = vuZ(mm * 0.023 + 11.0);
    vec2 drag = (z1.rg - 0.5) * 3.2 * mid + (z2.ba - 0.5) * 1.6 * near;
    vec2 uv = vec2(vuQ.x + drag.x / ${f3(W * 1000)}, 1.0 - vuQ.y - drag.y / ${f3(HC * 1000)});
    vec3 c = texture2D(tCloth, uv).rgb;
    // a weave: fine ribs across, the warp just showing, and the unevenness of a thing made by hand (faded out with distance)
    float rib = 0.5 + 0.5 * sin(mm.y * 2.2), warp = 0.5 + 0.5 * sin(mm.x * 1.5 + 0.8 * sin(mm.y * 0.11));
    c *= 1.0 - near * (0.13 * rib + 0.035 * warp) + near * 0.08;
    c *= 0.9 + 0.2 * z3.r * (0.5 + 0.5 * z4.g) * mix(0.5, 1.0, mid) + 0.12 * (z1.b - 0.5) * mid;
    // thin paint on coarse canvas, and no varnish: a little of the colour gone out of it, a little chalk in its darks
    c = mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, 0.84) * 0.96 + 0.006;
    // its back: a plain lining, a coarse linen, its threads uneven
    if (lining) c = uLining * (0.84 + 0.2 * z3.g) * (1.0 - near * 0.16 * rib) * (1.0 - mid * 0.13 * (0.5 + 0.5 * sin(mm.y * 0.7 + 5.0 * z4.b))) * (0.94 + 0.12 * (z1.a - 0.5));
    // the frame's shadow on it, below the frame and a little down each side (the lamp is above)
    float inx = 1.0 - smoothstep(uBox.x - 0.04, uBox.x + 0.05, abs(vuL.x));
    float under = inx * (1.0 - smoothstep(0.0, 0.2, uBox.y + 0.03 - vuL.y)) * step(vuL.y, uBox.y + 0.03);
    float beside = (1.0 - smoothstep(0.0, 0.07, abs(vuL.x) - uBox.x + 0.03)) * step(uBox.x - 0.03, abs(vuL.x)) * smoothstep(uBox.y - 0.1, uBox.y + 0.1, vuL.y) * (1.0 - smoothstep(uBox.z - 0.3, uBox.z, vuL.y));
    lit *= 1.0 - 0.42 * under - 0.2 * beside;
    // (a matte cloth shows its shape only by how it turns to the light: a ripple's upper slope takes the lamp, its
    // lower one loses it; a fold's flank towards the lamp is the lighter one)
    if (!lining) lit *= clamp(1.0 + 1.9 * n.y - 2.2 * n.x * sign(vuL.x) * smoothstep(0.2, 1.2, abs(vuL.x)), 0.5, 1.55);
    // its edges: a selvedge, not a ruled line
    float ex = (0.5 - abs(vuQ.x - 0.5)) * ${f3(W)}, es = min(vuS, HC - vuS);
    float edge = smoothstep(0.0, 0.004, min(ex, es) - 0.003 * z3.a);
    // (never over the label)
    if (abs(vuL.x - uCard.x) < uCard.z && abs(vuL.y - uCard.y) < uCard.w) discard;
    vuC = c * lit; vuA = edge;
  } else if (kind < 1.5) {
    float tw = 0.75 + 0.25 * sin(vuL.y * 420.0 + vuQ.x * 2.0);
    vuC = uCordC * tw * (uLight.x + uLight.y * 0.5 / (1.0 + dl * dl * 0.16)) * (1.0 - 0.45 * abs(vuQ.x)); vuA = uMore.w;
  } else if (kind < 2.5) {
    float r = length(vuQ.xy); vuA = smoothstep(1.0, 0.86, r) * smoothstep(0.42, 0.56, r) * uMore.w;
    vuC = uBrass * (uLight.x + uLight.y * 0.45 / (1.0 + dl * dl * 0.16)) * (0.8 + 0.5 * max(0.0, -vuQ.y));
  } else if (kind > 3.5) {
    float r = length(vuQ.xy); vuA = vuS * (1.0 - smoothstep(0.0, 1.0, r)) * 0.5;
    vuC = uDustC * (uLight.x * 0.6 + uLight.y * 1.1 / (1.0 + dl * dl * 0.16));
  } else {
    // the roll's shadow on the floor, soft, under and just in front of it
    float Rl = sqrt(R0 * R0 + KK * (HC - uHaul.x)), ax = OS + Rl + uHaul.z, dz = (vuL.z - ax) / (Rl * 1.5 + 0.03 + uHaul.w * 0.6);
    float ends = 1.0 - smoothstep(${f3(W / 2 - 0.05)}, ${f3(W / 2 + 0.16)}, abs(vuL.x));
    vuC = vec3(0.0); vuA = uLight.w * exp(-dz * dz) * ends * 0.5 / (1.0 + uHaul.w * 5.0);
  }
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = vuC; diffuseColor.a = vuA;\n#include <opaque_fragment>');
    };
    mat.customProgramCacheKey = () => 'vuillard-verdure';
    const mesh = this.mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 4.5;                                         // after the lamp's wash on the wall (4), before the label's glow (5)
    L.add(mesh);
    this.hide();
  },

  hide() { if (this.mesh) this.mesh.visible = false; },

  // How far it has been hauled at show-time t (m); o.i, o.t0: the heave it is in or has just had, and when that began.
  haul(t, calm, o) {
    let p = 0; o.i = -1; o.t0 = 0; o.tilt = 0;
    for (let i = 0; i < HEAVES.length; i++) {
      const [t0, d, to] = HEAVES[i]; if (t < t0) break;
      const x = (t - t0) / d, from = i ? HEAVES[i - 1][2] : 0;
      p = lerp(from, to, calm ? ease.inOut(x) : ease.out(x));
      // (a jerk at the top of each heave, and it sags back a hand's breadth: whoever hauls takes a new grip)
      if (!calm && i > 0 && i < HEAVES.length - 1) p -= 0.035 * ease.smooth(ramp(t, t0 + d, t0 + d + 0.25));
      o.i = i; o.t0 = t0;
      // (and one end leads: the right at one heave, the left at the next; it is levelled when it is up)
      if (i > 0) { const sg = i % 2 ? 1 : -1, xx = Math.min(1, x), rest = 0.014; o.tilt = sg * (0.05 * Math.sin(Math.PI * xx) + rest * xx) - (i > 1 ? sg * rest * (1 - xx) : 0); if (i === HEAVES.length - 1) o.tilt *= 1 - ease.smooth(ramp(t, t0 + d * 0.6, t0 + d + 0.5)); } else o.tilt = 0;
    }
    return p;
  },

  // The sounds of hanging it, on the show's own clock.
  band(L, calm) {
    const s = score(L), q = calm ? 0.55 : 1, soft = calm ? 0.05 : 0.004;
    // the roll comes out and lands
    s.hit(0.12, { d: 0.5, vol: 0.012 * q, bp: 900, q: 0.6, attack: 0.12 });
    s.hit(0.74, { d: 0.34, vol: 0.075 * q, lp: 170, attack: soft }); s.hit(0.75, { d: 0.12, vol: 0.02 * q, bp: 520, q: 0.8, attack: soft });
    if (!calm) s.hit(0.92, { d: 0.2, vol: 0.025, lp: 150, attack: soft });
    // the cords come down
    s.hit(0.35, { d: 0.7, vol: 0.008 * q, hp: 2600, attack: 0.25 });
    HEAVES.forEach(([t0, d], i) => {
      const last = i === HEAVES.length - 1, k = i === 0 ? 0.5 : 1;
      // a pulley's creak: two or three short rising squeaks; and the cloth
      for (let j = 0; j < (i === 0 ? 1 : 3); j++) { const f = (310 + 37 * ((i * 3 + j * 5) % 4)) * (last ? 0.9 : 1); s.note(t0 + j * 0.13, f, 0.11, { vol: 0.0075 * k * q, type: 'triangle', to: f * 1.22, attack: 0.02 }); }
      s.hit(t0 + 0.02, { d: d + 0.25, vol: 0.02 * k * q, bp: 1500, q: 0.5, attack: 0.1 });
      s.hit(t0 + 0.05, { d: d, vol: 0.012 * k * q, lp: 420, attack: 0.08 });
    });
    // its foot comes off the floor: the lath knocks once on the boards, and pats the wall as it swings in
    s.hit(T_FREE - 0.05, { d: 0.09, vol: 0.03 * q, bp: 700, q: 1.2, attack: soft });
    for (const [k, v] of [[1, 0.05], [2, 0.026], [3, 0.012]]) { s.hit(T_FREE + k * PAT - 0.02, { d: 0.12, vol: v * q, lp: 300, attack: soft }); s.note(T_FREE + k * PAT - 0.02, 150 - k * 8, 0.09, { vol: v * 0.3 * q, type: 'sine', attack: soft }); }
    s.hit(T_FREE + 0.1, { d: 1.6, vol: 0.011 * q, bp: 1100, q: 0.4, attack: 0.3 });
    return s.done();
  },

  start(L, resumed) {
    if (!this.painted) { this.live = true; this.tex.needsUpdate = true; }
    this.calm0 = L.calm; this.sc = this.band(L, L.calm); this.sc.from(resumed ? 1e9 : 0);
    this.p0 = P_END; this.pNow = 0; this.was = { shift: -0.3, drop: 0.4, shown: 0, cord: RING_Y, tied: false };
  },
  back() { this.p0 = this.pNow == null ? P_END : this.pNow; },
  end() { this.hide(); },
  reset() { this.told = false; this.hide(); },

  update(L) {
    const U = this.U, ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return', calm = L.calm, t = L.t;
    const o = this.o || (this.o = {});
    if (calm !== this.calm0 && showing) { this.calm0 = calm; this.sc = this.band(L, calm); this.sc.from(t + 0.3); }      // (the setting changed as it ran)
    const deep = calm ? 0.5 : 1;
    // ---- the roll comes out of the wall under the picture, and drops
    let shift = 0, drop = 0, cordEnd = RING_Y, shown = 1, p = 0;
    if (!back) {
      shift = -0.3 * (1 - ease.out(ramp(t, 0.05, 0.6)));
      const fall = ramp(t, 0.34, 0.74); drop = 0.4 * (1 - fall * fall);
      if (t > 0.74 && !calm) drop = 0.022 * Math.abs(Math.sin((t - 0.74) / 0.16 * Math.PI)) * (1 - ramp(t, 0.74, 0.9));      // (one small bounce: it is heavy)
      shown = ease.smooth(ramp(t, 0.1, 0.4));
      p = this.haul(t, calm, o); this.pNow = p;
    } else {
      // let down, rolling itself up as it comes; then the roll goes back into the wall, and the cords run up
      // (from wherever it had got to, should the look be broken off before the roll has even landed)
      const w = this.was;
      p = this.p0 * (1 - ease.inOut(ramp(L.ret, 0, 0.6)));
      shift = lerp(w.shift, -0.32, ease.in(ramp(L.ret, 0.62, 1)));
      drop = w.drop * (1 - ease.smooth(ramp(L.ret, 0, 0.3)));
      shown = w.shown * (1 - ease.smooth(ramp(L.ret, 0.8, 1)));
    }
    const l = Math.min(p, HC), lift = Math.max(0, p - HC), Rl = Math.sqrt(R0 * R0 + KK * (HC - l)), top = Rl + l + lift;
    U.uHaul.value.set(l, lift, shift, drop);
    // the cords: down from their rings, loose, to the roll; then fast to the batten and taut
    if (!back) { const fallen = ramp(t, 0.3, 1.05); cordEnd = t < HEAVES[0][0] ? lerp(RING_Y, R_START + 0.02, fallen * fallen) : top; }
    else { const from = this.was.tied ? top : this.was.cord; cordEnd = L.ret < 0.6 ? from : lerp(from, RING_Y, ease.inOut(ramp(L.ret, 0.6, 0.95))); }
    if (!back) { const w = this.was || (this.was = {}); w.shift = shift; w.drop = drop; w.shown = shown; w.cord = cordEnd; w.tied = t >= HEAVES[0][0]; }
    U.uMore.value.z = Math.min(RING_Y, cordEnd); U.uMore.value.w = shown; U.uMore.value.y = t;
    // ---- how it moves: a ripple down it from each heave; a belly while it is hauled; the swing when its foot is free
    let rs = 0, ra = 0, belly = 0, swing = 0, fold = 0;
    if (!back) {
      if (o.i >= 1) { const a = t - o.t0; rs = 0.2 + a * 4.6; ra = 0.055 * deep * Math.exp(-a / 0.55) * ramp(a, 0, 0.08); }
      belly = (t > HEAVES[0][0] && t < T_FREE ? 0.012 + 0.008 * Math.sin(t * 2.3) : 0) * deep * ramp(t, HEAVES[0][0], HEAVES[1][0]) * (1 - ramp(t, T_FREE - 0.3, T_FREE));
      if (t > T_FREE) {
        const a = t - T_FREE;
        // out as it comes off the floor, back to pat the wall, out again less far: three pats, and then it hangs
        swing = 0.11 * deep * Math.exp(-a / 0.75) * Math.abs(Math.sin(Math.PI * a / PAT)) * (a < PAT * 3.02 ? 1 : 0);
        fold = ease.smooth(ramp(t, T_FREE + 0.5, T_HUNG));
        // after that it only hangs: it breathes, hardly at all, and now and then it settles
        const b = t - T_HUNG;
        if (b > 0) { swing += 0.004 * deep * (1 + Math.sin(b * 0.9)); const n = Math.floor(b / 9), a2 = b - n * 9 - 5; if (a2 > 0 && a2 < 3) { rs = a2 * 1.6; ra = 0.014 * deep * Math.sin(Math.PI * a2 / 3); } }
      }
    } else { belly = 0.02 * deep * Math.sin(Math.PI * ramp(L.ret, 0, 0.6)); fold = this.p0 >= P_END - 0.01 ? 1 - ramp(L.ret, 0, 0.25) : 0; }
    U.uMove.value.set(rs, ra, swing, fold); U.uMore.value.x = belly;
    U.uTilt.value = back ? 0 : (o.tilt || 0) * deep;
    // the dust: a little as its foot leaves the floor, more at the first pat, less at the second
    if (back) U.uPuff.value.w = (calm ? 0.5 : 1) * (1 - ramp(L.ret, 0, 0.3)); else U.uPuff.value.set(t - T_FREE, t - T_FREE - PAT, t - T_FREE - 2 * PAT, calm ? 0.5 : 1);
    // (its light is the room's: this picture's lamp, when that is on, and the gallery's own lights, when they are)
    { const room = L.k.museum.rooms && L.k.museum.rooms[L.art.room], on = L.art.lit == null ? 1 : L.art.lit, up = room && room.wake ? room.wake : 0; U.uLight.value.x = 0.32 + 0.1 * on + 0.3 * up; U.uLight.value.y = 1.25 * on; }
    U.uLight.value.w = (1 - ramp(lift, 0, 0.12)) * (back ? 1 - ramp(L.ret, 0.75, 1) : ramp(t, 0.3, 0.74));
    this.mesh.visible = true;
    if (showing) {
      this.sc.play(t);
      if (!this.told && !L.quiet && t > 2.2) { this.told = true; L.k.say('A hanging is hauled up the wall behind it, in the leaves of its own painted border. Vuillard made this to decorate a library.', 5); }
    }
    L.voice().place();
  },
});
