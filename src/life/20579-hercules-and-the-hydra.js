// Gustave Moreau, Hercules and the Lernaean Hydra (1875–76), Gallery 223. The word: hiss.
//
// A dark gorge under a lurid evening sky, a red sun low between the cliffs: the young Hercules on the left, with his
// club, his bow and the lion's skin, looks across at the Hydra, which Moreau painted as one upright column, black above
// and pale and barred beneath, with seven heads branching from the top of it like a candelabrum, each a different snake.
// It is the moment before: nobody has moved yet. That stillness is the show.
//
// Look at it and his dark ground seeps out from the foot of the picture, and rocks come up at the foot of the wall to the
// RIGHT of the frame (where no canvas hangs low, so the monster can stand tall and never cross the picture). The Hydra
// rises out of the rocks with a hiss that is eased in: the black trunk first, the Old One, hooded; then the others one
// by one, out of the trunk and out of the rocks round it, each with its own colours, its own jewels down its back and
// its own note, so that the seven hisses make a chord. They sway like cobras, each in its own time. On the left, out from
// under the picture, come the hero's arms and lay themselves ready on his rock: the lion's skin over it, his red cloak,
// the quiver and the bow stood beside it, and last the club, which comes to lean against it with a knock. At the knock
// every head turns to look, the chord sounds, and they hold still: the stand-off, jewelled and dreamlike, while his red
// sun comes up over the foot of the wall between them. The Old One leans slowly down to look closer; the bowstring
// sings by itself, one note; and all seven heads draw back together, and settle, and watch again. That is where it
// stays. When you stop looking the toy is there, and the curious heads find it and follow it with their eyes, from
// where they are: a head the toy comes near draws back from it.
//
// How it is made: every neck is a smooth tube laid along a curve that is worked out again each frame (it slides up out
// of the rock along its own length, as a snake comes out of a hole), under a painted shell of scales (one texture, drawn
// once: overlapping scales, a barred belly, jewels set down the spine that glint); the heads are in the same mesh and
// the same paint. One draw call for the Hydra, one for the rocks and the hero's things, one for the ground and the sun.
// The heads that lean out under the picture stay below its bottom rail from the floor's eye; the tall ones stand beside it.
// With "Reduce motion and flashing" on (museum.calm) everything runs at six tenths of the speed, the jewels do not
// twinkle, the tongues do not flutter, the bow does not shiver, and the sounds are softer and slower to come.
//
// No music: the chord of hisses is the sound. (A flute line from Debussy's Faune was the thought, but it could not be
// checked note for note, so it was left out.)
//
// What it does not do: no figure is modelled (Hercules is his lion skin, bow, quiver, cloak and club, laid ready), none
// of the picture's dead are shown, and nothing is struck, bitten, cut or killed, nor does any head lunge at the toy or
// the camera, because the picture is the stillness before the fight and small children play this.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { strokes } from './brush.js';
import { hump, noise } from './stagecraft.js';

const TAU = Math.PI * 2;
const ROOT = { u: 1.24, o: 0.44 };               // the foot of the trunk: at the wall, to the right of the frame
const HR = { u: -0.24, o: 0.5 };                 // his rock, under the left of the picture, where his arms are laid
const THINGS = [-0.14, 0.2, 0.56];               // what the heads look at there
const DOOR = { u: -0.3, o: -0.2 };               // where his things come from, under the picture
const CAM = { u: 0.55, h: 0.72, o: 2.6 };        // the look camera (the curious head looks at you)
const T_SKIN = 1.1, T_BOW = 1.75, T_CLUB = 1.8, T_KNOCK = 2.55, T_LEAN = 3.9, LEAN = 1.4, EVERY = 13;       // the Old One leans at T_LEAN; the string sings LEAN later
const R = 38, S = 12, NS = 44;                   // rings to a neck, sides to a ring, samples of its curve
const VLEN = 13.8;                               // one turn of the scale texture, in neck radii along the neck

// The seven: where each leaves the trunk or the rocks, where its neck ends (the head goes on from there), how thick,
// its colours, its jewel, its eye, how it sways and what it sounds.
//   from: 't' the trunk itself, 'b' a branch of the trunk at height b, 'f' out of the rocks at root
const NECKS = [
  { name: 'the Old One', from: 't', b: 0.6, E: [1.1, 0.93, 0.52], r0: 0.085, r1: 0.05, m: [0.95, 1.05], rise: [0.2, 1.25], back: '#2a231d', band: '#17130f', belly: '#d8cfa8', gem: '#e0b040', eye: '#f2c450', sw: [0.035, 1.5, 0.0], head: { l: 1.0, w: 1.12 }, hood: 0.6, hz: 880 },
  { name: 'blue', from: 'b', b: 0.42, E: [0.8, 0.55, 0.63], r0: 0.03, r1: 0.027, m: [1.3, 1.1], rise: [1.15, 0.95], back: '#27405e', band: '#16263a', belly: '#93a4ad', gem: '#5a9cf0', eye: '#9ad0ff', sw: [0.045, 1.9, 1.1], head: { l: 1.18, w: 0.88, crest: true }, hz: 1318.5 },
  { name: 'red', from: 'f', root: [1.02, 0.52], b: 0.1, E: [0.5, 0.33, 0.8], r0: 0.032, r1: 0.027, m: [1.5, 0.9], rise: [1.45, 0.95], back: '#96402a', band: '#4a1e14', belly: '#d2b088', gem: '#e8b84a', eye: '#ffb030', sw: [0.04, 2.3, 2.0], head: { l: 0.86, w: 1.12 }, hz: 1046.5 },
  { name: 'orange', from: 'b', b: 0.55, E: [1.46, 0.84, 0.56], r0: 0.028, r1: 0.024, m: [2.5, 2.3], rise: [0.95, 1.0], back: '#c8602c', band: '#d8a040', belly: '#e8cf9a', gem: '#48c890', eye: '#70f0b0', sw: [0.05, 1.7, 3.0], head: { l: 0.95, w: 0.9 }, hz: 1568 },
  { name: 'grey', from: 'f', root: [1.47, 0.52], b: 0.1, E: [1.68, 0.57, 0.76], r0: 0.031, r1: 0.027, m: [2.1, 1.5], rise: [0.6, 1.0], back: '#637d90', band: '#a3b4bc', belly: '#cdd3c8', gem: '#e85048', eye: '#e8f4ff', sw: [0.05, 2.1, 4.1], head: { l: 0.9, w: 1.0, eye: 1.35 }, hz: 1975.5 },
  { name: 'ochre', from: 'b', b: 0.5, E: [0.99, 0.66, 0.8], r0: 0.03, r1: 0.026, m: [1.4, 0.9], rise: [1.35, 0.95], back: '#b08c3c', band: '#5e4624', belly: '#e2d2a0', gem: '#d84a34', eye: '#f0d060', sw: [0.035, 1.3, 5.0], head: { l: 1.0, w: 1.05 }, hz: 1174.7 },
  { name: 'green', from: 'f', root: [1.3, 0.68], b: 0.08, E: [1.27, 0.34, 0.98], r0: 0.028, r1: 0.024, m: [1.2, 0.8], rise: [0.85, 0.95], back: '#3f5e3c', band: '#1e2e22', belly: '#b8c090', gem: '#e0b040', eye: '#ff5a48', sw: [0.045, 2.5, 0.6], head: { l: 0.9, w: 0.95 }, hz: 2349.3 },
];
const BLUE = 1, GREY = 4, OCHRE = 5, GREEN = 6;
// The rocks: the Hydra's four, and the hero's one [along, out, width, height, depth, turn]
const ROCKS = [[1.25, 0.4, 0.24, 0.1, 0.17, 0.3], [1.02, 0.5, 0.16, 0.08, 0.13, 1.4], [1.47, 0.5, 0.17, 0.085, 0.13, 2.3], [1.3, 0.67, 0.15, 0.06, 0.12, 0.8], [HR.u, HR.o, 0.13, 0.062, 0.1, 0.9]];

const sstep = (x, a, b) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };

// ---------------------------------------------------------------- the painted shell: scales, a barred belly, jewels
// Round the neck (x): the belly at the seam (x = 0 and 1), the spine down the middle. Along it (y): the tail at 0.
// The colour is a light, warm grey (the neck's own colours come from its vertices and are multiplied by it); the alpha
// marks the jewels, which glint in each neck's own jewel colour.
function scaleTexture() {
  const W = 256, H = 512, cols = 12, rows = 24, sw = W / cols, sh = H / rows;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c.getContext('2d', { willReadFrequently: true }); };
  const g = mk(), q = mk(), hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  g.fillStyle = '#4a4640'; g.fillRect(0, 0, W, H); q.fillStyle = '#000'; q.fillRect(0, 0, W, H);
  for (let row = -1; row <= rows + 1; row++) for (let c = -1; c <= cols; c++) {
    const rr = ((row % rows) + rows) % rows, cc = ((c % cols) + cols) % cols, h1 = hash(rr, cc), h2 = hash(rr + 31, cc + 7);
    const cx = (c + (rr % 2 ? 0.5 : 0) + 0.5) * sw, cy = row * sh, rx = sw * 0.62, ry = sh * 1.05;
    const t = 196 + 56 * h1, warm = 0.9 + 0.1 * h2, gr = g.createLinearGradient(0, cy - ry * 0.7, 0, cy + ry * 1.2);
    gr.addColorStop(0, `rgb(${t | 0},${(t * 0.985) | 0},${(t * warm) | 0})`); gr.addColorStop(0.55, `rgb(${(t * 0.84) | 0},${(t * 0.82) | 0},${(t * 0.78 * warm) | 0})`); gr.addColorStop(1, `rgb(${(t * 0.5) | 0},${(t * 0.47) | 0},${(t * 0.44) | 0})`);
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy + ry * 0.3, rx, ry, 0, 0, TAU); g.fill();
    // the fine dark line round its free edge, and the light the brush left inside it
    g.strokeStyle = 'rgba(14,10,7,0.86)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx, cy + ry * 0.3, rx, ry, 0, Math.PI * 1.02, Math.PI * 1.98); g.stroke();
    g.strokeStyle = 'rgba(255,252,240,0.42)'; g.lineWidth = 1.1; g.beginPath(); g.ellipse(cx, cy + ry * 0.36, rx * 0.66, ry * 0.8, 0, Math.PI * 1.15, Math.PI * 1.62); g.stroke();
    // a jewel set in it: down the spine on every other row, and here and there on the flanks
    const spine = cc === cols / 2 - (rr % 2 ? 1 : 0) && rr % 2 === 0 || cc === cols / 2 && rr % 2 === 0, flank = h2 > 0.93 && cc > 2 && cc < cols - 3;
    if (spine || flank) {
      const jx = cx, jy = cy + ry * 0.05, jr = spine ? 3.6 : 2.6;
      g.fillStyle = 'rgba(10,8,6,0.9)'; g.beginPath(); g.arc(jx, jy, jr + 1.5, 0, TAU); g.fill();
      g.fillStyle = 'rgb(250,246,232)'; g.beginPath(); g.arc(jx, jy, jr, 0, TAU); g.fill();
      q.fillStyle = '#fff'; q.beginPath(); q.arc(jx, jy, jr, 0, TAU); q.fill();
    }
  }
  // the belly: broad plates across it, each with its dark edge (his barred, pale underside)
  const bw = W * 0.125, ph = H / 20;
  for (const x0 of [0, W]) for (let p = -1; p <= 20; p++) {
    const y = p * ph, gr = g.createLinearGradient(0, y, 0, y + ph);
    gr.addColorStop(0, 'rgb(250,246,232)'); gr.addColorStop(0.7, 'rgb(214,206,186)'); gr.addColorStop(1, 'rgb(150,140,122)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x0 - bw, y + 3); g.quadraticCurveTo(x0, y - 4, x0 + bw, y + 3); g.lineTo(x0 + bw, y + ph + 3); g.quadraticCurveTo(x0, y + ph - 4, x0 - bw, y + ph + 3); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(30,22,14,0.85)'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x0 - bw, y + 3); g.quadraticCurveTo(x0, y - 4, x0 + bw, y + 3); g.stroke();
    q.fillStyle = '#000'; q.fillRect(x0 - bw, y, bw * 2, ph + 4);
  }
  const c = g.getImageData(0, 0, W, H).data, d = q.getImageData(0, 0, W, H).data, out = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H * 4; i += 4) { out[i] = c[i]; out[i + 1] = c[i + 1]; out[i + 2] = c[i + 2]; out[i + 3] = d[i]; }
  const t = new THREE.DataTexture(out, W, H, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.flipY = false;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}

lifeFor(20579, {
  title: /^Hercules and the Lernaean Hydra/,
  word: 'hiss',
  // (a big work: the camera stands back far enough to keep all of it, and a little to the right, between his arms laid under
  // the picture and the Hydra beside it)
  stage: { out: 1.5, half: 1.7, cam: { dist: CAM.o, height: CAM.h, side: CAM.u, fov: 65, lookU: 0.55, lookOut: 0.3, lookH: 1.03, whole: false } },
  wake: 2, ret: 2.4,
  linger: { near: 3.6, max: 24 },

  build(L) {
    const P = L.pal, col = (h, a = 0.18) => P.near(h, a);
    const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
    this.v = V3(); this.w = V3();
    this.buildGround(L, col);
    this.buildHydra(L, col);
    this.buildRig(L, col, V3);
    this.tc = 0; this.lastT = -1; this.toyK = 0; this.calm = false; this.toy = { u: 0, h: 0.15, o: 2, on: false };
  },

  // ---------------------------------------------------------------- his ground
  // The picture's own dark earth, only under where they stand: two patches that run together, one under his rock and
  // one round the Hydra's rocks, with a broken edge, a grey glint of his pool between them and a little of his red sun.
  buildGround(L, col) {
    const rock = strokes({
      size: 512, seed: 20579, n: 3000, len: [12, 30], width: [6, 13], bend: 0.4, lift: 0.1, base: col('#231b14', 0.2).getStyle(),
      colors: [['#2b2219', 4], ['#1c1611', 4], ['#33271b', 3], ['#3f3122', 1.4], ['#3d3b30', 0.6], ['#232b30', 1.0], ['#5a2418', 0.3], ['#4a3a22', 0.5]].map(([c, w]) => [col(c, 0.2).getStyle(), w]),
      angle: (x, y, r) => (r() - 0.5) * 1.6 + 0.2,
    });
    const F = (u, o) => L.floor(u, o, new THREE.Vector3()).toArray(), pos = [];
    const a = F(-0.95, -L.wall), b = F(2.15, -L.wall), c = F(2.15, 1.45), d = F(-0.95, 1.45);
    pos.push(...a, ...b, ...c, ...a, ...c, ...d);
    // (and a strip of the wall's foot, under the frame's rail, for his sun to come up on: on the wall, never the picture)
    { const w0 = F(-0.7, -L.wall + 0.012), w1 = F(1.6, -L.wall + 0.012), up = Math.min(0.64, L.rail - L.y - 0.04), w2 = [w1[0], w1[1] + up, w1[2]], w3 = [w0[0], w0[1] + up, w0[2]]; pos.push(...w0, ...w1, ...w2, ...w0, ...w2, ...w3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const u = this.gu = { uSpread: { value: 0 }, tRock: { value: rock }, uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) },
      uA: { value: new THREE.Vector4(HR.u + 0.04, 0.42, 0.52, 0.56) }, uB: { value: new THREE.Vector4(1.22, 0.42, 0.7, 0.6) },
      uPool: { value: col('#8fa0a6', 0.3) }, uSun: { value: col('#d0683a', 0.3) }, uSunHi: { value: new THREE.Color('#f6b068') }, uDawn: { value: new THREE.Vector3(0.2, 0.2, 0) } };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uSpread; uniform vec3 uO, uPool, uSun, uSunHi, uDawn; uniform vec4 uAx, uA, uB; uniform sampler2D tRock; vec3 fCol; float fA;\nfloat hyLobe(vec2 p, vec4 c, float ph) { vec2 d = (p - c.xy) / c.zw; float a = atan(d.y, d.x); return length(d) / (1.0 + 0.16 * sin(3.0 * a + ph) + 0.09 * sin(5.0 * a + ph * 2.3) + 0.05 * sin(9.0 * a + 1.7)); }')
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz, p = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw));
  vec4 s1 = texture2D(tRock, p / 0.75), s2 = texture2D(tRock, p / 1.7 + 0.31);
  float e1 = hyLobe(p, uA, 1.1), e2 = hyLobe(p, uB, 4.0), e = -log(exp(-e1 * 5.0) + exp(-e2 * 5.0)) / 5.0;
  e += (s1.a - 0.55) * 0.22 + (s2.a - 0.55) * 0.1;
  float core = 1.0 - smoothstep(0.74, 0.9, e);
  vec3 c = mix(s1.rgb, s2.rgb, 0.35);
  // the grey water lying between them, and the low sun in it
  float pool = exp(-pow((p.x - 0.42) / 0.3, 2.0) - pow((p.y - 0.8) / 0.11, 2.0)) * smoothstep(0.35, 0.75, s2.a);
  c = mix(c, uPool, pool * 0.55);
  c += uSun * exp(-pow((p.x - 0.45) / 0.45, 2.0) - pow((p.y - 0.62) / 0.3, 2.0)) * 0.1 * s1.a;
  float grow = p.y / 1.3 * 0.75 + s1.a * 0.25;
  fA = smoothstep(0.0, 0.05, uSpread * 1.3 - grow) * core * 0.94;
  fCol = c;
  float hh = lifeP.y - uO.y;
  if (hh > 0.04) {
    // his sun, low and red, streaked with cloud, and the lurid light either side of it
    vec2 d = vec2(p.x - uDawn.x, hh - uDawn.y);
    float disc = 1.0 - smoothstep(0.07, 0.088, length(d));
    float streak = smoothstep(0.35, 0.9, sin(hh * 110.0 + 2.5 * sin(p.x * 9.0)));
    vec4 st = texture2D(tRock, vec2(p.x * 0.5, hh * 2.4));
    float glow = exp(-pow(d.x / 0.62, 2.0) - pow(d.y / 0.12, 2.0));
    fCol = mix(uSun * 1.15, uSunHi, disc * (1.0 - 0.6 * streak));
    fA = max(disc * 0.96, glow * 0.55 * (0.45 + 0.75 * st.a)) * uDawn.z * smoothstep(0.63, 0.53, hh) * smoothstep(-0.68, -0.3, p.x) * smoothstep(1.58, 1.0, p.x);
  }
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'moreau-ground';
    this.ground = new THREE.Mesh(g, m); this.ground.position.y = 0.016; this.ground.renderOrder = 5; L.add(this.ground);
  },

  // ---------------------------------------------------------------- the Hydra: seven necks and heads, one mesh
  buildHydra(L, col) {
    const A = { p: [], n: [], uv: [], c: [], g: [], pl: [], idx: [] };
    const C = new THREE.Color(), boost = 1.3;
    const H = this.H = NECKS.map((spec, i) => {
      const N = { i, spec, back: col(spec.back, 0.15).multiplyScalar(boost), band: col(spec.band, 0.15).multiplyScalar(boost), belly: col(spec.belly, 0.15).multiplyScalar(boost), gem: new THREE.Color(spec.gem), eye: new THREE.Color(spec.eye) };
      N.sp = new Float32Array(NS * 3); N.cum = new Float32Array(NS); N.rp = new Float32Array(R * 3); N.rt = new Float32Array(R * 3); N.rn = new Float32Array(R * 3); N.rr = new Float32Array(R);
      N.E = [0, 0, 0]; N.F = [-1, 0, 0]; N.aim = [0, 0, 0]; N.aimOn = false; N.g = 0; N.jaw = 0; N.tongue = 0; N.tilt = 0; N.watch = 0;
      return N;
    });
    // the body: rings of S + 1 points (the seam twice, for the texture), its colours and the jewels' colour
    for (const N of H) {
      const sp = N.spec, i = N.i; N.v0 = A.p.length / 3;
      N.len = this.restLength(N) * 1.12 + 0.08;                    // long enough to reach the rock (or deep inside the trunk)
      for (let j = 0; j < R; j++) {
        const a = j / (R - 1), d = (1 - a) * N.len;                 // d: how far behind the head
        // (bands across the back, soft, each neck's own; the Old One all dark)
        const bandK = sp.from === 't' ? 0.35 * sstep(Math.sin(d * 38), 0.3, 0.9) : sstep(Math.sin(d * (i === 3 ? 70 : 46) + i + 1.9 * Math.sin(d * 17 + i * 2)), 0.1, 0.95) * 0.55;
        for (let k = 0; k <= S; k++) {
          const ph = k / S * TAU, bel = sstep(Math.cos(ph), 0.5, 0.86);
          C.copy(N.back).lerp(N.band, bandK).lerp(N.belly, bel);
          A.p.push(0, 0, 0); A.n.push(0, 1, 0); A.uv.push(k / S, -d / (VLEN * sp.r1)); A.c.push(C.r, C.g, C.b); A.g.push(N.gem.r, N.gem.g, N.gem.b); A.pl.push(0);
        }
      }
      for (let j = 0; j < R - 1; j++) for (let k = 0; k < S; k++) { const a = N.v0 + j * (S + 1) + k, b = a + S + 1; A.idx.push(a, a + 1, b, a + 1, b + 1, b); }
      this.buildHead(N, A, col);
    }
    const n = A.p.length / 3;
    const geo = this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 3); this.nor = new Float32Array(A.n);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('normal', new THREE.BufferAttribute(this.nor, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(A.uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(A.c, 3));
    geo.setAttribute('gem', new THREE.Float32BufferAttribute(A.g, 3));
    geo.setAttribute('plain', new THREE.Float32BufferAttribute(A.pl, 1));
    geo.setIndex(A.idx);
    const uT = this.uT = { value: 0 }, uTw = this.uTw = { value: 1 };
    const m = new THREE.MeshStandardMaterial({ map: scaleTexture(), vertexColors: true, roughness: 0.46, metalness: 0, emissive: 0xffffff, emissiveIntensity: 1 });
    m.onBeforeCompile = sh => {
      sh.uniforms.uHyT = uT; sh.uniforms.uHyTw = uTw;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 gem; attribute float plain; varying vec3 vGem; varying float vPlain;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vGem = gem; vPlain = plain;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uHyT, uHyTw; varying vec3 vGem; varying float vPlain; float hyA = 0.0;')
        .replace('#include <map_fragment>', '{ vec4 sc = texture2D(map, vMapUv); diffuseColor.rgb *= mix(sc.rgb, vec3(1.0), vPlain); hyA = sc.a * (1.0 - vPlain); }')
        .replace('#include <emissivemap_fragment>', `{
  float tw = 0.7 + 0.5 * uHyTw * sin(uHyT * 2.6 + vMapUv.y * 37.0 + vMapUv.x * 19.0);
  diffuseColor.rgb = mix(diffuseColor.rgb, vGem, hyA * 0.9);
  totalEmissiveRadiance = diffuseColor.rgb * 0.36 + vGem * (hyA * tw * 0.8 + vPlain * 0.9);
}`);
    };
    m.customProgramCacheKey = () => 'moreau-hydra';
    this.hydra = new THREE.Mesh(geo, m); this.hydra.name = 'hydra'; L.add(this.hydra);
    // the stage's frame, for the solver (it works along the wall, up, and out)
    this.fr = { ox: L.cx, oy: L.y, oz: L.cz, tx: L.tx, tz: L.tz, nx: L.nx, nz: L.nz };
  },

  // A head, in the neck's own units (its radius is 1): z forward from the end of the neck, y up, x to its left. The
  // skull, the lower jaw (which opens) and the tongue (which flicks) are three parts of the one mesh, moved each frame.
  buildHead(N, A, col) {
    const sp = N.spec, hs = sp.head, l = hs.l, w = hs.w, eyeS = hs.eye || 1;
    const h0 = A.p.length / 3, part = [], rest = [], rnor = [];
    const C = new THREE.Color(), mouth = col('#8e2f38', 0.1), mouthD = col('#4a1620', 0.1), ivory = new THREE.Color('#efe6cc'), dark = new THREE.Color('#0c0a08');
    const push = (x, y, z, nx, ny, nz, u, v, c, gem, pl, pt) => { rest.push(x, y, z); rnor.push(nx, ny, nz); part.push(pt); A.p.push(0, 0, 0); A.n.push(0, 1, 0); A.uv.push(u, v); A.c.push(c.r, c.g, c.b); A.g.push(gem.r, gem.g, gem.b); A.pl.push(pl); };
    const none = new THREE.Color(0, 0, 0);
    // a loft: rings [z, half width, height above its middle, depth below it, middle y], S + 1 points round each
    const loft = (rings, pt, tone) => {
      const b0 = rest.length / 3, T = 14;
      for (const [z, hw, ht, hb, yc] of rings) for (let k = 0; k <= T; k++) {
        const th = k / T * TAU, cs = Math.cos(th), x = hw * Math.sin(th), y = yc - cs * (cs > 0 ? hb : ht), o = tone(th, z, C);
        push(x, y, z, 0, 0, 0, k / T, z / VLEN, C, none, o || 0, pt);
      }
      const i0 = A.idx.length;
      for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < T; k++) { const a = h0 + b0 + i * (T + 1) + k, b = a + T + 1; A.idx.push(a, a + 1, b, a + 1, b + 1, b); }
      // its normals: from its own faces, the seam's two edges made one
      const acc = new Float32Array((rest.length / 3 - b0) * 3), pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3(), fn = new THREE.Vector3();
      const P = (i, v) => v.set(rest[(i - h0) * 3], rest[(i - h0) * 3 + 1], rest[(i - h0) * 3 + 2]);
      for (let f = i0; f < A.idx.length; f += 3) {
        P(A.idx[f], pa); P(A.idx[f + 1], pb); P(A.idx[f + 2], pc); fn.crossVectors(pb.sub(pa), pc.sub(pa));
        for (let q = 0; q < 3; q++) { const o = (A.idx[f + q] - h0 - b0) * 3; acc[o] += fn.x; acc[o + 1] += fn.y; acc[o + 2] += fn.z; }
      }
      for (let i = 0; i < rings.length; i++) { const a = (i * (T + 1)) * 3, b = (i * (T + 1) + T) * 3; for (let q = 0; q < 3; q++) { const s = acc[a + q] + acc[b + q]; acc[a + q] = acc[b + q] = s; } }
      for (let i = 0; i < acc.length; i += 3) { const ln = Math.hypot(acc[i], acc[i + 1], acc[i + 2]) || 1; rnor[b0 * 3 + i] = acc[i] / ln; rnor[b0 * 3 + i + 1] = acc[i + 1] / ln; rnor[b0 * 3 + i + 2] = acc[i + 2] / ln; }
    };
    // the skull: broad behind the eyes, a long blunt snout; dark above, going to the belly's pale along the lip; the
    // roof of the mouth rose (plain paint, no scales)
    const skull = [[-0.7, 1.0, 1.0, 1.0], [0, 1.08, 1.06, 1.0], [0.8, 1.38, 1.14, 0.72], [1.6, 1.56, 1.1, 0.32], [2.4, 1.44, 0.96, 0.25], [3.2, 1.16, 0.76, 0.22], [3.9, 0.84, 0.55, 0.2], [4.3, 0.5, 0.34, 0.14], [4.48, 0.03, 0.03, 0.02]]
      .map(([z, hw, ht, hb]) => [z * l, hw * (z < 0.1 ? 1 : w), ht, hb, z > 0.1 ? 0.02 : 0]);
    loft(skull, 0, (th, z, c) => {
      const cs = Math.cos(th); if (cs > 0.55 && z > 1.25 * l) { c.copy(mouth).lerp(mouthD, sstep(z, 3.4 * l, 1.2 * l)); return 1; }
      c.copy(N.back).lerp(N.band, 0.5 * sstep(Math.sin(z * 2.6 + 1), 0.2, 0.9)).lerp(N.belly, sstep(cs, -0.05, 0.5)); return 0;
    });
    // the lower jaw: hinged behind the eyes; pale and plated beneath, the floor of the mouth rose
    const jaw = [[0.15, 0.95, 0.1, 0.7], [0.9, 1.26, 0.1, 0.8], [1.7, 1.42, 0.1, 0.7], [2.5, 1.3, 0.1, 0.56], [3.3, 1.02, 0.1, 0.42], [3.9, 0.72, 0.09, 0.28], [4.22, 0.36, 0.06, 0.13], [4.36, 0.03, 0.02, 0.02]]
      .map(([z, hw, ht, hb]) => [z * l, hw * w, ht, hb, -0.27]);
    loft(jaw, 1, (th, z, c) => { const cs = Math.cos(th); if (cs < -0.6) { c.copy(mouth).lerp(mouthD, sstep(z, 3.4 * l, 1.0 * l)); return 1; } c.copy(N.belly).lerp(N.back, sstep(cs, 0.55, -0.3) * 0.75); return 0; });
    // small smooth things added whole: eyes, brows, the jewels on its crown, fangs
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), nm = new THREE.Matrix3(), v = new THREE.Vector3();
    const ball = new THREE.SphereGeometry(1, 10, 7), cone = new THREE.ConeGeometry(1, 1, 6);
    const add = (geo, pos, scl, rot, c, gem, pl, pt, uvAt = null) => {
      M.compose(v.set(...pos), Q.setFromEuler(E.set(...rot)), new THREE.Vector3(...scl)); nm.getNormalMatrix(M);
      const b0 = rest.length / 3, gp = geo.attributes.position, gn = geo.attributes.normal;
      for (let i = 0; i < gp.count; i++) {
        v.fromBufferAttribute(gp, i).applyMatrix4(M); const x = v.x, y = v.y, z = v.z; v.fromBufferAttribute(gn, i).applyMatrix3(nm).normalize();
        push(x, y, z, v.x, v.y, v.z, uvAt ? uvAt[0] : 0.5, uvAt ? uvAt[1] + z / VLEN : z / VLEN, c, gem, pl, pt);
      }
      const ix = geo.index.array; for (let i = 0; i < ix.length; i++) A.idx.push(h0 + b0 + ix[i]);
    };
    const wAt = z => { for (let i = 0; i < skull.length - 1; i++) if (z <= skull[i + 1][0]) { const k = (z - skull[i][0]) / (skull[i + 1][0] - skull[i][0]); return [lerp(skull[i][1], skull[i + 1][1], k), lerp(skull[i][2], skull[i + 1][2], k)]; } return [0, 0]; };
    const ez = 2.05 * l, [ew, eh] = wAt(ez), er = 0.3 * eyeS;
    for (const s of [-1, 1]) {
      add(ball, [s * ew * 0.8, eh * 0.52, ez], [er, er, er], [0, 0, 0], N.eye, N.eye.clone().multiplyScalar(0.85), 1, 0);                        // the eye: a jewel, lit from inside
      add(ball, [s * (ew * 0.8 + er * 0.74), eh * 0.52, ez + er * 0.36], [er * 0.22, er * 0.7, er * 0.4], [0, s * 0.45, 0], dark, none, 1, 0);     // its slit
      add(ball, [s * ew * 0.74, eh * 0.52 + er * 0.95, ez - 0.05], [0.26, 0.15, 0.62], [0.12, s * 0.2, s * 0.3], N.back, N.gem, 0, 0, [0.5, 0]);   // the brow
      add(ball, [s * 0.26 * w, wAt(4.0 * l)[1] + 0.03, 4.02 * l], [0.07, 0.05, 0.09], [0, 0, 0], dark, none, 1, 0);                               // a nostril
      add(cone, [s * 0.6 * w, -0.4, 3.3 * l], [0.1, 0.4, 0.1], [Math.PI, 0, 0], ivory, none, 1, 0);                                               // a fang
    }
    // the crown: jewels set along the top of the skull, red, gold and blue by turns, a big one on the brow
    const JW = ['#e2473c', '#f0c040', '#4f8fe8'].map(c => new THREE.Color(c));
    for (let b = 0; b < 5; b++) { const z = (0.1 + b * 0.5) * l, jc = JW[(b + N.i) % 3]; add(ball, [0, wAt(z)[1] + 0.03, z], [0.13, 0.1, 0.15], [0, 0, 0], jc, jc.clone().multiplyScalar(0.7), 1, 0); }
    { const z = 2.75 * l, jc = JW[(N.i + 1) % 3]; add(ball, [0, wAt(z)[1] + 0.05, z], [0.21, 0.13, 0.26], [0.2, 0, 0], jc, jc.clone().multiplyScalar(0.8), 1, 0); }
    if (hs.crest) for (let b = 0; b < 6; b++) { const z = (-0.5 + b * 0.42) * l; add(cone, [0, wAt(Math.max(-0.69 * l, z))[1] + 0.22, z], [0.1, 0.5 - 0.04 * b, 0.16], [-0.5, 0, 0], N.band, none, 0, 0, [0.5, 0]); }
    if (N.spec.from === 't') for (const s of [-1, 1]) add(cone, [s * ew * 0.62, eh + 0.3, ez - 0.75], [0.14, 0.75, 0.18], [-0.75, 0, -s * 0.35], N.band, N.gem, 0, 0, [0.5, 0]);      // the Old One's two horns
    // the tongue: a forked ribbon, lying along +z from its root (0 to 1), both faces
    {
      const b0 = rest.length / 3, red = new THREE.Color('#c81e30'), glow = new THREE.Color('#40060a'), pts = [[-0.09, 0], [0.09, 0], [-0.07, 0.68], [0.07, 0.68], [-0.2, 1], [-0.11, 0.98], [0.11, 0.98], [0.2, 1], [0, 0.72]];
      for (const ny of [1, -1]) for (const [x, z] of pts) push(x, 0, z, 0, ny, 0, 0.5, 0, red, glow, 1, 2);
      const tri = [0, 2, 1, 1, 2, 3, 2, 4, 5, 2, 5, 8, 3, 8, 6, 3, 6, 7, 2, 8, 3];
      for (let i = 0; i < tri.length; i += 3) { A.idx.push(h0 + b0 + tri[i], h0 + b0 + tri[i + 1], h0 + b0 + tri[i + 2]); A.idx.push(h0 + b0 + 9 + tri[i], h0 + b0 + 9 + tri[i + 2], h0 + b0 + 9 + tri[i + 1]); }
    }
    N.h0 = h0; N.hn = rest.length / 3; N.rest = new Float32Array(rest); N.rnor = new Float32Array(rnor); N.part = new Uint8Array(part);
    N.hinge = [-0.2, 0.7 * l]; N.tongueAt = [-0.24, 1.9 * l]; N.headLen = 4.48 * l;
  },

  // ---------------------------------------------------------------- the curve of a neck
  // The trunk's own line, at height h: an upright column with a slow S in it, leaning a little towards the hero, swaying.
  axis(h, T, o) {
    const k = h / 0.6, e = Math.min(1, h * 4);
    o[0] = ROOT.u + 0.045 * Math.sin(h * 5.2 + 0.4) * e - 0.07 * h + (0.03 * Math.sin(T * 0.9) + 0.012 * Math.sin(T * 1.7 + 1.3)) * k * Math.sqrt(k);
    o[1] = h;
    o[2] = ROOT.o + 0.03 * Math.sin(h * 4.1 + 2.0) * e + 0.05 * h + 0.016 * Math.sin(T * 0.7 + 0.5) * k * Math.sqrt(k);
    return o;
  },
  // The lower part of a neck's way, at height h: up the trunk, or up out of its own rock, leaning the way it will go.
  low(N, h, T, o) {
    const sp = N.spec; if (sp.from !== 'f') return this.axis(h, T, o);
    o[0] = sp.root[0] + (N.E[0] - sp.root[0]) * 0.1 * h / sp.b; o[1] = h; o[2] = sp.root[1] + (N.E[2] - sp.root[1]) * 0.1 * h / sp.b; return o;
  },
  // Fill N.sp with NS points along the neck's curve, from its root to the end of the neck N.E, arriving along N.F;
  // N.cum is the length so far. The lower part runs up the trunk (or straight up out of the rock); the upper is a
  // Hermite curve that leaves along the trunk and arrives along the way the head faces, with a wave running up it.
  curve(N, T) {
    const sp = N.spec, P = N.sp, cum = N.cum, a = this._a || (this._a = [0, 0, 0]), b = this._b || (this._b = [0, 0, 0]);
    const B0 = this._B0 || (this._B0 = [0, 0, 0]), D0 = this._D0 || (this._D0 = [0, 0, 0]);
    const bh = sp.b;
    this.low(N, bh, T, B0); this.low(N, bh - 0.03, T, a);
    let dx = B0[0] - a[0], dy = B0[1] - a[1], dz = B0[2] - a[2], dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
    const ex = N.E[0] - B0[0], ey = N.E[1] - B0[1], ez = N.E[2] - B0[2], dist = Math.hypot(ex, ey, ez) || 1;
    if (sp.from === 'b') {                       // a branch leaves the trunk outwards, towards where it is going
      const hl = Math.hypot(ex, ez) || 1; dx = dx * 0.55 + ex / hl * 0.75; dy = dy * 0.55 + 0.25; dz = dz * 0.55 + ez / hl * 0.75; dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
    }
    const m0 = dist * sp.m[0], m1 = dist * sp.m[1], F = N.F;
    // the side the wave swings to: across the way it goes, level
    let sx = ez, sz = -ex; const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
    const nl = Math.max(3, Math.min(NS - 12, Math.round(NS * bh / (bh + dist * 1.25)))), wv = (sp.from === 't' ? 0.03 : 0.08) * Math.min(1, dist * 1.5), wk = 1.25, ww = sp.sw[1], wp = sp.sw[2];
    for (let i = 0; i < NS; i++) {
      let x, y, z;
      if (i < nl) { this.low(N, bh * i / nl, T, b); x = b[0]; y = b[1]; z = b[2]; }
      else {
        const q = (i - nl) / (NS - 1 - nl), q2 = q * q, q3 = q2 * q, h00 = 2 * q3 - 3 * q2 + 1, h10 = q3 - 2 * q2 + q, h01 = -2 * q3 + 3 * q2, h11 = q3 - q2;
        const env = Math.sin(Math.PI * q), wave = wv * Math.sin(wk * TAU * q - ww * T + wp) * env, lift = 0.8 * wv * Math.sin(wk * TAU * q - ww * T + wp + 1.4) * env;
        x = h00 * B0[0] + h10 * m0 * dx + h01 * N.E[0] + h11 * m1 * F[0] + sx * wave;
        y = h00 * B0[1] + h10 * m0 * dy + h01 * N.E[1] + h11 * m1 * F[1] + lift;
        z = h00 * B0[2] + h10 * m0 * dz + h01 * N.E[2] + h11 * m1 * F[2] + sz * wave;
      }
      P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
      cum[i] = i ? cum[i - 1] + Math.hypot(x - P[i * 3 - 3], y - P[i * 3 - 2], z - P[i * 3 - 1]) : 0;
    }
    N.lowLen = cum[nl];
    return cum[NS - 1];
  },
  restLength(N) {
    const sp = N.spec; N.E[0] = sp.E[0]; N.E[1] = sp.E[1]; N.E[2] = sp.E[2];
    const d = [THINGS[0] - sp.E[0], THINGS[1] - sp.E[1], THINGS[2] - sp.E[2]], l = Math.hypot(...d); N.F[0] = d[0] / l; N.F[1] = d[1] / l; N.F[2] = d[2] / l;
    return this.curve(N, 0);
  },

  // Lay neck N along its curve (grown g of the way out, swollen to `bud` of its size) and write its rings and its head.
  lay(N, T, g, bud) {
    const sp = N.spec, pos = this.pos, nor = this.nor, f = this.fr, V = S + 1;
    const hide = g <= 0.001 || bud <= 0.001;
    if (hide) { if (N.hidden) return; N.hidden = true; pos.fill(0, N.v0 * 3, (N.h0 + N.hn) * 3); const p = this.hydraPark; for (let i = N.v0; i < N.h0 + N.hn; i++) { pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2]; } return; }
    N.hidden = false;
    const Lp = this.curve(N, T), P = N.sp, cum = N.cum, rp = N.rp, rt = N.rt, rn = N.rn, rr = N.rr;
    // the head's place along the curve: a branch starts just inside the trunk, the others inside the rock
    const a0 = sp.from === 'b' ? N.lowLen - 0.03 : 0.01, aH = lerp(a0, Lp, g);
    let seg = 0;
    for (let j = 0; j < R; j++) {
      const d = (1 - j / (R - 1)) * N.len; let a = aH - d, r;
      if (a <= 0) { a = 0; r = 0; }
      else {
        const along = 1 - d / N.len;                             // 0 at the tail, 1 at the head
        r = lerp(sp.r0, sp.r1, sstep(along, sp.from === 't' ? 0.45 : 0.0, sp.from === 't' ? 0.8 : 0.6)) * bud * Math.min(1, a / 0.03 + 0.25);
      }
      while (seg < NS - 2 && cum[seg + 1] < a) seg++;
      const k = clamp01((a - cum[seg]) / Math.max(1e-6, cum[seg + 1] - cum[seg])), o = seg * 3;
      rp[j * 3] = P[o] + (P[o + 3] - P[o]) * k; rp[j * 3 + 1] = P[o + 1] + (P[o + 4] - P[o + 1]) * k; rp[j * 3 + 2] = P[o + 2] + (P[o + 5] - P[o + 2]) * k; rr[j] = r;
    }
    // tangents: across the neighbours (the buried rings take the first one out)
    for (let j = R - 1; j >= 0; j--) {
      const a = Math.max(0, j - 1) * 3, b = Math.min(R - 1, j + 1) * 3; let x = rp[b] - rp[a], y = rp[b + 1] - rp[a + 1], z = rp[b + 2] - rp[a + 2]; const l = Math.hypot(x, y, z);
      if (l < 1e-5) { x = j < R - 1 ? rt[j * 3 + 3] : 0; y = j < R - 1 ? rt[j * 3 + 4] : 1; z = j < R - 1 ? rt[j * 3 + 5] : 0; } else { x /= l; y /= l; z /= l; }
      rt[j * 3] = x; rt[j * 3 + 1] = y; rt[j * 3 + 2] = z;
    }
    // the belly's side, carried up the neck without twisting: at the root it faces the way the neck is going
    let nx = N.E[0] - P[0], ny = 0, nz = N.E[2] - P[2] + 0.001;
    if (sp.from === 't') { nx = -0.9; nz = 0.45; }
    for (let j = 0; j < R; j++) {
      const tx = rt[j * 3], ty = rt[j * 3 + 1], tz = rt[j * 3 + 2], d = nx * tx + ny * ty + nz * tz; nx -= tx * d; ny -= ty * d; nz -= tz * d;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; rn[j * 3] = nx; rn[j * 3 + 1] = ny; rn[j * 3 + 2] = nz;
    }
    // the head held level: whatever roll is left at the end is taken out over the top half of the neck (and its own tilt put in)
    {
      const e = (R - 1) * 3, tx = rt[e], ty = rt[e + 1], tz = rt[e + 2]; let twist = N.tilt;
      if (Math.abs(ty) < 0.96) {
        const ux = -rn[e], uy = -rn[e + 1], uz = -rn[e + 2], dy = 1 - ty * ty, wx = -tx * ty / Math.sqrt(dy), wy = Math.sqrt(dy), wz = -tz * ty / Math.sqrt(dy);        // up, squared to the tangent
        const cx = uy * wz - uz * wy, cy = uz * wx - ux * wz, cz = ux * wy - uy * wx;
        twist += Math.atan2(cx * tx + cy * ty + cz * tz, ux * wx + uy * wy + uz * wz) * (1 - sstep(Math.abs(ty), 0.8, 0.96));
      }
      if (Math.abs(twist) > 1e-4) for (let j = Math.floor(R / 2); j < R; j++) {
        const a = twist * sstep(j, R / 2, R - 3), c = Math.cos(a), s = Math.sin(a), o = j * 3, tx2 = rt[o], ty2 = rt[o + 1], tz2 = rt[o + 2], x = rn[o], y = rn[o + 1], z = rn[o + 2];
        rn[o] = x * c + (ty2 * z - tz2 * y) * s; rn[o + 1] = y * c + (tz2 * x - tx2 * z) * s; rn[o + 2] = z * c + (tx2 * y - ty2 * x) * s;
      }
    }
    // the rings
    const hood = sp.hood || 0;
    let w = N.v0 * 3;
    for (let j = 0; j < R; j++) {
      const o = j * 3, px = rp[o], py = rp[o + 1], pz = rp[o + 2], tx = rt[o], ty = rt[o + 1], tz = rt[o + 2], bx = rn[o], by = rn[o + 1], bz = rn[o + 2];
      const sx = ty * bz - tz * by, sy = tz * bx - tx * bz, sz = tx * by - ty * bx, r = rr[j];
      // (the Old One's hood: the neck spread wide and thin below the head)
      const d = (1 - j / (R - 1)) * N.len, hk = hood ? hood * Math.exp(-Math.pow((d - 0.13) / 0.085, 2)) : 0, rs = r * (1 + 1.5 * hk), rb = r * (1 - 0.35 * hk);
      for (let k = 0; k < V; k++) {
        const ph = k / S * TAU, c = Math.cos(ph), s = Math.sin(ph);
        const lx = px + bx * c * rb + sx * s * rs, ly = py + by * c * rb + sy * s * rs, lz = pz + bz * c * rb + sz * s * rs;
        let qx = bx * c * rs + sx * s * rb, qy = by * c * rs + sy * s * rb, qz = bz * c * rs + sz * s * rb; const ql = Math.hypot(qx, qy, qz) || 1; qx /= ql; qy /= ql; qz /= ql;
        pos[w] = f.ox + f.tx * lx + f.nx * lz; pos[w + 1] = f.oy + ly; pos[w + 2] = f.oz + f.tz * lx + f.nz * lz;
        nor[w] = f.tx * qx + f.nx * qz; nor[w + 1] = qy; nor[w + 2] = f.tz * qx + f.nz * qz; w += 3;
      }
    }
    // the head, on the end of it: z along the neck, y away from the belly
    {
      const o = (R - 1) * 3, px = rp[o], py = rp[o + 1], pz = rp[o + 2], zx = rt[o], zy = rt[o + 1], zz = rt[o + 2], yx = -rn[o], yy = -rn[o + 1], yz = -rn[o + 2];
      const xx = yy * zz - yz * zy, xy = yz * zx - yx * zz, xz = yx * zy - yy * zx, sc = sp.r1 * bud * Math.min(1, (aH - a0) / 0.05 + 0.3);
      const rest = N.rest, rnor = N.rnor, part = N.part, jc = Math.cos(N.jaw), js = Math.sin(N.jaw), hy = N.hinge[0], hz = N.hinge[1], tg = N.tongue, ty0 = N.tongueAt[0], tz0 = N.tongueAt[1];
      const tw = this.calm ? 0 : 0.25 * Math.sin(T * 31 + N.i);
      for (let i = 0; i < N.hn; i++) {
        let x = rest[i * 3], y = rest[i * 3 + 1], z = rest[i * 3 + 2], ax = rnor[i * 3], ay = rnor[i * 3 + 1], az = rnor[i * 3 + 2];
        const pt = part[i];
        if (pt === 1) { const dy = y - hy, dz = z - hz; y = hy + dy * jc - dz * js; z = hz + dy * js + dz * jc; const n1 = ay * jc - az * js; az = ay * js + az * jc; ay = n1; }
        else if (pt === 2) { y = ty0 - js * 0.5 + tw * z * z * 0.5 * tg; x *= 1 + 0.4 * tg; z = tz0 + z * tg * 3.4 - 0.3; if (tg < 0.02) { x = 0; z = tz0; } }
        const lx = px + (xx * x + yx * y + zx * z) * sc, ly = py + (xy * x + yy * y + zy * z) * sc, lz = pz + (xz * x + yz * y + zz * z) * sc;
        const qx = xx * ax + yx * ay + zx * az, qy = xy * ax + yy * ay + zy * az, qz = xz * ax + yz * ay + zz * az;
        pos[w] = f.ox + f.tx * lx + f.nx * lz; pos[w + 1] = f.oy + ly; pos[w + 2] = f.oz + f.tz * lx + f.nz * lz;
        nor[w] = f.tx * qx + f.nx * qz; nor[w + 1] = qy; nor[w + 2] = f.tz * qx + f.nz * qz; w += 3;
      }
      // where its snout is (for the others to look at, and the jewels to fly from)
      N.tip = N.tip || [0, 0, 0]; N.tip[0] = px + zx * N.headLen * sc * 0.6; N.tip[1] = py + zy * N.headLen * sc * 0.6; N.tip[2] = pz + zz * N.headLen * sc * 0.6;
    }
  },

  // ---------------------------------------------------------------- the rocks, and his arms laid ready: one rig
  // No figure: the hero is the things he carries in the picture, laid on his rock: the lion's skin, his red cloak, the
  // quiver and the bow, and the club.
  buildRig(L, col, V3) {
    const rig = this.rig = L.rig(16, 70000, L.paint({ glow: 0.32, rough: 0.8, side: THREE.DoubleSide }));
    const own = (g, c) => {
      g = g.index ? g.toNonIndexed() : g;
      for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n);
      const a = new Float32Array(g.attributes.position.count * 3), cc = new THREE.Color(c);
      for (let i = 0; i < a.length; i += 3) { a[i] = cc.r; a[i + 1] = cc.g; a[i + 2] = cc.b; }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
    };
    const ell = (C, Rr, c, detail = 2, rx = 0, ry = 0, rz = 0) => shape.move(shape.ball(1, c, detail), C[0], C[1], C[2], rx, ry, rz, Rr[0], Rr[1], Rr[2]);
    const limb = (a, b, r0, r1, c, seg = 12, rings = 4) => {
      const Av = V3(...a), Bv = V3(...b), len = Av.distanceTo(Bv), g = own(new THREE.CylinderGeometry(r1, r0, len, seg, rings), c);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), Bv.clone().sub(Av).normalize()));
      const m = Av.clone().add(Bv).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return g;
    };
    // Paint a form smoothly from its normals, as he models a form: a cool pale light from high on the left, a warm
    // half-shade, a brown shade beneath (never facet by facet).
    const KEY = V3(-0.35, 0.75, 0.55).normalize(), nn = V3(), cc = new THREE.Color();
    const model = (g, lo, mid, hi, bias = 0) => {
      const n = g.attributes.normal, c = g.attributes.color;
      for (let i = 0; i < n.count; i++) { nn.fromBufferAttribute(n, i); const k = nn.dot(KEY) + bias; if (k < 0.1) cc.copy(lo).lerp(mid, sstep(k, -0.7, 0.1)); else cc.copy(mid).lerp(hi, sstep(k, 0.1, 0.85)); c.setXYZ(i, cc.r, cc.g, cc.b); }
      return g;
    };
    const blue = [col('#1e3550', 0.15), col('#3f6e9a', 0.15), col('#8fb6d0', 0.15)], red = [col('#5a1410', 0.15), col('#b02c1c', 0.15), col('#e2603a', 0.15)];
    const gold = [col('#6e4a18', 0.1), col('#c89a34', 0.1), col('#f4d878', 0.1)], wood = [col('#3a2616', 0.15), col('#7a5630', 0.15), col('#b89258', 0.15)];
    const hair = [col('#1c120c', 0.1), col('#3c2616', 0.1), col('#6a4a2a', 0.1)], leaf = [col('#2a3a1e', 0.15), col('#5a6e32', 0.15), col('#a8a850', 0.15)], lion = [col('#6a4420', 0.15), col('#b48a48', 0.15), col('#dcbc7c', 0.15)];
    const bead = (p, r, c) => ell(p, [r, r, r], c, 1);
    // One smooth skin over a run of oval rings [y, half width, half depth, z of its middle, x of its middle]: a body or a
    // limb as he draws it, with no joints showing.
    const tube = (rings, seg = 18) => {
      const pos = [], idx = [], n = rings.length;
      for (const [y, rx, rz, zc = 0, xc = 0] of rings) for (let k = 0; k <= seg; k++) { const a = k / seg * TAU; pos.push(xc + Math.sin(a) * rx, y, zc + Math.cos(a) * rz); }
      for (let i = 0; i < n - 1; i++) for (let k = 0; k < seg; k++) { const a = i * (seg + 1) + k, b = a + seg + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const nr = g.attributes.normal;      // (the seam's two edges share one normal)
      for (let i = 0; i < n; i++) { const a = i * (seg + 1), b = a + seg, x = nr.getX(a) + nr.getX(b), y = nr.getY(a) + nr.getY(b), z = nr.getZ(a) + nr.getZ(b), l = Math.hypot(x, y, z) || 1; nr.setXYZ(a, x / l, y / l, z / l); nr.setXYZ(b, x / l, y / l, z / l); }
      return own(g, 0xffffff);
    };
    // Short strokes of paint lying on a form: list of { p, n, c, lit, a (its turn), l, w }.
    const strokesOn = list => {
      const pos = [], nor = [], cl = [], side = V3(), up = V3(), rim = Array.from({ length: 6 }, () => V3());
      for (const d of list) {
        side.crossVectors(d.n, Math.abs(d.n.y) < 0.9 ? up.set(0, 1, 0) : up.set(1, 0, 0)).normalize(); up.crossVectors(side, d.n).normalize();
        const ca = Math.cos(d.a), sa = Math.sin(d.a);
        for (let m = 0; m < 6; m++) { const a = m / 6 * TAU, ex = Math.cos(a) * d.l / 2, ey = Math.sin(a) * d.w / 2; rim[m].copy(d.p).addScaledVector(side, ex * ca - ey * sa).addScaledVector(up, ex * sa + ey * ca).addScaledVector(d.n, -0.002); }
        for (let m = 0; m < 6; m++) for (const [pt, c2] of [[d.p, d.lit], [rim[m], d.c], [rim[(m + 1) % 6], d.c]]) { pos.push(pt.x, pt.y, pt.z); nor.push(d.n.x, d.n.y, d.n.z); cl.push(c2.r, c2.g, c2.b); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
      return g;
    };
    {
      // the lion's skin, heaped over his rock: tawny, soft, in folds, the four paws lying out on the ground, the mane
      // at the end away from the Hydra; and his red cloak lying out from under it, its hem beaded with gold
      const NR = 12, NT = 40, pos = [], idx = [], edge = th => 0.84 + 0.34 * Math.pow(Math.abs(Math.cos(2 * (th - Math.PI / 4))), 7) + 0.04 * Math.sin(th * 7 + 1);
      const at = (rho, th, o) => {
        const r = rho * edge(th), rr = Math.min(1, r / 0.9), fold = 0.014 * Math.sin(th * 6 + 4 * rho) * rr * rr + 0.008 * Math.sin(th * 11 + 2) * rr;
        return o.set(r * Math.cos(th) * 0.21, 0.01 + 0.15 * Math.pow(1 - rr * rr, 0.62) + fold * (1 - rr * 0.6), r * Math.sin(th) * 0.165 + 0.01);
      };
      const v = V3(), v2 = V3(), v3 = V3();
      for (let i = 0; i <= NR; i++) for (let k = 0; k <= NT; k++) { at(i / NR, k / NT * TAU, v); pos.push(v.x, v.y, v.z); }
      for (let i = 0; i < NR; i++) for (let k = 0; k < NT; k++) { const a = i * (NT + 1) + k, b = a + NT + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const upward = g => { g.computeVertexNormals(); const n = g.attributes.normal; let sy = 0; for (let i = 0; i < n.count; i++) sy += n.getY(i); if (sy < 0) for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i)); return g; };
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); upward(g);
      const parts = [model(own(g, 0xffffff), ...lion, 0.12)];
      // its fur: many small strokes down the fall of it, close in tone, lighter where the light lies
      const fur = [], down = V3();
      for (let j = 0; j < 300; j++) {
        const rho = 0.1 + 0.9 * Math.sqrt(L.rand()), th = L.rand() * TAU; at(rho, th, v); at(rho + 0.03, th, v2); at(rho, th + 0.05, v3);
        const n = v2.clone().sub(v).cross(v3.clone().sub(v)).normalize(); if (n.y < 0) n.negate();
        const k = n.dot(KEY) + (L.rand() - 0.5) * 0.35, c = (k > 0.55 ? lion[2] : k > 0.1 ? lion[1] : lion[0]).clone().lerp(lion[1], 0.5);
        // (laid along the way the skin falls: the stroke's own long side turned to it)
        down.copy(v2).sub(v).normalize(); const sd = V3().crossVectors(n, Math.abs(n.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0)).normalize(), upv = V3().crossVectors(sd, n);
        fur.push({ p: v.clone().addScaledVector(n, 0.003), n, c, lit: c.clone().lerp(lion[2], 0.22), a: Math.atan2(down.dot(upv), down.dot(sd)) + (L.rand() - 0.5) * 0.5, l: 0.02 + 0.014 * L.rand(), w: 0.006 + 0.004 * L.rand() });
      }
      const mane = [col('#2a1a0e', 0.15), col('#5a3a1a', 0.15), col('#8a6632', 0.15)], MC = [-0.17, 0.07, 0.03], MR = [0.062, 0.058, 0.075];
      parts.push(model(ell(MC, MR, 0xffffff, 3), ...mane));
      for (let j = 0; j < 90; j++) {
        const y = 1 - 1.4 * L.rand(), ph = L.rand() * TAU, sq = Math.sqrt(Math.max(0, 1 - y * y)), n = V3(sq * Math.cos(ph), y, sq * Math.sin(ph));
        const c = mane[n.dot(KEY) > 0.3 ? 2 : n.dot(KEY) > -0.1 ? 1 : 0].clone().lerp(mane[1], 0.5);
        fur.push({ p: V3(MC[0] + n.x * MR[0] * 1.04, MC[1] + n.y * MR[1] * 1.04, MC[2] + n.z * MR[2] * 1.04), n, c, lit: c.clone().lerp(mane[2], 0.25), a: L.rand() * TAU, l: 0.03 + 0.018 * L.rand(), w: 0.008 + 0.005 * L.rand() });
      }
      parts.push(strokesOn(fur));
      // the cloak: lying out over the ground in front, in deep folds
      {
        const NU = 16, NV = 10, cp = [], ci = [];
        for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
          const sx = i / NU * 2 - 1, t = j / NV;
          cp.push(-0.03 + sx * (0.06 + 0.05 * t) + 0.03 * t, 0.012 + 0.05 * Math.pow(1 - t, 2) + 0.014 * (0.5 + 0.5 * Math.sin(sx * 9 + t * 3)) * (0.4 + 0.6 * t), 0.14 + 0.13 * t + 0.015 * Math.sin(sx * 5 + 1));
        }
        for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + NU + 1; ci.push(a, b, a + 1, a + 1, b, b + 1); }
        const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setIndex(ci); upward(cg);
        const cm = model(own(cg, 0xffffff), col('#3a0c0a', 0.15), col('#8a2016', 0.15), col('#c04428', 0.15), -0.15), cpn = cm.attributes.position, ccl = cm.attributes.color;
        for (let i = 0; i < cpn.count; i++) { const dip = 0.5 + 0.5 * Math.sin((cpn.getX(i) + 0.03) / 0.11 * 9), kf = 0.55 + 0.45 * dip; ccl.setXYZ(i, ccl.getX(i) * kf, ccl.getY(i) * kf, ccl.getZ(i) * kf); }      // (dark in the folds)
        parts.push(cm);
        for (let i = 0; i <= 9; i++) { const sx = i / 9 * 2 - 1; parts.push(bead([sx * 0.11, 0.018 + 0.014 * (0.5 + 0.5 * Math.sin(sx * 9 + 3)), 0.272 + 0.015 * Math.sin(sx * 5 + 1)], 0.0046, gold[2])); }
      }
      this.gSkin = rig.geo(shape.merge(parts));
    }
    {
      // the club: a knotted branch, heavy at the end; it stands on its head with the grip up, as he rests it in the picture
      const club = tube([[-0.5, 0.004, 0.004], [-0.492, 0.027, 0.026], [-0.45, 0.037, 0.035, 0.003], [-0.39, 0.036, 0.037, -0.002, 0.003], [-0.3, 0.03, 0.029, 0.003], [-0.2, 0.022, 0.023, 0, -0.002], [-0.1, 0.0165, 0.016, 0.002], [-0.02, 0.013, 0.013], [0.03, 0.0135, 0.0135], [0.036, 0.003, 0.003]], 12);
      const cl = [model(club, ...wood)];
      for (const [a, y] of [[0.3, -0.42], [2.2, -0.36], [4.1, -0.45], [5.2, -0.3]]) cl.push(model(ell([Math.cos(a) * 0.032, y, Math.sin(a) * 0.032], [0.012, 0.015, 0.012], 0xffffff, 2), ...wood));
      this.gClub = rig.geo(shape.move(shape.merge(cl), 0, 0.5 * 0.72, 0, 0, 0, 0, 0.72));
      // the bow: gold, strung, standing on its tip
      const pts = []; for (let i = 0; i <= 16; i++) { const y = -0.2 + 0.4 * i / 16, k = y / 0.2; pts.push(V3(0, y, 0.062 * (1 - k * k) - 0.012 * Math.cos(k * 6))); }
      const bow = model(own(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.0058, 8, false), 0xffffff), ...gold);
      const str = own(new THREE.CylinderGeometry(0.0013, 0.0013, 0.4, 5), col('#e8dcc0', 0.1));
      const grip = model(own(new THREE.CylinderGeometry(0.0085, 0.0085, 0.05, 8), 0xffffff), ...blue); shape.move(grip, 0, 0, 0.05);
      this.gBow = rig.geo(shape.move(shape.merge([bow, str, grip]), 0, 0.2 * 0.66, 0, 0, 0, 0, 0.66));
      // the quiver: blue, banded with gold, the arrows' red feathers showing
      const qv = [model(tube([[0, 0.004, 0.004], [0.004, 0.02, 0.02], [0.08, 0.023, 0.023], [0.17, 0.026, 0.026], [0.176, 0.02, 0.02]], 12), ...blue)];
      for (const y of [0.03, 0.1, 0.165]) qv.push(model(tube([[y - 0.006, 0.0235 + y * 0.03, 0.0235 + y * 0.03], [y, 0.026 + y * 0.03, 0.026 + y * 0.03], [y + 0.006, 0.0235 + y * 0.03, 0.0235 + y * 0.03]], 12), ...gold));
      for (const [x, z, t] of [[0.008, 0.004, 0.05], [-0.009, 0.006, 0.065], [0.0, -0.01, 0.042], [-0.004, 0.012, 0.03]]) {
        qv.push(model(limb([x, 0.16, z], [x * 1.6, 0.2 + t, z * 1.6], 0.0022, 0.0022, 0xffffff, 5, 1), ...wood));
        qv.push(model(ell([x * 1.6, 0.19 + t, z * 1.6], [0.0085, 0.02, 0.003], 0xffffff, 1, 0, x * 60), ...red));
      }
      this.gQuiver = rig.geo(shape.merge(qv));
    }
    // the rocks of his gorge: a smooth dark body, craggy, glazed umber and blue-black, under a shell of his dabs (ochre
    // and grey where the light catches, a touch of red earth)
    {
      const lo = col('#16110d', 0.2), mid = col('#33271c', 0.2), hi = col('#6c5a40', 0.2), cool = col('#2c3840', 0.2);
      const tones = [['#4a3a28', 3], ['#5e4c34', 2], ['#7a6848', 1.2], ['#3a444a', 1.6], ['#55606a', 0.6], ['#6a3020', 0.5], ['#2a2018', 3]].map(([c, w]) => [col(c, 0.2), w]);
      const tot = tones.reduce((n, t) => n + t[1], 0), pick = r => { r *= tot; for (const t of tones) if ((r -= t[1]) <= 0) return t[0]; return tones[0][0]; };
      const side = V3(), up = V3(), cen = V3(), q = V3(), dn = V3();
      this.gRock = ROCKS.map((rk, ri) => {
        const sd = ri * 2.1 + 0.7;
        // (a lump with ledges and a broken top, never a ball: ridges across it, and a peak off to one side)
        const def = (x, y, z, o) => {
          const k = 1 + 0.16 * Math.sin(x * 3.1 + z * 2.3 + sd) + 0.1 * Math.abs(Math.sin(y * 4 + x * 3.2 + sd * 2)) + 0.07 * Math.sin(z * 8 + y * 6 + sd), peak = 1 + 0.5 * Math.max(0, y) * (0.5 + 0.5 * Math.sin(x * 3.4 + z * 1.7 + sd));
          return o.set(x * k, Math.max(-0.12, y) * k * peak + 0.12, z * k);
        };
        const g = shape.ball(1, 0xffffff, 3), p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
        for (let i = 0; i < p.count; i++) { def(p.getX(i), p.getY(i), p.getZ(i), q); p.setXYZ(i, q.x, q.y, q.z); }
        for (let i = 0; i < p.count; i++) {
          nn.set(p.getX(i), (p.getY(i) - 0.12) * 1.2, p.getZ(i)).normalize(); n.setXYZ(i, nn.x, nn.y, nn.z);
          const k = nn.dot(KEY), x = p.getX(i), y = p.getY(i), z = p.getZ(i);
          cc.copy(lo).lerp(mid, sstep(k, -0.5, 0.5)).lerp(cool, 0.4 * sstep(Math.sin(x * 5 + z * 6 + sd), 0.2, 0.9) * sstep(k, 0.4, -0.3));
          c.setXYZ(i, cc.r, cc.g, cc.b);
        }
        // the dabs: short strokes lying on it, mostly where the light falls
        const pos = [], nor = [], cl = [], rim = Array.from({ length: 6 }, () => V3());
        for (let j = 0; j < 130; j++) {
          let x, y, z; do { x = L.rand() * 2 - 1; y = L.rand() * 1.2 - 0.2; z = L.rand() * 2 - 1; } while (x * x + y * y + z * z > 1 || x * x + y * y + z * z < 0.1);
          const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l; dn.set(x, y * 1.2, z).normalize();
          const k = dn.dot(KEY) + (L.rand() - 0.5) * 0.5; if (k < -0.25 && L.rand() < 0.7) continue;
          const tone = k > 0.5 ? (L.rand() < 0.4 ? hi : pick(L.rand())) : pick(L.rand()), dark = cc.copy(tone).lerp(mid, 0.45).multiplyScalar(k > 0.1 ? 1 : 0.55).clone(), lit = dark.clone().lerp(hi, 0.18);
          def(x, y, z, cen); cen.addScaledVector(dn, 0.02);
          side.crossVectors(dn, Math.abs(dn.y) < 0.9 ? up.set(0, 1, 0) : up.set(1, 0, 0)).normalize(); up.crossVectors(side, dn).normalize();
          const a0 = (L.rand() - 0.5) * 1.2, len = 0.34 + 0.3 * L.rand(), wid = 0.17 + 0.12 * L.rand(), ca = Math.cos(a0), sa = Math.sin(a0);
          for (let m = 0; m < 6; m++) { const a = m / 6 * TAU, ex = Math.cos(a) * len / 2, ey = Math.sin(a) * wid / 2; rim[m].copy(cen).addScaledVector(side, ex * ca - ey * sa).addScaledVector(up, ex * sa + ey * ca).addScaledVector(dn, -0.03); }
          for (let m = 0; m < 6; m++) for (const [pt, col2] of [[cen, lit], [rim[m], dark], [rim[(m + 1) % 6], dark]]) { pos.push(pt.x, pt.y, pt.z); nor.push(dn.x, dn.y, dn.z); cl.push(col2.r, col2.g, col2.b); }
        }
        const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); dg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); dg.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
        return rig.geo(shape.merge([g, dg]));
      });
    }

    const add = g => { const i = rig.add(g); rig.show(i, false); return i; };
    this.iRock = this.gRock.map(add);
    this.iSkin = add(this.gSkin); this.iClub = add(this.gClub); this.iBow = add(this.gBow); this.iQuiver = add(this.gQuiver);
    this.things = [this.iSkin, this.iClub, this.iBow, this.iQuiver];
    this.hydraPark = L.floor(ROOT.u, ROOT.o, new THREE.Vector3()).toArray(); this.hydraPark[1] += 0.05;
  },

  // ---------------------------------------------------------------- the show
  start(L, resumed) {
    this.calm = !!(L.k.museum && L.k.museum.calm);
    this.lastT = resumed ? this.tc : -1; if (!resumed) { this.tc = 0; this.toyK = 0; for (const N of this.H) N.watch = 0; }
    // (the first sound comes in slowly: a breath, and a low note under it)
    if (!L.quiet && !resumed) { const v = L.voice(), k = this.calm ? 0.5 : 1; noise(v, 0.05, { d: 2.0, vol: 0.01 * k, hp: 5200, attack: this.calm ? 1.2 : 0.7 }); v.note(55, 2.0, { vol: 0.026 * k, type: 'sine', attack: this.calm ? 1.0 : 0.6 }); }
  },
  back(L) { this.spread0 = this.gu.uSpread.value; this.dawn0 = this.gu.uDawn.value.z; },
  end(L) { this.hideAll(L); },
  reset(L) { this.hideAll(L); this.tc = 0; },
  hideAll(L) {
    for (const i of [...this.things, ...this.iRock]) this.rig.show(i, false);
    this.ground.visible = false; this.gu.uSpread.value = 0; this.gu.uDawn.value.z = 0; this.hydra.visible = false;
  },

  // A hiss with a note in it: the breath through a narrow band at hz, a little air above it, and the note itself, faint.
  // It always comes in softly (slower and quieter still with motion reduced).
  hiss(L, hz, k = 1, d = 1.0, at = 0) {
    const v = L.voice(), c = this.calm; if (c) { k *= 0.6; d *= 1.3; }
    noise(v, at, { d, vol: 0.34 * k, bp: hz, q: 15, attack: c ? 0.4 : 0.16 }); noise(v, at, { d: d * 0.8, vol: 0.011 * k, hp: 6000, attack: c ? 0.35 : 0.14 });
    v.note(hz / 2, d * 0.9, { at, vol: 0.006 * k, type: 'sine', attack: c ? 0.4 : 0.18 });
  },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', linger = ph === 'linger', ret = ph === 'return';
    const calm = this.calm, slow = calm ? 0.6 : 1;                 // (motion reduced: the whole show at six tenths of its speed)
    if (showing) this.tc = L.t * slow; else if (linger) this.tc += dt * slow;
    const T = this.tc, R0 = ret ? L.ret : 0, quiet = L.quiet || this.lastT < 0 || !(showing || linger);
    const crossed = t => !quiet && this.lastT < t && T >= t;
    this.uT.value = T; this.uTw.value = calm ? 0 : 1;
    // ---- the ground, and his sun coming up over the foot of the wall
    const spread = ret ? (this.spread0 || 0) * (1 - ease.inOut(ramp(R0, 0.55, 1))) : ease.out(ramp(T, 0.05, 1.8));
    this.gu.uSpread.value = spread; this.ground.visible = spread > 0.002;
    const dawn = this.gu.uDawn.value; dawn.y = 0.2 + 0.2 * ease.inOut(ramp(T, 1.2, 8)) - (ret ? 0.14 * ease.in(R0) : 0);
    dawn.z = ret ? (this.dawn0 || 0) * (1 - ease.inOut(ramp(R0, 0.1, 0.7))) : ease.inOut(ramp(T, 1.0, 3.4));
    // ---- the rocks, up first, down last
    const rig = this.rig, rk = ret ? 1 - ease.inOut(ramp(R0, 0.8, 1)) : 1;
    ROCKS.forEach(([u, o, w, h, d, turn], i) => {
      const k = ease.outBack(ramp(T, 0.05 + i * 0.07, 0.6 + i * 0.07)) * rk; rig.show(this.iRock[i], k > 0.01);
      if (k > 0.01) { L.floor(u, o, this.v); this.w.set(w * k, h * k, d * k); rig.put(this.iRock[i], this.v.x, this.v.y - 0.01, this.v.z, L.yawOut + turn, 0, 0, this.w); }
    });
    // ---- the toy (it is there to be noticed once the look is over)
    const veh = L.k.G.vehicle, toy = this.toy;
    toy.on = (linger || ret) && veh && veh.group.visible && Math.abs(veh.pos.y - L.y) < 0.5;
    if (toy.on) { const q = L.local(veh.pos.x, veh.pos.z); toy.u = q.u; toy.o = q.out; }
    this.toyK += ((toy.on && linger ? 1 : 0) - this.toyK) * Math.min(1, dt * 2.5);
    // ---- the main moment, and again every so often while you stay: one head leans slowly down to look, the bowstring
    // sings, and they all draw back together
    const n = Math.max(0, Math.floor((T - (T_LEAN - 3)) / EVERY)), t0 = T_LEAN + n * EVERY, tw = t0 + LEAN, leaner = n % 2 ? BLUE : 0;
    const leanK = ease.inOut(ramp(T, t0, t0 + LEAN - 0.1)) * (1 - ease.out(ramp(T, tw, tw + (calm ? 0.5 : 0.25))));
    const recoil = hump(T, tw, tw + 1.1) * (calm ? 0.5 : 1);
    // the stillness: from the knock to the string, their swaying all but stops
    const still = n === 0 ? ease.inOut(ramp(T, T_KNOCK + 0.15, T_KNOCK + 0.8)) * (1 - ease.inOut(ramp(T, tw + 0.3, tw + 1.6))) : 0, swayK = 1 - 0.8 * still;
    // ---- the Hydra: for each neck, how far out it is, where its head is held, what it looks at, its jaw and tongue
    const H = this.H;
    for (const N of H) {
      const sp = N.spec, i = N.i, E = N.E, sw = sp.sw, see = T_KNOCK + 0.04 + 0.07 * i;
      let g = ease.smooth(ramp(T, sp.rise[0], sp.rise[0] + sp.rise[1]));
      if (ret) g *= 1 - ease.inOut(ramp(R0, sp.from === 't' ? 0.4 : 0.04 + 0.04 * i, sp.from === 't' ? 0.9 : 0.42 + 0.04 * i));
      N.g = g;
      // where the neck ends: its place and its sway (a slow cobra's weave, each in its own time)
      const rest = sp.E, a = sw[1] * T + sw[2], amp = sw[0] * swayK;
      E[0] = rest[0] + amp * Math.sin(a); E[1] = rest[1] + amp * 0.3 * Math.sin(2 * a + 1); E[2] = rest[2] + amp * 0.5 * Math.cos(a);
      if (sp.from !== 'f') { const ax = this.axis(sp.b, T, this._ax || (this._ax = [0, 0, 0])); E[0] += (ax[0] - ROOT.u) * 0.6; E[2] += (ax[2] - ROOT.o) * 0.6; }
      let jaw = 0.03 + 0.45 * hump(T, sp.rise[0] + 0.25, sp.rise[0] + 1.2), tilt = 0;
      // what it looks at: out into the room as it comes up; at his arms from the moment the club knocks
      const aim = N.aim, seeK = ease.inOut(ramp(T, see, see + 0.45));
      const wx = E[0] + (i % 2 ? 0.6 : -0.5) + 0.6 * Math.sin(T * 0.7 + i * 2.1), wy = E[1] - 0.12 + 0.2 * Math.sin(T * 0.55 + i), wz = E[2] + 1.6;
      aim[0] = lerp(wx, THINGS[0], seeK); aim[1] = lerp(wy, THINGS[1], seeK); aim[2] = lerp(wz, THINGS[2], seeK);
      jaw += 0.3 * hump(T, see, see + 0.8);
      if (i === GREY) {                          // the curious one: it has seen you, and tilts its head; it glances at the rest when they start
        const glance = hump(T, T_KNOCK, T_KNOCK + 1.3) + hump(T, tw - 0.1, tw + 1.2), k = ease.inOut(ramp(T, 1.7, 2.2)) * (1 - 0.8 * Math.min(1, glance));
        aim[0] = lerp(aim[0], CAM.u, k); aim[1] = lerp(aim[1], CAM.h - 0.1, k); aim[2] = lerp(aim[2], CAM.o, k);
        tilt = 0.4 * Math.sin(T * 1.3) * k;
      }
      if (i === OCHRE) {                         // the sleepy one: a great slow yawn in the stillness, and its head sinks
        const y = hump(T, 3.0, 3.9) + (T > 10 ? hump(((T - 10) % 11), 0, 1.4) : 0); jaw += 0.8 * y; E[1] -= 0.05 * y; tilt += 0.25 * y;
      }
      // the lean, slow, to look closer (it stops well short); and at the string's note all of them draw back
      if (i === leaner) { const k = leanK * (i ? 0.45 : 1); E[0] -= 0.3 * k; E[1] -= 0.36 * k; E[2] += 0.05 * k; tilt += 0.18 * k * Math.sin(T * 1.1); }
      E[0] += 0.07 * recoil * (i === leaner ? 0.6 : 1); E[1] += (i === GREEN ? -0.1 : 0.045) * recoil; E[2] -= 0.045 * recoil; jaw += 0.22 * recoil;
      // the toy: the curious ones find it first, and follow it with their eyes from where they are; a head it comes near
      // draws back from it (never towards it)
      if (this.toyK > 0.001) {
        const want = i === GREY || i === GREEN ? 1 : i === 0 || i === 3 ? 0.85 : 0.0, near = Math.hypot(toy.u - E[0], toy.o - E[2]);
        N.watch += ((want > 0 || near < 1.0 ? Math.max(want, 0.9) : 0) - N.watch) * Math.min(1, dt * (1.2 + 0.4 * i) * slow);
        const k = N.watch * this.toyK; aim[0] = lerp(aim[0], toy.u, k); aim[1] = lerp(aim[1], 0.16, k); aim[2] = lerp(aim[2], toy.o, k);
        const shy = sstep(near, 1.0, 0.4) * this.toyK, dx = E[0] - toy.u, dz = E[2] - toy.o, dl = Math.hypot(dx, dz) || 1;
        E[0] += dx / dl * 0.16 * shy; E[2] += Math.min(0, dz / dl) * 0.14 * shy - 0.05 * shy; E[1] += 0.07 * shy;
        if (i === GREY) tilt += 0.35 * Math.sin(T * 1.7) * k;
      } else N.watch = 0;
      // (never up into the picture: the heads that lean out under it keep below its rail from the floor's eye)
      if (E[0] < 0.92) E[1] = Math.min(E[1], 0.57);
      // the way the head faces: at what it looks at
      let fx = aim[0] - E[0], fy = aim[1] - E[1], fz = aim[2] - E[2]; const fl = Math.hypot(fx, fy, fz) || 1; fx /= fl; fy /= fl; fz /= fl;
      fy = Math.max(-0.62, Math.min(0.5, fy)); const f2 = Math.hypot(fx, fy, fz); N.F[0] = fx / f2; N.F[1] = fy / f2; N.F[2] = fz / f2;
      // the tongue: a flick now and then, each in its own time
      const tp = ((T * (0.5 + 0.07 * i) + i * 0.37) % 1.9), fk = tp < 0.4 ? Math.sin(Math.PI * tp / 0.4) : 0;
      N.tongue = jaw > 0.3 || g < 0.9 ? 0 : fk; N.jaw = jaw + 0.06 * N.tongue; N.tilt = tilt;
      this.lay(N, T, g, sp.from === 'b' ? Math.min(1, 0.3 + 0.7 * ease.out(g * 1.5)) : 1);
      // its sounds: its own note as it rises, and again in the chord when they all turn
      if (crossed(sp.rise[0] + 0.1)) this.hiss(L, sp.hz, i ? 0.8 : 1.0, 1.4);
      if (crossed(see)) this.hiss(L, sp.hz, 0.55, 1.1);
      if (crossed(tw + 1.2 + 0.06 * i)) this.hiss(L, sp.hz, 0.4, 1.5);
    }
    this.hydra.visible = showing || linger || ret;
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.normal.needsUpdate = true;
    // ---- his arms, laid ready
    this.drawThings(L, T, tw, ret, R0);
    // ---- sounds, as they happen
    if (!quiet) {
      const v = L.voice(), k = calm ? 0.5 : 1;
      if (crossed(T_SKIN + 0.1)) noise(v, 0, { d: 0.5, vol: 0.012 * k, lp: 900, attack: 0.2 });                // the skin, dragged out
      if (crossed(T_KNOCK)) { v.note(250, 0.12, { vol: 0.03 * k, type: 'triangle', to: 160, attack: 0.004 }); noise(v, 0, { d: 0.06, vol: 0.03 * k, bp: 750, q: 2.5 }); }
      if (crossed(t0)) noise(v, 0, { d: 1.5, vol: 0.012 * k, lp: 500, attack: 0.7 });                          // a long breath as it leans
      if (crossed(tw)) {                                                                                          // the string
        v.note(196, 1.6, { vol: 0.05 * k, type: 'triangle', attack: calm ? 0.03 : 0.005 }); v.note(392, 0.8, { vol: 0.018 * k, type: 'sine', attack: 0.005 }); v.note(588, 0.4, { vol: 0.007 * k, type: 'sine', attack: 0.005 });
        if (!calm) noise(v, 0.08, { d: 0.6, vol: 0.016, hp: 5000, attack: 0.1 });
      }
      // the chord goes on, breathing: each head in its turn
      if (T > tw + 3 && n === 0 || n > 0 && T > t0 - EVERY + LEAN + 3 && T < t0 - 0.5) { const a = Math.floor(this.lastT / 0.7), b = Math.floor(T / 0.7); if (b > a) { const N = H[(b * 3) % 7]; if (N.g > 0.9) this.hiss(L, N.spec.hz, 0.4, 1.5); } }
      v.place(L.cx + L.tx * 0.6, L.cz + L.tz * 0.6);
    }
    if (showing || linger) this.lastT = T;
  },

  // His things come out from under the picture one by one and settle on and round his rock: the skin and the cloak
  // slide out and over it; the quiver and the bow hop out and stand; the club turns over once in the air and comes to
  // lean, with a knock. When the look ends they go back the way they came.
  drawThings(L, T, tw, ret, R0) {
    const rig = this.rig, v = this.v, calm = this.calm, yawTo = (du, dout) => L.yawOf(du, dout);
    const home = ret ? ease.inOut(ramp(R0, 0.08, 0.7)) : 0;                    // (going back: 0 here, 1 under the picture)
    const place = (i, k, u, o, h, yaw, pitch, roll, sc) => {
      // k: 0 under the picture, 1 in its place; it comes along the floor from DOOR
      const q = k * (1 - home), on = q > 0.01; rig.show(i, on); if (!on) return;
      L.floor(lerp(DOOR.u, u, q), lerp(DOOR.o, o, q), v); rig.put(i, v.x, L.y + h, v.z, yaw, pitch, roll, sc);
    };
    // the skin and the cloak: sliding out and up over the rock, spreading as they come
    { const k = ease.out(ramp(T, T_SKIN, T_SKIN + 0.85)), q = k * (1 - home); this.w.set(0.45 + 0.55 * q, 0.2 + 0.8 * ease.inOut(q), 0.45 + 0.55 * q); place(this.iSkin, k, HR.u, HR.o, 0, L.yawOut, 0, 0, this.w); }
    // the quiver, leaning on the rock's left; the bow, stood on its tip behind it, shivering when its string sings
    { const k = ease.inOut(ramp(T, T_BOW, T_BOW + 0.7)), hopH = 0.12 * Math.sin(Math.PI * k) * (1 - home); place(this.iQuiver, k, HR.u - 0.2, HR.o + 0.06, hopH, yawTo(1, 0.2), 0.42 * k, 0, 1); }
    {
      const k = ease.inOut(ramp(T, T_BOW + 0.25, T_BOW + 0.95)), hopH = 0.14 * Math.sin(Math.PI * k) * (1 - home), ts = T - tw;
      const sing = !calm && ts > 0 && ts < 0.9 ? Math.sin(ts * 58) * Math.exp(-ts * 5) : 0;
      place(this.iBow, k, HR.u - 0.3, HR.o - 0.02, hopH, yawTo(-1, 0.25), -0.16 * k + 0.05 * sing, 0.07 * sing + (calm && ts > 0 && ts < 2 ? 0.03 * Math.sin(ts * Math.PI) : 0), 1);
    }
    // the club: once over in the air, down on its head, and over to lean on the rock (the knock), with a small settle
    {
      const k = ramp(T, T_CLUB, T_KNOCK), e = ease.inOut(k), ts = T - T_KNOCK, hopH = 0.2 * Math.sin(Math.PI * e) * (1 - home);
      const settle = !calm && ts > 0 && ts < 0.8 ? 0.1 * Math.sin(ts * 16) * Math.exp(-ts * 6) : 0;
      place(this.iClub, e, HR.u + 0.3, HR.o + 0.09, hopH, yawTo(-1, -0.12), 0.98 + (calm ? 0 : TAU * (1 - e)) + settle + 0.6 * (1 - e) * (calm ? 1 : 0), 0, 1);
    }
  },
});
