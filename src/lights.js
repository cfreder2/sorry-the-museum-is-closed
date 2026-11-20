// Light switches.
//
// Beside every doorway, inside the room, there is a switch plate at the height a person would want
// it, and under it, at skirting height, a second, bigger rocker for people 46 cm long. A pilot lamp
// on the low one glows amber while the room is dark, so it can be found. Pull up to either (or
// hover there) and the action button reads LIGHTS.
//
// What a switch does depends on the room:
//   * A gallery still wakes by itself the first time you go in. After that its switch puts it out
//     (picture lamps and all) and brings it back.
//   * Every other room (offices, stores, plant, corridors, stairs, Griffin Court) starts dark and
//     stays dark until its switch is thrown. Then its working lights come on: cooler and whiter
//     than a gallery, the ceiling fittings glowing, the furniture readable.
//
// How a room is lit, and what it costs. Nothing in this building is lit by a real light except the
// headlamp: every surface glows a little with its own colour. So a room's working lights are one
// more term of that glow, "what this surface would show under an even white light", scaled by the
// room's level (0 to 1):
//   * Walls, ceiling, trim and a wooden floor are one mesh per room already, each with its own
//     material: they get a float uniform apiece (the same object for all of one room's materials).
//   * The stone and slate floors, and all the furniture, are merged across rooms. Their vertices
//     are given the number of the room they stand in (one Uint16 each, worked out once at start),
//     and the shader looks the room's level up in a 512 x 1 texture. Tubes the fit-out left
//     switched off are flagged in the same number, and glow when their room is on.
//   * Switch plates, and the ceiling panels of rooms the fit-out gave no tubes, are instanced boxes:
//     one mesh to each 32 m patch of each level, and only the patches near the camera are drawn.
// No lights are added and nothing is done per frame for rooms that are not at that moment fading:
// throwing a switch writes one byte of the texture and a uniform, for under a second.
//
// Kept between visits (localStorage 'after-hours.lights'): which rooms have been switched on or
// off. A new game forgets it. In a race the switches are dead and every room is as it was.

import * as THREE from 'three';
import { wallPoint, groundAt, SLAB } from './plan.js';

const KEY = 'after-hours.lights';
const WORK = new THREE.Color(0.56, 0.62, 0.7);             // the colour of a room's working light (linear)
const SLOTS = 512;                                         // rooms the level texture has room for
const MIN_AREA = 6;                                        // a cupboard smaller than this has no switch

// Where the plates go, in metres: along the wall from the edge of the opening, and up from the floor.
const BESIDE = 0.44, ON_JAMB = 0.15, HALF = 0.11, HIGH = 1.2, LOW = 0.15;

const smooth = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
// A tube catching: twice, then steady.
function catching(e) {
  if (e < 0.05) return 0.7;
  if (e < 0.12) return 0.06;
  if (e < 0.19) return 0.8;
  if (e < 0.27) return 0.25;
  return 0.6 + 0.4 * smooth((e - 0.27) / 0.55);
}
const ON_FOR = 0.85, OFF_FOR = 0.32;
// The same colours src/furnish.js bakes into its vertices (sRGB hex to linear bytes).
function bytes(hex) { return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map(v => { const s = v / 255; return Math.max(1, Math.round(255 * (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4))); }); }
const TUBE_OFF = bytes(0x8a8e92), TUBE_ON = [bytes(0xdfe8ff), bytes(0xa8c8ff)];

// One room's own material: its level is a uniform.
function patchOwn(mat, lum, lift) {
  const prev = mat.onBeforeCompile, key = 'roomwork-own|' + lift + '|' + (prev ? prev.toString() : '');
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    sh.uniforms.roomLum1 = lum; sh.uniforms.roomWork = { value: WORK };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float roomLum1;\nuniform vec3 roomWork;')
      .replace('#include <lights_physical_fragment>', `totalEmissiveRadiance += mix(diffuseColor.rgb, vec3(0.5), ${lift.toFixed(2)}) * roomWork * roomLum1;\n#include <lights_physical_fragment>`);
  };
  mat.customProgramCacheKey = () => key;
}
// A material shared by many rooms: each vertex says which room it is in, and the level is looked up.
function patchShared(mat, tex, lift) {
  const prev = mat.onBeforeCompile, key = 'roomwork-shared|' + lift + '|' + (prev ? prev.toString() : '');
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    sh.uniforms.roomLum = { value: tex }; sh.uniforms.roomWork = { value: WORK };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float roomIx;\nuniform sampler2D roomLum;\nvarying float vRoomLum;\nvarying float vRoomFit;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n{ float ix = roomIx; vRoomFit = step(32767.5, ix); ix -= vRoomFit * 32768.0; vRoomLum = texelFetch(roomLum, ivec2(int(ix + 0.5), 0), 0).r; }');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 roomWork;\nvarying float vRoomLum;\nvarying float vRoomFit;')
      .replace('#include <lights_physical_fragment>', `totalEmissiveRadiance += (mix(diffuseColor.rgb, vec3(0.5), ${lift.toFixed(2)}) * roomWork + vRoomFit * vec3(2.3, 2.5, 2.8)) * vRoomLum;\n#include <lights_physical_fragment>`);
  };
  mat.customProgramCacheKey = () => key;
}

export class Lights {
  // `hung`: anything else on a wall that a plate must keep off, shaped like a hung work ({ room, x, y, z, nx, nz, w, h }).
  constructor(museum, plan, sound, hung = []) {
    this.museum = museum; this.plan = plan; this.sound = sound; this.extra = hung;
    this.active = true; this.onCount = null;               // (rooms switched off, back rooms switched on)
    this.saved = {}; this.offs = new Set(); this.ons = new Set();
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.plan === plan.made) { Object.assign(this.saved, s.rooms || {}); for (const id of s.off || []) this.offs.add(id); for (const id of s.on || []) this.ons.add(id); } } catch { /* no storage */ }
    for (const id of Object.keys(this.saved)) if (!museum.rooms[id]) delete this.saved[id];
    this.anims = new Map();
    this.index = new Map(plan.rooms.map((r, i) => [r.id, i + 1]));      // slot 0 is "no room": always dark
    this.lum = new Uint8Array(SLOTS);
    this.tex = new THREE.DataTexture(this.lum, SLOTS, 1, THREE.RedFormat, THREE.UnsignedByteType);
    this.tex.minFilter = this.tex.magFilter = THREE.NearestFilter; this.tex.generateMipmaps = false; this.tex.needsUpdate = true;
    this._materials();
    this._vertices();
    this._panels();
    this._switches();
    // A gallery that wakes by itself has, in effect, had its switch thrown.
    const was = museum.onRoomLit;
    museum.onRoomLit = (id, st) => { if (was) was(id, st); this._sync(id); };
    this.begin('explore');
  }

  // ---------------------------------------------------------------- lighting --

  _materials() {
    for (const st of Object.values(this.museum.rooms)) {
      st.work = 0;
      if (st.room.kind === 'gallery') continue;
      st.lum = { value: 0 };
      patchOwn(st.wallMat, st.lum, 0.34); patchOwn(st.trimMat, st.lum, 0.2);
      if (st.floorMat) patchOwn(st.floorMat, st.lum, 0.12);
    }
  }

  // Which room is every vertex of the merged floors and of the furniture in?
  _vertices() {
    const { plan, museum } = this, rooms = plan.rooms, E = 0.03;
    const within = (r, x, y, z) => x >= r.x0 - E && x <= r.x1 + E && z >= r.z0 - E && z <= r.z1 + E && y >= r.y - 0.06 && y <= r.top + 0.06;
    this.tubes = new Uint8Array(rooms.length + 1);         // does the fit-out hang strip lights in this room?
    let last = 0, count = 0;
    const find = (x, y, z) => {
      if (within(rooms[last], x, y, z)) return last;
      for (let i = 0; i < rooms.length; i++) if (within(rooms[i], x, y, z)) return (last = i);
      return -1;
    };
    const mats = new Set();
    for (const c of museum.fitout.chunks) {
      const geo = c.mesh.geometry, pos = geo.attributes.position.array, col = geo.attributes.color.array, n = pos.length / 3;
      const basic = c.mesh.material.isMeshBasicMaterial, ix = basic ? null : new Uint16Array(n);
      for (let i = 0; i < n; i++) {
        const y = pos[i * 3 + 1], k = find(pos[i * 3], y, pos[i * 3 + 2]);
        if (k < 0) continue;
        const r = rooms[k], high = y > r.y + (r.ceil != null ? r.ceil : r.h - 0.15) - 0.14, a = col[i * 3], b = col[i * 3 + 1], g = col[i * 3 + 2];
        if (basic) { if (high && TUBE_ON.some(t => t[0] === a && t[1] === b && t[2] === g)) this.tubes[k + 1] = 1; continue; }
        const dead = high && a === TUBE_OFF[0] && b === TUBE_OFF[1] && g === TUBE_OFF[2];
        if (dead) this.tubes[k + 1] = 1;
        ix[i] = k + 1 + (dead ? 32768 : 0);
      }
      if (basic) continue;
      const attr = new THREE.BufferAttribute(ix, 1);
      attr.onUpload(function () { this.array = null; });
      geo.setAttribute('roomIx', attr);
      mats.add(c.mesh.material); count += n;
    }
    for (const m of mats) patchShared(m, this.tex, 0.06);
    // The stone and the slate: every floor that is not one room's own boards, four corners to a piece.
    const own = new Set(Object.values(museum.rooms).map(st => st.floorMat).filter(Boolean));
    for (const mesh of museum.floors) {
      if (own.has(mesh.material) || mesh.geometry.type !== 'BufferGeometry' || !mesh.geometry.attributes.position) continue;
      const pos = mesh.geometry.attributes.position.array, n = pos.length / 3, ix = new Uint16Array(n);
      for (let q = 0; q + 3 < n; q += 4) {
        let x = 0, z = 0; const y = pos[q * 3 + 1];
        for (let k = 0; k < 4; k++) { x += pos[(q + k) * 3] / 4; z += pos[(q + k) * 3 + 2] / 4; }
        let at = -1;
        for (let i = 0; i < rooms.length; i++) { const r = rooms[i]; if (Math.abs(r.y - y) < 0.05 && x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) { at = i; break; } }
        // (A threshold lies in the thickness of the wall, in neither room: each of its corners takes the room it touches, so light spills across it.)
        for (let k = 0; k < 4; k++) ix[q + k] = (at >= 0 ? at : find(pos[(q + k) * 3], y + 0.02, pos[(q + k) * 3 + 2])) + 1;
      }
      mesh.geometry.setAttribute('roomIx', new THREE.BufferAttribute(ix, 1));
      patchShared(mesh.material, this.tex, 0.1); count += n;
    }
    // The stone round every doorway is one mesh for the whole building. Each of its corners stands a hand's breadth into one room or the other.
    const stone = museum.group.children.find(m => m.isMesh && m.material && m.material.isMeshStandardMaterial && m.material.color.getHex() === 0xa69c8a && m.material.emissive.getHex() === 0x8a7f6c);
    if (stone) {
      const pos = stone.geometry.attributes.position.array, n = pos.length / 3, ix = new Uint16Array(n);
      for (let i = 0; i < n; i++) { let k = find(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); if (k < 0) k = find(pos[i * 3], pos[i * 3 + 1] - 0.5, pos[i * 3 + 2]); ix[i] = k + 1; }
      stone.geometry.setAttribute('roomIx', new THREE.BufferAttribute(ix, 1));
      patchShared(stone.material, this.tex, 0.2); count += n;
    }
    this.vertices = count;
  }

  // Ceiling fittings for the rooms the fit-out hung none in: flat panels, dark until the room is on.
  _panels() {
    const { plan } = this, list = this.panelList = [];
    this.panelsOf = {};
    for (const r of plan.rooms) {
      if (r.kind !== 'room' || r.use === 'terrace' || this.tubes[this.index.get(r.id)]) continue;
      const w = r.x1 - r.x0, d = r.z1 - r.z0, longX = w >= d, L = longX ? w : d, W = longX ? d : w;
      if (W < 1.2 || L < 1.6) continue;
      const n = Math.max(1, Math.min(8, Math.round(L / 4.2))), rows = W > 8 ? [0.28, 0.72] : [0.5], y = r.y + r.h - 0.035;
      const holes = plan.wells.filter(k => k.y > r.y + 1 && Math.abs(k.y - SLAB - r.top) < 1.3);
      for (const f of rows) for (let i = 0; i < n; i++) {
        const a = L * (i + 0.5) / n, b = W * f, x = longX ? r.x0 + a : r.x0 + b, z = longX ? r.z0 + b : r.z0 + a;
        if (holes.some(k => x > k.x0 - 0.8 && x < k.x1 + 0.8 && z > k.z0 - 0.8 && z < k.z1 + 0.8)) continue;
        const p = { x, y, z, longX };
        (this.panelsOf[r.id] || (this.panelsOf[r.id] = [])).push(p); list.push(p);
      }
    }
    this.panelCount = list.length;
  }
  _glow(id, k) {
    const ps = this.panelsOf[id]; if (!ps) return;
    const c = this._c || (this._c = new THREE.Color());
    c.setRGB(0.16 + 7 * k, 0.165 + 7.6 * k, 0.18 + 8.6 * k);                 // (the material shows a third of this as its own light)
    for (const p of ps) { p.cell.mesh.setColorAt(p.k, c); p.cell.mesh.instanceColor.needsUpdate = true; }
  }
  // Set a room's working lights to a level, at once.
  _level(st, k) {
    st.work = k;
    if (st.lum) st.lum.value = k;
    const i = this.index.get(st.room.id);
    if (st.room.kind !== 'gallery') { this.lum[i] = Math.round(k * 255); this.tex.needsUpdate = true; this._glow(st.room.id, k); }
  }

  // ---------------------------------------------------------------- switches --

  // A plate beside each doorway, on the right as you come in if the wall is free there, else on the
  // left, else on the stone of the door surround itself. Never over a picture or its label, never in
  // or over another opening, never behind furniture; if nowhere will do, the doorway goes without.
  _switches() {
    const { plan, museum } = this, list = this.list = [], by = this.byRoom = {};
    const stats = this.stats = { doorways: 0, switches: 0, onWall: 0, onSurround: 0, onCorner: 0, shared: 0, skipped: 0, skippedList: [], roomsWith: 0, roomsWithout: [], roomsExcluded: [] };
    const wallsOf = new Map();
    for (const w of plan.walls) { if (!wallsOf.has(w.room.id)) wallsOf.set(w.room.id, []); wallsOf.get(w.room.id).push(w); }
    const lap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
    for (const r of plan.rooms) {
      if (r.use === 'terrace' || r.top <= r.y + 0.5 || (r.x1 - r.x0) * (r.z1 - r.z0) < MIN_AREA) { stats.roomsExcluded.push(r.id); continue; }
      const st = museum.rooms[r.id], taken = (plan.fitout && plan.fitout[r.id] && plan.fitout[r.id].taken) || [];
      const walls = wallsOf.get(r.id) || [], hungBy = new Map();
      // Every picture on a wall, with its frame, its lamp and its label, as a stretch of that wall.
      const hungOn = w => {
        if (hungBy.has(w)) return hungBy.get(w);
        const tu = w.horiz ? Math.cos(w.rot) : -Math.sin(w.rot);      // which way along the wall is the viewer's right
        const out = [...st.arts, ...this.extra.filter(a => a.room === r.id)].filter(a => !a.obj && a.nx === w.nx && a.nz === w.nz && Math.abs((w.horiz ? a.z : a.x) - w.fixed) < 0.3).map(a => {
          const u = w.horiz ? a.x : a.z, fr = a.frame || 0.12, e = a.w / 2 + fr * 1.45 + 0.08;
          return { lo: Math.min(u - e, u + tu * (a.w / 2 + fr + 0.36)), hi: Math.max(u + e, u + tu * (a.w / 2 + fr + 0.36)), y0: (a.fy || 0), y1: a.y + a.h / 2 + 1 };
        });
        hungBy.set(w, out);
        return out;
      };
      // Will a plate go at `u` along wall `w`, standing `off` out from it, with its foot at height Y? '' if so; if not, a letter saying why not.
      const refuse = (w, u, off, Y, own, level) => {
        if (w.side === r.glass) return 'e';
        if (u - HALF < w.lo + 0.02 || u + HALF > w.hi - 0.02) return 'e';                                   // off the end of the wall
        if (w.openings.some(q => q !== own && u + HALF > q.lo - 0.34 && u - HALF < q.hi + 0.34 && r.y + q.y < Y + 1.5 && r.y + q.y + q.h + 0.4 > Y)) return 'd';      // in, or on the surround of, another doorway
        if (hungOn(w).some(h => u + HALF > h.lo && u - HALF < h.hi && h.y0 < Y + 3 && h.y1 > Y)) return 'a';      // a picture hangs here
        const p = wallPoint(w, u, Y, off), q = wallPoint(w, u, Y, 0.34);
        const zone = { x0: Math.min(p.x, q.x) - (w.horiz ? 0.13 : 0), x1: Math.max(p.x, q.x) + (w.horiz ? 0.13 : 0), z0: Math.min(p.z, q.z) - (w.horiz ? 0 : 0.13), z1: Math.max(p.z, q.z) + (w.horiz ? 0 : 0.13) };
        if (level && taken.some(t => lap(zone, t))) return 'f';                                             // furniture stands against the wall here
        if (plan.obstacles.some(b => lap(zone, b) && b.y1 > Y + 0.03 && b.y0 < Y + 1.4)) return 'o';         // or something else does
        if (plan.lifts.some(b => lap(zone, b))) return 'l';
        if (Math.abs(groundAt(plan, q.x, q.z, Y + 0.3, 0) - Y) > 0.12) return 'g';                           // nothing to stand on in front of it (or a ramp is)
        return '';
      };
      for (const w of walls) {
        if (w.side === r.glass) continue;
        for (const o of w.openings) {
          const d = o.door;
          if (d.vent) continue;
          stats.doorways++;
          const Y = r.y + o.y, side = w.horiz ? -w.nz : w.nx, inward = w.horiz ? w.nz : w.nx;      // side +1: the right-hand jamb as you come in is at o.hi
          // Where to try, in order: the wall to the right of the door, to the left, the stone of the surround either side, and, for a
          // doorway that fills the end of a passage, round the corner on the side wall.
          const tries = [[w, (side > 0 ? o.hi : o.lo) + side * BESIDE, 0, 'wall'], [w, (side > 0 ? o.lo : o.hi) - side * BESIDE, 0, 'wall'], [w, (side > 0 ? o.hi : o.lo) + side * ON_JAMB, 0.07, 'surround'], [w, (side > 0 ? o.lo : o.hi) - side * ON_JAMB, 0.07, 'surround']];
          for (const s of [side, -side]) {
            const end = s > 0 ? w.hi : w.lo, gap = s > 0 ? w.hi - o.hi : o.lo - w.lo;
            const w2 = gap < 0.6 && walls.find(x => x.horiz !== w.horiz && Math.abs(x.fixed - end) < 0.02);
            if (w2) tries.push([w2, w.fixed + inward * 0.36, 0, 'corner']);
          }
          let put = null, share = false, why = '';
          for (const [tw, u, off, kind] of tries) {
            const no = refuse(tw, u, off, Y, tw === w ? o : null, Math.abs(o.y) < 0.3);
            if (no) { why += no; continue; }
            const p = wallPoint(tw, u, Y, off);
            if ((by[r.id] || []).some(x => Math.hypot(x.x - p.x, x.z - p.z) < 0.34 && Math.abs(x.y - Y) < 1)) { share = true; break; }      // another doorway's plate is already here (on this wall, or just round the corner)
            put = { room: r.id, door: d.id, wall: tw, u, y: Y, off, kind, x: p.x, z: p.z, nx: tw.nx, nz: tw.nz, i: list.length };
            break;
          }
          if (share) { stats.shared++; continue; }
          if (!put) { stats.skipped++; stats.skippedList.push(r.id + ':' + d.id + ':' + why); continue; }
          list.push(put); (by[r.id] || (by[r.id] = [])).push(put);
          stats.switches++; stats[put.kind === 'wall' ? 'onWall' : put.kind === 'corner' ? 'onCorner' : 'onSurround']++;
        }
      }
      if (by[r.id]) stats.roomsWith++; else stats.roomsWithout.push(r.id);
    }
    this._build();
  }

  // Everything this file draws is boxes: six to a switch (plate, toggle, conduit, low plate, rocker, pilot lamp) and one to a
  // ceiling panel. They are instanced, one mesh to each patch of each level of the building (the same 32 m patches the furniture
  // is cut into), so that only the patches near the camera are drawn at all.
  _build() {
    const cells = this.cells = [], by = new Map(), CELL = 32;
    const cellAt = (x, y, z) => {
      const key = Math.round(y / 4) + '|' + Math.floor(x / CELL) + '|' + Math.floor(z / CELL);
      let c = by.get(key);
      if (!c) { c = { n: 0, x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, z0: Infinity, z1: -Infinity, mesh: null }; by.set(key, c); cells.push(c); }
      if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y; if (z < c.z0) c.z0 = z; if (z > c.z1) c.z1 = z;
      return c;
    };
    for (const s of this.list) { const c = cellAt(s.x, s.y, s.z); s.cell = c; s.k = c.n; c.n += 6; }
    for (const p of this.panelList) { const c = cellAt(p.x, p.y, p.z); p.cell = c; p.k = c.n; c.n += 1; }
    const box = new THREE.BoxGeometry(1, 1, 1);
    // Self-lit in its own colour, like everything else in the building; a colour brighter than white is a lamp.
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.1, emissive: 0xffffff, emissiveIntensity: 0.32 });
    mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n  totalEmissiveRadiance *= vColor.rgb;\n#endif'); };
    const c = new THREE.Color(), cols = [[0.78, 0.76, 0.69], [0.9, 0.88, 0.8], [0.3, 0.31, 0.33], [0.42, 0.44, 0.47], [0.86, 0.84, 0.76], [0, 0, 0]];
    const M = new THREE.Matrix4(), I = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3();
    for (const cell of cells) { const m = cell.mesh = new THREE.InstancedMesh(box, mat, cell.n); m.matrixAutoUpdate = false; m.instanceMatrix.setUsage(THREE.StaticDrawUsage); }
    for (const s of this.list) { for (let k = 0; k < 6; k++) s.cell.mesh.setColorAt(s.k + k, c.setRGB(...cols[k])); this._pose(s, false); }
    c.setRGB(0.16, 0.165, 0.18);
    for (const p of this.panelList) { p.cell.mesh.setMatrixAt(p.k, M.compose(P.set(p.x, p.y, p.z), I, p.longX ? S.set(1.2, 0.05, 0.3) : S.set(0.3, 0.05, 1.2))); p.cell.mesh.setColorAt(p.k, c); }
    for (const cell of cells) { const m = cell.mesh; m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; m.computeBoundingSphere(); this.museum.group.add(m); }
  }

  // Set one switch's boxes down on its wall; the toggle and the rocker lean the way the room is, and the pilot lamp shows it.
  _pose(s, on) {
    const M = this._M || (this._M = new THREE.Matrix4()), Q = this._Q || (this._Q = new THREE.Quaternion()), T = this._T || (this._T = new THREE.Quaternion()), P = this._P || (this._P = new THREE.Vector3()), S = this._S || (this._S = new THREE.Vector3()), X = this._X || (this._X = new THREE.Vector3(1, 0, 0)), Yax = this._Y || (this._Y = new THREE.Vector3(0, 1, 0));
    Q.setFromAxisAngle(Yax, Math.atan2(s.nx, s.nz));
    const at = (y, out) => P.set(s.x + s.nx * out, s.y + y, s.z + s.nz * out), tilt = on ? -0.3 : 0.3;
    const b = s.cell.mesh, k = s.k;
    b.setMatrixAt(k, M.compose(at(HIGH, 0.007), Q, S.set(0.086, 0.125, 0.014)));
    T.setFromAxisAngle(X, tilt).premultiply(Q);
    b.setMatrixAt(k + 1, M.compose(at(HIGH, 0.02), T, S.set(0.022, 0.05, 0.022)));
    b.setMatrixAt(k + 2, M.compose(at((HIGH - 0.0625 + LOW + 0.11) / 2, 0.009), Q, S.set(0.024, HIGH - 0.0625 - LOW - 0.11, 0.018)));
    b.setMatrixAt(k + 3, M.compose(at(LOW, 0.014), Q, S.set(0.2, 0.22, 0.028)));
    T.setFromAxisAngle(X, tilt * 0.6).premultiply(Q);
    b.setMatrixAt(k + 4, M.compose(at(LOW - 0.012, 0.036), T, S.set(0.12, 0.13, 0.03)));
    b.setMatrixAt(k + 5, M.compose(at(LOW + 0.082, 0.032), Q, S.set(0.05, 0.02, 0.012)));
    const c = this._c || (this._c = new THREE.Color());
    b.setColorAt(k + 5, on ? c.setRGB(0.3, 1.5, 0.55) : c.setRGB(7, 3.1, 0.5));      // amber while the room is dark, so the switch can be found
    b.instanceMatrix.needsUpdate = true; if (b.instanceColor) b.instanceColor.needsUpdate = true;
  }
  _sync(id) {
    const ss = this.byRoom[id]; if (!ss) return;
    const on = this.isOn(id);
    for (const s of ss) this._pose(s, on);
  }

  // ------------------------------------------------------------------- state --

  isOn(id) {
    const st = this.museum.rooms[id]; if (!st) return false;
    return st.room.kind === 'gallery' ? st.lit && st.sw !== false : st.sw === true;
  }

  // The start of a game, after the museum has been put to sleep: every room as it was left.
  begin(mode) {
    const m = this.museum;
    this.active = mode !== 'race';
    this.anims.clear();
    this.lum.fill(0); this.tex.needsUpdate = true;
    // A gallery lights itself the first time you drive in, lamp by lamp, with its chime: that is the best thing in the building and no switch stands in its way.
    // The back rooms are the ones that start dark and want their switch.
    for (const st of Object.values(m.rooms)) { st.sw = undefined; st.work = 0; if (st.lum) st.lum.value = 0; }
    if (this.active) for (const [id, v] of Object.entries(this.saved)) {
      const st = m.rooms[id]; if (!st) continue;
      st.sw = !!v;
      if (st.room.kind === 'gallery' || !v) continue;
      st.work = 1; st.lum.value = 1; this.lum[this.index.get(id)] = 255;
      for (const a of st.arts) if (a.wakeAt < 0) { a.wakeAt = m.time; m._waking.add(a); st.lit = true; }
    }
    for (const id of Object.keys(this.panelsOf)) this._glow(id, m.rooms[id].work);
    for (const s of this.list) this._pose(s, this.isOn(s.room));
  }
  // A new game: nothing has been switched.
  reset() { this.saved = {}; this.offs.clear(); this.ons.clear(); this._save(); }
  _save() { try { localStorage.setItem(KEY, JSON.stringify({ plan: this.plan.made, rooms: this.saved, off: [...this.offs], on: [...this.ons] })); } catch { /* fine */ } }

  // The switch this toy could reach from where it is, if any: { ...switch, facing } (facing: its nose is plainly towards it).
  near(v, roomId) {
    if (!this.active || !roomId) return null;
    const ss = this.byRoom[roomId]; if (!ss || v.air || v.rail) return null;
    if (v.vel.x * v.vel.x + v.vel.z * v.vel.z > 16) return null;
    let best = null, bd = 1.3;
    for (const s of ss) {
      const dy = v.pos.y - s.y; if (dy < -0.3 || dy > 2.3) continue;
      const dx = s.x - v.pos.x, dz = s.z - v.pos.z, d = Math.hypot(dx, dz);
      if (d >= bd || -(dx * s.nx + dz * s.nz) < 0.04) continue;
      bd = d; best = s;
    }
    if (!best) return null;
    const dx = best.x - v.pos.x, dz = best.z - v.pos.z, ahead = (dx * Math.sin(v.yaw) + dz * Math.cos(v.yaw)) / (bd || 1);
    best.facing = ahead > (bd < 0.7 ? 0.4 : 0.78);
    best.dist = bd;
    return best;
  }

  // Throw it. Returns true if the room is now on.
  toggle(s) {
    if (!this.active || !s) return false;
    const id = s.room, on = !this.isOn(id), st = this.museum.rooms[id];
    this.set(id, on, s);
    this.saved[id] = on ? 1 : 0;
    if (on) { if (st.room.kind === 'room') this.ons.add(id); } else this.offs.add(id);
    this._save();
    const snd = this.sound;
    if (snd) { snd.tick(0.16, 1500, 0.018); setTimeout(() => snd.tick(0.1, 650, 0.035), 55); if (on && st.room.kind !== 'gallery') setTimeout(() => snd.bell(1568, 0, 0.012, 0.5, 0.3), 260); }
    if (this.onCount) this.onCount(this.offs.size, this.ons.size);
    return on;
  }

  // Put a room's lights on or off, with the flicker (or, with motion reduced, a plain fade).
  set(id, on, from) {
    const m = this.museum, st = m.rooms[id]; if (!st) return;
    const gallery = st.room.kind === 'gallery';
    st.sw = on;
    const an = { st, on, t: 0, gallery, from: gallery ? st.wake : st.work, arts: null };
    if (on) {
      if (gallery && !st.lit) st.lit = true;
      for (const a of st.arts) {
        if (a.wakeAt >= 0) continue;
        a.wakeAt = m.time + 0.08 + (from ? Math.hypot(a.x - from.x, a.z - from.z) * 0.035 : 0) + Math.random() * 0.1; a.rang = false; m._waking.add(a); st.lit = true;
      }
    } else {
      an.arts = st.arts.map(a => { a.wakeAt = -1; a.rang = false; m._waking.delete(a); return [a, a.lit]; });
    }
    this.anims.set(id, an);
    this._sync(id);
  }

  // Ten times a second: which patches of plates and panels are near enough to draw (one comparison a patch). And every frame,
  // only the rooms that are at this moment coming on or going out.
  update(dt, cam) {
    if (cam && (this._tick = ((this._tick || 0) + 1) % 6) === 0) for (const c of this.cells) c.mesh.visible = cam.x > c.x0 - 34 && cam.x < c.x1 + 34 && cam.z > c.z0 - 34 && cam.z < c.z1 + 34 && cam.y > c.y0 - 7 && cam.y < c.y1 + 9;
    if (!this.anims.size) return;
    const calm = !!this.museum.calm;
    for (const [id, an] of this.anims) {
      an.t += dt;
      const st = an.st, len = an.on ? (calm ? 0.6 : ON_FOR) : (calm ? 0.5 : OFF_FOR), done = an.t >= len;
      let k;
      if (an.on) k = an.from + (1 - an.from) * (done ? 1 : calm ? smooth(an.t / len) : catching(an.t));
      else { const f = done ? 0 : calm ? 1 - smooth(an.t / len) : (an.t < 0.05 ? 0.35 : an.t < 0.1 ? 0.7 : 0.7 * (1 - smooth((an.t - 0.1) / (len - 0.1)))); k = an.from * f; if (an.arts) for (const [a, lit] of an.arts) { a.lit = lit * f; this.museum._paint(a); } }
      if (an.gallery) st.wake = k; else this._level(st, k);
      if (done) this.anims.delete(id);
    }
  }
}
