// Jules Breton, The Song of the Lark (1884), Gallery 222. The word: song.
//
// High in his sky, over the girl's head, a lark is painted, very small. Look at the picture and that lark climbs out
// over the top of the frame, just above where it is painted, and settles on the top rail facing you, and sings. Then
// it goes up, as a skylark does, in a fluttering spiral, singing all the way, hangs there, and sets off round the
// gallery on a long looping flight, round behind you (its song goes round you), back along the wall and low across
// the floor in front of the picture, and up again to land on the frame. Below the picture the dawn comes up: a warm
// pool of early light spreads on the floor, and a glow on the wall behind the frame, and the field comes up in the
// light, young shoots in the earth stirring; three bells ring far off, as for the Angelus. While you keep looking it sings on the frame, and now and then
// rises and sings over the picture and comes down again. When you stop, it hops back over the rail into the sky it
// came from, and the light goes.
import * as THREE from 'three';
import { lifeFor, ease, ramp, shape, flight, hop } from '../paintlife.js';

const BS = 2.0;                        // the lark, larger than life (37 cm long) so that it reads across the room
const T_OUT = 0.5, T_PERCH = 1.1, T_UP = 2.3, T_HOVER = 4.3, T_LOOP = 4.7, T_LAND = 9.0, IDLE = 14;

lifeFor(94841, {
  title: /^The Song of the Lark/,
  word: 'song',
  stage: { out: 1.3, half: 1.4, above: 0.95 },
  wake: 2, ret: 1.8,

  build(L) {
    const P = L.pal, col = (h, a = 0.15) => P.near(h, a);
    // ---------------------------------------------------------- the lark: streaked earth-brown above, buff below, a crest
    const brown = [col('#7a5534'), col('#68472c'), col('#4f3622'), col('#8c6a43'), col('#9a7a52')], buff = col('#d3b98a'), streak = col('#5a3e26');
    const body = shape.ball(1, brown[0], 2);
    { const p = body.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i); p.setXYZ(i, p.getX(i) * 0.03 * (1 - 0.25 * Math.max(0, -z)), p.getY(i) * 0.027, z * 0.068); } body.computeVertexNormals(); }
    shape.paint(body, (c, n) => (n.y < -0.25 ? (L.rand() < 0.14 && c.z > 0.01 ? streak : buff) : L.rand() < 0.16 ? brown[2] : brown[[0, 1, 3, 4][Math.floor(L.rand() * 4)]]));
    const head = shape.move(shape.ball(0.022, brown[3], 1), 0, 0.02, 0.058);
    shape.paint(head, (c, n) => (n.y < -0.3 ? buff : n.z > 0.6 && n.y > -0.2 && n.y < 0.3 ? buff : brown[Math.floor(L.rand() * 4)]));
    const crest = shape.move(shape.cone(0.011, 0.032, 5, brown[1]), 0, 0.046, 0.046, -0.85);
    const beak = shape.move(shape.cone(0.0055, 0.018, 5, col('#c9a77a', 0.3)), 0, 0.016, 0.084, Math.PI / 2);
    const eyes = [-1, 1].map(s => shape.move(shape.ball(0.0042, col('#1c140e', 0.2), 0), s * 0.017, 0.025, 0.068));
    const tail = shape.move(shape.box(0.036, 0.005, 0.06, brown[2]), 0, 0.006, -0.088, 0.12);
    shape.paint(tail, c => (Math.abs(c.x) > 0.012 ? buff : null));
    const legs = [-1, 1].map(s => shape.move(shape.cyl(0.0025, 0.0025, 0.03, 4, col('#b48d6a', 0.3)), s * 0.009, -0.034, 0.008));
    const bird = shape.merge([body, head, crest, beak, ...eyes, tail, ...legs]); shape.move(bird, 0, 0, 0, 0, 0, 0, BS);
    // A wing, from the shoulder out along +x: brown, darker to the tip, the trailing edge pale.
    const wing = () => {
      const pts = [[0, 0.03], [0, -0.03], [0.055, 0.034], [0.06, -0.042], [0.11, 0.022], [0.115, -0.04], [0.15, -0.012]];
      const tri = [[0, 2, 1], [1, 2, 3], [2, 4, 3], [3, 4, 5], [4, 6, 5]], pos = [];
      for (const t of tri) for (const k of t) pos.push(pts[k][0], (k > 1 ? 0.003 : 0) * (pts[k][1] > 0 ? 1 : 0), pts[k][1]);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
      g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(pos.length), 3));
      shape.paint(g, (c, n, f) => (f >= 3 ? brown[2] : f === 1 ? buff : brown[f % 2 ? 1 : 3]));
      return shape.move(g, 0, 0, 0, 0, 0, 0, BS);
    };
    const rig = this.rig = L.rig(4, 3000, L.paint({ glow: 0.3, rough: 0.75, side: THREE.DoubleSide }));
    const gb = rig.geo(bird), gw = rig.geo(wing());
    this.body = rig.add(gb); this.wr = rig.add(gw); this.wl = rig.add(gw);
    // ---------------------------------------------------------- the dawn: a pool on the floor, a glow on the wall behind the frame
    // (the glow is on the wall, behind the canvas and frame, which hide it there: it shows round the frame, as the sky
    // round the sun he painted, low on the left)
    this.light = L.glows([
      { w: 2.8, d: 2.2, u: -0.15, out: 1.0, color: col('#ffa36a', 0.12), strength: 0.95 },
      { wall: true, w: 2.6, d: 3.0, u: -0.12, v: 0.2, color: col('#ff9058', 0.1), strength: 1.15 },
    ]);
    // and the field comes up in the light: young shoots in the earth, green, a few dry stalks, swaying
    const blade = new THREE.BufferGeometry();
    blade.setAttribute('position', new THREE.Float32BufferAttribute([-0.011, 0, 0, 0.011, 0, 0, -0.005, 0.6, 0.003, 0.011, 0, 0, 0.005, 0.6, 0.003, -0.005, 0.6, 0.003, -0.005, 0.6, 0.003, 0.005, 0.6, 0.003, 0.004, 1, 0.016], 3));
    blade.computeVertexNormals();
    const greens = [col('#6f9a45', 0.2), col('#86a852', 0.2), col('#9bb560', 0.2), col('#a8a35c', 0.2), col('#c9ac6c', 0.2)];
    const sm = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false });      // (lit by the dawn: they stand in its light)
    this.su = { uGrow: { value: 0 }, uTime: { value: 0 }, uC: { value: L.floor(-0.15, 0.95) } };
    sm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, this.su);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uGrow, uTime; uniform vec3 uC;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  { vec3 ip = instanceMatrix[3].xyz; float r = length((ip.xz - uC.xz) / vec2(1.25, 0.95)); vColor.rgb *= 0.55 + 0.45 * position.y;
    float g = clamp((uGrow * 1.25 - r) / 0.3, 0.0, 1.0);
    transformed.y *= g; transformed.xz *= 0.4 + 0.6 * g;
    float ph = ip.x * 7.0 + ip.z * 5.0; transformed.x += sin(uTime * 1.3 + ph) * 0.18 * position.y * position.y; transformed.z += cos(uTime * 1.1 + ph) * 0.1 * position.y * position.y; }`);
    };
    sm.customProgramCacheKey = () => 'lark-shoots';
    const N = 210, shoots = new THREE.InstancedMesh(blade, sm, N), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), E = new THREE.Euler();
    for (let i = 0; i < N; i++) {
      const a = L.rand() * Math.PI * 2, rr = Math.sqrt(L.rand()), u = -0.15 + Math.cos(a) * rr * 1.2, o = 0.95 + Math.sin(a) * rr * 0.85;
      L.floor(u, Math.max(0.12, o), V); V.y += 0.004;
      const h = 0.05 + L.rand() * 0.11 * (1.2 - rr * 0.6);
      shoots.setMatrixAt(i, M.compose(V, Q.setFromEuler(E.set((L.rand() - 0.5) * 0.4, L.rand() * 6.3, (L.rand() - 0.5) * 0.4)), S.set(1, h, 1)));
      shoots.setColorAt(i, greens[L.rand() < 0.82 ? Math.floor(L.rand() * 3) : 3 + Math.floor(L.rand() * 2)]);
    }
    this.shoots = L.add(shoots);

    // ---------------------------------------------------------- where it flies (stage terms: along, out, height above the floor)
    const ue = this.ue = -0.21 * (L.hw / 0.425);                // above where the lark is painted, in his sky
    const crown = L.crown - L.y, perchH = 0.036 * BS;
    const at = (u, o, h) => L.at(u, h + L.y - L.cy, o);
    this.hidden = at(ue, -L.wall + 0.02, crown - 0.075);
    this.perch = at(-(L.hw - 0.06), 0.03, crown + perchH);       // (on the top rail by its corner, clear of the picture light)
    const cx = ue + 0.1, co = 0.5, R = 0.38, TOP = Math.max(crown + 0.6, 2.8), spiral = [];
    for (let i = 0; i <= 20; i++) { const a = -Math.PI / 2 + i / 20 * Math.PI * 3.2, k = i / 20; spiral.push(at(cx + Math.cos(a) * R * (0.4 + 0.6 * Math.min(1, k * 3)), co + Math.sin(a) * R * (0.4 + 0.6 * Math.min(1, k * 3)) * 0.8, crown + 0.06 + k * (TOP - crown - 0.06))); }
    spiral[0] = this.perch.clone();
    this.up = flight(spiral, { closed: false });
    const top = spiral[spiral.length - 1];
    const loop = [top, at(1.5, 1.1, 2.9), at(2.7, 3.2, 3.0), at(1.4, 5.4, 3.3), at(-1.5, 5.7, 3.6), at(-3.1, 3.6, 3.0), at(-2.6, 1.7, 2.1), at(-1.6, 1.25, 1.0), at(-0.5, 1.15, 0.72), at(0.55, 1.2, 0.76), at(1.3, 0.92, 1.45), at(1.05, 0.55, 2.25), at(ue + 0.3, 0.28, crown + 0.22), this.perch.clone()];
    this.loop = flight(loop, { closed: false, tension: 0.4 });
    this.down = flight([top, at(ue + 0.55, 0.85, TOP - 0.2), at(ue + 0.4, 0.55, crown + 0.5), at(ue + 0.15, 0.2, crown + 0.15), this.perch.clone()], { closed: false });
    this.fly = new THREE.Vector3(); this.dir = new THREE.Vector3(); this.from = new THREE.Vector3(); this.tmp = new THREE.Vector3();
    this.M = new THREE.Matrix4(); this.W = new THREE.Matrix4(); this.R = new THREE.Matrix4(); this.T = new THREE.Matrix4(); this.F = new THREE.Matrix4(); this.Q = new THREE.Quaternion(); this.E = new THREE.Euler(0, 0, 0, 'YXZ'); this.S1 = new THREE.Vector3(1, 1, 1); this.SH = new THREE.Vector3(); this.SC = new THREE.Vector3(); this.V0 = new THREE.Vector3(0, 0, 0);
    this.rig.show(this.body, false); this.rig.show(this.wr, false); this.rig.show(this.wl, false);
    this.songAt = 0;
  },

  start(L) {
    // Three bells, far off, as at dawn.
    const v = L.voice(); for (let i = 0; i < 3; i++) v.bell(196, 0.2 + i * 1.7, 0.022, 4.5);
    this.songAt = 0; this.pause = 0;
  },
  back(L) { this.from.copy(this.fly); this.fromYaw = this.yaw || L.yawOut; },
  end() { this.rig.show(this.body, false); this.rig.show(this.wr, false); this.rig.show(this.wl, false); this.light.set(0, 0); this.light.set(1, 0); this.su.uGrow.value = 0; },
  reset(L) { this.end(L); },

  update(L, dt) {
    const t = L.t, ph = L.phase, showing = ph === 'wake' || ph === 'play';
    // ---- the light
    const dawn = showing ? ease.smooth(ramp(t, 0, 2.6)) * (1 + 0.05 * Math.sin(t * 0.8)) : (1 - ease.smooth(L.ret)) * (this.lastDawn || 1);
    if (showing) this.lastDawn = dawn;
    this.light.set(0, dawn); this.light.set(1, dawn);
    this.su.uGrow.value = showing ? ease.out(ramp(t, 0.4, 3.4)) : this.su.uGrow.value * (1 - ease.smooth(L.ret) * 0.08);
    if (ph === 'return') this.su.uGrow.value = (this.grow0 == null ? (this.grow0 = this.su.uGrow.value) : this.grow0) * (1 - ease.smooth(L.ret)); else this.grow0 = null;
    this.su.uTime.value = t + L.r; this.shoots.visible = this.su.uGrow.value > 0.003;
    // ---- the lark: where it is at show-time t (worked out afresh each frame, so any moment can be shown)
    let mode = 'hidden', flap = 0, fold = 1, sc = 1, yaw = L.yawOut, pitch = 0, roll = 0, sing = 0;
    const p = this.fly;
    if (showing) {
      let tt = t, idleK = -1;
      if (t > T_LAND + 6) { idleK = (t - T_LAND - 6) % IDLE; }
      if (t < T_OUT) mode = 'hidden';
      else if (t < T_PERCH) {                                    // over the rail, out of the sky it is painted in
        const s = ease.inOut((t - T_OUT) / (T_PERCH - T_OUT)); hop(this.hidden, this.perch, 0.07, s, p); sc = 0.55 + 0.45 * ease.out(s * 2); mode = 'perch'; fold = 1; flap = s < 0.6 ? Math.sin(s * 30) * 0.5 : 0;
      } else if (t < T_UP) { mode = 'perch'; p.copy(this.perch); sing = 1; }
      else if (t < T_HOVER) mode = 'up', tt = (t - T_UP) / (T_HOVER - T_UP);
      else if (t < T_LOOP) mode = 'hover';
      else if (t < T_LAND) mode = 'loop', tt = (t - T_LOOP) / (T_LAND - T_LOOP);
      else { mode = 'perch'; p.copy(this.perch); sing = ((t - T_LAND) % 4.5) < 2.2 ? 1 : 0; }
      // now and then, while you keep looking, a song flight over the picture
      if (idleK >= 0 && idleK < 4.2) {
        if (idleK < 2) { mode = 'up'; tt = idleK / 2; } else if (idleK < 2.4) mode = 'hover'; else { mode = 'down'; tt = (idleK - 2.4) / 1.8; }
      }
      if (mode === 'up') { const s = ease.in(Math.min(1, tt * 1.6)) * 0.35 + tt * 0.65; this.up.at(s, p); this.up.dir(s, this.dir); flap = Math.sin(t * Math.PI * 2 * 15) * 0.9; fold = 0; sing = 1; }
      else if (mode === 'hover') { this.up.at(1, p); p.y += Math.sin(t * 9) * 0.015; this.dir.set(L.nx, 0.6, L.nz).normalize(); flap = Math.sin(t * Math.PI * 2 * 17) * 0.8; fold = 0; sing = 1; }
      else if (mode === 'loop' || mode === 'down') {
        const F = mode === 'loop' ? this.loop : this.down, s = tt < 0.85 ? tt * 0.93 / 0.85 : 0.93 + 0.07 * ease.out((tt - 0.85) / 0.15);
        F.at(s, p); F.dir(s, this.dir); roll = -F.bank(s) * 0.8;
        // the lark's flight: bursts of wingbeats and short glides with the wings drawn in; gliding on the low pass
        const burst = (t * 1.7) % 1 < 0.6, low = p.y - L.y < 1.3;
        flap = mode === 'down' ? Math.sin(t * 40) * 0.25 + 0.35 : low ? 0.15 + Math.sin(t * 6) * 0.05 : burst ? Math.sin(t * Math.PI * 2 * 12) * 0.95 : 0.25;
        fold = !low && !burst && mode === 'loop' ? 0.35 : 0;
        if (tt > 0.9) { fold = 0; flap = 0.9 + Math.sin(t * 50) * 0.3; }      // flaring to land
        sing = mode === 'loop' ? (tt < 0.75 ? 1 : 0) : 1;
      }
      if (mode !== 'perch' && mode !== 'hidden') { yaw = Math.atan2(this.dir.x, this.dir.z); pitch = -Math.asin(Math.max(-1, Math.min(1, this.dir.y))) * 0.8; }
      else if (mode === 'perch' && t > T_PERCH) { yaw = L.yawOut + 0.75 + 0.3 * Math.sin(t * 0.6); pitch = sing ? -0.1 - 0.06 * Math.sin(t * 7) : 0.12 + 0.05 * Math.sin(t * 2.3); }
    } else if (ph === 'return') {
      // back over the rail into the painted sky: from wherever it is, by the perch, down behind the frame's top
      const s = ease.inOut(L.ret), mid = this.tmp.copy(this.perch).addScaledVector(this.V0.set(L.nx, 0, L.nz), 0.15); mid.y += 0.12;
      const a = 1 - s; p.set(a * a * this.from.x + 2 * a * s * mid.x + s * s * this.hidden.x, a * a * this.from.y + 2 * a * s * mid.y + s * s * this.hidden.y, a * a * this.from.z + 2 * a * s * mid.z + s * s * this.hidden.z);
      mode = s < 1 ? 'fly' : 'hidden'; flap = Math.sin(L.r * 70) * 0.8; fold = 0; sc = 1 - 0.45 * ramp(s, 0.75, 1); yaw = this.fromYaw + Math.atan2(Math.sin(L.yawOut + Math.PI - this.fromYaw), Math.cos(L.yawOut + Math.PI - this.fromYaw)) * s;
    }
    this.yaw = yaw;
    const vis = mode !== 'hidden';
    this.rig.show(this.body, vis); this.rig.show(this.wr, vis); this.rig.show(this.wl, vis);
    if (vis) this.pose(L, p, yaw, pitch, roll, flap, fold, sc);
    // ---- the song
    if (sing && showing) this.song(L, mode === 'perch' ? 0.75 : 1);
    L.voice().place(p.x, p.z, 16);
  },

  // Body at p; each wing from its shoulder: raised and lowered about the body's length (flap), swept back (fold).
  pose(L, p, yaw, pitch, roll, flap, fold, sc) {
    const r = this.rig, M = this.M, W = this.W, R = this.R, T = this.T, F = this.F;
    this.Q.setFromEuler(this.E.set(pitch, yaw, roll, 'YXZ'));
    M.compose(p, this.Q, this.SC.set(sc, sc, sc)); r.mat(this.body, M);
    for (const side of [1, -1]) {
      T.makeTranslation(side * 0.02 * BS, 0.014 * BS, 0.008 * BS);                  // the shoulder
      R.makeRotationZ(side * (flap * 0.95 + (fold > 0.5 ? -0.12 : 0.1)));            // up and down
      F.makeRotationY(side * fold * 1.5); R.multiply(F);                             // swept back along the body
      F.makeRotationX(-fold * 1.4); R.multiply(F);                                   // and turned on edge, to lie against its side
      F.makeScale(side, 1, 1); R.multiply(F);                                        // (the left one is the right, mirrored)
      W.copy(M).multiply(T).multiply(R);
      r.mat(side > 0 ? this.wr : this.wl, W);
    }
  },

  // A skylark's song: unbroken runs of trills, warbles, buzzes and rising whistles, high and quick.
  song(L, level) {
    const v = L.voice(), c = v.ctx; if (!c) return;
    if (!this.songAt || this.songAt < c.currentTime) this.songAt = c.currentTime + 0.05;
    const vol = 0.022 * level;
    while (this.songAt < c.currentTime + 0.3) {
      const at = this.songAt - c.currentTime, k = L.rand();
      let len = 0;
      if (k < 0.32) { const n = 5 + Math.floor(L.rand() * 8), f = 3000 + L.rand() * 1900, d = 0.028 + L.rand() * 0.015; for (let i = 0; i < n; i++) v.chirp(f * (1 + 0.04 * Math.sin(i)), f * 1.12, d, { at: at + i * (d + 0.014), vol }); len = n * (d + 0.014); }
      else if (k < 0.6) { const n = 4 + Math.floor(L.rand() * 5); for (let i = 0; i < n; i++) { const hi = i % 2 ? 2600 + L.rand() * 600 : 4300 + L.rand() * 1100; v.chirp(hi, hi * (0.8 + L.rand() * 0.5), 0.055, { at: at + i * 0.07, vol }); } len = n * 0.07; }
      else if (k < 0.78) { v.chirp(3400 + L.rand() * 800, 3000, 0.13, { at, vol: vol * 0.8, flutter: 55 + L.rand() * 30 }); len = 0.14; }
      else { v.chirp(1900 + L.rand() * 400, 5200 + L.rand() * 900, 0.09, { at, vol }); v.chirp(5000, 4200, 0.05, { at: at + 0.1, vol: vol * 0.7 }); len = 0.16; }
      this.songAt += len + 0.02 + L.rand() * 0.09;
    }
  },
});
