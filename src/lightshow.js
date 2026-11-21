// Winter Wonderland: the drive-through light show on Butler Field, the north-west quarter of the field across Columbus
// Drive from the Modern Wing (butlerfield.js has the rest of the field). One ploughed way winds through it, banked with
// snow, and driving it against the clock is the Light Run:
//
//   the Grand Arch (the clock starts) -> the Tunnel of Lights, arches wrapped in thousands of mini lights, white, then
//   every colour, then gold, that chase light along with the car -> the first Candy Cane Curve, a banked hairpin -> the
//   Snowflake Cathedral, pointed arches with snowflakes and icicles hung in the vault -> the Gift Box Jump -> the second
//   banked curve -> the Nutcracker Guard, who salute as you pass -> the Light Bridge, with a gap in it to jump -> the
//   third curve -> the Candy Cane Tunnel, past the Ice Palace and the Penguin Slide -> the Kaleidoscope Tunnel, winding
//   -> round the Singing Tree, eighteen metres of lights with a face that sings the tune, and a train at its foot -> the
//   finish.
//
// Twelve glowing ornaments hang along the way. Over it all a sleigh and four reindeer fly round, and the whole show
// keeps time with a medley of carols (carols.js), heard only near the field. The ground itself does nothing: it is
// packed snow, lit by what stands round it, as at a real show.
//
// Every bulb in the show is one instance of one mesh, and everything they do (twinkle, chase, keep the beat, follow the
// car, sing) is worked out in its vertex shader from a handful of numbers set once a frame. They are the size of real
// mini lights, and never drawn smaller than a pixel or so, so a far string still reads as a line of light. Figures are
// merged wire; what moves is a few dozen groups. Nothing is allocated per frame, and nothing runs while the toy is far away.
import * as THREE from 'three';
import { feature, tonight } from './features.js';
import { TAU, C, Wire, canvasTex, circle, ring3, deerBody, deerHead, sleigh, penguin, polarBear, snowman, candyCane, ornament, present, star, snowflake, signBoard, mergeAll } from './glowkit.js';
import { CarolPlayer } from './carols.js';

// ---------------------------------------------------------------- the course
const HW = 2.2;                                // half width of the ploughed way
const TURN_R = 10, BANK = 1.7;                 // the banked hairpins: radius of the way round, height of the bank at its crest
const TURNS = [{ c: [368, 89], u: [1, 0] }, { c: [318, 69], u: [-1, 0] }, { c: [368, 49], u: [1, 0] }];
const TREE = { x: 352, z: -3, H: 18, R: 6.2 }, RING = 13;
// the pieces you leave the ground from (k.solid): the Gift Box Jump going west, the Light Bridge going east
// (each landing starts lower than its take-off, so a car that makes the distance clears the lip of it)
const GIFT = { z0: 76.6, z1: 81.4, kick: [335.5, 340.5, 1.7], deck: [334.6, 335.5], land: [323.5, 331.6, 1.15] };
const BRIDGE = { z0: 56.6, z1: 61.4, up: [340, 346, 2.0], deck: [346, 348.5], land: [351.5, 360, 1.4] };
const SHOW = { x0: 300, x1: 384, z0: -22, z1: 106 };

const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
function bankFn(cx, cz, ux, uz) {
  return (x, z) => {
    const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz);
    if (d < 7.5 || d > 15.5) return 0;
    const along = dx * ux + dz * uz; if (along < -5) return 0;
    const taper = along >= 0 ? 1 : smooth(1 + along / 5);
    const h = d <= 13.5 ? BANK * ((d - 7.5) / 6) ** 2 : BANK * (1 - smooth((d - 13.5) / 2));
    return h * taper;
  };
}

// ---------------------------------------------------------------- the bulbs
// One instanced octahedron per bulb. aA = (mode, phase, s, k): what it does, where it is in its pattern, and two numbers
// the mode reads (distance along the way, height up the tree, a place in the mouth...).
const BULB_VS = `
attribute vec3 aCol; attribute vec4 aA;
uniform float uT, uBeat, uPh, uBarN, uNote, uHue, uCarS, uCalm, uDark, uFlash, uPat, uMouth, uBlink, uLook, uFin, uPix;
uniform vec3 uCarP; uniform vec3 uPal[3];
varying vec3 vBulb;
vec3 hue3(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
vec3 pal(float x) { x = fract(x) * 3.0; float f = fract(x); vec3 a = x < 1.0 ? uPal[0] : x < 2.0 ? uPal[1] : uPal[2]; vec3 b = x < 1.0 ? uPal[1] : x < 2.0 ? uPal[2] : uPal[0]; return mix(a, b, smoothstep(0.7, 1.0, f)); }
float hash(float n) { return fract(sin(n) * 43758.5453); }
`;
const BULB_MAIN = `
{
  float m = aA.x, ph = aA.y, s = aA.z, k = aA.w, live = 1.0 - uCalm, beat = uBeat * live, sc = 1.0;
  vec3 wp = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 dc = wp - uCarP; float prox = exp(-dot(dc, dc) / 7.0);
  float tw = pow(0.5 + 0.5 * sin(uT * mix(2.3, 0.5, uCalm) + ph * 6.2831), 3.0);      // every bulb's own slow twinkle
  vec3 c = aCol;
  if (m < 0.5) c = aCol * (0.5 + 0.7 * tw + 0.35 * beat);
  else if (m < 1.5) c = aCol * (0.25 + 1.2 * pow(max(0.0, sin(uT * mix(4.2, 1.0, uCalm) - ph)), 10.0) + 0.3 * beat);
  else if (m < 2.5) c = aCol * (0.85 + 0.15 * sin(uT * 1.3 + ph * 6.2831) + 0.25 * beat);
  else if (m < 3.5) c = aCol * (0.75 + 0.35 * tw);                                    // the rope light on stakes along the way: it only twinkles
  else if (m < 4.5) {                       // the Tunnel of Lights: s along the way, k round the arch; colour from the bulb (white, every colour, gold)
    float d = s - uCarS, on = step(-500.0, uCarS);
    float comet = on * (exp(-d * d / 4.0) * 1.6 + smoothstep(-6.0, 0.0, d) * (1.0 - smoothstep(0.0, 10.0, d)) * 0.5);
    float wave = on * live * exp(-pow(d - 3.0 - uPh * 24.0, 2.0) / 2.0);
    float run = pow(max(0.0, sin(k * 14.0 - uT * mix(4.0, 0.8, uCalm) + s * 0.7)), 8.0);
    c = aCol * (0.45 + 0.45 * tw + 0.9 * run + 0.45 * beat + 0.9 * wave) + vec3(2.2, 2.0, 1.7) * comet * (0.6 + 0.4 * tw);
  }
  else if (m < 5.5) {                       // the Singing Tree: s up it (0..1), k round it (0..1); a new pattern every four bars
    float p = mod(uPat, 4.0), b;
    if (p < 0.5) { float v = fract(k * 3.0 + s * 2.0 - uT * 0.3 * live - uBarN * 0.25); b = smoothstep(0.0, 0.06, v) * (1.0 - smoothstep(0.44, 0.5, v)); c = pal(floor(k * 3.0 + s * 2.0 - uT * 0.3 * live) * 0.333) * (0.25 + 1.4 * b + 0.5 * beat); }
    else if (p < 1.5) { float lv = 0.08 + 0.92 * clamp(uNote, 0.0, 1.0) * live + uCalm * 0.6; b = step(s, lv); c = pal(s * 0.9 + uBarN * 0.333) * (0.25 + 1.5 * b) + vec3(2.5) * exp(-pow((s - lv) * 30.0, 2.0)); }
    else if (p < 2.5) { float r = 1.0 - uPh; b = exp(-pow((s - r) * 10.0, 2.0)) * 2.4 * live; c = pal(floor(uBarN * 4.0 + uPh) * 0.25 + 0.1) * (0.35 + b) + aCol * 0.25; }
    else { float sp = step(0.86 - 0.25 * beat, hash(ph * 91.0 + floor(uT * 9.0 * live))); c = mix(aCol * 0.6, vec3(2.8, 2.7, 2.4), sp) + pal(k) * 0.4 * beat; }
    c += vec3(2.0, 1.8, 1.2) * uFin * step(0.5, hash(ph * 13.0 + floor(uT * 14.0)));
  }
  else if (m < 6.5) {                       // the mouth: (s, k) in a unit square; the lips are the edge of an ellipse as open as the note
    float o = max(uMouth, 0.12), r = length(vec2(s, k / o)), lip = 1.0 - smoothstep(0.12, 0.3, abs(r - 1.0));
    c = vec3(2.8, 0.45, 0.6) * (0.6 + 0.8 * lip) * lip; sc = step(0.25, lip);
  }
  else if (m < 7.5) {                       // the eyes: they blink, and look towards the car
    float rr = length(vec2(s, k)), open = 1.0 - uBlink, pu = length(vec2(s - uLook * 0.38, k + 0.08));
    float inside = step(rr, 1.0) * step(abs(k), open * 1.0 + 0.08);
    c = mix(vec3(2.6, 2.6, 2.8), vec3(0.25, 0.6, 2.8), step(pu, 0.42)); sc = inside;
  }
  else if (m < 8.5) {                       // the vault of the cathedral: a different handful of bulbs on each half beat, more as the tune rises
    float pick = fract(ph * 7.31 + floor(uBarN * 8.0 + uPh * 2.0) * 0.618);
    float lit = step(pick, 0.12 + 0.45 * uNote * live + 0.2 * uCalm);
    c = mix(aCol * 0.45, mix(aCol, hue3(uHue + ph * 0.25) * 2.4, 0.5) * 1.7, lit);
  }
  else if (m < 9.5) {                       // icicles and light curtains: a drop of light running down each strand
    float d = fract(uT * mix(0.55, 0.15, uCalm) + ph);
    c = aCol * (0.25 + exp(-pow((s - d) * 7.0, 2.0)) * 2.3);
  }
  else if (m < 10.5) {                      // the Kaleidoscope Tunnel: colours mirrored about the top of each arch, turning, petals on the beat
    float a = abs(k - 0.5) * 2.0;
    vec3 h = hue3(a * 1.2 + s * 0.035 - uT * mix(0.22, 0.04, uCalm) + uBarN * 0.25);
    float petal = pow(0.5 + 0.5 * cos(a * 16.0 - uT * mix(2.6, 0.4, uCalm) + s * 0.5), 4.0);
    c = (h * 2.6 + 0.12) * (0.3 + 0.9 * petal + 0.5 * beat + 0.25 * tw);
    float d = s - uCarS; c += vec3(2.0) * step(-500.0, uCarS) * exp(-d * d / 3.0) * 0.8;
  }
  else if (m < 11.5) {                      // candy-cane stripes along the crest of a banked curve: they keep still, and twinkle
    float x = fract(s * 0.6);
    c = (x < 0.5 ? vec3(2.9, 0.3, 0.3) : vec3(2.6, 2.6, 2.6)) * (0.6 + 0.35 * tw + 0.3 * beat);
  }
  else if (m < 12.5) {                      // the Light Bridge: a rainbow along it, slowly
    c = (hue3(s * 0.05 - uT * mix(0.12, 0.03, uCalm)) * 2.4 + 0.15) * (0.6 + 0.5 * beat + 0.3 * tw);
  }
  else if (m < 13.5) {                      // the start and finish: a chequer that marches while the clock runs
    float ch = mod(floor(k) + floor(s + uT * 2.0 * uFin), 2.0);
    c = mix(vec3(0.15), vec3(2.8), ch);
  }
  else {                                    // the Candy Cane Tunnel: red and white stripes winding round each arch and along the tunnel
    float x = fract(k * 5.0 + s * 0.22 - uT * mix(0.5, 0.1, uCalm));
    c = (x < 0.5 ? vec3(3.0, 0.32, 0.3) : vec3(2.7, 2.7, 2.6)) * (0.55 + 0.4 * tw + 0.45 * beat);
  }
  c *= mix(1.0, 0.1, uDark * live);
  c += vec3(0.7, 0.65, 0.55) * uFlash * live * (0.3 + 0.7 * hash(ph * 7.0));
  // never smaller than about a pixel across: a far string of mini lights still reads as a line of light (a little dimmer)
  float r0 = length(instanceMatrix[0].xyz), dist = -(modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).z, grow = max(1.0, dist * uPix / r0);
  vBulb = c / sqrt(grow); transformed *= sc * grow;
}`;

// Bulbs are given at the size the code was first laid out with; MINI is what makes them the size of real mini lights.
const MINI = 0.38;
class ShowBulbs {
  constructor() { this.p = []; this.c = []; this.a = []; this.s = []; }
  add(x, y, z, col, mode, phase = Math.random(), s = 0, k = 0, size = 0.07) { this.p.push(x, y, z); this.c.push(col[0], col[1], col[2]); this.a.push(mode, phase, s, k); this.s.push(size * MINI); }
  get count() { return this.s.length; }
  build(group, U) {
    const n = this.s.length; if (!n) return null;
    // an octahedron, indexed: six corners
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1], 3));
    geo.setIndex([0, 2, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 3, 1, 3, 4, 1, 4, 2]);
    geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(this.c), 3));
    geo.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(this.a), 4));
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = BULB_VS + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + BULB_MAIN);
      sh.fragmentShader = 'varying vec3 vBulb;\n' + sh.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( vBulb, opacity );');
    };
    mat.customProgramCacheKey = () => 'lightshow-bulbs';
    const mesh = new THREE.InstancedMesh(geo, mat, n), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
    for (let i = 0; i < n; i++) { S.setScalar(this.s[i]); P.set(this.p[i * 3], this.p[i * 3 + 1], this.p[i * 3 + 2]); mesh.setMatrixAt(i, M.compose(P, Q, S)); }
    mesh.frustumCulled = false; mesh.name = 'lightshow-bulbs'; group.add(mesh);
    return mesh;
  }
}

// ---------------------------------------------------------------- the feature
feature({
  id: 'lightshow',
  secrets: [['wonderland', 'Winter Wonderland (finish the Light Run)'], ['ornaments', 'Every ornament in one Light Run']],
  init(k) {
    this.k = k; const L = k.plan.lakefront; if (!L) return;
    const g = this.g = new THREE.Group(); g.name = 'lightshow'; k.group.add(g);
    this.t = 0; this.B = new ShowBulbs(); this.W = new Wire(); this.glow = []; this.anim = []; this.O = k.plan.obstacles;
    this.music = new CarolPlayer();
    const U = this.U = {
      uT: { value: 0 }, uBeat: { value: 0 }, uPh: { value: 0 }, uBarN: { value: 0 }, uNote: { value: 0 }, uHue: { value: 0 }, uCarS: { value: -1000 }, uCalm: { value: 0 },
      uDark: { value: 0 }, uFlash: { value: 0 }, uPat: { value: 0 }, uMouth: { value: 0.1 }, uBlink: { value: 0 }, uLook: { value: 0 }, uFin: { value: 0 },
      uCarP: { value: new THREE.Vector3(0, -99, 0) }, uPal: { value: [new THREE.Vector3(2.8, 0.3, 0.25), new THREE.Vector3(0.4, 2.5, 0.55), new THREE.Vector3(2.9, 2.0, 0.5)] },
      uPix: { value: 0.0015 },
    };
    // the banked curves first: the way is laid over them
    this.banks = TURNS.map(T => {
      const [cx, cz] = T.c, [ux, uz] = T.u, fn = bankFn(cx, cz, ux, uz), px = -uz, pz = ux;
      const xs = [cx + ux * -5 + px * -15.5, cx + ux * -5 + px * 15.5, cx + ux * 15.5 + px * -15.5, cx + ux * 15.5 + px * 15.5], zs = [cz + uz * -5 + pz * -15.5, cz + uz * -5 + pz * 15.5, cz + uz * 15.5 + pz * -15.5, cz + uz * 15.5 + pz * 15.5];
      const s = { skin: 'snow', hill: true, axis: 'hill', fn, x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), h0: 0, h1: BANK, thick: 0, cx, cz, rx: 15.5, rz: 15.5, H: BANK };
      k.plan.surfaces.push(s); return { ...T, fn, s };
    });
    this.ridge = () => 0;
    this.ground = (x, z) => { let h = this.ridge(x, z); for (const b of this.banks) { const v = b.fn(x, z); if (v > h) h = v; } return h; };
    this.snowM = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, map: k.museum.snowTex, roughness: 0.95, emissiveMap: k.museum.snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5 });
    this._route();
    this._snowbanks(k);
    this._way(k);
    this._bankLook(k);
    this._gate(k);
    this._arches(this.sTunnel, 0.9, 'lights');
    this._cathedral();
    this._giftJump(k);
    this._nutcrackers();
    this._bridge(k);
    this._arches(this.sCandy, 1.0, 'candy');
    this._arches(this.sKaleido, 0.7, 'kaleido');
    this._tree();
    this._figures();
    this._ornaments();
    this.bulbMesh = this.B.build(g, U);
    const wm = this.W.mesh(); if (wm) { wm.name = 'lightshow-wire'; g.add(wm); this.wireMat = wm.material; }
    this._glows(g);
    this.hud = null; this.run = null;
    try { this.best = { car: parseFloat(localStorage.getItem('after-hours.lightrun.car')) || null, drone: parseFloat(localStorage.getItem('after-hours.lightrun.drone')) || null }; } catch { this.best = {}; }
    this.ti = 0; this.td = 99; this.prevS = -1;
  },

  // ============================================================ the way
  _route() {
    const pts = [[315, 106.5], [315.6, 102.5], [318.5, 99.6], [322, 99], [332, 99], [345, 99], [358, 99], [365, 99]];
    const arc = (cx, cz, a0, a1, r = TURN_R) => { for (let i = 1; i < 6; i++) { const a = (a0 + (a1 - a0) * i / 6) * Math.PI / 180; pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } };
    pts.push([368, 99]); arc(368, 89, 90, -90); pts.push([368, 79], [364, 79], [350, 79], [336, 79], [322, 79], [318, 79]);
    arc(318, 69, 90, 270); pts.push([318, 59], [322, 59], [336, 59], [350, 59], [364, 59], [368, 59]);
    arc(368, 49, 90, -90); pts.push([368, 39], [360, 39], [348, 39], [337, 39]);
    // round in a U through the Kaleidoscope Tunnel, then up to the ring round the tree
    pts.push([326, 39], [317, 36], [312.5, 29], [314.5, 21.5], [320, 15.5], [327, 11], [334, 8], [338, 3], [339, -3]);
    for (let i = 1; i <= 9; i++) { const a = (180 + i * 30) * Math.PI / 180; pts.push([TREE.x + Math.cos(a) * RING, TREE.z + Math.sin(a) * RING]); }
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
    const len = curve.getLength(), N = Math.ceil(len / 0.5), P = [];
    for (let i = 0; i <= N; i++) { const p = curve.getPointAt(i / N), t = curve.getTangentAt(i / N); P.push({ x: p.x, z: p.z, tx: t.x, tz: t.z, nx: -t.z, nz: t.x, s: len * i / N, w: HW }); }
    this.P = P; this.len = len; this.step = len / N;
    this.at = s => P[Math.max(0, Math.min(P.length - 1, Math.round(s / this.step)))];
    this.sAt = (x, z, s0 = 0, s1 = len) => { let b = 0, bd = 1e9; for (const p of P) { if (p.s < s0 || p.s > s1) continue; const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; b = p.s; } } return b; };
    this.sGate = this.sAt(324, 99, 0, 30); this.sEnd = len - 0.3;
    this.sTunnel = [this.sAt(327, 99), this.sAt(362, 99)];
    this.sCandy = [this.sAt(362, 39), this.sAt(341, 39)];
    this.sKaleido = [this.sAt(333, 39, this.sCandy[1]), this.sAt(322, 13.5, this.sCandy[1])];
  },
  // Is (x, z) over one of the jump pieces (the way is not drawn there: they are lit themselves)?
  _onPiece(x, z, pad = 0.2) {
    const inR = (x0, x1, z0, z1) => x > x0 - pad && x < x1 + pad && z > z0 - pad && z < z1 + pad;
    return inR(GIFT.land[0], GIFT.kick[1], GIFT.z0, GIFT.z1) || inR(BRIDGE.up[0], BRIDGE.land[1], BRIDGE.z0, BRIDGE.z1);
  },
  // The snow the ploughs left along both sides of the way: a low bank, to drive up and roll back off. One heightfield
  // (a hill surface with a shape of its own, plan.heightOf), sampled on a grid stamped out from the way.
  _snowbanks(k) {
    const G = 0.33, x0 = SHOW.x0, z0 = SHOW.z0, nx = Math.ceil((SHOW.x1 - x0) / G), nz = Math.ceil((SHOW.z1 - z0) / G), D = new Float32Array((nx + 1) * (nz + 1)).fill(99);
    const R = HW + 1.9;
    for (const p of this.P) {
      const i0 = Math.max(0, Math.floor((p.x - R - x0) / G)), i1 = Math.min(nx, Math.ceil((p.x + R - x0) / G)), j0 = Math.max(0, Math.floor((p.z - R - z0) / G)), j1 = Math.min(nz, Math.ceil((p.z + R - z0) / G));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const d = Math.hypot(x0 + i * G - p.x, z0 + j * G - p.z), q = j * (nx + 1) + i; if (d < D[q]) D[q] = d; }
    }
    const H = new Float32Array(D.length), TOP = 0.3;
    const inTurn = (x, z) => this.banks.some(b => { const dx = x - b.c[0], dz = z - b.c[1]; return Math.hypot(dx, dz) < 16.5 && dx * b.u[0] + dz * b.u[1] > -6.5; });
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const q = j * (nx + 1) + i, e = D[q] - HW, x = x0 + i * G, z = z0 + j * G;
      if (e < 0.1 || e > 1.7 || inTurn(x, z) || this._onPiece(x, z, 1.2)) continue;
      H[q] = TOP * (e < 0.7 ? smooth((e - 0.1) / 0.6) : 1 - smooth((e - 0.7) / 1.0));
    }
    this.ridge = (x, z) => {
      const fx = (x - x0) / G, fz = (z - z0) / G; if (fx < 0 || fz < 0 || fx >= nx || fz >= nz) return 0;
      const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, q = j * (nx + 1) + i;
      return (H[q] * (1 - u) + H[q + 1] * u) * (1 - v) + (H[q + nx + 1] * (1 - u) + H[q + nx + 2] * u) * v;
    };
    k.plan.surfaces.push({ skin: 'snow', hill: true, axis: 'hill', fn: this.ridge, x0, x1: x0 + nx * G, z0, z1: z0 + nz * G, h0: 0, h1: TOP, thick: 0, cx: (SHOW.x0 + SHOW.x1) / 2, cz: (SHOW.z0 + SHOW.z1) / 2, rx: 1, rz: 1, H: TOP });
    // drawn as one sheet over the cells that have any bank in them
    const pos = [], uv = [], idx = [], map = new Int32Array(D.length).fill(-1), vert = q => { if (map[q] < 0) { const i = q % (nx + 1), j = (q / (nx + 1)) | 0, x = x0 + i * G, z = z0 + j * G; map[q] = pos.length / 3; pos.push(x, H[q] + 0.01, z); uv.push(x / 4, z / 4); } return map[q]; };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      if (Math.max(H[a], H[b], H[c], H[d]) < 0.003) continue;
      idx.push(vert(a), vert(c), vert(b), vert(b), vert(c), vert(d));
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, this.snowM); m.receiveShadow = true; m.name = 'lightshow-snowbanks'; this.g.add(m);
  },
  // The way itself: snow packed down by the ploughs, ruts and all. It does nothing; what lights it is what stands round it.
  _way(k) {
    const P = this.P, B = this.B, pos = [], uv = [], idx = [], COLS = 5;
    let vi = 0;
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      for (let j = 0; j < COLS; j++) { const f = -1 + 2 * j / (COLS - 1), x = p.x + p.nx * p.w * f, z = p.z + p.nz * p.w * f; pos.push(x, this.ground(x, z) + 0.025, z); uv.push(p.s / 4, (f + 1) / 2); }
      if (i) {
        const q = P[i - 1], mid = this._onPiece((p.x + q.x) / 2, (p.z + q.z) / 2);
        if (!mid) for (let j = 0; j < COLS - 1; j++) { const a = vi - COLS + j, b = vi + j; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      }
      vi += COLS;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const tex = canvasTex(256, 128, (c, w, h) => {
      c.fillStyle = '#cfd7e3'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { const g = 170 + Math.random() * 60; c.fillStyle = `rgba(${g - 10},${g},${g + 18},.35)`; c.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 4, 1 + Math.random() * 2); }
      for (const y of [0.3, 0.38, 0.62, 0.7]) { c.fillStyle = 'rgba(120,132,152,.28)'; for (let x = 0; x < w; x += 2) c.fillRect(x, h * y + Math.sin(x * 0.05) * 1.5, 2, 3 + Math.random() * 2); }      // the ploughs' and the tyres' ruts
      const e = c.createLinearGradient(0, 0, 0, h); e.addColorStop(0, 'rgba(255,255,255,.5)'); e.addColorStop(0.1, 'rgba(255,255,255,0)'); e.addColorStop(0.9, 'rgba(255,255,255,0)'); e.addColorStop(1, 'rgba(255,255,255,.5)'); c.fillStyle = e; c.fillRect(0, 0, w, h);
    });
    tex.wrapS = THREE.RepeatWrapping;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, emissive: new THREE.Color(0.22, 0.25, 0.36), emissiveMap: tex, emissiveIntensity: 0.45, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; m.name = 'lightshow-way'; this.g.add(m);
    // a rope light of warm mini lights on short stakes along both sides, just inside the snowbank
    for (let s = 0; s < this.len; s += 0.2) {
      const p = this.at(s);
      for (const sd of [-1, 1]) { const x = p.x + p.nx * (p.w + 0.2) * sd, z = p.z + p.nz * (p.w + 0.2) * sd; if (this._onPiece(x, z, 0.4)) continue; B.add(x, this.ground(x, z) + 0.12, z, C.warm, 3, Math.random(), s, sd, 0.05); }
    }
    for (let s = 0; s < this.len; s += 10) { const p = this.at(s); this.glow.push([p.x, p.z, 3.4, C.warm, 0.05]); }
  },
  // The banked curves: snow banked up by the ploughs, red and white mini lights along the crest, giant canes round the foot.
  _bankLook(k) {
    const mat = this.snowM, B = this.B, W = this.W;
    for (const bk of this.banks) {
      const s = bk.s, step = 0.5, nx = Math.ceil((s.x1 - s.x0) / step), nz = Math.ceil((s.z1 - s.z0) / step), pos = [], uv = [], idx = [], hs = [];
      for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
        const x = s.x0 + (s.x1 - s.x0) * i / nx, z = s.z0 + (s.z1 - s.z0) * j / nz, h = bk.fn(x, z), a = Math.atan2(z - bk.c[1], x - bk.c[0]), d = Math.hypot(x - bk.c[0], z - bk.c[1]);
        pos.push(x, h + 0.01, z); uv.push(a * 12 / TAU * 4, d / 3); hs.push(h);
      }
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
        if (Math.max(hs[a], hs[b], hs[c]) > 0.004) idx.push(a, c, b); if (Math.max(hs[b], hs[c], hs[d]) > 0.004) idx.push(b, c, d);
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; this.g.add(m);
      // the crest and the inner foot in bulbs, the canes outside
      const [cx, cz] = bk.c, [ux, uz] = bk.u, a0 = Math.atan2(uz, ux);
      for (let a = -Math.PI / 2 - 0.25; a <= Math.PI / 2 + 0.25; a += 0.15 / 13.5) {
        const x = cx + Math.cos(a0 + a) * 13.5, z = cz + Math.sin(a0 + a) * 13.5; B.add(x, bk.fn(x, z) + 0.1, z, C.red, 11, Math.random(), (a + 2) * 13.5, 0, 0.06);
      }
      for (let a = -Math.PI / 2; a <= Math.PI / 2; a += 0.025) { const x = cx + Math.cos(a0 + a) * 7.3, z = cz + Math.sin(a0 + a) * 7.3; B.add(x, 0.12, z, C.gold, 0, Math.random(), 0, 0, 0.05); }
      for (let a = -Math.PI / 2; a <= Math.PI / 2 + 1e-6; a += Math.PI / 12) {
        const x = cx + Math.cos(a0 + a) * 16.2, z = cz + Math.sin(a0 + a) * 16.2; if (!this._clear(x, z, 0.9)) continue;
        const yaw = -(a0 + a) + Math.PI / 2, M = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(2.4, 2.4, 2.4));
        W.frame(candyCane(), 0.05, M); this.O.push({ x0: x - 0.2, x1: x + 0.2, z0: z - 0.2, z1: z + 0.2, y0: 0, y1: 4.5 });
      }
      // in the middle of each curve, a star on a tall pole, turning
      { const x = cx + ux * 2, z = cz + uz * 2; W.stroke([[x, 0, z], [x, 5.5, z]], [0.3, 0.32, 0.36], null, 0.05); const st = this._own(star(1.3, [C.gold, C.ice, C.pink][this.banks.indexOf(bk)]), 0, x, 6.8, z, 0); this.anim.push({ kind: 'spin', grp: st, rate: 0.7 }); this.O.push({ x0: x - 0.1, x1: x + 0.1, z0: z - 0.1, z1: z + 0.1, y0: 0, y1: 5.5 }); this.glow.push([x, z, 4, C.gold, 0.12]); }
      this.glow.push([cx + ux * 11, cz + uz * 11, 9, C.red, 0.08]);
    }
  },
  _clear(x, z, r) { for (const o of this.O) if (x + r > o.x0 && x - r < o.x1 && z + r > o.z0 && z - r < o.z1 && o.y0 < 1) return false; return true; },
  _own(strokes, depth, x, y, z, yaw, scale = 1) { const w = new Wire(); w.frame(strokes, depth, null); const m = w.mesh(); const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = yaw; grp.scale.setScalar(scale); if (m) { m.material = this._wm || (this._wm = m.material); grp.add(m); } this.g.add(grp); return grp; },
  // Placing a figure beside the way: at s along it, `off` metres to its left (negative: right), facing the way.
  _place(s, off, strokes, depth = 0.15, scale = 1, o = 0.5) {
    const p = this.at(s), x = p.x + p.nx * off, z = p.z + p.nz * off, yaw = Math.atan2(-p.nx * Math.sign(off), -p.nz * Math.sign(off));
    const M = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(scale, scale, scale));
    if (strokes) { this.W.frame(strokes, depth, M); this.glow.push([x, z, 1.3 * scale, strokes[0].col, 0.14]); }
    if (o) this.O.push({ x0: x - o * scale, x1: x + o * scale, z0: z - o * scale, z1: z + o * scale, y0: 0, y1: 1.2 * scale });
    return { x, z, yaw, M, p };
  },

  // ============================================================ the Grand Arch, where the clock starts, and the finish
  _gate(k) {
    const B = this.B, p = this.at(this.sGate), span = 3.6, H = 5.0;
    for (let r = 0; r < 4; r++) for (let i = 0; i <= 40; i++) { const a = Math.PI * i / 40, ox = Math.cos(a) * (span + r * 0.22), oy = Math.sin(a) * (H + r * 0.22); B.add(p.x + p.nx * ox, oy, p.z + p.nz * ox, [C.gold, C.red, C.green, C.white][r], 1, i * 0.2 + r, 0, 0, 0.085); }
    for (const sd of [-1, 1]) {
      const x = p.x + p.nx * span * sd, z = p.z + p.nz * span * sd;
      for (let y = 0; y < 1; y += 0.05) B.add(x + Math.cos(y * 50) * 0.16, y * 2.6, z + Math.sin(y * 50) * 0.16, y * 10 % 2 < 1 ? C.red : C.white, 2, y * 3, 0, 0, 0.055);
      this.O.push({ x0: x - 0.2, x1: x + 0.2, z0: z - 0.2, z1: z + 0.2, y0: 0, y1: 5 });
    }
    // the chequered line across the way (and a row of bulbs over it that marches while the clock runs)
    for (let i = -6; i <= 6; i++) for (let r = 0; r < 2; r++) B.add(p.x + p.nx * i * 0.33, 4.0 + r * 0.25, p.z + p.nz * i * 0.33, C.white, 13, 0, r, i, 0.08);
    this.glow.push([p.x, p.z, 7, C.gold, 0.18]);
    const sign = signBoard(4.6, 1.25, [['WINTER WONDERLAND', 104, '#fff1c8', 0.42], ['THE LIGHTS ON BUTLER FIELD', 40, '#ffb3a8', 0.76]]);
    sign.position.set(p.x, 3.3, p.z); sign.rotation.y = Math.atan2(-p.tx, -p.tz); this.g.add(sign);
    this.gateAt = p;
    // the finish: an arch of white stars over the chequer, at the foot of the tree
    const q = this.at(this.sEnd - 1);
    for (let r = 0; r < 2; r++) for (let i = 0; i <= 30; i++) { const a = Math.PI * i / 30, ox = Math.cos(a) * (2.9 + r * 0.2), oy = Math.sin(a) * (3.8 + r * 0.2); B.add(q.x + q.nx * ox, oy, q.z + q.nz * ox, r ? C.white : C.gold, 1, i * 0.25, 0, 0, 0.08); }
    for (let i = -6; i <= 6; i++) for (let r = 0; r < 2; r++) B.add(q.x + q.nx * i * 0.33, 2.9 + r * 0.25, q.z + q.nz * i * 0.33, C.white, 13, 0, r, i, 0.075);
    for (const sd of [-1, 1]) { const x = q.x + q.nx * 2.9 * sd, z = q.z + q.nz * 2.9 * sd; this.O.push({ x0: x - 0.12, x1: x + 0.12, z0: z - 0.12, z1: z + 0.12, y0: 0, y1: 3.8 }); }
    this.finishAt = q;
  },

  // ============================================================ the tunnels: of Lights, Candy Cane, Kaleidoscope
  // A tunnel of arches over the way from s0 to s1, every `gap` metres, each wrapped in strands of mini lights a hand's
  // breadth apart: 'lights' (white, then every colour, then gold, as the long tunnels at the zoos go), 'candy' (red and
  // white winding round) or 'kaleido' (colours mirrored about the top of the arch).
  _arches([s0, s1], gap, kind) {
    const B = this.B, W = this.W, K = { lights: { hw: 2.75, H: 3.4, strands: 3, mode: 4 }, candy: { hw: 2.6, H: 3.2, strands: 2, mode: 14 }, kaleido: { hw: 2.7, H: 3.3, strands: 2, mode: 10 } }[kind];
    const lo = Math.min(s0, s1), hi = Math.max(s0, s1), per = Math.round(Math.PI * Math.sqrt((K.hw * K.hw + K.H * K.H) / 2) / 0.11);
    let j = 0;
    for (let s = lo; s <= hi; s += gap, j++) {
      const p = this.at(s), f = (s - lo) / (hi - lo);
      let col = C.white;
      if (kind === 'lights') { const hue = (j * 0.09) % 1, rb = [Math.max(0, Math.min(1, Math.abs(hue * 6 - 3) - 1)), Math.max(0, Math.min(1, 2 - Math.abs(hue * 6 - 2))), Math.max(0, Math.min(1, 2 - Math.abs(hue * 6 - 4)))].map(v => v * 2.8 + 0.2); col = f < 0.3 ? [2.0, 1.8, 1.45] : f < 0.7 ? rb : [2.6, 1.7, 0.55]; }
      for (let r = 0; r < K.strands; r++) {
        const off = (r - (K.strands - 1) / 2) * 0.09;
        for (let i = 0; i <= per; i++) { const a = Math.PI * i / per, ox = Math.cos(a) * K.hw, oy = Math.sin(a) * K.H; B.add(p.x + p.nx * ox + p.tx * off, oy + 0.05, p.z + p.nz * ox + p.tz * off, col, K.mode, Math.random(), s, i / per, 0.05); }
      }
      W.stroke(Array.from({ length: 13 }, (_, i) => { const a = Math.PI * i / 12, ox = Math.cos(a) * K.hw; return [p.x + p.nx * ox, Math.sin(a) * K.H, p.z + p.nz * ox]; }), [0.13, 0.15, 0.18], null, 0.015);
      if (j % 4 === 0) this.glow.push([p.x, p.z, 3.4, kind === 'lights' ? col : C.warm, 0.045]);
      for (const sd of [-1, 1]) this.O.push({ x0: p.x + p.nx * K.hw * sd - 0.05, x1: p.x + p.nx * K.hw * sd + 0.05, z0: p.z + p.nz * K.hw * sd - 0.05, z1: p.z + p.nz * K.hw * sd + 0.05, y0: 0, y1: 3 });
    }
  },

  // ============================================================ the Snowflake Cathedral
  // Pointed arches six and a half metres high over the second straight, ribs of light along the vault, a canopy of
  // bulbs that sparkle to the tune, icicles dripping light, and snowflakes turning under the roof.
  _cathedral() {
    const B = this.B, W = this.W, sA = this.sAt(362, 79), sB = this.sAt(345, 79), s0 = Math.min(sA, sB), s1 = Math.max(sA, sB);
    const hw = 3.2, spring = 3.2, R = 3.3, cx = 3.2 - R;                 // each side an arc of radius R from the springing to the apex
    const profile = t => {                                              // t in 0..1 round the arch -> [across, up]
      const L1 = spring, L2 = R * Math.atan2(3.3, -cx) , L = 2 * (L1 + L2), d = t * L;
      const side = d < L / 2 ? 1 : -1, e = d < L / 2 ? d : L - d;
      if (e < L1) return [side * hw, e];
      const a = (e - L1) / R; return [side * (cx + R * Math.cos(a)), spring + R * Math.sin(a)];
    };
    const rib = [0.5, 0.36, 0.64, 0.22, 0.78];
    for (let s = s0; s <= s1 + 0.01; s += 2.5) {
      const p = this.at(s);
      for (const off of [-0.07, 0.07]) for (let i = 0; i <= 150; i++) { const [ox, oy] = profile(i / 150); B.add(p.x + p.nx * ox + p.tx * off, oy, p.z + p.nz * ox + p.tz * off, i % 5 ? C.ice : C.white, 1, i * 0.05 + s * 0.3, s, i / 150, 0.05); }
      W.stroke(Array.from({ length: 25 }, (_, i) => { const [ox, oy] = profile(i / 24); return [p.x + p.nx * ox, oy, p.z + p.nz * ox]; }), [0.2, 0.24, 0.3], null, 0.03);
      for (const sd of [-1, 1]) this.O.push({ x0: p.x + p.nx * hw * sd - 0.08, x1: p.x + p.nx * hw * sd + 0.08, z0: p.z + p.nz * hw * sd - 0.08, z1: p.z + p.nz * hw * sd + 0.08, y0: 0, y1: 6 });
      this.glow.push([p.x, p.z, 4, C.ice, 0.1]);
    }
    for (let s = s0; s <= s1; s += 0.12) {
      const p = this.at(s);
      for (const t of rib) { const [ox, oy] = profile(t); B.add(p.x + p.nx * ox, oy, p.z + p.nz * ox, C.white, 0, Math.random(), s, t, 0.045); }
    }
    // the canopy: bulbs scattered under the vault
    for (let i = 0; i < 2400; i++) {
      const s = s0 + Math.random() * (s1 - s0), p = this.at(s), t = 0.25 + Math.random() * 0.5, [ox, oy] = profile(t), drop = 0.15 + Math.random() * 0.6;
      B.add(p.x + p.nx * ox * 0.97, oy - drop, p.z + p.nz * ox * 0.97, [C.ice, C.white, C.blue, C.purple][i % 4], 8, Math.random(), s, t, 0.04);
    }
    // icicles hanging from the ribs
    for (let s = s0 + 1.2; s < s1; s += 1.25) {
      const p = this.at(s);
      for (const t of [0.22, 0.78, 0.36, 0.64]) { const [ox, oy] = profile(t), ph = Math.random(), L = 0.8 + Math.random() * 0.9; for (let i = 0; i < 16; i++) B.add(p.x + p.nx * ox, oy - 0.1 - i * L / 16, p.z + p.nz * ox, C.ice, 9, ph, i / 15, 0, 0.04); }
    }
    // the snowflakes, turning
    let n = 0;
    for (let s = s0 + 1.25; s < s1; s += 2.5, n++) {
      const p = this.at(s), off = (n % 2 ? 1 : -1) * 1.0;
      const f = this._own(snowflake(0.75), 0, p.x + p.nx * off, 4.6 + (n % 3) * 0.3, p.z + p.nz * off, Math.atan2(p.tx, p.tz));
      this.anim.push({ kind: 'spinz', grp: f, rate: (n % 2 ? 1 : -1) * (0.4 + (n % 3) * 0.12) });
    }
  },

  // ============================================================ the Gift Box Jump
  _giftJump(k) {
    const red = new THREE.MeshStandardMaterial({ color: 0x9a1820, roughness: 0.5, emissive: 0xc8202c, emissiveIntensity: 0.55 });
    const green = new THREE.MeshStandardMaterial({ color: 0x176a2c, roughness: 0.5, emissive: 0x1f9a3c, emissiveIntensity: 0.55 });
    const G = GIFT, B = this.B, W = this.W, z0 = G.z0, z1 = G.z1, zc = (z0 + z1) / 2;
    k.solid({ skin: 'snow', x0: G.kick[0], x1: G.kick[1], z0, z1, axis: 'x', h0: G.kick[2], h1: 0, thick: 0 }, red);
    k.solid({ skin: 'snow', x0: G.deck[0], x1: G.deck[1], z0, z1, axis: null, h0: G.kick[2], h1: G.kick[2], thick: 0 }, red);
    k.solid({ skin: 'snow', x0: G.land[0], x1: G.land[1], z0, z1, axis: 'x', h0: 0, h1: G.land[2], thick: 0 }, green);
    this.giftGap = { x0: G.land[1], x1: G.deck[0], z0, z1 };
    // the ribbon: gold lights down the middle and across, and round every edge
    const hK = x => x < G.kick[0] ? G.kick[2] : G.kick[2] * (G.kick[1] - x) / (G.kick[1] - G.kick[0]);
    const hL = x => G.land[2] * (x - G.land[0]) / (G.land[1] - G.land[0]);
    for (let x = G.deck[0]; x <= G.kick[1]; x += 0.12) { B.add(x, hK(x) + 0.05, zc, C.gold, 0, Math.random(), 0, 0, 0.06); for (const z of [z0, z1]) B.add(x, hK(x) + 0.03, z, C.white, 2, x, 0, 0, 0.05); }
    for (let x = G.land[0]; x <= G.land[1]; x += 0.12) { B.add(x, hL(x) + 0.05, zc, C.gold, 0, Math.random(), 0, 0, 0.06); for (const z of [z0, z1]) B.add(x, hL(x) + 0.03, z, C.white, 2, x, 0, 0, 0.05); }
    for (let z = z0; z <= z1; z += 0.12) { B.add(G.deck[0], G.kick[2] + 0.05, z, C.gold, 1, z, 0, 0, 0.07); B.add(G.land[1], G.land[2] + 0.05, z, C.gold, 1, z, 0, 0, 0.07); for (let y = 0.15; y < G.kick[2]; y += 0.15) { B.add(G.deck[0] - 0.02, y, z, C.red, 0, Math.random(), 0, 0, 0.04); if (y < G.land[2]) B.add(G.land[1] + 0.02, y, z, C.green, 0, Math.random(), 0, 0, 0.04); } }
    // bows on the sides, off the way
    for (const [x, z, col] of [[G.deck[0] + 0.6, z1 + 0.05, C.gold], [G.deck[0] + 0.6, z0 - 0.05, C.gold], [G.land[1] - 0.6, z1 + 0.05, C.red], [G.land[1] - 0.6, z0 - 0.05, C.red]]) {
      const M = new THREE.Matrix4().makeTranslation(x, 1.5, z); W.frame([{ pts: circle(-0.32, 0, 0.3, 14, 0, TAU, 0.34), col, d: 0 }, { pts: circle(0.32, 0, 0.3, 14, 0, TAU, 0.34), col, d: 0 }, { pts: circle(0, 0, 0.09, 8), col, d: 0 }], 0, M);
    }
    this.glow.push([G.deck[0], zc, 6, C.red, 0.14], [G.land[1] - 3, zc, 5, C.green, 0.12]);
    // a little stack of presents beside the gap, each side
    for (const z of [z0 - 1.6, z1 + 1.6]) for (const [dx, w2, h, c1, c2] of [[-1, 0.9, 0.7, C.blue, C.gold], [0.2, 0.7, 1.0, C.pink, C.white], [1.2, 1.0, 0.6, C.purple, C.gold]]) {
      const x = G.deck[0] - 1.6 + dx, M = new THREE.Matrix4().makeRotationY(dx).setPosition(x, 0, z); W.frame(present(w2, h, w2, c1, c2), 0, M); this.O.push({ x0: x - w2 / 2, x1: x + w2 / 2, z0: z - w2 / 2, z1: z + w2 / 2, y0: 0, y1: h });
    }
  },

  // ============================================================ the Nutcracker Guard
  // Six soldiers, three a side, five metres tall, in red coats and tall hats. Each salutes as the car comes by.
  _nutcrackers() {
    const sA = this.sAt(322, 59), sB = this.sAt(338, 59), body = nutcracker(), scale = 2.4;
    this.nuts = [];
    for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) {
      const s = sA + (sB - sA) * (i + (sd > 0 ? 0.25 : 0.75)) / 3, q = this._place(s, sd * 4.4, body, 0.12, scale, 0.35);
      const arm = new THREE.Group(); arm.position.set(q.x, 0, q.z); arm.rotation.y = q.yaw; arm.scale.setScalar(scale); this.g.add(arm);
      const up = new THREE.Group(); up.position.set(0.27, 1.42, 0); arm.add(up);
      const w1 = new Wire(); w1.frame([{ pts: [[0, 0], [0.03, -0.3]], col: C.red, d: 0.06 }, { pts: circle(0.03, -0.3, 0.05, 8), col: C.gold, d: 0 }], 0, null); const m1 = w1.mesh(); m1.material = this._wm || (this._wm = m1.material); up.add(m1);
      const fore = new THREE.Group(); fore.position.set(0.03, -0.3, 0); up.add(fore);
      const w2 = new Wire(); w2.frame([{ pts: [[0, 0], [0, -0.26]], col: C.red, d: 0.05 }, { pts: circle(0, -0.31, 0.05, 8), col: C.white, d: 0 }], 0, null); const m2 = w2.mesh(); m2.material = this._wm; fore.add(m2);
      this.nuts.push({ x: q.x, z: q.z, up, fore, t: 0, side: sd });
      // gold bulbs round the hat and down the coat
      const M = q.M;
      const hat = [[-0.15, 1.72], [-0.15, 2.1], [0.15, 2.1], [0.15, 1.72]], v = new THREE.Vector3();
      for (let j = 0; j < hat.length - 1; j++) for (let t = 0; t < 1; t += 0.2) { v.set(hat[j][0] + (hat[j + 1][0] - hat[j][0]) * t, hat[j][1] + (hat[j + 1][1] - hat[j][1]) * t, 0.13).applyMatrix4(M); this.B.add(v.x, v.y, v.z, C.gold, 1, j + t * 3, 0, 0, 0.06); }
      for (let y = 0.95; y < 1.45; y += 0.1) { v.set(0, y, 0.13).applyMatrix4(M); this.B.add(v.x, v.y, v.z, C.gold, 2, y, 0, 0, 0.05); }
      this.glow.push([q.x, q.z, 3, C.red, 0.12]);
    }
  },

  // ============================================================ the Light Bridge
  _bridge(k) {
    const R = BRIDGE, z0 = R.z0, z1 = R.z1, zc = (z0 + z1) / 2, B = this.B;
    const glass = new THREE.MeshStandardMaterial({ color: 0x0c1834, roughness: 0.25, metalness: 0.2, emissive: 0x2050c0, emissiveIntensity: 0.5 });
    k.solid({ skin: 'snow', x0: R.up[0], x1: R.up[1], z0, z1, axis: 'x', h0: 0, h1: R.up[2], thick: 0 }, glass);
    k.solid({ skin: 'snow', x0: R.deck[0], x1: R.deck[1], z0, z1, axis: null, h0: R.up[2], h1: R.up[2], thick: 0 }, glass);
    k.solid({ skin: 'snow', x0: R.land[0], x1: R.land[1], z0, z1, axis: 'x', h0: R.land[2], h1: 0, thick: 0 }, glass);
    this.bridgeGap = { x0: R.deck[1], x1: R.land[0], z0, z1 };
    const h = x => x < R.up[0] ? 0 : x < R.up[1] ? R.up[2] * (x - R.up[0]) / (R.up[1] - R.up[0]) : x <= R.deck[1] ? R.up[2] : x < R.land[0] ? -1 : x <= R.land[1] ? R.land[2] * (R.land[1] - x) / (R.land[1] - R.land[0]) : 0;
    for (let x = R.up[0]; x <= R.land[1]; x += 0.11) {
      const y = h(x); if (y < 0) continue;
      for (const z of [z0 + 0.05, z1 - 0.05]) { B.add(x, y + 0.06, z, C.white, 12, 0, x, 0, 0.07); for (let yy = y - 0.15; yy > 0.08; yy -= 0.16) B.add(x, yy, z + (z < zc ? -0.03 : 0.03), C.white, 12, 0, x + yy * 4, 0, 0.045); }
    }
    // hoops of light over the bridge, and over the gap the brightest of all
    for (const x of [R.up[0] + 1, R.up[0] + 3.5, R.deck[0] + 0.8, (R.deck[1] + R.land[0]) / 2, R.land[0] + 1, R.land[0] + 4, R.land[1] - 1.2]) {
      const y0 = Math.max(0, h(x)), gap = x > R.deck[1] && x < R.land[0];
      for (const dx of [-0.07, 0.07]) for (let i = 0; i <= 90; i++) { const a = Math.PI * i / 90; B.add(x + dx, y0 + 0.1 + Math.sin(a) * (gap ? 4.8 : 3.0), zc + Math.cos(a) * 2.7, C.white, 12, 0, x + i * 0.18, 0, 0.05); }
    }
    for (const x of [R.up[0] + 1, R.up[0] + 3.5, R.deck[0] + 0.8, R.land[0] + 1, R.land[0] + 4, R.land[1] - 1.2]) for (const z of [zc - 2.7, zc + 2.7]) this.O.push({ x0: x - 0.06, x1: x + 0.06, z0: z - 0.06, z1: z + 0.06, y0: 0, y1: 5 });
    { const x = (R.deck[1] + R.land[0]) / 2; for (const z of [zc - 2.7, zc + 2.7]) this.O.push({ x0: x - 0.06, x1: x + 0.06, z0: z - 0.06, z1: z + 0.06, y0: 0, y1: 5 }); }
    this.glow.push([(R.up[0] + R.land[1]) / 2, zc, 10, C.blue, 0.12]);
  },

  // ============================================================ the Singing Tree
  // Forty-eight strands of lights from a star eighteen metres up to a ring on the snow, and on its south face eyes
  // and a mouth, in bulbs, that sing the tune. A little train goes round its foot.
  _tree() {
    const B = this.B, W = this.W, { x: tx, z: tz, H, R } = TREE, strands = 72, per = 100;
    const face = Math.PI / 2;                                     // it faces south (+z), where the way comes round to the finish
    const cone = (a, y, out = 0.12) => { const r = R * (1 - (y - 0.4) / (H - 0.4)) + out; return [tx + Math.cos(a) * r, y, tz + Math.sin(a) * r]; };
    for (let j = 0; j < strands; j++) {
      const a = j / strands * TAU;
      let da = a - face; da = Math.atan2(Math.sin(da), Math.cos(da));
      for (let i = 0; i < per; i++) {
        const t = i / (per - 1), y = 0.4 + t * (H - 0.4), [x, , z] = cone(a, y);
        const inFace = Math.abs(da) < 0.62 && y > 3.6 && y < 9.6;
        if (inFace) B.add(x, y, z, [0.12, 0.45, 0.18], 2, Math.random(), t, j / strands, 0.05);
        else B.add(x, y, z, [C.green, C.gold, C.red, C.white][(i + j) % 4], 5, Math.random(), t, j / strands, 0.065);
      }
      W.stroke([cone(a, 0.4, 0.05), cone(a, H, 0.05)], [0.12, 0.6, 0.22], null, 0.03);
    }
    // the face, laid on the cone a little proud of it
    const onCone = (du, y, out = 0.32) => { const r = R * (1 - (y - 0.4) / (H - 0.4)) + out, a = face + du / r; return [tx + Math.cos(a) * r, y, tz + Math.sin(a) * r]; };
    for (const ex of [-1.05, 1.05]) for (let gx = -4; gx <= 4; gx++) for (let gy = -4; gy <= 4; gy++) { const u = gx / 4, v = gy / 4; if (u * u + v * v > 1.05) continue; const [x, y, z] = onCone(ex + gx * 0.12, 8.1 + gy * 0.12); B.add(x, y, z, C.white, 7, 0, u, v, 0.15); }
    for (let gx = -8; gx <= 8; gx++) for (let gy = -5; gy <= 5; gy++) { const u = gx / 8, v = gy / 5; if (u * u + v * v > 1.1) continue; const [x, y, z] = onCone(gx * 0.15, 5.4 + gy * 0.17); B.add(x, y, z, C.red, 6, 0, u, v, 0.17); }
    { const [x, y, z] = onCone(0, 6.9, 0.4); B.add(x, y, z, C.gold, 2, 0, 0, 0, 0.36); }
    // cheeks
    for (const ex of [-2.0, 2.0]) for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, [x, y, z] = onCone(ex + Math.cos(a) * 0.22, 6.2 + Math.sin(a) * 0.22, 0.28); B.add(x, y, z, C.pink, 2, i, 0, 0, 0.13); }
    const st = this._own(star(1.7, C.gold), 0, tx, H + 1.4, tz, 0); this.anim.push({ kind: 'spin', grp: st, rate: 0.5 });
    for (let i = 0; i < 300; i++) { const a = i / 300 * TAU; B.add(tx + Math.cos(a) * (R + 0.9), 0.15, tz + Math.sin(a) * (R + 0.9), C.warm, 0, Math.random(), 0, 0, 0.05); }
    // the train's track (two rails of light) and the train
    const TR = 8.6; this.trainR = TR;
    for (let i = 0; i < 440; i++) { const a = i / 440 * TAU; for (const d of [-0.28, 0.28]) B.add(tx + Math.cos(a) * (TR + d), 0.06, tz + Math.sin(a) * (TR + d), C.gold, 2, i * 0.3, 0, 0, 0.04); }
    this.train = [engine(), wagon(C.red, C.gold), wagon(C.blue, C.white), wagon(C.green, C.red), wagon(C.purple, C.gold)].map(strokes => this._own(strokes, 0.22, tx, 0, tz, 0, 1.2));
    this.trainA = 0;
    for (const [dx, dz, c1, c2, w] of [[-4.6, 4.9, C.red, C.gold, 1.2], [4.3, 5.2, C.blue, C.white, 1.0], [0.4, 6.6, C.green, C.red, 0.9], [-6.5, 0.5, C.gold, C.green, 1.1], [6.6, -0.6, C.pink, C.white, 1.0]]) {
      const x = tx + dx, z = tz + dz; if (Math.hypot(dx, dz) > 7.4) continue; const M = new THREE.Matrix4().makeRotationY(dx).setPosition(x, 0, z); this.W.frame(present(w, w * 0.8, w, c1, c2), 0, M);
    }
    // solid: the cone's foot (roughly round, in three boxes)
    for (const [hx, hz] of [[R, R * 0.45], [R * 0.72, R * 0.72], [R * 0.45, R]]) this.O.push({ x0: tx - hx, x1: tx + hx, z0: tz - hz, z1: tz + hz, y0: 0, y1: H * 0.6 });
    this.glow.push([tx, tz, 16, C.gold, 0.16], [tx - 6, tz + 6, 6, C.red, 0.12], [tx + 6, tz + 6, 6, C.green, 0.12], [tx, tz - 8, 6, C.blue, 0.1]);
  },

  // ============================================================ everything else in the show
  _figures() {
    const W = this.W, B = this.B;
    // the ornament garden between the first two straights: giant baubles and stacks of presents
    [[C.red, 327, 88], [C.gold, 334, 92], [C.blue, 341, 87.5], [C.purple, 348, 92], [C.green, 355, 88], [C.pink, 361, 92]].forEach(([c, x, z], i) => {
      const r = 0.9 + (i % 2) * 0.35, M = new THREE.Matrix4().makeTranslation(x, 0, z); W.frame(ornament(c, r), 0, M); this.O.push({ x0: x - r, x1: x + r, z0: z - r, z1: z + r, y0: 0, y1: r * 2 + 0.3 }); this.glow.push([x, z, r * 2.5, c, 0.14]);
    });
    // the reindeer meadow between the second and third straights: some grazing, and a snowman family watching
    for (const [x, z, yaw, sc] of [[332, 68, 0.4, 1.5], [340, 72, -2.6, 1.3], [347, 66, 2.2, 1.6], [355, 71, -0.3, 1.4]]) {
      const M = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(sc, sc, sc));
      W.frame(deerBody('stand'), 0, M); this.O.push({ x0: x - 0.9, x1: x + 0.9, z0: z - 0.9, z1: z + 0.9, y0: 0, y1: 1.2 * sc });
      const hw = new Wire(); hw.frame(deerHead(C.warm, x === 347), 0, null); const hm = hw.mesh(); hm.material = this._wm || (this._wm = hm.material); const hg = new THREE.Group(); hg.add(hm);
      hg.position.copy(new THREE.Vector3(1.22, 1.28, 0).applyMatrix4(M)); hg.rotation.y = yaw; hg.scale.setScalar(sc); this.g.add(hg);
      this.anim.push({ kind: 'graze', head: hg, ph: x * 0.7 }); this.glow.push([x, z, 2.5, C.warm, 0.12]);
    }
    [[360, 67, 1.2, C.red], [362.5, 68.5, 0.9, C.green], [364.5, 67.3, 0.7, C.purple]].forEach(([x, z, sc, sf]) => { const M = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -0.4), new THREE.Vector3(1, 1, 1)); W.frame(snowman(sc, sf), 0, M); this.O.push({ x0: x - 0.45 * sc, x1: x + 0.45 * sc, z0: z - 0.45 * sc, z1: z + 0.45 * sc, y0: 0, y1: 2 * sc }); });
    // the Ice Palace between the third and fourth straights: towers of pale light with pointed roofs, and two polar bears
    {
      const towers = [[338, 49, 1.3, 5], [344, 47.5, 1.8, 8], [351, 49, 2.4, 11], [358, 47.5, 1.8, 8], [364, 49, 1.3, 5]];
      for (const [x, z, r, h] of towers) {
        for (let y = 0; y <= h; y += h / 4) W.stroke(ring3(x, y, z, r, 'y', 18), C.ice, null, 0.03);
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; W.stroke([[x + Math.cos(a) * r, 0, z + Math.sin(a) * r], [x + Math.cos(a) * r, h, z + Math.sin(a) * r], [x, h + r * 1.6, z]], i % 2 ? C.white : C.ice, null, 0.03); }
        for (let i = 0; i < 90; i++) { const a = i / 90 * TAU; B.add(x + Math.cos(a) * r, h + 0.05, z + Math.sin(a) * r, C.ice, 1, i * 0.1 + x, 0, 0, 0.05); }
        B.add(x, h + r * 1.6 + 0.2, z, C.white, 2, 0, 0, 0, 0.18);
        for (let y = 0.2; y < h; y += 0.15) for (let i = 0; i < 6; i++) { const a = i / 4 * TAU + y; B.add(x + Math.cos(a) * r, y, z + Math.sin(a) * r, C.ice, 9, (x * 0.1 + i * 0.25) % 1, 1 - y / h, 0, 0.05); }
        this.O.push({ x0: x - r, x1: x + r, z0: z - r, z1: z + r, y0: 0, y1: h });
        this.glow.push([x, z, r * 2.8, C.ice, 0.14]);
      }
      for (let x = 339.3; x < 363; x += 0.12) { const y = 2.2 + (Math.floor((x - 339.3) / 0.9) % 2) * 0.35; B.add(x, y, 50.5, C.white, 0, Math.random(), 0, 0, 0.045); }
      W.stroke([[338, 0, 50.5], [338, 2.2, 50.5], [364, 2.2, 50.5], [364, 0, 50.5]], C.ice, null, 0.03); this.O.push({ x0: 338, x1: 364, z0: 50.3, z1: 50.7, y0: 0, y1: 2.2 });
      for (const [x, z, yaw, sc] of [[333, 52.5, 0.3, 1.6], [368.5, 45, Math.PI + 0.4, 1.3]]) { const M = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(sc, sc, sc)); W.frame(polarBear(), 0, M); this.O.push({ x0: x - 1, x1: x + 1, z0: z - 1, z1: z + 1, y0: 0, y1: 1.1 }); }
    }
    // the Penguin Slide, north of the fourth straight: a chute of ice, and penguins that slide down it and waddle back up
    {
      const sx0 = 374, sx1 = 352, sz = 27, top = 3.4, hS = x => top * Math.pow((x - sx1) / (sx0 - sx1), 1.6);
      for (let x = sx1; x <= sx0; x += 0.25) for (const d of [-0.7, 0.7]) { B.add(x, hS(x) + 0.3, sz + d, C.ice, 1, -x * 0.5, 0, 0, 0.06); if (Math.round(x * 4) % 6 === 0) for (let y = hS(x) - 0.2; y > 0.15; y -= 0.4) B.add(x, y, sz + d, C.blue, 9, x * 0.13 % 1, 1 - y / top, 0, 0.04); }
      const pos = [];
      for (let i = 0; i < 40; i++) { const xa = sx1 + (sx0 - sx1) * i / 40, xb = sx1 + (sx0 - sx1) * (i + 1) / 40; for (const [x, z] of [[xa, sz - 0.65], [xb, sz - 0.65], [xb, sz + 0.65], [xa, sz - 0.65], [xb, sz + 0.65], [xa, sz + 0.65]]) pos.push(x, hS(x) + 0.12, z); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
      const chute = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x9fd0ff, roughness: 0.15, metalness: 0.1, emissive: 0x3a7ac0, emissiveIntensity: 0.6, side: THREE.DoubleSide })); this.g.add(chute);
      W.stroke([[sx0, 0, sz - 0.7], [sx0, top + 0.3, sz - 0.7]], C.ice, null, 0.04); W.stroke([[sx0, 0, sz + 0.7], [sx0, top + 0.3, sz + 0.7]], C.ice, null, 0.04);
      for (let y = 0.3; y < top; y += 0.35) W.stroke([[sx0 + 0.1, y, sz - 0.7], [sx0 + 0.1, y, sz + 0.7]], C.white, null, 0.025);
      for (let x = sx1; x < sx0; x += 4) this.O.push({ x0: x, x1: x + 4, z0: sz - 0.75, z1: sz + 0.75, y0: 0, y1: hS(x + 4) + 0.2 });
      this.slide = { sx0, sx1, sz, hS, back: sz - 3.2 };
      this.penguins = Array.from({ length: 6 }, (_, i) => ({ grp: this._own(penguin(), 0, sx0, 0, sz, 0, 0.75), ph: i / 6 }));
      this.glow.push([(sx0 + sx1) / 2, sz, 9, C.ice, 0.12]);
    }
    // the sleigh and its team, flying round over everything
    {
      const grp = new THREE.Group(); grp.scale.setScalar(2.4); this.g.add(grp);
      const sw = new Wire(); sw.frame(sleigh(), 0, null); const sm = sw.mesh(); sm.material = this._wm || (this._wm = sm.material); grp.add(sm);
      const deer = [];
      for (let i = 0; i < 4; i++) {
        const a = new Wire(), b = new Wire(), head = new Wire(); a.frame(deerBody('leap'), 0, null); b.frame(deerBody('stand'), 0, null); head.frame(deerHead(C.warm, i === 3), 0, null);
        const d = new THREE.Group(), row = Math.floor(i / 2), lane = i % 2 ? 0.55 : -0.55; d.position.set(2.6 + row * 2.0, 0.35 + row * 0.25, lane);
        const ma = a.mesh(), mb = b.mesh(), hd = head.mesh(); for (const m of [ma, mb, hd]) m.material = this._wm; const hg = new THREE.Group(); hg.position.set(1.22, 1.28, 0); hg.add(hd); d.add(ma, mb, hg); mb.visible = false; grp.add(d);
        deer.push({ d, a: ma, b: mb, i, y0: d.position.y });
        sw.stroke([[1.3, 1.28, 0], [2.6 + row * 2.0 + 1.0, 1.3 + row * 0.25, lane]], C.gold, null, 0.012);
      }
      const reins = new Wire(); for (let i = 0; i < 4; i++) { const row = Math.floor(i / 2), lane = i % 2 ? 0.55 : -0.55; reins.stroke([[1.3, 1.28, 0], [2.6 + row * 2.0 + 1.0, 1.3 + row * 0.25, lane]], C.gold, null, 0.012); }
      const rm = reins.mesh(); rm.material = this._wm; grp.add(rm);
      this.sleigh = { grp, deer, a: 0 };
    }
  },

  // ============================================================ the ornaments to collect
  _ornaments() {
    const P = [], at = s => this.at(s), side = (s, off, y = 0.55) => { const p = at(s); return [p.x + p.nx * off, y + this.ground(p.x + p.nx * off, p.z + p.nz * off), p.z + p.nz * off]; };
    const [t0, t1] = this.sTunnel;
    P.push(side((t0 + t1) / 2, 0));                                                                        // 1 in the tunnel
    const bankHigh = bk => { const x = bk.c[0] + bk.u[0] * 12.8, z = bk.c[1] + bk.u[1] * 12.8; return [x, bk.fn(x, z) + 0.45, z]; };
    P.push(bankHigh(this.banks[0]));                                                                       // 2 high on the first curve
    P.push(side(this.sAt(352, 79), 1.7));                                                       // 3 in the cathedral, off the line
    P.push([GIFT.deck[0] - 1.1, GIFT.kick[2] + 0.4, (GIFT.z0 + GIFT.z1) / 2]);                         // 4 over the gift box gap
    P.push(bankHigh(this.banks[1]));                                                                       // 5
    P.push(side(this.sAt(330, 59), -1.6));                                                      // 6 among the nutcrackers
    P.push([(this.bridgeGap.x0 + this.bridgeGap.x1) / 2, BRIDGE.up[2] + 0.4, (BRIDGE.z0 + BRIDGE.z1) / 2]);  // 7 over the bridge's gap
    P.push(bankHigh(this.banks[2]));                                                                       // 8
    P.push(side((this.sCandy[0] + this.sCandy[1]) / 2, 1.5));                                               // 9 in the Candy Cane Tunnel, off the line
    P.push(side(this.sKaleido[0] * 0.4 + this.sKaleido[1] * 0.6, -1.5));                                   // 10 in the Kaleidoscope Tunnel
    P.push(null);                                                                                          // 11 rides on the train
    { const a = (270 + 18) * Math.PI / 180, r = RING + 1.7; P.push([TREE.x + Math.cos(a) * r, 0.55, TREE.z + Math.sin(a) * r]); }   // 12 the outside of the ring
    this.orbs = P.map((p, i) => ({ p: p ? new THREE.Vector3(...p) : new THREE.Vector3(), train: !p, got: false, i }));
    const cols = [C.red, C.gold, C.blue, C.green, C.purple, C.pink, C.ice, C.orange, C.red, C.gold, C.blue, C.green];
    const geo = new THREE.SphereGeometry(0.2, 14, 10), mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff }), P.length), col = new THREE.Color();
    cols.forEach((c, i) => mesh.setColorAt(i, col.setRGB(c[0] * 1.1, c[1] * 1.1, c[2] * 1.1)));
    mesh.frustumCulled = false; mesh.name = 'lightshow-ornaments'; this.g.add(mesh); this.orbMesh = mesh;
    const cap = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.8, 0.7) }), P.length); cap.frustumCulled = false; this.g.add(cap); this.capMesh = cap;
    this._m4 = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._v = new THREE.Vector3(); this._sc = new THREE.Vector3(); this._ax = new THREE.Vector3(0, 1, 0);
    this.got = 0;
  },

  // Soft coloured pools of light on the snow. One instanced mesh; the whole of it breathes with the beat.
  _glows(g) {
    const n = this.glow.length; if (!n) return;
    const tex = canvasTex(64, 64, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, n);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), col = new THREE.Color();
    this.glow.forEach(([x, z, r, c, k], i) => { m.setMatrixAt(i, M.compose(new THREE.Vector3(x, this.ground(x, z) + 0.05, z), Q, new THREE.Vector3(r * 2, r * 2, 1))); m.setColorAt(i, col.setRGB(c[0] * k, c[1] * k, c[2] * k)); });
    m.frustumCulled = false; m.renderOrder = 5; g.add(m); this.glowMat = mat;
  },

  // ============================================================ play
  // What moves round the show on its own: the train round the tree, the penguins down their slide, the sleigh overhead.
  // Run from update, and also while the show can be seen but is asleep (active), so nothing stands frozen where it was
  // built (the sleigh was built at the origin, which is on Michigan Avenue).
  _movers(dt, T, calm) {
    {
      const A = this.trainA += dt * (calm ? 0.12 : 0.3), TR = this.trainR;
      this.train.forEach((grp, j) => { const a = A - j * 2.3 / TR; grp.position.set(TREE.x + Math.cos(a) * TR, 0, TREE.z + Math.sin(a) * TR); grp.rotation.y = -a - Math.PI / 2; });
    }
    {
      const L = this.slide;
      for (const pg of this.penguins) {
        const c = (T / 12 + pg.ph) % 1, grp = pg.grp;
        if (c < 0.22) { const u = c / 0.22, x = L.sx0 + (L.sx1 - L.sx0) * u * u; grp.position.set(x, L.hS(x) + 0.15, L.sz); grp.rotation.set(0, -Math.PI / 2, -1.25); }
        else if (c < 0.3) { const u = (c - 0.22) / 0.08, x = L.sx1 - 4 * Math.sin(u * Math.PI / 2); grp.position.set(x, 0.05, L.sz); grp.rotation.set(0, -Math.PI / 2, -1.4); }
        else if (c < 0.36) { const u = (c - 0.3) / 0.06; grp.position.set(L.sx1 - 4, 0, L.sz - 3.2 * u); grp.rotation.set(0, Math.PI, 0); }
        else if (c < 0.92) { const u = (c - 0.36) / 0.56, x = L.sx1 - 4 + (L.sx0 + 1 - (L.sx1 - 4)) * u; grp.position.set(x, Math.abs(Math.sin(T * 9 + pg.ph * 5)) * 0.06, L.back); grp.rotation.set(0, Math.PI / 2, Math.sin(T * 9 + pg.ph * 5) * 0.12); }
        else { const u = (c - 0.92) / 0.08; grp.position.set(L.sx0 + 1 - u, L.hS(L.sx0) * u, L.back + 3.2 * u); grp.rotation.set(0, 0, 0); }
      }
    }
    {
      const Sl = this.sleigh, a = Sl.a += dt * (calm ? 0.03 : 0.085), cx = 342, cz = 45, rx = 38, rz = 52;
      Sl.grp.position.set(cx + Math.cos(a) * rx, 13 + Math.sin(T * 0.7) * 1.2, cz + Math.sin(a) * rz);
      Sl.grp.rotation.y = Math.atan2(-Math.cos(a) * rz, -Math.sin(a) * rx);      // its +x along the way it is flying
      const fr = Math.floor(T * 2.4) % 2;
      for (const d of Sl.deer) { const f = (fr + d.i) % 2; d.a.visible = f === 0; d.b.visible = f === 1; d.d.position.y = d.y0 + (f === 0 ? 0.18 : 0); }
    }
  },
  active(k) {
    if (!this.g) return false;
    const p = k.pos, dx = Math.max(SHOW.x0 - p.x, 0, p.x - SHOW.x1), dz = Math.max(SHOW.z0 - p.z, 0, p.z - SHOW.z1), far = Math.hypot(dx, dz);
    this.g.visible = far < 300;
    this.far = far;
    if (far > 140) {
      if (this._on) this._sleep(k);
      if (this.g.visible && this.sleigh) {                     // seen from afar: the sleigh, the train and the penguins keep moving
        const now = performance.now() / 1000, dt = Math.min(0.1, now - (this._idleT || now)); this._idleT = now;
        this.t += dt; this._movers(dt, this.t, k.G.set.reduce ? 1 : 0);
      }
      return false;
    }
    this._idleT = 0;
    return true;
  },
  // Gone out of range: the music fades (its clock goes on), the clock stops, the pads come back.
  _sleep(k) { this._on = false; if (this.music.out) this.music.update(k.sound, 0); if (k.sound) k.sound.duck = 0; if (this.run) this._endRun(null); },
  update(dt, k) {
    this._on = true;
    const G = k.G, v = k.v, p = k.pos, U = this.U, S = this.music.S, snd = k.sound;
    this.t += dt; const T = this.t;
    // --- the music, and where it is
    const want = snd && snd.musicOn && G.set.gallerymusic !== false && !snd.muted && G.mode !== 'race' && (G.state === 'play' || G.state === 'study');
    const near = Math.max(0, 1 - this.far / 70), level = want ? near * near * (snd.vol.music || 0) * 0.8 : 0;
    this.music.update(snd, level);
    if (snd) { snd.duck = Math.min(1, near * 1.5) * (want ? 1 : 0); if (want && near > 0 && snd.nextTune !== undefined && snd.ctx) snd.nextTune = Math.max(snd.nextTune, snd.ctx.currentTime + 4); }
    const calm = G.set.reduce ? 1 : 0;
    U.uT.value = T; U.uCalm.value = calm; U.uBeat.value = S.kick; U.uPh.value = S.ph; U.uBarN.value = S.barN; U.uNote.value = S.note; U.uHue.value = S.hue;
    U.uDark.value += ((S.dark ? 1 : 0) - U.uDark.value) * Math.min(1, dt * 6); U.uFlash.value = Math.max(S.flash * 0.9, this._fin || 0);
    U.uPat.value = Math.floor(S.barN / 4) + S.song;
    U.uMouth.value += ((S.note > 0.32 ? 0.25 + 0.75 * S.note : 0.1) - U.uMouth.value) * Math.min(1, dt * 18);
    const bl = (T % 4.3) / 4.3; U.uBlink.value = bl > 0.965 ? 1 : 0;
    for (let i = 0; i < 3; i++) { const c = S.pal[i], u = U.uPal.value[i]; u.x += (c[0] - u.x) * Math.min(1, dt * 2); u.y += (c[1] - u.y) * Math.min(1, dt * 2); u.z += (c[2] - u.z) * Math.min(1, dt * 2); }
    if (this._fin > 0) { this._fin = Math.max(0, this._fin - dt * 0.4); } U.uFin.value = this.run ? 1 : (this._fin || 0);
    const dim = 1 - U.uDark.value * 0.8 * (1 - calm);
    if (this.glowMat) this.glowMat.color.setScalar(1 - U.uDark.value * 0.5 * (1 - calm));      // the light on the snow follows the displays down in the count-in, and that is all
    U.uPix.value = 1.25 / Math.max(240, innerHeight);
    if (this._wm) this._wm.color.setScalar((calm ? 1 : 0.85 + 0.3 * S.kick) * dim);
    if (this.wireMat && this.wireMat !== this._wm) this.wireMat.color.setScalar((calm ? 1 : 0.85 + 0.3 * S.kick) * dim);
    // --- the car on the way
    U.uCarP.value.set(p.x, p.y, p.z);
    const i = this._track(p), q = this.P[i], onWay = this.td < q.w + 1.2 && p.y < 6;
    U.uCarS.value = onWay ? q.s : -1000;
    U.uLook.value = Math.max(-1, Math.min(1, (TREE.x - p.x) / 12));        // (+u on the face is to the west)
    // --- what moves
    for (const a of this.anim) {
      if (a.kind === 'spin') a.grp.rotation.y += a.rate * dt * (calm ? 0.3 : 1);
      else if (a.kind === 'spinz') a.grp.rotation.z += a.rate * dt * (calm ? 0.3 : 1);
      else if (a.kind === 'graze') a.head.rotation.z = -0.25 - 0.35 * (0.5 + 0.5 * Math.sin(T * 0.9 + a.ph));
    }
    for (const n of this.nuts) {
      const d2 = (p.x - n.x) ** 2 + (p.z - n.z) ** 2, want = d2 < 81 ? 1 : 0;
      n.t += (want - n.t) * Math.min(1, dt * (want ? 5 : 2));
      n.up.rotation.z = n.t * 2.35; n.fore.rotation.z = n.t * 1.75;
    }
    this._movers(dt, T, calm);
    this._orbs(dt, k);
    this._runStep(dt, k, i, onWay);
    this.prevS = onWay ? q.s : -1;
  },
  // the nearest point of the way, looked for near where the car was last
  _track(p) {
    const P = this.P; let best = 1e9, bi = this.ti;
    for (let i = Math.max(0, this.ti - 30), hi = Math.min(P.length - 1, this.ti + 50); i <= hi; i++) { const d = (P[i].x - p.x) ** 2 + (P[i].z - p.z) ** 2; if (d < best) { best = d; bi = i; } }
    if (best > 25) for (let i = 0; i < P.length; i += 3) { const d = (P[i].x - p.x) ** 2 + (P[i].z - p.z) ** 2; if (d < best) { best = d; bi = i; } }
    this.ti = bi; this.td = Math.sqrt(best); return bi;
  },
  _orbs(dt, k) {
    const p = k.pos, M = this._m4, Q = this._q, V = this._v, Sc = this._sc, T = this.t;
    for (const o of this.orbs) {
      if (o.train) { const tr = this.train[this.train.length - 1]; o.p.set(tr.position.x, 0.82, tr.position.z); }
      if (!o.got && (p.x - o.p.x) ** 2 + (p.z - o.p.z) ** 2 < 0.75 && Math.abs(p.y + 0.1 - o.p.y) < 0.75) this._take(o, k);
      const y = o.p.y + Math.sin(T * 2 + o.i) * 0.08, s = o.got ? 0 : 1 + 0.15 * this.U.uBeat.value;
      Q.setFromAxisAngle(this._ax, T * 1.5 + o.i); Sc.setScalar(s);
      M.compose(V.set(o.p.x, y, o.p.z), Q, Sc); this.orbMesh.setMatrixAt(o.i, M);
      M.compose(V.set(o.p.x, y + 0.22 * s, o.p.z), Q, Sc); this.capMesh.setMatrixAt(o.i, M);
    }
    this.orbMesh.instanceMatrix.needsUpdate = true; this.capMesh.instanceMatrix.needsUpdate = true;
  },
  _take(o, k) {
    o.got = true; this.got++;
    const f = 523.25 * Math.pow(2, [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26][(this.got - 1) % 12] / 12);
    k.synth.chime([f, f * 1.5, f * 2], { gap: 0.06, dur: 0.9, vol: 0.05 });
    if (this.run) { this.run.orbs++; if (this.run.orbs === this.orbs.length && k.find('ornaments')) k.callout('EVERY ORNAMENT'); }
    const run = this.run ? this.run.orbs : 0, of = this.orbs.length;
    tonight(n => { n.ornaments = (n.ornaments || 0) + 1; n.ornamentsBest = Math.max(n.ornamentsBest || 0, run); n.ornamentsOf = of; });
  },
  _hud(text, hold) {
    if (!this.hud) { const d = this.hud = document.createElement('div'); d.id = 'lightRun'; d.setAttribute('aria-live', 'polite'); d.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 58px);left:50%;transform:translateX(-50%);padding:4px 12px;border-radius:10px;background:rgba(10,14,22,.62);color:#f3efe2;font:600 17px/1.3 ui-monospace,Menlo,monospace;letter-spacing:.04em;pointer-events:none;z-index:30;text-align:center;white-space:nowrap'; document.body.append(d); }
    this.hud.hidden = !text; if (text) this.hud.textContent = text;
    clearTimeout(this._hudOff); if (hold) this._hudOff = setTimeout(() => { if (this.hud) this.hud.hidden = true; }, hold * 1000);
  },
  // ---- the Light Run: through the Grand Arch, the whole way in order, to the finish under the tree
  _runStep(dt, k, i, onWay) {
    const p = k.pos, s = this.P[i].s, R = this.run, kind = k.v.kind === 'drone' ? 'drone' : 'car', fmt = t => t.toFixed(2);
    if (Math.hypot(p.x - this.gateAt.x, p.z - this.gateAt.z) < 14) k.once('lightrun', 'The Light Run: through the arch to start the clock.', 5);
    const crossed = onWay && this.prevS >= 0 && this.prevS < this.sGate && s >= this.sGate && s < this.sGate + 4;
    if (crossed) {                                                     // (crossing it again during a run starts it again)
      this.run = { t: 0, prog: s, orbs: 0, off: 0, kind };
      for (const o of this.orbs) o.got = false; this.got = 0;
      k.synth.chime([392, 523.25, 659.25], { gap: 0.08, dur: 0.6, vol: 0.045 });
      return;
    }
    if (!R) return;
    R.t += dt;
    // how far along the way, in order: the nearest point a little behind or ahead of the last one reached
    let best = 1e9, bs = R.prog;
    for (let j = Math.max(0, Math.floor((R.prog - 4) / this.step)), hi = Math.min(this.P.length - 1, Math.ceil((R.prog + 22) / this.step)); j <= hi; j++) {
      const q = this.P[j], d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2; if (d < best) { best = d; bs = q.s; }
    }
    const lim = 6;
    if (best < lim * lim) { R.prog = Math.max(R.prog, bs); R.off = 0; } else if (best > 900) R.off += dt;
    if (R.off > 5 || R.t > 300) { this._endRun(k, 'Off the course.'); return; }
    if (R.prog >= this.sEnd - 1.2) { this._finish(k); return; }
    const b = this.best[R.kind];
    this._hud(`LIGHT RUN  ${fmt(R.t)}   ✦ ${R.orbs}/${this.orbs.length}${b ? '   best ' + fmt(b) : ''}`);
  },
  _finish(k) {
    const R = this.run, t = R.t, b = this.best[R.kind], isBest = !b || t < b; this.run = null;
    if (isBest) { this.best[R.kind] = t; try { localStorage.setItem('after-hours.lightrun.' + R.kind, String(t)); } catch { /* private window */ } }
    this._hud(`LIGHT RUN  ${t.toFixed(2)} s${isBest ? '  BEST' : '   best ' + this.best[R.kind].toFixed(2)}   ✦ ${R.orbs}/${this.orbs.length}`, 6);
    this._fin = 1.4;
    k.synth.chime([523.25, 659.25, 783.99, 1046.5, 1318.5], { gap: 0.09, dur: 1.4, vol: 0.05 });
    if (k.find('wonderland')) k.callout('WINTER WONDERLAND');
  },
  _endRun(k, why) { this.run = null; this._hud(null); if (k && why) k.say(why, 2.5); },
  spots() {
    if (!this.finishAt) return [];
    return [{ kind: 'secret', id: 'wonderland', name: 'Winter Wonderland (finish the Light Run)', x: this.finishAt.x, y: 0, z: this.finishAt.z },
      { kind: 'secret', id: 'ornaments', name: 'Every ornament in one Light Run', x: TREE.x, y: 0, z: TREE.z }];
  },
  reset() { this.run = null; this._hud(null); if (this.orbs) for (const o of this.orbs) o.got = false; this.got = 0; this._fin = 0; },
});

// ---------------------------------------------------------------- figures of its own
// A nutcracker soldier, front on, two metres tall before scaling: boots, white breeches, red coat with a gold belt and
// buttons, a pink face with a white beard, a tall hat with a gold band and a plume. The right arm is separate (it salutes).
function nutcracker() {
  const s = [];
  for (const sx of [-1, 1]) {
    s.push({ pts: [[sx * 0.05, 0.02], [sx * 0.24, 0.02], [sx * 0.22, 0.25], [sx * 0.06, 0.25], [sx * 0.05, 0.02]], col: [0.35, 0.45, 1.8], d: 0.1 });
    s.push({ pts: [[sx * 0.06, 0.25], [sx * 0.05, 0.85], [sx * 0.21, 0.85], [sx * 0.22, 0.25]], col: C.white, d: 0.1 });
  }
  s.push({ pts: [[-0.26, 0.85], [-0.27, 1.38], [-0.18, 1.46], [0.18, 1.46], [0.27, 1.38], [0.26, 0.85], [-0.26, 0.85]], col: C.red, d: 0.12, ties: 2 });
  s.push({ pts: [[-0.26, 0.97], [0.26, 0.97]], col: C.gold, d: 0.13 });
  for (let y = 1.07; y < 1.42; y += 0.11) s.push({ pts: circle(0, y, 0.025, 6), col: C.gold, d: 0.13 });
  for (const sx of [-1, 1]) s.push({ pts: [[sx * 0.16, 1.47], [sx * 0.34, 1.46], [sx * 0.36, 1.4]], col: C.gold, d: 0.12 });
  s.push({ pts: [[-0.27, 1.42], [-0.32, 1.12], [-0.3, 0.86]], col: C.red, d: 0.06 });               // the left arm, at its side
  s.push({ pts: circle(-0.3, 0.82, 0.05, 8), col: C.white, d: 0 });
  s.push({ pts: [[-0.35, 0.78], [-0.36, 1.7]], col: C.ice, d: 0 });                                  // a sword, at the slope
  s.push({ pts: circle(0, 1.6, 0.14, 18), col: C.pink, d: 0.12 });
  s.push({ pts: [[-0.12, 1.56], [-0.08, 1.44], [0, 1.4], [0.08, 1.44], [0.12, 1.56]], col: C.white, d: 0.13 });
  s.push({ pts: circle(-0.05, 1.63, 0.018, 5), col: C.blue, d: 0.14 }); s.push({ pts: circle(0.05, 1.63, 0.018, 5), col: C.blue, d: 0.14 });
  s.push({ pts: [[-0.15, 1.72], [-0.15, 2.1], [0.15, 2.1], [0.15, 1.72], [-0.15, 1.72]], col: [0.4, 0.5, 2.2], d: 0.12, ties: 2 });
  s.push({ pts: [[-0.15, 1.78], [0.15, 1.78]], col: C.gold, d: 0.13 });
  s.push({ pts: [[0, 2.1], [0.02, 2.3], [0.07, 2.38]], col: C.red, d: 0.03 });
  return s;
}
// The train round the tree, side on, along its own +x: an engine with a tall chimney and a cowcatcher, and wagons.
function engine() {
  return [
    { pts: [[-0.7, 0.25], [0.55, 0.25], [0.55, 0.62], [-0.2, 0.62], [-0.2, 0.95], [-0.7, 0.95], [-0.7, 0.25]], col: C.red, d: 0.22, ties: 2 },
    { pts: [[-0.75, 0.98], [-0.15, 0.98]], col: C.gold, d: 0.25 },
    { pts: [[0.3, 0.62], [0.28, 0.95], [0.42, 0.95], [0.4, 0.62]], col: C.gold, d: 0.06 },
    { pts: [[0.55, 0.25], [0.78, 0.12], [0.55, 0.45]], col: C.white, d: 0.18 },
    { pts: circle(-0.45, 0.2, 0.17, 12), col: C.gold, d: 0.24 }, { pts: circle(0.25, 0.16, 0.13, 12), col: C.gold, d: 0.24 },
    { pts: circle(0.6, 0.55, 0.05, 8), col: C.white, d: 0 },
  ];
}
function wagon(c1, c2) {
  return [
    { pts: [[-0.6, 0.22], [0.6, 0.22], [0.6, 0.62], [-0.6, 0.62], [-0.6, 0.22]], col: c1, d: 0.22, ties: 2 },
    { pts: [[-0.3, 0.62], [-0.3, 0.9], [0.1, 0.9], [0.1, 0.62]], col: c2, d: 0.12 },
    { pts: [[0.15, 0.62], [0.15, 0.8], [0.45, 0.8], [0.45, 0.62]], col: C.white, d: 0.14 },
    { pts: circle(-0.38, 0.16, 0.12, 10), col: C.gold, d: 0.24 }, { pts: circle(0.38, 0.16, 0.12, 10), col: C.gold, d: 0.24 },
  ];
}
