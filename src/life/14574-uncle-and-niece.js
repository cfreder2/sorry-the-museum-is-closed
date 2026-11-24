// Edgar Degas, Henri Degas and His Niece Lucie Degas (The Artist's Uncle and Cousin) (1875-76), Gallery 226.
// The word: rustle.
//
// Naples, a house in mourning. An old man has lowered his newspaper to look up; a girl in black stands behind his
// chair with her hands on its back; behind them a glazed door, its panes butter yellow between red-brown bars; and
// at the foot of the picture, between them and the painter, a round table with papers on it. Nobody is speaking. The
// only sound the picture has is the one that has just stopped: the newspaper. So what comes out is the room's quiet,
// and the paper in it. Nothing else.
//
// Look, and the door's light is laid on the gallery floor in his scumbled yellows, pane by pane, the bars between
// them; and in it the table is brushed in, thinly at first, as he left much of this picture: the red-brown top, the
// papers as they lie at the foot of the picture (the salmon portfolio with its wad of white leaves, an olive sheet, a
// brown one, cream, pale green and white), and the newspaper, white and grey-blue, lying over the table's edge and
// hanging from it. Then a latch gives, somewhere in the picture. The door comes ajar: a blade of clear light opens
// across the floor and the table, the bars lean, and the air comes in after it. The corners of the papers lift, one
// after another. The hanging half of the newspaper fills and swings out; it creeps, stops at the brink, and then its
// own weight takes it: it runs off the table, pours down onto the floor and lays itself out there, its tail floating
// down last. One white sheet, uncovered, lifts off the table, climbs like a kite, and comes down the way a sheet of
// paper falls, sliding one way and then the other, to lie in the light. The door eases to. The corners lie down. And
// then nothing moves, which is the picture. While you keep looking, the door breathes now and then and the papers stir
// and settle. When you stop, it all thins away again, stroke by stroke, and the light draws back under the picture.
//
// There is no music: a house in mourning kept none. Only paper (a cluster of small dry sounds each time it moves), the
// latch, and the draught, hardly there.
//
// Nothing is solid. While the toy is near, it all stays out after the look: driving past the table stirs the papers,
// the papers on the floor slide out of the toy's way, and the toy throws its shadow in the door's light. With "Reduce
// motion and flashing" on, everything goes at six tenths of the speed, the papers do not tremble, and the sounds are
// softer; nothing here flashes. Three draw calls: the light on the floor (one shader: the door, the shadows), the
// table with everything on it (one mesh; the papers are strips bent along their length, as paper bends, laid again
// each frame), and the shadow of the flying sheet on the table. Everything keeps under 0.8 m, below every frame in
// the room, so from the checks' nine cameras the guard has nothing to cut.
//
// What it does not do: the uncle and the girl stay in their picture, in every form (no figure, no hand to hold the
// paper, no shadow of anyone), and so does the chair she holds, because an empty chair in a house in mourning would
// say that someone has gone, and the picture is about two people who are there; his cigar stays with him; and there
// is no tune, because the quiet is the subject.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, rng } from '../paintlife.js';
import { strokes as strokeTex } from './brush.js';
import { score, hump } from './stagecraft.js';

// Stage metres: u along the wall from the middle of the picture (to the viewer's right), out from the wall, h up.
const TU = -0.35, TO = 0.62, TH = 0.5, TR = 0.42;                 // the table: where it stands, its height, its top's radius
const DL = Math.hypot(0.68, 0.73), DU = -0.68 / DL, DO = 0.73 / DL;      // the way the newspaper goes off it (along, out)
const PO = -0.05;                                                 // (and how far its middle lies to the left of the table's)
const NL = 0.62, NW = 0.42, NSEG = 26, NACR = 12, G0 = 0.285;     // the newspaper: length, width, its grid, how much hangs at first
const AE = Math.sqrt(TR * TR - PO * PO) + 0.004;                  // the table's edge, along the newspaper's way
// The door's light on the floor: the middle of its wall-side edge, how wide and long it lies, its lean (u per metre
// out), how it widens. Shadows: how far along the floor for each metre of height, and their lean.
const UC = -0.62, O0 = 0.12, WID = 1.15, LEN = 1.55, LEAN = 0.02, SPREAD = 0.26, RUN = 0.35, SLEAN = 0.1;
// The story (seconds, at full speed).
const T_PAINT = [0.3, 1.95], T_DOOR = 2.3, T_SLIDE = 3.65, T_OFF = 4.55, FALL = 0.95, T_LIFT = 4.95, T_AIR = 5.2, T_APEX = 5.85, T_DOWN = 7.6;
const BREATH0 = 12, BREATH = 7.5;
const FLOOR = 0.018;                                              // paper on the floor lies this far up (over the light)
const TAU = Math.PI * 2;

// The loose sheets on the table: where (from the table's middle: along, out), the way each lies (radians from straight
// out, towards the right), length (that way) and width, its colours, its place in the pile, how far its windward end
// lifts, and whether the newspaper lies on it.
const SHEETS = [
  { x: 0.235, z: 0.095, a: 0.3, len: 0.2, wid: 0.28, cols: ['#9a9350', '#b3aa60', '#8b8748'], lay: 1, amp: 0.03 },                // olive, under the portfolio
  { x: 0.05, z: 0.14, a: -0.25, len: 0.13, wid: 0.235, cols: ['#7a4a2e', '#8a5636', '#6a3e28'], lay: 2, amp: 0.02 },              // brown
  { x: -0.07, z: 0.025, a: 0.6, len: 0.14, wid: 0.175, cols: ['#b9c4a4', '#cdd4b8', '#a4b092'], lay: 3, amp: 0.07, under: true },  // pale green
  { x: -0.22, z: 0.14, a: -0.45, len: 0.175, wid: 0.235, cols: ['#d9cfb6', '#e6dcc4', '#c4b89c'], lay: 2, amp: 0.08, under: true },      // cream
  { x: -0.19, z: -0.08, a: 0.2, len: 0.19, wid: 0.235, cols: ['#c9c6bc', '#dad7cc', '#b0aea6'], lay: 1, amp: 0.085, under: true },  // grey white
  { x: 0.13, z: 0.225, a: 0.12, len: 0.23, wid: 0.3, cols: ['#ebe7dc', '#f4f1e8', '#cfd0cc'], lay: 6, amp: 0.09, flies: true },  // the white one that flies
];
const FLY = SHEETS.findIndex(s => s.flies);
const APEX = { u: -0.27, out: 0.94, h: 0.67 }, LAND = { u: -0.12, out: 1.36 };      // how high it climbs, and where it comes down

const DOOR_GLSL = /* glsl */`
uniform sampler2D tPane; uniform vec4 uDoor; uniform vec4 uDisc[2]; uniform vec4 uCapA[4]; uniform vec4 uCapK[4]; uniform vec3 uBar, uGapC, uUmber; uniform float uGain;
varying vec3 vSt;
float dgSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1.0e-6), 0.0, 1.0); return length(pa - ba * h); }
vec3 degasC; float degasA;`;

lifeFor(14574, {
  title: /^Henri Degas and His Niece/,
  word: 'rustle',
  stage: { out: 1.6, half: 1.3, cam: { dist: 2.9, height: 1.5, side: -0.12, fov: 60, lookU: -0.12, lookOut: 0.7, lookH: 0.85, floorOut: 1.55 } },
  wake: 2, ret: 2.4,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.22) => P.near(h, a), hex = c => '#' + c.clone().getHexString();
    const rnd = this.rnd = rng(14574);
    // Everything is built in the stage's own metres (u, h, out) and stood in the room by one matrix.
    const root = this.root = new THREE.Group(); root.matrixAutoUpdate = false;
    root.matrix.makeBasis(new THREE.Vector3(L.tx, 0, L.tz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(L.nx, 0, L.nz)).setPosition(L.cx, L.y, L.cz);

    this.tex = this.paintTexture();
    const mu = this.mu = { uRev: { value: 0 } };
    const mat = new THREE.MeshStandardMaterial({ map: this.tex, vertexColors: true, roughness: 0.94, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.4, side: THREE.DoubleSide });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, mu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aRev; varying float vRev;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vRev = aRev;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uRev; varying float vRev;')
        .replace('#include <map_fragment>', '{ vec4 st = texture2D(map, vMapUv); if ((st.a - 0.3) / 0.7 > (uRev - vRev) * 3.2) discard; diffuseColor.rgb *= st.rgb; }')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= diffuseColor.rgb;');
    };
    mat.customProgramCacheKey = () => 'degas-papers';

    // ---------------------------------------------------------- one mesh: the papers first (they are laid again each
    // frame), then the table and the portfolio (which are not)
    const pos = [], nor = [], colr = [], uvs = [], rev = [], idx = [];
    const noise2 = (x, y) => { const h = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }; const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return lerp(lerp(h(xi, yi), h(xi + 1, yi), sx), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), sx), sy); };
    const mix3 = (set, k) => { const n = set.length - 1, x = clamp01(k) * n, i = Math.min(n - 1, Math.floor(x)); return set[i].clone().lerp(set[i + 1], x - i); };
    // A sheet: a grid ns long and nr across; its own streaky colours (his strokes run the length of a sheet).
    const sheet = (len, wid, ns, nr, set, r0, seed, fold = -1) => {
      const v0 = pos.length / 3, base = new Float32Array((ns + 1) * (nr + 1) * 3), cs = set.map(h => col(h));
      for (let i = 0; i <= ns; i++) for (let j = 0; j <= nr; j++) {
        const c = mix3(cs, noise2(j / nr * wid * 5 + seed * 7.1, i / ns * len * 3.4 + seed * 3.3) * 1.5 - 0.25), k = (i * (nr + 1) + j) * 3;
        const dark = i === fold ? 0.78 : (fold > 0 && (j === nr / 2 || i * 2 === fold || i * 2 === fold * 3)) ? 0.9 : (i === 0 || i === ns || j === 0 || j === nr) ? 0.93 : 1;
        base[k] = c.r * dark; base[k + 1] = c.g * dark; base[k + 2] = c.b * dark;
        pos.push(0, 0, 0); nor.push(0, 1, 0); colr.push(c.r, c.g, c.b); rev.push(r0 + 0.06 * rnd());
        if (fold > 0) uvs.push(0.5 + (8 + i / ns * 496) / 1024, (8 + j / nr * 496) / 512);      // (the newspaper's page: the right half of the texture)
        else uvs.push((0.06 + ((seed * 0.37) % 1) * 0.55 + i / ns * len) * 0.5, 0.06 + ((seed * 0.61) % 1) * 0.5 + j / nr * wid);
      }
      for (let i = 0; i < ns; i++) for (let j = 0; j < nr; j++) { const a = v0 + i * (nr + 1) + j, b = a + 1, c = a + nr + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      return { len, wid, ns, nr, v0, base, A: new Float32Array(ns + 1), Y: new Float32Array(ns + 1), roll: new Float32Array(ns + 1), fold: new Float32Array(ns + 1) };
    };
    // (the newspaper is two leaves, one on the other, a little askew, as a folded paper's leaves are)
    this.news = [0, 1].map(k => Object.assign(sheet(NL, NW, NSEG, NACR, ['#c3c8cb', '#dfe1dc', '#eeebe2', '#f4f1e9', '#f2eee3', '#ece4d2'], 0.78 + 0.05 * k, 1 + k * 0.37, NSEG / 2), { top: k, fph: 1.1 + 2.3 * k }));
    this.sheets = SHEETS.map((s, i) => Object.assign(sheet(s.len, s.wid, 10, 6, s.cols, 0.42 + i * 0.05, 2 + i), s, { fu: Math.sin(s.a), fo: Math.cos(s.a), ph: rnd() * TAU, w: 6.5 + rnd() * 3 }));
    this.dyn = pos.length / 3;
    // The table: turned on a lathe, the top in his red-browns, the pillar and foot dark.
    {
      const ky = (TH - 0.026) / 0.374, prof = [[0, 0], [0.165, 0], [0.172, 0.008], [0.168, 0.018], [0.12, 0.03], [0.07, 0.045], [0.04, 0.075], [0.03, 0.11], [0.034, 0.15], [0.05, 0.185], [0.052, 0.205], [0.036, 0.23], [0.03, 0.28], [0.034, 0.33], [0.06, 0.362], [0.13, 0.374]].map(([r, y]) => [r * 1.16, y * ky])
        .concat([[TR - 0.07, TH - 0.024], [TR - 0.012, TH - 0.022], [TR, TH - 0.016], [TR + 0.002, TH - 0.008], [TR - 0.004, TH - 0.001], [TR - 0.02, TH], [0.34, TH], [0.28, TH], [0.22, TH], [0.16, TH], [0.1, TH], [0.05, TH], [0.0001, TH]]);
      const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y)), 44), p = g.attributes.position, n = g.attributes.normal, v0 = pos.length / 3;
      const top = [col('#4b2619', 0.3), col('#6a3320', 0.3), col('#7b3d24', 0.3), col('#8a4628', 0.3), col('#96552f', 0.3)], dark = [col('#24140e', 0.2), col('#38201a', 0.2), col('#4a2a1c', 0.2)], line = col('#b0774a', 0.3);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = Math.hypot(x, z), ang = Math.atan2(z, x);
        let c;
        if (y >= TH - 0.0005) { c = mix3(top, 0.15 + 0.9 * noise2(x * 5.2 + 3.1, z * 7.4 + 1.7) - 0.25 * clamp01((z - 0.05) / 0.3)); if (r > TR - 0.03) c.lerp(line, 0.5); }      // (a lighter line at the rim, as he has it)
        else if (y > TH - 0.025) c = mix3(dark, 0.6 + 0.4 * Math.sin(ang * 3 + 1)).lerp(top[1], 0.5);
        else c = mix3(dark, 0.5 + 0.5 * Math.sin(ang * 2 + y * 20));
        pos.push(TU + x, y, TO + z); nor.push(n.getX(i), n.getY(i), n.getZ(i)); colr.push(c.r, c.g, c.b);
        rev.push(y >= TH - 0.0005 ? 0.12 * (0.5 + z / TR * 0.5) : 0.1 + 0.14 * (1 - y / TH));      // (the top first, from the back; then the pillar, down to the foot)
        if (y >= TH - 0.0005) uvs.push((TU + x + 0.85) * 0.5, TO + z - 0.15); else uvs.push((0.1 + y / TH * 0.8) * 0.5, 0.1 + (ang / TAU + 0.5) * 0.8);
      }
      for (let i = 0; i < g.index.count; i++) idx.push(v0 + g.index.getX(i));
      g.dispose();
    }
    // The portfolio: salmon boards, a wad of white leaves showing at two of its edges.
    {
      const boards = [col('#a8826c', 0.3), col('#b89078', 0.3), col('#96705c', 0.3)], leaves = [col('#e9e4d6', 0.2), col('#cfcabd', 0.2), col('#f2eee2', 0.2)];
      const box = (w, h, d, y, colOf) => {
        const g = new THREE.BoxGeometry(w, h, d, 4, 1, 3).toNonIndexed(), p = g.attributes.position, n = g.attributes.normal, v0 = pos.length / 3, yaw = -0.42, cs = Math.cos(yaw), sn = Math.sin(yaw);
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), yy = p.getY(i), z = p.getZ(i), nx = n.getX(i), nz = n.getZ(i), c = colOf(x, yy, z, nx, n.getY(i), nz);
          pos.push(TU + 0.13 + x * cs + z * sn, TH + y + yy, TO - 0.05 - x * sn + z * cs); nor.push(nx * cs + nz * sn, n.getY(i), -nx * sn + nz * cs); colr.push(c.r, c.g, c.b); rev.push(0.36 + 0.05 * rnd());
          uvs.push((0.5 + x + z * 0.3) * 0.5, 0.5 + z + yy * 3); idx.push(v0 + i);
        }
        g.dispose();
      };
      box(0.232, 0.019, 0.166, 0.014, (x, y, z, nx, ny) => (Math.abs(ny) > 0.5 ? boards[0] : nx < -0.5 ? boards[2] : mix3(leaves, 0.5 + 0.5 * Math.sin(y * 900 + x * 40 + z * 31))));
      box(0.241, 0.004, 0.175, 0.0255, (x, y, z) => mix3(boards, 0.2 + 0.8 * noise2(x * 14 + 2, z * 20 + 5)));
      box(0.241, 0.0035, 0.175, 0.004, () => boards[2]);
    }
    const geo = this.geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos = new Float32Array(pos), 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('normal', new THREE.BufferAttribute(this.nor = new Float32Array(nor), 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col = new Float32Array(colr), 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geo.setAttribute('aRev', new THREE.BufferAttribute(new Float32Array(rev), 1));
    geo.setIndex(idx);
    this.things = new THREE.Mesh(geo, mat); this.things.name = 'table and papers'; root.add(this.things);

    // ---------------------------------------------------------- the door's light on the floor, and the shadows in it
    this.tPane = strokeTex({ size: 512, base: hex(col('#c2ad5c', 0.3)), n: 2000, len: [26, 60], width: [8, 17], bend: 0.25, lift: 0.18, seed: 226,
      angle: (x, y, r) => 0.25 + (r() - 0.5) * 0.9,
      colors: [[hex(col('#cdb866', 0.3)), 4], [hex(col('#d9c67a', 0.3)), 3], [hex(col('#b8a452', 0.3)), 2.4], [hex(col('#a59a4e', 0.3)), 1.5], [hex(col('#e3d08a', 0.25)), 1.6], [hex(col('#c9a878', 0.3)), 0.8], [hex(col('#aeb070', 0.3)), 0.8]] });
    const fu = this.fu = {
      tPane: { value: this.tPane }, uDoor: { value: new THREE.Vector4(0, 0, 0, 0) },           // swing, light, how far it is laid in, -
      uDisc: { value: [new THREE.Vector4(TU + SLEAN * RUN * TH, TO + RUN * TH, TR, 0.85), new THREE.Vector4(TU + 0.01, TO + 0.02, 0.2, 0.75)] },      // the top's shadow; the foot's
      uGain: { value: 0.42 },
      uCapA: { value: Array.from({ length: 4 }, () => new THREE.Vector4(9, 9, 9, 9)) },           // shadows as capsules: from (u, out) to (u, out)
      uCapK: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0.1, 0, 0.03, 0)) },      // radius, strength, softness, -
      uBar: { value: col('#5a2f24', 0.3) }, uGapC: { value: col('#ecd488', 0.2) }, uUmber: { value: col('#22160f', 0.15) },
    };
    fu.uCapA.value[0].set(TU, TO, TU + SLEAN * RUN * TH, TO + RUN * TH); fu.uCapK.value[0].set(0.04, 0.8, 0.03, 0);      // the pillar's
    const fm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
    fm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, fu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSt;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vSt = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + DOOR_GLSL)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 q = vSt.xz; vec4 sl = texture2D(tPane, q / 1.3 + vec2(0.21, 0.4)); float id = (sl.a - 0.3) / 0.7;
  float o = q.y - ${O0.toFixed(3)}, v = o / ${LEN.toFixed(3)}, wy = clamp(v, 0.0, 1.0), sp = 1.0 + ${SPREAD.toFixed(3)} * v, mid = ${UC.toFixed(3)} + ${LEAN.toFixed(3)} * o + 0.1 * uDoor.x * o;
  float ul = mid - ${(WID / 2).toFixed(3)} * sp, ur = mid + ${(WID / 2).toFixed(3)} * sp;
  float uf = ur - uDoor.x * (0.03 + 0.42 * max(o, 0.0)), lw = max(uf - ul, 0.05);             // the leaf's free edge, and its width here
  float soft = 0.014 + 0.045 * wy, bias = (id - 0.5) * 0.02, ends = min(o, ${LEN.toFixed(3)} - o);
  // the leaf: its stiles and rails, its glazing bars (two panes across, four up)
  float dLeaf = min(min(q.x - ul, uf - q.x) - 0.045, ends - 0.05 * (0.7 + wy));
  vec2 f = abs(fract(vec2((q.x - ul) / lw * 2.0, pow(wy, 0.88) * 4.0)) - 0.5);
  float dBar = min((0.5 - f.x) * lw * 0.5 - 0.022, (0.5 - f.y) * ${(LEN / 4).toFixed(3)} * (0.7 + 0.6 * wy) - 0.028);
  float pane = smoothstep(-soft, soft, min(dLeaf, dBar) + bias);
  float leaf = smoothstep(-soft, soft, min(min(q.x - ul, uf - q.x), ends) + bias * 0.6);
  float gap = smoothstep(-soft, soft, min(min(q.x - uf, ur - q.x), ends) + bias);
  // laid in a stroke at a time, from the wall out; fainter far from the door
  float laid = smoothstep(0.0, 0.45, uDoor.z * 1.5 - wy) * uDoor.y * (1.0 - 0.5 * smoothstep(0.3, 1.0, wy));
  // what stands in the light
  float sh = 0.0;
  for (int i = 0; i < 2; i++) sh = max(sh, uDisc[i].w * (1.0 - smoothstep(uDisc[i].z - 0.05, uDisc[i].z + 0.04, length(q - uDisc[i].xy) + bias)));
  for (int i = 0; i < 4; i++) sh = max(sh, uCapK[i].y * (1.0 - smoothstep(uCapK[i].x - uCapK[i].z, uCapK[i].x + uCapK[i].z, dgSeg(q, uCapA[i].xy, uCapA[i].zw) + bias * 0.5)));
  // light, not paint: it is added to the floor, so the boards show through it (scumbled, as his yellow is); the bars
  // are his red-brown, thinly; a shadow takes the light away and darkens the boards a little
  float lit = max(pane * leaf * 0.62, gap * 0.82) * (0.72 + 0.5 * sl.g) * laid * (1.0 - 0.94 * sh);
  float bars = leaf * (1.0 - pane) * (1.0 - gap) * laid * 0.3 * (1.0 - sh);
  float a2 = 0.34 * sh * uDoor.y * smoothstep(0.0, 0.3, uDoor.z);
  degasC = mix(sl.rgb, uGapC, 0.4 * gap) * lit * uGain + uBar * bars + uUmber * a2; degasA = clamp(a2 + bars + 0.1 * lit, 0.0, 0.9);
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = degasC; diffuseColor.a = degasA;\n#include <opaque_fragment>');
    };
    fm.customProgramCacheKey = () => 'degas-door-floor';
    {
      const g = new THREE.BufferGeometry(), y = 0.012, x0 = -1.75, x1 = 0.55, z0 = 0.03, z1 = 1.9;
      g.setAttribute('position', new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3)); g.computeVertexNormals();
      this.light = new THREE.Mesh(g, fm); this.light.renderOrder = 5; this.light.name = 'the door’s light'; root.add(this.light);
    }
    L.add(root);
    this.blobs = L.blobs(1, { y: L.y + TH + 0.011 });
    this.air = L.k.loop({ lp: 420, hp: 90 });
    this.V = new THREE.Vector3();
    this.push = [{ u: 0, o: 0, vu: 0, vo: 0 }, { u: 0, o: 0, vu: 0, vo: 0 }];      // the papers on the floor, shoved by the toy: the newspaper, the sheet
    this.stir = 0; this.at = 0; this.lin = 0; this.speed = 1; this.rust = 0;
    this.hide();
  },

  // His paint, in one texture. The left half: broad dragged strokes, in greys (the colour is in the vertices). The right
  // half: the newspaper's page, in the same strokes, with its print the way he painted print (the newspaper in his
  // Cotton Office of 1873): grey hatching in columns, a title across the head, nothing to read. The alpha is each
  // stroke's own number, so things can be brushed in a stroke at a time.
  paintTexture() {
    const W = 1024, H = 512, r = rng(1876);
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c.getContext('2d', { willReadFrequently: true }); };
    const g = mk(), gi = mk();
    const region = (x0, fill, n, lens, wids, tones) => {
      for (const c of [g, gi]) { c.save(); c.beginPath(); c.rect(x0, 0, 512, H); c.clip(); c.lineCap = 'round'; }
      g.fillStyle = fill; g.fillRect(x0, 0, 512, H); gi.fillStyle = 'rgb(90,90,90)'; gi.fillRect(x0, 0, 512, H);
      for (let i = 0; i < n; i++) {
        const x = x0 + r() * 512, y = r() * H, a = (r() - 0.5) * 0.4, l = lens[0] + r() * (lens[1] - lens[0]), w = wids[0] + r() * (wids[1] - wids[0]), v = tones[Math.floor(r() * tones.length)], id = 80 + Math.floor(r() * 175);
        const dx = Math.cos(a) * l / 2, dy = Math.sin(a) * l / 2, b = (r() - 0.5) * 0.14 * l;
        for (const [c, st] of [[g, `rgb(${v},${v},${v})`], [gi, `rgb(${id},${id},${id})`]]) { c.strokeStyle = st; c.lineWidth = w; c.beginPath(); c.moveTo(x - dx, y - dy); c.quadraticCurveTo(x - Math.sin(a) * b, y + Math.cos(a) * b, x + dx, y + dy); c.stroke(); }
      }
    };
    region(0, '#dedede', 800, [44, 120], [10, 24], [255, 250, 244, 236, 226, 214]);
    for (const c of [g, gi]) c.restore();
    region(512, '#ececec', 420, [70, 190], [14, 32], [255, 252, 247, 240, 231]);
    // the page: its length runs across the texture; the lines of type run down it
    const X0 = 512, ink = a => `rgba(46,44,48,${a.toFixed(2)})`;
    for (let k = 0; k < 13; k++) { const y = 96 + k * 25 + (r() - 0.5) * 4; g.strokeStyle = ink(0.62 + 0.2 * r()); g.lineWidth = 7 + 4 * r(); g.beginPath(); g.moveTo(X0 + 24 + 3 * r(), y); g.lineTo(X0 + 46 + 3 * r(), y + (r() - 0.5) * 6); g.stroke(); }      // the title
    g.strokeStyle = ink(0.5); g.lineWidth = 1.6; g.beginPath(); g.moveTo(X0 + 58, 16); g.lineTo(X0 + 58, H - 16); g.stroke();
    for (let c = 0; c < 5; c++) {
      const y0 = 16 + c * 97, y1 = y0 + 86; let on = true, head = 0;
      for (let x = X0 + 68; x < X0 + 498; x += 5) {
        if (Math.abs(x - (X0 + 256)) < 7) continue;                       // (the fold)
        if (r() < 0.05) on = !on || r() < 0.7; if (on && head <= 0 && r() < 0.035) head = 3;
        if (!on) continue;
        if (head > 0) { head--; g.strokeStyle = ink(0.6); g.lineWidth = 3.4; g.beginPath(); g.moveTo(x, y0 + 6 + 8 * r()); g.lineTo(x, y1 - 8 - 14 * r()); g.stroke(); if (head === 0) x += 6; continue; }
        g.strokeStyle = ink(0.3 + 0.25 * r()); g.lineWidth = 2.1; g.beginPath(); g.moveTo(x + (r() - 0.5), y0 + (r() < 0.12 ? 9 : 0)); g.lineTo(x + (r() - 0.5), y1 - (r() < 0.2 ? 30 * r() : 0)); g.stroke();
      }
    }
    for (const c of [g, gi]) c.restore();
    const a = g.getImageData(0, 0, W, H).data, b = gi.getImageData(0, 0, W, H).data, out = new Uint8Array(W * H * 4);
    for (let i = 0; i < W * H * 4; i += 4) { out[i] = a[i]; out[i + 1] = a[i + 1]; out[i + 2] = a[i + 2]; out[i + 3] = b[i]; }
    const t = new THREE.DataTexture(out, W, H, THREE.RGBAFormat);
    t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 8; t.needsUpdate = true;
    return t;
  },

  hide() { this.things.visible = false; this.light.visible = false; this.blobs.count = 0; if (this.air) this.air.set(0); },

  // ---------------------------------------------------------- the sound: paper, the latch, and nothing else
  band(L, slow, soft) {
    const s = score(L), r = rng(1875), at = t => t * slow;
    // a rustle: many small dry grains, thickest in the middle, over a breath of hiss
    const rustle = (t0, d, vol, bright = 1, dens = 30) => {
      const n = Math.max(3, Math.round(d * dens));
      for (let i = 0; i < n; i++) { const x = (i + r()) / n; s.hit(at(t0 + x * d), { d: 0.018 + 0.05 * r(), vol: vol * soft * (0.35 + 0.65 * r()) * (0.35 + 0.65 * Math.sin(Math.PI * x)), bp: (2300 + 4300 * r() * r()) * bright, q: 0.8 + 1.6 * r(), attack: 0.002 + 0.006 * r() }); }
      s.hit(at(t0), { d: d * slow, vol: vol * soft * 0.3, hp: 2600 * bright, attack: d * slow * 0.4 });
    };
    const pat = (t0, vol) => { s.hit(at(t0), { d: 0.1, vol: vol * soft, lp: 800, attack: 0.004 }); s.hit(at(t0), { d: 0.05, vol: vol * soft * 0.5, bp: 2600, q: 0.8 }); };
    // the brush, laying it in
    for (let i = 0; i < 7; i++) s.hit(at(0.25 + i * 0.24 + 0.06 * r()), { d: 0.2, vol: 0.0045 * soft, bp: 1500 + 500 * r(), q: 0.7, attack: 0.07 });
    // the latch
    s.hit(at(T_DOOR), { d: 0.03, vol: 0.016 * soft, lp: 1500, attack: 0.002 }); s.note(at(T_DOOR), 196, 0.07, { type: 'sine', vol: 0.014 * soft, to: 130, attack: 0.004 });
    s.hit(at(T_DOOR + 0.09), { d: 0.02, vol: 0.008 * soft, bp: 2400, q: 2 });
    rustle(2.75, 0.75, 0.007, 1.1);                                    // the corners lift
    rustle(3.1, 0.5, 0.006, 0.9);                                      // the newspaper fills, and creeps
    rustle(T_SLIDE, T_OFF - T_SLIDE, 0.013, 0.85, 36);                 // it runs off the table
    rustle(T_OFF - 0.1, FALL + 0.15, 0.02, 0.8, 44);                   // and pours down
    pat(T_OFF + FALL * 0.82, 0.02);
    rustle(T_OFF + FALL, 0.7, 0.006, 1);                               // settling
    rustle(T_LIFT, 0.3, 0.008, 1.3);                                   // the sheet flicks up
    for (let i = 0; i < 4; i++) rustle(T_APEX + 0.18 + i * 0.41, 0.16, 0.0045, 1.4);      // and turns at the end of each slide
    pat(T_DOWN, 0.011); rustle(T_DOWN, 0.35, 0.006, 1.2);
    rustle(8.0, 0.5, 0.003, 1);                                        // the corners lie down
    // while you keep looking: the door breathes, the papers stir
    const again = score(L); const keep = s.ev; s.ev = again.ev; rustle(0.5, 1.5, 0.0045, 1); rustle(1.9, 0.8, 0.003, 1.2); s.ev = keep;
    s.loop(at(BREATH0), BREATH * slow, again.ev.map(e => ({ ...e, t: e.t })));
    return s.done();
  },

  start(L, resumed) {
    this.lin = resumed ? this.at - L.t : 0; this.run = 0;
    if (!resumed) { this.speed = L.calm ? 0.6 : 1; this.sc = this.band(L, 1 / this.speed, L.calm ? 0.6 : 1); for (const p of this.push) p.u = p.o = p.vu = p.vo = 0; this.stir = 0; }
    this.sc.from(resumed ? this.at : 0);
    if (!this.told && !L.quiet) { this.told = true; L.k.say('A door comes ajar, and the air stirs the papers on the table.', 4); }
  },
  back(L) { if (!L.quiet) { const v = L.voice(); if (v.ctx) L.k.synth.noise(1.4, { vol: 0.006, lp: 3000 }); } },
  end() { this.hide(); this.air.stop(); },
  reset() { this.hide(); this.air.stop(); this.told = false; this.at = this.lin = 0; },

  // The draught at story-time t (0 to 1): a first breath, then the whole of it, then gone; and now and then a little.
  gust(t) {
    let g = (0.35 * ease.smooth(ramp(t, 2.55, 3.1)) + 0.3 * hump(t, 2.55, 3.7) + 0.65 * ease.smooth(ramp(t, 3.6, 4.5))) * (1 - ease.smooth(ramp(t, 6.7, 8.3)));
    if (t > BREATH0) { const n = Math.floor((t - BREATH0) / BREATH), t0 = BREATH0 + n * BREATH; g += (0.34 + 0.1 * ((n * 5) % 3)) * hump(t, t0, t0 + 3.4); }
    return g;
  },
  // What a thing lies on: the table's top, or the floor.
  ground(u, o) { const dx = u - TU, dz = o - TO; return dx * dx + dz * dz < (TR - 0.003) * (TR - 0.003) ? TH : 0; },

  // The newspaper's midline at story-time t, into S.A (metres from the table's middle, the way it goes) and S.Y.
  // On the table and over its edge until T_OFF; then its tail comes down after it, and it lies on the floor.
  paper(S, t, flut, breath) {
    const up = S.top ? 1 : 0.3, A = S.A, Y = S.Y, R = S.roll, F = S.fold, seg = NL / NSEG, yT = TH + 0.0085, wind = this.gust(t);
    const down = (phi, tip, e, y, bel) => phi * (1 - tip * Math.exp(-e / 0.045)) * (1 - bel * (1 - clamp01(y / TH))) * Math.pow(clamp01((y - FLOOR) / 0.19), 0.7);
    const free = y => 0.0012 + 0.011 * clamp01((y - FLOOR - 0.01) / 0.07);      // (where it hangs free it falls into long soft folds, as he painted it)
    if (t < T_OFF) {
      const creep = 0.022 * ease.smooth(ramp(t, 2.9, 3.4)), q = ramp(t, T_SLIDE, T_OFF), g = G0 + creep + (NL - G0 - creep) * Math.pow(q, 1.9), xe = NL - g;
      const sway = Math.sin(t * 4.3 + 0.6) * 0.5 + Math.sin(t * 6.7) * 0.25;
      const phi = 1.5 - wind * (0.46 + 0.16 * sway * (1 - q)), bel = 0.3 * wind, lift = 0.034 * up * wind * (0.6 + 0.4 * flut) * (1 - q);
      let a = AE, y = yT, xp = xe;
      for (let i = 0; i <= NSEG; i++) {
        const x = i * seg;
        if (x <= xe) { const k = clamp01(1 - x / 0.15); A[i] = AE - (xe - x); Y[i] = yT + lift * k * k; R[i] = 0; F[i] = 0.0015; continue; }
        const ds = x - xp, th = down(phi, 1, (x + xp) / 2 - xe, y, bel);
        a += ds * Math.cos(th); y = Math.max(FLOOR, y - ds * Math.sin(th)); A[i] = a; Y[i] = y; xp = x;
        R[i] = 0.1 * wind * sway * (1 - q) * clamp01((x - xe) / 0.2); F[i] = 0.0015 + (free(y) - 0.0015) * clamp01((x - xe) / 0.09);
      }
      return;
    }
    const tt = t - T_OFF, q2 = clamp01(tt / FALL), s = ease.smooth(Math.pow(q2, 0.9)), lay = tt - FALL;
    const hB = lay > 0 ? 0.15 * up * breath * (0.7 + 0.3 * flut) : 0;                                   // (afterwards, its tail lifts when the door breathes)
    const phi = Math.max(1.08 * Math.pow(1 - s, 0.6), 0.6), tip = (1 - 1.8 * ease.smooth(ramp(q2, 0, 0.35))) * (1 - ease.smooth(ramp(q2, 0.45, 0.9)));
    let a = AE + 0.11 * (1 - Math.exp(-tt / 0.22)), y = lerp(yT, FLOOR, s) + hB; A[0] = a; Y[0] = y; R[0] = 0; F[0] = free(y);
    for (let i = 1; i <= NSEG; i++) {
      const th = down(phi, tip, (i - 0.5) * seg, y, 0.3 * (1 - s));
      a += seg * Math.cos(th); y = Math.max(FLOOR, y - seg * Math.sin(th)); A[i] = a; Y[i] = y; F[i] = free(y);
      R[i] = 0.16 * Math.sin(t * 8 + i * 0.3) * (1 - q2) * (1 - i / NSEG);
    }
    // the fold across its middle stands up a little where it lies, and sinks
    const ridge = (S.top ? 0.05 : 0.036) * ease.smooth(ramp(q2, 0.7, 1)) * (0.55 + 0.45 * Math.exp(-Math.max(0, lay) / 1.3)) + 0.012 * breath;
    if (ridge > 0.0005) for (let i = 1; i < NSEG; i++) { const k = 1 - Math.abs(i * seg - NL / 2) / 0.11; if (k > 0 && Y[i] < FLOOR + 0.03) Y[i] += ridge * k * k * (3 - 2 * k); }
  },

  // A sheet's vertices from its midline (S.A, S.Y, S.roll): origin (ou, oo), the way it runs (fu, fo); never below
  // what it lies on (by `lay`). The light is from the door: behind, to the left, above.
  skin(S, ou, oo, fu, fo, lay) {
    const { ns, nr, wid, v0, base } = S, P = this.pos, N = this.nor, C = this.col, A = S.A, Y = S.Y, RL = S.roll, FD = S.fold, ru = -fo, ro = fu, kf = TAU / 0.19;
    for (let i = 0; i <= ns; i++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(ns, i + 1), da = A[i1] - A[i0], dy = Y[i1] - Y[i0], l = Math.hypot(da, dy) || 1, c = da / l, s = dy / l;
      const cr = Math.cos(RL[i]), sr = Math.sin(RL[i]), fd = FD[i];
      const wu = ru * cr - fu * s * sr, wy = c * sr, wo = ro * cr - fo * s * sr, nu = -fu * s * cr - ru * sr, ny = c * cr, no = -fo * s * cr - ro * sr;
      const bu = ou + fu * A[i], bo = oo + fo * A[i];
      for (let j = 0; j <= nr; j++) {
        const r = (j / nr - 0.5) * wid, m = i * (nr + 1) + j, k = (v0 + m) * 3;
        // (long soft folds down its length, drifting across it: out along the normal, and the normal leans with them)
        const w = fd ? kf * r + (S.fph || 0) + i * 0.16 : 0, d = fd ? fd * Math.sin(w) : 0, dd = fd ? fd * kf * Math.cos(w) : 0;
        const x = bu + wu * r + nu * d, z = bo + wo * r + no * d;
        let y = Y[i] + wy * r + ny * d, mu = nu - wu * dd, my = ny - wy * dd, mo = no - wo * dd;
        const g = (y > TH - 0.05 ? this.ground(x, z) : 0) + lay;      // (the table's top only stops what comes down on it)
        if (y < g) { y = g; mu *= 0.4; mo *= 0.4; }
        const ml = Math.hypot(mu, my, mo) || 1; mu /= ml; my /= ml; mo /= ml;
        const kk = Math.pow(clamp01(0.5 + 0.5 * (-0.3 * mu + 0.72 * my - 0.62 * mo)), 0.8);
        P[k] = x; P[k + 1] = y; P[k + 2] = z; N[k] = mu; N[k + 1] = my; N[k + 2] = mo;
        C[k] = base[m * 3] * lerp(0.6, 1.04, kk); C[k + 1] = base[m * 3 + 1] * lerp(0.65, 1.0, kk); C[k + 2] = base[m * 3 + 2] * lerp(0.74, 0.93, kk);
      }
    }
  },

  // A sheet lying where it lies, its windward end lifted h (and one corner more than the other).
  lie(S, ou, oo, fu, fo, y0, h, lay) {
    const A = S.A, Y = S.Y, R = S.roll, seg = S.len / S.ns; let a = -S.len / 2, y = y0 + h; A[0] = a; Y[0] = y; R[0] = h * 4;
    for (let i = 1; i <= S.ns; i++) { const th = 0.8 * Math.pow(clamp01((y - y0) / 0.05), 0.7); a += seg * Math.cos(th); y = Math.max(y0, y - seg * Math.sin(th)); A[i] = a; Y[i] = y; R[i] = h * 4 * clamp01(1 - i * seg / 0.11); }
    this.skin(S, ou, oo, fu, fo, lay);
  },

  // The sheet that flies, at story-time t: where its middle is (into o: u, h, out), the way it runs, its pitch, bend and roll.
  flight(t, o) {
    const s0 = this.sheets[FLY], x0 = TU + s0.x, z0 = TO + s0.z, y0 = TH + 0.0012 * s0.lay;
    const AX = 0.97, AZ = 0.24, A0 = 0.29, A1 = 0.1;                 // the line it slides along as it falls, and how far each way
    o.land = 0;
    if (t < T_AIR) {            // its windward end comes up; it slides, and is off
      const q = ease.in(ramp(t, T_LIFT, T_AIR));
      o.u = x0 - 0.02 * q; o.h = y0 + 0.04 * q; o.o = z0 + 0.03 * q; o.fu = s0.fu; o.fo = s0.fo; o.pitch = -0.5 * ease.smooth(ramp(t, T_LIFT, T_AIR)); o.bend = 1.3 * q; o.roll = 0.1 * q; return;
    }
    if (t < T_APEX) {           // up, like a kite, turning to lie along the way it will slide; it stalls at the top
      const q = (t - T_AIR) / (T_APEX - T_AIR), e = ease.smooth(q), k = 1 - (1 - q) * (1 - q);
      o.u = lerp(x0 - 0.02, APEX.u, e); o.o = lerp(z0 + 0.03, APEX.out, e); o.h = lerp(y0 + 0.04, APEX.h, k);
      const yaw = lerp(Math.atan2(s0.fu, s0.fo), Math.atan2(AX, AZ), e); o.fu = Math.sin(yaw); o.fo = Math.cos(yaw);
      o.pitch = lerp(-0.5, 0.3, e) - 0.3 * Math.sin(Math.PI * q); o.bend = 1.3 + 1.0 * Math.sin(Math.PI * q); o.roll = 0.1 + 0.25 * Math.sin(Math.PI * q) - 0.1 * e; return;
    }
    // down, as a sheet of paper falls: sliding along itself one way, stalling, and back the other, less each time
    const D = T_DOWN - T_APEX, tau = Math.min(t, T_DOWN) - T_APEX, p = tau / D, psi = TAU / 0.84 * tau, amp = lerp(A0, A1, p), sl = -amp * Math.cos(psi);
    const flare = ease.smooth(ramp(p, 0.88, 1)), go = ramp(p, 0, 0.1);
    o.u = lerp(APEX.u + AX * A0, LAND.u, p) + AX * sl; o.o = lerp(APEX.out + AZ * A0, LAND.out, p) + AZ * sl;
    o.h = Math.max(FLOOR, FLOOR + (APEX.h - FLOOR) * (1 - Math.pow(p, 1.15)) + (0.045 * Math.cos(psi) * Math.cos(psi) - 0.045 + 0.02 * Math.sin(2 * psi)) * Math.sin(Math.PI * Math.min(1, p * 1.05)));
    o.fu = AX; o.fo = AZ; o.pitch = (0.3 * (1 - go) - 0.5 * Math.sin(psi) * go) * (1 - flare);
    o.bend = (1.5 * Math.sin(psi) * go + 0.5 * (1 - p)) * (1 - flare); o.roll = 0.16 * Math.sin(psi * 0.5 + 1) * (1 - flare) * go;
    if (t >= T_DOWN) { const k = 1 - Math.exp(-(t - T_DOWN) / 0.18); o.u += AX * 0.05 * k; o.o += AZ * 0.05 * k; o.h = FLOOR; o.pitch = 0; o.bend = 0; o.roll = 0; o.land = 1; }
  },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', linger = ph === 'linger', back = ph === 'return';
    if (!showing && !linger && !back) { this.hide(); return; }
    if (linger) this.lin += dt; else if (back) this.run += dt;
    const calm = L.calm, clock = this.at = L.t + this.lin, t = clock * this.speed, ts = (clock + this.run) * this.speed, gone = back ? L.ret : 0;
    if (showing) this.sc.play(clock);
    const voice = L.voice(); voice.level = calm ? 0.7 : 1; voice.place();
    const still = back ? 1 - ease.smooth(ramp(gone, 0, 0.3)) : 1;      // (going back, the air drops first)
    const toy = this.toy(L, dt, (showing || linger) && t > T_PAINT[1]);
    const wind = (this.gust(t) + this.stir) * still, breath = (t > BREATH0 ? this.gust(t) : 0) * still + this.stir * still;
    const fl = k => (calm ? 0.25 * Math.sin(ts * (3.4 + k * 0.6) + k * 2.1) : 0.6 * Math.sin(ts * (7 + k * 1.7) + k * 2.1) + 0.4 * Math.sin(ts * (11.3 + k) + k));

    // ---- brushed in, a stroke at a time; and thinned away again
    const laid = ease.smooth(ramp(t, T_PAINT[0], T_PAINT[1])) * (back ? 1 - ease.inOut(ramp(gone, 0.12, 0.95)) : 1);
    this.mu.uRev.value = laid * 1.36; this.things.visible = laid > 0.004;
    const stands = ease.smooth(ramp(laid, 0.12, 0.45));                  // (the table throws its shadow once it is there)
    // ---- the door's light: laid on the floor; ajar; breathing
    const F = this.fu, ajar = ease.smooth(ramp(t, T_DOOR, T_DOOR + 0.5)) * (0.12 + 0.88 * Math.min(1, this.gust(t + 0.3) + 0.1 * (1 - ease.smooth(ramp(t, 7.4, 8.6)))));
    const lit = ease.smooth(ramp(t, 0, 0.9)) * (back ? 1 - ease.smooth(ramp(gone, 0.4, 1)) : 1);
    F.uDoor.value.set((ajar + 0.3 * this.stir) * still, lit * (0.9 + 0.1 * ajar), ease.smooth(ramp(t, 0, 1.2)) * (back ? 1 - ease.inOut(ramp(gone, 0.3, 1)) : 1), 0);
    this.light.visible = lit > 0.003;
    F.uDisc.value[0].w = 0.85 * stands; F.uDisc.value[1].w = 0.75 * stands; F.uCapK.value[0].y = 0.8 * stands;

    // ---- the newspaper
    const pn = this.push[0], nu0 = TU + PO * DO + pn.u, no0 = TO - PO * DU + pn.o;      // (its way's own origin: beside the table's middle)
    for (const S of this.news) {      // (the upper leaf a breath behind the lower as they go)
      this.paper(S, t - (S.top ? 0.07 * ramp(t, T_SLIDE, T_OFF) * (1 - ramp(t, T_OFF + FALL, T_OFF + FALL + 0.3)) : 0), fl(S.top), breath);
      const slew = S.top * (0.015 + 0.075 * ease.smooth(ramp(t, T_OFF - 0.3, T_OFF + FALL))), cs = Math.cos(slew), sn = Math.sin(slew);
      this.skin(S, nu0 - (DO * 0.012 + DU * 0.006) * S.top, no0 + (DU * 0.012 - DO * 0.006) * S.top, DU * cs - DO * sn, DO * cs + DU * sn, 0.0085 + 0.003 * S.top);
    }
    {
      // its shadow: from where it leaves the table (or its tail) to its far end, thrown by how high each is
      const A = this.news[0].A, Y = this.news[0].Y;
      const a0 = t < T_OFF ? AE : A[0], y0 = t < T_OFF ? TH : Y[0], a1 = A[NSEG], y1 = Y[NSEG], inset = NW * 0.34, lying = clamp01(1 - Math.max(y0, y1) / 0.1);
      const sx = (a, y) => nu0 + DU * a + SLEAN * RUN * y, sz = (a, y) => no0 + DO * a + RUN * y;
      const aa = a0 + inset * lying, ab = Math.max(aa + 0.01, a1 - inset * (0.4 + 0.6 * lying));
      F.uCapA.value[1].set(sx(aa, y0), sz(aa, y0), sx(ab, y1), sz(ab, y1));
      F.uCapK.value[1].set(NW * 0.5 - 0.02 + 0.03 * lying, 0.8 * laid, 0.02 + 0.05 * (1 - lying), 0);
    }
    // ---- the loose sheets on the table: their windward ends lift in the draught; one of them flies
    const off = ease.smooth(ramp(t, T_OFF - 0.2, T_OFF + 0.4)), fly = this.fly || (this.fly = {});
    this.sheets.forEach((S, i) => {
      const y0 = TH + 0.0012 * S.lay, k = S.under ? off : 1, ou = TU + S.x, oo = TO + S.z;
      if (S.flies && t >= T_LIFT) {
        this.flight(t, fly);
        const pf = this.push[1], A = S.A, Y = S.Y, seg = S.len / S.ns, m = S.ns / 2, shiver = fly.land ? 0.02 * breath * (0.6 + 0.4 * fl(7)) : 0;
        A[m] = 0; Y[m] = fly.h + shiver * 0.5;
        for (let n = m; n < S.ns; n++) { const th = fly.pitch + fly.bend * ((n + 0.5) * seg - S.len / 2); A[n + 1] = A[n] + seg * Math.cos(th); Y[n + 1] = Y[n] + seg * Math.sin(th); }
        for (let n = m; n > 0; n--) { const th = fly.pitch + fly.bend * ((n - 0.5) * seg - S.len / 2) - shiver * 14 * clamp01(1 - n / 4); A[n - 1] = A[n] - seg * Math.cos(th); Y[n - 1] = Y[n] - seg * Math.sin(th); }
        for (let n = 0; n <= S.ns; n++) S.roll[n] = fly.roll + (calm ? 0 : 0.05 * (1 - fly.land) * Math.sin(ts * 9 + n * 0.5));
        const fx = fly.u + pf.u, fz = fly.o + pf.o;
        this.skin(S, fx, fz, fly.fu, fly.fo, fly.land ? FLOOR : 0.008);
        // its shadow: on the table while it is over it, then on the floor
        const over = this.ground(fx, fz) > 0, h = fly.h - (over ? TH : 0), sx = fx + SLEAN * RUN * fly.h, sz = fz + RUN * fly.h;
        F.uCapA.value[2].set(sx - fly.fu * 0.03, sz - fly.fo * 0.03, sx + fly.fu * 0.03, sz + fly.fo * 0.03);
        F.uCapK.value[2].set(0.085 + 0.02 * fly.h, (fly.land ? 0.55 : 0.75 * (1 - 0.5 * clamp01(fly.h / 0.8))) * laid, 0.02 + 0.09 * clamp01(fly.h / 0.6), 0);
        if (over && h > 0.012 && h < 0.3) { const p = L.floor(fx + SLEAN * 0.3 * h, fz + 0.3 * h, this.V); this.blobs.set(0, p.x, p.z, 0.11 + 0.1 * h, 0.5 * (1 - h / 0.3) * laid); this.blobs.count = 1; } else this.blobs.count = 0;
        return;
      }
      if (S.flies) { F.uCapK.value[2].y = 0; this.blobs.count = 0; }
      const lift = S.amp * k * Math.max(0, wind * (0.55 + 0.45 * Math.sin(t * 2.1 + S.ph)) * (0.72 + 0.28 * fl(i + 1)) - 0.06) * (S.flies ? 1 + 0.9 * ease.smooth(ramp(t, T_LIFT - 0.5, T_LIFT)) : 1);
      this.lie(S, ou, oo, S.fu, S.fo, y0, lift, 0.0012 * S.lay);
    });
    // ---- the toy's shadow in the light
    if (toy) { const s = 0.3 * RUN; F.uCapA.value[3].set(toy.u, toy.o, toy.u + SLEAN * s, toy.o + s); F.uCapK.value[3].set(0.15, 0.8, 0.04, 0); } else F.uCapK.value[3].y = 0;

    const g = this.geo.attributes, n = this.dyn * 3;
    for (const a of [g.position, g.normal, g.color]) { a.clearUpdateRanges(); a.addUpdateRange(0, n); a.needsUpdate = true; }
    // ---- the draught, hardly there
    const near = Math.max(0, 1 - Math.hypot(L.k.G.camera.position.x - L.cx, L.k.G.camera.position.z - L.cz) / 9);
    this.air.set(L.quiet ? 0 : 0.016 * Math.min(1.2, wind) * near * (calm ? 0.6 : 1), 0.3);
    if (back && L.ret >= 1) this.hide();
  },

  // The toy: where it is on the stage (or null). Driving near the table stirs the papers on it; the papers on the
  // floor slide out of its way.
  toy(L, dt, on) {
    const G = L.k.G, veh = G.vehicle, here = veh && veh.group && veh.group.visible && Math.abs(veh.pos.y - L.y) < 0.5;
    if (!here) { this.stir *= Math.exp(-dt * 2); return null; }
    const p = L.local(veh.pos.x, veh.pos.z), moving = on && dt > 0 && G.state === 'play';
    const vu = moving ? veh.vel.x * L.tx + veh.vel.z * L.tz : 0, vo = moving ? veh.vel.x * L.nx + veh.vel.z * L.nz : 0, sp = Math.hypot(vu, vo);
    const want = moving ? Math.min(0.8, sp * 0.5) * clamp01(1 - (Math.hypot(p.u - TU, p.out - TO) - 0.5) / 0.9) : 0;
    this.stir += (want - this.stir) * Math.min(1, dt * (want > this.stir ? 6 : 1.4));
    const t = this.at * this.speed, h = Math.min(dt, 0.05);
    const lying = [t > T_OFF + FALL + 0.2 ? { u: TU + PO * DO + DU * (AE + 0.11 + NL / 2), o: TO - PO * DU + DO * (AE + 0.11 + NL / 2), r: 0.3 } : null, t > T_DOWN + 0.3 && this.fly ? { u: this.fly.u, o: this.fly.o, r: 0.2 } : null];
    lying.forEach((c, i) => {
      const q = this.push[i]; if (!c) return;
      const du = c.u + q.u - p.u, dz = c.o + q.o - p.out, d = Math.hypot(du, dz) || 1e-3, reach = c.r + 0.16;
      if (moving && d < reach && sp > 0.05) {
        const k = (1 - d / reach) * 7 * h; q.vu += (du / d * 0.6 + vu * 0.4) * k; q.vo += (dz / d * 0.6 + vo * 0.4) * k;
        this.stir = Math.max(this.stir, 0.5);
        if (!L.quiet && (this.rust -= dt) < 0) { this.rust = 0.35; const v = L.voice(); if (v.ctx) L.k.synth.noise(0.25, { vol: 0.008, lp: 5200 }); }
      }
      q.vu *= Math.exp(-h * 5); q.vo *= Math.exp(-h * 5); q.u += q.vu * h; q.o += q.vo * h;
      const m = Math.hypot(q.u, q.o); if (m > 0.3) { q.u *= 0.3 / m; q.o *= 0.3 / m; }
      if (c.o + q.o < 0.5) q.o = 0.5 - c.o;
    });
    return { u: p.u, o: p.out };
  },
});
