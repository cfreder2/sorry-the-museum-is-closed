// Looking at a thing in the building while you use it. A game on a monitor, the pads on the
// pedestal, the canvas on the easel: the camera goes and stands square in front of it, the way it
// does for a painting, and what you touch on the glass is the thing itself.
//
// A surface is a rectangle in the world: its middle, the way it faces, how big it is. The stage
// moves the camera to fill the screen with it and, each frame, says where on the screen it now is,
// so that an (invisible) page element can be laid exactly over it to take the taps.

import * as THREE from 'three';

export class Stage {
  constructor(camera, onChange) { this.camera = camera; this.on = false; this.onChange = onChange || null; this._v = new THREE.Vector3(); }
  // surface: { x, y, z, nx, ny, nz, w, h, up: [x, y, z] }; opts: { fill, el, back }
  enter(s, { fill = 0.8, el = null, back = 0 } = {}) {
    const c = this.camera;
    this.s = s; this.el = el; this.fill = fill; this.back = back; this.t = 0;
    this.from = c.position.clone(); this.fov0 = c.fov;
    this.n = new THREE.Vector3(s.nx, s.ny || 0, s.nz).normalize();
    this.up = new THREE.Vector3(...(s.up || [0, 1, 0])).normalize();
    this.right = new THREE.Vector3().crossVectors(this.up, this.n).normalize();
    this.up2 = new THREE.Vector3().crossVectors(this.n, this.right).normalize();
    this.centre = new THREE.Vector3(s.x, s.y, s.z);
    this.on = true;
    if (el) { this.css = el.style.cssText; }
    document.body.classList.add('staged');
    if (this.onChange) this.onChange(true);
  }
  // How far back the camera stands for the surface to fill the screen that much.
  _dist() { const c = this.camera, t = Math.tan(46 * Math.PI / 360); return Math.max(this.s.h / 2 / (t * this.fill), this.s.w / 2 / (t * c.aspect * this.fill)) + this.back; }
  update(dt) {
    if (!this.on) return;
    const c = this.camera; this.t += dt;
    const k = Math.min(1, this.t / 0.9), e = k * k * (3 - 2 * k);
    const want = this._v.copy(this.centre).addScaledVector(this.n, this._dist());
    c.position.lerpVectors(this.from, want, e);
    c.fov += (46 - c.fov) * e; c.up.copy(this.up2); c.lookAt(this.centre); c.updateProjectionMatrix(); c.updateMatrixWorld();
    if (this.el) {
      const r = this.rect(), st = this.el.style;
      st.position = 'fixed'; st.left = r.left + 'px'; st.top = r.top + 'px'; st.width = r.width + 'px'; st.height = r.height + 'px'; st.maxWidth = 'none'; st.maxHeight = 'none'; st.margin = '0';
    }
  }
  /** Where the surface is on the screen now, in CSS pixels. */
  rect() {
    const c = this.camera, W = innerWidth, H = innerHeight; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const p = this._v.copy(this.centre).addScaledVector(this.right, sx * this.s.w / 2).addScaledVector(this.up2, sy * this.s.h / 2).project(c);
      const x = (p.x + 1) / 2 * W, y = (1 - p.y) / 2 * H;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
  }
  leave() {
    if (!this.on) return;
    this.on = false;
    if (this.el) this.el.style.cssText = this.css || '';
    this.camera.up.set(0, 1, 0); this.camera.fov = this.fov0; this.camera.updateProjectionMatrix();
    document.body.classList.remove('staged');
    if (this.onChange) this.onChange(false);
  }
}
