// The ballpark on Butler Field (features.js), on the north-west of the four softball diamonds (butlerfield.js draws the
// other three), and its Home Run Derby. The field is ploughed for the game: a cleared infield of frozen clay with its
// bases, mound, plate, batter's boxes and chalk, a warning track and an outfield wall, padded, with the yellow
// home-run line along its top and a string of mini lights on it. Six light towers light it, dugouts and a little
// bleacher of snowman fans stand down the lines, a backstop behind the plate and a scoreboard out past the wall.
//
// The derby: pull into the batter's box (E, or BAT on a phone) and the snowman on the mound pitches ten snowballs, a
// straight one, a slow lob or a snow-curve. Swing with the jump (Space, SWING on a phone, a bumper on a pad): the car
// hops and whips round, and its tail bats the ball. Timing is everything: the nearer the ball is to the plate when
// the tail comes round, the better the hit (a grounder, a line drive, a fly ball, or out over the wall). Early pulls
// it down the third-base line, late pushes it to the first-base side. A home run sets the wall's lights going, the
// fans cheer and fireworks go up.
//
// Everything is merged or instanced. Nothing runs, and nothing new is drawn, while the toy is far away; nothing is
// allocated frame to frame.
import * as THREE from 'three';
import { feature, tonight } from './features.js';
import { heightOf, landable } from './plan.js';
import { TAU, Wire, canvasTex, lit, mergeAll } from './glowkit.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const S2 = Math.SQRT1_2, DEG = Math.PI / 180, GRAV = 9.8, BR = 0.07;   // (BR: a snowball's radius)
const BL = 12;                                                               // the base paths, as butlerfield.js has them
const PITCHES = 10;
// Pitches: how long the snowman takes over his wind-up, how long the ball is in the air, how high it arcs and how
// far it swings out sideways on the way (the snow-curve).
const KINDS = {
  straight: { wind: 1.15, T: 0.82, arc: 0.3, curve: 0 },
  lob: { wind: 1.0, T: 1.55, arc: 2.3, curve: 0 },
  curve: { wind: 1.3, T: 1.05, arc: 0.55, curve: 1.25 },
};
const ORDER = ['straight', 'straight', 'lob', 'curve', 'straight', 'curve', 'lob', 'straight', 'curve', 'straight'];
// How far the ball is from the sweet spot when the tail comes round (metres): within the first, out of the park.
const BANDS = [0.42, 0.85, 1.3, 1.85];
const NAMES = { hr: 'HOME RUN', fly: 'FLY BALL', line: 'LINE DRIVE', ground: 'GROUNDER' };
const COLS = [[2.8, 0.3, 0.25], [0.35, 2.4, 0.5], [0.45, 0.9, 3.0], [2.9, 1.9, 0.35], [2.8, 0.9, 1.7], [2.9, 1.1, 0.2]];
const rnd = (a, b) => a + Math.random() * (b - a);

feature({
  id: 'ballpark',
  secrets: [['derbyhr', 'Home Run Derby: one over the wall'], ['derby5', 'Home Run Derby: five in a round']],
  init(k) {
    const L = k.plan.lakefront; if (!L) return;
    const P = this.P = { hx: 402, hz: 146, line: 40, centre: 68, wall: 1.4, ...(L.ballpark || {}) };
    this.k = k; this.t = 0; this.on = false; this.phase = 'off';
    const g = this.g = new THREE.Group(); g.name = 'ballpark'; k.group.add(g);
    // The field's frame: home plate, centre field (c), and the side of the plate the batter's box is on (s, the
    // third-base side, where a right-handed batter stands).
    this.H = new THREE.Vector3(P.hx, 0, P.hz);
    this.c = new THREE.Vector3(S2, 0, S2); this.s = new THREE.Vector3(S2, 0, -S2);
    this.M = this.H.clone().addScaledVector(this.c, 8.6);                    // the pitcher's plate
    this.mound = { skin: 'hill', hill: true, axis: 'hill', cx: this.M.x, cz: this.M.z, rx: 2.6, rz: 2.6, H: 0.16, x0: this.M.x - 2.6, x1: this.M.x + 2.6, z0: this.M.z - 2.6, z1: this.M.z + 2.6, h0: 0, h1: 0.16, thick: 0 };
    k.plan.surfaces.push(this.mound); if (k.plan.hills) k.plan.hills.push(this.mound);
    this.M.y = heightOf(this.mound, this.M.x, this.M.z);
    this.box = this.H.clone().addScaledVector(this.s, 0.5);                 // where the car stands to bat
    this.hit = this.H.clone().addScaledVector(this.s, 0.06); this.hit.y = 0.16;       // where its tail meets the ball
    k.plan.paved.push({ x0: P.hx - 3.6, x1: P.hx + 17, z0: P.hz - 3.6, z1: P.hz + 17 });      // the infield is ploughed: it grips, and takes no tyre tracks
    this.lamps = new THREE.Group(); g.add(this.lamps);
    this._ground(k); this._backstop(k); this._dugouts(k); this._wall(k); this._towers(k); this._scoreboard(k);
    this._pitcher(k); this._balls(k); this._fans(k);
    this.crowd = k.loop({ type: 'noise', lp: 2300, hp: 450 }); this.cheer = 0;
    try { this.best = parseInt(localStorage.getItem('after-hours.derby.best'), 10) || 0; } catch { this.best = 0; }
    this._board();
    // Space swings at once (the jump it also makes is seen a frame later): the timing is to the key, not the frame.
    addEventListener('keydown', e => { if (this.on && e.code === 'Space' && !e.repeat) this._press = true; });
  },

  // r(θ): how far out the wall stands, θ from the third-base line (0, along +x) round to the first-base line (90°, +z).
  wallR(th) { const P = this.P; return P.line + (P.centre - P.line) * Math.sin(2 * Math.max(0, Math.min(Math.PI / 2, th))); },
  at(r, th, y = 0, out = new THREE.Vector3()) { return out.set(this.P.hx + r * Math.cos(th), y, this.P.hz + r * Math.sin(th)); },

  // ============================================================ the field
  _ground(k) {
    const g = this.g, P = this.P, H = this.H;
    const flat = (pts, y, sc = 0.25, holes = []) => {
      const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
      for (const h of holes) sh.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z))));
      const q = new THREE.ShapeGeometry(sh, 2); q.rotateX(-Math.PI / 2); q.translate(0, y, 0);
      const uv = q.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sc, uv.getY(i) * sc);
      return q;
    };
    const arc = (r, a0, a1, n, cx = P.hx, cz = P.hz, rf = null) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n, R = rf ? rf(a) : r; return [cx + R * Math.cos(a), cz + R * Math.sin(a)]; });
    const decal = (map, o = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.95, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...o });
    // The outfield: snow rolled flat in a checker, as a groundsman mows grass, out to the warning track.
    const chk = canvasTex(128, 128, (c, w, h) => {
      c.fillStyle = '#dfe7f0'; c.fillRect(0, 0, w, h); c.fillStyle = '#c9d4e0'; c.fillRect(0, 0, w / 2, h / 2); c.fillRect(w / 2, h / 2, w / 2, h / 2);
      for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '150,165,185'},${Math.random() * 0.25})`; c.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    });
    chk.wrapS = chk.wrapT = THREE.RepeatWrapping;
    {
      const pts = [[P.hx, P.hz], ...arc(0, 0, Math.PI / 2, 60, P.hx, P.hz, a => this.wallR(a) - 3.2)];
      // The silo's square in centre field (plan.grounds.silo, finaleplan.js) is left out: its doors are drawn there, and
      // when they open, the shaft is open to the sky. (Every opening below the street is in groundOpenings().)
      const sq = k.plan.grounds && k.plan.grounds.silo;
      const q = flat(pts, 0.01, 1, sq ? [[[sq.x0, sq.z0], [sq.x1, sq.z0], [sq.x1, sq.z1], [sq.x0, sq.z1]]] : []); const uv = q.attributes.uv, pos = q.attributes.position;
      for (let i = 0; i < uv.count; i++) { const dx = pos.getX(i) - P.hx, dz = pos.getZ(i) - P.hz; uv.setXY(i, (dx * S2 + dz * S2) / 9, (dx * S2 - dz * S2) / 9); }
      const m = new THREE.Mesh(q, decal(chk, { emissiveIntensity: 0.62, color: 0xeef3fa })); m.receiveShadow = true; g.add(m);
    }
    // Frozen clay, ploughed clear: the infield, the circle round the plate, the warning track and the mound.
    const clay = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = '#6c4630'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 4000; i++) { const v = Math.random(); c.fillStyle = v < 0.45 ? `rgba(60,34,20,${Math.random() * 0.35})` : v < 0.85 ? `rgba(170,120,85,${Math.random() * 0.3})` : `rgba(240,245,255,${0.3 + Math.random() * 0.5})`; const r = Math.random() * 2.2; c.fillRect(Math.random() * w, Math.random() * h, r, r); }
    });
    clay.wrapS = clay.wrapT = THREE.RepeatWrapping;
    const clayM = this.clayM = decal(clay, { emissiveIntensity: 0.62 });
    const mh = arc(2.6, 0, TAU, 40, this.M.x, this.M.z).slice(0, -1).reverse();
    g.add(new THREE.Mesh(flat([...arc(17.8, -6 * DEG, 96 * DEG, 40), ...arc(3.6, 96 * DEG, 354 * DEG, 40)], 0.02, 0.25, [mh]), clayM));
    {
      const outer = arc(0, -0.5 * DEG, 90.5 * DEG, 90, P.hx, P.hz, a => this.wallR(a) - 0.12), inner = arc(0, 90.5 * DEG, -0.5 * DEG, 90, P.hx, P.hz, a => this.wallR(a) - 3.2);
      g.add(new THREE.Mesh(flat([...outer, ...inner], 0.01, 0.25), clayM));
    }
    {
      const n = 32, R = 8, pos = [], uv = [], idx = [], mound = this.mound;
      for (let j = 0; j <= R; j++) for (let i = 0; i <= n; i++) { const r = 2.6 * j / R, a = TAU * i / n, x = this.M.x + r * Math.cos(a), z = this.M.z + r * Math.sin(a); pos.push(x, heightOf(mound, x, z) + 0.02, z); uv.push(x / 4, z / 4); }
      for (let j = 0; j < R; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c2 = a + n + 1, d = c2 + 1; idx.push(a, b, c2, b, d, c2); }
      const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); q.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); q.setIndex(idx); q.computeVertexNormals();
      g.add(new THREE.Mesh(q, clayM));
    }
    // Chalk: the foul lines out to the wall, the batter's boxes, the catcher's box, the circle round the mound.
    const lines = [], seg = (ax, az, bx, bz, w = 0.08, y = 0.03) => {
      const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz), nx = -dz / l * w / 2, nz = dx / l * w / 2;
      lines.push(ax + nx, y, az + nz, bx + nx, y, bz + nz, bx - nx, y, bz - nz, ax + nx, y, az + nz, bx - nx, y, bz - nz, ax - nx, y, az - nz);
    };
    const poly = (pts, closed, w, y) => { for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; seg(a[0], a[1], b[0], b[1], w, y); } };
    seg(P.hx + 0.3, P.hz, P.hx + this.wallR(0) - 0.1, P.hz); seg(P.hx, P.hz + 0.3, P.hx, P.hz + this.wallR(Math.PI / 2) - 0.1);
    const c = this.c, s = this.s, rect = (o, a, b, w, d) => {          // a box in the field's own frame: o its centre, a along c, b along s
      const p = (u, v) => [o.x + c.x * u + s.x * v, o.z + c.z * u + s.z * v];
      poly([p(-d / 2, -w / 2), p(d / 2, -w / 2), p(d / 2, w / 2), p(-d / 2, w / 2)], true, 0.06, 0.03);
    };
    for (const side of [-1, 1]) rect(H.clone().addScaledVector(s, side * 0.71), 0, 0, 0.92, 2.1);
    { const o = H.clone().addScaledVector(c, -1.95); const p = (u, v) => [o.x + c.x * u + s.x * v, o.z + c.z * u + s.z * v]; poly([p(0.7, -1.1), p(-0.7, -1.1), p(-0.7, 1.1), p(0.7, 1.1)], false, 0.06, 0.03); }
    poly(arc(2.9, 0, TAU, 48, this.M.x, this.M.z), false, 0.06, 0.03);
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3)); lg.computeVertexNormals();
    g.add(new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.92, 0.93, 0.96), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
    // Bases, the plate, the pitcher's plate.
    const white = [], put = (q, x, y, z, ry = 0) => { q.rotateY(ry); q.translate(x, y, z); white.push(q); };
    for (const [x, z] of [[P.hx + 0.19, P.hz + BL - 0.19], [P.hx + BL - 0.19, P.hz + BL - 0.19], [P.hx + BL - 0.19, P.hz + 0.19]]) put(new THREE.BoxGeometry(0.38, 0.034, 0.38), x, 0.017, z);
    { const sh = new THREE.Shape([[-0.215, 0], [0.215, 0], [0.215, 0.215], [0, 0.43], [-0.215, 0.215]].map(([x, y]) => new THREE.Vector2(x, y))); const q = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }); q.rotateX(-Math.PI / 2); q.translate(0, 0, 0.215); put(q, P.hx, 0, P.hz, Math.atan2(c.x, c.z)); }
    put(new THREE.BoxGeometry(0.61, 0.03, 0.15), this.M.x, this.M.y + 0.015, this.M.z, Math.atan2(c.x, c.z));
    g.add(new THREE.Mesh(mergeAll(white), new THREE.MeshStandardMaterial({ color: 0xf6f7f9, roughness: 0.6, emissive: 0xc8ccd4, emissiveIntensity: 0.7 })));
    // The light the towers throw on the snow round the field: a broad soft pool, drawn under the field's own ground
    // (which is lit in its own materials, so that the mound and the infield take the same light).
    const pool = canvasTex(128, 128, (c2, w, h) => { const gr = c2.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c2.fillStyle = gr; c2.fillRect(0, 0, w, h); });
    for (const [d, size, col] of [[30, 110, [0.26, 0.26, 0.25]]]) {
      const q = new THREE.PlaneGeometry(size, size); q.rotateX(-Math.PI / 2); q.rotateY(Math.PI / 4); const o = H.clone().addScaledVector(c, d); q.translate(o.x, 0.004, o.z);
      const m = new THREE.Mesh(q, new THREE.MeshBasicMaterial({ map: pool, color: new THREE.Color(...col), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
      m.renderOrder = 4; g.add(m); this.pool = m;
    }
  },

  // The backstop: tall chain link in an arc behind the plate, padded along its foot.
  _backstop(k) {
    const O = k.plan.obstacles, H = this.H, R = 4.4, n = 12, a0 = 155 * DEG, a1 = 295 * DEG, h = 4.2;
    const panels = [], steel = [], pads = [];
    let px = 0, pz = 0;
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * i / n, x = H.x + Math.cos(a) * R, z = H.z + Math.sin(a) * R;
      { const p = new THREE.CylinderGeometry(0.04, 0.04, h + 0.1, 6); p.translate(x, (h + 0.1) / 2, z); steel.push(p); }
      if (i) {
        const l = Math.hypot(x - px, z - pz), ang = -Math.atan2(z - pz, x - px), mx = (x + px) / 2, mz = (z + pz) / 2;
        const q = new THREE.PlaneGeometry(l, h - 1); const uv = q.attributes.uv; for (let j = 0; j < uv.count; j++) uv.setXY(j, uv.getX(j) * l / 0.6, uv.getY(j) * (h - 1) / 0.6);
        q.rotateY(ang); q.translate(mx, 1 + (h - 1) / 2, mz); panels.push(q);
        const pad = new THREE.BoxGeometry(l, 1, 0.12); pad.rotateY(ang); pad.translate(mx, 0.5, mz); pads.push(pad);
        const r = new THREE.CylinderGeometry(0.03, 0.03, l, 6); r.rotateZ(Math.PI / 2); r.rotateY(ang); r.translate(mx, h, mz); steel.push(r);
        O.push({ x0: Math.min(px, x) - 0.08, x1: Math.max(px, x) + 0.08, z0: Math.min(pz, z) - 0.08, z1: Math.max(pz, z) + 0.08, y0: 0, y1: h });
      }
      px = x; pz = z;
    }
    const chain = canvasTex(64, 64, (c, w) => { c.clearRect(0, 0, w, w); c.strokeStyle = 'rgba(205,214,224,.95)'; c.lineWidth = 2; for (let i = -64; i < 128; i += 16) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 64, 64); c.stroke(); c.beginPath(); c.moveTo(i + 64, 0); c.lineTo(i, 64); c.stroke(); } });
    chain.wrapS = chain.wrapT = THREE.RepeatWrapping;
    this.chainM = new THREE.MeshStandardMaterial({ map: chain, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.4, emissive: 0x4a5260, emissiveMap: chain, emissiveIntensity: 0.8 });
    this.steelM = lit(0x8c949c, { metalness: 0.7, roughness: 0.35 });
    this.padM = lit(0x1f4a33, { roughness: 0.8 });
    this.g.add(new THREE.Mesh(mergeAll(panels), this.chainM), new THREE.Mesh(mergeAll(steel), this.steelM), new THREE.Mesh(mergeAll(pads), this.padM));
  },

  // Two dugouts, open to the field, roofed (the roof can be landed on and the car drives in under it), with a bench;
  // and down the first-base line beyond, a bleacher of three tiers with the fans on it.
  _dugouts(k) {
    const O = k.plan.obstacles, S = k.plan.surfaces, P = this.P, walls = [], roofs = [], benches = [];
    const RH = 1.27, T = 0.06;
    const dug = (x0, x1, z0, z1, back) => {          // back: which side the wall is on ('x0' or 'z0')
      const wall = (a0, a1, b0, b1) => { const q = new THREE.BoxGeometry(a1 - a0, RH - T, b1 - b0); q.translate((a0 + a1) / 2, (RH - T) / 2, (b0 + b1) / 2); walls.push(q); O.push({ x0: a0, x1: a1, z0: b0, z1: b1, y0: 0, y1: RH - T }); };
      if (back === 'x0') { wall(x0, x0 + 0.12, z0, z1); wall(x0, x1, z0, z0 + 0.12); wall(x0, x1, z1 - 0.12, z1); }
      else { wall(x0, x1, z0, z0 + 0.12); wall(x0, x0 + 0.12, z0, z1); wall(x1 - 0.12, x1, z0, z1); }
      const roof = new THREE.BoxGeometry(x1 - x0 + 0.2, T, z1 - z0 + 0.2); roof.translate((x0 + x1) / 2, RH - T / 2, (z0 + z1) / 2); roofs.push(roof);
      S.push({ skin: 'wall', fixed: true, x0: x0 - 0.1, x1: x1 + 0.1, z0: z0 - 0.1, z1: z1 + 0.1, axis: null, h0: RH, h1: RH, thick: T });
      const bx0 = back === 'x0' ? x0 + 0.14 : x0 + 0.3, bx1 = back === 'x0' ? x0 + 0.5 : x1 - 0.3, bz0 = back === 'x0' ? z0 + 0.3 : z0 + 0.14, bz1 = back === 'x0' ? z1 - 0.3 : z0 + 0.5;
      const seat = new THREE.BoxGeometry(bx1 - bx0, 0.06, bz1 - bz0); seat.translate((bx0 + bx1) / 2, 0.42, (bz0 + bz1) / 2); benches.push(seat);
      for (const f of [0.1, 0.5, 0.9]) { const leg = new THREE.BoxGeometry(0.05, 0.4, 0.05); leg.translate(back === 'x0' ? (bx0 + bx1) / 2 : bx0 + (bx1 - bx0) * f, 0.2, back === 'x0' ? bz0 + (bz1 - bz0) * f : (bz0 + bz1) / 2); benches.push(leg); }
      O.push({ x0: bx0, x1: bx1, z0: bz0, z1: bz1, y0: 0, y1: 0.45 });
    };
    dug(P.hx - 4.0, P.hx - 2.6, P.hz + 3.5, P.hz + 9.5, 'x0');             // first-base side (west of the +z line)
    dug(P.hx + 4.5, P.hx + 10.5, P.hz - 3.8, P.hz - 2.4, 'z0');             // third-base side (north of the +x line)
    // the bleacher: three tiers stepping up away from the first-base line, each a run of timber seat boards on a steel
    // frame, ribbed steel risers between the steps and steel ends, and snow lying on the boards wherever nobody stands
    this.bleacher = { x: P.hx - 1.8, z0: P.hz + 12.5, z1: P.hz + 20.5 };
    this._fanLayout();
    const boards = [], snowG = [], steel = [], risers = [], rnd1 = this._rng(31);
    for (let i = 0; i < 3; i++) {
      const x1 = P.hx - 1.8 - i, x0 = x1 - 1, z0 = P.hz + 12.5, z1 = P.hz + 20.5, top = 0.4 * (i + 1), zm = (z0 + z1) / 2;
      landable(k.plan, x0, x1, z0, z1, top);
      // three boards with a gap between, a little proud of the frame at each end
      for (let j = 0; j < 3; j++) {
        const bx = x0 + 0.17 + j * 0.33, q = new THREE.BoxGeometry(0.3, 0.035, 8.1); q.translate(bx, top - 0.0175, zm); boards.push(q);
        // the snow on it: drifts along the board, broken where a fan stands and here and there where it has been knocked off
        const clear = this.fanSpots.filter(f => f.tier === i).map(f => [f.z - 0.32 * f.s, f.z + 0.32 * f.s]);
        let z = z0 + 0.05 + rnd1() * 0.3;
        while (z < z1 - 0.2) {
          const len = 0.4 + rnd1() * 1.6, za = z, zb = Math.min(z1 - 0.05, z + len);
          const segs = [[za, zb]];
          for (const [c0, c1] of clear) for (let s = segs.length - 1; s >= 0; s--) { const [a, b] = segs[s]; if (c1 <= a || c0 >= b) continue; segs.splice(s, 1, ...[[a, c0], [c1, b]].filter(([p, q2]) => q2 - p > 0.15)); }
          // (each stretch a chain of soft lumps of different widths, so its edge wanders as a drift's does)
          for (const [a, b] of segs) for (let za2 = a; za2 < b - 0.08;) {
            const zb2 = Math.min(b, za2 + 0.22 + rnd1() * 0.3), th = 0.012 + rnd1() * 0.016, w = 0.15 + rnd1() * 0.12, sg = new THREE.CapsuleGeometry(th, Math.max(0.01, zb2 - za2), 2, 6);
            sg.rotateX(Math.PI / 2); sg.scale(w / (2 * th), 1, 1); sg.translate(bx + (rnd1() - 0.5) * 0.06, top + th * 0.3, (za2 + zb2) / 2); snowG.push(sg);
            za2 = zb2 - 0.04;
          }
          z = zb + 0.15 + rnd1() * 0.7;
        }
      }
      // the frame: posts front and back every two metres, a bearer under the boards on each pair
      for (let zz = z0 + 0.1; zz <= z1 - 0.05; zz += (z1 - z0 - 0.2) / 4) {
        for (const px of [x0 + 0.05, x1 - 0.05]) { const q = new THREE.BoxGeometry(0.05, top - 0.035, 0.05); q.translate(px, (top - 0.035) / 2, zz); steel.push(q); }
        const q = new THREE.BoxGeometry(1, 0.05, 0.05); q.translate((x0 + x1) / 2, top - 0.06, zz); steel.push(q);
      }
      // the riser in front of the step (the first one down to the ground), the steel ends, the back of the top tier
      { const h = top - 0.035 - 0.4 * i, q = new THREE.BoxGeometry(0.02, h, 8); q.translate(x1 - 0.01, 0.4 * i + h / 2, zm); risers.push(q); }
      for (const ez of [z0 + 0.01, z1 - 0.01]) { const q = new THREE.BoxGeometry(1, top - 0.035, 0.02); q.translate((x0 + x1) / 2, (top - 0.035) / 2, ez); risers.push(q); }
      if (i === 2) { const q = new THREE.BoxGeometry(0.02, top - 0.035, 8); q.translate(x0 + 0.01, (top - 0.035) / 2, zm); risers.push(q); }
    }
    const g = this.g, wood = lit(0x6b4a2a);
    g.add(new THREE.Mesh(mergeAll(walls), lit(0x23402e)), new THREE.Mesh(mergeAll(roofs), lit(0xe9eef5, { roughness: 0.9 })), new THREE.Mesh(mergeAll(benches), wood));
    const grain = canvasTex(64, 256, (c, w, h) => {
      c.fillStyle = '#9a6b3e'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { c.strokeStyle = `rgba(${Math.random() < 0.5 ? '70,42,20' : '196,150,100'},${0.15 + Math.random() * 0.3})`; c.lineWidth = 0.5 + Math.random() * 1.5; const x = Math.random() * w; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + (Math.random() - 0.5) * 6, h / 3, x + (Math.random() - 0.5) * 6, h * 2 / 3, x + (Math.random() - 0.5) * 4, h); c.stroke(); }
      c.fillStyle = 'rgba(40,24,12,.5)'; c.fillRect(0, 0, 2, h); c.fillRect(w - 2, 0, 2, h);
    });
    const ribs = canvasTex(128, 32, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 16, 0); gr.addColorStop(0, '#5d666f'); gr.addColorStop(0.35, '#a9b2ba'); gr.addColorStop(0.6, '#7c858e'); gr.addColorStop(1, '#4e565e');
      c.fillStyle = gr; for (let x = 0; x < w; x += 16) { c.save(); c.translate(x, 0); c.fillRect(0, 0, 16, h); c.restore(); }
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, h - 3, w, 3);
    });
    ribs.wrapS = THREE.RepeatWrapping; ribs.repeat.set(12, 1);
    g.add(new THREE.Mesh(mergeAll(boards), new THREE.MeshStandardMaterial({ map: grain, roughness: 0.8, emissive: 0xffffff, emissiveMap: grain, emissiveIntensity: 0.32 })));
    g.add(new THREE.Mesh(mergeAll(risers), new THREE.MeshStandardMaterial({ map: ribs, metalness: 0.5, roughness: 0.45, emissive: 0xffffff, emissiveMap: ribs, emissiveIntensity: 0.36 })));
    g.add(new THREE.Mesh(mergeAll(steel), lit(0x59616a, { metalness: 0.6, roughness: 0.4 })));
    if (snowG.length) g.add(new THREE.Mesh(mergeAll(snowG), new THREE.MeshStandardMaterial({ color: 0xe6edf7, roughness: 0.95, emissive: new THREE.Color(0.42, 0.48, 0.64), emissiveIntensity: 0.6 })));
  },

  // ============================================================ the wall
  _wall(k) {
    const O = k.plan.obstacles, P = this.P, Hh = P.wall, n = 160, TH = 0.12;
    const inner = [], top = [], back = [], iuv = [];
    let len = 0, prev = null;
    this.wallLen = [];
    for (let i = 0; i <= n; i++) {
      const th = (Math.PI / 2) * i / n, r = this.wallR(th), cs = Math.cos(th), sn = Math.sin(th);
      const ix = P.hx + (r - TH) * cs, iz = P.hz + (r - TH) * sn, ox = P.hx + (r + TH) * cs, oz = P.hz + (r + TH) * sn;
      if (prev) len += Math.hypot(ix - prev[0], iz - prev[1]); prev = [ix, iz]; this.wallLen.push(len);
      inner.push([ix, iz]); back.push([ox, oz]);
    }
    this.wallTotal = len;
    // the faces: padding on the field side, the yellow line along the top, plain boards behind
    const strip = (a, b, ya0, ya1, yb0, yb1, uvLen) => {
      const pos = [], uv = [];
      for (let i = 0; i < a.length - 1; i++) {
        const A0 = [a[i][0], ya0, a[i][1]], A1 = [a[i + 1][0], ya0, a[i + 1][1]], B0 = [b[i][0], ya1, b[i][1]], B1 = [b[i + 1][0], ya1, b[i + 1][1]];
        const u0 = uvLen ? this.wallLen[i] / 2.4 : 0, u1 = uvLen ? this.wallLen[i + 1] / 2.4 : 1;
        pos.push(...A0, ...B0, ...B1, ...A0, ...B1, ...A1); uv.push(u0, 0, u0, 1, u1, 1, u0, 0, u1, 1, u1, 0);
      }
      const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); q.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); q.computeVertexNormals(); return q;
    };
    const padT = canvasTex(256, 128, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#173d2a'); gr.addColorStop(0.5, '#1f5238'); gr.addColorStop(1, '#173d2a'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, 3, h); c.fillRect(w - 3, 0, 3, h); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(0, 6, w, 3);
      for (let i = 0; i < 200; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    });
    padT.wrapS = THREE.RepeatWrapping;
    const g = this.g;
    g.add(new THREE.Mesh(strip(inner, inner, 0, Hh, 0, 0, true), new THREE.MeshStandardMaterial({ map: padT, roughness: 0.75, emissive: 0xffffff, emissiveMap: padT, emissiveIntensity: 0.55, side: THREE.DoubleSide })));
    g.add(new THREE.Mesh(strip(back, back, 0, Hh, 0, 0, false), lit(0x24302a, { side: THREE.DoubleSide })));
    { const q = strip(inner, back, Hh, Hh, 0, 0, false); g.add(new THREE.Mesh(q, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.1, 1.75, 0.2), side: THREE.DoubleSide }))); }
    // solid: a run of short boxes along it (it is curved, and what stops a car is square)
    for (let i = 0; i < n; i += 2) {
      const j = Math.min(n, i + 2), a = inner[i], b = back[j], c = inner[j], d = back[i];
      O.push({ x0: Math.min(a[0], b[0], c[0], d[0]) - 0.02, x1: Math.max(a[0], b[0], c[0], d[0]) + 0.02, z0: Math.min(a[1], b[1], c[1], d[1]) - 0.02, z1: Math.max(a[1], b[1], c[1], d[1]) + 0.02, y0: 0, y1: Hh });
    }
    // distance markers, in feet, as a ballpark has them
    const mark = (th, txt) => {
      const t = canvasTex(256, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#f4f1e6'; c.font = '800 92px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, w / 2, h / 2 + 6); });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.65), new THREE.MeshBasicMaterial({ map: t, transparent: true, color: new THREE.Color(1.2, 1.2, 1.2), depthWrite: false }));
      const r = this.wallR(th) - TH - 0.012; this.at(r, th, Hh * 0.55, m.position); m.rotation.y = Math.atan2(-Math.cos(th), -Math.sin(th)); g.add(m);
    };
    for (const th of [0, 22.5, 45, 67.5, 90]) mark(th * DEG, String(Math.round(this.wallR(th * DEG) * 3.281)));
    // the foul poles, where the wall meets the lines, with their screens on the fair side
    const yel = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 1.7, 0.15) });
    for (const th of [0, Math.PI / 2]) {
      const r = this.wallR(th) + 0.25, p = this.at(r, th);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 7.5, 8), yel); pole.position.set(p.x, 3.75, p.z); g.add(pole);
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 5.5), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.5, 0.15), map: this.chainM.map, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }));
      sc.position.set(p.x + (th ? 0.27 : 0), 4.4, p.z + (th ? 0 : 0.27)); sc.rotation.y = th ? 0 : Math.PI / 2; g.add(sc);
      O.push({ x0: p.x - 0.09, x1: p.x + 0.09, z0: p.z - 0.09, z1: p.z + 0.09, y0: 0, y1: 7.5 });
    }
    // the mini lights along the top, on a dark green wire that dips between its clips
    const B = this.bulbList = { p: [], c: [], f: [], s: [] }, wire = new Wire(0.007), wpts = [];
    const sp = 0.2, cnt = Math.floor(len / sp);
    let i = 0;
    for (let q = 0; q <= cnt; q++) {
      const d = q * sp; while (i < n - 1 && this.wallLen[i + 1] < d) i++;
      const f = (d - this.wallLen[i]) / Math.max(1e-6, this.wallLen[i + 1] - this.wallLen[i]), th = (Math.PI / 2) * (i + f) / n, r = this.wallR(th) - TH - 0.03;
      const sag = 0.07 * Math.sin(Math.PI * ((d / 1.6) % 1)), x = P.hx + r * Math.cos(th), z = P.hz + r * Math.sin(th), y = Hh + 0.07 - sag;
      wpts.push([x, y, z]);
      B.p.push(x, y - 0.035, z); B.c.push(...COLS[q % 5]); B.f.push(Math.random(), (i + f) / n); B.s.push(1);
    }
    wire.stroke(wpts, [0.04, 0.12, 0.06]);
    this.wire = wire;
  },

  // ============================================================ the lights
  // Six towers: a tapered steel mast on a concrete footing, a ladder, a catwalk and a bank of fifteen floodlights
  // aimed at the field, each face burning white. The light on the field is the pools in _ground.
  _towers(k) {
    const O = k.plan.obstacles, P = this.P, H = this.H, c = this.c;
    const steel = [], heads = [], faces = [], conc = [];
    const D = new THREE.Object3D(), tmp = new THREE.Vector3();
    const towers = [[P.hx - 4.5, P.hz + 24], [P.hx + 26, P.hz - 2.8], [P.hx - 3.4, P.hz + 42.5], [P.hx + 44.5, P.hz - 3.0], null, null];
    for (const [i, th] of [[4, 22 * DEG], [5, 68 * DEG]]) { const r = this.wallR(th) + 5; towers[i] = [P.hx + r * Math.cos(th), P.hz + r * Math.sin(th)]; }
    const HT = 18, aim = H.clone().addScaledVector(c, 26);
    this.glowAt = [];
    for (const [x, z] of towers) {
      { const q = new THREE.CylinderGeometry(0.55, 0.65, 0.5, 12); q.translate(x, 0.25, z); conc.push(q); }
      { const q = new THREE.CylinderGeometry(0.14, 0.3, HT, 10); q.translate(x, HT / 2 + 0.5, z); steel.push(q); }
      // a ladder up the side away from the field
      const away = tmp.set(x - aim.x, 0, z - aim.z).normalize(), lx = x + away.x * 0.36, lz = z + away.z * 0.36, side = { x: -away.z * 0.16, z: away.x * 0.16 };
      for (const sgn of [-1, 1]) { const q = new THREE.CylinderGeometry(0.015, 0.015, HT - 2, 4); q.translate(lx + side.x * sgn, HT / 2 + 1.5, lz + side.z * sgn); steel.push(q); }
      for (let y = 2.5; y < HT; y += 0.45) { const q = new THREE.BoxGeometry(0.32, 0.02, 0.02); q.rotateY(Math.atan2(side.x, side.z) + Math.PI / 2); q.translate(lx, y, lz); steel.push(q); }
      // the bank: built facing +z, then turned to the field and tipped down at it
      const top = new THREE.Vector3(x, HT + 1.2, z);
      D.position.copy(top); D.lookAt(aim.x, 0, aim.z); D.updateMatrix();
      const bank = [], hs = [], fs = [];
      for (let r = 0; r < 3; r++) for (let q = 0; q < 5; q++) {
        const hx = (q - 2) * 0.62, hy = 0.9 - r * 0.62;
        const h = new THREE.BoxGeometry(0.52, 0.52, 0.34); h.translate(hx, hy, 0.12); hs.push(h);
        const f = new THREE.CircleGeometry(0.22, 14); f.translate(hx, hy, 0.295); fs.push(f);
      }
      for (const y of [1.25, 0.6, -0.02, -0.66]) { const b = new THREE.BoxGeometry(3.3, 0.05, 0.05); b.translate(0, y, -0.1); bank.push(b); }
      for (const xx of [-1.6, 1.6]) { const b = new THREE.BoxGeometry(0.06, 2.0, 0.06); b.translate(xx, 0.3, -0.1); bank.push(b); }
      { const cw = new THREE.BoxGeometry(3.4, 0.04, 0.7); cw.translate(0, -0.95, 0.05); bank.push(cw); const rail = new THREE.BoxGeometry(3.4, 0.03, 0.03); rail.translate(0, -0.45, 0.38); bank.push(rail); }
      for (const q of bank) { q.applyMatrix4(D.matrix); steel.push(q); }
      for (const q of hs) { q.applyMatrix4(D.matrix); heads.push(q); }
      for (const q of fs) { q.applyMatrix4(D.matrix); faces.push(q); }
      this.glowAt.push(top.clone().add(tmp.set(aim.x - x, -top.y, aim.z - z).normalize().multiplyScalar(0.6)));
      O.push({ x0: x - 0.66, x1: x + 0.66, z0: z - 0.66, z1: z + 0.66, y0: 0, y1: HT + 2 });
    }
    const g = this.g;
    g.add(new THREE.Mesh(mergeAll(conc), lit(0x8d8a84, { roughness: 0.95 })), new THREE.Mesh(mergeAll(steel), this.steelM), new THREE.Mesh(mergeAll(heads), lit(0x3a4046, { metalness: 0.5 })));
    this.faceM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.1, 2.8), side: THREE.DoubleSide });
    g.add(new THREE.Mesh(mergeAll(faces), this.faceM));
    // a haze round each bank, and a faint beam down through the snowy air onto the field
    const glowT = canvasTex(64, 64, (c2, w, h) => { const gr = c2.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c2.fillStyle = gr; c2.fillRect(0, 0, w, h); });
    const sm = new THREE.SpriteMaterial({ map: glowT, color: new THREE.Color(1.6, 1.55, 1.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const beams = [];
    for (const p of this.glowAt) {
      const sp = new THREE.Sprite(sm); sp.position.copy(p); sp.scale.setScalar(7); g.add(sp);
      const L = p.distanceTo(aim), q = new THREE.CylinderGeometry(1.6, 13, L, 20, 1, true); q.translate(0, -L / 2, 0);
      const col = new Float32Array(q.attributes.position.count * 3); for (let i = 0; i < q.attributes.position.count; i++) { const f = Math.max(0, 1 + q.attributes.position.getY(i) / L) ** 1.5 * 0.035; col[i * 3] = f; col[i * 3 + 1] = f; col[i * 3 + 2] = f * 0.95; }
      q.setAttribute('color', new THREE.BufferAttribute(col, 3));
      D.position.copy(p); D.lookAt(aim); D.updateMatrix(); q.rotateX(-Math.PI / 2); q.applyMatrix4(D.matrix); beams.push(q.toNonIndexed());
    }
    { const geo = mergeAll(beams), cs = []; for (const b of beams) cs.push(...b.attributes.color.array); geo.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); m.renderOrder = 6; g.add(m); }
  },

  // ============================================================ the scoreboard
  _scoreboard(k) {
    const O = k.plan.obstacles, P = this.P, th = 56 * DEG, r = this.wallR(th) + 9, x = P.hx + r * Math.cos(th), z = P.hz + r * Math.sin(th);
    const yaw = Math.atan2(P.hx - x, P.hz - z), W = 7.2, Hb = 3.6, y0 = 3.2;
    this.sbCv = document.createElement('canvas'); this.sbCv.width = 1024; this.sbCv.height = 512;
    this.sbTex = new THREE.CanvasTexture(this.sbCv); this.sbTex.colorSpace = THREE.SRGBColorSpace; this.sbTex.anisotropy = 4;
    const g = this.g, grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = yaw; g.add(grp);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(W, Hb), new THREE.MeshBasicMaterial({ map: this.sbTex, color: new THREE.Color(1.35, 1.35, 1.35) })); face.position.set(0, y0 + Hb / 2, 0.09); grp.add(face);
    const box = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, Hb + 0.4, 0.16), lit(0x10231a)); box.position.set(0, y0 + Hb / 2, 0); grp.add(box);
    const legs = []; for (const d of [-2.6, 2.6]) { const q = new THREE.BoxGeometry(0.25, y0, 0.25); q.translate(d, y0 / 2, 0); legs.push(q); }
    grp.add(new THREE.Mesh(mergeAll(legs), lit(0x1c2126)));
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    for (const d of [-2.6, 2.6]) { const lx = x + d * cs, lz = z - d * sn; O.push({ x0: lx - 0.18, x1: lx + 0.18, z0: lz - 0.18, z1: lz + 0.18, y0: 0, y1: y0 + Hb }); }
    // the frame of bulbs round it, chasing; they go off with the wall's when one goes out
    const B = this.bulbList, put = (u, v) => { B.p.push(x + u * cs, v, z - u * sn); B.c.push(2.7, 1.9, 0.9); B.f.push(u * 0.3 + v, 0.5); B.s.push(1.7); };
    for (let u = -W / 2 - 0.2; u <= W / 2 + 0.2; u += 0.3) { put(u + 0.0, y0 - 0.2); put(u, y0 + Hb + 0.2); }
    for (let v = y0; v <= y0 + Hb; v += 0.3) { put(-W / 2 - 0.2, v); put(W / 2 + 0.2, v); }
    // (in the board's frame, for a ball that hits it: centre, normal, half width, bottom, top)
    this.sb = { x: x + 0.1 * sn, z: z + 0.1 * cs, nx: sn, nz: cs, hw: W / 2 + 0.2, y0: y0 - 0.2, y1: y0 + Hb + 0.2 };
    this._bulbs();
  },
  _board() {
    if (!this.sbCv) return;
    const c = this.sbCv.getContext('2d'), w = 1024, h = 512, on = this.on || this.phase === 'end';
    const key = [on, this.pitchN, this.hr, this.best, this.last].join();
    if (key === this._boardKey) return; this._boardKey = key;
    c.fillStyle = '#0c1d15'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#d9c38a'; c.lineWidth = 10; c.strokeRect(14, 14, w - 28, h - 28); c.lineWidth = 3; c.strokeRect(30, 30, w - 60, h - 60);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#efe4c0'; c.font = '800 64px system-ui,sans-serif'; c.fillText('BUTLER FIELD', w / 2, 82);
    c.fillStyle = '#ffb53a'; c.font = '700 34px system-ui,sans-serif'; c.fillText('❄  HOME RUN DERBY  ❄', w / 2, 140);
    const col = (x, label, val) => {
      c.fillStyle = '#d6cba8'; c.font = '700 34px system-ui,sans-serif'; c.fillText(label, x, 205);
      c.fillStyle = '#050c08'; c.fillRect(x - 105, 232, 210, 150);
      c.fillStyle = '#ffae2a'; c.shadowColor = '#ff9a10'; c.shadowBlur = 22; c.font = '800 124px ui-monospace,Menlo,monospace'; c.fillText(val, x, 312); c.shadowBlur = 0;
    };
    col(w * 0.2, 'PITCH', on ? String(Math.min(PITCHES, this.pitchN || 0)) : '-'); col(w * 0.5, 'HR', on ? String(this.hr || 0) : '-'); col(w * 0.8, 'BEST', String(this.best || 0));
    c.fillStyle = '#d6cba8'; c.font = '700 38px system-ui,sans-serif';
    c.fillText(this.last ? `LAST HOMER  ${this.last} FT` : on ? 'PLAY BALL' : 'STEP UP TO THE PLATE', w / 2, 438);
    this.sbTex.needsUpdate = true;
  },

  // The fence's mini lights (and the scoreboard's), in one instanced mesh with a shader of their own: they twinkle,
  // and on a home run a ring of white light runs out along the wall from where the ball went over, and they flash.
  _bulbs() {
    const B = this.bulbList, n = B.f.length / 2;
    const geo = new THREE.OctahedronGeometry(1, 0);
    geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(B.c), 3));
    geo.setAttribute('aPh', new THREE.InstancedBufferAttribute(new Float32Array(B.f), 2));
    const u = this.bu = { uT: { value: 0 }, uB: { value: 0 }, uS: { value: 0.5 }, uA: { value: 0 }, uC: { value: 0 } };
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = 'attribute vec3 aCol; attribute vec2 aPh; uniform float uT, uB, uS, uA, uC; varying vec3 vBulb;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        { float tw = 0.5 + 0.65 * pow(0.5 + 0.5 * sin(uT * (1.9 - uC * 1.4) + aPh.x * 6.2831), 3.0);
          float ring = exp(-pow((abs(aPh.y - uS) - uA * 0.5) * 12.0, 2.0));
          float strobe = step(0.5, fract(uT * 5.0 + aPh.y * 24.0)) * (1.0 - uC) + 0.5 * uC;     // (no flashing with Reduce motion on)
          vBulb = aCol * tw + uB * (vec3(2.6, 2.4, 1.9) * ring * 2.5 + aCol * (0.6 + 1.8 * strobe));
          transformed *= 1.0 + uB * (0.5 + ring * 1.2); }`);
      sh.fragmentShader = 'varying vec3 vBulb;\n' + sh.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( vBulb, opacity );');
    };
    const mesh = new THREE.InstancedMesh(geo, mat, n), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sc = new THREE.Vector3(), Ps = new THREE.Vector3();
    for (let i = 0; i < n; i++) { Ps.set(B.p[i * 3], B.p[i * 3 + 1], B.p[i * 3 + 2]); mesh.setMatrixAt(i, M.compose(Ps, Q, Sc.set(0.04, 0.062, 0.04).multiplyScalar(B.s[i]))); }
    mesh.frustumCulled = false; this.g.add(mesh);
    const wm = this.wire && this.wire.mesh(); if (wm) this.g.add(wm);
  },

  // ============================================================ the pitcher
  // Three balls of snow, coal eyes and a carrot, a striped scarf, a cap, stick arms: a mitt on the left, the ball in
  // the right. He pitches underhand, windmill style, as softball pitchers do.
  _pitcher(k) {
    const snow = lit(0xf3f6fa, { roughness: 0.85 }), coal = lit(0x161618), carrot = lit(0xe2702a), red = lit(0xc0392b), cream = lit(0xf0e6cf), navy = lit(0x1d2b55), stick = lit(0x5a3a20), mitt = lit(0x8a4f22);
    const root = this.pitcher = new THREE.Group(); root.position.copy(this.M); root.rotation.y = Math.atan2(this.H.x - this.M.x, this.H.z - this.M.z);
    const body = this.pBody = new THREE.Group(); root.add(body);
    const ball = (r, y, sy = 0.92) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), snow); m.scale.y = sy; m.position.y = y; body.add(m); return m; };
    ball(0.5, 0.44); ball(0.37, 1.16);
    for (const y of [1.0, 1.17, 1.34]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), coal); b.position.set(0, y, 0.355 - Math.abs(y - 1.16) * 0.25); body.add(b); }
    // the scarf, wound round and one end hanging
    const sc = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.065, 8, 20), red); sc.rotation.x = Math.PI / 2; sc.position.y = 1.47; body.add(sc);
    for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.04), i % 2 ? cream : red); t.position.set(0.14, 1.38 - i * 0.11, 0.3 - i * 0.012); t.rotation.z = 0.12; body.add(t); }
    // the head turns to watch the ball
    const head = this.pHead = new THREE.Group(); head.position.y = 1.7; body.add(head);
    { const m = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 12), snow); head.add(m); }
    { const n = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.26, 10), carrot); n.rotation.x = Math.PI / 2; n.position.set(0, -0.01, 0.37); head.add(n); }
    for (const sx of [-0.09, 0.09]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), coal); e.position.set(sx, 0.07, 0.235); head.add(e); }
    for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.32, e = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), coal); e.position.set(Math.sin(a) * 0.13, -0.1 + Math.cos(a) * 0.03 - 0.03, 0.225); head.add(e); }
    { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.255, 18, 8, 0, TAU, 0, Math.PI / 2), navy); cap.position.y = 0.1; cap.scale.y = 0.75; head.add(cap);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 16, 1, false, -Math.PI / 2, Math.PI), navy); brim.position.set(0, 0.1, 0.2); brim.scale.set(1, 1, 1.1); head.add(brim);
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), red); btn.position.y = 0.29; head.add(btn);
      const logo = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), red); logo.position.set(0, 0.2, 0.225); logo.rotation.x = -0.45; head.add(logo); }
    // arms: a pivot at each shoulder, a stick hanging from it with twigs at the end
    const arm = (side, withMitt) => {
      const pv = new THREE.Group(); pv.position.set(side * 0.33, 1.27, 0); body.add(pv);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.72, 6), stick); st.position.y = -0.36; pv.add(st);
      for (const a of [-0.5, 0.4]) { const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.16, 5), stick); tw.position.set(Math.sin(a) * 0.06, -0.72 - Math.cos(a) * 0.05, 0); tw.rotation.z = a; pv.add(tw); }
      const hand = new THREE.Object3D(); hand.position.set(0, -0.76, 0.02); pv.add(hand);
      if (withMitt) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), mitt); m.scale.set(0.6, 1, 1); m.position.set(0, -0.77, 0.04); pv.add(m); }
      return { pv, hand };
    };
    this.rArm = arm(-1, false); this.lArm = arm(1, true);
    this.rArm.pv.rotation.z = -0.15; this.lArm.pv.rotation.z = 0.15;
    this.g.add(root);
    // he is not to be driven through
    const M = this.M; k.plan.obstacles.push({ x0: M.x - 0.5, x1: M.x + 0.5, z0: M.z - 0.5, z1: M.z + 0.5, y0: 0, y1: 2.1 });
    this._pose(0, 0);
  },
  // the right arm's angle round the shoulder (0 hanging down, forward is positive), the glove arm raised by `glove`
  _pose(alpha, glove, lean = 0) {
    this.rArm.pv.rotation.x = -alpha; this.lArm.pv.rotation.x = -glove; this.pBody.rotation.x = lean;
  },

  // ============================================================ the snowballs, the powder, the fireworks
  _balls(k) {
    const g = this.g;
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(BR, 16, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, emissive: new THREE.Color(0.75, 0.8, 0.95), emissiveIntensity: 0.9 }));
    this.ball.visible = false; g.add(this.ball);
    const sh = canvasTex(32, 32, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: sh, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }));
    this.shadow.visible = false; this.shadow.renderOrder = 5; g.add(this.shadow);
    // a short trail of powder behind the ball, so it reads against the snow
    const NT = this.NT = 12;
    this.trail = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.6, 0.7), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }), NT);
    this.trail.frustumCulled = false; this.trail.visible = false; g.add(this.trail);
    this.trailP = new Float32Array(NT * 3); this.trailN = 0; this.trailHead = 0;
    // particles: one pool of powder, one of sparks
    const dot = canvasTex(32, 32, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    const pool = (n, size) => {
      const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3).fill(-999), col = new Float32Array(n * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: dot, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
      pts.frustumCulled = false; pts.renderOrder = 7; g.add(pts);
      return { pts, pos, col, n, vel: new Float32Array(n * 3), base: new Float32Array(n * 3), life: new Float32Array(n), max: new Float32Array(n), grav: new Float32Array(n), next: 0, live: 0 };
    };
    this.powder = pool(260, 0.16); this.sparks = pool(480, 0.9);
    this.fw = [];                                   // fireworks waiting to go up: [time, x, y, z, colour index]
    // the flash where the tail meets the ball
    this.flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: new THREE.Color(2.5, 2.4, 2.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.flash.visible = false; this.flash.scale.setScalar(0.6); g.add(this.flash); this.flashT = 0;
    this.bv = new THREE.Vector3(); this.P0 = new THREE.Vector3(); this.tmp = new THREE.Vector3(); this.tmp2 = new THREE.Vector3();
    this.cam = { at: { x: 0, y: 0, z: 0 }, look: { x: 0, y: 0, z: 0 } }; this.look = new THREE.Vector3(); this.camMix = 0;
  },
  _emit(P, x, y, z, n, speed, col, life, grav, up = 0) {
    for (let q = 0; q < n; q++) {
      const i = P.next; P.next = (P.next + 1) % P.n;
      const u = Math.random() * 2 - 1, a = Math.random() * TAU, rr = Math.sqrt(1 - u * u), sp = speed * (0.4 + Math.random() * 0.6);
      P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z;
      P.vel[i * 3] = rr * Math.cos(a) * sp; P.vel[i * 3 + 1] = Math.abs(u) * sp * (up ? 1 : Math.sign(u)) + up; P.vel[i * 3 + 2] = rr * Math.sin(a) * sp;
      P.base[i * 3] = col[0]; P.base[i * 3 + 1] = col[1]; P.base[i * 3 + 2] = col[2];
      P.life[i] = P.max[i] = life * (0.6 + Math.random() * 0.4); P.grav[i] = grav;
    }
    P.live = P.n;
  },
  _stepPool(P, dt) {
    if (!P.live) return;
    let any = 0;
    const drag = Math.exp(-1.6 * dt);
    for (let i = 0; i < P.n; i++) {
      if (P.life[i] <= 0) continue;
      P.life[i] -= dt;
      if (P.life[i] <= 0) { P.pos[i * 3 + 1] = -999; P.col[i * 3] = P.col[i * 3 + 1] = P.col[i * 3 + 2] = 0; continue; }
      any++;
      P.vel[i * 3] *= drag; P.vel[i * 3 + 2] *= drag; P.vel[i * 3 + 1] = P.vel[i * 3 + 1] * drag - P.grav[i] * dt;
      P.pos[i * 3] += P.vel[i * 3] * dt; P.pos[i * 3 + 1] = Math.max(0.03, P.pos[i * 3 + 1] + P.vel[i * 3 + 1] * dt); P.pos[i * 3 + 2] += P.vel[i * 3 + 2] * dt;
      const f = P.life[i] / P.max[i], b = f * f * (P === this.sparks && !this.calm ? 0.55 + 0.45 * Math.sin(this.t * 40 + i) : 1);
      P.col[i * 3] = P.base[i * 3] * b; P.col[i * 3 + 1] = P.base[i * 3 + 1] * b; P.col[i * 3 + 2] = P.base[i * 3 + 2] * b;
    }
    P.pts.geometry.attributes.position.needsUpdate = true; P.pts.geometry.attributes.color.needsUpdate = true;
    if (!any) P.live = 0;
  },
  _burst(x, y, z, big = 1) {
    this._emit(this.powder, x, Math.max(0.08, y), z, Math.round(26 * big), 2.6 * big, [0.75, 0.8, 0.9], 0.9, 5, 0.6);
    const k = this.k; k.synth.noise(0.28, { vol: 0.07 * Math.min(1.5, big), lp: 650 }); k.synth.note(120, 0.18, { type: 'sine', vol: 0.05 });
    this.ball.visible = false; this.shadow.visible = false; this.trail.visible = false; this.ball.scale.setScalar(1);
  },

  // ============================================================ the fans
  // Fourteen snowmen on the bleacher, no two alike: big and small, lumpy, shaded blue where the light does not reach,
  // with coal eyes and buttons, carrot noses and stick arms, scarves and bobble hats, earmuffs and the odd top hat, a
  // pennant here, a foam finger there. They sway and look about, and turn their heads to follow the ball. On a home run
  // they jump, wave their arms and throw their hats in the air.
  //
  // Each part is one instanced mesh (a body, a head, the arms, the scarves, each kind of hat, each kind of thing held),
  // coloured by its vertices, so the whole crowd is a dozen draw calls; the poses are worked out only while the toy is near.
  _rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; },
  // Where they stand (before the bleacher is drawn: the snow on its boards is cleared where a fan's feet are).
  _fanLayout() {
    const b = this.bleacher, r = this._rng(7), spots = this.fanSpots = [];
    const HATS = ['bobble', 'bobble', 'muffs', 'top', 'bobble', 'muffs', 'bobble', 'top', 'muffs', 'bobble', 'bobble', 'muffs', 'top', 'bobble'];
    const PROPS = { 1: 'pennant', 4: 'finger', 6: 'pennant', 9: 'finger', 12: 'pennant' };
    let n = 0;
    for (const [tier, count] of [[0, 5], [1, 5], [2, 4]]) {
      const span = b.z1 - b.z0 - 1.2, step = span / count;
      for (let j = 0; j < count; j++, n++) {
        const s = [0.82, 1.0, 1.12, 0.9, 0.78, 1.06, 0.95][n % 7] * (0.97 + r() * 0.06);
        spots.push({ tier, s, x: b.x - 0.48 - tier + (r() - 0.5) * 0.12, top: 0.4 * (tier + 1), z: b.z0 + 0.6 + step * (j + 0.5) + (r() - 0.5) * step * 0.4,
          hat: HATS[n % HATS.length], prop: PROPS[n] || null, ph: r() * TAU, rest: 1.65 + r() * 0.45, tilt: (r() - 0.5) * 0.25, toss: HATS[n % HATS.length] !== 'muffs' && r() < 0.8 });
      }
    }
  },
  // A material for the crowd: lit as usual, but glowing in its own vertex colours (so the shading baked into them shows
  // at night), with a few specks on the snow that catch the light and twinkle.
  _fanMat(o = {}) {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, emissive: new THREE.Color(0.5, 0.54, 0.62), ...o });
    const u = this.fanU;
    m.onBeforeCompile = sh => {
      sh.uniforms.uFT = u.uFT;
      sh.vertexShader = 'varying vec3 vSp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\nvSp = position * 60.0 + instanceMatrix[3].xyz * 7.0;\n#else\nvSp = position * 60.0;\n#endif');
      sh.fragmentShader = 'uniform float uFT; varying vec3 vSp;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        #if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
          totalEmissiveRadiance *= vColor.rgb;
          { float h = fract(sin(dot(floor(vSp), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
            float snow = step(0.8, min(vColor.r, min(vColor.g, vColor.b)));
            totalEmissiveRadiance += snow * step(0.982, h) * pow(max(0.0, sin(uFT * 2.1 + h * 300.0)), 6.0) * vec3(1.5, 1.6, 1.9); }
        #endif`);
    };
    return m;
  },
  _fans(k) {
    const spots = this.fanSpots, n = spots.length;
    this.fanU = { uFT: { value: 0 } };
    // ---- the shapes, each in its own frame: a body from the ground, a head from the neck, an arm from the shoulder, a held thing from the hand
    const prep = (q, col, light = true) => {
      const g = q.index ? q.toNonIndexed() : q; g.deleteAttribute('uv');
      const N = g.attributes.normal, c = new Float32Array(N.count * 3);
      for (let i = 0; i < N.count; i++) {
        // light from above and in front; snow in shadow goes blue, not grey
        const l = light ? Math.max(0, Math.min(1, 0.38 + 0.6 * N.getY(i) + 0.35 * N.getZ(i))) : 1;
        c[i * 3] = col[0] * (0.5 + 0.5 * l); c[i * 3 + 1] = col[1] * (0.58 + 0.42 * l); c[i * 3 + 2] = col[2] * (0.8 + 0.2 * l);
      }
      g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
    };
    const lumpy = (r, ws, hs, amp, seed) => {
      const q = new THREE.SphereGeometry(r, ws, hs), p = q.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i) / r, y = p.getY(i) / r, z = p.getZ(i) / r;
        const f = 1 + amp * (Math.sin(3.1 * x + seed) * Math.sin(2.7 * y + seed * 1.3) * Math.sin(3.5 * z + seed * 0.7) + 0.45 * Math.sin(7.3 * x + 5.1 * z + seed) * Math.sin(6.1 * y + seed * 2.1));
        p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f);
      }
      q.computeVertexNormals(); return q;
    };
    const SNOW = [1, 1, 1], COAL = [0.06, 0.06, 0.07], STICK = [0.42, 0.27, 0.15], CARROT = [1.0, 0.42, 0.1];
    const merge = list => mergeGeometries(list);
    const torso = merge([
      prep(lumpy(0.21, 18, 12, 0.06, 1.3).scale(1, 0.88, 1).translate(0, 0.19, 0), SNOW),
      prep(lumpy(0.155, 16, 11, 0.055, 4.1).translate(0, 0.47, 0), SNOW),
      ...[0.07, 0, -0.07].map(dy => prep(new THREE.SphereGeometry(0.018, 8, 6).translate(0, 0.47 + dy, Math.sqrt(0.155 ** 2 - dy * dy) + 0.004), COAL, false)),
    ]);
    const head = merge([
      prep(lumpy(0.12, 16, 12, 0.05, 2.7).translate(0, 0.11, 0), SNOW),
      ...[-1, 1].map(sx => prep(new THREE.SphereGeometry(0.017, 8, 6).translate(sx * 0.043, 0.14, 0.106), COAL, false)),
      ...[-2, -1, 0, 1, 2].map(i => prep(new THREE.SphereGeometry(0.009, 6, 4).translate(i * 0.022, 0.072 + Math.abs(i) * 0.007, 0.112 - Math.abs(i) * 0.008), COAL, false)),
      prep(new THREE.ConeGeometry(0.021, 0.13, 8).rotateX(Math.PI / 2 + 0.12).translate(0, 0.1, 0.175), CARROT),
    ]);
    const arm = merge([
      prep(new THREE.CylinderGeometry(0.0065, 0.0095, 0.3, 5).translate(0, 0.15, 0), STICK, false),
      ...[-0.55, 0.5].map(a => prep(new THREE.CylinderGeometry(0.004, 0.006, 0.075, 4).translate(0, 0.0375, 0).rotateZ(a).translate(0, 0.27, 0), STICK, false)),
    ]);
    const scarf = merge([
      prep(new THREE.TorusGeometry(0.104, 0.033, 7, 20).rotateX(Math.PI / 2).translate(0, 0.6, 0), [1, 1, 1]),
      ...[0, 1, 2].map(i => prep(new THREE.BoxGeometry(0.062, 0.06, 0.026).translate(0.055, 0.535 - i * 0.06, 0.128 - i * 0.004), i % 2 ? [0.62, 0.62, 0.62] : [1, 1, 1])),
      prep(new THREE.BoxGeometry(0.07, 0.012, 0.03).translate(0.055, 0.44, 0.122), [0.62, 0.62, 0.62]),
    ]);
    const hats = {
      bobble: merge([
        prep(new THREE.SphereGeometry(0.137, 16, 8, 0, TAU, 0, Math.PI * 0.56).scale(1, 1.2, 1).translate(0, 0.13, 0), [0.8, 0.8, 0.8]),
        prep(new THREE.TorusGeometry(0.132, 0.028, 6, 20).rotateX(Math.PI / 2).translate(0, 0.14, 0), [1, 1, 1]),
        prep(lumpy(0.052, 10, 8, 0.15, 3).translate(0, 0.31, 0), [1.3, 1.3, 1.3]),
      ]).rotateX(-0.14),
      top: merge([
        prep(new THREE.CylinderGeometry(0.088, 0.093, 0.2, 16).translate(0, 0.335, 0), [0.18, 0.18, 0.18]),
        prep(new THREE.CylinderGeometry(0.16, 0.16, 0.014, 20).translate(0, 0.232, 0), [0.18, 0.18, 0.18]),
        prep(new THREE.CylinderGeometry(0.0945, 0.0945, 0.035, 16).translate(0, 0.256, 0), [1, 1, 1]),
      ]).rotateZ(0.13),
      muffs: merge([
        prep(new THREE.TorusGeometry(0.13, 0.011, 6, 18, Math.PI).translate(0, 0.11, 0), [0.45, 0.45, 0.45]),
        ...[-1, 1].map(sx => prep(lumpy(0.05, 12, 8, 0.12, sx + 2).scale(0.62, 1, 1).translate(sx * 0.128, 0.1, 0), [1.1, 1.1, 1.1])),
      ]),
    };
    const flag = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.26, -0.055), new THREE.Vector2(0, -0.11)]);
    const props = {
      pennant: merge([
        prep(new THREE.CylinderGeometry(0.006, 0.006, 0.44, 5).translate(0, 0.17, 0), [0.5, 0.4, 0.32], false),
        prep(new THREE.ShapeGeometry(flag).translate(0, 0.38, 0), [1, 1, 1], false),
        prep(new THREE.ShapeGeometry(flag).rotateY(Math.PI).translate(0, 0.38, 0), [0.85, 0.85, 0.85], false),
      ]),
      finger: merge([
        prep(new THREE.BoxGeometry(0.1, 0.11, 0.05).translate(0, 0.04, 0), [1, 1, 1]),
        prep(new THREE.CapsuleGeometry(0.021, 0.12, 3, 8).translate(0.02, 0.17, 0), [1, 1, 1]),
        prep(new THREE.CapsuleGeometry(0.016, 0.035, 3, 6).rotateZ(1.2).translate(-0.06, 0.05, 0), [1, 1, 1]),
      ]),
    };
    // ---- the meshes
    const snowM = this._fanMat(), clothM = this._fanMat({ roughness: 0.95, emissive: new THREE.Color(0.42, 0.42, 0.45), side: THREE.DoubleSide });
    const inst = (geo, mat, count) => { const m = new THREE.InstancedMesh(geo, mat, Math.max(1, count)); m.count = count; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.g.add(m); return m; };
    const F = this.fanParts = { torso: inst(torso, snowM, n), head: inst(head, snowM, n), arm: inst(arm, snowM, n * 2), scarf: inst(scarf, clothM, n), hat: {}, prop: {} };
    const SCARF = [0xd63a2f, 0x2f7fd6, 0x2fae5a, 0xf2c12e, 0x9a4fc2, 0xf07c2a, 0x1fb5b0, 0xe84f9a];
    const HATC = { bobble: [0xd63a2f, 0x2f7fd6, 0xf2c12e, 0x2fae5a, 0xe84f9a, 0xf07c2a, 0xffffff], top: [0xb02a2a, 0x2a5fb0, 0x2f9a5a], muffs: [0xf26ab0, 0x8fd0ff, 0xffd34a, 0xc6a0ff] };
    const PROPC = { pennant: [0xd63a2f, 0x2f7fd6, 0xf2c12e], finger: [0x38c45a, 0xffd23a] };
    const col = new THREE.Color();
    for (const [kind, geo] of Object.entries(hats)) { const list = spots.filter(f => f.hat === kind); const m = F.hat[kind] = inst(geo, clothM, list.length); list.forEach((f, i) => { f.hatI = i; m.setColorAt(i, col.set(HATC[kind][i % HATC[kind].length])); }); }
    for (const [kind, geo] of Object.entries(props)) { const list = spots.filter(f => f.prop === kind); const m = F.prop[kind] = inst(geo, clothM, list.length); list.forEach((f, i) => { f.propI = i; m.setColorAt(i, col.set(PROPC[kind][i % PROPC[kind].length])); }); }
    spots.forEach((f, i) => {
      F.scarf.setColorAt(i, col.set(SCARF[(i * 3) % SCARF.length]));
      // facing the game: between the plate and the mound
      const tx = this.H.x + this.c.x * 4 - f.x, tz = this.H.z + this.c.z * 4 - f.z; f.yaw = Math.atan2(tx, tz) + (f.ph - Math.PI) * 0.06;
      f.hy = 0; f.hp = 0; f.toss = f.toss ? 1 : 0; f.tossAt = -9;
      k.plan.obstacles.push({ x0: f.x - 0.22 * f.s, x1: f.x + 0.22 * f.s, z0: f.z - 0.22 * f.s, z1: f.z + 0.22 * f.s, y0: f.top, y1: f.top + 0.95 * f.s });
    });
    this.fanM = { body: new THREE.Matrix4(), head: new THREE.Matrix4(), t: new THREE.Matrix4(), t2: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), p: new THREE.Vector3(), s: new THREE.Vector3(), one: new THREE.Vector3(1, 1, 1) };
    this._fanStep(0, true);
    for (const m of [F.torso, F.head, F.arm, F.scarf, ...Object.values(F.hat), ...Object.values(F.prop)]) { m.computeBoundingSphere(); if (m.boundingSphere) m.boundingSphere.radius += 2.5; }
  },
  // Every hat that can be thrown, thrown (a home run).
  hatsOff() { if (!this.fanSpots) return; for (const f of this.fanSpots) if (f.toss) f.tossAt = this.t + 0.15 + Math.random() * 0.35; },
  // The crowd's poses: idle sway, heads that follow the ball, and the cheer (this.cheer, 0 to 1).
  _fanStep(dt, force = false) {
    const F = this.fanParts; if (!F) return;
    if (!force && !this.on && !(this.cheer > 0.01) && !(this.k && this.k.close({ x: this.bleacher.x - 1.5, y: 0, z: (this.bleacher.z0 + this.bleacher.z1) / 2 }, 45, 20))) return;
    const t = this.t || 0, M = this.fanM, ch = this.cheer || 0, a = Math.min(1, ch * 1.6) * (this.calm ? 0.4 : 1);
    this.fanU.uFT.value = this.calm ? 0 : t;
    const ball = this.ball && this.ball.visible ? this.ball.position : null;
    this.fanSpots.forEach((f, i) => {
      // the body: a gentle sway, a hop when the crowd is up
      const jump = a * Math.max(0, Math.sin(t * (9 + (i % 3)) + f.ph)) * 0.3 * f.s;
      const sway = this.calm ? 0 : 1;
      M.p.set(f.x, f.top + jump, f.z);
      M.e.set(sway * Math.sin(t * 0.9 + f.ph) * 0.025, f.yaw + sway * Math.sin(t * 0.37 + f.ph) * 0.08, f.tilt * 0.3 + sway * Math.sin(t * 0.7 + f.ph * 2) * 0.035);
      M.body.compose(M.p, M.q.setFromEuler(M.e), M.s.setScalar(f.s));
      F.torso.setMatrixAt(i, M.body); F.scarf.setMatrixAt(i, M.body);
      // the head: watching the ball if there is one in the air, else looking about the field
      let wy, wp;
      if (ball) { const dx = ball.x - f.x, dz = ball.z - f.z, dy = ball.y - (f.top + 0.75 * f.s); wy = Math.atan2(dx, dz) - f.yaw; wp = -Math.atan2(dy, Math.hypot(dx, dz)) * 0.7; }
      else { wy = Math.sin(t * 0.23 + f.ph * 3) * 0.45 + Math.sin(t * 0.61 + f.ph) * 0.15; wp = -0.05 + Math.sin(t * 0.3 + f.ph) * 0.08; }
      wy = Math.atan2(Math.sin(wy), Math.cos(wy)); wy = Math.max(-1.2, Math.min(1.2, wy)); wp = Math.max(-0.6, Math.min(0.35, wp)) - a * 0.25;
      const kk = dt ? Math.min(1, dt * (ball ? 7 : 2)) : 1; f.hy += (wy - f.hy) * kk; f.hp += (wp - f.hp) * kk;
      M.t.compose(M.p.set(0, 0.62, 0), M.q.setFromEuler(M.e.set(f.hp, f.hy, f.tilt)), M.one);
      M.head.multiplyMatrices(M.body, M.t); F.head.setMatrixAt(i, M.head);
      // the hat: on the head, or up in the air and back down onto it
      if (f.hat) {
        const u = (t - f.tossAt) / 1.15;
        if (u > 0 && u < 1) {
          M.t.compose(M.p.set(0, 0.22, 0), M.q.setFromEuler(M.e.set(-TAU * 2 * u, 0, 0.3 * Math.sin(u * 9))), M.one); M.t2.makeTranslation(0, -0.22, 0); M.t.multiply(M.t2);
          M.t2.makeTranslation(0, 4.2 * u * (1 - u) * f.s, 0); M.t2.multiply(M.head); M.t2.multiply(M.t);
          F.hat[f.hat].setMatrixAt(f.hatI, M.t2);
        } else F.hat[f.hat].setMatrixAt(f.hatI, M.head);
      }
      // the arms: hanging out from the shoulders, or waving over the head; a pennant or a foam finger held up high
      for (const side of [-1, 1]) {
        const holding = side === 1 && f.prop;
        let ang = holding ? 0.55 + Math.sin(t * 1.3 + f.ph) * (this.calm ? 0 : 0.12) : f.rest + (this.calm ? 0 : Math.sin(t * 0.8 + f.ph + side) * 0.06);
        const up = 0.25 + (holding ? 0.25 * Math.sin(t * 13 + f.ph) : 0.55 * Math.sin(t * 12 + f.ph + side)) * (this.calm ? 0.3 : 1);
        ang += (up - ang) * a;
        M.t.compose(M.p.set(side * 0.13, 0.5, 0.01), M.q.setFromEuler(M.e.set(0.25, 0, -side * ang)), M.one);
        M.t2.multiplyMatrices(M.body, M.t); F.arm.setMatrixAt(i * 2 + (side + 1) / 2, M.t2);
        if (holding) { M.t.makeTranslation(0, 0.29, 0); M.t2.multiply(M.t); M.t.makeRotationY(f.prop === 'pennant' ? -0.6 : 0); M.t2.multiply(M.t); F.prop[f.prop].setMatrixAt(f.propI, M.t2); }
      }
    });
    for (const m of [F.torso, F.head, F.arm, F.scarf, ...Object.values(F.hat), ...Object.values(F.prop)]) m.instanceMatrix.needsUpdate = true;
  },

  // ============================================================ the derby
  near(v, k) {
    if (!this.P) return null;
    if (this.on) return { verb: 'LEAVE', hint: 'Swing as the ball reaches the plate: Space, or SWING.', act: () => this._stop(k, true) };
    const b = this.box, p = v.pos;
    if ((p.x - b.x) ** 2 + (p.z - b.z) ** 2 > 1.1 * 1.1 || Math.abs(p.y) > 0.4) return null;
    if (v.kind !== 'car') return { verb: 'BAT', hint: 'The snowman pitches to cars: the drone can only watch.', act: () => k.say('The snowman pitches to cars. Come back in one.', 3) };
    return { verb: 'BAT', hint: 'Home Run Derby. E (or BAT) to step up to the plate.', act: () => this._start(k) };
  },
  _start(k) {
    const v = k.v; if (!v || v.kind !== 'car') return;
    this.on = true; this.pitchN = 0; this.hr = 0; this.last = 0; this.phase = 'ready'; this.tNext = this.t + 1.8; this.result = '';
    this.order = ORDER.slice(); for (let i = this.order.length - 1; i > 1; i--) { const j = 1 + Math.floor(Math.random() * i); [this.order[i], this.order[j]] = [this.order[j], this.order[i]]; }
    this.swingT = -9; this.contactAt = -1; this._press = false; this._cool = v.cool;
    // where the car's tail points when it is waiting, cocked back towards the catcher (see _yawFor)
    this.psiC = Math.atan2(-this.s.z, -this.s.x); this.psi = this.psiC + 70 * DEG;
    v.place(this.box.x, this.box.z, this._yawFor(this.psi));
    const jb = document.getElementById('bJump'); if (jb) { this._jumpLabel = jb.textContent; jb.textContent = 'SWING'; jb.setAttribute('aria-label', 'Swing'); }
    k.say(matchMedia('(pointer: coarse)').matches ? 'Ten pitches. Tap SWING as the ball reaches the plate.' : 'Ten pitches. Space to swing as the ball reaches the plate.', 4);
    this._hud(); this._board();
    k.synth.chime([392, 523, 659], { gap: 0.12, dur: 0.5, vol: 0.04 });
  },
  _stop(k, quit = false) {
    if (!this.on && this.phase === 'off') return;
    this.on = false; this.phase = 'off'; this.ball.visible = false; this.shadow.visible = false; this.trail.visible = false;
    const jb = document.getElementById('bJump'); if (jb && this._jumpLabel) { jb.textContent = this._jumpLabel; jb.setAttribute('aria-label', 'Jump'); }
    if (!quit && this.hr > this.best) { this.best = this.hr; try { localStorage.setItem('after-hours.derby.best', String(this.best)); } catch { /* private window */ } }
    this._hud(null); this._pose(0, 0); this._board();
  },
  // the car's yaw that points its tail along angle psi (on the ground, x = cos, z = sin): the tail is -(sin yaw, cos yaw)
  _yawFor(psi) { return Math.atan2(-Math.cos(psi), -Math.sin(psi)); },
  _hud(text) {
    if (!this.hudEl) { const d = this.hudEl = document.createElement('div'); d.id = 'derbyHud'; d.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 58px);left:50%;transform:translateX(-50%);padding:4px 12px;border-radius:10px;background:rgba(10,14,22,.62);color:#f3efe2;font:600 17px/1.3 ui-monospace,Menlo,monospace;letter-spacing:.04em;pointer-events:none;z-index:30;text-align:center;white-space:nowrap'; document.body.append(d); }
    if (text === null) { this.hudEl.hidden = true; this._hudKey = null; return; }
    const s = `PITCH ${Math.max(1, Math.min(PITCHES, this.pitchN || 1))}/${PITCHES} · HR ${this.hr}${this.result ? ' · ' + this.result : ''}`;
    if (s !== this._hudKey) { this.hudEl.textContent = s; this._hudKey = s; } this.hudEl.hidden = false;
  },

  active(k) {
    if (!this.P) return false;
    const p = k.pos, d = Math.hypot(p.x - (this.P.hx + 22), p.z - (this.P.hz + 22));
    this.g.visible = d < 330;
    if (this.pool) { const F = k.plan.finale; this.pool.visible = !(F && F.doorsK > 0); }      // no glow hanging over the open silo
    return this.on || this.phase !== 'off' || d < 150 || this.powder.live || this.sparks.live;
  },
  update(dt, k) {
    this.t += dt; const t = this.t;
    this.calm = !!(k.G.set && k.G.set.reduce);
    if (this.bu) { this.bu.uT.value = t; this.bu.uC.value = this.calm ? 1 : 0; if (this.bu.uB.value > 0) { this.bu.uB.value = Math.max(0, this.bu.uB.value - dt / 3.2); this.bu.uA.value += dt; } }
    const v = k.v;
    if (this.on && (!v || v.kind !== 'car' || Math.hypot(v.pos.x - this.box.x, v.pos.z - this.box.z) > 2)) this._stop(k, true);   // carried off, or a new night
    if (this.on) this._play(dt, k, v);
    else if (this.phase === 'end') { if (t > this.tNext) this.phase = 'off'; }
    else {
      // waiting on the mound: he bounces the ball in his hand, now and then
      const b = Math.max(0, Math.sin(t * 1.3)) * 0.25; this._pose(0.35 + b, 0.5, 0); this.pHead.rotation.y = Math.sin(t * 0.4) * 0.3;
      if (k.close(this.H, 7, 1.2) && !this.on) k.once('derby-intro', 'A snowman on the mound, a ball in his hand. Pull into the batter’s box beside the plate.', 6);
    }
    // the crowd, the fans, the flash, the fireworks, the powder
    this.cheer = Math.max(0, this.cheer - dt * 0.28);
    if (this.crowd) this.crowd.set(this.on ? 0.012 + this.cheer * 0.13 : this.cheer * 0.13 > 0.002 ? this.cheer * 0.13 : 0, this.cheer > 0.5 ? 0.12 : 0.5);
    this._fanStep(dt);
    if (this.flashT > 0) { this.flashT -= dt; this.flash.visible = this.flashT > 0; this.flash.material.opacity = Math.max(0, this.flashT / 0.18); }
    for (let i = this.fw.length - 1; i >= 0; i--) { const f = this.fw[i]; if (t >= f[0]) { this._firework(f[1], f[2], f[3], f[4]); this.fw.splice(i, 1); } }
    this._stepPool(this.powder, dt); this._stepPool(this.sparks, dt);
  },
  _firework(x, y, z, ci) {
    const col = COLS[ci % COLS.length], k = this.k;
    this._emit(this.sparks, x, y, z, 90, 11, col, 2.0, 2.2);
    this._emit(this.sparks, x, y, z, 30, 5, [2.6, 2.5, 2.2], 1.3, 2.2);
    k.synth.noise(0.7, { vol: 0.11, lp: 420 }); for (let i = 0; i < 6; i++) k.synth.noise(0.04, { vol: 0.03, lp: 7000, at: 0.25 + i * 0.07 + Math.random() * 0.05 });
  },

  _play(dt, k, v) {
    const t = this.t;
    // the car stays in the box; only its own hop moves it, and the swing turns it
    if (!this.swinging && this.phase !== 'off') {
      const swung = this._press || v.cool > this._cool + 1e-6;     // (a jump sets the cool-down back up: Space, the button, a pad)
      this._press = false;
      if (swung && t - this.swingT > 0.4) this._swing(k);
    } else this._press = false;
    this._cool = v.cool;
    if (this.swinging) {
      const u = Math.min(1, (t - this.swingT) / 0.42); this.psi = this.psiC + 70 * DEG - TAU * (1 - (1 - u) ** 3);
      if (u >= 1) { this.swinging = false; this.psi = this.psiC + 70 * DEG; }
    }
    v.pos.x = this.box.x; v.pos.z = this.box.z; v.vel.x = v.vel.z = 0; v.speed = 0; v.yaw = this._yawFor(this.psi); v.sync(0);
    if (this.contactAt > 0 && t >= this.contactAt) { const at = this.contactAt; this.contactAt = -1; this._contact(k, at); }

    const ph = this.phase;
    if (ph === 'ready') {
      this._pose(0.3, 0.6, 0); this.pHead.rotation.y *= 0.9;
      if (t >= this.tNext) {
        this.kind = KINDS[this.order[this.pitchN] || 'straight']; this.kindName = this.order[this.pitchN] || 'straight';
        this.phase = 'windup'; this.t0 = t; this.pitchN++; this.ball.scale.setScalar(1); this.result = ''; this.hitType = null; this.swung = false; this._hud(); this._board();
        // the wind-up: a rising whirr as the arm goes round
        for (let i = 0; i < 6; i++) k.synth.note(180 + i * 70, 0.16, { type: 'triangle', vol: 0.018, at: this.kind.wind * (0.25 + 0.13 * i) });
      }
    } else if (ph === 'windup') {
      const u = Math.min(1, (t - this.t0) / this.kind.wind);
      this._pose(15 * DEG + 360 * DEG * u ** 2.2, 0.6 + Math.sin(Math.PI * u) * 1.2, Math.sin(Math.PI * u) * 0.12 - 0.05 * u);
      this.pitcher.updateMatrixWorld(true); this.rArm.hand.getWorldPosition(this.ball.position); this.ball.visible = true;
      if (u >= 1) {
        // let go: the ball's path is laid out from his hand to the sweet spot, to arrive exactly T seconds from now
        this.P0.copy(this.ball.position); this.tRel = t; this.tArr = t + this.kind.T * rnd(0.94, 1.06); this.curveSign = Math.random() < 0.5 ? -1 : 1;
        const K = this.kind, len = this.P0.distanceTo(this.hit); this.vPlate = Math.hypot(len, 4 * K.arc, 4 * K.curve) / (this.tArr - this.tRel);
        this.phase = 'flight'; this.trailN = 0; this.trail.visible = true; this.shadow.visible = true;
        k.synth.noise(0.22, { vol: 0.045, lp: 1500 });
      }
    } else if (ph === 'flight') {
      const u = Math.min(1, (t - this.t0 - this.kind.wind) / 0.35); this._pose(375 * DEG + 50 * DEG * Math.sin(u * Math.PI / 2), 0.6, 0.12 * (1 - u));
      const s = (t - this.tRel) / (this.tArr - this.tRel);
      if (s <= 1) this._pathAt(s, this.ball.position);
      else { this.ball.position.addScaledVector(this.bv, dt); this.bv.y -= GRAV * dt * 0.5; if (this.ball.position.y < BR + 0.01) { this.ball.position.y = BR + 0.01; this.bv.y = 0; } }
      if (s <= 1) { const K = this.kind, d = 4 - 8 * s; this.bv.subVectors(this.hit, this.P0); this.bv.y += K.arc * d; this.bv.addScaledVector(this.s, K.curve * d * this.curveSign).multiplyScalar(1 / (this.tArr - this.tRel)); }
      // past the plate untouched: a strike, and on into the backstop
      const back = (this.ball.position.x - this.H.x) * -this.c.x + (this.ball.position.z - this.H.z) * -this.c.z;
      if (s > 1 && (back > 4.1 || t - this.tArr > 0.45)) {
        this._burst(this.ball.position.x, this.ball.position.y, this.ball.position.z, 0.6);
        this._outcome(k, 'STRIKE'); k.synth.note(110, 0.3, { type: 'sawtooth', vol: 0.02 });
      }
      this._trail();
    } else if (ph === 'hit') this._fly(dt, k);
    else if (ph === 'after') {
      this._pose(0.3, 0.6, 0);
      if (t >= this.tNext) {
        if (this.pitchN >= PITCHES) { this._end(k); return; }
        this.phase = 'ready'; this.tNext = t + 0.5;
      }
    }
    // the head follows the ball
    if (this.ball.visible) { const dx = this.ball.position.x - this.M.x, dz = this.ball.position.z - this.M.z, want = Math.atan2(dx, dz) - this.pitcher.rotation.y; let a = Math.atan2(Math.sin(want), Math.cos(want)); a = Math.max(-1.3, Math.min(1.3, a)); this.pHead.rotation.y += (a - this.pHead.rotation.y) * Math.min(1, dt * 8); }
    this._camera(dt);
    k.camClose = this.cam;
  },
  _pathAt(s, out) {
    const K = this.kind, a = 4 * s * (1 - s);
    out.lerpVectors(this.P0, this.hit, s); out.y += K.arc * a; out.addScaledVector(this.s, K.curve * a * this.curveSign);
    return out;
  },
  _trail() {
    const P = this.trailP, i = this.trailHead; P[i * 3] = this.ball.position.x; P[i * 3 + 1] = this.ball.position.y; P[i * 3 + 2] = this.ball.position.z;
    this.trailHead = (i + 1) % this.NT; this.trailN = Math.min(this.NT, this.trailN + 1);
    const M = this._tm4 || (this._tm4 = new THREE.Matrix4()), Q = this.tmpQ || (this.tmpQ = new THREE.Quaternion()), Sv = this.tmp2, Pv = this.tmp;
    for (let q = 0; q < this.NT; q++) {
      const j = (this.trailHead - 1 - q + this.NT * 2) % this.NT, sc = q < this.trailN ? BR * 0.85 * this.ball.scale.x * (1 - q / this.NT) : 0;
      Pv.set(P[j * 3], P[j * 3 + 1], P[j * 3 + 2]); Sv.setScalar(sc); this.trail.setMatrixAt(q, M.compose(Pv, Q, Sv));
    }
    this.trail.instanceMatrix.needsUpdate = true;
    this.shadow.position.set(this.ball.position.x, 0.04, this.ball.position.z); this.shadow.scale.setScalar(1 + this.ball.position.y * 0.5);
  },
  _swing(k) {
    this.swinging = true; this.swingT = this.t; this.contactAt = this.t + 0.03;
    k.synth.noise(0.16, { vol: 0.05, lp: 1300 });
  },
  // The tail comes round. How far the ball is from the sweet spot just then decides the hit.
  _contact(k, at) {
    if (this.swung) return;                                      // one swing a pitch
    this.swung = true;
    if (this.phase !== 'flight' || this.hitType) return;
    const e = at - this.tArr, d = e < 0 ? -e * this.vPlate : e * this.vPlate * 1.5;
    let type = null;
    if (d <= BANDS[0]) type = 'hr'; else if (d <= BANDS[1]) type = 'fly'; else if (d <= BANDS[2]) type = 'line'; else if (d <= BANDS[3]) type = 'ground';
    if (!type) { this.swung = true; this.result = 'SWING AND A MISS'; this._hud(); return; }
    this.hitType = type;
    if (e > 0) this.ball.position.copy(this.hit);                  // late: met on the plate (early, out in front of it)
    // early pulls it towards third (θ small), late pushes it to first; perfect is up the middle
    const th = 45 * DEG + Math.sign(e) * (d / BANDS[3]) * 64 * DEG + rnd(-6, 6) * DEG;
    const [sp, el] = type === 'hr' ? [rnd(31, 34), rnd(28, 33)] : type === 'fly' ? [19 + 5 * (1 - (d - BANDS[0]) / (BANDS[1] - BANDS[0])), rnd(38, 48)] : type === 'line' ? [rnd(19, 23), rnd(8, 15)] : [rnd(11, 14), rnd(-8, 0)];
    const h = sp * Math.cos(el * DEG); this.bv.set(h * Math.cos(th), sp * Math.sin(el * DEG), h * Math.sin(th));
    this.phase = 'hit'; this.over = false; this.bounces = 0; this.tHit = this.t; this.peakR = 0;
    // the crack, a flash, a puff of snow off the ball
    const q = type === 'hr' ? 1 : type === 'fly' ? 0.8 : 0.6;
    k.synth.noise(0.06, { vol: 0.25 * q, lp: 9000 }); k.synth.note(2500, 0.04, { type: 'square', vol: 0.04 * q }); k.synth.note(760, 0.12, { type: 'triangle', vol: 0.08 * q });
    this.flash.position.copy(this.ball.position); this.flashT = 0.18; this.flash.visible = true;
    this._emit(this.powder, this.ball.position.x, this.ball.position.y, this.ball.position.z, 14, 2.2, [0.8, 0.85, 0.95], 0.5, 3);
    if (type === 'hr') this.cheer = Math.max(this.cheer, 0.35);
  },
  // A hit, flying: gravity, a little drag, the wall, the scoreboard, the ground.
  _fly(dt, k) {
    const b = this.ball.position, v = this.bv, P = this.P;
    const n = Math.max(1, Math.ceil(dt * v.length() / 0.4)), h = dt / n;
    for (let i = 0; i < n && this.phase === 'hit'; i++) {
      v.y -= GRAV * h; v.multiplyScalar(1 - 0.03 * h); b.addScaledVector(v, h);
      const dx = b.x - P.hx, dz = b.z - P.hz, r = Math.hypot(dx, dz), th = Math.atan2(dz, dx), fair = dx >= -0.05 && dz >= -0.05;
      this.peakR = Math.max(this.peakR, r);
      if (fair && !this.over) {
        const R = this.wallR(th) - 0.12 - BR;
        if (r >= R) {
          if (b.y > P.wall + BR) { this.over = true; this._homer(k, th); }
          else { b.x = P.hx + R * Math.cos(th); b.z = P.hz + R * Math.sin(th); this._burst(b.x, b.y, b.z, 0.9); this._outcome(k, 'OFF THE WALL'); this.cheer = Math.max(this.cheer, 0.3); return; }
        }
      }
      // the scoreboard
      const S = this.sb, ox = b.x - S.x, oz = b.z - S.z, nd = ox * S.nx + oz * S.nz, lat = ox * S.nz - oz * S.nx;
      if (Math.abs(nd) < 0.25 && Math.abs(lat) < S.hw && b.y > S.y0 && b.y < S.y1) { this._burst(b.x, b.y, b.z, 1.4); this._landed(k, r, true); return; }
      if (b.y <= BR) {
        b.y = BR;
        if (!fair && !this.over) { this._burst(b.x, b.y, b.z, 0.8); this._outcome(k, 'FOUL'); return; }
        if (!this.over && (this.hitType === 'ground' || this.hitType === 'line') && this.bounces < 2 && -v.y < 8) {
          this.bounces++; v.y = -v.y * 0.32; v.x *= 0.62; v.z *= 0.62; this._emit(this.powder, b.x, 0.08, b.z, 8, 1.5, [0.7, 0.75, 0.85], 0.5, 4);
          continue;
        }
        this._burst(b.x, b.y, b.z, this.over ? 1.3 : 1); this._landed(k, r); return;
      }
    }
    { const c = this.cam.at, d = Math.hypot(b.x - c.x, b.y - c.y, b.z - c.z); this.ball.scale.setScalar(Math.max(1, d / 9)); }
    if (this.t - this.tHit > 7) { this._burst(b.x, b.y, b.z); this._landed(k, Math.hypot(b.x - P.hx, b.z - P.hz)); return; }
    this._trail();
  },
  _landed(k, r, board = false) {
    if (this.over) { this.last = Math.round(r * 3.281); this._board(); this._outcome(k, board ? 'OFF THE SCOREBOARD' : `HOME RUN · ${this.last} FT`, 2.8); return; }
    this._outcome(k, NAMES[this.hitType] || 'IN PLAY');
  },
  // Over the wall: the lights go off along it from where the ball went over, the fans go up, the fireworks too.
  _homer(k, th) {
    this.hr++; this.result = 'HOME RUN'; tonight(n => { n.homeRuns = (n.homeRuns || 0) + 1; n.bestRound = Math.max(n.bestRound || 0, this.hr); }); this._hud(); this._board();
    const u = this.bu; u.uB.value = 1; u.uA.value = 0; u.uS.value = th / (Math.PI / 2);
    this.cheer = 1; this.hatsOff();
    const first = k.find('derbyhr');
    if (this.hr === 5 && k.find('derby5')) k.callout('FIVE HOMERS'); else k.callout(first ? 'FIRST HOME RUN' : 'HOME RUN');
    // the organ: da-da-da-DAH, da-DAAH
    [[392, 0], [523, 0.14], [659, 0.28], [784, 0.42], [659, 0.7], [784, 0.84]].forEach(([f, at], i) => k.synth.note(f, i === 5 ? 0.9 : i === 3 ? 0.3 : 0.14, { type: 'square', vol: 0.022, at: at + 0.15 }));
    const r = this.wallR(th) + 2;
    for (let i = 0; i < 4; i++) { const a = th + (i % 2 ? 1 : -1) * (0.08 + 0.05 * i); this.fw.push([this.t + 0.3 + i * 0.38, this.P.hx + r * Math.cos(a), 15 + i * 2.2, this.P.hz + r * Math.sin(a), Math.floor(Math.random() * 6)]); }
  },
  _outcome(k, word, hold = 1.5) {
    this.result = word === 'STRIKE' && this.swung ? 'SWING AND A MISS' : word;
    this.phase = 'after'; this.tNext = this.t + hold; this.ball.visible = false; this.shadow.visible = false; this.trail.visible = false;
    this._hud();
  },
  _end(k) {
    const n = this.hr, prev = this.best;
    this._stop(k);
    this.phase = 'end'; this.tNext = this.t + 3;
    k.say(n === 0 ? 'Ten pitches, no home runs. The snowman tips his cap.' : `${n} home run${n === 1 ? '' : 's'} in ten pitches.${n > prev ? ' A new best.' : ` Best ${this.best}.`}`, 4);
    this._board();
  },
  // The camera stands behind the plate, a little to the first-base side, looking out at the mound; a hit, it watches.
  _camera(dt) {
    const H = this.H, c = this.c, s = this.s, cam = this.cam, b = this.ball.position;
    const follow = this.phase === 'hit' || (this.phase === 'after' && this.hitType);
    this.camMix += ((follow ? 1 : 0) - this.camMix) * Math.min(1, dt * (follow ? 3 : 1.5));
    const m = this.camMix;
    cam.at.x = H.x - c.x * (2.9 + m * 1.5) - s.x * 0.55; cam.at.z = H.z - c.z * (2.9 + m * 1.5) - s.z * 0.55; cam.at.y = 1.1 + m * 2.4;
    const lx = this.M.x, ly = 0.75, lz = this.M.z;
    if (this.phase === 'hit') this.look.lerp(b, Math.min(1, dt * 6)); else if (!follow) this.look.set(lx, ly, lz);
    cam.look.x = lx + (this.look.x - lx) * m; cam.look.y = ly + (this.look.y - ly) * m; cam.look.z = lz + (this.look.z - lz) * m;
  },

  spots() {
    if (!this.box) return [];
    return [{ kind: 'secret', id: 'derbyhr', name: 'Home Run Derby (one over the wall)', x: this.box.x, y: 0, z: this.box.z }, { kind: 'secret', id: 'derby5', name: 'Home Run Derby (five in a round)', x: this.box.x, y: 0, z: this.box.z }];
  },
  reset(k) {
    if (!this.P) return;
    this._stop(k, true); this.phase = 'off'; this.cheer = 0; this.fw.length = 0; if (this.bu) this.bu.uB.value = 0;
  },
});
