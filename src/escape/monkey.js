// NOT IN THE GAME: nothing imports this file (src/escapes.js says why). Seurat's monkey gets out by the chase in
// src/l2-grandejatte.js now, which was rewritten after this was: the gallery's free(), at, 'leaving' and 'out' that this
// asks for are gone. Registered as it stands it is a second monkey in the building (measured with ?escout: this one
// loose in 240 while the gallery's own sat under its bench and ran, and this one's "back on its lead" and the secret's
// callout given for herding it home, in the middle of the chase). Kept for its Seurat-dot body, should the two ever be made one.
//
// Out of Seurat's A Sunday on La Grande Jatte (Gallery 240): the monkey, off its lead.
// It is one thing with what was there (src/l2-grandejatte.js, the old secret): when the picture has been looked at and the
// monkey slips its lead, the monkey that drops from under the frame IS this one, in Seurat's dots, and the gallery's own
// line is the one line said. It scampers to a corner of the gallery and hides there, as it always did. Driven up to, it
// goes home ahead of the toy, and that is the old secret found. Left alone (the toy drives out of the gallery), it comes
// out of its corner and is loose in the building, on a small round of the island's sunlit grass that goes where it goes,
// its lead trailing behind it. In a robot's lamp it stands quite still, side on, tail curled up, as he painted it.
//
// The monkey on the lead is also the hidden passage's clue (src/secretclue.js), and that is not touched: while it is the
// clue and the passage is not yet found, the monkey may not be out at all (may(), which nothing overrides), exactly as
// the gallery's own monkey stays on its lead then. The picture, the clue's place on it and the tap are none of this file's.
//
// One draw call: body, head, four limbs and tail (one BatchedMesh), every form under a coat of dots.

import * as THREE from 'three';
import { escapeFor, paint, ball, ballDabs, dabs, merge, solid, batch, col, TAU, CELL } from './kit.js';
import { rng } from '../paintlife.js';
import { features } from '../features.js';
import { nearestOpen } from '../guardplan.js';
import { Bones } from '../life/stagecraft.js';
import { LOWMEM as LOW } from '../budget.js';

const K = 2.3, H = 0.127;                         // its size on the floor (a big capuchin: 0.4 m of body); its back's height standing
const WALK = 1.0, DASH = 2.6;                     // wandering; and off to its corner
const SH = [[0.03, -0.012, 0.06], [-0.03, -0.012, 0.06], [0.032, -0.012, -0.06], [-0.032, -0.012, -0.06]];
const LAWN_R = 0.6, LAWN_G = LOW ? 0.15 : 0.092, LEAD = 22, LINK = 0.06;
const GRASS = ['#8fae4e', '#c9cf6a', '#a9c25a', '#e3d27a', '#6f9a4c', '#d8c95e'], COAT = ['#6b4426', '#8a5a30', '#c98a4a', '#7a4e2c'], VIOLET = ['#3a2c4a', '#2e4060', '#5a4a7a', '#4a3a5e'];
const coil = (E, w) => w.forEach((q, i) => { const r = 0.1 + 0.013 * i, a = E.yaw + 2.2 + i * 0.5; q.x = E.x + Math.sin(a) * r; q.z = E.z + Math.cos(a) * r; });      // its lead, lying by it
const gj = () => features.find(f => f.id === 'l2-grande-jatte');
const sm = x => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
const _p = new THREE.Vector3(), _n = new THREE.Vector3(0, 1, 0), _t = new THREE.Vector3(1, 0, 0), _q = new THREE.Vector3(), _u = new THREE.Vector3();

escapeFor(27992, {
  name: 'the monkey', tag: 'MONKEY',
  back: 'The monkey is back on the island, and on its lead.',
  count: 1, speed: WALK, herd: 1.7, radius: 0.62, height: 0.74, need: 0.42, rest: [4, 9], react: 'still', hold: 2.0, chips: 30, stroke: 0.62, strokeLong: 1.0,
  colors: ['#6b4426', '#8a5a30', '#c98a4a', '#3a2c4a', '#2e4060', '#8fae4e', '#c9cf6a', '#4d7a48', '#e3d27a'],
  // Seurat's dot: round, and no larger than the dots of its coat
  mark: { cell: CELL.dot, w: [0.028, 0.04], long: [1, 1], turn: 0, jit: 0 },
  parts(E) { const B = E.build, yw = B.yaw == null ? E.yaw : B.yaw, sx = Math.sin(yw), cz = Math.cos(yw); return [{ x: E.x, y: E.y + H * K, z: E.z, r: 0.085 * K, ry: 0.07 * K }, { x: E.x - sx * 0.1 * K, y: E.y + (H + 0.09) * K, z: E.z - cz * 0.1 * K, r: 0.03 * K, ry: 0.085 * K }]; },

  // While it is the hidden passage's clue it stays on its lead: the gallery's own rule (its free()), asked of the gallery.
  may(E, k) { const f = gj(); return !f || !f.art || typeof f.free !== 'function' || f.free(k) === true; },

  // How it gets out: it slips its lead when the picture has been looked at (the gallery's own moment, and its own rule):
  // from there it is this monkey. (Should the gallery's monkey have got to its corner without us, because six things were
  // out already: the old way, it comes out when the toy has left the gallery.)
  watch(E, dt, k) {
    const f = gj(); if (!f || !f.art) return false;
    if (f.state === 'leaving') return true;
    if (f.state !== 'out' || !f.at || k.G.state !== 'play') { E.w = 0; return false; }
    if (k.G.roomId && k.G.roomId !== f.roomId) { if ((E.w = (E.w || 0) + dt) > 2.5) { E.w = 0; return true; } } else E.w = 0;
    return false;
  },
  onOut(E, k) {
    const f = gj(); E.hid = false; E.cornered = false; E.said = false; E.tries = 0; E.w = 0; E.spec.speed = WALK;
    if (!f || !f.art) return;
    const a = f.art, g = k.G.escapes && k.G.escapes._grid(E);
    const open = (x, z, need) => { const c = g ? nearestOpen(g, x, z, need, 3) : -1; return c >= 0 ? { x: g.X0 + ((c % g.nx) + 0.5) * g.C, z: g.Z0 + (Math.floor(c / g.nx) + 0.5) * g.C } : null; };
    if (f.state === 'leaving' && f.from && f.at) {
      // under its own place in the picture, at the wall's foot; and the corner the gallery chose for it
      const q = open(f.from.x + a.nx * 0.36, f.from.z + a.nz * 0.36, 0.3); if (q) { E.x = q.x; E.z = q.z; }
      E.corner = open(f.at.x, f.at.z, 0.44) || { x: f.at.x, z: f.at.z }; E.hid = true; E.rest = 30;
    } else if (f.state === 'out' && f.at) { const q = open(f.at.x, f.at.z, 0.5); E.x = q ? q.x : f.at.x; E.z = q ? q.z : f.at.z; E.emerge = 0.7; }      // (from the corner it was hiding in)
    if (f.monkey) { f.monkey.visible = false; f.monkey.scale.setScalar(1); }
    f.state = 'back';      // (the gallery's own monkey is this one now: it says and does no more till this one is home)
  },
  // Hiding: off to its corner, and there it stays while the toy is in the gallery. (Driven up to, it is led home like
  // anything else, and that is the finding of it.)
  helper(E, dt, k, F) {
    if (!E.hid) return;
    const f = gj(), c = E.corner; if (!f || !c || E.led > 0) { E.hid = false; E.spec.speed = WALK; return; }
    if (!E.cornered) {
      if (!E.said && E.t > 4.5) { E.said = true; k.say('The monkey has slipped its lead. It is in here somewhere.', 5); }
      if (Math.hypot(E.x - c.x, E.z - c.z) < 0.4 || E.tries > 4) { E.cornered = true; E.spec.speed = WALK; E.pn = 0; if (!E.said) { E.said = true; k.say('The monkey has slipped its lead. It is in here somewhere.', 5); } }
      else if (E.emerge > 0.75 && !(E.pn > 1 && E.pk < E.pn)) { E.spec.speed = DASH; if (!F._to(E, c.x, c.z, 0.36)) E.tries++; }
      E.rest = Math.max(E.rest, 2); return;
    }
    const here = !k.G.roomId || k.G.roomId === f.roomId;
    if (here || k.G.state !== 'play') { E.w = 0; E.rest = Math.max(E.rest, 3); E.pn = 0; }
    else if ((E.w += dt) > 2.5) { E.hid = false; E.rest = 0.3; }      // (left alone: it comes out, and is loose in the building)
  },
  onHome(E, how, k) {
    E.hid = false; E.spec.speed = WALK;
    const f = gj(); if (f && f.art && f.state === 'back') { f.state = 'home'; f.look = 0; }
    if (how === 'toy' && k.find && k.find('monkey') && typeof k.callout === 'function') k.callout('THE MONKEY');
  },

  async build(E, L, { group, pal }) {
    const B = E.build, R = B.R = rng(27992), c = (h, k = 0.2) => col(pal, h, k);
    const fur = c('#4a3328').getHex(), light = ['#c98a4a', '#b0703a', '#d9a860', '#8a5a30'].map(h => c(h)), mid = ['#6b4426', '#7a4e2c', '#5a3a26', '#8a5a30'].map(h => c(h)), dark = ['#3a2c4a', '#2e4060', '#3c2a3a', '#4a3328'].map(h => c(h));
    const pick = (nx, ny, nz, r) => { const q = ny + (r() - 0.5) * 0.5; return (q > 0.3 ? light : q < -0.25 ? dark : mid)[Math.floor(r() * 4)]; };
    // (his dots are the same size on a big monkey as on a small one: there are more of them)
    const dots = (C, Rr, n, s = [0.0125, 0.0175]) => ballDabs(C, Rr, n, pick, s, R, { long: 1, out: 1.03, cell: CELL.dot });
    const red = c('#c0392b', 0.1).getHex(), face = c('#b89878').getHex();
    const collar = new THREE.TorusGeometry(0.031, 0.006, 5, 12); collar.rotateX(Math.PI / 2 - 0.5); collar.translate(0, 0.03, 0.078);
    const gBody = merge([ball([0, 0, 0], [0.04, 0.043, 0.09], fur, 10), dots([0, 0, 0], [0.04, 0.043, 0.09], LOW ? 100 : 176), solid(collar, red)]);
    const gHead = merge([ball([0, 0.03, 0.03], [0.036, 0.036, 0.038], fur, 10), ball([0, 0.018, 0.062], [0.019, 0.016, 0.02], face, 8), ball([0.035, 0.042, 0.018], [0.006, 0.013, 0.012], face, 6), ball([-0.035, 0.042, 0.018], [0.006, 0.013, 0.012], face, 6),
      ball([0.015, 0.036, 0.062], [0.005, 0.005, 0.004], 0x1a1210, 6), ball([-0.015, 0.036, 0.062], [0.005, 0.005, 0.004], 0x1a1210, 6), dots([0, 0.032, 0.022], [0.037, 0.037, 0.036], LOW ? 44 : 78, [0.0105, 0.0145])]);
    const limb = new THREE.CylinderGeometry(0.012, 0.009, 0.105, 6); limb.translate(0, -0.0525, 0);
    const gLimb = merge([solid(limb, fur), ball([0, -0.108, 0.008], [0.011, 0.008, 0.017], fur, 6), dots([0, -0.055, 0], [0.013, 0.055, 0.013], LOW ? 14 : 22, [0.0095, 0.0125])]);
    // its tail, carried up and curled over at the tip, as he painted it
    const curve = new THREE.CatmullRomCurve3([[0, 0, 0], [0, 0.015, -0.052], [0, 0.072, -0.084], [0, 0.132, -0.07], [0, 0.158, -0.03], [0, 0.134, -0.001], [0, 0.108, -0.02]].map(p => new THREE.Vector3(...p)));
    const TN = LOW ? 24 : 38, tl = []; for (let i = 0; i < TN; i++) { const u = (i + 0.5) / TN, p = curve.getPoint(u), tg = curve.getTangent(u), a = R() * TAU, n = new THREE.Vector3(Math.cos(a), 0, 0).addScaledVector(new THREE.Vector3(0, 1, 0).cross(tg).lengthSq() > 0.01 ? new THREE.Vector3(0, tg.z, -tg.y).normalize() : new THREE.Vector3(0, 1, 0), Math.sin(a)).normalize(); tl.push({ p: p.addScaledVector(n, 0.0085), n, s: 0.0105 + R() * 0.0035, l: 1, a: 0, c: pick(n.x, n.y, n.z, R).clone() }); }
    const gTail = merge([solid(new THREE.TubeGeometry(curve, 18, 0.0072, 5), fur), dabs(tl, 0.003, CELL.dot)]);
    const b = B.b = batch([gBody, gHead, gLimb, gTail], 7, paint({ glow: 0.46, rough: 0.9 }));
    B.body = b.add(0); B.head = b.add(1); B.limbs = [0, 1, 2, 3].map(() => b.add(2)); B.tail = b.add(3); group.add(b.mesh);
    B.bones = new Bones(); const M = () => new THREE.Matrix4(); B.M = { root: M(), part: M() };
    B.yaw = E.yaw; B.dist = 0; B.sit = 0; B.wake = Array.from({ length: LEAD }, () => ({ x: E.x, z: E.z })); coil(E, B.wake);
    B.lawn = GRASS.map(h => c(h, 0.25)); B.shade = ['#4d7a48', '#2e4060', '#3f6a58', '#5a4a7a'].map(h => c(h, 0.25)); B.lead = c('#a8342a', 0.1);
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
    const G0 = LAWN_G, cx = Math.round(E.x / G0), cz = Math.round(E.z / G0), n = Math.ceil(LAWN_R / G0), sx = -0.15, sz = 0.09, grow = sm(E.emerge);
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
      const h = hash(cx + i, cz + j), wx = (cx + i + (h - 0.5) * 0.8) * G0, wz = (cz + j + (hash(cz + j, cx + i) - 0.5) * 0.8) * G0, d = Math.hypot(wx - E.x, wz - E.z); if (d > LAWN_R * grow) continue;
      const e = sm((LAWN_R * grow - d) / 0.24) * (0.72 + 0.28 * h), sh = Math.hypot(wx - E.x - sx, wz - E.z - sz) < 0.22;
      _p.set(wx, E.y + 0.017 + h * 0.002, wz); E.marks.put(_p, _n, _t, 0.064 * e, 0.064 * e, sh ? B.shade[Math.floor(h * 97) % 4] : B.lawn[Math.floor(h * 97) % 6], CELL.dot);
    }
    // its lead: from its collar down to the floor, and dragging after it, a loop for a hand at the end
    const W = B.wake, w0 = W[0]; if (Math.hypot(E.x - w0.x, E.z - w0.z) > LINK) { const last = W.pop(); last.x = E.x; last.z = E.z; W.unshift(last); }
    if (E.emerge >= 1) {
      const fy = E.y + 0.022;
      _q.set(0, 0.0, 0.074).applyMatrix4(M.root); _q.x += E.x; _q.y += E.y; _q.z += E.z; _u.set(W[2].x, fy, W[2].z).sub(_q); const hl = _u.length();
      if (hl > 0.03) { _u.multiplyScalar(1 / hl); _p.copy(_q).addScaledVector(_u, hl / 2); _n.set(0, 1, 0).addScaledVector(_u, -_u.y); if (_n.lengthSq() < 1e-4) _n.set(1, 0, 0); _n.normalize(); E.marks.put(_p, _n, _u, 0.016, hl, B.lead, CELL.solid); _n.set(0, 1, 0); }
      for (let i = 2; i < W.length - 1; i++) {
        const a = W[i], c2 = W[i + 1], dx = a.x - c2.x, dz = a.z - c2.z, dl = Math.hypot(dx, dz); if (dl < 0.02) continue;
        const wv = Math.sin(i * 1.3) * 0.014; _p.set((a.x + c2.x) / 2 + dz / dl * wv, fy, (a.z + c2.z) / 2 - dx / dl * wv); _t.set(dx / dl, 0, dz / dl);
        E.marks.put(_p, _n, _t, 0.016, dl * 1.2, B.lead, CELL.solid);
      }
      const e = W[W.length - 1], e1 = W[W.length - 2]; let ex = e.x - e1.x, ez = e.z - e1.z; const el = Math.hypot(ex, ez) || 1; ex /= el; ez /= el;
      for (let i = 0; i < 8; i++) { const an = i / 8 * TAU, ox = Math.cos(an) * 0.05, oz = Math.sin(an) * 0.05; _p.set(e.x + ex * 0.05 + ox, fy, e.z + ez * 0.05 + oz); _t.set(-Math.sin(an), 0, Math.cos(an)); E.marks.put(_p, _n, _t, 0.014, 0.044, B.lead, CELL.solid); }
    }
    _t.set(1, 0, 0);
  },
  onPlace(E) { const B = E.build; if (B && B.wake) coil(E, B.wake); },

  // what it leaves behind it: his dots, close-set, going out one by one. The lawn's greens and yellows, its own browns,
  // the violets of his shadows.
  trail(E) {
    const q = Math.random(), set = q < 0.6 ? GRASS : q < 0.8 ? COAT : VIOLET;
    return { color: set[Math.floor(Math.random() * set.length)], size: 0.036 + Math.random() * 0.02, long: 1, cell: CELL.dot, every: (LOW ? 0.045 : 0.02) * Math.max(1, E.v / WALK), life: 5.5, dx: (Math.random() - 0.5) * 0.36, dz: (Math.random() - 0.5) * 0.36 };
  },

  // its chatter, small and quick
  voice(E, k, vol) { if (E.lit > 0.02) return; for (let i = 0; i < 3; i++) k.synth.note(1300 + Math.random() * 500, 0.06, { type: 'square', vol: 0.012 * vol, at: i * 0.08 }); },
});
