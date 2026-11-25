// Apollonio di Giovanni, The Adventures of Ulysses (1435–45), Gallery 238. The word: home.
//
// A long, low panel in tempera and gold: the front of a cassone, the chest a Florentine bride brought to her new
// house, which then stood in the couple's bedchamber. It tells the Odyssey the way such chests do, all at once and
// from left to right: the far, strange places on the left (grey stepped rocks with white sheep on them, a round
// island with a dark tree where timber is being cut for a boat, a dark ship in a gold net on a pale green sea combed
// with the winds' dark breath), and on the right the house. In the house, open at the front like a toy, a woman in
// gold sits weaving at a great gilt loom, and the painter wrote her name on its beam: PENELOPE. The museum's words:
// "Ulysses's committed quest to return home and his wife Penelope's faithfulness in his absence served as models of
// devotion and marital fidelity." So the whole length of the panel is one direction, and it is the word a bride's
// chest was painted to say: home.
//
// Look at it and his sea is laid along the floor under the picture from left to right, as the story is read: flat
// pale green in level touches, the dark combed streaks drifting over it. The places stand up out of it as it reaches
// them, in his bright toy manner: the rocks, block on block, with three sheep; the round island with its tree, its
// gold leaves, the stumps and the cut timbers; and at the right, under the right half of the panel where he put it, the
// white house with the gold loom, the weaver at work in it (beater, heddles, her hands), a small white dog on the
// shore. Then the one thing that travels: the dark ship in its gold net comes in at the far left end under a white
// lateen sail, three men low in her waist and one in gold with a tall gold hat standing at the mast, and makes her
// way along the whole sea, past the sheep (they turn to watch), past the island (the leaves catch the light), towards
// the house. The loom keeps time for her all the way. The dog sees her first: it runs down to the water and jumps.
// The yard comes part of the way down, she loses way, and her bow touches the shore. The loom stops; the weaver lifts her head and
// looks; warm gold light comes up in the house and lies on the water; a fiddle's open strings sound. That is the
// moment, and the eye goes back up to the panel, right of its middle, to the loom with a name on it. While you keep
// looking she rides at the shore, the dog cannot keep still, and after a while the loom starts again, slower.
// When you stop, the sea is taken up again from right to left and everything goes with it.
//
// What is ours and what is his: the ship, the net, the men's hats, the sheep, the island, the house, the loom, the
// dog and the far boats with white sails are all on the panel; the white sail on the ship is taken from his raft and
// his far boats (his ship shows a bare mast), and the homecoming itself, a ship touching the shore by the house, is
// not painted there: the caption does not say it is. The sounds are ours, not a tune: the loom's throw and beat, three
// held notes on the way and an open fifth at the shore (the feast in the picture has a fiddler), two small yips.
//
// Everything is small and near the floor: nothing stands higher than 0.55 m (her masthead), under a panel hung at
// 1.41 m, and the whole of it keeps within 1.5 m of the picture's middle on the left and 1.3 m on the right: it stops
// where the Sano di Pietro's frame begins (a sacred picture: nothing stands under it, is aimed at it or lit by this)
// and well short of the Susanna panel. Nothing is solid, nothing is
// pushed or collected, and nothing stays out after the look. The panel is long and low, so the look camera stands
// back just far enough to keep the whole of it in view, further on a phone held upright; there the rocks are off the
// left of the screen (the ship comes in from the edge), and the island, the ship's last stretch, the dog and the house
// are in it. Three draw calls: the sea (one flat mesh, one shader: his touches, the combed streaks, the land's flat
// grey shapes, the shadows, the gold light), a rig (rocks, timbers, house, loom, hull, spars, sail) and his marks
// (foliage and gold leaves, sheep, dog, the people, the net, the threads, the far sails: soft cards, one instanced
// shader, drawn far to near). With "Reduce motion and flashing": things rise without a spring, the ship and the dog
// move more gently, the leaves do not glitter, the light comes up twice as slowly and every sound is quieter.
//
// The people are small clothed figures in his own flat marks, doing ordinary things: three sailors sitting, one man
// standing at the mast with a hand on it, a woman weaving. None has a drawn face.
//
// What it does not do: none of the Odyssey's violence or danger is shown, acted or hinted (no giant, no blinding, no
// wreck, nobody in the water, no fight, no feast and no bow), the sirens, Circe and her beasts and the blowing heads
// of the winds stay in the picture (unclothed figures and spirits are not ours to model: only the winds' streaks are
// on the water), nobody is tied to the mast, and what the weaver is weaving is not named.
import * as THREE from 'three';
import { lifeFor, ease, ramp, lerp, clamp01, shape, canvasTexture } from '../paintlife.js';
import { strokes as brushTex } from './brush.js';
import { score, hz } from './stagecraft.js';

const TAU = Math.PI * 2, MAXC = 260, K = 1.15;                 // K: the whole scene's size (stage units to metres)
const T0 = 1.0, TA = 6.9, BEAT = 0.8;                         // the ship sets out; her bow touches; the loom's beat
const X0 = -1.24, X1 = 1.02;                                   // the sea, along the wall
const ISLE = [-0.53, 0.38, 0.16, 0.14], ROCKS = [-0.94, 0.42, 0.23, 0.24], SHORE = [0.45, 0.31, 0.43, 0.25, 0.09];
const HOUSE = [0.42, 0.29, -0.2], TREE = [-0.57, 0.35], BUSH = [0.79, 0.39], DOG0 = [0.32, 0.5], DOG1 = [0.09, 0.5];
const PATH = [[-1.2, 0.84], [-0.95, 0.88], [-0.7, 0.84], [-0.5, 0.79], [-0.33, 0.72], [-0.19, 0.655]];
// his rocks: flat-topped blocks, stepped [u, out, radius, height, sides, turn]
const BLOCKS = [[-1.0, 0.33, 0.12, 0.3, 7, 0.3], [-0.88, 0.27, 0.1, 0.22, 6, 1.1], [-0.95, 0.5, 0.12, 0.17, 7, 0.7], [-0.82, 0.44, 0.09, 0.11, 6, 0.2], [-1.08, 0.52, 0.08, 0.08, 6, 0.9], [-0.84, 0.58, 0.07, 0.05, 6, 0.5]];
const SHEEP = [[-0.95, 0.52, 0.17, 1], [-0.82, 0.45, 0.11, -1], [-0.89, 0.28, 0.22, 1]], ON_BLOCK = [2, 3, 1];
const FAR = [[-0.74, 0.09, 0.06, 0.008], [-0.26, 0.13, 0.07, 0.012]], SIDES = [-0.071, 0.071], LEGS = [-0.011, 0.012], HEDDLES = [[-0.075, 1], [-0.035, -1]];
// the three men in the ship's waist: [along, across, coat, hat's colour, hat (true: the tall one), the hat's own light and shade, how high he sits, his lean]
const CREW = [[0.012, 0.022, 'red', 'gold', true, 0.9, 0.012, 0.1], [0.062, -0.014, 'blue', 'black', false, 0.5, 0, -0.06], [0.106, 0.018, 'black', 'red', false, 0.9, 0.006, -0.16]];
// the cells of the marks' atlas (4 x 4)
const DAB = 0, STROKE = 1, SPRIG = 2, EWE = 3, DOG = 4, HEAD = 5, HAT = 6, ROBE = 7, NET = 8, GRID = 9, WARP = 10, LATEEN = 11, CAP = 12, TUFT = 13, TUNIC = 14, BUST = 15;

const _m = new THREE.Matrix4(), _l = new THREE.Matrix4(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3();
const I4 = new THREE.Matrix4();
// out = parent * (place, turn YXZ, scale)
function local(out, parent, x, y, z, yaw = 0, pitch = 0, roll = 0, sx = 1, sy = sx, sz = sx) {
  _e.set(pitch, yaw, roll, 'YXZ'); _l.compose(_v.set(x, y, z), _q.setFromEuler(_e), _s.set(sx, sy, sz));
  return out.multiplyMatrices(parent, _l);
}
// every vertex its own colour: fn(position, normal) -> a colour
function tint(g, fn) {
  const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, P = new THREE.Vector3(), N = new THREE.Vector3(), K = new THREE.Color();
  for (let i = 0; i < p.count; i++) { K.set(fn(P.fromBufferAttribute(p, i), N.fromBufferAttribute(n, i))); c.setXYZ(i, K.r, K.g, K.b); }
  return g;
}
// a smooth skin over rows of points (each row the same length), as the rig wants it: non-indexed, with colours
function loft(rows) {
  const n = rows.length, m = rows[0].length, pos = [], idx = [];
  for (const r of rows) for (const p of r) pos.push(p[0], p[1], p[2]);
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < m - 1; j++) { const a = i * m + j, b = a + m; idx.push(a, b, b + 1, a, b + 1, a + 1); }
  let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  g = g.toNonIndexed(); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
  return g;
}

lifeFor(110760, {
  title: /^The Adventures of Ulysses/,
  word: 'home',
  stage: { out: 1.3, half: 1.4, cam: { dist: 2.4, side: 0.22, height: 0.84, fov: 56, lookU: -0.1, lookOut: 0.5, floorOut: 1.26 } },
  wake: 2, ret: 2.2,

  build(L) {
    const col = (hex, pull = 0.22, lift = 0) => { const c = L.pal.near(hex, pull); return lift ? c.lerp(new THREE.Color('#ffffff'), lift) : c; };
    const C = this.C = {
      seaLo: col('#74857a', 0.1), pale: col('#aab3a0', 0.1), deep: col('#2c4443', 0.1), land: col('#b4b0a0'), rim: col('#6a6557'), goldSea: col('#d9a13c', 0.1),
      rockTop: col('#c6c1ae'), rockHi: col('#9d9887'), rockLo: col('#5c574c'),
      leaf: col('#1d2415'), leaf2: col('#2e3519'), leaf3: col('#3d4420'), gold: col('#c48c2a', 0.08), goldHi: col('#ecc058', 0.08), goldLo: col('#946620', 0.1),
      wood: col('#c98a3e', 0.15), woodHi: col('#e0a856', 0.15), woodDk: col('#3a2a1c'), plank: col('#d79a52', 0.15),
      wall: col('#e6e0cd', 0.1), wallSh: col('#c4bfae', 0.1), inside: col('#8d9693'), carpet: col('#9a4034'),
      hull: col('#18222c'), hullHi: col('#2c3b48'), deck: col('#4a3a2a'), sail: col('#f1ebdb', 0.05), sailSh: col('#bdb8a6'),
      wool: col('#e6e0cf'), skin: col('#dcb394', 0.1), hair: col('#a87a34', 0.1), red: col('#a23b2b'), blue: col('#3f6f86'), black: col('#1b1a1c'), cloth: col('#e4dccb'),
      foam: col('#dfe9dc'), light: col('#f1c56a', 0.05),
    };
    this.org = L.floor(0, 0); this.cam = new THREE.Vector3();
    const stage = o => { o.position.copy(this.org); o.rotation.y = L.yawOut; o.scale.setScalar(K); return o; };
    this.buildSea(L, C, stage); this.buildRig(L, C, stage); this.buildCards(L, C, stage);
    this.curve = new THREE.CatmullRomCurve3(PATH.map(p => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal'); this.curve.arcLengthDivisions = 200; this.curve.updateArcLengths();
    this.M = { ship: new THREE.Matrix4(), yard: new THREE.Matrix4(), house: new THREE.Matrix4(), tree: new THREE.Matrix4(), bush: new THREE.Matrix4(), t: new THREE.Matrix4() };
    // the sounds, on the show's own clock: the loom keeps time for the voyage and stops when she touches
    const s = score(L);
    s.hit(0.15, { d: 1.4, vol: 0.011, lp: 900, attack: 0.5 });
    for (let t = 1.7; t < TA - 0.25; t += BEAT) { s.hit(t, { d: 0.05, vol: 0.009, bp: 2600, q: 3, attack: 0.004 }); s.hit(t + BEAT / 2, { d: 0.09, vol: 0.015, bp: 640, q: 2.5, attack: 0.004 }); }
    s.loop(TA + 3.2, 1.3, [{ t: 0, noise: true, d: 0.05, vol: 0.006, bp: 2600, q: 3, attack: 0.004 }, { t: 0.65, noise: true, d: 0.09, vol: 0.01, bp: 640, q: 2.5, attack: 0.004 }]);
    s.loop(1.2, 2.3, [{ t: 0, noise: true, d: 0.9, vol: 0.006, lp: 520, attack: 0.4 }]);                       // the water, lapping
    [[1.9, 62], [3.6, 65], [5.3, 64]].forEach(([t, m]) => s.note(t, hz(m), 1.2, { vol: 0.017, type: 'triangle', attack: 0.14 }));
    [55, 62, 67].forEach((m, i) => s.note(TA + 0.12 + i * 0.14, hz(m), 2.8, { vol: 0.019, type: 'triangle', attack: 0.3, over: 2, overVol: 0.18 }));
    this.band = s.done();
    this.fitCam(L);
  },

  // The panel is long and low: the look camera keeps the whole of it in view whatever the screen's shape, standing
  // further back (and square on) when the screen is narrow, as a phone held upright is.
  fitCam(L) {
    const fc = L.cam || (L.art.floorFrame && L.art.floorFrame.cam), cam = L.k.G.camera, a = (cam && cam.aspect) || 1.6;
    if (!fc || a === this.asp) return;
    this.asp = a; if (!this.cam0) this.cam0 = { ...fc };
    const c0 = this.cam0, th = Math.tan(c0.fov * Math.PI / 360), need = (L.hw + L.fw + 0.3) / (th * a);      // (the panel, its frame, and room beside it for the house on the floor, which is nearer the eye)
    if (need <= c0.dist) { Object.assign(fc, c0); return; }
    const k = clamp01((need - c0.dist) / 0.5), D = Math.min(need, 5.5), F = c0.fov * Math.PI / 180 * 0.94, H = c0.height + 0.12 * k;
    fc.dist = D; fc.height = H; fc.side = c0.side * (1 - k); fc.lookU = c0.lookU * (1 - k);
    // (a tall screen has height to spare: the panel and the floor in front are set about its middle, never cropped)
    const top = Math.atan2(L.crown + 0.1 - L.y - H, D), low = -Math.atan2(H, D - 1.4), pitch = Math.max(top - F / 2, Math.min(low + F / 2, (top + low) / 2));
    fc.lookH = H + Math.tan(pitch) * (D - fc.lookOut);
  },

  // ---------------------------------------------------------------- the sea and the land: one flat mesh, one shader
  buildSea(L, C, stage) {
    const sea = brushTex({ size: 256, seed: 110760, n: 2200, len: [22, 64], width: [2, 5], bend: 0.08, lift: 0.05, base: C.seaLo.getStyle(),
      colors: [['#74857a', 3], ['#7e8f82', 3], ['#6a7d74', 2], ['#8a9b8a', 1.6], ['#62766e', 1]].map(([c, w]) => [L.pal.near(c, 0.1).getStyle(), w]), angle: (x, y, r) => (r() - 0.5) * 0.12 });
    // soft noise, for every ragged edge (tiles)
    const nz = canvasTexture(128, 128, (c, w, h) => {
      c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'lighter';
      for (const [ch, n, r0, r1] of [['255,0,0', 26, 10, 26], ['0,255,0', 12, 14, 30], ['0,0,255', 40, 5, 12]]) for (let i = 0; i < n; i++) {
        const x = L.rand() * w, y = L.rand() * h, rx = r0 + L.rand() * (r1 - r0), a = 0.2 + 0.3 * L.rand();
        for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { const gr = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rx); gr.addColorStop(0, `rgba(${ch},${a})`); gr.addColorStop(1, `rgba(${ch},0)`); c.fillStyle = gr; c.beginPath(); c.arc(x + ox, y + oy, rx, 0, TAU); c.fill(); }
      }
    }, false);
    // the winds' breath: fans of dark combed streaks, each tapering to nothing downwind (tiles)
    const comb = canvasTexture(256, 256, (c, w, h) => {
      c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.lineCap = 'round';
      for (const [x, y, len, n] of [[18, 44, 150, 6], [120, 128, 132, 5], [40, 212, 160, 7]]) for (let i = 0; i < n; i++) {
        const k = i / (n - 1) - 0.5, l = len * (0.62 + 0.38 * L.rand()), y1 = y + k * 74 + (L.rand() - 0.5) * 6;
        for (const ox of [-w, 0, w]) for (let s = 0; s < 14; s++) {
          const q0 = s / 14, q1 = (s + 1) / 14, a = Math.sin(Math.PI * Math.min(1, q0 * 1.7 + 0.12)) * (1 - q0 * 0.55);
          c.strokeStyle = `rgba(255,255,255,${0.95 * a})`; c.lineWidth = 1.4 + 2.8 * (1 - q0) * (0.6 + 0.4 * L.rand());
          c.beginPath(); c.moveTo(x + ox + l * q0, lerp(y + k * 30, y1, q0)); c.lineTo(x + ox + l * q1, lerp(y + k * 30, y1, q1)); c.stroke();
        }
      }
    }, false);
    for (const t of [nz, comb]) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    comb.anisotropy = 8;
    const u = this.su = {
      uO: { value: this.org.clone() }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) },
      uShow: { value: new THREE.Vector4(-9, 0, 0, 0) },            // how far the sea has been laid (along the wall), the gold light, time
      uShip: { value: new THREE.Vector4(0, 0, 0, 0) }, uHead: { value: new THREE.Vector2(1, 0) },
      tSea: { value: sea }, tNz: { value: nz }, tComb: { value: comb },
      cPale: { value: C.pale }, cDeep: { value: C.deep }, cLand: { value: C.land }, cRim: { value: C.rim }, cGold: { value: C.goldSea },
    };
    const g = new THREE.PlaneGeometry(2.44, 1.3); g.rotateX(-Math.PI / 2); g.translate(-0.08, 0.011, 0.65);
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false });
    const f = n => n.toFixed(3);
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform vec3 uO, cPale, cDeep, cLand, cRim, cGold; uniform vec4 uAx, uShow, uShip; uniform vec2 uHead; uniform sampler2D tSea, tNz, tComb;
vec3 fCol; float fA;
float sdEl(vec2 p, vec4 e) { return (length((p - e.xy) / e.zw) - 1.0) * min(e.z, e.w); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz, p = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw)) / ${f(K)};
  vec4 st = texture2D(tSea, p / 0.5); vec3 nz = texture2D(tNz, p * 0.55).rgb, n2 = texture2D(tNz, p * 1.9 + 0.31).rgb;
  // the sea's own shape: no straight side anywhere, its edge the ragged ends of the touches
  float zf = 1.07 - 0.1 * smoothstep(-0.3, 0.8, p.x) + 0.05 * sin(p.x * 3.1 + 1.0) + 0.1 * (texture2D(tNz, p * 0.23 + 0.5).g - 0.4);
  float ed = min(min(p.x - ${f(X0)}, ${f(X1)} - p.x) * 0.8, min(p.y - 0.02, zf - p.y));
  ed += (nz.r - 0.5) * 0.26 + (st.a - 0.66) * 0.1 + (n2.b - 0.32) * 0.07;
  // laid from left to right, a touch at a time
  float lay = smoothstep(0.0, 0.2, uShow.x - p.x - (0.85 - st.a) * 0.3 + (nz.g - 0.4) * 0.2);
  float m = smoothstep(0.0, 0.17, ed) * lay;
  vec3 c = st.rgb * (0.92 + 0.2 * n2.r);
  c = mix(c, cPale, (1.0 - smoothstep(0.04, 0.6, p.y + 0.1 * nz.g)) * 0.62);                       // paler towards the horizon, as his is
  float cb = texture2D(tComb, vec2(p.x * 0.4 - uShow.z * 0.021, p.y * 0.86 - p.x * 0.12 + 0.07)).r;
  // the land: flat grey shapes with a darker lip
  float sI = sdEl(p, vec4(${ISLE.map(f).join(', ')})), sR = sdEl(p, vec4(${ROCKS.map(f).join(', ')}));
  vec2 bd = abs(p - vec2(${f(SHORE[0])}, ${f(SHORE[1])})) - vec2(${f(SHORE[2] - SHORE[4])}, ${f(SHORE[3] - SHORE[4])}); float sS = length(max(bd, 0.0)) + min(max(bd.x, bd.y), 0.0) - ${f(SHORE[4])};
  float sd = min(min(sI, sR), sS) + (n2.r - 0.4) * 0.03 + (nz.b - 0.3) * 0.02;
  float land = 1.0 - smoothstep(-0.006, 0.006, sd);
  c = mix(c, cDeep, cb * 0.86 * (1.0 - land));
  c *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.05, sd)) * (1.0 - land);                                 // the water darker against the shore
  vec3 lc = mix(cLand * (0.9 + 0.22 * st.a), cRim, smoothstep(-0.05, -0.004, sd) * 0.8);
  c = mix(c, lc, land);
  // shadows: the tree's, the house's, the rocks', the ship's
  float sh = 0.5 * exp(-dot((p - vec2(${f(TREE[0] + 0.03)}, ${f(TREE[1] + 0.05)})) / vec2(0.17, 0.1), (p - vec2(${f(TREE[0] + 0.03)}, ${f(TREE[1] + 0.05)})) / vec2(0.17, 0.1)));
  sh += 0.4 * exp(-dot((p - vec2(${f(HOUSE[0])}, ${f(HOUSE[1] + 0.16)})) / vec2(0.26, 0.06), (p - vec2(${f(HOUSE[0])}, ${f(HOUSE[1] + 0.16)})) / vec2(0.26, 0.06)));
  sh += 0.35 * (1.0 - smoothstep(-0.1, 0.03, sR)) * smoothstep(0.3, 0.75, p.y);
  vec2 ds = p - uShip.xy; ds = vec2(dot(ds, uHead), dot(ds, vec2(-uHead.y, uHead.x))) / vec2(0.2, 0.065);
  sh += 0.5 * uShip.w * exp(-dot(ds, ds));
  c *= 1.0 - min(sh, 0.6);
  // the light from the house, gold on the water and the shore
  vec2 dg = (p - vec2(${f(HOUSE[0] - 0.14)}, ${f(HOUSE[1] + 0.34)})) / vec2(0.42, 0.26);
  c += cGold * uShow.y * exp(-dot(dg, dg)) * (0.42 + 0.3 * st.a);
  fCol = c * 0.66; fA = m * 0.97;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'ulysses-sea';
    this.sea = stage(new THREE.Mesh(g, m)); this.sea.renderOrder = 5;
    L.add(this.sea);
  },

  // ---------------------------------------------------------------- the solid things: one rig
  buildRig(L, C, stage) {
    const rig = this.rig = L.rig(96, 9000, L.paint({ rough: 0.8, glow: 0.4, side: THREE.DoubleSide })), R = L.rand;
    stage(rig.mesh);
    const mix = (a, b, k) => a.clone().lerp(b, clamp01(k));
    const inst = g => rig.add(rig.geo(g));
    // his rocks: prisms with flat pale tops and split sides, darker to the foot
    this.blocks = BLOCKS.map(([u, o, r, h, n, turn], bi) => {
      const jit = Array.from({ length: n }, () => 0.84 + 0.3 * R()), ring = (rr, y) => Array.from({ length: n + 1 }, (_, i) => { const a = (i % n) / n * TAU + turn; return [Math.cos(a) * rr * jit[i % n], y, Math.sin(a) * rr * jit[i % n]]; });
      const g = loft([ring(r, 0), ring(r * 0.93, h - 0.012), ring(r * 0.84, h), ring(0, h)]); g.computeVertexNormals();      // (every face flat: his rocks are cut, not rounded)
      tint(g, (P, N) => { const a = Math.atan2(N.x, N.z), face = 0.5 + 0.5 * Math.sin(a * 2.3 + bi * 1.7); return N.y > 0.8 ? mix(C.rockTop, C.rockHi, 0.12 * face) : N.y > 0.25 ? mix(C.rockHi, C.rockTop, 0.5) : mix(C.rockLo, C.rockHi, 0.15 + 0.75 * P.y / Math.max(h, 0.12) * (0.55 + 0.45 * face) + 0.2 * face); });
      return { i: inst(g), u, o };
    });
    // the island: stumps, and the timbers cut for a boat
    const stump = h => tint(shape.move(shape.cyl(0.012, 0.01, h, 6), 0, h / 2, 0), (P, N) => N.y > 0.5 ? C.plank : C.woodDk);
    const beam = (l, w, c, c2 = c) => tint(shape.box(l, w, w * 1.4), (P, N) => N.y > 0.5 ? c2 : c);
    this.isle = [
      [inst(stump(0.055)), ISLE[0] + 0.07, 0, ISLE[1] + 0.03, 0, 0], [inst(stump(0.04)), ISLE[0], 0, ISLE[1] + 0.085, 0, 0], [inst(stump(0.065)), ISLE[0] + 0.115, 0, ISLE[1] - 0.03, 0, 0],
      [inst(beam(0.15, 0.016, C.woodDk, mix(C.woodDk, C.wood, 0.3))), ISLE[0] + 0.05, 0.012, ISLE[1] + 0.08, 0.5, 0], [inst(beam(0.13, 0.016, C.woodDk, mix(C.woodDk, C.wood, 0.3))), ISLE[0] + 0.06, 0.026, ISLE[1] + 0.075, -0.6, 0.05],
      [inst(beam(0.08, 0.013, C.plank, C.woodHi)), ISLE[0] + 0.115, 0.01, ISLE[1] + 0.045, 1.0, 0], [inst(beam(0.06, 0.012, C.plank, C.woodHi)), ISLE[0] - 0.045, 0.01, ISLE[1] + 0.095, -0.2, 0],
    ];
    const trunk = (h, r) => tint(shape.move(shape.cyl(r, r * 0.7, h, 5), 0, h / 2, 0), () => C.woodDk);
    this.trunks = [[inst(trunk(0.17, 0.011)), 0, 0, 0.05], [inst(trunk(0.16, 0.009)), -0.04, 0.01, -0.07], [inst(trunk(0.16, 0.009)), 0.045, -0.01, 0.09]];
    this.bushTrunk = inst(trunk(0.12, 0.009));
    // the house: white walls, open at the front, grey within; a wooden floor and a red carpet
    const W = 0.46, D = 0.25, HH = 0.4, T = 0.018, hs = this.house = [];
    const part = (g, x, y, z, fn) => { shape.move(g, x, y, z); if (fn) tint(g, fn); hs.push(inst(g)); };
    const outer = (P, N) => mix(C.wallSh, C.wall, 0.55 + 0.4 * P.y / HH + 0.25 * N.y + 0.2 * N.z);
    part(shape.box(W, HH, T), 0, HH / 2, -D / 2, (P, N) => N.z > 0.5 ? mix(C.inside, C.wallSh, 0.2 + 0.4 * P.y / HH) : outer(P, N));
    part(shape.box(T, HH, D), -W / 2, HH / 2, 0, (P, N) => N.x > 0.5 ? mix(C.inside, C.wallSh, 0.35) : outer(P, N));
    part(shape.box(T, HH, D), W / 2, HH / 2, 0, (P, N) => N.x < -0.5 ? mix(C.inside, C.wallSh, 0.35) : outer(P, N));
    part(shape.box(0.09, HH, D), -W / 2 - 0.045 - T / 2, HH / 2, 0, outer);
    for (const y of [0.12, 0.27]) part(shape.box(0.024, 0.1, 0.006), -W / 2 - 0.045 - T / 2, y, D / 2, () => mix(C.inside, C.rockLo, 0.5));
    part(shape.box(W + 0.16, 0.014, D + 0.06), -0.045, HH + 0.007, 0.005, (P, N) => N.y < -0.5 ? C.wood : mix(C.wallSh, C.wall, 0.75 + 0.25 * N.y));
    part(shape.box(W + 0.12, 0.024, D + 0.02), -0.045, HH + 0.026, 0.005, (P, N) => mix(C.wallSh, C.wall, 0.6 + 0.4 * N.y));
    part(shape.box(W - T, 0.01, D), 0, 0.005, 0, (P, N) => N.y > 0.5 ? mix(C.wood, C.plank, 0.5 + 0.5 * Math.sin(P.x * 90)) : C.goldLo);
    part(shape.box(0.17, 0.004, 0.09), 0.04, 0.012, 0.06, () => C.carpet);
    // the loom, gilt: posts, long beams, cross beams, two braces, the cloth beam, the bench
    const lx = 0.185, lz0 = -0.085, lz1 = 0.055, lh = 0.335, bw = 0.014;
    const wood = (P, N) => mix(C.goldLo, C.woodHi, 0.5 + 0.5 * N.y + 0.3 * N.z);
    for (const x of [-lx, lx]) for (const z of [lz0, lz1]) part(shape.box(bw, lh, bw), x, lh / 2, z, wood);
    for (const z of [lz0, lz1]) for (const y of [lh, lh - 0.07]) part(shape.box(lx * 2 + bw, bw, bw), 0, y, z, wood);
    for (const x of [-lx, -0.06, 0.07, lx]) part(shape.box(bw * 0.8, bw * 0.8, lz1 - lz0), x, lh + 0.004, (lz0 + lz1) / 2, wood);
    for (const z of [lz0 + 0.02, lz1 - 0.004]) { const g = shape.box(0.006, 0.2, 0.006); shape.move(g, 0, 0, 0, 0, 0, 0.62); part(g, -0.115, 0.2, z, wood); }
    part(shape.move(shape.cyl(0.011, 0.011, lz1 - lz0 + 0.02, 7), 0, 0, 0, Math.PI / 2), 0.075, 0.15, (lz0 + lz1) / 2, () => C.cloth);
    part(shape.box(0.07, 0.085, 0.1), 0.165, 0.0425, -0.015, wood);
    this.beater = inst(tint(shape.move(shape.box(0.008, 0.13, lz1 - lz0 - 0.02), 0, -0.065, 0), wood));
    // the ship: a dark hull, upswept at both ends; her deck; the gilt castle aft; mast, yard and a white lateen sail
    const rows = [], deck = [], N = 14;
    for (let i = 0; i <= N; i++) {
      const q = i / N * 2 - 1, aq = Math.abs(q), x = q * 0.22, b = 0.068 * Math.pow(1 - Math.pow(aq, 2.3), 0.6) + 0.003, h = 0.064 + 0.045 * Math.pow(aq, 2.4) + (q > 0 ? 0.04 : 0.022) * Math.pow(aq, 3), row = [];
      for (let j = -5; j <= 5; j++) { const a = Math.abs(j) / 5; row.push([x + Math.sign(q) * 0.035 * aq * aq * a, h * Math.pow(a, 1.5), Math.sign(j) * b * Math.pow(a, 0.55)]); }
      rows.push(row); deck.push([[x, h * 0.74, -b * 0.82], [x, h * 0.74, b * 0.82]]);
    }
    this.hull = inst(shape.merge([tint(loft(rows), (P, N2) => { const k = P.y / (0.064 + 0.05 * Math.pow(Math.abs(P.x) / 0.22, 2.4)); return k > 0.9 ? C.goldLo : mix(C.hull, C.hullHi, k * 0.9 + 0.25 * N2.y); }), tint(loft(deck), () => C.deck)]));
    this.castle = inst(tint(shape.move(shape.box(0.13, 0.05, 0.1), -0.145, 0.105, 0), (P, N2) => mix(C.goldLo, C.woodHi, 0.45 + 0.5 * N2.y)));
    this.mast = inst(tint(shape.move(shape.cyl(0.0065, 0.004, 0.42, 6), -0.03, 0.26, 0), (P) => mix(C.goldLo, C.gold, P.y / 0.45)));
    this.yard = inst(tint(shape.move(shape.cyl(0.0045, 0.0035, 0.46, 5), 0, 0, 0, 0, 0, Math.PI / 2), () => C.wood));
    const sr = [];
    for (let i = 0; i <= 8; i++) { const a = -0.21 + 0.42 * i / 8, d = 0.012 + 0.25 * (0.21 - a) / 0.42, row = []; for (let j = 0; j <= 5; j++) { const v = j / 5; row.push([a, -v * d, -0.05 * Math.sin(Math.PI * Math.min(1, v * 1.1)) * Math.sin(Math.PI * (i / 8) * 0.9 + 0.15)]); } sr.push(row); }
    this.sail = inst(tint(loft(sr), (P) => mix(C.sail, C.sailSh, 0.06 + 0.1 * Math.sin(P.x * 70) - P.y * 0.6)));
    this.shown = -1;
  },

  // ---------------------------------------------------------------- his marks: soft cards, one instanced shader
  buildCards(L, C, stage) {
    const R = L.rand;
    const atlas = canvasTexture(512, 512, (g) => {
      const grey = (v, a = 1) => `rgba(${v},${v},${v},${a})`;
      const cell = (i, fn) => { g.save(); g.beginPath(); g.rect((i % 4) * 128, Math.floor(i / 4) * 128, 128, 128); g.clip(); g.translate((i % 4) * 128, Math.floor(i / 4) * 128); g.lineCap = 'round'; g.lineJoin = 'round'; fn(); g.restore(); };
      const blob = (x, y, r, a, v = 255, mid = 0.5) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, grey(v, a)); gr.addColorStop(mid, grey(v, a * 0.8)); gr.addColorStop(1, grey(v, 0)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
      // a soft-edged solid: filled, with its own colour bled a little way out
      const soft = (b, v, path, a = 1) => { g.save(); g.shadowColor = grey(v, a); g.shadowBlur = b; g.fillStyle = grey(v, a); g.beginPath(); path(); g.fill(); g.restore(); };
      const poly = pts => () => { pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
      const line = (v, w, pts, a = 1) => { g.strokeStyle = grey(v, a); g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); };
      const atop = fn => { g.globalCompositeOperation = 'source-atop'; fn(); g.globalCompositeOperation = 'source-over'; };
      cell(DAB, () => blob(64, 64, 60, 1, 255, 0.55));
      cell(STROKE, () => { soft(5, 235, () => g.ellipse(64, 64, 52, 17, 0, 0, TAU)); atop(() => { for (let i = 0; i < 9; i++) line(R() < 0.5 ? 255 : 190, 2 + R() * 3, [[14 + R() * 14, 50 + i * 3.4], [112 - R() * 14, 50 + i * 3.4 + (R() - 0.5) * 4]], 0.5); }); });
      cell(SPRIG, () => { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3, l = 34 + R() * 14; line(255, 9, [[64 + Math.cos(a) * 8, 64 + Math.sin(a) * 8], [64 + Math.cos(a) * l, 64 + Math.sin(a) * l]]); } blob(64, 64, 16, 1); });
      cell(EWE, () => {
        for (const x of [36, 48, 76, 88]) line(120, 5.5, [[x, 78], [x + 1, 112]]);
        soft(4, 238, () => g.ellipse(60, 62, 36, 21, 0, 0, TAU)); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; soft(3, 246, () => g.arc(60 + Math.cos(a) * 33, 62 + Math.sin(a) * 18, 8, 0, TAU)); }
        soft(3, 222, () => g.ellipse(101, 50, 12, 9, 0.5, 0, TAU)); soft(2, 170, () => g.ellipse(93, 43, 6, 3.5, -0.6, 0, TAU));
        atop(() => { blob(58, 84, 34, 0.38, 120); });
      });
      cell(DOG, () => {
        for (const x of [36, 46, 72, 82]) line(215, 6.5, [[x, 78], [x + (x < 60 ? -2 : 3), 112]]);
        g.strokeStyle = grey(245); g.lineWidth = 8; g.beginPath(); g.moveTo(32, 66); g.quadraticCurveTo(14, 50, 24, 30); g.quadraticCurveTo(30, 22, 36, 30); g.stroke();
        soft(4, 244, () => g.ellipse(58, 70, 30, 14.5, -0.08, 0, TAU)); soft(3, 248, () => g.arc(92, 52, 13.5, 0, TAU)); soft(2, 244, () => g.ellipse(107, 57, 8.5, 6, 0.2, 0, TAU));
        soft(2, 190, () => g.ellipse(86, 44, 5, 9, -0.5, 0, TAU));
        atop(() => { blob(56, 88, 30, 0.3, 120); });
      });
      // a head in profile, facing right: planes of light and shade, no drawn feature
      cell(HEAD, () => {
        soft(2, 200, poly([[46, 82], [74, 90], [74, 126], [42, 126]]));
        soft(2, 240, poly([[26, 60], [34, 34], [56, 20], [80, 24], [92, 44], [94, 54], [108, 68], [96, 73], [99, 81], [92, 97], [70, 104], [48, 96], [30, 80]]));
        atop(() => {
          g.fillStyle = grey(66, 0.94); g.beginPath(); poly([[18, 64], [28, 28], [56, 12], [86, 20], [80, 34], [62, 40], [54, 58], [52, 86], [28, 88]])(); g.fill();      // the hair: the back and the top of the skull
          blob(89, 54, 9, 0.8, 100); blob(70, 106, 17, 0.65, 95); blob(84, 76, 12, 0.5, 255); blob(99, 68, 6, 0.6, 255);                                          // the brow's shade, under the jaw; the cheek and the nose in the light
        });
      });
      // the tall hat with a turned brim
      cell(HAT, () => {
        soft(3, 240, poly([[36, 96], [56, 20], [66, 12], [78, 22], [96, 96]])); soft(3, 250, () => g.ellipse(66, 98, 58, 13, -0.06, 0, TAU));
        atop(() => { blob(40, 60, 34, 0.5, 120); for (let i = 0; i < 16; i++) blob(46 + R() * 40, 30 + R() * 60, 3.5, 0.9, 255); line(120, 3, [[10, 104], [122, 100]], 0.5); });
      });
      // a gown or a tunic: a soft mass, folds falling, the gilding's punched dots
      cell(ROBE, () => {      // (seated, facing right: the back upright, the lap, the skirt falling to the floor)
        soft(5, 228, poly([[36, 8], [60, 6], [70, 34], [74, 56], [104, 62], [112, 90], [120, 122], [18, 122], [24, 84], [28, 40]]));
        atop(() => { blob(36, 92, 44, 0.5, 80); for (let i = 0; i < 6; i++) line(i % 2 ? 80 : 255, 4.5, [[78 + i * 5, 64], [70 + i * 9, 92], [66 + i * 10, 124]], 0.62); line(85, 4, [[42, 14], [36, 60], [26, 120]], 0.6); line(80, 4, [[72, 58], [50, 66], [34, 60]], 0.55); for (let i = 0; i < 50; i++) blob(18 + R() * 98, 12 + R() * 108, 2.6, 0.95, 255); });
      });
      // a short flared tunic, belted (standing)
      cell(TUNIC, () => {
        soft(4, 230, poly([[44, 6], [84, 6], [90, 30], [84, 54], [108, 118], [20, 118], [44, 54], [38, 30]]));
        atop(() => { blob(34, 64, 38, 0.5, 80); line(70, 5.5, [[42, 55], [86, 55]], 0.8); for (let i = 0; i < 6; i++) line(i % 2 ? 80 : 255, 4.5, [[50 + i * 6, 60], [30 + i * 14, 120]], 0.62); line(85, 4, [[64, 10], [64, 50]], 0.5); for (let i = 0; i < 40; i++) blob(26 + R() * 76, 10 + R() * 104, 2.6, 0.95, 255); });
      });
      // a man's shoulders, sitting low
      cell(BUST, () => { soft(5, 225, poly([[30, 126], [34, 70], [50, 46], [78, 46], [94, 70], [98, 126]])); atop(() => { blob(36, 96, 36, 0.4, 90); for (let i = 0; i < 24; i++) blob(36 + R() * 56, 52 + R() * 70, 3, 0.9, 255); line(255, 4, [[52, 50], [64, 62], [76, 50]], 0.5); }); });
      // the gold net round the ship's waist, sagging
      cell(NET, () => {
        const sag = (x, k) => 14 + k * 27 + (1 - Math.pow((x - 64) / 62, 2)) * (22 + k * 5);
        for (let k = 0; k < 4; k++) { const pts = []; for (let x = 4; x <= 124; x += 6) pts.push([x, sag(x, k)]); line(k === 0 || k === 3 ? 255 : 225, k === 0 ? 7 : 5, pts); }
        for (let i = 0; i <= 11; i++) { const x = 5 + i * 10.8, xb = 64 + (x - 64) * 0.86; line(235, 4.2, [[x, sag(x, 0)], [xb, sag(xb, 3)]]); }
      });
      cell(GRID, () => { g.fillStyle = grey(170, 0.5); g.fillRect(4, 4, 120, 120); for (let i = 0; i <= 5; i++) line(255, 6, [[6 + i * 23.2, 6], [6 + i * 23.2, 122]]); for (let i = 0; i <= 2; i++) line(255, 7, [[6, 8 + i * 56], [122, 8 + i * 56]]); });
      cell(WARP, () => { for (let i = 0; i < 15; i++) line(255, 1.7, [[8 + i * 8, 2], [8 + i * 8 + (R() - 0.5) * 2, 126]], 0.55 + 0.4 * R()); });
      cell(LATEEN, () => { line(120, 4, [[58, 18], [60, 118]]); soft(3, 245, poly([[14, 112], [104, 8], [110, 110]])); line(170, 3.5, [[8, 116], [108, 4]]); atop(() => blob(96, 96, 40, 0.3, 150)); });
      cell(CAP, () => { soft(4, 235, () => g.ellipse(62, 54, 34, 28, 0, 0, TAU)); soft(4, 250, () => g.ellipse(64, 80, 52, 15, 0, 0, TAU)); atop(() => blob(36, 60, 30, 0.45, 120)); });
      // a clump of leaves: firm, with a feathered rim
      cell(TUFT, () => { soft(3, 235, () => g.arc(64, 64, 34, 0, TAU)); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + R() * 0.3, l = 40 + R() * 16; line(235, 7, [[64 + Math.cos(a) * 24, 64 + Math.sin(a) * 24], [64 + Math.cos(a) * l, 64 + Math.sin(a) * l]]); } atop(() => blob(82, 86, 40, 0.4, 110)); });
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
  vec2 q = clamp(vQ, 0.02, 0.98); float ci = floor(vInfo.x + 0.5); vec2 cell = vec2(mod(ci, 4.0), 3.0 - floor(ci / 4.0));
  vec4 tx = texture2D(tAtlas, (q + cell) * 0.25);
  float a = tx.a * vInfo.y; if (a < 0.012) discard;
  diffuseColor = vec4(vCol * mix(1.0, 0.16 + 0.98 * tx.r, vInfo.z), a);
}`);
    };
    m.customProgramCacheKey = () => 'ulysses-cards';
    const mesh = this.cards = stage(new THREE.InstancedMesh(geo, m, MAXC));
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.count = 0; mesh.renderOrder = 6;
    L.add(mesh);
    this.pm = new Float32Array(MAXC * 16); this.pi = new Float32Array(MAXC * 4); this.pc = new Float32Array(MAXC * 3); this.dep = new Float32Array(MAXC); this.order = new Uint16Array(MAXC); this.n = 0;
    this.byDepth = (a, b) => this.dep[b] - this.dep[a];
    // the foliage: a dark round mass, lighter touches to the upper left, and his gold leaves over it
    const crown = (n, ng, rx, ry, rz) => {
      const out = [{ x: 0, y: 0, z: 0, s: rx * 1.5, c: C.leaf, gold: false, ph: 0, core: true }];
      for (let i = 0; i < n; i++) { const a = R() * TAU, b = Math.acos(1 - 2 * R()), r = 0.62 + 0.38 * Math.sqrt(R()), x = Math.sin(b) * Math.cos(a) * r, y = Math.cos(b) * r, z = Math.sin(b) * Math.sin(a) * r; out.push({ x: x * rx, y: (y < 0 ? y * 0.75 : y) * ry, z: z * rz, s: rx * (0.62 + 0.36 * R()), c: y > 0.15 && x < 0.35 && R() < 0.55 ? (R() < 0.35 ? C.leaf3 : C.leaf2) : C.leaf, gold: false, ph: R() * TAU }); }
      for (let i = 0; i < ng; i++) { const a = R() * TAU, b = Math.acos(1 - 1.8 * R()), r = 0.7 + 0.32 * R(), x = Math.sin(b) * Math.cos(a) * r, y = Math.cos(b) * r, z = Math.sin(b) * Math.sin(a) * r; out.push({ x: x * rx, y: (y < 0 ? y * 0.75 : y) * ry, z: z * rz, s: 0.015 + 0.011 * R(), c: R() < 0.3 ? C.goldHi : R() < 0.6 ? C.gold : C.goldLo, gold: true, ph: R() * TAU, turn: R() * TAU }); }
      return out;
    };
    // (two small helpers made once, so that nothing is made each frame)
    this.pres = u => (this._calm ? ease.smooth : ease.outBack)(ramp(this._reach - u, 0.04, 0.4));
    this.leaves = (list, Mx, k, gust, hgt) => {
      const t = this._t, sw = this._calm ? 0.5 : 1, glit = this._calm ? 0 : 1;
      for (const d of list) {
        const swy = 0.006 * Math.sin(t * 1.3 + d.ph) * sw * (1 + 2 * gust);
        if (!d.gold) this.on(Mx, d.core ? DAB : TUFT, d.x + swy, hgt + d.y, d.z, d.s, d.s * 0.9, d.core ? 0 : d.ph, d.c, Math.min(1, k * 1.5), d.core ? 0 : 0.55, k);
        else this.on(Mx, SPRIG, d.x + swy * 1.4, hgt + d.y, d.z, d.s, d.s, d.turn + 0.3 * Math.sin(t * 0.9 + d.ph) * sw, d.c, Math.min(1, k * 1.5) * (0.72 + 0.2 * glit * Math.sin(t * (1.6 + 2.4 * gust) + d.ph * 3) + 0.2 * gust), 0, k * (1 + 0.3 * gust));
      }
    };
    this.crown = crown(30, 52, 0.15, 0.115, 0.12); this.bush = crown(14, 24, 0.095, 0.08, 0.085);
  },

  // a card that turns to face the eye (about the upright), at a place on the stage; w < 0 mirrors it
  bill(cell, x, y, z, w, h, roll, c, a = 1, tone = 1) {
    const i = this.n; if (i >= MAXC || a <= 0.004) return; this.n++;
    const dx = this.cam.x - x, dz = this.cam.z - z;
    _e.set(0, Math.atan2(dx, dz), roll, 'YXZ'); _m.compose(_v.set(x, y, z), _q.setFromEuler(_e), _s.set(w, h, 1)).toArray(this.pm, i * 16);
    this.pi[i * 4] = cell; this.pi[i * 4 + 1] = a; this.pi[i * 4 + 2] = tone; this.pc[i * 3] = c.r; this.pc[i * 3 + 1] = c.g; this.pc[i * 3 + 2] = c.b;
    this.dep[i] = dx * dx + dz * dz + (this.cam.y - y) * (this.cam.y - y);
  },
  // the same for a point given in something's own frame (a ship, a house); returns nothing, _p holds the stage point
  on(M, cell, x, y, z, w, h, roll, c, a, tone, k = 1) { _p.set(x, y, z).applyMatrix4(M); this.bill(cell, _p.x, _p.y, _p.z, w * k, h * k, roll, c, a, tone); },
  // a card fixed in something's frame (its face along that frame's z, or laid flat with pitch -90 degrees)
  fixed(M, cell, x, y, z, w, h, c, a = 1, tone = 1, pitch = 0, roll = 0, bias = 0) {
    const i = this.n; if (i >= MAXC || a <= 0.004) return; this.n++;
    local(_m, M, x, y, z, 0, pitch, roll, w, h, 1).toArray(this.pm, i * 16);
    this.pi[i * 4] = cell; this.pi[i * 4 + 1] = a; this.pi[i * 4 + 2] = tone; this.pc[i * 3] = c.r; this.pc[i * 3 + 1] = c.g; this.pc[i * 3 + 2] = c.b;
    _p.setFromMatrixPosition(_m); this.dep[i] = _p.distanceToSquared(this.cam) + bias;
  },
  // which way a thing heading (du, dout) at (x, z) faces on the screen: 1 to the right, -1 to the left
  faces(x, z, du, dout) { return (-(z - this.cam.z)) * du + (x - this.cam.x) * dout >= 0 ? 1 : -1; },
  flush() {
    const n = this.n, o = this.order, im = this.cards.instanceMatrix.array, ai = this.aInfo.array, ac = this.aCol.array;
    for (let i = 0; i < n; i++) o[i] = i;
    o.subarray(0, n).sort(this.byDepth);
    for (let k = 0; k < n; k++) { const i = o[k]; for (let j = 0; j < 16; j++) im[k * 16 + j] = this.pm[i * 16 + j]; for (let j = 0; j < 4; j++) ai[k * 4 + j] = this.pi[i * 4 + j]; for (let j = 0; j < 3; j++) ac[k * 3 + j] = this.pc[i * 3 + j]; }
    this.cards.count = n; this.cards.instanceMatrix.needsUpdate = true; this.aInfo.needsUpdate = true; this.aCol.needsUpdate = true;
  },

  start(L) { this.band.from(L.t); this.yip = this.told = false; this.fitCam(L); },
  reset() { this.yip = this.told = false; },

  update(L, dt) {
    const C = this.C, M = this.M, rig = this.rig, calm = L.calm, t = L.t, back = L.phase === 'return', G = L.k.G;
    this.fitCam(L);
    // the eye, in the stage's own terms (u along the wall, up, out from it)
    _d.copy(G.camera.position).sub(this.org).multiplyScalar(1 / K); this.cam.set(_d.x * L.tx + _d.z * L.tz, _d.y, _d.x * L.nx + _d.z * L.nz);
    // how far the sea has been laid: out from the left as it wakes, taken up again from the right when the look ends
    const reach = back ? lerp(X1 + 0.6, X0 - 0.6, ease.inOut(L.ret)) : lerp(X0 - 0.3, X1 + 0.6, L.wake);
    this._reach = reach; this._calm = calm; this._t = t; const pres = this.pres;
    const arrived = clamp01((t - TA) / (calm ? 3.2 : 1.6)), light = ease.smooth(arrived) * (back ? pres(HOUSE[0]) : 1);
    const U = this.su; U.uShow.value.set(reach, light, t, 0);

    // ---- the ship's course
    const q = ramp(t, T0, TA), s = 1 - Math.pow(1 - q, 1.45), sp = this.curve.getPointAt(s, _p), tg = this.curve.getTangentAt(s, _d);
    const sx = sp.x, sz = sp.z, hx = tg.x, hz2 = tg.z, way = q < 1 ? Math.pow(1 - q, 0.7) : 0;                     // (way: how fast she is going, 1 to 0)
    const kS = pres(sx) * (t > T0 - 0.2 ? 1 : 0), sw = calm ? 0.5 : 1;
    const bump = t > TA ? Math.exp(-(t - TA) * 3) * Math.sin((t - TA) * 9) : 0;
    const bob = 0.004 * Math.sin(t * 2.3) * sw, pitch = (0.03 * Math.sin(t * 1.9 + 0.6) * (0.4 + 0.6 * way) + 0.05 * bump) * sw, roll = 0.045 * Math.sin(t * 1.5) * sw;
    local(M.ship, I4, sx, 0.004 + bob, sz, Math.atan2(-hz2, hx), roll, pitch, Math.max(kS, 0.0001));
    U.uShip.value.set(sx, sz, 0, kS); U.uHead.value.set(hx, hz2);
    rig.mat(this.hull, M.ship); rig.mat(this.castle, M.ship); rig.mat(this.mast, M.ship);
    // the yard: up and slanting under way, lowered along the deck as she comes in
    const down = ease.inOut(ramp(t, TA - 1.15, TA - 0.25)), fill = ease.smooth(ramp(t, T0 + 0.2, T0 + 1.3)) * (1 - down);
    local(M.yard, M.ship, -0.03, lerp(0.335, 0.27, down), -0.012, 0, 0, lerp(-0.5, -0.24, down));
    rig.mat(this.yard, M.yard);
    local(M.t, M.yard, 0, 0, 0, 0, 0, 0, 1, lerp(1, 0.6, down), (0.25 + 0.75 * fill) * (1 + 0.1 * Math.sin(t * 3.1) * sw));
    rig.mat(this.sail, M.t);

    // ---- the rocks rise block on block; the island's timbers; the trees; the house and its loom
    for (const b of this.blocks) { const k = pres(b.u + 0.1), g = Math.max(0.0001, Math.min(1, k * 6)); rig.put(b.i, b.u, 0, b.o, 0, 0, 0, _s.set(g, Math.max(k, 0.0001), g)); }
    const kI = Math.max(pres(ISLE[0]), 0.0001), kT = Math.max(pres(TREE[0] + 0.1), 0.0001), kB = Math.max(pres(BUSH[0] - 0.1), 0.0001), kH = Math.max(pres(HOUSE[0] - 0.1), 0.0001);
    for (const p of this.isle) rig.put(p[0], p[1], p[2] * kI, p[3], p[4], 0, p[5], kI);
    local(M.tree, I4, TREE[0], 0, TREE[1], 0, 0, 0, kT); local(M.bush, I4, BUSH[0], 0, BUSH[1], 0, 0, 0, kB);
    for (const p of this.trunks) rig.mat(p[0], local(_m, M.tree, p[1], 0, p[2], 0, p[3], p[3] * 0.6));
    rig.mat(this.bushTrunk, M.bush);
    local(M.house, I4, HOUSE[0], 0, HOUSE[1], HOUSE[2], 0, 0, kH);
    for (const i of this.house) rig.mat(i, M.house);
    // the loom at work: the beater swung home twice on each beat, the heddles changing; stopped when she touches
    const resumed = t > TA + 3.2, per = resumed ? 1.3 : BEAT, lt = resumed ? (t - TA - 3.2) / per : (Math.min(t, TA - 0.25) - 1.7) / per + 0.0001;
    const working = (t > 1.7 && t < TA - 0.25) || resumed, ph = lt - Math.floor(lt);
    const beat = working && ph > 0.36 && ph < 0.66 ? Math.pow(Math.sin((ph - 0.36) / 0.3 * Math.PI), 2) : 0, shed = working ? (Math.floor(lt) % 2 ? 1 : -1) * (ph < 0.2 ? ph / 0.1 - 1 : 1) : 0.4;
    rig.mat(this.beater, local(_m, M.house, 0.005, 0.3, -0.015, 0, 0, 0.1 + 0.42 * beat));

    // ---- the marks
    this.n = 0;
    const glit = calm ? 0 : 1, wind = ease.smooth(ramp(t, 2.6, 3.6)) * (1 - ease.smooth(ramp(t, 4.6, 5.8)));
    this.leaves(this.crown, M.tree, kT, wind, 0.27); this.leaves(this.bush, M.bush, kB, 0, 0.195);
    // the sheep, on the rocks: grazing; they turn to watch her go by, and the nearest gives a jump
    const watch = ramp(t, T0 + 0.5, T0 + 1.2) * (1 - ramp(t, 4.2, 5.2));
    for (let i = 0; i < SHEEP.length; i++) {
      const [u, o, h, f] = SHEEP[i], k = pres(u + 0.3), b = this.blocks[ON_BLOCK[i]], kb = pres(b.u + 0.1), look = watch > 0.5, dir = look ? this.faces(u, o, sx - u, sz - o) : f * this.faces(u, o, 1, 0);
      const jump = i === 0 && !calm ? Math.max(0, Math.sin((t - T0 - 1.0) * 5.2)) * (t > T0 + 1.0 && t < T0 + 1.0 + Math.PI / 5.2 * 2 ? 0.035 : 0) : 0;
      this.bill(EWE, u, h * kb + 0.036 * k + jump, o, 0.085 * k * dir, 0.085 * k, look ? 0.05 * dir : (-0.16 - 0.06 * Math.sin(t * 1.7 + i * 2)) * dir, C.wool, Math.min(1, k * 2), 0.9);
    }
    // the far boats, small by the wall, standing on
    for (const [u0, o, sz0, v] of FAR) { const u = u0 + v * t, k = pres(u), y = 0.02 + 0.002 * Math.sin(t * 2 + u0 * 9); this.bill(STROKE, u, y, o, sz0 * 1.15 * k, sz0 * 0.5 * k, 0, C.hull, k, 0.3); this.bill(LATEEN, u, y + sz0 * 0.62, o, sz0 * this.faces(u, o, 1, 0) * k, sz0 * 1.1 * k, 0.03 * Math.sin(t * 1.4 + u0 * 7) * sw, C.sail, k, 0.8); }

    // the ship's company: the net and the castle's lattice; three men low in the waist; one in gold at the mast
    if (kS > 0.01) {
      const S = M.ship, f = this.faces(sx, sz, hx, hz2), a = Math.min(1, kS * 1.5);
      for (const z of SIDES) { this.fixed(S, NET, 0.045, 0.068, z, 0.31, 0.105, C.gold, a, 0.85); this.fixed(S, GRID, -0.145, 0.105, z * 0.74, 0.13, 0.05, C.goldHi, a, 0.6); }
      for (let i = 0; i < CREW.length; i++) {
        const [x, z, cn, hn, tall, tn, up, tilt] = CREW[i], c = C[cn], hc = C[hn], hat = tall ? HAT : CAP;
        const nod = 0.004 * Math.sin(t * 1.6 + i * 2.1) * sw, y = 0.108 + up;                                        // (they sit close and lean together, as he has them)
        this.on(S, BUST, x, y + 0.038, z, 0.088, 0.085, tilt * 0.5 * f, c, a, 0.75, kS);
        this.on(S, HEAD, x + 0.008 + tilt * 0.03, y + 0.07 + nod, z + 0.001, 0.04 * f, 0.04, tilt * f, C.skin, a, 0.95, kS);
        this.on(S, hat, x + 0.004 + tilt * 0.04, y + (hat === HAT ? 0.09 : 0.083) + nod, z + 0.002, (hat === HAT ? 0.044 : 0.046) * f, hat === HAT ? 0.042 : 0.026, tilt * f, hc, a, tn, kS);
      }
      // the man in gold: he stands by the mast, a hand on it, looking ahead; when she touches he lifts the other
      const hx0 = -0.062, by = 0.082, lean = 0.03 * way, hi = ease.smooth(ramp(t, TA + 0.25, TA + 0.9)) * (0.85 + 0.15 * Math.sin(t * 2.6));
      for (const d of LEGS) this.on(S, STROKE, hx0 + d, by + 0.034, 0.004, 0.078, 0.022, Math.PI / 2 + d * 6 * f, C.gold, a, 0.6, kS);
      this.on(S, TUNIC, hx0 + lean * 0.4, by + 0.112, 0.006, 0.078 * f, 0.1, -lean * f, C.gold, a, 0.85, kS);
      this.on(S, STROKE, hx0 + 0.02, by + 0.13, 0.012, 0.046, 0.021, 0.3 * f, C.gold, a, 0.7, kS);                 // the hand on the mast
      this.on(S, STROKE, hx0 + 0.01 + 0.016 * hi, by + 0.118 + 0.034 * hi, 0.014, 0.046, 0.021, lerp(-1.2, 1.0, hi) * f, C.gold, a, 0.7, kS);       // the other arm
      this.on(S, HEAD, hx0 + 0.006 + lean, by + 0.18, 0.008, 0.042 * f, 0.042, 0, C.skin, a, 0.95, kS);
      this.on(S, HAT, hx0 + 0.002 + lean, by + 0.206, 0.009, 0.062 * f, 0.058, 0.04 * f, C.goldHi, a, 0.9, kS);
      // white water under her bow while she has way on, and a paler track astern
      for (let i = 0; i < 3; i++) this.on(S, DAB, 0.2 + 0.02 * i, 0.012, (i - 1) * 0.03, 0.05, 0.03, 0, C.foam, a * way * (0.55 + 0.25 * Math.sin(t * 7 + i * 2) * glit), 0);
      for (let i = 1; i <= 6; i++) { const s2 = s - i * 0.035; if (s2 <= 0) break; const w = this.curve.getPointAt(s2, _d); this.fixed(I4, DAB, w.x, 0.016, w.z, 0.07 + 0.016 * i, 0.05 + 0.012 * i, C.foam, a * (0.2 + 0.25 * way) * (1 - i / 7) * pres(w.x), 0, -Math.PI / 2, 0, 40); }
    }

    // the house: the light within; the loom's threads; the weaver
    if (kH > 0.01) {
      const Hm = M.house, a = Math.min(1, kH * 1.5), fw = this.faces(HOUSE[0], HOUSE[1], -Math.cos(HOUSE[2]), Math.sin(HOUSE[2]));
      this.fixed(Hm, DAB, 0, 0.2, -0.1, 0.6, 0.5, C.light, 0.5 * light * a, 0, 0, 0, 40);
      this.fixed(Hm, WARP, -0.05, 0.152, -0.015, 0.12, 0.25, C.goldHi, 0.8 * a, 0, -Math.PI / 2, Math.PI / 2);                     // the warp, level, from the back beam to her hands
      for (const [x, sgn] of HEDDLES) this.fixed(Hm, WARP, x, 0.245 + 0.011 * shed * sgn, -0.012 + 0.03 * sgn, 0.05, 0.17, C.cloth, 0.8 * a, 0);
      // she sits at the cloth beam, in gold, her hair bound: weaving, head bent; when the ship touches she looks up
      const wx = 0.15, lift = ease.smooth(ramp(t, TA + 0.15, TA + 0.95)) * (1 - 0.8 * ease.smooth(ramp(t, TA + 3.0, TA + 4.2))), reachA = working ? 0.012 * Math.sin(ph * TAU) : 0;
      this.on(Hm, ROBE, wx - 0.03, 0.105, 0.012, 0.19 * fw, 0.21, 0, C.gold, a, 0.9, kH);
            this.on(Hm, STROKE, wx - 0.04 - reachA, 0.178, 0.022, 0.08, 0.024, -0.4 * fw, C.goldHi, a, 0.6, kH);
      this.on(Hm, DAB, wx - 0.07 - reachA, 0.166, 0.024, 0.02, 0.018, 0, C.skin, a, 0, kH);
      const hx1 = wx - 0.004 - 0.014 * (1 - lift), hy = 0.24 + 0.005 * lift;
      this.on(Hm, DAB, hx1 + 0.012, hy + 0.008, 0.006, 0.052, 0.05, 0, C.hair, a, 0, kH); this.on(Hm, DAB, hx1 + 0.03, hy - 0.002, 0.004, 0.026, 0.026, 0, C.hair, a, 0, kH);
      this.on(Hm, HEAD, hx1 - 0.004, hy, 0.012, 0.054 * fw, 0.054, lerp(-0.38, 0.06, lift) * fw, C.skin, a, 0.95, kH);
    }
    // the dog: by the house; it sees her first, runs down to the water and cannot keep still
    {
      const run = ease.inOut(ramp(t, 5.0, 5.9)), x = lerp(DOG0[0], DOG1[0], run), z = lerp(DOG0[1], DOG1[1], run), k = pres(x), going = run > 0 && run < 1;
      const hops = going ? Math.abs(Math.sin((t - 5.0) * 14)) * 0.012 : t > 5.9 ? Math.pow(Math.max(0, Math.sin((t - 5.9) * (calm ? 3 : 5.2))), 2) * (calm ? 0.012 : 0.03) * (0.4 + 0.6 * Math.max(0, Math.sin((t - 5.9) * 0.9))) : 0;
      const dir = t > 4.7 ? this.faces(x, z, sx - x, sz - z) : this.faces(x, z, 1, 0);
      this.bill(DOG, x, 0.032 * k + hops, z, 0.078 * k * dir, 0.078 * k, (t > 4.7 ? 0.1 : 0) * dir + (t > 5.9 ? 0.07 * Math.sin(t * (calm ? 4 : 11)) : 0), C.wool, Math.min(1, k * 2), 0.9);
    }
    this.flush();

    // ---- the sounds
    const v = L.voice(); v.level = calm ? 0.7 : 1;
    if (!back) {
      this.band.play(t);
      if (!L.quiet) {
        if (!this.yip && t > 5.05) { this.yip = true; for (const at of [0, 0.24]) v.chirp(640, 900, 0.07, { at, vol: calm ? 0.01 : 0.018 }); }
        if (!this.told && t > TA + 0.5) { this.told = true; L.k.say('The ship makes for home. Look for the loom, just right of the middle of the panel: the painter wrote PENELOPE on its beam.', 6); }
      }
    }
    v.place();
  },
});
