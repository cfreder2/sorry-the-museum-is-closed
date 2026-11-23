// The look pass, the part of it that needs the whole world built first (src/finish.js has the rest):
//   * the snow, everywhere it is drawn with the museum's snow texture: drifts (a slow unevenness over the ground, so
//     a field of snow is not one flat colour) and the cool sheen moonlit snow has towards the horizon;
//   * soft contact shadows under what moves about: the security robots, the mice, the sled-hill penguins. One
//     instanced mesh of soft round blobs, only for those near the camera.
// Registered last (main.js imports it last), so its init runs after every other feature has built its meshes, and
// before the shaders are compiled behind the loading screen.

import * as THREE from 'three';
import { feature, features } from './features.js';
import { snowLook, setMoon } from './finish.js';
import { radial } from './textures.js';

const MAX = 40, NEAR2 = 45 * 45;

feature({
  id: 'look',
  init(k) {
    const snow = k.museum.snowTex && k.museum.snowTex.source, done = new Set();
    if (k.museum.moonAt) setMoon(k.museum.moonAt.clone().sub(new THREE.Vector3(200, 0, 100)));
    if (snow) k.G.scene.traverse(o => {
      for (const m of [].concat(o.material || [])) if (m && !done.has(m) && m.isMeshStandardMaterial && m.map && m.map.source === snow) { done.add(m); snowLook(m); m.needsUpdate = true; }
    });
    this.snowMats = done.size;
    const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: radial(0, 0.75), transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    const m = this.blobs = new THREE.InstancedMesh(geo, mat, MAX);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0; m.frustumCulled = false; m.renderOrder = 1;
    k.group.add(m);
    this.M = new THREE.Matrix4(); this.Q = new THREE.Quaternion(); this.S = new THREE.Vector3(); this.V = new THREE.Vector3();
    this.by = id => features.find(f => f.id === id);
  },
  update(dt, k) {
    const cam = k.G.camera.position, out = [];
    const near = (x, z) => (x - cam.x) ** 2 + (z - cam.z) ** 2 < NEAR2;
    const guards = this.by('guards');
    if (guards && guards.bots) for (const b of guards.bots) { const p = b.group.position; if (b.group.visible && near(p.x, p.z)) out.push(p.x, b.fy + 0.013, p.z, 0.95); }
    const mice = this.by('mice');
    if (mice && mice.list) for (const mo of mice.list) { const g = mo.mesh; if (g && g.visible && g.parent && near(g.position.x, g.position.z)) out.push(g.position.x, mo.y + 0.012, g.position.z, 0.2); }
    const sled = this.by('sledding');
    if (sled && sled.pens) for (const p of sled.pens) if (p.state !== 'home' && near(p.x, p.z)) out.push(p.x, p.y + 0.02, p.z, 0.55);
    const m = this.blobs, n = Math.min(MAX, out.length / 4);
    for (let i = 0; i < n; i++) {
      const o = i * 4; this.S.set(out[o + 3], 1, out[o + 3]);
      m.setMatrixAt(i, this.M.compose(this.V.set(out[o], out[o + 1], out[o + 2]), this.Q, this.S));
    }
    m.count = n; if (n) m.instanceMatrix.needsUpdate = true;
  },
});
