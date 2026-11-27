// What cannot be seen is not handed to the graphics card.   (On only with ?cull in the address: main.js fetches nothing and makes nothing here without it.)
//
// three.js leaves out what is outside the camera's view, and nothing else: from the lobby it draws every gallery, roof
// and tree that lies beyond the wall you are looking at. Here every thing in the world that never moves is filed under
// a bin (the room it stands in, or a 24 m square of one storey for what is in no room), and a table made beforehand
// (data/pvs.json, by tools/dev/pvs.mjs) says, for the place the camera is in, which bins can be seen from anywhere in
// that place. The rest go on a layer the camera does not draw. Nothing is unloaded, so coming back costs nothing.
//
// THE RULE: when in doubt, draw it. Everything is drawn, exactly as without the flag, whenever
//   - there is no table, or it was made for another plan (plan.made, the rooms, a hash of the plan's boxes);
//   - one of the walls, floors and roofs the table counted on to hide things is missing, hidden or has moved (each is
//     known by a fingerprint of its shape and place, and looked at every frame: a wall a feature opens later switches
//     the whole system off until it is shut again);
//   - the camera is somewhere the table has no line for (inside a wall or a slab, over 50 m up, off the map), in any
//     state but play and looking at a work, in a cut scene, on a staged view, or under ?lowmem (the streamer's job);
//   - anything in here throws.
// And a thing is never hidden if it is not plainly fixed: not under the museum's group; marked userData.always or under
// something that is; drawn by a shader that places it (frustumCulled off, instanced geometry, bones, batches); with a
// buffer that is rewritten, a box that is a point, or a hook that runs when it is drawn; not inside the box the table
// tested for its bin (so anything built after the table was made, or built somewhere else, is drawn); or once it has
// been seen to move, turn, or have its instances or vertices set again (looked for every frame: from then on it is
// always drawn).
//
// Two layers, because the floor's reflection is a second drawing from below the floor: what the view needs is on layer
// 0; what only the reflection needs (what can be seen from the rooms whose floors you can see) is on MIRROR, which the
// reflection's camera also draws; the rest is on HIDDEN (the layer src/stream.js uses: the two are never on together).

import * as THREE from 'three';

export const HIDDEN = 7, MIRROR = 8;
export const CELL = 24;                                   // metres: the squares for what is in no room, and for the camera out of doors
export const BANDS = [-6.5, -0.55, 4.95, 11.05, 18];      // the storeys of those squares, by a thing's middle: the floors' slabs lie on these
export const TOPS = [6, 14, 26, 50];                      // the camera out of doors: near the ground, roof height, over the roofs, the sky (over 50 m: everything)
export const FLOOR = 0.05, CEIL = 0.03;                   // how near a floor or a ceiling the camera may be and still be "in the room"
const TOL = 0.45, STATIC = 35044, NOOP = THREE.Object3D.prototype.onBeforeRender, NOOP2 = THREE.Object3D.prototype.onAfterRender;

export const bandOf = y => { let i = 0; while (i < BANDS.length && y >= BANDS[i]) i++; return i; };
export const topOf = y => { if (y < -8) return -1; for (let i = 0; i < TOPS.length; i++) if (y < TOPS[i]) return i; return -1; };
export const cellKey = (x, z, y) => { const t = topOf(y); return t < 0 ? null : `o:${Math.floor(x / CELL)}:${Math.floor(z / CELL)}:${t}`; };
export const ceilOf = r => Math.min(r.top, r.ceil == null ? r.top : r.y + r.ceil);      // (a room's `ceil` is its ceiling's height over its own floor; the hall's is its vault, above its box)

// ---- shared with tools/dev/pvs-page.js, so that the table and the game cannot disagree about what a thing is ----

/** Vertices that are let go of once they are on the graphics card (the back rooms' fittings, the light switches): they cannot be read here, now or later. */
export const loose = p => !(p.data || p).array || Object.prototype.hasOwnProperty.call(p, 'onUploadCallback');
/** May this ever be hidden? (Its shape and place can be trusted to stay as they are.) Its box is looked at separately. */
export function fixed(o) {
  if (!(o.isMesh || o.isSprite || o.isLine || o.isPoints) || o.isSkinnedMesh || o.isBatchedMesh || o.frustumCulled === false) return false;
  const g = o.geometry; if (!g || g.isInstancedBufferGeometry) return false;
  const p = g.attributes && g.attributes.position; if (!p || (p.isInterleavedBufferAttribute ? p.data.usage : p.usage) !== STATIC) return false;
  if (o.onBeforeRender !== NOOP || o.onAfterRender !== NOOP2) return false;
  if (o.isInstancedMesh && (o.count === 0 || o.instanceMatrix.usage !== STATIC)) return false;
  if (o.morphTargetInfluences && o.morphTargetInfluences.length) return false;
  for (let q = o; q; q = q.parent) if (q.userData && q.userData.always) return false;
  return true;
}
/** The box a thing stands in, in the world, into b; false if it has none worth the name. (An instanced mesh is measured afresh: a box made before its instances were set out is a box at the origin.) */
export function boxOf(o, b) {
  try {
    if (o.isSprite) { const e = o.matrixWorld.elements, r = 0.75 * Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6])); b.min.set(e[12] - r, e[13] - r, e[14] - r); b.max.set(e[12] + r, e[13] + r, e[14] + r); }
    else if (o.isInstancedMesh) { o.computeBoundingBox(); b.copy(o.boundingBox).applyMatrix4(o.matrixWorld); }
    else {
      const g = o.geometry, p = g.attributes.position;
      if (loose(p)) { if (!g.boundingSphere) { if (!(p.data || p).array) return false; g.computeBoundingSphere(); } const c = g.boundingSphere.center, r = g.boundingSphere.radius; b.min.set(c.x - r, c.y - r, c.z - r); b.max.set(c.x + r, c.y + r, c.z + r); b.applyMatrix4(o.matrixWorld); }      // (its ball, which three.js made before the vertices went: the same answer whenever it is asked)
      else { if (!g.boundingBox) g.computeBoundingBox(); b.copy(g.boundingBox).applyMatrix4(o.matrixWorld); }
    }
  } catch { return false; }
  if (b.isEmpty() || !isFinite(b.min.x + b.min.y + b.min.z + b.max.x + b.max.y + b.max.z)) return false;
  const sx = b.max.x - b.min.x, sy = b.max.y - b.min.y, sz = b.max.z - b.min.z;
  return sx + sy + sz > 1e-3 && sx < 3000 && sz < 3000;      // (a point is a buffer nobody has written yet)
}
/** A fingerprint of a thing's shape and place: the same thing gives the same one in the tool and in the game, and a wall that has been moved, cut or rebuilt gives another. */
export function sigOf(o, b) {
  let h1 = 0x811c9dc5, h2 = 0x1b873593;
  const add = v => { const i = Math.round(v * 500) | 0; h1 = Math.imul(h1 ^ i, 16777619); h2 = Math.imul(h2 + i ^ (h2 >>> 15), 0x2c1b3c6d); };
  add(b.min.x); add(b.min.y); add(b.min.z); add(b.max.x); add(b.max.y); add(b.max.z);
  const g = o.geometry, p = g.attributes.position, n = p.count, ix = g.index; add((ix ? ix.count : n) / 500); add(n / 500);
  const e = o.matrixWorld.elements; for (let i = 0; i < 16; i++) add(e[i]);
  if (!loose(p)) for (let k = 0, st = Math.max(1, Math.floor(n / 96)); k < n; k += st) { add(p.getX(k)); add(p.getY(k)); add(p.getZ(k)); }
  if (o.isInstancedMesh) { const a = o.instanceMatrix.array, c = o.count * 16; add(o.count / 500); for (let k = 0, st = Math.max(1, Math.floor(c / 256)); k < c; k += st) add(a[k]); }
  return (h1 >>> 0).toString(36) + '.' + (h2 >>> 0).toString(36);
}
/** Could this hide what is behind it, as far as the thing itself can tell? A plain solid mesh, not tiny. (Places.fabric() then asks where it stands; and the tool, that it was on show, stood still through everything the tool tried, and was there before the park's lazy features were built.) */
export function wallLike(o, b) {
  if (!o.isMesh || o.isInstancedMesh || !fixed(o) || loose(o.geometry.attributes.position) || (o.geometry.index && !o.geometry.index.array)) return false;
  const ms = Array.isArray(o.material) ? o.material : [o.material]; if (!ms.length) return false;
  for (const m of ms) if (!m || m.transparent || m.opacity < 1 || m.alphaTest > 0 || m.alphaHash || m.alphaMap || m.depthWrite === false || m.depthTest === false || m.visible === false || m.colorWrite === false || m.wireframe || m.isShaderMaterial || m.isRawShaderMaterial || m.displacementMap || m.side !== ms[0].side) return false;
  const g = o.geometry, dr = g.drawRange; if (dr && (dr.start !== 0 || dr.count !== Infinity)) return false;
  const s = [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z].sort((p, q) => q - p);
  return s[0] >= 1 && s[1] >= 0.3;
}
/** Is every part of it, and everything it hangs from, switched on? */
export const onShow = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };

/** A hash of the boxes that say where the camera can be and what a room is: rooms, doorways, the blocks of the building. */
export function planHash(plan) {
  let h = 0x811c9dc5; const add = v => { h = Math.imul(h ^ (typeof v === 'number' ? Math.round(v * 1000) | 0 : 0), 16777619); }, str = s => { for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); };
  for (const r of plan.rooms) { str(r.id); add(r.x0); add(r.x1); add(r.z0); add(r.z1); add(r.y); add(r.top); add(ceilOf(r)); }
  for (const d of plan.doors) { if (d.gone) continue; str(d.id + '>' + d.a + '>' + d.b); add(d.x0); add(d.x1); add(d.z0); add(d.z1); add(d.y); add(d.h); add(d.shut ? 1 : 0); }
  for (const m of plan.masses) { add(m.x0); add(m.x1); add(m.z0); add(m.z1); add(m.top); }
  return (h >>> 0).toString(36);
}

/** Rooms and bins by where things are: the tool makes one, and so does the game, from the same plan. */
export class Places {
  constructor(plan) {
    this.plan = plan; this.grid = new Map(); this.G = 8;
    for (const r of plan.rooms) { r._c = ceilOf(r); for (let ix = Math.floor(r.x0 / 8); ix <= Math.floor(r.x1 / 8); ix++) for (let iz = Math.floor(r.z0 / 8); iz <= Math.floor(r.z1 / 8); iz++) { const k = ix * 4096 + iz; let l = this.grid.get(k); if (!l) this.grid.set(k, l = []); l.push(r); } }
    this.doors = plan.doors.filter(d => !d.shut && !d.gone && (plan.byId[d.a] || plan.byId[d.b]));
    this.none = [];
  }
  near(x, z) { return this.grid.get(Math.floor(x / 8) * 4096 + Math.floor(z / 8)) || this.none; }
  /** Is a wall-like thing with this box part of the fabric? Anything 6 m by 2 m or more is (walls, floors, roofs, the ground). Anything smaller only if it is in the
   * thickness of the building and not standing in a room: the lining of a duct, the reveal of a doorway. (Not furniture, which the toy can shove; not what stands out of doors.) */
  fabric(b) {
    const s = [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z].sort((p, q) => q - p); if (s[0] >= 6 && s[1] >= 2) return true;
    const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
    for (const r of this.near(cx, cz)) if (b.min.x >= r.x0 + 0.02 && b.max.x <= r.x1 - 0.02 && b.min.z >= r.z0 + 0.02 && b.max.z <= r.z1 - 0.02 && b.min.y >= r.y - 0.02 && b.max.y <= r.top + 0.02) return false;
    for (const m of this.plan.masses) if (cx > m.x0 - 1 && cx < m.x1 + 1 && cz > m.z0 - 1 && cz < m.z1 + 1 && b.min.y < m.top + 1) return true;
    return false;
  }
  /** The bin of a thing by its box: a room's id if it fits in one (give or take a wall), 'c:ix:iz:storey' if it is in none and no bigger than a square, or null (bigger: the table lists the squares it passes through, by its fingerprint). */
  binOf(b) {
    const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, cy = (b.min.y + b.max.y) / 2;
    let best = null, area = Infinity;
    for (const r of this.near(cx, cz)) {
      if (b.min.x < r.x0 - TOL || b.max.x > r.x1 + TOL || b.min.z < r.z0 - TOL || b.max.z > r.z1 + TOL || b.min.y < r.y - 0.6 || b.max.y > r.top + 0.6) continue;
      const a = (r.x1 - r.x0) * (r.z1 - r.z0) * (r.top - r.y); if (a < area) { area = a; best = r; }
    }
    if (best) return best.id;
    if (b.max.x - b.min.x > CELL || b.max.z - b.min.z > CELL) return null;
    return `c:${Math.floor(cx / CELL)}:${Math.floor(cz / CELL)}:${bandOf(cy)}`;
  }
  /** Where a camera at p is, as the table knows places, into out: the rooms it is in; or, in a doorway or a well between two places, both; or the square of the open air; or null (in a wall, a slab, the ground: nobody can say what is seen from there). `has` says whether the table has a line for a name; links are the table's wells and open tops. */
  keysAt(p, out, has, links) {
    out.length = 0; let slab = false; const x = p.x, y = p.y, z = p.z;
    for (const r of this.near(x, z)) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1 && y > r.y - 0.4 && y < r.top + 0.4) { if (y >= r.y + FLOOR && y <= r._c - CEIL) out.push(r.id); else slab = true; }
    if (out.length) return out;
    for (const d of this.doors) if (x >= d.x0 - 0.05 && x <= d.x1 + 0.05 && z >= d.z0 - 0.05 && z <= d.z1 + 0.05 && y >= d.y + FLOOR && y <= d.y + d.h - CEIL) {
      for (const id of [d.a, d.b]) { if (this.plan.byId[id]) { if (!out.includes(id)) out.push(id); } else { const k = cellKey(x, z, y); if (!k || !has(k)) return null; if (!out.includes(k)) out.push(k); } }
    }
    if (out.length) return out;
    if (links) for (let i = 0; i < links.length; i++) { const l = links[i]; if (x >= l[0] && x <= l[1] && y >= l[2] && y <= l[3] && z >= l[4] && z <= l[5]) { for (let j = 6; j < 8; j++) { const k = l[j] === '*' ? cellKey(x, z, y) : l[j]; if (!k || !has(k)) return null; if (!out.includes(k)) out.push(k); } } }
    if (out.length) return out;
    if (slab) return null;
    for (const m of this.plan.masses) if (x > m.x0 && x < m.x1 && z > m.z0 && z < m.z1 && y < m.top + 0.15) return null;      // in the thickness of the building
    const k = cellKey(x, z, y); if (!k || !has(k)) return null;
    out.push(k); return out;
  }
}

// ---- the table's lists, packed: runs of bins not seen and seen, by turns, as bytes (a number over 127 takes two or three) ----
export function pack(bits) {
  const out = []; let i = 0, v = 0; const n = bits.length;
  while (i < n) { let j = i; while (j < n && !!bits[j] === !!v) j++; let run = j - i; do { out.push((run & 127) | (run > 127 ? 128 : 0)); run >>>= 7; } while (run); i = j; v ^= 1; }
  let s = ''; for (const c of out) s += String.fromCharCode(c); return btoa(s);
}
export function unpack(str, n) {
  const s = atob(str), list = []; let i = 0, at = 0, v = 0;
  while (i < s.length && at < n) { let run = 0, sh = 0, c; do { c = s.charCodeAt(i++); run |= (c & 127) << sh; sh += 7; } while (c & 128); if (v) for (let k = 0; k < run; k++) list.push(at + k); at += run; v ^= 1; }
  return Uint16Array.from(list);
}

// ---- the game's side ----
const _box = new THREE.Box3(), _keys = [], _toy = [];
export class Visibility {
  /** root: the museum's group. pvs: the table as fetched. mirrorCam: the floor reflection's camera (it is told to draw MIRROR too). renderer: for the readout's count of draw calls (?cull&diag). */
  constructor(root, plan, pvs, mirrorCam, renderer) {
    this.root = root; this.plan = plan; this.ok = false; this.live = false; this.why = ''; this.sig = '*'; this.off = false;
    this.items = []; this.count = 0; this.shown = 0; this.movers = 0; this.never = 0; this.seen = 0; this.ms = 0;
    this._known = new WeakSet(); this._at = 0; this._all = true; this._last = []; this._lastY = null; this._frame = 0;
    try {
      if (!pvs || pvs.v !== 3) return void (this.why = 'no table, or an old one');
      if (pvs.made !== plan.made || pvs.rooms !== plan.rooms.length || pvs.cell !== CELL || pvs.plan !== planHash(plan)) return void (this.why = 'the table is for another plan');
      for (let i = 0; i < plan.rooms.length; i++) if (pvs.bins[i] !== plan.rooms[i].id) return void (this.why = 'the table is for another plan');
      this.pvs = pvs; this.places = new Places(plan); this.n = pvs.bins.length; this.index = new Map(pvs.bins.map((b, i) => [b, i])); this.box = pvs.box;
      this.rows = new Map(Object.entries(pvs.of)); this.lists = new Array(pvs.sets.length); this.has = k => this.rows.has(k);
      this.byBin = Array.from({ length: this.n }, () => []); this.multi = [];
      this.want = new Uint8Array(this.n); this.state = new Uint8Array(this.n);      // per bin: 0 drawn, 1 hidden, 2 the reflection only
      this.walls = new Map(pvs.occ.map(s => [s, null])); this.wallList = []; this.missing = this.walls.size;
      this.mirrorCam = mirrorCam || null; if (mirrorCam) mirrorCam.layers.enable(MIRROR);
      this._mcache = new Map(); this._near = new Map();
      this.ok = true;
    } catch (e) { this.ok = false; this.why = 'the table could not be read: ' + e; }
    if (!this.ok) console.warn('visible: ' + this.why + ': nothing is hidden. Make it again with tools/dev/pvs.mjs');
    try { if (renderer && /[?&]diag\b/.test(location.search)) this._readout(renderer); } catch {}
  }
  list(key) { const r = this.rows.get(key); return this.lists[r] || (this.lists[r] = unpack(this.pvs.sets[r], this.n)); }

  /** Every thing under the root that is new since last time is looked at once: filed under its bin, or left alone (always drawn). */
  register() {
    if (!this.ok) return;
    try {
      const known = this._known, b = _box, B = this.box, first = !this.seen;
      if (first) this.root.updateMatrixWorld(true);
      this.root.traverse(o => {
        if (known.has(o) || !(o.isMesh || o.isLine || o.isPoints || o.isSprite)) return;
        known.add(o); this.seen++;
        if (!fixed(o)) { this.never++; return; }
        if (!first) o.updateWorldMatrix(true, false);      // (built since the last frame was drawn: three.js has not yet worked out where it is)
        if (!boxOf(o, b)) { this.never++; return; }
        // one of the walls the table counted on? (kept an eye on, whether or not it is ever hidden itself)
        let wall = false;
        if (this.missing && wallLike(o, b) && this.places.fabric(b)) { const s = sigOf(o, b); if (this.walls.has(s) && !this.walls.get(s)) { wall = true; this.walls.set(s, o); this.missing--; } }
        let bin = this.places.binOf(b), bins = null, i = -1;
        if (bin === null) { bins = this.pvs.big[sigOf(o, b)]; if (!bins) { if (wall) this._wall(o); this.never++; return; } }
        else {
          i = this.index.get(bin); if (i == null) { if (wall) this._wall(o); this.never++; return; }      // a bin the table has never heard of
          const k = i * 6;                                                                                  // and it has to lie inside the box the table tested for that bin
          if (b.min.x < B[k] - 0.02 || b.min.y < B[k + 1] - 0.02 || b.min.z < B[k + 2] - 0.02 || b.max.x > B[k + 3] + 0.02 || b.max.y > B[k + 4] + 0.02 || b.max.z > B[k + 5] + 0.02) { if (wall) this._wall(o); this.never++; return; }
        }
        const e = o.matrixWorld.elements, p = o.geometry.attributes.position;
        const pa = p.data || p, im = o.isInstancedMesh ? o.instanceMatrix : null;
        const it = { o, i, bins, wall, s: 0, dead: false, e, p: o.position, g: o.geometry, pa, im, x: e[12], y: e[13], z: e[14], t: e[0] + e[5] + e[10] + e[1] + e[6] + e[8], lx: o.position.x, ly: o.position.y, lz: o.position.z,
          iv: im ? im.version : 0, ic: im ? o.count : 0, gv: pa.version, mask: o.layers.mask };
        this.items.push(it); this.count++;
        if (bins) this.multi.push(it); else this.byBin[i].push(it);
        if (wall) this.wallList.push(it);
        if (!this._all) this._set(it, bins ? this._multiState(bins) : this.state[i]);
      });
    } catch (e) { this._fail(e); }
  }
  _wall(o) { const e = o.matrixWorld.elements; this.wallList.push({ o, wall: true, lone: true, dead: false, e, x: e[12], y: e[13], z: e[14], t: e[0] + e[5] + e[10] + e[1] + e[6] + e[8] }); }
  _fail(e) { this.ok = false; this.why = 'an error: ' + e; console.warn('visible: ' + this.why + ': everything is drawn from here on'); try { for (const it of this.items) it.o.layers.mask = it.mask; } catch {} }
  _set(it, s) { if (it.s !== s && !it.dead) { it.s = s; it.o.layers.mask = s === 0 ? it.mask : s === 1 ? 1 << HIDDEN : 1 << MIRROR; } }
  _multiState(bins) { let m = 1; for (let k = 0; k < bins.length; k++) { const s = this.state[bins[k]]; if (s === 0) return 0; if (s === 2) m = 2; } return m; }

  // Every thing filed, every frame: has it moved, turned, or had its instances or its vertices set again? Then it is not a
  // fixed thing after all: it is drawn from now on, wherever it goes. (A thing's own position is looked at as well as its
  // place in the world, which three.js only brings up to date when it draws: so a thing a feature has just carried off is
  // caught in the frame it goes.) And each wall the table counted on: still there, still on show, still where it was?
  _sweep() {
    const items = this.items; let live = this.missing === 0, lost = null;
    for (let k = 0; k < items.length; k++) {
      const it = items[k], e = it.e, p = it.p;
      if (e[12] !== it.x || e[13] !== it.y || e[14] !== it.z || p.x !== it.lx || p.y !== it.ly || p.z !== it.lz || e[0] + e[5] + e[10] + e[1] + e[6] + e[8] !== it.t || it.pa.version !== it.gv || (it.im !== null && (it.im.version !== it.iv || it.o.count !== it.ic)) || it.o.geometry !== it.g) {
        if (it.wall) { live = false; lost = it; continue; }      // (a wall that has moved: nothing is hidden while it is away, and it is not let go of: it may come back)
        this._drop(it); items[k] = items[items.length - 1]; items.pop(); k--;
      }
    }
    if (live) { const w = this.wallList, root = this.root; for (let k = 0; k < w.length; k++) { const it = w[k]; if (it.lone) { const e = it.e; if (e[12] !== it.x || e[13] !== it.y || e[14] !== it.z || e[0] + e[5] + e[10] + e[1] + e[6] + e[8] !== it.t) { live = false; lost = it; break; } } let q = it.o; for (; q; q = q.parent) { if (!q.visible) break; if (q === root) break; } if (q !== root) { live = false; lost = it; break; } } }
    this.live = live; this.lost = lost;
  }
  _drop(it) { it.o.layers.mask = it.mask; it.dead = true; it.s = 0; this.movers++; this.count--; }
  // (now and then: what has been taken out of the world altogether is let go of, and the lists are tidied)
  _tidy() {
    const under = o => { for (let q = o; q; q = q.parent) if (q === this.root) return true; return false; };
    this.items = this.items.filter(it => { if (it.wall || under(it.o)) return true; this._drop(it); this.movers--; this._known.delete(it.o); return false; });
    for (let i = 0; i < this.n; i++) if (this.byBin[i].some(it => it.dead)) this.byBin[i] = this.byBin[i].filter(it => !it.dead);
    if (this.multi.some(it => it.dead)) this.multi = this.multi.filter(it => !it.dead);
  }

  // What the floor's reflection needs besides: a floor you can see mirrors what can be seen from the room it is in, and
  // (the polish is smeared, so the foot of a wall takes a little of what is behind the wall) what stands just round it.
  _mirror(want, y) {
    const R = this.plan.rooms, out = new Uint8Array(want);
    for (let i = 0; i < R.length; i++) {
      const r = R[i]; if (!want[i] || y < r.y - 0.1 || y > r.top || !this.rows.has(r.id)) continue;
      for (const j of this.list(r.id)) out[j] = 1;
      let near = this._near.get(i);
      if (!near) { near = []; const B = this.box; for (let j = 0, k = 0; j < this.n; j++, k += 6) if (B[k] < r.x1 + 3 && B[k + 3] > r.x0 - 3 && B[k + 2] < r.z1 + 3 && B[k + 5] > r.z0 - 3 && B[k + 1] < r.y + 4 && B[k + 4] > r.y - 0.5) near.push(j); this._near.set(i, near); }
      for (const j of near) out[j] = 1;
    }
    return out;
  }

  /** Each frame, before anything is drawn. cam: the camera's place. toy: the toy's (what is round it is drawn too; with `strict`, the chrome toy's own mirror being on, the table must cover it). all: draw everything. mirrorY: the floor the reflection lies on, or null if there is none. */
  update(cam, toy, all, mirrorY, strict) {
    if (this._tell) this._tell();
    if (!this.ok) return;
    try {
      const t0 = performance.now();
      this._sweep();
      if (++this._frame % 900 === 0) this._tidy();
      let keys = null;
      if (!(all || this.off || !this.live)) {
        keys = this.places.keysAt(cam, _keys, this.has, this.pvs.links);
        if (keys && toy) { const t = this.places.keysAt(toy, _toy, this.has, this.pvs.links); if (t) { for (const k of t) if (!keys.includes(k)) keys.push(k); } else if (strict) keys = null; }
        if (keys && !this.mirrorCam) mirrorY = null;
      }
      // the usual frame: the same place as last time, and nothing more to do
      const last = this._last;
      if (!keys) { if (this._all) return void (this.ms = performance.now() - t0); }
      else if (!this._all && last.length === keys.length && this._lastY === mirrorY) { let same = true; for (let j = 0; j < keys.length; j++) if (last[j] !== keys[j]) { same = false; break; } if (same) return void (this.ms = performance.now() - t0); }
      last.length = 0; if (keys) for (const k of keys) last.push(k); this._lastY = mirrorY; this._all = !keys; this.sig = keys ? keys.join(' + ') : '*';
      const want = this.want, st = this.state;
      if (!keys) st.fill(0);
      else {
        want.fill(0); for (const k of keys) { for (const i of this.list(k)) want[i] = 1; const own = this.index.get(k); if (own != null) want[own] = 1; }
        let m = null;
        if (mirrorY != null) { const ck = this.sig + '@' + mirrorY; m = this._mcache.get(ck); if (!m) { if (this._mcache.size > 64) this._mcache.clear(); this._mcache.set(ck, m = this._mirror(want, mirrorY)); } }
        for (let i = 0; i < this.n; i++) st[i] = want[i] ? 0 : m && m[i] ? 2 : 1;
      }
      let shown = 0;
      for (let i = 0; i < this.n; i++) { const l = this.byBin[i], s = st[i]; for (let k = 0; k < l.length; k++) this._set(l[k], s); if (s === 0) shown += l.length; }
      for (const it of this.multi) { const s = keys ? this._multiState(it.bins) : 0; this._set(it, s); if (s === 0) shown++; }
      this.shown = shown; this.ms = performance.now() - t0;
    } catch (e) { this._fail(e); }
  }
  // (?cull&diag) A small readout at the foot of the screen, twice a second: where the camera is filed, things drawn against things there, draw calls a frame.
  _readout(renderer) {
    const el = document.createElement('pre'); el.id = 'cullout';
    el.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:99;margin:0;padding:6px 8px;font:11px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#cfe;background:rgba(0,0,0,.8);border-radius:4px;white-space:pre-wrap;max-width:calc(100vw - 12px);pointer-events:none';
    document.body.append(el);
    renderer.info.autoReset = false;      // (so the count is of the whole frame, the reflection and the view: it is put back to nought here each frame)
    let n = 0; this._tell = () => { this.calls = renderer.info.render.calls; this.tris = renderer.info.render.triangles; renderer.info.reset(); if (n++ % 30 === 0) el.textContent = this.status(this.calls); };
  }
  /** For the readout (?cull&diag): where the camera is filed, and how much of the world is being drawn. */
  status(calls) {
    if (!this.ok) return 'cull: off (' + this.why + ')';
    const there = this.seen, drawn = this._all ? there : there - this.count + this.shown;
    return `cull: ${this._all ? (this.off ? 'everything (switched off)' : !this.live ? 'everything (a wall the table counts on is ' + (this.missing ? 'missing' : 'open or away' + (this.lost ? ': ' + (this.lost.o.name || 'at ' + [this.lost.x, this.lost.y, this.lost.z].map(Math.round).join(', ')) : '')) + ')' : 'everything (no line in the table for here)') : this.sig}\n      ${drawn} of ${there} things on show to the camera` + (calls != null ? `, ${calls} draw calls` : '') + `; ${this.count} fixed, ${this.movers} seen to move, ${this.never} never hidden; ${this.ms.toFixed(2)} ms`;
  }
}
