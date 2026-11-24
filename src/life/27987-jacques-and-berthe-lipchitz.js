// Amedeo Modigliani, Jacques and Berthe Lipchitz (1916), Gallery 391. The word: sitting.
//
// A wedding portrait. The sculptor Jacques Lipchitz stands, one hand in his jacket pocket and the other on the
// shoulder of his wife, the poet Berthe Lipchitz, who sits below him in a dark dress with a wide white collar, her
// head a little inclined towards him. Behind them a room in flat scrubbed patches: a grey-green wall, a brown
// rectangle leaning on it, a pale upright band, an ochre panel; and across the wall, in the painter's thin capitals,
// their name. The museum's note says Lipchitz commissioned it from his friend on the occasion of the marriage, and
// that, according to Lipchitz, it took Modigliani only two days to paint, though Lipchitz persuaded him to work on it
// for another two weeks so as to pay him a larger fee. So this is a picture of two people keeping still together, and
// of how long they kept it up: a sitting, and then a longer one.
//
// They come out, because the picture is about nothing but the two of them, and what they do in the room is only
// what they do in the picture. Look, and the room is scrubbed onto the wall under the picture, the ochre panel
// first; a low wooden stool stands up in front of it. She comes in by the ochre panel, crosses to the stool, turns and
// sits, and folds her hands. He comes in after her, goes round behind, and stands at her shoulder; one hand goes to
// his pocket. The other lifts, waits a moment over her shoulder, and comes down to rest on it, on a low note; she
// inclines her head towards him, on a higher one, and the two notes ring together. That is the picture, and they hold
// it, looking out at whoever stands where the painter stood (you). While they hold it the name is lettered on the
// wall beside his head, a letter at a time, as it is in the picture. Then the brush stops. His hand lifts; she
// straightens and looks up at him, and he down at her: done? He looks back out, gives a small nod, and lays his hand
// on her shoulder again; she turns back and inclines her head as before; the two notes again. The sitting goes on, for
// as long as you keep looking: they breathe, the brush works, now and then one glances at the other. When you stop
// she gets up, they go out the way they came, and the room is rubbed off the wall behind them.
//
// How they are made: his paint is thin and flat, scrubbed over the weave, and everything is held in a dark, slow line.
// So each of them is a set of soft rounded forms in his close tones (maroon, slate, the terracotta of his flesh; her
// black, her white collar, a paler flesh with his rose on the cheeks), every form mottled and laid over with broad
// thin scrubs of nearly the same colour, and bounded by a blue-black contour that swells and thins as the form turns.
// The faces are his few lines: the brows running into the nose, a small mouth, dark almond eyes; nothing is enlarged,
// lengthened or made fun of. The room on the wall is flat paint, with ragged dry edges and the gallery wall showing
// through. One rig (the two of them and the stool), one flat mesh on the wall (the room and the lettering), and the
// soft shadows at their feet: three draw calls. Nothing is solid, nothing stays out after the look, and nothing stands
// higher than 0.8 m, well under every frame on this wall and to the right of the floor Matisse's geranium uses.
//
// No tune: a sitting is quiet. Steps, the stool, a brush on canvas, and two plain notes, his and hers (E and the G
// sharp above it, in the key the geranium next door rings in). With "Reduce motion and flashing" on, nothing settles
// with a bounce, the glances are slower, and it is all quieter; nothing here flashes at any setting.
//
// What it does not do: it gives them no story but the museum's (a wedding portrait, two days, and two weeks more at
// his asking); nothing is made of where they came from, what they believed or what became of them; the painter is
// not shown, only heard, and his signature is not copied onto the wall; the stool and the lower half of both figures
// are ours (the picture stops at the waist), plain and dark so as to claim nothing; and their looks are his drawing
// of them, followed quietly, because they were real people and these are their faces.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture } from '../paintlife.js';
import { score, inked, Bones, hump, turnTo } from './stagecraft.js';

const PI = Math.PI, TAU = PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const smooth = (x, a, b) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };

// ---------------------------------------------------------------- the timeline (seconds of show)
const B_IN = [0.25, 2.4], J_IN = [0.7, 2.75];           // she comes in and crosses to the stool; he follows
const SIT = [2.5, 3.3];                                 // she sits
const POCKET = [2.95, 3.5];                             // his right hand, to his pocket
const LIFT = [3.4, 3.95], T_HAND = 4.4;                 // his left lifts, waits over her shoulder, and comes down
const TILT = [4.45, 5.0];                               // she inclines her head to him
const WRITE = [4.9, 6.25];                              // the name is lettered on the wall
const EASE = [6.6, 7.3], AGAIN = [7.7, 8.15], TILT2 = [8.1, 8.65];      // done? no: again
const IDLE = 9.2;
// ---------------------------------------------------------------- the floor (metres: along the wall, out from it)
const DOOR = [0.66, -0.26];
const B_STAND = [0.16, 0.61], J_STAND = [0.07, 0.37], STOOL = [0.16, 0.485];
const B_WAY = [DOOR, [0.66, 0.14], [0.55, 0.5], [0.36, 0.64], [0.2, 0.62], B_STAND];
const J_WAY = [DOOR, [0.66, 0.1], [0.5, 0.29], [0.28, 0.3], [0.11, 0.29], J_STAND];
const J_YAW = 0.14, B_YAW = -0.04;                      // how they stand in the end, turned from square to the wall
// ---------------------------------------------------------------- the room on the wall (metres along it, and up)
const BU0 = -0.66, BU1 = 0.86, BW = BU1 - BU0, RW = 1024, RH = 544, PXM = RW / BW, BH = RH / PXM;
const NAME = { u0: 0.125, u1: 0.415, h0: 0.485, h1: 0.552 };
const GLYPH = {
  L: [0.62, [[0.12, 1], [0.1, 0.02], [0.9, 0.06]]],
  I: [0.22, [[0.5, 1], [0.5, 0]]],
  P: [0.64, [[0.14, 0], [0.16, 1]], [[0.16, 1], [0.62, 0.97], [0.86, 0.76], [0.64, 0.52], [0.16, 0.48]]],
  C: [0.7, [[0.9, 0.82], [0.62, 1], [0.28, 0.86], [0.12, 0.5], [0.28, 0.13], [0.62, 0], [0.92, 0.16]]],
  H: [0.7, [[0.12, 1], [0.14, 0]], [[0.14, 0.5], [0.86, 0.53]], [[0.88, 1], [0.86, 0]]],
  T: [0.74, [[0.04, 0.97], [0.96, 1]], [[0.5, 1], [0.52, 0]]],
  Z: [0.72, [[0.1, 0.98], [0.9, 1], [0.1, 0.02], [0.94, 0.05]]],
};
// ---------------------------------------------------------------- their bones (metres; he stands 0.57, she 0.52)
const JK = { TH: 0.145, LEG: 0.275, HIP: 0.275, SH: [0.056, 0.166], NECK: [0.19, 0.004], AU: 0.105, AF: 0.103, STRIDE: 0.225, SWING: 0.42 };
const BK = { TH: 0.125, KNEE: 0.145, SH: [0.047, 0.15], NECK: 0.172, AU: 0.085, AF: 0.082, STRIDE: 0.19 };
const INK = '#1e2130';

// A way over the floor, by arc length: w.at(s 0..1, o) fills o.u, o.out and the heading o.du, o.dout; w.steps is how
// many steps it takes (a whole number, so a walk along it ends with the feet together).
function way(pts, stride) {
  const c = new THREE.CatmullRomCurve3(pts.map(p => V3(p[0], 0, p[1])), false, 'centripetal'); c.arcLengthDivisions = 200; c.updateArcLengths();
  const len = c.getLength(), v = V3(), d = V3();
  return { len, steps: Math.max(1, Math.round(len / stride)), at(s, o) { s = clamp01(s); c.getPointAt(s, v); c.getTangentAt(s, d); o.u = v.x; o.out = v.z; o.du = d.x; o.dout = d.z; return o; } };
}
// Setting off and stopping: the distance gone (0..1) at time x (0..1), a sixth of the time to get going and to stop.
const prof = x => { x = clamp01(x); const a = 0.17; return x < a ? (x * x) / (2 * a) / (1 - a) : x > 1 - a ? 1 - ((1 - x) * (1 - x)) / (2 * a) / (1 - a) : (x - a / 2) / (1 - a); };
const invProf = s => { let a = 0, b = 1; for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (prof(m) < s) a = m; else b = m; } return (a + b) / 2; };

lifeFor(27987, {
  title: /^Jacques and Berthe Lipchitz/,
  word: 'sitting',
  // (a small work hung high: the kit keeps the whole of it in view over the two of them at the foot of the wall)
  stage: { out: 1.1, half: 1.05, cam: { dist: 2.3, side: 0.14, height: 0.85, fov: 58, lookU: 0.12, lookOut: 0.4, lookH: 0.9, floorOut: 0.8 } },
  wake: 2, ret: 2.6,

  build(L) {
    const P = L.pal, col = (h, a = 0.14) => P.near(h, a), rand = L.rand;
    const SET = (a, b, c, f = 34) => ({ c: [col(a), col(b), col(c)], f });
    const MAROON = SET('#5c2b27', '#6f342c', '#43201f'), SLATE = SET('#54666a', '#63777a', '#45565b'), TROU = SET('#2d2628', '#382d2e', '#221d20');
    const FLESH_J = SET('#c57a56', '#d0875f', '#b66a4b', 24), HAIR_J = SET('#472223', '#572a2a', '#371b1d');
    const DRESS = SET('#21232b', '#2b2e39', '#191a20'), FLESH_B = SET('#dc966e', '#e5a47c', '#d08864', 24), HAIR_B = SET('#1d1819', '#2b2325', '#141112');
    const COLLAR = SET('#c6cdcb', '#dae0de', '#afb9ba', 70), WOOD = SET('#8d6030', '#a47436', '#72481f'), SHOE = SET('#1a1718', '#252021', '#121011');
    this.V = { v: V3(), w: V3(), d: V3(), p: V3(), el: V3(), tip: V3(), a: V3(), b: V3(), pole: V3(), q: new THREE.Quaternion(), one: V3(1, 1, 1), down: V3(0, -1, 0), m: new THREE.Matrix4(), s: V3() };
    this.B = new Bones();

    // ---------------------------------------------------------- his marks: a form, its scrubs, its line
    const h3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
    const vn = (x, y, z) => {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z); let fx = x - xi, fy = y - yi, fz = z - zi;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
      const a = lerp(lerp(h3(xi, yi, zi), h3(xi + 1, yi, zi), fx), lerp(h3(xi, yi + 1, zi), h3(xi + 1, yi + 1, zi), fx), fy);
      const b = lerp(lerp(h3(xi, yi, zi + 1), h3(xi + 1, yi, zi + 1), fx), lerp(h3(xi, yi + 1, zi + 1), h3(xi + 1, yi + 1, zi + 1), fx), fy);
      return lerp(a, b, fz);
    };
    const part = (d = 0.0032) => ({ solids: [], mp: [], mn: [], mc: [], d });
    const tc = new THREE.Color();
    // A solid's colour: his thin paint, never one flat tone: three close tones run into each other in soft patches.
    const tint = (g, S, seed) => {
      const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, f = S.f;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const a = vn(x * f + seed, y * f * 0.55 + seed * 1.7, z * f + 3.1), b = vn(x * f * 2.2 + 9.1 + seed, y * f * 1.3, z * f * 2.2 + seed);
        tc.copy(S.c[0]).lerp(S.c[1], smooth(a, 0.38, 0.72)).lerp(S.c[2], smooth(b, 0.5, 0.86) * 0.55).multiplyScalar(1 + 0.05 * n.getY(i));
        c.setXYZ(i, tc.r, tc.g, tc.b);
      }
    };
    let seedN = 1;
    const ell = (Pt, c, r, S, { rot = null, detail = 2 } = {}) => {
      const g = shape.move(shape.ball(1, 0xffffff, detail), c[0], c[1], c[2], rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0, r[0], r[1], r[2]);
      tint(g, S, seedN++ * 3.7); Pt.solids.push(g);
      const q = rot ? new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ')) : null;
      return { ell: true, c: V3(...c), r: V3(...r), q, qi: q ? q.clone().invert() : null };
    };
    const limb = (Pt, a, b, r0, r1, S, { seg = 12, caps = 3, detail = 1 } = {}) => {
      const A = V3(...a), Bv = V3(...b), ax = Bv.clone().sub(A), len = ax.length(); ax.normalize();
      const g = shape.cyl(r0, r1, len, seg, 0xffffff); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), ax));
      const m = A.clone().add(Bv).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); const sd = seedN++ * 3.7; tint(g, S, sd); Pt.solids.push(g);
      if (caps & 1) { const e = shape.move(shape.ball(r0, 0xffffff, detail), A.x, A.y, A.z); tint(e, S, sd); Pt.solids.push(e); }
      if (caps & 2) { const e = shape.move(shape.ball(r1, 0xffffff, detail), Bv.x, Bv.y, Bv.z); tint(e, S, sd); Pt.solids.push(e); }
      return { ell: false, a: A, b: Bv, ax, len, r0, r1 };
    };
    // The nearest point of a form's surface to p (through the middle of an ellipsoid, or out from a limb's axis),
    // lifted off it, and the normal there.
    const ta = V3(), tb = V3(), tp = V3();
    const snap = (s, p, lift, oP, oN) => {
      if (s.ell) {
        ta.copy(p).sub(s.c); if (s.qi) ta.applyQuaternion(s.qi);
        ta.set(ta.x / s.r.x, ta.y / s.r.y, ta.z / s.r.z).normalize();
        oN.set(ta.x / s.r.x, ta.y / s.r.y, ta.z / s.r.z).normalize(); oP.set(ta.x * s.r.x, ta.y * s.r.y, ta.z * s.r.z);
        if (s.q) { oP.applyQuaternion(s.q); oN.applyQuaternion(s.q); }
        oP.add(s.c).addScaledVector(oN, lift);
      } else {
        ta.copy(p).sub(s.a); const t = clamp01(ta.dot(s.ax) / s.len); tb.copy(s.a).addScaledVector(s.ax, t * s.len);
        oN.copy(p).sub(tb); if (oN.lengthSq() < 1e-12) oN.set(s.ax.y, -s.ax.x, 0); oN.normalize();
        oP.copy(tb).addScaledVector(oN, lerp(s.r0, s.r1, t) + lift);
      }
    };
    // The front of an upright ellipsoid at (x, y): the point of it you see from in front.
    const front = (s, x, y) => { const fx = x / s.r.x, fy = (y - s.c.y) / s.r.y; return V3(s.c.x + x, y, s.c.z + s.r.z * Math.sqrt(Math.max(0.02, 1 - fx * fx - fy * fy))); };
    const face = (s, fx, fy) => front(s, fx * s.r.x, s.c.y + fy * s.r.y);
    const e1 = V3(), e2 = V3(), e3 = V3();
    const tri = (Pt, a, b, c, n, ca, cb, cc) => {
      e1.copy(b).sub(a); e2.copy(c).sub(a); e3.crossVectors(e1, e2);
      const o = e3.dot(n) >= 0 ? [a, b, c, ca, cb, cc] : [a, c, b, ca, cc, cb];
      for (let i = 0; i < 3; i++) { Pt.mp.push(o[i].x, o[i].y, o[i].z); Pt.mn.push(n.x, n.y, n.z); Pt.mc.push(o[i + 3].r, o[i + 3].g, o[i + 3].b); }
    };
    // A ribbon of paint along points on a form, each edge laid on the form itself: his scrubs, and his lines.
    const ribbon = (Pt, s, pts, wid, c, lift, ridge = 0) => {
      const n = pts.length, Lp = [], Rp = [], N = [], tan = V3(), side = V3(), p = V3(), nn = V3();
      for (let i = 0; i < n; i++) {
        snap(s, pts[i], lift, p, nn); tan.copy(pts[Math.min(n - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]);
        side.crossVectors(nn, tan); if (side.lengthSq() < 1e-14) side.set(1, 0, 0); side.normalize();
        const w = typeof wid === 'number' ? wid : wid(i / (n - 1)), l = V3(), r = V3(), ln = V3();
        snap(s, tp.copy(p).addScaledVector(side, -w), lift, l, ln); snap(s, tp.copy(p).addScaledVector(side, w), lift, r, ln);
        Lp.push(l); Rp.push(r); N.push(nn.clone());
      }
      const ca = ridge ? c.clone().multiplyScalar(1 + ridge) : c, cb = ridge ? c.clone().multiplyScalar(1 - ridge * 0.7) : c;
      for (let i = 0; i < n - 1; i++) { tri(Pt, Lp[i], Rp[i], Rp[i + 1], N[i], cb, ca, ca); tri(Pt, Lp[i], Rp[i + 1], Lp[i + 1], N[i], cb, ca, cb); }
    };
    const SCRUB = [0.5, 0.88, 1, 0.97, 0.82, 0.46];
    const scrub = (Pt, s, p0, dir, l, w, c, lift = 0.0035, bend = 0) => {
      const pts = [], n0 = V3(), q = V3(), sd = V3(); snap(s, p0, 0, q, n0); sd.crossVectors(n0, dir).normalize();
      for (let i = 0; i < 6; i++) { const t = i / 5 - 0.5; pts.push(p0.clone().addScaledVector(dir, t * l).addScaledVector(sd, bend * l * (1 - 4 * t * t))); }
      ribbon(Pt, s, pts, t => (w / 2) * SCRUB[Math.round(t * 5)], c, lift, 0.05);
    };
    // A coat of scrubs over a form: n of them, running along `flow` (laid into the surface, turned a little).
    const tq = new THREE.Quaternion();
    const coat = (Pt, s, n, S, { l = [0.04, 0.07], w = [0.018, 0.03], flow = V3(0, -1, 0), jit = 0.7, keep = null, lift = 0.0035, tones = null } = {}) => {
      const p = V3(), nn = V3(), d = V3(), q = V3();
      for (let i = 0, tries = 0; i < n && tries < n * 8; tries++) {
        if (s.ell) { const yy = 1 - 2 * rand(), ph = rand() * TAU, r = Math.sqrt(Math.max(0, 1 - yy * yy)); q.set(r * Math.cos(ph) * s.r.x, yy * s.r.y, r * Math.sin(ph) * s.r.z); if (s.q) q.applyQuaternion(s.q); q.add(s.c); }
        else { const t = 0.06 + 0.88 * rand(), ph = rand() * TAU; e1.crossVectors(s.ax, Math.abs(s.ax.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0)).normalize(); e2.crossVectors(s.ax, e1); q.copy(s.a).addScaledVector(s.ax, t * s.len).addScaledVector(e1, Math.cos(ph)).addScaledVector(e2, Math.sin(ph)); }
        snap(s, q, 0, p, nn); if (keep && !keep(p, nn)) continue;
        d.copy(flow).addScaledVector(nn, -flow.dot(nn)); if (d.lengthSq() < 1e-4) d.set(nn.y, -nn.x, 0); d.normalize().applyQuaternion(tq.setFromAxisAngle(nn, (rand() - 0.5) * jit));
        const list = tones || S.c, c = list[Math.floor(rand() * list.length * 0.999)].clone().lerp(S.c[0], 0.5).multiplyScalar(0.97 + 0.09 * rand());
        scrub(Pt, s, p.clone(), d.clone(), lerp(l[0], l[1], rand()), lerp(w[0], w[1], rand()), c, lift, (rand() - 0.5) * 0.14); i++;
      }
    };
    // His line: through points on a form, fuller in the middle and thinning to its ends.
    const line = (Pt, s, pts, w, c, lift = 0.0045, n = 0) => {
      const cv = new THREE.CatmullRomCurve3(pts, false, 'centripetal').getPoints(n || Math.max(6, pts.length * 4));
      ribbon(Pt, s, cv, t => (w / 2) * (0.42 + 0.58 * Math.sin(PI * Math.min(1, Math.max(0, t * 0.92 + 0.04)))), c, lift);
    };
    // A patch of flat colour lying on a form: fn(s, t) -> a point near the form, for s, t in 0..1.
    const patch = (Pt, s, fn, ns, nt, cf, lift = 0.002) => {
      const G = [], N = [], C = [], p = V3(), nn = V3();
      for (let j = 0; j <= nt; j++) for (let i = 0; i <= ns; i++) { const a = V3(); snap(s, fn(i / ns, j / nt), lift, a, nn); G.push(a); N.push(nn.clone()); C.push(typeof cf === 'function' ? cf(i / ns, j / nt, a) : cf); }
      const id = (i, j) => j * (ns + 1) + i;
      for (let j = 0; j < nt; j++) for (let i = 0; i < ns; i++) {
        const a = id(i, j), b = id(i + 1, j), c = id(i + 1, j + 1), d = id(i, j + 1);
        tri(Pt, G[a], G[b], G[c], N[a], C[a], C[b], C[c]); tri(Pt, G[a], G[c], G[d], N[a], C[a], C[c], C[d]);
      }
    };
    // An almond lying on a face at (fx, fy), w wide and h high (in the face's own halves).
    const almond = (Pt, s, fx, fy, w, h, c, lift, tilt = 0) => patch(Pt, s, (a, b) => { const x = (a - 0.5) * w, y = (b - 0.5) * h * (1 - Math.pow(Math.abs(2 * a - 1), 1.7)); return face(s, fx + x, fy + y + x * tilt); }, 8, 2, c, lift);
    // A part, finished: its solids in his line, and the marks laid on them.
    const finish = Pt => {
      const g = inked(shape.merge(Pt.solids), Pt.d, col(INK, 0.05));
      if (!Pt.mp.length) return g;
      const m = new THREE.BufferGeometry();
      m.setAttribute('position', new THREE.Float32BufferAttribute(Pt.mp, 3)); m.setAttribute('normal', new THREE.Float32BufferAttribute(Pt.mn, 3)); m.setAttribute('color', new THREE.Float32BufferAttribute(Pt.mc, 3));
      return shape.merge([g, m]);
    };
    const DARK = col('#231a1c', 0.05), LINE = col(INK, 0.05);
    const DOWNISH = V3(0.25, -1, 0).normalize(), ACROSS = V3(1, 0.1, 0).normalize();

    // ---------------------------------------------------------- Jacques: the jacket, the slate jersey up to his chin
    const jTor = part(0.0036);
    {
      const t = ell(jTor, [0, 0.078, 0], [0.07, 0.122, 0.05], MAROON, { detail: 3 });
      const vw = y => lerp(0.002, 0.033, Math.pow(clamp01((y - 0.03) / 0.16), 0.85));       // the jersey showing in the V of the jacket
      const SL = SLATE.c;
      patch(jTor, t, (a, b) => { const y = lerp(0.192, 0.03, b); return front(t, (a - 0.5) * 2 * vw(y), y); }, 6, 12, (a, b) => SL[0].clone().lerp(SL[1], 0.5 + 0.5 * Math.sin(a * 5 + b * 9)).lerp(SL[2], 0.4 * b), 0.0022);
      coat(jTor, t, 44, MAROON, { l: [0.05, 0.085], w: [0.02, 0.034], flow: DOWNISH, jit: 0.9, keep: p => p.z < 0.01 || p.y < 0.03 || Math.abs(p.x) > vw(p.y) + 0.012 });
      coat(jTor, t, 7, SLATE, { l: [0.03, 0.045], w: [0.012, 0.018], flow: V3(0, -1, 0), jit: 0.4, lift: 0.0042, keep: p => p.z > 0.02 && p.y > 0.06 && p.y < 0.17 && Math.abs(p.x) < vw(p.y) - 0.008 });
      for (const sd of [-1, 1]) line(jTor, t, [0.19, 0.15, 0.1, 0.06, 0.03].map(y => front(t, sd * (vw(y) + 0.001), y)), 0.0046, LINE, 0.0052, 18);      // the lapels
      line(jTor, t, [front(t, 0.002, 0.03), front(t, 0.006, 0.0), front(t, 0.012, -0.036)], 0.004, LINE, 0.0052);      // the jacket's front edge, below the button
      patch(jTor, t, (a, b) => { const an = a * TAU, r = 0.0042 * b; return front(t, 0.005 + Math.cos(an) * r, 0.022 + Math.sin(an) * r); }, 8, 1, LINE, 0.0056);      // the button
      line(jTor, t, [front(t, -0.058, 0.022), front(t, -0.046, 0.012), front(t, -0.034, 0.008)], 0.003, LINE, 0.0052);      // the pocket his hand goes to
      const roll = limb(jTor, [0, 0.174, 0.004], [0, 0.204, 0.008], 0.0325, 0.0295, SLATE, { seg: 16, detail: 2 });
      coat(jTor, roll, 9, SLATE, { l: [0.03, 0.045], w: [0.01, 0.015], flow: ACROSS, jit: 0.3 });
      line(jTor, roll, Array.from({ length: 9 }, (_, i) => { const a = -1.9 + i * 0.475; return V3(Math.sin(a) * 0.04, 0.189 + 0.003 * Math.cos(a * 2), 0.006 + Math.cos(a) * 0.04); }), 0.003, LINE, 0.004, 26);      // the fold of the roll
    }
    const jHead = part(0.0024);
    {
      limb(jHead, [0, -0.014, 0], [0, 0.022, 0.002], 0.02, 0.019, FLESH_J, { caps: 0 });
      const hd = ell(jHead, [0, 0.05, 0.006], [0.04, 0.047, 0.041], FLESH_J, { detail: 3 });
      const hair = ell(jHead, [0, 0.07, -0.003], [0.0405, 0.034, 0.0425], HAIR_J, { detail: 3 });
      ell(jHead, [0, 0.046, -0.011], [0.0365, 0.042, 0.0345], HAIR_J, { detail: 2 });                                             // (down the nape, into his collar)
      for (const sd of [-1, 1]) { ell(jHead, [sd * 0.0405, 0.045, 0.0], [0.0058, 0.0118, 0.008], FLESH_J, { detail: 1 }); ell(jHead, [sd * 0.0372, 0.06, 0.008], [0.0048, 0.012, 0.009], HAIR_J, { detail: 1 }); }
      coat(jHead, hair, 12, HAIR_J, { l: [0.025, 0.04], w: [0.01, 0.016], flow: V3(0.2, -0.5, -1).normalize(), jit: 0.6, lift: 0.003, keep: p => p.y > 0.068 && p.z < 0.024 });
      coat(jHead, hd, 6, FLESH_J, { l: [0.018, 0.03], w: [0.009, 0.014], flow: V3(0.1, -1, 0).normalize(), jit: 0.5, lift: 0.0012, tones: [FLESH_J.c[0], FLESH_J.c[0].clone().lerp(FLESH_J.c[1], 0.5)], keep: p => p.z > 0.022 && p.y < 0.07 && p.y > 0.012 });
      const F = (x, y) => face(hd, x, y), shade = col('#b3623f', 0.1), lip = col('#b0523d', 0.1), eye = col('#55697a', 0.1);
      for (const sd of [-1, 1]) {
        line(jHead, hd, [F(sd * 0.16, 0.27), F(sd * 0.42, 0.33), F(sd * 0.7, 0.24)], 0.002, DARK, 0.0022);                           // the brows
        almond(jHead, hd, sd * 0.37, 0.07, 0.26, 0.085, eye, 0.0018, -sd * 0.1);
        line(jHead, hd, [F(sd * 0.24, 0.1), F(sd * 0.37, 0.12), F(sd * 0.5, 0.072)], 0.0015, DARK, 0.0024);                          // and the lids
      }
      const nose = ell(jHead, [0.001, 0.047, 0.006 + 0.041 - 0.0035], [0.0062, 0.0155, 0.0085], FLESH_J, { detail: 2 });
      line(jHead, hd, [F(0.16, 0.27), F(0.17, 0.17)], 0.002, DARK, 0.0022, 5);                                                         // the nose, in one line from the brow
      line(jHead, nose, [V3(0.02, 0.058, 0.05), V3(0.02, 0.047, 0.055), V3(0.02, 0.038, 0.055), V3(0.018, 0.033, 0.05)], 0.0019, DARK, 0.001, 10);
      line(jHead, nose, [V3(-0.012, 0.0325, 0.05), V3(0.0, 0.031, 0.06), V3(0.014, 0.033, 0.05)], 0.0016, DARK, 0.001, 8);
      line(jHead, hd, [F(-0.13, -0.5), F(0.02, -0.485), F(0.17, -0.5)], 0.0024, shade.clone().multiplyScalar(0.86), 0.0018);          // a little moustache, hardly there
      almond(jHead, hd, 0.02, -0.61, 0.34, 0.1, lip, 0.0018);
      line(jHead, hd, [F(-0.15, -0.61), F(0.02, -0.62), F(0.19, -0.605)], 0.0013, DARK, 0.0024);
    }
    const jArmU = part(), jArmF = part(), jThigh = part(), jShin = part();
    {
      ell(jArmU, [0, -0.002, 0], [0.0275, 0.029, 0.0275], MAROON, { detail: 2 });
      const u = limb(jArmU, [0, 0, 0], [0, -JK.AU, 0], 0.0245, 0.0215, MAROON, { caps: 2 });
      coat(jArmU, u, 9, MAROON, { l: [0.045, 0.07], w: [0.016, 0.024], jit: 0.5 });
      const f = limb(jArmF, [0, 0, 0], [0, -0.088, 0], 0.021, 0.0175, MAROON, { caps: 3 });
      coat(jArmF, f, 8, MAROON, { l: [0.04, 0.06], w: [0.014, 0.022], jit: 0.5 });
      const hand = ell(jArmF, [0, -JK.AF, 0.001], [0.0125, 0.018, 0.0095], FLESH_J, { detail: 2 });
      coat(jArmF, hand, 3, FLESH_J, { l: [0.014, 0.02], w: [0.007, 0.01], jit: 0.4, lift: 0.0015 });
      const th = limb(jThigh, [0, 0, 0], [0, -JK.TH, 0], 0.034, 0.028, TROU, { caps: 3 });
      coat(jThigh, th, 7, TROU, { l: [0.05, 0.08], w: [0.016, 0.024], jit: 0.4 });
      const sh = limb(jShin, [0, 0, 0], [0, -0.114, 0], 0.027, 0.022, TROU, { caps: 1 });
      coat(jShin, sh, 6, TROU, { l: [0.045, 0.07], w: [0.014, 0.02], jit: 0.4 });
      ell(jShin, [0, -0.118, 0.014], [0.0185, 0.012, 0.034], SHOE, { detail: 2 });
    }

    // ---------------------------------------------------------- Berthe: the dark dress, the wide white collar
    const bTor = part(0.0034);
    {
      const t = ell(bTor, [0, 0.082, 0], [0.055, 0.1, 0.04], DRESS, { detail: 3 });
      ell(bTor, [0, 0.004, 0], [0.054, 0.046, 0.05], DRESS, { detail: 2 });
      coat(bTor, t, 18, DRESS, { l: [0.04, 0.07], w: [0.018, 0.028], flow: DOWNISH, jit: 0.9, keep: p => p.y < 0.115 });
      // (round the top of an upright ellipsoid: th down from its crown, ph round from the front)
      const top = (th, ph) => V3(t.c.x + t.r.x * Math.sin(th) * Math.sin(ph), t.c.y + t.r.y * Math.cos(th), t.c.z + t.r.z * Math.sin(th) * Math.cos(ph));
      const TH0 = 0.26, gap = b => lerp(0.7, 0.06, Math.pow(b, 0.8)), edge = ph => 0.98 + 0.09 * Math.abs(Math.sin(ph * 3.5)) + 0.08 * Math.cos(ph);      // (scalloped; a little deeper in front)
      const CL = COLLAR.c, cph = (a, b) => lerp(gap(b), TAU - gap(b), a);
      patch(bTor, t, (a, b) => { const ph = cph(a, b); return top(lerp(TH0, edge(ph), b), ph); }, 60, 5, (a, b, p) => CL[0].clone().lerp(CL[1], smooth(vn(p.x * 90, p.y * 90, p.z * 90), 0.3, 0.7)).lerp(CL[2], 0.5 * smooth(b, 0.55, 1)), 0.0032);
      line(bTor, t, Array.from({ length: 61 }, (_, i) => { const ph = cph(i / 60, 1); return top(edge(ph) + 0.012, ph); }), 0.0022, col('#59636b', 0.1), 0.004, 120);      // the collar's edge, lost and found
      for (const sd of [-1, 1]) line(bTor, t, [0, 0.35, 0.7, 1].map(b => top(lerp(TH0, edge(gap(b)), b), sd * (gap(b) - 0.02))), 0.003, LINE, 0.0046, 14);      // where it opens at her throat
      patch(bTor, t, (a, b) => top(lerp(0.2, 1.04, b), lerp(-gap(b), gap(b), a)), 4, 7, FLESH_B.c[0], 0.0018);
    }
    const bHead = part(0.0022);
    {
      limb(bHead, [0, -0.014, 0], [0, 0.036, 0.002], 0.0135, 0.0125, FLESH_B, { caps: 0 });
      const hd = ell(bHead, [0, 0.07, 0.005], [0.03, 0.04, 0.033], FLESH_B, { detail: 3 });
      const hair = ell(bHead, [0, 0.082, -0.004], [0.0336, 0.034, 0.036], HAIR_B, { detail: 3 });
      for (const sd of [-1, 1]) ell(bHead, [sd * 0.0255, 0.064, -0.005], [0.0105, 0.023, 0.021], HAIR_B, { detail: 2 });        // drawn down over her ears
      ell(bHead, [0, 0.066, -0.036], [0.015, 0.0145, 0.012], HAIR_B, { detail: 2 });                                             // and knotted behind
      coat(bHead, hair, 10, HAIR_B, { l: [0.022, 0.036], w: [0.009, 0.014], flow: V3(0.5, -1, -0.3).normalize(), jit: 0.5, lift: 0.003, keep: p => p.y > 0.088 || p.z < 0 });
      coat(bHead, hd, 4, FLESH_B, { l: [0.016, 0.026], w: [0.008, 0.012], flow: V3(0.1, -1, 0).normalize(), jit: 0.5, lift: 0.0011, tones: [FLESH_B.c[0], FLESH_B.c[0].clone().lerp(FLESH_B.c[1], 0.5)], keep: p => p.z > 0.02 && p.y < 0.062 && p.y > 0.036 });
      const F = (x, y) => face(hd, x, y), rose = col('#dc6a58', 0.1), lip = col('#b53a2c', 0.08), flesh = FLESH_B.c[0], eye = col('#1f191b', 0.04);
      for (const sd of [-1, 1]) {
        patch(bHead, hd, (a, b) => { const an = a * TAU, r = 0.25 * b; return F(sd * 0.55 + Math.cos(an) * r, -0.1 + Math.sin(an) * r * 0.9); }, 12, 3, (a, b) => rose.clone().lerp(flesh, smooth(b, 0.25, 1)), 0.0012);      // his rose on her cheeks
        line(bHead, hd, [F(sd * 0.15, 0.53), F(sd * 0.42, 0.575), F(sd * 0.72, 0.43)], 0.0015, DARK, 0.0022);
        almond(bHead, hd, sd * 0.43, 0.29, 0.38, 0.105, eye, 0.0018, -sd * 0.16);
      }
      const nose = ell(bHead, [0.0005, 0.0745, 0.005 + 0.033 - 0.003], [0.0046, 0.0135, 0.0068], FLESH_B, { detail: 2 });
      line(bHead, hd, [F(0.15, 0.53), F(0.13, 0.42)], 0.0015, DARK, 0.0022, 5);
      line(bHead, nose, [V3(0.02, 0.085, 0.04), V3(0.02, 0.075, 0.045), V3(0.02, 0.067, 0.045), V3(0.016, 0.0625, 0.04)], 0.0016, DARK, 0.001, 10);
      line(bHead, nose, [V3(-0.01, 0.0622, 0.04), V3(0.0, 0.061, 0.05), V3(0.012, 0.0625, 0.04)], 0.0013, DARK, 0.001, 8);
      almond(bHead, hd, 0.0, -0.5, 0.44, 0.13, lip, 0.0018, 0.03);
      line(bHead, hd, [F(-0.2, -0.505), F(0.0, -0.52), F(0.22, -0.485)], 0.0011, col('#55201c', 0.05), 0.0024);
    }
    const bArmU = part(), bArmF = part(), bSkU = part(), bSkL = part(), bShoe = part(0.0022);
    {
      ell(bArmU, [0, 0, 0], [0.0215, 0.0215, 0.0215], DRESS, { detail: 2 });
      const u = limb(bArmU, [0, 0, 0], [0, -BK.AU, 0], 0.0195, 0.0165, DRESS, { caps: 2 });
      coat(bArmU, u, 6, DRESS, { l: [0.035, 0.055], w: [0.013, 0.02], jit: 0.5 });
      const f = limb(bArmF, [0, 0, 0], [0, -0.068, 0], 0.016, 0.013, DRESS, { caps: 3 });
      coat(bArmF, f, 5, DRESS, { l: [0.03, 0.045], w: [0.011, 0.016], jit: 0.5 });
      ell(bArmF, [0, -BK.AF, 0.001], [0.0095, 0.0135, 0.0075], FLESH_B, { detail: 2 });
      const a = limb(bSkU, [0, 0, 0], [0, -BK.TH, 0], 0.05, 0.056, DRESS, { seg: 18, caps: 3, detail: 2 });
      coat(bSkU, a, 22, DRESS, { l: [0.05, 0.085], w: [0.02, 0.032], jit: 0.5 });
      const b = limb(bSkL, [0, 0, 0], [0, -0.103, 0], 0.056, 0.074, DRESS, { seg: 18, caps: 1, detail: 2 });
      coat(bSkL, b, 26, DRESS, { l: [0.055, 0.09], w: [0.02, 0.034], jit: 0.4 });
      limb(bShoe, [0, 0.05, -0.004], [0, 0.016, 0], 0.0085, 0.0075, SHOE, { caps: 0, seg: 8 });
      ell(bShoe, [0, 0.0115, 0.01], [0.0125, 0.0115, 0.026], SHOE, { detail: 2 });
    }
    // ---------------------------------------------------------- the stool (ours: the picture stops above it)
    const stool = part(0.0028);
    {
      { const g = shape.lathe([[0.001, 0.088], [0.056, 0.088], [0.062, 0.096], [0.057, 0.104], [0.001, 0.104]], 20, 0xffffff); tint(g, WOOD, 5.1); stool.solids.push(g); }
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const lg = limb(stool, [sx * 0.036, 0.09, sz * 0.036], [sx * 0.05, 0.004, sz * 0.05], 0.0072, 0.006, WOOD, { caps: 2, seg: 8 }); coat(stool, lg, 2, WOOD, { l: [0.03, 0.05], w: [0.007, 0.009], jit: 0.2, lift: 0.002 }); }
    }

    // ---------------------------------------------------------- the rig: the two of them and the stool, one draw call
    const geos = { stool: finish(stool), jTor: finish(jTor), jHead: finish(jHead), jArmU: finish(jArmU), jArmF: finish(jArmF), jThigh: finish(jThigh), jShin: finish(jShin),
      bTor: finish(bTor), bHead: finish(bHead), bArmU: finish(bArmU), bArmF: finish(bArmF), bSkU: finish(bSkU), bSkL: finish(bSkL), bShoe: finish(bShoe) };
    let total = 0; for (const g of Object.values(geos)) total += g.attributes.position.count;
    const pm = L.paint({ rough: 0.95, glow: 0.52 }); pm.color.setScalar(0.6);       // (flat, as his paint is: mostly its own colour, a little of the room's light)
    // And scrubbed: the drag of a nearly dry brush down every form, and the weave under it, in each part's own space
    // (so it stays with the form as the figure moves).
    { const prev = pm.onBeforeCompile, key = pm.customProgramCacheKey();
      pm.onBeforeCompile = (sh, r) => {
        prev(sh, r);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOwn;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vOwn = position;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vOwn; float dragK = 1.0;
float dH(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float dN(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dH(i), dH(i + vec3(1, 0, 0)), f.x), mix(dH(i + vec3(0, 1, 0)), dH(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(dH(i + vec3(0, 0, 1)), dH(i + vec3(1, 0, 1)), f.x), mix(dH(i + vec3(0, 1, 1)), dH(i + vec3(1, 1, 1)), f.x), f.y), f.z); }`)
          .replace('#include <color_fragment>', `#include <color_fragment>
  { float a = dN(vOwn * vec3(230.0, 34.0, 230.0)), b = dN(vOwn * vec3(90.0, 18.0, 90.0) + 7.0), w = sin(vOwn.y * 2100.0) * sin((vOwn.x + vOwn.z) * 2100.0);
    dragK = 0.87 + 0.2 * a + 0.12 * (b - 0.5) + 0.02 * w; diffuseColor.rgb *= dragK; }`)
          .replace('totalEmissiveRadiance *= vColor.rgb;', 'totalEmissiveRadiance *= vColor.rgb * dragK;');
      };
      pm.customProgramCacheKey = () => key + '|modigliani-drag'; }
    const rig = this.rig = L.rig(24, total + 64, pm), gid = {}; for (const [k, g] of Object.entries(geos)) gid[k] = rig.geo(g);
    const I = this.I = { stool: rig.add(gid.stool), jTor: rig.add(gid.jTor), jHead: rig.add(gid.jHead), jAU: [rig.add(gid.jArmU), rig.add(gid.jArmU)], jAF: [rig.add(gid.jArmF), rig.add(gid.jArmF)],
      jTh: [rig.add(gid.jThigh), rig.add(gid.jThigh)], jSh: [rig.add(gid.jShin), rig.add(gid.jShin)],
      bTor: rig.add(gid.bTor), bHead: rig.add(gid.bHead), bAU: [rig.add(gid.bArmU), rig.add(gid.bArmU)], bAF: [rig.add(gid.bArmF), rig.add(gid.bArmF)], bSkU: rig.add(gid.bSkU), bSkL: rig.add(gid.bSkL), bSh: [rig.add(gid.bShoe), rig.add(gid.bShoe)] };
    this.jParts = [I.jTor, I.jHead, ...I.jAU, ...I.jAF, ...I.jTh, ...I.jSh]; this.bParts = [I.bTor, I.bHead, ...I.bAU, ...I.bAF, I.bSkU, I.bSkL, ...I.bSh];
    const M4 = () => new THREE.Matrix4();
    this.M = { jRoot: M4(), jTor: M4(), jHead: M4(), jAU: [M4(), M4()], jAF: [M4(), M4()], jTh: [M4(), M4()], jSh: [M4(), M4()], bRoot: M4(), bTor: M4(), bHead: M4(), bAU: [M4(), M4()], bAF: [M4(), M4()], bSkU: M4(), bSkL: M4(), bSh: [M4(), M4()], stool: M4() };
    this.shoulder = V3(); this.sh = V3(); this.tg = V3(); this.hang = V3();

    // ---------------------------------------------------------- the room on the wall, and the name
    this.buildRoom(L, col);
    this.blobs = L.blobs(3, { y: L.y + 0.012, fade: true }); this.blobs.renderOrder = 6;

    // ---------------------------------------------------------- their ways in, and the sound
    this.bWay = way(B_WAY, BK.STRIDE); this.jWay = way(J_WAY, JK.STRIDE);
    this.J = this.newState(); this.Bs = this.newState(); this.J0 = this.newState(); this.B0 = this.newState(); this.o = {};
    this.band = this.makeScore(L);
    this.hideAll(); this.T = 0;
  },

  newState() { return { vis: false, u: 0, out: 0, yaw: 0, ph: 0, amp: 0, lean: 0, sway: 0, hy: 0, hp: 0, hr: 0, pocket: 0, reach: 0, hov: 0, sit: 0, lap: 0, breath: 0 }; },

  // ---------------------------------------------------------------- the room: flat scrubbed paint on the wall
  buildRoom(L, col) {
    const rand = L.rand, X = u => (u - BU0) * PXM, Y = h => RH - h * PXM, hex = (h, a) => '#' + col(h, a).getHexString();
    const cv = document.createElement('canvas'); cv.width = RW; cv.height = RH; const g = cv.getContext('2d', { willReadFrequently: true });
    const iv = document.createElement('canvas'); iv.width = RW; iv.height = RH; const gi = iv.getContext('2d', { willReadFrequently: true });
    g.fillStyle = hex('#8a9b96'); g.fillRect(0, 0, RW, RH); gi.fillStyle = '#fff'; gi.fillRect(0, 0, RW, RH);      // (when each stroke is laid: white is never)
    g.lineCap = gi.lineCap = 'round';
    const dab = (x, y, a, l, w, style, id, bend = 0, alpha = 0.55) => {
      const dx = Math.cos(a) * l / 2, dy = Math.sin(a) * l / 2, mx = -Math.sin(a) * bend * l, my = Math.cos(a) * bend * l, v = Math.max(6, Math.min(244, Math.round(id * 255)));
      g.globalAlpha = alpha;
      for (const [c, s] of [[g, style], [gi, `rgb(${v},${v},${v})`]]) { c.strokeStyle = s; c.lineWidth = w; c.beginPath(); c.moveTo(x - dx, y - dy); c.quadraticCurveTo(x + mx, y + my, x + dx, y + dy); c.stroke(); }
      g.globalAlpha = 1;
    };
    const pick = list => list[Math.floor(rand() * list.length * 0.999)];
    // A zone filled with scrubs: its own ground first (it shows only where a stroke has gone), then a jittered grid of
    // long thin strokes laid half through one another, as thin paint scrubbed over a weave is; each is kept inside the
    // zone by its own length, so the edge is the ragged ends of strokes, not a ruled line. idOf(u, h) is when each is
    // laid, 0..1.
    const fill = (u0, u1, h0, h1, cols, ang, jit, idOf, { len = [46, 110], wid = [10, 20], step = 11, rag = 5, skip = 0.02, xf = null, ground = true } = {}) => {
      const x0 = X(u0), x1 = X(u1), y0 = Y(h1), y1 = Y(h0);
      if (ground && !xf) { g.fillStyle = cols[0]; g.fillRect(x0 - 3, y0 - 3, x1 - x0 + 6, y1 - y0 + 6); }
      for (let y = y0; y <= y1 + step; y += step) for (let x = x0; x <= x1 + step; x += step) {
        if (rand() < skip) continue;
        const a = (typeof ang === 'function' ? ang() : ang) + (rand() - 0.5) * jit, l = lerp(len[0], len[1], rand()), w = lerp(wid[0], wid[1], rand());
        const ex = Math.abs(Math.cos(a)) * l / 2 + w / 2, ey = Math.abs(Math.sin(a)) * l / 2 + w / 2, rg = (rand() - 0.3) * rag;
        let px = x + (rand() - 0.5) * step * 1.4, py = y + (rand() - 0.5) * step * 1.4;
        px = x1 - x0 > 2 * ex ? Math.max(x0 + ex - rg, Math.min(x1 - ex + rg, px)) : (x0 + x1) / 2; py = y1 - y0 > 2 * ey ? Math.max(y0 + ey - rg, Math.min(y1 - ey + rg, py)) : (y0 + y1) / 2;
        const id = idOf(BU0 + px / PXM, (RH - py) / PXM);
        if (xf) { const q = xf(px, py, a); dab(q[0], q[1], q[2], l, w, pick(cols), id, (rand() - 0.5) * 0.2, 0.8); } else dab(px, py, a, l, w, pick(cols), id, (rand() - 0.5) * 0.2);
      }
    };
    const OCHRE = ['#875a25', '#93652b', '#7a5021', '#9f6f2f', '#6e471e', '#8d6029'].map(h => hex(h)), SLATES = ['#54667a', '#4b5c70', '#5d6f82', '#47586a'].map(h => hex(h));
    const PALE = ['#9cacb5', '#a8b6bc', '#92a4af', '#b0bcc0'].map(h => hex(h)), GREY = ['#7c8d88', '#73857e', '#869690', '#6c7e7c', '#8c9a92', '#788986'].map(h => hex(h));
    const BROWN = ['#57382b', '#634032', '#4c3025', '#6b4634'].map(h => hex(h));
    // (the wall first on the canvas, so the other zones' grounds lie over its edge; but it is the last to be scrubbed in)
    for (let k = 0; k < 13; k++) {
      const ua = lerp(-0.62, 0.418, k / 13) - 0.03, ub = lerp(-0.62, 0.418, (k + 1) / 13) + 0.03, top = 0.675 + 0.022 * Math.sin(k * 1.3 + 0.6) + 0.014 * rand(), base = [-0.95, 1.25, -0.6, 0.5][k % 4];
      fill(Math.max(-0.62, ua), Math.min(0.418, ub), 0, top, GREY, () => base + (rand() < 0.25 ? 1.2 : 0), 0.8, (u, h) => 0.36 + 0.44 * ((0.418 - u) / 1.04) + 0.07 * rand());
    }
    // (the ochre panel: they come in by it, so it is the first thing there)
    fill(0.5, 0.84, 0, 0.6, OCHRE, PI / 2, 0.3, (u, h) => 0.05 + 0.2 * (h / 0.6) + 0.04 * rand(), { len: [54, 120], wid: [9, 18] });
    fill(0.5, 0.84, 0.615, 0.71, SLATES, 0, 0.4, () => 0.27 + 0.06 * rand(), { len: [40, 80], wid: [9, 16] });
    fill(0.418, 0.498, 0, 0.72, PALE, PI / 2, 0.14, (u, h) => 0.2 + 0.14 * (h / 0.72) + 0.03 * rand(), { len: [50, 110], wid: [8, 14], step: 9 });
    for (const [u, c] of [[0.424, '#56668a'], [0.462, '#7f92aa'], [0.494, '#506186']]) for (let h = 0.02; h < 0.7; h += 0.05 + 0.05 * rand()) if (rand() < 0.8) dab(X(u + (rand() - 0.5) * 0.004), Y(h), PI / 2 + (rand() - 0.5) * 0.06, 26 + 30 * rand(), 2 + 1.4 * rand(), hex(c), 0.36 + 0.04 * rand(), 0, 0.8);
    // (the brown rectangle that leans behind his head: brown, a darker middle, and his line down two sides)
    { const cx = X(-0.15), cy = Y(0.455), ro = 0.2, cs = Math.cos(ro), sn = Math.sin(ro), HW = 80, HH = 58, xf = (px, py, a) => [cx + (px - 400) * cs - (py - 300) * sn, cy + (px - 400) * sn + (py - 300) * cs, a + ro];
      const fx = (u0, u1, h0, h1, cols, id, o) => { const x0 = 400 - HW + u0 * 2 * HW, x1 = 400 - HW + u1 * 2 * HW, y0 = 300 - HH + h0 * 2 * HH, y1 = 300 - HH + h1 * 2 * HH; fill(BU0 + x0 / PXM, BU0 + x1 / PXM, (RH - y1) / PXM, (RH - y0) / PXM, cols, 0, 0.4, () => id + 0.04 * rand(), { xf, len: [36, 70], wid: [10, 17], step: 9, ...o }); };
      fx(0, 1, 0, 1, BROWN, 0.86); fx(0.14, 0.6, 0.3, 0.84, ['#3d2c2b', '#453233', '#372828'].map(h => hex(h)), 0.9, { len: [22, 40], wid: [9, 14] });
      for (const [a, b] of [[[0, 0], [0, 1]], [[0, 1], [1, 1]]]) { const up = a[0] === b[0], p = xf(400 - HW + (a[0] + b[0]) * HW, 300 - HH + (a[1] + b[1]) * HH, up ? PI / 2 : 0); dab(p[0], p[1], p[2], up ? 2 * HH - 12 : 2 * HW - 14, 2.6, hex(INK), 0.95, 0.03, 0.85); } }
    // (bristle: thin dry streaks, a little lighter or darker, along the way each part was scrubbed; and the weave)
    for (let i = 0; i < 2600; i++) { const x = rand() * RW, y = rand() * RH, u = BU0 + x / PXM, a = u > 0.418 ? PI / 2 + (rand() - 0.5) * 0.3 : [-0.95, 1.25, -0.6, 0.5][Math.floor(clamp01((u + 0.62) / 1.04) * 12.99) % 4] + (rand() - 0.5) * 0.7, l = 18 + 50 * rand(), dx = Math.cos(a) * l / 2, dy = Math.sin(a) * l / 2;
      g.globalAlpha = 0.05 + 0.09 * rand(); g.strokeStyle = rand() < 0.5 ? '#efe9d8' : '#1c2028'; g.lineWidth = 1 + 2.2 * rand(); g.beginPath(); g.moveTo(x - dx, y - dy); g.lineTo(x + dx, y + dy); g.stroke(); }
    g.globalAlpha = 0.035; g.fillStyle = '#141414'; for (let y = 0; y < RH; y += 3) g.fillRect(0, y, RW, 1); for (let x = 0; x < RW; x += 3) g.fillRect(x, 0, 1, RH);
    g.globalAlpha = 1;
    const c = g.getImageData(0, 0, RW, RH).data, d = gi.getImageData(0, 0, RW, RH).data, out = new Uint8Array(RW * RH * 4);
    for (let i = 0; i < RW * RH * 4; i += 4) { out[i] = c[i]; out[i + 1] = c[i + 1]; out[i + 2] = c[i + 2]; out[i + 3] = d[i]; }
    const tex = new THREE.DataTexture(out, RW, RH, THREE.RGBAFormat); tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4; tex.needsUpdate = true;
    // The name, in his thin capitals: each letter is written from its first stroke to its last (the red channel says when).
    const NW = 512, NH = 118;
    const name = canvasTexture(NW, NH, (n, w, h) => {
      n.fillStyle = '#fff'; n.fillRect(0, 0, w, h); n.lineCap = 'round'; n.lineJoin = 'round';
      const word = 'LIPCHITZ', gapW = 0.26, widths = [...word].map(ch => GLYPH[ch][0]), totalW = widths.reduce((a, b) => a + b, 0) + gapW * (word.length - 1), sc = (w - 28) / totalW, lh = h - 34;
      let x = 14;
      [...word].forEach((ch, k) => {
        const [wd, ...strokes] = GLYPH[ch], y0 = h - 14 - (k % 3 === 1 ? 3 : 0) + (k > 5 ? 4 : 0), lean = (rand() - 0.5) * 0.08;
        const pt = p => [x + (p[0] * wd + lean * p[1]) * sc * 1.0, y0 - p[1] * lh * (0.94 + 0.06 * ((k * 7) % 3) / 2)];
        let total = 0; const segs = [];
        for (const st of strokes) { const cvp = new THREE.CatmullRomCurve3(st.map(p => { const q = pt(p); return V3(q[0], q[1], 0); }), false, 'catmullrom', st.length > 4 ? 0.5 : 0.08).getPoints(st.length > 4 ? 26 : st.length > 2 ? 16 : 8); segs.push(cvp); total += cvp.length - 1; }
        let done = 0;
        for (const cvp of segs) for (let i = 0; i < cvp.length - 1; i++, done++) {
          const v = Math.round(255 * (0.04 + 0.9 * (k + 0.9 * (done + 1) / total) / word.length));
          n.strokeStyle = `rgb(${v},${v},${v})`; n.lineWidth = 6; n.beginPath(); n.moveTo(cvp[i].x, cvp[i].y); n.lineTo(cvp[i + 1].x, cvp[i + 1].y); n.stroke();
        }
        x += (wd + gapW) * sc;
      });
    }, false);
    name.generateMipmaps = true; name.minFilter = THREE.LinearMipmapLinearFilter; name.needsUpdate = true;
    const u = this.ru = { uShow: { value: 0 }, uWrite: { value: 0 }, tName: { value: name }, uInk: { value: col('#22232e', 0.05) },
      uName: { value: new THREE.Vector4((NAME.u0 - BU0) / BW, NAME.h0 / BH, (NAME.u1 - BU0) / BW, NAME.h1 / BH) } };
    const mat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.78, 0.78, 0.78), fog: false });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uShow, uWrite; uniform sampler2D tName; uniform vec3 uInk; uniform vec4 uName;')
        .replace('#include <map_fragment>', `{
    vec4 tx = texture2D(map, vec2(vMapUv.x, 1.0 - vMapUv.y));
    if (tx.a > min(uShow, 0.97)) discard;                                       // (not painted here, or not yet)
    vec3 c = tx.rgb;
    vec2 nq = (vMapUv - uName.xy) / (uName.zw - uName.xy);
    if (nq.x > 0.0 && nq.x < 1.0 && nq.y > 0.0 && nq.y < 1.0) { float nid = texture2D(tName, vec2(nq.x, nq.y)).r; if (nid < min(uWrite, 0.96)) c = mix(c, uInk, 0.9); }
    diffuseColor.rgb *= c;
  }`);
    };
    mat.customProgramCacheKey = () => 'modigliani-room';
    const m = this.room = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), mat); m.name = 'room';
    // (a flat standing just clear of the skirting, which is 3.5 cm proud of the wall, and in front of the lamp's wash)
    L.at((BU0 + BU1) / 2, L.y + BH / 2 - L.cy, -L.wall + 0.046, m.position); m.rotation.y = L.yawOut; m.renderOrder = 5;
    L.add(m);
  },

  // ---------------------------------------------------------------- the sound, on the show's clock
  makeScore(L) {
    const s = score(L), E3 = 164.81, GS4 = 415.3;
    const brush = (t, vol = 0.011) => s.hit(t, { d: 0.26, vol, bp: 1500 + 700 * ((t * 7.3) % 1), q: 0.9, attack: 0.07 });
    for (const t of [0.04, 0.3, 0.52, 0.8, 1.02, 1.3]) brush(t);
    // their steps: hers light, his a little lower
    for (const [w, win, lp, vol] of [[this.bWay, B_IN, 900, 0.01], [this.jWay, J_IN, 520, 0.013]]) for (let k = 1; k <= w.steps; k++) { const t = win[0] + invProf(k / w.steps) * (win[1] - win[0]); s.hit(t, { d: 0.05, vol, lp, attack: 0.004 }).note(t, lp * 0.16, 0.05, { vol: vol * 0.9, type: 'sine', attack: 0.004 }); }
    s.note(0.42, 150, 0.09, { vol: 0.014, type: 'sine', to: 110, attack: 0.005 });                         // the stool stands
    s.note(SIT[1] - 0.12, 118, 0.16, { vol: 0.016, type: 'sine', to: 92, attack: 0.01 }).hit(SIT[1] - 0.12, { d: 0.12, vol: 0.008, lp: 700, attack: 0.02 });      // she sits
    const two = (t, v = 1) => {
      s.note(t, E3, 2.6, { vol: 0.034 * v, type: 'triangle', attack: 0.03, over: 2, overVol: 0.18 });      // his hand comes to rest
      return t;
    };
    const hers = (t, v = 1) => s.note(t, GS4, 2.4, { vol: 0.026 * v, type: 'triangle', attack: 0.04, over: 2, overVol: 0.14 });
    two(T_HAND); hers(TILT[0] + 0.2);
    // the name: a tick of the brush to each letter
    for (let k = 0; k < 8; k++) { const t = WRITE[0] + (k + 0.3) / 8 * (WRITE[1] - WRITE[0]); s.hit(t, { d: 0.09, vol: 0.007, bp: 2600, q: 1.2, attack: 0.02 }); }
    brush(6.32, 0.008);                                                                                    // one more touch, and the brush stops
    two(AGAIN[1], 0.9); hers(TILT2[0] + 0.22, 0.9);
    // and on it goes: the brush, now and then
    s.loop(IDLE, 3.1, [{ t: 0, noise: true, d: 0.28, vol: 0.008, bp: 1700, q: 0.9, attack: 0.08 }, { t: 0.42, noise: true, d: 0.24, vol: 0.007, bp: 2000, q: 0.9, attack: 0.07 }, { t: 1.7, noise: true, d: 0.3, vol: 0.007, bp: 1500, q: 0.9, attack: 0.09 }]);
    return s.done();
  },

  hideAll() { for (const i of [this.I.stool, ...this.jParts, ...this.bParts]) this.rig.show(i, false); this.blobs.count = 0; this.ru.uShow.value = 0; this.ru.uWrite.value = 0; this.room.visible = false; },
  start(L, resumed) { this.T = L.t; this.band.from(L.t); },
  end(L) { this.hideAll(); },
  reset(L) { this.hideAll(); this.T = 0; this.told = this.told2 = false; },

  // The look has ended: where each of them is, and the way back to the ochre panel from there.
  back(L) {
    this.bT = this.T || 0;
    Object.assign(this.J0, this.J); Object.assign(this.B0, this.Bs);
    const home = (s, via, stride) => (s.vis ? way(s.u < 0.5 && s.out > 0.12 ? [[s.u, s.out], ...via, [0.66, 0.1], DOOR] : [[s.u, s.out], [lerp(s.u, 0.66, 0.6), lerp(s.out, DOOR[1], 0.5)], DOOR], stride) : null);
    this.jHome = home(this.J0, [[0.36, 0.28]], JK.STRIDE); this.bHome = home(this.B0, [[0.4, 0.6]], BK.STRIDE);
    this.show0 = this.ru.uShow.value; this.write0 = this.ru.uWrite.value;
    if (!L.quiet && L.voice().ctx) { const v = L.voice(); v.note(415.3, 0.9, { at: 0.15, vol: 0.014, type: 'triangle', attack: 0.03 }); v.note(164.81, 1.2, { at: 0.55, vol: 0.018, type: 'triangle', attack: 0.03 }); }
  },

  // ---------------------------------------------------------------- where they are and what they are doing at show-time T
  showState(L, T, J, B, calm) {
    const o = this.o, out0 = L.yawOut;
    // ---- Berthe: in by the ochre panel, across to the stool, round, and down
    {
      const k = clamp01((T - B_IN[0]) / (B_IN[1] - B_IN[0])), s = prof(k); this.bWay.at(s, o);
      B.vis = T > B_IN[0]; B.u = o.u; B.out = o.out; B.ph = PI * this.bWay.steps * s; B.amp = 1;
      B.yaw = turnTo(L.yawOf(o.du, o.dout), out0 + B_YAW, ease.inOut(ramp(T, B_IN[1] - 0.5, B_IN[1] + 0.12)));
      const sit = ease.inOut(ramp(T, SIT[0], SIT[1]));
      B.sit = sit + (calm ? 0 : 0.035 * hump(T, SIT[1], SIT[1] + 0.3));
      B.lean = 0.34 * hump(T, SIT[0] - 0.05, SIT[1] + 0.05) + 0.02 * smooth(T, TILT[0], TILT[1]);
      B.lap = ease.inOut(ramp(T, SIT[0] + 0.35, SIT[1] + 0.4));
      // her head: level as she walks; a look down for the stool; then out at the painter. When his hand comes to rest she
      // inclines it to him. When the brush stops she straightens and looks up at him; and then back, as before.
      const up = ease.inOut(ramp(T, EASE[0] + 0.1, EASE[1])) * (1 - ease.inOut(ramp(T, AGAIN[0] + 0.25, TILT2[0] + 0.25)));
      const tilt = ease.inOut(ramp(T, TILT[0], TILT[1])) * (1 - up) + 0;
      const glance = T > IDLE ? this.glance(T, 0, calm) : 0, lookUp = Math.max(up, glance * 0.8);
      B.hy = -0.03 - 0.74 * lookUp + 0.25 * hump(T, B_IN[1] - 0.6, SIT[0] + 0.2);
      B.hp = 0.3 * hump(T, SIT[0] - 0.35, SIT[0] + 0.45) + 0.02 - 0.3 * lookUp;
      B.hr = 0.2 * tilt * (1 - glance * 0.7) + 0.012 * Math.sin(T * 0.7 + 1);
      B.sway = 0.035 * tilt; B.breath = T;
    }
    // ---- Jacques: in after her, round behind the stool, to her shoulder
    {
      const k = clamp01((T - J_IN[0]) / (J_IN[1] - J_IN[0])), s = prof(k); this.jWay.at(s, o);
      J.vis = T > J_IN[0]; J.u = o.u; J.out = o.out; J.ph = PI * this.jWay.steps * s; J.amp = 1;
      J.yaw = turnTo(L.yawOf(o.du, o.dout), out0 + J_YAW, ease.inOut(ramp(k, 0.7, 1)));
      J.pocket = ease.inOut(ramp(T, POCKET[0], POCKET[1]));
      const down = ease.inOut(ramp(T, T_HAND - 0.27, T_HAND)), off = ease.inOut(ramp(T, EASE[0], EASE[1] - 0.15)) * (1 - ease.inOut(ramp(T, AGAIN[0], AGAIN[1])));
      J.reach = ease.inOut(ramp(T, LIFT[0], LIFT[1]));
      J.hov = 0.048 * (1 - down) + 0.042 * off - (calm ? 0 : 0.004 * hump(T, T_HAND, T_HAND + 0.22) + 0.004 * hump(T, AGAIN[1], AGAIN[1] + 0.22));
      // his head: he watches his hand down onto her shoulder, then looks out, chin up, as he does in the picture; when
      // the brush stops he looks down at her; then out again, with a small nod: go on.
      const toHer = Math.max(hump(T, LIFT[0] + 0.1, T_HAND + 0.45), ease.inOut(ramp(T, EASE[0] + 0.15, EASE[1] + 0.05)) * (1 - ease.inOut(ramp(T, AGAIN[0] - 0.25, AGAIN[0] + 0.15))), T > IDLE ? this.glance(T, 0.5, calm) * 0.8 : 0);
      const posed = smooth(T, J_IN[1] - 0.2, J_IN[1] + 0.5);
      J.hy = lerp(0.06 * posed, 0.5, toHer); J.hp = lerp(-0.1 * posed, 0.36, toHer) + 0.13 * hump(T, AGAIN[0] - 0.1, AGAIN[0] + 0.35);
      J.hr = lerp(0.09 * posed, 0, toHer) + 0.01 * Math.sin(T * 0.6);
      J.lean = 0.018 * J.reach * (1 - J.hov / 0.05); J.sway = -0.03 * J.reach + 0.008 * posed * Math.sin(T * 0.45); J.breath = T;
    }
  },
  // While the sitting goes on: now and then one of them glances at the other (0..1), she first, he half a beat after.
  glance(T, lag, calm) { const P = 8.4, x = ((T - IDLE - 2.6 - lag) % P + P) % P, d = calm ? 2.6 : 1.9; return x < d ? Math.sin(PI * smooth(x, 0, d)) : 0; },

  // ---------------------------------------------------------------- going home: up, round, and out by the ochre panel
  retState(L, r, J, B) {
    const o = this.o, J0 = this.J0, B0 = this.B0;
    Object.assign(J, J0); Object.assign(B, B0);
    if (J0.vis) {
      const k = ease.inOut(ramp(r, 0, 0.2)), w = prof(ramp(r, 0.1, 0.78)); this.jHome.at(w, o);
      J.reach = J0.reach * (1 - k); J.hov = lerp(J0.hov, 0.05, k); J.pocket = J0.pocket * (1 - k); J.hy = J0.hy * (1 - k); J.hp = J0.hp * (1 - k); J.hr = J0.hr * (1 - k); J.lean = J0.lean * (1 - k); J.sway = J0.sway * (1 - k);
      J.u = o.u; J.out = o.out; J.yaw = turnTo(J0.yaw, L.yawOf(o.du, o.dout), ease.inOut(ramp(r, 0.06, 0.3))); J.ph = J0.ph + PI * this.jHome.steps * w; J.amp = 1;
    }
    if (B0.vis) {
      const k = ease.inOut(ramp(r, 0, 0.25)), w = prof(ramp(r, 0.24, 0.92)); this.bHome.at(w, o);
      B.sit = B0.sit * (1 - k); B.lap = B0.lap * (1 - ease.inOut(ramp(r, 0, 0.16))); B.lean = 0.3 * B0.sit * hump(r, 0, 0.27); B.hy = B0.hy * (1 - k); B.hp = B0.hp * (1 - k); B.hr = B0.hr * (1 - k); B.sway = B0.sway * (1 - k);
      B.u = o.u; B.out = o.out; B.yaw = turnTo(B0.yaw, L.yawOf(o.du, o.dout), ease.inOut(ramp(r, 0.2, 0.42))); B.ph = B0.ph + PI * this.bHome.steps * w; B.amp = 1;
    }
  },

  // An arm from the shoulder S to the hand at T (world), the elbow towards `pole`: fills the two parts' matrices
  // (each part hangs along its own -y).
  arm(S, T, pole, a, b, M1, M2) {
    const V = this.V; V.d.copy(T).sub(S); const len = V.d.length() || 1e-5, dist = Math.max(Math.abs(a - b) + 0.004, Math.min(a + b - 0.0015, len)); V.d.multiplyScalar(1 / len);
    const x = (a * a - b * b + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, a * a - x * x));
    V.p.copy(pole).addScaledVector(V.d, -pole.dot(V.d)); if (V.p.lengthSq() < 1e-8) V.p.set(1, 0, 0); V.p.normalize();
    V.el.copy(S).addScaledVector(V.d, x).addScaledVector(V.p, h); V.tip.copy(S).addScaledVector(V.d, dist);
    M1.compose(S, V.q.setFromUnitVectors(V.down, V.w.copy(V.el).sub(S).normalize()), V.one);
    M2.compose(V.el, V.q.setFromUnitVectors(V.down, V.w.copy(V.tip).sub(V.el).normalize()), V.one);
  },

  poseB(L, s) {
    const { B, M, V, rig, I } = this;
    for (const i of this.bParts) rig.show(i, s.vis);
    if (!s.vis) return;
    const th = 1.5 * s.sit, sn = Math.sin(s.ph), walk = s.amp * (1 - clamp01(s.sit * 3)), bob = -0.005 * Math.abs(sn) * walk, br = 0.0012 * Math.sin(s.breath * 1.9);
    L.floor(s.u, s.out, V.v); B.set(M.bRoot, V.v.x, V.v.y, V.v.z, s.yaw, 0, 0);
    const hy = BK.KNEE + BK.TH * Math.cos(th) + bob, hz = -BK.TH * Math.sin(th);
    B.child(M.bTor, M.bRoot, 0, hy + br, hz, 0, s.lean, s.sway + 0.03 * sn * walk);
    B.child(M.bHead, M.bTor, 0, BK.NECK, 0, s.hy, s.hp, s.hr);
    B.child(M.bSkU, M.bRoot, 0, hy, hz, 0, -th, 0);
    B.child(M.bSkL, M.bRoot, 0, BK.KNEE + bob, 0, 0, 0.05 * sn * walk, 0);
    for (let k = 0; k < 2; k++) {
      const side = k ? 1 : -1;
      B.child(M.bSh[k], M.bRoot, side * 0.023, 0, 0.012 + side * sn * 0.045 * walk + 0.012 * s.sit, side * 0.12, 0, 0);
      // her arms: at her sides as she walks; her hands together in her lap when she sits
      V.a.set(side * BK.SH[0], BK.SH[1], 0).applyMatrix4(M.bTor);
      this.hang.set(side * 0.068, hy - 0.006, 0.012 - side * sn * 0.03 * walk).applyMatrix4(M.bRoot);
      this.tg.set(side * 0.012, 0.062, 0.083).applyMatrix4(M.bTor); this.tg.lerpVectors(this.hang, this.tg, s.lap);
      V.pole.set(side * 1, -0.25, -0.7).transformDirection(M.bRoot);
      this.arm(V.a, this.tg, V.pole, BK.AU, BK.AF, M.bAU[k], M.bAF[k]);
      rig.mat(I.bAU[k], M.bAU[k]); rig.mat(I.bAF[k], M.bAF[k]); rig.mat(I.bSh[k], M.bSh[k]);
    }
    rig.mat(I.bTor, M.bTor); rig.mat(I.bHead, M.bHead); rig.mat(I.bSkU, M.bSkU); rig.mat(I.bSkL, M.bSkL);
    this.shoulder.set(BK.SH[0] - 0.004, BK.SH[1] + 0.029, 0.006).applyMatrix4(M.bTor);      // where his hand will lie
  },

  poseJ(L, s) {
    const { B, M, V, rig, I } = this;
    for (const i of this.jParts) rig.show(i, s.vis);
    if (!s.vis) return;
    const A = JK.SWING * s.amp, sn = Math.sin(s.ph), cs = Math.cos(s.ph), dy = JK.LEG * (Math.cos(A * Math.abs(sn)) - 1), br = 0.0014 * Math.sin(s.breath * 1.6 + 1);
    L.floor(s.u, s.out, V.v); B.set(M.jRoot, V.v.x, V.v.y, V.v.z, s.yaw, 0, 0);
    B.child(M.jTor, M.jRoot, 0, JK.HIP + dy + br, 0, 0.08 * sn * s.amp, s.lean + 0.04 * Math.abs(sn) * s.amp, s.sway);
    B.child(M.jHead, M.jTor, 0, JK.NECK[0], JK.NECK[1], s.hy, s.hp, s.hr);
    for (let k = 0; k < 2; k++) {
      const side = k ? 1 : -1, p = side * sn, sw = Math.max(0, side * cs);
      B.child(M.jTh[k], M.jRoot, side * 0.033, JK.HIP + dy, 0, 0, -A * p - 0.25 * A * sw * sw, 0);
      B.child(M.jSh[k], M.jTh[k], 0, -JK.TH, 0, 0, 1.25 * A * Math.pow(sw, 1.5), 0);
      rig.mat(I.jTh[k], M.jTh[k]); rig.mat(I.jSh[k], M.jSh[k]);
      // his arms: swinging as he walks; then the right to his pocket, and the left to her shoulder
      V.a.set(side * JK.SH[0], JK.SH[1], 0).applyMatrix4(M.jTor);
      this.hang.set(side * 0.082, JK.HIP + dy - 0.034, 0.012 - side * sn * 0.05 * s.amp).applyMatrix4(M.jRoot);
      if (k === 0) { this.tg.set(-0.062, 0.006, 0.03).applyMatrix4(M.jTor); this.tg.lerpVectors(this.hang, this.tg, s.pocket); V.pole.set(-1, -0.1, -0.9); }
      else {
        const r = s.reach; this.tg.copy(this.shoulder); this.tg.y += s.hov; this.sh.set(-0.3, 0, -0.5).transformDirection(M.jRoot); this.tg.addScaledVector(this.sh, s.hov * 0.5);
        this.tg.lerpVectors(this.hang, this.tg, r); this.tg.y += 0.035 * Math.sin(PI * r); V.pole.set(0.7, -0.35, -0.7);
      }
      V.pole.transformDirection(M.jRoot);
      this.arm(V.a, this.tg, V.pole, JK.AU, JK.AF, M.jAU[k], M.jAF[k]);
      rig.mat(I.jAU[k], M.jAU[k]); rig.mat(I.jAF[k], M.jAF[k]);
    }
    rig.mat(I.jTor, M.jTor); rig.mat(I.jHead, M.jHead);
  },

  update(L, dt) {
    const back = L.phase === 'return', T = back ? this.bT : (this.T = L.t), r = back ? L.ret : 0, calm = L.calm, J = this.J, Bs = this.Bs, V = this.V, ru = this.ru;
    if (!back) {
      this.band.play(T);
      if (!this.told && !L.quiet && T > 0.5) { this.told = true; L.k.say('A wedding portrait: Berthe Lipchitz sits, and Jacques stands with a hand on her shoulder.', 4.5); }
      if (!this.told2 && !L.quiet && T > EASE[0] + 0.3) { this.told2 = true; L.k.say('According to Lipchitz, Modigliani painted this in two days. Lipchitz had him work on for two more weeks, to pay him more.', 6); }
      this.showState(L, T, J, Bs, calm);
    } else this.retState(L, r, J, Bs);
    this.poseB(L, Bs); this.poseJ(L, J);
    // the stool stands up out of the floor, and goes back into it last
    const sk = (calm ? ease.out : ease.outBack)(ramp(T, 0.12, 0.5)) * (back ? 1 - ease.in(ramp(r, 0.5, 0.74)) : 1);
    this.rig.show(this.I.stool, sk > 0.01);
    L.floor(STOOL[0], STOOL[1], V.v); this.B.set(this.M.stool, V.v.x, V.v.y, V.v.z, L.yawOut + 0.5, 0, 0, V.s.set(0.6 + 0.4 * sk, sk, 0.6 + 0.4 * sk)); this.rig.mat(this.I.stool, this.M.stool);
    // the room on the wall: scrubbed on, the ochre panel first; rubbed off again the other way. The name is written
    // while they hold still.
    this.room.visible = true;
    if (!back) { ru.uShow.value = ramp(T, 0, 1.55); ru.uWrite.value = ramp(T, WRITE[0], WRITE[1]) * 1.02; }
    else { ru.uShow.value = this.show0 * (1 - ease.inOut(ramp(r, 0.5, 1))); ru.uWrite.value = this.write0 * (1 - ramp(r, 0, 0.3)); }
    // soft shadows at their feet
    let n = 0; const bl = this.blobs;
    if (sk > 0.01) { L.floor(STOOL[0], STOOL[1], V.v); bl.set(n++, V.v.x, V.v.z, 0.085 * sk, 0.4 * sk); }
    if (Bs.vis && Bs.out > 0.02) { V.v.set(0, 0, -0.05 * Bs.sit).applyMatrix4(this.M.bRoot); bl.set(n++, V.v.x, V.v.z, 0.1, 0.5 * smooth(Bs.out, 0.02, 0.2)); }
    if (J.vis && J.out > 0.02) { V.v.set(0, 0, 0.005).applyMatrix4(this.M.jRoot); bl.set(n++, V.v.x, V.v.z, 0.085, 0.5 * smooth(J.out, 0.02, 0.2)); }
    bl.count = n;
    L.voice().place();
  },
});
