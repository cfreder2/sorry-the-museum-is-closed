// What stands in the grounds that the park put there (features.js): groundsplan.js says where each thing is and makes
// it solid; this draws them. (The benches and litter bins among them are the streets' own: streets.js puts them out.)
//
//   * Lamps: the park's twin-globe standard (a cast post on a spreading foot, a cross arm with a globe at each end)
//     down the paths west of Columbus Drive, each with its pool of light on the path and on the banks beside it; and a
//     cast foot on every plain lamp post the grounds already had.
//   * Bare flagpoles by the North Garden; hoops for bicycles, drifted in; drinking fountains shut off and bagged till
//     spring; the park's rules at its ways in, a finger post where the paths cross, the trail's signs and mile posts;
//     low posts and chains along the bed on the Monroe Street side; boulders with a plaque; salt boxes; picnic tables
//     under their snow; a concession kiosk shuttered for the season; urns and a balustrade at the bridge over the
//     railway; and by the harbour three boats shrink-wrapped on their cradles, a rack of dinghies, a half-buried dock
//     of hire bicycles and a life ring every so often along the wall.
// Every form is turned on a lathe, swept along a curve or rounded off; snow lies on whatever of it faces up.
//
// Cost: one mesh for all the ironwork, stone, wood and snow (coloured at its corners), one for the lit globes, one
// for the pools of light, one for the words on the signs. Nothing moves; nothing is worked out after start-up.

import * as THREE from 'three';
import { once } from './budget.js';      // (a canvas painted once: on a phone it is let go once it is on the graphics card)
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature } from './features.js';
import { parkLamps } from './land.js';
import { streetY } from './plan.js';

const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const IRON = [0.05, 0.06, 0.058], GREEN = [0.06, 0.14, 0.1], STONE = [0.5, 0.47, 0.42], WHITE = [0.86, 0.9, 0.98], STEEL = [0.3, 0.32, 0.34], WOOD = [0.1, 0.066, 0.042], GOLD = [0.7, 0.52, 0.18], TARP = [0.1, 0.16, 0.26], WRAP = [0.72, 0.8, 0.92], ORANGE = [0.85, 0.3, 0.06], GRANITE = [0.3, 0.3, 0.31], DRIFT = [0.56, 0.62, 0.8];      // (DRIFT: snow lying on the ground against a thing, the colour of the ground's own)

// The words on things: one picture. Each entry is [x, y, w, h] in it.
const SIGN = { rules: [0, 0, 256, 320], garden: [256, 0, 256, 320], trail: [512, 0, 256, 320], mile: [768, 0, 128, 320], salt: [896, 0, 128, 160], plaque: [0, 320, 256, 192], kiosk: [256, 320, 512, 128], b0: [256, 448, 256, 64], b1: [512, 448, 256, 64], b2: [768, 448, 256, 64], b3: [768, 320, 256, 64] };
function signAtlas() {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const c = cv.getContext('2d'); c.textAlign = 'center'; c.textBaseline = 'middle';
  const F = (px, wt = 700) => `${wt} ${px}px Georgia, 'Times New Roman', serif`, SF = (px, wt = 700) => `${wt} ${px}px Helvetica, Arial, sans-serif`;
  const board = (k, bg, edge, fn) => { const [x, y, w, h] = SIGN[k]; c.save(); c.translate(x, y); c.fillStyle = bg; c.fillRect(0, 0, w, h); if (edge) { c.strokeStyle = edge; c.lineWidth = 6; c.strokeRect(7, 7, w - 14, h - 14); } fn(w, h); c.restore(); };
  const lines = (list, x, y0, dy, font, col) => { c.font = font; c.fillStyle = col; list.forEach((t, i) => c.fillText(t, x, y0 + i * dy)); };
  board('rules', '#1f4a36', '#d9d2b8', (w) => { lines(['GRANT PARK'], w / 2, 46, 0, F(30), '#efe8cf'); c.fillStyle = '#d9d2b8'; c.fillRect(40, 72, w - 80, 3); lines(['Open 6 am to 11 pm', 'Dogs on a lead', 'Keep off the ice', 'No fires or fireworks', 'Take your litter home'], w / 2, 108, 40, F(20, 400), '#efe8cf'); });
  board('garden', '#2a2622', '#b9a878', (w) => { lines(['THE GARDEN', 'IS RESTING'], w / 2, 70, 40, F(28), '#e6d9b0'); c.fillStyle = '#b9a878'; c.fillRect(60, 132, w - 120, 2); lines(['Please keep', 'to the paths', 'until spring'], w / 2, 176, 38, F(22, 400), '#e6d9b0'); });
  board('trail', '#1d3f6b', '#e8edf2', (w) => { lines(['LAKEFRONT', 'TRAIL'], w / 2, 56, 38, SF(30), '#f1f4f7'); c.fillStyle = '#e8edf2'; c.fillRect(40, 116, w - 80, 3); lines(['Keep right', 'Pass on the left', 'Wheels give way', 'to feet'], w / 2, 158, 40, SF(21, 500), '#f1f4f7'); });
  board('mile', '#e9e6dc', null, (w, h) => { c.fillStyle = '#1d3f6b'; c.fillRect(0, 0, w, 70); lines(['MILE'], w / 2, 36, 0, SF(30), '#f1f4f7'); lines(['18'], w / 2, 150, 0, SF(84), '#1d3f6b'); lines(['LAKEFRONT', 'TRAIL'], w / 2, 240, 30, SF(18), '#1d3f6b'); void h; });
  board('salt', '#c9a21a', null, (w) => { lines(['SALT'], w / 2, 62, 0, SF(40), '#1a1a18'); lines(['and grit'], w / 2, 112, 0, SF(20, 500), '#1a1a18'); });
  board('plaque', '#4a3a22', '#8a7040', (w) => { lines(['IN MEMORY OF THE ELMS'], w / 2, 48, 0, F(17), '#d8c28a'); lines(['that stood on this field', 'from 1909 to 1978', 'and of all who sat', 'under them'], w / 2, 82, 26, F(16, 400), '#d8c28a'); });
  board('kiosk', '#e9e2cc', '#7a2a22', (w) => { lines(['CLOSED FOR THE SEASON'], w / 2, 48, 0, F(34), '#7a2a22'); lines(['Back with the boats in May'], w / 2, 94, 0, F(22, 400), '#3a2a22'); });
  [['b0', 'Harbour'], ['b1', 'Band shell'], ['b2', 'Art Institute'], ['b3', 'Sled hill']].forEach(([k, t]) => board(k, '#1f4a36', null, (w, h) => { c.strokeStyle = '#d9d2b8'; c.lineWidth = 3; c.strokeRect(3, 3, w - 6, h - 6); lines([t], w / 2 - 12, h / 2 + 1, 0, F(30), '#efe8cf'); c.fillStyle = '#efe8cf'; c.beginPath(); c.moveTo(w - 14, h / 2); c.lineTo(w - 36, h / 2 - 12); c.lineTo(w - 36, h / 2 + 12); c.fill(); }));
  const t = new THREE.CanvasTexture(once(cv)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

feature({
  id: 'parkdress',
  init(k) {
    const plan = k.plan, D = plan.dress; if (!D) return;
    const g = this.g = new THREE.Group(); g.name = 'parkdress'; k.group.add(g);
    const kit = [], glow = [], faces = { pos: [], uv: [], idx: [] }, M = new THREE.Matrix4(), yOf = (x, z) => streetY(plan, x, z);
    // ---- the forms
    const bare = q => { q = q.index ? q.toNonIndexed() : q; for (const a of Object.keys(q.attributes)) if (a !== 'position' && a !== 'normal') q.deleteAttribute(a); return q; };
    // Painted: `col` everywhere, and snow on what faces up (from `snowY` of the form's own height upward, if given).
    const paint = (q, col, snow = 0.62, from = -1e9) => { q = bare(q); const P = q.attributes.position, N = q.attributes.normal, a = new Float32Array(P.count * 3); for (let i = 0; i < P.count; i++) { const s = snow < 1 && N.getY(i) > snow && P.getY(i) >= from ? 1 : 0, c = s ? WHITE : col; a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } q.setAttribute('color', new THREE.BufferAttribute(a, 3)); return q; };
    const put = (q, x, y, z, yaw = 0, list = kit) => { M.makeRotationY(yaw).setPosition(x, y, z); list.push(q.clone().applyMatrix4(M)); };
    const lathe = (pts, seg = 12) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
    const rbox = (w, h, d, b = 0.03) => { if (Math.min(w, h, d) < 0.09) { const q = new THREE.BoxGeometry(w, h, d); q.translate(0, h / 2, 0); return q; } const s = new THREE.Shape(), x = w / 2 - b, z = d / 2 - b; s.moveTo(-x, -z); s.lineTo(x, -z); s.lineTo(x, z); s.lineTo(-x, z); s.closePath(); const q = new THREE.ExtrudeGeometry(s, { depth: h - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 1, curveSegments: 1 }); q.rotateX(-Math.PI / 2); q.translate(0, b, 0); return q; };      // a box with its edges rounded off, standing on y = 0
    const tubeOf = (pts, r, seg = 6, n = pts.length * 3) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), n, r, seg, false);
    const blob = (rx, ry, rz) => { const q = new THREE.SphereGeometry(1, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2); q.scale(rx, ry, rz); return q; };      // a soft cap or drift of snow, flat underneath
    const join = list => mergeGeometries(list);
    const part = (q, x, y, z, rx = 0, ry = 0, rz = 0) => { q = q.clone(); if (rx) q.rotateX(rx); if (rz) q.rotateZ(rz); if (ry) q.rotateY(ry); q.translate(x, y, z); return q; };

    // ---- lamps: the twin-globe standard, and a cast foot for every plain post
    const foot = paint(lathe([[0.21, 0], [0.21, 0.07], [0.145, 0.12], [0.135, 0.34], [0.09, 0.44], [0.1, 0.7], [0.055, 0.82]], 8), IRON, 0.8);
    const globeG = new THREE.SphereGeometry(0.19, 14, 10);
    { const post = join([foot.clone(), paint(lathe([[0.06, 1.1], [0.052, 2.95], [0.085, 3.0], [0.085, 3.05], [0.045, 3.1], [0.04, 3.45], [0.07, 3.5], [0.02, 3.62], [0.001, 3.7]], 8), IRON, 0.8)]);
      const arm = s => paint(tubeOf([[0, 3.02, 0], [s * 0.2, 2.96, 0], [s * 0.38, 3.02, 0], [s * 0.46, 3.16, 0], [s * 0.46, 3.24, 0]], 0.022, 5, 8), IRON, 2), cup = s => part(paint(lathe([[0.001, 0], [0.07, 0], [0.1, 0.05], [0.06, 0.07]], 10), IRON, 2), s * 0.46, 3.22, 0);
      const scroll = s => paint(tubeOf([[s * 0.06, 2.8, 0], [s * 0.2, 2.84, 0], [s * 0.3, 2.94, 0]], 0.014, 4, 5), IRON, 2);
      const lampG = join([post, arm(1), arm(-1), cup(1), cup(-1), scroll(1), scroll(-1)]);
      for (const [x, z] of D.lamps) { const y = yOf(x, z), yaw = (Math.round(x * 3 + z) % 2) * Math.PI / 2 + 0.2; put(lampG, x, y, z, yaw);
        for (const s of [-1, 1]) put(globeG, x + Math.cos(yaw) * 0.46 * s, y + 3.46, z - Math.sin(yaw) * 0.46 * s, 0, glow);
        put(paint(blob(0.2, 0.05, 0.2), WHITE, 2), x, y + 3.6, z); }
      const plain = [...(plan.lamps || []).map(l => [l.x, l.z]), ...(plan.lakefront ? parkLamps(plan.lakefront.field) : [])];
      for (const [x, z] of plain) put(foot, x, yOf(x, z), z);
      this.lamps = D.lamps.length; this.feet = plain.length;
      // their pools of light, on the ground and (through the land's own map) on the banks that stand up through them
      if (D.lamps.length) {
        const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'), gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
        const colour = new THREE.Color(0.5, 0.36, 0.2), pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(once(cv)), color: colour, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), D.lamps.length);
        const Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
        D.lamps.forEach(([x, z], i) => pools.setMatrixAt(i, M.compose(new THREE.Vector3(x, yOf(x, z) + 0.04, z), Q, new THREE.Vector3(10, 10, 1))));
        pools.renderOrder = 4; pools.computeBoundingSphere(); g.add(pools);
        if (k.museum.snowfield && k.museum.snowfield.lampLight) k.museum.snowfield.lampLight([...(plan.lakefront ? parkLamps(plan.lakefront.field) : []), ...D.lamps], 5, colour);
      } }

    // ---- flagpoles, bare
    { const pole = join([paint(lathe([[0.001, 0], [0.2, 0], [0.2, 0.1], [0.12, 0.16], [0.085, 0.5], [0.075, 0.55], [0.07, 4], [0.045, 9], [0.001, 9.02]], 10), STEEL, 0.8), part(paint(new THREE.SphereGeometry(0.09, 12, 8), GOLD, 2), 0, 9.1, 0), part(paint(tubeOf([[0.08, 1.2, 0], [0.085, 5, 0.02], [0.06, 8.9, 0]], 0.006, 4, 10), WHITE, 2), 0, 0, 0)]);
      for (const [x, z, h] of D.flagpoles) { const q = pole.clone(); q.scale(1, h / 9.1, 1); put(q, x, yOf(x, z), z, x); } }

    // ---- bicycle hoops, drifted in
    { const hoop = paint(tubeOf([[-0.28, 0, 0], [-0.28, 0.6, 0], [-0.2, 0.8, 0], [0, 0.86, 0], [0.2, 0.8, 0], [0.28, 0.6, 0], [0.28, 0, 0]], 0.026, 5, 12), STEEL, 0.75), rack = join([part(hoop, -0.62, 0, 0, 0, Math.PI / 2), part(hoop, 0, 0, 0, 0, Math.PI / 2), part(hoop, 0.62, 0, 0, 0, Math.PI / 2), part(paint(blob(1.0, 0.07, 0.42), DRIFT, 2), 0.1, 0, 0.05)]);
      for (const [x, z, yaw] of D.racks) put(rack, x, yOf(x, z), z, yaw); }

    // ---- drinking fountains, bagged for the winter
    { const f = join([paint(lathe([[0.001, 0], [0.2, 0], [0.2, 0.06], [0.14, 0.1], [0.12, 0.7], [0.15, 0.74]], 12), GRANITE, 0.9), paint(lathe([[0.15, 0.74], [0.2, 0.8], [0.235, 0.9], [0.22, 1.0], [0.15, 1.08], [0.06, 1.12], [0.001, 1.13]], 12), TARP, 0.5),
        part(paint(new THREE.TorusGeometry(0.155, 0.014, 5, 14), GOLD, 2), 0, 0.76, 0, Math.PI / 2), part(paint(blob(0.19, 0.07, 0.19), WHITE, 2), 0, 1.07, 0)]);
      for (const [x, z] of D.fountains) put(f, x, yOf(x, z), z, x + z); }

    // ---- signs
    const face = (k2, x, y, z, w, h, yaw, both = true) => { const [sx, sy, sw, sh] = SIGN[k2], c = Math.cos(yaw), s = Math.sin(yaw);
      for (const f of both ? [1, -1] : [1]) { const b = faces.pos.length / 3; for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { faces.pos.push(x + c * dx * f * w / 2 + s * 0.022 * f, y + dy * h / 2, z - s * dx * f * w / 2 + c * 0.022 * f); faces.uv.push((sx + (dx + 1) / 2 * sw) / 1024, 1 - (sy + (1 - dy) / 2 * sh) / 512); } faces.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); } };
    { const post = paint(lathe([[0.001, 0], [0.07, 0], [0.07, 0.05], [0.035, 0.09], [0.032, 2.1], [0.05, 2.13], [0.001, 2.2]], 8), GREEN, 0.8), panel = paint(rbox(0.6, 0.75, 0.04, 0.015), GREEN, 0.9), cap = paint(blob(0.31, 0.05, 0.04), WHITE, 2);
      for (const [x, z, kind, yaw] of D.signs) { const y = yOf(x, z);
        if (kind === 'finger') { put(post, x, y, z); ['b0', 'b1', 'b2', 'b3'].forEach((b, i) => { const a = yaw + [0, Math.PI, 1.9, -1.2][i], yy = y + 1.98 - i * 0.2, bx = x + Math.cos(a) * 0.36, bz = z - Math.sin(a) * 0.36; put(paint(rbox(0.66, 0.17, 0.03, 0.01), GREEN, 0.9), bx, yy - 0.085, bz, a); face(b, bx, yy, bz, 0.64, 0.16, a); }); put(paint(blob(0.08, 0.05, 0.08), WHITE, 2), x, y + 2.18, z); }
        else { put(post, x, y, z); put(panel, x, y + 1.3, z, yaw); put(cap, x, y + 2.05, z, yaw); face(kind, x, y + 1.675, z, 0.56, 0.7, yaw); } }
      const mk = paint(rbox(0.2, 1.05, 0.2, 0.03), [0.6, 0.6, 0.58], 0.8); for (const [x, z] of D.markers) { put(mk, x, yOf(x, z), z); face('mile', x, yOf(x, z) + 0.66, z, 0.16, 0.4, Math.PI / 2, true); } }

    // ---- low posts and chains
    { const b = join([paint(lathe([[0.001, 0], [0.075, 0], [0.075, 0.04], [0.05, 0.07], [0.045, 0.46], [0.06, 0.49], [0.04, 0.52], [0.062, 0.57], [0.045, 0.62], [0.001, 0.64]], 8), IRON, 0.85)]);
      for (const [x, z] of D.bollards) put(b, x, yOf(x, z), z);
      for (const [ax, az, bx, bz] of D.chains) { const y = yOf(ax, az) + 0.5, pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([ax + (bx - ax) * t, y - 0.16 * (1 - (2 * t - 1) ** 2), az + (bz - az) * t]); } kit.push(paint(tubeOf(pts, 0.013, 3, 6), IRON, 0.8)); } }

    // ---- boulders, each with its plaque
    { const r = rng(606);
      for (const [x, z, s, yaw] of D.boulders) { const q = new THREE.SphereGeometry(1, 14, 10), P = q.attributes.position, ph = r() * 6; for (let i = 0; i < P.count; i++) { const px = P.getX(i), py = P.getY(i), pz = P.getZ(i), k2 = 1 + 0.16 * Math.sin(px * 2.3 + ph) * Math.sin(pz * 2.9 + ph * 1.7) + 0.1 * Math.sin(py * 4 + px * 3 + ph); P.setXYZ(i, px * k2 * 0.62 * s, Math.max(-0.08, py * k2 * 0.42 * s + 0.26 * s), pz * k2 * 0.5 * s); } q.computeVertexNormals();
        const y = yOf(x, z); put(paint(q, GRANITE, 0.8), x, y, z, yaw); const a = yaw + 0.2, c = Math.cos(a), sn = Math.sin(a);
        put(paint(rbox(0.36, 0.26, 0.025, 0.008), [0.3, 0.22, 0.1], 2), x + sn * 0.5 * s, y + 0.2 * s, z + c * 0.5 * s, a); face('plaque', x + sn * (0.5 * s + 0.014), y + 0.2 * s + 0.13, z + c * (0.5 * s + 0.014), 0.33, 0.24, a, false); } }

    // ---- picnic tables under snow; salt boxes
    { const leg = s => part(paint(rbox(0.07, 0.86, 0.09, 0.012), WOOD, 2), 0, 0, 0, 0, 0, s * 0.5), table = join([part(paint(rbox(1.8, 0.05, 0.74, 0.015), WOOD, 2), 0, 0.72, 0), part(paint(blob(0.92, 0.11, 0.39), WHITE, 2), 0, 0.765, 0),
        ...[-1, 1].flatMap(s => [part(paint(rbox(1.8, 0.045, 0.26, 0.012), WOOD, 2), 0, 0.42, s * 0.68), part(paint(blob(0.9, 0.08, 0.14), WHITE, 2), 0, 0.46, s * 0.68)]),
        ...[-0.7, 0.7].flatMap(xx => [part(leg(1), xx, -0.02, 0.2, 0, Math.PI / 2), part(leg(-1), xx, -0.02, -0.2, 0, Math.PI / 2), part(paint(rbox(0.07, 0.07, 1.5, 0.012), WOOD, 2), xx, 0.36, 0)])]);
      for (const [x, z, yaw] of D.tables) put(table, x, yOf(x, z), z, yaw);
      const lid = paint(rbox(0.74, 0.1, 1.04, 0.03), [0.26, 0.22, 0.07], 2); lid.rotateZ(0.16); const box = join([paint(rbox(0.7, 0.62, 1.0, 0.04), [0.3, 0.26, 0.08], 2), part(lid, 0, 0.6, 0), part(paint(blob(0.36, 0.09, 0.5), WHITE, 2), 0, 0.7, 0)]);
      for (const [x, z, yaw] of D.salt) { const y = yOf(x, z); put(box, x, y, z, yaw); face('salt', x + Math.cos(yaw) * 0.36, y + 0.34, z - Math.sin(yaw) * 0.36, 0.44, 0.44, yaw + Math.PI / 2, false); } }

    // ---- the kiosk, shuttered
    if (D.kiosk) { const { x, z, h, yaw = 0 } = D.kiosk, y = yOf(x, z), parts = [paint(rbox(h * 2, 2.25, h * 2, 0.04), [0.07, 0.17, 0.13], 2)];
      for (let i = 0; i < 9; i++) parts.push(part(paint(rbox(h * 2 + 0.03, 0.035, h * 2 + 0.03, 0.012), [0.05, 0.12, 0.09], 2), 0, 0.2 + i * 0.24, 0));      // clapboards
      const roof = new THREE.ConeGeometry(h * 1.62, 0.95, 4, 3); roof.rotateY(Math.PI / 4); parts.push(part(paint(roof, [0.16, 0.1, 0.08], 0.3), 0, 2.7, 0), part(paint(rbox(h * 2.3, 0.07, h * 2.3, 0.03), [0.2, 0.2, 0.2], 0.8), 0, 2.22, 0), part(paint(blob(0.5, 0.2, 0.5), WHITE, 2), 0, 3.1, 0));
      parts.push(part(paint(rbox(1.5, 0.95, 0.06, 0.02), [0.3, 0.3, 0.27], 2), 0, 1.0, h + 0.01), part(paint(rbox(1.7, 0.05, 0.3, 0.015), [0.2, 0.2, 0.2], 0.8), 0, 0.95, h + 0.14), part(paint(rbox(2.0, 0.52, 0.05, 0.015), [0.5, 0.48, 0.4], 2), 0, 2.32, h + 0.5));
      for (let i = 0; i < 7; i++) parts.push(part(paint(rbox(1.46, 0.03, 0.03, 0.008), [0.2, 0.2, 0.18], 2), 0, 1.1 + i * 0.12, h + 0.05));      // the shutter's slats
      put(join(parts), x, y, z, yaw); face('kiosk', x + Math.sin(yaw) * (h + 0.53), y + 2.58, z + Math.cos(yaw) * (h + 0.53), 1.9, 0.46, yaw, false); this.kiosk = 1; }

    // ---- by the harbour: boats under shrink wrap on their cradles, a rack of dinghies, the dock of hire bicycles, life rings
    { const r = rng(88);
      const hull = (len, beam, hgt, wrap, over, under) => {            // lofted through stations from stern to bow: a hull's V below, and above it the wrap pulled over a ridge pole
        const N = 12, K = 10, pos = [], idx = [];
        for (let i = 0; i <= N; i++) { const t = i / N, zz = (t - 0.5) * len, w = beam / 2 * (t < 0.55 ? 0.86 + 0.14 * Math.sin(Math.PI * t / 1.1) : 1 - 0.95 * Math.pow((t - 0.55) / 0.45, 1.8)), keel = 0.2 * Math.pow(t, 3), ridge = hgt * (wrap ? 0.82 + 0.18 * Math.sin(Math.PI * t) : 0.62);
          for (let j = 0; j <= K; j++) { const u = j / K; let px, py;
            if (u <= 0.5) { const v = u * 2; px = w * (2 * v - 1); py = keel + hgt * 0.42 * Math.pow(Math.abs(2 * v - 1), 1.7); }      // the bottom, port to starboard
            else { const v = (u - 0.5) * 2, s = Math.sin(Math.PI * v); px = w * (1 - 2 * v) * (1 + 0.04 * s); py = hgt * 0.42 + (ridge - hgt * 0.42) * Math.pow(s, wrap ? 0.8 : 0.5); }      // over the top, starboard to port
            pos.push(px, py, zz); } }
        for (let i = 0; i < N; i++) for (let j = 0; j < K; j++) { const a = i * (K + 1) + j, b = a + K + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
        const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); q.setIndex(idx); q.computeVertexNormals();
        const col = []; for (let i = 0; i <= N; i++) for (let j = 0; j <= K; j++) { const u = j / K, top = u > 0.5 && Math.abs(u - 0.75) < 0.09, low = u < 0.5 && Math.abs(u - 0.25) < 0.17, band = wrap && (i === 3 || i === 6 || i === 9), c = low ? under : top && wrap ? WHITE : band ? [over[0] * 0.6, over[1] * 0.66, over[2] * 0.8] : over; col.push(c[0], c[1], c[2]); }
        q.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return q.toNonIndexed(); };
      const stand = (zz, w) => join([part(paint(rbox(w * 1.5, 0.08, 0.1, 0.01), STEEL, 0.9), 0, 0, zz), ...[-1, 1].flatMap(s => [part(paint(tubeOf([[s * w * 0.7, 0.04, zz], [s * w * 0.62, 0.5, zz], [s * w * 0.5, 0.78, zz]], 0.028, 5, 6), STEEL, 2), 0, 0, 0), part(paint(rbox(0.22, 0.05, 0.3, 0.01), WOOD, 2), s * w * 0.47, 0.76, zz - 0.0, 0, 0, -s * 0.5)])]);
      for (const b of D.boats) { const y = yOf(b.x, b.z);
        if (b.wrap) { const beam = b.len * 0.34, h = b.len * 0.26, col = [WRAP[0] * (0.9 + r() * 0.15), WRAP[1] * (0.9 + r() * 0.15), WRAP[2]];
          const parts = [part(hull(b.len, beam, h, true, col, [[0.3, 0.05, 0.04], [0.04, 0.08, 0.2], [0.03, 0.03, 0.035]][Math.floor(r() * 3)]), 0, 0.62, 0), stand(-b.len * 0.25, beam / 2), stand(b.len * 0.22, beam / 2), part(paint(rbox(0.2, 0.5, 0.3, 0.02), WOOD, 2), 0, 0, -b.len * 0.05), part(paint(rbox(0.2, 0.62, 0.3, 0.02), WOOD, 2), 0, 0, b.len * 0.3)];
          put(join(parts), b.x, y, b.z, (r() - 0.5) * 0.08); }
        else { const parts = [], dg = (yy, zz, col) => part(hull(b.len * 0.92, 1.25, 0.55, false, col, col), 0, yy, zz, 0, 0, Math.PI);
          for (const s of [-1, 1]) for (const zz of [-1.5, 1.5]) parts.push(part(paint(tubeOf([[s * 0.8, 0, zz], [s * 0.8, 1.85, zz]], 0.03, 5, 4), STEEL, 2), 0, 0, 0));
          for (const yy of [0.5, 1.3]) for (const zz of [-1.5, 1.5]) parts.push(part(paint(tubeOf([[-0.8, yy, zz], [0.8, yy, zz]], 0.026, 5, 4), STEEL, 2), 0, 0, 0));
          parts.push(dg(1.12, 0, [0.5, 0.1, 0.08]), dg(1.92, 0, [0.1, 0.2, 0.4]), part(paint(blob(0.6, 0.12, 1.5), WHITE, 2), 0, 1.92, 0));
          put(join(parts), b.x, y, b.z, 0); } }
      this.boats = D.boats.length;
      if (D.dock) { const { x, z, n } = D.dock, y = yOf(x, z), parts = [part(paint(rbox(0.5, 0.05, n * 0.72 + 0.4, 0.015), STEEL, 0.8), 0, 0, 0), part(paint(blob(0.75, 0.22, n * 0.36 + 0.4), DRIFT, 2), -0.1, 0, 0)];
        const post = paint(lathe([[0.001, 0], [0.09, 0], [0.085, 0.6], [0.1, 0.66], [0.08, 0.76], [0.001, 0.8]], 8), [0.1, 0.2, 0.34], 0.7), wheel = paint(new THREE.TorusGeometry(0.3, 0.02, 4, 24), IRON, 2);
        for (let i = 0; i < n; i++) { const zz = (i - (n - 1) / 2) * 0.72; parts.push(part(post, 0, 0, zz));
          if (i % 3 !== 1) { const c = [[0.1, 0.3, 0.5], [0.1, 0.3, 0.5], [0.5, 0.1, 0.1]][i % 3]; parts.push(part(wheel, 0.42, 0.3, zz + 0.05, 0, Math.PI / 2 * 0, 0), part(wheel, 1.42, 0.3, zz + 0.05), part(paint(tubeOf([[0.42, 0.3, zz + 0.05], [0.75, 0.72, zz + 0.05], [1.3, 0.72, zz + 0.05], [1.42, 0.3, zz + 0.05]], 0.022, 5, 9), c, 2), 0, 0, 0), part(paint(tubeOf([[0.75, 0.72, zz + 0.05], [0.9, 0.3, zz + 0.05], [1.3, 0.72, zz + 0.05], [1.36, 0.92, zz + 0.05]], 0.02, 5, 9), c, 2), 0, 0, 0), part(paint(blob(0.16, 0.06, 0.09), WHITE, 2), 1.34, 0.93, zz + 0.05), part(paint(tubeOf([[0.45, 0.95, zz - 0.2], [0.42, 1.0, zz + 0.05], [0.45, 0.95, zz + 0.3]], 0.014, 4, 6), IRON, 2), 0, 0, 0), part(paint(tubeOf([[0.42, 0.3, zz + 0.05], [0.42, 1.0, zz + 0.05]], 0.018, 4, 3), c, 2), 0, 0, 0)); } }
        put(join(parts), x, y, z, 0); this.dock = 1; }
      const ring = (() => { const q = bare(new THREE.TorusGeometry(0.25, 0.055, 6, 16)), P = q.attributes.position, a = new Float32Array(P.count * 3); for (let i = 0; i < P.count; i++) { const an = Math.atan2(P.getY(i), P.getX(i)), w = Math.abs(((an / (Math.PI / 2)) % 1 + 1) % 1 - 0.5) < 0.12, c = w ? WHITE : ORANGE; a.set(c, i * 3); } q.setAttribute('color', new THREE.BufferAttribute(a, 3)); return q; })();
      const station = join([paint(lathe([[0.001, 0], [0.07, 0], [0.045, 0.06], [0.04, 1.75], [0.001, 1.78]], 8), [0.5, 0.08, 0.06], 0.9), part(paint(rbox(0.66, 0.7, 0.04, 0.015), [0.45, 0.07, 0.05], 0.9), 0, 0.95, 0.05), part(ring, 0, 1.3, 0.11), part(paint(blob(0.34, 0.07, 0.05), WHITE, 2), 0, 1.65, 0.05)]);
      for (const [x, z, top] of D.rings) put(station, x, top, z, -Math.PI / 2); }

    // ---- the bridge over the railway: piers, urns, a balustrade
    { const bal = paint(lathe([[0.085, 0], [0.085, 0.05], [0.048, 0.1], [0.082, 0.28], [0.082, 0.36], [0.04, 0.58], [0.052, 0.66], [0.085, 0.7], [0.085, 0.74]], 6), STONE, 0.9);
      const urn = paint(lathe([[0.001, 0], [0.2, 0], [0.21, 0.03], [0.2, 0.06], [0.12, 0.09], [0.09, 0.15], [0.1, 0.19], [0.2, 0.25], [0.31, 0.37], [0.36, 0.52], [0.37, 0.64], [0.4, 0.68], [0.4, 0.72], [0.36, 0.74], [0.3, 0.7], [0.001, 0.72]], 16), STONE, 0.6);
      const pier = join([paint(rbox(0.52, 1.06, 0.52, 0.03), STONE, 0.9), part(paint(rbox(0.62, 0.1, 0.62, 0.03), STONE, 0.9), 0, 1.04, 0)]);
      for (const [ax, az, bx, bz] of D.balustrades) { const len = Math.hypot(bx - ax, bz - az), n = Math.max(2, Math.round((len - 0.6) / 0.38)), y = yOf(ax, az), yaw = Math.atan2(bx - ax, bz - az);
        put(pier, ax, y, az); put(urn, ax, y + 1.14, az); put(paint(blob(0.3, 0.16, 0.3), WHITE, 2), ax, y + 1.84, az); put(pier, bx, y, bz); put(paint(blob(0.3, 0.07, 0.3), WHITE, 2), bx, y + 1.14, bz);
        const rail = paint(rbox(0.26, 0.13, len - 0.5, 0.03), STONE, 0.9); put(rail, (ax + bx) / 2, y + 0.84, (az + bz) / 2, yaw); put(paint(rbox(0.3, 0.1, len - 0.5, 0.025), STONE, 0.9), (ax + bx) / 2, y, (az + bz) / 2, yaw); put(paint(blob(0.12, 0.05, (len - 0.5) / 2), WHITE, 2), (ax + bx) / 2, y + 0.96, (az + bz) / 2, yaw);
        for (let i = 1; i < n; i++) { const t = (0.3 + (len - 0.6) * i / n) / len; put(bal, ax + (bx - ax) * t, y + 0.1, az + (bz - az) * t); } } }

    // ---- into the scene
    const std = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.15 });
    std.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * 0.5;'); };      // (lit a little from within, as everything out of doors is here)
    std.customProgramCacheKey = () => 'parkdress-kit';
    let tris = 0;
    // (three meshes, by where they stand: west of Columbus Drive, Butler Field, the lakefront: what is out of sight is not drawn)
    for (const [a, b] of [[-1e9, 296], [296, 500], [500, 1e9]]) { const some = kit.filter(q => { q.computeBoundingBox(); const cx = (q.boundingBox.min.x + q.boundingBox.max.x) / 2; return cx >= a && cx < b; }); if (!some.length) continue; const m = new THREE.Mesh(mergeGeometries(some.map(bare2)), std); m.matrixAutoUpdate = false; g.add(m); tris += m.geometry.attributes.position.count / 3; }
    if (glow.length) { const m = new THREE.Mesh(mergeGeometries(glow.map(q => { q = q.index ? q.toNonIndexed() : q; q.deleteAttribute('uv'); return q; })), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.3, 1.3) })); m.matrixAutoUpdate = false; g.add(m); tris += m.geometry.attributes.position.count / 3; }
    if (faces.idx.length) { const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(faces.pos, 3)); q.setAttribute('uv', new THREE.Float32BufferAttribute(faces.uv, 2)); q.setIndex(faces.idx);
      const m = new THREE.Mesh(q, new THREE.MeshBasicMaterial({ map: signAtlas(), color: new THREE.Color(0.62, 0.62, 0.66), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.matrixAutoUpdate = false; g.add(m); tris += faces.idx.length / 3; }
    kit.length = glow.length = faces.pos.length = faces.uv.length = faces.idx.length = 0;      // (the pieces, merged: let go. A function made in here and kept would keep them all, some 5 MB)
    // (what the streets and the roads put out after the plan was made: anything of this standing in one of them is a mistake to hear about)
    const clash = [], mine = [...D.lamps, ...D.signs, ...D.fountains, ...D.racks, ...D.bollards, ...D.boulders, ...D.tables, ...D.salt, ...D.shrubs.map(s => [s.x, s.z]), ...plan.grounds.trees.filter(t => t.added).map(t => [t.x, t.z])];
    for (const f of [...(plan.parkFurniture || []), ...(plan.streetLights || [])]) for (const q of mine) if (Math.hypot(q[0] - f.x, q[1] - f.z) < 0.75 && !D.benches.some(b => b.x === f.x && b.z === f.z) && !D.bins.some(b => b[0] === f.x && b[1] === f.z)) clash.push([f.kind || 'light', f.x, f.z]);
    k.museum.dressStats = { tris, lamps: D.lamps.length, feet: this.feet, clash };
  },
});
function bare2(q) { q = q.index ? q.toNonIndexed() : q; for (const a of Object.keys(q.attributes)) if (a !== 'position' && a !== 'normal' && a !== 'color') q.deleteAttribute(a); return q; }
