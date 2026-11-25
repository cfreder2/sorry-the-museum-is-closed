// Out of Monet's Cliff Walk at Pourville (Griffin Court): the orange parasol, off on the wind again.
// A gust takes it from room to room: up off the floor, tipped the way it is going, turning as it flies, and you do not
// see the gust, only what it stirs: petals off the cliff top and blades of its grass, going round under the parasol and
// left lying where it has been. When the gust drops it comes down like a dandelion seed and sits on its rim and the
// knob of its stick. A robot's lamp on it and the wind dies: it floats down in the light, and goes home in his dabs.
// It keeps well under the pictures (it flies at the height of a bench), and the rooms nothing roams into are not on
// any way it is blown.
//
// One draw call: the show's own parasol (its dome in his orange and salmon, darker under, its stick and knob).

import * as THREE from 'three';
import { escapeFor, paint, take, solid, merge, col, TAU, CELL } from './kit.js';
import { rng } from '../paintlife.js';
import { nearestOpen } from '../guardplan.js';
import { LOWMEM as LOW } from '../budget.js';

const PARASOL = 18, S = 2.0;                      // (the show's rig's number for it; twice the show's size, out on the floor)
const REST_TILT = 0.983, REST_H = 0.6 * Math.cos(REST_TILT) + 0.02, FLY_TILT = 0.42, FLY_H = 0.84;      // on its rim and its knob; on the wind
const N_PET = LOW ? 8 : 14;
const PETALS = ['#f4efe0', '#f2d86a', '#e8765a', '#f2a890', '#e9b7c4', '#fbf6ea'], GRASS = ['#7fa04a', '#a3b85a', '#5f8a4e', '#c2c873'];
const sm = x => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const _e = new THREE.Euler(0, 0, 0, 'YXZ'), _q = new THREE.Quaternion(), _y = new THREE.Vector3(0, 1, 0), _p = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3();

function dome(c) {
  const prof = [[0.152, -0.072], [0.143, -0.05], [0.12, -0.03], [0.085, -0.014], [0.045, -0.004], [0.004, 0]].map(p => new THREE.Vector2(p[0], p[1]));
  const top = c('#e8765a'), lite = c('#f6b8a0'), edge = c('#d8604a');
  const d = solid(new THREE.LatheGeometry(prof, 20), 0xffffff, (x, y, z, o) => { const r = Math.hypot(x, z) / 0.152; o.copy(top).lerp(lite, (1 - r) * (1 - r) * 0.6 + 0.2 * (0.5 + 0.5 * Math.sin(Math.atan2(x, z) * 5))).lerp(edge, r > 0.86 ? 0.6 : 0); });
  const stick = new THREE.CylinderGeometry(0.004, 0.004, 0.33, 6); stick.translate(0, -0.135, 0);
  return merge([d, solid(stick, c('#5a4234').getHex())]);
}

escapeFor(14620, {
  name: 'the parasol', tag: 'PARASOL', tall: true,
  line: 'The orange parasol is off on the wind again: out of Monet’s Cliff Walk, and away through the building.',
  back: 'The parasol is back on the cliff top, in her hands.',
  count: 1, speed: 1.15, herd: 1.7, radius: 0.75, height: 1.25, need: 0.62, rest: [2.5, 6], react: 'still', hold: 2.6, chips: 30, stroke: 0.9, strokeLong: 1.5,
  colors: ['#e8765a', '#f09070', '#f2a890', '#ec8468', '#f6b8a0', '#d8604a', '#b85a46', '#f2d86a', '#7fa04a'],
  // Monet's short commas, each turned its own way, as he flicks them on
  mark: { cell: CELL.comma, w: [0.024, 0.036], long: [1.7, 2.3], turn: 0, jit: 1.3 },
  // (its dome, up where it flies: what a robot's lamp throws the shadow of)
  parts(E) { const B = E.build, m = B.mesh; return [{ x: E.x + m.position.x, y: E.y + m.position.y - 0.03, z: E.z + m.position.z, r: 0.27, ry: 0.1 }]; },

  async build(E, L, { group, pal }) {
    const B = E.build, c = (h, k = 0.15) => col(pal, h, k);
    let g = null; try { const Sp = L && L.spec; if (Sp && Sp.rig && Sp.I && Sp.I[PARASOL] >= 0) g = take(L, Sp.I[PARASOL]); } catch { g = null; }
    if (!g) g = dome(c);
    g.scale(S, S, S);
    const m = B.mesh = new THREE.Mesh(g, paint({ glow: 0.5, rough: 0.92 })); group.add(m);
    B.R = rng(14620); B.f = 0; B.head = E.yaw; B.spin = 0; B.ea = 0; B.ex = E.x; B.ez = E.z;
    B.pet = Array.from({ length: N_PET }, (_, i) => ({ r: 0.16 + 0.42 * B.R(), up: B.R(), ph: B.R() * TAU, w: 0.75 + 0.5 * B.R(), grass: i % 4 === 3, c: (i % 4 === 3 ? c(GRASS[i % GRASS.length]) : c(PETALS[i % PETALS.length], 0.08)).multiplyScalar(0.95) }));
  },

  pose(E, dt, k) {
    const B = E.build, m = B.mesh, t = E.t, calm = E.calm, lit = E.lit > 0.02, going = E.state === 'going';
    // on the wind while it is going anywhere; down again when the gust drops, or a lamp is on it
    const fly = E.v > 0.05 && !lit && !going ? 1 : 0;
    B.f += (fly - B.f) * Math.min(1, dt * (fly ? 1.5 : 0.75)); const f = sm(B.f);
    if (E.v > 0.05) B.head += wrap(E.yaw - B.head) * Math.min(1, dt * 2.5);
    B.spin += dt * (calm ? 0.3 : 0.35 + 2.1 + (E.led > 0 ? 1.0 : 0)) * f;
    const tilt = REST_TILT + (FLY_TILT + (calm ? 0 : 0.13 * Math.sin(t * 1.9)) - REST_TILT) * f;
    const h = REST_H + (FLY_H + (calm ? 0 : 0.07 * Math.sin(t * 2.6)) - REST_H) * f, sway = calm ? 0 : 0.1 * f * Math.sin(t * 1.3);
    m.position.set(Math.cos(B.head) * sway, h, -Math.sin(B.head) * sway);
    m.quaternion.setFromEuler(_e.set(tilt, B.head, calm ? 0 : 0.1 * f * Math.sin(t * 1.5), 'YXZ')).multiply(_q.setFromAxisAngle(_y, B.spin));
    // what the gust stirs: petals and grass going round under it, a little behind
    if (!E.marks || going) return;
    B.ex += (E.x - B.ex) * Math.min(1, dt * 2.2); B.ez += (E.z - B.ez) * Math.min(1, dt * 2.2);
    B.ea += dt * (calm ? 0.25 : 0.12 + 2.9 * f);
    for (const q of B.pet) {
      const a = B.ea * q.w + q.ph, r = q.r * (0.75 + 0.45 * f), y = 0.014 + (calm ? 0.05 : 0.04 + 0.3 * q.up * (0.6 + 0.4 * Math.sin(t * 2.7 + q.ph))) * f;
      const sx = Math.sin(a), cz = Math.cos(a), lean = 0.9 * f;
      _p.set(B.ex + sx * r, E.y + y, B.ez + cz * r); _n.set(sx * lean, 1, cz * lean).normalize(); _t.set(cz, 0.25 * f * Math.sin(t * 5 + q.ph), -sx).normalize();
      E.marks.put(_p, _n, _t, q.grass ? 0.018 : 0.034, q.grass ? 0.085 : 0.06, q.c, CELL.comma);
    }
  },

  // Blown on into another room, more often than about the one it is in.
  where(E, k, g) {
    const ids = g.rooms.filter(id => id !== E.room); if (!ids.length) return null;
    const r = k.plan.byId[ids[Math.floor(Math.random() * ids.length)]]; if (!r) return null;
    const x = r.x0 + (r.x1 - r.x0) * (0.25 + 0.5 * Math.random()), z = r.z0 + (r.z1 - r.z0) * (0.25 + 0.5 * Math.random()), c = nearestOpen(g, x, z, 0.75, 3);
    return c < 0 ? null : { x: g.X0 + ((c % g.nx) + 0.5) * g.C, z: g.Z0 + (Math.floor(c / g.nx) + 0.5) * g.C };
  },
  onPlace(E) { const B = E.build; if (B && B.mesh) { B.ex = E.x; B.ez = E.z; } },

  // The show, while it is out: she stands on the cliff with empty hands, and the gust has nothing to take.
  hide(L, Sp) { if (Sp.rig && Sp.I && Sp.I[PARASOL] >= 0) Sp.rig.show(Sp.I[PARASOL], false); },

  // petals, left lying where the gust has been
  trail() { const g = Math.random() < 0.25; return { color: g ? GRASS[Math.floor(Math.random() * GRASS.length)] : PETALS[Math.floor(Math.random() * PETALS.length)], size: g ? 0.016 : 0.03, long: g ? 4.2 : 1.8, cell: CELL.comma, every: 0.3, life: 10, turn: Math.random() * TAU, dx: (Math.random() - 0.5) * 0.7, dz: (Math.random() - 0.5) * 0.7 }; },

  // the gust itself: a breath through the doorway
  voice(E, k, vol) { if (E.v > 0.05) k.synth.noise(1.1, { vol: 0.02 * vol, lp: 700 }); },
});
