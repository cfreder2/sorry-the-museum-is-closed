// A race course: one line round a loop that a toy car can really drive, laid on what is actually there.
//
// The floor of the course's area is cut into a grid, and every cell is asked what the car itself would be asked
// (the same probes, plan.js's groundAt, wallAt and confine): is there floor here at this level, is anything standing
// on it too tall to climb, would a car's middle here be pushed out of a wall, a doorway's jamb, a column, a case, a
// bench, a lift shaft? A cell is open only if the answers are floor, no and no, and the floor does not step up or
// drop away from its neighbours. Each open cell knows how far it is from the nearest shut one.
//
// From each waypoint to the next the line takes the cheapest way over the grid, where cheap is short but well clear
// of things; a doorway on the way is gone through square, down its middle; and the lap is then eased into curves,
// never letting a point come nearer anything solid than it was. Every waypoint is a checkpoint gate, and the first is
// the start and finish line.
//
// Pure geometry, no three.js: the same module is what tools/check_layout.mjs checks the courses with.

import { groundAt, wallAt, confine, STEP } from './plan.js';

const C = 0.25;          // grid cell, metres
const KEEP = 0.8;        // clearance the line tries to keep from anything solid
const LEAST = 0.4;       // and never less than this, anywhere (a car is 0.19 round)
const LEAD = 0.6;        // how far either side of a doorway the line runs straight through it
const START = 1.6;       // and either side of the start line

// What of the plan is in or near an area: asking the whole museum cell by cell would take seconds.
function local(plan, A, pad = 3) {
  const near = q => q.x1 > A.x0 - pad && q.x0 < A.x1 + pad && q.z1 > A.z0 - pad && q.z0 < A.z1 + pad;
  return { ...plan, boxes: plan.boxes.filter(near), obstacles: plan.obstacles.filter(near), surfaces: plan.surfaces.filter(near), floors: plan.floors.filter(near),
    masses: plan.masses.filter(near), roofs: (plan.roofs || []).filter(near), slabs: (plan.slabs || []).filter(near), wells: (plan.wells || []).filter(near), pits: (plan.pits || []).filter(near) };
}

// The drivable floor of an area at level fy: { X0, Z0, nx, nz, C, fy, open, clr, g } (clr: metres to the nearest shut
// cell; g: the floor's height in each cell). `avoid`: boxes kept out of as well (a road with traffic on it).
export function floorGrid(plan, area, fy, avoid = []) {
  const X0 = area.x0, Z0 = area.z0, nx = Math.ceil((area.x1 - area.x0) / C), nz = Math.ceil((area.z1 - area.z0) / C), N = nx * nz;
  const L = local(plan, area), open = new Uint8Array(N), g = new Float32Array(N), p = { x: 0, y: 0, z: 0 }, out = { x: 0, y: 0, z: 0 };
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i, x = X0 + (i + 0.5) * C, z = Z0 + (j + 0.5) * C;
    if (avoid.some(q => x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1)) continue;
    const h = groundAt(L, x, z, fy + 0.05);
    g[k] = h;
    if (Math.abs(h - fy) > 0.45 || wallAt(L, x, z, h)) continue;
    p.x = x; p.y = h; p.z = z;
    if (confine(L, p, 0.16, false, out) && Math.hypot(p.x - x, p.z - z) > 0.003) continue;      // (a little wide: the clearance below is only good to a cell)
    open[k] = 1;
  }
  // A step up or down between neighbours (a kerb, the lip of a pool, a hump too steep) shuts both sides of it.
  const shut = new Uint8Array(N);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i; if (!open[k]) continue;
    if (i + 1 < nx && open[k + 1] && Math.abs(g[k + 1] - g[k]) > 0.05) shut[k] = shut[k + 1] = 1;
    if (j + 1 < nz && open[k + nx] && Math.abs(g[k + nx] - g[k]) > 0.05) shut[k] = shut[k + nx] = 1;
  }
  for (let k = 0; k < N; k++) if (shut[k]) open[k] = 0;
  // How far each open cell is from the nearest shut one (to its edge, near enough).
  const dist = new Float32Array(N).fill(99);
  for (let k = 0; k < N; k++) if (!open[k]) dist[k] = 0;
  const D1 = C, D2 = C * Math.SQRT2;
  const relax = (k, i, j, di, dj, w) => { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= nz) { if (w + C / 2 < dist[k]) dist[k] = C / 2; return; } const v = dist[b * nx + a] + w; if (v < dist[k]) dist[k] = v; };
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (!open[k]) continue; relax(k, i, j, -1, 0, D1); relax(k, i, j, 0, -1, D1); relax(k, i, j, -1, -1, D2); relax(k, i, j, 1, -1, D2); }
  for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { const k = j * nx + i; if (!open[k]) continue; relax(k, i, j, 1, 0, D1); relax(k, i, j, 0, 1, D1); relax(k, i, j, 1, 1, D2); relax(k, i, j, -1, 1, D2); }
  const clr = new Float32Array(N);
  for (let k = 0; k < N; k++) clr[k] = open[k] ? dist[k] - C / 2 : -C / 2;
  return { X0, Z0, nx, nz, N, C, fy, open, clr, g };
}

// spec: { fy, area: { x0, x1, z0, z1 }, way: [...], avoid? }. A waypoint is [x, z] (a gate), [x, z, 'via'] (only to
// shape the line), or { door } (a doorway of the plan, gone through square; a gate). The first is the start line.
export function layCourse(plan, spec) {
  const fy = spec.fy, G = floorGrid(plan, spec.area, fy, spec.avoid || []);
  const { X0, Z0, nx, nz, N, open, clr } = G;
  const room = (x, z) => {
    const fx = (x - X0) / C - 0.5, fz = (z - Z0) / C - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    if (i < 0 || j < 0 || i + 1 >= nx || j + 1 >= nz) return -1;
    const k = j * nx + i;
    return (clr[k] * (1 - u) + clr[k + 1] * u) * (1 - v) + (clr[k + nx] * (1 - u) + clr[k + nx + 1] * u) * v;
  };
  const cellOf = (x, z) => [Math.max(0, Math.min(nx - 1, Math.floor((x - X0) / C))), Math.max(0, Math.min(nz - 1, Math.floor((z - Z0) / C)))];

  // ---- the waypoints, each doorway turned into the two points either side of it ----
  const W = spec.way.map(w => (Array.isArray(w) ? { x: w[0], z: w[1], gate: w[2] !== 'via' } : (() => { const d = w.door; return { x: (d.x0 + d.x1) / 2, z: (d.z0 + d.z1) / 2, gate: true, door: d }; })()));
  const pts0 = [];          // { x, z, gate?, straight? }: the line's skeleton, in order
  W.forEach((w, k) => {
    // The start line is gone through straight, along the way to the next point, so whatever stands either side of it
    // (an arch) stands either side of the line.
    if (k === 0 && !w.door) {
      const b = W[1], l = Math.hypot(b.x - w.x, b.z - w.z) || 1, fx = (b.x - w.x) / l, fz = (b.z - w.z) / l;
      w.n = [fx, fz];
      pts0.push({ x: w.x - fx * START, z: w.z - fz * START, straight: true }, { x: w.x, z: w.z, gate: true, w, straight: true }, { x: w.x + fx * START, z: w.z + fz * START, straight: true });
      return;
    }
    if (!w.door) { pts0.push({ x: w.x, z: w.z, gate: w.gate, w }); return; }
    const d = w.door, a = W[(k + W.length - 1) % W.length], ax = d.along === 'x' ? 1 : 0, az = 1 - ax;
    const sg = Math.sign(ax ? w.x - a.x : w.z - a.z) || 1, deep = (ax ? d.x1 - d.x0 : d.z1 - d.z0) / 2 + LEAD;
    w.n = [ax * sg, az * sg]; w.half = (ax ? d.z1 - d.z0 : d.x1 - d.x0) / 2;
    pts0.push({ x: w.x - w.n[0] * deep, z: w.z - w.n[1] * deep, straight: true }, { x: w.x, z: w.z, gate: true, w, straight: true }, { x: w.x + w.n[0] * deep, z: w.z + w.n[1] * deep, straight: true });
  });

  // ---- from each point to the next: the cheapest way over the grid, pulled tight ----
  const nearCell = p => { const [ci, cj] = cellOf(p.x, p.z); let best = -1, bd = Infinity; for (let rr = 0; rr < 10 && best < 0; rr++) for (let j = cj - rr; j <= cj + rr; j++) for (let i = ci - rr; i <= ci + rr; i++) { if (i < 0 || j < 0 || i >= nx || j >= nz) continue; const k = j * nx + i; if (!open[k] || clr[k] < LEAST * 0.5) continue; const d = (i - ci) ** 2 + (j - cj) ** 2; if (d < bd) { bd = d; best = k; } } return best; };
  const pen = k => { const c = clr[k]; return c >= KEEP + 0.1 ? 0 : c < LEAST - 0.05 ? 40 : ((KEEP + 0.1 - c) / (KEEP + 0.1)) ** 2 * 9; };
  const cost = new Float32Array(N), from = new Int32Array(N), done = new Uint8Array(N);
  const leg = (a, b) => {
    const A = nearCell(a), B = nearCell(b);
    if (A < 0 || B < 0) throw new Error(`course ${spec.id}: no floor at (${(A < 0 ? a : b).x.toFixed(1)}, ${(A < 0 ? a : b).z.toFixed(1)})`);
    cost.fill(Infinity); from.fill(-1); done.fill(0);
    const heap = [[0, A]]; cost[A] = 0; from[A] = A;
    const bi = B % nx, bj = (B - bi) / nx;
    const push = e => { let i = heap.push(e) - 1; while (i > 0) { const q = (i - 1) >> 1; if (heap[q][0] <= heap[i][0]) break; [heap[q], heap[i]] = [heap[i], heap[q]]; i = q; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let s = i; if (l < heap.length && heap[l][0] < heap[s][0]) s = l; if (r < heap.length && heap[r][0] < heap[s][0]) s = r; if (s === i) break; [heap[s], heap[i]] = [heap[i], heap[s]]; i = s; } } return top; };
    while (heap.length) {
      const [, u] = pop(); if (done[u]) continue; done[u] = 1; if (u === B) break;
      const ui = u % nx, uj = (u - ui) / nx;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const i = ui + di, j = uj + dj;
        if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
        const v = j * nx + i;
        if (done[v] || !open[v] || (di && dj && (!open[uj * nx + i] || !open[j * nx + ui]))) continue;
        const c = cost[u] + (di && dj ? Math.SQRT2 : 1) * C * (1 + pen(v));
        if (c < cost[v]) { cost[v] = c; from[v] = u; push([c + Math.hypot(i - bi, j - bj) * C * 0.7, v]); }
      }
    }
    if (from[B] < 0) throw new Error(`course ${spec.id}: no way from (${a.x.toFixed(1)}, ${a.z.toFixed(1)}) to (${b.x.toFixed(1)}, ${b.z.toFixed(1)})`);
    const cells = [];
    for (let u = B; u !== A; u = from[u]) cells.unshift(u);
    cells.unshift(A);
    const P = cells.map(u => ({ x: X0 + (u % nx + 0.5) * C, z: Z0 + (Math.floor(u / nx) + 0.5) * C, c: clr[u] }));
    const lineMin = (p, q) => { const n = Math.max(1, Math.ceil(Math.hypot(q.x - p.x, q.z - p.z) / (C * 0.5))); let mn = 99; for (let k = 0; k <= n; k++) { const [i, j] = cellOf(p.x + (q.x - p.x) * k / n, p.z + (q.z - p.z) * k / n), c = j * nx + i; if (!open[c]) return -1; mn = Math.min(mn, clr[c]); } return mn; };
    const out = [P[0]];
    for (let i = 0; i < P.length - 1;) {
      let best = i + 1, run = P[i].c;
      const mins = [run]; for (let j = i + 1; j < P.length; j++) { run = Math.min(run, P[j].c); mins.push(run); }
      for (let j = P.length - 1; j > i + 1; j--) if (lineMin(P[i], P[j]) >= Math.min(KEEP, mins[j - i]) - 0.02) { best = j; break; }
      out.push(P[best]); i = best;
    }
    return out.slice(1, -1);
  };
  let P = [];
  pts0.forEach((p, k) => {
    const q = pts0[(k + 1) % pts0.length];
    P.push({ x: p.x, z: p.z, pin: !!p.straight });
    if (!(p.straight && q.straight)) for (const c of leg(p, q)) P.push({ x: c.x, z: c.z });
  });

  // ---- the whole lap, eased into curves (the doorways stay put) ----
  const resample = (pts, step) => {
    const out = [], n = pts.length;
    let carry = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n], len = Math.hypot(b.x - a.x, b.z - a.z);
      if (len < 1e-6) continue;
      let s = carry;
      const pin = a.pin && b.pin;
      for (; s < len; s += step) out.push({ x: a.x + (b.x - a.x) * s / len, z: a.z + (b.z - a.z) * s / len, pin });
      carry = s - len;
    }
    return out;
  };
  P = resample(P, C);
  for (let round = 0; round < 12; round++) {
    for (let it = 0; it < 16; it++) {
      const n = P.length;
      for (let i = 0; i < n; i++) {
        const p = P[i]; if (p.pin) continue;
        const a = P[(i + n - 1) % n], b = P[(i + 1) % n];
        const x = p.x * 0.5 + (a.x + b.x) * 0.25, z = p.z * 0.5 + (a.z + b.z) * 0.25;
        const was = room(p.x, p.z), now = room(x, z);
        if (now >= Math.min(was, KEEP) - 0.004 && now >= LEAST) { p.x = x; p.z = z; }
      }
    }
    P = resample(P, C);
  }

  // ---- stepped out every half metre, with all a driver needs to know at each point ----
  const step = 0.5;
  const pts = resample(P, step), m = pts.length;
  for (let i = 0; i < m; i++) {
    const a = pts[(i + m - 2) % m], b = pts[(i + 2) % m], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
    pts[i].tx = dx / l; pts[i].tz = dz / l;
  }
  for (let i = 0; i < m; i++) {
    const a = pts[(i + m - 3) % m], b = pts[(i + 3) % m];
    pts[i].k = Math.abs(a.tx * b.tz - a.tz * b.tx) / (6 * step);
    pts[i].turn = Math.sign(a.tx * b.tz - a.tz * b.tx);          // which way it bends (the cones go on the outside)
    pts[i].w = Math.max(0, room(pts[i].x, pts[i].z));
    delete pts[i].pin;
  }
  // The floor under it.
  let g = fy;
  for (let pass = 0; pass < 2; pass++) for (const p of pts) { g = groundAt(plan, p.x, p.z, g + 0.15); p.g = g; p.y = g; }
  // The ribbon's half-width: as wide as the floor allows, up to a metre, and changing gently.
  const hw = pts.map(p => Math.max(0.3, Math.min(1.0, p.w - 0.2)));
  for (let i = 0; i < m; i++) { let lo = Infinity; for (let d = -3; d <= 3; d++) lo = Math.min(lo, hw[(i + d + m) % m]); pts[i].hw = lo; }
  for (let it = 0; it < 4; it++) { const h = pts.map(p => p.hw); for (let i = 0; i < m; i++) pts[i].hw = Math.min(hw[i], (h[(i + m - 1) % m] + 2 * h[i] + h[(i + 1) % m]) / 4); }
  const length = m * step;

  // ---- the gates: one at each waypoint, the first the start line ----
  const nearest = (x, z) => { let bi = 0, bd = Infinity; for (let i = 0; i < m; i++) { const d = (pts[i].x - x) ** 2 + (pts[i].z - z) ** 2; if (d < bd) { bd = d; bi = i; } } return bi; };
  const gates = [];
  W.forEach((w, k) => {
    if (!w.gate) return;
    const i = nearest(w.x, w.z), q = pts[i];
    gates.push(w.door ? { i, x: w.x, z: w.z, tx: w.n[0], tz: w.n[1], half: w.half, door: w.door, start: k === 0 }
      : w.n ? { i, x: w.x, z: w.z, tx: w.n[0], tz: w.n[1], half: Math.min(2.4, q.w + 0.3), start: true }
      : { i, x: q.x, z: q.z, tx: q.tx, tz: q.tz, half: Math.min(2.4, q.w + 0.3), start: k === 0 });
  });
  for (const Gt of gates) { const q = pts[Gt.i]; Gt.s = Gt.i * step; Gt.y = q.y; Gt.g = q.g; }
  // Counted from the start line, so a lap begins at 0.
  const s0 = gates[0].s;
  gates.sort((a, b) => ((a.s - s0 + length) % length) - ((b.s - s0 + length) % length));
  return { id: spec.id, pts, step, length, gates, fy };
}

// Is every bit of the line somewhere a car of radius r can be? Walked every 10 cm: nothing moves it (walls, doorways,
// furniture, buildings), nothing too tall to climb stands in its footprint, and the floor never jumps up or drops away
// under it. Indoors (`inside`), it is in a room or a doorway all the way. Returns the places it fails.
export function checkCourse(plan, course, { r = 0.2, inside = false } = {}) {
  const bad = [], out = { x: 0, y: 0, z: 0 }, P = course.pts, n = P.length, sub = Math.round(course.step / 0.1);
  let g = null;
  for (let i = 0; i <= n; i++) for (let k = 0; k < sub; k++) {
    if (i === n && k) break;
    const a = P[i % n], b = P[(i + 1) % n], t = k / sub;
    const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
    const why = [];
    const ng = groundAt(plan, x, z, (g ?? course.fy) + STEP);
    if (g != null && Math.abs(ng - g) > STEP) why.push(`floor ${(ng - g).toFixed(2)}`);
    g = ng;
    for (let q = 0; q < 8; q++) if (wallAt(plan, x + Math.sin(q * Math.PI / 4) * r, z + Math.cos(q * Math.PI / 4) * r, g)) { why.push('wall'); break; }
    const p = { x, y: g, z };
    if (confine(plan, p, r, false, out) && Math.hypot(p.x - x, p.y - g, p.z - z) > 0.005) why.push(`pushed ${Math.hypot(p.x - x, p.y - g, p.z - z).toFixed(2)}`);
    if (inside && !plan.boxes.some(B => !B.fly && !B.lock && !B.hidden && !B.shut && x > B.x0 && x < B.x1 && z > B.z0 && z < B.z1 && g > B.y0 - 0.3 && g < B.y1)) why.push('outside');
    if (why.length) bad.push({ i, x: +x.toFixed(2), z: +z.toFixed(2), y: +g.toFixed(2), why: why.join(' ') });
  }
  return bad;
}
