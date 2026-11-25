// Out of Degas's The Millinery Shop (Gallery 226): the five hats, off their stands. A flock: they flutter from room to
// room on their bows, at the height of a bench, their ribbons streaming, and come down to roost in a row on a gallery
// bench. Where there is no bench they do not settle (a hat on the floor is a dropped hat): they wheel where they are a
// moment, on slow wingbeats, and fly on to find one. Never on a frame, a case or a work of art. A
// robot's lamp swinging onto them sends them up and apart; they wheel, come together again in its light, and the lamp
// goes warm. The stands in the picture's show stay empty while they are out.
//
// One draw call: the show's own five hats, their bow wings and ribbon links out of its rig, in one BatchedMesh, drawn
// with the show's own dab of paint. The flock is one escapee (one of the six out); its hats are five of the bodies.

import * as THREE from 'three';
import { escapeFor, paint, take, dabs, ballDabs, ball, merge, batch, col, TAU, CELL } from './kit.js';
import { rng } from '../paintlife.js';
import { clearAt, sight } from '../guardplan.js';

const N = 5, SEG = 5, TAILS = 2, SEGL = 0.05, HS = 1.6;
// Out in the building they are seen across a room, not across a counter: larger than on their stands, their bows larger
// still (they are flying on them), their ribbons longer; and they fly at FLY metres, under every picture.
const BIG = 1.42, WING = 1.45, LINK = 0.08, FLY = 0.8;
const SIZE = [{ top: 0.11, wx: 0.1, wy: 0.035, half: 0.13 }, { top: 0.1, wx: 0.09, wy: 0.04, half: 0.12 }, { top: 0.08, wx: 0.1, wy: 0.03, half: 0.15 }, { top: 0.08, wx: 0.06, wy: 0.03, half: 0.08 }, { top: 0.1, wx: 0.09, wy: 0.035, half: 0.11 }].map(z => ({ top: z.top * HS, wx: z.wx * HS, wy: z.wy * HS, half: z.half * HS }));
// (should the show not be there to take them from: pink tulle, red felt, straw, blue tulle, orange)
const PLAIN = [['#c98c8a', ['#b47c7c', '#d99e9a', '#efc4bc', '#f5d8cf'], '#d79a3a'], ['#82301f', ['#6e2418', '#9b3a28', '#c0603c'], '#ad4a30'], ['#c9a465', ['#a8864e', '#d8b77a', '#f0dcaa'], '#6f9a52'], ['#93b4c0', ['#7f9eac', '#a8c6d0', '#d4e4e6'], '#3b9ac4'], ['#cf7a30', ['#b8642a', '#e08a3a', '#f0c27a'], '#b8682c']];
const RIBBON = ['#c4842e', '#9b3a28', '#6f9a52', '#2f86b0', '#cf7a30'];
const _m0 = new THREE.Matrix4(), _m1 = new THREE.Matrix4(), _l = new THREE.Matrix4(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _a = new THREE.Vector3();
const sm = x => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };
const turn = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
const local = (x, y, z, yaw, pitch, roll, sx = 1, sy = sx, sz = sx) => _l.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(pitch, yaw, roll, 'YXZ')), _s.set(sx, sy, sz));

// Somewhere to sit by the flock: a gallery bench, or the flat top of a crate of the toy's own stunt kit. Furniture only:
// never a case, a plinth with a work on it, a frame. -> [{ x, z, top, alongX, half (of its length), wide }]
let SEATS = null;
function seats(k) {
  if (SEATS) return SEATS; SEATS = [];
  for (const b of k.plan.benches || []) SEATS.push({ x: b.x, z: b.z, y: b.y, top: b.y + 0.5, alongX: !!b.alongX, half: 1.15, wide: 0.2 });
  for (const s of k.plan.surfaces || []) { if (s.skin !== 'crate' || s.axis || s.h0 !== s.h1 || s.base == null || s.h0 - s.base > 0.9) continue; const w = s.x1 - s.x0, d = s.z1 - s.z0; if (Math.min(w, d) < 0.35 || Math.max(w, d) < 1.0) continue; SEATS.push({ x: (s.x0 + s.x1) / 2, z: (s.z0 + s.z1) / 2, y: s.base, top: s.h0, alongX: w > d, half: Math.max(w, d) / 2 - 0.2, wide: Math.min(w, d) / 2 - 0.12 }); }
  return SEATS;
}
function seatBy(E, k, within = 2.2) {
  let best = null, bd = within;
  for (const b of seats(k)) { if (Math.abs(b.y - E.y) > 0.1) continue; const d = Math.hypot(b.x - E.x, b.z - E.z); if (d < bd) { bd = d; best = b; } }
  return best;
}

escapeFor(14572, {
  name: 'the hats', tag: 'HATS',
  line: 'The hats are off their stands in Degas’s Millinery Shop, and out of the shop: a flock of five, on their bows.',
  back: 'The hats are back on their stands in the Millinery Shop.',
  count: N, speed: 0.95, herd: 1.5, radius: 2.0, height: 1.4, need: 0.62, rest: [7, 14], react: 'off', hold: 2.8, chips: 30, stroke: 0.95, strokeLong: 2.0,
  colors: ['#d99e9a', '#efc4bc', '#9b3a28', '#c0603c', '#d8b77a', '#f0dcaa', '#a8c6d0', '#3b9ac4', '#e08a3a', '#d79a3a', '#6f9a52'],
  // Degas's stick of pastel: narrow hatching, every stroke leaning the same way
  mark: { cell: CELL.chalk, w: [0.013, 0.021], long: [4, 6], turn: 0.62, jit: 0.13 },
  parts(E) { const B = E.build, out = []; for (const h of B.h || []) if (h.i < E.n) out.push({ x: h.x, y: h.y + 0.07, z: h.z, r: 0.2, ry: 0.09 }); return out.length ? out : null; },

  async build(E, L, { group, pal }) {
    const B = E.build, R = rng(14572), c = (h, k = 0.15) => col(pal, h, k);
    let geos = null, map = null; B.size = SIZE;
    try {
      const S = L && L.spec, hats = S && S.rig && S.hats;
      if (hats && hats.length === N) {
        geos = [];
        for (const h of hats) geos.push(take(L, h.inst, { useMap: true }), take(L, h.wings[0], { useMap: true }), take(L, h.tails[0].segs[0], { useMap: true }));
        map = S.rig.mesh.material.map; if (S.size) B.size = S.size;
      }
    } catch { geos = null; map = null; }
    if (!geos) {
      geos = [];
      PLAIN.forEach(([under, set, bow], k) => {
        const z = SIZE[k], r = z.half * 0.8, cols = set.map(h => c(h));
        const hat = merge([ball([0, z.top * 0.42, 0], [r, z.top * 0.55, r], c(under).getHex(), 10), ballDabs([0, z.top * 0.42, 0], [r, z.top * 0.55, r], 90, (nx, ny) => cols[Math.max(0, Math.min(cols.length - 1, Math.floor((ny * 0.5 + 0.5) * cols.length + R() - 0.5)))], [0.05, 0.08], R)]);
        const wl = z.wx * 1.0, wing = dabs(Array.from({ length: 8 }, (_, i) => { const t = i / 8 * TAU; return { p: new THREE.Vector3(wl * 0.5 * (1 - Math.cos(t)), wl * 0.3 * Math.sin(t), 0), n: new THREE.Vector3(0, 0, 1), s: wl * 0.36, l: 1.15, a: t, c: c(bow).multiplyScalar(0.85 + 0.3 * Math.max(0, Math.sin(t))) }; }));
        const tail = dabs([{ p: new THREE.Vector3(0, 0, 0), n: new THREE.Vector3(0, 1, 0), s: 0.03, l: SEGL * 1.35 / 0.03, a: Math.PI / 2, c: c(RIBBON[k]) }]);
        geos.push(hat, wing, tail);
      });
    }
    const b = B.b = batch(geos, N * (3 + TAILS * SEG), paint({ glow: 0.5, rough: 0.85, map }));
    B.h = Array.from({ length: N }, (_, i) => ({
      i, inst: b.add(i * 3), wings: [b.add(i * 3 + 1), b.add(i * 3 + 1)], tails: Array.from({ length: TAILS }, (_, j) => ({ segs: Array.from({ length: SEG }, () => b.add(i * 3 + 2)), p: Array.from({ length: SEG + 1 }, () => new THREE.Vector3()), side: j ? 1 : -1, live: false })),
      x: E.x + Math.sin(i * 2.4) * 0.12, y: E.y + 0.25 + i * 0.07, z: E.z + Math.cos(i * 2.4) * 0.12, yaw: E.yaw, perched: false, land: 9, wait: 0, hop: 2 + R() * 4, flap: 0, slot: null,
    }));
    group.add(b.mesh);
    B.wake = Array.from({ length: 70 }, () => ({ x: E.x, z: E.z })); B.burst = 0; B.wasLit = false; B.roost = false; B.R = R;
  },

  pose(E, dt, k) {
    const B = E.build, b = B.b, t = E.t, calm = E.calm, fl = E.y, R = B.R, g = E.grid;
    const w0 = B.wake[0]; if (Math.hypot(E.x - w0.x, E.z - w0.z) > 0.05) { const last = B.wake.pop(); last.x = E.x; last.z = E.z; B.wake.unshift(last); }
    // a lamp swings onto them: up and apart, and together again
    const lit = E.lit > 0.02; if (lit && !B.wasLit && !calm) { B.burst = 1; k.synth.noise(0.5, { vol: 0.02, lp: 1400 }); } B.wasLit = lit; B.burst = Math.max(0, B.burst - dt / 2.4);
    const burst = sm(B.burst * 1.4), moving = E.v > 0.05, going = E.state === 'going';
    // come to rest: beside a bench they roost on it, in a row; with none by them they stay on the wing, and soon fly on
    const still = !moving && !going && !lit && B.burst <= 0 && E.emerge >= 1;
    if (still && !B.still) B.seat = seatBy(E, k);
    B.still = still; const roost = still && !!B.seat;
    if (still && !B.seat && E.state === 'out' && E.rest > 3 && E.rest < 1e6) E.rest = 1.6 + R() * 1.4;
    if (roost && !B.roost) {
      const seat = B.seat, order = [2, 0, 4, 1, 3];
      B.h.forEach((h, i) => {
        const u = (order[i] - 2) * Math.min(0.56, seat.half / 2) + (R() - 0.5) * 0.06, v = (R() - 0.5) * seat.wide * 0.6;
        h.slot = { x: seat.x + (seat.alongX ? u : v), y: seat.top, z: seat.z + (seat.alongX ? v : u), yaw: (seat.alongX ? 0 : Math.PI / 2) + (R() < 0.5 ? Math.PI : 0) + (R() - 0.5) * 0.8 };
        h.wait = order[i] * 0.22;
      });
    }
    if (!roost && B.roost) B.h.forEach((h, i) => { h.wait = i * 0.16; });
    B.roost = roost;
    const open = (x, z) => !g || (clearAt(g, x, z) >= 0.3 && sight(g, E.x, E.z, x, z, false));

    for (let i = 0; i < N; i++) {
      const h = B.h[i], on = i < E.n, sz = B.size[i];
      b.show(h.inst, on); for (const w of h.wings) b.show(w, on); for (const tl of h.tails) for (const s of tl.segs) b.show(s, on);
      if (!on) continue;
      // ---- where it wants to be
      let tx, ty, tz, vmax = 2.6;
      if (roost) { const s = h.slot; tx = s.x; tz = s.z; const dxz = Math.hypot(tx - h.x, tz - h.z); ty = s.y + Math.min(0.4, dxz * 0.7); }
      else if (moving && !lit && burst < 0.05) {
        // strung out behind the leader along the way it has come (so a doorway is taken one after another), two abreast
        const idx = Math.min(B.wake.length - 1, Math.round((0.1 + i * 0.42) / 0.05)), p = B.wake[idx], q = B.wake[Math.max(0, idx - 1)];
        let dx = q.x - p.x, dz = q.z - p.z; const dl = Math.hypot(dx, dz); if (dl > 1e-3) { dx /= dl; dz /= dl; } else { dx = Math.sin(E.yaw); dz = Math.cos(E.yaw); }
        const wide = Math.max(0, Math.min(0.36, (E.clear == null ? 1 : E.clear) - 0.35)), side = (i % 2 ? 1 : -1) * wide + (calm ? 0 : Math.sin(t * 1.9 + i * 2.3) * wide * 0.4);
        tx = p.x + dz * side; tz = p.z - dx * side; ty = fl + FLY + 0.05 * ((i * 3) % 5) + (calm ? 0 : 0.06 * Math.sin(t * 3.1 + i * 1.7));
      } else {
        // wheeling about their middle: wide and high when the lamp has just found them
        const a = i / N * TAU + t * (0.9 + 0.5 * burst) * (calm ? 0.3 : 1); let r = 0.6 + 1.4 * burst + 0.08 * Math.sin(t * 1.3 + i);
        tx = E.x + Math.sin(a) * r; tz = E.z + Math.cos(a) * r;
        for (let n = 0; n < 5 && !open(tx, tz); n++) { r *= 0.62; tx = E.x + Math.sin(a) * r; tz = E.z + Math.cos(a) * r; }
        ty = fl + FLY + 0.05 * ((i * 3) % 5) + (calm ? 0 : 0.07 * Math.sin(t * 3.1 + i * 1.7)) + 0.45 * burst * (0.6 + 0.4 * Math.sin(i * 1.9 + 1)); vmax = 2.6 + 2.6 * burst;
      }
      // ---- getting there
      let fly = 1, pitch = 0, roll = 0, squash = 0, yawShow;
      if (h.perched && roost) {
        h.land += dt; fly = 0; squash = 0.18 * Math.exp(-h.land * 5) * Math.sin(h.land * 20);
        yawShow = h.yaw + (calm ? 0 : Math.sin(t * 0.6 + i * 1.7) * 0.25);
        h.flap = -0.35 + (calm ? 0 : 0.25 * Math.max(0, Math.sin(t * 1.3 + i * 2.4) - 0.92) * 12);
        // now and then two of them change places on the bench
        if (!calm && (h.hop -= dt) <= 0) {
          h.hop = 3 + R() * 6;
          { const o = B.h[(i + 1 + Math.floor(R() * (E.n - 1))) % E.n]; if (o !== h && o.perched) { const s = h.slot; h.slot = o.slot; o.slot = s; h.perched = o.perched = false; h.wait = 0; o.wait = 0.25; k.synth.note(1700 + i * 260, 0.06, { type: 'sine', vol: 0.012 }); } }
        }
      } else {
        h.perched = false;
        if ((h.wait -= dt) > 0 && h.land > 0.5 && Math.abs(h.y - (h.slot ? h.slot.y : -99)) < 0.02) { fly = 0; yawShow = h.yaw; h.flap = -0.35 + 0.5 * (1 - h.wait / 1.2); }      // (not yet: one after another)
        else {
          const dx = tx - h.x, dy = ty - h.y, dz = tz - h.z, d = Math.hypot(dx, dy, dz), sp = Math.max(0.5, Math.min(vmax, d * 5)), st = Math.min(d, sp * dt);
          if (d > 1e-5) { h.x += dx / d * st; h.y += dy / d * st; h.z += dz / d * st; }
          const flat = Math.hypot(dx, dz);
          if (roost && d < 0.03) { h.perched = true; h.land = 0; h.x = tx; h.y = h.slot.y; h.z = tz; h.yaw = turn(h.yaw, h.slot.yaw, 0.5); if (!calm) k.synth.noise(0.1, { vol: 0.006 * (1 - Math.min(1, E.d / 14)), lp: 700 }); }
          else if (flat > 0.06) h.yaw = turn(h.yaw, Math.atan2(dx, dz), Math.min(1, dt * (roost && flat < 0.3 ? 2 : 7)));
          yawShow = h.yaw; pitch = roost ? -0.3 * sm(1 - flat / 0.4) : 0.12; roll = calm ? 0 : Math.sin(t * 2.1 + i) * 0.14 + 0.5 * burst * Math.sin(t * 5 + i * 2);
          const beat = t * (12.5 + i * 0.9) + i * 1.9; h.flap = calm ? Math.sin(t * 5 + i) * 0.5 : 0.12 + Math.sin(beat) * 1.0; h.lift = calm ? 0 : -0.028 * Math.cos(beat);
        }
      }
      // ---- the hat, its bows, its ribbons (in the flock's own space)
      const lx = h.x - E.x, ly = h.y - fl + (fly ? h.lift || 0 : 0), lz = h.z - E.z;
      local(lx, ly, lz, yawShow, pitch, roll, BIG * (1 + squash * 0.6), BIG * (1 - squash), BIG * (1 + squash * 0.6)); _m0.copy(_l); b.mat(h.inst, _m0);
      for (let s = 0; s < 2; s++) { const sd = s ? 1 : -1; local(sd * sz.wx * 0.55, sz.wy, -0.01, s ? 0 : Math.PI, 0, h.flap, WING); b.mat(h.wings[s], _m1.multiplyMatrices(_m0, _l)); }
      const floorY = (h.perched ? h.slot.y : fl) - fl + 0.004;
      h.tails.forEach((tl, j) => {
        _a.set(tl.side * sz.half * 0.35, sz.wy * 0.6, -sz.half * 0.8).applyMatrix4(_m0);
        if (!tl.live) { for (let n = 0; n <= SEG; n++) tl.p[n].set(_a.x, _a.y - n * LINK, _a.z); tl.live = true; tl.ox = E.x; tl.oz = E.z; }
        // (the links are kept in the flock's space: as it moves on they are left behind, and follow)
        const mx = tl.ox - E.x, mz = tl.oz - E.z; tl.ox = E.x; tl.oz = E.z;
        tl.p[0].copy(_a);
        for (let n = 1; n <= SEG; n++) {
          const p = tl.p[n], o = tl.p[n - 1]; p.x += mx; p.z += mz; p.y -= (fly ? 0.5 : 1.1) * dt;
          if (fly && !calm) { const f = Math.sin(t * 11 + n * 1.3 + j * 2 + i) * 0.7 * dt; p.x += f * Math.cos(yawShow); p.z -= f * Math.sin(yawShow); }
          if (p.y < floorY) p.y = floorY;
          const dx = p.x - o.x, dy = p.y - o.y, dz = p.z - o.z, d = Math.hypot(dx, dy, dz) || 1e-5; p.set(o.x + dx / d * LINK, o.y + dy / d * LINK, o.z + dz / d * LINK);
          const hl = Math.hypot(dx, dz);
          local((o.x + p.x) / 2, (o.y + p.y) / 2, (o.z + p.z) / 2, Math.atan2(dx, dz), -Math.atan2(dy, hl), calm ? 0 : 0.3 * Math.sin(t * 6 + n + j), 1.3 * LINK / SEGL); b.mat(tl.segs[n - 1], _l);
        }
      });
    }
  },

  // (set down somewhere else by the test hook: the flock goes with its middle)
  onPlace(E, dx, dz) { const B = E.build; if (!B || !B.h) return; for (const h of B.h) { h.x += dx; h.z += dz; h.perched = false; for (const tl of h.tails) tl.live = false; } for (const w of B.wake) { w.x = E.x; w.z = E.z; } B.roost = false; B.still = false; },

  // A bench to make for: the floor beside one, on this floor, in the rooms it knows (not the one it is at).
  where(E, k, g) {
    const need = 0.72, list = [];
    for (const bn of seats(k)) {
      if (Math.abs(bn.y - E.y) > 0.1) continue; const d = Math.hypot(bn.x - E.x, bn.z - E.z); if (d > 26 || d < 2.2) continue;
      for (const sd of [-1, 1]) { const off = sd * (bn.wide + 1.0), x = bn.x + (bn.alongX ? 0 : off), z = bn.z + (bn.alongX ? off : 0); if (clearAt(g, x, z) >= need) list.push({ x, z }); }
    }
    return list.length ? list[Math.floor(Math.random() * list.length)] : null;
  },

  // The show, while they are out: the stands come up empty.
  hide(L, S) {
    const r = S.rig; if (!r || !S.hats) return;
    for (const h of S.hats) { for (const i of [h.inst, ...h.wings]) r.show(i, false); for (const tl of h.tails) { for (const i of tl.segs) r.show(i, false); tl.live = false; } h.shown = false; }
    if (S.blobs) S.blobs.count = 0;
    if (S.flutter && S.flutter.set) S.flutter.set(0);
  },

  // a snip of ribbon, a wisp of tulle, dropped as they go: a stroke of his pastel
  trail(E) { const i = Math.floor(Math.random() * RIBBON.length); return { color: Math.random() < 0.5 ? RIBBON[i] : PLAIN[i][1][1], size: 0.016 + Math.random() * 0.008, long: 4.5, cell: CELL.chalk, every: 0.45 + Math.random() * 0.4, life: 14, turn: (Math.random() - 0.5) * 3, dx: (Math.random() - 0.5) * 0.7, dz: (Math.random() - 0.5) * 0.7 }; },

  // sparrow talk, and the flutter of their bows
  voice(E, k, vol) {
    const base = [900, 2000, 2600, 3600, 1600][Math.floor(Math.random() * 5)];
    k.synth.note(base, 0.06, { type: 'sine', vol: 0.014 * vol, attack: 0.003 }); k.synth.note(base * 1.2, 0.05, { type: 'sine', vol: 0.012 * vol, at: 0.08, attack: 0.003 });
    if (E.v > 0.05) k.synth.noise(0.35, { vol: 0.012 * vol, lp: 1100 });
  },
});
