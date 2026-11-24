// Thomas Cole, Distant View of Niagara Falls (1830), Gallery 161. The word: spray.
//
// A small panel of a very large place. The falls are far off across a pale basin: the long white line of the
// Horseshoe, a wooded island, the narrower American fall to the left of it, and woods in full October colour down both
// banks. Over the left of it stands a slate storm; on the right the cloud has broken and is lit gold and rose. And at
// the left edge, where the storm is darkest, the one thing in the picture that is going anywhere: a white column of
// spray climbing out of the gorge into the cloud. Six years later, in his "Essay on American Scenery", Cole wrote that
// Niagara's beauty is "in the varied hues of the water, in the spray that ascends the sky, and in that unrivalled bow
// which forms a complete cincture round the unresting floods", and that "there is one season when the American forest
// surpasses all the world in gorgeousness - that is the autumnal". The museum says he saw the falls in May and painted
// them in autumn. The water, the spray, the woods and the sky are in the picture; the bow is only in the essay.
//
// So what comes out is the place, small and far, as he has it. Look at it and a far-off roar begins, muffled. A table
// of rock in level beds rises out of the floor at the foot of the wall, dry, with a wooded bank either side and an
// island on its edge, the woods coming up with the ground and dull under the weather; and his storm builds on the
// wall behind it, a slate cloud standing up the left side of the frame and coming down to the horizon on the right,
// as it lies across his sky. Then the river: it slides out from under the far shore over the dry rock, pale,
// quickening, a white front on it and one red leaf riding the front. It reaches the brink and for a moment it stands
// there, a green lip swelling along the whole curve of the Horseshoe, the leaf held on it, the roar hushed. Then it
// goes over, the deep middle first and the two ends after it, slowly, as a great height falls when it is seen from
// far away; and where it lands the sound opens, the basin goes white, and the spray comes up. It boils low in the
// bowl of the Horseshoe; and on the left, from behind the woods of the bank, where it is in the picture, it climbs:
// a white column going up the wall in front of the storm, beside the frame and as high as its top. Last, the light
// that is breaking on the right of his sky comes across. The wall low on the right goes gold; the banks and the
// island turn, one after another, to scarlet, orange and amber; the water goes from slate to cream; the storm's near
// edge goes rose; and in the spray over the basin the bow stands up from its right foot. While you keep looking the
// river goes on going over, a leaf comes down it now and then, and a cloud crosses and takes the bow with it for a
// while. When you stop, the river runs out from the far shore, the last of it goes over, the spray lifts off and
// thins, the basin drains, the cloud sinks, and the woods and the rock go back into the floor.
//
// The bow is the essay's, not the picture's, and the line the game says about it tells the player so. It is drawn as
// a rainbow is seen: not a thing standing in the room but a ring about the point opposite the sun. It turns to face
// whoever looks at it, it is there only for someone standing in front of the picture (the sun at their back) and not
// from along the wall, and it is faint, wide, and gone before its left end.
//
// Two shows along this wall have falling water. The Cotopaxi's (src/life/76571-view-of-cotopaxi.js, 7.6 m to the
// right) is a thin veil that pours out from under its frame, down to a still gold lake with the room mirrored in it,
// and its smoke trails along the wall above the frames. This one never touches its frame and has no lake: the water
// comes out of the distance at knee height, falls a hand's length as a curtain a metre and a half round, and what it
// makes is spray. Its neighbours are Mrs. Beatty's strawberry bed (src/life/150054-mrs-beatty-and-susan.js, 1.67 m to
// the right, which can reach under this picture's right side; neither show stays out after its look, and going home
// this one's right bank goes down first) and, 1.55 m to the left, a small Chase with no show yet. The ground keeps
// within 1.3 m of the middle of its own picture, and nothing that stands on the floor is higher than 0.65 m. His
// cloud is painted flat on the wall, behind the plane of every canvas (the frame hangs in front of it, as the picture
// hangs in front of its own sky); it stops short of the Chase's frame. The column of spray goes up the bare wall
// between this frame and the Chase's, a hand's breadth off the wall, and from the look camera it is in front of
// neither (the guard cuts nothing there); from cameras close along the wall the kit's guard thins it away before it
// reaches a canvas. Nothing is solid to the toy and nothing stays out after the look.
// Three draw calls: the rock, the banks and the island (one mesh; its beds, and the storm and then the sun on it,
// are worked out in its shader); the water and the sky (the wall, the river on the rock, the two curtains, the basin
// and the shade the land throws on the floor: one mesh, one shader; the cloud is painted once, in a texture); and
// every soft thing (each tree's crown, spray, the column, the leaves and the bow) as cards in one instanced mesh.
// The sound is the falls and nothing else: three bands of noise, the low one heard first and from far off. No tune.
// With "Reduce motion and flashing": the roar comes up slowly and is quieter, the water's streaks run at about half
// speed, the first water lands without its burst of spray, the light takes half as long again to cross, and the
// woods rise without springing; nothing flashes at any setting.
//
// What it leaves out, and why: the two small figures on the rock in front are not built, in any form, and nothing
// here stands for them. They are Native American people as a white painter imagined them in 1830, at a place that
// was by then, the museum says, full of factories, overlooks and hotels he left out; the museum's own words are that
// their "diminished presence in scale and number reinforces the false idea of the 'vanishing Indian'", on lands it
// names as Attiwonderonk, Haudenosaunee and Wenrohronon. So the rock they stand on is not built either (an empty
// ledge would be the same idea again), the toy is not put in their place, and there is no canoe, feather, drum, flute
// or "Indian" scale: no music at all. Nor are the hotels put back as a joke. The show is the water, the spray, the
// woods, the sky and the sound.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture, rng } from '../paintlife.js';
import { strokes } from './brush.js';
import { score, hump } from './stagecraft.js';

const TAU = Math.PI * 2, sm = ease.smooth;
// ---- the place, in the stage's own metres: u along the wall from the picture's middle, o out from it, h up
const H = 0.34;                                 // the upper river's level over the floor
const CAP = 0.016;                              // the hard cap of the cliff stands out this far over the soft rock under it
const THROW = 0.075;                            // how far out from the lip the sheet lands
const FALL = 0.58;                              // seconds the water takes to fall (slowed: a great height, seen from far off)
const U0 = -0.86, U1 = 0.80;                    // the brink, end to end
const IS0 = -0.47, IS1 = -0.21;                 // the island on it: the American fall to its left, the Horseshoe to its right
const HS = { u: 0.32, w: 0.5, o: 0.27, d: 0.36, p: 2.2 };      // the Horseshoe: its deepest point, and how it curves
// How far out from the picture's plane the brink is at u. (The same, word for word, in the water's shader.)
function brink(u) {
  if (u < IS0) return 0.50 + 0.10 * (u - U0) / (IS0 - U0) + 0.012 * Math.sin((u - U0) * 23);
  if (u < IS1) { const q = (u - IS0) / (IS1 - IS0); return lerp(0.605, 0.68, q) + 0.07 * Math.sin(Math.PI * q); }
  return HS.o + HS.d * Math.pow(Math.abs((u - HS.u) / HS.w), HS.p);
}
const F = n => (Number.isInteger(n) ? n + '.0' : String(n));
const BRINK_GLSL = `float brinkO(float u) {
  if (u < ${F(IS0)}) return 0.50 + 0.10 * (u - (${F(U0)})) / ${F(IS0 - U0)} + 0.012 * sin((u - (${F(U0)})) * 23.0);
  if (u < ${F(IS1)}) { float q = (u - (${F(IS0)})) / ${F(IS1 - IS0)}; return mix(0.605, 0.68, q) + 0.07 * sin(3.14159265 * q); }
  return ${F(HS.o)} + ${F(HS.d)} * pow(abs((u - ${F(HS.u)}) / ${F(HS.w)}), ${F(HS.p)});
}`;
// the two wooded banks: how high the ground stands at (u, o)
// (each is steepest on the side of the water, and comes down towards you to a low round nose)
const BL = { u: -1.03, in: 0.07, w: 0.24, top: H + 0.1, low: 0.13, o0: 0.4, o1: 1.0 }, BR = { u: 1.03, in: -0.09, w: 0.25, top: H + 0.13, low: 0.14, o0: 0.5, o1: 1.08 };
const bankMid = (B, o) => B.u + B.in * sm(ramp(o, B.o0, B.o1)) + 0.02 * Math.sin(o * 9 + B.u);
const bankTop = (B, o) => lerp(B.top, B.low, sm(ramp(o, B.o0, B.o1 - 0.1))) * Math.pow(Math.max(0, 1 - Math.pow(Math.max(0, (o - B.o1 + 0.3) / 0.3), 2.6)), 0.5);
const bankAcross = xi => (xi > 0.15 ? Math.pow(Math.max(0, 1 - Math.pow((xi - 0.15) / 0.85, 3.4)), 0.75) : Math.pow(Math.max(0, 1 - Math.pow((0.15 - xi) / 1.15, 2.6)), 0.8));      // xi: -1 its outer edge, +1 the water's
const bankWide = (B, o) => B.w * Math.sqrt(Math.max(0.04, 1 - Math.pow(Math.max(0, (o - B.o1 + 0.42) / 0.42), 2)));      // (its nose is round in plan too)
const bank = (B, u, o) => { const x = (u - bankMid(B, o)) / bankWide(B, o); if (Math.abs(x) >= 1 || o >= B.o1) return 0; return bankTop(B, o) * bankAcross(B.u < 0 ? x : -x) * (1 + 0.05 * Math.sin(o * 19 + u * 7)); };
const bankL = (u, o) => bank(BL, u, o), bankR = (u, o) => bank(BR, u, o);
const ISLE = { u: -0.34, o: 0.44, a: 0.125, b: 0.26, up: 0.05 };      // the island's mound on the table
const isle = (u, o) => { const x = (u - ISLE.u) / ISLE.a, z = (o - ISLE.o) / ISLE.b, r = x * x + z * z; return r >= 1 ? 0 : ISLE.up * Math.sqrt(1 - r); };
// ---- the hour
const T_WOOD = 0.05, T_RIVER = 1.9, T_LIP = 3.2, T_PLUNGE = 3.55, T_HIT = T_PLUNGE + FALL, T_SUN = 5.4, T_BOW = 6.5;
const D_AM = 0.42;                              // the American fall goes over this much after the Horseshoe's middle
const RET = 2.6;
const PLUME = { u: -0.84, o: 0.1, h: 0.36, life: 5.6 };      // the column: up from behind the woods of the left bank, as it stands in the picture
const SKY = { u0: -1.4, v0: 0.2, w: 2.7, h: 2.1 };      // the piece of wall his sky is painted on: from u0, from v0 over the floor, this wide and high
const N_TREE = 230, N_DAB = 10, N_BOIL = 40, N_PLUME = 54, N_SPRAY = 22, N_LEAF = 5, NC = N_TREE + N_DAB + N_BOIL + N_PLUME + N_SPRAY + N_LEAF + 2;
let TOLD = false;

lifeFor(90048, {
  title: /^Distant View of Niagara/,
  word: 'spray',
  stage: { out: 1.15, half: 1.3, cam: { dist: 2.55, height: 1.12, side: 0.1, fov: 58, lookU: -0.1, lookOut: 0.3, lookH: 0.95, floorOut: 1.12 } },
  wake: 2, ret: RET,

  build(L) {
    const P = L.pal, col = (h, a = 0.25) => P.near(h, a);
    this.R = rng(90048);
    this.railH = L.rail - L.y;
    this.v = new THREE.Vector3();
    this.buildLand(L, col);
    this.buildWater(L, col);
    this.buildCards(L, col);
    this.bands = [this.makeScore(L, false), this.makeScore(L, true)]; this.band = this.bands[0]; this.bandCalm = false;
    const V = L.voice();
    this.far = V.loop({ lp: 300, hp: 50 }); this.body = V.loop({ lp: 1500, hp: 170 }); this.hiss = V.loop({ lp: 7000, hp: 2300 });
    this.wt = 0;
    this.hideAll();
  },

  // A run of points along the brink from ua to ub, evenly spaced: each { u, o, nu, no (the way the water leaves it), w (metres along) }.
  arc(ua, ub, n) {
    const M = 240, pu = [], po = [], len = [0];
    for (let i = 0; i <= M; i++) { const u = lerp(ua, ub, i / M); pu.push(u); po.push(brink(u)); if (i) len.push(len[i - 1] + Math.hypot(pu[i] - pu[i - 1], po[i] - po[i - 1])); }
    const out = []; let k = 0;
    for (let i = 0; i <= n; i++) {
      const w = len[M] * i / n; while (k < M - 1 && len[k + 1] < w) k++;
      const q = clamp01((w - len[k]) / Math.max(1e-6, len[k + 1] - len[k])), u = lerp(pu[k], pu[k + 1], q), o = lerp(po[k], po[k + 1], q);
      const a = Math.max(0, k - 2), b = Math.min(M, k + 3), tu = pu[b] - pu[a], to = po[b] - po[a], tl = Math.hypot(tu, to);
      out.push({ u, o, nu: -to / tl, no: tu / tl, w, len: len[M] });
    }
    return out;
  },

  // ---------------------------------------------------------------- the rock, the banks, the island: one mesh
  buildLand(L, col) {
    const R = this.R, pos = [], nor = [], cl = [];
    const X = (u, o) => L.cx + L.tx * u + L.nx * o, Z = (u, o) => L.cz + L.tz * u + L.nz * o;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), g = new THREE.Vector3();
    // a smooth sheet nu by nv: f(i / nu, j / nv) -> [u, o, h, colour]; up: which way its outside faces, roughly
    const surf = (nu, nv, f, up) => {
      const Pp = [], C = [];
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const q = f(i / nu, j / nv); Pp.push(new THREE.Vector3(X(q[0], q[1]), q[2], Z(q[0], q[1]))); C.push(q[3]); }
      const at = (i, j) => Pp[Math.max(0, Math.min(nv, j)) * (nu + 1) + Math.max(0, Math.min(nu, i))];
      const N = Pp.map((_, k) => { const i = k % (nu + 1), j = (k / (nu + 1)) | 0; a.copy(at(i + 1, j)).sub(at(i - 1, j)); b.copy(at(i, j + 1)).sub(at(i, j - 1)); const n = new THREE.Vector3().crossVectors(a, b); if (n.lengthSq() < 1e-12) n.set(0, 1, 0); n.normalize(); return n; });
      let dot = 0; for (const n of N) dot += n.dot(up); if (dot < 0) for (const n of N) n.negate();
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const k0 = j * (nu + 1) + i, k1 = k0 + 1, k2 = k0 + nu + 1, k3 = k2 + 1;
        for (const tri of [[k0, k2, k1], [k1, k2, k3]]) {
          g.crossVectors(a.copy(Pp[tri[1]]).sub(Pp[tri[0]]), b.copy(Pp[tri[2]]).sub(Pp[tri[0]]));
          if (g.dot(N[tri[0]]) < 0) { const s = tri[1]; tri[1] = tri[2]; tri[2] = s; }
          for (const k of tri) { pos.push(Pp[k].x, Pp[k].y, Pp[k].z); nor.push(N[k].x, N[k].y, N[k].z); cl.push(C[k].r, C[k].g, C[k].b); }
        }
      }
    };
    const out3 = new THREE.Vector3(L.nx, 0, L.nz), up3 = new THREE.Vector3(0, 1, 0);
    const bed = col('#665a4c', 0.25), bed2 = col('#7a6c5a', 0.25), shale = col('#54463c', 0.25), shale2 = col('#7a6a58', 0.25), cap = col('#a39480', 0.25), talus = col('#463c36', 0.25);
    const earth = col('#3e2c18', 0.2), earth2 = col('#30331a', 0.2), earth3 = col('#472210', 0.2), c = new THREE.Color();      // (the woods' own shade, seen between the crowns: dark, warm, never black)
    const mixc = (p, q, k) => c.copy(p).lerp(q, clamp01(k)).clone();
    const W = L.wall - 0.004;
    // the table's top: the dry bed the river will come over
    surf(40, 5, (i, j) => { const u = lerp(U0 - 0.03, U1 + 0.03, i), o = lerp(-W, brink(u) + CAP, j); return [u, o, H, mixc(bed, bed2, 0.5 + 0.5 * Math.sin(u * 31 + o * 17) * Math.sin(o * 43))]; }, up3);
    // the cliff under the brink: a hard pale cap over dark soft rock, broken stone heaped at its foot
    const rows = [[0, 0.06], [0.1, 0.04], [0.2, 0.022], [0.3, 0.008], [0.45, 0.002], [0.6, 0.006], [0.72, 0.001], [0.8, 0.003], [0.83, CAP], [0.92, CAP], [1, CAP]];
    const path = this.arc(U0 - 0.03, U1 + 0.03, 66);
    surf(66, rows.length - 1, (i, j) => {
      const p = path[Math.round(i * 66)], r = rows[Math.round(j * (rows.length - 1))], hh = r[0] * H;
      const band = 0.5 + 0.5 * Math.sin(hh * 150 + Math.sin(p.w * 9) * 1.5);
      const cc = r[0] > 0.82 ? mixc(cap, shale2, 0.35 * band) : r[0] < 0.25 ? mixc(talus, shale, band * 0.6) : mixc(shale, shale2, band * 0.8);
      return [p.u + p.nu * r[1], p.o + p.no * r[1], hh, cc];
    }, out3);
    // the two banks and the island: smooth ground for the woods to stand on, itself painted as woods seen from far
    // off (the shader stipples it, dark, in the woods' own colours: aFol marks which ground that is)
    const folFrom = pos.length / 3;
    for (const B of [BL, BR]) surf(14, 26, (i, j) => {
      const o = lerp(-W, B.o1 - 0.0005, Math.pow(j, 0.8)), u = bankMid(B, o) + bankWide(B, o) * (i * 2 - 1) * 0.9995, k = 0.5 + 0.5 * Math.sin(u * 40 + o * 23) * Math.sin(o * 31 + u * 11);
      return [u, o, bank(B, u, o), mixc(k > 0.5 ? earth : earth3, earth2, Math.abs(k - 0.5) * 2)];
    }, up3);
    // the island's mound
    surf(8, 12, (i, j) => { const th = i * TAU, rr = Math.sin(j * Math.PI / 2), u = ISLE.u + ISLE.a * rr * Math.cos(th), o = ISLE.o + ISLE.b * rr * Math.sin(th); return [u, o, H - 0.004 + ISLE.up * Math.cos(j * Math.PI / 2) + 0.004, mixc(earth, earth2, 0.6)]; }, up3);
    const folTo = pos.length / 3;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
    // broken stone at the foot of the cliff: under the American fall (it breaks on its own rocks), under the island, by the banks
    this.STONES = [[-0.72, 0.64, 0.034], [-0.58, 0.67, 0.028], [-0.42, 0.74, 0.04], [-0.3, 0.79, 0.034], [-0.22, 0.75, 0.028]];
    const parts = [geo];
    this.STONES.forEach(([u, o, r], i) => {
      const s = shape.ball(1, 0xffffff, 2), p = s.attributes.position, n = s.attributes.normal, k = s.attributes.color;
      for (let q = 0; q < p.count; q++) {
        const x = p.getX(q), y = p.getY(q), z = p.getZ(q), w = 1 + 0.12 * Math.sin(x * 3 + z * 2.5 + i * 1.7) + 0.06 * Math.sin(y * 5 + x * 4 + i);
        p.setXYZ(q, X(u, o) + (L.tx * x + L.nx * z) * r * 1.25 * w, Math.max(-0.25, y) * r * 0.85 * w + 0.2 * r, Z(u, o) + (L.tz * x + L.nz * z) * r * 1.25 * w);
        const nw = a.set(L.tx * x + L.nx * z, y * 1.3, L.tz * x + L.nz * z).normalize(); n.setXYZ(q, nw.x, nw.y, nw.z);
        c.copy(talus).lerp(shale2, clamp01(0.25 + 0.7 * y)); k.setXYZ(q, c.r, c.g, c.b);
      }
      parts.push(s);
    });
    const all = shape.merge(parts), fol = new Float32Array(all.attributes.position.count);
    fol.fill(1, folFrom, folTo); all.setAttribute('aFol', new THREE.BufferAttribute(fol, 1));
    const lu = this.lu = { uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uSun: { value: new THREE.Vector2(0, 2) } };
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, emissive: 0xffffff, emissiveIntensity: 1, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, lu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aFol; varying float vFol;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vFol = aFol;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uO; uniform vec4 uAx; uniform vec2 uSun; varying float vFol;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  { vec2 lq = lifeP.xz - uO.xz; float su = dot(lq, uAx.xy), so = dot(lq, uAx.zw), lit = uSun.x * smoothstep(uSun.y - 0.3, uSun.y + 0.3, su);
    float hy = (lifeP.y - uO.y) + 0.006 * sin(su * 9.0 + so * 5.0);
    vec3 base;
    if (vFol > 0.5) {
      // (the woods' own shade, seen between the crowns: dark and warm, and no pattern in it)
      base = vColor.rgb;
    } else {
      // (the rock lies in level beds: on a steep face they show, some thick, some thin, a little out of true)
      float steep = 1.0 - abs(dot(normalize(vNormal), normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)));
      float beds = smoothstep(-0.3, 0.3, sin(hy * 96.0) + 0.6 * sin(hy * 37.0 + 1.0)) * 0.6 + 0.4 * smoothstep(0.0, 0.4, sin(hy * 230.0 + su * 3.0));
      base = vColor.rgb * mix(1.0, 0.62 + 0.62 * beds, smoothstep(0.45, 0.85, steep));
    }
    // (his storm light: cool and low; then the sun from the right: warm)
    totalEmissiveRadiance = base * mix(vec3(0.4, 0.43, 0.52), vec3(0.86, 0.76, 0.58), lit);
    diffuseColor.rgb = base * mix(vec3(0.5, 0.52, 0.62), vec3(0.9, 0.86, 0.76), lit); }`);
    };
    m.customProgramCacheKey = () => 'niagara-land';
    this.land = new THREE.Mesh(all, m); this.land.position.y = L.y; this.land.scale.y = 0.001;
    L.add(this.land);
  },

  // ---------------------------------------------------------------- the water and the sky: one mesh, one shader
  buildWater(L, col) {
    const R = this.R, pos = [], kind = [], aa = [];
    const X = (u, o) => L.cx + L.tx * u + L.nx * o, Z = (u, o) => L.cz + L.tz * u + L.nz * o, W = L.wall - 0.006;
    const push = (u, o, h, k, a0 = 0, a1 = 0, a2 = 0, a3 = 0) => { pos.push(X(u, o), L.y + h, Z(u, o)); kind.push(k); aa.push(a0, a1, a2, a3); };
    const quad = (p, k) => { for (const i of [0, 1, 2, 0, 2, 3]) push(p[i][0], p[i][1], p[i][2], k); };
    // 0: the floor in front of the cliff (the basin)
    quad([[-1.3, -W, 0.016], [1.3, -W, 0.016], [1.3, 1.5, 0.016], [-1.3, 1.5, 0.016]], 0);
    // 4: the wall under the frame (his sky, and the far shore)
    quad([[SKY.u0, -W, SKY.v0], [SKY.u0 + SKY.w, -W, SKY.v0], [SKY.u0 + SKY.w, -W, SKY.v0 + SKY.h], [SKY.u0, -W, SKY.v0 + SKY.h]], 4);
    // 1: the river, on the table
    { const NU = 44, NV = 5, at = (i, j) => { const u = lerp(U0 - 0.02, U1 + 0.02, i / NU); return [u, lerp(-W, brink(u) + CAP + 0.004, j / NV), H + 0.006]; };
      for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const p = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]; quad(p, 1); } }
    // 2, 3: the two curtains (the Horseshoe, the American fall): down s, along w; when its water comes; its frayed ends
    const curtain = (ua, ub, n, k, delay) => {
      const NS = 10, A = this.arc(ua, ub, n);
      const at = (p, s) => { const x = CAP + 0.004 + THROW * s; return [p.u + p.nu * x, p.o + p.no * x, Math.max(0.012, H + 0.006 - H * s * s)]; };
      for (let i = 0; i < n; i++) for (let j = 0; j < NS; j++) {
        const s0 = j / NS, s1 = (j + 1) / NS;
        for (const [q, s] of [[A[i], s0], [A[i + 1], s0], [A[i + 1], s1], [A[i], s0], [A[i + 1], s1], [A[i], s1]]) { const p = at(q, s); push(p[0], p[1], p[2], k, s, q.w, delay(q), clamp01(Math.min(q.w, q.len - q.w) / 0.05)); }
      }
      return A;
    };
    this.arcH = curtain(IS1 + 0.005, U1, 36, 2, q => 0.36 * Math.pow(Math.min(1.1, Math.abs((q.u - HS.u) / HS.w)), 1.5));
    this.arcA = curtain(U0, IS0 - 0.005, 12, 3, q => D_AM + 0.16 * (1 - (q.u - U0) / (IS0 - U0)));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1)); g.setAttribute('aA', new THREE.Float32BufferAttribute(aa, 4));
    // falling water: long streaks, tiling
    const streak = canvasTexture(64, 256, (c, w, h) => {
      c.fillStyle = 'rgb(64,64,64)'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 110; i++) {
        const x = R() * w, lw = 1 + R() * 3.5, v = 110 + Math.floor(R() * 145), y0 = R() * h, len = 30 + R() * 190;
        c.strokeStyle = `rgba(${v},${v},${v},${0.3 + 0.5 * R()})`; c.lineWidth = lw; c.lineCap = 'round';
        for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { c.beginPath(); c.moveTo(x + ox, y0 + oy); c.lineTo(x + ox + (R() - 0.5) * 3, y0 + oy + len); c.stroke(); }
      }
    }, false);
    streak.wrapS = streak.wrapT = THREE.RepeatWrapping;
    // the basin, in his level strokes
    const level = strokes({
      size: 256, seed: 90048, n: 2200, len: [10, 30], width: [2, 5], bend: 0.12, lift: 0.22, base: col('#8f9482', 0.3).getStyle(),
      colors: [['#a9ad98', 3], ['#c9c8b2', 2], ['#7c836f', 3], ['#5f6654', 2], ['#e2dfcd', 1], ['#6f6a52', 1]].map(([c, w]) => [col(c, 0.3).getStyle(), w]),
      angle: (x, y, r) => (r() - 0.5) * 0.3,
    });
    // his cloud: soft masses heaped on each other (red: how far a billow stands out into the light; green: how thick)
    // It is painted once, as the wall will show it (SKY: the piece of wall it covers, in metres). Its shape is many
    // small billows run together, so its edge is a cloud's edge; inside, it is one mass, modelled broadly, with a
    // soft light on the upper right of a billow here and there and its own shade under it. Never a heap of balls.
    // Red: dark to light. Green: the storm (1), or the broken cloud low on the right that the sun will find (0).
    // Alpha: cloud or wall.
    const sky = canvasTexture(512, 512, (c, w, h) => {
      const SX = u => (u - SKY.u0) / SKY.w * w, SY = v => (1 - (v - SKY.v0) / SKY.h) * h, SR = r => r / SKY.w * w, puffs = [];
      // the storm: it stands highest on the left, behind where the column climbs, and comes down to the horizon on
      // the right, as it does across his sky
      const top = u => lerp(2.04, 0.6, sm(ramp(u, -0.66, 0.42))) - 0.3 * Math.pow(Math.max(0, (-0.9 - u) / 0.3), 2) + 0.05 * Math.sin(u * 9);
      // (its body in big billows; then smaller ones, of every size, crowded along its top and its left side: its edge)
      for (let i = 0; i < 200; i++) { const u = lerp(-1.1, 0.34, R()), t = top(u); puffs.push({ u, v: lerp(0.3, t - 0.1, Math.pow(R(), 0.75)), r: 0.11 + 0.08 * R(), ax: 1.15, storm: 1 }); }
      for (let i = 0; i < 130; i++) { const u = lerp(-1.14, 0.42, R()); puffs.push({ u, v: top(u) - 0.12 + 0.16 * R() * R(), r: 0.035 + 0.075 * R() * R(), ax: 1 + 0.3 * R(), storm: 1, edge: 1 }); }
      for (let i = 0; i < 60; i++) { const v = lerp(0.3, top(-1.14), R()); puffs.push({ u: -1.1 - 0.1 * R() * R() + 0.04 * Math.sin(v * 7), v, r: 0.035 + 0.07 * R() * R(), ax: 1 + 0.2 * R(), storm: 1, edge: 1 }); }
      puffs.sort((a, b) => b.v - a.v);
      // its shape (and which part it is)
      c.clearRect(0, 0, w, h);
      for (const p of puffs) { c.fillStyle = `rgb(0,${p.storm ? 255 : 0},0)`; c.beginPath(); c.ellipse(SX(p.u), SY(p.v), SR(p.r) * p.ax, SR(p.r), 0, 0, TAU); c.fill(); }
      const shape = c.getImageData(0, 0, w, h);
      // its light, on a canvas of its own
      const lc = document.createElement('canvas'); lc.width = w; lc.height = h; const g = lc.getContext('2d', { willReadFrequently: true });
      g.fillStyle = 'rgb(96,96,96)'; g.fillRect(0, 0, w, h);
      const soft = (x, y, rx, ry, v, a) => { g.save(); g.translate(x, y); g.scale(rx, ry); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${v},${v},${v},${a})`); gr.addColorStop(0.6, `rgba(${v},${v},${v},${a * 0.5})`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore(); };
      for (let i = 0; i < 46; i++) soft(R() * w, R() * h, 40 + R() * 70, 26 + R() * 40, R() < 0.5 ? 40 : 150, 0.3);      // broad masses, darker and lighter
      for (const p of puffs) {
        if (p.edge) continue;                                                                               // (the small ones are edge, not form)
        const x = SX(p.u), y = SY(p.v), r = SR(p.r);
        soft(x - r * 0.25, y + r * 0.55, r * p.ax * 1.2, r * 0.9, 20, 0.14);                               // its own shade, under it
        if (R() < 0.4) soft(x + r * 0.3 * p.ax, y - r * 0.4, r * p.ax * 1.0, r * 0.75, 255, 0.1 + 0.14 * R());      // a soft light on its shoulder
      }
      const light = g.getImageData(0, 0, w, h).data, d = shape.data;
      for (let i = 0; i < d.length; i += 4) d[i] = light[i];
      c.putImageData(shape, 0, 0);
    }, false);
    const u = this.wu = {
      uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uTime: { value: 0 }, uClock: { value: 0 },
      uFront: { value: new THREE.Vector2(0, -1) },             // the river on the table: how far its front has come, and (going home) its tail
      uFallT: { value: new THREE.Vector2(-9, -1) },            // seconds since the first water went over; since it was shut off (or -1)
      uPool: { value: new THREE.Vector3(0, 0, 0) },            // the basin: how far out it has got; the Horseshoe's and the American fall's water landing in it
      uSun: { value: new THREE.Vector2(0, 2) },                // the light: how much, and where its edge is along the wall
      uLip: { value: 0 }, uSky: { value: 0 }, uShade: { value: 0 }, uRail: { value: this.railH },
      tStreak: { value: streak }, tLevel: { value: level }, tSky: { value: sky },
      cFoam: { value: col('#d6d2c4', 0.1) }, cShade: { value: col('#74827f', 0.12) }, cLip: { value: col('#66957a', 0.1) },
      cRiverFar: { value: col('#7f867c', 0.2) }, cRiverNear: { value: col('#a3ae9c', 0.2) },
      cPoolNear: { value: col('#c6c8b6', 0.2) }, cPoolFar: { value: col('#666c5a', 0.25) },
      cStorm: { value: col('#6c717e', 0.08) }, cStormLo: { value: col('#2e3038', 0.08) }, cRidge: { value: col('#3a4048', 0.12) },
      cGold: { value: col('#f0c98a', 0.15) }, cRose: { value: col('#d79a86', 0.15) },
    };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: true, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aKind; attribute vec4 aA; varying float vKind; varying vec4 vA;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vKind = aKind; vA = aA;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform vec3 uO, uPool; uniform vec4 uAx; uniform vec2 uFront, uFallT, uSun; uniform float uTime, uClock, uLip, uSky, uRail, uShade;
uniform sampler2D tStreak, tLevel, tSky;
uniform vec3 cFoam, cShade, cLip, cRiverFar, cRiverNear, cPoolNear, cPoolFar, cStorm, cStormLo, cRidge, cGold, cRose;
varying float vKind; varying vec4 vA; vec3 fCol; float fA;
${BRINK_GLSL}`)
        .replace('#include <map_fragment>', `#include <map_fragment>
vec2 lq = lifeP.xz - uO.xz; float su = dot(lq, uAx.xy), so = dot(lq, uAx.zw);
float lit = uSun.x * smoothstep(uSun.y - 0.3, uSun.y + 0.3, su);
vec3 light = mix(vec3(0.54, 0.58, 0.68), vec3(0.94, 0.9, 0.8), lit);
if (vKind > 3.5) {
  // the wall: his sky, as a painted cloud with an edge to it. The storm stands up the left side of the frame, where
  // the column climbs, and leans over behind the falls; low on the right it has broken, and that part takes the sun.
  float wv = lifeP.y - uO.y;
  vec2 uv = vec2((su - (${F(SKY.u0)})) / ${F(SKY.w)} + uClock * 0.0006, (wv - ${F(SKY.v0)}) / ${F(SKY.h)});
  // (it builds up from the horizon, as a storm does: the whole of it, growing taller, its own edge on it all the way)
  float gy = 0.048 + (uv.y - 0.048) / (0.3 + 0.7 * uSky);
  vec4 ck = texture2D(tSky, vec2(uv.x, gy));
  float a = ck.a * smoothstep(0.03, 0.4, uSky) * step(0.004, uv.x) * step(uv.x, 0.996) * step(0.004, uv.y) * step(gy, 0.996);
  vec3 dark = mix(cStormLo, cStorm, smoothstep(0.12, 0.8, ck.r));
  // (the storm's billows catch the light on the side it comes from)
  dark = mix(dark, mix(cRose, cGold, 0.45), 0.36 * uSun.x * smoothstep(0.5, 0.85, ck.r) * smoothstep(-1.3, -0.1, su));
  // (the edge of it that faces the break goes rose and gold)
  dark = mix(dark, mix(cRose, cGold, 0.5 + 0.5 * ck.r), 0.5 * uSun.x * smoothstep(-0.25, 0.4, su - (wv - 0.6) * 0.9));
  fCol = dark; fA = a * 0.9;
  // low on the right the cloud has broken: no shape there, only his gold light on the wall
  float brk = exp(-(pow((su - 0.78) / 0.52, 2.0) + pow((wv - 0.72) / 0.36, 2.0))) * uSun.x * 0.55 * (1.0 - step(1.26, wv)) * smoothstep(0.0, 0.5, uSky);
  if (brk > 0.001) { fCol = mix(mix(cGold, cRose, smoothstep(0.5, 1.0, wv)), fCol, fA / (fA + brk * (1.0 - fA))); fA = fA + brk * (1.0 - fA); }
  // (the far shore: a dark ridge along the river, up with the land)
  float ridge = (1.0 - smoothstep(0.0, 0.025, wv - uShade * (0.455 + 0.035 * sin(su * 4.3 + 1.0) + 0.016 * sin(su * 13.0)))) * (1.0 - smoothstep(1.0, 1.22, abs(su + 0.02))) * smoothstep(0.1, 0.2, wv) * smoothstep(0.3, 0.7, uShade);
  fCol = mix(fCol, cRidge * mix(0.85, 1.2, lit), ridge); fA = max(fA, ridge * 0.94);
} else if (vKind > 1.5) {
  // a curtain: glassy and green where it bends over the lip, then white, laced, quicker and quicker
  float am = step(2.5, vKind), s = vA.x, w = vA.y;
  float hd = clamp((uFallT.x - vA.z) / ${F(FALL)}, 0.0, 1.0), tl = uFallT.y < 0.0 ? -1.0 : clamp((uFallT.y - vA.z * 0.6) / ${F(FALL)}, 0.0, 1.3);
  float k = texture2D(tStreak, vec2(w * 2.3 + am * 0.31, s * 0.7 - uTime * 1.25)).r;
  float k2 = texture2D(tStreak, vec2(w * 1.1 + 0.37, s * 0.4 - uTime * 0.85)).r;
  float ss = s + (k - 0.5) * 0.16;
  float on = step(0.0005, hd) * (1.0 - smoothstep(hd - 0.08, hd, ss)) * smoothstep(tl - 0.08, tl, ss);
  float white = smoothstep(0.3, 0.74, k * 0.6 + k2 * 0.4 + am * 0.12 + 0.12 * s);
  vec3 c = mix(cShade, cFoam, white);
  c = mix(c, cLip * (0.8 + 0.4 * k2), (1.0 - smoothstep(0.1, 0.5, s)) * (0.92 - 0.5 * am));
  c = mix(c, cFoam, smoothstep(0.78, 1.0, s) * 0.7);
  // (the first water down is all white)
  c = mix(c, cFoam, smoothstep(hd - 0.2, hd, ss) * (1.0 - step(0.999, hd)) * 0.8);
  fCol = c * light;
  fA = on * vA.w * mix(0.94, 0.7 + 0.3 * k, smoothstep(0.1, 0.45, s));
} else if (vKind > 0.5) {
  // the river on the table: grey, quickening, drawn out in lines towards the brink; rapids; the green lip
  float B = brinkO(su), f = (so + 0.04) / (B + 0.04), xh = abs((su - ${F(HS.u)}) / ${F(HS.w)});
  float k = texture2D(tStreak, vec2(su * 2.6, pow(max(f, 0.0), 0.7) * 0.75 - uTime * 0.42)).r;
  float k2 = texture2D(tStreak, vec2(su * 1.3 + 0.4, pow(max(f, 0.0), 0.7) * 0.5 - uTime * 0.3)).r;
  float ff = f * (1.0 + 0.1 * min(xh, 1.4)) + (k - 0.5) * 0.07;
  float wet = (1.0 - smoothstep(uFront.x - 0.05, uFront.x, ff)) * smoothstep(uFront.y - 0.06, uFront.y, f + (k - 0.5) * 0.05);
  vec3 c = mix(cRiverFar, cRiverNear, smoothstep(0.2, 0.95, f)) * (0.82 + 0.36 * k2);
  c = mix(c, cFoam, smoothstep(0.58, 0.88, k) * smoothstep(0.2, 0.55, f) * (1.0 - smoothstep(0.84, 0.98, f)) * 0.8);
  c = mix(c, cLip, smoothstep(0.8, 1.0, f) * 0.85);
  c += cFoam * uLip * smoothstep(0.86, 1.0, f) * 0.25;
  c = mix(c, cFoam, smoothstep(uFront.x - 0.16, uFront.x - 0.03, ff) * (1.0 - smoothstep(1.02, 1.12, uFront.x)) * 0.85);
  c = mix(cRidge * 1.25, c, smoothstep(-0.02, 0.34, f));
  fCol = c * light;
  fA = wet * 0.96;
} else {
  // the floor: the basin (white where the water lands, then his river's grey-green, in level strokes), and the shade
  // the banks and the cliff throw on the floorboards, so the land sits on the floor
  float B = brinkO(su), d = so - B - ${F(THROW + CAP)};
  float isl = smoothstep(${F(IS0 - 0.03)}, ${F(IS0 + 0.03)}, su) * (1.0 - smoothstep(${F(IS1 - 0.03)}, ${F(IS1 + 0.03)}, su));
  float am = 1.0 - step(${F(IS0)}, su);
  float fall = mix(uPool.y, uPool.z, am) * (1.0 - isl) * smoothstep(${F(U0 - 0.02)}, ${F(U0 + 0.04)}, su) * (1.0 - smoothstep(${F(U1 - 0.05)}, ${F(U1 + 0.02)}, su));
  vec4 sk = texture2D(tLevel, vec2(su, so) / 0.46 + vec2(uClock * 0.004, 0.0));
  float frontLine = 0.96 - 0.2 * pow((su - 0.02) / 0.82, 2.0);
  float lim = mix(B + 0.02, frontLine, uPool.x);
  float edge = 1.0 - smoothstep(lim - 0.2, lim, so + (sk.a - 0.55) * 0.2);
  float side = smoothstep(-0.96, -0.8, su) * (1.0 - smoothstep(0.78, 0.94, su));
  float pool = edge * side * smoothstep(-0.11, -0.07, d) * step(0.002, uPool.x);
  vec3 c = mix(cPoolNear, cPoolFar, smoothstep(0.02, 0.4, d));
  c = mix(c, sk.rgb, 0.45 * smoothstep(0.04, 0.26, d));
  float st2 = texture2D(tStreak, vec2(su * 0.9, d * 1.3 - uTime * 0.11)).r;
  c = mix(c, cFoam, smoothstep(0.55, 0.9, st2) * exp(-max(d, 0.0) / 0.2) * 0.7 * fall);
  c = mix(c, cFoam, clamp(exp(-max(d, 0.0) / 0.06) * 1.1, 0.0, 1.0) * max(fall, 0.2 * uPool.x));
  fCol = c * light;
  fA = pool * 0.95;
  // (shade: a soft dark skirt round the foot of everything that stands up)
  float sl = (1.0 - smoothstep(${F(BL.w - 0.04)}, ${F(BL.w + 0.1)}, abs(su - (${F(BL.u)} + ${F(BL.in)} * smoothstep(${F(BL.o0)}, ${F(BL.o1)}, so))))) * (1.0 - smoothstep(${F(BL.o1 - 0.06)}, ${F(BL.o1 + 0.12)}, so));
  float sr = (1.0 - smoothstep(${F(BR.w - 0.04)}, ${F(BR.w + 0.1)}, abs(su - (${F(BR.u)} + (${F(BR.in)}) * smoothstep(${F(BR.o0)}, ${F(BR.o1)}, so))))) * (1.0 - smoothstep(${F(BR.o1 - 0.06)}, ${F(BR.o1 + 0.12)}, so));
  float sc = (1.0 - smoothstep(0.0, 0.16, d + ${F(THROW)})) * smoothstep(-1.05, -0.9, su) * (1.0 - smoothstep(0.9, 1.05, su));
  float shade = max(max(sl, sr), sc) * 0.42 * uShade;
  fCol = mix(vec3(0.02, 0.02, 0.03), fCol, fA / max(0.001, fA + shade * (1.0 - fA)));
  fA = fA + shade * (1.0 - fA);
}
if (fA < 0.012) discard;`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'niagara-water';
    this.water = new THREE.Mesh(g, m); this.water.renderOrder = 5;
    L.add(this.water);
  },

  // ---------------------------------------------------------------- soft cards: the woods, the rock's dabs, spray, the column, leaves, the bow
  buildCards(L, col) {
    const R = this.R;
    const atlas = canvasTexture(256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const blob = (x, y, r, a, lum = 255) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${lum},${lum},${lum},${a})`); gr.addColorStop(0.6, `rgba(${lum},${lum},${lum},${a * 0.6})`); gr.addColorStop(1, `rgba(${lum},${lum},${lum},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
      // 0 (top left): a billow of spray, lumpy, no disc under it (red: how far each lump stands out)
      g.save(); g.beginPath(); g.rect(0, 0, 128, 128); g.clip();
      blob(64, 68, 36, 0.45, 150);
      for (let i = 0; i < 30; i++) { const a = R() * TAU, rr = Math.sqrt(R()) * 34, y = 66 + Math.sin(a) * rr * 0.85; blob(64 + Math.cos(a) * rr, y, 9 + R() * 15, 0.36, 150 + Math.floor(R() * 105)); }
      g.restore();
      // 1 (top right): mist, wide and soft
      g.save(); g.beginPath(); g.rect(128, 0, 128, 128); g.clip(); blob(192, 64, 58, 0.7); blob(176, 70, 30, 0.3); blob(210, 58, 28, 0.3); g.restore();
      // 2 (bottom left): one loaded dab, a few strokes laid over each other (red: lit to shaded)
      g.save(); g.beginPath(); g.rect(0, 128, 128, 128); g.clip(); g.lineCap = 'round';
      for (let i = 0; i < 14; i++) {
        const y = 192 + (R() - 0.5) * 54, half = 40 * Math.sqrt(1 - Math.pow((y - 192) / 30, 2) * 0.8), x0 = 64 - half * (0.7 + 0.3 * R()), x1 = 64 + half * (0.7 + 0.3 * R());
        const v = Math.floor(110 + 145 * clamp01(0.55 - (y - 192) / 70 + (R() - 0.5) * 0.4));
        g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 7 + R() * 7; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(64, y - 4 + R() * 8, x1, y + (R() - 0.5) * 6); g.stroke();
      }
      g.restore();
      // 3 (bottom right): a tree's crown as he stipples it: small touches heaped in a mound, lit from the upper right
      // (dark first, a solid mass with a ragged edge; then the mid tones; then the small lights, up and to the right)
      g.save(); g.beginPath(); g.rect(128, 128, 128, 128); g.clip();
      // (and not a ball: a crown is several boughs of leaves, each with its own light side and its own shade)
      const boughs = [[0, -8, 25], [-25, 3, 21], [25, 0, 22], [-13, 23, 20], [15, 21, 22], [3, -31, 17], [-30, -18, 13]];
      const dabs = (count, shrink, sz, tone) => {
        for (let i = 0; i < count; i++) {
          const b = boughs[Math.floor(R() * boughs.length)], a = R() * TAU, rr = Math.sqrt(R()) * shrink, dx = Math.cos(a) * rr, dy = Math.sin(a) * rr, x = 192 + b[0] + dx * b[2], y = 196 + b[1] + dy * b[2] * 0.9;
          const v = Math.floor(255 * clamp01(tone(0.62 * (dx - dy) + 0.38 * (b[0] - b[1]) / 34)));      // -1 down on the left, in shade; +1 up on the right, in the light
          g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.ellipse(x, y, sz * (0.7 + 0.6 * R()), sz * (0.45 + 0.4 * R()), R() * Math.PI, 0, TAU); g.fill();
        }
      };
      dabs(210, 0.9, 5.5, s => 0.19 + 0.08 * s + 0.08 * R());
      dabs(340, 1.0, 3.3, s => 0.38 + 0.24 * s + 0.24 * (R() - 0.5));
      dabs(190, 0.95, 2.4, s => (s > -0.2 ? 0.7 + 0.3 * s + 0.2 * (R() - 0.5) : 0.34 + 0.2 * R()));
      g.restore();
    }, false);
    const n = NC, geo = new THREE.PlaneGeometry(1, 1);
    this.aInfo = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aInfo', this.aInfo); geo.setAttribute('aCol', this.aCol);
    const cu = this.cu = {
      tAtlas: { value: atlas }, uLightW: { value: new THREE.Vector3(L.tx * 0.6 + L.nx * 0.3, 0.72, L.tz * 0.6 + L.nz * 0.3).normalize() },
      cMistLit: { value: col('#ece5d4', 0.08) }, cMistWarm: { value: col('#f1cfa6', 0.1) }, cMistStorm: { value: col('#b4b8c0', 0.08) }, cMistShade: { value: col('#787c8a', 0.1) },
    };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, cu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aInfo; attribute vec3 aCol; varying vec4 vInfo; varying vec3 vCol; varying vec2 vN; varying vec2 vQ;')
        .replace('#include <project_vertex>', `vec4 mvPosition = modelViewMatrix * vec4(instanceMatrix[3].xyz, 1.0);
  float cs = cos(aInfo.z), sn = sin(aInfo.z); vec2 q = vec2(position.x * instanceMatrix[0][0], position.y * instanceMatrix[1][1]);
  mvPosition.xy += vec2(cs * q.x - sn * q.y, sn * q.x + cs * q.y);
  vN = position.xy * 2.0; vQ = position.xy + 0.5; vInfo = aInfo; vCol = aCol;
  gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D tAtlas; uniform vec3 uLightW, cMistLit, cMistWarm, cMistStorm, cMistShade; varying vec4 vInfo; varying vec3 vCol; varying vec2 vN; varying vec2 vQ;')
        .replace('#include <map_fragment>', `{
  float kd = vInfo.x, lit = vInfo.w; vec3 c; float a;
  if (kd > 3.5 && kd < 4.5) {
    // the bow: a ring about the point opposite the sun, seen in the spray: violet inside, red outside, strongest at its
    // right foot, gone at its left (vCol: the card's width and height in metres, and how much of the ring has come)
    vec2 p = (vQ - vec2(0.5, 0.0)) * vCol.xy; p.y += 0.1;
    float r = length(p), tb = (r - 0.5) / 0.1, ang = atan(p.y, p.x);
    float band = smoothstep(0.0, 0.36, tb) * (1.0 - smoothstep(0.64, 1.0, tb));
    vec3 sp = clamp(vec3(smoothstep(0.4, 0.72, tb) + 0.42 * (1.0 - smoothstep(0.0, 0.22, tb)), 1.0 - abs(tb - 0.52) * 2.1, 1.0 - smoothstep(0.16, 0.56, tb)), 0.0, 1.0);
    // (it comes from its right foot; it is brightest low on the right, where the spray is thick, and has thinned to
    // nothing before it is over the island)
    float along = (1.0 - smoothstep(vCol.z * 2.9 - 0.7, vCol.z * 2.9, ang)) * (1.0 - smoothstep(1.0, 2.35, ang)) * smoothstep(0.08, 0.34, ang);
    c = mix(sp, vec3(1.0), 0.3); a = band * along * vInfo.y;
  } else {
    vec2 cell = kd < 0.5 ? vec2(0.0, 1.0) : kd < 1.5 ? vec2(1.0, 1.0) : kd < 2.5 ? vec2(0.0, 0.0) : vec2(1.0, 0.0);
    vec4 tx = texture2D(tAtlas, (clamp(vQ, 0.02, 0.98) + cell) * 0.5);
    if (kd < 0.5) {
      // a billow of spray: slate in the storm; then lit from the right, warm white, lavender in its own shade
      vec3 lv = normalize((viewMatrix * vec4(uLightW, 0.0)).xyz);
      float rr = dot(vN, vN); vec3 nn = normalize(vec3(vN * 0.75, sqrt(max(0.1, 1.0 - rr * 0.6)) + 0.9 * (tx.r - 0.7)));
      float lam = clamp(dot(nn, lv) * 0.8 + 0.4, 0.0, 1.0);
      vec3 st = mix(cMistShade, cMistStorm, 0.35 + 0.65 * tx.r);
      vec3 su = mix(mix(cMistShade, cMistStorm, 0.7), cMistLit, smoothstep(0.2, 0.8, lam));
      su += cMistWarm * 0.22 * pow(clamp(1.0 - nn.z, 0.0, 1.0), 1.5) * smoothstep(0.1, 0.8, dot(normalize(vN + 1e-4), lv.xy));
      c = mix(st, su, lit) * vCol; a = smoothstep(0.0, 0.6, tx.a) * vInfo.y;
    } else if (kd < 1.5) { c = mix(cMistStorm, cMistLit, lit) * vCol; a = tx.a * vInfo.y; }
    else if (kd < 2.5) {
      // a dab: rock, or a leaf on the water
      c = vCol * (0.62 + 0.5 * tx.r) * mix(vec3(0.6, 0.64, 0.74), vec3(1.05, 1.0, 0.88), lit); a = smoothstep(0.25, 0.55, tx.a) * vInfo.y;
    } else {
      // a crown: dull and cool under the storm, and then his October, the lit touches warmest
      float sh = tx.r, mask = smoothstep(0.3, 0.6, tx.a);
      if (kd > 4.5) {
        // (a dark spire among them: a hemlock or a pine)
        float sp = (1.0 - vQ.y) * 0.4 + 0.035 - abs(vQ.x - 0.5) + (tx.r - 0.5) * 0.09;
        mask *= smoothstep(0.0, 0.05, sp) * smoothstep(0.02, 0.1, vQ.y);
      }
      // (its own shade goes towards a brown-violet, as his do; its lights towards yellow)
      vec3 body = mix(vCol * vec3(0.5, 0.42, 0.5), vCol, smoothstep(0.1, 0.55, sh)) * (0.34 + 0.86 * sh);
      vec3 storm = mix(vec3(dot(body, vec3(0.3, 0.5, 0.2))), body, 0.62) * vec3(0.6, 0.62, 0.74) * 0.74;
      vec3 sun = body * vec3(1.12, 1.0, 0.8) * 1.02 + vec3(0.15, 0.09, 0.015) * smoothstep(0.7, 1.0, sh) * (kd > 4.5 ? 0.15 : 1.0);
      c = mix(storm, sun, lit); a = mask * vInfo.y;
    }
  }
  if (a < 0.01) discard;
  diffuseColor = vec4(c, a);
}`);
    };
    m.customProgramCacheKey = () => 'niagara-cards';
    const mesh = this.cards = new THREE.InstancedMesh(geo, m, n);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.count = 0; mesh.renderOrder = 6;
    L.add(mesh);

    // ---- the woods. Each tree: where it stands, its ground, its size, its colour, when it comes up.
    // (his October: scarlet, vermilion, burnt orange and amber, a little gold; olive and dull green still; russet, maroon)
    const hues = [['#a8301a', 3.2], ['#c2481c', 3], ['#c86a20', 3], ['#c68a2a', 2.6], ['#d0a23c', 1], ['#74702c', 2.2], ['#4c5828', 2], ['#7a3a1c', 2.6], ['#5e2618', 1.8]].map(([c, w]) => [col(c, 0.2), w]);
    const total = hues.reduce((s, x) => s + x[1], 0), hue = () => { let r = R() * total; for (const x of hues) if ((r -= x[1]) <= 0) return x[0]; return hues[0][0]; };
    const pine = [col('#22301f', 0.25), col('#2c3a24', 0.25), col('#1e2a22', 0.25)], haze = col('#5e646e', 0.15), under = ['#3c3a1c', '#4a2c18', '#30381e', '#54301a'].map(c => col(c, 0.2));
    const T = this.T = [];
    const tree = (u, o, g, s, c, conifer = false, far = 0, low = 0) => T.push({ u, o, g, s, c: far ? c.clone().lerp(haze, far) : c.clone().multiplyScalar(0.86 + 0.28 * R()), conifer, far, low, t0: T_WOOD + 0.3 * clamp01((o + 0.05) / 1.1) + 0.12 * R(), spin: (R() - 0.5) * (conifer ? 0.1 : 0.7), ph: R() * TAU, ax: conifer ? 1 : 0.9 + 0.3 * R(), ay: conifer ? 1 : 0.88 + 0.26 * R() });
    const any = (size, o, far = 0.3) => { const near = clamp01(o / 1.05), con = R() < 0.12; return [size * lerp(0.66, 1.16, near) * (0.8 + 0.4 * R()) * (con ? 0.82 : 1), con ? pine[Math.floor(R() * 3)] : hue(), con, far * (1 - near) * (1 - near)]; };
    const stand = (count, box, ground, size) => {
      for (let i = 0, made = 0; made < count && i < count * 40; i++) {
        const u = lerp(box[0], box[1], R()), o = lerp(box[2], box[3], R()), g = ground(u, o); if (g < 0.04) continue;
        tree(u, o, g, ...any(size, o)); made++;
      }
    };
    // (a bank's sides and its nose are what is seen from in front: a row round them at mid height, another low down,
    // and dark undergrowth under it all, so no bare ground shows)
    const skirt = (B, count, x, size, dark, side = 1) => {
      const inner = (B.u < 0 ? 1 : -1) * side;
      for (let i = 0; i < count; i++) {
        const q = (i + 0.2 + 0.6 * R()) / count, o = lerp(side > 0 ? 0.56 : 0.1, B.o1 - 0.03, Math.min(1, q * 1.25)), round = clamp01((q - 0.8) / 0.2);      // along that side, then round the nose
        const u = bankMid(B, o) + inner * bankWide(B, o) * x * (1 - 1.6 * round), g = bank(B, u, o); if (g < 0.02) continue;
        if (dark) tree(u, o, g * 0.5, size * (0.9 + 0.3 * R()), under[Math.floor(R() * 4)], false, 0, 1); else tree(u, o, g, ...any(size, o, 0));
      }
    };
    stand(34, [BL.u - BL.w, BL.u + BL.w + BL.in, -0.02, BL.o1], bankL, 0.15);
    stand(38, [BR.u - BR.w + BR.in, BR.u + BR.w, -0.02, BR.o1], bankR, 0.155);
    stand(8, [BL.u - BL.w, BL.u + BL.w + BL.in, BL.o1 - 0.36, BL.o1], bankL, 0.15); stand(9, [BR.u - BR.w + BR.in, BR.u + BR.w, BR.o1 - 0.38, BR.o1], bankR, 0.155);
    stand(10, [BL.u - BL.w * 0.7, BL.u + BL.w * 0.8, 0, 0.5], bankL, 0.2); stand(10, [BR.u - BR.w * 0.8, BR.u + BR.w * 0.7, 0, 0.55], bankR, 0.2);      // (their tops at the back, which stand highest)
    skirt(BL, 9, 0.72, 0.15); skirt(BL, 8, 0.93, 0.14); skirt(BL, 9, 0.85, 0.19, true); skirt(BL, 8, 0.8, 0.15, false, -1); skirt(BL, 6, 0.9, 0.19, true, -1);
    skirt(BR, 10, 0.72, 0.155); skirt(BR, 9, 0.93, 0.14); skirt(BR, 10, 0.85, 0.19, true); skirt(BR, 8, 0.8, 0.15, false, -1); skirt(BR, 6, 0.9, 0.19, true, -1);
    stand(14, [ISLE.u - ISLE.a, ISLE.u + ISLE.a, ISLE.o - ISLE.b, ISLE.o + ISLE.b], (u, o) => { const g = isle(u, o); return g > 0.01 ? H + g : 0; }, 0.105);
    // the far shore, small and grey with distance, a low broken line along the foot of the wall
    for (let i = 0; i < 16; i++) { const u = lerp(-0.84, 0.82, Math.pow(R(), 0.8) * (i % 2 ? 1 : 0.55) + (i % 2 ? 0 : 0.2)), con = R() < 0.25, s = 0.04 + 0.04 * R() * R(); tree(u, -0.02 + 0.02 * R(), H - 0.006, con ? s * 0.9 : s, con ? pine[0] : hue(), con, 0.72 + 0.14 * R()); }
    // and his nearest, biggest because nearest: the scarlet one at the end of the left bank, the orange one on the right
    tree(BL.u + 0.08, BL.o1 - 0.1, bankL(BL.u + 0.08, BL.o1 - 0.1), 0.23, col('#b0321a', 0.15)); tree(BR.u - 0.1, BR.o1 - 0.1, bankR(BR.u - 0.1, BR.o1 - 0.1), 0.25, col('#cc7422', 0.15));
    tree(BL.u - 0.06, BL.o1 - 0.24, bankL(BL.u - 0.06, BL.o1 - 0.24), 0.2, col('#c68a2a', 0.15)); tree(BR.u + 0.06, BR.o1 - 0.26, bankR(BR.u + 0.06, BR.o1 - 0.26), 0.21, col('#a8301a', 0.15));
    while (T.length > N_TREE) T.pop();

    // ---- dabs of rock: the island's face, the stones at the cliff's foot
    const rockC = ['#5a4a3c', '#6e5e4c', '#463a32', '#8a7a64', '#5e5040'].map(c => col(c, 0.25)), mossC = ['#3c4424', '#4e5a2c'].map(c => col(c, 0.25));
    const D = this.D = [];
    // (the island's face: level beds of rock, long thin strokes laid one over another, the pale cap along the top)
    // (a few loaded touches on the island's face, over the beds the rock's own shader draws: moss at the top, a pale ledge or two)
    for (let i = 0; i < 9; i++) { const u = lerp(IS0 + 0.04, IS1 - 0.04, R()), hh = i < 4 ? H - 0.02 - 0.03 * R() : lerp(0.1, H - 0.08, R()); D.push({ u, o: brink(u) + 0.02, h: hh, s: 0.035 + 0.02 * R(), c: i < 4 ? mossC[i % 2] : rockC[1 + (i % 2) * 2], spin: (R() - 0.5) * 0.12, w: 2.2 }); }

    // ---- spray. The boil along the foot of each fall, the drops it throws, and the column on the left.
    const foot = (A, q) => { const p = A[Math.max(0, Math.min(A.length - 1, Math.round(q * (A.length - 1))))], x = CAP + THROW; return { u: p.u + p.nu * x, o: p.o + p.no * x, nu: p.nu, no: p.no }; };
    this.Bo = Array.from({ length: N_BOIL }, (_, i) => { const am = i % 4 === 3, f = foot(am ? this.arcA : this.arcH, am ? 0.1 + 0.8 * R() : 0.06 + 0.88 * R()); return { ...f, am, a: R(), b: R(), c: R(), d: R(), P: 2.3 + 1.2 * R(), lump: R() < 0.22 }; });
    this.Sp = Array.from({ length: N_SPRAY }, (_, i) => { const am = i % 4 === 3, f = foot(am ? this.arcA : this.arcH, am ? 0.1 + 0.8 * R() : 0.08 + 0.84 * R()); return { ...f, am, a: R(), b: R(), c: R(), d: R(), vh: 0.75 + 0.85 * R() }; });
    this.Pl = Array.from({ length: N_PLUME }, (_, j) => ({ j, a: R(), b: R(), c: R(), d: R() }));
    // ---- leaves on the river: the first rides the front of the first water, the rest come down while you look
    const leafC = ['#c23a1c', '#d9792a', '#e0b040', '#b5361e', '#d89030'].map(c => col(c, 0.15));
    this.Lf = Array.from({ length: N_LEAF }, (_, i) => ({ i, u: i === 0 ? 0.3 : [0.52, 0.08, -0.66, 0.4][i - 1], c: leafC[i], T0: i === 0 ? 0 : 8.2 + (i - 1) * 3.1, per: 12.4, ph: R() * TAU }));
    this.white = new THREE.Color(1, 1, 1);
    // scratch: one row per card, then drawn far to near
    this.px = new Float32Array(n); this.py = new Float32Array(n); this.pz = new Float32Array(n); this.sx = new Float32Array(n); this.sy = new Float32Array(n);
    this.pk = new Float32Array(n); this.pa = new Float32Array(n); this.pr = new Float32Array(n); this.pw = new Float32Array(n); this.pc = new Float32Array(n * 3); this.dep = new Float32Array(n);
    this.order = []; this.byDepth = (a, b) => this.dep[b] - this.dep[a];
  },

  makeScore(L, calm) {
    const s = score(L), q = calm ? 0.5 : 1;
    // where the first water lands: a deep soft blow and the hiss of it, eased in (and slower and quieter when calm)
    s.note(T_HIT - 0.04, 58, 2.0, { type: 'sine', vol: 0.05 * q, to: 40, attack: calm ? 0.7 : 0.12 });
    s.hit(T_HIT - 0.02, { d: 1.7, vol: 0.04 * q, lp: 420, attack: calm ? 0.6 : 0.1 });
    s.hit(T_HIT + 0.05, { d: 1.2, vol: 0.016 * q, lp: 3200, hp: 900, attack: calm ? 0.6 : 0.16 });
    s.hit(T_HIT + D_AM, { d: 1.2, vol: 0.016 * q, lp: 700, attack: calm ? 0.5 : 0.12 });
    return s.done();
  },

  hideAll() {
    this.cards.count = 0; this.cards.visible = false;
    this.land.visible = false; this.land.scale.y = 0.001;
    const u = this.wu; u.uFront.value.set(0, -1); u.uFallT.value.set(-9, -1); u.uPool.value.set(0, 0, 0); u.uSun.value.set(0, 2); u.uLip.value = 0; u.uSky.value = 0; u.uShade.value = 0;
    this.water.material.visible = false;
  },
  quietAll() { this.far.set(0); this.body.set(0); this.hiss.set(0); },
  start(L, resumed) { if (!resumed) { this.hideAll(); this.wt = 0; } this.bandCalm = L.calm; this.band = this.bands[L.calm ? 1 : 0]; this.band.from(L.t); this.water.material.visible = true; this.land.visible = true; },
  back(L) { this.bT = L.t; },
  end(L) { this.hideAll(); this.quietAll(); },
  reset(L) { this.hideAll(); this.quietAll(); this.wt = 0; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return';
    if (!showing && !back) return;
    const calm = L.calm, t = showing ? L.t : this.bT, R = back ? L.ret * RET : 0, tt = t + R, cam = L.k.G.camera;
    this.wt += dt * (calm ? 0.5 : 1);
    const wu = this.wu, lu = this.lu;
    // ---- how things stand at t (and, going home, R seconds after)
    const rise = sm(ramp(t, 0, calm ? 1.7 : 1.5)) * (1 - ease.inOut(ramp(R, 1.55, RET)));
    const front = lerp(0, 1, Math.pow(ramp(t, T_RIVER, T_LIP), 1.35)) + 0.4 * ramp(t, T_LIP, T_LIP + 0.4);
    const tail = back ? -0.1 + 1.4 * ramp(R, 0, 0.85) : -1;
    const shut = back && R > 0.75 ? R - 0.75 : -1, gone = back ? sm(ramp(R, 0.75 + FALL * 0.8, 0.75 + FALL + 0.7)) : 0;
    const hitH = sm(ramp(t, T_HIT - 0.06, T_HIT + 0.5)) * (1 - gone), hitA = sm(ramp(t, T_HIT + D_AM - 0.06, T_HIT + D_AM + 0.6)) * (1 - gone);
    const reach = ease.out(ramp(t, T_HIT - 0.05, T_HIT + 1.9)) * (1 - ease.inOut(ramp(R, 1.1, 2.15)));
    // the light: it comes across from the right; later a cloud crosses now and then and it dims, and comes back
    const sunSpan = calm ? 3.3 : 2.2, cloud = t > 14 ? hump((t - 14) % 21, 0, 7) : 0;
    const sunAmt = sm(ramp(t, T_SUN, T_SUN + 0.7)) * (1 - 0.72 * cloud), sunEdge = lerp(1.75, -1.95, ease.inOut(ramp(t, T_SUN, T_SUN + sunSpan)));
    const litAt = u => sunAmt * sm(ramp(u, sunEdge - 0.3, sunEdge + 0.3));
    const bowIn = ramp(t, T_BOW, T_BOW + (calm ? 2.4 : 1.6)), bow = sm(bowIn) * hitH * (1 - 0.95 * sm(cloud * 1.6)) * (1 - sm(ramp(R, 0.1, 1.0)));
    const sky = ease.out(ramp(t, 0.1, 3.0)) * (1 - ease.inOut(ramp(R, 0.9, 2.5)));
    // (a bow is seen only with the sun at your back: from in front of the picture, not from along the wall)
    const bq = L.floor(0.06, 0.8, this.v), bx = cam.position.x - bq.x, bz = cam.position.z - bq.z, facing = sm(ramp((bx * L.nx + bz * L.nz) / (Math.hypot(bx, bz) || 1), 0.5, 0.82));

    this.land.scale.y = Math.max(0.001, rise);
    lu.uSun.value.set(sunAmt, sunEdge);
    wu.uTime.value = this.wt; wu.uClock.value = tt;
    wu.uFront.value.set(rise > 0.98 || back ? front : 0, tail);
    wu.uFallT.value.set(t - T_PLUNGE, shut);
    wu.uPool.value.set(reach, hitH, hitA);
    wu.uSun.value.set(sunAmt, sunEdge);
    wu.uLip.value = hump(t, T_LIP - 0.15, T_PLUNGE + 0.3) * (back ? 0 : 1);
    wu.uSky.value = sky; wu.uShade.value = sm(ramp(rise, 0.1, 0.9));

    // ---- the cards
    let n = 0; const v = this.v, y0 = L.cy - L.y;
    const put = (u, h, o, sx, sy, kind, a, spin, c, lit, c2 = 0) => {
      if (a <= 0.004 || sx <= 0.001 || n >= NC) return;
      L.at(u, h - y0, o, v);
      this.px[n] = v.x; this.py[n] = v.y; this.pz[n] = v.z; this.sx[n] = sx; this.sy[n] = sy; this.pk[n] = kind; this.pa[n] = a; this.pr[n] = spin; this.pw[n] = lit;
      if (kind === 4) { this.pc[n * 3] = sx; this.pc[n * 3 + 1] = sy; this.pc[n * 3 + 2] = c2; } else { this.pc[n * 3] = c.r; this.pc[n * 3 + 1] = c.g; this.pc[n * 3 + 2] = c.b; }
      n++;
    };
    // the woods: up from the distance forward (springing, unless calm); going home, the right bank first (the
    // strawberry bed next door can reach under that side)
    for (const f of this.T) {
      const lr = clamp01((1.2 - f.u) / 2.4), q = ramp(t, f.t0, f.t0 + 0.75), down = 1 - ease.inOut(ramp(R, 0.8 + 0.4 * lr + 0.25 * (1 - clamp01(f.o / 1.1)), 1.6 + 0.4 * lr));
      const k = (calm ? sm(q) : ease.outBack(q)) * down; if (k <= 0.01) continue;
      const s = f.s * k, sway = (calm ? 0.012 : 0.025) * Math.sin(tt * 1.2 + f.ph);
      put(f.u + sway * s, f.g * rise + s * (f.conifer ? 0.62 : f.low ? 0.2 : 0.34), f.o, s * (f.conifer ? 0.8 : f.low ? 1.6 : 1.36 * f.ax), s * (f.conifer ? 1.7 : f.low ? 1.1 : 1.36 * f.ay), f.conifer ? 5 : 3, Math.min(1, k * 1.5) * (1 - 0.3 * f.far), f.spin + sway, f.c, litAt(f.u) * (1 - 0.4 * f.far) * (f.low ? 0.5 : 1));
    }
    // the rock's dabs, up with the rock
    if (rise > 0.3) for (const d of this.D) put(d.u, d.h * rise, d.o, d.s * (d.w || 1.2), d.s * (d.w ? 0.8 : 1.2), 2, 0.92 * sm(ramp(rise, 0.3, 0.9)), d.spin, d.c, litAt(d.u));
    // the boil along the foot of each fall
    const burst = calm ? 0 : Math.exp(-Math.max(0, t - T_HIT) / 0.45) * (t >= T_HIT - 0.05 ? 1 : 0);
    for (const m of this.Bo) {
      const on = m.am ? hitA : hitH; if (on <= 0.01) continue;
      const age = (tt / m.P + m.a) % 1, inw = (m.am ? 0.04 : 0.06) + 0.12 * m.c;
      const u = m.u + m.nu * age * inw + (m.d - 0.5) * 0.12 * age, o = m.o + 0.02 + m.no * age * inw + age * 0.04, h = 0.04 + age * (0.16 + (m.am ? 0.16 : 0.36) * m.b) * (1 + 0.5 * burst);
      const s = (m.am ? 0.09 : 0.13) + age * (m.am ? 0.16 : 0.32);
      put(u, h, o, s, s, m.lump ? 0 : 1, (m.lump ? 0.3 : 0.24) * Math.pow(Math.sin(Math.PI * age), 0.8) * on, m.a * TAU + age * 0.6, this.white, litAt(u));
    }
    // the drops it throws (they go at the water's own pace)
    for (const q of this.Sp) {
      const on = q.am ? hitA : hitH; if (on <= 0.01) continue;
      const vh = q.vh * (1 + 0.9 * burst) * (q.am ? 0.8 : 1), P = vh / 2.45, tau = ((this.wt / P + q.a) % 1) * P, h = 0.03 + vh * tau - 2.45 * tau * tau;
      if (h <= 0.012) continue;
      put(q.u + (q.d - 0.5) * 0.3 * tau + q.nu * 0.16 * tau, h, q.o + 0.02 + q.no * 0.2 * tau + 0.1 * q.c * tau, 0.02 + 0.014 * q.b, 0.02 + 0.014 * q.b, 1, 0.85 * on, 0, this.white, litAt(q.u));
    }
    // the column: given off from the foot of the American fall, climbing the wall beside the frame; once the water
    // is shut off no more is given off, and what is in the air goes on up and thins
    const tA = T_HIT + D_AM + 0.1, DTP = PLUME.life / N_PLUME, fadeP = 1 - ease.inOut(ramp(R, 0.4, 2.3));
    if (t > tA) for (const p of this.Pl) {
      const since = t - tA - p.j * DTP; if (since < 0) continue;
      const tau = (since % PLUME.life) + R; if (tau > PLUME.life) continue;
      // (a soft veil, not puffs: wide, thin, many laid over each other; a few billows low down where it is thick)
      const up = 1 - Math.exp(-tau / 3.0), h = PLUME.h + 1.95 * up + 0.03 * Math.sin(tt * 0.6 + 7 * p.a);
      const u = PLUME.u - 0.08 * (1 - Math.exp(-tau / 2.2)) + (p.a - 0.5) * (0.07 + 0.04 * tau) + 0.03 * Math.sin(tt * 0.41 + 6 * p.d) * Math.min(1, tau / 2);
      const o = PLUME.o + 0.05 * (1 - Math.exp(-tau / 1.5)) + (p.c - 0.5) * 0.04;
      const r = Math.min(0.24, 0.085 + 0.04 * tau) * (0.85 + 0.3 * p.b), bill = p.j % 4 === 2 && tau < 3.2;
      const a = sm(tau / 0.6) * (bill ? 0.3 : 0.25 - 0.11 * ramp(tau, 1.0, 4)) * (1 - ramp(tau, 3.0, PLUME.life)) * fadeP;
      put(u, h, o, r * 2, r * 2.3, bill ? 0 : 1, a, bill ? p.a * TAU : 0, this.white, litAt(u) * (0.6 + 0.4 * ramp(h, 0.4, 1.2)));
    }
    // leaves on the river: down to the lip (the first one waits there with the water), over, under, and up in the basin
    for (const lf of this.Lf) this.leaf(L, lf, t, tt, back, R, put, litAt);
    // the bow, in the spray over the basin
    if (bow * facing > 0.01) put(0.06, 0.42, 0.8, 1.4, 0.84, 4, bow * facing * (calm ? 0.42 : 0.48) * (0.9 + 0.1 * Math.sin(tt * 0.7)), 0, this.white, 0, bowIn);
    this.flush(n, cam);

    // ---- sound: the falls, and nothing else. Far off and low at first; the hush at the lip; then all of it.
    if (showing) { if (calm !== this.bandCalm) { this.bandCalm = calm; this.band = this.bands[calm ? 1 : 0]; this.band.from(t); } this.band.play(t); }
    const near = Math.max(0, 1 - Math.hypot(cam.position.x - L.cx, cam.position.z - L.cz) / 13), q = (L.quiet ? 0 : 1) * (calm ? 0.55 : 1) * near, tau = calm ? 0.7 : 0.25;
    const farK = sm(ramp(t, 0.2, 2.4)) * (1 - 0.45 * hump(t, T_LIP - 0.25, T_PLUNGE + 0.2)) * (1 - sm(ramp(R, 1.0, 2.4)));
    const roar = Math.max(hitH, 0.6 * hitA) * (1 + 0.07 * Math.sin(tt * 0.9));
    this.far.set(q * (0.016 * farK + 0.022 * roar), tau); this.body.set(q * 0.034 * roar, tau); this.hiss.set(q * 0.011 * roar, tau);
    if (showing && !TOLD && !L.quiet && t > T_HIT + 0.3) { TOLD = true; L.k.say('Niagara goes over its edge and the spray climbs. Cole wrote of the rainbow in it, though he painted none here.', 4.5); }
  },

  // One leaf at show-time t: where it is on the river, on the curtain or in the basin.
  leaf(L, lf, t, tt, back, R, put, litAt) {
    if (back && R > 0.5) return;
    const first = lf.i === 0, x = Math.abs((lf.u - HS.u) / HS.w), am = lf.u < IS0;
    const delay = am ? D_AM + 0.1 : 0.36 * Math.pow(Math.min(1.1, x), 1.5), B = brink(lf.u), fade = back ? 1 - R / 0.5 : 1;
    let tau, tGo;                                // seconds into its own journey; and when it goes over
    if (first) { if (t < T_RIVER + 0.25) return; tau = t; tGo = T_PLUNGE + delay + 0.04; }
    else { const since = t - lf.T0; if (since < 0) return; tau = since % lf.per; tGo = 2.7; }
    const s = 0.046, wob = 0.012 * Math.sin(tt * 2.1 + lf.ph);
    if (tau < tGo) {
      // on the river: with the front (the first), or drawn down quicker and quicker (the rest); it waits at the lip
      const f = first ? Math.min(0.985, lerp(0, 1, Math.pow(ramp(t, T_RIVER, T_LIP), 1.35)) - 0.05) : 0.12 + 0.87 * Math.pow(tau / tGo, 1.7);
      if (f < 0.05) return;
      const o = lerp(-0.04, B + CAP, f);
      put(lf.u + wob * (1 - f), H + 0.014, o, s, s * 0.7, 2, sm(ramp(f, 0.05, 0.2)) * fade, tt * 0.9 + lf.ph, lf.c, litAt(lf.u));
    } else if (tau < tGo + FALL) {
      const k = (tau - tGo) / FALL, pth = (am ? this.arcA : this.arcH), p = pth.reduce((b, q) => (Math.abs(q.u - lf.u) < Math.abs(b.u - lf.u) ? q : b), pth[0]), xo = CAP + 0.01 + THROW * k;
      put(p.u + p.nu * xo, Math.max(0.03, H + 0.01 - H * k * k), p.o + p.no * xo + 0.012, s, s, 2, fade * (1 - 0.6 * k), tt * 5 + lf.ph, lf.c, litAt(lf.u));
    } else {
      // under for a moment, then up in the basin and away on it
      const k = tau - tGo - FALL - 0.9; if (k < 0 || k > 5.2) return;
      const d = 0.16 + 0.085 * k, o = B + THROW + d, lim = 1.0 - 0.27 * Math.pow((lf.u - 0.04) / 0.9, 2);
      put(lf.u + (0.05 * Math.sin(k * 0.9 + lf.ph) + (0.04 - lf.u) * 0.05 * k), 0.026 + 0.004 * Math.sin(tt * 2.6 + lf.ph), Math.min(o, lim), s, s * 0.7, 2, sm(k / 0.4) * (1 - sm(ramp(o, lim - 0.16, lim - 0.02))) * fade, tt * 0.5 + lf.ph, lf.c, litAt(lf.u));
    }
  },

  flush(n, cam) {
    const fx = -cam.matrixWorld.elements[8], fy = -cam.matrixWorld.elements[9], fz = -cam.matrixWorld.elements[10], cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    const ord = this.order; ord.length = n;
    for (let i = 0; i < n; i++) { ord[i] = i; this.dep[i] = (this.px[i] - cx) * fx + (this.py[i] - cy) * fy + (this.pz[i] - cz) * fz; }
    ord.sort(this.byDepth);
    const M = this.cards.instanceMatrix.array, I = this.aInfo.array, C = this.aCol.array;
    for (let j = 0; j < n; j++) {
      const i = ord[j], m = j * 16;
      M[m] = this.sx[i]; M[m + 5] = this.sy[i]; M[m + 10] = this.sx[i]; M[m + 15] = 1; M[m + 12] = this.px[i]; M[m + 13] = this.py[i]; M[m + 14] = this.pz[i];
      I[j * 4] = this.pk[i]; I[j * 4 + 1] = this.pa[i]; I[j * 4 + 2] = this.pr[i]; I[j * 4 + 3] = this.pw[i];
      C[j * 3] = this.pc[i * 3]; C[j * 3 + 1] = this.pc[i * 3 + 1]; C[j * 3 + 2] = this.pc[i * 3 + 2];
    }
    this.cards.count = n; this.cards.visible = n > 0;
    this.cards.instanceMatrix.needsUpdate = true; this.aInfo.needsUpdate = true; this.aCol.needsUpdate = true;
  },
});
