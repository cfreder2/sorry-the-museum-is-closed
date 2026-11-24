// Butler Field, the block of Grant Park between Columbus Drive and Lake Shore Drive (features.js).
// The north-west quarter, facing the Modern Wing across Columbus Drive, is the Winter Wonderland light show and its
// Light Run (lightshow.js). The north-east is a jump park made of the ploughs' snow piles. The south-east has the field's
// softball diamonds, under snow, with their backstops and benches; the first of them is the ballpark (ballpark.js), lit
// and walled, with its own scoreboard. Lamps, benches and bins along the paths, and a warming hut (warminghut.js). Everything is merged or instanced; the lights twinkle in a shader.
import * as THREE from 'three';
import { feature } from './features.js';
import { heightOf } from './plan.js';
import { parkLamps, parkSeats } from './land.js';
import { TAU, C, Bulbs, Wire, canvasTex, lit, signBoard, mergeAll } from './glowkit.js';
import { ParkFurniture } from './streetscape.js';
import { shapeHill } from './hillshape.js';
import { buildHills } from './hills.js';
import { snowGeometry, snowKitMaterial } from './kitlook.js';      // cut and groomed snow, as the humps on the paths are (museum.js)
import './ballpark.js';           // the north-west diamond is a lit ballpark with a wall and a Home Run Derby (ballpark.js)
import './parkkit.js';            // snow fences, what pokes through the snow, and tracks across it (parkkit.js)
import './warminghut.js';      // the warming hut by Jackson Drive, between the two southern diamonds: drive in and warm up (warminghut.js)

// ---------------------------------------------------------------- the feature
feature({
  id: 'butlerfield',
  secrets: [['bigair', 'Big Air (clear the gap)'], ['homerun', 'Home run (round the bases)'], ['snowmen', 'Six snowmen down']],
  init(k) {
    this.k = k; const L = k.plan.lakefront; if (!L) return;
    this.F = L.field; this.t = 0;
    const g = this.g = new THREE.Group(); g.name = 'butlerfield'; k.group.add(g);
    this.bulbs = new Bulbs(); this.wire = new Wire(); this.glow = [];
    const snowM = this.snowM = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, map: k.museum.snowTex, roughness: 0.95, emissiveMap: k.museum.snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5 });
    this._jumpPark(k, snowM);
    this.PF = new ParkFurniture(k.plan);              // the benches and bins: the same as the streets' (streetscape.js)
    this._diamonds(k);
    this._paths(k);
    for (const m of this.PF.meshes(snowM)) g.add(m);
    this._glows(g);
    this.bulbs.build(g);
    const wm = this.wire.mesh(); if (wm) g.add(wm);
  },

  // Light thrown on the snow: soft coloured pools round the jumps. One instanced mesh.
  _glows(g) {
    const n = this.glow.length; if (!n) return;
    const tex = canvasTex(64, 64, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), n);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), col = new THREE.Color();
    this.glow.forEach(([x, z, r, c, k], i) => { m.setMatrixAt(i, M.compose(new THREE.Vector3(x, 0.05, z), Q, new THREE.Vector3(r * 2, r * 2, 1))); m.setColorAt(i, col.setRGB(c[0] * k, c[1] * k, c[2] * k)); });
    m.frustumCulled = false; m.renderOrder = 5; g.add(m);
  },

  // ============================================================ the jump park
  // The ploughs pile the snow from Columbus Drive here: a mountain to climb, a kicker over a gap, a long table-top with a
  // lip, a run of rollers, and a quarter pipe at the end of it all. Real surfaces: the car leaves the ground off them.
  _jumpPark(k, snowM) {
    const S = k.plan.surfaces, g = this.g, pieces = [];
    const B0 = this.bulbs, edgeCol = [C.orange, C.blue, C.gold, C.ice];
    // each piece of snow, drawn, with lights along both its long edges so the lines read at night
    const add = s => {
      S.push({ skin: 'snow', thick: 0, ...s }); const q = S[S.length - 1]; pieces.push(q);
      const col = edgeCol[S.length % edgeCol.length];
      for (let x = q.x0 + 0.3; x < q.x1; x += 0.8) for (const z of [q.z0 + 0.12, q.z1 - 0.12]) B0.add(x, heightOf(q, x, z) + 0.09, z, col, x * 0.3, 2, 0.085);
      if (q.axis === null || q.h1 > 1.5 || q.h0 > 1.5) this.glow.push([(q.x0 + q.x1) / 2, (q.z0 + q.z1) / 2, Math.max(q.x1 - q.x0, q.z1 - q.z0) * 0.8, col, 0.1]);
      return q;
    };
    const z0 = 13, z1 = 21;
    // line one, west to east: a long run-up from the path, a kicker, a gap, a landing
    this.kick = add({ x0: 412, x1: 417, z0, z1, axis: 'x', h0: 0, h1: 1.7 });
    add({ x0: 417, x1: 418.2, z0, z1, axis: null, h0: 1.7, h1: 1.7 });
    this.land = add({ x0: 421.5, x1: 431, z0, z1, axis: 'x', h0: 1.6, h1: 0 });
    this.gap = { x0: 418.2, x1: 421.5, z0, z1 };
    // the table-top: up, a long top, a lip on the end, and a landing beyond
    add({ x0: 436, x1: 443, z0, z1, axis: 'x', h0: 0, h1: 2.0, ease: true });
    add({ x0: 443, x1: 451, z0, z1, axis: null, h0: 2.0, h1: 2.0 });
    add({ x0: 451, x1: 453, z0, z1, axis: 'x', h0: 2.0, h1: 2.5 });
    add({ x0: 457.5, x1: 466, z0, z1, axis: 'x', h0: 2.2, h1: 0 });
    // rollers: a run of humps to pump over, and the quarter pipe at the end of them, with a deck to stand on
    for (let i = 0; i < 6; i++) { const x = 396 + i * 7; add({ x0: x, x1: x + 3, z0: 34, z1: 41, axis: 'x', h0: 0, h1: 0.8, ease: true }); add({ x0: x + 3, x1: x + 6, z0: 34, z1: 41, axis: 'x', h0: 0.8, h1: 0, ease: true }); }
    add({ x0: 448, x1: 453, z0: 31, z1: 44, axis: 'x', h0: 0, h1: 3.0, curve: 5.67 });
    add({ x0: 453, x1: 455.5, z0: 31, z1: 44, axis: null, h0: 3.0, h1: 3.0 });
    // the mountain the ploughs left, with a kicker of packed snow on its top
    { const s = { skin: 'hill', hill: true, axis: 'hill', cx: 440, cz: -6, rx: 15, rz: 10, H: 5.5, bump: 0.9, br: 2.6, x0: 425, x1: 455, z0: -16, z1: 4, h0: 0, h1: 5.5, thick: 0 }; shapeHill(s); S.push(s); if (k.plan.hills) k.plan.hills.push(s); g.add(buildHills([s], k.museum.snowTex, k.museum)); }      // (its lumps are in its shape now, hillshape.js: they used to be drawn and not felt)
    // every piece of the park as one mesh of cut snow: rounded shoulders, battered sides, corduroy, a dyed line on each take-off
    { const m = new THREE.Mesh(snowGeometry(pieces), snowKitMaterial(k.museum.snowTex)); m.name = 'jumppark-snow'; m.matrixAutoUpdate = false; g.add(m); }
    // marker poles and a painted sign, so the lines read from a distance
    const B = this.bulbs;
    for (const [x, z] of [[412, z0 - 0.6], [412, z1 + 0.6], [418.2, z0 - 0.6], [418.2, z1 + 0.6], [421.5, z0 - 0.6], [421.5, z1 + 0.6], [453, z0 - 0.6], [453, z1 + 0.6], [457.5, z0 - 0.6], [457.5, z1 + 0.6]]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6), lit(0xd23a2a)); pole.position.set(x, 0.9, z); g.add(pole);
      B.add(x, 1.85, z, C.orange, Math.random(), 2, 0.07);
    }
    const sign = signBoard(3.2, 1.0, [['PLOUGH PILE PARK', 76, '#ffe1a0', 0.4], ['clear the gap · ride the pipe', 34, '#bfe3ff', 0.75]], '#1b1208');
    const th = -Math.PI / 2 + 0.6; sign.position.set(393, 2.0, 9.5); sign.rotation.y = th; g.add(sign);
    for (const dx of [-1.5, 1.5]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), lit(0x3a2a1a)); post.position.set(393 + Math.cos(th) * dx, 1.3, 9.5 - Math.sin(th) * dx); g.add(post); }
    k.plan.obstacles.push({ x0: 392.6, x1: 393.4, z0: 8.4, z1: 10.6, y0: 0, y1: 2.6 });
  },
  // ============================================================ the softball diamonds
  // Four diamonds in the south-east quarter, home plates in the corners, foul lines along the field's own lines. The
  // north-west one is the ballpark, drawn in ballpark.js: only its bases are kept here, for running round them.
  _diamonds(k) {
    const O = k.plan.obstacles, g = this.g, B = this.bulbs;
    const BL = 12, posts = [], panels = [], fenceGeo = [];
    const chain = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(200,210,220,.95)'; c.lineWidth = 2; for (let i = -64; i < 128; i += 16) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 64, 64); c.stroke(); c.beginPath(); c.moveTo(i + 64, 0); c.lineTo(i, 64); c.stroke(); } });
    chain.wrapS = chain.wrapT = THREE.RepeatWrapping;
    const meshM = new THREE.MeshStandardMaterial({ map: chain, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.4, emissive: 0x3a4250, emissiveMap: chain, emissiveIntensity: 0.6 });
    const steel = lit(0x8c949c, { metalness: 0.7, roughness: 0.35 }), snowy = lit(0xe8eef6, { roughness: 0.9 }), yellow = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.9, 0.3) });
    const panel = (ax, az, bx, bz, h, y0 = 0) => {          // a chain-link panel between two points, with posts and a top rail
      const l = Math.hypot(bx - ax, bz - az), q = new THREE.PlaneGeometry(l, h); const uv = q.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * l / 0.6, uv.getY(i) * h / 0.6);
      q.rotateY(-Math.atan2(bz - az, bx - ax)); q.translate((ax + bx) / 2, y0 + h / 2, (az + bz) / 2); panels.push(q);
      for (const [x, z] of [[ax, az], [bx, bz]]) { const p = new THREE.CylinderGeometry(0.035, 0.035, h + 0.1, 6); p.translate(x, y0 + (h + 0.1) / 2, z); posts.push(p); }
      const r = new THREE.CylinderGeometry(0.025, 0.025, l, 6); r.rotateZ(Math.PI / 2); r.rotateY(-Math.atan2(bz - az, bx - ax)); r.translate((ax + bx) / 2, y0 + h, (az + bz) / 2); posts.push(r);
    };
    this.diamonds = [];
    // home plate, and which way the first-base line and the third-base line run (unit vectors along x and z)
    for (const [hx, hz, fx, tz, n] of [[402, 146, 1, 1, 1], [466, 116, -1, 1, 2], [395, 236, 1, -1, 3], [466, 236, -1, -1, 4]]) {
      const home = { x: hx, z: hz }, first = { x: hx + fx * BL, z: hz }, second = { x: hx + fx * BL, z: hz + tz * BL }, third = { x: hx, z: hz + tz * BL };
      if (n === 1) { this.diamonds.push({ n, bases: [home, third, second, first], step: 0, t: 0 }); continue; }      // (the ballpark's first base is down the +z line, on the right as you face the pitcher)
      this.diamonds.push({ n, bases: [home, first, second, third], step: 0, t: 0 });
      // the backstop: an arc of tall panels behind home plate
      const ux = -fx * Math.SQRT1_2, uz = -tz * Math.SQRT1_2, R = 4.5, base = Math.atan2(uz, ux);
      let px = null, pz = null;
      for (let i = 0; i <= 6; i++) { const a = base - 1.25 + 2.5 * i / 6, x = hx + Math.cos(a) * R, z = hz + Math.sin(a) * R; if (px !== null) { panel(px, pz, x, z, 3.4); O.push({ x0: Math.min(px, x) - 0.06, x1: Math.max(px, x) + 0.06, z0: Math.min(pz, z) - 0.06, z1: Math.max(pz, z) + 0.06, y0: 0, y1: 3.5 }); } px = x; pz = z; }
      // short fence wings along each line, a little outside it, and a team bench behind each (two backless benches end to end, facing the field)
      const wing = (ax, az, bx, bz) => { panel(ax, az, bx, bz, 1.2); O.push({ x0: Math.min(ax, bx) - 0.06, x1: Math.max(ax, bx) + 0.06, z0: Math.min(az, bz) - 0.06, z1: Math.max(az, bz) + 0.06, y0: 0, y1: 1.25 }); };
      wing(hx + fx * 2.5, hz - tz * 3, hx + fx * 12, hz - tz * 3);            // behind the first-base line
      wing(hx - fx * 3, hz + tz * 2.5, hx - fx * 3, hz + tz * 12);            // behind the third-base line
      for (const [bx, bz, along] of [[hx + fx * 7, hz - tz * 4.2, 'x'], [hx - fx * 4.2, hz + tz * 7, 'z']]) {
        for (const d of [-0.93, 0.93]) along === 'x' ? this.PF.bench(bx + d, 0, bz, 0, tz, 'backless') : this.PF.bench(bx, 0, bz + d, fx, 0, 'backless');
      }
      // bases poking out of the snow, the plate, the pitcher's plate, the foul poles far down the lines
      for (const b of [first, second, third]) { const q = new THREE.BoxGeometry(0.38, 0.03, 0.38); q.rotateY(Math.PI / 4); q.translate(b.x, 0.015, b.z); fenceGeo.push(q); B.add(b.x, 0.12, b.z, C.white, Math.random(), 2, 0.03); }
      { const sh = new THREE.Shape([[-0.22, 0], [0.22, 0], [0.22, 0.22], [0, 0.44], [-0.22, 0.22]].map(([x, y]) => new THREE.Vector2(x, y))); const q = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }); q.rotateX(-Math.PI / 2); q.rotateY(Math.atan2(fx, tz) + Math.PI); q.translate(hx, 0.0, hz); fenceGeo.push(q); }
      // (the mound a low cap of snow on the ground, no more than 3 cm up, and the pitcher's plate on it)
      { const q = new THREE.BoxGeometry(0.6, 0.02, 0.15); q.translate(hx + fx * BL * 0.5, 0.03, hz + tz * BL * 0.5); fenceGeo.push(q); const m = new THREE.SphereGeometry(1.6, 16, 6, 0, TAU, 0, 0.5); m.scale(1, 0.15, 1); m.translate(hx + fx * BL * 0.5, -1.6 * Math.cos(0.5) * 0.15 + 0.002, hz + tz * BL * 0.5); fenceGeo.push(m); }
      // short yellow markers where the foul lines run out (the tall poles and the lights are at the ballpark)
      for (const [x, z] of [[hx + fx * 26, hz], [hx, hz + tz * 26]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.2, 8), yellow); p.position.set(x, 0.6, z); g.add(p); O.push({ x0: x - 0.07, x1: x + 0.07, z0: z - 0.07, z1: z + 0.07, y0: 0, y1: 1.2 }); }
      // a number on the backstop
      { const t = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#123a24'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f2e8c8'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#f2e8c8'; c.font = '700 64px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('F' + n, w / 2, h / 2 + 4); });
        const s = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1.1, 1.1, 1.1) })); { const bk = new THREE.Mesh(s.geometry, s.material); bk.rotation.y = Math.PI; s.add(bk); } s.position.set(hx + ux * (R + 0.05), 2.4, hz + uz * (R + 0.05)); s.rotation.y = Math.atan2(ux, uz); g.add(s); }      // two faces: it reads from either side of the fence (a DoubleSide plane is mirrored from behind)
    }
    g.add(new THREE.Mesh(mergeAll(panels), meshM), new THREE.Mesh(mergeAll(posts), steel), new THREE.Mesh(mergeAll(fenceGeo), snowy));
    // snowmen standing about the diamonds like fielders: knock all six down
    this.snowmen = []; this.downed = 0;
    const smM = lit(0xf4f7fb, { roughness: 0.85 }), coal = lit(0x18181a), carrot = lit(0xe2702a), scarfM = lit(0xc0392b);
    for (const [x, z] of [[452, 214], [412, 219], [459, 125], [401, 228], [458, 229], [421, 205]]) {      // (none in the ballpark, nor on the clear square in its centre field)
      const grp = new THREE.Group(); grp.position.set(x, 0, z);
      [[0.42, 0.42], [0.3, 1.04], [0.21, 1.5]].forEach(([r, y]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), smM); m.position.y = y; grp.add(m); });
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 8), carrot); nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.5, 0.28); grp.add(nose);
      for (const sx of [-0.07, 0.07]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), coal); e.position.set(sx, 1.58, 0.19); grp.add(e); }
      const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 16), scarfM); scarf.rotation.x = Math.PI / 2; scarf.position.y = 1.3; grp.add(scarf);
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 12), coal); hat.position.y = 1.78; grp.add(hat); const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 14), coal); brim.position.y = 1.66; grp.add(brim);
      grp.rotation.y = Math.atan2(395 - x + 30, 180 - z);
      g.add(grp);
      this.snowmen.push(k.pushable(grp, { r: 0.42, h: 1.8, tip: true, hit: 0.9, drag: 5, onTip: () => this._snowmanDown(k) }));
    }
  },
  _snowmanDown(k) {
    this.downed++; k.synth.noise(0.3, { vol: 0.06, lp: 900 });
    if (this.downed >= this.snowmen.length) { if (k.find('snowmen')) k.callout('SIX SNOWMEN DOWN'); }
    else k.say(`Snowman down. ${this.downed} of ${this.snowmen.length}.`, 2);
  },

  // ============================================================ along the paths
  // Park lamps down both sides of the paths, benches and bins between them, and the field's sign.
  _paths(k) {
    const O = k.plan.obstacles, g = this.g, B = this.bulbs, F = this.F;
    const lamps = parkLamps(F);                       // (where they stand is the land's business too: the drifts keep clear of them, land.js)
    const n = lamps.length;
    const postG = new THREE.CylinderGeometry(0.05, 0.07, 3.6, 8); postG.translate(0, 1.8, 0);
    const posts = new THREE.InstancedMesh(postG, lit(0x1c2126, { metalness: 0.5, roughness: 0.4 }), n);
    const globes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.3, 1.3) }), n);
    const poolT = canvasTex(64, 64, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: poolT, color: new THREE.Color(0.5, 0.36, 0.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), n);
    const M = new THREE.Matrix4(), I = new THREE.Quaternion(), Qf = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), one = new THREE.Vector3(1, 1, 1);
    lamps.forEach(([x, z], i) => {
      posts.setMatrixAt(i, M.compose(new THREE.Vector3(x, 0, z), I, one)); globes.setMatrixAt(i, M.compose(new THREE.Vector3(x, 3.75, z), I, one)); pools.setMatrixAt(i, M.compose(new THREE.Vector3(x, 0.04, z), Qf, new THREE.Vector3(10, 10, 1)));
      O.push({ x0: x - 0.07, x1: x + 0.07, z0: z - 0.07, z1: z + 0.07, y0: 0, y1: 3.7 });
    });
    for (const m of [posts, globes, pools]) m.frustumCulled = false; pools.renderOrder = 4;
    if (k.museum.snowfield) k.museum.snowfield.lampLight(lamps, 5, pools.material.color);      // (the same light on the banks and drifts that stand up through those discs: snowfield.js)
    g.add(posts, globes, pools);
    // benches and bins between the lamps, facing the path
    for (const [bx, bz, alongZ, x, z] of parkSeats(lamps)) {
      if (alongZ) this.PF.bench(bx, 0, bz, x < 387 ? 1 : -1, 0); else this.PF.bench(bx, 0, bz, 0, z < 110 ? 1 : -1);
      this.PF.bin(alongZ ? bx : bx + 1.4, 0, alongZ ? bz + 1.4 : bz);
    }
    // the field's own sign, where the paths cross
    { const s = signBoard(2.6, 0.9, [['BUTLER FIELD', 92, '#f4ecd0', 0.42], ['GRANT PARK', 40, '#b9d9b0', 0.76]], '#12301e'); s.position.set(391.5, 1.5, 106); s.rotation.y = Math.PI / 4; g.add(s);
      for (const d of [-1.1, 1.1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2, 6), lit(0x1c2126)); p.position.set(391.5 + d * 0.707, 1.0, 106 - d * 0.707); g.add(p); } O.push({ x0: 390.5, x1: 392.5, z0: 105, z1: 107, y0: 0, y1: 2 }); }
    // (the warming hut between the two southern diamonds is warminghut.js)
  },

  // ============================================================ play
  // Drawn while the toy is within a few hundred metres (it shows from Columbus Drive, the Modern Wing and the harbour);
  // run while it is in or beside the field.
  active(k) {
    const p = k.pos, F = this.F; if (!F) return false;
    const far = Math.hypot(p.x - (F.x0 + F.x1) / 2, p.z - (F.z0 + F.z1) / 2); this.g.visible = far < 290;
    return p.x > F.x0 - 60 && p.x < F.x1 + 30 && p.z > F.z0 - 40 && p.z < F.z1 + 40;
  },
  update(dt, k) {
    this.t += dt; if (this.bulbs.u) this.bulbs.u.uT.value = this.t;
    const p = k.pos, v = k.v;
    // Big Air: off the kicker, over the gap, onto the landing without touching the ground between
    if (this.gap) {
      const G = this.gap;
      if (v.air && p.x > G.x0 - 1.2 && p.x < G.x0 + 0.5 && p.z > G.z0 && p.z < G.z1 && p.y > 1.2) this._flying = true;
      if (this._flying && !v.air) { if (v.on === this.land) { if (k.find('bigair')) k.callout('BIG AIR'); else k.say('Big air!', 1.5); } this._flying = false; }
    }
    // Home run: home, first, second, third and home again on one diamond, in under forty seconds
    for (const d of this.diamonds || []) {
      const b = d.bases[(d.step + 1) % 4], h = d.bases[0];
      if (d.step > 0) d.t += dt;
      if (d.step > 0 && d.t > 40) { d.step = 0; d.t = 0; }
      if (d.step === 0 && Math.hypot(p.x - h.x, p.z - h.z) < 1.3) { d.armed = true; }
      if (d.armed && d.step === 0 && Math.hypot(p.x - h.x, p.z - h.z) > 1.6 && Math.hypot(p.x - d.bases[1].x, p.z - d.bases[1].z) < 1.4) { d.step = 1; d.t = 0; k.say('First base!', 1.2); continue; }
      if (d.step > 0 && Math.hypot(p.x - b.x, p.z - b.z) < 1.4) {
        d.step++;
        if (d.step === 4) { d.step = 0; d.armed = false; if (k.find('homerun')) k.callout('HOME RUN'); else k.say('Home run!', 1.5); k.synth.chime([392, 523, 659, 784], { gap: 0.1, dur: 0.6, vol: 0.05 }); }
        else k.say(['', 'First base!', 'Second base!', 'Third base!'][d.step], 1.2);
      }
    }
    for (const s of this.snowmen || []) s.step(dt);
  },
  spots() {
    const out = [];
    if (this.gap) out.push({ kind: 'secret', id: 'bigair', name: 'Big Air (clear the gap)', x: (this.gap.x0 + this.gap.x1) / 2, y: 0, z: (this.gap.z0 + this.gap.z1) / 2 });
    if (this.diamonds) out.push({ kind: 'secret', id: 'homerun', name: 'Home run (round the bases)', x: this.diamonds[0].bases[2].x, y: 0, z: this.diamonds[0].bases[2].z });
    for (const s of this.snowmen || []) out.push({ kind: 'secret', id: 'snowmen', name: 'Snowman (knock all six down)', x: s.home.x, y: 0, z: s.home.z });
    return out;
  },
  reset() { for (const s of this.snowmen || []) s.reset(); this.downed = 0; for (const d of this.diamonds || []) { d.step = 0; d.armed = false; } },
});
