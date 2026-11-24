// Arnold Böcklin, In the Sea (1883), Gallery 245. The word: echo.
//
// A harper sings in a dead calm sea, and everyone round him in the water sings with him. Two things in the picture
// are not people. One is the harp: a fat white pillar with AB cut into it (it is where he signed), a red cord wound
// under a green bronze cap and flying from it in the wind, a gold neck, a long dark rod with weed at its tip, a few
// thin strings. The other is the sea, pale as the cloud it holds, and in it, darker and greener than anything above
// the water, the reflection, which the museum singles out ("the ominously shaped reflection"). A song, and a mirror:
// the word is echo, which is a sound's reflection.
//
// Look at it and his sea runs out over the floor from the foot of the wall under the picture: glass, grey and cream
// with the sky in it far off, green where you look down into it, level streaks of jade. The water lifts, and the harp
// comes up out of it, cap first, streaming, and rides there; its image stands under it in the water, upside down,
// dark emerald, as he paints what water holds (a true mirror image, worked out from wherever the eye is). Then it
// plays, by itself: Schubert's "Auf dem Wasser zu singen" (To be sung on the water, D. 774, 1823; Stolberg's poem,
// 1782), bars 9 to 12 of the voice, at Schubert's own pitch and at a moderate pace: "Mitten im Schimmer der
// spiegelnden Wellen / Gleitet, wie Schwäne, der wankende Kahn" (amid the shimmer of the mirroring waves the
// rocking boat glides like a swan). In the first bar each string that sounds bows, goes gold and lets a spark up
// into the air, a ring goes out from the harp's foot, and the image does only what a mirror does. In the second bar,
// on the word "spiegelnden" (mirroring), Schubert writes every note of the run twice. The harp has the first of each
// pair. The second comes from the water: the harp is still, and the same string in its image sounds, alone, a note
// late; the water round the image lights from within, its spark goes down, and its ring starts out in the middle of
// the sea. Bar three is the harp's again, bar four the echo's, and on the long last note the cloud opens: light goes
// out across the whole sea, one slow ring under it, and the cord streams. Two bars of the piano's falling run alone
// (a shimmer down the strings), and round again while you look.
//
// When you stop looking the sea stays while the toy is near, the harp riding it in silence: drive through and the toy
// leaves rings, has its own dark image in the water, and brushes the strings as it passes (they sound). Then the harp
// leans, goes under, and the sea draws back to the wall after it. Nothing is solid.
//
// The neighbour: Munch's Girl by the Window (src/life/154235-girl-by-the-window.js), 1.3 m to the right, is light on
// the floor and a quiet piano piece. This is water, a standing thing and a song; its sea keeps to the left of Munch's
// window (it ends 1.2 m right of this picture's middle, where his panes begin), and the kit sends one home when
// the other begins, so they are never out together for more than the moment of handing over.
// (Turner's fishing boats, in Gallery 220, bargain in two voices that hail each other across a sea. Here there is one
// voice, and the water gives it back.)
// Nothing is ever in front of a picture: the harp stands 0.77 m at its cap, 0.36 m from the wall, under frames hung
// at 1.1 m and more; its sparks have faded before they are that high; from the checks' nine cameras the guard has
// nothing to cut. Three draw calls: the sea (one flat mesh, one shader: sky, depth, rings, the dark and the light
// under the image), the harp (one mesh: its solids, and its strings, cord, weed, sparks and drops laid out by the
// vertex shader), and the same geometry again for its image (each point put where the eye finds it on the water,
// wandering with the ripples, cut off where the water stops). None of them is drawn into the polished floor's own
// reflection. With "Reduce motion and flashing" on, it all goes at seven tenths of the speed (the song too), the
// strings quiver a third as fast, a string's light and the water's light swell and fade over a second instead of
// answering each note, the run's shimmer and the glitter on the water are left out, and the notes begin softly.
//
// What it does not do: nobody comes out of the picture, in any form. Not the harper, the three who hold on to him,
// nor the heads in the water at the right; no hand plucks these strings, no tail or hair is in this sea, and the
// image in the water is the harp's alone. They are sea-people without clothes, and a body is not ours to model. And
// the echo is not made frightening: the picture's reflection is ominous, the museum says, but this one only answers.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp } from '../paintlife.js';
import { score } from './stagecraft.js';
import { strokes } from './brush.js';

const TAU = Math.PI * 2;
const SURF = 0.016;                               // the water lies this far above the boards
const SEA = { u: -0.08, a: 1.3, b: 1.95 };          // the sea: its middle along the wall, its reach along and out
const HARP = { u: -0.4, o: 0.36, yaw: -0.08, size: 1.14 };      // where the harp's foot stands in it, how it is turned, how big it is
const DEEP = 1.08;                                // how far under it waits
const BAR = 2.0, SX = BAR / 12, T0 = 1.6, CYCLE = 6 * BAR;      // Schubert's bar (two dotted crotchets), a semiquaver, the first bar line
const T_DOME = 0.36, T_UP = 0.5, T_OUT = 1.62;     // the water lifts; the harp breaks it; it is up
const NS = 9, NSP = 12, NDR = 20, NR = 16, RLIFE = 3.4, RC = 0.4, RK = 46;
// The harp, in its own plane (metres; x to the viewer's right, y up from the water).
const PA = [-0.06, -0.14], PB = [0.2, 0.6];       // the pillar's axis: its foot, under water, and its top
const RB = [-0.03, 0.003], RT = [0.63, 0.485];    // the dark rod: its foot at the pillar, its tip
const N0 = [0.235, 0.59], N1 = [0.531, 0.413];    // the gold neck: from under the cap down to the rod
// Its nine strings, longest to shortest (midi): E flat, F flat, G flat, A flat, B flat, C flat, D flat, E flat, F flat.
const STR = [63, 64, 66, 68, 70, 71, 73, 75, 76];
// Franz Schubert, "Auf dem Wasser zu singen", D. 774 (1823), bars 9 to 12, the voice, in A flat minor as written:
// "Mitten im Schimmer der spiegelnden Wellen / Gleitet, wie Schwäne, der wankende Kahn". [semiquavers from the bar
// line, midi note, length in semiquavers, who plays it: 0 the harp, 1 its reflection]. In the second and fourth bars
// (on "spiegelnden", mirroring) he writes every note of the run twice: the harp has the first, the water the second.
const B9 = [[0, 63, 3, 0], [3, 64, 1, 0], [4, 63, 2, 0], [6, 63, 2, 0], [8, 68, 2, 0], [10, 63, 2, 0]];
const B10 = [[0, 63, 1, 0], [1, 71, 1, 0], [2, 71, 1, 1], [3, 70, 1, 0], [4, 70, 1, 1], [5, 68, 1, 0], [6, 68, 4, 1], [10, 63, 2, 0]];
const B11 = [[0, 63, 3, 0], [3, 64, 1, 0], [4, 63, 2, 0], [6, 63, 2, 0], [8, 70, 2, 0], [10, 63, 2, 0]];
const B12 = [[0, 63, 1, 0], [1, 73, 1, 0], [2, 73, 1, 1], [3, 71, 1, 0], [4, 71, 1, 1], [5, 70, 1, 0], [6, 70, 6, 1]];
// The piano's right hand under them (twelve semiquavers to the bar), and its bass note.
const RUN_A = [63, 75, 75, 73, 73, 71, 71, 70, 70, 68, 68, 63], RUN_E = [63, 76, 76, 75, 75, 73, 73, 71, 71, 70, 70, 63];
const BARS = [[B9, RUN_A, 44], [B10, RUN_A, 44], [B11, RUN_E, 39], [B12, RUN_E, 39], [[], RUN_A, 44], [[], RUN_A, 44]];
const T_LONG = 3 * BAR + 6 * SX;                  // the long B flat that ends the phrase (from the first bar line)
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sst = THREE.MathUtils.smoothstep;
const hash = (x, y) => { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); };

// The sea's shape and its edge, shared by the water and by what is mirrored in it (a reflection stops where the water does).
const SEA_GLSL = /* glsl */`
uniform vec3 uO; uniform vec4 uAx, uSea;
float bH(vec2 p) { p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 19.19); return fract(p.x * p.y); }
float bN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(bH(i), bH(i + vec2(1.0, 0.0)), f.x), mix(bH(i + vec2(0.0, 1.0)), bH(i + vec2(1.0, 1.0)), f.x), f.y); }
float seaD(vec2 st) { vec2 e = vec2((st.x - uSea.x) / uSea.y, st.y / uSea.z); float a = atan(e.y, e.x);
  return length(e) / (1.0 + 0.05 * sin(3.0 * a + 0.6) + 0.035 * sin(5.0 * a + 2.1) + 0.02 * sin(9.0 * a + 0.9)); }
// how far inside the water's edge (in the shape's own measure; negative: dry)
float seaEdge(vec2 st) { float n1 = bN(st * 3.3), n2 = bN(st * 11.0 + 4.7);
  return uSea.w - (seaD(st) + (n1 - 0.5) * (0.06 + 0.3 * (1.0 - uSea.w)) + (n2 - 0.5) * 0.015); }
`;

// Everything of the harp in one geometry: solids, and marks the shader lays out (strings, the cord's tassel, the tuft
// at the rod's tip, the sparks of sound, the drops). aK = [kind, which, how far along, side]; kind: 0 solid, 1 string,
// 2 tassel strand, 3 spark, 4 drop, 5 tuft strand.
class Geo {
  constructor() { this.p = []; this.n = []; this.c = []; this.k = []; }
  solid(g) {
    const P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color;
    for (let i = 0; i < P.count; i++) { this.p.push(P.getX(i), P.getY(i), P.getZ(i)); this.n.push(N.getX(i), N.getY(i), N.getZ(i)); this.c.push(C.getX(i), C.getY(i), C.getZ(i)); this.k.push(0, 0, 0, 0); }
  }
  // a mark with a middle line: n pieces, each two triangles the shader widens towards the eye. at(s) -> [position, aN]
  ribbon(n, kind, idx, at, half, col) {
    for (let i = 0; i < n; i++) {
      const s0 = i / n, s1 = (i + 1) / n;
      for (const [s, sd] of [[s0, -1], [s0, 1], [s1, 1], [s0, -1], [s1, 1], [s1, -1]]) {
        const [p, a] = at(s), c = col(s);
        this.p.push(p.x, p.y, p.z); this.n.push(a.x, a.y, a.z); this.c.push(c.r, c.g, c.b); this.k.push(kind, idx, s, sd * Math.max(1e-4, half(s)));
      }
    }
  }
  // a small square the shader turns to the eye: aN = [corner, corner, z]
  quad(kind, idx, p, c, z = 0) {
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) { this.p.push(p.x, p.y, p.z); this.n.push(x, y, z); this.c.push(c.r, c.g, c.b); this.k.push(kind, idx, 0, 0); }
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('aN', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aC', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(this.k, 4));
    return g;
  }
}
// a three.js geometry as the kit's shapes are: unindexed, with a colour to every vertex (fn(position, normal) -> Color)
function painted(g, fn) {
  g = g.index ? g.toNonIndexed() : g; g.deleteAttribute('uv');
  const P = g.attributes.position, N = g.attributes.normal, c = new Float32Array(P.count * 3), v = V3(), n = V3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); n.fromBufferAttribute(N, i); const k = fn(v, n); c[i * 3] = k.r; c[i * 3 + 1] = k.g; c[i * 3 + 2] = k.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
const _M = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _E = new THREE.Euler();
// stood along the line from a to b in the harp's plane (a shape made along +y, from its foot)
const along = (g, a, b, z = 0) => g.applyMatrix4(_M.compose(V3(a[0], a[1], z), _Q.setFromEuler(_E.set(0, 0, -Math.atan2(b[0] - a[0], b[1] - a[1]))), V3(1, 1, 1)));

lifeFor(110507, {
  title: /^In the Sea/,
  word: 'echo',
  stage: { out: 1.9, half: 1.4, cam: { dist: 2.85, height: 1.0, side: 0.2, fov: 62, lookU: -0.06, lookOut: 0.7, lookH: 0.6, floorOut: 1.58 } },
  wake: T0, ret: 2.6,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.15) => P.near(h, a);
    this.v = V3(); this.w = V3(); this.z = V3(); this.M = new THREE.Matrix4(); this.B = new THREE.Matrix4(); this.R = new THREE.Matrix4();
    this.Y0 = L.y + SURF;
    // what both the water and the harp need to know
    const sh = this.sh = {
      uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uSea: { value: new THREE.Vector4(SEA.u, SEA.a, SEA.b, 0) },
      uRing: { value: Array.from({ length: NR }, () => new THREE.Vector4(0, 0, 0, 0)) }, uCfg: { value: new THREE.Vector4(0, 40, 1, 0.07) },        // time, how fast a string quivers, how much the image wanders, how fast a spark comes up
      cEmer: { value: col('#03302e', 0.2) },
    };
    this.buildSea(L, col, sh);
    this.buildHarp(L, col, sh);
    // the phrase, as things that happen: [seconds from the first bar line, string, who, length]; and the piano's run
    this.ev = []; this.run = [];
    BARS.forEach(([mel, run], b) => {
      for (const [at, m, len, who] of mel) this.ev.push({ t: b * BAR + at * SX, s: STR.indexOf(m), who, len: len * SX });
      run.forEach((m, i) => this.run.push({ t: b * BAR + i * SX, s: STR.indexOf(m) }));
    });
    this.ph = new Float32Array(NS); this.gh = new Float32Array(NS); this.pm = new Float32Array(NS); this.gm = new Float32Array(NS); this.xt = new Float32Array(NS);
    this.toyRings = [{ u: 0, o: 0, t: -99, amp: 0 }, { u: 0, o: 0, t: -99, amp: 0 }, { u: 0, o: 0, t: -99, amp: 0 }]; this.tri = 0; this.toyAt = { u: 99, o: 99 }; this.brushed = -1; this.brushT = 0;
    this.lo = { u: 0, o: 0 }; this.nr = 0; this.nod = 0; this.glowM = 0;
    this.lap = L.voice().loop({ lp: 520, hp: 140 });
    this.T = 0; this.off = 0; this.shift = 0; this.cut = Infinity; this.floorT = -1; this.speed = 1;
    this.hide();
  },

  // ---------------------------------------------------------------- the sea: calm, pale, the sky in it
  buildSea(L, col, sh) {
    const F = (u, o) => L.floor(u, o, V3()).setY(this.Y0).toArray(), x0 = SEA.u - SEA.a - 0.25, x1 = SEA.u + SEA.a + 0.25, o0 = -L.wall + 0.012, o1 = SEA.b + 0.3;
    const a = F(x0, o0), b = F(x1, o0), c = F(x1, o1), d = F(x0, o1);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
    // his water's paint: long level drags of grey, cream and a little jade
    const hex = c => '#' + c.getHexString();
    const paint = strokes({ size: 512, seed: 1105, n: 1500, len: [60, 190], width: [4, 13], bend: 0.04, lift: 0.1, base: hex(col('#9c9e90', 0.2)),
      colors: [['#a9ab9c', 4], ['#b9b8a6', 3], ['#8d9088', 3], ['#c6c2ab', 1.6], ['#75807c', 1.6], ['#5f8a80', 0.9], ['#6c7a82', 0.8]].map(([c, w]) => [hex(col(c, 0.15)), w]),
      angle: (x, y, r) => (r() - 0.5) * 0.1 });
    const u = this.su = {
      ...sh, uTime: { value: 0 }, uCalm: { value: 0 }, uToy: { value: new THREE.Vector4(9, 9, 0, 0.3) }, uSheen: { value: new THREE.Vector4(0, 0.5, 0, 0) }, uFoot: { value: new THREE.Vector4(HARP.u, HARP.o, 0, 0) }, uRefA: { value: new THREE.Vector4() }, uRefB: { value: new THREE.Vector4() }, tPaint: { value: paint },
      cSky: { value: col('#aeb0a1', 0.2) }, cGrey: { value: col('#6c716c', 0.2) }, cBlue: { value: col('#5f6e77', 0.15) }, cJade: { value: col('#265e53', 0.12) }, cTurq: { value: col('#4f9a8c', 0.08) }, cCream: { value: col('#c9c5ae', 0.12) },
      tRefl: { value: null }, reflMatrix: { value: new THREE.Matrix4() }, reflOn: { value: 0 }, reflY: { value: L.y },
    };
    const m = this.seaM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = s => {
      Object.assign(s.uniforms, u);
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', `#include <common>
uniform float uTime, uCalm; uniform vec4 uRing[${NR}], uToy, uSheen, uFoot, uRefA, uRefB; uniform sampler2D tPaint; uniform vec3 cSky, cGrey, cBlue, cJade, cTurq, cCream, cEmer;
uniform sampler2D tRefl; uniform mat4 reflMatrix; uniform float reflOn, reflY;
${SEA_GLSL}
float segD(vec2 p, vec2 a, vec2 b, out float h) { vec2 pa = p - a, ba = b - a; h = clamp(dot(pa, ba) / max(dot(ba, ba), 1.0e-5), 0.0, 1.0); return length(pa - ba * h); }
vec3 fCol; float fA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz, st = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw)); float su = st.x, so = st.y;
  float edge = seaEdge(st);
  if (edge < -0.004 || uSea.w < 0.002) discard;
  float water = smoothstep(0.0, 0.01, edge), brim = water * (1.0 - smoothstep(0.012, 0.05, edge));
  // rings: each a short train of ripples widening from where it began
  float rip = 0.0; vec2 grad = vec2(0.0);
  for (int i = 0; i < ${NR}; i++) {
    vec4 Q = uRing[i]; if (Q.w <= 0.0) continue;
    vec2 dv = st - Q.xy; float r = length(dv) + 1e-4, x = r - (0.02 + ${RC.toFixed(2)} * Q.z), wd = 0.05 + 0.035 * Q.z;
    float env = exp(-x * x / (wd * wd)) * Q.w * exp(-Q.z * 0.75) * smoothstep(0.0, 0.14, Q.z);
    rip += env * cos(x * ${RK.toFixed(1)}); grad += dv / r * env * (-sin(x * ${RK.toFixed(1)}));
  }
  // and the long, slow breathing of a calm sea, hardly there
  float br = sin(so * 5.2 - uTime * 0.8 + 1.4 * sin(su * 1.1 + uTime * 0.13)) + 0.6 * sin(so * 9.5 + su * 1.7 - uTime * 1.05);
  vec2 g = grad + vec2(0.0, 0.03) * br;
  vec3 V = normalize(cameraPosition - lifeP); float cosT = clamp(V.y, 0.0, 1.0);
  vec2 vh = vec2(dot(V.xz, uAx.xy), dot(V.xz, uAx.zw)); vh /= length(vh) + 1e-4;
  // glass: far off it holds the sky; under the eye you look down into the green
  float mirr = clamp(mix(0.16, 1.0, smoothstep(0.84, 0.38, cosT)) + dot(g, vh) * 0.5, 0.0, 1.0);
  // his sky in it: grey and cream cloud, long along the wall, drifting
  vec2 cp = vec2(su * 0.8 + uTime * 0.016, so * 1.5) + g * 0.07;
  float cl = bN(cp * 1.7) * 0.58 + bN(cp * 4.1 + 3.0) * 0.3 + bN(cp * 9.3 + 1.0) * 0.12;
  vec3 sky = mix(cGrey, cSky, smoothstep(0.3, 0.6, cl)); sky = mix(sky, cCream, smoothstep(0.55, 0.8, cl) * 0.7); sky = mix(sky, cBlue, smoothstep(0.34, 0.16, cl) * 0.45);
  vec4 pt = texture2D(tPaint, vec2(su / 2.6 + uTime * 0.003, so / 1.3) + g * 0.02, 1.4);
  sky = mix(sky, pt.rgb, 0.16);
  vec3 deep = mix(cJade, cEmer, smoothstep(0.3, 0.95, cosT));
  vec3 c = mix(deep, sky, mirr);
  // level streaks of jade, as he draws still water
  float lv = bN(vec2(su * 1.1 + 3.0, so * 40.0 + rip * 1.5)), lv2 = bN(vec2(su * 0.7 - uTime * 0.015, so * 9.0 + 9.0));
  float streak = smoothstep(0.66, 0.84, lv) * smoothstep(0.5, 0.75, lv2);
  c = mix(c, mix(cJade, cTurq, 0.35), streak * 0.36);
  // the lit wall and the foot of the frame upside down in it, bent by the rings
  vec4 rp = reflMatrix * vec4(lifeP, 1.0); vec2 ruv = rp.xy / rp.w + g * 0.03;
  float on = reflOn * (1.0 - step(0.08, abs(lifeP.y - reflY)));
  vec3 refl = min(texture2D(tRefl, ruv, 1.2).rgb, vec3(1.25));
  c = mix(c, c * 0.8 + refl * 0.2, on * mirr * 0.7);
  // a ripple's lit face and its dark one
  float lit = dot(grad, vec2(-0.62, 0.78));
  c += cCream * max(lit, 0.0) * 0.42; c *= 1.0 - 0.36 * clamp(-lit, 0.0, 1.0);
  // the light that opens on it at the end of the phrase, going out from the wall
  float band = exp(-pow((so - uSheen.x) / uSheen.y, 2.0)) * uSheen.z;
  float glit = mix(0.55 + 0.45 * sin(uTime * 5.0 + bN(vec2(su * 3.0, so * 40.0)) * 30.0), 0.7, uCalm) * smoothstep(0.55, 0.85, bN(vec2(su * 4.0 + uTime * 0.2, so * 55.0)));
  c += cCream * band * (0.2 + 0.5 * glit);
  // where the harp stands in it, and where the toy does: the green of something dark above the water
  {
    vec2 cq = cameraPosition.xz - uO.xz, eye = vec2(dot(cq, uAx.xy), dot(cq, uAx.zw)); float eyeH = cameraPosition.y - uO.y;
    // (the harp's own dark in the water: broad soft green under its image, broken into level slices as the water moves)
    vec2 sw = st + vec2(rip * 0.03 + 0.014 * sin(so * 64.0 + uTime * 1.7) * (1.0 - 0.6 * uCalm) + 0.02 * (pt.a - 0.6), 0.0);
    float h1, h2, d1 = segD(sw, uRefA.xy, uRefA.zw, h1), d2 = segD(sw, uRefB.xy, uRefB.zw, h2);
    float w1 = 0.05 + 0.06 * h1, w2 = 0.028 + 0.05 * h2;
    float dk = max(exp(-d1 * d1 / (w1 * w1)) * (1.0 - 0.45 * h1), exp(-d2 * d2 / (w2 * w2)) * (1.0 - 0.35 * h2));
    float fd = length((st - uFoot.xy) * vec2(1.0, 1.4)); dk = max(dk, exp(-fd * fd / 0.016));
    c = mix(c, mix(cEmer, cJade, 0.18 * pt.a), clamp(dk, 0.0, 1.0) * 0.8 * uFoot.z);
    c += cTurq * clamp(dk * 0.7 + 0.5 * exp(-d1 * d1 / (w1 * w1 * 6.0)) * (1.0 - 0.5 * h1), 0.0, 1.0) * uFoot.w * 1.05 * (0.6 + 0.4 * pt.a);          // (lit from within as the image sounds)
    vec2 to = eye - uToy.xy; float d = length(to) + 1e-4; to /= d;
    float len = uToy.w * d / max(0.2, eyeH + uToy.w), al = dot(st - uToy.xy, to), ac = dot(st - uToy.xy, vec2(-to.y, to.x)) + rip * 0.03 + 0.012 * sin(al * 60.0 + uTime * 2.0) * (1.0 - uCalm);
    // (the toy's own dark in the water: under it, and from its near side towards the eye, as long as the toy is tall)
    float tm = smoothstep(-0.05, 0.2, al) * (1.0 - smoothstep(0.2 + len * 0.45, 0.24 + len * 1.1, al)) * exp(-ac * ac / 0.04);
    float under = exp(-dot(st - uToy.xy, st - uToy.xy) / 0.05);
    c = mix(c, cEmer * 1.2, max(tm * 0.74, under * 0.6) * uToy.z);
  }
  // its brim on the boards: a pale line, and the thin dark of wet wood beyond it
  c = mix(c, cCream, brim * 0.5 * (0.6 + 0.4 * bN(st * 17.0)));
  fCol = c * 0.5; fA = max(water * 0.97, (1.0 - water) * 0.3 * smoothstep(-0.004, 0.0, edge));
  if (water < 0.5) fCol = mix(vec3(0.05, 0.07, 0.06), fCol, water * 2.0);
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'bocklin-sea';
    this.sea = new THREE.Mesh(g, m); this.sea.renderOrder = 5; L.add(this.sea);
    Object.assign(u, L.mirrored(this.sea));           // (the room's own reflection: shown and hidden by its material)
    m.paintTex = paint;                               // (so it is let go with the material)
  },

  // ---------------------------------------------------------------- the harp, and the harp in the water
  buildHarp(L, col, sh) {
    const G = new Geo(), rr = (a, b) => a + (b - a) * L.rand();
    const MAR = col('#cfc9ad', 0.12), MARS = col('#a59f88', 0.18), TAN = col('#7b7357', 0.2), RED = col('#6a2424', 0.06), REDL = col('#8d4037', 0.06), REDD = col('#3f1718', 0.08);
    const BRZ = col('#14271f', 0.15), BRZL = col('#2c5a47', 0.08), BRZD = col('#0a1814', 0.2), GOLD = col('#6a5530', 0.1), GOLDL = col('#97793f', 0.08), GOLDD = col('#40341f', 0.15);
    const ROD = col('#0c2424', 0.2), RODL = col('#174a45', 0.1), TUFT = col('#2a2419', 0.25), TUFTL = col('#4a4630', 0.2), STRING = col('#938b72', 0.1);
    const mixc = (a, b, k) => a.clone().lerp(b, clamp01(k));
    const pdir = V3(PB[0] - PA[0], PB[1] - PA[1], 0), plen = pdir.length(); pdir.normalize();
    const pleft = V3(-pdir.y, pdir.x, 0), pax = s => V3(PA[0] + pdir.x * s, PA[1] + pdir.y * s, 0), prad = s => 0.0355 - 0.0045 * (s / plen) + 0.0012 * Math.sin(Math.PI * s / plen);
    const wet = PA[1] < 0 ? -PA[1] / pdir.y : 0;        // how far up the pillar the water stands

    // the pillar: a fat white column, stained tan where the sea has had it
    {
      const prof = []; for (let i = 0; i <= 16; i++) { const s = i / 16 * plen; prof.push(new THREE.Vector2(prad(s), s)); }
      const g = painted(new THREE.LatheGeometry(prof, 20), (v, n) => {
        const s = v.y / plen, a = Math.atan2(v.z, v.x), h = hash(Math.round(a * 6), Math.round(s * 9)), streak = hash(Math.round(a * 14), 3);
        const c = mixc(MAR, MARS, 0.25 * h + 0.3 * streak * streak);
        c.lerp(TAN, 0.8 * sst(0.56 - s, 0, 0.36) * (0.7 + 0.3 * streak));
        return c.multiplyScalar(1 - 0.25 * sst(wet + 0.03 - v.y, 0, 0.03));
      });
      G.solid(along(g, PA, PB));
    }
    // his monogram, AB, cut into the pillar under the cord, where he signed the picture
    {
      const A = [[[-0.5, 0], [0, 1]], [[0, 1], [0.5, 0]], [[-0.27, 0.4], [0.27, 0.4]]];
      const Bp = [[-0.42, 0], [-0.42, 1], [0.16, 1], [0.4, 0.9], [0.42, 0.7], [0.2, 0.53], [-0.42, 0.53], [0.2, 0.53], [0.47, 0.4], [0.48, 0.16], [0.24, 0], [-0.42, 0]], B = Bp.slice(1).map((q, i) => [Bp[i], q]);
      const sA = plen - 0.118, ph = 0.95, R = prad(sA) + 0.0006, hgt = 0.02, wid = 0.014, cut = mixc(TAN, MARS, 0.2).multiplyScalar(0.62);
      const rad = a => pleft.clone().multiplyScalar(-Math.cos(a)).add(V3(0, 0, Math.sin(a)));        // out of the pillar, a round it (0: its right side, towards the strings; a quarter turn: its front)
      const on = (x, y) => { const a = ph - x / R; return pax(sA + y).addScaledVector(rad(a), R); };
      const g = new THREE.BufferGeometry(), pos = [], nor = [], colr = [];
      [[A, -0.0085], [B, 0.0085]].forEach(([strokes, x0]) => {
        for (const [[ax, ay], [bx, by]] of strokes) {
          const dx = (bx - ax) * wid, dy = (by - ay) * hgt, l = Math.hypot(dx, dy), px = -dy / l * 0.0011, py = dx / l * 0.0011;
          const c = [[ax * wid + x0 - px, ay * hgt - py], [bx * wid + x0 - px, by * hgt - py], [bx * wid + x0 + px, by * hgt + py], [ax * wid + x0 + px, ay * hgt + py]].map(([x, y]) => [on(x, y), rad(ph - x / R)]);
          for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(c[i][0].x, c[i][0].y, c[i][0].z); nor.push(c[i][1].x, c[i][1].y, c[i][1].z); colr.push(cut.r, cut.g, cut.b); }
        }
      });
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
      G.solid(g);
    }
    // the green bronze cap on it, and its dark mouth
    {
      const prof = [[0.036, -0.016], [0.0385, -0.01], [0.0385, -0.002], [0.035, 0.004], [0.0345, 0.014], [0.037, 0.03], [0.041, 0.046], [0.0445, 0.056], [0.0455, 0.062], [0.043, 0.067], [0.037, 0.064], [0.02, 0.056], [0.001, 0.054]];
      const g = painted(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 20), (v, n) => {
        const rim = sst(v.y, 0.054, 0.064) * sst(Math.hypot(v.x, v.z), 0.041, 0.045), band = Math.exp(-Math.pow((v.y + 0.006) / 0.006, 2));
        return mixc(mixc(BRZ, BRZL, 0.8 * rim + 0.4 * band + 0.15 * hash(Math.round(v.y * 300), Math.round(Math.atan2(v.z, v.x) * 5))), BRZD, sst(0.04 - Math.hypot(v.x, v.z), 0, 0.02) * sst(v.y, 0.05, 0.06));
      });
      G.solid(along(g, PB, [PB[0] + pdir.x, PB[1] + pdir.y]));
    }
    // a rod, straight from a to b, r0 to r1 thick
    const bar = (a, b, r0, r1, seg, hs, fn, z = 0) => {
      const h = Math.hypot(b[0] - a[0], b[1] - a[1]), g = new THREE.CylinderGeometry(r1, r0, h, seg, hs); g.translate(0, h / 2, 0);
      return along(painted(g, (v, n) => fn(v.y / h, v, n)), a, b, z);
    };
    const rdir = V3(RT[0] - RB[0], RT[1] - RB[1], 0), rlen = rdir.length(); rdir.normalize();
    const rup = V3(-rdir.y, rdir.x, 0);
    // the long dark rod, wet green along its upper side; a point at its tip
    G.solid(bar([RB[0] - rdir.x * 0.1, RB[1] - rdir.y * 0.1], RT, 0.017, 0.0075, 12, 18, (s, v) => mixc(ROD, RODL, 0.6 * sst(-v.x, 0.008, 0.016) + 0.15 * hash(Math.round(s * 30), 1))));
    G.solid(bar(RT, [RT[0] + rdir.x * 0.045, RT[1] + rdir.y * 0.045], 0.0105, 0.0012, 10, 3, s => mixc(ROD, BRZL, 0.25 + 0.3 * s)));
    G.solid(bar([RT[0] - rdir.x * 0.012, RT[1] - rdir.y * 0.012], [RT[0] + rdir.x * 0.004, RT[1] + rdir.y * 0.004], 0.0125, 0.0125, 10, 1, () => mixc(BRZ, BRZL, 0.4)));
    // the gold neck, and a peg for every string
    G.solid(bar([N0[0] - 0.03, N0[1] + 0.018], [N1[0] + 0.012, N1[1] - 0.007], 0.0085, 0.0065, 10, 12, (s, v) => mixc(GOLD, GOLDL, 0.6 * sst(-v.x, 0.0, 0.006)).lerp(GOLDD, 0.3 * hash(Math.round(s * 40), 2))));
    // its bronze scroll, under the cap
    {
      const pts = []; for (let i = 0; i <= 26; i++) { const a = i / 26, ang = -Math.PI / 2 + a * 2.6 * Math.PI, r = 0.021 * (1 - 0.78 * a); pts.push(V3(0.288 + r * Math.cos(ang), 0.607 + r * Math.sin(ang), 0)); }
      G.solid(painted(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 52, 0.0052, 7, false), (v, n) => mixc(BRZ, BRZL, 0.35 + 0.4 * n.y)));
      G.solid(painted(new THREE.SphereGeometry(0.0075, 10, 8).translate(pts[26].x, pts[26].y, 0), () => BRZL));
    }
    // the strings: each from its peg on the neck straight down, as the pillar leans, to the rod
    const ndir = V3(N1[0] - N0[0], N1[1] - N0[1], 0), nup = V3(-ndir.y, ndir.x, 0).normalize();
    this.strTop = []; this.strBot = []; this.strMid = []; this.halo = [];
    for (let i = 0; i < NS; i++) {
      const s = 0.07 + 0.8 * i / (NS - 1), top = V3(N0[0] + ndir.x * s, N0[1] + ndir.y * s - 0.006, 0);
      // top - k * pdir = RB + m * rdir
      const bx = RB[0] - top.x, by = RB[1] - top.y, D = -pdir.x * -rdir.y - -rdir.x * -pdir.y, k = (bx * -rdir.y - -rdir.x * by) / D;
      const bot = top.clone().addScaledVector(pdir, -(k - 0.012));
      this.strTop.push(top); this.strBot.push(bot); this.strMid.push(top.clone().lerp(bot, 0.42));
      const tl = top.clone().sub(bot).normalize();
      G.ribbon(12, 1, i, q => [bot.clone().lerp(top, q), tl], () => 0.0009, () => STRING);
      this.halo.push([i, bot, top, tl]);
      G.solid(bar([top.x - nup.x * 0.004, top.y - nup.y * 0.004], [top.x + nup.x * 0.017, top.y + nup.y * 0.017], 0.003, 0.0038, 7, 1, q => mixc(GOLDD, GOLD, q)));
    }
    // the red cord: wound under the cap, down the pillar's side, and bound round the foot of the rod
    const turn = (s, R, r, c, wob = 0) => { const g = painted(new THREE.TorusGeometry(R, r, 8, 22).rotateX(Math.PI / 2).rotateZ(wob), (v, n) => mixc(c, REDL, 0.3 * hash(Math.round(Math.atan2(v.z, v.x) * 9), s * 100) + 0.3 * n.y)); const p = pax(s); G.solid(along(g, [p.x, p.y], [p.x + pdir.x, p.y + pdir.y])); };
    for (let i = 0; i < 5; i++) turn(plen - 0.024 - i * 0.0125, prad(plen) + 0.0045, 0.0068, i % 2 ? RED : mixc(RED, REDD, 0.4), (i - 2) * 0.05);
    for (let i = 0; i < 4; i++) turn(wet + 0.022 + i * 0.013, prad(wet) + 0.0075, 0.0072, i % 2 ? mixc(RED, REDL, 0.3) : RED, (i - 1.5) * 0.07);
    {
      const sTop = plen - 0.08, sBot = wet + 0.068, pts = [];
      for (let i = 0; i <= 14; i++) { const q = i / 14, s = lerp(sTop, sBot, q), p = pax(s); pts.push(p.addScaledVector(pleft, (prad(s) + 0.004) * Math.cos(0.5 + 0.5 * Math.sin(q * 5))).add(V3(0, 0, (prad(s) + 0.004) * Math.sin(0.5 + 0.5 * Math.sin(q * 5))))); }
      G.solid(painted(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.0062, 7, false), (v, n) => mixc(RED, REDL, 0.25 + 0.35 * n.z + 0.2 * hash(Math.round(v.y * 160), 5)).lerp(REDD, 0.3 * hash(Math.round(v.y * 90), 7))));
    }
    // its frayed end, flying from the knot under the cap as his wind has it
    {
      const root = pax(plen - 0.05).addScaledVector(pleft, prad(plen) + 0.01).add(V3(0, 0, 0.012));
      G.solid(painted(new THREE.SphereGeometry(0.015, 10, 8).translate(root.x, root.y, root.z), (v, n) => mixc(RED, REDL, 0.3 + 0.3 * n.y)));
      for (let i = 0; i < 20; i++) {
        const len = rr(0.1, 0.19), a0 = rr(-0.3, 0.42), zs = rr(-0.3, 0.3), w = rr(0.0028, 0.0046), c = mixc(RED, i % 3 ? REDL : REDD, rr(0.1, 0.7)), an = V3(len, a0, zs);
        G.ribbon(7, 2, i + L.rand(), () => [root, an], q => w * (1 - 0.6 * q), q => mixc(c, REDL, 0.3 * q));
      }
    }
    // and the dark weed that hangs from the rod's tip
    for (let i = 0; i < 16; i++) {
      const q0 = rr(0.0, 0.085), root = V3(RT[0] - rdir.x * q0, RT[1] - rdir.y * q0 - 0.006, rr(-0.006, 0.006)), len = rr(0.07, 0.16) * (1 - q0 * 3), an = V3(len, rr(-0.25, 0.35), rr(-0.22, 0.22)), w = rr(0.0024, 0.004), c = mixc(TUFT, TUFTL, rr(0, 0.8));
      G.ribbon(6, 5, i + L.rand(), () => [root, an], q => w * (1 - 0.7 * q), () => c);
    }
    // the sparks of sound, and the drops that run off it when it comes up
    const white = new THREE.Color(1, 1, 1);
    for (const [i, bot, top, tl] of this.halo) G.ribbon(8, 6, i, q => [bot.clone().lerp(top, q), tl], () => 0.014, () => white);
    for (let j = 0; j < NSP; j++) G.quad(3, j, V3(), white);
    const drip = [];
    for (let j = 0; j < 7; j++) { const q = rr(0.1, 0.98); drip.push(V3(RB[0] + rdir.x * rlen * q, RB[1] + rdir.y * rlen * q - 0.012, rr(-0.006, 0.006))); }
    for (let j = 0; j < 6; j++) { const q = rr(0.05, 1); drip.push(V3(N0[0] + ndir.x * q, N0[1] + ndir.y * q - 0.008, rr(-0.004, 0.004))); }
    for (let j = 0; j < 4; j++) { const p = pax(rr(plen * 0.45, plen)); drip.push(p.addScaledVector(pleft, -prad(0) * 0.9)); }
    for (let j = 0; j < 3; j++) drip.push(V3(PB[0] + rr(-0.03, 0.05), PB[1] + rr(0.0, 0.03), rr(-0.03, 0.03)));
    drip.slice(0, NDR).forEach((p, j) => G.quad(4, j + L.rand() * 0.9, p, white, rr(0, 0.5)));
    const geo = G.geo();

    const KEY = V3(L.tx * -0.5 + L.nx * 0.5, 0.72, L.tz * -0.5 + L.nz * 0.5).normalize();        // his light: high, from the left, in front
    const base = { ...sh, uM: { value: this.M }, uKey: { value: KEY }, uWind: { value: new THREE.Vector4(0, 1.3, 5.2, 1) }, uDrip: { value: new THREE.Vector4(-1, 0, 0, 0) }, uY0: { value: this.Y0 },
      cLit: { value: new THREE.Color(1.08, 1.04, 0.96) }, cShd: { value: new THREE.Color(0.5, 0.56, 0.6) }, cGold: { value: new THREE.Color('#ffd58c').multiplyScalar(2.1) }, cDrop: { value: col('#dfe6da', 0.05) }, cMGlow: { value: new THREE.Color('#aef2d6').multiplyScalar(1.9) } };
    const make = mir => {
      const u = { ...base, uMir: { value: mir }, uPl: { value: Array.from({ length: NS }, () => new THREE.Vector4()) }, uSp: { value: Array.from({ length: NSP }, () => new THREE.Vector4(0, 0, 0, -1)) }, uSb: { value: new Float32Array(NSP) } };
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: true, fog: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
      m.onBeforeCompile = s => {
        Object.assign(s.uniforms, u);
        s.vertexShader = s.vertexShader
          .replace('#include <common>', `#include <common>
attribute vec3 aN, aC; attribute vec4 aK;
uniform mat4 uM; uniform vec4 uPl[${NS}], uSp[${NSP}], uRing[${NR}], uCfg, uWind, uDrip, uAx; uniform float uSb[${NSP}], uMir, uY0; uniform vec3 uKey, uO;
varying vec3 vC, vL; varying vec4 vQ; varying float vH, vShade, vGlow, vRim;`)
          .replace('#include <begin_vertex>', `
  float kind = aK.x; vec3 lp = position, wp, eye = cameraPosition;
  vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), cu = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vC = aC; vL = position; vQ = vec4(0.0, 0.0, kind, 1.0); vShade = 1.0; vGlow = 0.0; vRim = 1.0;
  if (kind < 0.5) {
    wp = (uM * vec4(lp, 1.0)).xyz;
    vec3 nw = normalize(mat3(uM) * aN);
    vShade = smoothstep(-0.45, 0.85, dot(nw, uKey)); vRim = abs(dot(nw, normalize(eye - wp)));
  } else if (kind < 2.5 || kind > 4.5) {
    vec3 tl = aN; float hw = abs(aK.w), sd = sign(aK.w);
    if (kind > 5.5) {
      // the light along a string as it sounds
      vec4 pl = uPl[int(aK.y + 0.5)]; float bow = sin(3.14159 * aK.z);
      hw *= (0.5 + 0.8 * bow) * step(0.02, pl.y); vQ = vec4(sd, 0.0, kind, pl.y * (0.35 + 0.65 * bow));
    } else if (kind < 1.5) {
      // a string: it bows out in the middle as it sounds, and is brighter
      vec4 pl = uPl[int(aK.y + 0.5)]; float bow = sin(3.14159 * aK.z);
      lp.z += pl.x * bow * 0.007 * sin(uCfg.x * uCfg.y * (1.0 + 0.06 * aK.y) + aK.y * 2.1);
      hw += pl.x * bow * 0.0036; vGlow = pl.y; vShade = 0.86;
    } else {
      // a strand: hanging, and the wind takes it round to the left
      float resp = kind < 2.5 ? 1.22 : 0.42, seed = aK.y, s = aK.z;
      float gw = uWind.x * (0.8 + 0.2 * sin(uCfg.x * uWind.y + seed * 6.0));
      float th = aN.y + gw * resp * (1.0 - 0.3 * s) + 0.13 * s * sin(uCfg.x * uWind.z + seed * 9.0 + s * 4.0) * uWind.w;
      vec3 dv = vec3(-sin(th), -cos(th), aN.z * (0.4 + 0.6 * s) + 0.1 * s * sin(uCfg.x * uWind.z * 0.7 + seed * 4.0) * uWind.w);
      lp = position + dv * (aN.x * s); tl = normalize(dv); vShade = 0.62 + 0.3 * fract(seed * 7.3);
    }
    wp = (uM * vec4(lp, 1.0)).xyz;
    vec3 tw = normalize(mat3(uM) * tl), side = normalize(cross(tw, eye - wp));
    if (kind < 5.5) hw = max(hw, 0.75 * length(eye - wp) / uLifePx);
    wp += side * sd * hw;
  } else if (kind < 3.5) {
    // a spark of sound: off the string, up, and away downwind
    int j = int(aK.y + 0.5); vec4 sp = uSp[j]; float age = sp.w, k = clamp(age / 2.3, 0.0, 1.0);
    float b = uSb[j] * smoothstep(0.0, uCfg.w, age) * (1.0 - smoothstep(0.4, 1.0, k)) * step(0.0, age) * step(age, 2.3);
    lp = sp.xyz + vec3(-0.06 * age * (0.4 + uWind.x) - 0.018 * sin(age * 2.3 + aK.y), 0.015 + 0.19 * age * (1.0 - 0.3 * k), 0.02 * sin(age * 3.1 + aK.y * 1.7));
    wp = (uM * vec4(lp, 1.0)).xyz;
    wp += (cr * aN.x + cu * aN.y) * (0.03 + 0.026 * smoothstep(0.0, 0.6, age)) * (0.8 + 0.35 * uSb[j]) * step(0.002, b);
    vQ = vec4(aN.xy, kind, b);
  } else {
    // a drop: it lets go, and falls
    float per = 0.5 + 0.6 * fract(aK.y * 0.618), since = uDrip.x - aN.z, n = floor(since / per), td = since - n * per;
    float on = step(0.0, since) * step(n + 0.5, uDrip.y * (0.4 + fract(aK.y * 0.377)));
    wp = (uM * vec4(lp, 1.0)).xyz; wp.y -= 2.3 * td * td;
    on *= step(uY0 + 0.004, wp.y);
    wp += (cr * aN.x * 0.0028 + vec3(0.0, 1.0, 0.0) * aN.y * (0.004 + 0.016 * td)) * on;
    vQ = vec4(aN.xy, kind, on * 0.6);
  }
  vH = wp.y - uY0;
  if (uMir > 0.5) {
    // the same harp, upside down in the water: every point where the eye finds its image on the surface, the image
    // wandering more the further it is from the waterline, and shaken by each ring that crosses it
    float h = max(vH, 0.0);
    wp.xz += uAx.xy * ((0.003 + 0.022 * h) * sin(h * 30.0 - uCfg.x * 2.1 + dot(wp.xz, uAx.xy) * 4.0) * uCfg.z);
    vec3 m = vec3(wp.x, 2.0 * uY0 - wp.y, wp.z);
    float sF = (eye.y - uY0) / max(eye.y - m.y, 1.0e-3);
    vec3 F = eye + (m - eye) * sF;
    vec2 fq = F.xz - uO.xz, st = vec2(dot(fq, uAx.xy), dot(fq, uAx.zw)), push = vec2(0.0);
    for (int i = 0; i < ${NR}; i++) {
      vec4 Q = uRing[i]; if (Q.w <= 0.0) continue;
      vec2 dv = st - Q.xy; float r = length(dv) + 1.0e-4, x = r - (0.02 + ${RC.toFixed(2)} * Q.z), wd = 0.05 + 0.035 * Q.z;
      push += dv / r * exp(-x * x / (wd * wd)) * Q.w * exp(-Q.z * 0.75) * smoothstep(0.0, 0.14, Q.z) * sin(x * ${RK.toFixed(1)});
    }
    F.xz += (uAx.xy * push.x + uAx.zw * push.y) * 0.016 * smoothstep(0.0, 0.05, h);
    vec3 hc = vec3(uM[3].x, 2.0 * uY0 - uM[3].y - 0.3, uM[3].z);
    float lam = 0.003 + 0.006 * clamp(0.5 + (length(hc - eye) - length(m - eye)) / 1.2, 0.0, 1.0);
    wp = F + (eye - F) * lam;
  }
  vec3 transformed = wp;`);
        s.fragmentShader = s.fragmentShader
          .replace('#include <common>', `#include <common>
uniform float uMir; uniform vec4 uCfg; uniform vec3 cLit, cShd, cGold, cDrop, cEmer, cMGlow;
varying vec3 vC, vL; varying vec4 vQ; varying float vH, vShade, vGlow, vRim;
${SEA_GLSL}
vec3 hC; float hA;`)
          .replace('#include <map_fragment>', `#include <map_fragment>
{
  float kind = vQ.z; bool spark = kind > 2.75 && kind < 3.5, drop = kind > 3.5 && kind < 4.5, halo = kind > 5.5;
  if (vH < 0.0) discard;
  float gl = clamp(vGlow, 0.0, 1.0);
  // (painted, not turned: the tone wanders a little over every surface)
  vec3 body = vC * mix(cShd, cLit, vShade) * (0.6 + 0.2 * bN(vL.xy * 60.0 + vL.z * 41.0) + 0.1 * bN(vL.xy * 15.0 + 3.0)) * mix(0.55, 1.0, smoothstep(0.0, 0.55, vRim));
  if (spark) { float s = max(0.0, 1.0 - length(vQ.xy)); hC = cGold * (s * s * s * 0.9 + s * s * 0.16) * vQ.w; hA = 0.0; if (hC.r < 0.012) discard; }
  else if (halo) { float s = max(0.0, 1.0 - abs(vQ.x)); hC = cGold * s * s * 0.2 * vQ.w; hA = 0.0; if (hC.r < 0.008) discard; }
  else if (drop) { hA = (1.0 - smoothstep(0.4, 1.0, length(vQ.xy))) * vQ.w; if (hA < 0.03) discard; hC = cDrop * hA; }
  else { hC = mix(body, cGold * 0.6, gl * 0.9); hA = 1.0; }
  if (uMir > 0.5) {
    vec2 lq = lifeP.xz - uO.xz, st = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw));
    if (seaEdge(st) < 0.006) discard;
    if (spark || halo) hC = hC.r * cMGlow / 1.9;
    else if (!drop) {
      // darker and greener than the thing itself, as he paints what the water holds; fainter far from the waterline
      hC = mix(body * vec3(0.16, 0.36, 0.31), cEmer * 0.6, 0.5);
      hC = mix(hC, cMGlow * 0.62, gl * 0.92);
      hA = 1.0 - 0.55 * smoothstep(0.3, 0.8, vH); hC *= hA;
    }
  }
}`)
          .replace('#include <opaque_fragment>', '  outgoingLight = hC; diffuseColor.a = hA;\n#include <opaque_fragment>');
      };
      m.customProgramCacheKey = () => 'bocklin-harp';
      return [m, u];
    };
    const [mm, mu] = make(1), [hm, hu] = make(0);
    this.mirM = mm; this.mu = mu; this.harpM = hm; this.hu = hu; this.base = base;
    this.mir = new THREE.Mesh(geo, mm); this.mir.renderOrder = 6; L.add(this.mir);
    this.harp = new THREE.Mesh(geo, hm); this.harp.renderOrder = 7; L.add(this.harp);
    // (none of the three is drawn into the polished floor's own reflection: the sea is its own, and holds the harp's.
    // The mirror shows and hides what it is given, so they are shown and hidden by their materials.)
    { const fl = L.k.museum.floors; if (fl) for (const o of [this.mir, this.harp]) if (!fl.includes(o)) fl.push(o); }
  },

  hide() { this.seaM.visible = false; this.mirM.visible = false; this.harpM.visible = false; this.sh.uSea.value.w = 0; },

  // The band: Schubert's four bars and two of the piano alone, round and round; the water lifting, and running off the harp.
  band(L, slow) {
    const s = score(L), soft = L.calm ? 0.8 : 1, ev = [];
    BARS.forEach(([mel, run, bass], b) => {
      const tb = b * BAR;
      for (const [at, m, len, who] of mel) {
        if (who) ev.push({ t: (tb + at * SX) * slow, f: hz(m), d: Math.max(1.5, len * SX * 2.6) * slow, type: 'sine', vol: 0.03 * soft, attack: 0.03, over: 0.5, overVol: 0.5 });
        else ev.push({ t: (tb + at * SX) * slow, f: hz(m), d: Math.max(1.0, len * SX * 2.4) * slow, type: 'triangle', vol: 0.03 * soft, attack: L.calm ? 0.02 : 0.004, over: 2, overVol: 0.3 });
      }
      run.forEach((m, i) => ev.push({ t: (tb + i * SX) * slow, f: hz(m), d: 0.42 * slow, type: 'sine', vol: (i % 2 ? 0.0052 : 0.0068) * soft, attack: 0.006 }));
      ev.push({ t: tb * slow, f: hz(bass), d: BAR * 1.15 * slow, type: 'sine', vol: 0.014 * soft, attack: 0.05 });
    });
    s.loop(T0 * slow, CYCLE * slow, ev);
    s.hit((T_DOME + 0.05) * slow, { d: 1.2 * slow, vol: 0.009 * soft, bp: 420, q: 0.7, attack: 0.4 * slow });       // the water lifting
    s.hit((T_UP + 0.3) * slow, { d: 1.1 * slow, vol: 0.006 * soft, hp: 2400, lp: 7000, attack: 0.2 * slow });        // and running off it
    for (const [t, f] of [[0.95, 1500], [1.12, 1900], [1.3, 1300], [1.52, 1700], [1.9, 1450], [2.5, 1600]]) s.note(t * slow, f, 0.07, { type: 'sine', vol: 0.004 * soft, to: f * 0.62, attack: 0.003 });      // drips
    return s.done();
  },

  start(L, resumed) {
    this.seaM.visible = true; this.mirM.visible = true; this.harpM.visible = true;
    if (resumed) {                                   // it was still out: the music picks up where it stopped
      this.off = this.T - L.t;
      const m = this.T * this.speed - this.shift; if (this.cut < m) { this.shift += m - this.cut; this.floorT = this.cut; }
      this.cut = Infinity; this.sc.from((this.T * this.speed - this.shift) / this.speed);
      return;
    }
    this.T = 0; this.off = 0; this.shift = 0; this.cut = Infinity; this.floorT = -1; this.speed = L.calm ? 0.7 : 1;
    this.xt.fill(0); this.brushed = -1; this.toyAt.u = 99; this.nod = 0; this.glowM = 0; for (const r of this.toyRings) r.t = -99;
    this.sc = this.band(L, 1 / this.speed); this.sc.from(0);
    this.sh.uCfg.value.set(0, L.calm ? 14 : 40, L.calm ? 0.5 : 1, L.calm ? 0.5 : 0.07); this.su.uCalm.value = L.calm ? 1 : 0; this.base.uWind.value.set(0, L.calm ? 0.7 : 1.3, L.calm ? 2.4 : 5.2, L.calm ? 0.5 : 1);
    if (!this.told && !L.quiet) { this.told = true; L.k.say('A harp comes up out of a still sea and plays. Its reflection plays the notes back.', 4); }
  },
  end() { this.hide(); this.lap.set(0); },
  reset() { this.told = false; this.hide(); if (this.lap) this.lap.set(0); },

  // The sea's shape on the CPU (without its ragged edge): under 1 is water.
  seaD(u, o) { const ex = (u - SEA.u) / SEA.a, ey = o / SEA.b, a = Math.atan2(ey, ex); return Math.hypot(ex, ey) / (1 + 0.05 * Math.sin(3 * a + 0.6) + 0.035 * Math.sin(5 * a + 2.1) + 0.02 * Math.sin(9 * a + 0.9)); },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return', calm = L.calm;
    if (showing) this.T = L.t + this.off; else this.T += dt;
    const t = this.T * this.speed;                                   // the scene's own time
    if (!showing && this.cut === Infinity) this.cut = t - this.shift;  // the look has ended: no note after this one
    const m = t - this.shift, cut = this.cut;                        // the music's time (it stops with the look, and picks up again)
    const U = this.sh, S = this.su, H = this.hu, MU = this.mu, W = this.base.uWind.value;
    const out = back ? 1 - ease.inOut(ramp(L.ret, 0.42, 1)) : 1, sink = back ? ease.inOut(ramp(L.ret, 0.0, 0.62)) : 0;

    // ---- the sea runs out from under the picture
    const spread = ease.out(ramp(t, 0, 1.25)) * out;
    U.uSea.value.w = spread; U.uCfg.value.x = t; S.uTime.value = t;

    // ---- the harp: up out of the water, and riding it
    const k = ramp(t, T_UP, T_OUT), after = Math.max(0, t - T_OUT);
    const rise = Math.pow(ease.smooth(k), 0.8);
    let y = k < 1 ? lerp(-DEEP, 0.045, rise) : 0.045 * Math.exp(-after * 2.4) * Math.cos(after * 5.2);
    y += 0.007 * Math.sin(t * 1.5 + 0.6) * clamp01(after) - 0.005 * this.nod - DEEP * sink;
    const roll = -0.13 * (1 - rise) + 0.022 * Math.sin(t * 1.05 + 1) * clamp01(after * 0.7) + 0.02 * Math.exp(-after * 2) * Math.sin(after * 5.2) - 0.008 * this.nod - 0.3 * sink;
    const pitch = 0.018 * Math.sin(t * 0.83) * clamp01(after * 0.7) + 0.1 * (1 - rise) + 0.1 * sink;
    const cy = Math.cos(HARP.yaw), sy = Math.sin(HARP.yaw), X = this.v.set(L.tx * cy + L.nx * sy, 0, L.tz * cy + L.nz * sy);
    this.B.makeBasis(X, this.w.set(0, 1, 0), this.z.set(-X.z, 0, X.x));
    L.floor(HARP.u, HARP.o, this.w); this.B.setPosition(this.w.x, this.Y0 + y, this.w.z);
    this.M.copy(this.B).multiply(this.R.makeRotationZ(roll)).multiply(this.R.makeRotationX(pitch)).scale(this.z.setScalar(HARP.size));
    const up = y > -DEEP + 0.02;
    S.uFoot.value.z = clamp01((y + 0.2) / 0.2) * (1 - sink);
    this.base.uDrip.value.set(t - (T_UP + 0.12), back ? 0 : 3.4, 0, 0);
    { const c = Math.max(0, Math.floor((t - this.shift - T0) / CYCLE)), ag = t - this.shift - (T0 + c * CYCLE + T_LONG);        // (and a breath of his wind on the long note)
      W.x = (0.74 + 0.3 * (ag > 0 ? ramp(ag, 0, 0.5) * (1 - ramp(ag, 0.9, 2.4)) : 0)) * ease.smooth(ramp(t, T_OUT + 0.1, T_OUT + 1.6)) * (1 - sink); }

    // ---- the phrase: which strings sound, on the harp and in the water
    const ph0 = this.ph.fill(0), gh = this.gh.fill(0), pm = this.pm.fill(0), gm = this.gm.fill(0), NE = this.ev.length;
    for (let j = 0; j < NSP; j++) { H.uSp.value[j].w = -1; H.uSb.value[j] = 0; MU.uSp.value[j].w = -1; MU.uSb.value[j] = 0; }
    const cyc = Math.floor((m - T0) / CYCLE);
    for (let c = Math.max(0, cyc - 1); c <= cyc; c++) {
      const tc = T0 + c * CYCLE;
      for (let i = 0; i < NE; i++) {
        const e = this.ev[i], te = tc + e.t, age = m - te; if (age < 0 || te > cut || te <= this.floorT || age > 4) continue;
        const A = Math.exp(-age / (0.3 + 0.9 * e.len)), Gl = calm ? 0.55 * ramp(age, 0, 0.45) * Math.exp(-age / 1.3) : ramp(age, 0, 0.035) * Math.exp(-age / (0.22 + 0.8 * e.len));
        const slot = (c * NE + i) % NSP, mid = this.strMid[e.s], lit = age < 2.3;       // (a spark keeps its place for as long as it lives)
        if (e.who) { pm[e.s] = Math.max(pm[e.s], A); gm[e.s] = Math.max(gm[e.s], Gl); if (lit) { MU.uSp.value[slot].set(mid.x, mid.y, mid.z, age); MU.uSb.value[slot] = 1.6; } }
        else {
          ph0[e.s] = Math.max(ph0[e.s], A); gh[e.s] = Math.max(gh[e.s], Gl); pm[e.s] = Math.max(pm[e.s], 0.3 * A); gm[e.s] = Math.max(gm[e.s], 0.2 * Gl);        // (and in the water what a mirror shows of it)
          if (lit) { H.uSp.value[slot].set(mid.x, mid.y, mid.z, age); H.uSb.value[slot] = 1; MU.uSp.value[slot].set(mid.x, mid.y, mid.z, age); MU.uSb.value[slot] = 0.35; }
        }
      }
      // (the piano's run: a shimmer down the strings, and the same in the water, as a mirror has it)
      if (!calm) for (const e of this.run) { const te = tc + e.t, age = m - te; if (age < 0 || te > cut || te <= this.floorT || age > 0.6) continue; const g = 0.2 * Math.exp(-age / 0.13); gh[e.s] = Math.max(gh[e.s], g); gm[e.s] = Math.max(gm[e.s], g * 0.7); ph0[e.s] = Math.max(ph0[e.s], g * 0.6); }
    }
    // the toy brushes the strings as it goes by, and leaves rings behind it on the water
    const toy = L.k.G.vehicle, on = !!(toy && toy.group && toy.group.visible && Math.abs(toy.pos.y - L.y) < 0.4), xt = this.xt, fall = Math.exp(-dt / 0.45);
    for (let i = 0; i < NS; i++) xt[i] *= fall;
    if (on) {
      const dx = toy.pos.x - this.M.elements[12], dz = toy.pos.z - this.M.elements[14], xl = (dx * X.x + dz * X.z) / HARP.size, zl = -dx * X.z + dz * X.x;
      const tu = (toy.pos.x - L.cx) * L.tx + (toy.pos.z - L.cz) * L.tz, to = (toy.pos.x - L.cx) * L.nx + (toy.pos.z - L.cz) * L.nz;
      this.brushT -= dt;
      if (up && !sink && Math.abs(zl) < 0.3 && xl > -0.08 && xl < 0.62) {
        let bi = 0, bd = 9; for (let i = 0; i < NS; i++) { const d = Math.abs(this.strMid[i].x - xl); if (d < bd) { bd = d; bi = i; } }
        if (bi !== this.brushed && this.brushT <= 0) { this.brushed = bi; this.brushT = 0.07; xt[bi] = 1; if (!L.quiet) L.voice().note(hz(STR[bi]), 1.1, { vol: 0.026, type: 'triangle', attack: 0.004 }); this.ring(tu, to, 0.5); }
      } else this.brushed = -1;
      const wetToy = this.seaD(tu, to) < spread - 0.03;
      if (wetToy && Math.hypot(tu - this.toyAt.u, to - this.toyAt.o) > 0.24) { this.toyAt.u = tu; this.toyAt.o = to; this.ring(tu, to, 0.55); }
      S.uToy.value.set(tu, to, wetToy ? 1 : 0, 0.3);
    } else S.uToy.value.z = 0;
    let hMax = 0, mMax = 0; for (let i = 0; i < NS; i++) { hMax = Math.max(hMax, ph0[i]); mMax = Math.max(mMax, gm[i]); }
    this.nod = hMax;
    this.glowM = calm ? lerp(this.glowM, Math.min(1, mMax * 1.4), Math.min(1, dt * 1.2)) : mMax;      // (calm: it swells and fades, no pulse)
    S.uFoot.value.w = this.glowM * (up ? 1 : 0); U.uCfg.value.z = (calm ? 0.5 : 1) * (1 + 1.6 * this.glowM);
    const quiver = calm ? 0.5 : 1;
    for (let i = 0; i < NS; i++) {
      H.uPl.value[i].set(Math.max(ph0[i], xt[i]) * quiver, Math.max(gh[i], xt[i]), 0, 0);
      MU.uPl.value[i].set(Math.max(pm[i], 0.3 * xt[i]) * quiver, Math.max(gm[i], 0.25 * xt[i]), 0, 0);
    }

    // ---- rings on the water
    const E = L.k.G.camera.position, fu = HARP.u + 0.035, fo = HARP.o + 0.01, lo = this.lo; this.nr = 0;
    this.put(fu, fo, t - T_DOME, 0.7); this.put(fu, fo, t - (T_UP + 0.1), 1.2); this.put(fu, fo, t - (T_UP + 0.5), 0.9); this.put(fu, fo, t - (T_OUT + 0.15), 0.6);
    if (back) this.put(fu, fo, (L.ret - 0.3) * L.retDur * this.speed, 1.0);
    for (let c = Math.max(0, cyc - 1); c <= cyc; c++) {
      const tc = T0 + c * CYCLE;
      for (let i = 0; i < NE; i++) {
        const e = this.ev[i], te = tc + e.t, age = m - te; if (age < 0 || te > cut || te <= this.floorT || age > RLIFE) continue;
        if (!e.who) { this.put(fu + 0.02, fo + 0.02, age, 0.3 + 0.5 * e.len); continue; }
        // (from where that string lies in the water, as the eye has it)
        this.image(L, E, this.w.copy(this.strMid[e.s])); this.put(lo.u, lo.o, age, 0.55 + 0.9 * e.len);
      }
      // the long note that ends it: one slow ring from the foot of the harp over the whole sea
      { const te = tc + T_LONG + 0.1, age = m - te; if (age >= 0 && te <= cut && te > this.floorT) this.put(fu, fo, age, 1.3); }
    }
    for (const r of this.toyRings) this.put(r.u, r.o, t - r.t, r.amp);
    for (let i = this.nr; i < NR; i++) U.uRing.value[i].w = 0;

    // ---- where the harp's image lies on the water, from here: its pillar and its rod (for the dark under them)
    this.image(L, E, this.w.set(0, 0, 0)); S.uRefA.value.x = S.uFoot.value.x = lo.u; S.uRefA.value.y = S.uFoot.value.y = lo.o;
    this.image(L, E, this.w.set(PB[0] + 0.01, PB[1] + 0.05, 0)); S.uRefA.value.z = lo.u; S.uRefA.value.w = lo.o;
    this.image(L, E, this.w.set(RB[0] + 0.04, RB[1] + 0.03, 0)); S.uRefB.value.x = lo.u; S.uRefB.value.y = lo.o;
    this.image(L, E, this.w.set(RT[0], RT[1], 0)); S.uRefB.value.z = lo.u; S.uRefB.value.w = lo.o;

    // ---- the light that opens on the water on the long note
    { const c = Math.max(0, cyc), te = T0 + c * CYCLE + T_LONG, age = m - te, live = age >= 0 && te <= cut && te > this.floorT; S.uSheen.value.set(0.2 + 1.1 * age, 0.5 + 0.25 * Math.max(0, age), live ? ramp(age, 0, calm ? 1.1 : 0.5) * (1 - ramp(age, 1.2, 2.4)) * out : 0, 0); }

    this.seaM.visible = spread > 0.002; this.harpM.visible = up && sink < 0.999; this.mirM.visible = this.harpM.visible && spread > 0.3;
    this.lap.set((calm ? 0.004 : 0.006) * spread);
    if (showing) this.sc.play(m / this.speed);
    L.voice().place();
  },
  // A ring on the water: where it began (along, out), how long ago, how strong.
  put(u, o, age, amp) { if (this.nr < NR && age >= 0 && age < RLIFE && amp > 0.01) this.sh.uRing.value[this.nr++].set(u, o, age, amp); },
  // Where the eye at E finds the image of a point of the harp (given in the harp's own measure, in w) on the water: into this.lo.
  image(L, E, w) {
    w.applyMatrix4(this.M); const h = Math.max(0, w.y - this.Y0), sF = (E.y - this.Y0) / Math.max(E.y - this.Y0 + h, 1e-3), x = E.x + (w.x - E.x) * sF - L.cx, z = E.z + (w.z - E.z) * sF - L.cz;
    this.lo.u = x * L.tx + z * L.tz; this.lo.o = x * L.nx + z * L.nz;
  },
  ring(u, o, amp) { const r = this.toyRings[this.tri = (this.tri + 1) % this.toyRings.length]; r.u = u; r.o = o; r.t = this.T * this.speed; r.amp = amp; },
});
