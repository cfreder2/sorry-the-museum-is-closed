// Jean Honoré Fragonard, Portrait of a Man in Costume (c. 1767–68), Gallery 216. The word: flourish.
//
// One of his "fantasy figures": a friend or patron got up in the studio's old-fashioned finery (a striped doublet with
// winged shoulders, a tall rumpled collar, a soft dark cap) and painted at speed, the loaded brush sweeping and curling,
// so that the picture keeps "the character of a quick sketch". The museum's own note sets the man's large still eyes
// against "the active, undulating contours of his rumpled costume". So the man and his gaze stay in the picture; what
// comes out is the brush's flourish, and it draws the costume on the air.
//
// Look at it and his strokes pour out from under the frame, long wet sweeps of red-brown, red-gold and umber, run
// down to the floor and go round there in a whirl; and out of the whirl the costume is drawn in the air in a few dozen
// of them, as fast as he painted it and no more finished: you see the wall and the floor through it between the
// strokes. The long stripes of the doublet come first, from the shoulders down to a hem that trails off; two sashes
// of paint go round them; then the sleeves with their bright slashes, the padded wings of the shoulders, the collar
// in four sweeps (pale where the light gets inside it, with his dark ticks along the tall wing), and the cap in four,
// which drops on and settles. Three buttons are dabbed down the front, and last of all one stroke of yellow goes
// round the cuff, the brightest touch in the picture. Then the drawing gathers a sleeve to its chest and bows, and
// as it goes the strokes let go and stream after it like a ribbon dancer's ribbons, the yellow one furthest, out low
// and wide over the floor; they catch up and lie down again as it comes up, turning, into the pose in the picture
// above: chest turned away, one sleeve akimbo, the other raised at the side with its cuff hanging as his hand does,
// the cap cocked. There it holds still, as his eyes do, only breathing, the stripes still moving a little. When
// you stop looking it unravels from the cap down and the strokes run back to the wall, up it and in under the frame.
//
// The music is a flourish too: the refrain of the Rondeau that opens the first suite of Jean-Joseph Mouret's Fanfares
// (Paris, 1729), set down from the 1729 print. The cap lands on the downbeat of its third bar, the buttons on the
// three repeated notes, the yellow stroke on the high note after them, the bow under the trill, and the pose arrives
// on the tune's top note.
//
// Every stroke is a ribbon of paint: a blunt loaded start, bristle streaks, a lit ridge along one edge, a taper and a
// dry dragged tail; lit as he lit it (from high on the left). They turn their faces to you while they fly and lie
// along the form when they land. Nothing is solid; the toy drives through. With "Reduce motion and flashing" on, the
// strokes go round at about half the speed (and not so far round), the whirl on the floor turns at half speed, the
// turn out of the bow is eased and arrives a beat late, and the music comes in softly.
//
// What it does not do: it puts no man in the room, gives the costume no face, hands or body (it is a drawing in
// paint, open to the air), and gives the sitter no name, trade or story (the museum says his identity is unknown),
// because the face and its stillness are the picture's own and are left in it.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, canvasTexture } from '../paintlife.js';
import { score, hz } from './stagecraft.js';

const TAU = Math.PI * 2, sm = ease.smooth;
const K = 24;                                  // segments in a stroke
const NT = 8, DTS = 0.06;                      // how many moments just past are kept for what streams behind, and how far apart (s)
const CU = -0.18, CO = 0.32;                   // where the costume stands: along the wall from the picture's middle, out from it
const SC = 1.3, WAIST = 0.2;                // its size, and its waist above the floor
const T1 = 0.55;                               // seconds for a stroke from under the frame to the whirl on the floor
const RE = 0.24;                               // the whirl's radius where the strokes join it

// The fanfare: half note = 80, so a quarter is 0.375 s; bar 1 falls at T0.
const Q = 0.375, T0 = 0.6, bar = n => T0 + (n - 1) * 4 * Q;
const T_CAP = bar(3);                                                   // the cap settles on the downbeat of bar 3
const T_BTN = [bar(3) + Q, bar(3) + 1.5 * Q, bar(3) + 2 * Q];          // three buttons on the three repeated notes
const T_YEL = bar(3) + 3 * Q;                                           // the yellow stroke lands on the high note
const T_UP = bar(4), T_BOW = bar(4) + Q, T_LOW = bar(4) + 2.5 * Q, T_RISE = bar(4) + 3.2 * Q, T_POSE = bar(5) + Q;      // drawn up on the trill; down; up and round, to arrive on the top note
// Jean-Joseph Mouret, Rondeau (Fanfares ... Première Suitte, Paris 1729): the refrain, 16 bars of 2/2 in D, from the
// print. Trills (the print's +) begin on the upper note, in semiquavers.
const TR = (up, n, beats) => Array.from({ length: beats * 4 }, (_, i) => (i % 2 ? n : up) + ':0.25').join(' ');
const A1 = 'D5 A4 D5 E5 | F#5:0.5 G5:0.5 F#5:0.5 E5:0.5 D5:0.5 E5:0.5 F#5:0.5 G5:0.5 | A5 A5:0.5 A5:0.5 A5 B5 | ' + TR('B5', 'A5', 1.5) + ' G5:0.5 F#5 F#5:0.5 G5:0.5 | A5 D6 A5 A5 | ';
const A6 = TR('G5', 'F#5', 1) + ' E5:0.5 F#5:0.5 G5:0.5 A5:0.5 F#5:0.5 G5:0.5 | ';
const TOP = 'F#5:0.5 E5:0.5 | ' + A1 + A6 + 'E5 A4 E5 E5:0.5 E5:0.5 | ' + TR('F#5', 'E5', 1.5) + ' E5:1.5 F#5:0.5 E5:0.5 | ' +
  A1 + A6 + 'E5:0.5 A5:0.5 G5:0.5 F#5:0.5 ' + TR('F#5', 'E5', 1.5) + ' D5:0.5 | D5:3';
const S1 = 'F#4 D4 A4 A4 | A4:2 A4 D5:0.5 E5:0.5 | F#5 F#5:0.5 F#5:0.5 F#5 G5 | F#5:1.5 E5:0.5 D5 D5:0.5 E5:0.5 | F#5 G5:0.5 F#5:0.5 E5:0.5 D5:0.5 C#5:0.5 B4:0.5 | A4 C#5:0.5 D5:0.5 E5:0.5 F#5:0.5 D5:0.5 E5:0.5 | ';
const SECOND = 'A4:0.5 G4:0.5 | ' + S1 + 'C#5 A4 C#5 C#5:0.5 C#5:0.5 | C#5:3 A4:0.5 G4:0.5 | ' + S1 + 'C#5:0.5 F#5:0.5 E5:0.5 D5:0.5 A4:1.5 D5:0.5 | D5:3';
const B1 = 'D3:2 D3 A2 | D3:3 D4 | D4:2 D4 G3 | D3:3 D4 | ';
const BASS = 'D3 | ' + B1 + 'D4:2 C#4:2 | D4:2 C#4 D4 | A3:2 A2:2 | A3 A3:0.5 B3:0.5 C#4 D4 | ' + B1 + 'D4:2 C#4:2 | D4:2 G3:2 | A3:2 A2:2 | D2:3';

// ---------------------------------------------------------------- the costume, at rest (metres; x to its left, which
// is the viewer's right when it faces out; y up from the waist; z to its front)
const TOR = [      // the doublet: height, half width, half depth in front and behind
  [-0.06, 0.14, 0.114, 0.106], [-0.03, 0.128, 0.104, 0.096], [0, 0.118, 0.096, 0.086], [0.06, 0.124, 0.104, 0.088], [0.13, 0.136, 0.11, 0.092],
  [0.2, 0.137, 0.1, 0.09], [0.243, 0.125, 0.083, 0.08], [0.268, 0.082, 0.062, 0.062], [0.286, 0.056, 0.05, 0.05]];
const JT = [0.03, 0.11, 0.19], JD = 0.04;          // the spine's three joints, and how far each one's bend spreads
const NECK = 0.262, HEADP = 0.3;                   // where the collar stands, and where the cap's (absent) head turns
const ARM = side => ({ S: [side * 0.136, 0.232, 0], E: [side * 0.166, 0.08, 0.006], W: [side * 0.174, -0.062, 0.03], H: [side * 0.172, -0.025, 0.024] });      // shoulder, elbow, cuff's end; and where the cuff hinges
const AL = ARM(1), AR = ARM(-1), SPINE = [0.3, 0.35, 0.35];
const CAP = { c: [-0.008, 0.422, -0.012], r: [0.09, 0.034, 0.096] };      // (it rides a little above the collar: there is no head under it)
// bones: hips, three of the spine (the last is the chest), collar, cap, left upper arm and forearm, right, the two wings,
// and the two cuffs (an empty sleeve's end hangs a little, as a wrist does)
const B_HIP = 0, B_CHEST = 3, B_COL = 4, B_CAP = 5, B_LU = 6, B_LF = 7, B_RU = 8, B_RF = 9, B_LW = 10, B_RW = 11, B_LH = 12, B_RH = 13, NB = 14;

// A pose: every number the costume's bones turn by. (yaw: its front to the viewer's right; pitch: forward; roll: its
// top to its own right. An arm's abd lifts it out sideways, fwd swings it forward, yaw carries it round the shoulder;
// ex bends the elbow forward, ez bends it on outward and up; w and wz do the same for the cuff.)
const P_KEYS = ['psi', 'dU', 'dO', 'dH', 'sp', 'sr', 'sy', 'cp', 'cy', 'cr', 'hp', 'hy', 'hr', 'La', 'Lf', 'Ly', 'Lex', 'Lez', 'Lw', 'Lwz', 'Ra', 'Rf', 'Ry', 'Rex', 'Rez', 'Rw', 'Rwz'];
const pose = o => { const p = {}; for (const k of P_KEYS) p[k] = o[k] || 0; return p; };
const REST = pose({ La: 0.42, Ra: 0.42, Lf: 0.08, Rf: 0.08, Lex: 0.4, Rex: 0.4, Lez: -0.3, Rez: -0.3, Lw: 0.25, Rw: 0.25, hp: -0.04 });
const CHEST = pose({ psi: -0.12, dH: 0.014, sp: -0.14, hp: -0.16, cp: -0.05, La: -0.28, Lf: 0.95, Lex: 1.45, Lw: 0.55, Ra: 0.3, Rf: -0.25, Rex: 0.25, Rw: 0.3 });      // drawn up, a sleeve to the chest
const BOW = pose({ psi: 0.56, dH: -0.03, dO: 0.04, sp: 0.95, sy: 0.1, hp: 0.3, cp: 0.1, La: 0.3, Lf: 1.45, Lex: 0.15, Lw: -0.35, Ra: 0.3, Rf: -0.95, Rex: -0.3, Rw: 0.5 });
const PICT = pose({ psi: -0.42, sp: -0.08, sr: 0.04, sy: -0.08, hy: 0.6, hr: -0.1, hp: -0.08, cy: 0.14, cr: -0.03,
  La: 0.75, Lf: 0.25, Lex: 0.05, Lez: 1.75, Lw: 0.25, Lwz: 1.05, Ra: 0.78, Rf: 0.12, Rex: 0.1, Rez: -1.5, Rw: 0.5, Rwz: -0.3 });

lifeFor(93900, {
  title: /^Portrait of a Man in Costume/,
  word: 'flourish',
  stage: { out: 1.2, half: 1.0, cam: { dist: 2.3, height: 0.66, side: -0.06, fov: 58, lookU: -0.1, lookOut: 0.4, lookH: 0.95, floorOut: 0.78 } },
  wake: 2, ret: 2.2,

  build(L) {
    const P = L.pal, col = (h, a = 0.15) => P.near(h, a), R = L.rand;
    this.railH = L.rail - L.y;
    // the bones, now and at NT moments just past (what streams behind a movement is drawn where the form was)
    this.MT = Array.from({ length: NT }, () => Array.from({ length: NB }, () => new Float64Array(12))); this.lbT = Array.from({ length: NT }, () => new Float32Array(NB * 3)); this.tl_ = new Float64Array(12);
    // light, as he has it: from high on the left, a little in front (along the wall, up, out)
    this.light = new THREE.Vector3(L.tx * -0.5 + L.nx * 0.5, 0.72, L.tz * -0.5 + L.nz * 0.5).normalize();
    // ---------------------------------------------------------- his marks: one texture. Two loaded strokes, a dry
    // one (a broad brush with little on it: you see through it) and a short one (each a blunt start, bristle streaks, a lighter ridge along the top where the paint stands up,
    // and a tail that gives out bristle by bristle), and a round dab (a button).
    const tex = canvasTexture(512, 256, (g, w) => {
      g.clearRect(0, 0, w, 256);
      for (let row = 0; row < 4; row++) {
        const y0 = row * 48 + 5, hh = 38, short = row === 3, dry = row === 2, nb = dry ? 13 : 30;
        for (let b = 0; b < nb; b++) {
          const f = (b + (dry ? R() * 0.6 : 0)) / (nb - 1 + (dry ? 0.6 : 0)), y = y0 + f * hh + (R() - 0.5) * 2, th = dry ? 1.3 + R() * 1.5 : 1.8 + R() * 2.8, mid = 1 - Math.pow(Math.abs(f - 0.5) * 2, 2.2);
          const x0 = 4 + (1 - mid) * (short ? 60 : 16) + R() * 8, x1 = w - 6 - (1 - mid) * (short ? 70 : 90) - R() * (short ? 40 : row === 0 ? 50 : 120);
          const lum = Math.round(255 * Math.min(1, Math.max(0.46, 0.6 + 0.4 * Math.pow(1 - f, 1.5) + (R() - 0.5) * 0.3)));
          let gap = 0;
          for (let x = x0; x < x1; x += 2) {
            const env = Math.min(1, (x - x0) / 7) * Math.min(1, (x1 - x) / 36);
            if (gap > 0) { gap--; continue; }
            if (dry ? R() < 0.035 : x > w * 0.5 && R() < 0.07 * (x / w)) gap = 2 + Math.floor(R() * (dry ? 12 : 7));                    // the brush runs dry
            g.fillStyle = `rgba(${lum},${lum},${lum},${(0.72 + 0.28 * R()) * env})`; g.fillRect(x, y + Math.sin(x * 0.021 + b) * 1.1, 2.5, th);
          }
        }
      }
      const gr = g.createRadialGradient(27, 235, 1, 32, 240, 13); gr.addColorStop(0, '#fff'); gr.addColorStop(0.45, '#cfcfcf'); gr.addColorStop(1, '#7a7a7a');
      g.fillStyle = gr; g.beginPath(); g.ellipse(32, 240, 12.5, 11.5, 0.3, 0, TAU); g.fill();
    });
    tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; tex.anisotropy = 4;
    const rowV = row => [1 - (row * 48 + 3) / 256, 1 - (row * 48 + 45) / 256];

    // ---------------------------------------------------------- the surfaces
    const prof = y => { let i = 0; while (i < TOR.length - 2 && y > TOR[i + 1][0]) i++; const a = TOR[i], b = TOR[i + 1], k = clamp01((y - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)]; };
    const rag = ph => 0.022 + 0.016 * Math.sin(7 * ph + 1) + 0.012 * Math.sin(13 * ph);                  // (its hem is not finished: it trails off, as the picture does at its foot)
    const torso = (ph, y) => { const p = prof(y), c = Math.cos(ph), s = Math.sin(ph), k = 1 + 0.035 * Math.sin(5 * ph + 20 * y) + 0.5 * Math.max(0, -0.06 - y); return [p[0] * s * k, y - rag(ph) * ramp(y, -0.02, -0.06), (c > 0 ? p[1] : p[2]) * c * k + 0.008]; };
    const skinT = y => { if (y <= JT[0] - JD) return [0, 0, 0]; for (let k = 0; k < 3; k++) if (y < JT[k] + JD) return [k, k + 1, sm((y - JT[k] + JD) / (2 * JD))]; return [3, 3, 0]; };
    const sleeve = side => {
      const A = ARM(side), d1 = new THREE.Vector3().fromArray(A.E).sub(new THREE.Vector3().fromArray(A.S)), d2 = new THREE.Vector3().fromArray(A.W).sub(new THREE.Vector3().fromArray(A.E));
      const t = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), z = new THREE.Vector3(0, 0, 1), c = new THREE.Vector3();
      const rad = a => (a < 0.25 ? lerp(0.055, 0.064, a / 0.25) : a < 0.5 ? lerp(0.064, 0.055, (a - 0.25) / 0.25) : a < 0.9 ? lerp(0.055, 0.042, (a - 0.5) / 0.4) : lerp(0.042, 0.047, (a - 0.9) / 0.1));
      return (th, a) => {
        if (a < 0.5) c.fromArray(A.S).addScaledVector(d1, a / 0.5); else c.fromArray(A.E).addScaledVector(d2, (a - 0.5) / 0.5);
        t.copy(d1).normalize().lerp(e2.copy(d2).normalize(), sm(ramp(a, 0.38, 0.62))).normalize();
        e1.crossVectors(t, z).normalize().multiplyScalar(-side); e2.crossVectors(t, e1).normalize().multiplyScalar(-side);
        const r = rad(a) * (1 + 0.07 * Math.sin(3 * th + 11 * a) + 0.05 * Math.sin(23 * a + th));
        return [c.x + r * (Math.cos(th) * e1.x + Math.sin(th) * e2.x), c.y + r * (Math.cos(th) * e1.y + Math.sin(th) * e2.y), c.z + r * (Math.cos(th) * e1.z + Math.sin(th) * e2.z)];
      };
    };
    const skinA = side => a => { const u = side > 0 ? B_LU : B_RU, h = side > 0 ? B_LH : B_RH; return a < 0.38 ? [u, u, 0] : a < 0.62 ? [u, u + 1, sm((a - 0.38) / 0.24)] : a < 0.8 ? [u + 1, u + 1, 0] : a < 0.94 ? [u + 1, h, sm((a - 0.8) / 0.14)] : [h, h, 0]; };
    // (a padded roll over each shoulder, its outer end cocked up)
    const wing = side => (th, ph) => {
      const x = 0.074 * Math.sin(ph) * Math.cos(th), y = 0.042 * Math.cos(ph), z = 0.08 * Math.sin(ph) * Math.sin(th), a = side * 0.55, c = Math.cos(a), s = Math.sin(a);
      return [side * 0.154 + x * c - y * s, 0.25 + x * s + y * c, z];
    };
    // (the collar: open in front, tall at the wing on its right, splayed at the wing on its left, rumpled)
    const CO0 = 0.36, colK = ph => (ph - CO0) / (TAU - 2 * CO0);
    const colH = ph => { const k = colK(ph); return (lerp(0.125, 0.17, sm(ramp(k, 0.5, 0.9))) * (0.78 + 0.22 * Math.abs(2 * k - 1)) + 0.008 * Math.sin(5 * ph + 1)) * (0.4 + 0.6 * sm(ramp(Math.min(k, 1 - k), 0, 0.14))); };
    const colF = ph => { const k = colK(ph); return lerp(0.115, 0.06, sm(ramp(k, 0.05, 0.35))) + 0.05 * sm(ramp(k, 0.65, 1)) + 0.007 * Math.sin(3 * ph); };
    const collar = inner => (ph, q) => { const r = 0.056 + colF(ph) * Math.pow(q, 1.3) - (inner ? 0.004 : 0); return [r * Math.sin(ph), NECK + colH(ph) * q, r * Math.cos(ph) * 0.95]; };
    // (the cap: a soft squashed round, pushed back and to its right)
    const cap = (th, ph) => {
      let x = CAP.r[0] * Math.sin(ph) * Math.cos(th), y = CAP.r[1] * Math.max(-0.5, Math.cos(ph)) * (1 + 0.12 * Math.sin(2 * th + 1)) - 0.012 * (1 - Math.cos(th - 2.6)) * Math.sin(ph), z = CAP.r[2] * Math.sin(ph) * Math.sin(th);
      const a = -0.3, y1 = y * Math.cos(a) - z * Math.sin(a), z1 = y * Math.sin(a) + z * Math.cos(a), b = 0.2, x2 = x * Math.cos(b) - y1 * Math.sin(b), y2 = x * Math.sin(b) + y1 * Math.cos(b);
      return [CAP.c[0] + x2, CAP.c[1] + y2, CAP.c[2] + z1];
    };
    const v3 = (a, b, c) => new THREE.Vector3(a, b, c), pa = v3(), pb = v3(), pc = v3(), nn = v3();
    // the surface's normal at (u, v), turned to the side `hint` says is out
    const normal = (f, u, v, hint, into) => {
      const e = 1e-3, p = f(u, v); pa.fromArray(f(u + e, v)).sub(pc.fromArray(p)); pb.fromArray(f(u, v + e)).sub(pc);
      into.crossVectors(pa, pb); if (into.lengthSq() < 1e-16) into.set(0, 1, 0); into.normalize(); const h = hint(p); if (into.x * h[0] + into.y * h[1] + into.z * h[2] < 0) into.negate(); return p;
    };
    const fromAxis = p => [p[0], 0, p[2]], fromArm = side => { const A = ARM(side); return p => [p[0] - (p[1] > A.E[1] ? lerp(A.E[0], A.S[0], (p[1] - A.E[1]) / (A.S[1] - A.E[1])) : A.E[0]), 0, p[2]]; };
    const fromWing = side => p => [p[0] - side * 0.154, p[1] - 0.25, p[2]], fromCap = p => [p[0] - CAP.c[0], p[1] - CAP.c[1], p[2] - CAP.c[2]], toAxis = p => [-p[0], 0, -p[2]];

    // ---------------------------------------------------------- the strokes
    const S = this.S = [];
    const NS_MAX = 96, NP = K + 1;
    const sC = new Float32Array(NS_MAX * NP * 3), sN = new Float32Array(NS_MAX * NP * 3), sB = new Float32Array(NS_MAX * NP * 3), sSkin = new Float32Array(NS_MAX * NP * 3), sH = new Float32Array(NS_MAX * NP);
    const T = v3(), Bn = v3();
    const taper = this.taper = s => Math.min(1, Math.sqrt(s / 0.03 + 0.15)) * (1 - 0.72 * Math.pow(ramp(s, 0.5, 1), 1.5));      // blunt where the brush lands, full, then drawn out to its tail
    // A stroke on a surface: path(s) -> [u, v] for s in 0..1; hw its half width at its fullest (it starts blunt and
    // tapers to its tail, unless `even`); lift how far it stands off; tl when it lands (show seconds); row which mark;
    // back when it leaves, as a part of the Return; D how far its tail streams behind a movement (seconds; from its
    // other end with `rev`), d0 the same for all of it; loose how far it lifts off the form then, and fling how far it
    // is thrown out past the cuff, away from the point `from`.
    const stroke = (f, hint, skin, path, o) => {
      const i = S.length, st = { i, kind: 0, row: o.row == null ? Math.floor(R() * 2) : o.row, col: o.col, tl: o.tl, back: o.back, flip: R() < 0.5, ph: R() * TAU, wob: o.wob || 0, bright: o.bright || 0, D: o.D || 0, d0: o.d0 || 0, rev: !!o.rev, loose: o.loose || 0, fling: o.fling || 0, from: o.from || null };
      let len = 0; const mid = [0, 0, 0];
      for (let j = 0; j < NP; j++) {
        const s = j / K, [u, v] = path(s), p = normal(f, u, v, hint, nn), [u2, v2] = path(Math.min(1, s + 0.02)), [u1, v1] = path(Math.max(0, s - 0.02));
        T.fromArray(f(u2, v2)).sub(pa.fromArray(f(u1, v1))); if (T.lengthSq() < 1e-14) T.set(1, 0, 0); T.normalize(); Bn.crossVectors(nn, T).normalize();
        const k = (i * NP + j) * 3, lift = o.lift * (0.7 + 0.6 * Math.sin(s * 5 + st.ph) ** 2), hw = o.hw * (o.even ? 1 : taper(s));
        sC[k] = p[0] + nn.x * lift; sC[k + 1] = p[1] + nn.y * lift; sC[k + 2] = p[2] + nn.z * lift;
        sN[k] = nn.x; sN[k + 1] = nn.y; sN[k + 2] = nn.z; sB[k] = Bn.x * hw; sB[k + 1] = Bn.y * hw; sB[k + 2] = Bn.z * hw; sH[i * NP + j] = hw;
        const sk = skin(v, u); sSkin[k] = sk[0]; sSkin[k + 1] = sk[1]; sSkin[k + 2] = sk[2];
        if (j) len += Math.hypot(sC[k] - sC[k - 3], sC[k + 1] - sC[k - 2], sC[k + 2] - sC[k - 1]);
        if (j === K / 2) { mid[0] = sC[k]; mid[1] = sC[k + 1]; mid[2] = sC[k + 2]; }
      }
      // its way in: from under the frame at u0, down to the whirl at angle a0, round and up to where it lands
      st.len = len; st.lag = Math.max(0.03, len / 2.3);
      st.u0 = (R() - 0.5) * 2 * (L.hw - 0.04); st.a0 = -Math.PI / 2 + (R() - 0.5) * 1.5;
      const ms = [CU + mid[0] * SC, WAIST + mid[1] * SC, CO + mid[2] * SC];
      const aT = Math.atan2(ms[2] - CO, ms[0] - CU); let turn = aT - st.a0; turn -= TAU * Math.floor(turn / TAU); if (turn < 1.15 * Math.PI) turn += TAU; if (o.loop) turn += TAU * o.loop;
      st.turn = turn; st.rT = Math.hypot(ms[0] - CU, ms[2] - CO) + 0.035; st.hT = ms[1]; st.T2 = o.direct ? 0 : turn / (o.loop ? 11 : 9.5); st.direct = !!o.direct;
      st.e = st.tl - T1 - st.T2 - st.lag * 0.5;
      // (with motion reduced: round at about half the speed, and so not so far round)
      st.turnC = o.direct ? 0 : (o.loop ? turn - TAU * o.loop : turn) - (turn - (o.loop ? TAU * o.loop : 0) > 2.2 * Math.PI ? TAU : 0); st.T2C = o.direct ? 0 : Math.min(st.turnC / 4.75, st.tl - T1 - st.lag * 0.5 - 0.08); st.eC = st.tl - T1 - st.T2C - st.lag * 0.5;
      S.push(st); return st;
    };
    const pick = a => a[Math.floor(R() * a.length)];
    // his colours for this picture, a little up in key (the room is lit, and the strokes stand alone against the wall)
    const reds = ['#7c3a20', '#874424', '#70331c'].map(h => col(h)), golds = ['#9a5c2e', '#a66a36', '#90542a'].map(h => col(h)), lights = ['#b8824a', '#c49258'].map(h => col(h)), darks = ['#4a2214', '#3b1b10'].map(h => col(h));
    const pale = ['#cfc59c', '#bdb288', '#a0966e'].map(h => col(h)), olive = ['#a2986e', '#8c825c'].map(h => col(h)), capC = ['#4a3f20', '#3a3018'].map(h => col(h)), trim = col('#96733a'), yellow = ['#d2a030', '#ddb048'].map(h => col(h, 0.1));
    const fan = (ph0, s) => ph0 - 0.3 * Math.sin(ph0) * sm(s);                  // the stripes gather towards the buttons as they come down
    // the doublet: twelve long stripes from the shoulders down to a hem that trails off; four dark lines between
    // them; and two sashes of paint going round, that hold it together
    for (let n = 0; n < 5; n++) {            // (first the broad dry sweeps that say where it is)
      const ph0 = (n + 0.3 + R() * 0.4) / 5 * TAU, ph = R() * TAU;
      stroke(torso, fromAxis, skinT, s => [fan(ph0, s) + 0.22 * Math.sin(s * 3.4 + ph), lerp(0.25, -0.04 - 0.03 * R(), s)], { hw: 0.05, lift: 0.001, col: n % 2 ? pick(darks) : pick(reds), row: 2, tl: 1.2 + n * 0.1, back: 0.2 + 0.08 * R(), D: 0.1, rev: true, loose: 0.5 });
    }
    const order = [0, 6, 3, 9, 1, 7, 4, 10, 2, 8, 5];
    for (let n = 0; n < 11; n++) {
      const i = order[n], ph0 = (i + 0.2 + R() * 0.5) / 11 * TAU, ph = R() * TAU, amp = 0.1 + 0.08 * R(), y0 = -0.05 - 0.04 * R();
      stroke(torso, fromAxis, skinT, s => [fan(ph0, s) + amp * Math.sin(s * 4.6 + ph) * (0.35 + 0.65 * s), lerp(0.262, y0, s)], { hw: 0.017 + 0.005 * R(), lift: 0.006, col: i % 4 === 3 ? pick(darks) : i % 2 ? pick(golds) : pick(reds), tl: 1.5 + n * 0.075, back: 0.16 + 0.1 * R(), wob: 1, D: 0.1 + 0.06 * R(), rev: true, loose: 0.7, bright: i % 2 ? 0.25 : 0.1 });
    }
    for (let n = 0; n < 4; n++) {
      const ph0 = (n + 0.55 + R() * 0.3) / 4 * TAU, ph = R() * TAU;
      stroke(torso, fromAxis, skinT, s => [fan(ph0, s) + 0.12 * Math.sin(s * 6 + ph) * (0.3 + 0.7 * s), lerp(0.25, -0.05 - 0.04 * R(), s)], { hw: 0.008, lift: 0.01, col: pick(darks), tl: 2.3 + n * 0.05, back: 0.14 + 0.1 * R(), wob: 1, D: 0.16, rev: true, loose: 1 });
    }
    stroke(torso, fromAxis, skinT, s => [0.5 + s * 4.4, lerp(0.19, -0.04, s) + 0.02 * Math.sin(s * 7)], { hw: 0.018, lift: 0.013, col: lights[0], tl: 2.4, back: 0.13, D: 0.26, loose: 1.4, bright: 0.25 });
    stroke(torso, fromAxis, skinT, s => [-0.7 - s * 3.8, lerp(0.08, -0.075, s) + 0.02 * Math.sin(s * 6 + 1)], { hw: 0.018, lift: 0.013, col: golds[1], tl: 2.5, back: 0.15, D: 0.26, loose: 1.4, bright: 0.15 });
    stroke(torso, fromAxis, skinT, s => [0.03 + 0.05 * Math.sin(s * 6), lerp(0.25, -0.045, s)], { hw: 0.008, lift: 0.012, col: darks[1], tl: 2.58, back: 0.15, wob: 0.5, D: 0.14, rev: true, loose: 0.8 });        // (the buttoned front)
    // the sleeves: four long strokes down each, a bright slash round it, the cuff's edge; the wings over the shoulders
    for (const side of [1, -1]) {
      const f = sleeve(side), h = fromArm(side), sk = skinA(side), t0 = side > 0 ? 2.0 : 2.04;
      for (let i = 0; i < 2; i++) { const th0 = (i + R() * 0.5) / 2 * TAU + 0.8, tw = (R() - 0.5) * 2; stroke(f, h, sk, s => [th0 + tw * s, lerp(0.02, 0.95, s)], { hw: 0.045, lift: 0.001, col: i ? pick(darks) : pick(reds), row: 2, tl: t0 + 0.07 * i, back: 0.16 + 0.08 * R(), D: 0.3, loose: 0.8 }); }
      for (let i = 0; i < 3; i++) { const th0 = (i + R() * 0.5) / 3 * TAU, tw = (R() - 0.5) * 2.2; stroke(f, h, sk, s => [th0 + tw * s, lerp(0.03, 0.96, s)], { hw: 0.019, lift: 0.006, col: i === 2 ? pick(darks) : i ? pick(golds) : pick(reds), tl: t0 + 0.18 + 0.09 * i, back: 0.14 + 0.1 * R(), D: 0.34, loose: 1.2, bright: 0.15 }); }
      { const th0 = R() * TAU; stroke(f, h, sk, s => [th0 + s * 2.8 * side, lerp(0.1, 0.9, s)], { hw: 0.012, lift: 0.011, col: pick(lights), tl: t0 + 0.5, back: 0.14, D: 0.42, loose: 2, bright: 0.35, fling: 0.7, from: ARM(side).E }); }
      if (side > 0) { const th0 = R() * TAU; stroke(f, h, sk, s => [th0 - s * 4.2, lerp(0.42, 0.93, s)], { hw: 0.011, lift: 0.012, col: golds[0], tl: t0 + 0.62, back: 0.13, D: 0.44, loose: 2.2, bright: 0.25, fling: 1.1, from: ARM(side).E }); }
      stroke(f, h, sk, s => [s * 5 + 1, 0.975 - 0.02 * s], { hw: 0.009, lift: 0.006, col: darks[0], tl: t0 + 0.72, back: 0.15, d0: 0.16, D: 0.2, loose: 1 });
      const fw = wing(side), hw_ = fromWing(side), skw = () => [side > 0 ? B_LW : B_RW, 0, 0];
      // (strokes laid over the roll from front to back; and a light one along its crest)
      const over = xf => s => { const be = lerp(-1.85, 1.85, s), q = Math.sqrt(1 - xf * xf), Y = q * Math.cos(be), Z = q * Math.sin(be); return [Math.atan2(Z, xf), Math.acos(Y)]; };
      const along = zf => s => { const be = lerp(-1.25, 1.25, s), q = Math.sqrt(1 - zf * zf), X = q * Math.sin(be), Y = q * Math.cos(be); return [Math.atan2(zf, X), Math.acos(Y)]; };
      stroke(fw, hw_, skw, over(-0.36), { hw: 0.04, lift: 0.004, col: pick(reds), tl: 2.62, back: 0.1, D: 0.1, loose: 0.6 });
      stroke(fw, hw_, skw, over(0.44), { hw: 0.04, lift: 0.004, col: pick(golds), tl: 2.7, back: 0.11, D: 0.1, loose: 0.6, bright: 0.2 });
      stroke(fw, hw_, skw, along(0.2), { hw: 0.009, lift: 0.01, col: side < 0 ? col('#d8b468') : lights[1], tl: 2.8, back: 0.1, D: 0.12, loose: 0.8, bright: 0.35 });
    }
    // the collar in four: a sweep round the back, a flick up each wing (the tall one on its right last and lightest),
    // the light along that wing's edge; and his dark ticks inside it
    const cOut = collar(false), cIn = collar(true), skc = () => [B_COL, 0, 0], PHK = k => CO0 + k * (TAU - 2 * CO0);
    stroke(cOut, fromAxis, skc, s => [PHK(lerp(0.26, 0.76, s)), 0.5 + 0.12 * Math.sin(s * 3.4)], { hw: 0.046, lift: 0.002, col: pale[2], tl: 2.9, back: 0.08, D: 0.12, loose: 0.6 });
    stroke(cOut, fromAxis, skc, s => [PHK(lerp(0.44, 0.06, sm(s))), lerp(0.1, 0.94, s)], { hw: 0.05, lift: 0.004, col: pale[1], tl: 2.98, back: 0.07, D: 0.14, loose: 0.8, bright: 0.1 });
    stroke(cOut, fromAxis, skc, s => [PHK(lerp(0.58, 0.94, sm(s))), lerp(0.1, 0.96, s)], { hw: 0.056, lift: 0.004, col: pale[0], tl: 3.08, back: 0.06, D: 0.14, loose: 0.8, bright: 0.2 });
    stroke(cOut, fromAxis, skc, s => [PHK(lerp(0.7, 0.97, s)), 0.97], { hw: 0.008, lift: 0.009, col: col('#e2dbbc'), tl: 3.18, back: 0.05, D: 0.14, loose: 0.8, bright: 0.3 });
    for (let i = 0; i < 3; i++) { const ph = PHK(0.9 - i * 0.06); stroke(cIn, toAxis, skc, s => [ph + 0.05 * s, lerp(0.46, 0.84, s)], { hw: 0.006, lift: 0.008, col: col('#3a2a18'), tl: 3.22 + 0.04 * i, back: 0.05, row: 3, even: true, D: 0.12 }); }
    // the cap in four: a sweep under it and one over its crown, one round its edge, a glint of trim
    const skp = () => [B_CAP, 0, 0];
    const over = s => { const be = lerp(-1.35, 1.35, s), Y = Math.cos(be), Z = Math.sin(be); return [Math.atan2(Z, 0.06), Math.acos(0.998 * Y)]; };
    const under = s => { const g = lerp(-1.3, 1.3, s); return [(g < 0 ? -1 : 1) * Math.PI / 2 + 0.1, Math.PI - Math.max(0.05, Math.abs(g))]; };
    stroke(cap, fromCap, skp, under, { hw: 0.066, lift: 0.001, col: capC[1], tl: T_CAP - 0.46, back: 0.03, D: 0.1, loose: 0.3, even: true });
    stroke(cap, fromCap, skp, over, { hw: 0.072, lift: 0.002, col: capC[0], tl: T_CAP - 0.38, back: 0.01, D: 0.1, loose: 0.4, bright: 0.3 });
    stroke(cap, fromCap, skp, s => [2.6 + s * 5.9, 1.6 + 0.08 * Math.sin(s * 4)], { hw: 0.022, lift: 0.005, col: capC[1], tl: T_CAP - 0.28, back: 0.03, D: 0.1, loose: 0.5, bright: 0.2 });
    stroke(cap, fromCap, skp, s => [1.2 + s * 2.3, 1.5 + 0.06 * Math.sin(s * 3)], { hw: 0.008, lift: 0.01, col: trim, tl: T_CAP - 0.18, back: 0.02, D: 0.12, loose: 0.8, bright: 0.35 });
    // three buttons, and the yellow stroke round the left cuff (the longest ribbon of all when it streams)
    T_BTN.forEach((tl, i) => { const y = 0.2 - i * 0.062, ph = 0.03 + 0.05 * Math.sin((0.25 - y) / 0.31 * 6); const st = stroke(torso, fromAxis, skinT, s => [ph + (s - 0.5) * 0.19, y], { hw: 0.0105, lift: 0.016, col: golds[2], tl, back: 0.12, even: true, direct: true, bright: 0.35 }); st.kind = 3; });
    { const f = sleeve(1), h = fromArm(1), sk = skinA(1);
      stroke(f, h, sk, s => [-1.2 + s * 7, 0.93 - 0.09 * s + 0.01 * Math.sin(s * 5)], { hw: 0.015, lift: 0.013, col: yellow[0], tl: T_YEL, back: 0.1, loop: 1, bright: 0.45, row: 0, d0: 0.04, D: 0.44, loose: 2.4, fling: 1.9, from: AL.E });
      stroke(f, h, sk, s => [0.6 + s * 4.4, 0.82 + 0.04 * s], { hw: 0.009, lift: 0.014, col: yellow[1], tl: T_YEL + 0.07, back: 0.1, loop: 1, bright: 0.5, row: 1, d0: 0.08, D: 0.4, loose: 2.4, fling: 1.5, from: AL.E }); }
    // the whirl: strokes that never land. A few go round under the doublet's hem, loose in the air; the rest lie on
    // the floor round its foot, turning.
    const hemH = WAIST - 0.055 * SC;
    for (let i = 0; i < 13; i++) {
      const flat = i >= 5, st = { i: S.length, kind: flat ? 2 : 1, row: Math.floor(R() * 3), flip: R() < 0.5, ph: R() * TAU, bright: 0 };
      const q = R(); st.col = q < 0.4 ? pick(reds) : q < 0.6 ? pick(darks) : q < 0.9 ? pick(golds) : pick(lights);
      if (flat) { st.h = 0.013 + 0.0015 * (i - 5); st.r = 0.06 + 0.1 * R(); st.len = 0.1 + 0.12 * R(); st.hw = 0.011 + 0.01 * R(); st.rise = 0; }
      else { const k = (i + R()) / 5; st.h = 0.04 + (hemH - 0.02) * k; st.r = 0.14 + 0.05 * R(); st.len = 0.2 + 0.16 * R(); st.hw = 0.009 + 0.008 * R(); st.rise = (R() - 0.3) * 0.06; }
      st.lag = st.len / 2.1; st.u0 = (R() - 0.5) * 2 * (L.hw - 0.04); st.a0 = -Math.PI / 2 + (R() - 0.5) * 1.5; st.e = 0.06 + 1.0 * R() + (flat ? 0.3 : 0);
      st.sp = 0.75 + 0.5 * R() + (flat ? -0.2 : 0.3); st.back = 0.42 + 0.14 * R();
      S.push(st);
    }
    const NS = this.NS = S.length;

    // ---------------------------------------------------------- one mesh: every stroke a ribbon
    const nV = NS * NP * 2;
    const pos = new Float32Array(nV * 3), colr = new Float32Array(nV * 4), uv = new Float32Array(nV * 2), idx = [];
    for (const st of S) {
      const [va, vb] = st.kind === 3 ? [1 - 227 / 256, 1 - 253 / 256] : rowV(st.row);
      for (let j = 0; j < NP; j++) for (let e = 0; e < 2; e++) { const v = (st.i * NP + j) * 2 + e; uv[v * 2] = st.kind === 3 ? lerp(19 / 512, 45 / 512, j / K) : 0.004 + 0.992 * j / K; uv[v * 2 + 1] = (e === 0) !== st.flip ? va : vb; }
      for (let j = 0; j < K; j++) { const a = (st.i * NP + j) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(colr, 4).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    this.mesh = L.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, alphaTest: 0.4, side: THREE.DoubleSide, fog: false })));
    this.mesh.renderOrder = 5;
    this.sC = sC; this.sN = sN; this.sB = sB; this.sSkin = sSkin; this.sH = sH;
    this.shadow = L.blobs(1, { fade: true });

    // ---------------------------------------------------------- working room (nothing is made per frame)
    this.p = pose({}); this.p0 = pose({});
    this.f = { x: new Float32Array(NP), y: new Float32Array(NP), z: new Float32Array(NP), tx: new Float32Array(NP), ty: new Float32Array(NP), tz: new Float32Array(NP), wx: new Float32Array(NP), wy: new Float32Array(NP), wz: new Float32Array(NP), m: new Float32Array(NP), vis: new Float32Array(NP), lit: new Float32Array(NP) };
    this.o = new Float64Array(6); this.bT = 0; this.hidden = new Uint8Array(NS);

    // ---------------------------------------------------------- the band (trumpets with oboes and violins, basses, drums)
    const sc = this.band = score(L), bpm = 60 / Q, t0 = T0 - Q;
    sc.tune(TOP, t0, bpm, { type: 'triangle', vol: 0.03, legato: 0.86, over: 2, overVol: 0.3, attack: 0.012 });
    sc.tune(TOP, t0, bpm, { type: 'sawtooth', vol: 0.0075, legato: 0.8, attack: 0.02 });
    sc.tune(SECOND, t0, bpm, { type: 'triangle', vol: 0.014, legato: 0.86, attack: 0.012 });
    sc.tune(BASS, t0, bpm, { type: 'triangle', vol: 0.03, legato: 0.92, attack: 0.02 });
    for (const [b, n] of [[1, 50], [3, 50], [5, 50], [7, 45], [9, 50], [11, 50], [13, 50], [15, 45], [16, 50]]) { sc.note(bar(b), hz(n - 12), 0.5, { type: 'sine', vol: 0.05, to: hz(n - 12) * 0.92, attack: 0.004 }); sc.hit(bar(b), { d: 0.16, vol: 0.016, lp: 320 }); }      // the drums: D and A
    sc.note(T_POSE, hz(38), 0.6, { type: 'sine', vol: 0.05, to: hz(38) * 0.92, attack: 0.004 }); sc.hit(T_POSE, { d: 0.18, vol: 0.02, lp: 360 });
    // the brush: a soft drag as the strokes come down and go on, the cap, the ribbons in the bow
    sc.hit(0.08, { d: 0.9, vol: 0.02, bp: 1500, q: 0.7, attack: 0.25 });
    for (let i = 0; i < 12; i++) sc.hit(1.15 + i * 0.19, { d: 0.2 + 0.1 * (i % 3), vol: 0.013, bp: 1300 + 500 * ((i * 7) % 5) / 4, q: 0.9, attack: 0.05 });
    sc.hit(T_CAP, { d: 0.12, vol: 0.022, lp: 520 });
    sc.hit(T_YEL - 0.3, { d: 0.34, vol: 0.02, bp: 2600, q: 1.1, attack: 0.12 });
    sc.hit(T_BOW - 0.05, { d: 0.7, vol: 0.024, bp: 1100, q: 0.6, attack: 0.25 }); sc.hit(T_RISE, { d: 0.6, vol: 0.022, bp: 1500, q: 0.6, attack: 0.25 });
    sc.done();
    this.clear();
  },

  clear() { const c = this.mesh.geometry.attributes.color; c.array.fill(0); c.needsUpdate = true; this.mesh.visible = false; this.hidden.fill(0); this.shadow.count = 0; },
  start(L) { this.clear(); this.band.from(0); this.bT = 0; },
  back(L) { this.bT = L.t; },
  end() { this.clear(); },
  reset() { this.clear(); },

  // ---------------------------------------------------------------- the pose at show-time t, into p
  // (with motion reduced the turn out of the bow is eased, arrives a beat late, and nothing swings on after it)
  poseAt(t, p, calm) {
    const late = calm ? 2 * Q : 0;
    const wC = sm(ramp(t, T_UP, T_UP + 0.36)) * (1 - sm(ramp(t, T_BOW, T_BOW + 0.45)));
    const wB = ease.inOut(ramp(t, T_BOW, T_LOW)) * (1 - sm(ramp(t, T_RISE, T_RISE + 0.55 + late)));
    const q = ramp(t, T_RISE + 0.08, T_POSE + late), wP = calm ? sm(q) : 0.5 * (sm(q) + q * q);      // (gathering speed, to stop dead on the note; what is loose swings on: below)
    for (let i = 0; i < P_KEYS.length; i++) { const k = P_KEYS[i]; p[k] = REST[k] + wC * (CHEST[k] - REST[k]) + wB * (BOW[k] - REST[k]) + wP * (PICT[k] - REST[k]); }
    // the sleeve goes wide as the bow goes down: across the chest first, opening at the bottom
    const sweep = ease.inOut(ramp(t, T_BOW + 0.05, T_LOW + 0.1));
    p.La += wB * (1 - sweep) * -0.5; p.Lex += wB * (1 - sweep) * 1.2; p.Lf -= wB * (1 - sweep) * 0.4; p.sp += wB * 0.07 * ramp(t, T_LOW, T_RISE); p.Lw -= wB * 0.25 * ramp(t, T_LOW, T_RISE);      // (and at the bottom it goes on sinking a little: a held bow is not still)
    // the cap settling (the costume gives under it), and what follows a stop: the cap and the cuff swing on a moment
    const dc = t - T_CAP; if (dc > 0 && dc < 0.9) { const k = Math.exp(-dc * 6) * Math.sin(dc * 17); p.dH -= 0.012 * k; p.hp += 0.16 * k; p.cp += 0.05 * k; }
    const dp = t - T_POSE - late; if (!calm && dp > 0 && dp < 1.6) { const k = Math.exp(-dp * 4.2) * Math.sin(dp * 15); p.hr += 0.13 * k; p.hp -= 0.1 * k; p.Lez += 0.14 * k; p.sr += 0.02 * k; p.Ra += 0.07 * k; p.psi -= 0.07 * k; p.sy -= 0.08 * k; p.Lwz += 0.3 * Math.exp(-dp * 3.4) * Math.sin(dp * 11 - 0.6); }
    // and after: it holds the pose, breathing; the cuff turns a little on the long trills
    if (dp > 0) {
      const w = sm(ramp(dp, 0.6, 1.8)), br = Math.sin(dp * 1.25);
      p.sp += w * 0.016 * br; p.dH += w * 0.0025 * br; p.hy += w * 0.05 * Math.sin(dp * 0.43); p.Lez += w * 0.03 * Math.sin(dp * 0.9 + 1);
      for (let b = 8; b <= 16; b += 8) { const d = t - bar(b); if (d > 0 && d < 1.3) { const k = Math.sin(Math.PI * d / 1.3); p.Ly += 0.4 * k * Math.sin(d * 13); p.Lez += 0.12 * k; p.hp += 0.05 * k; } }
    }
    return p;
  },

  // rest -> world for every bone (3 x 4, rows) into M, from a pose; and the light in each bone's own space into lb
  bones(L, p, capUp, M, lb) {
    const W = M[B_HIP], c = Math.cos(p.psi), s = Math.sin(p.psi), U = CU + p.dU, O = CO + p.dO;
    W[0] = (L.tx * c - L.nx * s) * SC; W[1] = 0; W[2] = (L.tx * s + L.nx * c) * SC; W[3] = L.cx + L.tx * U + L.nx * O;
    W[4] = 0; W[5] = SC; W[6] = 0; W[7] = L.y + WAIST + p.dH;
    W[8] = (L.tz * c - L.nz * s) * SC; W[9] = 0; W[10] = (L.tz * s + L.nz * c) * SC; W[11] = L.cz + L.tz * U + L.nz * O;
    for (let k = 0; k < 3; k++) this.child(M[k + 1], M[k], 0, JT[k], 0, p.sy * SPINE[k], p.sp * SPINE[k], p.sr * SPINE[k]);
    const C = M[B_CHEST];
    this.child(M[B_COL], C, 0, NECK, 0, p.cy, p.cp, p.cr);
    this.child(M[B_CAP], C, 0, HEADP, 0, p.hy, p.hp, p.hr, capUp);
    this.child(M[B_LU], C, AL.S[0], AL.S[1], AL.S[2], p.Ly, -p.Lf, p.La); this.child(M[B_LF], M[B_LU], AL.E[0], AL.E[1], AL.E[2], 0, -p.Lex, p.Lez); this.child(M[B_LH], M[B_LF], AL.H[0], AL.H[1], AL.H[2], 0, -p.Lw, p.Lwz);
    this.child(M[B_RU], C, AR.S[0], AR.S[1], AR.S[2], -p.Ry, -p.Rf, -p.Ra); this.child(M[B_RF], M[B_RU], AR.E[0], AR.E[1], AR.E[2], 0, -p.Rex, -p.Rez); this.child(M[B_RH], M[B_RF], AR.H[0], AR.H[1], AR.H[2], 0, -p.Rw, -p.Rwz);
    this.child(M[B_LW], C, AL.S[0], AL.S[1], 0, 0, -p.Lf * 0.2, Math.max(0, p.La) * 0.4); this.child(M[B_RW], C, AR.S[0], AR.S[1], 0, 0, -p.Rf * 0.2, -Math.max(0, p.Ra) * 0.4);
    // (the light in each bone's own space, so a normal at rest can be lit without turning it)
    const l = this.light, k = 1 / SC;
    for (let b = 0; b < NB; b++) { const m = M[b]; lb[b * 3] = (m[0] * l.x + m[4] * l.y + m[8] * l.z) * k; lb[b * 3 + 1] = (m[1] * l.x + m[5] * l.y + m[9] * l.z) * k; lb[b * 3 + 2] = (m[2] * l.x + m[6] * l.y + m[10] * l.z) * k; }
  },
  // out = parent · (a turn about the pivot: yaw, then pitch, then roll), lifted `up` along its own y afterwards
  child(out, par, px, py, pz, yaw, pitch, roll, up = 0) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch), cz = Math.cos(roll), sz = Math.sin(roll), m = this.tl_;
    m[0] = cy * cz + sy * sx * sz; m[1] = -cy * sz + sy * sx * cz; m[2] = sy * cx;
    m[4] = cx * sz; m[5] = cx * cz; m[6] = -sx;
    m[8] = -sy * cz + cy * sx * sz; m[9] = sy * sz + cy * sx * cz; m[10] = cy * cx;
    m[3] = px - (m[0] * px + m[1] * py + m[2] * pz) + m[1] * up; m[7] = py - (m[4] * px + m[5] * py + m[6] * pz) + m[5] * up; m[11] = pz - (m[8] * px + m[9] * py + m[10] * pz) + m[9] * up;
    for (let r = 0; r < 3; r++) {
      const a = par[r * 4], b = par[r * 4 + 1], c = par[r * 4 + 2];
      out[r * 4] = a * m[0] + b * m[4] + c * m[8]; out[r * 4 + 1] = a * m[1] + b * m[5] + c * m[9]; out[r * 4 + 2] = a * m[2] + b * m[6] + c * m[10]; out[r * 4 + 3] = a * m[3] + b * m[7] + c * m[11] + par[r * 4 + 3];
    }
  },
  // a point of a stroke (x, y, z) and its half width (bx, by, bz), at rest, put where bones a and b (blended w) have it: into this.o
  put(M, a, b, w, x, y, z, bx, by, bz) {
    const o = this.o, ma = M[a];
    let X = ma[0] * x + ma[1] * y + ma[2] * z + ma[3], Y = ma[4] * x + ma[5] * y + ma[6] * z + ma[7], Z = ma[8] * x + ma[9] * y + ma[10] * z + ma[11];
    let WX = ma[0] * bx + ma[1] * by + ma[2] * bz, WY = ma[4] * bx + ma[5] * by + ma[6] * bz, WZ = ma[8] * bx + ma[9] * by + ma[10] * bz;
    if (w > 0) {
      const mb = M[b];
      X += (mb[0] * x + mb[1] * y + mb[2] * z + mb[3] - X) * w; Y += (mb[4] * x + mb[5] * y + mb[6] * z + mb[7] - Y) * w; Z += (mb[8] * x + mb[9] * y + mb[10] * z + mb[11] - Z) * w;
      WX += (mb[0] * bx + mb[1] * by + mb[2] * bz - WX) * w; WY += (mb[4] * bx + mb[5] * by + mb[6] * bz - WY) * w; WZ += (mb[8] * bx + mb[9] * by + mb[10] * bz - WZ) * w;
    }
    o[0] = X; o[1] = Y; o[2] = Z; o[3] = WX; o[4] = WY; o[5] = WZ;
  },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return';
    if (!showing && !back) return;
    const t = back ? this.bT + L.r : L.t, ret = back ? L.ret : 0, calm = L.calm, late = calm ? 2 * Q : 0;
    // ---- the pose, now and at the moments just past. While it moves (the bow, the turn) the strokes let go a
    // little and stream behind: each is drawn where the form WAS, the further along it the longer ago.
    const E = sm(ramp(t, T_BOW - 0.05, T_BOW + 0.35)) * (1 - sm(ramp(t, T_POSE + late + 0.12, T_POSE + late + 0.8)));
    const nT = E > 0.002 ? NT : 1, MT = this.MT, lbT = this.lbT;
    for (let i = 0; i < nT; i++) {
      const ti = t - i * DTS, p = this.poseAt(ti, this.p, calm), was = this.poseAt(ti - 0.07, this.p0, calm);
      p.hp += (was.sp - p.sp) * 0.5; p.hr += (was.psi - p.psi) * 0.6; p.cp += (was.sp - p.sp) * 0.2;      // (the cap rides a moment behind the body: it is only resting there)
      if (back) { const k = sm(ramp(ret, 0, 0.35)) * 0.6; for (let j = 0; j < P_KEYS.length; j++) { const key = P_KEYS[j]; p[key] += (REST[key] - p[key]) * k; } }
      if (i === 0) this.dU = p.dU;
      this.bones(L, p, 0.06 * ease.bounce(ramp(ti, T_CAP - 0.16, T_CAP + 0.24)) + (back ? 0.04 * ease.in(ramp(ret, 0, 0.2)) : 0), MT[i], lbT[i]);
    }
    const pos = this.mesh.geometry.attributes.position.array, cl = this.mesh.geometry.attributes.color.array, o = this.o;
    // ---- the strokes
    const cam = L.k.G.camera.position, F = this.f, S = this.S, NP = K + 1, taper = this.taper;
    const railH = this.railH, sC = this.sC, sN = this.sN, sBn = this.sB, sSkin = this.sSkin, sH = this.sH;
    const X0 = L.cx, Z0 = L.cz, Y0 = L.y, tx = L.tx, tz = L.tz, nx = L.nx, nz = L.nz;
    const spinSlow = calm ? 0.28 : 0.56, spinFast = calm ? 3.6 : 7.2, dU = this.dU;
    for (let i = 0; i < this.NS; i++) {
      const st = S[i], T2 = calm && st.T2C != null ? st.T2C : st.T2, turn = calm && st.T2C != null ? st.turnC : st.turn, te = t - (calm && st.eC != null ? st.eC : st.e);
      if (te <= 0) { if (!this.hidden[i]) { this.hidden[i] = 1; for (let j = 0; j < NP * 2; j++) cl[(i * NP * 2 + j) * 4 + 3] = 0; } continue; }
      this.hidden[i] = 0;
      const land = st.kind === 0 || st.kind === 3;
      // where it comes out from under the frame, and where it joins the whirl
      const p0u = st.u0, p0h = railH - 0.02, p0o = -0.07, ca = Math.cos(st.a0), sa = Math.sin(st.a0);
      const p3u = CU + RE * ca, p3h = 0.06, p3o = CO + RE * sa, p2u = p3u + 0.26 * sa, p2h = 0.17, p2o = p3o - 0.26 * ca, p1u = st.u0, p1h = railH - 0.45, p1o = 0.11;
      for (let j = 0; j < NP; j++) {
        const s = j / K, tau = te - s * st.lag, k3 = (i * NP + j) * 3;
        let m = 0, vis = tau > 0 ? 1 : 0, u = p0u, h = p0h, oo = p0o;
        // ---- on its way
        if (st.direct) {
          // (a button: one quick arc from under the frame to its place)
          const q = clamp01(tau / T1); m = sm(ramp(q, 0.55, 1));
          if (m < 1) { const e = q * q * (3 - 2 * q), g = 1 - e; u = g * g * p0u + 2 * g * e * (CU + 0.1) + e * e * CU; h = g * g * p0h + 2 * g * e * (railH - 0.2) + e * e * (WAIST + 0.2); oo = g * g * p0o + 2 * g * e * (CO + 0.5) + e * e * (CO + 0.14); }
        } else if (tau < T1) {
          const q = Math.pow(clamp01(tau / T1), 1.12), g = 1 - q, b0 = g * g * g, b1 = 3 * g * g * q, b2 = 3 * g * q * q, b3 = q * q * q;
          u = b0 * p0u + b1 * p1u + b2 * p2u + b3 * p3u; h = b0 * p0h + b1 * p1h + b2 * p2h + b3 * p3h; oo = b0 * p0o + b1 * p1o + b2 * p2o + b3 * p3o;
          if (!land) m = sm(ramp(q, 0.5, 1));
        } else if (land) {
          const k = Math.min(1, (tau - T1) / T2), a = st.a0 + turn * k, r = lerp(RE, st.rT, sm(k));
          u = CU + r * Math.cos(a); oo = CO + r * Math.sin(a); h = lerp(0.06, st.hT, Math.pow(k, 1.25));
          m = sm(ramp(tau, T1 + T2 - 0.2, T1 + T2 + 0.02));
        } else m = 1;
        if (m < 1) { F.x[j] = X0 + tx * u + nx * oo; F.y[j] = Y0 + Math.max(0.012, h); F.z[j] = Z0 + tz * u + nz * oo; }
        // ---- where it belongs
        let lit = 1;
        if (m > 0) {
          if (land) {
            const a = sSkin[k3] | 0, b = sSkin[k3 + 1] | 0, w = sSkin[k3 + 2], along = st.rev ? 1 - s : s;
            let x = sC[k3], y = sC[k3 + 1], z = sC[k3 + 2]; const bx = sBn[k3], by = sBn[k3 + 1], bz = sBn[k3 + 2];
            if (st.wob) { const wv = st.wob * 0.005 * Math.sin(s * 6.5 + st.ph - t * 1.4) * (0.3 + s) / sH[i * NP + j]; x += bx * wv; y += by * wv; z += bz * wv; }       // the stripes still moving
            // (streaming: off the form a little, in a wave; and where the form was a moment ago)
            let i0 = 0, fr = 0;
            if (E > 0.002 && (st.D || st.d0)) {
              const lo = E * st.loose * along * (0.022 + 0.012 * Math.sin(s * 8 - t * 9 + st.ph)); x += sN[k3] * lo; y += sN[k3 + 1] * lo; z += sN[k3 + 2] * lo;
              if (st.fling) { const fl = E * st.fling * along, q = st.from; x += (x - q[0]) * fl; y += (y - q[1]) * fl; z += (z - q[2]) * fl; }
              const f = Math.min(NT - 1, E * (st.d0 + st.D * along) / DTS); i0 = Math.min(NT - 2, f | 0); fr = f - i0;
            }
            this.put(MT[i0], a, b, w, x, y, z, bx, by, bz);
            let X = o[0], Y = o[1], Z = o[2], WX = o[3], WY = o[4], WZ = o[5];
            if (fr > 0.003) { this.put(MT[i0 + 1], a, b, w, x, y, z, bx, by, bz); X += (o[0] - X) * fr; Y += (o[1] - Y) * fr; Z += (o[2] - Z) * fr; WX += (o[3] - WX) * fr; WY += (o[4] - WY) * fr; WZ += (o[5] - WZ) * fr; }
            if (st.fling && E > 0.002) { const top = Y0 + Math.min(0.74, 0.3 + 0.72 * (1 - ((X - X0) * nx + (Z - Z0) * nz))); if (Y > top) Y = top + (Y - top) * 0.25; }      // (a ribbon is thrown wide and low: the further out into the room, the lower, so that from the floor it never crosses the pictures)
            F.tx[j] = X; F.ty[j] = Y; F.tz[j] = Z; F.wx[j] = WX; F.wy[j] = WY; F.wz[j] = WZ;
            const lb = lbT[i0], d = sN[k3] * lb[a * 3] + sN[k3 + 1] * lb[a * 3 + 1] + sN[k3 + 2] * lb[a * 3 + 2];
            lit = (0.68 + 0.46 * Math.pow(0.5 + 0.5 * d, 1.3) + 0.6 * st.bright * Math.max(0, d)) * (1.08 - 0.2 * s);
          } else {
            // (in the whirl: round the foot of the costume, fast as it arrives and slowing to a turn)
            const th = Math.max(0, te - T1), om = spinFast * (1 - Math.exp(-th / 0.8)) * 0.8 * st.sp + spinSlow * st.sp * th, r = st.r * (1 + 0.04 * Math.sin(t * 0.9 + st.ph)) * (st.kind === 2 ? 1 + 0.55 * s : 1), a = st.a0 + om - s * st.len / st.r;
            const flat = st.kind === 2, hh = st.h + st.rise * s + (flat ? 0 : 0.012 * Math.sin(a * 2 + st.ph + t)), cu = Math.cos(a), so = Math.sin(a);
            const uu = CU + dU * 0.5 + r * cu, ou = CO + r * so, hw = st.hw * taper(s);
            F.tx[j] = X0 + tx * uu + nx * ou; F.ty[j] = Y0 + hh; F.tz[j] = Z0 + tz * uu + nz * ou;
            // (upright and leaning in, like a skirt's panel; or lying flat on the boards)
            const ru = flat ? cu : -0.42 * cu, rh = flat ? 0 : 0.9, ro = flat ? so : -0.42 * so;
            F.wx[j] = (tx * ru + nx * ro) * hw; F.wy[j] = rh * hw; F.wz[j] = (tz * ru + nz * ro) * hw;
            lit = flat ? 0.95 : 0.8 + 0.36 * Math.pow(0.5 + 0.5 * (-0.55 * cu + 0.55 * so), 1.3);
          }
        }
        F.m[j] = m; F.vis[j] = vis; F.lit[j] = lit;
      }
      // ---- its edges: turned to the eye while it flies, lying on the form once it has landed
      for (let j = 0; j < NP; j++) {
        const m = F.m[j], s = j / K; let cx_, cy_, cz_, wx, wy, wz;
        if (m < 1) {
          const j0 = F.m[Math.max(0, j - 1)] < 1 ? Math.max(0, j - 1) : j, j1 = F.m[Math.min(K, j + 1)] < 1 ? Math.min(K, j + 1) : j;
          let dx = F.x[j1] - F.x[j0], dy = F.y[j1] - F.y[j0], dz = F.z[j1] - F.z[j0]; if (dx * dx + dy * dy + dz * dz < 1e-10) { dx = 0; dy = -1; dz = 0; }
          const ex = cam.x - F.x[j], ey = cam.y - F.y[j], ez = cam.z - F.z[j];
          wx = dy * ez - dz * ey; wy = dz * ex - dx * ez; wz = dx * ey - dy * ex;
          const hw = (land ? sH[i * NP + j] : st.hw * taper(s)) / (Math.hypot(wx, wy, wz) || 1);
          wx *= hw; wy *= hw; wz *= hw; cx_ = F.x[j]; cy_ = F.y[j]; cz_ = F.z[j];
          if (m > 0) { cx_ += (F.tx[j] - cx_) * m; cy_ += (F.ty[j] - cy_) * m; cz_ += (F.tz[j] - cz_) * m; wx += (F.wx[j] - wx) * m; wy += (F.wy[j] - wy) * m; wz += (F.wz[j] - wz) * m; }
        } else { cx_ = F.tx[j]; cy_ = F.ty[j]; cz_ = F.tz[j]; wx = F.wx[j]; wy = F.wy[j]; wz = F.wz[j]; }
        let al = F.vis[j];
        // ---- going back: off the form from the cap down, back to the wall, up it and in under the frame
        if (back) {
          const q = ease.inOut(ramp(ret - s * 0.035, st.back, st.back + 0.36));
          if (q > 0) {
            const g = 1 - q, b0 = g * g * g, b1 = 3 * g * g * q, b2 = 3 * g * q * q, b3 = q * q * q;
            const oc = ((cx_ - X0) * nx + (cz_ - Z0) * nz - 0.07) * 0.65, ax = cx_ - nx * oc, ay = cy_ + 0.1, az = cz_ - nz * oc, bu = st.u0 * 0.8, bx_ = X0 + tx * bu + nx * 0.05, by_ = Y0 + railH - 0.55, bz_ = Z0 + tz * bu + nz * 0.05;      // (back to the wall first, then up it: nothing rises in front of a neighbour)
            const ex_ = X0 + tx * st.u0 + nx * -0.07, ey_ = Y0 + railH - 0.02, ez_ = Z0 + tz * st.u0 + nz * -0.07;
            // (the way it is going, to turn its face to the eye again as it flies)
            const dx = 3 * g * g * (ax - cx_) + 6 * g * q * (bx_ - ax) + 3 * q * q * (ex_ - bx_), dy = 3 * g * g * (ay - cy_) + 6 * g * q * (by_ - ay) + 3 * q * q * (ey_ - by_), dz = 3 * g * g * (az - cz_) + 6 * g * q * (bz_ - az) + 3 * q * q * (ez_ - bz_);
            cx_ = b0 * cx_ + b1 * ax + b2 * bx_ + b3 * ex_; cy_ = b0 * cy_ + b1 * ay + b2 * by_ + b3 * ey_; cz_ = b0 * cz_ + b1 * az + b2 * bz_ + b3 * ez_;
            const vx = cam.x - cx_, vy = cam.y - cy_, vz = cam.z - cz_; let fx = dy * vz - dz * vy, fy = dz * vx - dx * vz, fz = dx * vy - dy * vx;
            const hl = Math.hypot(wx, wy, wz) * (1 - 0.6 * ramp(q, 0.8, 1)) / (Math.hypot(fx, fy, fz) || 1), k = sm(ramp(q, 0, 0.25)); fx *= hl; fy *= hl; fz *= hl;
            wx += (fx - wx) * k; wy += (fy - wy) * k; wz += (fz - wz) * k;
            if (q > 0.97) al = 0;
          }
        }
        // (the paint stands up along one edge and takes the light there)
        const v = (i * NP + j) * 2, k = v * 3, c = v * 4, lit = lerp(1, F.lit[j], m), e0 = st.flip ? 0.88 : 1.14, e1 = st.flip ? 1.14 : 0.88;
        pos[k] = cx_ - wx; pos[k + 1] = Math.max(Y0 + 0.008, cy_ - wy); pos[k + 2] = cz_ - wz; pos[k + 3] = cx_ + wx; pos[k + 4] = Math.max(Y0 + 0.008, cy_ + wy); pos[k + 5] = cz_ + wz;
        cl[c] = st.col.r * lit * e0; cl[c + 1] = st.col.g * lit * e0; cl[c + 2] = st.col.b * lit * e0; cl[c + 3] = al;
        cl[c + 4] = st.col.r * lit * e1; cl[c + 5] = st.col.g * lit * e1; cl[c + 6] = st.col.b * lit * e1; cl[c + 7] = al;
      }
    }
    this.mesh.geometry.attributes.position.needsUpdate = true; this.mesh.geometry.attributes.color.needsUpdate = true; this.mesh.visible = true;
    // ---- its shadow on the boards (faint: it is a drawing, and the light goes through it)
    const W = MT[0][B_HIP], dark = sm(ramp(t, 0.9, 2.4)) * (back ? 1 - sm(ramp(ret, 0.2, 0.7)) : 1);
    this.shadow.count = dark > 0.01 ? 1 : 0; this.shadow.set(0, W[3] + L.nx * 0.03, W[11] + L.nz * 0.03, 0.26, 0.62 * dark);
    // ---- the band
    const v = L.voice(); v.level = calm ? 0.55 * (0.35 + 0.65 * ramp(t, 0.3, 2.4)) : 1; v.place(L.cx, L.cz, 14);
    if (showing) this.band.play(L.t);
  },
});
