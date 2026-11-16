// Polished floors. The scene is drawn a second time from below the floor and
// the result is folded into the floor materials, strongest at a glancing
// angle, which from a toy car is every angle.

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
    this._bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this._p = new THREE.Vector3(); this._f = new THREE.Vector3(); this._u = new THREE.Vector3();
  }

  setSize(w, h) {
    this.rt.setSize(Math.max(8, Math.round(w * this.scale)), Math.max(8, Math.round(h * this.scale)));
  }

  // k = [how much the floor mirrors seen from above, how much more at a glance]
  patch(mat, k) {
    const u = { tRefl: { value: this.rt.texture }, reflMatrix: { value: this.matrix }, reflK: { value: new THREE.Vector2(k[0], k[1]) }, reflOn: this.strength };
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform mat4 reflMatrix;\nvarying vec4 vRefl;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvRefl = reflMatrix * modelMatrix * vec4(transformed, 1.0);');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D tRefl;\nuniform vec2 reflK;\nuniform float reflOn;\nvarying vec4 vRefl;')
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
            outgoingLight += rc * (reflK.x + reflK.y * fres) * reflOn;
          }
          #include <opaque_fragment>`);
    };
    return mat;
  }

  render(renderer, scene, camera, floors) {
    this.strength.value = this.enabled ? 1 : 0;
    if (!this.enabled) return;
    const p = this._p.setFromMatrixPosition(camera.matrixWorld);
    if (p.y <= 0.001) return;
    const f = this._f.set(0, 0, -1).transformDirection(camera.matrixWorld);
    const u = this._u.set(0, 1, 0).transformDirection(camera.matrixWorld);
    const c = this.cam;
    c.position.set(p.x, -p.y, p.z);
    c.up.set(u.x, -u.y, u.z);
    c.lookAt(p.x + f.x, -(p.y + f.y), p.z + f.z);
    c.projectionMatrix.copy(camera.projectionMatrix);
    c.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    c.updateMatrixWorld();
    this.matrix.copy(this._bias).multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
    for (const m of floors) m.visible = false;
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.rt);
    renderer.clear();
    renderer.render(scene, c);
    renderer.setRenderTarget(prev);
    for (const m of floors) m.visible = true;
  }
}
