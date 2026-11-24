// The bin yard round the back, and the staff vent: drawn. (What is solid is in src/ventplan.js; this draws exactly that.)
//
// Outside the east wall of the old building's north end: a swept concrete apron, a timber screen on steel posts with
// the dumpster in front of it (the dumpster itself is src/guards.js's), a lamp on the screen's corner post, and a
// galvanised hood on a concrete kerb over an air intake. Its grille is off and leant against its side. Inside, a duct
// in riveted sheet with a chequer-plate floor slopes down under the apron and the wall, lit by a few small fittings,
// and comes out in a steel frame low in the wall of the staff entrance, under a notice.
//
// The light inside is what finds it for you: it shows through the hood's louvres and lies on the apron at the mouth,
// and a little steam comes off the hood into the cold. In the duct the camera goes in with the toy (k.camClose).

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature } from './features.js';
import * as TX from './textures.js';
import { VENT } from './ventplan.js';
import { carve } from './plan.js';

const BERM = 0xa4b4d6, GALV = 0x9aa3ab, GALV2 = 0x7b848d, DARK = 0x3a3f46, IRON = 0x2a2d32, CONC = 0x8d8f8c, CONC2 = 0x74767a, SNOW = 0xeef2f8, BOARD = 0x6e5236, BOARD2 = 0x5d4329, YELLOW = 0xd9a520, WARM = 0xffc27a;

// Pieces painted a colour and merged, as the dumpster is made.
function paint(g, hex) { const q = g.index ? g.toNonIndexed() : g; q.deleteAttribute('uv'); const c = new THREE.Color(hex), n = q.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } q.setAttribute('color', new THREE.BufferAttribute(a, 3)); return q; }
const box = (x0, x1, y0, y1, z0, z1, hex) => { const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return paint(g, hex); };
const lump = (x, y, z, r, sy, hex) => { const g = new THREE.SphereGeometry(r, 12, 8); g.scale(1, sy, 1); g.translate(x, y, z); return paint(g, hex); };
// Everything in the building glows a little in its own colour, or at night it is a black shape (as src/guards.js does).
function selfLit(mat, k) {
  mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vColor.rgb * ' + k.toFixed(3) + ';'); };
  mat.customProgramCacheKey = () => 'selfLit' + k;
  return mat;
}
// A flat piece with a texture on it: four corners in order, and how many times the picture repeats each way.
function quad(a, b, c, d, ru = 1, rv = 1) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...a, ...b, ...c, ...a, ...c, ...d]), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, ru, 0, ru, rv, 0, 0, ru, rv, 0, rv]), 2));
  g.computeVertexNormals(); return g;
}
// A louvred panel in the x-y plane, w by h, its foot on y = 0 and centred on x = 0: a frame, the blades (tilted to shed
// the snow), two stiles. Faces +z.
function louvre(w, h, blades, hex = GALV, frame = GALV2) {
  const parts = [box(-w / 2, w / 2, 0, 0.04, -0.02, 0.02, frame), box(-w / 2, w / 2, h - 0.04, h, -0.02, 0.02, frame), box(-w / 2, -w / 2 + 0.04, 0, h, -0.02, 0.02, frame), box(w / 2 - 0.04, w / 2, 0, h, -0.02, 0.02, frame)];
  for (let i = 0; i < blades; i++) { const y = 0.04 + (h - 0.08) * (i + 0.5) / blades, g = new THREE.BoxGeometry(w - 0.08, 0.008, (h - 0.08) / blades * 1.25); g.rotateX(-0.72); g.translate(0, y, 0); parts.push(paint(g, hex)); }
  parts.push(box(-0.012, 0.012, 0.04, h - 0.04, -0.03, -0.012, frame));
  return mergeGeometries(parts);
}
function stencil(lines, fg = 'rgba(232,226,200,.86)') {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const c = cv.getContext('2d');
  c.clearRect(0, 0, 512, 128); c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
  lines.forEach((l, i) => { c.font = `700 ${i ? 30 : 46}px "Arial Black", Arial, sans-serif`; c.fillText(l, 256, lines.length > 1 ? (i ? 96 : 44) : 64, 490); });
  let s = 17; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 70; i++) c.clearRect(r() * 512, r() * 128, 1 + r() * 4, 1 + r() * 3);      // chipped
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// Swept concrete, three metres to the repeat: brushed, speckled, a tooled joint round each bay, a crack, old stains.
function concrete() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d');
  let s = 53; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  c.fillStyle = '#8b9096'; c.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '20,24,30'},${0.03 + r() * 0.07})`; c.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2); }
  for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(255,255,255,${r() * 0.035})`; c.fillRect(0, r() * 256, 256, 1); }                 // the broom
  for (let i = 0; i < 7; i++) { const x = r() * 256, y = r() * 256, q = 14 + r() * 34, g = c.createRadialGradient(x, y, 0, x, y, q); g.addColorStop(0, `rgba(30,32,38,${0.1 + r() * 0.16})`); g.addColorStop(1, 'rgba(30,32,38,0)'); c.fillStyle = g; c.fillRect(x - q, y - q, q * 2, q * 2); }      // stains
  c.strokeStyle = 'rgba(40,44,52,.55)'; c.lineWidth = 1; c.beginPath(); let x = 30, y = 0; c.moveTo(x, y); while (y < 150) { x += (r() - 0.45) * 16; y += 6 + r() * 12; c.lineTo(x, y); } c.stroke();      // a crack
  c.fillStyle = 'rgba(46,50,58,.8)'; c.fillRect(0, 0, 256, 3); c.fillRect(0, 0, 3, 256); c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(0, 3, 256, 1); c.fillRect(3, 0, 1, 256);      // the joint
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

feature({
  id: 'staffvent',

  init(k) {
    const V = this.V = k.plan.staffVent; if (!V) return;
    const g = this.group = new THREE.Group(); g.name = 'staff vent'; k.group.add(g);
    const { H, HOOD } = VENT, { x0, xf, x1, z0, z1, zc, hood, apron, screen, leaf, plates } = V, y = V.y, fl = V.floorAt, hy = fl(hood.x0);
    const mat = selfLit(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.25 }), 0.4);
    const P = [];
    // ---- the hood: a kerb, three sheet sides (the two long ones louvred), a lid with ribs and the snow on it
    const kx0 = hood.x0 - 0.2, kz0 = hood.z0 - 0.08, kz1 = hood.z1 + 0.08;
    P.push(box(kx0, x1, 0, 0.13, kz0, hood.z0 + 0.02, CONC), box(kx0, x1, 0, 0.13, hood.z1 - 0.02, kz1, CONC), box(kx0, hood.x0 - 0.04, 0, 0.13, kz0, kz1, CONC));
    for (const [za, zb] of [[kz0, hood.z0 + 0.02], [hood.z1 - 0.02, kz1]]) P.push(box(x1 - 0.02, x1 + 0.03, 0, 0.13, za, zb, CONC2));              // the kerb's worn ends, at the mouth
    P.push(box(hood.x0 - 0.1, hood.x0 - 0.06, 0.13, HOOD - 0.06, hood.z0, hood.z1, GALV2));                                                    // the back sheet
    for (const zz of [hood.z0 + 0.03, hood.z1 - 0.03]) P.push(box(hood.x0 - 0.1, hood.x0 - 0.05, 0.13, HOOD - 0.06, zz - 0.03, zz + 0.03, DARK));  // its corner posts
    for (const sz of [-1, 1]) {
      const zf = sz < 0 ? hood.z0 : hood.z1, len = x1 - hood.x0 - 0.06, lv = louvre(len, HOOD - 0.06 - 0.13, 7);
      if (sz < 0) lv.rotateY(Math.PI);
      lv.translate(hood.x0 + len / 2, 0.13, zf + sz * 0.02 - sz * 0.07); P.push(lv);
      P.push(box(x1 - 0.06, x1, 0.13, HOOD - 0.06, zf - (sz < 0 ? 0 : 0.1), zf + (sz < 0 ? 0.1 : 0), DARK));                                    // the jamb of the mouth, in heavier angle
      for (const hh of [0.3, 0.62]) P.push(box(x1 - 0.005, x1 + 0.012, hh - 0.045, hh + 0.045, zf - sz * 0.085, zf - sz * 0.045, IRON));           // where the grille's hinges and catches were
    }
    P.push(box(hood.x0 - 0.14, x1 + 0.12, HOOD - 0.06, HOOD, hood.z0 - 0.04, hood.z1 + 0.04, GALV));                                            // the lid, with a drip edge all round
    P.push(box(hood.x0 - 0.14, x1 + 0.12, HOOD - 0.09, HOOD - 0.06, hood.z0 - 0.04, hood.z0 - 0.02, GALV2), box(hood.x0 - 0.14, x1 + 0.12, HOOD - 0.09, HOOD - 0.06, hood.z1 + 0.02, hood.z1 + 0.04, GALV2), box(x1 + 0.1, x1 + 0.12, HOOD - 0.1, HOOD - 0.06, hood.z0 - 0.04, hood.z1 + 0.04, GALV2));
    for (const f of [0.22, 0.5, 0.78]) { const xx = hood.x0 + (x1 - hood.x0) * f; P.push(box(xx - 0.02, xx + 0.02, HOOD, HOOD + 0.022, hood.z0 - 0.03, hood.z1 + 0.03, GALV2)); }
    // snow on the lid (melted off round the middle, where the warm air comes up), and drifted against the back
    P.push(box(hood.x0 - 0.12, hood.x0 + 0.34, HOOD, HOOD + 0.05, hood.z0 - 0.02, hood.z1 + 0.02, SNOW), box(x1 - 0.22, x1 + 0.1, HOOD, HOOD + 0.04, hood.z0 - 0.02, hood.z1 + 0.02, SNOW));
    P.push(lump(hood.x0 + 0.1, HOOD + 0.04, zc - 0.25, 0.22, 0.3, SNOW), lump(hood.x0 + 0.05, HOOD + 0.04, zc + 0.3, 0.18, 0.3, SNOW), lump(x1 - 0.05, HOOD + 0.03, zc + 0.1, 0.16, 0.25, SNOW));
    P.push(lump(hood.x0 - 0.42, 0, zc - 0.25, 0.3, 0.42, BERM), lump(hood.x0 - 0.36, 0, zc + 0.4, 0.24, 0.4, BERM));
    // a lamp under the front of the lid: a small bulkhead fitting in a wire guard
    P.push(box(x1 - 0.02, x1 + 0.07, HOOD - 0.19, HOOD - 0.09, zc - 0.09, zc + 0.09, IRON));
    for (const dz of [-0.06, 0, 0.06]) P.push(box(x1 + 0.07, x1 + 0.078, HOOD - 0.19, HOOD - 0.09, zc + dz - 0.004, zc + dz + 0.004, GALV2));
    // ---- the grille that came off: leant against the south side
    { const lw = leaf.x1 - leaf.x0, lg = louvre(lw, 0.64, 9, GALV, DARK); lg.rotateX(-0.4); lg.translate((leaf.x0 + leaf.x1) / 2, 0.012, leaf.z1 - 0.02); P.push(lg);
      for (const xx of [leaf.x0 + 0.1, leaf.x1 - 0.1]) { const h = new THREE.CylinderGeometry(0.016, 0.016, 0.08, 10); h.rotateZ(Math.PI / 2); h.translate(xx, 0.6, leaf.z0 + 0.03); P.push(paint(h, IRON)); }
      P.push(lump((leaf.x0 + leaf.x1) / 2 - 0.2, 0, leaf.z1 + 0.1, 0.22, 0.22, BERM)); }
    // ---- the cover plates over the duct, across the apron to the wall: their frames, lifting eyes and bolts (the plates themselves are textured, below)
    const np = 3, pw = (plates.x1 - plates.x0) / np;
    for (let i = 0; i <= np; i++) { const xx = plates.x0 + pw * i; P.push(box(xx - 0.025, xx + 0.025, 0.012, 0.03, plates.z0 - 0.03, plates.z1 + 0.03, DARK)); }
    for (const zz of [plates.z0, plates.z1]) P.push(box(plates.x0 - 0.025, plates.x1 + 0.025, 0.012, 0.03, zz - 0.03, zz + 0.03, DARK));
    for (let i = 0; i < np; i++) for (const zz of [plates.z0 + 0.14, plates.z1 - 0.14]) { const e = new THREE.TorusGeometry(0.035, 0.008, 6, 14); e.rotateX(Math.PI / 2); e.translate(plates.x0 + pw * (i + 0.5), 0.034, zz); P.push(paint(e, IRON)); }
    // ---- the screen: steel posts with caps, six boards between, snow along the top
    const SC = VENT.SCREEN, posts = new Set();
    for (const q of screen) {
      const alongZ = q.z1 - q.z0 > q.x1 - q.x0, a = alongZ ? q.z0 : q.x0, b = alongZ ? q.z1 : q.x1, c = alongZ ? (q.x0 + q.x1) / 2 : (q.z0 + q.z1) / 2, n = Math.max(1, Math.round((b - a) / 1.5));
      for (let i = 0; i <= n; i++) {
        const u = a + (b - a) * i / n, px = alongZ ? c : u, pz = alongZ ? u : c, key = Math.round(px * 10) + ',' + Math.round(pz * 10); if (posts.has(key)) continue; posts.add(key);
        P.push(box(px - 0.045, px + 0.045, 0, SC + 0.06, pz - 0.045, pz + 0.045, DARK), box(px - 0.06, px + 0.06, SC + 0.06, SC + 0.085, pz - 0.06, pz + 0.06, IRON), lump(px, SC + 0.085, pz, 0.075, 0.6, SNOW));
      }
      for (let j = 0; j < 6; j++) {
        const yy = 0.14 + j * 0.225, tone = j % 2 ? BOARD : BOARD2;
        P.push(alongZ ? box(c - 0.02, c + 0.02, yy, yy + 0.17, a + 0.03, b - 0.03, tone) : box(a + 0.03, b - 0.03, yy, yy + 0.17, c - 0.02, c + 0.02, tone));
      }
      P.push(alongZ ? box(c - 0.035, c + 0.035, SC - 0.02, SC + 0.03, a + 0.04, b - 0.04, SNOW) : box(a + 0.04, b - 0.04, SC - 0.02, SC + 0.03, c - 0.035, c + 0.035, SNOW));
    }
    // the lamp on the corner post where the two long runs meet: a swan neck and a shade
    const lp = this.lamp = { x: screen[0].x0 + 0.04, z: screen[1].z0 + 0.04, y: 2.45 };
    P.push(box(lp.x - 0.03, lp.x + 0.03, SC, lp.y, lp.z - 0.03, lp.z + 0.03, DARK), box(lp.x - 0.62, lp.x + 0.03, lp.y - 0.03, lp.y + 0.02, lp.z - 0.02 - 0.3, lp.z + 0.02 - 0.3, DARK), box(lp.x - 0.03, lp.x + 0.03, lp.y - 0.03, lp.y + 0.02, lp.z - 0.32, lp.z + 0.03, DARK));
    { const sh = new THREE.CylinderGeometry(0.07, 0.2, 0.13, 18, 1, true); sh.translate(lp.x - 0.6, lp.y - 0.08, lp.z - 0.3); P.push(paint(sh, IRON)); const top = new THREE.CylinderGeometry(0.03, 0.07, 0.04, 14); top.translate(lp.x - 0.6, lp.y, lp.z - 0.3); P.push(paint(top, IRON)); }
    // ---- where it comes out, in the staff entrance: a frame of angle round the hole, and a kick plate in front of it
    P.push(box(x0 - 0.035, x0 + 0.01, y, y + H + 0.05, z0 - 0.05, z0, DARK), box(x0 - 0.035, x0 + 0.01, y, y + H + 0.05, z1, z1 + 0.05, DARK), box(x0 - 0.035, x0 + 0.01, y + H, y + H + 0.05, z0 - 0.05, z1 + 0.05, DARK));
    for (const zz of [z0 - 0.025, z1 + 0.025]) for (const hh of [0.12, H - 0.08]) { const b = new THREE.CylinderGeometry(0.013, 0.013, 0.02, 8); b.rotateZ(Math.PI / 2); b.translate(x0 - 0.04, y + hh, zz); P.push(paint(b, GALV)); }
    // ---- inside: the flanges where the sections of duct meet, and the fittings that light it
    const lights = [];
    for (let xx = x0 + 0.9; xx < hood.x0 - 0.3; xx += 1.1) {
      const f = fl(xx);
      P.push(box(xx - 0.02, xx + 0.02, f, f + H, z0, z0 + 0.025, GALV2), box(xx - 0.02, xx + 0.02, f, f + H, z1 - 0.025, z1, GALV2), box(xx - 0.02, xx + 0.02, f + H - 0.025, f + H, z0, z1, GALV2));
      lights.push({ x: xx + 0.5, y: fl(xx + 0.5) + H - 0.03 });
    }
    const body = new THREE.Mesh(mergeGeometries(P), mat); body.matrixAutoUpdate = false; body.receiveShadow = true; g.add(body);

    // ---- the duct's own sheet (lit by its fittings: drawn as bright as it is, whatever the hour) and its chequer-plate floor
    const sheet = TX.duct(), plate = TX.chequer(), inner = new THREE.MeshBasicMaterial({ map: sheet, color: new THREE.Color(0.44, 0.36, 0.27), side: THREE.DoubleSide }), tread = new THREE.MeshBasicMaterial({ map: plate, color: new THREE.Color(0.5, 0.42, 0.32), side: THREE.DoubleSide });
    const W = [], F = [], L = hood.x0 - x0, rep = Math.round(L / 1.1);
    F.push(quad([x0, y + 0.004, z0], [x1, 0.004, z0], [x1, 0.004, z1], [x0, y + 0.004, z1], 12, 2));
    for (const zz of [z0, z1]) {
      W.push(quad([x0, y, zz], [hood.x0, hy, zz], [hood.x0, hy + H, zz], [x0, y + H, zz], rep, 1));                 // below ground
      W.push(quad([hood.x0, hy, zz], [x1, 0, zz], [x1, HOOD - 0.06, zz], [hood.x0, HOOD - 0.06, zz], 1, 1));        // under the hood (behind its louvres)
    }
    W.push(quad([x0, y + H, z0], [hood.x0, hy + H, z0], [hood.x0, hy + H, z1], [x0, y + H, z1], rep, 1));            // the lid of the duct
    W.push(quad([hood.x0, hy + H - 0.02, z0], [hood.x0, HOOD - 0.06, z0], [hood.x0, HOOD - 0.06, z1], [hood.x0, hy + H - 0.02, z1], 1, 1));      // the back of the hood, inside
    W.push(quad([hood.x0, HOOD - 0.062, z0], [x1, HOOD - 0.062, z0], [x1, HOOD - 0.062, z1], [hood.x0, HOOD - 0.062, z1], 1, 1));                // and the underside of its lid
    const walls = new THREE.Mesh(mergeGeometries(W), inner), floor = new THREE.Mesh(mergeGeometries(F), tread);
    for (const m of [walls, floor]) { m.matrixAutoUpdate = false; g.add(m); }
    // the fittings, and what they throw
    const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.9, 1.05), toneMapped: false }), GL = [];
    for (const q of lights) { const b = new THREE.BoxGeometry(0.3, 0.025, 0.07); b.rotateZ(Math.atan(V.tan)); b.translate(q.x, q.y, zc); GL.push(b); }
    { const b = new THREE.BoxGeometry(0.02, 0.075, 0.14); b.translate(x1 + 0.062, HOOD - 0.14, zc); GL.push(b); }                                  // the bulkhead lamp's lens
    { const b = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12); b.translate(lp.x - 0.6, lp.y - 0.12, lp.z - 0.3); GL.push(b); }                  // the yard lamp's
    g.add(new THREE.Mesh(mergeGeometries(GL), glow));
    const halo = TX.radial(0, 1.2), add = (col, o = {}) => new THREE.MeshBasicMaterial({ map: halo, color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, ...o });
    const flatPool = (x, yy, z, sx, sz, col) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), add(col, { polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); m.position.set(x, yy, z); m.scale.set(sx, 1, sz); m.renderOrder = 3; g.add(m); return m; };
    flatPool(x1 + 0.7, 0.022, zc, 2.8, 2.0, new THREE.Color(0.34, 0.22, 0.09));                   // out of the mouth, onto the apron
    flatPool(x0 - 0.8, y + 0.012, zc, 2.6, 1.9, new THREE.Color(0.34, 0.24, 0.11));               // and out of the foot of it, onto the staff entrance's floor
    flatPool(lp.x - 0.9, 0.024, lp.z - 0.9, 6.5, 6.5, new THREE.Color(0.15, 0.115, 0.065));       // under the yard lamp
    // the warm of it through the louvres: a lit sheet a little way behind each
    for (const zz of [hood.z0 + 0.075, hood.z1 - 0.075]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - hood.x0 - 0.14, HOOD - 0.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 0.56, 0.2), side: THREE.DoubleSide })); m.position.set((hood.x0 + x1) / 2 - 0.03, 0.13 + (HOOD - 0.19) / 2, zz); g.add(m); }
    for (const [x, yy, z, s] of [[x1 + 0.1, HOOD - 0.14, zc, 0.7], [lp.x - 0.6, lp.y - 0.14, lp.z - 0.3, 1.1]]) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: new THREE.Color(0.9, 0.62, 0.3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.position.set(x, yy, z); sp.scale.set(s, s, 1); g.add(sp); }

    // ---- the apron: swept concrete with the snow shovelled to its edges, a yellow box painted before the mouth
    { const ct = concrete(), A = [];
      // (in pieces round the mouth of the duct: nothing is laid over the way down)
      for (const q of carve(apron, [V.hole])) { const pg = new THREE.PlaneGeometry(q.x1 - q.x0, q.z1 - q.z0).rotateX(-Math.PI / 2); pg.translate((q.x0 + q.x1) / 2, 0.011, (q.z0 + q.z1) / 2); const u = pg.attributes.uv, p = pg.attributes.position; for (let i = 0; i < u.count; i++) u.setXY(i, p.getX(i) / 3, p.getZ(i) / 3); A.push(pg); }
      const m = new THREE.Mesh(mergeGeometries(A), new THREE.MeshStandardMaterial({ map: ct, roughness: 0.9, emissive: new THREE.Color(0.2, 0.22, 0.27), emissiveMap: ct, emissiveIntensity: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      m.matrixAutoUpdate = false; m.receiveShadow = true; g.add(m);
      // the snow shovelled off it: a low bank along three sides, of heaps no two the same
      const E = [], R = TX.rng(7);
      const edge = (xa, za, xb, zb, nx, nz) => { const n = Math.ceil(Math.hypot(xb - xa, zb - za) / 0.34); for (let i = 0; i <= n; i++) { const t = i / n, r = 0.2 + R() * R() * 0.5, o = 0.1 + R() * 0.35; const gg = new THREE.SphereGeometry(r, 10, 6); gg.scale(1 + R() * 0.8, 0.22 + R() * 0.2, 1 + R() * 0.5); gg.rotateY(R() * 3); gg.translate(xa + (xb - xa) * t + nx * o, 0, za + (zb - za) * t + nz * o); E.push(paint(gg, BERM)); } };
      edge(apron.x0 + 0.5, apron.z0, apron.x1, apron.z0, 0, -1); edge(apron.x1, apron.z0, apron.x1, apron.z1, 1, 0); edge(apron.x0 + 0.5, apron.z1, apron.x1, apron.z1, 0, 1);
      // the box: KEEP CLEAR, in lines
      const bx0 = x1 + 0.25, bx1 = x1 + 2.6, bz0 = hood.z0 - 0.25, bz1 = hood.z1 + 0.25, t = 0.07, yy = 0.0125;
      for (const [a, b, c, d] of [[bx0, bx1, bz0, bz0 + t], [bx0, bx1, bz1 - t, bz1], [bx0, bx0 + t, bz0, bz1], [bx1 - t, bx1, bz0, bz1]]) E.push(box(a, b, yy, yy + 0.004, c, d, YELLOW));
      for (const sg of [-1, 1]) { const s = new THREE.BoxGeometry(Math.hypot(bx1 - bx0, bz1 - bz0) - 0.1, 0.004, t); s.rotateY(sg * Math.atan2(bz1 - bz0, bx1 - bx0)); s.translate((bx0 + bx1) / 2, yy + 0.002, (bz0 + bz1) / 2); E.push(paint(s, YELLOW)); }      // and a cross corner to corner
      const em = new THREE.Mesh(mergeGeometries(E), mat); em.matrixAutoUpdate = false; g.add(em);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(plates.x1 - plates.x0, plates.z1 - plates.z0).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: (() => { const c = TX.chequer(); c.repeat.set((plates.x1 - plates.x0) / 0.6, (plates.z1 - plates.z0) / 0.6); return c; })(), color: 0xc4c9d0, roughness: 0.5, metalness: 0.3, emissive: 0x3c4048, emissiveIntensity: 1, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
      pm.position.set((plates.x0 + plates.x1) / 2, 0.02, (plates.z0 + plates.z1) / 2); g.add(pm); }
    // ---- lettering: stencilled on the hood's back, and a notice over the hole indoors
    { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.24), new THREE.MeshBasicMaterial({ map: stencil(['AIR INTAKE 3', 'SECURITY LEVEL · KEEP CLEAR']), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      s.position.set(hood.x0 - 0.102, 0.48, zc); s.rotation.y = -Math.PI / 2; g.add(s);
      // and inside, on the sheet facing the mouth, which way it goes
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.23), new THREE.MeshBasicMaterial({ map: stencil(['\u25BC  SECURITY  \u25BC', 'STAFF ENTRANCE BELOW'], 'rgba(34,30,24,.82)'), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      d.position.set(hood.x0 + 0.004, 0.36, zc); d.rotation.y = Math.PI / 2; g.add(d);
      const n = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.31), new THREE.MeshBasicMaterial({ map: TX.notice(['AIR INTAKE 3', 'not an exit', '(nor a way in)'], '#e9e2cc', '#27303a'), color: 0xb8b4a8 }));
      n.position.set(x0 - 0.012, y + H + 0.3, zc); n.rotation.y = -Math.PI / 2; g.add(n); }
    // ---- steam off the hood, into the cold
    this.steam = [];
    const sm = new THREE.SpriteMaterial({ map: TX.radial(0, 0.8), color: new THREE.Color(0.62, 0.66, 0.74), transparent: true, depthWrite: false, opacity: 0 });
    for (let i = 0; i < 6; i++) { const sp = new THREE.Sprite(sm.clone()); sp.visible = false; g.add(sp); this.steam.push({ sp, t: i / 6 }); }
    this.cam = { at: { x: 0, y: 0, z: 0 }, look: { x: 0, y: 0, z: 0 } };
  },

  spots() { const V = this.V; return V ? [{ kind: 'thing', id: 'staffvent', name: 'The staff vent (the way back in from the dumpster)', x: V.x1 + 0.6, y: 0, z: V.zc }] : []; },

  update(dt, k) {
    const V = this.V; if (!V) return;
    const p = k.pos, d2 = (p.x - V.x1) ** 2 + (p.z - V.zc) ** 2;
    // Steam, when anybody is near enough to see it.
    const near = d2 < 70 * 70 && p.y > -1 && p.y < 30, calm = !!k.G.set.reduce;
    for (const s of this.steam) {
      s.sp.visible = near; if (!near) continue;
      s.t = (s.t + dt * (calm ? 0.1 : 0.22)) % 1;
      const u = s.t, w = 0.25 + u * 0.75;
      s.sp.position.set(V.hood.x0 + 0.62 + Math.sin(u * 5 + s.sp.id) * 0.1 * u + u * 0.35, VENT.HOOD + 0.1 + u * 1.5, V.zc + Math.cos(u * 4 + s.sp.id * 2) * 0.12 * u);
      s.sp.scale.set(w, w, 1); s.sp.material.opacity = 0.2 * Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 1.5;
    }
    // In the duct the camera comes in too: behind the toy, on the duct's own line.
    const inX = p.x > V.x0 - 0.25 && p.x < V.x1 + 0.1 && p.z > V.z0 - 0.05 && p.z < V.z1 + 0.05, fy = V.floorAt(p.x);
    if (inX && p.y < fy + VENT.H + 0.15 && p.y > fy - 0.4 && !k.G.held) {
      const v = k.v, down = (Math.abs(v.vel.x) > 0.3 ? v.vel.x : Math.sin(v.yaw)) < 0 ? 1 : -1;      // heading down (west), the camera is up the slope from it
      const cx = Math.max(V.x0 + 0.25, Math.min(V.x1 + 1.6, p.x + down * 1.15)), c = this.cam;
      c.at.x = cx; c.at.y = Math.max(V.floorAt(cx) + 0.4, cx > V.x1 ? 0.5 : -9); c.at.z = V.zc;
      c.look.x = p.x - down * 1.2; c.look.y = V.floorAt(p.x - down * 1.2) + 0.25; c.look.z = V.zc;
      if (down < 0 && cx < V.x0 + 0.3) { c.at.x = V.x0 - 1.2; c.at.y = V.y + 0.7; }               // (setting off up it from the room: looked at from the room)
      k.camClose = c;
    }
  },
});
