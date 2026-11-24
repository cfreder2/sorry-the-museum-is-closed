// Joshua Johnson, Elizabeth Grant Bankson Beatty (Mrs. James Beatty) and Her Daughter Susan (c. 1805), Gallery 161.
// The word: strawberry.
//
// A mother and her small daughter, painted in Baltimore, sit very still on a green sofa and look at us. Everything in
// the picture is held: the pose, the curtain and its white tassel, the row of brass tacks. One thing in it is
// happening, and it is the one bright colour he used: the mother has a sprig of strawberries in her hand, crisp dark
// leaves and four or five warm red berries, and the child has one of them in hers. The museum's note calls the
// strawberry "a delicacy often featured in the artist's portraits": it is as much his mark as the tacks are. The two
// sitters stay in their picture. What comes out is the strawberry.
//
// Look at it and one berry slips out from under the frame, below the place where the sprig is painted, hangs a
// moment at the lip, tips, and drops: a long fall for a small thing, a bounce, a smaller one, and it lies on its side
// on the floor. Where it lies it takes root. A crown of his leaves comes up through it and opens, each leaf three
// leaflets, shut like a hand and then spread, with the pale veins and the saw edge he drew on every one. A strawberry
// spreads by runners, and this one does: four of them go out over the floor, two towards you and two along the wall,
// each roots where it stops and puts up a crown of its own, and there is a strawberry bed under the picture, about
// twice the size of life, so that the toy looks up at the leaves. Then the fruit: stalks arch out from under the
// leaves of each crown and a berry swells on the end of each, pale green, and its weight bows the stalk down. Then
// they ripen, crown by crown, through cream to his clear warm red, each berry settling lower as it colours: the
// bright thing among the dark leaves that it is in the picture. No two are quite alike (some long, some
// heart-shaped, some lopsided); each has its pale seeds, a paler shoulder under its green cap, a deeper red at the
// tip and one soft light on the upper left, where his light is. The last and largest hangs in the middle at the
// front, nearest you; it is the reddest, and its stalk bows furthest as it settles. Everything is painted plainly,
// as he painted: matt, evenly lit, clean at the edge. While you keep looking the bed stands ripe and the leaves stir a
// little. When you stop, the stalks draw in, the leaves fold, the runners draw home, and one berry is left on the
// floor; it goes back up the way it came and in under the frame.
//
// Music, quietly: the first four bars of Mozart's Sonata in C, K. 545 (1788), which he entered in his own list as
// "for beginners" and which was first printed in 1805, about when this was painted: the piece a child at a parlour
// pianoforte was given. It is as written, the tune over its broken-chord bass (checked against the Mutopia Project's
// engraving of the first movement), once, on a plain soft voice, and stands for nothing but a parlour of that year.
// The berry's last bounce is its downbeat; a crown opens on each note of the first two bars, and the bed ripens to
// the third and fourth, the last berry on the last note.
//
// Nothing here is ever in front of a picture: the berry falls down the bare wall below the frame, and the bed stands
// under half a metre, a long way below every frame on this wall (from the checks' nine cameras the guard has nothing
// to cut). Nothing is solid and nothing stays out after the look. The bed keeps within 1.2 m of the middle of its
// own picture. The Herring Net's sea (src/life/25865-herring-net.js, the next picture to the right, 2 m along) can
// reach under this picture's right-hand side, but neither show stays out after its look; going home, this bed's
// right-hand crowns fold first, and it has no water, no fog and no light of its own. The Inness (pines up the wall)
// and the Cotopaxi (falls, a lake, smoke) are 4 and 6 m further along. What matters (the berry's fall, the first
// crown, the last berry) is within 0.4 m of the picture's middle, which a phone held upright shows whole.
// Two draw calls: one rig (leaflets, leaf stalks, fruit stalks, berries and their caps, runners) and the soft
// shadows under the crowns and the berries.
// With "Reduce motion and flashing": the leaves open without springing, the berries settle without the bounce and
// the swing, the leaves stir half as far; nothing flashes at any setting.
//
// What it leaves out: Mrs. Beatty and Susan do not come out, in any form, and nothing here stands for either of them
// (the crowns are plants, alike in size, and the hands that hold the sprig and the berry stay in the picture), because
// a mother and a small child sitting for their portrait are not ours to move; the tassel is left hanging where he
// hung it; there is no blossom, which he did not paint; the berries are not picked, pushed or eaten; and nothing in
// the show is made of the painter's own life, which the museum tells and which is not a device.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { score, Bones } from './stagecraft.js';
import { hz } from './tunes.js';

const TAU = Math.PI * 2, RAD = Math.PI / 180, G = 9.8;
const RET = 2.2;
// Mozart, Sonata in C, K. 545, first movement, bars 1 to 4. B: a crotchet (Allegro, about 143 to the minute); T0:
// the first downbeat, which is the berry's last bounce. [beat, note, length in beats]
const B = 0.42, T0 = 1.5, beat = b => T0 + b * B;
const TUNE = [[0, 'C5', 2], [2, 'E5', 1], [3, 'G5', 1],
  [4, 'B4', 1.5], [5.5, 'C5', 0.25], [5.75, 'D5', 0.25], [6, 'C5', 1],
  [8, 'A5', 2], [10, 'G5', 1], [11, 'C6', 1],
  [12, 'G5', 1], [13, 'F5', 0.5], [13.5, 'E5', 0.25], [13.75, 'F5', 0.25], [14, 'E5', 1.7]];
// its bass, four quavers to the half bar: C, C; G7 over D, C; F over C, C; G7 over B, C
const BASS = [['C4', 'G4', 'E4', 'G4'], ['C4', 'G4', 'E4', 'G4'], ['D4', 'G4', 'F4', 'G4'], ['C4', 'G4', 'E4', 'G4'],
  ['C4', 'A4', 'F4', 'A4'], ['C4', 'G4', 'E4', 'G4'], ['B3', 'G4', 'D4', 'G4'], ['C4', 'G4', 'E4', 'G4']];

const DROP_U = 0.065;                          // under the sprig, as it lies in the picture (a little right of the middle)
const BERRY0 = 0.118;                          // the first berry's length (m)
const K = 1.45;                                // the bed's scale: a strawberry plant about twice the size of life, so the toy looks up at its leaves
// The crowns: where each stands (u along the wall from the middle of the picture, out from it), its size, and the beat
// it opens on. The first is where the berry comes to rest; the others are where its runners root.
const CROWNS = [
  { u: 0.04, o: 0.58, s: 1.0, beat: 0, turn: 0.4 },
  { u: -0.45, o: 1.02, s: 0.86, beat: 2, turn: 4.1 },      // in front, left and right, with a gap between them
  { u: 0.49, o: 1.08, s: 0.88, beat: 3, turn: 5.2 },
  { u: -0.8, o: 0.38, s: 0.93, beat: 4, turn: 1.7 },       // and by the wall, further out to either side
  { u: 0.78, o: 0.42, s: 0.94, beat: 5.5, turn: 2.9 },
];
// The fruit: [crown, which way its stalk arches (degrees: 0 out into the room, 90 to the viewer's right), the stalk's
// length and the berry's (both before the bed's scale), the beat it ripens on]. The last is the largest, in the middle
// at the front; the one before it colours across the two quick notes.
const FRUIT = [
  [1, -72, 0.35, 0.064, 8], [1, -20, 0.37, 0.07, 8.67], [1, 30, 0.35, 0.062, 9.33],
  [2, -34, 0.35, 0.064, 10], [2, 16, 0.37, 0.07, 10.33], [2, 70, 0.35, 0.062, 10.67],
  [3, -104, 0.36, 0.068, 11], [3, -64, 0.38, 0.074, 11.33], [3, -26, 0.35, 0.066, 11.67],
  [4, 26, 0.36, 0.07, 12], [4, 66, 0.38, 0.072, 12.33], [4, 106, 0.36, 0.066, 12.67],
  [0, -36, 0.37, 0.066, 13], [0, 34, 0.37, 0.068, 13.5],
  [0, -1, 0.47, 0.098, 14],
];
const NSEG = 12;                               // a runner's pieces
let TOLD = false;                              // its one line has been said tonight (kept here: the kit lets a far-off show go and builds it again)
const TIP = 0.26, LYING = Math.PI * 1.5, SIDE = -1.15;      // the first berry's turn: tipping at the lip; lying on its side; and how far round it comes to lie (so it is seen side on)

// ---------------------------------------------------------------- geometry (unit sizes; +z is the way a thing points)
function build(pos, nor, col) {
  // every face turned the way its normals say, so both sides of a leaf are lit as they should be
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  const swap = (arr, i, j) => { for (let k = 0; k < 3; k++) { const t = arr[i * 3 + k]; arr[i * 3 + k] = arr[j * 3 + k]; arr[j * 3 + k] = t; } };
  for (let f = 0; f < pos.length / 9; f++) {
    const i = f * 3;
    a.fromArray(pos, i * 3); b.fromArray(pos, i * 3 + 3); c.fromArray(pos, i * 3 + 6);
    n.crossVectors(b.sub(a), c.sub(a));
    const d = n.x * (nor[i * 3] + nor[i * 3 + 3] + nor[i * 3 + 6]) + n.y * (nor[i * 3 + 1] + nor[i * 3 + 4] + nor[i * 3 + 7]) + n.z * (nor[i * 3 + 2] + nor[i * 3 + 5] + nor[i * 3 + 8]);
    if (d < 0) { swap(pos, i + 1, i + 2); swap(nor, i + 1, i + 2); swap(col, i + 1, i + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
// One leaflet as he drew it: a broad oval with a saw edge, dark, paler at the teeth, a pale midrib and a pale vein to
// every tooth; creased a little along the midrib and curling down to its tip. Flat, as his are.
function leafletGeo(cBody, cDark, cEdge, cVein) {
  const N = 9, FOLD = 0.26, DROOP = 0.17, pos = [], nor = [], col = [];
  const cBody2 = cBody.clone().multiplyScalar(0.8), cDark2 = cDark.clone().multiplyScalar(0.8);      // (one half of every leaflet a little darker, as he lit them)
  // (half its width along it: a wedge at the stalk, widest past the middle, and a blunt round end)
  const W = s => (s < 0.56 ? 0.5 * Math.pow(Math.sin(Math.PI / 2 * s / 0.56), 0.72) : 0.5 * Math.sqrt(Math.max(0, 1 - Math.pow((s - 0.56) / 0.455, 2))));
  const Y = (x, s) => FOLD * Math.abs(x) - DROOP * s * s;
  const push = (x, s, c, lift = 0, side = Math.sign(x) || 1) => {
    pos.push(x, Y(x, s) + lift, s);
    const nx = -side * FOLD * 0.3, ny = 1, nz = 0.6 * DROOP * s, l = Math.hypot(nx, ny, nz); nor.push(nx / l, ny / l, nz / l);      // (flatter than the leaf is: he lit them plainly)
    col.push(c.r, c.g, c.b);
  };
  for (const sd of [-1, 1]) for (let k = 0; k < N; k++) {
    const s0 = k / N, s1 = (k + 1) / N, st = Math.min(0.985, s0 + 0.66 / N), x0 = sd * W(s0) * 0.93, x1 = sd * W(s1) * 0.93, xt = sd * (W(st) * 1.03 + 0.008);
    // the blade between two veins, and its tooth
    const cB = sd > 0 ? cBody : cBody2, cD = sd > 0 ? cDark : cDark2;
    push(0, s0, cB, 0, sd); push(0, s1, cB, 0, sd); push(x1, s1, cD);
    push(0, s0, cB, 0, sd); push(x1, s1, cD); push(x0, s0, cD, 0, sd);
    push(x0, s0, cD, 0, sd); push(x1, s1, cD); push(xt, st, cEdge);
    // the vein to that tooth: a pale sliver, a hair above the blade
    if (k > 0) { const h = 0.0075 * (1 - 0.5 * s0); push(0, s0 - h, cVein, 0.011, sd); push(0, s0 + h, cVein, 0.011, sd); push(xt * 0.92, st, cVein, 0.011); }
    // the midrib
    const m0 = 0.014 * (1 - 0.75 * s0), m1 = 0.014 * (1 - 0.75 * s1);
    if (sd > 0 && s0 < 0.9) { push(-m0, s0, cVein, 0.014, 1); push(m0, s0, cVein, 0.014, 1); push(m1, s1, cVein, 0.014, 1); push(-m0, s0, cVein, 0.014, 1); push(m1, s1, cVein, 0.014, 1); push(-m1, s1, cVein, 0.014, 1); }
  }
  return build(pos, nor, col);
}
// A stem of unit length standing in the y-z plane from the origin: its steepness goes from e0 to e1 (radians above
// level) along it. Returns the geometry and where its tip is.
function stemGeo(e0, e1, pw, r0, r1, c0, c1, sides = 6, segs = 9) {
  const P = [], sub = 12; let y = 0, z = 0;
  const el = s => e0 + (e1 - e0) * Math.pow(s, pw);
  for (let i = 0; i <= segs; i++) {
    P.push({ y, z, e: el(i / segs), s: i / segs });
    for (let k = 0; k < sub && i < segs; k++) { const e = el((i + (k + 0.5) / sub) / segs), d = 1 / (segs * sub); y += Math.sin(e) * d; z += Math.cos(e) * d; }
  }
  const pos = [], nor = [], col = [], c = new THREE.Color();
  const put = (p, a) => { const r = lerp(r0, r1, p.s), ca = Math.cos(a), sa = Math.sin(a), ce = Math.cos(p.e), se = Math.sin(p.e); pos.push(r * ca, p.y + r * sa * ce, p.z - r * sa * se); nor.push(ca, sa * ce, -sa * se); c.copy(c0).lerp(c1, p.s).multiplyScalar(0.82 + 0.3 * clamp01(sa * 0.6 + 0.5)); col.push(c.r, c.g, c.b); };
  for (let i = 0; i < segs; i++) for (let j = 0; j < sides; j++) {
    const a0 = j / sides * TAU, a1 = (j + 1) / sides * TAU, A = P[i], Bp = P[i + 1];
    put(A, a0); put(Bp, a0); put(Bp, a1); put(A, a0); put(Bp, a1); put(A, a1);
  }
  const tip = P[segs];
  return { g: build(pos, nor, col), ty: tip.y, tz: tip.z };
}

// The rig's paint: the kit's own (vertex colours, which also glow a little in the dark galleries), but matt and
// evenly lit, as he painted: no gloss, little modelling. And one thing more. A berry's colour is its instance's
// (unripe, cream, ripe), and its vertices carry numbers in place of a colour: blue 2 marks its skin (red: how light the
// paint is there, green: how pale), blue 3 a seed (red: its lightness, green: straw to ochre). So the pale shoulder,
// the deeper tip and the one soft light keep their place whatever colour the berry is, and the seeds stay pale as
// it reddens.
function plainPaint(glow) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, emissive: 0xffffff, emissiveIntensity: glow, side: THREE.DoubleSide });
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <color_vertex>', `#include <color_vertex>
#if defined( USE_COLOR ) && defined( USE_BATCHING_COLOR )
  if (color.b > 1.5) {
    vec3 own = batchingColor;                                                   // the instance's colour
    float red = clamp((own.r - own.g) / max(own.r, 0.001), 0.0, 1.0);
    if (color.b > 2.5) vColor.rgb = mix(mix(vec3(0.84, 0.7, 0.38), vec3(0.56, 0.37, 0.13), color.g), own, 0.3 * (1.0 - red)) * color.r;
    else { vec3 c = own * color.r; vColor.rgb = mix(c, mix(vec3(0.95, 0.93, 0.8), vec3(0.93, 0.5, 0.38), red), color.g); }
  }
#endif`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;');
  };
  m.customProgramCacheKey = () => 'life-johnson-plain';
  return m;
}
// A berry hanging from the origin, one long: prof is its outline from the tip up ([radius, height]); wx and wz
// squeeze it (a strawberry is seldom round), bend hooks its tip to one side and cheek makes one side fuller. Its
// skin is smooth and coded as plainPaint reads it: paler at the shoulder under the cap, deeper at the tip, one soft
// light on the upper left; and the seeds are set in it, small pale flecks in rows that are not quite rows.
function berryGeo(prof, wx, wz, bend, cheek, rnd) {
  const g = shape.lathe(prof, 18, 0xffffff), p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
  const hl = new THREE.Vector3(-0.52, 0.34, 0.78).normalize(), sh = new THREE.Vector3(0.55, -0.4, -0.73).normalize(), v = new THREE.Vector3();
  const dx = (x, y) => (x > 0 ? x * (1 + cheek) : x * (1 - 0.5 * cheek)) * wx + bend * y * y;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(n, i);
    const y = p.getY(i), h = ease.smooth(ramp(v.dot(hl), 0.4, 0.98)), d = ease.smooth(ramp(v.dot(sh), -0.1, 0.9)), top = ease.smooth(ramp(y, -0.36, -0.05)), tip = ease.smooth(ramp(-y, 0.5, 1));
    c.setXYZ(i, 1.04 - 0.34 * tip - 0.14 * d + 0.04 * h, Math.max(0.02, Math.min(0.6, 0.3 * h + 0.3 * top * (1 - 0.4 * h))), 2);
    p.setXYZ(i, dx(p.getX(i), y), y, p.getZ(i) * wz);
  }
  const R = y => { for (let i = 1; i < prof.length; i++) if (y <= prof[i][1]) { const a = prof[i - 1], b = prof[i]; return lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1])); } return 0; };
  const pos = [], nor = [], col = [], y0 = prof[0][1], N = 58;
  for (let k = 0; k < N; k++) {
    const y = lerp(y0 * 0.95, -0.13, (k + 0.5) / N) + (rnd() - 0.5) * 0.03, phi = k * 2.39996 + (rnd() - 0.5) * 0.5, r = R(y), dr = (R(y + 0.012) - R(y - 0.012)) / 0.024, l = Math.hypot(1, dr);
    const cp = Math.cos(phi), sp = Math.sin(phi), Nn = [cp / l, -dr / l, sp / l], T = [dr * cp / l, 1 / l, dr * sp / l], S = [-sp, 0, cp];
    const a = 0.025 * (0.75 + 0.6 * rnd()), b = 0.015 * (0.75 + 0.5 * rnd()), P = [r * cp + Nn[0] * 0.017, y + Nn[1] * 0.017, r * sp + Nn[2] * 0.017], light = 0.82 + 0.3 * rnd(), och = 0.05 + 0.55 * rnd() * rnd();
    const at = (t, sd) => [P[0] + T[0] * t + S[0] * sd, P[1] + T[1] * t + S[1] * sd, P[2] + T[2] * t + S[2] * sd];
    for (const q of [at(a * 0.7, 0), at(0, b), at(-a * 1.3, 0), at(a * 0.7, 0), at(-a * 1.3, 0), at(0, -b)]) { pos.push(dx(q[0], q[1]), q[1], q[2] * wz); nor.push(...Nn); col.push(light, och, 3); }
  }
  return shape.merge([g, build(pos, nor, col)]);
}

lifeFor(150054, {
  title: /^Elizabeth Grant Bankson Beatty/,
  word: 'strawberry',
  stage: { out: 1.6, half: 1.35, cam: { dist: 2.7, height: 0.74, side: 0.3, fov: 58, lookU: 0, lookOut: 0.4, lookH: 0.95, floorOut: 1.6 } },
  wake: 2, ret: RET,

  build(L) {
    const P = L.pal, col = (h, a = 0.3) => P.near(h, a);
    this.v = new THREE.Vector3(); this.s3 = new THREE.Vector3(); this.C = new THREE.Color();
    this.M = new THREE.Matrix4(); this.Mb = new THREE.Matrix4(); this.Mc = new THREE.Matrix4(); this.bones = new Bones();
    this.railH = L.rail - L.y;
    const rnd = () => L.rand();
    const rig = this.rig = L.rig(360, 8000, plainPaint(0.46));

    // ---- the parts
    const gLeaf = rig.geo(leafletGeo(col('#667f45', 0.18), col('#4f6937', 0.2), col('#93aa64', 0.15), col('#7f9658', 0.15)));
    const pet = stemGeo(84 * RAD, 30 * RAD, 1.5, 0.017, 0.011, col('#7b6a48', 0.3), col('#5f7a42', 0.3));
    const gPet = rig.geo(pet.g); this.pet = pet;
    const stk = stemGeo(72 * RAD, -62 * RAD, 1.25, 0.012, 0.008, col('#66793f', 0.3), col('#8a7a4a', 0.3), 6, 12);
    const gStalk = rig.geo(stk.g); this.stk = stk; this.stkA = Math.atan2(stk.ty, stk.tz); this.stkR = Math.hypot(stk.ty, stk.tz);
    // the berries: three shapes (long and blunt-pointed, as most of his are; broad-shouldered, a heart; and lopsided,
    // one cheek fuller and the tip hooked over)
    this.gBerry = [
      berryGeo([[0.001, -1], [0.1, -0.975], [0.21, -0.9], [0.31, -0.77], [0.39, -0.6], [0.44, -0.42], [0.45, -0.27], [0.4, -0.13], [0.3, -0.045], [0.16, -0.008], [0.001, 0]], 0.94, 0.86, 0, 0, rnd),
      berryGeo([[0.001, -0.92], [0.09, -0.9], [0.22, -0.82], [0.36, -0.67], [0.47, -0.5], [0.53, -0.33], [0.53, -0.2], [0.46, -0.09], [0.33, -0.03], [0.17, -0.006], [0.001, 0]], 1, 0.8, 0, 0, rnd),
      berryGeo([[0.001, -0.97], [0.1, -0.945], [0.22, -0.87], [0.33, -0.74], [0.42, -0.57], [0.47, -0.4], [0.48, -0.26], [0.42, -0.12], [0.31, -0.04], [0.16, -0.008], [0.001, 0]], 0.96, 0.84, 0.13, 0.17, rnd),
    ].map(g => rig.geo(g));
    // its green cap: five pointed sepals, a collar whose points stand out past the shoulder (so it reads from across
    // the room), and the little stem it hangs by
    {
      const pos = [], nor = [], cl = [], c0 = col('#4f7a34', 0.15), c1 = col('#86ad52', 0.12);
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * TAU + 0.3, w = 0.62, ca = Math.cos(a), sa = Math.sin(a);
        const pt = (r, y, da) => [Math.cos(a + da) * r, y, Math.sin(a + da) * r];
        const A = pt(0.02, 0.03, 0), Bq = pt(0.3, 0.004, -w), Cq = pt(0.64, -0.11, 0), D = pt(0.3, 0.004, w);
        for (const [p, c] of [[A, c0], [Bq, c0], [Cq, c1], [A, c0], [Cq, c1], [D, c0]]) { pos.push(...p); nor.push(ca * 0.3, 0.92, sa * 0.3); cl.push(c.r, c.g, c.b); }
      }
      const cap = build(pos, nor, cl), stem = shape.move(shape.cyl(0.03, 0.022, 0.16, 6, col('#6f7c44', 0.3)), 0, 0.085, 0);
      this.gCap = rig.geo(shape.merge([cap, stem]));
    }
    // a piece of runner: a thin rod along +z, one long
    const gRun = rig.geo(shape.move(shape.cyl(0.5, 0.5, 1, 6, col('#8a6248', 0.3)), 0, 0, 0.5, Math.PI / 2, 0, 0));

    // ---- the plants
    const tint = new THREE.Color();
    this.crowns = CROWNS.map((c, ci) => {
      const base = L.floor(c.u, c.o, new THREE.Vector3()), n = ci === 0 ? 10 : 9, leaves = [], sc = c.s * K;
      const order = Array.from({ length: n }, (_, j) => j).sort(() => rnd() - 0.5);
      for (let j = 0; j < n; j++) {
        const young = j >= n - 2, a = c.turn + (young ? j * 2.6 : j / (n - 2) * TAU) + (rnd() - 0.5) * 0.45;
        const lf = {
          yaw: L.yawOf(Math.sin(a), Math.cos(a)), len: sc * (young ? 0.16 + 0.05 * rnd() : 0.25 + 0.09 * rnd()), lean: young ? -0.12 + 0.2 * rnd() : 0.1 + 0.3 * rnd(),
          droop: young ? 0.1 + 0.25 * rnd() : 0.42 + 0.4 * rnd(), roll: (rnd() - 0.5) * 0.5, size: sc * (young ? 0.085 + 0.015 * rnd() : 0.118 + 0.026 * rnd()),
          d: (young ? 0.5 : 0.055 * order[j]) + 0.05 * rnd(), w: 0.9 + 0.8 * rnd(), ph: rnd() * TAU, ip: rig.add(gPet), il: [rig.add(gLeaf), rig.add(gLeaf), rig.add(gLeaf)],
        };
        // (each leaflet its own green: no two of his are quite the same)
        // (and the young leaves in the middle lighter and yellower, as new leaves are)
        for (const i of lf.il) { const k = rnd(); rig.mesh.setColorAt(i, young ? tint.setRGB(1.22 + 0.1 * k, 1.2 + 0.1 * k, 0.86) : tint.setRGB(0.86 + 0.3 * k, 0.9 + 0.22 * k, 0.86 + 0.2 * rnd())); }
        rig.mesh.setColorAt(lf.ip, tint.setRGB(1, 1, 1));
        leaves.push(lf);
      }
      return { ...c, sc, base, leaves, t: beat(c.beat), r0: [0.85, 0.5, 0.28, 0.42, 0.2][ci] };      // (going home, the right-hand crowns fold first: the Herring Net's side)
    });
    this.fruit = FRUIT.map(([ci, deg, len, bl, bt], i) => {
      const c = this.crowns[ci], a = deg * RAD, big = i === FRUIT.length - 1;
      const f = { c, yaw: L.yawOf(Math.sin(a), Math.cos(a)), len: len * c.sc, bl: bl * 1.4, big, tR: beat(bt), dur: big ? 0.55 : 0.5,
        tS: Math.max(c.t + 0.5, beat(4.5)) + 0.07 * (i % 3) + (ci === 4 ? 0.1 : 0), ph: rnd() * TAU, spin: (rnd() - 0.5) * 0.7, is: rig.add(gStalk), ib: rig.add(this.gBerry[big ? 1 : [0, 2, 1, 0, 0, 2][i % 6]]), ic: rig.add(this.gCap) };
      rig.mesh.setColorAt(f.is, tint.setRGB(1, 1, 1)); rig.mesh.setColorAt(f.ic, tint.setRGB(1, 1, 1));
      return f;
    });
    // the runners: from the first crown to each of the others, bowed a little to one side and arching off the floor
    this.runs = this.crowns.slice(1).map((c, i) => {
      const a = this.crowns[0], du = c.u - a.u, dout = c.o - a.o, len = Math.hypot(du, dout), bow = (i % 2 ? -1 : 1) * 0.16 * len, pts = [];
      for (let k = 0; k <= NSEG; k++) {
        const s = k / NSEG, side = Math.sin(Math.PI * s) * bow, p = L.floor(a.u + du * s - dout / len * side, a.o + dout * s + du / len * side, new THREE.Vector3());
        p.y += 0.014 + 0.04 * Math.sin(Math.PI * s) * (0.6 + 0.4 * Math.sin(TAU * s)); pts.push(p);
      }
      const segs = [];
      for (let k = 0; k < NSEG; k++) { const p = pts[k], q = pts[k + 1], d = q.clone().sub(p), l = d.length(); segs.push({ p, l, yaw: Math.atan2(d.x, d.z), pitch: -Math.asin(d.y / l), i: rig.add(gRun) }); rig.mesh.setColorAt(segs[k].i, tint.setRGB(1, 1, 1)); }
      return { segs, t1: c.t, t0: Math.max(T0 + 0.28, c.t - 0.8) };
    });
    // the first berry
    this.i0 = rig.add(this.gBerry[1]); this.c0 = rig.add(this.gCap); rig.mesh.setColorAt(this.c0, tint.setRGB(1, 1, 1));
    this.unripe = col('#c9d29c', 0.15); this.cream = col('#f0d6b4', 0.15); this.ripe = col('#dc4c32', 0.06); this.ripest = col('#cf3620', 0.04);      // (his clear warm red; the last berry the reddest)
    rig.mesh.setColorAt(this.i0, this.ripe);

    // ---- the fall, worked out from the height it really falls (so the third touch is the downbeat)
    const r0 = BERRY0 * 0.46, h0 = this.railH - 0.03 - BERRY0 * 0.5 - r0, e = 0.36;      // (r0: its middle above the floor, lying)
    const tf = Math.sqrt(2 * h0 / G), v1 = G * tf * e, t2 = 2 * v1 / G, v2 = v1 * e, t3 = 2 * v2 / G;
    const rest = L.local(this.crowns[0].base.x, this.crowns[0].base.z);
    this.fall = { r0, h0, tf, v1, t2, v2, t3, tDrop: T0 - tf - t2 - t3, vOut: (rest.out - 0.05) / (tf + 0.7 * t2 + 0.5 * t3), restU: rest.u, restO: rest.out };
    this.fall.tOut = this.fall.tDrop - 0.46;

    this.shade = L.blobs(CROWNS.length + 1 + FRUIT.length, { fade: true });
    this.band = this.makeScore(L);
    this.bT = 0; this.calm = L.calm;
    this.hideAll();
  },

  makeScore(L) {
    const s = score(L), F = this.fall;
    // the berry on the floor: three soft knocks, each smaller
    [[F.tDrop + F.tf, 1], [F.tDrop + F.tf + F.t2, 0.5], [T0, 0.25]].forEach(([t, k]) => { s.note(t, 170, 0.11, { type: 'sine', vol: 0.03 * k, to: 95, attack: 0.004 }); s.hit(t, { d: 0.05, vol: 0.009 * k, lp: 1200, hp: 200 }); });
    // Mozart: the tune, and its bass under it, very soft
    for (const [b, n, d] of TUNE) s.note(beat(b), hz(n), Math.max(0.16, d * B * 0.95), { type: 'triangle', vol: 0.024, attack: 0.008, over: 2, overVol: 0.12 });
    BASS.forEach((half, i) => half.forEach((n, j) => s.note(beat(i * 2 + j * 0.5), hz(n), B * 0.55, { type: 'sine', vol: 0.0085, attack: 0.01 })));
    // a crown opening: leaves
    for (const c of CROWNS) s.hit(beat(c.beat) + 0.05, { d: 0.32, vol: 0.005, hp: 2600, lp: 7000, attack: 0.08 });
    return s.done();
  },

  hideAll() {
    const rig = this.rig; if (!rig) return;
    for (const c of this.crowns) for (const lf of c.leaves) { rig.show(lf.ip, false); for (const i of lf.il) rig.show(i, false); }
    for (const f of this.fruit) { rig.show(f.is, false); rig.show(f.ib, false); rig.show(f.ic, false); }
    for (const r of this.runs) for (const sg of r.segs) rig.show(sg.i, false);
    rig.show(this.i0, false); rig.show(this.c0, false);
    this.shade.count = 0;
  },
  start(L, resumed) { this.calm = L.calm; if (!resumed) this.hideAll(); this.band.from(L.t); },
  back(L) { this.bT = L.t; },
  end(L) { this.hideAll(); },
  reset(L) { this.hideAll(); TOLD = false; },

  // The first berry at show-time t: out from under the frame, the hang, the fall and its two bounces, into o:
  // { u, h (its middle, above the floor), out, pitch, k (size) }.
  berryAt(L, t, o) {
    const F = this.fall, tau = t - F.tDrop;
    o.k = 1; o.pitch = 0; o.u = DROP_U; o.turn = 0;
    if (tau <= 0) {
      // sliding out of the wall under the frame; then it hangs at the lip, and tips
      const q = ease.inOut(ramp(t, F.tOut, F.tOut + 0.3));
      o.out = lerp(-L.wall - 0.05, 0.05, q); o.h = F.r0 + F.h0; o.k = t < F.tOut ? 0 : lerp(0.55, 1, ease.smooth(ramp(t, F.tOut, F.tOut + 0.3)));
      o.pitch = TIP * ease.smooth(ramp(t, F.tDrop - 0.16, F.tDrop));
      return o;
    }
    // (it turns over forwards as it falls, three quarters of a turn in all, and comes to rest on its side with its
    // point towards the room)
    let h, out = 0.05, spin;
    if (tau < F.tf) { const x = tau / F.tf; h = F.r0 + F.h0 - 0.5 * G * tau * tau; out += F.vOut * tau; spin = 0.52 * x * (0.4 + 0.6 * x); }
    else if (tau < F.tf + F.t2) { const x = tau - F.tf; h = F.r0 + F.v1 * x - 0.5 * G * x * x; out += F.vOut * (F.tf + 0.7 * x); spin = 0.52 + 0.4 * x / F.t2; }
    else if (tau < F.tf + F.t2 + F.t3) { const x = tau - F.tf - F.t2; h = F.r0 + F.v2 * x - 0.5 * G * x * x; out += F.vOut * (F.tf + 0.7 * F.t2 + 0.5 * x); spin = 0.92 + 0.08 * ease.out(x / F.t3); }
    else { h = F.r0; out = F.restO; spin = 1; }
    o.h = h; o.out = out; o.pitch = lerp(TIP, LYING, spin); o.turn = SIDE * ease.smooth(spin);
    o.u = lerp(DROP_U, F.restU, clamp01(tau / (F.tf + F.t2 + F.t3)));
    return o;
  },

  update(L, dt) {
    const ph = L.phase, showing = ph !== 'return' && ph !== 'after', R = showing ? 0 : L.ret * RET, t = showing ? L.t : this.bT;
    const rig = this.rig, bn = this.bones, M = this.M, Mb = this.Mb, Mc = this.Mc, v = this.v, calm = this.calm, F = this.fall;
    const tt = t + R, stir = calm ? 0.5 : 1;                       // (the air goes on while it folds)
    if (showing) { this.band.play(t); if (!TOLD && !L.quiet && t > F.tDrop) { TOLD = true; L.k.say('A strawberry falls from under the picture and takes root.', 4); } }
    const early = !showing && this.bT < T0;                        // the look ended before the berry had landed
    let nb = 0;

    // ---- the first berry
    {
      const o = this.o || (this.o = {}); let on = true;
      if (showing || early) {
        this.berryAt(L, early ? this.bT * (1 - ease.inOut(ramp(R, 0, 1.2))) : t, o);
        if (!early) o.k *= 1 - ease.smooth(ramp(t, T0 + 0.08, T0 + 0.6));      // planted: the crown comes up through it
        if (early && R > 1.2) o.k = 0;
      } else {
        // going home: it is there again as the first crown folds, then up the way it came and in under the frame
        const tUp = 1.4, x = R - tUp;
        if (x < 0) { this.berryAt(L, T0 + 1, o); o.k = ease.outBack(ramp(R, 1.02, 1.34)); }
        else if (x < F.tf) { this.berryAt(L, F.tDrop + F.tf - x, o); o.out = lerp(F.restO, 0.05, ease.smooth(x / F.tf)); o.u = lerp(F.restU, DROP_U, x / F.tf); o.pitch = lerp(LYING, Math.PI * 2, ease.smooth(x / F.tf)); o.turn = SIDE * (1 - ease.smooth(x / F.tf)); }
        else { this.berryAt(L, F.tDrop, o); o.pitch = 0; o.turn = 0; o.out = lerp(0.05, -L.wall - 0.05, ease.inOut(ramp(x, F.tf + 0.04, F.tf + 0.28))); }
      }
      on = o.k > 0.01;
      rig.show(this.i0, on); rig.show(this.c0, on);
      if (on) {
        L.at(o.u, o.h - (L.cy - L.y), o.out, v);
        bn.set(Mc, v.x, v.y, v.z, L.yawOut + o.turn, o.pitch, 0, 1);
        bn.child(M, Mc, 0, BERRY0 * 0.5 * o.k, 0, 0, 0, 0, BERRY0 * o.k); rig.mat(this.i0, M); rig.mat(this.c0, M);
        // its shadow, gathering as it comes down
        const near = 1 - clamp01((o.h - F.r0) / 0.7);
        if (near > 0.02 && o.out > 0) this.shade.set(nb++, v.x, v.z, 0.035 + 0.05 * (1 - near), 0.75 * near * o.k);
      }
    }

    // ---- the crowns: leaf stalks and their three leaflets
    for (const c of this.crowns) {
      const kc = 1 - ease.inOut(ramp(R, c.r0, c.r0 + 0.65));
      let open = 0;
      for (const lf of c.leaves) {
        const o = early ? 0 : ease.smooth(ramp(t, c.t + lf.d, c.t + lf.d + 0.8)) * kc, on = o > 0.004;
        rig.show(lf.ip, on); for (const i of lf.il) rig.show(i, on);
        if (!on) continue;
        open += o;
        const g = ease.out(ramp(o, 0, 0.75)), q = ramp(o, 0.3, 1), spread = calm ? ease.smooth(q) : ease.outBack(q), sw = Math.sin(tt * lf.w + lf.ph) * stir;
        const pitch = lf.lean - 0.4 * (1 - ease.smooth(q)) + 0.024 * sw, len = lf.len * g;
        bn.set(M, c.base.x, c.base.y, c.base.z, lf.yaw, pitch, 0, len); rig.mat(lf.ip, M);
        // the blade at the stalk's tip: shut and upright, then level and spread
        const cp = Math.cos(pitch), sp = Math.sin(pitch), ty = (this.pet.ty * cp - this.pet.tz * sp) * len, tz = (this.pet.ty * sp + this.pet.tz * cp) * len;
        bn.set(Mb, c.base.x, c.base.y, c.base.z, lf.yaw, 0, 0, 1);
        bn.child(Mc, Mb, 0, ty, tz, 0, lerp(-1.3, lf.droop, spread) + 0.055 * sw, lf.roll * spread + 0.045 * Math.sin(tt * lf.w * 0.7 + lf.ph * 2) * stir, 1);
        const size = lf.size * lerp(0.4, 1, ease.smooth(o)), fold = lerp(0.14, 1, clamp01(spread));
        bn.child(M, Mc, 0, 0, 0.004, 0, 0, 0, this.s3.set(size * fold, size, size)); rig.mat(lf.il[0], M);
        this.s3.set(size * 0.93 * fold, size * 0.93, size * 0.93);
        bn.child(M, Mc, 0.004, 0, 0, 1.22 * spread, 0.1 * spread, -0.16 * spread, this.s3); rig.mat(lf.il[1], M);
        bn.child(M, Mc, -0.004, 0, 0, -1.22 * spread, 0.1 * spread, 0.16 * spread, this.s3); rig.mat(lf.il[2], M);
      }
      open /= c.leaves.length;
      if (open > 0.02) this.shade.set(nb++, c.base.x, c.base.z, 0.27 * c.sc * (0.4 + 0.6 * open), 0.45 * open);
    }

    // ---- the fruit: a stalk arching out from under the leaves, bowed by the berry on its end; and the ripening
    for (const f of this.fruit) {
      const kf = 1 - ease.inOut(ramp(R, 0.02 * (f.is % 5), 0.58)), ks = early ? 0 : ease.out(ramp(t, f.tS, f.tS + 0.65)) * kf, on = ks > 0.004;
      rig.show(f.is, on); rig.show(f.ib, on); rig.show(f.ic, on);
      if (!on) continue;
      const swell = ease.smooth(ramp(t, f.tS + 0.2, f.tS + 1.05)), tau = t - f.tR, r = clamp01(tau / f.dur);
      // how high its tip hangs: light and high, then heavy; and as it ripens it settles lower still, with a dip
      const hY = 0.6 * f.len * this.stkR, hH = f.bl + (f.big ? 0.09 : 0.075), settle = tau <= 0 ? 0 : calm ? ease.smooth(tau / 0.7) : 1 - Math.exp(-5.5 * tau) * Math.cos(13 * tau);
      const h = lerp(hY, hH, swell) - (f.big ? 0.066 : 0.054) * settle + 0.003 * Math.sin(tt * 1.3 + f.ph) * stir;
      const pitch = this.stkA - Math.asin(clamp01(h / (f.len * this.stkR)));
      bn.set(M, f.c.base.x, f.c.base.y + 0.01, f.c.base.z, f.yaw, pitch, 0, f.len * ks); rig.mat(f.is, M);
      v.set(0, this.stk.ty, this.stk.tz).applyMatrix4(M);
      const sz = lerp(0.2, 1, swell) * ks, sway = 0.05 * Math.sin(tt * 1.3 + f.ph) * stir, swing = tau > 0 && !calm ? 0.24 * Math.exp(-3.2 * tau) * Math.sin(11 * tau) : 0;
      // (it hangs tilted the way its stalk arches, but turned on its own stem so that its lit side is the picture's: upper left)
      bn.set(Mb, v.x, v.y, v.z, f.yaw, -0.2 + swing + sway, 0, 1);
      bn.child(M, Mb, 0, 0, 0, L.yawOut - f.yaw + f.spin, 0, 0, f.bl * sz); rig.mat(f.ib, M);
      bn.child(M, Mb, 0, 0, 0, L.yawOut - f.yaw + f.spin, 0, 0, f.bl * Math.max(sz, 0.55 * ks)); rig.mat(f.ic, M);
      this.C.copy(this.unripe).lerp(this.cream, ease.smooth(ramp(r, 0, 0.45))).lerp(f.big ? this.ripest : this.ripe, ease.smooth(ramp(r, 0.25, 1)));
      rig.mesh.setColorAt(f.ib, this.C);
      if (swell > 0.3) this.shade.set(nb++, v.x, v.z, f.bl * 0.62 * sz, 0.5 * swell * ks);      // its own small shadow, close under it
    }

    // ---- the runners
    for (const r of this.runs) {
      const head = early ? 0 : ease.inOut(ramp(t, r.t0, r.t1)) * (1 - ease.inOut(ramp(R, 0.7, 1.25)));
      r.segs.forEach((sg, k) => {
        const fr = clamp01(head * NSEG - k), on = fr > 0.01;
        rig.show(sg.i, on);
        if (on) rig.put(sg.i, sg.p.x, sg.p.y, sg.p.z, sg.yaw, sg.pitch, 0, this.s3.set(0.012, 0.012, sg.l * fr * 1.04));
      });
    }
    this.shade.count = nb;
  },
});
