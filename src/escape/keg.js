// Out of Winslow Homer's The Herring Net (Gallery 161): the net's red keg float, on a patch of its own grey-green sea.
// It slides over the gallery floors and through the doorways the way a float drifts, nose first, its corks strung out
// behind it on the line, and leaves the floor wet where it has been. It does not care about a robot's lamp: the lamp
// lands on it, the water begins to drain away under it, and it goes home in Homer's long strokes.
//
// Two draw calls: the keg, its corks and its line (one BatchedMesh, the show's own keg and cork out of its rig, with the
// painted shell of dabs laid on) and the sea it rides (the kit's patch, in the show's own strokes).

import * as THREE from 'three';
import { escapeFor, paint, take, dabs, merge, solid, patch, swellAt, col, batch, TAU, CELL } from './kit.js';
import { strokes } from '../life/brush.js';
import { rng } from '../paintlife.js';
import { LOWMEM as LOW } from '../budget.js';

const KEG = { r: 0.088, hl: 0.13 }, S = 1.5;      // the show's keg, half as big again (it is seen from further off)
const SEA = { r: 1.0, wave: 0.032, y: 0.022 }, N_CORK = 5, GAP = 0.15;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _d = new THREE.Vector3(), UPY = new THREE.Vector3(0, 1, 0);
const sm = (x, a, b) => { x = (x - a) / (b - a); x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };

function cask() {
  const prof = [new THREE.Vector2(0.0001, -KEG.hl), new THREE.Vector2(KEG.r * 0.62, -KEG.hl)];
  for (let i = 0; i <= 14; i++) { const q = i / 14 * 2 - 1; prof.push(new THREE.Vector2(KEG.r * (1 - 0.3 * q * q), q * KEG.hl * 0.985)); }
  prof.push(new THREE.Vector2(KEG.r * 0.62, KEG.hl), new THREE.Vector2(0.0001, KEG.hl));
  const g = new THREE.LatheGeometry(prof, 24); g.rotateX(Math.PI / 2);
  return solid(g, '#b04a2a');
}

escapeFor(25865, {
  name: 'the keg float', tag: 'KEG FLOAT',
  line: 'Something red is afloat on the gallery floor: the keg float from Homer’s Herring Net, on a patch of its own sea.',
  back: 'The keg float is back on Homer’s sea.',
  count: 1, speed: 0.42, herd: 1.05, radius: 1.05, height: 0.36, need: 0.6, rest: [3, 8], react: 'none', chips: 25, stroke: 1.15,
  colors: ['#b04a2a', '#cf6a40', '#743423', '#35423b', '#46554d', '#586660', '#28402e', '#cbc5af'],
  // Homer's long wet strokes, laid the way the water runs: no wider or longer than the ones on the keg
  mark: { cell: CELL.wet, w: [0.026, 0.038], long: [2.3, 3.0], turn: 0, jit: 0.22 },
  parts(E) { const B = E.build; return [{ x: E.x + (B.kx || 0), y: E.y + (B.h || 0.1), z: E.z + (B.kz || 0), r: 0.15, ry: 0.13 }]; },

  async build(E, L, { group, pal }) {
    const R = rng(25865), c = (h, k = 0.18) => col(pal, h, k), B = E.build;
    // the keg: the show's own, and its painted shell (lit from the fog's light above, dark under, one wet gleam)
    let keg = null, cork = null;
    try { if (L && L.spec.rig) { keg = take(L, L.spec.iKeg); cork = take(L, L.spec.iCork[0]); } } catch { keg = cork = null; }
    if (!keg) keg = cask();
    if (!cork) { cork = new THREE.SphereGeometry(1, 10, 7); cork.scale(0.019, 0.013, 0.026); cork = solid(cork, '#8a6c46'); }
    const hi = [c('#e08a58', 0.12), c('#cf6a40', 0.15), c('#e8a57a', 0.1)], mid = c('#aa4628'), lo = c('#5a2318', 0.2), gleam = c('#f0ebd7', 0.05), hoop = c('#5e2618', 0.2);
    const list = [], N = 120;
    for (let i = 0; i < N; i++) {
      const a = (i + R()) / N * TAU * 3, z = (i / (N - 1) * 2 - 1) * 0.9 + (R() - 0.5) * 0.1, rr = KEG.r * (1 - 0.3 * z * z) * 1.012, n = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
      const up = n.y, band = Math.abs(Math.abs(z) - 0.33) < 0.05 || Math.abs(Math.abs(z) - 0.84) < 0.06;
      const k = band ? hoop.clone().lerp(mid, 0.25 + 0.3 * R()) : up > 0.35 ? hi[i % 3].clone() : up > -0.3 ? mid.clone().lerp(hi[1], 0.3 * R()) : lo.clone().lerp(mid, 0.3 * R());
      list.push({ p: new THREE.Vector3(n.x * rr, n.y * rr, z * KEG.hl), n, s: band ? 0.03 : 0.026 + 0.014 * R(), l: band ? 0.8 : 1.9, a: band ? 0 : Math.PI / 2 + (R() - 0.5) * 0.3, c: k });
    }
    for (const z of [-0.3, 0.25]) list.push({ p: new THREE.Vector3(0.012, KEG.r * 1.03, z * KEG.hl), n: new THREE.Vector3(0.1, 1, 0), s: 0.022, l: 2.2, a: Math.PI / 2, c: gleam.clone() });
    const gKeg = merge([keg, dabs(list)]);
    // a cork, and a length of the line (from 0 to 1 along z)
    const line = new THREE.CylinderGeometry(0.004, 0.004, 1, 5, 1, true); line.rotateX(Math.PI / 2); line.translate(0, 0, 0.5);
    const b = B.b = batch([gKeg, cork, solid(line, c('#3e3222', 0.2).getHex())], 2 + N_CORK * 2, paint({ glow: 0.4, rough: 0.55 }));
    B.keg = b.add(0); B.corks = Array.from({ length: N_CORK }, () => b.add(1)); B.segs = Array.from({ length: N_CORK }, () => b.add(2));
    group.add(b.mesh);
    // the sea it rides: Homer's long loaded strokes, grey-green, a little foam at its edge
    const css = (h, k) => '#' + c(h, k).getHexString();
    const map = strokes({ size: LOW ? 128 : 256, seed: 25865, n: LOW ? 260 : 620, len: [20, 84], width: [5, 15], bend: 0.3, lift: 0.2, base: css('#35423b', 0.2),
      colors: [['#1f2b25', 3], ['#33413a', 4], ['#46554d', 3], ['#586660', 2.2], ['#69756f', 1.2], ['#75735f', 0.9], ['#28402e', 1.6], ['#357045', 0.7], ['#3d5058', 1.0]].map(([h, w]) => [css(h, 0.2), w]),
      angle: (x, y, r) => (r() - 0.5) * 0.7 });
    map.userData.own = true;
    B.sea = patch({ r: SEA.r, map, tile: 1.25, wave: SEA.wave, bright: 1.05, crest: c('#cbc5af', 0.12).getHex(), foam: 0.55 });
    B.sea.position.y = SEA.y; group.add(B.sea);
    // where the corks lie: a wake of places it has been (in the room), filled in behind it to begin with
    E.onPlaceWake = () => { B.wake.forEach((w, i) => { w.x = E.x - Math.sin(E.yaw) * i * 0.03; w.z = E.z - Math.cos(E.yaw) * i * 0.03; }); };
    B.wake = Array.from({ length: 40 }, (_, i) => ({ x: E.x - Math.sin(E.yaw) * i * 0.03, z: E.z - Math.cos(E.yaw) * i * 0.03 })); B.wd = 0;
    B.yaw = E.yaw; B.h = 0;
  },

  pose(E, dt, k) {
    const B = E.build, b = B.b, u = B.sea.userData.u, t = E.t, calm = E.calm;
    u.uT.value = calm ? 0 : t;
    // the lamp on it: the water begins to drain; going home, it drains away
    // (and it draws in where the way is narrow: through a doorway, past a case)
    B.wide = (B.wide == null ? 1 : B.wide) + ((0.5 + 0.5 * sm(E.clear == null ? 1 : E.clear, 0.5, 1.0)) - (B.wide == null ? 1 : B.wide)) * Math.min(1, dt * 1.5);
    u.uGrow.value = B.wide * (1 - 0.3 * sm(E.lit, 0, 1)) * (1 - sm(E.gone, 0, 0.9));
    const grow = u.uGrow.value;
    const hAt = (lx, lz) => { const qx = lx / SEA.r, qz = lz / SEA.r, d = Math.hypot(qx, qz); return SEA.y + (calm ? 0 : swellAt(qx, qz, t)) * SEA.wave * (1 - sm(d, 0.55, 1)); };
    // the keg rides nose first, a little ahead of the middle of its water, lying over on the swell
    B.yaw += Math.atan2(Math.sin(E.yaw - B.yaw), Math.cos(E.yaw - B.yaw)) * Math.min(1, dt * 1.6);
    const yaw = B.yaw + (calm ? 0 : Math.sin(t * 0.43) * 0.22 * (E.v > 0.05 ? 0.4 : 1));
    const fx = Math.sin(yaw), fz = Math.cos(yaw), lead = 0.1;
    const kx = Math.sin(E.yaw) * lead, kz = Math.cos(E.yaw) * lead, h0 = hAt(kx, kz), e = 0.14;
    const pitch = -Math.atan2(hAt(kx + fx * e, kz + fz * e) - hAt(kx - fx * e, kz - fz * e), 2 * e), roll = Math.atan2(hAt(kx + fz * e, kz - fx * e) - hAt(kx - fz * e, kz + fx * e), 2 * e) + (calm ? 0 : Math.sin(t * 1.3) * 0.06);
    B.h += ((h0 + KEG.r * S * 0.42 * Math.min(1, grow * 1.6 + 0.2)) - B.h) * Math.min(1, dt * 6);
    b.put(B.keg, kx, B.h, kz, yaw, pitch, roll, S); B.kx = kx; B.kz = kz;
    // the corks: strung out along where it has been, on the water, the line between them
    const wx = E.x + kx - fx * KEG.hl * S, wz = E.z + kz - fz * KEG.hl * S, w0 = B.wake[0];
    if (Math.hypot(wx - w0.x, wz - w0.z) > 0.03) { const last = B.wake.pop(); last.x = wx; last.z = wz; B.wake.unshift(last); }
    let px = wx - E.x, pz = wz - E.z, py = B.h - 0.02, wi = 0, acc = 0;
    for (let i = 0; i < N_CORK; i++) {
      const want = GAP * (i + 1); let cx = px, cz = pz;
      while (wi < B.wake.length - 1 && acc < want) { const p0 = B.wake[wi], p1 = B.wake[wi + 1]; acc += Math.hypot(p1.x - p0.x, p1.z - p0.z); wi++; }
      cx = B.wake[wi].x - E.x; cz = B.wake[wi].z - E.z;
      // (kept on the water: the patch goes with the keg, the corks swing in behind it)
      const far = Math.hypot(cx, cz), lim = SEA.r * 0.8 * Math.max(0.25, grow); if (far > lim) { cx *= lim / far; cz *= lim / far; }
      cx += calm ? 0 : Math.sin(t * 0.7 + i * 1.9) * 0.012; cz += calm ? 0 : Math.cos(t * 0.6 + i * 2.3) * 0.012;
      const cy = hAt(cx, cz) + 0.006, a = Math.atan2(cx - px, cz - pz);
      b.put(B.corks[i], cx, cy, cz, a + 0.5, 0, 0, S * 1.25);
      _d.set(cx - px, cy - py, cz - pz); const len = _d.length() || 1e-3; _q.setFromUnitVectors(_p.set(0, 0, 1), _d.divideScalar(len));
      b.mat(B.segs[i], _m.compose(_p.set(px, py, pz), _q, _s.set(1.6, 1.6, len)));
      px = cx; pz = cz; py = cy;
    }
  },

  onPlace(E) { if (E.onPlaceWake && E.build) E.onPlaceWake(); },

  // the floor left wet where it has been: a few of his sea's strokes, lying the way it went
  trail(E) { return { color: WET[Math.floor(Math.random() * WET.length)], size: 0.028 + Math.random() * 0.012, long: 2.8, cell: CELL.wet, every: LOW ? 0.16 : 0.08, life: 10, turn: Math.PI + (Math.random() - 0.5) * 0.4, dx: (Math.random() - 0.5) * 0.7, dz: (Math.random() - 0.5) * 0.7 }; },

  // the water: a slap against the wood, and now and then the knock of the cask
  voice(E, k, vol) {
    k.synth.noise(0.7, { vol: 0.022 * vol, lp: 520 });
    if (Math.random() < 0.4) k.synth.note(132 + Math.random() * 20, 0.16, { type: 'sine', vol: 0.03 * vol, at: 0.25, attack: 0.004 });
  },
});
const WET = ['#4a5a52', '#5c6a62', '#3d5058', '#6a756c'];
