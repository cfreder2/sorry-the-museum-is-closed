// Dante Gabriel Rossetti, Beata Beatrix (1871–72), Gallery 223. The word: hour.
//
// His memorial to his wife, Elizabeth Siddal, painted as Dante's Beatrice at the moment she is, in his words, "rapt
// from Earth to Heaven": her eyes shut, her hands open, the evening light of the Arno gold behind her hair, everything
// else gone to dusk. Beside her on the parapet he put a sundial, a disc of gold with its numbers worn, and laid its
// shadow on nine. Dante's book gives her the first hour of the ninth day; the frame, which Rossetti designed, gives
// the day. The whole picture is one hour that does not pass. That hour is the show, and it is made of nothing but
// light and shade.
//
// Look at it and his dusk comes out from under the picture and gathers in the corner where it hangs: over the floor
// and up the walls, soft and warm, umber with a little olive and violet in it; the pictures keep their own light. In
// it the gold of the dial opens on the floor, a round of evening light, soft at its edge, its ring of numbers (his are
// plain figures, not Roman ones) surfacing last. The gnomon stays in the picture; only its shadow comes out, with the
// scroll he cut into the blade's back along its far edge. It lies thin towards the wall, and then the hour passes: the
// shadow comes round, opening and lengthening as an evening shadow does, the gold deepening to amber and the shade
// climbing the wall round the picture as it goes, slower and slower, until it lies on nine. There it stops. A bell,
// a long way off, once; another answers from further away. The nine glows a little in the shade. Then the light lifts
// off the dial: slow motes of gold go up from its face, drawing together as they rise towards the foot of the picture,
// and go out just under it; the wall behind the frame warms with the same gold, and a little of it comes out again
// over the top rail and goes on up. The eye makes the climb through the picture itself. While you keep looking the
// shadow stays on nine and the light keeps rising. When you stop, the motes go out, the dial closes towards the wall,
// and the dusk draws back under the picture.
//
// How it is made: the dusk and the dial are one mesh with one shader (the floor and the walls of the corner; his gold
// in soft dabs and the numbers, painted once into a texture; the shadow is worked out in the shader from where its tip
// falls, with an edge that softens away from its foot). The dusk is laid as a depth of shade, not a flat veil: a lit
// gallery wall is so bright that half a veil hardly shows on it. The motes are quads in one mesh, moved in its vertex
// shader. The gold on the wall is the kit's pools, on the wall behind the canvas, which hides it. Three draw calls.
// Nothing is solid and nothing stays out after the look. The picture hangs in a corner with Moreau's Hydra a hand's
// width to its right, hung low: so the motes keep under the pictures (below 1 m, drawing in under this frame) or close
// over this frame's top rail, and the shade on the wall lies flat against it, behind every canvas and label; from the
// look camera the guard has nothing to cut. With "Reduce motion and flashing" on, everything goes at six tenths of the
// speed, the motes do not shimmer, and the bells are quieter and eased in.
//
// What it does not do: nobody comes out of the picture, in any form (not Beatrice, not Love, not Dante, not the haloed
// dove), and neither does the white poppy, because it is a memorial to a real woman, the bird is its messenger and the
// flower is how she died; there is nothing here to push, collect or drive at, the sundial is not built as a thing,
// and the bells are far bells struck once each, not a tune.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, radialTexture } from '../paintlife.js';
import { strokes } from './brush.js';
import { score, hump } from './stagecraft.js';

const TAU = Math.PI * 2;
const R = 0.52, OUT = 0.77;                        // the dial of light: its radius, and how far out from the wall its middle lies
const PLATE = 1.72;                                // the square of floor its texture covers (metres)
const FOOT = 0.12;                                 // half the gnomon's foot (it stands on the line from twelve to six, its heel to the wall)
const HOUR = n => n * TAU / 12;                    // a number's place on the ring: twelve towards the room, nine to the right (as his lie)
const H_FROM = 4.6, H_TO = 9;                      // where the shadow lies at first, and where it comes to rest
const T_SWEEP = 1.5, T_REST = 4.8, T_RISE = 5.25, T_OVER = T_RISE + 2.3;      // story seconds
const N_CONE = 190, N_OVER = 50;                   // motes off the dial, and over the top rail
const CONE_TOP = 1.03;                             // how high the motes off the dial are seen (under the frame's rail)
const FLOOR_OUT = 3.0, WALL_UP = 3.7, SIDE = 2.7;  // how far the dusk's mesh reaches: out over the floor, up the walls, along them
// A far bell's partials: [of the note, how loud, how long it rings]. Hum, prime, the minor third, fifth, octave.
const PARTIALS = [[0.5, 0.6, 1], [1, 1, 0.8], [1.19, 0.4, 0.6], [1.5, 0.16, 0.42], [2, 0.34, 0.4]];

const SHADE_GLSL = /* glsl */`
float bbSeg(vec2 p, vec2 a, vec2 b) { vec2 e = b - a, v = p - a; return length(v - e * clamp(dot(v, e) / max(dot(e, e), 1.0e-6), 0.0, 1.0)); }
// The shadow of his gnomon on the dial: how far outside it a point is (negative: inside). The blade stands on its foot,
// from a (its toe) to b (its heel, under its tip), and t is where the tip's shadow falls. The edge from the toe is the
// straight one that tells the hour; the edge from the heel carries the scroll he cut into the blade's back (a swell, a
// deep notch, the spike). Seen edge on, it is a line.
float bbShade(vec2 p, vec2 a, vec2 b, vec2 t) {
  vec2 e = a - b, w = t - b, pb = p - b; float L = length(e); e /= L;
  float det = e.x * w.y - e.y * w.x, ad = abs(det), line = bbSeg(p, b, t) - 0.006;
  if (ad < 1.0e-4) return line;
  float x = (pb.x * w.y - pb.y * w.x) / det, y = (e.x * pb.y - e.y * pb.x) / det;
  float s1 = (y - 0.27) / 0.16, s2 = (y - 0.6) / 0.12;
  float scroll = L * (-0.11 * exp(-s1 * s1) + 0.27 * exp(-s2 * s2) - 0.05 * smoothstep(0.8, 1.0, y));
  float inside = min((x - scroll) * ad / max(length(w), 1.0e-4), min((L * (1.0 - y) - x) * ad / max(length(t - a), 1.0e-4), y * ad));
  return min(-inside, line);
}
`;

lifeFor(16551, {
  title: /^Beata Beatrix/,
  word: 'hour',
  // (the dial on the floor, the whole of the small picture over it, and a little of the wall above for the light that
  // goes on up)
  stage: { out: 1.5, half: 1.0, cam: { dist: 3.1, height: 1.47, side: -0.42, fov: 59, lookU: 0.03, lookOut: 0, lookH: 0.93, whole: false } },
  wake: 2, ret: 2.6,

  build(L) {
    const col = (h, a = 0.14) => L.pal.near(h, a), hex = c => '#' + c.clone().getHexString();
    this.O = L.floor(0, 0); this.tip = new THREE.Vector2(0, R * 0.5);
    const ax = new THREE.Vector4(L.tx, L.tz, L.nx, L.nz);

    // ---------------------------------------------------------- his dusk, and in it the dial: one mesh, one shader
    // (soft short touches, laid every way, as his late surfaces are; each one's own number in the alpha, so the dusk
    // breaks up at its edge a touch at a time)
    this.tDusk = strokes({ size: 512, base: hex(col('#33281a', 0.3)), n: 2600, len: [9, 22], width: [8, 15], bend: 0.35, lift: 0.07, seed: 1655,
      angle: (x, y, r) => -0.8 + (r() - 0.5) * 2.4,
      colors: [[hex(col('#352915', 0.3)), 4], [hex(col('#3d4220', 0.25)), 3], [hex(col('#432618', 0.3)), 2.6], [hex(col('#4a3a26', 0.3)), 2.4], [hex(col('#3a3140', 0.2)), 1.6], [hex(col('#5f4328', 0.3)), 1.5], [hex(col('#2c3323', 0.25)), 1.4], [hex(col('#70502a', 0.3)), 0.5]] });
    const fu = this.fu = {
      tDusk: { value: this.tDusk }, tDial: { value: this.dialTexture(L) },
      uO: { value: this.O }, uAx: { value: ax },
      uN: { value: new THREE.Vector4(0, 0, 0, 0) },              // the dusk: how far it has spread, how deep, how far up the wall round the picture, -
      uK: { value: new THREE.Vector4(0, 0, 0, 0) },              // the dial: open, the numbers, the shadow, the nine
      uS: { value: new THREE.Vector4(0, 1, 0.36, 0) },           // evening, brightness, how dark the dusk's own paint is, -
      uTip: { value: this.tip },
      uDusk: { value: col('#2b2418', 0.2) },
      uPale: { value: col('#f6cf74') }, uDeep: { value: col('#bd7a28') }, uInk: { value: col('#4a2c12') },
      uEve: { value: new THREE.Color(1.0, 0.8, 0.58) }, uEmber: { value: col('#ff9a4a', 0.08) },
    };
    const fm = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
    fm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, fu);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D tDusk, tDial; uniform vec3 uO, uDusk, uPale, uDeep, uInk, uEve, uEmber; uniform vec4 uAx, uN, uK, uS; uniform vec2 uTip;
${SHADE_GLSL}
vec3 duskC; float duskA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  // (the vertex colour says which part this is: red 0 the floor, 0.5 the foot of a wall, 1 the wall above; green 1 a side wall)
  vec2 lq = lifeP.xz - uO.xz, q = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw)); float hh = lifeP.y - uO.y, part = vColor.r;
  vec2 fq = vec2(q.x, max(q.y, 0.0)), tq = part < 0.25 ? q : (vColor.g > 0.5 ? vec2(q.y, -hh) : vec2(q.x, -hh));
  vec4 sd = texture2D(tDusk, tq / 1.1); float br = sd.a - 0.6;
  // the dusk: out from under the picture, over the floor of the corner and up the foot of its walls; soft, as his is
  float rr = length((fq - vec2(0.05, 0.6)) / vec2(2.1, 2.2));
  float far = length(vec2(fq.x * 0.85, fq.y + hh)) / (3.4 * max(uN.x, 0.02));
  float foot = (1.0 - smoothstep(0.26, 1.0, rr + br * 0.07)) * (1.0 - smoothstep(0.55, 1.0, far + br * 0.1));
  // (how deep it is, as a depth of shade: a lit gallery wall is very bright, and shade laid on it by halves hardly shows)
  vec3 C = mix(uDusk, sd.rgb, 0.26) * uS.z, add = vec3(0.0); float A = 0.0;
  if (part < 0.25) {
    A = 1.0 - exp(-3.2 * foot * uN.y);
    // the dial
    vec2 p = vec2(q.x, ${OUT.toFixed(3)} - q.y);                                    // along the wall, and towards it
    vec4 tx = texture2D(tDial, vec2(p.x, -p.y) / ${PLATE.toFixed(3)} + 0.5);
    float rd = length(p) / ${R.toFixed(3)};
    // (it opens from the side nearest the picture)
    float reach = uK.x * ${(2 * R + 0.8).toFixed(3)}, fromWall = length(p - vec2(0.0, ${(R + 0.3).toFixed(3)}));
    float open = 1.0 - smoothstep(reach - 0.42, reach, fromWall + (tx.r - 0.5) * 0.16);
    // the gnomon's shadow: from its foot (toe to the room, heel to the wall) to where its tip falls, softer further out
    float len2 = max(dot(uTip, uTip), 1.0e-5), along = clamp(dot(p, uTip) / len2, 0.0, 1.0);
    float sdf = bbShade(p, vec2(0.0, -${FOOT.toFixed(3)}), vec2(0.0, ${FOOT.toFixed(3)}), uTip);
    float soft = 0.007 + 0.055 * along * along;
    float sh = uK.z * (1.0 - smoothstep(-soft, soft, sdf)) * (0.95 - 0.3 * along);
    vec3 gold = mix(uDeep, uPale, smoothstep(0.1, 0.9, tx.r));
    gold = mix(gold, gold * uEve, uS.x);                                             // (evening: gold to amber)
    gold = mix(gold, uInk, tx.g * 0.5 * uK.y);                                       // (the rings and the numbers)
    vec3 face = mix(gold, gold * 0.3 + uInk * 0.22, sh) * uS.y;                      // (in the shadow, his deep umber)
    float cv = tx.a * open * (1.0 - smoothstep(0.92, 1.0, rd + br * 0.07));                // (its rim soft, and a little uneven)
    C = mix(C, face, cv); A = max(A, cv * 0.97);
    float halo = exp(-max(rd - 0.8, 0.0) * 3.2) * (1.0 - 0.85 * cv) * open;        // (it lights the floor round it a little)
    add = mix(uDeep, uPale, 0.5) * halo * 0.34 * uS.y + gold * cv * 0.24 * (1.0 - sh) * uS.y + uEmber * tx.b * uK.w * cv * (0.4 + 0.6 * sh);
  } else if (part < 0.75) {
    A = 1.0 - exp(-3.2 * foot * uN.y * (1.0 - smoothstep(0.08, 1.04, hh + br * 0.03)));
  } else {
    // the shade round the picture, on the wall behind it
    float d3 = length(vec3(fq.x / 2.9, (hh - 1.55) / (hh > 1.55 ? 1.9 : 2.3), fq.y / 2.3));
    A = 1.0 - exp(-3.0 * uN.z * pow(1.0 - smoothstep(0.1, 1.0, d3 + br * 0.04), 1.5));
  }
  duskC = C * A + add; duskA = A;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = duskC; diffuseColor.a = duskA;\n#include <opaque_fragment>');
    };
    fm.customProgramCacheKey = () => 'beatrix-dusk';
    {
      // The corner: how far the room's walls are to either side, along the wall the picture hangs on.
      const Rm = L.room; let left = 9, right = 9, deep = 9;
      if (Rm) {
        const a = Math.abs(L.tx) > 0.5 ? [(Rm.x0 - L.cx) * L.tx, (Rm.x1 - L.cx) * L.tx] : [(Rm.z0 - L.cz) * L.tz, (Rm.z1 - L.cz) * L.tz]; left = -Math.min(a[0], a[1]); right = Math.max(a[0], a[1]);
        deep = Math.abs(L.nx) > 0.5 ? Math.max((Rm.x0 - L.cx) * L.nx, (Rm.x1 - L.cx) * L.nx) : Math.max((Rm.z0 - L.cz) * L.nz, (Rm.z1 - L.cz) * L.nz);
      }
      const FO = Math.min(FLOOR_OUT, deep - 0.05), WU = Math.min(WALL_UP, ((Rm && (Rm.ceil || Rm.h)) || 4) - 0.05);
      const u0 = -Math.min(SIDE, left - 0.006), u1 = Math.min(SIDE, right - 0.006), back = -L.wall, pos = [], colr = [];
      const P = (u, o, h) => L.floor(u, o).setY(L.y + h);
      const quad = (a, b, c, d, r, g) => { for (const v of [a, b, c, a, c, d]) { pos.push(v.x, v.y, v.z); colr.push(r, g, 0); } };
      quad(P(u0, FO, 0.012), P(u1, FO, 0.012), P(u1, back + 0.004, 0.012), P(u0, back + 0.004, 0.012), 0, 0);      // the floor
      quad(P(u0, -0.004, 0.012), P(u1, -0.004, 0.012), P(u1, -0.004, 1.08), P(u0, -0.004, 1.08), 0.5, 0);                        // the foot of the wall (over the skirting)
      quad(P(u0, back + 0.005, 0.012), P(u1, back + 0.005, 0.012), P(u1, back + 0.005, WU), P(u0, back + 0.005, WU), 1, 0);      // the wall, flat against it (behind the canvases and the labels)
      for (const [near, u] of [[left < SIDE, -left], [right < SIDE, right]]) {
        if (!near) continue;
        const s = u < 0 ? 1 : -1;                                 // (into the room from that wall)
        quad(P(u + s * 0.036, back, 0.012), P(u + s * 0.036, FO - 0.5, 0.012), P(u + s * 0.036, FO - 0.5, 1.08), P(u + s * 0.036, back, 1.08), 0.5, 1);
        quad(P(u + s * 0.005, back, 0.012), P(u + s * 0.005, FO - 0.5, 0.012), P(u + s * 0.005, FO - 0.5, WU), P(u + s * 0.005, back, WU), 1, 1);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.computeVertexNormals();
      this.ground = new THREE.Mesh(g, fm); this.ground.name = 'dusk'; this.ground.renderOrder = 5; L.add(this.ground);
    }

    // ---------------------------------------------------------- the motes: gold lifting off the dial, and over the top rail
    // aS: where it starts (along the wall, out from it), its own number, its size. aK: when it is first let go (story
    // seconds), how long one climb takes, which kind (0 off the dial, 1 over the rail), how far it climbs.
    const N = N_CONE + N_OVER, pos = new Float32Array(N * 12), aS = new Float32Array(N * 16), aK = new Float32Array(N * 16), idx = [];
    const railH = L.rail - L.y, crownH = L.crown - L.y;
    this.coneTop = Math.min(CONE_TOP, railH - 0.07);
    for (let i = 0; i < N; i++) {
      const over = i >= N_CONE, s = L.rand();
      let u, o, born, period, climb, size;
      if (!over) {
        const a = L.rand() * TAU, rr = R * 0.9 * Math.sqrt(0.04 + 0.96 * L.rand());
        u = Math.cos(a) * rr; o = OUT + Math.sin(a) * rr;
        // (a first breath: a good third of them leave the dial together; after it they go one by one)
        period = 3.5 + 3.3 * L.rand(); born = T_RISE + (i < N_CONE * 0.36 ? 0.9 * L.rand() * L.rand() : 0.4 + L.rand() * period);
        climb = this.coneTop - 0.19 * L.rand(); size = 0.027 + 0.034 * L.rand() * L.rand();
      } else {
        u = (L.rand() - 0.5) * 2 * (L.hw - 0.02); o = -L.wall * 0.4;
        period = 3.2 + 2.6 * L.rand(); born = T_OVER + L.rand() * period;
        climb = 0.3 + 0.36 * L.rand(); size = 0.024 + 0.022 * L.rand();
      }
      for (let k = 0; k < 4; k++) { const v = i * 4 + k; pos.set([k % 2 ? 0.5 : -0.5, k < 2 ? -0.5 : 0.5, 0], v * 3); aS.set([u, o, s, size], v * 4); aK.set([born, period, over ? 1 : 0, climb], v * 4); }
      idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3);
    }
    const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); mg.setAttribute('aS', new THREE.BufferAttribute(aS, 4)); mg.setAttribute('aK', new THREE.BufferAttribute(aK, 4)); mg.setIndex(idx);
    const mu = this.mu = {
      uO: { value: this.O }, uAx: { value: ax }, uT: { value: 0 }, uFade: { value: 0 }, uTw: { value: 1 }, uCrown: { value: crownH },
      uGold: { value: col('#f2a63a', 0.1) }, uPale: { value: col('#ffe9b4', 0.06) }, tDot: { value: radialTexture() },
    };
    const mm = new THREE.ShaderMaterial({
      uniforms: mu, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`
attribute vec4 aS, aK; uniform vec3 uO; uniform vec4 uAx; uniform float uT, uFade, uTw, uCrown;
varying vec2 vQ; varying float vB;
void main() {
  float age = uT - aK.x, s = fract(max(age, 0.0) / aK.y), sd = aS.z;
  float e = 1.0 - pow(1.0 - s, 1.75);                    // (quick off the dial, slower as it nears the picture)
  float u, o, h, a;
  if (aK.z < 0.5) {
    h = 0.012 + e * aK.w;
    float k = smoothstep(0.0, 1.0, h / ${CONE_TOP.toFixed(2)});
    // drawn in as it rises, towards the foot of the frame
    u = mix(aS.x, aS.x * 0.3 + (fract(sd * 7.31) - 0.55) * 0.26, k);
    o = mix(aS.y, 0.13 + 0.2 * fract(sd * 3.17), k * k);
    a = smoothstep(0.0, 0.07, s) * (1.0 - smoothstep(0.62, 1.0, s));
  } else {
    h = uCrown - 0.02 + e * aK.w;
    u = aS.x * (1.0 - 0.45 * e); o = aS.y + 0.02 + 0.1 * e;
    a = 0.85 * smoothstep(0.0, 0.16, s) * (1.0 - smoothstep(0.4, 1.0, s));
  }
  u += 0.022 * sin(uT * (0.5 + 0.6 * sd) + sd * 40.0) * e; o += 0.018 * cos(uT * (0.4 + 0.5 * sd) + sd * 23.0) * e;
  vB = a * step(0.0, age) * uFade * (1.0 - uTw * (0.28 + 0.28 * sin(uT * (0.9 + 1.2 * sd) + sd * 50.0)));
  vQ = position.xy * 2.0;
  vec3 c = uO + vec3(uAx.x, 0.0, uAx.y) * u + vec3(uAx.z, 0.0, uAx.w) * o + vec3(0.0, h, 0.0);
  vec4 mv = viewMatrix * vec4(c, 1.0); mv.xy += position.xy * aS.w * (0.7 + 0.5 * e) * (vB > 0.004 ? 1.0 : 0.0);
  gl_Position = projectionMatrix * mv;
}`,
      fragmentShader: /* glsl */`
uniform vec3 uGold, uPale; uniform sampler2D tDot;
varying vec2 vQ; varying float vB;
void main() {
  float d = texture2D(tDot, vQ * 0.5 + 0.5).a;           // (a pale heart, gold round it)
  gl_FragColor = vec4(mix(uGold, uPale, smoothstep(0.5, 0.95, d)), min(1.0, vB * d * (0.4 + 0.6 * d) * 1.6));
}`,
    });
    this.motes = new THREE.Mesh(mg, mm); this.motes.name = 'motes'; this.motes.renderOrder = 7; L.add(this.motes);

    // ---------------------------------------------------------- the gold on the wall, behind the frame (the canvas hides it)
    const eve = col('#f2b058', 0.1), gold = col('#f4ac4c', 0.08);
    this.light = L.glows([
      { wall: true, u: -0.03, v: -L.hh - 0.56, w: 1.15, d: 1.3, color: eve, strength: 0.6 },                                   // under the foot of the frame
      { wall: true, u: 0, v: 0, w: 2 * (L.hw + L.fw) + 0.8, d: 2 * (L.hh + L.fw) + 0.8, color: gold, strength: 1.0 },          // behind the picture, close round it
      { wall: true, u: 0, v: L.hh + 0.36, w: 0.85, d: 0.95, color: gold, strength: 0.5 },                                      // over its top rail
    ]);
    this.light.renderOrder = 6;                                  // (after the shade on the wall: it shines on it)
    this.T = 0; this.speed = 1;
    this.clear();
  },

  // The dial, painted once, seen from above with the wall at the top. Red: his gold, light and dark, in soft dabs.
  // Green: the rings, the numbers and the gnomon's foot. Blue: the nine. Alpha: where the dial is (its rim broken).
  dialTexture(L) {
    const S = 512, c0 = S / 2, pr = R / PLATE * S, rnd = L.rand;
    const mk = () => { const c = document.createElement('canvas'); c.width = c.height = S; return c.getContext('2d', { willReadFrequently: true }); };
    const dab = (g, x, y, r, v, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${v},${v},${v},${a})`); gr.addColorStop(0.5, `rgba(${v},${v},${v},${a * 0.6})`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
    // ---- the gold
    const g = mk();
    { const gr = g.createRadialGradient(c0, c0, 0, c0, c0, pr * 1.0); gr.addColorStop(0, 'rgba(150,150,150,0.95)'); gr.addColorStop(0.84, 'rgba(140,140,140,0.95)'); gr.addColorStop(0.95, 'rgba(120,120,120,0.7)'); gr.addColorStop(1, 'rgba(110,110,110,0)'); g.fillStyle = gr; g.beginPath(); g.arc(c0, c0, pr, 0, TAU); g.fill(); }
    for (let i = 0; i < 2400; i++) {
      const a = rnd() * TAU, q = Math.pow(rnd(), 0.6) * 1.0, x = c0 + Math.cos(a) * q * pr, y = c0 + Math.sin(a) * q * pr;
      // (lighter where the light falls on it, to the left of the gnomon and towards the wall; deeper at the rim)
      const lightK = 0.5 + 0.34 * (-Math.cos(a) * 0.7 - Math.sin(a) * 0.5) * q - 0.3 * Math.pow(q, 3);
      const v = Math.round(255 * clamp01(lightK + (rnd() - 0.5) * 0.62));
      dab(g, x, y, (4 + 10 * rnd()) * (q > 0.86 ? 0.65 : 1), v, 0.2 + 0.3 * rnd());
    }
    // ---- the rings, the numbers, the foot of the gnomon (the numbers all stand upright to the room, as his nearest
    // ones do: turned round the ring, the six would read as a nine from where you stand, and the nine is the point)
    const m = mk();
    m.globalCompositeOperation = 'lighter'; m.strokeStyle = '#00ff00'; m.fillStyle = '#00ff00'; m.lineCap = 'round';
    for (const [rr, w] of [[0.9, 1.3], [0.66, 1.4]]) { m.lineWidth = w; m.beginPath(); m.arc(c0, c0, rr * pr, 0, TAU); m.stroke(); }
    m.font = `${Math.round(pr * 0.2)}px Georgia, "Times New Roman", serif`; m.textAlign = 'center'; m.textBaseline = 'middle';
    for (let n = 1; n <= 12; n++) {
      const a = HOUR(n);
      m.fillStyle = n === 9 ? '#0000ff' : '#00ff00'; m.fillText(String(n), c0 - Math.sin(a) * pr * 0.78, c0 + Math.cos(a) * pr * 0.78 + 1);
      const b = HOUR(n + 0.5); m.fillStyle = '#00ff00'; m.beginPath(); m.arc(c0 - Math.sin(b) * pr * 0.8, c0 + Math.cos(b) * pr * 0.8, 1.7, 0, TAU); m.fill();      // (the half hours: a point)
    }
    m.lineWidth = 3.2; m.beginPath(); m.moveTo(c0, c0 - FOOT / PLATE * S); m.lineTo(c0, c0 + FOOT / PLATE * S); m.stroke();
    m.globalCompositeOperation = 'destination-out';                       // (worn)
    for (let i = 0; i < 700; i++) { const a = rnd() * TAU, q = Math.sqrt(rnd()); dab(m, c0 + Math.cos(a) * q * pr, c0 + Math.sin(a) * q * pr, 1.5 + 4.5 * rnd(), 0, 0.3 + 0.6 * rnd()); }
    const A = g.getImageData(0, 0, S, S).data, B = m.getImageData(0, 0, S, S).data, d = new Uint8Array(S * S * 4);
    for (let i = 0; i < S * S * 4; i += 4) { const k = B[i + 3] / 255; d[i] = A[i]; d[i + 1] = Math.round(B[i + 1] * k); d[i + 2] = Math.round(B[i + 2] * k); d[i + 3] = A[i + 3]; }
    const tex = new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
    tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 8; tex.needsUpdate = true;
    return tex;
  },

  clear() {
    this.ground.visible = false; this.motes.visible = false; this.fu.uN.value.set(0, 0, 0, 0); this.fu.uK.value.set(0, 0, 0, 0); this.mu.uFade.value = 0;
    for (let i = 0; i < 3; i++) this.light.set(i, 0);
  },

  // The sound, on the show's own clock: a warm held chord as the dusk comes, hardly there; one far bell when the shadow
  // stops, and another further off, each struck once and no more (a bell that went on would be a knell). `slow` stretches it all.
  band(L, slow, calm) {
    const s = score(L), k = calm ? 0.6 : 1;
    for (const [f, v] of [[146.83, 0.011], [220, 0.008], [369.99, 0.004]]) s.note(0.3 * slow, f, 5.6 * slow, { type: 'sine', vol: v * k, attack: (calm ? 2.6 : 1.7) * slow });
    const bell = (t, f, vol, decay) => PARTIALS.map(([mul, g, d]) => ({ t, f: f * mul, d: decay * d, vol: vol * g * k, type: 'sine', attack: calm ? (mul < 1 ? 0.6 : 0.4) : (mul < 1 ? 0.05 : 0.022) }));
    for (const e of [...bell(T_REST * slow, 220, 0.02, 6.5), ...bell((T_REST + 3.0) * slow, 293.66, 0.0075, 5)]) s.note(e.t, e.f, e.d, e);
    return s.done();
  },

  start(L) {
    this.T = 0; this.speed = L.calm ? 0.6 : 1; this.mu.uTw.value = L.calm ? 0 : 1;
    this.sc = this.band(L, 1 / this.speed, L.calm); this.sc.from(0);
    if (!this.told && !L.quiet) { this.told = true; L.k.say('The shadow on the sundial comes round to nine, and stays.', 4); }
  },
  end() { this.clear(); },
  reset() { this.told = false; this.clear(); },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return', F = this.fu, M = this.mu;
    if (showing) this.T = L.t; else this.T += dt;
    const t = this.T * this.speed;
    const gone = back ? L.ret : 0, away = 1 - ease.inOut(ramp(gone, 0.15, 0.8)), home = 1 - ease.inOut(ramp(gone, 0.4, 1));
    // ---- the dusk gathers; the dial opens in it; its numbers surface; the shadow is there as soon as the light is
    const open = ease.out(ramp(t, 0.5, 2.1)) * away;
    // ---- the hour passes: the shadow comes round to nine, opening and lengthening, slower and slower
    const f = Math.pow(ease.smooth(ramp(t, T_SWEEP, T_REST)), 0.8);
    const a = HOUR(lerp(H_FROM, H_TO, f)), len = R * lerp(0.6, 1.03, f);
    this.tip.set(-Math.sin(a) * len, -Math.cos(a) * len);
    // ---- it rests; the light swells once, slowly, and lifts
    const lift = ease.smooth(ramp(t, T_RISE, T_RISE + 3.4));
    F.uN.value.set((0.04 + 0.96 * ease.out(ramp(t, 0.0, 1.7))) * (0.3 + 0.7 * home), ease.smooth(ramp(t, 0, 1.4)) * home, ease.smooth(ramp(t, 0.8, T_REST)) * home, 0);
    F.uK.value.set(open, ease.smooth(ramp(t, 1.1, 2.4)), ease.smooth(ramp(t, 0.8, 1.9)), ease.smooth(ramp(t, T_REST - 0.1, T_REST + 1.7)));
    F.uS.value.set(f, 1 + 0.12 * hump(t, T_REST - 0.2, T_REST + 2.6) - 0.08 * lift, 0.36, 0);
    this.ground.visible = F.uN.value.y > 0.002;
    M.uT.value = t; M.uFade.value = 1 - ease.smooth(ramp(gone, 0, 0.4));
    this.motes.visible = t > T_RISE - 0.05 && M.uFade.value > 0.003;
    // ---- the gold on the wall: a little at the foot of the frame from the first (the light comes from under the
    // picture); then, as the light lifts, behind the picture and over it; breathing very slowly
    const breath = 1 + 0.05 * Math.sin(t * 0.55), off = 1 - ease.smooth(ramp(gone, 0, 0.7));
    this.light.set(0, (0.35 * ease.smooth(ramp(t, 0.3, 1.6)) + 0.65 * lift) * breath * off);
    this.light.set(1, (0.12 * ease.smooth(ramp(t, 1.0, 2.6)) + 0.88 * ease.smooth(ramp(t, T_RISE + 0.2, T_RISE + 3.8))) * breath * off);
    this.light.set(2, ease.smooth(ramp(t, T_OVER - 0.6, T_OVER + 2.4)) * breath * off);
    if (showing && this.sc) this.sc.play(L.t);
    L.voice().place();
  },
});
