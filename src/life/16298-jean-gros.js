// Rogier van der Weyden and workshop, Portrait of Jean Gros (recto); Coat of Arms of Jean Gros (verso), 1460 to 1464,
// Gallery 202. The word: thanks.
//
// A small panel, painted on both sides. On the front a young man prays, his hands together and his eyes turned to the
// left: it was the right wing of a folding diptych, and what he looked at, a Virgin and Child, is in Tournai now. On
// the back, which nobody in this gallery can see, are the things that say whose prayer it is: on black, a blue shield
// with a gold chevron and three silver crosslets hung by green straps from a gold device (the museum's notes call it a
// tower; it has the look of a pulley block), his initials J and G in gold flourishes, a blue and gold cord looping
// through all of it and ending in two gold tassels, and a parchment scroll with his own words on it: GRACES A DIEV,
// thanks be to God. Front and back say one thing, the front with his hands and the back in writing. So the show is
// the back of the picture, come round into the room, and it ends on his word.
//
// Look at it and the wall under the picture goes to the blue-black of his ground, as the back of the panel is dark:
// a pool of shade, in which the pictures keep their own light. Two gold tassels slip out from under the frame and
// float down side by side. One stays; the other darts off and draws the cord after it through the air as a pen draws
// a flourish: up the left side and round in a love-knot, where the J writes itself in gold; over the top and through
// an iron ring, and the gold device comes forward out of the dark on the ring, and under it, on its straps, the blue
// shield; down the right side and round again, where the G is written; and along the bottom to its place. Then the
// scroll, which has come out of the dark rolled up, unrolls from left to right across the top, behind the device, and
// the words come with it, one at a time: GRACES, A, DIEV, each to a plain note (a fifth, then the octave: three notes,
// not a tune and not a chant). The wall behind them warms a little, as gold gives light back. After that nothing
// happens: it floats there, breathing, as it floats on the black of the panel, for as long as you look. When you
// stop, the scroll rolls up, the cord runs home, everything goes back into the dark and the two tassels go up under
// the frame again.
//
// How it is made: three draw calls. The dusk is one mesh on the wall and the floor at its foot (flat against the
// wall, behind every canvas and label; it stops at the door). The cord, tassels, ring, device, straps, shield and
// initials are one rig with one shader: his gold is painted gold, ochre with brown hatching in the shade, not metal;
// the initials and the shield are flat, drawn once into a texture, and the initials are shown in the order a pen
// would write them (they are mine, in his manner: a bold stroke with a pale edge and a hatched one, hairline
// flourishes, lozenges). The scroll is one strip, laid along its way up to where the roll has got to and wound in a
// spiral beyond; its capitals are a broad pen's, as the museum transcribes the words. Everything floats at toy
// height, under the frame and lower than the picture next door (Jean Hey's Annunciation, a hand's width to the left),
// so from the look camera the guard has nothing to cut; from the floor, looking up, it dissolves the top of the cord
// where that would cross a picture. Nothing is solid and nothing stays out after the look. With "Reduce motion and
// flashing" on, the whole story runs at six tenths of the speed, the breathing at half, and the sounds are softer;
// there is no flash in it.
//
// What it does not do: the man stays in his picture and at his prayer, and neither he nor his hands nor the Virgin
// and Child he prayed to are built, moved or hinted at, because a private prayer is not a show; the shield with its
// crosslets and the words on the scroll are not things to push, collect or drive at; and no chant or hymn is quoted.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, rng } from '../paintlife.js';
import { score } from './stagecraft.js';

const TAU = Math.PI * 2;
// The stage's own space: x along the wall (to the viewer's right), y up from the floor, z out from the canvas plane.
// Everything is drawn in "design" metres about the plane it floats in, then stood at U0 along the wall, Z0 out, DY up.
const U0 = 0, Z0 = 0.42, DY = -0.03;
const CORD_R = 0.0048, TWIST = 0.021;                        // the cord: its radius; one turn of its two colours
const SW = 0.08, LCURL = 0.11, RCURL = 0.11, CORE = 0.0085;  // the scroll: its breadth; the paper in each end's curl; the roll's core
const NS = 168;                                             // cross-sections along the scroll
const T = { dusk: [0, 1.2], fall: [0.35, 1.32], part: [1.22, 1.6], fly: [1.55, 4.75], roll: [4.15, 4.85], unroll: [4.95, 7.25], light: [7.0, 8.5] };
const RATE_CALM = 0.6;
const TAIL = [-0.105, 0.42], S_HEAD0 = 0.035;                  // where the tassel that stays comes to rest; how far along the cord the other one waits
const RING = [0, 1.036], RING2 = [0, 0.797];
const SHIELD = { w: 0.2, h: 0.235, top: 0.757 }, CARD = { w: 0.15, h: 0.31, y0: 0.468, x: 0.212 };
// The atlas (pixels): the scroll's strip, the two initials, the shield.
const AW = 1024, AH = 640, A_SCROLL = [0, 0, 1024, 112], A_J = [8, 128, 240, 496], A_G = [264, 128, 240, 496], A_SHIELD = [520, 128, 320, 376];

const sstep = (a, b, x) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };

// ---------------------------------------------------------------- geometry
// Everything the rig holds has the same attributes: position, normal, color, aUv (where it is in the atlas, or along
// and round the cord) and aK (what kind of paint it is; which part, for coming out of the dark).
const _o = { p: new THREE.Vector3(), c: new THREE.Color(), uv: new THREE.Vector2() }, _q = [0, 1, 2, 3].map(() => new THREE.Vector3()), _n = new THREE.Vector3();
function surf(nu, nv, f, kind, part) {
  const Wd = nv + 1, n = (nu + 1) * Wd, P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3), U = new Float32Array(n * 2), e = 2e-3;
  const at = (u, v, into) => { f(u, v, _o); return into.copy(_o.p); };
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const u = i / nu, v = j / nv, k = i * Wd + j;
    _o.uv.set(u, v); _o.c.setRGB(1, 1, 1); f(u, v, _o);
    P[k * 3] = _o.p.x; P[k * 3 + 1] = _o.p.y; P[k * 3 + 2] = _o.p.z; C[k * 3] = _o.c.r; C[k * 3 + 1] = _o.c.g; C[k * 3 + 2] = _o.c.b; U[k * 2] = _o.uv.x; U[k * 2 + 1] = _o.uv.y;
    const uu = Math.min(1 - e, Math.max(e, u)), vv = Math.min(1 - e, Math.max(e, v));
    at(uu + e, vv, _q[0]).sub(at(uu - e, vv, _q[1])); at(uu, vv + e, _q[2]).sub(at(uu, vv - e, _q[3]));
    _n.crossVectors(_q[0], _q[2]); if (_n.lengthSq() < 1e-24) _n.set(0, 0, 1); else _n.normalize();
    N[k * 3] = _n.x; N[k * 3 + 1] = _n.y; N[k * 3 + 2] = _n.z;
  }
  const m = nu * nv * 6, pos = new Float32Array(m * 3), nor = new Float32Array(m * 3), col = new Float32Array(m * 3), uv = new Float32Array(m * 2); let w = 0;
  const put = k => { for (let c = 0; c < 3; c++) { pos[w * 3 + c] = P[k * 3 + c]; nor[w * 3 + c] = N[k * 3 + c]; col[w * 3 + c] = C[k * 3 + c]; } uv[w * 2] = U[k * 2]; uv[w * 2 + 1] = U[k * 2 + 1]; w++; };
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * Wd + j, b = (i + 1) * Wd + j, c = (i + 1) * Wd + j + 1, d = i * Wd + j + 1; put(a); put(b); put(d); put(b); put(c); put(d); }
  return pack(pos, nor, col, uv, kind, part);
}
function pack(pos, nor, col, uv, kind, part) {
  const g = new THREE.BufferGeometry(), n = pos.length / 3, k = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { k[i * 2] = kind; k[i * 2 + 1] = part; }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aK', new THREE.BufferAttribute(k, 2));
  return g;
}
// Flat faces: [[a, b, c, d] (corners, anticlockwise seen from outside), colour].
function faces(list, kind, part) {
  const n = list.length * 6, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), nn = new THREE.Vector3(); let w = 0;
  for (const [pts, c] of list) {
    a.fromArray(pts[1]).sub(b.fromArray(pts[0])); nn.fromArray(pts[3]).sub(b); nn.crossVectors(a, nn).normalize();
    for (const k of [0, 1, 2, 0, 2, 3]) { pos.set(pts[k], w * 3); nor.set([nn.x, nn.y, nn.z], w * 3); col.set([c.r, c.g, c.b], w * 3); w++; }
  }
  return pack(pos, nor, col, uv, kind, part);
}
function join(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const [name, k] of [['position', 3], ['normal', 3], ['color', 3], ['aUv', 2], ['aK', 2]]) { const a = new Float32Array(n * k); let o = 0; for (const g of list) { a.set(g.attributes[name].array, o); o += g.attributes[name].array.length; } out.setAttribute(name, new THREE.BufferAttribute(a, k)); }
  return out;
}
const moved = (g, m) => { g.applyMatrix4(m); return g; };

// ---------------------------------------------------------------- the paint: one shader for everything that floats
// Kinds (aK.x): 0 plain, 1 gold (painted: ochre, lighter where the light is, brown hatching where it is not), 2 an
// initial (from the atlas, shown as far as the pen has got), 3 the shield (from the atlas), 4 the cord (two colours
// twisted; shown from one end to wherever the tassel is), 5 the scroll (the atlas on its face, bare parchment on its
// back), 6 a tassel (gold, in strands). aK.y says which part it is (which initial the pen is on).
function armsPaint(u) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aUv; attribute vec2 aK; varying vec2 vUv2; varying vec2 vK; varying vec3 vOP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vUv2 = aUv; vK = aK; vOP = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D tCol, tMask; uniform mat4 uInv; uniform vec3 uKey, uDusk, uGoldL, uGoldM, uGoldD, uInk, uBlue, uBlueL, uTan, uBack;
uniform vec2 uPen, uCord; uniform float uLight, uDk;
varying vec2 vUv2; varying vec2 vK; varying vec3 vOP;
`)
      .replace('#include <opaque_fragment>', `{
  int kind = int(vK.x + 0.5), part = int(vK.y + 0.5);
  vec3 N = normalize(mat3(uInv) * inverseTransformDirection(normal, viewMatrix));
  float key = smoothstep(-0.3, 0.85, dot(N, uKey));
  vec3 alb = diffuseColor.rgb, col;
  if (kind == 1 || kind == 6) {
    float hc = kind == 6 ? vUv2.x * 15.0 : dot(vOP, vec3(150.0, 105.0, 120.0));
    float w = fwidth(hc), d = abs(fract(hc) - 0.5) * 2.0;
    float thick = kind == 6 ? 0.3 : 0.16 + 0.5 * (1.0 - key);
    float line = (1.0 - smoothstep(thick - w * 2.0, thick + w * 2.0, d)) * smoothstep(0.6, 0.22, w);
    col = mix(uGoldD, mix(uGoldM, uGoldL, smoothstep(0.45, 1.0, key)), smoothstep(0.0, 0.55, key)) * alb;
    col = mix(col, uInk, line * (kind == 6 ? 0.5 : 0.45 * (1.0 - 0.6 * key)));
  } else if (kind == 2) {
    vec4 m = texture2D(tMask, vUv2); if (m.r < 0.5) discard;
    float pen = part == 7 ? uPen.x : uPen.y; if (m.g > pen) discard;
    col = texture2D(tCol, vUv2).rgb * (0.86 + 0.14 * key);
    col += uGoldL * 0.55 * smoothstep(0.07, 0.0, pen - m.g) * step(pen, 0.999);
  } else if (kind == 3) {
    vec4 m = texture2D(tMask, vUv2); if (m.r < 0.5) discard;
    col = texture2D(tCol, vUv2).rgb * (0.56 + 0.42 * key);
  } else if (kind == 4) {
    if (vUv2.x < uCord.x || vUv2.x > uCord.y) discard;
    float st = fract(vUv2.x / ${TWIST.toFixed(4)} + vUv2.y);
    float bl = smoothstep(0.0, 0.1, st) * (1.0 - smoothstep(0.5, 0.6, st));
    col = mix(uTan, mix(uBlue, uBlueL, smoothstep(0.5, 1.0, key)), bl) * (0.62 + 0.7 * key);
  } else if (kind == 5) {
    col = (gl_FrontFacing ? texture2D(tCol, vUv2).rgb : uBack) * (0.3 + 0.74 * key);
  } else col = alb * (0.42 + 0.64 * key);
  // (what is near the wall is still in its dark: things come forward out of it into the light. Nothing shows closer to
  // the wall than the pictures hang: the gallery's own wash of lamplight is laid over whatever is that close)
  float zs = (uInv * vec4(lifeP, 1.0)).z; if (zs < 0.0) discard;
  float lit = smoothstep(0.0, 0.3, zs);
  outgoingLight = mix(col * uLight, uDusk, (1.0 - lit * lit) * 0.95 * uDk);
}
#include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'gros-arms';
  return m;
}

// ---------------------------------------------------------------- the atlas: what is flat on the panel, drawn once
// Two textures the same size. Colour: the paint. Mask: red is where there is paint at all, green the order a pen
// would lay it in (the initials write themselves by it).
function drawAtlas(P) {
  const mk = () => { const c = document.createElement('canvas'); c.width = AW; c.height = AH; return c; };
  const cc = mk(), cv = mk(), co = mk(), g = cc.getContext('2d', { willReadFrequently: true }), gv = cv.getContext('2d', { willReadFrequently: true }), go = co.getContext('2d', { willReadFrequently: true });
  const rnd = rng(16298);
  g.fillStyle = P.gold; g.fillRect(0, 0, AW, AH); gv.fillStyle = '#000'; gv.fillRect(0, 0, AW, AH); go.fillStyle = '#fff'; go.fillRect(0, 0, AW, AH);
  for (const x of [g, gv, go]) { x.lineCap = 'round'; x.lineJoin = 'round'; }
  // A dense line through points, with the way it is going at each.
  const dense = (pts, closed = false) => {
    const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], 0)), closed, 'centripetal'); c.arcLengthDivisions = 400;
    const n = Math.max(8, Math.ceil(c.getLength() / 2.5)), out = [];
    for (let i = 0; i <= n; i++) { const p = c.getPointAt(i / n), t = c.getTangentAt(i / n); out.push([p.x, p.y, t.x, t.y]); }
    return out;
  };
  const line = (ctx, d, i0, i1, style, w, dx = 0, dy = 0) => { ctx.strokeStyle = style; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(d[i0][0] + dx, d[i0][1] + dy); for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(d[i][0] + dx, d[i][1] + dy); ctx.stroke(); };
  // One stroke of a gold pen: w0 to w1 wide; laid between o0 and o1 of the writing. A broad stroke is a band with a
  // pale edge, a brown edge and hatching across its shaded half, as the initials on the panel are drawn.
  const pen = (ox, oy, pts, { w0 = 8, w1 = w0, o0 = 0, o1 = 1, closed = false } = {}) => {
    const d = dense(pts.map(p => [p[0] + ox, p[1] + oy]), closed), n = d.length - 1, wid = i => lerp(w0, w1, i / n);
    for (let i = 0; i < n; i++) {
      line(gv, d, i, i + 1, '#fff', wid(i));
      const v = Math.round(255 * lerp(o0, o1, i / n)); line(go, d, i, i + 1, `rgb(${v},${v},${v})`, wid(i) + 3);
      line(g, d, i, i + 1, P.gold, wid(i) + 3);
    }
    for (let i = 0; i < n; i++) {
      const w = wid(i), nx = -d[i][3], ny = d[i][2];
      if (w > 14) {
        line(g, d, i, i + 1, P.goldL, 2.4, -nx * (w / 2 - 2.2), -ny * (w / 2 - 2.2));
        line(g, d, i, i + 1, P.ink, 2.2, nx * (w / 2 - 1.6), ny * (w / 2 - 1.6));
        if (i % 2 === 0) { g.strokeStyle = P.ink; g.globalAlpha = 0.55; g.lineWidth = 1.3; g.beginPath(); g.moveTo(d[i][0] + nx * (w / 2 - 2), d[i][1] + ny * (w / 2 - 2)); g.lineTo(d[i][0] + nx * (w * 0.02) - d[i][2] * w * 0.3, d[i][1] + ny * (w * 0.02) - d[i][3] * w * 0.3); g.stroke(); g.globalAlpha = 1; }
      } else { g.globalAlpha = 0.75; line(g, d, i, i + 1, P.ink, 1.3, nx * (w / 2 - 0.8), ny * (w / 2 - 0.8)); g.globalAlpha = 0.9; line(g, d, i, i + 1, P.goldL, 1.2, -nx * (w / 2 - 1.4), -ny * (w / 2 - 1.4)); g.globalAlpha = 1; }
    }
  };
  // A lozenge with an open middle, as his flourishes end in.
  const lozenge = (ox, oy, x, y, a, b, turn, o0, o1) => {
    const c = Math.cos(turn), s = Math.sin(turn), p = (u, v) => [x + u * c - v * s, y + u * s + v * c];
    pen(ox, oy, [p(0, -b), p(a * 0.5, -b * 0.42), p(a, 0), p(a * 0.5, b * 0.42), p(0, b), p(-a * 0.5, b * 0.42), p(-a, 0), p(-a * 0.5, -b * 0.42)], { w0: 6.5, o0, o1, closed: true });
  };

  // ---- the J
  {
    const [ox, oy] = A_J;
    pen(ox, oy, [[212, 104], [213, 200], [208, 320], [201, 428]], { w0: 31, w1: 27, o0: 0.0, o1: 0.22 });
    pen(ox, oy, [[201, 428], [186, 458], [152, 466], [114, 450], [94, 424]], { w0: 27, w1: 8, o0: 0.22, o1: 0.34 });
    pen(ox, oy, [[212, 104], [190, 100], [152, 122], [102, 130], [62, 112], [34, 100], [14, 122], [26, 150], [46, 142]], { w0: 12, w1: 7, o0: 0.34, o1: 0.52 });
    pen(ox, oy, [[102, 130], [104, 90], [126, 42], [156, 14], [174, 30], [156, 54], [130, 44]], { w0: 8, w1: 6.5, o0: 0.52, o1: 0.64 });
    pen(ox, oy, [[152, 168], [122, 196], [100, 246], [102, 318], [124, 354], [144, 318], [136, 250], [112, 206], [86, 196], [70, 214], [80, 236]], { w0: 7.5, o0: 0.64, o1: 0.8 });
    lozenge(ox, oy, 124, 384, 9, 16, 0, 0.8, 0.84);
    pen(ox, oy, [[94, 424], [68, 398], [40, 410], [34, 444], [58, 470], [108, 482], [160, 474], [204, 482], [226, 466], [214, 448]], { w0: 8, w1: 6.5, o0: 0.84, o1: 0.97 });
    lozenge(ox, oy, 62, 356, 9, 15, -0.5, 0.96, 1.0);
  }
  // ---- the G
  {
    const [ox, oy] = A_G, oval = [], cx = 104, cy = 322, rx = 80, ry = 160, f0 = -0.98, f1 = -TAU + 0.3;
    for (let i = 0; i <= 24; i++) { const f = lerp(f0, f1, i / 24); oval.push([cx + rx * Math.cos(f), cy + ry * Math.sin(f)]); }     // from the upper right, over the top, down the left, round and up the right
    pen(ox, oy, [[oval[0][0] + 6, oval[0][1] + 38], [oval[0][0] + 4, oval[0][1] + 14], oval[0]], { w0: 9, w1: 27, o0: 0.0, o1: 0.04 });
    pen(ox, oy, oval, { w0: 28, w1: 27, o0: 0.04, o1: 0.42 });
    pen(ox, oy, [oval[24], [186, 318], [176, 296], [146, 292], [118, 302], [110, 324], [124, 340], [140, 330]], { w0: 27, w1: 7, o0: 0.42, o1: 0.56 });
    pen(ox, oy, [[100, 164], [80, 128], [48, 110], [26, 82], [44, 54], [84, 58], [122, 88], [164, 110], [204, 100], [224, 68], [208, 42], [184, 54], [192, 76]], { w0: 10, w1: 6.5, o0: 0.56, o1: 0.9 });
    lozenge(ox, oy, 160, 50, 9, 16, 0.5, 0.9, 0.95);
    lozenge(ox, oy, 214, 142, 9, 16, -0.3, 0.95, 1.0);
  }
  // ---- the shield: azure, a chevron or between three crosslets argent (as it is painted; it is not read further)
  {
    const [ox, oy, w, h] = A_SHIELD;
    const path = (ctx, grow = 0) => { ctx.beginPath(); ctx.moveTo(ox + 5 - grow, oy + 5 - grow); ctx.lineTo(ox + w - 5 + grow, oy + 5 - grow); ctx.lineTo(ox + w - 5 + grow, oy + h * 0.4);
      ctx.bezierCurveTo(ox + w - 5 + grow, oy + h * 0.68, ox + w * 0.74, oy + h * 0.86, ox + w / 2, oy + h - 4 + grow); ctx.bezierCurveTo(ox + w * 0.26, oy + h * 0.86, ox + 5 - grow, oy + h * 0.68, ox + 5 - grow, oy + h * 0.4); ctx.closePath(); };
    gv.fillStyle = '#fff'; path(gv); gv.fill(); go.fillStyle = '#000'; path(go, 3); go.fill();
    g.save(); path(g, 4); g.clip();
    g.fillStyle = P.blue; g.fillRect(ox, oy, w, h);
    for (let i = 0; i < 260; i++) {      // the blue is brushed: thin strokes, up and down, a little lighter and darker
      const x = ox + rnd() * w, y = oy + rnd() * h, l = 14 + rnd() * 34; g.strokeStyle = rnd() < 0.5 ? P.blueL : P.blueD; g.globalAlpha = 0.1 + 0.14 * rnd(); g.lineWidth = 3 + rnd() * 5;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 6, y + l); g.stroke();
    }
    g.globalAlpha = 1;
    // the chevron: a broad band, a ridge along it, hatched on its lower half
    const ax = ox + w / 2, top = oy + h * 0.1, bw = h * 0.235, run = w * 0.56, rise = h * 0.52;
    const chev = (ctx, y0, y1) => { ctx.beginPath(); ctx.moveTo(ax, y0); ctx.lineTo(ax + run, y0 + rise); ctx.lineTo(ax + run, y1 + rise); ctx.lineTo(ax, y1); ctx.lineTo(ax - run, y1 + rise); ctx.lineTo(ax - run, y0 + rise); ctx.closePath(); };
    g.fillStyle = P.gold; chev(g, top, top + bw); g.fill();
    g.fillStyle = P.goldL; g.globalAlpha = 0.55; chev(g, top + 2, top + bw * 0.46); g.fill(); g.globalAlpha = 1;
    g.save(); chev(g, top + bw * 0.5, top + bw); g.clip(); g.strokeStyle = P.ink; g.globalAlpha = 0.4; g.lineWidth = 1.3;
    for (let x = ox - h; x < ox + w + h; x += 6.5) { g.beginPath(); g.moveTo(x, oy); g.lineTo(x - h * 0.35, oy + h); g.stroke(); }
    g.restore(); g.globalAlpha = 1;
    g.strokeStyle = P.ink; g.lineWidth = 2.2; g.globalAlpha = 0.8; chev(g, top, top + bw); g.stroke();
    g.lineWidth = 1.6; g.beginPath(); g.moveTo(ax - run, top + bw * 0.48 + rise); g.lineTo(ax, top + bw * 0.48); g.lineTo(ax + run, top + bw * 0.48 + rise); g.stroke(); g.globalAlpha = 1;
    // the little black star at its point
    { const sx = ax, sy = top + bw * 0.27; g.fillStyle = P.ink; g.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - Math.PI / 2, r = i % 2 ? 3 : 8.5; g.lineTo(sx + r * Math.cos(a), sy + r * Math.sin(a)); } g.closePath(); g.fill(); }
    // three crosslets, silver gone grey, each with its shadow to the lower right
    const cross = (cx, cy, r, t) => { for (const [dx, dy, style, a] of [[2.6, 3, P.ink, 0.5], [0, 0, P.silver, 1], [-1.2, -1.4, P.silverL, 0.5]]) { g.strokeStyle = style; g.globalAlpha = a; g.lineWidth = a === 0.5 && style === P.silverL ? t * 0.35 : t; g.lineCap = 'butt';
      for (const s of [1, -1]) { g.beginPath(); g.moveTo(cx + dx - r, cy + dy - r * s); g.lineTo(cx + dx + r, cy + dy + r * s); g.stroke(); } } g.globalAlpha = 1; g.lineCap = 'round'; };
    cross(ox + w * 0.2, oy + h * 0.2, w * 0.085, w * 0.062); cross(ox + w * 0.8, oy + h * 0.2, w * 0.085, w * 0.062); cross(ox + w * 0.5, oy + h * 0.735, w * 0.105, w * 0.07);
    g.restore();
    g.strokeStyle = P.ink; g.lineWidth = 5; g.globalAlpha = 0.85; path(g, -1); g.stroke(); g.globalAlpha = 0.5; g.strokeStyle = P.blueL; g.lineWidth = 1.6; path(g, -5); g.stroke(); g.globalAlpha = 1;
  }
  return { cc, cv, co, g, rnd };
}

// The words on the scroll: capitals a broad pen makes (as the museum transcribes them), each in a box one high,
// [how wide, strokes...]; a stroke is a list of points.
const GLYPH = {
  G: [0.86, [[0.76, 0.24], [0.6, 0.07], [0.38, 0.05], [0.16, 0.26], [0.1, 0.52], [0.2, 0.82], [0.44, 0.96], [0.68, 0.88], [0.78, 0.66], [0.78, 0.54]], [[0.5, 0.54], [0.82, 0.54]]],
  R: [0.84, [[0.17, 0.03], [0.17, 0.97]], [[0.17, 0.07], [0.46, 0.05], [0.68, 0.16], [0.68, 0.36], [0.46, 0.5], [0.17, 0.5]], [[0.4, 0.5], [0.58, 0.72], [0.8, 0.97]]],
  A: [0.9, [[0.06, 0.97], [0.26, 0.5], [0.45, 0.05]], [[0.45, 0.05], [0.65, 0.5], [0.85, 0.97]], [[0.21, 0.63], [0.7, 0.63]], [[0.2, 0.04], [0.7, 0.04]]],
  C: [0.82, [[0.76, 0.24], [0.6, 0.07], [0.38, 0.05], [0.16, 0.26], [0.1, 0.52], [0.2, 0.82], [0.44, 0.96], [0.66, 0.9], [0.78, 0.76]]],
  E: [0.82, [[0.76, 0.22], [0.6, 0.07], [0.38, 0.05], [0.16, 0.26], [0.1, 0.52], [0.2, 0.82], [0.44, 0.96], [0.66, 0.9], [0.78, 0.76]], [[0.12, 0.5], [0.66, 0.5]]],
  S: [0.78, [[0.7, 0.2], [0.54, 0.06], [0.34, 0.06], [0.18, 0.2], [0.24, 0.4], [0.44, 0.5], [0.62, 0.6], [0.68, 0.8], [0.52, 0.95], [0.3, 0.95], [0.12, 0.8]]],
  D: [0.9, [[0.17, 0.03], [0.17, 0.97]], [[0.17, 0.06], [0.44, 0.05], [0.68, 0.18], [0.8, 0.42], [0.76, 0.7], [0.58, 0.9], [0.36, 0.96], [0.17, 0.95]]],
  I: [0.44, [[0.22, 0.03], [0.22, 0.97]], [[0.06, 0.04], [0.38, 0.04]], [[0.06, 0.96], [0.38, 0.96]]],
  V: [0.88, [[0.06, 0.03], [0.24, 0.5], [0.44, 0.97]], [[0.82, 0.03], [0.63, 0.5], [0.44, 0.97]]],
};

lifeFor(16298, {
  title: /^Portrait of Jean Gros/,
  word: 'thanks',
  // (a small work hung high, with all of it in view at the top; what comes out floats under it, at toy height. The camera
  // stands square on, so that on a phone held upright the whole breadth of it is in view under the picture)
  stage: { out: 0.9, half: 0.9, cam: { dist: 2.1, side: 0, height: 1.02, fov: 52, lookU: 0, lookOut: 0.2, lookH: 1.06, whole: false } },
  wake: 2, ret: 2.2,

  build(L) {
    const col = (h, a = 0.06) => L.pal.near(h, a), hex = c => '#' + c.clone().getHexString();
    const C = this.C = {
      gold: col('#c1932f'), goldL: col('#dcb24a'), goldD: col('#6e4a16', 0.1), ink: col('#2c1c0c', 0.2), blue: col('#1a5177', 0.04), blueL: col('#3a7ba6', 0.04), cordB: col('#3a84b6', 0.03), cordL: col('#86c4e8', 0.03), blueD: col('#0f3852', 0.08),
      tan: col('#8f6c34', 0.1), silver: col('#9a9284'), silverL: col('#c5beb0'), parch: col('#aca492', 0.04), parchL: col('#cbc4b2', 0.03), parchD: col('#827a68', 0.06), back: col('#665f50', 0.08),
      iron: col('#8e9499'), ironD: col('#3d4144'), green: col('#7d8c48'), greenD: col('#56632f'), dusk: new THREE.Color(0.0055, 0.014, 0.025), text: col('#1a130d', 0.3),
    };
    this.B = new THREE.Matrix4().makeBasis(new THREE.Vector3(L.tx, 0, L.tz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(L.nx, 0, L.nz)).setPosition(L.floor(U0, 0));
    this.V = { m: new THREE.Matrix4(), a: new THREE.Matrix4(), b: new THREE.Matrix4(), w: new THREE.Matrix4(), p: new THREE.Vector3(), d: new THREE.Vector3(), x: new THREE.Vector3(), y: new THREE.Vector3(), z: new THREE.Vector3() };
    const railH = L.rail - L.y;

    // ------------------------------------------------------------ the cord's way through the air (design metres)
    const cp = [], P3 = (x, y, z = 0) => cp.push(new THREE.Vector3(x, y, z));
    const knot = (x0, ya, yb, dir, z0, z1) => { const R = 0.04; for (let i = 1; i <= 11; i++) { const f = i / 12 * TAU; P3(x0 + dir * R * (1 - Math.cos(f)), lerp(ya, yb, i / 12) + Math.sign(yb - ya) * R * Math.sin(f), lerp(z0, z1, i / 12)); } };
    const side = [[-0.17, 0.404, 0.002], [-0.24, 0.408, 0.005], [-0.298, 0.44, 0.008], [-0.334, 0.5, 0.01], [-0.322, 0.565, 0.012], [-0.336, 0.625, 0.01]];      // from a tassel, round the corner and up
    const over = [[-0.336, 0.715, 0.03], [-0.341, 0.79, 0.026], [-0.322, 0.862, 0.042], [-0.338, 0.94, 0.022], [-0.31, 1.012, 0.012], [-0.245, 1.064, 0.01], [-0.165, 1.076, 0.008], [-0.085, 1.056, 0.01]];      // past the scroll's end, and over the top
    P3(TAIL[0], TAIL[1], 0); for (const p of side) P3(...p);
    const kJ = cp.length; knot(-0.336, 0.625, 0.715, 1, 0.008, 0.03);
    for (const p of over) P3(...p);
    P3(-0.03, 1.043, 0.012); const kR = cp.length; P3(RING[0], RING[1] + 0.001, 0); P3(0.03, 1.043, -0.012);
    for (const p of over.slice().reverse()) P3(-p[0], p[1], p[2]);
    const kG = cp.length; knot(0.336, 0.715, 0.625, -1, 0.03, 0.008);
    for (const p of side.slice().reverse()) P3(-p[0], p[1], p[2]); P3(-TAIL[0], TAIL[1], 0);
    const curve = new THREE.CatmullRomCurve3(cp, false, 'centripetal'); curve.arcLengthDivisions = 3000;
    const CL = this.CL = curve.getLength(), NC = Math.ceil(CL / 0.005), cpos = new Float32Array((NC + 1) * 3), ctan = new Float32Array((NC + 1) * 3);
    { const p = new THREE.Vector3(); for (let i = 0; i <= NC; i++) { curve.getPointAt(i / NC, p); p.toArray(cpos, i * 3); curve.getTangentAt(i / NC, p); p.toArray(ctan, i * 3); } }
    this.cord = { n: NC, pos: cpos, tan: ctan };
    // (how far along the cord each thing it ties is: the control points are evenly spread by their own parameter, not by length)
    const sOf = k => { const us = curve.getUtoTmapping; let lo = 0, hi = 1, t = k / (cp.length - 1); for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (us.call(curve, mid) < t) lo = mid; else hi = mid; } return lo * CL; };
    this.sJ = sOf(kJ); this.sR = sOf(kR); this.sG = sOf(kG);
    const tube = (() => {
      const SIDES = 6, m = NC * SIDES * 6, pos = new Float32Array(m * 3), nor = new Float32Array(m * 3), cl = new Float32Array(m * 3).fill(1), uv = new Float32Array(m * 2);
      const t = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), zz = new THREE.Vector3(0, 0, 1), ring = [];
      for (let i = 0; i <= NC; i++) { t.fromArray(ctan, i * 3); a.crossVectors(t, zz).normalize(); b.crossVectors(t, a).normalize(); const r = []; for (let j = 0; j <= SIDES; j++) { const f = j / SIDES * TAU, c = Math.cos(f), s = Math.sin(f); r.push([a.x * c + b.x * s, a.y * c + b.y * s, a.z * c + b.z * s]); } ring.push(r); }
      let w = 0; const put = (i, j) => { const n = ring[i][j]; pos[w * 3] = cpos[i * 3] + n[0] * CORD_R; pos[w * 3 + 1] = cpos[i * 3 + 1] + n[1] * CORD_R; pos[w * 3 + 2] = cpos[i * 3 + 2] + n[2] * CORD_R; nor.set(n, w * 3); uv[w * 2] = i / NC * CL; uv[w * 2 + 1] = j / SIDES; w++; };
      for (let i = 0; i < NC; i++) for (let j = 0; j < SIDES; j++) { put(i, j); put(i + 1, j); put(i, j + 1); put(i + 1, j); put(i + 1, j + 1); put(i, j + 1); }
      return pack(pos, nor, cl, uv, 4, 2);
    })();

    // ------------------------------------------------------------ a tassel: its head at the origin, its skirt along +x
    const tassel = part => {
      const white = new THREE.Color(1, 1, 1), deep = new THREE.Color(0.72, 0.66, 0.56);
      const head = surf(12, 8, (u, v, o) => { const th = v * Math.PI, ph = u * TAU, r = 0.0135; o.p.set(0.004 - r * Math.cos(th), r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph)); o.c.copy(white); o.uv.set(u, 0.05); }, 1, part);
      const neck = surf(10, 2, (u, v, o) => { const ph = u * TAU, r = lerp(0.0056, 0.0064, v); o.p.set(lerp(-0.016, -0.004, v), r * Math.cos(ph), r * Math.sin(ph)); o.c.copy(deep); }, 1, part);
      const band = surf(12, 3, (u, v, o) => { const ph = u * TAU, r = 0.0098 + 0.0022 * Math.sin(v * Math.PI); o.p.set(lerp(0.0145, 0.0215, v), r * Math.cos(ph), r * Math.sin(ph)); o.c.copy(deep); }, 1, part);
      // (the skirt: strands that wave as they go and end raggedly, as his do)
      const skirt = surf(30, 12, (u, v, o) => {
        const ph = u * TAU, len = 0.062 + 0.01 * Math.sin(ph * 3 + 1) + 0.006 * Math.sin(ph * 7), x = 0.02 + v * len;
        const r = (0.0095 + 0.02 * Math.pow(v, 0.8)) * (1 + 0.12 * Math.sin(ph * 15) * v), wave = 0.3 * Math.sin(v * 9.5 + 0.6) * v;
        o.p.set(x, r * Math.cos(ph + wave) * 1.0, r * Math.sin(ph + wave) * 0.82); o.c.copy(white).lerp(deep, 0.5 * v * (0.5 + 0.5 * Math.sin(ph * 15))); o.uv.set(u, v);
      }, 6, part);
      return join([head, neck, band, skirt]);
    };

    // ------------------------------------------------------------ an iron ring, standing in the plane of the panel
    const ring = (R, r, part) => surf(22, 8, (u, v, o) => { const a = u * TAU, b = v * TAU, q = R + r * Math.cos(b); o.p.set(q * Math.cos(a), q * Math.sin(a), r * Math.sin(b)); o.c.copy(C.iron).lerp(C.ironD, 0.5 - 0.5 * Math.sin(a + 0.8)); }, 0, part);

    // ------------------------------------------------------------ his gold device, as it is painted: a square block in two tiers
    // under a pointed roof, pierced with slots and crosses, an eye at the top and a hook at the foot; turned so that two
    // of its faces show
    const device = (() => {
      const F = [], D = [], g1 = new THREE.Color(1, 1, 1), g2 = new THREE.Color(0.86, 0.82, 0.74), dark = C.ink.clone().multiplyScalar(0.45);
      const frustum = (h0, y0, h1, y1, c) => { const k = [[-1, 1], [1, 1], [1, -1], [-1, -1]]; for (let i = 0; i < 4; i++) { const a = k[i], b = k[(i + 1) % 4]; F.push([[[a[0] * h0, y0, a[1] * h0], [b[0] * h0, y0, b[1] * h0], [b[0] * h1, y1, b[1] * h1], [a[0] * h1, y1, a[1] * h1]], c]); }
        F.push([[[-h1, y1, h1], [h1, y1, h1], [h1, y1, -h1], [-h1, y1, -h1]], c]); F.push([[[-h0, y0, -h0], [h0, y0, -h0], [h0, y0, h0], [-h0, y0, h0]], g2]); };
      // an opening on a face (0: the one that will turn left, 1: right): a dark quad a hair proud of it
      const hole = (face, h, x0, y0, x1, y1) => { const e = h + 0.0006; D.push(face === 0 ? [[[x0, y0, e], [x1, y0, e], [x1, y1, e], [x0, y1, e]], dark] : [[[e, y0, -x0], [e, y0, -x1], [e, y1, -x1], [e, y1, -x0]], dark]); };
      const crossHole = (face, h, cy) => { hole(face, h, -0.0036, cy - 0.013, 0.0036, cy + 0.013); hole(face, h, -0.0105, cy - 0.0036, 0.0105, cy + 0.0036); };
      const slots = (face, h, y0, y1) => { hole(face, h, -0.0145, y0, -0.0035, y1); hole(face, h, 0.0035, y0, 0.0145, y1); };
      frustum(0.0075, 0.797, 0.0075, 0.812, g2);                   // the hook's stem
      frustum(0.009, 0.812, 0.027, 0.838, g1);                     // the foot, flaring up
      frustum(0.034, 0.838, 0.034, 0.846, g1);                     // a cornice
      frustum(0.0295, 0.846, 0.0295, 0.898, g1);                   // the lower tier
      frustum(0.0345, 0.898, 0.0345, 0.907, g1);
      frustum(0.031, 0.907, 0.031, 0.962, g1);                     // the upper tier
      frustum(0.04, 0.962, 0.037, 0.968, g1);                      // the eaves
      frustum(0.036, 0.968, 0.006, 1.006, g1);                     // the roof
      frustum(0.0058, 1.004, 0.0058, 1.022, g2);                   // the eye's stem
      slots(0, 0.0295, 0.853, 0.892); crossHole(1, 0.0295, 0.872);
      crossHole(0, 0.031, 0.935); slots(1, 0.031, 0.915, 0.955);
      const g = join([faces(F, 1, 4), faces(D, 0, 4)]);
      return moved(g, new THREE.Matrix4().makeRotationY(-0.62));
    })();

    // ------------------------------------------------------------ the straps (two, green, from the lower ring to the shield's
    // corners) and the shield, a little rounded
    const straps = (() => {
      const F = [], y0 = RING2[1] - 0.014, y1 = SHIELD.top - 0.004;
      for (const s of [-1, 1]) { const x0 = s * 0.004, x1 = s * (SHIELD.w * 0.36), wv = 0.0065, z = 0.004;
        F.push([[[x0 - wv, y0, z], [x0 + wv, y0, z], [x1 + wv, y1, z + 0.004], [x1 - wv, y1, z + 0.004]].reverse(), s < 0 ? C.green : C.greenD]); }
      return faces(F, 0, 5);
    })();
    const uvIn = (r, u, v, o) => o.uv.set((r[0] + u * r[2]) / AW, (r[1] + v * r[3]) / AH);
    const shield = surf(12, 12, (u, v, o) => { const x = (u - 0.5) * SHIELD.w; o.p.set(x, SHIELD.top - v * SHIELD.h, 0.014 * (1 - Math.pow(2 * u - 1, 2)) - 0.004); uvIn(A_SHIELD, u, v, o); }, 3, 6);
    const card = (r, x, part) => surf(1, 1, (u, v, o) => { o.p.set(x + (u - 0.5) * CARD.w, CARD.y0 + CARD.h * (1 - v), 0); uvIn(r, u, v, o); }, 2, part);

    // ------------------------------------------------------------ the scroll's way (design metres), and the words along it
    const sp = [[-0.3, 0.9], [-0.29, 0.856], [-0.262, 0.822], [-0.226, 0.82], [-0.19, 0.846], [-0.135, 0.902], [-0.082, 0.95], [-0.03, 0.976], [0.02, 0.98], [0.07, 0.971], [0.108, 0.95], [0.155, 0.902], [0.2, 0.85], [0.23, 0.822], [0.262, 0.822], [0.29, 0.856], [0.3, 0.9]];
    const sc = new THREE.CatmullRomCurve3(sp.map(p => new THREE.Vector3(p[0], p[1], 0)), false, 'centripetal'); sc.arcLengthDivisions = 1200;
    const SL = sc.getLength(), NT = 480, tab = new Float32Array((NT + 1) * 12);
    {
      const zs = x => -0.03 - 0.075 * Math.exp(-(x / 0.085) * (x / 0.085)) + 0.011 * Math.sin(x * 52 + 0.6);
      const p = new THREE.Vector3(), q = new THREE.Vector3(), t = new THREE.Vector3(), w = new THREE.Vector3(), n = new THREE.Vector3();
      for (let i = 0; i <= NT; i++) {
        const s = i / NT; sc.getPointAt(s, p); p.z = zs(p.x); sc.getPointAt(Math.min(1, s + 1e-3), q); q.z = zs(q.x); sc.getPointAt(Math.max(0, s - 1e-3), t); t.z = zs(t.x);
        t.subVectors(q, t).normalize(); w.set(-t.y, t.x, 0.2).addScaledVector(t, -(w.set(-t.y, t.x, 0.2).dot(t))).normalize(); n.crossVectors(t, w).normalize();
        // (towards each end it turns its upper edge to us, so that the curl there is seen from its end, as he draws them)
        const tw = 1.0 * (1 - sstep(0.02, 0.15, s * SL)) + 1.0 * sstep(SL - 0.15, SL - 0.02, s * SL), cw = Math.cos(tw), sw = Math.sin(tw);
        q.copy(w).multiplyScalar(cw).addScaledVector(n, sw); n.multiplyScalar(cw).addScaledVector(w, -sw); w.copy(q);
        p.toArray(tab, i * 12); t.toArray(tab, i * 12 + 3); w.toArray(tab, i * 12 + 6); n.toArray(tab, i * 12 + 9);
      }
    }
    const LT = LCURL + SL + RCURL;
    this.S = { L: SL, LT, tab, NT, q0: 0.05 };
    const sAtX = x => { let lo = 0, hi = 1; const p = new THREE.Vector3(); for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; sc.getPointAt(m, p); if (p.x < x) lo = m; else hi = m; } return lo * SL; };
    const WORDS = [['GRACES', sAtX(-0.148)], ['A', sAtX(0.086)], ['DIEV', sAtX(0.176)]];
    this.sWord = WORDS.map(w => w[1]);

    // ------------------------------------------------------------ the atlas
    const css = {}; for (const k of Object.keys(C)) css[k] = hex(C[k]);
    const A = drawAtlas(css), g = A.g;
    {
      // the scroll's face: parchment, brushed along its length, and the words in a broad pen's capitals
      const [ox, oy, w, h] = A_SCROLL, rnd = A.rnd, pxm = w / LT;
      g.fillStyle = css.parch; g.fillRect(ox, oy, w, h);
      for (let i = 0; i < 420; i++) { const x = rnd() * w, y = oy + rnd() * h, l = 30 + rnd() * 90; g.strokeStyle = rnd() < 0.55 ? css.parchL : css.parchD; g.globalAlpha = 0.1 + 0.16 * rnd(); g.lineWidth = 2 + rnd() * 5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (rnd() - 0.5) * 5); g.stroke(); }
      g.globalAlpha = 0.5; const eg = g.createLinearGradient(0, oy, 0, oy + h); eg.addColorStop(0, css.parchD); eg.addColorStop(0.12, 'rgba(0,0,0,0)'); eg.addColorStop(0.88, 'rgba(0,0,0,0)'); eg.addColorStop(1, css.parchD); g.fillStyle = eg; g.fillRect(ox, oy, w, h); g.globalAlpha = 1;
      const cap = 0.057 * pxm * (h / (SW * pxm)), adv = 0.0375 * pxm, top = oy + (h - cap) / 2, nib = cap * 0.15, na = 0.5;      // (the strip's height is the scroll's breadth)
      const nx = Math.cos(na) * nib / 2, ny = -Math.sin(na) * nib / 2;
      const sweep = (x0, pts, sx) => {
        const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(x0 + p[0] * sx, top + p[1] * cap, 0)), false, 'centripetal', 0.5), n = Math.max(6, Math.ceil(c.getLength() / 1.5)), d = c.getSpacedPoints(n);
        g.fillStyle = css.text; g.strokeStyle = css.text; g.lineWidth = 1.6;
        for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(d[i].x + nx, d[i].y + ny); g.lineTo(d[i + 1].x + nx, d[i + 1].y + ny); g.lineTo(d[i + 1].x - nx, d[i + 1].y - ny); g.lineTo(d[i].x - nx, d[i].y - ny); g.closePath(); g.fill(); g.stroke(); }
      };
      const star = (x, y, r) => { g.fillStyle = css.text; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, q = i % 2 ? r * 0.26 : r; g.lineTo(x + q * Math.cos(a), y + q * Math.sin(a)); } g.closePath(); g.fill(); };
      for (const [word, sMid] of WORDS) {
        const x0 = ox + (LCURL + sMid) * pxm - word.length * adv / 2;
        [...word].forEach((ch, i) => { const G = GLYPH[ch], sx = cap * 0.62, gw = G[0] * sx; for (const st of G.slice(1)) sweep(x0 + i * adv + (adv - gw) / 2, st, sx); });
        star(x0 - adv * 0.42, oy + h * 0.3, cap * 0.13); if (word.length > 1) star(x0 + word.length * adv + adv * 0.36, oy + h * 0.68, cap * 0.11);
      }
    }
    {
      const W = AW, H = AH, c = g.getImageData(0, 0, W, H).data, v = A.cv.getContext('2d').getImageData(0, 0, W, H).data, o = A.co.getContext('2d').getImageData(0, 0, W, H).data, m = new Uint8Array(W * H * 4);
      for (let i = 0; i < W * H * 4; i += 4) { m[i] = v[i]; m[i + 1] = o[i]; m[i + 2] = 0; m[i + 3] = 255; }
      const tex = (data, srgb) => { const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 4; t.needsUpdate = true; return t; };
      this.tCol = tex(new Uint8Array(c.buffer.slice(0)), true); this.tMask = tex(m, false);
    }

    // ------------------------------------------------------------ the rig: everything but the scroll, one draw call
    const u = this.u = {
      tCol: { value: this.tCol }, tMask: { value: this.tMask }, uInv: { value: this.B.clone().invert() }, uKey: { value: new THREE.Vector3(-0.5, 0.62, 0.6).normalize() },
      uDusk: { value: C.dusk }, uGoldL: { value: C.goldL }, uGoldM: { value: C.gold }, uGoldD: { value: C.goldD }, uInk: { value: C.ink }, uBlue: { value: C.cordB }, uBlueL: { value: C.cordL }, uTan: { value: C.tan }, uBack: { value: C.back },
      uPen: { value: new THREE.Vector2(0, 0) }, uCord: { value: new THREE.Vector2(0, 0) }, uLight: { value: 1 }, uDk: { value: 0 },
    };
    const rig = this.rig = L.rig(12, 46000, armsPaint(u));
    const tg0 = rig.geo(tassel(0)), tg1 = rig.geo(tassel(1));
    this.I = { tail: rig.add(tg0), lead: rig.add(tg1), cord: rig.add(rig.geo(tube)), ring: rig.add(rig.geo(moved(ring(0.0165, 0.0036, 3), new THREE.Matrix4().makeTranslation(RING[0], RING[1], 0)))),
      device: rig.add(rig.geo(device)), straps: rig.add(rig.geo(join([straps, moved(ring(0.0125, 0.0032, 5), new THREE.Matrix4().makeTranslation(RING2[0], RING2[1], 0))]))),
      shield: rig.add(rig.geo(shield)), J: rig.add(rig.geo(card(A_J, -CARD.x, 7))), G: rig.add(rig.geo(card(A_G, CARD.x, 8))) };

    // ------------------------------------------------------------ the scroll: one strip, laid along its way as far as the roll
    // has got to, and wound beyond
    {
      const n = NS, pos = new Float32Array(n * 2 * 3), nor = new Float32Array(n * 2 * 3), cl = new Float32Array(n * 2 * 3).fill(1), uv = new Float32Array(n * 2 * 2), kk = new Float32Array(n * 2 * 2), idx = [];
      for (let i = 0; i < n; i++) { const a = i / (n - 1); for (const e of [0, 1]) { const k = i * 2 + e; uv[k * 2] = (A_SCROLL[0] + a * A_SCROLL[2]) / AW; uv[k * 2 + 1] = (A_SCROLL[1] + 4 + (1 - e) * (A_SCROLL[3] - 8)) / AH; kk[k * 2] = 5; kk[k * 2 + 1] = 9; } }
      for (let i = 0; i < n - 1; i++) { const a = i * 2, b = a + 2; idx.push(a, b, b + 1, a, b + 1, a + 1); }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); sg.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage));
      sg.setAttribute('color', new THREE.BufferAttribute(cl, 3)); sg.setAttribute('aUv', new THREE.BufferAttribute(uv, 2)); sg.setAttribute('aK', new THREE.BufferAttribute(kk, 2)); sg.setIndex(idx);
      this.scroll = new THREE.Mesh(sg, armsPaint(u)); this.scroll.name = 'scroll'; this.scroll.matrixAutoUpdate = false; L.add(this.scroll);
    }

    // ------------------------------------------------------------ the dusk: the black of the panel's back, on the wall under the
    // picture and the floor at its foot; soft, and closing sooner towards the door
    {
      const du = this.du = { uInv: u.uInv, uDusk: { value: C.dusk }, uWarm: { value: col('#c9953a') }, uN: { value: new THREE.Vector4(0, 0, 0, 0) } };
      const dm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
      dm.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, du);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform mat4 uInv; uniform vec3 uDusk, uWarm; uniform vec4 uN;\nfloat jgD(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }')
          .replace('#include <opaque_fragment>', `{
  vec3 p = (uInv * vec4(lifeP, 1.0)).xyz;
  bool onFloor = p.y < 0.03;
  // (wide enough to stand behind what floats from wherever it is seen; closing sooner towards the door, and under the pictures)
  vec2 q = vec2(p.x + 0.08, (onFloor ? 0.0 : p.y) - 0.7);
  vec2 e = abs(q) / vec2(q.x > 0.0 ? 1.0 : 1.4, q.y > 0.0 ? 1.0 : 1.5);
  float dist = pow(pow(e.x, 2.6) + pow(e.y, 2.6), 1.0 / 2.6);
  float f = 1.0 - smoothstep(0.5, 1.0, dist);
  if (onFloor) f *= 1.0 - smoothstep(-0.05, 0.85, p.z);
  float A = uN.x * 0.985 * pow(f, 1.3) + (jgD(gl_FragCoord.xy) - 0.5) * 0.014;
  vec2 hq = vec2(p.x + 0.04, p.y - 0.84) * vec2(1.25, 1.45);
  float halo = exp(-dot(hq, hq) * 3.0) * (onFloor ? 0.0 : 1.0);      // (a warmth behind the scroll and the device, when the words are out)
  outgoingLight = uDusk + uWarm * (0.11 * uN.y * halo);
  diffuseColor.a = clamp(A, 0.0, 1.0);
}
#include <opaque_fragment>`);
      };
      dm.customProgramCacheKey = () => 'gros-dusk';
      // (as far along the wall as the door lets it: nothing is drawn across a doorway)
      let right = 1.5; const Rm = L.room;
      for (const d of (Rm && L.k.plan.doorsOf ? L.k.plan.doorsOf(Rm.id) : [])) for (const [x, z] of [[d.x0, d.z0], [d.x1, d.z1], [d.x0, d.z1], [d.x1, d.z0]]) { const q = L.local(x, z); if (Math.abs(q.out) < 0.7 && q.u > 0.2) right = Math.min(right, q.u - 0.01); }
      let left = 1.7; if (Rm) { const a = Math.abs(L.tx) > 0.5 ? [(Rm.x0 - L.cx) * L.tx, (Rm.x1 - L.cx) * L.tx] : [(Rm.z0 - L.cz) * L.tz, (Rm.z1 - L.cz) * L.tz]; left = Math.min(left, -Math.min(a[0], a[1]) - 0.01); }
      const pos = [], Pw = (uu, o, h) => L.floor(uu, o).setY(L.y + h), quad = (a, b, c, d) => { for (const v of [a, b, c, a, c, d]) pos.push(v.x, v.y, v.z); };
      const back = -L.wall, SK = 0.2, TOPH = Math.min(2.3, ((Rm && (Rm.ceil || Rm.h)) || 4) - 0.05);
      quad(Pw(-left, 0.95, 0.012), Pw(right, 0.95, 0.012), Pw(right, -0.004, 0.012), Pw(-left, -0.004, 0.012));              // the floor at its foot
      quad(Pw(-left, -0.004, 0.012), Pw(right, -0.004, 0.012), Pw(right, -0.004, SK), Pw(-left, -0.004, SK));                // over the skirting
      quad(Pw(-left, back + 0.005, SK), Pw(right, back + 0.005, SK), Pw(right, back + 0.005, TOPH), Pw(-left, back + 0.005, TOPH));      // the wall, flat against it (behind the canvases and the labels)
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); dg.computeVertexNormals();
      this.dusk = new THREE.Mesh(dg, dm); this.dusk.name = 'dusk'; this.dusk.renderOrder = 5; L.add(this.dusk);
    }

    // ------------------------------------------------------------ when things happen (story seconds)
    this.tJ = this.tAt(this.sJ) - 0.05; this.tG = this.tAt(this.sG) - 0.05; this.tR = this.tAt(this.sR);
    // where the tassels come from: under the frame, in the wall (design metres, as the cord's way is)
    this.from = new THREE.Vector3(TAIL[0] + 0.012, railH - DY - 0.105, -Z0 - 0.025);      // (low enough that a skirt trailing above never reaches the picture)

    // ------------------------------------------------------------ the sounds: silk, parchment, and three plain notes
    const s = this.sc = score(L), tWord = this.sWord.map(sw => this.tUnroll(sw + 0.02));
    s.hit(0.05, { d: 1.7, vol: 0.011, lp: 190, attack: 0.7 });                                                              // the dusk
    s.hit(T.fall[0], { d: 0.9, vol: 0.006, bp: 2400, q: 0.8, attack: 0.3 });                                                // two tassels, coming down
    s.hit(T.fly[0], { d: T.fly[1] - T.fly[0], vol: 0.0085, bp: 3100, q: 0.7, attack: 0.9 });                                // the cord, drawn through the air
    s.note(this.tR, 1760, 0.7, { type: 'sine', vol: 0.007, attack: 0.004 }); s.note(this.tR, 2637, 0.35, { type: 'sine', vol: 0.0028, attack: 0.004 });      // through the iron ring
    s.note(this.tR + 0.35, 146.83, 1.8, { type: 'sine', vol: 0.013, attack: 0.12 });                                        // the device, and its weight
    s.hit(T.fly[1] - 0.05, { d: 0.25, vol: 0.006, bp: 1800, q: 1, attack: 0.02 });                                           // the tassel comes to rest
    s.hit(T.unroll[0], { d: T.unroll[1] - T.unroll[0], vol: 0.012, bp: 1300, q: 0.6, attack: 0.5 });                         // the scroll unrolls
    { const r = rng(77); for (let i = 0; i < 16; i++) s.hit(lerp(T.unroll[0] + 0.1, T.unroll[1], r()), { d: 0.03 + 0.03 * r(), vol: 0.004 + 0.004 * r(), hp: 2600, attack: 0.002 }); }
    const NOTE = [[293.66, 2.3], [440, 2.2], [587.33, 3.4]];
    tWord.forEach((t, i) => { s.note(t, NOTE[i][0], NOTE[i][1], { type: 'sine', vol: 0.024, attack: 0.14, over: 2, overVol: 0.16 }); s.note(t, NOTE[i][0] * 1.002, NOTE[i][1] * 0.8, { type: 'triangle', vol: 0.006, attack: 0.2 }); });
    s.note(tWord[2] + 0.05, 146.83, 3.8, { type: 'sine', vol: 0.014, attack: 0.3 });
    s.done();

    this.hold = null; this.run = 0; this.hide();
  },

  // ---------------------------------------------------------------- the story's clock
  // How far along the cord the flying tassel is at story time t, and when it reaches s.
  head(t) { const q = ramp(t, T.fly[0], T.fly[1]); return lerp(S_HEAD0, this.CL, lerp(q, ease.smooth(q), 0.55)); },
  tAt(s) { let lo = T.fly[0], hi = T.fly[1]; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (this.head(m) < s) lo = m; else hi = m; } return lo; },
  // How far the scroll has unrolled at t, and when the roll passes s.
  unrolled(t) { const q = ramp(t, T.unroll[0], T.unroll[1]); return lerp(this.S.q0, this.S.L, lerp(q, ease.smooth(q), 0.45)); },
  tUnroll(s) { let lo = T.unroll[0], hi = T.unroll[1]; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (this.unrolled(m) < s) lo = m; else hi = m; } return lo; },

  // Everything at story time t (forwards).
  story(t, o = {}) {
    o.dusk = ease.smooth(ramp(t, T.dusk[0], T.dusk[1]));
    o.fall = ramp(t, T.fall[0], T.fall[1]); o.part = ease.smooth(ramp(t, T.part[0], T.part[1]));
    o.head = this.head(t);
    o.penJ = ramp(t, this.tJ, this.tJ + 1.05); o.penG = ramp(t, this.tG, this.tG + 1.05);
    // (each of these runs evenly from 0 to 1; it is eased where it is used, quick out of the wall and slow into place)
    o.ring = ramp(t, this.tR - 0.65, this.tR - 0.1); o.device = ramp(t, this.tR - 0.35, this.tR + 0.4);
    o.straps = ramp(t, this.tR + 0.05, this.tR + 0.65); o.shield = ramp(t, this.tR + 0.2, this.tR + 1.0);
    o.roll = ramp(t, T.roll[0], T.roll[1]); o.q = this.unrolled(t);
    o.light = ease.smooth(ramp(t, T.light[0], T.light[1]));
    return o;
  },

  hide() { this.rig.mesh.visible = false; this.scroll.visible = false; this.dusk.visible = false; },
  start(L) { this.hold = null; this.run = 0; this.at = 0; this.sc.from(0); },
  back(L) { this.hold = this.story(this.at || 0, {}); if (!L.quiet) L.k.synth.noise(1.4, { vol: 0.008, lp: 900 }); },
  end() { this.hide(); },
  reset() { this.hide(); this.hold = null; this.run = 0; this.at = 0; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return';
    if (!showing && !back) { this.hide(); return; }
    const calm = L.calm, V = this.V, rig = this.rig, I = this.I, u = this.u, S = this.S;
    const t = showing ? (this.at = L.t * (calm ? RATE_CALM : 1)) : this.at;
    if (back) this.run += dt;
    const idle = (L.t + this.run) * (calm ? 0.5 : 1);                 // what breathes
    if (showing) this.sc.play(t);
    const voice = L.voice(); voice.level = calm ? 0.6 : 1; voice.place();

    // ---- where the story has got to; and, when the look ends, the way home
    const o = this.o || (this.o = {});
    if (showing) this.story(t, o);
    else {
      const h = this.hold || this.story(t, {}), r = L.ret;
      o.q = lerp(h.q, S.q0, ease.inOut(ramp(r, 0, 0.36))); o.roll = h.roll * (1 - ease.in(ramp(r, 0.34, 0.52)));
      o.head = lerp(h.head, S_HEAD0, ease.inOut(ramp(r, 0.06, 0.66)));
      o.penJ = h.penJ * (1 - ease.smooth(ramp(r, 0.3, 0.6))); o.penG = h.penG * (1 - ease.smooth(ramp(r, 0.08, 0.36)));
      const sink = 1 - ease.in(ramp(r, 0.14, 0.44));
      o.ring = h.ring * sink; o.device = h.device * sink; o.straps = h.straps * sink; o.shield = h.shield * sink;
      o.part = h.part * (1 - ease.smooth(ramp(r, 0.64, 0.74))); o.fall = h.fall * (1 - ease.inOut(ramp(r, 0.68, 0.97)));
      o.dusk = h.dusk * (1 - ease.smooth(ramp(r, 0.45, 0.98))); o.light = h.light * (1 - ease.smooth(ramp(r, 0, 0.35)));
    }

    // ---- the whole of it floats, and breathes
    const bob = 0.005 * Math.sin(idle * 0.9), sway = 0.02 * Math.sin(idle * 0.53 + 1);
    V.m.copy(this.B).multiply(V.a.makeTranslation(0, DY + bob, Z0)).multiply(V.a.makeRotationY(sway));
    rig.mesh.visible = true; this.dusk.visible = o.dusk > 0.003;
    this.du.uN.value.set(o.dusk, o.light, 0, 0);
    u.uDk.value = o.dusk; u.uLight.value = 0.5 + 0.09 * o.light;      // (the game's film curve lifts the middle tones a long way: his colours go in darker than they are to come out as they are)
    // (a part comes forward out of the dark: out of the wall, to its place. Until then it waits in the wall, out of sight)
    const deep = Z0 + L.wall + 0.07;
    const surfaced = (id, k, extra = null) => { V.w.copy(V.m).multiply(V.a.makeTranslation(0, 0, -deep * (1 - ease.out(k)))); if (extra) V.w.multiply(extra); rig.mat(id, V.w); };

    // ---- the two tassels: down from under the frame side by side; one stays, one flies
    const C = this.cord, at = (s, into) => { const f = clamp01(s / this.CL) * C.n, i = Math.min(C.n - 1, Math.floor(f)), k = f - i; return into.set(lerp(C.pos[i * 3], C.pos[i * 3 + 3], k), lerp(C.pos[i * 3 + 1], C.pos[i * 3 + 4], k), lerp(C.pos[i * 3 + 2], C.pos[i * 3 + 5], k)); };
    const dirAt = (s, into) => { const f = clamp01(s / this.CL) * C.n, i = Math.min(C.n - 1, Math.floor(f)), k = f - i; return into.set(lerp(C.tan[i * 3], C.tan[i * 3 + 3], k), lerp(C.tan[i * 3 + 1], C.tan[i * 3 + 4], k), lerp(C.tan[i * 3 + 2], C.tan[i * 3 + 5], k)).normalize(); };
    // (stood with its skirt along d, its width in the panel's plane)
    const stand = (id, p, d, s = 1) => { V.x.copy(d).normalize(); V.z.set(0, 0, 1).addScaledVector(V.x, -V.x.z).normalize(); V.y.crossVectors(V.z, V.x); V.b.makeBasis(V.x, V.y, V.z).setPosition(p); if (s !== 1) V.b.scale(V.d.set(s, s, s)); rig.mat(id, V.w.copy(V.m).multiply(V.b)); };
    const fell = o.fall, landed = o.part;
    const drift = (lag, into) => {
      const k = ease.inOut(clamp01((fell - lag) / (1 - lag))), k2 = ease.smooth(clamp01((fell - lag) * 3.3));
      into.set(lerp(this.from.x, TAIL[0], k) + 0.022 * Math.sin(k * 7.5) * (1 - k), lerp(this.from.y, TAIL[1], k), lerp(this.from.z, 0, k2));
      return into;
    };
    {
      // the one that stays: its skirt trails above it as it comes down, then swings round to lie as he has it
      drift(0, V.p);
      const a = lerp(Math.PI / 2 + 0.25 * Math.sin(fell * 9) * (1 - fell), -0.16 + 0.05 * Math.sin(idle * 1.3), ease.outBack(landed));
      stand(I.tail, V.p, V.d.set(Math.cos(a), Math.sin(a), 0.0));
    }
    {
      // the one that flies: beside the other on the way down; then at the head of the cord, skirt first, like a brush
      const flying = o.head > S_HEAD0 + 1e-4, arrive = sstep(this.CL * 0.97, this.CL, o.head);
      if (!flying) {
        drift(0.05, V.p); V.p.x -= 0.034 * (1 - 0.6 * landed); V.p.y += 0.012 * (1 - landed);
        at(S_HEAD0, V.x); V.p.lerp(V.x, landed);
        const a = lerp(Math.PI / 2 - 0.3 * Math.sin(fell * 8 + 1) * (1 - fell), Math.PI - 0.1, ease.smooth(landed));
        stand(I.lead, V.p, V.d.set(Math.cos(a), Math.sin(a), 0));
      } else {
        at(o.head, V.p); dirAt(Math.min(this.CL, o.head + 0.012), V.d);
        V.d.y -= arrive * (0.16 - 0.05 * Math.sin(idle * 1.1 + 2));      // (at rest it droops a little and stirs)
        stand(I.lead, V.p, V.d);
      }
    }
    u.uCord.value.set(-1, o.head > S_HEAD0 + 1e-4 ? o.head - 0.004 : -2);
    rig.mat(I.cord, V.m);

    // ---- what the cord ties, each as it gets there
    surfaced(I.ring, o.ring);
    const settle = k => 0.012 * (1 - ease.out(k));      // (it comes down the last finger's width onto its ring)
    surfaced(I.device, o.device, V.b.makeTranslation(0, settle(o.device), 0));
    const hang = 0.012 * Math.sin(idle * 0.8 + 0.5);                                   // (the shield stirs on its straps)
    surfaced(I.straps, o.straps, V.b.makeTranslation(0, RING2[1], 0).multiply(V.a.makeRotationZ(hang * 0.5)).multiply(V.a.makeTranslation(0, -RING2[1], 0)));
    surfaced(I.shield, o.shield, V.b.makeTranslation(0, RING2[1] + settle(o.shield), 0).multiply(V.a.makeRotationZ(hang)).multiply(V.a.makeTranslation(0, -RING2[1], 0)));
    u.uPen.value.set(o.penJ, o.penG);
    rig.mat(I.J, V.m); rig.mat(I.G, V.m);

    // ---- the scroll
    this.scroll.visible = o.roll > 0.004;
    if (this.scroll.visible) {
      this.scroll.matrix.copy(V.m).multiply(V.a.makeTranslation(0, 0, -deep * (1 - ease.out(o.roll)))); this.scroll.matrixWorldNeedsUpdate = true;
      this.lay(o.q, idle);
    }
    if (back && L.ret >= 1) this.hide();
  },

  // The scroll at q metres unrolled: on its way up to q, wound beyond; its left end keeps the curl it was given.
  lay(q, idle) {
    const S = this.S, tab = S.tab, g = this.scroll.geometry, pos = g.attributes.position.array, nor = g.attributes.normal.array, half = SW / 2;
    const fr = this._fr || (this._fr = { p: [0, 0, 0], t: [0, 0, 0], w: [0, 0, 0], n: [0, 0, 0] });
    const frame = s => { const f = clamp01(s / S.L) * S.NT, i = Math.min(S.NT - 1, Math.floor(f)), k = f - i, a = i * 12, b = a + 12; for (let c = 0; c < 3; c++) { fr.p[c] = lerp(tab[a + c], tab[b + c], k); fr.t[c] = lerp(tab[a + 3 + c], tab[b + 3 + c], k); fr.w[c] = lerp(tab[a + 6 + c], tab[b + 6 + c], k); fr.n[c] = lerp(tab[a + 9 + c], tab[b + 9 + c], k); } return fr; };
    const put = (i, px, py, pz, w, nx, ny, nz) => { const a = i * 6; pos[a] = px - w[0] * half; pos[a + 1] = py - w[1] * half; pos[a + 2] = pz - w[2] * half; pos[a + 3] = px + w[0] * half; pos[a + 4] = py + w[1] * half; pos[a + 5] = pz + w[2] * half; nor[a] = nor[a + 3] = nx; nor[a + 1] = nor[a + 4] = ny; nor[a + 2] = nor[a + 5] = nz; };
    // the roll: an even spiral, tight while there is much of it and opening into a loose curl as the last of it goes
    const ell = S.L - q + RCURL, pitch = lerp(0.011, 0.0016, sstep(0.075, 0.3, ell)), rho = m => Math.sqrt(CORE * CORE + pitch * Math.max(0, m) / Math.PI), rOut = rho(ell);
    const F = frame(q), qp = F.p.slice(), qt = F.t.slice(), qw = F.w.slice(), qn = F.n.slice();
    const lp = 0.011, lrho = m => Math.sqrt(CORE * CORE + lp * Math.max(0, m) / Math.PI), lOut = lrho(LCURL);
    const F0 = frame(0), zp = F0.p.slice(), zt = F0.t.slice(), zw = F0.w.slice(), zn = F0.n.slice();
    for (let i = 0; i < NS; i++) {
      const s = -LCURL + i / (NS - 1) * S.LT;
      if (s < 0) {
        const a = -s, r = lrho(LCURL - a), th = TAU / lp * (lOut - r), c = Math.cos(th), sn = Math.sin(th);
        put(i, zp[0] + lOut * zn[0] + r * (-zn[0] * c - zt[0] * sn), zp[1] + lOut * zn[1] + r * (-zn[1] * c - zt[1] * sn), zp[2] + lOut * zn[2] + r * (-zn[2] * c - zt[2] * sn), zw, zn[0] * c + zt[0] * sn, zn[1] * c + zt[1] * sn, zn[2] * c + zt[2] * sn);
      } else if (s <= q) {
        const f = frame(s), wv = 0.0035 * Math.sin(s * 11 - idle * 1.2) * sstep(0, 0.1, q - s) * sstep(0, 0.06, s);      // (it breathes, where it lies open)
        put(i, f.p[0] + f.n[0] * wv, f.p[1] + f.n[1] * wv, f.p[2] + f.n[2] * wv, f.w, f.n[0], f.n[1], f.n[2]);
      } else {
        const a = s - q, r = rho(ell - a), th = TAU / pitch * (rOut - r), c = Math.cos(th), sn = Math.sin(th);
        put(i, qp[0] + rOut * qn[0] + r * (-qn[0] * c + qt[0] * sn), qp[1] + rOut * qn[1] + r * (-qn[1] * c + qt[1] * sn), qp[2] + rOut * qn[2] + r * (-qn[2] * c + qt[2] * sn), qw, qn[0] * c - qt[0] * sn, qn[1] * c - qt[1] * sn, qn[2] * c - qt[2] * sn);
      }
    }
    g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
  },
});
