// Claude Monet, Stacks of Wheat (Sunset, Snow Effect) (1890–91), Gallery 243. The word: hiccup.
//
// He painted these stacks again and again, in every light, for a whole winter: the same two stacks, the hour and the
// weather changing. Look at this one and the floor below it becomes his field, rose and lavender snow laid in short
// strokes, in the low gold of a winter sunset (the glow on the wall round the frame is his sky). Then the stacks come
// out. The big one first, out from under the bottom rail, where it hangs a moment and hiccups, drops into the snow with
// a squash and hops into place; then the small one, as in the picture, and three littler ones, each with a hiccup of its
// own, the last one landing badly and wobbling. They stand in a row, each throwing a long blue shadow towards you, as
// his stacks do. A music box starts "Au clair de la lune". Then the hiccups go down the row, big to little, and the
// littlest has two more by itself (and the tune skips each time). Snow drifts out from under the frame and round its
// sides and comes down on them, and they grow snow caps, rose and violet in the light, and the light goes down: gold to
// rose to violet, the shadows growing longer, as it does from one of his canvases to the next. The big one hiccups and
// shakes its cap off in a puff. While you keep looking it goes on snowing softly and now and then one of them hiccups.
// When you stop, they hop back up to the rail one after another and in under the frame, caps and all, and the light goes.
//
// Snow never falls in front of the canvas: it comes out below the frame and beside it, and drifts out and down.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, shape } from '../paintlife.js';
import { strokes, softDot, tintedPaint } from './brush.js';
import { looper } from './tunes.js';

const OUT = 2.45, HALF = 1.6;                 // his field on the floor: out from the wall, either side of the middle (m)
const NF = 230;                               // snowflakes
// The stacks: where they stand (along, out), how tall (m), and when each comes out. The first two are his two.
const STACKS = [
  { u: -0.2, out: 1.18, S: 0.5, t0: 0.45 },
  { u: -0.84, out: 1.02, S: 0.36, t0: 1.35 },
  { u: 0.34, out: 1.1, S: 0.28, t0: 2.1 },
  { u: 0.74, out: 1.22, S: 0.22, t0: 2.65 },
  { u: 1.08, out: 1.06, S: 0.17, t0: 3.15 },
];
// Hiccups: [show-time, stack]. As they come out (each as it hangs under the rail), then down the row, then the littlest.
const HICS = [...STACKS.map((s, i) => [s.t0 + 0.38, i]), [5.0, 0], [5.36, 1], [5.62, 2], [5.82, 3], [5.97, 4], [6.65, 4], [7.05, 4], [7.75, 0], [8.4, 2]];
const IDLE0 = 9.2, IDLE = 2.4;               // and while you keep looking, one every couple of seconds
const SNOW0 = 3.4, CAP0 = 4.4;
// Au clair de la lune (French, 18th century), on a music box, in G.
const LUNE = (() => {
  const A = 'G5 G5 G5 A5 B5:2 A5:2 G5 B5 A5 A5 G5:4', B = 'A5 A5 A5 A5 E5:2 E5:2 A5 G5 F#5 E5 D5:4', out = []; let t = 0;
  for (const line of [A, A, B, A]) for (const tok of line.split(' ')) { const [n, d] = tok.split(':'), len = d ? +d : 1; out.push([t, n, len * 0.9]); t += len; }
  for (let b = 0; b < 64; b += 4) out.push([b, [ 'G3', 'G3', 'D4', 'G3', 'G3', 'G3', 'D4', 'G3', 'D4', 'D4', 'A3', 'D4', 'G3', 'G3', 'D4', 'G3'][b / 4], 3, 0.55]);
  return out;
})();
const GOLD = new THREE.Color(), ROSE = new THREE.Color(), VIOLET = new THREE.Color();

lifeFor(81545, {
  title: /^Stacks of Wheat \(Sunset, Snow Effect\)/,
  word: 'hiccup',
  stage: { out: 1.9, half: 1.5 },
  wake: 2, ret: 2.8,

  build(L) {
    const P = L.pal, col = (h, a = 0.3) => P.near(h, a);
    GOLD.copy(col('#f4b45a', 0.15)); ROSE.copy(col('#ec8c98', 0.2)); VIOLET.copy(col('#9c88d8', 0.2));
    this.v = new THREE.Vector3(); this.w = new THREE.Vector3(); this.c = new THREE.Color(); this.sc = new THREE.Vector3();
    // ---------------------------------------------------------- his field, the low sun on it, the long shadows; his sky on the wall
    const tex = strokes({
      size: 512, seed: 81545, n: 3000, len: [14, 36], width: [4, 9], bend: 0.22, lift: 0.18, base: col('#c4b0cc', 0.3).getStyle(),
      colors: [['#d8b8c8', 3], ['#c8b0d8', 3], ['#b4b8e0', 2.4], ['#e8d0d0', 2], ['#f0dcc8', 1.4], ['#a898d0', 1.6], ['#9aa8d8', 1.2], ['#f2c890', 0.8], ['#e8a8a0', 0.9]].map(([c, w]) => [col(c).getStyle(), w]),
      angle: (x, y, r) => (r() - 0.5) * 0.5 + (r() < 0.15 ? 0.7 : 0),
    });
    const fw = L.hw + 0.95, fh = L.hh + 0.75;          // the glow round the frame, on the wall
    const pos = [], wall = [];
    const quad = (a, b, c, d, k) => { pos.push(...a, ...b, ...c, ...a, ...c, ...d); for (let i = 0; i < 6; i++) wall.push(k); };
    const F = (u, o) => L.floor(u, o, new THREE.Vector3()).toArray(), Wp = (u, vv) => L.at(u, vv, -L.wall + 0.004, new THREE.Vector3()).toArray();
    quad(F(-HALF, -L.wall), F(HALF, -L.wall), F(HALF, OUT), F(-HALF, OUT), 0);
    quad(Wp(-fw, -fh), Wp(fw, -fh), Wp(fw, fh), Wp(-fw, fh), 1);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aWall', new THREE.Float32BufferAttribute(wall, 1));
    const ax = new THREE.Vector4(L.tx, L.tz, L.nx, L.nz);
    const u = this.u = {
      uSpread: { value: 0 }, uSnow: { value: 0 }, uLight: { value: new THREE.Color() }, uLightK: { value: 0 }, uLen: { value: 1.3 }, tStroke: { value: tex },
      uO: { value: L.floor(0, -L.wall) }, uAx: { value: ax }, uSize: { value: new THREE.Vector2(HALF, OUT + L.wall) }, uC: { value: new THREE.Vector3(L.cx, L.cy, L.cz) }, uFrame: { value: new THREE.Vector2(fw, fh) },
      uStk: { value: STACKS.map(() => new THREE.Vector4(0, 0, 0, 0)) },
    };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aWall; varying float vWall;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vWall = aWall;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform float uSpread, uSnow, uLightK, uLen; uniform vec3 uLight, uO, uC; uniform vec4 uAx; uniform vec2 uSize, uFrame; uniform sampler2D tStroke; uniform vec4 uStk[${STACKS.length}];
varying float vWall; vec3 fCol; float fA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
if (vWall > 0.5) {
  // his sky, round the frame: the light of the hour, strongest just round the picture, which hides the middle of it
  vec2 q = lifeP.xz - uC.xz; float wu = dot(q, uAx.xy), wv = lifeP.y - uC.y;
  float k = exp(-(pow(wu / uFrame.x, 2.0) + pow(wv / uFrame.y, 2.0)) * 2.2);
  fCol = uLight * 0.9; fA = k * 0.75 * uLightK;
} else {
  vec2 lq = lifeP.xz - uO.xz; float su = dot(lq, uAx.xy), so = dot(lq, uAx.zw);
  vec4 s1 = texture2D(tStroke, vec2(su, so) / 0.85), s2 = texture2D(tStroke, vec2(su, so) / 1.9 + 0.31);
  float id = s1.a; vec3 c = mix(s1.rgb, s2.rgb, 0.3);
  c = mix(c, vec3(0.93, 0.9, 0.95), uSnow * 0.35 * step(0.45, id));                 // fresh snow, stroke by stroke
  // the low sun, from the picture: warm near the wall, going cool towards you
  float lit = exp(-(pow(su / 1.5, 2.0) + pow((so - 0.25) / 1.6, 2.0)));
  c *= mix(vec3(0.62, 0.62, 0.78), uLight * 1.25, lit * uLightK) * (0.75 + 0.25 * uLightK);
  // the stacks' long shadows, laid towards you, blue
  for (int i = 0; i < ${STACKS.length}; i++) {
    vec4 S = uStk[i]; if (S.w <= 0.0) continue;
    vec2 d = lifeP.xz - S.xy; float along = dot(d, uAx.zw), across = dot(d, uAx.xy), len = S.w * uLen;
    float wdt = S.z * (1.0 + 0.35 * clamp(along / len, 0.0, 1.0)), e = pow(across / wdt, 2.0) + pow((along - len * 0.42) / (len * 0.58), 2.0);
    float sh = (1.0 - smoothstep(0.55, 1.0, e)) * smoothstep(-0.02, 0.04, along + S.z * 0.6) * uLightK;
    c = mix(c, c * vec3(0.48, 0.5, 0.86), sh * (0.75 + 0.25 * step(0.4, id)));
  }
  float rr = pow(pow(abs(su) / uSize.x, 3.0) + pow(max(so, 0.0) / uSize.y, 3.0), 1.0 / 3.0);
  fA = smoothstep(0.0, 0.03, uSpread * 1.2 - (rr * 0.82 + id * 0.18)) * (1.0 - smoothstep(0.84, 0.98, rr + (id - 0.55) * 0.2)) * 0.96;
  fCol = c;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'wheat-field';
    this.field = new THREE.Mesh(g, m); this.field.position.y = 0.016; this.field.renderOrder = 5; L.add(this.field);

    // ---------------------------------------------------------- the stacks, and their caps: one rig, tinted by the light
    const mat = this.mat = tintedPaint({ glow: 0.36, rough: 0.85, key: 'wheat' });
    const rig = this.rig = L.rig(12, 8000, mat);
    const sunlit = ['#d8906e', '#e0a07a', '#c87868', '#d89a86'].map(c => col(c, 0.2)), shade = ['#7c5468', '#6e5a80', '#8a5c64', '#5f5f8e', '#946a74', '#74587a'].map(c => col(c, 0.2)), mid = ['#a06a72', '#8c6a86', '#b07a7a', '#9a7484'].map(c => col(c, 0.2)), orange = col('#c07a5c', 0.2);
    const prof = [[0, 0], [0.4, 0], [0.43, 0.04], [0.445, 0.16], [0.44, 0.3], [0.475, 0.37], [0.45, 0.42], [0.39, 0.53], [0.3, 0.66], [0.2, 0.79], [0.1, 0.9], [0.035, 0.96], [0, 0.975]];
    const stack = seed => {
      const g = shape.lathe(prof, 30, mid[0]), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), w = 1 + 0.05 * Math.sin(a * 3 + seed) + 0.035 * Math.sin(a * 7 + y * 9 + seed * 2); p.setXYZ(i, x * w, y * (1 + 0.04 * Math.sin(a * 2 + seed)), z * w); }
      g.computeVertexNormals();
      // his stacks against the sun: rimmed in gold and orange where they face it (the wall, the picture's sky), rose,
      // violet and blue in their shade towards you; short upright strokes, like the thatch
      const dabs = Array.from({ length: 240 }, () => ({ a: L.rand() * Math.PI * 2, y: L.rand(), q: L.rand() }));
      shape.paint(g, (c, n) => {
        const a = Math.atan2(c.z, c.x); let best = dabs[0], bd = 1e9;
        for (const d of dabs) { let da = Math.abs(a - d.a); if (da > Math.PI) da = 2 * Math.PI - da; const dd = da * da * 0.2 + (c.y - d.y) ** 2 * 0.12; if (dd < bd) { bd = dd; best = d; } }
        const sun = -n.z * 0.9 + n.y * 0.15 - n.x * 0.2, q = best.q;
        return sun > 0.5 ? sunlit[Math.floor(q * sunlit.length)] : sun > 0.0 ? (q < 0.1 ? orange : mid[Math.floor(q * mid.length)]) : (q < 0.05 ? orange : shade[Math.floor(q * shade.length)]);
      });
      return g;
    };
    // a cap of snow, its top at 0 and its rim hanging down over the thatch; white with rose and violet in it
    const capProf = [[0.37, -0.36], [0.4, -0.33], [0.36, -0.24], [0.27, -0.13], [0.17, -0.055], [0.07, -0.012], [0, 0.012]];
    const snows = ['#f6f0f4', '#ece0f0', '#f4dce0', '#d8d4f0', '#fbf0dc', '#e4d0e8'].map(c => col(c, 0.15));
    const cap = () => { const g = shape.lathe(capProf, 22, snows[0]); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), y = p.getY(i); if (y < -0.2) p.setY(i, y - 0.04 * Math.max(0, Math.sin(a * 5))); } g.computeVertexNormals(); shape.paint(g, () => snows[Math.floor(L.rand() * snows.length)]); return g; };
    const gs = [0, 1, 2].map(i => rig.geo(stack(i * 2.3))), gc = rig.geo(cap());
    this.stacks = STACKS.map((s, i) => ({ ...s, i, R: 0.445 * s.S, body: rig.add(gs[i % 3]), cap: rig.add(gc), us: Math.max(-(L.hw - 0.12), Math.min(L.hw - 0.12, s.u * 0.55)), x: 0, y: 0, z: 0, sy: 1, sxz: 1, roll: 0, g: 0, from: null }));
    this.hideAll();
    // ---------------------------------------------------------- snow, out of the picture
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NF * 3), 3).setUsage(THREE.DynamicDrawUsage));
    const cols = new Float32Array(NF * 3), sizes = new Float32Array(NF);
    for (let i = 0; i < NF; i++) { const c = snows[Math.floor(L.rand() * snows.length)]; cols.set([c.r, c.g, c.b], i * 3); sizes[i] = 0.6 + L.rand() * 0.9; }
    sg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); sg.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    const pm = new THREE.PointsMaterial({ size: 0.055, map: softDot(), vertexColors: true, transparent: true, depthWrite: false, fog: false });
    pm.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aSize;').replace('gl_PointSize = size;', 'gl_PointSize = size * aSize;'); };
    pm.customProgramCacheKey = () => 'wheat-snow';
    this.snow = L.add(new THREE.Points(sg, pm));
    this.flakes = Array.from({ length: NF }, () => ({ on: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, ph: L.rand() * 6.3, life: 0 }));
    this.acc = 0;
    this.box = looper(L.voice(), LUNE, { len: 64, step: 0.46, type: 'sine', vol: 0.02, ring: 1.6, partial: 0.18 });
    this.wind = L.voice().loop({ lp: 1100, hp: 250 });
  },

  hideAll() { for (const s of this.stacks) { this.rig.show(s.body, false); this.rig.show(s.cap, false); s.shown = false; } },

  // ---------------------------------------------------------------- timing, all from show-time (so any moment can be posed)
  // Every hiccup of stack i up to show-time t (the fixed ones, then the idle ones, which are the same each night).
  hics(i, t, fn) {
    for (const [ht, j] of HICS) if (j === i && ht <= t) fn(ht);
    if (t > IDLE0) for (let n = 0; IDLE0 + n * IDLE <= t; n++) { const h = Math.sin(n * 91.7 + 3.1) * 43758.5, j = Math.floor((h - Math.floor(h)) * 5), at = IDLE0 + n * IDLE + ((h * 7) % 1) * 0.9; if (j === i && at <= t) fn(at); }
  },
  lastHic(i, t) { let last = -9; this.hics(i, t, ht => { last = ht; }); return last; },
  // How much snow is on stack i at t: it builds while it snows; a hiccup with a good cap on shakes most of it off.
  capAt(i, t) {
    const t0 = CAP0 + i * 0.3, rate = 1 / 4.2; let g = 0, last = t0;
    const grow = to => { if (to > last) g = Math.min(1, g + (to - Math.max(last, t0)) * rate); last = Math.max(last, to); };
    this.hics(i, t, ht => { grow(ht); if (ht > 6 && g > 0.42) g *= 0.25; });
    grow(t); return g;
  },
  // Where stack i stands at show-time t, into s (x, y, z of its foot; sy, sxz its squash; roll its wobble).
  place(L, s, t) {
    const tt = t - s.t0, H = s.S, g = 9.8;
    s.sy = 1; s.sxz = 1; s.roll = 0; s.vis = tt >= 0;
    if (tt < 0) return;
    const hangY = L.rail - 0.016 - H * 0.97, fall0 = 0.56, drop = hangY - L.y, tf = Math.sqrt(2 * drop / g), land = fall0 + tf, outHang = s.R + 0.03, outLand = 0.36;
    let u = s.us, o, y;
    if (tt < 0.3) { const k = ease.out(tt / 0.3); o = -L.wall - s.R + (outHang + L.wall + s.R) * k; y = hangY; }
    else if (tt < fall0) { o = outHang; y = hangY; }
    else if (tt < land) { const k = tt - fall0; o = outHang + (outLand - outHang) * (k / tf); y = hangY - 0.5 * g * k * k; s.sy = 1 + 0.12 * (k / tf); }
    else {
      const k = tt - land; o = outLand; y = L.y;
      // the landing: a squash, and a jelly wobble out of it
      s.sy = 1 - 0.34 * Math.exp(-k * 7) * Math.cos(k * 19);
      // then three hops to its place, each with a crouch before it
      const hop0 = 0.42, hd = 0.36, n = 3;
      if (k > hop0) {
        const hk = Math.min(n, (k - hop0) / hd), j = Math.floor(hk), f = hk - j;
        const a = j / n, b = Math.min(1, (j + 1) / n);
        if (hk >= n) { u = s.u; o = s.out; }
        else {
          const ca = 0.22, air = f < ca ? 0 : (f - ca) / (1 - ca);
          u = s.us + (s.u - s.us) * (a + (b - a) * ease.inOut(air)); o = outLand + (s.out - outLand) * (a + (b - a) * ease.inOut(air));
          y = L.y + 4 * (0.06 + H * 0.12) * air * (1 - air);
          s.sy = f < ca ? 1 - 0.16 * Math.sin(f / ca * Math.PI) : air < 0.5 ? 1 + 0.14 * (1 - air * 2) : 1 - 0.1 * Math.max(0, (air - 0.85) / 0.15);
        }
        const settled = k - hop0 - n * hd;
        if (settled > 0) {
          s.sy = 1 - 0.12 * Math.exp(-settled * 8) * Math.cos(settled * 22);
          if (s.i === 4) s.roll = 0.32 * Math.exp(-settled * 2.2) * Math.sin(settled * 11);            // the littlest lands badly
        }
      }
    }
    // a hiccup: a crouch, a jump up, a squash down (hanging under the rail, only a jolt: nothing rises past the frame)
    const lh = this.lastHic(s.i, t), hk = t - lh;
    if (hk >= 0 && hk < 0.3 && tt < 0.56) { const j = Math.sin(hk / 0.3 * Math.PI); s.sy *= 1 - 0.14 * j; y -= 0.015 * j; }
    else if (hk >= 0 && hk < 0.34) {
      const up = 0.035 + H * 0.16;
      if (hk < 0.05) s.sy *= 1 - 0.12 * (hk / 0.05);
      else if (hk < 0.26) { const a = (hk - 0.05) / 0.21; y += up * Math.sin(a * Math.PI); s.sy *= a < 0.5 ? 1.16 - 0.16 * a * 2 : 1; }
      else s.sy *= 1 - 0.14 * Math.sin((hk - 0.26) / 0.08 * Math.PI);
    }
    s.sxz = 1 / Math.sqrt(Math.max(0.5, s.sy));
    L.floor(u, o, this.v); s.x = this.v.x; s.y = y; s.z = this.v.z; s.su = u; s.so = o;
  },

  start(L) {
    this.hideAll(); this.lastT = -1; this.box.reset(); this.acc = 0; this.skip = false;
    for (const f of this.flakes) f.on = 0;
    // the sting: a low, warm chord coming up like the sun going down, and the first hiccup to come
    const v = L.voice(); [[196, 0], [246.94, 0.12], [293.66, 0.24], [440, 0.4]].forEach(([f, at]) => v.note(f, 2.6, { at, vol: 0.018, type: 'sine', attack: 0.5 }));
  },
  back(L) { for (const s of this.stacks) s.from = s.shown ? { u: s.su, o: s.so, y: s.y, g: s.g } : null; this.light0 = this.u.uLightK.value; this.spread0 = this.u.uSpread.value; this.snow0 = this.u.uSnow.value; },
  end(L) { this.hideAll(); this.u.uSpread.value = 0; this.u.uLightK.value = 0; this.field.visible = false; for (const f of this.flakes) f.on = 0; this.snow.visible = false; this.wind.set(0); },
  reset(L) { this.end(L); },

  update(L, dt) {
    const ph = L.phase, t = L.t, showing = ph === 'wake' || ph === 'play', ret = ph === 'return', rig = this.rig, u = this.u, v = L.voice();
    // ---- the light: gold, rose, violet (and breathing between rose and violet while you stay)
    let lk, spread;
    if (showing) { lk = ease.smooth(ramp(t, 0, 1.6)); spread = ease.out(ramp(t, 0.1, 1.9)); }
    else if (ret) { lk = (this.light0 || 0) * (1 - ease.inOut(ramp(L.ret, 0.35, 1))); spread = (this.spread0 || 0) * (1 - ease.inOut(ramp(L.ret, 0.55, 1))); }
    else { lk = 0; spread = 0; }
    const hour = showing ? t : this.hour || 0; if (showing) this.hour = t;
    const c = this.c;
    if (hour < 2.5) c.copy(GOLD); else if (hour < 5.2) c.copy(GOLD).lerp(ROSE, ease.smooth((hour - 2.5) / 2.7)); else if (hour < 8.6) c.copy(ROSE).lerp(VIOLET, ease.smooth((hour - 5.2) / 3.4)); else c.copy(VIOLET).lerp(ROSE, 0.25 - 0.25 * Math.cos((hour - 8.6) * 0.5));
    u.uLight.value.copy(c); u.uLightK.value = lk; u.uSpread.value = spread; u.uLen.value = 1.1 + 1.3 * ease.smooth(ramp(hour, 1.5, 8.6));
    u.uSnow.value = showing ? ease.smooth(ramp(t, SNOW0 + 1, 10)) : ret ? (this.snow0 || 0) : 0;
    this.field.visible = spread > 0.002;
    this.mat.userData.u.uTint.value.setRGB(1, 1, 1).lerp(c, 0.5 * lk).multiplyScalar(0.8 + 0.3 * lk);
    // ---- the stacks
    this.stacks.forEach((s, i) => {
      if (ret && s.from) {
        // back up to the rail, the littlest first, rising to meet it, and in under the frame
        const k0 = 0.06 + (4 - i) * 0.13, k = clamp01((L.ret - k0) / 0.42), slide = clamp01((L.ret - k0 - 0.42) / 0.14);
        const H = s.S, hangY = L.rail - 0.016 - H * 0.97, up = 1 - (1 - ease.inOut(k)) ** 2, mu = s.us, mo = s.R + 0.03;
        s.su = s.from.u + (mu - s.from.u) * ease.inOut(k); s.so = s.from.o + (mo - s.from.o) * ease.inOut(k);
        s.y = s.from.y + (hangY - s.from.y) * up; s.so -= slide * (mo + L.wall + s.R + 0.02);
        s.sy = k < 0.12 ? 1 - 0.18 * Math.sin(k / 0.12 * Math.PI) : 1 + 0.12 * Math.sin(Math.min(1, (k - 0.12) / 0.6) * Math.PI); s.sxz = 1 / Math.sqrt(s.sy); s.roll = 0;
        L.floor(s.su, s.so, this.v); s.x = this.v.x; s.z = this.v.z; s.vis = slide < 1; s.g = s.from.g;
        if (k > 0 && !s.went) { s.went = true; this.hic(L, s, 0.8); }
      } else if (showing) { this.place(L, s, t); s.g = this.capAt(i, t); s.went = false; }
      else s.vis = false;
      rig.show(s.body, !!s.vis); rig.show(s.cap, !!s.vis && s.g > 0.02); s.shown = !!s.vis;
      if (!s.vis) { u.uStk.value[i].set(0, 0, 0, 0); return; }
      const yaw = L.yawOut, H = s.S;
      rig.put(s.body, s.x, s.y, s.z, yaw, 0, s.roll, this.sc.set(H * s.sxz, H * s.sy, H * s.sxz));
      // the cap sits on the top, growing down over the thatch, tipped with the wobble
      const top = H * 0.965 * s.sy, cg = s.g;
      this.w.set(Math.sin(s.roll) * top * -Math.cos(yaw), Math.cos(s.roll) * top, Math.sin(s.roll) * top * Math.sin(yaw));
      rig.put(s.cap, s.x + this.w.x, s.y + this.w.y + 0.004, s.z + this.w.z, yaw, 0, s.roll, this.sc.set(H * s.sxz * (0.86 + 0.16 * cg), H * (0.25 + 0.75 * cg) * Math.min(1.1, s.sy), H * s.sxz * (0.86 + 0.16 * cg)));
      // and its shadow on the snow (only once it is down)
      u.uStk.value[i].set(s.x, s.z, s.R * s.sxz, s.y - L.y < 0.05 ? H : 0);
      // sounds as things happen: the hiccups, the landing
      if (showing) {
        const tt = t - s.t0, land = 0.56 + Math.sqrt(2 * (L.rail - 0.016 - H * 0.97 - L.y) / 9.8);
        if (this.lastT < s.t0 && t >= s.t0) L.k.synth.noise(0.18, { vol: 0.012, lp: 1800 });
        if (this.lastT - s.t0 < land && tt >= land) this.thump(L, s);
        this.hics(i, t, ht => { if (ht > this.lastT && ht <= t) { this.hic(L, s, 1); if (ht > 6 && this.capAt(i, ht - 0.001) > 0.42) this.puff(L, s, 18); } });
      }
    });
    // ---- the snow
    this.stepSnow(L, dt, showing ? ease.smooth(ramp(t, SNOW0, SNOW0 + 1.6)) * (t > 10 ? 0.6 : 1) : 0, ret);
    // ---- sound: the music box once they are all in a row; a little wind with the snow
    this.box.run(showing && t > 4.4, 1, () => { if (this.skip) { this.skip = false; return 2; } return 1; });
    const near = Math.max(0, 1 - Math.hypot(L.k.G.camera.position.x - L.cx, L.k.G.camera.position.z - L.cz) / 12);
    this.wind.set((showing ? 0.018 * ramp(t, SNOW0, SNOW0 + 2) : 0) * near);
    v.place();
    this.lastT = t;
  },

  // A flake starts from under the bottom rail (most) or beside the frame, and drifts out into the room and down.
  spawn(L, f) {
    const side = L.rand() < 0.3, edge = L.hw + L.fw;
    let uu, vv;
    if (side) { const s = L.rand() < 0.5 ? -1 : 1; uu = s * (edge + 0.03 + L.rand() * 0.22); vv = L.rail - L.cy + L.rand() * (L.crown - L.rail) * 0.85; f.du = s * (0.03 + L.rand() * 0.05); }
    else { uu = (L.rand() * 2 - 1) * (edge + 0.05); vv = L.rail - L.cy - 0.02 - L.rand() * 0.05; f.du = (L.rand() - 0.5) * 0.05; }
    L.at(uu, vv, 0.03 + L.rand() * 0.04, this.v);
    f.x = this.v.x; f.y = this.v.y; f.z = this.v.z; f.out = 0.18 + L.rand() * 0.16; f.vy = -(0.13 + L.rand() * 0.09); f.on = 1; f.life = 0; f.puff = false;
  },
  puff(L, s, n) {
    let k = 0; const top = s.y + s.S * 0.95;
    for (const f of this.flakes) {
      if (f.on || k++ >= n) continue;
      const a = L.rand() * Math.PI * 2, sp = 0.35 + L.rand() * 0.5;
      f.x = s.x + Math.cos(a) * s.R * 0.4; f.y = top; f.z = s.z + Math.sin(a) * s.R * 0.4; f.vx = Math.cos(a) * sp; f.vz = Math.sin(a) * sp; f.vy = 0.7 + L.rand() * 0.6; f.on = 1; f.life = 0; f.puff = true;
    }
  },
  stepSnow(L, dt, rate, ret) {
    const a = this.snow.geometry.attributes.position.array; let any = false;
    this.acc += rate * 46 * dt;
    for (const f of this.flakes) { if (this.acc < 1) break; if (!f.on) { this.spawn(L, f); this.acc -= 1; } }
    this.acc = Math.min(this.acc, 2);
    const T = L.t + L.r;
    this.flakes.forEach((f, i) => {
      if (f.on === 1) {
        f.life += dt;
        if (f.puff) { f.vy -= 3.2 * dt; f.vx *= 1 - dt * 1.5; f.vz *= 1 - dt * 1.5; f.x += f.vx * dt; f.z += f.vz * dt; f.y += f.vy * dt; }
        else {
          // drifting: out from the wall, slowing, with a flutter; always down
          const out = f.out * Math.exp(-f.life * 0.25), fl = Math.sin(T * 2.1 + f.ph) * 0.06;
          f.x += (L.nx * out + L.tx * (f.du + fl)) * dt; f.z += (L.nz * out + L.tz * (f.du + fl)) * dt; f.y += (f.vy + Math.sin(T * 3.3 + f.ph * 2) * 0.03) * dt;
        }
        // on a stack: taken into its cap
        for (const s of this.stacks) if (s.shown && !f.puff && Math.hypot(f.x - s.x, f.z - s.z) < s.R * 0.9 && f.y < s.y + s.S && f.y > s.y) f.on = 0;
        if (f.on && f.y <= L.y + 0.008) { f.y = L.y + 0.008; f.on = 2; f.life = 0; }
      } else if (f.on === 2) { f.life += dt; if (f.life > 1.6 || ret) f.on = 0; }
      if (f.on) any = true;
      a[i * 3] = f.x; a[i * 3 + 1] = f.on ? f.y : L.y - 9; a[i * 3 + 2] = f.z;
    });
    this.snow.geometry.attributes.position.needsUpdate = true; this.snow.visible = any;
  },

  // "hic!": a quick vocal blip, lower for the bigger stacks; and the music box skips a note.
  hic(L, s, k) {
    const v = L.voice(), f0 = 330 / Math.sqrt(s.S / 0.38);
    v.note(f0, 0.075, { vol: 0.03 * k, type: 'triangle', to: f0 * 2.3, attack: 0.004 }); v.note(f0 * 2.6, 0.05, { at: 0.012, vol: 0.012 * k, type: 'sine', to: f0 * 3.6, attack: 0.003 });
    L.k.synth.noise(0.04, { vol: 0.008 * k, lp: 2600 });
    this.skip = true;
  },
  thump(L, s) { const v = L.voice(); v.note(120 / Math.sqrt(s.S / 0.38), 0.14, { vol: 0.035, type: 'sine', to: 55, attack: 0.003 }); L.k.synth.noise(0.12, { vol: 0.018, lp: 700 }); },
});
