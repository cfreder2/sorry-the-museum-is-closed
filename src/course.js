// The race course: one line round the ring of galleries that a toy can really drive.
//
// The doorways come from the plan (ringSteps, in src/plan.js); everything between them is laid on
// what is actually there. The floor of the racing level is cut into a grid; a cell is open only
// if it lies in a room or a doorway on that level, on that level's floor, and clear of every wall,
// column, case, bench, lift shaft and stair. Each cell knows how far it is from the nearest solid
// thing. From one doorway to the next the line takes the cheapest way over the grid, where
// cheap is short but well clear of things; it goes square through the middle of each doorway; and
// then it is eased into curves, never letting a point come nearer anything solid than it was.
// The jumps put on the racing line (plan `line` surfaces) are open only along their own axis, so
// the line takes them straight or not at all.
//
// Pure geometry, no three.js: the same module is what the tests check the course with.

import { groundAt, wallAt, ceilingAt, confine, ringSteps, STEP } from './plan.js';

const C = 0.25;          // grid cell, metres
const KEEP = 0.8;        // clearance the line tries to keep from anything solid
const LEAST = 0.4;       // and never less than this, anywhere (a car is 0.19 round)
const LEAD = 0.6;        // how far either side of a doorway the line runs straight through it
const HIGH = 2.0;        // things up to this far above the floor are in the way (the drone flies below it)

export function buildCourse(plan) {
  const was = plan.racing;
  plan.racing = true;                // what is there in a race: the jumps on the line, not the rest of the kit
  try { return build(plan); } finally { plan.racing = was; }
}

function build(plan) {
  const fy = plan.lineY || 0, steps = ringSteps(plan);
  const level = y => Math.abs(y - fy) < 0.05;
  // ---- the grid ----
  let X0 = Infinity, X1 = -Infinity, Z0 = Infinity, Z1 = -Infinity;
  for (const s of steps) { const r = plan.byId[s.room]; X0 = Math.min(X0, r.x0); X1 = Math.max(X1, r.x1); Z0 = Math.min(Z0, r.z0); Z1 = Math.max(Z1, r.z1); }
  X0 -= 3; Z0 -= 3; X1 += 3; Z1 += 3;
  const nx = Math.ceil((X1 - X0) / C), nz = Math.ceil((Z1 - Z0) / C), N = nx * nz;
  const open = new Uint8Array(N), jump = new Uint8Array(N);
  const span = (a0, a1, o, n) => [Math.max(0, Math.floor((a0 - o) / C)), Math.min(n - 1, Math.ceil((a1 - o) / C) - 1)];
  const centres = (a0, a1, o, n) => [Math.max(0, Math.ceil((a0 - o) / C - 0.5)), Math.min(n - 1, Math.floor((a1 - o) / C - 0.5))];
  const fill = (x0, x1, z0, z1, v, arr = open, whole = true) => {
    const [i0, i1] = (whole ? span : centres)(x0, x1, X0, nx), [j0, j1] = (whole ? span : centres)(z0, z1, Z0, nz);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) arr[j * nx + i] = v;
  };
  // Open: every room and doorway whose floor is this level (a cell whose middle is in one).
  for (const b of plan.boxes) if (!b.fly && !b.lock && !b.hidden && level(b.y0)) fill(b.x0, b.x1, b.z0, b.z1, 1, open, false);
  // Shut: anything standing on it (any cell it touches at all).
  for (const o of plan.obstacles) if (!o.kit && o.y1 >= fy && o.y0 < fy + HIGH && o.x1 > X0 && o.x0 < X1 && o.z1 > Z0 && o.z0 < Z1) fill(o.x0, o.x1, o.z0, o.z1, 0);
  for (const l of plan.lifts) if (l.stops[0] - 0.3 < fy + HIGH && l.stops[l.stops.length - 1] + 2.7 > fy) fill(l.x0 - 0.1, l.x1 + 0.1, l.z0 - 0.1, l.z1 + 0.1, 0);
  for (const q of plan.ramps) if (Math.min(q.y0, q.y1) < fy + HIGH && Math.max(q.y0, q.y1) > fy - 0.1) fill(q.x0, q.x1, q.z0, q.z1, 0);
  // The pieces of kit left out for a race: plain blocks are shut; a jump on the line only down its middle, end to end.
  const line = [];
  for (const s of plan.surfaces) {
    if (s.hill || s.roof || s.x1 < X0 || s.x0 > X1 || s.z1 < Z0 || s.z0 > Z1) continue;
    if (!s.line && s.skin !== 'bench' && !s.fixed) continue;
    const top = Math.max(s.h0, s.h1), bot = s.thick ? top - s.thick : s.base || 0;
    if (top <= fy + 0.02 || bot >= fy + HIGH) continue;
    if (s.line) line.push(s); else fill(s.x0, s.x1, s.z0, s.z1, 0);
  }
  const jumps = jumpsOf(line);
  for (const J of jumps) {
    fill(J.x0, J.x1, J.z0, J.z1, 0);
    const m = Math.max(0.1, (J.ax === 'x' ? J.z1 - J.z0 : J.x1 - J.x0) / 2 - 0.45);
    const c = J.ax === 'x' ? (J.z0 + J.z1) / 2 : (J.x0 + J.x1) / 2;
    // (Open a cell past each end too, so the way on is not sealed by a cell the foot of the ramp only clips.)
    if (J.ax === 'x') { fill(J.x0 - C, J.x1 + C, c - m, c + m, 1, open, false); fill(J.x0, J.x1, c - m, c + m, 1, jump, false); }
    else { fill(c - m, c + m, J.z0 - C, J.z1 + C, 1, open, false); fill(c - m, c + m, J.z0, J.z1, 1, jump, false); }
  }
  // And what the floor itself says: a hole, a well, a step, a fixed piece too tall to climb. (Asked of a copy of
  // the plan holding only what is on or near this level: asking of the whole building, cell by cell, took seconds.)
  const lvl = { ...plan, floors: plan.floors.filter(f => f.y > fy - 1 && f.y < fy + 0.3 && f.x1 > X0 && f.x0 < X1 && f.z1 > Z0 && f.z0 < Z1),
    surfaces: plan.surfaces.filter(s => s.x1 > X0 && s.x0 < X1 && s.z1 > Z0 && s.z0 < Z1 && Math.max(s.h0, s.h1) > fy - 1 && (s.line || s.skin === 'bench' || s.fixed || s.roof) && !s.hill), roofs: [] };
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i;
    if (!open[k] || jump[k]) continue;
    const x = X0 + (i + 0.5) * C, z = Z0 + (j + 0.5) * C;
    if (Math.abs(groundAt(lvl, x, z, fy + 0.05) - fy) > 0.03 || wallAt(lvl, x, z, fy)) open[k] = 0;
  }
  // How far each open cell is from the nearest shut one (to its edge, near enough).
  const dist = new Float32Array(N).fill(99);
  for (let k = 0; k < N; k++) if (!open[k]) dist[k] = 0;
  const D1 = C, D2 = C * Math.SQRT2;
  const relax = (k, i, j, di, dj, w) => { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= nz) { if (w + C / 2 < dist[k]) dist[k] = C / 2; return; } const v = dist[b * nx + a] + w; if (v < dist[k]) dist[k] = v; };
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (!open[k]) continue; relax(k, i, j, -1, 0, D1); relax(k, i, j, 0, -1, D1); relax(k, i, j, -1, -1, D2); relax(k, i, j, 1, -1, D2); }
  for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { const k = j * nx + i; if (!open[k]) continue; relax(k, i, j, 1, 0, D1); relax(k, i, j, 0, 1, D1); relax(k, i, j, 1, 1, D2); relax(k, i, j, -1, 1, D2); }
  const clr = new Float32Array(N);
  for (let k = 0; k < N; k++) clr[k] = open[k] ? dist[k] - C / 2 : -C / 2;
  // Clearance at any point: the grid, interpolated.
  const room = (x, z) => {
    const fx = (x - X0) / C - 0.5, fz = (z - Z0) / C - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    if (i < 0 || j < 0 || i + 1 >= nx || j + 1 >= nz) return -1;
    const k = j * nx + i;
    return (clr[k] * (1 - u) + clr[k + 1] * u) * (1 - v) + (clr[k + nx] * (1 - u) + clr[k + nx + 1] * u) * v;
  };
  const cellOf = (x, z) => [Math.max(0, Math.min(nx - 1, Math.floor((x - X0) / C))), Math.max(0, Math.min(nz - 1, Math.floor((z - Z0) / C)))];
  const onJump = (x, z) => { const [i, j] = cellOf(x, z); return !!jump[j * nx + i]; };

  // ---- through each doorway: square on, down the middle ----
  const doors = steps.map(({ room: id, door: d }) => {
    const r = plan.byId[id], cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2;
    const ax = d.along === 'x' ? [1, 0] : [0, 1], deep = (d.along === 'x' ? d.x1 - d.x0 : d.z1 - d.z0) / 2;
    const sg = Math.sign(d.along === 'x' ? (r.x0 + r.x1) / 2 - cx : (r.z0 + r.z1) / 2 - cz) || 1;
    const n = [ax[0] * sg, ax[1] * sg], off = deep + LEAD;
    return { d, room: r, x: cx, z: cz, n, half: (d.along === 'z' ? d.x1 - d.x0 : d.z1 - d.z0) / 2, A: { x: cx - n[0] * off, z: cz - n[1] * off }, B: { x: cx + n[0] * off, z: cz + n[1] * off } };
  });

  // ---- across each room: the cheapest way over the grid, pulled tight ----
  const across = (r, a, b) => {
    const inRoom = k => { const i = k % nx, j = (k - i) / nx, x = X0 + (i + 0.5) * C, z = Z0 + (j + 0.5) * C; return x > r.x0 - 0.7 && x < r.x1 + 0.7 && z > r.z0 - 0.7 && z < r.z1 + 0.7; };
    const near = p => { const [ci, cj] = cellOf(p.x, p.z); let best = -1, bd = Infinity; for (let rr = 0; rr < 8 && best < 0; rr++) for (let j = cj - rr; j <= cj + rr; j++) for (let i = ci - rr; i <= ci + rr; i++) { if (i < 0 || j < 0 || i >= nx || j >= nz) continue; const k = j * nx + i; if (!open[k] || clr[k] < LEAST * 0.5) continue; const d = (i - ci) ** 2 + (j - cj) ** 2; if (d < bd) { bd = d; best = k; } } return best; };
    const A = near(a), B = near(b);
    if (A < 0 || B < 0) return [];
    const pen = k => { if (jump[k]) return -0.3; const c = clr[k]; return c >= KEEP + 0.1 ? 0 : c < LEAST - 0.05 ? 40 : ((KEEP + 0.1 - c) / (KEEP + 0.1)) ** 2 * 9; };
    const cost = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), done = new Uint8Array(N), heap = [[0, A]];
    cost[A] = 0; from[A] = A;
    const bi = B % nx, bj = (B - bi) / nx;
    const push = e => { let i = heap.push(e) - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, rr = l + 1; let s = i; if (l < heap.length && heap[l][0] < heap[s][0]) s = l; if (rr < heap.length && heap[rr][0] < heap[s][0]) s = rr; if (s === i) break; [heap[s], heap[i]] = [heap[i], heap[s]]; i = s; } } return top; };
    while (heap.length) {
      const [, u] = pop(); if (done[u]) continue; done[u] = 1; if (u === B) break;
      const ui = u % nx, uj = (u - ui) / nx;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const i = ui + di, j = uj + dj;
        if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
        const v = j * nx + i;
        if (done[v] || !open[v] || !inRoom(v) || (di && dj && (!open[uj * nx + i] || !open[j * nx + ui]))) continue;
        // (Onto a jump or off one only along its length: never over its side.)
        if (jump[v] !== jump[u] && di && dj) continue;
        const c = cost[u] + (di && dj ? Math.SQRT2 : 1) * C * (1 + pen(v));
        if (c < cost[v]) { cost[v] = c; from[v] = u; push([c + Math.hypot(i - bi, j - bj) * C * 0.7, v]); }
      }
    }
    if (from[B] < 0) return [];
    const cells = [];
    for (let u = B; u !== A; u = from[u]) cells.unshift(u);
    cells.unshift(A);
    const pts = cells.map(u => ({ x: X0 + (u % nx + 0.5) * C, z: Z0 + (Math.floor(u / nx) + 0.5) * C, c: clr[u], j: jump[u] }));
    // Pull the string tight wherever the straight line keeps as clear as the way round did.
    const lineMin = (p, q) => { const n = Math.max(1, Math.ceil(Math.hypot(q.x - p.x, q.z - p.z) / (C * 0.5))); let mn = 99; for (let k = 0; k <= n; k++) { const x = p.x + (q.x - p.x) * k / n, z = p.z + (q.z - p.z) * k / n, [i, j] = cellOf(x, z), c = j * nx + i; if (!open[c]) return -1; if (p.j && q.j && !jump[c]) return -1; mn = Math.min(mn, clr[c]); } return mn; };
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1;) {
      let best = i + 1, run = pts[i].c;
      const mins = [run]; for (let j = i + 1; j < pts.length; j++) { run = Math.min(run, pts[j].c); mins.push(run); }
      for (let j = pts.length - 1; j > i + 1; j--) if (lineMin(pts[i], pts[j]) >= Math.min(KEEP, mins[j - i]) - 0.02) { best = j; break; }
      out.push(pts[best]); i = best;
    }
    return out.slice(1, -1);
  };

  // ---- the whole lap, then eased into curves ----
  let P = [];
  doors.forEach((D, k) => {
    const E = doors[(k + 1) % doors.length];
    P.push({ x: D.A.x, z: D.A.z }, { x: D.x, z: D.z }, { x: D.B.x, z: D.B.z });
    for (const q of across(D.room, D.B, E.A)) P.push({ x: q.x, z: q.z });
  });
  const resample = (pts, step) => {
    const out = [], n = pts.length;
    let carry = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n], len = Math.hypot(b.x - a.x, b.z - a.z);
      if (len < 1e-6) continue;
      let s = carry;
      for (; s < len; s += step) out.push({ x: a.x + (b.x - a.x) * s / len, z: a.z + (b.z - a.z) * s / len });
      carry = s - len;
    }
    return out;
  };
  P = resample(P, C);
  for (let round = 0; round < 12; round++) {
    for (let it = 0; it < 16; it++) {
      const n = P.length;
      for (let i = 0; i < n; i++) {
        const p = P[i], a = P[(i + n - 1) % n], b = P[(i + 1) % n];
        const x = p.x * 0.5 + (a.x + b.x) * 0.25, z = p.z * 0.5 + (a.z + b.z) * 0.25;
        const was = room(p.x, p.z), now = room(x, z);
        if (now >= Math.min(was, KEEP) - 0.004 && now >= LEAST && onJump(x, z) === onJump(p.x, p.z)) { p.x = x; p.z = z; }
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
    pts[i].w = Math.max(0, room(pts[i].x, pts[i].z));
    pts[i].jump = onJump(pts[i].x, pts[i].z);
  }
  // The floor under it (up and over the jumps), and a flying height that clears every lintel.
  let g = fy;
  for (let pass = 0; pass < 2; pass++) for (const p of pts) { g = groundAt(plan, p.x, p.z, g + 0.15); p.g = g; }
  const lid = pts.map(p => Math.min(fy + 1.7, ceilingAt(plan, p.x, p.z, fy + 1) - 0.85));
  for (let i = 0; i < m; i++) { let lo = Infinity; for (let d = -8; d <= 8; d++) lo = Math.min(lo, lid[(i + d + m) % m]); pts[i].y = lo; }
  for (let it = 0; it < 6; it++) { const y = pts.map(p => p.y); for (let i = 0; i < m; i++) pts[i].y = Math.min(lid[i], (y[(i + m - 1) % m] + 2 * y[i] + y[(i + 1) % m]) / 4); }
  // The ribbon's half-width: as wide as the room allows, up to a metre, and changing gently.
  const hw = pts.map(p => Math.max(0.3, Math.min(1.0, p.w - 0.2)));
  for (let i = 0; i < m; i++) { let lo = Infinity; for (let d = -3; d <= 3; d++) lo = Math.min(lo, hw[(i + d + m) % m]); pts[i].hw = lo; }
  for (let it = 0; it < 4; it++) { const h = pts.map(p => p.hw); for (let i = 0; i < m; i++) pts[i].hw = Math.min(hw[i], (h[(i + m - 1) % m] + 2 * h[i] + h[(i + 1) % m]) / 4); }
  const length = m * step;

  // ---- checkpoints: one in each doorway, and the start line on the straightest, widest stretch ----
  const nearest = (x, z) => { let bi = 0, bd = Infinity; for (let i = 0; i < m; i++) { const d = (pts[i].x - x) ** 2 + (pts[i].z - z) ** 2; if (d < bd) { bd = d; bi = i; } } return bi; };
  const gates = doors.map(D => { const i = nearest(D.x, D.z); return { i, x: D.x, z: D.z, tx: D.n[0], tz: D.n[1], half: D.half, door: D.d }; });
  const W = i => pts[(i + m) % m];
  let start = -1, score = -Infinity;
  for (let i = 0; i < m; i++) {
    if (gates.some(G => { const d = Math.abs(G.i - i); return Math.min(d, m - d) * step < 5; })) continue;
    let lo = Infinity, bend = 0, jumpy = false;
    for (let d = -16; d <= 4; d++) { const q = W(i + d); lo = Math.min(lo, q.w); bend = Math.max(bend, q.k); jumpy = jumpy || q.jump; }
    if (jumpy) continue;
    const sc = Math.min(lo, 1.4) * 3 - bend * 20;
    if (sc > score) { score = sc; start = i; }
  }
  gates.push({ i: start, x: pts[start].x, z: pts[start].z, tx: pts[start].tx, tz: pts[start].tz, half: Math.min(2.4, pts[start].w + 0.3), start: true });
  gates.sort((a, b) => a.i - b.i);
  for (const G of gates) { const q = pts[G.i]; G.s = G.i * step; G.y = q.y; G.g = q.g; }
  return { pts, step, length, gates, fy, jumps };
}

// Pieces of a jump on the line, gathered into whole jumps: each a footprint and the axis it is taken along.
function jumpsOf(line) {
  const groups = [];
  for (const s of line) {
    const touching = groups.filter(G => s.x0 < G.x1 + 0.05 && s.x1 > G.x0 - 0.05 && s.z0 < G.z1 + 0.05 && s.z1 > G.z0 - 0.05);
    const G = { x0: s.x0, x1: s.x1, z0: s.z0, z1: s.z1, ax: s.axis || null };
    for (const o of touching) { G.x0 = Math.min(G.x0, o.x0); G.x1 = Math.max(G.x1, o.x1); G.z0 = Math.min(G.z0, o.z0); G.z1 = Math.max(G.z1, o.z1); G.ax = G.ax || o.ax; groups.splice(groups.indexOf(o), 1); }
    groups.push(G);
  }
  for (const G of groups) if (!G.ax) G.ax = G.x1 - G.x0 > G.z1 - G.z0 ? 'x' : 'z';
  return groups;
}

// Is every bit of the line somewhere a toy of radius r can be? Walked every 10 cm: nothing moves
// it (walls, doorways, furniture), nothing too tall to climb stands in its footprint, and (on
// wheels) the floor never jumps up or drops away under it. Returns the places it fails.
export function checkCourse(plan, course, { r = 0.2, flying = false } = {}) {
  const was = plan.racing;
  plan.racing = true;
  const bad = [], out = { x: 0, y: 0, z: 0 }, P = course.pts, n = P.length, sub = Math.round(course.step / 0.1);
  let g = null;
  try {
    for (let i = 0; i <= n; i++) for (let k = 0; k < sub; k++) {
      if (i === n && k) break;
      const a = P[i % n], b = P[(i + 1) % n], t = k / sub;
      const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, y = flying ? a.y + (b.y - a.y) * t : null;
      const why = [];
      let h = y;
      if (!flying) {
        const ng = groundAt(plan, x, z, (g ?? course.fy) + STEP);
        if (g != null && Math.abs(ng - g) > STEP) why.push(`floor ${(ng - g).toFixed(2)}`);
        g = ng; h = ng;
        for (let q = 0; q < 8; q++) if (wallAt(plan, x + Math.sin(q * Math.PI / 4) * r, z + Math.cos(q * Math.PI / 4) * r, h)) { why.push('wall'); break; }
      } else if (wallAt(plan, x, z, h - 0.07, 0.06)) why.push('wall');
      const p = { x, y: h, z };
      if (confine(plan, p, r, flying, out) && Math.hypot(p.x - x, p.y - h, p.z - z) > 0.005) why.push(`pushed ${Math.hypot(p.x - x, p.y - h, p.z - z).toFixed(2)}`);
      if (!plan.boxes.some(B => !B.fly && !B.lock && !B.hidden && x > B.x0 && x < B.x1 && z > B.z0 && z < B.z1 && h > B.y0 - 0.3 && h < B.y1)) why.push('outside');
      if (why.length) bad.push({ i, x: +x.toFixed(2), z: +z.toFixed(2), y: +h.toFixed(2), why: why.join(' ') });
    }
  } finally { plan.racing = was; }
  return bad;
}
