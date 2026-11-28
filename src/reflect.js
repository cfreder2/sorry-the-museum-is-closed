// Polished floors. The scene is drawn a second time from below the floor and
// the result is folded into the floor materials, strongest at a glancing
// angle, which from a toy car is every angle.
//
// There is one mirror and the building has several levels, so the mirror is
// laid on whichever floor you are on (render() is told its height). Floors on
// other levels are matt for as long as you are not on them: a floor only takes
// the reflection if it lies in the mirror's plane. The second drawing is cut
// off at that plane, so the room underneath does not show up in the polish.

import * as THREE from 'three';

export class FloorMirror {
  constructor(scale = 0.5) {
    this.scale = scale;
    this.enabled = true;
    // Mipmapped, so a polished-not-mirrored floor can read a blurred level for free.
    this.rt = new THREE.WebGLRenderTarget(16, 16, { type: THREE.HalfFloatType, depthBuffer: true, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    this.cam = new THREE.PerspectiveCamera();
    this.matrix = new THREE.Matrix4();
    this.strength = { value: 1 };
    this.level = { value: 0 };          // the height of the floor the mirror is lying on
    this._plane = new THREE.Plane(); this._clip = new THREE.Vector4(); this._q = new THREE.Vector4();
    this._bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this._p = new THREE.Vector3(); this._f = new THREE.Vector3(); this._u = new THREE.Vector3();
  }

  setSize(w, h) {
    this.rt.setSize(Math.max(8, Math.round(w * this.scale)), Math.max(8, Math.round(h * this.scale)));
  }

  // k = [how much the floor mirrors seen from above, how much more at a glance]
  patch(mat, k) {
    const u = { tRefl: { value: this.rt.texture }, reflMatrix: { value: this.matrix }, reflK: { value: new THREE.Vector2(k[0], k[1]) }, reflOn: this.strength, reflY: this.level };
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform mat4 reflMatrix;\nvarying vec4 vRefl;\nvarying float vReflY;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvRefl = reflMatrix * modelMatrix * vec4(transformed, 1.0);\nvReflY = (modelMatrix * vec4(transformed, 1.0)).y;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D tRefl;\nuniform vec2 reflK;\nuniform float reflOn;\nuniform float reflY;\nvarying vec4 vRefl;\nvarying float vReflY;')
        .replace('#include <opaque_fragment>', `
          {
            vec2 ruv = vRefl.xy / vRefl.w;
            float lum = dot(diffuseColor.rgb, vec3(0.333));
            ruv += (lum - 0.3) * vec2(0.006, 0.012);
            float fres = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 4.0);
            // Three taps down the screen: reflections in a waxed floor smear towards you.
            vec3 rc = texture2D(tRefl, ruv, 1.6).rgb * 0.5
              + texture2D(tRefl, ruv + vec2(0.0, 0.012), 2.6).rgb * 0.25
              + texture2D(tRefl, ruv - vec2(0.0, 0.02), 3.2).rgb * 0.25;
            rc = min(rc, vec3(2.5));
            outgoingLight += rc * (reflK.x + reflK.y * fres) * reflOn * (1.0 - step(0.08, abs(vReflY - reflY)));
          }
          #include <opaque_fragment>`);
    };
    return mat;
  }

  render(renderer, scene, camera, floors, y = 0) {
    this.strength.value = this.enabled ? 1 : 0;
    this.level.value = y;
    if (!this.enabled) return;
    const p = this._p.setFromMatrixPosition(camera.matrixWorld);
    if (p.y <= y + 0.001) { this.strength.value = 0; return; }       // looking up at it from underneath: nothing to mirror
    this.place(camera, y);
    for (const m of floors) m.visible = false;
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.rt);
    renderer.clear();
    renderer.render(scene, this.cam);
    renderer.setRenderTarget(prev);
    for (const m of floors) m.visible = true;
  }

  // The second camera put where it will draw from, under the floor at height y, for `camera` as it stands now. (Also asked
  // for before the frame is drawn, by src/visible.js, which works out what this camera can see: the same numbers either way.)
  place(camera, y) {
    const p = this._p.setFromMatrixPosition(camera.matrixWorld);
    const f = this._f.set(0, 0, -1).transformDirection(camera.matrixWorld);
    const u = this._u.set(0, 1, 0).transformDirection(camera.matrixWorld);
    const c = this.cam;
    c.position.set(p.x, 2 * y - p.y, p.z);
    c.up.set(u.x, -u.y, u.z);
    c.lookAt(p.x + f.x, 2 * y - (p.y + f.y), p.z + f.z);
    c.projectionMatrix.copy(camera.projectionMatrix);
    c.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    c.updateMatrixWorld();
    c.matrixWorldInverse.copy(c.matrixWorld).invert();
    this.matrix.copy(this._bias).multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
    // Nothing below the floor belongs in its reflection. The near side of what the second camera
    // sees is slanted to lie in the floor (an oblique near plane), which costs nothing to draw.
    const pl = this._plane.set(this._u.set(0, 1, 0), -y).applyMatrix4(c.matrixWorldInverse), cp = this._clip.set(pl.normal.x, pl.normal.y, pl.normal.z, pl.constant), q = this._q, e = c.projectionMatrix.elements;
    q.set((Math.sign(cp.x) + e[8]) / e[0], (Math.sign(cp.y) + e[9]) / e[5], -1, (1 + e[10]) / e[14]);
    cp.multiplyScalar(2 / cp.dot(q));
    e[2] = cp.x; e[6] = cp.y; e[10] = cp.z + 1 - 0.003; e[14] = cp.w;
    return c;
  }
}
