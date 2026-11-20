// Lost property. Visitors leave things behind: a glove, a ticket, a teddy bear. They lie where they
// were dropped, on the floors of the quieter galleries. Drive into one and it rides on the toy (three
// at a time); take them down to the Lost & Found box in the staff canteen and each is worth 20 chips.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { freeFloor, wallSpots, sameFloor, rng } from './density.js';

const KEY = 'after-hours.lost';
const N = 30, CARRY = 3, REWARD = 20;

// ------------------------------------------------------------------ the things --
// Each a few simple shapes in their own colours, lying flat as dropped. Sizes are real: a toy car is 46 cm long.
function paint(g, hex) { const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
const box = (w, h, d, x, y, z, hex, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.rotateY(ry); g.translate(x, y, z); return paint(g, hex); };
const ball = (r, x, y, z, hex, sx = 1, sy = 1, sz = 1) => { const g = new THREE.SphereGeometry(r, 10, 7); g.scale(sx, sy, sz); g.translate(x, y, z); return paint(g, hex); };
const rod = (r, len, x, y, z, hex, rx = 0, rz = 0, ry = 0) => { const g = new THREE.CylinderGeometry(r, r, len, 8); g.rotateX(rx); g.rotateZ(rz); g.rotateY(ry); g.translate(x, y, z); return paint(g, hex); };
const ring = (r, t, x, y, z, hex, rx = Math.PI / 2) => { const g = new THREE.TorusGeometry(r, t, 6, 16); g.rotateX(rx); g.translate(x, y, z); return paint(g, hex); };
const strip = (n, w, d, h, hexes) => { const parts = []; for (let i = 0; i < n; i++) parts.push(box(w / n + 0.001, h, d, -w / 2 + (i + 0.5) * w / n, h / 2, 0, hexes[i % hexes.length])); return parts; };

const KINDS = [
  { id: 'glove', name: 'a red leather glove', make: () => [box(0.1, 0.025, 0.11, 0, 0.013, 0, 0xa82424), ...[-0.036, -0.012, 0.012, 0.036].map((x, i) => rod(0.011, 0.07 - (i === 0 ? 0.015 : 0), x, 0.014, 0.085, 0xa82424, Math.PI / 2)), rod(0.012, 0.06, 0.065, 0.014, 0.02, 0xa82424, Math.PI / 2, 0, -0.7), box(0.1, 0.026, 0.05, 0, 0.013, -0.075, 0x7a1616)] },
  { id: 'mitten', name: 'a blue knitted mitten', make: () => [ball(0.06, 0, 0.022, 0, 0x2f5fa8, 1, 0.35, 1.6), ball(0.026, 0.06, 0.02, 0.02, 0x2f5fa8, 1, 0.7, 1.6), box(0.11, 0.035, 0.05, 0, 0.018, -0.105, 0xe9e2d0)] },
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

export class LostFound {
  constructor(G, { secrets, say, callout, sound }) {
    this.G = G; this.say = say; this.callout = callout; this.sound = sound; this.secrets = secrets;
    secrets.add('lostfirst', 'Somebody dropped this').add('lostfound', 'Lost and found');
    this.items = []; this.carried = []; this.box = null;
    this.returned = new Set(); try { for (const id of JSON.parse(localStorage.getItem(KEY) || '{}').returned || []) this.returned.add(id); } catch { /* fine */ }
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify({ returned: [...this.returned] })); } catch { /* fine */ } }

  place(taken) {
    const G = this.G, P = G.plan, r = rng(1957);
    // Where: anywhere a visitor walks, the emptiest first (furthest from anything there is to find already).
    const cands = [];
    for (const room of P.rooms) {
      if (room.secret || room.passage || room.kind === 'hall' && false) continue;
      const w = room.x1 - room.x0, d = room.z1 - room.z0; if (w < 3 || d < 3 || w * d < 14) continue;
      if (!(room.kind === 'gallery' || room.kind === 'corridor' || room.kind === 'hall' || /lobby|corridor|passage|caf|shop|restroom|cloak|lounge|foyer/i.test(room.gallery || '') || room.use === 'cafe')) continue;
      const s = freeFloor(P, room, room.x0 + w * (0.3 + 0.4 * r()), room.z0 + d * (0.3 + 0.4 * r()), 0.35);
      if (s) cands.push({ x: s.x, y: room.y, z: s.z, room, gallery: room.kind === 'gallery' });
    }
    const chosen = [];
    for (let k = 0; k < N && cands.length; k++) {
      let best = null, bd = -1;
      for (const c of cands) { let d = 1e9; for (const t of taken) d = Math.min(d, sameFloor(c, t)); for (const t of chosen) d = Math.min(d, sameFloor(c, t)); d = Math.min(d, 200) * (c.gallery ? 1.15 : 1); if (d > bd) { bd = d; best = c; } }
      chosen.push(best); cands.splice(cands.indexOf(best), 1);
    }
    this.items = chosen.map((c, i) => ({ id: 'lost' + i, kind: KINDS[i % KINDS.length], x: c.x, y: c.y, z: c.z, room: c.room.id, yaw: r() * 6.28, state: 'floor' }));
    for (const it of this.items) { if (this.returned.has(it.id)) it.state = 'home'; taken.push({ x: it.x, y: it.y, z: it.z }); }
    // The Lost & Found box: in the staff canteen, where the board says to bring things.
    const canteen = P.rooms.find(q => /^Staff canteen/i.test(q.gallery || '')) || P.rooms.find(q => /canteen|staff room/i.test(q.gallery || ''));
    if (canteen) {
      const ws = wallSpots(P, G.museum, canteen, { depth: 0.9, width: 0.5, height: 1.1 });
      const cx = (canteen.x0 + canteen.x1) / 2, cz = (canteen.z0 + canteen.z1) / 2;
      ws.sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz));
      const w = ws[0];
      if (w) { this.box = { x: w.x + w.nx * 0.32, y: canteen.y, z: w.z + w.nz * 0.32, nx: w.nx, nz: w.nz, room: canteen.id }; P.obstacles.push({ x0: this.box.x - 0.32, x1: this.box.x + 0.32, z0: this.box.z - 0.32, z1: this.box.z + 0.32, y0: canteen.y, y1: canteen.y + 0.95 }); }
    }
    this._build();
  }

  _build() {
    const G = this.G, group = this.group = new THREE.Group(); group.name = 'lost property';
    this.mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, emissive: 0x15161c, emissiveIntensity: 0.5 });
    this.geos = {}; this.meshes = {};
    for (const k of KINDS) {
      const its = this.items.filter(i => i.kind === k); if (!its.length) continue;
      const geo = this.geos[k.id] = mergeGeometries(k.make().map(g => g.index ? g.toNonIndexed() : g));
      const m = this.meshes[k.id] = new THREE.InstancedMesh(geo, this.mat, its.length); m.frustumCulled = false; group.add(m);
      its.forEach((it, j) => { it.mesh = m; it.slot = j; });
    }
    this._matrices();
    if (this.box) {
      const b = this.box, bg = new THREE.Group();
      const wood = new THREE.MeshStandardMaterial({ color: 0x7a5432, roughness: 0.7, emissive: 0x2a1a0e, emissiveIntensity: 0.5 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.85, 0.5), wood); body.position.y = 0.425; bg.add(body);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.05, 0.54), wood); lid.position.y = 0.875; bg.add(lid);
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.05), new THREE.MeshBasicMaterial({ color: 0x0a0806 })); slot.position.set(0, 0.88, 0.1); bg.add(slot);
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const c = cv.getContext('2d');
      c.fillStyle = '#f3ecd8'; c.fillRect(0, 0, 256, 128); c.strokeStyle = '#7a5432'; c.lineWidth = 6; c.strokeRect(3, 3, 250, 122);
      c.fillStyle = '#2a1e12'; c.textAlign = 'center'; c.font = '700 34px Georgia, serif'; c.fillText('LOST', 128, 52); c.fillText('PROPERTY', 128, 92); c.font = 'italic 16px Georgia, serif'; c.fillText('hand it in here', 128, 116);
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(0.85, 0.85, 0.85) })); sign.position.set(0, 0.5, 0.252); bg.add(sign);
      bg.position.set(b.x, b.y, b.z); bg.rotation.y = Math.atan2(b.nx, b.nz); group.add(bg);
    }
    G.museum.group.add(group);
  }
  _matrices() {
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), Z = new THREE.Vector3(0, 0, 0);
    for (const it of this.items) { if (!it.mesh) continue; Q.setFromAxisAngle(V.set(0, 1, 0), it.yaw); it.mesh.setMatrixAt(it.slot, M.compose(V.set(it.x, it.y + 0.002, it.z), Q, it.state === 'floor' ? S : Z)); }
    for (const m of Object.values(this.meshes)) m.instanceMatrix.needsUpdate = true;
  }

  update(dt, live) {
    if (!live || !this.group) return;
    const G = this.G, v = G.vehicle; if (!v) return;
    const p = v.pos;
    // Picking up: drive into it.
    if (this.carried.length < CARRY) for (const it of this.items) {
      if (it.state !== 'floor' || Math.abs(p.y - it.y) > 0.6 || Math.abs(p.x - it.x) > 0.6 || Math.abs(p.z - it.z) > 0.6) continue;
      if (Math.hypot(p.x - it.x, p.z - it.z) > 0.42) continue;
      it.state = 'carried'; this.carried.push(it); this._matrices(); this._carry();
      this.sound.tick(0.08, 2600, 0.05);
      const first = this.secrets.find('lostfirst');
      this.say(`Picked up ${it.kind.name}.${first ? ' Somebody will want that back: the Lost & Found box is in the staff canteen, on the lower level.' : ` Carrying ${this.carried.length} of ${CARRY}.`}`, 0, first ? 7 : 3);
      if (this.carried.length >= CARRY) this.say('That is all the toy can carry. Take them down to the Lost & Found in the staff canteen.', 1.2, 5);
      break;
    }
    // The carried things ride on whichever toy is in use.
    if (this.carryOn !== v.group && this.carried.length) this._carry();
    // Handing in.
    const b = this.box;
    if (b && this.carried.length && Math.abs(p.y - b.y) < 0.8 && Math.hypot(p.x - b.x, p.z - b.z) < 1.3) {
      const n = this.carried.length;
      for (const it of this.carried) { it.state = 'home'; this.returned.add(it.id); }
      this.carried = []; this._carry(); this._matrices(); this.save();
      if (G.poker && G.poker.earn) G.poker.earn(n * REWARD);
      if (this.sound.bell) { this.sound.bell(880, 0, 0.05, 1.2); this.sound.bell(1320, (this.sound.ctx ? this.sound.ctx.currentTime : 0) + 0.12, 0.04, 1.4); }
      const left = this.items.filter(i => i.state !== 'home').length;
      this.callout(`HANDED IN · +${n * REWARD} CHIPS`);
      this.say(left ? `Thank you. ${this.items.length - left} of ${this.items.length} lost things returned.` : 'Every lost thing in the building has been handed in.', 0.6, 5);
      if (!left) this.secrets.find('lostfound');
    }
  }
  _carry() {
    const v = this.G.vehicle; if (!v) return;
    if (this.carryGroup) this.carryGroup.parent && this.carryGroup.parent.remove(this.carryGroup);
    const g = this.carryGroup = new THREE.Group(); this.carryOn = v.group;
    this.carried.forEach((it, i) => {
      const geo = this.geos[it.kind.id]; geo.computeBoundingBox(); const bb = geo.boundingBox, size = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z, bb.max.y - bb.min.y), k = Math.min(1, 0.2 / size);
      const m = new THREE.Mesh(geo, this.mat); m.scale.setScalar(k); m.position.set((i - (this.carried.length - 1) / 2) * 0.1, v.kind === 'drone' ? 0.06 : 0.2, -0.06 - i * 0.03); m.rotation.y = i * 0.9; g.add(m);
    });
    v.group.add(g);
  }
  spots() {
    const out = this.items.filter(i => i.state !== 'home').map(i => ({ kind: 'todo', id: i.id, name: 'Lost: ' + i.kind.name, x: i.x, y: i.y, z: i.z }));
    if (this.box) out.push({ kind: 'secret', id: 'lostfound', name: 'Lost & Found box', x: this.box.x, y: this.box.y, z: this.box.z });
    return out;
  }
}
