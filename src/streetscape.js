// What the streets are made of, seen from 40 cm up: Chicago concrete in scored slabs with tooled joints and a broom
// finish, granite kerbs with a rounded nose and a concrete gutter pan, asphalt with its aggregate, tar seams and patched
// cracks, worn and fresh paint, wet tyre tracks through the slush, salt, packed snow, footprints, manhole covers, storm
// drains, tree grates, tactile pads at the kerb ramps; and the benches and litter bins every outdoor place puts out.
//
// Every texture is painted on a canvas once, at start-up, with a normal map (and a roughness map where wet and dry
// sit side by side) baked from the same height field, and shared by every street that uses it. Nothing here runs per
// frame. The ground is laid in layers that never fight: road and pavement (polygon offset -1), the gutter pan (-2),
// metalwork (-3) and then, transparent and drawn first among the transparent things, road marks (-3), paint (-4) and
// tracks and slush (-5); each also stands a millimetre or two proud of the one under it.
//
// How the pieces are used: streets.js lays the pavements, kerbs, paint and tracks; streets.js, butlerfield.js and
// lakefront.js put out benches and bins (ParkFurniture); grounds.js, traffic.js, lakefront.js and eastside.js take the
// shared materials for what they draw themselves.

import * as THREE from 'three';
import { shrink } from './budget.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from './textures.js';

const memo = {};
// (and once a set of maps is made, the scratch canvases it was drawn on are let go at once, not whenever the garbage is
// collected: a phone counts every canvas still alive against the page)
const SCRATCH = [], KEEP = new Set();
let depth = 0;      // (one set can be made inside another: the scratch is only let go when the outermost is done)
const once = (k, f) => memo[k] || (memo[k] = (() => { depth++; let out; try { out = f(); } finally { depth--; } if (!depth) { for (const c of SCRATCH) if (!KEEP.has(c)) c.width = c.height = 0; SCRATCH.length = 0; } return out; })());

// ---------------------------------------------------------------------------------------------- the lanes --
// Where the traffic drives (traffic.js reads this, and the paint and the tracks are laid to it). Each street's lanes
// in each direction, kerb lane first.
export function trafficLanes(plan) {
  const G = plan.grounds, M = G.michigan, L = plan.lakefront, mid = (M.x0 + M.x1) / 2 - 0.1;
  const ns = {
    mich: { 1: [M.x0 + 4.6, mid - 3.2], [-1]: [M.x1 - 4, mid + 3.1] },           // clear of the cars parked along the far kerb (streets.js)
    col: { 1: [G.columbus.x0 + 4.5], [-1]: [G.columbus.x1 - 4.5] },
  };
  // Lake Shore Drive has four lanes a side (3.5 m, painted in streets.js); the traffic keeps to the middle two of each.
  if (L) ns.lsd = { 1: [L.lsd.x0 + 5.5, L.lsd.med[0] - 5.5], [-1]: [L.lsd.x1 - 5.5, L.lsd.med[1] + 5.5] };
  return { ns, ew: 2.0 };              // the cross streets: one lane each way, this far either side of the centre line
}
export const STOP_BACK = 5.0;          // how far short of a cross street the stop bar is painted (and the traffic stops): room for the crosswalk

// ------------------------------------------------------------------------------------------- canvas kit --
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; SCRATCH.push(c); return [c, c.getContext('2d', { willReadFrequently: true })]; }
function tx(c, { srgb = true, wrap = true } = {}) {
  const im = shrink(c); KEEP.add(im);
  const t = new THREE.CanvasTexture(im);      // (smaller on a phone: budget.js)
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 16;                   // (clamped to what the device has)
  return t;
}
// Tileable value noise, `cx` by `cy` cells across a w by h field, in 0..1.
function noise(w, h, cx, cy, seed) {
  const r = rng(seed), L = new Float32Array(cx * cy); for (let i = 0; i < L.length; i++) L[i] = r();
  const out = new Float32Array(w * h), X0 = new Int32Array(w), X1 = new Int32Array(w), SX = new Float32Array(w);
  for (let x = 0; x < w; x++) { const f = x / w * cx, i = Math.floor(f), t = f - i; X0[x] = i % cx; X1[x] = (i + 1) % cx; SX[x] = t * t * (3 - 2 * t); }
  for (let y = 0; y < h; y++) {
    const f = y / h * cy, j = Math.floor(f), t = f - j, sy = t * t * (3 - 2 * t), r0 = (j % cy) * cx, r1 = ((j + 1) % cy) * cx;
    for (let x = 0; x < w; x++) { const a = L[r0 + X0[x]], b = L[r0 + X1[x]], c = L[r1 + X0[x]], d = L[r1 + X1[x]], s = SX[x]; const top = a + (b - a) * s; out[y * w + x] = top + (c + (d - c) * s - top) * sy; }
  }
  return out;
}
function fbm(w, h, c0, oct, seed, { gain = 0.5, ay = 1 } = {}) {
  const out = new Float32Array(w * h); let amp = 1, tot = 0;
  for (let o = 0; o < oct; o++) { const cx = Math.min(w, c0 << o), n = noise(w, h, cx, Math.min(h, Math.max(1, Math.round(cx * ay))), seed + o * 101); for (let i = 0; i < out.length; i++) out[i] += n[i] * amp; tot += amp; amp *= gain; }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}
// A normal map from a height field (tileable), `k` the strength.
function normals(H, w, h, k) {
  const [c, g] = cv(w, h), im = g.createImageData(w, h), d = im.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const xl = (x - 1 + w) % w, xr = (x + 1) % w, yu = (y - 1 + h) % h, yd = (y + 1) % h;
    const dx = (H[y * w + xr] - H[y * w + xl]) * k, dy = (H[yd * w + x] - H[yu * w + x]) * k, l = Math.sqrt(dx * dx + dy * dy + 1), i = (y * w + x) * 4;
    d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (0.5 / l + 0.5) * 255; d[i + 3] = 255;
  }
  g.putImageData(im, 0, 0); return tx(c, { srgb: false });
}
// Read back a grey canvas as a height field in 0..1.
function grey(g, w, h) { const d = g.getImageData(0, 0, w, h).data, H = new Float32Array(w * h); for (let i = 0; i < H.length; i++) H[i] = d[i * 4] / 255; return H; }
// A wandering line (a crack), as points.
function wander(r, x, y, ang, n, step, turn) { const p = [[x, y]]; for (let i = 0; i < n; i++) { ang += (r() - 0.5) * turn; x += Math.cos(ang) * step; y += Math.sin(ang) * step; p.push([x, y]); } return p; }
function polyline(g, p) { g.beginPath(); p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
const clamp = (v, a = 0, b = 255) => (v < a ? a : v > b ? b : v);

// ------------------------------------------------------------------------------------------- the concrete --
// Sixteen slabs of sidewalk, 4 x 4, each 1.5 m square (256 px, about 6 mm to the pixel). Every slab carries half of
// the tooled joint round its edge, so any slab can sit next to any other: the pavement is laid a slab at a time, each
// drawn from the sixteen at random, turned, and tinted (slabs). u runs across the walk, the way the broom went.
const SLAB = 1.5, CELLS = 4, CPX = 256, WPX = CELLS * CPX;
function concreteMaps() {
  return once('concrete', () => {
    const W = WPX, r = rng(4417);
    const low = fbm(W, W, 4, 4, 11), broom = fbm(W, W, 6, 3, 23, { ay: 64, gain: 0.6 }), grit = fbm(W, W, 256, 1, 31);
    // Height: drawn features first (cracks, pits, gum), then the joints and the broom added per pixel.
    const [hc, hg] = cv(W, W); hg.fillStyle = '#808080'; hg.fillRect(0, 0, W, W);
    const [cc, cg] = cv(W, W);
    const tint = []; for (let i = 0; i < CELLS * CELLS; i++) tint.push([0.94 + r() * 0.1, (r() - 0.5) * 0.04, (r() - 0.5) * 0.05]);
    // Base colour, per pixel.
    const im = cg.createImageData(W, W), d = im.data, H = new Float32Array(W * W), margin = new Uint8Array(W * W);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, cx = x % CPX, cy = y % CPX, e = Math.min(cx, CPX - 1 - cx, cy, CPX - 1 - cy) + 0.5, t = tint[((y / CPX) | 0) * CELLS + ((x / CPX) | 0)];
      let h = (low[i] - 0.5) * 0.25, k = t[0] * (0.9 + low[i] * 0.2);
      if (e < 2.4) { h -= 1.0; k *= 0.42; margin[i] = 2; }                                   // the joint itself
      else if (e < 13) { const s = 1 - (e - 2.4) / 10.6; h -= 0.32 * s * s; k *= 1.03 - 0.12 * s * s; margin[i] = 1; }      // the trowelled margin either side, smooth, rounding down into it
      else { const b = broom[i] - 0.5; h += b * 0.7; k *= 1 + b * 0.26; }
      k *= 0.96 + grit[i] * 0.08;
      H[i] = h;
      const v = 158 * k; d[i * 4] = clamp(v * (1 + t[1])); d[i * 4 + 1] = clamp(v * 0.985); d[i * 4 + 2] = clamp(v * (0.95 + t[2])); d[i * 4 + 3] = 255;
    }
    cg.putImageData(im, 0, 0);
    // Aggregate showing through, and air holes.
    for (let k = 0; k < 26000; k++) { const x = r() * W, y = r() * W, s = 0.6 + r() * 1.3, lt = r() > 0.45; cg.fillStyle = lt ? `rgba(215,212,204,${0.12 + r() * 0.2})` : `rgba(60,60,62,${0.1 + r() * 0.25})`; cg.fillRect(x, y, s, s); if (!lt && r() < 0.3) { hg.fillStyle = 'rgba(0,0,0,0.5)'; hg.fillRect(x, y, s + 0.5, s + 0.5); } }
    // Cracks in a few slabs, from an edge, and old repairs.
    cg.lineCap = hg.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      const cx = (r() * CELLS | 0) * CPX, cy = (r() * CELLS | 0) * CPX, side = r() * 4 | 0, t = 20 + r() * 216;
      const [x, y, a] = [[cx + t, cy + 3, Math.PI / 2], [cx + t, cy + CPX - 3, -Math.PI / 2], [cx + 3, cy + t, 0], [cx + CPX - 3, cy + t, Math.PI]][side];
      const p = wander(r, x, y, a + (r() - 0.5) * 0.8, 18 + (r() * 20 | 0), 6, 0.9).filter(([px, py]) => px > cx + 2 && px < cx + CPX - 2 && py > cy + 2 && py < cy + CPX - 2);
      if (p.length < 3) continue;
      cg.strokeStyle = 'rgba(38,38,40,0.75)'; cg.lineWidth = 1.3; polyline(cg, p); cg.strokeStyle = 'rgba(70,70,72,0.25)'; cg.lineWidth = 4; polyline(cg, p);
      hg.strokeStyle = 'rgba(0,0,0,0.8)'; hg.lineWidth = 1.6; polyline(hg, p);
    }
    // Flattened chewing gum, Chicago's commonest pavement mark, and a few stains.
    for (let k = 0; k < 70; k++) { const x = r() * W, y = r() * W, s = 1.6 + r() * 2.6; cg.fillStyle = `rgba(${70 + r() * 30},${70 + r() * 25},${72 + r() * 25},0.85)`; cg.beginPath(); cg.ellipse(x, y, s, s * (0.7 + r() * 0.3), r() * 3, 0, 7); cg.fill(); hg.fillStyle = 'rgba(255,255,255,0.35)'; hg.beginPath(); hg.ellipse(x, y, s, s, 0, 0, 7); hg.fill(); }
    for (let k = 0; k < 9; k++) { const x = r() * W, y = r() * W, s = 12 + r() * 40; const gr = cg.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(70,66,60,0.16)'); gr.addColorStop(1, 'rgba(70,66,60,0)'); cg.fillStyle = gr; cg.beginPath(); cg.arc(x, y, s, 0, 7); cg.fill(); }
    // Salt bloom: the white tide-marks winter leaves on concrete.
    for (let k = 0; k < 22; k++) { const x = r() * W, y = r() * W, s = 14 + r() * 50; cg.strokeStyle = `rgba(236,238,240,${0.08 + r() * 0.12})`; cg.lineWidth = 2 + r() * 4; cg.beginPath(); cg.ellipse(x, y, s, s * (0.5 + r() * 0.5), r() * 3, 0, 7); cg.stroke(); const gr = cg.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(232,234,236,0.10)'); gr.addColorStop(1, 'rgba(232,234,236,0)'); cg.fillStyle = gr; cg.beginPath(); cg.arc(x, y, s, 0, 7); cg.fill(); }
    // Fold the drawn height in.
    const D = grey(hg, W, W); for (let i = 0; i < H.length; i++) H[i] += (D[i] - 0.502) * 2.2;
    // Roughness (green): smooth in the trowelled margins, rougher on the broom, wet and smooth in the joints' grime.
    const [rc, rg] = cv(W, W), ri = rg.createImageData(W, W), rd = ri.data;
    for (let i = 0; i < H.length; i++) { const v = margin[i] === 2 ? 0.7 : margin[i] === 1 ? 0.78 : 0.88 + (broom[i] - 0.5) * 0.1; rd[i * 4] = 255; rd[i * 4 + 1] = clamp(v * 255); rd[i * 4 + 2] = 0; rd[i * 4 + 3] = 255; }
    rg.putImageData(ri, 0, 0);
    return { map: tx(cc), normal: normals(H, W, W, 3.2), rough: tx(rc, { srgb: false }) };
  });
}

// ------------------------------------------------------------------------------------------- the asphalt --
// Six metres square at 6 mm to the pixel: dark binder, stones of the aggregate standing out of it where the traffic
// has worn it, oxidised grey where it is old, fine cracking. Seams, sealed cracks and patches are laid over it (road marks).
const ASPHALT_M = 6;
function asphaltMaps() {
  return once('asphalt', () => {
    const W = 1024, r = rng(911);
    const low = fbm(W, W, 3, 4, 61), mid = fbm(W, W, 24, 3, 67);
    const [cc, cg] = cv(W, W), [hc, hg] = cv(W, W);
    const im = cg.createImageData(W, W), d = im.data;
    for (let i = 0; i < W * W; i++) { const k = 0.84 + low[i] * 0.3 + (mid[i] - 0.5) * 0.1, v = 42 * k; d[i * 4] = clamp(v); d[i * 4 + 1] = clamp(v * 1.01); d[i * 4 + 2] = clamp(v * 1.06); d[i * 4 + 3] = 255; }
    cg.putImageData(im, 0, 0);
    hg.fillStyle = '#5a5a5a'; hg.fillRect(0, 0, W, W);
    // The aggregate: 110,000 stones, most of them chips of a few millimetres, a few bigger, each a little lump drawn on
    // both the colour and the height; grey, not much lighter than the binder they sit in.
    for (let k = 0; k < 110000; k++) {
      const big = r() < 0.07, x = r() * W, y = r() * W, s = big ? 1.4 + r() * 1.6 : 0.5 + r() * 0.9, a = r() * 3, e = 0.55 + r() * 0.45, v = 50 + r() * 26 + (big ? 8 : 0) + (r() < 0.004 ? 34 : 0), wr = r() < 0.4;
      const hv = 0.3 + r() * 0.4;
      for (const ox of x < 5 ? [0, W] : x > W - 5 ? [0, -W] : [0]) for (const oy of y < 5 ? [0, W] : y > W - 5 ? [0, -W] : [0]) {
        cg.fillStyle = `rgba(${v | 0},${(v * 0.99) | 0},${(v * 1.02) | 0},${wr ? 0.8 : 0.5})`; cg.beginPath(); cg.ellipse(x + ox, y + oy, s, s * e, a, 0, 7); cg.fill();
        hg.fillStyle = `rgba(255,255,255,${hv})`; hg.beginPath(); hg.ellipse(x + ox, y + oy, s, s * e, a, 0, 7); hg.fill();
      }
    }
    // Fine cracking, and dark spots of oil.
    cg.lineCap = hg.lineCap = 'round';
    for (let k = 0; k < 10; k++) { const p = wander(r, r() * W, r() * W, r() * 6.3, 20 + (r() * 30 | 0), 7, 1.0); cg.strokeStyle = 'rgba(14,15,17,0.7)'; cg.lineWidth = 1.2; polyline(cg, p); hg.strokeStyle = 'rgba(0,0,0,0.9)'; hg.lineWidth = 1.5; polyline(hg, p); }
    for (let k = 0; k < 14; k++) { const x = r() * W, y = r() * W, s = 8 + r() * 30, gr = cg.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(10,10,12,0.35)'); gr.addColorStop(1, 'rgba(10,10,12,0)'); cg.fillStyle = gr; cg.beginPath(); cg.arc(x, y, s, 0, 7); cg.fill(); }
    // A haze of road salt.
    for (let k = 0; k < 30; k++) { const x = r() * W, y = r() * W, s = 30 + r() * 90, gr = cg.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(200,204,212,0.07)'); gr.addColorStop(1, 'rgba(200,204,212,0)'); cg.fillStyle = gr; cg.beginPath(); cg.arc(x, y, s, 0, 7); cg.fill(); }
    const H = grey(hg, W, W);
    const [rc, rg] = cv(W, W), ri = rg.createImageData(W, W), rd = ri.data;
    for (let i = 0; i < H.length; i++) { const v = 0.93 - (H[i] - 0.35) * 0.35 - (1 - low[i]) * 0.08; rd[i * 4] = 255; rd[i * 4 + 1] = clamp(v * 255); rd[i * 4 + 2] = 0; rd[i * 4 + 3] = 255; }
    rg.putImageData(ri, 0, 0);
    return { map: tx(cc), normal: normals(H, W, W, 2.4), rough: tx(rc, { srgb: false }) };
  });
}

// ---------------------------------------------------------------------------- marks laid over the asphalt --
// Four columns, each 256 px wide and tiling down its length: 0 a tar seam where two passes of the paver met, 1 a sealed
// crack wandering across a lane, 2 the gutter's salt crust and slush (u = 0 at the kerb), 3 a patch (one to a quad).
function roadMarkMaps() {
  return once('roadmarks', () => {
    const W = 1024, Hh = 1024, r = rng(733), [cc, g] = cv(W, Hh), [rc, rgc] = cv(W, Hh), [hc, hg] = cv(W, Hh);
    g.clearRect(0, 0, W, Hh); rgc.fillStyle = 'rgb(255,230,0)'; rgc.fillRect(0, 0, W, Hh); hg.fillStyle = '#808080'; hg.fillRect(0, 0, W, Hh);
    g.lineCap = rgc.lineCap = hg.lineCap = 'round'; g.lineJoin = rgc.lineJoin = 'round';
    const tar = (p, w) => { g.strokeStyle = 'rgba(8,9,11,0.92)'; g.lineWidth = w; polyline(g, p); g.strokeStyle = 'rgba(30,32,36,0.5)'; g.lineWidth = w * 1.6; polyline(g, p); rgc.strokeStyle = 'rgb(255,60,0)'; rgc.lineWidth = w; polyline(rgc, p); hg.strokeStyle = 'rgba(255,255,255,0.6)'; hg.lineWidth = w; polyline(hg, p); };
    // 0: the seam, a band down the middle with a little wander, repeated top to bottom without a break.
    { const p = []; for (let y = -8; y <= Hh + 8; y += 16) p.push([128 + Math.sin(y / Hh * Math.PI * 2 * 3) * 6 + (r() - 0.5) * 4, y]); p[p.length - 1][0] = p[0][0] = 128; tar(p, 22); }
    // 1: a sealed crack, side to side down the column, with a branch or two.
    { const p = []; let x = 128; for (let y = -8; y <= Hh + 8; y += 10) { x = Math.max(40, Math.min(216, x + (r() - 0.5) * 22)); p.push([256 + x, y]); } p[0][0] = p[p.length - 1][0] = 256 + 128; tar(p, 11);
      for (let k = 0; k < 4; k++) { const s = p[(r() * (p.length - 10) | 0) + 5]; const q = wander(r, s[0], s[1], (r() < 0.5 ? 0 : Math.PI) + (r() - 0.5), 6, 9, 0.8).filter(([qx]) => qx > 270 && qx < 498); tar(q, 7); } }
    // 2: the gutter. Slush lying wet against the kerb, a crust of salt beyond it, thinning out into the lane.
    { const n = fbm(256, Hh, 4, 4, 91, { ay: 8 }), im = g.getImageData(512, 0, 256, Hh), d = im.data, ri = rgc.getImageData(512, 0, 256, Hh), rd = ri.data;
      for (let y = 0; y < Hh; y++) for (let x = 0; x < 256; x++) {
        const u = x / 255, i = (y * 256 + x) * 4, nn = n[y * 256 + x];
        const slush = Math.max(0, 1 - u / (0.18 + nn * 0.2)), salt = Math.max(0, Math.min(1, (0.9 - u) * 1.8)) * Math.max(0, nn * 1.6 - 0.35);
        const a = Math.min(1, slush * 0.85 + salt * 0.55); if (a <= 0.004) { d[i + 3] = 0; continue; }
        const wet = slush / (slush + salt + 1e-4);
        d[i] = clamp(wet * 120 + (1 - wet) * 214); d[i + 1] = clamp(wet * 126 + (1 - wet) * 216); d[i + 2] = clamp(wet * 138 + (1 - wet) * 220); d[i + 3] = a * 255;
        rd[i + 1] = clamp((wet * 0.32 + (1 - wet) * 0.95) * 255);
      }
      g.putImageData(im, 512, 0); rgc.putImageData(ri, 512, 0);
      for (let k = 0; k < 450; k++) { const x = 512 + 20 + r() * 200, y = r() * Hh; g.fillStyle = `rgba(226,228,232,${0.15 + r() * 0.3})`; g.fillRect(x, y, 1 + r() * 2, 1 + r() * 2); } }
    // 3: a patch where the road was dug up: fresher, darker asphalt, its edge run round with sealer.
    { const x0 = 768 + 14, x1 = 1024 - 14, y0 = 14, y1 = Hh - 14, k = fbm(256, 256, 8, 3, 97);
      g.fillStyle = 'rgba(28,29,32,0.9)'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${80 + r() * 40 | 0},${80 + r() * 40 | 0},${84 + r() * 40 | 0},0.35)`; g.fillRect(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 1 + r() * 1.5, 1 + r() * 1.5); }
      for (let i = 0; i < 40; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), s = 10 + k[i * 37 % k.length] * 40, gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(60,62,68,0.25)'); gr.addColorStop(1, 'rgba(60,62,68,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, 2 * s, 2 * s); }
      rgc.fillStyle = 'rgb(255,215,0)'; rgc.fillRect(x0, y0, x1 - x0, y1 - y0);
      const p = [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]; tar(p, 9); }
    const H = grey(hg, W, Hh);
    return { map: tx(cc), normal: normals(H, W, Hh, 2.0), rough: tx(rc, { srgb: false }) };
  });
}

// ------------------------------------------------------------------------------------------------ paint --
// Road paint, white (tinted yellow by its material). Left half fresh thermoplastic, crisp, beaded; right half worn
// thin by a few winters of ploughs and salt, the asphalt showing through.
function paintMap() {
  return once('paint', () => {
    const W = 128, H = 1024, r = rng(57), [c, g] = cv(W, H), im = g.createImageData(W, H), d = im.data;
    const n1 = fbm(W, H, 4, 4, 71, { ay: 8 }), n2 = fbm(W, H, 16, 3, 73, { ay: 8 }), grit = fbm(W, H, 64, 1, 79, { ay: 8 });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, half = x < 64, u = (x % 64) / 63, edge = Math.min(u, 1 - u) * 63;
      let a = Math.min(1, (edge - 1.2) / 2.2 + 0.2 + grit[i] * 0.3);                     // a slightly ragged edge
      if (half) a *= 0.94 + grit[i] * 0.06;
      else { const wear = n1[i] * 0.75 + n2[i] * 0.45; a *= Math.max(0, Math.min(1, (wear - 0.42) * 3.2)) * (0.55 + grit[i] * 0.45); }
      a = Math.max(0, Math.min(1, a));
      const v = half ? 236 + grit[i] * 16 : 214 + n2[i] * 30;
      d[i * 4] = clamp(v); d[i * 4 + 1] = clamp(v); d[i * 4 + 2] = clamp(v * 0.97); d[i * 4 + 3] = a * 255;
    }
    g.putImageData(im, 0, 0);
    for (let k = 0; k < 2500; k++) { g.fillStyle = `rgba(40,42,46,${0.2 + r() * 0.5})`; g.fillRect(r() * W, r() * H, 1, 1); }     // grit pressed into it
    const t = tx(c); t.wrapS = THREE.ClampToEdgeWrapping; return t;
  });
}

// -------------------------------------------------------------------------------------- tracks in the slush --
// One lane's width (u, 3.2 m) of what the night's traffic has done to it: two wheel paths worn down to wet black
// asphalt, and slush ridged up beside and between them. Tiles along the lane.
export const TRACK_W = 3.2;
function trackMaps() {
  return once('tracks', () => {
    const W = 256, H = 1024, [c, g] = cv(W, H), im = g.createImageData(W, H), d = im.data, [rc, rg] = cv(W, H), ri = rg.createImageData(W, H), rd = ri.data;
    const streak = fbm(W, H, 16, 3, 41, { ay: 2 }), lump = fbm(W, H, 8, 4, 43, { ay: 4 });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, u = x / (W - 1), s = streak[i], l = lump[i];
      // distance from the nearer wheel path (at 0.25 and 0.75, a little wobble), in lane widths
      const wob2 = Math.sin(y / H * Math.PI * 2 * 2) * 0.012 + (l - 0.5) * 0.02, pd = Math.min(Math.abs(u - 0.25 - wob2), Math.abs(u - 0.75 - wob2));
      const path = Math.max(0, 1 - Math.max(0, pd - 0.045) / 0.05);                       // 1 in the wheel path
      const fade = Math.min(1, u / 0.12, (1 - u) / 0.12), fs = fade * fade * (3 - 2 * fade);   // nothing at the strip's edges: it melts into the road
      const slush = Math.max(0, Math.min(1, (pd - 0.08) * 5)) * Math.max(0, Math.min(1, (l - 0.3) * 2.4));
      let r0 = 20, g0 = 22, b0 = 26, a = 0.22 * (0.6 + s * 0.6), ro = 0.32;                  // a wet sheen over the lane
      if (path > 0.01) { a = Math.max(a, path * (0.5 + s * 0.2)); ro = 0.1 + (1 - path) * 0.22; }
      if (slush > 0.02) { const k = slush, sv = 128 + l * 52; r0 = r0 * (1 - k) + sv * 0.95 * k; g0 = g0 * (1 - k) + sv * 0.97 * k; b0 = b0 * (1 - k) + sv * k; a = a * (1 - k) + k * (0.42 + s * 0.2); ro = ro * (1 - k) + 0.8 * k; }
      a *= fs;
      d[i * 4] = clamp(r0); d[i * 4 + 1] = clamp(g0); d[i * 4 + 2] = clamp(b0); d[i * 4 + 3] = clamp(a * 255);
      rd[i * 4] = 255; rd[i * 4 + 1] = clamp(ro * 255); rd[i * 4 + 2] = 0; rd[i * 4 + 3] = 255;
    }
    g.putImageData(im, 0, 0); rg.putImageData(ri, 0, 0);
    const t = tx(c), tr = tx(rc, { srgb: false }); t.wrapS = tr.wrapS = THREE.ClampToEdgeWrapping; return { map: t, rough: tr };
  });
}

// ---------------------------------------------------------------------------------- marks on the pavement --
// Four columns tiling along the walk: 0 the kerb edge, slush and salt (u = 0 at the kerb); 1 packed snow along the
// outer edge (u = 1 at the edge); 2 a trail of boot prints; 3 a scatter of rock salt and its stains.
function walkMarkMaps() {
  return once('walkmarks', () => {
    const W = 1024, H = 1024, r = rng(377), [c, g] = cv(W, H), [rc, rg] = cv(W, H), [hc, hg] = cv(W, H);
    rg.fillStyle = 'rgb(255,220,0)'; rg.fillRect(0, 0, W, H); hg.fillStyle = '#808080'; hg.fillRect(0, 0, W, H);
    const n = fbm(256, H, 4, 4, 301, { ay: 8 }), fine = fbm(256, H, 32, 2, 303, { ay: 4 });
    const col = (x0, f) => { const im = g.getImageData(x0, 0, 256, H), d = im.data, ri = rg.getImageData(x0, 0, 256, H), rd = ri.data; for (let y = 0; y < H; y++) for (let x = 0; x < 256; x++) { const i = y * 256 + x, o = f(x / 255, n[i], fine[i]); if (!o) continue; d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2]; d[i * 4 + 3] = clamp(o[3] * 255); rd[i * 4 + 1] = clamp(o[4] * 255); } g.putImageData(im, x0, 0); rg.putImageData(ri, x0, 0); };
    // 0: slush against the kerb, grey and wet; then salt crust.
    col(0, (u, nn, ff) => { const slush = Math.max(0, 1 - u / (0.15 + nn * 0.25)), salt = Math.max(0, Math.min(1, (0.85 - u) * 1.6)) * Math.max(0, nn * 1.5 - 0.3 + (ff - 0.5) * 0.4); const a = Math.min(0.95, slush * 0.9 + salt * 0.5); if (a < 0.01) return null; const w = slush / (slush + salt + 1e-4), v = w * (150 + ff * 30) + (1 - w) * 226; return [v * 0.95, v * 0.97, v, a, w * 0.3 + (1 - w) * 0.92]; });
    // 1: packed snow along the outer edge, scuffed where it meets the cleared part.
    col(256, (u, nn, ff) => { const a = Math.max(0, Math.min(1, (u - 0.25 - nn * 0.35) * 4)) ; if (a < 0.01) return null; const v = 205 + ff * 40 - (1 - u) * 30; return [v * 0.95, v * 0.97, v, a, 0.85]; });
    // 2: boot prints, left and right, in wet slush.
    { const [x0] = [512]; for (let y = 10, k = 0; y < H - 40; y += 58 + r() * 14, k++) { const x = x0 + 128 + (k % 2 ? 34 : -34) + (r() - 0.5) * 16, a = (r() - 0.5) * 0.25, alpha = 0.35 + r() * 0.35;
      g.save(); g.translate(x, y + 24); g.rotate(a); g.fillStyle = `rgba(48,52,60,${alpha})`; g.beginPath(); g.ellipse(0, -6, 11, 17, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, 12, 8.5, 10, 0, 0, 7); g.fill(); g.fillRect(-7, -2, 14, 12);
      g.strokeStyle = `rgba(210,214,222,${alpha * 0.8})`; g.lineWidth = 2.5; g.beginPath(); g.ellipse(0, -8, 13, 19, 0, 0, 7); g.stroke(); g.restore();
      rg.save(); rg.translate(x, y + 24); rg.rotate(a); rg.fillStyle = 'rgb(255,70,0)'; rg.beginPath(); rg.ellipse(0, -8, 11, 17, 0, 0, 7); rg.fill(); rg.beginPath(); rg.ellipse(0, 18, 9, 10, 0, 0, 7); rg.fill(); rg.restore();
      hg.save(); hg.translate(x, y + 24); hg.rotate(a); hg.fillStyle = 'rgba(0,0,0,0.5)'; hg.beginPath(); hg.ellipse(0, -8, 11, 17, 0, 0, 7); hg.fill(); hg.beginPath(); hg.ellipse(0, 18, 9, 10, 0, 0, 7); hg.fill(); hg.restore(); } }
    // 3: rock salt thrown about, and the white rings it dries to.
    for (let k = 0; k < 2200; k++) { const x = 768 + 8 + r() * 240, y = r() * H, s = 0.8 + r() * 1.8; g.fillStyle = `rgba(${225 + r() * 25},${215 + r() * 20},${205 + r() * 25},${0.5 + r() * 0.5})`; g.fillRect(x, y, s, s); hg.fillStyle = 'rgba(255,255,255,0.6)'; hg.fillRect(x, y, s, s); }
    for (let k = 0; k < 30; k++) { const x = 768 + 40 + r() * 176, y = r() * H, s = 10 + r() * 28; g.strokeStyle = `rgba(232,234,238,${0.15 + r() * 0.2})`; g.lineWidth = 2 + r() * 3; g.beginPath(); g.ellipse(x, y, s, s * (0.6 + r() * 0.4), r() * 3, 0, 7); g.stroke(); }
    const Hf = grey(hg, W, H);
    const t = tx(c), tr = tx(rc, { srgb: false }), tn = normals(Hf, W, H, 2.5); for (const q of [t, tr, tn]) q.wrapS = THREE.ClampToEdgeWrapping;
    return { map: t, rough: tr, normal: tn };
  });
}

// ------------------------------------------------------------------------------------------- the ironwork --
// Four 512 px cells: 0 a Chicago manhole cover, 1 a storm drain grate, 2 a tree grate, 3 a tactile warning pad.
// Colour, normal, and a roughness (green) / metalness (blue) map from the same drawing.
function fixtureMaps() {
  return once('fixtures', () => {
    const W = 1024, r = rng(1201), [c, g] = cv(W, W), [hc, hg] = cv(W, W), [oc, og] = cv(W, W);
    g.clearRect(0, 0, W, W); hg.fillStyle = '#000'; hg.fillRect(0, 0, W, W); og.fillStyle = 'rgb(255,140,200)'; og.fillRect(0, 0, W, W);
    // 0: manhole cover, cast iron, a raised grid of lugs, CITY OF CHICAGO round the rim, worn bright on top by tyres.
    { const cx = 256, cy = 256, R = 244;
      g.fillStyle = '#2c2b2a'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); hg.fillStyle = '#707070'; hg.beginPath(); hg.arc(cx, cy, R, 0, 7); hg.fill();
      g.fillStyle = '#3a3836'; g.beginPath(); g.arc(cx, cy, R - 10, 0, 7); g.fill(); hg.fillStyle = '#9a9a9a'; hg.beginPath(); hg.arc(cx, cy, R - 10, 0, 7); hg.fill();
      hg.fillStyle = '#606060'; hg.beginPath(); hg.arc(cx, cy, R - 14, 0, 7); hg.fill();
      g.save(); g.beginPath(); g.arc(cx, cy, R - 62, 0, 7); g.clip();
      for (let y = cy - R; y < cy + R; y += 26) for (let x = cx - R; x < cx + R; x += 26) { const wv = 120 + r() * 50; g.fillStyle = `rgb(${wv * 0.55 | 0},${wv * 0.53 | 0},${wv * 0.5 | 0})`; g.fillRect(x + 4, y + 4, 18, 18); hg.fillStyle = '#e0e0e0'; hg.fillRect(x + 4, y + 4, 18, 18); }
      g.restore();
      g.save(); g.translate(cx, cy); g.font = '700 30px Helvetica, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      hg.save(); hg.translate(cx, cy); hg.font = g.font; hg.textAlign = 'center'; hg.textBaseline = 'middle';
      const word = '★ CITY OF CHICAGO ★ SEWER ', n = word.length;
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; for (const [gg, col] of [[g, '#8c8680'], [hg, '#ffffff']]) { gg.save(); gg.rotate(a); gg.translate(0, -(R - 36)); gg.fillStyle = col; gg.fillText(word[i], 0, 0); gg.restore(); } }
      g.restore(); hg.restore();
      // pick holes, and a polish where the wheels go
      for (const a of [0.3, 0.3 + Math.PI]) { g.fillStyle = '#0a0a0a'; g.beginPath(); g.ellipse(cx + Math.cos(a) * (R - 80), cy + Math.sin(a) * (R - 80), 14, 7, a, 0, 7); g.fill(); hg.fillStyle = '#000'; hg.beginPath(); hg.ellipse(cx + Math.cos(a) * (R - 80), cy + Math.sin(a) * (R - 80), 14, 7, a, 0, 7); hg.fill(); }
      const gr = g.createRadialGradient(cx - 40, cy - 30, 10, cx, cy, R); gr.addColorStop(0, 'rgba(150,140,130,0.18)'); gr.addColorStop(1, 'rgba(120,80,50,0.12)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
      og.fillStyle = 'rgb(255,110,190)'; og.beginPath(); og.arc(cx, cy, R, 0, 7); og.fill(); }
    // 1: storm drain grate: a frame and bars, black water and leaves under them.
    { const x0 = 512 + 26, y0 = 26, w = 460, h = 460;
      g.fillStyle = '#34312e'; g.fillRect(x0, y0, w, h); hg.fillStyle = '#b0b0b0'; hg.fillRect(x0, y0, w, h);
      for (let k = 0; k < 11; k++) { const x = x0 + 40 + k * 36; g.fillStyle = '#050607'; g.fillRect(x, y0 + 40, 20, h - 80); hg.fillStyle = '#000'; hg.fillRect(x, y0 + 40, 20, h - 80); }
      g.fillStyle = '#34312e'; g.fillRect(x0, y0 + h / 2 - 10, w, 20); hg.fillStyle = '#b0b0b0'; hg.fillRect(x0, y0 + h / 2 - 10, w, 20);
      g.fillStyle = 'rgba(120,70,30,0.25)'; g.fillRect(x0, y0, w, h);
      g.fillStyle = '#6d6a66'; g.font = '700 26px Helvetica, Arial, sans-serif'; g.textAlign = 'center'; g.fillText('DUMP NO WASTE · DRAINS TO LAKE', x0 + w / 2, y0 + 28);
      og.fillStyle = 'rgb(255,120,180)'; og.fillRect(x0, y0, w, h); }
    // 2: tree grate: a square of iron with rings of slots round a hole, snow and earth in the hole.
    { const cx = 256, cy = 768, R = 250;
      g.fillStyle = '#2f2d2b'; g.fillRect(cx - R, cy - R, 2 * R, 2 * R); hg.fillStyle = '#a0a0a0'; hg.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      for (let ring = 0; ring < 5; ring++) { const rr = 92 + ring * 32, n = 14 + ring * 6; for (let k = 0; k < n; k++) { const a = (k + (ring % 2) * 0.5) / n * Math.PI * 2; g.save(); g.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); g.rotate(a); g.fillStyle = '#060606'; g.fillRect(-10, -5, 20, 10); g.restore(); hg.save(); hg.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); hg.rotate(a); hg.fillStyle = '#000'; hg.fillRect(-10, -5, 20, 10); hg.restore(); } }
      g.fillStyle = '#1d1712'; g.beginPath(); g.arc(cx, cy, 70, 0, 7); g.fill(); hg.fillStyle = '#202020'; hg.beginPath(); hg.arc(cx, cy, 70, 0, 7); hg.fill();
      for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(230,236,245,${0.5 + r() * 0.5})`; g.beginPath(); g.arc(cx + (r() - 0.5) * 110, cy + (r() - 0.5) * 110, 4 + r() * 12, 0, 7); g.fill(); }
      // snow lying in the outer slots
      for (let k = 0; k < 160; k++) { const a = r() * 6.3, rr = 150 + r() * 95; g.fillStyle = `rgba(225,232,242,${0.35 + r() * 0.4})`; g.beginPath(); g.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 3 + r() * 7, 0, 7); g.fill(); }
      g.strokeStyle = '#4a4744'; g.lineWidth = 8; g.strokeRect(cx - R + 4, cy - R + 4, 2 * R - 8, 2 * R - 8);
      og.fillStyle = 'rgb(255,130,170)'; og.fillRect(cx - R, cy - R, 2 * R, 2 * R); }
    // 3: tactile warning pad: safety yellow, truncated domes at 5 cm, 12 by 12.
    { const x0 = 512 + 6, y0 = 512 + 6, w = 500;
      g.fillStyle = '#c99a17'; g.fillRect(x0, y0, w, w); hg.fillStyle = '#404040'; hg.fillRect(x0, y0, w, w);
      for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) { const x = x0 + (i + 0.5) * w / 12, y = y0 + (j + 0.5) * w / 12;
        const gr = g.createRadialGradient(x - 5, y - 5, 1, x, y, 15); gr.addColorStop(0, '#f2cf55'); gr.addColorStop(0.7, '#d9a91e'); gr.addColorStop(1, '#9c7410'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill();
        const hr = hg.createRadialGradient(x, y, 4, x, y, 15); hr.addColorStop(0, '#ffffff'); hr.addColorStop(1, '#404040'); hg.fillStyle = hr; hg.beginPath(); hg.arc(x, y, 15, 0, 7); hg.fill(); }
      g.fillStyle = 'rgba(60,60,60,0.18)'; for (let k = 0; k < 900; k++) g.fillRect(x0 + r() * w, y0 + r() * w, 2, 2);      // grime
      og.fillStyle = 'rgb(255,150,0)'; og.fillRect(x0, y0, w, w); }
    const H = grey(hg, W, W);
    const t = tx(c, { wrap: false }), n = normals(H, W, W, 4.0), o = tx(oc, { srgb: false, wrap: false }); n.wrapS = n.wrapT = THREE.ClampToEdgeWrapping;
    return { map: t, normal: n, orm: o };
  });
}
// The UV rectangle of a fixture cell.
export const FIX = { manhole: [0, 0.5, 0.5, 1], drain: [0.5, 1, 0.5, 1], tree: [0, 0.5, 0, 0.5], tactile: [0.5, 1, 0, 0.5] };

// --------------------------------------------------------------------------------------------- granite --
function graniteMap() {
  return once('granite', () => {
    const W = 512, H = 128, r = rng(5150), [c, g] = cv(W, H), n = fbm(W, H, 8, 3, 515, { ay: 0.25 });
    const im = g.createImageData(W, H), d = im.data; for (let i = 0; i < W * H; i++) { const v = 150 + n[i] * 40; d[i * 4] = v; d[i * 4 + 1] = v * 0.99; d[i * 4 + 2] = v * 1.01; d[i * 4 + 3] = 255; } g.putImageData(im, 0, 0);
    for (let k = 0; k < 9000; k++) { const t = r(); g.fillStyle = t < 0.35 ? `rgba(30,30,34,${0.5 + r() * 0.4})` : t < 0.6 ? `rgba(225,222,215,${0.4 + r() * 0.4})` : `rgba(120,116,112,${0.3 + r() * 0.3})`; const s = 0.8 + r() * 2.2; g.fillRect(r() * W, r() * H, s, s * (0.6 + r() * 0.6)); }
    // the kerb's joints every metre or so, and the grime of the gutter along its foot (v = 0)
    for (let x = 0; x < W; x += 256) { g.fillStyle = 'rgba(20,20,22,0.8)'; g.fillRect(x, 0, 3, H); }
    const gr = g.createLinearGradient(0, H, 0, H * 0.55); gr.addColorStop(0, 'rgba(40,38,36,0.55)'); gr.addColorStop(1, 'rgba(40,38,36,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    return tx(c);
  });
}
// Weathered slats.
function woodMap() {
  return once('wood', () => {
    const W = 512, H = 64, r = rng(808), [c, g] = cv(W, H), n = fbm(W, H, 2, 4, 809, { ay: 4 });
    const im = g.createImageData(W, H), d = im.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, gr = Math.sin((y + n[i] * 40) * 0.9) * 0.5 + 0.5, v = 0.75 + gr * 0.18 + n[i] * 0.15; d[i * 4] = clamp(122 * v); d[i * 4 + 1] = clamp(88 * v); d[i * 4 + 2] = clamp(58 * v); d[i * 4 + 3] = 255; }
    g.putImageData(im, 0, 0);
    for (let k = 0; k < 400; k++) { g.fillStyle = `rgba(40,28,18,${r() * 0.3})`; g.fillRect(r() * W, r() * H, 4 + r() * 30, 1); }
    return tx(c);
  });
}

// ------------------------------------------------------------------------------------------- materials --
const std = o => new THREE.MeshStandardMaterial(o);
const off = f => ({ polygonOffset: true, polygonOffsetFactor: f, polygonOffsetUnits: f });
// Vertex colours tint the night glow too, not only what the light shows.
function glowByColour(mat) { mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance *= vColor.rgb;\n#endif'); }; mat.customProgramCacheKey = () => 'glowByColour'; return mat; }
const NIGHT = new THREE.Color(0.2, 0.23, 0.32);          // the cold glow everything outdoors has, so the street reads at night

function rep(t, k) { const q = t.clone(); q.repeat.set(k, k); q.needsUpdate = true; return q; }

// Pavement laid by slabs() (UVs straight into the atlas, a tint per slab in the vertex colour).
export function slabMaterial(f = -1) { return once('slab' + f, () => { const m = concreteMaps(); return winterRoad(glowByColour(std({ map: m.map, normalMap: m.normal, normalScale: new THREE.Vector2(0.8, 0.8), roughnessMap: m.rough, roughness: 1, emissiveMap: m.map, emissive: NIGHT, emissiveIntensity: 0.62, vertexColors: true, ...off(f) }))); }); }
// Pavement drawn as plain quads with world UVs of x / 2.5 (as grounds, lakefront and eastside draw them): the same concrete, 6 m to the repeat.
export function walkMaterial() { return once('walk', () => { const m = concreteMaps(), k = 2.5 / (SLAB * CELLS); return winterRoad(std({ map: rep(m.map, k), normalMap: rep(m.normal, k), normalScale: new THREE.Vector2(0.8, 0.8), roughnessMap: rep(m.rough, k), roughness: 1, emissiveMap: rep(m.map, k), emissive: NIGHT, emissiveIntensity: 0.62, ...off(-1) })); }); }
// Asphalt, for road quads with world UVs of x / 4.
export function asphaltMaterial() { return once('asphalt', () => { const m = asphaltMaps(), k = 4 / ASPHALT_M; return winterRoad(std({ map: rep(m.map, k), normalMap: rep(m.normal, k), normalScale: new THREE.Vector2(0.9, 0.9), roughnessMap: rep(m.rough, k), roughness: 1, emissiveMap: rep(m.map, k), emissive: new THREE.Color(0.42, 0.47, 0.62), emissiveIntensity: 0.62, ...off(-1) }), 'road'); }); }
export function roadMarkMaterial() { return once('roadmark', () => { const m = roadMarkMaps(); return winterRoad(std({ map: m.map, normalMap: m.normal, roughnessMap: m.rough, roughness: 1, emissiveMap: m.map, emissive: new THREE.Color(0.36, 0.4, 0.52), emissiveIntensity: 0.6, transparent: true, depthWrite: false, ...off(-3) }), 'mark'); }); }
export function paintMaterial(yellow = false) { return once('paint' + yellow, () => { const t = paintMap(), c = yellow ? new THREE.Color(0.95, 0.7, 0.16) : new THREE.Color(0.92, 0.92, 0.9); return winterRoad(std({ map: t, color: c, roughness: 0.55, emissiveMap: t, emissive: c.clone().multiplyScalar(0.36), emissiveIntensity: 1, transparent: true, depthWrite: false, ...off(-4) }), 'mark'); }); }
// Tracks: wet where the wheels went, so they take the floor mirror (reflect.js) in proportion to how smooth they are.
export function trackMaterial(mirror) {
  return once('track', () => {
    const m = trackMaps(), mat = std({ map: m.map, roughnessMap: m.rough, roughness: 1, metalness: 0, emissiveMap: m.map, emissive: new THREE.Color(0.5, 0.55, 0.68), emissiveIntensity: 0.55, transparent: true, depthWrite: false, ...off(-5) });
    if (mirror) { mirror.patch(mat, [0.05, 0.75]); const inner = mat.onBeforeCompile; mat.onBeforeCompile = sh => { inner(sh); sh.fragmentShader = sh.fragmentShader.replace('* reflOn *', '* reflOn * max(0.0, 0.75 - roughnessFactor) * diffuseColor.a * 1.6 *'); }; mat.customProgramCacheKey = () => 'wet-tracks'; }
    return winterRoad(mat, 'mark');
  });
}
export function walkMarkMaterial() { return once('walkmark', () => { const m = walkMarkMaps(); return winterRoad(std({ map: m.map, normalMap: m.normal, roughnessMap: m.rough, roughness: 1, emissiveMap: m.map, emissive: NIGHT, emissiveIntensity: 0.62, transparent: true, depthWrite: false, ...off(-3) })); }); }
export function fixtureMaterial() { return once('fixture', () => { const m = fixtureMaps(); return winterRoad(std({ map: m.map, normalMap: m.normal, roughnessMap: m.orm, metalnessMap: m.orm, roughness: 1, metalness: 1, emissiveMap: m.map, emissive: new THREE.Color(0.45, 0.48, 0.6), emissiveIntensity: 0.55, alphaTest: 0.5, ...off(-3) })); }); }
export function kerbMaterial() { return once('kerb', () => { const t = graniteMap(); return winterRoad(std({ map: t, roughness: 0.72, emissiveMap: t, emissive: NIGHT, emissiveIntensity: 0.6 })); }); }
export function bankMaterial(snowTex) { return once('bank', () => winterRoad(glowByColour(std({ map: snowTex, roughness: 0.9, emissiveMap: snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5, vertexColors: true, ...off(-3) })), 'bank')); }
export function ironMaterial() { return once('iron', () => std({ color: 0x1c2420, roughness: 0.45, metalness: 0.55, emissive: 0x0a0e0c, emissiveIntensity: 0.7 })); }
export function slatMaterial() { return once('slat', () => { const t = woodMap(); return std({ map: t, roughness: 0.8, emissiveMap: t, emissive: new THREE.Color(0.28, 0.22, 0.18), emissiveIntensity: 0.55 }); }); }


// ------------------------------------------------------------------------------------- winter on the road --
// What a winter night does to all of the above, in the shader. One painted map of the whole street grid (winterroads.js
// paints it at start-up: 2048 x 1024, about 30 cm to the pixel) says, in three channels, how much sodium light and how
// much white lamp light falls on each spot of ground, and how much snow the ploughs and the traffic have left there.
// The road reads it and becomes: tyre-polished wet black where the wheels go, packed grey snow between the lanes and
// where nobody drives, brown slush where the two meet, a bloom of salt on the dry parts; wet asphalt mirrors the
// lamps and the skyline (the floor mirror, reflect.js, folded in where it is wet); and every lamp throws a pool of
// its own colour on whatever is under it. The edges of the snow are cut by two scales of a small grain texture, so
// nothing repeats and nothing is as soft as the map. Paint and marks fade where snow lies over them.
// Nothing runs per frame. With no map set (ROAD.uRoadK.x = 0) every material looks as it did.
export const ROAD = {
  tRoadMask: { value: null }, tRoadGrain: { value: null }, uRoadBox: { value: new THREE.Vector4(0, 0, 1, 1) }, uRoadK: { value: new THREE.Vector4(0, 1, 0, 0) },
  tRoadSnow: { value: null }, tRoadDrift: { value: null },      // the ground's own snow texture and its drifts (museum.js, finish.js), so that snow on the road is the same snow
  tRoadRefl: { value: null }, roadReflM: { value: new THREE.Matrix4() }, roadReflOn: { value: 0 }, roadReflY: { value: 0 },
};
// Three channels of tileable noise, 256 px: broad, middling and fine.
function roadGrain() {
  return once('roadgrain', () => {
    const W = 256, a = fbm(W, W, 4, 5, 501), b = fbm(W, W, 7, 4, 503, { gain: 0.6 }), c2 = fbm(W, W, 24, 3, 509, { gain: 0.7 }), [c, g] = cv(W, W), im = g.createImageData(W, W), d = im.data;
    const st = (v, k) => clamp((0.5 + (v - 0.5) * k) * 255);
    for (let i = 0; i < W * W; i++) { d[i * 4] = st(a[i], 2.4); d[i * 4 + 1] = st(b[i], 2.6); d[i * 4 + 2] = st(c2[i], 2.2); d[i * 4 + 3] = 255; }
    g.putImageData(im, 0, 0); return tx(c, { srgb: false });
  });
}
const ROAD_GLSL = `
uniform sampler2D tRoadMask; uniform sampler2D tRoadGrain; uniform vec4 uRoadBox; uniform vec4 uRoadK; varying vec3 vRoadW;
vec4 roadMaskAt() { return texture2D(tRoadMask, (vRoadW.xz - uRoadBox.xy) * uRoadBox.zw); }
vec3 roadLampOf(vec4 rm) { return (rm.r * rm.r * vec3(1.0, 0.62, 0.3) + rm.g * rm.g * vec3(1.0, 0.86, 0.68)) * uRoadK.y * (1.0 - smoothstep(4.0, 9.0, vRoadW.y)); }
// What lies here: x snow you cannot see the road through; y slush, the snow thinning out to a grey film at its edge
// (it runs on under the snow); z the dark wet rim of meltwater round that. grain: two grains for whoever wants
// them. The grain is drawn out along the road (the map's fourth channel says which way it runs): snow on a road lies
// in streaks.
vec3 roadSnowOf(vec4 rm, out vec2 grain) {
  vec2 q = mix(vRoadW.xz, vRoadW.zx, step(0.5, rm.a));
  vec3 g1 = texture2D(tRoadGrain, q * vec2(0.21, 0.023)).rgb, g2 = texture2D(tRoadGrain, q * vec2(0.134, 0.0171) + 0.37).rgb, g3 = texture2D(tRoadGrain, vRoadW.xz * 0.61).rgb;
  float cover = rm.b + (g1.r - 0.5) * 0.5 + (g2.g - 0.5) * 0.34 + (g3.b - 0.5) * 0.16;
  grain = vec2(g2.b * 0.6 + g3.g * 0.4, g1.g * 0.5 + g2.r * 0.5);
  return vec3(smoothstep(0.545, 0.64, cover), smoothstep(0.43, 0.575, cover), smoothstep(0.34, 0.44, cover) * (1.0 - smoothstep(0.47, 0.57, cover))) * uRoadK.x;
}`;
// kind: 'road' the asphalt itself; 'mark' paint and marks lying on it (they fade under snow); 'lit' anything else the lamps shine on;
// 'bank' ploughed snow: lit, and broken into the clods and crusts a plough throws up.
export function winterRoad(mat, kind = 'lit') {
  if (mat.userData.winterRoad) return mat;
  mat.userData.winterRoad = kind;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    ROAD.tRoadGrain.value = roadGrain();
    Object.assign(sh.uniforms, ROAD);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRoadW;\nuniform mat4 roadReflM;\nvarying vec4 vRoadRefl;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 rw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nrw = instanceMatrix * rw;\n#endif\nrw = modelMatrix * rw; vRoadW = rw.xyz; vRoadRefl = roadReflM * rw; }');
    let f = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + ROAD_GLSL + '\nuniform sampler2D tRoadRefl; uniform sampler2D tRoadSnow; uniform sampler2D tRoadDrift; uniform float roadReflOn; uniform float roadReflY; varying vec4 vRoadRefl;');
    if (kind === 'lit') f = f.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * roadLampOf(roadMaskAt());');
    if (kind === 'bank') f = f
      .replace('#include <map_fragment>', '#include <map_fragment>\nfloat rdClod = 0.66 + 0.62 * (texture2D(tRoadGrain, vRoadW.xz * 0.47).b * 0.55 + texture2D(tRoadGrain, vRoadW.zx * 1.83 + vRoadW.y * 0.9).g * 0.45); rdClod = mix(1.0, rdClod, uRoadK.x); diffuseColor.rgb *= rdClod;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= rdClod; totalEmissiveRadiance += diffuseColor.rgb * roadLampOf(roadMaskAt());');
    if (kind === 'mark') f = f
      .replace('#include <map_fragment>', '#include <map_fragment>\nvec4 rdM = roadMaskAt(); vec2 rdG; vec3 rdS = roadSnowOf(rdM, rdG); diffuseColor.a *= 1.0 - max(rdS.x, rdS.y * 0.55) * 0.94;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * roadLampOf(rdM);');
    if (kind === 'road') f = f
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec4 rdM = roadMaskAt(); vec2 rdG; vec3 rdS = roadSnowOf(rdM, rdG);
        float rdCov = max(rdS.x, rdS.y * 0.8);                       // how much of what shows is snow or slush
        float rdWet = (1.0 - rdS.x) * clamp(0.3 + rdS.z * 0.8 + rdS.y * 0.3 + (rdG.y - 0.5) * 1.5, 0.0, 1.0) * uRoadK.x;
        float rdSalt = smoothstep(0.52, 0.8, rdG.x + (0.5 - rdG.y) * 0.7) * (1.0 - rdCov) * (1.0 - rdWet) * uRoadK.x;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.134, 0.14), rdSalt * 0.3);                       // salt: a neutral grey bloom on what is dry
        diffuseColor.rgb *= 1.0 - 0.4 * rdWet - 0.3 * rdS.z;                                                    // wet is darker, and darkest in the rim round the snow
        vec3 rdSnowC = texture2D(tRoadSnow, vRoadW.xz * 0.15).rgb * (0.94 + 0.06 * rdG.x);                      // the ground's own snow
        diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.115, 0.118, 0.125), rdSnowC * 0.6, rdS.y), rdS.y * 0.8);      // slush: a grey film, lighter and thicker towards the snow
        diffuseColor.rgb = mix(diffuseColor.rgb, rdSnowC, rdS.x);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(mix(roughnessFactor, 0.16, rdWet * 0.9), 1.0, rdCov);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(mix(normal, nonPerturbedNormal, clamp(rdCov + rdWet * 0.45, 0.0, 1.0)));')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance = mix(totalEmissiveRadiance, diffuseColor.rgb * vec3(0.2, 0.25, 0.4) * 0.55, rdCov);      // (the glow the ground's snow has: museum.js)
        { vec3 lc = roadLampOf(rdM), grey = vec3(dot(lc, vec3(0.3, 0.5, 0.2)));
          // On snow the lamp's colour is the lamp's; the dark road takes less of the tint (wet asphalt under sodium is grey-brown, not orange).
          totalEmissiveRadiance += mix((diffuseColor.rgb * 2.2 + 0.03) * mix(grey, lc, 0.6), diffuseColor.rgb * lc, rdCov); }`)
      .replace('#include <opaque_fragment>', `{
          vec2 ruv = vRoadRefl.xy / vRoadRefl.w + (normal.xy - nonPerturbedNormal.xy) * 0.035;
          float ndv = clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), fres = pow(1.0 - ndv, 3.0);
          vec3 rc = texture2D(tRoadRefl, ruv, 1.4).rgb * 0.5 + texture2D(tRoadRefl, ruv + vec2(0.0, 0.014), 2.6).rgb * 0.3 + texture2D(tRoadRefl, ruv - vec2(0.0, 0.03), 3.4).rgb * 0.2;
          outgoingLight += min(rc, vec3(3.0)) * (0.03 + 0.62 * fres) * rdWet * roadReflOn * (1.0 - step(0.08, abs(vRoadW.y - roadReflY)));
          // Snow on the road is the snow beside it: the same drifts over it and the same sheen of the moon at a glance (finish.js snowLook).
          float dr = texture2D(tRoadDrift, vRoadW.xz * 0.037).r * 0.55 + texture2D(tRoadDrift, vRoadW.xz * 0.011 + 0.31).r * 0.45;
          outgoingLight = mix(outgoingLight, outgoingLight * 0.93 * (1.0 + (dr - 0.5) * 3.2) + vec3(0.13, 0.18, 0.32) * pow(1.0 - ndv, 4.0) * 0.55, rdCov);
        }
        #include <opaque_fragment>`);
    sh.fragmentShader = f;
  };
  mat.customProgramCacheKey = () => prevKey + '|winter-' + kind;
  return mat;
}

// --------------------------------------------------------------------------------------------- builders --
// A seeded hash of a place, for choices that should not change from night to night.
export const hash = (a, b, s = 0) => { let h = (Math.imul((a * 73.13) | 0, 2654435761) ^ Math.imul((b * 91.7) | 0, 1597334677) ^ Math.imul(s + 1, 374761393)) >>> 0; h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; return ((h ^ (h >>> 13)) >>> 0) / 4294967296; };

// A point on the ground: `along` the run, `across` it. axis 'z' runs along z (across = x).
const P = (axis, along, across, y) => (axis === 'z' ? [across, y, along] : [along, y, across]);
// A level quad (or following y(p) along it) between along a..b and across c..d, with UVs given per corner [ua, va] at (a,c),(b,c),(b,d),(a,d).
function ground(geo, axis, a, b, c, d, ya, yb, uv) { geo.quad(P(axis, a, c, ya), P(axis, b, c, yb), P(axis, b, d, yb), P(axis, a, d, ya), [0, 1, 0], uv); }

// Pavement, a slab at a time, the joints lined up on the kerb (`c0`, the across edge the grid starts from) and on `a`.
// `y(p)` is the ground along the run. Each slab is one of the sixteen, turned at random, and tinted a little.
export function slabs(geo, axis, a, b, c0, c1, y, lift = 0.008, opts = {}) {
  const dir = Math.sign(c1 - c0) || 1, W = Math.abs(c1 - c0), step = opts.slab || SLAB, dark = opts.tint || 1;
  for (let p = a; p < b - 1e-3; p += step) {
    const p1 = Math.min(b, p + step), fa = (p1 - p) / step;
    for (let q = 0; q < W - 1e-3; q += step) {
      const q1 = Math.min(W, q + step), fq = (q1 - q) / step, h = hash(axis === 'z' ? c0 + dir * q : p, axis === 'z' ? p : c0 + dir * q, 7);
      const cell = (h * 16) | 0, ci = cell % CELLS, cj = (cell / CELLS) | 0, flipU = hash(p, q, 3) < 0.5, flipV = hash(q, p, 5) < 0.5;
      const U = t => (ci + (flipU ? 1 - t : t)) / CELLS, V = t => (cj + (flipV ? 1 - t : t)) / CELLS;
      const k = dark * (0.9 + hash(p, q, 11) * 0.16), warm = (hash(q, p, 13) - 0.5) * 0.05;
      geo.col = [k * (1 + warm), k, k * (1 - warm)];
      const ca = c0 + dir * q, cb = c0 + dir * q1;
      ground(geo, axis, p, p1, ca, cb, y(p) + lift, y(p1) + lift, [[U(0), V(0)], [U(0), V(fa)], [U(fq), V(fa)], [U(fq), V(0)]]);
    }
  }
  geo.col = null;
}

// A strip of marks along a run: column `colIx` of a 4-column atlas laid across c0..c1 (u = 0 at c0), tiling along
// every `len` metres from v0. `y(p)` the ground, `lift` above it.
// `brk(a, b)` gives the points to break it at, so that it follows a street that changes slope (every 6 m by default).
export function strip(geo, axis, a, b, c0, c1, y, lift, colIx, len, v0 = 0, cols = 4, uSpan = [0, 1], brk = null) {
  const u0 = (colIx + uSpan[0]) / cols + 0.002, u1 = (colIx + uSpan[1]) / cols - 0.002;
  const n = Math.max(1, Math.ceil((b - a) / 6)), pts = brk ? brk(a, b) : Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
  for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], p1 = pts[i + 1], va = v0 + (p - a) / len, vb = v0 + (p1 - a) / len;
    ground(geo, axis, p, p1, c0, c1, y(p) + lift, y(p1) + lift, [[u0, va], [u0, vb], [u1, vb], [u1, va]]); }
}
// One fixture (FIX.*) flat on the ground, centred at along p, across c, `l` along by `w` across, turned a quarter if `turn`.
export function fixture(geo, axis, p, c, l, w, y, cell, turn = false) {
  const [u0, u1, v0, v1] = cell, e = 0.004, uv = turn ? [[u0 + e, v0 + e], [u0 + e, v1 - e], [u1 - e, v1 - e], [u1 - e, v0 + e]] : [[u0 + e, v0 + e], [u1 - e, v0 + e], [u1 - e, v1 - e], [u0 + e, v1 - e]];
  ground(geo, axis, p - l / 2, p + l / 2, c - w / 2, c + w / 2, y, y, uv);
}

// ------------------------------------------------------------------------------------------------ kerbs --
// A granite kerb 0.24 m wide and 0.07 m high (as low as a toy's wheel will climb), its nose rounded on the road side,
// a concrete gutter pan along its foot and ploughed snow lying in the gutter. `side` is the way from the road to the
// pavement across the run. Cuts are kerb ramps: the kerb comes down to the road over half a metre either side and
// the pavement runs level into the street. What is drawn is what the wheels ride on (plan.landable, or a sloping top
// for each taper).
const KH = 0.07, KW = 0.24, NOSE = 0.028;
const PROFILE = (() => { const p = [[0, 0], [0, KH - NOSE]]; for (let i = 1; i <= 4; i++) { const a = (i / 4) * Math.PI / 2; p.push([NOSE - Math.cos(a) * NOSE, KH - NOSE + Math.sin(a) * NOSE]); } p.push([KW - 0.012, KH], [KW, KH - 0.012], [KW, 0]); return p; })();
export class Kerbs {
  // `marks` is where the salt and slush along the gutter go (road marks, laid by the caller).
  constructor(plan, snowTex, marks) { this.plan = plan; this.k = new GeoLite(); this.gutter = new GeoLite(true); this.bank = new GeoLite(true); this.marks = marks; this.drains = []; this.snowTex = snowTex; }
  // axis: the way it runs; at: its centre line; [a, b]: its length; side: +1 if the pavement is on the + side of `at`.
  run({ axis, at, a, b, side, y = () => 0, cuts = [], bank = true, gutter = true, drains = [], clear = [] }) {
    const plan = this.plan, face = at - side * KW / 2;            // the road face
    // The pieces left once the ramps are cut out, and which of their ends are ramps (and taper).
    const pieces = []; let s = a, sTaper = false;
    for (const [c0, c1] of [...cuts].sort((u, v) => u[0] - v[0])) { if (c1 <= a || c0 >= b) continue; if (c0 - s > 0.05) pieces.push([s, Math.max(s, c0), sTaper, true]); s = Math.max(s, c1); sTaper = true; }
    if (b - s > 0.05) pieces.push([s, b, sTaper, false]);
    const T = 0.5;
    for (const [p0, p1, t0, t1] of pieces) {
      const hs = p => Math.max(0.12, Math.min(1, t0 ? (p - p0) / T : 1, t1 ? (p1 - p) / T : 1));
      // Sample along it: the ends of the tapers, every metre, and where the ground changes slope.
      const ps = new Set([p0, p1]); if (t0) ps.add(Math.min(p1, p0 + T)); if (t1) ps.add(Math.max(p0, p1 - T)); const st = Math.abs(y(p0) - y(p1)) < 1e-4 && Math.abs(y((p0 + p1) / 2) - y(p0)) < 1e-4 ? 6 : 1; for (let p = Math.ceil(p0 / st) * st; p < p1; p += st) ps.add(p);      // (every metre where the street climbs)
      const L = [...ps].sort((u, v) => u - v);
      for (let i = 0; i < L.length - 1; i++) {
        const pa = L[i], pb = L[i + 1], ha = hs(pa), hb = hs(pb), ya = y(pa), yb = y(pb);
        for (let k = 0; k < PROFILE.length - 1; k++) {
          const [d0, e0] = PROFILE[k], [d1, e1] = PROFILE[k + 1], l = Math.hypot(d1 - d0, e1 - e0) || 1;
          const across = side * -(e1 - e0) / l, up = (d1 - d0) / l, n = axis === 'z' ? [across, up, 0] : [0, up, across];     // (the profile runs from the road face, over the nose and the top, down the back)
          const c = d => face + side * d, va = (d0 + e0) * 2.2, vb = (d1 + e1) * 2.2;
          this.k.quad(P(axis, pa, c(d0), ya + e0 * ha), P(axis, pb, c(d0), yb + e0 * hb), P(axis, pb, c(d1), yb + e1 * hb), P(axis, pa, c(d1), ya + e1 * ha), n, [[pa / 2, va], [pb / 2, va], [pb / 2, vb], [pa / 2, vb]]);
        }
      }
      // End caps, where a piece stops against a ramp or the end of the run.
      for (const [p, dirn] of [[p0, -1], [p1, 1]]) { const hh = hs(p), yy = y(p); for (let k = 1; k < PROFILE.length - 2; k++) { const A = PROFILE[0], B = PROFILE[k], C = PROFILE[k + 1]; const c = d => face + side * d; this.k.tri(P(axis, p, c(A[0]), yy + A[1] * hh), P(axis, p, c(B[0]), yy + B[1] * hh), P(axis, p, c(C[0]), yy + C[1] * hh), axis === 'z' ? [0, 0, dirn] : [dirn, 0, 0]); } const A = PROFILE[0], B = PROFILE[PROFILE.length - 2], C = PROFILE[PROFILE.length - 1], c = d => face + side * d; this.k.tri(P(axis, p, c(A[0]), yy), P(axis, p, c(B[0]), yy + B[1] * hh), P(axis, p, c(C[0]), yy), axis === 'z' ? [0, 0, dirn] : [dirn, 0, 0]); }
      // What it is to the wheels: a top, level or following the street, and a sloping top on each taper.
      const lo = Math.min(at - KW / 2, at + KW / 2), hi = Math.max(at - KW / 2, at + KW / 2);
      const rect = (u0, u1) => (axis === 'z' ? { x0: lo, x1: hi, z0: u0, z1: u1 } : { x0: u0, x1: u1, z0: lo, z1: hi });
      const m0 = t0 ? p0 + T : p0, m1 = t1 ? p1 - T : p1;
      // the level (or evenly sloping) middle: split where the ground's slope changes
      const brk = [m0]; for (let p = Math.ceil(m0); p < m1; p++) brk.push(p); brk.push(m1);
      let start = m0, slope0 = null;
      const push = (u0, u1) => { if (u1 - u0 < 0.02) return; const r = rect(u0, u1), y0 = y(u0), y1 = y(u1); if (Math.abs(y1 - y0) < 1e-4) landable(plan, r, y0 + KH, y0); else { plan.surfaces.push({ skin: 'wall', fixed: true, ...r, axis, h0: y0 + KH, h1: y1 + KH, base: Math.min(y0, y1) }); } };
      for (let i = 1; i < brk.length; i++) { const sl = (y(brk[i]) - y(brk[i - 1])) / Math.max(1e-6, brk[i] - brk[i - 1]); if (slope0 !== null && Math.abs(sl - slope0) > 1e-4) { push(start, brk[i - 1]); start = brk[i - 1]; } slope0 = sl; }
      push(start, m1);
      if (t0) { const r = rect(p0, m0); plan.surfaces.push({ skin: 'wall', fixed: true, ...r, axis, h0: y(p0) + KH * 0.12, h1: y(m0) + KH, base: y(p0) }); }
      if (t1) { const r = rect(m1, p1); plan.surfaces.push({ skin: 'wall', fixed: true, ...r, axis, h0: y(m1) + KH, h1: y(p1) + KH * 0.12, base: y(p1) }); }
    }
    // The gutter pan: 0.35 m of concrete along the road face, scored every 1.5 m (continuous across the ramps).
    if (gutter) { const g0 = face, g1 = face - side * 0.36; slabs(this.gutter, axis, a, b, g0, g1, y, 0.006, { tint: 0.84 }); if (this.marks) for (let p = a; p < b - 0.1; p += 6) strip(this.marks, axis, p, Math.min(b, p + 6), face, face - side * 1.1, y, 0.0068, 2, 9, (p - a) / 9); }
    // Ploughed snow in the gutter, low and lumpy, with gaps at the ramps, the drains, and wherever is kept clear.
    if (bank) {
      const holes = [...cuts.map(([c0, c1]) => [c0 - 0.9, c1 + 0.9]), ...drains.map(p => [p - 0.6, p + 0.6]), ...clear].sort((u, v) => u[0] - v[0]);
      let p = a; const runs = []; for (const [h0, h1] of holes) { if (h0 - p > 1.2) runs.push([p, h0]); p = Math.max(p, h1); } if (b - p > 1.2) runs.push([p, b]);
      for (const [r0, r1] of runs) this._bank(axis, face, side, r0, r1, y);
    }
    for (const p of drains) this.drains.push({ axis, p, c: face - side * 0.2, y: y(p) });
  }
  _bank(axis, face, side, a, b, y) {
    const n = Math.max(2, Math.ceil((b - a) / 0.45)), pts = [];
    for (let i = 0; i <= n; i++) {
      const p = a + (b - a) * i / n, e = Math.min(1, (p - a) / 0.6, (b - p) / 0.6), h = (0.012 + hash(p, face, 17) * 0.02) * Math.max(0.15, e), w = (0.18 + hash(face, p, 19) * 0.2) * Math.max(0.3, e);
      pts.push({ p, h, w, y: y(p) });
    }
    const DIRTY = [0.6, 0.58, 0.56], CLEAN = [0.95, 0.96, 1.0];
    for (let i = 0; i < n; i++) {
      const A = pts[i], B = pts[i + 1];
      // cross-section: against the kerb face (a little up it), over the crest, out to the toe on the road
      const sec = q => [[0.0, q.h * 1.1], [0.05, q.h], [q.w * 0.55, q.h * 0.7], [q.w, 0.0]], sa = sec(A), sb = sec(B), c = d => face - side * d;
      for (let k = 0; k < 3; k++) {
        this.bank.col = k === 2 ? DIRTY : CLEAN;
        this.bank.quad(P(axis, A.p, c(sa[k][0]), A.y + sa[k][1] + 0.008), P(axis, B.p, c(sb[k][0]), B.y + sb[k][1] + 0.008), P(axis, B.p, c(sb[k + 1][0]), B.y + sb[k + 1][1] + 0.008), P(axis, A.p, c(sa[k + 1][0]), A.y + sa[k + 1][1] + 0.008), [0, 1, 0], [[A.p / 2, sa[k][0] * 2], [B.p / 2, sb[k][0] * 2], [B.p / 2, sb[k + 1][0] * 2], [A.p / 2, sa[k + 1][0] * 2]]);
      }
    }
    this.bank.col = null;
  }
  meshes(fixGeo) {
    for (const d of this.drains) fixture(fixGeo, d.axis, d.p, d.c, 0.62, 0.36, d.y + 0.0075, FIX.drain, true);
    const out = [];
    if (!this.k.empty) out.push(new THREE.Mesh(this.k.build(), kerbMaterial()));
    if (!this.gutter.empty) out.push(new THREE.Mesh(this.gutter.build(), slabMaterial(-2)));
    if (!this.bank.empty) out.push(new THREE.Mesh(this.bank.build(), bankMaterial(this.snowTex)));
    return out;
  }
}
// (A wheel-top for a kerb piece: plan.landable, kept here so the rect form reads.)
function landable(plan, r, top, base) { plan.surfaces.push({ skin: 'wall', fixed: true, x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, axis: null, h0: top, h1: top, base }); plan.obstacles.push({ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y0: base, y1: top - 0.08 }); }

// A Geo with triangles too (for the kerb's end caps), and smooth enough normals for a profile.
class GeoLite {
  constructor(colour = false) { this.p = []; this.n = []; this.uv = []; this.idx = []; this.c = []; this.col = null; this.colour = colour; }
  _v(v, n, t) { this.p.push(v[0], v[1], v[2]); this.n.push(n[0], n[1], n[2]); this.uv.push(t[0], t[1]); if (this.colour) this.c.push(...(this.col || [1, 1, 1])); }
  quad(a, b, c, d, n, uv = [[0, 0], [1, 0], [1, 1], [0, 1]]) {
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]], cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    let v = [a, b, c, d], t = uv; if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) { v = [a, d, c, b]; t = [uv[0], uv[3], uv[2], uv[1]]; }
    const i = this.p.length / 3; for (let k = 0; k < 4; k++) this._v(v[k], n, t[k]); this.idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
  }
  tri(a, b, c, n) {
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    let v = [a, b, c]; if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) v = [a, c, b];
    const i = this.p.length / 3; for (const q of v) this._v(q, n, [q[0] + q[2], q[1] * 3]); this.idx.push(i, i + 1, i + 2);
  }
  get empty() { return this.idx.length === 0; }
  build() {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    if (this.colour) g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setIndex(this.idx); return g;
  }
}
export { GeoLite };

// ------------------------------------------------------------------------------------------ park furniture --
// Every bench and litter bin out of doors is one of these (streets.js, butlerfield.js, lakefront.js): ParkFurniture
// puts them where they go, merged into a handful of meshes for all of them, and makes each solid as it is drawn.
const TAU = Math.PI * 2;
const bare = g => { g = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); return g; };
const merged = a => mergeGeometries(a.map(bare));

// The park bench Chicago puts out by the hundred: two cast-iron ends and a middle standard, each a front leg, a back
// leg, a seat rail and a back that leans away, scrolled arms at the ends; six slats in the seat, four in the back;
// 1.8 m long, the seat 0.45 m up. The night's snow lies along every slat, the arms and the top rail, except where
// somebody brushed a place clear to sit. 'backless' is the same ends without the back standards or the arms (the team
// benches by the diamonds). Built once each, front to +z, length along x, standing on y = 0.
export const BENCH = { L: 1.8, D: 0.64, SEAT: 0.468 };        // long, deep over all, and the top of the snow on the seat
export function benchParts(variant = 'park') {
  return once('bench-' + variant, () => {
    const back = variant !== 'backless', iron = [], wood = [], snow = [];
    const stroke = (pts, w) => {                       // a bar of iron along a polyline (z, y), w thick
      const L = [], R = [];
      for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dz = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dz, dy) || 1, nz = -dy / l, ny = dz / l; L.push([pts[i][0] + nz * w / 2, pts[i][1] + ny * w / 2]); R.push([pts[i][0] - nz * w / 2, pts[i][1] - ny * w / 2]); }
      const s = new THREE.Shape(); [...L, ...R.reverse()].forEach(([z, y], i) => (i ? s.lineTo(z, y) : s.moveTo(z, y))); s.closePath(); return s;
    };
    const frame = (x, arms) => {
      const bars = [[[[0.25, 0.0], [0.235, 0.2], [0.225, 0.41]], 0.045], [[[-0.25, 0.0], [-0.215, 0.2], [-0.185, 0.4]], 0.045], [[[0.285, 0.418], [0.12, 0.414], [-0.08, 0.402], [-0.2, 0.392]], 0.034]];
      if (back) bars.push([[[-0.205, 0.38], [-0.225, 0.52], [-0.265, 0.68], [-0.305, 0.86]], 0.04]);
      if (arms) bars.push([[[-0.25, 0.62], [-0.05, 0.638], [0.16, 0.648], [0.27, 0.642], [0.3, 0.615], [0.285, 0.59]], 0.034], [[[0.222, 0.4], [0.232, 0.52], [0.24, 0.64]], 0.03]);
      const t = arms || (!back && x !== 0) ? 0.038 : 0.03;
      for (const [pts, w] of bars) { const g = new THREE.ExtrudeGeometry(stroke(pts, w), { depth: t, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 4 }); g.rotateY(-Math.PI / 2); g.translate(x + t / 2, 0, 0); iron.push(g); }
      for (const z of [0.25, -0.25]) { const f = new THREE.BoxGeometry(t + 0.02, 0.018, 0.08); f.translate(x, 0.009, z); iron.push(f); }
      if (arms) { const c = new THREE.BoxGeometry(t + 0.01, 0.012, 0.54); c.translate(x, 0.672, 0.02); snow.push(c); }      // snow along the arm
    };
    frame(-0.86, back); frame(0.86, back); frame(0, false);
    const railY = z => z > 0.12 ? 0.418 + (0.414 - 0.418) * (0.285 - z) / 0.165 : z > -0.08 ? 0.414 + (0.402 - 0.414) * (0.12 - z) / 0.2 : 0.402 + (0.392 - 0.402) * (-0.08 - z) / 0.12;
    // Seat slats, front (rolled a little lower) to back, and the snow on each.
    const seat = [0.255, 0.185, 0.115, 0.045, -0.025, -0.095, -0.165], r = rng(back ? 4040 : 4041);
    seat.forEach((z, i) => {
      const y = railY(z) + 0.017 + 0.014 - (i === 0 ? 0.006 : 0), s = new THREE.BoxGeometry(1.8, 0.028, 0.06); s.rotateX(i === 0 ? 0.25 : 0.03); s.translate(0, y, z); wood.push(s);
      // snow: the length of the slat but for a place brushed clear in the middle of the seat
      const clear = i > 0 && i < 5 ? [-0.25 + r() * 0.1, 0.3 + r() * 0.1] : null, top = y + 0.014;
      const spans = clear ? [[-0.86, clear[0]], [clear[1], 0.86]] : [[-0.86, 0.86]];
      for (const [x0, x1] of spans) { const h = 0.012 + r() * 0.012, sn = new THREE.BoxGeometry(x1 - x0, h, 0.052); sn.translate((x0 + x1) / 2, top + h / 2, z); snow.push(sn); }
      if (clear) { const sn = new THREE.BoxGeometry(clear[1] - clear[0], 0.003, 0.05); sn.translate((clear[0] + clear[1]) / 2, top + 0.0015, z); snow.push(sn); }
    });
    // Back slats, on the lean of the back standards.
    if (back) {
      const backZ = y => -0.225 - (y - 0.52) / (0.86 - 0.52) * 0.08, lean = Math.atan2(0.305 - 0.225, 0.86 - 0.52);
      [0.5, 0.6, 0.7, 0.8].forEach((y, i) => { const z = backZ(y) + 0.032, s = new THREE.BoxGeometry(1.8, 0.075, 0.024); s.rotateX(-lean); s.translate(0, y, z); wood.push(s);
        if (i === 3) { const sn = new THREE.BoxGeometry(1.72, 0.014, 0.03); sn.translate(0, y + 0.044, z - 0.008); snow.push(sn); } });
    }
    return { iron: merged(iron), wood: merged(wood), snow: merged(snow), L: BENCH.L, D: back ? BENCH.D : 0.58 };
  });
}

// The litter basket in Chicago's parks: a dark green steel drum of upright flat bars between three hoops, on a black
// foot; a black liner inside with its rolled rim showing over the top hoop; a low black domed lid standing proud of the
// rim on three short posts (the gap is where the litter goes in), and the night's snow heaped on the dome. 0.6 m across
// and a metre high. Built once, standing on y = 0.
export const BIN = { R: 0.29, TOP: 1.05 };
export function binParts() {
  return once('bin', () => {
    const green = [], iron = [], liner = [], snow = [], R = 0.27, r = rng(5150);
    const at = (g, y) => { g.translate(0, y, 0); return g; };
    iron.push(at(new THREE.CylinderGeometry(0.25, 0.27, 0.07, 22), 0.035));                                   // the foot
    for (let i = 0, N = 22; i < N; i++) { const b = new THREE.BoxGeometry(0.034, 0.76, 0.012); b.translate(0, 0.07 + 0.38, R); b.rotateY(i / N * TAU); green.push(b); }
    for (const y of [0.1, 0.47, 0.8]) { green.push(at(new THREE.CylinderGeometry(R + 0.009, R + 0.009, 0.05, 28, 1, true), y)); green.push(at(new THREE.CylinderGeometry(R + 0.009, R + 0.009, 0.004, 28), y + 0.025)); }
    liner.push(at(new THREE.CylinderGeometry(0.248, 0.238, 0.78, 22, 1, true), 0.46));                         // the liner, seen between the bars
    { const t = new THREE.TorusGeometry(0.262, 0.017, 6, 26); t.rotateX(Math.PI / 2); liner.push(at(t, 0.842)); }      // its rim, rolled over the hoop
    { const d = new THREE.CircleGeometry(0.245, 22); d.rotateX(-Math.PI / 2); liner.push(at(d, 0.62)); }         // and what is in it, a long way down in the dark
    for (let i = 0; i < 3; i++) { const p = new THREE.BoxGeometry(0.03, 0.09, 0.03); p.translate(0, 0.875, 0.235); p.rotateY(i / 3 * TAU + 0.5); iron.push(p); }
    iron.push(at(new THREE.CylinderGeometry(0.305, 0.305, 0.03, 28), 0.935));                                 // the lid's rim
    { const d = new THREE.SphereGeometry(0.3, 24, 6, 0, TAU, 0, Math.PI / 2); d.scale(1, 0.3, 1); iron.push(at(d, 0.95)); }
    // The snow on the dome: a cap a little in from its rim, heaped and lumpy, a little more on one side.
    { const s = new THREE.SphereGeometry(0.272, 20, 7, 0, TAU, 0, Math.PI / 2), p = s.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), up = y / 0.272, k = 1 + (r() - 0.5) * 0.12 * up; p.setXYZ(i, x * (1 + up * 0.04), y * 0.36 * k * (1 + x * 0.5), z * (1 + up * 0.04)); }
      s.computeVertexNormals(); snow.push(at(s, 0.958)); }
    return { green: merged(green), iron: merged(iron), liner: merged(liner), snow: merged(snow) };
  });
}
export function binMaterial() { return once('binGreen', () => std({ color: 0x1f4630, roughness: 0.5, metalness: 0.4, emissive: 0x0d2216, emissiveIntensity: 0.75 })); }
export function linerMaterial() { return once('binLiner', () => std({ color: 0x0b0c0d, roughness: 0.55, metalness: 0.1, emissive: 0x040506, emissiveIntensity: 0.6, side: THREE.DoubleSide })); }

// Benches and bins put out: drawn from the parts above and made solid as drawn. A bench's legs, its seat, its back and
// its arms are each in the way only where they stand, so a toy car goes under the seat between the ends (as it does
// under the gallery benches), and with a hop gets up onto the seat, snow and all. A bin is a drum, and its snowy lid a
// top to land on. Each goes into plan.parkFurniture, which says where they all are.
export class ParkFurniture {
  constructor(plan) { this.plan = plan; this.geo = { iron: [], wood: [], green: [], liner: [], snow: [] }; if (!plan.parkFurniture) plan.parkFurniture = []; }
  _put(parts, M) { for (const k in this.geo) if (parts[k]) this.geo[k].push(parts[k].clone().applyMatrix4(M)); }
  // A rectangle in a thing's own frame (x along it, z out of its front), turned a quarter at a time to stand at (x, z).
  static rect(x, z, c, s, lx0, lx1, lz0, lz1) {
    const xa = x + lx0 * c + lz0 * s, xb = x + lx1 * c + lz1 * s, za = z - lx0 * s + lz0 * c, zb = z - lx1 * s + lz1 * c;
    return { x0: Math.min(xa, xb), x1: Math.max(xa, xb), z0: Math.min(za, zb), z1: Math.max(za, zb) };
  }
  // A bench standing at (x, y, z), its front facing (fx, fz) (one of the four ways).
  bench(x, y, z, fx, fz, variant = 'park') {
    const th = Math.atan2(fx, fz), c = Math.round(Math.cos(th)), s = Math.round(Math.sin(th)), P = this.plan, O = P.obstacles, R = (...a) => ParkFurniture.rect(x, z, c, s, ...a);
    this._put(benchParts(variant), new THREE.Matrix4().makeRotationY(Math.atan2(s, c)).setPosition(x, y, z));
    const h = BENCH.L / 2, back = variant !== 'backless';
    for (const e of [-0.86, 0, 0.86]) for (const [a, b] of [[0.2, 0.29], [-0.29, -0.16]]) O.push({ ...R(e - 0.035, e + 0.035, a, b), y0: y, y1: y + 0.42 });      // the legs
    const seat = R(-h, h, -0.2, 0.29);
    O.push({ ...seat, y0: y + 0.385, y1: y + BENCH.SEAT - 0.012, bench: true });                                    // the seat, and its top
    P.surfaces.push({ skin: 'wall', fixed: true, ...seat, axis: null, h0: y + BENCH.SEAT, h1: y + BENCH.SEAT, thick: 0.085, base: y });
    if (back) { O.push({ ...R(-h, h, -0.34, -0.18), y0: y + 0.48, y1: y + 0.9 }); for (const e of [-0.86, 0.86]) O.push({ ...R(e - 0.03, e + 0.03, -0.25, 0.3), y0: y + 0.47, y1: y + 0.67 }); }      // the back, the arms
    P.parkFurniture.push({ kind: 'bench', variant, x, y, z, fx, fz });
  }
  // A litter bin standing at (x, y, z).
  bin(x, y, z) {
    const P = this.plan, Rb = BIN.R;
    this._put(binParts(), new THREE.Matrix4().makeRotationY(hash(x, z, 5) * TAU).setPosition(x, y, z));
    P.obstacles.push({ x0: x - Rb, x1: x + Rb, z0: z - Rb, z1: z + Rb, y0: y, y1: y + BIN.TOP - 0.08 });
    P.surfaces.push({ skin: 'wall', fixed: true, x0: x - 0.19, x1: x + 0.19, z0: z - 0.19, z1: z + 0.19, axis: null, h0: y + BIN.TOP, h1: y + BIN.TOP, base: y });
    P.parkFurniture.push({ kind: 'bin', x, y, z });
  }
  // Everything put out, a mesh a material. `snow` is the caller's snow.
  meshes(snow) {
    const out = [], mk = (k, m) => { if (!this.geo[k].length) return; const me = new THREE.Mesh(mergeGeometries(this.geo[k]), m); me.matrixAutoUpdate = false; me.updateMatrix(); out.push(me); };
    mk('iron', ironMaterial()); mk('wood', slatMaterial()); mk('green', binMaterial()); mk('liner', linerMaterial()); mk('snow', snow);
    return out;
  }
}
