// Things the building is known for that are not pictures on a wall: the great stained-glass window
// over the Grand Staircase, a wall of blue glass in a dim room, a marble figure on the stair hall's
// balcony, and the dark walls and herringbone oak of the galleries of Indian and Asian art.
//
// Every bit of glass here is painted by this file, piece by piece: none of it is a copy of
// anybody's window. The blue wall is an abstract of its own; it has no figures and follows no
// real composition.

import * as THREE from 'three';
import { once } from './budget.js';      // (a canvas painted once: on a phone it is let go once it is on the graphics card)
import * as TX from './textures.js';
import { Clay, cast } from './sculpt.js';
import { figure } from './statues.js';

const rngOf = seed => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

// Turn a painted picture into leaded glass: irregular small panes, each one colour, dark lead between.
function lead(src, cell, seed, lw = 1.4) {
  const w = src.width, h = src.height, px = src.getContext('2d').getImageData(0, 0, w, h).data, r = rngOf(seed);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d');
  const nx = Math.ceil(w / cell) + 1, ny = Math.ceil(h / cell) + 1, P = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) P.push([(i + (r() - 0.5) * 0.7) * cell, (j + (r() - 0.5) * 0.7) * cell]);
  c.lineWidth = lw; c.strokeStyle = '#0c0d12'; c.lineJoin = 'round';
  const pane = pts => {
    let mx = 0, my = 0; for (const p of pts) { mx += p[0]; my += p[1]; } mx = Math.max(0, Math.min(w - 1, mx / pts.length | 0)); my = Math.max(0, Math.min(h - 1, my / pts.length | 0));
    const k = (my * w + mx) * 4, f = 0.86 + r() * 0.3;
    c.fillStyle = `rgb(${Math.min(255, px[k] * f) | 0},${Math.min(255, px[k + 1] * f) | 0},${Math.min(255, px[k + 2] * f) | 0})`;
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fill(); c.stroke();
  };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = P[j * (nx + 1) + i], b = P[j * (nx + 1) + i + 1], d = P[(j + 1) * (nx + 1) + i], e = P[(j + 1) * (nx + 1) + i + 1];
    if (r() < 0.5) { pane([a, b, e]); pane([a, e, d]); } else if (r() < 0.6) { pane([a, b, d]); pane([b, e, d]); } else pane([a, b, e, d]);
  }
  return cv;
}

// ------------------------------------------------------------- the window --
// An autumn valley: a fall of water coming down the middle into a bright pool, woods in gold and
// green either side, blue hills behind. Painted here, then cut into glass.
function landscape(W, H) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'), r = rngOf(1893);
  let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3f78c8'); g.addColorStop(0.28, '#9fc6e8'); g.addColorStop(0.42, '#f4efd2'); g.addColorStop(0.6, '#d9d08a'); g.addColorStop(1, '#2f6f9a');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // far hills
  for (const [y, col] of [[0.36, '#5f86c4'], [0.41, '#6f9a9c'], [0.46, '#8fae6a']]) { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 8) c.lineTo(x, H * (y + 0.035 * Math.sin(x * 0.021 + y * 40) + 0.02 * Math.sin(x * 0.05))); c.lineTo(W, H); c.fill(); }
  // the bright middle: sky coming through the gap, and the water
  g = c.createRadialGradient(W / 2, H * 0.4, 4, W / 2, H * 0.42, W * 0.3); g.addColorStop(0, 'rgba(255,253,235,1)'); g.addColorStop(0.5, 'rgba(255,240,170,0.75)'); g.addColorStop(1, 'rgba(255,230,140,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#f6fbff'; c.beginPath(); c.moveTo(W * 0.485, H * 0.4); c.lineTo(W * 0.515, H * 0.4); c.lineTo(W * 0.54, H * 0.6); c.lineTo(W * 0.46, H * 0.6); c.fill();
  g = c.createRadialGradient(W / 2, H * 0.64, 4, W / 2, H * 0.64, W * 0.3); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#cfe6f2'); g.addColorStop(1, 'rgba(110,170,210,0)');
  c.fillStyle = g; c.beginPath(); c.ellipse(W / 2, H * 0.65, W * 0.3, H * 0.06, 0, 0, 7); c.fill();
  // woods: trunks, and leaves in gold, orange and green
  const leaves = ['#e8b326', '#d98a1e', '#f0d24a', '#6f9a34', '#3f7a3a', '#c8641c', '#8fb03e', '#f6e27a'];
  const wood = (x0, x1, dark) => {
    for (let i = 0; i < 6; i++) { const x = W * (x0 + (x1 - x0) * r()); c.fillStyle = dark ? '#2a2a3a' : '#4a3424'; c.fillRect(x, H * 0.2, W * (0.012 + r() * 0.012), H * 0.52); }
    for (let i = 0; i < 150; i++) { const x = W * (x0 + (x1 - x0) * r()), y = H * (0.16 + r() * 0.5); c.fillStyle = dark && r() < 0.45 ? ['#27508c', '#2f6a4a', '#1f3f6a'][i % 3] : leaves[(r() * leaves.length) | 0]; c.beginPath(); c.ellipse(x, y, W * (0.012 + r() * 0.03), H * (0.008 + r() * 0.018), r() * 3, 0, 7); c.fill(); }
  };
  wood(0.0, 0.2, false); wood(0.2, 0.4, false); wood(0.6, 0.8, false); wood(0.8, 1.0, true);
  // banks and rocks below the pool, and the stream going on down in steps
  for (let i = 0; i < 160; i++) { const x = W * r(), y = H * (0.68 + r() * 0.32), mid = Math.abs(x / W - 0.5) < 0.16 + 0.1 * (y / H - 0.68); c.fillStyle = mid ? ['#2f6fc0', '#5fa0d8', '#e8f4fb', '#234f96'][i % 4] : ['#4f8a3a', '#7fae3c', '#d9c040', '#2f5f4a', '#3a5a8a', '#a8c84a'][i % 6]; c.beginPath(); c.ellipse(x, y, W * (0.02 + r() * 0.04), H * (0.008 + r() * 0.02), r() * 3, 0, 7); c.fill(); }
  return cv;
}

// The shapes of the lights, in the window's own unit square (y down): the five lancets, the small
// panels under them, the tracery over them. One function draws them for cutting the stone and for
// keeping the glass.
function lights(c, W, H) {
  const lancet = (x0, x1, y0, y1) => { const m = (x0 + x1) / 2, s = y0 + (x1 - x0) * 0.55; c.moveTo(x0 * W, y1 * H); c.lineTo(x0 * W, s * H); c.quadraticCurveTo(x0 * W, (y0 + 0.012) * H, m * W, y0 * H); c.quadraticCurveTo(x1 * W, (y0 + 0.012) * H, x1 * W, s * H); c.lineTo(x1 * W, y1 * H); c.closePath(); };
  const cols = [[0.075, 0.185], [0.295, 0.405], [0.445, 0.555], [0.595, 0.705], [0.815, 0.925]];
  c.beginPath();
  cols.forEach(([a, b], i) => { lancet(a, b, i === 0 || i === 4 ? 0.33 : 0.32, 0.725); lancet(a + 0.005, b - 0.005, 0.765, 0.935); });
  // tracery: a quatrefoil over each of the middle three, slits above, and paired slits at the sides
  for (const [a, b] of cols.slice(1, 4)) { const m = (a + b) / 2, y = 0.245, q = 0.02; for (const [dx, dy] of [[0, -q], [0, q], [-q * 1.25, 0], [q * 1.25, 0]]) { c.moveTo((m + dx) * W + 0.021 * W, (y + dy) * H); c.ellipse((m + dx) * W, (y + dy) * H, 0.021 * W, 0.016 * H, 0, 0, 7); }
    for (const sx of [-0.028, 0.028]) { lancet(m + sx - 0.02, m + sx + 0.02, 0.085, 0.195); c.rect((m + sx - 0.018) * W, 0.285 * H, 0.036 * W, 0.022 * H); } }
  for (const [a, b] of [cols[0], cols[4]]) { const m = (a + b) / 2; for (const sx of [-0.027, 0.027]) { lancet(m + sx - 0.017, m + sx + 0.017, 0.175, 0.225); lancet(m + sx - 0.017, m + sx + 0.017, 0.245, 0.3); } }
}
// The outline of the whole opening: straight sides and a low pointed arch.
function archPath(c, W, H) { c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * 0.2); c.quadraticCurveTo(W * 0.04, H * 0.045, W * 0.5, 0); c.quadraticCurveTo(W * 0.96, H * 0.045, W, H * 0.2); c.lineTo(W, H); c.closePath(); }

function windowTextures() {
  const W = 720, H = 800, glass = document.createElement('canvas'); glass.width = W; glass.height = H;
  const g = glass.getContext('2d'); g.fillStyle = '#05060a'; archPath(g, W, H); g.fill();
  g.save(); lights(g, W, H); g.clip('evenodd'); g.drawImage(lead(landscape(W, H), 10, 77, 1.1), 0, 0); g.restore();
  const stone = document.createElement('canvas'); stone.width = W; stone.height = H; const s = stone.getContext('2d');
  s.save(); archPath(s, W, H); s.clip();
  s.fillStyle = '#b9bcc0'; s.fillRect(0, 0, W, H);
  // mouldings: a lighter edge round every light, a darker line inside the arch
  s.lineWidth = 9; s.strokeStyle = '#8f949a'; lights(s, W, H); s.stroke(); s.lineWidth = 4; s.strokeStyle = '#d8dadd'; lights(s, W, H); s.stroke();
  s.lineWidth = 10; s.strokeStyle = '#969aa0'; archPath(s, W, H); s.stroke();
  for (const x of [0.24, 0.76]) { s.fillStyle = '#a4a8ae'; s.fillRect(x * W - 9, H * 0.12, 18, H); s.fillStyle = '#cfd2d6'; s.fillRect(x * W - 3, H * 0.12, 6, H); }
  s.fillStyle = '#a4a8ae'; s.fillRect(0, H * 0.735, W, 5); s.fillRect(0, H * 0.95, W, H * 0.05);
  s.globalCompositeOperation = 'destination-out'; lights(s, W, H); s.fill('evenodd');
  s.restore();
  const t = cv => { const x = new THREE.CanvasTexture(once(cv)); x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = 8; return x; };
  return { glass: t(glass), stone: t(stone), still: glass };
}

// ------------------------------------------------------------ the blue wall --
// Deep blue from edge to edge, lighter where it swirls, a few sparks of red, yellow and green,
// leading that wanders across it in long curves, and the iron bars that hold the panels.
function blueBay(W, H, seed) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'), r = rngOf(seed);
  c.fillStyle = '#0b2aa8'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { c.fillStyle = ['#1238c8', '#0a1f86', '#2f6fe0', '#1a4fd6', '#07165e', '#5a9af0'][(r() * 6) | 0]; c.globalAlpha = 0.5 + r() * 0.4; c.beginPath(); c.ellipse(r() * W, r() * H, W * (0.04 + r() * 0.16), H * (0.05 + r() * 0.2), r() * 3, 0, 7); c.fill(); }
  for (let i = 0; i < 5; i++) { c.globalAlpha = 0.75; c.strokeStyle = ['#7fb4f6', '#cfe2fb', '#3f86ea'][i % 3]; c.lineWidth = 10 + r() * 26; c.beginPath(); c.arc(r() * W, r() * H, W * (0.15 + r() * 0.3), r() * 6, r() * 6 + 1.6); c.stroke(); }
  c.globalAlpha = 1;
  for (let i = 0; i < 9; i++) { c.fillStyle = ['#d8261c', '#f0c81e', '#3fae3a', '#f39a1c', '#fff6c8'][(r() * 5) | 0]; const x = r() * W, y = r() * H, a = r() * 3; c.beginPath(); if (i % 3) c.ellipse(x, y, W * (0.012 + r() * 0.03), W * (0.012 + r() * 0.03), a, 0, 7); else { c.moveTo(x, y); c.lineTo(x + W * 0.07 * Math.cos(a), y + W * 0.07 * Math.sin(a)); c.lineTo(x + W * 0.05 * Math.cos(a + 1.3), y + W * 0.05 * Math.sin(a + 1.3)); } c.fill(); }
  const out = lead(cv, 26, seed + 5, 1.6), o = out.getContext('2d');
  o.strokeStyle = '#06070c'; o.lineWidth = 2.2;
  for (let i = 0; i < 16; i++) { o.beginPath(); o.arc(r() * W, r() * H, W * (0.1 + r() * 0.5), r() * 6, r() * 6 + 0.9 + r()); o.stroke(); }
  return out;
}

// ----------------------------------------------------------- herringbone ---
function herringbone() {
  // Boards four times as long as they are wide, each butting the side of the next. With the boards
  // square to the canvas the bond repeats every eight board-widths both ways, so the tile is seamless.
  const B = 32, L = 4 * B, S = 8 * B, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'), r = rngOf(41);
  c.fillStyle = '#5a3d1f'; c.fillRect(0, 0, S, S);
  const board = (x, y, vert, t) => {
    const w = vert ? B : L, h = vert ? L : B;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      const X = x + ox, Y = y + oy; if (X > S || Y > S || X + w < 0 || Y + h < 0) continue;
      c.fillStyle = `rgb(${172 * t | 0},${122 * t | 0},${68 * t | 0})`; c.fillRect(X + 0.8, Y + 0.8, w - 1.6, h - 1.6);
      c.fillStyle = 'rgba(70,42,16,0.22)'; for (let i = 1; i < 4; i++) vert ? c.fillRect(X + i * B / 4, Y + 2, 1, h - 4) : c.fillRect(X + 2, Y + i * B / 4, w - 4, 1);
    }
  };
  for (let n = 0; n < 8; n++) { const x = ((n % 8) + 8) % 8 * B, y = n * B; board(x, y, false, 0.84 + r() * 0.28); board(x + L, y - 3 * B, true, 0.84 + r() * 0.28); }
  const t = new THREE.CanvasTexture(once(cv)); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

// ------------------------------------------------------------------ build --
export function buildSetPieces(museum, plan) {
  const group = new THREE.Group(), O = plan.obstacles, out = { group, looks: [], built: [] };
  museum.group.add(group);
  const fix = m => { m.matrixAutoUpdate = false; m.updateMatrix(); group.add(m); return m; };
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xc9c5bc, roughness: 0.85, emissive: 0x5e5a52, emissiveIntensity: 0.5 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf1efe9, roughness: 0.55, emissive: 0x77746c, emissiveIntensity: 0.6 });
  const pool = (x, y, z, w, d, col) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = 3; return fix(m); };

  // 1. The window over the Grand Staircase: on the north wall, above the gallery that runs along it.
  const hall = plan.byId.G200;
  if (hall) {
    const deck = plan.decks.filter(d => d.room === hall.id && Math.abs(d.z0 - hall.z0) < 0.1 && d.x1 - d.x0 > 10).sort((a, b) => b.y - a.y)[0];
    const fy = deck ? deck.y : hall.y, W = 6.4, top = Math.min(hall.y + hall.h - 0.35, fy + 6.9), y0 = fy + 0.75, H = top - y0, cx = deck ? (deck.x0 + deck.x1) / 2 - 2.2 : (hall.x0 + hall.x1) / 2, z = hall.z0 + 0.05;
    if (H > 3.5) {
      const T = windowTextures();
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: T.glass, alphaTest: 0.5, color: new THREE.Color(1.15, 1.12, 1.05) })); glass.position.set(cx, y0 + H / 2, z); fix(glass);
      const frame = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: T.stone, alphaTest: 0.5, roughness: 0.9, emissiveMap: T.stone, emissive: new THREE.Color(0.42, 0.44, 0.5), emissiveIntensity: 0.6 })); frame.position.set(cx, y0 + H / 2, z + 0.06); fix(frame);
      // the sill it stands on, and its light on the floor of the gallery under it
      const sill = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.16, 0.28), stoneMat); sill.position.set(cx, y0 - 0.08, z + 0.14); fix(sill);
      pool(cx, fy + 0.03, hall.z0 + 1.5, W + 2.5, 3.2, new THREE.Color(0.55, 0.46, 0.2));
      pool(cx - 1.4, fy + 0.035, hall.z0 + 1.2, 2.4, 2.0, new THREE.Color(0.1, 0.3, 0.5)); pool(cx + 1.5, fy + 0.035, hall.z0 + 1.3, 2.4, 2.0, new THREE.Color(0.45, 0.22, 0.05));
      const art = { setpiece: 'window', room: null, x: cx, y: y0 + H / 2, z: z + 0.08, fy, nx: 0, nz: 1, rot: 0, w: W, h: H, seen: true, wakeAt: 0, focus: false,
        zone: v => v.pos.y > hall.y - 0.5 && v.pos.x > hall.x0 && v.pos.x < hall.x1 && v.pos.z > hall.z0 + 1.2 && v.pos.z < hall.z1 && Math.hypot(v.pos.x - cx, v.pos.z - z) < 15 && Math.cos(v.yaw) < -0.55,
        work: { id: 0, t: 'The stair window', a: 'Made for this game, in the manner of American leaded glass', d: 'about 1917, in spirit', m: 'Painted piece by piece: several hundred small panes and their leading.', g: 'The Grand Staircase', c: '',
          alt: 'A tall stone window of five lancets under a pointed arch. An autumn valley in glass: woods in gold and green, blue hills, and a waterfall coming down the middle into a pool so bright it is almost white.',
          note: 'Not a work in the collection, and not a copy of one: an original picture, drawn for the stair hall.', url: '' } };
      out.looks.push(art); out.window = art; out.built.push('window');
    }

    // 3. A marble figure on the balcony, between two columns, looking down the stairs.
    const west = plan.decks.filter(d => d.room === hall.id && Math.abs(d.x0 - hall.x0) < 0.1 && d.z1 - d.z0 > 10).sort((a, b) => b.y - a.y)[0];
    if (west) {
      const x = west.x1 - 0.85, zc = (hall.z0 + hall.z1) / 2, y = west.y, g = new THREE.Group(), put = (geo, px, py, pz, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1, mat = white) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.rotation.set(rx, 0, rz); m.scale.set(sx, sy, sz); g.add(m); return m; };
      const cyl = (a, b, h) => new THREE.CylinderGeometry(a, b, h, 14), ball = new THREE.SphereGeometry(1, 16, 12);
      put(new THREE.BoxGeometry(0.86, 0.16, 0.86), 0, 0.08, 0, 0, 0, 1, 1, 1, stoneMat); put(new THREE.BoxGeometry(0.7, 0.86, 0.7), 0, 0.59, 0, 0, 0, 1, 1, 1, stoneMat); put(new THREE.BoxGeometry(0.82, 0.1, 0.82), 0, 1.07, 0, 0, 0, 1, 1, 1, stoneMat);
      const B = 1.12;                                    // the top of the plinth
      // The figure itself, modelled in clay like the bronzes outdoors (sculpt.js) and cast in white marble: a draped woman in
      // contrapposto, weight on one leg, the other knee forward, one arm lifting a lamp, the other gathering her cloth, her
      // head turned down towards the stairs.
      { const c = new Clay([-0.7, -0.06, -0.55], [0.7, 2.25, 0.6], 0.022);
        const J = { pelvis: [0.02, 0.98, 0], chest: [-0.02, 1.36, 0.02], head: [0.0, 1.71, 0.07],
          lS: [-0.19, 1.47, 0.02], lE: [-0.33, 1.62, 0.12], lH: [-0.3, 1.94, 0.16],              // the lamp arm, raised
          rS: [0.17, 1.45, 0.0], rE: [0.25, 1.17, 0.04], rH: [0.16, 0.95, 0.17],                 // the other across the hip, holding the cloth
          lK: [-0.09, 0.52, 0.04], lF: [-0.1, 0.06, 0.0], rK: [0.13, 0.55, 0.16], rF: [0.16, 0.07, -0.06] };
        figure(c, J, { female: true, skirt: true, s: 1.0 });
        c.blob([0.0, 1.8, 0.0], [0.105, 0.075, 0.115], { k: 0.03 }); c.blob([0.0, 1.76, -0.11], [0.06, 0.06, 0.055], { k: 0.03 });      // hair bound up in a knot
        c.limb([-0.3, 1.96, 0.16], [-0.3, 2.06, 0.17], 0.03, 0.05, { k: 0.02 }); c.blob([-0.3, 2.1, 0.17], [0.05, 0.035, 0.05], { k: 0.02 }); c.blob([-0.3, 2.16, 0.17], [0.022, 0.05, 0.022], { k: 0.02 });      // the lamp, and its flame
        c.limb([-0.17, 1.46, -0.06], [0.2, 1.05, -0.1], 0.04, 0.06, { k: 0.05 }); c.limb([0.2, 1.05, -0.1], [0.24, 0.2, -0.16], 0.07, 0.1, { k: 0.06 });      // a mantle falling from the shoulder down her back
        for (let i = 0; i < 4; i++) c.limb([0.14 + i * 0.03, 0.95 - i * 0.02, 0.15], [0.2 + i * 0.03, 0.12, 0.08 - i * 0.06], 0.022, 0.034, { k: 0.025 });      // the gathered cloth hanging from her hand
        c.blob([0, 0.03, 0], [0.34, 0.06, 0.3], { k: 0.04 });                                         // the rock she stands on
        const m = new THREE.Mesh(c.mesh({ hi: 0xffffff, lo: 0x8f8b86, snow: 0, sun: [0.45, 0.7, 0.55], reach: 0.16 }), cast({ roughness: 0.42, metalness: 0, emissiveIntensity: 0.5 }));
        m.position.set(0, B, 0); g.add(m); }
      g.position.set(x, y, zc); g.rotation.y = Math.PI / 2; g.updateMatrixWorld(true); group.add(g);
      O.push({ x0: x - 0.45, x1: x + 0.45, z0: zc - 0.45, z1: zc + 0.45, y0: y, y1: y + 3.2 });
      // the columns either side of it, carrying a beam
      const ch = Math.min(4.6, hall.y + hall.h - y - 0.6);
      for (const sg of [-1, 1]) { const z = zc + sg * 1.35;
        const sh = new THREE.Mesh(cyl(0.2, 0.23, ch - 0.5), stoneMat); sh.position.set(x, y + 0.2 + (ch - 0.5) / 2, z); fix(sh);
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.6), stoneMat); base.position.set(x, y + 0.1, z); fix(base);
        const cap = new THREE.Mesh(cyl(0.34, 0.2, 0.3), stoneMat); cap.position.set(x, y + ch - 0.15, z); fix(cap);
        O.push({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3, y0: y, y1: y + ch }); }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 3.5), stoneMat); beam.position.set(x, y + ch + 0.18, zc); fix(beam);
      out.statue = { x, y, z: zc }; out.built.push('statue');
    }
  }

  // 2. The blue wall: three bays of glass, lit from behind, on the east wall of a room made dim for it.
  const br = plan.byId.G143, bs = br && museum.rooms[br.id];
  if (br && bs) {
    const door = plan.doors.filter(d => (d.a === br.id || d.b === br.id) && Math.abs(d.x0 - br.x1) < 0.6 && Math.abs(d.y - br.y) < 0.1)[0], d0 = door ? door.z0 : (br.z0 + br.z1) / 2, d1 = door ? door.z1 : d0;
    const x = br.x1 - 0.1, y0 = br.y + 0.5, H = Math.min(2.7, br.h - 1.3), bays = [];
    const north = d0 - 0.9 - (br.z0 + 0.5), south = (br.z1 - 0.5) - (d1 + 0.9);
    if (north > 5) { const w = (north - 0.5) / 2; bays.push([br.z0 + 0.5, br.z0 + 0.5 + w], [br.z0 + 1.0 + w, d0 - 0.9]); } else if (north > 2) bays.push([br.z0 + 0.5, d0 - 0.9]);
    if (south > 2) bays.push([d1 + 0.9, br.z1 - 0.5]);
    const dark = new THREE.MeshStandardMaterial({ color: 0x17181c, roughness: 0.6, emissive: 0x060608, emissiveIntensity: 0.5 });
    bays.forEach(([a, b], i) => {
      const w = b - a, tex = new THREE.CanvasTexture(once(blueBay(Math.round(160 * w), Math.round(160 * H), 300 + i * 17))); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, H), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.25, 1.25, 1.35) })); m.position.set(x - 0.06, y0 + H / 2, (a + b) / 2); m.rotation.y = -Math.PI / 2; fix(m);
      // the iron armature: bars across, and uprights
      const bars = (n, vert) => { for (let k = 0; k <= n; k++) { const t = k / n, bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, vert ? H : 0.05, vert ? 0.05 : w), dark); bar.position.set(x - 0.09, vert ? y0 + H / 2 : y0 + t * H, vert ? a + t * w : (a + b) / 2); fix(bar); } };
      bars(3, false); bars(Math.max(2, Math.round(w / 1.5)), true);
      // white piers either side, a dark plinth under, a white head over
      for (const z of [a - 0.25, b + 0.25]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.33, H + 0.75, 0.5), white); p.position.set(x - 0.075, br.y + (H + 0.75) / 2, z); fix(p); }      // (a centimetre off the wall: their backs lay in the skirting's plane)
      const pl = new THREE.Mesh(new THREE.BoxGeometry(0.69, 0.5, w + 0.02), dark); pl.position.set(x - 0.255, br.y + 0.25, (a + b) / 2); fix(pl);
      const hd = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, w + 1), white); hd.position.set(x - 0.07, y0 + H + 0.15, (a + b) / 2); fix(hd);
      O.push({ x0: x - 0.62, x1: br.x1, z0: a - 0.5, z1: b + 0.5, y0: br.y, y1: br.y + 0.55 });
      pool(x - 1.9, br.y + 0.03, (a + b) / 2, 3.6, w + 1.5, new THREE.Color(0.08, 0.16, 0.6));
      out.looks.push({ setpiece: 'blue', room: null, x: x - 0.1, y: y0 + H / 2, z: (a + b) / 2, fy: br.y, nx: -1, nz: 0, rot: -Math.PI / 2, w, h: H, seen: true, wakeAt: 0, focus: false,
        zone: v => Math.abs(v.pos.y - br.y) < 1 && v.pos.x > br.x1 - 4.6 && v.pos.x < br.x1 - 0.6 && v.pos.z > a - 0.6 && v.pos.z < b + 0.6 && Math.sin(v.yaw) > 0.5,
        work: { id: 0, t: 'Blue wall', a: 'Made for this game', d: 'bay ' + (i + 1) + ' of ' + bays.length, m: 'Glass drawn piece by piece and lit from behind.', g: 'Gallery 143', c: '',
          alt: 'A wall of deep blue glass in a dim room, lighter where the blue swirls, with small sparks of red, yellow and green and dark leading wandering across it.',
          note: 'An abstract of its own. The museum has a famous wall of blue windows near here; those are in copyright and are not shown or copied.', url: '' } });
    });
    // the room goes dim round it: dark walls, and no more wall-glow than a corridor
    bs.wallMat.color.set(0x24262d); bs.wallMat.emissive.set(0x14182a);
    out.blue = { room: br.id, bays: bays.length }; out.built.push('blue');
  }

  // 4. Indian and Asian art: charcoal walls and a herringbone oak floor, laid over the stone.
  const oak = herringbone(), finished = [];
  for (const id of ['G140', 'G141', 'G142', 'G130', 'G131', 'G132', 'G133', 'G134', 'G135']) {
    const r = plan.byId[id], s = museum.rooms[id]; if (!r || !s || r.kind !== 'gallery') continue;
    if (plan.wells.some(k => Math.abs(k.y - r.y) < 0.02 && k.x0 < r.x1 && k.x1 > r.x0 && k.z0 < r.z1 && k.z1 > r.z0)) continue;      // a stair comes up through this floor: leave it be
    const w = r.x1 - r.x0, d = r.z1 - r.z0, t = oak.clone(); t.needsUpdate = true; t.repeat.set(w / 1.3, d / 1.3);
    const fm = new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, emissiveMap: t, emissive: new THREE.Color(1, 0.86, 0.7), emissiveIntensity: 0.02, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), fm); f.rotation.x = -Math.PI / 2; f.position.set((r.x0 + r.x1) / 2, r.y + 0.006, (r.z0 + r.z1) / 2); fix(f);
    if (!s.floorMat) s.floorMat = fm;                    // so that it wakes with the room
    if (/^G14/.test(id)) { s.wallMat.color.set(0x34363c); s.wallMat.emissive.set(0x3a3a40); }
    finished.push(id);
  }
  out.finished = finished;

  /** Is the toy in front of one of these, and pointed at it? Hands back the piece, for a closer look. */
  out.near = v => { for (const a of out.looks) if (a.zone(v)) return a; return null; };
  return out;
}
