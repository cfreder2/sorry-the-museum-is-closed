// Vincent van Gogh, Self-Portrait (1887), Gallery 241. The word: swirl.
//
// In Paris in 1887 he painted himself in short, separate strokes of pure colour, and round his head they radiate
// like a halo: blue and green dashes with orange and red ones between. Look at it and that halo comes out round the
// frame: his strokes spill out of the picture onto the wall all round it, thick and wet, one after another, radiating
// from his head, and they beat (lub-dub) like a heart. Then they peel off the wall, the lowest first, and pour down in
// streams to the floor in front of him, where they go round, faster inside than out, into a whirlpool of brushstrokes
// with spiral arms, the floor under it painted in the same dashes, turning, as the skies he would paint later turn.
// The heart beats faster; the middle of the whirl draws up into a tall twisting flame of strokes, the height of the
// toy twice over, and falls back. Bach's first Prelude in C (1722), its arpeggios going round and round, is plucked
// quietly while it turns. While you keep looking it turns on slowly and the heart slows. When you stop looking, it
// stays while the toy is near and goes round the toy wherever it drives; then the strokes fly back up to the wall, lie
// down in their places round the frame, and slip back into the picture under the frame's edges.
//
// Every stroke is a little slab of paint: a ridge where the brush landed, bristle grooves along it, a lip at the end.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01 } from '../paintlife.js';
import { tintedPaint } from './brush.js';
import { looper } from './tunes.js';

const N = 360;                                // strokes
const LEN = 0.085;                            // a stroke's length (m): 2.5 cm wide, a centimetre thick
const CU = 0, CO = 1.15, RMAX = 0.92;         // the whirl: its middle (along, out) and how far it reaches
const DU = 1.8, DO = 2.45;                    // the painted floor under it: either side, and out from the wall
const T_POUR = 0.9, T_FORM = 3.2, T_COL = 5.2, T_COL2 = 8.6;
// Prelude No. 1 in C (J. S. Bach, The Well-Tempered Clavier, 1722): bars 1 to 11, each bar's arpeggio twice.
const BACH = (() => {
  const bars = ['C4 E4 G4 C5 E5', 'C4 D4 A4 D5 F5', 'B3 D4 G4 D5 F5', 'C4 E4 G4 C5 E5', 'C4 E4 A4 E5 A5', 'C4 D4 F#4 A4 D5', 'B3 D4 G4 D5 G5', 'B3 C4 E4 G4 C5', 'A3 C4 E4 G4 C5', 'D3 A3 D4 F#4 C5', 'G3 B3 D4 G4 B4'];
  const out = [];
  bars.forEach((b, i) => { const n = b.split(' '); for (let h = 0; h < 2; h++) [0, 1, 2, 3, 4, 2, 3, 4].forEach((k, j) => out.push([i * 16 + h * 8 + j, n[k], k < 2 ? 6 : 2, k === 0 ? 1 : k === 1 ? 0.8 : 0.62])); });
  return out;
})();
const _hash = (a, b = 0) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };

lifeFor(80607, {
  title: /^Self-Portrait$/,
  word: 'swirl',
  stage: { out: 2.15, half: 1.35, above: 0.42 },
  wake: 2, ret: 2.6,
  linger: { near: 3.5, max: 25 },

  build(L) {
    const P = L.pal, col = (h, a = 0.25) => P.near(h, a);
    this.v = new THREE.Vector3(); this.p0 = new THREE.Vector3(); this.p1 = new THREE.Vector3(); this.d = new THREE.Vector3(); this.x = new THREE.Vector3(); this.y = new THREE.Vector3(); this.z = new THREE.Vector3();
    this.M = new THREE.Matrix4(); this.R = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.qa = new THREE.Quaternion(); this.qb = new THREE.Quaternion(); this.S = new THREE.Vector3(); this.c = new THREE.Color(); this.up = new THREE.Vector3(0, 1, 0);
    this.wallN = new THREE.Vector3(L.nx, 0, L.nz); this.wallT = new THREE.Vector3(L.tx, 0, L.tz);
    // ---------------------------------------------------------- a stroke: a slab of oil paint (length along z, its top up y)
    const nl = 12, nw = 6, pos = [], shade = [];
    const W = z => 0.17 * (1 - 0.3 * z) * Math.pow(Math.sin(Math.PI * Math.min(1, z * 1.05 + 0.02)), 0.35);
    const top = (xx, z) => { const e = Math.min(1, z / 0.12) * (1 - 0.55 * Math.max(0, (z - 0.8) / 0.2)) + 0.5 * Math.exp(-(((z - 0.84) / 0.07) ** 2)); return 0.07 * Math.pow(Math.max(0, 1 - xx * xx), 0.5) * e * (1 + 0.16 * Math.sin(xx * Math.PI * 3.5)); };
    const vert = (i, j, up) => { const z = i / nl, xx = (j / nw) * 2 - 1, w = W(z); return [xx * w, up ? top(xx, z) : 0, z - 0.5, up ? 0.82 + 0.18 * Math.sin(xx * Math.PI * 3.5) * (z > 0.1 ? 1 : 0.3) + 0.12 * Math.exp(-(((z - 0.84) / 0.07) ** 2)) : 0.55]; };
    for (let i = 0; i < nl; i++) for (let j = 0; j < nw; j++) for (const up of [true, false]) {
      const a = vert(i, j, up), b = vert(i + 1, j, up), cc = vert(i + 1, j + 1, up), dd = vert(i, j + 1, up);
      const tri = up ? [a, b, cc, a, cc, dd] : [a, cc, b, a, dd, cc];
      for (const t of tri) { pos.push(t[0], t[1], t[2]); shade.push(t[3], t[3], t[3]); }
    }
    for (const j of [0, nw]) for (let i = 0; i < nl; i++) { const a = vert(i, j, true), b = vert(i + 1, j, true), a0 = vert(i, j, false), b0 = vert(i + 1, j, false); const tri = j ? [a, a0, b0, a, b0, b] : [a, b0, a0, a, b, b0]; for (const t of tri) { pos.push(t[0], t[1], t[2]); shade.push(0.6, 0.6, 0.6); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(shade, 3)); g.computeVertexNormals();
    const mat = this.mat = tintedPaint({ glow: 0.42, rough: 0.32, key: 'vangogh' });
    const im = this.strokes = new THREE.InstancedMesh(g, mat, N); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // his colours: the halo's blues and greens with orange and red between, ochre, and the cream of the light on his brow
    const hues = [['#3c5a8a', 3], ['#4a70a8', 3], ['#2f4f7a', 1.5], ['#3f7a5a', 2.5], ['#5a9a5a', 2], ['#7aa850', 1], ['#d8743a', 2.4], ['#e8903c', 1.6], ['#c8502e', 1.4], ['#c8a050', 1], ['#e8d8b0', 0.6], ['#2a6a7a', 1]].map(([c, w]) => [col(c), w]);
    let tot = 0; for (const h of hues) tot += h[1];
    const pick = r => { for (const h of hues) if ((r -= h[1]) <= 0) return h[0]; return hues[0][0]; };
    // ---------------------------------------------------------- where each stroke lies on the wall: radiating from his head
    const hu = 0, hv = L.hh * 0.24, fx = L.hw + L.fw + 0.012, fy = L.hh + L.fw + 0.012, ex = fx + 0.36, ey = fy + 0.33;
    const label = { u: L.hw + L.fw + 0.24, v: L.y + 1.22 - L.cy };
    this.s = [];
    for (let i = 0, guard = 0; i < N && guard < N * 30; guard++) {
      const a = L.rand() * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      // where a ray from the head leaves the frame, and the halo
      const rf = Math.min(Math.abs(fx / (ca || 1e-6)), Math.abs((sa > 0 ? fy - hv : fy + hv) / (sa || 1e-6)));
      const re = 1 / Math.sqrt((ca / ex) ** 2 + (sa / (ey + (sa > 0 ? -hv : hv) * 0.5)) ** 2);
      if (re < rf + 0.05) continue;
      const rho = rf + 0.025 + (re - rf - 0.025) * Math.pow(L.rand(), 1.25), u = hu + ca * rho, vv = hv + sa * rho;
      if (Math.abs(u - label.u) < 0.14 && Math.abs(vv - label.v) < 0.1) continue;
      if (vv < -(L.cy - L.y) + 0.3) continue;
      const ang = a + (L.rand() - 0.5) * 0.6, r = 0.12 + (RMAX - 0.16) * Math.sqrt(L.rand()), arm = L.rand() < 0.5 ? 0 : Math.PI;
      this.s.push({
        u, v: vv, ang, k: (rho - rf) / (re - rf), col: pick(L.rand() * tot).clone().multiplyScalar(0.85 + L.rand() * 0.3), sz: 0.85 + L.rand() * 0.35,
        r, th0: arm + 2.4 * Math.log(r / 0.12) + (L.rand() - 0.5) * 0.7, h: 0.012 + L.rand() * 0.05 * (1.1 - r / RMAX), wob: L.rand() * 6.3,
        hc: r < 0.44 ? 0.1 + 0.95 * Math.pow(1 - r / 0.44, 0.7) * (0.55 + 0.45 * L.rand()) : 0, fl: 1.1 + L.rand() * 0.4, home: new THREE.Vector3(), hq: new THREE.Quaternion(), at: new THREE.Vector3(), aq: new THREE.Quaternion(), from: null, fq: new THREE.Quaternion(),
      });
      i++;
    }
    this.n = this.s.length; im.count = this.n;
    // the order they pour: lowest first; the order they appear: from the frame outwards
    [...this.s].sort((a, b) => a.v - b.v + (a.k - b.k) * 0.2).forEach((s, i, all) => { s.lift = T_POUR + 1.9 * i / all.length; s.rank = i / all.length; });
    for (const s of this.s) {
      s.appear = 0.08 + s.k * 0.7 + L.rand() * 0.12;
      L.at(s.u, s.v, -L.wall + 0.004, s.home);
      // flat on the wall, its top facing out, running along `ang`
      this.z.set(L.tx * Math.cos(s.ang), Math.sin(s.ang), L.tz * Math.cos(s.ang)).normalize(); this.y.copy(this.wallN); this.x.crossVectors(this.y, this.z);
      s.hq.setFromRotationMatrix(this.R.makeBasis(this.x, this.y, this.z));
      im.setColorAt(this.s.indexOf(s), s.col);
    }
    L.add(im);
    // ---------------------------------------------------------- the floor under the whirl: the same dashes, turning
    const swirl = [col('#3c5a8a'), col('#4a70a8'), col('#3f7a5a'), col('#5a9a5a'), col('#d8743a'), col('#c8a050'), col('#2a6a7a'), col('#e8903c')];
    const u = this.u = {
      uC: { value: new THREE.Vector2(CU, CO) }, uR: { value: 0 }, uPhi: { value: 0 }, uB: { value: 0 }, uK: { value: 0 },
      uO: { value: L.floor(0, -L.wall) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uCol: { value: swirl }, uGlow: { value: col('#f0d070', 0.2) },
    };
    const fm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false });
    fm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform vec2 uC; uniform float uR, uPhi, uB, uK; uniform vec3 uO, uGlow; uniform vec4 uAx; uniform vec3 uCol[8];
float vgH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 vgCol; float vgA;
// one ring of dashes round the middle, every dash turning at the speed of the strokes at that radius
vec4 vgLayer(float r, float a, float bw, float off) {
  float rb = r / bw + off, band = floor(rb), fr = fract(rb), rr = (band + 0.5 - off) * bw;
  float om = 1.9 * sqrt(0.3 / max(rr, 0.06));
  float aw = a - uPhi * om - 2.4 * log(max(rr, 0.04) / 0.12);
  float n = max(5.0, floor(6.2832 * rr / 0.085));
  float x = aw / 6.2832 * n + vgH(vec2(band, off)) * 13.0, cell = floor(x), f = fract(x), h = vgH(vec2(band, cell + off * 7.0));
  float dash = smoothstep(0.0, 0.1, f) * (1.0 - smoothstep(0.55 + 0.25 * h, 0.72 + 0.25 * h, f)) * (1.0 - smoothstep(0.22, 0.42, abs(fr - 0.5)));
  float arms = 0.55 + 0.45 * cos(2.0 * (a - uPhi * om - 2.4 * log(max(rr, 0.04) / 0.12)));
  return vec4(uCol[int(h * 7.99)], dash * step(0.18, h + arms * 0.6));
}`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz; vec2 q = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw)) - uC; float r = length(q), a = atan(q.y, q.x);
  vec4 l1 = vgLayer(r, a, 0.048, 0.0), l2 = vgLayer(r, a + 0.37, 0.048, 0.5);
  vgCol = mix(l2.rgb, l1.rgb, l1.a / max(l1.a + l2.a, 1e-3)); vgA = max(l1.a, l2.a * 0.85);
  float edge = smoothstep(uR, uR - 0.22, r);
  vgA *= edge * (0.62 + 0.38 * smoothstep(0.08, 0.3, r));
  float glow = exp(-r * r / 0.03) * (0.35 + 0.65 * uB) * uK;
  vgCol = vgCol * (0.85 + 0.6 * uB) + uGlow * glow * 1.4; vgA = max(vgA, glow * 0.8) * uK;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = vgCol; diffuseColor.a = vgA * 0.92;\n#include <opaque_fragment>');
    };
    fm.customProgramCacheKey = () => 'vangogh-floor';
    this.floor = L.decal({ w: 2 * DU, d: DO + L.wall, u: 0, out: (DO - L.wall) / 2, material: fm });
    this.floor.position.y += 0.004; this.floor.renderOrder = 5;
    this.loop = L.voice().loop({ lp: 900, hp: 260 });
    this.bach = looper(L.voice(), BACH, { len: 176, step: 0.15, type: 'triangle', vol: 0.013, ring: 1.2, partial: 0.1 });
    this.cu = CU; this.co = CO; this.phi = 0; this.hb = 0; this.spin = 0;
    this.hide();
  },

  hide() { this.strokes.visible = false; this.u.uK.value = 0; this.floor.visible = false; },

  // Show-time t -> how fast it turns (1 is its walk), the heart's rate, the flame.
  spinAt(t) { return 0.15 + 0.85 * ease.smooth(ramp(t, T_POUR + 0.6, T_FORM)) + 0.9 * ease.smooth(ramp(t, T_COL - 0.6, T_COL + 0.8)) * (1 - ease.smooth(ramp(t, T_COL2 - 1, T_COL2 + 1))) - 0.35 * ease.smooth(ramp(t, T_COL2, T_COL2 + 3)); },
  bpm(t) { return 64 + 34 * ease.smooth(ramp(t, T_COL - 1.5, T_COL + 0.5)) * (1 - ease.smooth(ramp(t, T_COL2 - 0.5, T_COL2 + 2.5))) - 6 * ramp(t, T_COL2, T_COL2 + 4); },
  colAt(t) {
    const k = ease.inOut(ramp(t, T_COL, T_COL + 1.1)) * (1 - ease.inOut(ramp(t, T_COL2 - 1.2, T_COL2)));
    // while you keep looking: a smaller flame now and then
    const it = t - T_COL2 - 3; if (it > 0) { const p = it % 10; return Math.max(k, 0.55 * Math.sin(Math.PI * clamp01(p / 3.2)) * (p < 3.2 ? 1 : 0)); }
    return k;
  },
  // The heart: lub at 0, dub at 0.3 of a beat.
  beat(ph) { const f = ph - Math.floor(ph); return Math.exp(-((f / 0.05) ** 2)) + Math.exp(-(((f - 1) / 0.05) ** 2)) + 0.65 * Math.exp(-(((f - 0.3) / 0.055) ** 2)); },

  // Stroke s in the whirl at show-time t, into o.
  orbit(L, s, t, o, col, b) {
    const om = 1.9 * Math.sqrt(0.3 / s.r) * (1 + 0.6 * col * (s.hc > 0 ? 1 : 0)), th = s.th0 + om * this.phi;
    const hc = s.hc * col, r = (s.r + (0.05 + 0.2 * (1 - hc) * (s.r / 0.44) - s.r) * (s.hc > 0 ? col : 0)) * (1 + 0.1 * b);
    const h = s.h + hc + 0.02 * b + 0.012 * Math.sin(t * 2.3 + s.wob);
    return L.floor(this.cu + Math.cos(th) * r, this.co + Math.sin(th) * r, o).setY(L.y + 0.012 + h);
  },
  // Stroke s at show-time t (its place from the start of the show: on the wall, pouring, or in the whirl), into o.
  posAt(L, s, t, o, col, b) {
    if (t < s.lift) return o.copy(s.home).addScaledVector(this.wallN, 0.006 * this.beat(this.hb) * (1 - s.k));
    const f = (t - s.lift) / s.fl;
    if (f >= 1) return this.orbit(L, s, t, o, col, b);
    // pouring: off the wall, a loop out into the room and down, into its place in the whirl (which is moving on)
    const e = ease.inOut(f), end = this.orbit(L, s, t, this.p1, col, b), a = 1 - e;
    const c1x = s.home.x + L.nx * 0.32, c1y = s.home.y - 0.12, c1z = s.home.z + L.nz * 0.32;
    const c2x = end.x + (end.x - L.cx) * 0.25, c2y = end.y + 0.45, c2z = end.z + (end.z - L.cz) * 0.1;
    return o.set(a * a * a * s.home.x + 3 * a * a * e * c1x + 3 * a * e * e * c2x + e * e * e * end.x, a * a * a * s.home.y + 3 * a * a * e * c1y + 3 * a * e * e * c2y + e * e * e * end.y, a * a * a * s.home.z + 3 * a * a * e * c1z + 3 * a * e * e * c2z + e * e * e * end.z);
  },

  start(L, resumed) {
    if (resumed) return;
    this.phi = 0; this.hb = 0; this.cu = CU; this.co = CO; this.lastT = -1; this.bach.reset(); this.lastBeat = 0;
    const v = L.voice(); ['C4', 'E4', 'G4', 'C5', 'E5', 'G5'].forEach((n, i) => v.note([261.63, 329.63, 392, 523.25, 659.25, 783.99][i], 1.2, { at: i * 0.06, vol: 0.016, type: 'triangle', attack: 0.004 }));
    L.k.synth.noise(1.1, { vol: 0.02, lp: 1600, at: 0.1 });
  },
  back(L) { for (const s of this.s) { s.from = s.from || new THREE.Vector3(); s.from.copy(s.at); s.fq.copy(s.aq); } this.k0 = this.u.uK.value; this.r0 = this.u.uR.value; },
  end(L) { this.hide(); this.loop.set(0); },
  reset(L) { this.end(L); this.phi = 0; this.hb = 0; },

  update(L, dt) {
    const ph = L.phase, t = L.t, showing = ph === 'wake' || ph === 'play', linger = ph === 'linger', ret = ph === 'return', u = this.u, im = this.strokes, v = L.voice(), k = L.k;
    // ---- the whirl's clock (turning, the heart) and where its middle is: in front of him, or round the toy
    const tt = showing ? t : (this.tHold || t); if (showing) this.tHold = t;
    this.spin = linger ? 0.8 : ret ? this.spin : this.spinAt(t);
    this.phi += dt * this.spin;
    const bpm = linger ? 72 : this.bpm(tt); this.hb += dt * bpm / 60;
    const b = this.beat(this.hb), col = showing ? this.colAt(t) : 0;
    let wu = CU, wo = CO;
    const G = k.G, veh = G.vehicle;
    if (linger && G.state === 'play' && veh && veh.group.visible) { const q = L.local(veh.pos.x, veh.pos.z); wu = Math.max(-0.85, Math.min(0.85, q.u)); wo = Math.max(0.95, Math.min(1.5, q.out)); }
    const fk = Math.min(1, dt * (linger ? 1.6 : 0.8)); this.cu += (wu - this.cu) * fk; this.co += (wo - this.co) * fk;
    if (showing && t < 0.05) { this.cu = CU; this.co = CO; }
    // ---- the strokes
    const M = this.M, S = this.S, n = this.n, p = this.p0, pp = this.v;
    let shown = false;
    for (let i = 0; i < n; i++) {
      const s = this.s[i];
      let sc = s.sz, q = this.q;
      if (ret && s.from) {
        // back to its place on the wall, then in under the frame's edge
        const fl = clamp01((L.ret * 2.6 - s.rank * 0.9) / 1.15), sink = clamp01((L.ret * 2.6 - s.rank * 0.9 - 1.15) / 0.35);
        const e = ease.inOut(fl), a = 1 - e, c1 = this.d.copy(s.from).setY(s.from.y + 0.35), c2 = this.y.copy(s.home).addScaledVector(this.wallN, 0.3);
        p.set(a * a * a * s.from.x + 3 * a * a * e * c1.x + 3 * a * e * e * c2.x + e * e * e * s.home.x, a * a * a * s.from.y + 3 * a * a * e * c1.y + 3 * a * e * e * c2.y + e * e * e * s.home.y, a * a * a * s.from.z + 3 * a * a * e * c1.z + 3 * a * e * e * c2.z + e * e * e * s.home.z);
        q.copy(s.fq).slerp(s.hq, ease.smooth(fl * 1.3));
        if (sink > 0) { const dirU = s.u - 0, dirV = s.v - L.hh * 0.24, l = Math.hypot(dirU, dirV) || 1; L.at(s.u - dirU / l * 0.12 * sink, s.v - dirV / l * 0.12 * sink, -L.wall + 0.004, p); sc *= 1 - ease.in(sink); }
        if (sink >= 1) sc = 0;
      } else if (showing || linger) {
        const grow = ease.outBack(clamp01((t - s.appear) / 0.35));
        if (grow <= 0) sc = 0; else sc *= grow;
        this.posAt(L, s, t, p, col, b);
        if (t < s.lift) q.copy(s.hq);
        else {
          // facing the way it goes (from where it was a moment ago), its top up, banked into the turn
          this.posAt(L, s, t - 0.03, pp, col, b);
          this.z.subVectors(p, pp); const sp = this.z.length() / 0.03;
          if (sp < 1e-4) this.z.set(L.nx, 0, L.nz); this.z.normalize();
          this.y.set(this.cx0 = L.floor(this.cu, this.co, this.d).x - p.x, 3, this.d.z - p.z).normalize();
          this.x.crossVectors(this.y, this.z).normalize(); this.y.crossVectors(this.z, this.x);
          this.qa.setFromRotationMatrix(this.R.makeBasis(this.x, this.y, this.z));
          const peel = clamp01((t - s.lift) / (s.fl * 0.3));
          q.copy(s.hq).slerp(this.qa, ease.smooth(peel));
          sc *= 1 + Math.min(0.6, sp * 0.18) * 0;                    // (length is set below)
          s.stretch = 1 + Math.min(0.7, sp * 0.22);
        }
      } else sc = 0;
      s.at.copy(p); s.aq.copy(q);
      const st = !(ret && s.from) && (showing || linger) && t >= s.lift ? s.stretch || 1 : 1;
      M.compose(p, q, S.set(LEN * sc, LEN * sc * (1 + 0.25 * b * (t < s.lift ? 1 - s.k : 0.4)), LEN * sc * st));
      im.setMatrixAt(i, M);
      if (sc > 0) shown = true;
    }
    im.instanceMatrix.needsUpdate = true; im.visible = shown;
    this.mat.userData.u.uPulse.value = 0.55 * b;
    // ---- the painted floor: it comes as the strokes arrive, and goes as they leave
    let fk2, fr;
    if (showing) { fk2 = ease.smooth(ramp(t, T_POUR + 0.9, T_FORM + 0.4)); fr = RMAX * (0.3 + 0.75 * ease.out(ramp(t, T_POUR + 0.9, T_FORM + 0.8))); }
    else if (linger) { fk2 = 1; fr = RMAX * 1.05; }
    else if (ret) { fk2 = (this.k0 || 0) * (1 - ease.inOut(ramp(L.ret, 0.05, 0.6))); fr = this.r0 || 0; }
    else { fk2 = 0; fr = 0; }
    u.uK.value = fk2; u.uR.value = fr; u.uPhi.value = this.phi; u.uB.value = b; u.uC.value.set(this.cu, this.co);
    this.floor.visible = fk2 > 0.003;
    // ---- sound: the heart, the whirl, the prelude
    const hbf = this.hb - Math.floor(this.hb), lastF = this.lastBeat; this.lastBeat = hbf;
    if ((showing || linger) && !L.quiet) {
      if (lastF > hbf) { v.note(62, 0.17, { vol: 0.07, type: 'sine', to: 40, attack: 0.004 }); v.note(124, 0.05, { vol: 0.012, type: 'sine', to: 70, attack: 0.002 }); }
      if (lastF < 0.3 && hbf >= 0.3) v.note(55, 0.15, { vol: 0.05, type: 'sine', to: 38, attack: 0.004 });
    }
    const near = Math.max(0, 1 - Math.hypot(G.camera.position.x - L.cx, G.camera.position.z - L.cz) / 12);
    this.loop.set((showing || linger ? 0.012 + 0.016 * Math.min(1.5, this.spin) * fk2 : 0) * near);
    this.bach.run((showing && t > T_FORM - 0.4) || linger, 1);
    v.place(L.floor(this.cu, this.co, this.d).x, this.d.z);
    this.lastT = t;
  },
});
