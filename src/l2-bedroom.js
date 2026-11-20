// Gallery 241: Van Gogh's The Bedroom, and the bedroom itself behind the wall it hangs on.
// Low in the north wall, under the picture, there is a gap no taller than the toy, with a little yellow light coming
// out of it. Through it, the room at toy scale: blue walls, the red coverlet, the two rush chairs, the table with the
// jug and the basin, pictures on the walls (shapes of my own, not his), and the floor tilting up the way he painted it.
//
// None of it is in the layout. It is built here, after the museum: a small bay standing against the outside of the
// north wall, with its own floor, its own volume for the toy to be in, and its own block for the outside, so nothing
// already there moves. The room is only put on the plan (and so on the map) once the toy has been through the gap.
import * as THREE from 'three';
import { feature } from './features.js';

const ID = 'G241-bed', W = 3.4, D = 2.8, H = 1.7, TILT = 0.18, GAP_W = 0.9, GAP_H = 0.62, SKIN = 0.2;
const lam = (color, glow = 0.55) => new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(glow) });

// A canvas made into a texture, once.
function tex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

feature({
  id: 'l2-bedroom',
  secrets: [['bedroom', 'Inside The Bedroom']],
  init(k) {
    const g241 = k.plan.byId.G241; if (!g241) return;
    const art = k.museum.arts.find(a => a.room === 'G241' && /^The Bedroom/.test(a.work.t || ''));
    const cx = art ? art.x : (g241.x0 + g241.x1) / 2, y = g241.y, zWall = g241.z0;            // the inner face of the north wall
    const zOut = Math.min(...k.plan.masses.filter(m => m.room && m.room.id === 'G241').map(m => m.z0), zWall - 1);     // and its outer face
    const r = this.room = { id: ID, gallery: 'The Bedroom', floor: '2', building: 'main', kind: 'room', use: 'secret', x0: cx - W / 2, x1: cx + W / 2, z0: zOut - D, z1: zOut, y, h: H, top: y + H, ceil: H, bedroom: true };
    this.gap = { x0: cx - GAP_W / 2, x1: cx + GAP_W / 2, z0: zOut, z1: zWall };
    this.at = { x: cx, y, z: zWall + 0.3 }; this.inside = { x: cx, y, z: zOut - D / 2 };
    const P = k.plan, fl = z => y + TILT * (zOut - z) / D;                                  // the floor rises towards the back wall
    // Where the toy can be: through the gap, and in the room. Ground under both, the tilted floor, and a block outside.
    P.boxes.push({ x0: this.gap.x0, x1: this.gap.x1, z0: zOut - 0.6, z1: zWall + 0.6, y0: y, y1: y + GAP_H, crawl: true });
    P.boxes.push({ x0: r.x0, x1: r.x1, z0: r.z0, z1: zOut + 0.02, y0: y, y1: y + H });
    P.floors.push({ x0: this.gap.x0, x1: this.gap.x1, z0: zOut - 0.1, z1: zWall + 0.1, y }, { x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y });
    P.surfaces.push({ skin: 'floor', fixed: true, x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, axis: 'z', h0: y + TILT, h1: y, base: y });
    P.masses.push({ x0: r.x0 - SKIN, x1: r.x1 + SKIN, z0: r.z0 - SKIN, z1: zOut, top: y + H + 0.3, bay: true });
    const O = (x0, x1, z0, z1, h, lo = 0) => P.obstacles.push({ x0, x1, z0, z1, y0: fl((z0 + z1) / 2) + lo, y1: fl((z0 + z1) / 2) + h });

    const G = new THREE.Group(); G.name = 'bedroom'; k.group.add(G); this.group = G;
    const box = (w, h, d, m, x, yy, z, ry = 0) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); q.position.set(x, yy, z); q.rotation.y = ry; G.add(q); return q; };
    const plane = (w, h, m, x, yy, z, ry = 0, rx = 0) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); q.position.set(x, yy, z); q.rotation.set(rx, ry, 0, 'YXZ'); G.add(q); return q; };

    // ---- outside: a plain stone bay from the ground up, a roof of snow, and a lit window ----
    const stone = lam(0xa7a196, 0.3), snow = lam(0xdfe6ee, 0.45);
    const ox0 = r.x0 - SKIN, ox1 = r.x1 + SKIN, oz0 = r.z0 - SKIN, top = y + H + 0.3;
    plane(ox1 - ox0, top, stone, cx, top / 2, oz0, Math.PI);                                    // north face
    plane(zOut - oz0, top, stone, ox0, top / 2, (oz0 + zOut) / 2, -Math.PI / 2);                 // west
    plane(zOut - oz0, top, stone, ox1, top / 2, (oz0 + zOut) / 2, Math.PI / 2);                  // east
    plane(ox1 - ox0, zOut - oz0, snow, cx, top, (oz0 + zOut) / 2, 0, -Math.PI / 2);              // the roof
    plane(0.5, 0.55, new THREE.MeshBasicMaterial({ color: 0xe8c45a }), cx, y + 0.95, oz0 - 0.01, Math.PI);   // the window, lit
    { const X = new THREE.Group(); X.name = 'bedroom-outside'; k.group.add(X); for (const c of [...G.children]) X.add(c); }      // (the outside is always there; the inside only near it)

    // ---- inside ----
    const blue = lam(0x6d84c9, 0.62), blueDark = lam(0x5466a8, 0.6), ceilM = lam(0xc9d3e3, 0.55);
    const boards = tex(256, 256, (c, w, h) => { c.fillStyle = '#a8a95f'; c.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? '#9a9c55' : '#b2b066'; c.fillRect(i * w / 9, 0, w / 9 - 2, h); } c.strokeStyle = 'rgba(70,72,40,.55)'; c.lineWidth = 2; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(i * w / 9, 0); c.lineTo(i * w / 9, h); c.stroke(); } });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, Math.hypot(D, TILT)), new THREE.MeshLambertMaterial({ map: boards, emissive: 0x6a6b3a, emissiveMap: boards }));
    floor.rotation.x = -Math.PI / 2 + Math.atan2(TILT, D); floor.position.set(cx, y + TILT / 2 + 0.003, zOut - D / 2); G.add(floor);
    plane(W, D, ceilM, cx, y + H, zOut - D / 2, 0, Math.PI / 2);
    plane(W, H, blue, cx, y + H / 2, r.z0, 0);                                                  // the back wall, facing in
    plane(D, H, blueDark, r.x0, y + H / 2, zOut - D / 2, Math.PI / 2);                           // the left (west) wall
    plane(D, H, blueDark, r.x1, y + H / 2, zOut - D / 2, -Math.PI / 2);                          // the right (east) wall
    // The front wall, round the gap: the stone face of the building is behind it.
    const zf = zOut - 0.004, lw = this.gap.x0 - r.x0;
    plane(lw, H, blue, r.x0 + lw / 2, y + H / 2, zf, Math.PI);
    plane(r.x1 - this.gap.x1, H, blue, (this.gap.x1 + r.x1) / 2, y + H / 2, zf, Math.PI);
    plane(GAP_W, H - GAP_H, blue, cx, y + GAP_H + (H - GAP_H) / 2, zf, Math.PI);
    // The two doors he painted, one each side, and the skirting.
    const doorM = lam(0x7d8f63, 0.5);
    plane(0.5, 1.05, doorM, r.x0 + 0.003, y + 0.53 + TILT * 0.25, zOut - 0.55, Math.PI / 2);
    plane(0.5, 1.05, doorM, r.x1 - 0.003, y + 0.53 + TILT * 0.2, zOut - 0.45, -Math.PI / 2);
    // The window in the back wall: green shutters a little open, the panes lit from outside.
    plane(0.5, 0.55, new THREE.MeshBasicMaterial({ color: 0xd9cf7a }), cx, y + 0.95, r.z0 + 0.005);
    const frameM = lam(0x6d8a4a, 0.5);
    for (const sx of [-1, 1]) { const s = box(0.24, 0.55, 0.015, frameM, cx + sx * 0.36, y + 0.95, r.z0 + 0.06, sx * 0.5); s.userData.shutter = true; }
    box(0.5, 0.02, 0.012, frameM, cx, y + 0.95, r.z0 + 0.012); box(0.02, 0.55, 0.012, frameM, cx, y + 0.95, r.z0 + 0.012);

    // ---- the furniture, set down on the slope ----
    const yellow = lam(0xd8a43c, 0.55), red = lam(0xc5352c, 0.55), pale = lam(0xd9dca8, 0.55), rush = lam(0xc89a3a, 0.5), wood = lam(0xb7782f, 0.5);
    const tiltX = Math.atan2(TILT, D);
    const onFloor = (obj, x, z) => { obj.position.set(x, fl(z), z); obj.rotation.x = tiltX * 0.6; G.add(obj); return obj; };
    // The bed, along the right-hand wall, its head to the back.
    { const b = new THREE.Group(), L = 1.15, Wb = 0.66;
      const part = (w, h, d, m, x, yy, z) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); q.position.set(x, yy, z); b.add(q); };
      part(Wb, 0.12, L, yellow, 0, 0.14, 0);                 // the frame
      part(Wb - 0.04, 0.08, L - 0.08, red, 0, 0.24, 0.04);   // the red coverlet
      part(Wb - 0.1, 0.06, 0.2, pale, 0, 0.3, -L / 2 + 0.14);  // pillows
      part(Wb, 0.5, 0.05, yellow, 0, 0.25, -L / 2);           // the head, tall
      part(Wb, 0.3, 0.05, yellow, 0, 0.15, L / 2);            // the foot
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(0.04, 0.12, 0.04, yellow, sx * (Wb / 2 - 0.02), 0.06, sz * (L / 2 - 0.02));
      const bx = r.x1 - Wb / 2 - 0.03, bz = r.z0 + L / 2 + 0.06; onFloor(b, bx, bz);
      O(bx - Wb / 2, bx + Wb / 2, bz - L / 2 - 0.03, bz + L / 2 + 0.03, 0.5);
    }
    // Two rush chairs: one by the bed's head, one in front on the left.
    const chair = (x, z, ry) => {
      const c = new THREE.Group(), s = 0.26;
      const part = (w, h, d, m, px, py, pz) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); q.position.set(px, py, pz); c.add(q); };
      part(s, 0.025, s, rush, 0, 0.2, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(0.025, sz < 0 ? 0.46 : 0.2, 0.025, yellow, sx * (s / 2 - 0.012), sz < 0 ? 0.23 : 0.1, sz * (s / 2 - 0.012));
      for (const hy of [0.3, 0.38]) part(s, 0.02, 0.02, yellow, 0, hy, -s / 2 + 0.012);
      c.rotation.y = ry; onFloor(c, x, z); c.rotation.y = ry;
      O(x - 0.15, x + 0.15, z - 0.15, z + 0.15, 0.46);
    };
    chair(r.x1 - 0.95, r.z0 + 0.3, 0.3);
    chair(r.x0 + 0.55, zOut - 0.7, -0.6);
    // The table under the window's left side, the jug and the basin on it. It stands on legs: the toy goes under it.
    { const t = new THREE.Group(), tw = 0.5, td = 0.36, th = 0.42;
      const part = (w, h, d, m, px, py, pz) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); q.position.set(px, py, pz); t.add(q); return q; };
      part(tw, 0.025, td, wood, 0, th, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(0.025, th, 0.025, wood, sx * (tw / 2 - 0.02), th / 2, sz * (td / 2 - 0.02));
      const jugM = lam(0x6f8fc9, 0.6), basinM = lam(0xe4e7f0, 0.6);
      const jug = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.1, 10), jugM); jug.position.set(-0.08, th + 0.06, 0.02); t.add(jug);
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.04, 12), basinM); basin.position.set(0.1, th + 0.03, 0); t.add(basin);
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.07, 6), lam(0x5f9a63, 0.6)); bottle.position.set(-0.18, th + 0.05, -0.08); t.add(bottle);
      const tx = r.x0 + 0.5, tz = r.z0 + 0.3; onFloor(t, tx, tz);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const lx = tx + sx * (tw / 2 - 0.02), lz = tz + sz * (td / 2 - 0.02); O(lx - 0.02, lx + 0.02, lz - 0.02, lz + 0.02, th); }
      O(tx - tw / 2, tx + tw / 2, tz - td / 2, tz + td / 2, th + 0.12, th - 0.02);
    }
    // Pictures on the walls: shapes of my own in his colours. Two little heads over the bed, a landscape, a mirror and a towel.
    const pic = (w, h, draw, x, yy, z, ry) => { const m = new THREE.MeshBasicMaterial({ map: tex(128, Math.round(128 * h / w), draw) }); const q = plane(w, h, m, x, yy, z, ry); const f = box(w + 0.03, h + 0.03, 0.01, lam(0x9a6a2a, 0.5), 0, 0, 0, ry); f.position.copy(q.position).add(new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry)).multiplyScalar(-0.006)); return q; };
    const head = bg => (c, w, h) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = '#e0b070'; c.beginPath(); c.ellipse(w / 2, h * 0.45, w * 0.22, h * 0.24, 0, 0, 7); c.fill(); c.fillStyle = '#3f4f8f'; c.fillRect(w * 0.18, h * 0.72, w * 0.64, h * 0.3); };
    pic(0.2, 0.26, head('#c9a640'), r.x1 - 0.004, y + 0.98 + TILT * 0.8, r.z0 + 0.32, -Math.PI / 2);
    pic(0.2, 0.26, head('#7aa860'), r.x1 - 0.004, y + 0.98 + TILT * 0.75, r.z0 + 0.66, -Math.PI / 2);
    pic(0.42, 0.28, (c, w, h) => { c.fillStyle = '#9ec0d8'; c.fillRect(0, 0, w, h); c.fillStyle = '#d4b04a'; c.fillRect(0, h * 0.55, w, h * 0.45); c.fillStyle = '#e8d25a'; c.beginPath(); c.arc(w * 0.75, h * 0.25, h * 0.12, 0, 7); c.fill(); c.strokeStyle = '#4f7a3c'; c.lineWidth = 4; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(i * w / 5, h); c.lineTo(i * w / 5 + 10, h * 0.6); c.stroke(); } }, r.x1 - 0.004, y + 1.32, r.z0 + 0.85, -Math.PI / 2);
    pic(0.22, 0.3, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#dfe8ee'); gr.addColorStop(1, '#8fa3b5'); c.fillStyle = gr; c.fillRect(0, 0, w, h); }, r.x0 + 0.004, y + 1.05, r.z0 + 0.8, Math.PI / 2);
    plane(0.14, 0.32, lam(0xe6e3c8, 0.6), r.x0 + 0.01, y + 0.62, r.z0 + 1.15, Math.PI / 2);     // the towel on its peg
    // Clothes on the pegs behind the bed head: a blue smock and a straw hat.
    plane(0.22, 0.4, lam(0x3e57a3, 0.5), r.x1 - 0.008, y + 1.05, r.z0 + 0.1, -Math.PI / 2);
    { const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.05, 12), lam(0xe3c25a, 0.6)); hat.position.set(r.x1 - 0.06, y + 1.35, r.z0 + 0.12); hat.rotation.z = 1.2; G.add(hat); }

    // ---- the gap: a hole's worth of dark on the gallery side, with yellow light coming out of it along the floor ----
    const arch = (glow) => tex(128, 96, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = '#100c08'; c.beginPath(); c.moveTo(4, h); c.lineTo(4, h * 0.42); c.quadraticCurveTo(4, 2, w / 2, 2); c.quadraticCurveTo(w - 4, 2, w - 4, h * 0.42); c.lineTo(w - 4, h); c.fill();
      const gr = c.createRadialGradient(w / 2, h, 4, w / 2, h, h * 0.9); gr.addColorStop(0, glow); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.globalCompositeOperation = 'source-atop'; c.fillRect(0, 0, w, h);
    });
    const holeIn = new THREE.MeshBasicMaterial({ map: arch('rgba(255,205,90,.75)'), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    this.holeIn = plane(GAP_W, GAP_H, holeIn, cx, y + GAP_H / 2, zWall + 0.02, 0);
    plane(GAP_W, GAP_H, new THREE.MeshBasicMaterial({ map: arch('rgba(190,200,230,.5)'), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }), cx, y + GAP_H / 2, zOut - 0.012, Math.PI);
    const pool = tex(64, 64, (c, w, h) => { const gr = c.createRadialGradient(w / 2, 0, 2, w / 2, 0, w / 2); gr.addColorStop(0, 'rgba(255,200,90,.9)'); gr.addColorStop(1, 'rgba(255,200,90,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    this.pool = plane(GAP_W * 1.8, 0.9, new THREE.MeshBasicMaterial({ map: pool, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.35 }), cx, y + 0.006, zWall + 0.45, 0, -Math.PI / 2);
    // The inside of the wall, for the moment the camera is in it.
    const tun = lam(0x3a2a1c, 0.35); tun.side = THREE.DoubleSide;
    plane(GAP_W, zWall - zOut, tun, cx, y + 0.002, (zOut + zWall) / 2, 0, -Math.PI / 2);
    plane(GAP_W, zWall - zOut, tun, cx, y + GAP_H, (zOut + zWall) / 2, 0, Math.PI / 2);
    for (const sx of [-1, 1]) plane(zWall - zOut, GAP_H, tun, cx + sx * GAP_W / 2, y + GAP_H / 2, (zOut + zWall) / 2, Math.PI / 2);
    G.visible = false; this.shown = false; this.t = 0;
  },
  active(k) {
    const on = !!this.room && (k.inRoom('G241', 2) || k.close(this.inside, 3, 2));
    if (this.room && on !== this.shown) this.group.visible = this.shown = on;
    return on;
  },
  update(dt, k) {
    this.t += dt;
    this.pool.material.opacity = 0.3 + 0.06 * Math.sin(this.t * 2.3) + 0.03 * Math.sin(this.t * 7.1);      // a lamp inside, flickering
    const p = k.pos, inGap = p.x > this.gap.x0 && p.x < this.gap.x1 && p.z < this.gap.z1 - 0.15 && p.z > this.room.z0 - 0.5 && p.y < this.room.y + 1;
    if (inGap && !k.plan.byId[ID]) { k.plan.rooms.push(this.room); k.plan.byId[ID] = this.room; }      // through the gap: now it is a room, and on the map
    if (k.G.roomId === ID) {
      k.museum.playerIndoors = true;
      if (k.find('bedroom')) { k.callout('INSIDE THE BEDROOM'); k.say('His bedroom in Arles, at a toy’s size. The floor runs uphill, just as he painted it.', 6); }
    }
  },
  spots() { return this.room ? [{ kind: 'secret', id: 'bedroom', name: 'Inside The Bedroom', x: this.inside.x, y: this.inside.y, z: this.inside.z }] : []; },
});
