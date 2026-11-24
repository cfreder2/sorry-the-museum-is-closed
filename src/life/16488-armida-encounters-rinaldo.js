// Giovanni Battista Tiepolo, Armida Encounters the Sleeping Rinaldo (c. 1742-45), Gallery 215. The word: hush.
//
// One of the canvases he painted for a mirrored room in a Venetian palace, from Tasso's poem: a cloud has come down
// at the edge of still water, and everything that rode in on it is still in the air. An orange mantle is blown out
// like a sail, a pale green veil hangs in a loop over it, a golden wheel is half sunk in the vapour; and at the
// other end of the picture a round steel shield stands on its rim under a sleeping hand, the one thing there that
// could fall and make a noise. The picture is the moment after the wind and before a sound. So the show is a wind
// that arrives, and hushes itself.
//
// Look at it and his water runs out over the floor from the foot of the wall, dark and level, with the low sandy
// bank on the right, his pale rock on it and his long drooping reeds; two small birds twitter far off (they are in
// the picture, beside the wheel). A round shield rolls out from under the frame on its rim, curves in as a coin
// does, and leans back against the rock with a small knock. Then the air stirs, the birds stop, and the cloud comes:
// out of the wall under the left of the picture and over the water to the right, creamy and rolling, dark and smoky
// behind, the golden wheel turning in its flank, the mantle and the veil streaming flat out behind it. The reeds lie
// over, the water roughens, and the gust reaches the shield: it comes off its rock and goes round on its rim the way
// a dropped coin does, lower and faster, and everybody knows the noise that is coming. The cloud pulls up short, the
// mantle swings over its head, and at the last instant a lap of vapour slides in under the shield and takes it. No
// clang. For a breath nothing moves at all: the mantle hangs filled at the top of its swing, as he painted it, the
// veil in its loop, the wheel stopped. Then, very quietly, muted strings begin, the veil settles into its long arch,
// the reeds stand up one by one, the water goes back to glass and holds the cloud and the orange upside down, and
// the shield rides the cloud's breathing with the sky in its face. The cloud has stopped under the sleeper in the
// picture; that is where the eye is sent.
//
// The music is what the opera of this same scene plays at this same moment: the prelude to Renaud's air "Plus
// j'observe ces lieux" in Lully and Quinault's Armide (Paris, 1686; Act II, scene 3), marked Lentement and to be
// played with mutes. It is the murmur of the river he lies down beside; the air's words are about the place and
// nothing else ("this river flows slowly, and leaves so charming a place with regret ... a sweet sound mingles with
// the sound of the waters; the enchanted birds fall silent to hear it ... everything here invites me to rest"), and
// the opera plays the prelude again as he falls asleep. All five string parts, bars 1 to 20, note for note from
// Nicolas Sceaux's edition of the 1686 score, at an unhurried pace, quietly; then a silence, and again if you stay.
//
// The other Rinaldo and Armida canvases of the set hang on the same wall, a hand's breadth away on either side (the
// garden on the left, the parting on the right). This show keeps to the cloud, the wind, the two cloths, the wheel
// and one falling shield, and to the floor under its own picture (the water thins out under the garden's right end;
// nothing of it is under the parting): the garden, the mirror, the sea, the boat and the road home are theirs.
//
// Nothing is ever in front of a picture. All three hang with their feet 80 cm from the floor; the cloud is half a
// metre high and stands a metre out, and the one tall thing, the mantle (its corner 90 cm up), is under the picture's
// foot from where the look stands: back, at a grown-up's eye, so that the whole picture is in view over the floor and
// its two companions either side of it. From a lower eye (the toy's) the mantle and the veil would cross the picture,
// so from there they lie down along the cloud's back instead; the kit's guard is there for every camera, and from the
// look it has nothing to cut at any moment of the show (checked every fifth of a second). Nothing is solid, and
// nothing stays out after the look. Three draw calls: the ground (one flat mesh, one shader:
// water, banks, shade), the things (one mesh, moved and painted on the processor: shield, wheel, rock, stones,
// reeds, mantle, veil) and the cloud (soft round dabs in one instanced mesh, sorted far to near). The shield and the
// wheel are painted, not lit: the shield shows a little picture of what is round it (sky, haze, the cloud, the
// orange), worked out for each point of its face from where the eye is.
// With "Reduce motion and flashing" on: the wind is half as strong and its sound lower, nothing flutters, the shield
// tips over once, slowly, without a rattle (the cloud is under it in good time), and the first notes are eased in.
//
// What it does not do: nobody comes out of the picture, in any form: not Armida, not the sleeping knight, not her
// companion, not the winged child; the mantle and the veil ride the cloud by themselves, and no sandal, hand, wing
// or shadow of a person is anywhere. No arrow, quiver, sword or helmet is built (the shield is laid by and never
// pointed at anything). Nothing is made of the poem's war or of its two faiths: no costume, emblem, scale or tune
// says "East" or "West", and the music is only a river. The sleep is not a joke: it is the reason for the hush, and
// he stays where he is, in the picture.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp } from '../paintlife.js';
import { score } from './stagecraft.js';
import { strokes } from './brush.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const sm = (x, a, b) => ease.smooth(ramp(x, a, b));
const hump = (x, a, b) => (x <= a || x >= b ? 0 : Math.sin(Math.PI * (x - a) / (b - a)));
const hash = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------------------------------------------------------- the timeline (seconds of show)
const T_ROLL = 0.25, T_LEAN = 1.4;                 // the shield rolls out; it leans on its rock
const T_AIR = 1.5;                                 // the first breath of air: the birds stop
const T_CLOUD = 1.8, T_STOP = 4.5;                 // the cloud leaves the wall; it has pulled up
const T_GUST = 3.3, FALL = 1.4, T_CATCH = T_GUST + FALL;      // the gust takes the shield; the cloud has it
const T_SWING = 4.02;                              // the mantle starts over the top (it hangs there at the catch)
const T_TUNE = 5.4;                                // the strings begin
const E8 = 0.4;                                    // a quaver of the prelude (s): "Lentement"

// ---------------------------------------------------------------- where things are (u along the wall, o out from it; metres)
const SURF = 0.015;
const WAY = [[-0.72, -0.62], [-0.98, 0.05], [-0.95, 0.66], [-0.66, 0.98], [-0.34, 1.0]];      // the cloud's way
const ROCK = { u: 0.76, o: 0.5, a: 0.23, h: 0.25, b: 0.145 };
const SH_R = 0.25;                                 // the shield's radius
const ARC = { u: 0.66, o: 0.22, r: 0.5, from: -0.3 };          // it rolls straight out, then round this centre, to lean
const REST = { u: 0.54, o: 1.06 };
const ROLLED = (ARC.o - ARC.from + ARC.r * Math.PI / 2) / SH_R;      // how far it has turned by the time it leans                  // where it goes round on its rim, and is caught
const LEAN = 74 * DEG, FLAT = 21 * DEG;            // how it stands against the rock; how low it has got when it is caught
const TURNS = 2;                                   // times round as it goes down (one, with motion reduced)
const WH_R = 0.22, WHEEL = [-0.5, 0.225, 0.29];    // the wheel: its radius, and where it rides in the cloud
const M_AT = [-0.24, 0.38, -0.03], V_AT = [-0.36, 0.42, -0.07];      // where the mantle and the veil are made fast
const M_LEN = 0.45, M_W = 0.3, V_LEN = 1.05, V_W = 0.034;
const MS = 16, MW = 15, VS = 32, VW = 3;            // the cloths' grids
const NP = 168;                                    // dabs of cloud, at most

// Jean-Baptiste Lully, Armide (1686), Act II scene 3, the prelude to "Plus j'observe ces lieux" (Lentement, "il faut
// jouer ceci avec des sourdines"), bars 1 to 20, from Nicolas Sceaux's edition of the 1686 print (the nenuvar
// project), turned into this notation by a script and its bars counted. One beat here is a quaver. The parts:
// dessus, haute-contre, taille and quinte de violon, basse. The last line is the chord the prelude comes to rest on.
const LULLY = [
  ['Bb5 A5 Bb5 A5 G5 F#5 | G5 A5 G5 F#5 G5 A5 | F#5:3 F#5 G5 A5 | D5:1.5 D5:0.5 B4:1.5 B4:0.5 C5 D5 | G4 A4 Bb4 C5 D5 Bb4 | Eb5 F5 Eb5 D5 Eb5 F5 | D5:4 D5:1.5 D5:0.5 | G5 F5 G5 F5 E5 D5 | C#5:3 C#5 D5 E5 | A4:2 F5:1.5 F5:0.5 F5 G5 | E5 F5 E5 F5 G5 A5 | F#5:1.5 A5:0.5 A5 A5 G5 F#5 | G5 D5 G5 F5 G5 D5 | Eb5 D5 Eb5 D5 C5 Bb4 | A4:2 F#4 F#4 G4 A4 | G4 D5 D5 C5 D5 A4 | Bb4 C5 D5 E5 F5 D5 | G5:2 G5 F5 Eb5:1.5 F5:0.5 | D5:2 Bb5 A5 G5 F5 | Eb5 D5 C5 Bb4 A4:1.5 G4:0.5 | G4:6', 0.016, 'triangle'],
  ['D5 C5 D5 C5 Bb4 A4 | Bb4 C5 Bb4 A4 Bb4 C5 | A4:3 A4 Bb4 F#4 | G4:4 G4 F4 | Eb4:2 F4:2 Bb4:2 | Bb4:2 A4:3 A4 | Bb4:4 F4 F4 | Bb4 A4 Bb4 A4 G4 F4 | E4:3 E4 F4 G4 | F4:2 A4 A4 D5:1.5 D5:0.5 | D5:2 C#5:3 C#5 | D5 C5 D5 C5 Bb4 A4 | Bb4:4 Bb4 Bb4 | Bb4:2 A4 Bb4 A4 G4 | F#4:2 D4 D4 E4 F#4 | G4 Bb4 A4:3 A4 | G4 A4 Bb4 C5 D5 D5 | Eb5:2 D5 D5 G4 A4 | Bb4:4 Bb4:2 | G4:2 F#4 G4 F#4:1.5 G4:0.5 | G4:6', 0.011, 'triangle'],
  ['R:6 | R:6 | D4 C4 D4 C4 Bb3 A3 | Bb3:2 D4:1.5 D4:0.5 Eb4 B3 | C4:2 D4:2 Bb3:2 | C4:2 C4:4 | Bb3:4 D4 D4 | D4:2 D4:2 E4:2 | E4:3 E4 A4 C#4 | D4:2 D4 C4 D4 D4 | A4:2 A4:3 A4 | A4:1.5 F#4:0.5 F#4 F#4 G4 A4 | G4:4 G4 F4 | Eb4:4 Eb4:1.5 Eb4:0.5 | D4:3 D4 D4 C4 | Bb3 G3 A3 A3 D4 D4 | D4:4 D4 F4 | Bb3:2 D4 D4 Eb4 C4 | D4:4 D4:2 | C4:2 C4 D4 D4 A3 | Bb3:6', 0.01, 'sine'],
  ['R:6 | R:6 | R:2 R:2 D4 C4 | Bb3 A3 G3 D4 C4 F3 | G3:2 F3:2 F3 G3 | Eb3:2 F3:3 F3 | F3:4 F3 F3 | G3:2 G3 A3 Bb3:2 | A3:4 A3 G3 | A3:2 A3:1.5 A3:0.5 F3 Bb3 | A3:2 A3:3 A3 | A3:3 A3 D4 C4 | Bb3:4 Bb3 Bb3 | G3:2 A3:4 | A3:2 A3 A3 G3 C3 | D3:2 D3:3 D3 | D3:2 Bb3 Bb3 A3:1.5 Bb3:0.5 | G3:2 G3 D4 C4:2 | Bb3 A3 G3:4 | G3 G3 A3 D3 D3:1.5 D3:0.5 | D3:6', 0.009, 'sine'],
  ['R:6 | R:6 | R:6 | G3 F3 G3 F3 Eb3 D3 | Eb3:2 D3 Eb3 D3 Eb3 | C3:2 F3:2 F2:2 | Bb2 A2 Bb2 C3 Bb2 A2 | G2:4 G3:2 | A3 G3 A3 G3 F3 E3 | F3 E3 D3 A2 Bb2 G2 | A2:5 A2 | D3:2 D2:4 | G2:4 G2:2 | C3:4 C3:2 | D3 C3 D3 C3 Bb2 A2 | Bb2:2 F#2:4 | G2:2 G3:2 F3:2 | Eb3:2 B2:2 C3:2 | G2 F#2 G2 A2 Bb2 Bb2 | C3 Bb2 A2 G2 D2:2 | G2:6', 0.012, 'triangle'],
];
const ROUND = (21 * 6 + 14) * E8;                  // the prelude, and a silence, before it comes again

// ---------------------------------------------------------------- geometry
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
// several indexed geometries as one
function merged(list) {
  let nv = 0, ni = 0; for (const g of list) { nv += g.attributes.position.count; ni += g.index.count; }
  const p = new Float32Array(nv * 3), n = new Float32Array(nv * 3), ix = new Uint16Array(ni); let o = 0, io = 0;
  for (const g of list) { p.set(g.attributes.position.array, o * 3); n.set(g.attributes.normal.array, o * 3); for (let i = 0; i < g.index.count; i++) ix[io++] = g.index.array[i] + o; o += g.attributes.position.count; }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(p, 3)); out.setAttribute('normal', new THREE.BufferAttribute(n, 3)); out.setIndex(new THREE.BufferAttribute(ix, 1));
  return out;
}
// The shield, lying face up (its face towards +y): a shallow polished dome with a gilt boss, a rolled rim, a plain back.
const SHIELD_PROF = [[0.0004, 0.046], [0.016, 0.045], [0.032, 0.041], [0.046, 0.034], [0.054, 0.027], [0.059, 0.0255], [0.085, 0.0225], [0.115, 0.017], [0.14, 0.011], [0.155, 0.0065], [0.16, 0.0085], [0.168, 0.011], [0.176, 0.008], [0.18, 0.0], [0.172, -0.006], [0.1, -0.004], [0.0004, -0.003]].map(p => [p[0] * SH_R / 0.18, p[1] * SH_R / 0.18]);
function shieldGeo() {
  const g = new THREE.LatheGeometry(SHIELD_PROF.map(p => new THREE.Vector2(p[0], p[1])), 40); g.computeVertexNormals();
  // (outwards: up on its face)
  const N = g.attributes.normal; if (N.getY(2) < 0) { for (let i = 0; i < N.count; i++) N.setXYZ(i, -N.getX(i), -N.getY(i), -N.getZ(i)); }
  return g;
}
// The wheel, lying flat (its axle along y): a broad felloe, a hub, eight turned spokes.
function wheelGeo() {
  const k = WH_R / 0.2, rim = new THREE.TorusGeometry(WH_R - 0.02 * k, 0.02 * k, 8, 40); rim.rotateX(Math.PI / 2); rim.scale(1, 0.85, 1);
  const hub = new THREE.LatheGeometry([[0.0004, -0.04], [0.02, -0.04], [0.03, -0.022], [0.036, 0], [0.03, 0.022], [0.02, 0.04], [0.0004, 0.04]].map(p => new THREE.Vector2(p[0] * k, p[1] * k)), 12);
  const list = [rim, hub];
  for (let i = 0; i < 8; i++) {
    const sp = new THREE.LatheGeometry([[0.0075, 0.03], [0.012, 0.05], [0.0075, 0.075], [0.013, 0.105], [0.008, 0.135], [0.0075, 0.165]].map(p => new THREE.Vector2(p[0] * k, p[1] * k)), 6);
    sp.rotateZ(-Math.PI / 2); sp.rotateY(i * TAU / 8 + 0.2); list.push(sp);
  }
  const g = merged(list); g.computeVertexNormals();
  // (outwards: away from each part's own middle line is near enough; the felloe decides)
  return g;
}
// A stone: a ball squared off a little and roughened, flat underneath.
function stoneGeo(a, h, b, seed, sq = 0.72) {
  const g = new THREE.SphereGeometry(1, 16, 11), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    let x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    const k = 1 + 0.14 * (Math.sin(x * 3.1 + seed) * Math.cos(z * 2.7 + seed * 2) + 0.6 * Math.sin(y * 4.3 + x * 2 + seed * 3)) + 0.05 * Math.sin(x * 9 + z * 7 + seed);
    x = Math.sign(x) * Math.pow(Math.abs(x), sq) * k; y = Math.sign(y) * Math.pow(Math.abs(y), sq); z = Math.sign(z) * Math.pow(Math.abs(z), sq) * k;
    P.setXYZ(i, x * a, (Math.max(-0.25, y) + 0.25) / 1.25 * h, z * b);
  }
  g.computeVertexNormals(); return g;
}

// Everything that is not cloud or ground, in one mesh: each part keeps its own shape (and what kind of paint each
// point is), and is put where it is, and painted, every frame.
class Bits {
  constructor() { this.parts = []; this.nv = 0; this.ix = []; }
  add(g, kind = null) {
    const n = g.attributes.position.count, part = { o: this.nv, n, P: Float32Array.from(g.attributes.position.array), N: Float32Array.from(g.attributes.normal.array), K: new Float32Array(n) };
    if (kind) for (let i = 0; i < n; i++) part.K[i] = kind(part.P[i * 3], part.P[i * 3 + 1], part.P[i * 3 + 2], i);
    for (let i = 0; i < g.index.count; i++) this.ix.push(g.index.array[i] + this.nv);
    this.nv += n; this.parts.push(part); g.dispose(); return part;
  }
  // a sheet of ns by nw points (a cloth, a blade)
  grid(ns, nw) {
    const part = { o: this.nv, n: ns * nw, ns, nw, S: new Float32Array(ns * nw * 3) };
    for (let i = 0; i < ns - 1; i++) for (let j = 0; j < nw - 1; j++) { const a = this.nv + i * nw + j, b = a + 1, c = a + nw, d = c + 1; this.ix.push(a, c, b, b, c, d); }
    this.nv += part.n; this.parts.push(part); return part;
  }
  mesh() {
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.nv * 3); this.col = new Float32Array(this.nv * 3);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    g.setIndex(this.ix); this.geo = g;
    return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false }));
  }
}

lifeFor(16488, {
  title: /^Armida Encounters the Sleeping Rinaldo/,
  word: 'hush',
  // (the camera stands back, at a grown-up's eye: the whole picture over the floor in front of it, its two companions
  // either side; from there the top of the mantle is still under the picture's foot. On a phone held upright the
  // middle metre and a half is what shows: the mantle, the cloud's bright end and the shield.)
  stage: { out: 1.9, half: 1.6, cam: { dist: 4.0, height: 1.6, side: 0.12, fov: 57, lookU: -0.05, lookOut: 0, lookH: 0.88, whole: false } },
  wake: 2, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.2) => P.near(h, a);
    this.v = V3(); this.w = V3(); this.eye = V3(); this.c = new THREE.Color();
    this.way = new THREE.CatmullRomCurve3(WAY.map(p => V3(p[0], 0, p[1])), false, 'centripetal'); this.way.arcLengthDivisions = 200; this.wayLen = this.way.getLength();
    this.cl = { u: 0, o: 0, cs: 1, sn: 0, k: 0, dist: 0, nose: 0, gather: 0 };        // the cloud now: where, which way, how much of it is out
    this.shd = { u: 0, o: 0, h: 0, g: LEAN, f: Math.PI / 2, spin: 0, on: false };      // the shield now: its middle, its tilt (g) towards f, its turn
    // the colours (his, lifted a little: the galleries are dark at night)
    this.C = {
      steel: col('#b9b3a3', 0.12), zen: col('#7f9097', 0.15), haze: col('#9d937f', 0.15), under: col('#342c26', 0.2), cream: col('#ded3be', 0.1), orange: col('#d96f33', 0.15),
      gilt: col('#a8853f', 0.2), giltD: col('#5e431f', 0.2), giltL: col('#e6cd88', 0.12), rim: col('#6f3f2c', 0.2), back: col('#6a4a36', 0.2),
      wood: col('#a17d42', 0.2), woodD: col('#553a20', 0.2), woodL: col('#d9bb78', 0.12),
      rockT: col('#8c7d69', 0.2), rockM: col('#685746', 0.2), rockD: col('#3b3028', 0.2), peb: col('#7d4a30', 0.2),
      reedD: col('#2f3a20', 0.2), reedM: col('#55622f', 0.2), reedL: col('#8b9146', 0.15),
      manD: col('#ad4d22', 0.15), manM: col('#e67f45', 0.12), manL: col('#fbc394', 0.1),
      veilD: col('#5d684a', 0.2), veilM: col('#8f9c79', 0.15), veilL: col('#c1c9a6', 0.1),
    };
    this.buildGround(L, col); this.buildThings(L); this.buildCloud(L, col);
    this.sc = this.makeScore(L);
    this.S0 = { t: 0 }; this.mk = 0; this.mc = [0, 0, 0]; this.wasCalm = L.calm;
    this.leanAt = { u: ARC.u, o: ARC.o + ARC.r - SH_R * Math.cos(LEAN) };
    this.hide();
  },

  // ---------------------------------------------------------------- his water and his bank, on the floor
  buildGround(L, col) {
    const F = (u, o) => L.floor(u, o, V3()).setY(L.y + SURF).toArray(), a = F(-2.45, -L.wall + 0.012), b = F(1.75, -L.wall + 0.012), c = F(1.75, 2.1), d = F(-2.45, 2.1);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
    const hex = k => '#' + k.getHexString();
    // his bank: warm sand and red earth, dragged level
    const sand = strokes({ size: 256, seed: 16488, n: 1200, len: [26, 80], width: [6, 16], bend: 0.12, lift: 0.08, base: hex(col('#a9795a', 0.25)),
      colors: [['#b98a66', 4], ['#a8704f', 3], ['#c79d7a', 2.4], ['#8f5d42', 2], ['#d3ae8b', 1.2], ['#7a4c36', 1]].map(([k, w]) => [hex(col(k, 0.25)), w]), angle: (x, y, r) => (r() - 0.5) * 0.3 });
    const u = this.gu = {
      uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) },
      uShow: { value: new THREE.Vector4(0, 0, 0, 0) },            // how far it has run out; the time; how still the water is; the cloud's shade
      uGust: { value: new THREE.Vector4(-3, 0, 0, 0) },           // the gust's front along the wall; how rough behind it
      uSh: { value: new THREE.Vector4(9, 9, 0.2, 0) },            // the shield's shade: where, how wide, how dark
      uCl: { value: new THREE.Vector4(9, 9, 0.5, 0) },            // the cloud's: where its nose is
      uRk: { value: new THREE.Vector4(ROCK.u + 0.04, ROCK.o + 0.03, 0, 0) },      // the rock's shade (z: how much of the rock is up)
      tSand: { value: sand },
      cDeep: { value: col('#1d1e18', 0.2) }, cGreen: { value: col('#3a4031', 0.2) }, cPale: { value: col('#7d8a78', 0.2) }, cEarth: { value: col('#5e3a28', 0.25) }, cSand: { value: col('#9a7052', 0.25) },
      tRefl: { value: null }, reflMatrix: { value: new THREE.Matrix4() }, reflOn: { value: 0 }, reflY: { value: L.y },
    };
    const m = this.groundM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = s => {
      Object.assign(s.uniforms, u);
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', `#include <common>
uniform vec3 uO, cDeep, cGreen, cPale, cEarth, cSand; uniform vec4 uAx, uShow, uGust, uSh, uCl, uRk; uniform sampler2D tSand;
uniform sampler2D tRefl; uniform mat4 reflMatrix; uniform float reflOn, reflY;
float bH(vec2 p) { p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 19.19); return fract(p.x * p.y); }
float bN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(bH(i), bH(i + vec2(1.0, 0.0)), f.x), mix(bH(i + vec2(0.0, 1.0)), bH(i + vec2(1.0, 1.0)), f.x), f.y); }
vec3 fCol; float fA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz, st = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw)); float su = st.x, so = st.y, time = uShow.y;
  float n1 = bN(st * 2.3 + 1.7), n2 = bN(st * 7.0 + 4.7), n3 = bN(st * 21.0 + 2.0);
  vec4 sd = texture2D(tSand, st * vec2(0.9, 1.5));
  // it all runs out from the foot of the wall, a drag of paint at a time
  float rev = uShow.x * 2.7 - so - (n1 - 0.5) * 0.4 - (n2 - 0.5) * 0.12 - 0.12;
  if (rev < 0.0) discard;
  // the near bank, on the right: a spit of sand with a ragged end
  float shore = 0.15 + 0.07 * sin(so * 3.6 + 0.4) + (n1 - 0.5) * 0.12 - 0.1 * smoothstep(1.0, 1.5, so);
  float inB = su - shore + (n2 - 0.5) * 0.05 + (n3 - 0.5) * 0.02;
  float bEnd = min(1.34 + 0.1 * sin(su * 4.0 + 1.0) - so - 0.4 * max(0.0, su - 0.85), 1.5 - su) + (n1 - 0.5) * 0.42 + (n2 - 0.5) * 0.2 + (n3 - 0.5) * 0.07;
  float bank = smoothstep(-0.012, 0.03, inB) * smoothstep(0.0, 0.3, bEnd);
  // the far bank: a strip of red earth at the foot of the wall, as he drags it across the picture
  float far = (1.0 - smoothstep(0.06, 0.2, so + (n2 - 0.5) * 0.12 + (n3 - 0.5) * 0.05)) * smoothstep(-2.3, -1.8, su + (n1 - 0.5) * 0.4);
  // the water: no brim, it thins to wet boards
  vec2 e = (st - vec2(-0.62, 0.78)) / vec2(1.46, 1.02); float ea = atan(e.y, e.x);
  float wd = 1.0 - length(e) * (1.0 + 0.06 * sin(3.0 * ea + 0.6) + 0.03 * sin(7.0 * ea + 2.0)) - (n1 - 0.5) * 0.16 - (n2 - 0.5) * 0.05;
  float water = smoothstep(0.0, 0.22, wd); water *= water * (3.0 - 2.0 * water);
  float wet = smoothstep(-0.09, 0.04, wd) * (1.0 - water);
  // still and dark under the banks, paler towards you; level streaks, as he lays still water
  vec3 c = mix(cDeep, cGreen, 0.25 + 0.5 * n1);
  c = mix(c, cPale, 0.34 * smoothstep(0.35, 1.6, so) + 0.1 * smoothstep(-0.4, -1.8, su));
  c *= mix(0.55, 1.0, smoothstep(0.1, 0.55, so)) * (1.0 - 0.4 * smoothstep(0.3, 0.0, shore - su));
  float lv = bN(vec2(su * 1.1 + 3.0, so * 40.0)), lv2 = bN(vec2(su * 0.7 + time * 0.01, so * 9.0 + 9.0));
  c = mix(c, cPale, smoothstep(0.66, 0.9, lv) * smoothstep(0.45, 0.75, lv2) * 0.2 * uShow.z);
  // the wind on it: behind the gust's front the surface is roughened, and what it holds is broken up
  float ruf = uGust.y * (1.0 - smoothstep(-0.3, 0.3, su - uGust.x));
  float rp = smoothstep(0.42, 0.8, bN(vec2(su * 5.0 - time * 2.8, so * 84.0))) * bN(vec2(su * 2.2 - time * 1.4, so * 5.0 + 5.0));
  // what the polished floor mirrors, the water holds better: the cloud and the orange upside down, the lit wall
  vec4 rq = reflMatrix * vec4(lifeP, 1.0); vec2 ruv = rq.xy / rq.w + vec2(0.004, 0.026) * (rp - 0.3) * ruf + vec2(0.0, 0.0018) * sin(so * 30.0 + time * 0.9) * (1.0 - ruf);
  float on = reflOn * (1.0 - step(0.08, abs(lifeP.y - reflY)));
  vec3 refl = min(texture2D(tRefl, ruv, 2.6 + 1.4 * ruf).rgb, vec3(0.85));
  float cosT = clamp(normalize(cameraPosition - lifeP).y, 0.0, 1.0);
  float mir = (0.5 + 0.3 * smoothstep(0.55, 0.15, cosT)) * (1.0 - 0.6 * ruf) * on;
  c = mix(c, refl * vec3(0.5, 0.54, 0.46), mir);
  c *= 1.0 - 0.15 * ruf; c += cPale * ruf * rp * 0.2 * smoothstep(0.3, 0.7, bN(vec2(su * 1.6 - time * 0.9, so * 2.4 + 2.0)));
  fCol = c * 0.8; fA = water * 0.97 + wet * 0.22;
  fCol = mix(vec3(0.02, 0.022, 0.02) + refl * 0.05 * on, fCol, water / max(fA, 1.0e-3) * 0.97);
  // the earth and the sand, and the shade of what stands on them
  vec3 er = cEarth * (0.5 + 0.6 * sd.g) * (0.7 + 0.5 * n2);
  fCol = mix(fCol, er, far); fA = max(fA, far * 0.96);
  vec3 b = mix(cSand, sd.rgb, 0.16) * (0.5 + 0.42 * n1 + 0.16 * n2 + 0.06 * n3);
  b = mix(b, cEarth * (0.55 + 0.45 * sd.g), 0.85 * (1.0 - smoothstep(0.0, 0.16, inB)) + 0.5 * (1.0 - smoothstep(0.0, 0.3, bEnd)));
  vec2 rk = (st - uRk.xy) / vec2(0.3, 0.2); b *= 1.0 - 0.5 * uRk.z * exp(-dot(rk, rk) * 1.6);
  vec2 sq = (st - uSh.xy) / uSh.z; float shd = uSh.w * exp(-dot(sq, sq));
  vec2 cq = (st - uCl.xy) / vec2(uCl.z, uCl.z * 0.6); float cld = uCl.w * exp(-dot(cq, cq));
  b *= (1.0 - 0.5 * shd) * (1.0 - 0.3 * cld);
  fCol = mix(fCol, b, bank); fA = max(fA, bank * 0.94);
  fCol *= 1.0 - 0.3 * shd * (1.0 - bank);
  fA *= smoothstep(0.0, 0.16, rev);
  if (fA < 0.004) discard;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'tiepolo-armida-ground';
    this.ground = new THREE.Mesh(g, m); this.ground.renderOrder = 5; L.add(this.ground);
    Object.assign(u, L.mirrored(this.ground));        // (the room's own reflection: shown and hidden by its material)
    m.sandTex = sand;                                 // (so it is let go with the material)
  },

  // ---------------------------------------------------------------- the shield, the wheel, the rock, the reeds, the two cloths
  buildThings(L) {
    const B = this.bits = new Bits(), R = L.rand;
    // the shield: what each ring of it is (0 the gilt boss, 1 polished steel, 2 the rolled rim, 3 the back)
    const np = SHIELD_PROF.length;
    this.pShield = B.add(shieldGeo(), (x, y, z, i) => { const j = i % np; return j <= 4 ? 0 : j <= 9 ? 1 : j <= 13 ? 2 : 3; });
    this.pWheel = B.add(wheelGeo());
    this.pRock = B.add(stoneGeo(ROCK.a, ROCK.h, ROCK.b, 1.3, 0.6));
    // smaller stones at the water's edge, two of them his red ones: [u, o, half sizes, seed, red]
    this.stones = [[0.36, 0.84, 0.075, 0.07, 0.055, 4.1, 0], [0.27, 0.62, 0.045, 0.045, 0.036, 7.7, 1], [0.44, 0.99, 0.032, 0.034, 0.028, 2.2, 1], [1.14, 0.74, 0.06, 0.055, 0.045, 9.4, 0]]
      .map(s => ({ u: s[0], o: s[1], red: s[6], part: B.add(stoneGeo(s[2], s[3], s[4], s[5], 0.85)) }));
    // the reeds: tufts of long blades that arch over, as his do
    this.reeds = [];
    const tuft = (u, o, n, len, spread) => { for (let i = 0; i < n; i++) { const a = R() * TAU, d = Math.sqrt(R()) * spread; this.reeds.push({ u: u + Math.cos(a) * d, o: o + Math.sin(a) * d * 0.6, len: len * (0.6 + 0.6 * R()), az: a + (R() - 0.5), lean: 0.25 + 0.55 * R(), droop: 0.5 + 1.1 * R(), w: 0.011 + 0.008 * R(), ph: R() * TAU, tone: R(), part: B.grid(6, 2), late: R() }); } };
    tuft(0.3, 0.33, 9, 0.44, 0.13); tuft(1.05, 0.4, 6, 0.4, 0.1); tuft(-1.3, 0.17, 7, 0.4, 0.2); tuft(-0.28, 0.15, 5, 0.3, 0.12); tuft(0.5, 0.6, 4, 0.26, 0.06);
    this.pMantle = B.grid(MS, MW); this.pVeil = B.grid(VS, VW);
    this.things = B.mesh(); this.things.renderOrder = 6; L.add(this.things);
    this.lightS = V3(-0.5, 0.74, 0.46).normalize();      // the painter's light, in the stage's own measure (along, up, out)
  },

  // ---------------------------------------------------------------- the cloud: soft round dabs, light above, smoky behind
  buildCloud(L, col) {
    const R = L.rand, puffs = this.puffs = [];
    // its masses, in the cloud's own measure (x the way it is going, y up, z across, towards you when it has turned):
    // [middle, half sizes, how many dabs, how big, light from and to]
    const LOBES = [
      { c: [-0.05, 0.23, 0], r: [0.52, 0.25, 0.36], n: 24, s: [0.2, 0.3], tone: 0.5 },          // the body
      { c: [-0.22, 0.33, -0.04], r: [0.3, 0.18, 0.26], n: 15, s: [0.15, 0.22], tone: 0.55 },    // the mound the cloths ride on
      { c: [0.4, 0.15, 0.03], r: [0.33, 0.15, 0.3], n: 17, s: [0.14, 0.21], tone: 0.63 },       // the bright shelf in front
      { c: [-0.6, 0.16, 0.05], r: [0.33, 0.16, 0.28], n: 17, s: [0.16, 0.26], tone: 0.14 },     // the dark smoke behind, round the wheel
    ];
    // (each dab takes its light from where it lies on its mass, so the whole cloud is modelled as one body: light
    // above and to the left, shadow underneath and behind)
    const LX = -0.45, LY = 0.8, LZ = 0.4;
    for (const [li, lb] of LOBES.entries()) for (let i = 0; i < lb.n; i++) {
      const az = R() * TAU, el = Math.asin(lerp(-0.3, 1, R())), rr = 0.62 + 0.3 * R(), dx = Math.cos(el) * Math.cos(az), dy = Math.sin(el), dz = Math.cos(el) * Math.sin(az);
      const x = lb.c[0] + dx * lb.r[0] * rr, y = Math.max(0.08, lb.c[1] + dy * lb.r[1] * rr), z = lb.c[2] + dz * lb.r[2] * rr;
      const tone = clamp01(lb.tone + (li === 3 ? 0.16 : 0.3) * (dx * LX + dy * LY + dz * LZ) + 0.08 * (R() - 0.5));
      puffs.push({ kind: li, x, y, z, s: lerp(lb.s[0], lb.s[1], R()), ay: 0.8 + 0.25 * R(), tone, ph: R() * TAU, orb: 0.016 + 0.026 * R(), a: 0.9, soft: 0.22, seed: R(), rose: li === 3 && R() < 0.3 ? 0.45 : 0, warm: li === 1 ? 0.3 * clamp01(1 - Math.hypot(x - M_AT[0], y - M_AT[1]) / 0.3) : 0 });
    }
    // smaller, firmer billows along its upper outline, as he rounds a cloud's edge off
    for (let i = 0; i < 22; i++) {
      const lb = LOBES[i % 3], az = Math.PI * (0.15 + 0.95 * R()) * (R() < 0.5 ? 1 : -1), el = Math.asin(lerp(0.25, 1, R())), dx = Math.cos(el) * Math.cos(az), dy = Math.sin(el), dz = Math.cos(el) * Math.sin(az) * 0.6;
      const x = lb.c[0] + dx * lb.r[0], y = lb.c[1] + dy * lb.r[1], z = lb.c[2] + dz * lb.r[2];
      puffs.push({ kind: i % 3, x, y, z, s: 0.085 + 0.06 * R(), ay: 0.85 + 0.2 * R(), tone: clamp01(lb.tone + 0.08 + 0.3 * (dx * LX + dy * LY + dz * LZ)), ph: R() * TAU, orb: 0.012 + 0.02 * R(), a: 0.92, soft: 0.5, seed: R(), rose: i % 3 === 1 && R() < 0.4 ? 0.3 : 0, warm: 0 });
    }
    // long low wisps under it and trailing behind, darker
    for (let i = 0; i < 24; i++) { const x = lerp(-1.04, 0.68, R()), z = (R() - 0.5) * 0.68, back = clamp01((0.1 - x) / 0.9); puffs.push({ kind: 4, x, y: 0.045 + 0.05 * R(), z, s: 0.15 + 0.13 * R(), ay: 0.42 + 0.16 * R(), tone: lerp(0.4, 0.06, back) + 0.1 * (R() - 0.5), ph: R() * TAU, orb: 0.01, a: 0.66, soft: 0.15, seed: R(), rose: 0, warm: 0 }); }
    // the lap of vapour that takes the shield: it waits inside the shelf
    for (let i = 0; i < 20; i++) { const a = R() * TAU, d = Math.sqrt(R()); puffs.push({ kind: 5, x: Math.cos(a) * d * 0.26, y: 0.04 + 0.07 * R() * (1 - 0.5 * d), z: Math.sin(a) * d * 0.22 - 0.02, s: 0.11 + 0.08 * R(), ay: 0.62 + 0.2 * R(), tone: 0.5 + 0.3 * R() - 0.12 * Math.sin(a), ph: R() * TAU, orb: 0.008, a: 0.9, soft: 0.25, seed: R(), rose: 0, warm: 0, lag: R() }); }
    const n = this.np = Math.min(NP, puffs.length);
    const geo = new THREE.PlaneGeometry(1, 1);
    this.aPos = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aInfo = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aTint = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aPos', this.aPos); geo.setAttribute('aInfo', this.aInfo); geo.setAttribute('aTint', this.aTint);
    const u = this.cu = {
      uLight: { value: V3(L.tx * -0.5 + L.nx * 0.46, 0.74, L.tz * -0.5 + L.nz * 0.46).normalize() },
      cDeep: { value: col('#3a2e27', 0.2) }, cShade: { value: col('#786756', 0.2) }, cMid: { value: col('#b3a189', 0.15) }, cLight: { value: col('#e4d9c3', 0.08) },
      cRose: { value: col('#dca78a', 0.12) }, cWarm: { value: col('#e59a6a', 0.12) },
    };
    const m = this.cloudM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false });
    m.onBeforeCompile = s => {
      Object.assign(s.uniforms, u);
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec4 aPos, aInfo; attribute vec3 aTint; uniform vec3 uLight; varying vec4 vInfo; varying vec2 vQ; varying vec3 vTint, vLv;')
        // (each dab faces whoever is looking: the eye, or the eye's image under the floor)
        .replace('#include <project_vertex>', `vec4 mvPosition = viewMatrix * vec4(aPos.xyz, 1.0);
  mvPosition.xy += position.xy * vec2(aPos.w, aPos.w * aInfo.w);
  gl_Position = projectionMatrix * mvPosition;
  vInfo = aInfo; vTint = aTint; vQ = position.xy * 2.0; vLv = normalize((viewMatrix * vec4(uLight, 0.0)).xyz);`);
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', `#include <common>
uniform vec3 cDeep, cShade, cMid, cLight, cRose, cWarm; varying vec4 vInfo; varying vec2 vQ; varying vec3 vTint, vLv;
float cH(vec2 p) { p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 19.19); return fract(p.x * p.y); }
float cN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(cH(i), cH(i + vec2(1.0, 0.0)), f.x), mix(cH(i + vec2(0.0, 1.0)), cH(i + vec2(1.0, 1.0)), f.x), f.y); }`)
        .replace('#include <map_fragment>', `{
  float sd = vInfo.z * 6.2831, ang = atan(vQ.y, vQ.x);
  // a round dab with a soft, uneven edge: vapour, scumbled
  float r = length(vQ) * (1.0 + 0.1 * sin(ang * 3.0 + sd) + 0.06 * sin(ang * 5.0 + sd * 2.3) + 0.035 * sin(ang * 9.0 + sd * 4.1));
  float a = (1.0 - smoothstep(vTint.z, 1.0, r)) * vInfo.y; if (a < 0.012) discard;
  // lit as a ball is, from his upper left; a drag of the brush across it
  vec3 n = normalize(vec3(vQ, sqrt(max(0.0, 1.0 - min(r * r, 1.0))) * 1.1 + 0.2));
  float br = cN(vec2(vQ.x * cos(sd) - vQ.y * sin(sd), vQ.x * sin(sd) + vQ.y * cos(sd)) * vec2(1.3, 3.4) + sd * 5.0) - 0.5;
  float tone = clamp(vInfo.x + 0.26 * (dot(n, vLv) - 0.35) + 0.1 * br, 0.0, 1.0);
  vec3 c = tone < 0.3 ? mix(cDeep, cShade, tone / 0.3) : tone < 0.62 ? mix(cShade, cMid, (tone - 0.3) / 0.32) : mix(cMid, cLight, (tone - 0.62) / 0.38);
  c = mix(c, cRose * (0.55 + 0.6 * tone), vTint.x); c = mix(c, cWarm, vTint.y * smoothstep(0.35, 0.8, tone));
  diffuseColor = vec4(c, a);
}`);
    };
    m.customProgramCacheKey = () => 'tiepolo-armida-cloud';
    const mesh = this.cloud = new THREE.InstancedMesh(geo, m, n); mesh.count = 0; mesh.renderOrder = 7; L.add(mesh);
    // scratch: one row to a dab, then drawn far to near
    this.pp = new Float32Array(n * 4); this.pi = new Float32Array(n * 4); this.pt = new Float32Array(n * 3); this.dep = new Float32Array(n);
    this.order = []; this.byDepth = (a, b) => this.dep[b] - this.dep[a];
  },

  // ---------------------------------------------------------------- the sound: the place, the wind, the shield, and then Lully
  makeScore(L) {
    const s = score(L), calm = L.calm, q = calm ? 0.55 : 1;
    // two small birds, far off: they stop when the air stirs
    const tweet = (t, f, v = 0.008) => { s.note(t, f, 0.07, { type: 'sine', vol: v, to: f * 1.22, attack: 0.012 }); s.note(t + 0.1, f * 1.18, 0.09, { type: 'sine', vol: v * 0.8, to: f * 0.94, attack: 0.012 }); };
    tweet(0.3, 3100); tweet(0.62, 3650, 0.006); tweet(0.98, 3000); tweet(1.22, 3500, 0.006);
    // the shield rolls out on the sand, and knocks softly on the stone as it leans
    s.hit(T_ROLL + 0.05, { d: T_LEAN - T_ROLL, vol: 0.006, lp: 460, hp: 130, attack: 0.3 });
    s.note(T_LEAN + 0.05, 392, 0.55, { type: 'sine', vol: 0.012 * q, attack: calm ? 0.03 : 0.005, over: 2.76, overVol: 0.3 });
    // the air stirs; the wind comes with the cloud, and is cut off
    s.hit(T_AIR, { d: 1.1, vol: 0.005, lp: 1300, hp: 320, attack: 0.5 });
    s.hit(T_CLOUD, { d: T_CATCH - T_CLOUD, vol: 0.015 * q, lp: calm ? 600 : 850, hp: 160, attack: 1.6 });
    s.hit(T_CATCH - 1.3, { d: 1.29, vol: 0.016 * q, bp: calm ? 600 : 950, q: 0.7, attack: 1.2 });
    // the shield goes round on its rim: every quarter turn a touch of steel on sand, closer and closer; and its hum
    if (!calm) {
      const total = TURNS * TAU + 0.35, nq = Math.floor(total / (Math.PI / 2));
      for (let k = 1; k <= nq; k++) { const t = T_GUST + FALL * Math.pow(k * (Math.PI / 2) / total, 1 / 2.3), v = 0.004 + 0.007 * k / nq; s.hit(t, { d: 0.06, vol: v, hp: 1500, lp: 5200, attack: 0.002 }); s.note(t, 900 + 60 * k, 0.16, { type: 'sine', vol: v * 0.6, attack: 0.003, over: 2.4, overVol: 0.25 }); }
      s.note(T_GUST + 0.25, 640, FALL - 0.26, { type: 'sine', vol: 0.006, to: 1180, attack: FALL - 0.4 });
    }
    // taken: a breath of vapour, and nothing
    s.hit(T_CATCH - 0.06, { d: 0.55, vol: 0.011 * q, lp: 520, hp: 140, attack: 0.07 });
    // the prelude, on muted strings; again after a silence, for as long as you look
    const n0 = s.ev.length;
    LULLY.forEach(([mel, vol, type], i) => s.tune(mel, 0, 60 / E8, { vol: vol * (calm ? 0.85 : 1), type, legato: 0.96, attack: calm ? 0.09 : 0.04, ...(i === 4 ? { over: 2, overVol: 0.25 } : {}) }));      // (the bass with its octave, for small speakers)
    s.loop(T_TUNE, ROUND, s.ev.splice(n0));
    return s.done();
  },

  hide() { this.cloud.count = 0; this.cloud.visible = false; this.things.visible = false; this.groundM.visible = false; this.gu.uShow.value.set(0, 0, 0, 0); },
  start(L, resumed) {
    if (!resumed) this.hide();
    if (this.wasCalm !== L.calm) { this.wasCalm = L.calm; this.sc = this.makeScore(L); }      // (the setting may have changed since it was built)
    this.sc.from(L.t);
    if (!this.told && !L.quiet) { this.told = true; L.k.say('A cloud comes in on the wind. A shield begins to topple, and the cloud catches it before it can make a sound.', 4.5); }
  },
  back(L) { this.S0.t = L.t; },
  end() { this.hide(); },
  reset() { this.told = false; this.hide(); },

  // ---------------------------------------------------------------- one frame
  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', calm = L.calm, r = showing ? 0 : L.ret;
    const t = showing ? L.t : this.S0.t, time = showing ? L.t : this.S0.t + r * L.retDur;      // what has happened; and the clock things breathe by
    const home = ease.inOut(ramp(r, 0.1, 0.86));                                             // the cloud going back the way it came
    const GG = L.k.G, C = this.C;
    // the eye (a test's eye is put in place after this: src/main.js), in the stage's own measure
    const eye = GG.testEye ? this.eye.fromArray(GG.testEye.at) : GG.camera.position;
    const ex = eye.x - L.cx, ez = eye.z - L.cz, eu = ex * L.tx + ez * L.tz, eo = ex * L.nx + ez * L.nz, eh = eye.y - L.y;

    // ---- the ground
    const spread = ease.out(ramp(t, 0, 1.5)) * (1 - ease.inOut(ramp(r, 0.55, 1)));
    const wk = calm ? 0.5 : 1;
    const wind = (0.16 * sm(t, T_AIR, T_AIR + 0.4) + 0.84 * sm(t, T_CLOUD + 0.5, T_GUST + 0.1)) * (1 - 0.95 * sm(t, T_CATCH - 0.1, T_CATCH + 0.3)) * (1 - sm(r, 0, 0.3)) * wk + 0.3 * hump(r, 0.1, 0.9) * wk;
    const front = lerp(-2.6, 1.6, sm(t, T_CLOUD + 0.2, T_GUST + 0.1));
    const rough = sm(t, T_CLOUD + 0.3, T_CLOUD + 1.0) * (1 - sm(t, T_CATCH + 0.1, T_CATCH + 2.2)) * wk;
    const G = this.gu;
    G.uShow.value.set(spread, time, 1 - 0.8 * rough, 0); G.uGust.value.set(front, Math.max(rough, 0.5 * hump(r, 0.1, 0.9) * wk), 0, 0);
    this.groundM.visible = spread > 0.002;

    // ---- the cloud: where it is on its way, and which way it is heading
    const cl = this.cl;
    { const q = ramp(t, T_CLOUD, T_STOP), s = lerp(q * q * (3 - 2 * q), 1 - Math.pow(1 - q, 2.6), 0.72) * (1 - home);
      this.way.getPointAt(clamp01(s), this.v); this.way.getTangentAt(clamp01(Math.max(s, 0.02)), this.w);
      cl.gather = showing || r < 0.05 ? hump(t, T_CATCH - 0.5, T_CATCH - 0.12) : 0;
      cl.nose = ease.outBack(ramp(t, T_CATCH - 0.24, T_CATCH + 0.12)) * (1 - ease.inOut(ramp(r, 0.0, 0.3)));
      const hl = Math.hypot(this.w.x, this.w.z) || 1; cl.cs = this.w.x / hl; cl.sn = this.w.z / hl;
      cl.u = this.v.x - cl.cs * 0.05 * cl.gather; cl.o = this.v.z - cl.sn * 0.05 * cl.gather; cl.dist = s * this.wayLen; cl.k = t > T_CLOUD ? 1 : 0; }
    const breath = Math.sin(time * 0.9), churn = cl.dist * 5 + time * (calm ? 0.2 : 0.4);

    // ---- the shield
    const sh = this.shd; this.poseShield(L, t, r, calm, breath);

    // ---- the cloud's dabs
    let n = 0; const pp = this.pp, pi = this.pi, pt = this.pt, np = this.np, wallO = -L.wall;
    if (cl.k > 0 && spread > 0.01) for (let i = 0; i < np; i++) {
      const p = this.puffs[i]; let x = p.x, y = p.y, z = p.z, s = p.s, a = p.a;
      if (p.kind === 5) {
        // the lap: out along the cloud's heading, under the shield, a cushion that it sinks into
        const k = clamp01(cl.nose * 1.25 - 0.25 * p.lag); if (k <= 0.02) continue;
        const reach = lerp(0.46, 0.94, k); x = reach + p.x * (0.5 + 0.5 * k); y = p.y * (0.55 + 0.6 * k) + 0.01 * breath; z = p.z * (0.5 + 0.5 * k) + 0.02; a *= clamp01(k * 2.2); s *= 0.6 + 0.5 * k;
      } else {
        const g = 1 + 0.07 * cl.gather; x += p.orb * Math.cos(churn + p.ph); y = y * g * (1 + 0.035 * breath) + p.orb * 0.7 * Math.sin(churn + p.ph); s *= 1 + 0.04 * Math.sin(time * 0.8 + p.ph);
        if (p.kind === 2) x += 0.05 * cl.nose;      // (the shelf leans into it)
      }
      const u = cl.u + x * cl.cs - z * cl.sn, o = cl.o + x * cl.sn + z * cl.cs;
      a *= clamp01((o - wallO - 0.02) / 0.22) * clamp01(spread * 3);      // (it gathers out of the wall)
      if (a < 0.02) continue;
      L.floor(u, o, this.v);
      pp[n * 4] = this.v.x; pp[n * 4 + 1] = L.y + SURF + Math.max(y, s * p.ay * 0.34); pp[n * 4 + 2] = this.v.z; pp[n * 4 + 3] = s * 2;
      pi[n * 4] = p.tone; pi[n * 4 + 1] = a; pi[n * 4 + 2] = p.seed; pi[n * 4 + 3] = p.ay;
      pt[n * 3] = p.rose; pt[n * 3 + 1] = p.warm * this.mk; pt[n * 3 + 2] = p.soft;
      n++;
    }
    // far to near
    { const ord = this.order; ord.length = n;
      for (let i = 0; i < n; i++) { ord[i] = i; this.dep[i] = Math.hypot(pp[i * 4] - eye.x, pp[i * 4 + 1] - eye.y, pp[i * 4 + 2] - eye.z); }
      ord.sort(this.byDepth);
      const A = this.aPos.array, I = this.aInfo.array, T = this.aTint.array;
      for (let j = 0; j < n; j++) { const i = ord[j]; for (let k = 0; k < 4; k++) { A[j * 4 + k] = pp[i * 4 + k]; I[j * 4 + k] = pi[i * 4 + k]; } T[j * 3] = pt[i * 3]; T[j * 3 + 1] = pt[i * 3 + 1]; T[j * 3 + 2] = pt[i * 3 + 2]; }
      this.cloud.count = n; this.cloud.visible = n > 0; this.aPos.needsUpdate = true; this.aInfo.needsUpdate = true; this.aTint.needsUpdate = true; }

    // ---- the things
    const B = this.bits; this.things.visible = spread > 0.002;
    if (this.things.visible) {
      const up = sm(t, 0.35, 1.25) * (1 - ease.inOut(ramp(r, 0.3, 0.7)));
      G.uRk.value.z = up;
      this.putStone(L, this.pRock, ROCK.u, ROCK.o, up, 0);
      for (const st of this.stones) this.putStone(L, st.part, st.u, st.o, up, st.red);
      // the reeds: up out of the bank, laid over by the wind, and standing up again one by one
      const flut = calm ? 0 : 1;
      for (const rd of this.reeds) {
        const grow = ease.out(ramp(t, 0.3 + 0.5 * rd.late, 1.2 + 0.5 * rd.late)) * (1 - ease.inOut(ramp(r, 0.3, 0.72)));
        const lee = sm(front - rd.u, -0.2, 0.5), still = sm(t, T_CATCH + 0.3 + 1.6 * rd.late, T_CATCH + 1.3 + 1.6 * rd.late);
        const w = wind * lee * (1 + 0.16 * flut * Math.sin(time * 11 + rd.ph)) + 0.5 * wk * lee * (1 - still) * sm(t, T_CATCH - 0.1, T_CATCH + 0.3) * (1 - sm(r, 0, 0.3)) + 0.03 * Math.sin(time * 0.9 + rd.ph);
        this.putReed(L, rd, grow, w);
      }
      this.putShield(L, eu, eh, eo);
      this.putWheel(L, eu, eh, eo, t, r);
      this.putCloths(L, t, r, time, calm, eh, eo);
      B.geo.attributes.position.needsUpdate = true; B.geo.attributes.color.needsUpdate = true;
    }
    // the shade under the shield, and under the lap of cloud
    G.uSh.value.set(sh.u, sh.o, 0.12 + 0.5 * sh.h, sh.on ? clamp01(1.1 - sh.h * 3.2) * (1 - sm(r, 0.5, 0.8)) : 0);
    G.uCl.value.set(cl.u + 0.84 * cl.cs, cl.o + 0.84 * cl.sn, 0.3, 0.8 * cl.nose);

    if (showing) this.sc.play(L.t);
    L.voice().place();
  },

  // ---------------------------------------------------------------- the shield: where it is and how it lies, at show-time t
  poseShield(L, t, r, calm, breath) {
    const sh = this.shd;
    sh.on = t > T_ROLL;
    const total = calm ? 0.85 : TURNS * TAU + 0.35;                // (it comes round to face you as it is caught; with motion reduced it only tips)
    if (t < T_GUST) {
      // out from under the frame on its rim, round in a curve as a coin goes, and back against the rock
      const q = ease.out(ramp(t, T_ROLL, T_LEAN)), l0 = ARC.o - ARC.from, l1 = ARC.r * Math.PI / 2, d = q * (l0 + l1);
      let cu, co, hd;                                           // where the rim touches, and the way it is going
      if (d < l0) { cu = ARC.u + ARC.r; co = ARC.from + d; hd = Math.PI / 2; }
      else { const a = (d - l0) / ARC.r; cu = ARC.u + ARC.r * Math.cos(a); co = ARC.o + ARC.r * Math.sin(a); hd = Math.PI / 2 + a; }
      const settle = t - T_LEAN, lean = 9 * DEG * sm(d, l0 * 0.6, l0 + l1 * 0.6) + 7 * DEG * (settle > 0 ? 1 - Math.exp(-settle * 9) * Math.cos(settle * (calm ? 0 : 16)) : 0);
      sh.g = Math.PI / 2 - lean; sh.f = hd - Math.PI / 2; sh.spin = -d / SH_R;
      sh.u = cu - SH_R * Math.cos(sh.g) * Math.cos(sh.f); sh.o = co - SH_R * Math.cos(sh.g) * Math.sin(sh.f); sh.h = SH_R * Math.sin(sh.g);
    } else {
      // off the rock and round on its rim, lower and faster; and then the cloud has it
      const q = ramp(t, T_GUST, T_CATCH), la = this.leanAt, dq = sm(q, 0, 0.6);
      const g0 = lerp(LEAN, FLAT, Math.pow(q, 1.6)), f0 = Math.PI / 2 + (total - 0.5) * Math.pow(q, 2.3);
      const tr = t - T_CATCH, tau = Math.max(0, tr), took = ease.out(ramp(tr, -0.06, 0.4));
      sh.u = lerp(la.u, REST.u, dq); sh.o = lerp(la.o, REST.o, dq);
      sh.g = g0 + (took > 0 ? (36 * DEG - FLAT) * took - 6 * DEG * Math.exp(-tau * 2.6) * Math.sin(tau * (calm ? 3 : 7)) : 0) + 0.012 * breath * took;
      sh.f = f0 + 0.5 * (1 - Math.exp(-tau * 4));
      sh.spin = -ROLLED - 0.4 * (sh.f - Math.PI / 2);
      sh.h = SH_R * Math.sin(sh.g) + took * (0.075 + 0.014 * Math.exp(-tau * 3) * Math.cos(tau * 8) + 0.01 * breath);
    }
    if (r > 0) {
      // going home: let down flat on the sand, and drawn back under the frame with the bank
      const down = ease.inOut(ramp(r, 0, 0.3)), slide = ease.inOut(ramp(r, 0.32, 0.8));
      sh.g = lerp(sh.g, 3 * DEG, down); sh.h = lerp(sh.h, SH_R * Math.sin(3 * DEG) + 0.012, down);
      sh.u = lerp(sh.u, sh.u * 0.8 + 0.16, slide); sh.o = lerp(sh.o, -0.34, slide);
    }
  },

  // ---------------------------------------------------------------- painting the things
  // a disc's own axes from its tilt g (0 flat, face up) towards f, and its turn about its own middle: into this.ax
  axes(g, f, spin) {
    const sg = Math.sin(g), cg = Math.cos(g), cf = Math.cos(f), sf = Math.sin(f), cs = Math.cos(spin), sn = Math.sin(spin);
    const A = this.ax || (this.ax = new Float32Array(9));
    // (stage measure: along, up, out) the face's normal; two lines in the disc
    const nx = sg * cf, ny = cg, nz = sg * sf, e1x = -sf, e1z = cf, e2x = cg * cf, e2y = -sg, e2z = cg * sf;
    A[0] = e1x * cs + e2x * sn; A[1] = e2y * sn; A[2] = e1z * cs + e2z * sn;
    A[3] = nx; A[4] = ny; A[5] = nz;
    A[6] = -e1x * sn + e2x * cs; A[7] = e2y * cs; A[8] = -e1z * sn + e2z * cs;
    return A;
  },
  putShield(L, eu, eh, eo) {
    const sh = this.shd, pt = this.pShield, P = pt.P, N = pt.N, K = pt.K, pos = this.bits.pos, colr = this.bits.col, C = this.C, cl = this.cl;
    if (!sh.on) { this.collapse(pt); return; }
    const A = this.axes(sh.g, sh.f, sh.spin), tx = L.tx, tz = L.tz, nx = L.nx, nz = L.nz, Ls = this.lightS;
    // what it has to show: the cloud's bright body and the orange over it, from where the shield is
    let cu = cl.u + 0.1 * cl.cs - sh.u, ch = 0.3 - sh.h, co = cl.o + 0.1 * cl.sn - sh.o; const cd = Math.hypot(cu, ch, co) || 1; cu /= cd; ch /= cd; co /= cd;
    const cOn = cl.k * sm(cl.o, -0.2, 0.6), cW = 0.07 + 0.22 * clamp01(1.6 - cd);
    let mu = this.mc[0] - sh.u, mh = this.mc[1] - sh.h, mo = this.mc[2] - sh.o; const md = Math.hypot(mu, mh, mo) || 1; mu /= md; mh /= md; mo /= md;
    const mOn = cOn * this.mk, mW = 0.03 + 0.07 * clamp01(1.5 - md);
    for (let i = 0, o = pt.o * 3; i < pt.n; i++, o += 3) {
      const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], a = N[i * 3], b = N[i * 3 + 1], c = N[i * 3 + 2];
      const pu = sh.u + x * A[0] + y * A[3] + z * A[6], ph = sh.h + x * A[1] + y * A[4] + z * A[7], po = sh.o + x * A[2] + y * A[5] + z * A[8];
      const nu = a * A[0] + b * A[3] + c * A[6], nh = a * A[1] + b * A[4] + c * A[7], no = a * A[2] + b * A[5] + c * A[8];
      pos[o] = L.cx + tx * pu + nx * po; pos[o + 1] = L.y + Math.max(ph, 0.004) + SURF; pos[o + 2] = L.cz + tz * pu + nz * po;
      const k = K[i]; let R, G, Bl;
      if (k >= 2) {
        const d = clamp01(0.5 + 0.55 * (nu * Ls.x + nh * Ls.y + no * Ls.z)), base = k === 2 ? C.rim : C.back;
        R = base.r * (0.45 + 0.9 * d); G = base.g * (0.45 + 0.9 * d); Bl = base.b * (0.45 + 0.9 * d);
      } else {
        // the eye's line off the polish, and what lies that way
        let vu = pu - eu, vh = ph - eh, vo = po - eo; const vl = Math.hypot(vu, vh, vo) || 1; vu /= vl; vh /= vl; vo /= vl;
        const dn = 2 * (vu * nu + vh * nh + vo * no), ru = vu - dn * nu, rh = vh - dn * nh, ro = vo - dn * no;
        const sky = clamp01(rh * 1.5 + 0.12), gnd = Math.max(clamp01(-rh * 3.2), 0.55 * Math.exp(-rh * rh / 0.02));
        R = lerp(C.haze.r, C.zen.r, sky); G = lerp(C.haze.g, C.zen.g, sky); Bl = lerp(C.haze.b, C.zen.b, sky);
        R = lerp(R, C.under.r, gnd); G = lerp(G, C.under.g, gnd); Bl = lerp(Bl, C.under.b, gnd);
        const wc = cOn * Math.exp(-(1 - (ru * cu + rh * ch + ro * co)) / cW); R = lerp(R, C.cream.r, wc); G = lerp(G, C.cream.g, wc); Bl = lerp(Bl, C.cream.b, wc);
        const wm = mOn * Math.exp(-(1 - (ru * mu + rh * mh + ro * mo)) / mW); R = lerp(R, C.orange.r, wm); G = lerp(G, C.orange.g, wm); Bl = lerp(Bl, C.orange.b, wm);
        if (k === 1) { R *= C.steel.r * 1.12; G *= C.steel.g * 1.12; Bl *= C.steel.b * 1.12; }
        else { const lum = 0.3 * R + 0.59 * G + 0.11 * Bl, ray = 0.82 + 0.18 * Math.cos(Math.atan2(z, x) * 20), gl = (0.42 + 0.95 * lum) * ray; R = lerp(C.giltD.r, C.gilt.r, gl) + C.giltL.r * 0.3 * lum * lum; G = lerp(C.giltD.g, C.gilt.g, gl) + C.giltL.g * 0.3 * lum * lum; Bl = lerp(C.giltD.b, C.gilt.b, gl) + C.giltL.b * 0.3 * lum * lum; }
      }
      colr[o] = R; colr[o + 1] = G; colr[o + 2] = Bl;
    }
  },
  putWheel(L, eu, eh, eo, t, r) {
    const pt = this.pWheel, P = pt.P, N = pt.N, pos = this.bits.pos, colr = this.bits.col, C = this.C, cl = this.cl, Ls = this.lightS;
    const u = cl.u + WHEEL[0] * cl.cs - WHEEL[2] * cl.sn, o = cl.o + WHEEL[0] * cl.sn + WHEEL[2] * cl.cs;
    if (cl.k <= 0 || o < -L.wall - 0.3) { this.collapse(pt); return; }
    // it stands in the cloud's flank, its axle across the way it goes, and turns as far as the cloud has come;
    // pulled up, it rocks back a little and is still
    const tau = t - T_STOP, rock = tau > 0 ? 0.22 * Math.exp(-tau * 2.4) * Math.sin(tau * 5) : 0;
    const f = Math.atan2(cl.sn, cl.cs) + Math.PI / 2, A = this.axes(86 * DEG, f, cl.dist / WH_R + rock), tx = L.tx, tz = L.tz, nx = L.nx, nz = L.nz;
    const hgt = WHEEL[1] + 0.006 * Math.sin(t * 0.9);
    for (let i = 0, q = pt.o * 3; i < pt.n; i++, q += 3) {
      const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], a = N[i * 3], b = N[i * 3 + 1], c = N[i * 3 + 2];
      const pu = u + x * A[0] + y * A[3] + z * A[6], ph = hgt + x * A[1] + y * A[4] + z * A[7], po = o + x * A[2] + y * A[5] + z * A[8];
      let nu = a * A[0] + b * A[3] + c * A[6], nh = a * A[1] + b * A[4] + c * A[7], no = a * A[2] + b * A[5] + c * A[8];
      pos[q] = L.cx + tx * pu + nx * po; pos[q + 1] = L.y + Math.max(ph, 0.004) + SURF; pos[q + 2] = L.cz + tz * pu + nz * po;
      let vu = eu - pu, vh = eh - ph, vo = eo - po; const vl = Math.hypot(vu, vh, vo) || 1; vu /= vl; vh /= vl; vo /= vl;
      if (nu * vu + nh * vh + no * vo < 0) { nu = -nu; nh = -nh; no = -no; }
      const d = clamp01(0.42 + 0.62 * (nu * Ls.x + nh * Ls.y + no * Ls.z));
      let hu = Ls.x + vu, hh = Ls.y + vh, ho = Ls.z + vo; const hl = Math.hypot(hu, hh, ho) || 1; const sp = Math.pow(clamp01((nu * hu + nh * hh + no * ho) / hl), 14) * 0.5;
      // (the smoke round it puts its foot in shadow)
      const low = 0.6 + 0.4 * clamp01(ph / 0.22);
      colr[q] = (lerp(C.woodD.r, C.wood.r, d) + C.woodL.r * sp) * low; colr[q + 1] = (lerp(C.woodD.g, C.wood.g, d) + C.woodL.g * sp) * low; colr[q + 2] = (lerp(C.woodD.b, C.wood.b, d) + C.woodL.b * sp) * low;
    }
  },
  putStone(L, pt, u, o, up, red) {
    const P = pt.P, N = pt.N, pos = this.bits.pos, colr = this.bits.col, C = this.C, Ls = this.lightS, tx = L.tx, tz = L.tz, nx = L.nx, nz = L.nz;
    if (up <= 0.03) { this.collapse(pt); return; }
    const k = 0.3 + 0.7 * up, hk = ease.out(up);
    for (let i = 0, q = pt.o * 3; i < pt.n; i++, q += 3) {
      const x = P[i * 3] * k, y = P[i * 3 + 1] * hk, z = P[i * 3 + 2] * k, pu = u + x, po = o + z;
      pos[q] = L.cx + tx * pu + nx * po; pos[q + 1] = L.y + SURF + y - 0.004; pos[q + 2] = L.cz + tz * pu + nz * po;
      const d = clamp01(0.5 + 0.55 * (N[i * 3] * Ls.x + N[i * 3 + 1] * Ls.y + N[i * 3 + 2] * Ls.z) + 0.1 * Math.sin(P[i * 3] * 31 + P[i * 3 + 2] * 23 + pt.o)), v = 0.88 + 0.24 * hash(Math.floor(P[i * 3] * 24), Math.floor(P[i * 3 + 2] * 24) + pt.o), g = clamp01(y / 0.06);
      const lo = red ? C.rockD : C.rockD, mid = red ? C.peb : C.rockM, hi = red ? C.peb : C.rockT, e = d < 0.5 ? d * 2 : (d - 0.5) * 2, a = d < 0.5 ? lo : mid, b = d < 0.5 ? mid : hi;
      const dk = (0.55 + 0.45 * g) * v * (red && d >= 0.5 ? 1 + 0.25 * e : 1);
      colr[q] = lerp(a.r, b.r, e) * dk; colr[q + 1] = lerp(a.g, b.g, e) * dk; colr[q + 2] = lerp(a.b, b.b, e) * dk;
    }
  },
  putReed(L, rd, grow, wind) {
    const pt = rd.part, pos = this.bits.pos, colr = this.bits.col, C = this.C, tx = L.tx, tz = L.tz, nx = L.nx, nz = L.nz;
    if (grow <= 0.01) { this.collapse(pt); return; }
    // a blade: up from its root and arching over the way it leans; the wind lays it over to the right
    let u = rd.u, h = 0, o = rd.o; const seg = rd.len * grow / 5, ca = Math.cos(rd.az), sa = Math.sin(rd.az), wb = Math.max(-0.2, wind) * 1.15;
    for (let i = 0; i < 6; i++) {
      const s = i / 5, bend = rd.lean * (0.4 + 0.6 * s) + rd.droop * s * s * (1 - 0.35 * Math.min(1, Math.abs(wb)));
      // (its own lean, and the wind's, added as two pushes on the blade's direction)
      let du = Math.sin(bend) * ca + wb * (0.25 + 0.75 * s), dh = Math.cos(bend), dout = Math.sin(bend) * sa; const dl = Math.hypot(du, dh, dout) || 1; du /= dl; dh /= dl; dout /= dl;
      if (i) { u += du * seg; h += dh * seg; o += dout * seg; }
      const w = rd.w * (1 - 0.92 * s * s) * (0.5 + 0.5 * grow), q = (pt.o + i * 2) * 3;
      // (across it: level, and square to the way it leans, so its flat is towards you)
      const axu = -sa * 0.5 + 0.86, axo = ca * 0.5, al = Math.hypot(axu, axo) || 1, wu = axu / al * w, wo = axo / al * w, hh = L.y + SURF + Math.max(0.003, h);
      pos[q] = L.cx + tx * (u - wu) + nx * (o - wo); pos[q + 1] = hh; pos[q + 2] = L.cz + tz * (u - wu) + nz * (o - wo);
      pos[q + 3] = L.cx + tx * (u + wu) + nx * (o + wo); pos[q + 4] = hh; pos[q + 5] = L.cz + tz * (u + wu) + nz * (o + wo);
      const a = s < 0.5 ? C.reedD : C.reedM, b = s < 0.5 ? C.reedM : C.reedL, e = (s < 0.5 ? s * 2 : (s - 0.5) * 2) * (0.55 + 0.6 * rd.tone), k0 = 0.8 + 0.3 * rd.tone;
      for (let j = 0; j < 2; j++) { const k = k0 * (j ? 1.12 : 0.9); colr[q + j * 3] = lerp(a.r, b.r, e) * k; colr[q + j * 3 + 1] = lerp(a.g, b.g, e) * k; colr[q + j * 3 + 2] = lerp(a.b, b.b, e) * k; }
    }
  },
  collapse(pt) { const pos = this.bits.pos; for (let i = pt.o * 3, e = (pt.o + pt.n) * 3; i < e; i += 3) { pos[i] = this.bits.pos[0]; pos[i + 1] = -50; pos[i + 2] = this.bits.pos[2]; } },

  // ---------------------------------------------------------------- the mantle and the veil
  putCloths(L, t, r, time, calm, eh, eo) {
    const cl = this.cl, C = this.C, gone = sm(r, 0.1, 0.34);
    // each is made fast on the cloud's mound; it is not out until that is clear of the wall
    const mu = cl.u + M_AT[0] * cl.cs - M_AT[2] * cl.sn, mo = cl.o + M_AT[0] * cl.sn + M_AT[2] * cl.cs;
    const out = cl.k * sm(mo, 0.05, 0.5) * (1 - gone);
    const fk = calm ? 0 : 1, moving = 1 - sm(t, T_SWING + 0.25, T_SWING + 0.75), idle = sm(t, T_TUNE, T_TUNE + 2.5);
    // How high a cloth may stand here and still be under the pictures' feet, from this eye. From the look it is all the
    // room they want; from a low eye (the toy's) it is not, and rather than be cut off they lie down along the cloud.
    const room = eo > mo + 0.2 ? 0.66 + (eh - 0.66) * mo / eo : 2, up = ease.smooth((room - 0.46) / 0.42) * (1 - sm(r, 0, 0.26));      // (and going home they lie down first, then are drawn in)
    { // the mantle: streaming flat out behind; over the top as the cloud pulls up; hanging filled, as he painted it
      const tau = Math.max(0, t - T_SWING), z = calm ? 3.2 : 2.2, w = calm ? 2.6 : 4.0;
      const th = lerp(6, 52 + 108 * Math.exp(-z * tau) * Math.cos(w * tau), up) * DEG + 0.03 * idle * Math.sin(time * 0.7);
      const kap = up * lerp(-24, 28, sm(tau, 0, 0.75)) * DEG + 0.05 * idle * Math.sin(time * 0.55 + 1);
      const belly = lerp(0.03, 0.17, sm(tau, 0.12, 0.7)) * (1 + 0.1 * idle * Math.sin(time * 0.8));
      this.mk = out;
      this.sheet(L, this.pMantle, mu, M_AT[1] + 0.01 * Math.sin(time * 0.9), mo, {
        len: M_LEN * out, th, kap, belly: belly * out, flut: (0.5 * moving + 0.03 * idle) * fk + 0.12 * moving * (1 - fk), fs: calm ? 5 : 13, time, slant: 0.12 * up,
        half: s => M_W * (0.34 + 0.66 * Math.pow(Math.min(1, s * 1.5), 0.6)) * (1 - 0.1 * s * s), skew: s => 0.16 * M_W * s * s, twist: up < 0.999 ? () => (1 - up) * 1.4 : null, hem: 0.018,
        fold: (s, w) => (0.008 + 0.042 * Math.pow(s, 0.7)) * Math.sin(w * 4.7 + 0.6 + 1.2 * Math.sin(2.6 * s + 0.5)) + 0.016 * s * Math.sin(w * 9.5 + 3 * s + 1) + 0.009 * Math.sin(w * 6.1 - 11 * s + 2) * Math.sin(Math.PI * s),
        lo: C.manD, mid: C.manM, hi: C.manL, root: 0.6, gain: 0.95,
      }, this.mc);
    }
    { // the veil: a long thin one, later and lighter; it comes down last, in a loop over to the left
      const vu = cl.u + V_AT[0] * cl.cs - V_AT[2] * cl.sn, vo = cl.o + V_AT[0] * cl.sn + V_AT[2] * cl.cs;
      const tau = Math.max(0, t - T_SWING - 0.12), z = calm ? 2.4 : 1.5, w = calm ? 2.0 : 3.0;
      const th = lerp(170, 104 + 58 * Math.exp(-z * tau) * Math.cos(w * tau), up) * DEG;
      const kap = lerp(-12, lerp(-8, 172, ease.out(ramp(tau, 0, calm ? 1.3 : 0.9))), up) * DEG + 0.09 * idle * up * Math.sin(time * 0.6);
      this.sheet(L, this.pVeil, vu, V_AT[1] + 0.01 * Math.sin(time * 0.9), vo, {
        len: V_LEN * out, th, kap, belly: 0, flut: (0.42 * moving + 0.05 * idle) * fk + 0.1 * moving * (1 - fk), fs: calm ? 4.5 : 11, time, slant: 0, pw: 1.3,
        half: s => V_W * (0.45 + 0.75 * Math.sin(Math.PI * Math.pow(s, 0.8)) + 0.5 * s * s), skew: () => 0,
        twist: s => 0.5 + 2.5 * s + 0.35 * Math.sin(time * 0.6 * (calm ? 0.5 : 1) + 5 * s),
        fold: (s, w) => 0.012 * Math.sin(s * 15 + w * 2), lo: C.veilD, mid: C.veilM, hi: C.veilL, root: 0.75, gain: 0.7,
      }, null);
    }
  },
  // A sheet of cloth in the plane of the wall: its middle line runs from (u, h, o) at angle th (from "to the right",
  // anticlockwise), curling by kap along its length; it is `half` wide either side, bellied out towards you, folded,
  // or (a ribbon) twisted about its own length. Painted by how each part of it faces the light.
  sheet(L, pt, u0, h0, o0, o, mid) {
    const S = pt.S, ns = pt.ns, nw = pt.nw, pos = this.bits.pos, colr = this.bits.col, Ls = this.lightS, tx = L.tx, tz = L.tz, nx = L.nx, nz = L.nz;
    if (o.len < 0.02) { this.collapse(pt); return; }
    let cu = u0, ch = h0; const ds = o.len / (ns - 1);
    for (let i = 0; i < ns; i++) {
      const s = i / (ns - 1), ang = o.th + o.kap * (o.pw ? Math.pow(s, o.pw) : s) + o.flut * s * Math.sin(7 * s - o.fs * o.time);
      if (i) { cu += Math.cos(ang) * ds; ch += Math.sin(ang) * ds; }
      const tu = Math.cos(ang), tv = Math.sin(ang);
      const ax = -Math.sin(ang), ah = Math.cos(ang), half = o.half(s) * Math.min(1, o.len / 0.25), sk = o.skew(s), tw = o.twist ? o.twist(s) : 0, ct = Math.cos(tw), stw = Math.sin(tw);
      for (let j = 0; j < nw; j++) {
        const w = nw === 1 ? 0 : j / (nw - 1) * 2 - 1, off = w * half + sk, q = (i * nw + j) * 3;
        const bo = o.belly * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.85)), 0.8) * (1 - w * w) + o.fold(s, w) * Math.min(1, o.len / 0.25) + o.flut * 0.05 * s * Math.sin(9 * s - o.fs * o.time + 2 * w);
        const sl = (o.slant * w + (o.hem ? o.hem / o.len * Math.cos(w * 4.7 + 0.6) * s * s : 0)) * s * o.len;      // (its end is cut on the slant: one corner flies higher; and the hem is scalloped by its folds)
        S[q] = cu + ax * off * ct + tu * sl; S[q + 1] = Math.max(0.02, ch + ah * off * ct + tv * sl); S[q + 2] = o0 + bo + off * stw;
      }
    }
    if (mid) { const q = (Math.floor(ns * 0.55) * nw + (nw >> 1)) * 3; mid[0] = S[q]; mid[1] = S[q + 1]; mid[2] = S[q + 2]; }
    for (let i = 0; i < ns; i++) for (let j = 0; j < nw; j++) {
      const q = (i * nw + j) * 3, a = ((i ? i - 1 : i) * nw + j) * 3, b = ((i < ns - 1 ? i + 1 : i) * nw + j) * 3, c = (i * nw + (j ? j - 1 : j)) * 3, d = (i * nw + (j < nw - 1 ? j + 1 : j)) * 3;
      const sx = S[b] - S[a], sy = S[b + 1] - S[a + 1], sz = S[b + 2] - S[a + 2], wx = S[d] - S[c], wy = S[d + 1] - S[c + 1], wz = S[d + 2] - S[c + 2];
      let n0 = sy * wz - sz * wy, n1 = sz * wx - sx * wz, n2 = sx * wy - sy * wx; const nl = Math.hypot(n0, n1, n2) || 1; n0 /= nl; n1 /= nl; n2 /= nl;
      if (n2 < 0) { n0 = -n0; n1 = -n1; n2 = -n2; }      // (the side towards the room)
      const s = i / (ns - 1), lit = clamp01(0.5 + o.gain * (n0 * Ls.x + n1 * Ls.y + n2 * Ls.z - 0.42) + 0.1 - 0.3 * (1 - n2)) * lerp(o.root, 1, Math.min(1, s * 3));
      const lo = lit < 0.5 ? o.lo : o.mid, hi = lit < 0.5 ? o.mid : o.hi, e = lit < 0.5 ? lit * 2 : (lit - 0.5) * 2, p = (pt.o + i * nw + j) * 3;
      colr[p] = lerp(lo.r, hi.r, e); colr[p + 1] = lerp(lo.g, hi.g, e); colr[p + 2] = lerp(lo.b, hi.b, e);
      pos[p] = L.cx + tx * S[q] + nx * S[q + 2]; pos[p + 1] = L.y + SURF + S[q + 1]; pos[p + 2] = L.cz + tz * S[q] + nz * S[q + 2];
    }
  },
});
