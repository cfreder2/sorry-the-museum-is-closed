// Things to do out in the park (features.js): a sledding run by the band shell, ice fishing on the harbour,
// a row of snowball targets on Butler Field, and a skater going round the rink who will let you follow her.
import * as THREE from 'three';
import { feature } from './features.js';

// Lit a little from within, as everything out of doors is here, so it reads at night.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, emissive: new THREE.Color(color).multiplyScalar(0.4), ...o });
const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); return b; };
const inBox = (q, p) => p.x > q.x0 && p.x < q.x1 && p.z > q.z0 && p.z < q.z1;

// ---------------------------------------------------------------- the sledding run
// Packed snow, built up off the field east of the band shell's path: a ramp up from the west, a start at the top, then
// four long runs down with a banked turn between each, back down to the snow. Packed snow is fast; under 20 s is good.
feature({
  id: 'sledding',
  secrets: [['sledding', 'Sledding']],
  init(k) {
    const snow = mat(0xdbe5ef, { roughness: 0.55 }), kerbM = mat(0xf3f7fb, { roughness: 0.7 }), H = 6;
    const P = this.pieces = {
      ramp: { skin: 'snow', x0: 318, x1: 336, z0: 131, z1: 137, axis: 'x', h0: 0, h1: H },
      start: { skin: 'snow', x0: 336, x1: 342, z0: 131, z1: 137, axis: null, h0: H, h1: H },
      s1: { skin: 'snow', x0: 342, x1: 368, z0: 131, z1: 137, axis: 'x', h0: H, h1: 4.5 },
      c1: { skin: 'snow', x0: 368, x1: 374, z0: 131, z1: 143, axis: null, h0: 4.5, h1: 4.5 },
      s2: { skin: 'snow', x0: 368, x1: 374, z0: 143, z1: 165, axis: 'z', h0: 4.5, h1: 3 },
      c2: { skin: 'snow', x0: 362, x1: 374, z0: 165, z1: 171, axis: null, h0: 3, h1: 3 },
      s3: { skin: 'snow', x0: 342, x1: 362, z0: 165, z1: 171, axis: 'x', h0: 1.5, h1: 3 },
      c3: { skin: 'snow', x0: 336, x1: 342, z0: 165, z1: 177, axis: null, h0: 1.5, h1: 1.5 },
      s4: { skin: 'snow', x0: 336, x1: 342, z0: 177, z1: 197, axis: 'z', h0: 1.5, h1: 0 },
    };
    for (const s of Object.values(P)) k.solid(s, snow);
    this.slopes = [P.s1, P.s2, P.s3, P.s4];
    // Kerbs along every edge nothing joins on to, higher round the turns where the run banks.
    const W = 0.3, kerb = (s, side, from, to, up = 0.35) => {
      const q = { skin: 'snow', axis: s.axis, h0: s.h0 + up, h1: s.h1 + up };
      if (side === 'n') Object.assign(q, { x0: from, x1: to, z0: s.z1 - W, z1: s.z1 }); else if (side === 's') Object.assign(q, { x0: from, x1: to, z0: s.z0, z1: s.z0 + W });
      else if (side === 'e') Object.assign(q, { x0: s.x1 - W, x1: s.x1, z0: from, z1: to }); else Object.assign(q, { x0: s.x0, x1: s.x0 + W, z0: from, z1: to });
      if (q.axis === 'x' && (side === 'e' || side === 'w')) q.h0 = q.h1 = (side === 'e' ? s.h1 : s.h0) + up;
      if (q.axis === 'z' && (side === 'n' || side === 's')) q.h0 = q.h1 = (side === 'n' ? s.h1 : s.h0) + up;
      if (q.axis !== s.axis) q.axis = q.h0 === q.h1 ? null : s.axis;
      k.solid(q, kerbM);
    };
    kerb(P.ramp, 'n', 318, 336); kerb(P.ramp, 's', 318, 336); kerb(P.start, 'n', 336, 342); kerb(P.start, 's', 336, 342);
    kerb(P.s1, 'n', 342, 368); kerb(P.s1, 's', 342, 368);
    kerb(P.c1, 'e', 131, 143, 0.7); kerb(P.c1, 's', 368, 374, 0.7); kerb(P.c1, 'w', 137, 143, 0.5);
    kerb(P.s2, 'w', 143, 165); kerb(P.s2, 'e', 143, 165);
    kerb(P.c2, 'e', 165, 171, 0.7); kerb(P.c2, 'n', 362, 374, 0.7); kerb(P.c2, 's', 362, 368, 0.5);
    kerb(P.s3, 's', 342, 362); kerb(P.s3, 'n', 342, 362);
    kerb(P.c3, 'w', 165, 177, 0.7); kerb(P.c3, 's', 336, 342, 0.7); kerb(P.c3, 'e', 171, 177, 0.5);
    kerb(P.s4, 'w', 177, 197); kerb(P.s4, 'e', 177, 197);
    // A board at the top and two flags at the bottom.
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96; const c = cv.getContext('2d');
    c.fillStyle = '#7a4b2a'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#f4ead8'; c.font = '700 40px Georgia, serif'; c.textAlign = 'center'; c.fillText('SLED RUN', 128, 46); c.font = '20px Georgia, serif'; c.fillText('beat 20 seconds', 128, 78);
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.45), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.9 }));
    sign.position.set(339, H + 1.1, 130.95); sign.rotation.y = Math.PI; k.group.add(sign, box(0.06, 1.2, 0.06, mat(0x5a3a22), 338.4, H + 0.6, 131.0), box(0.06, 1.2, 0.06, mat(0x5a3a22), 339.6, H + 0.6, 131.0));
    const flagM = mat(0xc0392b);
    for (const x of [336.4, 341.6]) { k.group.add(box(0.05, 1.6, 0.05, mat(0x333333), x, 0.8, 197.5)); const f = box(0.02, 0.35, 0.5, flagM, x, 1.4, 197.8); k.group.add(f); }
    this.at = { x: 339, y: H, z: 134 };
    const course = [P.start, P.s1, P.c1, P.s2, P.c2, P.s3, P.c3, P.s4, { x0: 335, x1: 343, z0: 196, z1: 205 }];
    this.timer = k.timer({
      id: 'sledding', name: 'SLED RUN', limit: 60, min: 4,
      start: { x0: 336, x1: 342, z0: 131, z1: 137, y0: H - 0.5 },
      finish: { x0: 335, x1: 343, z0: 197.2, z1: 205 },
      inside: p => course.some(q => p.x > q.x0 - 0.6 && p.x < q.x1 + 0.6 && p.z > q.z0 - 0.6 && p.z < q.z1 + 0.6),
      onStart: () => k.synth.chime([523, 784], { gap: 0.1, dur: 0.5 }),
      onFinish: t => { if (t < 20) { if (k.find('sledding')) k.callout('SLEDDING'); k.synth.chime([523, 659, 784, 1047]); } else k.say(`${t.toFixed(1)} s. Under 20 and the run is yours.`, 3.5); },
    });
  },
  active(k) { return k.pos.x > 300 && k.pos.x < 392 && k.pos.z > 112 && k.pos.z < 215; },
  update(dt, k) {
    const v = k.v;
    if (k.close(this.at, 4, 1.2)) k.once('sled-start', 'The top of the sled run. Go when you like: the clock starts as you leave.', 5);
    this.timer.update(dt);
    // Packed snow is quick going down: a push along the way you are going on the slopes.
    if (v.kind === 'car' && !v.air && this.slopes.includes(v.on)) {
      const s = v.on, dn = s.h1 < s.h0 ? 1 : -1, along = s.axis === 'x' ? v.vel.x * dn : v.vel.z * dn, sp = Math.hypot(v.vel.x, v.vel.z);
      if (along > 0.3 && sp < 13) { const f = 1 + 3.2 * dt / Math.max(sp, 0.5); v.vel.x *= f; v.vel.z *= f; }
    }
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'sledding', name: 'Sledding (under 20 s)', ...this.at }] : []; },
  reset() { if (this.timer) this.timer.cancel(); },
});

// ---------------------------------------------------------------- ice fishing
// A hole in the harbour ice beside a little hut. FISH looks down into the hole: watch the bobber, and tap the
// moment it goes under. Too soon and the fish swims off. Three in a night is the secret; each is worth chips.
feature({
  id: 'icefish',
  secrets: [['icefish', 'Ice fishing']],
  init(k) {
    this.k = k;
    const L = k.plan.lakefront, x = L ? (L.shore + L.buoys) / 2 - 2.5 : 550, z = 122;
    this.at = { x, y: 0, z }; this.caught = 0;
    const g = this.g = new THREE.Group(); g.position.set(x, 0, z); k.group.add(g);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.32, 28), new THREE.MeshStandardMaterial({ color: 0x163a4e, emissive: 0x0c2a3a, roughness: 0.15, metalness: 0.2 }));
    hole.rotation.x = -Math.PI / 2; hole.position.y = 0.012; g.add(hole);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.06, 6, 28), mat(0xeef3f8)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.02; rim.scale.z = 0.5; g.add(rim);
    // The rod on its little stand, the line, the bobber.
    const wood = mat(0x6b4426), rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.014, 1.0, 6), mat(0x2b2b2b));
    g.add(box(0.05, 0.22, 0.05, wood, -0.55, 0.11, 0));
    rod.position.set(-0.3, 0.32, 0); rod.rotation.z = -1.1; g.add(rod);
    this.tip = new THREE.Vector3(0.14, 0.53, 0);
    this.bob = new THREE.Group(); const red = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xd23a2a, { roughness: 0.4 })), wh = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xf4f4f0, { roughness: 0.4 }));
    this.bob.add(red, wh); this.bob.position.set(0.12, 0.02, 0.02); g.add(this.bob);
    this.ripple = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.058, 24), new THREE.MeshBasicMaterial({ color: 0xcfe6f2, transparent: true, opacity: 0 })); this.ripple.rotation.x = -Math.PI / 2; this.ripple.position.set(0.12, 0.016, 0.02); g.add(this.ripple);
    this.lineGeo = new THREE.BufferGeometry().setFromPoints([this.tip, this.bob.position]); g.add(new THREE.Line(this.lineGeo, new THREE.LineBasicMaterial({ color: 0xdddddd })));
    // The hut: plank walls, a door, a stovepipe.
    const hut = new THREE.Group(); hut.position.set(3.6, 0, 5); g.add(hut);
    const planks = mat(0x8a5a35), roof = mat(0xe9eff5);
    hut.add(box(2.2, 2.0, 1.8, planks, 0, 1.0, 0), box(2.4, 0.12, 2.0, roof, 0, 2.06, 0), box(0.7, 1.5, 0.04, mat(0x5a3820), -0.4, 0.75, -0.92), box(0.12, 0.7, 0.12, mat(0x222222), 0.6, 2.45, 0.3));
    const win = box(0.4, 0.3, 0.04, new THREE.MeshBasicMaterial({ color: 0xffc778 }), 0.5, 1.3, -0.92); hut.add(win);
    k.plan.obstacles.push({ x0: x + 2.5, x1: x + 4.7, z0: z + 4.1, z1: z + 5.9, y0: -0.3, y1: 2.2 });
    // The bucket the catch goes in.
    this.bucket = new THREE.Group(); this.bucket.position.set(0.55, 0, -0.35); g.add(this.bucket);
    const pail = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.22, 14, 1, true), mat(0x8c99a6, { metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide })); pail.position.y = 0.11; this.bucket.add(pail);
    k.plan.obstacles.push({ x0: x + 0.42, x1: x + 0.68, z0: z - 0.48, z1: z - 0.22, y0: -0.3, y1: 0.22 });
    this.fishM = mat(0x9fb3a0, { metalness: 0.4, roughness: 0.35 });
    this.fishes = [];
    this._dom();
  },
  _fishMesh() { const f = new THREE.Group(), b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), this.fishM); b.scale.set(1.9, 0.7, 0.6); const t = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.05, 4), this.fishM); t.rotation.z = Math.PI / 2; t.position.x = -0.11; f.add(b, t); return f; },
  _dom() {
    const el = this.el = document.createElement('div'); el.hidden = true;
    el.style.cssText = 'position:fixed;inset:0;z-index:40;touch-action:none;cursor:pointer;user-select:none;-webkit-user-select:none';
    el.innerHTML = '<div data-t style="position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom) + 84px);transform:translateX(-50%);padding:8px 16px;border-radius:12px;background:rgba(8,12,20,.66);color:#f3efe2;font:600 17px/1.35 system-ui,sans-serif;text-align:center;max-width:86vw"></div>'
      + '<button data-leave style="position:absolute;right:16px;top:calc(env(safe-area-inset-top) + 16px);padding:8px 16px;border-radius:10px;border:0;background:rgba(240,236,226,.92);color:#16202c;font:600 15px system-ui,sans-serif">Leave</button>';
    document.body.append(el);
    this.txt = el.querySelector('[data-t]');
    el.addEventListener('pointerdown', e => { e.preventDefault(); if (e.target.closest('[data-leave]')) this.close(); else this.strike(); });
    addEventListener('keydown', e => { if (!this.on) return; if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); } else if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) this.strike(); } }, true);
  },
  near(v, k) {
    if (this.on || !k.close(this.at, 1.3, 1)) return null;
    return { verb: 'FISH', hint: 'A hole in the ice and a rod left by it. E to fish.', act: () => this.open() };
  },
  open() {
    const k = this.k; this.on = true; k.G.state = 'paused'; this.el.hidden = false;
    k.stage.enter({ x: this.at.x + 0.05, y: 0.02, z: this.at.z, nx: 0, ny: 1, nz: 0, w: 1.9, h: 1.35, up: [0, 0, -1] }, { fill: 0.9 });
    this.say(this.caught >= 3 ? 'Three in the bucket already. Fish on if you like.' : 'Watch the bobber. Tap the moment it goes under.');
    this.wait(); this.last = performance.now(); const loop = t => { if (!this.on) return; this.tick(Math.min(0.05, (t - this.last) / 1000)); this.last = t; requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  },
  close() { if (!this.on) return; this.on = false; this.el.hidden = true; this.bob.position.y = 0.02; this._line(); this.k.resume(); },
  say(t) { this.txt.textContent = t; },
  wait(extra = 0) { this.phase = 'wait'; this.t = 0; this.biteAt = 1.6 + Math.random() * 3.6 + extra; this.nibbles = Math.random() < 0.6 ? [this.biteAt * (0.4 + Math.random() * 0.3)] : []; },
  tick(dt) {
    this.t += dt; const b = this.bob.position, T = performance.now() / 1000;
    if (this.phase === 'wait') {
      let y = 0.02 + Math.sin(T * 2.3) * 0.004;
      for (const n of this.nibbles) if (this.t > n && this.t < n + 0.18) y -= 0.012 * Math.sin((this.t - n) / 0.18 * Math.PI);      // a nibble: not yet
      b.y = y;
      if (this.t > this.biteAt) { this.phase = 'bite'; this.t = 0; this.k.synth.noise(0.18, { vol: 0.05, lp: 900 }); }
    } else if (this.phase === 'bite') {
      b.y = 0.02 - 0.05 * Math.min(1, this.t / 0.08);
      if (this.t > 0.55) { this.say('It took the bait and let go. Wait for the next one.'); this.wait(0.5); }
    } else if (this.phase === 'reel') {
      const f = this.fly; f.position.y = 0.05 + Math.sin(Math.min(1, this.t / 0.9) * Math.PI) * 0.35; f.rotation.z = Math.sin(T * 18) * 0.5;
      if (this.t > 1.0) { this.g.remove(f); this._stow(f); this.wait(); }
    }
    // A ring spreads on the water whenever the bobber is pulled.
    const rp = this.ripple, pulled = b.y < 0.012; if (pulled && rp.material.opacity < 0.1) { rp.scale.setScalar(1); rp.material.opacity = 0.8; }
    rp.scale.multiplyScalar(1 + dt * 2.2); rp.material.opacity = Math.max(0, rp.material.opacity - dt * 0.9);
    this._line();
  },
  _line() { const a = this.lineGeo.attributes.position; a.setXYZ(1, this.bob.position.x, this.bob.position.y + 0.03, this.bob.position.z); a.needsUpdate = true; },
  strike() {
    const k = this.k;
    if (this.phase === 'bite') {
      this.phase = 'reel'; this.t = 0; this.caught++;
      const f = this.fly = this._fishMesh(); f.position.set(0.12, 0.05, 0.02); this.g.add(f);
      k.synth.noise(0.3, { vol: 0.07, lp: 2400 }); k.synth.chime([660, 880], { gap: 0.08, dur: 0.6 });
      k.chips(10);
      if (this.caught === 3) { this.say('Three fish! +10 chips. That will do for a night.'); if (k.find('icefish')) k.callout('ICE FISHING'); }
      else this.say(`A fish! +10 chips. ${this.caught} in the bucket.`);
    } else if (this.phase === 'wait') { this.say('Too soon: the fish swims off. Wait for it to go right under.'); k.synth.note(180, 0.25, { vol: 0.05 }); this.wait(1.2); }
  },
  _stow(f) { const n = this.fishes.length; f.position.set(Math.cos(n * 2.1) * 0.05, 0.2 + n * 0.012, Math.sin(n * 2.1) * 0.05); f.rotation.set(0, n * 1.3, 0); f.scale.setScalar(0.9); this.bucket.add(f); this.fishes.push(f); },
  active(k) { this.k = k; return k.close(this.at, 30, 3); },
  update(dt, k) { if (k.close(this.at, 6, 2)) k.once('icefish', 'Somebody has cut a hole in the ice out here.', 4); },
  spots() { return this.at ? [{ kind: 'secret', id: 'icefish', name: 'Ice fishing (three fish)', ...this.at }] : []; },
  reset() { for (const f of this.fishes) this.bucket.remove(f); this.fishes = []; this.caught = 0; },
});

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
