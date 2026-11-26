// The parcels under the tree in the yard can be opened. Pull up to one and the button says OPEN.
// One of them has a car in it.

import * as THREE from 'three';

const KEY = 'after-hours.presents';

export class Presents {
  // deps: { museum, plan, garage, poker, score, sound, say, callout, secrets, nav, routeTo() }
  constructor(G, deps) {
    Object.assign(this, deps);
    this.G = G;
    this.list = (this.plan.grounds && this.plan.grounds.parcels) || [];
    this.opened = new Set();
    try { for (const i of JSON.parse(localStorage.getItem(KEY) || '[]')) this.opened.add(i); } catch { /* no storage */ }
    // The biggest parcel is the car. The rest, by size: chips, a map, a paper crown, and coal in the smallest.
    const bySize = this.list.map((b, i) => i).sort((a, b) => this.list[b].w * this.list[b].h - this.list[a].w * this.list[a].h);
    const gifts = ['car', 'chips', 'map', 'crown', 'coal'];
    this.what = {}; bySize.forEach((i, k) => { this.what[i] = gifts[k] || 'coal'; });
    this.bits = [];
    this.list.forEach((b, i) => { if (this.opened.has(i)) this._unwrap(b, i, true); });
  }
  get count() { return this.opened.size; }
  /** The nearest unopened parcel, if you have pulled up to it. */
  near(v) {
    if (this.G.roomId || v.pos.y > 2.5) return null;
    let best = null, bd = 1.5;
    this.list.forEach((b, i) => { if (this.opened.has(i)) return; const d = Math.hypot(v.pos.x - b.x, v.pos.z - b.z) - b.w / 2; if (d < bd && Math.hypot(v.vel.x, v.vel.z) < 3) { bd = d; best = i; } });
    return best;
  }
  // The wrapping comes off: the ribbon goes, the box stands open with its lid beside it.
  _unwrap(b, i, quiet) {
    if (!b.parts) return;
    const [paper, r1, r2] = b.parts, g = paper.parent, mat = paper.material;
    r1.visible = r2.visible = paper.visible = false;
    const made = b.open = [];      // (the pieces of the open box: reset() takes them away again)
    const t = 0.02, add = (w, h, d, x, y, z, rz = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.z = rz; g.add(m); made.push(m); return m; };
    add(b.w, t, b.w, b.x, t / 2, b.z);
    add(t, b.h, b.w, b.x - b.w / 2, b.h / 2, b.z); add(t, b.h, b.w, b.x + b.w / 2, b.h / 2, b.z); add(b.w, b.h, t, b.x, b.h / 2, b.z - b.w / 2); add(b.w, b.h, t, b.x, b.h / 2, b.z + b.w / 2);
    add(b.w + 0.04, t, b.w + 0.04, b.x + b.w * 0.95, 0.1, b.z + 0.06, 0.5);                              // the lid, leaning where it fell
    const tissue = new THREE.Mesh(new THREE.BoxGeometry(b.w - 0.04, 0.02, b.w - 0.04), new THREE.MeshBasicMaterial({ color: 0xfff4d8 })); tissue.position.set(b.x, b.h * 0.55, b.z); g.add(tissue); b.tissue = tissue;
    if (!quiet) this._burst(b);
  }
  _burst(b) {
    const cols = [0xe4002b, 0xffc72c, 0x78be20, 0x00a3e0, 0xffffff, 0xf478c4], g = this.museum.group;
    for (let i = 0; i < 46; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.045), new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide }));
      const a = Math.random() * 6.28, s = 0.6 + Math.random() * 1.6;
      m.position.set(b.x, b.h, b.z); g.add(m);
      this.bits.push({ m, vx: Math.cos(a) * s, vz: Math.sin(a) * s, vy: 2.2 + Math.random() * 2.4, t: 0, sp: 4 + Math.random() * 8 });
    }
  }
  update(dt) {
    for (let i = this.bits.length - 1; i >= 0; i--) {
      const p = this.bits[i]; p.t += dt; p.vy -= 6.5 * dt;
      p.m.position.x += p.vx * dt; p.m.position.z += p.vz * dt; p.m.position.y = Math.max(0.02, p.m.position.y + p.vy * dt);
      p.m.rotation.x += p.sp * dt; p.m.rotation.y += p.sp * 0.7 * dt;
      if (p.t > 4) { p.m.parent.remove(p.m); p.m.geometry.dispose(); p.m.material.dispose(); this.bits.splice(i, 1); }
    }
  }
  /** Open parcel i. Returns what was in it. */
  open(i) {
    const b = this.list[i]; if (!b || this.opened.has(i)) return null;
    this.opened.add(i);
    try { localStorage.setItem(KEY, JSON.stringify([...this.opened])); } catch { /* fine */ }
    this._unwrap(b, i, false);
    if (this.sound && this.sound.perfect) this.sound.perfect();
    const what = this.what[i];
    if (what === 'car') { this.callout('A CAR!'); this.say('A red car trimmed in white, with candy canes on it and a tree in the back. It is yours: pick it on the title screen.', 0.4, 9); if (this.garage && !this.garage.isOpen('xmas')) this.garage.buy('xmas'); }
    else if (what === 'chips') { this.callout('500 CHIPS'); this.say('A stack of chips, for the card game on the roof. Somebody knows what you get up to.', 0.4, 8); if (this.poker) this.poker.spend(-500); }
    else if (what === 'map') { const to = this.routeTo && this.routeTo(); this.callout('A MAP'); this.say(to ? `A map, drawn in crayon. It shows the way to ${to}.` : 'A map, drawn in crayon, of places you have already found.', 0.4, 8); }
    else if (what === 'crown') { this.callout('A PAPER CROWN'); this.say('A paper crown from a cracker, and a joke that is not funny. 250 points for wearing it.', 0.4, 8); if (this.score) this.score.add(250); }
    else { this.callout('COAL'); this.say('A lump of coal. Somebody has seen you driving on the stairs.', 0.4, 8); }
    if (this.secrets) this.secrets.find('presents');
    return what;
  }
  /** A new game wraps them up again, where they stand. (They used to stay drawn open until a reload, closed in the record: each could be opened again, paid again, and got a second box.) */
  reset() {
    this.opened.clear(); try { localStorage.removeItem(KEY); } catch { /* fine */ }
    for (const b of this.list) {
      if (!b.open) continue;
      for (const m of b.open) { if (m.parent) m.parent.remove(m); m.geometry.dispose(); } b.open = null;
      if (b.tissue) { if (b.tissue.parent) b.tissue.parent.remove(b.tissue); b.tissue.geometry.dispose(); b.tissue.material.dispose(); b.tissue = null; }
      if (b.parts) for (const p of b.parts.slice(0, 3)) p.visible = true;
    }
  }
}
