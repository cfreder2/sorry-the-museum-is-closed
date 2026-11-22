// The sledding hill (features.js), in the south-west quarter of Butler Field between the cross path and the band shell.
// A real hill of snow, twelve metres of it, the kind every Chicago park piles up: a flat top with the Tuxedo Shop on it
// (where the penguins live) and a string of lights round it, steps up the steep north face, a packed path up the west
// flank for anything on wheels, bare trees and buried bushes on its sides, drifts the wind has laid on it, sled tracks
// down every face, and sleds left lying about.
//
// The sled run: a gate at the top, along the ridge, a banked hairpin right, a quarter left onto the south face, and the
// big jump: a kicker at the brow throws you out over the steepest face on the hill, which is its landing. Then a wide
// banked sweeper, the tunnel through a big drift and the finish, with a snow fence across the run-out.
// Bamboo stakes and marker poles line it: they bend when hit and spring back. The clock starts at the gate; under GOOD
// seconds is one secret, beating a penguin to the bottom another: as you sit in the sled (and now and then on their
// own) a penguin comes out of the shop, flops on its belly and races you down, over the jump and all.
//
// The ground is one heightfield (sledland.js): the car drives on exactly the triangles that are drawn. The hill is one
// mesh, the props another, the bulbs one instanced mesh, the wires one more; the poles and the penguins are instanced.
import * as THREE from 'three';
import { feature } from './features.js';
import { groundAt, confine, GRAVITY } from './plan.js';
import { buildLand, TOP, RUN_W, RUN_LIP, PATH_W, FINISH_S, TUNNEL, KICKERS, STAIR } from './sledland.js';
import { Bulbs, Wire, canvasTex, C, TAU } from './glowkit.js';
import { fitText, twoFaced, SERIF } from './textures.js';

const GOOD = 14;                                // seconds, gate to finish
const FOOT_MM = 0.008;                            // the hill is drawn where it stands more than this over the field (sledhill-ground)
const DECK = 0.086;                               // the top of the sled's deck over the snow: the toy sits on it
const AREA = { x0: 298, x1: 388, z0: 108, z1: 218 };

const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const col = hex => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const SNOW = [0.86, 0.89, 0.96];

// Everything solid is built into one of these and drawn as one mesh: vertex colours, and lit a little from within by
// its own colour (as everything out of doors is here, so that it reads at night).
class Parts {
  constructor() { this.g = []; }
  // `snowy`: faces turned up further than this get snow on them instead of their colour.
  add(geo, c, M, snowy = 0) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone(); if (M) g.applyMatrix4(M);
    if (!g.attributes.normal) g.computeVertexNormals();
    const n = g.attributes.position.count, cc = new Float32Array(n * 3), N = g.attributes.normal;
    for (let i = 0; i < n; i++) { const s = snowy && N.getY(i) > snowy; cc.set(s ? SNOW : c, i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); this.g.push(g); return g;
  }
  box(w, h, d, c, M, snowy) { return this.add(new THREE.BoxGeometry(w, h, d), c, M, snowy); }
  mesh(glow = 0.22) {
    let n = 0; for (const g of this.g) n += g.attributes.position.count;
    const P = new Float32Array(n * 3), Nn = new Float32Array(n * 3), Cc = new Float32Array(n * 3); let o = 0;
    for (const g of this.g) { P.set(g.attributes.position.array, o * 3); Nn.set(g.attributes.normal.array, o * 3); Cc.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); geo.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, emissive: new THREE.Color(glow, glow, glow * 1.15) });
    m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vColor;'); };
    const mesh = new THREE.Mesh(geo, m); mesh.matrixAutoUpdate = false; return mesh;
  }
}
const M4 = (x, y, z, ry = 0, rx = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(s, s, s));
// A round rod from a to b (radius r0 at a, r1 at b).
function rod(P, a, b, r0, r1, c, snowy = 0, sides = 6) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length(); if (len < 1e-4) return;
  const g = new THREE.CylinderGeometry(r1, r0, len, sides, 1, true); g.translate(0, len / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  P.add(g, c, new THREE.Matrix4().compose(a, q, new THREE.Vector3(1, 1, 1)), snowy);
}

feature({
  id: 'sledding',
  secrets: [['sledding', 'Sledding'], ['penguinrace', 'Beat a penguin down the hill']],
  init(k) {
    if (!k.plan.lakefront) return;
    const t0 = performance.now();
    const L = this.L = buildLand(), hAt = L.heightAt;
    this.k = k; this.t = 0;
    const g = this.g = new THREE.Group(); g.name = 'sledhill'; k.group.add(g);
    const O = this.O = k.plan.obstacles;
    // The ground, for the car: one surface over the whole hill whose height is the heightfield's, and a hill (it pulls
    // you down its slopes, and there is no getting under it). In plan.hills too, so that tyre tracks follow it.
    const S = this.surf = { skin: 'snow', hill: true, axis: 'hill', fn: hAt, x0: L.x0, x1: L.x1, z0: L.z0, z1: L.z1, h0: 0, h1: L.top, thick: 0, cx: (L.x0 + L.x1) / 2, cz: (L.z0 + L.z1) / 2, rx: (L.x1 - L.x0) / 2, rz: (L.z1 - L.z0) / 2, H: L.top, sled: true };
    k.plan.surfaces.push(S); if (k.plan.hills) k.plan.hills.push(S);
    // The top of the drift over the tunnel: a slab to drive across, with the bore under it.
    const T = L.tun, ft = T.floorAt;
    this.roof = { skin: 'snow', x0: T.x0, x1: T.x1, z0: T.z - TUNNEL.half, z1: T.z + TUNNEL.half, axis: null, h0: T.top, h1: T.top, thick: TUNNEL.thick, sled: true };
    k.plan.surfaces.push(this.roof); if (k.plan.slabs) k.plan.slabs.push(this.roof);

    g.add(this._ground(k));
    const P = new Parts(), B = this.bulbs = new Bulbs(), Wr = new Wire(0.012);
    this._tunnel(P, B, k);
    this._summit(P, B, Wr, k);
    this._stairs(P);
    this._path(P, B);
    this._gates(P, B, Wr, k);
    this._nature(P);
    this._sleds(P);
    g.add(P.mesh());
    B.build(g); const wm = Wr.mesh(); if (wm) g.add(wm);
    this._poleMeshes(g);
    this._penguins(k);

    // The clock: from the gate on the top to the line at the bottom, along the run.
    const run = L.run, at = s => run[Math.min(run.length - 1, Math.round(s / 0.25))];
    const g0 = at(1.2), fin = at(FINISH_S), ew = Math.abs(fin.tx) > 0.7, fs = ew ? Math.sign(fin.tx) : Math.sign(fin.tz);
    this.at = { x: TOP.x + 2, y: hAt(TOP.x + 2, TOP.z), z: TOP.z };
    this.timer = k.timer({
      id: 'sledding', name: 'SLED RUN', limit: 60, min: 4,
      start: { x0: TOP.x - 1, x1: g0.x, z0: g0.z - 3, z1: g0.z + 3, y0: L.top - 0.8 },
      // (the line across the run at the finish arch, and five metres on past it)
      finish: ew ? { x0: Math.min(fin.x, fin.x + fs * 5), x1: Math.max(fin.x, fin.x + fs * 5), z0: fin.z - RUN_W - 1.6, z1: fin.z + RUN_W + 1.6 }
        : { x0: fin.x - RUN_W - 1.6, x1: fin.x + RUN_W + 1.6, z0: Math.min(fin.z, fin.z + fs * 5), z1: Math.max(fin.z, fin.z + fs * 5) },
      inside: p => { const n = L.node(p.x, p.z); return n >= 0 && L.along[n] > 0.6; },      // (on the run, or close beside it, and past the gate)
      onStart: () => k.synth.chime([523, 784], { gap: 0.1, dur: 0.5 }),
      onFinish: t => {
        this.finished = true; const r = this.racer, beat = r && r.state === 'slide' && r.s < FINISH_S;
        if (r && r.state === 'slide') r.race = beat ? 'lost' : null;
        if (beat) { if (k.find('penguinrace')) k.callout('BEAT THE PENGUIN'); else k.say('You beat the penguin.', 2.5); k.tune('E5 E5 E5:2 | E5 E5 E5:2 | E5 G5 C5:1.5 D5:.5 | E5:4', { bpm: 190, type: 'triangle', vol: 0.06, at: 0.3 }); }
        if (t < GOOD) { if (k.find('sledding')) k.callout('SLEDDING'); k.synth.chime([523, 659, 784, 1047]); }
        else if (!beat) k.say(`${t.toFixed(1)} s. Under ${GOOD} and the hill is yours.`, 3.5);
      },
    });
    // The sled waiting at the gate, and the one that is ridden (and left at the bottom until the next go).
    this.gate = { x: g0.x - g0.tx * 1.6, z: g0.z - g0.tz * 1.6, yaw: Math.atan2(g0.tx, g0.tz) }; this.gate.y = hAt(this.gate.x, this.gate.z);
    this.waiting = this._toySled(); this.ridden = this._toySled(); this.ridden.visible = false; g.add(this.waiting, this.ridden);
    this._poseSled(this.waiting, this.gate.x, this.gate.z, this.gate.yaw, 0);
    { const gt = this.gate, hx = Math.abs(Math.sin(gt.yaw)) * 0.44 + Math.abs(Math.cos(gt.yaw)) * 0.25, hz = Math.abs(Math.cos(gt.yaw)) * 0.44 + Math.abs(Math.sin(gt.yaw)) * 0.25; this.gateSled = { x0: gt.x - hx, x1: gt.x + hx, z0: gt.z - hz, z1: gt.z + hz, y0: gt.y - 0.5, y1: gt.y + 0.12, gate: { off: false } }; this.O.push(this.gateSled); }      // (the waiting sled is in the way, until it is taken)
    this.ride = (dt, inp) => this._ride(dt, inp);
    this.built = performance.now() - t0;
  },

  // ============================================================ the sled
  // A toy's sled, the old steel-runner kind: two runners curled up and back over at the front, knees up to a deck of
  // five long slats (their noses painted red), cross bars under it, a red steering bar across the front and a rope loop
  // to pull it by. It is made so that the toy sits on the deck with a wheel's width to spare each side (the sleds lying
  // about the hill are people's).
  _toySled() {
    const P = new Parts(), wood = col(0xc28a50), dark = col(0x70462a), steel = col(0x4a515c), red = col(0xc2302a), rope = col(0xe8d8b0), V = (x, y, z) => new THREE.Vector3(x, y, z);
    const tube = (pts, r, c, n = 40, sides = 5) => P.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, r, sides, false), c);
    for (const sd of [-1, 1]) {
      const x = sd * 0.17, pts = [V(x, 0.026, -0.45), V(x, 0.012, -0.4), V(x, 0.009, -0.3)];
      for (let z = -0.18; z < 0.33; z += 0.12) pts.push(V(x, 0.009, z));
      for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + i / 12 * Math.PI * 1.4, R = 0.068; pts.push(V(x, 0.077 + Math.sin(a) * R, 0.34 + Math.cos(a) * R)); }
      tube(pts, 0.008, steel, 56);
      for (const z of [-0.33, -0.07, 0.19]) P.box(0.012, 0.052, 0.026, steel, M4(x, 0.04, z));                        // the knees
    }
    for (const z of [-0.33, -0.07, 0.19]) P.box(0.42, 0.012, 0.034, dark, M4(0, 0.071, z));                             // cross bars
    for (let i = -2; i <= 2; i++) {                                                                                    // the deck
      P.box(0.07, 0.01, 0.6, wood, M4(i * 0.082, 0.081, -0.13));
      P.box(0.07, 0.01, 0.07, red, M4(i * 0.082, 0.081, 0.205));
    }
    P.box(0.5, 0.02, 0.042, red, M4(0, 0.095, 0.27));                                                                   // the steering bar
    for (const sd of [-1, 1]) P.add(new THREE.SphereGeometry(0.014, 8, 6), dark, M4(sd * 0.25, 0.095, 0.27));
    tube([V(-0.245, 0.095, 0.29), V(-0.2, 0.07, 0.38), V(-0.1, 0.045, 0.45), V(0, 0.04, 0.47), V(0.1, 0.045, 0.45), V(0.2, 0.07, 0.38), V(0.245, 0.095, 0.29)], 0.0055, rope, 40, 4);
    const m = P.mesh(0.3), g = new THREE.Group(); m.matrixAutoUpdate = true; g.add(m); return g;
  },
  // Lie a sled on the snow at (x, z) facing yaw, leaning `roll` more than the slope does. Returns the slope's pitch and roll.
  _poseSled(o, x, z, yaw, roll, y) {
    const e = 0.25, base = y ?? this.L.heightAt(x, z), h = (a, b) => groundAt(this.k.plan, a, b, base + 0.2, 0.12);
    const gx = (h(x + e, z) - h(x - e, z)) / (2 * e), gz = (h(x, z + e) - h(x, z - e)) / (2 * e), fx = Math.sin(yaw), fz = Math.cos(yaw);
    const pitch = -Math.atan(gx * fx + gz * fz), side = -Math.atan(gx * -fz + gz * fx);
    o.position.set(x, y ?? h(x, z), z); o.rotation.set(pitch, yaw, side + roll, 'YXZ');
    return { pitch, side };
  },
  near(v, k) {
    if (!this.L || k.G.mode !== 'explore' || k.plan.racing) return null;
    if (this.riding) return { verb: 'OFF', hint: '', act: () => this._off('') };
    if (k.close(this.gate, 1.8, 1.2) && (v.kind === 'car' || v.kind === 'drone')) return { verb: 'SLED', hint: 'E to sled.', act: () => this._on() };
    return null;
  },
  // On: the toy sits in the sled at the gate, the engine is nothing to it, and the clock is ready.
  _on() {
    const k = this.k, v = k.v, G = k.G, gt = this.gate;
    this.ridden.visible = true; this.waiting.visible = false; this.gateSled.gate.off = true;
    this.S = { x: gt.x, z: gt.z, y: gt.y, vx: Math.sin(gt.yaw) * 1.6, vz: Math.cos(gt.yaw) * 1.6, vy: 0, yaw: gt.yaw, lean: 0, air: false, airT: 0, off: 0, knock: 0 };
    this.riding = v; this.finished = false; this.timer.cancel(); G.ride = this.ride;
    v.vel.set(0, 0, 0); if (v.kind === 'car') { v.air = false; v.rail = null; v.vy = 0; v.flip = v.spin = 0; }
    k.synth.note(330, 0.15, { type: 'triangle', vol: 0.05 });
    k.once('sled-lean', 'Lean to steer. Lean back to brake.', 4);
    this._launch(true);                    // and a penguin comes out of the shop to race you
  },
  // Off: beside the sled, on the toy's own wheels (or rotors) again. The sled stays where it stopped; a fresh one is at the gate.
  _off(why) {
    const k = this.k, G = k.G, v = this.riding, S = this.S; if (!v) return;
    this.riding = null; if (G.ride === this.ride) G.ride = null;
    if (this.timer.state === 'running') this.timer.cancel(why || null); else if (why) k.say(why, 2.5);
    this.waiting.visible = true; this.gateSled.gate.off = false;
    const rx = -Math.cos(S.yaw), rz = Math.sin(S.yaw), x = S.x + rx * 0.45, z = S.z + rz * 0.45;
    if (v === k.v) { if (v.kind === 'drone') v.place(x, z, S.yaw, groundAt(k.plan, x, z, S.y + 0.3) + 0.25); else v.place(x, z, S.yaw, S.y); }
    this._poseSled(this.ridden, S.x, S.z, S.yaw, 0, S.y);
  },
  // The ride. Gravity down the slope, packed snow under the runners (they hold sideways and slide forwards), the air off
  // a crest, and the rider: a lean turns the sled, a little late and more gently the slower it goes; leaning back drags
  // a heel; stopped dead, a shove gets it going. The engine does nothing. The ground is the hill's own (groundAt, so the
  // same surface the car drives on and the mesh is drawn from).
  tune: { fall: 1.9, snow: 0.09, air: 0.003, heel: 2.4, turn: 1.75, stop: 10 },      // gravity down the slope (a toy's sled is quick), snow, air, a dragged heel, the sharpest turn (rad/s), heels dug in past the line
  _ride(dt, inp) {
    const K = this.tune, k = this.k, v = this.riding, S = this.S, plan = k.plan, gAt = (x, z, y) => groundAt(plan, x, z, y, 0.12);
    if (!v || v !== k.v || k.G.held) { this._off(''); return; }
    const drone = v.kind === 'drone', want = Math.max(-1, Math.min(1, drone ? (inp.roll || 0) + (inp.yaw || 0) : inp.steer || 0));
    const fwd = drone ? inp.pitch || 0 : inp.throttle || 0, back = Math.max(0, -fwd), shove = Math.max(0, fwd);
    const p = this._p || (this._p = { x: 0, y: 0, z: 0 }), out = this._o || (this._o = { x: 0, y: 0, z: 0 });
    let bump = 0;
    for (let n = Math.max(1, Math.ceil(dt * 120)), i = 0; i < n; i++) {
      const h = dt / n, e = 0.25;
      S.lean += (want - S.lean) * Math.min(1, h * 5);
      if (!S.air) {
        const g0 = gAt(S.x, S.z, S.y + 0.2), gx = (gAt(S.x + e, S.z, g0 + 0.3) - gAt(S.x - e, S.z, g0 + 0.3)) / (2 * e), gz = (gAt(S.x, S.z + e, g0 + 0.3) - gAt(S.x, S.z - e, g0 + 0.3)) / (2 * e), q = 1 + gx * gx + gz * gz;
        const fx = Math.sin(S.yaw), fz = Math.cos(S.yaw), sp = Math.hypot(S.vx, S.vz);
        const vf = S.vx * fx + S.vz * fz; let vs = S.vx * -fz + S.vz * fx;
        // the turn: from the lean, and the sled swinging round to the way it is really going
        const turn = Math.min(K.turn, 0.3 + 0.105 * sp) * (this.finished ? 0.4 : 1);
        S.yaw -= (S.lean * turn + 2.4 * Math.atan2(vs, Math.max(1, Math.abs(vf)))) * h;
        const nfx = Math.sin(S.yaw), nfz = Math.cos(S.yaw);
        vs *= Math.exp(-3.2 * h);
        S.vx = nfx * vf - nfz * vs; S.vz = nfz * vf + nfx * vs;
        // gravity along the slope; snow and air against the way it is going, a heel dragged, a shove from standing
        S.vx -= K.fall * GRAVITY * gx / q * h; S.vz -= K.fall * GRAVITY * gz / q * h;
        const s2 = Math.hypot(S.vx, S.vz);
        if (s2 > 1e-3) { const drag = Math.min(s2, (K.snow / Math.sqrt(q) + K.air * s2 * s2 + back * K.heel + (this.finished ? K.stop : 0)) * h); S.vx -= S.vx / s2 * drag; S.vz -= S.vz / s2 * drag; }
        if (shove > 0.2 && s2 < 2 && !this.finished) { S.vx += nfx * 2.6 * shove * h; S.vz += nfz * 2.6 * shove * h; }
      } else S.yaw -= S.lean * 0.3 * h;
      // move, and off anything solid: the fence, a tree, the walls of the bore. It costs speed. (The stakes and marker
      // poles are not solid: they bend out of the way, and only nudge the sled.)
      S.x += S.vx * h; S.z += S.vz * h;
      this._poleHits(S, 0.38, 0.27);
      p.x = S.x; p.y = S.y; p.z = S.z;
      if (confine(plan, p, 0.2, false, out)) {
        const l = Math.hypot(out.x, out.z);
        if (l > 1e-6) { const nx = out.x / l, nz = out.z / l, into = S.vx * nx + S.vz * nz; if (into < 0) { S.vx -= nx * into * 1.3; S.vz -= nz * into * 1.3; S.vx *= 0.65; S.vz *= 0.65; bump = Math.max(bump, -into); S.knock = 0.35; } }
        S.x = p.x; S.z = p.z;
      }
      // up and down: on the snow while it is there; in the air when it falls away faster than gravity would take you
      const g1 = gAt(S.x, S.z, S.y + 0.2), yb = S.y + S.vy * h - 0.5 * GRAVITY * h * h;
      if (S.air) {
        S.vy -= GRAVITY * h; S.y += S.vy * h; S.airT += h;
        if (S.y <= g1) {
          // Down on the snow: what was going along it is kept, what was going into it is lost (so landing on a steep
          // face, as off the big kicker, turns the fall into speed down it); a hard one costs a little more, and shakes.
          const sx = (gAt(S.x + e, S.z, g1 + 0.3) - gAt(S.x - e, S.z, g1 + 0.3)) / (2 * e), sz = (gAt(S.x, S.z + e, g1 + 0.3) - gAt(S.x, S.z - e, g1 + 0.3)) / (2 * e);
          const nl = Math.hypot(sx, 1, sz), nx = -sx / nl, ny = 1 / nl, nz = -sz / nl, vn = S.vx * nx + S.vy * ny + S.vz * nz, impact = Math.max(0, -vn);
          S.vx -= vn * nx; S.vz -= vn * nz;
          if (impact > 4.5) { const f = Math.max(0.7, 1 - (impact - 4.5) * 0.05); S.vx *= f; S.vz *= f; }
          if (impact > 2.5) bump = Math.max(bump, impact * 0.4);
          if (impact > 1.5) { this.puffs.emit(S.x, g1 + 0.04, S.z, Math.min(16, 4 + impact * 2), { spread: 0.3, up: 0.4 + impact * 0.08, life: 0.7, out: 0.6 }); k.synth.noise(0.18, { vol: Math.min(0.06, 0.015 + impact * 0.007), lp: 900 }); }
          S.y = g1; S.vy = sx * S.vx + sz * S.vz; S.air = false; this.lastAir = S.airT; this.airs = (this.airs || 0) + 1;
          if (S.airT > 0.7) { this.bigAirs = (this.bigAirs || 0) + 1; if (!this.finished) k.once('sled-air', 'Big air.', 1.5); }
        }
      } else if (yb - g1 > 2 * h * h + 0.0002 && Math.hypot(S.vx, S.vz) > 3) { S.air = true; S.airT = 0; S.y = yb; S.vy -= GRAVITY * h; }
      else { S.vy = (g1 - S.y) / h; S.y = g1; }
    }
    S.knock = Math.max(0, S.knock - dt);
    // off the run (a moment in the air over its edge does not count): bailed
    const nd = this.L.node(S.x, S.z), on = (nd >= 0 && this.L.along[nd] > 0.3) || Math.hypot(S.x - TOP.x, S.z - TOP.z) < TOP.r + 0.8;
    S.off = on || S.air ? 0 : S.off + dt;
    if (S.off > 0.5) { this._off('Off the run, and off the sled.'); return; }
    // at the bottom, over the line and slowed (or stopped by the fence): off
    if (this.finished && Math.hypot(S.vx, S.vz) < 1.2) { this._off(''); return; }
    // the sled, and the toy sitting in it, leaning (and shaken when it hits something)
    const { pitch, side } = this._poseSled(this.ridden, S.x, S.z, S.yaw, 0, S.y), lean = S.lean * 0.28 + Math.sin(this.t * 40) * S.knock * 0.15;
    v.pos.set(0, DECK, 0).applyEuler(this.ridden.rotation).add(this.ridden.position); v.vel.set(S.vx, S.vy, S.vz); v.yaw = S.yaw; v.bump = bump; v.on = this.surf;      // (on the deck, as tilted as the sled)
    if (drone) { v.pitch = pitch; v.roll = side + lean; v.landed = true; v.pos.y += 0.03; }
    else { v.air = false; v.tilt = pitch; v.roll = side + lean; v.speed = 0; v.steer = 0; v.throttle = 0; v.launched = 0; v.landed = null; }
    v.sync(dt);
  },

  // ============================================================ the ground
  _ground(k) {
    const L = this.L, { x0, z0, step, nx, nz, W, h } = L, sx = nx * step, sz = nz * step;
    const idx = [], pos = [], uv = [], uv1 = [], map = new Int32Array(W * (nz + 1)).fill(-1);
    const vert = n => {
      if (map[n] >= 0) return map[n];
      const i = n % W, j = (n - i) / W, x = x0 + i * step, z = z0 + j * step, y = h[n];
      // (the field's snow is drawn 3 cm under the ground the wheels run on: at its foot the hill comes down to meet it;
      // the last few millimetres of it are let go under the field's snow, rather than lie a hair's breadth over it)
      map[n] = pos.length / 3; pos.push(x, y > FOOT_MM ? y + 0.002 - 0.032 * (1 - Math.min(1, y / 0.15)) : -0.06, z); uv.push(x / 6, z / 6); uv1.push(i / nx, j / nz);
      return map[n];
    };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
      if (Math.max(h[a], h[b], h[c], h[d]) <= FOOT_MM) continue;
      const A = vert(a), Bv = vert(b), Cv = vert(c), D = vert(d);
      idx.push(A, Cv, Bv, Bv, Cv, D);            // (the same two triangles heightAt interpolates on)
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('uv1', new THREE.Float32BufferAttribute(uv1, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const { macro, norm } = this._paint(sx, sz);
    const m = new THREE.Mesh(geo, this._snowMat(k, macro, norm)); m.name = 'sledhill-ground'; m.matrixAutoUpdate = false; return m;
  },
  // The field's own snow (museum.js), so that the foot of the hill cannot be told from the field, times a picture of the
  // whole hill (its light and shade, its marks) read off uv1: 1.25 x what the picture holds, so that 204 is unchanged.
  _snowMat(k, macro, norm, tint = 1) {
    const tile = k.museum.snowTex.clone(); tile.needsUpdate = true;
    const mat = new THREE.MeshStandardMaterial({ map: tile, roughness: 1, emissiveMap: tile, emissive: new THREE.Color(0.2, 0.25, 0.4).multiplyScalar(tint), emissiveIntensity: 0.55, color: new THREE.Color(tint, tint, tint) });
    if (macro) {
      mat.normalMap = norm; mat.normalScale = new THREE.Vector2(1, 1);
      mat.onBeforeCompile = sh => {
        sh.uniforms.uMacro = { value: macro };
        sh.fragmentShader = 'uniform sampler2D uMacro;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  { vec3 mc = texture2D(uMacro, vNormalMapUv).rgb * 1.25; totalEmissiveRadiance *= mc; diffuseColor.rgb *= mc; }');
      };
    }
    return mat;
  },

  // The marks on the snow, painted once over the whole hill: sled tracks down the run and down every open face,
  // footprints up the path, the wind's ripples, dye lines across the run at the gate, the kickers and the finish.
  // Two textures over the hill's own uv1: what it glows (the colour of it at night) and how it is dented (a normal map).
  _paint(sx, sz) {
    const L = this.L, TW = 1200, TH = Math.round(TW * sz / sx), px = x => (x - L.x0) / sx * TW, pz = z => (z - L.z0) / sz * TH, ppm = TW / sx;
    const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH; const c = cv.getContext('2d');
    const hv = document.createElement('canvas'); hv.width = TW; hv.height = TH; const d = hv.getContext('2d');
    const r = rng(77), kindAt = (x, z) => { const n = L.node(x, z); return n < 0 ? 0 : L.kind[n]; };
    d.fillStyle = 'rgb(128,128,128)'; d.fillRect(0, 0, TW, TH);
    // The light and shade of the hill, as the moon low over the lake (east, a little north) lights it: flat snow is left
    // as it is, faces to the moon brighter, faces away from it and the hollows darker. Worked out at each grid point,
    // then laid over the whole picture smoothly.
    { const { W, nz, h, step } = L, sc = document.createElement('canvas'); sc.width = W; sc.height = nz + 1; const sg = sc.getContext('2d'), im = sg.createImageData(W, nz + 1);
      const lx = 0.887, ly = 0.292, lz = -0.357;
      for (let j = 0; j <= nz; j++) for (let i = 0; i < W; i++) {
        const n = j * W + i, a = h[i > 0 ? n - 1 : n], b = h[i < W - 1 ? n + 1 : n], u = h[j > 0 ? n - W : n], v = h[j < nz ? n + W : n];
        const gx = (b - a) / (2 * step), gz = (v - u) / (2 * step), l = Math.hypot(gx, 1, gz), dot = (-gx * lx + ly - gz * lz) / l, lap = (a + b + u + v - 4 * h[n]) / (step * step);
        const f = Math.max(0.7, Math.min(1.24, 1 + 0.6 * (dot - ly) - Math.max(-0.04, Math.min(0.12, lap * 0.1)))), o = n * 4;
        im.data[o] = im.data[o + 1] = 204 * f; im.data[o + 2] = Math.min(255, 204 * f * 1.02); im.data[o + 3] = 255;
      }
      sg.putImageData(im, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(sc, 0, 0, TW, TH); }
    // wind-polished patches and soft blue shadows in the snow
    for (let i = 0; i < 260; i++) { const x = r() * TW, y = r() * TH, R = (2 + r() * 6) * ppm; const gr = c.createRadialGradient(x, y, 0, x, y, R); const a = 0.05 + r() * 0.08; gr.addColorStop(0, r() < 0.5 ? `rgba(230,236,245,${a * 1.5})` : `rgba(150,168,205,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(x - R, y - R, 2 * R, 2 * R); }
    // the ripples: short wavy crests across the wind (from the north-west), on the open snow only
    d.lineCap = 'round';
    for (let i = 0; i < 5200; i++) {
      const x = L.x0 + r() * sx, z = L.z0 + r() * sz, kd = kindAt(x, z); if (kd && kd !== 4 && kd !== 5) continue; if (L.heightAt(x, z) < 0.05) continue;
      const len = (0.6 + r() * 2.2), a = Math.PI * 0.25 + (r() - 0.5) * 0.5, ux = Math.cos(a), uz = Math.sin(a);
      const X = px(x), Y = pz(z);
      d.lineWidth = 1.6; d.strokeStyle = 'rgba(160,160,160,0.55)'; d.beginPath(); d.moveTo(X, Y); d.quadraticCurveTo(X + ux * len * ppm * 0.5 + uz * 3, Y + uz * len * ppm * 0.5 - ux * 3, X + ux * len * ppm, Y + uz * len * ppm); d.stroke();
      d.strokeStyle = 'rgba(100,100,100,0.45)'; d.beginPath(); d.moveTo(X + 1.5, Y + 1.5); d.quadraticCurveTo(X + ux * len * ppm * 0.5 + uz * 3 + 1.5, Y + uz * len * ppm * 0.5 - ux * 3 + 1.5, X + ux * len * ppm + 1.5, Y + uz * len * ppm + 1.5); d.stroke();
    }
    // a groove: dark in the height, a little darker and bluer in the glow
    const groove = (pts, wide, deep, tint = 0.32) => {
      if (pts.length < 2) return;
      const line = (ctx, w, style, off = 0) => { ctx.lineWidth = w; ctx.strokeStyle = style; ctx.beginPath(); ctx.moveTo(px(pts[0][0]) + off, pz(pts[0][1]) + off); for (const p of pts) ctx.lineTo(px(p[0]) + off, pz(p[1]) + off); ctx.stroke(); };
      line(d, Math.max(1.5, wide * ppm * 1.8), `rgba(150,150,150,${0.5 * deep})`, -1);
      line(d, Math.max(1, wide * ppm), `rgba(40,40,40,${deep})`);
      line(c, Math.max(1, wide * ppm), `rgba(120,138,180,${tint})`);
    };
    c.lineCap = c.lineJoin = d.lineJoin = 'round';
    // down the run: runners in pairs, riding high round the banks; and the wide smear of saucers
    const run = L.run;
    for (let t = 0; t < 16; t++) {
      const o0 = (r() - 0.5) * 2.6, ph = r() * TAU, sled = r() < 0.75, pts = [[], []];
      for (let i = 0; i < run.length; i += 2) {
        const p = run[i], nx = -p.tz, nz = p.tx, bank = (p.bank || 0) * -Math.sign(p.kk || 0) * 0.55;
        const o = Math.max(-RUN_W + 0.2, Math.min(RUN_W - 0.2, o0 + 0.35 * Math.sin(p.s * 0.09 + ph) + bank));
        if (sled) for (const [m, sd] of [[0, -0.2], [1, 0.2]]) pts[m].push([p.x + nx * (o + sd), p.z + nz * (o + sd)]);
        else pts[0].push([p.x + nx * o, p.z + nz * o]);
      }
      if (sled) { groove(pts[0], 0.05, 0.75); groove(pts[1], 0.05, 0.75); } else groove(pts[0], 0.55, 0.22, 0.12);
    }
    // down the open faces: from high on the hill straight down the fall line, until the snow runs out or meets the run
    const fall = (x, z, sled) => {
      const pts = []; let px0 = x, pz0 = z;
      for (let i = 0; i < 260; i++) {
        const e = 0.3, hh = L.heightAt(px0, pz0), gx = L.heightAt(px0 + e, pz0) - L.heightAt(px0 - e, pz0), gz = L.heightAt(px0, pz0 + e) - L.heightAt(px0, pz0 - e), gl = Math.hypot(gx, gz);
        if (hh < 0.08 || gl < 1e-3) break; const kd = kindAt(px0, pz0); if (kd && kd !== 5 && kd !== 4 && i > 2) break;
        pts.push([px0, pz0]); px0 -= gx / gl * 0.4 + (r() - 0.5) * 0.04; pz0 -= gz / gl * 0.4 + (r() - 0.5) * 0.04;
      }
      if (pts.length < 6) return;
      if (sled) { const off = (pp, s) => pp.map((p, i) => { const q = pp[Math.min(pp.length - 1, i + 1)], o = pp[Math.max(0, i - 1)], l = Math.hypot(q[0] - o[0], q[1] - o[1]) || 1; return [p[0] - (q[1] - o[1]) / l * s, p[1] + (q[0] - o[0]) / l * s]; }); groove(off(pts, 0.2), 0.05, 0.7); groove(off(pts, -0.2), 0.05, 0.7); }
      else groove(pts, 0.6, 0.25, 0.12);
    };
    for (let i = 0; i < 70; i++) {
      const a = r() * TAU, rr = TOP.r + 0.6 + r() * 5, x = TOP.x + Math.cos(a) * rr, z = TOP.z + Math.sin(a) * rr;
      fall(x, z, r() < 0.7);
    }
    for (let i = 0; i < 50; i++) { const x = L.x0 + r() * sx, z = L.z0 + r() * sz; if (L.heightAt(x, z) > 2 && !kindAt(x, z)) fall(x, z, r() < 0.6); }
    // up the path: footprints, two by two, and the odd set wandering off it
    const path = L.path;
    for (let w = 0; w < 7; w++) {
      const o0 = (r() - 0.5) * 1.8, ph = r() * TAU;
      for (let i = 0, f = 0; i < path.length; i += 1.4 + r() * 0.3, f++) {
        const p = path[Math.floor(i)], nx = -p.tz, nz = p.tx, o = o0 + 0.3 * Math.sin(p.s * 0.2 + ph) + (f % 2 ? 0.13 : -0.13);
        const x = p.x + nx * o, z = p.z + nz * o, a = Math.atan2(p.tz, p.tx);
        for (const [ctx, st] of [[d, 'rgba(60,60,60,0.7)'], [c, 'rgba(140,150,180,0.35)']]) { ctx.fillStyle = st; ctx.beginPath(); ctx.ellipse(px(x), pz(z), 0.15 * ppm, 0.055 * ppm, a, 0, TAU); ctx.fill(); }
      }
    }
    // dye: red across the run at the gate and at the finish, blue at the lip of each kicker
    const dye = (s, style, wide) => { const p = run[Math.min(run.length - 1, Math.round(s / 0.25))], nx = -p.tz, nz = p.tx; c.lineWidth = wide * ppm; c.strokeStyle = style; c.beginPath(); c.moveTo(px(p.x - nx * (RUN_W + 0.4)), pz(p.z - nz * (RUN_W + 0.4))); c.lineTo(px(p.x + nx * (RUN_W + 0.4)), pz(p.z + nz * (RUN_W + 0.4))); c.stroke(); };
    dye(1.2, 'rgba(204,40,40,0.9)', 0.12); dye(FINISH_S, 'rgba(204,40,40,0.9)', 0.12);
    for (const q of KICKERS) { dye(q.s + q.len - 0.05, 'rgba(40,90,204,0.85)', 0.1); dye(q.s + q.len * 0.4, 'rgba(40,90,204,0.4)', 0.06); }
    // the big kicker groomed: packed whiter than the run, corduroy across it from the machine, up its face and over the lip
    { const q = KICKERS.find(k2 => k2.big), across = (s, w) => { const p = run[Math.min(run.length - 1, Math.round(s / 0.25))], nx = -p.tz, nz = p.tx; return [px(p.x - nx * w), pz(p.z - nz * w), px(p.x + nx * w), pz(p.z + nz * w)]; };
      c.lineCap = 'butt';
      for (let s = q.s - 1.5; s < q.s + q.len + q.back; s += 0.25) { const [x0, y0, x1, y1] = across(s, RUN_W + 0.3); c.lineWidth = 0.27 * ppm; c.strokeStyle = 'rgba(236,242,255,0.28)'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
      for (let s = q.s - 1.5; s < q.s + q.len + q.back; s += 0.14) { const [x0, y0, x1, y1] = across(s, RUN_W + 0.1); d.lineWidth = 0.05 * ppm; d.strokeStyle = 'rgba(60,60,60,0.55)'; d.beginPath(); d.moveTo(x0, y0); d.lineTo(x1, y1); d.stroke(); }
      c.lineCap = 'round'; }
    // packed and a little icy-blue down the run, trodden grey up the path
    const band = (P, wide, style) => { c.lineWidth = wide * ppm; c.strokeStyle = style; c.beginPath(); c.moveTo(px(P[0].x), pz(P[0].z)); for (const p of P) c.lineTo(px(p.x), pz(p.z)); c.stroke(); };
    c.save(); c.globalCompositeOperation = 'multiply'; band(run, RUN_W * 2, 'rgb(208,224,255)'); band(L.path, PATH_W * 2, 'rgb(236,234,236)'); c.restore();
    const macro = new THREE.CanvasTexture(cv); macro.colorSpace = THREE.NoColorSpace; macro.flipY = false; macro.anisotropy = 4;
    // the normal map, from the dents
    const src = d.getImageData(0, 0, TW, TH).data, out = new Uint8Array(TW * TH * 4), Hh = (x, y) => src[((y < 0 ? 0 : y >= TH ? TH - 1 : y) * TW + (x < 0 ? 0 : x >= TW ? TW - 1 : x)) * 4] / 255;
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
      const gx = (Hh(x + 1, y) - Hh(x - 1, y)) * 3.2, gy = (Hh(x, y + 1) - Hh(x, y - 1)) * 3.2, l = Math.hypot(gx, gy, 1), o = (y * TW + x) * 4;
      out[o] = (0.5 - gx / l * 0.5) * 255; out[o + 1] = (0.5 - gy / l * 0.5) * 255; out[o + 2] = (0.5 + 0.5 / l) * 255; out[o + 3] = 255;
    }
    const norm = new THREE.DataTexture(out, TW, TH, THREE.RGBAFormat); norm.channel = 1; norm.wrapS = norm.wrapT = THREE.ClampToEdgeWrapping;
    norm.generateMipmaps = true; norm.minFilter = THREE.LinearMipmapLinearFilter; norm.magFilter = THREE.LinearFilter; norm.anisotropy = 4; norm.needsUpdate = true;
    return { macro, norm };
  },

  // ============================================================ the tunnel through the drift
  _tunnel(P, B, k) {
    const L = this.L, T = L.tun, f = T.floorAt, half = TUNNEL.half, R = half - 0.3, spring = 1.0, crown = 1.55;
    const snowM = this._snowMat(k, null, null, 0.85); snowM.side = THREE.DoubleSide;
    // the vault: half an ellipse from wall to wall, following the floor
    const pos = [], uv = [], idx = [], NA = 14, xs = [];
    for (let x = T.x0; x <= T.x1 + 1e-6; x += 0.5) xs.push(x);
    xs.forEach((x, a) => { const fy = f(x); for (let i = 0; i <= NA; i++) { const th = Math.PI * i / NA; pos.push(x, fy + spring + (crown - spring) * Math.sin(th), T.z - R * Math.cos(th)); uv.push(x / 6, th * R / 6); } });
    for (let a = 0; a < xs.length - 1; a++) for (let i = 0; i < NA; i++) { const p = a * (NA + 1) + i, q = p + NA + 1; idx.push(p, q, p + 1, p + 1, q, q + 1); }
    // the top over the bore, level with the drift either side
    const base = pos.length / 3; for (const [x, z] of [[T.x0, T.z - half], [T.x1, T.z - half], [T.x1, T.z + half], [T.x0, T.z + half]]) { pos.push(x, T.top + 0.006, z); uv.push(x / 6, z / 6); }
    idx.push(base, base + 3, base + 1, base + 1, base + 3, base + 2);
    const vg = new THREE.BufferGeometry(); vg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); vg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); vg.setIndex(idx); vg.computeVertexNormals();
    // the two faces of the drift, with the arch through them
    const faces = [];
    for (const x of [T.x0, T.x1]) {
      const fy = f(x), sh = new THREE.Shape([[-half, -0.3], [half, -0.3], [half, T.top - fy], [-half, T.top - fy]].map(([u, v]) => new THREE.Vector2(u, v)));
      const hole = new THREE.Path(); hole.moveTo(-R, -0.1); hole.lineTo(-R, spring);
      for (let i = 1; i <= NA; i++) { const th = Math.PI - Math.PI * i / NA; hole.lineTo(R * Math.cos(th), spring + (crown - spring) * Math.sin(th)); }
      hole.lineTo(R, -0.1); hole.lineTo(-R, -0.1); sh.holes.push(hole);
      const fg = new THREE.ShapeGeometry(sh, 4); fg.rotateY(-Math.PI / 2); fg.translate(x, fy, T.z);
      const p = fg.attributes.position, u = fg.attributes.uv; for (let i = 0; i < p.count; i++) u.setXY(i, p.getZ(i) / 6, p.getY(i) / 6);
      faces.push(fg);
      // lights round the arch, blue and white, and a row of them along the top of the drift
      for (let i = 0; i <= 16; i++) { const th = Math.PI * i / 16; B.add(x + (x === T.x0 ? -0.04 : 0.04), fy + spring + (crown - spring) * Math.sin(th) + 0.1, T.z - (R + 0.1) * Math.cos(th), i % 2 ? C.ice : C.white, i / 16, 1, 0.05); }
      for (let z = T.z - half; z <= T.z + half + 1e-6; z += 0.5) B.add(x, T.top + 0.08, z, C.blue, z * 0.2, 0, 0.045);
    }
    const fm = new THREE.Mesh(new THREE.BufferGeometry(), snowM);
    { const all = [vg, ...faces].map(q => q.index ? q.toNonIndexed() : q); let n = 0; for (const q of all) n += q.attributes.position.count; const Pp = new Float32Array(n * 3), Nn = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0; for (const q of all) { if (!q.attributes.normal) q.computeVertexNormals(); Pp.set(q.attributes.position.array, o * 3); Nn.set(q.attributes.normal.array, o * 3); U.set(q.attributes.uv.array, o * 2); o += q.attributes.position.count; } fm.geometry.setAttribute('position', new THREE.BufferAttribute(Pp, 3)); fm.geometry.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); fm.geometry.setAttribute('uv', new THREE.BufferAttribute(U, 2)); }
    fm.matrixAutoUpdate = false; this.g.add(fm);
    // The walls of the bore and of the cuts either end are walls, as high as the drift beside them.
    for (let x = Math.floor(T.cx - T.hx - 5); x < T.cx + T.hx + 5; x += 1) {
      let lo = 99; for (let u = x; u <= x + 1; u += 0.25) lo = Math.min(lo, Math.max(0, T.driftAt(u, T.z + half + 0.6) - 0.12), Math.max(0, T.driftAt(u, T.z - half - 0.6) - 0.12));
      const fy = Math.min(f(x), f(x + 1)); if (lo - fy < 0.3) continue;
      for (const s of [-1, 1]) this.O.push({ x0: x, x1: x + 1, z0: s < 0 ? T.z - half : T.z + half - 0.42, z1: s < 0 ? T.z - half + 0.42 : T.z + half, y0: fy - 0.6, y1: Math.min(lo, T.top - 0.12) });
    }
    void P;
  },

  // ============================================================ the top: the Tuxedo Shop, its signs, the lights round it
  // The shop on the north side of the top, its door to the south: a little log shop on a stone plinth, a bay window
  // full of warm light (a tuxedo on a stand, bow ties on the shelves), a red door with a wreath and a round window, a
  // lantern, a board over it all and a sign hanging from an iron bracket, a steep roof under a deep blanket of snow
  // with icicles along the eave, and a stone chimney. The penguins live in it: the door opens to let them out (_penguins).
  _summit(P, B, Wr, k) {
    const L = this.L, hAt = L.heightAt;
    const dark = col(0x2e1d12), green = col(0x1f4a36), stone = col(0x77716a), cream = col(0xefe4c8), iron = col(0x1c1c1e), red = col(0x8e2a22);
    const SX = 329.5, SZ = 138.6, W = 3.6, D = 2.8, WH = 2.6, T = 0.14;
    const fy = Math.max(hAt(SX - W / 2, SZ - D / 2), hAt(SX + W / 2, SZ - D / 2), hAt(SX - W / 2, SZ + D / 2), hAt(SX + W / 2, SZ + D / 2));
    const at = (x, y, z, ry = 0, rx = 0, rz = 0) => M4(SX + x, fy + y, SZ + z, ry, rx, rz);
    this.shop = { x: SX, z: SZ, y: fy, W, D, door: { x: SX + 0.6, z: SZ + D / 2 } };      // (the doorway, DX below)
    // the plinth, the walls in courses of logs (each a slightly different brown), the corner posts
    P.box(W + 0.14, 0.5, D + 0.14, stone, at(0, -0.05, 0), 0.6);
    const logs = [col(0x6e4628), col(0x62401f), col(0x75502f), col(0x5c3b20)], CH = 0.168, nC = Math.round(WH / CH);
    const course = (x0, x1, y0, y1, side) => {        // one wall, x0..x1 along it, y0..y1 up it: side n/s/e/w
      for (let i = 0; i < nC; i++) {
        const a = Math.max(y0, i * CH), b = Math.min(y1, (i + 1) * CH); if (b - a < 0.01) continue;
        const c = logs[(i * 7 + (side === 's' ? 0 : side === 'n' ? 1 : side === 'e' ? 2 : 3) + Math.round(x0 * 3) + 400) % 4], inset = i % 2 ? 0.008 : 0, h = b - a, l = x1 - x0;
        if (side === 's' || side === 'n') P.box(l, h, T - inset, c, at((x0 + x1) / 2, (a + b) / 2, (side === 's' ? 1 : -1) * (D / 2 - T / 2 - inset / 2)));
        else P.box(T - inset, h, l, c, at((side === 'e' ? 1 : -1) * (W / 2 - T / 2 - inset / 2), (a + b) / 2, (x0 + x1) / 2));
      }
    };
    course(-W / 2, W / 2, 0.2, WH, 'n'); course(-D / 2 + T, D / 2 - T, 0.2, WH, 'e'); course(-D / 2 + T, D / 2 - T, 0.2, WH, 'w');
    const DX = 0.6, DW = 0.9, DH = 1.85;                                    // the doorway: centre (from the middle of the front), width, height
    course(-W / 2, DX - DW / 2, 0.2, WH, 's'); course(DX + DW / 2, W / 2, 0.2, WH, 's'); course(DX - DW / 2, DX + DW / 2, DH, WH, 's');
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.box(0.18, WH - 0.2, 0.18, dark, at(x * (W / 2 - 0.07), 0.2 + (WH - 0.2) / 2, z * (D / 2 - 0.07)));
    // the doorway: trim round it, a step, and a warm room behind (a lit wall a little way in)
    P.box(0.08, DH + 0.05, 0.06, green, at(DX - DW / 2 - 0.04, 0.2 + DH / 2, D / 2 + 0.03)); P.box(0.08, DH + 0.05, 0.06, green, at(DX + DW / 2 + 0.04, 0.2 + DH / 2, D / 2 + 0.03)); P.box(DW + 0.24, 0.1, 0.07, green, at(DX, DH + 0.05, D / 2 + 0.035));
    { const inside = new THREE.Mesh(new THREE.PlaneGeometry(DW + 0.1, DH), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 0.82, 0.42) })); inside.position.set(SX + DX, fy + 0.2 + DH / 2, SZ + D / 2 - 0.55); inside.matrixAutoUpdate = false; inside.updateMatrix(); this.g.add(inside);
    }
    // the warm light from the window and the door, lying on the snow in front (a soft glow laid just over it)
    { const pool = canvasTex(256, 128, (c, w, h) => { for (const [cx, r, a] of [[0.36, 0.5, 0.75], [0.6, 0.34, 0.6]]) { const gr = c.createRadialGradient(w * cx, 0, 4, w * cx, 0, w * r); gr.addColorStop(0, `rgba(255,190,110,${a})`); gr.addColorStop(1, 'rgba(255,170,90,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); } });
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.2), new THREE.MeshBasicMaterial({ map: pool, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      pm.rotation.x = -Math.PI / 2; pm.position.set(SX - 0.2, hAt(SX, SZ + D / 2 + 1.2) + 0.012, SZ + D / 2 + 1.12); pm.matrixAutoUpdate = false; pm.updateMatrix(); pm.renderOrder = 2; this.g.add(pm); }
    // the door: red planks, a round window, a wreath, a brass knob; hung on its left post, it swings out (update)
    { const dg = new THREE.Group(), DP = new Parts(), w = DW - 0.02;
      for (let i = 0; i < 5; i++) DP.box(w / 5 - 0.006, DH - 0.02, 0.045, i % 2 ? red : col(0x9a3026), M4(w / 10 + i * w / 5, DH / 2, 0));
      for (const y of [0.35, DH - 0.35]) DP.box(w - 0.04, 0.08, 0.02, col(0x6e1e18), M4(w / 2, y, 0.032));
      DP.add(new THREE.TorusGeometry(0.15, 0.05, 6, 16), col(0x24502e), M4(w / 2, 1.15, 0.06));
      for (const sd of [-1, 1]) DP.box(0.07, 0.05, 0.02, col(0xc8262a), M4(w / 2 + sd * 0.04, 1.0, 0.1, 0, 0, sd * 0.5));
      DP.add(new THREE.SphereGeometry(0.03, 8, 6), col(0xd8b048), M4(w - 0.1, 0.95, 0.05));
      DP.add(new THREE.TorusGeometry(0.12, 0.018, 4, 16), col(0xd8b048), M4(w / 2, 1.55, 0.024));
      const dm = DP.mesh(0.26); dm.matrixAutoUpdate = true; dg.add(dm);
      const port = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 0.95, 0.5) })); port.position.set(w / 2, 1.55, 0.024); dg.add(port);
      dg.position.set(SX + DX - DW / 2 + 0.01, fy + 0.2, SZ + D / 2 + 0.03); this.g.add(dg); this.door = dg; this.doorOpen = 0; this.doorWant = 0; }
    // the bay window to the west of the door: a stone base, three panes of warm light on the shop's wares, a snowy hood
    const BX = -0.8, BW = 1.45, BD = 0.42, BY0 = 0.6, BY1 = 1.7;
    P.box(BW + 0.08, BY0 - 0.2 + 0.02, BD + 0.04, stone, at(BX, 0.2 + (BY0 - 0.2) / 2, D / 2 + BD / 2), 0.6);
    const wtex = canvasTex(512, 384, (c, w, h) => {
      const gr = c.createRadialGradient(w / 2, h * 0.55, 20, w / 2, h * 0.5, w * 0.62); gr.addColorStop(0, '#ffd889'); gr.addColorStop(0.6, '#e89a3c'); gr.addColorStop(1, '#8a4a1c'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      // shelves of bow ties either side
      for (const sx of [70, w - 70]) for (let r = 0; r < 3; r++) { const y = 90 + r * 90; c.fillStyle = '#5a3418'; c.fillRect(sx - 60, y + 22, 120, 8); for (let i = 0; i < 3; i++) { const bx = sx - 36 + i * 36, colr = ['#c8262a', '#1d1d24', '#2a6ad2', '#d8a52a'][(r + i) % 4]; c.fillStyle = colr; c.beginPath(); c.moveTo(bx, y + 10); c.lineTo(bx - 14, y); c.lineTo(bx - 14, y + 20); c.closePath(); c.fill(); c.beginPath(); c.moveTo(bx, y + 10); c.lineTo(bx + 14, y); c.lineTo(bx + 14, y + 20); c.closePath(); c.fill(); c.fillRect(bx - 3, y + 6, 6, 8); } }
      // a tuxedo on a stand in the middle
      const cx = w / 2; c.fillStyle = '#3a2412'; c.fillRect(cx - 4, 250, 8, 100); c.fillRect(cx - 40, 345, 80, 8);
      c.fillStyle = '#16161c'; c.beginPath(); c.moveTo(cx - 70, 110); c.lineTo(cx + 70, 110); c.lineTo(cx + 62, 260); c.lineTo(cx - 62, 260); c.closePath(); c.fill();
      c.fillStyle = '#f4f0e6'; c.beginPath(); c.moveTo(cx - 26, 110); c.lineTo(cx + 26, 110); c.lineTo(cx, 220); c.closePath(); c.fill();
      c.fillStyle = '#c8262a'; c.beginPath(); c.moveTo(cx, 122); c.lineTo(cx - 18, 112); c.lineTo(cx - 18, 132); c.closePath(); c.fill(); c.beginPath(); c.moveTo(cx, 122); c.lineTo(cx + 18, 112); c.lineTo(cx + 18, 132); c.closePath(); c.fill();
      c.fillStyle = '#16161c'; for (const y of [160, 190]) { c.beginPath(); c.arc(cx, y, 4, 0, TAU); c.fill(); }
      c.fillStyle = '#16161c'; c.fillRect(cx - 34, 60, 68, 40); c.fillRect(cx - 50, 96, 100, 8);           // and a top hat on top
      c.strokeStyle = 'rgba(90,40,10,0.5)'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
    });
    const glassM = new THREE.MeshBasicMaterial({ map: wtex, color: new THREE.Color(1.35, 1.25, 1.1) }), sideM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 0.85, 0.42) });
    { const H = BY1 - BY0, front = new THREE.Mesh(new THREE.PlaneGeometry(BW - 0.1, H - 0.1), glassM); front.position.set(SX + BX, fy + (BY0 + BY1) / 2, SZ + D / 2 + BD - 0.03); front.matrixAutoUpdate = false; front.updateMatrix(); this.g.add(front);
      for (const sd of [-1, 1]) { const sm = new THREE.Mesh(new THREE.PlaneGeometry(BD - 0.1, H - 0.1), sideM); sm.position.set(SX + BX + sd * (BW / 2 - 0.03), fy + (BY0 + BY1) / 2, SZ + D / 2 + BD / 2); sm.rotation.y = sd * Math.PI / 2; sm.matrixAutoUpdate = false; sm.updateMatrix(); this.g.add(sm); } }
    // its frame: posts at the corners, sill and head, mullions, and the hood with snow on it
    for (const sd of [-1, 1]) P.box(0.06, BY1 - BY0 + 0.06, 0.06, green, at(BX + sd * (BW / 2 - 0.03), (BY0 + BY1) / 2, D / 2 + BD - 0.03));
    P.box(BW + 0.12, 0.06, BD + 0.08, green, at(BX, BY0 - 0.02, D / 2 + BD / 2)); P.box(BW + 0.08, 0.07, BD + 0.04, green, at(BX, BY1 + 0.02, D / 2 + BD / 2));
    for (const dx of [-BW / 6, BW / 6]) P.box(0.035, BY1 - BY0, 0.03, green, at(BX + dx, (BY0 + BY1) / 2, D / 2 + BD - 0.015));
    P.box(BW - 0.08, 0.03, 0.03, green, at(BX, BY0 + (BY1 - BY0) * 0.62, D / 2 + BD - 0.015));
    P.box(BW + 0.3, 0.06, BD + 0.3, dark, at(BX, BY1 + 0.12, D / 2 + BD / 2 + 0.02, 0, 0.12)); P.box(BW + 0.34, 0.1, BD + 0.3, SNOW, at(BX, BY1 + 0.2, D / 2 + BD / 2 + 0.02, 0, 0.12));
    // a box of evergreens under it, snowed on, with berries
    P.box(BW + 0.04, 0.16, 0.2, green, at(BX, BY0 - 0.14, D / 2 + BD + 0.12));
    { const r = rng(9); for (let i = 0; i < 9; i++) { const x = BX - BW / 2 + 0.1 + i * (BW - 0.2) / 8; P.add(new THREE.SphereGeometry(0.075 + r() * 0.03, 7, 5), col(0x1e4a2a), at(x, BY0 + 0.0, D / 2 + BD + 0.12), 0.5); if (i % 2) P.add(new THREE.SphereGeometry(0.018, 5, 4), col(0xc8262a), at(x + 0.04, BY0 + 0.05, D / 2 + BD + 0.2)); } }
    // the roof: two pitches over a ridge east to west, a deep slab of snow on each with a rounded lip, icicles along the front eave
    const PITCH = 0.62, OV = 0.3, OS = 0.32, half = D / 2 + OV, run = half / Math.cos(PITCH), rise = Math.tan(PITCH) * (D / 2);
    for (const s of [-1, 1]) {
      const cz = s * (D / 2 + OV) / 2, cy = WH + rise / 2 - Math.tan(PITCH) * OV / 2;
      P.box(W + 2 * OS, 0.09, run, dark, at(0, cy + 0.05, cz, 0, s * PITCH));
      P.box(W + 2 * OS + 0.06, 0.2, run + 0.02, SNOW, at(0, cy + 0.19, cz + s * -0.01, 0, s * PITCH));
      const ez = s * (D / 2 + OV), ey = WH - Math.tan(PITCH) * OV + 0.13; const lip = new THREE.CylinderGeometry(0.11, 0.11, W + 2 * OS + 0.06, 10); lip.rotateZ(Math.PI / 2); P.add(lip, SNOW, at(0, ey + 0.02, ez + s * 0.02));
      if (s > 0) { const r = rng(5); for (let x = -W / 2 - OS + 0.12; x < W / 2 + OS - 0.1; x += 0.09 + r() * 0.08) { const l = 0.06 + r() * r() * 0.32, ic = new THREE.ConeGeometry(0.016 + r() * 0.01, l, 5); ic.rotateX(Math.PI); P.add(ic, col(0xcfe6f6), at(x, ey - 0.08 - l / 2, ez + 0.04)); } }
    }
    { const gab = new THREE.BufferGeometry(); for (const x of [-W / 2, W / 2]) { const xs = SX + x + Math.sign(x) * 0.001; gab.setAttribute('position', new THREE.Float32BufferAttribute([xs, fy + WH, SZ - D / 2, xs, fy + WH, SZ + D / 2, xs, fy + WH + rise, SZ, xs, fy + WH, SZ + D / 2, xs, fy + WH, SZ - D / 2, xs, fy + WH + rise, SZ], 3)); gab.computeVertexNormals(); P.add(gab.clone(), logs[1]); }
      for (const x of [-W / 2 - 0.02, W / 2 + 0.02]) for (let z = -D / 2 + 0.2; z < D / 2 - 0.1; z += 0.22) { const hh = rise * (1 - Math.abs(z) / (D / 2)) - 0.05; if (hh > 0.05) P.box(0.02, hh, 0.025, dark, at(x, WH + hh / 2, z)); } }
    // a round warm window in the east gable, looking towards the gate
    { const gw = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), sideM); gw.position.set(SX + W / 2 + 0.035, fy + WH + rise * 0.42, SZ); gw.rotation.y = Math.PI / 2; gw.matrixAutoUpdate = false; gw.updateMatrix(); this.g.add(gw); P.add(new THREE.TorusGeometry(0.21, 0.035, 5, 16), green, at(W / 2 + 0.035, WH + rise * 0.42, 0, Math.PI / 2)); }
    // the chimney at the back, west end, snow on its cap
    { const cx = -W / 2 + 0.7, cz = -D / 2 + 0.55, h0 = WH + Math.tan(PITCH) * (D / 2 - 0.55 - 0.25); P.box(0.5, 1.6, 0.5, stone, at(cx, h0 + 0.3, cz)); P.box(0.62, 0.1, 0.62, col(0x5a554e), at(cx, h0 + 1.12, cz)); P.box(0.6, 0.12, 0.6, SNOW, at(cx, h0 + 1.22, cz));
      this.chimney = { x: SX + cx, y: fy + h0 + 1.3, z: SZ + cz }; this.O.push({ x0: SX + cx - 0.31, x1: SX + cx + 0.31, z0: SZ + cz - 0.31, z1: SZ + cz + 0.31, y0: fy + h0 - 0.5, y1: fy + h0 + 1.3 }); }
    // a lantern by the door, on a bracket
    { const lx = DX + DW / 2 + 0.2; P.box(0.04, 0.04, 0.26, iron, at(lx, 1.95, D / 2 + 0.13)); P.box(0.14, 0.2, 0.14, iron, at(lx, 1.8, D / 2 + 0.24)); P.add(new THREE.ConeGeometry(0.12, 0.1, 4), iron, at(lx, 1.95, D / 2 + 0.24, Math.PI / 4), 0.5); B.add(SX + lx, fy + 1.79, SZ + D / 2 + 0.24, C.warm, 0.2, 2, 0.065); }
    // the board over the front: TUXEDO SHOP in cream on green, a gold line round it
    const board = (w, h, draw) => canvasTex(w, h, draw);
    const facia = board(1024, 160, (c, w, h) => {
      c.fillStyle = '#1f4a36'; c.fillRect(0, 0, w, h); c.strokeStyle = '#d8b048'; c.lineWidth = 7; c.strokeRect(12, 12, w - 24, h - 24);
      c.fillStyle = '#f3ead2'; fitText(c, 'TUXEDO SHOP', { x: w / 2, y: h / 2 + 4, w: w - 150, h: h - 50, px: 110, weight: '800', family: SERIF, sep: ' ' });
      c.fillStyle = '#d8b048'; for (const x of [52, w - 52]) { c.beginPath(); c.moveTo(x, h / 2 - 22); c.lineTo(x + 18, h / 2); c.lineTo(x, h / 2 + 22); c.lineTo(x - 18, h / 2); c.closePath(); c.fill(); }
    });
    { const fw = 2.4, fh = fw * 160 / 1024, m = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), new THREE.MeshStandardMaterial({ map: facia, roughness: 0.8, emissiveMap: facia, emissive: new THREE.Color(0.75, 0.75, 0.75) })); m.position.set(SX - 0.25, fy + WH - 0.21, SZ + D / 2 + 0.045); m.matrixAutoUpdate = false; m.updateMatrix(); this.g.add(m); P.box(fw + 0.08, fh + 0.06, 0.035, dark, at(-0.25, WH - 0.21, D / 2 + 0.0175)); }
    // the sign that hangs out over the front, beside the door, read from the gate and from the path alike
    const hang = board(512, 384, (c, w, h) => {
      c.fillStyle = '#efe4c8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#1f4a36'; c.lineWidth = 16; c.strokeRect(10, 10, w - 20, h - 20); c.strokeStyle = '#d8b048'; c.lineWidth = 4; c.strokeRect(28, 28, w - 56, h - 56);
      // a penguin in a bow tie, at the top
      const px = w / 2, py = 108; c.fillStyle = '#16161c'; c.beginPath(); c.ellipse(px, py + 6, 38, 52, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(px, py - 46, 26, 0, TAU); c.fill();
      c.fillStyle = '#f7f3ea'; c.beginPath(); c.ellipse(px, py + 14, 24, 40, 0, 0, TAU); c.fill(); c.fillStyle = '#f08a1c'; c.beginPath(); c.moveTo(px - 7, py - 44); c.lineTo(px + 7, py - 44); c.lineTo(px, py - 30); c.closePath(); c.fill();
      c.fillStyle = '#f7f3ea'; for (const sd of [-1, 1]) { c.beginPath(); c.arc(px + sd * 10, py - 52, 5, 0, TAU); c.fill(); }
      c.fillStyle = '#c8262a'; c.beginPath(); c.moveTo(px, py - 18); c.lineTo(px - 15, py - 26); c.lineTo(px - 15, py - 10); c.closePath(); c.fill(); c.beginPath(); c.moveTo(px, py - 18); c.lineTo(px + 15, py - 26); c.lineTo(px + 15, py - 10); c.closePath(); c.fill();
      c.fillStyle = '#1f4a36'; fitText(c, 'Tuxedo Shop', { x: w / 2, y: 268, w: w - 90, h: 150, px: 92, weight: '800', family: SERIF, lines: 2 });
    });
    { const sw = 0.95, sh = sw * 384 / 512, bx = DX + DW / 2 + 0.53, by = WH - 0.3, mat = new THREE.MeshStandardMaterial({ map: hang, roughness: 0.8, emissiveMap: hang, emissive: new THREE.Color(0.7, 0.7, 0.7) });
      const s2 = twoFaced(new THREE.PlaneGeometry(sw, sh), mat, 0.04); s2.position.set(SX + bx, fy + by - 0.12 - sh / 2, SZ + D / 2 + 0.55); s2.rotation.y = Math.PI / 2; s2.traverse(o => { o.matrixAutoUpdate = true; }); this.g.add(s2);
      P.box(0.02, sh + 0.04, sw + 0.04, dark, at(bx, by - 0.12 - sh / 2, D / 2 + 0.55));                                        // (its board, between the two faces)
      P.box(0.04, 0.04, 1.0, iron, at(bx, by, D / 2 + 0.5)); P.box(0.03, 0.03, 0.55, iron, at(bx, by - 0.2, D / 2 + 0.25, 0, -0.62));      // the bracket
      for (const dz of [-0.3, 0.3]) P.box(0.008, 0.12, 0.008, iron, at(bx, by - 0.06, D / 2 + 0.55 + dz)); }
    // solid: the shop and its plinth, the bay, the roof (three slabs, stepped as it rises), as drawn
    const O = this.O, X0 = SX - W / 2 - 0.07, X1 = SX + W / 2 + 0.07;
    O.push({ x0: X0, x1: X1, z0: SZ - D / 2 - 0.07, z1: SZ + D / 2 + 0.07, y0: fy - 1, y1: fy + WH });
    O.push({ x0: SX + BX - BW / 2 - 0.06, x1: SX + BX + BW / 2 + 0.06, z0: SZ + D / 2, z1: SZ + D / 2 + BD + 0.22, y0: fy - 1, y1: fy + BY1 + 0.25 });
    for (let i = 0; i < 3; i++) { const z = half * (1 - i / 3); O.push({ x0: SX - W / 2 - OS, x1: SX + W / 2 + OS, z0: SZ - z - 0.1, z1: SZ + z + 0.1, y0: fy + WH - 0.2 + i * rise / 3, y1: fy + WH + (i + 1) * rise / 3 + 0.25 }); }
    // Lights strung on poles round the top, over the run and the path where they leave it (not behind the shop).
    const R = TOP.r + 0.9, poles = [];
    for (const deg of [-40, 35, 65, 95, 125, 140, 180, -150, -125]) { const a = deg * Math.PI / 180, x = TOP.x + Math.cos(a) * R, z = TOP.z + Math.sin(a) * R, y = hAt(x, z); poles.push([x, y, z]); }
    const palette = [C.red, C.green, C.gold, C.blue, C.warm, C.pink];
    let nb = 0;
    poles.forEach(([x, y, z], i) => {
      rod(P, new THREE.Vector3(x, y - 0.3, z), new THREE.Vector3(x, y + 3.0, z), 0.05, 0.04, dark, 0.7, 6);
      this.O.push({ x0: x - 0.08, x1: x + 0.08, z0: z - 0.08, z1: z + 0.08, y0: y - 1, y1: y + 3 });
      if (i === poles.length - 1) return;
      const [x2, y2, z2] = poles[i + 1], a = [x, y + 2.95, z], b = [x2, y2 + 2.95, z2], pts = [];
      for (let t = 0; t <= 1.0001; t += 1 / 16) pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - 0.55 * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t]);
      Wr.stroke(pts, [0.08, 0.08, 0.09]);
      for (let j = 1; j < 16; j += 1.4) { const p = pts[Math.floor(j)]; B.add(p[0], p[1] - 0.07, p[2], palette[nb++ % palette.length], nb * 0.13, 0, 0.055); }
    });
    // a pair of old millstones somebody set as seats at the top, looking down the run, and a bin by the shop
    for (const [x, z] of [[333.8, 148.6], [332.3, 149.5]]) { const y = hAt(x, z); P.add(new THREE.CylinderGeometry(0.42, 0.45, 0.42, 16), stone, M4(x, y + 0.19, z), 0.6); this.O.push({ x0: x - 0.45, x1: x + 0.45, z0: z - 0.45, z1: z + 0.45, y0: y - 1, y1: y + 0.42 }); }
    { const x = 327.0, z = 140.55, y = hAt(x, z); P.add(new THREE.CylinderGeometry(0.24, 0.22, 0.85, 12, 1), green, M4(x, y + 0.42, z), 0.7); this.O.push({ x0: x - 0.26, x1: x + 0.26, z0: z - 0.26, z1: z + 0.26, y0: y - 1, y1: y + 0.86 }); }
    void cream; void k;
  },

  // ============================================================ the steps up the north face
  _stairs(P) {
    const L = this.L, st = STAIR, len = st.z1 - st.z0, top = L.heightAt(st.x, st.z1 - 0.3), n = Math.round(top / 0.14), run = len / n, rise = top / n;
    const tread = col(0x6b4a2c), rail = col(0x4a3220), x = st.x;
    for (let i = 0; i < n; i++) {
      const z = st.z0 + (i + 0.5) * run, y = (i + 1) * rise;
      P.box(1.7, 0.07, run + 0.04, tread, M4(x, y - 0.035, z), 0.6);                       // the tread, snow on it
      P.box(1.7, rise, 0.05, col(0x5a3d24), M4(x, y - rise / 2, z - run / 2 + 0.025));       // the riser
    }
    for (const s of [-1, 1]) {
      const xs = x + s * 0.9;
      P.box(0.07, 0.24, len, rail, new THREE.Matrix4().makeRotationX(-Math.atan2(top, len)).premultiply(new THREE.Matrix4().makeTranslation(xs, top / 2 - 0.02, (st.z0 + st.z1) / 2)));      // the stringer
      for (let z = st.z0 + 0.3; z < st.z1; z += 2.2) { const y = (z - st.z0) / len * top; rod(P, new THREE.Vector3(xs, y - 0.2, z), new THREE.Vector3(xs, y + 0.95, z), 0.045, 0.045, rail, 0.7, 6); }
      rod(P, new THREE.Vector3(xs, 0.95, st.z0 + 0.3), new THREE.Vector3(xs, top + 0.95, st.z1), 0.035, 0.035, rail, 0.6, 6);
    }
    // Drive up them: a toy's wheels ride from nosing to nosing, so the steps are ground along the line through the
    // treads' front edges (the bottom one a step out from the first riser), then the top tread, level. The handrails
    // are low walls down both sides.
    const S = this.k.plan.surfaces;
    S.push({ skin: 'wood', x0: x - 0.85, x1: x + 0.85, z0: st.z0 - run, z1: st.z1 - run, axis: 'z', h0: 0, h1: top, base: -1, stairs: true });
    S.push({ skin: 'wood', x0: x - 0.85, x1: x + 0.85, z0: st.z1 - run, z1: st.z1, axis: null, h0: top, h1: top, thick: 0.3 });
    for (let z = st.z0 - run; z < st.z1; z += 1) { const h = Math.min(top, (Math.min(st.z1, z + 1) - st.z0 + run) / len * top); for (const s2 of [-1, 1]) this.O.push({ x0: x + s2 * 0.88 - 0.05, x1: x + s2 * 0.88 + 0.05, z0: z, z1: Math.min(st.z1, z + 1), y0: -1, y1: h + 1.0 }); }
  },

  // ============================================================ the path up, with lanterns
  _path(P, B) {
    const L = this.L, path = L.path, post = col(0x3a2a1a), iron = col(0x1c1c1e);
    for (let s = 3; s < L.pathLen - 5; s += 8) {
      const p = path[Math.round(s / (L.pathLen / path.length))] || path[path.length - 1], side = 1, d = PATH_W + 0.75, x = p.x - p.tz * d * side, z = p.z + p.tx * d * side, y = L.heightAt(x, z);
      rod(P, new THREE.Vector3(x, y - 0.3, z), new THREE.Vector3(x, y + 1.05, z), 0.045, 0.04, post, 0.7, 6);
      P.box(0.16, 0.2, 0.16, iron, M4(x, y + 1.15, z)); P.add(new THREE.ConeGeometry(0.15, 0.1, 4), iron, M4(x, y + 1.3, z, Math.PI / 4), 0.5);
      B.add(x, y + 1.15, z, C.warm, s * 0.07, 2, 0.06);
      this.O.push({ x0: x - 0.1, x1: x + 0.1, z0: z - 0.1, z1: z + 0.1, y0: y - 1, y1: y + 1.35 });
    }
  },

  // ============================================================ the gate at the top, the line at the bottom, the snow fence
  _gates(P, B, Wr, k) {
    const L = this.L, run = L.run, at = s => run[Math.min(run.length - 1, Math.round(s / 0.25))];
    const banner = (a, b) => canvasTex(512, 96, (c, w, h) => { const n = 16, q = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) { c.fillStyle = (i + j) % 2 ? a : b; c.fillRect(i * q, j * h / 3, q, h / 3); } });
    const arch = (s, tex, lights, wide) => {
      const p = at(s), nx = -p.tz, nz = p.tx, d = RUN_W + wide, H = 2.6, pts = [];
      for (const sd of [-1, 1]) {
        const x = p.x + nx * d * sd, z = p.z + nz * d * sd, y = L.heightAt(x, z); pts.push([x, y, z]);
        rod(P, new THREE.Vector3(x, y - 0.4, z), new THREE.Vector3(x, y + H, z), 0.07, 0.06, col(0x2e1d12), 0.7, 8);
        this.O.push({ x0: x - 0.1, x1: x + 0.1, z0: z - 0.1, z1: z + 0.1, y0: y - 1, y1: y + H });
      }
      const y = Math.max(pts[0][1], pts[1][1]) + H - 0.3, l = Math.hypot(pts[1][0] - pts[0][0], pts[1][2] - pts[0][2]);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(l, 0.42), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, color: new THREE.Color(1.25, 1.25, 1.25) }));
      m.position.set((pts[0][0] + pts[1][0]) / 2, y, (pts[0][2] + pts[1][2]) / 2); m.rotation.y = Math.atan2(-(pts[1][2] - pts[0][2]), pts[1][0] - pts[0][0]); m.matrixAutoUpdate = false; m.updateMatrix(); this.g.add(m);
      for (let i = 0; i <= 14; i++) { const t = i / 14; B.add(pts[0][0] + (pts[1][0] - pts[0][0]) * t, y + 0.26, pts[0][2] + (pts[1][2] - pts[0][2]) * t, lights[i % lights.length], t * 3, 1, 0.05); }
      return pts;
    };
    arch(1.2, banner('#1e6a3e', '#f4f1e8'), [C.green, C.white], 0.5);
    arch(FINISH_S, banner('#b3261e', '#f4f1e8'), [C.red, C.white], 1.0);
    // a red slatted snow fence across the end of the run-out, to stop anybody running on into the field
    const end = run[run.length - 1], red = col(0xb4362a), wire = [0.25, 0.25, 0.27], fnx = -end.tz, fnz = end.tx;
    const fc = { x: end.x + end.tx * 2.6, z: end.z + end.tz * 2.6 }, fpt = u => [fc.x + fnx * u, fc.z + fnz * u], fyaw = Math.atan2(fnx, fnz) + Math.PI / 2;
    for (let u = -6.5; u <= 6.5; u += 0.11) { const [x, z] = fpt(u), y = L.heightAt(x, z); P.box(0.04, 1.15, 0.015, red, M4(x, y + 0.55, z, fyaw, 0, (Math.sin(u * 13) * 0.03))); }
    for (let u = -6.5; u <= 6.5 + 1e-6; u += 2.6) { const [x, z] = fpt(u), y = L.heightAt(x, z); rod(P, new THREE.Vector3(x - end.tx * 0.03, y - 0.3, z - end.tz * 0.03), new THREE.Vector3(x - end.tx * 0.03, y + 1.3, z - end.tz * 0.03), 0.03, 0.03, col(0x3b3b3b), 0, 6); }
    for (const hy of [0.15, 0.6, 1.05]) { const pts = []; for (let u = -6.5; u <= 6.5 + 1e-6; u += 0.5) { const [x, z] = fpt(u); pts.push([x + end.tx * 0.012, L.heightAt(x, z) + hy, z + end.tz * 0.012]); } Wr.stroke(pts, wire, null, 0.006); }
    { const [ax, az] = fpt(-6.5), [bx, bz] = fpt(6.5), t = 0.07; this.O.push({ x0: Math.min(ax, bx) - t, x1: Math.max(ax, bx) + t, z0: Math.min(az, bz) - t, z1: Math.max(az, bz) + t, y0: -1, y1: 1.3 }); }
    // Bamboo stakes down both sides of the run, so that it can be read from the snow at a toy's height, and taller
    // marker poles lit at the top round the outsides of the turns. Neither is solid: hit one and it bends over and
    // springs back (_poleHits), so they are drawn on their own, instanced, a few segments each to bend through.
    this.poles = [];
    const pole = (x, z, kind, cap, bulb) => { const y = L.heightAt(x, z); this.poles.push({ x, y, z, kind, cap, bulb, th: 0, w: 0, dx: 1, dz: 0, cool: 0 }); };
    for (let s = 5; s < FINISH_S - 2; s += 7) for (const sd of [-1, 1]) {
      const p = at(s), nx = -p.tz, nz = p.tx, d = (RUN_W + 0.5) * sd, x = p.x + nx * d, z = p.z + nz * d;      // (at the foot of the lip, where a wide line catches them)
      if (s > TUNNEL.s0 - 6 && s < TUNNEL.s1 + 6) continue;
      if (KICKERS.some(q => s > q.s - 1 && s < q.s + q.len + 1.5)) continue;          // (not beside a kicker's lip: the jump poles are there)
      pole(x, z, 0, col(sd < 0 ? 0xd2482a : 0x2a6ad2), -1);
    }
    for (const s of [17, 25, 33, 45, 50, 82, 88]) {
      const p = at(s), sg = Math.sign(p.kk || 1), nx = -p.tz, nz = p.tx, d = -(RUN_W + RUN_LIP - 0.2) * sg, x = p.x + nx * d, z = p.z + nz * d, y = L.heightAt(x, z);
      pole(x, z, 1, col(0xd85a1e), B.s.length); B.add(x, y + 1.25, z, C.orange, s * 0.1, 0, 0.05);
    }
    // the big jump, marked: a pair of tall red-and-white poles either side of the lip, flags on them
    { const q = KICKERS.find(k2 => k2.big), p = at(q.s + q.len), nx = -p.tz, nz = p.tx;
      for (const sd of [-1, 1]) { const d = (RUN_W + 0.55) * sd, x = p.x + nx * d, z = p.z + nz * d; pole(x, z, 2, col(0xd8262a), -1); this.poles[this.poles.length - 1].fyaw = Math.atan2(-nz * sd, nx * sd); } }      // (the flags stand out away from the run)
    void k;
  },

  // The poles, drawn: one instanced mesh of round segments (each pole a few of them, so that it bends in a curve), one
  // of caps (a stake's painted tip, a jump pole's flag). Only those that are moving are worked out each frame.
  _poleMeshes(g) {
    const KIND = [{ h: 0.82, r0: 0.014, r1: 0.011, c: col(0xc9a24a) }, { h: 1.3, r0: 0.022, r1: 0.017, c: col(0xd85a1e) }, { h: 1.55, r0: 0.026, r1: 0.02, c: col(0xf2eee4) }];
    this.KIND = KIND; const NS = this.NSEG = 4, n = this.poles.length;
    const seg = new THREE.CylinderGeometry(1, 1, 1, 6, 1, false); seg.translate(0, 0.5, 0);
    // (lit a little from within by their own colours, as everything out of doors is here, so that they read at night)
    const glow = m => { m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vColor;'); }; return m; };
    const mat = glow(new THREE.MeshStandardMaterial({ roughness: 0.6, emissive: new THREE.Color(0.32, 0.32, 0.34) }));
    const S = this.poleSeg = new THREE.InstancedMesh(seg, mat, n * NS); S.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const capG = new THREE.CylinderGeometry(1, 1, 1, 6); capG.translate(0, 0.5, 0);
    const flag = new THREE.BufferGeometry(); flag.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0.5, 0, 0, 1, 0], 3));      // (one face, drawn both sides) flag.computeVertexNormals();
    const capM = glow(new THREE.MeshStandardMaterial({ roughness: 0.6, emissive: new THREE.Color(0.4, 0.4, 0.4) })), flagM = glow(new THREE.MeshStandardMaterial({ roughness: 0.6, emissive: new THREE.Color(0.45, 0.45, 0.45), side: THREE.DoubleSide }));
    this.poleCap = new THREE.InstancedMesh(capG, capM, n); this.poleCap.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.poleFlag = new THREE.InstancedMesh(flag, flagM, Math.max(1, this.poles.filter(p => p.kind === 2).length)); this.poleFlag.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const white = new THREE.Color(0xf2eee4), redc = new THREE.Color(0xd8262a), tc = new THREE.Color();
    let nf = 0;
    this.poles.forEach((p, i) => {
      const K = KIND[p.kind]; p.i = i; p.h = K.h;
      for (let j = 0; j < NS; j++) S.setColorAt(i * NS + j, p.kind === 2 ? (j % 2 ? white : redc) : tc.setRGB(...K.c));
      this.poleCap.setColorAt(i, tc.setRGB(...p.cap));
      if (p.kind === 2) { p.flag = nf; this.poleFlag.setColorAt(nf++, redc); }
      this._posePole(p);
    });
    for (const m of [S, this.poleCap, this.poleFlag]) { m.frustumCulled = false; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; g.add(m); }
    // a bucket of poles every 4 m, for finding the ones near something quickly
    this.poleAt = new Map(); for (const p of this.poles) { const key = Math.floor(p.x / 4) * 1000 + Math.floor(p.z / 4); if (!this.poleAt.has(key)) this.poleAt.set(key, []); this.poleAt.get(key).push(p); }
    this.livePoles = new Set();
  },
  // One pole, bent over by th towards (dx, dz): each segment leans a little further than the one under it.
  _posePole(p) {
    const K = this.KIND[p.kind], NS = this.NSEG, L = p.h / NS, M = this._pm || (this._pm = new THREE.Matrix4()), Q = this._pq || (this._pq = new THREE.Quaternion()), ax = this._pa || (this._pa = new THREE.Vector3()), P = this._pp || (this._pp = new THREE.Vector3()), Sc = this._ps || (this._ps = new THREE.Vector3());
    ax.set(p.dz, 0, -p.dx); if (ax.lengthSq() < 1e-6) ax.set(1, 0, 0); ax.normalize();
    let x = p.x, y = p.y - 0.06, z = p.z, a = 0;
    for (let j = 0; j < NS; j++) {
      a = p.th * (j + 0.5) / NS; const r = K.r0 + (K.r1 - K.r0) * (j + 0.5) / NS;
      Q.setFromAxisAngle(ax, a); this.poleSeg.setMatrixAt(p.i * NS + j, M.compose(P.set(x, y, z), Q, Sc.set(r, L + (j ? 0.004 : 0.06), r)));
      const l = j ? L : L + 0.06; x += p.dx * Math.sin(a) * l; y += Math.cos(a) * l; z += p.dz * Math.sin(a) * l;
    }
    // the top: a stake's painted tip (the last 12 cm), a marker's bulb, a jump pole's flag
    const tipA = p.th; Q.setFromAxisAngle(ax, tipA);
    if (p.kind === 0) { const bx = x - p.dx * Math.sin(tipA) * 0.12, by = y - Math.cos(tipA) * 0.12, bz = z - p.dz * Math.sin(tipA) * 0.12; this.poleCap.setMatrixAt(p.i, M.compose(P.set(bx, by, bz), Q, Sc.set(0.0165, 0.125, 0.0165))); }
    else this.poleCap.setMatrixAt(p.i, M.compose(P.set(x, y, z), Q, Sc.set(K.r1 * 1.4, 0.03, K.r1 * 1.4)));
    if (p.kind === 1 && p.bulb >= 0 && this.bulbs.mesh) this.bulbs.mesh.setMatrixAt(p.bulb, M.compose(P.set(x, y + 0.05 * Math.cos(tipA), z), this._pq0 || (this._pq0 = new THREE.Quaternion()), Sc.setScalar(0.05)));
    if (p.kind === 2) { Q.multiply((this._fq2 || (this._fq2 = new THREE.Quaternion())).setFromAxisAngle(this._up || (this._up = new THREE.Vector3(0, 1, 0)), p.fyaw)); const fx = x - p.dx * Math.sin(tipA) * 0.34, fyy = y - Math.cos(tipA) * 0.34, fz = z - p.dz * Math.sin(tipA) * 0.34; this.poleFlag.setMatrixAt(p.flag, M.compose(P.set(fx, fyy, fz), Q, Sc.set(0.34, 0.3, 1))); }
  },
  // Anything going through the poles bends them: o = { x, z, vx, vz, yaw }, a capsule `half` long each way along its yaw
  // and `r` round. A sled is nudged off a little, and loses a little; the car (and anything else) just goes through.
  _poleHits(o, half, r, nudge = true) {
    if (!this.poles) return;
    const bx = Math.floor(o.x / 4), bz = Math.floor(o.z / 4), fx = Math.sin(o.yaw || 0), fz = Math.cos(o.yaw || 0);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const list = this.poleAt.get((bx + i) * 1000 + bz + j); if (!list) continue;
      for (const p of list) {
        if (p.cool > 0) continue;
        const rx = p.x - o.x, rz = p.z - o.z, u = Math.max(-half, Math.min(half, rx * fx + rz * fz)), cx = rx - fx * u, cz = rz - fz * u, d = Math.hypot(cx, cz);
        if (d > r) continue;
        const sp = Math.hypot(o.vx, o.vz); if (sp < 0.3) continue;
        p.dx = o.vx / sp; p.dz = o.vz / sp; p.w = Math.max(p.w, Math.min(10, 2.2 + sp * 0.9)); p.cool = 0.6; this.livePoles.add(p);
        const k = this.k, loud = Math.min(1, sp / 10);
        k.synth.note(150 + Math.random() * 40, 0.12, { type: 'square', vol: 0.012 + 0.02 * loud }); k.synth.noise(0.14, { vol: 0.02 + 0.03 * loud, lp: 2200 });
        this.puffs.emit(p.x, p.y + 0.15, p.z, 8 + Math.round(loud * 10), { spread: 0.18, up: 0.6, life: 0.8, out: 0.5 });
        // the sled: turned a little away from the pole (more the more squarely it was hit), and a few per cent slower
        if (nudge) {
          const side = (-o.vz * rx + o.vx * rz) > 0 ? 1 : -1, sq = 1 - Math.min(1, d / r), a = -side * (0.04 + 0.08 * sq), ca = Math.cos(a), sa = Math.sin(a);
          const vx = o.vx * ca - o.vz * sa, vz = o.vx * sa + o.vz * ca; o.vx = vx * 0.96; o.vz = vz * 0.96; o.knock = Math.max(o.knock || 0, 0.12);
        }
      }
    }
  },
  _polesStep(dt) {
    if (!this.livePoles || !this.livePoles.size) return;
    for (const p of this.livePoles) {
      p.cool = Math.max(0, p.cool - dt);
      for (let n = Math.max(1, Math.ceil(dt * 240)), i = 0; i < n; i++) { const h = dt / n; p.w += (-90 * p.th - 6 * p.w) * h; p.th += p.w * h; if (p.th > 1.35) { p.th = 1.35; p.w = Math.min(p.w, 0); } if (p.th < -0.5) { p.th = -0.5; p.w = Math.max(p.w, 0); } }
      this._posePole(p);
      if (Math.abs(p.th) < 0.002 && Math.abs(p.w) < 0.02 && p.cool <= 0) { p.th = 0; p.w = 0; this._posePole(p); this.livePoles.delete(p); }
    }
    this.poleSeg.instanceMatrix.needsUpdate = true; this.poleCap.instanceMatrix.needsUpdate = true; this.poleFlag.instanceMatrix.needsUpdate = true;
    if (this.bulbs.mesh) this.bulbs.mesh.instanceMatrix.needsUpdate = true;
  },

  // ============================================================ trees and bushes
  _nature(P) {
    const L = this.L, r = rng(31), bark = col(0x3d2f25), twig = col(0x4a3c30);
    const ok = (x, z, m) => { const n = L.node(x, z); return n >= 0 && L.gap[n] > m && !L.kind[n] && L.heightAt(x, z) > 0.2 && !this.O.some(o => x > o.x0 - m && x < o.x1 + m && z > o.z0 - m && z < o.z1 + m); };
    // bare trees: a trunk dividing and dividing again, snow along the tops of the boughs
    const tree = (x, z, s, seed) => {
      const rr = rng(seed), y = L.heightAt(x, z) - 0.15;
      const grow = (a, dir, len, rad, depth) => {
        const b = a.clone().addScaledVector(dir, len); rod(P, a, b, rad, rad * 0.72, depth > 3 ? bark : twig, 0.55, depth > 3 ? 7 : 4);
        if (depth === 0) return;
        const n = depth > 3 ? 2 + (rr() < 0.5 ? 1 : 0) : 2;
        for (let i = 0; i < n; i++) {
          const yaw = rr() * TAU, tilt = 0.35 + rr() * 0.5, nd = new THREE.Vector3(Math.sin(tilt) * Math.cos(yaw), Math.cos(tilt), Math.sin(tilt) * Math.sin(yaw)).lerp(dir, 0.35).normalize();
          grow(b, nd, len * (0.62 + rr() * 0.18), rad * 0.62, depth - 1);
        }
      };
      grow(new THREE.Vector3(x, y, z), new THREE.Vector3((rr() - 0.5) * 0.12, 1, (rr() - 0.5) * 0.12).normalize(), 1.9 * s, 0.17 * s, 5);
      this.O.push({ x0: x - 0.22 * s, x1: x + 0.22 * s, z0: z - 0.22 * s, z1: z + 0.22 * s, y0: y - 1, y1: y + 6 * s });
    };
    let nt = 0; for (const [x, z, s] of [[312, 133, 1.15], [351, 128, 1.0], [373.5, 150, 0.9], [322.5, 176, 1.05], [348.5, 191.5, 0.95], [361, 167, 0.8], [313, 157, 0.85], [342, 121, 0.9]]) if (ok(x, z, 1.4)) tree(x, z, s, 100 + nt++);
    this.trees = nt;
    // bushes buried to their shoulders, a few twigs showing
    const bush = (x, z, s) => {
      const y = L.heightAt(x, z), n = 4 + Math.floor(r() * 4); let ext = 0;
      for (let i = 0; i < n; i++) {
        const a = r() * TAU, d = r() * 0.55 * s, rad = (0.32 + r() * 0.28) * s, bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d, by = L.heightAt(bx, bz) + rad * 0.35;
        const g = new THREE.SphereGeometry(rad, 10, 7), p = g.attributes.position; for (let j = 0; j < p.count; j++) { const f = 1 + Math.sin(p.getX(j) * 11 + i * 2) * Math.cos(p.getZ(j) * 9 - i) * 0.1; p.setXYZ(j, p.getX(j) * f, p.getY(j) * f * 0.72, p.getZ(j) * f); }
        g.computeVertexNormals(); P.add(g, col(0x3c4636), M4(bx, by, bz), 0.15); ext = Math.max(ext, d + rad);
      }
      for (let i = 0; i < 6; i++) { const a = r() * TAU, b = new THREE.Vector3(x + Math.cos(a) * 0.5 * s, y + 0.45 * s + r() * 0.3, z + Math.sin(a) * 0.5 * s); rod(P, new THREE.Vector3(x + Math.cos(a) * 0.2 * s, y + 0.2, z + Math.sin(a) * 0.2 * s), b, 0.012, 0.006, twig, 0, 3); }
      this.O.push({ x0: x - ext * 0.8, x1: x + ext * 0.8, z0: z - ext * 0.8, z1: z + ext * 0.8, y0: y - 1, y1: y + 0.8 * s });
    };
    const spots = [[318.5, 146], [313.5, 170], [321, 188], [316, 201.5], [326, 205], [340, 152], [355.5, 152], [365, 134], [330, 165], [333, 184.5], [356, 184.5], [377, 163], [372.5, 194], [311, 141], [345, 128.5], [337.5, 136.5]];
    let nb = 0; for (const [x, z] of spots) { if (ok(x, z, 1.0)) { bush(x, z, 0.9 + r() * 0.5); nb++; } }
    this.bushes = nb;
  },

  // ============================================================ sleds left lying about
  _sleds(P) {
    const L = this.L, wood = col(0x9a6a3c), rope = col(0xc9b48a), up = new THREE.Vector3(0, 1, 0);
    const lay = (x, z, yaw, build, rad) => {
      const e = 0.3, y = L.heightAt(x, z), n = new THREE.Vector3(L.heightAt(x - e, z) - L.heightAt(x + e, z), 2 * e, L.heightAt(x, z - e) - L.heightAt(x, z + e)).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(up, n).multiply(new THREE.Quaternion().setFromAxisAngle(up, yaw)), M = new THREE.Matrix4().compose(new THREE.Vector3(x, y + 0.02, z), q, new THREE.Vector3(1, 1, 1));
      build(M); this.O.push({ x0: x - rad, x1: x + rad, z0: z - rad, z1: z + rad, y0: y - 0.5, y1: y + 0.3 });
    };
    // a wooden toboggan: three long boards, cross bars, the front curled up and back, a rope along the side
    const toboggan = M => {
      const add = (geo, c, m) => P.add(geo, c, m.clone().premultiply(M));
      for (const dx of [-0.15, 0, 0.15]) {
        add(new THREE.BoxGeometry(0.14, 0.02, 1.5), wood, new THREE.Matrix4().makeTranslation(dx, 0.02, -0.15));
        for (let i = 1; i <= 7; i++) { const a = i / 7 * Math.PI * 0.95, R = 0.17; add(new THREE.BoxGeometry(0.14, 0.02, 0.08), wood, new THREE.Matrix4().makeRotationX(-a).premultiply(new THREE.Matrix4().makeTranslation(dx, 0.02 + R - Math.cos(a) * R, 0.6 + Math.sin(a) * R))); }
      }
      for (const z of [-0.75, -0.35, 0.05, 0.45]) add(new THREE.BoxGeometry(0.48, 0.025, 0.04), col(0x7a5030), new THREE.Matrix4().makeTranslation(0, 0.045, z));
      for (const sd of [-1, 1]) add(new THREE.CylinderGeometry(0.008, 0.008, 1.3, 4), rope, new THREE.Matrix4().makeRotationX(Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(sd * 0.25, 0.08, -0.1)));
    };
    // a plastic saucer: a shallow dish with two handles
    const saucer = c => M => {
      const prof = [[0, 0.02], [0.2, 0.025], [0.3, 0.05], [0.34, 0.09], [0.33, 0.1]].map(([a, b]) => new THREE.Vector2(a, b));
      P.add(new THREE.LatheGeometry(prof, 20), c, M);
      for (const sd of [-1, 1]) P.add(new THREE.TorusGeometry(0.05, 0.012, 4, 8, Math.PI), c, new THREE.Matrix4().makeTranslation(sd * 0.3, 0.1, 0).premultiply(M));
    };
    lay(334.5, 145.5, 0.4, toboggan, 0.9);
    lay(352, 186, -1.1, toboggan, 0.9);
    lay(347, 122.5, 2.0, toboggan, 0.9);
    lay(325.2, 138.8, 1.4, saucer(col(0x2f62c8)), 0.4);
    lay(364, 193, 0, saucer(col(0xd2302a)), 0.4);
    lay(309.5, 150, 0, saucer(col(0x2e9a54)), 0.4);
    lay(330, 194, 0, saucer(col(0xe2b21e)), 0.4);
  },

  // ============================================================ the penguins of the Tuxedo Shop
  // Three of them, each built of five parts (body, two flippers, two feet), every part one instanced mesh, so that all
  // the penguins are five draw calls. A penguin stands about 62 cm: black back and head, white front and cheeks, an
  // orange beak and orange feet, a red bow tie (it is their shop). Out of the door it waddles to the start, waits by the
  // gate, flops on its belly when you go and slides down the run beside you: along its own line, wobbling, over the
  // kicker and through the air with its flippers out, round the banks and through the tunnel. At the bottom it gets
  // up, flaps, and waddles off to one side. It is never solid: it shuffles out of the toy's way.
  _penguinGeo() {
    const BLK = col(0x15161b), WHT = col(0xf4f2ec), ORG = col(0xf0841c), RED = col(0xc8262a), CRM = col(0xfaf3dc);
    const paint = (g, fn) => { const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) c.set(fn(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)), i * 3); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; };
    const solid = (g, c) => paint(g, () => c);
    const merge = list => { let n = 0; const gs = list.map(g => g.index ? g.toNonIndexed() : g); for (const g of gs) n += g.attributes.position.count; const P = new Float32Array(n * 3), N = new Float32Array(n * 3), Cc = new Float32Array(n * 3); let o = 0; for (const g of gs) { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); Cc.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; } const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); out.setAttribute('color', new THREE.BufferAttribute(Cc, 3)); return out; };
    const sm = (a, b, t) => { t = Math.max(0, Math.min(1, (t - a) / (b - a))); return t * t * (3 - 2 * t); };
    // the body: an egg, fullest low down, narrowing to the neck; white down the front, the line of it rising to a point under the chin
    const prof = [[0, 0.015], [0.07, 0.022], [0.135, 0.06], [0.172, 0.12], [0.188, 0.2], [0.182, 0.28], [0.16, 0.35], [0.13, 0.41], [0.108, 0.455], [0.095, 0.49], [0, 0.5]].map(([r, y]) => new THREE.Vector2(r, y));
    const body = new THREE.LatheGeometry(prof, 22); body.scale(1, 1, 0.92); body.computeVertexNormals();
    paint(body, (x, y, z) => { const a = Math.abs(Math.atan2(x, z)), lim = 1.2 - 0.75 * sm(0.24, 0.47, y); return a < lim && y < 0.48 ? WHT : BLK; });
    // the head, the face white round the cheeks under black brows; eyes; the beak; the bow tie; a short tail
    const head = new THREE.SphereGeometry(0.1, 16, 12); head.translate(0, 0.545, 0.01);
    paint(head, (x, y, z) => { const a = Math.abs(Math.atan2(x, z - 0.01)); return (a < 1.05 && y < 0.548 && z > 0.02) ? CRM : BLK; });
    const parts = [body, head];
    for (const sd of [-1, 1]) {
      const e = new THREE.SphereGeometry(0.02, 8, 6); e.translate(sd * 0.042, 0.572, 0.088); parts.push(solid(e, WHT));
      const p = new THREE.SphereGeometry(0.012, 8, 6); p.translate(sd * 0.044, 0.574, 0.103); parts.push(solid(p, BLK));
      const tie = new THREE.ConeGeometry(0.03, 0.05, 4); tie.rotateZ(sd * Math.PI / 2); tie.translate(sd * 0.026, 0.448, 0.118); parts.push(solid(tie, RED));
    }
    { const k = new THREE.SphereGeometry(0.014, 6, 5); k.translate(0, 0.448, 0.124); parts.push(solid(k, RED)); }
    { const b = new THREE.ConeGeometry(0.026, 0.085, 8); b.rotateX(Math.PI / 2 + 0.18); b.translate(0, 0.532, 0.135); parts.push(solid(b, ORG)); }
    { const t = new THREE.ConeGeometry(0.05, 0.1, 5); t.rotateX(-Math.PI / 2 - 0.5); t.translate(0, 0.06, -0.17); parts.push(solid(t, BLK)); }
    // a flipper: a flat paddle hanging from the shoulder, black outside and white under
    const flip = sd => { const f = new THREE.SphereGeometry(1, 10, 8); f.scale(0.024, 0.16, 0.068); f.translate(0, -0.14, 0); f.computeVertexNormals(); return paint(f, (x, y, z, nx) => (nx * sd > 0.1 ? BLK : nx * sd < -0.3 ? WHT : BLK)); };
    // a foot: a flat orange paddle, three toes splayed at the front
    const foot = (() => { const fs = [solid(new THREE.BoxGeometry(0.05, 0.022, 0.05), ORG)]; fs[0].translate(0, 0.011, 0.01); for (const a of [-0.45, 0, 0.45]) { const t = new THREE.BoxGeometry(0.02, 0.018, 0.075); t.translate(0, 0.009, 0.0375); t.rotateY(a); t.translate(0, 0, 0.025); fs.push(solid(t, ORG)); } return merge(fs); })();
    return { body: merge(parts), flipL: merge([flip(-1)]), flipR: merge([flip(1)]), foot };
  },
  _penguins(k) {
    const G = this._penguinGeo(), N = 3;
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, emissive: new THREE.Color(0.2, 0.2, 0.24) });
    mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vColor;'); };
    const mk = (geo, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; this.g.add(m); return m; };
    this.pm = { body: mk(G.body, N), fl: mk(G.flipL, N), fr: mk(G.flipR, N), foot: mk(G.foot, N * 2) };
    this.pens = []; for (let i = 0; i < N; i++) this.pens.push({ i, state: 'home', lane: i % 2 ? -1.35 : 1.35, x: 0, y: 0, z: 0, yaw: 0, ph: Math.random() * TAU, lie: 0, flap: 0, t: 0 });
    for (const p of this.pens) this._posePen(p);
    for (const m of Object.values(this.pm)) m.instanceMatrix.needsUpdate = true;
    this.puffs = k.puffs(140, { color: 0xc8d4ee, size: 0.06 });
    this.smoke = k.puffs(36, { color: 0x6c7484, size: 0.5 }); this.smokeT = 0;
    this.penT = 20;                                // (until one comes out on its own)
    const sh = this.shop, run = this.L.run, at = s => run[Math.min(run.length - 1, Math.max(0, Math.round(s / 0.25)))];
    this.penAt = at;
    // the way out: from inside the door, out onto the top, and over to beside the gate (the start of its lane)
    const g0 = at(0.4);
    this.penStart = lane => ({ x: g0.x - g0.tz * lane, z: g0.z + g0.tx * lane });
    this.penDoor = [{ x: sh.door.x, z: sh.door.z - 0.5 }, { x: sh.door.x, z: sh.door.z + 0.9 }];
  },
  // Lay out one penguin's parts from its state: where it is, which way it faces, how far it has flopped (lie: 0
  // standing, 1 on its belly), its waddle phase, how far its flippers are out.
  _posePen(p) {
    const pm = this.pm, M = this._m1 || (this._m1 = new THREE.Matrix4()), R = this._m2 || (this._m2 = new THREE.Matrix4()), Tm = this._m3 || (this._m3 = new THREE.Matrix4()), E = this._eu || (this._eu = new THREE.Euler(0, 0, 0, 'YXZ'));
    if (p.state === 'home') { M.makeScale(0, 0, 0); pm.body.setMatrixAt(p.i, M); pm.fl.setMatrixAt(p.i, M); pm.fr.setMatrixAt(p.i, M); pm.foot.setMatrixAt(p.i * 2, M); pm.foot.setMatrixAt(p.i * 2 + 1, M); return; }
    const walk = p.state === 'out' || p.state === 'leave' || p.state === 'home2' ? 1 : 0, s = Math.sin(p.ph), lie = p.lie, li = lie * Math.PI / 2;
    // the root: on the snow, facing yaw, tipped with the slope (pitch, roll), rocking side to side as it waddles
    E.set(p.pitch || 0, p.yaw, (p.roll || 0) + walk * 0.13 * s * (1 - lie)); M.makeRotationFromEuler(E).setPosition(p.x, p.y, p.z);
    // flopped: tipped forward about the feet, and lifted so that its belly lies on the snow
    Tm.makeTranslation(0, 0.18 * Math.sin(li) + (p.hop || 0), -0.28 * Math.sin(li)); M.multiply(Tm); R.makeRotationX(li); M.multiply(R);
    pm.body.setMatrixAt(p.i, M);
    // flippers: down at its sides; out and flapping when it is pleased or in the air; swept back along it on its belly
    for (const sd of [-1, 1]) {
      const out = 0.16 + p.flap * (0.9 + 0.35 * Math.sin(p.t * 22)) + walk * 0.06 * (1 + s * sd);
      E.set(0.06 - lie * 0.25, 0, sd * out, 'XYZ'); R.makeRotationFromEuler(E); R.setPosition(sd * 0.165, 0.39, -0.01);
      Tm.multiplyMatrices(M, R); (sd < 0 ? pm.fl : pm.fr).setMatrixAt(p.i, Tm);
    }
    E.order = 'YXZ';
    // feet: stepping in turn as it waddles, kicking in turn as it scoots on its belly
    for (const sd of [-1, 1]) {
      const st = walk ? Math.max(0, s * sd) : 0, kick = p.state === 'scoot' ? Math.sin(p.ph * 2 + (sd > 0 ? Math.PI : 0)) * 0.5 : 0;
      R.makeRotationX(-st * 0.5 + kick - lie * 0.3); R.setPosition(sd * 0.065, 0.004 + st * 0.03, 0.07 + st * 0.03 - lie * 0.02);
      Tm.multiplyMatrices(M, R); pm.foot.setMatrixAt(p.i * 2 + (sd > 0 ? 1 : 0), Tm);
    }
  },
  // A penguin out of the shop: `race`, to race the toy that has just sat in the sled (it goes as you go); otherwise it
  // comes out to the gate on its own and goes down by itself (or, if the toy is at the gate, waits for it).
  _launch(race) {
    const k = this.k;
    if (race) {                              // one already out at the gate (or on its way there) races you
      const q = this.pens.find(p => p.state === 'wait' || p.state === 'out' || p.state === 'flop' || p.state === 'scoot' || (p.state === 'slide' && p.s < 3));
      if (q) { q.race = 'on'; q.crossed = false; q.won = false; this.racer = q; this._go(q); return q; }
    }
    const p = this.pens.find(q => q.state === 'home'); if (!p) { if (race) this.racer = null; return null; }
    // the lane: whichever side is free of other penguins still high on the run
    const busy = this.pens.filter(q => q !== p && q.state === 'slide' && q.s < 40).map(q => Math.sign(q.lane));
    p.lane = race ? 1.35 : busy.includes(1) ? -1.35 : busy.includes(-1) ? 1.35 : (Math.random() < 0.5 ? 1.35 : -1.35);
    const st = this.penStart(p.lane);
    p.path = [...this.penDoor, { x: st.x - 1.6, z: st.z }, st]; p.pi = 0; p.state = 'out'; p.lie = 0; p.flap = 0; p.hop = 0; p.t = 0; p.delay = 0.55;
    p.go = !!race; p.race = race ? 'on' : null; p.crossed = false; p.won = false; p.air = false; p.s = 0; p.v = 0; p.vy = 0; p.o = p.lane; p.pitch = 0; p.roll = 0;
    p.x = p.path[0].x; p.z = p.path[0].z; p.y = this.L.heightAt(p.x, p.z); p.yaw = 0;
    this.doorWant = 1; this.doorT = 0;
    if (race) this.racer = p;
    k.synth.note(880, 0.07, { type: 'square', vol: 0.012, at: 0.5 }); k.synth.note(700, 0.09, { type: 'square', vol: 0.012, at: 0.58 });
    return p;
  },
  _go(p) { p.go = true; if (p.state === 'wait') { p.state = 'flop'; p.t = 0; } },
  _penStep(p, dt) {
    const k = this.k, L = this.L, hAt = L.heightAt, K = this.tune, v = k.v;
    p.t += dt;
    const toward = (tx, tz, sp) => { const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz); if (d > 1e-3) { const want = Math.atan2(dx, dz); let dy = want - p.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; p.yaw += dy * Math.min(1, dt * 7); const m = Math.min(d, sp * dt); p.x += dx / d * m; p.z += dz / d * m; } return d; };
    // out of the toy's way, when it is on its feet (the toy has right of way: a penguin is never in it)
    if (p.state !== 'slide' && p.state !== 'home') {
      const dx = p.x - v.pos.x, dz = p.z - v.pos.z, d = Math.hypot(dx, dz), R = 0.42;
      if (d < R && d > 1e-4 && Math.abs(v.pos.y - p.y) < 0.8) { const m = R - d; p.x += dx / d * m; p.z += dz / d * m; if (!p.squawk || p.t - p.squawk > 2) { p.squawk = p.t; k.synth.note(930, 0.06, { type: 'square', vol: 0.014 }); k.synth.note(760, 0.08, { type: 'square', vol: 0.014, at: 0.07 }); } }
    }
    if (p.state === 'out' || p.state === 'leave' || p.state === 'home2') {
      if (p.t < (p.delay || 0)) { p.y = hAt(p.x, p.z); return; }            // (the door opens first)
      const w = p.path[p.pi], sp = p.state === 'out' ? 1.25 : 0.9;
      p.ph += dt * 11 * (sp / 1.25); p.y = hAt(p.x, p.z); p.pitch = 0; p.roll = 0;
      if (toward(w.x, w.z, sp) < 0.05) {
        p.pi++;
        if (p.pi >= p.path.length) {
          if (p.state === 'out') { p.state = p.go ? 'flop' : 'wait'; p.t = 0; p.waitT = 0; }
          else if (p.state === 'home2') { p.state = 'home'; this.doorWant = 0; }
          else { p.state = 'idle'; p.t = 0; }
          p.pi = p.path.length - 1;
        }
      }
      if (p.state === 'out' && p.pi >= 2 && this.doorWant) this.doorWant = 0;
      // the toy at the gate set off while it was still on its way: flop now and scoot the rest
      if (p.state === 'out' && p.go && p.pi >= 2) { p.state = 'flop'; p.t = 0; }
      return;
    }
    if (p.state === 'wait' || p.state === 'idle') {
      // standing about: turns its head this way and that (the whole of it: it is mostly head), a flap now and then
      p.ph = 0; p.y = hAt(p.x, p.z); p.flap = Math.max(0, Math.sin(p.t * 0.9 + p.i) - 0.85) * 4;
      if (p.state === 'wait') { const g0 = this.penAt(0.4); p.yaw += (Math.atan2(g0.tx, g0.tz) + Math.sin(p.t * 0.7) * 0.5 - p.yaw) * Math.min(1, dt * 3); p.waitT = (p.waitT || 0) + dt;
        if (p.go) { p.state = 'flop'; p.t = 0; }
        else if (p.waitT > 25 && !this.riding) { p.state = 'home2'; p.t = 0; p.delay = 0; p.path = [{ x: this.penDoor[1].x, z: this.penDoor[1].z }, { x: this.penDoor[0].x, z: this.penDoor[0].z }]; p.pi = 0; this.doorWant = 1; this.doorT = 0; this.waitCool = 40; } }
      else if (Math.hypot(v.pos.x - p.x, v.pos.z - p.z) > 16 && p.t > 3) p.state = 'home';            // (gone home, while nobody was watching)
      return;
    }
    if (p.state === 'flop') {
      // a little hop and down on its front, facing down the run
      const g0 = this.penAt(0.4), f = Math.min(1, p.t / 0.42);
      p.lie = f * f; p.hop = Math.sin(Math.PI * Math.min(1, p.t / 0.42)) * 0.12; p.y = hAt(p.x, p.z); p.flap = 0.5 * f;
      let dy = Math.atan2(g0.tx, g0.tz) - p.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; p.yaw += dy * Math.min(1, dt * 8);
      if (f >= 1) { p.hop = 0; p.lie = 1; p.state = 'scoot'; p.t = 0; this.puffs.emit(p.x, p.y + 0.05, p.z, 8, { spread: 0.25, up: 0.4, life: 0.7 }); k.synth.noise(0.12, { vol: 0.02, lp: 700 }); }
      return;
    }
    if (p.state === 'scoot') {
      // pushing itself along the flat top with its feet, to the start of its lane
      const st = this.penStart(p.lane); p.ph += dt * 9; p.flap = 0.25;
      const d = toward(st.x, st.z, 2.6); p.y = hAt(p.x, p.z); p.pitch = 0; p.roll = 0;
      if (d < 0.08) { p.state = 'slide'; p.s = 0.4; p.o = p.lane; p.v = Math.max(p.v || 0, 2.2); p.vy = 0; p.air = false; p.t = 0; }
      return;
    }
    if (p.state === 'slide') { this._penSlide(p, dt); return; }
    if (p.state === 'stop') {
      // up on its feet again, a flap of joy (more if it won), then off to one side of the run-out
      const f = Math.min(1, p.t / 0.6); p.lie = Math.min(p.lie, 1 - f * f); p.y = hAt(p.x, p.z); p.pitch *= 1 - f; p.roll *= 1 - f;
      p.flap = p.t > 0.6 ? Math.max(0, 1 - (p.t - 0.6) / (p.won ? 2.2 : 1.2)) : 0; p.hop = p.won && p.t > 0.6 && p.t < 2.4 ? Math.abs(Math.sin((p.t - 0.6) * 7)) * 0.07 : 0;
      if (p.t > (p.won ? 2.8 : 1.9)) { const r = this.penAt(p.s), side = p.lane > 0 ? 1 : -1, nx = -r.tz * side, nz = r.tx * side; p.state = 'leave'; p.hop = 0; p.path = [{ x: p.x + nx * (RUN_W + 1.6) + r.tx * 0.8, z: p.z + nz * (RUN_W + 1.6) + r.tz * 0.8 }]; p.pi = 0; }
    }
  },
  // Down the run: a sled's sums along the line of its lane (gravity down the slope, the snow under its belly a little
  // stickier than a sled's runners, the air), the same air off a crest as the sled gets, the same landings. Racing the
  // toy, it catches up when it has fallen behind (it does not slow down to let you win).
  _penSlide(p, dt) {
    const k = this.k, L = this.L, hAt = L.heightAt, K = this.tune, run = L.run, Gr = GRAVITY, end = L.runLen - 1.2;
    // (between the run's samples, a quarter metre apart: a penguin's line must be smooth, or the snow under it steps)
    const R = this._lr || (this._lr = { x: 0, z: 0, tx: 0, tz: 0 });
    const lane = s => { const f = Math.max(0, Math.min(run.length - 1.001, s / 0.25)), i = Math.floor(f), u = f - i, a = run[i], b = run[i + 1]; R.x = a.x + (b.x - a.x) * u; R.z = a.z + (b.z - a.z) * u; R.tx = a.tx + (b.tx - a.tx) * u; R.tz = a.tz + (b.tz - a.tz) * u; const l = Math.hypot(R.tx, R.tz) || 1; R.tx /= l; R.tz /= l; return R; };
    const posAt = (s, o) => { const r = lane(s); return [r.x - r.tz * o, r.z + r.tx * o]; };
    const gAt = (s, o) => { const [x, z] = posAt(s, o); return hAt(x, z); };
    // where the toy is, along the run (to race it, and to keep out of its way)
    let ts = -99, to = 0, tv = 0; const S = this.S;
    if (this.riding && S) { const nd = L.node(S.x, S.z); if (nd >= 0 && L.along[nd] >= 0) { ts = L.along[nd]; const r = lane(ts); to = -(S.x - r.x) * r.tz + (S.z - r.z) * r.tx; tv = Math.hypot(S.vx, S.vz); } }
    // its line: its lane, wobbling, and well clear of the toy when they are side by side
    let want = p.lane + Math.sin(p.t * 1.7 + p.i * 2) * 0.35;
    if (Math.abs(ts - p.s) < 2.2 && Math.abs(to - want) < 1.1) want = to + (want >= to ? 1.1 : -1.1);
    want = Math.max(-RUN_W + 0.45, Math.min(RUN_W - 0.45, want));
    p.o += (want - p.o) * Math.min(1, dt * 2.2);
    for (let n = Math.max(1, Math.ceil(dt * 120)), i = 0; i < n; i++) {
      const h = dt / n;
      if (!p.air) {
        const sl = (gAt(p.s + 0.4, p.o) - gAt(p.s - 0.4, p.o)) / 0.8, q = 1 + sl * sl;
        let a = -K.fall * Gr * sl / q - (0.24 / Math.sqrt(q) + K.air * p.v * p.v) * Math.sign(p.v);
        // (fallen behind the toy it is racing: it pushes on to close up, up to a little faster than the toy, never more;
        // and not in the last stretch, which is a straight race)
        if (p.race === 'on' && ts > -50 && p.s < ts - 1.5 && ts < FINISH_S - 20) a += Math.max(0, Math.min(3, (tv + Math.min(2.5, 0.35 * (ts - p.s)) - p.v) * 2));
        if (p.s > FINISH_S) a -= K.stop;
        p.v = Math.max(p.s < 4 ? 1.6 : 0, p.v + a * h);
        const y0 = p.y; p.s = Math.min(end, p.s + p.v * h);
        const g1 = gAt(p.s, p.o), yb = y0 + p.vy * h - 0.5 * Gr * h * h;
        if (yb - g1 > 2 * h * h + 0.0002 && p.v > 3) { p.air = true; p.y = yb; p.vy -= Gr * h; p.airT = 0; }
        else { p.vy = (g1 - y0) / h; p.y = g1; }
      } else {
        p.vy -= Gr * h; p.y += p.vy * h; p.s = Math.min(end, p.s + p.v * h); p.airT += h;
        const g1 = gAt(p.s, p.o);
        if (p.y <= g1) {
          const sl = (gAt(p.s + 0.3, p.o) - gAt(p.s - 0.3, p.o)) / 0.6, nl = Math.hypot(sl, 1), nx = -sl / nl, ny = 1 / nl, vn = p.v * nx + p.vy * ny;
          p.v -= vn * nx; p.y = g1; p.vy = sl * p.v; p.air = false;
          if (p.airT > 0.25) { const [x, z] = posAt(p.s, p.o); this.puffs.emit(x, g1 + 0.05, z, 12, { spread: 0.3, up: 0.6, life: 0.8 }); k.synth.note(820, 0.06, { type: 'square', vol: 0.01 }); }
        }
      }
    }
    const [x, z] = posAt(p.s, p.o), r = lane(p.s), rtx = r.tx, rtz = r.tz; p.x = x; p.z = z;
    // lying along the slope and across it, rolling a little as it wobbles; flippers out in the air
    const sl = (gAt(p.s + 0.35, p.o) - gAt(p.s - 0.35, p.o)) / 0.7, cr = (gAt(p.s, p.o + 0.25) - gAt(p.s, p.o - 0.25)) / 0.5;
    const yawW = Math.atan2(rtx, rtz) + (want - p.o) * 0.25 + Math.sin(p.t * 3.1 + p.i) * 0.06;
    let dy = yawW - p.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; p.yaw += dy * Math.min(1, dt * 6);
    const pw = p.air ? Math.max(-0.5, Math.min(0.5, -Math.atan2(p.vy, Math.max(1, p.v)) * 0.6)) : -Math.atan(sl);
    p.pitch += (pw - (p.pitch || 0)) * Math.min(1, dt * (p.air ? 3 : 10));
    p.roll = -Math.atan(cr) * 0.9 + Math.sin(p.t * 5.3 + p.i) * 0.08;
    p.flap += ((p.air ? 1 : 0.12) - p.flap) * Math.min(1, dt * 5);
    p.lie += ((p.air ? 0.95 : 0.88) - p.lie) * Math.min(1, dt * 4);               // (head up, to see where it is going)
    p.ph += dt * 3;
    if (Math.random() < dt * Math.min(1, p.v / 6) * 6) this.puffs.emit(x - rtx * 0.3, p.y + 0.03, z - rtz * 0.3, 1, { spread: 0.12, up: 0.25, life: 0.5, out: 0.2 });
    // past the line: who won (the toy's finish is in onFinish), and stopped
    if (p.race === 'on' && p.s >= FINISH_S && !p.crossed) { p.crossed = true; if (this.riding && !this.finished) { p.won = true; p.race = 'won'; k.say('The penguin wins.', 2.5); k.synth.note(988, 0.08, { type: 'square', vol: 0.016 }); k.synth.note(1318, 0.12, { type: 'square', vol: 0.016, at: 0.1 }); } }
    if ((p.s > FINISH_S && p.v < 0.25) || p.s >= end) { p.state = 'stop'; p.t = 0; p.v = 0; p.air = false; }
  },
  _pensStep(dt) {
    const k = this.k, sh = this.shop;
    // now and then one comes out on its own, if the toy is about the hill and nobody is on the run; and one comes out
    // to wait at the gate when the toy comes up to it
    const near = Math.hypot(k.pos.x - TOP.x, k.pos.z - TOP.z), active = this.pens.some(p => p.state !== 'home' && p.state !== 'idle');
    this.penT -= dt; this.waitCool = Math.max(0, (this.waitCool || 0) - dt);
    if (!this.riding && !active && !this.waitCool && k.close(this.gate, 9, 2.5)) { this._launch(false); this.penT = 30 + Math.random() * 15; }
    else if (this.penT <= 0 && !active && !this.riding) { const p = this._launch(false); if (p) p.go = true; this.penT = 30 + Math.random() * 15; }
    let any = false;
    for (const p of this.pens) { if (p.state === 'home') continue; any = true; this._penStep(p, dt); this._posePen(p); if (p.state === 'home') this._posePen(p); }
    // a penguin waiting at the gate with nobody coming: it goes down on its own after a while
    for (const p of this.pens) if (p.state === 'wait' && !p.go && p.waitT > 12 && !k.close(this.gate, 9, 2.5)) this._go(p);
    if (any || this._penAny) for (const m of Object.values(this.pm)) m.instanceMatrix.needsUpdate = true;
    this._penAny = any;
    // the door, swinging out and back
    if (this.doorWant) { this.doorT = (this.doorT || 0) + dt; if (this.doorT > 6) this.doorWant = 0; }
    const want = this.doorWant ? 1 : 0;
    if (this.doorOpen !== want) { this.doorOpen += Math.sign(want - this.doorOpen) * Math.min(Math.abs(want - this.doorOpen), dt * 2.2); const e = this.doorOpen * this.doorOpen * (3 - 2 * this.doorOpen); this.door.rotation.y = -e * 1.5; if (this.doorOpen === want) k.synth.note(want ? 300 : 220, 0.08, { type: 'triangle', vol: 0.02 }); }
    // smoke from the chimney
    this.smokeT -= dt; if (this.smokeT <= 0 && near < 40) { this.smokeT = 0.35 + Math.random() * 0.3; const c = this.chimney; this.smoke.emit(c.x, c.y, c.z, 1, { spread: 0.1, up: 0.5, life: 3.2, out: 0.15 }); }
    void sh;
  },

  active(k) { const p = k.pos; return !!this.L && p.x > AREA.x0 && p.x < AREA.x1 && p.z > AREA.z0 && p.z < AREA.z1; },
  update(dt, k) {
    if (this.t - (this.lastT ?? this.t) > 1) this._pensHome();            // (away from the hill a while: the penguins went home)
    this.t += dt; this.lastT = this.t; if (this.bulbs.u) this.bulbs.u.uT.value = this.t;
    if (k.close(this.at, 5, 1.5)) k.once('sled-start', 'The top of the sledding hill. A sled at the gate: the clock starts as you go.', 5);
    if (this.riding) this.timer.update(dt); else if (this.timer.state !== 'idle') this.timer.cancel();      // (the clock is for sleds)
    // the poles: the toy on its wheels (or low on its rotors) bends them as it goes through; then they spring back
    if (!this.riding && this.poles) { const v = k.v, n = this.L.node(v.pos.x, v.pos.z); if (n >= 0 && this.L.gap[n] < 1.5 && Math.abs(v.pos.y - this.L.heightAt(v.pos.x, v.pos.z)) < 0.6) this._poleHits({ x: v.pos.x, z: v.pos.z, vx: v.vel.x, vz: v.vel.z, yaw: v.yaw }, 0.12, (v.radius || 0.19) + 0.03, false); }
    // riding: the camera behind the sled along the way it is going, higher and further back the faster it goes. (The
    // chase camera swings after the toy's heading too slowly for a sled at speed.) main.js eases the camera towards
    // camClose at a rate of 6 a second (and where it looks at 14), frame by frame: so the spot asked for is led by as far
    // as that easing would leave it behind at this speed and this frame's length, to come out where it is meant to.
    if (this.riding && this.S) {
      const S = this.S, sp = Math.hypot(S.vx, S.vz), hd = sp > 1 ? Math.atan2(S.vx, S.vz) : S.yaw;
      if (this.camYaw == null) this.camYaw = hd;
      let dy = hd - this.camYaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; this.camYaw += dy * Math.min(1, dt * 4.5);
      const fx = Math.sin(this.camYaw), fz = Math.cos(this.camYaw), back = 1.75 + Math.min(0.9, sp * 0.06), up = 0.6 + Math.min(0.35, sp * 0.025);
      const cx = S.x - fx * back, cz = S.z - fz * back, cy = Math.max(S.y + up, this.L.heightAt(cx, cz) + 0.35);
      const lead = r => { const h = Math.max(dt, 1e-3); return h / (1 - Math.exp(-r * h)); }, la = lead(6), lb = lead(14);
      k.camClose = { at: { x: cx + S.vx * la, y: cy + S.vy * la, z: cz + S.vz * la }, look: { x: S.x + fx * 2.4 + S.vx * lb, y: S.y + 0.28 + S.vy * lb, z: S.z + fz * 2.4 + S.vz * lb } };
    } else this.camYaw = null;
    this._polesStep(dt);
    this._pensStep(dt);
    this.puffs.update(dt); this.smoke.update(dt);
  },
  _pensHome() {
    for (const p of this.pens || []) { p.state = 'home'; p.race = null; this._posePen(p); }
    if (this.pm) for (const m of Object.values(this.pm)) m.instanceMatrix.needsUpdate = true;
    this.racer = null; this.doorWant = 0; this.doorOpen = 0; if (this.door) this.door.rotation.y = 0;
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'sledding', name: `Sledding (under ${GOOD} s)`, ...this.at }] : []; },
  reset() { if (this.riding) this._off(''); if (this.timer) this.timer.cancel(); this._pensHome(); },
});
