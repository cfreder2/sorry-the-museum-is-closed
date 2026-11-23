// Vincent van Gogh, The Bedroom (1889), Gallery 241. The word: tuck.
//
// He wrote to Theo that this picture should rest the brain, "suggestive of rest or of sleep in general", in flat,
// outlined colour: lilac-blue walls, a yellow bed, a scarlet coverlet, a floor of green and pink. Look at it and his
// room comes out from under the frame and builds itself on the floor below, toy-sized, like a pop-up book: the
// floorboards shoot out of the wall, green and pink, fanning wider as they come (his steep, tipped-up floor); the blue
// walls slide out lying flat and spring upright, the back one with the window and its green shutters, the mirror, the
// pegs with his blue smock and the pictures over the bed; the right wall with two pale sketches; a stub of the left wall
// with the striped towel on its nail. Then the furniture flies out from under the rail as flat painted cut-outs and
// pops into the round where it lands: the little table with the jug and basin, the two rush-seated chairs, and last
// the bed, which lands against the wall and pulls out to its full length with a thump on the first downbeat.
//
// Then the room gets ready for sleep, to Brahms's Wiegenlied (1868) on a music box: the chairs waddle on their four
// legs, one to tuck itself in under the table and one to stand by the bed; the green shutters swing shut with a clack
// and the draught sets the towel swinging; the two pillows plump themselves; the scarlet coverlet, thrown back over the
// foot of the bed, gathers, flips over like a page and floats down over the bed, and is tucked in: one side, the other
// side, the foot, each with a pat and a little bounce of the bed. The light goes to evening blue and the coverlet
// breathes slowly while you keep looking. When you stop, it all rewinds: the bed pushes back, the furniture folds flat
// and flies back in under the rail, the walls lie down and slide away, and the floorboards draw back into the wall.
//
// Everything is solid and flat-coloured, outlined in his dark line, and dashed in short strokes, upright on the walls
// and the boards of the bed, along its length on what lies flat.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, shape } from '../paintlife.js';
import { inked, score, hz } from './stagecraft.js';
import { strokes as strokeTex } from './brush.js';

const BPM = 132, BT = 60 / BPM, T0 = 1.4;                       // the lullaby: its pickup at T0
const beat = k => T0 + k * BT;
const U0 = 0.15;                                                  // the room's origin, along the wall from the canvas middle
const SC = 1.25;                                                  // and its size (everything below is in its own metres)
// The room, in its own metres: x along the wall (to the right), z out from the gallery wall, y up from the floor.
const BACK = { x0: -0.95, x1: 0.62, h: 0.66 };
const RW = { x: 0.62, len: 1.12, out: 0.09, h0: 0.66, h1: 0.24 };   // the right wall: leans out `out` over its length
const LW = { x: -0.95, len: 0.58, out: -0.116, h0: 0.66, h1: 0.4 };
const DEPTH = 1.3;                                                // the floor, out from the wall
const BED = { x: 0.385, z: 0.03, L: 0.66, W: 0.44 };              // head end middle; length, width
const MT = { y0: 0.112, y1: 0.2, hw: 0.196, z0: 0.045, z1: 0.6 }; // the mattress (bed-local)
const CV = { z0: 0.235, z1: 0.6, foot: 0.07, over: 0.1, top: 0.211, fold: 0.4 };   // the coverlet: from z0 to the mattress end, plus a foot and sides to tuck
const NA = 16, NS = 18;                                           // its grid: across, along
// The chairs' walks: [x, z, yaw] stops; steps at those show times.
const CHAIR_A = { path: [[-0.17, 0.3, 0.25], [-0.3, 0.31, 1.3], [-0.42, 0.3, 2.35], [-0.47, 0.268, Math.PI]], steps: [2.1, 2.4, 2.7] };
const CHAIR_B = { path: [[-0.62, 0.8, 0.55], [-0.42, 0.74, 0.95], [-0.22, 0.68, 1.3], [-0.03, 0.62, Math.PI / 2]], steps: [2.25, 2.55, 2.85] };
const STEP = 0.28;
// Emerging (show seconds): the boards, the walls (slide out flat, spring up), the furniture (fly out flat, pop round).
const T_BOARDS = [0.04, 0.42, 0.38];                               // first board, spread, each board's run
const WALLS = { back: [0.28, 0.5, 0.92], right: [0.38, 0.6, 1.0], left: [0.44, 0.64, 1.04] };
const FLY = { table: [0.72, 1.12, 1.4], chairA: [0.86, 1.26, 1.52], chairB: [0.98, 1.38, 1.62], bed: [1.08, 1.5, 1.95] };
const T_SHUT = beat(4), T_PILLOW = [beat(5), beat(5.5)], T_GATHER = 4.0, T_FLIP = 4.25, T_LAND = 5.05;
const T_TUCK = [beat(10), beat(11), beat(12)], T_DUSK = beat(13);
const FLAT = 0.06;                                                // a cut-out's depth, as a part of its own
// Brahms, Wiegenlied, Op. 49 No. 4 (1868), in C, 3/4.
const WIEGEN = 'E4:0.5 E4:0.5 | G4:2 E4:0.5 E4:0.5 | G4:2 E4:0.5 G4:0.5 | C5 B4:1.5 A4:0.5 | A4 G4 ' +
  'D4:0.5 E4:0.5 | F4 D4 D4:0.5 E4:0.5 | F4:2 D4:0.5 F4:0.5 | B4:0.5 A4:0.5 G4 B4 | C5:2 ' +
  'C4:0.5 C4:0.5 | C5:2 A4:0.5 F4:0.5 | G4:2 E4:0.5 C4:0.5 | F4 G4 A4 | G4:2 ' +
  'C4:0.5 C4:0.5 | C5:2 A4:0.5 F4:0.5 | G4:2 E4:0.5 C4:0.5 | F4 E4 D4 | C4:2 R';
const ROOTS = [48, 48, 53, 48, 43, 43, 43, 48, 53, 48, 43, 48, 53, 48, 43, 48];      // one per bar (C, F, G)
const _h = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

// Paint as he laid it: every face its flat colour, broken into short dashes (upright on upright faces, along the length
// on flat ones), a little lighter or darker and warmer or cooler each, glowing a little in its own colour.
function dashPaint(u) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.5 });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vOP = position; vON = normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform vec3 uTint; varying vec3 vOP; varying vec3 vON;
float bdH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec3 an = abs(normalize(vON));
  vec2 pl = an.y > 0.6 ? vOP.xz : (an.x > an.z ? vOP.zy : vOP.xy);
  vec2 q = pl / vec2(0.011, 0.036);
  float c = floor(q.x); q.y += bdH(vec2(c, 3.1)) * 9.0;
  vec2 id = vec2(c, floor(q.y)), f = fract(q);
  float h = bdH(id), h2 = bdH(id + 17.3);
  float edge = smoothstep(0.0, 0.2, f.x) * smoothstep(1.0, 0.8, f.x) * smoothstep(0.0, 0.14, f.y) * smoothstep(1.0, 0.86, f.y);
  diffuseColor.rgb *= (0.86 + 0.28 * h) * (0.88 + 0.12 * edge);
  diffuseColor.rgb *= mix(vec3(0.93, 0.97, 1.08), vec3(1.08, 1.0, 0.9), h2);
  diffuseColor.rgb *= uTint;
}`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= diffuseColor.rgb;');
  };
  m.customProgramCacheKey = () => 'bedroom-dash';
  return m;
}

lifeFor(28560, {
  title: /^The Bedroom$/,
  word: 'tuck',
  // (a small work high on the wall: the kit keeps all of it in view, above the room on the floor; the camera stands a
  // little to the left, as he did, looking into the corner where the bed is)
  stage: { out: 1.6, half: 1.25, cam: { dist: 2.5, height: 1.2, side: -0.3, fov: 60, lookU: 0.15, lookOut: 0.5, lookH: 0.9, floorOut: 0.85 } },
  wake: 2, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.22) => P.near(h, a);
    const V = this.V = { m: new THREE.Matrix4(), l: new THREE.Matrix4(), p: new THREE.Matrix4(), v: new THREE.Vector3(), s: new THREE.Vector3(), q: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ') };
    // The room's frame: x along the wall, y up, z out, at the foot of the wall under the work.
    this.B = new THREE.Matrix4().makeBasis(new THREE.Vector3(L.tx * SC, 0, L.tz * SC), new THREE.Vector3(0, SC, 0), new THREE.Vector3(L.nx * SC, 0, L.nz * SC));
    this.out0 = -L.wall + 0.04;                                  // (clear of the skirting)
    this.B.setPosition(L.floor(U0, this.out0));
    this.railH = (L.rail - L.y) / SC;                                   // the underside of the frame, above the floor
    this.front = (L.wall - 0.04 + 0.05) / SC;                          // (room z) a little in front of the canvas plane
    const u = this.u = { uTint: { value: new THREE.Color(1, 1, 1) } };

    // ------------------------------------------------------------ geometry helpers (vertex coloured, non-indexed)
    const fin = (g, c) => {
      g = g.index ? g.toNonIndexed() : g;
      for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n);
      if (!g.attributes.normal) g.computeVertexNormals();
      const a = new Float32Array(g.attributes.position.count * 3), C = new THREE.Color(c);
      for (let i = 0; i < a.length; i += 3) { a[i] = C.r; a[i + 1] = C.g; a[i + 2] = C.b; }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
    };
    const box = (x0, x1, y0, y1, z0, z1, c, sx = 1, top = null) => {
      const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0, sx, 1, 1); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      if (top) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > (y0 + y1) / 2) p.setY(i, top(p.getX(i), p.getZ(i))); g.computeVertexNormals(); }
      return fin(g, c);
    };
    const ink = (list, d = 0.008, k = '#2a2440') => inked(shape.merge(list), d, k);
    const mv = (g, x, y, z, rx = 0, ry = 0, rz = 0) => shape.move(g, x, y, z, rx, ry, rz);

    // ------------------------------------------------------------ the walls
    const blue = col('#7d8ed2'), blueD = col('#6878c4'), blueL = col('#9aa6dc'), wallInk = '#262a58';
    const green = col('#2f7a3e', 0.15), greenL = col('#5fa04a', 0.15), pane = col('#c4cf6a', 0.15), ochre = col('#d89a36'), orange = col('#c8742e');
    const bx = (BACK.x0 + BACK.x1) / 2, W = BACK.x1 - BACK.x0, WT = 0.018;
    const xw = -0.36 - bx, yw0 = 0.3, yw1 = 0.57, ww = 0.1;        // the window, on the back wall
    const back = [box(-W / 2, W / 2, 0, BACK.h, 0, WT, blue, 12)];
    back.push(box(xw - ww - 0.012, xw + ww + 0.012, yw0 - 0.012, yw1 + 0.012, WT, WT + 0.006, green));     // its frame
    back.push(box(xw - ww, xw + ww, yw0, yw1, WT, WT + 0.008, pane));                                    // the light
    for (const x of [xw - ww * 0.5, xw, xw + ww * 0.5]) back.push(box(x - 0.005, x + 0.005, yw0, yw1, WT + 0.008, WT + 0.012, green));
    for (const y of [yw0 + 0.09, yw0 + 0.18]) back.push(box(xw - ww, xw + ww, y - 0.005, y + 0.005, WT + 0.008, WT + 0.012, green));
    back.push(box(xw - ww - 0.02, xw + ww + 0.02, yw0 - 0.03, yw0 - 0.012, WT, WT + 0.02, green));          // the sill
    // the mirror, left of the window; the peg rail with his blue smock and his straw hat; the pictures over the bed
    const xm = -0.66 - bx;
    back.push(box(xm - 0.042, xm + 0.042, 0.36, 0.47, WT, WT + 0.008, col('#5a4a2e')), box(xm - 0.032, xm + 0.032, 0.37, 0.46, WT + 0.008, WT + 0.011, col('#d8e4d8', 0.1)));
    back.push(box(0.03 - bx, 0.2 - bx, 0.425, 0.44, WT, WT + 0.014, orange));
    back.push(mv(box(-0.035, 0.035, -0.13, 0, -0.008, 0.008, col('#4a6cb0', 0.15), 4, (x) => -0.002 * Math.abs(x)), 0.085 - bx, 0.43, WT + 0.016, 0, 0, 0.04));
    back.push(mv(box(-0.022, 0.022, -0.05, 0, -0.006, 0.006, col('#3e5ea0', 0.15)), 0.085 - bx, 0.31, WT + 0.02, 0, 0, -0.05));
    back.push(mv(shape.cyl(0.03, 0.03, 0.008, 14, col('#d8b452')), 0.16 - bx, 0.4, WT + 0.012, Math.PI / 2, 0, 0));
    back.push(mv(shape.cyl(0.016, 0.014, 0.022, 10, col('#c8a040')), 0.16 - bx, 0.4, WT + 0.02, Math.PI / 2, 0, 0));
    const pic = (x, y, w, h, tilt, paint) => {
      const g = [box(-w / 2, w / 2, -h / 2, h / 2, 0, 0.008, col('#b87a34')), box(-w / 2 + 0.008, w / 2 - 0.008, -h / 2 + 0.008, h / 2 - 0.008, 0.008, 0.01, paint[0])];
      for (const [px, py, pw, ph, c] of paint.slice(1)) g.push(box(px - pw / 2, px + pw / 2, py - ph / 2, py + ph / 2, 0.01, 0.012, c));
      return g.map(q => mv(q, x - bx, y, WT, 0, 0, tilt));
    };
    back.push(...pic(0.1, 0.545, 0.13, 0.085, 0, [col('#d8d4a4'), [0, -0.012, 0.1, 0.02, col('#7aa04a')], [0.01, 0.01, 0.03, 0.035, col('#5a8a3a')]]));                  // a landscape
    back.push(...pic(0.33, 0.52, 0.07, 0.092, 0.1, [col('#5a7ab0'), [0, 0.006, 0.026, 0.034, col('#e0b088')], [0, 0.026, 0.03, 0.012, col('#8a5a2a')], [0, -0.03, 0.04, 0.018, col('#3a4a6a')]]));   // two portraits
    back.push(...pic(0.47, 0.535, 0.07, 0.092, -0.12, [col('#7a9a58'), [0, 0.006, 0.026, 0.034, col('#e8c098')], [0, 0.026, 0.03, 0.012, col('#3a2a1a')], [0, -0.03, 0.04, 0.018, col('#c86a3a')]]));
    // (the right wall's top falls away fast towards the front: seen from low on the right, it stays under the pictures)
    const right = [box(0, WT, 0, 1, 0, RW.len, blue, 1, null)];
    right[0] = (() => { const g = new THREE.BoxGeometry(WT, 1, RW.len, 1, 1, 12); g.translate(WT / 2, 0.5, RW.len / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i); p.setY(i, p.getY(i) > 0.5 ? RW.h1 + (RW.h0 - RW.h1) * (1 - z / RW.len) ** 2 : 0); } g.computeVertexNormals(); return fin(g, blueD); })();
    for (const [z, c] of [[0.11, col('#e6dc8a', 0.15)], [0.25, col('#ece2a0', 0.15)]]) right.push(box(-0.006, 0, 0.35, 0.44, z - 0.05, z + 0.05, col('#c89a4a')), box(-0.009, -0.006, 0.36, 0.43, z - 0.04, z + 0.04, c), box(-0.011, -0.009, 0.38, 0.41, z - 0.02, z + 0.02, col('#a8a070', 0.1)));
    const left = [(() => { const g = new THREE.BoxGeometry(WT, 1, LW.len, 1, 1, 8); g.translate(-WT / 2, 0.5, LW.len / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i); p.setY(i, p.getY(i) > 0.5 ? LW.h0 + (LW.h1 - LW.h0) * z / LW.len : 0); } g.computeVertexNormals(); return fin(g, blueL); })()];
    left.push(box(0, 0.006, 0.0, 0.42, 0.36, 0.56, col('#8a9ad8')), box(0.006, 0.01, 0.02, 0.4, 0.38, 0.54, col('#a8b4e2')));          // the door's edge
    left.push(box(0, 0.016, 0.505, 0.515, 0.17, 0.18, col('#5a3a1e')));                                                                 // the towel's nail
    // a shutter leaf (hinged at x = 0, running +x), and the towel (hanging from its nail at the origin)
    const leaf = [box(0, ww, 0, yw1 - yw0, -0.005, 0.005, green), box(0.016, ww - 0.016, 0.02, 0.12, 0.005, 0.009, greenL), box(0.016, ww - 0.016, 0.15, yw1 - yw0 - 0.02, 0.005, 0.009, greenL)];
    const towel = [box(0.004, 0.01, -0.21, 0, -0.035, 0.035, col('#e8e2c4', 0.12), 1)];
    for (const y of [-0.04, -0.17]) towel.push(box(0.01, 0.012, y - 0.008, y, -0.035, 0.035, col('#c8503a', 0.12)));
    towel.push(box(0.01, 0.012, -0.19, -0.186, -0.035, 0.035, col('#4a6ab0', 0.12)));

    // ------------------------------------------------------------ the bed (origin: the middle of its head, on the floor)
    const wood = ochre, woodD = col('#b8782c'), woodL = col('#e4b448'), sheet = col('#e6e2a4', 0.12);
    const { L: BL, W: BW } = BED, hw = BW / 2;
    const bed = [];
    bed.push(box(-hw, hw, 0.05, 0.4, 0, 0.026, wood, 12, (x) => 0.38 + 0.05 * Math.cos(Math.PI * x / BW)));          // the headboard, arched
    bed.push(box(-hw, hw, 0.05, 0.27, BL - 0.026, BL, woodL, 12, (x) => 0.255 + 0.04 * Math.cos(Math.PI * x / BW)));   // the footboard
    for (const s of [-1, 1]) {
      bed.push(box(s * hw - 0.018, s * hw + 0.018, 0, 0.45, -0.004, 0.03, woodD));              // the posts
      bed.push(box(s * hw - 0.018, s * hw + 0.018, 0, 0.31, BL - 0.03, BL + 0.004, woodD));
      bed.push(box(s * hw - 0.02, s * hw + 0.003 * s, 0.05, 0.15, 0.02, BL - 0.02, wood));        // the side boards
      bed.push(box(s * hw - 0.025, s * hw + 0.025, 0.44, 0.46, -0.008, 0.034, woodL), box(s * hw - 0.024, s * hw + 0.024, 0.305, 0.325, BL - 0.034, BL + 0.008, woodL));
    }
    bed.push(box(-hw + 0.02, hw - 0.02, 0.27, 0.28, BL - 0.03, BL - 0.024, woodD));               // a rail across the footboard
    for (let i = -2; i <= 2; i++) bed.push(box(i * 0.07 - 0.003, i * 0.07 + 0.003, 0.07, 0.24, BL + 0.0, BL + 0.003, woodD));     // its planks
    bed.push(box(-MT.hw, MT.hw, MT.y0, MT.y1, MT.z0, MT.z1, sheet, 6, (x) => MT.y1 - 0.01 * Math.pow(Math.abs(x) / MT.hw, 4)));
    const pillow = (() => { const g = shape.ball(1, col('#f2eca8', 0.12), 3); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, x * 0.088 * (1 - 0.18 * z * z), y * 0.034 * (1 - 0.3 * x * x), z * 0.07 * (1 - 0.2 * x * x)); } g.computeVertexNormals(); shape.paint(g, (c, n) => (n.y < 0.1 ? col('#c8cf84', 0.12) : n.z < -0.4 ? col('#dcd890', 0.1) : null)); return g; })();

    // ------------------------------------------------------------ a rush-seated chair (origin: under its seat; it faces +z)
    const cy = col('#dcae3c'), cyD = col('#b8862a'), rush = col('#c9a548'), rushD = col('#a8883a');
    const chair = [];
    for (const sx of [-1, 1]) {
      chair.push(box(sx * 0.062 - 0.008, sx * 0.062 + 0.008, 0, 0.14, 0.047, 0.063, cy));                 // front legs
      chair.push(mv(box(-0.008, 0.008, 0, 0.32, -0.008, 0.008, cy), sx * 0.062, 0, -0.055, -0.06, 0, 0)); // back legs, up into the back
      chair.push(box(sx * 0.062 - 0.006, sx * 0.062 + 0.006, 0.045, 0.055, -0.05, 0.05, cyD));           // the rungs
    }
    for (const y of [0.2, 0.245, 0.29]) chair.push(mv(box(-0.062, 0.062, y - 0.012, y + 0.012, -0.004, 0.004, cy), 0, 0, -0.055 - (y - 0.14) * 0.06, -0.06, 0, 0));
    chair.push(box(-0.07, 0.07, 0.125, 0.142, -0.063, 0.063, cyD));                                        // the seat's frame
    const seat = box(-0.064, 0.064, 0.142, 0.152, -0.058, 0.058, rush, 6);
    shape.paint(seat, (c) => (Math.sin((c.x + c.z) * 90) > 0.3 ? rushD : null));
    chair.push(seat, box(-0.064, 0.064, 0.03, 0.04, 0.05, 0.058, cyD));

    // ------------------------------------------------------------ the table, with the jug in the basin, bottles, a brush
    const tw = col('#c8783a'), twD = col('#a85a2a');
    const table = [box(-0.105, 0.105, 0.165, 0.182, -0.07, 0.07, tw)];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) table.push(box(sx * 0.088 - 0.008, sx * 0.088 + 0.008, 0, 0.165, sz * 0.055 - 0.008, sz * 0.055 + 0.008, twD));
    table.push(box(-0.09, 0.09, 0.135, 0.165, 0.06, 0.066, tw), box(-0.012, 0.012, 0.146, 0.154, 0.066, 0.07, col('#5a3a1e')));
    table.push(mv(shape.lathe([[0.012, 0], [0.04, 0.008], [0.05, 0.022], [0.052, 0.026]], 16, col('#5a86c4', 0.15)), -0.025, 0.182, -0.005));
    table.push(mv(shape.lathe([[0.016, 0], [0.024, 0.014], [0.026, 0.034], [0.014, 0.06], [0.012, 0.074], [0.02, 0.084]], 14, col('#a6ccc0', 0.15)), -0.03, 0.19, -0.015));
    table.push(mv(box(-0.003, 0.003, 0.0, 0.03, -0.012, 0.012, col('#a6ccc0', 0.15)), -0.006, 0.225, -0.015, 0, 0, -0.4));
    for (const [x, c] of [[0.045, col('#6a9a5a', 0.15)], [0.065, col('#c89a5a', 0.15)]]) table.push(mv(shape.lathe([[0.009, 0], [0.01, 0.04], [0.004, 0.05], [0.004, 0.062]], 8, c), x, 0.182, -0.03));
    table.push(box(0.03, 0.08, 0.182, 0.192, 0.012, 0.042, col('#e0d6b0', 0.12)));

    // ------------------------------------------------------------ the rig: every part, one draw call
    const rig = this.rig = L.rig(16, 40000, dashPaint(u));
    const G = {
      back: rig.geo(ink(back, 0.006, wallInk)), right: rig.geo(ink(right, 0.006, wallInk)), left: rig.geo(ink(left, 0.006, wallInk)),
      leaf: rig.geo(ink(leaf, 0.004, '#173a20')), towel: rig.geo(ink(towel, 0.003, '#4a3a30')),
      bed: rig.geo(ink(bed, 0.007, '#3a2412')), pillow: rig.geo(ink([pillow], 0.004, '#6a6a3a')), chair: rig.geo(ink(chair, 0.005, '#5a3812')), table: rig.geo(ink(table, 0.005, '#3a2010')),
    };
    this.I = {};
    for (const n of ['back', 'right', 'left', 'towel', 'bed', 'table']) this.I[n] = rig.add(G[n]);
    this.I.leafL = rig.add(G.leaf); this.I.leafR = rig.add(G.leaf); this.I.pilL = rig.add(G.pillow); this.I.pilR = rig.add(G.pillow);
    this.I.chairA = rig.add(G.chair); this.I.chairB = rig.add(G.chair);
    this.win = { x: xw, y: yw0, w: ww, z: WT + 0.012 }; this.PIL = [[0, this.I.pilL, -0.095], [1, this.I.pilR, 0.095]];

    // ------------------------------------------------------------ the coverlet: a cloth that flips over and is tucked in
    const n = (NA + 1) * (NS + 1), pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [];
    for (let i = 0; i <= NA; i++) for (let j = 0; j <= NS; j++) { const k = i * (NS + 1) + j; uv[k * 2] = i / NA * 1.4; uv[k * 2 + 1] = j / NS * 1.6; }
    for (let i = 0; i < NA; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = (i + 1) * (NS + 1) + j; idx.push(a, b, b + 1, a, b + 1, a + 1); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); cg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); cg.setIndex(idx);
    cg.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    const red = col('#b8281e', 0.08), sty = c => '#' + c.clone().convertLinearToSRGB().getHexString();
    const tex = strokeTex({ size: 256, base: sty(red), n: 900, colors: [[sty(col('#d8452e', 0.1)), 3], [sty(col('#a82a24', 0.1)), 2], [sty(col('#e2643a', 0.1)), 1], [sty(col('#8e2220', 0.1)), 1]], len: [10, 22], width: [3, 6], angle: (x, y, r) => Math.PI / 2 + (r() - 0.5) * 0.5, seed: 28560, lift: 0.2 });
    const cm = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.3, roughness: 0.9, side: THREE.DoubleSide });
    cm.onBeforeCompile = sh => { Object.assign(sh.uniforms, u); sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uTint;').replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb *= uTint;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= uTint;'); };
    cm.customProgramCacheKey = () => 'bedroom-cover';
    this.cover = new THREE.Mesh(cg, cm); this.cover.matrixAutoUpdate = false;
    L.add(this.cover);
    this.CP = pos;

    // ------------------------------------------------------------ the floor: his boards, fanning out from the wall
    const fu = this.fu = {
      uO: { value: L.floor(U0, this.out0) }, uAx: { value: new THREE.Vector4(L.tx / SC, L.tz / SC, L.nx / SC, L.nz / SC) }, uC: { value: 0 }, uTint: u.uTint,
      uSh: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, 0.1, 0.1)) }, uShK: { value: [0, 0, 0, 0] },
      uCol: { value: [col('#3f9468', 0.08), col('#5aa87e', 0.08), col('#2f8274', 0.08), col('#b8686c', 0.08), col('#9a5a60', 0.08), col('#c88886', 0.08), col('#c89a38', 0.08), col('#5a74c0', 0.08)] }, uSeam: { value: col('#5a3e48', 0.1) },
    };
    const fm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false });
    fm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, fu);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform vec3 uO, uTint, uSeam; uniform vec4 uAx; uniform float uC; uniform vec4 uSh[4]; uniform float uShK[4]; uniform vec3 uCol[8];
float bfH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 bfCol; float bfA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz; vec2 q = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw));
  // the boards fan out from a point behind the wall, so they widen as they come towards you, as his do
  vec2 vp = vec2(-0.1, -2.4), d = q - vp;
  float phi = atan(d.x, d.y) / 0.027, rho = length(d), b = floor(phi), fb = fract(phi);
  float hb = bfH(vec2(b, 1.7));
  float run = clamp((uC - (${T_BOARDS[0].toFixed(2)} + hb * ${T_BOARDS[1].toFixed(2)})) / ${T_BOARDS[2].toFixed(2)}, 0.0, 1.0);
  float reach = (${(DEPTH - 0.08).toFixed(2)} + bfH(vec2(b, 5.3)) * 0.16) * (1.0 - pow(1.0 - run, 3.0));
  float xl = ${BACK.x0.toFixed(3)} + ${(LW.out / LW.len).toFixed(4)} * q.y, xr = ${BACK.x1.toFixed(3)} + ${(RW.out / RW.len).toFixed(4)} * q.y;
  float inside = step(-0.01, q.y) * step(q.y, reach) * smoothstep(xl - 0.004, xl + 0.004, q.x) * smoothstep(xr + 0.004, xr - 0.004, q.x);
  // dashes along each board, green and pink; a dark seam between boards; a lighter ridge on each stroke
  float lane = floor(fb * 3.0), fl = fract(fb * 3.0);
  float cell = (rho + bfH(vec2(b, lane + 0.5)) * 0.9) / (0.09 + 0.05 * bfH(vec2(b, lane + 7.0))), ci = floor(cell) + lane * 101.0, cf = fract(cell);
  // each board mostly green or mostly pink, with dashes of the other, and now and then a touch of ochre or blue
  float hd = bfH(vec2(b, ci)), fam = step(0.5, bfH(vec2(b, 2.9))), other = step(0.78, bfH(vec2(ci, b + 4.4)));
  float pick = hd < 0.02 ? 6.0 : hd < 0.03 ? 7.0 : abs(fam - other) * 3.0 + floor(bfH(vec2(ci, b + 9.1)) * 3.0);
  vec3 c = uCol[int(pick)];
  c *= 0.86 + 0.24 * bfH(vec2(ci + 3.3, b));
  // the bristles: fine streaks along the board, and a stroke's two halves a shade apart
  float br = bfH(vec2(floor(fl * 4.0), ci + b * 3.0));
  c *= 0.9 + 0.16 * br;
  c = mix(c * 0.8, c, smoothstep(0.0, 0.18, fl) * smoothstep(1.0, 0.8, fl));
  c = mix(c, c * 1.18, smoothstep(0.25, 0.32, fb) * smoothstep(0.45, 0.38, fb) * 0.7);
  float gap = smoothstep(0.0, 0.07, cf) * smoothstep(1.0, 0.9, cf);
  c = mix(c * 0.84, c, gap);
  float seam = smoothstep(0.1, 0.0, fb) + smoothstep(0.9, 1.0, fb);
  c = mix(c, uSeam, seam * 0.8);
  // soft shadows under the furniture
  float sh = 0.0;
  for (int i = 0; i < 4; i++) { vec2 e = (q - uSh[i].xy) / uSh[i].zw; sh = max(sh, uShK[i] * smoothstep(1.0, 0.25, length(e))); }
  c *= 1.0 - 0.5 * sh;
  bfCol = c * 0.78 * uTint; bfA = inside;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = bfCol; diffuseColor.a = bfA;\n#include <opaque_fragment>');
    };
    fm.customProgramCacheKey = () => 'bedroom-floor';
    this.floor = L.decal({ w: 2.2 * SC, d: (DEPTH + 0.2) * SC, u: U0 - 0.18 * SC, out: this.out0 + (DEPTH / 2 + 0.05) * SC, material: fm });
    this.floor.renderOrder = 2;

    // ------------------------------------------------------------ the music box, and the room's own sounds
    const s = this.sc = score(L);
    const box_ = { type: 'sine', vol: 0.03, over: 4.0, overVol: 0.22, attack: 0.004 };
    let tEnd = s.tune(WIEGEN, T0, BPM, { ...box_, legato: 0.95 });
    ROOTS.forEach((m, i) => { const t = beat(1 + i * 3); s.note(t, hz(m), BT * 2.2, { type: 'sine', vol: 0.022, attack: 0.02 }); s.note(t + BT, hz(m + 7), BT * 0.9, { type: 'sine', vol: 0.009 }); s.note(t + 2 * BT, hz(m + 16), BT * 0.9, { type: 'sine', vol: 0.007 }); });
    s.tune(WIEGEN, tEnd + BT * 2, BPM, { ...box_, vol: 0.022, legato: 0.95 });
    s.hit(0.06, { d: 0.55, vol: 0.022, lp: 1500 });                                                   // the boards slide out
    for (const k of ['back', 'right', 'left']) s.hit(WALLS[k][2] - 0.05, { d: 0.07, vol: 0.03, bp: 900, q: 1.2 });     // a wall springs up
    for (const [k, f] of [['table', 330], ['chairA', 392], ['chairB', 440], ['bed', 262]]) { s.note(FLY[k][1], f, 0.12, { type: 'triangle', vol: 0.02 }); s.hit(FLY[k][1], { d: 0.05, vol: 0.02, lp: 2200 }); }
    s.note(beat(1), 82, 0.32, { type: 'sine', vol: 0.06, to: 55, attack: 0.004 }); s.hit(beat(1), { d: 0.14, vol: 0.03, lp: 500 });   // the bed: thump
    for (const st of [...CHAIR_A.steps, ...CHAIR_B.steps]) { const t = st + STEP; s.note(t, 640 + _h(st) * 160, 0.06, { type: 'triangle', vol: 0.016, attack: 0.002 }); s.hit(t, { d: 0.025, vol: 0.012, hp: 1800 }); }
    s.hit(T_SHUT + 0.3, { d: 0.04, vol: 0.04, bp: 1300, q: 2 }); s.note(T_SHUT + 0.3, 300, 0.08, { type: 'triangle', vol: 0.02 }); s.hit(T_SHUT + 0.34, { d: 0.04, vol: 0.03, bp: 1100, q: 2 });
    for (const t of T_PILLOW) s.hit(t + 0.1, { d: 0.18, vol: 0.03, lp: 700 });
    s.hit(T_FLIP, { d: 0.75, vol: 0.035, bp: 650, q: 0.6 }); s.hit(T_LAND - 0.05, { d: 0.3, vol: 0.03, lp: 450 });
    for (const t of T_TUCK) { s.note(t + 0.1, 150, 0.12, { type: 'sine', vol: 0.045, to: 95, attack: 0.004 }); s.hit(t + 0.1, { d: 0.08, vol: 0.02, lp: 600 }); }
    s.done();

    this.walkA = this.walker(CHAIR_A); this.walkB = this.walker(CHAIR_B);
    this.hold = 0; this.hide();
  },

  // A chair's walk: where it stands at show-time t ({ x, z, yaw, lift, roll }).
  walker(C) {
    const o = { x: 0, z: 0, yaw: 0, lift: 0, roll: 0 };
    return t => {
      const P = C.path; let k = 0; while (k < C.steps.length && t >= C.steps[k] + STEP) k++;
      const a = P[k], step = k < C.steps.length ? clamp01((t - C.steps[k]) / STEP) : 0, b = P[Math.min(k + 1, P.length - 1)];
      const e = ease.inOut(step);
      o.x = a[0] + (b[0] - a[0]) * e; o.z = a[1] + (b[1] - a[1]) * e; o.yaw = a[2] + (b[2] - a[2]) * e;
      o.lift = 0.028 * Math.sin(Math.PI * step); o.roll = (k % 2 ? 1 : -1) * 0.2 * Math.sin(Math.PI * step);
      return o;
    };
  },

  hide() { this.rig.mesh.visible = false; this.cover.visible = false; this.floor.visible = false; },

  // (room-local placement) out = B * T(x, y, z) * R(yaw, pitch, roll) * S(sx, sy, sz)
  place(out, x, y, z, yaw = 0, pitch = 0, roll = 0, sx = 1, sy = 1, sz = 1) {
    const V = this.V; V.e.set(pitch, yaw, roll, 'YXZ'); V.q.setFromEuler(V.e);
    return out.multiplyMatrices(this.B, V.l.compose(V.v.set(x, y, z), V.q, V.s.set(sx, sy, sz)));
  },
  child(out, parent, x, y, z, yaw = 0, pitch = 0, roll = 0, sx = 1, sy = 1, sz = 1) {
    const V = this.V; V.e.set(pitch, yaw, roll, 'YXZ'); V.q.setFromEuler(V.e);
    return out.multiplyMatrices(parent, V.l.compose(V.v.set(x, y, z), V.q, V.s.set(sx, sy, sz)));
  },

  // A wall: slides out of the gallery wall lying flat, then springs upright with two little rebounds. 0: still in the
  // wall, 1: up. Returns { slide (metres still to come), lie (0 upright .. 1 flat) }.
  wallAt(c, w, len, o) {
    const sl = ease.out(ramp(c, w[0], w[1])), up = ramp(c, w[1], w[2]);
    o.slide = (1 - sl) * (len + 0.03); o.lie = 1 - ease.out(up) + 0.14 * Math.abs(Math.sin(3 * Math.PI * up)) * (1 - up) * (1 - up); o.on = c > w[0];
    return o;
  },
  // A piece of furniture: out from under the rail as a flat cut-out, down in an arc to its place, and round.
  flyAt(L, c, f, home, h, o) {
    o.on = c > f[0];
    const q = ramp(c, f[0], f[1]), p = ramp(c, f[1], f[2]);
    o.sz = q < 1 ? FLAT : FLAT + (1 - FLAT) * ease.outBack(p);
    o.sy = 1 - 0.16 * Math.sin(Math.PI * Math.min(1, p * 2.2)) * (1 - p);
    o.sx = 1 + 0.05 * Math.sin(Math.PI * Math.min(1, p * 2.2)) * (1 - p);
    if (q >= 1) { o.x = home.x; o.y = 0; o.z = home.z; o.yaw = home.yaw; o.roll = 0; return o; }
    const y0 = this.railH - 0.06 - h, zIn = -0.05, z1 = this.front;
    if (q < 0.24) { const k = ease.out(q / 0.24); o.x = home.x * 0.4; o.y = y0; o.z = zIn + (z1 - zIn) * k; o.yaw = 0; o.roll = 0; return o; }
    const k = (q - 0.24) / 0.76, e = ease.inOut(k), a = 1 - e;
    o.x = home.x * 0.4 + (home.x - home.x * 0.4) * e;
    // (down first, close to the wall, fluttering as a card falls; then out over the floor to its place, low)
    o.z = z1 + (home.z - z1) * ease.smooth(ramp(k, 0.25, 1)) + 0.1 * Math.sin(Math.PI * k) * a;
    o.y = y0 * (1 - ease.inOut(Math.min(1, k / 0.72))) + 0.04 * Math.sin(Math.PI * ramp(k, 0.72, 1));
    o.yaw = home.yaw * ease.smooth(k); o.roll = 0.3 * Math.sin(k * Math.PI * 2) * (1 - k);
    return o;
  },

  // A piece of furniture placed for this moment (and its shadow on the floor); its matrix, or null while it is in the wall.
  piece(L, c, id, f, home, h, si, rx, rz, extra) {
    const o = this.o || (this.o = {}), M = this.V.m, rig = this.rig, sh4 = this.fu.uSh.value, shk = this.fu.uShK.value;
    this.flyAt(L, c, f, home, h, o); rig.show(id, o.on);
    if (!o.on) { shk[si] = 0; return null; }
    this.place(M, o.x, o.y + (extra ? extra.lift : 0), o.z, o.yaw, 0, o.roll + (extra ? extra.roll : 0), o.sx, o.sy, o.sz);
    rig.mat(id, M);
    sh4[si].set(o.x, o.z + (si === 0 ? BED.L / 2 * o.sz : 0), rx, si === 0 ? rz * Math.max(0.2, o.sz) : rz); shk[si] = clamp01(1 - o.y / 0.8) * 0.9 * (0.4 + 0.6 * o.sz);
    return M;
  },

  start(L, resumed) {
    this.sc.from(0); this.hold = 0;
    // (only one room's worth at a time: the van Gogh next door, if it is still out round the toy, goes home)
    if (!L.quiet && typeof window !== 'undefined' && window.__life) for (const o of window.__life.list()) if (o.room === L.art.room && o.id !== L.id && o.state === 'linger') window.__life.release(o.id);
  },
  back(L) { this.hold = L.t; if (!L.quiet) L.k.synth.noise(0.6, { vol: 0.015, lp: 1400 }); },
  end() { this.hide(); },
  reset() { this.hide(); this.hold = 0; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play';
    if (!showing && ph !== 'return') { this.hide(); return; }
    // c: the room's building (rewinds on the way back); tp: the evening's clock (held where it was)
    const tp = showing ? L.t : this.hold, c = showing ? L.t : Math.min(this.hold, 2.0) * (1 - ease.inOut(L.ret));
    if (showing) this.sc.play(L.t);
    const rig = this.rig, M = this.V.m, Pm = this.V.p, I = this.I;
    rig.mesh.visible = true; this.floor.visible = c > 0.03;
    this.fu.uC.value = c;
    // the evening
    const dusk = ease.smooth(ramp(tp, T_DUSK, T_DUSK + 1.3)) * (showing ? 1 : 1 - ease.smooth(L.ret));
    this.u.uTint.value.setRGB(1 - 0.2 * dusk, 1 - 0.14 * dusk, 1 + 0.06 * dusk);

    // ---- the walls
    const WO = this.WO || (this.WO = [{}, {}, {}]), HO = this.HO || (this.HO = [{ x: -0.47, z: 0.13, yaw: 0 }, {}, {}, { x: BED.x, z: BED.z, yaw: 0 }]);
    const bw = this.wallAt(c, WALLS.back, BACK.h, WO[0]);
    rig.show(I.back, bw.on); rig.show(I.leafL, bw.on); rig.show(I.leafR, bw.on);
    this.place(Pm, (BACK.x0 + BACK.x1) / 2, 0, -bw.slide, 0, Math.PI / 2 * bw.lie);
    rig.mat(I.back, Pm);
    // the shutters: open into the room, then shut for the night
    const W = this.win, sh = ramp(tp, T_SHUT, T_SHUT + 0.32), open = 1.9 * (1 - ease.in(sh)) + (sh >= 1 ? 0.06 * Math.exp(-(tp - T_SHUT - 0.32) * 9) * Math.sin((tp - T_SHUT - 0.32) * 40) : 0);
    rig.mat(I.leafL, this.child(M, Pm, W.x - W.w, W.y, W.z, -open));
    rig.mat(I.leafR, this.child(M, Pm, W.x + W.w, W.y, W.z, Math.PI + open));
    const rw = this.wallAt(c, WALLS.right, RW.len, WO[1]), lw = this.wallAt(c, WALLS.left, LW.len, WO[2]);
    rig.show(I.right, rw.on); rig.show(I.left, lw.on); rig.show(I.towel, lw.on);
    const yr = Math.atan2(RW.out, RW.len), yl = Math.atan2(LW.out, LW.len);
    this.place(M, RW.x, 0, -rw.slide, yr, 0, -Math.PI / 2 * rw.lie); rig.mat(I.right, M);
    this.place(Pm, LW.x, 0, -lw.slide, yl, 0, Math.PI / 2 * lw.lie); rig.mat(I.left, Pm);
    // the towel swings in the draught from the shutters
    const ts = tp - T_SHUT - 0.3, sway = ts > 0 ? 0.32 * Math.exp(-ts * 1.6) * Math.sin(ts * 7.5) : 0;
    rig.mat(I.towel, this.child(M, Pm, 0.016, 0.51, 0.175, 0, 0, Math.abs(sway) * 0.6 + 0.04 + 0.02 * Math.sin(tp * 1.3)));

    // ---- the furniture
    this.piece(L, c, I.table, FLY.table, HO[0], 0.27, 1, 0.14, 0.1);
    const a = this.walkA(tp), b = this.walkB(tp);
    this.piece(L, c, I.chairA, FLY.chairA, Object.assign(HO[1], a), 0.33, 2, 0.09, 0.09, a);
    this.piece(L, c, I.chairB, FLY.chairB, Object.assign(HO[2], b), 0.33, 3, 0.09, 0.09, b);
    // the bed: lands against the wall flat and pulls out to its length; bounces as it is tucked
    let bounce = 0; for (const t of T_TUCK) { const k = ramp(tp, t, t + 0.3); bounce = Math.max(bounce, Math.sin(Math.PI * k)); }
    bounce = Math.max(bounce, 0.6 * Math.sin(Math.PI * ramp(tp, T_LAND - 0.05, T_LAND + 0.25)));
    const bm = this.piece(L, c, I.bed, FLY.bed, HO[3], 0.46, 0, 0.27, 0.36);
    rig.show(I.pilL, !!bm); rig.show(I.pilR, !!bm); this.cover.visible = !!bm && this.o.sz > 0.5;
    if (bm) {
      if (bounce > 0) { bm.multiply(this.V.l.makeScale(1, 1 - 0.035 * bounce, 1)); rig.mat(I.bed, bm); }
      this.bedM = (this.bedM || new THREE.Matrix4()).copy(bm);
      // the pillows plump themselves
      for (const [k, id, x] of this.PIL) {
        const p = tp - T_PILLOW[k]; let sy = 1, sxz = 1, hy = 0;
        if (p > 0 && p < 0.12) { const e = ease.out(p / 0.12); sy = 1 - 0.32 * e; sxz = 1 + 0.12 * e; }
        else if (p >= 0.12 && p < 0.9) { const r = (p - 0.12) / 0.78; sy = 1 + 0.3 * Math.exp(-r * 4) * Math.cos(r * 9.5 + 0.0) - 0.0 * r; sxz = 1 - 0.1 * Math.exp(-r * 4) * Math.cos(r * 9.5); hy = 0.03 * Math.sin(Math.PI * Math.min(1, r * 2.5)) * (1 - r); }
        const br = tp > T_DUSK + 1 ? 0.03 * Math.sin((tp - T_DUSK) * 1.4) : 0;
        rig.mat(id, this.child(M, this.bedM, x, MT.y1 + 0.026 + hy, 0.11, 0, -0.12, x * 0.4, sxz, sy * (1 + br), sxz));
      }
      if (this.cover.visible) { this.cover.matrix.copy(this.bedM); this.cover.matrixWorldNeedsUpdate = true; this.lay(tp); }
    }
    rig.mesh.visible = bw.on || rw.on || lw.on || !!bm;
    if (!showing && L.ret >= 1) this.hide();
  },

  // The coverlet at evening-time t (bed-local): thrown back over the foot of the bed, then gathered, flipped over like
  // a page and floated down, then tucked in at each side and the foot.
  lay(t) {
    const pos = this.CP, hw = MT.hw, ov = CV.over, top = CV.top, len = CV.z1 - CV.z0 + CV.foot;
    const zFold = CV.z0 + CV.fold * len, dMax = CV.fold * len;
    const flip = ramp(t, T_FLIP, T_LAND), gather = Math.sin(Math.PI * ramp(t, T_GATHER, T_FLIP)), land = ramp(t, T_LAND, T_LAND + 0.6);
    const kR = ease.inOut(ramp(t, T_TUCK[0], T_TUCK[0] + 0.26)), kL = ease.inOut(ramp(t, T_TUCK[1], T_TUCK[1] + 0.26)), kF = ease.inOut(ramp(t, T_TUCK[2], T_TUCK[2] + 0.26));
    const pR = Math.sin(Math.PI * ramp(t, T_TUCK[0], T_TUCK[0] + 0.3)), pL = Math.sin(Math.PI * ramp(t, T_TUCK[1], T_TUCK[1] + 0.3)), pF = Math.sin(Math.PI * ramp(t, T_TUCK[2], T_TUCK[2] + 0.3));
    const rumple = 1 - ease.smooth(ramp(t, T_FLIP + 0.2, T_LAND + 0.4));
    const dome = Math.sin(Math.PI * land) * (1 - land) * 0.035, breathe = t > T_DUSK + 1 ? 0.005 * Math.sin((t - T_DUSK) * 1.4) : 0;
    for (let i = 0; i <= NA; i++) for (let j = 0; j <= NS; j++) {
      const a = i / NA * 2 - 1, s = j / NS, k = (i * (NS + 1) + j) * 3;
      const zf = CV.z0 + s * len, xf = a * (hw + ov);
      // the cloth as it lies when made (sides over the side boards, loose or tucked down the gap; the foot the same)
      let x = xf, y = top + 0.002 * (1 + Math.sin(a * 7 + s * 11)), z = zf;
      const ex = Math.abs(xf) - hw, side = a > 0 ? 1 : -1;
      const wr = (0.012 * (1 + Math.sin(a * 9.0 + s * 14.0)) + 0.008 * (1 + Math.sin(s * 23.0 + a * 3.0))) * rumple;
      y += wr;
      if (ex > 0) {
        const kk = a > 0 ? kR : kL, round = ease.smooth(ex / 0.03);
        const xl = hw + (0.026 + 0.03 * ex / ov) * round, yl = top - 0.018 * round - ex * 0.82;
        const xt = hw + 0.004 * round, yt = top - 0.012 * round - ex * 1.05;
        x = side * (xl + (xt - xl) * kk); y = yl + (yt - yl) * kk + wr * 0.5;
      }
      const ez = zf - CV.z1;
      if (ez > 0) { const round = ease.smooth(ez / 0.02); z = CV.z1 + (0.016 - 0.012 * kF) * round; y = Math.min(y, top) + (ez * 0.45 * (1 - kF) - ez * 1.1 * kF) * round; }
      // the pat of each tuck: the cloth pressed down by that edge
      const nearR = ease.smooth(clamp01((a - 0.3) / 0.4)), nearL = ease.smooth(clamp01((-a - 0.3) / 0.4)), nearF = ease.smooth(clamp01((s - 0.6) / 0.3));
      y -= 0.008 * (pR * nearR + pL * nearL + pF * nearF);
      y += (dome + breathe) * (1 - a * a) * Math.sin(Math.PI * Math.min(1, s * 1.1)) * (ex > 0 ? 0 : 1);
      // the head half, folded back over the foot half, flips over like a page, its far edge trailing
      if (s < CV.fold) {
        const d = zFold - zf, td = clamp01((flip - 0.28 * d / dMax) / 0.72), th = Math.PI * (1 - ease.inOut(td)) - 0.22 * gather * (d / dMax);
        // (the page lies flat across the bed while it turns: its sides sag; only once down do they drape)
        const flat = ease.smooth(ramp(td, 0.75, 1));
        const sag = ex > 0 ? -0.05 * (ex / ov) * (ex / ov) : 0, xp = xf;
        const zp = zFold - d * Math.cos(th), yp = top + d * Math.sin(th) + 0.022 * (1 - Math.cos(th)) / 2 + sag + 0.035 * Math.sin(Math.PI * td) * (1 - a * a) + wr;
        x = xp + (x - xp) * flat; y = yp + (y - yp) * flat; z = zp + (z - zp) * flat;
      } else y += 0.0;
      pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
    }
    const g = this.cover.geometry; g.attributes.position.needsUpdate = true; g.computeVertexNormals();
  },
});
