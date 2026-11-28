// The Michigan Avenue lobby, made somewhere to start from (features.js):
//   * the coat check, at the north end against the front wall: a walnut counter with a marble top, a bell, a lamp, and
//     rails of coats behind it. It is the Lost & Found (src/lostfound.js hands things in here, plan.coatCheck), and the
//     gap behind the counter, under the coats, is where a toy hides from the lobby's robot (src/guards.js).
//   * the museum map: a lit directory board on a stand, turned to the front doors. Drive up to it and MAP opens the big
//     map (src/map.js), the one the radar opens.
//   * the room itself (_dress): a border of dark marble let into the floor and a compass rose in front of the doors,
//     walnut panelling to dado height with a rail, two benches against the west wall facing the picture frame, and brass
//     wall lights left burning all night, each with its wash on the wall and its pool on the floor. The same lights run
//     on through the members' room and the service corridor beyond (F1-member, B1-north), which is the last of the way
//     the north mouse runs home (src/mice.js: it comes into the members' room from the Fullerton Hall lobby now, not
//     up the entrance hall, where no mouse sits or runs). Flat things and lights only, but for the benches, which are solid as drawn and which the
//     lobby's robot knows about (guardplan.js shut). Each kind is one merged mesh.
import * as THREE from 'three';
import { once } from './budget.js';      // (a canvas painted once: on a phone it is let go once it is on the graphics card)
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { fitText } from './textures.js';
import { feature, features } from './features.js';
import { shut } from './guardplan.js';

const canvasTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(once(cv)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, emissive: new THREE.Color(color).multiplyScalar(0.3), ...o });
const rng = s => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

feature({
  id: 'lobby',
  init(k) {
    const P = k.plan, L = P.byId[P.front && P.front.a]; if (!L) return;
    this.k = k; this.L = L;
    const g = this.g = new THREE.Group(); g.name = 'lobby'; k.group.add(g);
    this._coatCheck(k, L, g);
    this._board(k, L, g);
    this._dress(k, L, g);
  },

  // ---------------------------------------------------------------- the room: floor, panelling, benches, lights
  _dress(k, L, g) {
    const P = k.plan, y = L.y, G = k.G;
    const art = G.paint && G.paint.art;                                   // the big frame (src/paint.js): nothing goes over or under it
    const plates = id => ((G.lights && G.lights.byRoom && G.lights.byRoom[id]) || []);
    const coat = this.coat, board = this.board;
    // Is wall w clear at u? Not by the frame or any work, a light switch, or the coat check.
    const clearAt = (w, u) => {
      const p = wallPoint2(w, u);
      if (art && art.room === w.room.id && Math.abs(art.nx - w.nx) < 0.1 && Math.abs(art.nz - w.nz) < 0.1 && Math.hypot(p.x - art.x, p.z - art.z) < art.w / 2 + 0.9) return false;
      for (const a of G.museum.arts) if (a.room === w.room.id && Math.hypot(p.x - a.x, p.z - a.z) < (a.w || 1) / 2 + 0.8) return false;
      for (const s of plates(w.room.id)) if (Math.hypot(p.x - s.x, p.z - s.z) < 0.45) return false;
      if (w.room === L && coat && p.x < coat.x1 + 0.6 && p.z > coat.z0 - 0.5 && p.z < coat.z1 + 0.5) return false;
      return true;
    };
    // -- the floor: a band of dark marble 0.9 m in from the walls, and a compass rose in front of the doors
    const band = [], W0 = 0.9, BW = 0.2, fy = y + 0.003;
    const strip = (x0, x1, z0, z1) => { const q = new THREE.PlaneGeometry(x1 - x0, z1 - z0); q.rotateX(-Math.PI / 2); q.translate((x0 + x1) / 2, fy, (z0 + z1) / 2); band.push(q); };
    strip(L.x0 + W0, L.x1 - W0, L.z0 + W0, L.z0 + W0 + BW); strip(L.x0 + W0, L.x1 - W0, L.z1 - W0 - BW, L.z1 - W0);
    strip(L.x0 + W0, L.x0 + W0 + BW, L.z0 + W0 + BW, L.z1 - W0 - BW); strip(L.x1 - W0 - BW, L.x1 - W0, L.z0 + W0 + BW, L.z1 - W0 - BW);
    g.add(new THREE.Mesh(mergeGeometries(band), new THREE.MeshStandardMaterial({ color: 0x1d2a26, roughness: 0.25, metalness: 0.1, emissive: 0x24302c, emissiveIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
    const fz = P.front ? (P.front.z0 + P.front.z1) / 2 : (L.z0 + L.z1) / 2, RT = roseTex();
    const rose = new THREE.Mesh(new THREE.CircleGeometry(1.5, 48), new THREE.MeshStandardMaterial({ map: RT, transparent: true, depthWrite: false, roughness: 0.3, emissiveMap: RT, emissive: 0xffffff, emissiveIntensity: 0.14, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    rose.rotation.x = -Math.PI / 2; rose.position.set((L.x0 + L.x1) / 2, fy, fz); rose.renderOrder = 1; g.add(rose);
    // -- panelling to dado height on the lobby's walls, clear of every doorway (and its light switch) by 0.75 m
    const pan = [], cap = [];
    for (const w of P.walls) {
      if (w.room !== L) continue;
      const rot = Math.atan2(w.nx, w.nz);
      for (const sg of w.segs) {
        let a = null;
        const run = b => {
          if (a == null) return; const L2 = b - a, m = (a + b) / 2, at = wallPoint2(w, m); a = null; if (L2 < 0.6) return;
          const q = new THREE.PlaneGeometry(L2, 1.0), uv = q.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * L2 / 1.2);
          q.translate(0, 0.5, 0.022); q.rotateY(rot); q.translate(at.x, y, at.z); pan.push(q);
          const c = new THREE.BoxGeometry(L2, 0.05, 0.045); c.translate(0, 1.025, 0.0225); c.rotateY(rot); c.translate(at.x, y, at.z); cap.push(c);
        };
        const u0 = sg.lo + 0.75, u1 = sg.hi - 0.75;
        for (let u = u0; u <= u1 + 1e-6; u += 0.1) { const ok = clearAt(w, u); if (ok && a == null) a = u; else if (!ok && a != null) run(u - 0.1); }
        run(u1);
      }
    }
    const PT = panelTex();
    if (pan.length) g.add(new THREE.Mesh(mergeGeometries(pan), new THREE.MeshStandardMaterial({ map: PT, roughness: 0.55, emissiveMap: PT, emissive: 0xffffff, emissiveIntensity: 0.16 })));
    if (cap.length) g.add(new THREE.Mesh(mergeGeometries(cap), std(0x3a2414, { roughness: 0.4, emissive: new THREE.Color(0x3a2414).multiplyScalar(0.5) })));
    // -- two benches against the west wall, facing the frame: an oak frame at each end, a leather top; the car fits under
    const legs = [], tops = [], solids = [];
    {
      const ok = (z0, z1) => P.doors.every(d => !(d.z1 > z0 - 1 && d.z0 < z1 + 1 && Math.abs(d.x1 - L.x0) < 0.7)) && (!coat || z0 > coat.z1 + 1 || z1 < coat.z0 - 1) && (!board || Math.abs(board.z - (z0 + z1) / 2) > 1.6 || Math.abs(board.x - L.x0) > 3) && P.obstacles.every(o => !(o.x0 < L.x0 + 0.8 && o.x1 > L.x0 && o.z1 > z0 - 0.3 && o.z0 < z1 + 0.3 && o.y0 < y + 1));
      const x0 = L.x0 + 0.12, x1 = x0 + 0.46, f1 = P.front ? P.front.z1 : L.z0 + 16;
      for (const zc of [f1 + 3.4, f1 + 6.6]) {
        const z0 = zc - 0.9, z1 = zc + 0.9; if (z1 > L.z1 - 1.2 || !ok(z0, z1)) continue;
        for (const ez of [z0, z1 - 0.06]) { const f = new THREE.BoxGeometry(x1 - x0, 0.4, 0.06); f.translate((x0 + x1) / 2, y + 0.2, ez + 0.03); legs.push(f); solids.push({ x0, x1, z0: ez, z1: ez + 0.06, y0: y, y1: y + 0.4 }); }
        { const b = new THREE.BoxGeometry(x1 - x0 + 0.02, 0.04, z1 - z0); b.translate((x0 + x1) / 2, y + 0.42, (z0 + z1) / 2); legs.push(b); }
        tops.push(cushion(x1 - x0 - 0.01, 0.06, z1 - z0 - 0.02, (x0 + x1) / 2, y + 0.44, (z0 + z1) / 2));
        solids.push({ x0, x1, z0, z1, y0: y + 0.4, y1: y + 0.5 });
      }
    }
    if (legs.length) {
      g.add(new THREE.Mesh(mergeGeometries(legs), std(0x4a2c18, { roughness: 0.45 })));
      g.add(new THREE.Mesh(mergeGeometries(tops), std(0x5a2a1e, { roughness: 0.32, emissive: new THREE.Color(0x5a2a1e).multiplyScalar(0.35) })));
      for (const o of solids) P.obstacles.push(o);
      // (the robots' floor was laid before the benches were here: guards.js starts first. Tell their grids.)
      const gd = features.find(f => f.id === 'guards');
      for (const b of (gd && gd.bots) || []) if (b.P && b.P.grid) shut(b.P.grid, solids);
    }
    // -- wall lights, left burning: a brass plate and arm, a frosted shade, a wash up and down the wall, a pool on the floor
    const plate = [], shade = [], wash = [], pool = [];
    for (const r of [L.id, 'F1-member', 'B1-north'].map(id => P.byId[id]).filter(Boolean)) for (const w of P.walls) {
      if (w.room !== r) continue;
      const gap = r === L ? 4.4 : 5.5, rot = Math.atan2(w.nx, w.nz), H = Math.min(2.45, r.h - 0.9);
      for (const sg of w.segs) {
        const len = sg.hi - sg.lo; if (len < 1.8) continue;
        const n = Math.max(1, Math.floor((len - 1.2) / gap) + 1), step = (len - 1.2) / Math.max(1, n - 1);
        for (let i = 0; i < n; i++) {
          const u = n === 1 ? (sg.lo + sg.hi) / 2 : sg.lo + 0.6 + i * step;
          if (!clearAt(w, u)) continue;
          const at = wallPoint2(w, u), put = (q, list) => { q.rotateY(rot); q.translate(at.x, y, at.z); list.push(q); };
          { const q = new THREE.BoxGeometry(0.12, 0.24, 0.02); q.translate(0, H, 0.01); put(q, plate); }
          { const q = new THREE.BoxGeometry(0.025, 0.025, 0.14); q.translate(0, H - 0.04, 0.08); put(q, plate); }
          { const q = new THREE.CylinderGeometry(0.06, 0.075, 0.16, 16, 1, true); q.translate(0, H + 0.04, 0.15); put(q, shade); }
          { const q = new THREE.CircleGeometry(0.06, 16); q.rotateX(-Math.PI / 2); q.translate(0, H + 0.12, 0.15); put(q, shade); }
          { const q = new THREE.PlaneGeometry(1.6, 2.6); q.translate(0, H, 0.03); put(q, wash); }
          { const q = new THREE.PlaneGeometry(2.6, 2.2); q.rotateX(-Math.PI / 2); q.translate(0, 0.014, 1.0); put(q, pool); }
        }
      }
    }
    if (plate.length) {
      const R = radial();
      g.add(new THREE.Mesh(mergeGeometries(plate), std(0xc79a3c, { metalness: 0.8, roughness: 0.3 })));
      g.add(new THREE.Mesh(mergeGeometries(shade), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 1.02, 0.72), side: THREE.DoubleSide })));
      const wm = new THREE.Mesh(mergeGeometries(wash), new THREE.MeshBasicMaterial({ map: R, color: new THREE.Color(0.26, 0.19, 0.1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      const pm = new THREE.Mesh(mergeGeometries(pool), new THREE.MeshBasicMaterial({ map: R, color: new THREE.Color(0.3, 0.22, 0.12), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
      wm.renderOrder = pm.renderOrder = 2; g.add(wm, pm);
    }
  },


  // ---------------------------------------------------------------- the coat check
  _coatCheck(k, L, g) {
    const P = k.plan, y = L.y, X = L.x0, z0 = L.z0 + 3.9, z1 = z0 + 4.6, cx = X + 1.85, D = 0.62, H = 1.12, r = rng(77);
    this.coat = { x0: cx, x1: cx + D, z0, z1 };
    const walnut = std(0x4a2c18, { roughness: 0.45 }), panel = std(0x5a3620, { roughness: 0.5 }), marble = std(0xe6dfd2, { roughness: 0.18, metalness: 0.05 }), brass = std(0xc79a3c, { metalness: 0.85, roughness: 0.28 });
    const box = (w, h, d, m, x, yy, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, yy, z); g.add(o); return o; };
    // The counter: a plinth, a panelled front (raised panels, brass kick plate), a marble top that overhangs.
    box(D, H - 0.04, z1 - z0, walnut, cx + D / 2, y + (H - 0.04) / 2, (z0 + z1) / 2);
    box(0.02, 0.12, z1 - z0, brass, cx + D + 0.006, y + 0.06, (z0 + z1) / 2);
    const n = 5, pw = (z1 - z0) / n;
    for (let i = 0; i < n; i++) box(0.025, H - 0.42, pw - 0.16, panel, cx + D + 0.012, y + 0.22 + (H - 0.42) / 2, z0 + pw * (i + 0.5));
    box(D + 0.1, 0.04, z1 - z0 + 0.1, marble, cx + D / 2 + 0.03, y + H - 0.02, (z0 + z1) / 2);
    // On it: a brass bell, a stack of numbered tickets, a lamp with a green glass shade, and its pool of light.
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), brass); bell.position.set(cx + D * 0.6, y + H, z0 + 1.2); g.add(bell);
    box(0.08, 0.004, 0.12, brass, cx + D * 0.6, y + H + 0.002, z0 + 1.2);
    for (let i = 0; i < 6; i++) box(0.07, 0.006, 0.1, std(0xd8c9a0), cx + D * 0.45, y + H + 0.004 + i * 0.006, z0 + 1.6 + (r() - 0.5) * 0.01);
    const lampAt = new THREE.Vector3(cx + D * 0.35, y + H, z1 - 0.7);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.34, 8), brass); stem.position.set(lampAt.x, lampAt.y + 0.17, lampAt.z); g.add(stem);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.11, 0.1, 18, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 1.1, 0.5), side: THREE.DoubleSide })); shade.position.set(lampAt.x, lampAt.y + 0.36, lampAt.z); g.add(shade);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: radial(), color: new THREE.Color(0.55, 0.42, 0.22), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(lampAt.x + 0.2, y + H + 0.003, lampAt.z); g.add(pool);
    const floorPool = pool.clone(); floorPool.scale.setScalar(2.2); floorPool.position.set(cx + D + 1.2, y + 0.012, (z0 + z1) / 2); g.add(floorPool);
    // Behind it: two rails of coats on hangers, hats on the shelf above, all high enough for a toy to drive under.
    const railX = X + 0.55, top = y + 1.75;
    for (const zz of [z0 + 0.1, z1 - 0.1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8, 8), brass); post.position.set(railX, y + 0.9, zz); g.add(post); }
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, z1 - z0 - 0.2, 8), brass); rail.rotation.x = Math.PI / 2; rail.position.set(railX, top, (z0 + z1) / 2); g.add(rail);
    const coats = [0x1d2230, 0x5a2a22, 0x3c4a32, 0x7a6a52, 0x2c3e6a, 0x8a2a2a, 0x4a4a4e, 0x6e5a3a, 0x24262a, 0x9a8a6a], coatGeo = [];
    const cg = new THREE.CapsuleGeometry(0.15, 0.5, 4, 10); cg.scale(1, 1, 0.42);
    const sleeve = new THREE.CapsuleGeometry(0.045, 0.42, 3, 8);
    const coatMats = coats.map(c => std(c, { roughness: 0.85 }));
    for (let zz = z0 + 0.3, i = 0; zz < z1 - 0.25; zz += 0.2 + r() * 0.06, i++) {
      const c = new THREE.Group(), m = coatMats[Math.floor(r() * coatMats.length)], len = 0.5 + r() * 0.25;
      const body = new THREE.Mesh(cg, m); body.scale.y = len / 0.8; body.position.y = -0.1 - (0.15 + len / 2); c.add(body);
      for (const s of [-1, 1]) { const sl = new THREE.Mesh(sleeve, m); sl.position.set(0, -0.36, s * 0.16); sl.rotation.x = s * 0.12; c.add(sl); }
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.003, 4, 10, Math.PI * 1.4), brass); hook.position.y = 0.0; c.add(hook);
      const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.34), std(0x6a4a2a)); hanger.position.y = -0.08; c.add(hanger);
      c.position.set(railX, top, zz); c.rotation.y = Math.PI / 2 + (r() - 0.5) * 0.25; c.rotation.z = (r() - 0.5) * 0.06; g.add(c);
      // (the hem stays above the floor by more than a toy is tall)
      coatGeo.push(c);
    }
    box(0.36, 0.025, z1 - z0, walnut, X + 0.25, top + 0.32, (z0 + z1) / 2);
    for (let i = 0; i < 6; i++) { const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.1, 14), coatMats[(i * 3) % coatMats.length]); hat.position.set(X + 0.25, top + 0.39, z0 + 0.5 + i * 0.7); g.add(hat); const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.01, 16), hat.material); brim.position.set(hat.position.x, top + 0.34, hat.position.z); g.add(brim); }
    // The sign, hung over the counter on two rods: LOST & FOUND, and under it Coat Check.
    const signT = canvasTex(512, 200, (c, w, h) => {
      c.fillStyle = '#16120d'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c79a3c'; c.lineWidth = 6; c.strokeRect(8, 8, w - 16, h - 16);
      // each line set as large as it will go and still sit well inside the gilt border
      c.fillStyle = '#f2e6c8'; fitText(c, 'LOST & FOUND', { x: w / 2, y: 82, w: w - 96, h: 80, px: 74, family: 'Georgia, serif' });
      c.fillStyle = '#e0b85a'; fitText(c, 'Coat Check', { x: w / 2, y: 145, w: w - 140, h: 44, px: 40, weight: 'italic', family: 'Georgia, serif' });
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.59), new THREE.MeshBasicMaterial({ map: signT, color: new THREE.Color(1.1, 1.1, 1.1) }));
    sign.position.set(cx + D + 0.05, y + 2.55, (z0 + z1) / 2); sign.rotation.y = Math.PI / 2; g.add(sign);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.59), std(0x16120d)); back.position.copy(sign.position); back.position.x -= 0.01; back.rotation.y = -Math.PI / 2; g.add(back);
    for (const s of [-0.6, 0.6]) { const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, L.h - 2.85, 6), brass); rod.position.set(sign.position.x - 0.005, y + 2.85 + (L.h - 2.85) / 2, sign.position.z + s); g.add(rod); }
    // Solid: the counter and the two rail posts. The gap behind the counter, under the coats, is open: drive round either end.
    P.obstacles.push({ x0: cx, x1: cx + D + 0.05, z0, z1, y0: y, y1: y + H + 0.04 });
    for (const zz of [z0 + 0.1, z1 - 0.1]) P.obstacles.push({ x0: railX - 0.03, x1: railX + 0.03, z0: zz - 0.03, z1: zz + 0.03, y0: y, y1: y + 1.8 });
    // Where lost things are handed in (src/lostfound.js): in front of the counter, or behind it.
    P.coatCheck = { x: cx + D + 0.4, y, z: (z0 + z1) / 2, r: 2.4, room: L.id };
    void coatGeo;
  },

  // ---------------------------------------------------------------- the museum map
  _board(k, L, g) {
    const P = k.plan, y = L.y, door = P.front, dz = (door.z0 + door.z1) / 2;
    // Just inside the doors and to one side, turned to face them.
    const bx = L.x0 + 4.2, bz = dz + 4.6, yaw = Math.atan2(L.x0 - bx, dz - bz);
    this.board = { x: bx, y, z: bz, nx: Math.sin(yaw), nz: Math.cos(yaw) };
    const W = 1.7, H = 1.12, BOT = 0.85;
    const T = canvasTex(1024, 680, (c, w, h) => this._drawBoard(c, w, h, P, L));
    const s = new THREE.Group(); s.position.set(bx, y, bz); s.rotation.y = yaw; g.add(s);
    const bronze = std(0x3a2e22, { metalness: 0.6, roughness: 0.35 }), brass = std(0xc79a3c, { metalness: 0.85, roughness: 0.28 }), stone = std(0x8c8478, { roughness: 0.7 });
    const add = (geo, m, x, yy, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, yy, z); s.add(o); return o; };
    add(new THREE.BoxGeometry(W + 0.3, 0.12, 0.5), stone, 0, 0.06, 0);                                  // the plinth
    for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.035, 0.045, BOT + 0.06, 12), brass, sx * (W / 2 - 0.12), 0.12 + (BOT - 0.06) / 2, -0.04);
    add(new THREE.BoxGeometry(W + 0.1, H + 0.1, 0.07), bronze, 0, BOT + H / 2, -0.04);                     // the case
    add(new THREE.BoxGeometry(W + 0.16, 0.05, 0.12), brass, 0, BOT + H + 0.08, -0.04);                      // a brass cap
    const face = add(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: T, color: new THREE.Color(1.05, 1.05, 1.05) }), 0, BOT + H / 2, 0.0);
    face.renderOrder = 1;
    const glow = add(new THREE.PlaneGeometry(3.4, 2.4), new THREE.MeshBasicMaterial({ map: radial(), color: new THREE.Color(0.22, 0.26, 0.34), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0.012, 0.9);
    glow.rotation.x = -Math.PI / 2;
    // Solid: the plinth, turned with the board (its corners, boxed).
    const cs = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => { const lx = a * (W + 0.3) / 2, lz = b * 0.25; return { x: bx + lx * Math.cos(yaw) + lz * Math.sin(yaw), z: bz - lx * Math.sin(yaw) + lz * Math.cos(yaw) }; });
    P.obstacles.push({ x0: Math.min(...cs.map(q => q.x)), x1: Math.max(...cs.map(q => q.x)), z0: Math.min(...cs.map(q => q.z)), z1: Math.max(...cs.map(q => q.z)), y0: y, y1: y + BOT + H + 0.1 });
  },
  // The board's face: the building's own plan, drawn from the rooms, galleries in gold, the lobby lit with a star.
  _drawBoard(c, w, h, P, L) {
    c.fillStyle = '#0f1726'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#e8dcc0'; c.textAlign = 'left'; c.font = '600 46px Georgia, serif'; c.fillText('Museum Map', 44, 70);
    c.fillStyle = '#b8a888'; c.font = 'italic 26px Georgia, serif'; c.fillText('Level 1 · tonight the galleries are yours', 46, 108);
    c.strokeStyle = 'rgba(232,220,192,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(44, 126); c.lineTo(w - 44, 126); c.stroke();
    const rooms = P.rooms.filter(r => Math.abs(r.y - L.y) < 0.6 && !r.secret && r.kind !== 'hall' || (r.kind === 'hall' && Math.abs(r.y - L.y) < 0.6));
    let X0 = 1e9, X1 = -1e9, Z0 = 1e9, Z1 = -1e9; for (const r of rooms) { X0 = Math.min(X0, r.x0); X1 = Math.max(X1, r.x1); Z0 = Math.min(Z0, r.z0); Z1 = Math.max(Z1, r.z1); }
    // North at the top, as on the big map: the plan's x across, z down.
    const bx0 = 44, by0 = 150, bw = w - 88, bh = h - 150 - 70, sc = Math.min(bw / (X1 - X0), bh / (Z1 - Z0));
    const ox = bx0 + (bw - (X1 - X0) * sc) / 2, oz = by0 + (bh - (Z1 - Z0) * sc) / 2, px = x => ox + (x - X0) * sc, pz = z => oz + (z - Z0) * sc;
    for (const r of rooms) {
      const gal = r.kind === 'gallery', here = r.id === L.id;
      c.fillStyle = here ? '#c8432e' : gal ? '#a8863e' : r.kind === 'hall' ? '#5e6a7c' : '#2b3a52';
      c.fillRect(px(r.x0) + 1, pz(r.z0) + 1, Math.max(1, (r.x1 - r.x0) * sc - 2), Math.max(1, (r.z1 - r.z0) * sc - 2));
    }
    // You are here: a star on the lobby, and a pointer out to a label.
    const sx = px((L.x0 + L.x1) / 2), sz = pz((P.front.z0 + P.front.z1) / 2);
    star(c, sx, sz, 16, '#ffe7a0');
    c.fillStyle = '#ffe7a0'; c.font = '700 28px system-ui, sans-serif'; c.textAlign = 'left'; c.fillText('YOU ARE HERE', sx + 24, sz + 10);
    // the key
    const ky = h - 34; c.font = '24px system-ui, sans-serif'; c.textAlign = 'left';
    [['#a8863e', 'Galleries'], ['#2b3a52', 'Halls & rooms'], ['#5e6a7c', 'Courts'], ['#c8432e', 'Lobby']].forEach(([col, t], i) => { const x = 44 + i * 230; c.fillStyle = col; c.fillRect(x, ky - 18, 22, 22); c.fillStyle = '#d8ccb0'; c.fillText(t, x + 32, ky + 2); });
  },
  near(v, k) {
    const b = this.board; if (!b) return null;
    const dx = k.pos.x - b.x, dz = k.pos.z - b.z, d = Math.hypot(dx, dz), front = dx * b.nx + dz * b.nz;
    if (Math.abs(k.pos.y - b.y) > 1 || d > 3 || front < 0.3) return null;
    return { verb: 'MAP', hint: 'The museum map. Open it to see the whole building.', act: () => { if (k.G.nav && k.G.nav.open) k.G.nav.open(); } };
  },
  active(k) { return !!this.board; },
  update(dt, k) { const b = this.board; if (b && k.close(b, 7, 1.5)) k.once('lobbymap', 'A museum map, by the doors.', 4); },
  spots() { const out = []; if (this.board) out.push({ kind: 'thing', id: 'lobbymap', name: 'Museum map', x: this.board.x, y: this.board.y, z: this.board.z }); if (this.k && this.k.plan.coatCheck) out.push({ kind: 'thing', id: 'coatcheck', name: 'Coat check', ...this.k.plan.coatCheck }); return out; },
});

// A point on a wall's face (w from plan.walls), at u along it.
const wallPoint2 = (w, u) => (w.horiz ? { x: u, z: w.fixed } : { x: w.fixed, z: u });
// A bench top: a slab with its top edges drawn in, so it reads as upholstered.
function cushion(w, h, d, x, y, z) {
  const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position, r = 0.025;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) - Math.sign(p.getX(i)) * r); p.setZ(i, p.getZ(i) - Math.sign(p.getZ(i)) * r); }
  g.computeVertexNormals(); g.translate(x, y + h / 2, z); return g;
}
// Walnut panelling to dado height, 1.2 m to a repeat: two fielded panels over a plinth, the grain running up.
let _panel = null;
function panelTex() {
  if (_panel) return _panel;
  _panel = canvasTex(256, 256, (c, w, h) => {
    const r = rng(41); c.fillStyle = '#4a2c18'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { const x = r() * w; c.strokeStyle = r() < 0.5 ? 'rgba(20,10,4,.3)' : 'rgba(130,86,50,.2)'; c.lineWidth = 0.6 + r() * 1.5; c.beginPath(); c.moveTo(x, 0); for (let yy = 0; yy <= h; yy += 32) c.lineTo(x + Math.sin(yy * 0.03 + i) * 2, yy); c.stroke(); }
    for (const x0 of [14, 142]) {
      const x1 = x0 + 100, y0 = 18, y1 = h - 52;
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.fillStyle = '#5a3620'; c.fillRect(x0 + 7, y0 + 7, x1 - x0 - 14, y1 - y0 - 14);
      c.fillStyle = 'rgba(255,220,170,.12)'; c.fillRect(x0 + 7, y0 + 7, x1 - x0 - 14, 3); c.fillRect(x0 + 7, y0 + 7, 3, y1 - y0 - 14);
      c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x0 + 7, y1 - 10, x1 - x0 - 14, 3); c.fillRect(x1 - 10, y0 + 7, 3, y1 - y0 - 14);
    }
    c.fillStyle = '#2e1b0e'; c.fillRect(0, h - 34, w, 34); c.fillStyle = 'rgba(255,220,170,.1)'; c.fillRect(0, h - 34, w, 2);
  });
  _panel.wrapS = THREE.RepeatWrapping;
  return _panel;
}
// The compass rose let into the floor in front of the doors: brass, black and white marble, in a ring.
let _rose = null;
function roseTex() {
  if (_rose) return _rose;
  _rose = canvasTex(512, 512, (c, w, h) => {
    const cx = w / 2, cy = h / 2, R = w / 2 - 2;
    c.fillStyle = '#1d2a26'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    c.fillStyle = '#d8d0bf'; c.beginPath(); c.arc(cx, cy, R - 22, 0, 7); c.fill();
    c.strokeStyle = '#b08a3a'; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R - 22, 0, 7); c.stroke(); c.beginPath(); c.arc(cx, cy, R * 0.32, 0, 7); c.stroke();
    const pt = (a, r1, r2, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.lineTo(cx + Math.cos(a + 0.18) * r2, cy + Math.sin(a + 0.18) * r2); c.lineTo(cx, cy); c.lineTo(cx + Math.cos(a - 0.18) * r2, cy + Math.sin(a - 0.18) * r2); c.closePath(); c.fill(); };
    for (let i = 0; i < 8; i++) pt(i * Math.PI / 4 + Math.PI / 8, R * 0.55, R * 0.14, i % 2 ? '#6a6a64' : '#2a2a28');
    for (let i = 0; i < 4; i++) pt(i * Math.PI / 2, R - 30, R * 0.2, i === 0 ? '#b08a3a' : '#22302c');
    c.fillStyle = '#b08a3a'; c.beginPath(); c.arc(cx, cy, 10, 0, 7); c.fill();
  });
  return _rose;
}

function star(c, x, y, r, col) {
  c.fillStyle = col; c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath(); c.fill();
}
let _radial = null;
function radial() {
  if (_radial) return _radial;
  _radial = canvasTex(64, 64, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  return _radial;
}
