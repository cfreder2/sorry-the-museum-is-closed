// Sir Thomas Lawrence, Isabella Wolff (1803–15), Gallery 220. The word: satin.
//
// She sits by a table in a white satin gown, her head on her hand, looking down into a great book of prints propped
// on a red velvet cushion. A patterned shawl is thrown over the table's corner and another lies along her arm; there
// is red velvet behind her, and a lamp burning high in the corner of the room. The museum's note says three things.
// She was one of Lawrence's closest friends, and the picture was twelve years in the painting. The print she is
// contemplating is the Delphic Sibyl of Michelangelo's Sistine ceiling, and her own pose "cleverly echoes another
// Sibyl from that same work". And Lawrence "was famed for his ability to evoke the surface effects and textures of
// clothing; that talent is on full display in Wolff's shimmering satin gown". Half the canvas is that gown. So the
// word is the stuff it is made of, and the show is what satin does: it tells every movement of the person in it, a
// beat late, in light. That needs the person, and it needs her to move. The other pictures of readers in this
// building keep the reader in the frame and bring out the paper (Manet's journal, Degas's newspaper), or are about a
// reader who looks up (Corot's); here no leaf turns and her eyes never leave the print. She is a grown woman,
// clothed, in a portrait she sat for, so she comes out, toy-sized, and the show is her gown.
//
// Look at it and her table comes out from the foot of the wall on the left, with the cushion, the open book and the
// shawl on it (the cushion gives when the table stops), and her low red chair beside it. Then she comes in on the right,
// out of the corner of the room, and walks away from you on a shallow slant to her chair, her head already bowed: you
// see the back of the gown, the nape, the gold silk and a shoulder. At each step a knee fills the skirt, the long
// folds swing over, light slides down their tops and breaks, with dark hollows between, and the train is laid out
// over the boards behind her, its sheen turning as she turns. (In this room her own wall is too near the chair for a
// walk away from you to start there; hung with no wall close on her right, she comes out from under her picture and
// round by the front instead.) Only at the chair does she turn
// about, and sits:She turns
// about, and sits: the skirt fills, spreads over her knees and pools round her feet, and as it settles the long
// light comes, down the whole length of the gown from her shoulder to the hem, the room dipping a little round her
// while it runs, to one soft chord. She has bent to the print by then; an elbow goes to the cushion, a hand to her
// brow, her head into the hand, the other arm falls: his picture, held, as she holds it up there. Her eyes go slowly
// over the page, she breathes, and now and then a smaller shimmer goes down the satin. The eye goes from the gown
// to the page she is looking at, and up to the same woman in the same gown above. When you stop looking she lets the
// pose go, gets up, turns, and walks back in under the picture, the hem last; the chair and the table go home.
//
// No tune: a sitting is quiet. The sounds are silk (a whisper to each step, a longer one as the gown comes round and
// as she sits), the table and the seat, and that one chord (D, the A over it and a faint F sharp, on a sine).
//
// How it is made: three draw calls. Everything solid is one mesh. Its forms are smooth sheets, each laid by a rule;
// hers are laid again every frame from her bones (the gown is one skin over five rings, from under the bust to the
// hem, with her knees, the stepping knee and the folds worked in; the lower rings are where she was a beat ago and
// face the way she faced then, which is the swing). Nothing takes the room's light: his light, from the upper left,
// is in the paint, which is worked out in one shader. Of her, the forms are only the cloth's own middle tone underneath (their
// edge broken); what you see is his strokes on them, about a hundred and seventy broad ribbons of paint that stand
// a little proud of the form and turn their faces to you, so that her outline is theirs, lost and found: long loaded
// overlapping sweeps down the gown, curved ones round the sleeves and shoulders, gold ones for the silk round her head, a few
// dark ones for her hair where it comes over the edge of her face. Each takes the tone of the form where it lies
// (pearl, a cool and a warm half tone, umber in the hollows, a pearly light given back into the shadows) and a
// little of the luck of the brush, and the lights turn white where a fold turns to the light: they slide and break
// as she moves, or as you do. She is seven and a half heads tall. The velvet is dark, lightest where it turns away;
// her chair is a seat and an arched back in it, on dark legs, with a lit edge. The shawls are a ground crowded with
// small dabs. Her face is planes, not features (the shade under her brow where her eyes are lowered, the forehead
// and the cheek in the light with the bloom he gave it, a soft shade under the nose and the lower lip, a mouth barely
// there); nothing in it is drawn. The other two calls are the lamp's warm light on the boards (it is in the room,
// not on any picture) and the soft shadows, one of which is the room's light dipping round her. She stands 0.73 m
// and sits under 0.6 m, all of it below the rail of the frame and well clear of the Constable round the corner: from
// the look camera the guard has nothing to cut. Constable's lane and Turner's sea (src/life/4758-stoke-by-nayland.js,
// src/life/4796-fishing-boats-hucksters.js) come out on the next wall; this one keeps within 0.6 m of the middle of
// its own picture and one metre of its own wall, has no water, no weather and no sun, and none of the three stays out
// after its look. She, her table and her chair are soft to the toy: it is eased aside, gently, and never held; nothing
// is pushed, collected or scored.
// With "Reduce motion and flashing" on: no glint runs down the gown at each step (that would be a flicker), the cushion
// does not bounce, the skirt settles without its wobble, she comes into the pose more slowly, the long light takes
// twice as long, is fainter, and the room dips less, the later shimmers are rarer, the lamp's light is steady, and
// everything is quieter.
//
// What it does not do: the Sibyl is not drawn, built or moved (the open page carries only the few pale touches of
// rose, lilac and blue-grey he gave it), because she is a prophetess from a chapel ceiling; nothing is made of the
// gold silk wound round Isabella Wolff's head, which the museum's note ties to Western fantasies of the Near East (it
// is there, small and plain, because it is hers, and no sound or gesture plays on it); the statue, the lamp and the
// gilt ball stay in the picture; she does not look up or out at you; and she is given no story beyond the sitting
// (nothing of who she was to the painter or what she thinks of the print), because she was a real woman and the
// museum says no more than that she was his friend.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp } from '../paintlife.js';
import { score, turnTo } from './stagecraft.js';

const PI = Math.PI, TAU = PI * 2;
const sstep = (a, b, x) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };
const hump = (x, a, b) => (x <= a || x >= b ? 0 : Math.sin(PI * (x - a) / (b - a)));
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const gss = (x, w) => Math.exp(-(x / w) * (x / w));
const inRoom = z => sstep(-0.02, 0.12, z);      // (out of the wall)

// Everything is set down in the scene's own metres: x along the wall (to the viewer's right) from the middle of the
// picture, y up from the boards, z out from the picture's plane into the room.
const LIFT = 0.004, SC = 1.2;                    // (the whole scene, a fifth larger than these measures)
const SUN = [-0.42, 0.72, 0.56];                  // the way to his light: upper left, in front
const KEY = 0.56;                                // (the game's film curve lifts what the room does not light: the paint is laid that much lower)

// ---- the desk: a small table, the red cushion on it, the book of prints on the cushion, the shawl over its corner
const TBL = { x: -0.25, z: 0.42, hw: 0.15, hd: 0.11, top: 0.262 };
const CUSH = { hw: 0.135, hd: 0.1, th: 0.058 };
const BOOK = { w: 0.105, hz: 0.078 };
// ---- her road out of the wall, and her chair
const SEAT = [0.077, 0.359], YSEAT = -0.55, PST = [SEAT[0] + Math.sin(YSEAT) * 0.08, SEAT[1] + Math.cos(YSEAT) * 0.08];      // her chair; the way she sits in it; where she stands to sit
const ROAD = [[0.47, -0.26], [0.47, 0.24], [0.38, 0.6], [0.14, 0.8], [-0.09, 0.75], [-0.04, 0.58], PST];      // out on the right, across the front, and in to her chair
const HOME = [0.4, -0.27], ROUND = [0.34, 0.44];      // going home: to here, by way of here (clear of the chair)
const STEP = 0.19, LAG = 0.28;                        // a step; and how long the hem is behind her (seconds)
// ---- her measures (she stands about 0.6 m)
const PEL_STAND = 0.325, PEL_SIT = 0.188, BUST = 0.105, TORSO = 0.165, SH_W = 0.047, NECK = 0.026, UPPER = 0.098, FORE = 0.09;
const HEAD = { s: 0.0275, y: 0.039, f: 0.0335 };      // (she is seven and a half of these tall)
// ---- her gown, ring by ring below the bust. Standing: height, front, back, side, and how far it trails behind her.
// Sitting: height, front, back, side, how far forward its middle lies, and how far its front and its back are lifted.
const ST = [[0, 0.044, 0.05, 0.06, 0], [0.19, 0.054, 0.064, 0.072, 0.12], [0.09, 0.068, 0.094, 0.092, 0.5], [0.004, 0.088, 0.145, 0.118, 1]];
const SI = [[0, 0.066, 0.05, 0.067, 0.012, 0, 0], [0.208, 0.122, 0.124, 0.088, 0.076, 0.01, 0.04], [0.105, 0.128, 0.126, 0.1, 0.082, 0, 0], [0.004, 0.16, 0.13, 0.13, 0.09, 0, 0]];
// her bodice (how far up her back, front, back, side) and her neck (how far along it, front and back, side)
const BO = [[BUST, 0.034, 0.032, 0.044], [0.126, 0.041, 0.033, 0.047], [0.146, 0.034, 0.032, 0.051], [0.159, 0.027, 0.026, 0.045]];
const NK = [[0, 0.024, 0.042], [0.28, 0.019, 0.027], [0.6, 0.0142, 0.0152], [1, 0.0145, 0.0155]];      // (the slope of her shoulders, then the column of her neck)
// ---- where her hand and her elbow come to rest (the scene's metres)
const ELBOW = [-0.115, 0.3, 0.405];
// ---- the show, in seconds
const T_DESK = [0.15, 1.25], T_WALK = [0.8, 4.2], T_TURN = [3.75, 4.75], T_SIT = [4.65, 5.65], T_WAVE = [5.4, 6.9], T_STUDY = [5.5, 6.4], T_POSE = [6.4, 7.6];
const walkE = q => { const a = 0.14; q = clamp01(q); return q < a ? q * q / (2 * a * (1 - a)) : q > 1 - a ? 1 - (1 - q) * (1 - q) / (2 * a * (1 - a)) : (q - a / 2) / (1 - a); };
const goingOf = q => (q <= 0 || q >= 1 ? 0 : clamp01(Math.min(q, 1 - q) / 0.1));

// ---------------------------------------------------------------- sheets: smooth surfaces from rules, in one mesh
const K = { SATIN: 0, FLESH: 1, HEAD: 2, CAP: 3, ROLL: 4, HAIR: 5, VELVET: 6, SHAWL: 7, WOOD: 8, PAGE: 9, EDGE: 10, ROSE: 11, BOARD: 12, STROKE: 13 };
const M_HER = 0, M_DESK = 1, M_STOOL = 2;
class Sheets {
  constructor() { this.list = []; this.nv = 0; this.ni = 0; this._p = V3(); }
  // nu by nv squares; f(u, v, out) is its rule (kept if it is set down once); wrap: it closes on itself round u
  add(nu, nv, kind, move, { wrap = false, f = null, part = 0 } = {}) {
    const s = { nu, nv, kind, move, wrap, f, part, off: this.nv };
    this.nv += (nu + 1) * (nv + 1); this.ni += nu * nv * 6; this.list.push(s); return s;
  }
  // n strokes: each a strip of two squares, laid again every frame on whatever it lies on
  marks(n, kind, move) { const s = { marks: n, kind, move, off: this.nv }; this.nv += n * 6; this.ni += n * 12; this.list.push(s); return s; }
  build() {
    const n = this.nv; this.pos = new Float32Array(n * 3); this.nor = new Float32Array(n * 3); this.tan = new Float32Array(n * 3);
    const uv = new Float32Array(n * 2), ak = new Float32Array(n * 3), idx = new Uint16Array(this.ni); let w = 0;
    for (const s of this.list) {
      if (s.marks) {      // (each knows which paint it is, and its own luck: the whole and the fraction of one number)
        for (let m = 0; m < s.marks; m++) for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) { const k = s.off + m * 6 + r * 2 + c; uv[k * 2] = c; uv[k * 2 + 1] = r / 2; ak[k * 3] = s.kind; ak[k * 3 + 1] = s.move; ak[k * 3 + 2] = s.pal[m] + 0.999 * ((m * 0.6180339 + 0.137) % 1); }
        for (let m = 0; m < s.marks; m++) for (let r = 0; r < 2; r++) { const a = s.off + m * 6 + r * 2, b = a + 1, c = a + 3, d = a + 2; idx[w++] = a; idx[w++] = b; idx[w++] = d; idx[w++] = b; idx[w++] = c; idx[w++] = d; }
        continue;
      }
      const W = s.nu + 1;
      for (let j = 0; j <= s.nv; j++) for (let i = 0; i <= s.nu; i++) { const k = s.off + j * W + i; uv[k * 2] = i / s.nu; uv[k * 2 + 1] = j / s.nv; ak[k * 3] = s.kind; ak[k * 3 + 1] = s.move; ak[k * 3 + 2] = s.part; }
      for (let j = 0; j < s.nv; j++) for (let i = 0; i < s.nu; i++) { const a = s.off + j * W + i, b = a + 1, c = a + W + 1, d = a + W; idx[w++] = a; idx[w++] = b; idx[w++] = d; idx[w++] = b; idx[w++] = c; idx[w++] = d; }
      if (s.f) this.fill(s, s.f);
    }
    const g = this.geo = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('normal', new THREE.BufferAttribute(this.nor, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aT', new THREE.BufferAttribute(this.tan, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aK', new THREE.BufferAttribute(ak, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    return g;
  }
  // Lay a sheet by its rule; its normals, and the way it runs (along v), are taken from its own neighbours.
  fill(s, f) {
    const { nu, nv, off } = s, W = nu + 1, pos = this.pos, nor = this.nor, tan = this.tan, p = this._p;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { f(i / nu, j / nv, p); const k = (off + j * W + i) * 3; pos[k] = p.x; pos[k + 1] = p.y; pos[k + 2] = p.z; }
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      let i0 = i - 1, i1 = i + 1; if (s.wrap) { if (i0 < 0) i0 = nu - 1; if (i1 > nu) i1 = 1; } else { if (i0 < 0) i0 = 0; if (i1 > nu) i1 = nu; }
      const j0 = j > 0 ? j - 1 : 0, j1 = j < nv ? j + 1 : nv, k = (off + j * W + i) * 3;
      const c = (off + j0 * W + i) * 3, d = (off + j1 * W + i) * 3, vx = pos[d] - pos[c], vy = pos[d + 1] - pos[c + 1], vz = pos[d + 2] - pos[c + 2];
      let nx = 0, ny = 0, nz = 0, l = 0;
      for (let pass = 0, jj = j; pass < 2; pass++, jj = j === 0 ? 1 : j === nv ? nv - 1 : j) {      // (at a pole, where a ring has closed to a point, the turn is taken from the ring next to it)
        const a = (off + jj * W + i0) * 3, b = (off + jj * W + i1) * 3, ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
        nx = uy * vz - uz * vy; ny = uz * vx - ux * vz; nz = ux * vy - uy * vx; l = Math.hypot(nx, ny, nz); if (l > 1e-10) break;
      }
      if (l <= 1e-10) { nx = 0; ny = 1; nz = 0; l = 1; }
      nor[k] = nx / l; nor[k + 1] = ny / l; nor[k + 2] = nz / l;
      const lv = Math.hypot(vx, vy, vz) || 1; tan[k] = vx / lv; tan[k + 1] = vy / lv; tan[k + 2] = vz / lv;
    }
  }
  changed() { const a = this.geo.attributes; a.position.needsUpdate = true; a.normal.needsUpdate = true; a.aT.needsUpdate = true; }
}

// A ring: one cross-section of a thing. c its middle, f the way it faces, s its side; rf, rb, rs how far it reaches to
// the front, the back and the sides; tf, tb how far its front and back are lifted; n how square it is (2: an ellipse).
const ring = (o = {}) => ({ c: V3(), f: V3(0, 0, 1), s: V3(1, 0, 0), rf: 0.05, rb: 0.05, rs: 0.05, tf: 0, tb: 0, ts: 0, n: 2, ...o });
const still = (x, y, z, rf, rs, n = 2, rb = rf) => ring({ c: V3(x, y, z), rf, rb, rs, n });
function ringAt(r, cs, sn, out) {
  if (r.n !== 2) { const e = 2 / r.n; cs = Math.sign(cs) * Math.pow(Math.abs(cs), e); sn = Math.sign(sn) * Math.pow(Math.abs(sn), e); }
  const a = cs > 0 ? r.rf * cs : r.rb * cs, b = r.rs * sn, y = (cs > 0 ? r.tf * cs : -r.tb * cs) - r.ts * sn * sn;
  return out.set(r.c.x + r.f.x * a + r.s.x * b, r.c.y + r.f.y * a + r.s.y * b + y, r.c.z + r.f.z * a + r.s.z * b);
}
const _r = [0, 1, 2, 3].map(() => V3());
function crv(a, b, c, d, t, out) {
  const t2 = t * t, t3 = t2 * t, w0 = -0.5 * t3 + t2 - 0.5 * t, w1 = 1.5 * t3 - 2.5 * t2 + 1, w2 = -1.5 * t3 + 2 * t2 + 0.5 * t, w3 = 0.5 * t3 - 0.5 * t2;
  return out.set(a.x * w0 + b.x * w1 + c.x * w2 + d.x * w3, a.y * w0 + b.y * w1 + c.y * w2 + d.y * w3, a.z * w0 + b.z * w1 + c.z * w2 + d.z * w3);
}
// The skin over a row of rings: th round it (0: its front), v along it; eased through the rings, or straight between.
function loft(rings, th, v, out, straight = false) {
  const n = rings.length, x = Math.min(n - 1 - 1e-6, Math.max(0, v * (n - 1))), i = Math.floor(x), t = x - i, cs = Math.cos(th), sn = Math.sin(th);
  ringAt(rings[i], cs, sn, _r[1]); ringAt(rings[i + 1], cs, sn, _r[2]);
  if (straight) return out.lerpVectors(_r[1], _r[2], t);
  ringAt(rings[Math.max(0, i - 1)], cs, sn, _r[0]); ringAt(rings[Math.min(n - 1, i + 2)], cs, sn, _r[3]);
  return crv(_r[0], _r[1], _r[2], _r[3], t, out);
}
const _c = [0, 1, 2, 3].map(() => V3());
function loftMid(rings, v, out) {
  const n = rings.length, x = Math.min(n - 1 - 1e-6, Math.max(0, v * (n - 1))), i = Math.floor(x), t = x - i;
  return crv(rings[Math.max(0, i - 1)].c, rings[i].c, rings[i + 1].c, rings[Math.min(n - 1, i + 2)].c, t, out);
}
// The open book, across its spread: how high the paper stands at x (the thick left half, the gutter, the thin right).
function bookH(x) {
  const t = Math.abs(x) / BOOK.w;
  return x <= 0 ? 0.006 + 0.027 * (1 - Math.exp(-t / 0.13)) - 0.009 * t : 0.006 + 0.008 * (1 - Math.exp(-t / 0.1)) - 0.003 * t + 0.0015 * Math.sin(t * 5.5);
}

const NOISE = /* glsl */`
float wH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float wN(vec2 p, float per) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); float x0 = mod(i.x, per), x1 = mod(i.x + 1.0, per);
  return mix(mix(wH(vec2(x0, i.y)), wH(vec2(x1, i.y)), f.x), mix(wH(vec2(x0, i.y + 1.0)), wH(vec2(x1, i.y + 1.0)), f.x), f.y); }
float sq(float x) { return x * x; }
float dab(vec2 p, vec2 at, vec2 r) { vec2 d = (p - at) / r; return exp(-dot(d, d)); }`;

lifeFor(4773, {
  title: /^Isabella Wolff/,
  word: 'satin',
  stage: { out: 1.6, half: 1.1, cam: { dist: 2.6, height: 0.8, side: 0.72, fov: 60, lookU: 0.1, lookOut: 0.45, lookH: 0.84 } },      // (it stands to the right, to see her from behind as she goes)
  wake: 2, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.1) => P.near(h, a), glsl = (h, a) => { const c = col(h, a); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
    this.B = new THREE.Matrix4().makeBasis(V3(L.tx, 0, L.tz).multiplyScalar(SC), V3(0, SC, 0), V3(L.nx, 0, L.nz).multiplyScalar(SC)).setPosition(L.floor(0, 0).setY(L.y + LIFT));
    this.Binv = this.B.clone().invert();
    const sh = this.sh = new Sheets(), m4 = () => new THREE.Matrix4();
    const placed = (f, m) => (u, v, o) => { f(u, v, o); o.applyMatrix4(m); };

    // ------------------------------------------------------------ the table
    {
      const { x, z, hw, hd, top } = TBL, n = 7;
      const slab = [still(x, top, z, 0.001, 0.001, n), still(x, top, z, hd, hw, n), still(x, top - 0.012, z, hd, hw, n), still(x, top - 0.013, z, hd * 0.9, hw * 0.93, n), still(x, top - 0.05, z, hd * 0.9, hw * 0.93, n), still(x, top - 0.05, z, 0.001, 0.001, n)];
      sh.add(40, 5, K.WOOD, M_DESK, { wrap: true, f: (u, v, o) => loft(slab, u * TAU + PI, v, o, true) });
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const lx = x + sx * (hw - 0.022), lz = z + sz * (hd - 0.02), leg = [still(lx, top - 0.05, lz, 0.012, 0.012, 4), still(lx, 0.11, lz, 0.0095, 0.0095, 4), still(lx, 0.0, lz, 0.007, 0.007, 4)];
        sh.add(8, 4, K.WOOD, M_DESK, { wrap: true, part: 1, f: (u, v, o) => loft(leg, u * TAU + PI, v, o, true) });
      }
    }
    // ------------------------------------------------------------ the cushion, plump, a corner at each end, tipped towards her
    const tip = m4().makeTranslation(TBL.x, TBL.top + 0.006, TBL.z).multiply(m4().makeRotationZ(-0.11)).multiply(m4().makeRotationX(0.07));
    {
      const { hw, hd, th } = CUSH, R = (k, y) => still(0, y, 0, hd * k, hw * k, 3.2), rr = [R(0.01, 0), R(0.62, 0.004), R(0.95, th * 0.3), R(1, th * 0.5), R(0.93, th * 0.72), R(0.6, th * 0.98), R(0.01, th)];
      sh.add(36, 12, K.VELVET, M_DESK, { wrap: true, f: placed((u, v, o) => {
        const th2 = u * TAU + PI; loft(rr, th2, v, o);
        const pull = 1 + 0.1 * Math.pow(Math.abs(Math.sin(2 * th2)), 3) * Math.sin(PI * v);      // its corners drawn out
        o.x *= pull; o.z *= pull;
      }, tip) });
    }
    // ------------------------------------------------------------ the book of prints, open on it
    const lie = this.lie = tip.clone().multiply(m4().makeTranslation(0.004, CUSH.th + 0.008, 0.004)).multiply(m4().makeRotationZ(-0.07)).multiply(m4().makeRotationX(0.05)).multiply(m4().makeRotationY(-0.2));
    {
      const { w, hz } = BOOK;
      sh.add(26, 6, K.PAGE, M_DESK, { f: placed((u, v, o) => { const x = (u * 2 - 1) * w; o.set(x, bookH(x), (v * 2 - 1) * hz); }, lie) });
      // its edges, all the way round: the leaves seen end on, and the board they lie on
      const per = [[-w, hz], [w, hz], [w, -hz], [-w, -hz], [-w, hz]], seg = [12, 2, 12, 2];
      sh.add(28, 3, K.EDGE, M_DESK, { f: placed((u, v, o) => {
        let i = u * 28, k = 0; while (k < 3 && i > seg[k]) { i -= seg[k]; k++; }
        const t = clamp01(i / seg[k]), x = lerp(per[k][0], per[k + 1][0], t), z = lerp(per[k][1], per[k + 1][1], t), g = 1 + 0.02 * v;
        o.set(x * g, lerp(bookH(x), -0.004, v), z * g);
      }, lie) });
      const board = [still(0, -0.004, 0, 0.001, 0.001, 9), still(0, -0.004, 0, hz + 0.004, w + 0.004, 9), still(0, -0.0085, 0, hz + 0.004, w + 0.004, 9), still(0, -0.0085, 0, 0.001, 0.001, 9)];
      sh.add(28, 3, K.BOARD, M_DESK, { wrap: true, f: placed((u, v, o) => loft(board, u * TAU + PI, v, o, true), lie) });
      // one leaf standing, half turned, as he has it
      sh.add(8, 5, K.PAGE, M_DESK, { part: 1, f: placed((u, v, o) => {
        const x0 = -0.008, bow = 0.006 * Math.sin(PI * v);
        o.set(x0 - 0.022 * u - 0.066 * u * u, bookH(x0) + 0.001 + (0.082 * u - 0.04 * u * u) * (1 + 0.12 * (v - 0.5)) + bow * u, (v * 2 - 1) * (hz - 0.002));
      }, lie) });
    }
    // ------------------------------------------------------------ the shawl: over the table's near corner, and down
    {
      const { top } = TBL, x0 = TBL.x + 0.03, z0 = TBL.z + 0.0, edge = TBL.z + TBL.hd, ax = [0.5, 0.866], wide = 0.15, long = 0.3;
      sh.add(18, 22, K.SHAWL, M_DESK, { f: (u, v, o) => {
        const a = (u - 0.5) * wide, d = v * long, x = x0 + ax[0] * d + ax[1] * a, z = z0 + ax[1] * d - ax[0] * a, over = z - edge;
        if (over <= 0) { o.set(x, top + 0.003 + 0.004 * Math.sin(u * 9 + 1) * sstep(-0.1, 0, over), z); return; }
        // past the edge it falls: in long soft folds, swung a little out at the hem
        const fall = over * 1.2, xe = x - ax[0] * over / ax[1], fold = Math.sin(u * TAU * 1.6 + 0.6) * 0.017 * sstep(0, 0.07, fall) + Math.sin(u * TAU * 3.7 + 2) * 0.006 * sstep(0.03, 0.12, fall);
        o.set(xe + 0.3 * fold + 0.02 * (u - 0.5) * -sstep(0.02, 0.2, fall), top + 0.003 - fall, edge + 0.008 * (1 - Math.exp(-fall / 0.015)) + fold + 0.01 * sstep(0.08, 0.2, fall));
      } });
    }
    // ------------------------------------------------------------ her chair: a seat and a back in his red velvet, the top rail arched, on dark legs
    {
      const turn = m4().makeRotationY(YSEAT), R = (x, y, z, rf, rs, o) => Object.assign(still(x, y, z, rf, rs, 4), o || {});
      const seat = [R(0, 0.118, 0, 0.001, 0.001), R(0, 0.118, 0, 0.074, 0.08), R(0, 0.14, 0, 0.08, 0.086), R(0, 0.156, 0, 0.072, 0.078), R(0, 0.162, 0, 0.001, 0.001)];
      sh.add(28, 8, K.VELVET, M_STOOL, { wrap: true, part: 1, f: placed((u, v, o) => loft(seat, u * TAU + PI, v, o), turn) });
      // the back: a padded panel, raked a little and bowed round her
      const back = [R(0, 0.15, -0.066, 0.011, 0.07), R(0, 0.2, -0.074, 0.014, 0.076), R(0, 0.29, -0.088, 0.014, 0.08, { ts: 0.012 }), R(0, 0.345, -0.097, 0.011, 0.074, { ts: 0.028 }), R(0, 0.356, -0.099, 0.002, 0.05, { ts: 0.03 })];
      sh.add(28, 10, K.VELVET, M_STOOL, { wrap: true, part: 2, f: placed((u, v, o) => { loft(back, u * TAU + PI, v, o); o.z += 2.5 * o.x * o.x; }, turn) });
      for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
        const x = sx * 0.064, z = sz * 0.058, out = sz < 0 ? -0.016 : 0.006, leg = [R(x, 0.122, z, 0.0085, 0.0085), R(x + sx * 0.002, 0.06, z + out * 0.5, 0.007, 0.007), R(x + sx * 0.004, 0, z + out, 0.0055, 0.0055)];
        sh.add(8, 4, K.WOOD, M_STOOL, { wrap: true, part: 1, f: placed((u, v, o) => loft(leg, u * TAU + PI, v, o, true), turn) });
      }
    }

    // ------------------------------------------------------------ her: every part is laid again each frame, from her bones
    const b = this.b = {
      P: V3(), d: V3(), fP: V3(), lP: V3(), fT: V3(), lT: V3(), Bu: V3(), Cs: V3(), Nb: V3(), Hc: V3(), fH: V3(), lH: V3(), uH: V3(), Hb: V3(),
      Sh: [V3(), V3()], E: [V3(), V3()], W: [V3(), V3()], hd: [V3(), V3()], Ec: [V3(), V3()], lag: V3(),
      sk: [0, 1, 2, 3, 4].map(() => ring()), bo: [0, 1, 2, 3].map(() => ring()), nk: [0, 1, 2, 3].map(() => ring()),
      rip: 0.09, ph: 0, wave: 0, waveY: 0, knee: 0, kneeS: 0, lap: 0, breath: 0,
    };
    const mid = V3(), t1 = V3(), t2 = V3(), n1 = V3(), n2 = V3(), REF = V3(0.25, 0.2, 0.95).normalize();
    const her = this.her = {};
    her.skirt = [sh.add(48, 24, K.SATIN, M_HER, { wrap: true }), (u, v, o) => {
      const th = u * TAU + PI; loft(b.sk, th, v, o);
      // her knees under it, when she sits; the knee that is stepping, when she walks
      if (b.lap > 0) { const dth = Math.atan2(Math.sin(th), Math.cos(th)), k = b.lap * hump(v, 0.3, 0.82), two = Math.exp(-((Math.abs(dth) - 0.42) / 0.3) * ((Math.abs(dth) - 0.42) / 0.3)), dip = Math.exp(-(dth / 0.2) * (dth / 0.2)); o.y += k * (0.014 * two - 0.012 * dip); o.x += b.fP.x * k * 0.012 * two; o.z += b.fP.z * k * 0.012 * two; }
      if (b.knee > 0) { let dth = th - TAU - b.kneeS * 0.55; dth = Math.atan2(Math.sin(dth), Math.cos(dth)); const k = b.knee * Math.exp(-(dth / 0.5) * (dth / 0.5)) * hump(v, 0.25, 1.05); o.x += b.fP.x * k; o.z += b.fP.z * k; }
      // its folds: tubes that start under the waist and deepen to the hem, swung as she moves; a settling runs down them
      loftMid(b.sk, v, mid);
      const run = b.wave * Math.exp(-((o.y - b.waveY) / 0.09) * ((o.y - b.waveY) / 0.09));
      const ph = b.ph * v + 1.5 * run, a = b.rip * sstep(0.12, 0.85, v) * (1 + 0.3 * run);
      const rp = a * (0.6 * Math.sin(5 * th + 1.3 + 2.2 * v + ph) + 0.34 * Math.sin(9 * th + 4.1 - 3.1 * v - 0.7 * ph) + 0.14 * Math.sin(16 * th + 0.5 + 5 * v + ph));
      o.x += (o.x - mid.x) * rp; o.z += (o.z - mid.z) * rp;
      if (o.y < 0.004) o.y = 0.004;
    }];
    her.bodice = [sh.add(24, 6, K.SATIN, M_HER, { wrap: true, part: 1 }), (u, v, o) => loft(b.bo, u * TAU + PI, v, o)];
    her.neck = [sh.add(12, 5, K.FLESH, M_HER, { wrap: true }), (u, v, o) => loft(b.nk, u * TAU + PI, v, o)];
    // a sleeve: full, crumpled across, gathered at the wrist into a cuff
    const SLV = [[0, 0.016], [0.1, 0.027], [0.3, 0.0245], [0.5, 0.0225], [0.75, 0.018], [0.9, 0.0125], [0.94, 0.0115], [1, 0.0165]];
    const prof = (pts, t) => { for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const a = pts[i - 1], c = pts[i]; return lerp(a[1], c[1], sstep(a[0], c[0], t)); } return pts[pts.length - 1][1]; };
    const sleeve = i => (u, v, o) => {
      const S = b.Sh[i], C = b.Ec[i], Wd = b.W[i], w = 1 - v;
      o.set(w * w * S.x + 2 * w * v * C.x + v * v * Wd.x, w * w * S.y + 2 * w * v * C.y + v * v * Wd.y, w * w * S.z + 2 * w * v * C.z + v * v * Wd.z);
      t1.set((C.x - S.x) * w + (Wd.x - C.x) * v, (C.y - S.y) * w + (Wd.y - C.y) * v, (C.z - S.z) * w + (Wd.z - C.z) * v).normalize();
      n1.copy(REF).addScaledVector(t1, -REF.dot(t1)); if (n1.lengthSq() < 1e-6) n1.set(1, 0, 0).addScaledVector(t1, -t1.x); n1.normalize(); n2.crossVectors(t1, n1);
      const th = u * TAU, r = prof(SLV, v) * (1 + 0.1 * Math.sin(v * 31 + 2 * th + i * 2) * sstep(0.1, 0.3, v) * sstep(0.95, 0.85, v) + 0.06 * Math.sin(v * 17 - 3 * th));
      o.addScaledVector(n1, r * Math.cos(th)).addScaledVector(n2, r * Math.sin(th));
    };
    her.slL = [sh.add(14, 14, K.SATIN, M_HER, { wrap: true, part: 2 }), sleeve(0)];
    her.slR = [sh.add(14, 14, K.SATIN, M_HER, { wrap: true, part: 2 }), sleeve(1)];
    const hand = i => (u, v, o) => {
      const hd = b.hd[i], Wd = b.W[i], th = u * TAU, ph = (v - 0.5) * PI, cp = Math.cos(ph);
      n1.set(0, 1, 0).addScaledVector(hd, -hd.y); if (n1.lengthSq() < 1e-6) n1.set(1, 0, 0); n1.normalize(); n2.crossVectors(hd, n1);
      const taper = 1 - 0.3 * sstep(0, 1, v);
      o.copy(Wd).addScaledVector(hd, 0.016 + 0.021 * Math.sin(ph)).addScaledVector(n2, 0.0115 * taper * cp * Math.cos(th)).addScaledVector(n1, 0.0075 * taper * cp * Math.sin(th));
    };
    her.hL = [sh.add(8, 6, K.FLESH, M_HER, { wrap: true, part: 1 }), hand(0)];
    her.hR = [sh.add(8, 6, K.FLESH, M_HER, { wrap: true, part: 1 }), hand(1)];
    // her head: an egg, the nose and the chin drawn forward, the jaw narrowed
    const headAt = (th, ph, k, o) => {
      const cp = Math.cos(ph), sp = Math.sin(ph), ct = Math.cos(th), st = Math.sin(th), low = sstep(0.1, -1.3, ph), front = Math.max(0, ct);
      let f = HEAD.f * ct * cp, s = HEAD.s * st * cp * (1 - 0.3 * low), y = HEAD.y * sp;
      f += 0.0115 * gss(th, 0.23) * gss(ph + 0.17, 0.17);                                              // the nose
      f += 0.003 * gss(th, 0.3) * gss(ph + 0.6, 0.1);                                                  // the mouth
      f += 0.006 * front * front * gss(ph + 0.95, 0.26) - 0.007 * front * low;                       // the chin; the jaw falls back under it
      f += 0.0036 * front * gss(ph - 0.27, 0.14) - 0.003 * gss(Math.abs(th) - 0.38, 0.2) * gss(ph - 0.07, 0.12);      // the brow; the eyes set in under it
      return o.copy(b.Hc).addScaledVector(b.fH, f * k).addScaledVector(b.lH, s * k).addScaledVector(b.uH, y * k);
    };
    her.head = [sh.add(24, 14, K.HEAD, M_HER, { wrap: true }), (u, v, o) => headAt((u - 0.5) * TAU, (v - 0.5) * PI, 1, o)];
    // the gold silk wound round her head: close over the brow, full behind; and the white scarf twisted across it
    const rim = th => lerp(0.5, -0.31, Math.pow((1 - Math.cos(th)) / 2, 1.6));
    her.cap = [sh.add(22, 8, K.CAP, M_HER, { wrap: true }), (u, v, o) => {
      const th = (u - 0.5) * TAU, back = (1 - Math.cos(th)) / 2, ph = lerp(rim(th), PI / 2, v);
      headAt(th, ph, 1.1 + 0.2 * back * Math.sin(Math.min(1, v * 1.25) * PI * 0.85 + 0.25) + 0.02 * Math.sin(th * 5 + v * 6), o);
    }];
    const rollAt = (s, o) => { const th = lerp(-2.0, 2.0, s); return headAt(th, 0.6 + 0.16 * Math.cos(th * 0.8), 1.13, o); };
    her.roll = [sh.add(16, 8, K.ROLL, M_HER, { wrap: true }), (u, v, o) => {
      const s = v; rollAt(s, o); rollAt(Math.min(1, s + 0.02), t1); rollAt(Math.max(0, s - 0.02), t2); t1.sub(t2).normalize();
      n1.copy(o).sub(b.Hc).addScaledVector(t1, -t1.dot(n1.copy(o).sub(b.Hc))).normalize(); n2.crossVectors(t1, n1);
      const th = u * TAU, r = 0.0115 * Math.pow(Math.sin(PI * (0.06 + 0.88 * s)), 0.45) * (1 + 0.16 * Math.sin(s * 22 + th * 2));
      o.addScaledVector(n1, r * Math.cos(th) * 0.8).addScaledVector(n2, r * Math.sin(th));
    }];
    // the long dark curl that hangs by her neck
    her.lock = [sh.add(6, 8, K.HAIR, M_HER, { wrap: true }), (u, v, o) => {
      headAt(-1.75, -0.35, 1.02, o); const th = u * TAU, r = 0.0085 * (1 - 0.55 * v) * (1 + 0.25 * Math.sin(v * 16 + th));
      o.y -= 0.078 * v; o.x += 0.006 * Math.sin(v * 9) + b.fH.x * 0.01 * v; o.z += 0.005 * Math.cos(v * 9) + b.fH.z * 0.01 * v;
      o.x += r * Math.cos(th); o.z += r * Math.sin(th);
    }];
    // the rose at her waist
    her.rose = [sh.add(10, 6, K.ROSE, M_HER, { wrap: true }), (u, v, o) => {
      const th = u * TAU, ph = (v - 0.5) * PI, cp = Math.cos(ph), r = 0.0125 * (1 + 0.12 * Math.sin(th * 5 + v * 7));
      o.copy(b.Bu).addScaledVector(b.fT, 0.034 + r * 0.6 * Math.sin(ph) + 0.004).addScaledVector(b.lT, 0.021 + r * cp * Math.cos(th)).addScaledVector(b.d, -0.006 + r * cp * Math.sin(th));
    }];

    // the shawl again: lying along the outside of her left arm, its end hanging from the wrist
    her.wrap = [sh.add(8, 18, K.SHAWL, M_HER, { part: 1 }), (u, v, o) => {
      const S = b.Sh[0], C = b.Ec[0], Wd = b.W[0], t = Math.min(1, v / 0.72), w = 1 - t;
      o.set(w * w * S.x + 2 * w * t * C.x + t * t * Wd.x, w * w * S.y + 2 * w * t * C.y + t * t * Wd.y, w * w * S.z + 2 * w * t * C.z + t * t * Wd.z);
      t1.set((C.x - S.x) * w + (Wd.x - C.x) * t, (C.y - S.y) * w + (Wd.y - C.y) * t, (C.z - S.z) * w + (Wd.z - C.z) * t).normalize();
      n1.copy(b.lT).addScaledVector(b.d, 0.5 * (1 - t)).addScaledVector(t1, -t1.dot(n1)); if (n1.lengthSq() < 1e-6) n1.copy(b.fT); n1.normalize(); n2.crossVectors(t1, n1);
      const ph = (u - 0.5) * 2.0, r = prof(SLV, Math.min(t, 0.9)) * 1.12 + 0.004;
      o.addScaledVector(n1, r * Math.cos(ph)).addScaledVector(n2, r * Math.sin(ph));
      if (v > 0.72) { const k = (v - 0.72) / 0.28; o.y -= 0.105 * k; o.x += (b.lT.x * 0.01 - b.lag.x * 0.4) * k * k + 0.006 * Math.sin(u * 7 + k * 5) * k; o.z += (b.lT.z * 0.01 - b.lag.z * 0.4) * k * k; if (o.y < 0.01) o.y = 0.01; }
    }];

    // his strokes: what the eye sees of her is these, about a hundred and seventy broad ribbons of paint that lie along her
    // forms, stand a little proud of them and turn their faces to you; the forms themselves are only the cloth's own middle tone underneath
    {
      const M = this.marks = [], rnd = L.rand, sk = her.skirt[0], pick = (a, b) => a + Math.floor(rnd() * (b - a + 1));
      const mark = (s, along, i, j, n, w, flip, pal) => M.push({ s, along, i, j, n, w, flip, pal });
      // big loaded sweeps down the gown: a course to every other column, three deep, each wide enough to lie over its
      // neighbours (narrower at the waist, broadest at the hem), and some more thrown over them
      for (let i = 0; i < sk.nu; i += 2) for (let k = 0; k < 3; k++) { const n = pick(3, 4), j = Math.min(sk.nv - 2 * n, k * 6 + pick(0, 2)); mark(sk, true, (i + (k & 1)) % sk.nu, j, n, lerp(0.42, 1.15, (j + n) / sk.nv) * (0.9 + 0.3 * rnd()), -1, 0); }
      for (let m = 0; m < 30; m++) { const n = pick(3, 4), j = pick(2, sk.nv - 2 * n); mark(sk, true, pick(0, sk.nu - 1), j, n, lerp(0.35, 0.9, (j + n) / sk.nv) * (0.8 + 0.4 * rnd()), -1, 0); }
      // curved ones round the sleeves and over the shoulders
      for (const sl of [her.slL[0], her.slR[0]]) for (let j = 0; j <= 12; j += 3) for (let k = 0; k < 3; k++) mark(sl, false, (k * 5 + pick(0, 2)) % sl.nu, Math.min(12, j + pick(0, 1)), 2, 0.36 + 0.1 * rnd(), 1, 0);
      // the bodice
      for (let i = 0; i < 24; i += 3) mark(her.bodice[0], true, i + pick(0, 1), pick(0, 2), 2, 0.4 + 0.1 * rnd(), 1, 0);
      // the gold silk round her head, the white scarf across it, and her dark hair at the temple: three soft masses
      for (let j = 1; j <= 5; j += 2) for (let k = 0; k < 4; k++) mark(her.cap[0], false, (k * 6 + pick(0, 3)) % 22, j + pick(0, 1), 2, 0.2 + 0.06 * rnd(), 1, 1);
      for (let m = 0; m < 4; m++) mark(her.roll[0], true, pick(0, 15), m, 2, 0.16, 1, 3);
      for (const [i, j] of [[3, 8], [4, 9], [18, 9], [19, 8], [2, 6], [20, 6]]) mark(her.head[0], false, i, j, 1, 0.22, 1, 2);
      this.strokes = sh.marks(M.length, K.STROKE, M_HER); this.strokes.pal = M.map(m => m.pal);
    }
    // her road
    // (in from the wall on her right, if there is one within reach: then she walks away from you all the way)
    const R = L.room, far = !R ? 99 : Math.abs(L.tx) > 0.5 ? (L.tx > 0 ? R.x1 - L.cx : L.cx - R.x0) : (L.tz > 0 ? R.z1 - L.cz : L.cz - R.z0), edge = far / SC;
    this.side = far > 0.9 && far < 1.9 ? edge : 99;
    const way = this.side < 99 ? [[edge + 0.22, 0.9], [edge - 0.2, 0.83], [0.45, 0.62], PST] : ROAD;
    this.road = new THREE.CatmullRomCurve3(way.map(([x, z]) => V3(x, 0, z)), false, 'centripetal'); this.road.arcLengthDivisions = 300; this.road.updateArcLengths(); this.len = this.road.getLength();

    const geo = sh.build();
    // ------------------------------------------------------------ his paint on all of it: one material, one draw call
    const u = this.u = { uInv: { value: this.Binv }, uDesk: { value: V3() }, uStool: { value: V3() }, uSq: { value: 1 }, uWave: { value: new THREE.Vector2(0, 0) }, uWarm: { value: 0 }, uDim: { value: 0 }, uSit: { value: 0 }, uRight: { value: this.side - 0.008 } };
    const sun = V3(...SUN).normalize();
    const tm = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, fog: false });
    tm.onBeforeCompile = shd => {
      Object.assign(shd.uniforms, u);
      shd.vertexShader = shd.vertexShader.replace('#include <common>', `#include <common>
attribute vec3 aK, aT; attribute vec2 aUv; uniform vec3 uDesk, uStool; uniform float uSq; uniform mat4 uInv;
varying vec3 vK, vLP, vN, vT; varying vec2 vUv2;`)
        .replace('#include <begin_vertex>', `vec3 transformed = vec3(position);
  if (aK.y > 1.5) transformed += uStool;
  else if (aK.y > 0.5) { if (transformed.y > ${TBL.top.toFixed(3)}) transformed.y = ${TBL.top.toFixed(3)} + (transformed.y - ${TBL.top.toFixed(3)}) * uSq; transformed += uDesk; }
  if (aK.x > 12.5) {
    // a stroke: a ribbon along aT, spread across your line of sight and lifted a little towards you
    vec3 toEye = normalize((uInv * vec4(cameraPosition, 1.0)).xyz - transformed), ac = cross(aT, toEye); float cl = length(ac), sd = fract(aK.z);
    if (cl > 1.0e-4) transformed += ac / cl * (aUv.x - 0.5) * 2.0 * mix(0.021, 0.034, fract(sd * 5.3)) * length(normal);
    transformed += toEye * (0.003 + 0.004 * fract(sd * 9.7));
  }
  vK = aK; vUv2 = aUv; vLP = transformed; vN = normal; vT = aT;`);
      shd.fragmentShader = shd.fragmentShader.replace('#include <common>', `#include <common>
uniform mat4 uInv; uniform vec2 uWave; uniform float uWarm, uDim, uSit, uRight;
varying vec3 vK, vLP, vN, vT; varying vec2 vUv2;${NOISE}`)
        .replace('#include <opaque_fragment>', `{
  if (vLP.z < -0.032 || vLP.x > uRight) discard;                 // (still in the wall)
  int kind = int(vK.x + 0.5); float part = vK.z;
  vec3 N = normalize(vN); if (!gl_FrontFacing && kind != ${K.STROKE}) N = -N;
  vec3 eye = (uInv * vec4(cameraPosition, 1.0)).xyz, Vd = normalize(eye - vLP);
  vec3 Lk = vec3(${sun.x.toFixed(4)}, ${sun.y.toFixed(4)}, ${sun.z.toFixed(4)}), Hh = normalize(Lk + Vd), T = normalize(vT);
  float nl = dot(N, Lk), key = ${KEY.toFixed(2)}; vec2 uv = vUv2; vec3 c = vec3(0.5);
  float wave = uWave.y * exp(-sq((vLP.y - uWave.x) / 0.085));
  float rag = wN(vec2(uv.x * 37.0, uv.y * 29.0), 37.0);
  if (kind == ${K.SATIN} || kind == ${K.ROLL}) {
    // his satin: pearl, the half tones a cool grey and a warm one, the shadows thin and brown; and over it the lights,
    // loaded strokes of near white that run along the folds where they turn to the light, ragged at both ends
    if (dot(N, Vd) < 0.45 * rag + 0.04) discard;                                    // (its edge broken, as a brush leaves it)
    vec3 Bt = normalize(cross(N, T)); float x = uv.x * 6.2832, fu = 16.0, an = 1.0;
    if (kind == ${K.ROLL}) { fu = 9.0; an = 0.3; }
    else if (part < 0.5) { float a = smoothstep(0.04, 0.4, uv.y); N = normalize(N - Bt * 0.85 * a * (0.5 * cos(13.0 * x + 3.0 * uv.y + 1.0) + 0.42 * cos(21.0 * x - 4.0 * uv.y + 2.0) + 0.3 * cos(34.0 * x + 7.0 * uv.y))); }      // folds too fine to model
    else if (part < 1.5) { fu = 9.0; an = 0.5; N = normalize(N - Bt * 0.5 * smoothstep(0.0, 0.5, uv.y) * (0.6 * cos(24.0 * x) + 0.35 * cos(41.0 * x + 2.0))); }      // the gathers of the bodice
    else { fu = 9.0; an = 0.25; N = normalize(N + T * 1.7 * (wN(vec2(uv.x * 6.0, uv.y * 15.0), 6.0) - wN(vec2(uv.x * 6.0, uv.y * 15.0 + 0.7), 6.0))); }      // a sleeve, crumpled across
    nl = dot(N, Lk);
    float along = wN(vec2(uv.x * fu, uv.y * 2.6 + part * 3.1), fu), fine = wN(vec2(uv.x * fu * 3.0, uv.y * 7.0 + 5.0), fu * 3.0), brk = wN(vec2(uv.x * 5.0, uv.y * 19.0 + part), 5.0);
    float tone = nl + 0.3 * (along - 0.5) + 0.12 * (fine - 0.5);
    c = mix(${glsl('#4c3923')}, ${glsl('#8f7d5b')}, smoothstep(-0.35, 0.08, tone));
    c = mix(c, ${glsl('#bfb091')}, smoothstep(0.08, 0.42, tone));
    c = mix(c, ${glsl('#e2d8be')}, smoothstep(0.5, 0.86, tone));
    c = mix(c, ${glsl('#8f927e', 0.05)}, 0.45 * smoothstep(0.5, 0.75, brk) * (1.0 - smoothstep(0.3, 0.6, tone)) * smoothstep(-0.2, 0.1, tone));
    c *= 0.93 + 0.14 * fine;
    if (part < 0.5) c *= 1.0 - 0.4 * smoothstep(0.9, 1.0, uv.y);                                  // (where the hem lies on the boards)
    float sinTH = sqrt(max(0.0, 1.0 - sq(dot(T, Hh))));
    float spec = an * pow(sinTH, 18.0) * smoothstep(0.05, 0.55, dot(N, Hh)) + (1.0 - 0.55 * an) * pow(max(dot(N, Hh), 0.0), 8.0);
    c = mix(c, ${glsl('#a3aba6', 0.03)}, 0.34 * smoothstep(0.1, -0.5, tone) * clamp(0.35 + 0.65 * N.x, 0.0, 1.0));      // (a pearly light given back into its shadows)
    float s = 1.1 * spec + 0.3 * (along - 0.5) + 0.3 * (brk - 0.5) + 0.75 * wave;
    c = mix(c, ${glsl('#faf5e4', 0.02)}, 0.97 * smoothstep(0.5, 0.7, s) * (0.5 + 0.5 * smoothstep(0.3, 0.6, fine)));
    c = mix(c, ${glsl('#faf5e4', 0.02)}, 0.45 * clamp(wave - 0.25, 0.0, 1.0) * smoothstep(-0.3, 0.4, nl));
    c *= mix(vec3(1.0), vec3(1.1, 0.92, 0.84), 0.5 * smoothstep(0.2, -0.2, tone));        // (the red of the velvet, in its shadows)
    if (kind == ${K.SATIN}) c = mix(c, ${glsl('#c4baa0')}, 0.62);                         // (the form is only the cloth's middle tone, under his strokes)
    if (kind == ${K.ROLL}) c = mix(c, ${glsl('#8d7a5c')}, 0.5 * smoothstep(0.55, 0.8, fract(uv.y * 7.0 + uv.x)));      // (twisted)
    else if (part > 1.5 && uv.y > 0.925) {
      // the cuff: lace, a few white touches with the dark between
      if (wH(floor(vec2(uv.x * 22.0, uv.y * 90.0))) > 0.62 + 2.0 * (0.96 - uv.y)) discard;
      c = mix(${glsl('#b9ad92')}, ${glsl('#f4eedd', 0.02)}, smoothstep(0.0, 0.6, tone));
    }
    else if (part > 0.5 && part < 1.5 && uv.y > 0.86) c = mix(c, ${glsl('#f4eedd', 0.02)}, step(0.45, fract(uv.x * 26.0)) * smoothstep(0.86, 0.92, uv.y));      // the pearls and lace at her neck
  } else if (kind == ${K.FLESH} || kind == ${K.HEAD}) {
    float soft = wN(vec2(uv.x * 9.0, uv.y * 7.0), 9.0);
    float tone = nl + 0.1 * (soft - 0.5);
    c = mix(${glsl('#8a5c40')}, ${glsl('#cfa07e')}, smoothstep(-0.3, 0.25, tone));
    c = mix(c, ${glsl('#ecd3b8')}, smoothstep(0.25, 0.8, tone));
    c = mix(c, ${glsl('#6e4a34')}, 0.6 * smoothstep(0.2, -0.5, nl));                    // (the far side lost into shade)
    if (kind == ${K.HEAD}) {
      float a = (uv.x - 0.5) * 6.2832, f = uv.y;
      // planes and no drawing: one soft tone in the socket of each lowered eye; the forehead and the
      // cheek in the light, with the bloom he gave it; a soft shade under the nose and under the lower lip; a mouth barely there
      c = mix(c, ${glsl('#9a745a')}, 0.42 * dab(vec2(abs(a), f), vec2(0.42, 0.545), vec2(0.15, 0.028)));
      c = mix(c, ${glsl('#f3dcc4', 0.03)}, 0.45 * (dab(vec2(abs(a), f), vec2(0.7, 0.45), vec2(0.3, 0.05)) + dab(vec2(a, f), vec2(0.0, 0.645), vec2(0.55, 0.035))) * smoothstep(0.0, 0.6, tone));
      c = mix(c, ${glsl('#dd7a6c', 0.04)}, 0.58 * dab(vec2(abs(a), f), vec2(0.86, 0.39), vec2(0.36, 0.07)));
      c = mix(c, ${glsl('#b8625a', 0.04)}, 0.5 * dab(vec2(a, f), vec2(0.0, 0.292), vec2(0.13, 0.014)));
      c = mix(c, ${glsl('#a17052')}, 0.45 * dab(vec2(a, f), vec2(0.0, 0.365), vec2(0.11, 0.015)));
      c = mix(c, ${glsl('#a17052')}, 0.4 * dab(vec2(a, f), vec2(0.0, 0.248), vec2(0.12, 0.013)));
      c = mix(c, ${glsl('#9a6a4e')}, 0.45 * smoothstep(0.2, 0.08, f));
      // her hair: dark, curling onto the brow and in front of the ear
      float curl = wN(vec2(uv.x * 30.0, uv.y * 22.0), 30.0);
      float line = mix(mix(0.72, 0.56, smoothstep(0.8, 1.25, abs(a))), 0.3, smoothstep(1.75, 2.2, abs(a))) + 0.05 * (curl - 0.5);
      float hair = smoothstep(line - 0.015, line + 0.015, f);
      c = mix(c, mix(${glsl('#2a180f')}, ${glsl('#70492e')}, smoothstep(0.45, 0.75, curl) * smoothstep(-0.1, 0.6, tone)), hair);
    }
  } else if (kind == ${K.HAIR}) {
    float curl = wN(vec2(uv.x * 6.0, uv.y * 12.0), 6.0);
    c = mix(${glsl('#1c100a')}, ${glsl('#6a4830')}, smoothstep(0.45, 0.8, curl) * smoothstep(0.35, 0.9, 0.5 + 0.5 * nl));
  } else if (kind == ${K.CAP}) {
    // gold silk, with its lights; and the worked band that goes round it
    float along = wN(vec2(uv.x * 12.0, uv.y * 4.0), 12.0), fine = wN(vec2(uv.x * 40.0, uv.y * 11.0), 40.0);
    float tone = clamp(0.32 + 0.72 * nl, 0.0, 1.0) + 0.2 * (along - 0.5);
    c = mix(${glsl('#5a3c14')}, ${glsl('#a98038')}, smoothstep(0.15, 0.5, tone));
    c = mix(c, ${glsl('#dcbd76')}, smoothstep(0.55, 0.82, tone + 0.12 * (fine - 0.5)));
    c = mix(c, ${glsl('#f6e9bd', 0.03)}, 0.8 * smoothstep(0.62, 0.7, pow(max(dot(N, Hh), 0.0), 8.0) + 0.3 * (along - 0.5)));
    float band = smoothstep(0.02, 0.05, uv.y) * smoothstep(0.2, 0.16, uv.y);
    vec2 cell = vec2(uv.x * 34.0, uv.y * 14.0); float h = wH(floor(cell));
    vec3 jewel = h < 0.3 ? ${glsl('#1d2748')} : h < 0.55 ? ${glsl('#9a2218')} : h < 0.72 ? ${glsl('#efe6cf')} : ${glsl('#1a1410')};
    c = mix(c, jewel * (0.6 + 0.5 * tone), 0.6 * band * smoothstep(0.48, 0.3, length(fract(cell) - 0.5)));
  } else if (kind == ${K.VELVET}) {
    if (dot(N, Vd) < 0.22 * rag - 0.03) discard;
    float nz = wN(vec2(uv.x * 26.0, uv.y * 9.0), 26.0), nb = wN(vec2(uv.x * 7.0, uv.y * 3.0 + 2.0), 7.0);
    if (part > 1.5) { N = normalize(N + T * 0.5 * (wN(vec2(uv.x * 5.0, uv.y * 2.0), 5.0) - 0.5) + cross(N, T) * 0.7 * (wN(vec2(uv.x * 7.0 + 3.0, uv.y * 3.0), 7.0) - 0.5)); nl = dot(N, Lk); }      // (its nap brushed in broad strokes)
    float tone = (part > 0.5 ? 0.85 * nl - 0.1 : nl - 0.12) + 0.4 * (nb - 0.5);
    c = mix(${glsl('#1e0706')}, ${glsl('#5c110b')}, smoothstep(-0.3, 0.3, tone));
    c = mix(c, ${glsl('#8f2416')}, smoothstep(0.3, 0.75, tone));
    c = mix(c, ${glsl('#b8442a')}, smoothstep(0.72, 1.0, tone) * (0.35 + 0.65 * nz));
    float rimL = pow(1.0 - max(dot(N, Vd), 0.0), 2.5);
    c = mix(c, ${glsl('#c7684a')}, 0.35 * rimL * smoothstep(0.0, 0.6, tone));                 // (velvet is lightest where it turns away)
    c *= 0.84 + 0.3 * nz;
    float cord = part < 0.5 ? smoothstep(0.04, 0.015, abs(uv.y - 0.5)) : part < 1.5 ? smoothstep(0.05, 0.02, abs(uv.y - 0.5)) : 0.0;
    if (part > 1.5) c = mix(c, ${glsl('#c2573a')}, 0.55 * max(smoothstep(0.045, 0.012, min(abs(uv.x - 0.25), abs(uv.x - 0.75))), smoothstep(0.86, 0.96, uv.y)) * smoothstep(-0.2, 0.5, tone));      // (its lit edge)
    c = mix(c, mix(${glsl('#5a3d12')}, ${glsl('#d6b25e')}, step(0.5, fract(uv.x * 46.0 + uv.y * 8.0)) * (0.35 + 0.65 * smoothstep(0.0, 0.7, tone))), cord);
  } else if (kind == ${K.SHAWL}) {
    // the shawl: a pale gold ground crowded with small dabs of red, dark blue and black, a border down each side, a fringe
    float tone = clamp(0.3 + 0.75 * nl, 0.0, 1.0);
    vec2 wp = uv + 0.03 * vec2(wN(uv * vec2(7.0, 15.0), 99.0), wN(uv * vec2(7.0, 15.0) + 7.0, 99.0));
    vec2 cell = vec2(wp.x * 19.0, wp.y * 46.0); vec2 id = floor(cell), lf = fract(cell) - 0.5;
    float h = wH(id), h2 = wH(id + 17.0), h3 = wH(id + 31.0);
    float edge = smoothstep(0.2, 0.13, min(uv.x, 1.0 - uv.x));
    c = mix(${glsl('#a37c36')}, ${glsl('#cdb682')}, smoothstep(0.4, 0.75, wN(uv * vec2(5.0, 12.0), 99.0)) * (1.0 - 0.7 * edge));
    if (part > 0.5) { c = mix(${glsl('#d9ccaa')}, ${glsl('#efe7d2', 0.03)}, smoothstep(0.3, 0.7, wN(uv * vec2(3.0, 9.0), 99.0))); if (h > 0.5 && h < 0.86) h = 0.9; }
    vec3 dabc = h < 0.34 ? ${glsl('#9a2018')} : h < 0.58 ? ${glsl('#1b2649')} : h < 0.74 ? ${glsl('#16110d')} : h < 0.86 ? ${glsl('#b8562a')} : h < 0.93 ? ${glsl('#e6dcc0')} : c;
    vec2 lr = vec2(lf.x + 0.5 * (h2 - 0.5), (lf.y + 0.4 * (h3 - 0.5)) * (0.6 + 0.8 * h2));
    c = mix(c, dabc, smoothstep(0.5, 0.25, length(lr) * (1.0 + 0.8 * h3)) * (0.8 + 0.2 * edge));
    c = mix(c, ${glsl('#7d1a12')}, (part > 0.5 ? 0.25 : 0.5) * edge * step(0.4, fract(wp.y * 40.0)));
    c *= 0.36 + 0.84 * smoothstep(0.1, 0.85, tone);
    if (uv.y > 0.94) { if (fract(uv.x * 46.0 + 0.3 * wN(vec2(uv.x * 34.0, 1.0), 99.0)) > 0.42) discard; c = ${glsl('#e9dfc8')} * (0.45 + 0.6 * tone); }
  } else if (kind == ${K.WOOD}) {
    float grain = wN(vec2(uv.x * 14.0, uv.y * 3.0), 14.0), carve = wN(vec2(uv.x * 60.0, uv.y * 4.0), 60.0);
    float tone = clamp(0.3 + 0.75 * nl, 0.0, 1.0);
    c = mix(${glsl('#1c0f08')}, ${glsl('#4a2c13')}, smoothstep(0.2, 0.8, tone + 0.25 * (grain - 0.5)));
    c = mix(c, ${glsl('#8a6535')}, 0.7 * smoothstep(0.86, 0.97, N.y) * (0.5 + 0.5 * grain));                          // the light along its top
    if (part < 0.5) c = mix(c, ${glsl('#8a6230')}, 0.6 * smoothstep(0.56, 0.75, carve) * (1.0 - abs(N.y)) * smoothstep(0.3, 0.7, tone));      // its carved edge, a few touches
  } else if (kind == ${K.PAGE}) {
    float tone = clamp(0.3 + 0.75 * nl, 0.0, 1.0), soft = wN(vec2(uv.x * 20.0, uv.y * 5.0), 99.0);
    c = mix(${glsl('#7d6b4a')}, ${glsl('#cbbd9c')}, smoothstep(0.2, 0.6, tone + 0.12 * (soft - 0.5)));
    c = mix(c, ${glsl('#eee6d0')}, smoothstep(0.6, 0.9, tone));
    if (part < 0.5) {
      c *= 1.0 - 0.4 * smoothstep(0.05, 0.0, abs(uv.x - 0.5));                               // the gutter
      if (uv.x < 0.5) c *= 0.9 + 0.1 * step(0.5, fract(uv.x * 40.0));                        // (the left-hand leaves, a little fanned)
      // the print she studies, as he painted it: a few pale touches of rose, lilac and blue-grey, and no more
      vec2 p = uv; float br = 0.6 + 0.8 * wN(vec2(uv.x * 60.0, uv.y * 26.0), 99.0);
      float rose = max(dab(p, vec2(0.735, 0.56), vec2(0.045, 0.13)), 0.8 * dab(p, vec2(0.79, 0.42), vec2(0.04, 0.1)));
      float lilac = dab(p, vec2(0.7, 0.36), vec2(0.03, 0.09)), blue = max(dab(p, vec2(0.81, 0.63), vec2(0.035, 0.1)), 0.7 * dab(p, vec2(0.755, 0.3), vec2(0.035, 0.06)));
      c = mix(c, ${glsl('#d6a99b', 0)} * (0.55 + 0.5 * tone), clamp(0.8 * rose * br, 0.0, 0.75));
      c = mix(c, ${glsl('#b3a3ae', 0)} * (0.55 + 0.5 * tone), clamp(0.7 * lilac * br, 0.0, 0.65));
      c = mix(c, ${glsl('#a3acb6', 0)} * (0.55 + 0.5 * tone), clamp(0.75 * blue * br, 0.0, 0.65));
    }
  } else if (kind == ${K.EDGE}) {
    float tone = clamp(0.3 + 0.75 * nl, 0.0, 1.0), leaf = step(0.5, fract(uv.y * 7.0 + 0.6 * wN(vec2(uv.x * 9.0, 2.0), 99.0)));
    c = mix(${glsl('#6a5838')}, ${glsl('#c4b48e')}, leaf * 0.7 + 0.3) * (0.45 + 0.65 * smoothstep(0.1, 0.8, tone));
    c = mix(c, ${glsl('#24160d')}, smoothstep(0.86, 0.9, uv.y));
  } else if (kind == ${K.BOARD}) {
    c = ${glsl('#24160d')} * (0.6 + 0.6 * smoothstep(0.2, 0.9, 0.5 + 0.5 * nl));
  } else if (kind == ${K.ROSE}) {
    float sw = wN(vec2(uv.x * 10.0 + uv.y * 4.0, uv.y * 5.0), 10.0), tone = 0.5 + 0.5 * nl;
    c = mix(${glsl('#96304c', 0.04)}, ${glsl('#d9637d', 0.04)}, smoothstep(0.3, 0.6, tone + 0.3 * (sw - 0.5)));
    c = mix(c, ${glsl('#f3b0ba', 0.04)}, smoothstep(0.62, 0.85, tone + 0.3 * (sw - 0.5)));
  }
  else if (kind == ${K.STROKE}) {
    // one loaded stroke: tapered, soft at its edge, a ridge down one side; its tone is the tone of the form where it lies
    // (and a little of the luck of the brush), its white the light of a fold that has turned to the light
    float pal = floor(part + 0.001), seed = fract(part), al = uv.y, ac = uv.x - 0.5;
    float wd = 0.5 * pow(max(sin(3.1416 * al), 0.0), 0.6) * (0.86 + 0.14 * sin(al * 7.0 + seed * 40.0));
    float edge = 1.0 - abs(ac + 0.06 * sin(al * 5.0 + seed * 23.0)) / max(wd, 1.0e-3);
    if (edge < 0.0) discard;
    float jit = fract(seed * 7.31) - 0.5, jit2 = fract(seed * 3.7) - 0.5, crest = (fract(seed * 11.3) < 0.5 ? 0.3 : -0.36) * (1.0 - uSit), tone = nl + 0.16 * jit + crest + 0.22 * (1.0 - uSit) * max(dot(N, Vd), 0.0);
    if (pal < 0.5) {
      float sinTH = sqrt(max(0.0, 1.0 - sq(dot(T, Hh))));
      float spec = pow(sinTH, 14.0) * smoothstep(0.0, 0.5, dot(N, Hh)) + 0.5 * pow(max(dot(N, Hh), 0.0), 8.0);
      c = mix(${glsl('#5a452b')}, ${glsl('#907d5b')}, smoothstep(-0.6, -0.2, tone));
      c = mix(c, ${glsl('#b9b19a', 0.05)}, smoothstep(-0.2, 0.2, tone));
      c = mix(c, ${glsl('#ded4ba')}, smoothstep(0.45, 0.95, tone));
      c = mix(c, ${glsl('#a3aba6', 0.03)}, 0.3 * smoothstep(0.0, -0.5, tone) * clamp(0.35 + 0.65 * N.x, 0.0, 1.0));
      c = mix(c, ${glsl('#fdf9ea', 0.02)}, smoothstep(0.52, 0.7, spec + 0.85 * wave * (1.0 + 2.0 * max(crest, 0.0)) + 0.45 * jit2 + 0.5 * crest));
    } else if (pal < 1.5) {
      c = mix(${glsl('#5a3c14')}, ${glsl('#a98038')}, smoothstep(-0.4, 0.1, tone));
      c = mix(c, ${glsl('#dcbd76')}, smoothstep(0.15, 0.6, tone));
      c = mix(c, ${glsl('#f6e9bd', 0.03)}, smoothstep(0.75, 0.95, tone + 0.4 * jit2));
    } else if (pal < 2.5) {
      c = mix(${glsl('#1e120b')}, ${glsl('#5c3d27')}, smoothstep(0.0, 0.7, tone + 0.5 * jit2));
    } else {
      c = mix(${glsl('#8d7a5c')}, ${glsl('#f1ead8', 0.02)}, smoothstep(-0.2, 0.5, tone));
    }
    c *= 1.0 + 0.04 * smoothstep(0.05, 0.3, ac);
    if (pal < 0.5) c = mix(${glsl('#c4baa0')}, c, smoothstep(0.0, 0.22, edge));      // (its edge feathered into the cloth's own middle tone)
  }
  c *= mix(vec3(1.0), vec3(1.06, 1.0, 0.9), uWarm);
  c *= 1.0 - 0.34 * uDim * (1.0 - clamp(wave * 1.4, 0.0, 1.0) * (kind == ${K.SATIN} || kind == ${K.STROKE} ? 1.0 : 0.0));
  outgoingLight = c * key;
}
#include <opaque_fragment>`);
    };
    tm.customProgramCacheKey = () => 'lawrence-wolff-things';
    this.things = new THREE.Mesh(geo, tm); this.things.name = 'isabella-wolff-desk-stool';
    this.things.matrixAutoUpdate = false; this.things.matrix.copy(this.B); this.things.matrixWorldNeedsUpdate = true;
    L.add(this.things);

    // ------------------------------------------------------------ the lamp's light on the boards, and the soft shadows
    this.light = L.glows([{ u: -0.14, out: 0.55, w: 1.9, d: 1.3, color: col('#ffc98a', 0), strength: 0.2 }, { u: -0.26, out: 0.5, w: 0.9, d: 0.7, color: col('#ffd9a0', 0), strength: 0.16 }]);
    this.light.renderOrder = 5;
    this.blobs = L.blobs(5, { fade: true });
    this.v = { a: V3(), b: V3(), c: V3(), e: V3(), t: V3() };
    this.ch = {}; this.ch2 = {}; this.hold = null;

    // ------------------------------------------------------------ the sounds: silk, mostly
    const s = this.sc = score(L);
    s.hit(T_DESK[0], { d: 1.0, vol: 0.012, lp: 260, attack: 0.3 }); s.note(T_DESK[1] - 0.06, 92, 0.22, { type: 'sine', vol: 0.03, to: 60, attack: 0.01 });      // the table comes out and stops
    for (let k = 1, last = 0; k < 14; k++) {                                              // a whisper of silk to each step
      const want = k * STEP / this.len; if (want > 0.98) break;
      let t = last; while (t < 1 && walkE(t) < want) t += 0.004; last = t;
      s.hit(lerp(T_WALK[0], T_WALK[1], t), { d: 0.26, vol: 0.012, bp: 5200 + 500 * (k % 2), q: 0.7, attack: 0.07 });
    }
    s.hit(T_TURN[0] + 0.25, { d: 0.8, vol: 0.014, bp: 4800, q: 0.6, attack: 0.3 });                                                                            // the gown comes round after her
    s.hit(T_SIT[0] + 0.15, { d: 0.9, vol: 0.017, bp: 4500, q: 0.6, attack: 0.3 }); s.hit(T_SIT[1] - 0.12, { d: 0.12, vol: 0.012, lp: 240 });                  // she sits: the skirt, then the seat
    s.hit(T_POSE[0] + 0.2, { d: 0.9, vol: 0.012, bp: 5000, q: 0.6, attack: 0.3 });                                                                             // a sleeve, as she leans to the print
    // and as the skirt settles, one long soft sound, while the light runs down the gown: a note, its fifth, and the third over them
    s.note(T_WAVE[0], 293.66, 3.6, { type: 'sine', vol: 0.028, attack: 0.6 }); s.note(T_WAVE[0] + 0.15, 440, 3.2, { type: 'sine', vol: 0.014, attack: 0.8 }); s.note(T_WAVE[0] + 0.35, 739.99, 2.6, { type: 'sine', vol: 0.006, attack: 1.0 });
    s.done();
    this.hide();
  },

  hide() { this.things.visible = false; this.light.visible = false; this.blobs.count = 0; this.blobs.visible = false; },

  // ---------------------------------------------------------------- what she is doing at show-time t (or, going home, r of the way back)
  chan(t, r, calm, o) {
    const V = this.v;
    if (r == null) {
      o.desk = ease.out(ramp(t, T_DESK[0], T_DESK[1])); o.chair = ease.out(ramp(t, T_DESK[0] + 0.25, T_DESK[1] + 0.2));
      const q = ramp(t, T_WALK[0], T_WALK[1]), s = walkE(q); o.going = goingOf(q); o.dist = s * this.len;
      this.road.getPointAt(s, V.e); o.px = V.e.x; o.pz = V.e.z;
      this.road.getPointAt(Math.min(1, s + 0.004), V.e); this.road.getPointAt(Math.max(0, s - 0.004), V.c);
      o.yaw = turnTo(Math.atan2(V.e.x - V.c.x, V.e.z - V.c.z), YSEAT, ease.inOut(ramp(t, T_TURN[0], T_TURN[1])));
      o.sitLin = ramp(t, T_SIT[0], T_SIT[1]); o.sit = ease.inOut(o.sitLin);
      o.study = ease.inOut(ramp(t, T_STUDY[0], T_STUDY[1])); o.pose = ease.inOut(ramp(t, T_POSE[0], calm ? T_POSE[1] + 0.5 : T_POSE[1]));
      o.after = Math.max(0, t - T_SIT[1]);
    } else {
      const h = this.hold, q = ramp(r, 0.3, 0.92), s = walkE(q), w = 1 - s;
      o.pose = h.pose * (1 - ease.inOut(ramp(r, 0, 0.16))); o.study = h.study * (1 - ease.inOut(ramp(r, 0.02, 0.2)));
      o.sitLin = h.sit > 0 ? 1 - ramp(r, 0.07, 0.3) : 0; o.sit = h.sit * (1 - ease.inOut(ramp(r, 0.07, 0.3)));
      o.going = goingOf(q); o.dist = h.dist + s * h.len;
      o.px = w * w * h.px + 2 * w * s * h.vx + s * s * h.tx; o.pz = w * w * h.pz + 2 * w * s * h.vz + s * s * h.tz;
      o.yaw = turnTo(h.yaw, Math.atan2((h.vx - h.px) * w + (h.tx - h.vx) * s, (h.vz - h.pz) * w + (h.tz - h.vz) * s), ease.inOut(ramp(r, 0.18, 0.4)));
      o.desk = h.desk * (1 - ease.inOut(ramp(r, 0.42, 0.95))); o.chair = h.chair * (1 - ease.inOut(ramp(r, 0.34, 0.85))); o.after = 9;
    }
    return o;
  },

  // ---------------------------------------------------------------- her bones, from that (c: now; c2: a beat ago, for what trails)
  solve(c, c2, t, calm) {
    const b = this.b, V = this.v, up = V.t.set(0, 1, 0);
    const phi = c.dist / STEP * PI, q = c.sit;
    const settle = calm ? 0 : Math.exp(-5 * c.after) * Math.sin(11 * c.after) * (c.after > 0 && c.after < 2 ? 1 : 0) * q;
    const bil = Math.sin(PI * c.sitLin) * (c.sitLin < 1 ? 1 : 0) + 0.35 * settle;
    const breath = Math.sin(t * 1.7), sigh = c.pose * hump((t - T_POSE[1] - 0.6) % 5.4, 2.6, 4.4);
    b.breath = breath;
    b.P.set(lerp(c.px, SEAT[0], q) + 0.005 * Math.sin(phi) * c.going * Math.cos(c.yaw), lerp(PEL_STAND, PEL_SIT, q) - 0.006 * c.going * (1 - Math.abs(Math.cos(phi))) - 0.004 * settle, lerp(c.pz, SEAT[1], q) - 0.005 * Math.sin(phi) * c.going * Math.sin(c.yaw));
    // what trails: the lower gown is where she was a beat ago, and faces the way she faced then
    const lag = b.lag.set((c.px - c2.px) * (1 - q), 0, (c.pz - c2.pz) * (1 - q));
    // which way her lap, her shoulders and her face are turned (0: out at you; less: to your left)
    const yawP = c.yaw - 0.12 * c.study + 0.05 * c.pose;
    const yawT = c.yaw + 0.15 * q - 0.32 * c.study * (1 - c.pose) + 0.14 * c.pose + 0.05 * Math.sin(phi) * c.going;
    const drift = c.study * 0.1 * Math.sin((t - T_STUDY[0]) * 1.3);      // her eyes go over the print
    const yawH = c.yaw - 0.15 * q + (-0.75 + drift) * c.study * (1 - c.pose) + (-0.92 + 0.5 * drift) * c.pose;
    const pitH = 0.3 + 0.1 * bil + 0.36 * c.study * (1 - c.pose) + 0.27 * c.pose - 0.03 * sigh;
    const rolH = 0.24 * c.pose - 0.04 * sigh;
    const lean = 0.03 + 0.34 * bil + 0.05 * q + 0.26 * c.study * (1 - c.pose) + 0.15 * c.pose;
    const side = 0.13 * c.study * (1 - c.pose) + 0.34 * c.pose - 0.02 * sigh + 0.03 * Math.sin(phi) * c.going;
    b.fP.set(Math.sin(yawP), 0, Math.cos(yawP)); b.lP.set(Math.cos(yawP), 0, -Math.sin(yawP));
    b.fT.set(Math.sin(yawT), 0, Math.cos(yawT)); b.lT.set(Math.cos(yawT), 0, -Math.sin(yawT));
    b.d.set(0, 1, 0).addScaledVector(b.fT, Math.tan(lean)).addScaledVector(b.lT, -Math.tan(side)).normalize();
    b.lT.addScaledVector(b.d, -b.lT.dot(b.d)).normalize(); b.fT.crossVectors(b.lT, b.d);
    const grow = 1 + 0.006 * breath;
    b.Bu.copy(b.P).addScaledVector(b.d, BUST); b.Cs.copy(b.P).addScaledVector(b.d, TORSO * grow);
    b.Sh[0].copy(b.Cs).addScaledVector(b.lT, SH_W).addScaledVector(b.d, -0.021); b.Sh[1].copy(b.Cs).addScaledVector(b.lT, -SH_W).addScaledVector(b.d, -0.021 + 0.01 * c.pose);
    b.Nb.copy(b.Cs).addScaledVector(b.d, 0.006).addScaledVector(b.fT, 0.004);
    // her head
    const cp = Math.cos(pitH), sp = Math.sin(pitH);
    b.fH.set(Math.sin(yawH) * cp, -sp, Math.cos(yawH) * cp); b.lH.set(Math.cos(yawH), 0, -Math.sin(yawH)); b.uH.crossVectors(b.fH, b.lH);
    V.a.copy(b.uH).multiplyScalar(Math.cos(rolH)).addScaledVector(b.lH, -Math.sin(rolH)); b.lH.multiplyScalar(Math.cos(rolH)).addScaledVector(b.uH, Math.sin(rolH)); b.uH.copy(V.a);
    b.Hc.copy(b.Nb).addScaledVector(b.d, NECK).addScaledVector(b.uH, 0.031).addScaledVector(b.fH, 0.007);
    b.Hb.copy(b.Hc).addScaledVector(b.uH, 0.039).addScaledVector(b.fH, 0.022).addScaledVector(b.lH, -0.013);
    // her arms: where the elbow and the hand are wanted, for each thing she does; mixed, then made her own length
    const wPose = c.pose, wLap = q * (1 - c.pose), wWalk = Math.max(0, 1 - wPose - wLap);
    for (let i = 0; i < 2; i++) {
      const sg = i === 0 ? 1 : -1, S = b.Sh[i], E = b.E[i].set(0, 0, 0), W = b.W[i].set(0, 0, 0), sw = 0.02 * Math.sin(phi) * c.going * -sg;
      // walking: her hands together before her
      V.a.copy(S).addScaledVector(b.d, -0.092).addScaledVector(b.lT, sg * 0.024).addScaledVector(b.fT, -0.016 + sw * 0.5);
      V.b.copy(b.P).addScaledVector(b.fT, 0.056 + sw * 0.4).addScaledVector(b.lT, sg * 0.012).addScaledVector(up, 0.03 + 0.004 * sg);
      E.addScaledVector(V.a, wWalk); W.addScaledVector(V.b, wWalk);
      // in her lap
      V.a.copy(S).addScaledVector(b.d, -0.085).addScaledVector(b.lT, sg * 0.022);
      V.b.copy(b.P).addScaledVector(b.fP, 0.082).addScaledVector(b.lP, sg * 0.024).addScaledVector(up, 0.047);
      E.addScaledVector(V.a, wLap); W.addScaledVector(V.b, wLap);
      if (i === 1) {
        // her right: the elbow on the cushion, the hand at her brow
        V.a.set(ELBOW[0], ELBOW[1], ELBOW[2]); E.addScaledVector(V.a, wPose); W.addScaledVector(b.Hb, wPose);
      } else {
        // her left: let fall at her side
        V.a.copy(S).addScaledVector(b.d, -0.09).addScaledVector(b.lT, 0.024).addScaledVector(b.fT, -0.004);
        V.b.copy(b.P).addScaledVector(b.lP, 0.082).addScaledVector(b.fP, 0.062).addScaledVector(up, -0.03);
        E.addScaledVector(V.a, wPose); W.addScaledVector(V.b, wPose);
      }
      E.sub(S).setLength(UPPER).add(S); W.sub(E).setLength(FORE).add(E);
      b.hd[i].copy(W).sub(E).normalize(); if (i === 1) b.hd[i].lerp(V.a.copy(b.Hb).sub(W).addScaledVector(b.uH, 0.01).normalize(), 0.7 * wPose).normalize();
      else b.hd[i].lerp(V.a.set(0, -1, 0).addScaledVector(b.fP, 0.5).normalize(), 0.5 * (wPose + wWalk)).normalize();
      b.Ec[i].copy(E).multiplyScalar(2).addScaledVector(S, -0.5).addScaledVector(W, -0.5);
    }
    // ---- the gown: from under the bust to the floor, standing; over her lap and down, sitting
    const sk = b.sk, full = 1 + 0.2 * bil, sway = 0.012 * Math.sin(phi - 0.9) * c.going * (1 - q);
    sk[0].c.copy(b.Bu); sk[0].f.copy(b.fT); sk[0].s.copy(b.lT); sk[0].rf = 0.034; sk[0].rb = 0.032; sk[0].rs = 0.044;
    for (let i = 1; i < 5; i++) {
      const r = sk[i], a = ST[i - 1], s = SI[i - 1], yst = i === 1 ? b.P.y : a[0], ysi = i === 1 ? b.P.y + 0.012 : s[0], k = i >= 3 ? full : 1;
      const yw = turnTo(yawP, c2.yaw, a[4] * (1 - q)), fx = Math.sin(yw), fz = Math.cos(yw);
      r.f.set(fx, 0, fz); r.s.set(fz, 0, -fx);
      r.c.set(lerp(b.P.x - lag.x * a[4] * 0.4 + fz * sway * a[4], b.P.x + fx * s[4], q), lerp(yst, ysi, q), lerp(b.P.z - lag.z * a[4] * 0.4 - fx * sway * a[4], b.P.z + fz * s[4], q));
      if (i === 4) { r.c.x += -0.03 * q; r.c.z += 0.02 * q; }
      r.rf = lerp(a[1], s[1], q) * k; r.rb = lerp(a[2] * (1 + 0.5 * c.going * a[4]), s[2], q) * k; r.rs = lerp(a[3], s[3], q) * k; r.tf = s[5] * q; r.tb = s[6] * q; r.ts = i === 2 ? 0.03 * q : 0;
    }
    b.lap = q; b.knee = 0.024 * c.going * Math.abs(Math.sin(phi)) * (1 - q); b.kneeS = Math.sin(phi) >= 0 ? 1 : -1;
    b.rip = lerp(0.16, 0.2, q) * (1 + 0.5 * bil); b.ph = 1.3 * Math.sin(phi - 0.6) * c.going + 1.6 * q + 0.5 * settle + 0.5 * c.pose;
    // ---- the bodice, and her neck and shoulders
    const bo = b.bo;
    for (let i = 0; i < 4; i++) { const r = bo[i], a = BO[i]; r.c.copy(b.P).addScaledVector(b.d, a[0] * (i ? grow : 1)); r.f.copy(b.fT); r.s.copy(b.lT); r.rf = a[1] * (i === 1 ? 1 + 0.025 * breath : 1); r.rb = a[2]; r.rs = a[3]; }
    const nk = b.nk;
    V.a.copy(b.Cs).addScaledVector(b.d, -0.016); V.b.copy(b.Hc).addScaledVector(b.uH, -0.026).addScaledVector(b.fH, -0.006);
    for (let i = 0; i < 4; i++) { const r = nk[i], a = NK[i]; r.c.lerpVectors(V.a, V.b, a[0]); r.f.copy(b.fT); r.s.copy(b.lT); r.rf = r.rb = a[1]; r.rs = a[2]; }
  },

  // ---------------------------------------------------------------- his strokes, laid on the forms as they are now
  lay() {
    const sh = this.sh, pos = sh.pos, nor = sh.nor, tan = sh.tan, M = this.marks, off = this.strokes.off;
    for (let m = 0; m < M.length; m++) {
      const k = M[m], s = k.s, W = s.nu + 1, o = (off + m * 6) * 3;
      const i0 = (s.off + k.j * W + k.i) * 3;
      const i1 = k.along ? (s.off + (k.j + k.n) * W + k.i) * 3 : (s.off + k.j * W + (k.i + k.n) % s.nu) * 3;
      const i2 = k.along ? (s.off + (k.j + 2 * k.n) * W + k.i) * 3 : (s.off + k.j * W + (k.i + 2 * k.n) % s.nu) * 3;
      let ax = pos[i2] - pos[i0], ay = pos[i2 + 1] - pos[i0 + 1], az = pos[i2 + 2] - pos[i0 + 2]; const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al;
      // (the middle line of the ribbon, the way it runs, and the form's own facing, as long as the ribbon is wide: the
      // vertex shader spreads it across your line of sight)
      const f = k.flip * k.w, nx = nor[i1] * f, ny = nor[i1 + 1] * f, nz = nor[i1 + 2] * f;
      for (let r = 0; r < 3; r++) {
        const ii = r === 0 ? i0 : r === 1 ? i1 : i2;
        for (let side = 0; side < 2; side++) {
          const p = o + (r * 2 + side) * 3;
          pos[p] = pos[ii]; pos[p + 1] = pos[ii + 1]; pos[p + 2] = pos[ii + 2]; nor[p] = nx; nor[p + 1] = ny; nor[p + 2] = nz; tan[p] = ax; tan[p + 1] = ay; tan[p + 2] = az;
        }
      }
    }
  },

  // The toy is eased out of the way of anything of hers that stands where it is (never stopped: only moved aside).
  aside(L, toy, x, z, r, dt) {
    if (z < 0.06 || x > this.side - 0.1) return;
    const p = L.floor(x * SC, z * SC, this.v.a), dx = toy.pos.x - p.x, dz = toy.pos.z - p.z, d = Math.hypot(dx, dz), reach = r * SC + (toy.radius || 0.16);
    if (d >= reach) return;
    const k = Math.min(reach - d, 0.9 * dt);
    if (d > 1e-3) { toy.pos.x += dx / d * k; toy.pos.z += dz / d * k; } else { toy.pos.x += L.nx * k; toy.pos.z += L.nz * k; }
  },

  start(L) { this.sc.from(0); this.hold = null; },
  back(L) {
    const c = this.chan(L.t, null, L.calm, {}), far = c.px < 0.25;
    c.tx = HOME[0]; c.tz = HOME[1]; c.vx = far ? ROUND[0] : (c.px + HOME[0]) / 2; c.vz = far ? ROUND[1] : (c.pz + HOME[1]) / 2;
    c.len = Math.hypot(c.vx - c.px, c.vz - c.pz) + Math.hypot(c.tx - c.vx, c.tz - c.vz);
    this.hold = c;
    if (!L.quiet && c.pz > 0) this.sc.fire(L.voice(), { noise: true, d: 1.2, vol: 0.012, bp: 5000, q: 0.6, attack: 0.4 }, 0.3);
  },
  end() { this.hide(); this.hold = null; },
  reset() { this.hide(); this.hold = null; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return';
    if (!showing && !back) { this.hide(); return; }
    if (back && !this.hold) this.back(L);
    const calm = L.calm, t = L.t, u = this.u, b = this.b, V = this.v, r = back ? L.ret : null, slow = calm ? 0.5 : 1;
    if (showing) this.sc.play(t);
    const voice = L.voice(); voice.level = calm ? 0.55 : 1; voice.place();
    this.things.visible = true; this.light.visible = true; this.blobs.visible = true;

    const c = this.chan(t, r, calm, this.ch), c2 = this.chan(t - LAG, r == null ? null : Math.max(0, r - LAG / L.retDur), calm, this.ch2);
    // the light on the gown. Walking, a glint runs down the folds at each step; when she sits and the skirt pools, the
    // long one, from her shoulder to the hem, the room dipping a little round her while it runs; and now and then again, less
    let wv = 0, wy = 0, dim = 0;
    if (r == null) {
      const d = (T_WAVE[1] - T_WAVE[0]) / slow, q0 = (t - T_WAVE[0]) / d, fr = c.dist / STEP;
      if (c.going > 0 && !calm) { const f = fr - Math.floor(fr); wv = 0.8 * c.going * Math.sin(PI * f); wy = lerp(0.38, 0.0, f); }
      else if (q0 > 0 && q0 < 1) { wv = Math.pow(Math.sin(PI * q0), 0.7) * (calm ? 0.7 : 1.3); wy = lerp(0.5, -0.03, ease.smooth(q0)); dim = Math.sin(PI * Math.min(1, q0 * 1.15)) * (calm ? 0.6 : 1); }
      else if (t > T_WAVE[0] + d + 1.6) { const per = calm ? 6.5 : 4.3, q1 = ((t - T_WAVE[0] - d - 1.6) % per) / (d * 1.1); if (q1 < 1) { wv = 0.4 * Math.sin(PI * q1) * (calm ? 0.6 : 1); wy = lerp(0.47, -0.02, q1); } }
    }
    b.wave = wv; b.waveY = wy; u.uWave.value.set(wy, wv); u.uDim.value = dim;
    this.solve(c, c2, t, calm);
    const sh = this.sh; for (const k in this.her) sh.fill(this.her[k][0], this.her[k][1]);
    this.lay(); sh.changed();

    // the table and the chair come out of the wall and stop, and the cushion gives
    const dz = -(TBL.z + TBL.hd + 0.12) * (1 - c.desk), ta = t - T_DESK[1], sx = SEAT[0], sz = lerp(-0.32, SEAT[1], c.chair);
    u.uDesk.value.set(0, 0, dz); u.uStool.value.set(sx, 0, sz);
    u.uSq.value = r == null && ta > 0 && ta < 1.2 && !calm ? 1 - 0.07 * Math.exp(-5 * ta) * Math.cos(15 * ta) : 1;
    u.uWarm.value = c.desk; u.uSit.value = c.sit;
    // the lamp's light, and the shadows (the largest of them is the room's light dipping round her)
    const lit = c.desk * (r == null ? 1 : 1 - ease.smooth(ramp(r, 0.7, 1)));
    this.light.set(0, lit * (1 - 0.55 * dim) * (calm ? 1 : 1 + 0.03 * Math.sin(t * 2.3) * Math.sin(t * 0.7))); this.light.set(1, lit * (0.6 + 1.3 * wv * c.sit));
    const bl = this.blobs, hem = b.sk[4].c;
    let n = 0;
    L.floor(hem.x * SC, hem.z * SC, V.a); bl.set(n++, V.a.x, V.a.z, 1.15, 0.45 * dim);
    L.floor(TBL.x * SC, (TBL.z + dz) * SC, V.a); bl.set(n++, V.a.x, V.a.z, 0.2 * SC, 0.5 * inRoom(TBL.z + dz));
    L.floor(sx * SC, sz * SC, V.a); bl.set(n++, V.a.x, V.a.z, 0.11 * SC, 0.6 * inRoom(sz));
    L.floor(hem.x * SC, hem.z * SC, V.a); bl.set(n++, V.a.x, V.a.z, lerp(0.14, 0.2, c.sit) * SC, 0.62 * inRoom(hem.z) * inRoom(this.side - hem.x));
    L.floor(b.P.x * SC, b.P.z * SC, V.a); bl.set(n++, V.a.x, V.a.z, 0.09 * SC, 0.4 * inRoom(b.P.z) * inRoom(this.side - b.P.x));
    bl.count = n;
    // she, her table and her chair are soft to the toy: it is moved aside, gently, and never held
    const toy = L.k.G.vehicle;
    if (toy && dt > 0 && !L.quiet && toy.group && toy.group.visible && Math.abs(toy.pos.y - L.y) < 0.5) {
      this.aside(L, toy, hem.x, hem.z, lerp(0.1, 0.16, c.sit), dt); this.aside(L, toy, b.P.x, b.P.z, 0.09, dt);
      this.aside(L, toy, TBL.x, TBL.z + dz, 0.17, dt); this.aside(L, toy, sx, sz, 0.1, dt);
    }
    if (back && L.ret >= 1) this.hide();
  },
});
