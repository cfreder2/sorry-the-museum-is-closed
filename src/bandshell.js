// The band shell on Butler Field, and Snow Ball, the dance game on its stage (features.js).
//
// The shell: five arches nested one in front of another, each wider and taller than the one behind, so that it opens
// out towards the lawn like a horn. Inside they are acoustic panels in squares, washed with colour from cans on the
// deck; the step between one arch and the next is a rib with a line of light along it. Outside they are painted steel
// with the snow lying on their crowns and hanging off the front arch in icicles. A deck of dark boards with light along
// its edges, a ramp up the middle of the front with steps either side, a truss on two towers with six moving heads under
// it, two speaker stacks on the snow with a searchlight on each, a big screen on the back wall. Where all of it stands,
// and what is solid, is plan.js's (shellPlan, shellSolids); this draws it from the same numbers.
//
// Snow Ball: drive up onto the four-panel pad in the middle of the stage and press E. Arrows rise up the screen in time
// with the music and are stepped when they reach the line at the top: arrow keys or WASD, the stick's four ways, a pad's
// d-pad, or the arrows on the glass. PERFECT, GREAT, GOOD, MISS; a combo, a score and a grade. The music is
// snowballsongs.js's: the steps are its tunes' own notes. Everything is timed on the audio clock, the arrows and the
// judging alike, not on frames.
//
// The light show keeps time with whatever is playing, and idles gently when nothing is: the moving heads sweep, the
// arches and the edges chase, the panels are washed, pools of colour lie on the snow. With reduced motion it is slow and
// nothing strobes. Nothing is done per frame while the toy is far off and no song is playing.
import * as THREE from 'three';
import { feature, tonight } from './features.js';
import { shellArch } from './plan.js';
import { TAU } from './glowkit.js';
import { DANCES, LEVELS, arrange, chart, Band } from './snowballsongs.js';

const WIN = { PERFECT: 0.045, GREAT: 0.09, GOOD: 0.135, REACH: 0.2 };          // seconds either side of the note
const JUDGE = [['PERFECT', 1, '#ffe27a'], ['GREAT', 0.7, '#7dffa8'], ['GOOD', 0.35, '#7cc4ff'], ['MISS', 0, '#ff6b6b']];
const LANE_COL = [[1.7, 0.5, 2.7], [0.3, 1.9, 2.7], [0.5, 2.6, 0.7], [2.8, 0.45, 1.1]];      // left violet, down ice, up green, right rose
const LANE_CSS = ['#c58cff', '#6fe0ff', '#7dff8a', '#ff7aa8'];
const DIRS = [[1, 0], [0, -1], [0, 1], [-1, 0]];      // each panel from the middle of the pad, in world x and z: facing the screen (south), left is east
const KEYS = { ArrowLeft: 0, KeyA: 0, ArrowDown: 1, KeyS: 1, ArrowUp: 2, KeyW: 2, ArrowRight: 3, KeyD: 3 };
const MILESTONES = [25, 50, 100, 150, 200];
const IDLE_PAL = [[0.3, 0.75, 2.6], [1.5, 0.45, 2.5], [0.45, 2.0, 2.3]];
const GRADES = [['S', 0.95, '#ffe27a'], ['A', 0.85, '#7dffa8'], ['B', 0.7, '#7cc4ff'], ['C', 0.5, '#c9b8ff'], ['D', 0, '#ff8a8a']];
const FONT = '"Avenir Next", "Futura", "Trebuchet MS", system-ui, sans-serif';
const SCREEN = { w: 8, h: 4.5, recY: 1.45 };
const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const store = { get(k) { try { return JSON.parse(localStorage.getItem('ah.snowball.' + k)); } catch { return null; } }, set(k, v) { try { localStorage.setItem('ah.snowball.' + k, JSON.stringify(v)); } catch { /* private window */ } } };

const PAL = `vec3 pal(float x) { x = fract(x) * 3.0; float f = fract(x); vec3 a = x < 1.0 ? uPal[0] : x < 2.0 ? uPal[1] : uPal[2]; vec3 b = x < 1.0 ? uPal[1] : x < 2.0 ? uPal[2] : uPal[0]; return mix(a, b, smoothstep(0.0, 1.0, f)); }\n`;

// ---------------------------------------------------------------- geometry
// Smooth-shaded pieces with a colour at every corner.
class Mesher {
  constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; this.ix = []; }
  v(x, y, z, nx, ny, nz, u, w, col) { this.p.push(x, y, z); this.n.push(nx, ny, nz); this.uv.push(u, w); this.c.push(col[0], col[1], col[2]); return this.p.length / 3 - 1; }
  // four corners round, turned to face the way the first corner's normal does
  q(a, b, c, d) {
    const P = this.p, N = this.n, ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
    const ux = P[b * 3] - ax, uy = P[b * 3 + 1] - ay, uz = P[b * 3 + 2] - az, vx = P[d * 3] - ax, vy = P[d * 3 + 1] - ay, vz = P[d * 3 + 2] - az;
    let cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (Math.abs(cx) + Math.abs(cy) + Math.abs(cz) < 1e-9) { const wx = P[c * 3] - ax, wy = P[c * 3 + 1] - ay, wz = P[c * 3 + 2] - az; cx = uy * wz - uz * wy; cy = uz * wx - ux * wz; cz = ux * wy - uy * wx; if (Math.abs(cx) + Math.abs(cy) + Math.abs(cz) < 1e-9) { const ox = P[c * 3] - P[b * 3], oy = P[c * 3 + 1] - P[b * 3 + 1], oz = P[c * 3 + 2] - P[b * 3 + 2]; cx = oy * vz - oz * vy; cy = oz * vx - ox * vz; cz = ox * vy - oy * vx; } }
    if (cx * N[a * 3] + cy * N[a * 3 + 1] + cz * N[a * 3 + 2] >= 0) this.ix.push(a, b, c, a, c, d); else this.ix.push(a, c, b, a, d, c);
  }
  t(a, b, c) {
    const P = this.p, N = this.n, ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
    const ux = P[b * 3] - ax, uy = P[b * 3 + 1] - ay, uz = P[b * 3 + 2] - az, vx = P[c * 3] - ax, vy = P[c * 3 + 1] - ay, vz = P[c * 3 + 2] - az;
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (cx * N[a * 3] + cy * N[a * 3 + 1] + cz * N[a * 3 + 2] >= 0) this.ix.push(a, b, c); else this.ix.push(a, c, b);
  }
  box(x0, x1, y0, y1, z0, z1, col, s = 1) {
    const F = [[[0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], x1 - x0, y1 - y0], [[0, 0, -1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], x1 - x0, y1 - y0],
      [[1, 0, 0], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], z1 - z0, y1 - y0], [[-1, 0, 0], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], z1 - z0, y1 - y0],
      [[0, 1, 0], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], x1 - x0, z1 - z0], [[0, -1, 0], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], x1 - x0, z1 - z0]];
    for (const [n, c, a, b] of F) { const uv = [[0, 0], [a / s, 0], [a / s, b / s], [0, b / s]], ids = c.map((p, i) => this.v(p[0], p[1], p[2], n[0], n[1], n[2], uv[i][0], uv[i][1], typeof col === 'function' ? col(n) : col)); this.q(...ids); }
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setIndex(this.ix);
    return g;
  }
  mesh(mat) { const m = new THREE.Mesh(this.geo(), mat); m.matrixAutoUpdate = false; m.updateMatrix(); return m; }
}
// Lines of light: ribbons carrying (where along, which group, a number of their own) for the LED shader.
class Strips {
  constructor() { this.p = []; this.a = []; this.ix = []; }
  // pts: [[x,y,z]...]; across: [ax,ay,az] the ribbon's width (or a function of the point's index)
  line(pts, across, g, k, us) {
    let base = this.p.length / 3;
    pts.forEach((p, i) => { const a = typeof across === 'function' ? across(i) : across, u = us ? us[i] : i / (pts.length - 1); this.p.push(p[0], p[1], p[2], p[0] + a[0], p[1] + a[1], p[2] + a[2]); this.a.push(u, g, k, u, g, k); });
    for (let i = 0; i < pts.length - 1; i++) { const a = base + i * 2; this.ix.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  }
  ring(cx, cy, z, r, w, g, k, n = 28) { const pts = [], ac = []; for (let i = 0; i <= n; i++) { const t = i / n * TAU; pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r, z]); ac.push([Math.cos(t) * w, Math.sin(t) * w, 0]); } this.line(pts, i => ac[i], g, k); }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(this.a, 3)); g.setIndex(this.ix); return g; }
}
const tex = (w, h, draw, srgb = true, rep = true) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
const rnd = seed => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

// The arrow the game draws everywhere: filled in red, outlined in green (the shaders colour it).
function glyphTex() {
  return tex(128, 128, (c, w) => {
    c.clearRect(0, 0, w, w); const P = [[64, 10], [116, 62], [84, 62], [84, 116], [44, 116], [44, 62], [12, 62]];
    c.beginPath(); P.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.lineJoin = 'round';
    c.fillStyle = '#f00'; c.fill(); c.strokeStyle = '#0f0'; c.lineWidth = 9; c.stroke();
  }, false, false);
}

// ---------------------------------------------------------------- the feature
feature({
  id: 'bandshell',
  lazy: { x: 316, z: 212, r: 150 },      // built the first time the toy comes this near (features.js), not at start-up
  secrets: [['snowball', 'Snow Ball: a full combo'], ['snowstar', 'Snow Ball: an S on HARD']],
  // (A generator: each yield is a place the building of it can stop until the next frame. features.js, `begin`.)
  *init(k) {
    const L = k.plan.lakefront; if (!L || !L.shell || !L.shell.rings) return;
    k.G.snowball = this;      // (a test aid)
    this.k = k; this.sh = L.shell; this.t = 0; this.mode = 'idle'; this.sel = { song: 0, level: 0 }; this.lvl = 0; this.burst = 0; this.far = 999;
    const g = this.g = new THREE.Group(); g.name = 'bandshell'; g.visible = false; k.group.add(g);      // (hidden until it all stands: features.js builds it a part at a time, and k.ready shows it)
    const pal = IDLE_PAL.map(c => new THREE.Vector3(...c));
    this.U = { uT: { value: 0 }, uKick: { value: 0 }, uLevel: { value: 0 }, uCalm: { value: 0 }, uFlash: { value: 0 }, uRing: { value: 0 }, uPal: { value: pal } };
    this.glyph = glyphTex();
    this.arr = DANCES.map(arrange); yield;
    this._venue(k); yield; this._rig(k); yield; this._screen(k); yield; this._pad(k); yield;
    this.puffs = k.puffs(420, { size: 0.15 });
    this.band = new Band();
    this.padLit = [0, 0, 0, 0]; this.recep = [0, 0, 0, 0]; this.held = new Set(); this.stickWas = -1; this.padWas = {};
    this._drawIdle();
    addEventListener('keydown', e => this._key(e, true), true);
    addEventListener('keyup', e => this._key(e, false), true);
    yield* k.ready(g);
  },

  // ============================================================ the shell
  _venue(k) {
    const sh = this.sh, h = sh.h, cx = sh.cx, g = this.g, U = this.U, S = 64, r0 = rnd(7);
    const PANEL = [0.9, 0.92, 0.96], RIB = [0.36, 0.4, 0.5], BACK = [0.16, 0.17, 0.21], PAINT = [0.62, 0.64, 0.68], SNOW = [1.0, 1.0, 1.0], FRAME = [0.4, 0.44, 0.52];
    // An arch as a line of points, its feet run down to the ground (inside the deck that is hidden).
    const prof = (r, out) => { const pts = []; for (let j = 0; j <= S; j++) pts.push(shellArch(sh, r, j / S, out)); pts.unshift([pts[0][0], -h]); pts.push([pts[pts.length - 1][0], -h]); return pts; };
    const norms = pts => pts.map((p, j) => { const a = pts[Math.max(0, j - 1)], b = pts[Math.min(pts.length - 1, j + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1; return [ty / l, -tx / l]; });      // pointing inwards
    const inner = new Mesher(), outer = new Mesher();
    const ribbon = (m, pts, z0, z1, sgn, col) => {
      const N = norms(pts), rows = []; let arc = 0;
      pts.forEach(([x, y], j) => { if (j) arc += Math.hypot(x - pts[j - 1][0], y - pts[j - 1][1]); const nx = N[j][0] * sgn, ny = N[j][1] * sgn, c = typeof col === 'function' ? col(nx, ny) : col; rows.push([m.v(x, h + y, z0, nx, ny, 0, arc / 2.4, z0 / 2.4, c), m.v(x, h + y, z1, nx, ny, 0, arc / 2.4, z1 / 2.4, c)]); });
      for (let j = 0; j < rows.length - 1; j++) m.q(rows[j][0], rows[j][1], rows[j + 1][1], rows[j + 1][0]);
    };
    const annulus = (m, A, B, z, nz, col) => {
      const ids = A.map((a, j) => [m.v(a[0], h + a[1], z, 0, 0, nz, a[0] / 2.4, a[1] / 2.4, col), m.v(B[j][0], h + B[j][1], z, 0, 0, nz, B[j][0] / 2.4, B[j][1] / 2.4, col)]);
      for (let j = 0; j < ids.length - 1; j++) m.q(ids[j][0], ids[j + 1][0], ids[j + 1][1], ids[j][1]);
    };
    const fill = (m, pts, z, nz, col) => { const c0 = m.v(cx, 0, z, 0, 0, nz, cx / 2.4, 0, col), ids = pts.map(p => m.v(p[0], h + p[1], z, 0, 0, nz, p[0] / 2.4, p[1] / 2.4, col)); for (let j = 0; j < ids.length - 1; j++) m.t(c0, ids[j], ids[j + 1]); };
    const snowy = (nx, ny) => (ny > 0.42 ? SNOW : PAINT);
    const R = sh.rings, P = R.map(r => prof(r, 0)), Q = R.map(r => prof(r, sh.t));
    for (const r of R) {
      ribbon(inner, P[r.i], r.zf, r.zb, 1, PANEL);
      ribbon(outer, Q[r.i], r.zf, r.zb, -1, snowy);
      if (r.i < R.length - 1) { annulus(inner, P[r.i], P[r.i + 1], r.zf, -1, RIB); annulus(outer, Q[r.i], Q[r.i + 1], r.zf, 1, PAINT); }
    }
    // the front arch's frame, standing proud of it all round; the back wall, inside and out
    { const r = R[R.length - 1], F = prof(r, 0.9), z = r.zf, zb = z + 0.5;
      annulus(outer, P[r.i], F, z, -1, FRAME); annulus(outer, Q[r.i], F, zb, 1, PAINT); ribbon(outer, F, z, zb, -1, snowy); this.frameP = F; }
    fill(inner, P[0], sh.z1, -1, BACK); fill(outer, Q[0], sh.z1 + 0.3, 1, PAINT); ribbon(outer, Q[0], sh.z1, sh.z1 + 0.3, -1, snowy);
    // The panels inside: squares with a seam round each and a fine perforation, a little uneven in tone.
    const panelT = tex(256, 256, (c, w) => {
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const v = 222 + Math.floor(r0() * 22); c.fillStyle = `rgb(${v},${v + 2},${v + 6})`; c.fillRect(i * 128, j * 128, 128, 128); }
      c.fillStyle = 'rgba(40,46,60,0.28)'; for (let y = 10; y < w; y += 9) for (let x = 10; x < w; x += 9) if ((x % 128) > 8 && (x % 128) < 120 && (y % 128) > 8 && (y % 128) < 120) c.fillRect(x, y, 1.6, 1.6);
      c.strokeStyle = 'rgba(30,34,46,0.85)'; c.lineWidth = 4; for (const s of [0, 128, 256]) { c.beginPath(); c.moveTo(s, 0); c.lineTo(s, w); c.stroke(); c.beginPath(); c.moveTo(0, s); c.lineTo(w, s); c.stroke(); }
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.5; for (const s of [3, 131]) { c.beginPath(); c.moveTo(s, 0); c.lineTo(s, w); c.stroke(); c.beginPath(); c.moveTo(0, s); c.lineTo(w, s); c.stroke(); }
    });
    // The washes: the inside of the shell glows with the colour of the cans on the deck, brightest low down, with rays of it
    // turning slowly up the panels, and keeps the beat.
    const wash = new THREE.MeshStandardMaterial({ map: panelT, vertexColors: true, roughness: 0.82, emissive: 0x0e1018 });
    wash.onBeforeCompile = s => {
      Object.assign(s.uniforms, { uT: U.uT, uKick: U.uKick, uLevel: U.uLevel, uCalm: U.uCalm, uFlash: U.uFlash, uPal: U.uPal, uCx: { value: cx }, uDeck: { value: h } });
      s.vertexShader = 'varying vec3 vWp;\n' + s.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      s.fragmentShader = 'uniform float uT, uKick, uLevel, uCalm, uFlash, uCx, uDeck; uniform vec3 uPal[3]; varying vec3 vWp;\n' + PAL + s.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { float X = (vWp.x - uCx) / 14.0, Y = max(0.0, vWp.y - uDeck) / 9.0, live = uLevel * (1.0 - 0.7 * uCalm);
          vec3 wa = pal(0.5 + X * 0.45 + uT * 0.012);
          float up = 0.22 + 0.75 * exp(-Y * 2.4);
          float ang = atan(X, Y + 0.08);
          float rays = pow(0.5 + 0.5 * cos(ang * 9.0 - uT * mix(0.2, 1.4, live)), 10.0) * (0.25 + 0.75 * live);
          totalEmissiveRadiance += (wa * (up * (0.5 + 0.45 * uKick * live) + rays * 0.9) + vec3(1.2) * uFlash) * diffuseColor.rgb * 0.42; }`);
    };
    const shellOut = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.1, emissive: 0x4a5268, emissiveIntensity: 0.75 });
    shellOut.onBeforeCompile = s => { s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= vColor.rgb * vColor.rgb * 1.35;'); };      // (the snow glows whiter than the paint)
    g.add(inner.mesh(wash), outer.mesh(shellOut));

    // ---- snow along the crowns: a rounded lip on each arch's front edge, and icicles off the front frame
    const snowM = new THREE.MeshStandardMaterial({ map: k.museum.snowTex, roughness: 0.95, emissiveMap: k.museum.snowTex, emissive: new THREE.Color(0.28, 0.32, 0.46), emissiveIntensity: 0.55 });
    const crest = (pts, nOut, z) => { const N = norms(pts), sel = []; pts.forEach((p, j) => { if (-N[j][1] > 0.5) sel.push(new THREE.Vector3(p[0] - N[j][0] * 0.07, h + p[1] - N[j][1] * 0.07, z)); }); return sel.length > 3 ? sel : null; };
    const tubes = [];
    for (const r of R) { const c = crest(Q[r.i], 1, r.zf + 0.08); if (c) tubes.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(c), 48, 0.1, 6, false)); }
    { const c = crest(this.frameP, 1, R[R.length - 1].zf + 0.25); if (c) tubes.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(c), 48, 0.16, 6, false)); }
    { const c = crest(Q[0], 1, sh.z1 + 0.2); if (c) tubes.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(c), 48, 0.11, 6, false)); }
    const tp = k.parts(); for (const t of tubes) tp.add(t, snowM); tp.done(g);
    { // icicles off the underside of the front frame's crown, and off the deck's back corners
      const ic = []; const F = P[R.length - 1], N = norms(F), z = R[R.length - 1].zf + 0.06;
      F.forEach((p, j) => { if (N[j][1] < -0.75 && j % 1 === 0) for (let q = 0; q < 2; q++) ic.push([p[0] + (r0() - 0.5) * 0.3, h + p[1] - 0.02, z + 0.05 + r0() * 0.3, 0.12 + r0() * 0.5 * (r0() < 0.3 ? 1.6 : 1)]); });
      const im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.035, 1, 5).rotateX(Math.PI).translate(0, -0.5, 0), new THREE.MeshStandardMaterial({ color: 0xcfe6ff, roughness: 0.15, metalness: 0.2, emissive: 0x5c7aa8, emissiveIntensity: 0.7, transparent: true, opacity: 0.85 }), ic.length);
      const M = new THREE.Matrix4(), Qn = new THREE.Quaternion();
      ic.forEach(([x, y, zz, l], i) => im.setMatrixAt(i, M.compose(new THREE.Vector3(x, y, zz), Qn, new THREE.Vector3(1 + l, l, 1 + l))));
      im.frustumCulled = false; g.add(im);
    }

    // ---- the deck, the ramp and the steps
    const deckT = tex(256, 256, (c, w) => {
      for (let y = 0; y < w; y += 32) { let x = -Math.floor(r0() * 200); while (x < w) { const L = 120 + r0() * 160, v = 58 + Math.floor(r0() * 26); c.fillStyle = `rgb(${v + 18},${v},${v - 14})`; c.fillRect(x, y, L, 32); c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x + L - 2, y, 2, 32); x += L; } c.fillStyle = 'rgba(0,0,0,0.75)'; c.fillRect(0, y, w, 2); c.fillStyle = 'rgba(255,230,200,0.06)'; c.fillRect(0, y + 3, w, 3); }
      for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(${r0() < 0.5 ? '0,0,0' : '255,240,220'},${0.04 + r0() * 0.05})`; c.fillRect(r0() * w, r0() * w, 6 + r0() * 30, 1); }
    });
    const deckM = new THREE.MeshStandardMaterial({ map: deckT, roughness: 0.45, metalness: 0.05, emissiveMap: deckT, emissive: 0x6a5a50, emissiveIntensity: 0.75 });
    deckM.onBeforeCompile = s => {      // the light off the shell, spilt on the boards: its colours across them, stronger towards the back
      Object.assign(s.uniforms, { uT: U.uT, uKick: U.uKick, uLevel: U.uLevel, uPal: U.uPal, uCx: { value: cx }, uZ: { value: sh.z0 } });
      s.vertexShader = 'varying vec3 vWp;\n' + s.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      s.fragmentShader = 'uniform float uT, uKick, uLevel, uCx, uZ; uniform vec3 uPal[3]; varying vec3 vWp;\n' + PAL + s.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += pal(0.5 + (vWp.x - uCx) / 14.0 * 0.45 + uT * 0.012) * (0.02 + 0.03 * clamp((vWp.z - uZ) / 12.0, 0.0, 1.0)) * (1.0 + uKick * uLevel) * (0.4 + diffuseColor.r * 2.0);`);
    };
    const fasT = tex(128, 128, (c, w) => { c.fillStyle = '#20232b'; c.fillRect(0, 0, w, w); for (let x = 0; x < w; x += 16) { c.fillStyle = '#2c3039'; c.fillRect(x + 2, 0, 11, w); c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(x + 2, 0, 2, w); } });
    const fasM = new THREE.MeshStandardMaterial({ map: fasT, roughness: 0.6, metalness: 0.3, emissive: 0x1a1d26, emissiveIntensity: 0.8 });
    const D = new Mesher(), Fz = new Mesher(), W = [1, 1, 1];
    D.box(sh.x0, sh.x1, h - 0.06, h, sh.z0, sh.z1, n => W, 1.6);                // the boards (only their top shows)
    Fz.box(sh.x0, sh.x1, 0, h - 0.06, sh.z0, sh.z1, W, 0.6);                      // and the skirt round them
    // out to the feet of the front arches (plan.js), each drawn 6 mm short of the step in the arches behind it and 6 mm
    // into the one in front (so no face of them lies in the plane of the arches' steps)
    for (const q of sh.wings || []) { const z0 = q.z0 > sh.z0 + 1e-6 ? q.z0 - 0.006 : q.z0, z1 = q.z1 - 0.006; D.box(q.x0, q.x1, h - 0.06, h, z0, z1, n => W, 1.6); Fz.box(q.x0, q.x1, 0, h - 0.06, z0, z1, W, 0.6); }
    const rp = sh.ramp, st = sh.steps;
    for (let j = 0; j < st.n; j++) {
      const y0 = h * j / st.n, y1 = h * (j + 1) / st.n, z0 = sh.z0 - st.tread * (st.n - j), z1 = z0 + st.tread;
      for (const [x0, x1] of [[st.x0, rp.x0 - 0.01], [rp.x1 + 0.01, st.x1]]) { D.box(x0, x1, y1 - 0.04, y1, z0, sh.z0 - 0.005, W, 1.6); Fz.box(x0, x1, j ? y0 : 0, y1 - 0.04, z0, sh.z0 - 0.005, W, 0.6); }
    }
    g.add(D.mesh(deckM), Fz.mesh(fasM));
    // the snow drifted against the bottom step, up to the line the wheels ride (plan.js: the steps' nosings)
    if (st.foot != null) { const m = new Mesher(), z0 = st.foot, z1 = sh.z0 - st.tread * st.n, y1 = h / st.n + 0.004, nl = Math.hypot(z1 - z0, y1), nrm = [0, (z1 - z0) / nl, -y1 / nl];
      for (const [x0, x1] of [[st.x0, rp.x0 - 0.01], [rp.x1 + 0.01, st.x1]]) { const a = m.v(x0, -0.02, z0, ...nrm, x0 / 6, z0 / 6, W), b = m.v(x1, -0.02, z0, ...nrm, x1 / 6, z0 / 6, W), c = m.v(x1, y1, z1 - 0.004, ...nrm, x1 / 6, z1 / 6, W), d = m.v(x0, y1, z1 - 0.004, ...nrm, x0 / 6, z1 / 6, W); m.q(a, b, c, d); }
      g.add(m.mesh(snowM)); }
    // the ramp: dark ribbed rubber matting with a strip of light down each edge, in the show's colour. Nothing on it
    // points or runs: the only arrows on the ground are the lit route's (map.js).
    const matT = tex(64, 128, (c, w, hh) => { c.fillStyle = '#121419'; c.fillRect(0, 0, w, hh); c.fillStyle = '#20242d'; for (let y = 2; y < hh; y += 8) c.fillRect(7, y, w - 14, 3); c.fillStyle = '#fff'; c.fillRect(0, 0, 4, hh); c.fillRect(w - 4, 0, 4, hh); });
    matT.repeat.set(1, 6);
    const rampM = this.rampM = new THREE.MeshStandardMaterial({ map: matT, roughness: 0.7, emissiveMap: matT, emissive: new THREE.Color(0.6, 0.8, 1.6), emissiveIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -1 });
    { const m = new Mesher(), up = [0, 9 / Math.hypot(9, h), -h / Math.hypot(9, h)], a = m.v(rp.x0, 0.004, rp.z0, ...up, 1, 0, W), b = m.v(rp.x1, 0.004, rp.z0, ...up, 0, 0, W), c = m.v(rp.x1, h + 0.004, rp.z1, ...up, 0, 1, W), d = m.v(rp.x0, h + 0.004, rp.z1, ...up, 1, 1, W); m.q(a, b, c, d); g.add(m.mesh(rampM));
      const s = new Mesher(); for (const [x, nx] of [[rp.x0, -1], [rp.x1, 1]]) { const p0 = s.v(x, 0, rp.z0, nx, 0, 0, 0, 0, W), p1 = s.v(x, 0, rp.z1, nx, 0, 0, 1.5, 0, W), p2 = s.v(x, h, rp.z1, nx, 0, 0, 1.5, 0.2, W); s.t(p0, p1, p2); } g.add(s.mesh(fasM)); }

    // ---- the backstage block, the speaker stacks, the truss, the cans
    const dark = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.55, metalness: 0.3, emissive: 0x0b0d12, emissiveIntensity: 1 });
    const metal = new THREE.MeshStandardMaterial({ color: 0xb8c0cc, roughness: 0.35, metalness: 0.8, emissive: 0x3a4250, emissiveIntensity: 0.6 });
    const brickT = tex(256, 128, (c, w, hh) => { c.fillStyle = '#5a5250'; c.fillRect(0, 0, w, hh); for (let y = 0; y < hh; y += 16) for (let x = (y / 16) % 2 ? -16 : 0; x < w; x += 32) { const v = 70 + Math.floor(r0() * 30); c.fillStyle = `rgb(${v + 22},${v + 6},${v})`; c.fillRect(x + 1, y + 1, 30, 14); } });
    brickT.repeat.set(8, 3);
    const brick = new THREE.MeshStandardMaterial({ map: brickT, roughness: 0.9, emissiveMap: brickT, emissive: 0x6a5e5c, emissiveIntensity: 0.6 });
    const Pp = k.parts(), box = (mat, x0, x1, y0, y1, z0, z1) => Pp.add(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    { const q = sh.back; box(brick, q.x0, q.x1, 0, q.h - 0.08, q.z0, q.z1); box(snowM, q.x0 - 0.05, q.x1 + 0.05, q.h - 0.08, q.h, q.z0 - 0.05, q.z1 + 0.05);
      box(dark, q.x0 - 0.04, q.x1 + 0.04, q.h - 0.38, q.h - 0.095, q.z0 - 0.04, q.z1 + 0.04);                    // a coping round the top (its top a little under the brick's, so the two never fight)
      for (const x of [cx - 6, cx + 5.7]) { box(metal, x - 0.75, x + 0.75, 0, 2.3, q.z1, q.z1 + 0.05); box(dark, x - 0.68, x + 0.68, 0, 2.22, q.z1 + 0.05, q.z1 + 0.07); }      // two doors, a frame round each
      for (const x of [cx - 6, cx + 5.7]) Pp.add(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, 1.2) }), x, 2.62, q.z1 + 0.16); }
    const grilleT = tex(128, 128, (c, w) => { c.fillStyle = '#0c0d10'; c.fillRect(0, 0, w, w); c.fillStyle = '#23262d'; for (let y = 2; y < w; y += 5) for (let x = (y % 10 ? 2 : 4.5); x < w; x += 5) c.fillRect(x, y, 2.2, 2.2); });
    const grille = new THREE.MeshStandardMaterial({ map: grilleT, roughness: 0.8, emissive: 0x0a0b0e, emissiveIntensity: 1 });
    const strips = this.strips = new Strips(); this.cones = [];
    for (const q of sh.speakers) {
      const mx = (q.x0 + q.x1) / 2, w = q.x1 - q.x0;
      for (const [y0, y1, inset] of [[0, 1.0, 0], [1.0, 1.75, 0.08], [1.75, q.h - 0.03, 0.16]]) {
        box(dark, q.x0 + inset, q.x1 - inset, y0, y1 - 0.01, q.z0 + inset * 0.5, q.z1 - inset * 0.5);
        Pp.add(new THREE.PlaneGeometry(w - inset * 2 - 0.08, y1 - y0 - 0.09).rotateY(Math.PI), grille, mx, (y0 + y1) / 2, q.z0 + inset * 0.5 - 0.012);      // (a centimetre proud of the box)
      }
      box(snowM, q.x0 + 0.14, q.x1 - 0.14, q.h - 0.03, q.h, q.z0 + 0.06, q.z1 - 0.06);
      for (const s of [-1, 1]) { this.cones.push([mx + s * 0.55, 0.5, q.z0 - 0.01, 0.34]); strips.ring(mx + s * 0.55, 0.5, q.z0 - 0.012, 0.36, 0.03, 5, 0); }
      for (const s of [-1, 1]) { this.cones.push([mx + s * 0.6, 1.36, q.z0 + 0.03, 0.2]); strips.ring(mx + s * 0.6, 1.36, q.z0 + 0.028, 0.22, 0.022, 5, 1); }
      box(metal, mx - 0.34, mx + 0.34, 1.97, 2.27, q.z0 + 0.05, q.z0 + 0.09);       // the horn
    }
    // the woofers' cones, their mouths flush with the grille
    { const geo = new THREE.ConeGeometry(1, 0.35, 20, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.175); const m = this.coneMesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0x2a2d34, roughness: 0.7, side: THREE.DoubleSide, emissive: 0x101216, emissiveIntensity: 1 }), this.cones.length); m.frustumCulled = false; g.add(m); this._cones(0); }
    // the truss: four chords and their lacing, across and down the two towers
    const T = sh.truss, s2 = T.s / 2, tube = new THREE.CylinderGeometry(0.024, 0.024, 1, 6, 1), rod = (a, b, r = 1) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), M = new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()), new THREE.Vector3(r, d.length(), r)); Pp.add(tube, metal, M); };
    { const corners = [[-s2, -s2], [s2, -s2], [s2, s2], [-s2, s2]], X0 = T.x0, X1 = T.x1, n = Math.round((X1 - X0) / T.s);
      for (const [a, b] of corners) rod([X0, T.y + a, T.z + b], [X1, T.y + a, T.z + b], 1.3);
      for (let i = 0; i < n; i++) { const xa = X0 + (X1 - X0) * i / n, xb = X0 + (X1 - X0) * (i + 1) / n; for (let f = 0; f < 4; f++) { const [a1, b1] = corners[f], [a2, b2] = corners[(f + 1) % 4]; rod([i % 2 ? xa : xb, T.y + a1, T.z + b1], [i % 2 ? xb : xa, T.y + a2, T.z + b2], 0.7); } }
      for (const tx of [T.x0, T.x1]) {
        const m = Math.round((T.y - h) / T.s);
        for (const [a, b] of corners) rod([tx + a, h, T.z + b], [tx + a, T.y + s2, T.z + b], 1.3);
        for (let i = 0; i < m; i++) { const ya = h + (T.y - h) * i / m, yb = h + (T.y - h) * (i + 1) / m; for (let f = 0; f < 4; f++) { const [a1, b1] = corners[f], [a2, b2] = corners[(f + 1) % 4]; rod([tx + a1, i % 2 ? ya : yb, T.z + b1], [tx + a2, i % 2 ? yb : ya, T.z + b2], 0.7); } }
        box(dark, tx - s2 - 0.1, tx + s2 + 0.1, h, h + 0.03, T.z - s2 - 0.1, T.z + s2 + 0.1);
      }
      box(snowM, T.x0 - s2, T.x1 + s2, T.y + s2, T.y + s2 + 0.03, T.z - s2 + 0.02, T.z - s2 + 0.1);      // a line of snow along the top front chord
    }
    // the cans on the deck that wash the shell, at the foot of each arch
    this.cans = [];
    for (const r of R) for (const s of [-1, 1]) { const x = cx + s * Math.min(r.w - 0.5, (sh.x1 - sh.x0) / 2 - 0.45), z = (r.zf + r.zb) / 2; this.cans.push([x, z, s]); box(dark, x - 0.16, x + 0.16, h, h + 0.06, z - 0.16, z + 0.16); k.plan.obstacles.push({ x0: x - 0.17, x1: x + 0.17, z0: z - 0.17, z1: z + 0.17, y0: h, y1: h + 0.34 }); }
    { const geo = new THREE.CylinderGeometry(0.13, 0.11, 0.3, 12, 1).rotateZ(0); const m = new THREE.InstancedMesh(geo, dark, this.cans.length), lens = this.canLens = new THREE.InstancedMesh(new THREE.CircleGeometry(0.11, 14), new THREE.MeshBasicMaterial({ color: 0xffffff }), this.cans.length), M = new THREE.Matrix4(), Qc = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
      this.cans.forEach(([x, z, s], i) => { const q = Qc.setFromEuler(new THREE.Euler(0, 0, -s * 0.45)); m.setMatrixAt(i, M.compose(new THREE.Vector3(x, h + 0.2, z), q, one)); const lq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-s * Math.sin(0.45), Math.cos(0.45), 0)); lens.setMatrixAt(i, M.compose(new THREE.Vector3(x - s * 0.068, h + 0.34, z), lq, one)); lens.setColorAt(i, new THREE.Color(1, 1, 1)); });
      m.frustumCulled = lens.frustumCulled = false; g.add(m, lens); }
    for (const m of Pp.done(g)) m.receiveShadow = false;

    // ---- lines of light: round each arch's inner edge (and the frame's outer one), along the deck, up the ramp, the truss, the step noses
    const lineArch = (pts, z, k2, w = 0.11) => { const N = norms(pts), sel = [], ac = []; pts.forEach((p, j) => { if (p[1] >= -0.001) { sel.push([p[0], h + p[1], z]); ac.push([N[j][0] * w, N[j][1] * w, 0]); } }); strips.line(sel, i => ac[i], 0, k2); };
    for (const r of R) lineArch(P[r.i], r.zf - 0.012, r.i);
    { const F = this.frameP, N = norms(F); lineArch(F.map((p, j) => [p[0] + N[j][0] * 0.13, p[1] + N[j][1] * 0.13]), R[R.length - 1].zf - 0.012, 5, 0.1); }
    const along = (x0, x1, n = 40) => Array.from({ length: n + 1 }, (_, i) => x0 + (x1 - x0) * i / n);
    // (along the front as wide as the deck runs there, out under the front arch; down the sides where the deck has an edge of its own)
    const fx0 = Math.min(sh.x0, ...(sh.wings || []).filter(q => q.z0 <= sh.z0 + 1e-6).map(q => q.x0)), fx1 = Math.max(sh.x1, ...(sh.wings || []).filter(q => q.z0 <= sh.z0 + 1e-6).map(q => q.x1));
    strips.line(along(fx0, fx1).map(x => [x, h - 0.075, sh.z0 - 0.012]), [0, 0.055, 0], 1, 0);
    strips.line(along(fx0, fx1).map(x => [x, 0.06, sh.z0 - 0.012]), [0, 0.04, 0], 1, 1);
    const sz0 = Math.max(sh.z0, ...(sh.wings || []).map(q => q.z1));
    for (const [x, d] of [[sh.x0 - 0.012, 0], [sh.x1 + 0.012, 1]]) strips.line(along(sz0, sh.z1, 20).map(z => [x, h - 0.075, z]), [0, 0.055, 0], 1, 2 + d);
    for (const x of [rp.x0 + 0.05, rp.x1 - 0.11]) strips.line(along(rp.z0, rp.z1, 30).map(z => [x, 0.012 + h * (z - rp.z0) / (rp.z1 - rp.z0), z]), [0.06, 0, 0], 2, 0);
    strips.line(along(T.x0, T.x1, 60).map(x => [x, T.y - s2 - 0.02, T.z - s2 - 0.03]), [0, 0.05, 0], 3, 0);
    for (let j = 0; j < st.n; j++) { const y1 = h * (j + 1) / st.n, z0 = sh.z0 - st.tread * (st.n - j) - 0.006; for (const [x0, x1] of [[st.x0, rp.x0 - 0.01], [rp.x1 + 0.01, st.x1]]) strips.line([[x0, y1 - 0.035, z0], [x1, y1 - 0.035, z0]], [0, 0.025, 0], 4, j); }
    const stripM = this.stripM = new THREE.ShaderMaterial({
      uniforms: U, side: THREE.DoubleSide,
      vertexShader: 'attribute vec3 aS; varying vec3 vS; void main() { vS = aS; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uT, uKick, uLevel, uCalm, uFlash, uRing; uniform vec3 uPal[3]; varying vec3 vS;\n${PAL}
        void main() {
          float u = vS.x, g = vS.y, k = vS.z, live = uLevel * (1.0 - 0.75 * uCalm), sp = mix(0.5, 3.2, live) * (1.0 - 0.6 * uCalm);
          vec3 c;
          if (g < 0.5) { float run = pow(0.5 + 0.5 * sin(u * 6.2832 * 3.0 - uT * sp + k * 0.9), 2.0);
            c = pal(u * 0.5 + k * 0.13 + uT * 0.02) * (0.55 + 0.75 * run * (0.35 + 0.65 * live));
            c *= 1.0 + 2.2 * live * uKick * exp(-pow(k - uRing, 2.0) * 1.5); }
          else if (g < 1.5) { float run = pow(0.5 + 0.5 * sin(u * 70.0 - uT * sp * 2.0), 4.0); c = pal(u + uT * 0.05) * (0.35 + 1.1 * run * (0.2 + 0.8 * live) + 0.9 * uKick * live); }
          else if (g < 2.5) { float run = pow(fract(u * 4.0 - uT * 0.5 * (0.6 + live)), 5.0); c = pal(0.15 + uT * 0.03) * (0.3 + 1.8 * run); }
          else if (g < 3.5) { float run = pow(0.5 + 0.5 * sin(u * 40.0 + uT * sp * 1.5), 6.0); c = pal(u * 0.7 + 0.33) * (0.3 + 0.7 * live + 1.3 * run * live) + vec3(1.0) * uKick * live * 0.5; }
          else if (g < 4.5) { c = vec3(1.0, 1.05, 1.2) * (0.75 + 0.15 * sin(uT * 1.2 + k)); }
          else { c = pal(k * 0.3 + 0.5) * (0.07 + 0.9 * uKick * uKick * live); }
          gl_FragColor = vec4(c + vec3(2.0) * uFlash, 1.0);
        }`,
    });
    const sm = new THREE.Mesh(strips.geo(), stripM); sm.frustumCulled = false; g.add(sm);
  },
  _cones(kick) {
    const M = this._m4 || (this._m4 = new THREE.Matrix4()), Q = this._q || (this._q = new THREE.Quaternion()), V = this._v || (this._v = new THREE.Vector3()), S = this._s || (this._s = new THREE.Vector3());
    this.cones.forEach(([x, y, z, r], i) => this.coneMesh.setMatrixAt(i, M.compose(V.set(x, y, z), Q, S.set(r, r, 0.6))));
    this.coneMesh.instanceMatrix.needsUpdate = true;
  },

  // ============================================================ the lights
  // Six moving heads under the truss and a searchlight on each speaker stack: their beams are cones of light (one
  // instanced mesh, added in), and where a beam meets the snow or the deck there is a pool of its colour. More pools lie
  // on the snow in front of the stage, keeping the show's colours.
  _rig(k) {
    const sh = this.sh, T = sh.truss, g = this.g, s2 = T.s / 2;
    this.heads = [];
    for (const dx of [-8.5, -5.1, -1.7, 1.7, 5.1, 8.5]) this.heads.push({ p: new THREE.Vector3(sh.cx + dx, T.y - s2 - 0.06, T.z), hang: true, spread: 0.075, len: 22, dir: new THREE.Vector3(0, -1, -0.3).normalize(), i: this.heads.length });
    for (const q of sh.speakers) this.heads.push({ p: new THREE.Vector3((q.x0 + q.x1) / 2, q.h + 0.02, (q.z0 + q.z1) / 2 + 0.3), hang: false, spread: 0.028, len: 60, dir: new THREE.Vector3(0, 1, -0.2).normalize(), i: this.heads.length, sky: true });
    const n = this.heads.length, dark = new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: 0.4, metalness: 0.5, emissive: 0x0c0d12, emissiveIntensity: 1 });
    { const y = new THREE.BufferGeometry(), parts = [new THREE.BoxGeometry(0.06, 0.34, 0.1).translate(-0.2, -0.17, 0), new THREE.BoxGeometry(0.06, 0.34, 0.1).translate(0.2, -0.17, 0), new THREE.BoxGeometry(0.46, 0.06, 0.14).translate(0, 0.0, 0), new THREE.CylinderGeometry(0.12, 0.14, 0.08, 12).translate(0, 0.06, 0)];
      const flat = parts.map(p => p.toNonIndexed()); let cnt = 0; for (const p of flat) cnt += p.attributes.position.count; const pos = new Float32Array(cnt * 3), nor = new Float32Array(cnt * 3); let o = 0; for (const p of flat) { pos.set(p.attributes.position.array, o * 3); nor.set(p.attributes.normal.array, o * 3); o += p.attributes.position.count; }
      y.setAttribute('position', new THREE.BufferAttribute(pos, 3)); y.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); this.yokes = new THREE.InstancedMesh(y, dark, n); }
    this.hbody = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.12, 0.42, 14), dark, n);
    this.lens = new THREE.InstancedMesh(new THREE.CircleGeometry(0.12, 16).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff }), n);
    // the beams: a cone open at both ends, its apex at the lens; bright along its axis, soft at its edges, fading along it
    const coneG = new THREE.CylinderGeometry(0.02, 1, 1, 28, 1, true).translate(0, -0.5, 0);
    const beamM = this.beamM = new THREE.ShaderMaterial({
      uniforms: { uOp: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: `varying vec3 vN, vV, vC; varying float vA;
        void main() { mat4 im = modelMatrix * instanceMatrix; vec4 wp = im * vec4(position, 1.0); mat3 m = mat3(instanceMatrix); vec3 s = vec3(length(m[0]), length(m[1]), length(m[2]));
          vN = normalize(mat3(modelMatrix) * (m * (normal / (s * s)))); vV = normalize(cameraPosition - wp.xyz); vC = instanceColor; vA = 1.0 - uv.y; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `uniform float uOp; varying vec3 vN, vV, vC; varying float vA;
        void main() { float e = abs(dot(normalize(vN), normalize(vV))); float edge = e * e * e; float fall = pow(max(0.0, 1.0 - vA), 1.5) * smoothstep(0.0, 0.025, vA); gl_FragColor = vec4(vC * edge * fall * uOp, 1.0); }`,
    });
    this.beams = new THREE.InstancedMesh(coneG, beamM, n); this.beams.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    // pools of light: one for each truss beam, wherever it lands, and six on the snow in front
    const poolT = tex(64, 64, (c, w) => { const gr = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, w); }, false, false);
    this.fixedPools = [[-11, 214.8, 4.2], [-5.5, 213.2, 3.8], [0, 214.6, 4.4], [5.5, 213.2, 3.8], [11, 214.8, 4.2], [0, 208.6, 5.2]].map(([dx, z, r]) => [sh.cx + dx, z, r]);
    const np = 6 + this.fixedPools.length;
    this.pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: poolT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), np);
    this.pools.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(np * 3), 3); this.pools.renderOrder = 4;
    for (const m of [this.yokes, this.hbody, this.lens, this.beams, this.pools]) { m.frustumCulled = false; g.add(m); }
    this.lens.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    this.beams.renderOrder = 6;
    this._aimAll(0, 0, 1);
  },

  // ============================================================ the screen
  _screen(k) {
    const sh = this.sh, U = this.U, grp = this.scr = new THREE.Group();
    grp.position.set(sh.cx, sh.h + 3.0, sh.z1 - 0.06); grp.rotation.y = Math.PI; this.g.add(grp);
    // the bezel
    { const b = new THREE.Mesh(new THREE.BoxGeometry(SCREEN.w + 0.3, SCREEN.h + 0.3, 0.12), new THREE.MeshStandardMaterial({ color: 0x0a0b0e, roughness: 0.4, metalness: 0.4, emissive: 0x06070a })); b.position.z = -0.07; grp.add(b); }
    this.SU = { uPlay: { value: 0 }, uProg: { value: 0 }, uSong: { value: -10 }, uSpeed: { value: 3 }, uRecY: { value: SCREEN.recY }, uSize: { value: 0.8 }, uTop: { value: SCREEN.h / 2 - 0.04 }, uBot: { value: -SCREEN.h / 2 + 0.04 }, uRecep: { value: new THREE.Vector4() }, uGlyph: { value: this.glyph }, uLC: { value: LANE_COL.map(c => new THREE.Vector3(...c)) } };
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h), new THREE.ShaderMaterial({
      uniforms: { ...U, ...this.SU },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uT, uKick, uLevel, uFlash, uCalm, uPlay, uProg; uniform vec3 uPal[3]; varying vec2 vUv;\n${PAL}
        float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        void main() {
          vec2 res = vec2(208.0, 117.0), px = vUv * res, cell = floor(px), f = fract(px) - 0.5, q = (cell + 0.5) / res;
          float a = sin(q.x * 5.0 + uT * 0.22) * 0.07 + sin(q.x * 12.0 - uT * 0.37) * 0.035;
          float band = exp(-pow((q.y - 0.62 - a) * 5.5, 2.0)) + 0.55 * exp(-pow((q.y - 0.42 + a) * 8.0, 2.0));
          vec3 col = pal(q.x * 0.5 + uT * 0.025) * band * 0.3 + vec3(0.01, 0.014, 0.035) * (1.0 + q.y);
          float fl = step(0.9935, hash(vec2(cell.x, floor(cell.y + uT * 7.0 * (1.0 - 0.6 * uCalm)))));
          col += vec3(0.55, 0.6, 0.8) * fl * (1.0 - uPlay * 0.8);
          vec3 pc = vec3(0.004, 0.006, 0.018);
          float lx = abs(q.x - 0.5) * ${SCREEN.w.toFixed(1)};
          pc += vec3(0.02, 0.025, 0.05) * step(lx, 1.9) + vec3(0.06, 0.07, 0.1) * step(abs(lx - 1.9), 0.02);
          pc += pal(q.y * 0.6 + uT * 0.08) * pow(abs(q.x - 0.5) * 2.0, 5.0) * uKick * 0.5 * (1.0 - 0.6 * uCalm);
          pc += pal(0.2) * step(q.y, 0.016) * step(q.x, uProg) * 0.9;
          col = mix(col, pc, uPlay) + uFlash * 0.35;
          float led = smoothstep(0.5, 0.28, length(f));
          gl_FragColor = vec4(col * (0.3 + 0.95 * led), 1.0);
        }`,
    }));
    grp.add(bg);
    // the arrows: one instance each (time, lane, state), and four more for the line they rise to
    this.noteMat = new THREE.ShaderMaterial({
      uniforms: this.SU, transparent: true, depthWrite: false,
      vertexShader: `attribute vec3 aN; uniform float uSong, uSpeed, uRecY, uSize; varying vec2 vUv; varying float vLane, vState, vY;
        void main() { float st = aN.z; float x = (aN.y - 1.5) * 0.95; float y = st > 2.5 ? uRecY : uRecY - (aN.x - uSong) * uSpeed;
          float sc = (st > 0.5 && st < 1.5) ? 0.0 : uSize; vec3 p = vec3(x + position.x * sc, y + position.y * sc, st > 2.5 ? 0.01 : 0.02);
          vUv = uv; vLane = aN.y; vState = st; vY = p.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `uniform sampler2D uGlyph; uniform vec4 uRecep; uniform vec3 uLC[4]; uniform float uTop, uBot; varying vec2 vUv; varying float vLane, vState, vY;
        void main() {
          if (vY > uTop || vY < uBot) discard;
          vec2 p = vUv - 0.5; int l = int(vLane + 0.5);
          vec2 r = l == 0 ? vec2(p.y, -p.x) : l == 1 ? vec2(-p.x, -p.y) : l == 3 ? vec2(-p.y, p.x) : p;
          vec4 gl = texture2D(uGlyph, r + 0.5); vec3 lc = uLC[l]; vec3 c;
          if (vState > 2.5) { float fl = l == 0 ? uRecep.x : l == 1 ? uRecep.y : l == 2 ? uRecep.z : uRecep.w; c = vec3(0.4) * gl.g + lc * (gl.r * 0.1 + (gl.r + gl.g) * fl * 1.5) + vec3(1.0) * gl.g * fl; }
          else if (vState > 1.5) c = vec3(0.1, 0.1, 0.12) * (gl.r + 2.0 * gl.g);
          else c = lc * gl.r * 1.05 + vec3(1.5) * gl.g;
          float a = max(gl.r, gl.g); if (a < 0.04) discard;
          gl_FragColor = vec4(c, a);
        }`,
    });
    this.notes = null;
    this._setNotes([]); this.notes.visible = false;
    // words over it all: the title, the choice of song, the score at the end (redrawn when they change); the score and the
    // combo while dancing; and the judgement of each step, which pops
    const plane = (cw, ch, w, hh, z) => { const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); m.position.z = z; grp.add(m); return { cv, c: cv.getContext('2d'), t, m }; };
    this.over = plane(1024, 576, SCREEN.w, SCREEN.h, 0.03); this.over.m.material.color.setScalar(0.8);
    this.hud = plane(1024, 576, SCREEN.w, SCREEN.h, 0.035); this.hud.m.material.color.setScalar(0.95); this.hud.m.visible = false;
    this.jud = plane(512, 128, 3.2, 0.8, 0.04); this.jud.m.position.y = SCREEN.recY - 1.15; this.jud.m.visible = false; this.jud.m.material.color.setScalar(1.1);
  },
  _setNotes(list) {
    const n = list.length + 4;
    if (!this.notes || this.notes.userData.cap < n) {
      if (this.notes) { this.scr.remove(this.notes); this.notes.geometry.dispose(); }
      const cap = Math.max(n, 64), geo = new THREE.PlaneGeometry(1, 1);
      geo.setAttribute('aN', new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3));
      const vis = this.notes ? this.notes.visible : false, m = this.notes = new THREE.InstancedMesh(geo, this.noteMat, cap); m.userData.cap = cap; m.frustumCulled = false; m.visible = vis; this.scr.add(m);
    }
    const a = this.notes.geometry.attributes.aN;
    for (let l = 0; l < 4; l++) a.setXYZ(l, 0, l, 3);
    list.forEach((q, i) => a.setXYZ(i + 4, q.t, q.lane, 0));
    a.needsUpdate = true; this.notes.count = n;
  },

  // ============================================================ the pad
  // Four arrow panels round a middle one, each a pane of dark glass with its arrow in light under it, in a lit frame.
  _pad(k) {
    const sh = this.sh, p = sh.pad, c = p.cell, y = p.y, pos = [], uv = [], lane = [], ix = [];
    const quad = (x, z, s, l) => { const b = pos.length / 3; pos.push(x + s / 2, y, z - s / 2, x - s / 2, y, z - s / 2, x - s / 2, y, z + s / 2, x + s / 2, y, z + s / 2); uv.push(0, 0, 1, 0, 1, 1, 0, 1); lane.push(l, l, l, l); ix.push(b, b + 1, b + 2, b, b + 2, b + 3); };
    quad(p.x, p.z, c * 3 + 0.24, 5);
    for (let l = 0; l < 4; l++) quad(p.x + DIRS[l][0] * c, p.z + DIRS[l][1] * c, c - 0.06, l);
    quad(p.x, p.z, c - 0.06, 4);
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) quad(p.x + dx * c, p.z + dz * c, c - 0.06, 6);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('aL', new THREE.Float32BufferAttribute(lane, 1)); geo.setIndex(ix);
    this.PU = { uLit: { value: new THREE.Vector4() }, uReady: { value: 0 }, uGlyph: { value: this.glyph }, uLC: this.SU.uLC };
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: { ...this.U, ...this.PU }, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: 'attribute float aL; varying vec2 vUv; varying float vL; void main() { vUv = uv; vL = aL; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uT, uKick, uLevel, uCalm, uFlash, uReady; uniform vec4 uLit; uniform vec3 uPal[3]; uniform vec3 uLC[4]; uniform sampler2D uGlyph; varying vec2 vUv; varying float vL;\n${PAL}
        void main() {
          vec2 p = vUv - 0.5; float e = max(abs(p.x), abs(p.y)); int l = int(vL + 0.5);
          if (l == 5) { if (e < 0.455) discard; float rim = smoothstep(0.47, 0.49, e); float run = pow(0.5 + 0.5 * sin(atan(p.y, p.x) * 8.0 - uT * (1.0 + 2.0 * uLevel) * (1.0 - 0.6 * uCalm)), 3.0); vec3 c = mix(vec3(0.02, 0.022, 0.03), pal(atan(p.y, p.x) / 6.2832 + uT * 0.05) * (0.6 + 1.4 * run + uReady * 0.8), rim); gl_FragColor = vec4(c, 1.0); return; }
          vec3 glass = vec3(0.025, 0.03, 0.045) + vec3(0.02) * step(0.47, e);
          if (l == 6) { gl_FragColor = vec4(glass + vec3(0.03, 0.035, 0.05) * smoothstep(0.42, 0.5, e), 1.0); return; }
          if (l == 4) { float rg = smoothstep(0.03, 0.0, abs(length(p) - 0.28)); gl_FragColor = vec4(glass + pal(uT * 0.04) * rg * (0.5 + 0.8 * uKick * uLevel), 1.0); return; }
          vec2 r = l == 0 ? vec2(p.y, -p.x) : l == 1 ? vec2(-p.x, -p.y) : l == 3 ? vec2(-p.y, p.x) : p;
          vec4 gl = texture2D(uGlyph, r * 1.15 + 0.5); float lit = l == 0 ? uLit.x : l == 1 ? uLit.y : l == 2 ? uLit.z : uLit.w;
          float invite = uReady * pow(0.5 + 0.5 * sin(uT * 4.0 - float(l) * 1.57), 4.0);
          vec3 lc = uLC[l], c = glass + lc * gl.r * (0.18 + 0.3 * invite + 2.4 * lit) + vec3(0.9) * gl.g * (0.3 + 1.6 * lit) + lc * smoothstep(0.43, 0.49, e) * (0.35 + 1.5 * lit);
          c += lc * lit * 0.35;
          gl_FragColor = vec4(c, 1.0);
        }`,
    }));
    m.matrixAutoUpdate = false; m.updateMatrix(); this.g.add(m);
  },

  // ============================================================ playing
  near(v, k) {
    if (!this.sh || k.G.racing) return null;
    if (this.mode === 'select') return { verb: 'START', hint: '← → song · ↑ ↓ level', act: () => this._start() };
    if (this.mode === 'play') return { verb: 'STOP', hint: '', act: () => this._stop('') };
    if (this.mode === 'idle' && (v.kind === 'car' || v.kind === 'drone') && this._onPad(v)) return { verb: 'DANCE', hint: 'Snow Ball. E to dance.', act: () => this._select() };
    return null;
  },
  _onPad(v) { const p = this.sh.pad, q = v.pos, lim = p.cell * 1.5 + 0.1; return Math.abs(q.x - p.x) < lim && Math.abs(q.z - p.z) < lim && q.y > this.sh.h - 0.2 && q.y < this.sh.h + (v.kind === 'drone' ? 1.6 : 0.4); },
  // The clock everything is timed by: what the speakers are playing now (or the page's clock, with no sound).
  _clock(perf = performance.now()) {
    const c = this.k.sound && this.k.sound.ctx;
    if (this.base === 'ctx' && c) {
      const fall = c.currentTime - (c.outputLatency || c.baseLatency || 0) + (perf - performance.now()) / 1000;
      const o = c.getOutputTimestamp ? c.getOutputTimestamp() : null;
      if (o && o.performanceTime > 0 && o.contextTime > 0) { const t = o.contextTime + (perf - o.performanceTime) / 1000; if (Math.abs(t - fall) < 0.25) return t; }
      return fall;
    }
    return perf / 1000;
  },
  _select() {
    const k = this.k, v = k.v;
    this.dancer = v; this.mode = 'select'; this.selT = 0;
    const p = this.sh.pad; this.hop = { t: 0, d: 0.45, x0: v.pos.x, z0: v.pos.z, x1: p.x, z1: p.z, y0: v.pos.y, hgt: 0.12, yaw0: v.yaw, yaw1: 0, wig: 0, spin: 0 }; this.lastHop = 0;
    if (v.kind === 'car') { v.air = false; v.rail = null; v.vy = 0; v.flip = v.spin = 0; }
    k.hold((dt, inp) => this._ride(dt, inp));
    this._drawSelect(); this._ui(true); this.notes.visible = true;
    k.synth.chime([523, 784], { gap: 0.08, dur: 0.5, vol: 0.04 });
  },
  _leave() {
    const k = this.k, v = this.dancer; this.mode = 'idle'; this.dancer = null; this.band.stop(); this.run = null; this._ui(false);
    k.hold(null);
    if (v && v === k.v) { const p = v.pos; if (v.kind === 'drone') v.place(p.x, p.z, v.yaw, this.sh.h + 0.4); else v.place(p.x, p.z, v.yaw, this.sh.h); }
    this.SU.uPlay.value = 0; this.hud.m.visible = false; this.jud.m.visible = false; this._setNotes([]); this.notes.visible = false;
    if (k.sound) k.sound.duck = 0;
  },
  _selPress(l) {
    const s = this.sel; this.selT = 0;
    if (l === 0 || l === 3) s.song = (s.song + (l === 3 ? 1 : DANCES.length - 1)) % DANCES.length;
    else s.level = Math.max(0, Math.min(LEVELS.length - 1, s.level + (l === 2 ? -1 : 1)));
    this.padLit[l] = 1; this._hop(l, true);
    this.k.synth.note(l === 0 || l === 3 ? 660 : 880, 0.12, { type: 'triangle', vol: 0.04 });
    this._drawSelect();
  },
  _start() {
    const k = this.k, c = k.sound && k.sound.ctx, s = DANCES[this.sel.song], lv = LEVELS[this.sel.level], A = this.arr[this.sel.song];
    this.base = c && c.state === 'running' ? 'ctx' : 'page';
    const notes = chart(A, lv).map(n => ({ ...n, done: false }));
    const start = this._clock() + 0.7;
    this.run = { s, lv, A, notes, start, i0: 0, combo: 0, max: 0, score: 0, raw: 0, n: [0, 0, 0, 0], end: A.beats * A.spb, ms: 0, perf: performance.now() };
    if (this.base === 'ctx') { const snd = k.sound, vol = Math.max(0.55, snd.vol && snd.vol.music != null ? snd.vol.music : 0.8); this.band.play(snd, A, start, 0.9 * vol); }      // (the clock is what is being heard: a note laid down for `start` is heard at `start`)
    this._setNotes(notes); this.SU.uSpeed.value = (SCREEN.recY + SCREEN.h / 2 + 0.45) / lv.window; this.SU.uPlay.value = 1;
    this.mode = 'play'; this.over.m.visible = false; this.hud.m.visible = true; this._drawHud();
    tonight(n => { n.dances = (n.dances || 0) + 1; });
  },
  _stop(why) { if (why) this.k.say(why, 2.5); this._leave(); this._drawIdle(); },
  _key(e, down) {
    if (this.mode !== 'select' && this.mode !== 'play') return;
    if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (!down) { this.held.delete(e.code); return; }
    if (e.code === 'KeyR' || e.code === 'Backspace') { if (this.mode === 'play') this._stop(''); else { this._leave(); this._drawIdle(); } return; }
    const l = KEYS[e.code]; if (l == null || e.repeat) return;
    this.held.add(e.code);
    this._press(l, this._clock(e.timeStamp || performance.now()));
  },
  _press(l, t) {
    if (this.mode === 'select') { this._selPress(l); return; }
    if (this.mode !== 'play') return;
    const R = this.run, st = t - R.start;
    this.padLit[l] = 1; this.recep[l] = 1; this._hop(l);
    let best = -1, bd = 1e9;
    for (let i = R.i0; i < R.notes.length; i++) { const n = R.notes[i]; if (n.t - st > WIN.REACH) break; if (n.done || n.lane !== l) continue; const d = Math.abs(n.t - st); if (d < bd) { bd = d; best = i; } }
    if (best < 0 || bd > WIN.REACH) return;
    this._judge(best, bd <= WIN.PERFECT ? 0 : bd <= WIN.GREAT ? 1 : bd <= WIN.GOOD ? 2 : 3);
  },
  _judge(i, j) {
    const R = this.run, n = R.notes[i]; n.done = true; n.j = j;
    R.n[j]++; R.raw += JUDGE[j][1];
    R.score = Math.round(1e6 * R.raw / R.notes.length);
    if (j < 3) { R.combo++; R.max = Math.max(R.max, R.combo); } else R.combo = 0;
    const a = this.notes.geometry.attributes.aN; a.setZ(i + 4, j < 3 ? 1 : 2); a.needsUpdate = true;
    this.judgeT = 0; this._drawJudge(j); this._drawHud();
    if (j === 3) { this.wobble = 1; return; }
    if (MILESTONES.includes(R.combo)) this._milestone(R.combo);
  },
  _milestone(c) {
    const k = this.k, calm = k.G.set.reduce;
    this.burst = 1; this.hop.spin = TAU; this.hop.spinT = 0;
    const T = this.sh.truss, P = this.U.uPal.value;
    for (const hd of this.heads) if (hd.hang) for (let q = 0; q < (calm ? 6 : 14); q++) { const c3 = P[q % 3]; this.puffs.emit(hd.p.x, hd.p.y, hd.p.z - 0.3, 1, { spread: 0.4, up: 0.4, out: 1.4, life: 2.6, color: new THREE.Color(c3.x / 2.5, c3.y / 2.5, c3.z / 2.5) }); }
    k.synth.chime([784, 988, 1175], { gap: 0.05, dur: 0.5, vol: 0.03 });
  },
  _finish() {
    const k = this.k, R = this.run, frac = R.raw / R.notes.length, fc = R.n[3] === 0, grade = GRADES.find(g => frac >= g[1]);
    const key = R.s.id + '.' + this.sel.level, best = store.get(key), isBest = !best || R.score > best.score;
    if (isBest) store.set(key, { score: R.score, grade: grade[0] });
    this.result = { R, grade, fc, isBest, frac };
    this.mode = 'results'; this.resT = 0; this.band.stop(1.2);
    this.SU.uPlay.value = 0; this.hud.m.visible = false; this.jud.m.visible = false; this.notes.visible = false; this.over.m.visible = true; this._drawResults();
    if (fc) { this.snowT = 3.5; k.callout('FULL COMBO'); k.find('snowball'); }
    if (grade[0] === 'S' && this.sel.level === LEVELS.length - 1) k.find('snowstar');
    tonight(n => { n.danceBest = Math.max(n.danceBest || 0, R.score); if (!n.danceGrade || 'SABCD'.indexOf(grade[0]) < 'SABCD'.indexOf(n.danceGrade)) n.danceGrade = grade[0]; });
    k.synth.chime(fc ? [523, 659, 784, 1047, 1319] : [523, 659, 784], { gap: 0.09, dur: 1.1, vol: 0.045 });
  },
  // The toy on the pad: it hops onto each panel as it is stepped, wiggles as it lands, spins at every milestone, and
  // drifts back to the middle when left alone.
  _hop(l, small) {
    const p = this.sh.pad, H = this.hop, v = this.dancer; if (!H || !v) return;
    const x = H.x0 + (H.x1 - H.x0) * smooth(Math.min(1, H.t / H.d)), z = H.z0 + (H.z1 - H.z0) * smooth(Math.min(1, H.t / H.d));
    const tx = p.x + DIRS[l][0] * p.cell * (small ? 0.35 : 0.92), tz = p.z + DIRS[l][1] * p.cell * (small ? 0.35 : 0.92);
    Object.assign(H, { t: 0, d: small ? 0.16 : 0.13, x0: x, z0: z, x1: tx, z1: tz, y0: null, hgt: small ? 0.06 : 0.11, wig: (H.side = -(H.side || 1)) * 0.45, back: false });
    this.lastHop = 0;
  },
  _ride(dt, inp) {
    const k = this.k, v = k.v, H = this.hop, sh = this.sh, p = sh.pad;
    if (!v || v !== this.dancer || k.G.held) { this._leave(); return; }
    this._stick(inp);
    H.t += dt; this.lastHop += dt;
    if (this.lastHop > 0.65 && !H.back && H.t >= H.d) { Object.assign(H, { t: 0, d: 0.35, x0: H.x1, z0: H.z1, x1: p.x, z1: p.z, hgt: 0, wig: 0, back: true }); }
    const u = Math.min(1, H.t / H.d), e = smooth(u);
    const x = H.x0 + (H.x1 - H.x0) * e, z = H.z0 + (H.z1 - H.z0) * e, y = (H.y0 != null ? H.y0 + (p.y - H.y0) * e : p.y) + Math.sin(u * Math.PI) * H.hgt;
    if (u >= 1) H.y0 = null;
    if (H.yaw0 != null) { let d = H.yaw1 - H.yaw0; d = Math.atan2(Math.sin(d), Math.cos(d)); v.yaw = H.yaw0 + d * e; if (u >= 1) H.yaw0 = null; }
    else { if (H.spin) { H.spinT = (H.spinT || 0) + dt; const s = Math.min(1, H.spinT / 0.45); v.yaw = smooth(s) * H.spin; if (s >= 1) { H.spin = 0; v.yaw = 0; } } else v.yaw = Math.sin(H.t * 26) * H.wig * Math.exp(-H.t * 7); }
    this.wobble = Math.max(0, (this.wobble || 0) - dt * 2.5);
    const rollW = Math.sin(this.t * 40) * this.wobble * 0.18;
    if (v.kind === 'drone') { v.pos.set(x, y + 0.35, z); v.vel.set(0, 0, 0); v.pitch = 0; v.roll = rollW; v.landed = false; }
    else { v.pos.set(x, y, z); v.vel.set(0, 0, 0); v.air = false; v.tilt = -Math.sin(u * Math.PI) * 0.12 * (H.hgt > 0.05 ? 1 : 0); v.roll = rollW + Math.sin(H.t * 26) * H.wig * 0.25 * Math.exp(-H.t * 7); v.speed = 0; v.steer = 0; v.throttle = 0; v.launched = 0; v.landed = null; }
    v.sync(dt);
  },
  // The stick, a pad's stick and d-pad: a push past half way one of the four ways is a step (and must come back first).
  _stick(inp) {
    if (this.mode !== 'select' && this.mode !== 'play') return;
    let dir = -1;
    if (!this.held.size && inp) {
      const ud = inp.throttle != null ? inp.throttle : inp.pitch || 0, lr = inp.steer != null ? inp.steer : (inp.roll || 0) + (inp.yaw || 0);
      if (Math.max(Math.abs(ud), Math.abs(lr)) > 0.6) dir = Math.abs(ud) > Math.abs(lr) ? (ud > 0 ? 2 : 1) : (lr > 0 ? 3 : 0);
      else if (Math.max(Math.abs(ud), Math.abs(lr)) > 0.3 && this.stickWas >= 0) dir = this.stickWas;
    }
    if (dir >= 0 && dir !== this.stickWas) this._press(dir, this._clock());
    this.stickWas = dir;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp || !gp.connected) continue;
      [[12, 2], [13, 1], [14, 0], [15, 3]].forEach(([b, l]) => { const on = !!(gp.buttons[b] && gp.buttons[b].pressed); if (on && !this.padWas[b]) this._press(l, this._clock()); this.padWas[b] = on; });
      const back = !!(gp.buttons[1] && gp.buttons[1].pressed); if (back && !this.padWas.b) { if (this.mode === 'play') this._stop(''); else { this._leave(); this._drawIdle(); } } this.padWas.b = back;
      break;
    }
  },
  // Arrows on the glass, for a phone held sideways: four buttons in the order of the lanes, the left two under the left
  // thumb and the right two under the right (where JUMP was: it is put away meanwhile), and a cross to leave.
  _ui(on) {
    const touch = document.body.classList.contains('touch');
    if (!this.tui && on && touch) {
      const d = this.tui = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:45';
      const mk = (txt, side, off, bottom, s, fn, col) => {
        const b = document.createElement('div'); b.textContent = txt;
        b.style.cssText = `position:absolute;${side}:calc(max(20px, env(safe-area-inset-${side})) + ${off}px);bottom:calc(max(26px, env(safe-area-inset-bottom)) + ${bottom}px);width:${s}px;height:${s}px;line-height:${s}px;text-align:center;border-radius:16px;border:2px solid ${col};background:rgba(10,14,24,.55);color:${col};font:700 ${Math.round(s * 0.44)}px system-ui,sans-serif;box-shadow:0 0 14px ${col}55;pointer-events:auto;touch-action:none;-webkit-user-select:none;user-select:none`;
        b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); fn(e); b.style.background = 'rgba(255,255,255,.3)'; setTimeout(() => { b.style.background = 'rgba(10,14,24,.55)'; }, 110); }, { passive: false });
        b.addEventListener('mousedown', e => { fn(e); });
        d.append(b);
      };
      const lane = l => e => this._press(l, this._clock(e.timeStamp || performance.now()));
      mk('\u25C0', 'left', 0, 0, 60, lane(0), LANE_CSS[0]); mk('\u25BC', 'left', 68, 0, 60, lane(1), LANE_CSS[1]);
      mk('\u25B2', 'right', 68, 0, 60, lane(2), LANE_CSS[2]); mk('\u25B6', 'right', 0, 0, 60, lane(3), LANE_CSS[3]);
      mk('\u2715', 'left', 0, 78, 42, () => { if (this.mode === 'play') this._stop(''); else { this._leave(); this._drawIdle(); } }, '#c8d0e0');
      document.body.append(d);
    }
    if (this.tui) this.tui.style.display = on && touch ? 'block' : 'none';
    const jump = document.getElementById('bJump'); if (jump && touch) jump.style.visibility = on ? 'hidden' : '';
  },

  // ============================================================ every frame
  active(k) {
    if (!this.g) return false;
    if (this.mode !== 'idle') return true;
    const p = k.pos, sh = this.sh; this.far = Math.hypot(p.x - sh.cx, p.z - (sh.z0 + sh.z1) / 2);
    return !k.G.racing && this.far < 170;
  },
  update(dt, k) {
    const G = k.G, sh = this.sh, U = this.U, calm = G.set.reduce ? 1 : 0, snd = k.sound;
    this.t += dt; const T = this.t;
    // ---- the song: what time it is in it, the steps let go by, the end of it
    let beat, spb = 1 / 0.9, meter = 4, pal = null, live = 0;
    const R = this.run;
    if (this.mode === 'play' && R) {
      const now = performance.now(); if (now - R.perf > 700) { this._stop('The music stopped.'); return; } R.perf = now;
      this.band.update();
      const st = this._clock(now) - R.start; this.SU.uSong.value = st;
      while (R.i0 < R.notes.length && (R.notes[R.i0].done || st > R.notes[R.i0].t + WIN.GOOD)) { if (!R.notes[R.i0].done) this._judge(R.i0, 3); R.i0++; }
      this.SU.uProg.value = Math.max(0, Math.min(1, st / R.end));
      spb = R.A.spb; meter = R.s.meter; beat = st / spb; pal = R.s.pal; live = beat < R.A.first ? 0.35 : 1;
      if (st > R.end + 0.4) this._finish();
      if (snd) { snd.duck = 1; if (snd.nextTune !== undefined && snd.ctx) snd.nextTune = Math.max(snd.nextTune, snd.ctx.currentTime + 6); }
    } else beat = T * 0.9;
    if (this.mode === 'select') { this.selT += dt; if (this.selT > 40) { this._leave(); this._drawIdle(); } }
    if (this.mode === 'results') { this.resT += dt; if (this.resT > 4.5) { this._leave(); this.shown = T; } }
    if (this.mode === 'idle' && this.result && (this.far > 30 || T - this.shown > 40)) { this.result = null; this._drawIdle(); }
    // ---- the light show: how lively, the beat, the colours
    const want = this.mode === 'play' ? live : this.mode === 'select' || this.mode === 'results' ? 0.45 : 0.12;
    this.lvl += (want - this.lvl) * Math.min(1, dt * 3);
    const b = Math.max(0, beat), f = b - Math.floor(b);
    const kick = calm ? 0.25 + 0.15 * Math.sin(b * Math.PI) : (this.mode === 'play' && beat >= 0 ? Math.exp(-f * spb * 6) : 0.3 + 0.3 * Math.pow(0.5 + 0.5 * Math.sin(T * 1.4), 3));
    this.burst = Math.max(0, this.burst - dt * 1.6);
    U.uT.value = T; U.uKick.value = kick; U.uLevel.value = this.lvl; U.uCalm.value = calm; U.uFlash.value = calm ? this.burst * 0.08 : this.burst * this.burst * 0.35;
    U.uRing.value = 4 - (Math.floor(b) % 5);
    const target = pal || IDLE_PAL.map((c, i) => { const j = (i + Math.floor(T / 14)) % 3, n = (j + 1) % 3, w = smooth((T % 14) / 14 * 3 - 2); return [0, 1, 2].map(q => IDLE_PAL[j][q] * (1 - w) + IDLE_PAL[n][q] * w); });
    U.uPal.value.forEach((v, i) => { const c = target[i]; v.x += (c[0] - v.x) * Math.min(1, dt * 2); v.y += (c[1] - v.y) * Math.min(1, dt * 2); v.z += (c[2] - v.z) * Math.min(1, dt * 2); });
    this._aimAll(dt, b / meter, kick);
    this.rampM.emissive.setRGB(U.uPal.value[0].x * 0.25, U.uPal.value[0].y * 0.25, U.uPal.value[0].z * 0.25);
    // ---- the pad, the screen
    for (let l = 0; l < 4; l++) { this.padLit[l] = Math.max(0, this.padLit[l] - dt * 4); this.recep[l] = Math.max(0, this.recep[l] - dt * 5); }
    this.PU.uLit.value.set(...this.padLit); this.SU.uRecep.value.set(...this.recep);
    const onPad = this.mode === 'idle' && this._onPad(k.v);
    this.PU.uReady.value += ((onPad || this.mode === 'select' ? 1 : 0) - this.PU.uReady.value) * Math.min(1, dt * 4);
    if (this.jud.m.visible) { this.judgeT += dt; const s = 1 + 0.25 * Math.exp(-this.judgeT * 14); this.jud.m.scale.setScalar(s); this.jud.m.material.opacity = Math.max(0, Math.min(1, 1.6 - this.judgeT * 1.6)); }
    if (this.snowT > 0) { this.snowT -= dt; const T2 = sh.truss; for (let q = 0; q < (calm ? 2 : 5); q++) { const P = U.uPal.value[q % 3]; this.puffs.emit(T2.x0 + Math.random() * (T2.x1 - T2.x0), T2.y - 0.3, T2.z - 0.5 + Math.random(), 1, { spread: 0.2, up: -0.3, out: 0.5, life: 3.2, color: q % 2 ? 0xe8f2ff : new THREE.Color(P.x / 2.4, P.y / 2.4, P.z / 2.4) }); } }
    this.puffs.update(dt);
    // ---- the camera, while dancing: from the front of the stage, low, the toy and the pad below the screen, the arches round it
    if (this.mode !== 'idle' && this.dancer === k.v) {
      const p = sh.pad, sway = calm ? 0 : Math.sin(T * 0.35) * 0.9;
      k.camClose = { at: { x: p.x + sway, y: sh.h + 1.55, z: p.z - 4.8 }, look: { x: p.x + sway * 0.3, y: sh.h + 1.85, z: p.z + 4 } };
    }
    if (this.mode === 'idle' && this.far < 30) k.once('snowball', 'The band shell. Up the ramp, onto the dance pad, and E.', 6);
  },
  // Where each head points. In a song the pattern changes every four bars: a fan over the lawn, crossing beams, all of them
  // on the toy, circles on the snow, a fan up into the sky. Idle, a slow fan. The searchlights sweep the sky.
  _aimAll(dt, bar, kick) {
    const sh = this.sh, T = this.t, live = this.lvl, calm = this.U.uCalm.value, play = this.mode === 'play';
    const pat = play ? Math.floor(bar / 4) % 5 : 0, w = (0.25 + 0.9 * live) * (calm ? 0.35 : 1), P = this.U.uPal.value;
    const M = this._am || (this._am = new THREE.Matrix4()), Q = this._aq || (this._aq = new THREE.Quaternion()), Q2 = this._aq2 || (this._aq2 = new THREE.Quaternion()), V = this._av || (this._av = new THREE.Vector3()), S = this._as || (this._as = new THREE.Vector3()), want = this._aw || (this._aw = new THREE.Vector3()), down = this._ad || (this._ad = new THREE.Vector3(0, -1, 0)), C = this._ac || (this._ac = new THREE.Color()), E = this._ae || (this._ae = new THREE.Euler());
    const pc = this.burst > 0.05 && !calm ? 1 : 0;
    let pool = 0;
    for (const hd of this.heads) {
      const i = hd.i, side = hd.p.x < sh.cx ? -1 : 1, p = hd.p;
      if (hd.sky) { const az = Math.sin(T * 0.13 * (calm ? 0.5 : 1) + i * 2.1) * 0.55, el = 1.15 + 0.22 * Math.sin(T * 0.21 + i); want.set(Math.cos(el) * Math.sin(az) - side * 0.15, Math.sin(el), -Math.cos(el) * Math.cos(az)); }
      else {
        if (pat === 0) want.set(p.x + Math.sin(T * w + i * 0.8) * 9 * side, 0, sh.z0 - 9 - Math.cos(T * w * 0.7 + i) * 4);
        else if (pat === 1) want.set(sh.cx - (p.x - sh.cx) * 1.7 + Math.sin(T * 1.3 + i) * 2, 0, sh.z0 - 6 - Math.sin(T * 0.9 + i * 0.5) * 4);
        else if (pat === 2) { const a = T * 1.6 + i * TAU / 6; want.set(sh.pad.x + Math.cos(a) * 2.7, sh.h, sh.pad.z + Math.sin(a) * 2.7); }      // round the toy, not on it
        else if (pat === 3) want.set(p.x + Math.cos(T * 1.7 + i * 1.05) * 4.5, 0, sh.z0 - 7 + Math.sin(T * 1.7 + i * 1.05) * 4.5);
        else want.set(p.x + (p.x - sh.cx) * 1.8 + Math.sin(T * 0.8 + i) * 3, 20, sh.z0 - 26);
        want.sub(p).normalize();
      }
      const rate = dt ? Math.min(1, dt * (calm ? 1.5 : 4)) : 1;
      hd.dir.lerp(want, rate).normalize();
      const d = hd.dir, pan = Math.atan2(d.x, d.z), tilt = Math.acos(Math.max(-1, Math.min(1, -d.y)));
      Q.setFromEuler(E.set(0, pan, 0)); if (!hd.hang) Q.multiply(Q2.setFromEuler(E.set(Math.PI, 0, 0)));
      this.yokes.setMatrixAt(i, M.compose(p, Q, S.set(1, 1, 1)));
      Q.setFromUnitVectors(down, d);
      V.copy(p).addScaledVector(down, hd.hang ? 0.3 : -0.3); this.hbody.setMatrixAt(i, M.compose(V, Q, S.set(1, 1, 1)));
      const o = V.addScaledVector(d, 0.21);
      this.lens.setMatrixAt(i, M.compose(o, Q, S.set(1, 1, 1)));
      // colour: the palette, livelier on the beat; white on a milestone; in the pattern on the toy, near white
      const c = P[i % 3], br = hd.sky ? 0.3 + 0.25 * live : (0.32 + 0.45 * live + 0.35 * kick * live);
      C.setRGB(c.x, c.y, c.z).multiplyScalar(br / 2.4);
      const Wt = this._wt || (this._wt = new THREE.Color());
      if (pat === 2 && play && !hd.sky) C.lerp(Wt.setRGB(br, br, br * 1.05), 0.35);
      if (pc) C.lerp(Wt.setRGB(1.2, 1.2, 1.25), this.burst);
      this.beams.instanceColor.setXYZ(i, C.r, C.g, C.b); this.lens.instanceColor.setXYZ(i, C.r * 8 + 0.4, C.g * 8 + 0.4, C.b * 8 + 0.4);
      // how long the beam is: to the ground (or the deck), or its full reach
      let len = hd.len;
      if (d.y < -0.05) { const tg = (o.y - 0) / -d.y; const hx = o.x + d.x * tg, hz = o.z + d.z * tg; let ty = 0, tt = tg; if (hx > sh.x0 && hx < sh.x1 && hz > sh.z0 && hz < sh.z1) { tt = (o.y - sh.h) / -d.y; ty = sh.h; } if (tt < len) { len = tt; const r = tt * hd.spread * 1.35 + 0.4; this.pools.setMatrixAt(pool, M.compose(V.set(o.x + d.x * tt, ty + 0.03, o.z + d.z * tt), Q.identity(), S.set(r * 2, 1, r * 2))); this.pools.instanceColor.setXYZ(pool, C.r * 0.9, C.g * 0.9, C.b * 0.9); pool++; } }
      Q.setFromUnitVectors(down, d);
      this.beams.setMatrixAt(i, M.compose(o, Q, S.set(len * hd.spread, len, len * hd.spread)));
    }
    for (; pool < 6; pool++) this.pools.setMatrixAt(pool, M.makeScale(0, 0, 0));
    this.fixedPools.forEach(([x, z, r], j) => { const c = P[j % 3], br = (0.1 + 0.22 * live + 0.15 * kick * live) / 2.4; this.pools.setMatrixAt(6 + j, M.compose(V.set(x, 0.035, z), Q.identity(), S.set(r * 2, 1, r * 2))); this.pools.instanceColor.setXYZ(6 + j, c.x * br, c.y * br, c.z * br); });
    // the cans' lenses take the wash's colour where they stand
    this.cans.forEach(([x], j) => { const X = (x - sh.cx) / 14, c = this._palAt(0.5 + X * 0.45 + T * 0.012); this.canLens.setColorAt(j, C.setRGB(c[0] * 1.6, c[1] * 1.6, c[2] * 1.6)); });
    for (const m of [this.yokes, this.hbody, this.lens, this.beams, this.pools]) m.instanceMatrix.needsUpdate = true;
    this.beams.instanceColor.needsUpdate = true; this.pools.instanceColor.needsUpdate = true; this.lens.instanceColor.needsUpdate = true; this.canLens.instanceColor.needsUpdate = true;
  },
  _palAt(x) { const P = this.U.uPal.value; x = ((x % 1) + 1) % 1 * 3; const i = Math.floor(x), f = smooth(x - i), a = P[i % 3], b = P[(i + 1) % 3]; return [a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, a.z + (b.z - a.z) * f]; },

  // ============================================================ the words on the screen
  _txt(c, s, x, y, px, col, { weight = 800, align = 'center', glow = 18, italic = false, max = 0 } = {}) {
    c.font = `${italic ? 'italic ' : ''}${weight} ${px}px ${FONT}`; c.textAlign = align; c.textBaseline = 'middle';
    if (max) { const w = c.measureText(s).width; if (w > max) c.font = `${italic ? 'italic ' : ''}${weight} ${Math.floor(px * max / w)}px ${FONT}`; }
    c.shadowColor = col; c.shadowBlur = glow; c.fillStyle = col; c.fillText(s, x, y); c.shadowBlur = 0;
  },
  _drawIdle() {
    const { c, cv, t } = this.over, W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
    this._txt(c, 'SNOW BALL', W / 2, H * 0.4, 150, '#e9f4ff', { italic: true, glow: 30 });
    this._txt(c, 'DRIVE ONTO THE PAD', W / 2, H * 0.62, 40, '#9fd8ff', { weight: 700, glow: 12 });
    t.needsUpdate = true; this.over.m.visible = true;
  },
  _drawSelect() {
    const { c, cv, t } = this.over, W = cv.width, H = cv.height, s = DANCES[this.sel.song]; c.clearRect(0, 0, W, H);
    this._txt(c, 'SNOW BALL', W / 2, 62, 46, '#bfe4ff', { italic: true, glow: 14 });
    this._txt(c, '◀', 110, 200, 70, LANE_CSS[0], { glow: 16 }); this._txt(c, '▶', W - 110, 200, 70, LANE_CSS[3], { glow: 16 });
    this._txt(c, s.title, W / 2, 196, 104, '#ffffff', { italic: true, glow: 24, max: W - 300 });
    this._txt(c, s.by, W / 2, 278, 38, '#ffd98a', { weight: 600, glow: 8 });
    LEVELS.forEach((L, i) => { const x = W / 2 + (i - 1) * 270, on = i === this.sel.level; if (on) { c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.shadowColor = '#fff'; c.shadowBlur = 14; c.strokeRect(x - 118, 350, 236, 72); c.shadowBlur = 0; } this._txt(c, L.name, x, 387, on ? 48 : 40, on ? '#ffffff' : '#7b8aa8', { glow: on ? 16 : 0 }); });
    const best = store.get(s.id + '.' + this.sel.level);
    this._txt(c, best ? `BEST  ${best.grade}  ${best.score.toLocaleString()}` : '↑ ↓ LEVEL', W / 2, 470, 34, '#9fb4d8', { weight: 600, glow: 0 });
    this._txt(c, 'E TO START', W / 2, 530, 34, '#7dffa8', { weight: 700, glow: 10 });
    t.needsUpdate = true; this.over.m.visible = true;
  },
  _drawHud() {
    const { c, cv, t } = this.hud, W = cv.width, H = cv.height, R = this.run; c.clearRect(0, 0, W, H);
    this._txt(c, R.s.title, 30, 40, 30, '#bfe4ff', { align: 'left', italic: true, glow: 8, max: 300 });
    this._txt(c, R.lv.name, 30, 78, 24, '#ffd98a', { align: 'left', weight: 700, glow: 6 });
    this._txt(c, 'SCORE', 30, H - 120, 26, '#8fa3c8', { align: 'left', weight: 700, glow: 0 });
    this._txt(c, R.score.toLocaleString(), 30, H - 76, 50, '#ffffff', { align: 'left', glow: 10 });
    if (R.combo >= 4) { this._txt(c, String(R.combo), W - 120, H * 0.5, 120, R.combo >= 50 ? '#ffe27a' : '#ffffff', { italic: true, glow: 22 }); this._txt(c, 'COMBO', W - 120, H * 0.5 + 76, 32, '#9fd8ff', { weight: 700, glow: 8 }); }
    t.needsUpdate = true;
  },
  _drawJudge(j) {
    const { c, cv, t, m } = this.jud; c.clearRect(0, 0, cv.width, cv.height);
    this._txt(c, JUDGE[j][0], cv.width / 2, cv.height / 2, 92, JUDGE[j][2], { italic: true, glow: 20 });
    t.needsUpdate = true; m.visible = true; m.material.opacity = 1;
  },
  _drawResults() {
    const { c, cv, t } = this.over, W = cv.width, H = cv.height, { R, grade, fc, isBest } = this.result; c.clearRect(0, 0, W, H);
    c.fillStyle = 'rgba(2,4,12,0.55)'; c.fillRect(0, 0, W, H);
    this._txt(c, `${R.s.title}  ·  ${R.lv.name}`, W / 2, 56, 40, '#bfe4ff', { italic: true, glow: 10, max: W - 80 });
    this._txt(c, grade[0], 250, 300, 300, grade[2], { italic: true, glow: 40 });
    this._txt(c, R.score.toLocaleString(), 640, 190, 84, '#ffffff', { glow: 16 });
    this._txt(c, `MAX COMBO  ${R.max}`, 640, 262, 36, '#9fd8ff', { weight: 700, glow: 6 });
    JUDGE.forEach(([name, , col], i) => { this._txt(c, name, 560, 330 + i * 46, 30, col, { align: 'right', weight: 700, glow: 6 }); this._txt(c, String(R.n[i]), 600, 330 + i * 46, 32, '#ffffff', { align: 'left', weight: 700, glow: 0 }); });
    if (fc) this._txt(c, 'FULL COMBO', W / 2, H - 50, 52, '#ffe27a', { italic: true, glow: 24 });
    else if (isBest) this._txt(c, 'NEW BEST', W / 2, H - 50, 44, '#7dffa8', { italic: true, glow: 16 });
    t.needsUpdate = true;
  },

  spots() { const p = this.sh && this.sh.pad; return p ? [{ kind: 'secret', id: 'snowball', name: 'Snow Ball', x: p.x, y: this.sh.h, z: p.z }] : []; },
  reset(k) { if (this.mode && this.mode !== 'idle') { this._leave(); this._drawIdle(); } },
});
