// Francesco Guardi, The Garden of Palazzo Contarini dal Zaffo (late 1770s), Gallery 217. The word: parterre.
//
// One of four views he painted for John Strange, the British resident in Venice, and an odd one out for a painter of
// canals: a private garden, seen from an upper window. The museum's words for it: "the palace's formal garden, a
// luxury in Venice's crowded urban environment", "elegant couples stroll through the garden's geometric parterres",
// and "a shadow cast by an unseen building in the foreground divides the composition". That is the picture: a
// pattern laid on the ground (par terre), drawn with a line and a compass, every bed answered by its twin across the
// walk; little trees in red pots standing where the pattern says; people going through it two by two; and the
// afternoon cutting across all of it on a slant.
//
// Look at it and his ground runs out over the floor from the foot of the wall, in his thin sandy paint, and the
// garden wall stands up along the back of it with the little pedimented casino in the middle, its door dark; beyond
// the wall, paler, what he has beyond it: the long houses with their rows of windows, the old brick house with its
// washing out, the palace's own back, trees, two masts and a pennant. The beds are brushed in from their middles
// outwards, the far pair and then the near pair, each the mirror of the one across the walk: a round island and four
// beds scooped to go round it, and strips of low green down both sides of the walk. His light is on it from the
// start, as he divided it: the far end in the sun, and the shadow of the houses we are standing in lying across the
// near beds, with one wedge of sun left running down the walk.
//
// Then the potted trees are set out. A minuet starts, and they come out of the casino door two by two, as his
// couples go: each pot walking itself the way a heavy pot is walked, rocked from edge to edge, one tilt to a plucked
// quaver, its head of leaves swinging after it, the left file the mirror of the right. Down the walk, the first pair
// going furthest; each pair turns off where the plan says, one to the left and one to the right, and they come to
// their places one couple to a quaver, from the door towards us: either side of the door, the far islands, the
// crossing, the near islands. Each sets itself down with a wobble and turns to face its partner across the walk; the
// one that stops in the houses' shadow goes dark as it crosses the edge of it, and the others throw their own
// shadows, pot, stem and head, to the right as his do. There is a beat of nothing; and on the bar where the tune
// sighs, all eight bow to their partners, pot and all, and come up again on its accent with their leaves shaking.
// That is the main moment. After it, while you keep looking, the strips along the walk come into flower two by two, a
// pair to each staccato note, from the casino towards you; the trees bow again at the cadence, and the tune goes
// round once more, softer, with the pots rocking in time. When you stop, they turn and hurry home in file, in at
// the door, and the flowers, the beds, the wall and the ground go back after them.
//
// The tune is the first eight bars of the minuet of Boccherini's String Quintet in E, Op. 11 No. 5 (G 275; written
// 1771, published 1775): Italian, and in print when this was painted. The melody is the first violin's, note for
// note, with its grace notes and its trill; under it the viola's and the cello's pizzicato, a bass note and the
// chord, a quaver each, which is what the pots walk to. It is played quietly and straight, at a walking pace. (Next
// door Goya's ram has Petzold's minuet on a pipe and Piazzetta's duck a Vivaldi pastoral: this is a third tune.)
//
// Where it stands: a stunt ramp lies 1.56 m out from this wall, right across it, and Piazzetta's pool comes to
// within about 0.4 m of the middle of this picture on the right. So the garden keeps within 1.1 m of the wall and
// 0.78 m either side, nothing stays out after the look, and on the way home the near parts go first. The picture is
// small and hangs high, so the look camera stands back and high, as he stood at his window, with the whole picture
// in view over the garden, and looks down past the near edge of the ramp, which stays below the view. Nothing is
// taller than the masts (0.62 m, flat against the wall), under a picture whose foot is at 1.38 m: from the checks'
// nine cameras the guard has nothing to cut. Three draw calls: the ground (one flat mesh; the plan, the brushing-in,
// his light and every cast shadow are worked out in its shader), the wall, the casino and what is beyond (flat
// painted faces, drawn with a wandering line over thin washes, as he draws buildings), and one rig (pots, trees,
// strips, flowers: smooth forms under a shell of his small soft touches, lit in the shader from where his sun is, and
// darkened where they stand in his shadow). Nothing is solid.
//
// Ours, not his: the casino is drawn about twice its size against the wall, so that a tree can come out of its
// door; his plan is tidied (four compartments, where he has more, and looser); what is beyond the wall is drawn
// square on and brought together; and his potted trees are thinner than these, which are clipped round so that
// their bow can be seen from across the room.
//
// With "Reduce motion and flashing" on: the pots rock half as often and half as far and set down without a wobble,
// nothing shakes or springs, the flowers come out slowly, and they go home without rocking.
//
// What it does not do: none of his strollers comes out, nor the small white dog beside them (a white dog already
// swims next door), because the garden is what he was asked to paint and its people are six flicks of paint out for
// a walk; so the trees keep their company for them, and the niches of the wall are left empty of their statues.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, shape, canvasTexture } from '../paintlife.js';
import { strokes } from './brush.js';
import { score, Bones, hump, turnTo, noise } from './stagecraft.js';
import { hz } from './tunes.js';

const TAU = Math.PI * 2;
// ---- the plan (metres: u along the wall from the middle of the picture, o out from it)
const WALK = 0.075;                              // the two files go down the walk this far either side of its middle
const IU = 0.43, IO = [0.36, 0.84], MID = 0.6;   // the islands: |u|, and o of the far and the near pair; the cross walk between them
const HX = 0.23, HY = 0.18;                      // half a compartment, along and out
const DOOR = [0.31, 0.135];                      // where the last couple stands, either side of the casino door
const TONE = 0.6;                                // (the game's tone curve lifts flat colour: this brings his colours back to what is written here)
const BACK_O = 0.018, WING_O = 0.04, FRONT_O = 0.105;      // what is beyond the wall, the garden wall, and the casino's front, out from the room's wall
const PAV = 0.225, EAVE = 0.37;                  // the casino: half its width, and its eaves
const GROUND = 0.016;                            // the ground lies this far above the boards
// ---- the minuet
const BPM = 106, BEAT = 60 / BPM, Q8 = BEAT / 2;
const T_M1 = 1.55;                               // the first downbeat (the upbeat is a beat before it)
const tq = q => T_M1 + q * Q8;                   // when quaver q falls (0: the first downbeat; 6 to a bar)
const V = 0.3;                                   // a pot's pace (m/s)
// The four couples, as the right-hand file goes (the left is its mirror): the quaver each arrives on, and its way.
// They leave in this order, half a second apart, and each turns off before it reaches the turning of the one ahead;
// so they come to rest one couple to a quaver, from the door towards us.
const COUPLES = [
  { q: 16, way: [[WALK, -0.22], [WALK, 0.25], [WALK, IO[1] - 0.12], [0.11, IO[1] - 0.03], [0.22, IO[1]], [IU, IO[1]]] },      // the near islands
  { q: 15, way: [[WALK, -0.22], [WALK, 0.2], [WALK, MID - 0.12], [0.11, MID - 0.03], [0.22, MID], [IU, MID]] },              // the crossing
  { q: 14, way: [[WALK, -0.22], [WALK, 0.1], [WALK, IO[0] - 0.12], [0.11, IO[0] - 0.03], [0.22, IO[0]], [IU, IO[0]]] },      // the far islands
  { q: 13, way: [[WALK, -0.22], [WALK, 0.07], [0.13, 0.15], [0.22, DOOR[1] + 0.005], DOOR] },                                // either side of the door
];
const BOWS = [[18, 2], [42, 1.5], [66, 2], [90, 1.5]];      // the honours: the quaver each begins on, and how many beats it is held
const T_KEEP = [tq(48), tq(96)];                 // the second time round: the pots rock in time
// The strips along the walk come into flower a pair to a note: the quavers of the staccato bars (and their upbeats).
const BLOOM_Q = [22, 23.5, 24, 25, 26, 27, 28, 29.5, 30, 31, 32, 33];
const HEDGES = [[0.245, 0], [0.475, 1], [0.725, 0], [0.955, 1]];      // the strips each side: where along the walk, which of the two shapes
// Luigi Boccherini, String Quintet in E, Op. 11 No. 5 (G 275; 1771, published 1775), III, Minuetto, bars 1 to 8.
// The first violin: [note, beats, how it is played: s staccato, a accented, t trilled], bar by bar from the upbeat.
const MEL = [
  ['A5', 0.25], ['G#5', 0.25], ['A5', 0.25], ['B5', 0.25],
  ['A5', 0.5, 's'], ['A4', 1, 'a'], ['C#5', 1], ['E5', 0.5],
  ['E5', 0.5], ['D5', 0.5], ['D5', 1], ['D5', 0.25], ['C#5', 0.25], ['D5', 0.25], ['E5', 0.25],
  ['D5', 0.5, 's'], ['E4', 1, 'a'], ['B4', 1], ['D5', 0.5],
  ['D5', 0.5], ['C#5', 0.5], ['C#5', 1], ['A5', 0.75, 'a'], ['F#5', 0.25],
  ['E5', 0.5], ['D#5', 0.5, 's'], ['D#5', 0.5, 's'], ['D#5', 0.5, 's'], ['A5', 0.75, 'a'], ['F#5', 0.25],
  ['E5', 0.5], ['D#5', 0.5, 's'], ['D#5', 0.5, 's'], ['D#5', 0.5, 's'], ['A5', 0.75, 'a'], ['F#5', 0.25],
  ['G#5', 0.5], ['E5', 0.5], ['C#5', 0.5], ['A5', 0.5], ['F#5', 1, 't'],
  ['E5', 1], ['E4', 0.5], [null, 0.5],
];
const GRACE = [[0, ['A5', 'B5']], [6, ['D5', 'E5']], [20, ['G#5']]];      // his grace notes: the beat (from the upbeat) each leads to
// The viola and the cello, pizzicato: a quaver each, six to a bar (the last bar has four).
const PIZZ = [
  ['A2', 'E3 E4', 'A3 C#4', 'E3 E4', 'A3 C#4', 'E3 E4'], ['E2', 'E3 E4', 'G#3 B3', 'E3 E4', 'G#3 B3', 'E3 E4'],
  ['E2', 'E3', 'G#3 B3', 'E3 E4', 'G#3 B3', 'E3 E4'], ['A2', 'E3 E4', 'A3 C#4', 'E3 E4', 'A3', 'C#4 A4'],
  ['B2 B3', 'B3 A4', 'F#4', 'B3 A4', 'D#4', 'B3 A4'], ['B2', 'B3 A4', 'F#4', 'B3 A4', 'D#4', 'B3 A4'],
  ['E3', 'B3 E4 G#4', 'A2', 'C#4 E4 A4', 'B2', 'A3 B3 D#4'], ['E3', 'G#3 B3 E4', 'E2 E3', ''],
];

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const f = x => x.toFixed(3);                     // (a number, written into a shader)
// a journey: gets going, goes steadily, comes to rest (0..1 over 0..1)
const trip = (x, a = 0.06) => { x = clamp01(x); return x < a ? (x * x) / (2 * a) / (1 - a) : x > 1 - a ? 1 - ((1 - x) * (1 - x)) / (2 * a) / (1 - a) : (x - a / 2) / (1 - a); };
// One bow at x seconds after it begins, held `hold` seconds: down, held, up (0..1).
const bowAt = (x, hold) => ease.inOut(ramp(x, 0, 0.45)) * (1 - ease.inOut(ramp(x, hold - 0.36, hold)));

// His light, for the ground and for what stands on it: 1 in the shadow of the houses we are in, 0 in the sun (st:
// metres along the wall and out from it). The right-hand house's shadow lies square across the near right beds and
// slants away over the walk; the left-hand one's cuts the near left beds on the slant; a wedge of sun is left
// between them down the walk, closing at the near edge.
const SHADE = /* glsl */`
uniform vec3 uO; uniform vec4 uAx;
float gShade(vec2 st) {
  float sR = st.y - (0.705 + 3.0 * max(0.0, 0.10 - st.x));
  float sL = st.y - (1.02 + 0.6 * (st.x + 0.20));
  return smoothstep(-0.007, 0.007, max(sR, sL));
}`;

// Triangles gathered into one geometry (position, normal, colour).
class Acc {
  constructor() { this.pos = []; this.nor = []; this.col = []; this.e1 = V3(); this.e2 = V3(); }
  // (wound to agree with the normal it is given: the paint is two-sided)
  tri(a, b, c, n, ca, cb, cc) {
    if (this.e1.subVectors(b, a).cross(this.e2.subVectors(c, a)).dot(n) < 0) { let x = b; b = c; c = x; x = cb; cb = cc; cc = x; }
    for (const [p, k] of [[a, ca], [b, cb], [c, cc]]) { this.pos.push(p.x, p.y, p.z); this.nor.push(n.x, n.y, n.z); this.col.push(k.r, k.g, k.b); }
  }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3)); return g; }
}

lifeFor(111610, {
  title: /^The Garden of Palazzo Contarini/,
  word: 'parterre',
  // (the look camera stands back and high, and looks down past the near edge of the stunt ramp, which stays below the view)
  stage: { out: 0.8, half: 0.85, cam: { dist: 2.9, height: 2.0, side: -0.06, fov: 53, lookU: 0, lookOut: 0.5, lookH: 1.045, whole: false } },
  wake: 2, ret: 2.8,

  build(L) {
    const P = L.pal, col = (h, a = 0.2) => P.near(h, a);
    this.v = V3(); this.w = V3(); this.p = V3(); this.tg = V3(); this.sc = V3(1, 1, 1);
    this.B = new Bones();
    this.Mp = new THREE.Matrix4(); this.Mc = new THREE.Matrix4();
    this.buildGround(L, col);
    this.buildCasino(L, col);
    this.buildRig(L, col);
    // ---- the couples: each pot's way, when it leaves and when it is home
    this.pots = [];
    COUPLES.forEach((c, ci) => {
      const curve = new THREE.CatmullRomCurve3(c.way.map(([u, o]) => V3(u, 0, o)), false, 'centripetal'); curve.arcLengthDivisions = 300; curve.updateArcLengths();
      const len = curve.getLength(), arr = tq(c.q), dep = arr - len / V;
      for (const side of [1, -1]) {
        const i = this.pots.length, end = c.way[c.way.length - 1];
        this.pots.push({ i, ci, side, curve, len, arr, dep, end, s: 0, s0: 0, delay: 0, yaw: 0, yaw0: 0, sc: 0.96 + 0.08 * L.rand(), spin: new THREE.Matrix4().makeRotationY(L.rand() * TAU), ph: L.rand() * TAU, pot: this.iPot[i], crown: this.iCrown[i] });
      }
    });
    // ---- the minuet, twice (the second time softer), and what the pots add to it
    const s = this.score = score(L), soft = L.calm ? 0.75 : 1, T0 = T_M1 - BEAT;
    for (let r = 0; r < 2; r++) {
      const t0 = T0 + r * 24 * BEAT, k = (r ? 0.6 : 1) * soft;
      let b = 0;
      for (const [n, d, art] of MEL) {
        if (n) {
          const t = t0 + b * BEAT, f = hz(n), o = { type: 'triangle', vol: 0.017 * k * (art === 'a' ? 1.3 : 1), over: 2, overVol: 0.2, attack: art === 's' ? 0.008 : 0.02 };
          if (art === 't') {                     // the trill: the note and the one above it, then the note
            const up = f * Math.pow(2, 2 / 12), n32 = BEAT / 8;
            for (let j = 0; j < 5; j++) s.note(t + j * n32, j % 2 ? f : up, n32 * 0.95, { ...o, vol: o.vol * 0.85, attack: 0.006 });
            s.note(t + 5 * n32, f, 3 * n32 * 0.9, o);
          } else s.note(t, f, Math.max(0.07, d * BEAT * (art === 's' ? 0.5 : 0.9)), o);
        }
        b += d;
      }
      for (const [at, notes] of GRACE) notes.forEach((n, j) => s.note(t0 + at * BEAT - (notes.length - j) * 0.05, hz(n), 0.05, { type: 'triangle', vol: 0.011 * k, attack: 0.005 }));
      PIZZ.forEach((bar, bi) => bar.forEach((ch, qi) => { if (ch) ch.split(' ').forEach((n, j) => s.note(t0 + BEAT + (bi * 6 + qi) * Q8, hz(n), 0.2, { type: 'sine', vol: (j ? 0.0055 : 0.009) * k, over: 2, overVol: 0.25, attack: 0.004 })); }));
    }
    // (a pot set down on its other edge, on every quaver while any is walking; and each couple's arrival)
    for (let q = -3; q <= 16; q++) {
      if (L.calm && q % 2) continue;
      const t = tq(q), n = this.pots.filter(p => t > p.dep + 0.85 && t < p.arr - 0.05).length; if (!n) continue;
      s.hit(t, { d: 0.04, vol: 0.0034 * Math.sqrt(n) * soft, bp: 980, q: 3 }); s.note(t, 185, 0.045, { type: 'sine', vol: 0.0036 * Math.sqrt(n) * soft, to: 120, attack: 0.003 });
    }
    for (const c of COUPLES) { const t = tq(c.q); s.hit(t, { d: 0.06, vol: 0.009 * soft, bp: 640, q: 2 }); s.note(t, 150, 0.09, { type: 'sine', vol: 0.009 * soft, to: 96, attack: 0.003 }); if (!L.calm) s.hit(t + 0.16, { d: 0.04, vol: 0.004, bp: 760, q: 2.5 }); }
    for (const [q, hold] of BOWS) { s.hit(tq(q) + 0.05, { d: 0.5, vol: 0.0035 * soft, hp: 2800, lp: 7000, attack: 0.2 }); if (!L.calm) s.hit(tq(q) + hold * BEAT, { d: 0.3, vol: 0.004, hp: 3400, attack: 0.03 }); }
    for (const q of BLOOM_Q) s.note(tq(q), 2093, 0.05, { type: 'sine', vol: 0.003 * soft, attack: 0.004 });
    s.done();
    this.hideAll();
  },

  // ---------------------------------------------------------------- his ground: the plan, the brushing-in, the light
  buildGround(L, col) {
    // his thin sandy paint, dragged level; and the green of the beds, in shorter touches
    const sand = strokes({
      size: 512, seed: 111610, n: 3000, len: [14, 36], width: [5, 11], bend: 0.18, lift: 0.14, base: col('#8f7e55', 0.15).getStyle(),
      colors: [['#98875c', 3], ['#87764f', 3], ['#907d53', 2.5], ['#a39268', 1.2], ['#7e6e4a', 1.4], ['#96825a', 1.2], ['#8b7d5d', 0.8]].map(([c, w]) => [col(c, 0.15).getStyle(), w]),
      angle: (x, y, r) => (r() - 0.5) * 0.3,
    });
    const green = strokes({
      size: 256, seed: 1778, n: 1500, len: [9, 22], width: [5, 10], bend: 0.25, lift: 0.14, base: col('#5f5e36', 0.2).getStyle(),
      colors: [['#68673b', 3], ['#565732', 3], ['#737042', 1.5], ['#4d502e', 2], ['#5e6137', 2], ['#7d7847', 0.5]].map(([c, w]) => [col(c, 0.2).getStyle(), w]),
      angle: (x, y, r) => (r() - 0.5) * 0.5,
    });
    const F = (u, o) => L.floor(u, o, V3()).toArray(), pos = [];
    const a = F(-0.95, -L.wall), b = F(0.95, -L.wall), c = F(0.95, 1.2), d = F(-0.95, 1.2);
    pos.push(...a, ...b, ...c, ...a, ...c, ...d);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const u = this.u = {
      uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) },
      uSpread: { value: 0 }, uBedA: { value: 0 }, uBedB: { value: 0 }, uPav: { value: 0 },
      uPot: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, 0)) }, tSand: { value: sand }, tGreen: { value: green },
      cRimL: { value: col('#8f8950', 0.15) }, cRimD: { value: col('#2b2c18', 0.2) },
    };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
${SHADE}
uniform float uSpread, uBedA, uBedB, uPav; uniform vec4 uPot[8]; uniform sampler2D tSand, tGreen; uniform vec3 cRimL, cRimD;
vec3 fCol; float fA;
// How far outside the green (negative: inside it): in each compartment a round island, and four beds scooped to go
// round it, parted by narrow paths (the far pair with their outer corners scooped too); and the strips down the walk.
float bedDist(vec2 st) {
  float au = abs(st.x), front = step(${f(MID)}, st.y);
  vec2 p = vec2(au - ${f(IU)}, st.y - mix(${f(IO[0])}, ${f(IO[1])}, front)), a = abs(p);
  float r = length(p);
  float d = max(max(a.x - ${f(HX)}, a.y - ${f(HY)}), max(0.026 - min(a.x, a.y), mix(0.098, 0.11, front) - r));
  d = mix(max(d, 0.06 - length(a - vec2(${f(HX)}, ${f(HY)}))), d, front);
  d = min(d, r - mix(0.06, 0.07, front));
  // (a small round of turf under each pot that stands on the sand: at the crossing, and by the door)
  d = min(d, min(length(vec2(au - ${f(IU)}, st.y - ${f(MID)})) - 0.056, length(vec2(au - ${f(DOOR[0])}, st.y - ${f(DOOR[1])})) - 0.052));
  return min(d, max(abs(au - 0.170) - 0.024, max(a.y - ${f(HY)}, 0.05 - a.y)));
}`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz; vec2 st = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw));
  vec4 s1 = texture2D(tSand, st / 0.85), s2 = texture2D(tSand, st / 1.9 + 0.37), g1 = texture2D(tGreen, st / 0.5 + 0.13);
  // its outline: a rounded oblong that wanders, and breaks up stroke by stroke
  vec2 pc = vec2(st.x / 0.78, (st.y - 0.49) / 0.6); float ang = atan(pc.y, pc.x);
  float e = pow(pow(abs(pc.x), 3.4) + pow(abs(pc.y), 3.4), 1.0 / 3.4) * (1.0 + 0.05 * sin(3.0 * ang + 1.3) + 0.04 * sin(5.0 * ang + 0.4) + 0.025 * sin(11.0 * ang + 2.1));
  float core = 1.0 - smoothstep(0.86, 0.95, e + (s1.a - 0.55) * 0.12), rim = 1.0 - smoothstep(0.93, 1.06, e + (s2.a - 0.55) * 0.3);
  if (rim < 0.004 || uSpread < 0.001) discard;
  // it comes from the casino door, and goes back there
  float grow = smoothstep(0.0, 0.06, uSpread * 1.45 - (length(vec2(st.x / 0.78, (st.y + 0.04) / 1.17)) * 0.95 + s1.a * 0.22));
  // the beds, brushed in from each island outwards, a touch at a time
  float bd = bedDist(st), front = step(${f(MID)}, st.y);
  float rr = length(vec2(abs(st.x) - ${f(IU)}, st.y - mix(${f(IO[0])}, ${f(IO[1])}, front)));
  float on = smoothstep(0.0, 0.1, mix(uBedA, uBedB, front) * 1.5 - (rr / 0.36 + g1.a * 0.35));
  float bm = (1.0 - smoothstep(-0.003, 0.003, bd + (g1.a - 0.55) * 0.01)) * on;
  // (the turf stands a finger high: a lit edge towards the sun, a dark one away from it, and a thread of shade beyond)
  vec2 Ld = vec2(-0.992, -0.124);
  float dS = bedDist(st + Ld * 0.007), dF = bedDist(st - Ld * 0.009);
  vec3 c = mix(mix(s1.rgb, s2.rgb, 0.35), g1.rgb, bm);
  c = mix(c, cRimL, bm * smoothstep(-0.001, 0.004, dS) * 0.55);
  c = mix(c, cRimD, bm * smoothstep(-0.001, 0.004, dF) * 0.6);
  c *= 1.0 - 0.3 * on * (1.0 - bm) * (1.0 - smoothstep(-0.004, 0.001, dS)) * step(0.0, bd);
  // his light: the houses' shadow, its edge a little broken by the brush
  float sh = gShade(st + (s1.a - 0.55) * 0.012);
  // what the potted trees throw, in the sun: the pot, the stem and the head, laid out to the right
  float ps = 0.0; vec2 Sd = vec2(0.992, 0.124);
  for (int i = 0; i < 8; i++) {
    vec4 P = uPot[i]; if (P.w <= 0.0) continue;
    vec2 dv = st - P.xy; float al = dot(dv, Sd), ac = dot(dv, vec2(-Sd.y, Sd.x));
    float pot = smoothstep(0.25, 0.6, exp(-ac * ac / 0.0012)) * smoothstep(-0.05, -0.02, al) * (1.0 - smoothstep(0.05, 0.09, al));
    float stem = smoothstep(0.3, 0.7, exp(-ac * ac / 0.00007)) * step(0.0, al) * (1.0 - smoothstep(0.15, 0.17, al)) * 0.85;
    float hx = al - 0.2, hy = ac - P.z, hd = exp(-(hx * hx / 0.0036 + hy * hy / 0.0022));
    ps = max(ps, max(max(pot, stem), smoothstep(0.3, 0.52, hd + (g1.a - 0.55) * 0.25)) * min(1.0, P.w));
  }
  // and the wall's and the casino's, at their feet and off to the right; inside the casino it is dark
  float ws = (1.0 - smoothstep(0.05, 0.085, st.y)) * step(${PAV.toFixed(3)}, abs(st.x));
  float pv = (1.0 - smoothstep(0.11, 0.135, st.y - 0.124 * max(0.0, st.x - ${PAV.toFixed(3)}))) * smoothstep(-0.24, -0.215, st.x) * (1.0 - smoothstep(0.5, 0.62, st.x));
  float thrown = max(ps, max(ws, pv) * uPav);
  c *= mix(vec3(1.0), mix(vec3(0.6, 0.55, 0.47), vec3(0.42, 0.45, 0.47), bm), max(sh, thrown * 0.9));
  c *= 1.0 - 0.72 * uPav * (1.0 - smoothstep(0.085, 0.105, st.y)) * (1.0 - smoothstep(0.2, 0.225, abs(st.x)));
  fCol = c * ${f(TONE)};
  fA = grow * rim * mix(0.45, 0.97, core);
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'guardi-parterre';
    this.ground = new THREE.Mesh(g, m); this.ground.position.y = GROUND; this.ground.renderOrder = 5; L.add(this.ground);
  },

  // ---------------------------------------------------------------- the garden wall and the casino: flat painted faces
  buildCasino(L, col) {
    const S = 711, W = 1024, H = 1024, GY = 352, BY = 1000, X = u => (u + 0.72) * S, Y = h => GY - h * S, Yb = h => BY - h * S, r = () => L.rand();
    const css = (h, a) => col(h, a).getStyle();
    const WALL = css('#93825e'), WALL_L = css('#a8966e'), WALL_D = css('#74654a'), STONE = css('#bba87e'), STONE_L = css('#d6c69c'), STONE_D = css('#94835f');
    const INK = css('#3a2c1e', 0.3), NICHE = css('#43362a', 0.3), ROOF = css('#7c5340'), ROOF_D = css('#5e3d2e');
    const tex = canvasTexture(W, H, g => {
      g.clearRect(0, 0, W, H); g.lineCap = 'round'; g.lineJoin = 'round';
      // a line drawn by hand: it wanders a little and is pressed harder here and there
      const line = (x0, y0, x1, y1, w, style, a = 1) => {
        const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 16)); g.strokeStyle = style;
        for (let i = 0; i < n; i++) { const k0 = i / n, k1 = (i + 1) / n; g.globalAlpha = a * (0.65 + 0.35 * r()); g.lineWidth = w * (0.7 + 0.6 * r()); g.beginPath(); g.moveTo(x0 + (x1 - x0) * k0 + (r() - 0.5) * 1.6, y0 + (y1 - y0) * k0 + (r() - 0.5) * 1.6); g.lineTo(x0 + (x1 - x0) * k1 + (r() - 0.5) * 1.6, y0 + (y1 - y0) * k1 + (r() - 0.5) * 1.6); g.stroke(); }
        g.globalAlpha = 1;
      };
      // thin washes laid over a patch: short level drags of lighter and darker
      const wash = (x0, y0, x1, y1, n, cols, a = 0.3) => { for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), l = 8 + r() * 26; g.globalAlpha = a * (0.4 + 0.6 * r()); g.strokeStyle = cols[Math.floor(r() * cols.length)]; g.lineWidth = 2 + r() * 5; g.beginPath(); g.moveTo(x, y); g.lineTo(Math.min(x1, x + l), y + (r() - 0.5) * 3); g.stroke(); } g.globalAlpha = 1; };
      // ---- the wall, either side
      for (const sgn of [-1, 1]) {
        const x0 = X(sgn < 0 ? -0.72 : PAV - 0.01), x1 = X(sgn < 0 ? -PAV + 0.01 : 0.72);
        g.fillStyle = WALL; g.fillRect(x0, Y(0.152), x1 - x0, Y(0) - Y(0.152));
        g.save(); g.beginPath(); g.rect(x0, Y(0.152), x1 - x0, Y(0) - Y(0.152)); g.clip();
        wash(x0, Y(0.152), x1, Y(0), 260, [WALL_L, WALL_D, WALL_L, STONE_D], 0.34);
        g.fillStyle = WALL_D; g.globalAlpha = 0.5; g.fillRect(x0, Y(0.022), x1 - x0, Y(0) - Y(0.022)); g.globalAlpha = 1;
        // pilasters, and between them the niches (left empty), each under its little hood
        for (const pu of [0.262, 0.385, 0.51, 0.635, 0.705]) { const x = X(sgn * pu); g.fillStyle = WALL_L; g.globalAlpha = 0.55; g.fillRect(x - 6, Y(0.15), 12, Y(0) - Y(0.15)); g.globalAlpha = 1; line(x + 6, Y(0.148), x + 6, Y(0.004), 1.6, INK, 0.7); line(x - 6, Y(0.148), x - 6, Y(0.004), 1.1, STONE_L, 0.6); }
        for (const nu of [0.3235, 0.4475, 0.5725]) {
          const x = X(sgn * nu), hw = 15, yb = Y(0.03), ys = Y(0.086);
          g.fillStyle = NICHE; g.beginPath(); g.moveTo(x - hw, yb); g.lineTo(x - hw, ys); g.arc(x, ys, hw, Math.PI, 0); g.lineTo(x + hw, yb); g.closePath(); g.fill();
          g.fillStyle = WALL_D; g.globalAlpha = 0.5; g.beginPath(); g.moveTo(x + 2, yb); g.lineTo(x + 2, ys - 6); g.arc(x, ys, hw - 3, -0.9, 0); g.lineTo(x + hw - 2, yb); g.closePath(); g.fill(); g.globalAlpha = 1;
          line(x - hw - 3, yb + 2, x + hw + 3, yb + 2, 1.6, STONE_L, 0.8); line(x - hw - 6, Y(0.118), x, Y(0.133), 1.4, INK, 0.7); line(x, Y(0.133), x + hw + 6, Y(0.118), 1.4, INK, 0.7);
        }
        g.restore();
        // the coping
        g.fillStyle = WALL_L; g.fillRect(x0 - 2, Y(0.172), x1 - x0 + 4, Y(0.152) - Y(0.172));
        line(x0, Y(0.152), x1, Y(0.152), 1.6, INK, 0.75); line(x0, Y(0.171), x1, Y(0.171), 1.2, STONE_L, 0.8);
      }
      // ---- the casino: its front, with the door cut out of it
      const xl = X(-PAV), xr = X(PAV), ye = Y(EAVE - 0.012);
      g.fillStyle = STONE; g.fillRect(xl, ye, xr - xl, Y(0) - ye);
      g.save(); g.beginPath(); g.rect(xl, ye, xr - xl, Y(0) - ye); g.clip();
      wash(xl, ye, xr, Y(0), 240, [STONE_L, STONE_D, STONE_L, WALL_L], 0.3);
      g.fillStyle = STONE_D; g.globalAlpha = 0.28; g.fillRect(X(0.15), ye, xr - X(0.15), Y(0) - ye); g.globalAlpha = 0.45; g.fillRect(xl, Y(0.345), xr - xl, 9); g.globalAlpha = 1;      // (the pier away from the sun; the shade under the cornice)
      g.restore();
      for (const pu of [-0.218, -0.166, 0.166, 0.218]) line(X(pu), Y(0.34), X(pu), Y(0.004), 1.5, pu < 0 === (Math.abs(pu) > 0.2) ? STONE_L : INK, 0.75);
      line(xl, Y(0.03), X(-0.15), Y(0.03), 1.5, INK, 0.6); line(X(0.15), Y(0.03), xr, Y(0.03), 1.5, INK, 0.6);
      // the entablature and the pediment
      g.fillStyle = STONE_L; g.fillRect(xl - 7, Y(0.392), xr - xl + 14, Y(0.356) - Y(0.392));
      line(xl - 7, Y(0.357), xr + 7, Y(0.357), 1.8, INK, 0.8); line(xl - 7, Y(0.374), xr + 7, Y(0.374), 1.1, INK, 0.5); line(xl - 7, Y(0.391), xr + 7, Y(0.391), 1.5, INK, 0.7);
      g.fillStyle = STONE; g.beginPath(); g.moveTo(xl - 10, Y(0.392)); g.lineTo(X(0), Y(0.488)); g.lineTo(xr + 10, Y(0.392)); g.closePath(); g.fill();
      g.save(); g.clip(); wash(xl - 10, Y(0.488), xr + 10, Y(0.392), 60, [STONE_L, STONE_D], 0.3); g.restore();
      line(xl - 10, Y(0.393), X(0), Y(0.487), 2, INK, 0.8); line(X(0), Y(0.487), xr + 10, Y(0.393), 2, INK, 0.8);
      line(xl + 22, Y(0.399), X(0), Y(0.466), 1.2, INK, 0.55); line(X(0), Y(0.466), xr - 22, Y(0.399), 1.2, INK, 0.55); line(xl - 9, Y(0.396), X(-0.01), Y(0.484), 1.3, STONE_L, 0.8);
      // the door: an arch, cut through
      const ax = X(0), ay = Y(0.2), ar = 0.15 * S;
      g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.beginPath(); g.moveTo(ax - ar, Y(0) + 2); g.lineTo(ax - ar, ay); g.arc(ax, ay, ar, Math.PI, 0); g.lineTo(ax + ar, Y(0) + 2); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over';
      g.strokeStyle = INK; g.globalAlpha = 0.8; g.lineWidth = 2.2; g.beginPath(); g.moveTo(ax - ar - 2, Y(0)); g.lineTo(ax - ar - 2, ay); g.arc(ax, ay, ar + 2, Math.PI, 0); g.lineTo(ax + ar + 2, Y(0)); g.stroke();
      g.strokeStyle = STONE_L; g.globalAlpha = 0.7; g.lineWidth = 1.6; g.beginPath(); g.arc(ax, ay, ar + 9, Math.PI * 1.02, Math.PI * 1.6); g.stroke(); g.globalAlpha = 1;
      line(ax - ar - 12, ay, ax - ar - 1, ay, 2, INK, 0.7); line(ax + ar + 1, ay, ax + ar + 12, ay, 2, INK, 0.7);
      // ---- below: stone for its sides, tiles for its roof, and the dark inside
      g.fillStyle = STONE; g.fillRect(0, 362, 256, 150); wash(0, 362, 256, 512, 110, [STONE_L, STONE_D, WALL_L], 0.3);
      g.fillStyle = ROOF; g.fillRect(260, 362, 250, 150); wash(260, 362, 510, 512, 90, [ROOF_D, css('#8a5e47'), ROOF_D], 0.4);
      for (let y = 372; y < 512; y += 13) line(262, y, 508, y, 1.3, ROOF_D, 0.6);
      { const gr = g.createLinearGradient(0, 362, 0, 512); gr.addColorStop(0, css('#1b1510', 0.1)); gr.addColorStop(1, css('#352a1e', 0.1)); g.fillStyle = gr; g.fillRect(516, 362, 250, 150); }
      // ---- and what is beyond the wall, a flat of its own, paler, as far things are: the long houses with their rows
      // of windows, the old brick house with its washing out, the palace's own back at the right, trees, two masts
      const far = (h, k = 0.32) => col(h, 0.2).lerp(col('#cdc8ad', 0.1), k).getStyle();
      const PALE = far('#d3c198'), PALE_D = far('#b9a781'), TILE = far('#a36d58', 0.36), WIN = far('#6e5d4b', 0.2), BRICK = far('#a07a5e', 0.34), PINK = far('#b48a6c', 0.34), LEAFD = far('#4f5433', 0.2), LEAFL = far('#7b7c49', 0.2);
      const block = (u0, u1, h1, style) => { g.fillStyle = style; g.fillRect(X(u0), Yb(h1), X(u1) - X(u0), Yb(0) - Yb(h1)); };
      const roof = (u0, u1, h0, h1) => { g.fillStyle = TILE; g.beginPath(); g.moveTo(X(u0) - 4, Yb(h0)); g.lineTo(X(u0) + 5, Yb(h1)); g.lineTo(X(u1) - 5, Yb(h1)); g.lineTo(X(u1) + 4, Yb(h0)); g.closePath(); g.fill(); line(X(u0) - 4, Yb(h0), X(u1) + 4, Yb(h0), 1.3, WIN, 0.6); };
      const windows = (u0, u1, h, n, a = 0.7) => { g.fillStyle = WIN; for (let i = 0; i < n; i++) { g.globalAlpha = a * (0.5 + 0.5 * r()); g.fillRect(X(u0 + (u1 - u0) * (i + 0.5) / n) - 1.8 + (r() - 0.5) * 1.5, Yb(h) - 3.4 + (r() - 0.5) * 1.5, 3.6, 6.8); } g.globalAlpha = 1; };
      const shaded = (u0, u1, h1, n, cols) => { g.save(); g.beginPath(); g.rect(X(u0), Yb(h1), X(u1) - X(u0), Yb(0) - Yb(h1)); g.clip(); wash(X(u0), Yb(h1), X(u1), Yb(0.16), n, cols, 0.26); g.restore(); };
      block(-0.5, 0.2, 0.34, PALE); shaded(-0.5, 0.2, 0.34, 150, [PALE_D, far('#ded0a8'), PALE_D]); roof(-0.5, 0.2, 0.34, 0.362);
      block(0.2, 0.48, 0.385, PALE); shaded(0.2, 0.48, 0.385, 70, [PALE_D, far('#ded0a8')]); roof(0.2, 0.48, 0.385, 0.408);
      block(-0.22, -0.03, 0.372, far('#d8c8a0')); roof(-0.22, -0.03, 0.372, 0.394);
      for (const [u0, u1, top] of [[-0.5, -0.22, 0.34], [-0.22, -0.03, 0.372], [-0.03, 0.2, 0.34], [0.2, 0.48, 0.385]]) for (let h = top - 0.035, row = 0; h > 0.19 && row < 3; h -= 0.048, row++) windows(u0 + 0.008, u1 - 0.008, h, Math.round((u1 - u0) / 0.022));
      for (const [cu, rt] of [[-0.41, 0.362], [-0.3, 0.362], [-0.12, 0.394], [0.08, 0.362], [0.31, 0.408], [0.42, 0.408]]) { g.fillStyle = PALE_D; g.fillRect(X(cu) - 2.5, Yb(rt + 0.03), 5, 0.036 * S); }      // (chimneys)
      // the old brick house, taller than the rest, its roof broken by dormers, a chimney pot, washing at its windows
      block(-0.72, -0.555, 0.49, BRICK); shaded(-0.72, -0.555, 0.49, 60, [far('#8c6a54'), far('#b89074'), far('#8c6a54')]);
      g.fillStyle = TILE; g.beginPath(); g.moveTo(X(-0.72), Yb(0.49)); g.lineTo(X(-0.72), Yb(0.515)); g.lineTo(X(-0.68), Yb(0.535)); g.lineTo(X(-0.655), Yb(0.552)); g.lineTo(X(-0.63), Yb(0.53)); g.lineTo(X(-0.6), Yb(0.548)); g.lineTo(X(-0.575), Yb(0.522)); g.lineTo(X(-0.545), Yb(0.49)); g.closePath(); g.fill();
      g.fillStyle = BRICK; g.fillRect(X(-0.572), Yb(0.575), 5, 44); g.beginPath(); g.moveTo(X(-0.572) - 4, Yb(0.59)); g.lineTo(X(-0.572) + 9, Yb(0.59)); g.lineTo(X(-0.572) + 5, Yb(0.572)); g.lineTo(X(-0.572), Yb(0.572)); g.closePath(); g.fill();
      for (const h of [0.44, 0.385, 0.33, 0.275, 0.22]) windows(-0.71, -0.565, h, 5, 0.85);
      g.fillStyle = far('#efe9d6', 0.1); for (const [wu, wh] of [[-0.69, 0.425], [-0.672, 0.42], [-0.655, 0.424], [-0.622, 0.368], [-0.605, 0.364], [-0.66, 0.31], [-0.642, 0.306]]) { g.globalAlpha = 0.9; g.fillRect(X(wu), Yb(wh), 6 + 3 * r(), 9 + 4 * r()); } g.globalAlpha = 1;
      // the palace's own back
      block(0.555, 0.72, 0.5, PINK); shaded(0.555, 0.72, 0.5, 60, [far('#9f775d'), far('#c49a7e'), far('#9f775d')]); roof(0.555, 0.72, 0.5, 0.526);
      for (const h of [0.445, 0.375, 0.305, 0.235]) windows(0.565, 0.71, h, 5, 0.85);
      line(X(0.555), Yb(0.5), X(0.555), Yb(0.17), 1.4, WIN, 0.6);
      // trees: dark heads, his lighter touches on the side of the sun
      const trees = (u0, u1, h0, h1, n) => {
        const top = [];
        for (let i = 0; i < n; i++) { const k = i / (n - 1), u = u0 + (u1 - u0) * k, h = h0 + (h1 - h0) * (0.55 + 0.45 * Math.sin(Math.PI * k)) * (0.72 + 0.28 * r()), rad = 9 + 8 * r(); top.push([X(u), Yb(h) + rad, rad]); }
        g.fillStyle = LEAFD; for (const [x, y, rad] of top) { g.beginPath(); g.ellipse(x, y, rad, rad * 0.85, 0, 0, TAU); g.fill(); g.fillRect(x - rad, y, 2 * rad, Yb(0) - y); }
        for (const [x, y, rad] of top) for (let j = 0; j < 4; j++) { g.globalAlpha = 0.45 + 0.4 * r(); g.strokeStyle = LEAFL; g.lineWidth = 2 + 2 * r(); const ax = x - rad * (0.1 + 0.6 * r()), ay = y - rad * 0.5 + rad * 1.2 * r(); g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax - 4 - 3 * r(), ay - 2 - 3 * r()); g.stroke(); }
        g.globalAlpha = 1;
      };
      trees(-0.565, -0.24, 0.2, 0.33, 15); trees(-0.12, -0.02, 0.2, 0.3, 5); trees(0.46, 0.575, 0.19, 0.3, 6);
      g.fillStyle = LEAFD; g.beginPath(); g.moveTo(X(-0.2) - 7, Yb(0.3)); g.lineTo(X(-0.2), Yb(0.43)); g.lineTo(X(-0.2) + 7, Yb(0.3)); g.closePath(); g.fill();      // (a cypress)
      // the two masts, and the pennant on the taller
      const MAST = far('#5f4f3c', 0.15);
      g.fillStyle = MAST; g.fillRect(X(-0.165) - 1.5, Yb(0.615), 3, Yb(0.17) - Yb(0.615)); g.fillRect(X(-0.095) - 1.4, Yb(0.54), 2.8, Yb(0.17) - Yb(0.54));
      g.fillStyle = far('#7d95a8', 0.15); g.beginPath(); g.moveTo(X(-0.165) + 1.5, Yb(0.612)); g.lineTo(X(-0.165) + 17, Yb(0.6)); g.lineTo(X(-0.165) + 9, Yb(0.59)); g.lineTo(X(-0.165) + 15, Yb(0.576)); g.lineTo(X(-0.165) + 1.5, Yb(0.585)); g.closePath(); g.fill();
    });
    tex.anisotropy = 4;
    // the faces: [corners (u, h, o) x 4, the patch of the picture (pixels), a tint]
    const pos = [], uv = [], colr = [], v = V3();
    const face = (pts, [px0, py0, px1, py1], tint) => {
      const P = pts.map(([u, h, o]) => { L.floor(u, o, v); return [v.x, L.y + h, v.z]; }), T = [[px0, py1], [px1, py1], [px1, py0], [px0, py0]];
      for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(...P[k]); uv.push(T[k][0] / W, 1 - T[k][1] / H); colr.push(tint, tint, tint); }
    };
    const up = (u0, u1, h, o) => [[u0, 0, o], [u1, 0, o], [u1, h, o], [u0, h, o]], el = (u0, u1, h) => [X(u0), Y(h), X(u1), Y(0)];
    face(up(-0.72, -PAV + 0.012, 0.18, WING_O), el(-0.72, -PAV + 0.012, 0.18), 1);
    face(up(PAV - 0.012, 0.72, 0.18, WING_O), el(PAV - 0.012, 0.72, 0.18), 1);
    face(up(-0.25, 0.25, 0.495, FRONT_O), el(-0.25, 0.25, 0.495), 1);
    face([[-PAV, 0, BACK_O], [-PAV, 0, FRONT_O], [-PAV, EAVE, FRONT_O], [-PAV, EAVE, BACK_O]], [4, 366, 78, 508], 1.04);            // the side to the sun
    face([[PAV, 0, FRONT_O], [PAV, 0, BACK_O], [PAV, EAVE, BACK_O], [PAV, EAVE, FRONT_O]], [90, 366, 164, 508], 0.6);            // and the side away from it
    face([[-PAV - 0.012, EAVE + 0.012, FRONT_O], [0, 0.478, FRONT_O], [0, 0.478, BACK_O], [-PAV - 0.012, EAVE + 0.012, BACK_O]], [264, 366, 506, 438], 1);      // the roof
    face([[0, 0.478, FRONT_O], [PAV + 0.012, EAVE + 0.012, FRONT_O], [PAV + 0.012, EAVE + 0.012, BACK_O], [0, 0.478, BACK_O]], [264, 440, 506, 508], 0.68);
    face(up(-0.215, 0.215, 0.365, BACK_O + 0.008), [524, 370, 760, 506], 1);                                           // the dark within
    face(up(-0.72, 0.72, 0.64, BACK_O), [X(-0.72), Yb(0.64), X(0.72), Yb(0)], 1.06);                                   // what is beyond the wall
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
    const cu = this.cu = { uFloorY: { value: L.y + 0.004 } };
    const m = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(TONE, TONE, TONE).multiplyScalar(0.92), vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, fog: false });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, cu);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uFloorY;')
        .replace('#include <map_fragment>', '#include <map_fragment>\n  if (lifeP.y < uFloorY) discard;');      // (it rises out of the floor, and goes down into it)
    };
    m.customProgramCacheKey = () => 'guardi-casino';
    this.casino = new THREE.Mesh(g, m); L.add(this.casino);
  },

  // ---------------------------------------------------------------- the rig: pots, trees, hedges, flowers
  buildRig(L, col) {
    // Vertex colours are the local colour only; his light is laid on in the shader (from the left and a little behind
    // the garden, as the shadows in the picture lie), so a pot may turn and still be lit from his side, and whatever
    // stands in the houses' shadow is in it.
    const key = V3(L.tx * -0.74 + L.nx * -0.2, 0.64, L.tz * -0.74 + L.nz * -0.2).normalize();
    const ru = { uO: this.u.uO, uAx: this.u.uAx, uKey: { value: key } };
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.6 * TONE, side: THREE.DoubleSide });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, ru);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\n${SHADE}\nuniform vec3 uKey;`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  vec2 lq = lifeP.xz - uO.xz; float sh = gShade(vec2(dot(lq, uAx.xy), dot(lq, uAx.zw)));
  float sun = (1.0 - sh) * smoothstep(0.3, 0.85, dot(normalize(inverseTransformDirection(normal, viewMatrix)), uKey) * 0.5 + 0.5);
  totalEmissiveRadiance *= vColor.rgb * mix(vec3(0.54, 0.55, 0.6), vec3(1.22, 1.15, 0.98), sun) * mix(vec3(1.0), vec3(0.74, 0.76, 0.82), sh);
  diffuseColor.rgb *= mix(0.85, 1.0, sun) * mix(1.0, 0.6, sh) * 0.7;
}`);
    };
    mat.customProgramCacheKey = () => 'guardi-rig';
    const rig = this.rig = L.rig(52, 32000, mat);
    const R = () => L.rand(), rr = (a, b) => a + (b - a) * L.rand();
    const pick = list => { let t = 0; for (const c of list) t += c[1]; let x = L.rand() * t; for (const c of list) if ((x -= c[1]) <= 0) return c[0]; return list[0][0]; };
    const vpaint = (g, fn) => { const p = g.attributes.position, c = g.attributes.color, v = V3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = fn(v, i); c.setXYZ(i, k.r, k.g, k.b); } return g; };
    const ell = (C, Rd, c, detail = 2) => shape.move(shape.ball(1, c, detail), C[0], C[1], C[2], 0, 0, 0, Rd[0], Rd[1], Rd[2]);
    // One of his touches: a soft rounded dab of paint lying on a form, its far end lifted off it, a little lighter down
    // the middle (the loaded brush). { p, n (the way its face looks), up (the way it was drawn), l, w, lift, c }
    const side = V3(), up = V3(), cen = V3(), q = V3(), rim = Array.from({ length: 8 }, () => V3()), lc = new THREE.Color(), dc = new THREE.Color();
    const dab = (A, d) => {
      side.crossVectors(d.n, d.up).normalize(); up.crossVectors(side, d.n).normalize();
      cen.copy(d.p).addScaledVector(d.n, 0.002 + d.lift * d.l * 0.12);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + 0.2, t = Math.max(0, Math.sin(a)); rim[k].copy(d.p).addScaledVector(side, Math.cos(a) * d.w / 2 * (1 - 0.35 * t)).addScaledVector(up, Math.sin(a) * d.l / 2).addScaledVector(d.n, d.lift * d.l * t * t - 0.001); }
      lc.copy(d.c).multiplyScalar(1.07); dc.copy(d.c).multiplyScalar(0.9);
      for (let k = 0; k < 8; k++) { q.copy(d.n).addScaledVector(up, -0.6 * d.lift * Math.max(0, Math.sin((k + 0.5) / 8 * TAU + 0.2))).normalize(); A.tri(cen, rim[k], rim[(k + 1) % 8], q, lc, k < 4 ? d.c : dc, k < 4 ? d.c : dc); }
    };
    // (the way a dab is drawn on a form: upwards over it, a little astray)
    const upOn = (n, stray = 0.5) => { const d = V3((R() - 0.5) * stray, 1, (R() - 0.5) * stray); d.addScaledVector(n, -d.dot(n)); if (d.lengthSq() < 0.02) d.set(R() - 0.5, 0, R() - 0.5).addScaledVector(n, -d.dot(n)); return d.normalize(); };
    const onEll = (C, Rd, y, ph) => { const s = Math.sqrt(Math.max(0, 1 - y * y)), p = V3(C[0] + Rd[0] * s * Math.cos(ph), C[1] + Rd[1] * y, C[2] + Rd[2] * s * Math.sin(ph)); return { p, n: V3((p.x - C[0]) / (Rd[0] * Rd[0]), (p.y - C[1]) / (Rd[1] * Rd[1]), (p.z - C[2]) / (Rd[2] * Rd[2])).normalize() }; };
    const LEAF = [['#6b6e3f', 4], ['#575c36', 3], ['#828346', 2.4], ['#9a9753', 1.2], ['#42462a', 1.4], ['#77733f', 1.4]].map(([c, w]) => [col(c, 0.2), w]);
    const HEDGE = [['#5e6238', 3], ['#6d7040', 3], ['#4c5130', 1.4], ['#83824b', 1.6], ['#565b35', 2]].map(([c, w]) => [col(c, 0.2), w]);
    const jit = (c, a = 0.07) => c.clone().multiplyScalar(1 + (R() - 0.5) * 2 * a);

    // ---- a pot: red clay, footed, wider at the lip, with its earth and the stem of the tree standing in it
    {
      const CL = col('#a8623e', 0.2), RIM = col('#bb774b', 0.2), FOOT = col('#8b4f33', 0.2), SOIL = col('#35281a', 0.25), STEM = col('#4d3c28', 0.25);
      const pot = shape.lathe([[0.0, 0], [0.027, 0], [0.031, 0.006], [0.026, 0.013], [0.03, 0.026], [0.039, 0.048], [0.044, 0.064], [0.049, 0.068], [0.05, 0.076], [0.045, 0.078], [0.041, 0.073], [0, 0.072]], 20, CL);
      vpaint(pot, v => (Math.hypot(v.x, v.z) < 0.042 && v.y > 0.0715 && v.y < 0.0745 ? SOIL : v.y > 0.066 ? RIM : v.y < 0.014 ? FOOT : CL).clone().multiplyScalar(0.94 + 0.12 * (0.5 + 0.5 * Math.sin(Math.atan2(v.z, v.x) * 5 + v.y * 60))));
      const stem = [shape.move(shape.cyl(0.0058, 0.005, 0.06, 6, STEM), 0.002, 0.1, 0, 0, 0, 0.06), shape.move(shape.cyl(0.005, 0.0042, 0.052, 6, STEM), 0.003, 0.15, 0.001, 0.04, 0, -0.07)];
      this.gPot = rig.geo(shape.merge([pot, ...stem]));
    }
    // ---- a tree's head, about the top of its stem: a soft dark heart under a shell of his small touches of leaf,
    // and a few sprays standing clear of it
    const crown = () => {
      const A = new Acc(), C = [0, 0.058, 0], Rd = [0.044, 0.056, 0.044];
      const heart = ell([0, 0.057, 0], [0.036, 0.047, 0.036], col('#474b2b', 0.2), 2);
      const twig = shape.move(shape.cyl(0.0042, 0.003, 0.05, 5, col('#4d3c28', 0.25)), 0, 0.02, 0);
      for (let i = 0; i < 124; i++) {
        const s = onEll(C, Rd, rr(-0.82, 1), R() * TAU);
        dab(A, { p: s.p, n: s.n, up: upOn(s.n, 1.2), l: rr(0.017, 0.029), w: rr(0.012, 0.019), lift: rr(0.12, 0.5), c: jit(pick(LEAF)) });
      }
      for (let i = 0; i < 8; i++) {
        const s = onEll(C, Rd, rr(0.0, 0.95), R() * TAU), dir = V3(s.n.x * 0.55, 1, s.n.z * 0.55).normalize(), n = V3(s.n.x, 0.15, s.n.z).normalize(); n.addScaledVector(dir, -n.dot(dir)).normalize();
        dab(A, { p: s.p.clone().addScaledVector(dir, 0.012), n, up: dir, l: rr(0.03, 0.044), w: rr(0.008, 0.012), lift: rr(0.0, 0.2), c: jit(pick(LEAF.slice(0, 4))) });
      }
      return rig.geo(shape.merge([heart, twig, A.geo()]));
    };
    this.gCrown = [crown(), crown(), crown()];
    // ---- a strip of low green along the walk (lying along z): a soft mound under his touches, with loose shrubs
    // coming up out of it here and there
    const hedge = () => {
      const A = new Acc(), C = [0, 0.006, 0], Rd = [0.024, 0.024, 0.064], mound = ell([0, 0.005, 0], [0.021, 0.02, 0.06], col('#4b502e', 0.2), 2);
      for (let i = 0; i < 64; i++) {
        const s = onEll(C, Rd, rr(0.0, 1), R() * TAU);
        dab(A, { p: s.p, n: s.n, up: upOn(s.n, 1.4), l: rr(0.016, 0.026), w: rr(0.013, 0.019), lift: rr(0.08, 0.32), c: jit(pick(HEDGE)) });
      }
      for (let i = 0; i < 4; i++) {
        const z = rr(-0.045, 0.045), x = rr(-0.01, 0.01), dir = V3(rr(-0.3, 0.3), 1, rr(-0.3, 0.3)).normalize(), ph = R() * TAU, n = V3(Math.cos(ph), 0.2, Math.sin(ph)).normalize(); n.addScaledVector(dir, -n.dot(dir)).normalize();
        dab(A, { p: V3(x, 0.03, z), n, up: dir, l: rr(0.022, 0.032), w: rr(0.011, 0.015), lift: rr(0.0, 0.15), c: jit(pick(HEDGE.slice(0, 4))) });
      }
      return rig.geo(shape.merge([mound, A.geo()]));
    };
    this.gHedge = [hedge(), hedge()];
    // ---- a flower on the strip: a few small touches of white and pink, opening upwards
    {
      const A = new Acc(), W = col('#efe5cf', 0.12), PK = col('#e3b3a6', 0.15);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + 0.3, out = V3(Math.cos(a), 0.35, Math.sin(a)).normalize(), n = V3(-Math.cos(a) * 0.45, 0.9, -Math.sin(a) * 0.45).normalize(); dab(A, { p: V3(Math.cos(a) * 0.006, 0.002, Math.sin(a) * 0.006), n, up: out.addScaledVector(n, -out.dot(n)).normalize(), l: rr(0.012, 0.016), w: rr(0.01, 0.013), lift: 0.3, c: i % 3 === 1 ? PK : W }); }
      this.gBloom = rig.geo(A.geo());
    }
    // ---- the instances
    this.iPot = []; this.iCrown = []; this.hedges = []; this.blooms = [];
    for (let i = 0; i < 8; i++) { this.iPot.push(rig.add(this.gPot)); this.iCrown.push(rig.add(this.gCrown[i % 3])); }
    for (const side of [1, -1]) HEDGES.forEach(([o, k], j) => this.hedges.push({ i: rig.add(this.gHedge[(k + (side > 0 ? 0 : 1)) % 2]), u: side * 0.17, o, at: 1.1 + 0.16 * j + (side > 0 ? 0 : 0.03) }));
    // (three flowers to a strip, a pair to a note, from the casino towards us: the left strip's are the right's mirror)
    BLOOM_Q.forEach((qq, k) => {
      const [o] = HEDGES[Math.floor(k / 3)], dz = [-0.042, 0.002, 0.044][k % 3] + rr(-0.007, 0.007), du = rr(-0.009, 0.009), y = rr(0.03, 0.044), sc = rr(0.9, 1.25), turn = R() * TAU;
      for (const side of [1, -1]) this.blooms.push({ i: rig.add(this.gBloom), u: side * (0.17 + du), o: o + dz, y, sc, turn: side * turn, at: tq(qq) });
    });
    this.all = [...this.iPot, ...this.iCrown, ...this.hedges.map(h => h.i), ...this.blooms.map(b => b.i)];
  },

  hideAll() { for (const i of this.all) this.rig.show(i, false); },

  // ---------------------------------------------------------------- what is laid out at show-time t (each 0..1)
  laid(L, t, o = {}) {
    const calm = L.calm;
    o.spread = Math.pow(ramp(t, 0, 1.2), 0.8);
    o.pav = calm ? ease.smooth(ramp(t, 0.25, 1.3)) : ease.outBack(ramp(t, 0.3, 1.15));
    o.bedA = ramp(t, 0.7, 1.5); o.bedB = ramp(t, 1.15, 2.0);
    o.hedge = o.hedge || []; o.bloom = o.bloom || [];
    this.hedges.forEach((h, j) => { o.hedge[j] = calm ? ease.smooth(ramp(t, h.at, h.at + 0.7)) : ease.outBack(ramp(t, h.at, h.at + 0.5)); });
    this.blooms.forEach((b, j) => { o.bloom[j] = calm ? ease.smooth(ramp(t, b.at - 0.1, b.at + 0.6)) : ease.outBack(ramp(t, b.at - 0.03, b.at + 0.22)); });
    return o;
  },

  start(L) {
    this.hideAll(); this.lastShow = 0; this.score.from(0); this.from = null;
    if (!L.quiet) noise(L.voice(), 0.1, { d: 1.0, vol: L.calm ? 0.0025 : 0.004, hp: 2200, lp: 6000, attack: 0.3 });      // (the sand running out)
  },
  back(L) {
    // Note where everything is. The pots go home the way they came, in file: nearest the door first, each a little
    // behind the one before, so the two that stand a step apart do not walk through each other.
    const t = this.lastShow || 0;
    this.from = this.laid(L, t, { t });
    const out = this.pots.filter(p => p.side > 0 && p.s > 0.24).sort((a, b) => a.s - b.s);
    let eff = 0; const lag = new Map();
    for (const p of out) { eff = Math.max(p.s, eff + 0.17); lag.set(p.ci, eff - p.s); }
    this.vr = Math.max(0.42, eff / (0.72 * L.retDur));
    for (const p of this.pots) { p.s0 = p.s; p.yaw0 = p.yaw; p.delay = (lag.get(p.ci) || 0) / this.vr + 0.06; }
    if (!L.quiet && !L.calm && eff > 0) { const v = L.voice(), n = Math.min(18, Math.floor(eff / this.vr / 0.12)); for (let i = 1; i < n; i++) noise(v, 0.08 + i * 0.12, { d: 0.035, vol: 0.0045 * (1 - i / n * 0.5), bp: 1000 + 60 * (i % 2), q: 3 }); }
  },
  end(L) { this.hideAll(); this.u.uSpread.value = 0; this.ground.material.visible = false; this.casino.visible = false; },
  reset(L) { this.end(L); },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', ret = ph === 'return', calm = L.calm;
    const t = showing ? L.t : this.lastShow || 0;
    if (showing) this.lastShow = L.t;
    const rk = ret ? L.ret : 0, rt = ret ? L.r : 0, clock = t + rt;
    const rig = this.rig, B = this.B, u = this.u, v = this.v;

    // ---- the ground, the wall and the casino, the beds
    const G = ret && this.from ? this.from : this.laid(L, showing ? t : -1, this.now || (this.now = {}));
    const live = showing || ret;
    const spread = !live ? 0 : G.spread * (1 - ease.inOut(ramp(rk, 0.66, 1)));
    const pav = !live ? 0 : G.pav * (1 - ease.inOut(ramp(rk, 0.78, 1)));
    u.uSpread.value = spread; u.uPav.value = clamp01(pav);
    u.uBedA.value = G.bedA * (1 - ease.inOut(ramp(rk, 0.48, 0.78))); u.uBedB.value = G.bedB * (1 - ease.inOut(ramp(rk, 0.3, 0.62)));
    this.ground.material.visible = spread > 0.002;
    this.casino.visible = pav > 0.004; this.casino.position.y = -(1 - pav) * 0.5;

    // ---- the strips and their flowers
    this.hedges.forEach((h, j) => {
      const g = !live ? 0 : G.hedge[j] * (1 - ease.inOut(ramp(rk, 0.42 - 0.08 * (j % 4), 0.66 - 0.09 * (j % 4))));
      rig.show(h.i, g > 0.01); if (g <= 0.01) return;
      L.floor(h.u, h.o, v); this.sc.set(0.6 + 0.4 * Math.min(1, g), g, 1);
      rig.put(h.i, v.x, L.y + GROUND, v.z, L.yawOut, 0, 0, this.sc);
    });
    this.blooms.forEach((b, j) => {
      const g = !live ? 0 : G.bloom[j] * (1 - ease.in(ramp(rk, 0.02, 0.3)));
      rig.show(b.i, g > 0.01); if (g <= 0.01) return;
      L.floor(b.u, b.o, v);
      rig.put(b.i, v.x, L.y + GROUND + b.y * Math.min(1, g), v.z, b.turn, 0, 0, b.sc * g);
    });

    // ---- the honours, and keeping time the second time round
    let bow = 0, sprung = 0;
    if (showing) for (const [q, hold] of BOWS) { const x = t - tq(q), h = hold * BEAT; bow = Math.max(bow, bowAt(x, h)); if (!calm) sprung += hump(x, h - 0.05, h + 0.6) * Math.sin((x - h) * 26) * Math.exp(-(x - h) * 4); }
    const keepT = showing ? ease.smooth(ramp(t, T_KEEP[0], T_KEEP[0] + 1.5)) * (1 - ease.smooth(ramp(t, T_KEEP[1] - 1.2, T_KEEP[1]))) * (1 - bow) : 0;
    const beatPh = (t - T_M1) / BEAT, stepPh = (t - T_M1) / (calm ? BEAT : Q8);

    // ---- the pots
    const U = u.uPot.value;
    for (const p of this.pots) {
      let s, moving, tau, home = false;
      if (ret) { const d = Math.max(0, rt - p.delay) * this.vr; s = Math.max(0, p.s0 - d); moving = p.s0 > 0 && d > 0 && s > 0 ? Math.min(1, d / 0.05, s / 0.05) : 0; tau = -1; home = d > 0; }
      else { const x = (t - p.dep) / (p.arr - p.dep); s = p.len * trip(x); moving = x > 0 && x < 1 ? Math.min(1, (t - p.dep) / 0.25, (p.arr - t) / 0.18) : 0; tau = t - p.arr; }
      p.s = s;
      const k = Math.min(0.9995, s / p.len); p.curve.getPointAt(k, this.p); p.curve.getTangentAt(k, this.tg);
      const pu = p.side * this.p.x, po = this.p.z, du = p.side * this.tg.x, dout = this.tg.z;
      const on = live && po > -0.03;
      rig.show(p.pot, on); rig.show(p.crown, on);
      if (!on) { U[p.i].set(0, 0, 0, 0); continue; }
      // which way it faces: the way it goes; once home, round to its partner across the walk; going back, the way home
      const partner = L.yawOf(-p.side, 0);
      let yaw;
      if (ret) yaw = home ? turnTo(p.yaw0, L.yawOf(-du, -dout), ease.smooth(ramp(rt - p.delay, 0, 0.3))) : p.yaw0;
      else yaw = tau > 0 ? turnTo(L.yawOf(du, dout), partner, ease.inOut(ramp(tau, 0.08, 0.5))) : L.yawOf(du, dout);
      p.yaw = yaw;
      // walked on its edge: tilted one way and the other, a tilt to a step, turning a little on the edge it stands on
      const sp = ret ? (calm ? 0 : rt / 0.12) : stepPh, amp = ret ? 0.1 : calm ? 0.085 : 0.17;
      let roll = p.side * amp * Math.sin(Math.PI * sp) * moving, wig = p.side * 0.16 * Math.cos(Math.PI * sp) * moving * (calm ? 0.5 : 1);
      if (!ret && tau > 0 && !calm) roll += p.side * 0.15 * Math.exp(-6.5 * tau) * Math.sin(TAU * 3.3 * tau + 0.6);            // set down: it wobbles to rest
      if (!ret && tau > 0.6) roll += p.side * (calm ? 0.03 : 0.06) * keepT * Math.sin(Math.PI * beatPh);
      const pitch = (!ret && tau > 0 ? 0.3 * bow : 0);
      const lift = 0.03 * (Math.abs(Math.sin(roll)) + Math.abs(Math.sin(pitch))) * p.sc;
      L.floor(pu, po, v);
      B.set(this.Mp, v.x, L.y + GROUND + 0.001 + lift, v.z, yaw + wig, pitch, roll, p.sc);
      rig.mat(p.pot, this.Mp);
      // its head of leaves swings after it, bends lower than the pot in the bow, and shakes as it comes up
      const lag = -0.6 * p.side * amp * Math.sin(Math.PI * (sp - 0.32)) * moving, air = 0.028 * Math.sin(clock * 1.1 + p.ph) + 0.016 * Math.sin(clock * 2.3 + p.ph * 2);
      const cr = lag - 0.5 * (roll - p.side * amp * Math.sin(Math.PI * sp) * moving) + air, cp = (tau > 0 && !ret ? 0.6 * bow + 0.14 * sprung : 0) + 0.02 * Math.sin(clock * 0.9 + p.ph);
      B.child(this.Mc, this.Mp, 0.003, 0.172, 0.001, 0, cp, cr); this.Mc.multiply(p.spin);      // (bent in the pot's own frame, then turned to its own best side)
      rig.mat(p.crown, this.Mc);
      // (its shadow on the ground: none inside the casino)
      U[p.i].set(pu, po, 0, p.sc * ease.smooth(ramp(po, 0.1, 0.2)) * (ret ? 1 - ease.smooth(ramp(rk, 0.6, 0.8)) : 1));
    }

    // ---- words and sounds
    if (showing && !this.told && !L.quiet && t > this.pots[0].dep + 0.7) { this.told = true; L.k.say('The potted trees come out to take their places in the garden, two by two.', 4); }
    if (showing) this.score.play(t);
    L.voice().place();
  },
});
