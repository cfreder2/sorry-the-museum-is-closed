// Out of Seurat's A Sunday on La Grande Jatte (Gallery 240): the monkey, off its lead.
// It builds on what was there (src/l2-grandejatte.js): the monkey still slips its lead when the picture has been looked
// at, and still hides in a corner of the gallery to be found (the old secret). What is new: if the toy drives out of the
// gallery without finding it, the monkey comes out of its corner and is loose in the building, in Seurat's dots, on a
// small round of the island's sunlit grass that goes where it goes, its lead trailing behind it. In a robot's lamp it
// stands quite still, side on, tail curled up, as he painted it. Brought home by the toy, it counts as found.
//
// One draw call: body, head, four limbs and tail (one BatchedMesh), every form under a coat of dots.

import * as THREE from 'three';
import { escapeFor, paint, ball, ballDabs, dabs, merge, solid, batch, col, TAU } from './kit.js';
import { rng } from '../paintlife.js';
import { features } from '../features.js';
import { nearestOpen } from '../guardplan.js';
import { Bones } from '../life/stagecraft.js';
import { LOWMEM as LOW } from '../budget.js';

const K = 1.7, H = 0.127;                         // its size on the floor; its back's height standing
const SH = [[0.03, -0.012, 0.06], [-0.03, -0.012, 0.06], [0.032, -0.012, -0.06], [-0.032, -0.012, -0.06]];
const LAWN_R = 0.52, LAWN_G = LOW ? 0.17 : 0.118;
const gj = () => features.find(f => f.id === 'l2-grande-jatte');
const sm = x => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
const _p = new THREE.Vector3(), _n = new THREE.Vector3(0, 1, 0), _t = new THREE.Vector3(1, 0, 0);

escapeFor(27992, {
  name: 'the monkey', tag: 'MONKEY',
  line: 'The monkey off the Grande Jatte has left its corner. It is loose in the building, lead and all.',
  back: 'The monkey is back on the island, and on its lead.',
  count: 1, speed: 1.0, herd: 1.7, radius: 0.6, height: 0.5, need: 0.42, rest: [4, 9], react: 'still', hold: 2.0, chips: 30, stroke: 0.62, strokeLong: 1.0,
  colors: ['#6b4426', '#8a5a30', '#c98a4a', '#3a2c4a', '#2e4060', '#8fae4e', '#c9cf6a', '#4d7a48', '#e3d27a'],

  // How it gets out: the old way (it slips its lead, and hides in a corner), and then the toy leaves the gallery.
  watch(E, dt, k) {
    const f = gj(); if (!f || !f.art || f.state !== 'out' || !f.at || k.G.state !== 'play') { E.w = 0; return false; }
    if (k.G.roomId && k.G.roomId !== f.roomId) { if ((E.w = (E.w || 0) + dt) > 2.5) { E.w = 0; return true; } } else E.w = 0;
    return false;
  },
  onOut(E, k) {
    const f = gj(); if (!f || !f.art) return;
    if (f.state === 'out' && f.at) {      // (from the corner it was hiding in, not from under the frame)
      E.x = f.at.x; E.z = f.at.z; E.emerge = 0.7;
      const g = k.G.escapes && k.G.escapes._grid(E), c = g ? nearestOpen(g, E.x, E.z, 0.5, 3) : -1; if (c >= 0) { E.x = g.X0 + ((c % g.nx) + 0.5) * g.C; E.z = g.Z0 + (Math.floor(c / g.nx) + 0.5) * g.C; }
    }
    if (f.monkey) { f.monkey.visible = false; f.monkey.scale.setScalar(1); }
    f.state = 'back';      // (the gallery's own monkey is this one now)
  },
  onHome(E, how, k) {
    const f = gj(); if (f && f.art && f.state === 'back') { f.state = 'home'; f.look = 0; }
    if (how === 'toy' && k.find && k.find('monkey') && typeof k.callout === 'function') k.callout('THE MONKEY');
  },

  async build(E, L, { group, pal }) {
    const B = E.build, R = B.R = rng(27992), c = (h, k = 0.2) => col(pal, h, k);
    const fur = c('#4a3328').getHex(), light = ['#c98a4a', '#b0703a', '#d9a860', '#8a5a30'].map(h => c(h)), mid = ['#6b4426', '#7a4e2c', '#5a3a26', '#8a5a30'].map(h => c(h)), dark = ['#3a2c4a', '#2e4060', '#3c2a3a', '#4a3328'].map(h => c(h));
    const pick = (nx, ny, nz, r) => { const q = ny + (r() - 0.5) * 0.5; return (q > 0.3 ? light : q < -0.25 ? dark : mid)[Math.floor(r() * 4)]; };
    const dots = (C, Rr, n, s = [0.017, 0.024]) => ballDabs(C, Rr, n, pick, s, R, { long: 1, out: 1.03 });
    const red = c('#c0392b', 0.1).getHex(), face = c('#b89878').getHex();
    const collar = new THREE.TorusGeometry(0.031, 0.006, 5, 12); collar.rotateX(Math.PI / 2 - 0.5); collar.translate(0, 0.03, 0.078);
    const gBody = merge([ball([0, 0, 0], [0.04, 0.043, 0.09], fur, 10), dots([0, 0, 0], [0.04, 0.043, 0.09], LOW ? 60 : 96), solid(collar, red)]);
    const gHead = merge([ball([0, 0.03, 0.03], [0.036, 0.036, 0.038], fur, 10), ball([0, 0.018, 0.062], [0.019, 0.016, 0.02], face, 8), ball([0.035, 0.042, 0.018], [0.006, 0.013, 0.012], face, 6), ball([-0.035, 0.042, 0.018], [0.006, 0.013, 0.012], face, 6),
      ball([0.015, 0.036, 0.062], [0.005, 0.005, 0.004], 0x1a1210, 6), ball([-0.015, 0.036, 0.062], [0.005, 0.005, 0.004], 0x1a1210, 6), dots([0, 0.032, 0.022], [0.037, 0.037, 0.036], LOW ? 28 : 44, [0.014, 0.019])]);
    const limb = new THREE.CylinderGeometry(0.012, 0.009, 0.105, 6); limb.translate(0, -0.0525, 0);
    const gLimb = merge([solid(limb, fur), ball([0, -0.108, 0.008], [0.011, 0.008, 0.017], fur, 6), dots([0, -0.055, 0], [0.013, 0.055, 0.013], 12, [0.013, 0.017])]);
    const curve = new THREE.CatmullRomCurve3([[0, 0, 0], [0, 0.02, -0.07], [0, 0.1, -0.12], [0, 0.19, -0.1], [0, 0.225, -0.04], [0, 0.185, -0.008]].map(p => new THREE.Vector3(...p)));
    const tl = []; for (let i = 0; i < 22; i++) { const u = (i + 0.5) / 22, p = curve.getPoint(u), tg = curve.getTangent(u), a = R() * TAU, n = new THREE.Vector3(Math.cos(a), 0, 0).addScaledVector(new THREE.Vector3(0, 1, 0).cross(tg).lengthSq() > 0.01 ? new THREE.Vector3(0, tg.z, -tg.y).normalize() : new THREE.Vector3(0, 1, 0), Math.sin(a)).normalize(); tl.push({ p: p.addScaledVector(n, 0.009), n, s: 0.014 + R() * 0.004, l: 1, a: 0, c: pick(n.x, n.y, n.z, R).clone() }); }
    const gTail = merge([solid(new THREE.TubeGeometry(curve, 14, 0.008, 5), fur), dabs(tl)]);
    const b = B.b = batch([gBody, gHead, gLimb, gTail], 7, paint({ glow: 0.46, rough: 0.9 }));
    B.body = b.add(0); B.head = b.add(1); B.limbs = [0, 1, 2, 3].map(() => b.add(2)); B.tail = b.add(3); group.add(b.mesh);
    B.bones = new Bones(); const M = () => new THREE.Matrix4(); B.M = { root: M(), part: M() };
    B.yaw = E.yaw; B.dist = 0; B.sit = 0; B.wake = Array.from({ length: 12 }, () => ({ x: E.x, z: E.z }));
    B.lawn = ['#8fae4e', '#c9cf6a', '#a9c25a', '#e3d27a', '#6f9a4c', '#d8c95e'].map(h => c(h, 0.25)); B.shade = ['#4d7a48', '#2e4060', '#3f6a58', '#5a4a7a'].map(h => c(h, 0.25)); B.lead = c('#7a2a20', 0.1);
  },

  pose(E, dt, k) {
    const B = E.build, b = B.b, bn = B.bones, M = B.M, t = E.t, calm = E.calm, lit = E.lit > 0.02, going = E.state === 'going', moving = E.v > 0.05;
    B.dist += E.v * dt;
    // In the lamp: side on to it and quite still, as he painted it. At rest: it sits, and looks about the room.
    if (lit && E.by) B.yaw += wrap(Math.atan2(E.by.x - E.x, E.by.z - E.z) + Math.PI / 2 - B.yaw) * Math.min(1, dt * 5); else B.yaw += wrap(E.yaw - B.yaw) * Math.min(1, dt * 10);
    B.sit += ((moving || lit || going ? 0 : 1) - B.sit) * Math.min(1, dt * 4); const s = sm(B.sit), still = lit || calm;
    const amp = moving ? Math.min(1, E.v / 0.8) : 0, phi = B.dist / (0.21 * K) * TAU, bound = calm ? 0 : amp;
    const y = (H - 0.022 * s + 0.028 * bound * (0.5 - 0.5 * Math.cos(phi))) * K, pitch = -0.9 * s + 0.2 * bound * Math.sin(phi);
    const yawL = B.yaw - E.yaw;      // (the body is the group's: only what it has turned from the way it goes)
    bn.set(M.root, 0, y, 0, E.yaw + yawL, pitch, 0, K); b.mat(B.body, M.root);
    bn.child(M.part, M.root, 0, 0.012, 0.082, still ? 0 : 0.55 * s * Math.sin(t * 0.8) + 0.1 * amp * Math.sin(phi), 0.78 * s - 0.1 * bound * Math.sin(phi), 0); b.mat(B.head, M.part);
    for (let q = 0; q < 4; q++) {
      const front = q < 2, sw = (calm ? 0.35 : 0.85) * amp * Math.sin(phi + (front ? 0.5 : Math.PI + 0.2)), p = front ? 0.9 * s + sw : -0.62 * s + sw;
      bn.child(M.part, M.root, SH[q][0], SH[q][1], SH[q][2], 0, p, (q % 2 ? 1 : -1) * 0.12 * s); b.mat(B.limbs[q], M.part);
    }
    bn.child(M.part, M.root, 0, 0.018, -0.084, still ? 0 : 0.28 * Math.sin(t * 2.2) * (0.3 + 0.7 * s), 0.8 * s + 0.12 * bound * Math.sin(phi + 1), 0); b.mat(B.tail, M.part);
    if (!E.marks || going) return;
    // the round of sunlit grass it stands on: the dots of the island's lawn, only where it is (blue where its shadow falls)
    const G0 = LAWN_G, cx = Math.round(E.x / G0), cz = Math.round(E.z / G0), n = Math.ceil(LAWN_R / G0), sx = -0.11, sz = 0.07;
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
      const h = hash(cx + i, cz + j), wx = (cx + i + (h - 0.5) * 0.7) * G0, wz = (cz + j + (hash(cz + j, cx + i) - 0.5) * 0.7) * G0, d = Math.hypot(wx - E.x, wz - E.z); if (d > LAWN_R) continue;
      const e = sm((LAWN_R - d) / 0.22) * (0.75 + 0.25 * h), sh = Math.hypot(wx - E.x - sx, wz - E.z - sz) < 0.17;
      _p.set(wx, E.y + 0.011 + h * 0.002, wz); E.marks.put(_p, _n, _t, 0.058 * e, 0.058 * e, sh ? B.shade[Math.floor(h * 97) % 4] : B.lawn[Math.floor(h * 97) % 6]);
    }
    // its lead, dragging after it
    const w0 = B.wake[0]; if (Math.hypot(E.x - w0.x, E.z - w0.z) > 0.055) { const last = B.wake.pop(); last.x = E.x; last.z = E.z; B.wake.unshift(last); }
    for (let i = 1; i < B.wake.length - 1; i++) {
      const a = B.wake[i], c2 = B.wake[i + 1], dx = a.x - c2.x, dz = a.z - c2.z, dl = Math.hypot(dx, dz); if (dl < 0.02) continue;
      const wv = Math.sin(i * 1.3) * 0.012; _p.set((a.x + c2.x) / 2 + dz / dl * wv, E.y + 0.015, (a.z + c2.z) / 2 - dx / dl * wv); _t.set(dx / dl, 0, dz / dl);
      E.marks.put(_p, _n, _t, 0.011, dl * 1.15, B.lead);
    }
    _t.set(1, 0, 0);
  },
  onPlace(E) { const B = E.build; if (B && B.wake) for (const w of B.wake) { w.x = E.x; w.z = E.z; } },

  // small hand prints, in the violet of his shadows
  trail() { return { color: '#4a3a5e', size: 0.02, long: 1.3, every: 0.17, life: 9, side: 0.04, turn: (Math.random() - 0.5) * 0.4 }; },

  // its chatter, small and quick
  voice(E, k, vol) { if (E.lit > 0.02) return; for (let i = 0; i < 3; i++) k.synth.note(1300 + Math.random() * 500, 0.06, { type: 'square', vol: 0.012 * vol, at: i * 0.08 }); },
});
