// Things to do round the Modern Wing (features.js): a timed run up the Nichols Bridgeway, the glass lift up the
// face of the west pavilion, three rings to fly through under the sunshade, and the restoration on the easel in the
// Ryan Learning Center (where the "exhibit coming soon" signs send you). The architecture only: none of the wing's
// own collection is touched.
import * as THREE from 'three';
import { feature } from './features.js';

// Lit a little from within, as everything out of doors is here, so it reads at night.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, emissive: new THREE.Color(color).multiplyScalar(0.4), ...o });
const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); return b; };

// ---------------------------------------------------------------- the bridgeway: drivable, and a sprint up it
// The deck is laid as short slabs following the drawn one (bridgeway.js), each with its rails, from a ramp at its
// foot in the park to a landing outside the stair tower's door. The park beyond Monroe Street is outside the
// field of play, so a strip of it under the bridge is opened (plan.allow) and fenced.
feature({
  id: 'bridgeway',
  secrets: [['bridgeway', 'Bridgeway sprint']],
  init(k) {
    const mw = k.museum.mw; if (!mw || !mw.A) return;
    const { A, E, HW, L3, tw } = mw, P = k.plan, O = P.obstacles, B = P.bounds, white = mat(0xeef0ee, { roughness: 0.5 });
    const top = A.z - 0.6, w = HW - 0.15;
    const cxAt = z => E.x + (A.x - E.x) * (z - E.z) / (A.z - E.z), hAt = z => E.y + (L3 - E.y) * (z - E.z) / (top - E.z);
    this.deck = [];
    for (let z0 = E.z; z0 < top - 1e-6; z0 += 2) {
      const z1 = Math.min(top, z0 + 2), cx = cxAt((z0 + z1) / 2), s = { skin: 'deck', x0: cx - w, x1: cx + w, z0, z1, axis: 'z', h0: hAt(z0), h1: hAt(z1), thick: 0.6, bridge: true };
      P.surfaces.push(s); this.deck.push(s);
      for (const x of [s.x0 - 0.1, s.x1]) { const zb = x > s.x0 ? Math.min(z1 + 0.3, tw.z0 - 2.6) : z1 + 0.3; if (zb > z0 - 0.3) O.push({ x0: x, x1: x + 0.1, z0: z0 - 0.3, z1: zb, y0: Math.min(s.h0, s.h1) - 0.05, y1: Math.max(s.h0, s.h1) + 1.1 }); }      // open on the east at the top, onto the landing
    }
    // The foot: a short ramp up onto the deck, 1 in 3.
    const fx = cxAt(E.z);
    k.solid({ skin: 'deck', x0: fx - w, x1: fx + w, z0: E.z - 1.6, z1: E.z, axis: 'z', h0: 0, h1: E.y }, white);
    // The landing at the top, and a walk round the east side of the tower to the lift.
    const lx0 = tw.x1 + 0.6, lx1 = tw.x1 + 2.4;
    this.landing = [
      k.solid({ skin: 'deck', x0: A.x - w, x1: lx1, z0: top, z1: tw.z0 + 0.05, axis: null, h0: L3, h1: L3, thick: 0.3 }, white),
      k.solid({ skin: 'deck', x0: cxAt(tw.z0 - 2.6) + w - 0.05, x1: lx1, z0: tw.z0 - 2.6, z1: top, axis: 'z', h0: hAt(tw.z0 - 2.6), h1: L3, thick: 0.3 }, white),      // level with the deck beside it
      k.solid({ skin: 'deck', x0: tw.x1 + 0.55, x1: lx1, z0: tw.z0 + 0.05, z1: tw.z1 - 1.85, axis: null, h0: L3, h1: L3, thick: 0.3 }, white),
    ];
    O.push({ x0: lx1, x1: lx1 + 0.08, z0: tw.z0 - 2.6, z1: tw.z1 - 1.85, y0: L3 - 0.3, y1: L3 + 1.1 }, { x0: A.x + w, x1: lx1, z0: tw.z0 - 2.7, z1: tw.z0 - 2.6, y0: L3 - 0.3, y1: L3 + 1.1 });
    const rail = mat(0x9aa3ab, { metalness: 0.6, roughness: 0.35 });
    k.group.add(box(0.05, 1.1, tw.z1 - 1.85 - tw.z0 + 2.6, rail, lx1 + 0.04, L3 + 0.55, (tw.z0 - 2.6 + tw.z1 - 1.85) / 2), box(lx1 - A.x - w, 1.1, 0.05, rail, (A.x + w + lx1) / 2, L3 + 0.55, tw.z0 - 2.65));
    // The strip of park under the bridge, fenced.
    const ax0 = Math.min(E.x, A.x) - 8, ax1 = Math.max(E.x, A.x) + 8, az0 = E.z - 8, az1 = B.z0 + 0.5;
    (P.allow = P.allow || []).push({ x0: ax0, x1: ax1, z0: az0, z1: az1 });
    const SKY = 46, post = mat(0x6b4a2c), net = mat(0xd9692a, { roughness: 0.9 });
    O.push({ x0: ax0 - 0.3, x1: ax0 + 0.1, z0: az0 - 0.3, z1: az1 + 1, y0: -1, y1: SKY + 2 }, { x0: ax1 - 0.1, x1: ax1 + 0.3, z0: az0 - 0.3, z1: az1 + 1, y0: -1, y1: SKY + 2 }, { x0: ax0 - 0.3, x1: ax1 + 0.3, z0: az0 - 0.3, z1: az0 + 0.1, y0: -1, y1: SKY + 2 });
    const fence = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), m = box(L, 0.5, 0.03, net, (x0 + x1) / 2, 0.55, (z0 + z1) / 2); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); k.group.add(m); for (let t = 0; t <= L; t += 3) k.group.add(box(0.05, 0.9, 0.05, post, x0 + (x1 - x0) * t / L, 0.45, z0 + (z1 - z0) * t / L)); };
    fence(ax0, B.z0, ax0, az0); fence(ax0, az0, ax1, az0); fence(ax1, az0, ax1, B.z0);
    this.at = { x: fx, y: 0, z: E.z - 3 };
    this.top = { x: A.x, y: L3, z: top };
    const inDeck = p => (p.z > E.z - 2 && p.z < A.z + 1 && Math.abs(p.x - cxAt(Math.min(A.z, Math.max(E.z, p.z)))) < HW + 0.6 && p.y > (p.z > E.z ? hAt(Math.min(top, p.z)) - 1.5 : -1)) || (p.y > L3 - 1 && p.x > A.x - HW && p.x < lx1 + 0.5 && p.z > tw.z0 - 3 && p.z < tw.z1);
    this.timer = k.timer({
      id: 'bridgeway', name: 'BRIDGEWAY', limit: 90, min: 5,
      start: { x0: fx - 4, x1: fx + 4, z0: E.z - 7, z1: E.z - 1.7, y1: 1 },
      finish: { x0: A.x - HW, x1: lx1, z0: top - 1.6, z1: tw.z0 + 0.2, y0: L3 - 0.5 },
      inside: inDeck,
      onStart: () => k.synth.chime([523, 784], { gap: 0.1, dur: 0.5 }),
      onFinish: t => { if (t < 25) { if (k.find('bridgeway')) k.callout('BRIDGEWAY SPRINT'); k.synth.chime([523, 659, 784, 1047]); } else k.say(`${t.toFixed(1)} s to the top. Under 25 for the secret.`, 3.5); },
    });
    this.zone = { x0: ax0 - 10, x1: lx1 + 12, z0: az0 - 5, z1: tw.z1 + 4 };
  },
  active(k) { const p = k.pos, z = this.zone; return !!z && p.x > z.x0 && p.x < z.x1 && p.z > z.z0 && p.z < z.z1; },
  update(dt, k) {
    if (k.close(this.at, 5, 1.2)) k.once('bridge-foot', 'The foot of the Nichols Bridgeway. From here to the top in under 25 s: the clock starts up the ramp.', 6);
    this.timer.update(dt);
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'bridgeway', name: 'Bridgeway sprint (under 25 s)', ...this.at }] : []; },
  reset() { if (this.timer) this.timer.cancel(); },
});

// ---------------------------------------------------------------- the glass lift
// A glass car on the north face of the west pavilion, beside the stair tower: from the pavement, to the bridge
// landing, to the roof. Stand in it and RIDE; from a landing, CALL it.
feature({
  id: 'goingup',
  secrets: [['goingup', 'Going up']],
  init(k) {
    const mw = k.museum.mw; if (!mw || !mw.tw) return;
    const { tw, L3 } = mw, P = k.plan, O = P.obstacles, wz = tw.z1 + 0.05;
    const x0 = tw.x1 + 0.6, x1 = tw.x1 + 2.4, z0 = tw.z1 - 1.85, z1 = wz - 0.1;
    // The roof: what is underfoot just inside the wall, there.
    let roof = tw.top - 0.8;
    const probe = { x: (x0 + x1) / 2, z: wz + 0.8 };
    for (const list of [P.roofs || [], P.surfaces]) for (const s of list) if (probe.x > s.x0 && probe.x < s.x1 && probe.z > s.z0 && probe.z < s.z1 && s.h0 === s.h1 && Math.abs(s.h0 - roof) < 3) roof = s.h0;
    this.stops = [0.06, L3, roof];
    this.box = { x0, x1, z0, z1 };
    this.pad = { skin: 'glass', x0: x0 + 0.08, x1: x1 - 0.08, z0: z0 + 0.08, z1: z1 - 0.08, axis: null, h0: 0.06, h1: 0.06, thick: 0.1, lift: true };
    P.surfaces.push(this.pad);
    this.y = 0.06; this.goal = null; this.at = 0;
    // A step across from the car to the roof.
    k.solid({ skin: 'deck', x0: x0 + 0.1, x1: x1 - 0.1, z0: z1 - 0.1, z1: wz + 0.7, axis: null, h0: roof, h1: roof, thick: 0.2 }, mat(0xd8dadb));
    // The shaft: solid sides, open only at each stop on the side that has a way off.
    const T = roof + 2.6, g = 0.08;
    O.push({ x0: x1 - g, x1: x1 + 0.02, z0, z1, y0: -0.3, y1: T }, { x0: x0 - 0.02, x1: x0 + g, z0, z1, y0: -0.3, y1: T });
    O.push({ x0, x1, z0: z0 - 0.02, z1: z0 + g, y0: 0.55, y1: L3 - 0.2 }, { x0, x1, z0: z0 - 0.02, z1: z0 + g, y0: L3 + 0.7, y1: T });
    O.push({ x0, x1, z0: z1 - g, z1: z1 + 0.02, y0: -0.3, y1: roof - 0.2 });
    // And a gate at each way off, shut unless the car is standing there: nobody drives into an empty shaft.
    this.gates = [[z0 - 0.02, z0 + g, -0.3, 0.55], [z0 - 0.02, z0 + g, L3 - 0.2, L3 + 0.7], [z1 - g, z1 + 0.02, roof - 0.2, T]].map(([a, b, lo, hi]) => { const o = { x0, x1, z0: a, z1: b, y0: lo, y1: hi, lo, hi }; O.push(o); return o; });
    // Drawn: a glass car on two steel guides, running up the face.
    const steel = mat(0x8d969e, { metalness: 0.7, roughness: 0.3 }), glass = new THREE.MeshStandardMaterial({ color: 0xbfd8e6, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
    for (const x of [x0 + 0.05, x1 - 0.05]) k.group.add(box(0.09, T, 0.09, steel, x, T / 2, z1 + 0.02));
    const car = this.car = new THREE.Group(); car.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); k.group.add(car);
    const W = x1 - x0, D = z1 - z0, Hh = 2.3;
    car.add(box(W, 0.1, D, steel, 0, 0.0, 0), box(W, 0.08, D, steel, 0, Hh, 0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) car.add(box(0.06, Hh, 0.06, steel, sx * (W / 2 - 0.03), Hh / 2, sz * (D / 2 - 0.03)));
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(D, Hh), glass); p.rotation.y = Math.PI / 2; p.position.set(s * W / 2, Hh / 2, 0); car.add(p); }
    const back = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), glass); back.position.set(0, Hh / 2, D / 2); car.add(back);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.8, D * 0.8), new THREE.MeshBasicMaterial({ color: 0xfff1cf, transparent: true, opacity: 0.7 })); glow.rotation.x = Math.PI / 2; glow.position.y = Hh - 0.05; car.add(glow);
    this._sync();
  },
  _sync() {
    this.pad.h0 = this.pad.h1 = this.y; this.car.position.y = this.y - 0.05;
    const at = this.goal == null ? this._stopAt() : -1;
    this.gates.forEach((o, i) => { const open = i === at; o.y0 = open ? -60 : o.lo; o.y1 = open ? -59 : o.hi; });
  },
  _stopAt() { return this.stops.findIndex(s => Math.abs(this.y - s) < 0.02); },
  inCar(k) { const p = k.pos, b = this.box; return p.x > b.x0 && p.x < b.x1 && p.z > b.z0 && p.z < b.z1 && Math.abs(p.y - this.y) < 0.35; },
  go(k, i) { this.goal = i; this._sync(); k.synth.chime([523, 659], { gap: 0.12, dur: 0.7, vol: 0.05 }); },
  near(v, k) {
    if (!this.box || this.goal != null) return null;
    const b = this.box, p = k.pos;
    if (p.x < b.x0 - 3 || p.x > b.x1 + 3 || p.z < b.z0 - 3 || p.z > b.z1 + 3) return null;
    const here = this._stopAt();
    if (this.inCar(k)) {
      const to = here === this.stops.length - 1 ? 0 : here + 1, names = ['the street', 'the bridge', 'the roof'];
      return { verb: 'RIDE', hint: `The glass lift. E to ride to ${names[to]}.`, act: () => this.go(k, to) };
    }
    // Waiting at a stop with the car somewhere else: call it.
    const mine = this.stops.findIndex(s => Math.abs(p.y - s) < 0.4);
    if (mine >= 0 && mine !== here && p.x > b.x0 - 2 && p.x < b.x1 + 2 && p.z > b.z0 - 2.6 && p.z < b.z1 + 1.2) return { verb: 'CALL', hint: 'A glass lift up the face of the wing. E to call it.', act: () => this.go(k, mine) };
    return null;
  },
  active(k) { const b = this.box; return !!b && (this.goal != null || k.close({ x: (b.x0 + b.x1) / 2, y: k.pos.y, z: (b.z0 + b.z1) / 2 }, 14, 99)); },
  update(dt, k) {
    if (this.goal == null) return;
    const want = this.stops[this.goal], d = want - this.y, riding = this.inCar(k);
    const step = Math.sign(d) * Math.min(Math.abs(d), dt * Math.min(1.8, 0.4 + Math.abs(d) * 0.8));
    this.y += step; this._sync();
    if (riding) { const v = k.v; if (step > 0 && v.pos.y < this.y) v.pos.y = this.y; v.vel.x *= 0.9; v.vel.z *= 0.9; }
    if (Math.abs(want - this.y) < 0.002) {
      this.y = want; this.goal = null; this._sync(); k.synth.note(1047, 0.6, { type: 'sine', vol: 0.05 });
      if (riding && want === this.stops[this.stops.length - 1]) { if (k.find('goingup')) k.callout('GOING UP'); else k.say('The roof of the west pavilion.', 2.5); }
    }
  },
  spots() { const b = this.box; return b ? [{ kind: 'secret', id: 'goingup', name: 'Going up (the glass lift to the roof)', x: (b.x0 + b.x1) / 2, y: 0, z: (b.z0 + b.z1) / 2 }] : []; },
  reset(k) { if (!this.box) return; this.y = this.stops[0]; this.goal = null; this._sync(); },
});

// ---------------------------------------------------------------- rings under the sunshade
// Three rings hung in the gap between the gallery roof and the blades of the "flying carpet". Fly the drone
// through all three.
feature({
  id: 'blades',
  secrets: [['blades', 'Threading the blades']],
  init(k) {
    const S = k.museum.mw && k.museum.mw.shade; if (!S) return;
    const y = S.y - 1.3, z = (S.z0 + S.z1) / 2, R = this.R = 0.9;
    this.mOff = new THREE.MeshStandardMaterial({ color: 0xffcf6a, emissive: 0xffa63a, emissiveIntensity: 0.9, roughness: 0.4 });
    this.mOn = new THREE.MeshStandardMaterial({ color: 0x8cf0a0, emissive: 0x3fd06a, emissiveIntensity: 1.0, roughness: 0.4 });
    this.rings = [0.25, 0.5, 0.75].map((f, i) => {
      const x = S.x0 + (S.x1 - S.x0) * f, zz = z + (i - 1) * 2.5, m = new THREE.Mesh(new THREE.TorusGeometry(R, 0.06, 8, 36), this.mOff);
      m.position.set(x, y, zz); m.rotation.y = Math.PI / 2; k.group.add(m);
      return { x, y, z: zz, m, done: false, side: 0 };
    });
    this.at = { x: (S.x0 + S.x1) / 2, y, z }; this.S = S;
  },
  active(k) { const S = this.S, p = k.pos; return !!S && p.x > S.x0 - 25 && p.x < S.x1 + 25 && p.z > S.z0 - 25 && p.z < S.z1 + 25 && p.y > S.y - 12; },
  update(dt, k) {
    const p = k.pos, drone = k.v.kind === 'drone';
    if (drone && p.y > this.S.y - 8) k.once('blades', 'Three rings hung under the sunshade. Thread the drone through all three.', 5);
    for (const r of this.rings) {
      const side = Math.sign(p.x - r.x), off = Math.hypot(p.y - r.y, p.z - r.z);
      if (drone && !r.done && r.side && side && side !== r.side && off < this.R - 0.15) {
        r.done = true; r.m.material = this.mOn;
        const n = this.rings.filter(q => q.done).length; k.synth.chime([523 * (1 + n * 0.25)], { dur: 0.8 });
        if (n === 3) { k.synth.chime([523, 659, 784, 1047]); if (k.find('blades')) k.callout('THREADING THE BLADES'); }
        else k.say(`${n} of 3.`, 1.5);
      }
      r.side = off < this.R + 1.5 ? side : 0;
    }
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'blades', name: 'Threading the blades (drone, three rings)', ...this.at }] : []; },
  reset() { for (const r of this.rings || []) { r.done = false; r.side = 0; r.m.material = this.mOff; } },
});

// ---------------------------------------------------------------- the restoration
// On an easel in the Ryan Learning Center, a painting half cleaned: the conservator's left side bright, the rest
// still under old yellow varnish. CLEAN, and wipe the rest away. (The painting is made up here, from nothing.)
const PW = 640, PH = 480;
function paintPicture(c) {
  const r = (a => () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; })(20261120);
  const sky = c.createLinearGradient(0, 0, 0, PH * 0.55); sky.addColorStop(0, '#1d2f5a'); sky.addColorStop(0.55, '#5f6f9c'); sky.addColorStop(1, '#e8b48a');
  c.fillStyle = sky; c.fillRect(0, 0, PW, PH * 0.56);
  c.fillStyle = '#fbe7c0'; c.beginPath(); c.arc(PW * 0.72, PH * 0.17, 16, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,240,${0.3 + r() * 0.5})`; c.fillRect(r() * PW, r() * PH * 0.3, 1.5, 1.5); }
  // A far shore of tall buildings, lit windows.
  for (let x = 0; x < PW; x += 18 + r() * 22) { const w = 14 + r() * 24, h = 30 + r() * 90; c.fillStyle = '#26304a'; c.fillRect(x, PH * 0.56 - h, w, h); c.fillStyle = 'rgba(255,214,140,.8)'; for (let j = 0; j < h / 9; j++) if (r() < 0.35) c.fillRect(x + 3 + r() * (w - 6), PH * 0.56 - h + 4 + j * 8, 2, 3); }
  // The lake, frozen at the edge, and the light on it.
  const lake = c.createLinearGradient(0, PH * 0.56, 0, PH * 0.72); lake.addColorStop(0, '#3a4c74'); lake.addColorStop(1, '#8ea1c0'); c.fillStyle = lake; c.fillRect(0, PH * 0.56, PW, PH * 0.16);
  c.fillStyle = 'rgba(251,231,192,.5)'; for (let i = 0; i < 14; i++) c.fillRect(PW * 0.72 - 20 + r() * 40, PH * 0.57 + i * 5, 6 + r() * 20, 1.5);
  // Snow in the foreground, blue in the shadows; a path; three bare trees; two figures and a dog.
  const snow = c.createLinearGradient(0, PH * 0.7, 0, PH); snow.addColorStop(0, '#dfe6f0'); snow.addColorStop(1, '#a9b8d0'); c.fillStyle = snow;
  c.beginPath(); c.moveTo(0, PH * 0.72); c.quadraticCurveTo(PW * 0.5, PH * 0.66, PW, PH * 0.74); c.lineTo(PW, PH); c.lineTo(0, PH); c.fill();
  c.strokeStyle = '#c7b9a6'; c.lineWidth = 16; c.beginPath(); c.moveTo(PW * 0.1, PH); c.quadraticCurveTo(PW * 0.45, PH * 0.82, PW * 0.6, PH * 0.71); c.stroke();
  const tree = (x, y, s) => { c.strokeStyle = '#2b2522'; const br = (x0, y0, a, l, d) => { if (d > 6 || l < 3) return; const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; c.lineWidth = Math.max(0.8, 7 - d * 1.2) * s; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); br(x1, y1, a - 0.45 + r() * 0.2, l * 0.72, d + 1); br(x1, y1, a + 0.4 + r() * 0.2, l * 0.7, d + 1); }; br(x, y, -Math.PI / 2, 50 * s, 0); };
  tree(PW * 0.18, PH * 0.82, 1.3); tree(PW * 0.3, PH * 0.76, 0.9); tree(PW * 0.86, PH * 0.84, 1.15);
  c.fillStyle = '#7a2a24'; c.fillRect(PW * 0.5, PH * 0.74, 7, 18); c.fillStyle = '#2b3550'; c.fillRect(PW * 0.515, PH * 0.735, 7, 20); c.fillStyle = '#e3c2a2'; c.beginPath(); c.arc(PW * 0.503, PH * 0.733, 3.5, 0, 7); c.arc(PW * 0.52, PH * 0.73, 3.5, 0, 7); c.fill();
  c.fillStyle = '#3a2d25'; c.fillRect(PW * 0.47, PH * 0.765, 9, 4);
  for (let i = 0; i < 600; i++) { c.fillStyle = `rgba(255,255,255,${r() * 0.06})`; c.fillRect(r() * PW, r() * PH, 2, 2); }      // the weave
}
function varnish(c, r) {
  c.globalCompositeOperation = 'source-over';
  const g = c.createRadialGradient(PW * 0.6, PH * 0.5, 40, PW * 0.6, PH * 0.5, PW * 0.7); g.addColorStop(0, 'rgba(150,110,40,.78)'); g.addColorStop(1, 'rgba(90,62,22,.92)');
  c.fillStyle = g; c.fillRect(0, 0, PW, PH);
  for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(${60 + r() * 40},${40 + r() * 30},10,${r() * 0.25})`; c.beginPath(); c.arc(r() * PW, r() * PH, 4 + r() * 22, 0, 7); c.fill(); }
  // The conservator's side, cleaned already: a ragged edge down the canvas.
  c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.beginPath(); c.moveTo(0, 0);
  for (let y = 0; y <= PH; y += 12) c.lineTo(PW * 0.44 + Math.sin(y * 0.05) * 10 + (r() - 0.5) * 14, y);
  c.lineTo(0, PH); c.fill();
  c.globalCompositeOperation = 'source-over';
}
feature({
  id: 'restoration',
  secrets: [['restoration', 'The restoration']],
  init(k) {
    const room = k.plan.byId['MW1-ed10']; if (!room) return;
    this.room = room;
    // In the south-east corner, away from both doors, clear of what is already there.
    const free = (x, z) => !k.plan.obstacles.some(o => o.y1 > room.y && o.y0 < room.y + 1.6 && x + 0.7 > o.x0 && x - 0.7 < o.x1 && z + 0.7 > o.z0 && z - 0.7 < o.z1);
    let ex = room.x1 - 1.6, ez = room.z0 + 1.4;
    for (const [x, z] of [[room.x1 - 1.6, room.z0 + 1.4], [room.x0 + 1.6, room.z0 + 1.4], [room.x1 - 1.6, room.z0 + 3], [(room.x0 + room.x1) / 2 + 2, room.z0 + 1.4]]) if (free(x, z)) { ex = x; ez = z; break; }
    this.at = { x: ex, y: room.y, z: ez + 0.9 };
    // The painting: the picture underneath, the varnish on top, and the two together for the canvas on the easel.
    this.pic = document.createElement('canvas'); this.pic.width = PW; this.pic.height = PH; paintPicture(this.pic.getContext('2d'));
    this.var = document.createElement('canvas'); this.var.width = PW; this.var.height = PH;
    this.view = document.createElement('canvas'); this.view.width = PW; this.view.height = PH;
    this.tex = new THREE.CanvasTexture(this.view); this.tex.colorSpace = THREE.SRGBColorSpace;
    this._varnish();
    const wood = mat(0x7a5532), cw = 0.96, ch = 0.72, cy = room.y + 1.18;
    const g = new THREE.Group(); g.position.set(ex, 0, ez); k.group.add(g);
    for (const s of [-1, 1]) { const leg = box(0.04, 1.75, 0.04, wood, s * 0.38, room.y + 0.86, 0); leg.rotation.z = s * -0.12; g.add(leg); }
    const back = box(0.04, 1.8, 0.04, wood, 0, room.y + 0.88, -0.38); back.rotation.x = -0.3; g.add(back);
    g.add(box(0.9, 0.04, 0.08, wood, 0, cy - ch / 2 - 0.03, 0.03));
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(cw, ch), new THREE.MeshBasicMaterial({ map: this.tex, color: 0xe6e6e6 })); canvas.position.set(0, cy, 0.06); g.add(canvas);      // under the conservator's lamp, lights on or off
    g.add(box(cw + 0.02, ch + 0.02, 0.02, mat(0xe8e0cf), 0, cy, 0.045));
    // A trolley of the conservator's things.
    g.add(box(0.5, 0.04, 0.35, mat(0x9aa3ab, { metalness: 0.5 }), 0.75, room.y + 0.7, 0.1), box(0.06, 0.06, 0.06, mat(0xe9e4d6), 0.65, room.y + 0.75, 0.1), box(0.05, 0.09, 0.05, mat(0x6f8a5a), 0.8, room.y + 0.76, 0.05));
    k.plan.obstacles.push({ x0: ex - 0.5, x1: ex + 1.05, z0: ez - 0.45, z1: ez + 0.3, y0: room.y, y1: room.y + 1.6 });
    // The card beside it.
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const c = cv.getContext('2d'); c.fillStyle = '#f4f1e8'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#222'; c.font = '600 22px Georgia, serif'; c.fillText('Conservation', 16, 40); c.fillText('in progress', 16, 68); c.font = 'italic 16px Georgia, serif'; c.fillText('Winter Evening, the Lake Front', 16, 102);
    const ct = new THREE.CanvasTexture(cv); ct.colorSpace = THREE.SRGBColorSpace;
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), new THREE.MeshBasicMaterial({ map: ct, color: 0xcccccc })); card.position.set(-0.62, room.y + 1.1, 0.04); g.add(card);
    this.surf = { x: ex, y: cy, z: ez + 0.065, nx: 0, ny: 0, nz: 1, w: cw, h: ch };
    this._dom(k);
  },
  _varnish() { const c = this.var.getContext('2d'); c.clearRect(0, 0, PW, PH); varnish(c, (a => () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; })(7)); this.done = false; this._compose(); },
  _compose() { const c = this.view.getContext('2d'); c.globalCompositeOperation = 'source-over'; c.drawImage(this.pic, 0, 0); c.drawImage(this.var, 0, 0); this.tex.needsUpdate = true; },
  _clean() { const d = this.var.getContext('2d').getImageData(0, 0, PW, PH).data; let n = 0, m = 0; for (let i = 3; i < d.length; i += 4 * 37) { m++; if (d[i] < 40) n++; } return n / m; },
  _dom(k) {
    const el = this.el = document.createElement('div'); el.hidden = true; el.style.cssText = 'position:fixed;inset:0;z-index:40;touch-action:none;user-select:none;-webkit-user-select:none';
    const cvs = this.cvs = this.view; void cvs;
    this.pad = document.createElement('div'); this.pad.style.cssText = 'position:fixed;cursor:crosshair;touch-action:none';
    el.innerHTML = '<div data-t style="position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom) + 24px);transform:translateX(-50%);padding:8px 16px;border-radius:12px;background:rgba(8,12,20,.66);color:#f3efe2;font:600 16px/1.35 system-ui,sans-serif;text-align:center;max-width:86vw"></div>'
      + '<button data-leave style="position:absolute;right:16px;top:calc(env(safe-area-inset-top) + 16px);padding:8px 16px;border-radius:10px;border:0;background:rgba(240,236,226,.92);color:#16202c;font:600 15px system-ui,sans-serif">Leave</button>';
    el.append(this.pad); document.body.append(el);
    this.txt = el.querySelector('[data-t]');
    el.querySelector('[data-leave]').addEventListener('click', e => { e.preventDefault(); this.close(k); });
    let down = false, lx = 0, ly = 0;
    const at = e => { const r = this.pad.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * PW, (e.clientY - r.top) / r.height * PH]; };
    const wipe = (x0, y0, x1, y1) => {
      const c = this.var.getContext('2d'); c.globalCompositeOperation = 'destination-out'; c.strokeStyle = 'rgba(0,0,0,.88)'; c.lineCap = 'round'; c.lineWidth = 44;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.globalCompositeOperation = 'source-over'; this._compose();
      if (Math.random() < 0.2) k.synth.noise(0.08, { vol: 0.02, lp: 3000 });
    };
    this.pad.addEventListener('pointerdown', e => { e.preventDefault(); down = true; [lx, ly] = at(e); this.pad.setPointerCapture(e.pointerId); wipe(lx, ly, lx + 0.1, ly); });
    this.pad.addEventListener('pointermove', e => { if (!down) return; const [x, y] = at(e); wipe(lx, ly, x, y); lx = x; ly = y; });
    const up = () => { if (!down) return; down = false; this._check(k); };
    this.pad.addEventListener('pointerup', up); this.pad.addEventListener('pointercancel', up);
    addEventListener('keydown', e => { if (this.on && e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(k); } }, true);
  },
  _check(k) {
    const f = this._clean(), pct = Math.round(f * 100);
    if (f >= 0.92 && !this.done) { this.done = true; this.var.getContext('2d').clearRect(0, 0, PW, PH); this._compose(); this.txt.textContent = 'Clean. The colours are back: a winter evening on the lake front.'; k.synth.chime([523, 659, 784, 1047]); if (k.find('restoration')) k.callout('THE RESTORATION'); }
    else if (!this.done) this.txt.textContent = `Wipe away the old varnish. ${pct}% clean.`;
  },
  near(v, k) {
    if (!this.at || this.on || !k.close(this.at, 1.2, 1) || !k.inRoom('MW1-ed10')) return null;
    return { verb: 'CLEAN', hint: 'A painting half cleaned on the conservator’s easel. E to carry on.', act: () => this.open(k) };
  },
  open(k) {
    this.on = true; k.G.state = 'paused'; this.el.hidden = false;
    k.stage.enter(this.surf, { fill: 0.82, el: this.pad });
    this._check(k); if (!this.done) this.txt.textContent = `The left side is done. Drag across the rest to lift the varnish. ${Math.round(this._clean() * 100)}% clean.`;
    this.pad.style.background = 'transparent';
  },
  close(k) { if (!this.on) return; this.on = false; this.el.hidden = true; k.resume(); },
  active(k) { return !!this.room && k.inRoom('MW1-ed10', 2); },
  update(dt, k) { if (k.close(this.at, 4, 1.5)) k.once('restoration', 'The restoration the signs promised: a painting on an easel, half of it still under old varnish.', 5); },
  spots() { return this.at ? [{ kind: 'secret', id: 'restoration', name: 'The restoration (Ryan Learning Center)', ...this.at }] : []; },
  reset() { if (this.var) this._varnish(); },
});
