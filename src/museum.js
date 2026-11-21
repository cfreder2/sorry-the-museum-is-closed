// Builds the building from the plan, hangs the collection in it, and runs the
// one piece of magic: the picture lamps that come on as you arrive.

import * as THREE from 'three';
import * as TX from './textures.js';
import { T, HW, SPRING, VAULT_R, SLAB, LIFT, wallPoint, hang, heightOf, roomAt, ceilingAt, carve, streetY, groundOpenings } from './plan.js';
import { imageUrl } from './collection.js';
import { Geo } from './geo.js';
import { STEP as STEP_LAND, landAt } from './land.js';
import { buildGrounds } from './grounds.js';
import { buildRoofscape } from './roofscape.js';
import { panorama, lake, SPAN, BELOW } from './skyline.js';
import { buildWinter } from './winter.js';
import { buildStatues } from './statues.js';
import { furnish, MATERIALS } from './furnish.js';
import { buildSetPieces } from './setpieces.js';
const AUDIT = typeof location !== 'undefined' && /[?&]audit\b/.test(location.search);      // a test switch: keep geometry readable so openings can be checked by ray (tools/audit_openings.md)

// ---------------------------------------------------------------- geometry --

const WARM = new THREE.Color(1.0, 0.8, 0.56);

// Specks (dust, snow) that thin out with distance instead of piling up into a
// bright smear when a hundred of them land on the same few pixels.
function motes(color, size, alpha, near, far, additive) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color }, uSize: { value: size }, uAlpha: { value: alpha }, uFade: { value: new THREE.Vector2(near, far) } },
    vertexShader: `uniform float uSize; uniform vec2 uFade; varying float vA;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); float d = -mv.z;
        float px = uSize * projectionMatrix[1][1] * 400.0 / max(d, 0.05);
        vA = (1.0 - smoothstep(uFade.x, uFade.y, d)) * min(1.0, px);   // sub-pixel specks dim rather than clamp
        gl_PointSize = clamp(px, 1.0, 14.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uAlpha; varying float vA;
      void main() { vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.15, length(c)); gl_FragColor = vec4(uColor, a * vA * uAlpha); }`,
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}
const P3 = (x, y, z) => [x, y, z];

// What each building is built of: how big one tile of its wall is, the moulding along its top
// ([how far out, how deep]) and its footing, the colour of that trim, and how it shows at night.
const STYLES = {
  beaux: { u: 5.12, v: 5.12, cap: [0.22, 0.45], base: [0.07, 0.62], trim: 0xbdb6a6, glow: [0.34, 0.38, 0.5] },
  bridge: { u: 5.12, v: 5.12, cap: [0.12, 0.3], base: [0.1, 0.3], trim: 0x1a2224, glow: [0.6, 0.62, 0.66] },
  columbus: { u: 5.12, v: 5.12, cap: [0.08, 0.3], base: [0.04, 0.5], trim: 0xa9a59a, glow: [0.34, 0.38, 0.5] },
  modern: { u: 5.12, v: 5.12, cap: [0.34, 0.12], base: [0, 0], trim: 0xe9edf2, glow: [0.4, 0.44, 0.56] },
  brick: { u: 5.12, v: 5.12, cap: [0.12, 0.26], base: [0.05, 0.4], trim: 0xb3ab9c, glow: [0.52, 0.5, 0.52] },
  concrete: { u: 5.12, v: 5.12, cap: [0.06, 0.2], base: [0, 0], trim: 0x777a7c, glow: [0.4, 0.44, 0.52] },
};
const FAC = {};

// ------------------------------------------------------------------ frames --
//
// A frame is built as rings of moulding, each a different width, depth and
// tone, so it has a profile that catches the lamp. Which one a picture gets
// depends on when and where it was painted, as it would in a museum.

const TONE = {
  gold: [0.8, 0.6, 0.24], pale: [0.9, 0.76, 0.42], deep: [0.56, 0.4, 0.14], cove: [0.34, 0.24, 0.085],
  ebony: [0.045, 0.04, 0.038], ebony2: [0.1, 0.09, 0.08], walnut: [0.24, 0.13, 0.07], oak: [0.42, 0.28, 0.15],
  white: [0.86, 0.84, 0.78], linen: [0.72, 0.68, 0.58], red: [0.36, 0.09, 0.06], brass: [0.6, 0.47, 0.2],
};

function frameStyle(work, mini) {
  if (mini) return 'box';
  const year = +(/(\d{4})/.exec(work.d || '') || [])[1] || 1800, h = work.id % 7;
  if (/pointill/i.test(work.s || '') || /Seurat|Signac/.test(work.a || '')) return 'white';      // as Seurat wanted them
  if (year < 1520) return h % 2 ? 'tabernacle' : 'gothic';
  if (year < 1700) return year >= 1600 && h < 3 ? 'ebony' : h === 6 ? 'walnut' : 'baroque';
  if (year < 1840) return h < 4 ? 'neoclassical' : 'baroque';
  if (year < 1905) return h === 0 ? 'walnut' : h < 4 ? 'salon' : h === 6 ? 'oak' : 'neoclassical';
  return h < 3 ? 'modern' : 'oak';
}

function buildFrame(g, p, style) {
  const hw = p.w / 2, hh = p.h / 2, f = p.frame;
  const at = { x: p.x - p.nx * 0.04, y: p.y, z: p.z - p.nz * 0.04 };
  const box = (u0, u1, y0, y1, d, tone) => { g.col = TONE[tone]; g.wallBox(at, p.nx, p.nz, u0, u1, y0, y1, 0, d); };
  // A ring of moulding from `a` to `b` out from the picture's edge, standing `d` off the wall.
  const ring = (a, b, d, tone) => {
    box(-hw - b, hw + b, hh + a, hh + b, d, tone); box(-hw - b, hw + b, -hh - b, -hh - a, d, tone);
    box(-hw - b, -hw - a, -hh - a, hh + a, d, tone); box(hw + a, hw + b, -hh - a, hh + a, d, tone);
  };
  // Carved lumps at the corners and the middle of each rail.
  const ornaments = (r, size, d, tone, centres) => {
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) box(sx * (hw + r) - size, sx * (hw + r) + size, sy * (hh + r) - size, sy * (hh + r) + size, d, tone);
    if (!centres) return;
    for (const sy of [-1, 1]) box(-size * 1.5, size * 1.5, sy * (hh + r) - size * 0.8, sy * (hh + r) + size * 0.8, d, tone);
    for (const sx of [-1, 1]) box(sx * (hw + r) - size * 0.8, sx * (hw + r) + size * 0.8, -size * 1.5, size * 1.5, d, tone);
  };
  let W = f;
  switch (style) {
    case 'baroque':
      ring(0, 0.12 * W, 0.034, 'pale'); ring(0.12 * W, 0.42 * W, 0.02, 'cove'); ring(0.42 * W, 0.86 * W, 0.066, 'gold'); ring(0.86 * W, W, 0.046, 'deep');
      ornaments(0.64 * W, 0.3 * W, 0.082, 'pale', true); break;
    case 'salon':
      ring(0, 0.1 * W, 0.03, 'pale'); ring(0.1 * W, 0.36 * W, 0.018, 'cove'); ring(0.36 * W, 0.9 * W, 0.058, 'gold'); ring(0.9 * W, W, 0.04, 'deep');
      ornaments(0.66 * W, 0.24 * W, 0.07, 'pale', p.w > 0.9); break;
    case 'neoclassical':
      W *= 0.8; ring(0, 0.15 * W, 0.03, 'pale'); ring(0.15 * W, 0.68 * W, 0.042, 'gold'); ring(0.68 * W, 0.74 * W, 0.064, 'pale'); ring(0.74 * W, W, 0.056, 'deep'); break;
    case 'ebony':
      W *= 0.78; ring(0, 0.1 * W, 0.03, 'pale'); ring(0.1 * W, 0.4 * W, 0.044, 'ebony'); ring(0.4 * W, 0.47 * W, 0.054, 'ebony2'); ring(0.47 * W, 0.82 * W, 0.046, 'ebony'); ring(0.82 * W, W, 0.062, 'ebony2'); break;
    case 'walnut':
      W *= 0.8; ring(0, 0.14 * W, 0.03, 'pale'); ring(0.14 * W, 0.56 * W, 0.048, 'walnut'); ring(0.56 * W, 0.63 * W, 0.058, 'oak'); ring(0.63 * W, W, 0.05, 'walnut'); break;
    case 'white':
      W *= 0.92; ring(0, 0.08 * W, 0.056, 'linen'); ring(0.08 * W, W, 0.05, 'white'); break;
    case 'modern':
      W = Math.max(0.022, W * 0.34); ring(0, W, 0.05, p.work.id % 2 ? 'ebony' : 'pale'); break;
    case 'oak':
      W *= 0.62; ring(0, 0.2 * W, 0.03, 'linen'); ring(0.2 * W, W, 0.046, 'oak'); break;
    case 'gothic':
      W *= 0.9; ring(0, 0.16 * W, 0.026, 'red'); ring(0.16 * W, 0.9 * W, 0.052, 'gold'); ring(0.9 * W, W, 0.064, 'deep'); break;
    case 'tabernacle': {
      // An altarpiece's little building: pilasters, a ledge underneath, a cornice on top.
      W *= 0.82; ring(0, 0.16 * W, 0.026, 'red'); ring(0.16 * W, W, 0.05, 'gold');
      box(-hw - 1.3 * W, hw + 1.3 * W, -hh - 1.5 * W, -hh - W, 0.085, 'deep'); box(-hw - 1.15 * W, hw + 1.15 * W, -hh - 1.75 * W, -hh - 1.5 * W, 0.06, 'gold');
      box(-hw - 1.2 * W, hw + 1.2 * W, hh + W, hh + 1.35 * W, 0.075, 'gold'); box(-hw - 1.4 * W, hw + 1.4 * W, hh + 1.35 * W, hh + 1.55 * W, 0.1, 'pale'); break;
    }
    default:        // the miniature rooms: a dark box with a brass edge
      ring(0, 0.25 * f, 0.075, 'brass'); ring(0.25 * f, f, 0.07, 'ebony');
  }
  g.col = null;
}

// ------------------------------------------------------------- cut-outs ---
//
// The museum photographs its sculpture against a studio backdrop: a smooth sweep
// of grey, white or black, often with a shadow or a pool of light on the floor.
// To stand a piece in its case, the backdrop is taken away. The rule is that the
// piece is never cut into: what the backdrop cannot reach from the edge of the
// photograph without crossing the piece's outline stays, so a pale cheek or the
// highlight on a plaster head is never punched through. If no plain backdrop can
// be found, the photograph is shown whole on a card instead.
// When a real model of the piece exists, this is the function it replaces.
// Works on the pixels alone and touches nothing outside itself, because it is also run in a worker.
function cutPixels(px, w, h) {
  const n = w * h, N4 = [-1, 1, -w, w];
  const inside = (i, k) => (k === 0 ? i % w > 0 : k === 1 ? i % w < w - 1 : k === 2 ? i >= w : i < n - w);

  // 1. Colour as the eye sees it (CIE Lab), lightly blurred so that JPEG grain is not taken for detail.
  const lin = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const c = i / 255; lin[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 0.137931);
  let L = new Float32Array(n), A = new Float32Array(n), B = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = lin[px[i * 4]], g = lin[px[i * 4 + 1]], b = lin[px[i * 4 + 2]];
    const fx = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), fy = f(0.2126 * r + 0.7152 * g + 0.0722 * b), fz = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
    L[i] = 116 * fy - 16; A[i] = 500 * (fx - fy); B[i] = 200 * (fy - fz);
  }
  const tmp = new Float32Array(n);
  // Grow (any = true) or shrink a 0/1 mask by r pixels with a square, edges carried on outward.
  // Counts in a sliding window, so its cost does not depend on r.
  const grow = (src, dst, r, any) => {
    const need = any ? 1 : 2 * r + 1;
    for (let y = 0, o = 0; y < h; y++, o += w) {
      let c = 0;
      for (let d = -r; d <= r; d++) c += src[o + Math.min(w - 1, Math.max(0, d))];
      for (let x = 0; x < w; x++) {
        tmp[o + x] = c;
        c += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let c = 0;
      for (let d = -r; d <= r; d++) c += tmp[Math.min(h - 1, Math.max(0, d)) * w + x] >= need ? 1 : 0;
      for (let y = 0; y < h; y++) {
        dst[y * w + x] = c >= need ? 1 : 0;
        c += (tmp[Math.min(h - 1, y + r + 1) * w + x] >= need ? 1 : 0) - (tmp[Math.max(0, y - r) * w + x] >= need ? 1 : 0);
      }
    }
  };
  const blur = s => {
    for (let y = 0; y < h; y++) for (let x = 0, o = y * w; x < w; x++) tmp[o + x] = (s[o + Math.max(0, x - 1)] + s[o + x] + s[o + Math.min(w - 1, x + 1)]) / 3;
    for (let y = 0; y < h; y++) for (let x = 0, o = y * w; x < w; x++) s[o + x] = (tmp[Math.max(0, y - 1) * w + x] + tmp[o + x] + tmp[Math.min(h - 1, y + 1) * w + x]) / 3;
  };
  // Some photographs have a thin rule round them (a white line, a black one). Paint it over with
  // what lies just inside, so that it is taken for neither backdrop nor piece.
  {
    const at = (side, t, u) => (side === 0 ? t * w + u : side === 1 ? (h - 1 - t) * w + u : side === 2 ? u * w + t : u * w + w - 1 - t);
    const line = (side, t) => {
      const len = side < 2 ? w : h; let sL = 0, sA = 0, sB = 0, sq = 0;
      for (let u = 0; u < len; u++) { const i = at(side, t, u); sL += L[i]; sA += A[i]; sB += B[i]; sq += L[i] * L[i]; }
      const mL = sL / len; return [mL, sA / len, sB / len, Math.sqrt(Math.max(0, sq / len - mL * mL))];
    };
    const apart = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    for (let side = 0; side < 4; side++) {
      const l0 = line(side, 0);
      if (l0[3] > 6) continue;
      let k = 1;
      while (k < 8) { const lt = line(side, k); if (lt[3] < 6 && apart(lt, l0) < 6) k++; else break; }
      if (k >= 8 || apart(line(side, k + 1), l0) < 12) continue;
      const len = side < 2 ? w : h;
      for (let t = 0; t <= k; t++) for (let u = 0; u < len; u++) { const i = at(side, t, u), j = at(side, k + 1, u); L[i] = L[j]; A[i] = A[j]; B[i] = B[j]; }
    }
  }
  blur(L); blur(A); blur(B);
  // How sharply the colour changes at each pixel: the outline of the piece is where it changes most.
  const G = new Float32Array(n);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, l = x > 0 ? i - 1 : i, r = x < w - 1 ? i + 1 : i, u = y > 0 ? i - w : i, d = y < h - 1 ? i + w : i;
    const gx = (L[r] - L[l]) ** 2 + (A[r] - A[l]) ** 2 + (B[r] - B[l]) ** 2, gy = (L[d] - L[u]) ** 2 + (A[d] - A[u]) ** 2 + (B[d] - B[u]) ** 2;
    G[i] = Math.sqrt(gx + gy) / 2;
  }

  // 2. The backdrop is a smooth studio sweep: fit a low-order surface to it in each of L, a and b,
  // first from the margins of the photograph, then again from all of the backdrop found from them.
  const basis = (i, k, out) => {
    const u = (i % w) / (w - 1) * 2 - 1, v = Math.floor(i / w) / (h - 1) * 2 - 1;
    out[0] = 1; out[1] = u; out[2] = v; out[3] = u * u; out[4] = u * v; out[5] = v * v;
    if (k > 6) { out[6] = u * u * u; out[7] = u * u * v; out[8] = u * v * v; out[9] = v * v * v; }
  };
  const phi = new Float64Array(10), coef = new Float64Array(30);
  const fit = (idx, keep, k) => {
    const M = new Float64Array(k * k), R = new Float64Array(k * 3);
    for (let s = 0; s < idx.length; s++) {
      if (!keep[s]) continue;
      const i = idx[s]; basis(i, k, phi);
      for (let a = 0; a < k; a++) { for (let b = 0; b < k; b++) M[a * k + b] += phi[a] * phi[b]; R[a * 3] += phi[a] * L[i]; R[a * 3 + 1] += phi[a] * A[i]; R[a * 3 + 2] += phi[a] * B[i]; }
    }
    for (let a = 0; a < k; a++) M[a * k + a] += 1e-3;
    for (let c = 0; c < k; c++) {         // Gaussian elimination with partial pivoting
      let p = c; for (let r = c + 1; r < k; r++) if (Math.abs(M[r * k + c]) > Math.abs(M[p * k + c])) p = r;
      if (p !== c) { for (let b = 0; b < k; b++) { const t = M[c * k + b]; M[c * k + b] = M[p * k + b]; M[p * k + b] = t; } for (let b = 0; b < 3; b++) { const t = R[c * 3 + b]; R[c * 3 + b] = R[p * 3 + b]; R[p * 3 + b] = t; } }
      const d = M[c * k + c] || 1e-9;
      for (let r = 0; r < k; r++) if (r !== c) { const m = M[r * k + c] / d; if (!m) continue; for (let b = c; b < k; b++) M[r * k + b] -= m * M[c * k + b]; for (let b = 0; b < 3; b++) R[r * 3 + b] -= m * R[c * 3 + b]; }
    }
    coef.fill(0);
    for (let a = 0; a < k; a++) for (let b = 0; b < 3; b++) coef[b * 10 + a] = R[a * 3 + b] / (M[a * k + a] || 1e-9);
  };
  const D = new Float32Array(n), P = new Float32Array(n * 3);     // how far each pixel is from the backdrop expected there, and that backdrop
  const predict = k => {
    for (let i = 0; i < n; i++) {
      basis(i, k, phi);
      let l = 0, a = 0, b = 0;
      for (let t = 0; t < k; t++) { l += coef[t] * phi[t]; a += coef[10 + t] * phi[t]; b += coef[20 + t] * phi[t]; }
      l = Math.max(0, Math.min(100, l)); a = Math.max(-100, Math.min(100, a)); b = Math.max(-100, Math.min(100, b));     // a surface fitted to part of the photograph can run wild beyond it
      P[i * 3] = l; P[i * 3 + 1] = a; P[i * 3 + 2] = b;
      D[i] = Math.sqrt((L[i] - l) ** 2 + (A[i] - a) ** 2 + (B[i] - b) ** 2);
    }
  };
  const median = (arr, m) => { const s = Float32Array.from(arr.subarray(0, m)).sort(); return s[m >> 1] || 0; };
  const resid = (idx, k, res) => {
    for (let s = 0; s < idx.length; s++) {
      const i = idx[s]; basis(i, k, phi);
      let l = 0, a = 0, b = 0;
      for (let t = 0; t < k; t++) { l += coef[t] * phi[t]; a += coef[10 + t] * phi[t]; b += coef[20 + t] * phi[t]; }
      res[s] = Math.sqrt((L[i] - l) ** 2 + (A[i] - a) ** 2 + (B[i] - b) ** 2);
    }
  };
  // Fit robustly: whatever of the piece reaches the margins is set aside, a few times over.
  const robust = (idx, k, keep) => {
    const res = new Float32Array(idx.length);
    let scale = 0;
    for (let it = 0; it < 4; it++) {
      fit(idx, keep, k); resid(idx, k, res);
      let m = 0; for (let s = 0; s < idx.length; s++) if (keep[s]) tmp[m++] = res[s];
      scale = Math.max(0.6, median(tmp, m));
      for (let s = 0; s < idx.length; s++) keep[s] = res[s] < Math.max(3.5, 3 * scale) ? 1 : 0;
    }
    let kept = 0; for (let s = 0; s < idx.length; s++) kept += keep[s];
    return { scale, share: kept / idx.length };
  };
  const band = Math.max(2, Math.round(Math.min(w, h) * 0.015)), rim = [], side = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < band || y < band || x >= w - band || y >= h - band) { rim.push(y * w + x); side.push(y < band ? 0 : y >= h - band ? 3 : y < h / 2 ? 1 : 2); }
  // The piece may run off the photograph at the bottom (a plinth), or at a side, or the top. So
  // try the backdrop as seen along different parts of the margin, and go with the one most of
  // the margin agrees with.
  let first = null, best = -1;
  const res0 = new Float32Array(rim.length);
  for (const use of [[0, 1, 2, 3], [0, 1], [0, 1, 2], [1, 2, 3], [1, 2]]) {
    const keep = new Uint8Array(side.length); for (let s = 0; s < side.length; s++) keep[s] = use.indexOf(side[s]) >= 0 ? 1 : 0;
    fit(rim, keep, 6); resid(rim, 6, res0);
    let agree = 0; for (let s = 0; s < rim.length; s++) if (res0[s] < 5) agree++;
    if (agree > best) { best = agree; first = Uint8Array.from(res0, r => (r < 5 ? 1 : 0)); }
  }
  const rimFit = robust(rim, 6, first);
  { let m = 0; for (let s = 0; s < rim.length; s += 2) if (first[s]) tmp[m++] = G[rim[s]]; rimFit.grain = median(tmp, m); }

  // Something to show if the backdrop cannot be found: the photograph on a card with rounded corners.
  const card = rad => {
    const r = Math.max(2, Math.min(w, h) * rad);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = Math.max(0, r - x - 0.5, x + 0.5 - (w - r)), dy = Math.max(0, r - y - 0.5, y + 0.5 - (h - r));
      const e = Math.min(x + 0.5, y + 0.5, w - x - 0.5, h - y - 0.5), out = dx > 0 && dy > 0 ? Math.hypot(dx, dy) - r + 1 : 1 - e;
      px[(y * w + x) * 4 + 3] = Math.round(255 * Math.max(0, Math.min(1, 0.5 - out)));
    }
    return true;
  };
  // No plain backdrop round most of the edge (a photograph taken in a room, a piece cropped on every side).
  if (rimFit.share < 0.4 || rimFit.scale > 2 && rimFit.grain > 0.4) return card(0.04);

  // 3. Grow the backdrop in from the edge, only through pixels that look like it and lie on no edge.
  // An edge is thickened by a pixel first, so the backdrop cannot slip through a one-pixel gap in it.
  const G3 = new Float32Array(n);
  for (let y = 0, o = 0; y < h; y++, o += w) for (let x = 0; x < w; x++) tmp[o + x] = Math.max(G[o + (x > 0 ? x - 1 : x)], G[o + x], G[o + (x < w - 1 ? x + 1 : x)]);
  for (let y = 0, o = 0; y < h; y++, o += w) for (let x = 0; x < w; x++) G3[o + x] = Math.max(tmp[(y > 0 ? o - w : o) + x], tmp[o + x], tmp[(y < h - 1 ? o + w : o) + x]);
  const lab = new Uint8Array(n), stack = new Int32Array(n);       // 1 backdrop, 2 the piece
  let T = 0, Gt = 0;
  const fromEdge = (ok, mark) => {      // flood from the edge of the photograph through pixels ok(i), marking them; returns how many
    let top = 0, count = 0;
    const seed = i => { if (lab[i] !== mark && ok(i)) { lab[i] = mark; stack[top++] = i; } };
    for (let x = 0; x < w; x++) { seed(x); seed(n - w + x); }
    for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
    while (top) { const i = stack[--top], x = i % w; count++; if (x > 0) seed(i - 1); if (x < w - 1) seed(i + 1); if (i >= w) seed(i - w); if (i < n - w) seed(i + w); }
    return count;
  };
  const flood = () => { lab.fill(0); return fromEdge(i => D[i] < T && G3[i] < Gt, 1); };
  const gauge = sc => {
    T = Math.min(12, Math.max(4.5, 2.5 * sc + 2.5));
    let m = 0; for (let s = 0; s < rim.length; s += 3) if (D[rim[s]] < T) tmp[m++] = G[rim[s]];
    Gt = Math.min(6, Math.max(1.6, 3 * median(tmp, m) + 1));
  };
  predict(6); gauge(rimFit.scale);
  let got = flood();
  // Refit on everything found, with a cubic once there is enough of it to hold one steady.
  if (got > n * 0.05) {
    const idx = [], step = Math.max(1, Math.round(Math.sqrt(got / 6000)));
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (lab[y * w + x]) idx.push(y * w + x);
    const k = got > n * 0.2 ? 10 : 6, fit2 = robust(idx, k, new Uint8Array(idx.length).fill(1));
    if (fit2.scale > 2.6) return card(0.04);      // what was found is not a plain backdrop either
    predict(k); gauge(fit2.scale);
    got = flood();
  }
  // How each pixel differs from the backdrop expected there: in lightness, and in hue. A shadow, or
  // light spilling across the floor, changes the first and hardly the second.
  const DL = new Float32Array(n), DC = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const pl = P[i * 3], pa = P[i * 3 + 1], pb = P[i * 3 + 2], r = Math.max(0, Math.min(1.5, L[i] / Math.max(1, pl)));
    DL[i] = L[i] - pl;
    DC[i] = Math.sqrt(Math.min((A[i] - pa) ** 2 + (B[i] - pb) ** 2, (A[i] - pa * r) ** 2 + (B[i] - pb * r) ** 2));
  }
  // So the backdrop may also run on from the edge through smooth ground that differs from it only
  // in how brightly it is lit (the bright floor of a sweep, a soft shadow), never across an edge.
  lab.fill(0);
  fromEdge(i => G3[i] < Gt && (D[i] < T || DC[i] < (DL[i] < 0 && L[i] > P[i * 3] * 0.45 ? Math.max(5.5, T * 1.1) : Math.max(3, T * 0.6))), 1);
  // That flood is only a seed for the backdrop, so it is kept well clear of the piece: drawn in
  // by three pixels, and whatever that cuts off from the edge (where it slipped in through a gap
  // in the outline) is given up. Likewise what lies more than three pixels beyond it is taken
  // as a seed of the piece, even where it is as pale as the backdrop (white porcelain on white).
  const far = new Uint8Array(n);
  {
    const m = new Uint8Array(n);
    grow(lab, far, 3, true);
    for (let i = 0; i < n; i++) far[i] ^= 1;
    grow(lab, m, 3, false);
    lab.fill(0); fromEdge(i => m[i] === 1, 1);
  }

  // 4. Seeds of the piece: whatever is plainly unlike the backdrop, except what is only a shadow
  // on it (darker, but the same hue, and not too dark). Then backdrop and piece are flooded outward
  // together in order of edge strength (a watershed), so that they meet on the strongest edge
  // between them. The backdrop pays extra to enter anything unlike it, so where the outline is
  // faint it is the backdrop that gives way, not the piece; a shadow costs it only its change of hue.
  const To = Math.max(T * 2, T + 7);
  const cost = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const dl = DL[i], dc = DC[i];
    // (In the lower part of the photograph, light thrown on the floor is treated the same way.)
    const shade = dc < Math.max(4, T * 0.7) && (dl < 0 ? L[i] > P[i * 3] * 0.45 : i > n * 0.6);
    if (!lab[i] && (D[i] > To || far[i]) && !shade) lab[i] = 2;
    cost[i] = 0.6 * Math.max(0, (shade ? dc + 0.15 * Math.abs(dl) : D[i]) - T);
  }
  const NB = 1024, head = new Int32Array(NB).fill(-1), next = new Int32Array(n);
  let cur = 0;
  const push = (i, b) => { if (b < cur) b = cur; if (b >= NB) b = NB - 1; next[i] = head[b]; head[b] = i; };
  for (let i = 0; i < n; i++) if (lab[i]) push(i, 0);
  for (;;) {
    while (cur < NB && head[cur] < 0) cur++;
    if (cur >= NB) break;
    const i = head[cur]; head[cur] = next[i];
    const li = lab[i];
    for (let k = 0; k < 4; k++) {
      if (!inside(i, k)) continue;
      const j = i + N4[k];
      if (lab[j]) continue;
      lab[j] = li;
      push(j, Math.round(8 * (G[j] + (li === 1 ? cost[j] : 0))));
    }
  }

  // 5. Backdrop is only what joins up with the edge of the photograph. Anything shut inside the
  // piece (a pale cheek, the top of a plaster head) is the piece, so there are no holes.
  const obj = new Uint8Array(n).fill(1);
  {
    let top = 0;
    const seed = i => { if (lab[i] === 1 && obj[i]) { obj[i] = 0; stack[top++] = i; } };
    for (let x = 0; x < w; x++) { seed(x); seed(n - w + x); }
    for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
    while (top) { const i = stack[--top]; for (let k = 0; k < 4; k++) if (inside(i, k)) seed(i + N4[k]); }
  }
  // Keep the piece itself, and any other part of it of real size (a lid set beside its jar); drop specks.
  const comp = new Int32Array(n), sizes = [0];
  for (let i0 = 0; i0 < n; i0++) {
    if (!obj[i0] || comp[i0]) continue;
    const c = sizes.length; let top = 0, sz = 0;
    comp[i0] = c; stack[top++] = i0;
    while (top) { const i = stack[--top]; sz++; for (let k = 0; k < 4; k++) { if (!inside(i, k)) continue; const j = i + N4[k]; if (obj[j] && !comp[j]) { comp[j] = c; stack[top++] = j; } } }
    sizes.push(sz);
  }
  const big = Math.max(...sizes), floor = Math.max(big * 0.15, n * 0.003);
  let area = 0;
  for (let i = 0; i < n; i++) { obj[i] = obj[i] && sizes[comp[i]] >= floor ? 1 : 0; area += obj[i]; }

  // Too little left, or too little taken: not a cut-out worth showing.
  if (area < n * 0.04) return card(0.06);
  if (area > n * 0.96) return card(0.03);

  // 6. Close small nicks in the outline (2 px), fill again whatever that shuts in, then take one
  // pixel off all round, where piece and backdrop were blurred together, and soften the edge by one.
  const m2 = new Uint8Array(n);
  grow(obj, m2, 2, true); grow(m2, obj, 2, false);
  {
    m2.fill(1);
    let top = 0;
    const seed = i => { if (!obj[i] && m2[i]) { m2[i] = 0; stack[top++] = i; } };
    for (let x = 0; x < w; x++) { seed(x); seed(n - w + x); }
    for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
    while (top) { const i = stack[--top]; for (let k = 0; k < 4; k++) if (inside(i, k)) seed(i + N4[k]); }
  }
  // Real openings in the piece (through a handle, between an arm and the body) are carved out
  // after all, but only where the opening is plainly backdrop and the piece's outline runs strongly
  // all the way round it. A pale patch on the piece fades into it, and so stays.
  {
    const seen = new Uint8Array(n), ring = new Int32Array(n);
    const open = i => m2[i] && D[i] < T * 0.8 && G3[i] < Gt;
    for (let i0 = 0; i0 < n; i0++) {
      if (seen[i0] || !open(i0)) continue;
      const list = []; let top = 0, sumD = 0, edge = 0, strong = 0;
      seen[i0] = 1; stack[top++] = i0;
      while (top) {
        const i = stack[--top]; list.push(i); sumD += D[i];
        for (let k = 0; k < 4; k++) {
          if (!inside(i, k)) continue;
          const j = i + N4[k];
          if (seen[j]) continue;
          if (open(j)) { seen[j] = 1; stack[top++] = j; } else if (ring[j] !== i0 + 1) { ring[j] = i0 + 1; edge++; const j2 = inside(j, k) ? j + N4[k] : j; if (Math.max(G3[j], G3[j2]) > Gt * 2.5) strong++; }
        }
      }
      if (list.length >= Math.max(30, n * 0.0015) && (sumD / list.length < T * 0.5 && strong >= edge * 0.75 || sumD / list.length < T * 0.15 && strong >= edge * 0.5 && list.length > n * 0.01)) {
        // and its rim of blurred backdrop with it, out to the outline.
        let edgeList = list;
        for (const i of list) m2[i] = 0;
        for (let pass = 0; pass < 2; pass++) {
          const more = [];
          for (const i of edgeList) for (let k = 0; k < 4; k++) { if (!inside(i, k)) continue; const j = i + N4[k]; if (m2[j] && D[j] < T) { m2[j] = 0; more.push(j); } }
          edgeList = more;
        }
      }
    }
  }
  grow(m2, obj, 1, false);
  for (let y = 0, o = 0; y < h; y++, o += w) for (let x = 0; x < w; x++) tmp[o + x] = obj[o + (x > 0 ? x - 1 : x)] + obj[o + x] + obj[o + (x < w - 1 ? x + 1 : x)];
  for (let y = 0, o = 0; y < h; y++, o += w) for (let x = 0; x < w; x++) px[(o + x) * 4 + 3] = Math.round((tmp[(y > 0 ? o - w : o) + x] + tmp[o + x] + tmp[(y < h - 1 ? o + w : o) + x]) * 255 / 9);
  // The clear pixels take the colour of the piece beside them, out to three pixels, so no grey
  // fringe of backdrop shows where the graphics card blends a pixel of the piece with one beyond it.
  {
    const done = m2;      // 1 where the colour is the piece's own, or has been carried out to (2 briefly: queued)
    for (let i = 0; i < n; i++) done[i] = px[i * 4 + 3] >= 128 ? 1 : 0;
    let front = [];
    for (let i = 0; i < n; i++) if (!done[i]) { const x = i % w; if ((x > 0 && done[i - 1]) || (x < w - 1 && done[i + 1]) || (i >= w && done[i - w]) || (i < n - w && done[i + w])) front.push(i); }
    for (let pass = 0; pass < 3 && front.length; pass++) {
      const paint = [];
      for (const i of front) {
        let r = 0, g = 0, b = 0, c = 0;
        for (let k = 0; k < 4; k++) { if (!inside(i, k)) continue; const j = i + N4[k]; if (done[j]) { r += px[j * 4]; g += px[j * 4 + 1]; b += px[j * 4 + 2]; c++; } }
        if (c) paint.push(i, r / c, g / c, b / c);
      }
      for (let s = 0; s < paint.length; s += 4) { const i = paint[s]; px[i * 4] = paint[s + 1]; px[i * 4 + 1] = paint[s + 2]; px[i * 4 + 2] = paint[s + 3]; done[i] = 1; }
      const next = [];
      for (let s = 0; s < paint.length; s += 4) { const i = paint[s]; for (let k = 0; k < 4; k++) { if (!inside(i, k)) continue; const j = i + N4[k]; if (!done[j]) { done[j] = 2; next.push(j); } } }
      for (const j of next) done[j] = 0;
      front = next;
    }
  }
  return true;
}

// The same, on the page itself: used only where a worker cannot do it.
function cutOut(img) {
  const k = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(2, Math.round(img.naturalWidth * k)), h = Math.max(2, Math.round(img.naturalHeight * k));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);
  let data;
  try { data = g.getImageData(0, 0, w, h); } catch { return c; }
  if (cutPixels(data.data, w, h)) g.putImageData(data, 0, 0);
  return c;
}

// Pictures are fetched, decoded and (for sculpture) cut out away from the page, so that none of it
// can hold up a frame. What comes back is ready to hand straight to the graphics card.
const LOADER = `${cutPixels.toString()}
onmessage = async e => {
  const { id, url, obj } = e.data;
  try {
    const r = await fetch(url, { mode: 'cors', referrerPolicy: 'no-referrer' });
    if (!r.ok) throw new Error('http ' + r.status);
    const blob = await r.blob();
    let bmp;
    if (obj) {
      const src = await createImageBitmap(blob);
      const k = Math.min(1, 512 / Math.max(src.width, src.height)), w = Math.max(2, Math.round(src.width * k)), h = Math.max(2, Math.round(src.height * k));
      const c = new OffscreenCanvas(w, h), g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(src, 0, 0, w, h); src.close();
      const d = g.getImageData(0, 0, w, h);
      if (cutPixels(d.data, w, h)) g.putImageData(d, 0, 0);
      bmp = await createImageBitmap(c, { imageOrientation: 'flipY', premultiplyAlpha: 'none' });
    } else bmp = await createImageBitmap(blob, { imageOrientation: 'flipY' });
    postMessage({ id, bmp }, [bmp]);
  } catch (err) {
    // A browser that cannot do this at all says so once, and the page does the work itself from then on.
    postMessage({ id, fail: true, cannot: err instanceof TypeError && !/fetch|network|load/i.test(String(err.message)) || typeof OffscreenCanvas === 'undefined' });
  }
};`;

// The lamp does not simply come on. It catches, twice, like a tube warming up.
function flicker(e) {
  if (e < 0) return 0;
  if (e < 0.05) return 0.8;
  if (e < 0.13) return 0.08;
  if (e < 0.2) return 0.65;
  if (e < 0.29) return 0.2;
  const t = Math.min(1, (e - 0.29) / 0.7);
  return 0.55 + 0.45 * t * t * (3 - 2 * t);
}

export class Museum {
  // With `later`, only the start is made here: buildNext() then puts up the building one part at a time, so a
  // loading screen can be given a frame between the parts. Without it the whole building is put up at once.
  constructor(plan, collection, mirror, maxAniso, later = false) {
    this.plan = plan;
    this.collection = collection;
    this.group = new THREE.Group();
    this.rooms = {};
    this.time = 0;
    this.onWake = null;         // (art, roomId) each time a lamp catches
    this.onRoomLit = null;      // (roomId) the first time a room is entered
    this.maxAniso = maxAniso;
    this.loading = 0;
    this.textures = { wallGlow: TX.wallGlow() };
    this.mirror = mirror;
    this.onSeen = null;         // (art, roomState) the first time a work is properly looked at
    this.seenIds = new Set(); this.visited = new Set();
    try { this.seenIds = new Set(JSON.parse(localStorage.getItem('after-hours.seen-ids') || '[]')); this.visited = new Set(JSON.parse(localStorage.getItem('after-hours.rooms') || '[]')); } catch { /* no storage */ }
    this.kit = new THREE.Group();     // the stunt kit, so it can be put away while you look at a picture
    this.group.add(this.kit);
    this._toBuild = [() => this._buildShell(mirror), () => this._buildOutside(), () => this._buildHall(), () => this._buildArt(), () => this._buildFurniture(),
      () => { this._buildStunts(); this._buildLevels(); this.group.updateMatrixWorld(true); }];
    if (!later) while (this.buildNext());
  }
  /** Puts up the next part of the building. True while there is more to come. */
  buildNext() { const f = this._toBuild.shift(); if (f) f(); return this._toBuild.length > 0; }

  // ------------------------------------------------------------------ shell --

  _buildShell(mirror) {
    const { plan } = this;
    const wcTile = new Geo(), wcEdge = new Geo(), portals = new Geo(), stone = new Geo(), slate = new Geo(), lay = new Geo(), facade = new Geo(), roofs = new Geo();
    const woodTex = TX.wood();
    this.floors = [];
    const fq = (g, x0, x1, z0, z1, s, y = 0) => g.quad(P3(x0, y, z0), P3(x1, y, z0), P3(x1, y, z1), P3(x0, y, z1), [0, 1, 0],
      [[x0 / s, z0 / s], [x1 / s, z0 / s], [x1 / s, z1 / s], [x0 / s, z1 / s]]);
    const over = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
    // What is left of a stretch once the bits in `cuts` are taken out.
    // A flat sheet with a rectangular hole in it (or without, if `hole` is null).
    const sheet = (geo, x0, x1, z0, z1, y, n, uv, hole) => {
      const q = (a, b, c, d) => { if (b - a > 0.01 && d - c > 0.01) geo.quad(P3(a, y, c), P3(b, y, c), P3(b, y, d), P3(a, y, d), n, uv(a, b, c, d)); };
      if (!hole) return q(x0, x1, z0, z1);
      q(x0, x1, z0, hole.z0); q(x0, x1, hole.z1, z1); q(x0, hole.x0, hole.z0, hole.z1); q(hole.x1, x1, hole.z0, hole.z1);
    };
    const minus = (lo, hi, cuts) => {
      let segs = [[lo, hi]];
      for (const [a, b] of cuts) segs = segs.flatMap(([p, q]) => (b <= p || a >= q ? [[p, q]] : [[p, Math.min(q, a)], [Math.max(p, b), q]].filter(([m, n]) => n - m > 0.02)));
      return segs;
    };

    // Each room is built from its own floor up, as if that were the ground, and then lifted to its level.
    const lift = (m, y) => { m.position.y = y; m.updateMatrix(); return m; };
    plan.rooms.forEach(r => {
      const walls = new Geo(), trim = new Geo();
      const lower = r.floor === 'LL' || r.floor === 'X' || r.kind === 'corridor';
      for (const w of plan.walls.filter(w => w.room === r)) {
        if (w.side === r.glass) continue;                  // one end of Griffin Court is all window
        const q = (u0, u1, y0, y1) => { if (u1 - u0 > 0.005 && y1 - y0 > 0.005) walls.quad(
          Object.values(wallPoint(w, u0, y0)), Object.values(wallPoint(w, u1, y0)),
          Object.values(wallPoint(w, u1, y1)), Object.values(wallPoint(w, u0, y1)),
          [w.nx, 0, w.nz], [[u0 / 3, y0 / r.h], [u1 / 3, y0 / r.h], [u1 / 3, y1 / r.h], [u0 / 3, y1 / r.h]]); };
        // The holes in this wall: its doorways, each starting at its own height above the floor (in a
        // tall room a doorway may be a storey up, over another), and over the front door the open fanlight.
        const holes = w.openings.map(o => ({ lo: o.lo, hi: o.hi, y0: Math.max(0, o.y), y1: o.y + o.h }));
        const t = w.openings.some(o => o.door === plan.front) ? plan.transom : null;
        if (t) holes.push({ lo: t.z0, hi: t.z1, y0: t.y0 - r.y, y1: t.y1 - r.y });
        // Cut the wall into upright strips at every edge of every hole, and plaster each strip between the holes in it.
        const cuts = [...new Set([w.lo, w.hi, ...holes.flatMap(o => [o.lo, o.hi])])].filter(u => u >= w.lo - 0.001 && u <= w.hi + 0.001).sort((a, b) => a - b);
        for (let i = 0; i < cuts.length - 1; i++) {
          const a = cuts[i], b = cuts[i + 1], mid = (a + b) / 2;
          let y = 0;
          for (const o of holes.filter(o => o.lo < mid && o.hi > mid).sort((p, n) => p.y0 - n.y0)) { q(a, b, y, o.y0); y = Math.max(y, o.y1); }
          q(a, b, y, r.h);
        }
        // (A doorway that has not been found is a wall, and a wall keeps its mouldings: see src/secret.js for the piece that slides.)
        if (!lower) for (const o of w.openings) if (o.door.hidden) { const at = wallPoint(w, (o.lo + o.hi) / 2, 0), half = (o.hi - o.lo) / 2; trim.wallBox(at, w.nx, w.nz, -half, half, r.h - 0.34, r.h, 0, 0.14); trim.wallBox(at, w.nx, w.nz, -half, half, r.h - 0.46, r.h - 0.34, 0, 0.06); }
        if (!lower) for (const sg of w.segs) {
          // Each moulding stops a centimetre inside the stone surround of a doorway it runs up to (0.3 m of jamb, 0.38 m of
          // lintel either side): ending on the surround's own face, the two flickered against each other.
          const by = (u, top) => { let n = 0; for (const o of w.openings) if (!o.door.hidden && !o.door.nest && (Math.abs(o.lo - u) < 0.03 || Math.abs(o.hi - u) < 0.03) && (top == null || o.y + o.h + 0.37 > top)) n = Math.max(n, top == null ? 0.29 : 0.37); return n; };
          const run = (y0, y1, dep, top) => { const a = sg.lo + by(sg.lo, top), b = sg.hi - by(sg.hi, top); if (b - a < 0.02) return; trim.wallBox(wallPoint(w, (a + b) / 2, 0), w.nx, w.nz, -(b - a) / 2, (b - a) / 2, y0, y1, 0, dep); };
          run(0, 0.24, 0.035, null);
          run(r.h - 0.34, r.h, 0.14, r.h - 0.46);
          run(r.h - 0.46, r.h - 0.34, 0.06, r.h - 0.46);
        }
      }
      // The ceiling takes the room's own paint and glows with it, faintly. It has a hole where a skylight
      // stands open, and wherever a stair or a lift comes down through it from the room above.
      const hole = plan.skylights.find(k => k.room === r.id) || null;
      const through = plan.wells.filter(k => k.y > r.y + 1 && Math.abs(k.y - SLAB - r.top) < 1.3 && over(k, r));
      if (r.kind !== 'hall') for (const c of carve(r, hole ? [hole, ...through] : through)) sheet(walls, c.x0, c.x1, c.z0, c.z1, r.h, [0, -1, 0], () => [[0, 0.9], [1, 0.9], [1, 0.9], [0, 0.9]], null);
      const tint = new THREE.Color(r.tint);
      const wallMat = new THREE.MeshStandardMaterial({
        color: tint, roughness: 0.94, metalness: 0,
        emissive: tint.clone().lerp(WARM, 0.35), emissiveMap: this.textures.wallGlow, emissiveIntensity: 0,
      });
      const trimMat = new THREE.MeshStandardMaterial({ color: 0xb9ae9b, roughness: 0.8, emissive: new THREE.Color(0.75, 0.62, 0.45), emissiveIntensity: 0 });
      this.group.add(lift(walls.mesh(wallMat), r.y));
      if (!trim.empty) this.group.add(lift(trim.mesh(trimMat), r.y));
      const state = this.rooms[r.id] = { room: r, wallMat, trimMat, wake: 0, lit: false, arts: [], frameMats: [], seen: 0, done: false };

      // Floors: wood upstairs, stone on the ground floor and in the great rooms, slate below.
      // A floor has a hole in it where a stair or a lift goes down through it.
      const w = r.x1 - r.x0, d = r.z1 - r.z0, boards = carve(r, plan.wells.filter(k => Math.abs(k.y - r.y) < 0.02 && over(k, r)));
      if (r.use === 'wc' || /^Restroom/i.test(r.gallery || '')) {
        // A restroom has its own floor: small non-slip mosaic, with a darker course along the walls.
        for (const c of boards) fq(wcTile, c.x0, c.x1, c.z0, c.z1, 0.8, r.y);
        const e = 0.16, y = r.y + 0.002;
        for (const [x0, x1, z0, z1] of [[r.x0, r.x1, r.z0, r.z0 + e], [r.x0, r.x1, r.z1 - e, r.z1], [r.x0, r.x0 + e, r.z0 + e, r.z1 - e], [r.x1 - e, r.x1, r.z0 + e, r.z1 - e]]) fq(wcEdge, x0, x1, z0, z1, 0.8, y);
      }
      else if (lower) for (const c of boards) fq(slate, c.x0, c.x1, c.z0, c.z1, 1.6, r.y);
      else if (r.kind === 'hall' || r.floor === '1' || r.id === 'G200') for (const c of boards) fq(stone, c.x0, c.x1, c.z0, c.z1, 1.3, r.y);
      else {
        const fl = new Geo();
        for (const c of boards) fq(fl, c.x0, c.x1, c.z0, c.z1, 1.7, r.y);
        const fm = mirror.patch(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.55, emissiveMap: woodTex, emissive: new THREE.Color(1, 0.86, 0.7), emissiveIntensity: 0.02 }), [0.02, 0.5]);
        this.floors.push(fl.mesh(fm));
        state.floorMat = fm;
      }
      // A skylight in any room big enough to have had one, and with sky over it: not under another floor.
      if (r.kind === 'gallery' && !lower && r.sky && Math.min(w, d) >= 8.5) {
        const mx = w * 0.27, mz = d * 0.27;
        const X0 = r.x0 + mx, X1 = r.x1 - mx, Z0 = r.z0 + mz, Z1 = r.z1 - mz;
        sheet(lay, X0, X1, Z0, Z1, r.top - 0.03, [0, -1, 0], (a, b, c, d) => [[(a - X0) / (X1 - X0), (c - Z0) / (Z1 - Z0)], [(b - X0) / (X1 - X0), (c - Z0) / (Z1 - Z0)], [(b - X0) / (X1 - X0), (d - Z0) / (Z1 - Z0)], [(a - X0) / (X1 - X0), (d - Z0) / (Z1 - Z0)]], hole);
      }

      // The outside of it: stone wherever no other room stands against this one, and a roof under snow.
      // (A room below ground has no outside. One above it is a block from the street to its roof, whatever level its floor is on.)
      const m = plan.massOf[r.id];
      if (!m) return;
      const top = r.kind === 'hall' ? SPRING + 0.4 : m.top;
      // Every doorway pierces the outside wall it passes through. And so does a way in cut for a room above or below this one:
      // stacked rooms are each a block from the street up, their walls in the same plane, and one of them would wall the hole up.
      const outs = plan.doors.filter(dd => dd.a === r.id || dd.b === r.id || (dd.out && dd.y < 0.1 && (q => q && q !== r && q.x0 < r.x1 && q.x1 > r.x0 && q.z0 < r.z1 && q.z1 > r.z0)(plan.byId[dd.a])));
      const sides = [
        { name: 'w', at: m.x0, lo: m.z0, hi: m.z1, n: [-1, 0, 0], beyond: o => o.x0 < m.x0 - 0.01 && o.x1 > m.x0 - 0.01, span: o => [o.z0, o.z1], P: (u, y) => [m.x0, y, u], door: dd => dd.along === 'x' && dd.x1 <= r.x0 + 0.01 && [dd.z0, dd.z1] },
        { name: 'e', at: m.x1, lo: m.z0, hi: m.z1, n: [1, 0, 0], beyond: o => o.x0 < m.x1 + 0.01 && o.x1 > m.x1 + 0.01, span: o => [o.z0, o.z1], P: (u, y) => [m.x1, y, u], door: dd => dd.along === 'x' && dd.x0 >= r.x1 - 0.01 && [dd.z0, dd.z1] },
        { name: 'n', at: m.z0, lo: m.x0, hi: m.x1, n: [0, 0, -1], beyond: o => o.z0 < m.z0 - 0.01 && o.z1 > m.z0 - 0.01, span: o => [o.x0, o.x1], P: (u, y) => [u, y, m.z0], door: dd => dd.along === 'z' && dd.z1 <= r.z0 + 0.01 && [dd.x0, dd.x1] },
        { name: 's', at: m.z1, lo: m.x0, hi: m.x1, n: [0, 0, 1], beyond: o => o.z0 < m.z1 + 0.01 && o.z1 > m.z1 + 0.01, span: o => [o.x0, o.x1], P: (u, y) => [u, y, m.z1], door: dd => dd.along === 'z' && dd.z0 >= r.z1 - 0.01 && [dd.x0, dd.x1] },
      ];
      const style = r.building === 'modern' ? 'modern' : r.building === 'lower' ? 'concrete' : r.building === 'first' ? 'brick' : r.x0 < 126 && r.x1 > 108 ? 'bridge' : r.x0 >= 124 ? 'columbus' : 'beaux';
      const SK = STYLES[style], skin = (FAC[style] = FAC[style] || { wall: new Geo(), trim: new Geo() });
      for (const sd of sides) {
        if (sd.name === r.glass) continue;
        // Mouldings: a cap along the top of the wall, a footing along the bottom.
        const band = (u0, u1, y0, y1, d) => { if (d <= 0 || u1 - u0 < 0.02) return; if (sd.n[0]) { const a = sd.at, b = sd.at + sd.n[0] * d; skin.trim.box(Math.min(a, b), Math.max(a, b), y0, y1, u0, u1); } else { const a = sd.at, b = sd.at + sd.n[2] * d; skin.trim.box(u0, u1, y0, y1, Math.min(a, b), Math.max(a, b)); } };
        const next = plan.masses.filter(o => o !== m && sd.beyond(o)), cuts = next.map(sd.span);
        const face = (u0, u1, y0, y1) => skin.wall.quad(sd.P(u0, y0), sd.P(u1, y0), sd.P(u1, y1), sd.P(u0, y1), sd.n, [[u0 / SK.u, y0 / SK.v], [u1 / SK.u, y0 / SK.v], [u1 / SK.u, y1 / SK.v], [u0 / SK.u, y1 / SK.v]]);
        // What goes through this wall: this room's own doorways on this side, and any doorway at all whose passage crosses the
        // plane of the wall. (Rooms are stacked, and each is a block from the street up: the wall of the room above or below
        // stands in the same place as this one, or out in the thickness of the wall between two rooms, and would close the doorway.)
        const crosses = dd => { if (dd.hidden || (dd.along === 'x') !== !!sd.n[0]) return null; let t0 = sd.n[0] ? dd.x0 : dd.z0, t1 = sd.n[0] ? dd.x1 : dd.z1; if (dd.out) { const ra = plan.byId[dd.a], c = ra && (sd.n[0] ? (ra.x0 + ra.x1) / 2 : (ra.z0 + ra.z1) / 2); if (ra) { if ((t0 + t1) / 2 < c) t0 -= 0.7; else t1 += 0.7; } }      /* a way in must be open to the air beyond its own wall, too */
          return t0 <= sd.at + 0.02 && t1 >= sd.at - 0.02 ? (sd.n[0] ? [dd.z0, dd.z1] : [dd.x0, dd.x1]) : null; };
        const openings = plan.doors.map(dd => ({ span: (outs.includes(dd) && sd.door(dd)) || crosses(dd), y: dd.y, h: dd.h })).filter(o => o.span && o.span[1] > sd.lo && o.span[0] < sd.hi && o.y < top - 0.05);
        // A stretch of wall from y0 up to the top, less every opening in it: openings can stand one above another.
        const column = (lo, hi, y0, base) => {
          const us = [...new Set([lo, hi, ...openings.flatMap(o => o.span).filter(u => u > lo + 0.02 && u < hi - 0.02)])].sort((p, q) => p - q);
          for (let i = 0; i < us.length - 1; i++) {
            const p = us[i], qq = us[i + 1], mid = (p + qq) / 2; if (qq - p < 0.02) continue;
            const holes = openings.filter(o => o.span[0] < mid && o.span[1] > mid).map(o => [o.y, o.y + o.h]).sort((u, w) => u[0] - w[0]);
            let y = y0; for (const [h0, h1] of holes) { if (h0 - y > 0.05) face(p, qq, y, Math.min(h0, top)); y = Math.max(y, h1); } if (top - y > 0.02) face(p, qq, y, top);
            if (base && !holes.some(([h0]) => h0 < SK.base[1])) band(p, qq, 0, SK.base[1], SK.base[0]);
          }
        };
        for (const [a, bb] of minus(sd.lo, sd.hi, cuts)) {
          column(a, bb, 0, true);
          band(a, bb, top - SK.cap[1], top, SK.cap[0]);            // flush with the roof: a cap standing proud of it looked like a kerb to be got over
        }
        // Where this room stands taller than whatever is against it, its wall shows above that roof. Blocks
        // overlap now that rooms are stacked, so along each stretch it is the tallest neighbour that counts.
        const ends = [...new Set(next.flatMap(o => sd.span(o)).map(u => Math.max(sd.lo, Math.min(sd.hi, u))))].sort((p, q) => p - q);
        for (let i = 0; i < ends.length - 1; i++) {
          const lo = ends[i], hi = ends[i + 1], mid = (lo + hi) / 2, by = next.filter(o => sd.span(o)[0] < mid && sd.span(o)[1] > mid);
          if (!by.length || hi - lo < 0.02) continue;
          const cover = Math.max(...by.map(o => o.top));
          if (top <= cover + 0.05) continue;
          column(lo, hi, cover, false);
        }
      }
      // Its roof, where there is one: not under a taller block, and not where a skylight stands open.
      for (const c of m.roofs || []) sheet(roofs, c.x0, c.x1, c.z0, c.z1, m.top, [0, 1, 0], (a, b, c2, d2) => [[a / 5, c2 / 5], [b / 5, c2 / 5], [b / 5, d2 / 5], [a / 5, d2 / 5]], null);
    });

    // Doorways: stone surround right through the wall, and a threshold.
    for (const d of plan.doors) {
      const j = 0.3, p = 0.07, Y = d.y;
      if (d.vent) continue;                           // the vent has its own frame, below
      if (d.hidden) { fq(stone, d.x0, d.x1, d.z0, d.z1, 1.3, Y); continue; }      // no surround: nothing says there is a doorway here
      if (d.along === 'z') {
        portals.box(d.x0 - j, d.x0, Y, Y + d.h, d.z0 - p, d.z1 + p);
        portals.box(d.x1, d.x1 + j, Y, Y + d.h, d.z0 - p, d.z1 + p);
        portals.box(d.x0 - j - 0.08, d.x1 + j + 0.08, Y + d.h, Y + d.h + 0.36, d.z0 - p - 0.03, d.z1 + p + 0.03);
      } else {
        // Through the stone front (plan.facade), the front's own arch is the surround: this one starts behind its face, or its dark
        // jambs and lintel stand out over the stonework either side of the arch.
        const fac = d.out && plan.masses.some(m => m.facade && d.x0 > m.x0 - 0.05 && d.x0 < m.x1 && d.z0 < m.z1 && d.z1 > m.z0);
        const xa = fac ? d.x0 + 0.05 : d.x0 - p, xl = fac ? d.x0 + 0.05 : d.x0 - p - 0.03;
        portals.box(xa, d.x1 + p, Y, Y + d.h, d.z0 - j, d.z0);
        portals.box(xa, d.x1 + p, Y, Y + d.h, d.z1, d.z1 + j);
        portals.box(xl, d.x1 + p + 0.03, Y + d.h, Y + d.h + 0.36, d.z0 - j - 0.08, d.z1 + j + 0.08);
      }
      const low = [d.a, d.b].some(id => plan.byId[id] && (plan.byId[id].floor === 'LL' || plan.byId[id].floor === 'X' || plan.byId[id].kind === 'corridor'));
      fq(low ? slate : stone, d.x0, d.x1, d.z0, d.z1, low ? 1.6 : 1.3, Y);
    }
    // Faintly self-lit, so a doorway always reads as a doorway in the dark.
    this.group.add(portals.mesh(new THREE.MeshStandardMaterial({ color: 0xa69c8a, roughness: 0.75, emissive: 0x8a7f6c, emissiveIntensity: 0.07 })));

    const floorMat = (map, rough, k, glow) => mirror.patch(new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: 0, emissiveMap: map, emissive: new THREE.Color(0.55, 0.66, 1), emissiveIntensity: glow }), k);
    this.floors.push(stone.mesh(floorMat(TX.marble(), 0.35, [0.04, 0.62], 0.05)), slate.mesh(floorMat(TX.slate(), 0.4, [0.05, 0.6], 0.03)));
    if (!wcTile.empty) {
      this.floors.push(wcTile.mesh(floorMat(TX.mosaic(), 0.85, [0.01, 0.3], 0.05)));
      const em = TX.mosaic(true), edge = wcEdge.mesh(new THREE.MeshStandardMaterial({ map: em, roughness: 0.9, emissiveMap: em, emissive: new THREE.Color(0.55, 0.66, 1), emissiveIntensity: 0.05, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      this.group.add(edge);
    }
    this.group.add(...this.floors);
    this.group.add(lay.mesh(new THREE.MeshBasicMaterial({ map: TX.laylight(), color: new THREE.Color(0.34, 0.4, 0.56) })));
    const ash = TX.ashlar(), snowTex = TX.snow();
    if (!facade.empty) this.group.add(facade.mesh(new THREE.MeshStandardMaterial({ map: ash, roughness: 0.9, emissiveMap: ash, emissive: new THREE.Color(0.32, 0.36, 0.5), emissiveIntensity: 0.42 })));
    // Each building in its own stone, brick, steel or concrete.
    for (const [name, sk] of Object.entries(FAC)) {
      const t = TX.wallStyle(name), K = STYLES[name];
      if (!sk.wall.empty) this.group.add(sk.wall.mesh(new THREE.MeshStandardMaterial({ map: t, roughness: 0.88, emissiveMap: t, emissive: new THREE.Color(K.glow[0], K.glow[1], K.glow[2]), emissiveIntensity: 0.5 })));
      if (!sk.trim.empty) this.group.add(sk.trim.mesh(new THREE.MeshStandardMaterial({ color: K.trim, roughness: 0.8, emissive: K.trim, emissiveIntensity: 0.22 })));
    }
    this.group.add(roofs.mesh(new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5 })));
    this.snowTex = snowTex;

    // Over every doorway, the name of the room it leads to.
    const cache = new Map();
    const label = (title, sub) => { const k = title + '|' + sub; if (!cache.has(k)) cache.set(k, new THREE.MeshBasicMaterial({ map: TX.sign(title, sub), transparent: true, depthWrite: false, color: new THREE.Color(0.95, 0.95, 0.95) })); return cache.get(k); };
    const nameOf = id => {
      const r = plan.byId[id], set = this.collection.rooms[id];
      if (!r) return ['Way out', ''];
      if (r.kind === 'corridor') return ['Miniature Rooms', 'Gallery 11'];
      return [r.gallery.replace(/^Galleries /, 'Gallery ').replace(/\s*\(.*$/, '').slice(0, 34), set && set.names.length ? set.names.join('  ·  ') : ''];      // (a name's bracketed note is for the map, not the sign)
    };
    const signs = new THREE.Group();
    const hang1 = (d, into, from) => {
      // Stand in room `from`; the sign over the door names `into`.
      // (It needs wall to hang on: under the ceiling of the room it is in, and under any balcony that runs over the door.)
      const r = plan.byId[from], near = k => k.room === from && k.y > d.y + 1 && k.x0 < d.x1 + 2 && k.x1 > d.x0 - 2 && k.z0 < d.z1 + 2 && k.z1 > d.z0 - 2;
      const lo = from ? Math.min(r.top, ...plan.decks.filter(near).map(k => k.y - k.thick)) : 99;
      const dw = d.along === 'z' ? d.x1 - d.x0 : d.z1 - d.z0, w = Math.min(5.2, dw + 1.8), h = w * 96 / 512, y = d.y + d.h + 0.36 + h / 2 + 0.12;
      if (y + h / 2 > lo - 0.1) return;
      const [title, sub] = nameOf(into);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), label(title, sub));
      const cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2;
      // Which face of the wall: the one on `from`'s side of the door.
      let first;
      if (from) first = d.along === 'z' ? r.z1 <= d.z0 + 0.01 : r.x1 <= d.x0 + 0.01;
      else { const a = plan.byId[d.a]; first = !(d.along === 'z' ? a.z1 <= d.z0 + 0.01 : a.x1 <= d.x0 + 0.01); }
      if (d.along === 'z') { m.position.set(cx, y, first ? d.z0 - 0.03 : d.z1 + 0.03); m.rotation.y = first ? Math.PI : 0; }
      else { m.position.set(first ? d.x0 - 0.03 : d.x1 + 0.03, y, cz); m.rotation.y = first ? -Math.PI / 2 : Math.PI / 2; }
      m.matrixAutoUpdate = false; m.updateMatrix();
      signs.add(m);
    };
    for (const d of plan.doors) {
      if (d.vent || d.hidden) continue;
      if (d.out) { if (d !== plan.front) hang1(d, d.a, null); hang1(d, null, d.a); }
      else { hang1(d, d.b, d.a); hang1(d, d.a, d.b); }
    }
    this.group.add(signs);
  }

  // ---------------------------------------------------------------- outside --

  // The lie of the land (land.js): wherever the open ground rolls, the snow is drawn from the land itself, on a 1 m
  // mesh over every cell of its grid that rolls at all. It lies over the flat sheet (which runs on under it, out of
  // sight: the land is never below the street) and wins where the two meet at street level, with the sheet's own
  // texture at the sheet's own scale, so there is no seam. In blocks of 64 m, so what is off screen is not drawn.
  _buildLand(ground) {
    const L = this.plan.land; if (!L || !L.top) return;
    const geo = ground.geometry; geo.computeBoundingBox();
    const bb = geo.boundingBox, w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y, gx = ground.position.x, gz = ground.position.z;     // (the sheet's own mapping: u along x, v up its local y, which is -z)
    const mat = ground.material.clone(); mat.polygonOffset = true; mat.polygonOffsetFactor = -0.5; mat.polygonOffsetUnits = -0.5;
    const { X0, Z0, nx, nz, cells } = L, S = STEP_LAND, K = 2, d = S / K, B = 32, Y = -0.03, hAt = (x, z) => landAt(L, x, z);
    for (let bj = 0; bj < nz; bj += B) for (let bi = 0; bi < nx; bi += B) {
      const pos = [], nor = [], uv = [], idx = [], at = new Map();
      const vert = (I, J) => {                        // a point of the fine mesh, K to a cell each way
        const k = J * (nx * K + 1) + I; let v = at.get(k); if (v !== undefined) return v;
        v = pos.length / 3; at.set(k, v);
        const x = X0 + I * d, z = Z0 + J * d, e = 0.25;
        pos.push(x, hAt(x, z) + Y, z);
        const dx = (hAt(x + e, z) - hAt(x - e, z)) / (2 * e), dz = (hAt(x, z + e) - hAt(x, z - e)) / (2 * e), l = Math.hypot(dx, 1, dz);
        nor.push(-dx / l, 1 / l, -dz / l);
        uv.push((x - gx) / w + 0.5, (gz - z) / h + 0.5);
        return v;
      };
      for (let j = bj; j < Math.min(nz, bj + B); j++) for (let i = bi; i < Math.min(nx, bi + B); i++) {
        if (!cells[j * nx + i]) continue;
        for (let b = 0; b < K; b++) for (let a = 0; a < K; a++) {
          const I = i * K + a, J = j * K + b, p = vert(I, J), q = vert(I + 1, J), r = vert(I, J + 1), t = vert(I + 1, J + 1);
          idx.push(p, r, q, q, r, t);
        }
      }
      if (!idx.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'land'; this.group.add(m);
    }
  }

  _buildOutside() {
    const { plan } = this, B = plan.bounds, cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2;
    // Snow on the ground, as far as you are allowed to go.
    const gt = this.snowTex.clone(); gt.needsUpdate = true; gt.repeat.set((B.x1 - B.x0) / 6, (B.z1 - B.z0) / 6);
    // The snow lies over everything at street level, under the building too, where the floors hide it. Wherever the way
    // goes down below the street (a flight to the lower level, a lift, the clear ice over the fishing hole) it is left
    // open, or you would see snow through the hole instead of the stair going down.
    const openings = groundOpenings(plan);
    // A sheet of snow w by h centred on (gx, gz), with those openings that fall inside it left open.
    const sheetGeo = (w, h, gx, gz) => {
      const inside = openings.filter(o => o.x0 > gx - w / 2 + 0.1 && o.x1 < gx + w / 2 - 0.1 && o.z0 > gz - h / 2 + 0.1 && o.z1 < gz + h / 2 - 0.1);
      if (!inside.length) return new THREE.PlaneGeometry(w, h);
      const V = (x, y) => new THREE.Vector2(x, y), sh = new THREE.Shape([V(-w / 2, -h / 2), V(w / 2, -h / 2), V(w / 2, h / 2), V(-w / 2, h / 2)]);
      for (const o of inside) { const u0 = o.x0 - gx, u1 = o.x1 - gx, v0 = gz - o.z1, v1 = gz - o.z0; sh.holes.push(new THREE.Path([V(u0, v0), V(u0, v1), V(u1, v1), V(u1, v0)])); }      // (turned flat, the sheet's y runs to -z)
      const g = new THREE.ShapeGeometry(sh), P = g.attributes.position, U = g.attributes.uv;
      for (let i = 0; i < P.count; i++) U.setXY(i, P.getX(i) / w + 0.5, P.getY(i) / h + 0.5);
      return g;
    };
    const ground = new THREE.Mesh(sheetGeo(B.x1 - B.x0 + 400, B.z1 - B.z0 + 400, cx, cz), new THREE.MeshStandardMaterial({ map: gt, roughness: 1, emissiveMap: gt, emissive: new THREE.Color(0.2, 0.25, 0.4), emissiveIntensity: 0.55 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(cx, -0.03, cz); ground.updateMatrix(); ground.matrixAutoUpdate = false;
    this.group.add(ground);
    if (plan.street) {
      // The avenue side lies lower: the high ground stops at the terrace wall, and a second sheet carries on below.
      const S = plan.street, W = B.x1 - B.x0 + 400, x0 = cx - W / 2, wE = cx + W / 2 - S.x, wW = S.x - x0 + 6;        // (as far east as the foot of the steps needs and no further: the lower level's rooms begin under the terrace, and it would lie through them. The climbing streets cover their own ground.)
      // The high ground starts a little way back from the wall, and a strip fills in between, left open wherever
      // steps, a ramp or a climbing street comes up through it: otherwise the snow lies over them like a lid.
      const EDGE = 12, hE = B.z1 - B.z0 + 400, zA = cz - hE / 2, zB = cz + hE / 2;
      ground.geometry.dispose(); ground.geometry = sheetGeo(wE - EDGE, hE, S.x + EDGE + (wE - EDGE) / 2, cz); ground.position.x = S.x + EDGE + (wE - EDGE) / 2; ground.updateMatrix();
      gt.repeat.x *= (wE - EDGE) / W; gt.offset.x = ((S.x + EDGE - x0) / W) * ((B.x1 - B.x0) / 6);
      const strip = new Geo(), fill = (xa, xb, za, zb) => { if (xb - xa > 0.01 && zb - za > 0.01) strip.quad([xa, -0.03, za], [xa, -0.03, zb], [xb, -0.03, zb], [xb, -0.03, za], [0, 1, 0], [[xa / 6, za / 6], [xa / 6, zb / 6], [xb / 6, zb / 6], [xb / 6, za / 6]]); };
      const ways = S.ways.map(w => ({ z0: w.road ? w.z0 : w.z0 - (w.id === 'steps' ? 1.05 : 0.3), z1: w.road ? w.z1 : w.z1 + (w.id === 'steps' ? 1.05 : 0.3), run: w.road ? EDGE : w.run + (w.id === 'steps' ? 0.3 : 0.05) })).sort((p, q) => p.z0 - q.z0);
      let zz = zA; for (const w of ways) { fill(S.x, S.x + EDGE, zz, w.z0); fill(S.x + w.run, S.x + EDGE, w.z0, w.z1); zz = w.z1; } fill(S.x, S.x + EDGE, zz, zB);
      const sm = strip.mesh(ground.material.clone()); { const st = this.snowTex.clone(); st.needsUpdate = true; st.repeat.set(1, 1); sm.material.map = sm.material.emissiveMap = st; } sm.matrixAutoUpdate = false; sm.updateMatrix(); this.group.add(sm);
      const lt = this.snowTex.clone(); lt.needsUpdate = true; lt.repeat.set(wW / 6, (B.z1 - B.z0 + 400) / 6);
      const low = new THREE.Mesh(sheetGeo(wW, B.z1 - B.z0 + 400, x0 + wW / 2, cz), ground.material.clone()); low.material.map = low.material.emissiveMap = lt;
      low.rotation.x = -Math.PI / 2; low.position.set(x0 + wW / 2, S.y - 0.03, cz); low.updateMatrix(); low.matrixAutoUpdate = false; this.group.add(low);
    }
    this._buildLand(ground);
    // The city all round, and one moon.
    const city = panorama();                             // the Loop to the west and north, the lake to the east (skyline.js)
    // The backdrop is centred on the museum, not on the whole of the ground out to the lake, so that the towers
    // stand in their true directions from its door; and it grows with the world, keeping its proportions.
    const bx1 = B.cx1 == null ? B.x1 : B.cx1, sx = (B.x0 + bx1) / 2;
    const R = Math.max(Math.hypot(bx1 - B.x0, B.z1 - B.z0) / 2 + 150, B.x1 - sx + 120), SK = R / 373;
    const sky = new THREE.Mesh(new THREE.CylinderGeometry(R, R, SPAN * SK, 64, 1, true), new THREE.MeshBasicMaterial({ map: city, side: THREE.BackSide, color: new THREE.Color(1.35, 1.35, 1.35), fog: false }));
    sky.position.set(sx, (SPAN / 2 - BELOW) * SK, cz);
    const moonAt = new THREE.Vector3(sx + R * 0.82, 100 * SK, cz - R * 0.33);       // far enough inside the backdrop that its glow is not sliced off by it        // low in the east, over the lake
    const moon = new THREE.Mesh(new THREE.SphereGeometry(13 * SK, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.5, 2.8), fog: false }));
    moon.position.copy(moonAt);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(190 * SK, 190 * SK), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1.4), color: new THREE.Color(0.3, 0.38, 0.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    halo.position.copy(moonAt); halo.lookAt(cx, 20, cz);
    this.group.add(sky, moon, halo);
    { const wx = plan.lakefront ? plan.lakefront.buoys : B.x1 + 95; this.group.add(lake(wx, sx + R + 60, cz - R - 60, cz + R + 60, { x: wx, z: cz }, { x: moonAt.x, z: moonAt.z }, !!plan.lakefront)); }

    // A lamp either side of every way in.
    const posts = new Geo(), n = Math.max(1, plan.lamps.length);
    const globes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.3, 1.3), fog: false }), n);
    const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.5, 0.36, 0.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), n);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), I = new THREE.Quaternion();
    plan.lamps.forEach((l, i) => {
      const y = streetY(plan, l.x, l.z);
      // A pool of light lies on the ground it is over: one by the head of the steps is kept small enough not to hang in the air beyond them.
      const edge = plan.street ? plan.street.x + 4.4 : -1e9, pw = y < 0 ? 9 : l.x > edge && l.x - edge < 5.5 ? Math.max(3, 2 * (l.x - edge)) : 11;
      posts.box(l.x - 0.04, l.x + 0.04, y, y + 3.1, l.z - 0.04, l.z + 0.04);
      plan.obstacles.push({ x0: l.x - 0.05, x1: l.x + 0.05, z0: l.z - 0.05, z1: l.z + 0.05, y0: y, y1: y + 3.2 });
      globes.setMatrixAt(i, M.compose(new THREE.Vector3(l.x, y + 3.25, l.z), I, new THREE.Vector3(1, 1, 1)));
      pools.setMatrixAt(i, M.compose(new THREE.Vector3(l.x, y + 0.045, l.z), Q, new THREE.Vector3(pw, pw, 1)));
    });
    globes.frustumCulled = pools.frustumCulled = false; pools.renderOrder = 4;
    if (!posts.empty) this.group.add(posts.mesh(new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.5 })), globes, pools);

    // The Michigan Avenue front, the streets, the railway and the gardens.
    buildGrounds(this, plan);
    this.winter = buildWinter(this, plan);
    this.roofscape = buildRoofscape(this, plan);
    buildStatues(this, plan);

    // ---- closed ----
    // Every outside door is shut: two bronze leaves in each doorway, which swing open once you are in.
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 0.5, metalness: 0.5, emissive: 0x15120e, emissiveIntensity: 0.6 });
    const paneMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.17, 0.11), transparent: true, opacity: 0.85 });
    this.leaves = [];
    for (const d of plan.doors) {
      if (!d.out || d.vent) continue;
      const r = plan.byId[d.a], alongX = d.along === 'x';
      const w = (alongX ? d.z1 - d.z0 : d.x1 - d.x0) / 2, outer = alongX ? (d.x0 < r.x0 ? d.x0 + 0.12 : d.x1 - 0.12) : (d.z0 < r.z0 ? d.z0 + 0.12 : d.z1 - 0.12);
      const sgn = alongX ? (d.x0 < r.x0 ? -1 : 1) : (d.z0 < r.z0 ? -1 : 1);            // which way is out
      for (const side of [-1, 1]) {
        const pivot = new THREE.Group(), leaf = new THREE.Group();
        const hingeAt = (alongX ? (d.z0 + d.z1) / 2 : (d.x0 + d.x1) / 2) + side * w;
        if (alongX) pivot.position.set(outer, 0, hingeAt); else pivot.position.set(hingeAt, 0, outer);
        // The leaf is built along local x from its hinge, then turned to lie across the doorway.
        const body = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, d.h - 0.04, 0.07), leafMat); body.position.set(-(w - 0.02) / 2, d.h / 2, 0);
        const pane = new THREE.Mesh(new THREE.BoxGeometry(w - 0.5, d.h * 0.52, 0.1), paneMat); pane.position.set(-(w - 0.02) / 2, d.h * 0.6, 0);
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 0.16), new THREE.MeshStandardMaterial({ color: 0x9a7c3a, metalness: 0.7, roughness: 0.35, emissive: 0x3a2c10, emissiveIntensity: 0.6 })); bar.position.set(-(w - 0.25), 1.3, 0);
        leaf.add(body, pane, bar);
        // Shut, a leaf reaches from its hinge to the middle of the doorway; open, it stands out from the wall.
        const shut = alongX ? (side > 0 ? -Math.PI / 2 : Math.PI / 2) : (side > 0 ? 0 : Math.PI);
        pivot.add(leaf); pivot.rotation.y = shut;
        this.group.add(pivot);
        this.leaves.push({ pivot, shut, open: shut + 1.75 * side * (alongX ? -sgn : sgn) });
      }
    }
    this.doorOpen = 0; this.doorTarget = 0;
    // The sign on the front door, hung from the lintel on two chains, low enough to read from the ground.
    {
      const f2 = plan.front, cz2 = (f2.z0 + f2.z1) / 2, hang = new THREE.Group();
      // Painted, not lit: headlamps on it must not wash the words out.
      const board = TX.twoFaced(new THREE.PlaneGeometry(2.5, 1.25), new THREE.MeshBasicMaterial({ map: TX.closedSign(), color: new THREE.Color(0.62, 0.6, 0.55) }));      // (two faces: it reads the right way round from inside too)
      board.position.y = -(f2.h - 2.0); board.rotation.y = -Math.PI / 2;
      hang.add(board);
      const chain = new THREE.MeshStandardMaterial({ color: 0x8a8478, metalness: 0.6, roughness: 0.4 });
      for (const sz of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.02, f2.h - 2.62, 0.02), chain); c.position.set(0, -(f2.h - 2.62) / 2, sz * 1.08); hang.add(c); }
      hang.position.set(f2.x0 - 0.22, f2.h, cz2);
      this.closedSign = hang;
      this.group.add(hang);
    }
    // The way in for a car: an air duct through the foot of the wall beside the doors. Sheet aluminium,
    // standing a little proud of the stone, its grille swung open on its hinges, arrows running into it.
    if (plan.vent) {
      const v = plan.vent, zc = (v.z0 + v.z1) / 2, SEC = 0.6, lip = 0.28, xm = v.x0 - lip, t = 0.05;
      const sheet = TX.duct();
      const alu = new THREE.MeshStandardMaterial({ map: sheet, emissiveMap: sheet, emissive: 0x8d98a6, emissiveIntensity: 0.55, metalness: 0.45, roughness: 0.42, side: THREE.DoubleSide });
      const bare = new THREE.MeshStandardMaterial({ color: 0xc3c9cf, emissive: 0x4a525c, emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.4 });
      const duct = new Geo(), u0 = 0, u1 = (v.x1 - xm) / SEC, w = v.z1 - v.z0;
      // Inside: two walls, a roof and a floor, every section seamed and riveted. A finger's width inside
      // the hole cut for it, so no face of the duct lies in the same place as a face of the wall.
      const e = 0.012, za = v.z0 + e, zb = v.z1 - e, top = v.h - e;
      duct.quad([xm, 0, za], [v.x1, 0, za], [v.x1, top, za], [xm, top, za], [0, 0, 1], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]]);
      duct.quad([xm, 0, zb], [v.x1, 0, zb], [v.x1, top, zb], [xm, top, zb], [0, 0, -1], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]]);
      duct.quad([xm, top, za], [v.x1, top, za], [v.x1, top, zb], [xm, top, zb], [0, -1, 0], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]]);
      duct.quad([xm, e, za], [v.x1, e, za], [v.x1, e, zb], [xm, e, zb], [0, 1, 0], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]]);
      // Outside: the last length of it sticking out of the wall.
      const lu = lip / SEC;
      duct.quad([xm, 0, v.z0 - t], [v.x0, 0, v.z0 - t], [v.x0, v.h + t, v.z0 - t], [xm, v.h + t, v.z0 - t], [0, 0, -1], [[0, 0], [lu, 0], [lu, 1], [0, 1]]);
      duct.quad([xm, 0, v.z1 + t], [v.x0, 0, v.z1 + t], [v.x0, v.h + t, v.z1 + t], [xm, v.h + t, v.z1 + t], [0, 0, 1], [[0, 0], [lu, 0], [lu, 1], [0, 1]]);
      duct.quad([xm, v.h + t, v.z0 - t], [v.x0, v.h + t, v.z0 - t], [v.x0, v.h + t, v.z1 + t], [xm, v.h + t, v.z1 + t], [0, 1, 0], [[0, 0], [lu, 0], [lu, 1], [0, 1]]);
      // The flange round its mouth, and a strip light just inside so the opening can be seen from across the street.
      const rim = new Geo(), f = 0.09, glow = new Geo();
      rim.box(xm - 0.03, xm + 0.02, v.h, v.h + f, v.z0 - f, v.z1 + f); rim.box(xm - 0.03, xm + 0.02, 0, v.h, v.z0 - f, v.z0); rim.box(xm - 0.03, xm + 0.02, 0, v.h, v.z1, v.z1 + f);
      glow.box(xm + 0.05, xm + 0.09, v.h - 0.045, v.h - 0.015, v.z0 + 0.015, v.z1 - 0.015); glow.box(xm + 0.05, xm + 0.09, 0.015, v.h - 0.045, v.z0 + 0.015, v.z0 + 0.045); glow.box(xm + 0.05, xm + 0.09, 0.015, v.h - 0.045, v.z1 - 0.045, v.z1 - 0.015);
      for (let x = xm + SEC * 2; x < v.x1 - 0.2; x += SEC * 2) glow.box(x - 0.02, x + 0.02, v.h - 0.035, v.h - 0.015, v.z0 + 0.2, v.z1 - 0.2);     // a work light every other section
      this.group.add(duct.mesh(alu), rim.mesh(bare), glow.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 1.1, 1.3) })));
      // The grille, still on its hinges on the far side of the opening and swung wide.
      const grille = new THREE.Group(), gh = v.h - 0.04;
      const bar = (bw, bh, bd, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), bare); m.position.set(x, y, 0); grille.add(m); return m; };
      bar(w, 0.05, 0.04, w / 2, 0.025); bar(w, 0.05, 0.04, w / 2, gh - 0.025); bar(0.05, gh, 0.04, 0.025, gh / 2); bar(0.05, gh, 0.04, w - 0.025, gh / 2);
      for (let y = 0.1; y < gh - 0.06; y += 0.075) bar(w - 0.08, 0.012, 0.06, w / 2, y).rotation.x = 0.7;       // louvres
      for (const hy of [0.14, gh - 0.14]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 8), bare); h.position.set(0, hy, 0); grille.add(h); }
      grille.position.set(xm - 0.03, 0.02, v.z0 - f); grille.rotation.y = Math.PI - 0.42;
      this.group.add(grille);
      // The grille is solid, and so are the sides of the length of duct that sticks out of the wall.
      { const c = Math.cos(Math.PI - 0.42), sn = -Math.sin(Math.PI - 0.42), px0 = xm - 0.03, pz0 = v.z0 - f;
        for (let k = 0; k < 6; k++) { const a = (k + 0.5) / 6 * w, gx = px0 + c * a, gz = pz0 + sn * a; plan.obstacles.push({ x0: gx - 0.1, x1: gx + 0.1, z0: gz - 0.1, z1: gz + 0.1, y0: 0, y1: gh }); }
        plan.obstacles.push({ x0: xm, x1: v.x0, z0: v.z0 - 0.07, z1: v.z0 - 0.01, y0: 0, y1: v.h + 0.1 }, { x0: xm, x1: v.x0, z0: v.z1 + 0.01, z1: v.z1 + 0.07, y0: 0, y1: v.h + 0.1 }); }
      const spill = new THREE.Mesh(new THREE.PlaneGeometry(5, 3), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.55, 0.8, 0.95), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
      spill.rotation.x = -Math.PI / 2; spill.position.set(xm - 1.9, 0.012, zc); spill.renderOrder = 4;
      const arrows = new Geo(), ct = TX.chevrons(), ax0 = xm - 4.4, ax1 = xm - 0.3;
      arrows.quad([ax0, 0.016, v.z0 + 0.15], [ax1, 0.016, v.z0 + 0.15], [ax1, 0.016, v.z1 - 0.15], [ax0, 0.016, v.z1 - 0.15], [0, 1, 0], [[0, 0], [0, 4], [1, 4], [1, 0]]);
      const am = arrows.mesh(new THREE.MeshBasicMaterial({ map: ct, color: new THREE.Color(0.25, 0.95, 1.1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
      am.renderOrder = 6; this.ventArrows = ct;
      this.group.add(spill, am);
    }
    // The way in for a drone: one pane of the big skylight left propped open, and the light coming up out of it.
    for (const k of plan.skylights) {
      const top = plan.massOf[k.room].top, cx2 = (k.x0 + k.x1) / 2, cz3 = (k.z0 + k.z1) / 2;
      const rim = new Geo();
      for (const [a, b, c, e] of [[k.x0 - 0.1, k.x1 + 0.1, k.z0 - 0.1, k.z0], [k.x0 - 0.1, k.x1 + 0.1, k.z1, k.z1 + 0.1], [k.x0 - 0.1, k.x0, k.z0, k.z1], [k.x1, k.x1 + 0.1, k.z0, k.z1]]) rim.box(a, b, k.y - 0.05, top + 0.25, c, e);
      this.group.add(rim.mesh(new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.5, metalness: 0.5, emissive: 0x3a2c18, emissiveIntensity: 0.8 })));
      const pane = new THREE.Mesh(new THREE.BoxGeometry(k.x1 - k.x0 + 0.2, 0.05, k.z1 - k.z0 + 0.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.45, 0.6), transparent: true, opacity: 0.5 }));
      pane.position.set(cx2, top + 0.95, k.z1 + 0.75); pane.rotation.x = 0.95;                                    // tipped back on its stay
      const beam = new Geo();
      const H2 = 16, uvB = [[0, 0], [1, 0], [1, 1], [0, 1]];
      beam.quad([k.x0, top, cz3], [k.x1, top, cz3], [k.x1 + 0.5, top + H2, cz3], [k.x0 - 0.5, top + H2, cz3], [0, 0, 1], [[0, 1], [1, 1], [1, 0], [0, 0]]);
      beam.quad([cx2, top, k.z0], [cx2, top, k.z1], [cx2, top + H2, k.z1 + 0.5], [cx2, top + H2, k.z0 - 0.5], [1, 0, 0], [[0, 1], [1, 1], [1, 0], [0, 0]]);
      const bm = beam.mesh(new THREE.MeshBasicMaterial({ map: TX.shaft(), color: new THREE.Color(1.0, 0.72, 0.38), transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      bm.renderOrder = 5;
      this.group.add(pane, bm);
    }
    // The other ways in for a car. Each is a short tunnel of sheet metal through the wall, and on the
    // outside whatever was left open: a delivery shutter, a duct, a kicked-in door, a cellar window.
    if (plan.holes.length) {
      const sheet = TX.duct(), alu = new THREE.MeshStandardMaterial({ map: sheet, emissiveMap: sheet, emissive: 0x8d98a6, emissiveIntensity: 0.5, metalness: 0.45, roughness: 0.42, side: THREE.DoubleSide });
      const steel = new THREE.MeshStandardMaterial({ color: 0x7c848c, roughness: 0.45, metalness: 0.6, emissive: 0x2c3138, emissiveIntensity: 0.7 }), paint = new THREE.MeshStandardMaterial({ color: 0x6a1c18, roughness: 0.6, emissive: 0x2c0a08, emissiveIntensity: 0.8 });
      const warm = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.0, 0.4) }), cyan = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 1.1, 1.3) }), yellow = new THREE.MeshStandardMaterial({ color: 0xe8b21c, roughness: 0.6, emissive: 0x6a4c06, emissiveIntensity: 0.8 });
      const glass = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 0.5, 0.62), transparent: true, opacity: 0.45, side: THREE.DoubleSide });
      const tube = new Geo();
      for (const d of plan.holes) {
        if (d.kind === 'inner') {
          // A duct inside the building (to the Christmas tree): its own extent, a wall left open where the next run joins it,
          // an end shut, and at the room end a louvred grille swung open.
          const e = 0.012, { x0, x1, z0, z1 } = d.tube, h = d.h - e, op = d.open || {};
          const wallZ = (x, a, b, n) => { const sp = op[n === 1 ? 'w' : 'e'] || null; for (const [p, q] of sp && d.along === 'z' ? [[a, sp[0]], [sp[1], b]] : [[a, b]]) if (q - p > 0.01) tube.quad([x, 0, p], [x, 0, q], [x, h, q], [x, h, p], [n, 0, 0]); };
          const wallX = (z, a, b, n) => tube.quad([a, 0, z], [b, 0, z], [b, h, z], [a, h, z], [0, 0, n]);
          if (d.along === 'z') { wallZ(x0 + e, z0, z1, 1); wallZ(x1 - e, z0, z1, -1); } else { wallX(z0 + e, x0, x1, 1); wallX(z1 - e, x0, x1, -1); }
          tube.quad([x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1], [0, -1, 0]); tube.quad([x0, e, z0], [x1, e, z0], [x1, e, z1], [x0, e, z1], [0, 1, 0]);
          if (d.cap === 'z1') tube.quad([x0, 0, z1 - e], [x1, 0, z1 - e], [x1, h, z1 - e], [x0, h, z1 - e], [0, 0, -1]);
          const m = d.mouth; if (m) {
            const g = new THREE.Group(); g.position.set(m.x, 0, m.z); g.rotation.y = Math.atan2(m.nx, m.nz);
            const bx = (mat, bw, bh, bd, px, py, pz) => { const o = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat); o.position.set(px, py, pz); g.add(o); return o; };
            for (const sx of [-1, 1]) bx(alu, 0.05, d.h + 0.05, 0.06, sx * (m.w / 2 + 0.025), (d.h + 0.05) / 2, 0.03); bx(alu, m.w + 0.1, 0.05, 0.06, 0, d.h + 0.025, 0.03);
            const gr = new THREE.Group(); for (let i = 0; i < 6; i++) { const sl = new THREE.Mesh(new THREE.BoxGeometry(m.w - 0.04, 0.02, 0.05), steel); sl.position.y = 0.06 + i * 0.09; sl.rotation.x = 0.7; gr.add(sl); }
            gr.position.set(-m.w / 2, 0, 0.06); gr.rotation.y = -1.9; g.add(gr);                    // the grille, hinged at one side and swung back against the wall
            bx(cyan, m.w, 0.02, 0.02, 0, d.h - 0.03, 0.05);
            const spill = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.25, 0.42, 0.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
            spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.014, 0.7); spill.renderOrder = 4; g.add(spill);
            this.group.add(g);
          }
          continue;
        }
        const e = 0.012, x0 = d.x0, x1 = d.x1, z0 = d.z0, z1 = d.z1, h = d.h - e;
        if (d.along === 'x') {
          tube.quad([x0, 0, z0 + e], [x1, 0, z0 + e], [x1, h, z0 + e], [x0, h, z0 + e], [0, 0, 1]); tube.quad([x0, 0, z1 - e], [x1, 0, z1 - e], [x1, h, z1 - e], [x0, h, z1 - e], [0, 0, -1]);
        } else {
          tube.quad([x0 + e, 0, z0], [x0 + e, 0, z1], [x0 + e, h, z1], [x0 + e, h, z0], [1, 0, 0]); tube.quad([x1 - e, 0, z0], [x1 - e, 0, z1], [x1 - e, h, z1], [x1 - e, h, z0], [-1, 0, 0]);
        }
        tube.quad([x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1], [0, -1, 0]); tube.quad([x0, e, z0], [x1, e, z0], [x1, e, z1], [x0, e, z1], [0, 1, 0]);
        // What is on the outside, built looking out from the wall: x along it, z away from it.
        const n = d.side === 'e' ? [1, 0] : d.side === 'w' ? [-1, 0] : d.side === 's' ? [0, 1] : [0, -1];
        const g = new THREE.Group(), w = d.along === 'x' ? z1 - z0 : x1 - x0;
        g.position.set(d.side === 'e' ? x1 : d.side === 'w' ? x0 : (x0 + x1) / 2, 0, d.side === 's' ? z1 : d.side === 'n' ? z0 : (z0 + z1) / 2); g.rotation.y = Math.atan2(n[0], n[1]);
        const bx = (mat, bw, bh, bd, px, py, pz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat); m.position.set(px, py, pz); g.add(m); return m; };
        const lamp = d.kind === 'duct' ? cyan : warm;
        bx(lamp, w, 0.025, 0.03, 0, d.h - 0.03, 0.03); for (const sx of [-1, 1]) bx(lamp, 0.025, d.h - 0.04, 0.03, sx * (w / 2 - 0.02), d.h / 2, 0.03);
        if (d.kind === 'dock') {
          for (let i = 0; i < 16; i++) bx(steel, w + 0.3, 0.1, 0.05, 0, d.h + 0.06 + i * 0.12, 0.05 + (i % 2) * 0.012);          // the shutter, stopped short of the ground
          for (const sx of [-1, 1]) { bx(steel, 0.1, 2.7, 0.12, sx * (w / 2 + 0.2), 1.35, 0.06); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.9, 10), yellow); p.position.set(sx * (w / 2 + 0.6), 0.45, 1.0); g.add(p); }
          const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), new THREE.MeshBasicMaterial({ map: TX.notice(['Deliveries', 'ring bell']), color: new THREE.Color(0.6, 0.58, 0.54) })); sign.position.set(0, 3.25, 0.03); g.add(sign);
        } else if (d.kind === 'duct') {
          for (const sx of [-1, 1]) bx(alu, 0.05, d.h + 0.05, 0.3, sx * (w / 2 + 0.025), (d.h + 0.05) / 2, 0.15); bx(alu, w + 0.1, 0.05, 0.3, 0, d.h + 0.025, 0.15);
          const gr = new THREE.Group(); for (let i = 0; i < 6; i++) { const sl = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, 0.05), steel); sl.position.y = 0.06 + i * 0.09; sl.rotation.x = 0.7; gr.add(sl); } gr.position.set(w / 2 + 0.75, 0, 0.16); gr.rotation.x = -0.3; g.add(gr);
        } else if (d.kind === 'flap') {
          bx(paint, 1.0, 2.1 - d.h, 0.06, 0, d.h + (2.1 - d.h) / 2, 0.03); for (const sx of [-1, 1]) bx(paint, (1.0 - w) / 2, d.h, 0.06, sx * (w / 2 + (1.0 - w) / 4), d.h / 2, 0.03);
          bx(steel, 0.04, 0.22, 0.08, 0.36, 1.05, 0.08); const fl = bx(paint, w, d.h, 0.03, 0, d.h - 0.02, 0.2); fl.rotation.x = -1.1; fl.position.set(0, d.h - 0.02 - Math.cos(1.1) * d.h / 2 + d.h * 0.05, 0.03 + Math.sin(1.1) * d.h / 2);
        } else {
          for (const sx of [-1, 1]) bx(steel, 0.05, d.h + 0.05, 0.08, sx * (w / 2 + 0.025), (d.h + 0.05) / 2, 0.04); bx(steel, w + 0.1, 0.05, 0.08, 0, d.h + 0.025, 0.04);
          const pane = bx(glass, w, d.h, 0.02, 0, 0, 0); pane.rotation.x = 0.75; pane.position.set(0, d.h - Math.cos(0.75) * d.h / 2, 0.06 + Math.sin(0.75) * d.h / 2);
        }
        const spill = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.6), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: d.kind === 'duct' ? new THREE.Color(0.3, 0.5, 0.6) : new THREE.Color(0.6, 0.42, 0.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
        spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.014, 1.0); spill.renderOrder = 4; g.add(spill);
        this.group.add(g);
      }
      this.group.add(tube.mesh(alu));
    }

    // Snow, falling wherever you are. It is carried along with the camera and wrapped round.
    const count = 1800, pos = new Float32Array(count * 3), seed = new Float32Array(count * 3);
    const r = TX.rng(42);
    for (let i = 0; i < count * 3; i++) seed[i] = r();
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.flakes = new THREE.Points(sg, motes(new THREE.Color(0.85, 0.9, 1), 0.06, 0.85, 26, 34, false));
    this.flakes.userData.seed = seed;
    this.flakes.frustumCulled = false;
    this.group.add(this.flakes);
  }

  // ------------------------------------------------------------------- hall --

  // Griffin Court is built lying along x, as if its window were at the east
  // end, and then the whole thing is turned to run north as the real one does.
  _buildHall() {
    const R = VAULT_R, hall = this.plan.hall, LEN = hall.z1 - hall.z0;
    const hg = this.hallGroup = new THREE.Group();
    hg.position.set((hall.x0 + hall.x1) / 2, hall.y, hall.z1); hg.rotation.y = Math.PI / 2;
    this.group.add(hg);
    // The glass roof: flat, 126 panes, two abreast and sixty-three down the length of the court,
    // each with a coloured gel over it and white steel between. The west row runs through the warm
    // colours and the east through the cool, as the real ones do; the order is read from a
    // photograph of the south end and carried on from there. The colours fall on the floor.
    const COLS = 63, ROWS = 2;
    const WARM = ['#f2c70f', '#dfe6a8', '#f6cfa0', '#f39a2d', '#b8651a', '#d99a1e', '#f4a6a0', '#f3e08a', '#f5ecc8', '#f6d5cf', '#f1efe9', '#cfd2d0', '#f1d23c', '#ef8a2a', '#e5552a', '#f0b04a', '#f6e27a', '#c9d84a', '#8fc45a', '#e9c63a', '#f2a03a'];
    const COOL = ['#dfeee6', '#3b3fd6', '#2f6fe0', '#2a93d8', '#7cc4ea', '#cfe6f3', '#e6e3f3', '#5a2fd0', '#cdbdf0', '#8a3fd8', '#e5a6e6', '#e6283c', '#e040c8', '#f2a0c8', '#c93ad0', '#e0303a', '#f07a8a', '#9a6ae0', '#58a8e8', '#48c0b0', '#c9d84a'];
    const gel = (cw, ch, line) => {
      const cv = document.createElement('canvas'); cv.width = COLS * cw; cv.height = ROWS * ch;
      const g = cv.getContext('2d');
      g.fillStyle = '#9a9c98'; g.fillRect(0, 0, cv.width, cv.height);
      // A gel is a wash over frosted glass, not paint: each colour is pulled a little way toward
      // grey, and it is night outside, so nothing up there is bright.
      const soft = hex => { const n = parseInt(hex.slice(1), 16), r = n >> 16, gr = (n >> 8) & 255, b = n & 255, m = (r + gr + b) / 3, k = 0.26; return `rgb(${Math.round(r + (m - r) * k)},${Math.round(gr + (m - gr) * k)},${Math.round(b + (m - b) * k)})`; };
      for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) {
        g.fillStyle = soft((j === WEST ? WARM : COOL)[i % WARM.length]);
        g.fillRect(i * cw + line, j * ch + line, cw - 2 * line, ch - 2 * line);
        // the mesh in the glass
        if (line) { g.fillStyle = 'rgba(255,255,255,.07)'; for (let x = 6; x < cw - line; x += 6) g.fillRect(i * cw + x, j * ch + line, 1, ch - 2 * line); for (let y = 6; y < ch - line; y += 6) g.fillRect(i * cw + line, j * ch + y, cw - 2 * line, 1); }
      }
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
    };
    const WEST = 1;                                      // which row of the texture lies along the west wall
    const uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const lay = new Geo();
    lay.quad([0, SPRING - 0.05, -HW], [LEN, SPRING - 0.05, -HW], [LEN, SPRING - 0.05, HW], [0, SPRING - 0.05, HW], [0, -1, 0], uv);
    hg.add(lay.mesh(new THREE.MeshBasicMaterial({ map: gel(32, 96, 1), color: new THREE.Color(0.6, 0.6, 0.62), side: THREE.DoubleSide })));
    const cast = new Geo();
    cast.quad([0, 0.012, -HW], [LEN, 0.012, -HW], [LEN, 0.012, HW], [0, 0.012, HW], [0, 1, 0], uv);
    const castMesh = cast.mesh(new THREE.MeshBasicMaterial({ map: gel(8, 8, 0), transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    hg.add(castMesh);
    const na = 18;

    const steel = new Geo(), white = new Geo();
    for (let z = -HW; z <= HW + 0.01; z += 2) {
      const top = SPRING + Math.sqrt(Math.max(0, R * R - z * z));
      steel.box(LEN - 0.08, LEN + 0.08, 0, top, z - 0.06, z + 0.06);
    }
    for (const y of [...Array.from({ length: Math.floor((SPRING - 0.5) / 2.9) + 1 }, (_, i) => 0.5 + i * 2.9), SPRING]) steel.box(LEN - 0.07, LEN + 0.07, y - 0.06, y + 0.06, -HW, HW);
    for (let x = 0; x <= LEN; x += LEN / 63) white.box(x - 0.04, x + 0.04, SPRING - 0.42, SPRING - 0.06, -HW, HW);
    white.box(0, LEN, SPRING - 0.5, SPRING - 0.06, -0.06, 0.06);            // the spine between the two rows       // a beam under each joint of the glass
    hg.add(steel.mesh(new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.6 })));
    hg.add(white.mesh(new THREE.MeshBasicMaterial({ color: 0x6f716e })));

    // Snow beyond the window.
    const n = 500;
    const pos = new Float32Array(n * 3), seed = new Float32Array(n);
    const r = TX.rng(42);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = LEN + 1.5 + r() * 55; pos[i * 3 + 1] = r() * 26; pos[i * 3 + 2] = (r() - 0.5) * 90; seed[i] = r() * 100;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.snow = new THREE.Points(sg, motes(new THREE.Color(0.8, 0.86, 1), 0.07, 0.8, 70, 150, false));
    this.snow.userData.seed = seed;
    this.snow.frustumCulled = false;
    hg.add(this.snow);

    // Moonlight: shafts falling from the vault, and what they land on.
    const add = (geo, map, color, opacity) => {
      const m = geo.mesh(new THREE.MeshBasicMaterial({ map, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      m.renderOrder = 5;
      hg.add(m);
      return m;
    };
    const shafts = new Geo(), patches = new Geo();
    this.shaftSpots = [];
    const uvS = [[0, 1], [1, 1], [1, 0], [0, 0]];
    for (let i = 0; i < 5; i++) {
      const x = 8 + i * (LEN - 24) / 4, z = (i % 2 ? 1 : -1) * 1.4;
      const top = [x + 7.5, SPRING], bot = [x, 0];
      shafts.quad(P3(top[0], top[1], z - 1.7), P3(top[0], top[1], z + 1.7), P3(bot[0], bot[1], z + 1.7), P3(bot[0], bot[1], z - 1.7), [1, 0, 0], uvS);
      shafts.quad(P3(top[0] - 1.7, top[1], z), P3(top[0] + 1.7, top[1], z), P3(bot[0] + 1.7, bot[1], z), P3(bot[0] - 1.7, bot[1], z), [0, 0, 1], uvS);
      patches.quad(P3(x - 2.6, 0.012, z - 2), P3(x + 2.6, 0.012, z - 2), P3(x + 2.6, 0.012, z + 2), P3(x - 2.6, 0.012, z + 2), [0, 1, 0]);
      this.shaftSpots.push({ x, z, tx: 7.5 / (SPRING) });
    }
    // The window end throws a long pale rug of light down the hall.
    patches.quad(P3(LEN - 26, 0.012, -6.2), P3(LEN - 0.2, 0.012, -6.2), P3(LEN - 0.2, 0.012, 6.2), P3(LEN - 26, 0.012, 6.2), [0, 1, 0]);
    this.shaftMesh = add(shafts, TX.shaft(), new THREE.Color(0.5, 0.64, 1), 0.2);
    const patchMesh = add(patches, TX.moonPatch(), new THREE.Color(0.42, 0.55, 0.9), 0.26);
    patchMesh.material.polygonOffset = true; patchMesh.material.polygonOffsetFactor = -2; patchMesh.material.polygonOffsetUnits = -2;
    patchMesh.material.side = THREE.FrontSide;

    // Dust, which is only ever visible in a beam.
    const dn = 900, dp = new Float32Array(dn * 3), ds = new Float32Array(dn * 4);
    for (let i = 0; i < dn; i++) {
      const s = this.shaftSpots[i % this.shaftSpots.length];
      const y = r() * (SPRING - 0.3);
      ds[i * 4] = s.x + s.tx * y + (r() - 0.5) * 3; ds[i * 4 + 1] = y; ds[i * 4 + 2] = s.z + (r() - 0.5) * 3; ds[i * 4 + 3] = r() * 100;
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    this.dust = new THREE.Points(dg, motes(new THREE.Color(0.75, 0.85, 1.2), 0.016, 0.7, 5, 26, true));
    this.dust.userData.base = ds;
    this.dust.frustumCulled = false;
    hg.add(this.dust);

    // Someone's balloon, lost on a field trip, still up against the glass.
    const balloon = new THREE.Group();
    const skin = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), new THREE.MeshStandardMaterial({ color: 0xc81e2a, roughness: 0.25, emissive: 0x50060a, emissiveIntensity: 0.6 }));
    skin.scale.y = 1.2;
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.04, 8), skin.material); knot.position.y = -0.19;
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 1.1, 4), new THREE.MeshBasicMaterial({ color: 0x9a9a9a })); string.position.y = -0.75;
    balloon.add(skin, knot, string);
    balloon.position.set(LEN * 0.55, SPRING + R - 0.42, 0.6);
    this.balloon = balloon;
    hg.add(balloon);
    hg.updateMatrixWorld(true);
    this.balloonAt = balloon.getWorldPosition(new THREE.Vector3());
  }

  // -------------------------------------------------------------------- art --

  _buildArt() {
    const placements = hang(this.plan, this.collection);
    const unit = new THREE.PlaneGeometry(1, 1);
    const lqLoader = new THREE.TextureLoader();
    const blank = this.blank = TX.flat(40, 36, 32);
    const frames = {};     // room -> Geo
    const arms = new Geo(), plinths = new Geo(), glass = new Geo(), brass = new Geo();
    this.objects = [];
    const paintings = placements.filter(p => p.kind === 'painting').length;
    const n = placements.length;

    const inst = (geo, mat, count) => {
      const m = new THREE.InstancedMesh(geo, mat, count);
      m.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      m.setColorAt(0, new THREE.Color(0, 0, 0));
      for (let i = 0; i < count; i++) m.setColorAt(i, new THREE.Color(0, 0, 0));
      m.frustumCulled = false;
      this.group.add(m);
      return m;
    };
    const additive = map => new THREE.MeshBasicMaterial({ map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, fog: false });
    this.lamps = inst(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), Math.max(1, paintings));
    this.washes = inst(unit, additive(TX.lampWash()), Math.max(1, paintings));
    this.pools = inst(unit, additive(TX.radial(0, 1)), n);
    this.cards = inst(unit, new THREE.MeshBasicMaterial({ color: 0xffffff }), n);
    this.pools.renderOrder = 4; this.washes.renderOrder = 4;

    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3();
    const E = new THREE.Euler();
    const flatQ = new THREE.Quaternion();
    let lampIdx = 0;
    this.arts = placements.map((p, i) => {
      const mini = p.kind === 'miniature', obj = p.kind === 'object', fy = p.fy || 0;       // fy: the floor of the room it is in
      // Mostly self-lit: a headlamp should warm a picture, not bleach it.
      const mat = new THREE.MeshStandardMaterial({ color: 0x4c4c4c, map: blank, emissiveMap: blank, emissive: 0xffffff, emissiveIntensity: 0.03, roughness: 0.6, metalness: 0 });
      if (obj) { mat.alphaTest = 0.5; mat.side = THREE.DoubleSide; mat.color.set(0x8a8a8a); }
      const mesh = new THREE.Mesh(unit, mat);
      if (obj) mesh.visible = false;              // until its photograph has been cut out
      mesh.position.set(p.x, p.y, p.z);
      mesh.rotation.y = p.rot;
      mesh.scale.set(p.w, p.h, 1);
      mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      this.group.add(mesh);
      const art = { ...p, i, mini, obj, mesh, mat, lit: 0, wakeAt: -1, tier: 0, want: 0, busy: false, studied: false, lamp: -1, tex: null, seen: this.seenIds.has(p.work.id) };
      if (obj) this.objects.push(art);
      this.rooms[p.room].arts.push(art);

      if (p.work.lq && !obj) lqLoader.load(p.work.lq, t => {
        t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = t.magFilter = THREE.LinearFilter;
        if (art.tier === 0) { mat.map = mat.emissiveMap = t; art.tex = t; mat.needsUpdate = true; } else t.dispose();
      });

      // The frame: see buildFrame.
      const f = p.frame, hw = p.w / 2, hh = p.h / 2;
      if (!obj) buildFrame(frames[p.room] || (frames[p.room] = new Geo()), p, frameStyle(p.work, mini));
      else {
        // A plinth, and a glass case over whatever stands on it.
        const a = p.half, top = fy + p.plinth + p.h + 0.18;
        plinths.box(p.x - a, p.x + a, fy, fy + p.plinth, p.z - a, p.z + a);
        glass.box(p.x - a + 0.02, p.x + a - 0.02, fy + p.plinth + 0.012, top - 0.012, p.z - a + 0.02, p.z + a - 0.02);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) brass.box(p.x + sx * (a - 0.02) - 0.008, p.x + sx * (a - 0.02) + 0.008, fy + p.plinth, top, p.z + sz * (a - 0.02) - 0.008, p.z + sz * (a - 0.02) + 0.008);
        for (const sgn of [-1, 1]) { brass.box(p.x - a, p.x + a, top, top + 0.02, p.z + sgn * a - (sgn > 0 ? 0.03 : 0), p.z + sgn * a + (sgn > 0 ? 0 : 0.03)); brass.box(p.x + sgn * a - (sgn > 0 ? 0.03 : 0), p.x + sgn * a + (sgn > 0 ? 0 : 0.03), top, top + 0.02, p.z - a, p.z + a); }
      }

      E.set(0, p.rot, 0); Q.setFromEuler(E);
      const tx = Math.cos(p.rot), tz = -Math.sin(p.rot);     // along the wall, to the viewer's right
      if (!mini && !obj) {
        // Picture lamp: a bright bar held off the wall on a short arm.
        const len = Math.min(1.3, Math.max(0.22, p.w * 0.42));
        const ly = p.y + hh + f + 0.17;
        V.set(p.x + p.nx * 0.2, ly, p.z + p.nz * 0.2);
        S.set(len, 0.028, 0.05);
        this.lamps.setMatrixAt(lampIdx, M.compose(V, Q, S));
        arms.wallBox({ x: p.x - p.nx * 0.04, y: ly, z: p.z - p.nz * 0.04 }, p.nx, p.nz, -0.012, 0.012, 0.0, 0.03, 0, 0.26);
        arms.wallBox({ x: p.x - p.nx * 0.04, y: ly, z: p.z - p.nz * 0.04 }, p.nx, p.nz, -len / 2 - 0.02, len / 2 + 0.02, 0.02, 0.055, 0.19, 0.3);
        const ww = p.w + 2.4, wh = p.h + 2.8;
        V.set(p.x - p.nx * 0.025, ly + 0.3 - wh / 2, p.z - p.nz * 0.025);
        S.set(ww, wh, 1);
        this.washes.setMatrixAt(lampIdx, M.compose(V, Q, S));
        art.lamp = lampIdx++;
      }
      // What the lamp spills on the floor.
      E.set(-Math.PI / 2, 0, 0); flatQ.setFromEuler(E);
      const reach = obj ? p.half * 2 + 1.8 : mini ? 1.5 : 2.2 + p.h * 0.4;
      if (obj) V.set(p.x, fy + 0.014, p.z); else V.set(p.x + p.nx * reach * 0.42, fy + 0.014, p.z + p.nz * reach * 0.42);
      const along = obj ? reach : p.w + (mini ? 1.2 : 2.6);
      S.set(p.nz !== 0 ? along : reach, p.nz !== 0 ? reach : along, 1);
      this.pools.setMatrixAt(i, M.compose(V, flatQ, S));
      // The label.
      const cw = mini ? 0.18 : 0.16, ch = mini ? 0.055 : 0.11;
      if (obj) V.set(p.x, fy + p.plinth * 0.6, p.z + p.half + 0.012);
      else if (mini) V.set(p.x + p.nx * 0.03, p.y - hh - f - 0.1, p.z + p.nz * 0.03);
      else V.set(p.x + tx * (hw + f + 0.24) - p.nx * 0.03, fy + 1.22, p.z + tz * (hw + f + 0.24) - p.nz * 0.03);
      S.set(cw, ch, 1);
      this.cards.setMatrixAt(i, M.compose(V, Q, S));
      return art;
    });
    this.lamps.count = Math.max(1, lampIdx); this.washes.count = Math.max(1, lampIdx);

    for (const [room, geo] of Object.entries(frames)) {
      // One material per room; each ring of moulding carries its own colour, and glows in it.
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.3, emissive: new THREE.Color(0.62, 0.56, 0.46), emissiveIntensity: 0.03 });
      mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n  totalEmissiveRadiance *= vColor.rgb;\n#endif'); };
      if (!geo.empty) this.group.add(geo.mesh(mat));
      this.rooms[room].frameMats = [mat];
    }
    if (!plinths.empty) {
      this.group.add(plinths.mesh(new THREE.MeshStandardMaterial({ color: 0x2b2927, roughness: 0.7, emissive: 0x1c1a18, emissiveIntensity: 0.5 })));
      const gm = glass.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.62, 0.72), transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      gm.renderOrder = 7;
      this.group.add(gm, brass.mesh(new THREE.MeshStandardMaterial({ color: 0x8a7340, roughness: 0.4, metalness: 0.6, emissive: 0x3a2f14, emissiveIntensity: 0.6 })));
    }
    if (!arms.empty) this.group.add(arms.mesh(new THREE.MeshStandardMaterial({ color: 0x4a3a1c, roughness: 0.5, metalness: 0.4 })));
    this._dirty = true;
    this._waking = new Set();
    this._col = new THREE.Color();
    for (const a of this.arts) this._paint(a);
    for (const st of Object.values(this.rooms)) { st.seen = st.arts.filter(a => a.seen).length; st.done = st.arts.length > 0 && st.seen === st.arts.length; }
  }

  _paint(a) {
    const c = this._col, b = a.boost || 0, l = a.lit * (1 + 1.6 * b);
    a.mat.emissiveIntensity = (a.mini ? 0.05 + 1.1 * a.lit : a.obj ? 0.08 + 0.8 * a.lit : 0.035 + 0.88 * a.lit) * (1 + 0.5 * b);
    if (a.lamp >= 0) {
      this.lamps.setColorAt(a.lamp, c.setRGB(0.05 + 3.6 * l, 0.04 + 2.9 * l, 0.03 + 1.9 * l));
      this.washes.setColorAt(a.lamp, c.setRGB(0.34 * l, 0.26 * l, 0.17 * l));
    }
    const k = a.mini ? 0.2 : 0.17;
    this.pools.setColorAt(a.i, c.setRGB(k * l, k * 0.8 * l, k * 0.55 * l));
    // The label stays dark until you have seen the work; then it is lit, and stays lit.
    if (a.seen) this.cards.setColorAt(a.i, c.setRGB(1.55, 1.2, 0.5));
    else this.cards.setColorAt(a.i, c.setRGB(0.03, 0.029, 0.027));
    this._dirty = true;
  }

  // -------------------------------------------------------------- furniture --

  _buildFurniture() {
    const { plan } = this;
    const leather = new Geo(), metal = new Geo();
    const bench = (cx, cz, alongX, y = 0) => {
      const L = 1.4, W = 0.38;
      const hx = alongX ? L : W, hz = alongX ? W : L;
      leather.box(cx - hx, cx + hx, y + 0.4, y + 0.5, cz - hz, cz + hz);
      plan.obstacles.push({ x0: cx - hx, x1: cx + hx, z0: cz - hz, z1: cz + hz, y0: y + 0.37, y1: y + 0.488, bench: true });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const lx = cx + sx * (hx - 0.07), lz = cz + sz * (hz - 0.07);
        metal.box(lx - 0.03, lx + 0.03, y, y + 0.4, lz - 0.03, lz + 0.03);
        plan.obstacles.push({ x0: lx - 0.03, x1: lx + 0.03, z0: lz - 0.03, z1: lz + 0.03, y0: y, y1: y + 0.4 });
      }
    };
    for (const b of plan.benches) bench(b.x, b.z, b.alongX, b.y || 0);
    this.group.add(leather.mesh(new THREE.MeshStandardMaterial({ color: 0x45201b, roughness: 0.45, emissive: 0x45201b, emissiveIntensity: 0.4 })));
    this.group.add(metal.mesh(new THREE.MeshStandardMaterial({ color: 0x6d6a66, roughness: 0.35, metalness: 0.7 })));

    // The guard's desk, lamp left on.
    const desk = new Geo();
    // (Inside the front doors, on the side away from the air duct.)
    const lobby = plan.byId[plan.front.a] || plan.rooms[0];
    const dx = lobby.x0 + 2.4, dz = lobby.z1 - 1.1, dy = lobby.y;
    desk.box(dx - 1.1, dx + 1.1, dy, dy + 1.02, dz - 0.5, dz + 0.5);
    desk.box(dx - 1.16, dx + 1.16, dy + 1.02, dy + 1.07, dz - 0.56, dz + 0.56);
    plan.obstacles.push({ x0: dx - 1.16, x1: dx + 1.16, z0: dz - 0.56, z1: dz + 0.56, y0: dy, y1: dy + 1.5 });
    this.group.add(desk.mesh(new THREE.MeshStandardMaterial({ color: 0x2c1e14, roughness: 0.55, emissive: 0x2a1a0c, emissiveIntensity: 0.25 })));
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.26, 12, 1, false), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 1.5, 0.6) }));
    shade.rotation.z = Math.PI / 2; shade.position.set(dx + 0.1, dy + 1.42, dz);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 6), new THREE.MeshStandardMaterial({ color: 0x8a6a2a, metalness: 0.6, roughness: 0.4 }));
    stem.position.set(dx + 0.1, dy + 1.24, dz);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.1), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.9, 0.7, 0.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.set(dx + 0.05, dy + 1.075, dz);
    this.group.add(shade, stem, glow);
    this._buildFitout();
    this.setpieces = buildSetPieces(this, this.plan);
  }

  // Back of house: desks, racks, boilers. src/furnish.js decides what stands where and hands back
  // batches of triangles, one to a material, a level and a patch of the building; each is one mesh,
  // and a mesh is only drawn while the camera is near it and on or next to its level.
  _buildFitout() {
    const fit = furnish(this.plan), g = new THREE.Group(), mats = {};
    for (const [k, m] of Object.entries(MATERIALS)) {
      if (m.unlit) { mats[k] = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(m.gain, m.gain, m.gain) }); continue; }
      // Everything in the building glows a little with its own colour, or the back rooms would be black: here the colour is the vertex's.
      mats[k] = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: m.roughness, metalness: m.metalness, emissive: 0xffffff, emissiveIntensity: m.glow });
      mats[k].onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'); };
    }
    const chunks = [];
    for (const b of fit.batches) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(b.position, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(b.normal, 3, true));
      geo.setAttribute('color', new THREE.BufferAttribute(b.color, 3, true));
      geo.setIndex(new THREE.BufferAttribute(b.index, 1));
      const q = b.bounds, mid = new THREE.Vector3((q.x0 + q.x1) / 2, (q.y0 + q.y1) / 2, (q.z0 + q.z1) / 2);
      geo.boundingSphere = new THREE.Sphere(mid, Math.hypot(q.x1 - q.x0, q.y1 - q.y0, q.z1 - q.z0) / 2);
      if (!AUDIT) for (const a of Object.values(geo.attributes)) a.onUpload(function () { this.array = null; });      // once it is on the graphics card, the copy here can go
      const mesh = new THREE.Mesh(geo, mats[b.mat]); mesh.matrixAutoUpdate = false; mesh.visible = false;
      g.add(mesh); chunks.push({ mesh, ...b.bounds });
    }
    this.group.add(g);
    this.fitout = { group: g, chunks, stats: { rooms: Object.keys(fit.rooms).length, items: fit.items, solids: fit.solids, meshes: chunks.length, triangles: fit.batches.reduce((n, b) => n + b.index.length / 3, 0) } };
  }

  // ------------------------------------------------------------------ levels --

  // What joins the floors: balconies and bridges, flights of real steps with a plank laid up them,
  // lifts, and the guard rails round all of them. They are part of the building, so they stay when
  // the stunt kit is cleared away for a race.
  _buildLevels() {
    const { plan } = this, stone = new Geo(), ply = new Geo(), steel = new Geo(), arrows = new Geo();
    const g = this.levels = new THREE.Group(); this.group.add(g);
    for (const d of plan.decks) stone.box(d.x0, d.x1, d.y - d.thick, d.y, d.z0, d.z1, 1.3);
    for (const q of plan.ramps) {
      const alongX = q.axis === 'x', a = alongX ? q.x0 : q.z0, b = alongX ? q.x1 : q.z1, lo = Math.min(q.y0, q.y1), rise = Math.abs(q.y1 - q.y0), up = q.y1 > q.y0;
      if (q.stairs) {
        // The steps, counted from the low end: each tread comes just under the plank where the plank passes its edge.
        const n = Math.max(2, Math.round(rise / 0.17));
        for (let k = 1; k < n; k++) {
          const i = up ? k : n - 1 - k, u0 = a + (b - a) * i / n, u1 = a + (b - a) * (i + 1) / n, top = lo + rise * k / n;
          if (alongX) stone.box(u0, u1, lo, top, q.z0, q.z1, 1.3); else stone.box(q.x0, q.x1, lo, top, u0, u1, 1.3);
        }
      }
      // The plank: plywood, a hand narrower than the flight each side, with arrows running up it.
      const m = q.stairs ? 0.3 : 0, e = 0.014, th = q.stairs ? 0.03 : 0.22, w = (alongX ? q.z1 - q.z0 : q.x1 - q.x0) - 2 * m, len = Math.hypot(b - a, rise), sl = (q.y1 - q.y0) / (b - a), nl = Math.hypot(sl, 1);
      const P = alongX ? [[q.x0, q.y0, q.z0 + m], [q.x1, q.y1, q.z0 + m], [q.x1, q.y1, q.z1 - m], [q.x0, q.y0, q.z1 - m]] : [[q.x0 + m, q.y0, q.z0], [q.x1 - m, q.y0, q.z0], [q.x1 - m, q.y1, q.z1], [q.x0 + m, q.y1, q.z1]];
      const nrm = alongX ? [-sl / nl, 1 / nl, 0] : [0, 1 / nl, -sl / nl], at = dy => P.map(c => [c[0], c[1] + dy, c[2]]);
      const t = at(e), u = at(e - th);
      ply.quad(t[0], t[1], t[2], t[3], nrm, alongX ? [[0, 0], [len / 1.2, 0], [len / 1.2, w / 1.2], [0, w / 1.2]] : [[0, 0], [w / 1.2, 0], [w / 1.2, len / 1.2], [0, len / 1.2]]);
      ply.quad(u[0], u[1], u[2], u[3], nrm.map(v => -v));
      const k2 = w * 0.3, L0 = a / 0.55, L1 = b / 0.55, r2 = at(e + 0.012);
      if (alongX) { r2[0][2] += k2; r2[1][2] += k2; r2[2][2] -= k2; r2[3][2] -= k2; arrows.quad(r2[0], r2[1], r2[2], r2[3], nrm, up ? [[0, L0], [0, L1], [1, L1], [1, L0]] : [[0, -L0], [0, -L1], [1, -L1], [1, -L0]]); }
      else { r2[0][0] += k2; r2[3][0] += k2; r2[1][0] -= k2; r2[2][0] -= k2; arrows.quad(r2[0], r2[1], r2[2], r2[3], nrm, up ? [[0, L0], [1, L0], [1, L1], [0, L1]] : [[0, -L0], [1, -L0], [1, -L1], [0, -L1]]); }
    }
    // The edge of the slab, wherever a floor has been cut for a stair or a lift.
    for (const w of plan.wells) {
      const y1 = w.y, y0 = w.y - SLAB;
      stone.quad([w.x0, y0, w.z0], [w.x1, y0, w.z0], [w.x1, y1, w.z0], [w.x0, y1, w.z0], [0, 0, 1]); stone.quad([w.x0, y0, w.z1], [w.x1, y0, w.z1], [w.x1, y1, w.z1], [w.x0, y1, w.z1], [0, 0, -1]);
      stone.quad([w.x0, y0, w.z0], [w.x0, y0, w.z1], [w.x0, y1, w.z1], [w.x0, y1, w.z0], [1, 0, 0]); stone.quad([w.x1, y0, w.z0], [w.x1, y0, w.z1], [w.x1, y1, w.z1], [w.x1, y1, w.z0], [-1, 0, 0]);
    }
    // Guard rails: a top bar, a bar half way down, and a post to each length.
    for (const o of plan.obstacles) {
      if (!o.rail || o.kit || o.gate) continue;
      steel.box(o.x0, o.x1, o.y1 - 0.05, o.y1, o.z0, o.z1); steel.box(o.x0, o.x1, (o.y0 + o.y1) / 2 - 0.02, (o.y0 + o.y1) / 2 + 0.02, o.z0, o.z1);
      steel.box(o.x0, Math.min(o.x1, o.x0 + 0.05), o.y0 - 0.03, o.y1, o.z0, Math.min(o.z1, o.z0 + 0.05));
    }
    this._buildLifts(g);
    const put = (geo, mat) => { if (!geo.empty) { const m = geo.mesh(mat); g.add(m); return m; } };
    const plyTex = TX.plywood();
    const marble = TX.marble();
    put(stone, new THREE.MeshStandardMaterial({ map: marble, color: 0xc9c2b4, roughness: 0.5, emissiveMap: marble, emissive: new THREE.Color(0.6, 0.6, 0.62), emissiveIntensity: 0.3 }));
    put(ply, new THREE.MeshStandardMaterial({ map: plyTex, roughness: 0.75, emissiveMap: plyTex, emissive: 0x8a7a66, emissiveIntensity: 0.16, side: THREE.DoubleSide }));
    put(steel, new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 0.45, metalness: 0.6, emissive: 0x15120e, emissiveIntensity: 0.6 }));
    const am = put(arrows, new THREE.MeshBasicMaterial({ map: this.arrowTex, color: new THREE.Color(0.2, 0.75, 0.85), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    if (am) am.renderOrder = 6;
  }

  // Lifts. A car in a glass shaft framed in steel. At each stop the shaft has one doorway, with a plate over it naming
  // the floor, a call button on its jamb, a striped sill on the floor in front, and a gate across it whenever the car is
  // somewhere else. The car has a chequer-plate floor a hand deep with a striped safety edge and toe guard, steel walls to
  // rail height with glass above and a handrail, a lit ceiling, and is open on the side (or sides) it is entered by.
  // plan.js says where all of it goes (lift.shaft, lift.doors, LIFT) and makes the same walls solid. The shaft is merged
  // with every other lift's; each car is one group, the only thing that moves.
  _buildLifts(g) {
    const { plan } = this, { J, DOOR, CAB, W } = LIFT, SIDES = ['n', 's', 'w', 'e'];
    const level = Object.entries(plan.levels || {}), floorName = y => { const k = level.find(([, v]) => Math.abs(v - y) < 0.05); return k ? k[0] : ''; };
    const labels = [...new Set(plan.lifts.flatMap(l => l.stops.map(floorName)))].filter(Boolean);
    const hzTex = TX.hazard(), chTex = TX.chequer();
    const M = {
      frame: new THREE.MeshStandardMaterial({ color: 0xb4bbc2, roughness: 0.35, metalness: 0.55, emissive: 0x4a5058, emissiveIntensity: 0.8 }),
      glass: new THREE.MeshStandardMaterial({ color: 0xbfd8e6, transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.1, emissive: 0x16242c, depthWrite: false, side: THREE.DoubleSide }),
      floor: new THREE.MeshStandardMaterial({ map: chTex, roughness: 0.38, metalness: 0.65, emissiveMap: chTex, emissive: 0xffffff, emissiveIntensity: 0.28 }),
      stripe: new THREE.MeshStandardMaterial({ map: hzTex, roughness: 0.6, emissiveMap: hzTex, emissive: 0xffffff, emissiveIntensity: 0.4 }),
      sign: new THREE.MeshBasicMaterial({ map: TX.liftSigns(labels.length ? labels : ['']) }),
      lamp: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.0, 0.22) }),
      ceiling: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 0.92, 0.82) }),
      pit: new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.9 }),
    };
    // One side of a lift's footprint: `u` runs along it, `d` out from it (negative: in), y is up.
    const sideOf = (l, s) => {
      const nrm = s === 'n' ? [0, 0, -1] : s === 's' ? [0, 0, 1] : s === 'w' ? [-1, 0, 0] : [1, 0, 0];
      const P = (u, y, d) => (s === 'n' ? [u, y, l.z0 - d] : s === 's' ? [u, y, l.z1 + d] : s === 'w' ? [l.x0 - d, y, u] : [l.x1 + d, y, u]);
      const box = (G, u0, u1, y0, y1, d0, d1, k = 1) => { const A = P(u0, y0, d0), B = P(u1, y1, d1); G.box(Math.min(A[0], B[0]), Math.max(A[0], B[0]), y0, y1, Math.min(A[2], B[2]), Math.max(A[2], B[2]), k); };
      const wall = (G, u0, u1, y0, y1, d, uv) => G.quad(P(u0, y0, d), P(u1, y0, d), P(u1, y1, d), P(u0, y1, d), nrm, uv);
      const flat = (G, u0, u1, d0, d1, y, uv) => G.quad(P(u0, y, d0), P(u1, y, d0), P(u1, y, d1), P(u0, y, d1), [0, 1, 0], uv);
      const [a, b] = s === 'n' || s === 's' ? [l.x0, l.x1] : [l.z0, l.z1];
      return { box, wall, flat, a, b, flip: s === 'n' || s === 'e' };      // flip: seen from outside, u runs right to left
    };
    const stripes = (L, D) => [[0, 0], [L / 0.3, 0], [L / 0.3, D / 0.3], [0, D / 0.3]];
    const frame = new Geo(), glass = new Geo(), stripe = new Geo(), sign = new Geo(), lamp = new Geo(), pit = new Geo();
    this.lifts = plan.lifts.map(l => {
      const S = l.shaft, lo = S.lo, top = S.top;
      // ---- the shaft
      for (const s of SIDES) {
        const info = S.sides[s];
        if (info.walled && !info.doors.length) continue;           // a room's own wall
        const F = sideOf(l, s), { a, b } = F;
        // Glass from the pit to the lid, but for a band of steel round each doorway.
        let y = lo;
        for (const [p, q] of [...info.doors.map(d => [d - 0.02, d + DOOR + 0.3]), [top, top]]) { if (p > y + 0.01) F.wall(glass, a, b, y, p, W / 2); y = Math.max(y, q); }
        l.stops.forEach((y0, i) => {
          F.box(frame, a - W, b + W, y0 + DOOR, y0 + DOOR + 0.3, 0.01, W + 0.02);          // a band round the shaft at every floor; over a doorway, its head
          if (l.doors[i] !== s) { F.box(frame, a, b, y0 - 0.02, y0 + 0.12, 0.01, W + 0.01); return; }      // and a kick plate
          // The doorway: steel either side, an architrave standing proud round it.
          F.box(frame, a - W, a + J, y0 - 0.02, y0 + DOOR, 0.01, W + 0.02); F.box(frame, b - J, b + W, y0 - 0.02, y0 + DOOR, 0.01, W + 0.02);
          F.box(frame, a + J - 0.06, a + J, y0 + 0.01, y0 + DOOR, W + 0.02, W + 0.05); F.box(frame, b - J, b - J + 0.06, y0 + 0.01, y0 + DOOR, W + 0.02, W + 0.05);
          F.box(frame, a + J - 0.06, b - J + 0.06, y0 + DOOR - 0.07, y0 + DOOR, W + 0.05, W + 0.06);
          F.box(frame, a + J, b - J, y0 + 0.004, y0 + 0.01, 0.005, W + 0.02);             // the sill
          // Over it, which floor this is, lit; on the jamb to its right, the call button.
          const k = Math.max(0, labels.indexOf(floorName(y0))), n = Math.max(1, labels.length), m = (a + b) / 2, u0 = k / n, u1 = (k + 1) / n;
          F.wall(sign, m - 0.26, m + 0.26, y0 + DOOR + 0.05, y0 + DOOR + 0.25, W + 0.026, F.flip ? [[u1, 0], [u0, 0], [u0, 1], [u1, 1]] : [[u0, 0], [u1, 0], [u1, 1], [u0, 1]]);
          const ub = F.flip ? a + 0.12 : b - 0.12;
          F.box(frame, ub - 0.06, ub + 0.06, y0 + 0.95, y0 + 1.25, W + 0.02, W + 0.035);
          for (const yb of [1.03, 1.14]) F.box(lamp, ub - 0.025, ub + 0.025, y0 + yb, y0 + yb + 0.05, W + 0.035, W + 0.045);
          // And on the floor in front, yellow and black.
          F.flat(stripe, a + J - 0.1, b - J + 0.1, W + 0.02, W + 0.34, y0 + 0.012, stripes(b - a - 2 * J + 0.2, 0.32));
        });
      }
      // Posts up the corners (none where two rooms' walls meet), a lid over the top, and the floor of the pit.
      for (const [sx, sz, ns, ew] of [[0, 0, 'n', 'w'], [1, 0, 'n', 'e'], [0, 1, 's', 'w'], [1, 1, 's', 'e']]) {
        if ([ns, ew].every(s => S.sides[s].walled && !S.sides[s].doors.length)) continue;
        const x = sx ? [l.x1 + 0.01, l.x1 + W + 0.03] : [l.x0 - W - 0.03, l.x0 - 0.01], z = sz ? [l.z1 + 0.01, l.z1 + W + 0.03] : [l.z0 - W - 0.03, l.z0 - 0.01];
        frame.box(x[0], x[1], lo - 0.02, top, z[0], z[1]);
      }
      frame.box(l.x0 - W - 0.03, l.x1 + W + 0.03, top, top + 0.12, l.z0 - W - 0.03, l.z1 + W + 0.03);
      pit.quad([l.x0 + 0.01, lo + 0.004, l.z0 + 0.01], [l.x1 - 0.01, lo + 0.004, l.z0 + 0.01], [l.x1 - 0.01, lo + 0.004, l.z1 - 0.01], [l.x0 + 0.01, lo + 0.004, l.z1 - 0.01], [0, 1, 0]);

      // ---- the car, built at its own floor (y = 0) and moved up and down as one
      const e = 0.015, open = new Set(l.doors), cf = new Geo(), cs = new Geo(), cg = new Geo(), ch = new Geo(), cl = new Geo();
      cf.box(l.x0 + e, l.x1 - e, -0.2, 0.012, l.z0 + e, l.z1 - e, 0.4);                      // the floor: chequer plate on a slab a hand deep
      cs.box(l.x0 + e, l.x1 - e, CAB, CAB + 0.1, l.z0 + e, l.z1 - e);                         // the roof
      for (const x of [l.x0 + e, l.x1 - e - 0.05]) for (const z of [l.z0 + e, l.z1 - e - 0.05]) cs.box(x, x + 0.05, 0.012, CAB, z, z + 0.05);
      for (const s of SIDES) {
        const F = sideOf(l, s), { a, b } = F;
        if (open.has(s)) {
          // A way in: a return either side, a head over, and a striped edge to the floor with a toe guard under it.
          F.box(cs, a + e, a + J, 0.012, CAB, -0.055, -e); F.box(cs, b - J, b - e, 0.012, CAB, -0.055, -e); F.box(cs, a + J, b - J, 2.15, CAB, -0.055, -e);
          F.box(ch, a + e, b - e, -0.2, 0.022, -0.12, -0.005, 0.3); F.box(ch, a + e, b - e, -0.75, -0.2, -0.03, -0.005, 0.3);
        } else {
          // A wall: steel to rail height, glass over, a handrail along it.
          F.box(cs, a + e, b - e, 0.012, 1.0, -0.055, -e); F.box(cs, a + e, b - e, 1.0, 1.03, -0.065, -e);
          F.wall(cg, a + e, b - e, 1.03, CAB, -0.035);
          F.box(cs, a + 0.2, b - 0.2, 0.86, 0.9, -0.13, -0.09);
          for (const u of [a + 0.3, b - 0.3]) F.box(cs, u - 0.015, u + 0.015, 0.87, 0.89, -0.09, -0.055);
        }
      }
      cl.quad([l.x0 + 0.7, CAB - 0.004, l.z0 + 0.7], [l.x1 - 0.7, CAB - 0.004, l.z0 + 0.7], [l.x1 - 0.7, CAB - 0.004, l.z1 - 0.7], [l.x0 + 0.7, CAB - 0.004, l.z1 - 0.7], [0, -1, 0]);
      const mesh = new THREE.Group();
      for (const [G, m] of [[cf, M.floor], [cs, M.frame], [cg, M.glass], [ch, M.stripe], [cl, M.ceiling]]) if (!G.empty) mesh.add(G.mesh(m));
      mesh.position.y = l.y;
      g.add(mesh);
      // ---- the gates: a striped kick board, rails and stiles across the doorway, there whenever the car is not.
      const gates = l.gates.map(gt => {
        const F = sideOf(l, gt.side), { a, b } = F, G = new Geo(), y0 = gt.y, d0 = 0.014, d1 = W - 0.008;
        F.box(G, a + J, b - J, y0 + 0.03, y0 + 0.3, d0, d1, 0.3); F.box(G, a + J, b - J, y0 + 0.58, y0 + 0.63, d0, d1, 0.3); F.box(G, a + J, b - J, y0 + 0.92, y0 + 1.0, d0, d1, 0.3);
        for (let k = 0; k <= 4; k++) { const u = a + J + 0.03 + (b - a - 2 * J - 0.06) * k / 4; F.box(G, u - 0.02, u + 0.02, y0 + 0.3, y0 + 0.92, d0, d1, 0.3); }
        const bars = G.mesh(M.stripe); g.add(bars);
        return { gate: gt, bars };
      });
      return { lift: l, mesh, gates };
    });
    for (const [G, m] of [[frame, M.frame], [glass, M.glass], [stripe, M.stripe], [sign, M.sign], [lamp, M.lamp], [pit, M.pit]]) if (!G.empty) g.add(G.mesh(m));
  }

  // ------------------------------------------------------------------ stunts --

  // The stunt kit is drawn in two lots: the jumps on the racing line, which are always there,
  // and everything else, which is cleared away while a race is on.
  _buildStunts() {
    this.kitLine = new THREE.Group(); this.group.add(this.kitLine);
    this.arrowTex = TX.chevrons();
    this._kit(this.plan.surfaces.filter(s => !s.line && !s.fixed), this.kit, true);
    this._kit(this.plan.surfaces.filter(s => s.line), this.kitLine, false);
  }
  setRace(on) { this.kit.visible = !on; }

  _kit(surfaces, group, extras) {
    const { plan } = this;
    const ply = new Geo(), stone = new Geo(), carpet = new Geo(), crate = new Geo(), wood = new Geo(), steel = new Geo();
    const led = new Geo(), arrows = new Geo(), track = new Geo(), trackArrows = new Geo(), rail = new Geo(), wire = new Geo(), gold = new Geo();
    const poolG = new Geo(), snowG = new Geo(), coping = new Geo(), lane = new Geo(), chrome = new Geo();
    const n3 = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
    const hungFrom = (x, y, z) => Math.min(ceilingAt(plan, x, z, y), y + 20);      // what a wire goes up to: the ceiling, or the underside of a bridge

    // One slab of a piece: the top following its slope, sides down to its base.
    const slab = (geo, s, x0, x1, z0, z1, along) => {
      const P = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], h = P.map(([x, z]) => heightOf(s, x, z));
      const base = i => (s.onTop != null ? s.onTop : s.thick ? h[i] - s.thick : s.base || 0);
      const top = i => [P[i][0], h[i], P[i][1]], bot = i => [P[i][0], base(i), P[i][1]];
      const dx = x1 - x0, dz = z1 - z0, nrm = n3(-(h[1] - h[0]) / dx, 1, -(h[3] - h[0]) / dz);
      geo.quad(top(0), top(1), top(2), top(3), nrm, along === 'z' ? [[0, z0], [1, z0], [1, z1], [0, z1]] : along === 'x' ? [[0, x0 / 1.2], [0, x1 / 1.2], [1, x1 / 1.2], [1, x0 / 1.2]] : [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]);
      if (s.thick && s.onTop == null) geo.quad(bot(0), bot(1), bot(2), bot(3), [0, -1, 0]);
      const N = [[0, 0, -1], [1, 0, 0], [0, 0, 1], [-1, 0, 0]];
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4, hi = h[i] - base(i), hj = h[j] - base(j);
        if (hi < 0.011 && hj < 0.011) continue;
        const len = Math.hypot(P[j][0] - P[i][0], P[j][1] - P[i][1]);
        geo.quad(bot(i), bot(j), top(j), top(i), N[i], [[0, 0], [len, 0], [len, hj], [0, hi]]);
      }
      return { h, top };
    };

    for (const s of surfaces) {
      const { x0, x1, z0, z1, h0, h1 } = s;
      if (s.skin === 'ply' || s.skin === 'track' || s.skin === 'pool' || s.skin === 'snow') {
        const isTrack = s.skin === 'track', isPool = s.skin === 'pool', isSnow = s.skin === 'snow', run = s.axis || s.run || 'x';
        // Curves are cut into slices; straight pieces are one slab.
        const n = s.curve || s.ease ? 14 : 1, geo = isTrack ? track : isPool ? poolG : isSnow ? snowG : ply;
        // The floor of the pool: a black line down the middle of it, as in any pool.
        if (s.floor) { const zc = (z0 + z1) / 2; lane.quad([x0 + 2, h0 + 0.004, zc - 0.14], [x1 - 3.5, h0 + 0.004, zc - 0.14], [x1 - 3.5, h0 + 0.004, zc + 0.14], [x0 + 2, h0 + 0.004, zc + 0.14], [0, 1, 0]); }
        for (let i = 0; i < n; i++) {
          const a = i / n, b = (i + 1) / n;
          const rx0 = run === 'x' ? x0 + (x1 - x0) * a : x0, rx1 = run === 'x' ? x0 + (x1 - x0) * b : x1;
          const rz0 = run === 'z' ? z0 + (z1 - z0) * a : z0, rz1 = run === 'z' ? z0 + (z1 - z0) * b : z1;
          const { top } = slab(geo, s, rx0, rx1, rz0, rz1, isTrack ? run : null);
          // Light down both edges: a strip on plywood, a proper lip on track.
          const lipH = isTrack ? 0.06 : 0.03, edges = run === 'x' ? [[0, 1, 0.012], [3, 2, -0.012]] : [[0, 3, 0.012], [1, 2, -0.012]];
          if (!isSnow && !s.floor) for (const [i0, i1, off] of edges) {
            const p0 = top(i0), p1 = top(i1);
            if (run === 'x') { p0[2] += off; p1[2] += off; } else { p0[0] += off; p1[0] += off; }
            (s.perch ? gold : isPool ? coping : isTrack && !s.lip ? rail : led).quad(p0, p1, [p1[0], p1[1] + lipH, p1[2]], [p0[0], p0[1] + lipH, p0[2]], run === 'x' ? [0, 0, 1] : [1, 0, 0]);
          }
          // Arrows running uphill on anything that slopes.
          if (s.axis && !isTrack && !isPool && !isSnow) {
            const up = h1 > h0, e = 0.014, t = [0, 1, 2, 3].map(k => { const q = top(k); q[1] += e; return q; });
            const m = (run === 'x' ? z1 - z0 : x1 - x0) * 0.18, L0 = (run === 'x' ? rx0 : rz0) / 0.55, L1 = (run === 'x' ? rx1 : rz1) / 0.55;
            if (run === 'x') { t[0][2] += m; t[1][2] += m; t[2][2] -= m; t[3][2] -= m; arrows.quad(t[0], t[1], t[2], t[3], [0, 1, 0], up ? [[0, L0], [0, L1], [1, L1], [1, L0]] : [[0, -L0], [0, -L1], [1, -L1], [1, -L0]]); }
            else { t[0][0] += m; t[3][0] += m; t[1][0] -= m; t[2][0] -= m; arrows.quad(t[0], t[1], t[2], t[3], [0, 1, 0], up ? [[0, L0], [1, L0], [1, L1], [0, L1]] : [[0, -L0], [1, -L0], [1, -L1], [0, -L1]]); }
          }
        }
        // Scaffolding: a tube down to the ground under every few planks, and a rail.
        if (s.posts) {
          const along = run === 'x' ? x1 - x0 : z1 - z0, count = Math.max(2, Math.round(along / 2.2) + 1);
          for (let i = 0; i < count; i++) for (const side of [0, 1]) {
            const t = i / (count - 1);
            const wx = run === 'x' ? x0 + (x1 - x0) * t : (side ? x1 - 0.04 : x0 + 0.04), wz = run === 'z' ? z0 + (z1 - z0) * t : (side ? z1 - 0.04 : z0 + 0.04);
            const y = heightOf(s, Math.min(x1, Math.max(x0, wx)), Math.min(z1, Math.max(z0, wz)));
            if (y > 0.3) steel.box(wx - 0.03, wx + 0.03, 0, y + 0.02, wz - 0.03, wz + 0.03);
          }
        }
        // Hung from the ceiling on wires.
        if (s.hang) {
          const along = run === 'x' ? x1 - x0 : z1 - z0, count = Math.max(2, Math.round(along / 3.2) + 1);
          for (let i = 0; i < count; i++) for (const side of [0, 1]) {
            const t = i / (count - 1);
            const wx = run === 'x' ? x0 + (x1 - x0) * t : (side ? x1 - 0.03 : x0 + 0.03), wz = run === 'z' ? z0 + (z1 - z0) * t : (side ? z1 - 0.03 : z0 + 0.03);
            const y = heightOf(s, Math.min(x1, Math.max(x0, wx)), Math.min(z1, Math.max(z0, wz)));
            wire.box(wx - 0.006, wx + 0.006, y, hungFrom(wx, y, wz), wz - 0.006, wz + 0.006);
          }
        }
      } else if (s.skin === 'stone') {
        stone.box(x0, x1, s.base || 0, h0, z0, z1, 1.3);
        if (s.carpet) {
          // A red runner down the middle, laid across the narrower way.
          const y0 = Math.max(s.base || 0, h0 - 0.19), y1 = h0 + 0.012;
          if (z1 - z0 > x1 - x0) carpet.box(x0 - 0.012, x1 + 0.012, y0, y1, (z0 + z1) / 2 + s.carpet[0], (z0 + z1) / 2 + s.carpet[1]);
          else carpet.box((x0 + x1) / 2 + s.carpet[0], (x0 + x1) / 2 + s.carpet[1], y0, y1, z0 - 0.012, z1 + 0.012);
        }
      } else if (s.skin === 'crate') {
        crate.box(x0, x1, s.base || 0, h0, z0, z1, 0.9);
      } else if (s.skin === 'table') {
        wood.box(x0 - 0.03, x1 + 0.03, h0 - 0.06, h0, z0 - 0.03, z1 + 0.03, 1.2);
        wood.box(x0 + 0.05, x1 - 0.05, h0 - 0.16, h0 - 0.06, z0 + 0.06, z0 + 0.09);
        wood.box(x0 + 0.05, x1 - 0.05, h0 - 0.16, h0 - 0.06, z1 - 0.09, z1 - 0.06);
      }
    }
    // The pool's ladder, where a ladder would be.
    if (extras && plan.pool) {
      const q = plan.pool, zl = q.bz0 + 4.5;
      for (const dz of [-0.25, 0.25]) { chrome.box(q.bx0 - 0.5, q.bx0 - 0.46, q.lip, q.lip + 0.8, zl + dz - 0.02, zl + dz + 0.02); chrome.box(q.bx0 - 0.5, q.bx0 + 0.1, q.lip + 0.76, q.lip + 0.8, zl + dz - 0.02, zl + dz + 0.02); chrome.box(q.bx0 + 0.06, q.bx0 + 0.1, q.lip - 0.5, q.lip + 0.8, zl + dz - 0.02, zl + dz + 0.02); }
      for (let i = 0; i < 2; i++) chrome.box(q.bx0 + 0.06, q.bx0 + 0.1, q.lip - 0.15 - i * 0.28, q.lip - 0.11 - i * 0.28, zl - 0.25, zl + 0.25);
    }
    if (extras) for (const o of plan.obstacles) {
      if (o.leg) wood.box(o.x0, o.x1, o.y0, o.y1, o.z0, o.z1);
      if (o.post) steel.box(o.x0, o.x1, 0, o.y1, o.z0, o.z1);
      if (o.rail && o.kit) { steel.box(o.x0, o.x1, o.y1 - 0.05, o.y1, o.z0, o.z1); steel.box(o.x0, Math.min(o.x1, o.x0 + 0.05), o.y0, o.y1, o.z0, Math.min(o.z1, o.z0 + 0.05)); }
    }

    // Track laid flat on the floor: where to line up, and which way.
    if (extras) for (const d of plan.decals) {
      const y = (d.y || 0) + 0.007, alongX = d.axis !== 'z', len = alongX ? d.x1 - d.x0 : d.z1 - d.z0, w = alongX ? d.z1 - d.z0 : d.x1 - d.x0;
      const k = len / 0.6, m = w * 0.22, e = 0.004, v = len / 1.2;
      const c = [[d.x0, y, d.z0], [d.x1, y, d.z0], [d.x1, y, d.z1], [d.x0, y, d.z1]];
      // Texture runs along the track: v follows x for one kind, z for the other.
      const uv = (n, flip) => alongX ? (flip ? [[0, n], [0, 0], [1, 0], [1, n]] : [[0, 0], [0, n], [1, n], [1, 0]]) : (flip ? [[0, n], [1, n], [1, 0], [0, 0]] : [[0, 0], [1, 0], [1, n], [0, n]]);
      track.quad(c[0], c[1], c[2], c[3], [0, 1, 0], uv(v, false));
      const a = alongX ? [[d.x0, y + e, d.z0 + m], [d.x1, y + e, d.z0 + m], [d.x1, y + e, d.z1 - m], [d.x0, y + e, d.z1 - m]] : [[d.x0 + m, y + e, d.z0], [d.x1 - m, y + e, d.z0], [d.x1 - m, y + e, d.z1], [d.x0 + m, y + e, d.z1]];
      trackArrows.quad(a[0], a[1], a[2], a[3], [0, 1, 0], uv(k, d.dir < 0));
    }

    // The loop: one ribbon of track taken right round, leaning sideways as it
    // goes so the way out sits beside the way in.
    if (extras) for (const L of plan.loops) {
      const N = 56, r = L.r, hw = L.w / 2;
      const at = th => [L.x + L.dir * r * Math.sin(th), r - r * Math.cos(th), L.z + L.shift * th / (Math.PI * 2)];
      for (let i = 0; i < N; i++) {
        const t0 = Math.PI * 2 * i / N, t1 = Math.PI * 2 * (i + 1) / N, a = at(t0), b = at(t1), tm = (t0 + t1) / 2;
        const inward = [-L.dir * Math.sin(tm), Math.cos(tm), 0];
        track.quad([a[0], a[1], a[2] - hw], [b[0], b[1], b[2] - hw], [b[0], b[1], b[2] + hw], [a[0], a[1], a[2] + hw], inward,
          [[0, i * 0.24], [0, (i + 1) * 0.24], [1, (i + 1) * 0.24], [1, i * 0.24]]);
        for (const sgn of [-1, 1]) {
          const z0 = a[2] + sgn * hw, z1 = b[2] + sgn * hw, f = 0.05;
          led.quad([a[0], a[1], z0], [b[0], b[1], z1], [b[0] + inward[0] * f, b[1] + inward[1] * f, z1], [a[0] + inward[0] * f, a[1] + inward[1] * f, z0], [0, 0, sgn]);
        }
      }
      const x0 = L.x - 1.45, x1 = L.x + 1.45, za = L.z - 0.55, zb = L.z + 1.15, top = 2 * r + 0.16;
      for (const z of [za, zb]) steel.box(x0 - 0.04, x1 + 0.04, top, top + 0.07, z - 0.035, z + 0.035);
      for (const x of [x0, x1]) steel.box(x - 0.035, x + 0.035, top, top + 0.07, za, zb);
      steel.box(L.x - 0.03, L.x + 0.03, top - 0.16, top + 0.07, za, zb);
    }

    const D = THREE.DoubleSide;
    const std = (o) => new THREE.MeshStandardMaterial({ side: D, ...o });
    const plyTex = TX.plywood(), trackTex = TX.track(), crateTex = TX.crate();
    const put = (geo, mat) => { if (!geo.empty) { const m = geo.mesh(mat); group.add(m); return m; } };
    put(ply, std({ map: plyTex, roughness: 0.75, emissiveMap: plyTex, emissive: 0x8a7a66, emissiveIntensity: 0.16 }));
    put(stone, std({ color: 0xb7b0a3, roughness: 0.5, emissive: 0x39424f, emissiveIntensity: 0.22 }));
    put(carpet, std({ color: 0x7a1218, roughness: 0.95, emissive: 0x3a0508, emissiveIntensity: 0.3 }));
    put(crate, std({ map: crateTex, roughness: 0.85, emissiveMap: crateTex, emissive: 0x80705a, emissiveIntensity: 0.16 }));
    put(wood, std({ color: 0x6a4526, roughness: 0.5, emissive: 0x5a3a20, emissiveIntensity: 0.5 }));
    put(steel, std({ color: 0x1a1c20, roughness: 0.45, metalness: 0.6 }));
    put(wire, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.16, 0.18, 0.22) }));
    put(track, std({ map: trackTex, roughness: 0.45, emissiveMap: trackTex, emissive: 0xffffff, emissiveIntensity: 0.3, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    const tile = TX.poolTile();
    put(poolG, std({ map: tile, roughness: 0.25, emissiveMap: tile, emissive: 0x8fb4c8, emissiveIntensity: 0.34 }));
    put(snowG, std({ map: this.snowTex, roughness: 0.95, emissiveMap: this.snowTex, emissive: new THREE.Color(0.3, 0.36, 0.52), emissiveIntensity: 0.55 }));
    put(coping, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 0.97, 1.0), side: D }));
    put(lane, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.02, 0.05, 0.12), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    put(chrome, std({ color: 0xd8dde2, roughness: 0.2, metalness: 0.8, emissive: 0x596270, emissiveIntensity: 0.6 }));
    put(rail, std({ color: 0xc8501a, roughness: 0.5, emissive: 0xc8501a, emissiveIntensity: 0.35 }));
    put(led, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.22, 1.25, 1.45), side: D }));
    put(gold, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.0, 0.22), side: D }));        // somewhere to land and look from
    const arrowMat = new THREE.MeshBasicMaterial({ map: this.arrowTex, color: new THREE.Color(0.2, 0.75, 0.85), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: D, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    const a1 = put(arrows, arrowMat), a2 = put(trackArrows, arrowMat);
    for (const m of [a1, a2]) if (m) m.renderOrder = 6;

    // Mopped floor: a patch that mirrors like nothing else in the building.
    if (extras) for (const p of plan.puddles) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(p.r, 44), this.mirror.patch(new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.05, transparent: true, opacity: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), [0.6, 0.4]));
      m.rotation.x = -Math.PI / 2; m.position.set(p.x, (p.y || 0) + 0.004, p.z); m.updateMatrix(); m.matrixAutoUpdate = false;
      this.kit.add(m); this.floors.push(m);
    }

    // Hoops: gold until you have been through them.
    if (extras) this.hoops = plan.hoops.map(h => {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.05, 0.7, 0.14) });
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(h.r, 0.032, 10, 56), mat);
      mesh.position.set(h.x, h.y, h.z);
      if (h.axis === 'x') mesh.rotation.y = Math.PI / 2; else if (h.axis === 'y') mesh.rotation.x = Math.PI / 2;
      this.kit.add(mesh);
      return { ...h, mesh, mat, done: false, pop: 0 };
    });
  }

  showHoops(on) { for (const h of this.hoops) { h.done = false; h.pop = 0; h.mesh.visible = on; h.mesh.scale.setScalar(1); } }
  get hoopsDone() { return this.hoops.reduce((n, h) => n + (h.done ? 1 : 0), 0); }

  // Did something moving from `a` to `b` pass through a hoop it had not been through?
  hoopHit(a, b) {
    for (const h of this.hoops) {
      if (h.done || !h.mesh.visible) continue;
      const k = h.axis, pa = a[k] - h[k], pb = b[k] - h[k];
      if (pa === pb || (pa < 0) === (pb < 0)) continue;
      const t = pa / (pa - pb), x = a.x + (b.x - a.x) * t - h.x, y = a.y + (b.y - a.y) * t - h.y, z = a.z + (b.z - a.z) * t - h.z;
      if (x * x + y * y + z * z > h.r * h.r) continue;
      h.done = true; h.pop = 1;
      return h;
    }
    return null;
  }

    // ------------------------------------------------------------------- life --

  sleep() {
    for (const s of Object.values(this.rooms)) { s.lit = false; s.wake = 0; }
    for (const a of this.arts) { a.lit = 0; a.wakeAt = -1; this._paint(a); }
    this._waking.clear();
  }

  wakeAll() {
    for (const s of Object.values(this.rooms)) s.lit = true;
    for (const a of this.arts) if (a.wakeAt < 0) { a.wakeAt = this.time + Math.random() * 1.5; this._waking.add(a); }
  }

  // ---- what you have seen ----
  get seenCount() { return this.arts.reduce((n, a) => n + (a.seen ? 1 : 0), 0); }
  get galleries() { return Object.values(this.rooms).filter(s => s.arts.length); }

  see(a) {
    if (a.seen) return;
    a.seen = true;
    this.seenIds.add(a.work.id);
    const st = this.rooms[a.room];
    st.seen++;
    const complete = !st.done && st.seen === st.arts.length;
    if (complete) st.done = true;
    this._paint(a);
    clearTimeout(this._save);
    this._save = setTimeout(() => { try { localStorage.setItem('after-hours.seen-ids', JSON.stringify([...this.seenIds])); } catch { /* fine */ } }, 1500);
    if (this.onSeen) this.onSeen(a, st, complete);
  }

  forget() {
    this.seenIds.clear(); this.visited.clear();
    try { localStorage.removeItem('after-hours.seen-ids'); localStorage.removeItem('after-hours.rooms'); } catch { /* fine */ }
    for (const a of this.arts) { a.seen = false; this._paint(a); }
    for (const st of Object.values(this.rooms)) { st.seen = 0; st.done = false; }
  }

  get litCount() { return this.arts.reduce((n, a) => n + (a.wakeAt >= 0 ? 1 : 0), 0); }
  get roomsLit() { return Object.values(this.rooms).filter(s => s.room.kind === 'gallery' && s.lit).length; }

  // Called every frame with wherever the vehicle is.
  update(dt, pos, roomId, cam) {
    this.time += dt;
    const t = this.time;
    const state = roomId && this.rooms[roomId];
    if (state && !this.visited.has(roomId)) { this.visited.add(roomId); try { localStorage.setItem('after-hours.rooms', JSON.stringify([...this.visited])); } catch { /* fine */ } }
    if (state) {
      const kind = state.room.kind;
      if (kind === 'gallery' && !state.lit && state.sw !== false) {      // (sw: its light switch, src/lights.js; false once it has been switched off)
        state.lit = true;
        for (const a of state.arts) {
          a.wakeAt = t + 0.05 + Math.hypot(a.x - pos.x, a.z - pos.z) * 0.06 + Math.random() * 0.08;
          this._waking.add(a);
        }
        if (this.onRoomLit) this.onRoomLit(roomId, state);
      } else if (kind !== 'gallery' && state.sw !== false) {
        // In the hall and the passage, lamps come on only as you draw near.
        const reach = kind === 'hall' ? 13 : 7.5;
        for (const a of state.arts) {
          if (a.wakeAt >= 0) continue;
          const d = Math.hypot(a.x - pos.x, a.z - pos.z);
          if (d < reach) { a.wakeAt = t + d * 0.03; this._waking.add(a); state.lit = true; }
        }
      }
    }
    // Seen: close enough to take it in, in front of it, with its lamp on.
    if (state) for (const a of state.arts) {
      if (a.seen || a.lit < 0.6) continue;
      const dx = pos.x - a.x, dz = pos.z - a.z, d = Math.hypot(dx, dz);
      // Near means near: a couple of metres for a small picture, about five for the very largest.
      // Something glimpsed across the room does not count.
      if (d > (a.obj ? 2.6 : a.mini ? 2.2 : Math.max(2.4, Math.min(5.2, 1.7 + Math.max(a.w, a.h) * 1.05))) || Math.abs(pos.y - (a.fy || 0)) > 3) continue;      // and not from a balcony overhead
      if (!a.obj && dx * a.nx + dz * a.nz < 0.4) continue;
      this.see(a);
    }
    // Things in cases turn to face you, like the cut-outs they are.
    for (const o of this.objects) {
      const dx = cam.x - o.x, dz = cam.z - o.z;
      if (!o.mesh.visible || dx * dx + dz * dz > 1600) continue;
      o.mesh.rotation.y = Math.atan2(dx, dz); o.mesh.updateMatrix();
    }
    // Snow falls outdoors only: not when the camera is in a room, nor in the thickness of a wall or a gap between rooms
    // (inside a building's block), nor when the toy it is following is indoors and it has backed out through a wall.
    this.flakes.visible = !this.playerIndoors && !roomAt(this.plan, cam.x, cam.z, cam.y) && !this.plan.masses.some(m => cam.x > m.x0 && cam.x < m.x1 && cam.z > m.z0 && cam.z < m.z1 && cam.y < m.top);
    // The back rooms' fittings: only what is near, and on this level or the one below (down a stair well, over a balcony). From outdoors, only what is just inside a door.
    const near = this.flakes.visible ? 10 : 32;
    for (const c of this.fitout.chunks) c.mesh.visible = cam.x > c.x0 - near && cam.x < c.x1 + near && cam.z > c.z0 - near && cam.z < c.z1 + near && cam.y > c.y0 - 2.5 && cam.y < c.y1 + 7;
    for (const L of this.lifts) { L.mesh.position.y = L.lift.y; for (const q of L.gates) q.bars.visible = !q.gate.off; }
    for (const a of this._waking) {
      const e = t - a.wakeAt;
      if (e < 0) continue;
      if (!a.rang) { a.rang = true; if (this.onWake) this.onWake(a); }
      a.lit = this.calm ? Math.min(1, e / 0.9) ** 2 * (3 - 2 * Math.min(1, e / 0.9)) : flicker(e);
      this._paint(a);
      if (e > 1) { a.lit = 1; this._paint(a); this._waking.delete(a); a.rang = false; }
    }
    if (this._spot) { this._paint(this._spot); if (!this._spot.boost) this._spot = null; }
    for (const s of Object.values(this.rooms)) {
      const k = s.room.kind;
      const target = k === 'gallery' ? (s.lit && s.sw !== false ? 1 : 0) : 0;
      s.wake += (target - s.wake) * Math.min(1, dt * 1.1);
      const base = s.room.glow != null ? s.room.glow : k === 'hall' ? 0.05 : k === 'corridor' ? 0.012 : 0.022;      // (glow: a room that is lit whether or not anybody has woken it)
      s.wallMat.emissiveIntensity = base + 0.34 * s.wake;
      s.trimMat.emissiveIntensity = 0.02 + 0.2 * s.wake;
      if (s.floorMat) s.floorMat.emissiveIntensity = 0.02 + 0.26 * s.wake;
      for (const m of s.frameMats) m.emissiveIntensity = 0.05 + 0.85 * s.wake;
    }
    // Lamps in the hall and passage light their own frames; approximate with how many are on.
    for (const id of ['hall', 'C']) {
      const s = this.rooms[id];
      if (!s || !s.arts.length) continue;
      const on = s.arts.reduce((n, a) => n + a.lit, 0) / s.arts.length;
      for (const m of s.frameMats) m.emissiveIntensity = 0.06 + 0.85 * on;
    }
    if (this._dirty) {
      this.lamps.instanceColor.needsUpdate = true; this.washes.instanceColor.needsUpdate = true;
      this.pools.instanceColor.needsUpdate = true; this.cards.instanceColor.needsUpdate = true;
      this._dirty = false;
    }
    this._weather(dt, t, cam);
    this._stream(pos, cam, roomId);
    this._hang();
  }

  // Lock or unlock the building. Unlocking swings every outside door open.
  setLocked(locked, now) {
    this.plan.locked = locked;
    this.doorTarget = locked ? 0 : 1;
    if (now) this.doorOpen = this.doorTarget;
    this._doors();
  }
  _doors() {
    const k = this.doorOpen, e = k * k * (3 - 2 * k);
    for (const l of this.leaves) { l.pivot.rotation.y = l.shut + (l.open - l.shut) * e; }
  }

  _weather(dt, t, cam) {
    if (this.doorOpen !== this.doorTarget) { this.doorOpen += Math.sign(this.doorTarget - this.doorOpen) * Math.min(Math.abs(this.doorTarget - this.doorOpen), dt * 0.8); this._doors(); }
    this.closedSign.rotation.z = Math.sin(t * 1.1) * 0.035;
    if (this.flakes.visible) {
      const f = this.flakes.geometry.attributes.position, sd = this.flakes.userData.seed, W = 58, Hh = 30;
      for (let i = 0; i < f.count; i++) {
        const sx = sd[i * 3], sy = sd[i * 3 + 1], sz = sd[i * 3 + 2];
        // Each flake keeps its own place in a block of air that is tiled round the camera.
        const wx = sx * W + Math.sin(t * 0.5 + sy * 40) * 0.6, wz = sz * W + Math.cos(t * 0.4 + sx * 40) * 0.6, wy = sy * Hh - t * (0.8 + sx * 0.7);
        f.array[i * 3] = cam.x + ((((wx - cam.x) % W) + W) % W) - W / 2;
        f.array[i * 3 + 1] = Math.max(-2, cam.y - 10) + (((wy % Hh) + Hh) % Hh);          // the block of air comes up with you, onto a roof or over one
        f.array[i * 3 + 2] = cam.z + ((((wz - cam.z) % W) + W) % W) - W / 2;
      }
      f.needsUpdate = true;
    }
    const p = this.snow.geometry.attributes.position, seed = this.snow.userData.seed;
    for (let i = 0; i < p.count; i++) {
      let y = p.array[i * 3 + 1] - dt * (0.7 + (seed[i] % 1) * 0.6);
      if (y < 0) y += 26;
      p.array[i * 3 + 1] = y;
      p.array[i * 3 + 2] += Math.sin(t * 0.6 + seed[i]) * dt * 0.35;
    }
    p.needsUpdate = true;
    const d = this.dust.geometry.attributes.position, b = this.dust.userData.base;
    for (let i = 0; i < d.count; i++) {
      const s = b[i * 4 + 3];
      d.array[i * 3] = b[i * 4] + Math.sin(t * 0.11 + s) * 0.5;
      d.array[i * 3 + 1] = (b[i * 4 + 1] + t * 0.035 * (0.5 + (s % 1))) % (SPRING - 0.3);
      d.array[i * 3 + 2] = b[i * 4 + 2] + Math.cos(t * 0.09 + s * 1.7) * 0.5;
    }
    d.needsUpdate = true;
    this.balloon.position.y = SPRING + VAULT_R - 0.42 + Math.sin(t * 0.7) * 0.015;
    this.balloon.rotation.z = Math.sin(t * 0.5) * 0.05;
    this.shaftMesh.material.opacity = 0.19 + Math.sin(t * 0.23) * 0.02;
    if (!this.calm) this.arrowTex.offset.y = -(t * 0.9) % 1;
    if (!this.calm && this.ventArrows) this.ventArrows.offset.y = -(t * 0.9) % 1;
    if (this.flagWave) this.flagWave(t, this.calm);       // the flags over the door (grounds.js)
    for (const h of this.hoops) {
      if (h.pop > 0) { h.pop = Math.max(0, h.pop - dt * 1.6); h.mesh.scale.setScalar(1 + (this.calm ? 0 : h.pop * 0.5)); }
      const g = h.done ? 0.12 + h.pop * 2.5 : this.calm ? 1 : 0.85 + 0.15 * Math.sin(t * 3 + h.x);
      if (h.done) h.mat.color.setRGB(0.2 * g + h.pop, 1.2 * g + h.pop, 0.5 * g + h.pop); else h.mat.color.setRGB(1.05 * g, 0.7 * g, 0.14 * g);
    }
  }

  // ----------------------------------------------------------- image tiers --
  // 0 is the API's own tiny placeholder, 1 a 400 px image, 2 the 843 px image
  // the museum recommends, 3 a 1686 px image for the work being studied.

  // Which pictures to fetch, and at what size. Only what can be seen from here, or is about to be: a picture in this
  // room facing you; one in another room that the line from the eye to it reaches through doorways (up to three);
  // the next room's, through a doorway you are close to. Not the rooms all round behind their walls, which used to be
  // fetched just for being near. Nothing already fetched is let go for being out of sight, only for being far off.
  _stream(pos, cam, roomId) {
    this._streamT = (this._streamT || 0) + 1;
    if (this._streamT % 12) return;
    const plan = this.plan, queue = [], here = roomId ? plan.byId[roomId] : null;
    // the rooms one doorway away whose doorway is close by: their pictures are the next ones you will see
    // (a doorway within 5 m that the toy is heading for: the camera trails the toy, so camera to toy is the way it goes)
    const soon = new Map(), hx = pos.x - cam.x, hz = pos.z - cam.z;
    if (here) for (const d of plan.doorsOf(here.id)) {
      if (d.hidden && !plan.secretOpen) continue; const o = d.a === here.id ? d.b : d.a; if (o === 'out' || !plan.byId[o]) continue;
      const cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2;
      if (Math.hypot(cx - pos.x, cz - pos.z) < 5 && Math.abs(d.y - (pos.y || 0)) < 2.5 && (cx - pos.x) * hx + (cz - pos.z) * hz > 0) soon.set(o, { x: cx, z: cz });
    }
    for (const a of this.arts) {
      const d = Math.hypot(a.x - cam.x, a.z - cam.z) + Math.abs(a.y - cam.y) * 2.5;      // a floor up or down is a long way off
      const keep = d < (roomId ? 80 : 45);                                                     // already fetched and not far: kept
      let want = 0;
      if (a.focus) want = 3;
      else if (d < (roomId ? 55 : 26)) {
        const faces = a.obj || a.mini || a.nx == null || (cam.x - a.x) * a.nx + (cam.z - a.z) * a.nz > -0.2;
        if (a.room === roomId) want = faces ? (!a.mini && !a.obj && a.room !== 'hall' ? 2 : 1) : 0;
        else if (faces && this._seen(cam, a, here)) want = 1;
        else if (soon.has(a.room) && d < 25 && (a.obj || a.nx == null || (soon.get(a.room).x - a.x) * a.nx + (soon.get(a.room).z - a.z) * a.nz > 0)) want = 1;      // and only what faces that doorway
        const near = a.mini || a.obj ? 5 : 13;
        if (want && d < near && !a.obj) want = 2;
      }
      if (a.obj && want > 1 && !a.focus) want = 1;      // a cut-out is made at one size: a bigger photograph adds nothing
      if (!want && a.tier > 0 && keep) want = Math.min(a.tier, 1);
      a.want = want;
      if (want > a.tier && !a.busy) queue.push([d - want * 4, a]);
      else if (want < a.tier && !a.busy) this._drop(a, want);
    }
    queue.sort((x, y) => x[0] - y[0]);
    for (const [, a] of queue) { if (this.loading >= 6) break; this._load(a, a.want); }
  }

  // One picture a frame is handed to the graphics card, and no more: twenty arriving together used to stop the game for a moment.
  _hang() {
    const job = this._ready && this._ready.shift();
    if (!job) return;
    const { a, tier, url, source, flip } = job;
    const t = source instanceof HTMLCanvasElement ? new THREE.CanvasTexture(source) : new THREE.Texture(source);
    t.flipY = flip;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = this.maxAniso;
    t.needsUpdate = true;
    if (this.renderer) this.renderer.initTexture(t);       // now, while it is the only one, not whenever it first comes into view
    if (a.obj) a.mesh.visible = true;
    const old = a.tex;
    a.tex = t; a.tier = tier; a.url = url;
    a.mat.map = a.mat.emissiveMap = t;
    if (old) { old.dispose(); if (old.image && old.image.close) old.image.close(); }
    a.busy = false; this.loading--;
  }

  // Does the straight line from the eye to this picture get to its room through doorways (at most three), never
  // through a wall? From outdoors, through a way in. On the plan's own boxes, so it costs a few comparisons a door.
  _seen(cam, a, here) {
    const plan = this.plan, x0 = cam.x, z0 = cam.z, dx = a.x - x0, dz = a.z - z0, y = a.y;
    const hits = q => {           // the segment against a doorway's box (a little grown), in plan
      const g = 0.15, bx0 = q.x0 - g, bx1 = q.x1 + g, bz0 = q.z0 - g, bz1 = q.z1 + g; let t0 = 0, t1 = 1;
      for (const [p, dp, lo, hi] of [[x0, dx, bx0, bx1], [z0, dz, bz0, bz1]]) {
        if (Math.abs(dp) < 1e-9) { if (p < lo || p > hi) return false; continue; }
        let u = (lo - p) / dp, v = (hi - p) / dp; if (u > v) [u, v] = [v, u]; t0 = Math.max(t0, u); t1 = Math.min(t1, v); if (t0 > t1) return false;
      }
      return true;
    };
    let cur = here ? here.id : 'out', last = null;
    for (let hop = 0; hop < 4; hop++) {
      if (cur === a.room) return true;
      let next = null;
      for (const d of cur === 'out' ? plan.doors.filter(q => q.out) : plan.doorsOf(cur)) {
        if (d === last || (d.hidden && !plan.secretOpen) || d.vent) continue;
        if (y < d.y - 0.5 || y > d.y + Math.max(d.h, 3) + 4) continue;        // a doorway on another floor
        if (!hits(d)) continue;
        next = d; break;
      }
      if (!next) return false;
      last = next; cur = next.a === cur ? next.b : next.a;
    }
    return cur === a.room;
  }
  _drop(a, tier) {
    // Stepping down re-requests the smaller image; the browser has it cached.
    if (tier === 0) {
      // A long way off: give the picture's memory back. It is fetched again when you return.
      if (a.tex) { a.tex.dispose(); if (a.tex.image && a.tex.image.close) a.tex.image.close(); }
      a.tex = null; a.tier = 0; a.url = null;
      a.mat.map = a.mat.emissiveMap = this.blank;
      if (a.obj) a.mesh.visible = false;
      return;
    }
    if (a.tier - tier >= 1 && tier >= 1) this._load(a, tier);
  }

  _load(a, tier) {
    const px = [0, 400, 843, 1686][tier];
    const url = imageUrl(a.work, px);
    if (url === a.url) { a.tier = tier; return; }       // an offline copy serves several tiers
    a.busy = true; this.loading++;
    this._ready = this._ready || [];
    if (this._worker === undefined) {
      this._jobs = new Map(); this._jobId = 0;
      try {
        if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap !== 'function') throw new Error('no worker loading');
        const w = this._worker = new Worker(URL.createObjectURL(new Blob([LOADER], { type: 'text/javascript' })));
        const giveUp = () => { this._worker = null; w.terminate(); for (const j of this._jobs.values()) this._loadHere(j.a, j.tier, j.url); this._jobs.clear(); };
        w.onerror = giveUp;
        w.onmessage = e => {
          const j = this._jobs.get(e.data.id);
          if (!j) return;
          this._jobs.delete(e.data.id);
          if (e.data.bmp) { this._ok = true; this._ready.push({ a: j.a, tier: j.tier, url: j.url, source: e.data.bmp, flip: false }); return; }
          // Whatever went wrong, the page has one try at this picture itself; and a worker that has
          // never once delivered is given up on after three failures.
          this._loadHere(j.a, j.tier, j.url);
          this._misses = (this._misses || 0) + 1;
          if (e.data.cannot || (!this._ok && this._misses >= 3)) giveUp();
        };
      } catch { this._worker = null; }
    }
    if (this._worker) { const id = ++this._jobId; this._jobs.set(id, { a, tier, url }); this._worker.postMessage({ id, url: new URL(url, location.href).href, obj: !!a.obj }); }
    else this._loadHere(a, tier, url);
  }
  _failed(a) { a.failed = (a.failed || 0) + 1; setTimeout(() => { a.busy = false; this.loading--; }, Math.min(60000, 4000 * a.failed)); }
  // The old way, on the page: an image element, and the cut-out done here.
  _loadHere(a, tier, url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => this._ready.push({ a, tier, url, source: a.obj ? cutOut(img) : img, flip: true });
    img.onerror = () => this._failed(a);
    img.src = url;
  }

  // Single one work out: brighter lamp, brighter canvas. 0 puts it back.
  spotlight(art, k) {
    if (this._spot && this._spot !== art) { this._spot.boost = 0; this._paint(this._spot); }
    if (!art) { this._spot = null; return; }
    art.boost = k; this._spot = art;
    if (art.wakeAt < 0) { art.wakeAt = this.time; this._waking.add(art); }
  }

  // The work a jump from here will carry you past.
  beside(pos, vel, air, roomId) {
    const s = this.rooms[roomId];
    if (!s) return null;
    const mx = pos.x + vel.x * air * 0.5, mz = pos.z + vel.z * air * 0.5;
    let best = null, bd = s.room.kind === 'hall' ? 11 : 9.5;
    for (const a of s.arts) {
      if (Math.abs(pos.y - (a.fy || 0)) > 4.5) continue;                       // not one on another level of a tall room
      const d = Math.hypot(a.x - mx, a.z - mz) - Math.min(1.5, a.w * 0.3);     // big pictures pull harder
      if (d < bd) { bd = d; best = a; }
    }
    return best;
  }

  // The work you would be looking at from here, if any.
  facing(pos, yaw, roomId) {
    const s = this.rooms[roomId];
    if (!s) return null;
    const fx = Math.sin(yaw), fz = Math.cos(yaw);
    let best = null, score = Infinity;
    for (const a of s.arts) {
      const dx = a.x - pos.x, dz = a.z - pos.z, d = Math.hypot(dx, dz);
      const reach = a.mini || a.obj ? 3.2 : 5.5 + a.w * 0.6;
      if (d > reach || Math.abs(pos.y - (a.fy || 0)) > 3) continue;
      const ahead = (dx * fx + dz * fz) / (d || 1);
      const sc = d - ahead * 2.2;
      if (sc < score) { score = sc; best = a; }
    }
    return best;
  }
}
