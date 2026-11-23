// The mouse nests, and the way they lead to what is under the museum.
//
// Each of the five mice (src/mice.js) goes home through a little grille low on a wall (plan.js addNests puts it there,
// cuts the plaster, and makes the run behind it something to be in). Follow a mouse home and its grille can be opened:
// pull up to it and E swings it open on its hinge. Behind it, inside the wall (or, on the lower level, in the earth) a
// short run goes to the nest: shredded paper and fluff, all of it glowing faintly green, and among it what the mice
// have carried off from below, things that are not from anywhere near here: a cracked crystal still lit from inside,
// a shard of some alloy, a chip off a circuit, a smear of goo. That is what has made them glow.
//
// And in each nest one thing to read, a step on the way to the saucer: three chewed pages of a TOP SECRET file, a
// photograph of something under a tarp, and a key ring with a little saucer on it and the key to the Director's desk.
// In the desk (in the Director's office, the room with the whiteboard that names the picture: src/secret.js) the last
// of it. Each one points loosely at the next. What has been opened and read, and the key, are kept between visits
// ('after-hours.nests'); a new game forgets them (fresh()). The mice themselves stay found.
//
// Drawn cheaply: every nest's run and its contents are one or two merged meshes with the light baked into their
// colours (a green glow from the nest, nothing lit for real), built the first time the toy comes near and shown only
// while it is near. The grilles are always there, and few.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature } from './features.js';
import { Geo } from './geo.js';
import { mice } from './mice.js';
import * as TX from './textures.js';

const KEY = 'after-hours.nests';
const OPEN = -1.9;                    // the grille swung open, back against the wall (radians about its hinge)
const NEAR = 16;                      // how near the toy must be before a nest is drawn
const GREEN = new THREE.Color(0.32, 1, 0.42);

// What is in each nest to read, in the order they lead on. `say` is what is said when it is read: where to go next.
const CLUES = {
  north: { kind: 'file', title: 'PROJECT GREEN CHEESE · p.1', lines: ['Recovered craft held at', 'SUB-LEVEL 9.', 'Crystals leaking. Rodents ####'], say: 'Page one of a chewed-up file. The mouse in the south galleries has more of it.' },
  south: { kind: 'file', title: 'PROJECT GREEN CHEESE · p.2', lines: ['The mice glow now.', 'They steal shiny things.', 'Samples sent to the Rice ######'], say: 'The mice carry it all off. One of them lives over in the Rice building.' },
  rice: { kind: 'photo', title: 'A photograph', lines: ['Sub-level 9. The night', 'it came in.  — D.'], say: 'Something round, under a tarp. D for the Director? The Modern Wing mouse has been hoarding too.' },
  modern: { kind: 'file', title: 'PROJECT GREEN CHEESE · p.3', lines: ['Only the Director goes down.', 'The way is written up in ####', 'Spare desk key: LOST.'], say: 'A lost key. The mouse on the lower level keeps the shiniest things.' },
  lower: { kind: 'key', title: 'DIRECTOR · DESK', lines: ['A tiny silver saucer on a key ring,', 'warm to the touch.'], say: 'The key to the Director’s desk. Upstairs, back of house: the Director’s office.' },
};
const DESK = { kind: 'folder', title: 'PROJECT GREEN CHEESE · ACCESS', lines: ['The way down is behind a painting.', 'My whiteboard says which one,', 'and what to touch.  — D.'], say: 'The whiteboard, here in this office.' };

// ---------------------------------------------------------------- the cards
// What is read, drawn for the card on screen: a chewed typed page, a photograph, the key ring, the Director's folder.
function card(c) {
  const W = 520, H = c.kind === 'photo' ? 600 : 560, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const rnd = (() => { let s = 7 + c.title.length * 13; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
  const type = (y, text, size = 26, colour = '#1e2226', x = 46) => {
    g.font = `${size}px "Courier New", Courier, monospace`; g.fillStyle = colour; g.textBaseline = 'alphabetic';
    // '#' is blacked out
    let cx = x; for (const part of text.split(/(#+)/)) { if (!part) continue; const w = g.measureText(part).width; if (part[0] === '#') { g.fillStyle = '#101214'; g.fillRect(cx, y - size * 0.8, w, size * 0.98); g.fillStyle = colour; } else g.fillText(part, cx, y); cx += w; }
  };
  const bites = (edge) => {      // chewed: little round bites out of an edge
    g.save(); g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 14; i++) { const t = rnd(), r = 8 + rnd() * 22; let x, y; if (edge === 'r') { x = W - 10 + rnd() * 8; y = 40 + t * (H - 80); } else { x = 40 + t * (W - 80); y = H - 10 + rnd() * 8; } g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(W - 20 - rnd() * 60, H - 20 - rnd() * 60, 24 + rnd() * 30, 0, 7); g.fill(); }     // the corner, mostly gone
    g.restore();
  };
  const paw = (x, y, s, a = 0.55) => { g.save(); g.translate(x, y); g.fillStyle = `rgba(110,255,140,${a})`; g.shadowColor = '#6eff8c'; g.shadowBlur = 10; g.beginPath(); g.ellipse(0, 6 * s, 7 * s, 6 * s, 0, 0, 7); g.fill(); for (const [px, py] of [[-9, -6], [-3, -11], [4, -11], [10, -6]]) { g.beginPath(); g.ellipse(px * s, py * s, 3 * s, 4 * s, 0, 0, 7); g.fill(); } g.restore(); };
  if (c.kind === 'file' || c.kind === 'folder') {
    if (c.kind === 'folder') { g.fillStyle = '#c9a55a'; g.fillRect(10, 30, W - 20, H - 40); g.fillStyle = '#b8924a'; g.fillRect(10, 30, 170, 26); g.fillStyle = '#d7b76c'; g.fillRect(10, 56, W - 20, H - 66); }
    const x0 = c.kind === 'folder' ? 44 : 14, y0 = c.kind === 'folder' ? 84 : 14;
    g.fillStyle = '#f1ede0'; g.fillRect(x0, y0, W - x0 * 2 + (c.kind === 'folder' ? 0 : 0), H - y0 - 14);
    g.fillStyle = 'rgba(120,100,60,.08)'; for (let i = 0; i < 40; i++) g.fillRect(x0 + rnd() * (W - 2 * x0), y0 + rnd() * (H - y0), 2 + rnd() * 30, 1);
    // the stamp
    g.save(); g.translate(W * 0.62, y0 + 70); g.rotate(-0.16); g.strokeStyle = 'rgba(190,30,30,.85)'; g.lineWidth = 5; g.strokeRect(-150, -34, 300, 64); g.fillStyle = 'rgba(190,30,30,.85)'; g.font = 'bold 42px "Courier New", monospace'; g.textAlign = 'center'; g.fillText('TOP SECRET', 0, 14); g.restore();
    type(y0 + 160, c.title, 24, '#30343a', x0 + 32);
    g.fillStyle = '#30343a'; g.fillRect(x0 + 32, y0 + 172, W - 2 * x0 - 64, 2);
    let fs = 27; g.font = `${fs}px "Courier New", Courier, monospace`; const room = W - 2 * x0 - (c.kind === 'file' ? 110 : 70);      // as big as will fit (the chewed edge takes some)
    while (fs > 16 && Math.max(...c.lines.map(l => g.measureText(l).width)) > room) { fs--; g.font = `${fs}px "Courier New", Courier, monospace`; }
    c.lines.forEach((l, i) => type(y0 + 226 + i * (fs + 18), l, fs, '#1e2226', x0 + 32));
    type(H - 60, 'DO NOT REMOVE FROM SUB-LEVEL 9', 16, '#7a2020', x0 + 32);
    if (c.kind === 'folder') { g.fillStyle = '#9fa6ad'; g.fillRect(W - 120, y0 - 26, 18, 70); g.fillStyle = 'rgba(110,255,140,.9)'; g.fillRect(W - 116, y0 - 22, 10, 62); }
    else { bites('r'); bites('b'); paw(W * 0.3, H * 0.84, 1.4); paw(W * 0.42, H * 0.78, 1.4, 0.4); }
  } else if (c.kind === 'photo') {
    g.fillStyle = '#f4f2ec'; g.fillRect(18, 18, W - 36, H - 36);
    const px = 46, py = 46, pw = W - 92, ph = pw * 0.92;
    const bg = g.createLinearGradient(0, py, 0, py + ph); bg.addColorStop(0, '#0b0f12'); bg.addColorStop(1, '#1a2226'); g.fillStyle = bg; g.fillRect(px, py, pw, ph);
    // the tarp over something round, green light coming from under its hem
    const cx = px + pw / 2, base = py + ph * 0.78;
    const glow = g.createRadialGradient(cx, base, 10, cx, base, pw * 0.55); glow.addColorStop(0, 'rgba(120,255,150,.75)'); glow.addColorStop(1, 'rgba(120,255,150,0)'); g.fillStyle = glow; g.fillRect(px, py, pw, ph);
    g.fillStyle = '#5c6266'; g.beginPath(); g.moveTo(cx - pw * 0.42, base); g.quadraticCurveTo(cx - pw * 0.3, base - ph * 0.42, cx, base - ph * 0.46); g.quadraticCurveTo(cx + pw * 0.3, base - ph * 0.42, cx + pw * 0.42, base); g.closePath(); g.fill();
    g.strokeStyle = '#3c4246'; g.lineWidth = 3; for (const f of [-0.25, -0.08, 0.12, 0.27]) { g.beginPath(); g.moveTo(cx + pw * f * 0.5, base - ph * 0.44); g.quadraticCurveTo(cx + pw * f, base - ph * 0.2, cx + pw * f * 1.3, base); g.stroke(); }
    g.fillStyle = '#2a3034'; g.fillRect(px, base, pw, py + ph - base);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(px + pw * 0.8, py + ph * 0.2, 30, 0, 7); g.fill();       // the flash, in a pane of glass
    g.font = '30px "Marker Felt", "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive'; g.fillStyle = '#23304f';
    c.lines.forEach((l, i) => g.fillText(l, 52, py + ph + 52 + i * 36));
    bites('b'); paw(W * 0.78, H * 0.88, 1.2);
  } else {
    // the key ring, on a scrap of card the mice had it on
    g.fillStyle = '#20262a'; g.fillRect(0, 0, W, H);
    const v = g.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H * 0.4, W * 0.6); v.addColorStop(0, 'rgba(90,255,130,.28)'); v.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    const sx = W * 0.32, sy = H * 0.36;
    g.fillStyle = '#c9ced6'; g.beginPath(); g.ellipse(sx, sy, 110, 30, 0, 0, 7); g.fill();          // the saucer
    g.fillStyle = '#8fd6ff'; g.beginPath(); g.ellipse(sx, sy - 18, 44, 30, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#7dff9a'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(sx - 84 + i * 28, sy + 6, 5, 0, 7); g.fill(); }
    g.strokeStyle = '#d8dde2'; g.lineWidth = 7; g.beginPath(); g.arc(W * 0.56, H * 0.28, 34, 0, 7); g.stroke();      // the ring
    g.beginPath(); g.moveTo(sx + 96, sy - 10); g.lineTo(W * 0.53, H * 0.32); g.stroke();
    g.fillStyle = '#c99a3a'; g.beginPath(); g.arc(W * 0.6, H * 0.4, 26, 0, 7); g.fill(); g.fillStyle = '#20262a'; g.beginPath(); g.arc(W * 0.6, H * 0.4, 9, 0, 7); g.fill();     // the key
    g.fillStyle = '#c99a3a'; g.fillRect(W * 0.6 - 7, H * 0.4 + 20, 14, 130); for (const [y, w] of [[H * 0.4 + 112, 26], [H * 0.4 + 132, 20]]) g.fillRect(W * 0.6 + 6, y, w, 12);
    g.fillStyle = '#efe6cf'; g.save(); g.translate(W * 0.76, H * 0.52); g.rotate(0.22); g.fillRect(-70, -26, 140, 52); g.fillStyle = '#1d3a2c'; g.font = 'bold 22px "Courier New", monospace'; g.textAlign = 'center'; g.fillText(c.title, 0, 8); g.restore();      // the tag
    g.font = '25px "Courier New", monospace'; g.fillStyle = '#e8efe6'; c.lines.forEach((l, i) => g.fillText(l, 40, H - 92 + i * 34));
  }
  return cv;
}

// ---------------------------------------------------------------- geometry helpers
// Plain non-indexed geometry with a colour on every vertex, ready to merge.
// The run's surfaces, painted once and shared by every nest.
const _nt = {};
function nestTex(kind) {
  if (_nt[kind]) return _nt[kind];
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d');
  let s = 17 + kind.length * 31; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  if (kind === 'boards') {
    for (let i = 0; i < 4; i++) { c.fillStyle = `hsl(${28 + r() * 8}, ${28 + r() * 10}%, ${34 + r() * 10}%)`; c.fillRect(0, i * 64, 256, 64); c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, i * 64, 256, 3);
      for (let k = 0; k < 14; k++) { c.strokeStyle = r() < 0.5 ? 'rgba(40,22,10,.25)' : 'rgba(200,160,110,.15)'; c.lineWidth = 1 + r(); c.beginPath(); const yy = i * 64 + 6 + r() * 54; c.moveTo(0, yy); c.bezierCurveTo(80, yy + (r() - 0.5) * 8, 170, yy + (r() - 0.5) * 8, 256, yy + (r() - 0.5) * 6); c.stroke(); }
      const jx = r() * 256; c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(jx, i * 64, 3, 64); c.fillStyle = 'rgba(30,20,10,.8)'; for (const dx of [10, -10]) { c.beginPath(); c.arc(jx + dx, i * 64 + 32, 2.2, 0, 7); c.fill(); } }
    for (let k = 0; k < 900; k++) { c.fillStyle = `rgba(${r() < 0.5 ? '220,210,190' : '20,14,8'},${0.04 + r() * 0.06})`; c.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2); }      // dust
  } else if (kind === 'brick') {
    c.fillStyle = '#8a8070'; c.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 8; row++) for (let col = -1; col < 4; col++) { const x = col * 64 + (row % 2) * 32 + 3, yy = row * 32 + 3; c.fillStyle = `hsl(${8 + r() * 12}, ${40 + r() * 15}%, ${28 + r() * 12}%)`; c.fillRect(x, yy, 58, 26); c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(x, yy + 20, 58, 6); }
    for (let k = 0; k < 600; k++) { c.fillStyle = `rgba(${r() < 0.5 ? '230,220,200' : '0,0,0'},${0.05 + r() * 0.08})`; c.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 2); }
  } else if (kind === 'lath') {
    c.fillStyle = '#2a2018'; c.fillRect(0, 0, 256, 256);
    for (let yy = 0; yy < 256; yy += 21) { c.fillStyle = `hsl(${30 + r() * 8}, ${30 + r() * 10}%, ${40 + r() * 12}%)`; c.fillRect(0, yy + 2, 256, 14); c.fillStyle = 'rgba(230,224,206,.55)'; for (let k = 0; k < 5; k++) c.fillRect(r() * 256, yy + 15, 10 + r() * 30, 4 + r() * 4); }      // laths, and plaster keys squeezed between
  } else {
    c.fillStyle = '#e8b0ae'; c.fillRect(0, 0, 256, 256);
    for (let k = 0; k < 2600; k++) { const a = r() * 6.3, l = 4 + r() * 14, x = r() * 256, yy = r() * 256; c.strokeStyle = r() < 0.5 ? 'rgba(255,230,220,.35)' : 'rgba(160,80,80,.25)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, yy); c.lineTo(x + Math.cos(a) * l, yy + Math.sin(a) * l); c.stroke(); }
    for (let x = 0; x < 256; x += 128) { c.fillStyle = 'rgba(90,60,40,.35)'; c.fillRect(x, 0, 6, 256); }      // the seams between batts
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return (_nt[kind] = t);
}

function prep(g, hex) {
  g = g.index ? g.toNonIndexed() : g; if (g.attributes.uv) g.deleteAttribute('uv');
  if (hex != null) { const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
  return g;
}
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3();
function placed(g, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) { M4.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), S.set(sx, sy, sz)); g.applyMatrix4(M4); return g; }

feature({
  id: 'nests',
  secrets: [['nests', 'The mouse nests'], ['deskkey', 'The Director’s desk']],

  init(k) {
    this.k = k; this.t = 0; this.list = []; this.cardAt = null;
    this.load();
    const P = k.plan;
    const bare = this.bare = new THREE.MeshStandardMaterial({ color: 0xc3c9cf, emissive: 0x4a525c, emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.4 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x7c848c, roughness: 0.45, metalness: 0.6, emissive: 0x2c3138, emissiveIntensity: 0.7 });
    this.glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    this.bakedMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    // The run's own surfaces, painted (the baked light is in their vertex colours, the texture over it): old boards
    // underfoot, joists overhead, brick and lath at the back and sides, pink insulation between the joists.
    const tm = map => new THREE.MeshBasicMaterial({ vertexColors: true, map, side: THREE.DoubleSide });
    this.surf = { boards: tm(nestTex('boards')), brick: tm(nestTex('brick')), lath: tm(nestTex('lath')), fluff: tm(nestTex('fluff')) };
    this.rim = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 1.6, 0.55), toneMapped: false });
    const radial = TX.radial(0, 1.2);
    this.poolMat = new THREE.MeshBasicMaterial({ map: radial, color: GREEN.clone().multiplyScalar(0.55), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    this.glintMat = new THREE.SpriteMaterial({ map: radial, color: GREEN, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    for (const n of P.nests || []) {
      const v = { n, clue: CLUES[n.wing], ang: 0, want: 0, inner: null, shown: false, rattle: 0 };
      v.L = n.horiz ? [1, 0] : [0, 1]; v.O = n.horiz ? [0, n.sg] : [n.sg, 0];
      // ---- the grille, in its frame: sheet aluminium like the other vents, louvres, two hinges
      const g = v.group = new THREE.Group(); g.name = n.id; k.group.add(g);
      const frame = new Geo(), { VW, VH } = n;
      const box = (geo, l0, l1, h0, h1, d0, d1) => { const [ax, az] = this.W(n, l0, d0), [bx, bz] = this.W(n, l1, d1); geo.box(Math.min(ax, bx), Math.max(ax, bx), n.y + h0, n.y + h1, Math.min(az, bz), Math.max(az, bz)); };
      box(frame, -VW / 2 - 0.05, VW / 2 + 0.05, VH, VH + 0.05, -0.025, 0.02); box(frame, -VW / 2 - 0.05, -VW / 2, 0, VH, -0.025, 0.02); box(frame, VW / 2, VW / 2 + 0.05, 0, VH, -0.025, 0.02);
      g.add(frame.mesh(bare));
      // the leaf, built about its hinge: x across the opening, z out into the room
      const leaf = new Geo(), lw = VW - 0.01, lh = VH - 0.01;
      leaf.box(0, lw, 0, 0.035, -0.012, 0.012); leaf.box(0, lw, lh - 0.035, lh, -0.012, 0.012); leaf.box(0, 0.035, 0, lh, -0.012, 0.012); leaf.box(lw - 0.035, lw, 0, lh, -0.012, 0.012);
      const louvres = new THREE.Group();
      for (let y = 0.075; y < lh - 0.05; y += 0.062) { const s = new THREE.Mesh(new THREE.BoxGeometry(lw - 0.06, 0.01, 0.04), steel); s.position.set(lw / 2, y, 0); s.rotation.x = 0.7; louvres.add(s); }
      const pivot = v.pivot = new THREE.Group(), th = Math.atan2(n.nx, n.nz), lx = [Math.cos(th), -Math.sin(th)], s = Math.sign(lx[0] * v.L[0] + lx[1] * v.L[1]) || 1;
      const [hx, hz] = this.W(n, -s * VW / 2 + s * 0.005, -0.004);
      pivot.position.set(hx, n.y + 0.005, hz); pivot.rotation.y = th; v.th = th;
      pivot.add(leaf.mesh(bare), louvres); g.add(pivot);
      for (const hy of [0.1, VH - 0.1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.07, 8), bare); h.position.set(0, hy, 0.012); pivot.add(h); }
      // the green coming through the slats from behind, and a little on the floor before it
      const glow = v.glow = new THREE.Mesh(new THREE.PlaneGeometry(VW, VH), new THREE.MeshBasicMaterial({ map: radial, color: GREEN.clone().multiplyScalar(0.9), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      { const [gx, gz] = this.W(n, 0, 0.12); glow.position.set(gx, n.y + VH / 2, gz); glow.rotation.y = th; } g.add(glow);
      const pool = v.pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), this.poolMat.clone());
      { const [px, pz] = this.W(n, 0, -0.35); pool.position.set(px, n.y + 0.006, pz); pool.scale.set(1.4, 1, 1.4); pool.renderOrder = 2; } g.add(pool);
      // once a mouse has been seen going in: a lit rim round the frame
      const rim = new Geo(); box(rim, -VW / 2 - 0.07, VW / 2 + 0.07, VH + 0.05, VH + 0.075, -0.03, -0.02); box(rim, -VW / 2 - 0.075, -VW / 2 - 0.05, 0, VH + 0.07, -0.03, -0.02); box(rim, VW / 2 + 0.05, VW / 2 + 0.075, 0, VH + 0.07, -0.03, -0.02);
      v.rimMesh = rim.mesh(this.rim); v.rimMesh.visible = false; g.add(v.rimMesh);
      if (this.state.open[n.wing]) { v.ang = v.want = OPEN; n.gate.off = true; }
      this._hinge(v);
      this.list.push(v);
    }
    // the card on screen
    const el = this.cardEl = document.createElement('div'); el.id = 'nestCard';
    el.style.cssText = 'position:fixed;left:50%;top:44%;transform:translate(-50%,-50%) rotate(1.5deg);width:min(70vmin,340px);pointer-events:none;opacity:0;transition:opacity .25s;z-index:30;filter:drop-shadow(0 10px 24px rgba(0,0,0,.55))';
    document.body.appendChild(el);
    this.marks = [];
  },
  // A point of nest n: `lat` along its wall, `dep` out through the wall from the room's face of it. [x, z]
  W(n, lat, dep) { return n.horiz ? [n.u + lat, n.at + n.sg * dep] : [n.at + n.sg * dep, n.u + lat]; },

  load() {
    let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { s = null; }
    this.state = { open: {}, read: {}, key: false, desk: false, folder: false, ...(s || {}) };
  },
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch { /* a private window: it lasts the visit */ } },
  _hinge(v) { v.pivot.rotation.y = v.th + v.ang; },

  // ---------------------------------------------------------------- inside: the run and the nest, built when first near
  _build(v) {
    const n = v.n, k = this.k, { a, D, l0, l1, CH, VW, VH } = n, y = n.y, G = new THREE.Group(); G.name = n.id + '-inside';
    const rnd = (() => { let s = 99 + n.wing.length * 7 + Math.round(n.u * 10); return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
    const P = (lat, dep, h) => { const [x, z] = this.W(n, lat, dep); return [x, y + h, z]; };
    const nrm = (lat, dep, h) => { const [ox, oz] = v.O, [lx, lz] = v.L; return [lat * lx + dep * ox, h, lat * lz + dep * oz]; };
    // where the nest is, along the wall and out from it
    const bl = (n.back.x - n.vent.x) * v.L[0] + (n.back.z - n.vent.z) * v.L[1], bd = (n.back.x - n.vent.x) * v.O[0] + (n.back.z - n.vent.z) * v.O[1];
    v.nestLat = bl; v.nestDep = bd;
    // ---- the shell: brick and lath inside the wall, dusty boards underfoot; tiled small so the baked glow falls off smoothly
    const shell = new Geo(); shell.col = [1, 1, 1];
    const S = { boards: new Geo(), brick: new Geo(), lath: new Geo(), fluff: new Geo() }; for (const q of Object.values(S)) q.col = [1, 1, 1];
    const tone = (hex, j = 0.12) => { const c = new THREE.Color(hex), f = 1 - j / 2 + rnd() * j; return [c.r * f, c.g * f, c.b * f]; };
    // A flat panel from corner A along to B and up to D (all [lat, dep, h]), split into tiles of about su by sv; onto the
    // surface `geo` (a painted one: its texture laid at `ts` metres to a repeat), or plain.
    const panel = (A, B, C, Dd, nr, hex, su = 0.2, sv = 0.1, geo = shell, ts = 0.5) => {
      const lu = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), lv = Math.hypot(Dd[0] - A[0], Dd[1] - A[1], Dd[2] - A[2]);
      const nu = Math.max(1, Math.round(lu / su)), nv = Math.max(1, Math.round(lv / sv));
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const at = (u, w) => [0, 1, 2].map(q => A[q] + (B[q] - A[q]) * u + (Dd[q] - A[q]) * w);
        const p = [at(i / nu, j / nv), at((i + 1) / nu, j / nv), at((i + 1) / nu, (j + 1) / nv), at(i / nu, (j + 1) / nv)].map(q => P(...q));
        const U = k => k / nu * lu / ts, W2 = k => k / nv * lv / ts;
        geo.col = tone(hex, geo === shell ? 0.12 : 0.06); geo.quad(p[0], p[1], p[2], p[3], nr, [[U(i), W2(j)], [U(i + 1), W2(j)], [U(i + 1), W2(j + 1)], [U(i), W2(j + 1)]]);
      }
    };
    const e = 0.004, d0 = a + e, d1 = a + D - e, L0 = -l0 + e, L1 = l1 - e, top = CH - e;
    panel([L0, d0, e], [L1, d0, e], null, [L0, d1, e], nrm(0, 0, 1), 0xb8a890, 0.2, 0.2, S.boards, 0.6);          // floor: old boards
    panel([L0, d0, top - 0.07], [L1, d0, top - 0.07], null, [L0, d1, top - 0.07], nrm(0, 0, -1), 0xe0b4b0, 0.2, 0.2, S.fluff, 0.45);      // insulation between the joists
    panel([L0, d1, 0], [L1, d1, 0], null, [L0, d1, CH], nrm(0, -1, 0), 0xc8a08c, 0.2, 0.1, S.brick, 0.5);          // the back: brick
    panel([L0, d0, 0], [L0, d1, 0], null, [L0, d0, CH], nrm(1, 0, 0), 0xc0a488, 0.2, 0.1, S.lath, 0.4); panel([L1, d0, 0], [L1, d1, 0], null, [L1, d0, CH], nrm(-1, 0, 0), 0xc0a488, 0.2, 0.1, S.lath, 0.4);      // the ends: lath, the plaster gone
    // the joists over it all, across the run every 40 cm, and a stud up each end
    const woodBox = (la, lb, da, db, h0, h1, hex) => { const [ax, az] = this.W(n, la, da), [bx, bz] = this.W(n, lb, db), q = new THREE.BoxGeometry(Math.abs(bx - ax), h1 - h0, Math.abs(bz - az)); q.translate((ax + bx) / 2, y + (h0 + h1) / 2, (az + bz) / 2); const c = new THREE.Color(hex), cc = new Float32Array(q.attributes.position.count * 3); for (let i = 0; i < cc.length; i += 3) { cc[i] = c.r; cc[i + 1] = c.g; cc[i + 2] = c.b; } q.setAttribute('color', new THREE.BufferAttribute(cc, 3)); woods.push(q.toNonIndexed()); };
    const woods = [];
    for (let la = L0 + 0.12; la < L1 - 0.05; la += 0.4) woodBox(la - 0.025, la + 0.025, d0, d1, top - 0.1, top, 0x9a7a58);
    for (const la of [L0 + 0.03, L1 - 0.03]) woodBox(la - 0.025, la + 0.025, d1 - 0.07, d1 - 0.005, 0, top - 0.1, 0x8a6a4a);
    // the room side, round the way in
    const hh = a ? VH + 0.1 : VH;
    panel([L0, d0, 0], [-VW / 2, d0, 0], null, [L0, d0, CH], nrm(0, 1, 0), 0x5a4a40); panel([VW / 2, d0, 0], [L1, d0, 0], null, [VW / 2, d0, CH], nrm(0, 1, 0), 0x5a4a40);
    panel([-VW / 2, d0, hh], [VW / 2, d0, hh], null, [-VW / 2, d0, CH], nrm(0, 1, 0), 0x5a4a40);
    if (a) {     // the duct through: galvanised, two sides, a floor and a top
      panel([-VW / 2 + e, 0, 0], [-VW / 2 + e, a, 0], null, [-VW / 2 + e, 0, hh], nrm(1, 0, 0), 0x8a9096, 0.25, 0.25); panel([VW / 2 - e, 0, 0], [VW / 2 - e, a, 0], null, [VW / 2 - e, 0, hh], nrm(-1, 0, 0), 0x8a9096, 0.25, 0.25);
      panel([-VW / 2, 0, e], [VW / 2, 0, e], null, [-VW / 2, a, e], nrm(0, 0, 1), 0x7a8086, 0.25, 0.25); panel([-VW / 2, 0, hh], [VW / 2, 0, hh], null, [-VW / 2, a, hh], nrm(0, 0, -1), 0x6a7076, 0.25, 0.25);
    }
    const parts = [prep(shell.build())];
    const glow = [];
    // ---- the nest: a low mound of shredded paper and fluff
    const NX = bl, ND = bd, R = Math.min(0.36, D / 2 - 0.08);
    const at = (lat, dep, h) => P(lat, dep, h);
    { // a lumpy mound of insulation, chewed paper and fluff, a hollow in the top of it where they sleep
      const m = new THREE.SphereGeometry(1, 28, 9, 0, Math.PI * 2, 0, Math.PI / 2), mp = m.attributes.position;
      for (let i = 0; i < mp.count; i++) { const px = mp.getX(i), py = mp.getY(i), pz = mp.getZ(i), an = Math.atan2(pz, px), k = 1 + 0.13 * Math.sin(an * 5 + 1.3) * Math.cos(an * 3) + 0.07 * Math.sin(an * 11 + py * 6), hollow = py > 0.75 ? 0.5 : 1; mp.setXYZ(i, px * k, py * hollow, pz * k); }
      const g2 = prep(m), cs = g2.attributes.position.count, col = new Float32Array(cs * 3), PAL = [0xe2a4a8, 0xd89a9e, 0xd8d0bc, 0xbab2a0, 0xe8c8b0, 0x9a8c78];
      for (let i = 0; i < cs; i += 3) { const c = new THREE.Color(PAL[Math.floor(rnd() * PAL.length)]); for (let q = 0; q < 3; q++) col.set([c.r, c.g, c.b], (i + q) * 3); }
      g2.setAttribute('color', new THREE.BufferAttribute(col, 3)); g2.computeVertexNormals();
      const [x, yy, z] = at(NX, ND, 0); parts.push(placed(g2, x, yy, z, 0, rnd() * 6, 0, R, 0.13, R * 0.9));
      const rim = new THREE.TorusGeometry(0.7, 0.2, 6, 22); rim.rotateX(Math.PI / 2); const [rx, ry, rz] = at(NX, ND, 0.1); parts.push(placed(prep(rim, 0xd8a0a4), rx, ry, rz, 0, 0, 0, R, 0.25, R * 0.85));
      const cup = new THREE.CircleGeometry(0.62, 16); cup.rotateX(-Math.PI / 2); parts.push(placed(prep(cup, 0x5a4a3c), rx, ry + 0.012, rz, 0, 0, 0, R, 1, R * 0.85));
      // a torn-off strip of batt dragged in, and a crumb of cheese they have not got round to
      for (let i = 0; i < 5; i++) { const [bx, by, bz] = at(NX + (rnd() - 0.5) * 0.6, ND - R * 0.9 - 0.08 + (rnd() - 0.5) * 0.12, 0.02); parts.push(placed(prep(new THREE.IcosahedronGeometry(1, 1), i % 2 ? 0xe0a2a6 : 0xeab8b8), bx, by, bz, rnd(), rnd(), rnd(), 0.07, 0.025, 0.05)); }
    }
    const PAPER = [0xe9e5d8, 0xdcd3b4, 0xcaa96c, 0xb9b5a8, 0xf2f0ea, 0xa8323a, 0xd8d0b8];
    for (let i = 0; i < 120; i++) {
      const r = Math.sqrt(rnd()) * R * 1.15, an = rnd() * Math.PI * 2, lat = NX + Math.cos(an) * r, dep = ND + Math.sin(an) * r * 0.85, h = 0.1 * Math.sqrt(Math.max(0, 1 - (r / R) ** 2)) + 0.004 + rnd() * 0.02;
      const [x, yy, z] = at(lat, dep, h), len = 0.05 + rnd() * 0.11;
      parts.push(placed(prep(new THREE.BoxGeometry(len, 0.003, 0.012 + rnd() * 0.01), PAPER[Math.floor(rnd() * PAPER.length)]), x, yy, z, (rnd() - 0.5) * 1.2, rnd() * 6.3, (rnd() - 0.5) * 0.8));
    }
    for (let i = 0; i < 26; i++) {      // fluff
      const r = Math.sqrt(rnd()) * R * 1.05, an = rnd() * 6.3, [x, yy, z] = at(NX + Math.cos(an) * r, ND + Math.sin(an) * r * 0.85, 0.03 + rnd() * 0.07), s = 0.018 + rnd() * 0.03;
      parts.push(placed(prep(new THREE.IcosahedronGeometry(1, 1), rnd() < 0.5 ? 0xc9c6bc : 0xa9b4a2), x, yy, z, rnd(), rnd(), rnd(), s, s * 0.7, s));
    }
    // ---- what they have hoarded: not from round here
    const side = (t, lat, dep) => at(NX + Math.cos(t) * lat, ND + Math.sin(t) * dep, 0);
    { // the crystal, cracked, lit from inside, and its splinters
      const [x, yy, z] = side(0.6, R + 0.08, R * 0.7);
      glow.push(placed(prep(new THREE.OctahedronGeometry(0.05, 0), 0x6dff9a), x, yy + 0.07, z, 0.3, 0.4, 0.25, 0.75, 2.2, 0.75));
      glow.push(placed(prep(new THREE.OctahedronGeometry(0.03, 0), 0xa6ffc4), x + 0.05, yy + 0.04, z - 0.03, -0.5, 1, 0.6, 0.7, 1.9, 0.7));
      glow.push(placed(prep(new THREE.OctahedronGeometry(0.022, 0), 0x50e07a), x - 0.04, yy + 0.03, z + 0.04, 0.9, 0.2, -0.7, 0.7, 2, 0.7));
      for (let i = 0; i < 8; i++) glow.push(placed(prep(new THREE.TetrahedronGeometry(0.008 + rnd() * 0.008), 0x7dffa8), x + (rnd() - 0.5) * 0.2, yy + 0.004, z + (rnd() - 0.5) * 0.2, rnd() * 3, rnd() * 3, 0));
    }
    { // a shard of some alloy, faintly iridescent
      const [x, yy, z] = side(2.3, R + 0.06, R * 0.75);
      parts.push(placed(prep(new THREE.TetrahedronGeometry(0.06), 0xc8c0ee), x, yy + 0.02, z, 0.4, 1.1, 1.2, 1.6, 0.35, 0.7));
      glow.push(placed(prep(new THREE.BoxGeometry(0.09, 0.002, 0.004), 0xd8b0ff), x, yy + 0.034, z, 0, 0.6, 0.2));
    }
    { // a chip off a circuit: green board, lit traces
      const [x, yy, z] = side(3.6, R * 0.6, R * 0.5);
      parts.push(placed(prep(new THREE.BoxGeometry(0.09, 0.005, 0.06), 0x1a3a24), x, yy + 0.1, z, 0.25, 0.7, 0.1));
      for (let i = 0; i < 5; i++) glow.push(placed(prep(new THREE.BoxGeometry(0.07 - i * 0.008, 0.002, 0.003), i % 2 ? 0x7af0ff : 0x9dff8a), x, yy + 0.106 + 0.0, z - 0.02 + i * 0.01, 0.25, 0.7, 0.1));
    }
    { // goo: smears of it
      // (each an irregular puddle, not a disc, lit only by the nest; a few bright beads in it are what glows)
      for (const [t, rr, s] of [[4.6, R + 0.12, 0.07], [5.4, R * 0.95, 0.05], [1.4, R * 0.3, 0.045], [3.1, R + 0.18, 0.04]]) {
        const [x, yy, z] = side(t, rr, rr * 0.8), q = new THREE.SphereGeometry(1, 18, 6, 0, Math.PI * 2, 0, Math.PI / 2), qp = q.attributes.position, ph = rnd() * 6;
        for (let i = 0; i < qp.count; i++) { const a = Math.atan2(qp.getZ(i), qp.getX(i)), k = 1 + 0.28 * Math.sin(a * 3 + ph) + 0.14 * Math.sin(a * 5 + ph * 2); qp.setXYZ(i, qp.getX(i) * k, qp.getY(i), qp.getZ(i) * k); }
        parts.push(placed(prep(q, 0x2f9a50), x, yy + 0.002, z, 0, rnd() * 3, 0, s, s * 0.12, s * 0.8));
        for (let b = 0; b < 3; b++) glow.push(placed(prep(new THREE.SphereGeometry(0.006 + rnd() * 0.005, 8, 5), 0x8dffb0), x + (rnd() - 0.5) * s, yy + 0.006, z + (rnd() - 0.5) * s * 0.7)); }
    }
    // ---- the light, baked in: green from the nest, falling off; a little from the room through the way in
    const [gx, gy, gz] = at(NX, ND, 0.18), [vx, vy, vz] = at(0, -0.1, 0.25);
    // (green from the nest, but only a tint over what things are: wood stays wood, paper stays paper)
    const bake = geo => { const pos = geo.attributes.position, col = geo.attributes.color; for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i), dn = Math.hypot(px - gx, py - gy, pz - gz), dv = Math.hypot(px - vx, py - vy, pz - vz);
      const gl = Math.exp(-dn / 0.75), lv = 0.35 * Math.exp(-dv / 0.6), f = 0.2 + 0.8 * gl + lv;
      col.setXYZ(i, col.getX(i) * f * (1 - 0.25 * gl) + 0.03 * gl, col.getY(i) * f + 0.14 * gl, col.getZ(i) * f * (1 - 0.2 * gl) + 0.04 * gl);
    } return geo; };
    const solid = bake(mergeGeometries(parts));
    G.add(new THREE.Mesh(solid, this.bakedMat));
    for (const [k2, geo] of Object.entries(S)) if (!geo.empty) G.add(new THREE.Mesh(bake(geo.build()), this.surf[k2]));
    if (woods.length) G.add(new THREE.Mesh(bake(mergeGeometries(woods)), this.surf.boards));
    const gm = mergeGeometries(glow); { const c = gm.attributes.color; for (let i = 0; i < c.count; i++) c.setXYZ(i, c.getX(i) * 1.7, c.getY(i) * 1.7, c.getZ(i) * 1.7); }
    G.add(new THREE.Mesh(gm, this.glowMat));
    // a soft pool of green on the floor round the nest, breathing
    const pool = v.inPool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), this.poolMat.clone());
    { const [x, yy, z] = at(NX, ND, 0.008); pool.position.set(x, yy, z); pool.scale.set(1.5, 1, 1.5); pool.renderOrder = 2; } G.add(pool);
    // ---- the thing to read, between the nest and the way in, with a glint on it
    const iLat = NX - Math.sign(NX || 1) * Math.min(Math.abs(NX) * 0.6, R + 0.32), iDep = a + D / 2, [ix, iy, iz] = at(iLat, iDep, 0);
    v.item = { x: ix, y: iy, z: iz, mesh: this._item(v.clue, ix, iy, iz, rnd) };
    { // the cheese: a wedge of something yellow with holes in it, beside the page and well clear of its words
      const sh = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.075, -0.024), new THREE.Vector2(0.075, 0.024)]);
      const wg = new THREE.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: false }); wg.rotateX(-Math.PI / 2);
      const bits = [prep(wg, 0xf2c24a)];
      for (const [hx, hz, hr] of [[0.04, 0.008, 0.008], [0.058, -0.01, 0.006], [0.025, -0.004, 0.005]]) bits.push(prep(new THREE.SphereGeometry(hr, 8, 5).translate(hx, 0.036, -hz), 0xa8801c));
      const [cx, cy, cz] = at(iLat + Math.sign(NX || 1) * 0.2, iDep - D * 0.28, 0);
      G.add(new THREE.Mesh(bake(placed(mergeGeometries(bits), cx, cy + 0.001, cz, 0, rnd() * 6.3, 0)), this.bakedMat));
    }
    const glint = v.glint = new THREE.Sprite(this.glintMat.clone()); glint.position.set(ix, iy + 0.06, iz); glint.scale.setScalar(0.22); v.item.mesh.add(glint);
    G.add(v.item.mesh); v.item.mesh.visible = !this.state.read[n.wing];
    // where the camera stands inside: the end of the run away from the nest, up under the joists
    const cl = NX > 0 ? -l0 + 0.14 : l1 - 0.14, [cx, cy, cz] = at(cl, a + D * 0.68, CH - 0.12);
    v.cam = { x: cx, y: cy, z: cz };
    G.visible = false; k.group.add(G); v.inner = G;
  },
  // The thing to read, lying on the floor: pages, a photograph, or the key ring.
  _item(c, x, y, z, rnd) {
    const g = new THREE.Group(); g.position.set(x, y, z);
    if (c.kind === 'key') {
      const metal = new THREE.MeshStandardMaterial({ color: 0xd0d6de, metalness: 0.8, roughness: 0.3, emissive: 0x3a4a44, emissiveIntensity: 0.8 });
      const brass = new THREE.MeshStandardMaterial({ color: 0xd2a043, metalness: 0.8, roughness: 0.35, emissive: 0x4a3410, emissiveIntensity: 0.9 });
      const saucer = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 6), metal); saucer.scale.set(1, 0.28, 1); saucer.position.set(-0.03, 0.01, 0); g.add(saucer);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 1.7, 0.7), toneMapped: false })); dome.position.set(-0.03, 0.016, 0); g.add(dome);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0025, 6, 16), metal); ring.rotation.x = Math.PI / 2; ring.position.set(0.01, 0.003, 0); g.add(ring);
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.004, 6, 14), brass); bow.rotation.x = Math.PI / 2; bow.position.set(0.035, 0.004, 0); g.add(bow);
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.004, 0.008), brass); shaft.position.set(0.07, 0.004, 0); g.add(shaft);
      const bit = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.012), brass); bit.position.set(0.088, 0.004, 0.008); g.add(bit);
      g.rotation.y = rnd() * 6.3; g.scale.setScalar(1.6);
      return g;
    }
    const tex = new THREE.CanvasTexture(card(c)); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, color: new THREE.Color(0.75, 0.82, 0.75), side: THREE.DoubleSide });
    const w = 0.16, h = c.kind === 'photo' ? w * 600 / 520 : w * 560 / 520;
    const page = (dx, dz, ry, lift) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.rotation.set(-Math.PI / 2 + lift, 0, ry, 'YXZ'); m.rotation.order = 'XYZ'; m.position.set(dx, 0.006 + lift * 0.02, dz); g.add(m); return m; };
    page(0, 0, rnd() * 6.3, 0.05); if (c.kind === 'file') page(0.03, 0.025, rnd() * 6.3, 0.02);
    return g;
  },

  // ---------------------------------------------------------------- the Director's desk
  _desk() {
    if (this.desk !== undefined) return this.desk;
    this.desk = null;
    const k = this.k, P = k.plan, B = k.G.boards, b = B && B.list ? B.list.find(q => q.id === 'clue') : null;
    const rid = b ? (typeof b.room === 'string' ? b.room : b.room && b.room.id) : null;
    const r = (rid && P.byId[rid]) || P.rooms.find(q => /^Director's office$/i.test(q.gallery || ''));
    const d = r && r.desk; if (!d) return null;
    // The desk was set down with its back at one edge of this footprint, facing (fx, fz): the top is the first 0.8 m of it,
    // the chair beyond. A drawer across the middle, under the top, on the chair's side.
    const cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2, depth = Math.abs(d.fx) > 0.5 ? d.x1 - d.x0 : d.z1 - d.z0, bx = cx - d.fx * depth / 2, bz = cz - d.fz * depth / 2;
    const front = { x: bx + d.fx * 0.8, z: bz + d.fz * 0.8 }, y = r.y;
    const G = new THREE.Group(); G.position.set(front.x, y, front.z); G.rotation.y = Math.atan2(d.fx, d.fz);      // local z: out from the front of the drawer
    const wood = new THREE.MeshStandardMaterial({ color: 0x4a2c1a, roughness: 0.6, emissive: 0x24140a, emissiveIntensity: 0.6 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xd2a043, metalness: 0.8, roughness: 0.35, emissive: 0x4a3410, emissiveIntensity: 0.7 });
    const drawer = new THREE.Group(); G.add(drawer);
    const geo = new Geo(); geo.box(-0.3, 0.3, 0.6, 0.62, -0.42, 0); geo.box(-0.3, -0.285, 0.6, 0.69, -0.42, 0); geo.box(0.285, 0.3, 0.6, 0.69, -0.42, 0); geo.box(-0.3, 0.3, 0.6, 0.69, -0.43, -0.415);
    geo.box(-0.31, 0.31, 0.595, 0.7, -0.012, 0.012);      // its front
    drawer.add(geo.mesh(wood));
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.012), brass); pull.position.set(0, 0.66, 0.02); drawer.add(pull);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.008, 10), new THREE.MeshBasicMaterial({ color: 0x0a0806 })); hole.position.set(0, 0.632, 0.0125); drawer.add(hole);
    const plate = new THREE.Mesh(new THREE.CircleGeometry(0.014, 12), brass); plate.position.set(0, 0.632, 0.0122); drawer.add(plate); hole.position.z = 0.0128;
    // the folder in it, a green clip on it
    const tex = new THREE.CanvasTexture(card(DESK)); tex.colorSpace = THREE.SRGBColorSpace;
    const folder = new THREE.Mesh(new THREE.PlaneGeometry(0.34 * 520 / 560, 0.34), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.85, 0.85, 0.8) }));
    folder.rotation.x = -Math.PI / 2; folder.position.set(0, 0.625, -0.22); drawer.add(folder);
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.006, 0.07), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 1.7, 0.7), toneMapped: false })); clip.position.set(0.14, 0.63, -0.36); drawer.add(clip);
    this.k.group.add(G);
    this.desk = { room: r, G, drawer, out: 0, want: 0, at: { x: front.x + d.fx * 0.25, y, z: front.z + d.fz * 0.25 }, fx: d.fx, fz: d.fz, c: { x: cx, y, z: cz } };
    if (this.state.desk) { this.desk.out = this.desk.want = 1; drawer.position.z = 0.32; }
    return this.desk;
  },

  // ---------------------------------------------------------------- the card
  _show(c, at) {
    this.cardEl.innerHTML = '';
    if (c) { const cv = card(c); cv.style.cssText = 'width:100%;height:auto;display:block'; this.cardEl.appendChild(cv); }
    this.cardEl.style.opacity = c ? '1' : '0'; this.showing = c || null; this.cardAt = c ? { x: at.x, z: at.z, t: this.t } : null;
  },

  // ---------------------------------------------------------------- doing things
  _inside(v, p) {
    const n = v.n, q = n.cham, d = n.duct;
    const inR = (r, m = 0) => r && p.x > r.x0 - m && p.x < r.x1 + m && p.z > r.z0 - m && p.z < r.z1 + m;
    if (Math.abs(p.y - n.y) > 0.9) return false;
    if (inR(q) || inR(d)) return true;
    // in the mouth, past the plane of the wall
    const dep = (p.x - n.vent.x) * v.O[0] + (p.z - n.vent.z) * v.O[1];
    return inR(n.mouth) && dep > 0.02;
  },
  _open(v) {
    const k = this.k;
    v.want = OPEN; this.state.open[v.n.wing] = true; this.save();
    k.synth.note(520, 0.08, { type: 'square', vol: 0.025 }); k.synth.noise(0.25, { vol: 0.04, lp: 2500, at: 0.04 }); k.synth.note(330, 0.3, { type: 'triangle', vol: 0.03, at: 0.12 });
    k.once('nest-open', 'Squeeze in. Something glows in there.', 4);
  },
  _read(v) {
    const k = this.k, n = v.n, c = v.clue;
    if (this.showing === c) { this._show(null); return; }
    this._show(c, k.pos);
    if (this.state.read[n.wing]) return;
    this.state.read[n.wing] = true; if (c.kind === 'key') this.state.key = true; this.save();
    if (v.item) v.item.mesh.visible = false;
    k.synth.chime([1175, 1568, 2349], { vol: 0.045, gap: 0.1, dur: 1 });
    const got = this.list.filter(q => this.state.read[q.n.wing]).length;
    if (c.kind === 'key') k.callout('THE DIRECTOR’S DESK KEY');
    else k.callout(`NEST ${got} / ${this.list.length}`);
    k.say(c.say, 6);
    if (got >= this.list.length && k.find('nests')) k.say('Every nest found. Whatever is under the museum, the mice have been into it.', 6);
    this._marks();
  },
  _openDesk() {
    const k = this.k, D = this.desk;
    if (!this.state.key) { D.rattle = 0.4; k.synth.noise(0.12, { vol: 0.04, lp: 1800 }); k.say('Locked. A little brass keyhole. The Director keeps the key somewhere.', 4); return; }
    D.want = 1; this.state.desk = true; this.save();
    k.synth.note(1400, 0.05, { type: 'square', vol: 0.02 }); k.synth.noise(0.3, { vol: 0.03, lp: 900, at: 0.08 });
    if (k.find('deskkey')) k.callout('THE DIRECTOR’S DESK');
    k.say('The key turns. There is a folder inside.', 4);
  },
  _marks() {
    const G = this.k.G;
    for (const v of this.list) if (this.state.read[v.n.wing] && !this.marks.some(m => m.wing === v.n.wing)) this.marks.push({ x: v.n.vent.x, y: v.n.y, z: v.n.vent.z, colour: '#5dff7a', ring: true, wing: v.n.wing });
    const have = G.mapMarks || [], want = this.marks.filter(m => !have.includes(m));
    if (want.length) G.mapMarks = [...have, ...want];
  },

  near(veh, k) {
    if (k.G.racing) return null;
    const p = k.pos;
    for (const v of this.list) {
      const n = v.n;
      if (Math.abs(p.y - n.y) > 0.8 || Math.abs(p.x - n.vent.x) > 4 || Math.abs(p.z - n.vent.z) > 4) continue;
      // in the nest, by the thing to read
      if (v.item && this._inside(v, p)) {
        const di = Math.hypot(p.x - v.item.x, p.z - v.item.z);
        if (di < 0.75 || (this.showing === v.clue)) return { verb: v.clue.kind === 'key' && !this.state.read[n.wing] ? 'TAKE' : 'READ', hint: this.state.read[n.wing] ? null : 'Something the mice have kept. E to read it.', act: () => this._read(v) };
        continue;
      }
      // at the grille, in front of it
      if (v.want === OPEN) continue;
      const ahead = (p.x - n.vent.x) * n.nx + (p.z - n.vent.z) * n.nz, along = (p.x - n.vent.x) * v.L[0] + (p.z - n.vent.z) * v.L[1];
      if (ahead > -0.05 && ahead < 1.2 && Math.abs(along) < 0.9) {
        if (mice.seenHome(n.wing)) return { verb: 'OPEN', hint: 'The vent the mouse went into. E to open it.', act: () => this._open(v) };
        return { verb: 'OPEN', act: () => { v.rattle = 0.45; k.synth.noise(0.1, { vol: 0.035, lp: 2600 }); k.say('Stuck fast. Something small and green lives in there: see it home first.', 4); } };
      }
    }
    const D = this._desk();
    if (D && Math.abs(p.y - D.at.y) < 0.8 && Math.hypot(p.x - D.at.x, p.z - D.at.z) < 1.25) {
      if (!this.state.desk) return { verb: 'OPEN', hint: this.state.key ? 'The Director’s desk. You have its key.' : null, act: () => this._openDesk() };
      return { verb: 'READ', act: () => { if (this.showing === DESK) { this._show(null); return; } this._show(DESK, k.pos); if (!this.state.folder) { this.state.folder = true; this.save(); k.say(DESK.say, 5); } } };
    }
    return null;
  },

  active(k) { return !k.G.racing; },
  update(dt, k) {
    this.t += dt;
    const p = k.pos, pulse = 0.5 + 0.5 * Math.sin(this.t * 2.2);
    for (const v of this.list) {
      const n = v.n, far = Math.abs(p.y - n.y) > 3 ? 1e4 : Math.hypot(p.x - n.vent.x, p.z - n.vent.z);
      v.group.visible = far < 45;
      if (!v.group.visible) { if (v.inner && v.shown) v.inner.visible = v.shown = false; continue; }
      // the grille: swinging, or rattled
      if (v.ang !== v.want) { const s = Math.sign(v.want - v.ang); v.ang += s * dt * 3.2; if (Math.sign(v.want - v.ang) !== s) v.ang = v.want; this._hinge(v); }
      if (v.rattle > 0) { v.rattle -= dt; v.pivot.rotation.y = v.th + v.ang - Math.abs(Math.sin(v.rattle * 40)) * 0.04; if (v.rattle <= 0) this._hinge(v); }
      n.gate.off = v.ang < OPEN * 0.6;
      const seen = mice.seenHome(n.wing);
      v.rimMesh.visible = seen && v.want !== OPEN;
      v.glow.material.opacity = (seen ? 0.7 : 0.35) + 0.25 * pulse;
      v.pool.material.opacity = (seen ? 0.85 : 0.35) * (0.75 + 0.25 * pulse);
      // the inside, only while near
      const show = far < NEAR;                // (shut, it still shows green through the slats)
      if (show && !v.inner) this._build(v);
      if (v.inner && show !== v.shown) v.inner.visible = v.shown = show;
      if (!v.inner || !show) continue;
      v.inPool.material.opacity = 0.75 + 0.25 * pulse;
      if (v.glint) { v.glint.material.opacity = 0.4 + 0.45 * pulse; }
      if (this._inside(v, p)) {
        k.museum.playerIndoors = true;
        if (k.G.view !== 'fpv') { const c = this._cc || (this._cc = { at: null, look: { x: 0, y: 0, z: 0 } }); c.at = v.cam; c.look.x = p.x; c.look.y = p.y + 0.08; c.look.z = p.z; k.camClose = c; }
        if (!v.inTold) { v.inTold = true; k.once('nest-in', 'A mouse nest. Paper, fluff, and things that glow.', 4); }
      }
    }
    // the desk drawer
    const D = this.desk;
    if (D) {
      if (D.out !== D.want) { D.out = Math.min(1, D.out + dt * 2.2); D.drawer.position.z = 0.32 * D.out * D.out * (3 - 2 * D.out); }
      if (D.rattle > 0) { D.rattle -= dt; D.drawer.position.z = D.rattle > 0 ? Math.abs(Math.sin(D.rattle * 50)) * 0.006 : 0; }
    }
    // the card goes when you drive off
    if (this.cardAt && (Math.hypot(p.x - this.cardAt.x, p.z - this.cardAt.z) > 1.2 || this.t - this.cardAt.t > 14)) this._show(null);
    if ((this.markT = (this.markT || 0) + dt) > 1) { this.markT = 0; this._marks(); }
  },

  spots() {
    const out = (this.list || []).map(v => ({ kind: 'secret', id: 'nests', name: 'Mouse nest: ' + v.n.name + (this.state.read[v.n.wing] ? ' (found)' : ''), x: v.n.back.x, y: v.n.y, z: v.n.back.z }));
    const D = this.k && this.k.G.boards ? this._desk() : null;
    if (D) out.push({ kind: 'secret', id: 'deskkey', name: 'The Director’s desk (needs the key)', x: D.at.x, y: D.at.y, z: D.at.z });
    return out;
  },
  reset() { if (this.cardEl) this._show(null); },
  // A new game: every grille shut, every nest unread, the key back where the mice keep it, the desk locked.
  fresh() {
    this.state = { open: {}, read: {}, key: false, desk: false, folder: false }; this.save();
    for (const v of this.list || []) { v.ang = v.want = 0; v.n.gate.off = false; this._hinge(v); if (v.item) v.item.mesh.visible = true; }
    if (this.desk) { this.desk.out = this.desk.want = 0; this.desk.drawer.position.z = 0; }
    const G = this.k.G; if (G.mapMarks) G.mapMarks = G.mapMarks.filter(m => !this.marks.includes(m)); this.marks = [];
    if (this.cardEl) this._show(null);
  },
});
