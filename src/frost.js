// Winter on living things. Bare trees whose every twig carries a line of snow, and evergreen hedges
// rounded and frosted white on top, as they are after a still night's fall. Drawn by hand: a canvas
// of branching for the twigs, a speckled green going to white for the hedges.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from './textures.js';

// ------------------------------------------------------------------ hedges
let _hedgeMat = null;
/** Dark yew below, thick with frost towards the top. v runs up the hedge. */
export function hedgeMaterial() {
  if (_hedgeMat) return _hedgeMat;
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d'), r = rng(77);
  const g = c.createLinearGradient(0, 256, 0, 0); g.addColorStop(0, '#12251a'); g.addColorStop(0.55, '#1b3626'); g.addColorStop(1, '#2a4634'); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { const y = r() * 256; c.fillStyle = r() < 0.5 ? 'rgba(8,20,12,.5)' : 'rgba(48,86,58,.45)'; c.fillRect(r() * 256, y, 1 + r() * 3, 1 + r() * 3); }      // needles
  for (let i = 0; i < 5200; i++) { const t = Math.pow(r(), 2.2), y = t * 250, s = 1.2 + r() * (4.5 - t * 3); c.fillStyle = `rgba(${236 + r() * 19 | 0},${242 + r() * 13 | 0},255,${0.55 + r() * 0.45})`; c.beginPath(); c.arc(r() * 256, y, s, 0, 7); c.fill(); }   // snow, thickest at the top
  c.fillStyle = 'rgba(244,248,255,.9)'; c.fillRect(0, 0, 256, 10);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  _hedgeMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, emissiveMap: t, emissive: new THREE.Color(0.42, 0.47, 0.6), emissiveIntensity: 0.55 });
  return _hedgeMat;
}
/**
 * Hedges along runs. `rects` is a list of {x0, x1, z0, z1, y0?, h?}; they are drawn into `geo` as
 * unbroken clipped hedges. Lengths in line that meet or nearly meet (a gap under `gap`) are drawn
 * as one; an end that meets the side of another hedge (a corner, a T) is carried on into it, so the
 * two grow together; every end that is really an end (at a path, a gate, a tree pit) is clipped
 * round. Returns the runs as drawn.
 */
export function frostHedges(geo, rects, y0 = 0, h = 0.8, gap = 0.6) {
  const R = rects.filter(q => q.x1 > q.x0 && q.z1 > q.z0).map(q => ({ x0: q.x0, x1: q.x1, z0: q.z0, z1: q.z1, y0: q.y0 ?? y0, h: q.h ?? h }));
  const ax = q => q.x1 - q.x0 >= q.z1 - q.z0;
  // Lengths in line, end to end or nearly: one hedge.
  for (let again = true; again;) {
    again = false;
    for (let i = 0; i < R.length && !again; i++) for (let j = i + 1; j < R.length && !again; j++) {
      const a = R[i], b = R[j]; if (ax(a) !== ax(b) || Math.abs(a.y0 - b.y0) > 0.05) continue;
      const X = ax(a), a0 = X ? a.x0 : a.z0, a1 = X ? a.x1 : a.z1, b0 = X ? b.x0 : b.z0, b1 = X ? b.x1 : b.z1;
      const inLine = X ? Math.abs(a.z0 - b.z0) < 0.15 && Math.abs(a.z1 - b.z1) < 0.15 : Math.abs(a.x0 - b.x0) < 0.15 && Math.abs(a.x1 - b.x1) < 0.15;
      if (!inLine || b0 > a1 + gap || a0 > b1 + gap) continue;
      R[i] = { x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), z0: Math.min(a.z0, b.z0), z1: Math.max(a.z1, b.z1), y0: a.y0, h: Math.max(a.h, b.h) };
      R.splice(j, 1); again = true;
    }
  }
  // An end that meets the side of another hedge (a corner, a T) is carried on through it to just short
  // of its far side, so that its clipped nose is buried in the other and the two grow together with no
  // gap, no notch and no cut face showing; at an outside corner the two noses round the corner off.
  const runs = R.map(r => {
    const X = ax(r), c = X ? (r.z0 + r.z1) / 2 : (r.x0 + r.x1) / 2, out = { ...r };
    for (const s of [0, 1]) {
      const p = X ? (s ? r.x1 : r.x0) : (s ? r.z1 : r.z0);
      for (const o of R) {
        if (o === r || ax(o) === X || Math.abs(o.y0 - r.y0) > 0.3) continue;
        const o0 = X ? o.x0 : o.z0, o1 = X ? o.x1 : o.z1, c0 = X ? o.z0 : o.x0, c1 = X ? o.z1 : o.x1;
        if (c < c0 - 0.05 || c > c1 + 0.05) continue;
        if (s ? !(p >= o0 - gap && p <= o1) : !(p >= o0 && p <= o1 + gap)) continue;
        const inset = Math.min(0.12, (o1 - o0) * 0.2);
        out[X ? (s ? 'x1' : 'x0') : (s ? 'z1' : 'z0')] = s ? o1 - inset : o0 + inset; break;
      }
    }
    return out;
  });
  for (const q of runs) frostHedge(geo, q.x0, q.x1, q.z0, q.z1, q.y0, q.h);
  return runs;
}

/**
 * One clipped hedge on the rectangle given, `h` tall from `y0`: bellied sides, a rounded shoulder and
 * a nearly level top under the snow, its height even along it but for a gentle unevenness. `round`
 * says which ends ([low, high] along its length) are clipped round; a square end is closed flat
 * (it is meant to be buried in another hedge). Smooth-shaded, into a Geo.
 */
export function frostHedge(geo, x0, x1, z0, z1, y0 = 0, h = 0.8, round = [true, true]) {
  const alongX = x1 - x0 >= z1 - z0, L = alongX ? x1 - x0 : z1 - z0, W = alongX ? z1 - z0 : x1 - x0;
  if (!(L > 0 && W > 0)) return;
  const r = rng(Math.round(x0 * 31 + z0 * 17) + 5), ph = [r() * 6.3, r() * 6.3, r() * 6.3], u0 = alongX ? x0 : z0;
  const P = (u, w, y) => alongX ? [x0 + u, y0 + y, z0 + w] : [x0 + w, y0 + y, z0 + u];
  // The stations along it: [u, width scale, height scale, turn of the texture]. A round end draws in over a quarter circle.
  const Rr = Math.min(W * 0.55, L * 0.5), st = [], put = s => { if (!st.length || Math.abs(st[st.length - 1][0] - s[0]) > 1e-4) st.push(s); };
  const nose = k => { const f = k * Math.PI / 8; return [Rr * (1 - Math.cos(f)), 0.5 + 0.5 * Math.sin(f), 0.8 + 0.2 * Math.sin(f), 1 - Math.sin(f)]; };
  if (round[0]) for (let k = 0; k <= 4; k++) { const [u, a, b, e] = nose(k); put([u, a, b, -e]); } else put([0, 1, 1, 0]);
  const uA = round[0] ? Rr : 0, uB = round[1] ? L - Rr : L, n = Math.max(1, Math.round((uB - uA) / 0.4));
  for (let i = 1; i < n; i++) put([uA + (uB - uA) * i / n, 1, 1, 0]);
  if (round[1]) for (let k = 4; k >= 0; k--) { const [u, a, b, e] = nose(k); put([L - u, a, b, e]); } else put([L, 1, 1, 0]);
  // The section across it at each station: foot, bellied side, shoulder, crown, shoulder, side, foot.
  // v runs up the hedge in the material: dark yew at the foot, frost thickening to the snow on top. Round
  // a nose the texture's u carries on outward by the distance from the middle (`e`), both sides alike,
  // so the speckle wraps round the end instead of being drawn out into streaks (one side faster than the
  // other, so the fold at the middle of the end is not an exact mirror).
  const NP = 11, pos = [], uvs = [];
  for (const [u, kw, kh, e] of st) {
    const c = 1 + 0.016 * Math.sin(u * 1.7 + ph[0]) + 0.01 * Math.sin(u * 4.3 + ph[1]) + (r() - 0.5) * 0.016, b = 0.07 + 0.02 * Math.sin(u * 2.3 + ph[2]) + r() * 0.015;
    const sec = [[0, 0, 0], [-b, 0.3 * h, 0.28], [-0.75 * b, 0.64 * h, 0.56], [0.09 * W, 0.9 * h * c, 0.8], [0.3 * W, 0.99 * h * c, 0.92], [0.5 * W, h * c, 0.95],
      [0.7 * W, 0.99 * h * c, 0.92], [0.91 * W, 0.9 * h * c, 0.8], [W + 0.75 * b, 0.64 * h, 0.56], [W + b, 0.3 * h, 0.28], [W, 0, 0]];
    for (const [w, y, v] of sec) { const ww = (w - W / 2) * kw; pos.push(P(u, W / 2 + ww, y * kh)); uvs.push([(u0 + u + e * (Math.abs(ww) + 0.45 * ww)) / 1.4, v]); }
  }
  // The two ends, closed by a fan from a point a little proud of the last section (and one at the middle of its foot).
  const tri = [], M = st.length, caps = [[0, -1, round[0]], [M - 1, 1, round[1]]];
  for (const [row, s, rnd] of caps) { const [u, , kh] = st[row], d = s * (rnd ? Rr * 0.14 : 0); pos.push(P(u + d, W / 2, 0.45 * h * kh), P(u + d * 0.6, W / 2, 0)); uvs.push([(u0 + u) / 1.4, 0.32], [(u0 + u) / 1.4, 0]); }
  for (let i = 0; i < M - 1; i++) for (let k = 0; k < NP - 1; k++) { const a = i * NP + k, b = a + NP; tri.push([a, b, b + 1], [a, b + 1, a + 1]); }
  caps.forEach(([row], j) => { const ci = M * NP + 2 * j, r0 = row * NP; for (let k = 0; k < NP - 1; k++) tri.push([ci, r0 + k, r0 + k + 1]); tri.push([ci, r0 + NP - 1, ci + 1], [ci, ci + 1, r0]); });
  // Every face turned outward (judged from a point on its spine), then normals smoothed over the faces round each corner.
  const nrm = pos.map(() => [0, 0, 0]), lo = Math.min(L / 2, 0.5), hi = Math.max(L / 2, L - 0.5);
  for (const t of tri) {
    const [A, B, C] = t.map(i => pos[i]), e1 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], e2 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
    const g = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3, (A[2] + B[2] + C[2]) / 3], sp = P(Math.min(hi, Math.max(lo, alongX ? g[0] - x0 : g[2] - z0)), W / 2, 0.4 * h);
    if (nx * (g[0] - sp[0]) + ny * (g[1] - sp[1]) + nz * (g[2] - sp[2]) < 0) { [t[1], t[2]] = [t[2], t[1]]; nx = -nx; ny = -ny; nz = -nz; }
    for (const i of t) { nrm[i][0] += nx; nrm[i][1] += ny; nrm[i][2] += nz; }
  }
  const base = geo.p.length / 3;
  pos.forEach((p, i) => { const q = nrm[i], l = Math.hypot(q[0], q[1], q[2]) || 1; geo.p.push(...p); geo.n.push(q[0] / l, q[1] / l, q[2] / l); geo.uv.push(...uvs[i]); if (geo.col) geo.c.push(...geo.col); });
  for (const t of tri) geo.idx.push(base + t[0], base + t[1], base + t[2]);
}

// ------------------------------------------------------------------- trees
// A card of twigs: a spray of fine branching, every stroke of it with snow lying along its upper side.
function twigTexture(seed, radial) {
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'), r = rng(seed);
  c.lineCap = 'round';
  const grow = (x, y, a, len, w, depth) => {
    const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len;
    c.strokeStyle = '#1c1612'; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = 'rgba(244,248,255,.96)'; c.lineWidth = Math.max(1.1, w * 0.62); c.beginPath(); c.moveTo(x, y - w * 0.5); c.lineTo(x1, y1 - w * 0.5); c.stroke();      // the snow on it
    if (depth <= 0) return;
    const k = depth > 3 ? 2 : 2 + (r() < 0.55 ? 1 : 0);
    for (let i = 0; i < k; i++) grow(x1, y1, a + (r() - 0.5) * (radial ? 1.5 : 1.25) + (radial ? 0 : (-Math.PI / 2 - a) * 0.08 - Math.sign(Math.cos(a)) * -0.12), len * (0.62 + r() * 0.22), Math.max(0.9, w * 0.66), depth - 1);
  };
  if (radial) for (let i = 0; i < 9; i++) grow(S / 2, S / 2, i * 0.7 + r() * 0.3, 70 + r() * 26, 5, 5);
  else for (let i = 0; i < 7; i++) grow(S / 2 + (r() - 0.5) * 30, S - 4, -Math.PI / 2 + (i - 3) * 0.33 + (r() - 0.5) * 0.15, 105 + r() * 30, 6, 5);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
/**
 * One winter tree to be drawn many times: `wood` (trunk and boughs, with snow lying on the boughs, by vertex colour)
 * and `twigs` (the crown: crossed cards of fine branching). Unit-ish size: about 4.6 tall and 5 across before scaling.
 */
export function winterTree() {
  const parts = [], col = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  const BARK = [0.085, 0.07, 0.06], SNOW = [1.7, 1.76, 1.95];
  const limb = (len, r0, r1, x, y, z, rx, rz, snowOn = true) => {
    const mk = (k, lift) => { const g = new THREE.CylinderGeometry(r1 * k, r0 * k, len, 7); g.translate(0, len / 2, 0); g.rotateX(rx); g.rotateZ(rz); g.translate(x, y + lift, z); return g; };
    parts.push(col(mk(1, 0), BARK)); if (snowOn) parts.push(col(mk(0.72, r0 * 0.62), SNOW));
  };
  limb(1.7, 0.2, 0.15, 0, 0, 0, 0.03, -0.04, false);                                                  // a short stout trunk, forking low
  for (let i = 0; i < 5; i++) { const a = i * 1.26 + 0.4, tilt = 0.62 + (i % 2) * 0.2; limb(2.3 + (i % 3) * 0.3, 0.1, 0.035, 0, 1.55 + (i % 2) * 0.12, 0, Math.cos(a) * tilt, Math.sin(a) * tilt); }
  for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.9; limb(1.5, 0.045, 0.014, Math.sin(a) * 1.0, 2.7 + (i % 2) * 0.35, -Math.cos(a) * 1.0, Math.cos(a) * 1.05, Math.sin(a) * 1.05); }
  const wood = mergeGeometries(parts);
  const cards = [];
  for (let i = 0; i < 4; i++) { const g = new THREE.PlaneGeometry(5.4, 3.3); g.translate(0, 3.25, 0); g.rotateY(i * Math.PI / 4 + 0.2); cards.push(g); }
  for (const [y, tilt, s] of [[3.3, 0.1, 5.6], [3.95, -0.08, 4.6], [4.5, 0.05, 3.2]]) { const g = new THREE.PlaneGeometry(s, s); g.rotateX(-Math.PI / 2 + tilt); g.translate(0, y, 0); const uv = g.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setX(q, uv.getX(q) * 0.5 + 0.5); cards.push(g); }
  for (let i = 0; i < 4; i++) { const uv = cards[i].attributes.uv; for (let q = 0; q < uv.count; q++) uv.setX(q, uv.getX(q) * 0.5); }
  const twigs = mergeGeometries(cards);
  // One texture, two halves: the left a spray seen from the side, the right the crown seen from above.
  const S = 512, cv = document.createElement('canvas'); cv.width = S * 2; cv.height = S; const c = cv.getContext('2d');
  c.drawImage(twigTexture(411, false).image, 0, 0); c.drawImage(twigTexture(733, true).image, S, 0);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return {
    wood, twigs,
    woodMat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, emissive: new THREE.Color(0.035, 0.035, 0.045), emissiveIntensity: 1 }),
    twigMat: new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.35, side: THREE.DoubleSide, color: new THREE.Color(0.8, 0.84, 0.98) }),
  };
}
