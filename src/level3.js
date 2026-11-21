// Level 3: things to find and do in the Modern Wing's top-floor galleries (features.js). Each is themed on what hangs
// in its room. Only works with no copyright notice are reproduced or set moving (the Kandinskys in 392, the Mondrians
// in 393); for the rest (Cubism in 391, Picasso and Matisse in 394, Brancusi in 395, Surrealism in 396 and 397,
// Miró in 398) the room or the movement is referred to with shapes made here, never a copy of a work.
// Music is all published before 1900 and played on the game's own synthesiser.
// The terrace, the restaurant and its kitchen are in level3-terrace.js; the conservation offices in level3-back.js.
import * as THREE from 'three';
import { feature } from './features.js';
import { Clay, cast } from './sculpt.js';
import { TAU, std, metal, glowMat, canvasTex, lathe, glow, spot, block, rnd, ease } from './level3kit.js';
import './level3-terrace.js';
import './level3-back.js';

const once = (k, key, text, hold = 4) => k.once('l3-' + key, text, hold);

// ================================================================ 391: the guitar, whole
// A Cubist still life of our own (a guitar, a glass, a newspaper, a table) painted on a canvas and broken into shards,
// each hung at its own distance along the line from one spot on the floor. From that spot, and only there, it is whole.
function cubistCanvas() {
  return canvasTex(1024, 768, (g, W, H) => {
    const R = rnd(391), poly = (pts, fill, stroke, lw = 4) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } };
    g.fillStyle = '#8c8673'; g.fillRect(0, 0, W, H);
    // the planes behind, tilted against one another
    poly([[0, 0], [430, 0], [300, 768], [0, 768]], '#7a8264');
    poly([[600, 0], [1024, 0], [1024, 520], [760, 380]], '#b58a4a');
    poly([[330, 0], [640, 0], [520, 300], [250, 260]], '#5c6470');
    poly([[760, 380], [1024, 520], [1024, 768], [700, 768]], '#4a3727');
    poly([[0, 520], [260, 470], [330, 768], [0, 768]], '#3d3a33');
    // stippled patch, the way the Cubists dotted a plane
    g.fillStyle = '#e8dcbd'; for (let i = 0; i < 900; i++) { const x = 640 + R() * 300, y = 60 + R() * 260; if (y < 60 + (x - 640) * 0.5) g.fillRect(x, y, 3, 3); }
    // the table top, in wood grain
    poly([[120, 560], [930, 500], [1000, 700], [60, 740]], '#6b4a2b', '#1b1612', 5);
    g.strokeStyle = 'rgba(30,18,10,.55)'; g.lineWidth = 2;
    for (let i = 0; i < 16; i++) { g.beginPath(); const y0 = 575 + i * 10; g.moveTo(110, y0 + i * 1.5); for (let x = 110; x < 980; x += 20) g.lineTo(x, y0 - (x - 110) * 0.065 + Math.sin(x * 0.03 + i) * 4 + i * 1.5); g.stroke(); }
    // the newspaper, slanted
    poly([[560, 300], [860, 330], [830, 520], [530, 490]], '#e6dcc2', '#1b1612', 3);
    g.save(); g.translate(580, 360); g.rotate(0.1); g.fillStyle = '#16130f'; g.font = 'bold 86px Georgia, serif'; g.fillText('JOU', 10, 70);
    g.fillStyle = 'rgba(30,25,20,.5)'; for (let i = 0; i < 5; i++) g.fillRect(14, 96 + i * 14, 220 - (i % 2) * 40, 5); g.restore();
    // the glass: a goblet in white line, half in shadow
    g.fillStyle = 'rgba(210,225,220,.35)'; g.beginPath(); g.moveTo(690, 150); g.quadraticCurveTo(700, 290, 760, 300); g.quadraticCurveTo(820, 290, 830, 150); g.closePath(); g.fill();
    g.strokeStyle = '#f4efe0'; g.lineWidth = 5; g.stroke(); g.beginPath(); g.ellipse(760, 150, 70, 16, 0, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(760, 300); g.lineTo(760, 410); g.moveTo(712, 420); g.quadraticCurveTo(760, 400, 808, 420); g.stroke();
    // the guitar: its body split down the middle and the halves slid apart, one dark, one ochre
    const body = (dx, fill) => { g.save(); g.beginPath(); g.rect(dx < 0 ? 0 : 400 + dx, 0, 400, 768); g.clip(); g.fillStyle = fill; g.beginPath(); g.arc(400 + dx, 470, 150, 0, TAU); g.arc(400 + dx, 280, 112, 0, TAU); g.fill(); g.strokeStyle = '#15110d'; g.lineWidth = 5; g.beginPath(); g.arc(400 + dx, 470, 150, 0, TAU); g.stroke(); g.beginPath(); g.arc(400 + dx, 280, 112, 0, TAU); g.stroke(); g.restore(); };
    body(-6, '#4e3420'); body(26, '#c99a52');
    g.fillStyle = '#100d0a'; g.beginPath(); g.arc(412, 370, 46, 0, TAU); g.fill();
    g.save(); g.translate(400, 300); g.rotate(-0.42); g.fillStyle = '#2a1d13'; g.fillRect(-22, -330, 44, 300); g.fillStyle = '#1a120c'; g.fillRect(-30, -380, 60, 60);
    g.strokeStyle = '#efe6cf'; g.lineWidth = 1.6; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-15 + i * 6, -360); g.lineTo(-15 + i * 6, 220); g.stroke(); } g.restore();
    g.fillStyle = '#1a120c'; g.fillRect(360, 520, 90, 16);
    // sheet music, pinned at a slant
    poly([[90, 120], [300, 90], [320, 250], [110, 280]], '#f1ecdc', '#1b1612', 3);
    g.strokeStyle = '#2a2420'; g.lineWidth = 1.5; for (let s = 0; s < 2; s++) for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(110, 140 + s * 70 + i * 8); g.lineTo(300, 112 + s * 70 + i * 8); g.stroke(); }
    g.fillStyle = '#16130f'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(130 + i * 19, 150 - i * 2.6 + (i % 3) * 8, 5, 4, -0.3, 0, TAU); g.fill(); }
    // strong contours across the planes, and a grain over everything
    g.strokeStyle = '#15110d'; g.lineWidth = 6; for (const [a, b, c, d] of [[300, 0, 220, 768], [0, 470, 1024, 380], [640, 0, 520, 768]]) { g.globalAlpha = 0.5; g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
    g.globalAlpha = 1;
    const im = g.getImageData(0, 0, W, H), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(im, 0, 0);
    g.strokeStyle = '#8a6a2e'; g.lineWidth = 18; g.strokeRect(9, 9, W - 18, H - 18);
  });
}
// Cut a rectangle into convex cells round seed points (each the part nearer its seed than any other).
function cells(w, h, seeds) {
  const out = [];
  for (const s of seeds) {
    let poly = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
    for (const o of seeds) {
      if (o === s) continue;
      const mx = (s[0] + o[0]) / 2, my = (s[1] + o[1]) / 2, nx = o[0] - s[0], ny = o[1] - s[1], side = p => (p[0] - mx) * nx + (p[1] - my) * ny;
      const next = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length], sa = side(a), sb = side(b);
        if (sa <= 0) next.push(a);
        if ((sa < 0) !== (sb < 0) && sa !== sb) { const t = sa / (sa - sb); next.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
      }
      poly = next; if (poly.length < 3) break;
    }
    if (poly.length >= 3) out.push(poly);
  }
  return out;
}
feature({
  id: 'l3cubist',
  secrets: [['l3cubist', 'The guitar, whole']],
  init(k) {
    const at = spot(k, 'G391', 0.1, 0.32, 0.35, 1.2); if (!at) return;
    const y = at.y, E = new THREE.Vector3(at.x, y + 0.5, at.z), D0 = 3.3, PW = 2.0, PH = 1.5;
    const C = E.clone().add(new THREE.Vector3(D0, 0.85, 0)), right = new THREE.Vector3(0, 0, 1), up = new THREE.Vector3(0, 1, 0);
    const R = rnd(3911), seeds = [];
    for (let i = 0; i < 24; i++) seeds.push([(R() - 0.5) * PW * 0.98, (R() - 0.5) * PH * 0.98]);
    const P = [], UV = [], PH_ = [], N = [];
    const toward = E.clone().sub(C).normalize();
    for (const c of cells(PW, PH, seeds)) {
      const s = 0.5 + R() * 1.05, ph = R() * TAU;
      const pts = c.map(([u, v]) => { const p = C.clone().addScaledVector(right, u).addScaledVector(up, v); return E.clone().addScaledVector(p.sub(E), s); });
      for (let i = 1; i < c.length - 1; i++) for (const j of [0, i, i + 1]) { const p = pts[j]; P.push(p.x, p.y, p.z); UV.push(c[j][0] / PW + 0.5, c[j][1] / PH + 0.5); PH_.push(ph); N.push(toward.x, toward.y, toward.z); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); geo.setAttribute('phase', new THREE.Float32BufferAttribute(PH_, 1));
    // The shards drift to and fro along their own lines from the spot: from there they never move, from anywhere else they swim.
    const uni = { uT: { value: 0 }, uE: { value: E.clone() }, uAmp: { value: 0.12 } };
    const shift = sh => { Object.assign(sh.uniforms, uni); sh.vertexShader = 'uniform float uT; uniform vec3 uE; uniform float uAmp; attribute float phase;\n' + sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = uE + (position - uE) * (1.0 + uAmp * sin(uT * 0.7 + phase));'); };
    const face = new THREE.MeshStandardMaterial({ map: cubistCanvas(), roughness: 0.85, emissive: 0xffffff, emissiveIntensity: 0.18, side: THREE.FrontSide });
    face.emissiveMap = face.map; face.onBeforeCompile = shift;
    const back = new THREE.MeshStandardMaterial({ color: 0x9a8f78, roughness: 0.9, side: THREE.BackSide, emissive: 0x2a2620, emissiveIntensity: 0.4 }); back.onBeforeCompile = shift;
    const m1 = new THREE.Mesh(geo, face), m2 = new THREE.Mesh(geo, back); m1.frustumCulled = m2.frustumCulled = false;
    k.group.add(m1, m2);
    // The mark on the floor: an eye in a chalk ring.
    const mark = new THREE.Mesh(new THREE.CircleGeometry(0.26, 32), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (g) => { g.strokeStyle = 'rgba(240,235,220,.9)'; g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 58, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(22, 64); g.quadraticCurveTo(64, 26, 106, 64); g.quadraticCurveTo(64, 102, 22, 64); g.stroke(); g.fillStyle = 'rgba(240,235,220,.9)'; g.beginPath(); g.arc(64, 64, 13, 0, TAU); g.fill(); }), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
    mark.rotation.x = -Math.PI / 2; mark.rotation.z = Math.PI / 2; mark.position.set(E.x, y + 0.012, E.z); k.group.add(mark);
    Object.assign(this, { E, C, uni, at: { x: E.x, y, z: E.z }, hold: 0, room: 'G391' });
  },
  active(k) { return !!this.E && k.inRoom('G391', 1); },
  update(dt, k) {
    this.uni.uT.value += dt;
    once(k, 'cubist', 'Shards in the air. Somewhere they make a picture.', 4);
    if (k.close(this.at, 0.42, 0.5) && k.v.kind !== 'drone') {
      k.camClose = { at: this.E, look: this.C };
      this.hold += dt;
      if (this.hold > 0.7 && !this.done) { this.done = true; k.synth.chime([392, 494, 587, 784], { gap: 0.12 }); if (k.find('l3cubist')) k.callout('THE GUITAR, WHOLE'); }
    } else { this.hold = 0; this.done = false; }
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'l3cubist', name: 'The guitar, whole (stand on the eye)', ...this.at }] : []; },
});

// ================================================================ 392: colours that sing
// Kandinsky heard colours and saw sounds; it came to him at a Lohengrin in Moscow. Seven of his kinds of shape hang in
// the air here (the paintings on the wall are his, and out of copyright). Touch one and it sounds; touch all seven and
// they play the Bridal Chorus from Lohengrin (Wagner, 1850).
const KAN = [
  { kind: 'circle', col: 0xf2c31b, halo: 0x1c2a72, s: 0.26, h: 0.3, voice: [523, 'sawtooth', 0.05] },
  { kind: 'circle', col: 0x23409c, halo: 0xe9cf73, s: 0.22, h: 0.5, voice: [131, 'triangle', 0.1] },
  { kind: 'triangle', col: 0xd2321f, s: 0.5, h: 0.3, voice: [98, 'square', 0.04] },
  { kind: 'square', col: 0x2f8a55, s: 0.36, h: 0.48, voice: [392, 'sine', 0.09] },
  { kind: 'wave', col: 0x141414, s: 0.8, h: 0.2, voice: [0] },
  { kind: 'checker', col: 0xffffff, s: 0.38, h: 0.3, voice: [659, 'triangle', 0.06] },
  { kind: 'crescent', col: 0xe0642a, s: 0.27, h: 0.52, voice: [784, 'sine', 0.07] },
];
const LOHENGRIN = 'F4 | Bb4:1.5 Bb4:.5 Bb4:2 | R F4 C5:1.5 A4:.5 Bb4:2 | R F4 Bb4:1.5 Eb5:.5 Eb5:1.5 D5:.5 | C5:1.5 Bb4:.5 A4:1.5 Bb4:.5 C5:2';
function kanShape(d) {
  const T = 0.035, m = new THREE.MeshStandardMaterial({ color: d.col, roughness: 0.55, emissive: d.col, emissiveIntensity: 0.25 }), g = new THREE.Group();
  if (d.kind === 'circle') {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(d.s, d.s, T * 1.6, 40), m); disc.rotation.x = Math.PI / 2; g.add(disc);
    const halo = new THREE.Mesh(new THREE.CylinderGeometry(d.s * 1.55, d.s * 1.55, T, 40), new THREE.MeshStandardMaterial({ color: d.halo, roughness: 0.7, emissive: d.halo, emissiveIntensity: 0.2 })); halo.rotation.x = Math.PI / 2; g.add(halo);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(d.s * 1.55, 0.008, 6, 48), std(0x111111)); g.add(rim);
  } else if (d.kind === 'triangle' || d.kind === 'crescent') {
    const sh = new THREE.Shape();
    if (d.kind === 'triangle') { const s = d.s; sh.moveTo(-s / 2, -s * 0.36); sh.lineTo(s / 2, -s * 0.36); sh.lineTo(s * 0.08, s * 0.5); sh.closePath(); }
    else { sh.absarc(0, 0, d.s, -Math.PI * 0.6, Math.PI * 0.6, false); sh.absarc(d.s * 0.42, 0, d.s * 0.82, Math.PI * 0.62, -Math.PI * 0.62, true); }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2, curveSegments: 24 }); geo.center(); g.add(new THREE.Mesh(geo, m));
  } else if (d.kind === 'square') {
    g.add(new THREE.Mesh(new THREE.BoxGeometry(d.s, d.s, T), m)); g.rotation.z = 0.35;
    const inner = new THREE.Mesh(new THREE.BoxGeometry(d.s * 0.45, d.s * 0.45, T * 1.4), std(0xe8d9a8)); inner.position.set(d.s * 0.12, d.s * 0.1, 0); g.add(inner);
  } else if (d.kind === 'wave') {
    const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(new THREE.Vector3((t - 0.5) * d.s, Math.sin(t * TAU * 1.5) * 0.07 * (1 - t * 0.4), 0)); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.016, 8), m));
  } else {
    const tex = canvasTex(128, 128, c => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? '#141414' : '#f1ead8'; if (i === 2 && j === 1) c.fillStyle = '#d2321f'; if (i === 0 && j === 3) c.fillStyle = '#23409c'; c.fillRect(i * 32, j * 32, 32, 32); } });
    const mm = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.6 });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(d.s, d.s, T), mm)); g.rotation.z = -0.5;
  }
  const inner = new THREE.Group(); inner.add(g); return { mesh: inner, mats: [m] };
}
feature({
  id: 'l3kandinsky',
  secrets: [['l3kandinsky', 'Colours that sing']],
  init(k) {
    const r = k.plan.byId.G392; if (!r) return;
    const R = rnd(392);
    this.shapes = KAN.map((d, i) => {
      const s = spot(k, 'G392', 0.1 + (i / (KAN.length - 1)) * 0.8, i % 2 ? 0.88 : 0.64, 0.3, 1.3) || { x: r.x0 + 1 + i * 1.8, z: r.z1 - 1.5 };
      const { mesh, mats } = kanShape(d), y = r.y + d.h + 0.06;
      mesh.position.set(s.x, y, s.z); mesh.rotation.y = R() * TAU; k.group.add(mesh);
      const halo = glow(d.s * 4.5, d.col === 0x141414 ? 0x8888ff : d.col, 0); halo.position.copy(mesh.position); k.group.add(halo);
      return { d, mesh, mats, halo, x: s.x, y, z: s.z, hit: false, flash: 0, spin: (R() < 0.5 ? -1 : 1) * (0.25 + R() * 0.3), ph: R() * TAU };
    });
    this.at = { x: (r.x0 + r.x1) / 2, y: r.y, z: r.z1 - 2 }; this.t = 0; this.song = 0;
  },
  active(k) { return !!this.shapes && k.inRoom('G392', 1); },
  update(dt, k) {
    this.t += dt;
    once(k, 'kandinsky', 'Shapes that hum. Touch all seven.', 4);
    const p = k.pos;
    for (const s of this.shapes) {
      s.mesh.rotation.y += s.spin * dt * (1 + s.flash * 6);
      s.mesh.position.y = s.y + Math.sin(this.t * 1.3 + s.ph) * 0.03 + (this.song > 0 ? Math.sin(this.t * 6 + s.ph) * 0.05 : 0);
      s.halo.position.y = s.mesh.position.y;
      s.flash = Math.max(0, s.flash - dt * 1.5);
      s.halo.material.opacity = (s.hit ? 0.35 : 0) + s.flash * 0.6;
      const rad = s.d.s * 0.7 + 0.2, top = s.mesh.position.y + s.d.s * 0.5, bot = s.mesh.position.y - s.d.s * 0.5;
      if ((p.x - s.x) ** 2 + (p.z - s.z) ** 2 < rad * rad && p.y + 0.16 > bot && p.y < top) {
        if (s.flash < 0.4) { this.sound(k, s); s.flash = 1; }
        if (!s.hit) { s.hit = true; for (const m of s.mats) m.emissiveIntensity = 0.55; if (this.shapes.every(q => q.hit)) this.finale(k); }
      }
    }
    if (this.song > 0) this.song -= dt;
  },
  sound(k, s) { const [f, type, vol] = s.d.voice; if (!f) k.synth.noise(0.35, { vol: 0.08, lp: 300 }); else { k.synth.note(f, 0.9, { type, vol }); k.synth.note(f * 1.5, 0.7, { type: 'sine', vol: vol * 0.4, at: 0.02 }); } },
  finale(k) {
    const len = k.tune(LOHENGRIN, { bpm: 76, type: 'triangle', vol: 0.08, at: 0.3, onNote: (i, n, at) => setTimeout(() => { const s = this.shapes[i % this.shapes.length]; if (s) s.flash = 1; }, at * 1000) });
    k.tune(LOHENGRIN, { bpm: 76, type: 'sine', vol: 0.035, at: 0.3, oct: -1 });
    this.song = len + 0.5;
    if (k.find('l3kandinsky')) k.callout('COLOURS THAT SING');
  },
  reset() { if (!this.shapes) return; for (const s of this.shapes) { s.hit = false; s.flash = 0; for (const m of s.mats) m.emissiveIntensity = 0.25; } },
  spots() { return this.at ? [{ kind: 'secret', id: 'l3kandinsky', name: 'Colours that sing (touch all seven shapes)', ...this.at }] : []; },
});

// ================================================================ 393: black lines only
// A floor in the manner of the two Mondrians on the wall (both out of copyright): black lines on white, a few fields of
// colour. Leave the red square and reach the yellow one without a wheel off the black.
const LW = 0.34;
feature({
  id: 'l3mondrian',
  secrets: [['l3mondrian', 'Black lines only']],
  init(k) {
    const r = k.plan.byId.G393; if (!r) return;
    const x0 = r.x0 + 1.5, x1 = r.x1 - 1.0, z0 = Math.max(r.z0 + 4.2, r.z1 - 4.4), z1 = r.z1 - 0.7, W = x1 - x0, D = z1 - z0;
    // Lines in the floor's own measure, a (east) and b (south), as [a0, b0, a1, b1] along one axis.
    const A = f => f * W, B = f => f * D;
    const lines = [
      [0.06, 0.5, 0.64, 0.5], [0.21, 0.08, 0.21, 0.94], [0.21, 0.12, 0.8, 0.12], [0.64, 0.5, 0.64, 0.88], [0.38, 0.88, 0.94, 0.88],
      [0.38, 0.5, 0.38, 0.97], [0.8, 0.12, 0.8, 0.62], [0.52, 0.12, 0.52, 0.5], [0.8, 0.62, 0.94, 0.62],
    ].map(([a0, b0, a1, b1]) => ({ a0: A(a0), b0: B(b0), a1: A(a1), b1: B(b1) }));
    const sq = 0.75, start = { a0: 0, a1: A(0.06) + 0.05, b0: B(0.5) - sq / 2, b1: B(0.5) + sq / 2 }, finish = { a0: A(0.94) - 0.05, a1: W, b0: B(0.88) - sq / 2, b1: B(0.88) + sq / 2 };
    const fields = [['#1f3f8f', 0.0, 0.62, 0.2, 1.0], ['#f0c419', 0.53, 0.14, 0.79, 0.49], ['#c8261d', 0.81, 0.14, 1.0, 0.6], ['#9a9a96', 0.22, 0.52, 0.37, 0.86], ['#1f3f8f', 0.65, 0.52, 0.79, 0.86], ['#f0c419', 0.22, 0.0, 0.5, 0.1]];
    const PX = 80, tex = canvasTex(Math.round(W * PX), Math.round(D * PX), (g, w, h) => {
      const R = rnd(393); g.fillStyle = '#eeebe1'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${R() < 0.5 ? '255,255,255' : '190,185,170'},.12)`; g.fillRect(R() * w, R() * h, 2 + R() * 10, 1 + R() * 2); }
      for (const [c, a0, b0, a1, b1] of fields) { g.fillStyle = c; g.fillRect(a0 * w, b0 * h, (a1 - a0) * w, (b1 - b0) * h); }
      g.fillStyle = '#c8261d'; g.fillRect(start.a0 * PX, start.b0 * PX, (start.a1 - start.a0) * PX, sq * PX);
      g.fillStyle = '#f0c419'; g.fillRect(finish.a0 * PX, finish.b0 * PX, (finish.a1 - finish.a0) * PX, sq * PX);
      g.fillStyle = '#141414'; for (const l of lines) g.fillRect(Math.min(l.a0, l.a1) * PX - LW * PX / 2, Math.min(l.b0, l.b1) * PX - LW * PX / 2, Math.abs(l.a1 - l.a0) * PX + LW * PX, Math.abs(l.b1 - l.b0) * PX + LW * PX);
      g.strokeStyle = '#141414'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.12, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(x0 + W / 2, r.y + 0.012, z0 + D / 2); k.group.add(floor);
    this.ring = glow(1.4, 0xff5030, 0, false); this.ring.rotation.x = -Math.PI / 2; this.ring.position.set(x0 + (start.a0 + start.a1) / 2, r.y + 0.03, z0 + B(0.5)); k.group.add(this.ring);
    Object.assign(this, { x0, z0, W, D, lines, start, finish, y: r.y, state: 'idle', at: { x: x0 + 0.3, y: r.y, z: z0 + B(0.5) } });
  },
  local(p) { return { a: p.x - this.x0, b: p.z - this.z0 }; },
  inBox(q, { a, b }) { return a > q.a0 && a < q.a1 && b > q.b0 && b < q.b1; },
  onLine({ a, b }) { const t = LW / 2 + 0.05; return this.lines.some(l => a > Math.min(l.a0, l.a1) - t && a < Math.max(l.a0, l.a1) + t && b > Math.min(l.b0, l.b1) - t && b < Math.max(l.b0, l.b1) + t); },
  active(k) { return !!this.lines && k.inRoom('G393', 1); },
  update(dt, k) {
    const p = k.pos, q = this.local(p), low = p.y < this.y + 0.5, onFloor = q.a > -0.2 && q.a < this.W + 0.2 && q.b > -0.2 && q.b < this.D + 0.2;
    if (onFloor) once(k, 'mondrian', 'Red square to yellow, on the black lines only.', 4);
    const inStart = low && this.inBox(this.start, q);
    this.ring.material.opacity = this.state === 'armed' ? 0.55 + Math.sin(performance.now() / 160) * 0.2 : this.state === 'run' ? 0.25 : 0;
    if (this.state === 'idle') { if (inStart) { this.state = 'armed'; k.synth.note(523, 0.2, { type: 'sine', vol: 0.05 }); } return; }
    if (this.state === 'armed') { if (inStart) return; if (low && this.onLine(q)) { this.state = 'run'; return; } this.state = 'idle'; return; }
    if (this.inBox(this.finish, q) && low) { this.state = 'idle'; k.synth.chime([523, 659, 784, 1047, 1319], { gap: 0.09 }); if (k.find('l3mondrian')) k.callout('BLACK LINES ONLY'); return; }
    if (inStart) { this.state = 'armed'; return; }
    if (!low || !this.onLine(q)) { this.state = 'idle'; k.synth.note(110, 0.35, { type: 'square', vol: 0.05 }); k.say('Off the line.', 1.5); }
  },
  reset() { this.state = 'idle'; },
  spots() { return this.at ? [{ kind: 'secret', id: 'l3mondrian', name: 'Black lines only (red square to yellow)', ...this.at }] : []; },
});

// ================================================================ 394: lemons on a plate
// After the still lifes in this room (a Matisse of lemons on a pewter plate among them): a pewter charger on the floor,
// one lemon on it and three rolled away across the room. Nudge them home.
function lemonGeo() {
  const g = new THREE.SphereGeometry(1, 20, 14), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), tip = Math.pow(Math.abs(x), 6) * 0.28, bump = 1 + (Math.sin(y * 31 + z * 27) * Math.sin(x * 23)) * 0.012;
    p.setXYZ(i, x * (1.32 + tip) * bump, y * bump, z * bump);
  }
  g.computeVertexNormals(); g.scale(0.068, 0.058, 0.058); return g;
}
feature({
  id: 'l3lemons',
  secrets: [['l3lemons', 'Lemons on a plate']],
  init(k) {
    const r = k.plan.byId.G394; if (!r) return;
    const at = spot(k, 'G394', 0.42, 0.5, 0.6, 1.6); if (!at) return;
    const y = r.y, PR = 0.42;
    const pewter = new THREE.MeshStandardMaterial({ color: 0xb4b8b6, metalness: 0.35, roughness: 0.32, emissive: 0x5a5e60, emissiveIntensity: 0.5 });
    const plate = new THREE.Mesh(lathe([[0, 0.004], [PR * 0.62, 0.006], [PR * 0.68, 0.014], [PR * 0.94, 0.026], [PR, 0.03], [PR * 1.0, 0.022], [PR * 0.9, 0.012], [PR * 0.6, 0.0]], 48), pewter);
    plate.position.set(at.x, y + 0.004, at.z); k.group.add(plate);
    const peel = new THREE.MeshStandardMaterial({ color: 0xf2cf2a, roughness: 0.42, emissive: 0x6a5208, emissiveIntensity: 0.6 }), R = rnd(394), geo = lemonGeo();
    const leafMat = std(0x3f7a2a, { side: THREE.DoubleSide }), leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(0.03, 0.04, 0, 0.1); leafShape.quadraticCurveTo(-0.03, 0.04, 0, 0);
    const homes = [[at.x + 0.06, at.z - 0.04], ...[[0.15, 0.2], [0.82, 0.3], [0.7, 0.85]].map(([fx, fz]) => { const s = spot(k, 'G394', fx, fz, 0.3, 1.2) || { x: r.x0 + fx * (r.x1 - r.x0), z: r.z0 + fz * (r.z1 - r.z0) }; return [s.x, s.z]; })];
    this.lemons = homes.map(([x, z], i) => {
      const m = new THREE.Mesh(geo, peel); m.position.set(x, y + 0.058, z); m.rotation.y = R() * TAU;
      if (i === 0) { const leaf = new THREE.Mesh(new THREE.ShapeGeometry(leafShape), leafMat); leaf.position.set(0.07, 0.03, 0); leaf.rotation.set(-1.1, 0, -1.3); m.add(leaf); }
      k.group.add(m);
      const b = k.pushable(m, { r: 0.07, h: 0.14, drag: 2.4, onHit: (bb, into) => { if (into > 0.6) k.synth.note(240 + i * 30, 0.08, { type: 'sine', vol: 0.03 }); } });
      return { m, b, lx: x, lz: z };
    });
    Object.assign(this, { plate: { x: at.x, z: at.z, r: PR - 0.06 }, at: { x: at.x, y, z: at.z }, axis: new THREE.Vector3(), q: new THREE.Quaternion() });
  },
  active(k) { return !!this.lemons && k.inRoom('G394', 1); },
  update(dt, k) {
    if (k.close(this.at, 4)) once(k, 'lemons', 'Three lemons have rolled off the plate.', 4);
    let home = 0;
    for (const l of this.lemons) {
      l.b.step(dt);
      const m = l.m.position, dx = m.x - l.lx, dz = m.z - l.lz, d = Math.hypot(dx, dz);
      if (d > 1e-4) { this.axis.set(dz / d, 0, -dx / d); l.m.quaternion.premultiply(this.q.setFromAxisAngle(this.axis, d / 0.058)); l.lx = m.x; l.lz = m.z; }
      if ((m.x - this.plate.x) ** 2 + (m.z - this.plate.z) ** 2 < this.plate.r ** 2) home++;
    }
    const was = this.home || 0; this.home = home;
    if (home > was && home < 4) k.synth.note(660 + home * 110, 0.3, { type: 'sine', vol: 0.05 });
    if (home === 4 && was < 4) { k.synth.chime([523, 659, 784, 1047]); if (k.find('l3lemons')) k.callout('LEMONS ON A PLATE'); }
  },
  reset() { if (this.lemons) for (const l of this.lemons) { l.b.reset(); l.lx = l.m.position.x; l.lz = l.m.position.z; } this.home = 0; },
  spots() { return this.at ? [{ kind: 'secret', id: 'l3lemons', name: 'Lemons on a plate (push all four on)', ...this.at }] : []; },
});

// ================================================================ 395: hatched
// For the Brancusis here, a polished egg of our own on a stack of base blocks, in his manner. Go round it three times
// and it opens: a brass bird flies once round the skylight and comes back to sit on the shell.
function birdMesh(mat) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(lathe([[0, -0.07], [0.018, -0.06], [0.03, -0.03], [0.032, 0.0], [0.027, 0.03], [0.02, 0.05], [0.0, 0.065]], 20), mat); body.rotation.x = Math.PI / 2; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), mat); head.position.set(0, 0.022, 0.06); g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.03, 10), metal(0xe0a040)); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.02, 0.09); g.add(beak);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 3), mat); tail.scale.set(1, 1, 0.2); tail.rotation.x = -Math.PI / 2; tail.position.set(0, 0.004, -0.09); g.add(tail);
  const ws = new THREE.Shape(); ws.moveTo(0, 0); ws.quadraticCurveTo(0.05, 0.03, 0.12, 0.012); ws.quadraticCurveTo(0.06, -0.012, 0, -0.03);
  const wg = new THREE.ExtrudeGeometry(ws, { depth: 0.003, bevelEnabled: false }); wg.rotateX(Math.PI / 2);
  const wings = [-1, 1].map(s => { const piv = new THREE.Group(), w = new THREE.Mesh(wg, mat); w.scale.x = s; piv.add(w); piv.position.set(s * 0.02, 0.012, 0.01); g.add(piv); return piv; });
  g.scale.setScalar(1.6);
  return { g, wings };
}
feature({
  id: 'l3bird',
  secrets: [['l3bird', 'Hatched']],
  init(k) {
    const r = k.plan.byId.G395; if (!r) return;
    const at = spot(k, 'G395', 0.74, 0.55, 1.9, 1.2) || spot(k, 'G395', 0.5, 0.5, 1.6, 1.0); if (!at) return;
    const y = r.y, g = new THREE.Group(); g.position.set(at.x, y, at.z); k.group.add(g);
    const stone = std(0xd9d2c2, { roughness: 0.85, emissiveIntensity: 0.12 }), oak = std(0x8a6236, { roughness: 0.75 }), brass = metal(0xd9ab4a, { roughness: 0.18, metalness: 0.9, emissiveIntensity: 0.35 });
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.56, 40), stone); drum.position.y = 0.28; g.add(drum);
    // two oak beads, each a pair of truncated pyramids, the way his carved bases are cut
    for (let i = 0; i < 2; i++) { const b = new THREE.Mesh(lathe([[0.12, 0], [0.22, 0.09], [0.12, 0.18]], 4), oak); b.rotation.y = Math.PI / 4 + i * 0.3; b.position.y = 0.56 + i * 0.18; g.add(b); }
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 32), stone); cap.position.y = 0.94; g.add(cap);
    const top = 0.965, egg = new THREE.Group(); egg.position.y = top; g.add(egg);
    const eggPts = []; for (let i = 0; i <= 16; i++) { const t = i / 16, a = t * Math.PI; eggPts.push([Math.sin(a) * 0.12 * (1 - 0.18 * t), 0.17 - Math.cos(a) * 0.17]); }
    const cut = eggPts[9], lower = new THREE.Mesh(lathe(eggPts.slice(0, 10), 40), brass), upper = new THREE.Mesh(lathe(eggPts.slice(9).map(([rr, yy]) => [rr, yy - cut[1]]), 40), brass);
    const hinge = new THREE.Group(); hinge.position.set(-cut[0], cut[1], 0); upper.position.set(cut[0], 0, 0); hinge.add(upper); egg.add(lower, hinge);
    const { g: bird, wings } = birdMesh(brass); bird.visible = false; g.add(bird);
    block(k, at.x, at.z, 0.28, 0.28, y, y + 1.1);
    Object.assign(this, { at: { x: at.x, y, z: at.z }, g, hinge, bird, wings, top, lap: k.lap({ x: at.x, z: at.z }, 0.45, 2.1), laps: 0, phase: 'shut', t: 0 });
  },
  active(k) { return !!this.g && k.inRoom('G395', 1); },
  update(dt, k) {
    if (k.close(this.at, 3.5)) once(k, 'bird', 'A brass egg. It seems to want something to go round it.', 4);
    if (this.phase === 'shut' && k.pos.y < this.at.y + 1.2) {
      const s = this.lap.step(k.pos);
      if (s === 'done') { this.laps++; k.synth.note([392, 494, 587][Math.min(2, this.laps - 1)], 0.5, { type: 'sine', vol: 0.06 }); if (this.laps >= 3) { this.phase = 'open'; this.t = 0; k.synth.chime([587, 784, 988, 1175]); } }
      else if (s === 'broke') this.laps = 0;
      else if (s === 'out' && this.laps && !k.close(this.at, 2.4)) this.laps = 0;
    }
    if (this.phase === 'shut') return;
    this.t += dt; const t = this.t;
    this.hinge.rotation.z = -ease(Math.min(1, t / 0.8)) * 1.9;
    const b = this.bird, flap = Math.sin(t * 22) * 0.7;
    if (this.phase === 'open') {
      b.visible = t > 0.6;
      const f = Math.max(0, (t - 0.8) / 8), R = 2.0, a = f * TAU;
      if (f < 1) {
        const rise = Math.sin(f * Math.PI);
        b.position.set(Math.sin(a) * R * rise, this.top + 0.1 + rise * 3.2, -Math.cos(a) * R * rise);
        b.rotation.set(0, a + Math.PI / 2, rise * 0.4);
        this.wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * flap));
      } else {
        this.phase = 'home'; b.position.set(0.03, this.top + 0.19, 0); b.rotation.set(0, 0.8, 0); this.wings.forEach(w => (w.rotation.z = 0));
        if (k.find('l3bird')) k.callout('HATCHED');
      }
    } else if (this.phase === 'home') {
      this.wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * Math.max(0, Math.sin(t * 3)) * 0.15));
    }
  },
  reset() { if (!this.g) return; this.phase = 'shut'; this.laps = 0; this.hinge.rotation.z = 0; this.bird.visible = false; this.lap.reset(); },
  spots() { return this.at ? [{ kind: 'secret', id: 'l3bird', name: 'Hatched (three times round the egg)', ...this.at }] : []; },
});

// ================================================================ 396: the door across the room
// Two doors stand on their own in the middle of the floor, open, with the night in them. Go in at one and you come out of
// the other, the far side of the room. (A Surrealist turn of our own; nothing in the room is copied.)
function doorMesh() {
  const g = new THREE.Group(), W = 0.92, H = 2.04, paint = std(0xe9e4d6, { roughness: 0.5 }), leafMat = std(0x3e5b78, { roughness: 0.45 });
  const frame = (w, h, d, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), paint); m.position.set(x, y, 0); g.add(m); };
  frame(0.08, H + 0.08, 0.16, -W / 2 - 0.04, (H + 0.08) / 2); frame(0.08, H + 0.08, 0.16, W / 2 + 0.04, (H + 0.08) / 2); frame(W + 0.16, 0.08, 0.16, 0, H + 0.04);
  frame(W + 0.36, 0.06, 0.2, 0, H + 0.11);
  // the leaf, panelled, swung open behind
  const hinge = new THREE.Group(); hinge.position.set(W / 2, 0, -0.06); hinge.rotation.y = -1.95; g.add(hinge);
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(W - 0.02, H - 0.02, 0.045), leafMat); leaf.position.set(-W / 2, H / 2, 0); hinge.add(leaf);
  for (const [py, ph] of [[0.55, 0.7], [1.45, 0.8]]) for (const s of [-1, 1]) { const pnl = new THREE.Mesh(new THREE.BoxGeometry(W * 0.62, ph, 0.012), std(0x35506b)); pnl.position.set(-W / 2, py, s * 0.027); hinge.add(pnl); }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), metal(0xd0a548)); knob.position.set(-W + 0.08, 1.0, 0.05); hinge.add(knob);
  // the night in the doorway
  const night = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float uT;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      void main(){ vec2 p = vUv; vec3 c = mix(vec3(0.02,0.03,0.12), vec3(0.12,0.16,0.42), p.y);
        vec2 g = floor(p * vec2(40.0, 80.0)); float s = h(g); float tw = 0.5 + 0.5 * sin(uT * (1.0 + s * 3.0) + s * 40.0);
        float star = step(0.985, s) * tw; vec2 f = fract(p * vec2(40.0, 80.0)) - 0.5; star *= smoothstep(0.35, 0.0, length(f));
        float moon = smoothstep(0.075, 0.07, length((p - vec2(0.68, 0.8)) * vec2(1.0, 2.2))) - smoothstep(0.075, 0.07, length((p - vec2(0.71, 0.815)) * vec2(1.0, 2.2)));
        c += vec3(star) + vec3(1.0, 0.95, 0.75) * max(moon, 0.0);
        float edge = smoothstep(0.0, 0.05, min(min(p.x, 1.0 - p.x), min(p.y, 1.0 - p.y)));
        gl_FragColor = vec4(c, 0.92 * edge); }` });
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(W, H), night); veil.position.y = H / 2; g.add(veil);
  return { g, night, W, H };
}
feature({
  id: 'l3doors',
  secrets: [['l3doors', 'The door across the room']],
  init(k) {
    const r = k.plan.byId.G396; if (!r) return;
    const a = spot(k, 'G396', 0.18, 0.3, 1.0, 1.6), b = spot(k, 'G396', 0.82, 0.78, 1.0, 1.6); if (!a || !b) return;
    // a's way through runs along x, b's along z
    this.doors = [[a, Math.PI / 2], [b, 0]].map(([s, yaw]) => {
      const d = doorMesh(); d.g.position.set(s.x, r.y, s.z); d.g.rotation.y = yaw; k.group.add(d.g);
      const nx = Math.sin(yaw), nz = Math.cos(yaw), ux = Math.cos(yaw), uz = -Math.sin(yaw);
      for (const sgn of [-1, 1]) { const cx = s.x + ux * sgn * (d.W / 2 + 0.04), cz = s.z + uz * sgn * (d.W / 2 + 0.04); block(k, cx, cz, Math.abs(ux) * 0.05 + Math.abs(nx) * 0.09, Math.abs(uz) * 0.05 + Math.abs(nz) * 0.09, r.y, r.y + d.H + 0.15); }
      // the open leaf, standing out behind the hinge side
      { const hx = s.x + ux * d.W / 2 - nx * 0.06, hz = s.z + uz * d.W / 2 - nz * 0.06, a2 = -1.95, lxl = -d.W / 2, lx = hx + (Math.cos(a2) * lxl) * ux + (-Math.sin(a2) * lxl) * nx, lz = hz + (Math.cos(a2) * lxl) * uz + (-Math.sin(a2) * lxl) * nz; block(k, lx, lz, 0.22, 0.22, r.y, r.y + d.H); }
      return { ...d, x: s.x, z: s.z, nx, nz, ux, uz, side: 0 };
    });
    Object.assign(this, { y: r.y, cool: 0, at: { x: a.x, y: r.y, z: a.z } });
  },
  active(k) { return !!this.doors && k.inRoom('G396', 1); },
  update(dt, k) {
    for (const d of this.doors) d.night.uniforms.uT.value += dt;
    if (k.close(this.at, 4)) once(k, 'doors', 'A door, standing on its own. With the night in it.', 4);
    this.cool -= dt;
    const p = k.pos, v = k.v;
    for (let i = 0; i < this.doors.length; i++) {
      const d = this.doors[i], dx = p.x - d.x, dz = p.z - d.z, n = dx * d.nx + dz * d.nz, u = dx * d.ux + dz * d.uz, side = n >= 0 ? 1 : -1;
      const inGap = Math.abs(u) < d.W / 2 - 0.06 && p.y < this.y + d.H - 0.2 && Math.abs(n) < 0.6;
      if (inGap && d.side && side !== d.side && this.cool <= 0) {
        const o = this.doors[1 - i], sp = Math.max(1.2, Math.hypot(v.vel.x, v.vel.z)), dir = side;      // went through towards +n (dir 1) or -n (dir -1)
        const ex = o.x + o.nx * dir * 0.45, ez = o.z + o.nz * dir * 0.45, yaw = Math.atan2(o.nx * dir, o.nz * dir);
        v.place(ex, ez, yaw, p.y);
        v.vel.set(Math.sin(yaw) * sp, 0, Math.cos(yaw) * sp); v.speed = sp;
        this.cool = 0.6; o.side = dir; d.side = 0;
        k.synth.note(880, 0.4, { type: 'sine', vol: 0.05 }); k.synth.note(1320, 0.6, { type: 'sine', vol: 0.03, at: 0.08 });
        if (k.find('l3doors')) k.callout('THE DOOR ACROSS THE ROOM');
        return;
      }
      d.side = Math.abs(n) < 1.2 && Math.abs(u) < d.W / 2 + 0.3 ? side : 0;
    }
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'l3doors', name: 'The door across the room (drive through)', ...this.at }] : []; },
});

// ================================================================ 397: exquisite corpse
// The Surrealists' parlour game (there is one by Man Ray and friends in this room): fold the paper, each draws a part.
// Here a column of three drums, each painted with four heads, bodies or legs. Roll onto a plate to turn its drum; when all
// three show the same creature it wakes up. Played on Für Elise (Beethoven, published 1867).
const ELISE = 'E5:.5 D#5:.5 | E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 | A4:1.5 C4:.5 E4:.5 A4:.5 | B4:1.5 E4:.5 G#4:.5 B4:.5 | C5:2';
function corpseAtlas() {
  return canvasTex(1024, 768, (g, W, H) => {
    const R = rnd(397), T = 256;
    g.fillStyle = '#efe6cf'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(120,100,70,${R() * 0.06})`; g.fillRect(R() * W, R() * H, 1 + R() * 3, 1); }
    const ink = (w = 3) => { g.strokeStyle = '#1e1813'; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; };
    const wash = c => { g.fillStyle = c; };
    const at = (c, r, f) => { g.save(); g.translate(c * T, r * T); g.beginPath(); g.rect(0, 0, T, T); g.clip(); f(); g.restore(); };
    const ell = (x, y, rx, ry, fill, a = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, TAU); if (fill) { wash(fill); g.fill(); } ink(); g.stroke(); };
    const path = (pts, fill, close = true) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (close) g.closePath(); if (fill) { wash(fill); g.fill(); } ink(); g.stroke(); };
    // The joins every drawer keeps to: the neck at 104..152 across the head/body fold, the hips at 78..178 across body/legs.
    // 0: a lady in a birdcage hat
    at(0, 0, () => { path([[104, 256], [108, 200], [148, 200], [152, 256]], 'rgba(236,190,160,.8)'); ell(128, 160, 44, 52, 'rgba(240,200,170,.85)'); ell(112, 150, 6, 4); ell(144, 150, 6, 4); g.beginPath(); g.arc(128, 178, 12, 0.2, Math.PI - 0.2); ink(); g.stroke(); ell(110, 172, 7, 5, 'rgba(220,90,90,.5)'); ell(146, 172, 7, 5, 'rgba(220,90,90,.5)');
      path([[78, 112], [178, 112], [168, 102], [88, 102]], 'rgba(60,60,80,.6)'); g.beginPath(); for (let i = 0; i < 6; i++) { g.moveTo(92 + i * 14, 104); g.quadraticCurveTo(128, 0, 164 - i * 0, 104 - 0); } ink(2); g.stroke(); ell(128, 70, 10, 7, 'rgba(240,200,40,.9)'); path([[136, 68], [146, 64], [138, 72]], 'rgba(230,120,30,.9)'); });
    at(0, 1, () => { path([[104, 0], [152, 0], [176, 40], [196, 120], [178, 256], [78, 256], [60, 120], [80, 40]], 'rgba(90,140,190,.7)'); path([[80, 40], [40, 120], [52, 170], [70, 120]], 'rgba(90,140,190,.7)'); path([[176, 40], [214, 110], [200, 150], [186, 110]], 'rgba(90,140,190,.7)');
      for (let i = 0; i < 4; i++) ell(128, 60 + i * 40, 5, 5, 'rgba(240,230,200,1)'); path([[200, 150], [240, 110], [244, 170]], 'rgba(220,80,110,.7)'); });
    at(0, 2, () => { path([[78, 0], [178, 0], [236, 200], [20, 200]], 'rgba(200,80,110,.65)'); for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(40 + i * 30, 200); g.quadraticCurveTo(50 + i * 28, 120, 128, 6); ink(1.5); g.stroke(); } path([[96, 200], [92, 236], [70, 246], [100, 246], [108, 200]], 'rgba(40,40,40,.85)'); path([[150, 200], [148, 236], [172, 246], [140, 246], [138, 200]], 'rgba(40,40,40,.85)'); });
    // 1: a fish
    at(1, 0, () => { path([[104, 256], [100, 200], [156, 200], [152, 256]], 'rgba(90,170,160,.75)'); path([[128, 20], [196, 120], [176, 200], [80, 200], [60, 120]], 'rgba(110,190,170,.8)'); ell(110, 120, 16, 16, 'rgba(250,250,240,1)'); ell(112, 122, 7, 7, 'rgba(20,20,20,1)'); g.beginPath(); g.arc(150, 160, 30, 2.2, 4.0); ink(); g.stroke(); path([[128, 20], [150, 60], [128, 70]], 'rgba(230,120,50,.8)'); g.beginPath(); g.moveTo(96, 176); g.quadraticCurveTo(128, 190, 152, 176); ink(); g.stroke(); });
    at(1, 1, () => { path([[104, 0], [152, 0], [190, 60], [178, 256], [78, 256], [66, 60]], 'rgba(110,190,170,.8)'); for (let y = 30; y < 250; y += 26) for (let x = 84 + ((y / 26) % 2) * 13; x < 176; x += 26) { g.beginPath(); g.arc(x, y, 12, 0.2, Math.PI - 0.2); ink(1.6); g.stroke(); }
      path([[66, 60], [10, 90], [30, 120], [70, 110]], 'rgba(230,120,50,.75)'); path([[190, 60], [246, 90], [226, 120], [186, 110]], 'rgba(230,120,50,.75)'); });
    at(1, 2, () => { path([[78, 0], [178, 0], [150, 120], [128, 150], [106, 120]], 'rgba(110,190,170,.8)'); path([[128, 150], [40, 230], [70, 250], [128, 190], [186, 250], [216, 230]], 'rgba(230,120,50,.8)'); for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(128, 160); g.lineTo(60 + i * 34, 240); ink(1.2); g.stroke(); } });
    // 2: clockwork
    at(2, 0, () => { path([[104, 256], [104, 196], [152, 196], [152, 256]], 'rgba(180,140,70,.75)'); ell(128, 128, 70, 70, 'rgba(235,225,190,.95)'); ell(128, 128, 76, 76, null); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(128 + Math.sin(a) * 58, 128 - Math.cos(a) * 58); g.lineTo(128 + Math.sin(a) * 66, 128 - Math.cos(a) * 66); ink(i % 3 ? 2 : 4); g.stroke(); }
      g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 82); g.moveTo(128, 128); g.lineTo(160, 140); ink(4); g.stroke(); path([[118, 52], [138, 52], [134, 30], [150, 18], [106, 18], [122, 30]], 'rgba(180,140,70,.85)'); });
    at(2, 1, () => { path([[104, 0], [152, 0], [184, 30], [184, 256], [72, 256], [72, 30]], 'rgba(160,120,70,.7)'); for (const [x, y, r] of [[110, 80, 26], [150, 120, 20], [118, 170, 30], [154, 210, 16]]) { ell(x, y, r, r, 'rgba(210,170,80,.85)'); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.lineTo(x + Math.cos(a) * (r + 7), y + Math.sin(a) * (r + 7)); ink(3); g.stroke(); } }
      g.beginPath(); for (let i = 0; i < 40; i++) g.lineTo(72 - i * 1.4, 40 + i * 3 + Math.sin(i) * 10); ink(2.5); g.stroke(); g.beginPath(); for (let i = 0; i < 40; i++) g.lineTo(184 + i * 1.4, 40 + i * 3 + Math.sin(i) * 10); g.stroke(); });
    at(2, 2, () => { path([[78, 0], [178, 0], [178, 30], [78, 30]], 'rgba(160,120,70,.7)'); path([[90, 30], [110, 30], [110, 190], [90, 190]], 'rgba(170,170,180,.8)'); path([[146, 30], [166, 30], [166, 190], [146, 190]], 'rgba(170,170,180,.8)'); ell(100, 215, 28, 28, 'rgba(60,60,60,.7)'); ell(156, 215, 28, 28, 'rgba(60,60,60,.7)'); ell(100, 215, 6, 6, 'rgba(230,230,230,1)'); ell(156, 215, 6, 6, 'rgba(230,230,230,1)'); });
    // 3: a lion in a circus coat
    at(3, 0, () => { path([[104, 256], [104, 200], [152, 200], [152, 256]], 'rgba(220,170,90,.8)'); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; ell(128 + Math.cos(a) * 62, 132 + Math.sin(a) * 62, 26, 18, 'rgba(190,110,40,.75)', a); } ell(128, 132, 54, 56, 'rgba(235,185,100,.95)'); ell(108, 118, 7, 9, 'rgba(30,30,30,1)'); ell(148, 118, 7, 9, 'rgba(30,30,30,1)'); path([[118, 146], [138, 146], [128, 158]], 'rgba(60,30,20,1)'); g.beginPath(); g.moveTo(128, 158); g.quadraticCurveTo(116, 176, 104, 168); g.moveTo(128, 158); g.quadraticCurveTo(140, 176, 152, 168); ink(); g.stroke(); });
    at(3, 1, () => { path([[104, 0], [152, 0], [196, 40], [190, 256], [66, 256], [60, 40]], 'rgba(190,40,40,.75)'); path([[104, 0], [128, 60], [152, 0]], 'rgba(240,230,210,1)'); for (let i = 0; i < 5; i++) { ell(108, 80 + i * 34, 7, 7, 'rgba(230,190,60,1)'); ell(148, 80 + i * 34, 7, 7, 'rgba(230,190,60,1)'); } path([[60, 40], [24, 170], [48, 180], [76, 90]], 'rgba(190,40,40,.75)'); path([[196, 40], [232, 170], [208, 180], [180, 90]], 'rgba(190,40,40,.75)'); ell(36, 186, 16, 12, 'rgba(235,185,100,.95)'); ell(220, 186, 16, 12, 'rgba(235,185,100,.95)'); });
    at(3, 2, () => { path([[78, 0], [178, 0], [176, 200], [136, 200], [128, 60], [120, 200], [80, 200]], 'rgba(40,60,120,.7)'); for (let x = 86; x < 176; x += 16) { g.beginPath(); g.moveTo(x, 4); g.lineTo(x + (x < 128 ? 0 : 0), 196); ink(1.3); g.stroke(); } ell(98, 218, 34, 20, 'rgba(235,185,100,.95)'); ell(158, 218, 34, 20, 'rgba(235,185,100,.95)'); for (const x of [78, 92, 106, 138, 152, 166]) { g.beginPath(); g.moveTo(x + 6, 226); g.lineTo(x + 6, 236); ink(2); g.stroke(); } });
    // the folds of the paper
    g.strokeStyle = 'rgba(90,70,40,.25)'; g.lineWidth = 2; for (let r = 1; r < 3; r++) { g.beginPath(); g.moveTo(0, r * T); g.lineTo(W, r * T); g.stroke(); }
  });
}
feature({
  id: 'l3corpse',
  secrets: [['l3corpse', 'Exquisite corpse']],
  init(k) {
    const r = k.plan.byId.G397; if (!r) return;
    const at = spot(k, 'G397', 0.22, 0.3, 0.9, 1.4); if (!at) return;
    const y = r.y, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, yaw = Math.atan2(cx - at.x, cz - at.z), fx = Math.sin(yaw), fz = Math.cos(yaw), sx = Math.cos(yaw), sz = -Math.sin(yaw);
    const col = new THREE.Group(); col.position.set(at.x, y, at.z); col.rotation.y = yaw; k.group.add(col);
    const S = 0.44, DH = 0.46, atlas = corpseAtlas(), wood = std(0x2b2420, { roughness: 0.5 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(S + 0.06, 0.14, S + 0.06), wood); base.position.y = 0.07; col.add(base);
    const mat = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 0.2, roughness: 0.8 });
    this.drums = [0, 1, 2].map(row => {
      const d = new THREE.Group(); d.position.y = 0.14 + (2 - row) * DH + DH / 2; col.add(d);
      for (let j = 0; j < 4; j++) {
        const p = new THREE.PlaneGeometry(S, DH - 0.01), uv = p.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, (j + uv.getX(i)) / 4, 1 - (row + 1 - uv.getY(i)) / 3);
        const m = new THREE.Mesh(p, mat), a = j * Math.PI / 2; m.position.set(Math.sin(a) * S / 2, 0, Math.cos(a) * S / 2); m.rotation.y = a; d.add(m);
      }
      const lid = new THREE.Mesh(new THREE.BoxGeometry(S + 0.01, 0.012, S + 0.01), wood); lid.position.y = DH / 2; d.add(lid);
      return { d, rot: [0, 2, 1][row], ang: 0 };
    });
    for (const dr of this.drums) dr.ang = dr.d.rotation.y = -dr.rot * Math.PI / 2;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(S + 0.06, 0.05, S + 0.06), wood); cap.position.y = 0.14 + 3 * DH + 0.025; col.add(cap);
    block(k, at.x, at.z, 0.27, 0.27, y, y + 1.6);
    // the three plates: head, body, legs
    const plateTex = i => canvasTex(128, 128, g => { g.fillStyle = '#b8913e'; g.beginPath(); g.arc(64, 64, 62, 0, TAU); g.fill(); g.strokeStyle = '#5a4214'; g.lineWidth = 7; g.beginPath(); if (i === 0) g.arc(64, 64, 26, 0, TAU); else if (i === 1) g.rect(38, 38, 52, 52); else { g.moveTo(40, 94); g.lineTo(56, 34); g.lineTo(72, 34); g.lineTo(88, 94); } g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(64, 64, 56, 0, TAU); g.stroke(); });
    this.plates = [0, 1, 2].map(i => {
      const px = at.x + fx * 1.0 + sx * (i - 1) * 0.52, pz = at.z + fz * 1.0 + sz * (i - 1) * 0.52, t = plateTex(i);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.18, 0.016, 32), [metal(0xb8913e), new THREE.MeshStandardMaterial({ map: t, metalness: 0.7, roughness: 0.35, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.25 }), metal(0xb8913e)]);
      m.position.set(px, y + 0.008, pz); m.rotation.y = yaw + Math.PI; k.group.add(m);
      return { m, x: px, z: pz, on: false };
    });
    Object.assign(this, { at: { x: at.x, y, z: at.z }, col, done: false, wake: 0 });
  },
  active(k) { return !!this.drums && k.inRoom('G397', 1); },
  update(dt, k) {
    if (k.close(this.at, 3)) once(k, 'corpse', 'Three drums, three plates. Make one creature.', 4);
    const p = k.pos;
    this.plates.forEach((pl, i) => {
      const on = (p.x - pl.x) ** 2 + (p.z - pl.z) ** 2 < 0.2 * 0.2 && p.y < this.at.y + 0.3;
      pl.m.position.y = this.at.y + (on ? 0.002 : 0.008);
      if (on && !pl.on) { const d = this.drums[i]; d.rot = (d.rot + 1) % 4; k.synth.note([330, 262, 196][i], 0.25, { type: 'triangle', vol: 0.06 }); k.synth.noise(0.12, { vol: 0.03, lp: 900 }); this.check(k); }
      pl.on = on;
    });
    for (const d of this.drums) { const goal = -d.rot * Math.PI / 2; let diff = goal - d.ang; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); d.ang += diff * Math.min(1, dt * 7); d.d.rotation.y = d.ang; }
    if (this.wake > 0) { this.wake -= dt; this.col.rotation.z = Math.sin(this.wake * 30) * 0.03 * Math.min(1, this.wake); this.drums.forEach((d, i) => (d.d.position.x = Math.sin(this.wake * 9 + i * 2) * 0.04 * Math.min(1, this.wake))); }
  },
  check(k) {
    const r0 = this.drums[0].rot, same = this.drums.every(d => d.rot === r0);
    if (same && !this.done) { this.done = true; this.wake = 3.5; k.tune(ELISE, { bpm: 132, type: 'sine', vol: 0.07, at: 0.3 }); if (k.find('l3corpse')) k.callout('EXQUISITE CORPSE'); }
    if (!same) this.done = false;
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'l3corpse', name: 'Exquisite corpse (match the three drums)', ...this.at }] : []; },
});

// ================================================================ 397: soap bubbles
// Joseph Cornell made boxes he called soap bubble sets: a clay pipe among the things in them. This pipe still blows.
// Pop a dozen. Brahms's lullaby (1868) for the twelfth.
const BRAHMS = 'E4:.5 E4:.5 | G4:2 E4:.5 E4:.5 | G4:2 E4:.5 G4:.5 | C5 B4:1.5 A4:.5 | A4 G4 D4:.5 E4:.5 | F4 D4 D4:.5 E4:.5 | F4:2 D4:.5 F4:.5 | B4:.5 A4:.5 G4 B4 | C5:2';
feature({
  id: 'l3bubbles',
  secrets: [['l3bubbles', 'A dozen soap bubbles']],
  init(k) {
    const r = k.plan.byId.G397; if (!r) return;
    const at = spot(k, 'G397', 0.75, 0.62, 0.5, 1.4); if (!at) return;
    const y = r.y, clay = std(0xf1ece0, { roughness: 0.7 }), g = new THREE.Group(); g.position.set(at.x, y, at.z); k.group.add(g);
    const stand = new THREE.Mesh(lathe([[0.12, 0], [0.12, 0.03], [0.03, 0.05], [0.025, 0.24], [0.06, 0.26], [0.06, 0.28]], 24), std(0x5a3a22, { roughness: 0.5 })); g.add(stand);
    const bowl = new THREE.Mesh(lathe([[0.0, 0], [0.03, 0.005], [0.042, 0.03], [0.046, 0.07], [0.04, 0.072], [0.036, 0.02], [0.0, 0.015]], 24), clay); bowl.position.set(0.1, 0.3, 0); g.add(bowl);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.014, 0.28, 10), clay); stem.rotation.z = Math.PI / 2 - 0.12; stem.position.set(-0.04, 0.3, 0); g.add(stem);
    const film = new THREE.Mesh(new THREE.CircleGeometry(0.036, 20), new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); film.rotation.x = -Math.PI / 2; film.position.set(0.1, 0.371, 0); g.add(film);
    block(k, at.x, at.z, 0.12, 0.12, y, y + 0.4);
    const N = 12, mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 0 } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix * instanceMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }',
      fragmentShader: 'varying vec3 vN; varying vec3 vV; uniform float uT; void main(){ float f = 1.0 - abs(dot(normalize(vN), normalize(vV))); vec3 c = 0.55 + 0.45 * cos(6.2831 * (f * 1.6 + vec3(0.0, 0.33, 0.67)) + uT); float a = 0.05 + pow(f, 2.2) * 0.75; float hl = pow(max(0.0, dot(normalize(vN), normalize(vec3(-0.4, 0.8, 0.3)))), 40.0); gl_FragColor = vec4(c + hl, a + hl * 0.6); }' });
    const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), mat, N); inst.frustumCulled = false; inst.count = 0; k.group.add(inst);
    const pops = [0, 1, 2].map(() => { const m = glow(0.4, 0xbfe8ff, 0); k.group.add(m); return { m, t: 1 }; });
    Object.assign(this, { r, y, inst, mat, pops, bub: [], next: 0.5, popped: 0, src: new THREE.Vector3(at.x + 0.1, y + 0.4, at.z), at: { x: at.x, y, z: at.z }, M: new THREE.Matrix4(), N });
  },
  active(k) { return !!this.inst && k.inRoom('G397', 1); },
  update(dt, k) {
    this.mat.uniforms.uT.value += dt;
    if (k.close(this.at, 3)) once(k, 'bubbles', 'A clay pipe, still blowing bubbles.', 4);
    const r = this.r, p = k.pos;
    if ((this.next -= dt) <= 0 && this.bub.length < this.N) { this.next = 0.8 + Math.random() * 0.6; const a = Math.random() * TAU; this.bub.push({ x: this.src.x, y: this.src.y, z: this.src.z, vx: Math.cos(a) * 0.2, vy: 0.05, vz: Math.sin(a) * 0.2, r: 0, R: 0.06 + Math.random() * 0.06, h: 0.1 + Math.random() * 0.55, life: 14 + Math.random() * 6, ph: Math.random() * TAU }); }
    let n = 0;
    for (let i = this.bub.length - 1; i >= 0; i--) {
      const b = this.bub[i]; b.life -= dt; b.r = Math.min(b.R, b.r + dt * 0.2);
      b.vx += Math.sin(this.mat.uniforms.uT.value * 0.7 + b.ph) * 0.03 * dt; b.vz += Math.cos(this.mat.uniforms.uT.value * 0.6 + b.ph * 1.3) * 0.03 * dt;
      b.vy += ((this.y + b.h) - b.y) * 0.25 * dt; b.vx *= 1 - 0.15 * dt; b.vz *= 1 - 0.15 * dt; b.vy *= 1 - 0.6 * dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      if (b.x < r.x0 + 0.3 || b.x > r.x1 - 0.3) b.vx = -b.vx; if (b.z < r.z0 + 0.3 || b.z > r.z1 - 0.3) b.vz = -b.vz;
      const hit = (p.x - b.x) ** 2 + (p.z - b.z) ** 2 < (b.r + 0.2) ** 2 && b.y - b.r < p.y + 0.22 && b.y + b.r > p.y;
      if (hit || b.life <= 0) {
        this.bub.splice(i, 1); const fx = this.pops.find(q => q.t >= 1) || this.pops[0]; fx.t = 0; fx.m.position.set(b.x, b.y, b.z);
        if (hit) { k.synth.note(1400 + Math.random() * 600, 0.06, { type: 'sine', vol: 0.05 }); this.popped++; if (this.popped === 12) { k.tune(BRAHMS, { bpm: 96, type: 'sine', vol: 0.07, at: 0.4 }); if (k.find('l3bubbles')) k.callout('A DOZEN SOAP BUBBLES'); } }
        continue;
      }
    }
    for (const b of this.bub) { this.M.makeScale(b.r, b.r, b.r).setPosition(b.x, b.y, b.z); this.inst.setMatrixAt(n++, this.M); }
    this.inst.count = n; this.inst.instanceMatrix.needsUpdate = true;
    for (const q of this.pops) { if (q.t >= 1) { q.m.material.opacity = 0; continue; } q.t = Math.min(1, q.t + dt * 4); q.m.scale.setScalar(0.4 + q.t); q.m.material.opacity = (1 - q.t) * 0.7; }
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'l3bubbles', name: 'A dozen soap bubbles (pop them)', ...this.at }] : []; },
});

// ================================================================ 398: the Big Dipper
// Miró's stars hang in this room (in copyright: none of his is drawn here). Seven stars of our own are set in the floor in
// the shape of the Big Dipper, high over Chicago on a winter night. Drive from the end of the handle to the lip of the bowl.
const DIPPER = [[0, 0.3], [1.0, 0.0], [2.0, 0.05], [3.0, 0.2], [3.1, 1.1], [4.4, 1.2], [4.5, 0.25]];
feature({
  id: 'l3stars',
  secrets: [['l3stars', 'The Big Dipper']],
  init(k) {
    const r = k.plan.byId.G398; if (!r) return;
    const y = r.y, sx = (r.x1 - r.x0 - 3.2) / 4.5, x0 = r.x0 + 1.6, z0 = r.z1 - 1.3, sz = Math.min(2.6, (r.z1 - r.z0 - 4.4) / 1.2);
    const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, rr = i % 2 ? 0.075 : 0.19; i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    const sg = new THREE.ShapeGeometry(sh); sg.rotateX(-Math.PI / 2);
    this.stars = DIPPER.map(([a, b], i) => {
      const x = x0 + a * sx, z = z0 - b * sz, m = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: 0x8a7a50, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4 }));
      m.position.set(x, y + 0.014, z); m.rotation.y = i * 0.7; k.group.add(m);
      const gl = glow(1.0, 0xffe2a0, 0, false); gl.rotation.x = -Math.PI / 2; gl.position.set(x, y + 0.02, z); k.group.add(gl);
      return { x, z, m, gl, lit: false };
    });
    const pairs = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]];
    this.lines = pairs.map(([i, j]) => {
      const A = this.stars[i], B = this.stars[j], L = Math.hypot(B.x - A.x, B.z - A.z), m = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.05), new THREE.MeshBasicMaterial({ color: 0xffe6a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(B.z - A.z, B.x - A.x); m.position.set((A.x + B.x) / 2, y + 0.016, (A.z + B.z) / 2); k.group.add(m); return m;
    });
    Object.assign(this, { y, next: 0, t: 0, done: false, at: { x: this.stars[0].x, y, z: this.stars[0].z } });
  },
  active(k) { return !!this.stars && k.inRoom('G398', 1); },
  update(dt, k) {
    this.t += dt;
    once(k, 'stars', 'Seven stars in the floor. Start at the end of the handle.', 4);
    const p = k.pos, NOTES = [262, 294, 330, 392, 440, 523, 587];
    if (this.next < 7) {
      const s = this.stars[this.next];
      if ((p.x - s.x) ** 2 + (p.z - s.z) ** 2 < 0.45 * 0.45 && p.y < this.y + 0.6) {
        s.lit = true; k.synth.note(NOTES[this.next], 0.8, { type: 'sine', vol: 0.07 }); this.next++;
        if (this.next === 7) { this.done = true; k.synth.chime([523, 659, 784, 1047, 1319, 1568]); if (k.find('l3stars')) k.callout('THE BIG DIPPER'); }
      }
    }
    this.stars.forEach((s, i) => {
      const want = s.lit ? (this.done ? 0.8 + Math.sin(this.t * 3 + i) * 0.2 : 0.65) : i === this.next ? 0.25 + Math.sin(this.t * 5) * 0.2 : 0;
      s.gl.material.opacity += (want - s.gl.material.opacity) * Math.min(1, dt * 6);
      s.m.material.color.setHex(s.lit ? 0xfff0b0 : i === this.next ? 0xd8c080 : 0x8a7a50);
    });
    this.lines.forEach((m, i) => { const on = i < 6 ? this.next > i + 1 : this.done; m.material.opacity += ((on ? (this.done ? 0.7 : 0.5) : 0) - m.material.opacity) * Math.min(1, dt * 4); });
  },
  reset() { if (!this.stars) return; this.next = 0; this.done = false; for (const s of this.stars) s.lit = false; },
  spots() { return this.at ? [{ kind: 'secret', id: 'l3stars', name: 'The Big Dipper (handle to bowl)', ...this.at }] : []; },
});

// ================================================================ 389: Futurist sprint
// The long corridor of Gallery 389, end to end. Severini's Montmartre festival hangs next door; the Futurists painted speed
// as lines of force, and that is what the toy leaves behind it here.
feature({
  id: 'l3sprint',
  secrets: [['l3sprint', 'Lines of force']],
  init(k) {
    const r = k.plan.byId.G389; if (!r) return;
    const y = r.y, w = r.x1 - r.x0, GOAL = 3.9;
    const chev = canvasTex(512, 160, (g, W, H) => {
      g.clearRect(0, 0, W, H); const C = ['#d8361f', '#f08a1c', '#141414', '#e8c547'];
      for (let i = 0; i < 9; i++) { g.fillStyle = C[i % 4]; g.globalAlpha = 0.85; g.beginPath(); const x = i * 58 - 20; g.moveTo(x, H); g.lineTo(x + 40, 0); g.lineTo(x + 70, 0); g.lineTo(x + 30, H); g.closePath(); g.fill(); }
    });
    for (const [z, flip] of [[r.z1 - 1.3, 0], [r.z0 + 1.1, 1]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, 1.0), new THREE.MeshBasicMaterial({ map: chev, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })); m.rotation.x = -Math.PI / 2; m.rotation.z = flip ? Math.PI : 0; m.position.set((r.x0 + r.x1) / 2, y + 0.012, z); k.group.add(m); }
    const N = 48, inst = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), N);
    const C = [0xd8361f, 0xf08a1c, 0x141414, 0xf1e6c8, 0xe8c547], col = new THREE.Color();
    for (let i = 0; i < N; i++) inst.setColorAt(i, col.setHex(C[i % C.length]));
    inst.count = 0; inst.frustumCulled = false; k.group.add(inst);
    this.timer = k.timer({ id: 'l3sprint', name: 'G389', limit: 30, min: 2,
      start: { x0: r.x0, x1: r.x1, z0: r.z1 - 2.2, z1: r.z1, y0: y - 0.5, y1: y + 1 }, finish: { x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z0 + 2.0, y0: y - 0.5, y1: y + 1 },
      inside: p => p.x > r.x0 - 0.3 && p.x < r.x1 + 0.3 && p.z > r.z0 - 0.3 && p.z < r.z1 + 0.3 && p.y > y - 0.6 && p.y < y + 1.5,
      onStart: () => k.synth.chime([392, 587], { gap: 0.08, dur: 0.4 }),
      onFinish: t => { if (t < GOAL) { k.synth.chime([523, 659, 784, 1047]); if (k.find('l3sprint')) k.callout('LINES OF FORCE'); } else k.say(`${t.toFixed(2)} s. Under ${GOAL.toFixed(1)} for the secret.`, 3); },
    });
    Object.assign(this, { r, y, inst, N, lines: [], emit: 0, M: new THREE.Matrix4(), Q: new THREE.Quaternion(), S: new THREE.Vector3(), P: new THREE.Vector3(), Y: new THREE.Vector3(0, 1, 0), at: { x: (r.x0 + r.x1) / 2, y, z: r.z1 - 1.3 }, GOAL });
    for (let i = 0; i < N; i++) this.lines.push({ age: 9, x: 0, y: 0, z: 0, yaw: 0, L: 1, w: 0.04 });
  },
  active(k) { return !!this.timer && k.inRoom('G389', 1); },
  update(dt, k) {
    if (k.close(this.at, 2.5)) once(k, 'sprint', `The whole corridor, flat out. Under ${this.GOAL.toFixed(1)} seconds.`, 4);
    this.timer.update(dt);
    const v = k.v, sp = Math.hypot(v.vel.x, v.vel.z);
    if (this.timer.state === 'running' && sp > 1.5 && (this.emit -= dt) <= 0) {
      this.emit = 0.02; const l = this.lines.reduce((a, b) => (b.age > a.age ? b : a)), fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
      Object.assign(l, { age: 0, x: v.pos.x - fx * 0.4 + fz * (Math.random() - 0.5) * 0.9, y: v.pos.y + 0.04 + Math.random() * 0.6, z: v.pos.z - fz * 0.4 - fx * (Math.random() - 0.5) * 0.9, yaw: v.yaw, L: 0.5 + sp * 0.22, w: 0.02 + Math.random() * 0.05 });
    }
    let n = 0;
    for (let i = 0; i < this.N; i++) {
      const l = this.lines[i]; if (l.age > 0.7) { this.M.makeScale(0, 0, 0); this.inst.setMatrixAt(i, this.M); continue; }
      l.age += dt; const f = 1 - l.age / 0.7;
      this.M.compose(this.P.set(l.x, l.y, l.z), this.Q.setFromAxisAngle(this.Y, l.yaw + Math.PI / 2), this.S.set(l.L * (1 + (1 - f) * 0.6), 1, l.w * f)); this.inst.setMatrixAt(i, this.M); n++;
    }
    this.inst.count = this.N; this.inst.instanceMatrix.needsUpdate = true;
  },
  reset() { if (this.timer) this.timer.cancel(); },
  spots() { return this.at ? [{ kind: 'secret', id: 'l3sprint', name: `Lines of force (G389 end to end under ${this.GOAL} s)`, ...this.at }] : []; },
});

// ================================================================ 398 south: soft forms
// Arp's Growth stands next door (in copyright); these are our own: four smooth plaster forms that give when you bump them.
feature({
  id: 'l3forms',
  init(k) {
    const r = k.plan.byId['MW3-midA']; if (!r) return;
    const make = (seed) => {
      const R = rnd(seed), c = new Clay([-0.45, 0, -0.45], [0.45, 0.95, 0.45], 0.03);
      if (seed % 4 === 0) { c.blob([0, 0.25, 0], [0.26, 0.25, 0.22]); c.blob([0.04, 0.55, 0.02], [0.18, 0.2, 0.16], { k: 0.12 }); c.blob([-0.02, 0.78, 0], [0.11, 0.12, 0.1], { k: 0.1 }); }
      else if (seed % 4 === 1) { c.blob([0, 0.17, 0], [0.38, 0.17, 0.26]); c.blob([0.12, 0.17, 0.0], [0.1, 0.3, 0.1], { cut: true, k: 0.06 }); c.blob([-0.2, 0.3, 0.05], [0.14, 0.14, 0.13], { k: 0.1 }); }
      else if (seed % 4 === 2) { c.blob([0, 0.22, 0], [0.22, 0.22, 0.2]); c.blob([0.12, 0.5, 0.0], [0.13, 0.17, 0.12], { k: 0.12 }); c.blob([-0.14, 0.46, 0.02], [0.1, 0.14, 0.1], { k: 0.12 }); }
      else { c.blob([-0.1, 0.13, 0], [0.2, 0.13, 0.17]); c.blob([0.16, 0.12, 0.05], [0.16, 0.12, 0.14], { k: 0.1 }); }
      return c.mesh({ hi: 0xf6f2ea, lo: 0x8c867c, snow: 0, reach: 0.12 });
    };
    const mat = cast({ roughness: 0.75, metalness: 0, emissiveIntensity: 0.5 }), F = [];
    [[0.2, 0.25], [0.8, 0.22], [0.22, 0.78], [0.8, 0.8]].forEach(([fx, fz], i) => {
      const s = spot(k, 'MW3-midA', fx, fz, 0.55, 1.4); if (!s) return;
      const m = new THREE.Mesh(make(i), mat); m.position.set(s.x, r.y, s.z); m.rotation.y = i * 1.3; k.group.add(m);
      const rad = [0.26, 0.36, 0.26, 0.3][i]; block(k, s.x, s.z, rad * 0.8, rad * 0.8, r.y, r.y + [0.9, 0.35, 0.65, 0.26][i]);
      F.push({ m, x: s.x, z: s.z, rad, wob: 0, t: 0, f: [196, 147, 247, 175][i] });
    });
    this.forms = F;
  },
  active(k) { return !!(this.forms && this.forms.length) && k.inRoom('MW3-midA', 1); },
  update(dt, k) {
    const p = k.pos, v = k.v;
    for (const f of this.forms) {
      const dx = p.x - f.x, dz = p.z - f.z, d = Math.hypot(dx, dz), into = -(v.vel.x * dx + v.vel.z * dz) / Math.max(d, 1e-3);
      if (d < f.rad + 0.35 && into > 0.4 && f.wob < 0.3 && p.y < this.forms[0].m.position.y + 0.8) { f.wob = Math.min(1, into / 3); f.t = 0; k.synth.note(f.f, 0.35, { type: 'sine', vol: 0.08 }); k.synth.note(f.f * 0.75, 0.3, { type: 'sine', vol: 0.05, at: 0.06 }); }
      if (f.wob > 0.001) { f.t += dt; f.wob *= Math.exp(-dt * 2.5); const s = Math.sin(f.t * 16) * 0.1 * f.wob; f.m.scale.set(1 + s, 1 - s, 1 + s); } else f.m.scale.set(1, 1, 1);
    }
  },
});

// ================================================================ 399: a mobile
// Discs on wires, hung from the ceiling; drive under it fast and it turns. (Ours; nobody's in particular.)
feature({
  id: 'l3mobile',
  init(k) {
    const r = k.plan.byId.G399; if (!r) return;
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2 - 1, top = r.y + Math.min(r.h, 5.2), wire = metal(0x2a2a2a, { roughness: 0.4 });
    const rod = (len, parent, x, y) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len, 6), wire); m.rotation.z = Math.PI / 2; m.position.set(x, y, 0); parent.add(m); };
    const hang = (len, parent, x, y) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, len, 5), wire); m.position.set(x, y - len / 2, 0); parent.add(m); };
    const disc = (rr, color, parent, x, y) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 0.012, 32), std(color, { roughness: 0.45, emissiveIntensity: 0.25 })); m.rotation.x = Math.PI / 2; m.position.set(x, y, 0); parent.add(m); };
    const root = new THREE.Group(); root.position.set(cx, top, cz); k.group.add(root);
    hang(1.6, root, 0, 0);
    const a1 = new THREE.Group(); a1.position.y = -1.6; root.add(a1); rod(1.6, a1, 0.2, 0); hang(0.3, a1, -0.6, 0); disc(0.22, 0xc8261d, a1, -0.6, -0.5);
    const a2 = new THREE.Group(); a2.position.set(1.0, 0, 0); a1.add(a2); hang(0.4, a2, 0, 0); const a2b = new THREE.Group(); a2b.position.y = -0.4; a2.add(a2b); rod(1.1, a2b, 0.1, 0); hang(0.25, a2b, -0.45, 0); disc(0.15, 0x141414, a2b, -0.45, -0.4); hang(0.2, a2b, 0.65, 0); disc(0.12, 0xf0c419, a2b, 0.65, -0.33);
    const a3 = new THREE.Group(); a3.position.set(0.65, -0.33, 0); a2b.add(a3); hang(0.5, a3, 0, -0.12); const a3b = new THREE.Group(); a3b.position.y = -0.62; a3.add(a3b); rod(0.7, a3b, 0, 0); disc(0.1, 0x1f3f8f, a3b, -0.35, -0.12); disc(0.08, 0xf1ece0, a3b, 0.35, -0.1);
    Object.assign(this, { cx, cz, arms: [{ g: a1, v: 0.05 }, { g: a2, v: -0.08 }, { g: a3, v: 0.12 }], t: 0 });
  },
  active(k) { return !!this.arms && k.inRoom('G399', 2); },
  update(dt, k) {
    const p = k.pos, sp = Math.hypot(k.v.vel.x, k.v.vel.z), near = (p.x - this.cx) ** 2 + (p.z - this.cz) ** 2 < 1.6 * 1.6;
    this.cool = (this.cool || 0) - dt;
    if (near && sp > 2 && this.cool <= 0) { this.cool = 1.5; this.arms.forEach((a, i) => (a.v += (i % 2 ? -1 : 1) * sp * 0.12)); k.synth.chime([880, 1175], { gap: 0.1, vol: 0.025 }); }
    for (const a of this.arms) { a.g.rotation.y += a.v * dt; a.v += (Math.sign(a.v) * 0.05 - a.v) * dt * 0.3; }
  },
});
