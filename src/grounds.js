// The outside of the museum as it really looks, and what stands round it.
//
// Worked from photographs (Wikimedia Commons) and the map (OpenStreetMap): the long Michigan
// Avenue front in grey limestone with its entrance pavilion of three arches, the two green lions,
// banners, the avenue itself, the railway in its cutting with the galleries bridging it, the two
// gardens, the Fountain of the Great Lakes against the Morton Wing, the Modern Wing's flat
// sunshade on thin columns, and the long footbridge going north to Millennium Park.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as TX from './textures.js';
import { Geo } from './geo.js';
import { T, streetY } from './plan.js';
import { winterTree, frostHedge, hedgeMaterial } from './frost.js';
import { buildBridgeway } from './bridgeway.js';
import { buildEastSide } from './eastside.js';
import { buildRailway } from './railway.js';
import { buildStreets } from './streets.js';
import { buildLakefront } from './lakefront.js';

export function buildGrounds(museum, plan) {
  const G = plan.grounds, F = plan.facade, B = plan.bounds, group = museum.group;
  const add = (...m) => { for (const x of m) { x.matrixAutoUpdate = false; x.updateMatrix(); group.add(x); } };
  // Turned stone, not blocks: a baluster and an urn, each a profile spun round its axis.
  const balAt = [];                                      // [x, y, z, height, radius] of every baluster, drawn together at the end
  const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  const balGeo = lathe([[0.001, 0], [1, 0], [1, 0.07], [0.62, 0.1], [0.55, 0.16], [0.95, 0.34], [1, 0.44], [0.8, 0.56], [0.48, 0.72], [0.45, 0.82], [0.62, 0.86], [0.62, 0.9], [1, 0.93], [1, 1], [0.001, 1]], 8);
  // An urn 1 unit wide at the rim and `h` tall, standing on y = 0: foot, stem, a gadrooned bowl, a rolled rim.
  const urnGeo = (w, h) => lathe([[0.001, 0], [0.5, 0], [0.52, 0.04], [0.5, 0.08], [0.3, 0.12], [0.22, 0.2], [0.26, 0.26], [0.5, 0.34], [0.78, 0.5], [0.9, 0.7], [0.92, 0.86], [1.0, 0.92], [1.0, 0.97], [0.9, 1], [0.8, 0.94], [0.001, 0.9]].map(([r, y]) => [r * w / 2, y * h]), 20);
  const clump = (r, mat, x, y, z, sy = 0.7) => { const g = new THREE.Group(); for (const [dx, dy, dz, k] of [[0, 0, 0, 1], [0.45, -0.12, 0.2, 0.62], [-0.4, -0.1, 0.3, 0.6], [0.1, -0.1, -0.48, 0.62], [-0.2, 0.2, -0.1, 0.6]]) { const m = new THREE.Mesh(clumpGeo, mat); m.position.set(dx * r, dy * r, dz * r); m.scale.set(r * k, r * k * sy, r * k); g.add(m); } g.position.set(x, y, z); return g; };
  const clumpGeo = new THREE.SphereGeometry(1, 14, 10);
  const ash = TX.ashlar();
  const stone = new THREE.MeshStandardMaterial({ map: ash, roughness: 0.9, emissiveMap: ash, emissive: new THREE.Color(0.78, 0.66, 0.50), emissiveIntensity: 0.5 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xbdb3a0, roughness: 0.9, emissive: new THREE.Color(0.78, 0.66, 0.50).multiplyScalar(0.47), emissiveIntensity: 0.5, side: THREE.DoubleSide });       // dressed limestone, the wall's own colour
  const base = new THREE.MeshStandardMaterial({ color: 0x8a867e, roughness: 0.8, emissive: 0x3c404e, emissiveIntensity: 0.55 });
  const night = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.035, 0.045, 0.075) });
  const warm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 0.66, 0.3) });
  const verdigris = new THREE.MeshStandardMaterial({ color: 0x4fa596, roughness: 0.6, metalness: 0.2, emissive: 0x1d4a42, emissiveIntensity: 0.8 });
  const snowTex = museum.snowTex;
  const snow = new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5 });

  // ------------------------------------------------------ the Michigan Avenue front
  // Built to the photographs: one warm limestone throughout, the relief real, the colour all but even. Heights are off
  // the people on the pavement: a rusticated storey of 7.6 m, the loggia to 17.2, the entablature to 20.5, the pediment's
  // apex at 27; wings whose cornice stands at 18.5.
  {
    const n28 = 28, W = [-1, 0, 0];
    const { FX, PX, cz } = F, p0 = cz - F.half, p1 = cz + F.half, WH = F.wing, PH = F.pav;
    // Stone, in the few forms it takes here. Every one is lit the same way (its own picture, glowing a little, as under floodlights).
    const cvTex = (w, h, draw, rep = true) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
    const grain = (c, w, h, seed, k = 1) => { const r = TX.rng(seed); for (let i = 0; i < w * h / 90; i++) { c.fillStyle = `rgba(${r() > 0.5 ? '255,250,238' : '40,34,24'},${r() * 0.05 * k})`; c.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 3); } };
    const STONE = '#bdb3a0';
    const plainT = cvTex(128, 128, (c, w, h) => { c.fillStyle = STONE; c.fillRect(0, 0, w, h); grain(c, w, h, 5); });
    // Banded rustication: courses 0.45 m deep with a deep channel between, the blocks breaking joint. One tile is two courses by 1.8 m.
    const rustT = cvTex(256, 256, (c, w, h) => { c.fillStyle = STONE; c.fillRect(0, 0, w, h); grain(c, w, h, 9, 1.4);
      for (let j = 0; j < 2; j++) { const y = j * 128; c.fillStyle = 'rgba(38,32,24,.62)'; c.fillRect(0, y, w, 13); c.fillStyle = 'rgba(38,32,24,.22)'; c.fillRect(0, y + 13, w, 5); c.fillStyle = 'rgba(255,250,236,.26)'; c.fillRect(0, y + 122, w, 6);
        for (const x of j ? [64, 192] : [0, 128]) { c.fillStyle = 'rgba(38,32,24,.4)'; c.fillRect(x, y + 13, 4, 115); c.fillStyle = 'rgba(255,250,236,.16)'; c.fillRect(x + 4, y + 13, 3, 115); } } });
    // Voussoirs: one stone to a tile, its joint down one side.
    const voussT = cvTex(64, 64, (c, w, h) => { c.fillStyle = STONE; c.fillRect(0, 0, w, h); grain(c, w, h, 3); c.fillStyle = 'rgba(38,32,24,.55)'; c.fillRect(0, 0, 5, h); c.fillStyle = 'rgba(255,250,236,.22)'; c.fillRect(5, 0, 3, h); c.fillStyle = 'rgba(38,32,24,.3)'; c.fillRect(0, 0, w, 3); });
    // Dentils, and the bigger blocks (modillions) under a cornice: a block and a gap to a tile, in shadow underneath.
    const dentT = cvTex(64, 64, (c, w, h) => { c.fillStyle = '#5b5345'; c.fillRect(0, 0, w, h); c.fillStyle = STONE; c.fillRect(0, 0, w, 14); c.fillStyle = '#c9c0ad'; c.fillRect(6, 12, 36, 44); c.fillStyle = 'rgba(38,32,24,.35)'; c.fillRect(38, 12, 5, 44); c.fillRect(6, 52, 37, 5); });
    // A relief panel: a procession of draped figures, cut shallow. (Nobody's design but this one's.)
    const reliefT = cvTex(512, 256, (c, w, h) => { c.fillStyle = '#b4aa97'; c.fillRect(0, 0, w, h); grain(c, w, h, 21, 1.5);
      const fig = (x, s, lean, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x + lean * 6, 62, 15 * s, 18 * s, 0, 0, 7); c.fill();
        c.beginPath(); c.moveTo(x - 20 * s + lean * 4, 84); c.quadraticCurveTo(x + lean * 10, 74, x + 22 * s + lean * 4, 86); c.lineTo(x + 30 * s, 232); c.lineTo(x - 30 * s, 232); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(x + 18 * s, 96); c.lineTo(x + 46 * s * lean + 8, 138); c.lineTo(x + 40 * s * lean, 150); c.lineTo(x + 10 * s, 116); c.closePath(); c.fill(); };
      const r = TX.rng(77); for (let i = 0; i < 8; i++) { const x = 40 + i * 62, s = 0.9 + r() * 0.2, lean = r() > 0.5 ? 1 : -1; fig(x + 4, s, lean, 'rgba(40,34,24,.5)'); fig(x - 3, s, lean, 'rgba(255,250,236,.5)'); fig(x, s, lean, '#c6bca8');
        c.strokeStyle = 'rgba(60,50,36,.4)'; c.lineWidth = 2; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * 7 * s, 110); c.lineTo(x + k * 10 * s, 228); c.stroke(); } }
      c.strokeStyle = 'rgba(38,32,24,.6)'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10); c.strokeStyle = 'rgba(255,250,236,.4)'; c.lineWidth = 3; c.strokeRect(13, 13, w - 26, h - 26); }, false);
    // A roundel: a rosette in a moulded ring.
    const medT = cvTex(128, 128, (c, w, h) => { c.fillStyle = STONE; c.fillRect(0, 0, w, h); const g = c.createRadialGradient(56, 54, 6, 64, 64, 64); g.addColorStop(0, '#d2c9b6'); g.addColorStop(0.62, '#b9af9b'); g.addColorStop(0.7, '#6f6655'); g.addColorStop(0.8, '#cfc6b3'); g.addColorStop(0.96, '#b3a995'); g.addColorStop(1, '#6a6152'); c.fillStyle = g; c.beginPath(); c.arc(64, 64, 63, 0, 7); c.fill();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.fillStyle = 'rgba(60,50,36,.34)'; c.beginPath(); c.ellipse(66 + Math.cos(a) * 20, 66 + Math.sin(a) * 20, 15, 7, a, 0, 7); c.fill(); c.fillStyle = '#cbc2ae'; c.beginPath(); c.ellipse(64 + Math.cos(a) * 20, 64 + Math.sin(a) * 20, 14, 6, a, 0, 7); c.fill(); }
      c.fillStyle = '#8f8573'; c.beginPath(); c.arc(64, 64, 8, 0, 7); c.fill(); }, false);
    // An acroterion: a palmette, standing up off the cornice.
    const palmT = cvTex(128, 160, (c, w, h) => { c.clearRect(0, 0, w, h); for (const [col, o] of [['#6f6655', 3], ['#c4baa6', 0]]) { c.fillStyle = col; for (let i = -4; i <= 4; i++) { const a = i * 0.26; c.save(); c.translate(64 + o, 150); c.rotate(a); c.beginPath(); c.ellipse(0, -72 + Math.abs(i) * 6, 9, 62 - Math.abs(i) * 6, 0, 0, 7); c.fill(); c.restore(); } c.fillRect(22 + o, 138, 84, 22); c.beginPath(); c.arc(64 + o, 138, 20, Math.PI, 0); c.fill(); } }, false);
    const E = new THREE.Color(0.78, 0.66, 0.50), EI = 0.5;
    const mk = (t, k = 1, o = {}) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, emissiveMap: t, emissive: E.clone().multiplyScalar(k), emissiveIntensity: EI, side: THREE.DoubleSide, ...o });
    const wallM = mk(ash, 1.0), rustM = mk(rustT, 1.0), voussM = mk(voussT, 1.03), shadeM = mk(plainT, 0.66), deepM = mk(plainT, 0.4), dentM = mk(dentT, 1.0), smoothM = mk(plainT, 0.97);
    const bronzeM = new THREE.MeshStandardMaterial({ color: 0x2c2418, roughness: 0.5, metalness: 0.5, emissive: 0x1a140c, emissiveIntensity: 0.8 });
    const loggiaM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.075, 0.062, 0.05) });
    const wall = new Geo(), rust = new Geo(), tr = new Geo(), shade = new Geo(), deep = new Geo(), vouss = new Geo(), dent = new Geo(), smooth = new Geo(), dark = new Geo(), glow = new Geo(), roof = new Geo(), bronze = new Geo(), logg = new Geo();
    const med = [];                                      // [x, y, z, r] of every roundel
    // A stretch of wall on the plane x = X, facing the avenue; `su`, `sv` are the size of one tile of its stone.
    const rect = (g, X, z0, z1, y0, y1, su = 2.6, sv = su) => { if (z1 - z0 > 0.001 && y1 - y0 > 0.001) g.quad([X, y0, z1], [X, y0, z0], [X, y1, z0], [X, y1, z1], W, [[z1 / su, y0 / sv], [z0 / su, y0 / sv], [z0 / su, y1 / sv], [z1 / su, y1 / sv]]); };
    // The stone between the round head of an opening and a level line above it.
    const spandrel = (g, X, zc, r, spring, top, su = 2.6, sv = su) => { for (let i = 0; i < n28; i++) { const a0 = Math.PI * i / n28, a1 = Math.PI * (i + 1) / n28, zA = zc + r * Math.cos(a0), zB = zc + r * Math.cos(a1), yA = spring + r * Math.sin(a0), yB = spring + r * Math.sin(a1);
      g.quad([X, yA, zA], [X, yB, zB], [X, top, zB], [X, top, zA], W, [[zA / su, yA / sv], [zB / su, yB / sv], [zB / su, top / sv], [zA / su, top / sv]]); } };
    // A wall from z0 to z1 and y0 to y1 with round-headed openings through it: each { zc, r, spring, sill }.
    const pierced = (g, X, z0, z1, y0, y1, holes, su, sv) => { let z = z0; for (const o of [...holes].sort((a, b) => a.zc - b.zc)) { rect(g, X, z, o.zc - o.r, y0, y1, su, sv); if (o.sill > y0) rect(g, X, o.zc - o.r, o.zc + o.r, y0, o.sill, su, sv); spandrel(g, X, o.zc, o.r, o.spring, y1, su, sv); z = o.zc + o.r; } rect(g, X, z, z1, y0, y1, su, sv); };
    // A filled round-headed panel (glass, or the back of a niche).
    const panel = (g, X, zc, r, y0, spring, su = 2.6) => { rect(g, X, zc - r, zc + r, y0, spring, su); for (let i = 0; i < n28; i++) { const a0 = Math.PI * i / n28, a1 = Math.PI * (i + 1) / n28; g.quad([X, spring, zc], [X, spring + r * Math.sin(a0), zc + r * Math.cos(a0)], [X, spring + r * Math.sin(a1), zc + r * Math.cos(a1)], [X, spring, zc], W, [[zc / su, spring / su], [(zc + r * Math.cos(a0)) / su, (spring + r * Math.sin(a0)) / su], [(zc + r * Math.cos(a1)) / su, (spring + r * Math.sin(a1)) / su], [zc / su, spring / su]]); } };
    // The sides and the soffit of an opening, from the face of the wall back to `Xb`.
    const reveal = (g, Xf, Xb, zc, r, y0, spring) => { g.quad([Xf, y0, zc - r], [Xb, y0, zc - r], [Xb, spring, zc - r], [Xf, spring, zc - r], [0, 0, 1]); g.quad([Xf, y0, zc + r], [Xb, y0, zc + r], [Xb, spring, zc + r], [Xf, spring, zc + r], [0, 0, -1]);
      for (let i = 0; i < n28; i++) { const a0 = Math.PI * i / n28, a1 = Math.PI * (i + 1) / n28, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1); g.quad([Xf, spring + r * s0, zc + r * c0], [Xb, spring + r * s0, zc + r * c0], [Xb, spring + r * s1, zc + r * c1], [Xf, spring + r * s1, zc + r * c1], [0, -(s0 + s1) / 2, -(c0 + c1) / 2]); } };
    // The ring of an arch: a moulded band standing `p` proud of the wall, from radius ra to rb; `K` voussoirs if it is cut into stones.
    const ring = (g, X, p, zc, ra, rb, spring, K = 0) => { const xf = X - p;
      for (let i = 0; i < n28; i++) { const a0 = Math.PI * i / n28, a1 = Math.PI * (i + 1) / n28, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), P = (r, c, sn, xx) => [xx, spring + r * sn, zc + r * c], u0 = K ? i / n28 * K : 0, u1 = K ? (i + 1) / n28 * K : 1;
        g.quad(P(ra, c0, s0, xf), P(rb, c0, s0, xf), P(rb, c1, s1, xf), P(ra, c1, s1, xf), W, [[u0, 0], [u0, 1], [u1, 1], [u1, 0]]);
        g.quad(P(rb, c0, s0, xf), P(rb, c0, s0, X), P(rb, c1, s1, X), P(rb, c1, s1, xf), [0, (s0 + s1) / 2, (c0 + c1) / 2]);
        g.quad(P(ra, c0, s0, X), P(ra, c0, s0, xf), P(ra, c1, s1, xf), P(ra, c1, s1, X), [0, -(s0 + s1) / 2, -(c0 + c1) / 2]); } };
    // A cornice: courses each standing further out than the one below, with a row of blocks under the top ones.
    const cornice = (X, y0, y1, z0, z1, proj, period) => { const h = y1 - y0, q = proj * 0.3;
      tr.box(X - q, X, y0, y0 + h * 0.6, z0 - q, z1 + q);
      dent.quad([X - q - 0.02, y0 + h * 0.26, z1 + q], [X - q - 0.02, y0 + h * 0.26, z0 - q], [X - q - 0.02, y0 + h * 0.6, z0 - q], [X - q - 0.02, y0 + h * 0.6, z1 + q], W, [[(z1 + q) / period, 0], [(z0 - q) / period, 0], [(z0 - q) / period, 1], [(z1 + q) / period, 1]]);
      tr.box(X - proj, X, y0 + h * 0.6, y0 + h * 0.86, z0 - proj, z1 + proj); tr.box(X - proj * 1.12, X, y0 + h * 0.86, y1, z0 - proj * 1.12, z1 + proj * 1.12); };
    const incised = (text, w, h, x, y, z, size = 46) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: TX.carved(text, 2048, Math.max(32, Math.round(2048 * h / w)), size, '#241e15'), transparent: true, depthWrite: false, color: new THREE.Color(0.8, 0.76, 0.7) })); m.position.set(x, y, z); m.rotation.y = -Math.PI / 2; add(m); };

    // ---- the two wings: a rusticated storey with big windows; a blind arcade on pilasters; the frieze of names; a cornice on blocks
    const LOW = 7.6, STR = 8.0, IMP = 13.5, ARC = 15.5, FRZ = 17.0, CORN = 17.9;
    const names = ['PHIDIAS  ·  PRAXITELES  ·  GIOTTO  ·  DONATELLO  ·  BOTTICELLI  ·  LEONARDO', 'MICHELANGELO  ·  RAPHAEL  ·  TITIAN  ·  DÜRER  ·  REMBRANDT  ·  VELÁZQUEZ'];
    [[F.z0, p0], [p1, F.z1]].forEach(([a, b], wi) => {
      const n = Math.max(3, Math.round((b - a) / 5.0)), step = (b - a) / n, PW = 0.62, ar = (step - 2 * PW) / 2 - 0.3;
      tr.box(FX - 0.16, FX, 0, 0.9, a, b);                                                                // the plinth
      // The lower storey, with a window to each bay: dark glass, a sill, and a flat arch of voussoirs over it.
      { let z = a; for (let i = 0; i < n; i++) { const zc = a + step * (i + 0.5); rect(rust, FX, z, zc - 1.2, 0.9, LOW, 1.8, 0.9); rect(rust, FX, zc - 1.2, zc + 1.2, 0.9, 2.2, 1.8, 0.9); rect(rust, FX, zc - 1.2, zc + 1.2, 5.9, LOW, 1.8, 0.9); z = zc + 1.2;
          rect(dark, FX + 0.28, zc - 1.2, zc + 1.2, 2.2, 5.9); for (const s of [-1, 1]) shade.quad([FX, 2.2, zc + s * 1.2], [FX + 0.28, 2.2, zc + s * 1.2], [FX + 0.28, 5.9, zc + s * 1.2], [FX, 5.9, zc + s * 1.2], [0, 0, -s]);
          shade.quad([FX, 5.9, zc - 1.2], [FX + 0.28, 5.9, zc - 1.2], [FX + 0.28, 5.9, zc + 1.2], [FX, 5.9, zc + 1.2], [0, -1, 0]);
          tr.box(FX - 0.12, FX + 0.28, 2.06, 2.2, zc - 1.34, zc + 1.34);
          vouss.quad([FX - 0.05, 5.9, zc + 1.5], [FX - 0.05, 5.9, zc - 1.5], [FX - 0.05, 6.55, zc - 1.72], [FX - 0.05, 6.55, zc + 1.72], W, [[0, 0], [7, 0], [7, 1], [0, 1]]);
          for (const zz of [zc - 0.8, zc, zc + 0.8]) bronze.box(FX + 0.2, FX + 0.26, 2.2, 5.9, zz - 0.025, zz + 0.025); bronze.box(FX + 0.2, FX + 0.26, 4.6, 4.66, zc - 1.2, zc + 1.2); }
        rect(rust, FX, z, b, 0.9, LOW, 1.8, 0.9); }
      tr.box(FX - 0.24, FX, LOW, LOW + 0.16, a, b); tr.box(FX - 0.16, FX, LOW + 0.16, STR, a, b);         // the string course
      // The arcade: smooth stone, a pilaster at each bay line carrying a moulded impost, a round arch from impost to impost, a roundel over each pilaster.
      rect(wall, FX, a, b, STR, ARC);
      for (let i = 0; i <= n; i++) { const z = a + step * i, z0 = Math.max(a, z - PW), z1 = Math.min(b, z + PW);
        tr.box(FX - 0.2, FX, STR, IMP - 0.3, z0, z1); tr.box(FX - 0.26, FX, STR, STR + 0.5, z0 - 0.05, z1 + 0.05); tr.box(FX - 0.3, FX, IMP - 0.3, IMP, z0 - 0.1, z1 + 0.1); tr.box(FX - 0.24, FX, IMP - 0.42, IMP - 0.3, z0 - 0.04, z1 + 0.04);
        if (i > 0 && i < n) med.push([FX - 0.05, ARC - 0.72, z, 0.44]); }
      for (let i = 0; i < n; i++) { const zc = a + step * (i + 0.5); ring(tr, FX, 0.16, zc, ar, ar + 0.3, IMP); ring(tr, FX, 0.08, zc, ar + 0.3, ar + 0.42, IMP);
        panel(smooth, FX + 0.14, zc, ar, STR, IMP); reveal(shade, FX, FX + 0.14, zc, ar, STR, IMP); tr.box(FX - 0.05, FX + 0.14, STR, STR + 0.18, zc - ar, zc + ar); }
      // Architrave, frieze, cornice, and the plain parapet over it.
      tr.box(FX - 0.1, FX, ARC, ARC + 0.16, a, b); tr.box(FX - 0.16, FX, ARC + 0.16, ARC + 0.4, a, b); rect(smooth, FX - 0.02, a, b, ARC + 0.4, FRZ);
      cornice(FX, FRZ, CORN, a, b, 0.62, 0.62); rect(wall, FX, a, b, CORN, WH);
      tr.box(FX - 0.1, FX + 0.3, WH - 0.16, WH + 0.04, a, b);
      incised(names[wi], b - a - 3, 0.62, FX - 0.05, (ARC + 0.4 + FRZ) / 2, (a + b) / 2, 26);
      // The end of the wing, round the corner: it goes back as far as the rooms do.
      const end = wi === 0 ? a : b, nz = wi === 0 ? -1 : 1;
      const fill = plan.masses.find(q => q.facade && !q.pavilion && Math.abs((wi === 0 ? q.z0 : q.z1) - end) < 0.01), back = Math.max(FX + 4, fill ? fill.x1 : 0);
      // Where a room stands behind, its own wall is the wall: only the thickness of the front is drawn here, a finger's width
      // proud, and the end of the parapet above the room's roof, so the two never lie in the same plane and fight.
      const eb = fill ? FX + 0.62 : back, ez = end + nz * 0.02;
      wall.quad([FX, 0, ez], [eb, 0, ez], [eb, WH, ez], [FX, WH, ez], [0, 0, nz], [[0, 0], [(eb - FX) / 2.6, 0], [(eb - FX) / 2.6, WH / 2.6], [0, WH / 2.6]]);
      if (fill && fill.top < WH - 0.05) wall.quad([eb, fill.top, ez], [back, fill.top, ez], [back, WH, ez], [eb, WH, ez], [0, 0, nz], [[0, 0], [(back - eb) / 2.6, 0], [(back - eb) / 2.6, (WH - fill.top) / 2.6], [0, (WH - fill.top) / 2.6]]);
    });

    // ---- the entrance pavilion
    const d = plan.front, dw = (d.z1 - d.z0) / 2, v = plan.vent, crown = d.h + dw, BAY = 6.6, sr = 1.7, END = 12.4;
    // The lower storey: banded stone, the doorway in the middle and a door either side of it, a blind niche at each end.
    const holes = [{ zc: cz, r: dw, spring: d.h, sill: 0 }, ...[-1, 1].map(s => ({ zc: cz + s * BAY, r: sr, spring: crown - sr, sill: 0 })), ...[-1, 1].map(s => ({ zc: cz + s * END, r: sr, spring: crown - sr, sill: 0.9 }))];
    pierced(rust, PX, p0, p1, 0.9, LOW, holes.map(o => ({ ...o, sill: 0.9 })), 1.8, 0.9);
    { // the plinth, left open at the doors and at the hole beside them
      const gaps = [...(v ? [[v.z0, v.z1]] : []), ...holes.filter(o => o.sill === 0).map(o => [o.zc - o.r, o.zc + o.r])].sort((a, b) => a[0] - b[0]); let z = p0;
      for (const [a, b] of gaps) { tr.box(PX - 0.16, PX, 0, 0.9, z, a); z = b; } tr.box(PX - 0.16, PX, 0, 0.9, z, p1);
      if (v) tr.box(PX - 0.16, PX, v.h + 0.07, 0.9, v.z0, v.z1); }
    for (const o of holes) {
      ring(vouss, PX, 0.1, o.zc, o.r + 0.012, o.r + 0.62, o.spring, 13); tr.box(PX - 0.24, PX, o.spring + o.r - 0.08, o.spring + o.r + 0.86, o.zc - 0.26, o.zc + 0.26); tr.box(PX - 0.3, PX, o.spring + o.r + 0.62, o.spring + o.r + 0.86, o.zc - 0.34, o.zc + 0.34);
      for (const s of [-1, 1]) tr.box(PX - 0.14, PX, o.spring - 0.3, o.spring, Math.min(o.zc + s * o.r, o.zc + s * (o.r + 0.66)), Math.max(o.zc + s * o.r, o.zc + s * (o.r + 0.66)));       // the impost the arch springs from
      if (o.zc === cz) {                                 // the way in: open below (the museum hangs its own doors there), a lit fanlight above
        panel(glow, PX - 0.03, cz, dw, d.h, d.h); tr.box(PX - 0.13, PX, d.h - 0.02, d.h + 0.16, cz - dw, cz + dw);
      } else if (o.sill === 0) {                         // a side door: bronze and glass, set back, staying shut
        const xb = PX + 0.55; reveal(shade, PX, xb, o.zc, o.r, 0, o.spring); rect(bronze, xb, o.zc - o.r, o.zc + o.r, 0, o.spring);
        panel(glow, xb - 0.01, o.zc, o.r, o.spring, o.spring); bronze.box(xb - 0.08, xb, o.spring - 0.1, o.spring + 0.12, o.zc - o.r, o.zc + o.r);
        for (const zz of [o.zc - o.r + 0.06, o.zc, o.zc + o.r - 0.06]) bronze.box(xb - 0.08, xb, 0, o.spring, zz - 0.06, zz + 0.06);
        for (const s of [-1, 1]) { rect(dark, xb - 0.03, o.zc + s * o.r / 2 - o.r / 2 + 0.2, o.zc + s * o.r / 2 + o.r / 2 - 0.2, 0.5, o.spring - 0.3); bronze.box(xb - 0.07, xb - 0.02, 1.25, 1.33, o.zc + s * 0.14 - 0.1, o.zc + s * 0.14 + 0.1); }
        for (let k = 1; k < 5; k++) { const a = Math.PI * k / 5; bronze.quad([xb - 0.04, o.spring, o.zc - 0.03], [xb - 0.04, o.spring, o.zc + 0.03], [xb - 0.04, o.spring + o.r * Math.sin(a), o.zc + o.r * Math.cos(a) + 0.03], [xb - 0.04, o.spring + o.r * Math.sin(a), o.zc + o.r * Math.cos(a) - 0.03], W); }
      } else {                                           // a niche: the same arch, with plain stone in it
        const xb = PX + 0.4; reveal(shade, PX, xb, o.zc, o.r, 0.9, o.spring); panel(smooth, xb, o.zc, o.r, 0.9, o.spring); tr.box(PX - 0.1, xb, 0.9, 1.06, o.zc - o.r, o.zc + o.r);
      }
    }
    for (const z of [BAY / 2, -BAY / 2, (BAY + END) / 2, -(BAY + END) / 2]) med.push([PX - 0.05, crown + 0.9, cz + z, 0.4]);
    tr.box(PX - 0.3, PX, LOW, LOW + 0.18, p0 - 0.1, p1 + 0.1); tr.box(PX - 0.2, PX, LOW + 0.18, STR, p0, p1);
    // The upper storey: three deep arches of a loggia between engaged columns, a solid bay with a carved panel at each end.
    const TOP = 17.2, lr = 2.1, lspring = 14.1, RX = PX + 1.5, cols = [-BAY * 1.5, -BAY / 2, BAY / 2, BAY * 1.5];
    const lh = [-1, 0, 1].map(k => ({ zc: cz + k * BAY, r: lr, spring: lspring, sill: STR }));
    pierced(wall, PX, p0, p1, STR, TOP, lh);
    for (const o of lh) {
      reveal(shade, PX, RX, o.zc, o.r, STR, o.spring); panel(logg, RX, o.zc, o.r, STR, o.spring);
      deep.quad([PX, STR + 0.01, o.zc - o.r], [RX, STR + 0.01, o.zc - o.r], [RX, STR + 0.01, o.zc + o.r], [PX, STR + 0.01, o.zc + o.r], [0, 1, 0]);
      ring(tr, PX, 0.14, o.zc, o.r + 0.012, o.r + 0.34, o.spring); ring(tr, PX, 0.07, o.zc, o.r + 0.34, o.r + 0.48, o.spring);
      tr.box(PX - 0.26, PX, o.spring + o.r - 0.05, o.spring + o.r + 0.7, o.zc - 0.24, o.zc + 0.24);
      for (const s of [-1, 1]) { const za = Math.min(o.zc + s * o.r, o.zc + s * (o.r + 0.5)), zb = Math.max(o.zc + s * o.r, o.zc + s * (o.r + 0.5)); tr.box(PX - 0.12, PX + 0.3, o.spring - 0.34, o.spring, za, zb); tr.box(PX - 0.06, PX, STR, o.spring - 0.34, za, zb); }
      // the balustrade across its foot
      tr.box(PX - 0.08, PX + 0.3, STR, STR + 0.16, o.zc - o.r, o.zc + o.r); tr.box(PX - 0.1, PX + 0.32, STR + 0.9, STR + 1.04, o.zc - o.r, o.zc + o.r);
      for (let z = o.zc - o.r + 0.2; z < o.zc + o.r - 0.1; z += 0.32) balAt.push([PX + 0.11, STR + 0.16, z, 0.74, 0.085]);
    }
    for (const s of [-1, 1]) { const zc = cz + s * 13.1;
      tr.box(PX - 0.12, PX, 13.3, 15.9, zc - 2.5, zc + 2.5); const m = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.2), mk(reliefT, 1.0)); m.position.set(PX - 0.13, 14.6, zc); m.rotation.y = -Math.PI / 2; add(m);
      tr.box(PX - 0.22, PX, STR, TOP, cz + s * F.half - (s > 0 ? 0.9 : 0), cz + s * F.half + (s < 0 ? 0.9 : 0)); }                                                                    // a pilaster at each corner
    // Engaged columns, on pedestals, with flared capitals under the entablature.
    { const R0 = 0.46, colG = lathe([[0.001, 0], [1.3, 0], [1.3, 0.012], [1.18, 0.02], [1.22, 0.03], [1.02, 0.04], [1.0, 0.05], [1.0, 0.3], [0.86, 0.86], [0.9, 0.868], [0.86, 0.876], [0.9, 0.9], [1.12, 0.95], [1.42, 0.985], [1.42, 1], [0.001, 1]].map(([r, y]) => [r * R0, y]), 18);
      const im = new THREE.InstancedMesh(colG, mk(plainT, 1.02), cols.length), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), y0 = STR + 1.04, hh = TOP - 0.2 - y0;
      cols.forEach((k, i) => { im.setMatrixAt(i, M4.compose(new THREE.Vector3(PX - 0.34, y0, cz + k), Q, new THREE.Vector3(1, hh, 1))); tr.box(PX - 1.02, PX, STR, y0, cz + k - 0.68, cz + k + 0.68); tr.box(PX - 1.08, PX, y0 - 0.14, y0, cz + k - 0.74, cz + k + 0.74); tr.box(PX - 1.04, PX, TOP - 0.2, TOP, cz + k - 0.7, cz + k + 0.7); });
      im.frustumCulled = false; add(im); }
    // The entablature: architrave, the frieze with the building's name cut in it, dentils, and a cornice standing well out.
    const AR = TOP + 0.7, FZ = 19.0;
    tr.box(PX - 0.1, PX, TOP, TOP + 0.34, p0, p1); tr.box(PX - 0.17, PX, TOP + 0.34, AR - 0.12, p0, p1); tr.box(PX - 0.26, PX, AR - 0.12, AR, p0 - 0.05, p1 + 0.05);
    rect(smooth, PX - 0.04, p0, p1, AR, FZ); tr.box(PX - 0.04, PX, AR, FZ, p0 - 0.04, p0); tr.box(PX - 0.04, PX, AR, FZ, p1, p1 + 0.04);
    incised('ANNO  DOMINI     ·     THE   ART   INSTITVTE   OF   CHICAGO     ·     MDCCCXCII', 30.5, 1.0, PX - 0.07, (AR + FZ) / 2, cz, 52);
    cornice(PX, FZ, PH, p0, p1, 0.95, 0.42);
    // The pediment: a low gable on the cornice, its raking cornices as deep as the level one, a palmette at each corner and at the apex.
    { const H = 6.5, e = 1.05, hw = F.half + e, zl = cz - hw, zr = cz + hw, back = FX + 3, L = Math.hypot(hw, H), ang = Math.atan2(H, hw), rakeM = mk(plainT, 1.0);
      wall.quad([PX - 0.05, PH, p1], [PX - 0.05, PH, p0], [PX - 0.05, PH + H * F.half / hw, cz], [PX - 0.05, PH + H * F.half / hw, cz], W, [[p1 / 2.6, 0], [p0 / 2.6, 0], [cz / 2.6, H / 2.6], [cz / 2.6, H / 2.6]]);
      for (const sg of [-1, 1]) {
        for (const [dp, th, off] of [[1.15, 0.34, 0.34], [0.8, 0.3, 0.02], [0.45, 0.22, -0.24]]) { const rk = new THREE.Mesh(new THREE.BoxGeometry(dp, th, L + 0.2), rakeM); rk.position.set(PX - dp / 2 + 0.02, PH + H / 2 + off, cz + sg * hw / 2); rk.rotation.x = sg * ang; add(rk); }
        const ze = sg < 0 ? zl : zr, nn = [0, Math.cos(ang), sg * Math.sin(ang)];
        roof.quad([PX - 1.1, PH + 0.5, ze], [back, PH + 0.5, ze], [back, PH + H + 0.5, cz], [PX - 1.1, PH + H + 0.5, cz], nn, [[0, 0], [1, 0], [1, 5], [0, 5]]);
        // its side, closed down to the roofs behind
        wall.quad([FX, 5, cz + sg * F.half], [back, 5, cz + sg * F.half], [back, PH + 0.5, cz + sg * F.half], [FX, PH + 0.5, cz + sg * F.half], [0, 0, sg], [[0, 0], [1, 0], [1, 6], [0, 6]]);
      }
      wall.quad([back, 5, p0], [back, 5, p1], [back, PH + 0.5, p1], [back, PH + 0.5, p0], [1, 0, 0], [[0, 0], [12, 0], [12, 6], [0, 6]]);
      wall.quad([back, PH + 0.5, p0 - e], [back, PH + 0.5, p1 + e], [back, PH + H + 0.5, cz], [back, PH + H + 0.5, cz], [1, 0, 0]);
      plan.obstacles.push({ x0: FX, x1: back, z0: p0, z1: p1, y0: 5, y1: PH + H });
      const palm = mk(palmT, 1.0, { alphaTest: 0.5 });
      for (const [z, y, w2, h2] of [[zl + 0.5, PH + 0.5, 1.8, 2.3], [zr - 0.5, PH + 0.5, 1.8, 2.3], [cz, PH + H + 0.5, 2.3, 2.9]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w2, h2), palm); m.position.set(PX - 0.55, y + h2 / 2 - 0.05, z); m.rotation.y = -Math.PI / 2; add(m); tr.box(PX - 0.95, PX - 0.15, y - 0.25, y + 0.08, z - w2 * 0.4, z + w2 * 0.4); } }
    for (const side of [p0, p1]) { const nz = side === p0 ? -1 : 1; wall.quad([PX, 0, side], [FX, 0, side], [FX, PH, side], [PX, PH, side], [0, 0, nz], [[0, 0], [0.8, 0], [0.8, PH / 2.6], [0, PH / 2.6]]); }
    add(wall.mesh(wallM), rust.mesh(rustM), tr.mesh(trim), shade.mesh(shadeM), deep.mesh(deepM), vouss.mesh(voussM), dent.mesh(dentM), smooth.mesh(smoothM), dark.mesh(night), glow.mesh(warm), bronze.mesh(bronzeM), logg.mesh(loggiaM));
    // The roundels, all at once.
    { const im = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 20), mk(medT, 1.02), med.length), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)); med.forEach(([x, y, z, r], i) => im.setMatrixAt(i, M4.compose(new THREE.Vector3(x, y, z), Q, new THREE.Vector3(r, r, 1)))); im.frustumCulled = false; add(im); }
    // The show's banners, one hanging in each arch of the loggia from its head. (Painted here: nobody's picture.)
    for (const k of [-1, 0, 1]) {
      const cv = document.createElement('canvas'); cv.width = 128; cv.height = 196; const c = cv.getContext('2d'), r = TX.rng(31 + k * 7);
      const g = c.createLinearGradient(0, 0, 128, 196); g.addColorStop(0, '#2b5f8e'); g.addColorStop(0.55, '#4f8a86'); g.addColorStop(1, '#27506e'); c.fillStyle = g; c.fillRect(0, 0, 128, 196);
      for (let i = 0; i < 30; i++) { c.fillStyle = ['#d9b48a', '#c99a6e', '#3d7a52', '#e6d2a8', '#1f4468'][i % 5]; c.globalAlpha = 0.75; c.beginPath(); c.ellipse(r() * 128, 30 + r() * 160, 8 + r() * 22, 5 + r() * 12, r() * 3, 0, 7); c.fill(); }
      c.globalAlpha = 1;
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.9), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(0.8, 0.77, 0.72) })); m.position.set(PX + 0.3, 12.95, cz + k * BAY); m.rotation.y = -Math.PI / 2; add(m);
      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 3.4), base); rod.position.set(PX + 0.3, 15.43, cz + k * BAY); add(rod);
    }
    // Two flags, drawn to their real designs. Each is painted mirrored, so that from either side the hoist is at the pole.
    const flag = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); c.translate(w, 0); c.scale(-1, 1); draw(c, w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, color: new THREE.Color(0.78, 0.78, 0.82) }); };
    const star = (c, x, y, r, n, inner) => { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r * inner : r; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); c.fill(); };
    const flags = [
      // The United States: thirteen stripes, red at top and bottom; a blue canton seven stripes deep and two fifths of the fly; fifty stars in nine rows of six and five.
      [1.9, flag(494, 260, (c, w, h) => { for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#b22234'; c.fillRect(0, i * h / 13, w, h / 13 + 0.6); }
        const ch = h * 7 / 13, cw = w * 0.4; c.fillStyle = '#3c3b6e'; c.fillRect(0, 0, cw, ch); c.fillStyle = '#ffffff';
        for (let row = 0; row < 9; row++) { const n = row % 2 ? 5 : 6; for (let i = 0; i < n; i++) star(c, cw / 12 * (row % 2 ? 2 + i * 2 : 1 + i * 2), ch / 10 * (row + 1), ch * 0.0616 * 0.8, 5, 0.382); } })],
      // Chicago: white, with two blue bars a sixth of the height each, a sixth in from top and bottom, and four red six-pointed stars between them.
      [1.5, flag(390, 260, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#41b6e6'; c.fillRect(0, h / 6, w, h / 6); c.fillRect(0, h * 4 / 6, w, h / 6);
        c.fillStyle = '#e4002b'; for (let i = 0; i < 4; i++) star(c, w * (0.5 + (i - 1.5) * 0.17), h / 2, h * 0.115, 6, 0.42); })]];
    [[-BAY * 1.5, 0], [BAY * 1.5, 1]].forEach(([k, i]) => {
      // The pole leans out from the wall; the flag is bent to it along its hoist, at the tip, and stands off along the street.
      const g = new THREE.Group(); g.scale.setScalar(1.6); g.position.set(PX - 1.0 - 1.6 * 1.12, STR + 1.3 + 1.6 * 1.28, cz + k); g.rotation.z = 0.72;       // from the foot of the outer column, out over the steps
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 3.4, 6), base));
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), trim); knob.position.y = 1.72; g.add(knob);
      // Cloth: a fine sheet held along the hoist by three rings, everything else moved by the wind each frame (museum.flagWave).
      const [ratio, mat] = flags[i], Hh = 1.15, Wd = Hh * ratio, NX = 22, NY = 10, geo = new THREE.PlaneGeometry(Wd, Hh, NX, NY); geo.translate(-Wd / 2, 0, 0);
      const rest = geo.attributes.position.array.slice(); geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3).fill(1), 3));
      mat.vertexColors = true; mat.needsUpdate = true;
      const f = new THREE.Mesh(geo, mat); f.position.set(0, 1.66 - Hh / 2, 0); f.rotation.y = 1.0; f.frustumCulled = false; g.add(f);
      for (const yy of [1.62, 1.66 - Hh / 2, 1.70 - Hh]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 5, 10), base); ring.position.y = yy; ring.rotation.x = Math.PI / 2; g.add(ring); }
      (museum.cloths || (museum.cloths = [])).push({ geo, rest, Wd, Hh, seed: i * 2.7 });
      g.updateMatrixWorld(true); group.add(g);
    });
    // The wind in them. A wave runs out from the pole, growing towards the free edge; gusts lift the cloth and lulls let it
    // hang; the folds are shaded by how steeply the cloth turns away, which is what makes it read as cloth.
    museum.flagWave = (t, calm) => {
      for (const c of museum.cloths || []) {
        const P = c.geo.attributes.position, C = c.geo.attributes.color, R = c.rest, tt = calm ? 0 : t;
        const gust = 0.62 + 0.38 * Math.sin(tt * 0.31 + c.seed) * Math.sin(tt * 0.13 + c.seed * 2), w = 4.6;
        for (let q = 0; q < P.count; q++) {
          const x = R[q * 3], y = R[q * 3 + 1], u = Math.max(0, -x / c.Wd), v = y / c.Hh + 0.5;                      // u: 0 at the pole, 1 at the fly; v: 0 at the foot, 1 at the head
          const ph = u * 7.5 - tt * w + v * 1.1 + c.seed, ph2 = u * 13 - tt * w * 1.6 + v * 2.3;
          const amp = (0.035 + 0.12 * gust) * Math.pow(u, 0.8);
          const z = amp * (Math.sin(ph) + 0.4 * Math.sin(ph2));
          const droop = (1 - gust) * 0.55 * u * u * c.Wd + 0.05 * u * u;                                // in a lull the fly end falls
          const flut = 0.02 * u * Math.sin(u * 20 - tt * 9 + v * 5);
          P.setXYZ(q, x + droop * 0.25 * u, y - droop + flut, z);
          const slope = amp * (7.5 * Math.cos(ph) + 5.2 * Math.cos(ph2)) / c.Wd, sh = Math.max(0.5, Math.min(1.12, 0.86 - slope * 0.9));
          C.setXYZ(q, sh, sh, sh);
        }
        P.needsUpdate = true; C.needsUpdate = true;
      }
    };
    museum.flagWave(0, false);
    // Roofs behind the front.
    for (const m of plan.masses) if (m.facade) roof.quad([m.x0, m.top, m.z0], [m.x1, m.top, m.z0], [m.x1, m.top, m.z1], [m.x0, m.top, m.z1], [0, 1, 0], [[m.x0 / 5, m.z0 / 5], [m.x1 / 5, m.z0 / 5], [m.x1 / 5, m.z1 / 5], [m.x0 / 5, m.z1 / 5]]);
    // The back of the front wall, where it stands taller than the rooms behind.
    { const bw = new Geo(); bw.quad([FX + 0.6, 5, F.z0], [FX + 0.6, 5, F.z1], [FX + 0.6, WH, F.z1], [FX + 0.6, WH, F.z0], [1, 0, 0], [[0, 0], [40, 0], [40, 5], [0, 5]]); add(bw.mesh(wallM)); }
    add(roof.mesh(snow));
    // On the terrace by the doors: two great square planters each side, and lamp standards with five globes.
    const green = new THREE.MeshStandardMaterial({ color: 0x1c3322, roughness: 0.9, emissive: 0x0c1810, emissiveIntensity: 0.7 });
    { const pl = new Geo(), iron = new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.5, metalness: 0.6, emissive: 0x0a0b0e, emissiveIntensity: 0.8 });
      for (const k of [-15.0, -9.3, 9.3, 15.0]) { const x = PX - 1.3, z = cz + k, hw = 0.78;
        pl.box(x - hw - 0.08, x + hw + 0.08, 0, 0.16, z - hw - 0.08, z + hw + 0.08); pl.box(x - hw, x + hw, 0.16, 1.25, z - hw, z + hw); pl.box(x - hw - 0.1, x + hw + 0.1, 1.25, 1.42, z - hw - 0.1, z + hw + 0.1); pl.box(x - hw + 0.08, x + hw - 0.08, 1.42, 1.62, z - hw + 0.08, z + hw - 0.08);
        group.add(clump(0.95, green, x, 2.25, z, 0.78));
        plan.obstacles.push({ x0: x - hw - 0.1, x1: x + hw + 0.1, z0: z - hw - 0.1, z1: z + hw + 0.1, y0: 0, y1: 3 }); }
      add(pl.mesh(trim));
      const postG = lathe([[0.001, 0], [0.3, 0], [0.3, 0.1], [0.2, 0.16], [0.24, 0.5], [0.16, 0.62], [0.1, 0.8], [0.085, 2.9], [0.13, 2.96], [0.085, 3.02], [0.07, 3.5], [0.12, 3.56], [0.001, 3.6]], 10), globeG = new THREE.SphereGeometry(0.2, 12, 8), lit = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.4, 2.0), fog: false });
      const poolT = TX.radial(0, 1);
      for (const k of [-12.3, 12.3]) { const x = PX - 2.1, z = cz + k, g = new THREE.Group(); g.position.set(x, 0, z);
        g.add(new THREE.Mesh(postG, iron));
        for (const [dx, dz] of [[0.42, 0], [-0.42, 0], [0, 0.42], [0, -0.42]]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(dx) + 0.04, 0.04, Math.abs(dz) + 0.04), iron); arm.position.set(dx / 2, 3.05, dz / 2); g.add(arm); const up = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.04), iron); up.position.set(dx, 3.14, dz); g.add(up); const gl = new THREE.Mesh(globeG, lit); gl.position.set(dx, 3.42, dz); g.add(gl); }
        const top = new THREE.Mesh(globeG, lit); top.position.set(0, 3.82, 0); top.scale.setScalar(1.15); g.add(top);
        const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: poolT, color: new THREE.Color(0.5, 0.4, 0.26), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.05; pool.renderOrder = 4; g.add(pool);
        g.updateMatrixWorld(true); group.add(g);
        plan.obstacles.push({ x0: x - 0.25, x1: x + 0.25, z0: z - 0.25, z1: z + 0.25, y0: 0, y1: 4 }); } }
  }

  // ------------------------------------------------------------------- the streets
  {
    const urns = [], rampG = new Geo(), posts = new Geo(), railM = new THREE.MeshStandardMaterial({ color: 0x2a2d34, roughness: 0.4, metalness: 0.6, emissive: 0x15171c, emissiveIntensity: 0.6 }), cheek2 = new Geo(), road = new Geo(), paint = new Geo(), walk = new Geo(), kerb = new Geo(), drift = new Geo(), stepG = new Geo(), nosing = new Geo(), cheek = new Geo(), cope = new Geo(), balus = new Geo();
    const flat = (g, x0, x1, z0, z1, y, s = 4) => g.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, 1, 0], [[x0 / s, z0 / s], [x1 / s, z0 / s], [x1 / s, z1 / s], [x0 / s, z1 / s]]);
    const M = G.michigan, S = plan.street, SX = S.x, SY = S.y, way = id => S.ways.find(w => w.id === id);
    // A stretch that climbs east from the avenue's level to the museum's.
    const slope = (g, x0, x1, z0, z1, lift, s = 4) => { const ya = streetY(plan, x0 + 1e-4, (z0 + z1) / 2) + lift, yb = streetY(plan, x1 - 1e-4, (z0 + z1) / 2) + lift; g.quad([x0, ya, z0], [x1, yb, z0], [x1, yb, z1], [x0, ya, z1], [0, 1, 0], [[x0 / s, z0 / s], [x1 / s, z0 / s], [x1 / s, z1 / s], [x0 / s, z1 / s]]); };
    flat(road, M.x0, M.x1, B.z0, B.z1, SY + 0.004);
    for (const st of [G.monroe, G.jackson]) { flat(road, M.x1, SX, st.z0, st.z1, SY + 0.004); slope(road, SX, SX + 12, st.z0, st.z1, 0.004); flat(road, SX + 12, plan.lakefront ? plan.lakefront.lsd.x0 : B.x1, st.z0, st.z1, 0.004); }
    flat(road, G.columbus.x0, G.columbus.x1, G.monroe.z1, G.jackson.z0, 0.004);
    // Lane lines: dashes down the avenue, a double line up the middle.
    for (let z = B.z0; z < B.z1; z += 9) for (const x of [-19, -6.5]) flat(paint, x - 0.08, x + 0.08, z, z + 3.6, SY + 0.008);
    for (const x of [-12.9, -12.3]) flat(paint, x - 0.07, x + 0.07, B.z0, B.z1, SY + 0.008);
    // (Monroe's and Jackson's centre lines are painted in streets.js: a double yellow.)
    for (let z = G.monroe.z1 + 6; z < G.jackson.z0; z += 9) flat(paint, 284.9, 285.1, z, z + 3.6, 0.008);
    // The crossing at Adams Street, opposite the door.
    for (let z = F.cz - 3.2; z < F.cz + 3.2; z += 0.9) flat(paint, M.x0 + 0.5, M.x1 - 0.5, z, z + 0.45, SY + 0.008);
    // The pavement, down at the avenue's level, under snow, with a strip shovelled along it and across to the steps.
    // Shovelled, the whole width of it: the city does the avenue's pavement. A ridge of what came off it lies along the kerb.
    flat(walk, M.x1, SX, B.z0, B.z1, SY + 0.008, 2.5);
    for (let z = B.z0; z < B.z1; z += 9) if (Math.abs(z + 3.5 - F.cz) > 6) drift.box(M.x1 + 0.15, M.x1 + 0.6, SY, SY + 0.07 + ((z * 7) % 5) * 0.012, z + 0.4, z + 7.2);
    // The pavements of the two side streets, climbing with them.
    for (const w of S.ways) if (w.road) { const st = w.id === 'monroe' ? G.monroe : G.jackson; for (const [a, b2] of [[w.z0, st.z0], [st.z1, w.z1]]) if (b2 - a > 0.2) { slope(walk, SX, SX + 12, a, b2, 0.008, 2.5); } }
    // The terrace before the door: snow, with a way shovelled from the head of the steps to the doors.
    flat(walk, SX + 5.6, F.PX, F.cz - 3.4, F.cz + 3.4, 0.006, 2.5); flat(walk, F.PX - 2.4, F.PX, F.cz - F.half, F.cz + F.half, 0.006, 2.5);
    kerb.box(M.x1 - 0.12, M.x1 + 0.12, SY, SY + 0.07, B.z0, B.z1);

    // The steps. Eight of them, the width of the pavilion, between the lions' blocks.
    // A low wall you can jump up onto: solid from the side, and a top to drive along. (Anything that flies is stopped by it too.)
    const ledge = (x0, x1, z0, z1, top, base = SY) => { plan.surfaces.push({ skin: 'wall', fixed: true, x0, x1, z0, z1, axis: null, h0: top, h1: top, base }); plan.obstacles.push({ x0, x1, z0, z1, y0: base - 0.3, y1: top - 0.07 }); };
    for (const sg of [-1, 1]) { const z0 = F.cz + sg * F.steps - (sg < 0 ? 1.0 : 0); ledge(SX - 0.16, SX + 2.6, z0 - 0.06, z0 + 1.06, SY / 2 + 0.67); ledge(SX + 2.6, SX + 5.96, z0 - 0.06, z0 + 1.06, 0.72); }
    for (const id of ['north', 'south']) { const g = way(id); for (const zz of [g.z0, g.z1]) ledge(SX - 0.2, SX + g.run + 0.35, zz - 0.28, zz + 0.28, 0.6); }
    { const w = way('steps'), n = 8, tread = 0.45, rise = -SY / n, x9 = SX + w.run + 0.02;
      // The stretches of z a flight keeps for its steps, between its ramps.
      const between = g => { const out = []; let z = g.z0; for (const [ra, rb] of [...(g.ramps || [])].sort((p, q) => p[0] - q[0])) { if (ra - z > 0.05) out.push([z, ra]); z = rb; } if (g.z1 - z > 0.05) out.push([z, g.z1]); return out; };
      // A ramp: one plain slope the length of the flight, with a kerb and a handrail each side.
      const ramp = (g, za, zb) => { const xa = SX, xb = SX + g.run, L = Math.hypot(g.run, -SY), ang = Math.atan2(-SY, g.run);
        rampG.quad([xa, SY + 0.01, za], [xa, SY + 0.01, zb], [xb, 0.01, zb], [xb, 0.01, za], [SY / L, g.run / L, 0], [[0, 0], [(zb - za) / 1.2, 0], [(zb - za) / 1.2, L / 1.2], [0, L / 1.2]]);
        for (const zz of [za, zb]) { rampG.quad([xa, SY, zz], [xb, SY, zz], [xb, 0.01, zz], [xa, SY + 0.01, zz], [0, 0, zz === za ? -1 : 1]);
          const zr = zz === za ? zz + 0.06 : zz - 0.06;
          const kerbM = new THREE.Mesh(new THREE.BoxGeometry(L, 0.07, 0.1), trim); kerbM.position.set((xa + xb) / 2, SY / 2 + 0.04, zr); kerbM.rotation.z = ang; add(kerbM);
          const rail = new THREE.Mesh(new THREE.BoxGeometry(L + 0.5, 0.035, 0.035), railM); rail.position.set((xa + xb) / 2, SY / 2 + 0.62, zr); rail.rotation.z = ang; add(rail);
          for (const t of [0.02, 0.5, 0.98]) posts.box(xa + g.run * t - 0.02, xa + g.run * t + 0.02, SY * (1 - t), SY * (1 - t) + 0.62, zr - 0.02, zr + 0.02); } };
      for (const [za, zb] of between(w)) for (let i = 0; i < n; i++) { const x0 = SX + (i < 4 ? i * tread : w.land[1] + (i - 4) * tread), top = SY + (i + 1) * rise; stepG.box(x0, x9, top - rise, top, za, zb); nosing.box(x0 - 0.03, x0 + 0.05, top - 0.035, top + 0.004, za, zb); }
      for (const [za, zb] of w.ramps || []) ramp(w, za, zb);
      // Its stone cheeks, stepping up with it, each carrying an urn of flowers on the landing and at the head.
      for (const sg of [-1, 1]) { const z0 = F.cz + sg * F.steps - (sg < 0 ? 1.0 : 0), z1 = z0 + 1.0;
        cheek2.box(SX - 0.1, SX + 2.6, SY, SY / 2 + 0.55, z0, z1); cheek2.box(SX + 2.6, SX + 5.9, SY, 0.6, z0, z1);
        cope.box(SX - 0.16, SX + 2.66, SY / 2 + 0.55, SY / 2 + 0.67, z0 - 0.06, z1 + 0.06); cope.box(SX + 2.56, SX + 5.96, 0.6, 0.72, z0 - 0.06, z1 + 0.06);
        urns.push([SX + 1.3, SY / 2 + 0.67, (z0 + z1) / 2], [SX + 4.3, 0.72, (z0 + z1) / 2]); }
      const tr2 = way('north').run / n;
      for (const id of ['north', 'south']) { const g = way(id); for (const [za, zb] of g.ramps || []) ramp(g, za, zb); for (const [gz0, gz1] of between(g)) for (let i = 0; i < n; i++) { const x0 = SX + i * tr2, top = SY + (i + 1) * rise; stepG.box(x0, SX + g.run + 0.02, top - rise, top, gz0, gz1); nosing.box(x0 - 0.03, x0 + 0.05, top - 0.035, top + 0.004, gz0, gz1); }
        for (const zz of [g.z0, g.z1]) { cheek.box(SX - 0.15, SX + g.run + 0.3, SY, 0.5, zz - 0.22, zz + 0.22); cope.box(SX - 0.2, SX + g.run + 0.35, 0.5, 0.6, zz - 0.28, zz + 0.28); } } }
    // The wall that holds the terrace up, with its coping; and along the museum's own front a balustrade on top of it.
    for (const [a, b2] of S.walls) {
      cheek.quad([SX, SY, a], [SX, SY, b2], [SX, 0.02, b2], [SX, 0.02, a], [-1, 0, 0], [[a / 2, 0], [b2 / 2, 0], [b2 / 2, 0.6], [a / 2, 0.6]]);
      cope.box(SX - 0.1, SX + 0.34, -0.04, 0.1, a, b2);
      const z0 = Math.max(a, F.z0 - 2), z1 = Math.min(b2, F.z1 + 2);
      if (z1 - z0 > 1 && !(Math.abs((a + b2) / 2 - F.cz) < F.steps)) {
        const lo = Math.abs(z0 - F.cz) < F.lion + 0.5 ? z0 + 1.05 : z0, hi = Math.abs(z1 - F.cz) < F.lion + 0.5 ? z1 - 1.05 : z1;      // the lion's block takes the end nearest the steps
        cope.box(SX - 0.02, SX + 0.3, 0.1, 0.2, lo, hi); cope.box(SX - 0.06, SX + 0.34, 0.82, 0.96, lo, hi);
        for (let z = lo + 0.2; z < hi - 0.1; z += 0.36) balAt.push([SX + 0.14, 0.2, z, 0.62, 0.085]);
        for (let z = lo; z <= hi + 0.01; z += Math.max(3.6, (hi - lo) / Math.max(1, Math.round((hi - lo) / 5.4)))) cope.box(SX - 0.08, SX + 0.36, 0.1, 1.04, z - 0.2, z + 0.2);
        ledge(SX - 0.06, SX + 0.34, lo, hi, 0.96);
      }
    }
    // The walls beside the two streets as they climb.
    for (const w of S.ways) if (w.road) { const zz = w.z0 < 0 ? w.z1 : w.z0, d = w.z0 < 0 ? 1 : -1; plan.surfaces.push({ skin: 'wall', fixed: true, x0: SX, x1: SX + 12, z0: zz - 0.17, z1: zz + 0.17, axis: null, h0: 0.1, h1: 0.1, base: SY }); cheek.quad([SX, SY, zz], [SX + 12, SY, zz], [SX + 12, 0.02, zz], [SX, 0.02, zz], [0, 0, -d]); cheek.quad([SX + 12, SY, zz], [SX, SY, zz], [SX, 0.02, zz], [SX + 12, 0.02, zz], [0, 0, d]); cope.box(SX, SX + 12, -0.04, 0.1, zz - 0.17, zz + 0.17); }
    const at = TX.asphalt();
    add(road.mesh(new THREE.MeshStandardMaterial({ map: at, roughness: 0.55, emissiveMap: at, emissive: new THREE.Color(0.4, 0.45, 0.6), emissiveIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })));
    add(paint.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.6, 0.5), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
    add(walk.mesh(new THREE.MeshStandardMaterial({ color: 0x9a968e, roughness: 0.85, emissive: 0x3a3f4f, emissiveIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })));
    add(kerb.mesh(base));
    const steps = new THREE.MeshStandardMaterial({ color: 0xbdb3a0, roughness: 0.9, emissive: 0x5c5040, emissiveIntensity: 0.6 });
    add(stepG.mesh(steps), cheek.mesh(stone), cope.mesh(trim), balus.mesh(trim));
    add(nosing.mesh(snow), cheek2.mesh(steps));
    add(rampG.mesh(new THREE.MeshStandardMaterial({ color: 0x9c9484, roughness: 0.9, emissive: 0x4a4134, emissiveIntensity: 0.55 })), posts.mesh(railM));
    { const bowl = urnGeo(1.05, 0.62).translate(0, -0.28, 0), fl = new THREE.SphereGeometry(0.5, 16, 8);
      const green = new THREE.MeshStandardMaterial({ color: 0x24402a, roughness: 0.9, emissive: 0x0e1c12, emissiveIntensity: 0.6 }), red = new THREE.MeshStandardMaterial({ color: 0xb3202a, roughness: 0.8, emissive: 0x6a0d14, emissiveIntensity: 0.8 });
      for (const [x, y, z] of urns) { const u = new THREE.Mesh(bowl, trim), l = clump(0.44, green, x, y + 0.86, z), f = new THREE.Mesh(fl, red); u.position.set(x, y + 0.28, z); f.position.set(x, y + 0.62, z); f.scale.set(1.1, 0.3, 1.1); add(u, f, l); } }
    const dm = snow.clone(); dm.polygonOffset = true; dm.polygonOffsetFactor = -1; dm.polygonOffsetUnits = -1; add(drift.mesh(dm));
  }

  // ------------------------------------------------------------------- the gardens
  {
    // Trees: one winter tree, drawn many times. Trunk and boughs with snow lying along them, and a crown of fine twigs, each white on top (frost.js).
    const WT = winterTree();
    const trees = new THREE.InstancedMesh(WT.wood, WT.woodMat, Math.max(1, G.trees.length)), twigs = new THREE.InstancedMesh(WT.twigs, WT.twigMat, Math.max(1, G.trees.length));
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
    G.trees.forEach((t, i) => {
      const wide = t.kind === 'hawthorn';                // low and spreading; the street trees stand taller and narrower
      M4.compose(new THREE.Vector3(t.x, streetY(plan, t.x, t.z), t.z), Q.setFromEuler(E.set(0, t.yaw, 0)), new THREE.Vector3(t.s * (wide ? 1.45 : 1.0), t.s * (wide ? 1.05 : 1.6), t.s * (wide ? 1.45 : 1.0)));
      trees.setMatrixAt(i, M4); twigs.setMatrixAt(i, M4);
    });
    trees.frustumCulled = twigs.frustumCulled = false; group.add(trees, twigs);
    // Hedges, with snow lying on top.
    const hedge = new Geo(), cap = new Geo();
    for (const h of G.hedges) frostHedge(hedge, h.x0, h.x1, h.z0, h.z1, 0, 0.86);
    if (!hedge.empty) add(hedge.mesh(hedgeMaterial())); void cap;

    // The South Garden's long pool, frozen, in its stone rim.
    const p = G.pool, rim = new Geo();
    rim.box(p.x0 - 0.4, p.x1 + 0.4, 0, 0.07, p.z0 - 0.4, p.z0); rim.box(p.x0 - 0.4, p.x1 + 0.4, 0, 0.07, p.z1, p.z1 + 0.4);
    rim.box(p.x0 - 0.4, p.x0, 0, 0.07, p.z0, p.z1); rim.box(p.x1, p.x1 + 0.4, 0, 0.07, p.z0, p.z1);
    add(rim.mesh(trim));
    const ice = new THREE.Mesh(new THREE.PlaneGeometry(p.x1 - p.x0, p.z1 - p.z0), museum.mirror.patch(new THREE.MeshStandardMaterial({ color: 0x1a2a3c, roughness: 0.08, emissive: 0x0a1626, emissiveIntensity: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), [0.35, 0.5]));
    ice.rotation.x = -Math.PI / 2; ice.position.set((p.x0 + p.x1) / 2, 0.01, (p.z0 + p.z1) / 2); add(ice); museum.floors.push(ice);

    // (The fountains and the sculpture are in statues.js.)
  }

  // ---------------------------------------------- skylights, as the roofs are seen from the air
  {
    const curb = new Geo(), glass = new Geo();
    for (const q of plan.masses) {
      const r = q.room;
      if (!r || !q.glass) continue;                       // only a room with sky over it has one (see addRoofs)
      const x0 = q.glass.x0 + 0.2, x1 = q.glass.x1 - 0.2, z0 = q.glass.z0 + 0.2, z1 = q.glass.z1 - 0.2, y = q.top;
      curb.box(x0 - 0.2, x1 + 0.2, y, y + 0.35, z0 - 0.2, z0); curb.box(x0 - 0.2, x1 + 0.2, y, y + 0.35, z1, z1 + 0.2); curb.box(x0 - 0.2, x0, y, y + 0.35, z0, z1); curb.box(x1, x1 + 0.2, y, y + 0.35, z0, z1);
      glass.quad([x0, y + 0.3, z0], [x1, y + 0.3, z0], [x1, y + 0.3, z1], [x0, y + 0.3, z1], [0, 1, 0]);
    }
    add(curb.mesh(base), glass.mesh(new THREE.MeshBasicMaterial({ map: TX.laylight(), color: new THREE.Color(0.3, 0.34, 0.46) })));
  }
  // The Modern Wing's glass, its sunshade, and the footbridge from the park (bridgeway.js).
  // Every baluster out here, turned on the one lathe.
  if (balAt.length) { const im = new THREE.InstancedMesh(balGeo, trim, balAt.length), M4 = new THREE.Matrix4(), Q0 = new THREE.Quaternion(); balAt.forEach(([x, y, z, hh, r], i) => im.setMatrixAt(i, M4.compose(new THREE.Vector3(x, y, z), Q0, new THREE.Vector3(r, hh, r)))); im.frustumCulled = false; group.add(im); }
  buildBridgeway(museum, plan);
  // The railway in its cutting, and the bridges over it.
  buildRailway(museum, plan);
  // Butler Field, Lake Shore Drive and the harbour (lakefront.js).
  buildLakefront(museum, plan);
  // The streets as they are: pavements, medians, crossings, signals, and what stands on them (streets.js).
  buildStreets(museum, plan);
  void T;

  // The Columbus Drive side, and the gardens as they lie from above.
  buildEastSide(museum, plan);
}
