// A worked example of a feature (features.js), kept small on purpose: a lost mitten by the front door of the lobby.
// Copy this shape. (It is a real, if tiny, secret: pick the mitten up and bring it to the lobby desk.)
import * as THREE from 'three';
import { feature } from './features.js';

feature({
  id: 'example-mitten',
  secrets: [['mitten', 'A mitten by the door']],
  init(k) {
    const lobby = k.plan.byId[k.plan.front.a];
    this.at = { x: lobby.x0 + 1.2, y: lobby.y, z: (k.plan.front.z0 + k.plan.front.z1) / 2 + 2.2 };
    this.desk = { x: (lobby.x0 + lobby.x1) / 2, y: lobby.y, z: (lobby.z0 + lobby.z1) / 2 };
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.1), new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.9 }));
    m.position.set(this.at.x, this.at.y + 0.015, this.at.z); k.group.add(m); this.mesh = m;
  },
  active(k) { return k.close(this.at, 25, 3); },
  update(dt, k) {
    if (!k.carry.has('mitten') && this.mesh.parent === k.group && k.close(this.at, 0.45)) { k.carry.take({ id: 'mitten', mesh: this.mesh }); k.say('Somebody’s mitten. The lobby desk keeps lost things.', 4); }
  },
  near(v, k) {
    if (!k.carry.has('mitten') || !k.close(this.desk, 2.5)) return null;
    return { verb: 'RETURN', hint: 'The lobby desk. E to hand in the mitten.', act: () => { k.carry.drop('mitten'); k.chips(20); if (k.find('mitten')) k.callout('RETURNED'); } };
  },
  spots() { return [{ kind: 'secret', id: 'mitten', name: 'A mitten by the door', x: this.at.x, y: this.at.y, z: this.at.z }]; },
  reset(k) { if (this.mesh.parent !== k.group) { k.group.add(this.mesh); } this.mesh.position.set(this.at.x, this.at.y + 0.015, this.at.z); },
});
