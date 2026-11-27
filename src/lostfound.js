// Lost property. Visitors leave things behind: a glove, a mitten, a ticket, a teddy bear. They lie where
// they were dropped, on the floors of the quieter galleries. Drive into one and it rides on the toy (three
// at a time); hand them in at the coat check in the lobby (src/lobby.js), or the Lost & Found box in the staff canteen.
// Each pays by how far it was from the lobby (40 to 150 chips), with a bonus for all of one kind, and for all thirty.
//
// This is the worked example of a feature (features.js): placed once, drawn with instancing, picked up
// with k.carry, handed in with near(), counted with k.tally.

import * as THREE from 'three';
import { fitText } from './textures.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature } from './features.js';
import { freeFloor, wallSpots, sameFloor, rng, claimed, claim, placingNow } from './placing.js';

const N = 30, KIND_BONUS = 100, ALL_BONUS = 500;
// What a thing is worth: the further from the lobby (and the more stairs between), the more.
const worth = (it, L) => { const d = Math.hypot(it.x - L.x, it.z - L.z) + Math.abs(it.y - L.y) * 12; return Math.round(Math.min(150, 40 + 7.5 * Math.sqrt(d)) / 5) * 5; };      // 25 m: 75, 100 m: 115, 200 m and on: 150

// ------------------------------------------------------------------ the things --
// Each a few simple shapes in their own colours, lying flat as dropped. Sizes are real: a toy car is 46 cm long.
function paint(g, hex) { g = g.index ? g.toNonIndexed() : g; const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('uv'); return g; }
const box = (w, h, d, x, y, z, hex, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.rotateY(ry); g.translate(x, y, z); return paint(g, hex); };
const ball = (r, x, y, z, hex, sx = 1, sy = 1, sz = 1) => { const g = new THREE.SphereGeometry(r, 10, 7); g.scale(sx, sy, sz); g.translate(x, y, z); return paint(g, hex); };
const rod = (r, len, x, y, z, hex, rx = 0, rz = 0, ry = 0) => { const g = new THREE.CylinderGeometry(r, r, len, 8); g.rotateX(rx); g.rotateZ(rz); g.rotateY(ry); g.translate(x, y, z); return paint(g, hex); };
const ring = (r, t, x, y, z, hex, rx = Math.PI / 2) => { const g = new THREE.TorusGeometry(r, t, 6, 16); g.rotateX(rx); g.translate(x, y, z); return paint(g, hex); };
const strip = (n, w, d, h, hexes) => { const parts = []; for (let i = 0; i < n; i++) parts.push(box(w / n + 0.001, h, d, -w / 2 + (i + 0.5) * w / n, h / 2, 0, hexes[i % hexes.length])); return parts; };

export const KINDS = [      // (exported for the Moon museum's cabinet, src/voyage.js)
  { id: 'mitten', name: 'a blue knitted mitten', make: () => [ball(0.06, 0, 0.022, 0, 0x2f5fa8, 1, 0.35, 1.6), ball(0.026, 0.06, 0.02, 0.02, 0x2f5fa8, 1, 0.7, 1.6), box(0.11, 0.035, 0.05, 0, 0.018, -0.105, 0xe9e2d0)] },
  { id: 'glove', name: 'a red leather glove', make: () => [box(0.1, 0.025, 0.11, 0, 0.013, 0, 0xa82424), ...[-0.036, -0.012, 0.012, 0.036].map((x, i) => rod(0.011, 0.07 - (i === 0 ? 0.015 : 0), x, 0.014, 0.085, 0xa82424, Math.PI / 2)), rod(0.012, 0.06, 0.065, 0.014, 0.02, 0xa82424, Math.PI / 2, 0, -0.7), box(0.1, 0.026, 0.05, 0, 0.013, -0.075, 0x7a1616)] },
  { id: 'scarf', name: 'a striped scarf', make: () => { const p = strip(9, 0.9, 0.17, 0.018, [0xb3242b, 0xe8dcc0, 0x1f3b6a]); const q = strip(4, 0.4, 0.17, 0.019, [0xb3242b, 0xe8dcc0, 0x1f3b6a]).map(g => { g.rotateY(1.2); g.translate(0.48, 0.003, 0.18); return g; }); return [...p, ...q]; } },
  { id: 'ticket', name: 'a ticket stub', make: () => [box(0.12, 0.003, 0.05, 0, 0.002, 0, 0xefe4c4), box(0.03, 0.004, 0.05, 0.045, 0.002, 0, 0xb3242b)] },
  { id: 'phone', name: 'somebody’s phone', make: () => [box(0.075, 0.01, 0.155, 0, 0.005, 0, 0x16181c), box(0.066, 0.002, 0.14, 0, 0.011, 0, 0x4a6aa0)] },
  { id: 'teddy', name: 'a teddy bear', make: () => [ball(0.075, 0, 0.075, 0, 0x8a5a32, 1, 1.15, 0.9), ball(0.058, 0, 0.18, 0.02, 0x8a5a32), ball(0.022, -0.045, 0.225, 0.02, 0x8a5a32), ball(0.022, 0.045, 0.225, 0.02, 0x8a5a32), ball(0.022, 0, 0.17, 0.07, 0xc9a07a), ball(0.03, -0.07, 0.03, 0.06, 0x8a5a32, 1, 1, 1.4), ball(0.03, 0.07, 0.03, 0.06, 0x8a5a32, 1, 1, 1.4), ball(0.026, -0.08, 0.1, 0.03, 0x8a5a32), ball(0.026, 0.08, 0.1, 0.03, 0x8a5a32), box(0.07, 0.025, 0.02, 0, 0.13, 0.05, 0xc0262c)] },
  { id: 'sketchbook', name: 'a sketchbook', make: () => [box(0.21, 0.02, 0.28, 0, 0.01, 0, 0x1a1a1c), box(0.2, 0.016, 0.27, 0.006, 0.01, 0, 0xf2eee2), box(0.005, 0.022, 0.28, -0.103, 0.011, 0, 0x8a8a8a)] },
  { id: 'umbrella', name: 'a folded umbrella', make: () => [rod(0.03, 0.62, 0, 0.03, 0, 0x1d2b4a, 0, Math.PI / 2), rod(0.008, 0.18, -0.4, 0.03, 0, 0x2a2a2a, 0, Math.PI / 2), ring(0.04, 0.009, -0.5, 0.03, 0.04, 0x5a3a20, 0), box(0.04, 0.012, 0.012, 0.33, 0.03, 0, 0xcfcfcf)] },
  { id: 'glasses', name: 'a pair of glasses', make: () => [ring(0.024, 0.004, -0.032, 0.008, 0, 0x202020), ring(0.024, 0.004, 0.032, 0.008, 0, 0x202020), box(0.016, 0.004, 0.004, 0, 0.008, 0, 0x202020), box(0.004, 0.004, 0.12, -0.058, 0.008, -0.06, 0x202020), box(0.004, 0.004, 0.12, 0.058, 0.008, -0.06, 0x202020)] },
  { id: 'shoe', name: 'a baby’s shoe', make: () => [ball(0.045, 0, 0.03, 0, 0xe8a0b8, 0.75, 0.6, 1.25), box(0.07, 0.012, 0.11, 0, 0.006, 0, 0xf4f0ea), box(0.05, 0.008, 0.012, 0, 0.055, -0.01, 0xffffff)] },
  { id: 'hat', name: 'a woolly hat', make: () => { const g = new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 0.85, 1); return [paint(g, 0x2f7a4a), rod(0.101, 0.04, 0, 0.012, 0, 0xe8e0cc), ball(0.035, 0, 0.09, 0, 0xe8e0cc)]; } },
  { id: 'lanyard', name: 'a lanyard with a pass on it', make: () => [ring(0.17, 0.006, 0, 0.004, -0.12, 0x2a4a9a), box(0.07, 0.004, 0.1, 0, 0.004, 0.08, 0xf4f4f0), box(0.05, 0.005, 0.02, 0, 0.005, 0.06, 0xb3242b)] },
];

feature({
  id: 'lostfound',
  secrets: [['lostfirst', 'Somebody dropped this'], ['lostfound', 'Lost and found']],
  init(k) { this.k = k; this.items = []; this.box = null; this.boxes = []; this.tally = k.tally('lostfound', N, ['lostfirst', 'lostfound']); },      // (both secrets: with every lost thing home there is nothing left to pick up either)

  // Where: anywhere a visitor goes, the emptiest places first (furthest from anything there is to find already).
  place() {
    const k = this.k, P = k.plan, r = rng(1957), taken = claimed(k.G);
    const cands = [];
    for (const room of P.rooms) {
      if (room.secret || room.passage) continue;
      const w = room.x1 - room.x0, d = room.z1 - room.z0; if (w < 3 || d < 3 || w * d < 14) continue;
      if (!(room.kind === 'gallery' || room.kind === 'corridor' || room.kind === 'hall' || /lobby|corridor|passage|caf|shop|restroom|cloak|lounge|foyer/i.test(room.gallery || '') || room.use === 'cafe')) continue;
      const s = freeFloor(P, room, room.x0 + w * (0.3 + 0.4 * r()), room.z0 + d * (0.3 + 0.4 * r()), 0.35);
      if (s) cands.push({ x: s.x, y: room.y, z: s.z, room, gallery: room.kind === 'gallery' });
    }
    const chosen = [];
    for (let n = 0; n < N && cands.length; n++) {
      let best = null, bd = -1;
      for (const c of cands) { let d = 200; for (const t of taken) d = Math.min(d, sameFloor(c, t)); for (const t of chosen) d = Math.min(d, sameFloor(c, t)); d *= c.gallery ? 1.15 : 1; if (d > bd) { bd = d; best = c; } }
      chosen.push(best); cands.splice(cands.indexOf(best), 1);
    }
    this.items = chosen.map((c, i) => ({ id: 'lost' + i, kind: KINDS[i % KINDS.length], x: c.x, y: c.y, z: c.z, room: c.room.id, yaw: r() * 6.28, state: this.tally.has('lost' + i) ? 'home' : 'floor' }));
    for (const it of this.items) claim(it);
    // The Lost & Found box: in the staff canteen, where its whiteboard says to bring things.
    const canteen = P.rooms.find(q => /^Staff canteen/i.test(q.gallery || '')) || P.rooms.find(q => /canteen|staff room/i.test(q.gallery || ''));
    if (canteen) {
      const cx = (canteen.x0 + canteen.x1) / 2, cz = (canteen.z0 + canteen.z1) / 2;
      const w = wallSpots(P, k.museum, canteen, { depth: 0.9, width: 0.5, height: 1.1, clear: 1.2 }).sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz))[0];
      if (w) { this.box = { x: w.x + w.nx * 0.33, y: canteen.y, z: w.z + w.nz * 0.33, nx: w.nx, nz: w.nz, room: canteen.id }; P.obstacles.push({ x0: this.box.x - 0.32, x1: this.box.x + 0.32, z0: this.box.z - 0.32, z1: this.box.z + 0.32, y0: canteen.y, y1: canteen.y + 0.95 }); claim(this.box); }
    }
    // and the coat check in the lobby, the one most people pass
    this.boxes = [this.box, P.coatCheck].filter(Boolean);
    const L = P.byId[P.front && P.front.a], lob = L ? { x: (L.x0 + L.x1) / 2, y: L.y, z: (L.z0 + L.z1) / 2 } : { x: 0, y: 0, z: 0 };
    for (const it of this.items) it.pay = worth(it, lob);
    this._build(); this.placed = true;
  },

  _build() {
    const k = this.k, group = new THREE.Group(); group.name = 'lost property'; k.group.add(group);
    this.mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, emissive: 0x15161c, emissiveIntensity: 0.5 });
    this.geos = {}; this.meshes = [];
    for (const kind of KINDS) {
      const its = this.items.filter(i => i.kind === kind); if (!its.length) continue;
      const geo = this.geos[kind.id] = mergeGeometries(kind.make()); geo.computeBoundingBox();
      const m = new THREE.InstancedMesh(geo, this.mat, its.length); m.frustumCulled = false; group.add(m); this.meshes.push(m);
      its.forEach((it, j) => { it.mesh = m; it.slot = j; });
    }
    this._matrices();
    if (this.box) {
      const b = this.box, bg = new THREE.Group();
      const wood = new THREE.MeshStandardMaterial({ color: 0x7a5432, roughness: 0.7, emissive: 0x2a1a0e, emissiveIntensity: 0.5 });
      const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); bg.add(m); };
      add(new THREE.BoxGeometry(0.6, 0.85, 0.5), wood, 0, 0.425, 0); add(new THREE.BoxGeometry(0.64, 0.05, 0.54), wood, 0, 0.875, 0);
      add(new THREE.BoxGeometry(0.34, 0.06, 0.05), new THREE.MeshBasicMaterial({ color: 0x0a0806 }), 0, 0.88, 0.1);
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const c = cv.getContext('2d');
      c.fillStyle = '#f3ecd8'; c.fillRect(0, 0, 256, 128); c.strokeStyle = '#7a5432'; c.lineWidth = 6; c.strokeRect(3, 3, 250, 122);
      c.fillStyle = '#2a1e12'; for (const [t, y, px, wt] of [['LOST', 38, 34, '700'], ['PROPERTY', 76, 34, '700'], ['hand it in here', 108, 17, 'italic']]) fitText(c, t, { x: 128, y, w: 220, h: px * 1.1, px, weight: wt, family: 'Georgia, serif' });
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
      add(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(0.85, 0.85, 0.85) }), 0, 0.5, 0.252);
      bg.position.set(b.x, b.y, b.z); bg.rotation.y = Math.atan2(b.nx, b.nz); group.add(bg);
    }
  },
  _matrices() {
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), Z = new THREE.Vector3(0, 0, 0);
    for (const it of this.items) { if (!it.mesh) continue; Q.setFromAxisAngle(V.set(0, 1, 0), it.yaw); it.mesh.setMatrixAt(it.slot, M.compose(V.set(it.x, it.y + 0.002, it.z), Q, it.state === 'floor' ? S : Z)); }
    for (const m of this.meshes) m.instanceMatrix.needsUpdate = true;
  },

  active(k) { return !k.G.racing; },
  update(dt, k) {
    if (!this.placed) this.place();
    const p = k.pos;
    // Picking up: drive into it.
    for (const it of this.items) {
      if (it.state !== 'floor' || Math.abs(p.y - it.y) > 0.6 || Math.abs(p.x - it.x) > 0.5 || Math.abs(p.z - it.z) > 0.5 || Math.hypot(p.x - it.x, p.z - it.z) > 0.42) continue;
      const bb = this.geos[it.kind.id].boundingBox, size = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z, bb.max.y - bb.min.y);
      const mesh = new THREE.Mesh(this.geos[it.kind.id], this.mat); mesh.scale.setScalar(Math.min(1, 0.2 / size)); mesh.rotation.y = 0.6;
      if (!k.carry.take({ id: it.id, mesh, lost: true })) break;
      it.state = 'carried'; this._matrices(); k.synth.note(1500, 0.08, { type: 'square', vol: 0.03 });
      k.say(k.find('lostfirst') ? `Picked up ${it.kind.name}. Somebody will want that back: hand it in at the coat check in the lobby (${it.pay} chips).` : `Picked up ${it.kind.name} (${it.pay} chips at the coat check). Carrying ${k.carry.list.length} of ${k.carry.max}.`, 6);
      if (k.carry.list.length >= k.carry.max) k.say('That is all the toy can carry. Take it to the coat check in the lobby.', 5);
      break;
    }
  },
  // At the coat check or the canteen box, with lost things on the toy: hand them in.
  near(v, k) {
    const at = (this.boxes || []).find(b => k.close(b, b.r || 1.4, 0.8)); if (!at) return null;
    const mine = k.carry.list.filter(i => i.lost);
    if (!mine.length) { k.once('coatcheck', `Lost & Found. Bring back what visitors dropped: ${this.items.filter(i => i.state === 'home').length} of ${this.items.length} returned.`, 5); return null; }
    const pay = mine.reduce((n, c) => n + ((this.items.find(i => i.id === c.id) || {}).pay || 40), 0);
    return { verb: 'HAND IN', hint: `Lost & Found: hand in ${mine.length === 1 ? 'what you found' : `all ${mine.length}`} for ${pay} chips.`, act: () => {
      let total = 0; const kinds = new Set();
      for (const c of mine) { k.carry.drop(c.id); const it = this.items.find(i => i.id === c.id); if (it) { it.state = 'home'; total += it.pay || 40; kinds.add(it.kind); } this.tally.add(c.id); }
      // a whole kind back (every glove, every phone...) is worth a bonus; all thirty, a big one
      const sets = [...kinds].filter(kd => this.items.filter(i => i.kind === kd).every(i => i.state === 'home'));
      total += sets.length * KIND_BONUS;
      const left = this.items.filter(i => i.state !== 'home').length;
      if (!left) total += ALL_BONUS;
      this._matrices(); k.chips(total); k.synth.chime([880, 1320, 1760], { vol: 0.05 });
      k.callout(`RETURNED · +${total} CHIPS`);
      const thanks = ['Oh, thank you! Somebody will be so pleased.', 'Wonderful. I will put a note on it.', 'That will make somebody’s morning.', 'Thank you, dear. Into the drawer it goes.'][this.tally.count % 4];
      const set = sets.length ? ` Every ${sets[0].name.replace(/^(a|an|somebody’s|a pair of) /, '')} is back: +${KIND_BONUS}.` : '';
      k.say(left ? `${thanks}${set} Returned ${this.items.length - left} of ${this.items.length}.` : `Every lost thing in the building is home. +${ALL_BONUS}!`, 6);
      if (!left) k.find('lostfound');
    } };
  },
  spots(k) {
    if (!this.placed && !placingNow()) { this.k = this.k || k; if (this.k) this.place(); }
    const out = (this.items || []).filter(i => i.state !== 'home').map(i => ({ kind: 'todo', id: i.id, name: 'Lost: ' + i.kind.name, x: i.x, y: i.y, z: i.z }));
    for (const b of this.boxes || []) out.push({ kind: 'secret', id: 'lostfound', name: b === this.box ? 'Lost & Found box' : 'Coat check (Lost & Found)', x: b.x, y: b.y, z: b.z });
    return out;
  },
  // A new night: whatever was being carried and not handed in is back where it was dropped.
  reset() { for (const it of this.items || []) if (it.state === 'carried') it.state = 'floor'; if (this.meshes) this._matrices(); },
});
