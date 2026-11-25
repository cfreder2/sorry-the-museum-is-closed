// Goya's Boy on a Ram (111559): the three lambs stray, and the boy rides out on his ram to fetch them.
//
// The lambs are what is out: soft dabs of cream that skip off, graze, and skip on. They are the only thing here a robot
// can find, light or send home. The boy and his ram are helpers: they are no record in src/escapes.js, so no lamp can
// be turned on them, held on them, or send them anywhere; a beam that crosses them is a beam crossing a coat on a bench.
// He rides out a few seconds after the lambs, goes round behind them and works them back towards their own room (they
// skip on when he gets close: lambs), keeps off while a lamp is on them, and when the lambs are home (the toy's doing or
// a lamp's) he turns his ram, trots to the foot of his own wall, lifts his hat, and goes in under the frame by himself.
// He looks at his lambs and the way he is going: never at the player.
//
// The lambs are one draw call (the show's own lamb, three times); the boy and ram are one more, of the show's own parts.

import * as THREE from 'three';
import { escapeFor, paint, take, thin, ballDabs, ball, merge, solid, batch, col, TAU } from './kit.js';
import { rng } from '../paintlife.js';
import { cellAt, clearAt, lineClear, path as route, nearestOpen } from '../guardplan.js';
import { Bones } from '../life/stagecraft.js';
import { features } from '../features.js';

const N = 3, K = 1.3, SC = 1.2 * K, LS = 1.42 * K, BOY = 1.1;      // (the show's own sizes, a little larger out on the floor)
const T_BOY = 4.5;                                // seconds after the lambs before he rides out
const LH = [[0.026, 0.09, 0.046], [-0.026, 0.09, 0.046], [0.027, 0.09, -0.046], [-0.027, 0.09, -0.046]];
const HIPS = [[0.062, 0.18, 0.13], [-0.062, 0.18, 0.13], [0.066, 0.185, -0.13], [-0.066, 0.185, -0.13]];
const sm = x => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3(0, 1, 0), _c = new THREE.Color();
const WOOL = ['#e9dfc8', '#d8cbb0', '#f3ecda', '#c7b99c'];
const HEART = 0.3;                                // (radians) no lamp is held on the lambs while the boy is this near the middle of it
// The robot whose lamp is on the lambs, or is coming round to them.
function lampNear(E, k) {
  if (E.by) return E.by;
  if (k.G.set.guards === false) return null;
  const gf = features.find(f => f.id === 'guards'); if (!gf || !gf.bots) return null;
  let best = null, bd = 10;
  for (const q of gf.bots) { if (q.lobby || q.fy == null || Math.abs(q.fy - E.y) > 0.5) continue; const d = Math.hypot(E.x - q.x, E.z - q.z); if (d < bd && q.g && cellAt(q.g, E.x, E.z) >= 0) { best = q; bd = d; } }
  return best;
}

escapeFor(111559, {
  name: 'the lambs', tag: 'LAMBS',
  line: 'Three lambs have strayed out of Goya’s Boy on a Ram. The boy has ridden out after them.',
  back: 'The lambs are home, and the boy and his ram behind them.',
  count: N, speed: 0.62, herd: 1.25, radius: 0.85, height: 0.5, need: 0.5, rest: [5, 10], react: 'off', hold: 3.2, chips: 35, stroke: 0.8, strokeLong: 1.7,
  colors: ['#e9dfc8', '#d8cbb0', '#f3ecda', '#c7b99c', '#b9a27a', '#8f9a6a', '#6f7f5a', '#5a4a3e'],

  async build(E, L, { group, pal }) {
    const B = E.build, R = B.R = rng(111559), S = L && L.spec, c = (h, k = 0.15) => col(pal, h, k);
    // ---- the lambs
    let gLamb = null, gLeg = null;
    try { if (S && S.rig && S.lambs) { gLamb = thin(take(L, S.lambs[0].body), { dab: 0.72, curl: 0, R }); gLeg = take(L, S.lambs[0].legs[0]); } } catch { gLamb = gLeg = null; }
    if (!gLamb) {
      const cols = WOOL.map(h => c(h));
      gLamb = merge([ball([0, 0.115, 0], [0.04, 0.036, 0.07], c('#d8cbb0').getHex(), 10), ball([0, 0.15, 0.075], [0.022, 0.022, 0.03], c('#e9dfc8').getHex(), 8), ballDabs([0, 0.115, 0], [0.042, 0.038, 0.072], 46, () => cols[Math.floor(R() * cols.length)], [0.02, 0.03], R)]);
      const leg = new THREE.CylinderGeometry(0.009, 0.007, 0.09, 5); leg.translate(0, -0.045, 0); gLeg = solid(leg, c('#c7b99c').getHex());
    }
    const lb = B.lb = batch([gLamb, gLeg], N * 5, paint({ glow: 0.42, rough: 0.9 }));
    B.lambs = Array.from({ length: N }, (_, j) => ({ j, body: lb.add(0), legs: [0, 1, 2, 3].map(() => lb.add(1)), x: E.x + Math.sin(j * 2.1) * 0.12, z: E.z + Math.cos(j * 2.1) * 0.12, yaw: E.yaw, dist: j * 0.3, v: 0, leap: 3 + R() * 5, air: -1, slot: null, look: R() * TAU }));
    group.add(lb.mesh);
    // ---- the boy and his ram: the show's own parts (if the show cannot be had, the lambs stray alone)
    B.boy = null;
    try {
      if (S && S.rig && S.ram && S.boy) {
        const r = S.ram, y = S.boy, geos = [r.body, r.head, r.jaw, r.bell, r.knot, r.up[0], r.lo[0], y.torso, y.arm, y.hat, y.legL, y.legR].map((i, n) => thin(take(L, i), { dab: 0.6, curl: n < 2 ? 0.3 : 0, R }));
        const mat = paint({ glow: 0.4, rough: 0.88 }); mat.userData.helper = true;      // (not the escapee's: it does not come apart with the lambs)
        const rb = B.rb = batch(geos, 18, mat);
        B.boy = { body: rb.add(0), head: rb.add(1), jaw: rb.add(2), bell: rb.add(3), knot: rb.add(4), up: [0, 1, 2, 3].map(() => rb.add(5)), lo: [0, 1, 2, 3].map(() => rb.add(6)), torso: rb.add(7), arm: rb.add(8), hat: rb.add(9), legL: rb.add(10), legR: rb.add(11),
          state: E.outT > T_BOY + 3 ? 'out' : 'in', k: E.outT > T_BOY + 3 ? 1 : 0, x: E.x - Math.sin(E.yaw) * 1.3, z: E.z - Math.cos(E.yaw) * 1.3, yaw: E.yaw, v: 0, dist: 0, path: new Float32Array(512), pn: 0, pk: 0, plan: 0, halt: 0, tip: 0, twist: 0, mat };
        B.all = [B.boy.body, B.boy.head, B.boy.jaw, B.boy.bell, B.boy.knot, ...B.boy.up, ...B.boy.lo, B.boy.torso, B.boy.arm, B.boy.hat, B.boy.legL, B.boy.legR];
        group.add(rb.mesh);
        const M = () => new THREE.Matrix4(); B.M = { root: M(), head: M(), jaw: M(), bell: M(), knot: M(), up: [M(), M(), M(), M()], lo: [M(), M(), M(), M()], seat: M(), torso: M(), arm: M(), hat: M(), legL: M(), legR: M() };
      }
    } catch (e) { B.boy = null; }
    B.bones = new Bones(); B.m = new THREE.Matrix4(); B.ml = [0, 1, 2, 3].map(() => new THREE.Matrix4());
    B.wake = Array.from({ length: 60 }, () => ({ x: E.x, z: E.z })); B.roost = false; B.near = 0;
    B.cols = ['#b9a27a', '#8c3a2c', '#d8cbb0', '#3d4a52', '#c9a24e', '#6f7f5a'].map(h => c(h));
  },

  pose(E, dt, k) {
    const B = E.build, lb = B.lb, bn = B.bones, t = E.t, calm = E.calm, fl = E.y, g = E.grid, R = B.R, going = E.state === 'going';
    const w0 = B.wake[0]; if (Math.hypot(E.x - w0.x, E.z - w0.z) > 0.05) { const last = B.wake.pop(); last.x = E.x; last.z = E.z; B.wake.unshift(last); }
    const moving = E.v > 0.05, rest = !moving && !going;
    if (rest && !B.roost) B.lambs.forEach((l, j) => { const a = j / N * TAU + R() * 1.2, r = Math.min(0.42, Math.max(0.12, (E.clear == null ? 1 : E.clear) - 0.25)) * (0.6 + 0.4 * R()); l.slot = { x: E.x + Math.sin(a) * r, z: E.z + Math.cos(a) * r }; l.look = R() * TAU; });
    B.roost = rest;
    // ---- the lambs
    for (const l of B.lambs) {
      const on = l.j < E.n; lb.show(l.body, on); for (const q of l.legs) lb.show(q, on);
      if (!on) continue;
      let tx, tz;
      if (rest && l.slot) { tx = l.slot.x; tz = l.slot.z; }
      else {
        // one behind another along the way the first has come, a little to either side
        const idx = Math.min(B.wake.length - 1, Math.round(l.j * 0.36 / 0.05)), p = B.wake[idx], q = B.wake[Math.max(0, idx - 1)];
        let dx = q.x - p.x, dz = q.z - p.z; const dl = Math.hypot(dx, dz); if (dl > 1e-3) { dx /= dl; dz /= dl; } else { dx = Math.sin(E.yaw); dz = Math.cos(E.yaw); }
        const wide = Math.max(0, Math.min(0.16, (E.clear == null ? 1 : E.clear) - 0.3)) * (l.j === 1 ? 1 : l.j === 2 ? -1 : 0.2);
        tx = p.x + dz * wide; tz = p.z - dx * wide;
      }
      const dx = tx - l.x, dz = tz - l.z, d = Math.hypot(dx, dz), sp = Math.min(Math.max(E.v, 0.5) * 1.7, d * 4), st = Math.min(d, sp * dt);
      if (d > 0.015) { l.x += dx / d * st; l.z += dz / d * st; l.dist += st; l.v = st / Math.max(dt, 1e-4); l.yaw += wrap(Math.atan2(dx, dz) - l.yaw) * Math.min(1, dt * 8); }
      else { l.v = 0; if (rest) l.yaw += wrap(l.look - l.yaw) * Math.min(1, dt * 1.2); }
      // a lamb's gait: a skip at every step when it is going anywhere; at rest it grazes, and now and then leaps for nothing
      let hop = 0, air = -1, pitch = 0;
      if (l.v > 0.25 && !calm) { const h = l.dist / 0.34, f = h - Math.floor(h); hop = 0.05 * 4 * f * (1 - f) * Math.min(1, l.v / 0.6); air = f; }
      else if (rest) {
        if (!calm && (l.leap -= dt) <= 0) { l.leap = 4 + R() * 7; l.air0 = t; l.look = R() * TAU; if (E.d < 14) k.synth.note([540, 610, 480][l.j], 0.16, { type: 'triangle', vol: 0.012 * (1 - E.d / 14), attack: 0.02 }); }
        const f = l.air0 != null ? (t - l.air0) / 0.42 : 2;
        if (f < 1) { hop = 0.085 * 4 * f * (1 - f); air = f; } else pitch = 0.16 + (calm ? 0 : 0.03 * Math.sin(t * 2.3 + l.j * 2));      // (its head down to the floor)
      }
      if (air >= 0) pitch = -0.16 * Math.cos(Math.PI * air);
      bn.set(B.m, l.x - E.x, hop * LS, l.z - E.z, l.yaw, pitch, 0, LS); lb.mat(l.body, B.m);
      const lphi = l.dist / 0.13 * TAU, mv = Math.min(1, l.v / 0.4);
      for (let q = 0; q < 4; q++) {
        const front = q < 2, ph = lphi + (q === 1 || q === 2 ? Math.PI : 0), p = air >= 0 && (rest || l.v > 0.5) ? (front ? 0.3 : -0.3) * Math.sin(Math.PI * air) : 0.38 * mv * Math.sin(ph);
        bn.child(B.ml[q], B.m, LH[q][0], LH[q][1], LH[q][2], 0, p - (air < 0 ? pitch : 0), 0); lb.mat(l.legs[q], B.ml[q]);
      }
    }
    // ---- the boy on his ram
    const b = B.boy; if (!b) return;
    const rb = B.rb, M = B.M, a = E.art, lit = E.lit > 0.02;
    // where he is in his own story: in the picture, riding out, out, riding home, gone in
    const hx = a.x + a.nx * 0.95, hz = a.z + a.nz * 0.95, wx = a.x + a.nx * 0.2, wz = a.z + a.nz * 0.2;      // before his wall; at its foot
    if (b.state === 'in' && !going && E.outT > T_BOY) { b.state = 'coming'; b.k = 0; b.x = wx; b.z = wz; b.yaw = Math.atan2(a.nx, a.nz); if (E.d < 16) this.bell(k, 0.03 * (1 - E.d / 16)); }
    if (going && b.state === 'in') b.state = 'gone';      // (they were sent home before he had set out)
    if (going && (b.state === 'out' || b.state === 'coming')) { b.state = 'home'; b.pn = 0; b.plan = 0; b.halt = 0.6; b.way = false; b.keep = null; b.stay = false; }
    const shown = b.state !== 'in' && b.state !== 'gone';
    for (const i of B.all) rb.show(i, shown);
    if (!shown) return;
    let want = null, speed = 0.95, twistTo = 0;
    if (b.state === 'coming') { b.k = Math.min(1, b.k + dt / 1.5); want = { x: hx, z: hz }; if (b.k >= 1 && Math.hypot(b.x - hx, b.z - hz) < 0.25) b.state = 'out'; }
    else if (b.state === 'out') {
      // round behind them (the far side from their own wall), a little way off; further off while a lamp is on them
      let ax = E.x - hx, az = E.z - hz; const al = Math.hypot(ax, az); if (al > 0.5) { ax /= al; az /= al; } else { ax = -a.nx; az = -a.nz; }
      const off = lit ? 2.6 : E.led > 0 ? 1.5 : 1.25, sd = lit ? 1.6 : 0;
      want = { x: E.x + ax * off + az * sd, z: E.z + az * off - ax * sd }; speed = E.led > 0 ? 1.3 : 0.95;
      // (a robot's lamp on his lambs, or coming round to them: he steps out of the way of it, as far to the side as the
      // room lets him, and waits there; the robot does not hold its lamp on them until he has: shield(), below)
      let q = g ? lampNear(E, k) : null; if (q) { b.keepQ = q; b.keepFor = 3; } else if ((b.keepFor = (b.keepFor || 0) - dt) > 0) q = b.keepQ; else b.keepQ = null;
      if (q) {
        if ((b.keepT = (b.keepT || 0) - dt) <= 0 || !b.keep) {
          b.keepT = 0.6; const aim = Math.atan2(E.x - q.x, E.z - q.z); let best = null, bs = -1e9;
          for (let i = 0; i < 16; i++) for (const r of [1.8, 2.4, 3.3, 4.2]) {
            const x = E.x + Math.sin(i / 16 * TAU) * r, z = E.z + Math.cos(i / 16 * TAU) * r; if (clearAt(g, x, z) < 0.42 || Math.hypot(x - q.x, z - q.z) < 1.9) continue;
            const offA = Math.abs(wrap(Math.atan2(x - q.x, z - q.z) - aim)), db = Math.hypot(x - b.x, z - b.z);
            const sc = Math.min(offA, 0.8) * 12 - db * 0.7 + (b.keep && Math.hypot(x - b.keep.x, z - b.keep.z) < 0.5 ? 1.5 : 0);
            if (sc > bs) { bs = sc; best = { x, z }; }
          }
          b.keep = best;
        }
        if (b.keep) { want = { x: b.keep.x, z: b.keep.z }; speed = 1.5; }
      } else b.keep = null;
      const dl = Math.hypot(E.x - b.x, E.z - b.z); twistTo = wrap(Math.atan2(E.x - b.x, E.z - b.z) - b.yaw);
      // (he has come up behind them: they skip on, towards home as often as not)
      if (!lit && !(E.led > 0) && !moving && dl < 1.7 && (B.near += dt) > 2.2) { B.near = 0; B.shoo = true; E.rest = 0; if (E.d < 14) this.bell(k, 0.02 * (1 - E.d / 14)); } else if (dl >= 1.7 || moving) B.near = 0;
    } else if (b.state === 'home') {
      want = { x: hx, z: hz }; speed = 1.15;
      if (!b.way) {
        // (the way his lambs' colours ran: over the floor to the place before his wall)
        b.way = true; b.pn = 0; b.pk = 1; const Q = E.going, P = Q && !Q.far ? Q.pts : null;
        if (P && g) {
          let n = 0; const put = (x, z) => { b.path[n * 2] = x; b.path[n * 2 + 1] = z; n++; };
          put(b.x, b.z); if (!lineClear(g, b.x, b.z, P[1].x, P[1].z, 0.3)) put(P[0].x, P[0].z);
          for (let i = 1; i < P.length - 2 && n < 250; i++) put(P[i].x, P[i].z);
          put(hx, hz); b.pn = n;
          // (too far to trot while you wait, the long way round the quiet rooms: he sets off along it, lifts his hat, and is gone as their colours were)
          let len = 0; for (let i = 1; i < n; i++) len += Math.hypot(b.path[i * 2] - b.path[i * 2 - 2], b.path[i * 2 + 1] - b.path[i * 2 - 1]);
          b.stay = len > 32 && Q.how === 'light';      // (and not through the lamp that is on their colours: from where he stood aside)
          b.leave = len > 32 ? (b.stay ? 3 : 5) : 0; if (b.stay) b.pn = 0;
        } else { b.state = 'off0'; b.k = 0; }      // (no way over this floor: he turns his ram for home and is gone)
      }
      if (b.state === 'home' && b.leave > 0 && b.halt <= 0 && (b.leave -= dt) <= 0) { b.state = 'off0'; b.k = 0; }
      if (b.state === 'home' && b.stay) { want = null; twistTo = wrap(Math.atan2(E.x - b.x, E.z - b.z) - b.yaw); }      // (he watches them go)
      else if (b.state === 'home' && b.halt <= 0 && (Math.hypot(b.x - hx, b.z - hz) < 0.3 || b.pk >= b.pn)) { b.state = 'in0'; b.k = 0; b.tip = 0; }
    } else if (b.state === 'off0') {
      b.k += dt / 2.4; b.tip = sm(b.k * 2.5) * (1 - sm((b.k - 0.5) * 3)); b.v = 0;
      if (b.k >= 1) { b.state = 'gone'; for (const i of B.all) rb.show(i, false); return; }
    } else if (b.state === 'in0') {
      // before his own wall: he lifts his hat, turns his ram to it, and goes in under the frame
      b.k += dt / (calm ? 2.6 : 2.2); b.tip = sm(b.k * 2.2) * (1 - sm((b.k - 0.55) * 3));
      const u = sm((b.k - 0.35) / 0.65); b.x = hx + (wx - hx) * u; b.z = hz + (wz - hz) * u; b.yaw += wrap(Math.atan2(-a.nx, -a.nz) - b.yaw) * Math.min(1, dt * 4); b.v = u > 0 && u < 1 ? 0.6 : 0; b.dist += b.v * dt;
      // (his colours go up the wall to just under the frame as he goes in)
      if (!calm && E.marks && u > 0.25) for (let i = 0; i < 9; i++) {
        const q = (u - 0.25) / 0.75 * 1.5 - i * 0.055; if (q <= 0 || q >= 1) continue;
        const top = a.y - a.h / 2 - (a.frame || 0.08) - 0.07, y = fl + 0.04 + (top - fl - 0.04) * sm(q), s = Math.min(1, q / 0.1) * Math.min(1, (1 - q) / 0.15), o = (i - 4) * 0.045 + Math.sin(q * 9 + i) * 0.02;
        E.marks.put(_v.set(a.x + a.nx * 0.012 + a.nz * o, y, a.z + a.nz * 0.012 - a.nx * o), _n.set(a.nx, 0, a.nz), _t, 0.075 * s, 0.17 * s, _c.copy(B.cols[i % B.cols.length]).lerp(_c2, 0.2));
      }
      if (b.k >= 1) { b.state = 'gone'; if (E.d < 16) k.synth.chime([587.33, 739.99, 880], { gap: 0.12, dur: 1.2, vol: 0.03 * (1 - E.d / 16) }); for (const i of B.all) rb.show(i, false); return; }
    }
    if (b.halt > 0) { b.halt -= dt; want = null; }
    // ---- his way there: straight if the floor is clear, else round by the doors
    if (want && g) {
      const dw = Math.hypot(want.x - b.x, want.z - b.z);
      if (dw > 0.22) {
        if (b.state !== 'home' && ((b.plan -= dt) <= 0 || (b.pn > 0 && b.pk >= b.pn))) {
          b.plan = 1.2; b.pn = 0;
          if (clearAt(g, want.x, want.z) < 0.4) { const cc = nearestOpen(g, want.x, want.z, 0.4, 2.5); if (cc >= 0) { want.x = g.X0 + ((cc % g.nx) + 0.5) * g.C; want.z = g.Z0 + (Math.floor(cc / g.nx) + 0.5) * g.C; } }
          if (clearAt(g, b.x, b.z) < 0.34) { const cc = nearestOpen(g, b.x, b.z, 0.36, 3); if (cc >= 0 && b.state !== 'coming') { b.x = g.X0 + ((cc % g.nx) + 0.5) * g.C; b.z = g.Z0 + (Math.floor(cc / g.nx) + 0.5) * g.C; } }
          if (b.state === 'coming' || lineClear(g, b.x, b.z, want.x, want.z, 0.34)) { b.path[0] = b.x; b.path[1] = b.z; b.path[2] = want.x; b.path[3] = want.z; b.pn = 2; }
          else b.pn = Math.min(256, route(g, b.x, b.z, want.x, want.z, b.path, 0.34, 9000));
          b.pk = 1;
        }
        let left = speed * dt; b.v = 0;
        while (left > 0 && b.pk < b.pn) {
          const tx = b.path[b.pk * 2], tz = b.path[b.pk * 2 + 1], dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz);
          if (d < 1e-4) { b.pk++; continue; }
          b.yaw += wrap(Math.atan2(dx, dz) - b.yaw) * Math.min(1, dt * 5);
          const st = Math.min(d, left); b.x += dx / d * st; b.z += dz / d * st; left -= st; b.v = speed; b.dist += st; if (st >= d - 1e-6) b.pk++;
        }
      } else { b.v = 0; b.pn = 0; if (b.state === 'out') b.yaw += wrap(Math.atan2(E.x - b.x, E.z - b.z) - b.yaw) * Math.min(1, dt * 1.5); }
    } else if (b.state !== 'in0') b.v = 0;
    // ---- the ram's trot, and the boy astride (src/life/111559-boy-on-a-ram.js's own rig)
    const grow = b.state === 'coming' ? 0.05 + 0.95 * sm(b.k) : b.state === 'in0' ? 1 - 0.95 * sm((b.k - 0.45) / 0.55) : b.state === 'off0' ? 1 - 0.97 * sm((b.k - 0.4) / 0.6) : 1;
    const amp = Math.min(1, b.v * 1.3), phi = b.dist / (0.27 * K) * TAU, bob = 0.011 * amp * Math.abs(Math.cos(phi));
    const tw = b.twist += (Math.max(-1, Math.min(1, twistTo)) * 0.7 - b.twist) * Math.min(1, dt * 3), sc = SC * grow;
    bn.set(M.root, b.x - E.x, bob * sc, b.z - E.z, b.yaw, 0.02 * amp, calm ? 0 : 0.02 * amp * Math.sin(phi), sc); rb.mat(b.body, M.root);
    bn.child(M.head, M.root, 0, 0.315, 0.19, calm ? 0 : 0.08 * Math.sin(t * 1.3), 0.08 + 0.05 * amp * Math.sin(phi * 2), 0); rb.mat(b.head, M.head);
    bn.child(M.jaw, M.head, 0, -0.04, 0.086, 0, 0, 0); rb.mat(b.jaw, M.jaw);
    const swing = 0.35 * amp * Math.sin(phi + 0.6);
    bn.child(M.knot, M.root, 0, 0.246, 0.238, 0, 0, 0); rb.mat(b.knot, M.knot);
    bn.child(M.bell, M.knot, 0, -0.006, 0.004, 0, swing * 0.5, swing * 0.6); rb.mat(b.bell, M.bell);
    for (let q = 0; q < 4; q++) {
      const front = q < 2, ph = phi + (q === 1 || q === 2 ? Math.PI : 0), p = 0.42 * amp * Math.sin(ph), lift = amp * 0.85 * Math.max(0, -Math.cos(ph)), h = HIPS[q];
      bn.child(M.up[q], M.root, h[0], h[1], h[2], 0, p, 0); rb.mat(b.up[q], M.up[q]);
      bn.child(M.lo[q], M.up[q], 0, -0.085, 0, 0, front ? lift : lift * 0.5, 0); rb.mat(b.lo[q], M.lo[q]);
    }
    bn.child(M.seat, M.root, 0, 0.334 + 0.012 * amp * Math.abs(Math.sin(phi + 0.5)), -0.035, 0, 0, 0, BOY);
    bn.child(M.torso, M.seat, 0, 0, 0, tw, 0.06 * amp + 0.04 * Math.sin(phi * 2) * amp, calm ? 0 : 0.04 * Math.sin(t * 1.7)); rb.mat(b.torso, M.torso);
    for (const [leg, s] of [[b.legL, 1], [b.legR, -1]]) { const lm = s > 0 ? M.legL : M.legR; bn.child(lm, M.seat, s * 0.036, 0.004, 0.012, 0, -0.11 * amp * Math.sin(phi + (s > 0 ? 0 : Math.PI)), s * 0.06 * amp * Math.abs(Math.sin(phi))); rb.mat(leg, lm); }
    bn.child(M.arm, M.torso, -0.05, 0.112, 0, 0, (calm ? 0 : 0.25 * Math.sin(t * TAU * 1.2) * amp) - 0.1 + 1.5 * b.tip, (calm ? 0 : -0.2 * Math.sin(t * TAU * 1.2 + 1.2) * amp) + 0.5 * b.tip); rb.mat(b.arm, M.arm);
    bn.child(M.hat, M.torso, 0, 0.206 + 0.07 * b.tip, 0.002, 0.3 * b.tip, -0.2 - 0.25 * b.tip, calm ? 0 : 0.06 * Math.sin(t * 2.1)); rb.mat(b.hat, M.hat);
    // his ram's bell, a step in two
    if (amp > 0.3 && !calm && E.d < 12) { const st = Math.floor(b.dist / 0.7); if (st !== b.st) { b.st = st; this.bell(k, 0.012 * (1 - E.d / 12)); } }
  },
  bell(k, vol) { k.synth.note(1180 + Math.random() * 30, 0.5, { type: 'sine', vol, attack: 0.002 }); k.synth.note(2365, 0.25, { type: 'sine', vol: vol * 0.4, attack: 0.002 }); },

  // No lamp is held on the lambs while the boy is in the middle of it: the robot looks on, and waits for him to step aside.
  shield(E, q) {
    const b = E.build && E.build.boy; if (!b || (b.state !== 'out' && b.state !== 'coming')) return false;
    const d = Math.hypot(b.x - q.x, b.z - q.z); if (d > 14) return false;
    return Math.abs(wrap(Math.atan2(b.x - q.x, b.z - q.z) - Math.atan2(E.x - q.x, E.z - q.z))) < HEART;
  },

  // The lambs stay "going home" until the boy has gone in after them.
  linger(E) { const b = E.build && E.build.boy; return !!b && b.state !== 'gone' && b.state !== 'in'; },

  // Where they skip on to when the boy has come up behind them: part of the way home, as often as not.
  where(E, k, g) {
    const B = E.build; if (!B || !B.shoo) return null; B.shoo = false;
    if (Math.random() < 0.35) return null;
    const a = E.art, hx = a.x + a.nx * 1.6, hz = a.z + a.nz * 1.6, d = Math.hypot(hx - E.x, hz - E.z); if (d < 2.5) return null;
    const f = Math.min(1, 4.5 / d); let x = E.x + (hx - E.x) * f, z = E.z + (hz - E.z) * f;
    if (clearAt(g, x, z) < 0.7) { const c = nearestOpen(g, x, z, 0.7, 3); if (c < 0) return null; x = g.X0 + ((c % g.nx) + 0.5) * g.C; z = g.Z0 + (Math.floor(c / g.nx) + 0.5) * g.C; }
    return { x, z };
  },

  onPlace(E, dx, dz) { const B = E.build; if (!B || !B.lambs) return; for (const l of B.lambs) { l.x += dx; l.z += dz; } for (const w of B.wake) { w.x = E.x; w.z = E.z; } B.roost = false; const b = B.boy; if (b && (b.state === 'out' || b.state === 'coming' || b.state === 'in')) { b.state = 'out'; b.k = 1; b.x = E.x - Math.sin(E.yaw) * 1.4; b.z = E.z - Math.cos(E.yaw) * 1.4; b.pn = 0; b.plan = 0; } },

  // The show, while they are out: the path comes up without the lambs, and without the boy once he has ridden out.
  hide(L, S, E) {
    const r = S.rig; if (!r || !S.lambs) return;
    for (const lb of S.lambs) { r.show(lb.body, false); for (const q of lb.legs) r.show(q, false); }
    const away = E.outT > T_BOY;
    if (away && S.ram && S.boy) for (const i of [S.ram.body, S.ram.head, S.ram.jaw, S.ram.bell, S.ram.knot, ...S.ram.up, ...S.ram.lo, ...Object.values(S.boy)]) r.show(i, false);
    if (S.blobs) S.blobs.count = away ? 0 : Math.min(S.blobs.count, 2);
  },

  // small cloven prints, two and two
  trail() { return { color: '#5a4a3e', size: 0.032, long: 1.5, every: 0.2, life: 12, side: 0.045, turn: (Math.random() - 0.5) * 0.3, dx: (Math.random() - 0.5) * 0.25, dz: (Math.random() - 0.5) * 0.25 }; },

  // a lamb's bleat, thin and high
  voice(E, k, vol) { const f = [520, 600, 470][Math.floor(Math.random() * 3)]; k.synth.note(f, 0.13, { type: 'triangle', vol: 0.03 * vol, attack: 0.02 }); k.synth.note(f * 0.94, 0.26, { type: 'triangle', vol: 0.026 * vol, at: 0.12, attack: 0.02 }); },
});
const _c2 = new THREE.Color(0xfff0c8);
