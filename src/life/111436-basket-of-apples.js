// Paul Cézanne, The Basket of Apples (about 1893), Gallery 248. The word: tumble.
//
// Look at it and his white tablecloth spills out from under the frame: a short, heavy fall of cloth over the bottom
// rail, and the rest of it drops to the floor and lies there in a crumpled heap of folds, made as he made it, out of
// planes: white, warm cream where the light falls, cool blue-greys in the hollows. Then the apples come, one after
// another, out from under the rail: they hop off the cloth, drop, bounce (each bounce a soft wooden note), tumble and
// roll out across the floor in his colours, and rock to rest on the folds and the floorboards. One catches in the hem
// and teeters there before it lets go. Two of the pale biscuits off the plate slide down after them. Every apple is
// built of flat planes of colour (green, yellow, red-orange, a cool shadow plane), and while you keep looking the floor
// tips a little now and then, as his table does, and they roll and settle again. A phrase of Satie's first
// Gymnopédie (1888) as they come to rest.
//
// When you stop looking they stay out while the toy is near, so you can drive into them and send them rolling (they
// never stop the toy, and keep out of the doorways). Drive off, or wait half a minute, and they roll back to the wall
// and up into the frame, and the cloth gathers itself up and goes back in after them.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, shape } from '../paintlife.js';

const APPLES = 16, TEETER = 6;
const SPILL = 0.36;                              // how far the cloth hangs down the wall from under the frame, at most (m)
const SA = 14, SL = 7, PA = 26, PB = 20;          // the grids: the fall (across, down) and the heap (across, out)
const PO = 0.52, PU = 0.6, POUT = 0.46;           // the heap: its middle out from the wall, half its width and depth
const NOTES = [587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.5];            // D major pentatonic, for the bounces
// Gymnopédie No. 1 (Erik Satie, 1888): the first phrase, over its two chords. 3/4.
const GYMNO = 'R F#5 A5 | G5 F#5 C#5 | B4 C#5 D5 | A4:3 | F#4:3 | R:3';
const GYM_BASS = 'G2:3 | D2:3 | G2:3 | D2:3 | G2:3 | D2:3';
const GYM_CHORD = ['B3 D4 F#4', 'A3 C#4 F#4'];

lifeFor(111436, {
  title: /^The Basket of Apples/,
  word: 'tumble',
  stage: { out: 1.2, half: 1.0, cam: { dist: 2.6, height: 0.9, side: 0.35, fov: 50, lookOut: 0.6, lookH: 0.52 } },
  wake: 2, ret: 2.4,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.3) => P.near(h, a);
    this.tmp = new THREE.Vector3(); this.o = {};
    // ---------------------------------------------------------- the cloth: a short fall over the rail, and a heap on the floor
    const nTri = 2 * (SA * SL + PA * PB), pos = new Float32Array(nTri * 9), colr = new Float32Array(nTri * 9);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nTri * 9), 3));
    this.cloth = L.add(new THREE.Mesh(geo, L.paint({ flat: true, glow: 0.42, rough: 0.85, side: THREE.DoubleSide })));
    this.SV = new Float32Array((SA + 1) * (SL + 1) * 3); this.PV = new Float32Array((PA + 1) * (PB + 1) * 3);
    // Colour each plane by how it lies to the light once the cloth has settled: his whites, creams and blue-greys.
    this.shapeCloth(L, 1, 1);
    const lu = -0.45, ly = 0.8, lo = 0.4, ll = Math.hypot(lu, ly, lo), light = new THREE.Vector3((L.tx * lu + L.nx * lo) / ll, ly / ll, (L.tz * lu + L.nz * lo) / ll);
    const tones = [col('#f4f2ea', 0.15), col('#efe6cf', 0.2), col('#e6dcc2', 0.2), col('#cdd6dc', 0.25), col('#b3c2cf', 0.25), col('#97a9bb', 0.25), col('#c9c2cf', 0.2)];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), n = new THREE.Vector3(), c = new THREE.Color();
    for (let f = 0; f < nTri; f++) {
      a.fromArray(pos, f * 9 + 3).sub(this.tmp.fromArray(pos, f * 9)); b.fromArray(pos, f * 9 + 6).sub(this.tmp); n.crossVectors(a, b).normalize();
      const d = Math.abs(n.dot(light)) * (n.y < -0.2 ? 0.6 : 1) + (L.rand() - 0.5) * 0.12;
      c.copy(d > 0.82 ? tones[0] : d > 0.66 ? tones[L.rand() < 0.5 ? 1 : 0] : d > 0.5 ? tones[2] : d > 0.36 ? tones[L.rand() < 0.8 ? 3 : 6] : d > 0.2 ? tones[4] : tones[5]);
      for (let v = 0; v < 3; v++) colr.set([c.r, c.g, c.b], f * 9 + v * 3);
    }
    this.shapeCloth(L, 0, 0);

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
    this.roll = L.rollers(APPLES, { r: 0.08, bounce: 0.56, roll: 0.45, onBounce: (bb, sp) => this.bounce(L, bb, sp), ground: (x, z) => this.heapAt(L, x, z) });
    for (let i = 0; i < APPLES; i++) {
      const g = geos[(i * 5) % 8], bb = this.roll.items[i]; bb.r = g.r; bb.i = i;
      this.apples.push({ inst: rig.add(g.id), b: bb, te: 1.0 + i * 0.3 + (i > TEETER ? 0.5 : 0), u: (L.rand() - 0.5) * 0.36, state: 'in', spin: new THREE.Vector3(L.rand() - 0.5, L.rand() - 0.5, L.rand() - 0.5).normalize(), wob: 0, wt: 0, wax: new THREE.Vector3(1, 0, 0), q0: new THREE.Quaternion().setFromEuler(new THREE.Euler(L.rand() * 6, L.rand() * 6, L.rand() * 6)), last: 0 });
    }
    this.apples[TEETER].u = 0.12;
    const biscuit = shape.ball(1, col('#dcaa62'), 1);
    { const p = biscuit.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setXYZ(i, x * 0.06, p.getY(i) * 0.013 * (1 - 0.25 * x * x), p.getZ(i) * 0.02 * (1 - 0.2 * x * x)); } biscuit.computeVertexNormals(); }
    shape.paint(biscuit, (cen, nn) => (nn.y < -0.3 ? col('#b07a3e') : L.rand() < 0.22 ? col('#f0d9a6') : null));
    const bg = rig.geo(biscuit);
    this.biscuits = [0, 1].map(i => ({ inst: rig.add(bg), te: 4.6 + i * 0.6, u0: i ? 0.1 : -0.12, to: { u: i ? 0.22 : -0.18, out: i ? 0.42 : 0.62 }, yaw: i ? 0.5 : -0.4, k: 0, state: 'in' }));
    this.blobs = L.blobs(APPLES + 2);
    this.m = new THREE.Matrix4(); this.v = new THREE.Vector3(); this.w = new THREE.Vector3(); this.q = new THREE.Quaternion(); this.qq = new THREE.Quaternion(); this.one = new THREE.Vector3(1, 1, 1); this.eu = new THREE.Euler();
    this.hideAll();
  },

  // The fall over the rail: a across (-0.5..0.5), l down it (0..1 of its length there). Its hem hangs in points.
  hem(a) { return SPILL * (0.58 + 0.42 * (0.5 + 0.5 * Math.sin(a * 9.4 + 1.1)) * (1 - 0.3 * Math.abs(a))); },
  spillAt(L, a, l, o) {
    const len = this.hem(a), fold = 0.5 + 0.5 * Math.sin(a * Math.PI * 6 + 0.4) + 0.2 * Math.sin(a * 19);
    o.u = a * (0.36 + 0.14 * l) + 0.012 * Math.sin(l * 6 + a * 5);
    o.y = L.rail + 0.006 - l * len;
    o.out = -L.wall + 0.018 + fold * 0.055 * (0.25 + 0.75 * l) + 0.03 * l * l;
    return o;
  },
  // The heap: how high the cloth stands at (u, out) on the floor (crumpled folds round a middle, corners lying flat).
  crumple(u, out) {
    const du = u / PU, dov = (out - PO) / POUT, r = Math.hypot(du, dov), th = Math.atan2(dov, du);
    const env = 1 - ease.smooth(ramp(r, 0.35, 1.05));
    const ridge = Math.pow(Math.abs(Math.sin(th * 3.5 + r * 4.2)), 0.6), lump = Math.max(0, Math.sin(du * 4.1 + 0.6) * Math.cos(dov * 3.3 - 0.4));
    return env * (0.085 * ridge + 0.075 * lump + 0.03 * Math.sin(u * 17 + out * 9) + 0.035) + 0.004 * Math.sin(u * 23 - out * 13);
  },
  heapAt(L, x, z) {
    if (this.drop < 1) return 0;
    const q = L.local(x, z);
    return Math.abs(q.u) < PU * 1.05 && Math.abs(q.out - PO) < POUT * 1.05 ? Math.max(0, this.crumple(q.u, q.out)) + 0.008 : 0;
  },
  // Lay the cloth: sp how much of the fall is out (0..1), drop how far the heap has come down and settled (0..1).
  shapeCloth(L, sp, drop) {
    this.sp = sp; this.drop = drop;
    const S = this.SV, H = this.PV, o = this.o, p = this.tmp;
    for (let i = 0; i <= SA; i++) for (let j = 0; j <= SL; j++) { this.spillAt(L, i / SA - 0.5, Math.min(sp, j / SL), o); L.at(o.u, o.y - L.cy, o.out, p); S.set([p.x, p.y, p.z], (i * (SL + 1) + j) * 3); }
    // the heap falls from the hem of the fall, small and gathered, and spreads and crumples as it lands
    const e = drop < 0.62 ? ease.in(drop / 0.62) * 0.92 : 0.92 + 0.08 * ease.outBack((drop - 0.62) / 0.38), sc = 0.3 + 0.7 * e, hy = L.rail - SPILL - L.y;
    for (let i = 0; i <= PA; i++) for (let j = 0; j <= PB; j++) {
      const a = i / PA - 0.5, bq = j / PB, u = a * 2 * PU * (1 - 0.12 * bq) + 0.03 * Math.sin(bq * 7 + a * 3), out = PO + (bq - 0.5) * 2 * POUT;
      const h = this.crumple(u, out), uu = u * sc, oo = 0.06 + (out - 0.06) * sc;
      L.at(uu, (L.y + 0.012 + Math.max(0.0, h) * (0.35 + 0.65 * e) + hy * (1 - e) * (0.6 + 0.4 * bq)) - L.cy, oo, p);
      H.set([p.x, p.y, p.z], (i * (PB + 1) + j) * 3);
    }
    const pos = this.cloth.geometry.attributes.position.array; let f = 0;
    const put = (V, k) => { pos[f++] = V[k]; pos[f++] = V[k + 1]; pos[f++] = V[k + 2]; };
    for (let i = 0; i < SA; i++) for (let j = 0; j < SL; j++) { const A = (i * (SL + 1) + j) * 3, B = ((i + 1) * (SL + 1) + j) * 3; put(S, A); put(S, B); put(S, B + 3); put(S, A); put(S, B + 3); put(S, A + 3); }
    for (let i = 0; i < PA; i++) for (let j = 0; j < PB; j++) { const A = (i * (PB + 1) + j) * 3, B = ((i + 1) * (PB + 1) + j) * 3; put(H, A); put(H, B); put(H, B + 3); put(H, A); put(H, B + 3); put(H, A + 3); }
    // (a heap not yet fallen is folded away out of sight, into the wall behind the fall)
    if (drop <= 0) { L.at(0, L.rail - 0.1 - L.cy, -L.wall - 0.1, p); for (let k = SA * SL * 18; k < pos.length; k += 3) { pos[k] = p.x; pos[k + 1] = p.y; pos[k + 2] = p.z; } }
    this.cloth.geometry.attributes.position.needsUpdate = true;
    this.cloth.visible = sp > 0.005;
  },
  hideAll() { for (const ap of this.apples) { this.rig.show(ap.inst, false); ap.state = 'in'; ap.b.on = false; } for (const bi of this.biscuits) { this.rig.show(bi.inst, false); bi.state = 'in'; } this.blobs.count = 0; },

  start(L, resumed) {
    if (!resumed) { this.hideAll(); this.shapeCloth(L, 0, 0); this.sung = false; this.thumped = false; L.k.synth.noise(0.7, { vol: 0.025, lp: 1400, at: 0.25 }); }
  },
  back(L) {
    for (const ap of this.apples) ap.from = ap.state !== 'in' ? (ap.from0 || (ap.from0 = new THREE.Vector3())).set(ap.b.x, ap.b.y, ap.b.z) : null;
    for (const bi of this.biscuits) bi.from = bi.state !== 'in' ? bi.k : null;
    this.sp0 = this.sp; this.drop0 = this.drop;
  },
  end() { this.hideAll(); },
  reset(L) { this.hideAll(); this.shapeCloth(L, 0, 0); },

  update(L, dt) {
    const ph = L.phase, t = L.t, rig = this.rig;
    if (ph === 'wake' || ph === 'play') {
      // The cloth: out from under the frame and over the rail, and the rest of it down onto the floor in a heap.
      const sp = ease.out(ramp(t, 0.15, 0.6)), drop = ramp(t, 0.45, 1.15);
      if (sp > this.sp || drop > this.drop) this.shapeCloth(L, Math.max(this.sp, sp), Math.max(this.drop, drop));
      if (!this.thumped && this.drop >= 0.62) { this.thumped = true; L.k.synth.noise(0.25, { vol: 0.04, lp: 500 }); }
      // The apples, one at a time, out from under the rail, a hop off the cloth, and away.
      for (const ap of this.apples) {
        const b = ap.b;
        if (ap.state === 'in' && t >= ap.te) { ap.state = 'pop'; ap.pt = 0; }
        if (ap.state === 'pop') {
          ap.pt += dt / 0.22; const q = ease.out(ap.pt), front = this.spillAt(L, ap.u / 0.43, 0.05, this.o).out;
          L.at(ap.u, L.rail - b.r - 0.006 - L.cy, -L.wall - b.r + q * (front + L.wall + 2 * b.r), this.v);
          b.x = this.v.x; b.y = this.v.y; b.z = this.v.z;
          if (ap.pt >= 1) {
            if (b.i === TEETER) { ap.state = 'teeter'; ap.tt = 0; continue; }
            ap.state = 'out'; b.on = true; const last = b.i === APPLES - 1;
            const vu = (L.rand() - 0.5) * (last ? 0.12 : 1.0), vo = last ? 1.45 : 0.6 + L.rand() * 0.75;
            b.vx = L.tx * vu + L.nx * vo; b.vz = L.tz * vu + L.nz * vo; b.vy = 0.55 + L.rand() * 0.4;
          }
        }
        if (ap.state === 'teeter') {
          // caught in the hem: it slides down the fall to the lowest point, and rocks there before it lets go
          ap.tt += dt; const k = Math.min(1, ap.tt / 0.45), o = this.spillAt(L, ap.u / 0.43, k, this.o);
          L.at(o.u, o.y - L.cy - b.r * (k >= 1 ? 0.6 : 1), o.out + b.r * 0.95, this.v);
          b.x = this.v.x; b.y = this.v.y; b.z = this.v.z;
          ap.wax.set(L.tx, 0, L.tz); ap.wob = ap.tt > 0.45 ? 0.25 + 0.2 * Math.min(1, (ap.tt - 0.45) / 1.2) : 0; ap.wt = ap.tt * 1.3;
          if (ap.tt > 1.9) { ap.state = 'out'; b.on = true; b.vx = L.nx * 0.55; b.vz = L.nz * 0.55; b.vy = 0.1; ap.wob = 0; L.voice().note(1318.5, 0.18, { vol: 0.02 }); }
        }
      }
      // Now and then, while you keep looking, the floor tips a little (as his table does), and they roll again.
      if (t > 10) {
        const k = (t - 10) % 8, on = k < 1.3 ? Math.sin(k / 1.3 * Math.PI) : 0, dir = Math.floor((t - 10) / 8) * 2.4;
        const du = Math.cos(dir), dout = Math.sin(dir) * 0.6 + 0.2, ax = (L.tx * du + L.nx * dout) * 0.28 * on, az = (L.tz * du + L.nz * dout) * 0.28 * on;
        if (on > 0) for (const ap of this.apples) if (ap.b.on && !ap.b.air) { ap.b.vx += ax * dt; ap.b.vz += az * dt; }
      }
      this.roll.step(dt);
      // Biscuits: down the fall, off its hem and onto the heap, landing flat.
      for (const bi of this.biscuits) {
        if (bi.state === 'in' && t >= bi.te) { bi.state = 'slide'; bi.k = 0; this.swish(L); }
        if (bi.state === 'slide') { bi.k = Math.min(1, bi.k + dt / 0.85); if (bi.k >= 1) bi.state = 'out'; }
      }
      if (!this.sung && t > 6.6) { this.sung = true; this.gymnopedie(L); }
    } else if (ph === 'linger') {
      this.roll.step(dt);
    } else if (ph === 'return') {
      // Back they all come: across the floor to the wall, up and in under the rail; then the cloth gathers itself up.
      const R = L.ret;
      this.apples.forEach((ap, i) => {
        if (!ap.from) return; const b = ap.b, k = ease.inOut(clamp01((R * 2.4 - i * 0.045) / 1.5));
        const mouth = L.at(ap.u, L.rail - b.r - 0.006 - L.cy, -L.wall - b.r * (k > 0.97 ? 3 : 0), this.tmp), base = L.floor(ap.u * 0.8, 0.12 + b.r);
        const s1 = 1 - k, x = s1 * s1 * ap.from.x + 2 * s1 * k * base.x + k * k * mouth.x, y = s1 * s1 * ap.from.y + 2 * s1 * k * (L.y + b.r + 0.3) + k * k * mouth.y, z = s1 * s1 * ap.from.z + 2 * s1 * k * base.z + k * k * mouth.z;
        const d = Math.hypot(x - b.x, z - b.z) + Math.abs(y - b.y);
        b.q.premultiply(this.qq.setFromAxisAngle(ap.spin, -d / b.r));
        b.x = x; b.y = y; b.z = z; b.on = false; ap.wob = 0;
        if (k >= 1) { ap.state = 'in'; ap.from = null; }
      });
      for (const bi of this.biscuits) if (bi.from != null) bi.k = bi.from * (1 - ease.inOut(clamp01(R * 1.8)));
      this.shapeCloth(L, this.sp0 * (1 - ease.inOut(ramp(R, 0.78, 1))), this.drop0 * (1 - ease.inOut(ramp(R, 0.45, 0.85))));
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
      // down the face of the fall (0..0.4), then a drop and a turn onto the heap (0.4..1)
      const k = bi.k, o = this.o; let flat = 0;
      if (k < 0.4) { this.spillAt(L, bi.u0 / 0.43, ease.in(k / 0.4), o); L.at(o.u, o.y - L.cy, o.out + 0.016, this.v); }
      else {
        const s = (k - 0.4) / 0.6; this.spillAt(L, bi.u0 / 0.43, 1, o); L.at(o.u, o.y - L.cy, o.out + 0.016, this.w);
        const land = L.floor(bi.to.u, bi.to.out, this.tmp); land.y += Math.max(0, this.crumple(bi.to.u, bi.to.out)) + 0.022;
        this.v.lerpVectors(this.w, land, ease.smooth(s)); this.v.y = this.w.y + (land.y - this.w.y) * (s * s) + 0.12 * Math.sin(s * Math.PI) * (1 - s); flat = ease.smooth(s);
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
