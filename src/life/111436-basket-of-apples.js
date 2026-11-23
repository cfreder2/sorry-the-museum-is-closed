// Paul Cézanne, The Basket of Apples (about 1893), Gallery 248. The word: tumble.
//
// Look at it and the white cloth spills out from under the frame, down the wall and across the floor in folds, the
// way it spills across his tilted table. Then the apples come, one after another, out from under the bottom rail:
// they drop down the cloth, bounce (each bounce a soft wooden note), tumble and roll out across the floor in his
// colours, and rock to rest. Two of the pale biscuits off the plate toboggan down the cloth after them. Every apple
// is made the way he built them, out of flat planes of colour (green, yellow, red-orange, a cool shadow plane), and
// while you keep looking the floor tips a little now and then, as his table does, and they roll and settle again.
// A phrase of Satie's first Gymnopédie (1888) as they come to rest.
//
// When you stop looking they stay out while the toy is near, so you can drive into them and send them rolling (they
// never stop the toy, and keep out of the doorways). Drive off, or wait half a minute, and they roll back to the wall
// and up the cloth into the frame, and the cloth goes back in after them.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, shape } from '../paintlife.js';

const APPLES = 12, LEN_FLOOR = 1.0, NA = 14, NL = 34;
const NOTES = [587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.5];            // D major pentatonic, for the bounces
// Gymnopédie No. 1 (Erik Satie, 1888): the first phrase, over its two chords. 3/4.
const GYMNO = 'R F#5 A5 | G5 F#5 C#5 | B4 C#5 D5 | A4:3 | F#4:3 | R:3';
const GYM_BASS = 'G2:3 | D2:3 | G2:3 | D2:3 | G2:3 | D2:3';
const GYM_CHORD = ['B3 D4 F#4', 'A3 C#4 F#4'];

lifeFor(111436, {
  title: /^The Basket of Apples/,
  word: 'tumble',
  stage: { out: 1.2, half: 1.0 },
  wake: 2, ret: 2.4,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.4) => P.near(h, a);
    this.H = L.rail - L.y; this.LEN = this.H + LEN_FLOOR; this.tmp = new THREE.Vector3();
    // ---------------------------------------------------------- the cloth: a grid laid down the wall and over the floor
    const nTri = NA * NL * 2, pos = new Float32Array(nTri * 9), colr = new Float32Array(nTri * 9);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nTri * 9).fill(0), 3));
    const whites = [col('#efece3', 0.25), col('#e4e2da', 0.25), col('#d4dbe0', 0.3), col('#bfcbd5', 0.35), col('#a9b9c8', 0.35), col('#c6c0cc', 0.3)], red = col('#cf8f87', 0.3);
    let f = 0; const c = new THREE.Color();
    for (let i = 0; i < NA; i++) for (let j = 0; j < NL; j++) for (let h = 0; h < 2; h++, f++) {
      const a = (i + 0.5) / NA - 0.5, l = (j + 0.5) / NL;
      // his cloth: white on the crests of the folds, cool blue and violet planes in their hollows, two faint red lines
      const fold = Math.sin(a * Math.PI * 7 + l * this.LEN * 1.5) + 0.35 * Math.sin(a * 17 - l * this.LEN * 6), q = L.rand();
      c.copy(fold > 0.55 ? whites[q < 0.7 ? 0 : 1] : fold > -0.1 ? whites[q < 0.5 ? 1 : 2] : fold > -0.7 ? whites[q < 0.6 ? 3 : 5] : whites[4]);
      if (Math.abs(a - 0.18) < 0.035 || (Math.abs(a + 0.27) < 0.03 && l > 0.3)) c.lerp(red, 0.75);
      for (let v = 0; v < 3; v++) colr.set([c.r, c.g, c.b], f * 9 + v * 3);
    }
    this.cloth = L.add(new THREE.Mesh(geo, L.paint({ flat: true, glow: 0.5, rough: 0.8, side: THREE.DoubleSide })));
    this.clothV = new Float32Array((NA + 1) * (NL + 1) * 3);
    this.S = 0; this.layCloth(L, 0);

    // ---------------------------------------------------------- apples, built of planes; and two biscuits
    const kinds = [
      { base: '#b9452e', mid: '#d2742f', hi: '#e2bd4f', spot: '#8e9b44', shadow: '#7a2a24' },      // red going yellow
      { base: '#97ad55', mid: '#b9c467', hi: '#dccb6a', spot: '#c0653a', shadow: '#5e7340' },      // green-yellow
      { base: '#a1302a', mid: '#bd4a30', hi: '#d98a3c', spot: '#6f2b24', shadow: '#5a2420' },      // deep red
      { base: '#d39a3f', mid: '#c56f34', hi: '#e8cc68', spot: '#a6492c', shadow: '#8b5a2c' },      // yellow-orange
    ];
    const rig = this.rig = L.rig(APPLES + 4, 6000, L.paint({ flat: true, glow: 0.48, rough: 0.55 }));
    const light = new THREE.Vector3(-0.5, 0.75, 0.45).normalize();
    const apple = (k, r) => {
      const g = shape.ball(1, col(k.base, 0.3), 1);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const top = Math.max(0, y - 0.55); y = y * 0.86 - top * 0.55; const w = (1 + 0.06 * Math.sin(x * 5 + z * 3)) * (1 + 0.07 * Math.sin(x * 12.9 + y * 78.2 + z * 37.7 + r * 400)); p.setXYZ(i, x * r * w, y * r * w, z * r * w); }      // (lumpy, and every plane a little different, the same wherever a corner is shared)
      g.computeVertexNormals();
      const cs = { base: col(k.base, 0.3), mid: col(k.mid, 0.3), hi: col(k.hi, 0.3), spot: col(k.spot, 0.3), shadow: col(k.shadow, 0.3) };
      shape.paint(g, (cen, n) => { const d = n.dot(light), q = L.rand(); return d > 0.55 ? (q < 0.6 ? cs.hi : cs.mid) : d > 0.1 ? (q < 0.18 ? cs.spot : q < 0.6 ? cs.mid : cs.base) : d > -0.4 ? (q < 0.12 ? cs.spot : cs.base) : (q < 0.5 ? cs.shadow : cs.base); });
      const stalk = shape.move(shape.cyl(0.0035, 0.002, r * 0.4, 5, col('#4d3a22', 0.3)), 0.002, r * 0.86 - r * 0.25, 0, 0, 0, 0.25);
      return shape.merge([g, stalk]);
    };
    const geos = []; for (let i = 0; i < 6; i++) { const r = 0.06 + (i % 3) * 0.008; geos.push({ id: rig.geo(apple(kinds[i % 4], r)), r }); }
    this.apples = [];
    const order = [0, 1, 2, 3, 4, 5, 1, 0, 3, 2, 5, 4];
    this.roll = L.rollers(APPLES, { r: 0.065, bounce: 0.44, roll: 0.5, onBounce: (b, sp) => this.bounce(L, b, sp), ground: (x, z) => this.onCloth(L, x, z) });
    for (let i = 0; i < APPLES; i++) {
      const g = geos[order[i]], b = this.roll.items[i]; b.r = g.r; b.i = i;
      this.apples.push({ inst: rig.add(g.id), b, te: 1.15 + i * 0.38 + (i > 8 ? 0.2 : 0), u: (L.rand() - 0.5) * 0.3, state: 'in', spin: new THREE.Vector3(L.rand() - 0.5, L.rand() - 0.5, L.rand() - 0.5).normalize(), wob: 0, wt: 0, wax: new THREE.Vector3(1, 0, 0), q0: new THREE.Quaternion().setFromEuler(new THREE.Euler(L.rand() * 6, L.rand() * 6, L.rand() * 6)), last: 0 });
    }
    const biscuit = shape.ball(1, col('#dcaa62', 0.3), 1);
    { const p = biscuit.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setXYZ(i, x * 0.05, p.getY(i) * 0.011 * (1 - 0.25 * x * x), p.getZ(i) * 0.017 * (1 - 0.2 * x * x)); } biscuit.computeVertexNormals(); }
    shape.paint(biscuit, (cen, n) => (n.y < -0.3 ? col('#b07a3e', 0.3) : L.rand() < 0.22 ? col('#f0d9a6', 0.3) : null));
    const bg = rig.geo(biscuit);
    this.biscuits = [0, 1].map(i => ({ inst: rig.add(bg), te: 4.3 + i * 0.65, a: i ? 0.12 : -0.1, end: this.H + (i ? 0.5 : 0.32), l: 0, state: 'in' }));
    this.blobs = L.blobs(APPLES + 2);
    this.m = new THREE.Matrix4(); this.v = new THREE.Vector3(); this.q = new THREE.Quaternion(); this.qq = new THREE.Quaternion(); this.one = new THREE.Vector3(1, 1, 1); this.eu = new THREE.Euler();
    this.hideAll();
  },

  // Where the cloth is at (a across it, -0.5..0.5; l along it, metres from the frame): along the wall, up, out.
  clothAt(L, a, l, o) {
    const H = this.H;
    // heavy folds hanging from where it is gathered under the frame, as it hangs over his table's edge
    const fold = 0.5 + 0.5 * Math.sin(a * Math.PI * 7 + l * 1.5) + 0.18 * Math.sin(a * 17 - l * 6);
    if (l <= H) {
      const t = l / H;
      o.u = a * (0.3 + 0.36 * Math.sqrt(t)) + 0.012 * Math.sin(l * 5 + a * 3);
      o.y = L.rail + 0.006 - l;
      o.out = -L.wall + 0.014 + 0.035 * Math.sin(t * Math.PI) + fold * 0.045 * (0.25 + 0.75 * t);
    } else {
      const s = l - H, pile = Math.exp(-s / 0.3);
      o.u = a * (0.66 + s * 0.85) + 0.05 * Math.sin(s * 4 + a * 2);
      o.out = -L.wall + 0.014 + 0.045 + s;
      o.y = L.y + 0.012 + Math.min(1, s / 0.06) * (fold * 0.03 * (0.4 + pile) + 0.022 * Math.max(0, Math.sin(s * 11 - a * 5)) + 0.04 * pile * Math.max(0, Math.sin(a * 9 + 1)));
    }
    return o;
  },
  // Lay the cloth out to length S (the rest still rolled at its front edge).
  layCloth(L, S) {
    this.S = S; const V = this.clothV, o = {}, p = this.tmp;
    for (let i = 0; i <= NA; i++) for (let j = 0; j <= NL; j++) {
      const a = i / NA - 0.5, l = Math.min(S, (j / NL) * this.LEN);
      this.clothAt(L, a, l, o); L.at(o.u, o.y - L.cy, o.out, p);
      if ((j / NL) * this.LEN > S) p.y += 0.008;
      V.set([p.x, p.y, p.z], (i * (NL + 1) + j) * 3);
    }
    const pos = this.cloth.geometry.attributes.position.array; let f = 0;
    const put = (i, j) => { const k = (i * (NL + 1) + j) * 3; pos[f++] = V[k]; pos[f++] = V[k + 1]; pos[f++] = V[k + 2]; };
    for (let i = 0; i < NA; i++) for (let j = 0; j < NL; j++) { put(i, j); put(i + 1, j); put(i + 1, j + 1); put(i, j); put(i + 1, j + 1); put(i, j + 1); }
    this.cloth.geometry.attributes.position.needsUpdate = true;
    this.cloth.visible = S > 0.005;
  },
  // How high the cloth lies on the floor at (x, z), for the apples (0 off it).
  onCloth(L, x, z) {
    if (this.S <= this.H) return 0;
    const q = L.local(x, z), s = q.out + L.wall - 0.014;
    return s > 0 && s < this.S - this.H && Math.abs(q.u) < 0.33 + s * 0.42 ? 0.03 : 0;
  },
  hideAll() { for (const a of this.apples) { this.rig.show(a.inst, false); a.state = 'in'; a.b.on = false; } for (const b of this.biscuits) { this.rig.show(b.inst, false); b.state = 'in'; } this.blobs.count = 0; },

  start(L, resumed) {
    if (!resumed) { this.hideAll(); this.layCloth(L, 0); this.sung = false; this.tilt = 0; L.k.synth.noise(0.7, { vol: 0.025, lp: 1400, at: 0.25 }); }
  },
  back(L) {
    for (const a of this.apples) a.from = a.state === 'out' || a.state === 'pop' ? (a.from0 || (a.from0 = new THREE.Vector3())).set(a.b.x, a.b.y, a.b.z) : null;
    for (const b of this.biscuits) b.from = b.state !== 'in' ? b.l : null;
    this.S0 = this.S;
  },
  end() { this.hideAll(); },
  reset(L) { this.hideAll(); this.layCloth(L, 0); },

  update(L, dt) {
    const ph = L.phase, t = L.t, rig = this.rig;
    if (ph === 'wake' || ph === 'play') {
      // The cloth falls down the wall, and spreads over the floor.
      if (this.S < this.LEN) this.layCloth(L, Math.max(this.S, this.LEN * ease.out(ramp(t, 0.2, 1.7))));
      // The apples, one at a time, out from under the rail and off.
      for (const a of this.apples) {
        if (a.state === 'in' && t >= a.te) { a.state = 'pop'; a.pt = 0; }
        if (a.state === 'pop') {
          a.pt += dt / 0.2; const b = a.b, q = ease.out(a.pt);
          L.at(a.u, L.rail - b.r - 0.012 - L.cy, -L.wall - b.r + q * (2 * b.r + 0.05), this.v);
          b.x = this.v.x; b.y = this.v.y; b.z = this.v.z;
          if (a.pt >= 1) {
            a.state = 'out'; b.on = true; const last = a.b.i === APPLES - 1;
            const vu = (L.rand() - 0.5) * (last ? 0.15 : 0.9), vo = last ? 1.25 : 0.45 + L.rand() * 0.65;
            b.vx = L.tx * vu + L.nx * vo; b.vz = L.tz * vu + L.nz * vo; b.vy = 0.15;
          }
        }
      }
      // Now and then, while you keep looking, the floor tips a little (as his table does), and they roll again.
      if (t > 10) {
        const k = (t - 10) % 8, on = k < 1.3 ? Math.sin(k / 1.3 * Math.PI) : 0, dir = Math.floor((t - 10) / 8) * 2.4;
        const du = Math.cos(dir), dout = Math.sin(dir) * 0.6 + 0.2, ax = (L.tx * du + L.nx * dout) * 0.28 * on, az = (L.tz * du + L.nz * dout) * 0.28 * on;
        if (on > 0) for (const a of this.apples) if (a.b.on && !a.b.air) { a.b.vx += ax * dt; a.b.vz += az * dt; }
      }
      this.roll.step(dt);
      // Biscuits: down the cloth like sledges, and to a stop on it.
      for (const b of this.biscuits) {
        if (b.state === 'in' && t >= b.te) { b.state = 'slide'; b.st = 0; this.swish(L); }
        if (b.state === 'slide') { b.st += dt; const fall = Math.min(1, b.st / 0.55), slow = clamp01((b.st - 0.55) / 0.9); b.l = fall < 1 ? this.H * fall * fall : this.H + (b.end - this.H) * ease.out(slow); if (slow >= 1) b.state = 'out'; }
      }
      if (!this.sung && t > 6.4) { this.sung = true; this.gymnopedie(L); }
    } else if (ph === 'linger') {
      this.roll.step(dt);
    } else if (ph === 'return') {
      // Back they all come: along the floor to the wall, up the cloth and in under the rail; then the cloth after them.
      const R = L.ret;
      this.apples.forEach((a, i) => {
        if (!a.from) return; const b = a.b, k = ease.inOut(clamp01((R * 2.4 - i * 0.06) / 1.55));
        const mouth = L.at(a.u, L.rail - b.r - 0.012 - L.cy, -L.wall - b.r * (k > 0.97 ? 3 : 0), this.tmp), base = L.floor(a.u * 0.8, 0.07 + b.r);
        const s1 = 1 - k, x = s1 * s1 * a.from.x + 2 * s1 * k * base.x + k * k * mouth.x, y = s1 * s1 * a.from.y + 2 * s1 * k * (L.y + b.r) + k * k * mouth.y, z = s1 * s1 * a.from.z + 2 * s1 * k * base.z + k * k * mouth.z;
        const d = Math.hypot(x - b.x, z - b.z) + Math.abs(y - b.y);
        b.q.premultiply(this.qq.setFromAxisAngle(a.spin, -d / b.r));
        b.x = x; b.y = y; b.z = z; b.on = false; a.wob = 0;
        if (k >= 1) { a.state = 'in'; a.from = null; }
      });
      for (const b of this.biscuits) if (b.from != null) b.l = b.from * (1 - ease.inOut(clamp01(R * 1.6)));
      this.layCloth(L, this.S0 * (1 - ease.inOut(ramp(R, 0.5, 1))));
    }
    // Draw them where they are: apples tumbling in the air, rocking as they come to rest.
    let nb = 0;
    for (const a of this.apples) {
      const b = a.b, show = a.state !== 'in' || (ph === 'return' && a.from);
      rig.show(a.inst, !!show); if (!show) continue;
      if (b.air && b.on) b.q.premultiply(this.qq.setFromAxisAngle(a.spin, dt * 9));
      const sp = Math.hypot(b.vx, b.vz);
      if (b.on && !b.air) {
        if (sp > 0.06) { a.last = sp; a.wob = 0; this.v.set(b.vz, 0, -b.vx).normalize(); a.wax.copy(this.v); }
        else if (a.last > 0.06) { a.wob = Math.min(0.32, a.last * 1.1); a.wt = 0; a.last = 0; }
      }
      a.wt += dt;
      this.q.copy(b.q).multiply(a.q0);
      if (a.wob > 0.002) { this.q.premultiply(this.qq.setFromAxisAngle(a.wax, a.wob * Math.exp(-a.wt * 2.6) * Math.sin(a.wt * 13))); if (a.wt > 3) a.wob = 0; }
      rig.mat(a.inst, this.m.compose(this.v.set(b.x, b.y, b.z), this.q, this.one));
      if (b.y - L.y < 0.4) this.blobs.set(nb++, b.x, b.z, b.r * 1.15, 0.85 * clamp01(1 - (b.y - L.y - b.r) / 0.3));
    }
    for (const b of this.biscuits) {
      const show = b.state !== 'in' || (ph === 'return' && b.from != null && b.l > 0.002);
      rig.show(b.inst, !!show); if (!show) continue;
      const o = this.clothAt(L, b.a, Math.max(0.001, b.l), this.co || (this.co = {})), lift = b.l < this.H ? 0.013 : 0.016;
      // flat against the cloth: upright on the wall, turning down to lie on the floor at the bend
      const bend = clamp01((b.l - this.H + 0.05) / 0.1);
      L.at(o.u, o.y - L.cy + (b.l >= this.H ? lift : 0), o.out + (b.l < this.H ? lift : 0), this.v);
      this.q.setFromEuler(this.eu.set(-Math.PI / 2 * (1 - bend), L.yawOut + Math.PI / 2, 0, 'YXZ'));
      rig.mat(b.inst, this.m.compose(this.v, this.q, this.one));
      if (bend > 0.5) this.blobs.set(nb++, this.v.x, this.v.z, 0.05, 0.5);
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
