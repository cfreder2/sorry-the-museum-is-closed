// Streaming: only what is near is on the graphics card.
//
// The whole museum, the streets, the park and the lake are built at start-up, but a phone cannot hold all of it on its
// graphics card at once (it gives the page a fixed allowance and kills it past that). So every fixed thing in the world
// is given the box it stands in, and a few times a second each is checked against where the camera is:
//   * near (within `near` metres, on or about the camera's level): drawn as usual;
//   * far (past `far`): put on a layer the camera does not draw, and its geometry and textures are released from the
//     graphics card (unless something near shares them). They are sent up again, by three.js, the first time they
//     are drawn after you come back, from the copies still held in memory.
// Nothing about a feature changes: `visible` is left to the features themselves; this uses the layer only.
//
// What is not streamed: anything bigger than a city block (the ground, the sky, the lake), anything that says
// userData.always or is not under the museum's group (the toys), and the works of art (museum.js loads and lets go of
// their pictures itself, by distance).
// What moves under the museum's group (a train, a car in the street, a mouse, a lift, the sleigh) is streamed by where
// it is now, not by where it stood when it was counted: its box goes with it. (They were hidden by where they first
// stood: a train that started far off stayed hidden as it came past.) Such a thing is only hidden when far, never let go
// from the graphics card: it would be sent up again every time it came round.

import * as THREE from 'three';
import { onCard } from './budget.js';

const HIDDEN = 7;                          // the layer the camera does not draw
// The streamer and the visibility table (src/visible.js) both decide whether a thing is drawn, by its layers. So that they
// do not undo each other, neither writes the layers itself: each keeps its own say on the thing (userData.far, from here;
// userData.cullMask, the table's layers for it) and this puts the two together. Far is hidden whatever the table says.
// (A piece drawn as part of a batch, src/bake.js, is on no layer at all, whatever either says, until its batch is undone; and
// what is too small to see from where the camera is, userData.tiny, is drawn only in the floor's reflection, on the layer
// the culling keeps for that, src/visible.js's MIRROR: the polish is smeared, and takes a little of even a speck.)
// (The culling also keeps a layer for what only the view draws, VIEW: a speck there is drawn by neither, since the reflection had no need of it.)
const MIRROR = 8, VIEW = 9;
export function applyLayers(o) { const u = o.userData; let m = u.baked ? 0 : u.far ? 1 << HIDDEN : u.cullMask != null ? u.cullMask : 1; if (u.tiny && (m & (1 | 1 << VIEW))) m = m & (1 | 1 << MIRROR) ? 1 << MIRROR : 1 << HIDDEN; o.layers.mask = m; }
// Is every array of this geometry still in memory, so that three.js can send it up again after a dispose()?
const held = g => { for (const k in g.attributes) { const a = g.attributes[k]; if (!(a.data ? a.data.array : a.array)) return false; } return !g.index || !!g.index.array; };

export class Streamer {
  // inside(box): is this thing inside a room (true) or out of doors / on the outside of the building (false)?
  // indoors(point): is the camera in a room? Then: in a room, rooms near you and only the outside close by; out of doors,
  // the outside a long way off and a room's insides only when you are near (through a door or a window).
  constructor(renderer, root, { near = 80, far = 95, out = 220, big = 150, skip = () => false, inside = () => true, indoors = () => true } = {}) {
    this.renderer = renderer; this.root = root; this.near = near; this.far = far; this.outR = out; this.big = big; this.skip = skip; this.inside = inside; this.indoors = indoors;
    this.items = []; this.t = 0; this.at = new THREE.Vector3(1e9, 0, 0); this.out = 0;
    this._box = new THREE.Box3(); this._v = new THREE.Vector3();
  }
  // Every mesh, line, point cloud and sprite under the root, with the box it stands in. Call once the world is built
  // (and again for anything added later: things already known are passed over).
  register() {
    const known = this._known || (this._known = new WeakSet()), b = this._box;
    this.root.updateMatrixWorld(true);
    this.root.traverse(o => {
      if (known.has(o) || !(o.isMesh || o.isLine || o.isPoints || o.isSprite) || !o.geometry) return;
      if (o.userData.baked) return;      // (drawn in a batch, src/bake.js, which is streamed in its place: looked at again next time, in case its batch has been undone)
      known.add(o);
      if (o.userData.always || this.skip(o)) return;
      for (let p = o; p; p = p.parent) if (p.userData && p.userData.always) return;
      try {
        if (o.isInstancedMesh) { if (!o.boundingBox) o.computeBoundingBox(); b.copy(o.boundingBox).applyMatrix4(o.matrixWorld); }
        else { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); }
      } catch { return; }
      if (b.isEmpty() || !isFinite(b.min.x) || !isFinite(b.max.x)) return;
      const sx = b.max.x - b.min.x, sz = b.max.z - b.min.z;
      if (sx > this.big || sz > this.big) return;          // the ground, the sky, the lake: always
      const e = o.matrixWorld.elements;
      this.items.push({ o, box: b.clone(), on: true, inner: !!this.inside(b), x: e[12], y: e[13], z: e[14], moves: false });      // (x, y, z: where it stood when its box was made)
    });
  }
  // How far the camera is from a box: across the ground, with a level's difference in height counted as a long way
  // (the galleries upstairs are no use to you in the basement).
  _dist(box, p) {
    const dx = Math.max(box.min.x - p.x, 0, p.x - box.max.x), dz = Math.max(box.min.z - p.z, 0, p.z - box.max.z);
    const dy = Math.max(box.min.y - p.y, 0, p.y - box.max.y);
    return Math.hypot(dx, dz) + Math.max(0, dy - 3) * 6;
  }
  // Keep a place loaded for a while whatever the camera does (it is on its way there): see prepareAt.
  hold(point, secs) { this.heldAt = point.clone(); this.heldUntil = performance.now() + secs * 1000; }
  update(dt, cam) {
    if (this.heldAt && performance.now() < this.heldUntil) cam = this.heldAt; else this.heldAt = null;
    this.t += dt;
    if (this.t < 0.4 && cam.distanceToSquared(this.at) < 4) return;
    this.t = 0; this.at.copy(cam);
    const gone = [], keepG = new Set(), keepT = new Set(), inRoom = this.indoors(cam), gap = this.far - this.near;
    // how near a thing must be to be drawn, by where you are and where it is
    const reach = inRoom ? { inner: this.near, outer: this.near * 0.8 } : { inner: this.near * 0.55, outer: this.outR };
    for (const it of this.items) {
      // (moved since its box was made: the box goes with it, and from now on it is one of the things that move)
      const e = it.o.matrixWorld.elements; if (e[12] !== it.x || e[13] !== it.y || e[14] !== it.z) { it.box.translate(this._v.set(e[12] - it.x, e[13] - it.y, e[14] - it.z)); it.x = e[12]; it.y = e[13]; it.z = e[14]; it.moves = true; }
      const d = this._dist(it.box, cam), r = it.inner ? reach.inner : reach.outer;
      if (it.on && d > r + gap) { it.on = false; it.o.userData.far = true; applyLayers(it.o); if (!(this.pinned && this.pinned.has(it))) gone.push(it); }      // (pinned: hidden, but kept on the card)
      else if (!it.on && d < r) { it.on = true; it.o.userData.far = false; applyLayers(it.o); }
    }
    // Let go of what only far things use (worked out only when something has gone: it is a walk over every material).
    if (gone.length) for (const it of this.items) if (it.on) { keepG.add(it.o.geometry); for (const m of [].concat(it.o.material || [])) for (const k in m) { const x = m[k]; if (x && x.isTexture) keepT.add(x); } }
    for (const it of gone) {
      if (it.moves) continue;
      // A geometry whose copy in memory has been let go (museum.js, lights.js, budget.js do that once it is on the
      // graphics card) cannot be sent up again: it stays on the card, hidden. Disposing it made every later frame throw.
      // Nor can one whose vertices, or a texture whose canvas, budget.js has let go of (onCard): it is kept on the card too.
      const g = it.o.geometry; if (g && !keepG.has(g) && !onCard(g) && held(g)) g.dispose();
      for (const m of [].concat(it.o.material || [])) for (const k in m) { const x = m[k]; if (x && x.isTexture && !x.isRenderTargetTexture && !x.isVideoTexture && !keepT.has(x) && !onCard(x)) x.dispose(); }
    }
    this.out = this.items.length - this.items.filter(i => i.on).length;
  }
  // Get a place ready before the toy is put there (thrown out of the building, a lift to another level): what is near it
  // is switched on as if the camera were there, its textures sent up a few at a time, and its shaders compiled, so the
  // first frame there does not stall the page for seconds. onProgress(0..1) as it goes; resolves when ready (or after
  // `limit` seconds, whatever is left being sent as it is first drawn).
  async prepareAt(point, camera, scene, onProgress = () => {}, limit = 12) {
    const t0 = performance.now(), R = this.renderer;
    this.hold(point, limit + 6); this.t = 1; this.update(0, point);                       // (as if the camera stood there now)
    const tex = new Set();
    for (const it of this.items) if (it.on) for (const m of [].concat(it.o.material || [])) for (const k in m) { const x = m[k]; if (x && x.isTexture && !x.isRenderTargetTexture && !x.isVideoTexture && x.version > 0 && !(R.properties.get(x) || {}).__webglTexture) tex.add(x); }
    const list = [...tex]; let i = 0;
    const frame = () => new Promise(r => requestAnimationFrame(() => r()));
    while (i < list.length && performance.now() - t0 < limit * 1000) {
      const s = performance.now();
      while (i < list.length && performance.now() - s < 24) { try { R.initTexture(list[i]); } catch { /* sent when first drawn */ } i++; }
      onProgress(0.6 * i / list.length); await frame();
    }
    // the shaders: compiled from a camera standing at the place, in the browser's own time where it can
    if (camera && scene && R.compileAsync) {
      const c = camera.clone(); c.position.copy(point).add(this._v.set(0, 1.5, 0)); c.updateMatrixWorld();
      let done = false; const p = R.compileAsync(scene, c).then(() => { done = true; }, () => { done = true; });
      const left = Math.max(1, limit - (performance.now() - t0) / 1000), s = performance.now();
      while (!done && performance.now() - s < left * 1000) { onProgress(0.6 + 0.4 * Math.min(0.95, (performance.now() - s) / (left * 1000))); await frame(); }
      void p;
    }
    onProgress(1);
  }
  // A journey the camera will make that cannot wait for anything (the opening's flight, src/opening.js): everything that
  // would be drawn from any of `points` is pinned: it is still hidden and shown by distance as the camera goes, but never
  // let go from the graphics card, until release(). So it can be warmed beforehand (src/flywarm.js), and the journey
  // sends nothing up as it goes: on a phone, every first drawing on the way was a frame the screen did not show.
  // Hands back the things, in the order the journey first comes near them.
  pinAlong(points) {
    const seen = new Set(), out = [];
    for (const p of points) {
      const inRoom = this.indoors(p), reach = inRoom ? { inner: this.near, outer: this.near * 0.8 } : { inner: this.near * 0.55, outer: this.outR };
      for (const it of this.items) { if (seen.has(it)) continue; if (this._dist(it.box, p) < (it.inner ? reach.inner : reach.outer)) { seen.add(it); out.push(it); } }
    }
    this.pinned = seen;
    return out;
  }
  release() { this.pinned = null; this.t = 1; this.at.set(1e9, 0, 0); }
  // Everything back on (a staged view or a cut scene that looks a long way off).
  all() { for (const it of this.items) if (!it.on) { it.on = true; it.o.userData.far = false; applyLayers(it.o); } this.at.set(1e9, 0, 0); }
}
