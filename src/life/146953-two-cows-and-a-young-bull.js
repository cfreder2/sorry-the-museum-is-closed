// Paulus Potter, Two Cows and a Young Bull beside a Fence in a Meadow (1647), Gallery 213. The word: cud.
//
// He was in his early twenties (the museum gives 1625 to 1654). It says he raised cows, oxen and other farm animals
// into "majestic emblems of nature", and that the attention he gave to how they really look ("the varied texture and
// coloring of their hair, their characteristic poses, their bulky contours") "borders on portraiture". What he shows
// is three of them on a patch of dry earth under a great sky, seen from very low down, as a toy on the floor would see
// them: a dark cow from behind, turned to the young bull beside her; the young bull, shaggy, with a white blaze, who
// looks straight out at us with his mouth a little open; and in front, in the light, a red and white cow lying down,
// one foreleg stretched out, her eyes half shut, chewing. An old pollard willow and a weathered fence stand at the
// right. Nothing happens in it, and that is the subject: a herd at rest on a warm afternoon, doing the one thing a cow
// at rest does.
//
// Look at it and his dry earth comes out over the floor under the picture, going to rough grass at its edges, and the
// willow and the fence post stand up at its right side. Far off, inside the wall, a cow lows. Then the three of them
// gather out of the wall in flakes of paint, nose first and low, and walk out onto it at a cow's walk, each foot put
// down where it will stand: the dark cow in from the corner on the left and along the back, bearing round until she
// stops with her back to us; the red and white one out from under the picture to the middle; the young bull after
// her, who stops behind her shoulder. The red and white cow puts her nose to the ground, gathers her feet, goes down
// on her knees, lets her quarters drop with all her weight, and settles with a long breath; she stretches one foreleg
// out, as he painted it, and turns her head to us. She lifts her chin as the cud comes up, and begins to chew: the
// slow sideways grind of it, her eyes closing. Behind her the young bull, who has watched her go down, lifts his head
// and looks at us, as he does in the picture, chewing too; the dark cow turns her head to him and swings her tail.
// While you keep looking they stay: she chews, swallows, brings up another and chews again, an ear flicks, the bull
// blinks. When you stop, the dark cow moves off towards the wall, the bull looks up at the picture, and the earth
// draws in round the red and white cow, flake by flake; her face is the last of it to go, still chewing.
//
// How it is made: three draw calls. The earth is one flat mesh with one shader (his dry browns laid in short touches,
// a scumbled green margin, an edge that breaks up stroke by stroke). The three animals, the willow, the fence and the
// grass are parts of one rig: each animal a plain core lofted through a cow's own sections (the square quarters and
// hip bones, the deep belly, the brisket), a shade darker than the paint over it, and over all of it a coat of soft
// dabs laid the way the hair runs (broad ones that close the form, finer hairs over them), flat on the red and white
// cow, long and lifted on the bull, each toned by his light from the upper left and by the coat's own markings, so
// that a patch's edge is ragged hair and never a line. The heads are measured against his: a broad curly brow, the
// eye set in the corner of it under a bony brow and a heavy lid (a dark almond with one small light, never a bead),
// a short dished face deep at the cheek, a blunt muzzle with a moist brown-pink pad and the nostrils two soft darks,
// the horns, and the ears held out below them. The jaw is as wide as the cheek and is its own part, so the chew is
// the jowl rolling across under the face, the head and the near ear giving with it; the lids are a part too, under
// paint like the rest. Legs are two bones each, placed by where the foot stands (so no foot slides while it is
// down). The rig's shader also makes the flakes: near the wall they come through (while they are coming) and outside
// the shrinking round of earth at the end, a pixel is kept or dropped by a small hash of where it is. The third call
// is the soft shadows under them. Nothing is solid, the toy cannot push or scatter them, and nothing stays out after
// the look. The animals stand 0.55 to 0.6 m at the shoulder; the tallest thing, the willow's twigs, ends below the
// frame and to its right. From the look camera nothing comes in front of a canvas, and the kit's guard does the rest.
// What it costs: about 37,000 triangles in all (about 85,000 more a frame over the game's passes), and about 50 ms
// to build on a desktop. Dabs are spent where they are seen: few on the flank each animal keeps to the wall, under
// the bellies and on the bull's quarters behind her; the earth's two textures are small.
//
// Beside it in this room hang Hobbema's Watermill (src/life/869-watermill-great-red-roof.js), whose mill is built in
// the corner to this picture's left, and Ruisdael's ruin (src/life/60755-ruins-of-egmond.js), further along that wall.
// The corner is small and both use it: the dark cow comes out of the side wall there, below and to the right of
// Hobbema's frame, and stands where his millpond lies when his picture is looked at. They are never out together: a
// look at one ends the other's, and his mill has gone back under its picture before these have gathered. This show has
// none of what is theirs: no water, no weather, no sky on the wall, no light crossing, nothing built or turning, and
// no birds on the wing (the small bird on his willow stays in the picture). Theirs are a storm and a machine; this is
// three animals with nothing to do.
// With "Reduce motion and flashing" on (read as the show runs), her quarters come down without the bounce, the tails
// swing and the ears flick at half speed, the flakes they gather from are kept to a narrow band at the wall, and the
// sound of her weight landing is quieter and eased in. There is no flash and no pulse of light at any setting.
//
// There is no tune: the cud keeps its own slow time.
//
// What it does not do: nobody drives, calls, milks or herds them, and nothing startles them (care rule 9); no animal
// is the joke, and the dung he painted on the ground is left in the picture; the bull does not bellow or paw, because
// in the picture he only looks; and no person is added, because he painted none.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { strokes } from './brush.js';
import { hump, noise } from './stagecraft.js';

const TAU = Math.PI * 2, sm = ease.smooth, ss = THREE.MathUtils.smoothstep;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---- an animal, in its own metres: +z the way it faces, +x its left, y up from the ground
const HB = 0.35;                                 // the middle of the trunk above the ground, standing
const HIP = [[0.082, 0.01, -0.18], [0.078, -0.09, 0.18], [-0.082, 0.01, -0.18], [-0.078, -0.09, 0.18]];      // left hind, left fore, right hind, right fore: where each leg hangs (from the trunk's middle)
const LEN = [[0.215, 0.178], [0.128, 0.144], [0.215, 0.178], [0.128, 0.144]];                          // its two bones
const TRACK = [[0.072, -0.19], [0.066, 0.18], [-0.072, -0.19], [-0.066, 0.18]];                           // where each foot stands under it
const PHASE = [0, 0.25, 0.5, 0.75];              // a walk: left hind, left fore, right hind, right fore, one after another
const DUTY = 0.77, STRIDE = 0.36;                // how much of a stride each foot is down; one stride (an animal's own size times this)
const NECK = [0, 0.03, 0.235], NL = 0.17;         // where the neck leaves the trunk; its length at rest
const TAILB = [0, 0.094, -0.262], TLEN = [0.15, 0.13];
const JAW = [0, -0.03, 0.012], EAR = [0.058, 0.01, -0.008], HEAD = 1.15;      // the jaw's hinge and an ear's root, on the head; the head's size on the body
const KEY_S = V3(-0.52, 0.76, 0.4).normalize();  // his light, in the stage's terms: high, from the left, a little from the room

// ---- the stage (along the wall from the picture's middle, out from it)
const LAST = [-0.3, 1.18];                       // where the red and white cow's head is as she lies: the last of it to go
const PATCH = { u: 0.1, out: 0.74, ru: 0.86, ro: 0.84, home: 0.3 };
const U0 = -0.86, U1 = 0.965, OUT = 1.75;         // the floor the earth may cover (the doorway begins at 0.98)
const WILLOW = [0.76, 0.2];
// the ways out of the wall: [along, out] ... The two under the picture come straight out of its wall. The dark cow has
// to end with her back to us: where the room's corner is close on the left (as it is in Gallery 213) she comes out of
// the side wall there and along the back, so she need only bear round; anywhere else she comes out of the picture's
// wall like the others and turns about.
const DARK_END = 2.785;                          // the way she heads at the end: away, and a little to the right
const WAYS = {
  dark: [[-0.62, -0.95], [-0.62, -0.1], [-0.6, 0.32], [-0.52, 0.52], [-0.42, 0.58]],
  darkWest: [[-1.95, 0.5], [-1.1, 0.5], [-0.78, 0.58], [-0.56, 0.63], [-0.42, 0.58]],
  pied: [[0.46, -0.95], [0.46, -0.1], [0.46, 0.4], [0.4, 0.75], [0.28, 0.94], [0.1, 1.0]],
  bull: [[0.5, -0.95], [0.5, -0.15], [0.43, 0.12], [0.31, 0.3], [0.2, 0.44]],
};
// ---- the timeline (seconds of show)
const ARR = { dark: 3.45, pied: 3.95, bull: 4.3 }, SPEED = 0.46, PACE = { dark: 0.8, pied: 1, bull: 1 }, A0 = ARR.pied;
const T_SNIFF = [A0, A0 + 0.62], T_SQUARE = [A0 + 0.05, A0 + 0.5], T_STEP = [A0 + 0.35, A0 + 0.85], T_KNEEL = [A0 + 0.5, A0 + 1.2], T_DROP = [A0 + 1.15, A0 + 1.7], T_SIGH = [A0 + 1.9, A0 + 2.8];
const T_STRETCH = [A0 + 2.1, A0 + 2.75], T_TURN = [A0 + 1.8, A0 + 2.5], T_GULP = A0 + 2.85, T_CHEW = A0 + 3.2, CUD = 10.5;      // (a cud: about seven seconds of chewing, a swallow, a pause, the next one up)

const h3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
const n3 = (x, y, z) => {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), fx = x - xi, fy = y - yi, fz = z - zi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const a = (i, j, k) => h3(xi + i, yi + j, zi + k);
  return lerp(lerp(lerp(a(0, 0, 0), a(1, 0, 0), u), lerp(a(0, 1, 0), a(1, 1, 0), u), v), lerp(lerp(a(0, 0, 1), a(1, 0, 1), u), lerp(a(0, 1, 1), a(1, 1, 1), u), v), w);
};
let TOLD = false;
const fbm = (p, f) => 0.6 * n3(p.x * f, p.y * f, p.z * f) + 0.4 * n3(p.x * f * 2.3 + 7.1, p.y * f * 2.3 + 3.3, p.z * f * 2.3 + 1.7);

lifeFor(146953, {
  title: /^Two Cows and a Young Bull/,
  word: 'cud',
  stage: { out: 1.7, half: 1.1, cam: { dist: 2.38, height: 0.32, side: -0.12, fov: 54, lookU: 0.08, lookOut: 0.75, floorOut: 1.45 } },
  wake: 2, ret: 2.3,

  build(L) {
    const P = L.pal, col = (h, a = 0.18) => P.near(h, a), R = () => L.rand();
    // ---------------------------------------------------------- scratch
    this.s = { root: new THREE.Matrix4(), loc: new THREE.Matrix4(), body: new THREE.Matrix4(), head: new THREE.Matrix4(), t: new THREE.Matrix4(), t2: new THREE.Matrix4(), e: new THREE.Euler(),
      a: V3(), b: V3(), c: V3(), d: V3(), H: V3(), J: V3(), F: V3(), lat: V3(), fwd: V3(), x: V3(), y: V3(), z: V3(), sc: V3(), wo: { x: 0, z: 0, yaw: 0 }, w2: { x: 0, z: 0, yaw: 0 } };

    // ---------------------------------------------------------- his earth, spilled out under the picture
    {
      const earth = strokes({
        size: 256, seed: 146953, n: 1200, len: [3, 7], width: [3, 6], bend: 0.3, lift: 0.04, base: col('#65563c', 0.15).getStyle(),
        colors: [['#74633f', 3], ['#645539', 3], ['#80704e', 2.2], ['#56492f', 1.8], ['#8f7e5c', 0.7], ['#625c4c', 1.3], ['#4b402d', 1.1], ['#71593a', 1]].map(([c, w]) => [col(c, 0.15).getStyle(), w]),
        angle: (x, y, r) => r() * Math.PI,
      });
      const green = strokes({
        size: 128, seed: 1647, n: 420, len: [4, 11], width: [2, 4], bend: 0.4, lift: 0.15, base: col('#43452a', 0.2).getStyle(),
        colors: [['#50542f', 3], ['#404628', 3], ['#5f5d35', 2], ['#363b22', 2], ['#6b653c', 1.2], ['#4c412b', 1.2]].map(([c, w]) => [col(c, 0.2).getStyle(), w]),
        angle: (x, y, r) => (r() - 0.5) * 0.9 + 1.2,
      });
      const F = (u, o) => L.floor(u, o, V3()).toArray(), pos = [];
      const a = F(U0, -L.wall), b = F(U1, -L.wall), c = F(U1, OUT), d = F(U0, OUT);
      pos.push(...a, ...b, ...c, ...a, ...c, ...d);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const u = this.gu = { uSpread: { value: 0 }, tEarth: { value: earth }, tGreen: { value: green }, uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) },
        uC: { value: new THREE.Vector4(PATCH.u, PATCH.out, PATCH.ru, PATCH.ro) }, uHome: { value: PATCH.home }, uIsle: { value: new THREE.Vector4(LAST[0], LAST[1], 9, 0) }, uGa: { value: new THREE.Vector3(0.2, 0.62, 0) }, uGb: { value: new THREE.Vector4(0, -0.85, -0.4, 0) } };
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
      m.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, u);
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform float uSpread, uHome; uniform vec3 uO; uniform vec4 uAx, uC, uIsle; uniform sampler2D tEarth, tGreen; vec3 fCol; float fA;')
          .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz; float su = dot(lq, uAx.xy), so = dot(lq, uAx.zw);
  vec4 s1 = texture2D(tEarth, vec2(su, so) / 0.7), s2 = texture2D(tEarth, vec2(su, so) / 1.7 + 0.31), g1 = texture2D(tGreen, vec2(su, so) / 0.5 + 0.41);
  // its outline: an irregular round, with a tongue back to the wall under the picture; broken by the strokes themselves
  vec2 d = vec2((su - uC.x) / uC.z, (so - uC.y) / uC.w); float ang = atan(d.y, d.x), rr = length(d);
  float wob = 1.0 + 0.1 * sin(3.0 * ang + 0.6) + 0.07 * sin(5.0 * ang + 2.4) + 0.04 * sin(9.0 * ang + 1.1);
  float e = rr / wob - 0.5 * exp(-max(so, 0.0) / 0.28) * exp(-pow((su - uHome) / 0.62, 2.0)) + (s1.a - 0.55) * 0.26 + (g1.a - 0.55) * 0.2;
  float core = 1.0 - smoothstep(0.68, 0.8, e), rim = 1.0 - smoothstep(0.86, 0.97, e);
  // worn bare and paler where they lie, darker and damper towards the grass
  vec3 dry = mix(s1.rgb, s2.rgb, 0.35) * mix(0.5, 0.7, exp(-rr * rr * 1.5)); dry = mix(vec3(dot(dry, vec3(0.3, 0.55, 0.15))), dry, 0.8);
  vec3 c = mix(g1.rgb * 0.7, dry, core);
  float id = mix(g1.a, s1.a, core);
  float grow = length(vec2((su - uHome) / uC.z, so / (uC.w * 1.5)));
  fA = smoothstep(0.0, 0.03, uSpread * 1.5 - (grow * 0.8 + id * 0.2)) * rim * mix(0.66, 0.95, core);
  // when the look ends it draws in round where she lies, stroke by stroke
  if (uIsle.w > 0.5) fA *= 1.0 - smoothstep(-0.05, 0.05, length((vec2(su, so) - uIsle.xy) * vec2(1.0, 1.2)) + (id - 0.55) * 0.3 - uIsle.z - 0.07);
  fCol = c;
}`)
          .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
      };
      m.customProgramCacheKey = () => 'potter-earth';
      this.earth = new THREE.Mesh(g, m); this.earth.position.y = 0.016; this.earth.renderOrder = 5; L.add(this.earth);
    }

    // ---------------------------------------------------------- shapes: smooth forms under soft dabs of paint
    const own = (g, c) => {
      g = g.index ? g.toNonIndexed() : g;
      for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n);
      const a = new Float32Array(g.attributes.position.count * 3), cc = new THREE.Color(c);
      for (let i = 0; i < a.length; i += 3) { a[i] = cc.r; a[i + 1] = cc.g; a[i + 2] = cc.b; }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
    };
    const GREY = new THREE.Color(0.5, 0.5, 0.5);
    const ell = (C, Rr, c = GREY, detail = 1, rx = 0, ry = 0, rz = 0) => shape.move(shape.ball(1, c, detail), C[0], C[1], C[2], rx, ry, rz, Rr[0], Rr[1], Rr[2]);
    const limb = (a, b, r0, r1, c = GREY, seg = 8, rings = 2) => {
      const A = V3(...a), Bv = V3(...b), len = A.distanceTo(Bv), g = own(new THREE.CylinderGeometry(r1, r0, len, seg, rings, true), c);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), Bv.clone().sub(A).normalize()));
      const m = A.clone().add(Bv).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return g;
    };
    // A form lofted along z through stations [z, y (its middle), w (half width), hu, hd (half heights, up and down), e (2: round;
    // more: squarer)], smooth through them and closed to a point at each end: one skin, no seams.
    const cat = (a, b, c, d, t) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    const station = (st, f) => { const n = st.length, i = Math.max(0, Math.min(n - 2, Math.floor(f))), t = f - i; return [0, 1, 2, 3, 4, 5].map(k => cat(st[Math.max(i - 1, 0)][k], st[i][k], st[i + 1][k], st[Math.min(i + 2, n - 1)][k], t)); };
    const ring = (st, f, a, into) => { const [z, y, w, hu, hd, e] = station(st, f * (st.length - 1)), cs = Math.cos(a), sn = Math.sin(a), pw = 2 / Math.max(1.5, e); return into.set(Math.max(0, w) * Math.sign(cs) * Math.pow(Math.abs(cs), pw), y + Math.max(0, sn > 0 ? hu : hd) * Math.sign(sn) * Math.pow(Math.abs(sn), pw), z); };
    const loft = (st, rings = 30, seg = 22) => {
      const pos = [], idx = [], p = V3();
      for (let i = 0; i <= rings; i++) for (let j = 0; j < seg; j++) { ring(st, i / rings, (j / seg) * TAU, p); if (i === 0 || i === rings) { p.x = 0; p.y = station(st, (i / rings) * (st.length - 1))[1]; } pos.push(p.x, p.y, p.z); }
      for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) { const a = i * seg + j, b = i * seg + (j + 1) % seg, d = a + seg, f = b + seg; idx.push(a, b, d, b, f, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      return own(g, GREY);
    };
    const skinAt = st => (f, a) => { const p = ring(st, f, a, V3()), d1 = ring(st, f + 0.012, a, V3()).sub(ring(st, f - 0.012, a, V3())), d2 = ring(st, f, a + 0.06, V3()).sub(ring(st, f, a - 0.06, V3())), n = d2.cross(d1).normalize(); if (n.x * p.x + n.y * (p.y - station(st, f * (st.length - 1))[1]) < 0) n.negate(); return { p, n }; };
    // A tube along a curve through pts, rad(t) thick, lumpy by wob(t, a): for horns, a trunk, twigs. g.at(t, a): a point of it.
    const tube = (pts, rad, seg = 8, rings = 12, wob = null) => {
      const c = new THREE.CatmullRomCurve3(pts.map(p => V3(...p)), false, 'centripetal'), fr = c.computeFrenetFrames(rings, false), pos = [], idx = [], p = V3();
      const at = (i, a, into) => { const t = i / rings; c.getPointAt(t, into); const r = rad(t) * (1 + (wob ? wob(t, a) : 0)), N = fr.normals[i], B = fr.binormals[i]; return into.addScaledVector(N, Math.cos(a) * r).addScaledVector(B, Math.sin(a) * r); };
      for (let i = 0; i <= rings; i++) for (let j = 0; j < seg; j++) { at(i, (j / seg) * TAU, p); pos.push(p.x, p.y, p.z); }
      for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) { const a = i * seg + j, b = i * seg + (j + 1) % seg, d = a + seg, f = b + seg; idx.push(a, b, d, b, f, d); }
      const g0 = new THREE.BufferGeometry(); g0.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g0.setIndex(idx); g0.computeVertexNormals();
      const g = own(g0, GREY);
      g.userData.at = (t, a) => { const i = Math.max(0, Math.min(rings, Math.round(t * rings))), q = at(i, a, V3()), cen = c.getPointAt(i / rings, V3()); return { p: q, n: q.clone().sub(cen).normalize(), tan: c.getTangentAt(i / rings, V3()) }; };
      return g;
    };
    // Every vertex its colour, from where it is and which way it faces (a tone runs smoothly over a form).
    const vpaint = (g, fn) => { const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, v = V3(), nn = V3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); nn.fromBufferAttribute(n, i); const k = fn(v, nn); c.setXYZ(i, k.r, k.g, k.b); } c.needsUpdate = true; return g; };
    const flat = (g, c) => vpaint(g, () => c);
    const mirror = g => { const o = g.clone(), p = o.attributes.position, n = o.attributes.normal, c = o.attributes.color; for (let i = 0; i < p.count; i++) { p.setX(i, -p.getX(i)); n.setX(i, -n.getX(i)); } for (const a of [p, n, c]) for (let i = 0; i < a.count; i += 3) { const x = a.getX(i + 1), y = a.getY(i + 1), z = a.getZ(i + 1); a.setXYZ(i + 1, a.getX(i + 2), a.getY(i + 2), a.getZ(i + 2)); a.setXYZ(i + 2, x, y, z); } return o; };
    // Dabs: soft lozenges of paint lying along the coat, each a little raised in the middle, its end lifted off the form
    // and a little lighter (the loaded brush). list: { p, n, dir, l, w, lift, lean, c, tip, tipTo }
    const dabs = list => {
      const pos = [], nor = [], cl = [], side = V3(), cen = V3(), rim = Array.from({ length: 6 }, () => V3()), lc = new THREE.Color(), tc = new THREE.Color();
      // (round its rim: the heel, a side, a shoulder, the tip, the other shoulder, the other side: along, across, how far lifted)
      const RIM = [[-0.44, 0, 0], [-0.04, -0.5, 0.05], [0.42, -0.36, 0.6], [0.6, 0, 1], [0.42, 0.36, 0.6], [-0.04, 0.5, 0.05]];
      for (let q = list.length - 1; q >= 0; q--) {      // (the last laid, the hair, first: it lies outermost, and what is drawn first hides the rest from the graphics card)
        const s = list[q]; side.crossVectors(s.n, s.dir).normalize();
        cen.copy(s.p).addScaledVector(s.dir, s.l * 0.08).addScaledVector(s.n, 0.0022 + s.lift * s.l * 0.2);
        RIM.forEach(([a, b, h], i) => rim[i].copy(s.p).addScaledVector(s.dir, s.l * a).addScaledVector(side, s.w * b + (s.lean || 0) * s.l * h).addScaledVector(s.n, 0.0005 + s.lift * s.l * h));
        lc.copy(s.c).multiplyScalar(1.03); if (s.tipTo) tc.copy(s.c).lerp(s.tipTo, s.tip == null ? 0.12 : s.tip); else tc.copy(s.c).multiplyScalar(1 + (s.tip == null ? 0.08 : s.tip));
        // (a fine hair needs no shoulders: heel, side, tip, side)
        const ring = s.w < 0.0075 ? [0, 1, 3, 5] : [0, 1, 2, 3, 4, 5], m = ring.length;
        for (let a = 0; a < m; a++) { const i = ring[a], j = ring[(a + 1) % m]; for (const [q, k] of [[cen, lc], [rim[i], i >= 2 && i <= 4 ? tc : s.c], [rim[j], j >= 2 && j <= 4 ? tc : s.c]]) { pos.push(q.x, q.y, q.z); nor.push(s.n.x, s.n.y, s.n.z); cl.push(k.r, k.g, k.b); } }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
      return g;
    };
    // One dab at p facing n, laid the way `flow` runs (swirled a little), in the coat's tone there.
    const D = { flow: V3(0, -0.6, -1), l: [0.018, 0.03], w: [0.009, 0.015], lift: [0.03, 0.12], lean: 0.12, jit: 0.14, pj: 0.5, swirl: 0.3, shift: 0 };
    const dab = (p, n, o) => {
      const f = (typeof o.flow === 'function' ? o.flow(p, n) : o.flow).clone(); f.addScaledVector(n, -f.dot(n)); if (f.lengthSq() < 1e-8) return null; f.normalize();
      if (o.swirl) f.applyAxisAngle(n, (R() - 0.5) * 2 * o.swirl);
      const c = o.tone(p, n, (R() - 0.5) * o.jit + o.shift, (R() - 0.5) * o.pj).clone();
      return { p, n, dir: f, l: lerp(o.l[0], o.l[1], R()), w: lerp(o.w[0], o.w[1], R()), lift: lerp(o.lift[0], o.lift[1], R()), lean: (R() - 0.5) * 2 * o.lean, c, tip: o.tip, tipTo: o.tipTo };
    };
    // A coat of them: over a lofted skin (between f[0] and f[1] along it), an ellipsoid, or round a tube; keep() leaves some out.
    const coatSkin = (at, n, o = {}) => { o = { ...D, f: [0.03, 0.97], ...o }; const list = []; for (let i = 0; i < n; i++) { const f = lerp(o.f[0], o.f[1], R()), s = at(f, R() * TAU); if (o.keep && !o.keep(s.p, s.n, f)) continue; const d = dab(s.p, s.n, o); if (d) list.push(d); } return list; };
    const coatEll = (C, Rr, n, o = {}) => {
      o = { ...D, ...o }; const list = [];
      for (let i = 0; i < n; i++) {
        const y = 1 - 2 * R(), ph = R() * TAU, s = Math.sqrt(Math.max(0, 1 - y * y)), p = V3(C[0] + Rr[0] * s * Math.cos(ph), C[1] + Rr[1] * y, C[2] + Rr[2] * s * Math.sin(ph));
        const nn = V3((p.x - C[0]) / (Rr[0] * Rr[0]), (p.y - C[1]) / (Rr[1] * Rr[1]), (p.z - C[2]) / (Rr[2] * Rr[2])).normalize();
        if (o.keep && !o.keep(p, nn)) continue; const d = dab(p, nn, o); if (d) list.push(d);
      }
      return list;
    };
    const coatLimb = (a, b, ra, rb, n, o = {}) => {
      o = { ...D, flow: V3(0, -1, 0), ...o };
      const A = V3(...a), Bv = V3(...b), ax = Bv.clone().sub(A), len = ax.length(); ax.normalize();
      const e1 = V3().crossVectors(ax, Math.abs(ax.z) < 0.9 ? V3(0, 0, 1) : V3(1, 0, 0)).normalize(), e2 = V3().crossVectors(ax, e1), list = [];
      for (let i = 0; i < n; i++) {
        const t = R(), ph = R() * TAU, nn = e1.clone().multiplyScalar(Math.cos(ph)).addScaledVector(e2, Math.sin(ph));
        const p = A.clone().addScaledVector(ax, t * len).addScaledVector(nn, lerp(ra, rb, t)); if (o.keep && !o.keep(p, nn, t)) continue;
        const d = dab(p, nn, o); if (d) list.push(d);
      }
      return list;
    };
    const coatTube = (g, n, o = {}) => { o = { ...D, ...o }; const list = []; for (let i = 0; i < n; i++) { const s = g.userData.at(lerp(o.f ? o.f[0] : 0.02, o.f ? o.f[1] : 0.98, R()), R() * TAU); if (o.keep && !o.keep(s.p, s.n)) continue; const d = dab(s.p, s.n, { ...o, flow: o.flow || s.tan }); if (d) list.push(d); } return list; };

    // ---------------------------------------------------------- his colours, and his light on them
    const T4 = (hi, mid, lo, deep, a) => ({ hi: col(hi, a), mid: col(mid, a), lo: col(lo, a), deep: col(deep, a) });
    const Wh = T4('#dfd4bc', '#c2b69b', '#958a74', '#685e4e'), Br = T4('#b47e4b', '#925b2d', '#683c1f', '#402314');            // the red and white cow
    const Bu = T4('#7d4f35', '#553122', '#341e16', '#1d100c'), Bs = T4('#a06d46', '#6f452c', '#43281c', '#25150e');            // the young bull, and where the light warms him
    const Dc = T4('#6b4a33', '#42291d', '#281812', '#150c09'), Ds = T4('#9c7249', '#64412a', '#3a2419', '#20130d');            // the dark cow, and her sheen
    const Pk = T4('#c19a8e', '#a0756a', '#74504a', '#4a332f', 0.12), Bg = T4('#8e6f62', '#66493f', '#42302a', '#261b18', 0.12), Hn = T4('#d2c19a', '#b19c72', '#7c6a4a', '#4a3c2a', 0.12), Hf = T4('#6b5a47', '#3c3027', '#261e18', '#15100c', 0.1);
    const Nz = T4('#6c6058', '#3a302c', '#221b19', '#120e0d', 0.1);                                                            // a dark wet nose
    const TMP = new THREE.Color();
    const tone4 = (T, k, into) => (k < -0.25 ? into.copy(T.deep).lerp(T.lo, ss(k, -0.9, -0.25)) : k < 0.3 ? into.copy(T.lo).lerp(T.mid, ss(k, -0.25, 0.3)) : into.copy(T.mid).lerp(T.hi, ss(k, 0.3, 0.95)));
    // A coat: two ramps and the marking that chooses between them (pat: 0 the first .. 1 the second), lit from key; and
    // never one even tone: broken a little everywhere, as he breaks it (the lie of the hair, the form under it).
    const coat = (A, B, pat, key, mot = 0.34, f = 17) => (p, n, j = 0, pj = 0, into = new THREE.Color()) => {
      const k = n.dot(key) * 0.92 + 0.1 * n.y + j + (n3(p.x * f + 3.1, p.y * f + 1.7, p.z * f + 5.3) - 0.5) * mot; tone4(A, k, into);
      if (B) { let q = pat(p, n); if (pj) q = ss(q + pj, 0.3, 0.7); if (q > 0.002) into.lerp(tone4(B, k, TMP), q); }
      return into;
    };
    const plain = (T, key) => coat(T, null, null, key);

    // ---------------------------------------------------------- one animal: its fourteen parts
    // o: { key (his light, in its own terms as it stands at the end), keyHead, body, legs, head (coats), shag (0 close-coated
    //      .. 1 shaggy), horn (its curve and thickness), udder, bone (how much the hips stand out), n (how many dabs: a factor) }
    const animal = o => {
      const G = {}, sh = o.shag, nn = o.n, key = o.key, PJ = o.pj == null ? 0.5 : o.pj;
      // (the smooth form under the coat is only a core: a shade darker than the paint over it, so that where a gap is left
      // between two touches it reads as the shadow between them, never as a bare surface)
      const vp = (g, fn) => vpaint(g, (v, n) => fn(v, n).multiplyScalar(0.94));
      const lng = (a, b) => [a * (1 + 0.6 * sh), b * (1 + 0.8 * sh)], up = (a, b) => [a * (0.5 + 0.5 * sh) + 0.08 * sh, b * (0.5 + 0.5 * sh) + 0.3 * sh];
      // ---- the trunk, from its middle: square quarters and a high tail head, the hips' points, a deep belly, the
      // chest between the elbows, the brisket; the hair running back and down
      {
        const bl = o.belly || 1, hp = 1 + 0.06 * o.bone, ch = o.chest || 1;
        const ST = [[-0.27, 0.06, 0, 0, 0, 2], [-0.258, 0.052, 0.052, 0.045, 0.08, 2.2], [-0.225, 0.032, 0.092 * hp, 0.086, 0.12, 2.6], [-0.17, 0.016, 0.112 * hp, 0.1, 0.142, 2.7], [-0.09, 0, 0.12, 0.098, 0.154 * bl, 2.4],
          [0, -0.005, 0.13 * bl, 0.097, 0.162 * bl, 2.3], [0.09, 0, 0.122, 0.1, 0.158 * bl, 2.3], [0.16, 0.005, 0.106 * ch, 0.108, 0.158, 2.3], [0.22, 0, 0.088 * ch, 0.102, 0.156, 2.2], [0.268, -0.014, 0.06, 0.08, 0.13, 2.1], [0.295, -0.022, 0, 0, 0, 2]];
        const body = o.body, bt = (v, n) => body(v, n);
        const parts = [vp(loft(ST, 22, 18), bt)];
        const bumps = [[[0, 0.1, 0.18], [0.05, 0.03, 0.07]], [[0, 0.086, -0.232], [0.044, 0.022, 0.04]]];
        for (const s of [-1, 1]) bumps.push([[s * 0.09 * hp, 0.078, -0.15], [0.03 + 0.008 * o.bone, 0.03, 0.045]], [[s * 0.084 * ch, -0.02, 0.195], [0.038, 0.1, 0.06]]);
        for (const [C, Rr] of bumps) parts.push(vp(ell(C, Rr), bt));
        const flow = (p, n) => V3(0.25 * Math.sign(p.x) * Math.max(0, n.y), -0.5 - 0.5 * ss(-p.z, 0.12, 0.23), -1 + 0.8 * ss(-p.z, 0.14, 0.25));
        const at = skinAt(ST), ws = [];
        // (an undercoat of broad soft dabs that closes the form, then the hair over it: finer, lighter where it catches)
        const seen = (p, n) => (!o.far || n.x * o.far < 0.3 || R() < 0.22) && (n.y > -0.55 || R() < 0.4) && (!o.hid || p.z > -0.02 || R() < o.hid);      // (few on the side kept to the wall, underneath, and on what stands hidden behind another)
        ws.push(...coatSkin(at, Math.round(640 * nn), { tone: body, flow, l: lng(0.03, 0.046), w: [0.017, 0.025], lift: up(0.01, 0.07), swirl: 0.3 + 0.5 * sh, tip: 0.02 + 0.05 * sh, pj: PJ, keep: seen }));
        ws.push(...coatSkin(at, Math.round(280 * nn), { tone: body, flow, l: lng(0.016, 0.03), w: [0.0035, 0.007], lift: up(0.03, 0.16), swirl: 0.4 + 0.7 * sh, pj: PJ, shift: 0.05, jit: 0.2 + 0.08 * sh, tip: 0.1, keep: seen }));
        for (const [C, Rr] of bumps) ws.push(...coatEll(C, Rr, Math.round(15 * nn), { tone: body, flow, l: lng(0.026, 0.04), w: [0.014, 0.022], lift: up(0.01, 0.07), tip: 0.03, pj: PJ, keep: (p, n) => n.y > -0.3 && seen(p, n) }));
        // along the spine and under the belly the hair stands off the form: a soft broken edge against the wall
        ws.push(...coatSkin(at, Math.round(70 * nn), { tone: body, f: [0.08, 0.95], keep: (p, n) => n.y > 0.86, flow: V3(0, 0, -1), l: lng(0.016, 0.026), w: [0.004, 0.008], lift: up(0.12, 0.3), swirl: 0.5, pj: PJ }));
        ws.push(...coatSkin(at, Math.round(40 * nn), { tone: body, f: [0.2, 0.92], keep: (p, n) => n.y < -0.8, flow: V3(0, -1, -0.3), l: lng(0.02, 0.036), w: [0.005, 0.009], lift: up(0.2, 0.5), swirl: 0.4, shift: -0.05 }));
        if (o.udder) {
          const ut = (v, n) => tone4(o.bag, n.dot(key) * 0.8 + 0.05 + 0.3 * n.y, new THREE.Color());
          parts.push(vp(ell([0, -0.166, -0.12], [0.046, 0.03, 0.054]), ut));
          ws.push(...coatEll([0, -0.166, -0.12], [0.046, 0.03, 0.054], Math.round(18 * nn), { tone: (p, n, j) => tone4(o.bag, n.dot(key) * 0.8 + 0.05 + 0.3 * n.y + j, new THREE.Color()), keep: (p, n) => n.y < 0.2, flow: V3(0, -1, 0), l: [0.014, 0.024], w: [0.008, 0.013], lift: [0, 0.04], swirl: 0.3, tip: 0.04 }));
          for (const [x, z] of [[0.022, -0.1], [-0.022, -0.1], [0.02, -0.14], [-0.02, -0.14]]) parts.push(vp(ell([x, -0.194, z], [0.006, 0.01, 0.006], GREY, 0), ut));
        }
        parts.unshift(dabs(ws));
        G.trunk = shape.merge(parts);
      }
      // ---- the neck, from where it leaves the shoulders, along +z to the poll: deep, the dewlap hanging under it
      {
        const ST = [[-0.05, -0.02, 0, 0, 0, 2], [-0.025, -0.02, 0.066, 0.076, 0.11, 2.2], [0.02, -0.016, 0.072 * o.neck, 0.086 * o.neck, 0.128, 2.2], [0.07, -0.008, 0.064 * o.neck, 0.072 * o.neck, 0.106, 2.2], [0.12, -0.002, 0.057 * o.neck, 0.058, 0.082, 2.2], [0.17, 0.002, 0.052, 0.048, 0.064, 2.2], [0.2, 0.002, 0, 0, 0, 2]];
        const tn = o.neckCoat, at = skinAt(ST), flow = (p, n) => V3(0, -1, -0.55);
        const ws = coatSkin(at, Math.round(150 * nn), { tone: tn, flow, l: lng(0.028, 0.042), w: [0.015, 0.023], lift: up(0.02, 0.12), swirl: 0.3 + 0.5 * sh });
        ws.push(...coatSkin(at, Math.round(76 * nn), { tone: tn, flow, l: lng(0.016, 0.028), w: [0.0035, 0.007], lift: up(0.05, 0.22), swirl: 0.5 + 0.6 * sh, shift: 0.05, jit: 0.2 + 0.08 * sh, tip: 0.1 }));
        ws.push(...coatSkin(at, Math.round(36 * nn), { tone: tn, f: [0.15, 0.9], keep: (p, n) => n.y < -0.7 || n.y > 0.88, flow: (p, n) => V3(0, Math.sign(n.y) * 0.6, -0.6), l: lng(0.02, 0.036), w: [0.005, 0.009], lift: up(0.2, 0.5), swirl: 0.5 }));
        G.neck = shape.merge([dabs(ws), vp(loft(ST, 10, 12), (v, n) => tn(v, n))]);
      }
      // ---- the head, from the poll, +z down the face, measured against his: a broad curly brow; the eye set out on the
      // corner of it in a bony socket, under a heavy lid; a short face, dished between brow and nose, deep at the cheek;
      // a blunt moist muzzle, the nostrils two soft darks; the horns; the ears held out below them
      {
        const mz = o.muzzle || 1;
        const ST = [[-0.028, 0.002, 0, 0, 0, 2], [-0.016, 0.002, 0.042, 0.034, 0.034, 2.2], [0, 0, 0.064, 0.044, 0.044, 2.4], [0.03, -0.003, 0.068, 0.042, 0.048, 2.4], [0.058, -0.012, 0.051, 0.032, 0.044, 2.3],
          [0.086, -0.02, 0.042 * mz, 0.027, 0.036, 2.3], [0.112, -0.023, 0.041 * mz, 0.028, 0.032, 2.5], [0.134, -0.023, 0.045 * mz, 0.031, 0.031, 2.8], [0.148, -0.024, 0.044 * mz, 0.03, 0.029, 2.9], [0.156, -0.025, 0, 0, 0, 2]];
        const kh = o.keyHead, ht = o.head, nose = o.nose, EY = [0.0535, 0.011, 0.041], DARK = col('#1d130d', 0.05);
        const noseAmt = v => ss(v.z, 0.133, 0.146) * (1 - ss(v.y, -0.01, 0.004));
        const nostril = v => 1 - ss(Math.hypot(Math.abs(v.x) - 0.021 * mz, (v.y + 0.02) * 1.4, (v.z - 0.151) * 0.9), 0.0035, 0.0125);
        const socket = v => 1 - ss(Math.hypot(Math.abs(v.x) - EY[0], (v.y - EY[1] - 0.003) * 1.15, (v.z - EY[2]) * 0.8), 0.009, 0.03);
        // (the face's tone anywhere on it: the coat; the socket's own colour round the eye; the nose's pad; the nostrils)
        const face = (p, n, j = 0, pj = 0, into = new THREE.Color()) => {
          ht(p, n, j, pj, into); const sk = socket(p), q = noseAmt(p); if (sk > 0) into.lerp(o.rim, o.rimK * sk);
          if (q > 0) { into.lerp(tone4(nose, n.dot(kh) * 0.8 + 0.2 + j, TMP), q); const nq = nostril(p); if (nq > 0) into.lerp(DARK, 0.86 * nq); }
          return into;
        };
        const parts = [vp(loft(ST, 22, 16), (v, n) => face(v, n))], ws = [];
        for (const s of [-1, 1]) {
          const BR = [[s * 0.05, 0.03, 0.034], [0.018, 0.0095, 0.022]], LL = [[s * 0.0515, EY[1] - 0.0108, EY[2] + 0.001], [0.0112, 0.0052, 0.0142]];
          parts.push(vp(ell(...BR, GREY, 1), (v, n) => face(v, n, 0.06)));                                                             // the brow's bone over the eye
          parts.push(vp(ell(...LL, GREY, 1), (v, n) => face(v, n, -0.08)));                                                            // the lower lid
          parts.push(flat(ell([s * EY[0], EY[1], EY[2]], [0.0098, 0.0092, 0.0122], GREY, 1), DARK));                                    // the eye, dark, in their shadow
          parts.push(flat(ell([s * (EY[0] + 0.009), EY[1] - 0.0018, EY[2] + 0.0045], [0.0016, 0.0018, 0.002], GREY, 0), col('#cfc6b4', 0.05)));     // and its one small light
          ws.push(...coatEll(...BR, 9, { tone: (q, n, j, pj) => face(q, n, j + 0.06, pj), keep: (q, n) => n.y > -0.2, flow: V3(s, 0, 0.4), l: lng(0.012, 0.02), w: [0.007, 0.011], lift: up(0.02, 0.1), swirl: 0.5, tip: 0.05 }));
          ws.push(...coatEll(...LL, 5, { tone: (q, n, j, pj) => face(q, n, j - 0.06, pj), keep: (q, n) => n.y < 0.3 && n.x * s > 0, flow: V3(0, -1, 0.3), l: [0.008, 0.013], w: [0.005, 0.008], lift: [0, 0.03], swirl: 0.4, tip: 0.03 }));
          // a horn
          const hpts = o.horn.pts.map(([x, y, z]) => [s * x, y, z]), hl = hpts.reduce((a, q, i) => (i ? a + Math.hypot(q[0] - hpts[i - 1][0], q[1] - hpts[i - 1][1], q[2] - hpts[i - 1][2]) : 0), 0);
          const hg = tube(hpts, t => o.horn.r * (1 - 0.78 * t * t) + 0.0015, 6, 7);
          const horn = (v, n, j = 0) => { const t = clamp01(Math.hypot(v.x - hpts[0][0], v.y - hpts[0][1], v.z - hpts[0][2]) / (hl * 0.8)); return tone4(Hn, n.dot(kh) * 0.8 + 0.2 + j, new THREE.Color()).lerp(Hf.lo, ss(t, o.horn.dark, 1)); };
          parts.push(vp(hg, (v, n) => horn(v, n))); ws.push(...coatTube(hg, 12, { tone: horn, l: [0.014, 0.024], w: [0.007, 0.011], lift: [0, 0.03], swirl: 0.2, jit: 0.3, tip: 0.06 }));
        }
        const at = skinAt(ST);
        const flow = (p, n) => (n.y > 0.45 ? V3(0, 0, 1) : V3(0, -1, -0.3));
        ws.push(...coatSkin(at, Math.round(230 * nn), { tone: face, flow, f: [0.05, 0.8], l: lng(0.017, 0.027), w: [0.012, 0.018], lift: up(0.01, 0.06), swirl: 0.3 + 0.5 * sh, tip: 0.03 }));
        // (the muzzle: small close touches, round to the lips)
        ws.push(...coatSkin(at, Math.round(90 * nn), { tone: face, flow: V3(0, -0.3, 1), f: [0.78, 0.985], l: [0.01, 0.016], w: [0.008, 0.012], lift: [0, 0.04], swirl: 0.6, jit: 0.2, tip: 0.06 }));
        ws.push(...coatSkin(at, Math.round(84 * nn), { tone: face, flow, f: [0.05, 0.88], l: lng(0.01, 0.018), w: [0.003, 0.0055], lift: up(0.03, 0.14), swirl: 0.5 + 0.6 * sh, shift: 0.05, jit: 0.2 + 0.08 * sh, tip: 0.1 }));
        // the forelock: curls standing off the poll and the brow
        ws.push(...coatSkin(at, Math.round(o.lock * nn), { tone: ht, f: [0.04, 0.32], keep: (p, n) => n.y > 0.45, flow: () => V3(R() - 0.5, 0, R() - 0.2), l: [0.018, 0.032], w: [0.008, 0.013], lift: [0.25, 0.75], swirl: 1.4, shift: 0.1, jit: 0.3 }));
        parts.unshift(dabs(ws));
        G.head = shape.merge(parts);
        // the jaw, from its hinge under the ear: as wide as the cheek it is, deep at the jowl, rising to a square chin
        const JS = [[-0.014, -0.012, 0, 0, 0, 2], [0, -0.022, 0.05, 0.026, 0.034, 2.3], [0.03, -0.025, 0.046, 0.024, 0.031, 2.3], [0.066, -0.027, 0.036, 0.018, 0.022, 2.3], [0.096, -0.027, 0.032 * mz, 0.014, 0.017, 2.5], [0.12, -0.026, 0.036 * mz, 0.013, 0.016, 2.8], [0.133, -0.026, 0.034 * mz, 0.012, 0.014, 2.8], [0.14, -0.026, 0, 0, 0, 2]];
        const jat = skinAt(JS), jt = o.jaw || ht, lip = v => ss(v.z, 0.098, 0.118) * ss(v.y, -0.036, -0.02);
        const chin = (p, n, j = 0, pj = 0, into = new THREE.Color()) => { jt(p, n, j, pj, into); const q = lip(p); return q > 0 ? into.lerp(tone4(nose, n.dot(kh) * 0.8 - 0.1 + j, TMP), q * o.lipK) : into; };
        const js = coatSkin(jat, Math.round(72 * nn), { tone: chin, flow: V3(0, -0.5, -1), f: [0.08, 0.72], keep: (p, n) => n.y < -0.05, l: lng(0.016, 0.026), w: [0.011, 0.017], lift: up(0.0, 0.05), swirl: 0.4, tip: 0.03 });
        js.push(...coatSkin(jat, Math.round(40 * nn), { tone: chin, flow: V3(0, -0.4, 1), f: [0.7, 0.98], keep: (p, n) => n.y < 0.2, l: [0.01, 0.016], w: [0.008, 0.012], lift: [0, 0.04], swirl: 0.6, jit: 0.2, tip: 0.04 }));
        G.jaw = shape.merge([dabs(js), vp(loft(JS, 10, 12), (v, n) => chin(v, n))]);
        // the upper lids, both: heavy, under paint like the rest, a dark line of lashes along their edge. They come down.
        {
          const parts = [], ls = [];
          for (const s of [-1, 1]) {
            const C = [s * (EY[0] - 0.0012), EY[1] + 0.0105, EY[2]], Rr = [0.0118, 0.0098, 0.0158], lt = (q, n, j = 0, pj = 0) => face(q, n, j + 0.04, pj).lerp(o.rim, 0.25 * o.rimK).lerp(DARK, 0.75 * ss(C[1] - q.y, 0.0045, 0.0085));
            parts.push(vp(ell(C, Rr, GREY, 1), (v, n) => lt(v, n)));
            ls.push(...coatEll(C, Rr, 12, { tone: lt, keep: (q, n) => n.x * s > -0.1 && n.y > -0.75, flow: V3(0, -1, 0.3), l: [0.009, 0.014], w: [0.006, 0.009], lift: [0, 0.03], swirl: 0.4, tip: 0.03 }));
          }
          parts.unshift(dabs(ls)); G.lids = shape.merge(parts);
        }
        // an ear, the left, from its root: a broad hairy leaf held out sideways, paler inside
        const ec = [0.04, 0, 0], er = [0.04, 0.021, 0.0075], et = o.ear || ht, inner = o.earIn;
        const es = coatEll(ec, er, Math.round(36 * nn), { tone: (p, n, j, pj) => (n.z > 0.2 ? tone4(inner, n.dot(kh) * 0.6 + 0.2 + j, new THREE.Color()) : et(p, n, j, pj)), flow: V3(1, -0.2, 0), l: lng(0.018, 0.03), w: [0.009, 0.014], lift: up(0.04, 0.2), swirl: 0.4 });
        es.push(...coatEll(ec, er, Math.round(20 * nn), { tone: (p, n, j) => tone4(inner, 0.3 + j, new THREE.Color()), keep: (p, n) => Math.abs(n.z) < 0.5, flow: (p, n) => V3(0.4, n.y, 0), l: [0.012, 0.022], w: [0.003, 0.006], lift: [0.2, 0.6], swirl: 0.5 }));
        G.earL = shape.merge([dabs(es), vp(ell(ec, er, GREY, 1), (v, n) => (n.z > 0.2 ? tone4(inner, n.dot(kh) * 0.6 + 0.1, new THREE.Color()) : et(v, n).clone()))]);
        G.earR = mirror(G.earL);
      }
      // ---- the legs, each bone from its own joint down -y. Fore: the forearm, muscled where it leaves the chest, and
      // the cannon down to a cloven hoof. Hind: the quarter and gaskin as one, down to the hock, and the cannon.
      {
        const lt = o.legs, hoof = (v, n) => tone4(Hf, n.dot(key) * 0.8 + 0.2, new THREE.Color());
        const foot = (y0, len) => {      // a cannon from y0 down, the fetlock, the pastern and the hoof; len: to the ground
          const y1 = -len;
          const p = [vp(limb([0, y0, 0], [0, y1 + 0.05, 0.002], 0.022, 0.0185), (v, n) => lt.lo(v, n)), vp(ell([0, y1 + 0.046, 0.001], [0.022, 0.019, 0.024], GREY, 1), (v, n) => lt.lo(v, n)),
            vp(limb([0, y1 + 0.04, 0.002], [0, y1 + 0.022, 0.007], 0.019, 0.022), (v, n) => lt.lo(v, n))];
          for (const s of [-1, 1]) p.push(vp(shape.move(shape.lathe([[0.0185, 0], [0.018, 0.012], [0.015, 0.024], [0.0001, 0.026]], 7), s * 0.0115, y1, 0.01, 0.16, 0, 0, 0.82, 1, 1.25), hoof));      // the two toes
          for (const s of [-1, 1]) p.push(vp(ell([s * 0.009, y1 + 0.04, -0.017], [0.006, 0.008, 0.006], GREY, 0), hoof));                                                                              // the dew claws
          const ws = coatLimb([0, y0, 0], [0, y1 + 0.05, 0.002], 0.022, 0.0185, Math.round(46 * nn), { tone: lt.lo, l: lng(0.018, 0.028), w: [0.01, 0.015], lift: up(0.01, 0.08), swirl: 0.25 });
          for (const sd of [-1, 1]) ws.push(...coatLimb([sd * 0.0115, y1 + 0.026, 0.012], [sd * 0.0115, y1 + 0.002, 0.012], 0.014, 0.0185, 6, { tone: (q, n, j) => tone4(Hf, n.dot(key) * 0.8 + 0.2 + j, new THREE.Color()), l: [0.014, 0.022], w: [0.01, 0.014], lift: [0, 0.02], swirl: 0.15, jit: 0.3, tip: 0.05 }));
          ws.push(...coatLimb([0, y1 + 0.07, 0], [0, y1 + 0.028, 0.004], 0.021, 0.023, Math.round(26 * nn), { tone: lt.lo, keep: (q, n) => n.z < 0.4, l: lng(0.014, 0.022), w: [0.006, 0.01], lift: up(0.1, 0.4), swirl: 0.4 }));
          p.unshift(dabs(ws)); return p;
        };
        // fore
        {
          const a = LEN[1][0], f = lt.upF;
          const p = [vp(limb([0, 0.03, -0.004], [0, -a, 0], 0.036, 0.022), (v, n) => f(v, n)), vp(ell([0, -0.012, -0.006], [0.034, 0.052, 0.042]), (v, n) => f(v, n)), vp(ell([0, -a, 0.004], [0.0225, 0.024, 0.0235], GREY, 1), (v, n) => f(v, n))];
          const ws = coatLimb([0, 0.03, -0.004], [0, -a, 0], 0.038, 0.023, Math.round(56 * nn), { tone: f, l: lng(0.024, 0.036), w: [0.013, 0.019], lift: up(0.02, 0.12), swirl: 0.3 + 0.4 * sh });
          ws.push(...coatLimb([0, 0.02, -0.004], [0, -a, 0], 0.039, 0.024, Math.round(16 * nn), { tone: f, l: lng(0.012, 0.022), w: [0.003, 0.006], lift: up(0.05, 0.2), swirl: 0.5, shift: 0.05, jit: 0.2 }));
          p.unshift(dabs(ws)); G.upF = shape.merge(p);
          G.loF = shape.merge(foot(0, LEN[1][1]));
        }
        // hind
        {
          const a = LEN[0][0], f = lt.upH, TH = [[0, -0.062, 0.022], [0.05, 0.105, 0.086]];
          const p = [vp(ell(...TH, GREY, 2), (v, n) => f(v, n)), vp(limb([0, -0.1, 0.018], [0, -a, 0], 0.04, 0.021), (v, n) => f(v, n)), vp(ell([0, -a + 0.004, -0.006], [0.021, 0.026, 0.026], GREY, 1), (v, n) => f(v, n))];
          const ws = coatEll(...TH, Math.round(100 * nn), { tone: f, flow: V3(0, -1, -0.35), l: lng(0.028, 0.042), w: [0.015, 0.023], lift: up(0.02, 0.1), swirl: 0.3 + 0.4 * sh });
          ws.push(...coatEll(...TH, Math.round(32 * nn), { tone: f, flow: V3(0, -1, -0.35), l: lng(0.014, 0.026), w: [0.0035, 0.0065], lift: up(0.04, 0.2), swirl: 0.5, shift: 0.05, jit: 0.2 + 0.08 * sh, tip: 0.1 }));
          ws.push(...coatLimb([0, -0.1, 0.018], [0, -a, 0], 0.041, 0.022, Math.round(44 * nn), { tone: f, l: lng(0.02, 0.032), w: [0.011, 0.017], lift: up(0.02, 0.12), swirl: 0.3 + 0.4 * sh }));
          p.unshift(dabs(ws)); G.upH = shape.merge(p);
          G.loH = shape.merge(foot(0, LEN[0][1]));
        }
      }
      // ---- the tail: two lengths from the tail head down, and the switch
      {
        const tt = o.tail || o.body2, sw = o.switch;
        const seg = (len, r0, r1, n) => shape.merge([vp(limb([0, 0.006, 0], [0, -len, 0], r0, r1, GREY, 8, 2), (v, q) => tt(v, q)), dabs(coatLimb([0, 0, 0], [0, -len, 0], r0, r1, Math.round(n * nn), { tone: tt, l: [0.02, 0.032], w: [0.009, 0.014], lift: [0.02, 0.12], swirl: 0.3 }))]);
        G.tail1 = seg(TLEN[0], 0.0135, 0.0095, 18); G.tail2 = seg(TLEN[1], 0.0095, 0.0075, 14);
        const st = (p, n, j) => tone4(sw, n.dot(key) * 0.7 + 0.15 + j, new THREE.Color());
        const ws = coatEll([0, -0.05, 0], [0.014, 0.05, 0.014], Math.round(44 * nn), { tone: st, flow: V3(0, -1, 0), l: [0.03, 0.055], w: [0.004, 0.008], lift: [0.05, 0.3], lean: 0.2, swirl: 0.25, jit: 0.3 });
        G.tuft = shape.merge([dabs(ws), vp(ell([0, -0.045, 0], [0.012, 0.046, 0.012]), (v, n) => st(v, n, 0))]);
      }
      return G;
    };

    // ---------------------------------------------------------- the three of them
    const Y = V3(0, 1, 0), X = V3(1, 0, 0);
    const defs = [];
    const ways = {};
    // (where the room's corner is, along the wall to the left of the picture)
    const R0 = L.room, west = this.west = R0 ? Math.min(...[[R0.x0, R0.z0], [R0.x1, R0.z0], [R0.x0, R0.z1], [R0.x1, R0.z1]].map(([x, z]) => L.local(x, z).u)) : -9, corner = this.corner = west > -1.25 && west < -0.9;
    for (const id of ['dark', 'pied', 'bull']) {
      const pts = id === 'dark' && corner ? WAYS.darkWest.map(([u, o], i) => [i < 2 ? u + west + 0.98 : u, o]) : WAYS[id];
      const c = new THREE.CatmullRomCurve3(pts.map(([u, o]) => V3(u, 0, o)), false, 'centripetal'); c.arcLengthDivisions = 300; c.updateArcLengths();
      const tg = c.getTangentAt(1, V3()), y0 = Math.atan2(tg.x, tg.z), swing = id === 'dark' ? [corner ? 0.55 : 0.78, DARK_END - y0] : null; ways[id] = { curve: c, len: c.getLength(), swing, yaw: y0 + (swing ? swing[1] : 0), west: id === 'dark' && corner };
    }
    const keyOf = (yaw, hy = 0, hp = 0) => { const k = KEY_S.clone().applyAxisAngle(Y, -yaw); return [k, k.clone().applyAxisAngle(Y, -hy).applyAxisAngle(X, -hp)]; };
    // -- the red and white cow: her markings, as he has them on the side she shows (a red neck and shoulder, a ragged
    // saddle running down the flank in streaks, the quarter red; white between, and all under)
    {
      const [key, keyHead] = keyOf(ways.pied.yaw, 0.85, 0.5);
      const blobs = [[0.075, 0.03, 0.23, 0.11, 0.12, 0.085], [0.05, 0.085, 0.02, 0.13, 0.075, 0.11], [0.115, -0.02, -0.045, 0.06, 0.085, 0.05], [0.09, 0.04, -0.215, 0.1, 0.115, 0.085], [0.11, -0.03, 0.13, 0.05, 0.06, 0.035]];
      const pat = p => {
        let m = -1; const ax = Math.abs(p.x) + (p.x < 0 ? 0.015 : 0);
        for (const b of blobs) m = Math.max(m, 1 - (((ax - b[0]) / b[3]) ** 2 + ((p.y - b[1]) / b[4]) ** 2 + ((p.z - b[2] - (p.x < 0 ? 0.03 : 0)) / b[5]) ** 2));
        return ss(m + (fbm(p, 16) - 0.5) * 1.1 + (n3(p.x * 60, p.y * 14, p.z * 60) - 0.5) * 0.4, -0.1, 0.12) * (1 - ss(-p.y, 0.085, 0.13));
      };
      const body = coat(Wh, Br, pat, key);
      const neckPat = p => ss(0.5 + (fbm(p, 14) - 0.5) * 1.2 + p.y * 9 - ss(p.z, 0.11, 0.17) * 0.9, 0.2, 0.45);        // red, going white under the throat and up to the cheek
      const legPat = (hi, lo, f) => p => ss((fbm(p, f) - 0.5) * 1.3 + ss(p.y, lo, hi) * 0.9, 0.2, 0.42);
      const GB = col('#8f7c66', 0.15), whiteH = plain(Wh, keyHead), face = coat(Wh, Br, q => ss(-q.z + (fbm(q, 30) - 0.5) * 0.03, 0.006, 0.02) * ss(Math.abs(q.x), 0.02, 0.04) * 0.85, keyHead);
      defs.push({ id: 'pied', k: 1.2, n: 0.82, o: { key, keyHead, body, body2: body, far: -1, hid: 0, shag: 0.08, bone: 0.6, belly: 1.03, chest: 1, neck: 1, udder: true, lock: 46, muzzle: 1, rim: col('#a98c72', 0.12), rimK: 0.62, lipK: 0.42, bag: Pk, pj: 0.5,
        neckCoat: coat(Wh, Br, neckPat, key), jaw: whiteH, nose: Pk,
        // (her face: white; a grey-brown bloom on the cheek and down the nose, as he has it)
        head: (p, n, j = 0, pj = 0, into = new THREE.Color()) => { face(p, n, j, pj, into); const g = Math.max(ss(-p.y, 0.0, 0.03) * ss(p.z, 0.03, 0.06) * (1 - ss(p.z, 0.1, 0.125)), 0.5 * ss(p.z, 0.085, 0.125)) * (0.35 + 0.65 * fbm(p, 55)); return g > 0 ? into.lerp(GB, 0.42 * g) : into; },
        ear: coat(Wh, Br, p => ss(p.x + (fbm(p, 40) - 0.5) * 0.03, 0.004, 0.02), keyHead), earIn: Wh,
        horn: { pts: [[0.036, 0.034, -0.014], [0.06, 0.052, -0.012], [0.073, 0.056, 0.008], [0.068, 0.04, 0.026], [0.058, 0.028, 0.03]], r: 0.0125, dark: 0.55 },      // (thick at the root, hooked forward and down)
        legs: { upF: coat(Wh, Br, legPat(-0.02, -0.11, 22), key), lo: coat(Wh, Br, p => ss((fbm(p, 26) - 0.5) + ss(p.y, -0.03, 0.0) * 0.5, 0.26, 0.4) * 0.8, key), upH: coat(Wh, Br, legPat(-0.02, -0.15, 18), key) },
        tail: coat(Wh, Br, p => ss(p.y + (fbm(p, 20) - 0.5) * 0.1, -0.09, -0.03), key), switch: Wh } });
    }
    // -- the young bull: dark red-brown and shaggy, warm where the light is on him, a white curly blaze, white flecks on a cheek
    {
      const [key, keyHead] = keyOf(ways.bull.yaw, 0.1, 0.6);
      const warm = (p, n) => clamp01((fbm(p, 9) - 0.25) * 1.4) * ss(n.dot(key), -0.2, 0.7);
      const body = coat(Bu, Bs, warm, key), bodyH = coat(Bu, Bs, (p, n) => clamp01((fbm(p, 22) - 0.3) * 1.3) * ss(n.dot(keyHead), -0.2, 0.7), keyHead);
      const blaze = p => Math.max(ss(p.y + (fbm(p, 60) - 0.5) * 0.02, 0.012, 0.026) * (1 - ss(Math.abs(p.x) + (fbm(p, 45) - 0.5) * 0.04 + Math.max(0, p.z - 0.034) * 0.75 - 0.03 * (1 - ss(p.z, 0.012, 0.034)) * ss(p.z, -0.004, 0.012), 0.014, 0.034)) * (1 - ss(p.z, 0.075, 0.11)),
        p.x > 0.02 && p.z > 0.075 && p.z < 0.128 && p.y < -0.005 ? ss(n3(p.x * 90, p.y * 90, p.z * 90), 0.58, 0.7) : 0);
      const face = coat(Bu, Wh, blaze, keyHead);
      defs.push({ id: 'bull', k: 1.2, n: 0.46, o: { key, keyHead, body, body2: body, far: 0, hid: 0.4, shag: 0.7, bone: 0, belly: 0.94, chest: 1.08, neck: 1.2, udder: false, lock: 80, muzzle: 1.06, rim: Bs.hi, rimK: 0.75, lipK: 0.8, bag: Bg, pj: 0.16,
        neckCoat: body, head: (p, n, j = 0, pj = 0, into = new THREE.Color()) => { face(p, n, j, pj, into); const m = ss(p.z, 0.09, 0.118) * (1 - ss(p.z, 0.126, 0.138)); return m > 0 ? into.lerp(Bs.hi, 0.6 * m) : into; }, jaw: coat(Bu, Bs, p => ss(p.z, 0.06, 0.1), keyHead), nose: Nz, ear: bodyH, earIn: Bs,
        horn: { pts: [[0.042, 0.034, -0.012], [0.072, 0.04, -0.014], [0.098, 0.054, -0.012], [0.112, 0.074, -0.006]], r: 0.0145, dark: 0.7 },
        legs: { upF: body, lo: coat(Bu, Bs, p => 0.35, key), upH: body }, switch: Bu } });
    }
    // -- the dark cow, from behind: nearly black in the shade, a brown sheen where she turns to the light, her muzzle white
    {
      const [key, keyHead] = keyOf(ways.dark.yaw, -1.2, 0.5);
      const sheen = (p, n) => clamp01((fbm(p, 7) - 0.2) * 1.5) * ss(n.dot(key), 0.0, 0.75);
      const body = coat(Dc, Ds, sheen, key), bodyH = coat(Dc, Ds, (p, n) => 0.5 * ss(n.dot(keyHead), 0, 0.7), keyHead);
      defs.push({ id: 'dark', k: 1.3, n: 0.44, o: { key, keyHead, body, body2: body, far: 1, hid: 0, shag: 0.4, bone: 1, belly: 1.05, chest: 0.98, neck: 1, udder: true, lock: 30, muzzle: 1, rim: Ds.hi, rimK: 0.6, lipK: 0.6, bag: Hf, pj: 0.16,
        neckCoat: body, head: coat(Dc, Wh, p => ss(p.z + (fbm(p, 50) - 0.5) * 0.03, 0.098, 0.122), keyHead), jaw: coat(Dc, Wh, p => ss(p.z + (fbm(p, 50) - 0.5) * 0.03, 0.07, 0.098), keyHead), nose: Pk, ear: bodyH, earIn: Ds,
        horn: { pts: [[0.04, 0.034, -0.012], [0.078, 0.048, -0.014], [0.108, 0.076, -0.006], [0.114, 0.114, 0.012]], r: 0.0125, dark: 0.75 },
        legs: { upF: body, lo: coat(Dc, Ds, p => 0.3, key), upH: body }, switch: Dc } });
    }
    const NAMES = ['trunk', 'neck', 'head', 'jaw', 'lids', 'earL', 'earR', 'upF', 'loF', 'upH', 'loH', 'tail1', 'tail2', 'tuft'];
    for (const d of defs) d.G = animal({ ...d.o, n: d.n });

    // ---------------------------------------------------------- his willow and his fence; the grass
    let gWillow, gGrass;
    {
      const key = KEY_S, Bk = T4('#7b6f58', '#554a3a', '#342c21', '#1b1610', 0.2), Ms = T4('#89824c', '#626034', '#3e3e23', '#202110', 0.2), Wd = T4('#8d8670', '#666150', '#434033', '#25221b', 0.2);
      const bark = (p, n, j = 0, pj = 0, into = new THREE.Color()) => { tone4(Bk, n.dot(key) * 0.9 + 0.05 + j, into); const q = ss(fbm(p, 9) + pj * 0.4 - 0.16 * n.x + 0.12 * n.y, 0.55, 0.72); return q > 0 ? into.lerp(tone4(Ms, n.dot(key) * 0.9 + 0.1 + j, TMP), q * 0.7) : into; };
      const wood = (p, n, j = 0, pj = 0, into = new THREE.Color()) => { tone4(Wd, n.dot(key) * 0.9 + 0.1 + j, into); const q = ss(fbm(p, 13) + pj * 0.5, 0.52, 0.7); return q > 0 ? into.lerp(tone4(Ms, n.dot(key) * 0.9 + j, TMP), q * 0.6) : into; };
      const parts = [], ws = [];
      const lump = (t, a) => 0.07 * Math.sin(a * 3 + t * 7) + 0.05 * Math.sin(a * 5 - t * 11 + 1) + 0.04 * Math.sin(t * 19);
      const DK = col('#1a140e', 0.1), hollow = (p, n) => ss(n.z, 0.3, 0.75) * (1 - ss(Math.abs(n.x + 0.15), 0.2, 0.5)) * ss(p.y, 0.05, 0.13) * (1 - ss(p.y, 0.3, 0.42));
      const trunk = (p, n, j = 0, pj = 0, into = new THREE.Color()) => bark(p, n, j, pj, into).lerp(DK, 0.88 * hollow(p, n));
      // the old trunk: thick at the foot, burred, leaning a little, hollow down its front; and the dead second stem beside it
      const girth = t => 0.084 - 0.04 * t + 0.022 * Math.exp(-(((t - 0.93) / 0.1) ** 2)) + 0.04 * Math.exp(-t / 0.07) + 0.012 * Math.exp(-(((t - 0.42) / 0.07) ** 2));
      const stems = [tube([[0.004, -0.02, 0], [-0.006, 0.12, 0.004], [-0.022, 0.28, 0], [-0.016, 0.42, -0.006], [0.01, 0.54, 0], [0.024, 0.6, 0.004]], girth, 10, 14, lump),
        tube([[0.05, -0.02, 0.024], [0.064, 0.14, 0.028], [0.058, 0.3, 0.022], [0.078, 0.42, 0.018]], t => 0.042 - 0.022 * t, 6, 8, lump)];
      for (const g of stems) {
        const big = g === stems[0]; parts.push(vpaint(g, (v, n) => trunk(v, n)));
        ws.push(...coatTube(g, big ? 90 : 28, { tone: trunk, l: [0.045, 0.1], w: [0.015, 0.028], lift: [0, 0.04], swirl: 0.14, jit: 0.4, pj: 0.4, tip: 0.05 }));
        ws.push(...coatTube(g, big ? 36 : 10, { tone: (p, n, j) => tone4(Bk, -0.55 + j, new THREE.Color()), l: [0.05, 0.12], w: [0.003, 0.006], lift: [0, 0.01], swirl: 0.07, jit: 0.3, tip: 0 }));      // the furrows of the bark
      }
      // the pollard head: knuckles, mossed
      for (const [x, y, z, r] of [[0.026, 0.6, 0, 0.058], [-0.012, 0.58, 0.012, 0.044], [0.064, 0.57, -0.01, 0.04], [0.042, 0.655, 0.004, 0.036], [-0.03, 0.4, 0.03, 0.03]]) {
        const C = [x, y, z], Rr = [r, r * 0.9, r * 0.85]; parts.push(vpaint(ell(C, Rr), (v, n) => bark(v, n, 0, 0.2)));
        ws.push(...coatEll(C, Rr, 15, { tone: (p, n, j, pj) => bark(p, n, j, pj + 0.2), flow: V3(0.2, 1, 0), l: [0.026, 0.05], w: [0.014, 0.022], lift: [0, 0.06], swirl: 0.8, jit: 0.34, tip: 0.05 }));
      }
      // the twigs: bare, whippy, going up; a few out sideways and drooping
      const twig = (pts, r0) => parts.push(vpaint(tube(pts, t => r0 * (1 - 0.72 * t) + 0.0009, 4, 6), (v, n) => tone4(Bk, n.dot(key) * 0.8 + 0.25, new THREE.Color())));
      const TW = [
        [[0.03, 0.63, 0], [0.02, 0.74, 0.004], [0.036, 0.86, 0], [0.03, 0.99, -0.004]], [[0.036, 0.86, 0], [0.058, 0.93, 0.004], [0.06, 1.02, 0]], [[0.02, 0.74, 0.004], [-0.014, 0.82, 0.006], [-0.028, 0.93, 0]],
        [[-0.014, 0.82, 0.006], [-0.04, 0.86, 0.01], [-0.052, 0.92, 0.006]], [[0.05, 0.67, 0], [0.085, 0.74, -0.006], [0.1, 0.83, -0.004], [0.094, 0.9, 0]], [[0.085, 0.74, -0.006], [0.12, 0.77, -0.008], [0.14, 0.82, -0.004]],
        [[-0.02, 0.63, -0.01], [-0.07, 0.67, -0.008], [-0.12, 0.66, 0], [-0.16, 0.69, 0.004]], [[-0.12, 0.66, 0], [-0.14, 0.63, 0.006], [-0.17, 0.635, 0.008]],
        [[0.07, 0.57, -0.01], [0.12, 0.6, -0.012], [0.165, 0.585, -0.006], [0.2, 0.61, 0]], [[0.12, 0.6, -0.012], [0.14, 0.64, -0.01], [0.17, 0.66, -0.006]],
        [[-0.04, 0.44, 0.006], [-0.075, 0.49, 0.012], [-0.1, 0.475, 0.016], [-0.11, 0.44, 0.018]], [[-0.075, 0.49, 0.012], [-0.095, 0.53, 0.014], [-0.115, 0.535, 0.014]],
        [[0.05, 0.4, 0.016], [0.09, 0.45, 0.014], [0.13, 0.44, 0.012]],
      ];
      TW.forEach((t, i) => twig(t, i < 1 ? 0.0075 : i < 5 ? 0.0055 : 0.0045));
      // the fence: a post green with weather, in front of the trunk, and three rails going off to the right and back
      const post = shape.box(0.04, 0.38, 0.034); shape.move(post, 0.088, 0.175, 0.055, 0, 0.15, 0.03); parts.push(vpaint(post, (v, n) => wood(v, n, 0, 0.12)));
      ws.push(...coatLimb([0.085, 0.0, 0.055], [0.092, 0.36, 0.055], 0.027, 0.027, 30, { tone: (p, n, j, pj) => wood(p, n, j, pj + 0.1), flow: V3(0, 1, 0), l: [0.03, 0.07], w: [0.01, 0.018], lift: [0, 0.06], swirl: 0.12, jit: 0.4, tip: 0.08 }));
      [[0.31, 0.055], [0.215, 0.05], [0.12, 0.055]].forEach(([y, h], i) => {
        const a = V3(0.1, y, 0.04), b = V3(0.176, y + 0.004 * (i - 1), -0.06), d = b.clone().sub(a), len = d.length(), g = shape.box(len, h, 0.009);
        shape.move(g, (a.x + b.x) / 2, y, (a.z + b.z) / 2, 0, Math.atan2(-d.z, d.x), (i - 1) * 0.02); parts.push(vpaint(g, (v, n) => wood(v, n, 0, -0.05)));
        const nrm = V3(d.z, 0, -d.x).normalize().multiplyScalar(-1);
        for (let q = 0; q < 12; q++) { const t = R(), p = a.clone().lerp(b, t).add(V3(0, (R() - 0.5) * h * 0.9, 0)).addScaledVector(nrm, 0.0052), dd = dab(p, nrm, { ...D, tone: wood, flow: d, l: [0.03, 0.06], w: [0.012, 0.02], lift: [0, 0.05], swirl: 0.1, jit: 0.4, pj: 0.5, tip: 0.08 }); if (dd) ws.push(dd); }
      });
      parts.unshift(dabs(ws));
      gWillow = shape.merge(parts);
      // grass: tufts of blades round the edge of the earth and at the foot of the tree and the post
      const Gr = ['#7c7f4a', '#676c3c', '#8c8a54', '#575e36', '#99905c', '#716a40'].map(c => col(c, 0.2));
      const pos = [], nor = [], cl = [], tuft = (u, o, n, h) => {
        for (let i = 0; i < n; i++) {
          const a = R() * TAU, r = Math.sqrt(R()) * 0.035, bx = u + Math.cos(a) * r, bz = o + Math.sin(a) * r, hh = h * (0.5 + 0.7 * R()), lean = 0.2 + 0.5 * R(), w = 0.0016 + 0.0016 * R();
          const tx = bx + Math.cos(a) * hh * lean, tz = bz + Math.sin(a) * hh * lean, sx = -Math.sin(a) * w, sz = Math.cos(a) * w, c = Gr[Math.floor(R() * Gr.length)], c2 = c.clone().multiplyScalar(0.8);
          for (const [x, y, z, k] of [[bx - sx, 0, bz - sz, c2], [bx + sx, 0, bz + sz, c2], [tx, hh, tz, c]]) { pos.push(x, y, z); nor.push(0, 1, 0); cl.push(k.r, k.g, k.b); }
        }
      };
      for (let i = 0; i < 46; i++) {
        const a = (i + R()) / 46 * TAU, k = 0.84 + 0.14 * R(), u = PATCH.u + Math.cos(a) * PATCH.ru * k, o = PATCH.out + Math.sin(a) * PATCH.ro * k;
        if (u < U0 + 0.05 || u > U1 - 0.05 || o < 0.07 || (u > 0.3 && u < 0.64 && o < 0.3) || (u > -0.78 && u < -0.46 && o < 0.3)) continue; tuft(u, o, 8 + Math.floor(R() * 6), 0.03 + 0.035 * R());
      }
      for (const [du, dz] of [[-0.07, 0.03], [0.0, 0.07], [0.11, 0.08], [0.16, 0.02], [-0.04, -0.05], [0.06, -0.03], [0.2, -0.05]]) tuft(WILLOW[0] + du, WILLOW[1] + dz, 13, 0.05 + 0.03 * R());
      gGrass = new THREE.BufferGeometry(); gGrass.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gGrass.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); gGrass.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
    }

    // ---------------------------------------------------------- one rig for all of it, in the stage's own terms
    let verts = gWillow.attributes.position.count + gGrass.attributes.position.count;
    for (const d of defs) for (const n of NAMES) verts += d.G[n].attributes.position.count;
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0xffffff, emissiveIntensity: 0.36, side: THREE.DoubleSide });      // (a matt coat: plain diffuse light is all of it, and cheaper on a phone)
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, { uO: this.gu.uO, uAx: this.gu.uAx, uIsle: this.gu.uIsle, uGa: this.gu.uGa, uGb: this.gu.uGb });
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uO, uGa; uniform vec4 uAx, uIsle, uGb;')
        // They gather out of the wall in flakes of paint (uGa: the gate under the picture, from..to along the wall, and how
        // deep the gathering is; uGb: the dark cow's, in the side wall (x 1: the wall's place) or the picture's (x 0: from..to)).
        // And when the look ends they go as paint goes, flake by flake, from the outside in to where she lies.
        .replace('#include <map_fragment>', `#include <map_fragment>
  { vec2 lq = lifeP.xz - uO.xz; float su = dot(lq, uAx.xy), so = dot(lq, uAx.zw); vec3 cell = floor(lifeP * 170.0); float hs = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    float gd = 9.0, gz = 1.0;
    if (uGa.z > 0.001 && su > uGa.x && su < uGa.y) { gd = so; gz = uGa.z; }
    if (uGb.w > 0.001) { if (uGb.x > 0.5) { if (su - uGb.y < gd) { gd = su - uGb.y; gz = uGb.w; } } else if (su > uGb.y && su < uGb.z) { gd = so; gz = uGb.w; } }
    if (gd < gz && hs * 0.92 + 0.08 > gd / gz) discard;
    if (uIsle.w > 0.5 && length((vec2(su, so) - uIsle.xy) * vec2(1.0, 1.2)) + (hs - 0.5) * 0.36 > uIsle.z) discard; }`)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;');
    };
    mat.customProgramCacheKey = () => 'potter-coat';
    const rig = this.rig = L.rig(3 * 18 + 4, verts + 64, mat);
    rig.mesh.position.copy(L.floor(0, 0)); rig.mesh.rotation.y = L.yawOut;
    const add = g => { const i = rig.add(rig.geo(g)); rig.show(i, false); return i; };
    this.beasts = defs.map(d => {
      const G = d.G, gi = {}; for (const n of NAMES) gi[n] = rig.geo(G[n]);
      const inst = n => { const i = rig.add(gi[n]); rig.show(i, false); return i; };
      const b = { id: d.id, k: d.k, way: ways[d.id], arr: ARR[d.id], i: { trunk: inst('trunk'), neck: inst('neck'), head: inst('head'), jaw: inst('jaw'), lids: inst('lids'), earL: inst('earL'), earR: inst('earR'),
        up: [inst('upH'), inst('upF'), inst('upH'), inst('upF')], lo: [inst('loH'), inst('loF'), inst('loH'), inst('loF')], tail: [inst('tail1'), inst('tail2'), inst('tuft')] } };
      b.all = [b.i.trunk, b.i.neck, b.i.head, b.i.jaw, b.i.lids, b.i.earL, b.i.earR, ...b.i.up, ...b.i.lo, ...b.i.tail];
      // (so that every foot is down as it stops: the stride's count from the way's own length)
      const Ls = STRIDE * b.k; b.way.off = 0.012 - (b.way.len / Ls) % 1;
      b.P = { x: 0, z: 0, yaw: 0, bx: 0, by: HB, bz: 0, pitch: 0, roll: 0, sx: 1, sy: 1, feet: [V3(), V3(), V3(), V3()], pole: [V3(0, 0, -1), V3(0, 0, 1), V3(0, 0, -1), V3(0, 0, 1)],
        head: { x: 0, y: 0.4, z: 0.47, yaw: 0, pitch: 0.95, roll: 0 }, jaw: [0, 0], lid: 0, ear: [0, 0], tail: { sw: 0, lift: 0, lie: 0, flick: 0 }, vis: false };
      b.lastN = [0, 0, 0, 0];
      return b;
    });
    this.by = {}; for (const b of this.beasts) this.by[b.id] = b;
    this.iWillow = add(gWillow); this.iGrass = add(gGrass);
    this.all = [...this.beasts.flatMap(b => b.all), this.iWillow, this.iGrass];
    this.blobs = L.blobs(9, { y: L.y + 0.02, fade: true }); this.blobs.renderOrder = 6;
    this.wv = V3();
  },

  hideAll() { for (const i of this.all) this.rig.show(i, false); this.blobs.count = 0; this.earth.visible = false; this.gu.uSpread.value = 0; this.gu.uIsle.value.w = 0; this.gu.uGa.value.z = 0; this.gu.uGb.value.w = 0; },
  start(L) {
    this.hideAll(); this.lastT = -1; this.lastShow = 0; this.leave = null;
    for (const b of this.beasts) b.lastN.fill(-99);
    if (!TOLD && !L.quiet) { TOLD = true; L.k.say('Potter’s cattle come out onto their patch of dry earth. One lies down and chews the cud.', 4.5); }
  },
  // The look has ended. The show's clock runs on (she goes on chewing); the dark cow, if she has settled, moves off.
  back(L) {
    const t = this.lastShow || 0, b = this.by.dark; this.leave = null;
    if (t > b.arr + 0.5) {
      const P = b.P, h = [Math.sin(P.yaw), Math.cos(P.yaw)], p = [P.x, P.z];
      const c = new THREE.CatmullRomCurve3([[p[0], p[1]], [p[0] + h[0] * 0.14, p[1] + h[1] * 0.14], [-0.12, 0.3], [-0.06, 0.02], [-0.06, -0.95]].map(([u, o]) => V3(u, 0, o)), false, 'centripetal'); c.arcLengthDivisions = 200; c.updateArcLengths();
      this.leave = { curve: c, len: c.getLength(), off: 0.012, first: P.feet.map(f => f.clone().setY(0)), head: { ...P.head } };
    }
  },
  end(L) { this.hideAll(); },
  reset(L) { this.hideAll(); TOLD = false; },

  // ---------------------------------------------------------------- walking
  // A way: s metres along it -> where the animal's middle is, and which way it heads (it runs straight on at both ends).
  wayAt(w, s, o) {
    const S = this.s, q = clamp01(s / w.len); w.curve.getPointAt(q, S.a); w.curve.getTangentAt(q, S.b);
    if (s < 0) S.a.addScaledVector(S.b, s); else if (s > w.len) S.a.addScaledVector(S.b, s - w.len);
    o.x = S.a.x; o.z = S.a.z; o.yaw = Math.atan2(S.b.x, S.b.z) + (w.swing ? w.swing[1] * ease.inOut(ramp(s, w.len - w.swing[0], w.len)) : 0); return o;
  },
  // Where foot j is printed for its n-th step on way w: ahead of its own joint by half the ground a step covers, as the
  // animal stands when the foot comes down.
  print(b, w, j, n, into) {
    if (w.first && n <= 0) return into.copy(w.first[j]);
    const Ls = STRIDE * b.k, o = this.wayAt(w, (n - w.off - PHASE[j]) * Ls, this.s.w2), lx = TRACK[j][0] * b.k, lz = TRACK[j][1] * b.k + DUTY * Ls / 2, c = Math.cos(o.yaw), s = Math.sin(o.yaw);
    return into.set(o.x + c * lx + s * lz, 0, o.z - s * lx + c * lz);
  },
  // The feet when the animal is s along the way: each down on its print, or swinging to the next. Gives the stride's phase.
  feet(b, w, s, P, lift = 1) {
    const Ls = STRIDE * b.k;
    for (let j = 0; j < 4; j++) {
      const x = s / Ls + w.off + PHASE[j], n = Math.floor(x), c = x - n, f = P.feet[j];
      this.print(b, w, j, n, f);
      if (c > DUTY) { const q = (c - DUTY) / (1 - DUTY); f.lerp(this.print(b, w, j, n + 1, this.s.c), sm(q)); f.y = (j % 2 ? 0.034 : 0.028) * b.k * Math.sin(Math.PI * q) * lift; }
      b.nowN = b.nowN || [0, 0, 0, 0]; b.nowN[j] = n;
    }
    return s / Ls + w.off;
  },

  // ---------------------------------------------------------------- an animal, put where its pose says
  // Two bones from H to F, lengths a and b, the joint out towards pole: J the joint, F moved in if it is out of reach.
  ik(H, F, a, b, pole, J) {
    const S = this.s, dir = S.x.subVectors(F, H); let d = dir.length(); dir.multiplyScalar(1 / Math.max(d, 1e-5));
    const far = (a + b) * 0.998, near = Math.abs(a - b) + 0.004; if (d > far) { d = far; F.copy(H).addScaledVector(dir, d); } else if (d < near) { d = near; F.copy(H).addScaledVector(dir, d); }
    const d1 = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - d1 * d1)), perp = S.y.copy(pole).addScaledVector(dir, -pole.dot(dir));
    if (perp.lengthSq() < 1e-8) perp.set(0, 0, 1); perp.normalize();
    return J.copy(H).addScaledVector(dir, d1).addScaledVector(perp, h);
  },
  // A bone's matrix: at o, its own -y along dir, its own +x as near lat as that allows, k its size.
  boneY(M, o, dir, lat, k) { const S = this.s, y = S.y.copy(dir).normalize().negate(), x = S.x.copy(lat).addScaledVector(y, -lat.dot(y)).normalize(), z = S.z.crossVectors(x, y); return M.makeBasis(x, y, z).scale(S.sc.setScalar(k)).setPosition(o); },
  put(L, b) {
    const S = this.s, P = b.P, rig = this.rig, k = b.k, I = b.i;
    for (const i of b.all) rig.show(i, P.vis);
    if (!P.vis) return;
    S.root.makeRotationY(P.yaw).scale(S.sc.setScalar(k)).setPosition(P.x, 0, P.z);
    S.loc.makeRotationFromEuler(S.e.set(P.pitch, 0, P.roll, 'YXZ')).scale(S.sc.set(P.sx, P.sy, 1)).setPosition(P.bx, P.by, P.bz);
    S.body.multiplyMatrices(S.root, S.loc); rig.mat(I.trunk, S.body);
    const lat = S.lat.setFromMatrixColumn(S.root, 0).normalize(), fwd = S.fwd.setFromMatrixColumn(S.root, 2).normalize();
    for (let j = 0; j < 4; j++) {
      const H = S.H.set(HIP[j][0], HIP[j][1], HIP[j][2]).applyMatrix4(S.body), F = S.F.copy(P.feet[j]);
      if (j % 2) H.addScaledVector(fwd, Math.max(-0.06 * k, Math.min(0.06 * k, 0.45 * S.a.subVectors(F, H).dot(fwd))));      // (a fore leg swings from the shoulder, which slides)
      const pole = S.d.copy(P.pole[j]).applyAxisAngle(S.z.set(0, 1, 0), P.yaw);
      this.ik(H, F, LEN[j][0] * k, LEN[j][1] * k, pole, S.J);
      rig.mat(I.up[j], this.boneY(S.t, H, S.a.subVectors(S.J, H), lat, k));
      rig.mat(I.lo[j], this.boneY(S.t, S.J, S.a.subVectors(F, S.J), lat, k));
    }
    // the neck, from the shoulders to the poll, and the head on it
    const N0 = S.a.set(NECK[0], NECK[1], NECK[2]).applyMatrix4(S.body), hd = P.head, PP = S.b.set(hd.x, hd.y, hd.z).applyMatrix4(S.root);
    { const z = S.z.subVectors(PP, N0), len = z.length(); z.multiplyScalar(1 / len); const x = S.x.set(0, 1, 0).cross(z).normalize(), y = S.y.crossVectors(z, x);
      S.t.makeBasis(x, y, z).scale(S.sc.set(k, k, len / NL)).setPosition(N0); rig.mat(I.neck, S.t); }
    S.head.makeRotationFromEuler(S.e.set(hd.pitch, P.yaw + hd.yaw, hd.roll, 'YXZ')).scale(S.sc.setScalar(k * HEAD)).setPosition(PP); rig.mat(I.head, S.head);
    S.t2.makeRotationFromEuler(S.e.set(P.jaw[1], P.jaw[0], 0, 'YXZ')).setPosition(JAW[0] + P.jaw[0] * 0.03, JAW[1], JAW[2]); rig.mat(I.jaw, S.t.multiplyMatrices(S.head, S.t2));
    S.t2.makeTranslation(0, 0.003 - 0.0125 * P.lid, 0.0006 * P.lid); rig.mat(I.lids, S.t.multiplyMatrices(S.head, S.t2));
    for (const [i, s, e] of [[I.earL, 1, P.ear[0]], [I.earR, -1, P.ear[1]]]) { S.t2.makeRotationFromEuler(S.e.set(0.2 + 0.3 * e, s * (0.3 + 0.5 * e), s * (-0.1 + 0.3 * e), 'YXZ')).setPosition(s * EAR[0], EAR[1], EAR[2]); rig.mat(i, S.t.multiplyMatrices(S.head, S.t2)); }
    // the tail: hanging and swinging; lying, round her quarter on the ground
    const T = P.tail, base = S.H.set(TAILB[0], TAILB[1], TAILB[2]).applyMatrix4(S.body), dir = S.d;
    const seg = (i, sw, back, lieX, lieY, lieZ, len) => {
      dir.set(Math.sin(sw), -Math.cos(sw) * Math.cos(back), -Math.sin(back)); if (T.lie > 0) dir.lerp(S.c.set(lieX, lieY, lieZ), T.lie).normalize();
      dir.applyAxisAngle(S.z.set(0, 1, 0), P.yaw); rig.mat(I.tail[i], this.boneY(S.t, base, dir, lat, k)); base.addScaledVector(dir, len * k);
    };
    seg(0, T.sw * 0.45, 0.2 + T.lift, 0.5, -0.82, -0.3, TLEN[0]); seg(1, T.sw * 0.95 + T.flick * 0.4, 0.04 + T.lift * 1.6, 0.72, -0.2, 0.66, TLEN[1]); seg(2, T.sw * 1.3 + T.flick, T.lift * 2.2, 0.3 + T.flick * 0.5, -0.04 + 0.3 * Math.abs(T.flick), 0.95, 0.1);
  },

  // ---------------------------------------------------------------- what each of them does, at show-time t
  pose(L, b, t, r) {
    const P = b.P, S = this.s, calm = L.calm, k = b.k, w = b.way, slow = calm ? 0.5 : 1;
    // -- along its way out of the wall
    const tau = b.arr - t, Dd = 0.55, v = SPEED * k * PACE[b.id];
    let s = tau <= 0 ? w.len : tau >= Dd ? w.len - v * (tau - Dd / 2) : w.len - v * tau * tau / (2 * Dd), walk = tau <= 0 ? 0 : Math.min(1, tau / Dd), way = w;
    const o0 = this.wayAt(w, s, S.wo), inn = w.west ? o0.x - this.west : o0.z;      // (its middle, out from the wall it comes through)
    P.vis = s > 0.02 && inn > -0.82 * k;
    if (!P.vis) return;
    // (the dark cow, when the look has ended: off towards the wall on a way of her own)
    let gone = 0;
    if (b.id === 'dark' && this.leave && r > 0.1) { const rr = r - 0.1, D2 = 0.5; way = this.leave; s = Math.min(way.len, rr < D2 ? v * rr * rr / (2 * D2) : v * (rr - D2 / 2)); walk = Math.min(1, rr / D2); gone = sm(Math.min(1, rr / 0.5)); }
    const o = this.wayAt(way, s, S.wo); P.x = o.x; P.z = o.z; P.yaw = o.yaw;
    const ph = this.feet(b, way, s, P), c2 = Math.cos(TAU * 2 * ph), s1 = Math.sin(TAU * ph);
    P.bx = 0.007 * s1 * walk; P.by = HB - 0.005 * walk * c2 - 0.004 * walk; P.bz = 0; P.pitch = 0.012 * walk * Math.sin(TAU * 2 * ph + 0.8); P.roll = 0.016 * s1 * walk; P.sx = 1; P.sy = 1;
    for (let j = 0; j < 4; j++) P.pole[j].set(0, j % 2 ? 0.1 : 0, j % 2 ? 1 : -1);
    const H = P.head, nod = walk * Math.sin(TAU * 2 * ph + 0.5);
    const setH = (x, y, z, yaw, pitch, roll = 0) => { H.x = x; H.y = y; H.z = z; H.yaw = yaw; H.pitch = pitch; H.roll = roll; };
    const toH = (q, x, y, z, yaw, pitch, roll = 0) => { if (q <= 0) return; H.x = lerp(H.x, x, q); H.y = lerp(H.y, y, q); H.z = lerp(H.z, z, q); H.yaw = lerp(H.yaw, yaw, q); H.pitch = lerp(H.pitch, pitch, q); H.roll = lerp(H.roll, roll, q); };
    setH(0, 0.395 + 0.011 * nod, 0.4 + 0.006 * nod, 0, 0.98 + 0.05 * nod);
    { const lo = 1 - sm(w.west ? ramp(inn, -0.62 * k, -0.05 * k) : ramp(way === w ? inn : 1, -0.5 * k, 0.2 * k)); toH(lo, 0, w.west ? 0.28 : 0.2, 0.41, 0, w.west ? 1.22 : 1.32); }
    P.jaw[0] = 0; P.jaw[1] = 0; P.lid = 0.12; P.ear[0] = P.ear[1] = 0;
    const T = P.tail; T.lie = 0; T.lift = 0.03 * walk; T.flick = 0; T.sw = 0.2 * walk * s1;
    const flick = (t0, d = 0.3) => hump(t, t0, t0 + d / slow);
    const every = (per, off, d = 0.3) => { const q = ((t - off) % per + per) % per; return t > off ? hump(q, 0, d / slow) : 0; };
    const chew = (t0, rate, amp) => { const a = TAU * rate * (t - t0), sn = Math.sin(a); P.jaw[0] += amp * 0.15 * sn; P.jaw[1] += amp * (0.045 + 0.045 * Math.cos(a)); H.roll += amp * 0.05 * sn; H.yaw += amp * 0.022 * sn; H.y += amp * 0.0025 * Math.cos(a); P.ear[0] += amp * 0.12 * Math.sin(a - 0.5); P.ear[1] -= amp * 0.08 * Math.sin(a - 0.5); };
    const here = sm(clamp01(-tau / 0.5));           // it has stopped, and stands

    if (b.id === 'pied') {
      // ---- the main moment: nose down, feet gathered, onto her knees, her quarters down, a long breath; then the cud
      const sniff = hump(t, T_SNIFF[0], T_SNIFF[1]), Fq = ramp(t, T_KNEEL[0], T_KNEEL[1]), Fd = ease.inOut(Fq), Hq = ramp(t, T_DROP[0], T_DROP[1]);
      const Hd = Hq * Hq * (3 - 2 * Hq) * 0.35 + 0.65 * Hq * Hq, land = t - T_DROP[1], thump = land > 0 && !calm ? Math.exp(-land * 7) * Math.sin(land * 21) : 0;
      const sigh = hump(t, T_SIGH[0], T_SIGH[1]), breath = Hd * Math.sin(TAU * 0.27 * (t - T_DROP[1])), X = ease.inOut(ramp(t, T_STRETCH[0], T_STRETCH[1])), turn = ease.inOut(ramp(t, T_TURN[0], T_TURN[1]));
      // her feet, in her own terms, from where they stood
      const inv = (v, into) => into.set(((v.x - P.x) * Math.cos(P.yaw) - (v.z - P.z) * Math.sin(P.yaw)) / k, v.y / k, ((v.x - P.x) * Math.sin(P.yaw) + (v.z - P.z) * Math.cos(P.yaw)) / k);
      const fwdTo = (j, x, y, z, q, lift) => { if (q <= 0) return; const f = P.feet[j], a = inv(f, S.a); a.x = lerp(a.x, x, sm(q)); a.z = lerp(a.z, z, sm(q)); a.y = lerp(a.y, y, sm(q)) + lift * Math.sin(Math.PI * clamp01(q)); const cs = Math.cos(P.yaw), sn = Math.sin(P.yaw); f.set(P.x + (a.x * cs + a.z * sn) * k, a.y * k, P.z + (-a.x * sn + a.z * cs) * k); };
      const sq = (a, b2) => ramp(t, a, b2);
      // the fore feet squared up under her, one and then the other; the hind feet brought forward under her
      fwdTo(3, -0.066, 0, 0.165, sq(T_SQUARE[0], T_SQUARE[0] + 0.3), 0.03); fwdTo(1, 0.07, 0, 0.195, sq(T_SQUARE[1] - 0.3, T_SQUARE[1]), 0.03);
      fwdTo(0, 0.115, 0, -0.085, sq(T_STEP[0], T_STEP[0] + 0.32), 0.03); fwdTo(2, 0.0, 0, -0.065, sq(T_STEP[1] - 0.32, T_STEP[1]), 0.03);
      // and as her quarters come down they fold under her and to her near side, as he has them; then the near fore leg out
      fwdTo(0, 0.18, 0.02, 0.02, Hd, 0); fwdTo(2, 0.12, 0.022, 0.11, Hd, 0);
      fwdTo(1, 0.105, 0.018, 0.52, X, 0.035);
      P.pole[0].set(0.58 * Hd, -0.12 * Hd, -1); P.pole[2].set(0.3 * Hd, 0.3 * Hd, -1); P.pole[1].set(0, 0.1 - 0.4 * Fd - 0.7 * X, 1); P.pole[3].set(0, 0.1 - 0.4 * Fd, 1);
      const hf = lerp(HB, 0.166, Fd), hh = lerp(HB, 0.152, Hd) - 0.02 * Fd * (1 - Hd);
      P.by += (hf + hh) / 2 - HB - 0.012 * thump + 0.003 * breath; P.pitch += Math.atan2(hh - hf, 0.36) + 0.02 * sniff; P.bz = 0.03 * Fd - 0.012 * Hd; P.bx += -0.02 * Hd; P.roll += 0.15 * Hd + 0.02 * thump;
      P.sx = 1 + 0.045 * Hd + 0.03 * thump + 0.035 * sigh + 0.006 * breath; P.sy = 1 - 0.03 * Hd - 0.03 * thump + 0.012 * sigh + 0.006 * breath;
      toH(sniff, 0, 0.2 - 0.06 * Fd, 0.42, 0, 1.34);
      toH(Fd * (1 - sniff), 0, 0.35 - 0.06 * Hd, 0.43, 0, 0.82);
      toH(turn, 0.06, 0.315 + 0.006 * breath + 0.015 * sigh, 0.375, 0.85, 0.5, 0.05);
      T.lie = sm(ramp(t, T_DROP[0] + 0.2, T_DROP[1] + 0.25)); T.sw = (1 - T.lie) * (0.3 * Math.sin(TAU * 0.5 * slow * t) * here);
      // the cud: a swallow comes up, and she chews; swallows; a pause; the next
      const tc = t - T_CHEW;
      if (t > T_GULP - 0.2) {
        const q = tc < 0 ? -1 : tc % CUD, on = tc < 0 ? 0 : sm(ramp(q, 0, 0.3)) * (1 - sm(ramp(q, 7.0, 7.3))), gulpUp = tc < 0 ? hump(t, T_GULP, T_GULP + 0.38) : hump(q, CUD - 0.5, CUD - 0.1), down = tc < 0 ? 0 : hump(q, 7.35, 7.8);
        chew(T_CHEW, 1.12, on);
        H.y += 0.012 * gulpUp + 0.006 * down; H.z += 0.012 * gulpUp; H.pitch += -0.1 * gulpUp + 0.06 * down; P.jaw[1] += 0.05 * gulpUp;
        P.lid = lerp(0.12, 0.42, sm(ramp(t, T_CHEW, T_CHEW + 1.2))) - 0.2 * down;
      }
      P.lid = Math.max(P.lid, 0.75 * sigh); P.lid += 0.5 * every(6.3, 9.1, 0.24);
      const e1 = flick(6.78, 0.28) + every(5.3, 9.4, 0.28), e2 = flick(5.76, 0.3) + every(7.9, 11.2, 0.28);
      P.ear[0] += -0.25 * sigh + e1; P.ear[1] += -0.25 * sigh + e2;
      T.flick = (every(4.7, 8.3, 0.4) - 0.5 * every(4.7, 8.5, 0.4)) * T.lie;
    } else if (b.id === 'bull') {
      // ---- he stops behind her; watches her go down; then looks at us, as he does in the picture, chewing
      const watch = sm(ramp(t, T_SNIFF[0] + 0.4, T_KNEEL[0] + 0.2)) * (1 - sm(ramp(t, T_SIGH[0], T_SIGH[0] + 0.7))) * here, gaze = sm(ramp(t, T_SIGH[0] + 0.1, T_SIGH[0] + 0.9));
      toH(here, 0, 0.43, 0.395, 0.1, 0.8);
      toH(watch, 0.02, 0.36, 0.43, 0.3, 1.1, -0.05);
      toH(gaze, 0.02, 0.46, 0.375, 0.42, 0.62, 0.03 * Math.sin(t * 0.4)); P.jaw[1] += 0.07 * gaze;
      // (when the look has ended: up, at the picture he came out of)
      if (r > 0) toH(ease.inOut(ramp(r, 0.15, 1.0)), 0, 0.5, 0.34, 0.5, 0.18, 0);
      if (t > T_CHEW + 0.5) chew(T_CHEW + 0.5, 1.31, sm(ramp(t, T_CHEW + 0.5, T_CHEW + 0.9)) * (0.55 + 0.45 * Math.sin(t * 0.37)) * (1 - 0.8 * every(11.7, 12.5, 1.6)));
      P.lid = -0.3 + 1.25 * (flick(7.86, 0.22) + every(5.9, 10.3, 0.22));
      P.ear[0] += flick(5.1, 0.3) + every(6.1, 9.0, 0.3); P.ear[1] += flick(6.5, 0.3) + every(8.3, 12.2, 0.3);
      T.sw = 0.2 * walk * s1 + here * (0.34 * Math.sin(TAU * 0.42 * slow * t + 1) + 0.5 * every(7.7, 6.9, 0.5) * Math.sin(TAU * 2 * slow * t));
    } else {
      // ---- the dark cow: stops with her back to us, swings her tail, and turns her head to the bull
      const turn = sm(ramp(t, b.arr + 0.5, b.arr + 1.5)) * (1 - gone), lick = turn * sm(ramp(t, T_SIGH[0] + 0.5, T_SIGH[0] + 1.2)) * (0.5 + 0.5 * Math.sin(t * 0.5));
      toH(turn, -0.13, 0.4 + 0.012 * lick * Math.sin(TAU * 1.1 * t), 0.345, -1.2, 0.7 + 0.1 * lick * Math.sin(TAU * 1.1 * t), -0.06);
      P.lid = -0.2 + 1.15 * every(6.7, 5.6, 0.24);
      P.ear[0] = flick(4.6, 0.3) + every(7.3, 8.9, 0.3); P.ear[1] = flick(7.2, 0.3) + every(6.9, 11.1, 0.3);
      T.sw = 0.2 * walk * s1 + here * (1 - gone) * (0.46 * Math.sin(TAU * 0.5 * slow * t) + 0.5 * every(6.3, 5.9, 0.5) * Math.sin(TAU * 2.2 * slow * t)); T.lift += 0.03 * here;
    }
  },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', ret = ph === 'return';
    if (showing) this.lastShow = L.t;
    const r = ret ? L.ret * L.retDur : 0, t = (this.lastShow || 0) + r, calm = L.calm, rig = this.rig;
    // ---- the earth: out from the wall; and at the end, in round where she lies
    const spread = showing || ret ? ease.out(ramp(t, 0.02, 1.9)) : 0, isle = this.gu.uIsle.value;
    this.gu.uSpread.value = spread; this.earth.visible = spread > 0.002;
    const rad = ret ? (L.ret < 0.42 ? lerp(2.05, 0.7, sm(L.ret / 0.42) * 0.5 + 0.5 * L.ret / 0.42) : lerp(0.7, -0.26, ramp(L.ret, 0.42, 0.97))) : 9; isle.z = rad; isle.w = ret ? 1 : 0;
    const seen = (u, o) => (ret ? clamp01((rad - Math.hypot(u - LAST[0], (o - LAST[1]) * 1.2)) / 0.2) : 1) * clamp01(o / 0.15) * (this.corner ? clamp01((u - this.west) / 0.15) : 1);
    // (the gathering at the two gates, while each is in use)
    const GA = calm ? 0.1 : 0.62, gb = this.gu.uGb.value; this.gu.uGa.value.z = GA * (1 - sm(ramp(t, ARR.bull - 0.6, ARR.bull - 0.05)));
    if (this.corner) gb.set(1, this.west, 0, GA * (1 - sm(ramp(t, ARR.dark - 1.1, ARR.dark - 0.5)))); else gb.set(0, -0.85, -0.4, GA * (1 - sm(ramp(t, ARR.dark - 1.4, ARR.dark - 0.9))));
    // ---- the willow, the fence and the grass stand up as it reaches them
    const up = sm(ramp(t, 0.55, 1.75)), S = this.s;
    rig.show(this.iWillow, up > 0.001); rig.show(this.iGrass, up > 0.001);
    if (up > 0.001) { S.t.makeScale(1.15 * (0.7 + 0.3 * up), 1.15 * up, 1.15 * (0.7 + 0.3 * up)).setPosition(WILLOW[0], 0, WILLOW[1]); rig.mat(this.iWillow, S.t); S.t.makeScale(1, sm(ramp(t, 0.4, 1.9)), 1); rig.mat(this.iGrass, S.t); }
    // ---- the three of them
    let nb = 0; const B = this.blobs, wv = this.wv;
    for (const b of this.beasts) {
      this.pose(L, b, t, r); this.put(L, b);
      const P = b.P; if (!P.vis) continue;
      const cs = Math.cos(P.yaw), sn = Math.sin(P.yaw), low = 1 - (P.by - 0.15) / (HB - 0.15);
      for (const z of [0.15, -0.15]) { const u = P.x + sn * z * b.k, o = P.z + cs * z * b.k; if (o < 0.02) continue; L.floor(u, o, wv); B.set(nb++, wv.x, wv.z, (0.15 + 0.03 * low) * b.k, (0.5 + 0.2 * low) * seen(u, o)); }
      // their feet on the earth
      if (showing && !L.quiet && this.lastT >= 0 && b.nowN) for (let j = 0; j < 4; j++) { if (b.nowN[j] > b.lastN[j] && b.lastN[j] > -90 && P.feet[j].z > 0 && P.feet[j].x > this.west && t < b.arr + 0.2) this.step(L, b, j); b.lastN[j] = b.nowN[j]; }
    }
    L.floor(WILLOW[0] + 0.03, WILLOW[1] + 0.02, wv); B.set(nb++, wv.x, wv.z, 0.13, 0.4 * up * seen(WILLOW[0], WILLOW[1]));
    B.count = nb;
    // ---- what you hear
    if (showing && !L.quiet && this.lastT >= 0) {
      const at = (T, f) => { if (this.lastT < T && t >= T) f(); }, v = L.voice();
      at(0.25, () => this.low(L, 118, 1.5, 0.085, [330, 820], 0.5));                                   // far off, inside the wall: a cow
      at(T_KNEEL[0] + 0.5, () => { noise(v, 0, { d: 0.12, vol: 0.012, lp: 260, attack: 0.02 }); });     // her knees
      at(T_DROP[1] - 0.03, () => { noise(v, 0, { d: calm ? 0.3 : 0.2, vol: calm ? 0.02 : 0.045, lp: 170, attack: calm ? 0.08 : 0.012 }); v.note(62, 0.3, { vol: calm ? 0.02 : 0.045, type: 'sine', to: 40, attack: calm ? 0.08 : 0.01 }); });      // her weight
      at(T_DROP[0] + 0.1, () => this.low(L, 92, 0.42, 0.05, [300, 700], 0.15));                       // a grunt as she goes
      at(T_SIGH[0] + 0.1, () => noise(v, 0, { d: 0.9, vol: 0.016, bp: 620, q: 0.8, attack: 0.3 }));     // the long breath
      at(T_GULP, () => v.note(150, 0.22, { vol: 0.02, type: 'sine', to: 250, attack: 0.03 }));          // the cud comes up
      // each chew: a soft wet grind, on her jaw's own time
      const tc = t - T_CHEW, n0 = Math.floor((this.lastT - T_CHEW) * 1.12 * 2), n1 = Math.floor(tc * 1.12 * 2);
      if (tc > 0 && n1 > n0 && tc % CUD < 7.1) { noise(v, 0, { d: 0.11, vol: 0.0085, bp: n1 % 2 ? 520 : 680, q: 1.4, attack: 0.025 }); noise(v, 0.02, { d: 0.07, vol: 0.004, bp: 1900, q: 2, attack: 0.02 }); }
      if (tc > 7.3) { const q0 = (this.lastT - T_CHEW) % CUD, q1 = tc % CUD; if (q0 < 7.4 && q1 >= 7.4) v.note(230, 0.2, { vol: 0.014, type: 'sine', to: 130, attack: 0.03 }); if (q0 < CUD - 0.5 && q1 >= CUD - 0.5) v.note(150, 0.22, { vol: 0.016, type: 'sine', to: 250, attack: 0.03 }); }
    }
    L.voice().place();
    this.lastT = showing ? t : this.lastT;
  },

  // ---------------------------------------------------------------- sounds
  // A hoof put down on dry earth.
  step(L, b, j) { const v = L.voice(), k = b.id === 'bull' ? 0.8 : 1; noise(v, 0, { d: 0.07, vol: 0.011 * k, lp: 300, attack: 0.006 }); v.note(j % 2 ? 96 : 82, 0.07, { vol: 0.012 * k, type: 'sine', to: 55, attack: 0.004 }); },
  // A cow's voice, as the mouth makes it: closed on a hum, rounding, then opening (mm, oo, uh). Two reedy tones a hair
  // apart, their pitch coming up a little and falling away at the end, through two formants that move with the mouth:
  // the first from three quarters of F1 up to F1 and on to nearly half as much again as it opens, the second from
  // under F2 to a quarter over it. Nobody could listen to it here, so it was rendered offline and measured every tenth
  // of a second: the far low's pitch goes 105 -> 125 -> 95 Hz; its lower formant (the strongest harmonic near it) 210
  // -> 360 -> 480 Hz and its upper 730 -> 960 -> about 1300 Hz; its level is about 0.01 rms (peak 0.03), with the
  // attack half as steep when motion is reduced. Far off it is soft.
  low(L, f0, dur, vol, [F1, F2], rise) {
    const v = L.voice(), c = v.ctx, out = c && v.out(); if (!c || !out) return;
    const t = c.currentTime + 0.02, env = c.createGain(), a = Math.min(0.3, dur * 0.3) * (L.calm ? 1.6 : 1);
    env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(vol, t + a); env.gain.setValueAtTime(vol, t + dur * 0.8); env.gain.linearRampToValueAtTime(0, t + dur);
    const mix = c.createGain(); mix.gain.value = 0.6;
    for (const det of [1, 1.006]) {      // (two reeds a hair apart: the roughness in it)
      const o = c.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0 * 0.85 * det, t); o.frequency.linearRampToValueAtTime(f0 * det, t + dur * 0.28); o.frequency.linearRampToValueAtTime(f0 * (1 + 0.12 * rise) * det, t + dur * 0.66); o.frequency.linearRampToValueAtTime(f0 * 0.78 * det, t + dur);
      o.connect(mix); o.start(t); o.stop(t + dur + 0.05);
    }
    for (const [f, q, g, shut, open] of [[F1, 3.2, 1, 0.76, 1.45], [F2, 5, 0.55, 0.85, 1.28], [F1 * 6.6, 3, 0.06, 0.95, 1.05]]) {
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
      bp.frequency.setValueAtTime(f * shut, t); bp.frequency.linearRampToValueAtTime(f, t + dur * 0.3); bp.frequency.linearRampToValueAtTime(f * open, t + dur * 0.66); bp.frequency.linearRampToValueAtTime(f * (shut + open) / 2, t + dur);
      const gg = c.createGain(); gg.gain.value = g; mix.connect(bp); bp.connect(gg); gg.connect(env);
    }
    env.connect(out);
  },
});
