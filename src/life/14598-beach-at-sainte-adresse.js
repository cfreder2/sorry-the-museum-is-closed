// Claude Monet, The Beach at Sainte-Adresse (1867), Gallery 225. The word: ebb.
//
// A grey day on the shingle below Le Havre, where he grew up. Two thirds of it is cloud. Under the cloud a calm, milky
// green sea with dark-sailed fishing boats standing in, small, taller, largest; and in front the thing no other sea
// picture in the building has: the beach itself, a bank of pale stones, every one a dab of his white, cream, pink or
// blue-grey, with the boats lying on it. A big tarred one, heeled over, with a grey stripe and a bare pole beside it;
// and at the water's edge a cobalt blue boat on a log, an ochre spar out over its bow. Baskets on the stones, one
// standing, one on its side. Everybody in it is waiting (three fishermen talking by their boat, two visitors sitting at
// the water's edge, one of them with a telescope), because the water has gone out: the boats are aground, and the far
// shore on the left lies bare in brown bars. The museum's words for it are fishing boats in the water and craft "on
// the shore". The word comes from there: it is a picture of the ebb, and of what the ebb leaves.
//
// So what comes out is the going out. Look at it and his sea wells out of the foot of the wall across the floor, a
// flat calm, pale green in level strokes, and the two boats ride out of the wall on it, the tarred one with its pole,
// then the blue one, rocking; the dark sails come out and stand off by the wall, their green reflections under them.
// For a moment it is high water. Then the sea begins to go back, each small wave running up a little less far than
// the last and draining back down, and what it uncovers is the beach: his stones, wet and dark at first, catching the
// light. The boats feel it. The tarred one touches, stops answering the water, leans, hangs there, and goes over onto
// its bilge with a crunch, its pole swinging across; the two baskets in it slide over the side, bounce and roll out
// on the stones, and one ends on its foot, wobbling round its rim, the other on its side, as they lie in the picture.
// The blue one is last: the water slips out from under it and leaves it on its log, bow up, with one hollow knock.
// Then nothing happens, which is the picture: the stones dry to his white from the top of the beach down, the small
// waves turn over at the edge, the far sails nod, the cloud's light moves over it all. When you stop looking the tide
// comes back up the beach, floats the boats off upright, lifts the baskets, and the sea draws back into the wall and
// takes them and every stone with it. If the toy is near it stays out a while: the shingle crunches and skips under
// the wheels, and a grounded boat rocks up off its bilge and settles again when the toy goes by.
//
// It is the only sea here that goes away. The Gauguin's tide (Gallery 247) is a flat pool of pattern that laps in and
// out; the Homer's (161) is a heaped swell coming on; the Turner's (220) a storm sea that two boats bargain across;
// the Cliff Walk's is wind. Here the water is flat and plain, and the show is the land it leaves and two things with
// weight being set down on it.
// The Manet beside it (The Races at Longchamp, on the next wall of the same corner) runs its course over the same
// floor. Only one of the two is ever looked at; the kit sends the other home as this one begins; and nothing here is
// solid or stands more than half a metre high, so the worst that can meet is a field going home through a sea coming
// out. The stones stop short of the doorway on the left.
// Nothing rises near a picture: the tallest thing is the tarred boat's pole (0.5 m; the lowest canvas in the room
// starts at 1.08 m), and from the checks' nine cameras the guard has nothing to cut.
// Three draw calls: the ground (the sea, its edge and foam, the stones wet and dry, the shadows: one sheet, one
// shader), a rig (the two boats, the log, the baskets: smooth bodies with brushwork in their paint), and his marks
// (the strokes along the planking, the far hulls, sails and reflections, the stones that skip).
// The sound is only what a shingle beach has: the water, the stones each wave drags back, wood on stone. No tune.
// With "Reduce motion and flashing": the waves and the rocking go at half speed and smaller, the boat lies down slowly
// and does not bounce, the baskets are set down without tumbling, no stones skip, and the crunch and the knock are
// soft and eased in.
//
// What it does not do: it brings out no person, neither the three fishermen (their work is here as their boats, their
// baskets and the wait for the water; they are not made to act it) nor the two visitors, and so no telescope either;
// it leaves the two dark boats behind the blue one in the picture; the baskets are empty and no fish is shown; and
// the boats are set down by the tide as boats are, never wrecked, swamped or thrown, because this is a working beach
// on a quiet day and nothing in the picture is in danger.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture, rng } from '../paintlife.js';
import { noise } from './stagecraft.js';
import { strokes as floorStrokes } from './brush.js';

// The shore, in the stage's terms (u along the wall to the viewer's right, out from it): the water's edge at low water
// passes through P0; NL points up the beach (away from the sea), TS along the shore. As in the picture the sea is to
// the right and beyond, and the shore runs down from the far left to the near right.
const P0 = [0.5, 0.62], NL = [-0.5, 0.866], TS = [0.866, 0.5];
const XL = (u, o) => (u - P0[0]) * NL[0] + (o - P0[1]) * NL[1];          // how far up the beach a point is (metres)
const X_IN = -1.0, X_HIGH = 1.25, X_LOW = 0;                               // the tide line: all in the wall; high water; low
const T_FLOOD = 1.9, T_EBB = 2.2, T_OUT = 7.4;                            // it comes out; it turns; it is out
const LAP = 1.5;                                                          // seconds between the small waves
const NSH = 5, NMARK = 120, NPEB = 16;
const DRAFT = 0.04;
// The boats: where each takes the ground (u, out), the way its bow points, its size, how far it heels, and how deep
// the water over its place must be (as metres of beach still covered above it) for it to float, and to let it go.
const BOATS = [
  { id: 'tar', u: -0.26, o: 0.8, bow: [0.5, -0.87], len: 0.74, beam: 0.25, depth: 0.15, rake: 0.035, heel: 0.38, touch: 0.3, go: 0.05, t0: 0.3, t1: 1.95, swing: -0.5 },
  { id: 'blue', u: 0.36, o: 0.72, bow: [0.9, 0.44], len: 0.62, beam: 0.22, depth: 0.14, rake: 0.04, heel: 0.12, touch: 0.13, go: 0.02, t0: 0.6, t1: 2.1, swing: 0.45 },
];
// The far sails, as they stand in the picture from left to right: where, how big, and each sail [along, height, width, lean].
const LUGGERS = [
  { u: 0.03, o: 0.1, k: 0.45, sails: [[0, 0.33, 0.3, -0.04]] },
  { u: 0.6, o: 0.2, k: 0.62, sails: [[0.01, 0.4, 0.31, -0.03]] },
  { u: 1.14, o: 0.6, k: 0.82, sails: [[-0.14, 0.22, 0.19, -0.05], [0.0, 0.34, 0.3, -0.02], [0.145, 0.2, 0.17, 0.3]] },
];
// Where the two baskets come to rest (u, out), as they lie in the picture: one standing, one on its side.
const BASKETS = [{ u: -0.03, o: 1.2, lie: 0 }, { u: 0.16, o: 1.32, lie: 1 }];

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const hash = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };

// ---- geometry with his brushwork in it: position, normal, colour and uv, not indexed, so it all goes into one rig
function uvOf(g, k = 5) {
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) + p.getZ(i) * 0.6) * k; uv[i * 2 + 1] = (p.getY(i) + p.getZ(i) * 0.8) * k; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}
function mergeAll(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const [name, k] of [['position', 3], ['normal', 3], ['color', 3], ['uv', 2]]) { const a = new Float32Array(n * k); let o = 0; for (const g of list) { a.set(g.attributes[name].array, o); o += g.attributes[name].array.length; } out.setAttribute(name, new THREE.BufferAttribute(a, k)); }
  return out;
}
// A sheet of nu by nv quads: fn(i, j, o) fills o.p (Vector3), o.c (Color), o.uv ([u, v]); ref is the way its middle faces.
function grid(nu, nv, fn, ref) {
  const pos = [], col = [], uv = [], idx = [], o = { p: V3(), c: new THREE.Color(), uv: [0, 0] }, W = nv + 1;
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { fn(i, j, o); pos.push(o.p.x, o.p.y, o.p.z); col.push(o.c.r, o.c.g, o.c.b); uv.push(o.uv[0], o.uv[1]); }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * W + j, b = a + 1, c = a + W, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = Math.floor(nu / 2) * W + Math.floor(nv / 2), n = g.attributes.normal;
  if (n.getX(m) * ref.x + n.getY(m) * ref.y + n.getZ(m) * ref.z < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); }
  return g.toNonIndexed();
}
// An open boat, lofted: bow at +x, the keel's lowest point at the origin. o: len, beam, depth, rake; paint(kind, s, g,
// side, i, c) colours it (kind 0 outside, 1 inside, 2 the rail; s -1 stern to 1 bow; g 0 keel to 1 sheer).
function loft(o, paint) {
  const NS = 24, NG = 7;
  const bs = s => o.beam / 2 * (s >= 0 ? Math.pow(Math.max(0, 1 - Math.pow(s, 2.3)), 0.7) : Math.pow(Math.max(0, 1 - Math.pow(-s, 3.0)), 0.6));
  const yk = s => o.depth * (s >= 0 ? 0.8 * Math.pow(s, 3.4) : 0.55 * Math.pow(-s, 4));
  const ys = s => o.depth * (1 + 0.14 * s * s + 0.12 * Math.max(0, s) ** 2);
  const pt = (s, g, side, inset = 0, out = V3()) => {
    const f = g * Math.PI / 2, k = yk(s), top = ys(s);
    let y = k + (top - k) * (1 - Math.pow(Math.cos(f), 1.4)), z = side * bs(s) * Math.pow(Math.sin(f), 0.6);
    if (inset) { z *= 1 - inset; y = g > 0.99 ? top : Math.min(top, Math.max(y + 0.004, k + 0.26 * (top - k))); }
    return out.set(s * o.len / 2 + o.rake * s * Math.abs(s) * g * (s > 0 ? 1 : 0.5), y, z);
  };
  const shell = inset => grid(NS, 2 * NG, (i, j, q) => {
    const s = -1 + 2 * i / NS, g = Math.abs(j - NG) / NG, side = j < NG ? -1 : 1;
    pt(s, g, side, inset, q.p); paint(inset ? 1 : 0, s, g, side, i, q.c); q.uv[0] = i / NS * 2.2 + (inset ? 0.37 : 0); q.uv[1] = j / (2 * NG) * 1.3 + (inset ? 0.21 : 0);
  }, V3(0, inset ? 1 : -1, 0));
  const rail = side => grid(NS, 1, (i, j, q) => {
    const s = -1 + 2 * i / NS; pt(s, 1, side, j ? 0.11 : 0, q.p); if (!j) { q.p.z *= 1.03; q.p.z += side * 0.002; } q.p.y += 0.003;
    paint(2, s, 1, side, i, q.c); q.uv[0] = i / NS * 2.2; q.uv[1] = 0.05 + j * 0.06;
  }, V3(0, 1, 0));
  // how far it must be lifted, heeled th radians about its keel, for its bilge to rest on the ground
  const sec = []; for (let j = 0; j <= 24; j++) { const p = pt(0, j / 24, 1); sec.push([p.z, p.y]); }
  const lift = th => { let m = 0; const c = Math.cos(th), s = Math.sin(th); for (const [z, y] of sec) m = Math.min(m, y * c - z * s); return -m; };
  return { geo: [shell(0), shell(0.11), rail(-1), rail(1)], pt, lift, ys, yk, bs };
}

// ---- his marks: quads in one instanced mesh, each lying along its own axis in the world, its width either given
// (a plank's stroke, a stone on the floor) or turned to face the eye (a sail, a far hull).
function markMesh(n, tex) {
  const geo = new THREE.PlaneGeometry(1, 1), at = {};
  for (const name of ['aP', 'aA', 'aB']) { at[name] = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage); geo.setAttribute(name, at[name]); }
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  mat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aP, aA, aB; varying vec2 vSUv; varying float vSlot, vAl;')
      .replace('#include <project_vertex>', `
  vec3 mA = aA.xyz, mB = aB.xyz;
  if (aB.w > 0.0) { vec3 s = cross(mA, normalize(cameraPosition - aP.xyz)); float sl = length(s); mB = sl > 1e-5 ? s / sl * aB.w : vec3(0.0); }
  vec4 mvPosition = viewMatrix * vec4(aP.xyz + mA * position.x + mB * position.y, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vSUv = uv; vSlot = aA.w; vAl = aP.w;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vSUv; varying float vSlot, vAl;')
      .replace('#include <map_fragment>', '{ vec4 st = texture2D(map, (vSUv + vec2(mod(vSlot, 2.0), floor(vSlot * 0.5))) * 0.5); diffuseColor.a *= st.a * min(vAl, 1.0); }');
  };
  mat.customProgramCacheKey = () => 'sainte-adresse-marks';
  const im = new THREE.InstancedMesh(geo, mat, n);
  im.setColorAt(0, new THREE.Color(1, 1, 1)); im.instanceColor.setUsage(THREE.DynamicDrawUsage); im.count = 0;
  const P = at.aP.array, A = at.aA.array, B = at.aB.array, C = im.instanceColor.array;
  const M = {
    mesh: im, mat, n: 0,
    // p the middle, a its length (a vector), b its width (a vector), or null and wid: facing the eye
    put(p, a, b, wid, slot, alpha, c, k = 1) {
      const i = M.n; if (i >= n || alpha <= 0.003) return; M.n = i + 1; const j = i * 4;
      P[j] = p.x; P[j + 1] = p.y; P[j + 2] = p.z; P[j + 3] = alpha; A[j] = a.x; A[j + 1] = a.y; A[j + 2] = a.z; A[j + 3] = slot;
      if (b) { B[j] = b.x; B[j + 1] = b.y; B[j + 2] = b.z; B[j + 3] = 0; } else { B[j] = B[j + 1] = B[j + 2] = 0; B[j + 3] = wid; }
      C[i * 3] = c.r * k; C[i * 3 + 1] = c.g * k; C[i * 3 + 2] = c.b * k;
    },
    flush() { im.count = M.n; im.visible = M.n > 0; if (M.n) { for (const k in at) at[k].needsUpdate = true; im.instanceColor.needsUpdate = true; } },
  };
  return M;
}

lifeFor(14598, {
  title: /^The Beach at Sainte-Adresse/,
  word: 'ebb',
  // (a small work hung high: the kit keeps all of it in view. The camera stands low on the beach, square to the wall, the
  // sea to the right and beyond as he has it; the two boats and the baskets lie within the strip a phone held upright shows)
  stage: { out: 2.2, half: 1.4, cam: { dist: 2.8, height: 0.5, side: 0.05, fov: 60, lookU: 0.05, lookOut: 0.7, lookH: 0.62, floorOut: 1.5 } },
  wake: 2, ret: 2.6,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.2) => P.near(h, a), css = (h, a = 0.2) => '#' + col(h, a).getHexString();
    this.v = V3(); this.a = V3(); this.b = V3(); this.w = V3(); this.M = new THREE.Matrix4(); this.M3 = new THREE.Matrix3(); this.E = new THREE.Euler(0, 0, 0, 'YXZ'); this.Q = new THREE.Quaternion(); this.S1 = V3(1, 1, 1);
    const T = this.T = V3(L.tx, 0, L.tz), N = this.N = V3(L.nx, 0, L.nz); this.UP = V3(0, 1, 0);
    const y0 = this.y0 = L.y + 0.013, HOME = this.HOME = -L.wall - 0.27;
    this.sr = rng(145980);
    // how far along the wall the room lets it go (a doorway on one side here, the corner on the other)
    const Rm = L.room; let uLo = -1.4, uHi = 1.6;
    if (Rm) { const e = Math.abs(L.tx) > 0.5 ? [(Rm.x0 - L.cx) / L.tx, (Rm.x1 - L.cx) / L.tx] : [(Rm.z0 - L.cz) / L.tz, (Rm.z1 - L.cz) / L.tz]; uLo = Math.max(uLo, Math.min(e[0], e[1]) + 0.02); uHi = Math.min(uHi, Math.max(e[0], e[1]) - 0.015); }
    this.uLo = uLo; this.uHi = uHi;

    // ---------------------------------------------------------- the ground: the sea and what it uncovers, one sheet
    // his stones: short loaded dabs of white, cream, pink and blue-grey, a ridge of lighter paint along each
    const tShingle = floorStrokes({ size: 512, base: css('#b9bec3'), n: 2500, len: [13, 30], width: [8, 15], bend: 0.22, seed: 14598, lift: 0.3, angle: (x, y, r) => (r() - 0.5) * 1.3,
      colors: [[css('#efece4'), 4], [css('#e2dfd8'), 4], [css('#cdd1d6'), 3], [css('#aebccc'), 3], [css('#e2c9ba'), 2.2], [css('#a1a8b0'), 1.2], [css('#dbcdae'), 1.2], [css('#6c6866', 0.1), 0.3]] });
    // his sea: long level strokes of milky green, a few paler
    const tSea = floorStrokes({ size: 256, base: css('#84c3b8', 0.16), n: 520, len: [26, 72], width: [5, 10], bend: 0.05, seed: 145981, lift: 0.1, angle: (x, y, r) => (r() - 0.5) * 0.07,
      colors: [[css('#93cdc2', 0.16), 4], [css('#7abdb1', 0.16), 3], [css('#a6d7cc', 0.16), 3], [css('#c6e6de', 0.16), 1.3], [css('#70b5a9', 0.16), 2]] });
    const gp = [], O_IN = -L.wall + 0.004, O_OUT = 2.6;
    for (const [u, o] of [[uLo, O_IN], [uHi, O_IN], [uLo, O_OUT], [uHi, O_OUT]]) { const p = L.floor(u, o); gp.push(p.x, y0, p.z); }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); gg.setIndex([0, 2, 1, 1, 2, 3]);
    const gu = this.gu = {
      tShingle: { value: tShingle }, tSea: { value: tSea }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uO: { value: L.floor(0, 0) },
      uTide: { value: new THREE.Vector4(X_IN, 0, 0, 0) }, uBeach: { value: new THREE.Vector4(X_IN, 9, 1, 0) }, uSh: { value: Array.from({ length: NSH * 2 }, () => new THREE.Vector4()) },
      uLim: { value: uLo + 0.12 }, uGain: { value: new THREE.Vector3(0.6, 0.62, 0.66) },
    };
    const gm = this.gmat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
    gm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, gu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vW = (modelMatrix * vec4(position, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform sampler2D tShingle, tSea; uniform vec4 uAx, uTide, uBeach; uniform vec3 uO, uGain; uniform vec4 uSh[${NSH * 2}]; uniform float uLim;
varying vec3 vW; vec3 gCol; float gA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 r = vW.xz - uO.xz, q = vec2(dot(r, uAx.xy), dot(r, uAx.zw));
  float xl = dot(q - vec2(${P0[0].toFixed(3)}, ${P0[1].toFixed(3)}), vec2(${NL[0].toFixed(3)}, ${NL[1].toFixed(3)})), al = dot(q - vec2(${P0[0].toFixed(3)}, ${P0[1].toFixed(3)}), vec2(${TS[0].toFixed(3)}, ${TS[1].toFixed(3)})), tm = uBeach.w;
  if (xl > max(uBeach.x, uTide.x + uTide.z) + 0.09) discard;          // (beyond anything the sea has reached)
  vec4 sh = texture2D(tShingle, q * 0.95 + vec2(0.13, 0.31)); float id = sh.a;
  // the water's edge: the tide, and the small wave on it (running up quickly, draining back slowly, a little later
  // further along the shore), never quite straight
  float ph = fract(uTide.y - al * 0.16), sw = ph < 0.3 ? 1.0 - pow(1.0 - ph / 0.3, 3.0) : 1.0 - smoothstep(0.0, 1.0, (ph - 0.3) / 0.7);
  float edge = uTide.x + uTide.z * (sw - 0.4) + 0.022 * sin(al * 6.0 + tm * 0.7) + 0.014 * sin(al * 13.0 - tm * 1.1);
  float d = edge - xl;
  // his stones lie only where the sea has been; the top of the beach is ragged, a dab at a time
  float beach = smoothstep(-0.012, 0.012, uBeach.x + (id - 0.95) * 0.28 + 0.03 * sin(al * 4.3) - xl) * uBeach.z;
  // wet below the drying line: darker, cooler, and here and there a stone catches the sky
  float wet = smoothstep(-0.05, 0.05, uBeach.y + (id - 0.62) * 0.3 - xl);
  vec3 dry = sh.rgb, wc = dry * vec3(0.47, 0.55, 0.64);
  wc += vec3(0.2, 0.23, 0.24) * smoothstep(0.88, 1.0, id) * (0.55 + 0.45 * sin(tm * 1.3 + id * 60.0));
  vec3 col = mix(dry, wc, wet);
  col *= 0.93 + 0.09 * sin(q.x * 1.3 + q.y * 0.9 - tm * 0.13);          // the cloud's light, going over
  float shade = 1.0;
  for (int i = 0; i < ${NSH}; i++) { vec4 A = uSh[i * 2], B = uSh[i * 2 + 1]; if (B.z <= 0.0) continue; vec2 e = vW.xz - A.xy; vec2 l = vec2(dot(e, A.zw), dot(e, vec2(-A.w, A.z))) / B.xy; shade *= 1.0 - B.z * exp(-dot(l, l) * 1.5); }
  col *= shade;
  // the sea: level strokes, deeper in colour further from the edge, a pale band of light far out, and close in his
  // short dark green dashes
  float wa = smoothstep(0.0, 0.014, d);
  vec4 se = texture2D(tSea, vec2(q.x * 0.55 + 0.012 * sin(tm * 0.6 + q.y * 9.0), q.y * 1.1 + 0.004 * sin(tm * 0.9 + q.x * 5.0)));
  vec3 sea = se.rgb * mix(1.06, 0.9, smoothstep(0.0, 1.0, d));
  sea = mix(sea, vec3(0.74, 0.9, 0.86), 0.3 * exp(-pow((q.y - 0.2) / 0.13, 2.0)));
  float dash = step(0.95, texture2D(tSea, q * vec2(2.1, 3.3) + 0.4).a) * (1.0 - smoothstep(0.2, 0.75, d)) * smoothstep(0.04, 0.13, d);
  sea = mix(sea, vec3(0.13, 0.45, 0.38), dash * 0.8);
  sea *= mix(1.0, shade, 0.55);
  float aw = wa * mix(0.5, 0.97, smoothstep(0.0, 0.2, d));
  float foam = wa * (1.0 - smoothstep(0.0, 0.028 + 0.03 * sw, d)) * (0.5 + 0.5 * step(0.5, id));
  foam += 0.3 * wa * (1.0 - smoothstep(0.0, 0.012, abs(d - 0.075 - 0.02 * sin(al * 9.0 + tm)))) * step(0.55, se.a);
  vec3 c = mix(col, sea, beach > 0.001 ? aw : 1.0);
  c = mix(c, vec3(0.93, 0.96, 0.94), clamp(foam, 0.0, 1.0) * 0.85);
  float a = beach + (1.0 - beach) * aw;
  a *= smoothstep(uLim, uLim + 0.16, q.x + (id - 0.62) * 0.4);
  gCol = c * uGain; gA = a;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = gCol; diffuseColor.a = gA;\n#include <opaque_fragment>');
    };
    gm.customProgramCacheKey = () => 'sainte-adresse-ground';
    const ground = this.ground = new THREE.Mesh(gg, gm); ground.renderOrder = 5;
    L.add(ground);
    // (it lies on the floor: not drawn into the polished floor's reflection. The mirror shows and hides what it is
    // given, so the sheet is shown and hidden by its material.)
    { const fl = L.k.museum.floors; if (fl && !fl.includes(ground)) fl.push(ground); }

    // ---------------------------------------------------------- the rig: boats, the log, the baskets
    const tBrush = floorStrokes({ size: 256, base: '#c2c2c2', n: 620, len: [26, 64], width: [5, 11], bend: 0.12, seed: 145982, lift: 0.22, angle: (x, y, r) => (r() - 0.5) * 0.28,
      colors: [['#ffffff', 3], ['#e2e2e2', 3], ['#bdbdbd', 3], ['#9a9a9a', 2], ['#7c7c7c', 0.8]] });
    const rm = new THREE.MeshStandardMaterial({ vertexColors: true, map: tBrush, roughness: 0.95, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.4 });
    rm.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= diffuseColor.rgb;'); };
    rm.customProgramCacheKey = () => 'sainte-adresse-rig';
    const rig = this.rig = L.rig(8, 26000, rm);
    const mix3 = (a, b, k, into) => into.copy(a).lerp(b, clamp01(k));
    const K = {
      blue: { low: col('#1a3676', 0.1), mid: col('#2455b4', 0.1), top: col('#3f76cc', 0.1), rail: col('#c9a555'), in0: col('#a58b5a'), in1: col('#dccba2'), thwart: col('#cfbb8c') },
      tar: { low: col('#3d2b24'), mid: col('#221e1c'), top: col('#2b2623'), stripe: col('#9aa0a5'), rail: col('#3b302a'), in0: col('#4d3b33'), in1: col('#7a655a'), thwart: col('#8c7b6c'), patch: col('#d6bf3c', 0.1) },
    };
    const boats = this.boats = BOATS.map((def, bi) => {
      const k = K[def.id], blue = def.id === 'blue';
      const H = loft(def, (kind, s, g, side, i, c) => {
        const j = 1.1 + 0.2 * hash(i * 3.1 + kind, g * 17 + side);
        if (kind === 2) c.copy(k.rail);
        else if (kind === 1) { mix3(k.in0, k.in1, (g - 0.25) / 0.6, c); if (!blue && i % 3 === 0 && g > 0.2) c.lerp(k.in1, 0.5); }
        else if (blue) { if (g < 0.4) mix3(k.low, k.mid, g / 0.4, c); else mix3(k.mid, k.top, (g - 0.62) / 0.3, c); }
        else { mix3(k.low, k.mid, g / 0.45, c); if (g > 0.66 && g < 0.9) c.lerp(k.stripe, 0.85); else if (g >= 0.9) c.copy(k.top); if (k.patch && s < -0.72 && g > 0.6) c.lerp(k.patch, 0.9); }
        c.multiplyScalar(j);
      });
      const parts = [...H.geo];
      // the thwarts; the blue boat's oars and the ochre spar out over its bow; the tarred boat's bare pole
      for (const s of blue ? [-0.42, 0.22] : [-0.52, -0.08, 0.42]) { const yy = H.yk(s) + 0.66 * (H.ys(s) - H.yk(s)); parts.push(uvOf(shape.move(shape.box(0.034, 0.008, H.bs(s) * 1.72, k.thwart), s * def.len / 2, yy, 0))); }
      if (blue) {
        const oar = col('#d2ab57'), yy = H.ys(0) * 0.78;
        parts.push(uvOf(shape.move(shape.cyl(0.006, 0.0048, def.len * 0.88, 6, oar), 0.15, yy + 0.04, -0.008, 0, 0.03, -(Math.PI / 2 - 0.2))));      // (the spar, out over the bow)
        parts.push(uvOf(shape.move(shape.cyl(0.005, 0.004, def.len * 0.62, 6, col('#c49a4c')), -0.02, yy + 0.006, 0.03, 0, -0.06, Math.PI / 2)));
        parts.push(uvOf(shape.move(shape.box(0.085, 0.004, 0.022, oar), -0.2, yy + 0.006, 0.047, 0, -0.06, 0)));
      }
      if (def.id === 'tar') parts.push(uvOf(shape.move(shape.cyl(0.0085, 0.005, 0.47, 7, col('#2a2420')), 0.1 * def.len, 0.04 + 0.235, 0)));
      const gid = rig.geo(mergeAll(parts)), inst = rig.add(gid);
      // where it lies, in the world, and which way it leans (towards the room, so its inside shows)
      const yaw = L.yawOf(def.bow[0], def.bow[1]) - Math.PI / 2, lz = Math.sin(yaw) * L.nx + Math.cos(yaw) * L.nz;
      const B = { def, inst, pt: H.pt, lift: H.lift, yaw, lean: lz >= 0 ? 1 : -1, hu: def.u + (bi ? 0.14 : -0.1), th: 0, om: 0, down: false, fl: 1, nudge: 0, pos: V3(), m: new THREE.Matrix4(), strokes: [], ph: bi * 2.1 + 0.4 };
      // his paint on the planking: strokes that follow the strakes, each a little off the tone under it
      const plank = (s0, s1, g, side, hex, wid, slot = 0, al = 0.95, mixin = 0.15) => {
        const p0 = H.pt(s0, g, side), p1 = H.pt(s1, g, side), pm = H.pt((s0 + s1) / 2, g, side), ga = g > 0.9 ? H.pt((s0 + s1) / 2, g - 0.1, side) : H.pt((s0 + s1) / 2, g + 0.1, side);
        const a = p1.sub(p0), b = g > 0.9 ? pm.clone().sub(ga) : ga.sub(pm); b.normalize().multiplyScalar(wid);
        const n = a.clone().cross(b).normalize(); if (n.z * side < 0) n.negate();
        B.strokes.push({ c: pm.addScaledVector(n, 0.004), a: a.multiplyScalar(1.14), b, slot, col: col(hex, mixin), al });
      };
      for (const side of [-1, 1]) {
        if (blue) {
          [[-0.82, -0.46], [-0.4, -0.04], [0.02, 0.38], [0.44, 0.8]].forEach(([a, b], i) => plank(a, b, 0.84, side, i % 2 ? '#4f86d4' : '#5c93dc', 0.016, i % 2 ? 0 : 3, 0.9, 0.08));
          [[-0.62, -0.24], [-0.12, 0.3], [0.36, 0.72]].forEach(([a, b], i) => plank(a, b, 0.55, side, i % 2 ? '#2c62c2' : '#1f4ca6', 0.022, 0, 0.85, 0.08));
          [[-0.5, -0.08], [0.06, 0.5]].forEach(([a, b]) => plank(a, b, 0.3, side, '#172f6c', 0.02, 3, 0.85, 0.08));
          [[-0.9, -0.54], [-0.5, -0.12], [-0.08, 0.3], [0.34, 0.7], [0.72, 0.98]].forEach(([a, b], i) => plank(a, b, 1, side, i % 2 ? '#d9b45e' : '#c79e4c', 0.011, 0, 0.95));
        } else {
          [[-0.8, -0.42], [-0.36, 0.04], [0.1, 0.5], [0.54, 0.9]].forEach(([a, b], i) => plank(a, b, 0.79, side, i % 2 ? (def.id === 'tar' ? '#b4b9be' : '#a9aeb3') : (def.id === 'tar' ? '#9299a0' : '#8f959b'), 0.015, i % 2 ? 0 : 3, 0.92));
          [[-0.55, -0.1], [0.05, 0.5]].forEach(([a, b], i) => plank(a, b, 0.4, side, def.id === 'tar' ? (i ? '#4a3227' : '#3a2a25') : '#2f2926', 0.022, 3, 0.8));
          if (def.id === 'tar') plank(-0.95, -0.74, 0.78, side, '#dcc640', 0.026, 0, 0.95, 0.08);
        }
      }
      return B;
    });
    // the log the blue boat is left on; the two baskets (one tall with a hoop handle, one round)
    this.log = rig.add(rig.geo(uvOf(shape.paint(shape.move(shape.cyl(0.019, 0.017, 0.27, 9, col('#5a463a')), 0, 0, 0, Math.PI / 2, 0, 0), (c, n) => (n.y > 0.4 ? col('#7d6756') : n.y < -0.3 ? col('#3a2d27') : null)))));
    const wick = col('#a88355'), wickD = col('#6f5338'), wickL = col('#c4a36e');
    const weave = g => shape.paint(g, (c, n, f) => (c.y > 0.07 ? wickD : hash(Math.floor(c.y * 90), Math.floor(Math.atan2(c.z, c.x) * 4.5)) > 0.55 ? wickL : n.y > 0.5 ? wickD : null));
    const handle = new THREE.TorusGeometry(0.036, 0.0042, 5, 12, Math.PI).toNonIndexed(); handle.deleteAttribute('uv');
    { const cc = new Float32Array(handle.attributes.position.count * 3); for (let i = 0; i < cc.length; i += 3) { cc[i] = wickD.r; cc[i + 1] = wickD.g; cc[i + 2] = wickD.b; } handle.setAttribute('color', new THREE.BufferAttribute(cc, 3)); }
    const g1 = mergeAll([uvOf(weave(shape.lathe([[0.026, 0], [0.036, 0.012], [0.044, 0.05], [0.046, 0.074], [0.04, 0.078], [0.03, 0.062], [0.001, 0.058]], 18, wick)), 14), uvOf(shape.move(handle, 0, 0.074, 0), 14)]);
    const g2 = uvOf(weave(shape.lathe([[0.02, 0], [0.038, 0.012], [0.047, 0.04], [0.042, 0.07], [0.031, 0.08], [0.024, 0.07], [0.001, 0.062]], 18, col('#8a6d4c'))), 14);
    this.baskets = BASKETS.map((d, i) => ({ d, inst: rig.add(rig.geo(i ? g2 : g1)), pos: V3(), rest: L.floor(d.u, d.o).setY(y0), from: V3(), lip: V3(), g1: V3(), g2: V3(), r0: V3(), p0: 0, yaw: 0, pitch: 0, roll: 0, set: false }));

    // ---------------------------------------------------------- his marks
    // four in one texture, each along its length: 0 a loaded dab, ragged at both ends; 1 a soft spot; 2 a sail (broad
    // at the foot, narrowing to its peak, the bristles showing); 3 a dry dab
    const atlas = canvasTexture(256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.lineCap = 'round'; const r = rng(14598);
      const cell = (cx, cy, draw) => { g.save(); g.beginPath(); g.rect(cx * 128, (1 - cy) * 128, 128, 128); g.clip(); g.translate(cx * 128, (1 - cy) * 128); draw(); g.restore(); };
      cell(0, 0, () => {
        for (let i = 0; i < 34; i++) { const y = 64 + (r() - 0.5) * 62, k = 1 - Math.abs(y - 64) / 34, x0 = 8 + r() * 14 + (1 - k) * 20, x1 = 120 - r() * 14 - (1 - k) * 20; g.strokeStyle = `rgba(255,255,255,${0.3 + 0.4 * r()})`; g.lineWidth = 4 + r() * 8; g.beginPath(); g.moveTo(x0, y + (r() - 0.5) * 5); g.quadraticCurveTo(64, y - 3 + (r() - 0.5) * 8, x1, y + (r() - 0.5) * 6); g.stroke(); }
        g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(64, 64, 40, 19, 0, 0, Math.PI * 2); g.fill();
      });
      cell(1, 0, () => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 60); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(2, 2, 124, 124); });
      cell(0, 1, () => {
        // (a lug sail: its foot at x = 0, its peak at x = 128, at the after end; the luff, forward, about half as high)
        const sail = () => { g.beginPath(); g.moveTo(5, 113); g.quadraticCurveTo(62, 116, 124, 104); g.lineTo(68, 24); g.quadraticCurveTo(36, 15, 6, 13); g.closePath(); };
        g.fillStyle = 'rgba(255,255,255,0.88)'; sail(); g.fill();
        g.save(); sail(); g.clip();
        for (let i = 0; i < 26; i++) { const t = r(), y0 = 13 + t * 100, y1 = 24 + t * 80; g.strokeStyle = `rgba(255,255,255,${0.3 + 0.5 * r()})`; g.lineWidth = 4 + r() * 7; g.beginPath(); g.moveTo(2, y0); g.lineTo(60 + 64 * t, y1 + (r() - 0.5) * 6); g.stroke(); }
        g.restore();
      });
      cell(1, 1, () => { for (let i = 0; i < 13; i++) { const y = 64 + (r() - 0.5) * 58, k = 1 - Math.abs(y - 64) / 32, x0 = 8 + r() * 30 + (1 - k) * 20, x1 = 120 - r() * 30 - (1 - k) * 20; g.strokeStyle = `rgba(255,255,255,${0.5 + 0.45 * r()})`; g.lineWidth = 3 + r() * 6; g.beginPath(); g.moveTo(x0, y + (r() - 0.5) * 4); g.quadraticCurveTo(64, y - 2 + (r() - 0.5) * 6, x1, y + (r() - 0.5) * 5); g.stroke(); } });
    }, false);
    const marks = this.marks = markMesh(NMARK, atlas); marks.mesh.renderOrder = 7;
    L.add(marks.mesh);
    this.sailCols = ['#40241f', '#4a2a22', '#36201c', '#523026', '#3c221d'].map(h => col(h, 0.1)); this.sailLit = col('#7a4a38', 0.1);
    this.hullCol = col('#262220'); this.hullStripe = col('#b9bcbd'); this.refl = col('#45ad92', 0.06); this.reflD = col('#5cb39c', 0.06);
    this.pebCols = ['#eeeae2', '#d5d8db', '#bfc7d0', '#e6d4c9', '#aeb3b8'].map(h => col(h));
    this.pebs = Array.from({ length: NPEB }, () => ({ t: -9, x: 0, z: 0, vx: 0, vz: 0, vy: 0, c: 0, s: 0.03 })); this.pi = 0;

    this.sea = L.voice().loop({ lp: 950, hp: 160 }); this.hiss = L.voice().loop({ lp: 6200, hp: 2100 });
    this.gmat.visible = false;
  },

  // ---------------------------------------------------------------- the tide, by show-time (metres up the beach)
  tide(ts) {
    if (ts < T_FLOOD) return X_IN + (X_HIGH - X_IN) * ease.out(ts / T_FLOOD);
    return X_HIGH - (X_HIGH - X_LOW) * ease.smooth(ramp(ts, T_EBB, T_OUT));
  },
  // a stone skips from (x, z), going (vx, vz)
  skip(x, z, vx, vz, vy, s) { const p = this.pebs[this.pi = (this.pi + 1) % NPEB]; p.t = this.clock; p.x = x; p.z = z; p.vx = vx; p.vz = vz; p.vy = vy; p.s = s; p.c = this.pi % this.pebCols.length; },
  // stones knocking together: n small clicks over `over` seconds
  rattle(L, n, over, vol) { if (L.quiet) return; const v = L.voice(), r = this.sr; for (let i = 0; i < n; i++) noise(v, r() * over, { d: 0.014 + 0.022 * r(), vol: vol * (0.5 + r()), bp: 1900 + 3600 * r(), q: 2.5 }); },
  // its keel finds the bottom: a soft knock, a stone or two
  touch(L, B) {
    if (L.quiet || this.ts < T_FLOOD) return;
    const v = L.voice(), calm = L.calm;
    v.note(B.def.id === 'blue' ? 140 : 84, 0.18, { vol: calm ? 0.012 : 0.022, type: 'sine', to: B.def.id === 'blue' ? 110 : 60, attack: calm ? 0.06 : 0.008 }); this.rattle(L, 2, 0.2, 0.006);
  },
  // a boat takes the ground: the crunch of its bilge on the stones, and the stones it sends skipping
  crunch(L, B, hard) {
    const calm = L.calm, d = B.def, cy = Math.cos(B.yaw), sy = Math.sin(B.yaw);
    if (!calm) for (let i = 0; i < (hard ? 9 : 4); i++) {
      const s = (this.sr() - 0.5) * d.len * 0.7, lx = sy * B.lean, lz = cy * B.lean;      // (along the hull; the way it leans)
      this.skip(B.pos.x + cy * s + lx * d.beam * 0.42, B.pos.z - sy * s + lz * d.beam * 0.42, lx * (0.25 + 0.5 * this.sr()) + cy * (this.sr() - 0.5) * 0.3, lz * (0.25 + 0.5 * this.sr()) - sy * (this.sr() - 0.5) * 0.3, 0.5 + 0.7 * this.sr(), 0.022 + 0.018 * this.sr());
    }
    if (L.quiet) return;
    const v = L.voice(), k = (hard ? 1 : 0.55) * (calm ? 0.5 : 1);
    noise(v, 0, { d: hard ? 0.34 : 0.22, vol: 0.05 * k, bp: 1300, q: 0.7, attack: calm ? 0.08 : 0.004 }); noise(v, 0, { d: 0.2, vol: 0.035 * k, lp: 320, attack: calm ? 0.08 : 0.004 });
    v.note(d.id === 'blue' ? 196 : 98, 0.22, { vol: 0.03 * k, type: 'sine', to: d.id === 'blue' ? 150 : 62, attack: calm ? 0.06 : 0.005 });
    if (d.id === 'blue') v.note(392, 0.09, { vol: 0.014 * k, type: 'triangle', attack: calm ? 0.05 : 0.004 });
    this.rattle(L, hard ? 10 : 5, 0.45, 0.012 * k);
  },

  start(L, resumed) {
    this.gmat.visible = true;
    if (resumed) return;
    this.ts = 0; this.tw = 0; this.clock = 0; this.lapPh = 0; this.lapA = 0; this.mark = X_IN; this.X = X_IN; this.dryF = 9; this.spill = -1; this.shingle = 1; this.crAt = 0;
    for (const b of this.boats) { b.th = 0; b.om = 0; b.down = false; b.felt = false; b.fl = 1; b.nudge = 0; }
    for (const p of this.pebs) p.t = -9;
    for (const K of this.baskets) K.set = false;
    this.gu.uBeach.value.set(X_IN, 9, 1, 0);
  },
  back(L) { this.X0 = this.X; this.mark0 = this.mark; },
  end(L) { this.gmat.visible = false; this.sea.set(0); this.hiss.set(0); },
  reset(L) { if (this.gmat) this.end(L); },

  update(L, dt) {
    const ph = L.phase, out = ph === 'wake' || ph === 'play' || ph === 'linger', ret = ph === 'return', calm = L.calm, G = L.k.G, gu = this.gu, M = this.marks, rig = this.rig;
    const T = this.T, N = this.N, UP = this.UP, v = this.v, a = this.a, b = this.b, y0 = this.y0, slow = calm ? 0.5 : 1;
    if (out) this.ts += dt;
    this.tw += dt * slow; this.clock += dt;
    const ts = this.ts, tw = this.tw, R = L.ret;

    // ---- the tide, and the small wave on it
    let X, lapA, home = 0;
    if (ret) {
      // it comes back up over everything it uncovered, floats the boats off, and goes into the wall
      const pk = Math.max(this.X0, this.mark0 - 0.03);
      X = R < 0.4 ? lerp(this.X0, pk, ease.inOut(R / 0.4)) : R < 0.47 ? pk : lerp(pk, X_IN, ease.in((R - 0.47) / 0.53));
      lapA = 0.03 * (1 - ramp(R, 0.3, 0.6));
      this.shingle = 1 - ease.smooth(ramp(R, 0.36, 0.5));
      home = ease.inOut(ramp(R, 0.43, 0.93));
    } else {
      X = this.tide(ts);
      lapA = (ts < T_FLOOD ? 0.02 : ts < T_EBB ? 0.07 : ts < T_OUT ? 0.12 : 0.075 + 0.045 * Math.max(0, Math.sin(this.lapPh * Math.PI / 2)) ** 6) * (calm ? 0.6 : 1);
      this.shingle = 1;
    }
    this.lapA = lerp(this.lapA, lapA, Math.min(1, dt * 3)); this.X = X;
    this.lapPh += dt / (calm ? LAP * 2 : LAP);
    const lp = this.lapPh - Math.floor(this.lapPh), sw = lp < 0.3 ? 1 - Math.pow(1 - lp / 0.3, 3) : 1 - ease.smooth((lp - 0.3) / 0.7);
    if (!ret) this.mark = Math.max(this.mark, X + (ts < T_FLOOD ? 0 : this.lapA * 0.6));
    // the stones dry from the top of the beach down, behind the water
    if (ret || ts < T_EBB + 1.0) this.dryF = 9; else this.dryF = Math.max(X + 0.24, this.mark + 0.2 - 0.22 * (ts - T_EBB - 1.0));
    gu.uTide.value.set(X, this.lapPh, this.lapA, 0);
    gu.uBeach.value.set(this.mark, this.dryF, this.shingle, tw);

    // ---- the toy, if it is on the beach
    const veh = G.vehicle, toy = out && G.state === 'play' && veh && veh.group.visible && Math.abs(veh.pos.y - L.y) < 0.4 ? veh : null;
    let tq = null, tsp = 0;
    if (toy) { tq = L.local(toy.pos.x, toy.pos.z); tsp = Math.hypot(toy.vel.x, toy.vel.z); }

    M.n = 0;
    // ---- the far sails: out of the wall with the first water; they nod, and drift a little
    for (let i = 0; i < LUGGERS.length; i++) {
      const g = LUGGERS[i], k = g.k, kin = ret ? ease.in(ramp(R, 0.45, 0.95)) : 1 - ease.out(ramp(ts, 0.25 + 0.12 * i, 1.7 + 0.1 * i));
      const o = lerp(g.o, this.HOME + 0.1, kin), u = g.u + 0.05 * Math.sin(tw * 0.11 + i * 2.2) + 0.1 * kin;
      const rock = (0.05 * Math.sin(tw * 1.3 + i * 1.9) + 0.025 * Math.sin(tw * 2.2 + i)) * (calm ? 0.6 : 1), cr = Math.cos(rock), sr = Math.sin(rock);
      const base = L.floor(u, o, this.w); base.y = y0 + 0.004 * Math.sin(tw * 1.6 + i * 2.7);
      const al = clamp01((o + L.wall) / 0.05);
      if (al <= 0) continue;
      // its reflection: his dark green on the water under each, broken
      for (let j = 0; j < 3; j++) { v.copy(base).addScaledVector(N, (0.07 + 0.09 * j) * k).addScaledVector(T, 0.012 * Math.sin(tw * 1.7 + j * 2.1 + i)); v.y = y0 + 0.003; M.put(v, a.copy(T).multiplyScalar((0.36 - 0.07 * j) * k), b.copy(N).multiplyScalar((0.13 - 0.02 * j) * k), 0, j ? 3 : 0, al * (0.7 - 0.17 * j) * (0.85 + 0.15 * Math.sin(tw * 2.3 + j + i)), j === 2 ? this.reflD : this.refl, 0.8); }
      // sails (each a broad dark stroke and a drier, warmer one over it), then the hull across their feet
      const hx = b.copy(T).multiplyScalar(cr).addScaledVector(UP, -sr), up = this.a.copy(UP).multiplyScalar(cr).addScaledVector(T, sr);
      const hxx = hx.x, hxy = hx.y, hxz = hx.z, ux = up.x, uy = up.y, uz = up.z;
      g.sails.forEach(([sx, sh, swd, lean], j) => {
        const cl = Math.cos(lean), sl = Math.sin(lean), ax = ux * cl + hxx * sl, ay = uy * cl + hxy * sl, az = uz * cl + hxz * sl, h = sh * k, f = 0.03 * k + h / 2;
        v.copy(base); v.x += hxx * sx * k + ax * f; v.y += hxy * sx * k + ay * f; v.z += hxz * sx * k + az * f;
        M.put(v, a.set(ax, ay, az).multiplyScalar(h), null, swd * k, 2, al, this.sailCols[(i * 2 + j) % 5], 0.8);
        v.x -= ax * h * 0.12; v.y -= ay * h * 0.12; v.z -= az * h * 0.12;
        M.put(v, a.set(ax, ay, az).multiplyScalar(h * 0.5), null, swd * k * 0.3, 3, al * 0.75, this.sailLit, 0.8);
      });
      v.copy(base); v.x += ux * 0.03 * k; v.y += uy * 0.03 * k; v.z += uz * 0.03 * k;
      M.put(v, a.set(hxx, hxy, hxz).multiplyScalar(0.42 * k), null, 0.2 * k, 0, al, this.hullCol, 0.8);
      v.x += ux * 0.022 * k; v.y += uy * 0.022 * k; v.z += uz * 0.022 * k; M.put(v, a.set(hxx, hxy, hxz).multiplyScalar(0.3 * k), null, 0.035 * k, 3, al * 0.8, this.hullStripe, 0.7);
    }

    // ---- the boats: afloat while the water over their place is deep enough; then they touch, lean, and go over
    const sub = Math.max(1, Math.ceil(dt / 0.012)), h = dt / sub, GR = calm ? 1.6 : 5.5;
    for (let bi = 0; bi < this.boats.length; bi++) {
      const B = this.boats[bi], d = B.def;
      const kh = ret ? home : 1 - ease.out(ramp(ts, d.t0, d.t1));
      const u = lerp(d.u, B.hu, kh) + 0.012 * Math.sin(tw * 0.5 + B.ph) * B.fl, o = lerp(d.o, this.HOME, kh), dep = o < 0.02 ? 1 : X - XL(u, o);      // (in the wall it is afloat)
      const fl = B.fl = ease.smooth(ramp(dep, d.touch - 0.03, d.touch + 0.09));
      const go = dep < d.go;
      if (dep > d.touch) B.down = B.felt = false;
      else if (!B.felt) { B.felt = true; this.touch(L, B); }
      for (let i = 0; i < sub; i++) {
        if (go) {
          B.om += (GR - B.om * 0.6) * h; B.th += B.om * h;
          if (B.th >= d.heel) { B.th = d.heel; if (!B.down) { B.down = true; this.crunch(L, B, bi === 0); if (bi === 0 && this.spill < 0 && !ret) this.spill = this.clock; } B.om = calm || B.om < 0.3 ? 0 : -0.38 * B.om; }
        } else {
          const tgt = dep > d.touch ? 0 : 0.32 * d.heel * (1 - (dep - d.go) / (d.touch - d.go));
          B.om += ((tgt - B.th) * (dep > d.touch ? 38 : 70) - B.om * (dep > d.touch ? 6.5 : calm ? 14 : 6)) * h; B.th += B.om * h;
          if (B.th > d.heel) { B.th = d.heel; B.om = 0; }
        }
      }
      // the toy going by: aground it rocks up off its bilge and falls back; afloat it bobs
      if (tq && tsp > 0.3 && this.clock > B.nudge && Math.hypot(tq.u - u, tq.out - o) < d.len * 0.5 + 0.08) { B.nudge = this.clock + 0.7; B.om += B.down ? -(calm ? 0.5 : 1.3) : 0.7; if (B.down && !L.quiet) this.rattle(L, 3, 0.25, 0.008); }
      const amp = fl * (calm ? 0.6 : 1), rock = amp * (0.075 * Math.sin(tw * 2.1 + B.ph) + 0.035 * Math.sin(tw * 3.3 + B.ph * 1.7));
      const heel = (B.th + rock) * B.lean, blue = d.id === 'blue';
      const trim = amp * 0.035 * Math.sin(tw * 1.7 + B.ph * 0.6) + (blue ? 0.085 * (1 - fl) : 0);
      const yaw = B.yaw + d.swing * kh + fl * 0.07 * Math.sin(tw * 0.37 + B.ph);
      L.floor(u, o, B.pos); B.pos.y = y0 + lerp(B.lift(Math.abs(B.th)) + (blue ? 0.014 : 0), -DRAFT + 0.006 * Math.sin(tw * 2.4 + B.ph), fl);
      this.E.set(heel, yaw, trim, 'YXZ'); this.M.compose(B.pos, this.Q.setFromEuler(this.E), this.S1); rig.mat(B.inst, this.M); this.M3.setFromMatrix4(this.M); B.m.copy(this.M);
      B.cy = Math.cos(yaw); B.sy = Math.sin(yaw); B.heelNow = heel; B.yawNow = yaw;
      const vis = o > -L.wall - 0.02 ? 1 : 0;
      for (const s of B.strokes) M.put(v.copy(s.c).applyMatrix4(this.M), a.copy(s.a).applyMatrix3(this.M3), b.copy(s.b).applyMatrix3(this.M3), 0, s.slot, s.al * vis, s.col, 0.82);
      // its shadow on the stones (and on the water, fainter)
      const S = gu.uSh.value; S[bi * 2].set(B.pos.x + N.x * 0.02, B.pos.z + N.z * 0.02, B.cy, -B.sy); S[bi * 2 + 1].set(d.len * 0.5, d.beam * 0.62, vis * (0.5 - 0.18 * fl), 0);
    }
    // the log, uncovered where the blue boat's bow will lie
    { const B = this.boats[1], d = B.def, lu = d.u + d.bow[0] * 0.11, lo = d.o + d.bow[1] * 0.11, dep = X - XL(lu, lo), k = ease.smooth(ramp(dep, 0.1, -0.02)) * this.shingle;
      L.floor(lu, lo, v); v.y = y0 + 0.016 - 0.07 * (1 - k); rig.put(this.log, v.x, v.y, v.z, B.yaw + 0.12, 0, 0, 1); rig.show(this.log, k > 0.01);
      const S = gu.uSh.value; S[4].set(v.x, v.z, Math.sin(B.yaw + 0.12), Math.cos(B.yaw + 0.12)); S[5].set(0.16, 0.05, 0.4 * k, 0); }

    // ---- the baskets: aboard the tarred boat until it goes over; then over the side, a bounce, and a roll to rest
    { const A = this.boats[0], d = A.def, tau = this.spill < 0 ? -1 : this.clock - this.spill, S = gu.uSh.value;
      for (let j = 0; j < 2; j++) {
        const K = this.baskets[j], lie = K.d.lie, along = -0.07 - 0.1 * j;
        let shd = 0;
        if (tau < 0) {
          // aboard: on the bottom boards, leaning with the boat
          K.pos.set(along, 0.042, 0.012 * (j ? -1 : 1)).applyMatrix4(A.m); K.yaw = A.yawNow; K.pitch = A.heelNow; K.roll = 0; K.set = false;
        } else if (ret) {
          // the water takes them where they lie: they float, and go in with the boats
          const q = L.local(K.r0.x, K.r0.z), fk = ease.smooth(ramp(X - XL(q.u, q.out), 0, 0.08)), hk = ease.inOut(ramp(R, 0.5, 0.95));
          K.pos.lerpVectors(K.r0, L.floor(K.d.u - 0.25, this.HOME, this.w), hk);
          K.pos.y = lerp(K.r0.y, y0 + (lie ? 0.024 : -0.02) + 0.006 * Math.sin(tw * 3 + j), fk);
          K.pitch = K.p0 + 0.12 * Math.sin(tw * 2.3 + j * 2) * fk; shd = 0.42 * (1 - fk);
        } else {
          if (!K.set) {
            K.set = true; K.from.copy(K.pos);
            const lx = A.sy * A.lean, lz = A.cy * A.lean;      // (the way the boat leans, in the world)
            K.lip.set(A.pos.x + A.cy * along + lx * (d.beam * 0.5 + 0.03), y0 + 0.075, A.pos.z - A.sy * along + lz * (d.beam * 0.5 + 0.03));
            K.g1.copy(K.lip).lerp(K.rest, 0.5); K.g2.copy(K.lip).lerp(K.rest, 0.82);
            K.yaw = Math.atan2(K.rest.x - K.lip.x, K.rest.z - K.lip.z);
            if (!L.quiet && !calm) { const vv = L.voice(); for (const t of [0.56, 0.82, 1.0]) noise(vv, t + 0.08 * j, { d: 0.05, vol: 0.016, bp: 700 + 200 * j, q: 3 }); }
          }
          const t = tau - 0.08 * j, end = lie ? Math.PI * 1.5 : Math.PI * 2;
          K.roll = 0;
          if (calm) {
            // set down, not tumbled
            const q = ease.inOut(ramp(t, 0, 1.6)); K.pos.lerpVectors(K.from, K.rest, q); K.pos.y = lerp(K.from.y, y0, q) + 0.05 * Math.sin(Math.PI * q); K.pitch = lie ? -q * Math.PI / 2 : 0;
          } else if (t < 0.26) { const q = ease.in(ramp(t, 0, 0.26)); K.pos.lerpVectors(K.from, K.lip, q); K.pitch = 0.9 * q; }
          else if (t < 0.56) { const q = (t - 0.26) / 0.3; K.pos.lerpVectors(K.lip, K.g1, q); K.pos.y = lerp(K.lip.y, y0, q * q) + 0.045 * 4 * q * (1 - q); K.pitch = 0.9 + q * (lie ? 2.2 : 2.9); }
          else if (t < 0.82) { const q = (t - 0.56) / 0.26; K.pos.lerpVectors(K.g1, K.g2, q); K.pos.y = y0 + 0.03 * 4 * q * (1 - q); K.pitch = (lie ? 3.1 : 3.8) + q * (lie ? 0.9 : 1.5); }
          else {
            const q = ease.out(ramp(t, 0.82, lie ? 1.7 : 1.3)), w = t - 0.82; K.pos.lerpVectors(K.g2, K.rest, q); K.pos.y = y0;
            if (lie) K.pitch = 4.0 + q * (end - 4.0) + 0.1 * Math.exp(-w * 2.6) * Math.sin(w * 9);
            else { const wob = 0.24 * Math.exp(-w * 2.2); K.pitch = 5.3 + q * (end - 5.3) + wob * Math.cos(w * 13); K.roll = wob * Math.sin(w * 13); }
          }
          K.pos.y += 0.044 * Math.abs(Math.sin(K.pitch));      // (on its side its middle is that much off the ground)
          shd = 0.42 * clamp01(t / 0.6);
          K.r0.copy(K.pos); K.p0 = K.pitch;
        }
        rig.put(K.inst, K.pos.x, K.pos.y, K.pos.z, K.yaw, K.pitch, K.roll, 1);
        rig.show(K.inst, L.local(K.pos.x, K.pos.z).out > -L.wall - 0.02);
        S[6 + j * 2].set(K.pos.x, K.pos.z, 1, 0); S[7 + j * 2].set(0.06, 0.06, shd, 0);
      } }

    // ---- stones that skip: from under a boat as it goes over, from under the toy's wheels
    if (tq && tsp > 0.35 && this.clock > this.crAt) {
      const xl = XL(tq.u, tq.out);
      if (xl < this.mark - 0.06 && xl > X + 0.02 && tq.u > this.uLo + 0.1 && tq.out > 0.05) {
        this.crAt = this.clock + (calm ? 0.3 : 0.12);
        if (!calm) for (let i = 0; i < 2; i++) { const an = this.sr() * 6.283; this.skip(toy.pos.x + Math.cos(an) * 0.12, toy.pos.z + Math.sin(an) * 0.12, Math.cos(an) * 0.35 - toy.vel.x * 0.15, Math.sin(an) * 0.35 - toy.vel.z * 0.15, 0.5 + 0.5 * this.sr(), 0.022 + 0.014 * this.sr()); }
        this.rattle(L, 2, 0.1, 0.01);
      }
    }
    for (const p of this.pebs) {
      const t = this.clock - p.t; if (t < 0 || t > 1.4) continue;
      const hop = Math.max(0, p.vy * t - 4.9 * t * t), tt = Math.min(t, p.vy / 4.9 + 0.1), al = this.shingle * (1 - ramp(t, 0.9, 1.4));
      v.set(p.x + p.vx * tt, y0 + 0.006 + hop, p.z + p.vz * tt);
      const an = p.c * 1.3 + tt * 5; M.put(v, a.set(Math.cos(an), 0, Math.sin(an)).multiplyScalar(p.s * 1.4), b.set(-Math.sin(an), 0, Math.cos(an)).multiplyScalar(p.s), 0, 0, al, this.pebCols[p.c], 0.82);
    }
    M.flush();

    // ---- sound: the water, and the stones each small wave drags back
    const near = Math.max(0, 1 - Math.hypot(G.camera.position.x - L.cx, G.camera.position.z - L.cz) / 12);
    const there = L.quiet ? 0 : (ret ? 1 - ramp(R, 0.75, 1) : ease.smooth(ramp(ts, 0, 0.9))) * near;
    const moving = ret ? 1 : ts < T_FLOOD ? 1 - 0.7 * ramp(ts, 0.8, T_FLOOD) : 0.3;
    this.sea.set(there * (0.012 + 0.016 * moving + 0.008 * sw * (this.lapA / 0.12)), 0.3);
    const drag = lp > 0.3 && lp < 0.9 && ts > T_FLOOD ? Math.sin(Math.PI * (lp - 0.3) / 0.6) : 0;
    this.hiss.set(there * (0.004 * moving + 0.011 * drag * (this.lapA / 0.12) + (ts < T_FLOOD || ret ? 0.008 * moving : 0)), 0.2);
    if (there > 0 && drag > 0.3 && out && ts > T_FLOOD && this.sr() < dt * (calm ? 7 : 16) * (this.lapA / 0.12)) this.rattle(L, 1, 0.05, 0.007 * near);
    L.voice().place();
  },

});
