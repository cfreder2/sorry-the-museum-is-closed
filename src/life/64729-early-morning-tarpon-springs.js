// George Inness, Early Morning, Tarpon Springs (1892), Gallery 161. The word: daybreak.
//
// A grove of Florida pines a few minutes after sunrise, in his late manner: nothing has an edge, everything is tone.
// The trees are very tall and very thin, bare to their soft high crowns; the tallest goes out through the top of the
// picture. Between their trunks, far off, is a line of red roofs with one yellow gable; at the right a small bare tree
// in bud, and a bird on the wing beside it; a few pink clouds in a slate-blue sky. One man in a red hat stands by the
// tall trunk, very small, and looks. The sun is not in the picture: it is low and behind us, on our side of the frame,
// and what it has reached (the trunks, the roofs, the grass) is orange and gold. The museum's words for it are "the
// brightening day".
//
// So what comes out is the grove, at its own height, and the day. Look at it and his pines grow up the wall on both
// sides of the picture and go on above it, as the tall one does in the picture: the great leaning one on the left
// bows in over the frame and opens its crown there, the tall straight one on the right goes highest, the small bare
// tree stands beyond it, and the picture hangs among them like a clearing. The far pines, out of focus, and the red
// roofs stand small at the foot of the wall, his gold grass in front of them, his ground a little way out over the
// floor, his sky a veil on the wall behind it all. It is all still in the blue of before the sun. A dove calls. A
// bird comes in out of that sky, small and far, and wheels once over the room; high up, it is the first thing the
// sun reaches, and it goes pale gold while everything under it is still blue. Then the light comes down: the clouds
// go pink, the crowns go green from the top, a rose edge runs down every trunk and leaves it warm, the far roofs
// catch red, the gable yellow, the grass gold, and the yellow flowers in the tuft at your feet open. The birds that
// were single voices are a chorus. The bird comes round and settles on the dead stub of the tall pine, beside the
// picture, a hand's breadth from where it is painted. After that nothing happens, which is the picture: the crowns
// breathe, a bird calls now and then, and the toy, at the foot of trees six times its height, is as small as his
// man is. When you stop looking the bird goes back up into the sky it came from, the light goes back to blue, the
// crowns close, the pines go down into the floor and the ground draws back under the wall.
//
// Nothing is ever in front of a picture. The trunks stand against the wall beside the frame and clear of both labels
// (this work's, to its right, and the Herring Net's, to its left); every crown is above the top of this frame and its
// lamp, and of its neighbours'; what stands under the picture is lower than the frame's foot; the bird keeps above
// the frames; the guard does the rest (from the checks' nine cameras it has nothing to cut). Nothing is solid, and
// nothing stays out after the look. The two shows either side of it are water (the Cotopaxi's lake, 1.9 m to the
// right; the Herring Net's sea, 2 m to the left): this one has no water, no fog and no music, and keeps within
// 1.3 m of its own picture. What matters in it (the two great pines, the far roofs, the tuft, the stub the bird
// comes down on) is within 0.85 m of the picture's middle, which is what a phone held upright shows.
// Three draw calls: the ground and the sky (one mesh, one shader), the trunks (one mesh, grown in its shader), and
// every soft thing (crowns, clouds, far trees, roofs, grass, twigs, the bird) as painted cards in one instanced mesh.
// The trunks stand 2 cm off the canvas plane: nearer the wall, the picture lamps' own wash (additive, 2.5 cm off)
// bleaches them.
// The sounds are the birds of a Florida pine wood at that hour, each a few sine sweeps: a mourning dove, a bobwhite,
// a cardinal, a wren, a pine warbler's trill, and the bird's own thin whistle. There is no tune.
// With "Reduce motion and flashing": the light takes half as long again to come down, the crowns sway half as far,
// the bird's wings beat more slowly, the flowers open without a bounce and the stub takes the bird without
// springing; nothing flashes at any setting.
//
// What it leaves out: the man in the red hat does not come out, in any form, because he is one unnamed man standing
// alone and still (the toy stands where he stands); no sun is shown, because Inness kept it out of the picture; his
// pool is left in the picture (its neighbours are both water); and there is no music, least of all a hymn, though the
// picture was a devotion to him: it is quiet, and the birds are enough.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, canvasTexture, flight } from '../paintlife.js';
import { strokes } from './brush.js';
import { score } from './stagecraft.js';

const TAU = Math.PI * 2;
const sm = (x, a, b) => ease.smooth(ramp(x, a, b));
const GL = n => n.toFixed(4);

// ---------------------------------------------------------------- the grove: [along the wall, height] centre lines
// (the labels: this work's at u 0.66..0.82, the Herring Net's at -1.2..-1.03, both about 1.2 m up)
const TREES = [
  { pts: [[-0.6, 0], [-0.585, 0.85], [-0.602, 1.65], [-0.588, 2.26], [-0.5, 2.52], [-0.41, 2.72]], r: 0.033, t0: 0.12, d: 1.5, amp: 0.016, w: 0.8 },       // the great leaning pine: bows in over the picture
  { pts: [[-0.79, 0], [-0.8, 1.2], [-0.825, 2.1], [-0.85, 2.6]], r: 0.016, t0: 0.42, d: 1.3, amp: 0.022, w: 1.0 },
  { pts: [[-0.955, 0], [-0.945, 1.1], [-0.972, 1.97]], r: 0.012, t0: 0.6, d: 1.2, amp: 0.024, w: 1.15 },
  { pts: [[0.556, 0], [0.568, 0.8], [0.553, 1.7], [0.566, 2.38], [0.548, 2.68], [0.566, 2.95]], r: 0.027, t0: 0.26, d: 1.62, amp: 0.018, w: 0.7 },        // the tall one
  { pts: [[0.925, 0], [0.918, 1.2], [0.945, 2.36]], r: 0.012, t0: 0.55, d: 1.2, amp: 0.024, w: 1.1 },
  { pts: [[1.07, 0], [1.064, 0.7], [1.074, 1.2]], r: 0.016, t0: 0.75, d: 1.15, amp: 0.006, w: 1.3, bare: true },                                       // the bare tree, in bud
];
const BARE = 5, TALL = 3, BARE_H = 1.8, NT = TREES.length;
// the bare tree's limbs: [from, ..., to], thick to thin
const LIMBS = [
  { pts: [[1.074, 1.2], [1.03, 1.4], [0.985, 1.6], [0.972, 1.78]], r: 0.011 },
  { pts: [[1.074, 1.2], [1.12, 1.38], [1.158, 1.56], [1.166, 1.72]], r: 0.01 },
  { pts: [[1.0, 1.52], [0.95, 1.6], [0.92, 1.7]], r: 0.006 },
  { pts: [[1.14, 1.47], [1.185, 1.55], [1.2, 1.64]], r: 0.006 },
  { pts: [[1.064, 0.98], [1.1, 1.1], [1.104, 1.2]], r: 0.006 },
];
// dead stubs on the tall one, where the picture has them; the second is where the bird comes down
// their limbs, up into the crowns
const BOUGHS = [
  { tree: 0, pts: [[-0.5, 2.52], [-0.6, 2.68], [-0.74, 2.8]], r: 0.012 }, { tree: 0, pts: [[-0.44, 2.66], [-0.32, 2.82], [-0.2, 2.9]], r: 0.012 }, { tree: 0, pts: [[-0.41, 2.72], [-0.42, 2.86], [-0.5, 2.98]], r: 0.01 },
  { tree: 3, pts: [[0.55, 2.66], [0.46, 2.8], [0.36, 2.88]], r: 0.01 }, { tree: 3, pts: [[0.562, 2.78], [0.68, 2.88], [0.8, 2.9]], r: 0.01 },
];
const STUBS = [{ pts: [[0.566, 2.36], [0.53, 2.42], [0.5, 2.42]], r: 0.006 }, { pts: [[0.558, 1.985], [0.6, 2.045], [0.66, 2.062]], r: 0.0085, perch: true }];
const PERCH = [0.65, 2.07, 0.004];
// the crowns: whose, centre, half sizes, how many dabs, how warm (the tall one's is browner, as his is)
const CROWNS = [
  { tree: 0, u: -0.41, h: 2.79, ru: 0.57, rh: 0.31, n: 44, warm: 0.1, size: 0.4 },
  { tree: 1, u: -0.92, h: 2.54, ru: 0.26, rh: 0.19, n: 14, warm: 0, size: 0.25 },
  { tree: 2, u: -0.985, h: 2.06, ru: 0.18, rh: 0.13, n: 10, warm: 0.15, size: 0.19 },
  { tree: 3, u: 0.57, h: 2.9, ru: 0.38, rh: 0.19, n: 28, warm: 0.55, size: 0.3 },
  { tree: 4, u: 0.975, h: 2.32, ru: 0.2, rh: 0.14, n: 11, warm: 0.3, size: 0.2 },
];
// his pink clouds, on the sky: [along, height, width, height of it]
const CLOUDS = [[0.86, 1.96, 0.44, 0.13], [-0.86, 1.6, 0.4, 0.12], [0.06, 2.66, 0.36, 0.1], [0.92, 2.74, 0.3, 0.1], [-0.9, 2.95, 0.34, 0.1], [0.02, 3.14, 0.5, 0.12]];
// far off, small, over the skirting at the foot of the wall: his screen of pines [along, top], and the roofs
// [along, width, height, kind (0 red, 1 the yellow gable, 2 grey-brown)]
const SKIRT = 0.265;
const FAR = [[-0.47, 0.76], [-0.39, 0.9], [-0.3, 0.72], [-0.2, 0.87], [-0.11, 0.78], [-0.01, 0.92], [0.07, 0.74], [0.17, 0.85], [0.27, 0.73], [0.37, 0.89], [0.46, 0.77], [-0.7, 0.78], [0.74, 0.74], [0.13, 0.66], [-0.26, 0.64], [0.31, 0.62]];
const ROOFS = [[-0.41, 0.15, 0.06, 0], [-0.28, 0.2, 0.078, 0], [-0.12, 0.22, 0.088, 0], [-0.02, 0.07, 0.1, 1], [-0.7, 0.13, 0.06, 0], [0.33, 0.25, 0.1, 2], [0.16, 0.19, 0.04, 2]];
const TUFT = { u: -0.14, o: 0.62 };
const TRUNK_O = -0.019;                    // the trunks' centre lines, out from the canvas plane: just clear of the lamps' wash on the wall
// ---------------------------------------------------------------- the timeline (seconds of show)
const T_BIRD = 2.7, T_LAND = 7.3, T_SUN = 4.5;
const TOP = 3.45;                          // where the light starts down from (m above the floor)
// the bird's way: out of the sky on the wall, once round over the room, and down to the stub
const WAY = [[0.2, 3.0, -0.02], [-0.2, 2.95, 0.28], [-0.58, 2.72, 0.62], [-0.5, 2.44, 1.0], [0.0, 2.26, 1.16], [0.5, 2.15, 1.0], [0.7, 2.1, 0.62], [0.67, 2.12, 0.28], [PERCH[0], PERCH[1] + 0.085, 0.03]];
// the atlas: 4 x 4 cells
const C_FOL = 0, C_FOL2 = 1, C_WISP = 2, C_BLOB = 3, C_FAR = 4, C_FAR2 = 5, C_ROOF = 6, C_GABLE = 7, C_WING = 8, C_BODY = 9, C_PERCH = 10, C_TUFT = 11, C_DOT = 12, C_SHRUB = 13, C_TWIG = 14, C_CLOUD = 15;
const MAXC = 220;

lifeFor(64729, {
  title: /^Early Morning, Tarpon Springs/,
  word: 'daybreak',
  // (a tall show round a tall picture: the camera stands back and low, the work in the middle, the crowns over it)
  stage: { out: 1.0, half: 1.4, cam: { dist: 3.3, height: 0.95, side: 0.1, fov: 58, lookU: 0, lookOut: 0, lookH: 1.4, whole: false } },
  wake: 2, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.22) => P.near(h, a);
    this.foot = L.cy - L.y;
    this.v = new THREE.Vector3(); this.c = new THREE.Color();
    this.m4 = new THREE.Matrix4(); this.mB = new THREE.Matrix4(); this.mT = new THREE.Matrix4(); this.q4 = new THREE.Quaternion(); this.e4 = new THREE.Euler(0, 0, 0, 'YXZ'); this.s4 = new THREE.Vector3();
    this.grow = new Float32Array(NT); this.open = new Float32Array(NT); this.sway = new Float32Array(NT);
    this.buildLand(L, col); this.buildTrunks(L, col); this.buildCards(L, col);
    this.way = flight(WAY.map(p => L.at(p[0], p[1] - this.foot, p[2], new THREE.Vector3())), { closed: false, tension: 0.5 });
    this.bird = { p: new THREE.Vector3(), d: new THREE.Vector3(0, 0, 1), on: false, s: 0, home: new THREE.Vector3(), from: new THREE.Vector3() };
    L.at(WAY[0][0], WAY[0][1] - this.foot, WAY[0][2], this.bird.home);
    this.perch = L.at(PERCH[0], PERCH[1] - this.foot, PERCH[2], new THREE.Vector3());
    this.band = this.makeScore(L);
    this.S0 = { grow: new Float32Array(NT), open: new Float32Array(NT), far: 0, spread: 0, sky: 0, pink: 0, sun: 0, day: 0, gold: 0, t: 0, landed: false };
    this.hideAll();
  },

  // ---------------------------------------------------------------- his ground on the floor, his sky on the wall
  buildLand(L, col) {
    const pos = [], kind = [];
    const quad = (a, b, c, d, k) => { for (const p of [a, b, c, a, c, d]) { pos.push(p.x, p.y, p.z); kind.push(k); } };
    const F = (u, o) => { const p = L.floor(u, o, new THREE.Vector3()); p.y += 0.015; return p; }, W = (u, h) => L.at(u, h - this.foot, -L.wall + 0.004, new THREE.Vector3());
    quad(F(-1.5, -L.wall), F(1.5, -L.wall), F(1.5, 1.2), F(-1.5, 1.2), 0);
    quad(W(-1.5, 0), W(1.5, 0), W(1.5, 3.8), W(-1.5, 3.8), 1);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
    // his ground: long level smears, scumbled one over another, umber and olive with ochre in it
    const ground = strokes({
      size: 256, seed: 64729, n: 1300, len: [22, 64], width: [6, 15], bend: 0.16, lift: 0.05, base: col('#5a493c', 0.3).getStyle(),
      colors: [['#5c4a3c', 4], ['#6a5440', 3], ['#4c4a38', 2.5], ['#7a5c3a', 1.6], ['#57503a', 2], ['#463c34', 1.5]].map(([c, w]) => [col(c, 0.3).getStyle(), w]),
      angle: (x, y, r) => (r() - 0.5) * 0.22,
    });
    // soft noise for the clouds and for every ragged edge (tiles)
    const cloud = canvasTexture(128, 128, (c, w, h) => {
      c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'lighter';
      for (const [ch, n, r0, r1] of [['255,0,0', 26, 10, 26], ['0,255,0', 9, 16, 34], ['0,0,255', 40, 5, 12]]) for (let i = 0; i < n; i++) {
        const x = L.rand() * w, y = L.rand() * h, rx = r0 + L.rand() * (r1 - r0), a = 0.2 + 0.3 * L.rand();
        for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
          c.save(); c.translate(x + ox, y + oy); c.scale(ch === '0,255,0' ? 1.9 : 1, 1);
          const gr = c.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(${ch},${a})`); gr.addColorStop(1, `rgba(${ch},0)`);
          c.fillStyle = gr; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
        }
      }
    }, false);
    cloud.wrapS = cloud.wrapT = THREE.RepeatWrapping;
    const u = this.lu = {
      uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) },
      uShow: { value: new THREE.Vector4(0, 0, 0, 0) },            // the ground's spread, the sky's strength, the pink in it, the gold on the grass
      uDay: { value: new THREE.Vector3(0, TOP, 0) },              // how far the day has come, where the light has come down to, time
      tGround: { value: ground }, tCloud: { value: cloud },
      cNightG: { value: col('#2e2e34', 0.1) }, cGold: { value: col('#a87638', 0.3) }, cOlive: { value: col('#494a36', 0.3) },
      cNight: { value: col('#34434e', 0.12) }, cNightLo: { value: col('#414b52', 0.12) }, cSky: { value: col('#8d9a9d', 0.3) }, cSkyHi: { value: col('#74878f', 0.3) },
      cPink: { value: col('#cfa291', 0.25) }, cHaze: { value: col('#b5a999', 0.25) },
    };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aKind; varying float vKind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vKind = aKind;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform vec3 uO, uDay; uniform vec4 uAx, uShow; uniform sampler2D tGround, tCloud;
uniform vec3 cNightG, cGold, cOlive, cNight, cNightLo, cSky, cSkyHi, cPink, cHaze;
varying float vKind; vec3 fCol; float fA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz; float su = dot(lq, uAx.xy), so = dot(lq, uAx.zw), wh = lifeP.y - uO.y;
  if (vKind < 0.5) {
    // his ground: it comes out from the foot of the wall and ends raggedly, a smear at a time
    vec4 gt = texture2D(tGround, vec2(su, so) / 0.85); vec3 nz = texture2D(tCloud, vec2(su, so) * 0.5).rgb, n2 = texture2D(tCloud, vec2(su * 1.7 + 0.3, so * 1.7)).rgb;
    float reach = (0.74 + 0.3 * nz.r - 0.34 * pow(su / 1.25, 2.0)) * uShow.x;
    float ed = reach - so - (0.85 - gt.a) * 0.34 - (n2.b - 0.3) * 0.12;
    float m = smoothstep(-0.02, 0.2, ed) * step(0.004, uShow.x) * (1.0 - smoothstep(0.7, 1.22, abs(su) + (nz.g - 0.3) * 0.5 + (0.8 - gt.a) * 0.2));
    vec3 c = gt.rgb * (0.94 + 0.3 * n2.r);
    c = mix(c, cOlive * (0.72 + 0.55 * gt.a), smoothstep(0.34, 0.7, so + 0.2 * nz.g) * 0.62);          // the dark of his foreground, greener
    c *= 1.0 - 0.3 * smoothstep(0.25, 0.75, nz.g) * smoothstep(0.2, 0.5, so);                           // and its slant of shadow
    // the grass the sun has reached: gold along the far side
    float band = (1.0 - smoothstep(0.1, 0.46, so - 0.1 * nz.r + 0.12 * su)) * (0.5 + 0.8 * n2.r);
    c = mix(mix(cNightG * (0.75 + 0.5 * gt.a), c, 0.2 + 0.8 * uDay.x), cGold * (0.72 + 0.5 * gt.a), clamp(band, 0.0, 1.0) * uShow.w * 0.82);
    fCol = c; fA = m * 0.94;
  } else {
    // his sky on the wall behind the grove, an even veil with a feathered edge: slate blue before the sun, then
    // paler, with a warm haze low down
    vec3 n2 = texture2D(tCloud, vec2(su * 0.6 + 0.37, wh * 0.6 + 0.21)).rgb;
    vec2 e = vec2((su - 0.02) / (1.02 + 0.3 * smoothstep(1.5, 2.6, wh)), (wh - 1.72) / 1.8);
    float d = pow(pow(abs(e.x), 2.6) + pow(abs(e.y), 2.6), 1.0 / 2.6) + (n2.r - 0.4) * 0.06;
    float m = 1.0 - smoothstep(0.5, 1.0, d);
    vec3 night = mix(cNightLo, cNight, smoothstep(0.2, 2.2, wh)), day = mix(cSky, cSkyHi, smoothstep(1.0, 3.2, wh));
    vec3 c = mix(night, day, uDay.x);
    c = mix(c, cHaze, exp(-wh / 0.62) * (0.2 + 0.62 * uDay.x) + 0.3 * uShow.z * exp(-wh / 0.9) * (1.0 - uDay.x));
    c *= 0.96 + 0.08 * n2.g;
    fCol = c; fA = m * uShow.y * (0.74 + 0.16 * uDay.x);
  }
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'tarpon-land';
    this.land = new THREE.Mesh(g, m); this.land.renderOrder = 5;
    L.add(this.land);
  },

  // ---------------------------------------------------------------- the trunks: one mesh, grown from the floor in its shader
  buildTrunks(L, col) {
    const pos = [], axis = [], inf = [], aux = [], SEG = 8, lightDir = new THREE.Vector3(-0.5, 0.12, 0.86).normalize();
    const world = (u, h, o, into) => L.at(u, h - this.foot, o, into), a3 = new THREE.Vector3(), b3 = new THREE.Vector3(), n3 = new THREE.Vector3();
    const tube = (ti, pts, r0, r1, H, { flare = 0, dip = false, out0 = null } = {}) => {
      const cv = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], 0)), false, 'centripetal'), n = Math.max(3, Math.ceil(cv.getLength() / 0.1));
      const Cn = [], Tn = [];
      for (let i = 0; i <= n; i++) { Cn.push(cv.getPointAt(i / n)); Tn.push(cv.getTangentAt(i / n)); }
      for (let i = 0; i < n; i++) for (let j = 0; j < SEG; j++) for (const [ii, jj] of [[i, j], [i + 1, j], [i + 1, j + 1], [i, j], [i + 1, j + 1], [i, j + 1]]) {
        const c = Cn[ii], tg = Tn[ii], k = ii / n, a = jj / SEG * TAU, r = lerp(r0, r1, k) * (1 + flare * Math.exp(-c.y / 0.08)) * (1 + 0.07 * Math.sin(c.y * 6.3 + ti * 2.1) + 0.05 * Math.sin(c.y * 17 + ti * 5));
        const o = (out0 == null ? TRUNK_O + r0 * 0.25 : out0), ex = tg.y, ey = -tg.x;          // (across the centre line, in the wall's plane)
        world(c.x + Math.cos(a) * r * ex, c.y + Math.cos(a) * r * ey, o + Math.sin(a) * r, a3); world(c.x, c.y, o, b3);
        pos.push(a3.x, a3.y, a3.z); axis.push(b3.x, b3.y, b3.z);
        n3.set(Math.cos(a) * ex, Math.cos(a) * ey, Math.sin(a));
        inf.push(ti, c.y / H, n3.dot(lightDir), dip ? k * k : 0); aux.push(jj / SEG, r0 / 0.03);
      }
    };
    TREES.forEach((t, i) => {
      t.H = t.bare ? BARE_H : Math.max(t.pts[t.pts.length - 1][1], ...BOUGHS.filter(b => b.tree === i).map(b => b.pts[b.pts.length - 1][1] + 0.01));
      tube(i, t.pts, t.r, t.r * (t.bare ? 0.72 : 0.42), t.H, { flare: 0.45 });
    });
    const bo = TRUNK_O + TREES[BARE].r * 0.25;
    for (const l of LIMBS) tube(BARE, l.pts, l.r, l.r * 0.35, BARE_H, { out0: bo });
    for (const s of STUBS) tube(TALL, s.pts, s.r, s.r * 0.45, TREES[TALL].H, { dip: !!s.perch, out0: TRUNK_O + TREES[TALL].r * 0.25 });
    for (const b of BOUGHS) tube(b.tree, b.pts, b.r, b.r * 0.4, TREES[b.tree].H, { out0: TRUNK_O + TREES[b.tree].r * 0.25 });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aAxis', new THREE.Float32BufferAttribute(axis, 3));
    g.setAttribute('aInf', new THREE.Float32BufferAttribute(inf, 4)); g.setAttribute('aAux', new THREE.Float32BufferAttribute(aux, 2));
    const bark = strokes({ size: 128, seed: 6472, n: 300, len: [20, 56], width: [5, 11], bend: 0.12, lift: 0.1, base: '#808080', colors: [['#727272', 3], ['#8c8c8c', 3], ['#a2a2a2', 2], ['#606060', 1.5], ['#b4b4b4', 0.6]], angle: (x, y, r) => Math.PI / 2 + (r() - 0.5) * 0.2 });
    const u = this.tu = {
      uGrow: { value: this.grow }, uSway: { value: this.sway }, uDay: this.lu.uDay, uAx: this.lu.uAx, uY: { value: L.y }, uDip: { value: 0 }, tBark: { value: bark },
      cNightA: { value: col('#2c2f37', 0.1) }, cNightB: { value: col('#3b3e46', 0.1) }, cShade: { value: col('#38353a', 0.15) }, cBark: { value: col('#4a3e39', 0.2) }, cSun: { value: col('#765444', 0.2) },
      cPale: { value: col('#93857a', 0.3) }, cRose: { value: col('#e2a48e', 0.2) },
    };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
attribute vec3 aAxis; attribute vec4 aInf; attribute vec2 aAux; uniform float uGrow[${NT}]; uniform float uSway[${NT}]; uniform float uDip; uniform vec4 uAx;
varying vec4 vInf; varying vec2 vAux;`)
        .replace('#include <begin_vertex>', `int ti = int(aInf.x + 0.5); float gr = uGrow[ti];
  // grown as far as gr of its height: what is above that is not there yet, and the tip tapers to nothing
  float kk = clamp((gr - aInf.y) / 0.045, 0.0, 1.0);
  vec3 transformed = aAxis + (position - aAxis) * kk;
  transformed.xz += uAx.xy * uSway[ti] * aInf.y * aInf.y;
  transformed.y -= uDip * aInf.w;
  vInf = aInf; vAux = aAux;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform vec3 uDay; uniform float uY; uniform sampler2D tBark; uniform vec3 cNightA, cNightB, cShade, cBark, cSun, cPale, cRose;
varying vec4 vInf; varying vec2 vAux;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  float wh = lifeP.y - uY, side = clamp(vInf.z * 0.5 + 0.5, 0.0, 1.0);
  vec3 bk = texture2D(tBark, vec2(vAux.x * 0.35 * vAux.y + vInf.x * 0.37, wh * 0.7)).rgb;
  float lit = smoothstep(uDay.y - 0.1, uDay.y + 0.45, wh);                   // the sun has come down to here
  float edge = exp(-pow((wh - uDay.y - 0.12) / 0.2, 2.0));                    // its first touch is rose
  float tone = 0.84 + 0.3 * bk.r, low = 0.8 + 0.2 * smoothstep(0.1, 1.3, wh);        // (darker towards the ground, as his are)
  vec3 night = mix(cNightA, cNightB, side) * (0.85 + 0.3 * bk.g);
  vec3 day = mix(cShade, cBark, smoothstep(0.15, 0.85, side)) * tone * low;
  vec3 sun = mix(day, cSun * tone * (0.9 + 0.1 * low), smoothstep(0.5, 0.97, side) * 0.9);
  float bare = step(${GL(BARE - 0.5)}, vInf.x);
  day = mix(day, cPale * tone * (0.72 + 0.28 * side), bare * 0.85); sun = mix(sun, mix(cPale, cRose, 0.4) * tone * (0.82 + 0.3 * side), bare * 0.85);
  vec3 c = mix(night, day, uDay.x); c = mix(c, sun, lit); c = mix(c, cRose, edge * 0.36 * (0.35 + 0.65 * side));
  diffuseColor.rgb = c;
}`);
    };
    m.customProgramCacheKey = () => 'tarpon-trunks';
    this.trunks = new THREE.Mesh(g, m);
    L.add(this.trunks);
  },

  // ---------------------------------------------------------------- every soft thing: painted cards, one instanced mesh
  buildCards(L, col) {
    const R = () => L.rand(), CS = 128;
    const atlas = canvasTexture(CS * 4, CS * 4, g => {
      g.clearRect(0, 0, CS * 4, CS * 4); g.lineCap = 'round'; g.lineJoin = 'round';
      const cell = (i, fn) => { g.save(); g.translate((i % 4) * CS, Math.floor(i / 4) * CS); g.beginPath(); g.rect(1, 1, CS - 2, CS - 2); g.clip(); fn(); g.restore(); };
      const grey = (v, a = 1) => { v = Math.max(0, Math.min(255, Math.round(v))); return `rgba(${v},${v},${v},${a})`; };
      const blob = (x, y, r, a, v = 255, sy = 1) => { g.save(); g.translate(x, y); g.scale(1, sy); const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, grey(v, a)); gr.addColorStop(0.55, grey(v, a * 0.62)); gr.addColorStop(1, grey(v, 0)); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.restore(); };
      const soft = (blur, v, a, path) => { g.save(); g.shadowColor = grey(v, a); g.shadowBlur = blur; g.fillStyle = grey(v, a); g.beginPath(); path(); g.fill(); g.restore(); };
      const poly = pts => () => { pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
      // a dab of his foliage: a soft scumbled mass, lighter above, feathered at the rim with fine needle strokes
      const foliage = (dense, wisp, body) => () => {
        if (body) blob(64, 67, 40, body, 150, 0.85);
        for (let i = 0; i < 46 * dense; i++) {
          const a = R() * TAU, rr = Math.sqrt(R()) * 38, x = 64 + Math.cos(a) * rr, y = 66 + Math.sin(a) * rr * 0.8;
          g.fillStyle = grey(158 - (y - 64) * 1.5 - (x - 64) * 0.5 + (R() - 0.5) * 80, 0.16 + 0.24 * R());
          g.beginPath(); g.ellipse(x, y, 5 + R() * 8, 3 + R() * 5, R() * Math.PI, 0, TAU); g.fill();
        }
        for (let i = 0; i < wisp; i++) {
          const a = R() * TAU, r0 = 22 + R() * 16, r1 = r0 + 6 + R() * 15, j = (R() - 0.5) * 0.6;
          g.strokeStyle = grey(120 + R() * 120 - Math.sin(a) * 30, 0.14 + 0.26 * R()); g.lineWidth = 0.9 + R() * 1.6;
          g.beginPath(); g.moveTo(64 + Math.cos(a) * r0, 66 + Math.sin(a) * r0 * 0.8); g.lineTo(64 + Math.cos(a + j) * r1, 66 + Math.sin(a + j) * r1 * 0.8); g.stroke();
        }
      };
      cell(C_FOL, foliage(1, 90, 0.5)); cell(C_FOL2, foliage(0.8, 120, 0.38)); cell(C_WISP, foliage(0.45, 150, 0.12));
      cell(C_BLOB, () => blob(64, 64, 60, 1));
      // a far pine, out of focus: a thin stem and a soft flat-footed crown
      const farPine = (lean, twin) => () => {
        g.strokeStyle = grey(110, 0.42); g.lineWidth = 2.2; g.shadowColor = grey(110, 0.4); g.shadowBlur = 3;
        g.beginPath(); g.moveTo(64, 126); g.quadraticCurveTo(64 + lean * 0.3, 90, 64 + lean, 46); g.stroke(); g.shadowBlur = 0;
        const cx = 64 + lean;
        blob(cx, 38, 34, 0.62, 170, 0.62); blob(cx - 10, 30, 20, 0.4, 215, 0.7); blob(cx + 14, 42, 20, 0.4, 130, 0.6);
        if (twin) { blob(cx - 26, 50, 16, 0.5, 150, 0.6); blob(cx + 24, 26, 15, 0.45, 190, 0.6); }
        for (let i = 0; i < 26; i++) { const a = R() * TAU, rr = Math.sqrt(R()) * 30; blob(cx + Math.cos(a) * rr, 38 + Math.sin(a) * rr * 0.55, 5 + R() * 6, 0.22, 130 + R() * 110); }
      };
      cell(C_FAR, farPine(4, false)); cell(C_FAR2, farPine(-7, true));
      // a roof, out of focus (its wall a darker strip under it); a gable end
      // (drawn an eighth of the size and enlarged, which is his blur)
      const blurred = fn => () => { const o = document.createElement('canvas'); o.width = o.height = CS / 8; const k = o.getContext('2d'); k.scale(0.125, 0.125); fn(k); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(o, 0, 0, CS / 8, CS / 8, 0, 0, CS, CS); };
      const fillP = (k, v, a, pts) => { k.fillStyle = grey(v, a); k.beginPath(); pts.forEach((p, i) => (i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]))); k.closePath(); k.fill(); };
      cell(C_ROOF, blurred(k => { fillP(k, 96, 0.85, [[18, 72], [110, 72], [110, 102], [18, 102]]); fillP(k, 235, 0.95, [[10, 76], [28, 40], [100, 40], [118, 76]]); fillP(k, 255, 0.5, [[22, 52], [28, 40], [100, 40], [106, 52]]); }));
      cell(C_GABLE, blurred(k => { fillP(k, 240, 0.95, [[28, 106], [28, 62], [64, 26], [100, 62], [100, 106]]); }));
      // the bird, from below: a long crooked wing, pale, dark at the wrist and the finger tips; its body and tail
      cell(C_WING, () => {
        soft(2, 232, 1, poly([[4, 50], [34, 40], [56, 36], [84, 42], [108, 50], [124, 60], [119, 68], [112, 63], [109, 73], [101, 66], [96, 77], [88, 69], [62, 80], [30, 84], [4, 80]]));
        g.globalCompositeOperation = 'source-atop';
        blob(56, 46, 15, 0.95, 40); blob(114, 62, 26, 0.95, 30); blob(30, 62, 30, 0.35, 150);
        g.strokeStyle = grey(120, 0.55); g.lineWidth = 3; for (const y of [0, 7]) { g.beginPath(); g.moveTo(8, 74 + y * 0.5); g.quadraticCurveTo(50, 78 - y, 92, 66 - y); g.stroke(); }
        g.globalCompositeOperation = 'source-over';
      });
      cell(C_BODY, () => {
        soft(2, 232, 1, () => { g.ellipse(64, 60, 11, 30, 0, 0, TAU); }); soft(2, 240, 1, () => { g.arc(64, 26, 9.5, 0, TAU); });
        soft(2, 190, 1, poly([[57, 84], [47, 120], [81, 120], [71, 84]]));
        g.globalCompositeOperation = 'source-atop'; g.strokeStyle = grey(70, 0.8); g.lineWidth = 3; g.beginPath(); g.moveTo(55, 26); g.lineTo(73, 26); g.stroke();
        for (const y of [100, 110]) { g.strokeStyle = grey(110, 0.6); g.lineWidth = 2.5; g.beginPath(); g.moveTo(48, y); g.lineTo(80, y); g.stroke(); }
        g.globalCompositeOperation = 'source-over';
      });
      // the bird at rest, upright, a dark back and a pale front
      cell(C_PERCH, () => {
        soft(1.5, 50, 1, poly([[50, 88], [42, 124], [58, 124], [66, 96]]));                                              // its tail, below the stub
        soft(1.5, 238, 1, () => { g.ellipse(66, 66, 17, 34, 0.14, 0, TAU); });                                           // a pale front
        soft(1.5, 244, 1, () => { g.arc(72, 27, 12, 0, TAU); });                                                         // a pale head
        g.globalCompositeOperation = 'source-atop';
        g.fillStyle = grey(36, 1); g.beginPath(); g.ellipse(47, 70, 17, 40, 0.16, 0, TAU); g.fill();                     // the folded wing and the back, dark
        g.fillStyle = grey(120, 0.5); for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(70 + (i % 2) * 5, 50 + i * 3, 3.5, 1.6, 0.3, 0, TAU); g.fill(); }      // a few flecks on the breast
        g.strokeStyle = grey(30, 1); g.lineWidth = 4.2; g.beginPath(); g.moveTo(58, 31); g.quadraticCurveTo(70, 24, 82, 25); g.stroke();      // the stripe through its eye
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = grey(30, 1); g.beginPath(); g.moveTo(82, 24); g.quadraticCurveTo(93, 26, 90, 36); g.lineTo(82, 31); g.closePath(); g.fill();      // a hooked bill
        g.strokeStyle = grey(150, 1); g.lineWidth = 2.4; for (const x of [62, 70]) { g.beginPath(); g.moveTo(x, 96); g.lineTo(x + 1, 108); g.stroke(); }
      });
      // the tuft at the water's edge: thin blades, fanned
      cell(C_TUFT, () => { blob(64, 116, 44, 0.5, 120, 0.4); for (let i = 0; i < 110; i++) { const a = -Math.PI / 2 + (R() - 0.5) * 1.7, l = 30 + R() * 80, x0 = 64 + (R() - 0.5) * 60; g.strokeStyle = grey(90 + R() * 150, 0.5 + 0.3 * R()); g.lineWidth = 0.7 + R() * 1.1; g.beginPath(); g.moveTo(x0, 125); g.quadraticCurveTo(x0 + Math.cos(a) * l * 0.4, 125 + Math.sin(a) * l * 0.6, Math.max(8, Math.min(120, x0 + Math.cos(a) * l * 1.1)), Math.max(8, 125 + Math.sin(a) * l)); g.stroke(); } });
      cell(C_DOT, () => blob(64, 64, 52, 1, 255));
      // a dark clump at a trunk's foot
      cell(C_SHRUB, () => { blob(64, 104, 40, 0.75, 120, 0.6); for (let i = 0; i < 46; i++) { const a = -Math.PI / 2 + (R() - 0.5) * 2.5, l = 26 + R() * 34; g.strokeStyle = grey(80 + R() * 130, 0.6); g.lineWidth = 1.6 + R() * 2.4; g.beginPath(); g.moveTo(64 + (R() - 0.5) * 30, 120); g.lineTo(64 + Math.cos(a) * l * 1.3, 116 + Math.sin(a) * l); g.stroke(); } });
      // fine twigs, for the bare tree's ends
      cell(C_TWIG, () => {
        const twig = (x, y, a, l, w, d) => { const x1 = x + Math.cos(a) * l, y1 = y + Math.sin(a) * l; g.strokeStyle = grey(200, 0.85); g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.3) * l * 0.5, y + Math.sin(a + 0.3) * l * 0.5, x1, y1); g.stroke(); if (d > 0) for (let i = 0; i < 2; i++) twig(lerp(x, x1, 0.45 + 0.5 * i), lerp(y, y1, 0.45 + 0.5 * i), a + (i ? 0.55 : -0.6) + (R() - 0.5) * 0.4, l * 0.62, w * 0.7, d - 1); };
        twig(64, 124, -Math.PI / 2 - 0.12, 40, 2.6, 3); twig(64, 124, -Math.PI / 2 + 0.75, 30, 2, 2); twig(64, 124, -Math.PI / 2 - 0.85, 28, 2, 2);
      });
      // one of his clouds: long, soft, flat underneath
      cell(C_CLOUD, () => { for (let i = 0; i < 16; i++) { const x = 22 + R() * 84, k = 1 - Math.abs(x - 64) / 50; blob(x, 70 - R() * 16 * k, 12 + 16 * k * R(), 0.32, 255, 0.6); } blob(64, 70, 46, 0.5, 255, 0.3); });
    }, false);
    atlas.anisotropy = 4;
    const geo = new THREE.PlaneGeometry(1, 1);
    this.aInfo = new THREE.InstancedBufferAttribute(new Float32Array(MAXC * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(MAXC * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aInfo', this.aInfo); geo.setAttribute('aCol', this.aCol);
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      sh.uniforms.tAtlas = { value: atlas };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aInfo; attribute vec3 aCol; varying vec4 vInfo; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vInfo = aInfo; vCol = aCol; vQ = position.xy + 0.5;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D tAtlas; varying vec4 vInfo; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <map_fragment>', `{
  vec2 q = clamp(vQ, 0.03, 0.97); if (vInfo.w < 0.0) q.x = 1.0 - q.x;
  float ci = floor(vInfo.x + 0.5); vec2 cell = vec2(mod(ci, 4.0), 3.0 - floor(ci / 4.0));
  vec4 tx = texture2D(tAtlas, (q + cell) * 0.25);
  float a = tx.a * vInfo.y; if (a < 0.012) discard;
  // (the atlas holds each thing's light and dark; vInfo.z: how much of that it keeps, 0 is flat tone)
  diffuseColor = vec4(vCol * mix(1.0, 0.1 + 1.16 * tx.r, vInfo.z), a);
}`);
    };
    m.customProgramCacheKey = () => 'tarpon-cards';
    const mesh = this.cards = new THREE.InstancedMesh(geo, m, MAXC);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.count = 0; mesh.renderOrder = 6;
    L.add(mesh);
    // scratch: one row per card, then drawn far to near
    this.pm = new Float32Array(MAXC * 16); this.pi = new Float32Array(MAXC * 4); this.pc = new Float32Array(MAXC * 3); this.dep = new Float32Array(MAXC);
    this.order = []; this.byDepth = (a, b) => this.dep[b] - this.dep[a]; this.n = 0;

    // ---- the colours (his, lifted a little: the galleries are dark at night)
    const C = this.C = {
      nightF: col('#2b363b', 0.12), nightF2: col('#34413f', 0.12),
      shade: col('#3f4a40', 0.3), mid: col('#525c38', 0.3), lit: col('#7a8242', 0.3), top: col('#93944e', 0.3),
      wShade: col('#51473a', 0.3), wMid: col('#716249', 0.3), wLit: col('#93805c', 0.3),
      rose: col('#e0a690', 0.2),
      farN: col('#34414a', 0.15), farD: col('#4e5f5b', 0.3), farL: col('#66745e', 0.3), stemD: col('#45413f', 0.3),
      cloudN: col('#56636d', 0.12), cloudP: col('#d6a595', 0.25), cloudD: col('#d9bcab', 0.25),
      roofN: col('#473d40', 0.15), roofD: col('#6e504b', 0.3), roofL: col('#9a5a4e', 0.35), gableL: col('#c09a64', 0.35), tin: col('#766c60', 0.3), tinL: col('#928468', 0.35), farG: col('#4a4a3a', 0.3), farGL: col('#8a6c3c', 0.3),
      grassN: col('#2c3134', 0.12), grass: col('#5a5136', 0.3), grassL: col('#a77a3a', 0.3), grassL2: col('#8f7a3c', 0.3),
      tuftN: col('#293130', 0.12), tuft: col('#434d36', 0.3), tuftL: col('#636b3c', 0.3), flower: col('#e2c458', 0.2),
      shrubN: col('#23282a', 0.1), shrub: col('#383a2e', 0.3),
      twigN: col('#3c3c44', 0.12), twig: col('#8c7e74', 0.3), bud: col('#d49c90', 0.25),
      birdN: col('#5d6973', 0.1), birdD: col('#a39b90', 0.15), birdL: col('#dcc7a6', 0.1),
    };
    // ---- the crowns' dabs
    this.dabs = [];
    CROWNS.forEach(cr => {
      const T = TREES[cr.tree], tip = T.pts[T.pts.length - 1];
      for (let i = 0; i < cr.n; i++) {
        // an underpainting of dark masses against the wall, the body of it over that, and the lights last, upper left
        const layer = i < cr.n * 0.24 ? 0 : i < cr.n * 0.72 ? 1 : 2;
        let x, y0;
        if (layer === 2) { const a = Math.PI * (0.25 + 0.75 * R()), rr = 0.25 + 0.7 * Math.sqrt(R()); x = Math.cos(a) * rr * 0.95 - 0.08; y0 = Math.sin(a) * rr * 0.9; }
        else { const a = R() * TAU, rr = Math.sqrt(R()) * (layer ? 1 : 0.72); x = Math.cos(a) * rr; y0 = Math.sin(a) * rr; }
        const y = y0 < 0 ? y0 * 0.42 : y0, rr = Math.hypot(x, y0);      // (flat underneath, as a pine's crown is)
        const edge = layer === 1 && rr > 0.7;
        const lit = layer === 0 ? 0.12 * R() : layer === 2 ? 0.68 + 0.32 * R() : clamp01(0.32 + 0.4 * y - 0.25 * x + (R() - 0.5) * 0.3);
        this.dabs.push({
          tree: cr.tree, tu: tip[0], th: tip[1], u: cr.u + x * cr.ru, h: cr.h + y * cr.rh, o: layer === 0 ? 0.03 + 0.03 * R() : layer === 1 ? 0.07 + 0.08 * R() : 0.16 + 0.06 * R(),
          s: cr.size * (layer === 0 ? 1.25 : layer === 2 ? 0.68 : edge ? 1.05 : 0.9) * (0.8 + 0.4 * R()), cell: layer === 0 ? C_FOL : edge ? (R() < 0.6 ? C_WISP : C_FOL2) : layer === 2 ? (R() < 0.5 ? C_FOL2 : C_WISP) : (R() < 0.5 ? C_FOL : C_FOL2),
          a: layer === 0 ? 0.9 : edge ? 0.7 : layer === 2 ? 0.82 : 0.88, keep: layer === 0 ? 0.55 : 1,
          lit, warm: cr.warm * (0.6 + 0.8 * R()), roll: (R() - 0.5) * 0.9, yaw: (R() - 0.5) * 0.4, pitch: (R() - 0.5) * 0.24, flip: R() < 0.5 ? -1 : 1, ph: R() * TAU, late: layer * 0.22 + 0.3 * rr * R(),
          cd: new THREE.Color(), cl: new THREE.Color(), cn: new THREE.Color(),
        });
      }
    });
    for (const d of this.dabs) {
      d.cn.copy(C.nightF).lerp(C.nightF2, d.lit);
      d.cd.copy(C.shade).lerp(C.mid, d.lit * 0.6).lerp(C.wShade, d.warm * 0.7);
      d.cl.copy(C.mid).lerp(C.lit, d.lit).lerp(C.top, Math.max(0, d.lit - 0.7) * 2).lerp(d.lit > 0.5 ? C.wLit : C.wMid, d.warm * 0.75);
    }
    // (over the picture nothing hangs lower than this, so no camera in the room sees a crown in front of it)
    for (const d of this.dabs) { if (Math.abs(d.u) < 0.64) { const low = 2.52 + d.s * 0.32; if (d.h < low) d.h = low; } if (Math.abs(d.u) < 0.36) d.o = Math.min(d.o, 0.13); if (d.u < -0.78 && d.h < 2.3) d.o = Math.min(d.o, 0.03); }      // (and behind the picture's lamp)
    this.far = FAR.map(([u, h], i) => ({ u, h, cell: i % 3 === 1 ? C_FAR2 : C_FAR, flip: R() < 0.5 ? -1 : 1, o: -L.wall + 0.007 + 0.0011 * i, k: R(), back: i >= 13, roll: (R() - 0.5) * 0.14, wide: 0.8 + 0.5 * R() }));
    this.hazes = [[-0.36, 0.76, 0.5, 0.26], [-0.05, 0.8, 0.52, 0.28], [0.26, 0.76, 0.5, 0.26], [0.44, 0.74, 0.3, 0.22], [-0.7, 0.72, 0.2, 0.2], [0.74, 0.68, 0.18, 0.2]].map(([u, h, w, hh], i) => ({ u, h, w, hh, o: -L.wall + 0.0055 + 0.0002 * i }));
    this.roofs = ROOFS.map(([u, w, h, kind], i) => ({ u, w, h, kind, o: -L.wall + 0.026 + 0.0012 * i }));
    // the lit grass of his middle distance, along the foot of the wall (it stands in front of the skirting)
    this.grass = Array.from({ length: 22 }, (_, i) => { const u = -1.06 + 2.2 * R(), big = R(); return { u, o: 0.008 + 0.06 * R(), w: 0.16 + 0.28 * big, h: 0.12 + 0.3 * big * (0.55 + 0.45 * R()), flip: R() < 0.5 ? -1 : 1, k: R(), ph: R() * TAU, lit: clamp01(0.6 - 0.45 * u + 0.9 * (R() - 0.5)) }; });
    this.clouds = CLOUDS.map(([u, h, w, hh], i) => ({ u, h, w, hh, o: -L.wall + 0.0046 + 0.0001 * i, flip: i % 2 ? -1 : 1, k: R() }));
    this.shrubs = [[-0.6, 0.06, 0.13], [-0.8, 0.05, 0.09], [0.556, 0.06, 0.12], [1.07, 0.05, 0.09], [-0.36, 0.3, 0.09], [0.3, 0.4, 0.08], [-0.955, 0.05, 0.08], [0.925, 0.05, 0.08], [0.72, 0.52, 0.07], [-0.78, 0.48, 0.07]].map(([u, o, s]) => ({ u, o, s, flip: R() < 0.5 ? -1 : 1 }));
    this.flowers = Array.from({ length: 9 }, (_, i) => ({ u: TUFT.u + (R() - 0.5) * 0.22, o: TUFT.o + (R() - 0.5) * 0.07, h: 0.07 + 0.1 * R(), s: 0.008 + 0.005 * R(), k: i / 9 }));
    // the bare tree's ends: twigs and buds, [along, height, size, turn, on the bird's limb]
    this.twigs = [[0.972, 1.77, 0.17, 0.05, 0], [1.166, 1.71, 0.16, -0.1, 0], [0.92, 1.69, 0.12, 0.45, 0], [1.2, 1.63, 0.12, -0.5, 0], [1.104, 1.19, 0.09, -0.2, 0], [1.02, 1.56, 0.1, 0.7, 0]];
    this.buds = []; for (const [u, h, s, turn, dip] of this.twigs) for (let j = 0; j < 4; j++) this.buds.push({ u: u + (R() - 0.5) * s * 0.7 - Math.sin(turn) * s * 0.4, h: h + s * (0.35 + 0.6 * R()), s: 0.014 + 0.012 * R(), dip, k: R() });
  },

  // ---------------------------------------------------------------- the birds of a Florida pine wood, early
  makeScore(L) {
    const s = score(L), calm = L.calm;
    const dove = (t, v = 0.03) => { s.note(t, 478, 0.2, { type: 'sine', vol: v * 0.7, to: 600, attack: 0.07 }); s.note(t + 0.2, 600, 0.52, { type: 'sine', vol: v, to: 468, attack: 0.05 }); [0.92, 1.5, 2.08].forEach(d => s.note(t + d, 462, 0.44, { type: 'sine', vol: v * 0.8, to: 452, attack: 0.09 })); };
    const bobwhite = (t, v = 0.016) => { s.note(t, 1650, 0.13, { type: 'sine', vol: v * 0.7, attack: 0.02 }); s.note(t + 0.34, 1750, 0.3, { type: 'sine', vol: v, to: 2950, attack: 0.03 }); };
    const cardinal = (t, v = 0.014) => { [0, 0.36, 0.72].forEach(d => s.note(t + d, 3500, 0.27, { type: 'sine', vol: v, to: 1900, attack: 0.02 })); [1.12, 1.26, 1.4, 1.54].forEach(d => s.note(t + d, 2050, 0.1, { type: 'sine', vol: v * 0.8, to: 3100, attack: 0.012 })); };
    const wren = (t, v = 0.011) => { for (let i = 0; i < 3; i++) [[0, 2700], [0.09, 3500], [0.18, 2950]].forEach(([d, f]) => s.note(t + i * 0.3 + d, f, 0.085, { type: 'sine', vol: v, to: f * 0.86, attack: 0.008 })); };
    const warbler = (t, v = 0.007) => { for (let i = 0; i < 15; i++) s.note(t + i * 0.062, 4300 + 60 * Math.sin(i), 0.045, { type: 'sine', vol: v * (0.5 + 0.5 * Math.sin(Math.PI * i / 14)), to: 3900, attack: 0.006 }); };
    const whistle = (t, v = 0.012) => { [0, 0.3, 0.58].forEach((d, i) => s.note(t + d, 2500 + 160 * i, 0.22, { type: 'sine', vol: v * (1 - 0.2 * i), to: 3000 + 160 * i, attack: 0.04 })); };
    // the pines going up: a long breath of air
    s.hit(0.15, { d: 1.9, vol: calm ? 0.007 : 0.011, lp: 1700, hp: 420, attack: calm ? 1.1 : 0.7 });
    dove(2.15, calm ? 0.022 : 0.03); whistle(3.25, 0.008); bobwhite(4.0); cardinal(4.9); wren(5.75); bobwhite(6.3, 0.012); warbler(6.6); cardinal(7.0, 0.01); wren(7.55, 0.008);
    // the bird comes down: two soft beats of air, and the stub
    s.hit(T_LAND - 0.42, { d: 0.16, vol: 0.006, lp: 900, hp: 200, attack: 0.03 }); s.hit(T_LAND - 0.2, { d: 0.16, vol: 0.006, lp: 900, hp: 200, attack: 0.03 }); s.hit(T_LAND, { d: 0.22, vol: 0.008, lp: 1400, hp: 500, attack: 0.01 });
    whistle(T_LAND + 0.9, 0.011);
    // after that, now and then
    const again = [], take = (fn, ...a) => { const n0 = s.ev.length; fn(...a); again.push(...s.ev.splice(n0)); };
    take(dove, 1.2, 0.024); take(bobwhite, 5.4, 0.012); take(cardinal, 8.6, 0.01); take(warbler, 11.6, 0.006); take(whistle, 13.8, 0.008); take(wren, 16.2, 0.008);
    s.loop(9.6, 18.5, again);
    return s.done();
  },

  hideAll() {
    this.cards.count = 0; this.cards.visible = false; this.trunks.visible = false; this.land.material.visible = false;
    this.grow.fill(0); this.open.fill(0); this.sway.fill(0); this.tu.uDip.value = 0;
    this.lu.uShow.value.set(0, 0, 0, 0); this.lu.uDay.value.set(0, TOP, 0);
    this.bird.on = false;
  },
  start(L, resumed) { if (!resumed) this.hideAll(); this.band.from(L.t); this.land.material.visible = true; this.trunks.visible = true; },
  back(L) {
    const S = this.S0; S.t = L.t; S.grow.set(this.grow); S.open.set(this.open); S.far = this.farK || 0;
    const sh = this.lu.uShow.value; S.spread = sh.x; S.sky = sh.y; S.pink = sh.z; S.gold = sh.w; S.day = this.lu.uDay.value.x; S.sun = this.sunQ || 0;
    S.landed = this.bird.on && L.t >= T_LAND; S.birdOn = this.bird.on; this.bird.from.copy(this.bird.p); S.birdS = this.bird.s;
  },
  end(L) { this.hideAll(); },
  reset(L) { this.hideAll(); },

  // ---------------------------------------------------------------- one card: into the scratch rows
  put(cell, x, y, z, sx, sy, yaw, pitch, roll, c, a, keep = 1, flip = 1) {
    if (a <= 0.01 || this.n >= MAXC) return;
    this.e4.set(pitch, yaw, roll, 'YXZ'); this.q4.setFromEuler(this.e4);
    this.m4.compose(this.v.set(x, y, z), this.q4, this.s4.set(sx, sy, 1));
    this.putM(cell, this.m4, c, a, keep, flip);
  },
  putM(cell, m, c, a, keep = 1, flip = 1) {
    if (a <= 0.01 || this.n >= MAXC) return;
    const n = this.n++; this.pm.set(m.elements, n * 16);
    this.pi[n * 4] = cell; this.pi[n * 4 + 1] = a; this.pi[n * 4 + 2] = keep; this.pi[n * 4 + 3] = flip;
    this.pc[n * 3] = c.r; this.pc[n * 3 + 1] = c.g; this.pc[n * 3 + 2] = c.b;
  },
  flush(cam) {
    const n = this.n, e = cam.matrixWorld.elements, fx = -e[8], fy = -e[9], fz = -e[10], ord = this.order; ord.length = n;
    for (let i = 0; i < n; i++) { ord[i] = i; const o = i * 16; this.dep[i] = (this.pm[o + 12] - cam.position.x) * fx + (this.pm[o + 13] - cam.position.y) * fy + (this.pm[o + 14] - cam.position.z) * fz; }
    ord.sort(this.byDepth);
    const M = this.cards.instanceMatrix.array, I = this.aInfo.array, C = this.aCol.array;
    for (let j = 0; j < n; j++) {
      const i = ord[j];
      for (let k = 0; k < 16; k++) M[j * 16 + k] = this.pm[i * 16 + k];
      for (let k = 0; k < 4; k++) I[j * 4 + k] = this.pi[i * 4 + k];
      for (let k = 0; k < 3; k++) C[j * 3 + k] = this.pc[i * 3 + k];
    }
    this.cards.count = n; this.cards.visible = n > 0;
    this.cards.instanceMatrix.needsUpdate = true; this.aInfo.needsUpdate = true; this.aCol.needsUpdate = true;
  },

  update(L, dt) {
    const ph = L.phase, t = L.t, showing = ph === 'wake' || ph === 'play', back = ph === 'return', r = L.ret, calm = L.calm, S = this.S0;
    const cam = L.k.G.camera, C = this.C, c = this.c, v = this.v, yo = L.yawOut, foot = this.foot;
    const time = showing ? t : S.t + r * 2.4;
    const sunD = calm ? 3.6 : 2.4;                 // how long the light takes to come down the grove
    // ---- the envelopes: growing while it shows; going home at the Return
    let far, spread, sky, pink, sunQ, day, gold;
    if (showing) {
      for (let i = 0; i < NT; i++) { const T = TREES[i]; this.grow[i] = ease.out(ramp(t, T.t0, T.t0 + T.d)); this.open[i] = sm(t, T.t0 + T.d * 0.62, T.t0 + T.d * 0.62 + 1.25); }
      far = sm(t, 1.0, 2.5); spread = ease.out(ramp(t, 0, 1.6)); sky = sm(t, 0.1, 2.1);
      pink = sm(t, T_SUN - 1.7, T_SUN + 0.5); sunQ = ramp(t, T_SUN, T_SUN + sunD); day = sm(t, T_SUN - 0.8, T_SUN + sunD + 0.4);
    } else {
      const dusk = 1 - ease.inOut(ramp(r, 0, 0.5));
      for (let i = 0; i < NT; i++) { this.open[i] = S.open[i] * (1 - ease.inOut(ramp(r, 0.16 + 0.03 * i, 0.6 + 0.03 * i))); this.grow[i] = S.grow[i] * (1 - ease.inOut(ramp(r, 0.36 + 0.03 * i, 0.9 + 0.015 * i))); }
      far = S.far * (1 - sm(r, 0.3, 0.72)); spread = S.spread * (1 - ease.inOut(ramp(r, 0.5, 1))); sky = S.sky * (1 - ease.inOut(ramp(r, 0.4, 0.98)));
      pink = S.pink * dusk; sunQ = S.sun * dusk; day = S.day * dusk;
    }
    this.farK = far; this.sunQ = sunQ;
    const lightH = lerp(TOP, -0.35, ease.inOut(sunQ));
    gold = 1 - sm(lightH, -0.25, 0.2);
    this.lu.uShow.value.set(spread, sky, pink, gold); this.lu.uDay.value.set(day, lightH, time);
    const swayK = calm ? 0.5 : 1;
    for (let i = 0; i < NT; i++) this.sway[i] = TREES[i].amp * Math.sin(time * TREES[i].w + i * 1.9) * swayK * this.grow[i];
    const litAt = h => sm(h, lightH - 0.1, lightH + 0.45), edgeAt = h => Math.exp(-Math.pow((h - lightH - 0.12) / 0.22, 2));

    // ---- the bird: where it is, and whether it has come down
    const landed = showing ? t >= T_LAND : S.landed && r < 0.06;
    const since = t - T_LAND;
    const dip = showing && t >= T_LAND ? (calm ? 0.01 * Math.exp(-since * 2.2) + 0.004 : 0.016 * Math.exp(-since * 3) * Math.cos(since * 11) + 0.004)
      : back && S.landed ? 0.004 * (1 - ramp(r, 0.04, 0.1)) + (calm ? 0 : -0.007 * Math.exp(-Math.max(0, r - 0.07) * 14) * Math.sin(Math.max(0, r - 0.07) * 40)) : 0;
    this.tu.uDip.value = dip;

    this.n = 0;
    // ---- his clouds on the sky: grey, then the first things to go pink, drifting a little
    if (sky > 0.01) for (const q of this.clouds) {
      c.copy(C.cloudN).lerp(C.cloudP, pink).lerp(C.cloudD, day * 0.45);
      L.at(q.u + 0.05 * Math.sin(time * 0.07 * swayK + q.k * 6) * (0.6 + 0.8 * q.k), q.h - foot, q.o, v);
      this.put(C_CLOUD, v.x, v.y, v.z, q.w * 1.3, q.hh * 3.4, yo, 0, 0, c, sky * (0.3 + 0.55 * pink), 0, q.flip);
    }
    // ---- far off, over the skirting at the foot of the wall: his screen of pines, their crowns run together, the roofs
    if (far > 0.01) {
      const liF = litAt(0.75);
      c.copy(C.farN).lerp(C.farD, day * 0.85).lerp(C.farL, liF * 0.4);
      for (const z of this.hazes) { L.at(z.u, z.h - foot, z.o, v); this.put(C_BLOB, v.x, v.y, v.z, z.w * 1.5, z.hh * 1.5, yo, 0, 0, c, far * 0.72, 0, 1); }
      for (const f of this.far) {
        const hh = f.h - SKIRT, li = litAt(f.h - 0.1);
        c.copy(C.farN).lerp(f.back ? C.farD : C.stemD, day * 0.5).lerp(C.farD, day * 0.45).lerp(C.farL, li * (0.25 + 0.5 * f.k));
        L.at(f.u, SKIRT + hh * 0.5 - 0.01 - foot, f.o, v);
        this.put(f.cell, v.x, v.y, v.z, (hh * 0.72 + 0.06) * f.wide, hh * (0.92 + 0.08 * far) * 1.03, yo, 0, f.roll, c, far * (f.back ? 0.6 : 0.92), 0.9, f.flip);
      }
      const li = 1 - sm(lightH, 0.1, 0.62);              // the roofs are low: the last things the light comes to
      c.copy(C.farN).lerp(C.farG, day * 0.85).lerp(C.farGL, li * 0.7);
      for (const gu of [-0.52, -0.1, 0.32, 0.7]) { L.at(gu, SKIRT + 0.012 - foot, -L.wall + 0.0225, v); this.put(C_BLOB, v.x, v.y, v.z, 0.62, 0.11, yo, 0, 0, c, far * 0.85, 0, 1); }
      for (const q of this.roofs) {
        if (q.kind === 1) c.copy(C.roofN).lerp(C.tin, day * 0.6).lerp(C.gableL, li);
        else if (q.kind === 2) c.copy(C.roofN).lerp(C.tin, day * 0.75).lerp(C.tinL, li * 0.7);
        else c.copy(C.roofN).lerp(C.roofD, day * 0.6).lerp(C.roofL, li);
        // (the roof is the middle half of its card)
        if (q.kind === 1) { L.at(q.u, SKIRT + 0.012 + q.h * 0.5 - foot, q.o, v); this.put(C_GABLE, v.x, v.y, v.z, q.w / 0.6, q.h / 0.66, yo, 0, 0, c, far * 0.82, 0.6, 1); }
        else { L.at(q.u, SKIRT + 0.012 + q.h * 0.5 - foot, q.o, v); this.put(C_ROOF, v.x, v.y - q.h * 0.1, v.z, q.w / 0.84, q.h / 0.52, yo, 0, 0, c, far * 0.82, 0.6, 1); }
      }
    }
    // ---- the crowns: each dab out of its trunk's tip, and breathing
    for (const d of this.dabs) {
      const o = this.open[d.tree]; if (o <= 0.01) continue;
      const k = ease.smooth(clamp01((o - d.late * 0.45) / 0.55)); if (k <= 0.01) continue;
      const sw = this.sway[d.tree] + 0.006 * swayK * Math.sin(time * 1.3 + d.ph), bob = 0.004 * swayK * Math.sin(time * 0.9 + d.ph * 1.7);
      const u = lerp(d.tu, d.u, k) + sw, h = lerp(d.th, d.h, k) + bob, li = litAt(h) * (0.35 + 0.65 * d.lit), ed = edgeAt(h);
      c.copy(d.cn).lerp(d.cd, day * 0.85).lerp(d.cl, li).lerp(C.rose, ed * 0.14 * (0.3 + 0.7 * d.lit));
      L.at(u, h - foot, d.o * k, v);
      const s = d.s * (0.35 + 0.65 * k);
      this.put(d.cell, v.x, v.y, v.z, s * 1.3, s, yo + d.yaw, d.pitch, d.roll + 0.03 * swayK * Math.sin(time * 1.1 + d.ph), c, d.a * Math.min(1, k * 1.6), d.keep, d.flip);
    }
    // ---- the lit grass along the foot of the wall, the dark clumps at the trunks' feet, and the tuft where his water
    // begins, with its yellow flowers
    for (const q of this.grass) {
      const k = sm(spread, 0.1 + 0.3 * q.k, 0.55 + 0.3 * q.k); if (k <= 0.01) continue;
      c.copy(C.grassN).lerp(C.grass, day * 0.9 + 0.1).lerp(q.k < 0.5 ? C.grassL : C.grassL2, gold * (0.35 + 0.65 * q.lit));
      L.floor(q.u, q.o, v); this.put(C_TUFT, v.x, v.y + q.h * 0.47 * k, v.z, q.w, q.h * k, yo + (q.k - 0.5) * 0.5, 0, 0.02 * swayK * Math.sin(time * 1.1 + q.ph), c, k, 0.75, q.flip);
    }
    for (let i = 0; i < this.shrubs.length; i++) {
      const s = this.shrubs[i], k = sm(spread, 0.25 + 0.4 * s.o, 0.6 + 0.4 * s.o); if (k <= 0.01) continue;
      c.copy(C.shrubN).lerp(C.shrub, day * 0.9 + 0.1);
      L.floor(s.u, s.o, v); this.put(C_SHRUB, v.x, v.y + s.s * 0.33 * k, v.z, s.s * 1.5, s.s * 0.75 * k, yo, 0, 0, c, k, 0.85, s.flip);
    }
    {
      const k = sm(spread, 0.7, 1); if (k > 0.01) {
        c.copy(C.tuftN).lerp(C.tuft, day * 0.9 + 0.1).lerp(C.tuftL, gold * 0.5);
        L.floor(TUFT.u, TUFT.o, v); const lean = 0.03 * swayK * Math.sin(time * 1.2);
        this.put(C_TUFT, v.x, v.y + 0.085 * k, v.z, 0.26, 0.18 * k, yo + 0.25, 0, lean, c, k, 0.9, 1);
        this.put(C_TUFT, v.x + L.tx * 0.03, v.y + 0.075 * k, v.z + L.tz * 0.03, 0.24, 0.16 * k, yo - 0.9, 0, -lean, c, k, 0.9, -1);
        for (const f of this.flowers) {
          const fk = (calm ? ease.smooth : ease.outBack)(clamp01((gold - 0.25 - 0.5 * f.k) / 0.25)) * k; if (fk <= 0.01) continue;
          L.floor(f.u, f.o, v); this.put(C_DOT, v.x + L.tx * lean * f.h, v.y + f.h, v.z + L.tz * lean * f.h, f.s * 2.6 * fk, f.s * 2.6 * fk, yo, 0, 0, C.flower, Math.min(1, fk), 0, 1);
        }
      }
    }
    // ---- the bare tree's twigs and buds
    {
      const g = this.grow[BARE], sw = this.sway[BARE];
      for (const [u, h, s, turn, dp] of this.twigs) {
        const k = sm(g, h / BARE_H - 0.02, h / BARE_H + 0.08); if (k <= 0.01) continue;
        c.copy(C.twigN).lerp(C.twig, day * 0.8 + litAt(h) * 0.2);
        L.at(u + sw, h + s * 0.5 * k - dp * dip - foot, TRUNK_O + 0.014, v);
        this.put(C_TWIG, v.x, v.y, v.z, s * k, s * k, yo, 0, turn, c, k, 0, 1);
      }
      for (const b of this.buds) {
        const k = sm(g, b.h / BARE_H - 0.02, b.h / BARE_H + 0.06) * (0.55 + 0.45 * litAt(b.h)); if (k <= 0.01) continue;
        c.copy(C.twigN).lerp(C.bud, 0.25 + 0.75 * Math.max(day * 0.6, litAt(b.h)));
        L.at(b.u + sw, b.h - b.dip * dip - foot, TRUNK_O + 0.018, v);
        this.put(C_DOT, v.x, v.y, v.z, b.s * 2.4 * k, b.s * 2.4 * k, yo, 0, 0, c, 0.95, 0, 1);
      }
    }
    // ---- the bird
    this.stepBird(L, t, showing, back, r, calm, landed, dip, day);
    this.flush(cam);
    if (showing) this.band.play(t);
  },

  // The bird: far and small in the sky on the wall, once round over the room, down to the tall pine's stub; at the Return, up
  // and back into that sky. Three cards while it flies (body, two wings), one when it sits.
  stepBird(L, t, showing, back, r, calm, landed, dip, day) {
    const B = this.bird, C = this.C, c = this.c, S = this.S0, v = this.v;
    let flying = false, s = 0, scale = 1, alpha = 1, flap = 0, pitch = 0, lit = 0;
    if (showing && t >= T_BIRD && !landed) {
      const q = (t - T_BIRD) / (T_LAND - T_BIRD);
      // slow while it is far, an even glide, and slower again as it comes in
      s = clamp01(0.5 * (ease.smooth(q) + q) * 0.55 + 0.45 * ease.inOut(q));
      this.way.at(s, B.p); this.way.dir(Math.min(0.995, s), B.d);
      scale = 0.2 + 0.8 * sm(q, 0, 0.3); alpha = sm(q, 0, 0.1);
      const beat = calm ? 5 : 8.5;
      // a few slow beats as it comes out, then it glides; at the end it throws its wings up and back-beats to stop
      const brake = sm(q, 0.86, 0.97);
      flap = (0.42 * (1 - sm(q, 0.12, 0.3)) + 0.08) * Math.sin(t * beat) * (1 - brake) + brake * (0.2 + 0.32 * Math.sin(t * beat * 1.5));
      pitch = brake * 0.9; lit = sm(t, T_SUN - 0.9, T_SUN - 0.1);
      flying = true;
    } else if (showing && landed) {
      B.p.copy(this.perch); B.p.y -= dip; lit = 1;
    } else if (back && S.birdOn) {
      // up off the branch (or from wherever it was) and back into the sky
      const q = ramp(r, 0.05, 0.62), e = ease.inOut(q);
      if (q <= 0) { if (S.landed) { B.p.copy(this.perch); B.p.y -= dip; lit = 1; } else { B.p.copy(B.from); flying = true; lit = 1; scale = S.birdS; } }
      else if (q < 1) {
        B.p.lerpVectors(B.from, B.home, e); B.p.y += 0.3 * Math.sin(Math.PI * e) * (S.landed ? 1 : 0.4);
        B.d.subVectors(B.home, B.from); B.d.y = 0; if (B.d.lengthSq() < 1e-6) B.d.set(L.nx, 0, L.nz); B.d.normalize();
        scale = lerp(S.landed ? 1 : S.birdS, 0.2, sm(q, 0.45, 1)); alpha = 1 - sm(q, 0.82, 1);
        flap = (0.6 * (1 - sm(q, 0.35, 0.7)) + 0.1) * Math.sin(r * 2.4 * (calm ? 5 : 9)); pitch = 0.3 * (1 - sm(q, 0, 0.4)); lit = 1 - sm(r, 0.1, 0.5) * 0.8;
        flying = true;
      } else { B.on = false; return; }
    } else { B.on = false; return; }
    B.on = true; B.s = scale;
    c.copy(C.birdN).lerp(C.birdD, day * 0.5).lerp(C.birdL, lit);
    if (!flying) {
      // at rest on the stub, looking in towards the picture; now and then it shifts
      const tilt = 0.05 * Math.sin(t * 0.7) + (calm ? 0 : 0.06 * Math.exp(-Math.max(0, t - T_LAND) * 3) * Math.sin((t - T_LAND) * 9));
      this.put(C_PERCH, B.p.x, B.p.y + 0.1, B.p.z, 0.21, 0.23, L.yawOut, 0, tilt, c, 1, 1, -1);
      return;
    }
    // its frame: z the way it flies, y up, banked into its turn
    const yaw = Math.atan2(B.d.x, B.d.z), span = 0.225 * scale, chord = 0.125 * scale, cam = L.k.G.camera;
    // it leans into its turn; and (a painter's licence) it shows whoever is looking a little more of its wings than it would
    const rx = Math.cos(yaw), rz = -Math.sin(yaw), dx = cam.position.x - B.p.x, dz = cam.position.z - B.p.z, dl = Math.hypot(dx, dz) || 1;
    const toward = (dx * rx + dz * rz) / dl, bank = (showing ? -this.way.bank(s) * 0.3 : 0) + 0.12 * toward * (1 - pitch);
    this.e4.set(-Math.asin(Math.max(-0.6, Math.min(0.6, B.d.y))) - pitch, yaw, bank, 'YXZ'); this.q4.setFromEuler(this.e4);
    this.mB.compose(B.p, this.q4, this.s4.set(1, 1, 1));
    // the body lies along z (its head forward)
    this.e4.set(Math.PI / 2, 0, 0, 'YXZ'); this.q4.setFromEuler(this.e4); this.mT.compose(v.set(0, 0, -0.01 * scale), this.q4, this.s4.set(0.14 * scale, 0.215 * scale, 1));
    this.m4.multiplyMatrices(this.mB, this.mT); this.putM(C_BODY, this.m4, c, alpha, 1, 1);
    for (const side of [1, -1]) {
      // a wing: hinged along the body, raised by the dihedral and the beat, its root at the body
      const up = 0.2 + flap;
      this.e4.set(0, 0, side * up, 'YXZ'); this.q4.setFromEuler(this.e4); this.mT.compose(v.set(0, 0, 0), this.q4, this.s4.set(1, 1, 1));
      this.m4.multiplyMatrices(this.mB, this.mT);
      this.e4.set(Math.PI / 2, 0, 0, 'YXZ'); this.q4.setFromEuler(this.e4); this.mT.compose(v.set(side * span * 0.5, 0, 0.012 * scale), this.q4, this.s4.set(span, chord, 1));
      this.m4.multiply(this.mT); this.putM(C_WING, this.m4, c, alpha, 1, side);
    }
  },
});
