// Frederic Edwin Church, View of Cotopaxi (1857), Gallery 161. The word: erupt.
//
// His Andes, in his glowing, glazed finish: a snow cone in a gold evening haze, a green valley, a waterfall pouring
// into a still lake that holds the sky, palms, a canoe. Look at it and the warm light of his sky comes up on the wall
// round the frame, and his waterfall spills out from under the bottom rail, white veils arcing down to the floor, mist
// at their foot. Where it lands his lake spreads out over the floorboards, glassy and gold with the sky in it, the
// room's own reflection in it, its banks coming up in dark greens; his palms grow up on the right bank and unfurl, his
// boulder rises beside them, and a canoe slides out from behind the falls and paddles slowly round the lake. Then the
// volcano: a rumble, the lake shivers, a few small puffs come up from behind the top of the frame right above his peak,
// plucked strings (and a hushed chord) as in Haydn's The Creation (1798) before "and there was light"; and then
// C major, and the smoke comes up from behind the top of the frame over his peak as a column, which the wind bends
// over and draws out along the wall to the right, a long soft band of grey-brown smoke, lavender-grey underneath, cream
// and rose only along its sunlit upper edge, spreading and thinning to haze over metres, as his Cotopaxi's plume trails
// across the sky. While you keep looking the falls go on pouring, the canoe goes round and the mountain goes on smoking
// into the wind. When you stop, the column lets go of the rail and the last of the smoke drifts off and thins out, the falls
// run dry, the palms fold back into the floor and the lake draws back in under the picture.
//
// Nothing that rises passes in front of a picture: the smoke comes out behind the top rail and keeps above the frame
// whenever it is in front of the wall (and the guard does the rest); the mist and spray stay low over the lake.
// Three draw calls: the floor (lake, banks, the falls and the glow on the wall, one shader), the soft cards (smoke,
// mist, spray, foliage, sorted, one instanced shader) and one rig (palms, boulder, canoe).
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, shape, canvasTexture, walk } from '../paintlife.js';
import { strokes } from './brush.js';
import { score, hz } from './stagecraft.js';

const TAU = Math.PI * 2;
const PEAK_U = -0.2;
const TOPS = 2.26, TOPS_R = 1.98;              // above the frames to the left (the tall neighbour's top is 2.16 m), and to the right (1.89 m)                           // above his peak (along the wall, from the middle)
const FALLS = [{ u: -0.05, w: 0.072, v: 0.56, t0: 0.3 }, { u: -0.26, w: 0.016, v: 0.42, t0: 0.85 }];     // the main falls, and the thin veil left of it
const LAKE = { u: -0.06, o: 0.36, a: 1.0, b: 0.4 };   // the lake: centre and half sizes (it spreads inside this)
const FOOT = { u: -0.05, o: 0.44 };            // where the main falls land (set from the falls when built)
const T_LAND = 0.82, T_PALM = 1.7, T_CANOE = 2.5, T_RUMBLE = 3.4, T_ERUPT = 4.4;
const LIFE = 10, WIND = 0.42;                 // a puff of the plume lives this long, carried along by the wind (m/s)
const N_PRE = 7, N_PLUME = 112, DT_E = LIFE / N_PLUME, N_CLOUD = N_PRE + N_PLUME, N_MIST = 26, N_SPRAY = 24, N_FOL = 64, N_DAB = 128;
const NC = N_CLOUD + N_MIST + N_SPRAY + N_FOL + N_DAB;
const NS = 22, NW = 5;                         // the falls' sheet: rows down, columns across
// the lake's edge, as the shader draws it (and the banks' clumps are put on it)
const edgeOf = a => 1 + 0.08 * Math.sin(3 * a + 1.3) + 0.05 * Math.sin(5 * a + 0.4) + 0.03 * Math.sin(9 * a + 2.0);
const PALMS = [{ u: 0.9, o: 0.34, s: 0.64, lean: 0.16, yaw: 0.5, t0: T_PALM }, { u: 1.16, o: 0.6, s: 0.44, lean: -0.1, yaw: 2.4, t0: T_PALM + 0.35 }];
const ROCK = { u: 0.8, o: 0.72 };
// the gorge the falls come down into: dark rocks at the foot of the wall either side of them [along, out, size, turn]
const CLIFFS = [[-0.42, 0.06, 1.05, 0.3], [0.2, 0.05, 1.2, 2.0], [-0.17, 0.02, 0.62, 4.0]];

lifeFor(76571, {
  title: /^View of Cotopaxi/,
  word: 'erupt',
  stage: { out: 1.0, half: 1.3, cam: { dist: 2.9, height: 1.1, side: 0.03, fov: 55, lookU: 0, lookOut: 0, lookH: 1.14, whole: false } },
  wake: 2, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.3) => P.near(h, a);
    this.crownH = L.crown - L.y; this.railH = L.rail - L.y;
    this.v = new THREE.Vector3(); this.w = new THREE.Vector3(); this.f = new THREE.Vector3();
    this.buildFloor(L, col);
    this.buildCards(L, col);
    this.buildRig(L, col);
    // the canoe's way: out from behind the falls, then round the lake
    this.wIn = walk([[-0.14, -0.32], [-0.15, 0.05], [-0.3, 0.36]], { speed: 0.13 });
    this.wLoop = walk([[-0.3, 0.36], [-0.55, 0.58], [-0.62, 0.74, 0.7], [-0.32, 0.86], [0.08, 0.8], [0.34, 0.6, 0.9], [0.24, 0.44], [-0.02, 0.52], [-0.3, 0.36]], { speed: 0.11 });
    this.cp = {}; this.band = this.makeScore(L);
    this.hiss = L.voice().loop({ lp: 2800, hp: 520 });
    this.hideAll();
  },

  // ---------------------------------------------------------------- the floor: lake, banks, falls, the glow on the wall
  buildFloor(L, col) {
    const pos = [], kind = [], sw = [];
    const push = (p, k, s = 0, w = 0) => { pos.push(p.x, p.y, p.z); kind.push(k); sw.push(s, w); };
    const quad = (a, b, c, d, k) => { for (const p of [a, b, c, a, c, d]) push(p, k); };
    const F = (u, o) => L.floor(u, o, new THREE.Vector3()), Wp = (u, h) => L.at(u, h - (L.cy - L.y), -L.wall + 0.004, new THREE.Vector3());
    quad(F(-1.44, -L.wall), F(1.34, -L.wall), F(1.34, 1.14), F(-1.44, 1.14), 0);
    quad(Wp(-1.05, 0.85), Wp(1.15, 0.85), Wp(1.15, 3.75), Wp(-1.05, 3.75), 1);
    // the falls: a sheet from under the bottom rail, thrown out a little, arcing down to the lake
    FALLS.forEach((fa, fi) => {
      const H0 = this.railH - 0.012, Tf = Math.sqrt(2 * H0 / 9.8), at = (s, w) => {
        const tau = s * Tf, o = -0.012 + fa.v * tau, h = H0 - 4.9 * tau * tau, u = fa.u + w * fa.w * (1 + 1.5 * s * s);
        return L.at(u, h - (L.cy - L.y), o, new THREE.Vector3());
      };
      fa.Tf = Tf; fa.land = -0.012 + fa.v * Tf; if (fi === 0) FOOT.o = fa.land;
      for (let i = 0; i < NS; i++) for (let j = 0; j < NW; j++) {
        const s0 = i / NS, s1 = (i + 1) / NS, w0 = j / NW * 2 - 1, w1 = (j + 1) / NW * 2 - 1;
        for (const [s, w] of [[s0, w0], [s1, w0], [s1, w1], [s0, w0], [s1, w1], [s0, w1]]) push(at(s, w), 2 + fi, s, w);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
    g.setAttribute('aSW', new THREE.Float32BufferAttribute(sw, 2));
    // his water's streaks, and the banks' foliage in fine dabs
    const streak = canvasTexture(64, 256, (c, w, h) => {
      c.fillStyle = 'rgb(70,70,70)'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        const x = L.rand() * w, lw = 1 + L.rand() * 4, v = 120 + Math.floor(L.rand() * 135), y0 = L.rand() * h, len = 40 + L.rand() * 200;
        c.strokeStyle = `rgba(${v},${v},${v},${0.35 + 0.5 * L.rand()})`; c.lineWidth = lw;
        for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { c.beginPath(); c.moveTo(x + ox, y0 + oy); c.lineTo(x + ox + (L.rand() - 0.5) * 3, y0 + oy + len); c.stroke(); }
      }
    }, false);
    streak.wrapS = streak.wrapT = THREE.RepeatWrapping;
    const bank = strokes({
      size: 256, seed: 76571, n: 2600, len: [4, 10], width: [2, 4], bend: 0.4, lift: 0.2, base: col('#2c3a22', 0.3).getStyle(),
      colors: [['#33452a', 4], ['#4a5e30', 3], ['#5e7034', 2], ['#7c8a3e', 1.2], ['#9aa04a', 0.6], ['#6a5a3a', 0.8], ['#26301e', 2]].map(([c, w]) => [col(c, 0.25).getStyle(), w]),
      angle: (x, y, r) => r() * Math.PI,
    });
    const u = this.fu = {
      uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uC: { value: new THREE.Vector3(L.cx, L.cy, L.cz) },
      uLake: { value: new THREE.Vector4(LAKE.u, LAKE.o, LAKE.a, LAKE.b) }, uFoot: { value: new THREE.Vector4(FOOT.u, FOOT.o, FALLS[1].u, FALLS[1].land) },
      uSpread: { value: 0 }, uTime: { value: 0 }, uShiver: { value: 0 }, uFall: { value: new THREE.Vector2(0, 0) },
      uPour: { value: new THREE.Vector4(0, 0, 0, 0) },            // the falls: head and tail (0..1 down), the main one and the veil
      uGlow: { value: new THREE.Vector4(0, 0, 0, 0) },            // the wall: his sky's gold round the frame; the smoke's light (amount, its height, its spread)
      tStreak: { value: streak }, tBank: { value: bank },
      cHi: { value: col('#c8a860', 0.1) }, cMid: { value: col('#7c7a3e', 0.12) }, cLo: { value: col('#2c3a22', 0.2) }, cSky: { value: col('#ecd6a0', 0.1) },
      cFoam: { value: col('#f4efe2', 0.12) }, cWaterLo: { value: col('#8c979c', 0.25) }, cGold: { value: col('#f2c27a', 0.2) }, cRose: { value: col('#e8a08c', 0.2) },
      cPeak: { value: new THREE.Vector2(PEAK_U, this.crownH) },
    };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aKind; attribute vec2 aSW; varying float vKind; varying vec2 vSW;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vKind = aKind; vSW = aSW;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform vec3 uO, uC; uniform vec4 uAx, uLake, uFoot, uPour, uGlow; uniform vec2 uFall, cPeak; uniform float uSpread, uTime, uShiver;
uniform sampler2D tStreak, tBank; uniform vec3 cHi, cMid, cLo, cSky, cFoam, cWaterLo, cGold, cRose;
uniform sampler2D tRefl; uniform mat4 reflMatrix; uniform float reflOn; uniform float reflY;
varying float vKind; varying vec2 vSW; vec3 fCol; float fA;
float lakeR(vec2 q) { vec2 e = vec2((q.x - uLake.x) / uLake.z, (q.y - uLake.y) / uLake.w); float a = atan(e.y, e.x);
  return length(e) / (1.0 + 0.08 * sin(3.0 * a + 1.3) + 0.05 * sin(5.0 * a + 0.4) + 0.03 * sin(9.0 * a + 2.0)); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
vec2 lq = lifeP.xz - uO.xz; float su = dot(lq, uAx.xy), so = dot(lq, uAx.zw);
if (vKind > 1.5) {
  // the falls: white veils, streaming down, cream where his light catches them, grey-blue in their own shade
  float fi = vKind - 2.0, s = vSW.x, w = vSW.y, hd = fi < 0.5 ? uPour.x : uPour.z, tl = fi < 0.5 ? uPour.y : uPour.w;
  float k = texture2D(tStreak, vec2(w * (fi < 0.5 ? 0.45 : 0.15) + fi * 0.37, (s + 0.9 * s * s) * 0.9 - uTime * 1.7)).r;
  float k2 = texture2D(tStreak, vec2(w * 0.3 + 0.5, (s + 0.9 * s * s) * 0.5 - uTime * 1.1)).r;
  float ss = s + (k - 0.5) * 0.1;
  float on = step(0.0005, hd) * (1.0 - smoothstep(hd - 0.06, hd, ss)) * smoothstep(tl - 0.06, tl, ss);
  float edge = 1.0 - smoothstep(0.55 - 0.25 * k2, 1.0, abs(w));
  fCol = mix(cWaterLo, cFoam, smoothstep(0.3, 0.85, k * 0.7 + k2 * 0.3));
  fCol = mix(fCol, cFoam * vec3(1.03, 0.97, 0.86) + cGold * 0.08, (1.0 - s) * 0.35);
  fCol = mix(fCol, cFoam, smoothstep(0.8, 1.0, s) * 0.6);
  fA = on * edge * (0.5 + 0.5 * k) * (fi < 0.5 ? 0.92 : 0.75);
} else if (vKind > 0.5) {
  // the wall round the frame: the gold of his evening sky; above it, the smoke's own glow, rose
  vec2 q = lifeP.xz - uC.xz; float wu = dot(q, uAx.xy), wv = lifeP.y - uC.y;
  float kg = exp(-(pow(wu / 0.82, 2.0) + pow(wv / 0.62, 2.0)) * 1.6);
  float kp = exp(-(pow((wu - cPeak.x - 0.25 * uGlow.y) / max(0.2, uGlow.w), 2.0) + pow((lifeP.y - uO.y - uGlow.z) / max(0.3, uGlow.w * 0.9), 2.0)));
  fCol = mix(cGold, cRose, kp * uGlow.y / max(0.01, kg * uGlow.x + kp * uGlow.y));
  fA = min(0.8, kg * 0.5 * uGlow.x + kp * 0.14 * uGlow.y) * (1.0 - smoothstep(3.0, 3.75, lifeP.y - uO.y)) * smoothstep(0.85, 1.2, lifeP.y - uO.y) * (1.0 - smoothstep(0.75, 1.05, abs(wu - 0.05)));
} else {
  vec2 st = vec2(su, so);
  float r = lakeR(st), d = length(st - uFoot.xy), d2 = length(st - uFoot.zw), reach = uSpread * 1.75;
  vec4 bk = texture2D(tBank, st / 0.55);
  float grow = step(0.001, uSpread) * (1.0 - smoothstep(reach - 0.08, reach + 0.02, d + (bk.a - 0.5) * 0.1));
  float lake = (1.0 - smoothstep(0.985, 1.0, r)) * grow;
  float bankA = (1.0 - smoothstep(1.13, 1.2, r + (bk.a - 0.55) * 0.1)) * smoothstep(0.95, 0.99, r) * grow * step(0.35, bk.a);
  // the lake: the sky's gold in the middle, his banks' dark greens round the edge
  vec3 c = mix(cHi, cMid, smoothstep(0.05, 0.8, r));
  c = mix(c, cLo, smoothstep(0.5, 1.0, r) * 0.85);
  // his sky in the water, brightest by the falls, where it lies in the picture
  c = mix(c, cSky, exp(-pow((su - uFoot.x - 0.05) / 0.42, 2.0)) * (1.0 - smoothstep(0.05, 0.8, so)) * (1.0 - smoothstep(0.7, 1.0, r)) * 0.5);
  // the falls' reflection, a pale column out from under them, and their foam
  c = mix(c, cFoam, exp(-pow((su - uFoot.x) / 0.1, 2.0)) * (1.0 - smoothstep(0.15, 0.95, so)) * 0.5 * uFall.x);
  // rings from the falls (sharper when the mountain shakes), and a slow glassy shimmer
  float rip = sin(d * 52.0 - uTime * 5.0) * exp(-d * 2.6) * (0.35 + 1.2 * uShiver) * uFall.x + sin(d2 * 60.0 - uTime * 5.5) * exp(-d2 * 5.0) * 0.3 * uFall.y;
  rip += uShiver * 0.6 * sin(r * 40.0 - uTime * 9.0) * smoothstep(0.2, 0.9, r);
  c += cFoam * rip * 0.07;
  // the floor's reflection: the room, the falls and the cloud, upside down in it
  vec4 rp = reflMatrix * vec4(lifeP, 1.0); vec2 ruv = rp.xy / rp.w + vec2(rip * 0.003, rip * 0.005);
  float on = reflOn * (1.0 - step(0.08, abs(lifeP.y - reflY)));
  vec3 refl = min(texture2D(tRefl, ruv).rgb, vec3(2.0));
  c = mix(c, c * 0.6 + refl * vec3(0.75, 0.78, 0.6), 0.4 * on);
  c *= 1.0 - 0.25 * smoothstep(0.5, 1.0, r);
  c = mix(c, cFoam, (exp(-pow(d / 0.075, 2.0)) * uFall.x + exp(-pow(d2 / 0.04, 2.0)) * uFall.y) * 0.75);
  // the banks: his foliage in fine dabs, sunlit on the far side
  vec3 b = bk.rgb * mix(0.85, 1.25, smoothstep(0.0, 1.0, su * 0.5 + 0.5));
  fCol = mix(b, c, lake);
  fA = max(lake * 0.96, bankA * 0.95);
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'cotopaxi-floor';
    this.floor = new THREE.Mesh(g, m); this.floor.renderOrder = 5; this.floor.position.y = 0.015;
    L.add(this.floor);
    // (the wall and the falls are not on the floor: the floor's quad is lifted, they are not)
    const pa = g.attributes.position.array; for (let i = 0; i < pa.length; i += 3) if (kind[i / 3] !== 0) pa[i + 1] -= 0.015;
    Object.assign(u, L.mirrored(this.floor));
  },

  // ---------------------------------------------------------------- soft cards: smoke, mist, spray, foliage
  buildCards(L, col) {
    const atlas = canvasTexture(256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const blob = (x, y, r, a, lum = 255) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${lum},${lum},${lum},${a})`); gr.addColorStop(0.6, `rgba(${lum},${lum},${lum},${a * 0.6})`); gr.addColorStop(1, `rgba(${lum},${lum},${lum},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
      // 0: a cloudlet, lumpy (its red is how far each lump stands out, for the light)
      g.save(); g.beginPath(); g.rect(0, 0, 128, 128); g.clip();
      // (no round disc under it: a heap of lumps, flatter below, so no puff reads as a ball)
      blob(64, 70, 34, 0.5, 130);
      for (let i = 0; i < 26; i++) { const a = L.rand() * TAU, rr = Math.sqrt(L.rand()) * 36, y = 66 + Math.sin(a) * rr * 0.75; blob(64 + Math.cos(a) * rr * 1.1, y, 10 + L.rand() * 15 * (1 - Math.max(0, y - 70) / 50), 0.38, 140 + Math.floor(L.rand() * 115) - Math.max(0, Math.floor(y - 70))); }
      g.restore();
      // 1: mist, wide and soft
      g.save(); g.beginPath(); g.rect(128, 0, 128, 128); g.clip(); blob(192, 64, 58, 0.7); blob(178, 70, 30, 0.3); blob(208, 58, 28, 0.3); g.restore();
      // 2: one painted dab, a few loaded strokes laid over each other, ragged at the edge (red: lit to shaded)
      g.save(); g.beginPath(); g.rect(0, 128, 128, 128); g.clip(); g.lineCap = 'round';
      for (let i = 0; i < 14; i++) {
        const y = 192 + (L.rand() - 0.5) * 56, half = 40 * Math.sqrt(1 - Math.pow((y - 192) / 30, 2) * 0.8), x0 = 64 - half * (0.7 + 0.3 * L.rand()), x1 = 64 + half * (0.7 + 0.3 * L.rand());
        const v = Math.floor(110 + 145 * clamp01(0.55 - (y - 192) / 70 + (L.rand() - 0.5) * 0.4));
        g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 7 + L.rand() * 7; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(64, y - 4 + L.rand() * 8, x1, y + (L.rand() - 0.5) * 6); g.stroke();
      }
      g.restore();
      // 3: a clump of leaves: small dabs heaped in a mound (red: lit to dark)
      g.save(); g.beginPath(); g.rect(128, 128, 128, 128); g.clip();
      for (let i = 0; i < 170; i++) {
        const a = L.rand() * TAU, rr = Math.sqrt(L.rand()) * 50, x = 192 + Math.cos(a) * rr, y = 196 + Math.sin(a) * rr * 0.8;
        if (y > 236) continue;
        const lit = clamp01(0.5 + (x - 192) / 120 - (y - 196) / 90 + (L.rand() - 0.5) * 0.5), v = Math.floor(60 + 195 * lit);
        g.fillStyle = `rgba(${v},${v},${v},1)`; g.beginPath(); g.ellipse(x, y, 4 + L.rand() * 4, 2 + L.rand() * 2, L.rand() * Math.PI, 0, TAU); g.fill();
      }
      g.restore();
    }, false);
    const n = NC, geo = new THREE.PlaneGeometry(1, 1);
    this.aInfo = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aInfo', this.aInfo); geo.setAttribute('aCol', this.aCol);
    const cu = this.cu = {
      tAtlas: { value: atlas }, uLightW: { value: new THREE.Vector3(L.tx * 0.35 + L.nx * 0.1, 0.9, L.tz * 0.35 + L.nz * 0.1).normalize() },
      cLit: { value: col('#f4d6bc', 0.1) }, cShade: { value: col('#7a7488', 0.15) }, cRim: { value: col('#f0b89a', 0.1) }, cSmoke: { value: col('#6a5e56', 0.15) }, cWet: { value: col('#dfe8ec', 0.05) }, cSmokeLit: { value: col('#c4bcbc', 0.15) },
    };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, cu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aInfo; attribute vec3 aCol; varying vec4 vInfo; varying vec3 vCol; varying vec2 vN; varying vec2 vQ;')
        .replace('#include <project_vertex>', `vec4 mvPosition = modelViewMatrix * vec4(instanceMatrix[3].xyz, 1.0);
  float cs = cos(aInfo.z), sn = sin(aInfo.z); vec2 q = vec2(cs * position.x - sn * position.y, sn * position.x + cs * position.y);
  mvPosition.xy += vec2(q.x * instanceMatrix[0][0], q.y * instanceMatrix[1][1]);
  vN = q * 2.0; vQ = position.xy + 0.5; vInfo = aInfo; vCol = aCol;
  gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D tAtlas; uniform vec3 uLightW, cLit, cShade, cRim, cSmoke, cSmokeLit, cWet; varying vec4 vInfo; varying vec3 vCol; varying vec2 vN; varying vec2 vQ;')
        .replace('#include <map_fragment>', `{
  float kd = vInfo.x; vec2 cell = kd < 0.5 ? vec2(0.0, 1.0) : kd < 1.5 ? vec2(1.0, 1.0) : kd < 2.5 ? vec2(0.0, 0.0) : vec2(1.0, 0.0);
  vec4 tx = texture2D(tAtlas, (clamp(vQ, 0.02, 0.98) + cell) * 0.5);
  vec3 c; float a;
  if (kd < 0.5) {
    // smoke: a lumpy cloudlet, lit from his sunset (warm and high, to the right), lavender in its own shade, a gold rim
    vec3 lv = normalize((viewMatrix * vec4(uLightW, 0.0)).xyz);
    float rr = dot(vN, vN); vec3 n = normalize(vec3(vN * 0.75, sqrt(max(0.1, 1.0 - rr * 0.6)) + 0.9 * (tx.r - 0.62)));
    float lam = clamp(dot(n, lv) * 0.8 + 0.36, 0.0, 1.0), lit = vInfo.w;
    // his plume: grey-brown smoke, lavender-grey underneath, warm cream and rose only where the low sun catches its
    // upper edge; paler and cooler as it thins to haze (lit: how far it has thinned)
    c = mix(cShade, cSmoke, smoothstep(0.2, 0.6, lam));
    c = mix(c, cLit, smoothstep(0.58, 0.95, lam) * 0.85);
    c += cRim * pow(clamp(1.0 - n.z, 0.0, 1.0), 1.5) * 0.3 * smoothstep(0.1, 0.8, dot(normalize(vN + 1e-4), lv.xy));
    c = mix(c, cSmokeLit, lit * 0.45) * vCol;
    a = smoothstep(0.0, 0.55, tx.a) * vInfo.y;
  } else if (kd < 1.5) { c = vCol; a = tx.a * vInfo.y; }
  else if (kd < 2.5) {
    // a dab of his rock: its own colour, lit and shaded by the stroke, and wet where the falls spray it (w)
    c = vCol * (0.5 + 0.75 * tx.r); c = mix(c, cWet, vInfo.w * smoothstep(0.7, 1.0, tx.r) * 0.5); a = smoothstep(0.25, 0.55, tx.a) * vInfo.y;
  }
  else { c = vCol * (0.45 + 0.85 * tx.r); a = smoothstep(0.3, 0.6, tx.a) * vInfo.y; }
  if (a < 0.01) discard;
  diffuseColor = vec4(c, a);
}`);
    };
    m.customProgramCacheKey = () => 'cotopaxi-cards';
    const mesh = this.cards = new THREE.InstancedMesh(geo, m, n);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.count = 0; mesh.renderOrder = 6;
    L.add(mesh);
    // each card's own numbers, and where it is now
    const R = () => L.rand();
    this.C = Array.from({ length: N_CLOUD }, (_, i) => {
      const pre = i < N_PRE, a = R(), b = R(), c = R(), d = R(), e = R();
      if (pre) return { pre, a, b, c, tb: T_RUMBLE + 0.25 + (i / N_PRE) * (T_ERUPT - T_RUMBLE - 0.35) + 0.08 * b, H: 0.18 + 0.3 * b, r1: 0.045 + 0.04 * c, O: 0.06 + 0.1 * d, S: (e - 0.5) * 0.25 };
      // (the first out go highest; it broadens as it climbs, and leans away to the right as his clouds trail: a
      // volcano's plume in the evening wind, never a stem and a cap)
      return { pre, a, b, c, d, j: i - N_PRE };
    });
    // (the puffs along its upper edge warmer, catching his low sun; those underneath cooler)
    const warm = col('#fff0e0', 0.05), cool = col('#e4e2ee', 0.05);
    this.C.forEach(p => { p.tint = cool.clone().lerp(warm, clamp01((p.c - 0.25) * 1.6)); });
    this.M = Array.from({ length: N_MIST }, () => ({ a: R(), b: R(), c: R(), d: R(), e: R(), thin: R() < 0.25, P: 2.0 + 0.9 * R() }));
    this.S = Array.from({ length: N_SPRAY }, () => ({ a: R(), b: R(), c: R(), d: R(), e: R(), thin: R() < 0.25, P: 0.5 + 0.35 * R() }));
    const greens = ['#2e3e24', '#3c5028', '#50642e', '#6a7a36', '#445a30', '#5a5030'].map(c => col(c, 0.25));
    this.Fo = [];
    for (let i = 0; this.Fo.length < N_FOL && i < 400; i++) {
      const th = R() * TAU, re = 1.02 + 0.16 * R(), ed = edgeOf(th), u = LAKE.u + LAKE.a * re * ed * Math.cos(th), o = LAKE.o + LAKE.b * re * ed * Math.sin(th);
      // (thick at the back and the sides, as his forest is; low and open at the front, so the lake shows)
      const front = clamp01((o - LAKE.o) / LAKE.b);
      if (o < 0.03 || Math.abs(u - FOOT.u) < 0.1 && o < 0.25 || R() < front * 0.75) continue;
      this.Fo.push({ u, o, s: (0.05 + 0.09 * R()) * (1 - 0.55 * front), c: greens[Math.floor(R() * greens.length)], d: Math.hypot(u - FOOT.u, o - FOOT.o), spin: R() * TAU });
    }
    // round the palms' feet and the rock, a few more
    for (const p of [...PALMS, ROCK]) for (let j = 0; j < 4 && this.Fo.length < N_FOL; j++) { const a = R() * TAU, rr = 0.05 + 0.08 * R(), u = p.u + Math.cos(a) * rr, o = p.o + Math.sin(a) * rr; this.Fo.push({ u, o, s: 0.05 + 0.05 * R(), c: greens[Math.floor(R() * greens.length)], d: Math.hypot(u - FOOT.u, o - FOOT.o), spin: R() * TAU }); }
    this.mistC = [col('#f2ece0', 0.1), col('#e8e4dc', 0.1)]; this.sprayC = col('#fbf7ee', 0.1);
    // scratch: one row per card, then drawn far to near
    this.px = new Float32Array(n); this.py = new Float32Array(n); this.pz = new Float32Array(n); this.ps = new Float32Array(n);
    this.pk = new Float32Array(n); this.pw = new Float32Array(n); this.pq = new Float32Array(n); this.lit = 0; this.sq = 1; this.pa = new Float32Array(n); this.pr = new Float32Array(n); this.pc = new Float32Array(n * 3); this.dep = new Float32Array(n);
    this.order = Array.from({ length: n }, (_, i) => i); this.byDepth = (a, b) => this.dep[b] - this.dep[a];
    this.cp0 = { u: 0, h: 0, o: 0, r: 0, a: 0 };
  },

  // ---------------------------------------------------------------- the rig: palms, his boulder, the canoe
  buildRig(L, col) {
    const rig = this.rig = L.rig(16, 18000, L.paint({ glow: 0.36, rough: 0.85, side: THREE.DoubleSide }));
    const build = (pos, nor, cl) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); return g; };
    // a palm's trunk: slender, curving, ringed; 1 tall (scaled per palm), bending towards +x
    {
      const pos = [], nor = [], cl = [], R = 12, S = 8, bend = 0.14, light = col('#8e806a', 0.25), dark = col('#776a54', 0.25), c = new THREE.Color();
      const at = (t, a, r) => { const x = bend * t * t, sl = 2 * bend * t, rad = r * (1 - 0.45 * t); const nx = Math.cos(a), nz = Math.sin(a); return [[x + nx * rad, t, nz * rad], [nx, -sl * nx * 0.3, nz]]; };
      for (let i = 0; i < R; i++) for (let j = 0; j < S; j++) {
        const t0 = i / R, t1 = (i + 1) / R, a0 = j / S * TAU, a1 = (j + 1) / S * TAU;
        c.copy(i % 2 ? light : dark).lerp(light, 0.3 + 0.3 * Math.cos(a0 - 0.6));
        for (const [t, a] of [[t0, a0], [t1, a0], [t1, a1], [t0, a0], [t1, a1], [t0, a1]]) { const [p, n] = at(t, a, 0.028); pos.push(...p); nor.push(...n); cl.push(c.r, c.g, c.b); }
      }
      this.gTrunk = rig.geo(build(pos, nor, cl)); this.trunkBend = bend;
    }
    // a crown: eight long fronds of drooping leaflets, his red fruit hanging under them
    {
      const parts = [], dark = col('#34421f', 0.25), mid = col('#5a6e2c', 0.25), lit = col('#9aa64a', 0.25), c = new THREE.Color();
      const pos = [], cl = [];
      for (let k = 0; k < 9; k++) {
        const phi = k / 9 * TAU + 0.3 * Math.sin(k * 2.1), Lf = 0.34 + 0.08 * Math.sin(k * 1.7), droop = 0.8 + 0.5 * ((k * 0.37) % 1), dx = Math.cos(phi), dz = Math.sin(phi);
        const sp = t => [dx * Lf * t, Lf * (0.42 * t - 0.75 * droop * t * t), dz * Lf * t];
        for (let i = 0; i < 12; i++) {
          const t0 = i / 12, t1 = (i + 1) / 12, A = sp(t0), B = sp(t1), ll = 0.11 * Math.sin(Math.PI * (0.12 + 0.88 * t0)) * (1 - 0.3 * t0);
          for (const side of [-1, 1]) {
            const ox = -dz * side, oz = dx * side, tip = [A[0] + (ox * 0.8 + dx * 0.45) * ll, A[1] - 0.55 * ll, A[2] + (oz * 0.8 + dz * 0.45) * ll];
            c.copy(mid).lerp(side * Math.sin(phi - 0.8) > 0 ? lit : dark, 0.5).lerp(lit, t0 * 0.3);
            pos.push(...A, ...B, ...tip); for (let j = 0; j < 3; j++) cl.push(j === 2 ? c.r * 1.1 : c.r * 0.75, j === 2 ? c.g * 1.1 : c.g * 0.75, j === 2 ? c.b * 1.1 : c.b * 0.75);
          }
        }
      }
      const fr = new THREE.BufferGeometry(); fr.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fr.computeVertexNormals(); fr.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
      parts.push(fr);
      const red = col('#b8452a', 0.2), orange = col('#d0782e', 0.2);
      for (let i = 0; i < 6; i++) { const a = i * 1.3; parts.push(shape.move(shape.ball(0.016, i % 2 ? red : orange, 1), 0.03 + Math.cos(a) * 0.018, -0.03 - 0.012 * (i % 3), Math.sin(a) * 0.018)); }
      parts.push(shape.move(shape.cyl(0.02, 0.016, 0.04, 8, dark), 0, -0.012, 0));
      this.gCrown = rig.geo(shape.merge(parts));
    }
    // his boulder: warm ochre and rose in the light, violet in shade, moss on top; and the gorge's dark rocks, mossy
    const rock = (A, B, Cz, seed, warm, rose, shade, moss) => {
      const g = shape.ball(1, 0xffffff, 3), p = g.attributes.position, n = g.attributes.normal;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.07 * Math.sin(x * 3 + z * 2.5 + seed) + 0.03 * Math.sin(y * 5 + x * 4 + seed);
        p.setXYZ(i, x * A * k, Math.max(-0.2, y) * B * k + 0.2 * B, z * Cz * k);
        const nl = new THREE.Vector3(x / A, y / B, z / Cz).normalize(); n.setXYZ(i, nl.x, nl.y, nl.z);
      }
      // painted vertex by vertex, smoothly (his glazes, not facets): lit warm, shaded cool, moss where it faces up
      const c = new THREE.Color(), cl = g.attributes.color;
      for (let i = 0; i < p.count; i++) {
        const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i), l = nx * 0.45 + ny * 0.65 + nz * 0.35, x = p.getX(i), z = p.getZ(i);
        c.copy(shade).lerp(rose, ease.smooth(clamp01(l + 0.55))).lerp(warm, ease.smooth(clamp01((l - 0.15) * 1.6)));
        c.lerp(moss, 0.7 * ease.smooth(clamp01((ny - 0.5) * 2.5)) * (0.6 + 0.4 * Math.sin(x * 37 + z * 23)));
        cl.setXYZ(i, c.r, c.g, c.b);
      }
      return g;
    };
    // (a smooth, dark underbody: the shell of his dabs over it is what is seen; see dabs below)
    this.gRock = rig.geo(rock(0.17, 0.12, 0.14, 0, col('#c69a74', 0.25), col('#b88272', 0.25), col('#6c5654', 0.25), col('#6e7a3c', 0.25)));
    this.gCliff = rig.geo(rock(0.14, 0.2, 0.12, 2.1, col('#8a7258', 0.25), col('#6a5848', 0.25), col('#4e4236', 0.25), col('#46562a', 0.25)));
    // the dabs on the rocks: [rock (0..2 the gorge's, 3 his boulder), its local x, y, z (as its body is laid out), size, colour, wet]
    {
      const moss = ['#34461f', '#4a5e28', '#647230', '#3e4a24'].map(c => col(c, 0.2)), brown = ['#6e5236', '#8a6a46', '#5a4632', '#9a7a52'].map(c => col(c, 0.2)), dark = col('#2a2420', 0.2);
      const ochre = ['#b88e64', '#a87a5c', '#c8a072', '#9a7058'].map(c => col(c, 0.2));
      this.D = [];
      const per = [34, 36, 22, 36];
      per.forEach((n, ri) => {
        const boulder = ri === 3, [A, B, C] = boulder ? [0.17, 0.12, 0.14] : [0.14, 0.2, 0.12];
        for (let j = 0; j < n; j++) {
          let x, y, z; do { x = L.rand() * 2 - 1; y = L.rand() * 1.15 - 0.15; z = L.rand() * 1.25 - 0.25; } while (x * x + y * y + z * z > 1 || x * x + y * y + z * z < 0.05);      // (z: out into the room; few on the back)
          const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l;
          const top = y > 0.55, pick = a => a[Math.floor(L.rand() * a.length)];
          const c = top ? pick(moss) : y < -0.05 ? dark : boulder ? pick(ochre) : (L.rand() < 0.3 ? pick(moss) : pick(brown));
          this.D.push({ ri, x: x * A * 1.08, y: (Math.max(-0.2, y) * 1.08 + 0.2) * B, z: z * C * 1.08, s: (boulder ? 0.11 : 0.11) + 0.06 * L.rand(), c, wet: !boulder && !top && L.rand() < 0.6 ? 1 : 0, spin: L.rand() * TAU });
        }
      });
    }
    // the canoe: a dugout, with its paddler in a white shirt and a straw hat, and his paddle
    {
      // a dugout lofted along its length: a round belly, its ends rising (the sheer), a pale worn gunwale along the top
      const NL = 16, NA = 9, pos = [], cl = [], idx = [], wood = col('#5e3e26', 0.15), lit = col('#7a5434', 0.15), gun = col('#d6bc8a', 0.1), c = new THREE.Color();
      for (let i = 0; i <= NL; i++) {
        const tt = i / NL * 2 - 1, w = 0.036 * Math.pow(Math.max(0.002, 1 - tt * tt), 0.55) + 0.001, d = 0.02 * Math.pow(Math.max(0, 1 - tt * tt), 0.4) + 0.004, sh = 0.006 + 0.016 * Math.pow(tt, 4);
        for (let j = 0; j <= NA; j++) {
          const ph = j / NA * Math.PI, sp = Math.sin(ph);
          pos.push(w * Math.cos(ph), sh - (sh + d) * sp, tt * 0.14);
          c.copy(sp < 0.3 ? gun : wood).lerp(lit, sp >= 0.3 ? clamp01(Math.cos(ph) * 0.8 + 0.3) * 0.7 : 0); cl.push(c.r, c.g, c.b);
        }
      }
      for (let i = 0; i < NL; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
      // and its dark inside, a floor just under the gunwale, so the pale rim reads as a line round an open boat
      const base = pos.length / 3, inn = col('#24180f', 0.1);
      for (let i = 0; i <= NL; i++) { const tt = i / NL * 2 - 1, w = 0.03 * Math.pow(Math.max(0.002, 1 - tt * tt), 0.55), y = 0.003 + 0.012 * Math.pow(tt, 4); for (const sx of [-1, 1]) { pos.push(sx * w, y, tt * 0.135); cl.push(inn.r, inn.g, inn.b); } }
      for (let i = 0; i < NL; i++) { const a = base + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      let hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hg.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); hg.setIndex(idx); hg.computeVertexNormals(); hg = hg.toNonIndexed();
      this.gHull = rig.geo(hg);
      const shirt = col('#f6f0e2', 0.05), skin = col('#7a4e34', 0.2), straw = col('#c8b07c', 0.2), red = col('#a8402c', 0.2);
      this.gMan = rig.geo(shape.merge([
        shape.move(shape.lathe([[0.018, 0], [0.02, 0.02], [0.016, 0.042], [0.008, 0.05]], 8, shirt), 0, 0.01, 0),
        shape.move(shape.box(0.034, 0.012, 0.03, red), 0, 0.014, 0.004),
        shape.move(shape.ball(0.011, skin, 1), 0, 0.064, 0),
        shape.move(shape.cyl(0.02, 0.02, 0.003, 10, straw), 0, 0.071, 0), shape.move(shape.cone(0.011, 0.014, 8, straw), 0, 0.079, 0),
      ]));
      this.gPaddle = rig.geo(shape.merge([shape.move(shape.box(0.005, 0.11, 0.005, col('#8a6a44', 0.15)), 0, -0.04, 0), shape.move(shape.box(0.02, 0.034, 0.004, col('#b89668', 0.15)), 0, -0.108, 0)]));
    }
    this.iTrunk = PALMS.map(() => rig.add(this.gTrunk)); this.iCrown = PALMS.map(() => rig.add(this.gCrown));
    this.iRock = rig.add(this.gRock); this.iCliff = CLIFFS.map(() => rig.add(this.gCliff)); this.iHull = rig.add(this.gHull); this.iMan = rig.add(this.gMan); this.iPaddle = rig.add(this.gPaddle);
    this.parts = [...this.iTrunk, ...this.iCrown, ...this.iCliff, this.iRock, this.iHull, this.iMan, this.iPaddle];
    this.m4 = new THREE.Matrix4(); this.m5 = new THREE.Matrix4(); this.q4 = new THREE.Quaternion(); this.e4 = new THREE.Euler(0, 0, 0, 'YXZ'); this.s4 = new THREE.Vector3();
  },

  makeScore(L) {
    const s = score(L);
    // the falls landing, and the lake spreading
    s.hit(T_LAND, { d: 0.5, vol: 0.03, lp: 1800, hp: 300 }); s.hit(T_LAND + 0.5, { d: 0.3, vol: 0.012, lp: 1500, hp: 400 });
    // a harp's soft rising figure as the palms unfurl (a G major arpeggio)
    [55, 59, 62, 67, 71, 74].forEach((m, i) => s.note(T_PALM + 0.7 + i * 0.09, hz(m), 1.1, { type: 'sine', vol: 0.012, attack: 0.004, over: 2, overVol: 0.2 }));
    // the paddle dipping
    s.loop(T_CANOE + 0.6, 1.15, [{ t: 0, noise: true, d: 0.14, vol: 0.008, lp: 1400, hp: 380 }]);
    // the mountain rumbles
    s.note(T_RUMBLE, 39, 2.2, { type: 'sine', vol: 0.07, attack: 0.9 }); s.hit(T_RUMBLE + 0.1, { d: 2.0, vol: 0.05, lp: 140, attack: 0.7 });
    // Haydn, The Creation: plucked strings and a hush ("und es ward") ... and then C major, "Licht"
    [[T_ERUPT - 1.05, 43], [T_ERUPT - 0.75, 50], [T_ERUPT - 0.45, 55], [T_ERUPT - 0.2, 59]].forEach(([t, m]) => s.note(t, hz(m), 0.22, { type: 'triangle', vol: 0.02, attack: 0.003 }));
    [55, 59, 62].forEach(m => s.note(T_ERUPT - 1.0, hz(m), 1.15, { type: 'sine', vol: 0.006, attack: 0.5 }));
    { const c = L.calm ? 0.45 : 1, at = L.calm ? 0.12 : 0;                               // with Reduce motion on, the eruption swells, it does not bang
      s.note(T_ERUPT, 65.4, 1.4, { type: 'sine', vol: 0.07 * c, to: 52, attack: 0.006 + at }); s.hit(T_ERUPT, { d: 0.9, vol: 0.05 * c, lp: 260, attack: 0.004 + at }); }
    [36, 48, 55, 60, 64, 67, 72, 76].forEach((m, i) => s.note(T_ERUPT + 0.01 * i, hz(m), 4.6, { type: i < 2 ? 'sine' : 'triangle', vol: i < 2 ? 0.03 : 0.016, attack: 0.05, over: i > 3 ? 2 : 0, overVol: 0.15 }));
    s.hit(T_ERUPT + 0.15, { d: 3.2, vol: 0.02, lp: 600, hp: 90, attack: 0.4 });
    // the peak breathing while you look, each puff with a low soft note
    return s.done();
  },

  hideAll() {
    this.cards.count = 0; this.cards.visible = false;
    for (const i of this.parts) this.rig.show(i, false);
    const u = this.fu; u.uSpread.value = 0; u.uPour.value.set(0, 0, 0, 0); u.uGlow.value.set(0, 0, 0, 0); u.uFall.value.set(0, 0); u.uShiver.value = 0;
    this.floor.material.visible = false;
  },
  start(L, resumed) { if (!resumed) this.hideAll(); this.band.from(L.t); this.floor.material.visible = true; },
  back(L) {
    this.bT = L.t; this.wake0 = Math.min(1, L.t / 2);
    this.cp.bu = this.cp.u; this.cp.bo = this.cp.out; this.cp.byaw = this.cp.yaw;
    this.spread0 = this.fu.uSpread.value; this.glow0 = this.fu.uGlow.value.clone();
  },
  end(L) { this.hideAll(); this.hiss.set(0); },
  reset(L) { this.hideAll(); this.hiss.set(0); },

  // ---------------------------------------------------------------- a puff of smoke at show-time t (its own numbers p), into o
  cloudAt(L, p, t, o, tb0 = null) {
    if (p.pre) {
      // the mountain clearing its throat: a few small puffs up over the rail, gone again
      const tau = t - p.tb; if (tau <= 0) { o.a = 0; return o; }
      const g = 1 - Math.exp(-tau / 0.45), go = 1 - Math.exp(-tau / 1.15);
      o.r = 0.035 + (p.r1 - 0.035) * (1 - Math.exp(-tau / 0.85)); o.sy = 1; o.haze = 0;
      o.h = this.crownH + 0.035 + p.H * g; o.u = PEAK_U + (p.b - 0.5) * 0.06 + p.S * go + 0.05 * tau; o.o = -0.028 + p.O * go;
      o.a = ease.smooth(tau / 0.35) * 0.8 * (1 - ramp(tau, 0.9, 1.9)); o.spin = p.a * TAU; return o;
    }
    // the plume: puffs given off one after another from behind the top rail over his peak, each rising in the column,
    // bent over by the wind and carried away to the right along the wall, spreading, flattening and thinning to haze
    const since = t - T_ERUPT - p.j * DT_E; if (since < 0) { o.a = 0; return o; }
    const k = tb0 == null ? Math.floor(since / LIFE) : tb0, tau = since - k * LIFE;
    if (tau > LIFE) { o.a = 0; return o; }
    // (laid out in the band the look camera sees between the frames' tops and its own top, about 2.0 to 2.6 m at the
    // wall, and close to the wall so it is seen where it is: the root just over the rail and under his lamp, bending
    // over within a hand's breadth, then streaming away to the right, rising a little, widening and thinning)
    const burst = k === 0 && p.j * DT_E < 1.4, sp = Math.min(1, tau / 4), rise = 1 - Math.exp(-tau / 0.4);
    o.u = PEAK_U + (p.a - 0.5) * 0.05 + WIND * (tau - 0.6 * (1 - Math.exp(-tau / 0.6))) + 0.04 * Math.sin(t * 0.37 + 6 * p.d) * sp;
    o.h = this.crownH + 0.035 + (burst ? 0.16 : 0.1) * rise + 0.09 * ease.smooth(ramp(o.u, 0.25, 1.1)) + (p.c - 0.5) * (0.03 + 0.2 * sp) + 0.02 * Math.sin(t * 0.6 + 7 * p.a) * sp;
    o.o = -0.022 + (0.02 + 0.05 * p.d) * (1 - Math.exp(-tau / 1.5));
    o.r = Math.min(0.28, (0.045 + 0.04 * tau) * (burst ? 1.35 : 1) * (0.85 + 0.3 * p.c));
    o.sy = 1 - 0.45 * Math.min(1, tau / 3); o.haze = ramp(tau, 0.8, 7);
    o.a = ease.smooth(tau / 0.25) * (0.95 - 0.6 * ramp(tau, 1.2, 8)) * (1 - ramp(tau, 7.5, LIFE));
    o.spin = p.a * TAU + tau * 0.05 * (p.c - 0.5);
    return o;
  },

  update(L, dt) {
    const ph = L.phase, t = L.t, showing = ph === 'wake' || ph === 'play', back = ph === 'return', ret = L.ret, R = ret * 2.4;
    const fu = this.fu, cam = L.k.G.camera;
    fu.uTime.value = showing ? t : this.bT + R;
    // ---- the falls: pouring from T0; at the Return the pouring stops and the last of the water falls
    const pour = [];
    FALLS.forEach((fa, i) => {
      const hd = showing ? clamp01((t - fa.t0) / fa.Tf) : 1, tl = back ? Math.min(1.2, R / (fa.Tf * 1.1)) : 0;
      pour.push(hd, tl);
    });
    fu.uPour.value.set(pour[0], pour[1], pour[2], pour[3]);
    const landed = i => (showing ? ease.smooth(ramp(t, FALLS[i].t0 + FALLS[i].Tf - 0.05, FALLS[i].t0 + FALLS[i].Tf + 0.4)) : 1 - ease.smooth(ramp(R, FALLS[i].Tf, FALLS[i].Tf + 0.5)));
    fu.uFall.value.set(landed(0), landed(1));
    // ---- the lake: out from the falls' foot; back in under the picture
    const spread = showing ? ease.out(ramp(t, T_LAND - 0.05, T_LAND + 2.0)) : this.spread0 * (1 - ease.inOut(ramp(ret, 0.2, 0.9)));
    fu.uSpread.value = spread;
    const reach = spread * 1.75;
    fu.uShiver.value = showing ? Math.max(0, Math.sin(Math.PI * ramp(t, T_RUMBLE, T_ERUPT + 0.6))) * 0.9 + 0.5 * Math.exp(-Math.max(0, t - T_ERUPT) * 3) * (t > T_ERUPT ? 1 : 0) : 0;
    // ---- the wall: his gold round the frame; the smoke's rose above it
    const gl = fu.uGlow.value;
    if (showing) {
      const e = ease.smooth(ramp(t, T_ERUPT - 0.1, T_ERUPT + 1.6));
      gl.set(ease.smooth(ramp(t, 0, 1.4)) * 0.75 + 0.15 * Math.sin(Math.PI * ramp(t, T_RUMBLE, T_ERUPT + 0.4)),
        e * (0.85 + 0.08 * Math.sin(t * 1.3)) + 0.25 * Math.sin(Math.PI * ramp(t, T_RUMBLE + 0.2, T_ERUPT)),
        this.crownH + 0.25 + 0.9 * e, 0.35 + 0.8 * e);
    } else if (back) { const k = 1 - ease.inOut(ramp(ret, 0.1, 0.95)); gl.set(this.glow0.x * k, this.glow0.y * k * k, this.glow0.z, this.glow0.w); }
    // ---- the cards
    let n = 0; const cp = this.cp0, v = this.v;
    const put = (u, h, o, s, kind, a, spin, c) => {
      if (a <= 0.004 || s <= 0.001) return;
      L.at(u, h - (L.cy - L.y), o, v);
      this.px[n] = v.x; this.py[n] = v.y; this.pz[n] = v.z; this.ps[n] = s; this.pk[n] = kind; this.pa[n] = a; this.pr[n] = spin; this.pw[n] = this.lit; this.pq[n] = this.sq;
      this.pc[n * 3] = c.r; this.pc[n * 3 + 1] = c.g; this.pc[n * 3 + 2] = c.b; n++;
    };
    // smoke
    for (const p of this.C) {
      if (back) {
        // no more is given off: the column lets go of the rail and the last of the smoke drifts away and thins out
        const since = this.bT - T_ERUPT - (p.pre ? 0 : p.j * DT_E); if (!p.pre && since < 0) continue;
        this.cloudAt(L, p, this.bT + R, cp, p.pre ? null : Math.floor(since / LIFE)); if (cp.a <= 0) continue;
        cp.a *= 1 - ease.inOut(ramp(ret, 0.05, 0.92));
      } else if (showing) { this.cloudAt(L, p, t, cp); if (cp.a <= 0) continue; } else continue;
      // (in front of the wall, a puff stays wholly above the frames: over his own, just above it; downwind, above the
      // lower pictures to the right; to the left, above the tall one there)
      if (cp.o > -0.012) cp.h = Math.max(cp.h, (cp.u < -1.2 ? TOPS : cp.u < 0.66 ? this.crownH + 0.035 : TOPS_R) + cp.r * cp.sy * 0.6);
      this.lit = cp.haze; this.sq = cp.sy; put(cp.u, cp.h, cp.o, cp.r * 2, 0, cp.a, cp.spin, p.tint); this.lit = 0; this.sq = 1;
    }
    // mist and spray at the falls' feet
    const fallOn = [fu.uFall.value.x, fu.uFall.value.y], tt = showing ? t : this.bT + R;
    for (const m of this.M) {
      const fi = m.thin ? 1 : 0, on = fallOn[fi]; if (on <= 0.01) continue;
      const age = ((tt / m.P + m.a) % 1), fx = FALLS[fi].u, fo = FALLS[fi].land;
      const u = fx + (m.c - 0.5) * (m.thin ? 0.05 : 0.14) + (m.d - 0.5) * 0.4 * age, o = fo + 0.02 + age * (0.14 + 0.3 * m.e), h = 0.03 + age * (0.14 + (m.thin ? 0.08 : 0.24) * m.b);
      put(u, h, o, (0.07 + age * 0.22) * (m.thin ? 0.6 : 1), 1, 0.34 * Math.sin(Math.PI * age) * on, m.a * TAU + age * 0.5, this.mistC[m.thin ? 1 : 0]);
    }
    for (const q of this.S) {
      const fi = q.thin ? 1 : 0, on = fallOn[fi]; if (on <= 0.01) continue;
      const tau = ((tt / q.P + q.a) % 1) * q.P, vu = (q.d - 0.5) * 0.5, vo = 0.1 + 0.35 * q.c, vh = 0.5 + 0.55 * q.b, h = 0.02 + vh * tau - 4.9 * tau * tau;
      if (h <= 0.005) continue;
      put(FALLS[fi].u + (q.e - 0.5) * 0.08 + vu * tau, h, FALLS[fi].land + vo * tau, 0.022 + 0.014 * q.e, 1, 0.9 * on, 0, this.sprayC);
    }
    // the banks' foliage, up as the lake reaches it (and down as it draws back)
    for (const f of this.Fo) {
      const k = ease.outBack(clamp01((reach - f.d) / 0.3)); if (k <= 0.01) continue;
      const s = f.s * k; put(f.u, s * 0.36, f.o, s * 1.25, 3, Math.min(1, k * 1.5), f.spin * 0.15, f.c);
    }
    // the rocks' dabs, up with their rocks (a little wet glint where the falls spray them)
    for (const d of this.D) {
      const R0 = d.ri < 3 ? CLIFFS[d.ri] : null, ru = R0 ? R0[0] : ROCK.u, ro = R0 ? R0[1] : ROCK.o, sc = R0 ? R0[2] : 1;
      const k = R0 ? ease.outBack(clamp01((reach - Math.hypot(ru - FOOT.u, ro - FOOT.o) + 0.2) / 0.35)) : ease.outBack(clamp01((reach - Math.hypot(ROCK.u - FOOT.u, ROCK.o - FOOT.o)) / 0.35));
      if (k <= 0.01) continue;
      const S = sc * k, du = d.x * S, dout = d.z * S;      // (laid out square to the wall: the bodies are near enough round about their axis)
      const wet = d.wet * fallOn[0] * clamp01(1 - Math.abs(ru + du - FOOT.u) / 0.16) * (d.y < 0.12 ? 1 : 0.4) * (0.75 + 0.25 * Math.sin(tt * 3.1 + d.spin * 5));
      this.lit = wet; put(ru + du, d.y * S - (R0 ? 0.08 : 0.05) * (1 - k), ro + dout, d.s * S * 1.15, 2, Math.min(1, k * 1.4), d.spin, d.c); this.lit = 0;
    }
    this.flushCards(L, n, cam);
    // ---- palms, rock, canoe
    this.stepRig(L, t, showing, back, ret, reach);
    // ---- sound
    if (showing) this.band.play(t);
    const near = Math.max(0, 1 - Math.hypot(cam.position.x - L.cx, cam.position.z - L.cz) / 12);
    this.hiss.set(L.quiet ? 0 : (0.022 * Math.max(fallOn[0], showing ? ramp(t, FALLS[0].t0, T_LAND) : 0) + 0.008 * fallOn[1]) * near);
  },

  flushCards(L, n, cam) {
    const fx = -cam.matrixWorld.elements[8], fy = -cam.matrixWorld.elements[9], fz = -cam.matrixWorld.elements[10], cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    const ord = this.order; ord.length = n;
    for (let i = 0; i < n; i++) { ord[i] = i; this.dep[i] = (this.px[i] - cx) * fx + (this.py[i] - cy) * fy + (this.pz[i] - cz) * fz; }
    ord.sort(this.byDepth);
    const M = this.cards.instanceMatrix.array, I = this.aInfo.array, C = this.aCol.array;
    for (let j = 0; j < n; j++) {
      const i = ord[j], m = j * 16, s = this.ps[i];
      M[m] = s; M[m + 5] = s * this.pq[i]; M[m + 10] = s; M[m + 15] = 1; M[m + 12] = this.px[i]; M[m + 13] = this.py[i]; M[m + 14] = this.pz[i];
      I[j * 4] = this.pk[i]; I[j * 4 + 1] = this.pa[i]; I[j * 4 + 2] = this.pr[i]; I[j * 4 + 3] = this.pw[i];
      C[j * 3] = this.pc[i * 3]; C[j * 3 + 1] = this.pc[i * 3 + 1]; C[j * 3 + 2] = this.pc[i * 3 + 2];
    }
    this.cards.count = n; this.cards.visible = n > 0;
    this.cards.instanceMatrix.needsUpdate = true; this.aInfo.needsUpdate = true; this.aCol.needsUpdate = true;
  },

  stepRig(L, t, showing, back, ret, reach) {
    const rig = this.rig, v = this.v, yo = L.yawOut;
    // palms: the trunk up, then the crown unfurls; swaying a little; at the Return, folded and down
    PALMS.forEach((p, i) => {
      let g, c;
      if (showing) { g = ease.out(ramp(t, p.t0, p.t0 + 0.9)); c = ease.outBack(ramp(t, p.t0 + 0.65, p.t0 + 1.35)); }
      else if (back) { c = 1 - ease.inOut(ramp(ret, 0.05, 0.45)); g = 1 - ease.inOut(ramp(ret, 0.12, 0.55)); }
      else { g = c = 0; }
      const on = g > 0.01; rig.show(this.iTrunk[i], on); rig.show(this.iCrown[i], on && c > 0.01);
      if (!on) return;
      const yaw = yo + p.yaw, s = p.s, sw = 0.05 * Math.sin(t * 1.1 + i * 2) * c, lean = p.lean;
      L.floor(p.u, p.o, v);
      this.e4.set(0, yaw, lean, 'YXZ'); this.q4.setFromEuler(this.e4);
      this.m4.compose(v, this.q4, this.s4.set(s, s * g, s)); rig.mat(this.iTrunk[i], this.m4);
      // the crown at the trunk's top
      this.w.set(this.trunkBend * s * g * g, s * g, 0).applyQuaternion(this.q4).add(v);
      rig.put(this.iCrown[i], this.w.x, this.w.y, this.w.z, yaw + 0.4 * sw, sw, lean * 0.6 + sw * 0.6, (s / 0.64) * (0.2 + 0.8 * c));
      if (c < 0.02) rig.show(this.iCrown[i], false);
    });
    // the rock: comes up with the bank
    const kr = ease.outBack(clamp01((reach - Math.hypot(ROCK.u - FOOT.u, ROCK.o - FOOT.o)) / 0.35));
    rig.show(this.iRock, kr > 0.01);
    if (kr > 0.01) { L.floor(ROCK.u, ROCK.o, v); rig.put(this.iRock, v.x, v.y - 0.05 * (1 - kr), v.z, yo + 0.6, 0, 0, Math.max(0.01, kr)); }
    // the gorge's rocks, at the wall's foot, up first
    CLIFFS.forEach(([u, o, sc, turn], i) => {
      const k = ease.outBack(clamp01((reach - Math.hypot(u - FOOT.u, o - FOOT.o) + 0.2) / 0.35)); rig.show(this.iCliff[i], k > 0.01);
      if (k > 0.01) { L.floor(u, o, v); rig.put(this.iCliff[i], v.x, v.y - 0.08 * (1 - k), v.z, yo + turn, 0, 0, sc * Math.max(0.01, k)); }
    });
    // the canoe
    const cp = this.cp; let vis = false;
    if (showing && t > T_CANOE) {
      const tc = t - T_CANOE, w = tc < this.wIn.period - 0.3 ? this.wIn.at(Math.min(tc, this.wIn.period - 0.31), cp) : this.wLoop.at(tc - (this.wIn.period - 0.3), cp);
      cp.yaw = L.yawOf(cp.du, cp.dout); cp.paddle = w.moving; vis = true;
    } else if (back && cp.bu != null && this.bT > T_CANOE) {
      const k = ease.inOut(ramp(ret, 0.0, 0.75)), tu = -0.14, to = -0.32;
      cp.u = cp.bu + (tu - cp.bu) * k; cp.out = cp.bo + (to - cp.bo) * k;
      const want = L.yawOf(tu - cp.bu, to - cp.bo); cp.yaw = cp.byaw + Math.atan2(Math.sin(want - cp.byaw), Math.cos(want - cp.byaw)) * Math.min(1, k * 3); cp.paddle = 1; vis = cp.out > -L.wall - 0.15;
    }
    for (const i of [this.iHull, this.iMan, this.iPaddle]) rig.show(i, vis);
    if (!vis) { cp.u = cp.u == null ? -0.14 : cp.u; return; }
    const bob = 0.003 * Math.sin(t * 2.3), tt = showing ? t : this.bT + ret * 2.4;
    L.floor(cp.u, cp.out, v); const K = 1.9, y0 = v.y + 0.016 * K + bob;
    rig.put(this.iHull, v.x, y0, v.z, cp.yaw, 0.02 * Math.sin(t * 1.7), 0.03 * Math.sin(t * 1.3), K);
    // the paddler sits a little aft; the paddle swings in long strokes, changing sides
    const fx = Math.sin(cp.yaw), fz = Math.cos(cp.yaw), aft = -0.03 * K;
    rig.put(this.iMan, v.x + fx * aft, y0 - 0.004 * K, v.z + fz * aft, cp.yaw, 0, 0, K * 1.35);
    const ph = (tt * 0.87) % 1, side = Math.floor(tt * 0.87 / 2) % 2 ? 1 : -1, sweep = Math.sin(ph * TAU) * 0.7 * (cp.paddle || 0.3);
    const sx = fz * side, sz = -fx * side;
    const dip = Math.max(0, Math.sin(ph * TAU)) * 0.018 * K * (cp.paddle || 0.3);         // (down into the water on the pull, up on the return)
    rig.put(this.iPaddle, v.x + fx * (aft + 0.01 * K) + sx * 0.034 * K, y0 + 0.07 * K - dip, v.z + fz * (aft + 0.01 * K) + sz * 0.034 * K, cp.yaw, -sweep, side * 0.4, K);
  },
});
