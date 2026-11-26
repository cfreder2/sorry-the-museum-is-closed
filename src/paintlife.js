// Paintings that come alive: the shared kit. One work's animation is one small file in src/life/ that calls
// lifeFor(); everything else (finding the work, waiting for the look, the timeline, building lazily, the guarantee
// that nothing is ever drawn on the picture, palette, paths, pushable things, floor water, sound, the checks) is here.
// The worked examples, start to finish: src/life/20684-paris-street.js (rain, wet paving, strollers),
// src/life/111436-basket-of-apples.js (things that roll and the toy can push), src/life/94841-song-of-the-lark.js
// (a bird in flight, light on the floor and wall). How to make one, the budget and the checks:
// docs/PAINTING-ANIMATIONS.md, "How to make one".
//
// THE RULE: nothing is ever drawn on or over a painting, at any moment, from any camera. Things come OUT of the
// work (from under its bottom rail, over its top rail, round its sides) into the room. A pool of light on the floor,
// or a glow on the wall behind the frame (which the canvas and frame then hide), is fine; anything over the image
// is not. The kit enforces it: every material added with L.add() (or passed through L.mat()) goes through
// protectArt(), a shader guard that throws away any pixel that, seen from the camera drawing it, lies in front of
// the canvas (with 3 cm to spare). Choreograph so the guard rarely has to act (from the look camera it should cut
// nothing: ?lifecheck reports what it cut), but it is always there.
//
//   import { lifeFor, ease } from '../paintlife.js';
//   lifeFor(20684, {                       // the museum's id (title: /^Paris Street/ as a fallback)
//     word: 'puddle',                       // the one word the animation is about
//     stage: { out: 2.4, half: 2.2,         // the floor in front, framed with the work while you look (metres)
//              cam: { dist, side, height, fov, lookOut, lookH } }  // the look camera: low, near, off to one side
//                                           // (defaults 2.2 m out, 0.4 along, 0.8 up, 48 degrees)
//     wake: 2, ret: 1.5,                    // the timeline (seconds): Wake/Emerge, then Play; Return when the look ends
//     linger: { near: 3.5, max: 25 },       // optional: stay out after the look while the toy is this near (to push things)
//     secrets: [['rain', 'Rain indoors']],  // optional, as features have them; spot: { id, name } for the debug map
//     build(L) { ... L.add(mesh) ... },     // once, the first time the toy comes near the room (never at load)
//     start(L, resumed) { },                // a show begins (resumed: it was still lingering, things are already out)
//     update(L, dt) { },                    // every frame while it shows, returns or lingers; L.phase says which
//     back(L) { },                          // the look has ended: going back (L.ret runs 0 to 1 over `ret` seconds)
//     end(L) { },                           // all back in the frame
//     keep(L) { return false },             // optional: keep update() running after end (puddles drying)
//     reset(L) { },                         // a new night
//   });
//
// L, handed to every hook (a Life):
//   L.k (the feature kit: k.G, k.say, k.find, k.synth...), L.art, L.room, L.THREE, L.y (the floor), L.rand() (seeded)
//   L.group                 shown while the show runs (L.fixed: always shown once built, for things that stay)
//   L.add(obj, parent?)     adds obj to L.group (or parent), putting every material in it through the guard
//   L.mat(material)         the guard on one material (L.add does it for you); L.paint({ rough, glow, flat }) a
//                           vertex-coloured standard material that also glows a little in its own colours
//   L.pal                   the work's palette: L.pal.hex (8 swatches, dark to light), L.pal.near('#5b6a7a', 0.6)
//                           (the swatch nearest a colour you have in mind, mixed in that far), L.pal.darkest/lightest
//   the work's frame        L.cx, L.cy, L.cz (canvas centre), L.hw, L.hh (canvas half width and height), L.fw (frame
//                           width), L.bottom/L.top (canvas edges, y), L.rail (underside of the frame), L.crown (top of
//                           the frame), L.wall (canvas plane to wall, m), L.tx/L.tz (along the wall, to the viewer's
//                           right), L.nx/L.nz (out of the wall)
//   L.at(u, v, out, into?)  a point: u along the wall from the centre, v up from the centre, out from the canvas plane
//   L.floor(u, out, into?)  a point on the floor; L.local(x, z) -> { u, out }
//   L.quiet                 true while a check or a test poses it: find no secrets, say nothing
//   L.phase                 'wake' | 'play' | 'return' | 'linger' | 'after'; L.t seconds of show, L.wake 0..1 (eased)
//                           over the Wake, L.ret 0..1 over the Return, L.looking
//   L.hides(x, y, z, r)     the guard's test on the CPU, from the camera now (true: it would be in front of the canvas)
//   L.rig(n, verts)         many rigid parts, one draw call (a BatchedMesh): legs, wings, apples, a cloth's panels
//   L.rollers(n, opts)      balls on the floor the toy can push about: apples, croquet balls, yarn (never solid)
//   L.decal(opts)           something flat on the floor (or wall), 1 cm clear of it (L.mirrored(mesh): it shows the
//                           floor's reflection, as a puddle does); L.glow(opts) a pool of light,
//                           L.glows([...]) several in one draw call; L.blobs(n) soft contact shadows
//   L.voice()               sound: chirps, notes, tunes (pre-1900 only), loops, louder the nearer the camera
//   shape.*                 small geometry makers (lathe, ball, box, cyl, merge, paint) with vertex colours
//   ease.*, flight(), hop() motion
//
// Budget (phones are half the players): at most ~400 marks/particles visible, at most 3 draw calls of its own while
// it shows, geometry and textures shared, nothing allocated per frame, nothing run per frame unless it shows.
// Checks: ?lifecheck (or __life.check(id)) renders each work's animation alone from several cameras and times and
// verifies no pixel of it lands on the canvas; tools/lifesheet.mjs makes the contact sheet and the video.

import * as THREE from 'three';
import { feature } from './features.js';
import { imageUrl } from './collection.js';
import { parse } from './carols.js';
import { LOWMEM } from './budget.js';

const TAU = Math.PI * 2;
const MARGIN = 0.03;                 // the guard keeps this much clear round the canvas (metres)
const SETTLE = 1.3;                  // seconds into a look before the show starts (the camera is still swinging in)

// ------------------------------------------------------------------ motion --

export const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
export const ramp = (x, a, b) => clamp01((x - a) / (b - a));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ease = {
  smooth: q => { q = clamp01(q); return q * q * (3 - 2 * q); },
  inOut: q => { q = clamp01(q); return q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2; },
  out: q => { q = clamp01(q); return 1 - Math.pow(1 - q, 3); },
  in: q => { q = clamp01(q); return q * q * q; },
  outBack: q => { q = clamp01(q); const c = 1.70158; return 1 + (c + 1) * Math.pow(q - 1, 3) + c * Math.pow(q - 1, 2); },
  // a ball let go at height 1 and bouncing to rest at 0 (three bounces)
  bounce: q => { q = clamp01(q); const n = 7.5625, d = 2.75; if (q < 1 / d) return 1 - n * q * q; if (q < 2 / d) return 1 - (n * (q -= 1.5 / d) * q + 0.75); if (q < 2.5 / d) return 1 - (n * (q -= 2.25 / d) * q + 0.9375); return 1 - (n * (q -= 2.625 / d) * q + 0.984375); },
};
// A hop from a to b (Vector3s), rising h above the straight line between them at the middle, at s (0..1), into `out`.
export function hop(a, b, h, s, out) {
  s = clamp01(s); out.lerpVectors(a, b, s); out.y += 4 * h * s * (1 - s); return out;
}
// A smooth path through points (Vector3s), by arc length. f.at(s, pos) for s in 0..1 (wraps when closed); f.dir(s, v)
// the way it is heading; f.bank(s) how hard it turns (for a bird's lean), f.length in metres.
export function flight(points, { closed = true, tension = 0.5 } = {}) {
  const c = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', tension);
  c.arcLengthDivisions = 400; c.updateArcLengths();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
  const wrap = s => (closed ? s - Math.floor(s) : clamp01(s));
  return {
    curve: c, length: c.getLength(),
    at: (s, out) => c.getPointAt(wrap(s), out),
    dir: (s, out) => c.getTangentAt(wrap(s), out),
    // the turn, signed (left positive), as the cross of headings a little before and after
    bank(s) { c.getTangentAt(wrap(s - 0.01), a); c.getTangentAt(wrap(s + 0.01), b); d.crossVectors(a, b); return Math.max(-1, Math.min(1, d.y * 12)); },
  };
}

// A stroll: a figure's route over the floor in the stage's own terms, [[u, out, pause?], ...] (pause: seconds to stand
// at that point). w = walk(points, { speed, rest }); w.at(t, o) fills o = { u, out, du, dout (heading), moving (0..1,
// for the legs) } for any t (it loops, standing `rest` seconds at the end). w.period is one loop, in seconds.
export function walk(points, { speed = 0.25, rest = 0 } = {}) {
  const legs = []; let cur = [points[0]];
  for (let i = 1; i < points.length; i++) { cur.push(points[i]); if (points[i][2] || i === points.length - 1) { legs.push({ pts: cur, pause: points[i][2] || 0 }); cur = [points[i]]; } }
  let T = 0;
  for (const g of legs) {
    g.curve = new THREE.CatmullRomCurve3(g.pts.map(p => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
    g.len = g.curve.getLength(); g.t0 = T; g.dur = g.len / speed + 0.5; T += g.dur + g.pause;
  }
  const v = new THREE.Vector3(), d = new THREE.Vector3(), period = T + rest;
  return {
    period, legs,
    at(t, o = {}) {
      t = ((t % period) + period) % period;
      let g = legs[legs.length - 1], local = g.dur;
      for (const q of legs) { if (t < q.t0 + q.dur + q.pause) { g = q; local = Math.min(q.dur, t - q.t0); break; } }
      // a quarter of a second to get going and to stop, at either end of each leg
      const a = 0.25 / g.dur, x = local / g.dur, s = x < a ? (x * x) / (2 * a) / (1 - a) : x > 1 - a ? 1 - ((1 - x) * (1 - x)) / (2 * a) / (1 - a) : (x - a / 2) / (1 - a);
      g.curve.getPointAt(clamp01(s), v); g.curve.getTangentAt(clamp01(s), d);
      o.u = v.x; o.out = v.z; o.du = d.x; o.dout = d.z;
      o.moving = local >= g.dur || t >= g.t0 + g.dur ? 0 : Math.min(1, x / a, (1 - x) / a);
      return o;
    },
  };
}

// ------------------------------------------------------------------ the guarantee --

// Per work: where its canvas is, and the canvas of every other picture in its room (a bird or the rain going past
// one of those is drawing over a painting too). Shared by every guarded material of that work, so moving a picture
// (the finale carries some off) is one update. The work's own canvas is the first.
const MAXC = 24;                          // canvases guarded per work (the work, and the rest of its room)
const GUARDS = new WeakMap();
let MUSEUM = null;
function guardOf(art) {
  let u = GUARDS.get(art);
  if (!u) { GUARDS.set(art, u = { uLifeR: { value: Array.from({ length: MAXC * 3 }, () => new THREE.Vector4()) }, uLifeN: { value: 0 }, uLifeOff: { value: 0 }, uLifePx: { value: 900 }, arts: [] }); placeGuard(art); }
  return u;
}
const _m = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _ax = new THREE.Vector3(), _vp = new THREE.Vector4();
// Read where the canvases are now, from their meshes (centre; along and out of the wall; half width and height).
function placeGuard(art) {
  const u = guardOf(art), room = MUSEUM && MUSEUM.rooms && MUSEUM.rooms[art.room];
  const d2 = a => (a.x - art.x) ** 2 + (a.z - art.z) ** 2;      // (the nearest first, should a room ever hold more than MAXC)
  u.arts = [art, ...((room && room.arts) || []).filter(a => a !== art && !a.obj && a.mesh).sort((a, b) => d2(a) - d2(b))].slice(0, MAXC);
  u.arts.forEach((a, i) => {
    const m = a.mesh, R = u.uLifeR.value;
    if (m) { m.updateMatrixWorld(); m.matrixWorld.decompose(_m, _q, _s); } else { _m.set(a.x, a.y, a.z); _s.set(a.w, a.h, 1); _q.setFromAxisAngle(_ax.set(0, 1, 0), a.rot); }
    R[i * 3].set(_m.x, _m.y, _m.z, 0);
    _ax.set(1, 0, 0).applyQuaternion(_q); const tx = _ax.x, tz = _ax.z; _ax.set(0, 0, 1).applyQuaternion(_q);
    R[i * 3 + 1].set(tx, tz, _ax.x, _ax.z);
    R[i * 3 + 2].set(Math.abs(_s.x) / 2 + MARGIN, Math.abs(_s.y) / 2 + MARGIN, 0, 0);
  });
  u.uLifeN.value = u.arts.length;
  return u;
}

const GUARD_COMMON = /* glsl */`
uniform vec4 uLifeR[${MAXC * 3}]; uniform int uLifeN; uniform float uLifeOff; uniform float uLifePx;
varying vec3 vLifeV;
// How far outside canvas i (grown by the margin) the ray from the eye E through world point P meets its plane beyond
// P: negative means P is in front of that canvas, as seen from E. (r grows the canvas, for a point's size.)
float lifeOut1(vec3 E, vec3 P, float r, int i) {
  vec4 C = uLifeR[i * 3], A = uLifeR[i * 3 + 1], Hh = uLifeR[i * 3 + 2];
  float s = dot(E.xz - C.xz, A.zw), f = dot(P.xz - C.xz, A.zw);
  if (s <= 0.0 || f <= -r || f >= s) return 1.0e3;
  float q = s / max(s - f, 1.0e-4); vec3 H = E + (P - E) * q;
  return max(abs(dot(H.xz - C.xz, A.xy)) - Hh.x, abs(H.y - C.y) - Hh.y) - r * q;
}
float lifeOut(vec3 E, vec3 P, float r) { float m = 1.0e3; for (int i = 0; i < ${MAXC}; i++) { if (i >= uLifeN) break; m = min(m, lifeOut1(E, P, r, i)); } return m; }
vec3 lifeWorld(vec3 v) { return transpose(mat3(viewMatrix)) * (v - viewMatrix[3].xyz); }
`;

// protectArt(material, art, { soft }): the guard, on any three.js material (Mesh, Points, Sprite, Line, instanced,
// batched, ShaderMaterial; not RawShaderMaterial). Chains onto an onBeforeCompile already there, so put it last.
// soft (metres): within this much of the canvas, transparent things fade out and solid ones dissolve (a fine dither),
// rather than stopping at a hard edge. L.add() gives 8 cm and 5 cm.
export function protectArt(mat, art, { soft = 0 } = {}) {
  if (!mat || mat.userData.lifeArt === art) return mat;
  const g = guardOf(art), prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
  const points = !!mat.isPointsMaterial, fade = soft > 0 && mat.transparent, dither = soft > 0 && !mat.transparent;
  mat.userData.lifeArt = art;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    Object.assign(sh.uniforms, { uLifeR: g.uLifeR, uLifeN: g.uLifeN, uLifeOff: g.uLifeOff, uLifePx: g.uLifePx, uLifeSoft: { value: soft } });
    // Every vertex: where it is, in the camera's space (from gl_Position, so it works whatever the shader did).
    // A point sprite is hidden whole if any of it could be over the canvas.
    let tail = '\n  { vec4 lq = inverse(projectionMatrix) * gl_Position; vLifeV = lq.xyz / lq.w; }\n';
    if (points) tail += '  { float lr = gl_PointSize * 0.5 * max(-vLifeV.z, 0.0) / (projectionMatrix[1][1] * scale); if (lifeOut(cameraPosition, lifeWorld(vLifeV), lr) < 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }\n';
    sh.vertexShader = GUARD_COMMON + sh.vertexShader.replace(/\}\s*$/, tail + '}\n');
    // Every pixel: thrown away if it lies in front of the canvas, seen from this camera.
    sh.fragmentShader = GUARD_COMMON + 'uniform float uLifeSoft;\nfloat lifeK = 1.0;\nvec3 lifeP;\n' +
      sh.fragmentShader.replace(/void\s+main\s*\(\s*(void)?\s*\)\s*\{/, m => m + `
  lifeP = lifeWorld(vLifeV);
  if (uLifeOff < 0.5) {
    // (grown by a pixel and a half at this depth: a line is a pixel wide, and an edge's samples reach half a pixel out)
    float lo = lifeOut(cameraPosition, lifeP, 1.5 * max(-vLifeV.z, 0.0) / uLifePx); if (lo < 0.0) discard;
    // (a soft edge: transparent things fade out towards the canvas; solid ones dissolve, in a fine ordered dither)
    if (uLifeSoft > 0.0) { lifeK = smoothstep(0.0, uLifeSoft, lo); ${fade ? '' : 'vec2 bq = mod(floor(gl_FragCoord.xy), 4.0); float bt = (mod(bq.x + bq.y * 2.0, 4.0) * 4.0 + mod(bq.x * 3.0 + bq.y, 4.0) + 0.5) / 16.0; if (lifeK < bt) discard;'} }
  }
`) .replace(/\}\s*$/, fade ? '  gl_FragColor.a *= lifeK;\n}\n' : '}\n');
  };
  mat.customProgramCacheKey = () => 'paintlife|' + (points ? 'p|' : '') + (fade ? 'f|' : '') + (dither ? 'd|' : '') + prevKey;
  mat.needsUpdate = true;
  return mat;
}

// The same test on the CPU: would a ball of radius r at (x, y, z) be seen in front of the work's canvas, or any other
// in its room, from eye E? (only: 'work' tests the work's own canvas alone)
export function hides(art, E, x, y, z, r = 0, only = null) {
  const u = guardOf(art), R = u.uLifeR.value, n = only === 'work' ? 1 : u.uLifeN.value;
  for (let i = 0; i < n; i++) {
    const C = R[i * 3], A = R[i * 3 + 1], H = R[i * 3 + 2];
    const s = (E.x - C.x) * A.z + (E.z - C.z) * A.w, f = (x - C.x) * A.z + (z - C.z) * A.w;
    if (s <= 0 || f <= -r || f >= s) continue;
    const q = s / Math.max(s - f, 1e-4), hx = E.x + (x - E.x) * q, hy = E.y + (y - E.y) * q, hz = E.z + (z - E.z) * q, g = r * q;
    if (Math.abs((hx - C.x) * A.x + (hz - C.z) * A.y) < H.x + g && Math.abs(hy - C.y) < H.y + g) return true;
  }
  return false;
}

// ------------------------------------------------------------------ the palette --

// The work's own colours: k-means over its image (the texture the museum has loaded, else the image file, else the
// tiny preview every work carries), sorted dark to light.
const PALETTES = new Map();
export function palette(art, n = 8) {
  const w = art.work;
  if (PALETTES.has(w.id)) return PALETTES.get(w.id);
  const p = (async () => {
    let px = null, src = 'none';
    const grab = im => { const c = document.createElement('canvas'); c.width = c.height = 56; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, 56, 56); return g.getImageData(0, 0, 56, 56).data; };
    try { const im = art.tex && art.tex.image; if (im && im.width > 32) { px = grab(im); src = 'texture'; } } catch { px = null; }      // (a picture drawn from another site without permission cannot be read)
    if (!px && w.img) try {
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 5000);
      const r = await fetch(imageUrl(w, 400), { referrerPolicy: 'no-referrer', signal: ctl.signal }); clearTimeout(to);
      if (r.ok) { const bm = await createImageBitmap(await r.blob()); px = grab(bm); if (bm.close) bm.close(); src = 'image'; }
    } catch { px = null; }
    if (!px && w.lq) try { const im = new Image(); im.src = w.lq; await im.decode(); px = grab(im); src = 'preview'; } catch { px = null; }
    return new Palette(px ? kmeans(px, n, w.id) : [], src);
  })();
  PALETTES.set(w.id, p);
  return p;
}
function kmeans(px, k, seed) {
  const pts = []; for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 128) pts.push([px[i] / 255, px[i + 1] / 255, px[i + 2] / 255]);
  if (!pts.length) return [];
  const rnd = rng(seed), d2 = (a, b) => 0.3 * (a[0] - b[0]) ** 2 + 0.59 * (a[1] - b[1]) ** 2 + 0.11 * (a[2] - b[2]) ** 2;
  const c = [pts[Math.floor(rnd() * pts.length)].slice()];
  while (c.length < k) {            // k-means++: each new centre far from the others
    let sum = 0; const w = pts.map(p => { const m = Math.min(...c.map(q => d2(p, q))); sum += m; return m; });
    let r = rnd() * sum, i = 0; while (i < pts.length - 1 && (r -= w[i]) > 0) i++;
    c.push(pts[i].slice());
  }
  const n = new Array(k).fill(0);
  for (let it = 0; it < 10; it++) {
    const acc = c.map(() => [0, 0, 0]); n.fill(0);
    for (const p of pts) { let b = 0, bd = Infinity; for (let j = 0; j < k; j++) { const d = d2(p, c[j]); if (d < bd) { bd = d; b = j; } } acc[b][0] += p[0]; acc[b][1] += p[1]; acc[b][2] += p[2]; n[b]++; }
    for (let j = 0; j < k; j++) if (n[j]) c[j] = acc[j].map(v => v / n[j]);
  }
  return c.map((q, j) => ({ q, n: n[j] })).filter(o => o.n > 0).sort((a, b) => lum(a.q) - lum(b.q)).map(o => '#' + o.q.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join(''));
}
const lum = q => 0.2126 * q[0] + 0.7152 * q[1] + 0.0722 * q[2];
class Palette {
  constructor(hex, src) { this.hex = hex; this.src = src; this._c = new THREE.Color(); }
  get darkest() { return new THREE.Color(this.hex[0] || '#222'); }
  get lightest() { return new THREE.Color(this.hex[this.hex.length - 1] || '#ddd'); }
  // The swatch nearest `hint` (any colour three.js reads), and mixed that far from the hint towards it (1: the swatch).
  near(hint, amount = 1, into = new THREE.Color()) {
    const h = this._c.set(hint); if (!this.hex.length) return into.copy(h);
    const hs = h.clone().convertLinearToSRGB(); let best = null, bd = Infinity;
    for (const x of this.hex) { const s = new THREE.Color(x).convertLinearToSRGB(), d = 0.3 * (s.r - hs.r) ** 2 + 0.59 * (s.g - hs.g) ** 2 + 0.11 * (s.b - hs.b) ** 2; if (d < bd) { bd = d; best = x; } }
    return into.set(hint).lerp(new THREE.Color(best), amount);
  }
}
export function rng(seed) { let s = (Math.abs(Math.floor(seed)) % 2147483646) + 1; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }

// ------------------------------------------------------------------ shapes --
// Small geometry makers. Everything comes back non-indexed with position, normal and color (linear), so it can go
// into L.rig() alongside anything else, and be painted face by face.
const C0 = new THREE.Color();
function finish(g, col) {
  g = g.index ? g.toNonIndexed() : g;
  for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n);
  if (!g.attributes.normal) g.computeVertexNormals();
  const c = new Float32Array(g.attributes.position.count * 3); C0.set(col == null ? 0xffffff : col);
  for (let i = 0; i < c.length; i += 3) { c[i] = C0.r; c[i + 1] = C0.g; c[i + 2] = C0.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
const _M = new THREE.Matrix4(), _E = new THREE.Euler(), _V = new THREE.Vector3(), _S = new THREE.Vector3(), _Q = new THREE.Quaternion();
export const shape = {
  // A surface of revolution round y: prof = [[r, y], ...] from bottom to top.
  lathe: (prof, seg = 12, col) => finish(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y)), seg), col),
  ball: (r, col, detail = 1) => finish(new THREE.IcosahedronGeometry(r, detail), col),
  box: (w, h, d, col) => finish(new THREE.BoxGeometry(w, h, d), col),
  cyl: (r0, r1, h, seg = 8, col) => finish(new THREE.CylinderGeometry(r1, r0, h, seg), col),
  cone: (r, h, seg = 8, col) => finish(new THREE.ConeGeometry(r, h, seg), col),
  // Moved, turned (radians, YXZ) and scaled, in place.
  move(g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) { g.applyMatrix4(_M.compose(_V.set(x, y, z), _Q.setFromEuler(_E.set(rx, ry, rz, 'YXZ')), _S.set(sx, sy, sz))); return g; },
  // Each face its own colour: fn(centre: Vector3, normal: Vector3, faceIndex) -> a colour (or null to leave it).
  paint(g, fn) {
    const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, cen = new THREE.Vector3(), nor = new THREE.Vector3();
    for (let f = 0; f < p.count / 3; f++) {
      cen.set(0, 0, 0); nor.set(0, 0, 0);
      for (let j = 0; j < 3; j++) { cen.x += p.getX(f * 3 + j) / 3; cen.y += p.getY(f * 3 + j) / 3; cen.z += p.getZ(f * 3 + j) / 3; nor.x += n.getX(f * 3 + j); nor.y += n.getY(f * 3 + j); nor.z += n.getZ(f * 3 + j); }
      nor.normalize(); const col = fn(cen, nor, f); if (col == null) continue; C0.set(col);
      for (let j = 0; j < 3; j++) c.setXYZ(f * 3 + j, C0.r, C0.g, C0.b);
    }
    c.needsUpdate = true; return g;
  },
  merge(list) {
    let n = 0; for (const g of list) n += g.attributes.position.count;
    const out = new THREE.BufferGeometry();
    for (const name of ['position', 'normal', 'color']) { const a = new Float32Array(n * 3); let o = 0; for (const g of list) { a.set(g.attributes[name].array, o); o += g.attributes[name].array.length; } out.setAttribute(name, new THREE.BufferAttribute(a, 3)); }
    return out;
  },
};

// ------------------------------------------------------------------ rigs: many parts, one draw call --
class Rig {
  constructor(L, maxInstances, maxVerts, material) {
    this.mesh = new THREE.BatchedMesh(maxInstances, maxVerts, maxVerts * 2, material || L.paint());
    this.mesh.perObjectFrustumCulled = false; this.mesh.sortObjects = false; this.mesh.frustumCulled = false;
    this.m = new THREE.Matrix4(); this.e = new THREE.Euler(0, 0, 0, 'YXZ'); this.v = new THREE.Vector3(); this.q = new THREE.Quaternion(); this.s = new THREE.Vector3();
    this.count = 0;
  }
  geo(g) { return this.mesh.addGeometry(g); }
  add(gid) { this.count++; return this.mesh.addInstance(gid); }
  // Stand part i at (x, y, z), turned yaw about y then pitch about x then roll about z, scaled s (number or Vector3).
  put(i, x, y, z, yaw = 0, pitch = 0, roll = 0, s = 1) {
    this.e.set(pitch, yaw, roll, 'YXZ'); this.q.setFromEuler(this.e);
    if (typeof s === 'number') this.s.set(s, s, s); else this.s.copy(s);
    this.mesh.setMatrixAt(i, this.m.compose(this.v.set(x, y, z), this.q, this.s));
  }
  mat(i, m) { this.mesh.setMatrixAt(i, m); }
  show(i, on) { this.mesh.setVisibleAt(i, on); }
}

// ------------------------------------------------------------------ rollers: things on the floor the toy pushes --
// Balls on the floor: gravity, bounces, rolling (they turn as they go), walls and fixed things, each other, and the
// toy (they are shoved out of its way, never stop it). They keep out of doorways, so nothing ever blocks a route.
// b = R.items[i]: { x, y, z, vx, vy, vz, r, q (Quaternion, how it has rolled), on, still (seconds at rest) }
const _ra = new THREE.Vector3(), _rq = new THREE.Quaternion();
class Rollers {
  constructor(L, n, { r = 0.05, bounce = 0.42, roll = 0.55, push = true, onBounce = null, ground = null } = {}) {
    this.L = L; this.o = { bounce, roll, push, onBounce, ground };
    this.items = Array.from({ length: n }, (_, i) => ({ i, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r, q: new THREE.Quaternion(), on: false, still: 0, air: false }));
    const room = L.room, plan = L.k.plan;
    this.box = { x0: room.x0, x1: room.x1, z0: room.z0, z1: room.z1 };
    this.solid = plan.obstacles.filter(o => o.y0 < room.y + 0.3 && o.y1 > room.y && o.x1 > room.x0 - 1 && o.x0 < room.x1 + 1 && o.z1 > room.z0 - 1 && o.z0 < room.z1 + 1);
    this.doors = plan.doorsOf(room.id).map(d => ({ x: (d.x0 + d.x1) / 2, z: (d.z0 + d.z1) / 2, r: Math.max(d.x1 - d.x0, d.z1 - d.z0) / 2 + 0.9 }));
  }
  step(dt) {
    if (dt <= 0) return;
    const L = this.L, G = L.k.G, y0 = L.y, o = this.o, it = this.items;
    const v = G.vehicle, toy = o.push && G.state === 'play' && v && v.group.visible && Math.abs(v.pos.y - y0) < 0.4 ? v : null;
    for (const b of it) {
      if (!b.on) continue;
      const gy = y0 + b.r + (o.ground ? o.ground(b.x, b.z) : 0);
      b.vy -= 9.8 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      if (b.y <= gy) {
        b.y = gy;
        if (b.vy < -0.35) { const sp = -b.vy; b.vy = sp * o.bounce; b.vx *= 0.9; b.vz *= 0.9; if (o.onBounce) o.onBounce(b, sp); }
        else b.vy = 0;
        b.air = false;
        const sp = Math.hypot(b.vx, b.vz);
        if (sp > 1e-4) { const k = Math.max(0, sp - o.roll * dt) / sp; b.vx *= k; b.vz *= k; }
      } else b.air = true;
      // walls of the room, and anything fixed down
      const B = this.box;
      if (b.x < B.x0 + b.r) { b.x = B.x0 + b.r; b.vx = Math.abs(b.vx) * 0.5; } else if (b.x > B.x1 - b.r) { b.x = B.x1 - b.r; b.vx = -Math.abs(b.vx) * 0.5; }
      if (b.z < B.z0 + b.r) { b.z = B.z0 + b.r; b.vz = Math.abs(b.vz) * 0.5; } else if (b.z > B.z1 - b.r) { b.z = B.z1 - b.r; b.vz = -Math.abs(b.vz) * 0.5; }
      for (const s of this.solid) if (b.x > s.x0 - b.r && b.x < s.x1 + b.r && b.z > s.z0 - b.r && b.z < s.z1 + b.r && b.y - b.r < s.y1) {
        const dl = b.x - (s.x0 - b.r), dr = s.x1 + b.r - b.x, dn = b.z - (s.z0 - b.r), df = s.z1 + b.r - b.z, m = Math.min(dl, dr, dn, df);
        if (m === dl) { b.x = s.x0 - b.r; b.vx = -Math.abs(b.vx) * 0.5; } else if (m === dr) { b.x = s.x1 + b.r; b.vx = Math.abs(b.vx) * 0.5; } else if (m === dn) { b.z = s.z0 - b.r; b.vz = -Math.abs(b.vz) * 0.5; } else { b.z = s.z1 + b.r; b.vz = Math.abs(b.vz) * 0.5; }
      }
      // out of doorways: a gentle slope away from each
      for (const d of this.doors) { const dx = b.x - d.x, dz = b.z - d.z, dd = Math.hypot(dx, dz); if (dd < d.r && dd > 1e-3) { const k = 0.8 * (1 - dd / d.r) * dt / dd; b.vx += dx * k; b.vz += dz * k; } }
      // the toy shoves it aside, and it takes some of the toy's speed
      if (toy) {
        const dx = b.x - toy.pos.x, dz = b.z - toy.pos.z, dd = Math.hypot(dx, dz), reach = b.r + (toy.radius || 0.16) + 0.04;
        if (dd < reach && dd > 1e-4) {
          const nx = dx / dd, nz = dz / dd, into = Math.max(0, toy.vel.x * nx + toy.vel.z * nz);
          b.x = toy.pos.x + nx * reach; b.z = toy.pos.z + nz * reach;
          b.vx += nx * (into * 1.25 + 0.15); b.vz += nz * (into * 1.25 + 0.15); if (into > 0.6) b.vy += into * 0.3;
          if (o.onBounce && into > 0.3) o.onBounce(b, into * 0.6);
        }
      }
      // rolling: turn about the axis across the way it goes, by the distance gone over the radius
      const sp = Math.hypot(b.vx, b.vz);
      if (sp > 1e-3 && !b.air) { _ra.set(b.vz, 0, -b.vx).multiplyScalar(1 / sp); b.q.premultiply(_rq.setFromAxisAngle(_ra, sp * dt / b.r)); }
      b.still = sp < 0.02 && !b.air ? b.still + dt : 0;
    }
    // each other: pushed apart, sharing their speed along the line between
    for (let i = 0; i < it.length; i++) {
      const a = it[i]; if (!a.on) continue;
      for (let j = i + 1; j < it.length; j++) {
        const b = it[j]; if (!b.on) continue;
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, dd = Math.hypot(dx, dy, dz), m = a.r + b.r;
        if (dd >= m || dd < 1e-5) continue;
        const nx = dx / dd, ny = dy / dd, nz = dz / dd, push = (m - dd) / 2;
        a.x -= nx * push; a.z -= nz * push; b.x += nx * push; b.z += nz * push; if (ny > 0.3) b.y += ny * push * 2;
        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny + (b.vz - a.vz) * nz;
        if (rel < 0) { const k = -rel * 0.9; a.vx -= nx * k; a.vy -= ny * k; a.vz -= nz * k; b.vx += nx * k; b.vy += ny * k; b.vz += nz * k; if (o.onBounce && -rel > 0.25) o.onBounce(b, -rel * 0.5); }
      }
    }
  }
}

// ------------------------------------------------------------------ textures --
let _radial = null;
// A soft round spot (white, alpha falling to nothing at the edge), shared.
export function radialTexture() {
  if (_radial) return _radial;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.62)'); r.addColorStop(0.7, 'rgba(255,255,255,0.18)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return (_radial = new THREE.CanvasTexture(c));
}
// A texture drawn once with a 2D canvas: canvasTexture(w, h, (g, w, h) => { ... }).
export function canvasTexture(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ------------------------------------------------------------------ sound --
// One voice per work: a bus into the game's mix (dry, and a little into the room's echo), panned and made quieter
// the further the camera is from the work. Nothing is made until the sound has been started by the player.
class Voice {
  constructor(L) { this.L = L; this.bus = null; this.pan = null; this.level = 1; }
  get ctx() { const s = this.L.k.sound; return s && s.ctx && s.ctx.state === 'running' && s.master ? s.ctx : null; }
  out() {
    const c = this.ctx; if (!c) return null;
    if (!this.bus) {
      const s = this.L.k.sound; this.bus = c.createGain(); this.bus.gain.value = this.level;
      this.pan = c.createStereoPanner ? c.createStereoPanner() : null;
      const into = this.pan || this.bus; if (this.pan) this.pan.connect(this.bus);
      this.bus.connect(s.dry || s.master); if (s.send) { const w = c.createGain(); w.gain.value = 0.35; this.bus.connect(w); w.connect(s.send); }
      this.into = into;
    }
    return this.into;
  }
  // The level by distance from the camera to (x, z) (default: the work), and the pan from where that is on screen.
  place(x = this.L.cx, z = this.L.cz, reach = 12) {
    const c = this.ctx; if (!c || !this.bus) return;
    const cam = this.L.k.G.camera, d = Math.hypot(cam.position.x - x, cam.position.z - z);
    this.bus.gain.setTargetAtTime(this.level * Math.max(0, 1 - d / reach), c.currentTime, 0.1);
    if (this.pan) { cam.getWorldDirection(_V); const rx = -_V.z, rz = _V.x, l = Math.hypot(rx, rz) || 1; this.pan.pan.setTargetAtTime(Math.max(-0.8, Math.min(0.8, ((x - cam.position.x) * rx + (z - cam.position.z) * rz) / l / Math.max(1, d))), c.currentTime, 0.08); }
  }
  // A tone: freq (Hz), dur (s); { at (s from now), vol, type, to (Hz to glide to), attack }
  note(freq, dur = 0.3, { at = 0, vol = 0.05, type = 'sine', to = 0, attack = 0.008 } = {}) {
    const c = this.ctx, out = this.out(); if (!c || !out) return;
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  // A bird's chirp: a quick sweep from f0 to f1 with a flutter on it.
  chirp(f0, f1, dur = 0.08, { at = 0, vol = 0.03, flutter = 0 } = {}) {
    const c = this.ctx, out = this.out(); if (!c || !out) return;
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(50, f1), t + dur);
    if (flutter) { const m = c.createOscillator(), mg = c.createGain(); m.frequency.value = flutter; mg.gain.value = f0 * 0.06; m.connect(mg); mg.connect(o.frequency); m.start(t); m.stop(t + dur + 0.02); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.012, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.03);
  }
  // A melody in carols.js's notation ('F#5 A5:2 R | ...', C4 middle C). Pre-1900 music only. Returns its length (s).
  tune(mel, { bpm = 90, type = 'triangle', vol = 0.05, at = 0, legato = 0.9 } = {}) {
    const { notes, len } = parse(mel), b = 60 / bpm;
    for (const n of notes) if (n.m) this.note(440 * Math.pow(2, (n.m - 69) / 12), Math.max(0.12, n.d * b * legato), { at: at + n.t * b, vol, type, attack: 0.02 });
    return len * b;
  }
  // Noise through filters, for rain, wind, a rustle; or a held tone. l = voice.loop({...}); l.set(vol) each frame.
  loop(o) { return this.L.k.loop(o); }
  bell(freq, at = 0, vol = 0.04, decay = 3) { const s = this.L.k.sound, c = this.ctx; if (c && s.bell) s.bell(freq, c.currentTime + at, vol, decay); }
}

// ------------------------------------------------------------------ a life --
const LIVES = [], SPECS = [];
let FREEZE = false;
export function lifeFor(id, spec) { SPECS.push({ id, ...spec }); }

class Life {
  constructor(spec, art, k) {
    this.spec = spec; this.id = spec.id; this.word = spec.word || ''; this.art = art; this.k = k; this.THREE = THREE;
    this.room = k.plan.byId[art.room]; this.y = this.room ? this.room.y : art.fy || 0;
    this.rand = rng(spec.id * 7 + 13);
    this.state = 'off'; this.made = false; this.t = 0; this.r = 0; this.wake = 0; this.ret = 0; this.phase = 'off'; this.looking = false; this.lingerT = 0;
    this.wakeDur = spec.wake || 2; this.retDur = spec.ret || 1.5; this.settle = spec.settle || SETTLE;
    this.measure();
    // The look frames the work with its floor in front (main.js, studyCam): set now, so the very first look has it.
    const st = spec.stage || {};
    if (st !== false) {
      art.floorFrame = { y: this.y, out: st.out || 1.8, half: st.half || Math.max(this.hw + 0.4, 1.2), above: st.above || 0.12 };
      // The look camera for a life: low (a child's eye, or a toy's on a box), near, a little to one side, looking at the
      // floor in front and the foot of the work, so what comes out fills the view; the top of a big work may crop.
      // stage.cam = { dist, side, height, lookU, lookOut, lookH } overrides any of it; cam: false keeps the wide view.
      // A work under 1.2 m high is kept whole in view (cam.floorOut: how far out the floor must show below it).
      if (st.cam !== false) {
        const c = st.cam || {}, foot = this.bottom - this.y;
        art.floorFrame.cam = { dist: c.dist || 2.2, side: c.side == null ? 0.4 : c.side, height: c.height || 0.8, fov: c.fov || 48,
          lookU: c.lookU == null ? 0.05 : c.lookU, lookOut: c.lookOut == null ? 0.4 : c.lookOut, lookH: c.lookH == null ? Math.max(0.5, Math.min(0.9, foot * 0.85)) : c.lookH };
        if (this.art.h < 1.2 && c.whole !== false) this.wholeWork(art.floorFrame.cam, c.floorOut == null ? 1.0 : c.floorOut);
      }
    }
    this.ms = 0;
  }
  // A small work is never cropped: the look camera keeps the whole of it in view (the top of its frame, and a little
  // over), with the floor in front out to floorOut below it. If the camera as asked cannot, it is tilted, and then
  // moved back, until it can; the work then sits in the upper part of the view, what comes out of it below.
  wholeWork(cam, floorOut) {
    const H = cam.height, topY = this.crown + 0.1 - this.y;
    const top = d => Math.atan2(topY - H, d), low = d => -Math.atan2(H, Math.max(0.05, d - floorOut));
    let D = cam.dist, pitch = Math.atan2(cam.lookH - H, D - cam.lookOut), F = cam.fov * Math.PI / 180 * 0.94;
    if (top(D) <= pitch + F / 2 && low(D) >= pitch - F / 2) return;      // it fits as it is
    // First a wider view (up to 62°), so the show stays near and big; only then step back.
    while (top(D) - low(D) > F && cam.fov < 62) { cam.fov += 1; F = cam.fov * Math.PI / 180 * 0.94; }
    while (top(D) - low(D) > F && D < 8) D += 0.05;
    // The pitch that keeps both the top of the work and the floor in view: between top - F/2 and low + F/2.
    pitch = Math.min(low(D) + F / 2, Math.max(top(D) - F / 2, pitch));
    cam.dist = D; cam.lookH = H + Math.tan(pitch) * (D - cam.lookOut);
  }
  measure() {
    const a = this.art, G = placeGuard(a).uLifeR.value;
    this.cx = G[0].x; this.cy = G[0].y; this.cz = G[0].z;
    this.tx = G[1].x; this.tz = G[1].y; this.nx = G[1].z; this.nz = G[1].w;
    this.hw = a.w / 2; this.hh = a.h / 2; this.fw = Math.max(0.05, a.frame || 0.1);
    this.bottom = this.cy - this.hh; this.top = this.cy + this.hh; this.rail = this.bottom - this.fw; this.crown = this.top + this.fw;
    const R = this.room; let wall = 0.04;
    if (R) { if (Math.abs(this.nx) > 0.5) wall = Math.abs(this.cx - (this.nx < 0 ? R.x1 : R.x0)); else wall = Math.abs(this.cz - (this.nz < 0 ? R.z1 : R.z0)); }
    this.wall = Math.min(0.25, wall);
  }
  at(u, v, out, into = new THREE.Vector3()) { return into.set(this.cx + this.tx * u + this.nx * out, this.cy + v, this.cz + this.tz * u + this.nz * out); }
  floor(u, out, into = new THREE.Vector3()) { return into.set(this.cx + this.tx * u + this.nx * out, this.y, this.cz + this.tz * u + this.nz * out); }
  local(x, z) { const dx = x - this.cx, dz = z - this.cz; return { u: dx * this.tx + dz * this.tz, out: dx * this.nx + dz * this.nz }; }
  // The way along/out of the wall as a yaw (for rig.put): facing out of the wall is L.yawOut.
  get yawOut() { return Math.atan2(this.nx, this.nz); }
  yawOf(du, dout) { return Math.atan2(this.tx * du + this.nx * dout, this.tz * du + this.nz * dout); }
  hides(x, y, z, r = 0, only = null) { return hides(this.art, this.k.G.camera.position, x, y, z, r, only); }
  mat(m, o) { return protectArt(m, this.art, o); }
  add(obj, parent = this.group) {
    const g = guardOf(this.art);
    obj.traverse(o => {
      for (const m of [].concat(o.material || [])) protectArt(m, this.art, { soft: m.transparent ? 0.08 : 0.05 });
      o.frustumCulled = false;
      // the guard's pixel size, for the target and camera this is about to be drawn with (the screen, the floor's
      // reflection, a check)
      if (o.material) { const prev = o.onBeforeRender; o.onBeforeRender = function (r, sc, cam) { r.getCurrentViewport(_vp); g.uLifePx.value = Math.max(1, _vp.w * cam.projectionMatrix.elements[5] * 0.5); if (prev) prev.apply(this, arguments); }; }
    });
    parent.add(obj); return obj;
  }
  // A standard material in vertex colours that glows a little in them (the galleries are dark at night).
  paint({ rough = 0.6, glow = 0.32, flat = false, metal = 0, side = THREE.FrontSide } = {}) {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rough, metalness: metal, flatShading: flat, emissive: 0xffffff, emissiveIntensity: glow, side });
    m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;'); };
    m.customProgramCacheKey = () => 'lifepaint';
    return protectArt(m, this.art, { soft: 0.05 });
  }
  rig(maxInstances, maxVerts, material) { const r = new Rig(this, maxInstances, maxVerts, material); this.add(r.mesh); return r; }
  rollers(n, o) { return new Rollers(this, n, o); }
  // Something flat: { w, d (metres), u, out (where its middle is), map, color, opacity, additive, wall (on the wall
  // behind the canvas instead of the floor), material (your own) }. Lies 1 cm clear of what it is on.
  decal({ w = 1, d = 1, u = 0, out = 1, v = 0, map = null, color = 0xffffff, opacity = 1, additive = false, wall = false, material = null, parent = null } = {}) {
    const mat = material || new THREE.MeshBasicMaterial({ map, color, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    if (wall) { this.at(u, v, -this.wall * 0.5, m.position); m.rotation.y = this.yawOut; }
    else { this.floor(u, out, m.position); m.position.y += 0.012; m.rotation.set(-Math.PI / 2, this.yawOut, 0, 'YXZ'); }       // (its width along the wall, its top towards the wall)
    m.renderOrder = 3; this.add(m, parent || this.group); return m;
  }
  // A pool of light: an additive soft spot. g.set(amount) to fade it.
  glow({ w = 1.6, d = 1.2, u = 0, out = 0.9, v = 0, color = 0xffc890, wall = false, strength = 0.5 } = {}) {
    const m = this.decal({ w, d, u, out, v, map: radialTexture(), color, opacity: 0, additive: true, wall });
    m.set = a => { m.material.opacity = strength * a; m.visible = a > 0.002; };
    return m;
  }
  // The polished floor's reflection, for something on the floor that shows it (a puddle): the uniforms to sample it
  // (tRefl, reflMatrix: world to its texture, reflOn, reflY: the floor it is laid on), and the mesh is kept out of the
  // reflection's own drawing (it cannot read the picture it is being drawn into). The mirror shows and hides it for
  // that, so show and hide such a mesh by its material.visible, not its own.
  mirrored(mesh) {
    const M = this.k.G.mirror; if (M && this.k.museum.floors && !this.k.museum.floors.includes(mesh)) this.k.museum.floors.push(mesh);
    return { tRefl: { value: M ? M.rt.texture : null }, reflMatrix: { value: M ? M.matrix : new THREE.Matrix4() }, reflOn: M ? M.strength : { value: 0 }, reflY: M ? M.level : { value: this.y } };
  }
  // Several pools of light in one draw call: list = [{ w, d, u, out, v, color, wall, strength }] (as glow); g.set(i, a).
  glows(list) {
    const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }), list.length);
    const M = new THREE.Matrix4(), V = new THREE.Vector3(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), E = new THREE.Euler(), C = new THREE.Color(), base = [];
    list.forEach((o, i) => {
      if (o.wall) { this.at(o.u || 0, o.v || 0, -this.wall * 0.5, V); E.set(0, this.yawOut, 0); }
      else { this.floor(o.u || 0, o.out == null ? 0.9 : o.out, V); V.y += 0.013 + i * 0.001; E.set(-Math.PI / 2, this.yawOut, 0, 'YXZ'); }
      m.setMatrixAt(i, M.compose(V, Q.setFromEuler(E), S.set(o.w || 1.6, o.d || 1.2, 1)));
      base.push(new THREE.Color(o.color == null ? 0xffc890 : o.color).multiplyScalar(o.strength == null ? 0.5 : o.strength)); m.setColorAt(i, C.setScalar(0));
    });
    m.renderOrder = 3; this.add(m);
    m.set = (i, a) => { m.setColorAt(i, C.copy(base[i]).multiplyScalar(Math.max(0, a))); m.instanceColor.needsUpdate = true; };
    return m;
  }
  voice() { return this._voice || (this._voice = new Voice(this)); }
  // "Reduce motion and flashing" (Settings) is on: a show keeps its promise too. No flash, no pulse of brightness faster
  // than about one a second, spins and whirls at about half speed, no sudden loud first sound.
  get calm() { const m = this.k && this.k.museum; return !!(m && m.calm); }
  // Soft contact shadows on the floor under things that sit or roll there: b = L.blobs(n); b.set(i, x, z, radius,
  // darkness 0..1) each frame for the ones in use, b.count = how many. One draw call.
  // (fade: true makes a blob's darkness follow the k given to set(); without it every blob is full strength, which is
  // what the first shows were tuned with.)
  blobs(n, { y = this.y + 0.011, fade = false } = {}) {
    const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2);
    const m = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: radialTexture(), transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, fog: false }), n);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0; m.renderOrder = 2;
    const M = new THREE.Matrix4(), V = new THREE.Vector3(), S = new THREE.Vector3(), Q = new THREE.Quaternion(), C = new THREE.Color();
    m.set = (i, x, z, r, k = 1) => { m.setMatrixAt(i, M.compose(V.set(x, y, z), Q, S.set(r * 2, 1, r * 2))); m.setColorAt(i, C.setScalar(k)); m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; };
    // (darkness rides on the instance colour: black times k is still black, so it scales the alpha instead)
    m.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <alphamap_fragment>', '#include <alphamap_fragment>\n#if defined( USE_COLOR ) && defined( LIFE_BLOB_FADE )\n  diffuseColor.a *= vColor.r;\n  diffuseColor.rgb = vec3(0.0);\n#endif'); };
    if (fade) m.material.defines = { ...(m.material.defines || {}), LIFE_BLOB_FADE: '' };
    m.material.customProgramCacheKey = () => 'lifeblobs' + (fade ? 'f' : '');
    this.add(m);      // (after its own shader patch, so the guard wraps it: set the other way round, the patch replaced the guard)
    m.setColorAt(0, C.setScalar(1));
    return m;
  }

  // ---- lifecycle (the kit runs these) ----
  async prepare() {
    if (this.made) return this._ready;
    this.made = 'pending';
    this._ready = (async () => {
      this.pal = await palette(this.art);
      this.group = new THREE.Group(); this.group.name = 'life:' + this.id; this.group.visible = false; this.k.group.add(this.group);
      this.fixed = new THREE.Group(); this.fixed.name = 'life-fixed:' + this.id; this.k.group.add(this.fixed);
      // (Not for src/stream.js: a show's meshes move, and are counted by where they lay when it found them. On a phone a
      // rig counted at rest was taken for something far away and never drawn. The kit lets its own shows go: release().)
      this.group.userData.always = this.fixed.userData.always = true;
      if (!this._keys) this._keys = new Set(Object.keys(this.spec));      // (what the spec was before it built: release() clears the rest)
      try { this.spec.build(this); this.made = true; this.usedAt = performance.now(); } catch (e) { console.error('paintlife ' + this.id + ': ' + (e && e.stack || e)); this.made = 'broken'; return; }
      // Compile its shaders now, off the main thread where the browser can, so the first show does not stutter.
      const G = this.k.G, r = G.renderer;
      if (r && r.compileAsync && G.camera) { const v = this.group.visible; this.group.visible = true; const done = () => { this._compiling = 0; }; this._compiling = performance.now(); r.compileAsync(this.group, G.camera, G.scene).then(done, done); this.group.visible = v; }
    })();
    return this._ready;
  }
  begin(resumed) {
    this.measure(); placeGuard(this.art);
    // One show at a time in a room: anything another work left out for the toy goes back as this one begins.
    for (const L of LIVES) if (L !== this && L.state === 'linger' && L.art.room === this.art.room) L.toReturn();
    this.state = 'show'; this.phase = resumed ? 'play' : 'wake'; this.t = resumed ? this.wakeDur : 0; this.r = 0; this.ret = 0; this.wake = resumed ? 1 : 0;
    this.group.visible = true;
    if (this.spec.start) this.spec.start(this, !!resumed);
  }
  toReturn() {
    this.state = 'return'; this.phase = 'return'; this.r = 0; this.ret = 0;
    if (this.spec.back) this.spec.back(this);
  }
  finish() {
    if (this.spec.end) this.spec.end(this);
    if (this.spec.keep && this.spec.keep(this)) { this.state = 'after'; this.phase = 'after'; }
    else { this.state = 'off'; this.phase = 'off'; this.group.visible = false; }
  }
  // One frame. looking: the player is looking at this work just now (or a test says so).
  step(dt, looking) {
    if (this.made !== true) return;
    if (this.force != null) looking = this.force;
    if (FREEZE || this.frozen) dt = 0;
    const G = this.k.G, settled = looking && (this.force != null || (G.study && G.study.t >= this.settle));
    this.looking = looking;
    const sp = this.spec, lg = sp.linger;
    switch (this.state) {
      case 'off': if (!settled) return; this.begin(false); break;
      case 'after': if (settled) this.begin(false); break;
      case 'linger': if (settled) { this.begin(true); break; }
        this.lingerT += dt;
        if (this.lingerT > lg.max || Math.hypot(G.vehicle.pos.x - this.cx, G.vehicle.pos.z - this.cz) > lg.near) this.toReturn();
        break;
      case 'show': if (!looking) { if (lg) { this.state = 'linger'; this.phase = 'linger'; this.lingerT = 0; } else this.toReturn(); } break;
      case 'return': break;
    }
    const t0 = performance.now();
    if (this.state === 'show') { this.t += dt; this.wake = ease.smooth(this.t / this.wakeDur); this.phase = this.t < this.wakeDur ? 'wake' : 'play'; }
    else if (this.state === 'return') { this.r += dt; this.ret = clamp01(this.r / this.retDur); }
    try { if (sp.update) sp.update(this, dt); } catch (e) { console.error('paintlife ' + this.id + ': ' + (e && e.stack || e)); this.made = 'broken'; this.group.visible = false; return; }
    if (this.state === 'return' && this.r >= this.retDur) this.finish();
    else if (this.state === 'after' && !(sp.keep && sp.keep(this))) { this.state = 'off'; this.phase = 'off'; this.group.visible = false; }
    this.ms = this.ms * 0.9 + (performance.now() - t0) * 0.1;
  }
  get running() { return this.state !== 'off'; }
  // Let it all go (meshes, materials, textures, and whatever the spec kept from its build): it is built again, the same
  // way, the next time the toy comes near. Only while nothing of it is out (off).
  release() {
    if (this.made !== true || this.state !== 'off' || this.force != null) return false;
    if (this._compiling && performance.now() - this._compiling < 15000) return false;      // (its shaders are still being compiled: a material let go now is one the renderer comes back to ask after, and that is a page error)
    for (const grp of [this.group, this.fixed]) {
      if (!grp) continue;
      grp.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        for (const m of [].concat(o.material || [])) { for (const key in m) { const x = m[key]; if (x && x.isTexture) x.dispose(); } m.dispose(); }
        if (o.isBatchedMesh || o.isInstancedMesh) o.dispose && o.dispose();
      });
      grp.removeFromParent();
    }
    if (this._keys) for (const key of Object.keys(this.spec)) if (!this._keys.has(key)) delete this.spec[key];
    this.group = this.fixed = null; this.made = false; this._ready = null;
    return true;
  }
  reset() {
    if (this.made !== true) return;
    this.state = 'off'; this.phase = 'off'; this.group.visible = false; this.force = null; this.frozen = false;
    if (this.spec.reset) try { this.spec.reset(this); } catch (e) { console.error('paintlife ' + this.id + ': ' + (e && e.stack || e)); }
  }
}

// ------------------------------------------------------------------ the exposed works' labels --
// The story's clue: the visitors' green light is what wakes a painting, and the works it has touched give it back,
// faintly, round the edges of their wall labels, as if the card were lit from behind. Only the label: never the work.
// A ring with the card’s own shape cut out of it, 1 cm in front of the card’s plane (clear of the wall: no shimmer), breathing slowly (still when
// motion is reduced). It is there from the start, lit room or dark, so a sharp eye finds the living works before they move.
const GLOW = 0.9, GLOW_RIM = 0.06;
function exposedCards(museum, arts) {
  const cards = museum && museum.cards; if (!cards || !arts.length) return null;
  const M = new THREE.Matrix4(), P = new THREE.Vector3(), Q = new THREE.Quaternion(), S = new THREE.Vector3();
  const pos = [], at = new Map();
  for (const a of arts) {
    cards.getMatrixAt(a.i, M); M.decompose(P, Q, S);
    if (S.x < 0.01) continue;                                   // a work with no card
    a.exposed = true; if (museum._paint) museum._paint(a);       // the card itself takes a green cast, dark or lit
    // Out into the room along the work's normal (the card is a hair off the wall; its own +z is no guide).
    at.set(a, pos.length);
    pos.push([P.clone().add(new THREE.Vector3(a.nx, 0, a.nz).multiplyScalar(0.01)), Q.clone(), S.x, S.y]);
  }
  if (!pos.length) return null;
  const cw = pos[0][2], ch = pos[0][3], W = cw + 2 * GLOW_RIM, H = ch + 2 * GLOW_RIM, px = 900;
  const tex = canvasTexture(Math.round(W * px), Math.round(H * px), (g, w, h) => {
    const img = g.createImageData(w, h), hx = cw * px / 2 + 1.5, hy = ch * px / 2 + 1.5, s = GLOW_RIM * px * 0.62;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = Math.max(0, Math.abs(x + 0.5 - w / 2) - hx), dy = Math.max(0, Math.abs(y + 0.5 - h / 2) - hy), d = Math.hypot(dx, dy);
      const o = (y * w + x) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = 255;
      img.data[o + 3] = dx === 0 && dy === 0 ? 0 : Math.round(255 * Math.exp(-(d / s) * (d / s)) * Math.min(1, (d + 0.6) / 2));
    }
    g.putImageData(img, 0, 0);
  }, false);
  // Normal blending, not additive: added to a lit cream wall a faint green vanishes into the white.
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.2, 1.0, 0.36), transparent: true, opacity: GLOW, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, pos.length);
  pos.forEach(([p, q], i) => m.setMatrixAt(i, M.compose(p, q, S.set(W, H, 1))));
  m.frustumCulled = false; m.renderOrder = 5;
  museum.group.add(m);
  // One work's ring put out or lit again (src/entry.js: the work in the entrance hall has not been touched until the scan).
  m.userData.expose = (a, on) => {
    const i = at.get(a); if (i == null) return false;
    const [p, q] = pos[i]; m.setMatrixAt(i, on ? M.compose(p, q, S.set(W, H, 1)) : M.compose(p, q, S.set(0, 0, 0))); m.instanceMatrix.needsUpdate = true;
    a.exposed = !!on; if (museum._paint) museum._paint(a);
    return true;
  };
  return m;
}

// ------------------------------------------------------------------ the hook --
feature({
  id: 'paintlife',
  get secrets() { return SPECS.flatMap(s => s.secrets || []); },
  init(k) {
    this.k = k; MUSEUM = k.museum;
    for (const s of SPECS) {
      const art = k.museum.arts.find(a => a.work.id === s.id) || (s.title ? k.museum.arts.find(a => s.title.test(a.work.t || '')) : null);
      if (!art || art.work.c || art.obj || art.mini || art.nx == null) continue;       // not hung tonight, in copyright, or not a picture
      LIVES.push(new Life(s, art, k));
    }
    this.byArt = new Map(LIVES.map(L => [L.art, L]));
    this.exposed = exposedCards(k.museum, LIVES.map(L => L.art));
    this.byRoom = new Map(); for (const L of LIVES) { if (!this.byRoom.has(L.art.room)) this.byRoom.set(L.art.room, []); this.byRoom.get(L.art.room).push(L); }
    this.rid = undefined;
    if (typeof window !== 'undefined') window.__life = debugApi(k);
    if (typeof location !== 'undefined' && /[?&]lifecheck\b/.test(location.search)) autoCheck(k);
  },
  active() { return LIVES.length > 0; },
  update(dt, k) {
    // Lazily: build a work's animation the first time the toy is in its room or the next one through a door.
    const rid = k.G.roomId;
    if (rid !== this.rid) {
      this.rid = rid;
      if (rid) { const near = [rid, ...k.plan.doorsOf(rid).map(d => (d.a === rid ? d.b : d.a))]; for (const r of near) for (const L of this.byRoom.get(r) || []) if (!L.made) L.prepare(); }
    }
    const look = k.looking, seen = look && this.byArt.get(look);
    if (seen && !seen.made) seen.prepare();
    // The near, low look camera crops the top of a big work. Not while the work is the Director's clue (src/secret.js):
    // the part to touch must be on the screen, so then the look keeps the whole work in view.
    if (look !== this.lookArt) {
      this.lookArt = look;
      if (seen && seen.art.floorFrame) { const S = k.G.secret, clue = !!(S && S.enabled && !S.open && S.clue && S.clue.art === seen.art); if (seen.cam === undefined) seen.cam = seen.art.floorFrame.cam || null; seen.art.floorFrame.cam = clue ? null : seen.cam; }
    }
    for (const L of LIVES) if (L.state !== 'off' || L === seen || L.force != null) L.step(dt, L === seen);
    // And the other way: a work's animation not seen for a while, far off or on another floor, is let go (built again
    // when you come back); and only a few are kept built at once, the ones you were near most recently.
    if ((this.relT = (this.relT || 0) + dt) > 2) {
      this.relT = 0;
      const p = k.G.vehicle.pos, now = performance.now(), built = [];
      for (const L of LIVES) {
        if (L.made !== true) continue;
        const far = Math.hypot(p.x - L.cx, p.z - L.cz) > 45 || Math.abs(p.y - L.y) > 3;
        if (!far || L.state !== 'off') L.usedAt = now;
        else if (LOWMEM && now - (L.usedAt || 0) > 20000) { L.release(); continue; }      // (only where memory is short: on a computer a show stays built, so coming back to it does not stall)
        built.push(L);
      }
      const CAP = LOWMEM ? 4 : 1e9;
      if (built.length > CAP) for (const L of built.sort((a, b) => a.usedAt - b.usedAt).slice(0, built.length - CAP)) if (L !== seen) L.release();
    }
    if (this.exposed) { this.glowT = (this.glowT || 0) + dt; this.exposed.material.opacity = k.museum.calm ? GLOW : GLOW * (0.8 + 0.2 * Math.sin(this.glowT * 1.1)); }
  },
  spots(k) {
    return LIVES.flatMap(L => (L.spec.secrets || []).map(([id, name]) => ({ kind: 'secret', id, name, x: L.cx + L.nx * 1.4, y: L.y, z: L.cz + L.nz * 1.4 })));
  },
  reset() { for (const L of LIVES) L.reset(); },
  // For src/entry.js (the saucer that scans the work in the entrance hall).
  // lifeOf: the Life of a work hung tonight (or undefined). expose: its label's green light, on or off (the same ring and
  // the same cast on the card as every living work's; all of them are on from the start). wake: its show begun without a
  // look, by the same step() a look drives, and let go again (it then goes back as it does when a look ends).
  lifeOf(art) { return this.byArt && this.byArt.get(art); },
  expose(art, on) { return !!(this.exposed && this.exposed.userData.expose(art, on)); },
  wake(art, on) {
    const L = this.lifeOf(art); if (!L) return false;
    if (on) { if (!L.made) L.prepare(); L.force = true; } else if (L.force === true) L.force = null;
    return true;
  },
});

// ------------------------------------------------------------------ checks and test aids --
// window.__life: list(), ready(id), pose(id, t, { ret }), free(id), cams(id), check(id), stats(id).
const DT = 1 / 30;
function lifeOf(id) { return LIVES.find(L => L.id === id); }
function cameras(L, k) {
  const R = L.room, y = L.y, h = R ? (R.ceil || R.h || 4) : 4, P = (u, out, up) => { const p = L.floor(u, out); p.y = y + up; if (R) { p.x = Math.max(R.x0 + 0.2, Math.min(R.x1 - 0.2, p.x)); p.z = Math.max(R.z0 + 0.2, Math.min(R.z1 - 0.2, p.z)); } return p.toArray(); };
  const C = [L.cx, L.cy, L.cz], depth = R ? (Math.abs(L.nx) > 0.5 ? R.x1 - R.x0 : R.z1 - R.z0) : 6, width = R ? (Math.abs(L.nx) > 0.5 ? R.z1 - R.z0 : R.x1 - R.x0) : 6;
  const st = L.art.floorFrame || { out: 1.6 };
  return {
    look: null,                                                                              // filled in from a real look (see check)
    low: { at: P(0.2, 1.7, 0.2), look: C, fov: 50 },                                        // the toy's eye, on the floor, looking up at the work
    toy: { at: P(0.35, st.out + 0.7, 0.22), look: L.floor(0, 0.55).setY(y + 0.42).toArray(), fov: 50 },      // the toy's eye, on what is on the floor
    lowside: { at: P(L.hw + 1.1, 1.0, 0.3), look: C, fov: 50 },
    slant: { at: P(-(L.hw + 1.6), 1.4, 1.3), look: C, fov: 50 },
    close: { at: P(0.25, 0.55, L.bottom - y - 0.3), look: C, fov: 60 },
    graze: { at: P(L.hw + 0.9, 0.3, L.cy - y), look: C, fov: 55 },
    high: { at: P(0.3, st.out + 1.3, Math.min(h - 0.3, 3.6)), look: L.floor(0, st.out * 0.5).toArray(), fov: 55 },
    wide: { at: P(width * 0.42, depth - 0.5, 1.6), look: L.floor(0, 0.8).setY(y + 1.0).toArray(), fov: 58 },
  };
}
// Run the life from a fresh start to show-time t (and ret seconds into its Return), then hold it there.
async function pose(id, t, { ret = null } = {}) {
  const L = lifeOf(id); if (!L) return false;
  await L.prepare(); if (L.made !== true) return false;
  L.frozen = false; L.quiet = true; L.rand = rng(L.id * 7 + 13); L.reset(); L.force = true;
  let tt = 0; L.step(0, true);
  while (tt < t - 1e-6) { const d = Math.min(DT, t - tt); L.step(d, true); tt += d; }
  if (ret != null) { L.force = false; L.step(0, false); if (L.state === 'linger') L.toReturn(); let r = 0; while (r < ret - 1e-6) { const d = Math.min(DT, ret - r); L.step(d, false); r += d; } }
  L.frozen = true; return true;
}
function stats(L) {
  let calls = 0, marks = 0, mats = 0, guarded = 0, open = [];
  const each = o => {
    if (!o.visible) return;
    if (o.isMesh || o.isPoints || o.isLine || o.isSprite) {
      calls++;
      if (o.isBatchedMesh) marks += o._instanceInfo ? o._instanceInfo.filter(i => i.active && i.visible).length : 0;
      else if (o.isInstancedMesh) marks += o.count;
      else if (o.isPoints) marks += Math.min(o.geometry.drawRange.count, o.geometry.attributes.position.count);
      else if (o.isLine) marks += Math.min(o.geometry.drawRange.count, o.geometry.attributes.position.count) / 2;
      else marks += 1;
      for (const m of [].concat(o.material)) { mats++; if (m.userData.lifeArt === L.art) guarded++; else open.push(o.name || o.type); }
    }
    for (const c of o.children) each(c);
  };
  if (L.group) each(L.group);
  return { calls, marks: Math.round(marks), mats, guarded, open, ms: +L.ms.toFixed(3) };
}
// Render the animation alone from camera cam into a small target and count its pixels that land on the work's canvas,
// or on any other canvas in the room, as the screen shows them (with the guard on, and, for comparison, off). The
// canvases are drawn first as a mask, and into the depth, so what is behind a canvas (in the wall) is not counted.
const _p = new THREE.Vector3();
function shoot(L, k, view, W = 320) {
  const G = k.G, r = G.renderer, H = Math.round(W * 9 / 16);
  const cam = new THREE.PerspectiveCamera(view.fov || 50, W / H, 0.03, 200);
  cam.position.fromArray(view.at); cam.up.set(0, 1, 0); cam.lookAt(_p.fromArray(view.look)); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const rt = shoot.rt || (shoot.rt = new THREE.WebGLRenderTarget(W, H)); rt.setSize(W, H);
  const mask = new Uint8Array(W * H * 4), buf = new Uint8Array(W * H * 4), g = guardOf(L.art);
  if (!L._quads) {
    L._quads = new THREE.Group();
    g.arts.forEach((a, i) => { const m = new THREE.Mesh(a.mesh.geometry, new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(i ? 0.5 : 1, i ? 0.5 : 1, i ? 0.5 : 1, THREE.LinearSRGBColorSpace), side: THREE.DoubleSide, toneMapped: false })); m.matrixAutoUpdate = false; L._quads.add(m); m.userData.art = a; });
  }
  for (const m of L._quads.children) { m.matrix.copy(m.userData.art.mesh.matrixWorld); m.material.colorWrite = true; }
  L._quads.updateMatrixWorld(true);
  const prevRT = r.getRenderTarget(), cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha(), auto = r.autoClear;
  r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.autoClear = true; r.render(L._quads, cam); r.readRenderTargetPixels(rt, 0, 0, W, H, mask);
  const count = off => {
    g.uLifeOff.value = off ? 1 : 0;
    for (const m of L._quads.children) m.material.colorWrite = false;
    r.autoClear = true; r.render(L._quads, cam); r.autoClear = false; r.render(L.group, cam);
    r.readRenderTargetPixels(rt, 0, 0, W, H, buf);
    let work = 0, others = 0, all = 0;
    for (let i = 0; i < W * H; i++) { if (buf[i * 4 + 3] < 8) continue; all++; const mk = mask[i * 4 + 3] > 8 ? mask[i * 4] : 0; if (mk > 200) work++; else if (mk > 60) others++; }
    return { work, others, all };
  };
  const on = count(false), off = count(true);
  g.uLifeOff.value = 0; r.setRenderTarget(prevRT); r.setClearColor(cc, ca); r.autoClear = auto;
  return { drawn: on.work, drawnOthers: on.others, wouldBe: off.work, wouldBeOthers: off.others, visible: on.all };
}
async function check(k, id, { times = [0.5, 1.5, 3, 5, 8, 12], rets = [0.4, 1.0], look = null } = {}) {
  const L = lifeOf(id); if (!L) return { id, error: 'not hung' };
  await L.prepare(); if (L.made !== true) return { id, error: 'did not build' };
  const views = cameras(L, k); views.look = look || lookCam(L, k);
  const rows = [];
  const run = async (t, ret) => { await pose(id, t, { ret }); for (const [name, v] of Object.entries(views)) rows.push({ cam: name, t, ret, ...shoot(L, k, v) }); };
  for (const t of times) await run(t, null);
  for (const r of rets) await run(8, r);
  const st = stats(L);
  L.frozen = false; L.force = null; L.quiet = false; L.reset();
  const bad = rows.filter(x => x.drawn > 0 || x.drawnOthers > 0), sum = (f, list = rows) => list.reduce((n, x) => n + f(x), 0);
  return { id, title: L.art.work.t, pass: !bad.length && !st.open.length, cams: Object.keys(views).length, frames: rows.length, canvases: guardOf(L.art).arts.length,
    drawnOnCanvas: sum(x => x.drawn), drawnOnOthers: sum(x => x.drawnOthers), badFrames: bad.length,
    lookCut: sum(x => x.wouldBe + x.wouldBeOthers, rows.filter(x => x.cam === 'look')), guardWorked: sum(x => x.wouldBe), guardWorkedOthers: sum(x => x.wouldBeOthers), stats: st, rows };
}
// The look camera as main.js's studyCam settles it (label away), for checks; a real look is better when there is one.
function lookCam(L, k) {
  const fc = L.art.floorFrame && L.art.floorFrame.cam;
  if (fc) { const p = L.floor(fc.side, fc.dist), q = L.floor(fc.lookU, fc.lookOut); return { at: [p.x, L.y + fc.height, p.z], look: [q.x, L.y + fc.lookH, q.z], fov: fc.fov || 46 }; }
  const a = L.art, cam = k.G.camera, fov = 46, tan = Math.tan(fov * Math.PI / 360), aspect = cam.aspect || 16 / 9, fl = a.floorFrame;
  let dist = Math.max(a.h * 1.3 / (2 * tan), a.w * 1.3 / (2 * tan * aspect), 1.1), eyeY = a.y, lookY = a.y;
  if (fl) {
    const ch = fl.y + 1.45, top = a.y + a.h / 2 + (fl.above || 0.12) - ch, low = fl.y - ch, half = Math.max(a.w / 2 + 0.15, fl.half), room = tan * aspect * 0.92;
    let d = dist; for (; d < 12; d += 0.05) if (Math.atan2(top, d) - Math.atan2(low, d - fl.out) <= fov * Math.PI / 180 * 0.9 && half / (d - fl.out) <= room * 1.4 && half / d <= room) break;
    dist = d; eyeY = ch; lookY = ch + Math.tan((Math.atan2(top, dist) + Math.atan2(low, dist - fl.out)) / 2) * dist;
  }
  const R = L.room; let x = a.x + a.nx * dist, z = a.z + a.nz * dist;
  if (R) { x = Math.max(R.x0 + 0.25, Math.min(R.x1 - 0.25, x)); z = Math.max(R.z0 + 0.25, Math.min(R.z1 - 0.25, z)); }
  return { at: [x, eyeY, z], look: [x - a.nx * dist, lookY, z - a.nz * dist], fov };
}
function debugApi(k) {
  return {
    list: () => LIVES.map(L => ({ id: L.id, title: L.art.work.t, room: L.art.room, word: L.word, state: L.state, made: L.made })),
    life: lifeOf,
    ready: async id => { const L = lifeOf(id); if (L) await L.prepare(); return !!L && L.made === true; },
    pose, cams: id => { const L = lifeOf(id); if (!L) return null; const c = cameras(L, k); c.look = lookCam(L, k); return c; },
    free: id => { const L = lifeOf(id); if (L) { L.frozen = false; L.force = null; L.quiet = false; } },
    // One step of dt seconds, looking or not, then held again (for films on a fixed clock: tools/lifesheet.mjs).
    // Skip the linger (things left out for the toy) and go straight back.
    release: id => { const L = lifeOf(id); if (L && L.state === 'linger') L.toReturn(); },
    advance: (id, dt, looking = true) => { const L = lifeOf(id); if (!L || L.made !== true) return; L.quiet = true; L.frozen = false; L.force = !!looking; L.step(dt, !!looking); L.frozen = true; },
    check: (id, o) => check(k, id, o),
    stats: id => { const L = lifeOf(id); return L ? stats(L) : null; },
    palette: id => { const L = lifeOf(id); return L && L.pal ? { src: L.pal.src, hex: L.pal.hex } : null; },
    set freeze(v) { FREEZE = !!v; }, get freeze() { return FREEZE; },
  };
}
// ?lifecheck (all works) or ?lifecheck=20684,111436: run the check once the game is up, and show the result.
function autoCheck(k) {
  const want = (new URLSearchParams(location.search).get('lifecheck') || '').split(',').map(Number).filter(Boolean);
  const go = async () => {
    if (!k.G.vehicle || k.G.state === 'loading') return setTimeout(go, 500);
    const out = [];
    for (const L of LIVES) if (!want.length || want.includes(L.id)) { const r = await check(k, L.id); delete r.rows; out.push(r); }
    window.__lifecheck = out; console.log('lifecheck', JSON.stringify(out));
    const el = document.createElement('pre'); el.id = 'lifecheck';
    el.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99;max-width:96vw;max-height:60vh;overflow:auto;margin:0;padding:8px 10px;border-radius:8px;background:rgba(8,12,18,.86);color:#e8f0e8;font:12px/1.4 ui-monospace,Menlo,monospace;pointer-events:none';
    el.textContent = 'paintings alive: the guard\n' + out.map(r => r.error ? `${r.id}  ${r.error}` : `${r.pass ? 'PASS' : 'FAIL'}  ${r.id} ${r.title.slice(0, 32)}  ${r.frames} frames from ${r.cams} cameras, ${r.canvases} canvases guarded; animation px on the work ${r.drawnOnCanvas}, on the others ${r.drawnOnOthers}; the guard cut ${r.guardWorked + r.guardWorkedOthers} px (look camera ${r.lookCut}), ${r.stats.calls} draw calls, ${r.stats.marks} marks${r.stats.open.length ? ', unguarded: ' + r.stats.open.join(' ') : ''}`).join('\n');
    document.body.append(el);
  };
  setTimeout(go, 1500);
}
