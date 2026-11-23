// Mary Cassatt, The Child's Bath (1893), Gallery 184. The word: bubble.
//
// Look at it and her rug comes out first: the red-orange carpet the basin stands on, with its olive and mustard
// lozenges and pink rosettes, rolls out from under the frame across the floor. The white basin with its mauve rim slides
// out onto it, and then the jug, white with pink flowers, as she painted it at the foot of the picture; it lifts, as if
// in an unseen hand, tips, and pours a stream of water into the basin, which fills, and splashes. Then the soap comes
// up: bubbles swell at the water's edge and float free, one after another, then a whole flight of them, iridescent in
// her mauves, greens and pinks, catching the light; they drift out towards you, bobbing and turning, rise over your
// head into the gallery, and pop, softly, in a ring of droplets (on the toy too, if they meet it). The jug sets itself
// down. Brahms's Wiegenlied (1868) plays, very quietly. While you keep looking the basin goes on giving up a bubble now
// and then; when you leave they keep coming a little while the toy is near, to play in; then the jug and the basin
// slide home under the frame and the rug rolls itself up after them.
//
// Never over a picture: the room's every canvas is guarded, and the bubbles are choreographed to stay low near the wall
// and rise only as they come out towards you (from the look camera, under the canvases and then over them).
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture, rng } from '../paintlife.js';

const RUG = { u: 0.24, w: 1.62, out: 1.5 };             // along, its width along the wall, how far out it reaches (m)
const K = 1.65;                                           // the basin and the jug, larger than life (the toy's own size)
const BASIN = [0.12, 0.74], JUG_IN = [0.56, 0.3], JUG_POUR = [0.56, 0.76, 0.5], JUG_REST = [0.7, 1.12];
const NBUB = 44, NSTREAM = 20, NSPL = 24;
const T_RUG = 0.15, T_RUGD = 0.95, T_BASIN = 0.8, T_JUG = 1.15, T_LIFT = 1.7, T_TIP = 2.3, T_POUR = 2.55, T_STOP = 4.4, T_DOWN = 5.0, T_SET = 5.8;
const T_BUB = 3.4;
// Brahms, Wiegenlied, Op. 49 No. 4 (1868)
const LULLABY = 'E5:.5 E5:.5 | G5:2 E5:.5 E5:.5 | G5:2 E5:.5 G5:.5 | C6 B5:1.5 A5:.5 | A5 G5 D5:.5 E5:.5 | F5 D5 D5:.5 E5:.5 | F5:2 D5:.5 F5:.5 | B5:.5 A5:.5 G5 B5 | C6:3';
const LULL_B = 'R | C4:3 | C4:3 | F3:3 | C4:3 | G3:3 | G3:3 | G3:3 | C4:3';

// When bubble n swells at the water's edge: a few, then a flight of them, then one now and then.
const TE = n => (n < 6 ? T_BUB + n * 0.42 : n < 30 ? T_BUB + 2.4 + (n - 6) * 0.11 : T_BUB + 5.1 + (n - 30) * 0.42);

lifeFor(111442, {
  title: /^The Child's Bath/,
  word: 'bubble',
  stage: { out: 1.6, half: 1.2, cam: { dist: 3.3, side: 0.5, height: 1.0, fov: 60, lookU: 0.15, lookOut: 0.9, lookH: 0.85, floorOut: 1.6 } },
  wake: 2, ret: 2.2,
  linger: { near: 3.5, max: 20 },

  build(L) {
    const P = L.pal, col = (h, a = 0.3) => P.near(h, a);
    this.v = new THREE.Vector3(); this.w = new THREE.Vector3(); this.q = new THREE.Quaternion(); this.m = new THREE.Matrix4(); this.e = new THREE.Euler(0, 0, 0, 'YXZ'); this.one = new THREE.Vector3(1, 1, 1); this.s3 = new THREE.Vector3();
    const at = this.at = (u, h, o, into = new THREE.Vector3()) => L.at(u, h + L.y - L.cy, o, into);
    // ---------------------------------------------------------- the rug, from the foot of the picture
    const reds = ['#c4552e', '#b84a2a', '#cf6436', '#a8402a'].map(c => col(c, 0.3).getStyle()), olive = col('#7d8a4a', 0.3).getStyle(), olive2 = col('#5f6e3c', 0.3).getStyle(), mustard = col('#d4a83e', 0.3).getStyle(), pink = col('#e2a0a0', 0.3).getStyle(), dark = col('#4a3a2a', 0.3).getStyle(), cream = col('#e8d8b0', 0.3).getStyle();
    const tex = canvasTexture(512, 512, (g, w, h) => {
      g.fillStyle = reds[0]; g.fillRect(0, 0, w, h);
      const R = L.rand;
      for (let i = 0; i < 1400; i++) { g.save(); g.translate(R() * w, R() * h); g.rotate(R() * Math.PI); g.globalAlpha = 0.3 + R() * 0.4; g.fillStyle = reds[Math.floor(R() * 4)]; g.beginPath(); g.ellipse(0, 0, 6 + R() * 14, 2 + R() * 3, 0, 0, 7); g.fill(); g.restore(); }
      g.globalAlpha = 1;
      // the border: a dark band, olive and mustard
      g.lineWidth = 22; g.strokeStyle = olive2; g.strokeRect(16, 16, w - 32, h - 32); g.lineWidth = 6; g.strokeStyle = mustard; g.strokeRect(32, 32, w - 64, h - 64);
      // lozenges, as her rug has them: olive, outlined in mustard, a pink rosette in each
      const lz = (cx, cy, s) => {
        g.beginPath(); g.moveTo(cx, cy - s); g.lineTo(cx + s * 0.8, cy); g.lineTo(cx, cy + s); g.lineTo(cx - s * 0.8, cy); g.closePath();
        g.fillStyle = olive; g.fill(); g.lineWidth = 7; g.strokeStyle = mustard; g.stroke(); g.lineWidth = 2.5; g.strokeStyle = dark; g.stroke();
        for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28; g.fillStyle = pink; g.beginPath(); g.ellipse(cx + Math.cos(a) * s * 0.18, cy + Math.sin(a) * s * 0.18, s * 0.13, s * 0.07, a, 0, 7); g.fill(); }
        g.fillStyle = cream; g.beginPath(); g.arc(cx, cy, s * 0.08, 0, 7); g.fill();
      };
      for (const [cx, cy] of [[128, 140], [384, 140], [256, 256], [128, 372], [384, 372]]) lz(cx, cy, 88);
      for (let i = 0; i < 260; i++) { g.save(); g.translate(48 + R() * (w - 96), 48 + R() * (h - 96)); g.rotate(R() * Math.PI); g.globalAlpha = 0.18; g.fillStyle = [cream, dark, mustard][i % 3]; g.beginPath(); g.ellipse(0, 0, 8 + R() * 10, 1.5, 0, 0, 7); g.fill(); g.restore(); }
    });
    const rugMat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const o0 = L.floor(0, 0);
    this.ru = { uLen: { value: 0 }, uO: { value: new THREE.Vector2(o0.x, o0.z) }, uN: { value: new THREE.Vector2(L.nx, L.nz) } };
    rugMat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, this.ru);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uLen; uniform vec2 uO, uN;')
        .replace('#include <map_fragment>', '#include <map_fragment>\n  if (dot(lifeP.xz - uO, uN) > uLen) discard;');
    };
    rugMat.customProgramCacheKey = () => 'bath-rug';
    this.rug = L.decal({ w: RUG.w, d: RUG.out - 0.04, u: RUG.u, out: 0.04 + (RUG.out - 0.04) / 2, material: rugMat });
    // ---------------------------------------------------------- the rig: the rug's roll, the basin, its water, the jug
    const rig = this.rig = L.rig(8, 9000, L.paint({ glow: 0.3, rough: 0.5 }));
    const roll = shape.cyl(1, 1, RUG.w, 16, col('#b84a2a', 0.3)); shape.move(roll, 0, 0, 0, 0, 0, Math.PI / 2);         // (along x: turned below to lie along the wall)
    shape.paint(roll, (c, n) => (Math.abs(c.x) > RUG.w / 2 - 0.03 ? col('#5f6e3c', 0.3) : L.rand() < 0.3 ? col('#cf6436', 0.3) : null));
    this.rollI = rig.add(rig.geo(roll));
    const white = [col('#dfe4ea', 0.2), col('#f2f2ee', 0.2), col('#c4cbd8', 0.25)], mauve = col('#b98ab0', 0.3), light = new THREE.Vector3(-0.3, 0.8, 0.5).normalize();
    const basin = shape.lathe([[0.07, 0], [0.1, 0.012], [0.135, 0.05], [0.15, 0.078], [0.158, 0.088], [0.152, 0.092], [0.14, 0.082], [0.125, 0.05], [0.09, 0.016], [0.0, 0.012]], 28);
    shape.paint(basin, (c, n) => { const r = Math.hypot(c.x, c.z); if (c.y > 0.074 && r > 0.142) return mauve; const d = n.dot(light) + (L.rand() - 0.5) * 0.4; return d > 0.4 ? white[1] : d > -0.2 ? white[0] : white[2]; });
    shape.move(basin, 0, 0, 0, 0, 0, 0, K); this.basinI = rig.add(rig.geo(basin));
    const water = shape.lathe([[0.0, 0], [0.128, 0]], 28); shape.paint(water, () => (L.rand() < 0.25 ? col('#e6eef4', 0.2) : L.rand() < 0.5 ? col('#a9bccb', 0.2) : col('#bfd0dc', 0.2)));
    shape.move(water, 0, 0, 0, 0, 0, 0, K); this.waterI = rig.add(rig.geo(water));
    // the jug: white, a pink flower spray on its belly, a lip and a spout (towards +x), a handle
    const jug = shape.lathe([[0.0, 0], [0.05, 0], [0.058, 0.02], [0.066, 0.07], [0.06, 0.12], [0.046, 0.165], [0.044, 0.19], [0.052, 0.215], [0.05, 0.22], [0.04, 0.205], [0.0, 0.2]], 22);
    shape.paint(jug, (c, n) => { const fl = n.z > 0.45 && c.y > 0.035 && c.y < 0.13 && Math.abs(c.x) < 0.04; if (fl) { const q = L.rand(); return q < 0.45 ? col('#e07a8c', 0.25) : q < 0.6 ? col('#c94a5e', 0.25) : q < 0.8 ? col('#7f9a5a', 0.25) : white[1]; } if (c.y > 0.208) return col('#c9a95a', 0.2); const d = n.dot(light) + (L.rand() - 0.5) * 0.4; return d > 0.4 ? white[1] : d > -0.2 ? white[0] : white[2]; });
    const spout = shape.move(shape.cone(0.022, 0.05, 6, white[1]), 0.05, 0.208, 0, 0, 0, -Math.PI / 2 + 0.5);
    const handle = new THREE.TorusGeometry(0.045, 0.009, 6, 12, Math.PI * 1.15); handle.rotateZ(Math.PI / 2 - 0.1); handle.translate(-0.058, 0.12, 0);
    const hg = handle.toNonIndexed(); hg.deleteAttribute('uv'); const hc = new Float32Array(hg.attributes.position.count * 3); for (let i = 0; i < hc.length; i += 3) { hc[i] = white[0].r; hc[i + 1] = white[0].g; hc[i + 2] = white[0].b; } hg.setAttribute('color', new THREE.BufferAttribute(hc, 3));
    this.jugI = rig.add(rig.geo(shape.move(shape.merge([jug, spout, hg]), 0, 0, 0, 0, 0, 0, K)));
    for (const i of [this.rollI, this.basinI, this.waterI, this.jugI]) rig.show(i, false);
    // ---------------------------------------------------------- bubbles, the stream and the splashes: one instanced mesh of film
    const N = NBUB + NSTREAM + NSPL;
    const tint = [col('#b98ab0', 0.1), col('#7fa08a', 0.1), col('#e2a0a0', 0.1), col('#d8c070', 0.1)];
    this.bu = { uTime: { value: 0 }, uTint: { value: tint } };
    const bm = new THREE.ShaderMaterial({
      uniforms: this.bu, transparent: true, depthWrite: false,
      vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vK;
void main() {
  mat4 im = instanceMatrix; vec4 wp = modelMatrix * im * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix * im) * normal); vV = cameraPosition - wp.xyz; vK = instanceColor;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
      fragmentShader: `uniform float uTime; uniform vec3 uTint[4]; varying vec3 vN; varying vec3 vV; varying vec3 vK;
void main() {
  vec3 n = normalize(vN), v = normalize(vV); float c = abs(dot(n, v)), fr = pow(1.0 - c, 2.0);
  // a soap film: colours by its thickness, which swirls; her mauves, greens, pinks and gold through them
  float th = vK.r * 6.283 + (1.0 - c) * 5.5 + uTime * 0.7 + n.y * 2.5 + sin(n.x * 6.0 + uTime) * 0.6;
  vec3 film = 0.55 + 0.45 * cos(th + vec3(0.0, 2.1, 4.2));
  film = mix(film, uTint[int(mod(vK.r * 4.0, 4.0))], 0.3);
  vec3 r = reflect(-v, n);
  float hl = pow(max(dot(r, normalize(vec3(-0.35, 0.85, 0.4))), 0.0), 70.0) * 1.4 + pow(max(dot(r, normalize(vec3(0.5, 0.25, -0.6))), 0.0), 24.0) * 0.35;
  vec3 col; float a;
  if (vK.g > 0.5) { col = mix(vec3(0.78, 0.86, 0.95), film, 0.12) * (0.75 + 0.5 * fr) + hl; a = (0.5 + 0.4 * fr) * vK.b + hl; }
  else { col = film * (0.4 + 1.1 * fr) + hl; a = (0.06 + 0.8 * fr) * vK.b + hl * vK.b; }
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
}`,
    });
    const bg = new THREE.IcosahedronGeometry(1, 3); bg.deleteAttribute('uv');
    const im = this.bub = new THREE.InstancedMesh(bg, bm, N); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < N; i++) im.setColorAt(i, new THREE.Color(0, 0, 0)); im.instanceColor.setUsage(THREE.DynamicDrawUsage);
    im.count = 0; im.renderOrder = 5; L.add(im);
    this.C = new THREE.Color();
    this.pour = L.voice().loop({ lp: 2600, hp: 700 });
    this.toyP = new THREE.Vector3(); this.tmp = new THREE.Vector3(); this.tmp2 = new THREE.Vector3();
    this.basinP = at(BASIN[0], 0, BASIN[1]);
  },

  start(L, resumed) {
    if (resumed) return;
    this.clock = 0; this.popped = new Set(); this.toyPop = new Map();
    if (L.quiet) return;
    const v = L.voice(); [1318.5, 1567.98, 1975.53, 2637].forEach((f, i) => v.note(f, 1.6, { at: 0.05 + i * 0.13, vol: 0.01, type: 'sine', attack: 0.003 }));
    v.note(659.25, 2.2, { at: 0.05, vol: 0.008, type: 'sine', attack: 0.3 });
  },
  back(L) { this.ret0 = { len: this.ru.uLen.value, basin: this.basinU != null ? [this.basinU, this.basinO] : null, jug: this.jugM ? this.jugM.clone() : null, level: this.level || 0 }; },
  end(L) { for (const i of [this.rollI, this.basinI, this.waterI, this.jugI]) this.rig.show(i, false); this.bub.count = 0; this.ru.uLen.value = 0; this.rug.visible = false; this.pour.set(0); },
  reset(L) { this.end(L); },

  // ------------------------------------------------------------------ every frame
  update(L, dt) {
    const t = L.t, ph = L.phase, showing = ph === 'wake' || ph === 'play', rig = this.rig;
    // the bubbles' own clock: the show's, and on while they linger
    this.clock = showing ? t : (this.clock || t) + dt;
    // ---- the rug: rolled out, rolled up
    let len;
    if (showing || ph === 'linger') len = RUG.out * ease.inOut(ramp(t, T_RUG, T_RUGD));
    else len = this.ret0.len * (1 - ease.inOut(ramp(L.ret, 0.45, 0.95)));
    this.ru.uLen.value = len; this.rug.visible = len > 0.01;
    const rr = 0.012 + 0.05 * Math.sqrt(clamp01(1 - len / RUG.out));
    rig.show(this.rollI, len > 0.005 && len < RUG.out - 0.01 || (ph === 'return' && len > 0.005));
    { const p = L.floor(RUG.u, Math.max(0, len) + rr * 0.3, this.v); p.y += rr; this.q.setFromEuler(this.e.set(0, L.yawOut, 0)); this.s3.set(1, rr, rr); this.m.compose(p, this.q, this.s3); rig.mat(this.rollI, this.m); }
    // ---- the basin: out from under the frame onto the rug
    const goB = ph === 'return' ? 1 - ease.inOut(ramp(L.ret, 0.05, 0.5)) : ease.out(ramp(t, T_BASIN, T_BASIN + 0.7));
    const bo = lerp(-L.wall - 0.2, BASIN[1], goB), wob = showing ? Math.sin(t * 14) * 0.04 * Math.exp(-Math.max(0, t - T_BASIN - 0.7) * 4) * (t > T_BASIN + 0.7 ? 1 : 0) : 0;
    this.basinU = BASIN[0]; this.basinO = bo;
    rig.show(this.basinI, goB > 0.001);
    { const p = L.floor(BASIN[0], bo, this.v); this.q.setFromEuler(this.e.set(wob, L.yawOut, wob * 0.5)); this.m.compose(p, this.q, this.one); rig.mat(this.basinI, this.m); }
    // the water in it, rising as the jug pours
    const level = showing ? ease.inOut(ramp(t, T_POUR + 0.2, T_STOP + 0.2)) : ph === 'linger' ? 1 : this.ret0 ? this.ret0.level : 0;
    if (showing || ph === 'linger') this.level = level;
    rig.show(this.waterI, level > 0.01 && goB > 0.001);
    { const p = L.floor(BASIN[0], bo, this.v); p.y += (0.02 + 0.055 * level) * K; const k = 0.75 + 0.25 * level; this.q.setFromEuler(this.e.set(0, (this.clock || 0) * 0.3, 0)); this.s3.set(k, 1, k); this.m.compose(p, this.q, this.s3); rig.mat(this.waterI, this.m); }
    // ---- the jug
    const jug = this.jugPose(L, t, ph);
    // ---- bubbles, stream, splashes
    this.film(L, t, ph, jug);
    this.bu.uTime.value = this.clock;
    // ---- sound
    if (!L.quiet) {
      const cam = L.k.G.camera, near = Math.max(0, 1 - Math.hypot(cam.position.x - L.cx, cam.position.z - L.cz) / 10);
      this.pour.set(this.pouring ? 0.03 * near : 0, 0.15);
      if (showing && dt > 0 && t >= T_POUR + 0.4 && t - dt < T_POUR + 0.4) this.lullaby(L);
    }
    L.voice().place(this.basinP.x, this.basinP.z);
  },

  // The jug: out from under the frame, lifted, tipped to pour into the basin, set down on the rug; home again.
  jugPose(L, t, ph) {
    const rig = this.rig, A = this.tmp, B = this.tmp2; let u, o, h, tip = 0, show = true;
    if (ph === 'return') {
      if (!this.ret0 || !this.ret0.jug) { rig.show(this.jugI, false); this.pouring = false; return null; }
      const q = ease.inOut(ramp(L.ret, 0.0, 0.5)); this.ret0.jug.decompose(A, this.q, this.s3);
      const home = L.floor(JUG_IN[0], -L.wall - 0.2, B); A.lerp(home, q); A.y = lerp(A.y, L.y, q);
      this.m.compose(A, this.q, this.one); rig.mat(this.jugI, this.m); rig.show(this.jugI, q < 1); this.pouring = false; this.jugM = this.m.clone(); return null;
    }
    const tt = ph === 'linger' ? 99 : t;
    if (tt < T_JUG) { rig.show(this.jugI, false); this.pouring = false; return null; }
    if (tt < T_LIFT) { const q = ease.out(ramp(tt, T_JUG, T_JUG + 0.45)); u = JUG_IN[0]; o = lerp(-L.wall - 0.2, JUG_IN[1], q); h = 0; }
    else if (tt < T_TIP) { const q = ease.inOut(ramp(tt, T_LIFT, T_TIP)), dip = Math.sin(Math.PI * clamp01((tt - T_LIFT) / 0.25)) * -0.012; u = lerp(JUG_IN[0], JUG_POUR[0], q); o = lerp(JUG_IN[1], JUG_POUR[1], q); h = Math.max(0, JUG_POUR[2] * q + dip + Math.sin(Math.PI * q) * 0.08); }
    else if (tt < T_DOWN) { u = JUG_POUR[0]; o = JUG_POUR[1]; h = JUG_POUR[2] + Math.sin(tt * 2.1) * 0.006; tip = ease.inOut(ramp(tt, T_TIP, T_POUR + 0.1)) * (1 - ease.inOut(ramp(tt, T_STOP, T_STOP + 0.45))); }
    else { const q = ease.inOut(ramp(tt, T_DOWN, T_SET)); u = lerp(JUG_POUR[0], JUG_REST[0], q); o = lerp(JUG_POUR[1], JUG_REST[1], q); h = JUG_POUR[2] * (1 - q) + Math.sin(Math.PI * q) * 0.05; }
    // its spout (local +x) towards the basin; tipped about its own z
    const p = L.floor(u, o, A); p.y += h; const b = L.floor(BASIN[0], BASIN[1], B);
    const yaw = Math.atan2(-(b.z - p.z), b.x - p.x);
    this.q.setFromEuler(this.e.set(0, yaw, 0, 'YXZ')); const qt = new THREE.Quaternion().setFromAxisAngle(this.w.set(0, 0, 1), -tip * 1.25); this.q.multiply(qt);
    this.m.compose(p, this.q, this.one); rig.mat(this.jugI, this.m); rig.show(this.jugI, show); this.jugM = this.m.clone();
    this.pouring = tip > 0.55;
    return { m: this.m, tip };
  },

  // The film things: bubbles (from the water's edge), the stream (from the spout to the water), splashes and pops.
  film(L, t, ph, jug) {
    const im = this.bub, M = this.m, C = this.C; let k = 0;
    const put = (x, y, z, sx, sy, sz, qq, hue, kind, alpha) => { this.s3.set(sx, sy, sz); this.v.set(x, y, z); M.compose(this.v, qq || this.q.identity(), this.s3); im.setMatrixAt(k, M); im.setColorAt(k, C.setRGB(hue, kind, alpha)); k++; };
    const showing = ph === 'wake' || ph === 'play', bp = L.floor(BASIN[0], this.basinO == null ? BASIN[1] : this.basinO, this.tmp), wy = L.y + (0.02 + 0.055 * (this.level || 0)) * K;
    // ---- the stream: beads along a falling curve from the spout to the water, flowing
    if (jug && this.pouring) {
      const sp = this.w.set(0.075 * K, 0.214 * K, 0).applyMatrix4(jug.m), dir = this.tmp2.set(bp.x - sp.x, 0, bp.z - sp.z), dh = Math.hypot(dir.x, dir.z); dir.multiplyScalar(1 / (dh || 1));
      const fall = sp.y - wy, flow = clamp01((jug.tip - 0.55) / 0.2) * (1 - 0.0);
      for (let i = 0; i < NSTREAM; i++) {
        const s = ((i + (this.clock * 6) % 1) / NSTREAM), x = sp.x + dir.x * dh * 0.92 * s, z = sp.z + dir.z * dh * 0.92 * s, y = sp.y + 0.01 * s - fall * s * s;
        const r = 0.016 * (1 - 0.35 * s) * flow; put(x, y, z, r, r * 2.2, r, null, 0.1 + s, 1, 0.9);
      }
      // a splash where it lands
      for (let i = 0; i < 8; i++) { const a = i * 0.785 + this.clock * 3, age = (this.clock * 2.5 + i * 0.37) % 1, d = 0.02 + age * 0.06; put(bp.x + Math.cos(a) * d * 1.5, wy + Math.sin(age * Math.PI) * 0.07, bp.z + Math.sin(a) * d * 1.5, 0.008, 0.008, 0.008, null, 0.3, 1, 0.8 * (1 - age)); }
    }
    // ---- bubbles: each a pure function of its number and the clock
    const toy = L.k.G.vehicle, tp = toy && toy.group.visible ? this.toyP.copy(toy.pos) : null, R = this._r || (this._r = rng(1));
    const T = this.clock, retK = ph === 'return' ? L.ret : 0;
    if (showing || ph === 'linger' || ph === 'return') {
      let nb = 0;
      for (let n = 0; ; n++) {
        const te = TE(n); if (te > T || nb >= NBUB) break;
        if (ph === 'return' && te > (this.retT || 1e9)) break;
        // its nature, from its number
        const h1 = frac(Math.sin(n * 12.9898) * 43758.5), h2 = frac(Math.sin(n * 78.233) * 12345.7), h3 = frac(Math.sin(n * 39.425) * 24634.6), h4 = frac(Math.sin(n * 7.13) * 9182.3);
        const life = 4.2 + h2 * 3.8, age = T - te; if (age > life + 0.3) continue;
        const big = h4 > 0.84, r = (big ? 0.11 : 0.034 + h1 * 0.046) * (0.96 + 0.04 * Math.sin(age * 9 + n));
        // swelling at the water's edge, then floating free: out towards you, bobbing, rising more as it comes
        const a0 = h3 * 6.283, edge = 0.118 * K, sx0 = bp.x + Math.cos(a0) * edge * L.tx + Math.sin(a0) * edge * 0.6 * L.nx, sz0 = bp.z + Math.cos(a0) * edge * L.tz + Math.sin(a0) * edge * 0.6 * L.nz;
        const swell = clamp01(age / 0.45), fly = Math.max(0, age - 0.45);
        const along = h3 < 0.55, sideA = (along ? (h1 < 0.5 ? -1 : 1) * (1.05 + h2 * 0.35) : (h1 - 0.5) * 1.2) + Math.sin(fly * 0.9 + n) * 0.25, spd = (along ? 0.16 : 0.2) + h2 * 0.16, dx = L.nx * Math.cos(sideA) + L.tx * Math.sin(sideA), dz = L.nz * Math.cos(sideA) + L.tz * Math.sin(sideA);
        let x = sx0 + dx * spd * fly + L.tx * Math.sin(fly * 1.4 + n) * 0.06, z = sz0 + dz * spd * fly + L.tz * Math.sin(fly * 1.4 + n) * 0.06;
        let y = wy + r * swell + fly * (0.035 + 0.02 * h3) + fly * fly * (0.016 + 0.012 * h4) + Math.sin(fly * 2.3 + n) * 0.025 * Math.min(1, fly);
        // (the ceiling: under the pictures near the wall, as seen from where you look; higher further out)
        { const q = L.local(x, z), cap = L.y + 0.9 + Math.max(0, q.out - 1.7) * 0.9 - r; if (y > cap) y = cap - (y - cap) * 0.15; }
        // drawn to the toy, if it is near, and popped on it
        let popAt = te + life;
        if (tp && fly > 0) { const ddx = tp.x - x, ddz = tp.z - z, dd = Math.hypot(ddx, ddz); if (dd < 1.4) { const pull = Math.min(1, fly * 0.25) * (1 - dd / 1.4) * 0.5; x += ddx * pull; z += ddz * pull; y = lerp(y, L.y + 0.32, pull * 0.6); if (dd * (1 - pull) < 0.24 + r) { if (!this.toyPop.has(n)) this.toyPop.set(n, T); popAt = Math.min(popAt, this.toyPop.get(n)); } } }
        if (ph === 'return') popAt = Math.min(popAt, (this.retT || T) + 0.1 + h1 * 1.2);
        const pa = T - popAt;
        if (pa < 0) {
          // a soap bubble, wobbling a little
          const wb = 1 + 0.05 * Math.sin(age * 11 + n);
          if (k < NSTREAM * 2 + NBUB) put(x, y, z, r * swell * wb, r * swell / wb, r * swell, null, h1, 0, 1);
          nb++;
        } else if (pa < 0.28) {
          // popped: a ring of droplets, and a soft pip
          for (let i = 0; i < 5 && k < im.count + 1000; i++) { const a = i * 1.2566 + h3 * 6, d = r * (1 + pa * 9); put(x + Math.cos(a) * d * L.tx, y + Math.sin(a) * d * 0.7 - pa * pa * 2, z + Math.cos(a) * d * L.tz, 0.006, 0.006, 0.006, null, h1, 1, 1 - pa / 0.28); }
          if (!this.popped.has(n) && !L.quiet && pa < 0.05) { this.popped.add(n); const v = L.voice(); v.note(1500 + h2 * 900, 0.06, { vol: 0.01, type: 'sine', to: 700, attack: 0.002 }); }
        }
        if (k >= NBUB + NSTREAM + NSPL - 5) break;
      }
    }
    im.count = k; im.visible = k > 0;
    if (k) { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; }
    if (ph === 'return' && this.retT == null) this.retT = T; if (ph !== 'return') this.retT = null;
  },

  lullaby(L) {
    const v = L.voice(), bpm = 72;
    v.tune(LULLABY, { bpm, type: 'sine', vol: 0.016, legato: 0.9 });
    v.tune(LULLABY.replace(/([A-G]#?)(\d)/g, (m, n, o) => n + (+o - 1)), { bpm, type: 'triangle', vol: 0.006, legato: 0.8 });
    v.tune(LULL_B, { bpm, type: 'sine', vol: 0.012, legato: 0.95 });
  },
});

function frac(x) { return x - Math.floor(x); }
