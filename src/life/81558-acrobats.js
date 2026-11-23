// Pierre-Auguste Renoir, Acrobats at the Cirque Fernando (Francisca and Angelina Wartenberg) (1879), Gallery 201.
// The word: juggle.
//
// Look at it and the ring comes out first: his sawdust floor, warm ochre laid in feathery strokes, spreads out from
// under the frame across the gallery floor, and the low white ring wall with its red rail rises round it, open at the
// back where the performers come in. A drum roll, and his brushstrokes fly off the bottom rail in a flurry and settle
// into two small acrobats in the ring, in his gold-and-white costumes and yellow boots, made of nothing but his marks:
// Francisca, with her long dark hair, and Angelina with her arms full of oranges, as he painted them. Ta-da. They run
// down to the front, bow, and the unseen crowd claps.
//
// Then Angelina tosses her oranges to her sister one by one, and Francisca juggles them, and the galop strikes up
// (Offenbach's Galop infernal, 1858, the circus music of Paris then); then the two of them pass all five between
// them in a great wheel of oranges, high over the ring and back low, each orange leaving a trail of orange strokes in
// the air. At the end the wheel comes down into Angelina's arms, Francisca cartwheels across the ring to a drum roll
// and lands with her arms up on the cymbal, the crowd roars, and oranges come flying in from the seats behind you
// and roll on the sawdust, as they lie on the floor in the picture. While you keep looking they go on with a gentler
// act; when you stop, they wave, and come apart into strokes that fly home under the frame, the oranges roll after
// them, and the ring goes back in.
//
// Never over the picture: everything happens on the floor and below about a metre, which from where you stand to look
// is always below the canvas; the ring is set to the left of the picture, towards the corner, clear of Paris Street's
// wet paving to its right.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture } from '../paintlife.js';
import { strokes } from './strokes.js';

// ---------------------------------------------------------------- the ring and the marks (stage terms: along, out)
const RC = [-0.45, 1.36], RR = 0.6;                        // the ring's middle and radius (m)
const F_MARK = [-0.62, 1.38], A_MARK = [-0.1, 1.36];        // where Francisca and Angelina stand to juggle
const F_IN = [-0.54, 0.94], A_IN = [-0.32, 0.92];           // where they are made, just inside the ring's gate
const F_END = [-1.0, 1.5];                                 // where Francisca's cartwheel ends
const SC = 1.2;                                            // the girls are 0.6 m tall (built at half a metre)
const G = 0.75 * 9.8, B = 0.25;                            // gravity for the oranges (a little floaty), one juggling beat (s)
// the timeline (show seconds)
const T_MAKE = 0.2, T_MADE = 1.4, T_RUN = 1.45, T_BOW = 1.88, T_FEED = 2.4, T_CASC = 2.95, T_WHEEL = 4.45, T_DOWN = 6.05, T_CART = 7.0, T_LAND = 7.9, T_FINE = 9.0, IDLE = 6;
const WP = 1.6, WTH = 0.8, WDF = 0.2, WTL = 0.42;          // the wheel: period, high arc, dwell with F, low arc (dwell with A the rest)
// Offenbach, Orphée aux enfers, Galop infernal (1858): the tune, the bass and the chords, bar by bar (2/4)
const GALOP = 'C5:2 | D5:.5 F5:.5 E5:.5 D5:.5 | G5 G5 | G5:.5 A5:.5 E5:.5 F5:.5 | D5 D5 | D5:.5 F5:.5 E5:.5 D5:.5 | C5:.5 C6:.5 B5:.5 A5:.5 | G5:.5 F5:.5 E5:.5 D5:.5 | C5 R';
const GALOP_H = [['C3', 'G2', 'E4 G4'], ['G2', 'D3', 'F4 B4'], ['C3', 'G2', 'E4 G4'], ['C3', 'G2', 'E4 G4'], ['G2', 'D3', 'F4 B4'], ['G2', 'D3', 'F4 B4'], ['C3', 'G2', 'E4 G4'], ['G2', 'D3', 'F4 B4'], ['C3', null, 'E4 G4 C5']];
const BPM = 170, GALOP_AT = T_LAND - 16 * 60 / BPM;     // (sixteen beats to the cymbal, on her landing)

// ---------------------------------------------------------------- a girl, as bones (sizes in metres; she is half a metre)
const HIP = 0.255, THIGH = 0.118, SHIN = 0.112, UA = 0.082, FA = 0.078, SHX = 0.048, SHY = 0.128, NECK = 0.15, HP = 0.27;
const ROOT = 0, PELVIS = 1, TORSO = 2, HEAD = 3, UAL = 4, FAL = 5, UAR = 6, FAR = 7, THL = 8, SHL = 9, THR = 10, SHR = 11, NB = 12;
const AXIS_UP = new Set([TORSO, HEAD, PELVIS, ROOT]);

lifeFor(81558, {
  title: /^Acrobats at the Cirque Fernando/,
  word: 'juggle',
  stage: { out: 1.85, half: 1.35, cam: { dist: 2.75, side: 0.75, height: 0.92, fov: 50, lookU: -0.5, lookOut: 1.2, lookH: 0.6 } },
  wake: 2, ret: 2.2,

  build(L) {
    const P = L.pal, col = (h, a = 0.3) => P.near(h, a);
    this.v = new THREE.Vector3(); this.w = new THREE.Vector3(); this.q = new THREE.Quaternion(); this.m = new THREE.Matrix4(); this.e = new THREE.Euler(); this.one = new THREE.Vector3(1, 1, 1);
    const at = (u, h, o, into) => L.at(u, h + L.y - L.cy, o, into);
    this.at = at;

    // ---------------------------------------------------------- the sawdust ring: his floor, in his strokes
    const ochre = ['#c9a265', '#d4ae72', '#bf9558', '#dcbb86', '#c79c5c'].map(c => col(c, 0.35).getStyle());
    const dabs = ['#e8cfa0', '#d99a7c', '#e3b48c', '#a9a77a', '#c2884e', '#efd9b0', '#b98a5a', '#d6a35e'].map(c => col(c, 0.3).getStyle());
    const tex = canvasTexture(512, 512, (g, w, h) => {
      const c = w / 2, r = w * 0.47;
      g.save(); g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.clip();
      g.fillStyle = ochre[0]; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2200; i++) {                     // feathery dabs, every way, as he lays the ring's floor
        const a = L.rand() * Math.PI * 2, rr = Math.sqrt(L.rand()) * r, x = c + Math.cos(a) * rr, y = c + Math.sin(a) * rr;
        g.save(); g.translate(x, y); g.rotate(L.rand() * Math.PI); g.globalAlpha = 0.35 + L.rand() * 0.5;
        g.fillStyle = i < 900 ? ochre[Math.floor(L.rand() * ochre.length)] : dabs[Math.floor(L.rand() * dabs.length)];
        const len = 6 + L.rand() * 16; g.beginPath(); g.ellipse(0, 0, len, 1.6 + L.rand() * 2.4, 0, 0, Math.PI * 2); g.fill(); g.restore();
      }
      // a raked ring where the feet go round, and darker at the wall
      g.globalAlpha = 0.18; g.strokeStyle = col('#9a7444', 0.3).getStyle(); g.lineWidth = 26; g.beginPath(); g.arc(c, c, r * 0.93, 0, Math.PI * 2); g.stroke();
      g.globalAlpha = 0.12; g.lineWidth = 3; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(c, c, r * (0.55 + k * 0.06), 0, Math.PI * 2); g.stroke(); }
      g.restore();
    });
    const ringMat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.28, roughness: 0.95, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const wallPt = L.floor(-0.18, 0), cen = L.floor(RC[0], RC[1]);
    this.ru = { uSpread: { value: 0 }, uW: { value: new THREE.Vector2(wallPt.x, wallPt.z) }, uC: { value: new THREE.Vector2(cen.x, cen.z) }, uReach: { value: Math.hypot(RC[0] + 0.18, RC[1]) + RR }, uSh: { value: Array.from({ length: 10 }, () => new THREE.Vector4(0, 0, 1, 0)) } };
    ringMat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, this.ru);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSpread, uReach; uniform vec2 uW, uC; uniform vec4 uSh[10];')
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  float nz = dot(sampledDiffuseColor.rgb, vec3(0.4));
  diffuseColor.a *= smoothstep(0.0, 0.05, uSpread * uReach * 1.04 - length(lifeP.xz - uW) - nz * 0.07);
  float sh = 1.0; for (int i = 0; i < 10; i++) { vec4 s = uSh[i]; sh *= 1.0 - s.w * (1.0 - smoothstep(s.z * 0.25, s.z, length(lifeP.xz - s.xy))); }
  diffuseColor.rgb *= sh;
}`);
    };
    ringMat.customProgramCacheKey = () => 'acrobats-ring';
    this.ring = L.decal({ w: RR * 2 / 0.94, d: RR * 2 / 0.94, u: RC[0], out: RC[1], material: ringMat });

    // ---------------------------------------------------------- the ring wall and the oranges: one rig
    const rig = this.rig = L.rig(40, 16000, L.paint({ glow: 0.3, rough: 0.6 }));
    this.curbG = rig.geo(this.curb(L, col));
    this.curbI = rig.add(this.curbG);
    const orangeG = (() => {
      const r = 0.032, g = shape.ball(r, col("#e57f2c", 0.25), 1), light = new THREE.Vector3(-0.4, 0.8, 0.45).normalize();
      const cs = [col('#f3ad48', 0.25), col('#ea8a2e', 0.25), col('#d9661f', 0.25), col('#b8461c', 0.25), col('#f6c66a', 0.2)];
      shape.paint(g, (c, n) => { const d = n.dot(light), q = L.rand(); return d > 0.6 ? (q < 0.4 ? cs[4] : cs[0]) : d > 0.1 ? (q < 0.6 ? cs[1] : cs[0]) : d > -0.4 ? (q < 0.5 ? cs[2] : cs[1]) : cs[3]; });
      const stem = shape.move(shape.cyl(0.004, 0.003, 0.006, 5, col('#5b6a2c', 0.3)), 0, r, 0);
      return shape.merge([g, stem]);
    })();
    const og = rig.geo(orangeG);
    this.oranges = Array.from({ length: 8 }, (_, i) => ({ inst: rig.add(og), p: new THREE.Vector3(), air: false, spin: new THREE.Vector3(L.rand() - 0.5, L.rand() - 0.5, L.rand() - 0.5).normalize(), q0: new THREE.Quaternion().setFromEuler(new THREE.Euler(L.rand() * 6, L.rand() * 6, L.rand() * 6)), from: new THREE.Vector3(), trail: Array.from({ length: 5 }, () => new THREE.Vector3()), i }));
    for (const o of this.oranges) rig.show(o.inst, false);
    rig.show(this.curbI, false);

    // ---------------------------------------------------------- the girls, in his strokes
    this.S = strokes(L, 400);
    this.girls = [this.girl(L, col, 'F'), this.girl(L, col, 'A')];
    { const ids = new Map(); for (const g of this.girls) for (const p of g.parts) { if (!ids.has(p.geo)) ids.set(p.geo, rig.geo(p.geo)); p.inst = rig.add(ids.get(p.geo)); rig.show(p.inst, false); } }
    this.nFig = this.girls[0].strokes.length + this.girls[1].strokes.length;
    let k = 0;
    for (const g of this.girls) for (const s of g.strokes) { s.k = k; this.S.color(k++, s.c); }
    // the trails behind the oranges, and a puff of sawdust where she lands
    this.trailK = k; this.TR = 5; for (let i = 0; i < 8 * this.TR; i++) this.S.color(k++, col(['#f6b24a', '#f19a3a', '#ec8a34', '#f2c066', '#eea040', '#f7d48a'][i % 6], 0.2));
    this.puffK = k; this.NP = 10; for (let i = 0; i < this.NP; i++) this.S.color(k++, col(['#dcbb86', '#e8cfa0', '#c9a265', '#efd9b0'][i % 4], 0.3));
    this.S.colorsChanged();
    // where every stroke comes from: a place on the frame's bottom rail, and when it leaves
    const order = Array.from({ length: this.nFig }, (_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(L.rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    this.src = new Float32Array(this.nFig * 3); this.dl = new Float32Array(this.nFig); this.home = new Float32Array(this.nFig * 3);
    for (let i = 0; i < this.nFig; i++) {
      at((L.rand() - 0.5) * (2 * L.hw - 0.1), L.rail - L.y - 0.012 - L.rand() * 0.04, 0.03 + L.rand() * 0.05, this.v);
      this.src.set([this.v.x, this.v.y, this.v.z], i * 3); this.dl[i] = order.indexOf(i) / this.nFig;
    }
    this.mats = this.girls.map(() => Array.from({ length: NB }, () => new THREE.Matrix4()));
    this.inv = new THREE.Matrix4(); this.tmpM = new THREE.Matrix4(); this.tmpM2 = new THREE.Matrix4();
    this.ang = new Float32Array(NB);
    this.clapAt = 0; this.events = new Set();
    this.murmur = L.voice().loop({ lp: 650, hp: 160 });
    this.applause = L.voice().loop({ lp: 4200, hp: 1100 });
  },

  // The low ring wall, open at the back (towards the picture) for the performers to come in by: white, a red rail.
  curb(L, col) {
    const N = 60, gap = 0.36, h = 0.052, t = 0.022, pos = [], cl = [], add = (p, c) => { pos.push(...p); cl.push(c.r, c.g, c.b); };
    const white = [col('#e6e9e4', 0.25), col('#d5dce2', 0.3), col('#eef0ea', 0.2)], red = [col('#c8564a', 0.3), col('#d46a58', 0.3)], pink = col('#e09a8c', 0.3), shade = col('#b7bfc8', 0.3);
    const P = (a, r, y) => [Math.sin(a) * r, y, Math.cos(a) * r];
    for (let i = 0; i < N; i++) {
      const a0 = Math.PI + gap + (i / N) * (Math.PI * 2 - 2 * gap), a1 = Math.PI + gap + ((i + 1) / N) * (Math.PI * 2 - 2 * gap);
      const quad = (a, b, c, d, k) => { for (const p of [a, b, c, a, c, d]) add(p, k); };
      const w = white[i % 3];
      quad(P(a0, RR, 0), P(a1, RR, 0), P(a1, RR, h * 0.66), P(a0, RR, h * 0.66), w);                 // outside: white,
      quad(P(a0, RR, h * 0.66), P(a1, RR, h * 0.66), P(a1, RR, h), P(a0, RR, h), red[i % 2]);           // the red rail
      quad(P(a1, RR - t, 0), P(a0, RR - t, 0), P(a0, RR - t, h), P(a1, RR - t, h), i % 2 ? shade : white[1]);      // inside
      quad(P(a0, RR, h), P(a1, RR, h), P(a1, RR - t, h), P(a0, RR - t, h), pink);                      // the top
    }
    for (const a of [Math.PI + gap, Math.PI - gap]) { const s = a > Math.PI ? 1 : -1, q = (p1, p2, p3, p4) => { for (const p of [p1, p2, p3, p1, p3, p4]) add(p, red[0]); }; if (s > 0) q(P(a, RR - t, 0), P(a, RR, 0), P(a, RR, h), P(a, RR - t, h)); else q(P(a, RR, 0), P(a, RR - t, 0), P(a, RR - t, h), P(a, RR, h)); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.computeVertexNormals();
    return g;
  },

  // One of the sisters: a body painted in his colours, sculpted in a few soft volumes (one rig part to a bone), and his
  // strokes laid over it: { parts: [{ b, geo }], strokes: [{ b, x, y, z, s, j, c }] }, in metres, for a girl half a metre
  // tall (SC makes her larger).
  girl(L, col, who) {
    const out = [], parts = [], R = L.rand, F = who === 'F', light = new THREE.Vector3(-0.35, 0.75, 0.55).normalize(), n = new THREE.Vector3();
    const C = h => col(h, 0.25);
    const white = [C('#a9b8cc'), C('#d3dce4'), C('#f2f2ea'), C('#fbf7ea')], gold = [C('#b88a2e'), C('#dcb247'), C('#f0d27a')], skin = [C('#d6a08e'), C('#ecc4b2'), C('#f6dccd')];
    const tights = [C('#d9b2aa'), C('#efd4cc'), C('#f8e8e0')], boot = [C('#b98b2e'), C('#e0b443'), C('#f0d070')], hair = F ? [C('#2e1c14'), C('#4a2c1c'), C('#6b4026')] : [C('#5a3a22'), C('#7e5432'), C('#a37446')];
    const band = [C('#c9a23a'), C('#ecc94a'), C('#f6e08a')];
    const shade = (tri, nx, ny, nz, jit = 0.5) => { n.set(nx, ny, nz).normalize(); const d = n.dot(light) + (R() - 0.5) * jit; return d > 0.45 ? tri[2] : d > -0.15 ? tri[1] : tri[0]; };
    // ---- the body: soft volumes, each face a dab of one of three tones by the light
    const dab = (g, tri, fn) => shape.paint(g, (c, nn, f) => (fn && fn(c, nn, f)) || shade(tri, nn.x, nn.y, nn.z, 0.7));
    const part = (b, g) => parts.push({ b, geo: g });
    const sq = (g, sz) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * sz); g.computeVertexNormals(); return g; };
    part(PELVIS, dab(sq(shape.lathe([[0.0, -0.066], [0.042, -0.066], [0.054, -0.05], [0.057, -0.026], [0.05, 0.0], [0.043, 0.02], [0.0, 0.026]], 14), 0.82), white, c => (c.y < -0.056 ? gold[1 + (R() < 0.5 ? 1 : 0)] : null)));
    part(TORSO, shape.merge([
      dab(sq(shape.lathe([[0.0, 0.0], [0.043, 0.0], [0.042, 0.05], [0.045, 0.098], [0.039, 0.126], [0.02, 0.137], [0.0, 0.14]], 14), 0.72), white, c => (c.y < 0.014 ? gold[R() < 0.5 ? 1 : 2] : c.y > 0.12 && c.z > 0.01 ? gold[2] : null)),
      dab(shape.move(shape.cyl(0.0115, 0.0105, 0.03, 8), 0, 0.145, 0.002), skin),
      dab(shape.move(shape.ball(1, null, 1), 0, F ? 0.1 : 0.138, -0.028, 0, 0, 0, F ? 0.031 : 0.034, F ? 0.08 : 0.04, 0.011), hair)]));
    part(HEAD, dab(shape.move(shape.ball(0.031, null, 2), 0, 0.034, 0.004), skin, (c, nn) => (nn.z < 0.2 || nn.y > 0.62 || (nn.y > 0.38 && Math.abs(nn.x) > 0.5) ? hair[R() < 0.4 ? 0 : R() < 0.6 ? 1 : 2] : nn.y < -0.1 && Math.abs(nn.x) > 0.35 ? C('#eab0a0') : null)));
    const ua = shape.merge([dab(shape.move(shape.cyl(0.0125, 0.011, UA, 8), 0, -UA / 2, 0), skin), dab(shape.move(shape.ball(1, null, 1), 0, -0.01, 0, 0, 0, 0, 0.019, 0.017, 0.019), white)]);
    const fa = shape.merge([dab(shape.move(shape.cyl(0.0105, 0.009, FA, 8), 0, -FA / 2, 0), skin), dab(shape.move(shape.ball(0.0105, null, 1), 0, -FA - 0.003, 0.002), skin)]);
    const th = dab(shape.move(shape.cyl(0.02, 0.016, THIGH, 9), 0, -THIGH / 2, 0), tights);
    const sh = shape.merge([dab(shape.move(shape.cyl(0.0152, 0.0125, SHIN - 0.02, 8), 0, -(SHIN - 0.02) / 2, 0), tights),
      dab(shape.move(shape.cyl(0.0165, 0.0155, 0.04, 9), 0, -SHIN + 0.018, 0.002), boot), dab(shape.move(shape.ball(1, null, 1), 0, -SHIN + 0.008, 0.014, 0, 0, 0, 0.015, 0.009, 0.02), boot)]);
    for (const b of [UAL, UAR]) part(b, ua);
    for (const b of [FAL, FAR]) part(b, fa);
    for (const b of [THL, THR]) part(b, th);
    for (const b of [SHL, SHR]) part(b, sh);
    // ---- his strokes over it
    const put = (b, x, y, z, s, j, c) => out.push({ b, x, y, z, s: s * 1.35, j, c });
    const ell = (b, cx, cy, cz, rx, ry, rz, cnt, tri, s, j = 1.2, front = false) => { for (let i = 0; i < cnt; i++) { const u = R() * 2 - 1, a = R() * Math.PI * 2, k = Math.sqrt(1 - u * u); const nx = k * Math.sin(a); let nz = k * Math.cos(a); if (front && nz < 0.35) nz = 0.35 + R() * 0.6; put(b, cx + nx * rx, cy + u * ry, cz + nz * rz, s * (0.8 + R() * 0.4), (R() - 0.5) * j, shade(tri, nx, u, nz)); } };
    const tube = (b, len, r0, r1, cnt, tri, s, y0 = 0) => { for (let i = 0; i < cnt; i++) { const f = (i + 0.5) / cnt, a = (R() - 0.5) * 2.2 + (i % 2 ? 0.8 : -0.8), r = lerp(r0, r1, f); put(b, Math.sin(a) * r, y0 - f * len, Math.cos(a) * r, s * (0.85 + R() * 0.3), (R() - 0.5) * 0.4, shade(tri, Math.sin(a), 0, Math.cos(a))); } };
    // the bloomers, puffed, white with blue shadows; a gold fringe round the hem; the frill
    ell(PELVIS, 0, -0.022, 0.002, 0.061, 0.045, 0.05, 16, white, 0.042);
    for (let i = 0; i < 7; i++) { const a = -1.4 + i * 0.47; put(PELVIS, Math.sin(a) * 0.06, -0.054 - (i % 2) * 0.01, Math.cos(a) * 0.05, 0.024, (R() - 0.5) * 0.4, gold[1 + (i % 2)]); }
    for (let i = 0; i < 4; i++) { const a = -1.0 + i * 0.66; put(PELVIS, Math.sin(a) * 0.06, -0.068, Math.cos(a) * 0.05, 0.026, (R() - 0.5) * 0.5, white[3]); }
    // the bodice: white, gold scallops at the waist and gold at the neck (the puffed sleeves are the body's)
    ell(TORSO, 0, 0.07, 0.004, 0.047, 0.056, 0.035, 14, white, 0.042, 1.4, true);
    for (let i = 0; i < 6; i++) { const a = -1.3 + i * 0.52; put(TORSO, Math.sin(a) * 0.047, 0.016 + (i % 2) * 0.008, Math.cos(a) * 0.035, 0.026, (R() - 0.5) * 0.6, gold[i % 3]); }
    for (let i = 0; i < 3; i++) { const a = -0.7 + i * 0.7; put(TORSO, Math.sin(a) * 0.03, 0.122, 0.028, 0.02, (R() - 0.5) * 0.6, gold[2 - (i % 2)]); }
    // hair down her back: long for Francisca, to the shoulders for Angelina
    { const len = F ? 0.15 : 0.06, cnt = F ? 9 : 4; for (let i = 0; i < cnt; i++) { const f = (i + R()) / cnt, x = (R() - 0.5) * (F ? 0.058 : 0.066); put(TORSO, x, 0.17 - f * len, -0.04 - (1 - f) * 0.004, F ? 0.046 : 0.04, (R() - 0.5) * 0.35, hair[Math.floor(R() * 3)]); } }
    // the head: a face in pearly pinks, rosy cheeks, two dark eyes, a red mouth; brown hair; the yellow band and bow
    const hz = 0.004, hy = 0.034, r = 0.034, on = (x, y, rr = r) => [x, hy + y, hz + Math.sqrt(Math.max(0, rr * rr - x * x - y * y))];
    for (const [x, y, sz, c] of [[-0.012, -0.004, 0.02, skin[2]], [0.012, -0.004, 0.02, skin[2]], [0, -0.018, 0.018, skin[1]], [-0.017, -0.011, 0.013, C('#e89a8c')], [0.017, -0.011, 0.013, C('#e89a8c')]]) { const p = on(x, y); put(HEAD, p[0], p[1], p[2], sz, (R() - 0.5) * 1.2, c); }
    for (const sx of [-1, 1]) { const p = on(sx * 0.0105, 0.004, r + 0.001); put(HEAD, p[0], p[1], p[2], 0.0065, 0.15 * sx, C('#2a1e19')); }
    { const p = on(0, -0.016, r + 0.001); put(HEAD, p[0], p[1], p[2], 0.0075, 0, C('#c45a50')); }
    for (let i = 0; i < 9; i++) { const u = R() * 1.4 - 0.4, a = Math.PI + (R() - 0.5) * 3.4, k = Math.sqrt(1 - Math.min(1, u * u)); put(HEAD, Math.sin(a) * k * r * 1.06, hy + u * r * 1.04, hz + Math.cos(a) * k * r * 1.02, 0.028, (R() - 0.5) * 0.9, hair[Math.floor(R() * 3)]); }
    for (let i = 0; i < 3; i++) { const p = on((i - 1) * 0.013, 0.021); put(HEAD, p[0], p[1], p[2] + 0.002, F ? 0.016 : 0.02, 0.25 * (i - 1), hair[1 + (i % 2)]); }       // the fringe
    for (let i = 0; i < 5; i++) { const a = -1.7 + i * 0.85; put(HEAD, Math.sin(a) * r * 1.03, hy + 0.026 + Math.cos(a) * 0.003, hz + Math.cos(a) * r * 0.9, 0.02, (R() - 0.5) * 0.5, band[1 + (i % 2)]); }
    put(HEAD, F ? 0.02 : -0.012, hy + 0.036, -0.014, 0.03, 0.5, band[2]); put(HEAD, F ? 0.03 : -0.024, hy + 0.03, -0.018, 0.026, -0.7, band[1]);       // the bow
    // arms: bare, pearly
    for (const [u, f] of [[UAL, FAL], [UAR, FAR]]) { tube(u, UA - 0.02, 0.014, 0.0125, 3, skin, 0.03, -0.02); tube(f, FA, 0.0118, 0.0102, 3, skin, 0.028); }
    // legs: white-pink tights; the yellow boots, laced
    for (const [t, h] of [[THL, SHL], [THR, SHR]]) {
      tube(t, THIGH, 0.0215, 0.0175, 4, tights, 0.036); tube(h, SHIN - 0.03, 0.0165, 0.0138, 2, tights, 0.032);
      for (let i = 0; i < 3; i++) put(h, (R() - 0.5) * 0.018, -SHIN + 0.03 - i * 0.012, 0.012, 0.026, (R() - 0.5) * 0.6, boot[1 + (i % 2)]);
      put(h, 0, -SHIN + 0.024, 0.019, 0.011, Math.PI / 2, boot[0]);
    }
    return { who, strokes: out, parts, P: this.pose0(), hand: [new THREE.Vector3(), new THREE.Vector3()], handW: [new THREE.Vector3(), new THREE.Vector3()], handWt: [0, 0] };
  },
  pose0() { return { u: 0, out: 0, yaw: 0, lift: 0, roll: 0, flip: 0, bend: 0, lean: 0, hy: 0, hp: 0, fL: 0, sL: 0.05, kL: 0.03, fR: 0, sR: 0.05, kR: 0.03, hL: new THREE.Vector3(0.06, -0.02, 0.012), hR: new THREE.Vector3(-0.06, -0.02, 0.012), bob: 0 }; },

  start(L, resumed) {
    this.back0 = null;
    if (resumed || L.quiet) return;
    const v = L.voice(); this.roll(L, 0.05, 1.35, 0.02);
    v.note(523.25, 0.35, { at: 0.05, vol: 0.02, type: 'triangle' }); v.note(659.25, 0.35, { at: 0.2, vol: 0.02, type: 'triangle' });
    this.tada(L, T_MADE - 0.12);
    this.clapAt = 0; this.events.clear();
  },
  back(L) {
    // note where every stroke and orange is, to take them home from there
    this.back0 = { t: L.t };
    this.from = this.from || new Float32Array(this.nFig * 3); this.from.set(this.S.pos.subarray(0, this.nFig * 3));
    this.made = this.made || new Uint8Array(this.nFig);
    for (let i = 0; i < this.nFig; i++) { const t0 = T_MAKE + this.dl[i] * 0.85; this.made[i] = L.t >= t0 + 0.42 ? 2 : L.t > t0 ? 1 : 0; }
    for (const o of this.oranges) o.from.copy(o.p), o.fromOn = this.rig.mesh.getVisibleAt(o.inst);
    this.spread0 = this.ru.uSpread.value;
    if (!L.quiet) { const v = L.voice(); v.note(784, 0.15, { vol: 0.015, type: 'triangle' }); v.note(659, 0.25, { at: 0.12, vol: 0.015, type: 'triangle' }); }
  },
  end(L) { this.S.count = 0; this.S.flush(); for (const o of this.oranges) this.rig.show(o.inst, false); for (const g of this.girls) for (const p of g.parts) this.rig.show(p.inst, false); this.rig.show(this.curbI, false); this.ru.uSpread.value = 0; this.murmur.set(0); this.applause.set(0); },
  reset(L) { this.end(L); },

  // ------------------------------------------------------------------ every frame
  update(L, dt) {
    const t = L.t, ph = L.phase, showing = ph === 'wake' || ph === 'play', S = this.S;
    // ---- the ring
    let spread = showing ? ease.out(ramp(t, 0, 1.25)) : this.spread0 * (1 - ease.inOut(ramp(L.ret, 0.45, 1)));
    this.ru.uSpread.value = spread;
    const curbUp = showing ? ease.outBack(ramp(t, 0.55, 1.35)) : 1 - ease.inOut(ramp(L.ret, 0.35, 0.8));
    this.rig.show(this.curbI, curbUp > 0.01);
    if (curbUp > 0.01) { const c = L.floor(RC[0], RC[1]), s = 0.25 + 0.75 * Math.min(1, spread * 1.1); this.rig.put(this.curbI, c.x, L.y + 0.001, c.z, L.yawOut, 0, 0, this.w.set(s, Math.max(0.01, curbUp), s)); }
    // ---- the girls' poses, then their bones; the oranges; their hands (which follow the oranges)
    const tt = showing ? t : (this.back0 ? this.back0.t : t) + Math.min(0.6, L.r);       // (going home: a wave, then still)
    this.poseF(L, tt, this.girls[0].P, ph === 'return' ? L.ret : 0);
    this.poseA(L, tt, this.girls[1].P, ph === 'return' ? L.ret : 0);
    for (let g = 0; g < 2; g++) this.body(L, this.girls[g], this.mats[g]);
    this.juggle(L, tt, ph === 'return');
    for (let g = 0; g < 2; g++) this.arms(L, this.girls[g], this.mats[g]);
    // ---- their bodies: the paint fills in under the strokes as they arrive, and thins as they leave
    const grow = showing ? ease.out(ramp(t, T_MAKE + 0.55, T_MADE + 0.15)) : 1 - ease.inOut(ramp(L.ret, 0.12, 0.55));
    for (let g = 0; g < 2; g++) for (const p of this.girls[g].parts) {
      this.rig.show(p.inst, grow > 0.01);
      if (grow > 0.01) this.rig.mat(p.inst, this.tmpM.copy(this.mats[g][p.b]).multiply(this.tmpM2.makeScale(grow, grow, grow)));
    }
    // ---- strokes: made from the rail (Wake), on the bones (Play), home to the rail (Return)
    let k = 0;
    for (let g = 0; g < 2; g++) {
      const M = this.mats[g], ang = this.ang;
      for (let b = 0; b < NB; b++) { const e = M[b].elements; this.v.set(e[12], e[13], e[14]); this.w.set(0, AXIS_UP.has(b) ? 0.05 : -0.05, 0).applyMatrix4(M[b]); ang[b] = S.angle(this.v, this.w); }
      for (const s of this.girls[g].strokes) {
        this.v.set(s.x, s.y, s.z).applyMatrix4(M[s.b]); let x = this.v.x, y = this.v.y, z = this.v.z, sz = s.s * SC, turn = ang[s.b] + s.j;
        if (showing && t < T_MADE + 0.2) {                 // flying in from the rail
          const q = ease.inOut(ramp(t, T_MAKE + this.dl[s.k] * 0.85, T_MAKE + this.dl[s.k] * 0.85 + 0.42)), j = s.k * 3, sx = this.src[j], sy = this.src[j + 1], sz0 = this.src[j + 2];
          if (q <= 0) { sz = 0; } else if (q < 1) {
            const a = 1 - q, cy = Math.min(sy, y) - 0.04, cx = (sx + x) / 2 + L.nx * 0.12, cz = (sz0 + z) / 2 + L.nz * 0.12;
            x = a * a * sx + 2 * a * q * cx + q * q * x; y = a * a * sy + 2 * a * q * cy + q * q * y; z = a * a * sz0 + 2 * a * q * cz + q * q * z; sz *= 0.6 + 0.4 * q; turn += (1 - q) * 3;
          }
        } else if (ph === 'return' && this.back0) {        // and home again
          const q = ease.inOut(ramp(L.ret, 0.12 + this.dl[s.k] * 0.5, 0.12 + this.dl[s.k] * 0.5 + 0.34)), j = s.k * 3;
          const made = this.made[s.k], fx = made === 2 ? x : this.from[j], fy = made === 2 ? y : this.from[j + 1], fz = made === 2 ? z : this.from[j + 2], sx = this.src[j], sy = this.src[j + 1], sz0 = this.src[j + 2];
          if (made === 0) { S.set(k++, 0, 0, 0, 0, 0); continue; }
          if (q > 0) { const a = 1 - q, cy = Math.min(sy, fy) - 0.03, cx = (sx + fx) / 2 + L.nx * 0.1, cz = (sz0 + fz) / 2 + L.nz * 0.1; x = a * a * fx + 2 * a * q * cx + q * q * sx; y = a * a * fy + 2 * a * q * cy + q * q * sy; z = a * a * fz + 2 * a * q * cz + q * q * sz0; sz *= 1 - 0.7 * q; turn += q * 3; if (q >= 1) sz = 0; }
          else { x = fx; y = fy; z = fz; }
        }
        S.set(k++, x, y, z, sz, turn);
      }
    }
    // the oranges' trails
    const TR = this.TR; k = this.trailK;
    for (const o of this.oranges) {
      for (let i = 0; i < TR; i++) {
        if (!o.air || !o.trail) { S.set(k++, 0, 0, 0, 0, 0); continue; }
        const a = o.trail[i], b = i ? o.trail[i - 1] : o.p, f = 1 - i / TR;
        S.set(k++, a.x, a.y, a.z, 0.05 * f + 0.014, S.angle(a, b));
      }
    }
    // a puff of sawdust where Francisca lands, and where she takes off
    k = this.puffK;
    for (let i = 0; i < this.NP; i++) {
      const ta = i < 7 ? T_CART + 0.05 : T_LAND, age = showing ? t - ta : -1, p = i < 7 ? [F_MARK[0] - 0.05, F_MARK[1] + 0.05] : F_END;
      if (age < 0 || age > 0.7) { S.set(k++, 0, 0, 0, 0, 0); continue; }
      const a = (i / 7) * Math.PI * 2 + i, d = 0.04 + age * 0.22, c = L.floor(p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d * 0.7);
      S.set(k++, c.x, L.y + 0.01 + Math.sin(Math.min(1, age / 0.7) * Math.PI) * 0.05, c.z, 0.03 * (1 - age / 0.7), a);
    }
    S.count = k; S.flush();
    // ---- contact shadows on the sawdust: under the girls and the oranges near the floor
    let ns = 0; const SH = this.ru.uSh.value, vis = showing ? clamp01((t - T_MAKE - 0.3) / 0.9) : 1 - ramp(L.ret, 0.2, 0.7);
    for (let g = 0; g < 2; g++) { const Pg = this.girls[g].P, fp = L.floor(Pg.u, Pg.out, this.v); SH[ns++].set(fp.x, fp.z, 0.13 - Pg.lift * 0.15, 0.42 * vis * clamp01(1 - Pg.lift * 2)); }
    for (const o of this.oranges) if (ns < 10 && this.rig.mesh.getVisibleAt(o.inst) && o.p.y - L.y < 0.3) SH[ns++].set(o.p.x, o.p.z, 0.04, 0.5 * (1 - (o.p.y - L.y) / 0.3));
    for (; ns < 10; ns++) SH[ns].w = 0;
    // ---- sound
    if (!L.quiet) this.sound(L, t, dt, showing);
    L.voice().place(this.cen ? this.cen.x : L.cx, this.cen ? this.cen.z : L.cz);
  },

  // ------------------------------------------------------------------ poses
  // Francisca: made at the gate, runs down to her mark, bows, juggles, passes, cartwheels, bows; then a gentler act.
  poseF(L, t, o, ret) {
    const s = ease.smooth;
    this.stand(o, F_IN, 0);
    o.hL.set(0.016, 0.2, 0.075); o.hR.set(-0.016, 0.2, 0.075); o.hp = 0.15; o.hy = -0.2;            // as he painted her: hands up, looking up
    if (t > T_RUN) this.run(o, F_IN, F_MARK, t, T_RUN, T_BOW - 0.05);
    if (t > T_BOW - 0.05) { this.bow(o, t, T_BOW, 0.5); o.hp = lerp(o.hp, 0.15, 1 - ramp(t, T_BOW, T_BOW + 0.4)); }
    if (t > T_FEED - 0.15 && t < T_CART + 0.2) { o.hp = -0.25; o.hy = lerp(0, 0.4, s(ramp(t, T_WHEEL - 0.2, T_WHEEL + 0.3))); o.kL = o.kR = 0.08 + 0.03 * Math.sin(t * 25); const fr = s(ramp(t, T_WHEEL - 0.4, T_WHEEL)) * (1 - s(ramp(t, T_DOWN + 0.8, T_CART))); o.hR.lerp(this.w.set(-0.1, 0.05 + 0.01 * Math.sin(t * 5), 0.03), fr); }
    if (t > T_DOWN + 0.9) { this.stand(o, F_MARK, 0); this.cartwheel(o, t); }
    if (t > T_LAND) { o.u = F_END[0]; o.out = F_END[1]; o.roll = 0; o.lift = 0; this.legs(o, 0); o.hL.set(0.12, 0.27, 0.03); o.hR.set(-0.12, 0.27, 0.03); o.hp = -0.15; this.landing(o, t - T_LAND); }
    if (t > T_LAND + 0.55) this.bow(o, t, T_LAND + 0.6, 0.7, true);
    if (t > T_FINE) this.idleF(o, t);
    if (ret > 0) this.wave(o, ret, 1);
  },
  // Angelina: made holding her oranges, runs down, bows, feeds her sister, passes, gathers the oranges in, bows.
  poseA(L, t, o, ret) {
    this.stand(o, A_IN, 0); this.hold(o); o.hp = 0.12; o.hy = -0.15;
    if (t > T_RUN) this.run(o, A_IN, A_MARK, t, T_RUN + 0.05, T_BOW);
    if (t > T_BOW) this.bow(o, t, T_BOW + 0.04, 0.5, false, true);
    if (t > T_FEED - 0.2 && t < T_CASC + 2 * B) { o.hy = -0.45; o.hp = -0.1; let k = 0; for (const d of [-0.4, 0.5, 1.5]) { const thr = T_CASC + d * B - 0.42; k = Math.max(k, Math.sin(Math.PI * clamp01((t - thr + 0.12) / 0.3))); } o.hR.lerp(this.w.set(-0.06, 0.15, 0.1), k); o.bend = 0.08 * k; }
    if (t > T_CASC && t < T_WHEEL - 0.3) { o.hy = -0.35 + 0.05 * Math.sin(t * 2); o.hp = -0.2; o.bob = 0.004 * Math.sin(t * 6); }
    if (t > T_WHEEL - 0.3 && t < T_LAND) { o.hy = lerp(-0.35, -0.45, 0.5); o.hp = -0.3; o.kL = o.kR = 0.08 + 0.03 * Math.sin(t * 25 + 1); const fr = ease.smooth(ramp(t, T_WHEEL - 0.3, T_WHEEL)) * (1 - ease.smooth(ramp(t, T_DOWN, T_DOWN + 0.4))); o.hL.lerp(this.w.set(0.1, 0.05 + 0.01 * Math.sin(t * 5 + 1), 0.03), fr); }
    if (t > T_CART) { o.hy = lerp(-0.45, -0.75, ease.smooth(ramp(t, T_CART, T_CART + 0.4))); o.hp = -0.05; }
    if (t > T_LAND) { o.hy = -0.3; o.hp = -0.1; this.landing(o, t - T_LAND, 0.5); }
    if (t > T_LAND + 0.6) this.bow(o, t, T_LAND + 0.65, 0.7, false, true);
    if (t > T_FINE) this.idleA(o, t);
    if (ret > 0) this.wave(o, ret, -1);
  },
  stand(o, p, yaw) { o.u = p[0]; o.out = p[1]; o.yaw = yaw; o.lift = 0; o.roll = 0; o.flip = 0; o.bend = 0; o.lean = 0; o.bob = 0; this.legs(o, 0); },
  legs(o, skip) { o.fL = o.fR = 0; o.sL = o.sR = 0.05; o.kL = o.kR = 0.03; },
  hold(o) { o.hL.set(-0.022, 0.085, 0.058); o.hR.set(0.028, 0.068, 0.06); },
  // a skipping run from a to b, between t0 and t1, facing the way she goes, then turning to face the room
  run(o, a, b, t, t0, t1) {
    const q = ramp(t, t0, t1), e = ease.inOut(q), du = b[0] - a[0], dout = b[1] - a[1];
    o.u = lerp(a[0], b[0], e); o.out = lerp(a[1], b[1], e);
    const go = q > 0 && q < 1 ? 1 : 0, turn = Math.atan2(du, dout) * Math.sin(Math.PI * q);
    o.yaw = turn; const ph = (t - t0) * 15;
    if (go) { o.fL = 0.55 * Math.sin(ph); o.fR = -0.55 * Math.sin(ph); o.kL = 0.5 * Math.max(0, -Math.sin(ph)) + 0.1; o.kR = 0.5 * Math.max(0, Math.sin(ph)) + 0.1; o.lift = 0.025 * Math.abs(Math.sin(ph)); o.bend = 0.12; }
  },
  // a bow: bend at the hips, one foot back, arms out (or keep hold of the oranges)
  bow(o, t, t0, dur, big = false, holding = false) {
    const k = Math.sin(Math.PI * clamp01((t - t0) / dur)), e = ease.smooth(k);
    o.bend = (big ? 0.75 : 0.6) * e; o.fL = -0.3 * e; o.kL = 0.03 + 0.35 * e; o.kR = 0.03 + 0.18 * e; o.hp = o.hp + 0.4 * e;
    if (!holding) { o.hL.lerp(this.w.set(0.13, 0.06, -0.04), e); o.hR.lerp(this.v.set(-0.13, 0.06, -0.04), e); }
  },
  // a cartwheel to the left, across the front of the ring: round about the axis towards you
  cartwheel(o, t) {
    const t0 = T_CART, t1 = T_LAND, pre = 0.22;
    if (t < t0 + pre) {                                     // the run-up: a step, arms up
      const q = ease.smooth(ramp(t, t0, t0 + pre)); o.hL.set(0.11, 0.27, 0.02).multiplyScalar(0.3 + 0.7 * q); o.hR.set(-0.11, 0.27, 0.02).multiplyScalar(0.3 + 0.7 * q); o.fL = 0.3 * q; o.kR = 0.25 * q; o.yaw = 0; o.hp = -0.1;
      return;
    }
    const q = ramp(t, t0 + pre, t1), e = q < 0.5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q);
    o.u = lerp(F_MARK[0], F_END[0], e); o.out = lerp(F_MARK[1], F_END[1], e);
    o.roll = e * Math.PI * 2;                                // (anticlockwise as you see it, travelling left: hand, hand, foot, foot)
    o.lift = 0.02 * Math.sin(Math.PI * 2 * q) ** 2; o.sL = o.sR = 0.5 * Math.sin(Math.PI * Math.min(1, q * 1.25)); o.kL = o.kR = 0.02;
    o.hL.set(0.13, 0.25, 0.0); o.hR.set(-0.13, 0.25, 0.0); o.hp = 0; o.hy = 0;
  },
  // she lands: a dip at the knees and up
  landing(o, a, s = 1) { const d = Math.exp(-a * 7) * Math.sin(Math.min(Math.PI, a * 9)) * s; o.kL = o.kR = 0.03 + 0.5 * d; o.fL = o.fR = 0.22 * d; o.bend = 0.18 * d; o.lift = -0.012 * d; },
  wave(o, r, side) {
    const k = ease.smooth(ramp(r, 0, 0.12)) * (1 - ramp(r, 0.35, 0.5)), h = side > 0 ? o.hL : o.hR;
    h.lerp(this.w.set(side * (0.08 + 0.035 * Math.sin(r * 40)), 0.28, 0.03), k); o.hp = lerp(o.hp, -0.1, k);
  },
  // the gentler act, while you keep looking: Francisca goes back to her mark; Angelina feeds her three, she juggles them, and gives them back
  idleF(o, t) {
    const a = t - T_FINE;
    if (a < 1.0) { this.run(o, F_END, F_MARK, a + T_FINE, T_FINE, T_FINE + 1.0); o.hL.set(0.06, -0.02, 0.012); o.hR.set(-0.06, -0.02, 0.012); return; }
    this.stand(o, F_MARK, 0);
    const c = (a - 1.0) % IDLE;
    o.hL.set(0.016, 0.2, 0.075); o.hR.set(-0.016, 0.2, 0.075); o.hp = 0.12; o.hy = -0.2;
    if (c > 0.3 && c < 5.0) { o.hp = -0.25; o.hy = 0.05 * Math.sin(t * 1.3); }
    o.bob = 0.003 * Math.sin(t * 3);
  },
  idleA(o, t) {
    this.stand(o, A_MARK, 0); this.hold(o); o.hy = -0.3 + 0.08 * Math.sin(t * 0.9); o.hp = -0.05; o.bob = 0.003 * Math.sin(t * 2.4 + 1);
    const c = (t - T_FINE - 1.0) % IDLE; if (t > T_FINE + 1 && c < 0.8) { o.hy = -0.45; o.hp = -0.15; }
  },

  // ------------------------------------------------------------------ bones from a pose
  body(L, g, M) {
    const o = g.P, m = this.tmpM, e = this.e;
    const p = L.floor(o.u, o.out, this.v); p.y += o.lift + o.bob;
    // root: where she stands, turned, then round her middle (cartwheel), at HP
    M[ROOT].compose(p, this.q.setFromEuler(e.set(0, L.yawOut + o.yaw, 0)), this.w.set(SC, SC, SC));
    m.makeTranslation(0, HP, 0); M[ROOT].multiply(m); m.makeRotationZ(o.roll); M[ROOT].multiply(m); m.makeRotationX(o.flip); M[ROOT].multiply(m); m.makeTranslation(0, -HP, 0); M[ROOT].multiply(m);
    M[PELVIS].copy(M[ROOT]).multiply(m.makeTranslation(0, HIP, 0));
    M[TORSO].copy(M[PELVIS]).multiply(m.makeRotationX(o.bend)); if (o.lean) M[TORSO].multiply(m.makeRotationZ(o.lean));
    M[HEAD].copy(M[TORSO]).multiply(m.makeTranslation(0, NECK, 0)).multiply(m.makeRotationY(o.hy)).multiply(m.makeRotationX(o.hp));
    for (const [th, sh, sx, f, s, kn] of [[THL, SHL, 1, o.fL, o.sL, o.kL], [THR, SHR, -1, o.fR, o.sR, o.kR]]) {
      M[th].copy(M[PELVIS]).multiply(m.makeTranslation(sx * 0.026, 0, 0)).multiply(m.makeRotationZ(sx * s)).multiply(m.makeRotationX(-f));
      M[sh].copy(M[th]).multiply(m.makeTranslation(0, -THIGH, 0)).multiply(m.makeRotationX(kn));
    }
    this.cen = this.cen || L.floor(RC[0], RC[1]);
  },
  // Arms by reaching: each hand to its target (in the torso's own frame, or in the world when juggling).
  arms(L, g, M) {
    const o = g.P, inv = this.inv.copy(M[TORSO]).invert();
    for (let s = 0; s < 2; s++) {
      const sx = s === 0 ? 1 : -1, ua = s === 0 ? UAL : UAR, fa = s === 0 ? FAL : FAR;
      const T = this.v.copy(s === 0 ? o.hL : o.hR);
      if (g.handWt[s] > 0) T.lerp(this.w.copy(g.handW[s]).applyMatrix4(inv), g.handWt[s]);
      const Sx = sx * SHX, Sy = SHY, dx = T.x - Sx, dy = T.y - Sy, dz = T.z;
      let d = Math.hypot(dx, dy, dz); const ux = dx / (d || 1), uy = dy / (d || 1), uz = dz / (d || 1); d = Math.max(0.03, Math.min(UA + FA - 0.002, d));
      const A = Math.acos(clamp01((UA * UA + d * d - FA * FA) / (2 * UA * d)));
      // the elbow bends down and out, and a little back
      let px = sx * 0.5, py = -0.7, pz = -0.45; const pd = px * ux + py * uy + pz * uz; px -= ux * pd; py -= uy * pd; pz -= uz * pd; const pl = Math.hypot(px, py, pz) || 1; px /= pl; py /= pl; pz /= pl;
      const ca = Math.cos(A), sa = Math.sin(A), ex = ux * ca + px * sa, ey = uy * ca + py * sa, ez = uz * ca + pz * sa;
      const Ex = Sx + ex * UA, Ey = Sy + ey * UA, Ez = ez * UA, Hx = Sx + ux * d, Hy = Sy + uy * d, Hz = uz * d;
      let fx = Hx - Ex, fy = Hy - Ey, fz = Hz - Ez; const fl = Math.hypot(fx, fy, fz) || 1; fx /= fl; fy /= fl; fz /= fl;
      this.q.setFromUnitVectors(this.w.set(0, -1, 0), this.v.set(ex, ey, ez));
      M[ua].copy(M[TORSO]).multiply(this.tmpM2.compose(this.v.set(Sx, Sy, 0), this.q, this.one));
      this.q.setFromUnitVectors(this.w.set(0, -1, 0), this.v.set(fx, fy, fz));
      M[fa].copy(M[TORSO]).multiply(this.tmpM2.compose(this.v.set(Ex, Ey, Ez), this.q, this.one));
      // where the hand is in the world (the oranges in it ride there)
      g.hand[s].set(0, -FA, 0.004).applyMatrix4(M[fa]);
    }
  },

  // ------------------------------------------------------------------ the oranges
  // Every orange's place at show-time t, from the act's programme: in Angelina's arms, fed across, juggled in a cascade,
  // passed round the wheel, gathered back, or (the three from the crowd) flown in and rolled to rest. A pure function
  // of t (given where the girls stand now), so the trails are the same programme a moment earlier.
  juggle(L, t, going) {
    const F = this.girls[0], A = this.girls[1];
    F.handWt[0] = F.handWt[1] = A.handWt[0] = A.handWt[1] = 0;
    if (going) { this.goHome(L); this.drawOranges(L); return; }
    // the hands follow the act
    if (t >= T_FEED && t < T_WHEEL) { this.cascHands(L, t, T_CASC); F.handWt[0] = F.handWt[1] = ease.smooth(ramp(t, T_CASC - 0.35, T_CASC - 0.05)) * (1 - ease.smooth(ramp(t, T_WHEEL - 0.4, T_WHEEL))); }
    if (t >= T_WHEEL - 0.45 && t < T_DOWN + 1.2) {
      this.wheelHands(L, t); const w = ease.smooth(ramp(t, T_WHEEL - 0.45, T_WHEEL - 0.1)) * (1 - ease.smooth(ramp(t, T_DOWN + 0.55, T_DOWN + 0.9)));
      F.handWt[0] = w; A.handWt[1] = w;
    }
    if (t >= T_FINE + 1) { const c0 = T_FINE + 1 + Math.floor((t - T_FINE - 1) / IDLE) * IDLE, cs = c0 + 0.6 + B, stop = c0 + 4.6; if (t >= cs - 0.3 && t < stop + 0.9) { this.cascHands(L, t, cs); F.handWt[0] = F.handWt[1] = ease.smooth(ramp(t, cs - 0.3, cs)) * (1 - ease.smooth(ramp(t, stop + 0.6, stop + 0.9))); } }
    const TR = this.TR;
    for (const o of this.oranges) {
      const r = this.where(L, o.i, t, o.p);
      this.rig.show(o.inst, r >= 0); o.air = r === 1;
      if (o.air) for (let k = 0; k < TR; k++) { if (this.where(L, o.i, t - (k + 1) * 0.028, o.trail[k]) < 0) o.trail[k].copy(k ? o.trail[k - 1] : o.p); }
    }
    this.drawOranges(L);
  },
  // the hands of the juggler (stage terms) in the cascade: s 0 = her left (+u); phase 0..2 over a hand's cycle:
  // 0 the throw (inside), 1 the catch (outside); empty, out and up to catch; full, a scoop down and in
  hand(L, s, phase, into) {
    const F = this.girls[0].P, sx = s === 0 ? 1 : -1, p = ((phase % 2) + 2) % 2;
    let x, h;
    if (p < 1) { x = lerp(0.022, 0.078, ease.smooth(p)); h = 0.3 + 0.025 * Math.sin(Math.PI * p); }
    else { const q = p - 1; x = lerp(0.078, 0.022, ease.smooth(q)); h = 0.31 - 0.05 * Math.sin(Math.PI * q); }
    return this.at(F.u + sx * x * SC, h * SC, F.out + 0.075 * SC, into);
  },
  cascHands(L, t, t0) { const F = this.girls[0], beat = (t - t0) / B; this.hand(L, 0, beat, F.handW[0]); this.hand(L, 1, beat - 1, F.handW[1]); },
  // the cascade, three oranges: ball i at beat tau = (t - t0) / B + 2i; [0,2) left to right, [2,3) in the right,
  // [3,5) right to left, [5,6) in the left. Returns 1 in the air, 0 in a hand.
  casc(L, i, t, t0, into) {
    const tau = (t - t0) / B + 2 * i, s = ((tau % 6) + 6) % 6, a = this._ca || (this._ca = new THREE.Vector3()), b = this._cb || (this._cb = new THREE.Vector3());
    if (s < 2) { this.hand(L, 0, 0, a); this.hand(L, 1, 1, b); this.parab(a, b, s / 2, 2 * B, into); return 1; }
    if (s < 3) { this.hand(L, 1, 1 + (s - 2), into); return 0; }
    if (s < 5) { this.hand(L, 1, 0, a); this.hand(L, 0, 1, b); this.parab(a, b, (s - 3) / 2, 2 * B, into); return 1; }
    this.hand(L, 0, 1 + (s - 5), into); return 0;
  },
  parab(a, b, q, T, into) { into.lerpVectors(a, b, q); into.y += 0.5 * G * T * T * q * (1 - q); return into; },        // a throw of T seconds
  // Angelina's arms: where orange i sits as she holds them (her torso's frame)
  slot(i, into) { return into.set([-0.026, 0.0, 0.026, -0.013, 0.013][i], [0.088, 0.092, 0.086, 0.112, 0.11][i], [0.07, 0.078, 0.07, 0.066, 0.068][i]).applyMatrix4(this.mats[1][TORSO]); },
  // the wheel, both of them, five oranges: Angelina's right hand throws high to Francisca's left, which throws low back
  wheelHand(L, who, into) { const P = this.girls[who === 'F' ? 0 : 1].P; return this.at(P.u + (who === "F" ? 0.07 : -0.07) * SC, 0.31 * SC, P.out + 0.08 * SC, into); },
  wheelPhase(i, t) { return ((((t - T_WHEEL) / WP + [0.35, 0.55, 0.75, 0.95, 0.15][i]) % 1) + 1) % 1; },
  wheel(L, i, t, into) {
    const T = this.wheelPhase(i, t) * WP, a = this._wa || (this._wa = new THREE.Vector3()), b = this._wb || (this._wb = new THREE.Vector3());
    this.wheelHand(L, 'A', a); this.wheelHand(L, 'F', b);
    if (T < WTH) { this.parab(a, b, T / WTH, WTH, into); return 1; }
    if (T < WTH + WDF) { into.copy(b); into.y -= 0.02 * Math.sin(Math.PI * (T - WTH) / WDF); return 0; }
    if (T < WTH + WDF + WTL) { this.parab(b, a, (T - WTH - WDF) / WTL, WTL, into); return 1; }
    into.copy(a); into.y -= 0.02 * Math.sin(Math.PI * (T - WTH - WDF - WTL) / (WP - WTH - WDF - WTL)); return 0;
  },
  wheelHands(L, t) {
    // each hand dips with every orange that passes through it
    const F = this.girls[0], A = this.girls[1]; let f = 0, a = 0;
    for (let i = 0; i < 5; i++) { const T = this.wheelPhase(i, t) * WP; if (T >= WTH && T < WTH + WDF) f = Math.sin(Math.PI * (T - WTH) / WDF); if (T >= WTH + WDF + WTL) a = Math.sin(Math.PI * (T - WTH - WDF - WTL) / (WP - WTH - WDF - WTL)); }
    this.wheelHand(L, 'F', F.handW[0]); F.handW[0].y -= 0.025 * f; this.wheelHand(L, 'A', A.handW[1]); A.handW[1].y -= 0.025 * a;
  },
  // Where orange i is at t (into): -1 not out, 0 held or at rest, 1 in the air.
  where(L, i, t, into) {
    const pA = this._pa || (this._pa = new THREE.Vector3()), pB = this._pb || (this._pb = new THREE.Vector3()), pC = this._pc || (this._pc = new THREE.Vector3()), at = this.at;
    if (i >= 5) {      // the three from the crowd: from behind you, over the sawdust, a bounce or two, a roll
      const j = i - 5, t0 = T_LAND + 0.05 + j * 0.28; if (t < t0) return -1;
      const from = at(-0.1 - j * 0.35, 0.75, 3.6, pA), to = at([-0.55, -0.25, -0.72][j], 0.032, [1.5, 0.98, 0.9][j], pB), fl = 0.62, a = t - t0;
      if (a < fl) { this.parab(from, to, a / fl, fl, into); return 1; }
      const b = a - fl; at([-0.48, -0.3, -0.62][j], 0.032, [1.44, 0.93, 0.86][j], pC);
      into.lerpVectors(to, pC, ease.out(clamp01(b / 1.3))); into.y += Math.abs(Math.sin(b * 9)) * 0.06 * Math.exp(-b * 4); return b < 0.35 ? 1 : 0;
    }
    // out from under the frame and up into Angelina's arms, as she is made
    const tin = 0.75 + i * 0.12; if (t < tin) return -1;
    if (t < tin + 0.5) { at(-0.2 + i * 0.06, L.rail - L.y - 0.04, -L.wall - 0.03 + ramp(t, tin, tin + 0.12) * 0.1, pA); this.slot(i, pB); this.parab(pA, pB, ease.out(ramp(t, tin + 0.1, tin + 0.5)), 0.4, into); return 1; }
    let air = 0; this.slot(i, into);
    // fed to Francisca (0 lands in her left before beat 0, 1 in her right at beat 0.5, 2 in her left at beat 1.5), juggled
    const fed = (cs, end) => {
      const land = cs + [-0.4, 0.5, 1.5][i] * B, thr = land - 0.42, h = i === 1 ? 1 : 0;
      if (t < thr) return 0;
      if (t < land) { this.slot(i, pA); this.hand(L, h, 1, pB); this.parab(pA, pB, (t - thr) / 0.42, 0.42, into); return 1; }
      if (t < cs + i * B) { this.hand(L, h, 1 + clamp01((t - land) / (cs + i * B - land)), into); return 0; }
      if (end == null || t < end) return this.casc(L, i, t, cs, into);
      // given back: from where it is in the cascade at `end`, a toss into her arms
      if (t < end + 0.45) { this.casc(L, i, end, cs, pA); this.slot(i, pB); this.parab(pA, pB, (t - end) / 0.45, 0.45, into); return 1; }
      this.slot(i, into); return 0;
    };
    if (i < 3 && t >= T_FEED) air = fed(T_CASC, null);
    // into the wheel: the three from the cascade, and Angelina's two from her arms
    if (t >= T_WHEEL - 0.45) {
      const k = ease.inOut(ramp(t, T_WHEEL - 0.45, T_WHEEL)), kind = this.wheel(L, i, t, pC);
      if (k < 1) { into.lerp(pC, k); air = air || k > 0.5 ? 1 : 0; } else { into.copy(pC); air = kind; }
    }
    // the wheel comes down: from the first hand each orange reaches after T_DOWN, into Angelina's arms
    if (t >= T_DOWN) {
      const T0 = this.wheelPhase(i, T_DOWN) * WP, toF = (WTH + WDF * 0.5 - T0 + WP) % WP, toA = (WP - 0.05 - T0 + WP) % WP, viaF = toF < toA, tc = T_DOWN + (viaF ? toF : toA), fl = viaF ? 0.5 : 0.22;
      if (t >= tc) {
        this.wheelHand(L, viaF ? 'F' : 'A', pA); this.slot(i, pB);
        if (t < tc + fl) { if (viaF) this.parab(pA, pB, (t - tc) / fl, fl, into); else into.lerpVectors(pA, pB, ease.inOut((t - tc) / fl)); air = viaF ? 1 : 0; }
        else { into.copy(pB); air = 0; }
      }
    }
    // the gentler act, round and round while you look: fed, juggled, given back
    if (t >= T_FINE + 1 && i < 3) {
      const c0 = T_FINE + 1 + Math.floor((t - T_FINE - 1) / IDLE) * IDLE, cs = c0 + 0.6 + B;
      this.slot(i, into); air = fed(cs, c0 + 4.6 + 0.3 * i);
    }
    return air;
  },
  // going home: the oranges hop back to the frame and in under it
  goHome(L) {
    const r = L.ret, v = this.v;
    this.oranges.forEach((o, i) => {
      if (!o.fromOn) { this.rig.show(o.inst, false); o.air = false; return; }
      const q = ease.inOut(ramp(r, 0.1 + i * 0.05, 0.7 + i * 0.03)), mouth = this.at(-0.2 + (i % 5) * 0.06, 0.03, -L.wall - 0.04 * ramp(q, 0.85, 1), this._pa || (this._pa = new THREE.Vector3()));
      v.lerpVectors(o.from, mouth, q); v.y = lerp(o.from.y, mouth.y, q) + Math.abs(Math.sin(q * Math.PI * 3)) * 0.06 * (1 - q);
      o.p.copy(v); o.air = false; this.rig.show(o.inst, q < 1);
    });
    this.rig.show(this.curbI, this.rig.mesh.getVisibleAt(this.curbI));
    this.drawOranges(L);
  },
  drawOranges(L) {
    for (const o of this.oranges) {
      if (!this.rig.mesh.getVisibleAt(o.inst)) continue;
      const d = o.last ? o.p.distanceTo(o.last) : 0; o.last = o.last || new THREE.Vector3(); o.last.copy(o.p);
      o.rot = (o.rot || 0) + d / 0.032;
      this.q.setFromAxisAngle(o.spin, o.rot).multiply(o.q0);
      this.rig.mat(o.inst, this.m.compose(o.p, this.q, this.one));
    }
  },

  // ------------------------------------------------------------------ sound
  sound(L, t, dt, showing) {
    const v = L.voice(), c = v.ctx, cam = L.k.G.camera, near = Math.max(0, 1 - Math.hypot(cam.position.x - L.cx, cam.position.z - L.cz) / 12);
    this.murmur.set(showing ? 0.012 * near * ramp(t, 0.2, 1.5) : 0);
    // applause: a patter at the bow, a roar at the cymbal, and a little again at each bow
    const clap = showing ? Math.max(Math.sin(Math.PI * clamp01((t - T_BOW) / 1.4)) * 0.6, Math.exp(-Math.max(0, t - T_LAND) * 0.7) * (t > T_LAND ? 1 : 0)) : 0;
    this.applause.set(0.03 * clap * near, 0.08);
    if (c && clap > 0.05) {
      if (!this.clapAt || this.clapAt < c.currentTime) this.clapAt = c.currentTime + 0.02;
      while (this.clapAt < c.currentTime + 0.15) { this.clap(L, this.clapAt - c.currentTime, 0.02 * clap * near); this.clapAt += 0.012 + L.rand() * 0.05 / clap; }
    }
    if (!showing || dt <= 0) return;
    const once = (key, when, fn) => { if (t >= when && t - dt < when && !this.events.has(key)) { this.events.add(key); fn(); } };
    once('galop', GALOP_AT, () => this.galop(L));
    once('roll', T_CART, () => this.roll(L, 0, T_LAND - T_CART, 0.022));
    once('cym', T_LAND, () => { this.cymbal(L); this.tada(L, 0); });
    // a soft wooden knock at every catch (the oranges' programme says when one lands in a hand)
    for (const o of this.oranges) { if (o.wasAir && !o.air && o.i < 5) v.note([523, 587, 659, 784, 880][o.i], 0.09, { vol: 0.012, type: 'sine', attack: 0.002 }); o.wasAir = o.air; }
  },
  clap(L, at, vol) {
    const v = L.voice(), c = v.ctx, out = v.out(); if (!c || !out) return;
    const buf = this.nbuf || (this.nbuf = (() => { const b = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.008)); return b; })());
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = buf; f.type = 'bandpass'; f.frequency.value = 900 + Math.random() * 1500; f.Q.value = 1.2; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(out); s.start(c.currentTime + at);
  },
  roll(L, at, dur, vol) { const n = Math.floor(dur / 0.04); for (let i = 0; i < n; i++) this.clap(L, at + i * 0.04 + Math.random() * 0.006, vol * (0.4 + 0.6 * i / n)); },
  cymbal(L) { const v = L.voice(); L.k.synth.noise(1.4, { vol: 0.03, lp: 9000 }); v.note(3520, 0.6, { vol: 0.004, type: 'square' }); },
  tada(L, at) { const v = L.voice(); for (const [f, d] of [[523.25, 0], [659.25, 0.01], [783.99, 0.02], [1046.5, 0.03]]) { v.note(f, 0.9, { at: at + d, vol: 0.016, type: 'triangle', attack: 0.01 }); v.note(f / 2, 0.7, { at: at + d, vol: 0.01, type: 'sawtooth', attack: 0.02 }); } },
  galop(L) {
    const v = L.voice(), b = 60 / BPM;
    v.tune(GALOP, { bpm: BPM, type: 'triangle', vol: 0.022, legato: 0.75 });
    v.tune(GALOP.replace(/([A-G]#?)(\d)/g, (m, n, o) => n + (+o - 1)), { bpm: BPM, type: 'square', vol: 0.004, legato: 0.6 });
    // oom-pah: the bass on the beat, the chord off it
    GALOP_H.forEach(([b1, b2, ch], bar) => {
      if (b1) v.tune(b1 + ':.5', { bpm: BPM, at: bar * 2 * b, type: 'triangle', vol: 0.03, legato: 0.6 });
      if (b2) v.tune(b2 + ':.5', { bpm: BPM, at: (bar * 2 + 1) * b, type: 'triangle', vol: 0.026, legato: 0.6 });
      for (const n of ch.split(' ')) for (const off of [0.5, 1.5]) if (bar < 8 || off < 1) v.tune(n + ':.3', { bpm: BPM, at: (bar * 2 + off) * b, type: 'square', vol: 0.0035, legato: 0.6 });
    });
  },
});
