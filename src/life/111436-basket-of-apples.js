// Paul Cézanne, The Basket of Apples (about 1893), Gallery 248. The word: tumble.
//
// Look at it and his white tablecloth slides out from under the frame and falls, billowing and turning a little as a
// dropped cloth does, and lands on the floor in front of the wall: a rectangle with a straight hem, its far corners
// flat, a few big diagonal folds across it, as it lies across his tilted table; made, as he made it, of planes: white,
// warm cream where the light falls, cool blue-greys in the hollows. Then the apples come, one after another, out from
// under the rail: they drop onto the cloth, bounce (each bounce a soft wooden note), tumble and roll out across the
// cloth and the floorboards in his colours, and rock to rest. One lands on the crest of a fold and teeters there
// before it rolls off. Two of the pale biscuits off the plate drop after them and land flat on the cloth. Every apple
// is built of flat planes of colour (green, yellow, red-orange, a cool shadow plane), and while you keep looking the
// floor tips a little now and then, as his table does, and they roll and settle again. A phrase of Satie's first
// Gymnopédie (1888) as they come to rest.
//
// When you stop looking they stay out while the toy is near, so you can drive into them and send them rolling (they
// never stop the toy, and keep out of the doorways). Drive off, or wait half a minute, and they roll back to the wall
// and up into the frame; then the cloth lifts, flutters up and slips back in under the rail after them.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, shape } from '../paintlife.js';

const APPLES = 16, TEETER = 6;
const NA = 20, NS = 18;                          // the cloth's grid: across, and out
const W = 1.04, LF = 0.86, NEAR = 0.1;           // the cloth's width and depth, and how far from the wall it lies (m)
const T_OUT = 0.1, T_DROP = 0.42, T_LAND = 1.4, T_SETTLE = 1.75;        // out from under the rail, falling, down, settled
const NOTES = [587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.5];            // D major pentatonic, for the bounces
// Gymnopédie No. 1 (Erik Satie, 1888): the first phrase, over its two chords. 3/4.
const GYMNO = 'R F#5 A5 | G5 F#5 C#5 | B4 C#5 D5 | A4:3 | F#4:3 | R:3';
const GYM_BASS = 'G2:3 | D2:3 | G2:3 | D2:3 | G2:3 | D2:3';
const GYM_CHORD = ['B3 D4 F#4', 'A3 C#4 F#4'];

lifeFor(111436, {
  title: /^The Basket of Apples/,
  word: 'tumble',
  // (a small work: the kit keeps the whole of it in view, in the upper part, with the cloth and apples below)
  stage: { out: 1.2, half: 1.0, cam: { dist: 2.5, height: 0.85, side: 0.32, fov: 54, lookOut: 0.5, lookH: 0.6, floorOut: 1.15 } },
  wake: 2, ret: 2.6,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.3) => P.near(h, a);
    this.tmp = new THREE.Vector3(); this.o = {}; this.t = 0;
    // ---------------------------------------------------------- the cloth: a rectangle, falling, and lying in its folds
    const nTri = NA * NS * 2, pos = new Float32Array(nTri * 9), colr = new Float32Array(nTri * 9);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nTri * 9), 3));
    this.cloth = L.add(new THREE.Mesh(geo, L.paint({ flat: true, glow: 0.42, rough: 0.85, side: THREE.DoubleSide })));
    this.V = new Float32Array((NA + 1) * (NS + 1) * 3);
    // Colour each plane by how it lies to the light once it has settled: his whites, creams and blue-greys; the hem a line.
    this.lay(L, 1, 0);
    const lu = -0.45, ly = 0.8, lo = 0.4, ll = Math.hypot(lu, ly, lo), light = new THREE.Vector3((L.tx * lu + L.nx * lo) / ll, ly / ll, (L.tz * lu + L.nz * lo) / ll);
    const tones = [col('#f4f2ea', 0.15), col('#efe6cf', 0.2), col('#e6dcc2', 0.2), col('#cdd6dc', 0.25), col('#b3c2cf', 0.25), col('#97a9bb', 0.25), col('#c9c2cf', 0.2)], hem = col('#d9cfb6', 0.2);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), n = new THREE.Vector3(), c = new THREE.Color();
    for (let i = 0, f = 0; i < NA; i++) for (let j = 0; j < NS; j++) for (let h = 0; h < 2; h++, f++) {
      a.fromArray(pos, f * 9 + 3).sub(this.tmp.fromArray(pos, f * 9)); b.fromArray(pos, f * 9 + 6).sub(this.tmp); n.crossVectors(a, b).normalize();
      const d = Math.abs(n.dot(light)) * (n.y < -0.2 ? 0.6 : 1) + (L.rand() - 0.5) * 0.1;
      c.copy(d > 0.82 ? tones[0] : d > 0.66 ? tones[L.rand() < 0.5 ? 1 : 0] : d > 0.5 ? tones[2] : d > 0.36 ? tones[L.rand() < 0.8 ? 3 : 6] : d > 0.2 ? tones[4] : tones[5]);
      if (j === 0 || j === NS - 1 || i === 0 || i === NA - 1) c.lerp(hem, 0.7);                     // the hem, all round
      for (let v = 0; v < 3; v++) colr.set([c.r, c.g, c.b], f * 9 + v * 3);
    }
    // the crest of a fold, near the middle, for the apple that teeters
    let best = -1; for (let i = 4; i <= NA - 4; i++) for (let j = 3; j <= NS - 6; j++) { const h = this.foldH(i / NA - 0.5, j / NS * LF); if (h > best) { best = h; this.crest = { a: i / NA - 0.5, s: j / NS * LF, h }; } }
    this.lay(L, 0, 0);

    // ---------------------------------------------------------- apples, built of planes; and two biscuits
    const kinds = [
      { base: '#b9452e', mid: '#d2742f', hi: '#e2bd4f', spot: '#8e9b44', shadow: '#7a2a24' },      // red going yellow
      { base: '#97ad55', mid: '#b9c467', hi: '#dccb6a', spot: '#c0653a', shadow: '#5e7340' },      // green-yellow
      { base: '#a1302a', mid: '#bd4a30', hi: '#d98a3c', spot: '#6f2b24', shadow: '#5a2420' },      // deep red
      { base: '#d39a3f', mid: '#c56f34', hi: '#e8cc68', spot: '#a6492c', shadow: '#8b5a2c' },      // yellow-orange
    ];
    const rig = this.rig = L.rig(APPLES + 4, 8000, L.paint({ flat: true, glow: 0.48, rough: 0.55 }));
    const lit = new THREE.Vector3(-0.5, 0.75, 0.45).normalize();
    const apple = (k, r) => {
      const g = shape.ball(1, col(k.base), 1);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const top = Math.max(0, y - 0.55); y = y * 0.86 - top * 0.55; const w = (1 + 0.06 * Math.sin(x * 5 + z * 3)) * (1 + 0.07 * Math.sin(x * 12.9 + y * 78.2 + z * 37.7 + r * 400)); p.setXYZ(i, x * r * w, y * r * w, z * r * w); }      // (lumpy, and every plane a little different, the same wherever a corner is shared)
      g.computeVertexNormals();
      const cs = { base: col(k.base), mid: col(k.mid), hi: col(k.hi), spot: col(k.spot), shadow: col(k.shadow) };
      shape.paint(g, (cen, nn) => { const d = nn.dot(lit), q = L.rand(); return d > 0.55 ? (q < 0.6 ? cs.hi : cs.mid) : d > 0.1 ? (q < 0.18 ? cs.spot : q < 0.6 ? cs.mid : cs.base) : d > -0.4 ? (q < 0.12 ? cs.spot : cs.base) : (q < 0.5 ? cs.shadow : cs.base); });
      const stalk = shape.move(shape.cyl(0.004, 0.0025, r * 0.4, 5, col('#4d3a22')), 0.002, r * 0.86 - r * 0.25, 0, 0, 0, 0.25);
      return shape.merge([g, stalk]);
    };
    const geos = []; for (let i = 0; i < 8; i++) { const r = 0.072 + (i % 3) * 0.009; geos.push({ id: rig.geo(apple(kinds[i % 4], r)), r }); }
    this.apples = [];
    this.roll = L.rollers(APPLES, { r: 0.08, bounce: 0.56, roll: 0.45, onBounce: (bb, sp) => this.bounce(L, bb, sp), ground: (x, z) => this.onCloth(L, x, z) });
    for (let i = 0; i < APPLES; i++) {
      const g = geos[(i * 5) % 8], bb = this.roll.items[i]; bb.r = g.r; bb.i = i;
      this.apples.push({ inst: rig.add(g.id), b: bb, te: 1.7 + i * 0.28 + (i > TEETER ? 0.4 : 0), u: (L.rand() - 0.5) * 0.36, state: 'in', spin: new THREE.Vector3(L.rand() - 0.5, L.rand() - 0.5, L.rand() - 0.5).normalize(), wob: 0, wt: 0, wax: new THREE.Vector3(1, 0, 0), q0: new THREE.Quaternion().setFromEuler(new THREE.Euler(L.rand() * 6, L.rand() * 6, L.rand() * 6)), last: 0 });
    }
    this.apples[TEETER].u = this.crest.a * W * 0.6;
    const biscuit = shape.ball(1, col('#dcaa62'), 1);
    { const p = biscuit.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setXYZ(i, x * 0.06, p.getY(i) * 0.013 * (1 - 0.25 * x * x), p.getZ(i) * 0.02 * (1 - 0.2 * x * x)); } biscuit.computeVertexNormals(); }
    shape.paint(biscuit, (cen, nn) => (nn.y < -0.3 ? col('#b07a3e') : L.rand() < 0.22 ? col('#f0d9a6') : null));
    const bg = rig.geo(biscuit);
    this.biscuits = [0, 1].map(i => ({ inst: rig.add(bg), te: 5.0 + i * 0.6, u0: i ? 0.1 : -0.12, to: { a: i ? 0.22 : -0.2, s: i ? 0.34 : 0.52 }, yaw: i ? 0.5 : -0.4, k: 0, state: 'in' }));
    this.blobs = L.blobs(APPLES + 2);
    this.m = new THREE.Matrix4(); this.v = new THREE.Vector3(); this.w = new THREE.Vector3(); this.q = new THREE.Quaternion(); this.qq = new THREE.Quaternion(); this.one = new THREE.Vector3(1, 1, 1); this.eu = new THREE.Euler();
    this.hideAll();
  },

  // The folds of the cloth lying on the floor at a (across, -0.5..0.5) and s (out from its near edge, 0..LF): two big
  // diagonals and a smaller one, a little ruck along the wall side, the far hem and corners lying flat; at most 11.5 cm.
  foldH(a, s) {
    const u = a * W, k = 1 - s / LF, edge = ease.smooth(ramp(k, 0, 0.12)) * ease.smooth(ramp(s, 0, 0.06)), corner = Math.min(1, Math.hypot(Math.abs(a) - 0.5, s - LF) / 0.3);
    const diag = (0.5 + 0.5 * Math.sin((u * 0.8 + s * 1.1) * 6.2 + 0.4)) ** 1.6 * 0.062 + (0.5 + 0.5 * Math.sin((u * 1.1 - s * 0.7) * 4.6 + 1.7)) ** 2 * 0.036;      // (broad, rounded)
    const ruck = Math.exp(-s / 0.12) * 0.022 * (0.5 + 0.5 * Math.sin(a * Math.PI * 6));
    return Math.min(0.115, (diag * (0.35 + 0.65 * k) + ruck) * edge * ease.smooth(corner));
  },
  // Lay the cloth: f how far through its fall (0 still a bundle under the rail, 1 down on the floor), z how far it is
  // still settling into its folds (0..1), wind the time for the ripples running through it as it falls.
  lay(L, f, wind) {
    this.f = f; const V = this.V, p = this.tmp;
    // its middle, its tilt (hanging from its near edge at first, lying flat at the end), its turn and how open it is
    const fall = f < 0.12 ? 0 : (f - 0.12) / 0.88;
    const cout = 0.05 + (NEAR + LF / 2 - 0.05) * ease.out(fall), tilt = 1.25 * (1 - ease.inOut(fall)), turn = 0.28 * Math.sin(fall * Math.PI) * (1 - fall * 0.3);
    const sc = f < 0.12 ? 0.25 + 0.25 * (f / 0.12) : 0.5 + 0.5 * ease.out(fall), wide = Math.min(1, sc * 1.15), slide = f < 0.12 ? -L.wall - 0.25 * (1 - f / 0.12) : 0;
    // (hanging, its top edge stays under the rail, never up in front of the picture; then it drops, slowed by the air)
    const hang = L.rail - 0.04 - (LF / 2) * sc * Math.sin(tilt) - 0.08, cy = hang + (L.y + 0.012 - hang) * (0.25 * fall + 0.75 * ease.in(fall));
    const bill = (f < 1 ? 0.025 : 0) + Math.sin(Math.min(1, fall) * Math.PI) * 0.06, settle = f >= 1 ? 1 : 0.35 + 0.65 * ease.smooth(fall);
    const ct = Math.cos(tilt), st = Math.sin(tilt), cr = Math.cos(turn), sr = Math.sin(turn);
    for (let i = 0; i <= NA; i++) for (let j = 0; j <= NS; j++) {
      const a = i / NA - 0.5, s = j / NS * LF;
      let lu = a * W * wide, lz = (s - LF / 2) * sc;
      let ly = this.foldH(a, s) * settle + bill * Math.sin((a * 1.3 + s * 1.6) * Math.PI * 2 - wind * 9) * (0.4 + 0.6 * Math.abs(a) * 2);
      const y1 = ly * ct - lz * st, z1 = lz * ct + ly * st;                 // tilted about the line along the wall
      const u2 = lu * cr - z1 * sr, z2 = lu * sr + z1 * cr;                 // and turned a little
      let out = cout + z2 + slide; const yy = Math.max(L.y + 0.012, cy + y1);
      if (f < 0.12) out = Math.max(-L.wall - 0.2, Math.min(out, 0.06));
      L.at(u2, yy - L.cy, out, p); V.set([p.x, p.y, p.z], (i * (NS + 1) + j) * 3);
    }
    const pos = this.cloth.geometry.attributes.position.array; let k = 0;
    const put = q => { pos[k++] = V[q]; pos[k++] = V[q + 1]; pos[k++] = V[q + 2]; };
    for (let i = 0; i < NA; i++) for (let j = 0; j < NS; j++) { const A = (i * (NS + 1) + j) * 3, B = ((i + 1) * (NS + 1) + j) * 3; put(A); put(B); put(B + 3); put(A); put(B + 3); put(A + 3); }
    this.cloth.geometry.attributes.position.needsUpdate = true;
    this.cloth.visible = f > 0.002;
  },
  // Where a point of the cloth lying on the floor is (world), for the apples and biscuits.
  onFloor(L, a, s, into) { return L.floor(a * W, NEAR + s, into).setY(L.y + 0.012 + this.foldH(a, s)); },
  onCloth(L, x, z) {
    if (this.f < 1) return 0;
    const q = L.local(x, z), s = q.out - NEAR, a = q.u / W;
    return s < 0 || s > LF || Math.abs(a) > 0.5 ? 0 : 0.012 + this.foldH(a, s);
  },
  hideAll() { for (const ap of this.apples) { this.rig.show(ap.inst, false); ap.state = 'in'; ap.b.on = false; } for (const bi of this.biscuits) { this.rig.show(bi.inst, false); bi.state = 'in'; } this.blobs.count = 0; },

  start(L, resumed) {
    if (!resumed) { this.hideAll(); this.lay(L, 0, 0); this.sung = false; this.thumped = false; L.k.synth.noise(0.5, { vol: 0.02, lp: 2200, at: 0.1 }); }
  },
  back(L) {
    for (const ap of this.apples) ap.from = ap.state !== 'in' ? (ap.from0 || (ap.from0 = new THREE.Vector3())).set(ap.b.x, ap.b.y, ap.b.z) : null;
    for (const bi of this.biscuits) bi.from = bi.state !== 'in' ? bi.k : null;
    this.f0 = this.f;
  },
  end() { this.hideAll(); },
  reset(L) { this.hideAll(); this.lay(L, 0, 0); },

  update(L, dt) {
    const ph = L.phase, t = L.t, rig = this.rig;
    this.t += dt;
    if (ph === 'wake' || ph === 'play') {
      // The cloth: out from under the rail, a fall of a second, billowing and turning, and down flat on the floor.
      const f = t < T_OUT ? 0 : t < T_DROP ? 0.12 * (t - T_OUT) / (T_DROP - T_OUT) : t < T_LAND ? 0.12 + 0.88 * (t - T_DROP) / (T_LAND - T_DROP) : 1;
      if (f > this.f || (f > 0 && f < 1)) this.lay(L, Math.max(this.f, f), this.t);
      if (!this.thumped && this.f >= 1) { this.thumped = true; L.k.synth.noise(0.3, { vol: 0.035, lp: 480 }); }
      // The apples, one at a time, out from under the rail, and down onto the cloth.
      for (const ap of this.apples) {
        const b = ap.b;
        if (ap.state === 'in' && t >= ap.te) { ap.state = 'pop'; ap.pt = 0; }
        if (ap.state === 'pop') {
          ap.pt += dt / 0.22; const q = ease.out(ap.pt);
          L.at(ap.u, L.rail - b.r - 0.006 - L.cy, -L.wall - b.r + q * (L.wall + 2 * b.r + 0.03), this.v);
          b.x = this.v.x; b.y = this.v.y; b.z = this.v.z;
          if (ap.pt >= 1) {
            if (b.i === TEETER) { ap.state = 'drop'; ap.dt = 0; ap.p0 = (ap.p0 || new THREE.Vector3()).copy(this.v); continue; }
            ap.state = 'out'; b.on = true; const last = b.i === APPLES - 1;
            const vu = (L.rand() - 0.5) * (last ? 0.12 : 1.0), vo = last ? 1.45 : 0.6 + L.rand() * 0.75;
            b.vx = L.tx * vu + L.nx * vo; b.vz = L.tz * vu + L.nz * vo; b.vy = 0.55 + L.rand() * 0.4;
          }
        }
        if (ap.state === 'drop') {
          // down onto the crest of a fold, and it stays there, rocking, before it rolls off
          ap.dt += dt; const k = Math.min(1, ap.dt / 0.5), C = this.onFloor(L, this.crest.a, this.crest.s, this.w); C.y += b.r * 0.92;
          this.v.lerpVectors(ap.p0, C, k); this.v.y = ap.p0.y + (C.y - ap.p0.y) * k * k + 0.15 * Math.sin(k * Math.PI) * (1 - k);
          b.x = this.v.x; b.y = this.v.y; b.z = this.v.z;
          if (k >= 1) { ap.state = 'teeter'; ap.tt = 0; this.bounce(L, b, 2); }
        }
        if (ap.state === 'teeter') {
          ap.tt += dt; ap.wax.set(L.tx, 0, L.tz); ap.wob = 0.22 + 0.22 * Math.min(1, ap.tt / 1.3); ap.wt = ap.tt * 1.2;
          if (ap.tt > 1.7) { ap.state = 'out'; b.on = true; b.vx = L.nx * 0.45 + L.tx * 0.2; b.vz = L.nz * 0.45 + L.tz * 0.2; b.vy = 0.15; ap.wob = 0; L.voice().note(1318.5, 0.18, { vol: 0.02 }); }
        }
      }
      // Now and then, while you keep looking, the floor tips a little (as his table does), and they roll again.
      if (t > 10) {
        const k = (t - 10) % 8, on = k < 1.3 ? Math.sin(k / 1.3 * Math.PI) : 0, dir = Math.floor((t - 10) / 8) * 2.4;
        const du = Math.cos(dir), dout = Math.sin(dir) * 0.6 + 0.2, ax = (L.tx * du + L.nx * dout) * 0.28 * on, az = (L.tz * du + L.nz * dout) * 0.28 * on;
        if (on > 0) for (const ap of this.apples) if (ap.b.on && !ap.b.air) { ap.b.vx += ax * dt; ap.b.vz += az * dt; }
      }
      this.roll.step(dt);
      // Biscuits: out from under the rail, a drop and a turn, and flat on the cloth.
      for (const bi of this.biscuits) {
        if (bi.state === 'in' && t >= bi.te) { bi.state = 'slide'; bi.k = 0; this.swish(L); }
        if (bi.state === 'slide') { bi.k = Math.min(1, bi.k + dt / 0.75); if (bi.k >= 1) bi.state = 'out'; }
      }
      if (!this.sung && t > 6.8) { this.sung = true; this.gymnopedie(L); }
    } else if (ph === 'linger') {
      this.roll.step(dt);
    } else if (ph === 'return') {
      // Back they all come: across the floor to the wall, up and in under the rail; then the cloth lifts, flutters up
      // and slips back in under the rail after them.
      const R = L.ret;
      this.apples.forEach((ap, i) => {
        if (!ap.from) return; const b = ap.b, k = ease.inOut(clamp01((R * 2.6 - i * 0.04) / 1.3));
        const mouth = L.at(ap.u, L.rail - b.r - 0.006 - L.cy, -L.wall - b.r * (k > 0.97 ? 3 : 0), this.tmp), base = L.floor(ap.u * 0.8, 0.12 + b.r);
        const s1 = 1 - k, x = s1 * s1 * ap.from.x + 2 * s1 * k * base.x + k * k * mouth.x, y = s1 * s1 * ap.from.y + 2 * s1 * k * (L.y + b.r + 0.3) + k * k * mouth.y, z = s1 * s1 * ap.from.z + 2 * s1 * k * base.z + k * k * mouth.z;
        const d = Math.hypot(x - b.x, z - b.z) + Math.abs(y - b.y);
        b.q.premultiply(this.qq.setFromAxisAngle(ap.spin, -d / b.r));
        b.x = x; b.y = y; b.z = z; b.on = false; ap.wob = 0;
        if (k >= 1) { ap.state = 'in'; ap.from = null; }
      });
      for (const bi of this.biscuits) if (bi.from != null) bi.k = bi.from * (1 - ease.inOut(clamp01(R * 1.9)));
      this.lay(L, this.f0 * (1 - ease.inOut(ramp(R, 0.55, 1))), this.t);
    }
    // Draw them where they are: apples tumbling in the air, rocking as they come to rest.
    let nb = 0;
    for (const ap of this.apples) {
      const b = ap.b, show = ap.state !== 'in' || (ph === 'return' && ap.from);
      rig.show(ap.inst, !!show); if (!show) continue;
      if (b.air && b.on) b.q.premultiply(this.qq.setFromAxisAngle(ap.spin, dt * 9));
      const sp = Math.hypot(b.vx, b.vz);
      if (b.on && !b.air) {
        if (sp > 0.06) { ap.last = sp; ap.wob = 0; this.v.set(b.vz, 0, -b.vx).normalize(); ap.wax.copy(this.v); }
        else if (ap.last > 0.06) { ap.wob = Math.min(0.32, ap.last * 1.1); ap.wt = 0; ap.last = 0; }
      }
      if (ap.state !== 'teeter') ap.wt += dt;
      this.q.copy(b.q).multiply(ap.q0);
      if (ap.wob > 0.002) {
        const teeter = ap.state === 'teeter', amp = teeter ? ap.wob : ap.wob * Math.exp(-ap.wt * 2.6);
        this.q.premultiply(this.qq.setFromAxisAngle(ap.wax, amp * Math.sin(ap.wt * (teeter ? 9 : 13))));
        if (ap.wt > 3 && !teeter) ap.wob = 0;
      }
      rig.mat(ap.inst, this.m.compose(this.v.set(b.x, b.y, b.z), this.q, this.one));
      if (b.y - L.y < 0.45) this.blobs.set(nb++, b.x, b.z, b.r * 1.15, 0.85 * clamp01(1 - (b.y - L.y - b.r) / 0.35));
    }
    for (const bi of this.biscuits) {
      const show = bi.state !== 'in' || (ph === 'return' && bi.from != null && bi.k > 0.01);
      rig.show(bi.inst, !!show); if (!show) continue;
      // out from under the rail (0..0.2), then a drop and a turn onto the cloth (0.2..1)
      const k = bi.k; let flat = 0;
      L.at(bi.u0, L.rail - 0.03 - L.cy, -L.wall + Math.min(1, k / 0.2) * (L.wall + 0.05), this.w);
      if (k < 0.2) this.v.copy(this.w);
      else {
        const s = (k - 0.2) / 0.8, land = this.onFloor(L, bi.to.a, bi.to.s, this.tmp); land.y += 0.016;
        this.v.lerpVectors(this.w, land, ease.smooth(s)); this.v.y = this.w.y + (land.y - this.w.y) * (s * s); flat = ease.smooth(s);
      }
      this.q.setFromEuler(this.eu.set(-Math.PI / 2 * (1 - flat), L.yawOut + Math.PI / 2 + bi.yaw * flat, 0, 'YXZ'));
      rig.mat(bi.inst, this.m.compose(this.v, this.q, this.one));
      if (flat > 0.5) this.blobs.set(nb++, this.v.x, this.v.z, 0.06, 0.4);
    }
    this.blobs.count = nb;
    L.voice().place();
  },

  // A bounce: a soft wooden note, higher for the small ones, as loud as the knock.
  bounce(L, b, sp) {
    const v = L.voice(), f = NOTES[(b.i * 3) % NOTES.length], vol = Math.min(0.06, 0.012 + sp * 0.012);
    v.note(f, 0.32, { vol, type: 'sine', attack: 0.003 }); v.note(f * 3.98, 0.06, { vol: vol * 0.35, type: 'sine', attack: 0.002 });
  },
  swish(L) { L.k.synth.noise(0.4, { vol: 0.02, lp: 2600 }); },
  gymnopedie(L) {
    const v = L.voice(), bpm = 76, b = 60 / bpm;
    v.tune(GYMNO, { bpm, type: 'triangle', vol: 0.03 });
    v.tune(GYM_BASS, { bpm, type: 'sine', vol: 0.03, legato: 0.6 });
    for (let bar = 0; bar < 6; bar++) for (const n of GYM_CHORD[bar % 2].split(' ')) v.tune(n + ':2', { bpm, type: 'sine', vol: 0.012, at: (bar * 3 + 1) * b, legato: 0.8 });
  },
});
