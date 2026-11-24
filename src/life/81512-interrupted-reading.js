// Jean Baptiste Camille Corot, Interrupted Reading (c. 1870), Gallery 224. The word: pause.
//
// A studio model in the Italian dress he kept for his sitters sits by a table under a red cloth, her head propped on her
// hand, a red book hanging shut from the other over her knee, and looks straight out of the picture. The museum's note
// says the image of a woman reading was a popular one, "but Corot chose to show his model pausing, looking up from this
// activity". So the title is about something the picture does not show: a moment ago she was reading. And whatever
// stopped her stands where we stand. No other picture here is about being looked at in quite this way, so that is the
// show: the reading the picture leaves out, and the look that ends it, which is yours.
//
// Look, and she is laid in under the picture as he built her, in masses, from the floor up (the museum: "the human form
// as a construction of masses that support and balance one another"): his strokes come down from under the frame,
// leaning as leaves do, and settle into the great ochre skirt with its deep folds, the red cloth of the table, the dark
// bodice, the white chemise, the arms, the head, the dark hair, and last the five touches of coral in it. She is
// reading: bent over the book where it lies open on the table, a leaf turned once. A piano plays, quietly, because
// reading has a voice only the reader hears: the opening of Chopin's Prelude in A major. Then, in the middle of its
// second phrase, the tune breaks off, on the short note before the one it was going to. She is quite still for a
// moment. Her head comes up and round to you; her hand draws the book off the table, shut on her finger, down over
// her knee; her other hand goes up to her temple and her head leans into it, her earrings still swinging: the picture,
// and the eye goes up to check it against the one on the wall. There she stays for as long as you look, in the
// silence, as she has since about 1870. When you stop looking she bends to the book again, and the tune takes up its
// phrase at the very note where it stopped. While the toy stays near she reads on and the prelude plays on to its end;
// drive up close and she looks up at the toy, and the music waits again; back off and she finds her place. Then her
// strokes lift off and go back in under the frame.
//
// The tune: Frédéric Chopin, Prelude in A major, Op. 28 No. 7 (Andantino; published in Paris in 1839, the French
// edition dedicated to Camille Pleyel), set down here from the Mutopia Project's edition of the score, all sixteen
// bars, the left hand thinned to its bass and two notes of each chord. It has no words and no programme; it is the
// shortest of the set, in the manner of a mazurka, and has been borrowed since for variations (Mompou; Noskowski) and
// a ballet (Les Sylphides), nothing that sits ill here. It is Paris piano music of the painter's own lifetime, chosen
// because each of its phrases ends on a held chord the ear waits for, so that a phrase cut short is heard as cut short.
//
// How it is made: one rig, one draw call, for every solid thing (each form a smooth body in his half tones with broad
// soft strokes lying on it; the strokes are flown in by the vertex shader), and one for the soft shadows on the floor.
// Her arms are worked out each frame (two bones each; her right elbow slides on the table top). Nothing is solid and
// nothing can be pushed. She sits 0.65 m high, half a metre out from the wall, under a picture whose foot is 1.2 m up
// and which has no neighbour within four metres: from none of the checks' cameras does anything of hers come in front
// of a canvas. With "Reduce motion and flashing" on, her strokes do not tumble as they come, she looks up and bends
// down again more slowly, her earrings barely swing, and the book and its leaf are quieter; nothing here flashes.
//
// What it does not do: it gives her no name, no thoughts and no reason for stopping (the museum gives none; the caption
// says only that she looks up for as long as you look), it puts no words on the page (a few grey touches for print) and
// no title on the book, it plays nothing Italian under the dress, because the dress is a studio costume and not a
// people, and its figure wears the chemise high on both shoulders and keeps her face to a few soft touches, because
// she was a working model and this is her picture, not her likeness.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { score, noise } from './stagecraft.js';

const TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- the tune, and where it breaks off
// Chopin, Prelude Op. 28 No. 7: eight two-bar phrases, each with its up-beat (a crotchet is 1).
const TOP = ['E4 | C#5:.75 D5:.25 B4 B4 | B4:2', 'F#5 | D#5:.75 E5:.25 A5 A5 | A5:2', 'C#5 | A#4:.75 B4:.25 D5 D5 | D5:2', 'G#4 | G#4:.75 A4:.25 C#5 C#5 | C#5:2',
  'E4 | C#5:.75 D5:.25 B4 B4 | B4:2', 'F#5 | D#5:.75 E5:.25 C#6 C#6 | C#6:2', 'C#5 | C#5:.75 D5:.25 F#5 F#5 | F#5:2', 'G#4 | B4:.75 A4:.25 A5 A5 | A5:2'].join(' ');
const MID = ['R | R G#4 G#4 | G#4:2', 'D5 | B#4:.75 C#5:.25 C#5 C#5 | C#5:2', 'E4 | C#4:.75 D4:.25 F#4 F#4 | F#4:2', 'D4 | D4:.75 C#4:.25 C#4 C#4 | C#4:2',
  'R | G#4 G#4 G#4 | G#4:2', 'D5 | B#4:.75 C#5:.25 A5 A5 | A#5:2', 'A#4 | A#4:.75 B4:.25 B4 A4 | G#4:2', 'D4 | D4:.75 C#4:.25 C#5 C#5 | C#5:2'].join(' ');
const LOW = ['R | R D4 D4 | D4:2', 'R | R:3 | R:2', 'R | R:3 | R:2', 'R | R:3 | R:2', 'R | R D4 D4 | D4:2', 'R | R:3 | E5:2', 'R | R:3 | R:2', 'R | R:3 | R:2'].join(' ');
const BASS = ['R | E2:3 | R:2', 'R | A2:3 | R:2', 'R | E2:3 | R:2', 'R | A1:3 | R:2', 'R | E2:3 | R:2', 'R | A2:3 | R:2', 'R | B1:3 | R:2', 'R | A1:3 | R:2'].join(' ');
const CH1 = ['R | R E3 E3 | E3:2', 'R | R A3 A3 | A3:2', 'R | R E3 E3 | E3:2', 'R | R E3 E3 | E3:2', 'R | R E3 E3 | E3:2', 'R | R A3 A3 | F#3:2', 'R | R F#3 F#3 | E3:2', 'R | R E3 A3 | A3:2'].join(' ');
const CH2 = ['R | R E4 E4 | E4:2', 'R | R E4 E4 | E4:2', 'R | R B3 B3 | B3:2', 'R | R A3 A3 | A3:2', 'R | R E4 E4 | E4:2', 'R | R E4 E4 | C#4:2', 'R | R D4 D4 | D4:2', 'R | R E4 E4 | E4:2'].join(' ');
const BPM = 84, BT = 60 / BPM, T_M0 = 0.2;                  // the first up-beat, in seconds of reading
const bar = k => T_M0 + BT + k * 3 * BT;                    // the downbeat of bar k (from 0)
const RB = bar(2) + 0.75 * BT + 0.085;                      // where the reading breaks off: just after the short note of the third bar
const T_END = T_M0 + 48 * BT + 2.5;                         // the prelude is over
const TURN0 = bar(1) - 0.45, TURN_D = 0.85, TURN_EVERY = 12 * BT;      // a leaf turned into the first held chord, and every two phrases after
const BUILT = 2.05, FLY = 0.5;                              // she is all there; one stroke's flight
const RISE = 1.6, FALL = 1.0;                              // looking up (to the picture's pose), and bending to the book again

// ---------------------------------------------------------------- the scene (metres: x along the wall to the right, y up, z out of the wall)
const SC = 1.25, U0 = 0.1, ZS = 0.04;                         // its size; its middle along the wall; how far its z = 0 lies inside the wall
const DIR = [-0.5, 0.866];                                  // the way her knees point: to the left, and out
const HIP = [0.06, 0.4];                                    // where she sits (x, z)
const WAIST = [0.055, 0.238, 0.405];
const BW = 0.062, BH = 0.092, BTH = 0.0105;                 // the book: a leaf's width, its height, half its thickness
const TABLE = { x: -0.29, z: 0.43, rx: 0.16, rz: 0.16, y: 0.272 };
const L1 = 0.128, L2 = 0.142;                               // upper arm; forearm to the middle of the hand
const NECK = [0, 0.158, 0.004], SH_R = [-0.078, 0.126, 0.004], SH_L = [0.078, 0.126, 0.004];
const TEMPLE = [-0.045, 0.052, 0.026];                      // where her hand meets her head (the head's own frame)
const EAR = [0.0345, 0.04, -0.002], HEAD_S = 1.12;         // (her head a little large, as a small figure's wants)
// reading (A) and the picture's pose (B): her body from the waist (yaw, pitch forward, roll to her right), her head on her neck
const TA = { yaw: -0.6, pitch: 0.24, roll: 0.26 }, TB = { yaw: -0.2, pitch: 0.09, roll: 0.4 };
const HA = { yaw: -0.4, pitch: 0.5, roll: 0.04 }, HB = { yaw: 0.22, pitch: -0.1, roll: 0.13 };
// the book: its spine's middle, and the way it lies (x across the leaves to her right, y up the page, z out of the open page)
const BOOK_A = { p: [-0.158, TABLE.y + BTH + 0.001, 0.5], x: [-0.42, 0, -0.9], y: [-0.9, 0, 0.42] };
const BOOK_B = { p: [-0.02, 0.2, 0.585], x: [-0.1, 0.3, 0.95], y: [0.826, 0.504, -0.252] };
const OPEN_A = 2.9, OPEN_B = 0.2;                           // the angle between its boards
const HAND_L_A = [-0.05, -0.03, 0.01], HAND_L_B = [0.0, BH / 2 + 0.006, 0.03];       // her left hand on the book (the book's frame)
const HAND_R_A = [0.036, 0.012, 0.012], HAND_R_TURN = [0.008, 0.012, 0.042];          // her right, at its edge; and turning a leaf

lifeFor(81512, {
  title: /^Interrupted Reading/,
  word: 'pause',
  // (a small work hung high: the kit keeps all of it in view, over the reader at the foot of the wall)
  stage: { out: 1.2, half: 0.9, cam: { dist: 2.3, height: 0.8, side: 0.2, fov: 58, lookU: 0.02, lookOut: 0.4, lookH: 0.9, floorOut: 0.85 } },
  wake: 2, ret: 2.4,
  linger: { near: 4, max: 34 },

  build(L) {
    const P = L.pal, col = (h, a = 0.14) => P.near(h, a), C = (list, a) => list.map(h => col(h, a));
    const WALL = L.wall, RAIL = (L.rail - L.y) / SC, XS = -U0 / SC;      // (XS: under the middle of the frame)
    this.O = L.floor(U0, -WALL - ZS);
    this.B = new THREE.Matrix4().makeBasis(V3(L.tx * SC, 0, L.tz * SC), V3(0, SC, 0), V3(L.nx * SC, 0, L.nz * SC)).setPosition(this.O);
    this.V = { m: new THREE.Matrix4(), l: new THREE.Matrix4(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), one: V3(1, 1, 1), up: V3(0, 1, 0),
      a: V3(), b: V3(), c: V3(), d: V3(), p1: V3(), p2: V3(), el: V3(), s: V3(), t: V3(), pos: V3(), w: V3(), z: V3(0, 0, 1) };
    this.M = {}; for (const n of ['torso', 'head', 'ru', 'rf', 'lu', 'lf', 'book', 'bkR', 'bkL', 'leaf', 'earR', 'earL']) this.M[n] = new THREE.Matrix4();
    const frame = (o, q) => { const x = V3(...o.x).normalize(), y = V3(...o.y); y.addScaledVector(x, -y.dot(x)).normalize(); return q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, V3().crossVectors(x, y))); };
    this.QA = frame(BOOK_A, new THREE.Quaternion()); this.QB = frame(BOOK_B, new THREE.Quaternion());
    this.PA = V3(...BOOK_A.p); this.PB = V3(...BOOK_B.p);
    this.IDLE = { scan: 0, nod: 0, turn: -1, gazeY: 0, gazeP: 0, breath: 0, sway: 0, earR: 0, earL: 0 };
    this.pose(0, this.IDLE);

    const R = () => L.rand();
    const KEY = V3(-0.5, 0.74, 0.45).normalize();           // his light: from the upper left, a little in front
    const pick = (list, r) => list[Math.min(list.length - 1, Math.floor(r * list.length))];
    const set = (hi, mid, lo, deep, a) => ({ hi: C(hi, a), mid: C(mid, a), lo: C(lo, a), deep: C(deep, a) });
    const SK = set(['#c8b486', '#c1ab7c', '#ccb98e'], ['#ae9b70', '#a69368', '#b2a076'], ['#8a7954', '#82714e', '#8e7e5c'], ['#655638', '#5c4e34']);       // the skirt
    const RD = set(['#8a4634', '#84402f'], ['#74372a', '#6e3226', '#7a3c2d'], ['#5a281b', '#522319'], ['#3c1a12', '#341610']);                             // the cloth, the book's boards
    const DK = set(['#52423a', '#4a3a33'], ['#392b25', '#33261f'], ['#261b16', '#221813'], ['#17100d']);                                                   // the bodice
    const WH = set(['#e6e0d2', '#dfd8c8', '#ebe6da'], ['#cbc3b3', '#c2baaa', '#cfc7b6'], ['#a0978a', '#989084', '#a59a88'], ['#7a7166', '#6f665c']);       // the chemise
    const FL = set(['#e2c2a2', '#dfbc9a'], ['#d4ae8c', '#cfa886', '#d2ac8a'], ['#be9676', '#b89070'], ['#a47e62', '#9c765c']);                             // her skin
    const HR = set(['#54402f', '#4a3729'], ['#36271d', '#30221a'], ['#231812', '#1f1510'], ['#150e0a']);                                                   // her hair
    const PG = set(['#efe6d0', '#e9dfc6'], ['#d9cdae', '#d2c5a6'], ['#b0a284', '#a89a7c'], ['#857860']);                                                   // the leaves
    const GD = set(['#e6c878', '#dcb860'], ['#c49a48', '#b88c3e'], ['#8e6a2e'], ['#644a22']);
    const CORAL = C(['#dc4c30', '#d04328', '#e25a3a'], 0.08), CORAL_HI = col('#f08a68', 0.05), CORAL_LO = col('#9c2c1c', 0.08);
    const BEAD = C(['#eeeae2', '#dcdcd6', '#f4f2ec'], 0.06), PINK = C(['#cc7068', '#b85c56'], 0.1), ROSE = col('#b0625a', 0.1), LASH = col('#4a352b', 0.12), BROW = col('#7a5a48', 0.12), SOCK = col('#a27a62', 0.12), CHEEK = col('#d89680', 0.08), FOLD = C(['#5e4f34', '#66573a', '#57492f']);
    // A stroke's colour from the way the form faces his light (lights, half tones, shade, dark), with a little of the luck
    // of the brush; and the solid under the strokes, the same four tones run smoothly into each other: Corot's forms are
    // soft, so most of the modelling is the body's and the strokes sit on it close in tone.
    const tone = (S, jit = 0.2) => (n, r) => { const k = n.dot(KEY) + (r - 0.5) * jit; return pick(k > 0.42 ? S.hi : k > 0.04 ? S.mid : k > -0.4 ? S.lo : S.deep, (r * 7.31) % 1); };
    const soft = (S, v = 0.14) => { const u = under(S), c = new THREE.Color(); return (n, r) => c.copy(u(n)).multiplyScalar(1 + (r - 0.5) * v).clone(); };
    const under = S => { const c = new THREE.Color(), sm = THREE.MathUtils.smoothstep; return n => { const k = n.dot(KEY); return c.copy(S.deep[0]).lerp(S.lo[0], sm(k, -0.75, -0.3)).lerp(S.mid[0], sm(k, -0.25, 0.2)).lerp(S.hi[1 % S.hi.length], sm(k, 0.25, 0.75)).multiplyScalar(0.98); }; };

    // ---------------------------------------------------------- parts: solids and the strokes on them
    // A part is one piece of the rig (it moves as one). Every vertex carries where its stroke begins (aCen) and how the
    // stroke comes (aFly: from where, relative to its place, and when), so the vertex shader can bring them down from
    // under the rail; a solid grows up from its foot instead.
    const part = rest => { rest = rest ? rest.clone() : new THREE.Matrix4(); return { pos: [], nor: [], col: [], cen: [], fly: [], rest, inv: rest.clone().invert(), n: 0 }; };
    const side = V3(), d2 = V3(), cl = V3(), src = V3(), wp = V3(), nW = V3(), ca = new THREE.Color(), cb = new THREE.Color();
    const vert = (Pt, p, n, c, cen, f) => { Pt.pos.push(p.x, p.y, p.z); Pt.nor.push(n.x, n.y, n.z); Pt.col.push(c.r, c.g, c.b); Pt.cen.push(cen.x, cen.y, cen.z); Pt.fly.push(f[0], f[1], f[2], f[3]); Pt.n++; };
    const world = (Pt, n) => nW.copy(n).transformDirection(Pt.rest);      // (a part's normal as it stands while she reads: his light is the room's)
    const solid = (Pt, g, base, t, paint = null) => {
      const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, v = V3(), nn = V3(), cc = new THREE.Color(), f = [0, 0, 0, t];
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); nn.fromBufferAttribute(n, i); if (paint) cc.copy(paint(world(Pt, nn), v, nn)); else cc.fromBufferAttribute(c, i); vert(Pt, v, nn, cc, base, f); }
    };
    // When a stroke at height y (in the scene) is laid: the low ones first, so each mass builds from its foot.
    const when = (t0, span, y) => t0 + Math.min(span, 0.26) * (0.62 * clamp01(y / 0.5) + 0.38 * R());
    // A ribbon of paint through six points lying on a form (Ps, with the form's normal at each, Ns), w wide: tapered,
    // lying close on the form the whole of its length, a lighter ridge down one edge.
    const ribbon = (Pt, Ps, Ns, w, c, t, { lift = 0.002, ridge = 0.07 } = {}) => {
      const prof = [0.5, 0.86, 1, 0.97, 0.8, 0.42], A = [], Bq = [], mid = Ps[2].clone().add(Ps[3]).multiplyScalar(0.5);
      for (let i = 0; i < 6; i++) {
        d2.copy(Ps[Math.min(5, i + 1)]).sub(Ps[Math.max(0, i - 1)]); side.crossVectors(Ns[i], d2); if (side.lengthSq() < 1e-14) return; side.normalize();
        cl.copy(Ps[i]).addScaledVector(Ns[i], lift * (1 + 0.4 * i / 5));
        A.push(cl.clone().addScaledVector(side, -w / 2 * prof[i])); Bq.push(cl.clone().addScaledVector(side, w / 2 * prof[i]));
      }
      ca.copy(c).multiplyScalar(1 + ridge); cb.copy(c).multiplyScalar(1 - ridge * 0.7);
      wp.copy(mid).applyMatrix4(Pt.rest);
      src.set(XS + Math.max(-0.2, Math.min(0.2, (wp.x - XS) * 0.45)) + (R() - 0.5) * 0.08, RAIL - 0.03 - R() * 0.04, ZS + 0.012 + R() * 0.02).applyMatrix4(Pt.inv);
      const f = [src.x - mid.x, src.y - mid.y, src.z - mid.z, t == null ? when(0.3, 0.4, wp.y) : t];
      for (let i = 0; i < 5; i++) { vert(Pt, A[i], Ns[i], cb, mid, f); vert(Pt, Bq[i + 1], Ns[i + 1], ca, mid, f); vert(Pt, Bq[i], Ns[i], ca, mid, f); vert(Pt, A[i], Ns[i], cb, mid, f); vert(Pt, A[i + 1], Ns[i + 1], cb, mid, f); vert(Pt, Bq[i + 1], Ns[i + 1], ca, mid, f); }
    };
    // One stroke on something flat (or a touch too small to need bending): at p (normal n), along dir, l long and w wide.
    const stroke = (Pt, p, n, dir, l, w, c, t, { bend = 0, lift = 0.002, ridge = 0.07 } = {}) => {
      side.crossVectors(n, dir); if (side.lengthSq() < 1e-8) return; side.normalize(); const dd = V3().crossVectors(side, n).normalize(), sd = side.clone(), Ps = [], Ns = [];
      for (let i = 0; i < 6; i++) { const s = i / 5 - 0.5; Ps.push(p.clone().addScaledVector(dd, s * l).addScaledVector(sd, bend * l * (1 - 4 * s * s))); Ns.push(n); }
      ribbon(Pt, Ps, Ns, w, c, t, { lift, ridge });
    };
    // The way a stroke runs on a surface: `flow` laid into the surface, turned a little.
    const q_ = new THREE.Quaternion();
    const along = (n, flow, jit) => { const d = flow.clone().addScaledVector(n, -flow.dot(n)); if (d.lengthSq() < 1e-4) d.set(n.y, -n.x, 0); if (d.lengthSq() < 1e-6) d.set(1, 0, 0); return d.normalize().applyQuaternion(q_.setFromAxisAngle(n, (R() - 0.5) * jit)); };
    const DOWN = V3(0, -1, 0), ACROSS = V3(1, 0, 0);
    const yOf = (Pt, p) => wp.copy(p).applyMatrix4(Pt.rest).y;
    // An ellipsoid (centre, radii, turned) as a soft solid, and a coat of n strokes over it.
    const ell = (Pt, Cn, Rd, S, t0, n, { rot = [0, 0, 0], l = [0.03, 0.05], w = [0.014, 0.022], flow = DOWN, jit = 0.6, keep = null, span = 0.2, tn = null, detail = 2, bare = false, grow = 1.0, paint = null, ridge = 0.07, lift = 0.002 } = {}) => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ')), c = V3(...Cn), tf = tn || tone(S);
      if (!bare) { const u = under(S); solid(Pt, shape.move(shape.ball(1, 0xffffff, detail), c.x, c.y, c.z, rot[0], rot[1], rot[2], Rd[0], Rd[1], Rd[2]), V3(c.x, c.y - Rd[1], c.z), t0 + 0.1, paint || (nn => u(nn))); }
      const Rm = (Rd[0] + Rd[1] + Rd[2]) / 3, qi = q.clone().invert();
      for (let i = 0; i < n; i++) {
        const yy = 1 - 2 * R(), ph = R() * TAU, s = Math.sqrt(Math.max(0, 1 - yy * yy)), u0 = V3(s * Math.cos(ph), yy, s * Math.sin(ph));
        const p = V3(u0.x * Rd[0] * grow, u0.y * Rd[1] * grow, u0.z * Rd[2] * grow).applyQuaternion(q).add(c), nn = V3(u0.x / Rd[0], u0.y / Rd[1], u0.z / Rd[2]).normalize().applyQuaternion(q);
        const r1 = R(), r2 = R(), r3 = R();
        if (keep && !keep(p, nn)) continue;
        // (the stroke is an arc on the ellipsoid, so it lies on it from end to end)
        const d = along(u0, flow.clone().applyQuaternion(qi), jit), len = lerp(l[0], l[1], r1), Ps = [], Ns = [];
        for (let k = 0; k < 6; k++) { const al = (k / 5 - 0.5) * len / Rm, u = u0.clone().multiplyScalar(Math.cos(al)).addScaledVector(d, Math.sin(al)); Ps.push(V3(u.x * Rd[0] * grow, u.y * Rd[1] * grow, u.z * Rd[2] * grow).applyQuaternion(q).add(c)); Ns.push(V3(u.x / Rd[0], u.y / Rd[1], u.z / Rd[2]).normalize().applyQuaternion(q)); }
        ribbon(Pt, Ps, Ns, lerp(w[0], w[1], r2), tf(world(Pt, nn).clone(), r3), when(t0, span, yOf(Pt, p)), { ridge, lift });
      }
    };
    // A soft limb from a to b, and strokes along it.
    const limb = (Pt, a, b, r0, r1, S, t0, n, { l = [0.03, 0.05], w = [0.012, 0.018], span = 0.2, ridge = 0.05 } = {}) => {
      const A = V3(...a), Bv = V3(...b), ax = Bv.clone().sub(A), len = ax.length(); ax.normalize();
      const e1 = V3().crossVectors(ax, Math.abs(ax.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0)).normalize(), e2 = V3().crossVectors(ax, e1), tf = soft(S, 0.1), u = under(S);
      { const g = shape.cyl(r0, r1, len, 16, 0xffffff); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), ax)); const m = A.clone().add(Bv).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); solid(Pt, g, A, t0 + 0.1, nn => u(nn)); for (const [e, r] of [[A, r0], [Bv, r1]]) solid(Pt, shape.move(shape.ball(r, 0xffffff, 2), e.x, e.y, e.z), A, t0 + 0.1, nn => u(nn)); }
      for (let i = 0; i < n; i++) {
        const t = 0.1 + 0.8 * R(), ph = R() * TAU, nn = e1.clone().multiplyScalar(Math.cos(ph)).addScaledVector(e2, Math.sin(ph)), r = lerp(r0, r1, t);
        const p = A.clone().addScaledVector(ax, t * len).addScaledVector(nn, r), nw = world(Pt, nn).clone();
        stroke(Pt, p, nn, along(nn, ax, 0.4), Math.min(len * 0.8, lerp(l[0], l[1], R())), lerp(w[0], w[1], R()), tf(nw, R()), when(t0, span, yOf(Pt, p)), { bend: (R() - 0.5) * 0.1, ridge });
      }
    };
    // A lofted form: rings from the floor up ({ y, c: [x, z], r1, r2 }), r1 along `ax` and r2 across it, round (pow 2)
    // or square-shouldered (pow 4), fluted if asked; smooth all over. Returns how to find a point and its normal on it.
    const loft = (Pt, rings, S, t0, { ax = [1, 0], pow = 2, flute = null, seg = 32, rows = 12, cap = false } = {}) => {
      const m = rings.length - 1;
      const cr = (get, v) => { const x = clamp01(v) * m, i = Math.min(m - 1, Math.floor(x)), f = x - i, g = j => get(rings[Math.max(0, Math.min(m, j))]), p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); return 0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f); };
      const at = (v, th, out = V3()) => {
        const cs = Math.cos(th), sn = Math.sin(th), e = 2 / pow, k = flute ? flute(v, th) : 1;
        const a = Math.sign(cs) * Math.pow(Math.abs(cs), e) * cr(r => r.r1, v) * k, b = Math.sign(sn) * Math.pow(Math.abs(sn), e) * cr(r => r.r2, v) * k;
        return out.set(cr(r => r.c[0], v) + ax[0] * a - ax[1] * b, cr(r => r.y, v), cr(r => r.c[1], v) + ax[1] * a + ax[0] * b);
      };
      const pa = V3(), pb = V3(), pc = V3(), pd = V3();
      const normal = (v, th, out = V3()) => { at(v, th + 0.02, pa); at(v, th - 0.02, pb); at(Math.min(1, v + 0.02), th, pc); at(Math.max(0, v - 0.02), th, pd); out.crossVectors(pa.sub(pb), pc.sub(pd)).normalize(); at(v, th, pa); pb.set(cr(r => r.c[0], v), pa.y, cr(r => r.c[1], v)); if (out.dot(pa.sub(pb)) < 0) out.negate(); return out; };
      const pos = [], idx = [], N = rows + 1;
      for (let j = 0; j < N; j++) for (let i = 0; i < seg; i++) { at(j / rows, i / seg * TAU, pa); pos.push(pa.x, pa.y, pa.z); }
      for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) { const a = j * seg + i, b = j * seg + (i + 1) % seg, c = a + seg, d = b + seg; idx.push(a, c, b, b, c, d); }
      if (cap) { const top = rings[m], k = pos.length / 3; pos.push(top.c[0], top.y, top.c[1]); for (let i = 0; i < seg; i++) idx.push(rows * seg + i, k, rows * seg + (i + 1) % seg); }
      let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      { const n = g.attributes.normal; pa.fromBufferAttribute(g.attributes.position, 0); pb.set(rings[0].c[0], pa.y, rings[0].c[1]); if (pc.fromBufferAttribute(n, 0).dot(pa.sub(pb)) < 0) { g.setIndex(idx.map((_, i) => idx[i - i % 3 + [0, 2, 1][i % 3]])); g.computeVertexNormals(); } }
      g = g.toNonIndexed();
      const u = under(S); solid(Pt, g, V3(rings[0].c[0], 0, rings[0].c[1]), t0 + 0.06, nn => u(nn));
      // a stroke lying on it: from (v - dv / 2) to (v + dv / 2) up the form, drifting dth round it
      const lay = (v, th, dv, dth, w, c, t, o) => { const Ps = [], Ns = []; for (let k = 0; k < 6; k++) { const s = k / 5 - 0.5; Ps.push(at(v - s * dv, th + s * dth)); Ns.push(normal(v - s * dv, th + s * dth)); } ribbon(Pt, Ps, Ns, w, c, t == null ? when(t0, 0.3, Ps[2].y) : t, o); };
      return { at, normal, lay };
    };

    const BIG = { l: [0.045, 0.075], w: [0.018, 0.028] }, MED = { l: [0.03, 0.05], w: [0.013, 0.02] }, SML = { l: [0.014, 0.022], w: [0.008, 0.012] };
    const M = this.M;

    // ---------------------------------------------------------- the table, under its red cloth
    const TT = 0.1, table = part();
    {
      const T = TABLE, ring = (y, k) => ({ y, c: [T.x, T.z], r1: T.rx * k, r2: T.rz * k });
      const fl = (v, th) => 1 + 0.035 * (1 - v) * (1 - v) * (Math.sin(th * 5 + 0.7) + 0.6 * Math.sin(th * 9 + 2.2));
      const S = loft(table, [ring(0, 1.035), ring(0.07, 1.03), ring(0.17, 1.012), ring(T.y - 0.04, 1.0), ring(T.y - 0.008, 0.985), ring(T.y, 0.93)], RD, TT, { pow: 5, flute: fl, seg: 44, rows: 10, cap: true });
      const tf = soft(RD, 0.22), n = V3(), p = V3();
      for (let i = 0; i < 44; i++) {      // the cloth hanging: long soft drags down its sides
        const dv = lerp(0.26, 0.42, R()), v = lerp(0.04 + dv / 2, 0.8 - dv / 2, R()), th = R() * TAU; S.normal(v, th, n);
        S.lay(v, th, dv, (R() - 0.5) * 0.06, lerp(0.03, 0.05, R()), tf(n, R()), null, { ridge: 0.08 });
      }
      for (let i = 0; i < 12; i++) {      // its top, level
        p.set(T.x + (R() - 0.5) * 1.0 * T.rx, T.y, T.z + (R() - 0.5) * 1.0 * T.rz);
        stroke(table, p.clone(), V3(0, 1, 0), along(V3(0, 1, 0), ACROSS, 0.5), lerp(0.04, 0.06, R()), lerp(0.02, 0.03, R()), tf(V3(0, 1, 0), R()), when(TT + 0.1, 0.2, p.y), {});
      }
    }

    // ---------------------------------------------------------- the skirt: one great mass, deep folds falling from her knees
    const TS = 0.06, skirt = part();
    {
      const ring = (y, s, r1, r2) => ({ y, c: [HIP[0] + DIR[0] * s, HIP[1] + DIR[1] * s], r1, r2 });
      const F = th => 0.6 * Math.sin(th * 6 + 1.1) + 0.4 * Math.sin(th * 10 + 4.0);
      const fl = (v, th) => 1 + 0.085 * Math.pow(1 - v, 1.4) * F(th);
      const S = loft(skirt, [ring(0, 0.05, 0.205, 0.225), ring(0.05, 0.052, 0.196, 0.212), ring(0.12, 0.056, 0.182, 0.19), ring(0.185, 0.06, 0.16, 0.152), ring(0.22, 0.05, 0.126, 0.112), ring(0.238, 0.01, 0.074, 0.072), ring(0.25, -0.004, 0.058, 0.058)], SK, TS, { ax: DIR, flute: fl, seg: 56, rows: 14 });
      const tf = soft(SK, 0.26), n = V3();
      for (let i = 0; i < 96; i++) {       // broad dry drags of ochre, running down the folds
        const dv = lerp(0.22, 0.42, R()), v = lerp(0.03 + dv / 2, 0.82 - dv / 2, Math.pow(R(), 1.1)), th = R() * TAU; S.normal(v, th, n);
        S.lay(v, th, dv, (R() - 0.5) * 0.07, lerp(0.034, 0.058, R()) * (1 - 0.35 * v), tf(n, R()), null, { ridge: 0.1 });
      }
      for (let i = 0; i < 14; i++) {       // and over her lap, short, from the gathers at her waist
        const v = 0.84 + 0.08 * R(), th = R() * TAU; S.normal(v, th, n);
        S.lay(v, th, 0.14, (R() - 0.5) * 0.2, lerp(0.02, 0.03, R()), tf(n, R()), null, { ridge: 0.06 });
      }
      for (let i = 0; i < 60; i++) {       // the dark of each fold drawn in, as he draws it, and a light down the ridge beside it
        const th = i / 60 * TAU, f0 = F(th), valley = f0 < F(th - 0.1) && f0 <= F(th + 0.1) && f0 < -0.2, crest = f0 > F(th - 0.1) && f0 >= F(th + 0.1) && f0 > 0.3;
        if (!valley && !crest) continue;
        for (const v of valley ? [0.16, 0.42] : [0.2]) {
          S.normal(v, th, n); if (crest && n.dot(KEY) < 0.1) continue;
          S.lay(v, th, valley ? 0.26 : 0.3, 0, valley ? 0.0062 : 0.012, valley ? pick(FOLD, R()) : pick(SK.hi, R()), TS + 0.3 + 0.2 * R(), { lift: valley ? 0.0024 : 0.004, ridge: 0.03 });
        }
      }
    }

    // ---------------------------------------------------------- her body, from the waist
    const TB_ = 0.5, torso = part(M.torso);
    ell(torso, [0, 0.028, 0], [0.066, 0.05, 0.052], DK, TB_, 16, { ...MED, flow: ACROSS, tn: soft(DK, 0.3), detail: 4 });                              // the dark bodice
    for (let i = 0; i < 4; i++) { const a = 0.5 + i * 0.36, nn = V3(Math.sin(a), 0, Math.cos(a)); stroke(torso, V3(nn.x * 0.066, 0.012 + 0.004 * i, nn.z * 0.052), nn, V3(nn.z, 0.1, -nn.x).normalize(), 0.04, 0.013, pick(RD.mid, R()), TB_ + 0.2, { lift: 0.004 }); }      // the red at her waist
    ell(torso, [0, 0.088, 0.002], [0.073, 0.056, 0.055], WH, TB_ + 0.12, 26, { l: [0.034, 0.056], w: [0.018, 0.028], flow: V3(0.2, -1, 0), tn: soft(WH, 0.16), ridge: 0.1, detail: 4 });
    ell(torso, [0, 0.088, 0.002], [0.073, 0.056, 0.055], WH, TB_ + 0.3, 30, { l: [0.03, 0.046], w: [0.014, 0.02], flow: V3(0.3, -1, 0), bare: true, keep: (p, n) => world(torso, n).dot(KEY) > 0.45, tn: (n, r) => pick(WH.hi, r).clone().multiplyScalar(1.05), ridge: 0.14, lift: 0.003 });      // and the lights loaded on   // the chemise: fat whites
    ell(torso, [0, 0.126, 0], [0.09, 0.027, 0.046], WH, TB_ + 0.16, 16, { l: [0.03, 0.05], w: [0.012, 0.018], flow: ACROSS, jit: 0.3, tn: soft(WH, 0.12), ridge: 0.1, detail: 4 });                 // across her shoulders
    ell(torso, [0, 0.146, 0.008], [0.034, 0.02, 0.034], FL, TB_ + 0.2, 3, { ...SML, keep: (p, n) => n.z > 0.2 });               // her throat
    for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {      // the necklace: coral and glass, two strands
      const a = (i - 4) * 0.36 + row * 0.18, r = 0.033 + row * 0.004, nn = V3(Math.sin(a), 0.55, Math.cos(a)).normalize(), p = V3(Math.sin(a) * r, 0.153 - row * 0.008 - 0.011 * Math.cos(a) * Math.cos(a), 0.008 + Math.cos(a) * r);
      stroke(torso, p, nn, V3(Math.cos(a), 0, -Math.sin(a)), 0.0085, 0.0068, (i + row) % 2 ? pick(CORAL, R()) : pick(BEAD, R()), 1.12 + 0.02 * i + 0.1 * row, { lift: 0.004, ridge: 0.14 });
    }
    for (let i = 0; i < 2; i++) stroke(torso, V3(0.07 + 0.012 * i, 0.142 - 0.016 * i, -0.024 - 0.006 * i), V3(0.5, 0.5, -0.7).normalize(), V3(0.5, -0.8, -0.2).normalize(), 0.034, 0.011, PINK[i], 1.15, { lift: 0.005 });      // the ribbon on her shoulder

    // ---------------------------------------------------------- her head: the face a few soft touches, the hair dark, the coral in it
    const TH_ = 0.88, head = part(M.head);
    limb(head, [0, -0.016, 0], [0, 0.022, 0.002], 0.0165, 0.0155, { hi: FL.mid, mid: FL.mid, lo: FL.lo, deep: FL.deep }, TH_, 0);
    {
      const uF = under(FL), uH = under(HR), c = new THREE.Color();
      // (one head: skin where the face is, her dark hair over the rest and piled above it, the line between them broken
      // by the strokes laid on it; the features are a few soft touches, close in tone, as a small figure of his has them)
      const SKc = [0, 0.058, 0.004], SKr = [0.0335, 0.041, 0.036], HRc = [0, 0.073, -0.008], HRr = [0.039, 0.038, 0.041];
      const hairy = n => n.y > 0.52 - 0.3 * n.z || n.z < -0.05 || (Math.abs(n.x) > 0.82 && n.y > -0.25 && n.z < 0.35);
      const gz = (n, x, y, z, r) => { const k = 1 / Math.hypot(x, y, z), dx = n.x - x * k, dy = n.y - y * k, dz = n.z - z * k; return Math.exp(-(dx * dx + dy * dy + dz * dz) / (r * r)); };
      const face = (nw, v, nn) => {
        if (hairy(nn)) return c.copy(uH(nw));
        c.copy(uF(nw));
        for (const sx of [-1, 1]) c.lerp(SOCK, 0.55 * gz(nn, sx * 0.4, 0.17, 0.9, 0.13)).lerp(CHEEK, 0.2 * gz(nn, sx * 0.56, -0.24, 0.8, 0.2));
        c.lerp(SOCK, 0.25 * gz(nn, 0.22, -0.1, 0.96, 0.09));      // (the shade her nose throws, away from his light)
        return c.lerp(SOCK, 0.35 * gz(nn, 0, -0.3, 0.95, 0.08)).lerp(SOCK, 0.25 * gz(nn, 0, -0.68, 0.72, 0.12));
      };
      ell(head, SKc, SKr, FL, TH_ + 0.04, 0, { detail: 7, paint: face });
      ell(head, HRc, HRr, HR, TH_ + 0.1, 46, { l: [0.018, 0.03], w: [0.009, 0.014], grow: 1.02, keep: (p, n) => p.z < 0.012 || p.y > 0.09, flow: V3(0.3, -0.5, -0.8), jit: 1.2 });
      ell(head, [0, 0.102, -0.024], [0.027, 0.02, 0.025], HR, TH_ + 0.16, 14, { l: [0.014, 0.022], w: [0.008, 0.012], detail: 1, flow: ACROSS, jit: 1.5 });       // her hair put up behind
      ell(head, [0, 0.0478, 0.0364], [0.0036, 0.007, 0.0042], FL, TH_ + 0.1, 0, { detail: 2 });                                                                      // her nose
      const on = (nx, ny, nz) => { const n = V3(nx, ny, nz).normalize(); return [V3(SKc[0] + n.x * SKr[0], SKc[1] + n.y * SKr[1], SKc[2] + n.z * SKr[2]), n]; };
      for (let i = 1; i < 6; i += 2) { const [p, n] = on((i - 2.5) * 0.2, 0.62, 0.74); stroke(head, p, n, V3(0.25 * (i - 2.5), -1, 0).normalize(), 0.013 + 0.004 * R(), 0.006, pick(HR.mid, R()), TH_ + 0.3, { lift: 0.002, bend: (R() - 0.5) * 0.3 }); }      // loose hair on her brow
      for (const sx of [-1, 1]) {
        let [p, n] = on(sx * 0.4, 0.11, 0.9); stroke(head, p, n, V3(1, -0.06 * sx, 0), 0.0068, 0.0038, LASH, TH_ + 0.3, { lift: 0.0012, ridge: 0 });                        // her eyes, dark
        [p, n] = on(sx * 0.42, 0.31, 0.86); stroke(head, p, n, V3(1, -0.2 * sx, 0), 0.012, 0.0028, BROW, TH_ + 0.3, { lift: 0.0014, ridge: 0 });                       // her brows
      }
      { const [p, n] = on(0, -0.5, 0.86); stroke(head, p, n, V3(1, 0, 0), 0.009, 0.0042, ROSE, TH_ + 0.32, { lift: 0.0012, ridge: 0 }); }                             // her mouth
      const onHair = (n, g) => V3(HRc[0] + n.x * HRr[0] * g, HRc[1] + n.y * HRr[1] * g, HRc[2] + n.z * HRr[2] * g);
      for (let i = 0; i < 8; i++) {        // the gold band over her hair
        const a = (i - 3.5) * 0.3, n = V3(Math.sin(a), Math.cos(a) * 0.86, 0.5 * Math.cos(a) + 0.08).normalize();
        stroke(head, onHair(n, 1.05), n, V3(Math.cos(a), -Math.sin(a) * 0.86, -0.5 * Math.sin(a)).normalize(), 0.014, 0.0052, pick(n.dot(KEY) > 0.3 ? GD.hi : GD.mid, R()), 1.12 + 0.015 * i, { lift: 0.002, ridge: 0.16 });
      }
      for (let i = 0; i < 5; i++) {        // five beads of coral, her right side, laid in last, one at a time
        const a = 0.1 + i * 0.2, n = V3(-Math.sin(a) * 0.95, Math.cos(a), 0.5 - 0.03 * i).normalize(), p = onHair(n, 1.07), t = 1.2 + 0.085 * i;
        const cc = pick(CORAL, R()), c2 = new THREE.Color();
        solid(head, shape.move(shape.ball(0.0047, 0xffffff, 2), p.x, p.y, p.z), p.clone().addScaledVector(n, -0.005), t, nw => c2.copy(CORAL_LO).lerp(cc, THREE.MathUtils.smoothstep(nw.dot(KEY), -0.7, 0.1)).lerp(CORAL_HI, THREE.MathUtils.smoothstep(nw.dot(KEY), 0.5, 1)));
      }
    }
    // her earrings: a drop of gold each, on a wire
    const drop = sx => { const Pt = part(sx < 0 ? M.earR : M.earL); limb(Pt, [0, 0, 0], [0, -0.011, 0], 0.0011, 0.0011, GD, 1.2, 0); ell(Pt, [0, -0.0165, 0], [0.0034, 0.007, 0.0034], GD, 1.2, 0, { detail: 2 }); return Pt; };
    const earR = drop(-1), earL = drop(1);

    // ---------------------------------------------------------- her arms (each bone runs along its own +y), bare to the short sleeve
    const TA_ = 0.72;
    const upper = rest => { const Pt = part(rest); limb(Pt, [0, -0.002, 0], [0, L1 + 0.002, 0], 0.0215, 0.0185, FL, TA_, 4, { ...MED, ridge: 0.03 }); ell(Pt, [0, 0.014, 0], [0.027, 0.03, 0.027], WH, TA_, 9, { l: [0.02, 0.034], w: [0.012, 0.018], tn: soft(WH, 0.12), ridge: 0.1, detail: 3 }); return Pt; };
    const fore = rest => { const Pt = part(rest); limb(Pt, [0, 0, 0], [0, L2 - 0.02, 0], 0.0185, 0.0125, FL, TA_ + 0.05, 4, { ...MED, ridge: 0.03 }); ell(Pt, [0, L2 - 0.002, 0], [0.0125, 0.021, 0.0105], FL, TA_ + 0.08, 2, { ...SML, detail: 2, ridge: 0.03 }); return Pt; };
    const ru = upper(M.ru), rf = fore(M.rf), lu = upper(M.lu), lf = fore(M.lf);

    // ---------------------------------------------------------- the book: two boards hinged at the spine, the leaves between; one leaf to turn
    const TK = 0.8;
    const board = (rest, sx) => {
      const Pt = part(rest), uR = under(RD), uP = under(PG), c = new THREE.Color();
      const b = shape.box(BW, BH, 0.003, 0xffffff); b.translate(sx * BW / 2, 0, -BTH + 0.0015); solid(Pt, b, V3(0, -BH / 2, -BTH), TK, nw => uR(nw));
      const g = shape.box(BW - 0.005, BH - 0.007, BTH - 0.003, 0xffffff); g.translate(sx * (BW - 0.005) / 2, 0, -(BTH - 0.003) / 2); solid(Pt, g, V3(0, -BH / 2, -BTH), TK + 0.04, nw => c.copy(uP(nw)));
      for (let i = 0; i < 3; i++) stroke(Pt, V3(sx * BW * (0.24 + 0.26 * i), (R() - 0.5) * 0.02, -BTH), V3(0, 0, -1), V3(0.12 * (R() - 0.5), 1, 0).normalize(), 0.07, 0.019, pick(i === 1 ? RD.hi : RD.mid, R()), TK + 0.08 + 0.03 * i, { lift: 0.0012, ridge: 0.08 });
      for (let i = 0; i < 2; i++) stroke(Pt, V3(sx * BW * (0.3 + 0.36 * i), (R() - 0.5) * 0.016, 0), V3(0, 0, 1), V3(0.1 * (R() - 0.5), 1, 0).normalize(), 0.066, 0.022, pick(PG.hi, R()), TK + 0.12, { lift: 0.001, ridge: 0.04 });
      for (let j = 0; j < 5; j++) stroke(Pt, V3(sx * BW * 0.5, (j - 2) * 0.015 + 0.002, 0), V3(0, 0, 1), V3(1, 0.04 * (R() - 0.5), 0).normalize(), 0.036 + 0.006 * R(), 0.0034, PG.lo[j % 2], TK + 0.2, { lift: 0.0016, ridge: 0 });      // print: grey touches, no words
      return Pt;
    };
    const bkR = board(M.bkR, 1), bkL = board(M.bkL, -1), leaf = part(M.leaf);
    { const g = shape.box(BW - 0.007, BH - 0.009, 0.0009, 0xffffff); g.translate((BW - 0.007) / 2, 0, 0.0012); const uP = under(PG), c = new THREE.Color(); solid(leaf, g, V3(0, 0, 0), TK + 0.1, nw => c.copy(uP(nw)).multiplyScalar(1.04)); }

    // ---------------------------------------------------------- the rig: every solid thing, one draw call
    const parts = this.parts = { table, skirt, torso, head, earR, earL, ru, rf, lu, lf, bkR, bkL, leaf };
    let total = 0; for (const p of Object.values(parts)) total += p.n;
    const ru_ = this.ru = { uT: { value: 0 }, uTumble: { value: 1 } };
    const rm = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xa4a4a4, roughness: 0.92, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.44, side: THREE.DoubleSide });
    rm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, ru_);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aCen; attribute vec4 aFly; uniform float uT, uTumble;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  {
    // a stroke: let down from under the rail to its place, slowly at the last, turning as it comes and growing from
    // the end the brush set down; a solid (no flight) grows up from its foot
    vec3 rel = transformed - aCen;
    float k = clamp((uT - aFly.w) / ${FLY.toFixed(2)}, 0.0, 1.0), fl = step(1.0e-6, dot(aFly.xyz, aFly.xyz));
    float eh = k * k * (3.0 - 2.0 * k), ev = 1.0 - (1.0 - k) * (1.0 - k);
    float s = k <= 0.0 ? 0.0 : mix(1.0 - (1.0 - k) * (1.0 - k), 0.3 + 0.7 * k * k, fl);
    float sg = fract(aFly.w * 37.7) > 0.5 ? 1.0 : -1.0;
    float a = (1.0 - k) * (1.0 - k) * 2.6 * uTumble * fl * sg, cs = cos(a), sn = sin(a);
    rel = vec3(cs * rel.x - sn * rel.z, rel.y, sn * rel.x + cs * rel.z);
    // (and it comes down leaning, as a leaf does, and rights itself as it lands)
    float b = (1.0 - k) * (0.8 + 1.3 * uTumble) * fl * sg * (0.5 + fract(aFly.w * 91.3)), cb = cos(b), sb = sin(b);
    rel = vec3(cb * rel.x - sb * rel.y, sb * rel.x + cb * rel.y, rel.z);
    transformed = aCen + rel * s + aFly.xyz * vec3(1.0 - eh, 1.0 - ev, 1.0 - eh) + vec3(0.03 * sg * sin(3.1416 * k) * fl * uTumble, 0.0, 0.0);
  }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;');
    };
    rm.customProgramCacheKey = () => 'corot-reader';
    const rig = this.rig = L.rig(14, total + 64, rm);
    this.I = {};
    for (const [name, p] of Object.entries(parts)) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(p.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(p.col, 3));
      g.setAttribute('aCen', new THREE.Float32BufferAttribute(p.cen, 3)); g.setAttribute('aFly', new THREE.Float32BufferAttribute(p.fly, 4));
      this.I[name] = rig.add(rig.geo(g)); rig.mat(this.I[name], this.V.m.multiplyMatrices(this.B, p.rest));
      p.pos = p.nor = p.col = p.cen = p.fly = null;
    }
    this.parts = null;

    this.shade = L.blobs(3, { fade: true });
    this.band = this.makeScore(L);
    this.reset(L);
  },

  // ---------------------------------------------------------------- the music
  makeScore(L) {
    const s = score(L);
    const lead = { type: 'triangle', vol: 0.03, over: 2, overVol: 0.16, attack: 0.006, legato: 1.7 }, inner = { type: 'triangle', vol: 0.012, attack: 0.008, legato: 1.6 };
    const low = { type: 'triangle', vol: 0.02, attack: 0.012, legato: 1.0, over: 2, overVol: 0.3 }, ch = { type: 'sine', vol: 0.012, attack: 0.01, legato: 1.5 };
    s.tune(TOP, T_M0, BPM, lead); s.tune(MID, T_M0, BPM, inner); s.tune(LOW, T_M0, BPM, inner);
    s.tune(BASS, T_M0, BPM, low); s.tune(CH1, T_M0, BPM, ch); s.tune(CH2, T_M0, BPM, ch);
    s.hit(0.08, { d: 1.6, vol: 0.008, lp: 1700, hp: 300, attack: 0.5 });      // the brush, laying her in
    return s.done();
  },

  // ---------------------------------------------------------------- her pose
  // A two-bone arm from shoulder S to hand T (scene metres): the elbow towards `pole`, or, if yE is given, at that
  // height (resting on the table), on the pole's side. Fills the two bones' matrices (each runs along its own +y).
  arm(S, T, pole, yE, M1, M2) {
    const V = this.V, d = V.d.copy(T).sub(S), len = d.length(), dist = Math.max(L2 - L1 + 0.01, Math.min(L1 + L2 - 0.003, len)); d.multiplyScalar(1 / Math.max(1e-5, len));
    const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const p1 = V.p1.copy(pole).addScaledVector(d, -pole.dot(d)).normalize(), p2 = V.p2.crossVectors(d, p1);
    let phi = 0;
    if (yE != null && h > 1e-4) {
      const cy = S.y + d.y * a, A = p1.y, B = p2.y, r = Math.hypot(A, B);
      if (r > 1e-5) { const q = Math.acos(Math.max(-1, Math.min(1, (yE - cy) / (h * r)))), base = Math.atan2(B, A), w = x => Math.abs(Math.atan2(Math.sin(x), Math.cos(x))); phi = w(base + q) < w(base - q) ? base + q : base - q; }
    }
    const E = V.el.copy(S).addScaledVector(d, a).addScaledVector(p1, h * Math.cos(phi)).addScaledVector(p2, h * Math.sin(phi)), tip = V.t.copy(S).addScaledVector(d, dist);
    M1.compose(S, V.q.setFromUnitVectors(V.up, V.p1.copy(E).sub(S).normalize()), V.one);
    M2.compose(E, V.q.setFromUnitVectors(V.up, V.p1.copy(tip).sub(E).normalize()), V.one);
  },

  // Everything of hers that moves, for u (0: reading; 1: the picture's pose) and the small things in o: into this.M.
  pose(u, o) {
    const V = this.V, M = this.M;
    const kHead = ease.inOut(ramp(u, 0.15, 0.62)), kBook = ease.inOut(ramp(u, 0.24, 0.8)), kHand = ease.inOut(ramp(u, 0.36, 0.95)), kLean = ease.inOut(ramp(u, 0.18, 1));
    const eul = (m, x, y, z, yaw, pitch, roll) => m.compose(V.pos.set(x, y, z), V.q.setFromEuler(V.e.set(pitch, yaw, roll, 'YXZ')), V.one);
    // her body, from the waist: over the book; and leaning on her arm
    eul(M.torso, WAIST[0], WAIST[1], WAIST[2], lerp(TA.yaw, TB.yaw, kLean), lerp(TA.pitch, TB.pitch, kLean) + 0.012 * o.breath, lerp(TA.roll, TB.roll, kLean) + 0.006 * o.sway);
    // her head: bent to the page, going along the lines; or up, and leant on her hand, turned to whoever it is
    eul(V.l, NECK[0], NECK[1], NECK[2], lerp(HA.yaw + o.scan, HB.yaw + o.gazeY, kHead), lerp(HA.pitch + o.nod, HB.pitch + o.gazeP, kHead), lerp(HA.roll, HB.roll + 0.02 * o.sway, kHead));
    M.head.multiplyMatrices(M.torso, V.l).scale(V.c.setScalar(HEAD_S));
    // the book: held up open; or shut, hanging over her knee
    const arc = Math.sin(Math.PI * kBook);
    V.pos.lerpVectors(this.PA, this.PB, kBook); V.pos.y += 0.05 * arc + 0.002 * o.sway * kBook; V.pos.z += 0.035 * arc;
    M.book.compose(V.pos, V.q.copy(this.QA).slerp(this.QB, kBook), V.one);
    const open = lerp(OPEN_A, OPEN_B, ease.inOut(ramp(u, 0.24, 0.56))), phi = (Math.PI - open) / 2;
    M.bkR.multiplyMatrices(M.book, V.l.makeRotationY(-phi)); M.bkL.multiplyMatrices(M.book, V.l.makeRotationY(phi));
    const tk = o.turn < 0 ? 0 : ease.inOut(o.turn);
    M.leaf.multiplyMatrices(M.book, V.l.makeRotationY(-lerp(phi + 0.03, Math.PI - phi - 0.03, tk)));
    // her left hand under the book (on its end, when it is shut); her right at its edge, turning a leaf, or up at her temple
    const hl = V.a.set(lerp(HAND_L_A[0], HAND_L_B[0], kBook), lerp(HAND_L_A[1], HAND_L_B[1], kBook), lerp(HAND_L_A[2], HAND_L_B[2], kBook)).applyMatrix4(M.book);
    this.arm(V.s.set(...SH_L).applyMatrix4(M.torso), hl, V.w.set(0.6, -0.72, -0.34), null, M.lu, M.lf);
    const reach = o.turn < 0 ? 0 : Math.sin(Math.PI * clamp01(o.turn * 1.15));
    const hr = V.a.set(lerp(HAND_R_A[0], HAND_R_TURN[0], reach), lerp(HAND_R_A[1], HAND_R_TURN[1], reach), lerp(HAND_R_A[2], HAND_R_TURN[2], reach)).applyMatrix4(M.book);
    const temple = V.b.set(...TEMPLE).applyMatrix4(M.head), lift = Math.sin(Math.PI * kHand);
    hr.lerp(temple, kHand); hr.x -= 0.03 * lift; hr.z += 0.03 * lift;
    this.arm(V.s.set(...SH_R).applyMatrix4(M.torso), hr, V.w.set(-0.8, -0.5, 0.25), TABLE.y + 0.017, M.ru, M.rf);
    // her earrings hang plumb, and swing
    V.pos.set(-EAR[0], EAR[1], EAR[2]).applyMatrix4(M.head); M.earR.compose(V.pos, V.q.setFromAxisAngle(V.z, o.earR), V.one);
    V.pos.set(EAR[0], EAR[1], EAR[2]).applyMatrix4(M.head); M.earL.compose(V.pos, V.q.setFromAxisAngle(V.z, o.earL), V.one);
  },

  hide() { if (!this.rig) return; this.rig.mesh.visible = false; this.shade.visible = false; },
  start(L, resumed) {
    if (resumed) { this.fresh = false; this.t1 = L.t + 1.2; return; }
    this.fresh = true; this.broke = false; this.rt = 0; this.u = 0; this.c = 0; this.clock = 0; this.near = false; this.gy = 0; this.gp = 0; this.lastTurn = -1; this.shut = false;
    this.er = this.el = this.erv = this.elv = 0; this.gazed = false; this.uPrev = null; this.cBack = BUILT; this.u0 = 0;
    this.band.from(0);
  },
  back(L) { this.cBack = Math.min(this.c, BUILT); this.u0 = this.u; },
  end() { this.hide(); },
  reset() { this.hide(); this.fresh = true; this.broke = false; this.rt = 0; this.u = 0; this.c = 0; this.clock = 0; this.near = false; this.gy = 0; this.gp = 0; this.lastTurn = -1; this.shut = false; this.er = this.el = this.erv = this.elv = 0; this.gazed = false; this.uPrev = null; this.cBack = BUILT; this.u0 = 0; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', linger = ph === 'linger', back = ph === 'return';
    if (!showing && !linger && !back) { this.hide(); return; }
    const calm = L.calm, V = this.V, G = L.k.G, voice = L.voice();
    this.clock += dt;
    // ---- is she built; and is she looking up?
    const dwell = this.u0 > 0.04 ? Math.min(1.5, FALL / (calm ? 0.65 : 1)) : 0.45;
    if (!back) this.c = Math.min(BUILT + 1, this.c + dt);
    const c = back ? this.cBack * (1 - ease.inOut(ramp(L.r, dwell, L.retDur))) : this.c;
    let target = 0, who = null;
    if (showing) { target = this.fresh ? (this.rt >= RB - 1e-4 ? 1 : 0) : (L.t >= this.t1 ? 1 : 0); who = G.camera.position; }
    else if (linger) {
      const v = G.vehicle, q = L.local(v.pos.x, v.pos.z), d = Math.hypot((q.u - U0) / SC - 0.02, (q.out + L.wall + ZS) / SC - 0.45);
      this.near = v.group.visible && Math.abs(v.pos.y - L.y) < 0.5 && d < (this.near ? 1.35 : 1.05); target = this.near ? 1 : 0; who = v.pos;
    }
    if (target) this.broke = true;
    const step = dt / (target > this.u ? RISE : FALL) * (calm ? 0.65 : 1);
    this.u = target > this.u ? Math.min(target, this.u + step) : Math.max(target, this.u - step);
    const u = this.u;
    // ---- the reading goes on (and the tune with it) while her eyes are on the page
    const reading = !target && u < 0.3 && (!back || c > 0.06);
    if (reading) {
      this.rt += dt; if (this.fresh && !this.broke) this.rt = Math.min(this.rt, RB);
      if (this.rt < T_END) this.band.play(this.rt, this.broke ? (back ? 0.26 : 0.16) : Math.max(0, Math.min(0.25, RB - this.rt)));
    }
    const rt = this.rt;
    // ---- a leaf turned now and then
    const tn = rt < TURN0 ? -1 : Math.floor((rt - TURN0) / TURN_EVERY), tq = tn < 0 ? -1 : (rt - TURN0 - tn * TURN_EVERY) / TURN_D, turning = tq >= 0 && tq <= 1;
    if (turning && tn !== this.lastTurn && tq > 0.2 && reading) { this.lastTurn = tn; if (!L.quiet && voice.ctx) noise(voice, 0, { d: 0.26, vol: calm ? 0.006 : 0.011, bp: 2700, q: 0.7, attack: 0.05 }); }
    // ---- whoever she looks up at (you; the toy)
    if (who) {
      const q = L.local(who.x, who.z), dx = (q.u - U0) / SC + 0.03, dz = (q.out + L.wall + ZS) / SC - 0.42, wy = Math.max(-0.75, Math.min(0.75, Math.atan2(dx, dz))), wp = Math.max(-0.3, Math.min(0.16, -Math.atan2((who.y - L.y) / SC - 0.43, Math.hypot(dx, dz)) * 0.7));
      const k = !this.gazed ? 1 : 1 - Math.exp(-dt * 3.2); this.gy += (wy - this.gy) * k; this.gp += (wp - this.gp) * k; this.gazed = true;
    }
    // ---- her earrings: two small pendulums, set going by her head
    const o = this.IDLE, bre = Math.sin(this.clock * 1.75);
    o.breath = bre; o.sway = u > 0.9 ? Math.sin(this.clock * 0.43) * Math.sin(this.clock * 0.19 + 1) : 0;
    o.scan = 0.045 * Math.sin(rt * 3.1) * (turning ? 0.3 : 1); o.nod = tn < 0 ? 0.02 * Math.sin(rt * 0.7) : 0.07 * (clamp01((rt - TURN0 - tn * TURN_EVERY - TURN_D) / (TURN_EVERY - TURN_D)) - 0.5) - (turning ? 0.05 * Math.sin(Math.PI * tq) : 0);
    o.turn = turning ? tq : -1; o.gazeY = this.gy; o.gazeP = this.gp;
    const kick = (this.uPrev == null ? 0 : (u - this.uPrev)) / Math.max(dt, 1e-3); this.uPrev = u;
    if (dt > 0) for (const s of ['r', 'l']) {
      const a = 'e' + s, v = a + 'v', n = Math.min(4, Math.ceil(dt / 0.012)), h = dt / n;
      for (let i = 0; i < n; i++) { this[v] += (-150 * this[a] - 2.6 * this[v] + (calm ? 9 : 34) * kick * (s === 'r' ? 1 : 0.8)) * h; this[a] += this[v] * h; }
      this[a] = Math.max(-0.7, Math.min(0.7, this[a]));
    }
    o.earR = this.er; o.earL = this.el;
    this.pose(u, o);
    // ---- into the rig
    const rig = this.rig, I = this.I, B = this.B, M = this.M;
    rig.mesh.visible = c > 0.03; this.ru.uT.value = c; this.ru.uTumble.value = calm ? 0 : 1;
    for (const n of ['torso', 'head', 'ru', 'rf', 'lu', 'lf', 'bkR', 'bkL', 'earR', 'earL']) rig.mat(I[n], V.m.multiplyMatrices(B, M[n]));
    rig.mat(I.leaf, V.m.multiplyMatrices(B, M.leaf)); rig.show(I.leaf, turning && c > BUILT);
    // ---- the book shuts, softly
    const shut = u > 0.6; if (shut !== this.shut) { this.shut = shut; if (shut && !L.quiet && voice.ctx) noise(voice, 0, { d: 0.09, vol: calm ? 0.008 : 0.016, lp: 520, attack: 0.004 }); }
    // ---- her shadow on the floor, and the table's
    const O = this.O, sh = this.shade, k = ease.smooth(ramp(c, 0.2, 1.2));
    sh.visible = k > 0.01; sh.count = 3;
    const put = (i, x, z, r, kk) => sh.set(i, O.x + (L.tx * x + L.nx * z) * SC, O.z + (L.tz * x + L.nz * z) * SC, r * SC, kk);
    put(0, 0.05, 0.47, 0.36, 0.62 * k); put(1, TABLE.x, TABLE.z + 0.02, 0.27, 0.55 * ease.smooth(ramp(c, 0.4, 1.3))); put(2, -0.02, 0.6, 0.2, 0.3 * k);
    voice.level = calm ? 0.8 : 1; voice.place();
    if (showing && !this.told && !L.quiet && u > 0.5) { this.told = true; L.k.say('She looks up from her book for as long as you look at her. Look away, and she reads on.', 5); }
    if (back && L.ret >= 1) this.hide();
  },
});
