// What cannot be seen is not handed to the graphics card.   (On everywhere; ?nocull in the address turns it off: main.js then fetches nothing and makes nothing here.)
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
//     state but play and looking at a work, in a cut scene, or on a staged view;
//   - anything in here throws.
// And a thing is never hidden if it is not plainly fixed: not under the museum's group; marked userData.always or under
// something that is; drawn by a shader that places it (frustumCulled off, instanced geometry, bones, batches); with a
// buffer that is rewritten, a box that is a point, or a hook that runs when it is drawn; not inside the box the table
// tested for its bin (so anything built after the table was made, or built somewhere else, is drawn); or once it has
// been seen to move, turn, or have its instances or vertices set again (looked for every frame: from then on it is
// always drawn).
//
// From one spot looking one way far less can be seen than the table allows from anywhere in the room: so each frame the
// view is also walked from the camera through the building's doors, and only what the table allows AND the walk reaches
// is drawn (see "the walk through the doors" below; the table's tool says where each room's doors are). Without doors in
// the table (an older one), with ?cull=table, or with the chrome toy's own mirror on (it looks every way), the table alone.
//
// THE FLOOR'S REFLECTION is a second drawing of the world from below the floor, and by default it is NOT culled: what the
// view does not need goes on MIRROR, which the reflection's camera draws as well as layer 0, so the polish is exactly what
// it was. (What neither draws goes on HIDDEN, the layer src/stream.js hides far things on: the two meet in applyLayers
// there.) With ?cull=portal it has a walk of its own from its own camera (see _mirrorStarts), and what only the view needs
// goes on VIEW, which the view's camera draws and the reflection's does not. That drawing sees under the foot of every wall
// into the hollow between two rooms' walls, where walls are seen through from behind, and the polish, which is smeared,
// takes a thin strip of whatever lies beyond: so its walk starts in every room whose floor, or the hollow round it, is in
// the smeared part of the picture, and the strip beyond each of their walls is a way out to everything past that wall. It
// is not the default because tools/dev/cullcheck.mjs still finds the sky missing from the polish in a few views (in a
// cellar room with an opening to the sky overhead, B-hangar, up to 7.5% of the picture): it cuts the reflection by a third
// to a half indoors, and is worth finishing.)
//
// NOTHING HIDDEN COSTS A STALL WHEN IT IS FIRST SHOWN: whatever the table says can be seen from where the camera is is
// made ready a few things a frame (shaders compiled in the browser's own time, pictures sent to the graphics card) as
// soon as the camera gets there, whether or not the walk shows it yet. And nothing here hides anything outside play (the
// opening, the title, a cut scene, a staged view): main.js asks for everything to be drawn then.

import * as THREE from 'three';
import { applyLayers } from './stream.js';

export const HIDDEN = 7, MIRROR = 8;
export const CELL = 24;                                   // metres: the squares for what is in no room, and for the camera out of doors
export const BANDS = [-6.5, -0.55, 4.95, 11.05, 18];      // the storeys of those squares, by a thing's middle: the floors' slabs lie on these
export const TOPS = [6, 14, 26, 50];                      // the camera out of doors: near the ground, roof height, over the roofs, the sky (over 50 m: everything)
export const FLOOR = 0.05, CEIL = 0.03, SIDE = 0.03;      // how near a floor, a ceiling or a wall the camera may be and still be "in the room" (a wall is a sheet with nothing behind it: a camera in its plane sees through every wall there is)
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
      if (loose(p) && g.boundingBox) b.copy(g.boundingBox).applyMatrix4(o.matrixWorld);      // (a box given it when it was made, before its vertices went: src/museum.js, the back rooms' fittings)
      else if (loose(p)) { if (!g.boundingSphere) { if (!(p.data || p).array) return false; g.computeBoundingSphere(); } const c = g.boundingSphere.center, r = g.boundingSphere.radius; b.min.set(c.x - r, c.y - r, c.z - r); b.max.set(c.x + r, c.y + r, c.z + r); b.applyMatrix4(o.matrixWorld); }      // (its ball, which three.js made before the vertices went: the same answer whenever it is asked)
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
    for (const r of this.near(x, z)) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1 && y > r.y - 0.4 && y < r.top + 0.4) { if (y >= r.y + FLOOR && y <= r._c - CEIL && x >= r.x0 + SIDE && x <= r.x1 - SIDE && z >= r.z0 + SIDE && z <= r.z1 - SIDE) out.push(r.id); else slab = true; }
    if (out.length) return out;
    for (const d of this.doors) if (x >= d.x0 - 0.05 && x <= d.x1 + 0.05 && z >= d.z0 - 0.05 && z <= d.z1 + 0.05 && y >= d.y + FLOOR && y <= d.y + d.h - CEIL) {
      for (const id of [d.a, d.b]) { if (this.plan.byId[id]) { if (!out.includes(id)) out.push(id); } else { const k = cellKey(x, z, y); if (!k || !has(k, y)) return null; if (!out.includes(k)) out.push(k); } }
    }
    if (out.length) return out;
    if (links) for (let i = 0; i < links.length; i++) { const l = links[i]; if (x >= l[0] && x <= l[1] && y >= l[2] && y <= l[3] && z >= l[4] && z <= l[5]) { for (let j = 6; j < 8; j++) { const k = l[j] === '*' ? cellKey(x, z, y) : l[j]; if (!k || !has(k, y)) return null; if (!out.includes(k)) out.push(k); } } }
    if (out.length) return out;
    if (slab) return null;
    for (const m of this.plan.masses) if (x > m.x0 && x < m.x1 && z > m.z0 && z < m.z1 && y < m.top + 0.15) return null;      // in the thickness of the building
    const k = cellKey(x, z, y); if (!k || !has(k, y)) return null;
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

// ---- the walk through the doors ----
//
// The table says what can be seen from ANYWHERE in a room, looking ANY way. From one spot looking one way far less can:
// so each frame the camera's own view is walked through the building, as a rectangle on its picture. It starts in the
// room the camera is in; at each of the room's doors (the openings the table's tool found in the room's six faces, every
// pane of glass, grille, well and missing ceiling among them: tools/dev/pvs-page.js) the door is drawn on the picture,
// and if any of it lies inside the rectangle, the walk goes on into whatever is on the other side, with the rectangle
// cut down to the door. A thing is then drawn if the table allows it AND some room the walk reached has it within reach
// (its box, inside the room's box and 0.6 m round it, since past a face that is not a door there is a wall within
// 0.55 m) and inside the rectangle the walk reached that room with. A door to the open air, or to nowhere a camera can
// be, ends the walk there: everything in that rectangle beyond the door's plane is drawn (a straight line through a
// plane does not come back). So the walk can only draw more than can be seen, never less, as long as the doors are all
// the ways out of a room; and every way the walk cannot be sure of (the camera in a door's plane, a door behind it, too
// many doors to follow) draws more, not less.
const EPS = 0.02, M = 0.6, INF = 1e9, CAP = 4000;
// What a way through the doors can see is kept as a MASK of the picture: 64 by 32 cells, a bit to a cell, two 32-bit words to a row (so a slanting
// door, or the strip of floor along the foot of a wall, takes the cells it covers and not the whole box round it). Every cell anything touches is set.
export const MW = 64, MH = 32;
const mask = () => new Uint32Array(MH * 2);
const full = () => mask().fill(0xffffffff);
const cellX = x => Math.max(0, Math.min(MW - 1, Math.floor((x + 1) * MW / 2))), cellY = y => Math.max(0, Math.min(MH - 1, Math.floor((y + 1) * MH / 2)));
const rowBits = (c0, c1, w) => { const a = Math.max(c0, w * 32), b = Math.min(c1, w * 32 + 31); if (a > b) return 0; const n = b - a + 1; return (n === 32 ? 0xffffffff : ((1 << n) - 1) << (a - w * 32)) >>> 0; };
const and = (a, b) => { const o = mask(); let any = 0; for (let i = 0; i < o.length; i++) any |= (o[i] = a[i] & b[i]); return any ? o : null; };
const within = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] & ~b[i]) return false; return true; };
const or = (a, b) => { for (let i = 0; i < a.length; i++) a[i] |= b[i]; return a; };
/** Any cell of the rectangle X0..Y1 (on the picture, -1 to 1) set in m? 2 if every one is. */
function maskHas(m, X0, Y0, X1, Y1) {
  if (X1 < -1 || X0 > 1 || Y1 < -1 || Y0 > 1) return 0;
  const c0 = cellX(X0), c1 = cellX(X1), r0 = cellY(Y0), r1 = cellY(Y1), b0 = rowBits(c0, c1, 0), b1 = rowBits(c0, c1, 1); let all = X0 >= -1 && X1 <= 1 && Y0 >= -1 && Y1 <= 1, any = false;
  for (let j = r0; j <= r1; j++) { const w0 = m[j * 2] & b0, w1 = m[j * 2 + 1] & b1; if (w0 || w1) any = true; if ((w0 >>> 0) !== b0 || (w1 >>> 0) !== b1) all = false; if (any && !all) return 1; }
  return any ? (all ? 2 : 1) : 0;
}
/** The cells a convex polygon on the picture covers (pts: x, y pairs), into a new mask; null if none. */
function polyMask(v, n) {
  if (n < 3) return null;
  let y0 = INF, y1 = -INF; for (let i = 0; i < n; i++) { y0 = Math.min(y0, v[i * 2 + 1]); y1 = Math.max(y1, v[i * 2 + 1]); }
  if (y1 < -1 || y0 > 1) return null;
  const m = mask(), r0 = cellY(y0), r1 = cellY(y1); let any = 0;
  for (let j = r0; j <= r1; j++) {
    const a = j * 2 / MH - 1, b = (j + 1) * 2 / MH - 1; let x0 = INF, x1 = -INF;      // (the polygon's reach across this row: its corners in the row, and where its edges cross the row's top and foot)
    for (let i = 0; i < n; i++) {
      const px = v[i * 2], py = v[i * 2 + 1], qx = v[((i + 1) % n) * 2], qy = v[((i + 1) % n) * 2 + 1];
      if (py >= a && py <= b) { x0 = Math.min(x0, px); x1 = Math.max(x1, px); }
      for (const yy of [a, b]) if ((py - yy) * (qy - yy) <= 0 && py !== qy) { const x = px + (qx - px) * (yy - py) / (qy - py); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    }
    if (x0 > x1 || x1 < -1 || x0 > 1) continue;
    const c0 = cellX(x0), c1 = cellX(x1); any |= (m[j * 2] |= rowBits(c0, c1, 0)) | (m[j * 2 + 1] |= rowBits(c0, c1, 1));
  }
  return any ? m : null;
}
function dilate(m, dx, dy) {
  const o = mask();
  for (let j = 0; j < MH; j++) for (let c = 0; c < MW; c++) { if (!((m[j * 2 + (c >> 5)] >>> (c & 31)) & 1)) continue;
    const c0 = Math.max(0, c - dx), c1 = Math.min(MW - 1, c + dx), b0 = rowBits(c0, c1, 0), b1 = rowBits(c0, c1, 1);
    for (let k = Math.max(0, j - dy); k <= Math.min(MH - 1, j + dy); k++) { o[k * 2] |= b0; o[k * 2 + 1] |= b1; } }
  return o;
}
const flipX = m => { const o = mask(); for (let j = 0; j < MH; j++) for (let c = 0; c < MW; c++) if ((m[j * 2 + (c >> 5)] >>> (c & 31)) & 1) { const d = MW - 1 - c; o[j * 2 + (d >> 5)] |= 1 << (d & 31); } return o; };
const _q = new Float64Array(48), _v = new Float64Array(32);
/** A flat polygon seen by the camera whose view-projection is e, clipped to what is in front of the camera: its corners on the picture into _v; how many (0: none in front). */
function projPoly(e, pts, n) {
  let k = 0;
  for (let i = 0; i < n; i++) { const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2]; _q[k++] = e[0] * x + e[4] * y + e[8] * z + e[12]; _q[k++] = e[1] * x + e[5] * y + e[9] * z + e[13]; _q[k++] = e[3] * x + e[7] * y + e[11] * z + e[15]; }
  let m = 0;
  for (let i = 0; i < n; i++) {      // (each corner in front of the camera, and where each edge crosses the camera's own plane)
    const a = i * 3, b = ((i + 1) % n) * 3, wa = _q[a + 2], wb = _q[b + 2];
    if (wa >= EPS) { _v[m * 2] = _q[a] / wa; _v[m * 2 + 1] = _q[a + 1] / wa; m++; }
    if ((wa >= EPS) !== (wb >= EPS)) { const t = (EPS - wa) / (wb - wa); _v[m * 2] = (_q[a] + (_q[b] - _q[a]) * t) / EPS; _v[m * 2 + 1] = (_q[a + 1] + (_q[b + 1] - _q[a + 1]) * t) / EPS; m++; }
  }
  return m;
}
const polyOf = (e, pts) => polyMask(_v, projPoly(e, pts, 4));
/** The cells of mask F a flat polygon covers (fb: the cells round F, for a quick no); null if none. */
function polyIn(e, pts, F, fb) {
  const n = projPoly(e, pts, 4); if (n < 3) return null;
  let x0 = INF, y0 = INF, x1 = -INF, y1 = -INF; for (let i = 0; i < n; i++) { const X = _v[i * 2], Y = _v[i * 2 + 1]; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; }
  if (cellX(x1) < fb[0] || cellX(x0) > fb[2] || cellY(y1) < fb[1] || cellY(y0) > fb[3] || x1 < -1 || x0 > 1 || y1 < -1 || y0 > 1) return null;
  const m = polyMask(_v, n); return m && and(F, m);
}
const boundsOf = m => { let c0 = MW, r0 = MH, c1 = -1, r1 = -1; for (let j = 0; j < MH; j++) for (let c = 0; c < MW; c++) if ((m[j * 2 + (c >> 5)] >>> (c & 31)) & 1) { if (c < c0) c0 = c; if (c > c1) c1 = c; if (j < r0) r0 = j; if (j > r1) r1 = j; } return [c0, r0, c1, r1]; };
/** Is any of the box (x0..z1) in the mask m, for the camera e? 0 no, 1 some of it, 2 all of it in front of the camera and every cell it covers set. (A box across the camera's own plane is taken to fill the picture.) */
function boxSeen(e, x0, y0, z0, x1, y1, z1, m) {
  let X0 = INF, Y0 = INF, X1 = -INF, Y1 = -INF, behind = 0;
  for (let k = 0; k < 8; k++) {
    const x = k & 1 ? x1 : x0, y = k & 2 ? y1 : y0, z = k & 4 ? z1 : z0, w = e[3] * x + e[7] * y + e[11] * z + e[15];
    if (w < EPS) { behind++; continue; }
    const X = (e[0] * x + e[4] * y + e[8] * z + e[12]) / w, Y = (e[1] * x + e[5] * y + e[9] * z + e[13]) / w;
    if (X < X0) X0 = X; if (X > X1) X1 = X; if (Y < Y0) Y0 = Y; if (Y > Y1) Y1 = Y;
  }
  if (behind === 8) return 0;
  if (behind) return maskHas(m, -1, -1, 1, 1) ? 1 : 0;
  return maskHas(m, X0, Y0, X1, Y1);
}
/** The box b on the picture of the camera e, into p: p[4] 0 if all of it is behind the camera, 1 if it lies across the camera's plane (taken to fill the picture), 2 if not, with p[0..3] the rectangle round it. */
function projBox(e, b, p) {
  let X0 = INF, Y0 = INF, X1 = -INF, Y1 = -INF, behind = 0;
  for (let k = 0; k < 8; k++) {
    const x = k & 1 ? b[3] : b[0], y = k & 2 ? b[4] : b[1], z = k & 4 ? b[5] : b[2], w = e[3] * x + e[7] * y + e[11] * z + e[15];
    if (w < EPS) { behind++; continue; }
    const X = (e[0] * x + e[4] * y + e[8] * z + e[12]) / w, Y = (e[1] * x + e[5] * y + e[9] * z + e[13]) / w;
    if (X < X0) X0 = X; if (X > X1) X1 = X; if (Y < Y0) Y0 = Y; if (Y > Y1) Y1 = Y;
  }
  p[0] = X0; p[1] = Y0; p[2] = X1; p[3] = Y1; p[4] = behind === 8 ? 0 : behind ? 1 : 2;
}
const within6 = (a, b) => a[0] >= b[0] && a[1] >= b[1] && a[2] >= b[2] && a[3] <= b[3] && a[4] <= b[4] && a[5] <= b[5];
const ALL6 = [-INF, -INF, -INF, INF, INF, INF];

/** The rooms and their doors, from the table, and the walk through them. */
export class Portals {
  constructor(plan, ports) {
    this.rooms = plan.rooms; const R = plan.rooms.length;
    this.rb = plan.rooms.map(r => [r.x0, r.y, r.z0, r.x1, ceilOf(r), r.z1]);
    this.reach = this.rb.map(b => [b[0] - M, b[1] - M, b[2] - M, b[3] + M, b[4] + M, b[5] + M]);
    this.of = Array.from({ length: R }, () => []);
    for (const p of ports) {
      const [ri, axis, s, at, a0, a1, b0, b1] = p, to = p.slice(8), o = [0, 1, 2].filter(a => a !== axis), lo = [0, 0, 0], hi = [0, 0, 0];
      lo[axis] = hi[axis] = at; lo[o[0]] = a0; hi[o[0]] = a1; lo[o[1]] = b0; hi[o[1]] = b1;
      const pts = new Float64Array(12); for (let k = 0; k < 4; k++) { const c = [0, 0, 0]; c[axis] = at; c[o[0]] = k === 1 || k === 2 ? a1 : a0; c[o[1]] = k >= 2 ? b1 : b0; pts.set(c, k * 3); }      // (round the door, corner to corner)
      if (ri >= 0 && ri < R) this.of[ri].push({ axis, s, at, box: [lo[0], lo[1], lo[2], hi[0], hi[1], hi[2]], pts, to });
    }
  }
  /** From eye (the camera's place) with view-projection e: the rooms in `starts` ([room, mask, bound]), walked through their doors. Into out:
   * [room or -1 (beyond: the open air), mask, bound (a box past which nothing reached this way can be)], one for each room reached and one for each
   * way out to the open air there is (by which sides its bound has). A room reached more than one way has the mask and the bound round all of them,
   * and is walked on from again whenever that grows. False if there were too many steps to take. */
  walk(eye, e, starts, out) {
    out.length = 0; const cur = new Map(), queue = [], queued = new Set(), sinks = new Map(); let steps = 0;
    const grow = (c, r, b) => { or(c[1], r); const g = c[2]; for (let k = 0; k < 3; k++) { if (b[k] < g[k]) g[k] = b[k]; if (b[k + 3] > g[k + 3]) g[k + 3] = b[k + 3]; } };
    const reach = (n, r, b) => {
      if (n < 0) { let key = 0; for (let k = 0; k < 6; k++) if (Math.abs(b[k]) < INF) key |= 1 << k; const s = sinks.get(key); if (s) grow(s, r, b); else sinks.set(key, [-1, r.slice(), b.slice()]); return; }
      const c = cur.get(n);
      if (!c) cur.set(n, [n, r.slice(), b.slice()]);
      else { if (within(r, c[1]) && within6(b, c[2])) return; grow(c, r, b); }
      if (!queued.has(n)) { queued.add(n); queue.push(n); }
    };
    for (const s of starts) reach(s[0], s[1], s[2]);
    while (queue.length) {
      if (++steps > CAP) return false;
      const n = queue.shift(); queued.delete(n); const c = cur.get(n), r = c[1].slice(), b = c[2].slice();
      for (const p of this.of[n]) {
        const pb = p.box; if (pb[0] > b[3] + EPS || pb[3] < b[0] - EPS || pb[1] > b[4] + EPS || pb[4] < b[1] - EPS || pb[2] > b[5] + EPS || pb[5] < b[2] - EPS) continue;      // (the door is past where this way can reach)
        let nr = r, nb = b; const side = p.s * (p.at - eye[p.axis]);
        if (side < -EPS) continue;      // the camera is beyond the door's plane: a line from it that is in this room has crossed that plane already, and cannot go back out through it
        if (side > EPS) {               // the camera is on this room's side of the door: what is seen is cut down to the door, and stays beyond its plane (in the plane: let through as it is)
          const d = polyOf(e, p.pts); if (!d) continue;
          nr = and(r, d); if (!nr) continue;
          nb = b.slice(); if (p.s > 0) nb[p.axis] = Math.max(nb[p.axis], p.at - 0.05); else nb[p.axis + 3] = Math.min(nb[p.axis + 3], p.at + 0.05);
        }
        for (const t of p.to) reach(t, nr, nb);
      }
    }
    for (const c of cur.values()) out.push(c); for (const s of sinks.values()) out.push(s);
    return true;
  }
}

// ---- the game's side ----
export const VIEW = 9;                                     // what only the view draws (the floor's reflection does not)
const _box = new THREE.Box3(), _keys = [], _toy = [], _vp = new THREE.Matrix4(), _pts = new Float64Array(12);
export class Visibility {
  /** root: the museum's group. pvs: the table as fetched. mirrorCam: the floor reflection's camera (it is told to draw MIRROR too). renderer: for the readout's count of draw calls (?cull&diag).
   * Set afterwards by main.js: camera (the view's: it is told to draw VIEW too), mirror (src/reflect.js, to place its camera and know its picture's size), warm (o => a promise: o's shaders compiled as it will be drawn). */
  constructor(root, plan, pvs, mirrorCam, renderer) {
    this.root = root; this.plan = plan; this.ok = false; this.live = false; this.why = ''; this.sig = '*'; this.off = false; this.log = null;      // (log: set to [] by a tool, to be told why each thing is never hidden)
    this.items = []; this.count = 0; this.shown = 0; this.movers = 0; this.never = 0; this.seen = 0; this.ms = 0; this.renderer = renderer || null;
    this._known = new WeakSet(); this._at = 0; this._all = true; this._last = []; this._lastY = null; this._frame = 0; this._stamp = 0; this.visits = []; this.mvisits = []; this.walked = '';
    try {
      if (!pvs || pvs.v !== 3) return void (this.why = 'no table, or an old one');
      if (pvs.made !== plan.made || pvs.rooms !== plan.rooms.length || pvs.cell !== CELL || pvs.plan !== planHash(plan)) return void (this.why = 'the table is for another plan');
      for (let i = 0; i < plan.rooms.length; i++) if (pvs.bins[i] !== plan.rooms[i].id) return void (this.why = 'the table is for another plan');
      this.pvs = pvs; this.places = new Places(plan); this.n = pvs.bins.length; this.index = new Map(pvs.bins.map((b, i) => [b, i])); this.box = pvs.box;
      this.rows = new Map(Object.entries(pvs.of)); this.lists = new Array(pvs.sets.length); const low = pvs.low || {};
      this.has = (k, y) => this.rows.has(k) && (k.charCodeAt(1) !== 58 || k.charCodeAt(0) !== 111 || (low[k] != null && y >= low[k] - 0.25));      // (a square of the open air is a place only down to its lowest sample point: under that is the ground, or the cellars' level beside the cellars, and nobody can say what is seen from in there)
      this.byBin = Array.from({ length: this.n }, () => []); this.multi = []; this.pieces = Array.from({ length: this.n }, () => []);
      this.want = new Uint8Array(this.n); this.state = new Uint8Array(this.n);      // per bin: 0 drawn, 1 hidden, 2 the reflection only
      this.walls = new Map(pvs.occ.map(s => [s, null])); this.wallList = []; this.missing = this.walls.size;
      this.mirrorCam = mirrorCam || null; if (mirrorCam) mirrorCam.layers.enable(MIRROR);
      // how far the walk goes: 'all' (the default: the view walked, the floor's reflection not culled), 'portal' (the reflection walked as well, from its own
      // camera: not yet trusted, see the top of the file), 'table' (the table alone, the reflection not culled: as before the walk)
      this.mode = (/[?&]cull=(table|all|portal)\b/.exec(location.search) || [])[1] || 'all';
      this.portals = pvs.ports && this.mode !== 'table' ? new Portals(plan, pvs.ports) : null;
      this._nearBins = new Map(); this._outer = new Map(); this._full = []; this._fullDirty = true; this._holl = new Map(); this._oair = new Map(); this._rings = new Map(); this._hit = []; this._was = []; this._reset = true; this._warmQ = []; this._warmed = new WeakSet();
      this.ok = true;
    } catch (e) { this.ok = false; this.why = 'the table could not be read: ' + e; }
    if (!this.ok) console.warn('visible: ' + this.why + ': nothing is hidden. Make it again with tools/dev/pvs.mjs');
    try { if (renderer && /[?&]diag\b/.test(location.search)) this._readout(renderer); } catch {}
  }
  set camera(c) { this._camera = c; if (c) c.layers.enable(VIEW); }
  get camera() { return this._camera; }
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
        if (!fixed(o)) { this.never++; if (this.log) this.log.push([o, 'not fixed']); return; }
        if (!first) o.updateWorldMatrix(true, false);      // (built since the last frame was drawn: three.js has not yet worked out where it is)
        if (!boxOf(o, b)) { this.never++; if (this.log) this.log.push([o, 'no box']); return; }
        // one of the walls the table counted on? (kept an eye on, whether or not it is ever hidden itself)
        let wall = false;
        if (this.missing && wallLike(o, b) && this.places.fabric(b)) { const s = sigOf(o, b); if (this.walls.has(s) && !this.walls.get(s)) { wall = true; this.walls.set(s, o); this.missing--; } }
        let bin = this.places.binOf(b), bins = null, i = -1;
        if (bin === null) { bins = this.pvs.big[sigOf(o, b)]; if (!bins) { if (wall) this._wall(o); this.never++; if (this.log) this.log.push([o, 'big, not in the table']); return; } }
        else {
          i = this.index.get(bin); if (i == null) { if (wall) this._wall(o); this.never++; if (this.log) this.log.push([o, 'bin not in the table ' + bin]); return; }      // a bin the table has never heard of
          const k = i * 6;                                                                                  // and it has to lie inside the box the table tested for that bin
          if (b.min.x < B[k] - 0.02 || b.min.y < B[k + 1] - 0.02 || b.min.z < B[k + 2] - 0.02 || b.max.x > B[k + 3] + 0.02 || b.max.y > B[k + 4] + 0.02 || b.max.z > B[k + 5] + 0.02) { if (wall) this._wall(o); this.never++; if (this.log) this.log.push([o, 'outside the box of ' + bin]); return; }
        }
        const e = o.matrixWorld.elements, p = o.geometry.attributes.position;
        const pa = p.data || p, im = o.isInstancedMesh ? o.instanceMatrix : null;
        const it = { o, i, bins, wall, s: 0, dead: false, e, p: o.position, g: o.geometry, pa, im, x: e[12], y: e[13], z: e[14], t: e[0] + e[5] + e[10] + e[1] + e[6] + e[8], lx: o.position.x, ly: o.position.y, lz: o.position.z,
          iv: im ? im.version : 0, ic: im ? o.count : 0, gv: pa.version, mask: o.userData.far ? 1 : o.layers.mask,      // (its own layers: not the streamer's hiding of it, src/stream.js)
          bx: [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z], vs: 0, ms: 0 };      // (its box, for the walk; and the frames the view and the reflection last reached it in)
        this.items.push(it); this.count++; this._fullDirty = true; this._reset = true;
        if (bins) {      // a big thing: for the walk, the part of it in each square it passes through is the square's box cut to its own
          this.multi.push(it);
          for (const k of bins) { const q = k * 6, pb = [Math.max(it.bx[0], B[q]), Math.max(it.bx[1], B[q + 1]), Math.max(it.bx[2], B[q + 2]), Math.min(it.bx[3], B[q + 3]), Math.min(it.bx[4], B[q + 4]), Math.min(it.bx[5], B[q + 5])];
            if (pb[0] <= pb[3] && pb[1] <= pb[4] && pb[2] <= pb[5]) this.pieces[k].push({ it, b: pb }); else this.pieces[k].push({ it, b: it.bx }); }      // (a square whose box misses it altogether: its whole box, to be safe)
        } else this.byBin[i].push(it);
        if (wall) this.wallList.push(it);
        if (!this._all) this._set(it, bins ? this._multiState(bins) : this.state[i]);
      });
    } catch (e) { this._fail(e); }
  }
  _wall(o) { const e = o.matrixWorld.elements; this.wallList.push({ o, wall: true, lone: true, dead: false, e, x: e[12], y: e[13], z: e[14], t: e[0] + e[5] + e[10] + e[1] + e[6] + e[8] }); }
  _fail(e) { this.ok = false; this.why = 'an error: ' + e; console.warn('visible: ' + this.why + ': everything is drawn from here on'); try { for (const it of this.items) { it.o.userData.cullMask = null; applyLayers(it.o); } } catch {} }
  // (0 drawn, 1 hidden, 2 the reflection only, 3 the view only: with the streamer's say, src/stream.js)
  _set(it, s) { if (it.s !== s && !it.dead) { it.s = s; it.o.userData.cullMask = s === 0 ? it.mask : s === 1 ? 1 << HIDDEN : s === 2 ? 1 << MIRROR : (it.mask & ~1) | ((it.mask & 1) << VIEW); applyLayers(it.o); } }
  _multiState(bins) { let m = 1; for (let k = 0; k < bins.length; k++) { const s = this.state[bins[k]]; if (s === 0) return 0; if (s === 2) m = 2; } return m; }

  // Every thing filed, every frame: has it moved, turned, or had its instances or its vertices set again? Then it is not a
  // fixed thing after all: it is drawn from now on, wherever it goes. (A thing's own position is looked at as well as its
  // place in the world, which three.js only brings up to date when it draws: so a thing a feature has just carried off is
  // caught in the frame it goes.) And each wall the table counted on: still there, still on show, still where it was?
  // (A phone builds the park's big features only when the toy comes near them, src/features.js, so the few walls of theirs the
  // table counts on are missing until then. `excuse(cam)`, given by main.js, says when that is all it is: some are still to
  // be built and the camera is well away from every one of them. Then, and with no more than a few missing, the rest of the
  // world is culled as usual; near one, the rule holds again until it is built and its walls are found.)
  _sweep(cam) {
    const items = this.items, near = this.missing === 0 || (this.missing <= 8 && !!this.excuse && !!cam && this.excuse(cam)); let live = this.missing <= 8, lost = null;      // (live here: no wall moved or hidden; the few missing are looked at below)
    for (let k = 0; k < items.length; k++) {
      const it = items[k], e = it.e, p = it.p;
      if (e[12] !== it.x || e[13] !== it.y || e[14] !== it.z || p.x !== it.lx || p.y !== it.ly || p.z !== it.lz || e[0] + e[5] + e[10] + e[1] + e[6] + e[8] !== it.t || it.pa.version !== it.gv || (it.im !== null && (it.im.version !== it.iv || it.o.count !== it.ic)) || it.o.geometry !== it.g) {
        if (it.wall) { live = false; lost = it; continue; }      // (a wall that has moved: nothing is hidden while it is away, and it is not let go of: it may come back)
        this._drop(it); items[k] = items[items.length - 1]; items.pop(); k--;
      }
    }
    if (live) { const w = this.wallList, root = this.root; for (let k = 0; k < w.length; k++) { const it = w[k]; if (it.lone) { const e = it.e; if (e[12] !== it.x || e[13] !== it.y || e[14] !== it.z || e[0] + e[5] + e[10] + e[1] + e[6] + e[8] !== it.t) { live = false; lost = it; break; } } let q = it.o; for (; q; q = q.parent) { if (!q.visible) break; if (q === root) break; } if (q !== root) { live = false; lost = it; break; } } }
    this.live = live && near; this.lost = lost;
    this.unbuilt = live && !near;      // (only a feature's walls missing, near it: the walk may still be used indoors, see update)
  }
  _drop(it) { it.o.userData.cullMask = null; applyLayers(it.o); it.dead = true; it.s = 0; this.movers++; this.count--; if (this.log) this.log.push([it.o, 'moved']); }
  // (now and then: what has been taken out of the world altogether is let go of, and the lists are tidied)
  _tidy() {
    const under = o => { for (let q = o; q; q = q.parent) if (q === this.root) return true; return false; };
    this.items = this.items.filter(it => { if (it.wall || (under(it.o) && fixed(it.o))) return true; const gone = !under(it.o); this._drop(it); if (gone) { this.movers--; this._known.delete(it.o); } return false; });      // (and what has since been marked as moving, or given a hook of its own, is let go of too)
    for (let i = 0; i < this.n; i++) { if (this.byBin[i].some(it => it.dead)) this.byBin[i] = this.byBin[i].filter(it => !it.dead); if (this.pieces[i].some(q => q.it.dead)) this.pieces[i] = this.pieces[i].filter(q => !q.it.dead); }
    if (this.multi.some(it => it.dead)) this.multi = this.multi.filter(it => !it.dead);
    this._fullDirty = true;
  }

  // ---- the walk, each frame ----
  // (the bins whose boxes come within reach of a room: worked out the first time the walk gets there)
  _binsNear(n) {
    let l = this._nearBins.get(n); if (l) return l; l = [];
    const a = this.portals.reach[n], B = this.box;
    for (let i = 0, k = 0; i < this.n; i++, k += 6) if (B[k] <= a[3] && B[k + 3] >= a[0] && B[k + 1] <= a[4] && B[k + 4] >= a[1] && B[k + 2] <= a[5] && B[k + 5] >= a[2]) l.push(i);
    this._nearBins.set(n, l); return l;
  }
  /** Everything one step of a walk reaches (v: [room or -1, rectangle, bound]) gets the frame's stamp in `field`. want: the table's bins (or null: any). */
  _mark(v, e, want, field, stamp, key) {
    const [n, r, bd] = v, g = n >= 0 ? this.portals.reach[n] : ALL6;
    const x0 = Math.max(g[0], bd[0]), y0 = Math.max(g[1], bd[1]), z0 = Math.max(g[2], bd[2]), x1 = Math.min(g[3], bd[3]), y1 = Math.min(g[4], bd[4]), z1 = Math.min(g[5], bd[5]);
    if (x0 > x1 || y0 > y1 || z0 > z1) return;
    if (this._fullDirty) { this._fullDirty = false; this._full = []; for (let i = 0; i < this.n; i++) if (this.byBin[i].length || this.pieces[i].length) this._full.push(i); this._binP = Array.from({ length: this.n }, () => ({ k: -1, p: new Float64Array(5) })); }
    const B = this.box, bins = v[3] || (n >= 0 ? this._binsNear(n) : this._full), N = bins.length, BP = this._binP, ws = v.length > 4 ? v[4] : want ? [want] : null, nw = ws ? ws.length : 0, hit = this._hit; if (ws && !nw) return;      // (an empty list: nothing)      // (v[3]: the bins this way can reach, when it knows; v[4]: what a way out to the open air can see, by the table)
    // (a box wholly within reach is put on the picture once a frame for each camera, and kept; one that reach cuts is put on it as cut)
    const seen = (h, b) => {
      const a0 = Math.max(x0, b[0]), a1 = Math.max(y0, b[1]), a2 = Math.max(z0, b[2]), c0 = Math.min(x1, b[3]), c1 = Math.min(y1, b[4]), c2 = Math.min(z1, b[5]);
      if (a0 > c0 || a1 > c1 || a2 > c2) return 0;
      if (a0 !== b[0] || a1 !== b[1] || a2 !== b[2] || c0 !== b[3] || c1 !== b[4] || c2 !== b[5]) return boxSeen(e, a0, a1, a2, c0, c1, c2, r);
      const p = h.p; if (h.k !== key) { h.k = key; projBox(e, b, p); }
      return p[4] === 0 ? 0 : p[4] === 1 ? (maskHas(r, -1, -1, 1, 1) ? 1 : 0) : maskHas(r, p[0], p[1], p[2], p[3]);
    };
    for (let j = 0; j < N; j++) {
      const i = bins[j]; if (nw) { let any = false; for (let w = 0; w < nw; w++) if (ws[w][i]) { any = true; break; } if (!any) continue; }
      const l = this.byBin[i], pl = this.pieces[i]; if (!l.length && !pl.length) continue;
      const s = seen(BP[i], this._bb(i)); if (!s) continue;
      if (s === 2 && x0 <= B[i * 6] && y0 <= B[i * 6 + 1] && z0 <= B[i * 6 + 2] && x1 >= B[i * 6 + 3] && y1 >= B[i * 6 + 4] && z1 >= B[i * 6 + 5]) {      // (the whole bin within reach and in view: all of it)
        for (let q = 0; q < l.length; q++) { const it = l[q]; it[field] = stamp; if (it.hs !== stamp) { it.hs = stamp; hit.push(it); } } for (let q = 0; q < pl.length; q++) { const it = pl[q].it; it[field] = stamp; if (it.hs !== stamp) { it.hs = stamp; hit.push(it); } } continue; }
      for (let q = 0; q < l.length; q++) { const it = l[q]; if (it[field] !== stamp && (s === 2 ? this._meets(it.bx, x0, y0, z0, x1, y1, z1) : seen(it.pj || (it.pj = { k: -1, p: new Float64Array(5) }), it.bx))) { it[field] = stamp; if (it.hs !== stamp) { it.hs = stamp; hit.push(it); } } }
      for (let q = 0; q < pl.length; q++) { const pc = pl[q]; if (pc.it[field] !== stamp && (s === 2 ? this._meets(pc.b, x0, y0, z0, x1, y1, z1) : seen(pc.pj || (pc.pj = { k: -1, p: new Float64Array(5) }), pc.b))) { const it = pc.it; it[field] = stamp; if (it.hs !== stamp) { it.hs = stamp; hit.push(it); } } }
    }
  }
  _meets(b, x0, y0, z0, x1, y1, z1) { return b[0] <= x1 && b[3] >= x0 && b[1] <= y1 && b[4] >= y0 && b[2] <= z1 && b[5] >= z0; }
  _bb(i) { const B = this.box, k = i * 6; return this._bbs || (this._bbs = []), this._bbs[i] || (this._bbs[i] = [B[k], B[k + 1], B[k + 2], B[k + 3], B[k + 4], B[k + 5]]); }
  // (is the face of room n on this side (axis, sign) at height y against the open air, or somewhere no room is, anywhere along it? Looked at 1.7 m out,
  // every metre: rooms that stand at that height, 1.6 m round them, are inside)
  _outerFace(n, f, y) {
    const key = n * 8 + f + ':' + Math.round(y * 10); let v = this._outer.get(key); if (v != null) return v;
    const b = this.portals.rb[n], ax = f >> 1, s = f & 1 ? 1 : -1, at = s > 0 ? b[ax === 0 ? 3 : 5] + 1.7 : b[ax === 0 ? 0 : 2] - 1.7, lo = ax === 0 ? b[2] : b[0], hi = ax === 0 ? b[5] : b[3];
    v = false;
    for (let u = lo; u <= hi + 0.01 && !v; u += 1) { const x = ax === 0 ? at : Math.min(u, hi), z = ax === 0 ? Math.min(u, hi) : at; let ok = false;
      for (const r of this.places.near(x, z)) if (r.y - 0.6 <= y && r.top > y && x >= r.x0 - 1.6 && x <= r.x1 + 1.6 && z >= r.z0 - 1.6 && z <= r.z1 + 1.6) { ok = true; break; }
      if (!ok) for (const r of this.plan.rooms) if (r.y - 0.6 <= y && r.top > y && x >= r.x0 - 1.6 && x <= r.x1 + 1.6 && z >= r.z0 - 1.6 && z <= r.z1 + 1.6) { ok = true; break; }
      if (!ok) v = true; }
    this._outer.set(key, v); return v;
  }
  // THE FLOOR'S REFLECTION has a camera of its own, under the floor, and a walk of its own from it. What it draws matters only where a floor
  // that takes it is in the view, and as far round that as the polish smears: so its mask is the floors the view's walk reached on that level
  // as the reflection's camera sees them (a point on the floor is seen by the two cameras at the same height on their pictures, and at
  // opposite sides), widened by the smear (three taps, the furthest 0.02 of the picture's height off, from a picture half the size and blurred
  // by a few of its pixels: ten are allowed). Its rays come up through the floor's plane, and go on away from the camera:
  //   - where a room stands, into the room: each room on that level (or standing in it) whose floor, or the 1.6 m round it, is in the
  //     mask is a start of the walk;
  //   - where a wall stands (the 1.6 m beyond each face of those rooms), into the hollow behind the plaster, where walls are seen through
  //     from behind: up the hollow (everything over that strip, to the sky), into every room beside it or over it (starts too), and out over
  //     the roof (everything higher than the roofs there, on past the strip);
  //   - beyond a wall with the open air or nowhere a camera can be behind it, out of doors: everything past that wall's plane. (Only for a wall
  //     that faces away from the camera, with the camera in or by a room of that level: the open air beyond one that faces it lies past a wall
  //     of a room nearer the camera that faces away.)
  // The ways out carry their bounds: past the strip they come from, on whichever side of it the camera is not.
  _mirrorStarts(e, y, mc, out, extra) {
    out.length = 0; extra.length = 0; const R = this.plan.rooms, P = this.portals; let F = null;
    for (const [n, r] of this.visits) {
      if (n >= 0) { const b = P.rb[n]; if (Math.abs(R[n].y - y) > 0.1) continue;
        _pts.set([b[0] - M, y, b[2] - M, b[3] + M, y, b[2] - M, b[3] + M, y, b[5] + M, b[0] - M, y, b[5] + M]); const f = polyOf(e, _pts); if (!f) continue; const q = and(f, flipX(r)); if (q) F = F ? or(F, q) : q; }
      else F = F ? or(F, flipX(r)) : flipX(r);      // (a floor of this level seen through a window: anywhere in what the window shows)
    }
    if (!F) return null;
    const rt = this.mirror && this.mirror.rt, w = Math.max(8, rt ? rt.width : 400), h = Math.max(8, rt ? rt.height : 300);
    F = dilate(F, Math.ceil((10 / w + 0.0045) * MW) + 1, Math.ceil((10 / h + 0.0285) * MH) + 1);      // (in cells: the smear, on the picture's own scale, and a cell more)
    const cx = mc.x, cz = mc.z, sinks = new Map(), starts = new Map(), fb = boundsOf(F);
    const start = (n, q) => { const s = starts.get(n); if (s) or(s, q); else starts.set(n, q.slice()); };
    // (a way out to the open air, with what the table says can be seen from the air it starts in, or null: anything; those going the same way are one)
    const sink = (q, bd, key, wants) => { const s = sinks.get(key); if (!s) { sinks.set(key, [-1, q.slice(), bd.slice(), undefined, wants ? wants.slice() : null]); return; } or(s[1], q); const g = s[2]; for (let k = 0; k < 3; k++) { g[k] = Math.min(g[k], bd[k]); g[k + 3] = Math.max(g[k + 3], bd[k + 3]); } if (s[4] && wants) { for (const w of wants) if (!s[4].includes(w)) s[4].push(w); } else s[4] = null; };      // (wants: the table's lists, any of which allows a bin; null: anything)
    // (a strip's rays go on away from the camera: past the strip's near side, on each axis the camera is off it)
    const away = (x0, z0, x1, z1, lo) => [cx < x0 ? x0 : -INF, lo, cz < z0 ? z0 : -INF, cx > x1 ? x1 : INF, INF, cz > z1 ? z1 : INF];
    const keyOf = (bd, tag) => { let k = tag; for (let j = 0; j < 6; j++) if (Math.abs(bd[j]) < INF) k += ':' + j; return k; };
    const level = []; let home = false;
    for (let n = 0; n < R.length; n++) { const r = R[n]; if (r.y - 0.6 <= y && r._c > y + 0.05) { level.push(n); if (cx >= r.x0 - 1.6 && cx <= r.x1 + 1.6 && cz >= r.z0 - 1.6 && cz <= r.z1 + 1.6) home = true; } }
    for (const n of level) {
      const b = P.rb[n]; _pts.set([b[0] - 1.6, y, b[2] - 1.6, b[3] + 1.6, y, b[2] - 1.6, b[3] + 1.6, y, b[5] + 1.6, b[0] - 1.6, y, b[5] + 1.6]);
      const q = polyIn(e, _pts, F, fb); if (!q) continue;
      start(n, q); let high = null, low = null;
      for (let fi = 0; fi < 4; fi++) {      // fi: 0 west, 1 east, 2 north, 3 south (axis fi >> 1, outward sign by fi & 1)
        const ax = fi >> 1, s = fi & 1 ? 1 : -1, at = s > 0 ? b[ax === 0 ? 3 : 5] : b[ax === 0 ? 0 : 2], lo = ax === 0 ? b[2] : b[0], hi = ax === 0 ? b[5] : b[3];
        const facing = s * ((ax === 0 ? cx : cz) - at) > EPS;      // (the camera is beyond this wall's plane)
        // the hollow: 1.6 m beyond the face
        const a0 = Math.min(at, at + s * 1.6), a1 = Math.max(at, at + s * 1.6), qx0 = ax === 0 ? a0 : lo - 1.6, qx1 = ax === 0 ? a1 : hi + 1.6, qz0 = ax === 0 ? lo - 1.6 : a0, qz1 = ax === 0 ? hi + 1.6 : a1;
        _pts.set([qx0, y, qz0, qx1, y, qz0, qx1, y, qz1, qx0, y, qz1]);
        const wm = polyIn(e, _pts, F, fb);
        if (wm) {
          const hl = this._hollow(n, fi, y, qx0, qz0, qx1, qz1);
          // Can any of its rays climb above the ceiling while still in the hollow? A ray through the floor's plane d out from under the camera
          // rises h (the camera's height over the floor) for every d further it goes: so only if d (1 + H / h) is short of the far side of the strip.
          // (Those that cannot leave the hollow sideways below the ceiling, into a room beside it or out of doors past the wall.)
          const ex = Math.max(qx0 - cx, 0, cx - qx1), ez = Math.max(qz0 - cz, 0, cz - qz1), dmin = Math.hypot(ex, ez), dmax = Math.hypot(Math.max(Math.abs(qx0 - cx), Math.abs(qx1 - cx)), Math.max(Math.abs(qz0 - cz), Math.abs(qz1 - cz)));
          const hc = y - mc.y, H = Math.max(0.5, R[n]._c - y - 0.1), climbs = hc < 0.05 || dmin * (1 + H / hc) < dmax;
          if (climbs) {
            high = high ? or(high, wm) : wm.slice();      // up the hollow (the four sides' as one way), to the sky
            for (const m of hl.rooms) start(m, wm);                                // into the rooms beside it and over it
            const bd = away(qx0, qz0, qx1, qz1, y - 0.05); sink(wm, bd, keyOf(bd, 'roof'), this.unsure || !hl.air ? null : [hl.air]);      // out of the hollow into the open air, over the roofs or beside it
          } else {
            low = low ? or(low, wm) : wm.slice();         // up the hollow as far as the ceiling
            for (const m of hl.rooms) if (R[m].y <= y + 0.6) start(m, wm);       // into the rooms beside it
          }
        }
        // out of doors, past a wall with nothing behind it that faces away from the camera
        if (this._outerFace(n, fi, y) && (!facing || !home)) {
          const d1 = at + s * 3000, e0 = Math.min(at, d1), e1 = Math.max(at, d1);
          if (ax === 0) _pts.set([e0, y, lo - 3000, e1, y, lo - 3000, e1, y, hi + 3000, e0, y, hi + 3000]); else _pts.set([lo - 3000, y, e0, hi + 3000, y, e0, hi + 3000, y, e1, lo - 3000, y, e1]);
          const w2 = polyIn(e, _pts, F, fb);
          if (w2) { const bd = [-INF, y - 0.05, -INF, INF, INF, INF]; if (!facing) { const k = ax === 0 ? 0 : 2; if (s > 0) bd[k] = at - 0.05; else bd[k + 3] = at + 0.05; }
            const oa = this._outAir(n, fi, y); let wl = oa.ok && !this.unsure && !polyIn(e, oa.far, F, fb) ? [] : null;      // (a ray from a point in the open air hits only what can be seen from there: so, the squares of air in the mask)
            if (wl) for (const c of oa.cells) { if (!polyIn(e, c.pts, F, fb)) continue; if (!c.w) { wl = null; break; } wl.push(c.w); }
            sink(w2, bd, keyOf(bd, 'out' + fi), wl); }      // (a ray from a point in the open air hits only what can be seen from there)
        }
      }
      if (high) extra.push([-1, high, [b[0] - 1.6, y - 0.05, b[2] - 1.6, b[3] + 1.6, INF, b[5] + 1.6], this._ring(n, y)]);
      if (low) extra.push([-1, low, [b[0] - 1.6, y - 0.05, b[2] - 1.6, b[3] + 1.6, Math.max(y, R[n]._c) + 0.6, b[5] + 1.6], this._ring(n, y)]);
    }
    for (const [n, q] of starts) out.push([n, q, [-INF, y - 0.05, -INF, INF, INF, INF]]);
    for (const v of sinks.values()) extra.push(v);
    return F;
  }
  // (the bins in the 1.6 m round room n, from level y up: worked out once)
  _ring(n, y) {
    const key = n + ':' + Math.round(y * 10); let l = this._rings.get(key); if (l) return l; l = [];
    const b = this.portals.rb[n], B = this.box; for (let i = 0, k = 0; i < this.n; i++, k += 6) if (B[k] <= b[3] + 1.6 && B[k + 3] >= b[0] - 1.6 && B[k + 2] <= b[5] + 1.6 && B[k + 5] >= b[2] - 1.6 && B[k + 4] >= y - 0.05) l.push(i);
    this._rings.set(key, l); return l;
  }
  // (the hollow beyond face f of room n at level y: the bins over it, the rooms beside it and over it, how high the roofs round it go, and what the
  // table says can be seen from the open air over it at any height, where rays that leave the hollow out of doors can only be: worked out once)
  _hollow(n, f, y, x0, z0, x1, z1) {
    const key = n * 8 + f + ':' + Math.round(y * 10); let h = this._holl.get(key); if (h) return h;
    const rooms = [], B = this.box; let top = y + 3;
    this.plan.rooms.forEach((r, m) => { if (r.x0 - 1.6 <= x1 && r.x1 + 1.6 >= x0 && r.z0 - 1.6 <= z1 && r.z1 + 1.6 >= z0 && r.top > y + 0.05) { if (m !== n && r.y >= y - 0.6) rooms.push(m); top = Math.max(top, r.top + 0.6); } });
    for (const m of this.plan.masses) if (m.x0 <= x1 && m.x1 >= x0 && m.z0 <= z1 && m.z1 >= z0) top = Math.max(top, m.top + 0.6);
    const bins = []; for (let i = 0, k = 0; i < this.n; i++, k += 6) if (B[k] <= x1 && B[k + 3] >= x0 && B[k + 2] <= z1 && B[k + 5] >= z0 && B[k + 4] >= y - 0.05) bins.push(i);
    this._holl.set(key, h = { rooms, top, bins, air: this._airOver(x0, z0, x1, z1, y, Math.min(top, 49)) }); return h;
  }
  // (what can be seen from the open air in the squares over x0..z1 between heights lo and hi, as the table has it: null if over the highest of them it
  // has no line, so cannot say)
  _airOver(x0, z0, x1, z1, lo, hi) {
    const w = new Uint8Array(this.n), t0 = Math.max(0, topOf(lo)), t1 = topOf(hi); if (t1 < 0) return null;
    for (let ix = Math.floor(x0 / CELL); ix <= Math.floor(x1 / CELL); ix++) for (let iz = Math.floor(z0 / CELL); iz <= Math.floor(z1 / CELL); iz++) for (let t = t0; t <= t1; t++) {
      const k = `o:${ix}:${iz}:${t}`; if (!this.has(k, TOPS[t] - 0.1)) { if (t === t1) return null; continue; }
      for (const i of this.list(k)) w[i] = 1; const own = this.index.get(k); if (own != null) w[own] = 1;
    }
    return w;
  }
  // (out of doors past face f of room n at level y: the squares of open air within 72 m out (each with its patch of the floor's plane, and what the table says
  // can be seen from in it; ok false for one it has no line for, the building's own inside left out), and the plane past them, which if it is in the
  // reflection's mask means nothing can be said)
  _inBlock(x, z, y) { for (const m of this.plan.masses) if (x > m.x0 && x < m.x1 && z > m.z0 && z < m.z1 && y < m.top) return true; return false; }
  _outAir(n, f, y) {
    const key = n * 8 + f + ':' + Math.round(y * 10); let o = this._oair.get(key); if (o) return o;
    const b = this.portals.rb[n], ax = f >> 1, s = f & 1 ? 1 : -1, at = s > 0 ? b[ax === 0 ? 3 : 5] : b[ax === 0 ? 0 : 2], lo = (ax === 0 ? b[2] : b[0]) - 72, hi = (ax === 0 ? b[5] : b[3]) + 72, a0 = Math.min(at, at + s * 72), a1 = Math.max(at, at + s * 72);
    const t = topOf(y + 0.05), cells = [];
    if (t >= 0) for (let i = Math.floor((ax === 0 ? a0 : lo) / CELL); i <= Math.floor((ax === 0 ? a1 : hi) / CELL); i++) for (let j = Math.floor((ax === 0 ? lo : a0) / CELL); j <= Math.floor((ax === 0 ? hi : a1) / CELL); j++) {
      const k = `o:${i}:${j}:${t}`, x0 = i * CELL, z0 = j * CELL, x1 = x0 + CELL, z1 = z0 + CELL;
      if (s > 0 ? (ax === 0 ? x1 : z1) < at : (ax === 0 ? x0 : z0) > at) continue;      // (wholly on this side of the wall)
      let w = null; if (this.has(k, y + 0.05)) { w = new Uint8Array(this.n); for (const q of this.list(k)) w[q] = 1; const own = this.index.get(k); if (own != null) w[own] = 1; }
      else if (this._inBlock(x0 + CELL / 2, z0 + CELL / 2, y)) continue;      // (no line, and its middle inside the building at that height: no open air the table knows of there)
      cells.push({ w, pts: new Float64Array([x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1]) });
    }
    const d1 = at + s * 72, d2 = at + s * 3000, e0 = Math.min(d1, d2), e1 = Math.max(d1, d2), L = lo - 3000, H = hi + 3000;
    const far = ax === 0 ? new Float64Array([e0, y, L, e1, y, L, e1, y, H, e0, y, H]) : new Float64Array([L, y, e0, H, y, e0, H, y, e1, L, y, e1]);
    this._oair.set(key, o = { cells, far, ok: t >= 0 }); return o;
  }
  // (things the table says can be seen from here are made ready to draw a few a frame, whether or not the walk shows them yet: their shaders compiled
  // and their pictures sent to the graphics card, so the first time one is turned towards costs nothing. Not what the streamer has let go of.)
  _warm() {
    const q = this._warmQ, R = this.renderer; if (!q.length || !R || !this.warm) return;
    const t0 = performance.now();
    while (q.length && performance.now() - t0 < 2) {
      const it = q.pop(); if (it.dead || it.o.userData.far) continue;
      for (const m of [].concat(it.o.material || [])) {
        if (!m || this._warmed.has(m)) continue; this._warmed.add(m);
        let tex = 0; for (const k in m) { const x = m[k]; if (x && x.isTexture && !x.isRenderTargetTexture && !x.isVideoTexture && x.version > 0 && x.image && x.image.complete !== false && !(R.properties.get(x) || {}).__webglTexture) { try { R.initTexture(x); } catch {} tex++; } }
        if (!(R.properties.get(m) || {}).currentProgram) { try { const p = this.warm(it.o); if (p && p.catch) p.catch(() => {}); } catch {} }
      }
    }
  }

  /** Each frame, before anything is drawn. cam: the camera's place (this.camera, set by main.js, is the camera itself: its matrices must be up to date). toy: the toy's (its places are walked from as well; with `strict`, the chrome toy's own mirror being on, the table must cover it, and the walk is not used: that mirror looks every way). all: draw everything. mirrorY: the floor the reflection lies on, or null if there is none. */
  update(cam, toy, all, mirrorY, strict) {
    if (this._tell) this._tell();
    if (!this.ok) return;
    try {
      const t0 = performance.now();
      this._sweep(cam);
      if (++this._frame % 900 === 0) this._tidy();
      this._warm();
      let keys = null;
      // (near a park feature still to be built on a phone, its walls are missing and the table cannot be trusted out of doors. Indoors, with the walk, it
      // is only what is seen out of doors that they could hide: so there the walk is used, and every way it finds out of doors is drawn whole, the table
      // not asked. Out of doors, everything, as before.)
      const unsure = !this.live && this.unbuilt && !!this.portals && !!this._camera && !strict && !(all || this.off);
      if (!(all || this.off || (!this.live && !unsure))) {
        keys = this.places.keysAt(cam, _keys, this.has, this.pvs.links);
        if (keys && toy) { const t = this.places.keysAt(toy, _toy, this.has, this.pvs.links); if (t) { for (const k of t) if (!keys.includes(k)) keys.push(k); } else if (strict) keys = null; }
        if (keys && unsure && !keys.every(k => this.plan.byId[k])) keys = null;
      }
      this.unsure = unsure && !!keys;
      const walk = !!(keys && this.portals && this._camera && !strict && keys.every(k => this.plan.byId[k]));      // (out of doors the walk would be one way out to everything, which is the table and the camera's own view: not worth its cost)
      if (!keys) { if (this._all) return void (this.ms = performance.now() - t0); }
      const last = this._last, sameKeys = !this._all && keys && last.length === keys.length && keys.every((k, j) => last[j] === k);
      const want = this.want, st = this.state;
      if (!sameKeys) {
        last.length = 0; if (keys) for (const k of keys) last.push(k); this.sig = keys ? keys.join(' + ') : '*'; this._keyed = (this._keyed || 0) + 1;      // (a big thing's say from the table is worked out again once the place changes)
        if (!keys) st.fill(0);
        else {
          want.fill(0); for (const k of keys) { for (const i of this.list(k)) want[i] = 1; const own = this.index.get(k); if (own != null) want[own] = 1; }
          for (let i = 0; i < this.n; i++) st[i] = want[i] ? 0 : (!walk || this.mode !== 'portal') && mirrorY != null && this.mirrorCam ? 2 : 1;      // (without the walk the reflection is not culled: as it always was)
          if (this.warm) { const q = this._warmQ; q.length = 0; for (let i = 0; i < this.n; i++) if (want[i]) { for (const it of this.byBin[i]) q.push(it); for (const pc of this.pieces[i]) q.push(pc.it); } }
        }
      }
      this._all = !keys;
      if (!keys) { this._reset = true; this._hit.length = 0; for (const it of this.items) this._set(it, 0); this.shown = this.count; this.walked = ''; this.ms = performance.now() - t0; return; }
      if (!walk) {
        if (sameKeys && this._lastY === mirrorY && !this._walking) return void (this.ms = performance.now() - t0);
        this._lastY = mirrorY; this._walking = false; this.walked = ''; this._reset = true; this._hit.length = 0;
        let shown = 0;
        for (let i = 0; i < this.n; i++) { const l = this.byBin[i], s = st[i]; for (let k = 0; k < l.length; k++) this._set(l[k], s); if (s === 0) shown += l.length; }
        for (const it of this.multi) { const s = this._multiState(it.bins); this._set(it, s); if (s === 0) shown++; }
        this.shown = shown; this.ms = performance.now() - t0; return;
      }
      // ---- the walk: the view's, then the reflection's
      this._walking = true; this._lastY = mirrorY;
      const c = this._camera, stamp = ++this._stamp, P = this.portals;
      _vp.multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse); const ev = _vp.elements.slice(), eye = [cam.x, cam.y, cam.z];
      // (the camera just where it was, the place and the floor the same, nothing new filed: the answer is the same, and nothing need be done)
      const pe = this._lastEv; if (sameKeys && pe && !this._reset && this._lastMY === mirrorY && this._lastUnsure === this.unsure) { let same = true; for (let k = 0; k < 16; k++) if (pe[k] !== ev[k]) { same = false; break; } if (same) { this._stamp--; return void (this.ms = performance.now() - t0); } }
      this._lastEv = ev; this._lastMY = mirrorY; this._lastUnsure = this.unsure;
      const starts = [], whole = full(), outdoors = keys.some(k => !this.plan.byId[k]);
      for (const k of keys) { const r = this.plan.byId[k]; if (r) starts.push([this.plan.rooms.indexOf(r), whole, ALL6]); }
      if (outdoors) starts.push([-1, whole, ALL6]);      // (the camera in the open air, or in a doorway to it: everything the table allows, in the view)
      let ok = P.walk(eye, ev, starts, this.visits);
      if (ok) for (const v of this.visits) this._mark(v, ev, this.unsure && v[0] < 0 ? null : want, 'vs', stamp, stamp * 2);
      let mok = true, mirror = mirrorY != null && !!this.mirrorCam && !!this.mirror && this.mode === 'portal' && !outdoors;      // (out of doors the polish is on wide floors in the open, and the reflection is not culled: it is everything, as it always was)
      if (ok && mirror) {
        const mc = this.mirror.place(c, mirrorY); _vp.multiplyMatrices(mc.projectionMatrix, mc.matrixWorldInverse); const em = _vp.elements.slice();
        const ms = [], more = [], rm = this._mirrorStarts(em, mirrorY, mc.position, ms, more);
        // (the reflection's walk is not bounded by the table's lines for the rooms it passes: its rays come in at the floor, below where the table looks
        // from, and see past what it saw. Tried, and the sled hill went missing from the polish on a floor upstairs.)
        if (rm) { mok = P.walk([mc.position.x, mc.position.y, mc.position.z], em, ms, this.mvisits); if (mok) { for (const v of more) this.mvisits.push(v); for (const v of this.mvisits) this._mark(v, em, null, 'ms', stamp, stamp * 2 + 1); } }
        else this.mvisits.length = 0;
      }
      this.walked = ok ? (this.unsure ? 'a feature still to be built: out of doors whole; ' : '') + `${this.visits.length} ways in the view` + (mirror ? mok ? `, ${this.mvisits.length} in the reflection` : ', the reflection everything (too many ways)' : '') : 'the table alone (too many ways)';
      let shown = 0;
      // (the usual frame: only what was reached this frame or the last is looked at; anything else is hidden already)
      if (ok && (mirrorY == null || !this.mirrorCam || (mirror && mok)) && !this._reset) {
        const nm = mirrorY == null || !this.mirrorCam;
        for (const it of this._hit) { if (it.dead) continue; const tv = it.vs === stamp, tm = nm ? tv : it.ms === stamp; this._set(it, tv ? (tm ? 0 : 3) : tm ? 2 : 1); if (tv) shown++; }
        for (const it of this._was) if (it.hs !== stamp) this._set(it, 1);
        const w = this._was; this._was = this._hit; this._hit = w; w.length = 0;
        this.shown = shown; this.ms = performance.now() - t0; return;
      }
      this._reset = !(ok && (mirrorY == null || !this.mirrorCam || (mirror && mok)));      // (and once after anything else, everything)
      { const w = this._was; this._was = this._hit; this._hit = w; w.length = 0; }
      for (const it of this.items) {
        if (it.dead) continue;
        const b = it.bins ? (it.bk === this._keyed ? it.bw : (it.bk = this._keyed, it.bw = this._multiState(it.bins))) : st[it.i], tv = ok ? it.vs === stamp : this.unsure || b === 0;      // (the walk, which asked the table as it went; or, if it gave up, the table alone, or everything when the table is not to be trusted)
        const tm = mirrorY == null || !this.mirrorCam ? tv : !mirror || !mok ? true : it.ms === stamp;      // (the reflection: its own walk; or, without one, everything)
        const s = tv ? (tm ? 0 : 3) : tm ? 2 : 1; this._set(it, s); if (tv) shown++;
      }
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
    return `cull: ${this._all ? (this.off ? 'everything (switched off)' : !this.live ? 'everything (a wall the table counts on is ' + (this.missing ? 'missing' : 'open or away' + (this.lost ? ': ' + (this.lost.o.name || 'at ' + [this.lost.x, this.lost.y, this.lost.z].map(Math.round).join(', ')) : '')) + ')' : 'everything (no line in the table for here)') : this.sig}${this.walked ? ' (' + this.walked + ')' : ''}\n      ${drawn} of ${there} things on show to the camera` + (calls != null ? `, ${calls} draw calls` : '') + `; ${this.count} fixed, ${this.movers} seen to move, ${this.never} never hidden; ${this.ms.toFixed(2)} ms`;
  }
}
