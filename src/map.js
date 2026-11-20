// The map. In the corner, a round radar that turns with you, as in a driving game: the level you
// are on, you in the middle, whatever way you face at the top. Touch it (or press G) and the whole
// building opens, a level at a time. Pick a room there and the way to it lights up, on the big map
// and on the radar, across stairs and lifts if it is on another level.

const TAU = Math.PI * 2;
const near = (a, b, e = 0.7) => Math.abs(a - b) < e;

export function createMap(G, { radarEl, show, resume, say, THREE, scene, wallAt }) {
  const rc = radarEl.getContext('2d');
  const big = document.getElementById('bigmap'), bc = document.getElementById('bmCanvas'), bx = bc.getContext('2d');
  const state = { level: null, target: null, path: null, at: 0, fit: null, marks: [], zoom: 1, cx: null, cz: null };
  let nav = null;

  // ---- which level is which --------------------------------------------------
  const levels = () => Object.entries(G.plan.levels || { 1: 0 }).map(([name, y]) => ({ name, y })).sort((a, b) => a.y - b.y);
  const levelOf = y => { let best = null; for (const l of levels()) if (!best || Math.abs(l.y - y) < Math.abs(best.y - y)) best = l; return best; };
  const onLevel = (r, ly) => Math.abs(r.y - ly) < 0.7 || (r.y < ly && r.top > ly + 2.5);    // its floor is here, or it is a tall room rising through

  // What is on no drawing is on no map either, until it has been found (src/secret.js).
  const found = () => !!G.plan.secretOpen;
  const shown = r => !r || !r.secret || found();

  // ---- places, and the ways between them ----------------------------------
  // A place is somewhere you can stand: the floor of a room, a deck, or outdoors. A way joins two
  // places: a doorway, a flight of stairs, a lift. The route is the shortest chain of them.
  function placeAt(x, z, y) {
    const p = G.plan;
    for (const d of p.decks) if (near(d.y, y) && x >= d.x0 - 0.05 && x <= d.x1 + 0.05 && z >= d.z0 - 0.05 && z <= d.z1 + 0.05) return 'D' + d.id;
    for (const r of p.rooms) if (near(r.y, y) && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return 'R' + r.id;
    if (near(y, 0, 1) && !p.rooms.some(r => r.y < 1 && r.top > 0.5 && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1)) return 'OUT';
    return null;
  }
  function build() {
    const p = G.plan, nodes = [], adj = [], flights = [];
    const node = (x, y, z, place) => { nodes.push({ x, y, z, place }); adj.push([]); return nodes.length - 1; };
    const link = (a, b, cost, how) => { adj[a].push([b, cost, how]); adj[b].push([a, cost, how]); };
    const way = (A, B, cost, how) => { if (A.place && B.place && A.place !== B.place) link(node(A.x, A.y, A.z, A.place), node(B.x, B.y, B.z, B.place), cost, how); };
    for (const d of p.doors) {
      if (d.secret && !found()) continue;                 // no way through a wall that has not opened
      const cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2;
      const side = id => {
        if (id === 'out') return 'OUT';
        const r = p.byId[id]; if (!r) return null;
        if (near(r.y, d.y, 0.1)) return 'R' + id;
        const k = p.decks.find(k => k.room === id && near(k.y, d.y, 0.1) && k.x0 < d.x1 + 0.1 && k.x1 > d.x0 - 0.1 && k.z0 < d.z1 + 0.1 && k.z1 > d.z0 - 0.1);
        return k ? 'D' + k.id : null;
      };
      const P = place => ({ x: cx, y: d.y, z: cz, place });
      way(P(side(d.a)), P(side(d.b)), d.vent ? 3 : 0.5, 'door');
    }
    for (const q of p.ramps) {
      if (!shown(p.byId[q.room])) continue;
      // Up one side of a wide flight, not the middle: the middle of the Grand Staircase's landing has a kicker on it.
      const wide = q.axis === 'x' ? q.z1 - q.z0 : q.x1 - q.x0, c = (q.axis === 'x' ? (q.z0 + q.z1) / 2 : (q.x0 + q.x1) / 2) + (wide > 4.5 ? wide * 0.28 : 0), len = q.axis === 'x' ? q.x1 - q.x0 : q.z1 - q.z0;
      const lo = q.axis === 'x' ? { x: q.x0 - 0.4, z: c } : { x: c, z: q.z0 - 0.4 }, hi = q.axis === 'x' ? { x: q.x1 + 0.4, z: c } : { x: c, z: q.z1 + 0.4 };
      const n0 = nodes.length;
      way({ ...lo, y: q.y0, place: placeAt(lo.x, lo.z, q.y0) }, { ...hi, y: q.y1, place: placeAt(hi.x, hi.z, q.y1) }, len * 1.2, q.y1 > q.y0 ? 'up' : 'down');
      if (nodes.length === n0 + 2) flights.push({ q, lo: n0, hi: n0 + 1 });
    }
    for (const l of p.lifts) {
      const cx = (l.x0 + l.x1) / 2, cz = (l.z0 + l.z1) / 2, stops = [];
      for (const y of l.stops) for (const [x, z] of [[l.x0 - 0.5, cz], [l.x1 + 0.5, cz], [cx, l.z0 - 0.5], [cx, l.z1 + 0.5]]) { const place = placeAt(x, z, y); if (place) { stops.push({ x, y, z, place }); break; } }
      for (let i = 1; i < stops.length; i++) way(stops[i - 1], stops[i], 9, 'lift');
    }
    for (let i = 0; i < p.decks.length; i++) for (let j = i + 1; j < p.decks.length; j++) {
      const a = p.decks[i], b = p.decks[j];
      if (a.room !== b.room || !near(a.y, b.y, 0.1) || a.x0 > b.x1 + 0.05 || b.x0 > a.x1 + 0.05 || a.z0 > b.z1 + 0.05 || b.z0 > a.z1 + 0.05) continue;
      const x = (Math.max(a.x0, b.x0) + Math.min(a.x1, b.x1)) / 2, z = (Math.max(a.z0, b.z0) + Math.min(a.z1, b.z1)) / 2;
      way({ x, y: a.y, z, place: 'D' + a.id }, { x, y: a.y, z, place: 'D' + b.id }, 0.1, 'deck');
    }
    const byPlace = new Map();
    nodes.forEach((n, i) => { if (!byPlace.has(n.place)) byPlace.set(n.place, []); byPlace.get(n.place).push(i); });
    return { nodes, adj, byPlace, flights };
  }
  const walk = (a, b, place) => Math.hypot(a.x - b.x, a.z - b.z) * (place === 'OUT' ? 3 : 1);      // indoors for choice

  // Inside a room the way from one doorway to the next is not always a straight line: there may be
  // a desk, a case or a ramp in it. Each room gets a coarse grid of where a toy car can go, made
  // the first time it is needed, and a leg that would cross something is walked round it instead.
  const CELL = 0.4, grids = new Map();
  function gridOf(room) {
    if (grids.has(room.id)) return grids.get(room.id);
    const nx = Math.max(1, Math.ceil((room.x1 - room.x0) / CELL)), nz = Math.max(1, Math.ceil((room.z1 - room.z0) / CELL)), blocked = new Uint8Array(nx * nz), m = 0.22;
    const mark = (x0, x1, z0, z1) => { const i0 = Math.max(0, Math.floor((x0 - m - room.x0) / CELL)), i1 = Math.min(nx - 1, Math.floor((x1 + m - room.x0) / CELL)), j0 = Math.max(0, Math.floor((z0 - m - room.z0) / CELL)), j1 = Math.min(nz - 1, Math.floor((z1 + m - room.z0) / CELL)); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) blocked[j * nx + i] = 1; };
    for (const o of G.plan.obstacles) if (!o.gate && o.x1 > room.x0 && o.x0 < room.x1 && o.z1 > room.z0 && o.z0 < room.z1 && o.y0 < room.y + 0.3 && o.y1 > room.y + 0.04) mark(o.x0, o.x1, o.z0, o.z1);
    if (wallAt) for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (!blocked[j * nx + i] && wallAt(G.plan, room.x0 + (i + 0.5) * CELL, room.z0 + (j + 0.5) * CELL, room.y)) blocked[j * nx + i] = 1;
    const g = { nx, nz, blocked, room };
    grids.set(room.id, g);
    return g;
  }
  function around(room, a, b) {
    const g = gridOf(room), { nx, nz, blocked } = g;
    const cell = p => [Math.max(0, Math.min(nx - 1, Math.floor((p.x - room.x0) / CELL))), Math.max(0, Math.min(nz - 1, Math.floor((p.z - room.z0) / CELL)))];
    const clear = (p, q) => { const n = Math.ceil(Math.hypot(q.x - p.x, q.z - p.z) / (CELL * 0.5)); for (let k = 1; k < n; k++) { const [i, j] = cell({ x: p.x + (q.x - p.x) * k / n, z: p.z + (q.z - p.z) * k / n }); if (blocked[j * nx + i]) return false; } return true; };
    if (clear(a, b)) return null;
    // The nearest open cell to each end (a doorway's own cell may be shadowed by something beside it).
    const open = p => { const [ci, cj] = cell(p); for (let r = 0; r < 8; r++) for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) if (i >= 0 && j >= 0 && i < nx && j < nz && !blocked[j * nx + i]) return j * nx + i; return -1; };
    const A = open(a), B = open(b);
    if (A < 0 || B < 0) return null;
    const from = new Int32Array(nx * nz).fill(-1), queue = [A]; from[A] = A;
    for (let h = 0; h < queue.length && from[B] < 0; h++) {
      const u = queue[h], ui = u % nx, uj = (u - ui) / nx;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const i = ui + di, j = uj + dj;
        if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
        const v = j * nx + i;
        if (from[v] >= 0 || blocked[v] || (di && dj && (blocked[uj * nx + i] || blocked[j * nx + ui]))) continue;
        from[v] = u; queue.push(v);
      }
    }
    if (from[B] < 0) return null;
    const cells = [];
    for (let u = B; u !== A; u = from[u]) cells.unshift(u);
    const pts = [a, ...cells.map(u => ({ x: room.x0 + (u % nx + 0.5) * CELL, y: a.y, z: room.z0 + (Math.floor(u / nx) + 0.5) * CELL })), b];
    // Pull the string tight: keep only the corners.
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1;) { let j = pts.length - 1; while (j > i + 1 && !clear(pts[i], pts[j])) j--; out.push(pts[j]); i = j; }
    return out.slice(1, -1);
  }
  function refine(path) {
    const out = [];
    for (let k = 0; k < path.pts.length; k++) {
      const a = path.pts[k], b = path.pts[k + 1];
      out.push(a);
      if (!b || a.how || Math.abs(a.y - b.y) > 0.1) continue;
      const room = G.plan.rooms.find(r => near(r.y, a.y, 0.1) && a.x >= r.x0 - 0.6 && a.x <= r.x1 + 0.6 && a.z >= r.z0 - 0.6 && a.z <= r.z1 + 0.6 && b.x >= r.x0 - 0.6 && b.x <= r.x1 + 0.6 && b.z >= r.z0 - 0.6 && b.z <= r.z1 + 0.6);
      const via = room && around(room, a, b);
      if (via) out.push(...via);
    }
    path.pts = out;
    return path;
  }

  // The shortest way from one spot to another: a list of points, each with how you get to the next.
  function route(from, to) {
    if (!nav) nav = build();
    const { nodes, adj, byPlace } = nav, N = nodes.length, S = N, T = N + 1;
    let fp = placeAt(from.x, from.z, from.y), tp = to.place || placeAt(to.x, to.z, to.y);
    if (!tp) return null;
    // In the air or on a flight of stairs you are nowhere in particular: start from the nearest way.
    const startLinks = [];
    // Part-way up a flight, the ways on are its two ends, not the floor it started from.
    const on = nav.flights.find(f => from.x >= f.q.x0 && from.x <= f.q.x1 && from.z >= f.q.z0 && from.z <= f.q.z1 && from.y > Math.min(f.q.y0, f.q.y1) + 0.12 && from.y < Math.max(f.q.y0, f.q.y1) + 0.5);
    if (on) { for (const i of [on.lo, on.hi]) startLinks.push([i, Math.hypot(nodes[i].x - from.x, nodes[i].z - from.z) * 1.2]); fp = null; }
    else if (fp && byPlace.has(fp)) for (const i of byPlace.get(fp)) startLinks.push([i, walk(from, nodes[i], fp)]);
    else { let b = -1, bd = Infinity; nodes.forEach((n, i) => { const d = Math.hypot(n.x - from.x, n.z - from.z) + Math.abs(n.y - from.y) * 4; if (d < bd) { bd = d; b = i; } }); if (b >= 0) startLinks.push([b, bd]); fp = null; }
    const endCost = new Map();
    if (byPlace.has(tp)) for (const i of byPlace.get(tp)) endCost.set(i, walk(to, nodes[i], tp));
    const dist = new Float64Array(N + 2).fill(Infinity), prev = new Int32Array(N + 2).fill(-1), done = new Uint8Array(N + 2);
    dist[S] = 0;
    if (fp && fp === tp) { dist[T] = walk(from, to, tp); prev[T] = S; }
    for (;;) {
      let u = -1, ud = Infinity;
      for (let i = 0; i < N + 2; i++) if (!done[i] && dist[i] < ud) { ud = dist[i]; u = i; }
      if (u < 0 || u === T) break;
      done[u] = 1;
      const out = u === S ? startLinks : adj[u];
      for (const [v, c] of out) if (dist[u] + c < dist[v]) { dist[v] = dist[u] + c; prev[v] = u; }
      if (u !== S && endCost.has(u) && dist[u] + endCost.get(u) < dist[T]) { dist[T] = dist[u] + endCost.get(u); prev[T] = u; }
      // Within a place, every way in it is a straight walk from every other.
      if (u !== S) for (const v of byPlace.get(nodes[u].place)) { const c = walk(nodes[u], nodes[v], nodes[u].place); if (dist[u] + c < dist[v]) { dist[v] = dist[u] + c; prev[v] = u; } }
    }
    if (dist[T] === Infinity) return null;
    const pts = [];
    for (let u = T; u >= 0; u = prev[u]) pts.unshift(u === T ? { x: to.x, y: to.y, z: to.z } : u === S ? { x: from.x, y: from.y, z: from.z } : { x: nodes[u].x, y: nodes[u].y, z: nodes[u].z, i: u });
    // Mark the legs that change level, and how.
    for (let k = 0; k + 1 < pts.length; k++) if (pts[k].i != null && pts[k + 1].i != null) { const e = adj[pts[k].i].find(e => e[0] === pts[k + 1].i); if (e && (e[2] === 'up' || e[2] === 'down' || e[2] === 'lift')) pts[k].how = e[2] === 'lift' ? (pts[k + 1].y > pts[k].y ? 'lift up' : 'lift down') : (pts[k + 1].y > pts[k].y ? 'up' : 'down'); }
    return refine({ pts, length: dist[T] });
  }

  // ---- the way, laid on the floor ------------------------------------------
  // The same route as a ribbon of arrows on the floor of the building, running ahead of you.
  let ribbon = null;
  function layRibbon() {
    if (!THREE || !scene) return;
    if (!ribbon) {
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
      const g = cv.getContext('2d'); g.strokeStyle = '#7fe9f5'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(14, 12); g.lineTo(40, 32); g.lineTo(14, 52); g.stroke();
      const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -4 });
      ribbon = new THREE.Mesh(new THREE.BufferGeometry(), mat); ribbon.frustumCulled = false; ribbon.renderOrder = 4; ribbon.visible = false;
      scene.add(ribbon);
    }
    const path = state.path;
    if (!path) { ribbon.visible = false; return; }
    const pos = [], uv = [], idx = [], W = 0.2, LIFT = 0.05;
    let run = 0;
    for (let k = 0; k + 1 < path.pts.length; k++) {
      const a = path.pts[k], b = path.pts[k + 1], dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz);
      if (len < 0.05 || (a.how && /lift/.test(a.how))) continue;
      const nx = -dz / len * W, nz = dx / len * W, n = pos.length / 3;
      pos.push(a.x + nx, a.y + LIFT, a.z + nz, a.x - nx, a.y + LIFT, a.z - nz, b.x + nx, b.y + LIFT, b.z + nz, b.x - nx, b.y + LIFT, b.z - nz);
      uv.push(run / 0.8, 0, run / 0.8, 1, (run + len) / 0.8, 0, (run + len) / 0.8, 1);
      idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      run += len;
    }
    const geo = ribbon.geometry;
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    ribbon.visible = pos.length > 0;
  }

  // ---- drawing a level -------------------------------------------------------
  // Everything is drawn in metres; the caller has already set the transform. `px` is how many
  // metres one screen pixel is, so that lines keep their weight whatever the scale.
  const ZMIN = 0.42;                                   // far enough out to see from the avenue to the water
  function drawLevel(c, ly, px, label) {
    const p = G.plan;
    // Out of doors, on the big map: the park, the Drive and the harbour, as far as the buoys. (Zoom out to see them.)
    if (label && p.lakefront && Math.abs(ly) < 1) {
      const L = p.lakefront, B = p.bounds, z0 = B.z0, h = B.z1 - B.z0;
      c.fillStyle = 'rgba(40,48,66,.55)'; c.fillRect(L.field.x0, L.field.z0, L.field.x1 - L.field.x0, L.field.z1 - L.field.z0);
      c.fillStyle = 'rgba(16,18,26,.9)'; c.fillRect(L.lsd.x0, z0, L.lsd.x1 - L.lsd.x0, h);
      c.fillStyle = 'rgba(70,76,92,.7)'; c.fillRect(L.prom.x0, z0, L.shore - L.prom.x0, h); for (const q of L.paths) c.fillRect(q.x0, q.z0, q.x1 - q.x0, q.z1 - q.z0);
      c.fillStyle = 'rgba(150,180,215,.45)'; c.fillRect(L.shore, z0, L.buoys - L.shore, h);
      c.fillStyle = 'rgba(22,38,70,.9)'; c.fillRect(L.buoys, z0, B.x1 - L.buoys, h);
      c.fillStyle = 'rgba(200,200,205,.8)'; c.fillRect(L.shell.x0, L.shell.z0, L.shell.x1 - L.shell.x0, L.shell.z1 - L.shell.z0 + 1.2); c.fillRect(L.breakwater.x0, L.breakwater.z0, L.breakwater.x1 - L.breakwater.x0, L.breakwater.z1 - L.breakwater.z0);
      c.fillStyle = 'rgba(120,255,170,1)'; c.beginPath(); c.arc(L.light.x, L.light.z, Math.max(1.6, px * 3), 0, TAU); c.fill();
      c.fillStyle = 'rgba(226,205,148,.75)'; c.font = `${Math.max(5, px * 11)}px ui-monospace, monospace`;
      c.fillText('BUTLER FIELD', (L.field.x0 + L.field.x1) / 2, 150); c.fillText('MONROE HARBOR', (L.buoys + B.x1) / 2 - 4, 120);
      c.save(); c.translate((L.lsd.x0 + L.lsd.x1) / 2, 110); c.rotate(Math.PI / 2); c.fillText('LAKE SHORE DRIVE', 0, 0); c.restore();
    }
    for (const st of Object.values(G.museum.rooms)) {
      const r = st.room;
      if (!onLevel(r, ly) || !shown(r)) continue;
      const been = G.museum.visited.has(r.id), n = st.arts.length, f = n ? st.seen / n : 0, done = n ? st.done : been;
      const w = r.x1 - r.x0, h = r.z1 - r.z0;
      c.fillStyle = done ? 'rgba(226,190,110,.95)' : been ? 'rgba(62,70,98,.95)' : r.assumed || r.passage ? 'rgba(20,23,32,.92)' : 'rgba(30,34,48,.94)';
      c.fillRect(r.x0, r.z0, w, h);
      if (!done && f > 0) { c.fillStyle = 'rgba(240,200,110,.95)'; c.fillRect(r.x0, r.z1 - Math.min(h * 0.2, 1.6), w * f, Math.min(h * 0.2, 1.6)); }
      // A big room fills the radar edge to edge when you are in it: floor lines every four metres give it something to move against.
      if (Math.max(w, h) > 14) { c.strokeStyle = done ? 'rgba(120,90,30,.28)' : 'rgba(170,180,215,.16)'; c.lineWidth = px * 0.8; c.beginPath();
        for (let x = Math.ceil(r.x0 / 4) * 4; x < r.x1; x += 4) { c.moveTo(x, r.z0); c.lineTo(x, r.z1); } for (let z = Math.ceil(r.z0 / 4) * 4; z < r.z1; z += 4) { c.moveTo(r.x0, z); c.lineTo(r.x1, z); } c.stroke(); }
      c.lineWidth = px * 1.2;
      c.strokeStyle = done ? 'rgba(255,235,170,1)' : been ? 'rgba(226,205,148,.8)' : 'rgba(150,150,170,.45)';
      c.strokeRect(r.x0, r.z0, w, h);
      if (r.secret) { c.strokeStyle = 'rgba(255,90,77,.95)'; c.lineWidth = px * 2; c.setLineDash([px * 5, px * 3]); c.strokeRect(r.x0 + px * 2, r.z0 + px * 2, w - px * 4, h - px * 4); c.setLineDash([]); }
      if (label && Math.min(w, h) > 9 * px && w > 26 * px) {
        const name = r.secret ? (w > 12 ? 'TOP SECRET' : '?') : r.kind === 'hall' ? 'Griffin Court' : r.kind === 'corridor' ? '11' : r.gallery.replace(/^Galler(y|ies) /, '');
        const size = Math.max(9 * px, Math.min(13 * px, w / Math.max(3, name.length) * 1.5, h * 0.5));
        c.font = `600 ${size}px ui-monospace, Menlo, monospace`;
        c.fillStyle = r.secret ? 'rgba(255,120,105,.95)' : done ? 'rgba(30,22,6,.95)' : been ? 'rgba(240,225,185,.95)' : 'rgba(170,170,185,.8)';
        const fits = c.measureText(name).width < w - 2 * px;
        if (fits) c.fillText(name, r.x0 + w / 2, r.z0 + h / 2);
        else if (/^\d/.test(name)) c.fillText(name.slice(0, 4), r.x0 + w / 2, r.z0 + h / 2);
      }
    }
    c.fillStyle = 'rgba(226,205,148,.95)';
    for (const d of p.doors) if (Math.abs(d.y - ly) < 1.6 && (!d.secret || found())) c.fillRect(d.x0 - px, d.z0 - px, Math.max(2 * px, d.x1 - d.x0 + 2 * px), Math.max(2 * px, d.z1 - d.z0 + 2 * px));
    // Ways up and down from here: stairs hatched, lifts solid.
    c.strokeStyle = 'rgba(127,233,245,.9)'; c.fillStyle = 'rgba(127,233,245,.85)'; c.lineWidth = px;
    for (const q of p.ramps) {
      if (Math.min(q.y0, q.y1) > ly + 1.6 || Math.max(q.y0, q.y1) < ly - 1.6 || !shown(p.byId[q.room])) continue;
      c.strokeRect(q.x0, q.z0, q.x1 - q.x0, q.z1 - q.z0);
      c.beginPath();
      if (q.axis === 'x') for (let x = q.x0 + 1; x < q.x1; x += 1) { c.moveTo(x, q.z0); c.lineTo(x, q.z1); } else for (let z = q.z0 + 1; z < q.z1; z += 1) { c.moveTo(q.x0, z); c.lineTo(q.x1, z); }
      c.stroke();
    }
    for (const l of p.lifts) if (l.stops[0] < ly + 1.6 && l.stops[l.stops.length - 1] > ly - 1.6) c.fillRect(l.x0, l.z0, l.x1 - l.x0, l.z1 - l.z0);
  }
  // The route: bright where it runs on this level, faint where it is on another, with an arrow
  // wherever it goes up or down.
  function drawPath(c, ly, px, t) {
    const path = state.path; if (!path) return;
    const here = q => Math.abs(q.y - ly) < 2.4;
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const pass of [0, 1]) for (let k = 0; k + 1 < path.pts.length; k++) {
      const a = path.pts[k], b = path.pts[k + 1], on = here(a) || here(b);
      if ((pass === 1) !== on) continue;
      c.beginPath(); c.moveTo(a.x, a.z); c.lineTo(b.x, b.z);
      if (on) { c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = px * 7; c.setLineDash([]); c.stroke(); c.strokeStyle = '#7fe9f5'; c.lineWidth = px * 3.5; c.setLineDash([px * 9, px * 7]); c.lineDashOffset = -t * px * 22; }
      else { c.strokeStyle = 'rgba(127,233,245,.3)'; c.lineWidth = px * 2; c.setLineDash([px * 3, px * 6]); c.lineDashOffset = 0; }
      c.stroke();
    }
    c.setLineDash([]);
    for (const a of path.pts) if (a.how && here(a)) {
      const up = /up/.test(a.how), s = px * 8;
      c.fillStyle = '#7fe9f5'; c.strokeStyle = '#04121a'; c.lineWidth = px * 1.5;
      c.beginPath(); c.arc(a.x, a.z, s, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#04121a'; c.beginPath();
      if (up) { c.moveTo(a.x, a.z - s * 0.6); c.lineTo(a.x + s * 0.55, a.z + s * 0.35); c.lineTo(a.x - s * 0.55, a.z + s * 0.35); } else { c.moveTo(a.x, a.z + s * 0.6); c.lineTo(a.x + s * 0.55, a.z - s * 0.35); c.lineTo(a.x - s * 0.55, a.z - s * 0.35); }
      c.closePath(); c.fill();
    }
    const e = state.target;
    if (e && here(e)) { const s = px * (7 + Math.sin(t * 5) * 1.5); c.strokeStyle = '#7fe9f5'; c.lineWidth = px * 2.5; c.beginPath(); c.arc(e.x, e.z, s, 0, TAU); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(e.x, e.z, px * 3, 0, TAU); c.fill(); }
  }
  // Marks other parts of the game ask for (G.mapMarks: [{ x, y, z, colour, ring }]).
  function drawMarks(c, ly, px, t) {
    for (const m of G.mapMarks || []) {
      if (m.y != null && Math.abs(m.y - ly) > 2.4) continue;
      c.fillStyle = m.colour || '#ff5a4d'; c.strokeStyle = '#000'; c.lineWidth = px;
      c.beginPath(); c.arc(m.x, m.z, px * 5, 0, TAU); c.fill(); c.stroke();
      if (m.ring) { c.strokeStyle = m.colour || '#ff5a4d'; c.lineWidth = px * 2; c.beginPath(); c.arc(m.x, m.z, px * (9 + (t * 8) % 8), 0, TAU); c.stroke(); }
    }
  }
  function drawYou(c, x, z, yaw, s) {
    c.save(); c.translate(x, z); c.rotate(Math.PI - yaw); c.scale(s, s);
    // Unmissable: a cone of what is ahead, a ring that breathes, and a big bright arrow with a dark edge.
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 260);
    { const g = c.createRadialGradient(0, 0, 4, 0, 0, 46); g.addColorStop(0, 'rgba(255,90,60,.38)'); g.addColorStop(1, 'rgba(255,90,60,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 46, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5); c.closePath(); c.fill(); }
    c.strokeStyle = `rgba(255,90,60,${0.85 - pulse * 0.55})`; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, 15 + pulse * 7, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.fill();
    c.fillStyle = '#ff5a3c'; c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(0, -14); c.lineTo(9.5, 10); c.lineTo(0, 4.5); c.lineTo(-9.5, 10); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }

  // ---- the radar ---------------------------------------------------------------
  // The plan of a level is drawn once onto a picture of its own, and the radar only turns and slides
  // that picture each frame: drawing several hundred rooms afresh every frame is what made it jerk.
  // The picture is redrawn when something on it changes (a room visited, a work seen), at most twice a second.
  // One picture per storey, keyed by the storey and not by the toy's exact height: a jump, a ramp or a hovering drone
  // changes the height every frame, and redrawing the whole plan each time is what made the radar stutter.
  const pics = new Map(); let pic = null;
  function levelPicture(y) {
    const ly = levelOf(y).y; pic = pics.get(ly) || null;
    const m = G.museum, key = `${Math.round(ly * 10)}|${m.visited.size}|${m.seenCount}|${G.plan.rooms.length}|${G.secret && G.secret.open ? 1 : 0}`, now = performance.now();
    if (pic && (pic.key === key || now - pic.at < 500) && pic.ly === Math.round(ly * 10)) return pic;
    const B = G.plan.rooms.reduce((b, r) => ({ x0: Math.min(b.x0, r.x0), x1: Math.max(b.x1, r.x1), z0: Math.min(b.z0, r.z0), z1: Math.max(b.z1, r.z1) }), { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 });
    const pad = 4, ppm = 4, cv = (pic && pic.canvas) || document.createElement('canvas');
    cv.width = Math.ceil((B.x1 - B.x0 + 2 * pad) * ppm); cv.height = Math.ceil((B.z1 - B.z0 + 2 * pad) * ppm);
    const k = cv.getContext('2d');
    k.setTransform(ppm, 0, 0, ppm, -(B.x0 - pad) * ppm, -(B.z0 - pad) * ppm);
    k.textAlign = 'center'; k.textBaseline = 'middle';
    drawLevel(k, ly, 1 / ppm, false);
    pic = { key, ly: Math.round(ly * 10), at: now, canvas: cv, x0: B.x0 - pad, z0: B.z0 - pad, ppm }; pics.set(ly, pic); return pic;
  }
  function radar() {
    const v = G.vehicle, c = rc, W = radarEl.width, R = W / 2, s = W / 62;             // 62 m across
    const t = performance.now() / 1000;
    // The route is drawn once, when it is asked for, and stays as drawn until you arrive or rub it out.
    if (ribbon && ribbon.visible) ribbon.material.map.offset.x = -(t * 1.6) % 1;
    const ly = G.roomId ? v.pos.y : 0;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, W);
    c.save();
    c.beginPath(); c.arc(R, R, R - 2, 0, TAU); c.clip();
    c.fillStyle = 'rgba(8,10,16,.72)'; c.fillRect(0, 0, W, W);
    c.translate(R, R); c.rotate(v.yaw - Math.PI); c.scale(s, s); c.translate(-v.pos.x, -v.pos.z);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    { const k = levelPicture(ly); c.imageSmoothingEnabled = true; c.drawImage(k.canvas, k.x0, k.z0, k.canvas.width / k.ppm, k.canvas.height / k.ppm); }
    c.strokeStyle = 'rgba(255,140,60,.95)'; c.lineWidth = 2.5 / s;
    for (const L of G.plan.loops) { c.beginPath(); c.arc(L.x, L.z, 5.5 / s, 0, TAU); c.stroke(); }
    if (G.mode === 'race' && G.race && G.race.active) {
      const Rc = G.race;
      c.strokeStyle = 'rgba(127,233,245,.6)'; c.lineWidth = 2 / s; c.beginPath();
      Rc.route.pts.forEach((p, i) => (i % 4 === 0) && (i ? c.lineTo(p.x, p.z) : c.moveTo(p.x, p.z)));
      c.closePath(); c.stroke();
      for (const b of Rc.bots) { c.fillStyle = '#' + b.colour.toString(16).padStart(6, '0'); c.beginPath(); c.arc(b.x, b.z, 5 / s, 0, TAU); c.fill(); }
    }
    drawPath(c, ly, 1 / s, t);
    drawMarks(c, ly, 1 / s, t);
    c.restore();
    // Whatever is off the edge is pinned to the rim: the next turn of the route, the race's next gate.
    const rim = (x, z, colour) => {
      const dx = x - v.pos.x, dz = z - v.pos.z, a = v.yaw - Math.PI, rx = (dx * Math.cos(a) - dz * Math.sin(a)) * s, ry = (dx * Math.sin(a) + dz * Math.cos(a)) * s, d = Math.hypot(rx, ry);
      if (d < R - 10) return;
      const k = (R - 9) / d;
      c.fillStyle = colour; c.strokeStyle = '#000'; c.lineWidth = 2; c.beginPath(); c.arc(R + rx * k, R + ry * k, 7, 0, TAU); c.fill(); c.stroke();
    };
    if (state.path) {
      // The part of the route still ahead: from the point of it nearest you, the first that is off the edge of the radar.
      const pts = state.path.pts; let near = 0, nd = Infinity;
      pts.forEach((p, i) => { const d = Math.hypot(p.x - v.pos.x, p.z - v.pos.z) + Math.abs(p.y - v.pos.y) * 3; if (d < nd) { nd = d; near = i; } });
      const far = pts.slice(near).find(p => Math.hypot(p.x - v.pos.x, p.z - v.pos.z) > (R - 12) / s) || state.target; rim(far.x, far.z, '#7fe9f5');
    }
    if (G.mode === 'race' && G.race && G.race.active) { const g = G.race.gates[G.race.next]; if (g) rim(g.x, g.z, '#7fe9f5'); }
    for (const m of G.mapMarks || []) rim(m.x, m.z, m.colour || '#ff5a4d');
    // North, on the rim.
    { const a = v.yaw - Math.PI, nx = Math.sin(a) * (R - 13), ny = -Math.cos(a) * (R - 13); c.fillStyle = 'rgba(226,205,148,.95)'; c.font = '700 15px ui-monospace, Menlo, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', R + nx, R + ny); }
    drawYou(c, R, R, Math.PI, 1.15);
    c.strokeStyle = 'rgba(226,205,148,.85)'; c.lineWidth = 3; c.beginPath(); c.arc(R, R, R - 2, 0, TAU); c.stroke();
    // Which level, when there is more than one way to be wrong about it.
    const lv = levelOf(ly);
    c.fillStyle = 'rgba(8,10,16,.8)'; c.beginPath(); c.arc(R, W - 20, 15, 0, TAU); c.fill();
    c.fillStyle = 'rgba(226,205,148,.95)'; c.font = '700 14px ui-monospace, Menlo, monospace'; c.fillText(lv.name, R, W - 19);
    if (state.target && Math.hypot(state.target.x - v.pos.x, state.target.z - v.pos.z) < 2.6 && Math.abs(state.target.y - v.pos.y) < 1.6) { say(`You are here: ${state.target.label}.`); clear(); }
  }

  // ---- the whole building ------------------------------------------------------
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = bc.clientWidth, h = bc.clientHeight;
    if (bc.width !== Math.round(w * dpr) || bc.height !== Math.round(h * dpr)) { bc.width = Math.round(w * dpr); bc.height = Math.round(h * dpr); }
    const B = G.plan.rooms.reduce((b, r) => ({ x0: Math.min(b.x0, r.x0), x1: Math.max(b.x1, r.x1), z0: Math.min(b.z0, r.z0), z1: Math.max(b.z1, r.z1) }), { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 });
    const pad = 6, s0 = Math.min(bc.width / (B.x1 - B.x0 + 2 * pad), bc.height / (B.z1 - B.z0 + 2 * pad));
    if (state.cx == null) { state.cx = (B.x0 + B.x1) / 2; state.cz = (B.z0 + B.z1) / 2; }
    state.zoom = Math.max(ZMIN, Math.min(9, state.zoom));
    // Never drag the building right off the screen.
    state.cx = Math.max(B.x0, Math.min(G.plan.lakefront ? G.plan.bounds.x1 : B.x1, state.cx)); state.cz = Math.max(B.z0, Math.min(B.z1, state.cz));
    const s = s0 * state.zoom;
    state.fit = { s, ox: bc.width / 2 - state.cx * s, oz: bc.height / 2 - state.cz * s, dpr };
  }
  function drawBig() {
    if (big.hidden) return;
    fit();
    const { s, ox, oz } = state.fit, c = bx, t = performance.now() / 1000, ly = state.level.y, v = G.vehicle;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, bc.width, bc.height);
    c.setTransform(s, 0, 0, s, ox, oz);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    drawLevel(c, ly, 1 / s, true);
    drawPath(c, ly, 1 / s, t);
    drawMarks(c, ly, 1 / s, t);
    if (Math.abs((G.roomId ? v.pos.y : 0) - ly) < 2.4) drawYou(c, v.pos.x, v.pos.z, v.yaw, 1.3 / s);
    requestAnimationFrame(drawBig);
  }
  function tabs() {
    const el = document.getElementById('bmLevels'); el.textContent = '';
    const names = { LL: 'Lower', 1: 'First', 2: 'Second', 3: 'Third', X: 'Sub-level 9' };
    for (const l of levels().slice().reverse()) {
      const b = document.createElement('button'); b.textContent = names[l.name] || l.name; b.dataset.level = l.name;
      b.setAttribute('aria-pressed', l.name === state.level.name);
      el.append(b);
    }
    const you = levelOf(G.roomId ? G.vehicle.pos.y : 0), tg = state.target && levelOf(state.target.y);
    document.getElementById('bmNote').textContent = state.target
      ? (state.path ? `To ${state.target.label}${tg.name !== you.name ? ` (${(names[tg.name] || tg.name).toLowerCase()} level)` : ''}: about ${Math.round(state.path.length)} m.` : `No way found to ${state.target.label}.`)
      : 'Pick a room and the way to it lights up.';
    document.getElementById('bmClear').hidden = !state.target;
  }
  function open() {
    if (G.state !== 'play') return;
    state.level = levelOf(G.roomId ? G.vehicle.pos.y : 0);
    G.state = 'paused'; show('bigmap'); tabs();
    if (innerWidth < 900 && state.zoom === 1) { state.zoom = 2; state.cx = G.vehicle.pos.x; state.cz = G.vehicle.pos.z; }
    requestAnimationFrame(drawBig);
  }
  function close() { resume(); }
  function refresh() {
    const v = G.vehicle;
    state.path = state.target ? route({ x: v.pos.x, y: G.roomId ? v.pos.y : 0, z: v.pos.z }, state.target) : null;
    layRibbon();
  }
  function clear() { state.target = null; state.path = null; layRibbon(); }
  // Set a destination from anywhere in the game: { x, y, z, label }.
  function goTo(target) { state.target = target; nav = nav || build(); refresh(); return !!state.path; }
  // Drag to move the plan, pinch or roll the wheel to zoom, tap to pick.
  {
    const fingers = new Map(); let moved = 0, pinch = 0;
    const world = (cx, cy) => { const r = bc.getBoundingClientRect(), { s, ox, oz, dpr } = state.fit; return [((cx - r.left) * dpr - ox) / s, ((cy - r.top) * dpr - oz) / s]; };
    const zoomAt = (cx, cy, k) => { const [wx, wz] = world(cx, cy), z0 = state.zoom; state.zoom = Math.max(ZMIN, Math.min(9, z0 * k)); const f = state.zoom / z0; state.cx = wx - (wx - state.cx) / f; state.cz = wz - (wz - state.cz) / f; };
    bc.addEventListener('pointerdown', ev => { if (!state.fit) return; bc.setPointerCapture(ev.pointerId); fingers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY }); if (fingers.size === 1) moved = 0; pinch = 0; });
    bc.addEventListener('pointermove', ev => {
      const f = fingers.get(ev.pointerId); if (!f || !state.fit) return;
      const dx = ev.clientX - f.x, dy = ev.clientY - f.y;
      if (fingers.size === 1) { moved += Math.hypot(dx, dy); if (moved > 8) { state.cx -= dx * state.fit.dpr / state.fit.s; state.cz -= dy * state.fit.dpr / state.fit.s; } }
      f.x = ev.clientX; f.y = ev.clientY;
      if (fingers.size === 2) { const [p, q] = [...fingers.values()], d = Math.hypot(p.x - q.x, p.y - q.y); if (pinch) zoomAt((p.x + q.x) / 2, (p.y + q.y) / 2, d / pinch); pinch = d; moved = 99; }
    });
    const up = ev => { const had = fingers.delete(ev.pointerId); pinch = 0; if (had && ev.type === 'pointerup' && fingers.size === 0 && moved <= 8) pick(ev); };
    bc.addEventListener('pointerup', up); bc.addEventListener('pointercancel', up);
    bc.addEventListener('wheel', ev => { ev.preventDefault(); if (state.fit) zoomAt(ev.clientX, ev.clientY, ev.deltaY < 0 ? 1.2 : 1 / 1.2); }, { passive: false });
  }
  function pick(ev) {
    const r = bc.getBoundingClientRect(), { s, ox, oz, dpr } = state.fit;
    const x = ((ev.clientX - r.left) * dpr - ox) / s, z = ((ev.clientY - r.top) * dpr - oz) / s, ly = state.level.y, p = G.plan;
    const inside = q => x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1;
    // The room whose floor is on this level; failing that a deck here in a tall room; failing that, outdoors.
    let room = p.rooms.find(q => near(q.y, ly) && inside(q) && shown(q)), target = null;
    if (room) target = { x, y: room.y, z, place: 'R' + room.id, label: room.kind === 'hall' ? 'Griffin Court' : room.gallery };
    else {
      const d = p.decks.find(q => near(q.y, ly) && inside(q) && shown(p.byId[q.room]));
      if (d) { room = p.byId[d.room]; target = { x, y: d.y, z, place: 'D' + d.id, label: room.kind === 'hall' ? 'Griffin Court' : room.gallery }; }
      else if (near(ly, 0) && !p.rooms.some(q => q.y < 1 && q.top > 0.5 && inside(q))) target = { x, y: 0, z, place: 'OUT', label: 'that spot outdoors' };
    }
    if (!target) return;
    goTo(target); tabs();
  }
  big.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (b && b.dataset.level) { state.level = levels().find(l => l.name === b.dataset.level); tabs(); }
    else if (b && b.id === 'bmClear') { clear(); tabs(); }
    else if (b && b.id === 'bmClose') close();
    else if (b && b.id === 'bmIn') state.zoom *= 1.5;
    else if (b && b.id === 'bmOut') state.zoom /= 1.5;
  });
  const tap = ev => { ev.preventDefault(); open(); };
  radarEl.addEventListener('touchstart', tap, { passive: false });
  radarEl.addEventListener('click', tap);

  return { radar, open, close, goTo, clear, route, get target() { return state.target; }, get path() { return state.path; }, reset() { nav = null; grids.clear(); clear(); } };
}
