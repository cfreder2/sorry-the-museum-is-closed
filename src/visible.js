// What cannot be seen is not handed to the graphics card.   (A PROTOTYPE: on only with ?cull in the address.)
//
// three.js leaves out what is outside the camera's view, and nothing else: from the lobby it draws every gallery,
// roof and tree that lies beyond the wall you are looking at. Here every fixed thing in the world is given a bin (the
// room it stands in, or a square of a grid for what is in no room), and a table made beforehand says, for the room the
// camera is in, which bins can be seen from anywhere in that room. The rest go on a layer the camera does not draw:
// nothing is unloaded, so coming back to them costs nothing (unlike src/stream.js, which this does not replace).
//
// The table is data/pvs.json, made by tools/dev/pvs.mjs: the game is run headless, and from points all over every
// room (and every square of the grounds) the world is drawn with each bin in its own flat colour, six ways, and the
// colours that reach the picture are written down. (Solid things hide what is behind them in that drawing. Glass, cut-out
// textures, and whatever was not on show at the time are drawn too, as a stipple that hides nothing.) It is good for one plan only (it carries plan.made and the number of
// rooms): if the plan has moved on, nothing is hidden. Whenever the camera is somewhere the table does not cover
// (up on a roof, high in the air, inside a wall, any state but play, a cut scene) everything is drawn, as before.
//
// What is never hidden: anything not under the museum's group, anything that says userData.always (it moves about) or
// sits under something that does, anything found to have moved since it was counted, anything whose bin the table has
// never heard of (whatever was built after the table was made), and anything over 1.5 km across.

import * as THREE from 'three';
import { roomAt } from './plan.js';

const HIDDEN = 7;                 // the layer the camera does not draw (the same one src/stream.js uses)
export const CELL = 24;           // metres: the grid for what is in no room
const NUDGE = [[0, 0], [0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4]];

// The bin of a fixed thing, by the box it stands in: a room's id, 'c:ix:iz:band' for what is in no room, 'b:...' for one big thing, or null (always drawn).
export function binOf(plan, b) {
  const sx = b.max.x - b.min.x, sz = b.max.z - b.min.z;
  if (!isFinite(sx) || !isFinite(sz) || sx > 1500 || sz > 1500) return null;
  const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, cy = (b.min.y + b.max.y) / 2, foot = Math.min(b.max.y, b.min.y + 0.4);
  // too big for a square of the grid (a street, a wing's walls, a string of ten thousand lights): a bin of its own, named by its box
  if (sx > 48 || sz > 48) return `b:${Math.round(cx / 4)}:${Math.round(cz / 4)}:${Math.round(cy / 2)}:${Math.round(sx / 4)}:${Math.round(sz / 4)}`;
  // (a picture or a switch hangs on the room's edge: its centre is tried a step each way)
  for (const [dx, dz] of NUDGE) {
    const r = roomAt(plan, cx + dx, cz + dz, foot) || roomAt(plan, cx + dx, cz + dz, cy);
    if (!r) continue;
    // it has to fit the room, give or take a wall's thickness: something that only passes through belongs to the grid
    if (b.min.x > r.x0 - 1.5 && b.max.x < r.x1 + 1.5 && b.min.z > r.z0 - 1.5 && b.max.z < r.z1 + 1.5 && b.min.y > r.y - 1.5 && b.max.y < r.top + 1.5) return r.id;
    break;
  }
  return `c:${Math.floor(cx / CELL)}:${Math.floor(cz / CELL)}:${cy < -2 ? 'l' : cy < 4.9 ? 'g' : cy < 11 ? 's' : 't'}`;
}

// Where the camera is, as the table knows places: the ids of the rooms it is in; or ['o:ix:iz'] out of doors near the ground;
// or null anywhere else (everything is drawn). "Anywhere else" takes in the 0.3 m under a ceiling and over a floor: the
// table was made from points between half a metre off the floor and 0.4 m under the ceiling, and a camera in the slab
// between two levels (a drone pressed against the ceiling; the chase camera on a stair) sees things from underneath that
// no such point does. plan.js's roomAt() is not used: it allows 0.3 m either way and prefers the upper room, which is
// wrong for exactly those places.
const _keys = [];
export function keysAt(plan, p) {
  _keys.length = 0;
  for (const r of plan.rooms) if (p.x >= r.x0 && p.x <= r.x1 && p.z >= r.z0 && p.z <= r.z1 && p.y >= r.y - 0.35 && p.y <= r.top + 0.35) {
    if (p.y < r.y + 0.3 || p.y > r.top - 0.3) return null;
    _keys.push(r.id);
  }
  if (_keys.length) return _keys;
  if (p.y > 6 || p.y < -1) return null;
  for (const m of plan.masses) if (p.x > m.x0 && p.x < m.x1 && p.z > m.z0 && p.z < m.z1 && p.y < m.top) return null;      // in the thickness of the building
  _keys.push(`o:${Math.floor(p.x / CELL)}:${Math.floor(p.z / CELL)}`);
  return _keys;
}
export function keyAt(plan, p) { const k = keysAt(plan, p); return k ? k[0] : null; }      // (the first of them: for tests and tools)

export class Visibility {
  constructor(root, plan, pvs) {
    this.root = root; this.plan = plan; this.sig = null; this._ok = null; this.hidden = 0; this.ok = false;
    this.items = new Map();            // bin index -> things
    this.all = []; this._at = 0; this.movers = 0;      // every thing, with where it stood when it was counted (see _sweep)
    this._box = new THREE.Box3(); this._known = new WeakSet(); this.count = 0;
    if (!pvs || pvs.made !== plan.made || pvs.rooms !== plan.rooms.length || pvs.cell !== CELL) { console.warn('visible: the table (data/pvs.json) is for another plan: nothing is hidden. Make it again with tools/dev/pvs.mjs'); return; }
    this.bins = pvs.bins; this.index = new Map(pvs.bins.map((b, i) => [b, i])); this.from = pvs.from; this.on = new Uint8Array(pvs.bins.length).fill(1); this.ok = true;
    // The room over a room and the room under it are always drawn with it (a stair well, a balcony, a hole in the floor:
    // seen only from close to, at an angle the table's sample points may not have had).
    const R = plan.rooms, extra = new Map();
    for (const a of R) for (const b of R) if (a !== b && a.x0 < b.x1 + 1 && a.x1 > b.x0 - 1 && a.z0 < b.z1 + 1 && a.z1 > b.z0 - 1 && Math.abs(a.y - b.y) < 8) { const i = this.index.get(b.id); if (i != null && this.from[a.id]) { if (!extra.has(a.id)) extra.set(a.id, new Set(this.from[a.id])); extra.get(a.id).add(i); } }
    for (const [id, set] of extra) this.from[id] = [...set];
  }
  // Every mesh, line, point cloud and sprite under the root, by its bin. (Again later for what was built since: known things are passed over.)
  register() {
    if (!this.ok) return;
    const b = this._box, known = this._known;
    this.root.updateMatrixWorld(true);
    this.root.traverse(o => {
      if (known.has(o) || !(o.isMesh || o.isLine || o.isPoints || o.isSprite) || !o.geometry) return;
      known.add(o);
      for (let p = o; p; p = p.parent) if (p.userData && p.userData.always) return;
      try {
        if (o.isInstancedMesh) { o.computeBoundingBox(); b.copy(o.boundingBox).applyMatrix4(o.matrixWorld); }      // (measured afresh: a box made before the instances were set out is a box at the origin)
        else { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); }
      } catch { return; }
      if (b.isEmpty() || !isFinite(b.min.x) || !isFinite(b.max.x)) return;
      const bin = binOf(this.plan, b); if (bin == null) return;
      // A see-through thing that is in no room (marks and shade laid on the floors of a whole wing, the glass of a front) is
      // always drawn. The table cannot be trusted for these: its stand-in for a mark lying exactly on a floor loses to the
      // floor in the depth test, so the mark was written down as unseen (it showed: a trail of marks gone from Gallery 101).
      if (!this.plan.byId[bin]) { const ms = [].concat(o.material || []); if (ms.length && ms.every(m => m.transparent)) return; }
      const i = this.index.get(bin); if (i == null) return;                        // a bin the table has never heard of: always drawn
      let list = this.items.get(i); if (!list) this.items.set(i, list = []);
      const e = o.matrixWorld.elements;
      list.push(o); this.count++; this.all.push({ o, i, x: e[12], y: e[13], z: e[14], v: o.isInstancedMesh ? o.instanceMatrix.version : 0 });
      if (!this.on[i]) o.layers.set(HIDDEN);
    });
  }
  // Something that has moved since it was counted (a train, a mouse, a lift: whatever does not say userData.always and should)
  // cannot go by the bin it once stood in. A few hundred things are looked at each frame; one found to have moved is
  // taken out of its bin and drawn always from then on.
  _sweep(n = 400) {
    const all = this.all; if (!all.length) return;
    for (let k = 0; k < n; k++) {
      if (this._at >= all.length) this._at = 0;
      const it = all[this._at], e = it.o.matrixWorld.elements, dx = e[12] - it.x, dy = e[13] - it.y, dz = e[14] - it.z;
      if (dx * dx + dy * dy + dz * dz > 0.25 || (it.o.isInstancedMesh && it.o.instanceMatrix.version !== it.v)) {      // (or its instances have been set out again)
        const list = this.items.get(it.i), j = list ? list.indexOf(it.o) : -1; if (j >= 0) { list[j] = list[list.length - 1]; list.pop(); }
        it.o.layers.set(0); this.movers++; this.count--;
        all[this._at] = all[all.length - 1]; all.pop();
      } else this._at++;
    }
  }
  // cam: the camera's position. toyRoom: the room the toy is in (the camera may have backed out of it through a wall). all: draw everything.
  update(cam, toyRoom, all) {
    if (!this.ok) return;
    this._sweep();
    if (this.off) all = true;                    // (a test aid: everything drawn, to compare against)
    // every place the camera is in, and the toy's room: all must be in the table, or everything is drawn
    const keys = all ? null : keysAt(this.plan, cam), last = this._last || (this._last = []); let ok = !!keys;
    if (ok) { if (toyRoom && !keys.includes(toyRoom)) keys.push(toyRoom); for (let j = 0; j < keys.length; j++) if (!this.from[keys[j]]) { ok = false; break; } }
    let same = ok === this._ok && (!ok || last.length === keys.length);
    if (same && ok) for (let j = 0; j < keys.length; j++) if (last[j] !== keys[j]) { same = false; break; }
    if (same) return;                                   // (the usual case: nothing is made or worked out on a frame where the camera has not changed rooms)
    this._ok = ok; last.length = 0; if (ok) for (let j = 0; j < keys.length; j++) last.push(keys[j]);
    this.sig = ok ? last.join('|') : '*';
    const want = this._want || (this._want = new Uint8Array(this.bins.length));
    if (!ok) want.fill(1);
    else { want.fill(0); for (const k of last) { for (const i of this.from[k]) want[i] = 1; const own = this.index.get(k); if (own != null) want[own] = 1; } }
    let hidden = 0;
    for (const [i, list] of this.items) {
      if (want[i] !== this.on[i]) { const layer = want[i] ? 0 : HIDDEN; for (const o of list) o.layers.set(layer); this.on[i] = want[i]; }
      if (!want[i]) hidden += list.length;
    }
    this.hidden = hidden;
  }
}
