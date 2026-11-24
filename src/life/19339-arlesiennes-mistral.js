// Paul Gauguin, Arlésiennes (Mistral) (1888), Gallery 241. The word: wrap.
//
// He painted it in December, in the public garden across the street from the yellow house he was sharing with
// Vincent in Arles, with the mistral blowing. Everything in it is wrapped against the cold: the women in their dark
// shawls, hands holding them shut at the mouth, and, towering beside them, two orange-yellow cones, which the museum
// reads as probably hay coverings put over plants to shield them from the frost. A red fence bars the way, and a
// big green bush fills the near corner.
//
// Look at it and that corner of the garden comes out from under the frame, toy-sized: his ground in flat shapes,
// hatched in his thin slanting strokes (the pale path, the blue of the pond by the wall, the band of yellow, the
// green lawn); the bush swelling up out of the path, a dark mound thatched with his long green and yellow strokes;
// the red pickets dealt out across the lawn one by one, each standing up with a clack; and two bare young trees with
// a last few orange leaves, drawn like the tree in the top corner of the picture (what is under his straw he does not
// show: these are ours). Then a cold breath crosses the floor. The trees lean and shiver and lose leaves. So the
// straw comes: long streaks of his orange and yellow slide out from under the picture and stand up against each
// tree, the back ones first, closing round the front like a shawl pulled shut, and the tree draws its branches in.
// A cord slides up from the foot, gathering the straw to a neck, and the tops spring out above it in a tuft: one
// cone, then the other, as they stand in the picture. On the first tie a violin begins the Largo of Vivaldi's
// "Winter" (1725), whose sonnet has it: contented days by the fire while outside it pours.
//
// Then the hush, and the mistral proper: it crosses the floor from the left, the bush is combed over, the cones heel
// one after the other with their skirts lifting and their tufts laid flat, the fence rattles, a few straws are
// pulled out, and leaves come streaming from under the picture, catch between the pickets and on the bush. The
// cones hold. It passes; they spring upright and settle, snug, and the tune has not missed a note. While you keep
// looking a light air plays in the tufts and now and then a smaller gust goes over. When you stop, the two cones
// glide home under the picture still wrapped, the leaves blow back, the fence lies down picket by picket, the bush
// sinks and the ground draws in.
//
// Two draw calls: the ground (one flat mesh, painted in its shader) and one rig of flat painted marks (every straw,
// plume, leaf, stroke of the bush and picket). The cones tower over the toy, as they tower over the women (0.86 m at
// most), and still stand well under the frame's bottom rail from where you look. Things are drawn his way: the
// pickets and rails are flat cards of one vermilion fenced by his dark blue-violet contour, each cut a little
// differently and leaning its own way; the bush is a dark mass inside an inked contour, with the lighter comma
// strokes only where the light falls; the cones have a thin contour of their own.
//
// With "Reduce motion and flashing" on: no shiver, flutter or rattle, the gusts lean things half as far and they come
// upright once, slowly; the clacks and the rustle are dropped for soft single sounds.
//
// What it does not do: the four women stay in the picture, and the face he hid in the bush is not put on ours
// (nobody is modelled, walked about or blown at, and the cones are given no faces, steps or gestures), because the
// women are private people going home in the cold, turned in on themselves, and the show is what they are wrapped
// against, not them; and no farandole or other "Provençal" tune is played to stand for Arles.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { score, hz, inked } from './stagecraft.js';
import { parse } from '../carols.js';

const TAU = Math.PI * 2;
const W = { u: 0.8, o: 0.6 };                 // the way the mistral blows over the floor (along the wall, out from it)
const WSPEED = 3.2;                           // how fast its front crosses (m/s)
// The two wrapped trees, as they stand in the picture (the left one further back): where (along, out), how tall the
// cone and how wide its foot, the tree inside, when the tree comes up, when its straw sets out and when it is tied.
const CONES = [
  { u: -0.3, o: 0.58, H: 0.8, R: 0.125, sap: 0.54, grow: 0.6, t0: 2.35, tie: 3.8 },
  { u: 0.28, o: 0.9, H: 0.86, R: 0.135, sap: 0.58, grow: 0.85, t0: 3.55, tie: 5.0 },
];
const NO = 24, NI = 12, NT = 8;               // a cone: outer straws, inner (darker) ones, plumes of the tuft
const NECK = 0.85, RN = 0.016, RL = 0.07;     // the tie (part of the height); the neck's radius tied, and loose
const FENCE = { u0: -0.12, o: 1.3, n: 9, pitch: 0.112, h: 0.32, w: 0.078, from: 0.3, t0: 0.3, each: 0.08, slide: 0.45, up: 0.2 };
// The big green bush of the picture's near corner: where, its half sizes (along, up, out), when it swells up.
const BUSH = { u: -0.82, o: 1.1, a: 0.36, h: 0.4, b: 0.27, t0: 0.85, rows: [[0.2, 7], [0.48, 15], [0.76, 22], [1.04, 28], [1.3, 32]] };
const F_END = FENCE.t0 + (FENCE.n - 1) * FENCE.each + FENCE.slide + FENCE.up;
const T_COLD = 1.9, T_G = 5.6, GP = 7.2;      // the first cold breath; the mistral; and a smaller gust every so often
const E8 = 0.6;                               // a quaver of the Largo (s)
// Antonio Vivaldi, Concerto in F minor "L'inverno", Op. 8 No. 4, RV 297 (1725), II. Largo, bars 1 to 8, checked
// against the Mutopia Project's edition: the solo violin; the first violins' pizzicato semiquavers (the rain); the
// cello's quavers. One beat here is a quaver.
const LARGO = 'Eb5 Bb5:.5 Ab5:.5 G5 F5:.5 Eb5:.5 F5 Bb4 R Bb4 | Ab5:.5 G5:.5 F5:.5 Eb5:.5 D5 Ab5 Ab5 G5 R G5 | ' +
  'F5 G5:.5 Ab5:.5 Bb5 C6:.5 D6:.5 Eb5 F5:.5 G5:.5 Ab5 Bb5:.5 C6:.5 | D5 Eb5:.5 F5:.5 G5 Ab5:.5 Bb5:.5 C5 D5:.5 Eb5:.5 F5 G5:.5 Eb5:.5 | ' +
  'D5:2.5 Bb4:.5 A4:.5 Bb4:.5 F5:2.5 Bb4:.5 A4:.5 Bb4:.5 | G5:2.5 Bb4:.5 A4:.5 Bb4:.5 A5:2.5 F5:.5 Eb5:.5 F5:.5 | ' +
  'Bb5 Bb4 R Bb5 Bb5:.5 Ab5:.5 G5:.5 F5:.5 Eb5:.5 D5:.5 C5:.5 Bb4:.5 | C5:3 Bb4 Bb4:2 R:2';
const RAIN = [['Eb5 G5 Bb5 G5', 2], ['D5 F5 Bb5 F5', 2], ['D5 F5 Ab5 F5', 2], ['Eb5 G5 Bb5 G5', 2],
  ['F5 D5 Bb5 Ab5 G5 F5 Eb5 D5 G5 C5 Ab5 G5 F5 Eb5 D5 C5', 1], ['F5 Bb4 G5 F5 Eb5 D5 C5 Bb4 Eb5 Ab4 F5 Eb5 D5 C5 Bb4 A4', 1],
  ['D5 F5 Bb5 F5', 4], ['Eb5 G5 Bb5 G5', 2], ['F5 A5 C6 A5', 2], ['D5 F5 Bb5 F5', 2], ['C5 F5 Bb5 F5', 2],
  ['C5 F5 A5 F5 C5 F5 A5 C5', 1], ['Bb4 D5 F5 D5', 2]];
const CELLO = [['Eb3', 4], ['Bb2', 8], ['Eb3', 4], ['D3', 4], ['C3', 4], ['Bb2', 4], ['Ab2', 2], ['A2', 2], ['Bb2', 8], ['Eb3', 8], ['Bb2', 4], ['F2', 8], ['Bb2', 4]];

const _f = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const trap = (t, a, b, c, d) => ease.smooth(ramp(t, a, b)) * (1 - ease.smooth(ramp(t, c, d)));

// A flat mark with a ridge down its middle, lying along +y from 0 to 1 and one wide at its widest: a straw of the
// wrapping (tapering to its top), a plume, a leaf. Its two long facets catch the light differently, and each length of
// it is a little lighter or darker, so a cone of them is streaked the way he streaked his.
function blade(seed, width, nl, vary = 0.16) {
  const pos = [], col = [];
  const P = (i, j) => { const y = i / nl, w = width(y); return [(j - 1) * 0.5 * w, y, j === 1 ? -0.17 * w : 0]; };
  for (let i = 0; i < nl; i++) for (let j = 0; j < 2; j++) {
    const y = (i + 0.5) / nl, s = (j ? 1 - vary * 0.75 : 1) * (1 - vary + vary * _f(i + seed * 7.3, j + 0.5)) * (0.8 + 0.2 * ease.smooth(y / 0.3));
    for (const p of [P(i, j), P(i, j + 1), P(i + 1, j + 1), P(i, j), P(i + 1, j + 1), P(i + 1, j)]) { pos.push(p[0], p[1], p[2]); col.push(s, s, s); }
    for (const p of [P(i, j), P(i + 1, j + 1), P(i, j + 1), P(i, j), P(i + 1, j), P(i + 1, j + 1)]) { pos.push(p[0], p[1], p[2]); col.push(s * 0.9, s * 0.9, s * 0.9); }      // (its other side)
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals(); return g;
}
// A flat card cut to an outline ([[x, y], ...], anticlockwise), coloured in and fenced by a dark contour of its own
// (ix, iy wide), as he draws a thing: both sides, no thickness, so there is no lit edge to make it look manufactured.
function card(pts, fill, ink, ix, iy) {
  let cx = 0, cy = 0; for (const q of pts) { cx += q[0] / pts.length; cy += q[1] / pts.length; }
  const inn = pts.map(([x, y]) => [x - Math.sign(Math.round((x - cx) * 5)) * ix, y - (Math.abs(x - cx) < 0.2 ? 1.7 : 1) * Math.sign(y - cy) * iy]);
  const pos = [], col = [], tri = (a, b, c, k) => { for (const q of [a, b, c, a, c, b]) { pos.push(q[0], q[1], 0); col.push(k.r, k.g, k.b); } };
  for (let i = 0; i < pts.length; i++) { const j = (i + 1) % pts.length; tri(pts[i], pts[j], inn[j], ink); tri(pts[i], inn[j], inn[i], ink); tri([cx, cy], inn[i], inn[j], fill); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals(); return g;
}
// A geometry with its faces turned inside out (a contour hull: drawn front faces only, it shows round a shape).
function inside(g) {
  const p = g.attributes.position.array, n = g.attributes.normal.array, c = g.attributes.color.array;
  for (let f = 0; f < p.length; f += 9) for (const a of [p, n, c]) for (let k = 0; k < 3; k++) { const x = a[f + 3 + k]; a[f + 3 + k] = a[f + 6 + k]; a[f + 6 + k] = x; }
  for (let i = 0; i < n.length; i++) n[i] = -n[i];
  return g;
}
// A round, tapering stem through some points, smooth, shaded from c0 at its foot to c1 at its tip.
function stem(pts, r0, r1, c0, c1, seg = 6, n = 10) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
  const T = new THREE.Vector3(), N = new THREE.Vector3(), Bn = new THREE.Vector3(), ref = new THREE.Vector3(0.31, 0.12, 0.94).normalize(), P = new THREE.Vector3(), C = new THREE.Color(), rows = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n, r = r0 + (r1 - r0) * s, row = []; curve.getPoint(s, P); curve.getTangent(s, T); N.crossVectors(T, ref).normalize(); Bn.crossVectors(T, N);
    C.copy(c0).lerp(c1, s);
    for (let k = 0; k <= seg; k++) { const a = k / seg * TAU, ca = Math.cos(a), sa = Math.sin(a), nx = N.x * ca + Bn.x * sa, ny = N.y * ca + Bn.y * sa, nz = N.z * ca + Bn.z * sa; row.push([P.x + nx * r, P.y + ny * r, P.z + nz * r, nx, ny, nz, C.r * (0.86 + 0.14 * ca), C.g * (0.86 + 0.14 * ca), C.b * (0.86 + 0.14 * ca)]); }
    rows.push(row);
  }
  const pos = [], nor = [], col = [], put = v => { pos.push(v[0], v[1], v[2]); nor.push(v[3], v[4], v[5]); col.push(v[6], v[7], v[8]); };
  for (let i = 0; i < n; i++) for (let k = 0; k < seg; k++) { const a = rows[i][k], b = rows[i][k + 1], c = rows[i + 1][k + 1], d = rows[i + 1][k]; for (const v of [a, b, c, a, c, d]) put(v); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

lifeFor(19339, {
  title: /^Arl[ée]siennes/,
  word: 'wrap',
  // (a glass case stands 2.4 m out in front of this work, a little to the left: the look camera stands beside it, to
  // the right, where the fence is nearest, as he has it in the picture's corner, and low, so the cones tower as his
  // do; it is aimed by hand, to keep the whole work above and the fence's foot below without stepping back into the
  // case: whole: false)
  stage: { out: 1.7, half: 1.15, cam: { dist: 2.5, side: 0.65, height: 0.55, fov: 63, lookU: 0.1, lookOut: 0.6, lookH: 0.63, whole: false } },
  wake: 2, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.2) => P.near(h, a);
    this.B = new THREE.Matrix4().makeBasis(new THREE.Vector3(L.tx, 0, L.tz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(L.nx, 0, L.nz)).setPosition(L.floor(0, 0));
    const V = this.V = { m: new THREE.Matrix4(), c: new THREE.Matrix4(), a: new THREE.Matrix4(), b: new THREE.Matrix4(), w: new THREE.Matrix4(), x: new THREE.Vector3(), y: new THREE.Vector3(), z: new THREE.Vector3(), p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), e: new THREE.Euler(0, 0, 0, 'YXZ'), ax: new THREE.Vector3() };
    this.wall = L.wall;

    // ------------------------------------------------------------ the marks
    const rig = this.rig = L.rig(300, 9000, L.paint({ rough: 0.9, glow: 0.55 }));
    const taper = y => 1 - 0.84 * y;
    const G = {
      straw: [0, 1, 2].map(k => rig.geo(blade(k + 1, y => taper(y) * (1 + 0.1 * Math.sin(y * 9 + k * 2)), 5))),
      plume: rig.geo(blade(5, y => (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, y * 1.6))) * (1 - y * y * 0.9), 3)),
      stroke: rig.geo(blade(7, y => 0.35 + 0.65 * Math.pow(Math.sin(Math.PI * (0.06 + 0.9 * y)), 0.5), 5, 0.07)),
      leaf: rig.geo(blade(9, y => Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * y)), 0.75), 4)),
      band: rig.geo(shape.merge([shape.lathe([[1, -0.5], [1.05, 0], [1, 0.5]], 18, col('#8a3a20')), inside(shape.lathe([[1, -0.5], [1.05, 0], [1, 0.5]], 18, col('#8a3a20')))])),
    };
    // the young tree: a pale trunk and four thin drooping branches (unit: its own height)
    const trunkC = [col('#9c8f96', 0.15), col('#c2b6b4', 0.15)], twigC = [col('#b08a52', 0.15), col('#c98f3c', 0.15)];
    G.trunk = rig.geo(stem([[0, 0, 0], [0.025, 0.3, 0.012], [-0.012, 0.66, -0.008], [0.014, 1, 0]], 0.036, 0.014, trunkC[0], trunkC[1]));
    G.twig = rig.geo(stem([[0, 0, 0], [0.1, 0.13, 0], [0.24, 0.2, 0], [0.36, 0.14, 0], [0.42, 0.03, 0]], 0.014, 0.006, twigC[0], twigC[1], 5, 8));
    this.tip = new THREE.Vector3(0.42, 0.03, 0);
    // the fence, as he draws it: flat vermilion, coloured in inside his dark blue-violet contour. Each picket is a
    // card cut by hand (three cuts, none quite true), and the two rails are cards of their own
    const red = col('#c63a22', 0.12), redR = col('#b93320', 0.12), ink = col('#23264e', 0.25), IX = 0.0048 / FENCE.w, IY = 0.0048 / FENCE.h;
    G.picket = [[0.02, 0.85, 0.87, 0.04], [-0.03, 0.88, 0.84, -0.05], [0.0, 0.83, 0.86, 0.07]].map(([lean, sl, sr, apex], k) =>
      rig.geo(card([[-0.5, 0], [0.5, 0], [0.5 + lean, sr], [apex, 1], [-0.5 + lean, sl]], k === 1 ? redR : red, ink, IX, IY)));
    G.rail = rig.geo(card([[0, -0.5], [1, -0.5], [1, 0.5], [0, 0.5]], redR, ink, 0.004, 0.16));
    // the cones' own contour, lightly: a shell a finger outside the straw, turned inside out, so only its rim shows
    const rim = col('#5a2c30', 0.2);
    G.hull = CONES.map(c => rig.geo(inside(shape.lathe([[c.R * 1.05 + 0.009, -0.002], [RN + 0.011, c.H * NECK + 0.004]], 22, rim))));

    // ------------------------------------------------------------ the straw of each cone
    const straws = [['#eaae2c', 5], ['#f1c44c', 3], ['#dc8c1f', 5], ['#c9691c', 3], ['#a94c1e', 1.2], ['#a8923a', 0.8]].map(([c, w]) => [col(c, 0.15), w]);
    const lit = col('#f3cb55', 0.12), deep = col('#b8551a', 0.15), inner = col('#a95a1c', 0.15);
    let tot = 0; for (const s of straws) tot += s[1];
    const pick = r => { r *= tot; for (const s of straws) if ((r -= s[1]) <= 0) return s[0]; return straws[0][0]; };
    const C = new THREE.Color();
    this.S = CONES.map((c, ci) => {
      const Hn = c.H * NECK, list = [];
      for (let i = 0; i < NO + NI; i++) {
        const inn = i >= NO, n = inn ? NI : NO, k = inn ? i - NO : i, a = (k + (inn ? 0.5 : 0) + (L.rand() - 0.5) * 0.5) / n * TAU;
        const rho = c.R * (inn ? 0.78 : 1) * (0.96 + 0.08 * L.rand()), w = TAU * rho / n * (inn ? 2.3 : 1.9) * (0.8 + 0.4 * L.rand());
        const id = rig.add(G.straw[i % 3]);
        // lit from the left, as his are: yellow on that side, deep orange on the other; streaked at random among it
        const side = 0.5 - 0.5 * Math.cos(a - 0.5), base = inn ? inner : pick(L.rand());
        C.copy(base).lerp(side < 0.5 ? lit : deep, inn ? 0 : Math.abs(side - 0.5) * 0.9); rig.mesh.setColorAt(id, C);
        // the back ones stand first, the front (towards the look) last
        const front = 0.5 - 0.5 * Math.cos(a - 1.05), stag = inn ? front * 0.75 : 0.12 + front * 0.88;
        list.push({ id, a, rho, w, inn, len: Math.hypot(rho - RN, Hn) * (0.985 + 0.03 * L.rand()), tl: c.t0 + 0.45 * stag + 0.05 * L.rand(), su: c.u * 0.75 + (L.rand() - 0.5) * 0.6, jr: (L.rand() - 0.3) * 0.03, ja: (L.rand() - 0.5) * 0.5, ph: L.rand() * TAU, lee: Math.max(0, Math.cos(a - Math.atan2(W.o, W.u))) });
      }
      const plumes = [];
      for (let i = 0; i < NT; i++) { const id = rig.add(G.plume); C.copy(pick(L.rand())).lerp(i % 3 ? deep : lit, 0.35); rig.mesh.setColorAt(id, C); plumes.push({ id, a: (i + L.rand() * 0.6) / NT * TAU, sp: 0.05 + 0.2 * L.rand(), len: (c.H - Hn) * (0.9 + 0.4 * L.rand()), ph: L.rand() * TAU }); }
      // the tree inside, its branches and the last leaves on them
      const tree = { trunk: rig.add(G.trunk), twigs: [], leaves: [] };
      [[0.42, 0.4], [0.58, 2.7], [0.74, 4.5], [0.9, 1.6]].forEach(([h, yaw], j) => { tree.twigs.push({ id: rig.add(G.twig), h, yaw: yaw + ci * 1.3, s: 0.85 + 0.3 * L.rand() }); tree.leaves.push({ id: rig.add(G.leaf), torn: j % 2 === 0 ? T_COLD + 0.18 + 0.16 * j + 0.1 * ci : 0, ph: L.rand() * TAU }); });
      return { c, Hn, list, plumes, tree, band: rig.add(G.band), hull: rig.add(G.hull[ci]) };
    });
    const leafC = ['#e0902a', '#d8b03a', '#c85a24', '#e6a23c', '#b8742a'].map(h => col(h, 0.15));
    for (const s of this.S) s.tree.leaves.forEach((l, j) => rig.mesh.setColorAt(l.id, leafC[j % leafC.length]));

    // ------------------------------------------------------------ the bush: a dark mound thatched with his long green strokes
    {
      const dark = col('#1f4a3c', 0.2), body = shape.ball(1, dark, 3), bp = body.attributes.position, bn = body.attributes.normal;
      // (a smooth mound: flat underneath, its normals the ellipsoid's own, so no facet shows between the strokes; and
      // his contour round it, an inked shell)
      for (let i = 0; i < bp.count; i++) { if (bp.getY(i) < 0) bp.setY(i, 0); const x = bp.getX(i) / BUSH.a, y = Math.max(0.05, bp.getY(i)) / BUSH.h, z = bp.getZ(i) / BUSH.b, l = Math.hypot(x, y, z); bn.setXYZ(i, x / l, y / l, z / l); }
      // the strokes: dark greens close to the mound's own, lying close and overlapping; the lighter commas only where
      // the light falls (from the left and above, as on his)
      const greens = [['#2c6440', 4], ['#35743e', 3], ['#27583c', 3], ['#3f7f3a', 1.5]].map(([c, w]) => [col(c, 0.18), w]), lights = ['#7fa23a', '#a3b040', '#8fae3e', '#c39a34'].map(c => col(c, 0.15));
      let gt = 0; for (const g of greens) gt += g[1];
      const B = this.Bush = { body: rig.add(rig.geo(inked(body, 0.06, '#' + ink.getHexString()))), list: [] };
      for (const [th, n] of BUSH.rows) for (let i = 0; i < n; i++) {
        const id = rig.add(G.stroke), ph = (i + L.rand() * 0.7) / n * TAU; let r = L.rand() * gt, c = greens[0][0]; for (const g of greens) if ((r -= g[1]) <= 0) { c = g[0]; break; }
        const lit = -0.62 * Math.sin(th) * Math.cos(ph) + 0.5 * Math.cos(th) + 0.3 * Math.sin(th) * Math.sin(ph), comma = lit > 0.3 && L.rand() < 0.42;
        rig.mesh.setColorAt(id, comma ? C.copy(lights[Math.floor(L.rand() * lights.length)]) : C.copy(c).multiplyScalar(0.86 + 0.2 * Math.max(0, lit) + 0.12 * L.rand()));
        B.list.push({ id, th: th + (L.rand() - 0.5) * 0.16, ph, len: (comma ? 0.1 : 0.13) + 0.06 * L.rand(), w: (comma ? 0.034 : 0.05) + 0.022 * L.rand(), lift: 0.05 * L.rand(), f: L.rand() * TAU });
      }
    }

    // ------------------------------------------------------------ the fence
    this.F = [];
    // (no two pickets quite alike: a little wider or narrower, taller or shorter, leaning its own way)
    for (let i = 0; i < FENCE.n; i++) this.F.push({ id: rig.add(G.picket[(i * 2 + (i > 4 ? 1 : 0)) % 3]), u: FENCE.u0 + i * FENCE.pitch + (L.rand() - 0.5) * 0.014, tl: FENCE.t0 + i * FENCE.each, sx: FENCE.w * (0.86 + 0.26 * L.rand()), sy: FENCE.h * (0.9 + 0.17 * L.rand()), roll: (L.rand() - 0.5) * 0.11, ph: L.rand() * TAU });
    this.rails = [FENCE.h * 0.64, FENCE.h * 0.16].map(y => ({ id: rig.add(G.rail), y }));

    // ------------------------------------------------------------ the leaves the wind carries
    // each: when it sets off (tl; for a passer, after each gust begins), how long it flies, from where to where it comes
    // to rest (along, up, out), its hops, its tumbling, and how it lies
    this.LF = [];
    const leaf = (kind, tl, torn = null, wisp = false) => {
      const id = rig.add(wisp ? G.plume : G.leaf), r = L.rand; rig.mesh.setColorAt(id, wisp ? straws[this.LF.length % 4][0] : leafC[this.LF.length % leafC.length]);
      let u1, o1, y1 = 0.02 + 0.012 * r(), pitch = 0.12 + 0.3 * r(), yaw = r() * TAU;
      const z = r();
      if (kind === 'pass') { u1 = 0.5 + 0.5 * r(); o1 = 1.25 + 0.6 * r(); y1 = 0.08; }                    // (it sails on over the fence, and is gone)
      else if (kind === 'gust' && z < 0.27) { u1 = FENCE.u0 + (Math.floor(r() * (FENCE.n - 1)) + 0.5) * FENCE.pitch; o1 = FENCE.o - 0.012; y1 = 0.04 + 0.2 * r(); pitch = 1.25 + 0.4 * r(); yaw = (r() - 0.5) * 0.5; }      // caught between two pickets
      else if (z < 0.55) {                                                                                  // on the path, or caught on the bush
        u1 = -1.08 + 0.75 * r(); o1 = 0.45 + 1.0 * r();
        const e = 1 - ((u1 - BUSH.u) / (BUSH.a + 0.02)) ** 2 - ((o1 - BUSH.o) / (BUSH.b + 0.02)) ** 2; if (e > 0) { y1 = BUSH.h * Math.sqrt(e) + 0.03; pitch = 0.3 + 0.5 * r(); }
      }
      else { u1 = -0.5 + 1.2 * r(); o1 = 0.36 + 0.84 * r(); }                                              // on the lawn
      // it comes with the wind, from under the picture (or off the tree it was the last leaf of)
      const far = (o1 + 0.06) / W.o * (0.75 + 0.25 * r()), u0 = torn ? torn[0] : Math.max(-1.1, u1 - W.u * far), o0 = torn ? torn[2] : -0.06, y0 = torn ? torn[1] : 0.03;
      this.LF.push({ id, kind, tl, D: (kind === 'pass' ? 0.8 : 0.65) + 0.5 * r(), u0, y0, o0, u1, y1, o1, hops: 2 + Math.floor(r() * 3), hop: (kind === 'pass' ? 0.3 : kind === 'gust' ? 0.1 : 0.06) + (kind === 'gust' ? 0.3 * r() * r() : 0.14 * r()), wid: wisp ? 0.14 : 0.5, sp: 9 + 9 * r(), sr: 5 + 8 * r(), yaw, pitch, size: wisp ? 0.2 + 0.08 * r() : 0.07 + 0.03 * r(), ph: r() * TAU, home: r() });
    };
    this.S.forEach((s, ci) => s.tree.leaves.forEach((l, j) => { if (l.torn) { l.fly = this.LF.length; leaf('torn', l.torn, [s.c.u + 0.18 * Math.cos(s.tree.twigs[j].yaw), s.c.sap * 0.75, s.c.o + 0.18 * Math.sin(s.tree.twigs[j].yaw)]); } }));
    for (let i = 0; i < 5; i++) leaf('early', T_COLD + 0.05 + 0.75 * L.rand());
    for (let i = 0; i < 30; i++) leaf('gust', T_G + 0.02 + 0.6 * L.rand() * L.rand() + 0.027 * i);
    // (and a few straws the gust pulls out of each skirt)
    CONES.forEach((c, ci) => { for (let i = 0; i < 3; i++) leaf('gust', T_G + 0.45 + 0.2 * ci + 0.25 * i + 0.1 * L.rand(), [c.u + c.R * 0.8 * W.u, 0.1 + 0.25 * L.rand(), c.o + c.R * 0.8 * W.o], true); });
    for (let i = 0; i < 6; i++) leaf('pass', 0.1 + 0.9 * L.rand());

    // ------------------------------------------------------------ the ground: flat shapes of his colour, hatched
    const lu = this.lu = {
      uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uC: { value: 0 }, uFence: { value: new THREE.Vector3(FENCE.u0 - 0.03, FENCE.u0 - 0.03, FENCE.o) },
      uRing: { value: CONES.map(c => new THREE.Vector3(c.u, c.o, 0)) }, uSh: { value: CONES.map(c => new THREE.Vector3(c.u, c.o, 0)) },
      uCol: { value: [col('#2a8a55', 0.12), col('#1d6b4e', 0.12), col('#74b04e', 0.12), col('#e3c84e', 0.12), col('#cfa93a', 0.12), col('#5a74c8', 0.12), col('#7f74ba', 0.12), col('#d8603a', 0.12), col('#a48d88', 0.1), col('#917c7c', 0.1), col('#b47a62', 0.12), col('#93604c', 0.12)] },
    };
    const lm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false });
    lm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, lu);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform vec3 uO, uFence; uniform vec4 uAx; uniform float uC; uniform vec3 uRing[2]; uniform vec3 uSh[2]; uniform vec3 uCol[12];
float lwH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float lwN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(lwH(i), lwH(i + vec2(1.0, 0.0)), f.x), mix(lwH(i + vec2(0.0, 1.0)), lwH(i + vec2(1.0, 1.0)), f.x), f.y); }
vec3 lwCol; float lwA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz; vec2 q = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw));
  float wx = 0.022 * sin(q.x * 6.3 + 0.7) + 0.011 * sin(q.x * 15.1 + 2.0), wy = 0.02 * sin(q.y * 7.1 + 1.1) + 0.01 * sin(q.y * 17.3);
  // his strokes: thin, parallel, on the slant, each a little its own colour
  vec2 qw = q + 0.035 * vec2(sin(q.y * 5.3 + 1.0), sin(q.x * 4.1));
  vec2 s = vec2(qw.x * 0.82 + qw.y * 0.57, -qw.x * 0.57 + qw.y * 0.82) / vec2(0.013, 0.07);
  float lane = floor(s.x); s.y += lwH(vec2(lane, 2.3)) * 7.0;
  vec2 id = vec2(lane, floor(s.y)), f = fract(s);
  float h = lwH(id), h2 = lwH(id + 31.7), j = (h - 0.5) * 0.034;
  float body = smoothstep(0.0, 0.22, f.x) * smoothstep(1.0, 0.78, f.x) * smoothstep(0.0, 0.1, f.y) * smoothstep(1.0, 0.9, f.y);
  // the shapes: the path on the left (it cuts across, as in the picture), the pond by the wall, the yellow band, the lawn
  float eL = q.x - (-1.0 + 0.44 * q.y + wy);
  vec2 bx = max(abs(q - vec2(-0.12, 0.84)) - vec2(0.62, 0.54), 0.0); float eB = 0.3 - length(bx) + 0.2 * (lwN(q * 2.1 + 1.7) - 0.5) + wx;
  float pond = 0.17 + wx * 0.8, yel = pond + 0.3 * smoothstep(-0.7, 0.15, q.x) + 0.02 * sin(q.x * 9.0 + 1.0);
  vec3 c;
  float onPath = step(eL + j * 4.5, 0.0);      // (the lawn's strokes and the path's are laid in among each other)
  if (onPath > 0.5) c = mix(uCol[8], uCol[9], h2);
  else if (q.y + j < pond) c = h < 0.14 ? uCol[7] : mix(uCol[5], uCol[6], step(0.55, h2));
  else if (q.y + j < yel) c = mix(uCol[3], uCol[4], step(0.62, h2));
  else c = mix(mix(uCol[0], uCol[1], smoothstep(0.38, 0.68, lwN(q * 3.1 + 4.0) + (h2 - 0.5) * 0.3)), uCol[2], step(0.93, h) * 0.8);
  c *= 0.93 + 0.14 * h2; c = mix(c * 0.88, c, body);
  for (int i = 0; i < 2; i++) {
    // the bare earth round each tree, and the dark under the cone
    float d = length((q - uRing[i].xy) / vec2(1.0, 0.8)) + j * 1.6;
    if (d < 0.22 * uRing[i].z) c = mix(uCol[10], uCol[11], step(0.5, h2)) * (0.88 + 0.24 * h) * mix(0.82, 1.0, body);
    c *= 1.0 - 0.45 * uSh[i].z * smoothstep(0.22, 0.05, length((q - uSh[i].xy - vec2(0.03, 0.0)) / vec2(1.3, 0.85)));
  }
  // the line of shade under the fence
  c *= 1.0 - 0.3 * smoothstep(0.03, 0.0, abs(q.y - uFence.z - 0.004)) * step(uFence.x, q.x) * step(q.x, uFence.y);
  // its edge is broken stroke by stroke; it comes out from the wall stroke by stroke
  float edge = min(eB, q.y - 0.015);
  // (the path has no edge of its own: its strokes thin away to the floor)
  if (onPath > 0.5) edge = min(edge, 0.15 + eL * 0.4);
  edge = min(edge, uC * 2.2 - lwH(vec2(lane, 9.1)) * 0.3 - q.y);
  float fade = smoothstep(0.15, 0.0, edge);
  lwA = step(0.0, edge) * clamp((h - fade) * 5.0 + 0.5 * (1.0 - fade), 0.0, 1.0);
  lwCol = c * 0.82;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = lwCol; diffuseColor.a = lwA;\n#include <opaque_fragment>');
    };
    lm.customProgramCacheKey = () => 'mistral-lawn';
    this.lawn = L.decal({ w: 2.3, d: 1.85, u: -0.12, out: 0.9, material: lm });
    this.lawn.renderOrder = 5;

    // ------------------------------------------------------------ sound
    this.windLo = L.voice().loop({ lp: 420, hp: 80 }); this.windHi = L.voice().loop({ lp: 4200, hp: 1300 });
    this.bands = {}; this.calm = false; this.hold = 0; this.told = false;
    this.hideAll();
  },

  // The band for this show (two: one for "Reduce motion and flashing", with no runs of clacks and nothing sudden).
  band(L, calm) {
    if (this.bands[calm]) return this.bands[calm];
    const s = score(L), F = FENCE;
    s.hit(0.05, { d: 0.7, vol: 0.014, lp: 1300, attack: 0.15 });                                           // the lawn comes out
    if (calm) s.hit(F.t0 + 0.5, { d: 0.9, vol: 0.012, bp: 900, q: 0.8, attack: 0.3 });
    else for (let i = 0; i < F.n; i++) { const t = F.t0 + i * F.each + F.slide + F.up * 0.8; s.note(t, 430 + i * 26 + 40 * _f(i, 3), 0.05, { type: 'triangle', vol: 0.016, attack: 0.002 }); s.hit(t, { d: 0.03, vol: 0.016, bp: 1700, q: 2 }); }      // the pickets: tak, tak, tak
    for (const c of CONES) {
      s.note(c.grow + 0.1, 262, 0.4, { type: 'sine', vol: 0.012, to: 392, attack: 0.05 });                // a tree comes up
      // the straw: a dry rustle as it slides out and stands; the cord running up; the tie
      if (calm) s.hit(c.t0 + 0.1, { d: 1.2, vol: 0.012, hp: 2400, attack: 0.4 });
      else for (let i = 0; i < 16; i++) s.hit(c.t0 + 0.08 + i * 0.068 + 0.03 * _f(i, c.t0), { d: 0.07, vol: 0.006 + 0.008 * _f(i, 7 + c.t0), hp: 2200 + 1800 * _f(i, 5), attack: 0.004 });
      s.note(c.tie - 0.34, 240, 0.34, { type: 'triangle', vol: calm ? 0.007 : 0.012, to: 620, attack: 0.03 });
      s.note(c.tie, 150, 0.14, { type: 'sine', vol: calm ? 0.02 : 0.04, to: 105, attack: calm ? 0.03 : 0.004 }); if (!calm) s.hit(c.tie, { d: 0.07, vol: 0.02, lp: 900 });
    }
    // the fence in the gust
    if (!calm) for (let i = 0; i < 9; i++) s.hit(T_G + 0.42 + i * 0.11 + 0.05 * _f(i, 11), { d: 0.03, vol: 0.012 + 0.008 * _f(i, 13), bp: 1500 + 500 * _f(i, 17), q: 2 });
    // the Largo, from the first tie: the tune, the rain plucked above it, the cello under it
    const ev = [], tune = parse(LARGO);
    for (const n of tune.notes) if (n.m) ev.push({ t: n.t * E8, f: hz(n.m), d: Math.max(0.2, n.d * E8 * 0.96), type: 'sine', vol: 0.026, over: 2, overVol: 0.3, attack: 0.03 });
    let k = 0; for (const [cell, rep] of RAIN) for (let r = 0; r < rep; r++) for (const n of parse(cell).notes) { ev.push({ t: k * E8 / 2, f: hz(n.m), d: 0.13, type: 'triangle', vol: 0.0055, attack: 0.003 }); k++; }
    k = 0; for (const [n, rep] of CELLO) for (let r = 0; r < rep; r++) { ev.push({ t: k * E8, f: hz(parse(n).notes[0].m), d: 0.3, type: 'sine', vol: 0.014, attack: 0.012 }); k++; }
    s.loop(CONES[0].tie, 72 * E8, ev);                                                                        // (eight bars and one of rest)
    s.done();
    return (this.bands[calm] = s);
  },

  hideAll() { this.rig.mesh.visible = false; this.lawn.visible = false; this.windLo.set(0); this.windHi.set(0); },

  // The mistral's gust on something standing at (u, o) at show time t: 0..1 (it pushes), below 0 as the thing springs
  // back past upright afterwards. The front takes time to cross the floor.
  gust(t, u, o, spring = true) {
    const x = t - (u * W.u + o * W.o + 0.3) / WSPEED - T_G; if (x < 0) return 0;
    const n = Math.floor(x / GP), tau = x - n * GP, k = n ? 0.55 : 1, calm = this.calm;
    let g = ease.out(ramp(tau, 0, calm ? 0.7 : 0.3)) * (1 - ease.smooth(ramp(tau, 1.2, calm ? 2.1 : 1.5)));
    if (!calm) g *= 1 + 0.1 * Math.sin(tau * 19) * ramp(tau, 0.2, 0.5);
    if (spring && tau > 1.2) g -= (calm ? 0.12 : 0.3) * Math.exp(-(tau - 1.2) * (calm ? 1.6 : 3.2)) * Math.sin((tau - 1.2) * (calm ? 2.6 : 10));
    return g * k * (calm ? 0.5 : 1);
  },
  // All the wind there: the first cold breath, the light air after it, the hush, and the gusts. 0..1.
  wind(t, u, o) {
    const x = t - (u * W.u + o * W.o + 0.3) / WSPEED;
    const breath = (this.calm ? 0.3 : 0.45) * trap(x, T_COLD - 0.25, T_COLD + 0.15, T_COLD + 0.65, T_COLD + 1.5), air = 0.11 * ramp(x, T_COLD + 0.7, T_COLD + 1.7) * (0.7 + 0.3 * Math.sin(x * 0.9));
    return (breath + air) * (1 - 0.95 * trap(x, T_G - 0.75, T_G - 0.4, T_G - 0.05, T_G + 0.05)) + Math.max(0, this.gust(t, u, o, false));
  },

  // A mark stood at p with its length along Y (and its width as near X as may be), in the stage's own space.
  frame(m, px, py, pz, X, Y, w, len) {
    const Z = this.V.z; Z.crossVectors(X, Y); if (Z.lengthSq() < 1e-8) Z.set(0, 0, 1); Z.normalize(); X.crossVectors(Y, Z);
    return m.set(X.x * w, Y.x * len, Z.x * w, px, X.y * w, Y.y * len, Z.y * w, py, X.z * w, Y.z * len, Z.z * w, pz, 0, 0, 0, 1);
  },
  put(id, m) { this.rig.mat(id, this.V.w.multiplyMatrices(this.B, m)); },

  start(L) {
    this.calm = L.calm; this.sc = this.band(L, this.calm); this.sc.from(0); this.hold = 0;
    if (!this.told && !L.quiet) { this.told = true; L.k.say('Straw against the frost, most likely: the garden is wrapped up before the mistral comes.', 4); }
  },
  back(L) { this.hold = L.t; if (!L.quiet) L.k.synth.noise(0.7, { vol: 0.014, lp: 1200 }); },
  end() { this.hideAll(); },
  reset() { this.hideAll(); this.hold = 0; this.told = false; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return';
    if (!showing && !back) { this.hideAll(); return; }
    const t = showing ? L.t : this.hold, R = back ? L.ret : 0, calm = this.calm, V = this.V, rig = this.rig, lu = this.lu;
    if (showing) this.sc.play(L.t);
    rig.mesh.visible = true; this.lawn.visible = true;
    lu.uC.value = ease.out(ramp(t, 0, 0.8)) * (1 - ease.inOut(ramp(R, 0.5, 1)));
    const still = back ? 1 - ease.smooth(ramp(R, 0, 0.25)) : 1;            // (the wind drops as the look ends)

    // ---- the bush: it swells up out of the path, its strokes open and lie down; the wind combs it
    {
      const B = this.Bush, cb = showing ? t : Math.min(this.hold, BUSH.t0 + 0.95) * (1 - ease.smooth(ramp(R, 0.1, 0.85))), k = ramp(cb, BUSH.t0, BUSH.t0 + 0.75), on = k > 0;
      const sc = Math.max(0.001, calm ? ease.out(k) : ease.outBack(k)), open = ease.smooth(ramp(cb, BUSH.t0 + 0.2, BUSH.t0 + 0.95));
      rig.show(B.body, on);
      if (on) this.put(B.body, V.m.makeTranslation(BUSH.u, 0, BUSH.o).scale(V.s.set(BUSH.a * sc * 0.975, BUSH.h * sc * 0.975, BUSH.b * sc * 0.975)));
      for (let i = 0; i < B.list.length; i++) {
        const q = B.list[i]; rig.show(q.id, on); if (!on) continue;
        const st = Math.sin(q.th), ct = Math.cos(q.th), cp = Math.cos(q.ph), sp = Math.sin(q.ph), px = BUSH.a * st * cp, py = BUSH.h * ct, pz = BUSH.b * st * sp;
        // the mound's outward normal there, and the way down its side
        let nx = px / (BUSH.a * BUSH.a), ny = py / (BUSH.h * BUSH.h), nz = pz / (BUSH.b * BUSH.b); const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
        let dx = ny * nx, dy = ny * ny - 1, dz = ny * nz; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
        // (the wind presses the strokes flat on the side it comes from, and lifts and streams them over the top and in the lee)
        const w = this.wind(t, BUSH.u + px, BUSH.o + pz) * still, lee = Math.max(0, nx * W.u + nz * W.o) + 0.6 * ny;
        const lift = q.lift * open + (1 - open) * 0.3 + w * lee * (0.26 + (calm ? 0 : 0.16 * Math.sin(t * 12 + q.f))), cl = Math.cos(lift), sl = Math.sin(lift), blow = w * (0.14 + 0.34 * lee);
        V.y.set(dx * cl + nx * sl + W.u * blow, dy * cl + ny * sl + 0.25 * blow, dz * cl + nz * sl + W.o * blow).normalize(); V.x.set(-sp, 0, cp);
        // (a dab lies along the mound, its upper end fixed, a centimetre proud of it)
        const hl = q.len * 0.5 * open;
        this.frame(V.m, BUSH.u + (px - dx * hl + nx * 0.005) * sc, (py - dy * hl + ny * 0.005) * sc, BUSH.o + (pz - dz * hl + nz * 0.005) * sc, V.x, V.y, q.w * sc, q.len * sc * (0.4 + 0.6 * open)); this.put(q.id, V.m);
      }
    }

    // ---- the fence: dealt out from under the picture, each picket standing up as it arrives, the rails running out
    // along them; it rewinds to go home. In the wind the whole fence leans as one (rails and pickets together), and
    // each picket only shivers about its nail in the top rail.
    const cf = showing ? t : Math.min(this.hold, F_END) * (1 - ease.smooth(ramp(R, 0.04, 0.9)));
    const fmid = FENCE.u0 + (FENCE.n - 1) * FENCE.pitch / 2, fw = this.wind(t, fmid, FENCE.o) * still, fg = Math.max(0, this.gust(t, fmid, FENCE.o, false)) * still, flean = 0.06 * fw + 0.1 * fg;
    let fu = FENCE.u0 - 0.03, rail = FENCE.u0 - 0.06;
    for (let i = 0; i < this.F.length; i++) {
      const p = this.F[i], on = cf > p.tl; rig.show(p.id, on); if (!on) continue;
      const e = ease.out(ramp(cf, p.tl, p.tl + FENCE.slide)), k = ramp(cf, p.tl + FENCE.slide - 0.03, p.tl + FENCE.slide + FENCE.up), up = calm ? ease.smooth(k) : ease.outBack(k);
      const u = lerp(FENCE.from, p.u, e), o = lerp(-0.07, FENCE.o, e), sh = calm ? 0 : 0.05 * fg * Math.sin(t * 37 + p.ph) * up, yr = this.rails[0].y;
      V.e.set(-Math.PI / 2 * (1 - up) + flean * up, Math.atan2(p.u - FENCE.from, FENCE.o + 0.07) * (1 - ease.smooth(k)), p.roll * up, 'YXZ');
      V.m.compose(V.p.set(u, 0.006 * (1 - up), o), V.q.setFromEuler(V.e), V.s.set(1, 1, 1));
      V.a.makeRotationZ(sh).setPosition(Math.sin(sh) * yr, yr - Math.cos(sh) * yr, 0).scale(V.s.set(p.sx, p.sy, 1));
      this.put(p.id, V.m.multiply(V.a));
      if (k > 0.5) fu = p.u + 0.04;
      if (k > 0) rail = Math.max(rail, lerp(p.u - FENCE.pitch * 0.6, p.u + 0.055, ease.smooth(k)));
    }
    for (const r of this.rails) {
      const len = rail - (FENCE.u0 - 0.055), on = len > 0.02; rig.show(r.id, on); if (!on) continue;
      this.put(r.id, V.m.makeTranslation(FENCE.u0 - 0.055, 0, FENCE.o).multiply(V.a.makeRotationX(flean)).multiply(V.b.makeTranslation(0, r.y, 0.004).scale(V.s.set(len, 0.034, 1))));
    }
    lu.uFence.value.y = fu;

    // ---- the two trees and their straw
    for (let ci = 0; ci < this.S.length; ci++) {
      const s = this.S[ci], c = s.c, Hn = s.Hn;
      // where it stands (it glides home under the picture when the look ends), and how the wind leans it
      const kh = ease.inOut(ramp(R, 0.1 * (1 - ci), 0.66 + 0.12 * (1 - ci))), bu = lerp(c.u, c.u * 0.5 + 0.08, kh), bo = lerp(c.o, -0.32, kh);
      const wrapped = t >= c.tie, g = showing && wrapped ? this.gust(t, c.u, c.o) : 0, w = this.wind(t, c.u, c.o) * still;
      let th = 0.3 * g + (wrapped ? 0.02 * w : 0), lx = W.u, lz = W.o;
      if (back) { th = 0.11 * Math.sin(Math.PI * kh) * (kh < 0.5 ? 1 : 0.6); const l = Math.hypot(bu - c.u, bo - c.o) || 1; lx = (c.u - bu) / l; lz = (c.o - bo) / l; if (kh <= 0) { lx = 0; lz = 1; } }
      // (it is squeezed as it is tied; and after the gust has gone by it settles, once, snug)
      const sq = Math.sin(Math.PI * ramp(t, c.tie, c.tie + 0.26)) * (calm ? 0.4 : 1) + (showing ? 0.6 * Math.sin(Math.PI * ramp(t, T_G + 2.15 + 0.14 * ci, T_G + 2.5 + 0.14 * ci)) * (calm ? 0.4 : 1) : 0);
      V.c.makeTranslation(bu, 0, bo).multiply(V.a.makeRotationAxis(V.ax.set(lz, 0, -lx), th)).multiply(V.a.makeScale(1 + 0.035 * sq, 1 - 0.05 * sq, 1 + 0.035 * sq));
      lu.uSh.value[ci].set(bu, bo, ease.smooth(ramp(t, c.t0 + 0.5, c.tie)) * (1 - ease.smooth(ramp(kh, 0.75, 1))));
      lu.uRing.value[ci].z = ease.out(ramp(t, c.grow - 0.1, c.grow + 0.5)) * (1 - 0.999 * ease.smooth(ramp(kh, 0.35, 1)));

      // the tree: it comes up, opens, leans and shivers in the cold breath, and draws its branches in as it is wrapped
      const T = s.tree, treeOn = t > c.grow && t < c.tie + 0.25 && R < 0.5;
      rig.show(T.trunk, treeOn); for (const b of T.twigs) rig.show(b.id, treeOn);
      if (treeOn) {
        const gk = ramp(t, c.grow, c.grow + 0.7), gs = (calm ? ease.out(gk) : ease.outBack(gk)) * (1 - ease.smooth(ramp(R, 0.1, 0.5))), open = ease.out(ramp(t, c.grow + 0.2, c.grow + 0.9)), fold = ease.smooth(ramp(t, c.t0 + 0.3, c.t0 + 0.95));
        const cold = trap(t, T_COLD, T_COLD + 0.25, c.t0 + 0.45, c.t0 + 0.9) * still, shiver = calm ? 0 : 0.035 * cold * Math.sin(t * 33 + ci * 2);
        V.a.makeRotationAxis(V.ax.set(W.o, 0, -W.u), 0.55 * w * (1 - fold) + shiver).scale(V.s.setScalar(c.sap * Math.max(0.001, gs)));
        V.a.premultiply(V.b.makeTranslation(bu, 0, bo));                                                    // (the tree does not lean with the cone: V.a is its own)
        this.put(T.trunk, V.a);
        for (let j = 0; j < T.twigs.length; j++) {
          const b = T.twigs[j], lf = T.leaves[j], side = Math.cos(b.yaw - Math.atan2(W.o, W.u));
          V.e.set(0, -b.yaw, Math.min(1.32, 1.28 * (1 - open) + 1.2 * fold + (0.7 * w * side + shiver * 3 * (j % 2 ? 1 : -1)) * (1 - fold)), 'YXZ');
          V.m.compose(V.p.set(0.01, b.h, 0), V.q.setFromEuler(V.e), V.s.setScalar(b.s)).premultiply(V.a);
          this.put(b.id, V.m);
          // its leaf hangs from the tip, swinging, until the wind takes it or the straw covers it
          const on = (!lf.torn || t < lf.torn) && open > 0.4 && t < c.tie - 0.1; rig.show(lf.id, on);
          if (on) { V.p.copy(this.tip).applyMatrix4(V.m); const sw = 0.25 * Math.sin(t * 2.3 + lf.ph) + 1.6 * w; this.frame(V.m, V.p.x, V.p.y, V.p.z, V.x.set(Math.sin(lf.ph), 0, Math.cos(lf.ph)), V.y.set(W.u * sw, -1, W.o * sw).normalize(), 0.036 * gs, 0.075 * gs * ease.out(ramp(open, 0.4, 1))); this.put(lf.id, V.m); }
        }
      } else for (const lf of T.leaves) rig.show(lf.id, false);

      // the cord: it slides up from the foot, drawing the straw in to the neck
      const rp = ramp(t, c.tie - 0.36, c.tie), lam = 1 - ease.smooth(rp), hr = Hn * lerp(0.14, 1, ease.inOut(rp)), bandOn = t > c.tie - 0.36;
      rig.show(s.band, bandOn);
      if (bandOn) { const rr = lerp(c.R, lerp(RN, RL, lam), hr / Hn) + 0.005; this.put(s.band, V.m.makeTranslation(0, hr, 0).scale(V.s.set(rr, 0.016, rr)).premultiply(V.c)); }

      // its contour comes with the tie
      rig.show(s.hull, t > c.tie - 0.02);
      if (t > c.tie - 0.02) { const hk = ease.out(ramp(t, c.tie - 0.02, c.tie + 0.16)); this.put(s.hull, V.m.makeScale(0.9 + 0.1 * hk, 1, 0.9 + 0.1 * hk).premultiply(V.c)); }

      // the straws: each slides out over the lawn, its foot leading, and stands up against the tree
      for (let i = 0; i < s.list.length; i++) {
        const q = s.list[i], on = t > q.tl; rig.show(q.id, on); if (!on) continue;
        const ca = Math.cos(q.a), sa = Math.sin(q.a), tu = q.tl + 0.64, e = ease.out(ramp(t, q.tl, q.tl + 0.4)), k = ease.inOut(ramp(t, q.tl + 0.34, tu));
        // loose until the cord passes: its top stands off the neck, and it rattles a moment as it lands
        const l = lam + (calm || t < tu ? 0 : 0.5 * lam * Math.exp(-(t - tu) * 7) * Math.cos((t - tu) * 17 + q.ph));
        // in the gust the skirt lifts on the lee side: the foot swings out and up, the top stays in the tie
        const lift = wrapped ? Math.max(0, g) * q.lee * (q.inn ? 0.4 : 1) * (calm ? 0.025 : 0.04 + 0.022 * Math.sin(t * 15 + q.ph)) : 0;
        const fx = (q.rho + lift) * ca, fz = (q.rho + lift) * sa, fy = lift * 0.6, rt = lerp(RN * (q.inn ? 0.5 : 1), RL * (q.inn ? 0.6 : 1) + q.jr, l), at = q.a + q.ja * l;
        V.y.set(rt * Math.cos(at) - fx, Hn - fy, rt * Math.sin(at) - fz).normalize(); V.x.set(-sa, 0, ca);
        let px = fx, py = fy, pz = fz;
        if (k < 1) {
          // still on its way, or tipping up: from lying on the lawn with its tail towards the wall
          const sx = q.su - c.u, sz = -0.07 - c.o, dl = Math.hypot(fx - sx, fz - sz) || 1, dx = (fx - sx) / dl, dz = (fz - sz) / dl;
          px = lerp(sx, fx, e); pz = lerp(sz, fz, e); py = 0.012 + (calm ? 0 : 0.012 * Math.abs(Math.sin(e * 9 + q.ph)) * (1 - e));
          const om = Math.acos(Math.max(-1, Math.min(1, -(V.y.x * dx + V.y.z * dz)))), so = Math.sin(om);
          if (so > 1e-3) { const a0 = Math.sin((1 - k) * om) / so, a1 = Math.sin(k * om) / so; V.y.set(-dx * a0 + V.y.x * a1, V.y.y * a1, -dz * a0 + V.y.z * a1).normalize(); }
          const sgn = -dz * -sa + dx * ca < 0 ? -1 : 1; V.x.set(lerp(-dz * sgn, -sa, k), 0, lerp(dx * sgn, ca, k)).normalize();
        }
        this.frame(V.m, px, py, pz, V.x, V.y, q.w, q.len); V.m.premultiply(V.c); this.put(q.id, V.m);
      }

      // the tuft: the tops spring out above the tie, and the wind lays them over
      const pop = ramp(t, c.tie - 0.03, c.tie + 0.2), ps = calm ? ease.out(pop) : ease.outBack(pop);
      for (let i = 0; i < s.plumes.length; i++) {
        const p = s.plumes[i], on = pop > 0; rig.show(p.id, on); if (!on) continue;
        let b = showing ? Math.min(1.1, 0.5 * w + 0.95 * Math.max(0, g) + (calm ? 0.04 * Math.sin(t * 1.3 + p.ph) : (0.05 + 0.22 * Math.max(0, g)) * Math.sin(t * (7 + 14 * Math.max(0, g)) + p.ph))) : 0.5 * Math.sin(Math.PI * kh);
        const bx = showing ? W.u : -lx, bz = showing ? W.o : -lz;
        V.y.set(Math.cos(p.a) * p.sp + bx * b * 1.4, 1 - 0.5 * Math.max(0, b), Math.sin(p.a) * p.sp + bz * b * 1.4).normalize(); V.x.set(-Math.sin(p.a), 0, Math.cos(p.a));
        this.frame(V.m, RN * 0.5 * Math.cos(p.a), Hn - 0.012, RN * 0.5 * Math.sin(p.a), V.x, V.y, 0.026, p.len * Math.max(0.001, ps)); V.m.premultiply(V.c); this.put(p.id, V.m);
      }
    }

    // ---- the leaves on the wind
    for (let i = 0; i < this.LF.length; i++) {
      const f = this.LF[i];
      let tl = f.tl, n = 0;
      if (f.kind === 'pass') { const x = t - T_G; if (x < f.tl) { rig.show(f.id, false); continue; } n = Math.floor((x - f.tl) / GP); tl = T_G + n * GP + f.tl; if (n > 0 && i % 2) { rig.show(f.id, false); continue; } }
      const tau = t - tl, on = tau > 0 && (f.kind !== 'pass' || tau < f.D); rig.show(f.id, on); if (!on) continue;
      const D = f.D * (calm ? 1.6 : 1), e = clamp01(tau / D), ee = 1 - (1 - e) * (1 - e), land = ease.smooth(ramp(e, 0.78, 1));
      let u = lerp(f.u0, f.u1, ee) + 0.05 * Math.sin(e * 7 + f.ph) * (1 - e), o = lerp(f.o0, f.o1, ee) + 0.05 * Math.cos(e * 6 + f.ph) * (1 - e);
      let y = lerp(f.y0, f.y1, ee) + f.hop * Math.abs(Math.sin(Math.PI * f.hops * ee)) * (1 - ee) + (f.kind === 'torn' ? 0.08 * Math.sin(Math.PI * e) : 0);
      // at rest it lifts and trembles when the wind goes over, and a gust hops it on the spot
      const w = e >= 1 ? this.wind(t, f.u1, f.o1) * still : 0, g = e >= 1 ? Math.max(0, this.gust(t, f.u1, f.o1, false)) * still : 0;
      let pitch = lerp(tau * f.sp * (calm ? 0.5 : 1), f.pitch, land) + (calm ? 0.25 * w : w * (0.5 + 0.4 * Math.sin(t * 13 + f.ph))), roll = lerp(tau * f.sr * (calm ? 0.5 : 1), 0, land), size = f.size * ease.out(ramp(tau, 0, 0.12));
      y += 0.03 * g * Math.abs(Math.sin(t * 5 + f.ph));
      if (f.kind === 'pass') size *= 1 - ease.smooth(ramp(e, 0.72, 1));
      if (back) {
        // blown home: back under the picture, low, and gone
        const kb = ease.inOut(ramp(R, 0.03 + 0.3 * f.home, 0.55 + 0.4 * f.home));
        u = lerp(u, u * 0.6 - 0.05, kb); o = lerp(o, -0.1, kb); y += 0.07 * Math.sin(Math.PI * kb); pitch += kb * 5; size *= 1 - ease.smooth(ramp(kb, 0.8, 1));
      }
      V.e.set(pitch, f.yaw + roll * 0.3, roll, 'YXZ');
      this.put(f.id, V.m.compose(V.p.set(u, y + 0.004, o), V.q.setFromEuler(V.e), V.s.set(size * f.wid, size * f.wid, size)).multiply(V.a.makeRotationX(Math.PI / 2).multiply(V.b.makeTranslation(0, -0.5, 0))));
    }

    // ---- the wind's own sound, by how hard it blows over the middle of the lawn
    const cam = L.k.G.camera.position, near = L.quiet ? 0 : Math.max(0, 1 - Math.hypot(cam.x - L.cx, cam.z - L.cz) / 11), wc = showing ? this.wind(t, 0, 0.7) : 0.25 * Math.sin(Math.PI * R);
    this.windLo.set(near * (calm ? 0.6 : 1) * (0.002 + 0.034 * wc * wc), calm ? 0.5 : 0.14); this.windHi.set(near * (calm ? 0.5 : 1) * (0.001 + 0.012 * wc), calm ? 0.5 : 0.14);
    L.voice().place(L.cx + L.nx, L.cz + L.nz);
    if (back && R >= 1) this.hideAll();
  },
});
