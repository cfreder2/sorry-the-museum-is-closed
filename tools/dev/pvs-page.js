// The in-page half of tools/dev/pvs.mjs: makes the table src/visible.js reads (data/pvs.json). See pvs.mjs for how to run it.
//
// WHAT IS WORKED OUT. For every place a camera can be (a room; a 24 m square of the open air at one of four heights)
// the bins that can be seen from anywhere in it. A bin is a room, or a 24 m square of one storey; each has a BOX (the
// room's inside and everything filed in it; the things, or the parts of big things, in the square). A bin counts as seen
// if any part of its box is in line of sight: so the answer is right whatever stands in the box, built or not yet built,
// solid or glass, on show or switched off: none of that is looked at. Only WALLS hide: plain solid meshes, 6 m by 2 m
// or more (or, in the thickness of the building and not standing in a room, of any size over a metre: a duct's lining,
// a doorway's reveal), that were on show, stood still through everything this tool tried (the front doors shut and open, the secret
// wall, the lifts, the toy sent round the building so that what is only shown near to comes and goes, three seconds of
// watching), and were there before the park's lazy features were built. Their fingerprints go in the table, and the game
// draws everything if one is missing or moves.
//
// HOW. From sample points (a lattice through every room; a finer one across every OPENING in a room's six faces, found
// by drawing the walls square-on to each face: doorways, wells, glass, missing ceilings; a lattice over the grounds, the
// roofs and the air) the walls are drawn six ways as depth only, at four times the size they are tested at and the
// furthest depth kept (a gap is never lost), then EATEN BACK at their edges by as much as an edge could shift for a
// camera anywhere between this sample and the next (nearer walls more: up to 16 pixels, 17 degrees). Every bin's box,
// swollen by a pixel, is then tested against that: each box in a square of its own in one big picture, a bit to a box,
// so nothing can hide a box but a wall. A box the sample is inside is seen. An opening's samples count for both sides.
import * as T from 'three';
import { fixed, boxOf, sigOf, wallLike, onShow, loose, planHash, Places, CELL, BANDS, TOPS, FLOOR, CEIL, bandOf, cellKey, ceilOf, pack } from '/src/visible.js';
import { features } from '/src/features.js';

const S = 160, F = 51.2, HI = 4, RMAX = 16, TS = S / 2, NEAR = 0.03, FAR = 2500, BIG = 1e9;      // a face: 160 px across at 51.2 px to the unit of tangent (the middle 128 px are 90 degrees, the rest is overlap with its neighbours)
const wait = ms => new Promise(r => setTimeout(r, ms));
const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });

export async function makeTable(opt = {}) {
  const G = window.__ah, P = G.plan, root = G.museum.group, say = s => { document.title = 'pvs ' + s; if (opt.log) console.log('pvs ' + s); };
  if (!P.stripped) throw new Error('the shut rooms have not left the plan yet: wait for play');
  const t0 = performance.now(), stats = { ms: {} }, lap = (k, t) => { stats.ms[k] = Math.round(performance.now() - t); };
  const drawable = o => (o.isMesh || o.isLine || o.isPoints || o.isSprite) && o.geometry;
  G.museum.setLocked(false, true); G.set.guards = false;

  // ------------------------------------------------------------------ what stands still ---
  let t = performance.now();
  const snap = new Map(), moved = new Set(), flicker = new Set();
  const look = () => { root.updateMatrixWorld(true); root.traverse(o => {
    if (!drawable(o)) return;
    const e = o.matrixWorld.elements, s = snap.get(o), shown = onShow(o), p = o.geometry.attributes.position, gv = p ? (p.data || p).version : 0, iv = o.isInstancedMesh ? o.instanceMatrix.version + o.count * 1e6 : 0;
    if (!s) { snap.set(o, { e: Float64Array.from(e), shown, gv, iv }); return; }
    if (s.shown !== shown) flicker.add(o);
    if (s.gv !== gv || s.iv !== iv) moved.add(o); else for (let i = 0; i < 16; i++) if (Math.abs(e[i] - s.e[i]) > 1e-5) { moved.add(o); break; }
  }); };
  look(); const pre = new Set(snap.keys());
  const home = () => G.vehicle.place(P.spawn.x, P.spawn.z, P.spawn.yaw, 0.05);
  // the toy is sent round: what is only shown from near to (back rooms' fittings, switches, whiteboards, nests, robots) comes and goes
  const B = P.bounds, tour = [];
  for (let i = 0; i < P.rooms.length; i += opt.quick ? 60 : 9) { const r = P.rooms[i]; tour.push([(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, r.y + 0.1]); }
  for (const [u, v] of [[0.05, 0.05], [0.95, 0.05], [0.05, 0.95], [0.95, 0.95], [0.5, 0.5], [0.7, 0.3]]) tour.push([B.x0 + (B.x1 - B.x0) * u, B.z0 + (B.z1 - B.z0) * v, 0.5]);
  for (let i = 0; i < tour.length; i++) { const [x, z, y] = tour[i]; G.vehicle.place(x, z, 0, y); if (G.vehicle.vel) G.vehicle.vel.set(0, 0, 0); await frames(4); look(); if (i % 8 === 0) say(`standing still ${i}/${tour.length}`); }
  home(); await frames(4); look();
  // what opens and shuts: the front doors, the secret wall, the lifts
  G.museum.setLocked(true, true); await frames(3); look(); G.museum.setLocked(false, true); await frames(3); look();
  if (G.secret && G.secret._setOpen) { const was = !!G.secret.open; G.secret._setOpen(!was, true); await frames(3); look(); G.secret._setOpen(was, true); await frames(3); look(); }
  for (const l of P.lifts || []) { const y0 = l.y; l.y = l.stops[(l.at + 1) % l.stops.length]; await frames(3); look(); l.y = y0; await frames(2); }
  await wait(opt.quick ? 500 : 3000); look();
  // the walls: there from the start, on show throughout, never moved
  const box = new T.Box3(), walls = [], fab = new Places(P);
  root.traverse(o => { if (pre.has(o) && !moved.has(o) && !flicker.has(o) && snap.get(o).shown && drawable(o) && boxOf(o, box) && wallLike(o, box) && fab.fabric(box)) walls.push(o); });
  // everything built: the park's lazy features are woken, then back to the start
  const woke = []; for (const f of features) if ((f._pending || f._unseen) && f.lazy) { G.vehicle.place(f.lazy.x, f.lazy.z, 0, 0.5); for (let k = 0; k < 20 && (f._pending || f._unseen); k++) await wait(250); await frames(3); woke.push(f.id); }
  home(); await wait(800); look(); await wait(400); look();
  stats.things = { drawable: snap.size, moved: moved.size, comeAndGo: flicker.size, walls: walls.length, woke };
  lap('watching', t);

  // ------------------------------------------------------------------ the game stands still from here ---
  const raf = window.requestAnimationFrame, held = []; window.requestAnimationFrame = cb => { held.push(cb); return 0; };
  await wait(200);
  try {
    root.updateMatrixWorld(true);
    // ---- bins and their boxes
    t = performance.now();
    const places = new Places(P), bins = P.rooms.map(r => r.id), index = new Map(bins.map((b, i) => [b, i])), boxes = [];
    for (const r of P.rooms) { const c = ceilOf(r), m = (a, b2) => (b2 - a > 0.4 ? 0.08 : (b2 - a) / 2 - 0.01); boxes.push([r.x0 + m(r.x0, r.x1), r.y + m(r.y, c), r.z0 + m(r.z0, r.z1), r.x1 - m(r.x0, r.x1), c - m(r.y, c), r.z1 - m(r.z0, r.z1)]); }
    const binIx = name => { let i = index.get(name); if (i == null) { i = bins.length; bins.push(name); index.set(name, i); boxes.push([Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]); } return i; };
    const grow = (i, x0, y0, z0, x1, y1, z1) => { const b = boxes[i]; if (x0 < b[0]) b[0] = x0; if (y0 < b[1]) b[1] = y0; if (z0 < b[2]) b[2] = z0; if (x1 > b[3]) b[3] = x1; if (y1 > b[4]) b[4] = y1; if (z1 > b[5]) b[5] = z1; };
    // (big things are filed by their parts; the squares at the edge of the map take whatever lies beyond it)
    const CX0 = Math.floor((B.x0 - 60) / CELL), CX1 = Math.floor((B.x1 + 60) / CELL), CZ0 = Math.floor((B.z0 - 60) / CELL), CZ1 = Math.floor((B.z1 + 60) / CELL);
    const part = (set, x0, y0, z0, x1, y1, z1) => {
      const a0 = Math.max(CX0, Math.min(CX1, Math.floor(x0 / CELL))), a1 = Math.max(CX0, Math.min(CX1, Math.floor(x1 / CELL))), c0 = Math.max(CZ0, Math.min(CZ1, Math.floor(z0 / CELL))), c1 = Math.max(CZ0, Math.min(CZ1, Math.floor(z1 / CELL))), b0 = bandOf(y0), b1 = bandOf(y1);
      for (let ix = a0; ix <= a1; ix++) for (let iz = c0; iz <= c1; iz++) for (let bd = b0; bd <= b1; bd++) {
        const i = binIx(`c:${ix}:${iz}:${bd}`); set.add(i);
        grow(i, ix === CX0 ? x0 : Math.max(x0, ix * CELL), bd === 0 ? y0 : Math.max(y0, BANDS[bd - 1]), iz === CZ0 ? z0 : Math.max(z0, iz * CELL), ix === CX1 ? x1 : Math.min(x1, (ix + 1) * CELL), bd === BANDS.length ? y1 : Math.min(y1, BANDS[bd]), iz === CZ1 ? z1 : Math.min(z1, (iz + 1) * CELL));
      }
    };
    const big = {}, v = new T.Vector3(), count = { room: 0, square: 0, big: 0, bigParts: 0, notFixed: 0 };
    const bigThing = o => {
      const set = new Set(), g = o.geometry, pos = g.attributes.position, m = o.matrixWorld, n = pos.count;
      if (loose(pos) || (g.index && !g.index.array) || (o.isInstancedMesh && !g.boundingBox && loose(pos))) { part(set, box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z); count.bigParts++; return set; }      // (its vertices cannot be read: by its box, whole)
      if (o.isInstancedMesh) { if (!g.boundingBox) g.computeBoundingBox(); const im = new T.Matrix4(), bb = new T.Box3(); for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, im); im.premultiply(m); bb.copy(g.boundingBox).applyMatrix4(im); part(set, bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z); count.bigParts++; } return set; }
      const w = new Float32Array(n * 3); for (let k = 0; k < n; k++) { v.fromBufferAttribute(pos, k).applyMatrix4(m); w[k * 3] = v.x; w[k * 3 + 1] = v.y; w[k * 3 + 2] = v.z; }
      const per = o.isMesh ? 3 : o.isPoints ? 1 : 2, ix = g.index, cnt = ix ? ix.count : n, stride = o.isLine && !o.isLineSegments ? 1 : per;
      for (let k = 0; k + per <= cnt; k += stride) {
        let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
        for (let j = 0; j < per; j++) { const q = (ix ? ix.getX(k + j) : k + j) * 3, x = w[q], y = w[q + 1], z = w[q + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
        part(set, x0, y0, z0, x1, y1, z1); count.bigParts++;
      }
      return set;
    };
    root.traverse(o => {
      if (!drawable(o)) return;
      if (moved.has(o) || !fixed(o) || !boxOf(o, box)) { count.notFixed++; return; }
      const bin = places.binOf(box);
      if (bin === null) { const sg = sigOf(o, box), set = bigThing(o); big[sg] = [...new Set([...(big[sg] || []), ...set])].sort((a, b) => a - b); count.big++; }
      else { grow(binIx(bin), box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z); if (P.byId[bin]) count.room++; else count.square++; }
    });
    const NB = bins.length; stats.bins = { all: NB, rooms: P.rooms.length, squares: NB - P.rooms.length, things: count };
    lap('bins', t); say(`${NB} bins, ${walls.length} walls`);

    // ---- the walls, as triangles in the world, in pieces 32 m square so that a face draws only what is in front of it
    t = performance.now();
    const occ = [], tris = { one: [], two: [] };      // per triangle: 9 numbers
    let nt = 0;
    for (const o of walls) {
      boxOf(o, box); occ.push(sigOf(o, box));
      const g = o.geometry, pos = g.attributes.position, m = o.matrixWorld, n = pos.count, ix = g.index, cnt = ix ? ix.count : n, mat = Array.isArray(o.material) ? o.material[0] : o.material;
      const w = new Float32Array(n * 3); for (let k = 0; k < n; k++) { v.fromBufferAttribute(pos, k).applyMatrix4(m); w[k * 3] = v.x; w[k * 3 + 1] = v.y; w[k * 3 + 2] = v.z; }
      const flip = (m.determinant() < 0) !== (mat.side === T.BackSide), list = mat.side === T.DoubleSide ? tris.two : tris.one;
      const out = new Float32Array(Math.floor(cnt / 3) * 9);
      for (let k = 0, q = 0; k + 3 <= cnt; k += 3, q += 9) { const a = (ix ? ix.getX(k) : k) * 3, b = (ix ? ix.getX(k + (flip ? 2 : 1)) : k + (flip ? 2 : 1)) * 3, c = (ix ? ix.getX(k + (flip ? 1 : 2)) : k + (flip ? 1 : 2)) * 3; out[q] = w[a]; out[q + 1] = w[a + 1]; out[q + 2] = w[a + 2]; out[q + 3] = w[b]; out[q + 4] = w[b + 1]; out[q + 5] = w[b + 2]; out[q + 6] = w[c]; out[q + 7] = w[c + 1]; out[q + 8] = w[c + 2]; }
      list.push(out); nt += out.length / 9;
    }
    stats.walls = { meshes: walls.length, triangles: nt };
    // sorted into pieces
    const PIECE = 32, soup = kind => {
      const n = tris[kind].reduce((a, c) => a + c.length / 9, 0), key = new Int32Array(n), src = new Array(n); let k = 0;
      for (const a of tris[kind]) for (let q = 0; q < a.length; q += 9, k++) { const cx = (a[q] + a[q + 3] + a[q + 6]) / 3, cy = (a[q + 1] + a[q + 4] + a[q + 7]) / 3, cz = (a[q + 2] + a[q + 5] + a[q + 8]) / 3; key[k] = (Math.floor(cx / PIECE) + 64) * 65536 + (Math.floor(cz / PIECE) + 64) * 256 + bandOf(cy); src[k] = [a, q]; }
      const order = Array.from({ length: n }, (_, i) => i).sort((p, q) => key[p] - key[q]), data = new Float32Array(n * 9), pieces = [];
      let cur = null;
      order.forEach((i, at) => { const [a, q] = src[i]; data.set(a.subarray(q, q + 9), at * 9); if (!cur || cur.key !== key[i]) pieces.push(cur = { key: key[i], first: at * 3, count: 0, b: [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity] }); cur.count += 3; for (let j = 0; j < 9; j += 3) { const x = a[q + j], y = a[q + j + 1], z = a[q + j + 2], b = cur.b; if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (z < b[2]) b[2] = z; if (x > b[3]) b[3] = x; if (y > b[4]) b[4] = y; if (z > b[5]) b[5] = z; } });
      return { data, pieces, n };
    };
    const soups = { one: soup('one'), two: soup('two') };
    stats.walls.pieces = soups.one.pieces.length + soups.two.pieces.length;
    lap('walls', t);

    // ------------------------------------------------------------------ the pictures (a context of its own: the game's is not touched) ---
    t = performance.now();
    const TILES = Math.ceil(NB / 32), COLS = Math.ceil(Math.sqrt(TILES * 6) / 2.449) || 1, ROWS = Math.ceil(TILES / COLS), AW = COLS * TS, AH = 6 * ROWS * TS, BATCH = 256;
    const cv = document.createElement('canvas'); cv.width = cv.height = 16;
    const gl = cv.getContext('webgl2', { antialias: false, depth: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('needs WebGL2 with float render targets');
    if (AW > gl.getParameter(gl.MAX_TEXTURE_SIZE) || AH > gl.getParameter(gl.MAX_TEXTURE_SIZE)) throw new Error('too many bins for one picture');
    const md = gl.getExtension('WEBGL_multi_draw'), clip = gl.getExtension('WEBGL_clip_cull_distance'); window.__pvsGL = gl; stats.gl = { multiDraw: !!md, clipDistance: !!clip };
    const prog = (vs, fs) => { const p = gl.createProgram(); for (const [ty, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) { const s = gl.createShader(ty); gl.shaderSource(s, '#version 300 es\n' + (ty === gl.VERTEX_SHADER && /gl_ClipDistance/.test(src) ? '#extension GL_ANGLE_clip_cull_distance : require\n' : '') + 'precision highp float; precision highp int; precision highp sampler2D;\n' + src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + src); gl.attachShader(p, s); } gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const nm = gl.getActiveUniform(p, i).name.replace('[0]', ''); u[nm] = gl.getUniformLocation(p, nm); } return { p, u }; };
    const tex = (w, h, f32) => { const x = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, x); gl.texStorage2D(gl.TEXTURE_2D, 1, f32 === 4 ? gl.RGBA32F : f32 ? gl.R32F : gl.RGBA8, w, h); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return x; };
    const fbo = (w, h, f32, depth) => { const x = tex(w, h, f32), f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, x, 0); if (depth) { const rb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb); } if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('framebuffer'); return { f, x, w, h }; };
    const fbo2 = (w, h) => { const x = tex(w, h, 4), x1 = tex(w, h, 4), f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, x, 0); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, x1, 0); gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]); if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('framebuffer'); return { f, x, x1, w, h }; };
    const QUAD = 'void main() { gl_Position = vec4(vec2(gl_VertexID & 1, gl_VertexID >> 1) * 4.0 - 1.0, 0.0, 1.0); }';
    // the walls, as how far off they are (along the face's own line of sight), and how fast that changes across the picture (which says whether the next pixel is the same wall going on)
    const pOcc = prog('layout(location=0) in vec3 p; uniform mat4 uVP; uniform vec4 uZ; out float vz; void main() { gl_Position = uVP * vec4(p, 1.0); vz = dot(uZ, vec4(p, 1.0)); }', 'in float vz; out vec4 o; void main() { o = vec4(vz, dFdx(vz), dFdy(vz), 1.0); }');
    // a quarter the size: of each sixteen pixels the nearest wall, the furthest, and, where a wall STOPS (the pixel next to it is further off than the wall going on would be:
    // an edge, with something seen past it), how far off what is seen past it is, how many pixels that edge could shift by for a camera uK/F metres off (up to 8;
    // none, for an edge far off), and the plane of the wall that stops there (its distance as a + b across the picture)
    const pEdge = prog(QUAD, `uniform sampler2D t; uniform float uK; layout(location=0) out vec4 o; layout(location=1) out vec4 o1; const int N = ${S * HI};
      void main() { ivec2 g = ivec2(gl_FragCoord.xy); int face = g.x / ${S}; ivec2 b = ivec2(g.x - face * ${S}, g.y) * ${HI}; float lo = 1e30, hi = 0.0, far = 0.0, near = 1e30; vec3 pl = vec3(0.0);
        for (int j = 0; j < ${HI}; j++) for (int i = 0; i < ${HI}; i++) { ivec2 q = b + ivec2(i, j); vec4 c = texelFetch(t, ivec2(face * N + q.x, q.y), 0); lo = min(lo, c.r); hi = max(hi, c.r); if (c.r > 1e8) continue;
          for (int k = 0; k < 4; k++) { ivec2 d = k == 0 ? ivec2(1, 0) : k == 1 ? ivec2(-1, 0) : k == 2 ? ivec2(0, 1) : ivec2(0, -1), n = q + d; if (n.x < 0 || n.y < 0 || n.x >= N || n.y >= N) continue; vec4 m = texelFetch(t, ivec2(face * N + n.x, n.y), 0);
            if (m.r > c.r + 0.5 * dot(c.gb + (m.r > 1e8 ? c.gb : m.gb), vec2(d)) + 0.03 + 0.01 * c.r) { near = min(near, c.r); if (m.r > far) { far = m.r; pl = vec3(c.gb, c.r - dot(c.gb, vec2(q) + 0.5)); } } } }
        o = vec4(lo, hi, far, far > 0.0 ? clamp(uK / max(near, 0.02), 0.0, 8.0) : 0.0); o1 = vec4(pl, 0.0); }`);
    // half that again (the size the boxes are tested at): of each four, the nearest and furthest, and the edge that sees furthest past it
    const pHalf = prog(QUAD, `uniform sampler2D t, t1; layout(location=0) out vec4 o; layout(location=1) out vec4 o1;
      void main() { ivec2 g = ivec2(gl_FragCoord.xy) * 2; float lo = 1e30, hi = 0.0; vec4 best = vec4(0.0), pl = vec4(0.0);
        for (int k = 0; k < 4; k++) { ivec2 q = g + ivec2(k & 1, k >> 1); vec4 c = texelFetch(t, q, 0); lo = min(lo, c.r); hi = max(hi, c.g); if (c.b > best.b) { best = c; pl = texelFetch(t1, q, 0); } }
        o = vec4(lo, hi, best.b, best.a); o1 = pl; }`);
    // each edge spread over the pixels it could shift across, but only on to the wall it is the edge OF (pixels whose own distance lies on that wall's plane): so a doorway's
    // edge eats back the wall beside the doorway, and not the floor in front of it
    const pSpread = prog(QUAD, `uniform sampler2D t, t1; out vec4 o;
      void main() { ivec2 g = ivec2(gl_FragCoord.xy); int face = g.x / ${TS}; ivec2 p = ivec2(g.x - face * ${TS}, g.y); vec4 c = texelFetch(t, g, 0); float far = c.b; vec2 at = (vec2(p) + 0.5) * ${(S * HI / TS).toFixed(1)};
        for (int dy = -4; dy <= 4; dy++) for (int dx = -4; dx <= 4; dx++) { ivec2 q = p + ivec2(dx, dy); if (q.x < 0 || q.y < 0 || q.x >= ${TS} || q.y >= ${TS}) continue; vec4 s = texelFetch(t, ivec2(face * ${TS} + q.x, q.y), 0);
          if (s.b <= far || float(max(abs(dx), abs(dy))) > ceil(s.a * 0.5)) continue; vec3 pl = texelFetch(t1, ivec2(face * ${TS} + q.x, q.y), 0).xyz; float d = dot(pl.xy, at) + pl.z, slack = ${(S * HI / TS / 2).toFixed(1)} * (abs(pl.x) + abs(pl.y)) + 0.05 + 0.02 * abs(d);
          if (c.r <= d + slack && c.g >= d - slack) far = s.b; }
        o = vec4(far, 0.0, 0.0, 1.0); }`);
    // every bin's box, in its own square of the big picture (half that size again), its own bit. A pixel of a box is kept if the box is nearer there than the nearest wall,
    // or than what is seen past an edge that could shift onto it; where it lies between the nearest wall and the furthest (a wall seen slantwise, or an edge), the walls are
    // looked at pixel by pixel at their full size, the box's own distance worked out for each. So a wall hides what is behind it however slantwise it is seen, and no more.
    // A box that comes out under two and a half pixels wide or high on the picture is widened to that ON THE PICTURE (each corner pushed away from the box's middle), so
    // that the smallest, or one seen edge-on, still lands on a pixel; it is not made deeper, which would push its near side through the wall in front of it, and no
    // pixel of it is taken to be nearer than its nearest corner.
    const pBox = prog(`layout(location=0) in vec3 c; layout(location=1) in vec3 lo; layout(location=2) in vec3 hi; layout(location=3) in float id;
      uniform mat4 uVP; uniform vec4 uZ; uniform vec3 uCam; uniform float uFace; out float vz; flat out vec2 vO; flat out vec4 vBit; flat out float vNear;
      void main() { vec3 p = mix(lo, hi, c); vec4 q = uVP * vec4(p, 1.0); vz = dot(uZ, vec4(p, 1.0));
        vec2 mn = vec2(1e9), mx = vec2(-1e9); float wmin = 1e9;
        for (int k = 0; k < 8; k++) { vec4 e = uVP * vec4(mix(lo, hi, vec3(k & 1, (k >> 1) & 1, (k >> 2) & 1)), 1.0); wmin = min(wmin, e.w); vec2 n = e.xy / max(e.w, 1e-4); mn = min(mn, n); mx = max(mx, n); }
        vNear = wmin; if (wmin > 0.05) q.xy += sign(q.xy / q.w - (mn + mx) * 0.5) * max(vec2(0.0), (2.5 - (mx - mn) * ${(TS / 2).toFixed(1)}) * 0.5) * ${(2 / TS).toFixed(5)} * q.w;
        float tile = floor(id / 32.0), bit = id - tile * 32.0, tx = mod(tile, ${COLS}.0), ty = floor(tile / ${COLS}.0); vO = vec2(tx, uFace * ${ROWS}.0 + ty) * ${TS}.0;
        float ch = floor(bit / 8.0), val = exp2(bit - ch * 8.0) / 255.0; vBit = vec4(ch == 0.0 ? val : 0.0, ch == 1.0 ? val : 0.0, ch == 2.0 ? val : 0.0, ch == 3.0 ? val : 0.0);
        ${clip ? 'gl_ClipDistance[0] = q.w + q.x; gl_ClipDistance[1] = q.w - q.x; gl_ClipDistance[2] = q.w + q.y; gl_ClipDistance[3] = q.w - q.y;' : ''}
        gl_Position = vec4((q.xy * ${TS}.0 + (${TS}.0 + 2.0 * vO - vec2(${AW}.0, ${AH}.0)) * q.w) / vec2(${AW}.0, ${AH}.0), q.z, q.w); }`,
      `uniform sampler2D uE, uH, uS; uniform int uF; in float vz; flat in vec2 vO; flat in vec4 vBit; flat in float vNear; out vec4 o;
      void main() { vec2 l = gl_FragCoord.xy - vO; if (l.x < 0.0 || l.y < 0.0 || l.x >= ${TS}.0 || l.y >= ${TS}.0) discard;
        float inv = 1.0 / max(vz, 0.01), past = texelFetch(uS, ivec2(uF * ${TS} + int(l.x), int(l.y)), 0).r; vec2 gi = vec2(dFdx(inv), dFdy(inv)); ivec2 b = ivec2(l) * 2; bool see = false;
        for (int k = 0; k < 4 && !see; k++) { ivec2 d = ivec2(k & 1, k >> 1); float ik = inv + dot(gi, (vec2(d) + 0.5) * 0.5 - fract(l)), zb = max(vNear, ik > 1e-5 ? 1.0 / ik : vz); vec4 e = texelFetch(uE, ivec2(uF * ${S} + b.x + d.x, b.y + d.y), 0);
          if (zb <= max(e.r, past) * 1.002 + 0.03) { see = true; break; } if (zb > e.g * 1.002 + 0.03) continue;
          for (int j = 0; j < ${HI} && !see; j++) for (int i = 0; i < ${HI}; i++) { float iq = inv + dot(gi, (vec2(d) + (vec2(i, j) + 0.5) / ${HI}.0) * 0.5 - fract(l)), zq = max(vNear, iq > 1e-5 ? 1.0 / iq : vz); if (zq <= texelFetch(uH, ivec2(uF * ${S * HI} + (b.x + d.x) * ${HI} + i, (b.y + d.y) * ${HI} + j), 0).r * 1.002 + 0.03) { see = true; break; } } }
        if (!see) discard; o = vBit; }`);
    // each square's columns folded into one row of bits, then all six faces of each square into one point
    const pFold1 = prog(QUAD, `uniform sampler2D t; out vec4 o; void main() { ivec2 g = ivec2(gl_FragCoord.xy); uvec4 a = uvec4(0u); for (int y = 0; y < ${TS}; y++) a |= uvec4(texelFetch(t, ivec2(g.x, g.y * ${TS} + y), 0) * 255.0 + 0.5); o = vec4(a) / 255.0; }`);
    const pFold = prog(QUAD, `uniform sampler2D t; out vec4 o; void main() { int tile = int(gl_FragCoord.x), tx = tile % ${COLS}, ty = tile / ${COLS}; uvec4 a = uvec4(0u);
      for (int f = 0; f < 6; f++) for (int x = 0; x < ${TS}; x++) a |= uvec4(texelFetch(t, ivec2(tx * ${TS} + x, f * ${ROWS} + ty), 0) * 255.0 + 0.5);
      o = vec4(a) / 255.0; }`);
    const buf = (data, loc, size, div) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); if (div) gl.vertexAttribDivisor(loc, 1); return b; };
    const vaos = {}; for (const k of ['one', 'two']) { vaos[k] = gl.createVertexArray(); gl.bindVertexArray(vaos[k]); buf(soups[k].data, 0, 3); }
    // a unit cube, outward faces counter-clockwise
    const CUBE = []; { const f = [[0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0], [0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1], [0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0], [1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1], [0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1], [0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0]]; for (const q of f) for (const i of [0, 1, 2, 0, 2, 3]) CUBE.push(q[i * 3], q[i * 3 + 1], q[i * 3 + 2]); }
    const vBox = gl.createVertexArray(); gl.bindVertexArray(vBox); buf(new Float32Array(CUBE), 0, 3);
    // (the boxes as drawn: no thinner than 0.3 m any way, for a slab seen edge-on from near to)
    { const lo = new Float32Array(NB * 3), hi = new Float32Array(NB * 3), id = new Float32Array(NB); for (let i = 0; i < NB; i++) { const b = boxes[i], f = j => Math.max(0.02, 0.15 - (b[j + 3] - b[j]) / 2); lo.set([b[0] - f(0), b[1] - f(1), b[2] - f(2)], i * 3); hi.set([b[3] + f(0), b[4] + f(1), b[5] + f(2)], i * 3); id[i] = i; } buf(lo, 1, 3, 1); buf(hi, 2, 3, 1); buf(id, 3, 1, 1); }
    gl.bindVertexArray(null);
    const fHi = fbo(6 * S * HI, S * HI, 4, true), fB = fbo2(6 * S, S), fH = fbo2(6 * TS, TS), fS = fbo(6 * TS, TS, true), fA = fbo(AW, AH, false), fF = fbo(AW, 6 * ROWS, false), fR = fbo(TILES, BATCH, false), fFace = fbo(512, 512, true, true), vQuad = gl.createVertexArray();
    gl.disable(gl.DITHER); gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
    // the six ways, each a little over a right angle wide
    const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], UPS = [[0, 1, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, 1, 0]];
    const cam = new T.PerspectiveCamera(), tanH = S / 2 / F, proj = new T.Matrix4().makePerspective(-NEAR * tanH, NEAR * tanH, NEAR * tanH, -NEAR * tanH, NEAR, FAR), vp = new T.Matrix4(), VP = [], VZ = [], pl = [];
    for (let f = 0; f < 6; f++) { VP.push(new Float32Array(16)); VZ.push(new Float32Array(4)); pl.push(new Float32Array(16)); }
    const setCam = (x, y, z) => { for (let f = 0; f < 6; f++) {
      cam.position.set(x, y, z); cam.up.fromArray(UPS[f]); cam.lookAt(x + DIRS[f][0], y + DIRS[f][1], z + DIRS[f][2]); cam.updateMatrixWorld(); const e = cam.matrixWorldInverse.copy(cam.matrixWorld).invert().elements;
      vp.multiplyMatrices(proj, cam.matrixWorldInverse); VP[f].set(vp.elements); VZ[f][0] = -e[2]; VZ[f][1] = -e[6]; VZ[f][2] = -e[10]; VZ[f][3] = -e[14];
      // the four side planes, for leaving out the pieces of wall that are not in front of this face (rows of the combined matrix)
      const m = vp.elements, q = pl[f]; for (let k = 0; k < 4; k++) { const sg = k & 1 ? -1 : 1, ax = k >> 1; for (let j = 0; j < 4; j++) q[k * 4 + j] = m[3 + j * 4] + sg * m[ax + j * 4]; }
    } };
    const firsts = { one: new Int32Array(soups.one.pieces.length), two: new Int32Array(soups.two.pieces.length) }, counts = { one: new Int32Array(soups.one.pieces.length), two: new Int32Array(soups.two.pieces.length) };
    const drawWalls = (planes, uVP, uZ) => {
      gl.uniformMatrix4fv(pOcc.u.uVP, false, uVP); gl.uniform4fv(pOcc.u.uZ, uZ);
      for (const k of ['one', 'two']) {
        const ps = soups[k].pieces; let n = 0;
        for (let i = 0; i < ps.length; i++) { const b = ps[i].b; let out = false; if (planes) for (let q = 0; q < 16; q += 4) { const a = planes[q], bb = planes[q + 1], c = planes[q + 2]; if (a * (a > 0 ? b[3] : b[0]) + bb * (bb > 0 ? b[4] : b[1]) + c * (c > 0 ? b[5] : b[2]) + planes[q + 3] < 0) { out = true; break; } } if (!out) { firsts[k][n] = ps[i].first; counts[k][n++] = ps[i].count; } }
        if (!n) continue;
        gl.bindVertexArray(vaos[k]); if (k === 'one') gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
        if (md) md.multiDrawArraysWEBGL(gl.TRIANGLES, firsts[k], 0, counts[k], 0, n); else for (let i = 0; i < n; i++) gl.drawArrays(gl.TRIANGLES, firsts[k][i], counts[k][i]);
      }
    };
    lap('setting up the pictures', t);

    // ---- a picture of the walls square-on, for finding openings and how high the ground and the roofs are
    const ortho = new T.OrthographicCamera(), fpx = new Float32Array(512 * 512);
    // from `at`, looking along `dir` (`up` the picture's up), w by h metres about it, from `n` to `f` metres off: how far off the first wall is at each of cols x rows points (BIG: none)
    const square = (at, dir, up, w, h, n, f, cols, rows) => {
      ortho.left = -w / 2; ortho.right = w / 2; ortho.top = h / 2; ortho.bottom = -h / 2; ortho.near = n; ortho.far = f; ortho.updateProjectionMatrix();
      ortho.position.fromArray(at); ortho.up.fromArray(up); ortho.lookAt(at[0] + dir[0], at[1] + dir[1], at[2] + dir[2]); ortho.updateMatrixWorld(); const e = ortho.matrixWorldInverse.copy(ortho.matrixWorld).invert().elements;
      vp.multiplyMatrices(ortho.projectionMatrix, ortho.matrixWorldInverse);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fFace.f); gl.viewport(0, 0, cols, rows); gl.enable(gl.SCISSOR_TEST); gl.scissor(0, 0, cols, rows); gl.clearColor(BIG, 0, 0, 1); gl.clearDepth(1); gl.depthMask(true); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.disable(gl.SCISSOR_TEST);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.disable(gl.BLEND); gl.useProgram(pOcc.p); drawWalls(null, vp.elements, [-e[2], -e[6], -e[10], -e[14]]);
      gl.readPixels(0, 0, cols, rows, gl.RED, gl.FLOAT, fpx); return fpx;
    };

    // ------------------------------------------------------------------ where to look from ---
    t = performance.now();
    const keys = [], keyIx = new Map(), keyOf = name => { let i = keyIx.get(name); if (i == null) { i = keys.length; keys.push(name); keyIx.set(name, i); } return i; };
    for (const r of P.rooms) keyOf(r.id);
    const samples = [], tmpKeys = [], pt = new T.Vector3(), any = () => true;
    const at = (x, y, z) => { const k = places.keysAt(pt.set(x, y, z), tmpKeys, any, null); return k ? k.slice() : null; };
    const add = (x, y, z, delta, names, kind) => { if (!names.length) return; samples.push({ x, y, z, d: delta, k: [...new Set(names)].map(keyOf), kind }); };
    const nSamples = { room: 0, opening: 0, air: 0 }, links = [], open = { faces: 0, area: 0 };
    // rooms: a lattice no wider than 3 m, floor to ceiling
    const STEP = opt.step || 3;
    P.rooms.forEach((r, ri) => {
      if (opt.rooms && !opt.rooms.includes(r.id)) return;
      const c = ceilOf(r), w = r.x1 - r.x0, d = r.z1 - r.z0, h = c - r.y, nx = Math.max(1, Math.ceil(w / STEP)), nz = Math.max(1, Math.ceil(d / STEP)), ny = Math.max(2, Math.ceil(h / 1.7) + 1);
      const sx = w / nx, sz = d / nz, lo = r.y + FLOOR + 0.07, hi = c - CEIL - 0.07, sy = (hi - lo) / (ny - 1), delta = opt.dRoom || 0.5;      // (a sight line that leaves the room leaves it through an opening, and the openings have samples of their own: these are for what is in the room, and a little beyond)
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) for (let k = 0; k < ny; k++) { add(r.x0 + sx * (i + 0.5), lo + sy * k, r.z0 + sz * (j + 0.5), delta, [r.id], 'room'); nSamples.room++; }
      // its six faces, square-on from just inside: where no wall is within 0.55 m is an opening
      const FACES = [[0, r.x0, [-1, 0, 0], [0, 1, 0], d, h], [0, r.x1, [1, 0, 0], [0, 1, 0], d, h], [2, r.z0, [0, 0, -1], [0, 1, 0], w, h], [2, r.z1, [0, 0, 1], [0, 1, 0], w, h], [1, r.y, [0, -1, 0], [0, 0, 1], w, d], [1, c, [0, 1, 0], [0, 0, 1], w, d]];      // [axis, where on it, outward, the picture's up, width, height]
      FACES.forEach(([axis, where, n, up, fw, fh], fi) => {
        const cols = Math.max(1, Math.min(512, Math.round(fw / 0.25))), rows = Math.max(1, Math.min(512, Math.round(fh / 0.25))), IN = 0.06;
        const centre = [(r.x0 + r.x1) / 2, (r.y + c) / 2, (r.z0 + r.z1) / 2]; centre[axis] = where; const eye = [centre[0] - n[0] * IN, centre[1] - n[1] * IN, centre[2] - n[2] * IN];
        const m1 = Uint8Array.from(square(eye, n, up, fw, fh, 0, IN + 0.55, cols, rows).subarray(0, cols * rows), q => (q > 1e8 ? 1 : 0));
        let nOpen = 0; for (let q = 0; q < m1.length; q++) nOpen += m1[q]; if (!nOpen) return;
        const m2 = Uint8Array.from(square(eye, n, up, fw, fh, IN + 0.5, IN + 1.3, cols, rows).subarray(0, cols * rows), q => (q > 1e8 ? 1 : 0));
        const area = nOpen * (fw / cols) * (fh / rows), sp = area <= 15 ? 0.5 : area <= 150 ? 1 : 1.5, st = Math.max(1, Math.round(sp / 0.25)); open.faces++; open.area += area;
        // the picture's axes in the world (the same frame the camera above made: right = up x back)
        const back = [-n[0], -n[1], -n[2]], right = [up[1] * back[2] - up[2] * back[1], up[2] * back[0] - up[0] * back[2], up[0] * back[1] - up[1] * back[0]];
        const near1 = (i, j) => { for (let a = -1; a <= 1; a++) for (let b2 = -1; b2 <= 1; b2++) { const ii = i + a, jj = j + b2; if (ii >= 0 && jj >= 0 && ii < cols && jj < rows && m1[jj * cols + ii]) return true; } return false; };
        let lx0 = Infinity, lx1 = -Infinity, lz0 = Infinity, lz1 = -Infinity; const across = new Set();
        for (let j = Math.min(rows - 1, st >> 1); j < rows; j += st) for (let i = Math.min(cols - 1, st >> 1); i < cols; i += st) {
          if (!near1(i, j)) continue;
          const u = ((i + 0.5) / cols - 0.5) * fw, vv = ((j + 0.5) / rows - 0.5) * fh, px = centre[0] + right[0] * u + up[0] * vv, py = centre[1] + right[1] * u + up[1] * vv, pz = centre[2] + right[2] * u + up[2] * vv;
          // who is on the other side: whatever places lie up to 1.2 m beyond
          const names = [r.id]; for (const off of [0.15, 0.45, 0.8, 1.2]) { const k = at(px + n[0] * off, py + n[1] * off, pz + n[2] * off); if (k) for (const nm of k) { names.push(nm); if (fi === 5 && nm !== r.id) across.add(nm); } }
          // from just inside the face; and from beyond it, in the doorway and out the far side, where that is a place a camera can be (never from the hollow
          // between two rooms' walls or over a ceiling: walls are seen through from behind, and a sample there would see the whole building)
          const offs = [-IN]; if (m1[j * cols + i]) for (const off of m2[j * cols + i] ? [0.45, 1.15] : [0.45]) if (at(px + n[0] * off, py + n[1] * off, pz + n[2] * off)) offs.push(off);
          for (const off of offs) { add(px + n[0] * off, py + n[1] * off, pz + n[2] * off, sp * 0.71 + 0.1, names, 'opening'); nSamples.opening++; }
          if (fi === 5 && m1[j * cols + i]) { lx0 = Math.min(lx0, px - 0.4); lx1 = Math.max(lx1, px + 0.4); lz0 = Math.min(lz0, pz - 0.4); lz1 = Math.max(lz1, pz + 0.4); }
        }
        // an open top: the camera passing up through it is in both places at once (a well to the room above, a court open to the sky)
        if (fi === 5 && across.size) for (const nm of across) { const b2 = P.byId[nm]; links.push([lx0, lx1, c - CEIL - 0.001, b2 ? b2.y + FLOOR + 0.001 : r.top + 0.75, lz0, lz1, r.id, b2 ? nm : '*'].map(q => (typeof q === 'number' ? +q.toFixed(3) : q))); }
      });
      if (ri % 20 === 0) say(`looking for openings ${ri}/${P.rooms.length}`);
    });
    // the open air: how high the topmost wall is at every metre (ground, or a roof), and a lattice over it at each height
    const AX0 = (Math.floor((B.x0 - 40) / CELL)) * CELL, AX1 = (Math.floor((B.x1 + 40) / CELL) + 1) * CELL, AZ0 = (Math.floor((B.z0 - 40) / CELL)) * CELL, AZ1 = (Math.floor((B.z1 + 40) / CELL) + 1) * CELL;
    const HM = { w: AX1 - AX0, h: AZ1 - AZ0, d: null }; { HM.d = new Float32Array(HM.w * HM.h); const TW = 256; for (let bx = 0; bx < HM.w; bx += TW) for (let bz = 0; bz < HM.h; bz += TW) { const cw = Math.min(TW, HM.w - bx), ch = Math.min(TW, HM.h - bz), px = square([AX0 + bx + cw / 2, 300, AZ0 + bz + ch / 2], [0, -1, 0], [0, 0, -1], cw, ch, 0, 400, cw, ch); for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) HM.d[(bz + (ch - 1 - j)) * HM.w + bx + i] = 300 - Math.min(px[j * cw + i], 320); } }
    const topAt = (x, z) => { const i = Math.floor(x - AX0), j = Math.floor(z - AZ0); return i < 0 || j < 0 || i >= HM.w || j >= HM.h ? 0 : HM.d[j * HM.w + i]; };
    const air = (x, y, z, hx, hy) => { const k = at(x, y, z); if (!k || !k.every(nm => nm.startsWith('o:'))) return; const names = k.slice(); const hh = hx + 0.01; for (const [dx, dy, dz] of [[hh, 0, 0], [-hh, 0, 0], [0, 0, hh], [0, 0, -hh], [hh, 0, hh], [-hh, 0, hh], [hh, 0, -hh], [-hh, 0, -hh], [0, hy, 0], [0, -hy, 0]]) { const q = cellKey(x + dx, z + dz, y + dy); if (q) names.push(q); } add(x, y, z, hx <= 3 ? (opt.dAir || 1.5) : (opt.dAir || 1.5) * 1.7, names, 'air'); nSamples.air++; };      // (a camera in the open has samples all round it, and what one block hides from all of them it hides from the camera: so the walls need eating back only a little)
    if (!opt.rooms) for (let x = AX0 + 3; x < AX1; x += 6) for (let z = AZ0 + 3; z < AZ1; z += 6) {
      const top = topAt(x, z), xin = x > B.x0 - 30 && x < B.x1 + 30 && z > B.z0 - 30 && z < B.z1 + 30;
      for (const h of [0.35, 2, 4.4]) air(x, top + h, z, 3, 1.2);                                    // over whatever is topmost here: the ground, or a roof
      if (top > 1.5) for (const h of [0.35, 2, 4.4]) air(x, h, z, 3, 1.2);                          // and at street level beside or under it, where that is open air
      if (xin && (Math.round((x - AX0 - 3) / 6) & 1) === 0 && (Math.round((z - AZ0 - 3) / 6) & 1) === 0) for (const y of [8, 11.5, 16, 22, 30, 42]) if (y > top + 5) air(x + 3, y, z + 3, 6, 3);      // the air above, more thinly
    }
    stats.samples = { ...nSamples, all: samples.length }; stats.openings = { faces: open.faces, squareMetres: Math.round(open.area), links: links.length }; stats.places = keys.length;
    lap('choosing where to look from', t); say(`${samples.length} sample points, ${keys.length} places`);
    if (opt.dry) return { stats };

    // ------------------------------------------------------------------ looking ---
    t = performance.now();
    const NK = keys.length, WORDS = TILES, seen = Array.from({ length: NK }, () => new Uint32Array(WORDS)), rpx = new Uint8Array(TILES * BATCH * 4), r32 = new Uint32Array(rpx.buffer);
    const flush = (first, n) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fR.f); gl.readPixels(0, 0, TILES, n, gl.RGBA, gl.UNSIGNED_BYTE, rpx);
      for (let j = 0; j < n; j++) { const s = samples[first + j], row = j * TILES;
        // (and the boxes it is inside of, which have no near side to draw)
        for (let i = 0, q = 0; i < NB; i++, q++) { const b = boxes[i], sw = 0.2; if (s.x > b[0] - sw && s.x < b[3] + sw && s.y > b[1] - sw && s.y < b[4] + sw && s.z > b[2] - sw && s.z < b[5] + sw) r32[row + (i >> 5)] |= 1 << (i & 31); }
        for (const k of s.k) { const dst = seen[k]; for (let w2 = 0; w2 < WORDS; w2++) dst[w2] |= r32[row + w2]; } }
    };
    const order = samples.map((_, i) => i); if (opt.limit) order.length = Math.min(order.length, opt.limit);
    let batchFirst = 0, tick = performance.now();
    const lookFrom = (s, row) => {
      setCam(s.x, s.y, s.z);
      // the walls, six ways, big
      gl.bindFramebuffer(gl.FRAMEBUFFER, fHi.f); gl.viewport(0, 0, fHi.w, fHi.h); gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true); gl.clearColor(BIG, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(pOcc.p); for (let f = 0; f < 6; f++) { gl.viewport(f * S * HI, 0, S * HI, S * HI); drawWalls(pl[f], VP[f], VZ[f]); }
      // a quarter the size, with the edges found; half that; the edges spread
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.bindVertexArray(vQuad);
      gl.useProgram(pEdge.p); gl.uniform1i(pEdge.u.t, 0); gl.uniform1f(pEdge.u.uK, F * s.d * (opt.spread == null ? 1 : opt.spread)); gl.bindFramebuffer(gl.FRAMEBUFFER, fB.f); gl.viewport(0, 0, fB.w, fB.h); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fHi.x); gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.useProgram(pHalf.p); gl.uniform1i(pHalf.u.t, 0); gl.uniform1i(pHalf.u.t1, 1); gl.bindFramebuffer(gl.FRAMEBUFFER, fH.f); gl.viewport(0, 0, fH.w, fH.h); gl.bindTexture(gl.TEXTURE_2D, fB.x); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, fB.x1); gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.useProgram(pSpread.p); gl.uniform1i(pSpread.u.t, 0); gl.uniform1i(pSpread.u.t1, 1); gl.bindFramebuffer(gl.FRAMEBUFFER, fS.f); gl.bindTexture(gl.TEXTURE_2D, fH.x1); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fH.x); gl.drawArrays(gl.TRIANGLES, 0, 3);
      // the boxes
      gl.bindFramebuffer(gl.FRAMEBUFFER, fA.f); gl.viewport(0, 0, AW, AH); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      if (clip) for (let q = 0; q < 4; q++) gl.enable(clip.CLIP_DISTANCE0_WEBGL + q);
      gl.useProgram(pBox.p); gl.bindVertexArray(vBox); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, fS.x); gl.uniform1i(pBox.u.uS, 2); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, fHi.x); gl.uniform1i(pBox.u.uH, 1); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fB.x); gl.uniform1i(pBox.u.uE, 0); gl.uniform3f(pBox.u.uCam, s.x, s.y, s.z);
      for (let f = 0; f < 6; f++) { gl.uniformMatrix4fv(pBox.u.uVP, false, VP[f]); gl.uniform4fv(pBox.u.uZ, VZ[f]); gl.uniform1f(pBox.u.uFace, f); gl.uniform1i(pBox.u.uF, f); gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, NB); }
      if (clip) for (let q = 0; q < 4; q++) gl.disable(clip.CLIP_DISTANCE0_WEBGL + q);
      // folded into this sample's row
      gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE); gl.bindVertexArray(vQuad); gl.useProgram(pFold1.p); gl.bindFramebuffer(gl.FRAMEBUFFER, fF.f); gl.viewport(0, 0, fF.w, fF.h); gl.bindTexture(gl.TEXTURE_2D, fA.x); gl.uniform1i(pFold1.u.t, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.useProgram(pFold.p); gl.bindFramebuffer(gl.FRAMEBUFFER, fR.f); gl.viewport(0, row, TILES, 1); gl.enable(gl.SCISSOR_TEST); gl.scissor(0, row, TILES, 1);
      gl.bindTexture(gl.TEXTURE_2D, fF.x); gl.uniform1i(pFold.u.t, 0); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.disable(gl.SCISSOR_TEST);
    };
    // (to look into one sample by hand: what it saw, the walls' depths as it had them, eaten back, six faces side by side)
    if (opt.debug) window.__pvs = { samples, boxes, bins, keys, walls, at, probe: (x, y, z, d) => { lookFrom({ x, y, z, d }, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, fR.f); gl.readPixels(0, 0, TILES, 1, gl.RGBA, gl.UNSIGNED_BYTE, rpx); const seenBins = []; for (let i = 0; i < NB; i++) if ((r32[i >> 5] >>> (i & 31)) & 1) seenBins.push(i); const raw = new Float32Array(6 * S * S * 4), e = new Float32Array(6 * S * S), e0 = new Float32Array(6 * S * S); const sp = new Float32Array(6 * TS * TS); gl.bindFramebuffer(gl.FRAMEBUFFER, fB.f); gl.readPixels(0, 0, 6 * S, S, gl.RGBA, gl.FLOAT, raw); gl.bindFramebuffer(gl.FRAMEBUFFER, fS.f); gl.readPixels(0, 0, 6 * TS, TS, gl.RED, gl.FLOAT, sp); for (let q = 0; q < e.length; q++) { e0[q] = raw[q * 4]; e[q] = Math.max(raw[q * 4], sp[Math.floor(Math.floor(q / (6 * S)) / 2) * 6 * TS + Math.floor((q % (6 * S)) / 2)]); } return { seen: seenBins, eaten: e, plain: e0, w: 6 * S, h: S }; },
      // (and where on the six faces one bin's box was let through: per face, how many of its pixels, the first of them, and how far off the eaten-back wall is there)
      where: i => { const tile = i >> 5, bitv = i & 31, tx = tile % COLS, ty = Math.floor(tile / COLS), t8 = new Uint8Array(TS * TS * 4), e2 = new Float32Array(S * S * 4), s2 = new Float32Array(TS * TS), out = []; for (let f = 0; f < 6; f++) { gl.bindFramebuffer(gl.FRAMEBUFFER, fA.f); gl.readPixels(tx * TS, (f * ROWS + ty) * TS, TS, TS, gl.RGBA, gl.UNSIGNED_BYTE, t8); gl.bindFramebuffer(gl.FRAMEBUFFER, fB.f); gl.readPixels(f * S, 0, S, S, gl.RGBA, gl.FLOAT, e2); gl.bindFramebuffer(gl.FRAMEBUFFER, fS.f); gl.readPixels(f * TS, 0, TS, TS, gl.RED, gl.FLOAT, s2); let n = 0, first = null; for (let q = 0; q < TS * TS; q++) if ((t8[q * 4 + (bitv >> 3)] >> (bitv & 7)) & 1) { n++; if (!first) { const bq = ((Math.floor(q / TS) * 2) * S + (q % TS) * 2) * 4; first = [q % TS, Math.floor(q / TS), 'nearest ' + e2[bq].toFixed(1) + ' furthest ' + e2[bq + 1].toFixed(1) + ' past an edge ' + s2[q].toFixed(1)]; } } out.push([n, first]); } return out; } };
    for (let si = 0; si < order.length; si++) {
      lookFrom(samples[si], si - batchFirst);
      if (si - batchFirst + 1 === BATCH || si === order.length - 1) { flush(batchFirst, si - batchFirst + 1); batchFirst = si + 1; if (performance.now() - tick > 1500) { tick = performance.now(); say(`looking ${si + 1}/${order.length}, ${Math.round((performance.now() - t) / (si + 1) * (order.length - si - 1) / 1000)} s to go`); await wait(0); } }
    }
    lap('looking', t);

    // ------------------------------------------------------------------ the table ---
    const bit = (a, i) => (a[i >> 5] >>> (i & 31)) & 1, set1 = (a, i) => { a[i >> 5] |= 1 << (i & 31); };
    // a room sees itself and the rooms its doorways lead to; and what one room sees of another, the other sees of it
    P.rooms.forEach((r, i) => set1(seen[i], i));
    for (const d of places.doors) { const a = index.get(d.a), b = index.get(d.b); if (a != null && b != null && a < P.rooms.length && b < P.rooms.length) { set1(seen[a], b); set1(seen[b], a); } }
    for (let a = 0; a < P.rooms.length; a++) for (let b = 0; b < P.rooms.length; b++) if (bit(seen[a], b)) set1(seen[b], a);
    const used = keys.map(() => false); for (const s of (opt.limit ? samples.slice(0, opt.limit) : samples)) for (const k of s.k) used[k] = true;
    const sets = [], setIx = new Map(), of = {}, sizes = [];
    keys.forEach((name, k) => { if (!used[k]) return; const bits = new Uint8Array(NB); let n = 0; for (let i = 0; i < NB; i++) if (bit(seen[k], i)) { bits[i] = 1; n++; } const p = pack(bits); let i = setIx.get(p); if (i == null) { i = sets.length; sets.push(p); setIx.set(p, i); } of[name] = i; sizes.push(n); });
    sizes.sort((a, b) => a - b);
    stats.seen = { places: sizes.length, lists: sets.length, least: sizes[0], median: sizes[sizes.length >> 1], most: sizes[sizes.length - 1], ofBins: NB };
    stats.ms.all = Math.round(performance.now() - t0);
    const pvs = { v: 3, made: P.made, rooms: P.rooms.length, plan: planHash(P), cell: CELL, when: new Date().toISOString().slice(0, 16), how: { step: STEP, face: S, f: F, rmax: RMAX, samples: samples.length },
      occ: [...new Set(occ)].sort(), bins, box: boxes.flat().map(q => (isFinite(q) ? Math.round(q * 100) / 100 : 0)), big, links, of, sets };
    // (the boxes are rounded outwards, so that what was inside still is)
    for (let i = 0; i < NB; i++) for (let j = 0; j < 6; j++) { const q = boxes[i][j]; pvs.box[i * 6 + j] = isFinite(q) ? (j < 3 ? Math.floor(q * 100) : Math.ceil(q * 100)) / 100 : 0; }
    return { pvs, stats };
  } finally {
    try { const c = document.title; if (window.__pvsGL && !opt.debug) window.__pvsGL.getExtension('WEBGL_lose_context').loseContext(); document.title = c; } catch {}
    window.requestAnimationFrame = raf; for (const cb of held) raf(cb);
  }
}
