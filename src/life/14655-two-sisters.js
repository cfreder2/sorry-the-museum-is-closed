// Pierre-Auguste Renoir, Two Sisters (On the Terrace) (1881), Gallery 201. The word: yarn.
//
// At the foot of the picture the little sister stands by a basket of wool: balls of it, red, rose, green, deep blue,
// coral, cream. Look at it and they tumble out from under the bottom rail one after another, bounce on the floor and
// roll away across it in long looping curls, each unwinding a soft strand of its colour behind it from the foot of the
// frame, and getting smaller as it goes. The green one doesn't stop at the wall: it rolls up it, beside the frame,
// winding its strand up the wall as it climbs; and the strand turns into the terrace's creeper. Leaves come out along
// it in his feathery greens, side shoots wander off to the right along the wall and over the top of the frame, and
// they flower, white like the blossom behind the sisters, rose and red like the flowers on the little one's hat. A
// small bird in his blues and reds comes out from behind the frame and flits from blossom to blossom, and sings.
// The tune is the opening of Vivaldi's Spring (1725), plucked softly.
//
// When you stop looking the balls stay on the floor while the toy is near: push them and they roll on, unwinding more.
// Then the strands reel them back, each along its own line, up into the frame, winding up fat again; the creeper
// draws back into the frame's edge, the flowers closing, and the bird goes behind the frame.
//
// Never over the picture: the creeper is only on the wall to the right of the frame and above its top rail (on its
// left hangs Paris Street, frame to frame); the bird keeps to the same wall; the wool is on the floor.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { strokes } from './strokes.js';

const NB = 6, R0 = 0.085, SEG = 0.02, MAXP = 260;              // balls, their size, the strand's step (m), points a strand can hold
const CLIMB = 2;                                               // the green one climbs the wall
// Where each one goes (stage terms: along, out), from where it lands under the basket; the green one's floor part.
const PATHS = [
  [[-0.24, 0.12], [-0.1, 0.43], [0.1, 0.82], [0.45, 0.95], [0.6, 0.73], [0.38, 0.6], [0.35, 0.99], [0.62, 1.16]],
  [[-0.14, 0.12], [0.25, 0.43], [0.7, 0.69], [1.05, 0.6], [1.1, 0.39], [0.9, 0.34], [0.95, 0.73], [1.3, 0.95]],
  [[-0.04, 0.12], [0.25, 0.26], [0.52, 0.19], [0.7, 0.12]],
  [[-0.2, 0.12], [-0.1, 0.39], [0.0, 0.73], [0.2, 1.03], [0.5, 1.2]],
  [[0.04, 0.12], [0.5, 0.3], [1.1, 0.26], [1.5, 0.52], [1.45, 0.82], [1.15, 0.82], [1.25, 0.65]],
  [[-0.1, 0.12], [0.15, 0.6], [0.05, 0.9], [-0.1, 1.07], [0.05, 1.22]],
];
const COLS = ['#c8423a', '#e49aa0', '#6e9a4c', '#2e3f7a', '#e8845a', '#efe6d2'];
const DROP = i => 0.35 + i * 0.2;                             // when each falls out from under the frame
const ROLL = 4.6;                                              // seconds to roll its course (slowing)
const T_BIRD = 4.4, IDLE_B = 2.6;
// Vivaldi, The Four Seasons, Spring (1725): the opening
const SPRING = 'E5 | G#5 G#5 G#5 F#5:.5 E5:.5 | B5:2.5 B5:.5 A5:.5 R:.5 | G#5 G#5 G#5 F#5:.5 E5:.5 | B5:2.5 B5:.5 A5:.5 R:.5 | G#5 A5:.5 B5:.5 A5 G#5 | F#5:3';
const SPRING_B = 'R | E3:2 B2:2 | E3:2 B2:2 | E3:2 B2:2 | E3:2 B2:2 | E3:2 E3:2 | B2:3';

lifeFor(14655, {
  title: /^Two Sisters \(On the Terrace\)/,
  word: 'yarn',
  stage: { out: 2.0, half: 1.6, above: 0.32, cam: { dist: 2.5, side: 0.95, height: 0.95, fov: 58, lookU: 0.45, lookOut: 0.5, lookH: 0.95, floorOut: 1.25 } },
  wake: 2, ret: 2.4,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.25) => P.near(h, a);
    this.v = new THREE.Vector3(); this.w = new THREE.Vector3(); this.q = new THREE.Quaternion(); this.qq = new THREE.Quaternion(); this.m = new THREE.Matrix4(); this.one = new THREE.Vector3(1, 1, 1);
    const at = this.at = (u, h, o, into = new THREE.Vector3()) => L.at(u, h + L.y - L.cy, o, into);
    this.N = new THREE.Vector3(L.nx, 0, L.nz); this.UP = new THREE.Vector3(0, 1, 0); this.T = new THREE.Vector3(L.tx, 0, L.tz);
    // ---------------------------------------------------------- the balls of wool: wound, the strands showing
    const rig = this.rig = L.rig(12, 9000, L.paint({ glow: 0.32, rough: 0.9 }));
    this.balls = COLS.map((hex, i) => {
      const base = col(hex, 0.2), g = shape.ball(1, base, 2), dark = base.clone().multiplyScalar(0.62), light = base.clone().lerp(new THREE.Color(1, 1, 1), 0.28);
      const ax = [new THREE.Vector3(1, 0.3, 0).normalize(), new THREE.Vector3(0.2, 1, 0.5).normalize(), new THREE.Vector3(-0.4, 0.2, 1).normalize()];
      shape.paint(g, (c, n) => { const k = Math.floor((c.y + 1) * 3) % 3, s = Math.sin(c.dot(ax[(k + i) % 3]) * 26); return s > 0.55 ? light : s < -0.5 ? dark : null; });
      return { inst: rig.add(rig.geo(g)), i, base, p: new THREE.Vector3(), r: R0, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(i, i * 2, i * 3)), path: null, pts: [], n: 0, s: 0, wall: [] };
    });
    // ---------------------------------------------------------- each one's course, as dense points: off the rail, down, along the floor
    for (const b of this.balls) {
      const pts = [], wall = [], first = PATHS[b.i][0];
      // from the foot of the frame, where it falls out, down to the floor (on the wall's face), then the curve
      const top = at(first[0], L.rail - L.y - 0.02, -L.wall + 0.012);
      const c = new THREE.CatmullRomCurve3(PATHS[b.i].map(([u, o]) => at(u, 0.004, o)), false, 'centripetal'), len = c.getLength(), n = Math.ceil(len / SEG);
      for (let j = 0; j <= n; j++) { pts.push(c.getPointAt(j / n)); wall.push(0); }
      if (b.i === CLIMB) {          // up the wall beside the frame, winding, and over the top towards the middle
        const last = PATHS[b.i][PATHS[b.i].length - 1], up = [];
        for (let h = 0.02; h < 1.95; h += 0.1) up.push(at(last[0] + 0.07 * Math.sin(h * 5.5) + h * 0.06, h, 0.006));
        up.push(at(0.9, 2.18, 0.006), at(0.72, 2.32, 0.006), at(0.5, 2.36, 0.006));
        const cu = new THREE.CatmullRomCurve3(up, false, 'centripetal'), lu = cu.getLength(), nu = Math.ceil(lu / SEG);
        this.climbFrom = pts.length;
        for (let j = 1; j <= nu; j++) { pts.push(cu.getPointAt(j / nu)); wall.push(2); }
      }
      b.course = pts; b.cwall = wall; b.len = (pts.length - 1) * SEG; b.top = top;
    }
    // ---------------------------------------------------------- the strands: soft ribbons of wool, one draw call for all six
    const NV = NB * MAXP * 2, pos = new Float32Array(NV * 3), nor = new Float32Array(NV * 3), cl = new Float32Array(NV * 3), idx = [];
    for (let s = 0; s < NB; s++) for (let j = 0; j < MAXP - 1; j++) { const a = (s * MAXP + j) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    this.balls.forEach((b, s) => { const d = b.base.clone().multiplyScalar(0.78); for (let j = 0; j < MAXP; j++) for (let e = 0; e < 2; e++) { const c = (j + e) % 3 === 0 ? d : b.base; cl.set([c.r, c.g, c.b], ((s * MAXP + j) * 2 + e) * 3); } });
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); sg.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage)); sg.setAttribute('color', new THREE.BufferAttribute(cl, 3)); sg.setIndex(idx);
    const sm = L.paint({ glow: 0.4, rough: 1, side: THREE.DoubleSide }); sm.polygonOffset = true; sm.polygonOffsetFactor = -3; sm.polygonOffsetUnits = -3;
    this.strand = L.add(new THREE.Mesh(sg, sm));
    // ---------------------------------------------------------- the creeper: leaves and flowers, in his strokes
    const S = this.S = strokes(L, 300), green = ['#4f6e3a', '#6f8f4a', '#8eaa5c', '#a9bd7a', '#5d7d48', '#c2c88e'].map(h => col(h, 0.2));
    const climb = this.balls[CLIMB], cf = this.climbFrom, items = [];
    // anchors along the climb (in course arc metres): a leaf either side, now and then a shoot off to the right
    const W = (i, h, o, into) => at(i, h, o, into);
    const leaf = (p, dirAng, arc, size) => items.push({ kind: 'leaf', p: p.clone(), turn: dirAng, arc, size: size * (0.85 + L.rand() * 0.3), c: green[Math.floor(L.rand() * green.length)] });
    const local = p => { const q = L.local(p.x, p.z); return [q.u, p.y - L.y]; };
    const blossoms = [];
    for (let j = cf + 2; j < climb.course.length; j += 2) {
      const p = climb.course[j], [u, h] = local(p), arc = j * SEG;
      for (const s of [-1, 1]) { const ou = s * (0.02 + L.rand() * 0.02); if (u + ou < 0.56 && h < 2.24) continue; leaf(W(u + ou, h + (L.rand() - 0.3) * 0.03, 0.012 + L.rand() * 0.02), s * 0.7 + (L.rand() - 0.5) * 0.6, arc, 0.082); }
      // a shoot, every so often, wandering right and up, leaves along it and a flower cluster at its end
      if ((j - cf) % 12 === 8 && h > 0.3) {
        const n = 5 + Math.floor(L.rand() * 3), ang0 = h > 2.1 ? Math.PI * 0.95 : 0.25 + L.rand() * 0.6; let cu = u, ch = h, ang = ang0;
        for (let k = 1; k <= n; k++) {
          ang += (L.rand() - 0.5) * 0.5; cu += Math.cos(ang) * 0.055; ch += Math.sin(ang) * 0.055;
          if (h > 2.1) ch = Math.max(2.27, ch);
          if (cu < 0.56 && ch < 2.25) break;
          leaf(W(cu, ch + (k % 2 ? 0.018 : -0.018), 0.015), ang + (k % 2 ? 0.9 : -0.9), arc + k * 0.06, 0.074);
        }
        blossoms.push({ u: cu, h: ch, arc: arc + n * 0.06 + 0.15 });
      }
    }
    // the flowers: white (the blossom behind them), rose and red (the little one's hat), a blue one; at the shoots' ends and among the leaves
    for (const b of [{ u: 1.05, h: 1.25 }, { u: 0.78, h: 0.62 }, { u: 1.2, h: 1.78 }, { u: 0.66, h: 2.42 }, { u: 0.95, h: 2.0 }]) { let best = null, bd = 9; for (const it of items) { const [iu, ih] = local(it.p), d = Math.hypot(iu - b.u, ih - b.h); if (d < bd) { bd = d; best = it; } } blossoms.push({ u: b.u, h: b.h, arc: (best ? best.arc : 2) + 0.2 }); }
    const kinds = [['#f6f2e8', '#e9e6f0', '#fbfaf2', '#e8d98a'], ['#eaa2a8', '#f4c6c4', '#d9808c', '#f0d070'], ['#d6443a', '#e8644e', '#c23a32', '#f0c860'], ['#f6f2e8', '#ece8f2', '#fbfaf2', '#e8d98a'], ['#8fa2d6', '#b4c0e6', '#7088c4', '#f0e090']];
    this.perches = [];
    blossoms.forEach((b, bi) => {
      const k = kinds[bi % kinds.length].map(h => col(h, 0.15)), petals = 8, R = 0.036 + L.rand() * 0.014, c = W(b.u, b.h, 0.03);
      for (let j = 0; j < petals; j++) { const a = (j / petals) * Math.PI * 2 + L.rand() * 0.3; items.push({ kind: 'petal', p: c.clone(), a, R, turn: a, arc: b.arc, size: 0.06 + L.rand() * 0.016, c: k[j % 3], open: bi * 0.21 % 1 }); }
      items.push({ kind: 'petal', p: c.clone(), a: 0, R: 0, turn: 0, arc: b.arc, size: 0.034, c: k[3], open: bi * 0.21 % 1 });
      this.perches.push(W(b.u + 0.02, b.h + 0.035, 0.07));
    });
    this.items = items; items.forEach((it, i) => S.color(i, it.c)); S.colorsChanged();
    this.climbStart = cf * SEG;
    // ---------------------------------------------------------- the bird: blue back, rust breast, a dark cap; body and two wings
    const BS = 2.0, blue = [col('#3b5aa0', 0.15), col('#2c437e', 0.15), col('#5a78b8', 0.15)], rust = col('#d0603e', 0.15), cream = col('#efe2c8', 0.2);
    const body = shape.ball(1, blue[0], 2); { const p = body.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i); p.setXYZ(i, p.getX(i) * 0.026, p.getY(i) * 0.026, z * 0.05); } body.computeVertexNormals(); }
    shape.paint(body, (c, n) => (n.y < -0.2 && c.z > -0.02 ? (c.z > 0.01 ? rust : cream) : blue[Math.floor(L.rand() * 3)]));
    const head = shape.move(shape.ball(0.019, blue[1], 1), 0, 0.018, 0.04); shape.paint(head, (c, n) => (n.y < -0.1 || n.z > 0.75 ? rust : null));
    const beak = shape.move(shape.cone(0.005, 0.014, 5, col('#2a2420', 0.1)), 0, 0.016, 0.062, Math.PI / 2);
    const eyes = [-1, 1].map(s => shape.move(shape.ball(0.0035, col('#141010', 0.1), 0), s * 0.014, 0.022, 0.05));
    const tail = shape.move(shape.box(0.026, 0.004, 0.045, blue[1]), 0, 0.008, -0.06, 0.25);
    const bird = shape.merge([body, head, beak, ...eyes, tail]); shape.move(bird, 0, 0, 0, 0, 0, 0, BS);
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.022, 0, 0, -0.02, 0.07, 0, -0.03, 0, 0, 0.022, 0.07, 0, -0.03, 0.085, 0, 0.0], 3)); wg.computeVertexNormals();
    wg.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(18), 3)); shape.paint(wg, (c, n, f) => (f ? blue[1] : blue[2])); shape.move(wg, 0, 0, 0, 0, 0, 0, BS);
    this.bird = { body: rig.add(rig.geo(bird)), wr: 0, wl: 0, BS }; const gw = rig.geo(wg); this.bird.wr = rig.add(gw); this.bird.wl = rig.add(gw);
    this.hideBird(); for (const b of this.balls) rig.show(b.inst, false);
    this.bp = new THREE.Vector3(); this.bfrom = new THREE.Vector3(); this.tmp = new THREE.Vector3(); this.tmp2 = new THREE.Vector3();
    this.roll = L.rollers(NB, { r: R0, bounce: 0.3, roll: 0.9, onBounce: (b, sp) => this.knock(L, b, sp) });
    this.breeze = L.voice().loop({ lp: 900, hp: 260 });
  },

  hideBird() { const B = this.bird; for (const i of [B.body, B.wr, B.wl]) this.rig.show(i, false); },
  start(L, resumed) {
    if (resumed) { for (const b of this.balls) b.free = false; return; }
    for (const b of this.balls) { b.free = false; b.extra = null; this.roll.items[b.i].on = false; }
    if (L.quiet) return;
    // a harp, up
    const v = L.voice(); [293.66, 369.99, 440, 587.33, 739.99, 880, 1174.66].forEach((f, i) => v.note(f, 1.2, { at: i * 0.07, vol: 0.016, type: 'sine', attack: 0.004 }));
    this.sungAt = 0; this.songAt = 0;
  },
  back(L) {
    // reel them in from wherever they are, along their strands
    for (const b of this.balls) { b.back = b.n; b.backP = (b.backP || new THREE.Vector3()).copy(b.p); b.free = false; this.roll.items[b.i].on = false; }
    this.grow0 = this.grow || 0; this.bfrom.copy(this.bp); this.birdOn0 = this.birdOn;
  },
  end(L) { for (const b of this.balls) { this.rig.show(b.inst, false); b.n = 0; b.extra = null; } this.hideBird(); this.S.count = 0; this.S.flush(); this.strand.visible = false; this.breeze.set(0); },
  reset(L) { this.end(L); },

  // ------------------------------------------------------------------ every frame
  update(L, dt) {
    const t = L.t, ph = L.phase, showing = ph === 'wake' || ph === 'play';
    // ---- the balls: falling out, rolling their course (pure functions of t), free while lingering, reeled home after
    for (const b of this.balls) {
      const rb = this.roll.items[b.i];
      if (showing) this.course(L, b, t);
      else if (ph === 'linger') {
        if (!b.free && b.i !== CLIMB && b.n > 0) { b.free = true; rb.on = true; rb.x = b.p.x; rb.y = b.p.y; rb.z = b.p.z; rb.vx = rb.vy = rb.vz = 0; rb.r = b.r; rb.q.copy(b.q); b.extra = b.extra || []; }
      } else if (ph === 'return') this.reel(L, b, L.ret);
    }
    if (ph === 'linger') {
      this.roll.step(dt);
      for (const b of this.balls) if (b.free) {
        const rb = this.roll.items[b.i]; b.p.set(rb.x, rb.y, rb.z); b.q.copy(rb.q);
        // pushed: it unwinds more strand behind it as it goes
        const last = b.extra.length ? b.extra[b.extra.length - 1] : b.course[b.n - 1];
        if (last && Math.hypot(rb.x - last.x, rb.z - last.z) > SEG * 1.5 && b.n + b.extra.length < MAXP - 2) { b.extra.push(new THREE.Vector3(rb.x, L.y + 0.004, rb.z)); b.r = Math.max(0.055, b.r - 0.00025); rb.r = b.r; }
      }
    }
    // draw them
    for (const b of this.balls) {
      const on = b.n > 0 || b.dropping; this.rig.show(b.inst, on);
      if (on) this.rig.mat(b.inst, this.m.compose(b.p, b.q, this.v.set(b.r, b.r, b.r)));
    }
    this.strands(L);
    // ---- the creeper: grows with the green ball's climb, and draws back after
    const climb = this.balls[CLIMB], g = showing ? clamp01((climb.s - this.climbStart) / 0.12) : 1, arc = showing ? climb.s : ph === 'linger' ? 1e3 : climb.s;
    this.grow = showing ? arc : ph === 'linger' ? this.grow : this.grow;
    const S = this.S; let k = 0; const ret = ph === 'return' ? L.ret : 0;
    for (const it of this.items) {
      let a = clamp01((arc - it.arc) / 0.25);
      if (ph === 'linger' || ph === 'return') a = 1;
      if (it.kind === 'petal') a = showing ? ease.outBack(clamp01((t - 3.0 - it.open * 2.4 - Math.max(0, it.arc - this.climbStart) * 0.6) / 0.7)) * clamp01((arc - it.arc) / 0.1) : 1;
      if (ret > 0) a *= 1 - ease.inOut(clamp01((ret - (it.kind === 'petal' ? 0 : 0.15) - Math.max(0, it.arc - this.climbStart) * 0.06) / 0.4));
      if (a <= 0.001) { S.set(k++, 0, 0, 0, 0, 0); continue; }
      const sway = Math.sin((t + L.r) * 1.7 + it.p.x * 9 + it.p.y * 7) * 0.08;
      if (it.kind === 'petal') {
        const rr = it.R * a; this.v.copy(it.p).addScaledVector(this.T, Math.cos(it.a) * rr).setY(it.p.y + Math.sin(it.a) * rr);
        S.set(k++, this.v.x, this.v.y, this.v.z, it.size * Math.min(1, a + 0.15), it.turn + sway);
      } else S.set(k++, it.p.x, it.p.y, it.p.z, it.size * a, it.turn + sway * 1.5);
    }
    S.count = k; S.flush();
    // ---- the bird
    this.birdUpdate(L, t, ph);
    // ---- sound
    if (!L.quiet) {
      const cam = L.k.G.camera, near = Math.max(0, 1 - Math.hypot(cam.position.x - L.cx, cam.position.z - L.cz) / 12);
      this.breeze.set(showing || ph === 'linger' ? 0.012 * near * ramp(t, 0.5, 2) : 0);
      if (showing && dt > 0 && t >= 2.3 && t - dt < 2.3) this.spring(L);
    }
    L.voice().place(L.cx + L.tx * 0.6, L.cz + L.tz * 0.6);
  },

  // Where ball b is at show-time t: out from under the rail, a drop and a bounce, then along its course, slowing.
  course(L, b, t) {
    const t0 = DROP(b.i); b.dropping = false;
    if (t < t0) { b.n = 0; b.s = 0; return; }
    const fall = 0.42, a = t - t0;
    if (a < fall) {                                    // out from under the frame and down the wall's face
      const q = a / fall; b.dropping = true; b.n = 0;
      this.at(PATHS[b.i][0][0], (L.rail - L.y - R0 - 0.06) * (1 - q * q) + R0 * q * q, -L.wall + R0 * Math.min(1, a / 0.1) + 0.01, b.p);
      b.r = R0; b.s = 0; b.q.setFromAxisAngle(this.T, -a * 8);
      return;
    }
    const c = a - fall, wn = this.wallN(b), floorLen = b.len - wn * SEG;
    // a little bounce as it lands, then rolling, slowing to a stop (ROLL seconds)
    const q = ease.out(clamp01(c / ROLL)), s = wn * SEG + q * (b.i === CLIMB ? b.len - wn * SEG : floorLen);
    this.place(L, b, s);
    b.p.y += Math.abs(Math.sin(c * 10)) * 0.07 * Math.exp(-c * 5);
  },
  wallN(b) { let n = 0; while (b.cwall[n] === 1) n++; return n; },
  // Put ball b at arc length s along its course: its strand runs up to there; it rolls by the distance.
  place(L, b, s) {
    const pts = b.course, f = Math.min(pts.length - 1.001, s / SEG), j = Math.floor(f), e = f - j, w = b.cwall[Math.min(pts.length - 1, j + 1)];
    const r = R0 * (1 - 0.32 * clamp01((s - this.wallN(b) * SEG) / Math.max(0.5, b.len - this.wallN(b) * SEG)));
    this.v.lerpVectors(pts[j], pts[j + 1], e);
    const nrm = w === 2 ? this.N : this.UP;
    b.p.copy(this.v).addScaledVector(nrm, r);
    // roll: about the axis across the way it goes, by how far it went
    const ds = s - (b.s || 0);
    if (Math.abs(ds) > 1e-5) { this.w.subVectors(pts[j + 1], pts[j]).normalize(); this.tmp.crossVectors(nrm, this.w).normalize(); b.q.premultiply(this.qq.setFromAxisAngle(this.tmp, ds / r)); }
    b.s = s; b.r = r; b.n = j + 1;
  },
  // Reeled home: back along its strand (and whatever it unwound while pushed), up the wall, in under the frame.
  reel(L, b, r) {
    const total = b.back + (b.extra ? b.extra.length : 0); if (!total && !b.dropping) { b.n = 0; return; }
    const q = ease.inOut(clamp01((r - b.i * 0.04) / 0.82)), left = total * (1 - q);
    if (b.extra && b.extra.length) {
      // first the extra, straight back along it
      const ne = b.extra.length, ce = Math.max(0, left - b.back);
      if (ce > 0) { const f = Math.min(ne - 1.001, ce), j = Math.floor(f); this.v.lerpVectors(b.extra[j], b.extra[Math.min(ne - 1, j + 1)], f - j); b.p.copy(this.v).addScaledVector(this.UP, b.r); b.ne = Math.ceil(ce); b.n = b.back; this.turn(b, 0.2); return; }
      b.ne = 0;
    }
    const s = Math.min(b.back, left) * SEG;
    if (s <= SEG * 0.5) { b.n = 0; b.dropping = false; this.rig.show(b.inst, false); return; }
    const was = b.s; this.place(L, b, s); b.r = lerp(b.r, R0, q); b.s = was - (was - s); b.dropping = false;
    if (q > 0.86) b.p.addScaledVector(this.N, -ramp(q, 0.86, 1) * (0.14 + 2 * R0));
    if (b.cwall[Math.min(b.course.length - 1, b.n)] === 1) b.p.addScaledVector(this.N, R0 - 0.004);
  },
  turn(b, a) { b.q.premultiply(this.qq.setFromAxisAngle(this.T, a)); },
  // The six strands as ribbons: from the foot of the frame along each course to its ball (and on, if pushed).
  strands(L) {
    const g = this.strand.geometry, P = g.attributes.position.array, Nn = g.attributes.normal.array; let any = false;
    for (const b of this.balls) {
      const base = b.i * MAXP * 2, pts = b.course, n = Math.min(b.n, pts.length), ne = b.extra ? (b.ne != null && L.phase === 'return' ? b.ne : b.extra.length) : 0, tot = Math.min(MAXP - 1, n + ne);
      let lx = 0, ly = 0, lz = 0;
      for (let j = 0; j < MAXP; j++) {
        let p, wall = 0;
        if (j < tot) { if (j < n) { p = pts[j]; wall = b.cwall[j]; } else p = b.extra[j - n]; }
        else if (tot > 0) { p = b.p; wall = b.cwall[Math.min(pts.length - 1, n)] || 0; } else p = null;
        if (j === tot && tot > 0) { p = this.tmp2.copy(b.p).addScaledVector(wall ? this.N : this.UP, -b.r * 0.92); }
        const o = (base + j * 2) * 3;
        if (!p || j > tot) { for (let e = 0; e < 6; e++) { P[o + e] = e % 3 === 0 ? lx : e % 3 === 1 ? ly : lz; } continue; }
        any = true;
        const q = j < tot ? (j + 1 < n ? pts[j + 1] : j + 1 < tot ? b.extra[j + 1 - n] : b.p) : b.p;
        const nrm = wall ? this.N : this.UP, dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z, dl = Math.hypot(dx, dy, dz) || 1;
        // across the strand, flat on what it lies on
        let sx = nrm.y * dz / dl - nrm.z * dy / dl, sy = nrm.z * dx / dl - nrm.x * dz / dl, sz = nrm.x * dy / dl - nrm.y * dx / dl; const sl = Math.hypot(sx, sy, sz) || 1;
        const w = (b.i === CLIMB && wall === 2 ? 0.011 : 0.011) / sl;
        P[o] = p.x + sx * w; P[o + 1] = p.y + sy * w; P[o + 2] = p.z + sz * w; P[o + 3] = p.x - sx * w; P[o + 4] = p.y - sy * w; P[o + 5] = p.z - sz * w;
        lx = p.x; ly = p.y; lz = p.z;
        Nn[o] = Nn[o + 3] = nrm.x; Nn[o + 1] = Nn[o + 4] = nrm.y; Nn[o + 2] = Nn[o + 5] = nrm.z;
      }
    }
    g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true; this.strand.visible = any;
  },

  // ------------------------------------------------------------------ the bird
  birdUpdate(L, t, ph) {
    const B = this.bird, P = this.perches, hide = this.at(0.5, 1.7, -L.wall + 0.01, this.tmp);    // behind the frame's right side
    let p = this.bp, flap = 0, yaw = L.yawOut, on = false, sing = false, pitch = 0;
    if ((ph === 'wake' || ph === 'play') && t > T_BIRD) {
      on = true;
      // out from behind the frame to the first flower, then flitting from one to the next while you look
      const seq = [0, 2, 4, 1, 3], a = t - T_BIRD, step = a < 0.6 ? -1 : Math.floor((a - 0.6) / IDLE_B), within = a < 0.6 ? a / 0.6 : ((a - 0.6) % IDLE_B);
      const from = step < 0 ? hide : P[seq[step % seq.length] % P.length], to = step < 0 ? P[seq[0] % P.length] : P[seq[(step + 1) % seq.length] % P.length];
      const fly = step < 0 ? within : clamp01((within - (IDLE_B - 0.55)) / 0.55);
      if (step >= 0 && fly <= 0) { p.copy(from); sing = within > 0.3 && within < 1.5; yaw = L.yawOut + Math.sin(t * 1.3 + step) * 0.6; pitch = sing ? -0.25 : 0.1 * Math.sin(t * 6); flap = 0; if (within < 0.15) flap = 0.6 * Math.sin(within * 60); }
      else {
        const s = ease.inOut(fly); p.lerpVectors(from, to, s); p.y += Math.sin(Math.PI * s) * 0.12; p.addScaledVector(this.N, Math.sin(Math.PI * s) * 0.12);
        this.w.subVectors(to, from); yaw = Math.atan2(this.w.x, this.w.z); flap = Math.sin(t * 70) * 0.9;
      }
      this.birdOn = true;
    } else if (ph === 'return' && this.birdOn0) {
      const s = ease.inOut(clamp01(L.ret / 0.5)); on = s < 1; p.lerpVectors(this.bfrom, hide, s); p.y += Math.sin(Math.PI * s) * 0.1; flap = Math.sin(L.r * 70) * 0.9; this.w.subVectors(hide, this.bfrom); yaw = Math.atan2(this.w.x, this.w.z);
    } else if (ph === 'linger' && this.birdOn) { on = true; sing = Math.sin(t * 0.7) > 0.6; }
    else this.birdOn = false;
    for (const i of [B.body, B.wr, B.wl]) this.rig.show(i, on);
    if (!on) return;
    const M = this.m; this.q.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ')); M.compose(p, this.q, this.one); this.rig.mat(B.body, M);
    for (const s of [1, -1]) {
      const W = this.tmpM || (this.tmpM = new THREE.Matrix4()), R = this.tmpR || (this.tmpR = new THREE.Matrix4()), F = this.tmpF || (this.tmpF = new THREE.Matrix4());
      W.copy(M).multiply(R.makeTranslation(s * 0.018 * B.BS, 0.012 * B.BS, 0.006 * B.BS)).multiply(R.makeRotationZ(s * (flap * 0.9 + (flap === 0 ? -0.35 : 0)))).multiply(F.makeRotationY(s * (flap === 0 ? 1.3 : 0))).multiply(F.makeScale(s, 1, 1));
      this.rig.mat(s > 0 ? B.wr : B.wl, W);
    }
    if (sing && !L.quiet) this.song(L);
  },
  song(L) {
    const v = L.voice(), c = v.ctx; if (!c) return;
    if (!this.songAt || this.songAt < c.currentTime) this.songAt = c.currentTime + 0.05;
    while (this.songAt < c.currentTime + 0.25) {
      const at = this.songAt - c.currentTime, n = 2 + Math.floor(L.rand() * 4), f = 2600 + L.rand() * 1600;
      for (let i = 0; i < n; i++) v.chirp(f * (1 + 0.1 * (i % 2)), f * (0.75 + L.rand() * 0.4), 0.06, { at: at + i * 0.075, vol: 0.014 });
      this.songAt += n * 0.075 + 0.25 + L.rand() * 0.4;
    }
  },
  knock(L, b, sp) { if (!L.quiet) L.voice().note(196 + b.i * 30, 0.12, { vol: Math.min(0.03, 0.008 + sp * 0.01), type: 'sine', attack: 0.004 }); },
  spring(L) {
    const v = L.voice(), bpm = 96;
    v.tune(SPRING, { bpm, type: 'triangle', vol: 0.02, legato: 0.5 });
    v.tune(SPRING.replace(/([A-G]#?)(\d)/g, (m, n, o) => n + (+o + 1)), { bpm, type: 'sine', vol: 0.006, legato: 0.3 });
    v.tune(SPRING_B, { bpm, type: 'sine', vol: 0.018, legato: 0.7 });
  },
});
