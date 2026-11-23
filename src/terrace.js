// The roof terrace of the Modern Wing's west pavilion (features.js). bridgeway.js draws its paving, pink glass and white
// pergola; this file puts things on it. There are three sculptures, all made up for the game (nobody's real work): a
// zigzag of three polished red granite wedges, a low dome of mirror-polished steel, and a bronze band that rises out of
// the paving, turns half over at the top and goes back down. All three can be driven on, or under. And there is a party,
// in full swing and paused: a secret welcome for guests from the stars (the banners, balloons, cake and the Director's
// note are in src/welcome.js). Here: tall cocktail tables in white cloths, crowded with flutes, coupes, cocktails, cups of
// green punch with little alien-head stirrers and paper hats; bar stools; a long bar with a champagne tower, an ice
// bucket, a bowl of green punch and a tray of flutes; open bottles on ice round the terrace and corks on the floor; flowers
// by the lift; and strings of lights across the pergola, turning at the posts the big banner hangs from.
//
// Everything is at real size next to a toy 0.5 m long, and the collision is the drawing: the legs are posts, the tops are
// tops, the toy fits between a table's legs and under its cloth. Bump a table and its glasses ring. Nothing is done per
// frame unless the toy is up on the terrace.
import * as THREE from 'three';
import { feature } from './features.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from './textures.js';

const canvas = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
function texture(c, { repeat = true, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8;      // (mipmapped: power-of-two canvases)
  return t;
}

// ---------------------------------------------------------------- materials

// Red granite, as quarried: an interlocking mosaic of crystals, each one a single flat colour with straight sides where
// it meets its neighbours. Most are feldspar, salmon to brick red, the big ones with a faint sheen along their cleavage;
// a quarter are quartz, smoky grey and glassy; one in ten is black mica or hornblende, gathered in clots. The grains are
// a centimetre or so across (the canvas is 0.6 m of stone), and the picture tiles. Grown as a weighted Voronoi mosaic
// on a jittered grid (each pixel takes the nearest seed), so the grains have the straight, meeting edges real ones do.
function graniteCanvas() {
  const N = 512, S = 40, cs = N / S, r = rng(91), seeds = [];
  const hsl = (h, sa, l) => { const a = sa * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); }; return [f(0), f(8), f(4)]; };
  // the clotting: a smooth tileable field, high where the dark minerals and the deeper reds gather
  const clot = (x, y) => { const u = x / N * 6.2832, v = y / N * 6.2832; return 0.5 + 0.22 * Math.sin(u * 3 + 1.3) * Math.cos(v * 2 - 0.4) + 0.16 * Math.sin(u * 5 + v * 4 + 2.1) + 0.12 * Math.cos(u * 7 - v * 6 + 0.7); };
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const x = (i + 0.15 + r() * 0.7) * cs, y = (j + 0.15 + r() * 0.7) * cs, c = clot(x, y), k = r();
    const big = r() < 0.18;                                       // the odd big feldspar crystal pushes its neighbours aside
    let rgb, w = (big ? 0.9 : r() * 0.45) * cs * cs;
    if (k < 0.03 + 0.12 * c) { const l = 18 + r() * 18; rgb = [l * 1.1, l * 0.85, l * 0.8]; w *= 0.5; big || (w *= 0.6); }       // mica, hornblende
    else if (k < 0.3 + 0.08 * c) { const l = 70 + r() * 36; rgb = [l * 1.08, l * 0.95, l * 0.93]; }                               // quartz
    else rgb = hsl(3 + r() * 12, 0.42 + r() * 0.2, (0.36 + r() * 0.2) * (1.08 - 0.22 * c));                                        // feldspar
    seeds.push({ x, y, w, rgb, a: r() * 3.1416, sh: big ? 0.06 + r() * 0.05 : r() * 0.03 });
  }
  return canvas(N, N, g => {
    const img = g.createImageData(N, N), d = img.data;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const ci = Math.floor(x / cs), cj = Math.floor(y / cs);
      let b1 = Infinity, b2 = Infinity, best = null;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ii = ci + di, jj = cj + dj, sd = seeds[((jj % S + S) % S) * S + ((ii % S + S) % S)];
        const sx = sd.x + Math.floor(ii / S) * N, sy = sd.y + Math.floor(jj / S) * N, dd = (x - sx) ** 2 + (y - sy) ** 2 - sd.w;
        if (dd < b1) { b2 = b1; b1 = dd; best = sd; } else if (dd < b2) b2 = dd;
      }
      // a fine seam where two crystals meet, and the faint sheen along a feldspar's cleavage
      const edge = Math.min(1, (b2 - b1) / (cs * 1.6)), seam = 0.9 + 0.1 * edge;
      const cl = 1 + best.sh * 0.6 * Math.sin((x * Math.cos(best.a) + y * Math.sin(best.a)) * 0.35);
      const n = 0.96 + (((Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0) % 97) / 97 * 0.08;      // a whisper of grain, so a crystal is not a flat card
      const o = (y * N + x) * 4, k = seam * cl * n;
      d[o] = Math.min(255, best.rgb[0] * k); d[o + 1] = Math.min(255, best.rgb[1] * k); d[o + 2] = Math.min(255, best.rgb[2] * k); d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}
// The same picture as a height (for the honed top, which has a tooth to it), and as a gloss (quartz and mica shine).
function greyOf(src, f) {
  const N = src.width, out = canvas(N, N, () => {}), a = src.getContext('2d').getImageData(0, 0, N, N), g = out.getContext('2d'), b = g.createImageData(N, N);
  for (let i = 0; i < a.data.length; i += 4) { const v = f((a.data[i] * 0.3 + a.data[i + 1] * 0.59 + a.data[i + 2] * 0.11) / 255); b.data[i] = b.data[i + 1] = b.data[i + 2] = Math.max(0, Math.min(255, v * 255)); b.data[i + 3] = 255; }
  g.putImageData(b, 0, 0); return out;
}

// A polished surface with no environment map to reflect: a little of a night sky added along the grazing angles, darker
// overhead and glowing pink and amber round the horizon, as the terrace's own glass and the city would be in it.
function polish(mat, k = 1) {
  mat.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <tonemapping_fragment>', `{
      vec3 pn = normalize(normal), pv = normalize(vViewPosition);
      float fr = pow(1.0 - clamp(dot(pn, pv), 0.0, 1.0), 4.0);
      vec3 rw = (vec4(reflect(-pv, pn), 0.0) * viewMatrix).xyz;
      vec3 sky = mix(vec3(0.5, 0.36, 0.48), vec3(0.03, 0.05, 0.11), smoothstep(0.0, 0.45, rw.y));
      sky = mix(sky, vec3(0.30, 0.31, 0.36), smoothstep(0.0, -0.3, rw.y));
      gl_FragColor.rgb += sky * (0.04 + 0.85 * fr) * ${k.toFixed(2)};
    }
    #include <tonemapping_fragment>`);
  };
  mat.customProgramCacheKey = () => 'polish' + k;
  return mat;
}

// A matcap: what a polished metal shows of a night on the roof, painted once (it turns with the view, so it reads as a
// reflection). Top is up. sky: gradient stops; city: lit windows round the horizon; pink: the glass screens' glow.
const MATCAPS = {
  steel: { sky: [[0, '#6a7aa0'], [0.18, '#2c3a5c'], [0.38, '#141c30'], [0.47, '#3a3050'], [0.5, '#e2a8d8'], [0.505, '#8a90a2'], [0.6, '#5a606e'], [0.8, '#30343e'], [1, '#121318']], city: 1, beams: true, skyline: true, pink: 'rgba(255,96,214,0.55)', hi: 1, rim: 'rgba(190,205,235,0.5)' },
  chrome: { sky: [[0, '#5a6a8c'], [0.3, '#10141f'], [0.48, '#46506a'], [0.51, '#f2f4fa'], [0.54, '#5c6070'], [0.75, '#2a2c34'], [1, '#0c0d10']], city: 0.6, pink: 'rgba(255,96,214,0.3)', hi: 1, rim: 'rgba(200,210,230,0.45)' },
  bronze: { sky: [[0, '#f2cf98'], [0.22, '#b07a40'], [0.45, '#5c3519'], [0.52, '#d49a5c'], [0.58, '#6a3e1c'], [0.78, '#2e180a'], [1, '#100704']], city: 0.35, pink: null, hi: 0.75, rim: 'rgba(120,70,30,0.45)' },
  brass: { sky: [[0, '#e8d49a'], [0.26, '#9a7a34'], [0.46, '#4a3610'], [0.515, '#c8a456'], [0.57, '#5a4214'], [0.78, '#261a06'], [1, '#0c0802']], city: 0.4, pink: null, hi: 0.7, rim: 'rgba(120,90,30,0.4)' },
};
const _mc = {};
function matcap(kind) {
  if (_mc[kind]) return _mc[kind];
  const P = MATCAPS[kind], N = 256, r = rng(kind.length * 977);
  const c = canvas(N, N, g => {
    const grd = g.createLinearGradient(0, 0, 0, N); for (const [t, col] of P.sky) grd.addColorStop(t, col); g.fillStyle = grd; g.fillRect(0, 0, N, N);
    if (P.pink) { const gp = g.createLinearGradient(0, N * 0.43, 0, N * 0.53); gp.addColorStop(0, 'rgba(255,96,214,0)'); gp.addColorStop(0.45, P.pink); gp.addColorStop(1, 'rgba(255,96,214,0)'); g.fillStyle = gp; g.fillRect(0, N * 0.43, N, N * 0.1); }
    if (P.skyline) {
      // the towers round the horizon, dark against the glow, with their windows lit; a crisp bright line where the
      // horizon is; and under it the paving's joints running away
      const hy = N * 0.5;
      for (let x = -4; x < N;) { const w = 5 + r() * 16, h = 4 + r() * r() * 46; g.fillStyle = `rgb(${10 + r() * 10 | 0},${14 + r() * 10 | 0},${28 + r() * 14 | 0})`; g.fillRect(x, hy - h, w, h); for (let k = 0; k < h * w / 14; k++) if (r() < 0.55) { g.fillStyle = `rgba(255,${205 + r() * 45 | 0},${150 + r() * 70 | 0},${0.5 + r() * 0.5})`; g.fillRect(x + 1 + r() * (w - 2), hy - h + 1 + r() * (h - 2), 1, 1); } x += w + r() * 3; }
      g.fillStyle = 'rgba(255,255,255,0.95)'; g.fillRect(0, hy, N, 1.5);
      g.strokeStyle = 'rgba(20,22,30,0.55)'; g.lineWidth = 1;
      for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(N / 2 + i * 6, hy + 2); g.lineTo(N / 2 + i * 40, N); g.stroke(); }
      for (let j = 1; j < 7; j++) { const y = hy + 2 + (N - hy) * (j / 7) ** 1.8; g.beginPath(); g.moveTo(0, y); g.lineTo(N, y); g.stroke(); }
    }
    for (let i = 0; i < 300 * P.city; i++) { g.fillStyle = `rgba(255,${200 + r() * 50 | 0},${140 + r() * 80 | 0},${0.3 + r() * 0.55})`; g.fillRect(r() * N, N * (0.42 + r() * 0.1), 1 + r() * 2, 1 + r() * 2.5); }
    // the pergola's white beams overhead
    if (P.beams) { g.strokeStyle = 'rgba(235,240,250,0.75)'; for (let i = 0; i < 6; i++) { g.lineWidth = 2 + r() * 2; g.beginPath(); const x = N * (i / 5), y = N * 0.04; g.moveTo(x - N * 0.3, y); g.quadraticCurveTo(x, N * 0.25, x + N * 0.25, N * 0.42); g.stroke(); } g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, N * 0.36); g.quadraticCurveTo(N / 2, N * 0.26, N, N * 0.36); g.stroke(); }
    // the party's strings of lights overhead, sagging across the sky in it
    for (let k = 0; k < 4 * P.city; k++) { const y0 = N * (0.1 + k * 0.08), sag = N * (0.05 + r() * 0.04), ph = r() * 9; for (let i = 0; i < 26; i++) { const t = i / 25, x = t * N, y = y0 + sag * 4 * t * (1 - t) + Math.sin(t * 6 + ph) * 3; const h = g.createRadialGradient(x, y, 0, x, y, 5); h.addColorStop(0, 'rgba(255,236,190,1)'); h.addColorStop(0.3, 'rgba(255,200,120,0.6)'); h.addColorStop(1, 'rgba(255,180,90,0)'); g.fillStyle = h; g.fillRect(x - 5, y - 5, 10, 10); } }
    const hl = (x, y, rad, a) => { const h = g.createRadialGradient(x, y, 0, x, y, rad); h.addColorStop(0, `rgba(255,255,255,${a})`); h.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = h; g.fillRect(0, 0, N, N); };
    hl(N * 0.33, N * 0.27, N * 0.17, P.hi * 0.7); hl(N * 0.33, N * 0.27, N * 0.035, P.hi); hl(N * 0.74, N * 0.68, N * 0.2, P.hi * 0.18);
    const rim = g.createRadialGradient(N / 2, N / 2, N * 0.34, N / 2, N / 2, N * 0.5); rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, P.rim); g.fillStyle = rim; g.fillRect(0, 0, N, N);
  });
  return (_mc[kind] = texture(c, { repeat: false }));
}
const metal = kind => new THREE.MeshMatcapMaterial({ matcap: matcap(kind) });

// A soft dark disc, for what stands on the paving to sit in rather than float over it.
function shadowTex() {
  return texture(canvas(64, 64, g => { g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#c0c0c0'); r.addColorStop(0.55, '#606060'); r.addColorStop(1, '#000'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }), { repeat: false, srgb: false });      // (an alpha map: white is dark)
}
// White marble with grey veins, for the bar top.
function marbleTex() {
  const r = rng(515);
  return texture(canvas(512, 256, g => {
    g.fillStyle = '#ece9e2'; g.fillRect(0, 0, 512, 256);
    for (let k = 0; k < 26; k++) {
      g.strokeStyle = `rgba(${110 + r() * 50 | 0},${110 + r() * 50 | 0},${120 + r() * 50 | 0},${0.12 + r() * 0.3})`; g.lineWidth = 0.6 + r() * 2.4;
      g.beginPath(); let x = r() * 512, y = r() * 256; g.moveTo(x, y);
      for (let q = 0; q < 8; q++) { x += 20 + r() * 60; y += (r() - 0.5) * 50; g.lineTo(x, y); }
      g.stroke();
    }
  }));
}

// ---------------------------------------------------------------- shapes

// One geometry from several, each placed by a matrix (for one InstancedMesh of a thing made of parts).
function merged(list) {
  const gs = list.map(([geo, m]) => { let g = geo.index ? geo.toNonIndexed() : geo.clone(); for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv') g.deleteAttribute(n); if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (m) g.applyMatrix4(m); return g; });
  const out = mergeGeometries(gs); for (const g of gs) g.dispose(); return out;
}
const M4 = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));
// Two groups by which way each face looks: 0 upright (within ~70 degrees of level), 1 facing up or down.
function byFacing(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo; g.computeVertexNormals();
  const n = g.attributes.normal, keepA = [], keepB = [];
  for (let t = 0; t < n.count; t += 3) (Math.abs(n.getY(t) + n.getY(t + 1) + n.getY(t + 2)) / 3 < 0.35 ? keepA : keepB).push(t);
  const out = new THREE.BufferGeometry();
  for (const name of Object.keys(g.attributes)) { const a = g.attributes[name], sz = a.itemSize, arr = new Float32Array(a.count * sz); let o = 0; for (const t of [...keepA, ...keepB]) for (let v = 0; v < 3; v++) for (let c = 0; c < sz; c++) arr[o++] = a.array[(t + v) * sz + c]; out.setAttribute(name, new THREE.BufferAttribute(arr, sz)); }
  out.addGroup(0, keepA.length * 3, 0); out.addGroup(keepA.length * 3, keepB.length * 3, 1);
  return out;
}
const lathe = (pts, seg = 16) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

// A champagne flute and a coupe, each with its wine (separate geometries, for separate materials).
const FLUTE = { glass: () => lathe([[0.001, 0], [0.032, 0.002], [0.032, 0.006], [0.004, 0.01], [0.004, 0.11], [0.018, 0.13], [0.025, 0.19], [0.026, 0.24], [0.024, 0.24], [0.023, 0.19], [0.016, 0.13], [0.001, 0.118]], 14),
  wine: () => lathe([[0.001, 0.12], [0.015, 0.132], [0.022, 0.18], [0.023, 0.2], [0.001, 0.2]], 12) };
const COUPE = { glass: () => lathe([[0.001, 0], [0.036, 0.002], [0.036, 0.006], [0.004, 0.01], [0.004, 0.07], [0.02, 0.078], [0.046, 0.098], [0.056, 0.118], [0.054, 0.118], [0.044, 0.1], [0.02, 0.082], [0.001, 0.08]], 16),
  wine: () => lathe([[0.001, 0.081], [0.02, 0.085], [0.042, 0.1], [0.048, 0.108], [0.001, 0.108]], 14) };
// A cocktail glass (a cone on a stem) and its drink; a punch cup; a stirrer with a little green alien head on it (eyes
// and all); a paper party hat and its pompom.
const MARTINI = { glass: () => lathe([[0.001, 0], [0.034, 0.002], [0.034, 0.006], [0.004, 0.01], [0.004, 0.09], [0.055, 0.155], [0.053, 0.157], [0.002, 0.094]], 16),
  drink: () => lathe([[0.001, 0.096], [0.042, 0.14], [0.001, 0.14]], 14) };
const CUP = { glass: () => lathe([[0.001, 0], [0.024, 0], [0.026, 0.004], [0.031, 0.068], [0.029, 0.068], [0.024, 0.006], [0.001, 0.006]], 14),
  punch: () => lathe([[0.001, 0.007], [0.024, 0.008], [0.028, 0.05], [0.001, 0.05]], 12) };
const STIR = { stick: () => new THREE.CylinderGeometry(0.0016, 0.0016, 0.12, 5).translate(0, 0.06, 0),
  head: () => merged([[new THREE.SphereGeometry(0.011, 10, 8).scale(1, 1.15, 0.9).translate(0, 0.127, 0)], [new THREE.CylinderGeometry(0.0008, 0.0008, 0.01, 4).translate(0.004, 0.142, 0).rotateZ(-0.03)], [new THREE.CylinderGeometry(0.0008, 0.0008, 0.01, 4).translate(-0.004, 0.142, 0).rotateZ(0.03)]]),
  eyes: () => merged([-1, 1].map(s => [new THREE.SphereGeometry(0.0034, 6, 4).scale(1.3, 0.8, 0.6), M4(s * 0.0045, 0.128, 0.0088, 0, 0, s * 0.4)])) };
const HAT = { cone: () => new THREE.ConeGeometry(0.05, 0.15, 18, 1, true).translate(0, 0.075, 0), pom: () => new THREE.SphereGeometry(0.013, 8, 6).translate(0, 0.152, 0) };
const HAT_COLS = ['#4fc8ff', '#6dff9e', '#ffe35c', '#ff8a4c', '#d78cff'];      // the call's five colours (src/motif.js)
function hatTex() {      // white card with paler stripes and stars, tinted per hat
  return texture(canvas(128, 64, g => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 64);
    g.fillStyle = 'rgba(0,0,0,0.28)'; for (let x = -64; x < 128; x += 22) { g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 10, 64); g.lineTo(x + 44, 0); g.lineTo(x + 34, 0); g.fill(); }
    g.fillStyle = '#fff8d0'; for (let i = 0; i < 6; i++) { const x = 10 + i * 21, y = 40 - (i % 2) * 14; g.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, rr = j % 2 ? 2.2 : 5; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
  }));
}
// A wine bottle's shape, 0.3 m tall; scaled for the others.
const bottle = (shoulder = 0.21, neck = 0.0135) => lathe([[0.001, 0], [0.036, 0], [0.038, 0.01], [0.038, shoulder], [0.03, shoulder + 0.03], [neck + 0.002, shoulder + 0.065], [neck, 0.29], [neck + 0.003, 0.296], [0.001, 0.3]], 16);

// ---------------------------------------------------------------- the feature

feature({
  id: 'terrace',
  init(k) {
    const T = k.museum.mw && k.museum.mw.terrace; if (!T) return;
    this.T = T;
    const py = T.y, X = u => T.x0 + u, Z = w => T.z0 + w, O = k.plan.obstacles, RS = k.plan.roofs || k.plan.surfaces;
    const g = this.group = new THREE.Group(); k.group.add(g);
    const keep = m => { m.matrixAutoUpdate = false; m.updateMatrix(); g.add(m); return m; };
    const post = (x0, x1, z0, z1, y0, y1, extra) => O.push({ x0, x1, z0, z1, y0: py + y0, y1: py + y1, ...extra });
    // A round top to land on: its height inside the circle, nothing outside it.
    const roundTop = (cx, cz, r, h, thick, skin = 'table') => RS.push({ skin, x0: cx - r, x1: cx + r, z0: cz - r, z1: cz + r, axis: null, h0: py + h, h1: py + h, thick, roof: true, fixed: true, fn: (x, z) => ((x - cx) ** 2 + (z - cz) ** 2 <= r * r ? py + h : -Infinity) });
    const shadows = [];      // [x, z, sx, sz, opacity-ish scale]
    this.sculptures(k, { T, py, X, Z, O, RS, keep, post, shadows });
    this.party(k, { T, py, X, Z, O, RS, keep, post, roundTop, shadows });
    // The shadows, all in one mesh, a hair over the paving (which is itself 4 mm up, pulled forward).
    { const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
      const parts = shadows.map(([x, z, sx, sz, ry = 0]) => [geo, new THREE.Matrix4().compose(new THREE.Vector3(x, py + 0.006, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, 1, sz))]);
      const sm = keep(new THREE.Mesh(merged(parts), new THREE.MeshBasicMaterial({ alphaMap: shadowTex(), transparent: true, depthWrite: false, opacity: 0.6, color: 0x000000, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })));
      sm.renderOrder = 1; }
    this.cool = 0; this.lastSp = 0; this.t = 0;
  },

  // ------------------------------------------------------------ three sculptures
  sculptures(k, { py, X, Z, O, RS, keep, post, shadows }) {
    // A zigzag of polished red granite: three wedges leaning on one another, the sawn sides polished, the tops honed
    // (paler, with a tooth). Each wedge is a ramp, exactly as drawn: up the long one and off the high end, northwards.
    {
      const gc = graniteCanvas(), map = texture(gc), rough = texture(greyOf(gc, v => 0.38 - v * 0.3), { srgb: false }), bump = texture(greyOf(gc, v => v), { srgb: false });
      for (const t of [map, rough, bump]) t.repeat.set(1 / 0.6, 1 / 0.6);      // the canvas is 0.6 m of stone
      const sides = polish(new THREE.MeshStandardMaterial({ map, roughnessMap: rough, roughness: 1, metalness: 0, emissiveMap: map, emissive: new THREE.Color(0.62, 0.5, 0.5), emissiveIntensity: 0.5 }), 0.9);
      const tops = new THREE.MeshStandardMaterial({ map, color: new THREE.Color(1.25, 1.15, 1.12), roughness: 0.7, bumpMap: bump, bumpScale: 0.5, emissiveMap: map, emissive: new THREE.Color(0.66, 0.54, 0.54), emissiveIntensity: 0.6 });
      const xa = X(8.2), W = 1.5, z0 = Z(13.0);
      // [from, to along the run (north to south), height at each end, sideways shift, bevel]. The south wedge comes down to
      // 2 cm, so a wheel can climb onto it (each 8 cm of it may rise no more than the 9 cm a wheel climbs).
      const wedges = [[0, 1.1, 1.2, 0.25, 0, 0.012], [1.1, 2.1, 0.25, 0.9, 0.14, 0.012], [2.1, 3.4, 0.9, 0.02, 0.05, 0.006]], geos = [];
      for (const [s0, s1, hA, hB, dx, b] of wedges) {
        const m = (hB - hA) / (s1 - s0), dy = b * Math.sqrt(1 + m * m);
        const shape = new THREE.Shape([new THREE.Vector2(s0 + b, b), new THREE.Vector2(s1 - b, b), new THREE.Vector2(s1 - b, hA + m * (s1 - b - s0) - dy), new THREE.Vector2(s0 + b, hA + m * b - dy)]);
        const geo = new THREE.ExtrudeGeometry(shape, { depth: W - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 1 });
        // shape x runs south (world z), shape y is up, the extrusion runs west (world -x): turned a quarter about y.
        geo.rotateY(-Math.PI / 2); geo.translate(xa + dx + W - b, py, z0);
        geos.push(geo);
        RS.push({ skin: 'stone', x0: xa + dx, x1: xa + dx + W, z0: z0 + s0, z1: z0 + s1, axis: 'z', h0: py + hA, h1: py + hB, base: py, roof: true, fixed: true });
        shadows.push([xa + dx + W / 2, z0 + (s0 + s1) / 2, W + 0.35, s1 - s0 + 0.3]);
      }
      keep(new THREE.Mesh(byFacing(mergeGeometries(geos)), [sides, tops]));      // the upright faces polished, the sloping tops honed
    }
    // A low dome of mirror-polished stainless steel, like a drop of mercury on the paving. Drive over it.
    {
      const R = 1.5, H = 0.55, Rs = (R * R + H * H) / (2 * H), cx = X(11.9), cz = Z(16.6);
      const cap = d => Math.sqrt(Math.max(0, Rs * Rs - d * d)) - (Rs - H);
      const prof = [[R + 0.03, -0.015]]; for (let i = 0; i <= 28; i++) { const d = R * (1 - i / 28); prof.push([Math.max(d, 0.0005), cap(d)]); }
      const dome = keep(new THREE.Mesh(lathe(prof, 72), metal('steel'))); dome.position.set(cx, py, cz); dome.updateMatrix();
      RS.push({ skin: 'deck', x0: cx - R, x1: cx + R, z0: cz - R, z1: cz + R, axis: null, h0: py + H, h1: py + H, base: py, roof: true, fixed: true, fn: (x, z) => { const d = Math.hypot(x - cx, z - cz); return d < R ? py + cap(d) : py; } });
      shadows.push([cx, cz, 2 * R + 0.5, 2 * R + 0.5]);
    }
    // A band of bronze that springs out of the paving, climbs into a tall arch and turns half over on the way, so it is
    // edge-on at the top and broad at both feet; it leans a little east. Drive through it. Each stretch of it is solid
    // where it is drawn.
    {
      const A = 1.0, B = 1.8, aw = 0.13, ct = 0.038, lean = 0.12, cx = X(3.0), cz = Z(8.6), N = 40, M = 16;
      const sec = []; for (let j = 0; j < M; j++) { const s = (j / M) * Math.PI * 2, c = Math.cos(s), sn = Math.sin(s); sec.push([aw * Math.sign(c) * Math.abs(c) ** 0.35, ct * Math.sign(sn) * Math.abs(sn) ** 0.35]); }
      const pos = [], idx = [], ring = [];
      for (let i = 0; i <= N; i++) {
        const t = -0.035 + (i / N) * (Math.PI + 0.07), p = A * Math.cos(t), y = B * Math.sin(t), nl = Math.hypot(B * Math.cos(t), A * Math.sin(t)), np = B * Math.cos(t) / nl, ny = A * Math.sin(t) / nl;
        const phi = Math.max(0, Math.min(Math.PI, t)), cp = Math.cos(phi), sp = Math.sin(phi), pts = [];
        for (const [su, sv] of sec) {
          // across the band: u along (cos phi * in-plane normal + sin phi * the plane's normal), v at right angles
          const lp = p + su * cp * np - sv * sp * np, ly = y + su * cp * ny - sv * sp * ny, lq = su * sp + sv * cp;
          const yy = ly * Math.cos(lean) - lq * Math.sin(lean), qq = ly * Math.sin(lean) + lq * Math.cos(lean);
          const wx = cx + qq, wy = py + yy, wz = cz + lp; pos.push(wx, wy, wz); pts.push([wx, wy, wz]);
        }
        ring.push(pts);
      }
      for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * M + j, b2 = i * M + (j + 1) % M, c = a + M, d = b2 + M; idx.push(a, b2, c, b2, d, c); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      keep(new THREE.Mesh(geo, metal('bronze')));
      for (let i = 0; i < N; i++) {
        const pts = [...ring[i], ...ring[i + 1]];
        const lo = Math.max(py, Math.min(...pts.map(q => q[1]))), hi = Math.max(...pts.map(q => q[1])); if (hi <= py) continue;
        O.push({ x0: Math.min(...pts.map(q => q[0])), x1: Math.max(...pts.map(q => q[0])), z0: Math.min(...pts.map(q => q[2])), z1: Math.max(...pts.map(q => q[2])), y0: lo, y1: hi });
      }
      for (const s of [-1, 1]) shadows.push([cx, cz + s * A, 0.5, 0.7]);
    }
  },

  // ------------------------------------------------------------ the party
  party(k, { py, X, Z, O, RS, keep, post, roundTop, shadows }) {
    const cloth = new THREE.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.92, emissive: 0xc8c4bc, emissiveIntensity: 0.58, side: THREE.DoubleSide });
    const chrome = metal('chrome'), brass = metal('brass');
    const glassM = new THREE.MeshStandardMaterial({ color: 0xdfeeff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.32, emissive: 0x6a7c90, emissiveIntensity: 0.5, depthWrite: false });
    const wineM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.82, 0.42) });
    const punchM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.18, 0.95, 0.32) });      // the alien green of the call's second note
    const seatM = new THREE.MeshStandardMaterial({ color: 0x1b1d24, roughness: 0.55, emissive: 0x15171e, emissiveIntensity: 0.6 });
    polish(seatM, 0.6);
    const inst = (geo, mat, mats) => { const m = new THREE.InstancedMesh(geo, mat, mats.length); mats.forEach((q, i) => m.setMatrixAt(i, q)); m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); m.matrixAutoUpdate = false; this.group.add(m); return m; };

    // Tall cocktail tables: a round top 0.72 m across at 1.1 m, under a white cloth that hangs a hand's breadth, on four
    // slim chrome legs 0.48 m apart (the toy, 0.38 m wide, goes between any two). Two or three stools at each.
    const TR = 0.36, TH = 1.1, LEG = 0.24, LR = 0.016;
    const tables = [[7.0, 6.6, 0.2, [0.6, 3.6]], [10.3, 5.5, 0.9, [2.2, 4.4]], [11.4, 9.6, 0.4, [1.1, 3.9, 5.4]], [6.6, 10.2, 1.3, [0.3, 3.3]], [12.3, 12.6, 0.1, [2.6, 4.9]]];
    const clothGeo = (() => {      // a square cloth over the round top: it falls a hand's breadth at the sides and to points at the corners
      const pos = [], idx = [], NA = 64, rows = 6, S = 0.56, ry0 = 0.3;
      for (let v = 0; v <= rows; v++) for (let a = 0; a < NA; a++) {
        const th = (a / NA) * Math.PI * 2 + ry0, edge = S / Math.max(Math.abs(Math.cos(th - ry0)), Math.abs(Math.sin(th - ry0))), hang = edge - TR, f = v / rows;
        const fold = f * (0.012 * Math.sin(th * 16) + 0.006 * Math.sin(th * 37 + 1));
        const r = TR + 0.012 + f * f * 0.05 + fold, y = TH + 0.004 - f * hang * 0.98 - (v ? 0.006 : 0);
        pos.push(Math.cos(th) * r, y, Math.sin(th) * r);
      }
      for (let v = 0; v < rows; v++) for (let a = 0; a < NA; a++) { const p = v * NA + a, q = v * NA + (a + 1) % NA; idx.push(p, q, p + NA, q, q + NA, p + NA); }
      const skirt = new THREE.BufferGeometry(); skirt.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); skirt.setIndex(idx); skirt.computeVertexNormals();
      const top = new THREE.CylinderGeometry(TR + 0.012, TR + 0.012, 0.012, NA, 1, false).translate(0, TH - 0.002, 0);
      return merged([[top], [skirt]]);
    })();
    const legGeo = merged([[new THREE.CylinderGeometry(LR, LR, TH - 0.04, 10).translate(0, (TH - 0.04) / 2, 0)], [new THREE.CylinderGeometry(LR + 0.008, LR + 0.01, 0.012, 10).translate(0, 0.006, 0)]]);
    const legs4 = merged([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => [legGeo, M4(sx * LEG, 0, sz * LEG)]).concat([[new THREE.CylinderGeometry(0.35, 0.35, 0.02, 24).translate(0, TH - 0.03, 0)]]));
    // Stools: a black leather seat at 0.76 m on four brass legs with a foot ring.
    const SH = 0.76, SL = 0.12;
    const stoolMetal = merged([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => [new THREE.CylinderGeometry(0.011, 0.011, SH - 0.05, 8).translate(sx * SL, (SH - 0.05) / 2, sz * SL)]).concat([[new THREE.TorusGeometry(SL * 1.414, 0.008, 6, 28).rotateX(Math.PI / 2).translate(0, 0.3, 0)], [new THREE.CylinderGeometry(0.15, 0.15, 0.015, 20).translate(0, SH - 0.06, 0)]]));
    const seatGeo = merged([[new THREE.CylinderGeometry(0.175, 0.165, 0.06, 28).translate(0, SH - 0.03, 0)], [new THREE.TorusGeometry(0.165, 0.012, 6, 28).rotateX(Math.PI / 2).translate(0, SH, 0)]]);
    const tMats = [], lMats = [], sMats = [], fl = [], vo = [], tCoupe = [], tMart = [], cups = [], stirs = [], hats = [], hatCol = [];
    this.tables = [];
    for (const [u, w, ry, stools] of tables) {
      const cx = X(u), cz = Z(w), m = M4(cx, py, cz, 0, ry); tMats.push(m); lMats.push(m);
      const legs = [];
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const lx = cx + (sx * Math.cos(ry) + sz * Math.sin(ry)) * LEG, lz = cz + (-sx * Math.sin(ry) + sz * Math.cos(ry)) * LEG, e = LR + 0.004;
        const o = { x0: lx - e, x1: lx + e, z0: lz - e, z1: lz + e, y0: py, y1: py + TH - 0.03 }; O.push(o); legs.push(o);
      }
      roundTop(cx, cz, TR + 0.012, TH + 0.008, 0.05);
      shadows.push([cx, cz, 1.0, 1.0]);
      for (const a of stools) {
        const sx = cx + Math.cos(a) * 0.66, sz = cz + Math.sin(a) * 0.66, sr = a + 0.4;
        sMats.push(M4(sx, py, sz, 0, sr));
        for (const [qx, qz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const lx = sx + (qx * Math.cos(sr) + qz * Math.sin(sr)) * SL, lz = sz + (-qx * Math.sin(sr) + qz * Math.cos(sr)) * SL; O.push({ x0: lx - 0.014, x1: lx + 0.014, z0: lz - 0.014, z1: lz + 0.014, y0: py, y1: py + SH - 0.05 }); }
        roundTop(sx, sz, 0.187, SH, 0.07, 'bench');
        shadows.push([sx, sz, 0.55, 0.55]);
      }
      // on the cloth: two flutes and a candle in a glass, kept to one side; solid, as they stand
      const at = (ix, iz) => [cx + ix * Math.cos(ry) + iz * Math.sin(ry), py + TH + 0.008, cz - ix * Math.sin(ry) + iz * Math.cos(ry)];
      const items = [[0.13, 0.05], [0.04, 0.15]], base = [];
      for (const [ix, iz] of items) { fl.push(at(ix, iz)); base.push(fl.length - 1); }
      vo.push(at(-0.08, -0.06));
      const its = [...base.map(i => fl[i]), vo[vo.length - 1]];
      O.push({ x0: Math.min(...its.map(q => q[0])) - 0.035, x1: Math.max(...its.map(q => q[0])) + 0.035, z0: Math.min(...its.map(q => q[2])) - 0.035, z1: Math.max(...its.map(q => q[2])) + 0.035, y0: py + TH, y1: py + TH + 0.25 });
      // and the party round them, left as it was when everyone stepped away (small, and not solid): a coupe, a cocktail,
      // two cups of green punch each with its stirrer, a paper hat standing and one knocked over
      const n = this.tables.length;
      tCoupe.push(M4(...at(0.2, -0.12), 0, n));
      tMart.push(M4(...at(-0.05, 0.25), 0, n * 2));
      for (const [ix, iz] of [[-0.24, 0.08], [0.02, -0.24]]) { const p = at(ix, iz); cups.push(M4(...p, 0, n + ix * 9)); stirs.push(M4(p[0] + 0.012, p[1] + 0.02, p[2], 0.32, n * 1.7 + iz * 11, 0.18)); }
      hats.push(M4(...at(-0.22, -0.17), 0, n)); hatCol.push(HAT_COLS[n % HAT_COLS.length]);
      { const p = at(0.26, 0.17); hats.push(M4(p[0], p[1] + 0.05, p[2], 1.9, ry + n, 0)); hatCol.push(HAT_COLS[(n + 2) % HAT_COLS.length]); }
      this.tables.push({ x: cx, z: cz, legs, flutes: base, wob: 0, cool: 0 });
    }
    inst(clothGeo, cloth, tMats); inst(legs4, chrome, lMats);
    inst(stoolMetal, brass, sMats); inst(seatGeo, seatM, sMats);

    // ---- the bar, along the east rail: black lacquer banded in brass, a white marble top, a brass foot rail. (Long enough
    // for the welcome cake and the punch as well as the champagne, and short of the pergola post to its south, so the toy
    // can still get round behind it.)
    const bx0 = X(13.85), bx1 = X(14.4), bz0 = Z(6.0), bz1 = Z(9.2), BH = 1.08, P = k.parts();
    const lacquer = polish(new THREE.MeshStandardMaterial({ color: 0x0d0e12, roughness: 0.3, emissive: 0x0a0b10, emissiveIntensity: 0.6 }), 1.2);
    const mt = marbleTex(); mt.repeat.set(1.2, 0.6);
    const marbleM = polish(new THREE.MeshStandardMaterial({ map: mt, roughness: 0.25, emissiveMap: mt, emissive: new THREE.Color(0.62, 0.62, 0.64), emissiveIntensity: 0.55 }), 0.7);
    const kick = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.9 });
    const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const bcx = (bx0 + bx1) / 2, bcz = (bz0 + bz1) / 2, bl = bz1 - bz0;
    P.add(box(bx1 - bx0 - 0.06, 0.1, bl - 0.06), kick, bcx + 0.03, py + 0.05, bcz);
    P.add(box(bx1 - bx0, BH - 0.14, bl), lacquer, bcx, py + 0.1 + (BH - 0.14) / 2, bcz);
    for (const y of [0.24, 0.93]) P.add(box(0.012, 0.018, bl + 0.004), brass, bx0 - 0.004, py + y, bcz);
    for (let i = 1; i < 6; i++) P.add(box(0.008, BH - 0.4, 0.012), brass, bx0 - 0.003, py + 0.585, bz0 + (bl * i) / 6);
    P.add(box(bx1 - bx0 + 0.08, 0.04, bl + 0.06), marbleM, bcx - 0.03, py + BH - 0.02, bcz);
    // the foot rail: a brass tube 20 cm up and 14 cm out, on three brackets
    const fr = new THREE.CylinderGeometry(0.018, 0.018, bl - 0.16, 12).rotateX(Math.PI / 2);
    P.add(fr, brass, bx0 - 0.14, py + 0.2, bcz);
    for (const z of [bz0 + 0.1, bcz, bz1 - 0.1]) { P.add(new THREE.CylinderGeometry(0.01, 0.01, 0.14, 8).rotateZ(Math.PI / 2), brass, bx0 - 0.07, py + 0.2, z); P.add(new THREE.CylinderGeometry(0.011, 0.011, 0.2, 8), brass, bx0 - 0.14, py + 0.1, z); }
    post(bx0, bx1, bz0, bz1, 0, BH);
    post(bx0 - 0.16, bx0, bz0 + 0.06, bz1 - 0.06, 0.08, 0.22);                  // the foot rail (low enough to stop the toy)
    for (const z of [bz0 + 0.1, bcz, bz1 - 0.1]) post(bx0 - 0.155, bx0 - 0.125, z - 0.015, z + 0.015, 0, 0.22);
    RS.push({ skin: 'table', x0: bx0 - 0.07, x1: bx1 + 0.01, z0: bz0 - 0.03, z1: bz1 + 0.03, axis: null, h0: py + BH, h1: py + BH, thick: 0.06, roof: true, fixed: true });
    shadows.push([bcx - 0.1, bcz, 1.0, bl + 0.5]);
    const top = py + BH;
    // a champagne tower at the north end: coupes nine, four, one, each standing on the rims below
    const cMats = [], cx0 = bcx - 0.02, cz0 = bz0 + 0.3, sp = 0.106;
    for (let lev = 0; lev < 3; lev++) { const n = 3 - lev; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) cMats.push(M4(cx0 + (i - (n - 1) / 2) * sp, top + lev * 0.112, cz0 + (j - (n - 1) / 2) * sp)); }
    inst(COUPE.glass(), glassM, cMats); inst(COUPE.wine(), wineM, cMats);
    post(cx0 - 0.17, cx0 + 0.17, cz0 - 0.17, cz0 + 0.17, BH, BH + 0.35);
    // a silver bucket of ice with two bottles in it, and a tray of flutes
    const bkz = bz0 + 0.95;
    P.add(lathe([[0.001, 0], [0.085, 0], [0.09, 0.012], [0.108, 0.2], [0.116, 0.205], [0.112, 0.215], [0.1, 0.205], [0.08, 0.02], [0.001, 0.02]], 28), chrome, bcx, top, bkz);
    const ice = new THREE.MeshStandardMaterial({ color: 0xe8f2ff, roughness: 0.2, transparent: true, opacity: 0.85, emissive: 0x8090a8, emissiveIntensity: 0.6 }), r = rng(33);
    for (let i = 0; i < 14; i++) { const a = r() * 6.28, d = 0.02 + r() * 0.07; P.add(box(0.035, 0.03, 0.035), ice, bcx + Math.cos(a) * d, top + 0.18 + r() * 0.02, bkz + Math.sin(a) * d, r(), r(), r()); }
    const green = polish(new THREE.MeshStandardMaterial({ color: 0x0e2a16, roughness: 0.15, emissive: 0x06140a, emissiveIntensity: 0.8 }), 1.3);
    const foil = metal('brass'), label = new THREE.MeshStandardMaterial({ color: 0xf1e8d2, roughness: 0.7, emissive: 0x8a8270, emissiveIntensity: 0.5 });
    const champ = bottle(0.19, 0.014);
    for (const [dx, dz, tx] of [[-0.03, -0.02, 0.22], [0.035, 0.025, -0.25]]) {
      const m = M4(bcx + dx, top + 0.02, bkz + dz, tx, 0, tx * 0.6);
      P.add(champ, green, m); P.add(new THREE.CylinderGeometry(0.0175, 0.0175, 0.07, 12).translate(0, 0.27, 0), foil, m);
    }
    // a cut-glass bowl of green punch (it glows a little), slices of lime, a ladle, and cups beside it
    const pz = bz0 + 1.35;
    P.add(lathe([[0.001, 0], [0.06, 0], [0.065, 0.01], [0.03, 0.022], [0.03, 0.045], [0.1, 0.062], [0.155, 0.11], [0.17, 0.165], [0.164, 0.168], [0.15, 0.115], [0.095, 0.068], [0.001, 0.064]], 28), glassM, bcx, top, pz);
    P.add(lathe([[0.001, 0.067], [0.094, 0.071], [0.146, 0.115], [0.155, 0.135], [0.001, 0.135]], 24), punchM, bcx, top, pz);
    const lime = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.75, 0.95, 0.45) });
    for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4, d = 0.04 + (i % 3) * 0.035; P.add(new THREE.CylinderGeometry(0.024, 0.024, 0.006, 12), lime, bcx + Math.cos(a) * d, top + 0.136, pz + Math.sin(a) * d, 0.15 * (i % 2), 0, 0.1); }
    P.add(new THREE.CylinderGeometry(0.006, 0.006, 0.3, 8), chrome, bcx + 0.07, top + 0.2, pz + 0.02, 0, 0, 0.55);
    P.add(new THREE.SphereGeometry(0.035, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), chrome, bcx - 0.005, top + 0.11, pz + 0.02);
    for (const dz of [-0.26, 0.26]) cups.push(M4(bx0 + 0.09, top, pz + dz, 0, dz * 7));
    post(bcx - 0.18, bcx + 0.18, pz - 0.18, pz + 0.18, BH, BH + 0.22);
    const tray = bz0 + 1.85;
    P.add(new THREE.CylinderGeometry(0.15, 0.15, 0.008, 28), chrome, bcx, top + 0.004, tray);
    const tf = []; for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; tf.push(M4(bcx + Math.cos(a) * 0.09, top + 0.008, tray + Math.sin(a) * 0.09)); }
    // bottles at the south end: two more of champagne, a gin, a whisky, a red
    const bott = bz1 - 0.47, glassG = (col, op = 0.6) => polish(new THREE.MeshStandardMaterial({ color: col, roughness: 0.1, transparent: true, opacity: op, emissive: col, emissiveIntensity: 0.35 }), 1.2);
    const kinds = [[champ, green, 1, foil], [champ, green, 1, foil], [bottle(0.16, 0.012), glassG(0x9fc6d8, 0.55), 0.95, chrome], [bottle(0.14, 0.015), glassG(0x7a3a0c, 0.85), 0.9, kick], [bottle(0.21, 0.013), glassG(0x2a0610, 0.95), 1, kick]];
    kinds.forEach(([geo, mat, s, cap], i) => {
      const x = bcx + (i % 2 ? 0.07 : -0.05), z = bott + i * 0.085, m = M4(x, top, z, 0, i, 0, s);
      P.add(geo, mat, m); P.add(new THREE.CylinderGeometry(0.0395, 0.0395, 0.08, 16).translate(0, 0.1, 0), label, m); P.add(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 10).translate(0, 0.285, 0), cap, m);
    });
    post(bcx - 0.13, bcx + 0.13, bkz - 0.13, bkz + 0.13, BH, BH + 0.36);
    post(bcx - 0.1, bcx + 0.12, bott - 0.05, bott + 0.42, BH, BH + 0.31);
    post(bcx - 0.15, bcx + 0.15, tray - 0.15, tray + 0.15, BH, BH + 0.25);
    // flutes: on the tray and on the tables, one instanced set
    this.fluteBase = [...fl.map(([x, y, z]) => M4(x, y, z)), ...tf];
    this.flG = inst(FLUTE.glass(), glassM, this.fluteBase); this.flW = inst(FLUTE.wine(), wineM, this.fluteBase);
    // the rest of the drinks on the tables: coupes, cocktails, cups of punch with alien-head stirrers; and paper hats
    inst(COUPE.glass(), glassM, tCoupe); inst(COUPE.wine(), wineM, tCoupe);
    inst(MARTINI.glass(), glassM, tMart); inst(MARTINI.drink(), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.36, 0.5) }), tMart);
    inst(CUP.glass(), glassM, cups); inst(CUP.punch(), punchM, cups);
    inst(STIR.stick(), new THREE.MeshBasicMaterial({ color: 0xe8f0f4 }), stirs); inst(STIR.head(), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.42, 1.0, 0.5) }), stirs); inst(STIR.eyes(), new THREE.MeshBasicMaterial({ color: 0x050805 }), stirs);
    { const hm = inst(HAT.cone(), new THREE.MeshBasicMaterial({ map: hatTex(), side: THREE.DoubleSide }), hats); hatCol.forEach((c, i) => hm.setColorAt(i, new THREE.Color(c).multiplyScalar(0.85))); hm.instanceColor.needsUpdate = true;
      inst(HAT.pom(), new THREE.MeshBasicMaterial({ color: 0xf4f0e8 }), hats); }
    // candles in little glasses on the tables: a flame that flickers while you are up here
    this.flame = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.0, 0.45) });
    const voG = merged([[new THREE.CylinderGeometry(0.03, 0.026, 0.07, 14, 1, true).translate(0, 0.035, 0)]]), wax = merged([[new THREE.CylinderGeometry(0.022, 0.022, 0.035, 12).translate(0, 0.018, 0)]]), fla = merged([[new THREE.SphereGeometry(0.008, 8, 6).scale(1, 2.2, 1).translate(0, 0.05, 0)]]);
    const vMats = vo.map(([x, y, z]) => M4(x, y, z));
    inst(voG, glassM, vMats); inst(wax, new THREE.MeshStandardMaterial({ color: 0xf4efe2, emissive: 0xd8b070, emissiveIntensity: 0.7 }), vMats); inst(fla, this.flame, vMats);

    // ---- flowers either side of the way from the lift: a white column, a brass urn, white roses and pink peonies
    const colM = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.6, emissive: 0x9a9890, emissiveIntensity: 0.55 });
    const leafM = new THREE.MeshStandardMaterial({ color: 0x2c5a2a, roughness: 0.8, emissive: 0x10240f, emissiveIntensity: 0.7, flatShading: true });
    const bloomM = new THREE.MeshStandardMaterial({ roughness: 0.8, flatShading: true, emissive: 0xffffff, emissiveIntensity: 0.32 });
    const bloomG = new THREE.IcosahedronGeometry(0.05, 1), leafG = new THREE.IcosahedronGeometry(0.045, 0).scale(1.6, 0.35, 0.8);
    const blooms = [], leaves = [], bc = [], rr = rng(808);
    for (const [u, w] of [[10.6, 1.0], [14.35, 1.0]]) {
      const x = X(u), z = Z(w);
      P.add(box(0.3, 0.06, 0.3), colM, x, py + 0.03, z); P.add(box(0.24, 0.86, 0.24), colM, x, py + 0.49, z); P.add(box(0.3, 0.04, 0.3), colM, x, py + 0.94, z);
      P.add(lathe([[0.001, 0], [0.06, 0], [0.065, 0.02], [0.04, 0.05], [0.05, 0.08], [0.11, 0.2], [0.125, 0.25], [0.118, 0.26], [0.001, 0.25]], 24), brass, x, py + 0.96, z);
      // a big loose dome of blooms, white roses and pink peonies, over a collar of leaves and a few trailing sprays
      for (let i = 0; i < 64; i++) {
        const a = rr() * 6.283, el = Math.acos(0.05 + rr() * 0.95), rad = 0.3 + rr() * 0.05, bx = x + Math.cos(a) * Math.sin(el) * rad, by = py + 1.24 + Math.cos(el) * rad * 0.85, bz = z + Math.sin(a) * Math.sin(el) * rad;
        blooms.push(M4(bx, by, bz, rr() * 3, rr() * 3, 0, 0.9 + rr() * 0.7)); bc.push(rr() < 0.5 ? 0xf8f6f0 : rr() < 0.6 ? 0xf2a6bc : 0xe0708f);
      }
      for (let i = 0; i < 40; i++) { const a = rr() * 6.283, rad = 0.26 + rr() * 0.12, dy = rr() * 0.2; leaves.push(M4(x + Math.cos(a) * rad, py + 1.2 + dy - (rad - 0.26) * 0.8, z + Math.sin(a) * rad, rr() - 0.5, -a, rr() * 0.8 - 0.2, 1 + rr() * 0.6)); }
      post(x - 0.15, x + 0.15, z - 0.15, z + 0.15, 0, 0.96);
      post(x - 0.4, x + 0.4, z - 0.4, z + 0.4, 1.08, 1.62);
      shadows.push([x, z, 0.75, 0.75]);
    }
    const bm = inst(bloomG, bloomM, blooms); bc.forEach((c, i) => bm.setColorAt(i, new THREE.Color(c))); bm.instanceColor.needsUpdate = true;
    inst(leafG, leafM, leaves);
    // ---- tall glass lanterns along the street screen, a candle glow in each: bronze frames, frosted panes
    {
      const glow = texture(canvas(32, 64, gg => { const lg = gg.createLinearGradient(0, 64, 0, 0); lg.addColorStop(0, '#ffcf80'); lg.addColorStop(0.35, '#ffb760'); lg.addColorStop(1, '#6a3a18'); gg.fillStyle = lg; gg.fillRect(0, 0, 32, 64); gg.fillStyle = 'rgba(255,255,255,0.35)'; gg.fillRect(14, 14, 4, 30); }), { repeat: false });
      const pane = new THREE.MeshBasicMaterial({ map: glow, color: new THREE.Color(1.15, 1.0, 0.85) }), frame = metal('bronze'), LW = 0.28, LH = 1.0;
      for (const w of [4.4, 11.4, 13.9, 16.4, 18.9]) {
        const x = X(1.0), z = Z(w);
        P.add(box(LW + 0.04, 0.05, LW + 0.04), frame, x, py + 0.025, z);
        P.add(box(LW - 0.02, LH - 0.16, LW - 0.02), pane, x, py + 0.05 + (LH - 0.16) / 2, z);
        for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.add(box(0.025, LH - 0.08, 0.025), frame, x + sx * LW / 2, py + (LH - 0.08) / 2 + 0.02, z + sz * LW / 2);
        P.add(box(LW + 0.06, 0.04, LW + 0.06), frame, x, py + LH - 0.08, z);
        P.add(new THREE.ConeGeometry(LW * 0.72, 0.14, 4, 1).rotateY(Math.PI / 4), frame, x, py + LH - 0.06 + 0.07, z);
        P.add(new THREE.TorusGeometry(0.04, 0.008, 6, 16), frame, x, py + LH + 0.04, z);
        post(x - LW / 2 - 0.03, x + LW / 2 + 0.03, z - LW / 2 - 0.03, z + LW / 2 + 0.03, 0, LH + 0.08);
        shadows.push([x, z, 0.6, 0.6]);
      }
    }
    // ---- open champagne on ice round the terrace: a chrome bucket on a stand of three legs, a bottle in it, its cork gone
    for (const [u, w] of [[13.65, 11.0], [4.6, 5.6], [4.4, 13.0]]) {
      const x = X(u), z = Z(w), sh = 0.6;
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5; P.add(new THREE.CylinderGeometry(0.008, 0.008, sh + 0.04, 8), chrome, x + Math.cos(a) * 0.15, py + sh / 2, z + Math.sin(a) * 0.15, Math.sin(a) * 0.1, 0, -Math.cos(a) * 0.1); }
      P.add(new THREE.TorusGeometry(0.105, 0.008, 6, 24).rotateX(Math.PI / 2), chrome, x, py + sh, z);
      P.add(new THREE.TorusGeometry(0.15, 0.006, 6, 24).rotateX(Math.PI / 2), chrome, x, py + 0.12, z);
      P.add(lathe([[0.001, 0], [0.085, 0], [0.09, 0.012], [0.108, 0.2], [0.116, 0.205], [0.112, 0.215], [0.1, 0.205], [0.08, 0.02], [0.001, 0.02]], 28), chrome, x, py + sh - 0.05, z);
      for (let i = 0; i < 8; i++) { const a = r() * 6.28, d = 0.02 + r() * 0.06; P.add(box(0.035, 0.03, 0.035), ice, x + Math.cos(a) * d, py + sh + 0.13 + r() * 0.02, z + Math.sin(a) * d, r(), r(), r()); }
      const m = M4(x + 0.02, py + sh - 0.02, z, 0.3, u, 0.18);
      P.add(champ, green, m); P.add(new THREE.CylinderGeometry(0.0165, 0.0175, 0.035, 12).translate(0, 0.25, 0), foil, m); P.add(new THREE.CylinderGeometry(0.0395, 0.0395, 0.08, 16).translate(0, 0.1, 0), label, m);
      post(x - 0.17, x + 0.17, z - 0.17, z + 0.17, 0, sh + 0.32);
      shadows.push([x, z, 0.55, 0.55]);
    }
    // corks that went off with a pop, where they came down (and one on the bar)
    { const cork = new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.9, emissive: 0x4a3420, emissiveIntensity: 0.6 }), cg = merged([[new THREE.CylinderGeometry(0.0115, 0.0125, 0.026, 10).translate(0, 0.013, 0)], [new THREE.CylinderGeometry(0.0155, 0.0155, 0.014, 12).translate(0, 0.033, 0)]]);
      for (const [x, z, a] of [[X(9.4), Z(3.3), 0.4], [X(12.6), Z(7.4), 2.1], [X(5.6), Z(8.3), 4.0], [X(10.2), Z(14.2), 1.2]]) P.add(cg, cork, x, py + 0.016, z, 0, a, Math.PI / 2);
      P.add(cg, cork, bx0 + 0.12, top + 0.016, bz0 + 1.62, 0, 1, Math.PI / 2); }
    P.done(this.group).forEach(m => { m.matrixAutoUpdate = false; m.updateMatrix(); });
    // where the welcome goes (src/welcome.js): the cake and the Director's note on the bar, and the tables
    this.T.party = { bar: { x0: bx0, x1: bx1, z0: bz0, z1: bz1, top }, cake: { x: bcx, z: bz0 + 2.3 }, note: { x: bx0 + 0.1, z: bz0 + 2.53 }, tables: this.tables.map(t => ({ x: t.x, z: t.z })) };

    // ---- strings of lights across the pergola, side to side and back, sagging between the beams
    {
      const yb = py + 2.95, xw = X(0.32), xe = X(14.88), ws = [0.9, 3.85, 6.8, 9.75, 12.7, 15.65, 18.6], bulbs = [], wire = [];
      for (let i = 0; i + 1 < ws.length; i++) {
        const a = i % 2 ? [xe, Z(ws[i])] : [xw, Z(ws[i])], b = i % 2 ? [xw, Z(ws[i + 1])] : [xe, Z(ws[i + 1])], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(len / 0.45), sag = 0.5;
        let prev = null;
        for (let j = 0; j <= n; j++) {
          const t = j / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, y = yb - sag * 4 * t * (1 - t);
          if (prev) wire.push(...prev, x, y, z); prev = [x, y, z];
          if (j > 0 && j < n) bulbs.push([x, y - 0.05, z]);
        }
      }
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3));
      keep(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x1c1a18 })));
      const bulbG = merged([[new THREE.SphereGeometry(0.03, 10, 8).scale(1, 1.25, 1)], [new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8).translate(0, 0.045, 0)]]);
      this.bulbM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.7, 1.25, 0.7) });
      inst(bulbG, this.bulbM, bulbs.map(([x, y, z]) => M4(x, y, z)));
      const halo = texture(canvas(64, 64, gg => { const rg = gg.createRadialGradient(32, 32, 0, 32, 32, 32); rg.addColorStop(0, 'rgba(255,220,160,1)'); rg.addColorStop(0.2, 'rgba(255,190,110,0.5)'); rg.addColorStop(1, 'rgba(255,170,80,0)'); gg.fillStyle = rg; gg.fillRect(0, 0, 64, 64); }), { repeat: false });
      const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(bulbs.flat(), 3));
      const pts = keep(new THREE.Points(hg, new THREE.PointsMaterial({ size: 0.26, map: halo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7, sizeAttenuation: true })));
      pts.renderOrder = 5;
    }
  },

  active(k) { const p = k.pos, T = this.T; return !!T && p.x > T.x0 - 1 && p.x < T.x1 + 1 && p.z > T.z0 - 1 && p.z < T.z1 + 1 && Math.abs(p.y - T.y) < 4; },

  update(dt, k) {
    this.t += dt;
    // candles breathe
    if (this.flame) { const f = 0.85 + 0.15 * Math.sin(this.t * 13) * Math.sin(this.t * 7.3 + 1); this.flame.color.setRGB(1.6 * f, 1.0 * f, 0.45 * f); }
    // Bump a table and its glasses ring and shiver.
    const p = k.pos, v = k.v, sp = Math.hypot(v.vel.x, v.vel.z), rad = (v.radius || 0.19) + 0.025;
    for (const tb of this.tables) {
      tb.cool -= dt;
      if ((p.x - tb.x) ** 2 + (p.z - tb.z) ** 2 < 0.7 && tb.cool <= 0 && this.lastSp > 0.5 && Math.abs(p.y - this.T.y) < 0.6) {
        const hit = tb.legs.some(o => { const cx = Math.max(o.x0, Math.min(o.x1, p.x)), cz = Math.max(o.z0, Math.min(o.z1, p.z)); return (p.x - cx) ** 2 + (p.z - cz) ** 2 < rad * rad; });
        if (hit) { tb.wob = 1; tb.cool = 0.8; const s = k.synth, b = 2093 + Math.random() * 300; s.note(b, 0.9, { type: 'sine', vol: 0.035 }); s.note(b * 1.5 + 37, 0.7, { type: 'sine', vol: 0.025, at: 0.05 }); s.note(b * 1.19, 0.8, { type: 'sine', vol: 0.02, at: 0.11 }); }
      }
      if (tb.wob > 0) {
        tb.wob = Math.max(0, tb.wob - dt * 1.4);
        const m = new THREE.Matrix4(), q = new THREE.Matrix4();
        tb.flutes.forEach((i, n) => { q.makeRotationAxis(_ax.set(n ? 0.3 : 1, 0, n ? 1 : 0.4).normalize(), Math.sin(this.t * 38 + n * 2) * 0.09 * tb.wob); m.multiplyMatrices(this.fluteBase[i], q); this.flG.setMatrixAt(i, m); this.flW.setMatrixAt(i, m); });
        this.flG.instanceMatrix.needsUpdate = true; this.flW.instanceMatrix.needsUpdate = true;
      }
    }
    this.lastSp = sp;
  },
});
const _ax = new THREE.Vector3();
