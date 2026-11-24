// Rembrandt van Rijn, Old Man with a Gold Chain (1631), hung high in Griffin Court. The word: glint.
//
// A study in light more than a likeness: a sitter in studio finery (a plumed black hat, a steel gorget, a heavy gold
// chain with its medal) turned to a window high on the left, everything else lost in brown shadow. He stays in his
// picture; what comes out is his light, and the things it falls on. Look, and the floor under the picture sinks into
// his umber shadow, and a shaft of warm light opens across it from high on the left, dust turning in it. Then, in the
// hush, the medal slides out from under the frame, tips over the lip and hangs there turning, and its weight draws the
// chain out after it, link by link, slowly, then all in a rush: a line of gold running down the wall out of the dark
// and into the shaft, where every link lights as it passes. The medal touches the floor as the last link slips free.
// The chain pours down into a coil; the medal rolls out across the floor towards you on its rim, drawing the chain a
// little way after it before its ring slips free, curves into the light and spins there as a coin does, round and
// down, ringing quicker and quicker, flashing each time its face finds the light, until it lies flat and silent, and
// glints once. All the while a black plume like the one in his hat has been coming down through the shaft, rocking as
// a feather falls, seen where it crosses the light and lost where it leaves it; it alights beside the gold last of all.
// A lute plays the four falling notes of Dowland's Lachrimae ("Flow my tears", 1600), which Sweelinck set in Amsterdam
// in the painter's time. When you stop looking it all runs back: the plume floats up, the medal rolls home, the chain
// draws up under the frame, the light closes.
//
// Nothing is solid (the toy drives through), nothing is collected or scored, and all of it goes back. The light is in
// the room, never on the picture: the shaft passes to the left of the frame and falls on the floor in front of it.
// With "Reduce motion and flashing" on, the quick glints and the flicker go (the gold keeps a soft sheen, and one slow
// gleam at the end) and the lute comes in quietly.
//
// What it does not do: it puts no figure in the room, moves no face, makes nothing of the sitter's age and gives him
// no name or story the museum does not, because the picture is a study of light on a dignified sitter in borrowed
// finery, and the light is all it needs.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { score, hz, Bones } from './stagecraft.js';

const TAU = Math.PI * 2;
// Everything is placed in the stage's own space: x along the wall (to the viewer's right), y up from the floor, z out
// from the canvas plane.
const BIG = 1.25;                                                   // (all of it larger than life, to read across the court)
const BAR = 0.09 * BIG, BAR_R = 0.021 * BIG, BEAD = 0.018 * BIG, GAP = 0.005 * BIG, PITCH = BAR + 2 * BEAD + 2 * GAP;      // the chain: a cast bar, a bead, a bar...
const MRX = 0.105 * BIG, MRY = 0.125 * BIG, MTH = 0.016 * BIG, BAIL = 0.165 * BIG;        // the medal: half width and height, thickness, the top of its ring
const ARC_R = 0.09, ARC = ARC_R * Math.PI / 2;                    // the lip the chain runs over as it leaves the wall
const COL_U = -0.2, COL_OUT = -0.01 + ARC_R;                      // where it hangs
const UM = 0.12, OM = 2.6;                                        // where the medal comes to rest
const COIL = { r0: 0.19, r1: 0.09, turns: 2.7 }, DRAG = 1.25, STEP = 0.01;      // the coil at the foot of the wall; how far the medal draws the chain out after it
const T_PEEK = 0.7, T_HANG = 1.5, T_RUN = 2.4, T_FREE = 3.4, T_FLAT = 6.4, T_END = 7.9;
const S0 = -0.22, S_HANG = 0.37, N_SLOW = 2, S_RUN = S_HANG + N_SLOW * PITCH;
const DW = T_FLAT - T_FREE, NW = 360, OM0 = 12, TR = 1.9, OMR = 0.5, MR = 0.115 * BIG;      // the medal's roll and spin: its length, the table, turn rates, how long it rolls
const FLARE = 0.5;                                                // the last of the fall, where the chain swings out to where it lies
// The shaft: where its middle meets the floor, the way the light travels, its half width and half depth.
const POOL = { u: -0.05, out: 1.5 }, RAY = [0.5, -1, -0.1], BW = 0.5, BD = 1.4, BTOP = 4.6;
const MOTES = 84, SHEETS = 5, STARS = 3;
// The plume's fall: [time, along, height, out] at each turn of its rocking.
const PLUME = [[1.5, -0.29, 3.1, -0.02], [2.1, -0.99, 3.08, -0.02], [2.7, -1.15, 2.96, 0.3], [3.6, -0.88, 2.36, 0.5], [4.6, -1.0, 1.72, 0.75], [5.6, -0.1, 1.1, 1.0], [6.5, -0.46, 0.52, 1.3], [7.3, 0.32, 0.07, 1.5]];
const PL = [0.32, 0.28, 0.25], PH = (PL[0] + PL[1] + PL[2]) / 2;                                     // its three lengths, hinged
// Dowland, "Flow my tears" (Lachrimae), The Second Booke of Songs, 1600: the opening phrase, a crotchet = half a second.
// a'2. g'8 f'8 | e'2 c''2~ | c''2 b'4 a'4 | g#'1   (the bass under it is plain roots, not his)
const LACHRIMAE = [[0.4, 69, 1.5], [1.9, 67, 0.25], [2.15, 65, 0.25], [2.4, 64, 1], [3.4, 72, 2], [5.4, 71, 0.5], [5.9, 69, 0.5], [6.4, 68, 2.4]];
const BASS = [[0.4, 45, 2], [2.4, 52, 1], [3.4, 45, 1], [4.4, 50, 1], [5.4, 52, 1], [6.4, 40, 2.4], [6.42, 59, 2]];

const BEAM_GLSL = /* glsl */`
uniform vec3 uBC, uBD, uBA, uBB, uBW, uWarm;
float remBeam(vec3 P) {
  vec3 q = P - uBC; q -= uBD * dot(q, uBD);
  float a = dot(q, uBA) / (uBW.x * max(uBW.z, 0.03)), b = dot(q, uBB) / uBW.y;
  return (1.0 - smoothstep(0.7, 1.0, abs(a))) * (1.0 - smoothstep(0.78, 1.0, abs(b))) * smoothstep(0.0, 0.3, uBW.z);
}
float remH(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
`;

// A geometry from loose arrays (indexed), smooth, then non-indexed with position, normal, color and uv (uv: how much it
// is metal, how much it is down), as the rig wants them.
function solid(pos, col, uv, idx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g.toNonIndexed();
}
function tag(g, metal, soft) { const n = g.attributes.position.count, a = new Float32Array(n * 2); for (let i = 0; i < n; i++) { a[i * 2] = metal; a[i * 2 + 1] = soft; } g.setAttribute('uv', new THREE.BufferAttribute(a, 2)); return g; }
function join(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const [name, k] of [['position', 3], ['normal', 3], ['color', 3], ['uv', 2]]) { const a = new Float32Array(n * k); let o = 0; for (const g of list) { a.set(g.attributes[name].array, o); o += g.attributes[name].array.length; } out.setAttribute(name, new THREE.BufferAttribute(a, k)); }
  return out;
}

lifeFor(95998, {
  title: /^Old Man with a Gold Chain/,
  word: 'glint',
  // (a small work hung high: the kit keeps all of it in view; the camera stands low, so the shaft crosses the dark wall
  // between the picture and the floor)
  stage: { out: 2.8, half: 1.3, cam: { dist: 3.9, height: 0.45, side: 0.3, fov: 64, lookU: -0.05, lookOut: 0.8, lookH: 0.92, floorOut: 2.7 } },
  wake: 2, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.18) => P.near(h, a), rand = L.rand;
    const V = this.V = { m: new THREE.Matrix4(), a: new THREE.Matrix4(), b: new THREE.Matrix4(), c: new THREE.Matrix4(), l: new THREE.Matrix4(), v: new THREE.Vector3(), s: new THREE.Vector3(), q: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), x: new THREE.Vector3(), y: new THREE.Vector3(), z: new THREE.Vector3() };
    this.bones = new Bones();
    const T = new THREE.Vector3(L.tx, 0, L.tz), N = new THREE.Vector3(L.nx, 0, L.nz), O = L.floor(0, 0);
    this.B = new THREE.Matrix4().makeBasis(T, new THREE.Vector3(0, 1, 0), N).setPosition(O);
    this.HE = L.rail - L.y - 0.075;                               // where the chain leaves the wall, just under the frame
    this.S3 = this.HE - ARC_R + ARC - MRY;                        // the chain paid out as the medal touches the floor
    this.V3 = (this.S3 - S_RUN) * (0.25 + 0.75 * 2.2) / (T_FREE - T_RUN);

    // ------------------------------------------------------------ the light: one shaft, the same for everything
    const D = new THREE.Vector3(RAY[0], RAY[1], RAY[2]).normalize();                       // (stage space)
    const A = new THREE.Vector3(1, 0, 0).addScaledVector(D, -D.x).normalize(), Bv = new THREE.Vector3().crossVectors(D, A).normalize();
    if (Bv.z < 0) Bv.negate();
    this.ray = { D, A, B: Bv, C: new THREE.Vector3(POOL.u, 0, POOL.out) };
    const W = v => v.clone().transformDirection(this.B);
    const u = this.u = {
      uBC: { value: this.ray.C.clone().applyMatrix4(this.B) }, uBD: { value: W(D) }, uBA: { value: W(A) }, uBB: { value: W(Bv) }, uBW: { value: new THREE.Vector3(BW, BD, 0) },
      uWarm: { value: new THREE.Color(1.0, 0.74, 0.4) }, uTime: { value: 0 },
    };

    // ------------------------------------------------------------ paint: his gold and his black, lit by the shaft alone
    // In shadow a thing keeps only a dull gleam; in the shaft the gold takes thick bright dabs (his impasto) and a hard
    // glint, and the plume's down takes the light in its edges.
    const paint = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0, emissive: 0xffffff, side: THREE.DoubleSide });
    const pu = this.pu = { uGl: { value: 1 }, uAmb: { value: 0.3 }, uSpec: { value: new THREE.Color(1.0, 0.86, 0.5) }, uDown: { value: new THREE.Color(0.03, 0.04, 0.018) } };
    paint.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u, pu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec2 vRem;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vOP = position; vRem = uv;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec2 vRem; uniform float uAmb, uGl; uniform vec3 uSpec, uDown;\n' + BEAM_GLSL)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  vec3 wN = normalize(inverseTransformDirection(normal, viewMatrix)), Ld = -uBD;
  float key = remBeam(lifeP), metal = vRem.x, soft = vRem.y, nl = dot(wN, Ld);
  vec3 cell = floor(vOP * 95.0); float h1 = remH(cell), h2 = remH(cell + 7.3);
  vec3 base = diffuseColor.rgb * (0.88 + 0.24 * h2);
  float dab = smoothstep(0.93, 0.98, metal) * smoothstep(0.74, 0.95, h1) * smoothstep(-0.1, 0.5, nl);
  float wrap = mix(clamp(nl, 0.0, 1.0), clamp(nl * 0.5 + 0.5, 0.0, 1.0), max(soft, 0.3));
  vec3 Vw = normalize(cameraPosition - lifeP), Hw = normalize(Ld + Vw);
  float sp = pow(max(dot(wN, Hw), 0.0), 22.0), rim = pow(1.0 - abs(dot(wN, Vw)), 2.0);
  vec3 lit = base * uWarm * wrap * 1.25 * (1.0 - 0.5 * soft) + uSpec * metal * (sp * 0.95 * uGl + dab * 0.36 * wrap);
  lit += soft * uDown * (0.3 + 0.7 * rim);
  vec3 dim = base * uAmb + uSpec * metal * (pow(max(dot(wN, normalize(vec3(0.0, 0.5, 0.0) + Vw)), 0.0), 14.0) * 0.1 + dab * 0.05);
  totalEmissiveRadiance = dim + key * lit;
  diffuseColor.rgb = base * 0.5;
}`);
    };
    paint.customProgramCacheKey = () => 'rembrandt-paint';

    // ------------------------------------------------------------ the chain: cast bars and beads, and the medal
    const gD = col('#2e2110'), gM = col('#8a6a26', 0.14), gL = col('#c9a03c', 0.1), gH = col('#e6c565', 0.06);
    const prof = [[0.003, -0.5], [0.4, -0.455], [0.36, -0.39], [0.66, -0.3], [0.74, -0.21], [0.55, -0.13], [0.78, -0.05], [0.86, 0], [0.78, 0.05], [0.55, 0.13], [0.74, 0.21], [0.66, 0.3], [0.36, 0.39], [0.4, 0.455], [0.003, 0.5]];
    const bar = shape.lathe(prof.map(([r, y]) => [r * BAR_R * 1.16, y * BAR]), 14, gM);
    shape.paint(bar, c => { const r = Math.hypot(c.x, c.z) / BAR_R; return gD.clone().lerp(r > 0.72 ? gL : gM, ease.smooth(ramp(r, 0.3, 0.8))); });
    shape.move(bar, 0, 0, 0, Math.PI / 2, 0, 0, 0.82, 1, 1); tag(bar, 1, 0);                        // (its length along z; a little flattened)
    const bead = shape.ball(BEAD, gM, 2); shape.paint(bead, (c, n) => (n.y > 0.4 ? gL : n.y < -0.5 ? gD : null)); tag(bead, 1, 0);
    // the medal: a cartouche, four-lobed and scalloped, a raised rim and a small figure in relief; a ring to hang by
    const medal = (() => {
      const NT = 84, rings = [[0, 0.0066], [0.25, 0.0066], [0.5, 0.0062], [0.7, 0.0056], [0.8, 0.005], [0.835, 0.0046], [0.875, 0.0088], [0.955, 0.0088], [0.99, 0.0045], [1, 0]];
      const rim = th => 1 + 0.03 * Math.cos(4 * th) + 0.009 * Math.cos(28 * th), pos = [], cl = [], uv = [], idx = [];
      for (const side of [1, -1]) {
        const base = pos.length / 3;
        rings.forEach(([rho, z], j) => {
          for (let i = 0; i <= NT; i++) {
            const th = i / NT * TAU, k = rho * (1 + (rim(th) - 1) * ease.smooth(rho * 1.4)), x = k * Math.cos(th), y = k * Math.sin(th);
            const fig = 0.0075 * BIG * Math.max(Math.exp(-((x * x) / 0.022 + ((y + 0.1) ** 2) / 0.1)), 0.9 * Math.exp(-((x * x + (y - 0.3) ** 2) / 0.022))) * ramp(rho, 0.74, 0.55);      // the figure
            pos.push(MRX * x, MRY * y, side * (z * BIG + (side > 0 ? fig : fig * 0.4)));
            const f = ease.smooth(fig / (0.0075 * BIG)), c = j >= 6 && j <= 7 ? gH : j >= 8 ? gL : j === 5 ? gD : gD.clone().lerp(gM, 0.7).lerp(gH, f);
            cl.push(c.r, c.g, c.b); uv.push(j >= 6 || f > 0.35 ? 1 : 0.9, 0);      // (thick paint on the rim and the figure only)
          }
        });
        for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < NT; i++) { const a = base + j * (NT + 1) + i, b = a + NT + 1; if (side > 0) idx.push(a, b, a + 1, a + 1, b, b + 1); else idx.push(a, a + 1, b, a + 1, b + 1, b); }
      }
      const bail = (() => { const g = new THREE.TorusGeometry(0.017 * BIG, 0.0055 * BIG, 8, 18); g.rotateY(Math.PI / 2); g.translate(0, MRY * 1.05 + 0.014 * BIG, 0); const s = g.toNonIndexed(); s.deleteAttribute('uv'); const c = new Float32Array(s.attributes.position.count * 3); for (let i = 0; i < c.length; i += 3) { c[i] = gL.r; c[i + 1] = gL.g; c[i + 2] = gL.b; } s.setAttribute('color', new THREE.BufferAttribute(c, 3)); return tag(s, 1, 0); })();
      return join([solid(pos, cl, uv, idx), bail]);
    })();

    // ------------------------------------------------------------ the plume: a quill and its down, in three hinged lengths
    const total = PL[0] + PL[1] + PL[2], black = col('#0f0d0b', 0.25), brown = col('#1c1610', 0.25), green = col('#1d2e22', 0.1), olive = col('#394127', 0.1), quillC = col('#857553', 0.2);
    const plume = (z0, len) => {
      const pos = [], cl = [], uv = [], idx = [], step = 0.014;
      for (let layer = 0; layer < 2; layer++) for (let z = layer ? step / 2 : 0; z < len + 0.004; z += step) for (const sg of [-1, 1]) {
        const sglob = (z0 + z) / total, prf = Math.pow(Math.sin(Math.PI * Math.min(1, Math.pow(sglob, 0.8) * 0.88 + 0.07)), 0.5);
        const Lb = (layer ? 0.125 : 0.2) * (0.3 + 0.7 * prf) * (0.7 + 0.6 * rand()), sweep = 0.25 + 0.4 * rand(), lift = layer ? 0.75 + 0.45 * rand() : 0.12 + 0.3 * rand(), w = 0.03 * (0.8 + 0.5 * rand());
        const tip = (sg > 0 ? green : brown).clone().lerp(olive, rand() * (sg > 0 ? 0.75 : 0.3)), root = black.clone().lerp(brown, rand() * 0.5);
        let r = 0, y = 0.004 + layer * 0.004; const base = pos.length / 3, NK = 5;
        for (let k = 0; k <= NK; k++) {
          const b = k / NK, el = lift - (lift + (layer ? 1.5 : 1.0)) * Math.pow(b, 1.8), ww = w * (1 - 0.5 * b * b);
          if (k) { r += Math.cos(el) * Lb / NK; y += Math.sin(el) * Lb / NK; }
          const x = sg * r * Math.cos(sweep), zc = z + r * Math.sin(sweep), c = root.clone().lerp(tip, ease.smooth(b * 1.2));
          pos.push(x, y, zc - ww / 2, x, y, zc + ww / 2); cl.push(c.r, c.g, c.b, c.r, c.g, c.b); uv.push(0, 0.25 + 0.75 * b, 0, 0.25 + 0.75 * b);
        }
        for (let k = 0; k < NK; k++) { const a = base + k * 2, b = a + 2; if (sg > 0) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1); }
      }
      const s0 = z0 / total, s1 = (z0 + len) / total, quill = shape.cyl(0.0042 * (1 - 0.7 * s0), 0.0042 * (1 - 0.7 * s1), len, 5, quillC);
      shape.move(quill, 0, 0.003, len / 2, Math.PI / 2, 0, 0); tag(quill, 0, 0.15);
      return join([solid(pos, cl, uv, idx), quill]);
    };
    const pg = [plume(0, PL[0]), plume(PL[0], PL[1]), plume(PL[0] + PL[1], PL[2])];

    // ------------------------------------------------------------ the rig: every solid thing, one draw call
    this.els = []; let cur = BAIL + 0.004;                                        // each: how far along the chain from the medal's middle
    while (cur + PITCH < this.S3 + 0.03) { this.els.push({ kind: 0, a: cur + BEAD }); cur += 2 * BEAD + GAP; this.els.push({ kind: 1, a: cur + BAR / 2 }); cur += BAR + GAP; }
    this.els.push({ kind: 0, a: cur + BEAD });
    const verts = bar.attributes.position.count + bead.attributes.position.count + medal.attributes.position.count + pg.reduce((n, g) => n + g.attributes.position.count, 0);
    const rig = this.rig = L.rig(this.els.length + 4, verts + 64, paint);
    const gb = rig.geo(bar), gbd = rig.geo(bead);
    this.medal = rig.add(rig.geo(medal));
    for (const e of this.els) { e.id = rig.add(e.kind ? gb : gbd); e.roll = rand() * TAU; e.tw = rand() * TAU; }
    this.pl = pg.map(g => rig.add(rig.geo(g)));

    // ------------------------------------------------------------ the medal on the floor, worked out once: a coin set going on its rim
    // It rolls away in a curve that tightens as it slows and leans, and the curve becomes the spin: its tilt falls away,
    // and the lower it lies the faster its rim runs round. (phi: which way it leans; psi: how far it has turned in its
    // own plane, rolling; PX, PZ: where its middle is.)
    const PHI = this.PHI = new Float32Array(NW + 1), PSI = this.PSI = new Float32Array(NW + 1), PX = this.PX = new Float32Array(NW + 1), PZ = this.PZ = new Float32Array(NW + 1), DIST = new Float32Array(NW + 1);
    for (let k = 1; k <= NW; k++) {
      const tw = (k - 0.5) / NW * DW, b = this.tilt(tw / DW), v = tw < TR ? Math.pow(1 - tw / TR, 1.6) : 0, om = lerp(OMR, OM0 / Math.sqrt(Math.sin(b) + 0.012), Math.pow(Math.min(1, tw / TR), 4)), h = DW / NW;
      PHI[k] = PHI[k - 1] + om * h; const pm = (PHI[k] + PHI[k - 1]) / 2;
      PX[k] = PX[k - 1] - v * Math.sin(pm) * h; PZ[k] = PZ[k - 1] + v * Math.cos(pm) * h; DIST[k] = DIST[k - 1] + v * h; PSI[k] = PSI[k - 1] + Math.cos(b) * om * h;
    }
    // (turned and scaled so that it ends where it should)
    const gx = UM - COL_U, gz = OM - COL_OUT, v0 = Math.hypot(gx, gz) / Math.hypot(PX[NW], PZ[NW]), rot = Math.atan2(gz, gx) - Math.atan2(PZ[NW], PX[NW]), cr = Math.cos(rot) * v0, sr = Math.sin(rot) * v0;
    for (let k = 0; k <= NW; k++) { const x = PX[k], z = PZ[k]; PX[k] = COL_U + cr * x - sr * z; PZ[k] = COL_OUT + sr * x + cr * z; PSI[k] += v0 * DIST[k] / MR; }
    this.phi0 = rot;
    const y3 = Math.PI / 2 - this.phi0; let best = y3, bd = 99;
    for (let k = -60; k <= 60; k++) { const w = (y3 - TAU * k) / (T_FREE - T_HANG); if (Math.abs(w + 1.5) < bd) { bd = Math.abs(w + 1.5); best = y3 - TAU * k; } }
    this.yaw3 = best; this.turn = -best / (T_FREE - T_HANG);                    // as it hangs it turns, to meet the floor facing the way it will roll

    // ------------------------------------------------------------ where the chain lies: one track on the floor
    // A coil at the foot of the wall, where it pours down, and then out along the way the medal rolled: the medal draws
    // the chain after it for a little over a metre before its ring slips free, so the chain slides along this track as
    // it lands (TRK holds it at every centimetre; a link `a` along the chain lies at min(the medal's way, DRAG) - a).
    for (let k = 0; k <= NW; k++) DIST[k] *= v0;
    this.DIST = DIST;
    {
      const sp = [], h0x = -Math.sin(this.phi0), h0z = Math.cos(this.phi0), th0 = -Math.PI / 2 + 0.1, cu = COL_U - COIL.r0 * Math.cos(th0), cz = COL_OUT - COIL.r0 * Math.sin(th0);
      const dirS = h0x * -Math.sin(th0) + h0z * Math.cos(th0) > 0 ? -1 : 1;            // (it leaves the coil the way the medal sets off)
      let px = COL_U, pz = COL_OUT, acc = 0; sp.push(px, pz);
      for (let i = 1; i <= 6000; i++) {
        const k = i / 6000, th = th0 + dirS * k * COIL.turns * TAU, r = COIL.r0 - (COIL.r0 - COIL.r1) * k + 0.014 * Math.sin(3.3 * th) * ease.smooth(k * 8), x = cu + Math.cos(th) * r, z = cz + Math.sin(th) * r;
        acc += Math.hypot(x - px, z - pz); px = x; pz = z; if (acc >= STEP) { acc -= STEP; sp.push(x, z); }
      }
      const nSp = this.nSp = sp.length / 2 - 1, nPa = Math.floor(DRAG / STEP), TRK = this.TRK = new Float32Array((nSp + nPa + 1) * 2);
      for (let i = 0; i <= nSp; i++) { TRK[(nSp - i) * 2] = sp[i * 2]; TRK[(nSp - i) * 2 + 1] = sp[i * 2 + 1]; }
      for (let i = 1, k = 0; i <= nPa; i++) { const dd = i * STEP; while (k < NW - 1 && DIST[k + 1] < dd) k++; const f = clamp01((dd - DIST[k]) / Math.max(1e-6, DIST[k + 1] - DIST[k])); TRK[(nSp + i) * 2] = lerp(PX[k], PX[k + 1], f); TRK[(nSp + i) * 2 + 1] = lerp(PZ[k], PZ[k + 1], f); }
      this.nTrk = nSp + nPa; this.coil = { u: cu, out: cz };
      let k = 0; while (k < NW && DIST[k] < DRAG) k++; this.slip = T_FREE + k / NW * DW;                        // when the ring lets the chain go
    }
    for (const e of this.els) {
      e.sy = e.kind ? BAR_R * 0.82 : BEAD;
      // when it lands: the whole chain falls as one once the last link is free
      const fall = e.a + ARC + this.HE - ARC_R - e.sy - this.S3;
      e.land = T_FREE + (-this.V3 + Math.sqrt(this.V3 * this.V3 + 19.6 * Math.max(0, fall))) / 9.8;
    }
    this.lastLand = this.els[this.els.length - 1].land;
    // where the falling chain first meets the shaft
    this.enter = 1.4; for (let h = 2.3; h > 0.2; h -= 0.02) if (this.beam(COL_U, h, COL_OUT, 1) > 0.45) { this.enter = h; break; }

    // ------------------------------------------------------------ the floor and the foot of the wall: his shadow, and the light on it
    const fu = this.fu = { uO: { value: O.clone() }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uDark: { value: 0 }, uShade: { value: col('#0d0906', 0.3) },
      uSh: { value: Array.from({ length: 3 }, () => new THREE.Vector4(0, 0, 0.2, 0.2)) }, uShK: { value: [0, 0, 0] } };
    const fm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
    fm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u, fu);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform vec3 uO, uShade; uniform vec4 uAx; uniform float uDark; uniform vec4 uSh[3]; uniform float uShK[3];
${BEAM_GLSL}
float remN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); float a = remH(vec3(i, 1.0)), b = remH(vec3(i + vec2(1.0, 0.0), 1.0)), c = remH(vec3(i + vec2(0.0, 1.0), 1.0)), d = remH(vec3(i + 1.0, 1.0)); return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
vec3 remCol; float remA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz, q = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw)); float hh = lifeP.y - uO.y, wallp = step(0.05, hh);
  float bm = remBeam(lifeP);
  // the shadow: broad, soft, broken at its edge, deepest under the picture
  float rr = length((q - vec2(0.0, 1.6)) / vec2(3.4, 3.7)), nz = remN(q * 2.1) * 0.6 + remN(q * 5.7) * 0.4;
  float wash = uDark * (1.0 - smoothstep(0.2, 1.0, rr + (nz - 0.5) * 0.34)) * (1.0 - wallp);
  // the light: on the floor where the shaft meets it, and a little way up the foot of the wall
  float lf = bm * mix(1.0, 0.5 * (1.0 - smoothstep(0.15, 1.0, hh)), wallp) * (0.86 + 0.28 * nz);
  float sh = 0.0;
  for (int i = 0; i < 3; i++) { vec2 e = (q - uSh[i].xy) / uSh[i].zw; sh = max(sh, uShK[i] * (1.0 - smoothstep(0.15, 1.0, length(e)))); }
  sh *= 1.0 - wallp; lf *= 1.0 - 0.85 * sh;
  remA = max(wash * (1.0 - 0.9 * lf), sh * 0.6 * max(lf, 0.25 * bm + 0.1 * uDark));
  remCol = uWarm * lf * 0.2 + uShade * remA;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = remCol; diffuseColor.a = remA;\n#include <opaque_fragment>');
    };
    fm.customProgramCacheKey = () => 'rembrandt-floor';
    {
      const f = (x, z) => L.floor(x, z).setY(L.y + 0.012), w = (x, h) => L.floor(x, -L.wall + 0.007).setY(L.y + h), q = [];
      const quad = (a, b, c, e) => { for (const v of [a, b, c, a, c, e]) q.push(v.x, v.y, v.z); };
      quad(f(-3.5, 5.3), f(3.5, 5.3), f(3.5, -L.wall + 0.01), f(-3.5, -L.wall + 0.01));
      quad(w(-1.6, 0.06), w(1.7, 0.06), w(1.7, 1.05), w(-1.6, 1.05));
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(q, 3)); g.computeVertexNormals();
      this.ground = new THREE.Mesh(g, fm); this.ground.renderOrder = 3; L.add(this.ground);
    }

    // ------------------------------------------------------------ the air: the shaft itself, the dust in it, and the glints
    const am = new THREE.ShaderMaterial({
      uniforms: { ...u }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`
attribute vec4 aK;
uniform float uTime;
${BEAM_GLSL}
varying vec2 vQ; varying float vKind, vB; varying vec3 vN;
void main() {
  vKind = aK.x; vQ = position.xy * 2.0; vB = aK.w; vN = vec3(0.0, 0.0, 1.0);
  if (aK.x < 0.5) {                                           // a sheet of the shaft
    vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * vec3(0.0, 0.0, 1.0));
    gl_Position = projectionMatrix * viewMatrix * wp;
  } else {
    vec3 c = instanceMatrix[3].xyz; float sz = aK.z;
    if (aK.x < 1.5) {                                         // a mote: c holds where it is in the shaft (across, along, through)
      float s = aK.y, l = mod(c.y - uTime * (0.016 + 0.03 * s), 3.2);
      float a = c.x + 0.07 * sin(uTime * (0.23 + 0.2 * s) + s * 40.0), b = c.z + 0.09 * cos(uTime * (0.19 + 0.14 * s) + s * 23.0);
      c = uBC - uBD * l + uBA * a + uBB * b;
      vB = remBeam(c) * (0.5 + 0.5 * sin(uTime * (1.1 + 2.3 * s) + s * 50.0)) * smoothstep(0.0, 0.15, l) * (1.0 - smoothstep(2.5, 3.2, l));
    } else c = (modelMatrix * vec4(c, 1.0)).xyz;
    vec4 mv = viewMatrix * vec4(c, 1.0); mv.xy += position.xy * sz; if (aK.x > 1.5) mv.z += 0.08;
    gl_Position = projectionMatrix * mv;
  }
}`,
      fragmentShader: /* glsl */`
uniform float uTime;
${BEAM_GLSL}
varying vec2 vQ; varying float vKind, vB; varying vec3 vN;
void main() {
  float a = 0.0; vec3 c = uWarm;
  if (vKind < 0.5) {
    vec3 q = lifeP - uBC; float l = -dot(q, uBD), ax = dot(q, uBA);
    float streak = 0.84 + 0.16 * sin(ax * 17.0 + 1.7 * sin(l * 0.9 + uTime * 0.13)) * sin(ax * 41.0 - l * 0.5);
    float face = abs(dot(normalize(lifeP - cameraPosition), vN));
    a = remBeam(lifeP) * (1.0 - smoothstep(1.6, ${BTOP.toFixed(1)}, l)) * streak * smoothstep(0.05, 0.6, face) * (0.45 + 0.55 * smoothstep(0.0, 0.9, l)) * 0.064;
  } else if (vKind < 1.5) {
    a = vB * (1.0 - smoothstep(0.1, 1.0, length(vQ))) * 0.9; c = mix(uWarm, vec3(1.0), 0.35);
  } else {
    vec2 p = abs(vQ); float r = length(vQ);
    vec2 dq = abs(vec2(vQ.x + vQ.y, vQ.x - vQ.y)) * 0.7071;
    float ray = exp(-p.y * 36.0) * exp(-p.x * 7.0) + exp(-p.x * 36.0) * exp(-p.y * 7.0) + 0.35 * (exp(-dq.y * 40.0) * exp(-dq.x * 10.0) + exp(-dq.x * 40.0) * exp(-dq.y * 10.0)), core = exp(-r * r * 40.0);
    a = vB * (ray * 0.7 + core * 0.9) * (1.0 - smoothstep(0.6, 1.0, r)); c = mix(uWarm, vec3(1.0, 0.97, 0.86), 0.7);
  }
  gl_FragColor = vec4(c, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
    });
    const nA = SHEETS + MOTES + STARS, air = this.air = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), am, nA), K = this.K = new Float32Array(nA * 4);
    const M = new THREE.Matrix4(), Yd = D.clone().negate();
    // the shaft: three sheets facing the room and two across them, so it holds from the side
    [[0, -0.75], [0, -0.4], [0, -0.05], [1, -0.4], [1, 0.4]].forEach(([cross, off], i) => {
      const X = cross ? Bv.clone().multiplyScalar(BD * 2.1) : A.clone().multiplyScalar(BW * 2.1), Z = cross ? A : Bv;
      const c = this.ray.C.clone().addScaledVector(Yd, BTOP / 2).addScaledVector(Z, off * (cross ? BW : BD));
      M.makeBasis(X, Yd.clone().multiplyScalar(BTOP), Z.clone()).setPosition(c); M.premultiply(this.B); air.setMatrixAt(i, M); K[i * 4] = 0; K[i * 4 + 3] = 1;
    });
    for (let i = 0; i < MOTES; i++) { const j = SHEETS + i; M.makeTranslation((rand() * 2 - 1) * BW * 0.9, rand() * 3.2, (rand() * 2 - 1) * BD * 0.85); air.setMatrixAt(j, M); K[j * 4] = 1; K[j * 4 + 1] = rand(); K[j * 4 + 2] = 0.007 + 0.011 * rand() * rand(); }
    for (let i = 0; i < STARS; i++) { const j = SHEETS + MOTES + i; M.makeTranslation(O.x, O.y - 5, O.z); air.setMatrixAt(j, M); K[j * 4] = 2; }
    air.geometry.setAttribute('aK', new THREE.InstancedBufferAttribute(K, 4).setUsage(THREE.DynamicDrawUsage));
    air.renderOrder = 4; L.add(air);
    this.star = (i, x, y, z, size, b) => { const j = SHEETS + MOTES + i; V.v.set(x, y, z).applyMatrix4(this.B); M.makeTranslation(V.v.x, V.v.y, V.v.z); air.setMatrixAt(j, M); K[j * 4 + 2] = size; K[j * 4 + 3] = b; };

    // ------------------------------------------------------------ the lute, and the gold's own sounds
    const s = this.sc = score(L), lute = { type: 'triangle', vol: 0.034, attack: 0.004, over: 2, overVol: 0.3 };
    for (const [t, m, dd] of LACHRIMAE) s.note(t, hz(m), Math.min(2.4, dd * 1.1 + 0.6), lute);
    for (const [t, m, dd] of BASS) s.note(t, hz(m), dd * 1.2 + 0.4, { type: 'triangle', vol: 0.024, attack: 0.006, over: 2, overVol: 0.15 });
    s.loop(14, 13, LACHRIMAE.map(([t, m, dd]) => ({ t, f: hz(m - 12), d: Math.min(2.4, dd * 1.1 + 0.6), ...lute, vol: 0.02 })));      // again, low and far off, while you stay
    const tink = (t, f, vol, dd = 0.1) => s.note(t, f, dd, { type: 'sine', vol, attack: 0.002, over: 2.76, overVol: 0.45 });
    tink(T_PEEK + 0.55, 2100, 0.01, 0.2);                                                             // the medal tips over the lip
    for (let k = 0; k < N_SLOW * 2; k++) tink(T_HANG + (T_RUN - T_HANG) * Math.pow((k + 0.5) / (N_SLOW * 2), 1 / 1.5), 2500 + 300 * (k % 3), 0.011);      // link by link
    for (let k = 0; k < 12; k++) tink(T_RUN + Math.sqrt((k + 0.5) / 12) * (T_FREE - T_RUN), 2300 + 620 * ((k * 7) % 5) / 4, 0.008 + 0.0006 * k, 0.07);        // the rush
    s.hit(T_RUN + 0.2, { d: 0.9, vol: 0.012, hp: 4200, attack: 0.5 });
    tink(T_FREE, 1568, 0.04, 0.9); tink(T_FREE, 2349, 0.02, 0.6);                                     // the medal touches the floor
    this.els.forEach((e, i) => { if (i % 2) tink(e.land, 3100 - 1300 * (e.land - T_FREE) / (this.lastLand - T_FREE) + 200 * ((i * 5) % 3), 0.012, 0.08); });      // the chain pours down
    s.hit(T_FREE + 0.05, { d: this.lastLand - T_FREE + 0.15, vol: 0.02, bp: 3200, q: 0.8, attack: 0.1 }); s.hit(this.lastLand, { d: 0.16, vol: 0.02, lp: 500 });
    tink(this.slip, 2794, 0.014, 0.25);                                                               // its ring slips the chain
    s.hit(T_FREE + 0.08, { d: TR * 0.8, vol: 0.012, bp: 700, q: 1.5, attack: 0.08 });                  // it rolls away
    // and spins down: a ring for each half turn of the rim, quicker and quicker, thinner and thinner
    for (let k = 1, i = 1; i <= NW; i++) while (PHI[i] >= k * Math.PI) { const x = i / NW; if (x < 0.985) tink(T_FREE + x * DW, 1500 + 900 * x * x, 0.021 * Math.pow(1 - x, 0.6) + 0.003, 0.14 - 0.09 * x); k++; }
    s.note(T_FLAT + 0.12, 2637, 2.2, { type: 'sine', vol: 0.016, attack: 0.02, over: 2, overVol: 0.2 });       // flat; and the glint
    s.hit(PLUME[PLUME.length - 1][0], { d: 0.3, vol: 0.012, lp: 900, attack: 0.08 });                                // the plume alights
    s.done();

    this.o = {}; this.S = {}; this.hold = 0; this.cam = new THREE.Vector3(); this.inv = new THREE.Matrix4().copy(this.B).invert();
    this.hide();
  },

  // ---- the light, on the CPU as the shaders have it (stage space): how much of the shaft falls at a point
  beam(x, y, z, open) {
    const R = this.ray, qx = x - R.C.x, qy = y - R.C.y, qz = z - R.C.z, k = qx * R.D.x + qy * R.D.y + qz * R.D.z, px = qx - R.D.x * k, py = qy - R.D.y * k, pz = qz - R.D.z * k;
    const a = Math.abs(px * R.A.x + py * R.A.y + pz * R.A.z) / (BW * Math.max(open, 0.03)), b = Math.abs(px * R.B.x + py * R.B.y + pz * R.B.z) / BD;
    return ease.smooth(ramp(a, 1, 0.7)) * ease.smooth(ramp(b, 1, 0.78)) * ease.smooth(ramp(open, 0, 0.3));
  },
  tilt(x) { return Math.PI / 2 * Math.pow(1 - Math.pow(clamp01(x), 1.25), 0.9); },
  // ---- the chain paid out by show-time t (metres past the lip): the medal slides out and hangs; link by link; the rush;
  // then, the last link free, it all falls
  sAt(t) {
    if (t <= T_PEEK) return S0;
    if (t < T_HANG) return S0 + (S_HANG - S0) * ease.inOut((t - T_PEEK) / (T_HANG - T_PEEK));
    if (t < T_RUN) { const p = N_SLOW * 2 * Math.pow((t - T_HANG) / (T_RUN - T_HANG), 1.5), f = p - Math.floor(p); return S_HANG + PITCH / 2 * (Math.floor(p) + ease.smooth(ramp(f, 0.1, 0.8))); }
    if (t < T_FREE) { const y = (t - T_RUN) / (T_FREE - T_RUN); return S_RUN + (this.S3 - S_RUN) * (0.25 * y + 0.75 * Math.pow(y, 2.2)); }
    const tau = t - T_FREE; return this.S3 + this.V3 * tau + 4.9 * tau * tau;
  },
  // where a link is, q metres along from the lip: inside the wall, round the lip, hanging
  guide(q, o) {
    if (q < 0) { o.z = -0.01 + q; o.y = this.HE; o.p = 0; }
    else if (q < ARC) { const a = q / ARC_R; o.z = -0.01 + ARC_R * Math.sin(a); o.y = this.HE - ARC_R * (1 - Math.cos(a)); o.p = a; }
    else { o.z = COL_OUT; o.y = this.HE - ARC_R - (q - ARC); o.p = Math.PI / 2; }
    return o;
  },
  // the track at tau metres (out along the medal's way; minus, back round the coil): S.x, S.z, S.yaw (the way it runs)
  track(tau, S) {
    const T = this.TRK, f = Math.max(0, Math.min(this.nTrk - 1.001, tau / STEP + this.nSp)), i = Math.floor(f), k = f - i, j = i * 2;
    S.x = T[j] + (T[j + 2] - T[j]) * k; S.z = T[j + 1] + (T[j + 3] - T[j + 1]) * k;
    const a = Math.max(0, i - 2) * 2, b = Math.min(this.nTrk, i + 3) * 2; S.yaw = Math.atan2(T[b] - T[a], T[b + 1] - T[a + 1]);
    return S;
  },
  // (stage space) out = B * T(x, y, z) * R(yaw, pitch, roll) * S
  place(out, x, y, z, yaw = 0, pitch = 0, roll = 0, sx = 1, sy = sx, sz = sx) {
    const V = this.V; V.e.set(pitch, yaw, roll, 'YXZ'); V.q.setFromEuler(V.e);
    return out.multiplyMatrices(this.B, V.l.compose(V.v.set(x, y, z), V.q, V.s.set(sx, sy, sz)));
  },

  hide() { this.rig.mesh.visible = false; this.ground.visible = false; this.air.visible = false; },
  start(L) { this.sc.from(0); this.hold = 0; },
  back(L) { this.hold = L.t; if (!L.quiet) L.k.synth.noise(0.7, { vol: 0.01, lp: 1200 }); },
  end() { this.hide(); },
  reset() { this.hide(); this.hold = 0; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play';
    if (!showing && ph !== 'return') { this.hide(); return; }
    // tc: the story's clock (it runs back when the look ends); open: the shutter
    const t = showing ? L.t : this.hold, tc = showing ? L.t : Math.min(this.hold, T_END) * (1 - ease.inOut(L.ret));
    const open = ease.smooth(ramp(t, 0.1, 1.8)) * (showing ? 1 : 1 - ease.smooth(ramp(L.ret, 0.4, 1)));
    if (showing) this.sc.play(L.t);
    const rig = this.rig, V = this.V, M = V.m, o = this.o, S = this.S, u = this.u, fu = this.fu;
    rig.mesh.visible = true; this.ground.visible = open > 0.002; this.air.visible = open > 0.002;
    u.uBW.value.z = open * (1 + 0.025 * Math.sin((L.t + L.r) * 0.7)); u.uTime.value = L.t + L.r;
    fu.uDark.value = 0.78 * ease.smooth(ramp(t, 0, 1.5)) * (showing ? 1 : 1 - ease.smooth(ramp(L.ret, 0.3, 1)));
    this.cam.copy(L.k.G.camera.position).applyMatrix4(this.inv);
    // "Reduce motion and flashing": no quick glints, no flicker, and the music comes in quietly
    const calm = !!(L.k.museum && L.k.museum.calm), voice = L.voice();
    this.pu.uGl.value = calm ? 0.15 : 1; voice.level = calm ? 0.6 * (0.3 + 0.7 * ramp(t, 0.3, 2.2)) : 1; voice.place(L.cx, L.cz, 16);

    // ---- the medal
    const s = this.sAt(tc), R = this.ray;
    let mx = COL_U, my, mz, glint = 0, big = 0, way = 0;
    const out = s > S0 + 0.004;
    rig.show(this.medal, out);
    // the way the light would have to bounce to reach the eye from here: the medal flashes when it faces that way
    const hx0 = -R.D.x, hy0 = -R.D.y, hz0 = -R.D.z;
    if (tc < T_FREE) {
      this.guide(s, o);
      const hang = ease.smooth(ramp(s, ARC + 0.02, ARC + 0.14)), th = tc - T_HANG, sw = th > 0 ? 0.045 * Math.exp(-1.5 * th) * Math.sin(5.2 * th) : 0;
      const yaw = hang * (this.yaw3 + this.turn * (T_FREE - tc));
      mx = COL_U; my = o.y; mz = o.z + sw * hang;
      rig.mat(this.medal, this.place(M, mx, my, mz, yaw, o.p - Math.PI / 2 + sw * 1.4 * hang, 0));
      // (as it hangs and turns its face comes round to the light)
      const vx = this.cam.x - mx, vy = this.cam.y - my, vz = this.cam.z - mz, vl = Math.hypot(vx, vy, vz) || 1, Hx = hx0 + vx / vl, Hz = hz0 + vz / vl, hl = Math.hypot(Hx, Hz) || 1;
      glint = hang * Math.pow(Math.abs(Math.sin(yaw) * Hx / hl + Math.cos(yaw) * Hz / hl), calm ? 6 : 16) * (calm ? 0.4 : 0.8);
    } else {
      const tw = Math.min(tc, T_FLAT) - T_FREE, x = tw / DW, be = this.tilt(x), fi = Math.min(NW - 1e-4, x * NW), i0 = Math.floor(fi), ff = fi - i0;
      const phi = this.phi0 + this.PHI[i0] + (this.PHI[i0 + 1] - this.PHI[i0]) * ff, psi = this.PSI[i0] + (this.PSI[i0 + 1] - this.PSI[i0]) * ff;
      const sb = Math.sin(be), cb = Math.cos(be), cp = Math.cos(phi), sp = Math.sin(phi), cs = Math.cos(psi), ss = Math.sin(psi);
      // (its lowest point is on the floor: an oval's reach downwards, whichever way it has turned)
      const reach = Math.hypot(MRX * ss, MRY * cs);
      way = Math.min(DRAG, this.DIST[i0] + (this.DIST[i0 + 1] - this.DIST[i0]) * ff); mx = this.PX[i0] + (this.PX[i0 + 1] - this.PX[i0]) * ff; mz = this.PZ[i0] + (this.PZ[i0 + 1] - this.PZ[i0]) * ff; my = reach * sb + MTH * 0.5 * cb + 0.06 * Math.sin(Math.PI * ramp(tw, 0, 0.3));
      // its face (n), across it (X0) and up it (Y0); then turned in its own plane by psi
      V.z.set(sb * cp, cb, sb * sp); V.x.set(sp, 0, -cp); V.y.set(-cb * cp, sb, -cb * sp);
      const Xx = cs * V.x.x + ss * V.y.x, Xy = cs * V.x.y + ss * V.y.y, Xz = cs * V.x.z + ss * V.y.z, Yx = -ss * V.x.x + cs * V.y.x, Yy = -ss * V.x.y + cs * V.y.y, Yz = -ss * V.x.z + cs * V.y.z;
      V.l.set(Xx, Yx, V.z.x, mx, Xy, Yy, V.z.y, my, Xz, Yz, V.z.z, mz, 0, 0, 0, 1);
      rig.mat(this.medal, M.multiplyMatrices(this.B, V.l));
      const vx = this.cam.x - mx, vy = this.cam.y - my, vz = this.cam.z - mz, vl = Math.hypot(vx, vy, vz) || 1, Hx = hx0 + vx / vl, Hy = hy0 + vy / vl, Hz = hz0 + vz / vl, hl = Math.hypot(Hx, Hy, Hz) || 1;
      const nat = Math.pow(Math.max(0, (V.z.x * Hx + V.z.y * Hy + V.z.z * Hz) / hl), 22);
      const once = Math.pow(Math.max(0, Math.cos(phi - Math.atan2(Hz, Hx))), 10) * Math.sin(Math.PI * clamp01(x * 1.02)) * 0.75 * (tc < T_FLAT ? 1 : 0);
      big = calm ? 0.7 * ease.smooth(ramp(tc, T_FLAT + 0.1, T_FLAT + 1.1)) * (1 - ease.smooth(ramp(tc, T_FLAT + 1.3, T_FLAT + 3)))
        : ramp(tc, T_FLAT + 0.04, T_FLAT + 0.16) * (1 - ease.smooth(ramp(tc, T_FLAT + 0.35, T_FLAT + 1.7)));
      glint = calm ? big : Math.max(Math.min(1, nat * 1.3), once, big);
      // while you stay, it finds the light again now and then
      if (tc > T_FLAT + 3.2) { const g = ((t - T_FLAT - 3.2) % 5.5) / 1.4; if (g < 1) glint = Math.max(glint, 0.55 * Math.sin(Math.PI * g) ** 2); }
    }
    const mk = this.beam(mx, my, mz, open);
    this.star(0, mx, my + (tc < T_FREE ? 0 : 0.02), mz, 0.22 + 0.3 * glint + 0.16 * big, out ? glint * (0.3 + 0.7 * mk) * Math.max(open, 0.3) : 0);

    // ---- the chain
    const rel = ramp(tc, T_FREE, T_FREE + 0.12);
    let landed = 0, pour = null;
    for (const e of this.els) {
      const q = s - e.a;
      if (q < -0.1) { rig.show(e.id, false); continue; }
      rig.show(e.id, true);
      this.guide(q, o);
      const hang = ease.smooth(ramp(q, ARC, ARC + 0.1));
      let x = COL_U + 0.011 * Math.sin(8 * q - 17 * tc) * hang * ramp(tc, T_RUN, T_RUN + 0.3), y = o.y, z = o.z, pitch = o.p, yaw = hang * (e.tw + 2.6 * q), roll = e.roll + 1.5 * q;
      if (rel > 0 && q > ARC) {
        // where it lies, on the track (the turns of the coil that come last lie on the first)
        const tau = way - e.a; this.track(tau, S);
        const sx = S.x, sz = S.z, sy = e.sy + 0.034 * ease.smooth(ramp(-tau, 1.0, 1.5));
        if (o.y <= sy) {
          const since = tc - e.land; landed++;
          x = sx; z = sz; y = sy + (since > 0 && since < 0.5 ? 0.028 * Math.exp(-7 * since) * Math.abs(Math.sin(17 * since)) : 0); pitch = 0; yaw = S.yaw; roll = e.roll;
          if (since >= 0 && since < 0.07) pour = e;
        } else {
          const w = ease.smooth(1 - (o.y - sy) / FLARE) * rel;
          x = lerp(x, sx, w); z = lerp(z, sz, w); pitch = Math.PI / 2 * (1 - w * w); yaw += Math.atan2(Math.sin(S.yaw - yaw), Math.cos(S.yaw - yaw)) * w;
        }
      }
      e.x = x; e.y = y; e.z = z;
      rig.mat(e.id, this.place(M, x, y, z, yaw, pitch, roll));
    }
    // a glint where the running chain comes into the shaft; then where it pours onto the floor; and, while you stay, one
    // that runs round the coil
    const fl = calm ? 0.4 : 0.5 + 0.5 * Math.sin(tc * 97) * Math.sin(tc * 61);
    if (tc > T_RUN && tc < this.lastLand && s > ARC + this.HE - ARC_R - this.enter && (!pour || calm)) this.star(1, COL_U, this.enter - 0.05, COL_OUT, 0.2 + 0.12 * fl, 0.55 * fl * open * (1 - ramp(tc, T_FREE, this.lastLand)));
    else if (pour && !calm) this.star(1, pour.x, pour.y + 0.02, pour.z, 0.16 + 0.1 * fl, 0.6 * open);
    else {
      const g = showing && t > T_FLAT + 4 ? ((t - T_FLAT - 4) % 4.4) / 1.5 : 2, n = this.els.length;
      if (g < 1) { const f = (1 - g) * (n - 1), e0 = this.els[Math.floor(f)]; this.star(1, e0.x, e0.y + 0.02, e0.z, 0.15, 0.5 * Math.sin(Math.PI * g) * (calm ? 0.6 : 0.5 + 0.5 * Math.sin(f * 3.1)) * open); }
      else this.star(1, 0, -5, 0, 0.1, 0);
    }
    fu.uSh.value[0].set(this.coil.u, this.coil.out, 0.36, 0.36); fu.uShK.value[0] = 0.85 * landed / this.els.length;
    fu.uSh.value[1].set(mx, mz, 0.22, 0.22); fu.uShK.value[1] = tc > T_RUN ? 0.9 * clamp01(1 - (my - 0.16) / 0.5) : 0;

    // ---- the plume
    this.plume(L, tc, t, showing);
    fu.uSh.value[2].set(this.fx, this.fz, 0.42, 0.34); fu.uShK.value[2] = 0.7 * clamp01(1 - this.fy / 1.1) * (tc > PLUME[0][0] ? 1 : 0);
    this.star(2, 0, -5, 0, 0.1, 0);

    this.air.instanceMatrix.needsUpdate = true; this.air.geometry.attributes.aK.needsUpdate = true;
    if (!showing && L.ret >= 1) this.hide();
  },

  // The plume at story-time tc: slipping out from behind the frame's left side flat to the wall, then down in long
  // rocking swings as a feather falls (slipping sideways, stalling at each turn, banking into the next), to lie on the
  // floor. Its three lengths bend with the swing.
  plume(L, tc, t, showing) {
    const rig = this.rig, V = this.V, Wp = PLUME, n = Wp.length - 1;
    if (tc <= Wp[0][0]) { for (const id of this.pl) rig.show(id, false); this.fx = 0; this.fy = 9; this.fz = 0; return; }
    for (const id of this.pl) rig.show(id, true);
    let k = 0; while (k < n - 1 && tc >= Wp[k + 1][0]) k++;
    const a = Wp[k], b = Wp[k + 1], x = clamp01((tc - a[0]) / (b[0] - a[0])), e = (1 - Math.cos(Math.PI * x)) / 2, dir = Math.sign(b[1] - a[1]) || 1;
    let cx = lerp(a[1], b[1], e), cz = lerp(a[3], b[3], e), cy = a[2] + (b[2] - a[2]) * (k < 2 ? e : x - 0.11 * Math.sin(TAU * x));
    const fall = 0.9 + 0.25 * (tc - Wp[0][0]);                                   // it turns slowly as it comes down
    let yaw = fall, roll = -dir * 0.62 * Math.sin(Math.PI * x), pitch = -0.1 + 0.16 * Math.sin(TAU * x), sc = 1, thin = 1;
    let b1 = 0.2 + 0.15 * Math.sin(Math.PI * (k + x) - 0.7), b2 = 0.7 + 0.22 * Math.sin(Math.PI * (k + x) - 1.3);
    if (k === 0) { yaw = -Math.PI / 2; roll = -Math.PI / 2; pitch = 0; thin = 0.15; sc = 0.22 + 0.78 * ease.smooth(x); b1 = b2 = 0; }      // sliding out from behind the frame, flat to the wall
    else if (k === 1) { const g = ease.inOut(x); yaw = lerp(-Math.PI / 2, fall, g); roll = lerp(-Math.PI / 2, roll, g); pitch *= g; thin = 0.15 + 0.85 * g; b1 *= g; b2 *= g; }      // peeling off it
    if (k === n - 1) {                                                            // the last glide in to the floor
      const g = ease.smooth(ramp(x, 0.55, 1)); roll *= 1 - g; pitch = lerp(pitch, -0.22, g); b1 = lerp(b1, 0.14, g); b2 = lerp(b2, 0.42, g);
      if (tc >= b[0]) { const since = tc - b[0], br = showing ? 0.018 * Math.sin(t * 1.3) : 0; roll = 0.1 * Math.exp(-3 * since) * Math.sin(9 * since); b1 += br; b2 += br * 1.6 + 0.06 * Math.exp(-4 * since) * Math.cos(11 * since); }
    }
    this.fx = cx; this.fy = cy; this.fz = cz;
    // (the path is its middle's: the quill's end lies a third of a metre back along it)
    V.e.set(pitch, yaw, roll, 'YXZ'); V.q.setFromEuler(V.e); V.v.set(0, 0, -PH * sc).applyQuaternion(V.q);
    this.place(V.a, cx + V.v.x, cy + V.v.y, cz + V.v.z, yaw, pitch, roll, sc, sc * thin, sc);
    this.bones.child(V.b, V.a, 0, 0, PL[0], 0, b1, 0); this.bones.child(V.c, V.b, 0, 0, PL[1], 0, b2, 0);
    rig.mat(this.pl[0], V.a); rig.mat(this.pl[1], V.b); rig.mat(this.pl[2], V.c);
  },
});
