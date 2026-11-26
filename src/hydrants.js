// Fire hydrants that break. A bump leaves one standing, as it always did. Hit hard enough (BREAK, into it) the body
// shears off its base and is knocked down the pavement, and the main under it lets go: a jet as high as a lamp post, the
// spray falling round it. It is a January night in Chicago, so the water does not stay water. The pavement glazes over, ice
// builds up the jet from its foot and chokes it, the last of the spray sets in the air as it falls, and what is left when the
// water gives out is a frozen fountain over the stub, hung with icicles, on a sheet of ice a car slides on. It stands there for
// the rest of the night (and through Continue); a new game puts the hydrants back.
//
// What it costs. Unbroken, nothing: the hydrants are still boxes in the street's two merged meshes (streets.js), and this file
// only looks at them on a frame the toy has hit something hard. Breaking one folds its boxes away in that mesh (the stub is
// what is left of the same box) and borrows one of RIGS sets of moving parts for the eleven seconds the water runs: the jet and
// the falling veil are two small meshes with a picture of streaks run through them, the drops and the mist two little point
// clouds, and the ice is one mesh of a few hundred corners grown on the processor. After that a broken hydrant is three still
// meshes (the ice, the sheet on the ground, the body where it fell) and nothing a frame. No lights; nothing is allocated while it runs.

import * as THREE from 'three';
import { feature, tonight } from './features.js';
import { confine, groundAt } from './plan.js';
import { Geo } from './geo.js';
import { LOWMEM } from './budget.js';

// How hard: the speed INTO the hydrant, not along it (v.bump, the same number the thud is played from). The red car as it
// comes (the gentle one) tops out at 7.2 m/s and gets to 5.3 in three metres and 6.4 in six; the others reach 9.3. So this
// is a proper run at it: three-quarters of the gentle car's best, square on (or flat out within forty degrees of square),
// which wants about four metres of clear pavement. Nosing into one while turning round, or clipping it in passing, is the
// bump it always was.
export const BREAK = 5.5;
const STUB = 0.12;                      // what is left bolted to the pavement
const JET = 4.6;                        // how high the water goes, metres
const BLAST = 3, FREEZE = 7.5;          // seconds of open water, then of freezing
const SHEET = 2.3;                      // the ice on the ground, radius
const COL = 0.32;                       // half the width of what is solid of the ice
const SLICK = SHEET * 0.6;              // the square of it a car slides on (plan.ice)
const RIGS = LOWMEM ? 1 : 2;            // how many can be running at once; one more, and the oldest sets at once
const KINDS = LOWMEM ? 2 : 3;           // shapes of frozen fountain
const GLOW = 0.55;                      // the light the ice on the ground holds, as the snow does (streets.js)
const WIND = [0.8, 0.6];                // which way the spray is carried, a little

const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const ss = x => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ---------------------------------------------------------------- pictures
// Water going past: streaks down a strip, on next to nothing. It is run up the jet and down the veil.
function streakTex() {
  const W = 128, H = 256, cv = canvas(W, H), c = cv.getContext('2d'), r = rng(77);
  c.fillStyle = 'rgba(214,232,255,0.16)'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    const x = r() * W, y = r() * H, len = 30 + r() * 150, w = 1 + r() * r() * 7, a = 0.12 + r() * 0.6, white = r() < 0.35;
    for (const oy of [-H, 0, H]) for (const ox of [-W, 0, W]) {
      const g = c.createLinearGradient(0, y + oy, 0, y + oy + len), col = white ? '255,255,255' : '196,222,255';
      g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.3, `rgba(${col},${a})`); g.addColorStop(0.75, `rgba(${col},${a * 0.8})`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.fillRect(x + ox - w / 2, y + oy, w, len);
    }
  }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
// The ice where the spray came down, as it ends up: milky where it built up, thinner and glassy in pools where the pavement
// shows dark through it, combed with frost, its edge not a circle, and the drops that carried further. (While it is still
// water the same picture is drawn dark: _run.)
function sheetTex() {
  const S = LOWMEM ? 128 : 256, cv = canvas(S, S), c = cv.getContext('2d'), r = rng(1905), m = S / 2, R = S * 0.5, ICE = '192,210,232', WHITE = '238,244,252', GLASS = '84,104,132';
  const blob = (x, y, rad, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.7, `rgba(${col},${a * 0.85})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill(); };
  blob(m, m, R * 0.68, ICE, 0.74);
  for (let i = 0; i < 26; i++) { const a = r() * 6.283, d = R * (0.42 + r() * 0.28); blob(m + Math.cos(a) * d, m + Math.sin(a) * d, R * (0.1 + r() * 0.16), ICE, 0.66); }      // lobes
  for (let i = 0; i < 44; i++) { const a = r() * 6.283, d = R * (0.7 + r() * 0.27); blob(m + Math.cos(a) * d, m + Math.sin(a) * d, R * (0.012 + r() * 0.03), WHITE, 0.8); }   // what carried
  for (let i = 0; i < 8; i++) { const a = r() * 6.283, d = R * (0.3 + r() * 0.36), x = m + Math.cos(a) * d, y = m + Math.sin(a) * d; for (let j = 0; j < 3; j++) blob(x + (r() - 0.5) * R * 0.12, y + (r() - 0.5) * R * 0.12, R * (0.04 + r() * 0.06), GLASS, 0.3); }      // pools
  c.lineCap = 'round';
  for (let i = 0; i < 70; i++) {                                                                                       // frost, combed out from the middle
    const a = r() * 6.283, d0 = R * (0.1 + r() * 0.4), d1 = d0 + R * (0.08 + r() * 0.3);
    c.strokeStyle = `rgba(${WHITE},${0.14 + r() * 0.34})`; c.lineWidth = (0.6 + r() * 2) * S / 256;
    c.beginPath(); c.moveTo(m + Math.cos(a) * d0, m + Math.sin(a) * d0); c.lineTo(m + Math.cos(a + (r() - 0.5) * 0.12) * d1, m + Math.sin(a + (r() - 0.5) * 0.12) * d1); c.stroke();
  }
  blob(m, m, R * 0.34, WHITE, 0.92);
  for (let i = 0; i < 9; i++) { const a = r() * 6.283, d = R * (0.2 + r() * 0.2); blob(m + Math.cos(a) * d, m + Math.sin(a) * d, R * (0.05 + r() * 0.08), WHITE, 0.6); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// A drop, or (soft) a breath of mist: that one has no middle to speak of, or the last puff to drift off alone is a disc in the sky.
function dotTex(soft) {
  const cv = canvas(32, 32), c = cv.getContext('2d'), g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
  if (soft) { g.addColorStop(0, 'rgba(255,255,255,0.62)'); g.addColorStop(0.3, 'rgba(255,255,255,0.4)'); g.addColorStop(0.65, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); }
  else { g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); }
  c.fillStyle = g; c.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(cv);
}

// ---------------------------------------------------------------- shapes
const built = (P, C, I, U, csize = 3) => {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, csize));
  if (U) g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); return g;
};
// A sheet of revolution, ring over ring: xyz(j, k) -> [x, y, z, alpha], u running `turns` times round and v along it.
function lathe(P, C, U, I, rings, n, turns, u0, v1, at) {
  const base = P.length / 3;
  for (let j = 0; j <= rings; j++) for (let k = 0; k <= n; k++) { const q = at(j / rings, k / n * 6.2832); P.push(q[0], q[1], q[2]); C.push(1, 1, 1, q[3]); U.push(u0 + k / n * turns, j / rings * v1); }
  for (let j = 0; j < rings; j++) for (let k = 0; k < n; k++) { const a = base + j * (n + 1) + k, b = a + 1, c = a + n + 1, d = c + 1; I.push(a, c, b, b, c, d); }
}
// The jet, one metre high (it is stretched to the height it has): the water you see, opening out as it climbs, and the
// solid of it up the middle.
function jetGeo() {
  const P = [], C = [], U = [], I = [], n = LOWMEM ? 8 : 12;
  const shell = (r0, r1, u0, al) => lathe(P, C, U, I, 6, n, 2, u0, 3, (v, th) => { const rad = r0 + (r1 - r0) * Math.pow(v, 0.7); return [Math.cos(th) * rad, v, Math.sin(th) * rad, al * (v > 0.8 ? 1 - (v - 0.8) * 2.5 : 1)]; });
  shell(0.075, 0.21, 0, 0.85); shell(0.05, 0.11, 0.37, 1);
  return built(P, C, I, U, 4);
}
// What comes back down: thrown out of the top, over, and falling away as it spreads, thinning to nothing (the drops go on
// from there). Twice, one inside the other, and carried a little down the wind. Its top is at the origin.
function veilGeo() {
  const P = [], C = [], U = [], I = [], n = LOWMEM ? 12 : 18;
  const fall = (R, drop, u0, al) => lathe(P, C, U, I, 8, n, 3, u0, 1.3, (s, th) => {
    const rad = 0.1 + R * s * (1 + (0.2 * Math.sin(th * 3 + R * 5) + 0.1 * Math.sin(th * 7 + R * 3)) * s), a = al * (s < 0.1 ? 0.5 + s * 5 : 1 - ss((s - 0.3) / 0.7));
    return [Math.cos(th) * rad + WIND[0] * 0.3 * s * s, 1.5 * s - (1.5 + drop) * s * s, Math.sin(th) * rad + WIND[1] * 0.3 * s * s, a];
  });
  fall(1.45, 2.5, 0, 0.9); fall(0.8, 2.1, 0.5, 0.8);
  return built(P, C, I, U, 4);
}
// The body knocked off: the hydrant as streets.js draws it, less the stub, about its own middle.
const MID = (STUB + 0.75) / 2;
function bodyGeo() {
  const g = new Geo(), y = -MID;
  g.box(-0.11, 0.11, y + STUB, y + 0.55, -0.11, 0.11); g.box(-0.15, 0.15, y + 0.55, y + 0.62, -0.15, 0.15); g.box(-0.07, 0.07, y + 0.62, y + 0.72, -0.07, 0.07); g.box(-0.2, 0.2, y + 0.32, y + 0.44, -0.06, 0.06);
  return g.build();
}

// A frozen fountain. Every corner has where it ends up (P), where it grows from (O) and when, as a part of the freeze (W):
// the foot spreads first, the column climbs out of it, the spray that was in the air sets as arcs thrown from the top, a
// last spurt sets as the spire, and the icicles run down from whatever overhangs. Faceted, as ice is and as this world is.
const FROST = [0.9, 0.95, 1], DEEP = [0.36, 0.58, 0.93], PALE = [0.72, 0.87, 1], TIP = [0.96, 0.99, 1];
function fountain(seed) {
  const r = rng(seed), P = [], O = [], W = [], C = [], I = [], lite = LOWMEM;
  const put = (x, y, z, ox, oy, oz, a, b, c) => { P.push(x, y, z); O.push(ox, oy, oz); W.push(a, b); C.push(c[0], c[1], c[2]); return P.length / 3 - 1; };
  const band = (lo, hi, n) => { for (let k = 0; k < n; k++) { const a = lo + k, b = lo + (k + 1) % n, c = hi + k, d = hi + (k + 1) % n; I.push(a, c, b, b, c, d); } };
  // a strand of ice along a line of points, thinning, grown out of `from`; `ax` is any direction it never runs along
  const strand = (pts, r0, r1, from, a, b, c0, c1, ax, sides = 3) => {
    let prev = -1, tx = 0, ty = 1, tz = 0; const last = pts.length - 1;
    for (let j = 0; j <= last; j++) {
      const p = pts[j], q = pts[Math.min(j + 1, last)], o = pts[Math.max(j - 1, 0)], u = j / last;
      tx = q[0] - o[0]; ty = q[1] - o[1]; tz = q[2] - o[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let nx = ty * ax[2] - tz * ax[1], ny = tz * ax[0] - tx * ax[2], nz = tx * ax[1] - ty * ax[0]; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx, rad = r0 + (r1 - r0) * u, i0 = P.length / 3, col = mix(c0, c1, u);
      for (let k = 0; k < sides; k++) { const th = k / sides * 6.2832 + j * 0.5, cs = Math.cos(th) * rad, sn = Math.sin(th) * rad; put(p[0] + nx * cs + bx * sn, p[1] + ny * cs + by * sn, p[2] + nz * cs + bz * sn, from[0], from[1], from[2], a + (b - a) * 0.35 * u, b, col); }
      if (prev >= 0) band(prev, i0, sides); prev = i0;
    }
    const e = pts[last], tip = put(e[0] + tx * r1 * 3, e[1] + ty * r1 * 3, e[2] + tz * r1 * 3, from[0], from[1], from[2], a + (b - a) * 0.35, b, c1);
    for (let k = 0; k < sides; k++) I.push(prev + k, tip, prev + (k + 1) % sides);
  };
  const icicle = (x, y, z, len, rad, a, b) => {
    const i0 = P.length / 3, n = 4, t0 = r() * 6.28;
    for (let k = 0; k < n; k++) { const th = t0 + k / n * 6.2832; put(x + Math.cos(th) * rad, y + 0.02, z + Math.sin(th) * rad, x, y, z, a, a + (b - a) * 0.4, PALE); }
    const tip = put(x + (r() - 0.5) * 0.05, y - len, z + (r() - 0.5) * 0.05, x, y, z, a, b, TIP);
    for (let k = 0; k < n; k++) I.push(tip, i0 + k, i0 + (k + 1) % n);
  };

  // the body of it: ice built up off the pavement in a knobbly cone, the way dripping water builds, and wider where the
  // falling water kept landing (two collars, hung with icicles). One skin, ring over ring.
  const n = lite ? 8 : 10, m = lite ? 7 : 10, H = 2.05 + r() * 0.35, lean = [WIND[0] * (0.1 + r() * 0.14), WIND[1] * (0.1 + r() * 0.14)], t1 = Math.round(m * 0.32), t2 = Math.round(m * 0.62);
  const lobe = []; for (let k = 0; k < n; k++) lobe.push(0.72 + r() * 0.6);
  let prev = -1; const lips = [];
  for (let j = -1; j <= m; j++) {
    const foot = j < 0, low = j <= 0, u = foot ? 0 : j / m, tier = j === t1 || j === t2, i0 = P.length / 3;
    const y = foot ? -0.03 : 0.07 + (H - 0.07) * Math.pow(u, 0.92) - (tier ? 0.05 : 0), rad = foot ? 0.74 : 0.085 + 0.42 * Math.pow(1 - u, 1.55), cx = lean[0] * u * u, cz = lean[1] * u * u;
    const col = foot || tier ? FROST : mix(mix(FROST, DEEP, Math.min(1, u * 2.4 + 0.45)), PALE, ss((u - 0.5) / 0.5));
    for (let k = 0; k < n; k++) {
      const out = tier ? Math.max(0, lobe[(k + j) % n] - 0.9) * 1.5 + (r() < 0.3 ? 0.25 : 0) : 0, th = k / n * 6.2832 + j * 0.31;
      const rr = rad * ((foot ? lobe[k] : 1 + (lobe[k] - 1) * 0.35 * (1 - u)) + (r() - 0.5) * 0.22 + out), x = cx + Math.cos(th) * rr, z = cz + Math.sin(th) * rr, yy = y + (foot ? 0 : (r() - 0.5) * 0.07);
      put(x, yy, z, x * (low ? 0.3 : 0.4), low ? 0 : 0.12, z * (low ? 0.3 : 0.4), low ? 0 : 0.06, low ? 0.3 : 0.36 + 0.24 * u, mix(col, FROST, r() * 0.3));
      if (out > 0.22) lips.push([cx + (x - cx) * 0.95, yy, cz + (z - cz) * 0.95]);
    }
    if (prev >= 0) band(prev, i0, n); prev = i0;
  }
  const top = [lean[0], H, lean[1]], capW = [0.12, H + 0.07, 0.06, 0.6], cap = put(top[0], capW[1], top[2], top[0] * 0.4, capW[0], top[2] * 0.4, capW[2], capW[3], PALE);
  for (let k = 0; k < n; k++) I.push(prev + k, cap, prev + (k + 1) % n);
  for (const q of lips) icicle(q[0], q[1], q[2], 0.16 + r() * 0.34, 0.036, 0.72, 0.96);

  // the spray, set in the air: each arc is the path a spurt was on (thrown up and out, and falling), further down the wind
  const arcs = lite ? 5 : 8, seg = lite ? 4 : 6;
  for (let i = 0; i < arcs; i++) {
    const az = (i + r() * 0.7) / arcs * 6.2832, dx = Math.cos(az), dz = Math.sin(az), lee = 1 + 0.3 * (dx * WIND[0] + dz * WIND[1]);
    const vr = (0.85 + r() * 0.85) * lee, vy = 1.3 + r() * 0.9, te = 0.4 + r() * 0.2, pts = [];
    for (let j = 0; j <= seg; j++) { const t = te * j / seg; pts.push([top[0] + dx * (0.05 + vr * t), H - 0.04 + vy * t - 4.9 * t * t, top[2] + dz * (0.05 + vr * t)]); }
    strand(pts, 0.075, 0.022, top, 0.58 + r() * 0.06, 0.86, mix(DEEP, PALE, 0.5), TIP, [-dz, 0, dx]);
    const e = pts[seg]; icicle(e[0], e[1], e[2], 0.28 + r() * 0.5, 0.04, 0.86, 1);
    if (!lite) { const q = pts[seg - 2]; icicle(q[0], q[1] - 0.02, q[2], 0.14 + r() * 0.28, 0.034, 0.87, 1); }
  }
  // the splash at the top, caught as it opened, and the last of the jet
  const crown = lite ? 4 : 6;
  for (let i = 0; i < crown; i++) {
    const az = (i + r() * 0.6) / crown * 6.2832, dx = Math.cos(az), dz = Math.sin(az), l = 0.22 + r() * 0.2;
    strand([top, [top[0] + dx * l * 0.5, H + l * 0.55, top[2] + dz * l * 0.5], [top[0] + dx * l * 1.1, H + l * 0.85, top[2] + dz * l * 1.1]], 0.05, 0.014, top, 0.6, 0.82, PALE, TIP, [-dz, 0, dx]);
  }
  const sh = 0.5 + r() * 0.3;
  strand([top, [top[0] + 0.03, H + sh * 0.5, top[2] + 0.02], [top[0] + 0.06, H + sh, top[2] - 0.01]], 0.09, 0.02, top, 0.84, 0.98, PALE, TIP, [1, 0, 0], 4);

  const geo = built(P, C, I, null); geo.computeBoundingSphere(); geo.computeBoundingBox();
  return { geo, P: new Float32Array(P), O: new Float32Array(O), W: new Float32Array(W), H, top, cap: capW, spire: H + sh };
}
// A fountain part grown: g is how far the freeze has got, 0..1.
function grow(kind, out, g) {
  const { P, O, W } = kind;
  for (let i = 0, j = 0, n = W.length; i < n; i += 2, j += 3) {
    let s = (g - W[i]) / (W[i + 1] - W[i]); s = s <= 0 ? 0 : s >= 1 ? 1 : s * s * (3 - 2 * s);
    out[j] = O[j] + (P[j] - O[j]) * s; out[j + 1] = O[j + 1] + (P[j + 1] - O[j + 1]) * s; out[j + 2] = O[j + 2] + (P[j + 2] - O[j + 2]) * s;
  }
}

// ---------------------------------------------------------------- drops, flakes, mist
// 0 a drop (it falls, and is gone where it lands); 1 a flake of ice (it hangs and drifts); 2 mist (it only fades).
class Specks {
  constructor(max, mat) {
    this.max = max; this.i = 0; this.live = 0;
    this.p = new Float32Array(max * 3).fill(-999); this.c = new Float32Array(max * 4); this.v = new Float32Array(max * 3); this.age = new Float32Array(max); this.life = new Float32Array(max); this.kind = new Uint8Array(max); this.a = new Float32Array(max);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.c, 4));
    this.pts = new THREE.Points(g, mat); this.pts.frustumCulled = false; this.pts.visible = false;
  }
  add(x, y, z, vx, vy, vz, life, kind, alpha) {
    const i = this.i = (this.i + 1) % this.max, j = i * 3, q = i * 4;
    this.p[j] = x; this.p[j + 1] = y; this.p[j + 2] = z; this.v[j] = vx; this.v[j + 1] = vy; this.v[j + 2] = vz; this.age[i] = 0; this.life[i] = life; this.kind[i] = kind; this.a[i] = alpha;
    const w = kind === 0 ? 0.82 : 1; this.c[q] = w; this.c[q + 1] = kind === 0 ? 0.91 : 1; this.c[q + 2] = 1; this.c[q + 3] = 0;
    this.live = 1; this.pts.visible = true;
  }
  step(dt, calm) {
    if (!this.live) return 0;
    let alive = 0; const { p, v, c, age, life, kind, a } = this;
    for (let i = 0; i < this.max; i++) {
      if (age[i] >= life[i]) continue;
      const j = i * 3, q = i * 4, k = kind[i]; age[i] += dt; const u = age[i] / life[i];
      if (k === 0) v[j + 1] -= 9.8 * dt;
      else if (k === 1) { const d = Math.exp(-2.6 * dt); v[j] = v[j] * d + WIND[0] * 0.5 * dt; v[j + 2] = v[j + 2] * d + WIND[1] * 0.5 * dt; v[j + 1] = v[j + 1] * d - 1.5 * dt; }
      else { const d = Math.exp(-0.9 * dt); v[j] *= d; v[j + 1] *= d; v[j + 2] *= d; }
      p[j] += v[j] * dt; p[j + 1] += v[j + 1] * dt; p[j + 2] += v[j + 2] * dt;
      if (u >= 1 || (k !== 2 && p[j + 1] < 0.02)) { age[i] = life[i]; c[q + 3] = 0; p[j + 1] = -999; continue; }
      alive++;
      c[q + 3] = k === 2 ? a[i] * Math.sin(u * 3.1416) : k === 1 ? a[i] * (1 - u * u) * (calm ? 0.8 : 0.6 + 0.4 * Math.sin(age[i] * 17 + i)) : a[i] * Math.min(1, age[i] * 12);
    }
    this.pts.geometry.attributes.position.needsUpdate = true; this.pts.geometry.attributes.color.needsUpdate = true;
    if (!alive) { this.live = 0; this.pts.visible = false; }
    return alive;
  }
  clear() { this.age.fill(0); this.life.fill(0); this.c.fill(0); this.p.fill(-999); this.live = 0; this.pts.visible = false; this.pts.geometry.attributes.position.needsUpdate = true; this.pts.geometry.attributes.color.needsUpdate = true; }
}

// ---------------------------------------------------------------- the feature
const _p = { x: 0, y: 0, z: 0 }, _o = { x: 0, y: 0, z: 0 }, _wet = new THREE.Color(0x26323f), _dry = new THREE.Color(0xffffff);
const back = x => { const c = 1.9; return x >= 1 ? 1 : 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };      // up, a little over, and back

feature({
  id: 'hydrants',

  init(k) {
    const H = this.H = k.plan.hydrants; if (!H || !H.length || !H.red || !H.snow) { this.H = null; return; }
    for (const h of H) h.state = 0;                         // 0 standing, 1 running, 2 frozen
    const root = this.root = new THREE.Group(); root.name = 'hydrants'; root.userData.always = true; k.group.add(root);      // (always: these come and go and are tiny; nothing for the streamer to do)
    this.streak = streakTex(); this.dot = dotTex(false); this.puff = dotTex(true); this.sheetMap = sheetTex();
    // Ice. It is lit like everything else (the headlamp finds its facets), but most of what you see of it at night is the
    // light it holds: each facet its own colour, dark and blue where you look into it and white where you look along it,
    // which is what makes ice of it and not blue plastic. Not see-through: one pass, and nothing to sort.
    this.iceMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.14, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.5 });
    this.iceMat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n float hyRim = 1.0 - abs( normal.z );\n totalEmissiveRadiance *= vColor.rgb * ( 0.3 + 0.8 * hyRim * hyRim + 0.2 * max( 0.0, normal.y ) );'); };
    this.water = new THREE.MeshBasicMaterial({ map: this.streak, color: 0xc4dcff, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.sheetMat = new THREE.MeshStandardMaterial({ map: this.sheetMap, roughness: 0.1, transparent: true, depthWrite: false, emissive: new THREE.Color(0.3, 0.36, 0.5), emissiveMap: this.sheetMap, emissiveIntensity: GLOW, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
    this.dropMat = new THREE.PointsMaterial({ map: this.dot, size: 0.075, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true });
    this.mistMat = new THREE.PointsMaterial({ map: this.puff, size: 1.7, color: 0xb9d2f2, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true });
    this.jetG = jetGeo(); this.veilG = veilGeo(); this.bodyG = bodyGeo(); this.flat = new THREE.PlaneGeometry(1, 1, LOWMEM ? 8 : 12, LOWMEM ? 8 : 12).rotateX(-Math.PI / 2);
    this.kinds = []; for (let i = 0; i < KINDS; i++) this.kinds.push(fountain(4100 + i * 37));
    this.rigs = [];
    for (let i = 0; i < RIGS; i++) {
      const g = new THREE.Group(); g.visible = false; root.add(g);
      const spout = new THREE.Group(), jet = new THREE.Mesh(this.jetG, this.water), veil = new THREE.Mesh(this.veilG, this.water); jet.renderOrder = 3; veil.renderOrder = 4; jet.frustumCulled = veil.frustumCulled = false; spout.add(jet, veil); g.add(spout);
      // the ice while it grows: its own corners (moved every frame), the finished shape's colours and faces
      const live = this.kinds.map(q => { const lg = new THREE.BufferGeometry(), pa = new THREE.BufferAttribute(new Float32Array(q.P.length), 3); pa.setUsage(THREE.DynamicDrawUsage); lg.setAttribute('position', pa); lg.setAttribute('color', q.geo.attributes.color); lg.setIndex(q.geo.index); lg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.5, 0), 3.2); return lg; });
      const ice = new THREE.Mesh(live[0], this.iceMat); g.add(ice);
      const drops = new Specks(LOWMEM ? 70 : 170, this.dropMat), mist = new Specks(LOWMEM ? 12 : 26, this.mistMat); drops.pts.renderOrder = 5; mist.pts.renderOrder = 6; g.add(drops.pts, mist.pts);
      this.rigs.push({ g, spout, jet, veil, ice, live, drops, mist, sheetMat: this.sheetMat.clone(), h: null, t: 0, emit: 0, fog: 0, tick: 0, done: false });
    }
    // one of each still thing, hidden, so that everything this file draws with can be made ready ahead of the moment (_warm)
    this.sample = new THREE.Mesh(this.flat, this.sheetMat); this.sample.visible = false; root.add(this.sample);
    this.hiss = k.loop({ lp: 3400, hp: 420 }); this.warmT = 0; this.busy = 0;
    this.mem = {};                                        // the night's record again, for a private window (where tonight() keeps nothing)
    k.G.hydrants = this;                                  // (for the checks, and the sound book)
  },

  // Everything it draws with, compiled in the background the first time the toy comes near a hydrant, so the frame it breaks
  // on is not the frame that pays for it. (Compiled as it will be drawn: into a target, not the screen.)
  _warm(k) {
    const r = k.G.renderer, cam = k.G.camera; if (this.warm || !r || !r.compileAsync || !cam) return;
    this.warm = true;
    let scene = k.group; while (scene.parent) scene = scene.parent;
    const rt = new THREE.WebGLRenderTarget(4, 4), was = r.getRenderTarget();
    try { r.setRenderTarget(rt); const p = r.compileAsync(this.root, cam, scene); if (p && p.catch) p.catch(() => {}); for (const t of [this.streak, this.dot, this.puff, this.sheetMap]) r.initTexture(t); } catch (e) { /* then it is made when first drawn */ }
    r.setRenderTarget(was); rt.dispose();
  },

  // The body cut down to its stub in the street's mesh, everything above it folded away; or put back as it was.
  _shear(h, on) {
    const H = this.H, pr = H.red.geometry.attributes.position, ps = H.snow.geometry.attributes.position, a = pr.array, b = ps.array;
    if (!h.keep) h.keep = [a.slice(h.red * 3, (h.red + 96) * 3), b.slice(h.snow * 3, (h.snow + 24) * 3)];
    if (on) {
      for (let i = 0, j = h.red * 3; i < 96; i++, j += 3) { if (i < 24) a[j + 1] = Math.min(a[j + 1], h.y + STUB); else { a[j] = h.x; a[j + 1] = h.y; a[j + 2] = h.z; } }
      for (let i = 0, j = h.snow * 3; i < 24; i++, j += 3) { b[j] = h.x; b[j + 1] = h.y; b[j + 2] = h.z; }
    } else { a.set(h.keep[0], h.red * 3); b.set(h.keep[1], h.snow * 3); }
    pr.needsUpdate = true; ps.needsUpdate = true;
  },
  // The still things a broken hydrant has, made the first time it breaks and kept.
  _dress(h, i) {
    if (h.fix) return;
    this._seed(h, i); const kind = h.kind;
    h.fix = new THREE.Mesh(kind.geo, this.iceMat); h.fix.position.set(h.x, h.y, h.z); h.fix.rotation.y = h.rot; h.fix.scale.setScalar(h.size); h.fix.matrixAutoUpdate = false; h.fix.updateMatrix(); h.fix.visible = false;
    h.sheet = new THREE.Mesh(h.cut || this._cut(h), this.sheetMat); h.sheet.position.set(h.x, h.y + 0.012, h.z); h.sheet.rotation.y = h.rot; h.sheet.renderOrder = -1; h.sheet.visible = false;
    h.body = new THREE.Mesh(this.bodyG, this.H.red.material); h.body.rotation.order = 'YXZ'; h.body.visible = false;
    this.root.add(h.fix, h.sheet, h.body);
    h.col = { x0: h.x - COL, x1: h.x + COL, z0: h.z - COL, z1: h.z + COL, y0: h.y, y1: h.y + h.top };
    h.rect = { x0: h.x - SLICK, x1: h.x + SLICK, z0: h.z - SLICK, z1: h.z + SLICK, y: h.y, crust: (x, z) => 0.1 + 0.5 * Math.min(1, Math.hypot(x - h.x, z - h.z) / SLICK) };      // glassy at the foot, frosted towards its edge
  },
  // Which fountain this one will make, which way round and how big: the same every night.
  _seed(h, i) { if (h.kind) return; const kind = h.kind = this.kinds[i % KINDS], q = rng(900 + i * 13); h.rot = q() * 6.2832; h.size = 0.92 + q() * 0.16; h.top = kind.H * h.size; },
  // The sheet of ice for this one, cut to the ground it lies on: a corner that would hang out over the kerb (or run into a step)
  // is drawn back along its line to the hydrant until it is on the level. Worked out once (update() does it as the toy comes
  // near, so that the break does not have to: it is a few hundred looks at the ground).
  _cut(h) {
    const geo = this.flat.clone(), a = geo.attributes.position.array, c = Math.cos(h.rot), s = Math.sin(h.rot), S = SHEET * 2, P = this.plan;
    const level = (x, z) => Math.abs(groundAt(P, h.x + (x * c + z * s) * S, h.z + (z * c - x * s) * S, h.y + 0.2) - h.y) < 0.04;
    for (let i = 0; i < a.length; i += 3) {
      const x = a[i], z = a[i + 2]; if (level(x, z)) continue;
      let lo = 0, hi = 1; for (let q = 0; q < 7; q++) { const m = (lo + hi) / 2; if (level(x * m, z * m)) lo = m; else hi = m; }
      a[i] = x * lo; a[i + 2] = z * lo;
    }
    return h.cut = geo;
  },
  _has(list, o) { return list.indexOf(o) >= 0; },
  _drop(list, o) { const i = list.indexOf(o); if (i >= 0) list.splice(i, 1); },
  _lay(h) {                                                 // the body, where it came to rest
    const L = h.lie, b = h.body; b.position.set(L[0], L[1] + 0.14, L[2]); b.rotation.set(Math.PI / 2 - 0.1, L[3], 0); b.visible = true;
    if (!h.bob) { const x = Math.abs(Math.sin(L[3])) > 0.5; h.bob = { x0: L[0] - (x ? 0.32 : 0.2), x1: L[0] + (x ? 0.32 : 0.2), z0: L[2] - (x ? 0.2 : 0.32), z1: L[2] + (x ? 0.2 : 0.32), y0: L[1], y1: L[1] + 0.3 }; }
    if (!this._has(this.plan.obstacles, h.bob)) this.plan.obstacles.push(h.bob);
  },
  // Frozen, all at once: how one is found again on Continue, and how a running one ends if it must (a third breaks, the night ends).
  _set(h, i) {
    this._dress(h, i);
    if (h.state === 0) { this._shear(h, true); this._drop(this.plan.obstacles, h.ob); }
    h.state = 2; h.fix.visible = true;
    h.sheet.material = this.sheetMat; h.sheet.scale.set(SHEET * 2, 1, SHEET * 2); h.sheet.visible = true;
    if (!this._has(this.plan.obstacles, h.col)) this.plan.obstacles.push(h.col);
    if (!this._has(this.plan.ice, h.rect)) this.plan.ice.push(h.rect);
    this._lay(h);
  },
  // As it was built.
  _mend(h) {
    if (h.state === 0) return;
    const P = this.plan; this._shear(h, false);
    this._drop(P.obstacles, h.col); this._drop(P.obstacles, h.bob); this._drop(P.ice, h.rect); if (!this._has(P.obstacles, h.ob)) P.obstacles.push(h.ob);
    h.fix.visible = h.sheet.visible = h.body.visible = false; h.bob = null; h.lie = null; h.state = 0;
  },
  _free(R) { R.g.visible = false; R.h = null; R.drops.clear(); R.mist.clear(); },

  // It breaks: hit along (nx, nz) at `speed` m/s.
  burst(i, nx, nz, speed, k) {
    const h = this.H[i]; if (!h || h.state !== 0) return false;
    const P = this.plan = k.plan, calm = !!k.G.set.reduce;
    this._warm(k); this._dress(h, i);
    this._shear(h, true); this._drop(P.obstacles, h.ob); h.state = 1;
    // where the body ends up: the way it was hit, but down the pavement (whichever way along it the hit was going, and no more than
    // a step to the side: in the carriageway the night bus would drive through it), clear of anything solid, lying along the street or across it
    const d = 1.15 + Math.min(1.1, Math.max(0, speed - BREAK) * 0.22), ux = h.ew ? 1 : 0, uz = h.ew ? 0 : 1, al = nx * ux + nz * uz, ac = nx * uz - nz * ux;
    const far = Math.max(1.05, Math.abs(al) * d) * (Math.abs(al) > 0.15 ? Math.sign(al) : Math.random() < 0.5 ? -1 : 1), side = Math.max(-0.4, Math.min(0.4, ac * d + (Math.random() - 0.5) * 0.3));
    _p.x = h.x + ux * far + uz * side; _p.y = h.y; _p.z = h.z + uz * far - ux * side; confine(P, _p, 0.42, false, _o);
    const a = Math.atan2(_p.x - h.x, _p.z - h.z);
    let gy = groundAt(P, _p.x, _p.z, h.y + 0.4); if (!(gy > h.y - 1.5)) gy = h.y;
    const sx = Math.sin(a), cz = Math.cos(a);
    h.lie = [_p.x, gy, _p.z, Math.abs(sx) > Math.abs(cz) ? Math.sign(sx) * Math.PI / 2 : cz > 0 ? 0 : Math.PI]; h.from = a; h.bob = null;
    this.mem[i] = h.lie.map(q => Math.round(q * 1000) / 1000); tonight(n => { (n.hydrants || (n.hydrants = {}))[i] = this.mem[i]; });      // broken for the night, and that is where its body lies
    // a set of moving parts: a free one, or the one that has been running longest (which sets on the spot)
    let R = this.rigs.find(q => !q.h);
    if (!R) { R = this.rigs.reduce((m, q) => (q.t > m.t ? q : m)); this._set(R.h, this.H.indexOf(R.h)); this._free(R); }
    R.h = h; this.busy = 1; R.t = 0; R.emit = R.fog = R.tick = 0; R.done = false; R.landed = false; R.solid = R.slick = false; R.rise = calm ? 1.2 : 0.45;
    R.g.position.set(h.x, h.y, h.z); R.g.visible = true;
    R.ice.geometry = R.live[i % KINDS]; R.ice.rotation.y = h.rot; R.ice.scale.setScalar(h.size); R.ice.visible = false;
    R.sheetMat.color.copy(_wet); R.sheetMat.emissiveIntensity = 0.04; R.sheetMat.opacity = 0; h.sheet.material = R.sheetMat; h.sheet.scale.set(0.3, 1, 0.3); h.sheet.visible = true;
    h.body.position.set(h.x, h.y + MID, h.z); h.body.rotation.set(0, a, 0); h.body.visible = true;
    // the first of it: the snow off its cap, and a ring of water flat across the pavement
    for (let q = 0; q < 12; q++) { const t = Math.random() * 6.283, s = 0.4 + Math.random(); R.drops.add(0, 0.76, 0, Math.cos(t) * s + nx * 1.2, 1 + Math.random() * 1.6, Math.sin(t) * s + nz * 1.2, 1.6, 1, 0.9); }
    for (let q = 0, m = LOWMEM ? 14 : 30; q < m; q++) { const t = q / m * 6.283, s = 2 + Math.random() * 2.6; R.drops.add(Math.cos(t) * 0.12, 0.14, Math.sin(t) * 0.12, Math.cos(t) * s, 0.8 + Math.random() * 2.4, Math.sin(t) * s, 2, 0, 0.9); }
    this._sound('break', k, h);
    k.once('hydrant', 'The hydrant has sheared off at the base. In this cold the spray freezes where it lands.', 6);
    return true;
  },

  _fall(k, h) { const p = k.pos, d = Math.hypot(p.x - h.x, p.z - h.z, p.y - h.y); return d > 60 ? 0 : 1 / (1 + (d / 10) * (d / 10)); },
  _sound(what, k, h) {
    const s = k.synth, f = h ? this._fall(k, h) : 1; if (f <= 0.01) return;
    if (what === 'break') {                                 // iron letting go, then the main
      s.note(196, 0.5, { type: 'square', vol: 0.05 * f }); s.note(523, 0.35, { type: 'triangle', vol: 0.06 * f }); s.note(1318, 0.22, { type: 'sine', vol: 0.03 * f, at: 0.01 });
      s.noise(0.25, { vol: 0.12 * f, lp: 2600 }); s.noise(1.1, { vol: 0.1 * f, lp: 4200, at: 0.06 });
    } else if (what === 'land') { s.note(147, 0.3, { type: 'square', vol: 0.035 * f }); s.note(392, 0.25, { type: 'triangle', vol: 0.035 * f }); s.noise(0.12, { vol: 0.05 * f, lp: 1200 }); }
    else if (what === 'tick') { s.noise(0.02 + Math.random() * 0.03, { vol: 0.035 * f, lp: 7000 }); if (Math.random() < 0.5) s.note(2200 + Math.random() * 3200, 0.07, { type: 'sine', vol: 0.014 * f }); }
    else if (what === 'set') { s.chime([1568, 2093, 2637, 3136], { gap: 0.09, dur: 1.4, vol: 0.03 * f }); s.noise(0.5, { vol: 0.03 * f, lp: 6000 }); }
  },

  // One running hydrant, a frame on.
  _run(R, dt, k) {
    const h = R.h, kind = h.kind, calm = !!k.G.set.reduce, v = k.v; R.t += dt;
    const t = R.t, g = Math.min(1, Math.max(0, (t - BLAST) / FREEZE)), rise = calm ? ss(t / R.rise) : back(Math.min(1, t / R.rise));
    // how much water is still getting out: all of it, then less as the ice closes on it, a few last gasps, none
    let flow = 1 - ss((g - 0.2) / 0.72); if (!calm && g > 0.76 && g < 0.92 && Math.sin(t * 15) < 0) flow *= 0.35;
    const live = flow > 0.015;
    // the body: knocked off, over once in the air, down on its side
    if (!R.landed) {
      const T = calm ? 0.9 : 0.75, u = Math.min(1, t / T), L = h.lie, b = h.body;
      let da = L[3] - h.from; da = Math.atan2(Math.sin(da), Math.cos(da));
      b.position.set(h.x + (L[0] - h.x) * u, h.y + MID + (L[1] + 0.14 - h.y - MID) * u + (calm ? 0.3 : 0.6) * 4 * u * (1 - u), h.z + (L[2] - h.z) * u);
      b.rotation.set((Math.PI / 2 - 0.1) * (calm ? ss(u) : u) + (calm ? 0 : Math.PI * 2 * u), h.from + da * u, 0);
      if (u >= 1) { R.landed = true; this._lay(h); this._sound('land', k, h); }
    }
    // the ice: on the ground first, then up
    const white = ss((g - 0.03) / 0.7);
    h.sheet.scale.x = h.sheet.scale.z = SHEET * 2 * (0.16 + 0.62 * ss(t / BLAST) + 0.22 * ss(g / 0.7));
    R.sheetMat.opacity = Math.min(1, t / 0.5); R.sheetMat.color.copy(_wet).lerp(_dry, white); R.sheetMat.emissiveIntensity = 0.04 + (GLOW - 0.04) * white;
    if (g > 0) { R.ice.visible = true; grow(kind, R.ice.geometry.attributes.position.array, g); R.ice.geometry.attributes.position.needsUpdate = true; }
    const cw = kind.cap, colTop = g > cw[2] ? (cw[0] + (cw[1] - cw[0]) * ss((g - cw[2]) / (cw[3] - cw[2]))) * h.size : 0;
    // the jet out of the stub, and later out of the top of the ice; the veil off the top of the jet
    const foot = Math.max(STUB, colTop - 0.1), wob = calm ? 1 : 1 + 0.025 * Math.sin(t * 9.1) + 0.02 * Math.sin(t * 23.7);
    const head = foot + (JET * rise * wob - foot) * (1 - ss((g - 0.15) / 0.72)) + (kind.spire * h.size - foot) * ss((g - 0.15) / 0.72) * Math.min(1, flow * 4);
    R.jet.visible = R.veil.visible = live && head - foot > 0.05;
    if (live) {
      const w = 0.45 + 0.55 * flow, vs = (0.22 + 0.78 * flow) * Math.min(1, rise);
      R.jet.position.y = foot; R.jet.scale.set(w, Math.max(0.05, head - foot), w);
      R.veil.position.y = head - 0.12 * vs; R.veil.scale.setScalar(vs); R.veil.rotation.y = calm ? 0 : Math.sin(t * 0.7) * 0.25;
      if (calm) R.spout.rotation.set(0, 0, 0); else R.spout.rotation.set(0.028 * Math.sin(t * 1.7), 0, 0.028 * Math.sin(t * 2.3 + 1));
      // drops off the top (more and more of them ice as it goes on), and mist where it is thrown about
      const cold = ss((g - 0.1) / 0.6);
      R.emit += dt * (LOWMEM ? 26 : calm ? 44 : 64) * flow;
      while (R.emit >= 1) {
        R.emit -= 1; const a = Math.random() * 6.283, o = (0.5 + Math.random() * 1.9) * (0.4 + 0.6 * flow), ice = Math.random() < cold * 0.85;
        R.drops.add(Math.cos(a) * 0.12, head + 0.05, Math.sin(a) * 0.12, Math.cos(a) * o + WIND[0] * 0.3, (0.4 + Math.random() * 2.4) * flow, Math.sin(a) * o + WIND[1] * 0.3, ice ? 3.2 : 2.2, ice ? 1 : 0, ice ? 0.95 : 0.85);
      }
      R.fog += dt * (LOWMEM ? 3 : 7) * flow;
      while (R.fog >= 1) {
        R.fog -= 1; const up = Math.random() < 0.6, a = Math.random() * 6.283, d = Math.random() * (up ? 0.5 : 0.7);
        R.mist.add(Math.cos(a) * d, up ? head - Math.random() * 0.9 : 0.25 + Math.random() * 0.3, Math.sin(a) * d, WIND[0] * 0.45 + Math.cos(a) * 0.25, up ? -0.15 : 0.3, WIND[1] * 0.45 + Math.sin(a) * 0.25, 2 + Math.random() * 1.2, 2, (0.16 + Math.random() * 0.1) * (0.4 + 0.6 * flow));      // (thinner as the water gives out)
      }
      // it will lift a toy that drives into it (and a drone that flies through gets a shove up)
      if (flow > 0.35 && t > 0.2 && v && !k.G.held && !k.G.ride) {
        const dx = v.pos.x - h.x, dz = v.pos.z - h.z, dy = v.pos.y - h.y;
        if (dx * dx + dz * dz < 0.3 * 0.3 && dy > -0.2 && dy < head + 0.4) {
          if (v.kind === 'car') { if (!v.air && v.vy < 1) v.vy = 3.3 * (0.5 + 0.5 * flow); }
          else if (v.vel.y < 3.5) v.vel.y += 18 * flow * dt;
        }
      }
    }
    // the last of it: what is in the air sets, and falls as it is
    if (!R.done && g >= 0.93) {
      R.done = true; this._sound('set', k, h);
      for (let q = 0, m = LOWMEM ? 10 : 22; q < m; q++) { const a = Math.random() * 6.283, o = 0.2 + Math.random() * 0.9; R.drops.add(Math.cos(a) * 0.1, kind.spire * h.size, Math.sin(a) * 0.1, Math.cos(a) * o, 0.3 + Math.random() * 1.2, Math.sin(a) * o, 3.4, 1, 1); }
    }
    if (g > 0.05 && g < 0.93 && (R.tick -= dt) <= 0) { R.tick = 0.1 + Math.random() * (0.7 - 0.45 * g); this._sound('tick', k, h); }
    const a1 = R.drops.step(dt, calm), a2 = R.mist.step(dt, calm);
    // solid, and slippery, once there is enough of it (and the toy is not standing where the column will be)
    // (R.solid, R.slick: asked of the rig, not of the plan, whose list of solids is eighteen thousand long)
    if (!R.solid && g > 0.3 && v && Math.hypot(v.pos.x - h.x, v.pos.z - h.z) > COL * 1.42 + (v.radius || 0.2) + 0.1) { R.solid = true; this.plan.obstacles.push(h.col); }
    if (!R.slick && g > 0.4) { R.slick = true; this.plan.ice.push(h.rect); }
    if (g >= 1 && !a1 && !a2) { this._set(h, this.H.indexOf(h)); this._free(R); return 0; }
    return live ? flow * Math.min(1, rise) * this._fall(k, h) : 0;
  },

  // Has the toy just hit one hard enough?
  _hit(v, k) {
    const H = this.H, r = (v.radius || 0.2) + 0.07, f = v.kind === 'car' && v.probes ? v.probes : null, fx = Math.sin(v.yaw || 0), fz = Math.cos(v.yaw || 0);
    for (let i = 0; i < H.length; i++) {
      const h = H[i]; if (h.state || Math.abs(v.pos.x - h.x) > 3 || Math.abs(v.pos.z - h.z) > 3 || v.pos.y > h.y + 1.1 || v.pos.y < h.y - 0.45) continue;
      for (let q = -1, n = f ? f.length : 0; q < n; q++) {
        const o = q < 0 ? 0 : f[q][0], rr = q < 0 ? r : f[q][1] + 0.07, x = v.pos.x + fx * o, z = v.pos.z + fz * o;
        const cx = Math.max(h.x - 0.15, Math.min(h.x + 0.15, x)), cz = Math.max(h.z - 0.15, Math.min(h.z + 0.15, z)), d = Math.hypot(x - cx, z - cz);
        if (d > rr) continue;
        const l = Math.hypot(h.x - x, h.z - z) || 1;
        return this.burst(i, (h.x - x) / l, (h.z - z) / l, v.bump, k);
      }
    }
    return false;
  },

  update(dt, k) {
    const H = this.H; if (!H) return;
    this.plan = k.plan;
    const v = k.v;
    if (v && v.bump >= BREAK && !k.G.held && !k.G.ride) this._hit(v, k);
    // ahead of the moment, while the toy is near one: what this draws with is made ready, and a sheet is cut (one each half second)
    if ((this.warmT += dt) > 0.5) {
      this.warmT = 0; const p = k.pos;
      for (let i = 0; i < H.length; i++) { const h = H[i]; if (Math.abs(p.x - h.x) > 45 || Math.abs(p.z - h.z) > 45) continue; this._warm(k); if (!h.cut) { this._seed(h, i); this._cut(h); break; } }
    }
    if (!this.busy && !this.loud) return;                 // nothing running: nothing to do
    let n = 0, vol = 0;
    for (const R of this.rigs) if (R.h) { n++; vol = Math.max(vol, this._run(R, dt, k)); }
    this.busy = 0; for (const R of this.rigs) if (R.h) this.busy++;
    if (n) this.streak.offset.y -= dt * 2.3;
    this.hiss.set(vol * 0.1); this.loud = vol > 0.0005 ? 300 : Math.max(0, (this.loud || 0) - 1);      // (and for a few seconds after, so the hiss is let go of)
  },

  // A new start (Continue included), or the night is over: anything still running sets, and the street is put as the night's
  // record has it. A new game has emptied the record by then, which puts every hydrant back.
  reset(k) {
    const H = this.H; if (!H) return;
    this.plan = k.plan;
    for (const R of this.rigs) if (R.h) { this._set(R.h, H.indexOf(R.h)); this._free(R); }
    this.busy = 0; this.hiss.set(0); this.loud = 300;     // (update() goes on telling the hiss to stop until it has)
    const kept = Object.assign({}, this.mem, tonight().hydrants);
    H.forEach((h, i) => {
      const L = kept[i];
      if (!L) { if (h.state) this._mend(h); return; }
      if (h.state === 2) return;
      if (Array.isArray(L) && L.length === 4 && L.every(Number.isFinite)) { h.lie = L; h.bob = null; } else if (!h.lie) h.lie = [h.x + 1.2, h.y, h.z, Math.PI / 2];
      this._set(h, i);
    });
  },
  fresh(k) {
    const H = this.H; if (!H) return;
    this.plan = k.plan;
    for (const R of this.rigs) if (R.h) this._free(R);
    this.busy = 0;
    for (const h of H) { if (h.state === 1) h.state = 2; if (h.state) this._mend(h); }
    this.mem = {}; tonight(n => { delete n.hydrants; });
  },
});
