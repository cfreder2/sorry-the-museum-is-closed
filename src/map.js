// The map. In the corner, a round radar that turns with you, as in a driving game: the level you
// are on, you in the middle, whatever way you face at the top. Touch it (or press G) and the whole
// building opens, a level at a time. Pick a room there and the way to it lights up, on the big map
// and on the radar, across stairs and lifts if it is on another level.

const TAU = Math.PI * 2;
const near = (a, b, e = 0.7) => Math.abs(a - b) < e;

export function createMap(G, { radarEl, show, resume, say }) {
  const rc = radarEl.getContext('2d');
  const big = document.getElementById('bigmap'), bc = document.getElementById('bmCanvas'), bx = bc.getContext('2d');
  const state = { level: null, target: null, path: null, at: 0, fit: null, marks: [] };
  let nav = null;

  // ---- which level is which --------------------------------------------------
  const levels = () => Object.entries(G.plan.levels || { 1: 0 }).map(([name, y]) => ({ name, y })).sort((a, b) => a.y - b.y);
  const levelOf = y => { let best = null; for (const l of levels()) if (!best || Math.abs(l.y - y) < Math.abs(best.y - y)) best = l; return best; };
  const onLevel = (r, ly) => Math.abs(r.y - ly) < 0.7 || (r.y < ly && r.top > ly + 2.5);    // its floor is here, or it is a tall room rising through

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
    const p = G.plan, nodes = [], adj = [];
    const node = (x, y, z, place) => { nodes.push({ x, y, z, place }); adj.push([]); return nodes.length - 1; };
    const link = (a, b, cost, how) => { adj[a].push([b, cost, how]); adj[b].push([a, cost, how]); };
    const way = (A, B, cost, how) => { if (A.place && B.place && A.place !== B.place) link(node(A.x, A.y, A.z, A.place), node(B.x, B.y, B.z, B.place), cost, how); };
    for (const d of p.doors) {
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
      const c = q.axis === 'x' ? (q.z0 + q.z1) / 2 : (q.x0 + q.x1) / 2, len = q.axis === 'x' ? q.x1 - q.x0 : q.z1 - q.z0;
      const lo = q.axis === 'x' ? { x: q.x0 - 0.4, z: c } : { x: c, z: q.z0 - 0.4 }, hi = q.axis === 'x' ? { x: q.x1 + 0.4, z: c } : { x: c, z: q.z1 + 0.4 };
      way({ ...lo, y: q.y0, place: placeAt(lo.x, lo.z, q.y0) }, { ...hi, y: q.y1, place: placeAt(hi.x, hi.z, q.y1) }, len * 1.2, q.y1 > q.y0 ? 'up' : 'down');
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
    return { nodes, adj, byPlace };
  }
  const walk = (a, b, place) => Math.hypot(a.x - b.x, a.z - b.z) * (place === 'OUT' ? 3 : 1);      // indoors for choice

  // The shortest way from one spot to another: a list of points, each with how you get to the next.
  function route(from, to) {
    if (!nav) nav = build();
    const { nodes, adj, byPlace } = nav, N = nodes.length, S = N, T = N + 1;
    let fp = placeAt(from.x, from.z, from.y), tp = to.place || placeAt(to.x, to.z, to.y);
    if (!tp) return null;
    // In the air or on a flight of stairs you are nowhere in particular: start from the nearest way.
    const startLinks = [];
    if (fp && byPlace.has(fp)) for (const i of byPlace.get(fp)) startLinks.push([i, walk(from, nodes[i], fp)]);
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
    return { pts, length: dist[T] };
  }

  // ---- drawing a level -------------------------------------------------------
  // Everything is drawn in metres; the caller has already set the transform. `px` is how many
  // metres one screen pixel is, so that lines keep their weight whatever the scale.
  function drawLevel(c, ly, px, label) {
    const p = G.plan;
    for (const st of Object.values(G.museum.rooms)) {
      const r = st.room;
      if (!onLevel(r, ly)) continue;
      const been = G.museum.visited.has(r.id), n = st.arts.length, f = n ? st.seen / n : 0, done = n ? st.done : been;
      const w = r.x1 - r.x0, h = r.z1 - r.z0;
      c.fillStyle = done ? 'rgba(226,190,110,.95)' : been ? 'rgba(62,70,98,.95)' : r.assumed || r.passage ? 'rgba(20,23,32,.92)' : 'rgba(30,34,48,.94)';
      c.fillRect(r.x0, r.z0, w, h);
      if (!done && f > 0) { c.fillStyle = 'rgba(240,200,110,.95)'; c.fillRect(r.x0, r.z1 - Math.min(h * 0.2, 1.6), w * f, Math.min(h * 0.2, 1.6)); }
      c.lineWidth = px * 1.2;
      c.strokeStyle = done ? 'rgba(255,235,170,1)' : been ? 'rgba(226,205,148,.8)' : 'rgba(150,150,170,.45)';
      c.strokeRect(r.x0, r.z0, w, h);
      if (label && Math.min(w, h) > 9 * px && w > 26 * px) {
        const name = r.kind === 'hall' ? 'Griffin Court' : r.kind === 'corridor' ? '11' : r.gallery.replace(/^Galler(y|ies) /, '');
        const size = Math.max(9 * px, Math.min(13 * px, w / Math.max(3, name.length) * 1.5, h * 0.5));
        c.font = `600 ${size}px ui-monospace, Menlo, monospace`;
        c.fillStyle = done ? 'rgba(30,22,6,.95)' : been ? 'rgba(240,225,185,.95)' : 'rgba(170,170,185,.8)';
        const fits = c.measureText(name).width < w - 2 * px;
        if (fits) c.fillText(name, r.x0 + w / 2, r.z0 + h / 2);
        else if (/^\d/.test(name)) c.fillText(name.slice(0, 4), r.x0 + w / 2, r.z0 + h / 2);
      }
    }
    c.fillStyle = 'rgba(226,205,148,.95)';
    for (const d of p.doors) if (Math.abs(d.y - ly) < 1.6) c.fillRect(d.x0 - px, d.z0 - px, Math.max(2 * px, d.x1 - d.x0 + 2 * px), Math.max(2 * px, d.z1 - d.z0 + 2 * px));
    // Ways up and down from here: stairs hatched, lifts solid.
    c.strokeStyle = 'rgba(127,233,245,.9)'; c.fillStyle = 'rgba(127,233,245,.85)'; c.lineWidth = px;
    for (const q of p.ramps) {
      if (Math.min(q.y0, q.y1) > ly + 1.6 || Math.max(q.y0, q.y1) < ly - 1.6) continue;
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
    c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, -11); c.lineTo(7, 8); c.lineTo(0, 3); c.lineTo(-7, 8); c.closePath(); c.stroke(); c.fill();
    c.restore();
  }

  // ---- the radar ---------------------------------------------------------------
  function radar() {
    const v = G.vehicle, c = rc, W = radarEl.width, R = W / 2, s = W / 62;             // 62 m across
    const t = performance.now() / 1000;
    // Keep the route fresh: you rarely follow it exactly.
    if (state.target && t - state.at > 1.2) { state.at = t; refresh(); }
    const ly = G.roomId ? v.pos.y : 0;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, W);
    c.save();
    c.beginPath(); c.arc(R, R, R - 2, 0, TAU); c.clip();
    c.fillStyle = 'rgba(8,10,16,.72)'; c.fillRect(0, 0, W, W);
    c.translate(R, R); c.rotate(v.yaw - Math.PI); c.scale(s, s); c.translate(-v.pos.x, -v.pos.z);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    drawLevel(c, ly, 1 / s, false);
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
    if (state.path) { const far = state.path.pts.find((p, i) => i > 0 && Math.hypot(p.x - v.pos.x, p.z - v.pos.z) > (R - 12) / s) || state.target; rim(far.x, far.z, '#7fe9f5'); }
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
    const pad = 6, s = Math.min(bc.width / (B.x1 - B.x0 + 2 * pad), bc.height / (B.z1 - B.z0 + 2 * pad));
    state.fit = { s, ox: (bc.width - (B.x1 - B.x0) * s) / 2 - B.x0 * s, oz: (bc.height - (B.z1 - B.z0) * s) / 2 - B.z0 * s, dpr };
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
    const names = { LL: 'Lower', 1: 'First', 2: 'Second', 3: 'Third' };
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
    requestAnimationFrame(drawBig);
  }
  function close() { resume(); }
  function refresh() {
    const v = G.vehicle;
    state.path = state.target ? route({ x: v.pos.x, y: G.roomId ? v.pos.y : 0, z: v.pos.z }, state.target) : null;
  }
  function clear() { state.target = null; state.path = null; }
  // Set a destination from anywhere in the game: { x, y, z, label }.
  function goTo(target) { state.target = target; nav = nav || build(); refresh(); return !!state.path; }
  function pick(ev) {
    const r = bc.getBoundingClientRect(), { s, ox, oz, dpr } = state.fit;
    const x = ((ev.clientX - r.left) * dpr - ox) / s, z = ((ev.clientY - r.top) * dpr - oz) / s, ly = state.level.y, p = G.plan;
    const inside = q => x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1;
    // The room whose floor is on this level; failing that a deck here in a tall room; failing that, outdoors.
    let room = p.rooms.find(q => near(q.y, ly) && inside(q)), target = null;
    if (room) target = { x, y: room.y, z, place: 'R' + room.id, label: room.kind === 'hall' ? 'Griffin Court' : room.gallery };
    else {
      const d = p.decks.find(q => near(q.y, ly) && inside(q));
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
    else if (ev.target === bc) pick(ev);
  });
  const tap = ev => { ev.preventDefault(); open(); };
  radarEl.addEventListener('touchstart', tap, { passive: false });
  radarEl.addEventListener('click', tap);

  return { radar, open, close, goTo, clear, route, get target() { return state.target; }, get path() { return state.path; }, reset() { nav = null; clear(); } };
}
