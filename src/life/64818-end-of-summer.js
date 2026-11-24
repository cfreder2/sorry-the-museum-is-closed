// Claude Monet, Stacks of Wheat (End of Summer) (1890–91), Gallery 243. The word: harvest.
//
// Six of his stacks hang in this room, and this is the earliest of them in the year: there is still green in the
// field and the trees, the wheat is only just cut and stacked, the stubble is peach and gold in a low sun that comes
// from behind the stacks, on the right, and lays their shadows long and blue towards you. The others are what the
// winter did to these two stacks. This one is where they came from. So nothing comes out of this picture: the summer
// goes into it.
//
// Look at it and wheat comes up through the floor below the picture, from the wall towards you, green, and ripens as
// it stands to the rose and orange of his stacks (it is the same wheat), every tuft a handful of his short strokes. A
// wind crosses it once, from the picture's side, and the whole crop bows and comes back. Then it is cut: three sweeps
// of a scythe nobody sees, right to left, each one laying a swathe over (the stalks rock back a moment and go down one
// after another), and where it has passed there is his field: stubble, peach and gold where the sun reaches it, blue
// and green where it does not. Each swathe lies a moment and then is pitched, tuft after tuft, up over the standing
// wheat in one arc and in under the picture's bottom rail, beneath the stack it belongs to, the small one on the left
// or the great one on the right. When the last has gone in, the floor is the picture's own foreground at the picture's
// own hour, and the two stacks, which never left the canvas, throw their shadows out from under it across the
// stubble, pointed like their caps, growing longer while you stay, as the light goes from gold to rose. Crickets.
//
// When you stop looking the field stays while the toy is near. On the stubble the toy has a long blue shadow of its
// own, lying the way the stacks' do; in wheat that is still standing (a look broken off early) the stalks part round
// it. Look again and the harvest carries on from where it was. Then the stubble and the strokes draw back to the wall.
//
// The music is Schumann's "Schnitterliedchen", the little reapers' song from his Album for the Young (op. 68 no. 18,
// 1848; in French editions "Chant des moissonneurs"), written out from the score, at its own unhurried pace ("nicht
// sehr schnell"): a lilting 6/8 over a drone, two swings to the bar, and the scythe keeps its time.
//
// Nothing is ever in front of a picture: the wheat stands a third of a metre high on the floor, and what is pitched
// rises under the line from your eye to the foot of the canvas and ends below the frame (the guard does the rest).
// Nothing is solid. Two draw calls: the field on the floor, and every tuft (standing, cut, flying, and the stubble)
// in one instanced mesh.
// With "Reduce motion and flashing": the gust is half as deep, the wheat rises and falls without a bounce, what flies
// does not turn, and the scythe is quieter and comes in more slowly.
//
// What it leaves out: the stacks do not come out (they do next door, in the snow), and no reaper is shown, because the
// picture has no people in it and a day's mowing is not a dance; the scythe is only heard.
import * as THREE from 'three';
import { lifeFor, ease, ramp, lerp, canvasTexture, rng } from '../paintlife.js';
import { strokes } from './brush.js';
import { score } from './stagecraft.js';
import { hz } from './tunes.js';

const OUT = 1.85, HALF = 1.2, O0 = 0.13;      // the crop on the floor: out from the wall, either side of the middle (m)
const NW = 292, NS = 108;                     // tufts of wheat; tufts of stubble
const PULSE = 60 / 66, E8 = PULSE / 3, T0 = 0.25;       // the song: a dotted crotchet (one swing of the scythe), a quaver, its start
const CUTS = [T0 + 4 * PULSE, T0 + 5 * PULSE, T0 + 6 * PULSE];      // the three sweeps (the third bar, and the first swing of the fourth)
const EDGE = [OUT + 0.2, 1.28, 0.7, -1];      // the swathes, nearest first: each from EDGE[b + 1] out to EDGE[b]
const SWEEP = 0.6, LEAD = 0.15;               // a sweep crosses the field in this long, and starts this much before its beat
const GUST = T0 + 2 * PULSE;                  // the wind, on the second bar
const BARE = T0 + 8 * PULSE;                  // the last is going in: the second strain, and the evening
// His two stacks, as they stand in the picture: where (along the wall, under each), half as wide, how tall their
// shadows are cut (toy-sized: a little larger than painted).
const STK = [[-0.34, 0.17, 0.3], [0.3, 0.31, 0.5]];
const KX = 0.7, DY = 1 / Math.hypot(1, KX);   // the shadows run out and to the left, as his do: u falls 0.7 m for each metre out
const TOY_R = 0.15, TOY_H = 0.2;              // the toy's own shadow: half as wide, and how tall the toy is taken to be
const UP = new THREE.Vector3(0, 1, 0);
const prof = q => (q >= 1 ? 0 : q < 0.82 ? 1 - 0.52 * Math.pow(q, 1.25) : 0.594 * Math.sqrt(Math.max(0, 1 - Math.pow((q - 0.82) / 0.18, 2))));      // a stack's outline: a cone on a round body
// Is (u, out) on the floor in shadow, when shadows are `len` times as long as what throws them is tall?
// (toy: { u, out } when the toy stands on the field: it throws one too.)
function shade(u, o, len, toy) {
  const uh = u + o * KX, d = o / DY;
  for (const [su, hw, h] of STK) { const q = Math.abs(uh - su) / hw; if (q < 1 && d < len * h * prof(q)) return 1; }
  if (toy) { const ru = u - toy.u, ro = o - toy.out, al = (-KX * ru + ro) * DY, ac = (ru + KX * ro) * DY, tl = len * TOY_H; if (al > 0 && al < tl && Math.abs(ac) < TOY_R * (1 - 0.45 * al / tl)) return 1; }
  return 0;
}
const lenAt = T => 1.4 + 2.3 * ease.smooth(ramp(T, 3, BARE)) + 0.6 * ease.smooth(ramp(T, BARE, BARE + 2)) + 0.5 * ease.smooth(ramp(T, BARE + 2, BARE + 14));

// Schnitterliedchen (Robert Schumann, Album für die Jugend op. 68 no. 18, 1848), bars 1 to 8 and the first strain
// again, without the repeats: [voice, notes in quavers]. C major, 6/8.
const SONG_A = [
  ['mel', 'G4 C5 B4 A4 D5 C5 | B4 A4 B4 C5:2 E5 | G4 C5 B4 A4 D5 C5 | B4 A4 B4 C5:2 R'],
  ['mid', 'E4:3 F4:6 E4:3 | E4:3 F4:6 E4:2 R'],
  ['low', 'C3:3 C3:6 C3:3 | C3:3 C3:6 C3:2 R'], ['low', 'G3:3 G3:6 G3:3 | G3:3 G3:6 G3:2 R'],
];
const SONG_B = [
  ['mel', 'B4:3 C5:5 A4 G4:2 R | B4:3 C5:5 A4 G4:2 R'],
  ['mid', 'D4 G4 F#4 E4 A4 G4 | F#4 E4 F#4 G4:2 B4 | D4 G4 F#4 E4 A4 G4 | F#4 E4 F#4 G4:2 R'],
  ['low', 'G3:3 C3:3 | D3 D4 C4 B3 A3 G3 | G3:3 C3:3 | D3 D4 C4 B3 A3 G3'],
];

// One sheet of tufts, drawn once: four of green wheat (top row), the same four ripe (middle), four of stubble (bottom).
// Each tuft is a handful of stalks, and each stalk a few short loaded dabs with a fat one for the ear, lit from the
// right (a pale ridge) and rose or violet on the other side, as he paints the stacks themselves.
function sheet() {
  return canvasTexture(512, 768, (g) => {
    g.clearRect(0, 0, 512, 768); g.lineCap = 'round';
    const dab = (x0, y0, x1, y1, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    const curl = (x0, y0, cx, cy, x1, y1, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke(); };
    const GREEN = { stem: ['#3d6a30', '#4f7e39', '#629042', '#74a04c'], leaf: ['#4a7c3a', '#5f9046', '#3f7048'], ear: ['#88a44a', '#9cb054', '#7e9c4a', '#93aa5a'], ridge: '#c4d27c', shade: ['#47785e', '#3f716c', '#5a814a'] };
    const GOLD = { stem: ['#93793c', '#aa8642', '#bc8c48', '#c8924e'], leaf: ['#9c8842', '#b28c48', '#8f7c40'], ear: ['#cf8c4c', '#dba05a', '#c4764a', '#d68a66'], ridge: '#f2ca86', shade: ['#a4587a', '#84609c', '#b85a44'] };
    const X = (ox, x) => Math.max(ox + 8, Math.min(ox + 120, ox + x));
    for (let c = 0; c < 4; c++) {
      const r = rng(64818 + c * 31), n = 10 + (c % 3), stalks = [], leaves = [];
      for (let i = 0; i < n; i++) {
        const f = (i + 0.5) / n - 0.5 + (r() - 0.5) * 0.06;
        stalks.push({ f, x0: 64 + f * 30 + (r() - 0.5) * 6, x1: 64 + f * 66 + (r() - 0.5) * 10, top: 12 + r() * 50 + Math.abs(f) * 24, bend: (r() - 0.5) * 12 + f * 10, ear: 34 + r() * 12, w: 3.4 + r() * 1.3,
          nod: f * 0.6 + (r() - 0.4) * 0.34, t: [0, 1, 2].map(() => Math.floor(r() * 4)), sh: Math.floor(r() * 3), back: r() < 0.55, lit: r() < 0.8, fat: 0.9 + r() * 0.3, awn: r() });
      }
      for (let i = 0; i < 5; i++) { const f = (i + 0.5) / 5 - 0.5 + (r() - 0.5) * 0.1, sg = f < 0 ? -1 : 1; leaves.push({ x0: 64 + f * 26, cx: 64 + f * 60 + sg * 10, cy: 150 + r() * 40, x1: 64 + f * 70 + sg * (26 + r() * 20), y1: 150 + r() * 50, k: Math.floor(r() * 3) }); }
      stalks.sort((a, b) => Math.abs(b.f) - Math.abs(a.f));          // the middle ones in front
      [GREEN, GOLD].forEach((K, row) => {
        const ox = c * 128, oy = row * 256;
        for (const l of leaves) curl(ox + l.x0, oy + 252, ox + l.cx, oy + l.cy, X(ox, l.x1), oy + l.y1, 3.6, K.leaf[l.k]);
        for (const s of stalks) {
          // the stalk: four dabs up a bent line, from the foot of the cell
          const P = t => { const a = 1 - t; return [ox + a * a * s.x0 + 2 * a * t * ((s.x0 + s.x1) / 2 + s.bend) + t * t * s.x1, oy + a * a * 252 + 2 * a * t * ((252 + s.top + s.ear) / 2) + t * t * (s.top + s.ear)]; };
          for (let k = 0; k < 4; k++) { const a = P(k / 4 + 0.01), b = P((k + 1) / 4 - 0.02); dab(X(ox, a[0] - ox), a[1], X(ox, b[0] - ox), b[1], s.w, K.stem[k]); }
          // the ear: three dabs, tapering and nodding over; its far side first, the light along it last, and two awns
          const e = P(1), E = t => { const a = s.nod * (0.6 + 0.8 * t); return [X(ox, e[0] - ox + Math.sin(a) * s.ear * t), e[1] - Math.cos(a) * s.ear * t]; };
          if (s.back) { const a = E(0.05), b = E(0.8); dab(a[0] - 3.2, a[1], b[0] - 3.2, b[1], 6.5 * s.fat, K.shade[s.sh]); }
          [[0, 0.36, 8.6], [0.3, 0.68, 8], [0.62, 1, 5.4]].forEach(([t0, t1, w], k) => { const a = E(t0), b = E(t1); dab(a[0], a[1], b[0], b[1], w * s.fat, K.ear[s.t[k]]); });
          if (s.lit) { const a = E(0.12), b = E(0.78); dab(a[0] + 2.6, a[1], b[0] + 2.4, b[1], 2.4, K.ridge); }
          const tip = E(1), ta = s.nod * 1.4;
          dab(tip[0], tip[1], X(ox, tip[0] - ox + Math.sin(ta - 0.25) * 12), tip[1] - Math.cos(ta - 0.25) * 12, 2.2, K.ridge);
          if (s.awn < 0.6) dab(tip[0], tip[1] + 3, X(ox, tip[0] - ox + Math.sin(ta + 0.4) * 11), tip[1] + 3 - Math.cos(ta + 0.4) * 11, 2.2, K.ear[s.t[0]]);
        }
      });
      // stubble: short blunt stalks, the whole height of the cell (the card is stood short)
      const cols = ['#b8843e', '#a8703e', '#c4924a', '#9c6a3a', '#b47a52', '#c08a44', '#a87e46', '#8c7a3c', '#bc7648'];
      g.lineCap = 'butt';
      for (let i = 0; i < 17; i++) {
        const x = c * 128 + 11 + (i + r() * 0.8) * 6.1, top = 512 + 20 + r() * 150, lean = (r() - 0.5) * 14;
        dab(x, 512 + 252, x + lean, top, 3.4 + r() * 1.2, cols[Math.floor(r() * cols.length)]);
        if (r() < 0.35) dab(x + 1.6, 512 + 244, x + lean + 1.6, top + 14, 1.5, '#dcb070');
      }
      g.lineCap = 'round';
    }
  });
}

lifeFor(64818, {
  title: /^Stacks of Wheat \(End of Summer\)/,
  word: 'harvest',
  stage: { out: OUT, half: HALF + 0.1, cam: { dist: 3.3, height: 1.3, side: 0.45, fov: 62, lookU: 0.02, lookOut: 0.9, lookH: 0.6, floorOut: 1.95 } },
  wake: 2, ret: 2.6,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.18) => P.near(h, a).getStyle();
    this.v = new THREE.Vector3(); this.c = new THREE.Color(); this.sc3 = new THREE.Vector3(); this.q = new THREE.Quaternion(); this.q2 = new THREE.Quaternion(); this.q3 = new THREE.Quaternion(); this.ax = new THREE.Vector3(); this.m = new THREE.Matrix4();
    this.T = 0; this.H = 0; this.off = 0; this.gap = 0; this.calm = false; this.toyAt = { u: 0, out: 0 };
    // ---------------------------------------------------------- the field on the floor: the same strokes twice, in his lit colours and his shadow colours
    const lay = { size: 512, seed: 64818, n: 2700, len: [14, 34], width: [4, 9], bend: 0.2, lift: 0.2, angle: (x, y, r) => (r() - 0.5) * 0.45 + (r() < 0.22 ? -0.55 : 0) };
    const tLit = strokes({ ...lay, base: col('#d49c80'), colors: [['#e2a48c', 3.2], ['#dcb06a', 1.9], ['#e8c684', 1.1], ['#d68a84', 2.1], ['#c6a4bc', 1.3], ['#a2b274', 1.4], ['#d67e56', 0.7]].map(([c, w]) => [col(c), w]) });
    const tShade = strokes({ ...lay, base: col('#586a98'), colors: [['#5f6eae', 3], ['#7668aa', 2], ['#48846a', 2.2], ['#508c90', 1.2], ['#86709c', 1], ['#3c6c58', 1], ['#a0748c', 0.5]].map(([c, w]) => [col(c), w]) });
    const pos = [], F = (u, o) => L.floor(u, o, new THREE.Vector3()).toArray(), W = HALF + 0.22;
    pos.push(...F(-W, -L.wall), ...F(W, -L.wall), ...F(W, OUT + 0.25), ...F(-W, -L.wall), ...F(W, OUT + 0.25), ...F(-W, OUT + 0.25));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const u = this.u = {
      uSpread: { value: 0 }, uLen: { value: 1.5 }, uLight: { value: new THREE.Color(1, 1, 1) }, uFront: { value: new THREE.Vector3(9, 9, 9) }, uSun: { value: 0 },
      tLit: { value: tLit }, tShade: { value: tShade }, uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uSize: { value: new THREE.Vector2(W, OUT + 0.25) },
      uStk: { value: STK.map(s => new THREE.Vector3(...s)) }, uToy: { value: new THREE.Vector4(0, 0, TOY_R, 0) },
    };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform float uSpread, uLen, uSun; uniform vec3 uLight, uO, uFront; uniform vec4 uAx; uniform vec2 uSize; uniform sampler2D tLit, tShade;
uniform vec3 uStk[${STK.length}]; uniform vec4 uToy;
vec3 fCol; float fA;
float stackProf(float q) { return q >= 1.0 ? 0.0 : q < 0.82 ? 1.0 - 0.52 * pow(q, 1.25) : 0.594 * sqrt(max(0.0, 1.0 - pow((q - 0.82) / 0.18, 2.0))); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz; float su = dot(lq, uAx.xy), so = dot(lq, uAx.zw);
  vec2 tuv = vec2(su, so) / 0.92;
  vec4 a = texture2D(tLit, tuv), b = texture2D(tShade, tuv); float id = a.a, j = id - 0.65;
  // where the scythe has been (the swathe this is in, and how far its sweep has come), a stroke at a time
  float front = so > ${EDGE[1].toFixed(2)} ? uFront.x : so > ${EDGE[2].toFixed(2)} ? uFront.y : uFront.z;
  float cut = step(front, su + j * 0.2);
  // the stacks' shadows, thrown out from under the picture; and the toy's, if it is out on the stubble
  float uh = su + so * ${KX.toFixed(3)}, d = so / ${DY.toFixed(4)}, sh = 0.0;
  for (int i = 0; i < ${STK.length}; i++) { float q = abs(uh - uStk[i].x) / uStk[i].y; sh = max(sh, step(q, 0.999) * smoothstep(-0.03, 0.03, uLen * uStk[i].z * stackProf(q) - d + j * 0.14)); }
  if (uToy.w > 0.0) { vec2 rel = vec2(su, so) - uToy.xy; float al = dot(rel, vec2(-${KX.toFixed(3)}, 1.0)) * ${DY.toFixed(4)}, ac = dot(rel, vec2(1.0, ${KX.toFixed(3)})) * ${DY.toFixed(4)}, tl = uLen * ${TOY_H.toFixed(2)};
    sh = max(sh, uToy.w * smoothstep(-0.02, 0.02, uToy.z * (1.0 - 0.45 * clamp(al / tl, 0.0, 1.0)) - abs(ac) + j * 0.05) * smoothstep(-0.03, 0.03, al) * smoothstep(-0.02, 0.05, tl - al + j * 0.1)); }
  // under standing wheat the ground is dark and green; cut, it is his stubble in the sun, or in the blue of a shadow
  vec3 open = mix(a.rgb * uLight * (0.66 + 0.08 * uSun), b.rgb * 0.8, sh);
  fCol = mix(b.rgb * vec3(0.42, 0.5, 0.3), open, cut);
  float rr = pow(pow(abs(su) / uSize.x, 3.0) + pow(max(so, 0.0) / uSize.y, 3.0), 1.0 / 3.0);
  fA = smoothstep(0.0, 0.03, uSpread * 1.2 - (so / uSize.y * 0.82 + id * 0.18)) * (1.0 - smoothstep(0.74, 0.97, rr + j * 0.5)) * mix(0.9, 0.96, cut);
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'summer-field';
    this.field = new THREE.Mesh(g, m); this.field.position.y = 0.016; this.field.renderOrder = 5; L.add(this.field);

    // ---------------------------------------------------------- the tufts: wheat and stubble, one instanced mesh of crossed cards
    const cg = new THREE.BufferGeometry(), cp = [], cu = [];
    for (const [ax, az] of [[1, 0], [0, 1]]) {
      const q = [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1]];
      for (const k of [0, 1, 2, 0, 2, 3]) { cp.push(q[k][0] * ax, q[k][1], q[k][0] * az); cu.push(q[k][0] + 0.5, q[k][1]); }
    }
    cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(cu, 2));
    const N = NW + NS, cell = new Float32Array(N * 2), ripe = new Float32Array(N);
    cg.setAttribute('aCell', new THREE.InstancedBufferAttribute(cell, 2));
    cg.setAttribute('aRipe', new THREE.InstancedBufferAttribute(ripe, 1).setUsage(THREE.DynamicDrawUsage));
    const tex = sheet(); tex.anisotropy = 4;
    const tm = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide, fog: false });
    tm.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec2 aCell; attribute float aRipe; varying vec2 vUvA; varying vec2 vUvB; varying float vRipe;')
        .replace('#include <uv_vertex>', `#include <uv_vertex>
  { vec2 q = vec2((uv.x * 0.94 + 0.03 + aCell.x) * 0.25, (uv.y * 0.98 + 0.01) / 3.0);
    if (aCell.y < 0.5) { vUvA = q + vec2(0.0, 2.0 / 3.0); vUvB = q + vec2(0.0, 1.0 / 3.0); } else { vUvA = q; vUvB = q; }
    vRipe = aRipe; }`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vUvA; varying vec2 vUvB; varying float vRipe;')
        .replace('#include <map_fragment>', '  diffuseColor *= mix(texture2D(map, vUvA), texture2D(map, vUvB), vRipe);');
    };
    tm.customProgramCacheKey = () => 'summer-tufts';
    const tufts = this.tufts = new THREE.InstancedMesh(cg, tm, N); tufts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.ripe = cg.attributes.aRipe;
    // where they stand: a jittered grid, thinned to a ragged edge
    const R = L.rand, inField = (uu, o, k) => Math.pow(Math.pow(Math.abs(uu) / HALF, 3) + Math.pow(Math.max(0, o) / OUT, 3), 1 / 3) < 0.9 + 0.1 * k;
    const scatter = (n, cols, o0) => {
      const out = [], rows = Math.ceil(n / cols) + 3;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const uu = ((c + 0.5 + (R() - 0.5) * 0.85 + (r % 2) * 0.5) / (cols + 0.5) * 2 - 1) * HALF, o = o0 + (r + 0.5 + (R() - 0.5) * 0.8) / rows * (OUT - o0);
        if (inField(uu, o, R())) out.push([uu, o]);
      }
      while (out.length > n) out.splice(Math.floor(R() * out.length), 1);
      return out;
    };
    const bandOf = o => (o > EDGE[1] ? 0 : o > EDGE[2] ? 1 : 2), cutAt = (uu, o) => CUTS[bandOf(o)] - LEAD + SWEEP * (HALF + 0.15 - uu) / (2 * HALF + 0.3);
    this.wheat = scatter(NW, 19, O0).map(([uu, o], i) => {
      const b = bandOf(o), tc = cutAt(uu, o) + R() * 0.04, left = uu < -0.02 + (R() - 0.5) * 0.3 ? 0 : 1;
      cell[i * 2] = Math.floor(R() * 4); cell[i * 2 + 1] = 0;
      return { i, u: uu, o, b, yaw: R() * Math.PI, h: 0.3 + R() * 0.08, w: 0.2 + R() * 0.05, tg: T0 + 0.05 + (o / OUT) * 1.05 + R() * 0.2, tc, fa: (R() - 0.5) * 0.7, fall: 1.36 + R() * 0.14,
        lift: 0.55 + R() * 0.24, dur: 1.0 + R() * 0.25, cutAt: Infinity, tu: STK[left][0] + (R() - 0.5) * STK[left][1] * 1.1, spin: (R() - 0.5) * 5, ph: R() * 6.283, wob: R(), tr: 1 + 0.1 * (R() - 0.4), tg2: 1 + 0.08 * (R() - 0.5), tb: 1 + 0.3 * (R() - 0.5) };
    });
    this.stub = scatter(NS, 12, O0 + 0.05).map(([uu, o], k) => {
      const i = NW + k; cell[i * 2] = Math.floor(R() * 4); cell[i * 2 + 1] = 1;
      return { i, u: uu, o, yaw: R() * Math.PI, h: 0.055 + R() * 0.035, w: 0.17 + R() * 0.06, tc: cutAt(uu, o) + 0.08, cutAt: Infinity };
    });
    for (let i = 0; i < N; i++) { tufts.setColorAt(i, this.c.setRGB(1, 1, 1)); tufts.setMatrixAt(i, this.m.makeScale(0, 0, 0)); }
    L.add(tufts);
    this.wind = L.voice().loop({ lp: 2600, hp: 500 });
  },

  // The song and the scythe, on the show's own clock.
  band(L, calm) {
    const s = score(L), bpm = 60 / E8, V = { mel: { vol: 0.034, type: 'triangle', attack: 0.02, legato: 0.92 }, mid: { vol: 0.013, type: 'sine', attack: 0.03, legato: 0.96 }, low: { vol: 0.016, type: 'sine', attack: 0.04, legato: 0.98 } };
    let t = T0;
    for (const part of [SONG_A, SONG_B, SONG_A]) { let end = t; for (const [v, mel] of part) end = Math.max(end, s.tune(mel.replace(/\|/g, ' '), t, bpm, V[v])); t = T0 + Math.round((end - T0) / (6 * E8)) * 6 * E8; }
    s.note(t, hz('C5'), 1.6, { vol: 0.026, type: 'triangle', attack: 0.03 }); s.note(t, hz('C3'), 2.0, { vol: 0.016, type: 'sine', attack: 0.05 }); s.note(t, hz('E4'), 1.8, { vol: 0.012, type: 'sine', attack: 0.05 });
    // each sweep: the blade through the stalks, and the swathe going over
    for (const c of CUTS) { s.hit(c - 0.2, { d: 0.6, vol: calm ? 0.014 : 0.024, bp: 3300, q: 0.7, attack: calm ? 0.3 : 0.2 }); s.hit(c + 0.14, { d: 0.5, vol: 0.011, lp: 1500, hp: 300, attack: 0.14 }); }
    // crickets, once the field is bare
    const chirp = (f, v) => [0, 0.055, 0.11].map(a => ({ t: a, f, d: 0.03, vol: v, type: 'sine', attack: 0.004 }));
    s.loop(BARE + 0.3, 1.37, chirp(4350, 0.0035)); s.loop(BARE + 1.1, 1.93, chirp(3900, 0.0026));
    return s.done();
  },

  // Two clocks. H is the show's (it runs only while you look: the song and the scythe keep to it, so a look that is
  // broken off and taken up again carries on where it was); T is the hour, which runs on while the field is out, so
  // what was falling lands, what was flying goes in, and the shadows go on growing.
  start(L, resumed) {
    this.calm = L.calm;
    if (resumed && this.sc) { this.off = this.H - L.t; this.sc.from(this.H); return; }
    this.off = 0; this.gap = 0; this.H = 0; this.T = 0;
    for (const w of this.wheat) w.cutAt = Infinity;
    for (const b of this.stub) b.cutAt = Infinity;
    this.sc = this.band(L, this.calm); this.sc.from(0);
  },
  back(L) { this.spread0 = this.u.uSpread.value; },
  end(L) { this.u.uSpread.value = 0; this.u.uToy.value.w = 0; this.field.visible = false; this.tufts.visible = false; this.wind.set(0); },
  reset(L) { this.end(L); },

  // The wind at (u, out) at T: how far the wheat leans (radians), with the light, out and to the left.
  air(T, uu, o) {
    const p = (-uu * 0.8 + o * 0.6 + 1.1) / 2.3, tau = T - GUST - p, k = this.calm ? 0.5 : 1;
    let a = 0.045 * Math.sin(T * 1.7 + uu * 2.1 + o * 1.3) + 0.03 * Math.sin(T * 2.9 - uu * 1.4 + o * 2.2);
    if (tau > 0) a += tau < 0.85 ? 0.6 * k * Math.pow(Math.sin(Math.PI * tau / 0.85), 1.4) : -0.13 * k * Math.exp(-(tau - 0.85) * 2.2) * Math.sin((tau - 0.85) * 6.5);
    return a;
  },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', out = showing || ph === 'linger', ret = ph === 'return', u = this.u, calm = this.calm, G = L.k.G;
    if (!out && !ret) { this.field.visible = false; this.tufts.visible = false; this.wind.set(0); return; }
    if (showing) this.H = L.t + this.off; else this.gap += dt;
    const H = this.H, T = this.T = H + this.gap, home = ret ? L.ret : 0;
    if (showing && this.sc) this.sc.play(H);
    // ---- the hour: the shadows lengthen, the light goes from the day's to the picture's
    const len = lenAt(T), late = ease.smooth(ramp(T, 3, BARE + 1.5)), rose = ease.smooth(ramp(T, BARE + 2, BARE + 16));
    u.uLen.value = len; u.uLight.value.setRGB(lerp(1.0, 1.05, late) + 0.03 * rose, lerp(1.0, 0.97, late) - 0.06 * rose, lerp(0.95, 0.9, late) - 0.03 * rose); u.uSun.value = late;
    const spread = out ? ease.out(ramp(T, 0.05, 1.7)) : (this.spread0 || 0) * (1 - ease.inOut(ramp(home, 0.3, 1)));
    u.uSpread.value = spread; this.field.visible = spread > 0.002; this.tufts.visible = true;
    u.uFront.value.set(...CUTS.map(c => { const k = (H - (c - LEAD)) / SWEEP; return k <= 0 ? 9 : k >= 1 ? -9 : HALF + 0.15 - k * (2 * HALF + 0.3); }));
    // ---- the toy: the standing wheat parts round it, and on the stubble it has a long shadow of its own
    const veh = G.vehicle; let toy = null, rustle = 0;
    if (out && veh && G.state === 'play' && veh.group.visible && Math.abs(veh.pos.y - L.y) < 0.4) {
      const q = L.local(veh.pos.x, veh.pos.z);
      if (Math.abs(q.u) < HALF + 0.6 && q.out > -0.2 && q.out < OUT + 0.6) { toy = this.toyAt; toy.u = q.u; toy.out = q.out; rustle = Math.min(1, Math.hypot(veh.vel.x, veh.vel.z) / 1.5); }
    }
    u.uToy.value.set(toy ? toy.u : 0, toy ? toy.out : 0, TOY_R, toy ? 1 : 0);
    const lit = u.uLight.value, tufts = this.tufts, ripeA = this.ripe.array, yT = L.rail - 0.05, yaw0 = L.yawOut;
    let flying = 0, gust = 0, brushed = 0;
    for (const w of this.wheat) {
      const gone = 1 - ease.inOut(ramp(home, 0.04 + 0.45 * (1 - w.o / OUT), 0.5 + 0.45 * (1 - w.o / OUT)));
      if (showing && w.cutAt === Infinity && H >= w.tc) w.cutAt = T - (H - w.tc);
      const cutT = w.cutAt, s = (T - cutT - w.lift) / w.dur;
      let x = w.u, o = w.o, y = L.y, lu = 0, lo = 0, k = 1, bright = 1, sh = 0;
      const grow = calm ? ease.out(ramp(T, w.tg, w.tg + 0.7)) : ease.outBack(ramp(T, w.tg, w.tg + 0.55));
      ripeA[w.i] = ease.smooth(ramp(T, w.tg + 0.3, w.tg + 1.05));
      if (grow <= 0 || (cutT < Infinity && s >= 1)) { tufts.setMatrixAt(w.i, this.m.makeScale(0, 0, 0)); continue; }
      if (T < cutT) {
        // standing: the wind in it, a rock back before the blade takes it, and out of the toy's way
        const a = this.air(T, w.u, w.o), ant = showing ? ease.smooth(ramp(H, w.tc - 0.3, w.tc - 0.06)) * 0.2 : 0;
        lu = -0.8 * a + ant; lo = 0.6 * a; gust = Math.max(gust, Math.abs(a));
        if (toy) { const du = w.u - toy.u, dq = w.o - toy.out, d = Math.hypot(du, dq); if (d < 0.42 && d > 1e-3) { const p = Math.pow(1 - d / 0.42, 0.8) * 1.15 / d; lu += du * p; lo += dq * p; brushed++; } }
        k = grow * gone; sh = shade(w.u, w.o, len, null);
      } else {
        // cut: over to the left, with a small bounce
        const f = (T - cutT) / 0.36, down = f < 1 ? ease.in(f) : 1 - (calm ? 0 : 0.07 * Math.exp(-(f - 1) * 2.4) * Math.cos((f - 1) * 7)), th = w.fall * down;
        x = w.u - 0.04 * Math.min(1, f); lu = -Math.cos(w.fa) * th; lo = Math.sin(w.fa) * th;
        if (s > 0) k = 1; else { k = gone; sh = shade(x, o, len, toy); }
      }
      const th = Math.hypot(lu, lo);
      this.q.setFromAxisAngle(this.ax.set(0, 1, 0), yaw0 + w.yaw);
      if (th > 1e-4) { const fx = (L.tx * lu + L.nx * lo) / th, fz = (L.tz * lu + L.nz * lo) / th; this.q.premultiply(this.q2.setFromAxisAngle(this.ax.set(fz, 0, -fx), Math.min(th, 1.5))); }
      if (T >= cutT && s > 0) {
        // pitched: up off the swathe, over the standing wheat in one arc, and in under the picture's bottom rail
        flying++;
        const e = 0.45 * s + 0.55 * s * s * (3 - 2 * s), a = 1 - e, o1 = w.o * 0.5 + 0.06, u1 = lerp(x, w.tu, 0.42), h1 = 0.56 + 0.16 * w.wob, hT = yT - L.y, tu = w.tu, oT = 0.05;
        const pu = a * a * x + 2 * a * e * u1 + e * e * tu, po = a * a * w.o + 2 * a * e * o1 + e * e * oT, py = a * a * 0.03 + 2 * a * e * h1 + e * e * hT;
        const du = a * (u1 - x) + e * (tu - u1), dq = a * (o1 - w.o) + e * (oT - o1), dy = a * (h1 - 0.03) + e * (hT - h1);
        x = pu; o = lerp(po, -L.wall * 0.6, ease.smooth(ramp(e, 0.9, 1))); y = L.y + py;
        // (ears first, along the way it is going; turning a little about itself)
        this.ax.set(L.tx * du + L.nx * dq, dy, L.tz * du + L.nz * dq).normalize();
        this.q2.setFromUnitVectors(UP, this.ax); this.q3.setFromAxisAngle(UP, w.yaw + (calm ? 0 : w.spin * e)); this.q2.multiply(this.q3);
        this.q.slerp(this.q2, ease.smooth(ramp(s, 0, 0.3)));
        k = lerp(1, 0.62, ease.smooth(ramp(e, 0.15, 0.8))) * (1 - ease.in(ramp(e, 0.88, 1)));
        bright = 1.06;
      }
      L.floor(x, o, this.v); this.v.y = y;
      tufts.setMatrixAt(w.i, this.m.compose(this.v, this.q, this.sc3.set(w.w * k, w.h * k, w.w * k)));
      if (sh) this.c.setRGB(0.5 * w.tr, 0.56, 0.86); else this.c.setRGB(lit.r * bright * 0.72 * w.tr, lit.g * bright * 0.72 * w.tg2, lit.b * bright * 0.72 * w.tb);
      tufts.setColorAt(w.i, this.c);
    }
    for (const b of this.stub) {
      const gone = 1 - ease.inOut(ramp(home, 0.04 + 0.45 * (1 - b.o / OUT), 0.5 + 0.45 * (1 - b.o / OUT)));
      if (showing && b.cutAt === Infinity && H >= b.tc) b.cutAt = T - (H - b.tc);
      const k = ease.out(ramp(T, b.cutAt, b.cutAt + 0.25)) * gone;
      ripeA[b.i] = 1;
      if (k <= 0) { tufts.setMatrixAt(b.i, this.m.makeScale(0, 0, 0)); continue; }
      const a = 0.5 * this.air(T, b.u, b.o);
      L.floor(b.u, b.o, this.v);
      this.q.setFromAxisAngle(this.ax.set(0, 1, 0), yaw0 + b.yaw);
      this.q.premultiply(this.q2.setFromAxisAngle(this.ax.set(L.tz * -0.8 + L.nz * 0.6, 0, -(L.tx * -0.8 + L.nx * 0.6)), a));
      tufts.setMatrixAt(b.i, this.m.compose(this.v, this.q, this.sc3.set(b.w * k, b.h * k, b.w * k)));
      tufts.setColorAt(b.i, shade(b.u, b.o, len, toy) ? this.c.setRGB(0.46, 0.54, 0.86) : this.c.setRGB(lit.r * 0.74, lit.g * 0.74, lit.b * 0.74));
    }
    tufts.instanceMatrix.needsUpdate = true; tufts.instanceColor.needsUpdate = true; this.ripe.needsUpdate = true;
    // ---- the air in the crop, louder in the gust and while the wheat goes in
    const near = Math.max(0, 1 - Math.hypot(G.camera.position.x - L.cx, G.camera.position.z - L.cz) / 12);
    this.wind.set(L.quiet ? 0 : (0.004 + 0.05 * Math.min(0.4, gust) + 0.012 * Math.min(1, flying / 40) + 0.02 * rustle * Math.min(1, brushed / 6)) * near * (ret ? 1 - home : 1));
    L.voice().place();
  },
});
