// Things to do out in the park (features.js): a row of snowball targets on Butler Field, and a skater going round the rink who will let you follow her.
import * as THREE from 'three';
import { feature } from './features.js';
import { fitText, twoFaced } from './textures.js';

// Lit a little from within, as everything out of doors is here, so it reads at night.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, emissive: new THREE.Color(color).multiplyScalar(0.4), ...o });
const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); return b; };
const inBox = (q, p) => p.x > q.x0 && p.x < q.x1 && p.z > q.z0 && p.z < q.z1;

// (The sledding hill, with its run, is sledhill.js.)
// (Ice fishing on the harbour is icefish.js.)


// ---------------------------------------------------------------- snowball targets
// A row of painted targets on stakes out on Butler Field, as if for snowballs. Knock them all down (drive into
// them, or come down on them from a jump).
feature({
  id: 'bullseye',
  secrets: [['bullseye', 'Bullseye']],
  init(k) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
    ['#f4f1e8', '#c0392b', '#f4f1e8', '#c0392b', '#f4f1e8', '#c0392b'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(64, 64, 62 - i * 11, 0, Math.PI * 2); c.fill(); });
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.8 }), back = mat(0x7a5232), stake = mat(0x5a3a22);
    this.bodies = []; this.at = { x: 430, y: 0, z: 70 };
    for (let i = 0; i < 6; i++) {
      const x = 405 + i * 10, t = new THREE.Group(); t.position.set(x, 0, 70 + (i % 2) * 1.5); t.rotation.y = 0.2 * (i % 3 - 1);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 24), [back, face, face]); disc.rotation.x = Math.PI / 2; disc.position.y = 0.62;
      t.add(disc, box(0.05, 0.45, 0.05, stake, 0, 0.22, 0));
      k.group.add(t);
      // A few snowballs lying at the foot of each.
      for (let j = 0; j < 3; j++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0xf6f8fb)); s.position.set(x - 1.2 + j * 0.13, 0.05, 68.6 + (j % 2) * 0.1); k.group.add(s); }
      this.bodies.push(k.pushable(t, { r: 0.28, h: 1.0, tip: true, hit: 0.7, drag: 4, onTip: (b, s) => this.hit(k, s) }));
    }
  },
  hit(k, s) {
    k.synth.note(150 + Math.random() * 40, 0.25, { type: 'square', vol: 0.05 }); k.synth.noise(0.2, { vol: 0.05, lp: 1200 });
    const up = this.bodies.filter(b => !b.tipped).length;
    if (!up) { k.synth.chime([523, 659, 784]); k.chips(15); if (k.find('bullseye')) k.callout('BULLSEYE'); else k.say('All six down again.', 2.5); }
    else if (up === 5) k.say('One down, five to go.', 2.5);
  },
  active(k) { return k.close(this.at, 45, 4); },
  update(dt, k) { for (const b of this.bodies) b.step(dt); if (k.close(this.at, 32, 3)) k.once('bullseye', 'A row of targets set up for a snowball fight. Knock them over.', 5); },
  spots() { return this.at ? [{ kind: 'secret', id: 'bullseye', name: 'Bullseye (six targets)', ...this.at }] : []; },
  reset() { for (const b of this.bodies || []) b.reset(); },
});

// ---------------------------------------------------------------- the skater
// Somebody skating round the rink after hours, in a red hat and scarf. Stay with her for a whole lap.
feature({
  id: 'skater',
  secrets: [['skater', 'Skating partner']],
  init(k) {
    const R = this.rink = k.plan.rink; if (!R) return;
    this.a = R.rx * 0.68; this.b = R.rz * 0.66; this.th = 0; this.lap = 0; this.speed = 2.7;
    this.at = { x: R.x, y: 0, z: R.z };
    const g = this.g = new THREE.Group(), coat = mat(0x24405e), red = mat(0xb8322a), skin = mat(0xe0b394), dark = mat(0x1d1d22), blade = mat(0xcfd6dc, { metalness: 0.8, roughness: 0.3 });
    const body = new THREE.Group(); body.position.y = 0.92; g.add(body); this.body = body;
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 4, 10), coat); torso.position.y = 0.28; body.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), skin); head.position.y = 0.72; body.add(head);
    const hat = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), red); hat.position.y = 0.74; body.add(hat);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), red); pom.position.y = 0.86; body.add(pom);
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 6, 14), red); scarf.rotation.x = Math.PI / 2; scarf.position.y = 0.58; body.add(scarf);
    const tail = box(0.07, 0.03, 0.32, red, 0, 0.56, -0.2); body.add(tail); this.tail = tail;
    const limb = (len, r, m) => { const p = new THREE.Group(), c = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 3, 8), m); c.position.y = -len / 2; p.add(c); return p; };
    this.arms = [-1, 1].map(s => { const a = limb(0.42, 0.045, coat); a.position.set(s * 0.21, 0.5, 0); a.rotation.z = s * 0.5; body.add(a); return a; });
    this.legs = [-1, 1].map(s => { const l = limb(0.72, 0.06, dark); l.position.set(s * 0.09, 0, 0); const sk = box(0.05, 0.08, 0.28, dark, 0, -0.84, 0.03), bl = box(0.012, 0.03, 0.32, blade, 0, -0.9, 0.03); l.add(sk, bl); body.add(l); return l; });
    k.group.add(g); this._place();
  },
  _place() { const R = this.rink; this.g.position.set(R.x + Math.cos(this.th) * this.a, 0, R.z + Math.sin(this.th) * this.b); const tx = -Math.sin(this.th) * this.a, tz = Math.cos(this.th) * this.b; this.g.rotation.y = Math.atan2(tx, tz); },
  active(k) { return !!this.rink && k.close(this.at, 40, 4); },
  update(dt, k) {
    const R = this.rink, a = this.a, b = this.b, d = this.speed * dt / Math.hypot(a * Math.sin(this.th), b * Math.cos(this.th));
    this.th += d; this.clock = (this.clock || 0) + dt; this._place();
    // Long pushes, one leg then the other, leaning into the turn.
    const ph = this.clock * 2.4;
    this.legs[0].rotation.set(Math.max(0, Math.sin(ph)) * -0.5, 0, Math.max(0, Math.sin(ph)) * 0.35);
    this.legs[1].rotation.set(Math.max(0, -Math.sin(ph)) * -0.5, 0, -Math.max(0, -Math.sin(ph)) * 0.35);
    this.body.rotation.set(0.25, 0, 0.12); this.body.position.y = 0.92 - Math.abs(Math.sin(ph)) * 0.04;
    this.arms[0].rotation.x = Math.sin(ph) * 0.6; this.arms[1].rotation.x = -Math.sin(ph) * 0.6; this.tail.rotation.y = Math.sin(this.clock * 7) * 0.25;
    // Following: close behind or beside her, all the way round.
    const p = k.pos, gp = this.g.position, dist = Math.hypot(p.x - gp.x, p.z - gp.z);
    if (dist < 12) k.once('skater', 'Someone is skating on the rink. Keep up with her for a whole lap.', 5);
    // Close (within 6.5 m) is what counts; drift a little wide on the ice and the lap so far is kept, but lose her
    // altogether (12 m) and it starts again.
    if (dist < 6.5 && Math.abs(p.y) < 1) {
      if (!this.lap) k.say('Skating with her…', 1.5);
      this.lap += d;
      if (this.lap >= Math.PI * 2) { this.lap = -1e9; k.synth.chime([392, 523, 659, 784]); if (k.find('skater')) k.callout('SKATING PARTNER'); else k.say('Another lap together.', 2); }
    } else if (this.lap > 0 && dist > 12) { k.say(this.lap > Math.PI ? 'So close: she has skated on without you.' : 'She has skated on without you.', 2.5); this.lap = 0; }
    if (this.lap < 0 && dist > 10) this.lap = 0;
    void R;
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'skater', name: 'Skating partner (a lap of the rink)', ...this.at }] : []; },
  reset() { this.lap = 0; },
});
