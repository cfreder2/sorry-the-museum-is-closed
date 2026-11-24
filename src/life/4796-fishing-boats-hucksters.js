// J. M. W. Turner, Fishing Boats with Hucksters Bargaining for Fish (1837–38), Gallery 220. The word: bargain.
//
// A tubby fishing boat lies hove-to on a churning ochre sea, her great cream sail spilling its wind, a yellow boat in
// tow astern; far off to the right a low dark rowing boat pulls towards her, one man standing in it with his arm up,
// hailing. They are the hucksters of the title, in the old plain sense: dealers who row out to buy the catch at sea
// and sell it on the quay. Nothing has been agreed yet; the price is still in the air between two boats that are
// never level, one up on a sea when the other is down. A storm stands over the left of the picture, the sun lies on
// the water in front (the museum points to the thick dots of paint there), and the artist signed it on the white
// flag at the masthead. So the show is the bargain, and what it is called across.
//
// Look at it and his sea wells out from under the picture over the floor, in storm light: umber and olive, churned,
// the froth dull. The fishing boat comes out of the distance at the foot of the wall on the left, small, and grows
// as she sails out; she rounds up into the wind and lies there, her sail shivering, the yellow boat swinging round
// astern on its line. The hucksters row out of the dark on the right. Then the bargain, in two voices: the man
// standing in the rowing boat puts his arm up and calls a low note; a hand goes up on the fishing boat and a high
// one comes back. The oars take a stroke nearer and he calls a step higher; the answer comes a step lower. Again,
// nearer. On his fourth call the two voices meet on one note, the boats are alongside, and with the note the sun
// breaks through: it opens over the water from the left, stroke by stroke, the froth turns to cream and the dots of
// thick paint light up, the gold streak along the horizon brightens, and the great sail fills and stands luminous
// against the dark. A basket, silver on top, is hoisted up against the sail on a whip from the sprit, swung out and
// lowered into the rowing boat, which settles under it; three coins go back the other way, one, two, three. While
// you keep looking the two boats lie together on the lit sea, a cloud crosses now and then, and another basket is
// called for and paid for. When you stop, both boats turn for the wall and go back into the distance under the
// picture, smaller and smaller, and the sea draws in after them.
//
// The calls are ours, not a tune: two plain voices that start a sixth apart and close by steps to a unison (C D E F
// rising under A G F falling), each a hail of two notes as it is shouted over water. No shanty, and no song. And no
// thunder: his storm stays where he left it, over the left of the picture, and the squall, the strokes wheeling round
// the frame and the lightning belong to the other Turner in the building (src/life/109938-valley-of-aosta.js).
//
// Nothing here is ever in front of a picture: the fishing boat lies 56 cm out from the wall and her masthead flag
// stands about 62 cm over the floor, under the rail of the frame, so that from the look camera and from the toy's eye
// the whole sail is seen against the wall and not the canvas (the kit's guard is there for every other camera).
// Nothing is solid and there is nothing to push. Three draw calls: the sea (one displaced sheet; his dragged paint,
// his froth and the light on it are worked out in its shader), one rig (hulls, spars, sails, oars, the buoy, the
// baskets and every line; the sails' wind is worked out in its vertex shader, and the sun falls on it where it falls
// on the sea) and his touches (the people, froth, spray, the far sail and the steamer with her smoke, the haze and
// the gold at the wall's foot: soft cards, one instanced shader). With "Reduce motion and flashing": the sail
// shivers slowly and less, nothing glitters or flickers, there is no spray, the sun takes twice as long to open, the
// sea runs lower and slower, and every sound is eased in more softly.
//
// What it does not do: nobody is thrown about, tipped out or made a clown of (they are working people doing a
// morning's business in a seaway, painted as a few touches each, and they are left as that: a hand goes up, a back
// bends to an oar), the word "huckster" is used only as the title uses it, and no fish is seen caught, hooked,
// netted or alive: the catch is a basket with silver on top, sold.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture } from '../paintlife.js';
import { strokes } from './brush.js';
import { score } from './stagecraft.js';
import { hz } from './tunes.js';

const TAU = Math.PI * 2;
const sm = (x, a, b) => ease.smooth(ramp(x, a, b));
const spread = q => 0.5 * (ease.smooth(q) + ease.out(q));
const GL = n => n.toFixed(5);
const dir = a => [Math.sin(a), Math.cos(a)];
// ---------------------------------------------------------------- the sea: the same numbers here and in its shader
const SA = 1.5, SB = 1.6;                 // its reach along the wall (each way) and out into the room
const Y0 = 0.055, LIFT = 0.012;            // the water's own depth on the floor; the sheet lies this far over the floor
const W1 = { a: 0.023, k: TAU / 0.92, w: TAU / 2.5, d: dir(0.95) };       // the sea running: from the storm, out and to the right
const W2 = { a: 0.012, k: TAU / 0.5, w: TAU / 1.6, d: dir(-0.45) };       // a cross sea
const W3 = { a: 0.006, k: TAU / 0.31, w: TAU / 1.05, d: dir(2.0) };       // chop
const WIND = [0.94, 0.34];                                                 // the wind: from the storm on the left, along the wall
// ---------------------------------------------------------------- the boats' ways (u along the wall, out from it)
const FA = [-1.02, 0.1], FC = [0.09, 0.39], FF = [-0.38, 0.56];            // the fishing boat: out of the distance, round into the wind
const FD = [-0.94, 0.34];                                                  // the way she lies, hove-to (her bow to the left)
const F_HOME = [-0.45, 0.05], H_HOME = [0.42, 0.05];
const HH0 = [1.1, 0.1], HC1 = [1.0, 0.66], HC2 = [0.26, 0.56];               // the hucksters: out of the dark on the right
const HH1 = [FF[0] - FD[0] * 0.1 + 0.34 * 0.215, FF[1] - FD[1] * 0.1 + 0.94 * 0.215];      // alongside her, on our side, by the stern
const BUOY = [0.8, 0.94];
// ---------------------------------------------------------------- the bargain
// who 0: the hucksters (low, coming up); who 1: the fishing boat (high, coming down). They meet on F.
const CALLS = [{ t: 1.95, who: 0, n: 'C4' }, { t: 2.6, who: 1, n: 'A4' }, { t: 3.2, who: 0, n: 'D4' }, { t: 3.8, who: 1, n: 'G4' }, { t: 4.4, who: 0, n: 'E4' }, { t: 5.0, who: 1, n: 'F4', d: 0.55 }];
const T_DEAL = 5.75;                       // the unison; everything after it is on the deal's own clock (seconds after it):
const D_FILL = 0.2, D_LIFT = 0.25, D_SWING = 0.75, D_LAND = 1.45, D_COIN = [1.68, 1.92, 2.16], COIN_FLY = 0.36;
const LOOP = { t: 9.6, P: 8.4, deal: 2.0, calls: [{ t: 0.9, who: 0, n: 'F4', d: 0.3 }, { t: 1.4, who: 1, n: 'F4', d: 0.3 }] };
// the oars: each stroke takes them this much of the way (the first three bring them out of the distance; then one
// after each of their calls, and the last brings them alongside on the deal)
const STROKES = [{ t: 0.75, d: 0.42, to: 0.17 }, { t: 1.17, d: 0.42, to: 0.33 }, { t: 1.59, d: 0.42, to: 0.47 }, { t: 2.3, d: 0.5, to: 0.63 }, { t: 3.5, d: 0.5, to: 0.8 }, { t: 4.7, d: 0.5, to: 0.93 }, { t: 5.8, d: 0.5, to: 1 }];
const R_STROKES = [0.08, 0.5, 0.92, 1.34, 1.76];      // going home (seconds into the Return)
const N_HAZE = 12, N_SMOKE = 5, N_SPARK = 22, N_SPRAY = 10, N_SPLASH = 7, N_FOAM = 14;
// the fishing boat's people (x, z, colour, size, how tall they stand): a row beyond the mast, then a row at her near rail
const CREW = [[0.125, 0.04, 4, 1, 1.05], [0.065, 0.045, 1, 1.05, 1.25], [0.005, 0.04, 4, 1.1, 1.0], [-0.055, 0.045, 2, 1, 1.2], [-0.12, 0.04, 3, 1, 1.1],
  [0.15, -0.035, 0, 0.9, 0.8], [0.095, -0.05, 3, 1.1, 0.95], [0.04, -0.055, 0, 1.15, 0.75], [-0.015, -0.05, 2, 0.95, 1.0], [-0.06, -0.055, 0, 1.1, 0.8], [-0.155, -0.03, 4, 0.95, 0.9]];
const ANSWER = [-0.1, -0.08];            // the one who answers, at her near rail
const ROWERS = [[0.07, 0], [0.02, 1], [0.115, 2], [-0.115, 2]];      // seated in the rowing boat (the first two at the oars)
const STAND = -0.065;                      // the man standing in it

const bz2 = (a, c, b, q, o) => { const k = 1 - q, du = 2 * k * (c[0] - a[0]) + 2 * q * (b[0] - c[0]), dv = 2 * k * (c[1] - a[1]) + 2 * q * (b[1] - c[1]), l = Math.hypot(du, dv) || 1; o.u = k * k * a[0] + 2 * k * q * c[0] + q * q * b[0]; o.o = k * k * a[1] + 2 * k * q * c[1] + q * q * b[1]; o.du = du / l; o.dv = dv / l; return o; };
const bz3 = (a, c1, c2, b, q, o) => {
  const k = 1 - q, f = i => k * k * k * a[i] + 3 * k * k * q * c1[i] + 3 * k * q * q * c2[i] + q * q * q * b[i], g = i => 3 * k * k * (c1[i] - a[i]) + 6 * k * q * (c2[i] - c1[i]) + 3 * q * q * (b[i] - c2[i]);
  const du = g(0), dv = g(1), l = Math.hypot(du, dv) || 1; o.u = f(0); o.o = f(1); o.du = du / l; o.dv = dv / l; return o;
};

// ---------------------------------------------------------------- geometry: smooth painted surfaces for the rig
// A surface from a function of (a, b) in 0..1: smooth normals (turned to the side `out` says is outside), a colour and
// a flex (how the wind moves it: belly, shiver, phase, flag) at every point.
function surf(nu, nv, pf, cf, out, ff) {
  const G = [], p = new THREE.Vector3(), pa = new THREE.Vector3(), pb = new THREE.Vector3(), n = new THREE.Vector3(), r = new THREE.Vector3(), c = new THREE.Color(), e = 2e-3;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const a = i / nu, b = j / nv;
    pf(Math.min(1, a + e), b, pa); pf(Math.max(0, a - e), b, n); pa.sub(n);
    pf(a, Math.min(1, b + e), pb); pf(a, Math.max(0, b - e), n); pb.sub(n);
    pf(a, b, p); n.crossVectors(pa, pb); if (n.lengthSq() < 1e-18) n.set(0, 1, 0); n.normalize();
    out(p, r); if (n.dot(r) < 0) n.negate();
    cf(a, b, p, c);
    G.push({ p: p.clone(), n: n.clone(), c: c.clone(), f: ff ? ff(a, b) : [0, 0, 0, 0] });
  }
  const P = [], N = [], C = [], F = [], fn = new THREE.Vector3();
  const tri = (A, B, D) => {
    fn.crossVectors(pa.subVectors(B.p, A.p), pb.subVectors(D.p, A.p)); n.copy(A.n).add(B.n).add(D.n);
    for (const v of fn.dot(n) < 0 ? [A, D, B] : [A, B, D]) { P.push(v.p.x, v.p.y, v.p.z); N.push(v.n.x, v.n.y, v.n.z); C.push(v.c.r, v.c.g, v.c.b); F.push(...v.f); }
  };
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const A = G[j * (nu + 1) + i], B = G[j * (nu + 1) + i + 1], D = G[(j + 1) * (nu + 1) + i], E = G[(j + 1) * (nu + 1) + i + 1]; tri(A, B, D); tri(B, E, D); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aFlex', new THREE.Float32BufferAttribute(F, 4));
  return g;
}
// Several of them (and the kit's own shapes, which do not flex) as one part.
function join(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const [name, size] of [['position', 3], ['normal', 3], ['color', 3], ['aFlex', 4]]) {
    const a = new Float32Array(n * size); let o = 0;
    for (const g of list) { const s = g.attributes[name]; if (s) a.set(s.array, o); o += g.attributes.position.count * size; }
    out.setAttribute(name, new THREE.BufferAttribute(a, size));
  }
  return out;
}
// Each point of a shape its own colour, from where it is.
function tint(g, fn) { const p = g.attributes.position, c = g.attributes.color, k = new THREE.Color(), v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { fn(v.fromBufferAttribute(p, i), k); c.setXYZ(i, k.r, k.g, k.b); } return g; }
// An open boat: bluff at both ends, the sheer rising to them; x forward, y up (0 at the waterline), z across.
function hull({ len, beam, free, draft, bow = 0.03, stern = 0.02, full = 2.6, nu = 28, nv = 12 }, paint, inside) {
  const half = s => beam / 2 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * s - 1), full)), 0.5);
  const top = s => free + (s > 0.5 ? bow : stern) * Math.pow(Math.abs(2 * s - 1), 2.2);
  const skin = surf(nu, nv, (a, b, p) => {
    const e = Math.abs(2 * a - 1), ang = b * Math.PI, c = Math.cos(ang), t = top(a);
    p.set((a - 0.5) * len, t - (t + draft * (1 - 0.55 * e * e)) * Math.pow(Math.sin(ang), 0.8), half(a) * Math.sign(c) * Math.pow(Math.abs(c), 0.55));
  }, (a, b, p, c) => paint(a, (p.y + draft) / (top(a) + draft), c), (p, r) => r.set(0, p.y - free * 0.4, p.z));
  const well = surf(Math.round(nu / 2), 4, (a, b, p) => { const s = 0.04 + 0.92 * a; p.set((s - 0.5) * len, top(s) - free * 0.24, (b * 2 - 1) * half(s) * 0.9); }, (a, b, p, c) => inside(a, b, c), (p, r) => r.set(0, 1, 0));
  return { skin, well, top };
}

lifeFor(4796, {
  title: /^Fishing Boats with Hucksters/,
  word: 'bargain',
  stage: { out: 1.8, half: 1.6, cam: { dist: 3.0, height: 0.8, side: 0.3, fov: 60, lookU: -0.02, lookOut: 0.5, lookH: 0.89 } },
  wake: 2, ret: 2.3,

  build(L) {
    const P = L.pal, col = (h, a = 0.22) => P.near(h, a);
    this.T3 = new THREE.Vector3(L.tx, 0, L.tz); this.N3 = new THREE.Vector3(L.nx, 0, L.nz); this.UP = new THREE.Vector3(0, 1, 0);
    this.S = { t: 0, grow: 0, amp: 0, bore: 0, E: 0, m: 0 };
    this.sun = { u: -1.2, o: 1.3, r: 0.4, k: 0 };
    this.F = { u: 0, o: 0, du: -1, dv: 0, s: 0, M: new THREE.Matrix4(), on: false }; this.H = { u: 0, o: 0, du: -1, dv: 0, s: 0, M: new THREE.Matrix4(), on: false };
    this.Tn = { u: 0, o: 0, du: -1, dv: 0, s: 0, M: new THREE.Matrix4(), on: false }; this.Fd = { u: 0, o: 0, du: -1, dv: 0, s: 0 };
    this.F0 = { u: FF[0], o: FF[1], du: FD[0], dv: FD[1], s: 1 }; this.H0 = { u: HH1[0], o: HH1[1], du: FD[0], dv: FD[1], s: 1 };
    this.v = new THREE.Vector3(); this.a = new THREE.Vector3(); this.b = new THREE.Vector3(); this.x3 = new THREE.Vector3(); this.y3 = new THREE.Vector3(); this.z3 = new THREE.Vector3(); this.p3 = new THREE.Vector3(); this.q3 = new THREE.Vector3();
    this.pb = new THREE.Vector3(); this.m4 = new THREE.Matrix4(); this.l4 = new THREE.Matrix4(); this.e3 = new THREE.Euler(); this.qt = new THREE.Quaternion(); this.h0 = [0, 0]; this.h1 = [0, 0];
    this.calm = false; this.bT = 0; this.g0 = 0; this.told = false; this.kc = new THREE.Color();
    this.buildSea(L, col); this.buildRig(L, col); this.buildCards(L, col);
    this.bands = [this.makeScore(L, false), this.makeScore(L, true)]; this.band = this.bands[0];
    this.surf = L.voice().loop({ lp: 700, hp: 80 }); this.hiss = L.voice().loop({ lp: 5200, hp: 1800 });
    this.hideAll();
  },

  // ---------------------------------------------------------------- the sea's height (metres over the floor) at (u, out)
  sea(u, o) {
    const S = this.S, x = u / SA + 1e-5, y = Math.max(o, 0) / SB, th = Math.atan2(y, x);
    const r = Math.hypot(x, y) / (1 + 0.08 * Math.sin(3 * th + 0.6) + 0.05 * Math.sin(5 * th + 2.3) + 0.03 * Math.sin(9 * th + 1.1));
    const m = S.grow - r, E = ease.smooth(m / 0.32);
    S.m = m; S.E = E;
    if (E <= 0) return 0;
    const f1 = (u * W1.d[0] + o * W1.d[1]) * W1.k - S.t * W1.w;
    let w = W1.a * (Math.sin(f1) - 0.22 * Math.cos(2 * f1));
    w += W2.a * Math.sin((u * W2.d[0] + o * W2.d[1]) * W2.k - S.t * W2.w);
    w += W3.a * Math.sin((u * W3.d[0] + o * W3.d[1]) * W3.k - S.t * W3.w);
    const q = (m - 0.2) / 0.1;
    return LIFT + E * Math.max(0.012, Y0 + S.amp * w) + S.bore * Math.exp(-q * q) * ease.smooth(m / 0.08);
  },
  // how much of the sun lies on (u, out): the same patch the sea and the rig draw
  sunAt(u, o) { const s = this.sun, d = Math.hypot(u - s.u, (o - s.o) * 1.2); return s.k * (1 - sm(d, s.r * 0.5, s.r * 1.1)); },

  buildSea(L, col) {
    const NX = 72, NZ = 56, u0 = -SA * 1.14, u1 = SA * 1.14, o0 = -L.wall - 0.02, o1 = SB * 1.1;
    const pos = [], uo = [], idx = [], v = new THREE.Vector3();
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const u = lerp(u0, u1, i / NX), o = lerp(o0, o1, j / NZ); L.floor(u, o, v); pos.push(v.x, v.y + LIFT, v.z); uo.push(u, o); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + NX + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUO', new THREE.Float32BufferAttribute(uo, 2)); g.setIndex(idx);
    // his paint: long soft strokes swept along the seas, close in tone, one dragged over another
    const css = (h, a = 0.2) => col(h, a).getStyle();
    const paint = strokes({
      size: 512, seed: 4796, n: 1000, len: [70, 230], width: [14, 46], bend: 0.32, lift: 0.05, base: css('#62533c'),
      colors: [['#4b4131', 2.4], ['#5a4d38', 4], ['#6d5c42', 4], ['#796848', 3], ['#85724f', 2], ['#5c5338', 1.6], ['#6a6248', 1.2], ['#8f7b56', 0.9]].map(([c, w]) => [css(c), w]),
      angle: (x, y, r) => 0.38 * Math.sin(x * TAU + y * 4.0) + 0.22 * Math.sin(y * TAU * 2 + 1.3) + (r() - 0.5) * 0.5,
    });
    // his froth: ragged touches and drags of thick pale paint, and dots of it (its alpha is where the paint is)
    const froth = canvasTexture(512, 512, (g, W, H) => {
      g.clearRect(0, 0, W, H); g.lineCap = 'round';
      const R = () => L.rand(), each = (x, y, r, f) => { for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) if (x + ox > -r && x + ox < W + r && y + oy > -r && y + oy < H + r) f(x + ox, y + oy); };
      // (in clumps, each dragged its own way, with loose touches and dots between)
      const touch = (x, y, len, w, a, al) => { const b = (R() - 0.5) * len * 0.6; each(x, y, len, (X, Y) => { g.strokeStyle = `rgba(255,255,255,${al})`; g.lineWidth = w; g.beginPath(); g.moveTo(X - Math.cos(a) * len / 2, Y - Math.sin(a) * len / 2); g.quadraticCurveTo(X - Math.sin(a) * b, Y + Math.cos(a) * b, X + Math.cos(a) * len / 2, Y + Math.sin(a) * len / 2); g.stroke(); }); };
      for (let k = 0; k < 64; k++) {
        const cx = R() * W, cy = R() * H, a0 = (R() - 0.5) * 1.3, n = 3 + Math.floor(R() * 9), sp = 14 + R() * 34;
        for (let i = 0; i < n; i++) touch(cx + (R() - 0.5) * sp * 2.4, cy + (R() - 0.5) * sp, 5 + R() * R() * 44, 1.8 + R() * 6.5, a0 + (R() - 0.5) * 0.7, 0.5 + 0.5 * R());
      }
      for (let i = 0; i < 90; i++) touch(R() * W, R() * H, 4 + R() * 16, 1.5 + R() * 3.5, (R() - 0.5) * 2, 0.5 + 0.5 * R());
      for (let i = 0; i < 130; i++) { const x = R() * W, y = R() * H, r = 1.6 + R() * R() * 3.6, al = 0.55 + 0.45 * R(); each(x, y, r, (X, Y) => { g.fillStyle = `rgba(255,255,255,${al})`; g.beginPath(); g.arc(X, Y, r, 0, TAU); g.fill(); }); }
    }, false);
    froth.wrapS = froth.wrapT = THREE.RepeatWrapping; froth.anisotropy = 4;
    const u = this.su = {
      uT: { value: 0 }, uGrow: { value: 0 }, uAmp: { value: 0 }, uBore: { value: 0 }, uSun: { value: new THREE.Vector4(-1.2, 1.3, 0.4, 0) }, uGlint: { value: 1 }, tPaint: { value: paint }, tFroth: { value: froth },
      cGold: { value: col('#d0a65e', 0.2) }, cFroth: { value: col('#ecdfc0', 0.12) }, cFrothS: { value: col('#978c73', 0.2) }, cHaze: { value: col('#2f2b24', 0.2) }, cDeep: { value: col('#443b2e', 0.2) },
    };
    const v2 = d => `vec2(${GL(d[0])}, ${GL(d[1])})`;
    const HEAD = `
uniform float uT, uGrow, uAmp, uBore, uGlint; uniform vec4 uSun;
varying vec2 vUO; varying vec4 vSea;
const vec2 D1 = ${v2(W1.d)}; const vec2 D2 = ${v2(W2.d)}; const vec2 D3 = ${v2(W3.d)};
const float K1 = ${GL(W1.k)}; const float O1 = ${GL(W1.w)}; const float K2 = ${GL(W2.k)}; const float O2 = ${GL(W2.w)}; const float K3 = ${GL(W3.k)}; const float O3 = ${GL(W3.w)};`;
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: true, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec2 aUO;${HEAD}
float seaH(vec2 p, out float m) {
  vec2 q = vec2(p.x / ${GL(SA)} + 1.0e-5, max(p.y, 0.0) / ${GL(SB)}); float th = atan(q.y, q.x);
  float r = length(q) / (1.0 + 0.08 * sin(3.0 * th + 0.6) + 0.05 * sin(5.0 * th + 2.3) + 0.03 * sin(9.0 * th + 1.1));
  m = uGrow - r; float E = smoothstep(0.0, 0.32, m);
  float f1 = dot(p, D1) * K1 - uT * O1;
  float w = ${GL(W1.a)} * (sin(f1) - 0.22 * cos(2.0 * f1)) + ${GL(W2.a)} * sin(dot(p, D2) * K2 - uT * O2) + ${GL(W3.a)} * sin(dot(p, D3) * K3 - uT * O3);
  float qb = (m - 0.2) / 0.1;
  return E * max(0.012, ${GL(Y0)} + uAmp * w) + uBore * exp(-qb * qb) * smoothstep(0.0, 0.08, m);
}`).replace('#include <begin_vertex>', `#include <begin_vertex>
  float hm, hm2; float h0 = seaH(aUO, hm);
  float hu = seaH(aUO + vec2(0.03, 0.0), hm2), ho = seaH(aUO + vec2(0.0, 0.03), hm2);
  transformed.y += h0; vUO = aUO; vSea = vec4(h0, (hu - h0) / 0.03, (ho - h0) / 0.03, hm);`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>${HEAD}
uniform sampler2D tPaint, tFroth; uniform vec3 cGold, cFroth, cFrothS, cHaze, cDeep; vec3 hCol; float hA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 p = vUO; float m = vSea.w;
  // his brush: long strokes swept along the seas at two sizes, carried slowly with the water
  vec2 cr = vec2(D1.y, -D1.x);
  vec2 tuv = vec2(dot(p, cr) / 1.5, dot(p, D1) / 1.25 - uT * 0.035);
  vec4 tx = texture2D(tPaint, tuv);
  vec4 t2 = texture2D(tPaint, tuv * vec2(0.47, 0.61) + vec2(0.31, 0.17 + uT * 0.014));
  float f1 = dot(p, D1) * K1 - uT * O1, f2 = dot(p, D2) * K2 - uT * O2;
  float hgt = 0.7 * (sin(f1) - 0.22 * cos(2.0 * f1)) + 0.36 * sin(f2);
  vec3 c = mix(tx.rgb, t2.rgb, 0.55);
  // the seas' own shapes: each one lit on the side that faces the light (from the left, in front), dark in its trough
  vec3 nr = normalize(vec3(-vSea.y * 2.2, 1.0, -vSea.z * 2.2));
  float lf = dot(nr, normalize(vec3(-0.55, 0.62, 0.5)));
  float sh = smoothstep(0.3, 0.96, lf + 0.1 * hgt * uAmp + (t2.a - 0.6) * 0.16);
  // the sun, where it has opened: it takes the water a stroke at a time
  float sd = length((p - uSun.xy) * vec2(1.0, 1.2));
  float sun = uSun.w * (1.0 - smoothstep(uSun.z * 0.5, uSun.z * 1.1, sd + (t2.a - 0.62) * 0.3));
  // in the storm's light: umber and olive, going down into the dark on the right, as his sea does
  float right = smoothstep(0.1, 1.35, p.x - 0.3 * p.y);
  vec3 storm = mix(cDeep, c * 0.9, 0.2 + 0.8 * sh) * mix(1.0, 0.66, right);
  vec3 lit = mix(c * 1.02, mix(c * 1.5, cGold, 0.3), sh);
  float lk = sun * (1.0 - 0.55 * right);
  c = mix(storm, lit, lk);
  // froth: ragged touches dragged along the crests and down the faces; dull in the storm, cream in the sun
  vec2 fuv = vec2(dot(p, cr) / 0.92, dot(p, D1) / 0.92 - uT * 0.05);
  float fa = texture2D(tFroth, fuv).a, fb = texture2D(tFroth, fuv * 0.57 + vec2(0.43, 0.11 + uT * 0.025)).a;
  float crest = smoothstep(0.1, 0.95, hgt) * uAmp, patchy = smoothstep(0.42, 0.75, t2.a);
  float fr = max(fa * smoothstep(0.35, 0.8, crest * (0.55 + 0.75 * patchy)), fb * smoothstep(0.6, 1.0, crest + 0.25 * patchy - 0.2));
  vec3 fc = mix(cFrothS * mix(1.0, 0.55, right), cFroth, lk);
  c = mix(c, fc, fr * mix(0.62, 0.95, lk));
  // the thick paint: in the sun, dots and drags of it stand up cream all over the lit water
  float tw = mix(1.0, 0.75 + 0.25 * sin(uT * 2.1 + fuv.x * 23.0 + fuv.y * 17.0), uGlint);
  c = mix(c, cFroth, 0.2 * patchy * crest * lk);
  c = mix(c, cFroth * 1.04, fa * smoothstep(0.64, 0.84, t2.a + 0.2 * sh) * lk * 0.72 * tw);
  // the far water going under the storm at the wall
  c = mix(c, cHaze, (1.0 - smoothstep(0.0, 0.42, p.y)) * mix(0.7, 0.45, lk));
  // the first water over the floor, and the sea's edge: thin, darker, with a lace of froth that breaks up
  float qb = (m - 0.2) / 0.1, bore = exp(-qb * qb) * smoothstep(0.0, 0.03, uBore);
  c = mix(c, mix(cFrothS, cFroth, 0.3 + 0.7 * lk), smoothstep(0.3, 0.75, bore * (0.35 + fa)) * 0.7);
  float lace = 1.0 - smoothstep(0.0, 0.14, m + (t2.a - 0.6) * 0.08);
  c *= 1.0 - 0.3 * lace;
  c = mix(c, mix(cFrothS, cFroth, lk), lace * 0.5 * fa);
  hCol = c; hA = smoothstep(0.0, 0.11, m + (tx.a - 0.66) * 0.07 + (t2.a - 0.6) * 0.06 + (fa - 0.3) * 0.03);
  if (hA < 0.03) discard;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = hCol; diffuseColor.a = hA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'hucksters-sea';
    this.water = new THREE.Mesh(g, m); this.water.renderOrder = 5;
    L.add(this.water);
  },

  // ---------------------------------------------------------------- the rig: hulls, spars, sails, oars, buoy, baskets
  buildRig(L, col) {
    const ru = this.ru = {
      uT: { value: 0 }, uBelly: { value: 0 }, uShake: { value: 0 }, uFlag: { value: 0.007 }, uRate: { value: 13 }, uSun: this.su.uSun,
      uC: { value: new THREE.Vector2(L.cx, L.cz) }, uTN: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) },
      uShade: { value: new THREE.Color(0.66, 0.68, 0.7) }, uLit: { value: new THREE.Color(1.18, 1.1, 0.96) },
    };
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.44, side: THREE.DoubleSide });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, ru);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aFlex; uniform float uT, uBelly, uShake, uFlag, uRate; varying vec3 vWp;')
        // the wind in the cloth: a belly, a shiver that runs out to the leech, and the flag's ripple
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed += objectNormal * (aFlex.x * uBelly + (aFlex.y * uShake + aFlex.w * uFlag) * sin(aFlex.z - uT * uRate));')
        .replace('#include <project_vertex>', `#include <project_vertex>
  #ifdef USE_BATCHING
  vWp = (modelMatrix * (batchingMatrix * vec4(transformed, 1.0))).xyz;
  #else
  vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;
  #endif`);
      // the same sun as the sea's, by where each point stands: dull and cool outside it, warm in it
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec4 uSun, uTN; uniform vec2 uC; uniform vec3 uShade, uLit; varying vec3 vWp; vec3 sunC;')
        .replace('#include <color_fragment>', `#include <color_fragment>
  { vec2 d = vWp.xz - uC; vec2 uo = vec2(dot(d, uTN.xy), dot(d, uTN.zw));
    float sk = uSun.w * (1.0 - smoothstep(uSun.z * 0.5, uSun.z * 1.1, length((uo - uSun.xy) * vec2(1.0, 1.2))));
    sunC = mix(uShade, uLit, sk); diffuseColor.rgb *= sunC; }`)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb * sunC;');
    };
    mat.customProgramCacheKey = () => 'hucksters-rig';
    const rig = this.rig = L.rig(40, 16000, mat), k = new THREE.Color(), k2 = new THREE.Color();
    const streak = (a, f, s) => 1 + s * Math.sin(a * f) * Math.sin(a * f * 2.7 + 1.3);
    const rigid = g => join([g]);

    // ---- the fishing boat: tubby, banded cream, pink-brown and dark, as he painted her
    {
      const wale = col('#4c3826'), cream = col('#dfcba6', 0.15), pink = col('#a27754'), buff = col('#c0a076'), wet = col('#4a3b2a'), well = col('#594630'), well2 = col('#735c40');
      const h = hull({ len: 0.44, beam: 0.21, free: 0.088, draft: 0.04, bow: 0.03, stern: 0.022, full: 2.9, nu: 30, nv: 14 }, (a, v, c) => {
        const w = v + 0.016 * Math.sin(a * 31) + 0.011 * Math.sin(a * 67 + 2);      // (no strake is ruled: each edge wanders)
        c.copy(wet).lerp(buff, sm(w, 0.33, 0.41)).lerp(pink, sm(w, 0.5, 0.55) * (1 - sm(w, 0.62, 0.67))).lerp(cream, sm(w, 0.66, 0.71)).lerp(wale, sm(w, 0.86, 0.9));
        c.multiplyScalar(streak(a, 23, 0.1) * (0.88 + 0.2 * a) * (1 + 0.07 * Math.sin(a * 140 + v * 9) * Math.sin(v * 60)));
      }, (a, b, c) => c.copy(well).lerp(well2, 0.5 + 0.5 * Math.sin(a * 17 + b * 3)));
      this.fTop = h.top;
      const spar = col('#b48a5c'), sparD = col('#6f5236');
      const mast = tint(shape.move(shape.cyl(0.006, 0.0038, 0.37, 10), 0.04, 0.245, 0, 0, 0, -0.035), (p, c) => c.copy(sparD).lerp(spar, clamp01(0.5 - p.z / 0.008)));
      // the topmast, whipping aft, to carry the flag
      const top = tint(shape.move(shape.cyl(0.0032, 0.0016, 0.152, 8), 0.038, 0.496, 0, 0, 0, 0.11), (p, c) => c.copy(spar));
      this.gFisher = rig.geo(join([h.skin, h.well, mast, top]));
      // the great sail: from the mast aft, loose-footed, its leech a full round; cream where the light is on it,
      // browner and warmer to the luff, the foot and the leech
      const lit = col('#f2d5a0', 0.1), mid = col('#dcb686', 0.14), shade = col('#ad8159', 0.2), TACK = [0, 0.1], THROAT = [0, 0.37], PEAK = [-0.215, 0.468], CLEW = [-0.29, 0.122];
      const shadeOf = (lf, c) => c.copy(shade).lerp(mid, sm(lf, 0, 0.5)).lerp(lit, sm(lf, 0.42, 1));
      const main = surf(14, 12, (a, b, p) => {
        const lx = lerp(TACK[0], CLEW[0], a), ly = lerp(TACK[1], CLEW[1], a) - 0.016 * Math.sin(Math.PI * a), hx = lerp(THROAT[0], PEAK[0], a), hy = lerp(THROAT[1], PEAK[1], a) + 0.008 * Math.sin(Math.PI * a);
        p.set(lerp(lx, hx, b) - 0.042 * Math.sin(Math.PI * Math.pow(b, 0.85)) * Math.pow(a, 1.6), lerp(ly, hy, b), -0.03 * Math.pow(Math.sin(Math.PI * a), 0.8) * (0.35 + 0.65 * Math.sin(Math.PI * b)));
      }, (a, b, p, c) => {
        shadeOf(sm(a, 0.02, 0.42) * (0.4 + 0.6 * sm(b, 0.03, 0.55)) * (1 - 0.5 * sm(a, 0.78, 1)) + 0.05 * Math.sin(b * 7 + a * 4), c);
        c.multiplyScalar(1 - 0.09 * Math.pow(Math.abs(Math.sin(a * Math.PI * 4)), 16));      // the cloths' seams, faintly
      }, (p, r) => r.set(0, 0, -1), (a, b) => [Math.pow(Math.sin(Math.PI * Math.min(1, a * 1.12)), 0.9) * (0.3 + 0.7 * Math.sin(Math.PI * b)), Math.pow(a, 1.3) * (0.35 + 0.65 * b), a * 5.2 + b * 2.4, 0]);
      // its head, blown over above the sprit: the rounded shape that stands over the sail in the picture
      const hood = surf(10, 6, (a, b, p) => {
        const x0 = lerp(-0.045, -0.225, a), y0 = lerp(0.392, 0.466, a) + 0.008 * Math.sin(Math.PI * a), up = 0.014 + 0.07 * Math.pow(Math.sin(Math.PI * Math.pow(a, 0.75)), 0.8);
        p.set(x0 - (0.012 + 0.04 * a) * b, y0 + up * Math.sin(b * Math.PI * 0.5), -0.012 - 0.03 * Math.sin(Math.PI * a) * Math.sin(b * Math.PI * 0.85));
      }, (a, b, p, c) => { shadeOf(0.25 + 0.75 * sm(b, 0.05, 0.6) * (1 - 0.4 * sm(a, 0.7, 1)), c); c.multiplyScalar(1 - 0.16 * Math.pow(Math.abs(Math.sin(a * 8.5 + b * 1.5)), 8)); },
      (p, r) => r.set(0, 0, -1), (a, b) => [0.45 * Math.sin(Math.PI * a) * b, 0.7 * b * (0.4 + 0.6 * a), a * 4.4 + b * 2.6, 0]);
      const sprit = tint(shape.move(shape.cyl(0.003, 0.002, Math.hypot(PEAK[0] - THROAT[0], PEAK[1] - THROAT[1]) + 0.03, 8), (PEAK[0] + THROAT[0]) / 2, (PEAK[1] + THROAT[1]) / 2 + 0.004, 0.002, 0, 0, Math.atan2(-(PEAK[0] - THROAT[0]), PEAK[1] - THROAT[1])), (p, c) => c.copy(sparD));
      this.gMain = rig.geo(join([main, hood, sprit]));
      // the tan sail, forward of the mast and beyond it
      const tan = col('#a17a56'), tanL = col('#bd966c'), tanD = col('#7f5d41');
      this.gFore = rig.geo(surf(9, 9, (a, b, p) => {
        const lx = lerp(0.03, 0.186, a), ly = lerp(0.116, 0.108, a) - 0.008 * Math.sin(Math.PI * a), hx = lerp(0.036, 0.15, a), hy = lerp(0.345, 0.272, a);
        p.set(lerp(lx, hx, b) + 0.014 * Math.sin(Math.PI * b) * a, lerp(ly, hy, b), 0.014 - 0.014 * Math.sin(Math.PI * a) * Math.sin(Math.PI * b));
      }, (a, b, p, c) => c.copy(tanD).lerp(tan, sm(a, 0, 0.35)).lerp(tanL, sm(a, 0.3, 0.9) * (0.4 + 0.6 * b)).multiplyScalar(1 + 0.05 * Math.sin(a * 11 + b * 7)), (p, r) => r.set(0, 0, -1), (a, b) => [0.5 * Math.sin(Math.PI * a) * Math.sin(Math.PI * b), 0.4 * a * Math.sin(Math.PI * b), a * 4 + b * 3, 0]));
      // the flag he signed it on: white, streaming
      const white = col('#f4ecd6', 0.05).multiplyScalar(1.45), whiteS = col('#cdbf9f', 0.12).multiplyScalar(1.3);
      this.gFlag = rig.geo(surf(10, 3, (a, b, p) => p.set(a * 0.088, (b - 0.5) * 0.037 * (1 - 0.25 * a) - 0.013 * a * a, 0), (a, b, p, c) => c.copy(white).lerp(whiteS, 0.5 * a * (0.5 + 0.5 * Math.sin(a * 14))), (p, r) => r.set(0, 0, 1), (a, b) => [0, 0, a * 7.5, Math.pow(a, 0.8)]));
    }
    // ---- the boat she tows: yellow, with green and white in her
    {
      const y1 = col('#d6a646', 0.15), y2 = col('#8b6532'), in1 = col('#b99555'), in2 = col('#6e5330');
      const h = hull({ len: 0.17, beam: 0.07, free: 0.03, draft: 0.014, bow: 0.008, stern: 0.005, full: 2.3, nu: 18, nv: 9 }, (a, v, c) => c.copy(y2).lerp(y1, sm(v, 0.3, 0.7)).multiplyScalar(streak(a, 19, 0.06)), (a, b, c) => c.copy(in1).lerp(in2, Math.pow(Math.abs(Math.sin(a * Math.PI * 3)), 10)));
      this.gTender = rig.geo(join([h.skin, h.well]));
    }
    // ---- the hucksters' boat: low, dark, red-brown
    {
      const d1 = col('#3c2517'), d2 = col('#6a452a'), rail = col('#8a6240'), in1 = col('#4a3220'), in2 = col('#2c1c12');
      const h = hull({ len: 0.3, beam: 0.086, free: 0.034, draft: 0.016, bow: 0.012, stern: 0.008, full: 2.1, nu: 22, nv: 9 }, (a, v, c) => c.copy(d1).lerp(d2, sm(v, 0.3, 0.75)).lerp(rail, sm(v, 0.9, 0.96)).multiplyScalar(streak(a, 21, 0.08)), (a, b, c) => c.copy(in1).lerp(in2, Math.pow(Math.abs(Math.sin(a * Math.PI * 4)), 8)));
      this.gHuck = rig.geo(join([h.skin, h.well]));
      // an oar: from the gunwale out along +z, a pale blade at its end
      const loom = col('#9a7a52'), blade = col('#cdb58c', 0.15);
      this.gOar = rig.geo(rigid(shape.merge([shape.move(shape.cyl(0.0024, 0.002, 0.1, 6, loom), 0, 0, 0.035, Math.PI / 2), shape.move(shape.box(0.004, 0.016, 0.04, blade), 0, 0, 0.1)])));
    }
    // ---- the buoy: a dark cone with a ring at its head, and one worn band
    {
      const dk = col('#40291a'), md = col('#855a3c'), band = col('#b08c64');
      const body = shape.lathe([[0.0001, -0.03], [0.026, -0.03], [0.04, 0.0], [0.042, 0.03], [0.036, 0.07], [0.025, 0.11], [0.014, 0.14], [0.009, 0.152], [0.0001, 0.155]], 20);
      const ring = shape.move(shape.lathe(Array.from({ length: 9 }, (_, i) => [0.017 + 0.0045 * Math.cos(i / 8 * TAU), 0.0045 * Math.sin(i / 8 * TAU)]), 16), 0, 0.172, 0, Math.PI / 2);
      this.gBuoy = rig.geo(rigid(tint(shape.merge([body, ring]), (p, c) => c.copy(dk).lerp(md, clamp01(0.55 - p.z * 16 - p.x * 9 + 0.2 * Math.sin(p.y * 70))).lerp(band, 0.7 * sm(p.y, 0.082, 0.09) * (1 - sm(p.y, 0.1, 0.108)) * (p.y < 0.16 ? 1 : 0)))));
    }
    // ---- a basket, silver on top
    {
      const w1 = col('#c79f60'), w2 = col('#8f6d40'), silver = col('#d9dcd2', 0.06), silverD = col('#9aa3a0', 0.1);
      const tub = tint(shape.lathe([[0.0001, 0], [0.015, 0], [0.021, 0.011], [0.0225, 0.024], [0.0001, 0.024]], 14), (p, c) => c.copy(w1).lerp(w2, 0.5 + 0.5 * Math.sin(p.y * 900) * Math.sin(Math.atan2(p.z, p.x) * 9)));
      const heap = tint(shape.move(shape.ball(1, 0xffffff, 2), 0, 0.024, 0, 0, 0, 0, 0.0195, 0.0085, 0.0195), (p, c) => c.copy(silverD).lerp(silver, clamp01(0.55 + 0.45 * Math.sin(p.x * 420 + p.z * 310))));
      this.gBasket = rig.geo(rigid(shape.merge([tub, heap])));
    }
    // a length of line (a unit one, from 0 to 1 up y; laid between two points)
    this.gLine = rig.geo(rigid(shape.move(shape.cyl(1, 1, 1, 6, col('#7d6546')), 0, 0.5, 0)));

    this.iFisher = rig.add(this.gFisher); this.iMain = rig.add(this.gMain); this.iFore = rig.add(this.gFore); this.iFlag = rig.add(this.gFlag);
    this.iStay = Array.from({ length: 3 }, () => rig.add(this.gLine));
    this.iTender = rig.add(this.gTender); this.iRope = Array.from({ length: 3 }, () => rig.add(this.gLine));
    this.iHuck = rig.add(this.gHuck); this.iOar = Array.from({ length: 4 }, () => rig.add(this.gOar));
    this.iBuoy = rig.add(this.gBuoy); this.iBasket = [rig.add(this.gBasket), rig.add(this.gBasket)]; this.iWhip = rig.add(this.gLine);
    this.parts = [this.iFisher, this.iMain, this.iFore, this.iFlag, ...this.iStay, this.iTender, ...this.iRope, this.iHuck, ...this.iOar, this.iBuoy, ...this.iBasket, this.iWhip];
    this.rope = Array.from({ length: 4 }, () => new THREE.Vector3());
  },

  // ---------------------------------------------------------------- his touches: people, froth, spray, the far boats, haze
  buildCards(L, col) {
    const R = () => L.rand();
    const atlas = canvasTexture(512, 512, g => {
      g.clearRect(0, 0, 512, 512);
      const blob = (x, y, rx, ry, a, lum = 255) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(${lum},${lum},${lum},${a})`); gr.addColorStop(0.55, `rgba(${lum},${lum},${lum},${a * 0.55})`); gr.addColorStop(1, `rgba(${lum},${lum},${lum},0)`); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore(); };
      const cell = (x, y, f) => { g.save(); g.beginPath(); g.rect(x, y, 256, 256); g.clip(); f(x, y); g.restore(); };
      const poly = (X, pts, a = 0.9) => { g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(X + x, y) : g.moveTo(X + x, y))); g.closePath(); g.fill(); };
      // 0: haze and smoke, soft and a little uneven
      cell(0, 0, () => { blob(128, 128, 112, 112, 0.5); for (let i = 0; i < 10; i++) blob(128 + (R() - 0.5) * 120, 128 + (R() - 0.5) * 70, 34 + R() * 40, 24 + R() * 26, 0.22); });
      // 1: the second fishing boat, far off: two sails leaning, a low hull (bows to the left)
      cell(256, 0, X => {
        g.shadowColor = 'rgba(255,255,255,0.8)'; g.shadowBlur = 7;
        poly(X, [[40, 214], [214, 210], [200, 232], [60, 232]]);
        poly(X, [[92, 204], [118, 44], [196, 66], [206, 204]]);
        poly(X, [[60, 206], [112, 60], [88, 204]], 0.8);
        poly(X, [[150, 204], [200, 96], [236, 122], [226, 204]], 0.85);
      });
      // 2: one touch of paint: a few loaded strokes over each other, filling most of the square, ragged at the ends,
      // lit above and dark below (red)
      cell(0, 256, () => {
        g.lineCap = 'round';
        for (let i = 0; i < 20; i++) {
          const y = 384 + (R() - 0.5) * 176, half = 104 * Math.sqrt(Math.max(0.08, 1 - Math.pow((y - 384) / 104, 2))), x0 = 128 - half * (0.7 + 0.3 * R()), x1 = 128 + half * (0.7 + 0.3 * R());
          const v = Math.floor(118 + 137 * clamp01(0.58 - (y - 384) / 190 + (R() - 0.5) * 0.36));
          g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 20 + R() * 18; g.beginPath(); g.moveTo(x0 + 14, y); g.quadraticCurveTo(128, y - 8 + R() * 16, x1 - 14, y + (R() - 0.5) * 12); g.stroke();
        }
      });
      // 3: the steamer: a low hull, a tall funnel, a mast before and abaft it
      cell(256, 256, X => {
        g.shadowColor = 'rgba(255,255,255,0.8)'; g.shadowBlur = 5;
        poly(X, [[30, 452], [232, 446], [214, 486], [50, 486]], 1);
        poly(X, [[112, 450], [116, 330], [142, 330], [146, 450]], 1);
        poly(X, [[66, 450], [70, 300], [78, 300], [82, 450]], 0.9);
        poly(X, [[180, 448], [183, 352], [190, 352], [193, 448]], 0.85);
      });
    }, false);
    const n = this.NC = 190;
    const geo = new THREE.PlaneGeometry(1, 1);
    this.aInfo = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aInfo', this.aInfo); geo.setAttribute('aCol', this.aCol);
    const cu = { tAtlas: { value: atlas } };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, cu);
      // every kind but 5 faces the camera (its size in the matrix's diagonal, a turn on the screen); 5 lies as its matrix
      // lays it (froth, on the water)
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aInfo; attribute vec3 aCol; varying vec4 vInfo; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <project_vertex>', `vec4 mvPosition;
  vQ = position.xy + 0.5; vInfo = aInfo; vCol = aCol;
  if (aInfo.x > 4.5 && aInfo.x < 5.5) mvPosition = modelViewMatrix * (instanceMatrix * vec4(position, 1.0));
  else {
    mvPosition = modelViewMatrix * vec4(instanceMatrix[3].xyz, 1.0);
    float cs = cos(aInfo.z), sn = sin(aInfo.z); vec2 q = position.xy * vec2(instanceMatrix[0][0], instanceMatrix[1][1]);
    mvPosition.xy += vec2(cs * q.x - sn * q.y, sn * q.x + cs * q.y);
  }
  gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D tAtlas; varying vec4 vInfo; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <map_fragment>', `{
  float kd = vInfo.x; vec2 cell = kd < 0.5 ? vec2(0.0, 1.0) : kd < 1.5 ? vec2(1.0, 1.0) : kd < 2.5 ? vec2(0.0, 1.0) : kd < 3.5 ? vec2(0.0, 0.0) : kd < 4.5 ? vec2(1.0, 0.0) : kd < 5.5 ? vec2(0.0, 0.0) : vec2(0.0, 1.0);
  vec4 tx = texture2D(tAtlas, (clamp(vQ, 0.03, 0.97) + cell) * 0.5);
  vec3 c = vCol; float a;
  if (kd < 0.5) a = smoothstep(0.0, 0.4, tx.a) * vInfo.y;                                                // haze, smoke
  else if (kd < 1.5) a = smoothstep(0.04, 0.8, tx.a) * vInfo.y;                                          // the far sail
  else if (kd < 2.5) a = smoothstep(0.3, 0.55, tx.a) * vInfo.y;                                          // a drop
  else if (kd < 3.5) { c = vCol * (0.56 + 0.62 * tx.r); a = smoothstep(0.1, 0.62, tx.a) * vInfo.y; }    // a touch of paint
  else if (kd < 4.5) a = smoothstep(0.04, 0.8, tx.a) * vInfo.y;                                          // the steamer
  else if (kd < 5.5) { c = vCol * (0.72 + 0.36 * tx.r); a = smoothstep(0.3, 0.6, tx.a) * vInfo.y; }     // froth, lying on the water
  else a = smoothstep(0.42, 0.6, tx.a) * vInfo.y;                                                         // a glint
  if (a < 0.01) discard;
  diffuseColor = vec4(c, a);
}`);
    };
    m.customProgramCacheKey = () => 'hucksters-cards';
    const mesh = this.cards = new THREE.InstancedMesh(geo, m, n);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.count = 0; mesh.renderOrder = 6;
    this.cM = mesh.instanceMatrix.array; this.n = 0;
    L.add(mesh);
    // the storm's haze along the foot of the wall: dark on the left, where his storm stands, warmer to the right
    const hzL = col('#3f3c35', 0.15), hzR = col('#5e5140', 0.15);
    this.HZ = Array.from({ length: N_HAZE }, (_, i) => { const a = R(), b = R(), c = R(), u = -1.6 + 3.2 * (i + a) / N_HAZE; return { u, h: 0.1 + 0.1 * b, o: 0.04 + 0.1 * c, w: 0.8 + 0.4 * R(), sy: 0.5, al: 0.3 + 0.14 * a, v: 0.006 + 0.01 * b, ph: R() * TAU, c: hzL.clone().lerp(hzR, sm(u, -0.6, 1.2)) }; });
    this.cGoldLo = col('#8a6a42', 0.2); this.cGoldHi = col('#e2b469', 0.12);
    this.cFar = col('#a88a68', 0.2); this.cSteam = col('#3d342a', 0.2); this.cSmoke = col('#a39680', 0.2);
    this.SMK = Array.from({ length: N_SMOKE }, (_, i) => ({ a: (i + R() * 0.5) / N_SMOKE, b: R(), ph: R() * TAU }));
    // the people, a touch each: shirts, a blue coat, a red cap, ochre oilskins, brown
    this.cShirt = [col('#cdb891', 0.16), col('#6f7a80', 0.25), col('#9a5238', 0.16), col('#c4a25c', 0.16), col('#6e543c', 0.18)];
    this.cFace = col('#b98f68', 0.18); this.cHuck = [col('#7a3a26', 0.14), col('#5b3524', 0.15), col('#4a3a2c', 0.15)]; this.cHat = col('#3a2a1e', 0.15);
    this.cWicker = col('#b08a50', 0.15); this.cGreen = col('#5f7b55', 0.12); this.cWhite = col('#e3dcc6', 0.08);
    this.CW = CREW.map(() => ({ ph: R() * TAU, w: 0.6 + 0.6 * R() }));
    this.cFroth = col('#efe2c4', 0.1); this.cFrothS = col('#8c836d', 0.2); this.cDrop = col('#f3ecd8', 0.06); this.cCoin = col('#f1cd76', 0.08); this.cSilver = col('#e4e6dc', 0.05);
    this.FM = Array.from({ length: N_FOAM }, (_, i) => ({ a: (i + R()) / N_FOAM * TAU, r: 0.8 + 0.5 * R(), s: 0.03 + 0.028 * R(), ph: R() * TAU }));
    this.SK = Array.from({ length: N_SPARK }, () => ({ u: -1.15 + 1.9 * R(), o: 0.45 + 1.15 * R(), s: 0.035 + 0.035 * R(), ph: R() * TAU, w: 0.8 + 0.8 * R(), r: (R() - 0.5) * 1.2 }));
    this.SP = Array.from({ length: N_SPRAY }, () => ({ a: R(), b: R(), c: R(), d: R() }));
    this.SQ = Array.from({ length: N_SPLASH }, (_, i) => ({ a: (i + R()) / N_SPLASH * TAU, b: R(), c: R() }));
    this.fp = new THREE.Vector3(); this.fx = new THREE.Vector3(); this.fy = new THREE.Vector3(); this.fn = new THREE.Vector3();
  },

  // ---------------------------------------------------------------- sound: the water, the two voices, the oars
  // (calm: for "Reduce motion and flashing": everything softer and slower to come in, nothing sudden)
  makeScore(L, calm) {
    const s = score(L), v = calm ? 0.62 : 1, att = calm ? 0.05 : 0.014, st = Math.pow(2, 1 / 12);
    // a hail: a short note to carry it, then the price, held, falling away a little at the end. The hucksters' is the
    // lighter voice and comes up from under its note; the fishing boat's has a deeper one under it and comes down to its.
    const call = (t, who, n, d = 0.42, list = null, k = 1) => {
      const f = hz(n), ev = [{ t, f: f * Math.pow(st, who ? 3 : -5), d: 0.13, type: 'triangle', vol: 0.019 * v * k, attack: att }, { t: t + 0.12, f, d, type: 'triangle', vol: 0.03 * v * k, attack: att, to: f * 0.984 }];
      if (who) ev.push({ t: t + 0.12, f: f / 2, d, type: 'sine', vol: 0.02 * v * k, attack: att, to: f / 2 * 0.984 });
      for (const e of ev) { if (list) list.push(e); else s.note(e.t, e.f, e.d, e); }
    };
    const plash = (t, list = null, k = 1) => { const e = { t, noise: true, d: 0.16, vol: 0.0065 * v * k, hp: 1300, lp: 5200, attack: 0.03 }; if (list) list.push(e); else s.hit(t, e); };
    const creak = (t, list = null) => { const a = { t, f: 96, d: 0.4, type: 'sawtooth', vol: 0.0045 * v, to: 122, attack: 0.09 }; if (list) list.push(a); else s.note(a.t, a.f, a.d, a); };
    const coin = (t, i, list = null) => { const e = { t, f: [2637, 2794, 3136][i], d: 0.2, type: 'sine', vol: 0.0065 * v, attack: calm ? 0.02 : 0.004 }; if (list) list.push(e); else s.note(e.t, e.f, e.d, e); };
    const landed = (t, list = null) => { const e = { t, noise: true, d: 0.2, vol: 0.012 * v, lp: 620, attack: calm ? 0.05 : 0.01 }; if (list) list.push(e); else s.hit(t, e); plash(t + 0.03, list, 1.2); };
    s.hit(0.12, { d: 1.6, vol: 0.016 * v, lp: 800, hp: 120, attack: 0.6 });                  // the first water over the floor
    for (const k of STROKES) plash(k.t + 0.05);
    for (const c of CALLS) call(c.t, c.who, c.n, c.d);
    // the deal: both on the one note, and it opens out under them as the light does
    call(T_DEAL, 0, 'F4', 0.95); call(T_DEAL + 0.14, 1, 'F4', 0.85);
    for (const [n, vol] of [['A4', 0.011], ['C5', 0.01], ['F3', 0.016]]) s.note(T_DEAL + 0.3, hz(n), 2.5, { type: 'sine', vol: vol * v, attack: calm ? 0.7 : 0.4 });
    s.hit(T_DEAL + D_FILL, { d: 0.55, vol: 0.03 * v, lp: 300, attack: calm ? 0.22 : 0.05 });      // the sail filling
    creak(T_DEAL + D_SWING - 0.05); landed(T_DEAL + D_LAND);
    D_COIN.forEach((d, i) => coin(T_DEAL + d + COIN_FLY, i));
    // and on, while you look: the price is known now, so it is only called and answered; another basket, and paid for
    const ev = [];
    for (const c of LOOP.calls) call(c.t, c.who, c.n, c.d, ev, 0.8);
    creak(LOOP.deal + D_SWING - 0.05, ev); landed(LOOP.deal + D_LAND, ev);
    D_COIN.forEach((d, i) => coin(LOOP.deal + d + COIN_FLY, i, ev));
    s.loop(LOOP.t, LOOP.P, ev);
    return s.done();
  },

  hideAll() {
    this.cards.count = 0; this.cards.visible = false; this.water.visible = false;
    for (const i of this.parts) this.rig.show(i, false);
    this.rig.mesh.visible = false;
  },
  start(L, resumed) { if (!resumed) this.hideAll(); this.band.from(L.t); },
  back(L) {
    this.bT = L.t; this.g0 = this.S.grow;
    this.fisherAt(L.t, this.F0); this.huckAt(L.t, this.H0);
  },
  end() { this.hideAll(); this.surf.set(0); this.hiss.set(0); },
  reset() { this.hideAll(); this.surf.set(0); this.hiss.set(0); },

  // ---------------------------------------------------------------- the clocks
  // seconds since the last deal (negative: it is still to come), and how many baskets have gone across before it
  dealAt(t) { if (t < LOOP.t) return t - T_DEAL; return ((t - LOOP.t) % LOOP.P) - LOOP.deal; },
  // an arm going up for a call and coming down again: who 0 the man standing in the rowing boat, who 1 the answerer
  armAt(t, who) {
    let a = 0;
    if (t < LOOP.t) { for (const c of CALLS) if (c.who === who) a = Math.max(a, sm(t, c.t - 0.14, c.t + 0.04) * (1 - sm(t, c.t + 0.42, c.t + 0.62))); }
    else { const q = (t - LOOP.t) % LOOP.P; for (const c of LOOP.calls) if (c.who === who) a = Math.max(a, sm(q, c.t - 0.14, c.t + 0.04) * (1 - sm(q, c.t + 0.3, c.t + 0.5))); }
    const d = this.dealAt(t);
    return Math.max(a, sm(d, -0.12, 0.06) * (1 - sm(d, 0.95, 1.3)) * (t < LOOP.t ? 1 : 0));
  },
  // how far the oars have brought the rowing boat (0 to 1), and where in a stroke they are (o.reach: blades forward,
  // o.pull: 0 to 1 through the water)
  rowAt(t, o) {
    let p = 0; o.reach = 0; o.pull = -1; o.fin = 0;
    for (const k of STROKES) {
      p = lerp(p, k.to, ease.out(ramp(t, k.t + 0.06, k.t + k.d + 0.3)));
      this.oarAt(t - k.t, k.d, o);
    }
    o.p = p; return o;
  },
  oarAt(x, d, o) {
    if (x > -0.22 && x <= 0) o.reach = Math.max(o.reach, sm(x, -0.22, -0.02));                    // blades forward, clear of the water
    else if (x > 0 && x < d * 0.62) { o.reach = 1; o.pull = x / (d * 0.62); }                        // through it
    else if (x >= d * 0.62 && x < d + 0.15) o.fin = Math.max(o.fin, 1 - sm(x, d * 0.62, d + 0.15));  // out, and back to rest
  },

  // ---------------------------------------------------------------- where each boat is
  fisherAt(t, o) {
    const q = spread(ramp(t, 0.3, 2.25)); bz2(FA, FC, FF, q, o);
    const lie = sm(t, 2.2, 3.4), yaw = 0.07 * Math.sin(t * 0.55 + 1) * lie, c = Math.cos(yaw), s = Math.sin(yaw), du = o.du * c - o.dv * s, dv = o.du * s + o.dv * c;
    o.du = du; o.dv = dv; o.u += 0.018 * Math.sin(t * 0.4) * lie; o.o += 0.012 * Math.sin(t * 0.33 + 2) * lie;
    o.s = lerp(0.29, 0.96, sm(q, 0, 0.85)) * sm(t, 0.3, 0.6);
    return o;
  },
  huckAt(t, o) {
    const row = this.row || (this.row = {}); this.rowAt(t, row);
    bz3(HH0, HC1, HC2, HH1, row.p, o);
    const lie = sm(t, 5.9, 7), k = sm(row.p, 0.85, 1);
    o.u += 0.018 * Math.sin(t * 0.4) * sm(t, 2.2, 3.4) * k; o.o += 0.012 * Math.sin(t * 0.33 + 2) * sm(t, 2.2, 3.4) * k + 0.006 * Math.sin(t * 0.8) * lie;
    o.s = lerp(0.42, 1, sm(row.p, 0, 0.45)) * sm(t, 0.7, 1.0);
    return o;
  },
  // going home: from where she was, on round and in to the foot of the wall, smaller and smaller, back into the distance
  homeAt(R, from, home, lead, o) {
    const q = ease.inOut(ramp(R, 0.03, 0.78)), a = this.h0, c = this.h1;
    a[0] = from.u; a[1] = from.o; c[0] = from.u + from.du * lead * from.s; c[1] = from.o + from.dv * lead * from.s;
    bz2(a, c, home, q, o);
    o.s = from.s * lerp(1, 0.28, sm(q, 0.15, 1)) * (1 - sm(R, 0.76, 0.9));
    return o;
  },
  // stand a boat on the sea: her matrix (x forward, y up, z across; her own size) from where she is and how the water
  // lies under her; heel leans her masthead downwind
  ride(L, B, len, wid, heel, dip = 0) {
    const s = Math.max(B.s, 1e-4), h = this.sea(B.u, B.o), E = this.S.E; B.h = h;
    const a = len * s, b = wid * s, nu = -B.dv, no = B.du;
    const hf = (this.sea(B.u + B.du * a, B.o + B.dv * a) - this.sea(B.u - B.du * a, B.o - B.dv * a)) / (2 * a), hs = (this.sea(B.u + nu * b, B.o + no * b) - this.sea(B.u - nu * b, B.o - no * b)) / (2 * b);
    const X = this.x3, Y = this.y3, Z = this.z3, T = this.T3, O = this.N3, k = 0.75;
    X.set(B.du * T.x + B.dv * O.x, k * hf, B.du * T.z + B.dv * O.z).normalize();
    Y.set(-(k * hs * nu - heel * WIND[0]) * T.x - (k * hs * no - heel * WIND[1]) * O.x, 1, -(k * hs * nu - heel * WIND[0]) * T.z - (k * hs * no - heel * WIND[1]) * O.z).normalize();
    Z.crossVectors(X, Y).normalize(); Y.crossVectors(Z, X);
    L.floor(B.u, B.o, this.v); this.v.y = L.y + h + dip * s;
    B.M.makeBasis(X, Y, Z).scale(this.p3.set(s, s, s)).setPosition(this.v);
    B.on = s > 0.02 && E > 0.12;
    return B;
  },
  // a rigid part of a boat, at (x, y, z) in her, turned (yaw about her up, then pitch, then roll)
  part(i, B, x = 0, y = 0, z = 0, yaw = 0, pitch = 0, roll = 0, wide = 1) {
    this.rig.show(i, B.on); if (!B.on) return;
    if (x || y || z || yaw || pitch || roll) { this.l4.compose(this.p3.set(x, y, z), this.qt.setFromEuler(this.e3.set(pitch, yaw, roll, 'YXZ')), this.q3.set(wide, 1, 1)); this.m4.multiplyMatrices(B.M, this.l4); this.rig.mat(i, this.m4); }
    else this.rig.mat(i, B.M);
  },
  // a line between two points (world), r thick
  line(i, A, B, r, on = true) {
    this.rig.show(i, on); if (!on) return;
    const X = this.x3, Y = this.y3, Z = this.z3;
    Y.subVectors(B, A); X.crossVectors(Y, this.UP); if (X.lengthSq() < 1e-10) X.set(1, 0, 0); X.normalize(); Z.crossVectors(X, Y).normalize();
    this.m4.makeBasis(X.multiplyScalar(r), Y, Z.multiplyScalar(r)).setPosition(A); this.rig.mat(i, this.m4);
  },

  // a basket, dd seconds after its deal: hoisted from her deck on a whip from the sprit's heel, up against the sail,
  // swung out over the side and lowered into the rowing boat (and home in it)
  basket(i, dd, stack, fade, back) {
    const F = this.F, H = this.H, v = this.v, on = F.on && H.on && dd > D_LIFT && fade > 0.02 && (!back || dd > D_LAND); this.rig.show(i, on); if (!on) return;
    const up = ease.inOut(ramp(dd, D_LIFT, D_SWING)), e = ease.inOut(ramp(dd, D_SWING, D_LAND)), k = 1.25 * sm(dd, D_LIFT, D_LIFT + 0.15) * fade;
    this.q3.set(-0.03, lerp(this.fTop(0.44) - 0.01, 0.2, up), -0.04).applyMatrix4(F.M);
    v.lerpVectors(this.q3, this.pb, e); v.y += (stack * e + 0.035 * Math.sin(Math.PI * e)) * H.s;
    if (e >= 1) this.m4.copy(H.M).scale(this.q3.setScalar(k)); else this.m4.makeBasis(this.T3, this.UP, this.N3).scale(this.q3.setScalar(k * F.s));
    this.rig.mat(i, this.m4.setPosition(v));
    if (dd < D_LAND + 0.55 && !back) {
      // the whip: taut to the basket while it hangs; let go, it runs back up
      this.swung = e < 1; this.bx = v.x; this.by = v.y; this.bz = v.z;
      const top = this.a.set(0.04, 0.385, -0.012).applyMatrix4(F.M), end = this.b.set(v.x, v.y + 0.034 * F.s, v.z).lerp(top, sm(dd, D_LAND + 0.08, D_LAND + 0.5));
      this.line(this.iWhip, top, end, 0.0009 * F.s, true); this.whip = true;
    }
  },

  // ---------------------------------------------------------------- a card facing the camera; a card lying on the water
  bill(x, y, z, sx, sy, kind, a, rot, c, k = 1) {
    if (a <= 0.004 || this.n >= this.NC) return;
    const n = this.n++, M = this.cM, m = n * 16, I = this.aInfo.array, C = this.aCol.array;
    M[m] = sx; M[m + 1] = 0; M[m + 2] = 0; M[m + 3] = 0; M[m + 4] = 0; M[m + 5] = sy; M[m + 6] = 0; M[m + 7] = 0; M[m + 8] = 0; M[m + 9] = 0; M[m + 10] = 1; M[m + 11] = 0; M[m + 12] = x; M[m + 13] = y; M[m + 14] = z; M[m + 15] = 1;
    I[n * 4] = kind; I[n * 4 + 1] = a; I[n * 4 + 2] = rot; I[n * 4 + 3] = 0;
    C[n * 3] = c.r * k; C[n * 3 + 1] = c.g * k; C[n * 3 + 2] = c.b * k;
  },
  // a touch at (x, y, z) in a boat: lit by the sun where the boat stands
  dab(B, x, y, z, sx, sy, c, a = 1, rot = 0, kind = 3, k = 1) {
    if (!B.on) return;
    const v = this.v.set(x, y, z).applyMatrix4(B.M), s = B.s;
    this.bill(v.x, v.y, v.z, sx * s, sy * s, kind, a, rot, c, k * B.lit);
  },
  // a limb: one long touch from a to b (in the boat), turned on the screen to lie along them
  limb(L, B, ax, ay, az, bx, by, bz, wid, c) {
    if (!B.on) return;
    const cam = L.k.G.camera, A = this.a.set(ax, ay, az).applyMatrix4(B.M), E = this.b.set(bx, by, bz).applyMatrix4(B.M), len = A.distanceTo(E);
    this.v.copy(A).add(E).multiplyScalar(0.5); const mx = this.v.x, my = this.v.y, mz = this.v.z;
    A.project(cam); E.project(cam);
    this.bill(mx, my, mz, len * 1.25, wid * B.s, 3, 1, Math.atan2(E.y - A.y, (E.x - A.x) * (cam.aspect || 1.6)), c, B.lit);
  },
  // on the water at (u, out), heading (du, dv), len long and wid wide; true if there is water there
  afloat(L, u, o, du, dv, len, wid, lift, a, c, k = 1) {
    if (a <= 0.004 || this.n >= this.NC) return false;
    const h = this.sea(u, o), E = this.S.E; if (E < 0.25) return false;
    const hu = (this.sea(u + 0.03, o) - h) / 0.03, ho = (this.sea(u, o + 0.03) - h) / 0.03;
    const l = Math.hypot(du, dv) || 1; du /= l; dv /= l;
    const X = this.fx, Y = this.fy, N = this.fn, T = this.T3, O = this.N3;
    N.set(-hu * T.x - ho * O.x, 1, -hu * T.z - ho * O.z).normalize();
    X.set(du * T.x + dv * O.x, hu * du + ho * dv, du * T.z + dv * O.z).normalize();
    Y.crossVectors(N, X);
    L.floor(u, o, this.fp); this.fp.y = L.y + h + lift;
    const n = this.n++, M = this.cM, m = n * 16, I = this.aInfo.array, C = this.aCol.array, P = this.fp;
    M[m] = X.x * len; M[m + 1] = X.y * len; M[m + 2] = X.z * len; M[m + 3] = 0; M[m + 4] = Y.x * wid; M[m + 5] = Y.y * wid; M[m + 6] = Y.z * wid; M[m + 7] = 0;
    M[m + 8] = N.x; M[m + 9] = N.y; M[m + 10] = N.z; M[m + 11] = 0; M[m + 12] = P.x; M[m + 13] = P.y; M[m + 14] = P.z; M[m + 15] = 1;
    I[n * 4] = 5; I[n * 4 + 1] = a * sm(E, 0.25, 0.7); I[n * 4 + 2] = 0; I[n * 4 + 3] = 0;
    C[n * 3] = c.r * k; C[n * 3 + 1] = c.g * k; C[n * 3 + 2] = c.b * k;
    return true;
  },
  // froth round a hull, lying on the water: n touches of the FM list from index i0
  froth(L, B, i0, n, rx, rz, a, t) {
    if (!B.on) return;
    for (let i = i0; i < i0 + n; i++) {
      const q = this.FM[i], an = q.a * (N_FOAM / n) + 0.2 * Math.sin(t * 0.6 + q.ph), cx = Math.cos(an) * rx * q.r * B.s, cz = Math.sin(an) * rz * q.r * B.s;
      const u = B.u + B.du * cx - B.dv * cz, o = B.o + B.dv * cx + B.du * cz, lit = this.sunAt(u, o);
      this.kc.copy(this.cFrothS).lerp(this.cFroth, lit);
      this.afloat(L, u, o, -Math.sin(an) * B.du - Math.cos(an) * B.dv, -Math.sin(an) * B.dv + Math.cos(an) * B.du, q.s * (0.6 + 0.4 * B.s), q.s * 0.42 * (0.6 + 0.4 * B.s), 0.004, a * (0.4 + 0.25 * Math.sin(t * 1.1 + q.ph)), this.kc);
    }
  },
  // drops thrown up from (x, y, z) since `age` seconds ago
  splash(x, y, z, age, n, sp, a) {
    if (age < 0 || age > 0.7) return;
    for (let i = 0; i < n; i++) {
      const q = this.SQ[i % N_SPLASH], r = 0.02 + (0.14 + 0.16 * q.b) * sp * age, yy = y + (0.42 + 0.3 * q.c) * sp * age - 1.7 * age * age, T = this.T3, O = this.N3, cu = Math.cos(q.a) * r, co = Math.sin(q.a) * r;
      this.bill(x + T.x * cu + O.x * co, yy, z + T.z * cu + O.z * co, 0.011 + 0.009 * q.c, 0.011 + 0.009 * q.c, 2, a * (1 - age / 0.7), 0, this.cDrop);
    }
  },

  // ---------------------------------------------------------------- every frame
  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return';
    if (!showing && !back) return;
    const R = back ? L.ret : 0, t = showing ? L.t : this.bT + R * L.retDur, S = this.S, F = this.F, H = this.H, Tn = this.Tn;
    const calm = L.calm; if (calm !== this.calm) { this.calm = calm; this.band = this.bands[calm ? 1 : 0]; this.band.from(t); }
    const cam = L.k.G.camera, v = this.v, rc = L.cy - L.y;
    if (showing && !this.told && !L.quiet && t > 1.9) { this.told = true; L.k.say('The buyers row out and call a price across the water.', 4); }

    // ---- the sea
    S.t = calm ? t * 0.7 : t;
    S.grow = back ? this.g0 * (1 - 0.94 * ease.inOut(ramp(R, 0.22, 1))) : 1.06 * spread(ramp(t, 0.1, 2.0));
    S.amp = sm(t, 0.2, 1.8) * (calm ? 0.7 : 1);
    S.bore = back ? 0 : 0.04 * sm(t, 0.1, 0.45) * (1 - sm(t, 1.3, 2.0));
    // ---- the light: the storm's, until the two voices meet; then the sun opens from the left over the boats
    const d = this.dealAt(t), first = t < LOOP.t, q = first ? 0 : (t - LOOP.t) % LOOP.P;
    const open = first ? sm(d, -0.05, calm ? 2.3 : 1.25) : 1;
    const sun = this.sun;
    sun.u = lerp(-1.3, -0.3, open) + 0.05 * Math.sin(t * 0.21); sun.o = lerp(1.4, 0.88, open); sun.r = lerp(0.3, 1.3, open);
    // (a cloud crosses before each later basket, and the light comes back with it)
    sun.k = open * (first ? 1 : 1 - 0.42 * sm(q, 0, 0.9) * (1 - sm(q, LOOP.deal - 0.3, LOOP.deal + 0.9))) * (back ? 1 - sm(R, 0, 0.5) : 1);
    const su = this.su; su.uT.value = S.t; su.uGrow.value = S.grow; su.uAmp.value = S.amp; su.uBore.value = S.bore; su.uSun.value.set(sun.u, sun.o, sun.r, sun.k); su.uGlint.value = calm ? 0 : 1;
    this.water.visible = S.grow > 0.01;

    // ---- the fishing boat: sailing out of the distance; hove-to, her sail shivering; then, on the deal, it fills
    const lie = back ? 0 : sm(t, 1.75, 2.4), fill = back ? 1 : first ? ease.outBack(ramp(d, D_FILL, D_FILL + 0.6)) : 1;
    if (back) this.homeAt(R, this.F0, F_HOME, 0.45, F); else this.fisherAt(t, F);
    const sail = back ? sm(R, 0, 0.25) : 1 - lie;                                // (1: sailing, the sheet eased)
    const belly = lerp(lerp(0.3, 0.86 + 0.07 * Math.sin(t * 0.9), fill), 1, sail);
    const shake = (1 - sail) * lerp(0.75 + 0.25 * Math.sin(t * 1.7), 0.05, clamp01(fill)) * (calm ? 0.45 : 1);
    const swing = lerp(lerp(0.1 + 0.035 * Math.sin(t * 2.1) * (calm ? 0.3 : 1), 0.3, clamp01(fill)), 0.42, sail);
    const heel = lerp(lerp(0.03, 0.085, clamp01(fill)), 0.16, sail);
    this.ride(L, F, 0.12, 0.07, heel); F.lit = lerp(0.62, 1.12, this.sunAt(F.u, F.o));
    const ru = this.ru; ru.uT.value = t; ru.uBelly.value = 0.046 * belly * F.s; ru.uShake.value = 0.015 * shake * F.s; ru.uRate.value = calm ? 5.5 : 13; ru.uFlag.value = (calm ? 0.004 : 0.007) * F.s;
    this.part(this.iFisher, F);
    this.part(this.iMain, F, 0.04, 0, 0, -swing, 0, 0, lerp(lerp(0.9, 1.03, fill), 1.02, sail));      // (her clew swings to leeward: towards us)
    this.part(this.iFore, F, 0, 0, 0, 0);
    // the flag at her masthead: it streams with the wind, whichever way she lies
    this.rig.show(this.iFlag, F.on);
    if (F.on) {
      const X = this.x3, Y = this.y3, Z = this.z3, T = this.T3, O = this.N3, fl = 0.1 * Math.sin(t * (calm ? 0.9 : 2.3));
      v.set(0.031, 0.56, 0).applyMatrix4(F.M);
      X.set((WIND[0] - fl * WIND[1]) * T.x + (WIND[1] + fl * WIND[0]) * O.x, -0.12, (WIND[0] - fl * WIND[1]) * T.z + (WIND[1] + fl * WIND[0]) * O.z).normalize();
      Z.crossVectors(X, this.UP).normalize(); Y.crossVectors(Z, X);
      this.m4.makeBasis(X, Y, Z).scale(this.p3.set(F.s, F.s, F.s)).setPosition(v); this.rig.mat(this.iFlag, this.m4);
    }
    // her stays: masthead to the bow, and a shroud each side
    {
      const top = this.a.set(0.046, 0.42, 0).applyMatrix4(F.M), r = 0.0008 * F.s;
      this.line(this.iStay[0], top, this.b.set(0.215, 0.116, 0).applyMatrix4(F.M), r, F.on);
      this.line(this.iStay[1], top, this.b.set(0.0, this.fTop(0.5) - 0.004, -0.101).applyMatrix4(F.M), r, F.on);
      this.line(this.iStay[2], top, this.b.set(0.0, this.fTop(0.5) - 0.004, 0.101).applyMatrix4(F.M), r, F.on);
    }

    // ---- the boat she tows: where her stern was a moment ago, swinging on its line
    {
      const Fd = this.Fd; if (back) this.homeAt(Math.max(0, R - 0.1), this.F0, F_HOME, 0.45, Fd); else this.fisherAt(Math.max(0, t - 0.4), Fd);
      const sw = 0.3 * Math.sin(t * 0.5 + 0.6) * (back ? 0 : lie), c = Math.cos(sw), s = Math.sin(sw), bu = Fd.du * c - Fd.dv * s, bv = Fd.du * s + Fd.dv * c, gap = 0.4 * F.s;
      Tn.u = Fd.u - bu * gap; Tn.o = Fd.o - bv * gap; Tn.s = F.s * (back ? 1 : sm(t, 0.55, 0.9));
      // (she lies to her line: her bow towards the big boat's stern)
      const su0 = F.u - F.du * 0.21 * F.s, so0 = F.o - F.dv * 0.21 * F.s, lu = su0 - Tn.u, lo = so0 - Tn.o, ll = Math.hypot(lu, lo) || 1;
      Tn.du = lu / ll; Tn.dv = lo / ll;
      this.ride(L, Tn, 0.05, 0.03, 0); Tn.lit = lerp(0.62, 1.12, this.sunAt(Tn.u, Tn.o)); Tn.on = Tn.on && F.on;
      this.part(this.iTender, Tn);
      const A = this.rope[0].set(-0.215, 0.094, 0).applyMatrix4(F.M), B = this.rope[3].set(0.086, 0.034, 0).applyMatrix4(Tn.M), on = F.on && Tn.on && Tn.s > 0.3;
      for (let j = 1; j < 3; j++) { const s2 = j / 3; this.rope[j].lerpVectors(A, B, s2); this.rope[j].y -= 0.035 * F.s * Math.sin(Math.PI * s2) * (0.6 + 0.4 * Math.sin(t * 0.9)); }
      for (let j = 0; j < 3; j++) this.line(this.iRope[j], this.rope[j], this.rope[j + 1], 0.0012 * F.s, on);
    }

    // ---- the hucksters: rowing out of the dark, a stroke nearer with every call, alongside on the deal
    const row = this.row || (this.row = {});
    if (back) { this.homeAt(R, this.H0, H_HOME, 0.25, H); row.reach = 0; row.pull = -1; row.fin = 0; for (const k of R_STROKES) this.oarAt(R * L.retDur - k, 0.3, row); }
    else this.huckAt(t, H);
    // (a basket aboard: she sits lower, and dips as it lands)
    const dipNow = first ? d - D_LAND : q - LOOP.deal - D_LAND;
    const dip = (first && d < D_LAND ? 0 : -0.004) - (dipNow > 0 && dipNow < 1.6 ? 0.012 * Math.exp(-dipNow * 3) * Math.cos(dipNow * 9) * (calm ? 0.5 : 1) : 0);
    this.ride(L, H, 0.09, 0.03, 0, dip); H.lit = lerp(0.66, 1.12, this.sunAt(H.u, H.o));
    this.part(this.iHuck, H);
    // the oars: forward and down for the catch, through the water, out and back to rest across the boat
    const pulling = row.pull >= 0, sweep = pulling ? lerp(0.55, -0.5, ease.smooth(row.pull)) : 0.55 * row.reach - 0.5 * row.fin, down = pulling ? 0.05 + 0.3 * Math.sin(Math.PI * clamp01(row.pull * 1.1)) : -0.12 - 0.1 * Math.max(row.reach, row.fin);
    for (let i = 0; i < 4; i++) { const side = i < 2 ? 1 : -1, x = i % 2 ? 0.02 : 0.07; this.part(this.iOar[i], H, x, 0.036, side * 0.039, side > 0 ? sweep : Math.PI - sweep, down, 0); }

    // ---- the buoy: leaning from the sea that runs past it, nodding
    {
      const B = this.B || (this.B = { u: BUOY[0], o: BUOY[1], du: 1, dv: 0, s: 1, M: new THREE.Matrix4() });
      B.s = 0.86 * (back ? 1 - sm(R, 0.3, 0.6) : ease.outBack(ramp(t, 1.15, 1.75)));
      this.ride(L, B, 0.05, 0.05, 0.2 + 0.1 * Math.sin(t * 0.9 + 1) * (calm ? 0.4 : 1), 0.012);
      this.part(this.iBuoy, B); B.lit = lerp(0.62, 1.1, this.sunAt(B.u, B.o));
    }

    // ---- the baskets: hoisted, swung across, set down in the rowing boat (the later ones on the first)
    this.pb.set(-0.02, 0.014, 0).applyMatrix4(H.M);
    this.swung = false; this.whip = false;
    // (their clocks stop when the look ends: what is aboard goes home with the boat)
    const tb = back ? this.bT : t, qb = tb < LOOP.t ? -9 : (tb - LOOP.t) % LOOP.P - LOOP.deal;
    this.basket(this.iBasket[0], tb - T_DEAL, 0, 1, back);
    this.basket(this.iBasket[1], qb, 0.032, 1 - sm(qb, LOOP.P - LOOP.deal - 0.7, LOOP.P - LOOP.deal - 0.2), back);
    if (!this.whip) this.rig.show(this.iWhip, false);
    this.rig.mesh.visible = F.on || H.on || (this.B && this.B.on);

    // ---- his touches, far to near
    this.n = 0;
    const out = back ? 1 - sm(R, 0.3, 0.95) : 1;
    // the haze at the foot of the wall; in it the second boat and the steamer, her smoke going down the wind; and the
    // gold streak along the horizon on the right, which the sun brightens
    for (let i = 0; i < N_HAZE; i++) {
      const f = this.HZ[i], u = ((f.u + f.v * t + 1.6) % 3.2 + 3.2) % 3.2 - 1.6;
      if (i === 6) {
        const a = sm(t, 1.2, 3.0) * (back ? 1 - sm(R, 0, 0.5) : 1), us = 0.28 - 0.05 * Math.sin(t * 0.07), hs = this.sea(us, 0.04);
        L.at(us, hs + 0.1 - rc, 0.04, v); this.bill(v.x, v.y, v.z, 0.2, 0.2, 1, 0.75 * a * this.S.E, 0.05 * Math.sin(t * 0.8), this.cFar, lerp(0.8, 1.05, sun.k));
        const ut = 0.64 - 0.07 * Math.sin(t * 0.05 + 0.4), ht = this.sea(ut, 0.03);
        L.at(ut, ht + 0.08 - rc, 0.03, v); this.bill(v.x, v.y, v.z, 0.19, 0.19, 4, 0.95 * a * this.S.E, 0.03 * Math.sin(t * 0.7 + 1), this.cSteam);
        for (let j = 0; j < N_SMOKE; j++) { const p = this.SMK[j], age = (t * 0.16 + p.a) % 1; L.at(ut + 0.004 + 0.34 * age, ht + 0.165 + 0.05 * age + 0.012 * Math.sin(t * 0.7 + p.ph) - rc, 0.028, v); this.bill(v.x, v.y, v.z, 0.06 + 0.15 * age, 0.04 + 0.05 * age, 0, 0.62 * a * Math.sin(Math.PI * Math.min(1, age * 1.25 + 0.06)) * this.S.E, 0, this.cSmoke); }
      }
      const a = f.al * sm(t * 1.9 - Math.abs(u) * 0.9, 0.1, 1.4) * (1 - sm(Math.abs(u), 1.0, 1.6)) * out;
      L.at(u, f.h + 0.012 * Math.sin(0.5 * t + f.ph) - rc, f.o, v);
      this.bill(v.x, v.y, v.z, f.w, f.w * f.sy, 0, a, 0, f.c);
    }
    { const a = sm(t, 1.0, 2.6) * out; this.kc.copy(this.cGoldLo).lerp(this.cGoldHi, sun.k); L.at(0.98, 0.075 - rc, 0.02, v); this.bill(v.x, v.y, v.z, 0.95, 0.035, 0, a * lerp(0.5, 0.95, sun.k), 0, this.kc); L.at(1.12, 0.078 - rc, 0.021, v); this.bill(v.x, v.y, v.z, 0.5, 0.02, 0, a * 0.9 * sun.k, 0, this.cGoldHi); }
    // the thick paint in the sun: dots of cream lying on the lit water
    for (let i = 0; i < N_SPARK; i++) {
      const s = this.SK[i], u = s.u + 0.05 * Math.sin(t * 0.3 + s.ph), o = s.o + 0.04 * Math.cos(t * 0.27 + s.ph), lit = this.sunAt(u, o); if (lit < 0.3) continue;
      const tw = calm ? 0.8 : 0.62 + 0.38 * Math.sin(t * s.w * 1.9 + s.ph);
      this.afloat(L, u, o, Math.cos(s.r), Math.sin(s.r), s.s, s.s * 0.5, 0.005, sm(lit, 0.3, 0.8) * tw * 0.95 * out, this.cFroth, 1.08);
    }
    // froth round the hulls, and the buoy
    this.froth(L, Tn, 0, 3, 0.1, 0.05, 0.8 * out, t);
    this.froth(L, F, 3, 6, 0.26, 0.125, out, t);
    this.froth(L, H, 9, 3, 0.17, 0.06, 0.85 * out, t);
    if (this.B.on) this.froth(L, this.B, 12, 2, 0.06, 0.06, 0.8 * out, t);
    // the towed boat's green and white
    this.dab(Tn, 0.02, 0.026, 0.004, 0.03, 0.02, this.cGreen, 1); this.dab(Tn, -0.02, 0.026, -0.004, 0.028, 0.018, this.cWhite, 1); this.dab(Tn, -0.05, 0.026, 0.006, 0.022, 0.016, this.cGreen, 1);
    // the fishing boat's people, a crowd of touches over her rail, and her baskets; one of them answers, a hand up
    if (F.on) {
      const deck = this.fTop(0.5) - 0.014, aS = back ? 0 : this.armAt(t, 1);
      // (the dark of the boat's inside behind them, so they stand as a crowd and not a row)
      this.dab(F, 0.0, deck + 0.022, 0.0, 0.34, 0.06, this.cHat, 0.9, 0, 3, 1.5);
      for (let i = 0; i < CREW.length; i++) {
        const [x, z, ci, sz, hh] = CREW[i], w = this.CW[i], sw = 0.006 * Math.sin(t * w.w * (calm ? 0.5 : 1) + w.ph), lean = -0.012 * aS * (z < 0 ? 1 : 0.4), k = z > 0 ? 0.78 : 1;
        this.dab(F, x + sw, deck + 0.03 * hh, z + lean, 0.046 * sz, 0.074 * sz * hh, this.cShirt[ci], 1, 0.3 * Math.sin(w.ph * 3), 3, k);
        this.dab(F, x + sw * 1.6, deck + 0.072 * hh, z + lean, 0.024, 0.024, i % 3 === 1 ? this.cHat : this.cFace, 1, 0, 3, k);
      }
      this.dab(F, 0.068, this.fTop(0.5) + 0.012, -0.088, 0.05, 0.04, this.cWicker, 1); this.dab(F, -0.035, this.fTop(0.5) + 0.012, -0.094, 0.05, 0.04, this.cWicker, 1);
      const [ax, az] = ANSWER;
      this.dab(F, ax, deck + 0.036, az, 0.046, 0.082, this.cShirt[0], 1);
      this.dab(F, ax, deck + 0.084, az, 0.025, 0.026, this.cFace, 1);
      this.limb(L, F, ax - 0.004, deck + 0.062, az - 0.004, ax - 0.016 - 0.018 * aS, deck + lerp(0.02, 0.135, aS), az - 0.014 - 0.018 * aS, 0.017, this.cShirt[0]);
    }
    // the hucksters: two at the oars, bending to them; one in the bow, one aft; and the man standing, his arm up to call
    if (H.on) {
      const lean = row.pull >= 0 ? lerp(0.016, -0.014, ease.smooth(row.pull)) : 0.016 * row.reach - 0.014 * row.fin, aB = back ? 0 : this.armAt(t, 0);
      for (let i = 0; i < ROWERS.length; i++) { const [x, ci] = ROWERS[i], l = i < 2 ? lean : 0; this.dab(H, x + l, 0.05, 0, 0.042, 0.056, this.cHuck[ci], 1); this.dab(H, x + l * 1.5, 0.083, 0, 0.022, 0.022, this.cFace, 1); this.dab(H, x + l * 1.5, 0.094, 0, 0.026, 0.012, this.cHat, 1); }
      this.dab(H, STAND, 0.075, 0, 0.034, 0.094, this.cHuck[0], 1);
      this.dab(H, STAND, 0.128, 0, 0.022, 0.023, this.cFace, 1); this.dab(H, STAND, 0.14, 0, 0.028, 0.012, this.cHat, 1);
      this.limb(L, H, STAND + 0.004, 0.108, 0.002, STAND + 0.024 + 0.022 * aB, lerp(0.06, 0.172, aB), 0.004 + 0.014 * aB, 0.016, this.cHuck[0]);
    }
    // silver on the basket in the air, catching the light; and the coins going back, one at a time
    if (showing) {
      const dd = first ? d : q - LOOP.deal;
      if (this.swung) this.bill(this.bx, this.by + 0.037 * H.s, this.bz, 0.026, 0.014, 6, (0.5 + 0.5 * sun.k) * (calm ? 0.8 : 0.7 + 0.3 * Math.sin(t * 9)), 0, this.cSilver, 1.15);
      if (F.on && H.on) for (let i = 0; i < 3; i++) {
        const e = (dd - D_COIN[i]) / COIN_FLY; if (e <= 0 || e >= 1) continue;
        this.a.set(STAND + 0.046, 0.172, 0.018).applyMatrix4(H.M); this.b.set(ANSWER[0] - 0.02, this.fTop(0.5) + 0.09, ANSWER[1] - 0.02).applyMatrix4(F.M);
        v.lerpVectors(this.a, this.b, e); v.y += 0.13 * Math.sin(Math.PI * e);
        { const g = 0.022 + 0.012 * Math.sin(Math.PI * e); this.bill(v.x, v.y, v.z, g, g, 6, 1, 0, this.cCoin, calm ? 1.2 : 1.1 + 0.3 * Math.sin(e * 19)); }
      }
      // drops where the basket comes down, and off the oars at each catch
      const la = dd - D_LAND; if (H.on && !calm) { v.set(-0.02, 0.01, 0).applyMatrix4(H.M); this.splash(v.x, v.y, v.z, la, 6, 0.8, 0.85); }
      if (H.on && row.pull >= 0 && row.pull < 0.5 && !calm) for (let side = -1; side <= 1; side += 2) { v.set(0.07, 0, side * 0.125).applyMatrix4(H.M); this.splash(v.x, L.y + H.h + 0.004, v.z, row.pull * 0.3, 3, 0.5 * H.s, 0.7); }
    }
    // spray off the fishing boat's bow as she puts it into a sea
    if (F.on && !calm) {
      const bu = F.u + F.du * 0.22 * F.s, bo = F.o + F.dv * 0.22 * F.s, P = TAU / W1.w, hb = this.sea(bu, bo);
      for (let i = 0; i < N_SPRAY; i++) {
        const p = this.SP[i], f1 = (bu * W1.d[0] + bo * W1.d[1]) * W1.k - t * W1.w, age = (((-f1 + 1.2) / TAU % 1) + 1) % 1 * P - p.a * 0.25; if (age < 0 || age > 0.75) continue;
        const r = 0.02 + (0.1 + 0.16 * p.b) * age, an = Math.atan2(F.dv, F.du) + (p.c - 0.5) * 2.2, y = hb + (0.3 + 0.3 * p.d) * age - 1.5 * age * age;
        L.floor(bu + Math.cos(an) * r * F.s, bo + Math.sin(an) * r * F.s, v);
        this.bill(v.x, L.y + y, v.z, (0.012 + 0.012 * p.c) * F.s, (0.012 + 0.012 * p.c) * F.s, 2, 0.8 * (1 - age / 0.75) * out * S.amp, 0, this.cDrop, lerp(0.75, 1, sun.k));
      }
    }
    this.cards.count = this.n; this.cards.visible = this.n > 0;
    this.cards.instanceMatrix.needsUpdate = true; this.aInfo.needsUpdate = true; this.aCol.needsUpdate = true;

    // ---- sound: the water itself, and the voices, oars and coins on the show's clock
    if (showing) this.band.play(t);
    const near = L.quiet ? 0 : Math.max(0, 1 - Math.hypot(cam.position.x - L.cx, cam.position.z - L.cz) / 11), lv = (calm ? 0.6 : 1) * near * out, tau = calm ? 0.6 : 0.3;
    const wash = 0.5 + 0.5 * Math.sin(0.6 * W1.k - S.t * W1.w);
    this.surf.set(lv * S.grow * (0.009 + 0.007 * wash), tau); this.hiss.set(lv * S.grow * (0.0018 + 0.0022 * wash), tau);
    L.voice().place(L.cx + L.nx, L.cz + L.nz);
  },
});
