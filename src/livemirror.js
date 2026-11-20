// A mirror that shows the room it is in. The chrome toy (the Manta) reflects a painted night sky
// by default, which costs nothing. When the machine has frames to spare, the surroundings are
// photographed from the toy itself, one face of a small cube at a time, and the chrome shows that
// instead: the pictures on the walls, the coloured roof, the doorway you are heading for.
//
// It is only ever on when it can be afforded. The game's own frame rate decides: it comes on when
// that has held up well for a couple of seconds, and goes off (for a good while) the moment it
// sags. One face every other frame is half a small extra picture a frame at most.

import * as THREE from 'three';

const SIZE = 96, ON_ABOVE = 54, OFF_BELOW = 44;

export class LiveMirror {
  constructor(renderer, scene) {
    this.renderer = renderer; this.scene = scene;
    this.rt = new THREE.WebGLCubeRenderTarget(SIZE, { generateMipmaps: false });
    this.cam = new THREE.CubeCamera(0.06, 70, this.rt);
    this.cam.coordinateSystem = renderer.coordinateSystem; this.cam.updateCoordinateSystem();
    // Chrome that needs no lighting worked out for it: what is round it, plus a faint tint of its own.
    this.mat = new THREE.MeshBasicMaterial({ color: 0x15131f, envMap: this.rt.texture, reflectivity: 1, combine: THREE.AddOperation });
    this.live = false; this.good = 0; this.rest = 0; this.face = 0; this.tick = 0; this.filled = 0; this.swapped = [];
  }
  /** Each frame while playing. `toy` is the vehicle's group; `chrome` says whether it is the mirrored one. */
  update(dt, fps, toy, pos, chrome) {
    this.rest = Math.max(0, this.rest - dt);
    const fast = fps >= ON_ABOVE;
    this.good = chrome && fast && !this.rest ? this.good + dt : 0;
    if (this.live && (!chrome || fps < OFF_BELOW)) { this._off(); if (chrome) this.rest = 20; }       // it sagged: not tried again for a while
    if (!this.live && this.good > 2) { this.live = true; this.filled = 0; }
    if (!this.live) return;
    // The first six faces are taken one a frame, so the mirror is whole before it is shown; after that, one every other frame.
    if (this.filled >= 6 && (this.tick++ & 1)) return;
    const r = this.renderer, prev = r.getRenderTarget(), xr = r.xr.enabled, was = toy.visible;
    this.cam.position.copy(pos); this.cam.updateMatrixWorld(true);
    toy.visible = false; r.xr.enabled = false;
    r.setRenderTarget(this.rt, this.face); r.clear(); r.render(this.scene, this.cam.children[this.face]);
    r.setRenderTarget(prev); r.xr.enabled = xr; toy.visible = was;
    this.face = (this.face + 1) % 6;
    if (this.filled < 6 && ++this.filled === 6) this._on(toy);
  }
  _on(toy) {
    this.swapped = [];
    toy.traverse(o => { if (o.isMesh && o.material && o.material.userData && o.material.userData.chrome) { this.swapped.push([o, o.material]); o.material = this.mat; } });
  }
  _off() { for (const [o, m] of this.swapped) o.material = m; this.swapped = []; this.live = false; this.good = 0; this.filled = 0; }
  /** The toy has been changed for another: put back what was borrowed. */
  reset() { if (this.live || this.swapped.length) this._off(); }
}
