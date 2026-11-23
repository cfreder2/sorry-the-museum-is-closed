// J. M. W. Turner, Valley of Aosta: Snowstorm, Avalanche, and Thunderstorm (1836–37), Griffin Court. The word: avalanche.
//
// His picture is a vortex: the storm wheels round the valley in one great arc of white, grey and umber, an avalanche
// pours down its middle, and a gold light breaks through at the top. Look at it and that vortex comes out into the
// court. His strokes peel out from behind the frame and wheel round it, long loose sweeps of white, grey, ochre and
// umber with the snow in them, faster and wider, the wind rising (and under the wind, the shivering repeated chords that
// open Vivaldi's Winter, 1725, building note by note). Then the avalanche: a white torrent of snow and strokes bursts
// out from under the bottom rail, crashes to the floor and billows out across it, and the strokes round the frame peel
// off one by one and swoop down into it, and it all turns into a whirlwind on the floor in front of the picture, as tall
// as the toy is long and three times as wide, roaring. Its eye turns gold, his light breaking through. Thunder: the floor
// and the wall round the frame flash white, twice, and the crack rolls away round the court. Then the wind drops, the
// strokes slow and spiral down, and the snow settles in a soft drift in the gold light, its surface swept in his circling
// marks (the chord resolves, warmly, to the major). While you keep looking a little snow keeps falling on it and the
// thunder grumbles far off now and then. When you stop, the drift melts away and the strokes rise and wheel back round
// the frame and in behind it.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, canvasTexture, radialTexture } from '../paintlife.js';

const TAU = Math.PI * 2, wrap = a => a - TAU * Math.round(a / TAU);

const NR = 96, NRING = 58, K = 9;           // strokes (the first NRING wheel round the frame; the rest come down in the avalanche), segments each
const NP = 240;                               // snow
const DR = 14, DS = 44, DRIFT_R = 1.45;       // the drift: rings, spokes, its reach (m)
const CU = 0.05, CO = 1.3;                    // the whirlwind's middle (along, out)
const T_AV = 2.0, T_BOOM = 4.75, T_CALM = 6.0;
// Vivaldi, Winter (The Four Seasons, 1725), the opening: repeated quavers, the parts coming in one by one into a
// shivering chord. Here: F minor with its seventh and ninth, then (for the calm) the major, held.
const SHIVER = [[0.35, 'F3'], [1.1, 'C4'], [1.85, 'Ab3'], [2.6, 'Eb4'], [3.35, 'G4'], [4.1, 'Db4']];
const midi = n => { const m = /^([A-G])(b|#)?(\d)$/.exec(n), k = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0); return 440 * Math.pow(2, (k + 12 * (+m[3] + 1) - 69) / 12); };

lifeFor(109938, {
  title: /^Valley of Aosta/,
  word: 'avalanche',
  stage: { out: 2.15, half: 1.65, cam: { dist: 3.5, height: 1.15, side: 0.25, fov: 64, lookU: 0.05, lookOut: 0.8, lookH: 1.0, floorOut: 1.9 } },
  wake: 2, ret: 2.2,

  build(L) {
    const P = L.pal, col = (h, a = 0.35) => P.near(h, a);
    this.cH = L.cy - L.y; this.railH = L.rail - L.y;
    this.A0 = L.hw + L.fw; this.B0 = L.hh + L.fw;
    // ---------------------------------------------------------- his marks: one texture, a loaded brush stroke above and
    // a swatch of streaky impasto below (for the drift)
    const tex = canvasTexture(256, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      // the stroke, along x: a blunt loaded start, a dragging tail, bristle streaks, a ragged edge
      for (let b = 0; b < 22; b++) {
        const y0 = 6 + (b / 21) * 52 + (L.rand() - 0.5) * 3, th = 1.5 + L.rand() * 3.2, len = 150 + L.rand() * 100, x0 = L.rand() * 18, lum = 205 + Math.floor(L.rand() * 50);
        for (let x = x0; x < x0 + len && x < w; x += 2) {
          const env = Math.min(1, (x - x0) / 26) * Math.min(1, (x0 + len - x) / 70), edge = 1 - Math.pow(Math.abs(y0 - 32) / 30, 3);
          g.fillStyle = `rgba(${lum},${lum},${lum},${(0.55 + 0.45 * L.rand()) * env * edge})`; g.fillRect(x, y0 + Math.sin(x * 0.03 + b) * 1.2, 2.2, th);
        }
      }
      // the swatch: opaque, streaked along x, its alpha streaky too (it melts in streaks)
      g.fillStyle = '#fff'; g.fillRect(0, 64, w, 64);
      for (let i = 0; i < 260; i++) { const y = 64 + L.rand() * 64, x = L.rand() * w, len = 30 + L.rand() * 120, c = 170 + Math.floor(L.rand() * 85); g.fillStyle = `rgba(${c},${c},${c},0.5)`; g.fillRect(x, y, len, 1 + L.rand() * 2.5); if (x + len > w) g.fillRect(x - w, y, len, 1 + L.rand() * 2.5); }
      const img = g.getImageData(0, 64, w, 64), d = img.data;
      for (let y = 0; y < 64; y++) { let a = 0.75; for (let x = 0; x < w; x++) { if (x % 24 === 0) a = 0.62 + 0.38 * L.rand(); const i = (y * w + x) * 4; d[i + 3] = Math.round(255 * Math.min(1, a + 0.2 * Math.sin(y * 0.9 + x * 0.05))); } }
      g.putImageData(img, 0, 64);
    });
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; tex.anisotropy = 4;
    // ---------------------------------------------------------- the strokes and the drift, one mesh
    const nRV = NR * (K + 1) * 2, nDV = (DR + 1) * DS, nV = nRV + nDV;
    const pos = new Float32Array(nV * 3), colr = new Float32Array(nV * 4), uv = new Float32Array(nV * 2), idx = [];
    for (let i = 0; i < NR; i++) for (let j = 0; j <= K; j++) for (let s = 0; s < 2; s++) { const v = (i * (K + 1) + j) * 2 + s; uv[v * 2] = j / K; uv[v * 2 + 1] = 0.53 + 0.45 * s; }
    for (let i = 0; i < NR; i++) for (let j = 0; j < K; j++) { const a = (i * (K + 1) + j) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    for (let r = 0; r <= DR; r++) for (let s = 0; s < DS; s++) { const v = nRV + r * DS + s; uv[v * 2] = (s / DS) * 5 + r * 0.13; uv[v * 2 + 1] = 0.04 + 0.42 * (r / DR); }
    for (let r = 0; r < DR; r++) for (let s = 0; s < DS; s++) { const a = nRV + r * DS + s, b = nRV + r * DS + (s + 1) % DS; idx.push(a, b, a + DS, b, b + DS, a + DS); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(colr, 4).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    this.mat = new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, alphaTest: 0.42, side: THREE.DoubleSide, fog: false });
    this.storm = L.add(new THREE.Mesh(geo, this.mat)); this.nRV = nRV;
    // each stroke: where it starts round the wheel, how far out, how high, how fast, its colour
    const whites = ['#f2efe6', '#e8e4d8', '#d9d6cc', '#f6f1e2'], greys = ['#a8a59c', '#8d8a82', '#bdb7a8', '#76736c'], golds = ['#d7b46a', '#c79a4e', '#e4c88a'], umbers = ['#6b5338', '#8a6a44', '#5a4632'];
    const pick = a => a[Math.floor(L.rand() * a.length)];
    this.R = Array.from({ length: NR }, (_, i) => {
      const q = i >= NRING ? L.rand() * 0.55 : L.rand(), c = col(q < 0.42 ? pick(whites) : q < 0.68 ? pick(greys) : q < 0.84 ? pick(golds) : pick(umbers));
      return { a: L.rand(), b: L.rand(), c: L.rand(), d: L.rand(), e: L.rand(), th: L.rand() * Math.PI * 2, col: c, gold: col(pick(golds), 0.3), w: (i >= NRING ? 0.07 : 0.05) + L.rand() * 0.065, ring: i < NRING, u0: (L.rand() - 0.5) * 2 * (L.hw - 0.05) };
    });
    // ---------------------------------------------------------- snow
    // (flakes are little quads turned to face the camera, so the guard tests them pixel by pixel like everything else)
    const sm = new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false, fog: false });
    sm.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', 'vec4 mvPosition = modelViewMatrix * vec4(instanceMatrix[3].xyz, 1.0);\n  mvPosition.xy += position.xy * length(instanceMatrix[0].xyz);\n  gl_Position = projectionMatrix * mvPosition;'); };
    sm.customProgramCacheKey = () => 'aosta-flake';
    this.snow = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), sm, NP); this.snow.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const snowC = [col('#f4f1e8', 0.15), col('#e9e2cf', 0.2), col('#d2cbbb', 0.25), col('#efd9a6', 0.3)];
    this.F = Array.from({ length: NP }, (_, i) => ({ a: L.rand(), b: L.rand(), c: L.rand(), d: L.rand(), th: L.rand() * Math.PI * 2, aval: i % 2 === 0, fall: i % 4 === 1, sz: 0.038 + 0.04 * L.rand() }));
    for (let i = 0; i < NP; i++) this.snow.setColorAt(i, snowC[i % 7 === 0 ? 3 : i % 3]);
    this.snow.instanceMatrix.array.fill(0); L.add(this.snow);
    // ---------------------------------------------------------- light: the eye (gold, on the floor), round the frame (on the wall behind it), and the lightning
    this.light = L.glows([
      { w: 2.6, d: 2.0, u: CU, out: CO, color: col('#ffc46a', 0.15), strength: 0.9 },
      { wall: true, w: 2.9, d: 2.4, u: 0.15, v: 0.2, color: col('#ffcf7a', 0.15), strength: 1.0 },
      { w: 4.6, d: 3.4, u: 0, out: 1.3, color: 0xdfe8ff, strength: 1.1 },
      { wall: true, w: 3.4, d: 2.8, u: 0, v: 0.1, color: 0xe8eeff, strength: 0.85 },
    ]);
    this.drift = { k: -1, melt: -1 };
    this.p = { u: 0, h: 0, o: 0, wu: 0, wh: 0, wo: 0 }; this.q = { u: 0, h: 0, o: 0, wu: 0, wh: 0, wo: 0 };
    this.c3 = new THREE.Color(); this.spin = 0; this.orbit = 0;
    this.clear(L);
  },

  clear(L) {
    this.colorsOff(); this.storm.visible = false; this.snow.visible = false;
    for (let i = 0; i < 4; i++) this.light.set(i, 0);
    this.spin = 0; this.orbit = 0; this.drift.k = -1; this.drift.melt = -1;
  },
  colorsOff() { this.storm.geometry.attributes.color.array.fill(0); this.storm.geometry.attributes.color.needsUpdate = true; },

  start(L) {
    this.clear(L); this.sfx = {}; this.nextQ = 0.35; this.spin = 0; this.orbit = 0;
    const v = L.voice();
    v.note(55, 2.2, { vol: 0.07, type: 'sine', to: 36, attack: 0.02 }); v.note(110, 1.2, { vol: 0.025, type: 'triangle', to: 70 });
    this.rumble(L, { dur: 2.2, f: 260, vol: 0.05 });
    this.makeWind(L);
  },
  back(L) { this.bT = L.t; this.bSpin = this.spin; this.bCalm = this.calmK(L.t); this.bK = this.drift.k; this.orbit0 = this.orbit; },
  end(L) { this.clear(L); this.stopWind(); },
  reset(L) { this.clear(L); this.stopWind(); },

  // ---------------------------------------------------------------- the storm's state at show-time t
  windAt(t) {
    return Math.max(0.06, 0.55 * ease.smooth(ramp(t, 0, 1.8)) + 0.3 * ease.smooth(ramp(t, T_AV - 0.1, T_AV + 0.6)) + 0.25 * ease.smooth(ramp(t, 3.2, 4.0)) - 1.0 * ease.inOut(ramp(t, T_CALM - 0.3, 7.6))) + (t > 9 ? 0.07 * Math.max(0, Math.sin((t - 9) * 0.7)) : 0);
  },
  calmK(t) { return ease.inOut(ramp(t, T_CALM, 7.9)); },

  // A stroke's point s (0..1 along it), in stage terms (u along, h up from the floor, o out) with the way its width
  // lies (wu, wh, wo), into o.
  // drain (0..1): slide round the ring, down its sides, to the bottom (so that coming down to the floor, nothing passes
  // in front of the picture)
  ringAt(L, R, s, e, T, o, drain = 0) {
    let th = R.th + T * (1.1 + 0.7 * R.d) + s * (0.55 + 0.75 * R.c);
    if (drain > 0) th += wrap(-Math.PI / 2 + (R.a - 0.5) * 1.3 + s * (0.55 + 0.75 * R.c) * 0.7 - th) * drain;
    const c = Math.cos(th), sn = Math.sin(th), pw = 0.18 + 0.62 * e * e;
    const A = this.A0 + 0.03 + e * (0.2 + 0.8 * R.b), B = this.B0 + 0.03 + e * (0.16 + 0.55 * R.b);
    o.u = A * Math.sign(c) * Math.pow(Math.abs(c), pw); o.h = this.cH + B * Math.sign(sn) * Math.pow(Math.abs(sn), pw);
    o.o = -0.05 + e * (0.12 + 0.42 * R.b) + 0.05 * e * Math.sin(th * 3 + T);
    o.wu = c; o.wh = sn; o.wo = 0; return o;
  },
  vortexAt(L, R, s, spin, calm, t, o) {
    const r0 = 0.15 + 1.2 * R.b, h0 = 0.04 + 1.08 * R.c * R.c;
    const h = h0 * (1 - calm * 0.97) + s * 0.12 * (R.d - 0.5) * (1 - calm), r = r0 * (0.62 + 0.5 * h / 1.2) * (1 + 0.15 * calm);
    const th = R.th + spin * 1.5 / (0.3 + r0) + s * (0.32 + 0.38 * R.c) / Math.max(0.2, r);
    const cu = CU + 0.07 * Math.sin(t * 1.3) * (1 - calm), co = CO + 0.06 * Math.cos(t * 1.1) * (1 - calm);
    o.u = cu + r * Math.cos(th); o.o = co + r * Math.sin(th) * 0.78;
    o.h = calm > 0.01 ? h + calm * (this.driftH(o.u, o.o) + 0.014) : h;
    // upright as it wheels; lying down along the drift as it settles (and the drift takes its marks)
    o.wu = Math.cos(th) * calm; o.wo = Math.sin(th) * calm; o.wh = 1 - calm; return o;
  },
  avalAt(L, R, s, ta, o) {
    // down from under the bottom rail, then out along the floor in a tumbling surge
    const H = this.railH - 0.08, fallT = Math.sqrt(2 * H / 9.8), lenA = 0.55 + 0.3 * R.c;
    let dh = ta < fallT ? 4.9 * ta * ta : H + Math.min(1.75, (3.2 + R.d) * (ta - fallT) - 1.9 * (ta - fallT) ** 2 * (ta - fallT < (3.2 + R.d) / 3.8 ? 1 : 0));
    if (ta - fallT > (3.2 + R.d) / 3.8) dh = H + (3.2 + R.d) ** 2 / 7.6;
    const d = Math.max(0, dh - s * lenA), o0 = 0.05 + 0.12 * R.e;
    if (d < H) { o.u = R.u0 + 0.05 * Math.sin(d * 5 + R.th); o.h = this.railH - 0.07 - d; o.o = o0 + 0.07 * d; o.wu = 1; o.wh = 0; o.wo = 0; }
    else { const f = d - H, spread = 0.55 * f * (R.a - 0.5); o.u = R.u0 * (1 + 0.4 * f) + spread; o.o = o0 + 0.07 * H + f * (0.8 + 0.3 * R.b); o.h = 0.03 + 0.28 * Math.abs(Math.sin(f * 3.5 + R.th)) * Math.exp(-f * 0.8); o.wu = 1; o.wh = 0.3; o.wo = 0; }
    return o;
  },
  driftH(u, o) {
    const k = this.drift.kk || 0; if (k <= 0) return 0;
    const g = 0.45 + 0.55 * k, du = (u - CU) / (0.72 * g), dd = (o - CO) / (0.5 * g), rr = du * du + dd * dd;
    if (rr > 6) return 0;
    const ph = Math.atan2(dd, du), rad = Math.sqrt(rr);
    // a heap, blown up on one side into a crest, its surface swept round in ridges
    return k * (1 - (this.drift.mm || 0)) * 0.3 * Math.exp(-Math.pow(rr, 1.25)) * (1 + 0.38 * Math.sin(3 * ph + 2.1) + 0.2 * Math.sin(2 * ph - 0.7) + 0.12 * Math.sin(6 * ph + rad * 8));
  },

  update(L, dt) {
    const ph = L.phase, t = L.t, showing = ph === 'wake' || ph === 'play', back = ph === 'return';
    const W = back ? 0.6 * Math.sin(Math.PI * L.ret) : this.windAt(t);
    if (showing) { this.spin += W * dt * 1.6; this.orbit += (0.55 + W) * dt; }
    else if (back) this.orbit += 1.4 * dt;
    const calm = back ? this.bCalm : this.calmK(t), spin = back ? this.bSpin : this.spin;
    // ---- the drift: up as it settles, melting as it goes
    const dk = showing ? ease.smooth(ramp(t, T_CALM - 0.1, 7.7)) : back ? this.bK : 0, melt = back ? ease.inOut(ramp(L.ret, 0, 0.7)) : 0;
    this.drift.kk = Math.max(0, dk); this.drift.mm = melt;
    if (Math.abs(dk - this.drift.k) > 1e-4 || Math.abs(melt - this.drift.melt) > 1e-4) this.layDrift(L, dk, melt);
    // ---- the strokes
    const pos = this.storm.geometry.attributes.position.array, cl = this.storm.geometry.attributes.color.array, p = this.p, q = this.q;
    const goldK = showing ? ease.smooth(ramp(t, 3.5, 4.6)) : 0, flash = this.flash(L, t, showing);
    const retK = back ? ease.inOut(ramp(L.ret, 0.04, 0.42)) : 0, retD = back ? 1 - ease.inOut(ramp(L.ret, 0.38, 0.78)) : 0, retE = back ? 1 - ease.inOut(ramp(L.ret, 0.68, 1)) : 1;
    for (let i = 0; i < NR; i++) {
      const R = this.R[i];
      let alpha;
      if (R.ring) alpha = showing ? ease.smooth(ramp(t, 0.05 + 0.6 * R.a, 0.5 + 0.6 * R.a)) : 1;
      else alpha = showing ? (t >= T_AV + 0.45 * R.a ? 1 : 0) : 1;
      if (back) alpha = 1 - ramp(L.ret, 0.86 + 0.08 * R.a, 1);
      alpha *= 1 - 0.15 * calm;
      for (let j = 0; j <= K; j++) {
        const s = j / K;
        if (back) {
          this.vortexAt(L, R, s, spin, calm, this.bT, p);
          this.ringAt(L, R, s, retE, this.orbit, q, retD);
          this.mix(p, q, retK, 0.12 * Math.sin(Math.PI * retK));
        } else if (R.ring) {
          const e = ease.out(ramp(t, 0.05 + 0.3 * R.a, 1.7 + 0.3 * R.a));
          const k = ramp(t, 2.4 + 1.1 * R.a, 3.7 + 1.1 * R.a), k1 = ease.inOut(clamp01(k / 0.5)), k2 = ease.inOut(clamp01((k - 0.42) / 0.58));
          this.ringAt(L, R, s, e, this.orbit, p, k1);
          if (k2 > 0) { this.vortexAt(L, R, s, spin, calm, t, q); this.mix(p, q, k2, 0.25 * Math.sin(Math.PI * k2)); }
        } else {
          const ta = t - (T_AV + 0.45 * R.a);
          if (ta <= 0) { p.u = R.u0; p.h = this.railH; p.o = -0.1; p.wu = 1; p.wh = 0; p.wo = 0; }
          else this.avalAt(L, R, s, ta, p);
          const k = ease.inOut(ramp(t, 3.2 + 0.7 * R.a, 4.1 + 0.7 * R.a));
          if (k > 0) { this.vortexAt(L, R, s, spin, calm, t, q); this.mix(p, q, k, 0.15 * Math.sin(Math.PI * k)); }
        }
        // width: full in the middle of the stroke, the tail thinner
        const w = R.w * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, s * 1.15 + 0.08))) * (1 + 0.4 * calm);
        const x = L.cx + L.tx * p.u + L.nx * p.o, z = L.cz + L.tz * p.u + L.nz * p.o, y = L.y + p.h;
        const wx = (L.tx * p.wu + L.nx * p.wo) * w, wz = (L.tz * p.wu + L.nz * p.wo) * w, wy = p.wh * w;
        const v = (i * (K + 1) + j) * 2;
        pos[v * 3] = x - wx; pos[v * 3 + 1] = Math.max(L.y + 0.008, y - wy); pos[v * 3 + 2] = z - wz;
        pos[v * 3 + 3] = x + wx; pos[v * 3 + 4] = Math.max(L.y + 0.008, y + wy); pos[v * 3 + 5] = z + wz;
        // colour: its own, gold near the eye once the light breaks through, a bright flash in the lightning
        const near = goldK * Math.exp(-((p.u - CU) ** 2 + (p.o - CO) ** 2) * 3) * (R.e > 0.4 ? 1 : 0.3);
        this.c3.copy(R.col).lerp(R.gold, Math.min(1, near * 0.9));
        const lit = (0.92 + 0.08 * Math.sin(s * 9 + i)) * (1 + flash * 0.9);
        for (let sd = 0; sd < 2; sd++) { const c = (v + sd) * 4, edge = sd ? 1 : 0.86; cl[c] = this.c3.r * lit * edge; cl[c + 1] = this.c3.g * lit * edge; cl[c + 2] = this.c3.b * lit * edge; cl[c + 3] = alpha * (0.75 + 0.25 * Math.sin(Math.PI * s)); }
      }
    }
    this.storm.geometry.attributes.position.needsUpdate = true; this.storm.geometry.attributes.color.needsUpdate = true;
    this.storm.visible = true;
    // ---- snow
    this.snowStep(L, t, showing, back, spin, calm);
    // ---- light
    const eye = showing ? goldK * (1 - 0.25 * calm) * (1 + 0.06 * Math.sin(t * 1.7)) : back ? (1 - ease.smooth(L.ret)) * 0.75 : 0;
    this.light.set(0, eye); this.light.set(1, eye * 0.85 + (showing ? 0.15 * ease.smooth(ramp(t, 0.2, 1.5)) * (1 - calm) : 0));
    this.light.set(2, flash); this.light.set(3, flash);
    // ---- sound
    this.sound(L, t, showing, back, W, dt);
  },
  // lerp p towards q by k, swooping out into the room on the way (a swoop of `out` metres at the middle)
  mix(p, q, k, out) { p.u += (q.u - p.u) * k; p.h += (q.h - p.h) * k - out * 0.3; p.o += (q.o - p.o) * k + out; p.wu += (q.wu - p.wu) * k; p.wh += (q.wh - p.wh) * k; p.wo += (q.wo - p.wo) * k; const l = Math.hypot(p.wu, p.wh, p.wo) || 1; p.wu /= l; p.wh /= l; p.wo /= l; p.h = Math.max(0.01, p.h); },
  flash(L, t, showing) {
    if (!showing) return 0;
    const f = (at, a) => (t >= at ? a * Math.exp(-(t - at) * 9) : 0);
    let k = f(T_BOOM, 1) + f(T_BOOM + 0.24, 0.7) + f(T_BOOM + 0.33, 0.35);
    if (t > 11) { const c = (t - 11) % 10.5; k += c < 1 ? 0.22 * Math.exp(-c * 7) + 0.12 * (c > 0.18 ? Math.exp(-(c - 0.18) * 8) : 0) : 0; }
    return Math.min(1, k);
  },

  layDrift(L, k, melt) {
    this.drift.k = k; this.drift.melt = melt;
    const pos = this.storm.geometry.attributes.position.array, cl = this.storm.geometry.attributes.color.array, base = this.nRV;
    const hi = new THREE.Color(1, 0.97, 0.9), lo = new THREE.Color(0.42, 0.45, 0.53), gold = this.R[0].gold, c = this.c3;
    const lx = -0.35, ly = 0.85, lz = 0.4, e = 0.02;
    for (let r = 0; r <= DR; r++) for (let s = 0; s < DS; s++) {
      const v = base + r * DS + s, a = (s / DS) * Math.PI * 2, rr = (r / DR) * DRIFT_R * (0.4 + 0.6 * k);
      const u = CU + Math.cos(a) * rr, o = CO + Math.sin(a) * rr * 0.7, h = this.driftH(u, o);
      pos[v * 3] = L.cx + L.tx * u + L.nx * o; pos[v * 3 + 1] = L.y + 0.009 + h; pos[v * 3 + 2] = L.cz + L.tz * u + L.nz * o;
      const nu = -(this.driftH(u + e, o) - this.driftH(u - e, o)) / (2 * e), no = -(this.driftH(u, o + e) - this.driftH(u, o - e)) / (2 * e), nl = Math.hypot(nu, 1, no);
      const lit = clamp01((nu * lx * 2.2 + ly + no * lz * 2.2) / Math.hypot(nu * 2.2, 1, no * 2.2) * 1.1 - 0.1);
      c.copy(lo).lerp(hi, Math.pow(lit, 1.6)).lerp(gold, 0.4 * Math.exp(-((u - CU) ** 2 + (o - CO) ** 2) * 2.5)).lerp(lo, melt * 0.5);
      const S = h / Math.max(1e-4, k * (1 - melt) * 0.3);
      cl[v * 4] = c.r; cl[v * 4 + 1] = c.g; cl[v * 4 + 2] = c.b; cl[v * 4 + 3] = k > 0.01 ? clamp01((S - 0.08) / 0.2) * (1 - melt * 0.8) : 0;
    }
  },

  snowStep(L, t, showing, back, spin, calm) {
    const M = this.snow.instanceMatrix.array, p = this.p, q = this.q;
    const retK = back ? ease.inOut(ramp(L.ret, 0.04, 0.42)) : 0, retD = back ? 1 - ease.inOut(ramp(L.ret, 0.38, 0.78)) : 0;
    let any = false;
    for (let i = 0; i < NP; i++) {
      const F = this.F[i]; let a = 1;
      if (!back && F.aval && t < T_AV + 0.6 * F.a) { a = 0; }
      // where it would be in the whirlwind
      const r0 = 0.08 + 1.35 * F.b, th = F.th + spin * 1.9 / (0.25 + r0) * (0.85 + 0.3 * F.d), h0 = 0.03 + 1.06 * F.c;
      const vu = CU + r0 * Math.cos(th), vo = CO + r0 * Math.sin(th) * 0.78;
      let u, h, o;
      if (back) {
        u = vu; o = vo; h = h0 * (1 - this.bCalm) + this.bCalm * (this.driftH(vu, vo) + 0.02);
        const e = 1 - ease.inOut(ramp(L.ret, 0.68, 1)); let th2 = F.th + this.orbit * 2.2; th2 += wrap(-Math.PI / 2 + (F.a - 0.5) * 1.4 - th2) * retD; const c = Math.cos(th2), s = Math.sin(th2);
        const A = this.A0 + e * (0.1 + 0.7 * F.b), B = this.B0 + e * (0.08 + 0.55 * F.b);
        u += (A * Math.sign(c) * Math.pow(Math.abs(c), 0.4) - u) * retK; h += (this.cH + B * Math.sign(s) * Math.pow(Math.abs(s), 0.4) - h) * retK; o += (-0.05 + e * (0.1 + 0.5 * F.d) - o) * retK;
        a = 1 - ramp(L.ret, 0.75 + 0.2 * F.a, 1);
      } else if (!F.aval) {
        // round the frame
        const kk = ramp(t, 2.4 + 1.2 * F.a, 3.7 + 1.2 * F.a), k1 = ease.inOut(clamp01(kk / 0.5)), k = ease.inOut(clamp01((kk - 0.42) / 0.58));
        const e = ease.out(ramp(t, 0.05 + 0.3 * F.a, 1.6 + 0.3 * F.a)); let th2 = F.th + this.orbit * 2.2; th2 += wrap(-Math.PI / 2 + (F.a - 0.5) * 1.4 - th2) * k1; const c = Math.cos(th2), s = Math.sin(th2);
        const A = this.A0 + 0.04 + e * (0.1 + 0.7 * F.b), B = this.B0 + 0.04 + e * (0.08 + 0.55 * F.b);
        u = A * Math.sign(c) * Math.pow(Math.abs(c), 0.25 + 0.2 * e); h = this.cH + B * Math.sign(s) * Math.pow(Math.abs(s), 0.25 + 0.2 * e); o = -0.05 + e * (0.1 + 0.5 * F.d);
        a = ease.smooth(ramp(t, 0.05 + 0.5 * F.a, 0.4 + 0.5 * F.a));
        if (k > 0) { u += (vu - u) * k; h += (h0 - h) * k - 0.1 * Math.sin(Math.PI * k); o += (vo - o) * k + 0.2 * Math.sin(Math.PI * k); }
      } else {
        // in the avalanche: down from the rail, a powder cloud out over the floor
        const ta = Math.max(0, t - T_AV - 0.6 * F.a), H = this.railH, fallT = Math.sqrt(2 * H / 9.8) * (0.9 + 0.3 * F.d);
        if (ta < fallT) { const f = ta / fallT; u = (F.b - 0.5) * 2 * (L.hw - 0.05); h = H - 0.1 - (H - 0.1) * f * f; o = 0.05 + 0.15 * F.c + 0.1 * f; }
        else { const f = Math.min(1.6, (ta - fallT) * 2.2); u = (F.b - 0.5) * 2 * (L.hw - 0.05) * (1 + 0.6 * f); o = 0.2 + 0.15 * F.c + f * (0.5 + 0.6 * F.d); h = 0.02 + (0.15 + 0.5 * F.c) * Math.sin(Math.min(Math.PI, f * 2.2)) * (0.6 + 0.4 * F.a); }
        const k = ease.inOut(ramp(t, 3.3 + 0.9 * F.a, 4.2 + 0.9 * F.a));
        if (k > 0) { u += (vu - u) * k; h += (h0 - h) * k; o += (vo - o) * k; }
      }
      if (!back && calm > 0) {
        // settling: down onto the drift (where it stays, a glint), and a few go on falling softly while you look
        const land = this.driftH(u, o) + 0.02;
        if (F.fall && t > 7) { const c = ((t - 7) * (0.14 + 0.08 * F.d) + F.a) % 1; h = 1.12 * (1 - c) + land * c; u = CU + (F.b - 0.5) * 2.4 + 0.1 * Math.sin(t * 0.7 + F.th); o = CO + (F.c - 0.5) * 1.5; a = Math.min(1, Math.sin(Math.PI * c) * 3); }
        else { const s2 = ease.inOut(clamp01((calm - 0.1 * F.a) / 0.9)); h = h + (land - h) * s2; u += 0.15 * s2 * (F.d - 0.5); }
      }
      // (straight into the instance matrix: a scale and a place, faded by shrinking)
      const j = i * 16, sc = F.sz * Math.max(0, a); M[j] = sc; M[j + 5] = sc; M[j + 10] = sc; M[j + 15] = 1;
      M[j + 12] = L.cx + L.tx * u + L.nx * o; M[j + 13] = L.y + Math.max(0.02, h); M[j + 14] = L.cz + L.tz * u + L.nz * o; if (a > 0) any = true;
    }
    this.snow.instanceMatrix.needsUpdate = true;
    this.snow.visible = any;
  },

  // ---------------------------------------------------------------- sound
  noiseBuf(c) { if (!this._nb || this._nb.sampleRate !== c.sampleRate) { const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); let last = 0; for (let i = 0; i < n; i++) { last = last * 0.6 + (Math.random() * 2 - 1) * 0.4; d[i] = last * 1.6; } this._nb = b; } return this._nb; },
  // the wind: noise through a swept band, and a low roar under it
  makeWind(L) {
    const v = L.voice(), c = v.ctx, out = v.out(); if (!c || !out || this.wind) return;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf(c); src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 400; bp.Q.value = 0.9;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180;
    const g1 = c.createGain(), g2 = c.createGain(); g1.gain.value = 0; g2.gain.value = 0;
    src.connect(bp); bp.connect(g1); g1.connect(out); src.connect(lp); lp.connect(g2); g2.connect(out); src.start();
    this.wind = { src, bp, g1, g2 };
  },
  stopWind() { const w = this.wind; if (!w) return; try { w.src.stop(); } catch { /* stopped */ } w.src.disconnect(); this.wind = null; },
  rumble(L, { at = 0, dur = 2, f = 200, vol = 0.05 } = {}) {
    const v = L.voice(), c = v.ctx, out = v.out(); if (!c || !out) return;
    const t = c.currentTime + at, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf(c); s.loop = true; fl.type = 'lowpass'; fl.frequency.setValueAtTime(f, t); fl.frequency.exponentialRampToValueAtTime(Math.max(40, f * 0.35), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.05, dur * 0.1)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  crack(L, at = 0, vol = 0.09) {
    const v = L.voice(), c = v.ctx, out = v.out(); if (!c || !out) return;
    const t = c.currentTime + at, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf(c); fl.type = 'highpass'; fl.frequency.value = 700;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(vol * 0.3, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + 0.5);
  },
  sound(L, t, showing, back, W, dt) {
    const v = L.voice(), c = v.ctx;
    if (this.wind && c) {
      const near = Math.max(0, 1 - Math.hypot(L.k.G.camera.position.x - L.cx, L.k.G.camera.position.z - L.cz) / 16);
      this.wind.g1.gain.setTargetAtTime(0.07 * W * near, c.currentTime, 0.2); this.wind.g2.gain.setTargetAtTime(0.09 * W * W * near, c.currentTime, 0.3);
      this.wind.bp.frequency.setTargetAtTime(260 + 900 * W + 120 * Math.sin(t * 2.3), c.currentTime, 0.25);
    }
    if (!showing) return;
    const once = (k, at, f) => { if (!this.sfx[k] && t >= at) { this.sfx[k] = 1; f(); } };
    once('aval', T_AV, () => { this.rumble(L, { dur: 2.8, f: 320, vol: 0.075 }); this.rumble(L, { at: 0.1, dur: 1.4, f: 1400, vol: 0.02 }); v.note(49, 1.8, { vol: 0.05, type: 'sine', to: 33 }); });
    once('boom', T_BOOM, () => { this.crack(L, 0, 0.1); this.crack(L, 0.24, 0.05); this.rumble(L, { at: 0.12, dur: 3.6, f: 220, vol: 0.09 }); this.rumble(L, { at: 0.5, dur: 2.6, f: 120, vol: 0.06 }); });
    once('calm', T_CALM + 0.5, () => { for (const [n, d] of [['F3', 4], ['A3', 4], ['C4', 4], ['F4', 3.6], ['F2', 4.2]]) v.note(midi(n), d, { vol: n === 'F2' ? 0.022 : 0.014, type: 'sine', attack: 0.5 }); });
    if (t > 11) { const cyc = (t - 11) % 10.5; if (cyc < dt * 1.5) this.rumble(L, { at: 0.35, dur: 2.6, f: 140, vol: 0.035 }); }
    // the shiver: each part comes in and keeps on in quavers, softly, louder as the storm grows; off for the calm
    const q = 0.25;
    while (this.nextQ < Math.min(t + 0.2, T_CALM + 0.4)) {
      const at = this.nextQ - t, k = this.nextQ;
      if (at > -0.05) for (const [t0, n] of SHIVER) if (k >= t0) v.note(midi(n), 0.13, { at: Math.max(0, at), vol: 0.006 + 0.008 * Math.min(1, k / 4), type: 'triangle', attack: 0.006 });
      this.nextQ += q;
    }
  },
});
