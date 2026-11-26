// Races you come across. Here and there about the building and the grounds a toy car or two sits waiting under a lit
// arch, headlights blinking, engine revving. Drive up and it will race you: E, and the course lights up on the floor,
// three, two, one, go. Each one beaten is a secret; beating them all is one more. Nothing of a course is there until
// a race is on, and the rivals are solid, parked off the line, out of every doorway.
//
// Each spot has its own look (the marks on the floor, the cones, the arch, the rivals' paint) and its rivals their own
// characters. One of them is not from round here at all (the crop circle on Butler Field): beat it and it leaves you its
// charm, a page of the Green Cheese file (src/story.js, 'alienracer'), and the map's "?" moves on to the rings over the silo.
//
// The course is laid by src/course.js against the plan as it stands (features and all) the first time the toy comes
// near, and the race is run by src/race.js with the same bots as ever. tools/check_layout.mjs lays and checks every
// indoor course, and the outdoor ones against the plan's own ground.

import * as THREE from 'three';
import { feature } from './features.js';
import { layCourse } from './course.js';
import { SPOTS, archOf } from './racecourses.js';
import { Car } from './vehicles.js';
import { buildVehicle, repaint } from './garage.js';
import { clockText, ordinal } from './race.js';
import { story } from './story.js';

const SAVE = 'after-hours.races';          // { seen: [id], won: { id: true }, best: { id: secs } }
const NEAR = 4.2;                          // how close to the arch the race is offered
const AWAKE = 42;                          // nearer than this, the rivals idle (blink, rev, wiggle); further, nothing runs


// ---- the visitor's rover: nobody's design but its own. A low, flat pebble on a cushion of green light, three stubby
// fins, a clear blister with one slit of an eye in it, and a feeler that bobs. Built in the shape garage bodies are
// handed to the Car ({ body, wheels, aerial }), with no wheels to turn.
function buildAlien() {
  const body = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0x24402c, roughness: 0.35, metalness: 0.6, emissive: 0x1a6a22, emissiveIntensity: 0.35 }); shell.name = 'paint';
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 2.4, 0.5) });
  const eye = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.4, 0.6) });
  const add = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1, parent = body) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m; };
  add(new THREE.SphereGeometry(0.15, 20, 12), shell, 0, 0.11, 0, 1, 0.34, 1.45);                       // the pebble
  add(new THREE.TorusGeometry(0.15, 0.012, 6, 32), glow, 0, 0.075, 0, 1, 1.45, 1).rotation.x = Math.PI / 2;      // its rim of light
  const halo = add(new THREE.CircleGeometry(0.2, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 1.1, 0.25), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }), 0, 0.01, 0, 1, 1.4, 1);
  halo.rotation.x = -Math.PI / 2;
  add(new THREE.SphereGeometry(0.07, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9fe8c0, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.45 }), 0, 0.14, 0.02, 1, 0.9, 1.3);
  add(new THREE.BoxGeometry(0.06, 0.008, 0.012), eye, 0, 0.165, 0.085);                                 // the slit
  for (const a of [Math.PI * 0.75, -Math.PI * 0.75, Math.PI]) { const f = add(new THREE.BoxGeometry(0.012, 0.05, 0.07), shell, Math.sin(a) * 0.12, 0.13, Math.cos(a) * 0.17); f.rotation.y = a; f.rotation.x = -0.4; }
  const aerial = new THREE.Group(); aerial.position.set(0, 0.16, -0.08); body.add(aerial);
  add(new THREE.CylinderGeometry(0.003, 0.004, 0.16, 5), shell, 0, 0.08, 0, 1, 1, 1, aerial);
  add(new THREE.SphereGeometry(0.014, 10, 8), glow, 0, 0.17, 0, 1, 1, 1, aerial);
  return { body, wheels: [], aerial, radius: 0.19 };
}

const load = () => { let s = {}; try { s = JSON.parse(localStorage.getItem(SAVE) || '{}') || {}; } catch { s = {}; } return { seen: [], won: {}, best: {}, ...s }; };
feature({
  id: 'racespots',
  secrets: [...SPOTS.map(s => ['race:' + s.id, `Beat ${s.rivals[0].name}`]), ['race:all', 'Beat every rival']],

  init(k) {
    this.k = k; this.save = load(); this.t = 0;
    story.enable('alienracer');                 // Zib's charm is a page of the file (src/story.js)
    const G = k.G, P = k.plan;
    this.root = new THREE.Group(); this.root.name = 'racespots'; k.group.add(this.root);
    const posts = [], bars = [];
    for (const S of SPOTS) {
      const A = archOf(S), x0 = A.x, z0 = A.z;
      Object.assign(S, { x: A.x, z: A.z, fx: A.fx, fz: A.fz, rx: A.rx, rz: A.rz, yaw: A.yaw });      // through the arch (f) and across it (r)
      S.won = !!this.save.won[S.id]; S.course = null; S.building = false;
      // The arch over the start line: two posts and a bar with the rival's banner on it, solid as drawn.
      for (const p of A.posts) posts.push({ x: p.x, z: p.z, y: S.fy, c: S.theme.post });
      P.obstacles.push(...A.solids);
      bars.push({ x: x0, z: z0, y: S.fy + 1.38, yaw: S.yaw, w: S.arch + 0.14, c: S.theme.bar });
      this._banner(S);
      // The rivals, parked.
      S.cars = S.rivals.map((r, i) => {
        const v = new Car(P, r.colour);
        v.group.remove(v.lamp, v.lamp.target);
        v.reskin(r.body === 'alien' ? buildAlien() : buildVehicle(r.body), {});
        if (r.body !== 'alien') repaint(v.body, r.colour);
        const box = new THREE.Box3().setFromObject(v.body);
        v.half = { x: Math.max(0.1, (box.max.x - box.min.x) / 2), z: Math.max(0.15, (box.max.z - box.min.z) / 2), front: box.max.z, top: box.max.y };
        // Headlamps that blink while it waits.
        const lamp = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.8, 2.2) });
        for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), m); b.position.set(sx * Math.min(0.07, v.half.x * 0.6), Math.min(0.13, v.half.top * 0.5), v.half.front + 0.005); lamp.add(b); }
        if (r.body === 'alien') m.color.setRGB(0.6, 3, 0.6);
        v.group.add(lamp); v.blink = lamp; lamp.visible = false;
        const [ax, bk] = S.park[i];
        v.park = { x: x0 + S.rx * ax - S.fx * bk, z: z0 + S.rz * ax - S.fz * bk, yaw: S.yaw };
        v.place(v.park.x, v.park.z, v.park.yaw, S.fy);
        this.root.add(v.group, v.shadow);
        v.idle = true;
        return v;
      });
      if (S.alien) this._circle(S);
    }
    // All the posts and all the bars are one mesh each.
    const pm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.045, 0.06, 1.5, 10).translate(0, 0.75, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), posts.length);
    const bm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffff }), bars.length);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), C = new THREE.Color();
    posts.forEach((p, i) => { M.makeTranslation(p.x, p.y, p.z); pm.setMatrixAt(i, M); pm.setColorAt(i, C.set(p.c).multiplyScalar(1.3)); });
    bars.forEach((b, i) => { Q.setFromAxisAngle(Y, b.yaw); M.compose(V.set(b.x, b.y, b.z), Q, Sc.set(b.w, 1, 1)); bm.setMatrixAt(i, M); bm.setColorAt(i, C.set(b.c).multiplyScalar(1.4)); });
    this.root.add(pm, bm);
    this.hum = k.loop({ type: 'triangle', freq: 98, lp: 700 });
    this.hum2 = k.loop({ type: 'sine', freq: 147 });
    this._card();
    // Esc, in a race, gives it up rather than pausing (P still pauses, and so does the button).
    addEventListener('keydown', e => { if (e.code === 'Escape' && !e.repeat && G.racing && G.state === 'play') { e.preventDefault(); e.stopImmediatePropagation(); this.quit(); } }, true);
    G.raceSpots = this.api(k);
    G.raceIcons = () => SPOTS.filter(S => this.save.seen.includes(S.id)).map(S => ({ id: S.id, x: S.x, y: S.fy, z: S.z, name: S.rivals[0].name, won: !!this.save.won[S.id], best: this.save.best[S.id] || 0 }));
  },

  // The banner on the bar: the rival's name, in its colours, lit from within.
  _banner(S) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 96;
    const g = c.getContext('2d'), T = S.theme, hex = n => '#' + new THREE.Color(n).getHexString();
    g.fillStyle = hex(T.bar); g.fillRect(0, 0, 512, 96);
    if (T.stripes) { g.fillStyle = '#fff'; for (let x = -96; x < 512; x += 48) { g.beginPath(); g.moveTo(x, 96); g.lineTo(x + 24, 96); g.lineTo(x + 120, 0); g.lineTo(x + 96, 0); g.fill(); } }
    for (let x = 0; x < 512; x += 16) for (const y of [0, 86]) { g.fillStyle = ((x / 16) + (y ? 1 : 0)) % 2 ? '#fff' : '#111'; g.fillRect(x, y, 16, 10); }
    g.font = '700 50px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const label = S.alien ? '○ ∴ ○ ∷ ○' : S.rivals[0].name.toUpperCase();
    if (T.stripes) { g.lineWidth = 8; g.strokeStyle = hex(T.bar); g.strokeText(label, 256, 50); }
    g.fillStyle = T.text; g.fillText(label, 256, 50);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.3, 1.3, 1.3) });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(2.4, S.arch - 0.4), 0.42), mat);
    m.position.set(S.x, S.fy + 1.1, S.z); m.rotation.y = S.yaw;
    const back = m.clone(); back.rotation.y = S.yaw + Math.PI;           // (two faces back to back, so the name reads the right way round from either side)
    this.root.add(m, back); S.banner = mat;
  },

  // The visitor's circle, pressed into the snow: rings and marks, faintly lit. Flat on the ground, so nothing to run into.
  _circle(S) {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'); g.clearRect(0, 0, 512, 512); g.translate(256, 256);
    g.strokeStyle = 'rgba(190,255,200,.55)';
    for (const [r, w] of [[250, 10], [226, 4], [150, 8], [96, 3], [40, 9]]) { g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = 'rgba(190,255,200,.5)';
    for (let i = 0; i < 9; i++) { const a = i * Math.PI * 2 / 9; g.beginPath(); g.arc(Math.cos(a) * 188, Math.sin(a) * 188, i % 3 ? 9 : 17, 0, Math.PI * 2); g.fill(); }
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + 0.5; g.lineWidth = 5; g.beginPath(); g.moveTo(Math.cos(a) * 40, Math.sin(a) * 40); g.lineTo(Math.cos(a) * 150, Math.sin(a) * 150); g.stroke(); }
    const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
    const [cx, cz] = [(S.area.x0 + S.area.x1) / 2, (S.area.z0 + S.area.z1) / 2], R = 21;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(R * 2, R * 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: new THREE.Color(0.7, 1.2, 0.8), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.rotation.x = -Math.PI / 2; m.position.set(cx, S.fy + 0.012, cz); m.renderOrder = 5;
    this.root.add(m); S.circle = m;
  },

  // The card that comes up at the finish: a few short lines, gone on its own.
  _card() {
    const el = this.cardEl = document.createElement('div'); el.id = 'raceCard'; el.hidden = true; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<div class="o"></div><div class="h"></div><div class="t"></div><div class="q"></div>';
    document.body.append(el);
  },
  showCard(over, head, line, quip, hold = 6) {
    const el = this.cardEl; el.querySelector('.o').textContent = over; el.querySelector('.h').textContent = head; el.querySelector('.t').textContent = line; el.querySelector('.q').textContent = quip || '';
    el.hidden = false; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(this._cardT); this._cardT = setTimeout(() => { el.hidden = true; }, hold * 1000);
  },

  _store() { try { localStorage.setItem(SAVE, JSON.stringify(this.save)); } catch { /* a private window: it lasts the visit */ } },

  // The course, laid the first time it is wanted (or when the toy first comes near, so a press of E has nothing to wait for).
  course(S) {
    if (S.course || S.failed) return S.course;
    try { S.course = layCourse(this.k.plan, S); }
    catch (e) { console.error('race course ' + S.id, e); S.failed = true; }
    return S.course;
  },

  api(k) {
    const me = this;
    return {
      spots: SPOTS,
      get save() { return me.save; },
      course: id => me.course(SPOTS.find(S => S.id === id)),
      // (for tests) put the toy at a spot's arch, facing through it
      at(id) { const S = SPOTS.find(q => q.id === id); k.G.vehicle.place(S.x - S.fx * 3, S.z - S.fz * 3, S.yaw, S.fy); return S; },
      go: id => me.go(SPOTS.find(S => S.id === id)),
      quit: why => me.quit(why),
    };
  },

  go(S) {
    const k = this.k, G = k.G;
    if (G.racing || G.race.cooling || !S) return false;
    if (G.vehicle.kind !== 'car') { k.say(`Cars only. ${G.input.pad ? 'X' : G.input.usedTouch ? 'SWAP' : 'V'} swaps to the car.`, 3); return false; }
    const course = this.course(S);
    if (!course) { k.say('The course is blocked tonight.', 3); return false; }
    this.cur = S; this.done = false;
    for (const v of S.cars) { v.idle = false; v.blink.visible = false; v.body.rotation.set(0, 0, 0); }
    G.race.begin({ id: S.id, course, laps: S.laps, theme: S.theme, player: G.vehicle, sound: k.sound, rivals: S.rivals.map((r, i) => ({ ...r, v: S.cars[i] })) });
    // The card for the prompt is put away (main.js shows it again when there is something to show).
    document.getElementById('placard').hidden = true; document.getElementById('bLook').hidden = true; G.actKey = null;
    if (this.cardEl) this.cardEl.hidden = true;
    if (k.G.tm) k.G.tm.event('race-start', S.id);
    return true;
  },

  quit(why) {
    const k = this.k, G = k.G;
    if (!G.racing) return;
    G.race.end((b, force) => this.home(b, force));
    this.cur = null;
    k.callout('RACE OFF'); k.say(why || 'Race off. They’ll be here.', 0, 3);
  },

  // A rival goes back to where it waits, when nobody is looking (or when it has been out too long).
  home(b, force) {
    const v = b.v, p = v.park;
    if (!force && (this.seen(v.pos) || this.seen(p))) return false;
    v.place(p.x, p.z, p.yaw, this.spotOf(v).fy); v.idle = true; v.revved = false;
    return true;
  },
  spotOf(v) { return SPOTS.find(S => S.cars.includes(v)); },
  seen(p) {
    const cam = this.k.G.camera, dx = p.x - cam.position.x, dz = p.z - cam.position.z, dy = (p.y || 0) - cam.position.y, d = Math.hypot(dx, dy, dz);
    if (d > 40) return false;
    const f = this._f || (this._f = new THREE.Vector3()); cam.getWorldDirection(f);
    return (dx * f.x + dy * f.y + dz * f.z) / Math.max(d, 1e-3) > 0.55;
  },

  finish() {
    const k = this.k, G = k.G, R = G.race, S = this.cur, place = R.finalPlace, total = R.total, all = R.bots.length + 1, rival = S.rivals[0];
    this.done = true;
    const was = this.save.best[S.id], best = !was || total < was;
    if (best) this.save.best[S.id] = total;
    const line = `${S.place} · ${clockText(total)}`, quip = place === 1 ? rival.win : rival.lose;
    if (place === 1) {
      this.save.won[S.id] = true; S.won = true;
      k.find('race:' + S.id);
      if (SPOTS.every(q => this.save.won[q.id])) k.find('race:all');
      if (S.alien) story.add('alienracer');          // its charm: a page of the file, the first time (src/story.js)
    }
    this._store();
    this.showCard(place === 1 ? `YOU BEAT ${rival.name.toUpperCase()}` : `${rival.name.toUpperCase()} WINS`, `${ordinal(place)} of ${all}`, line + (best ? (was ? ' · NEW BEST' : '') : ` · best ${clockText(was)}`), quip);
    if (G.tm) G.tm.event('race', S.id, { place, of: all, total: +total.toFixed(2), toy: G.vehicle.kind });
    R.end((b, force) => this.home(b, force));
    this.cur = null;
  },

  active(k) {
    const R = k.G.race;
    if (R.active || R.cooling) return true;
    const p = k.pos;
    for (const S of SPOTS) if (Math.abs(p.y - S.fy) < 6 && (p.x - S.x) ** 2 + (p.z - S.z) ** 2 < AWAKE * AWAKE) return true;
    this.hum.set(0); this.hum2.set(0);
    return false;
  },

  update(dt, k) {
    const G = k.G, R = G.race, p = k.pos, calm = G.set.reduce;
    this.t += dt;
    let hum = 0;
    for (const S of SPOTS) {
      const d = Math.hypot(p.x - S.x, p.z - S.z), level = Math.abs(p.y - S.fy) < 2.5;
      if (d > AWAKE || !level) continue;
      if (!this.save.seen.includes(S.id) && d < 30) { this.save.seen.push(S.id); this._store(); }
      if (d < 16 && !G.racing) k.once('race-hello:' + S.id, S.rivals[0].hello, 6);
      if (!S.course && !S.building && d < 26 && !G.racing) { S.building = true; setTimeout(() => this.course(S), 0); }      // laid now, so E has nothing to wait for
      if (S.alien) hum = Math.max(hum, Math.max(0, 1 - d / 30));
      // The rivals waiting: lamps blinking, a rev now and then, a little rock on their springs. Solid as drawn.
      S.cars.forEach((v, i) => {
        if (!v.idle) return;
        const ph = this.t * 2.2 + i * 1.3;
        v.blink.visible = Math.sin(ph * 2.4) > -0.2;
        const rev = Math.max(0, Math.sin(this.t * 0.9 + i * 2.1));
        if (!calm) { v.body.rotation.z = Math.sin(this.t * 31 + i) * 0.035 * rev; v.body.position.y = S.alien ? 0.025 + Math.sin(this.t * 2 + i) * 0.012 : 0; }
        if (rev > 0.995 && !v.revved && d < 12) { v.revved = true; this._rev(S.alien, Math.max(0, 1 - d / 12)); } else if (rev < 0.9) v.revved = false;
        this._solid(v, G.vehicle);
      });
      if (S.banner && !calm) S.banner.color.setScalar(1.15 + 0.25 * Math.sin(this.t * 3));
    }
    // The visitor hums: louder nearer, and all through its race.
    if (this.cur && this.cur.alien && (G.racing || R.cooling)) hum = 0.8;
    this.hum.set(hum * 0.05); this.hum2.set(hum * 0.025 * (0.6 + 0.4 * Math.sin(this.t * 5)));
    // The race under way.
    if (G.racing && this.cur) {
      if (R.left) this.quit('You left the course. Race off.');
      else if (R.finished && !this.done) this.finish();
      else if (this.cur.boost) this._boost(this.cur, dt);
    }
  },

  // A flat ring of light on the visitor's course: over it, whoever crosses it is thrown on a little faster.
  _boost(S, dt) {
    const k = this.k, R = k.G.race, [bx, bz] = S.boost;
    if (!this.pad) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.62, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 2.6, 0.6), transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
      m.rotation.x = -Math.PI / 2; m.renderOrder = 7; this.pad = m; R.group.add(m);
    }
    if (this.pad.parent !== R.group) R.group.add(this.pad);
    let at = 0, bd = Infinity; R.route.pts.forEach((q, i) => { const d = (q.x - bx) ** 2 + (q.z - bz) ** 2; if (d < bd) { bd = d; at = i; } });
    const q = R.route.pts[at];
    this.pad.position.set(q.x, q.g + 0.02, q.z); this.pad.material.opacity = 0.65 + 0.3 * Math.sin(this.t * 8);
    for (const v of [k.G.vehicle, ...R.bots.map(b => b.v)]) {
      const d = Math.hypot(v.pos.x - q.x, v.pos.z - q.z);
      if (d < 0.6 && !v.air && (!v.boostT || this.t - v.boostT > 1.5)) {
        v.boostT = this.t;
        const sp = Math.hypot(v.vel.x, v.vel.z), to = Math.min(13, sp * 1.35 + 1.5), f = sp > 0.1 ? to / sp : 0;
        if (f) { v.vel.x *= f; v.vel.z *= f; }
        if (v === k.G.vehicle) { k.synth.note(330, 0.35, { type: 'sawtooth', vol: 0.04 }); k.synth.note(660, 0.4, { type: 'sine', vol: 0.05, at: 0.06 }); }
      }
    }
  },

  _rev(alien, vol) {
    const s = this.k.synth; if (vol <= 0) return;
    if (alien) { s.note(196, 0.5, { type: 'sine', vol: 0.05 * vol }); s.note(294, 0.6, { type: 'sine', vol: 0.04 * vol, at: 0.12 }); return; }
    [70, 92, 118, 104].forEach((f, i) => s.note(f, 0.18, { type: 'sawtooth', vol: 0.035 * vol, at: i * 0.07 }));
  },

  // Keep the player's toy out of a parked rival: its own box, turned as it is turned.
  _solid(v, me) {
    const dx = me.pos.x - v.pos.x, dz = me.pos.z - v.pos.z;
    if (dx * dx + dz * dz > 1.2 || Math.abs(me.pos.y - v.pos.y) > 0.35) return;
    const c = Math.cos(v.yaw), s = Math.sin(v.yaw), lx = dx * c - dz * s, lz = dx * s + dz * c;      // into the rival's own frame (+z its nose)
    const hx = v.half.x + me.radius * 0.85, hz = v.half.z + me.radius * 0.85;
    if (Math.abs(lx) >= hx || Math.abs(lz) >= hz) return;
    let px = 0, pz = 0;
    if (hx - Math.abs(lx) < hz - Math.abs(lz)) px = (Math.sign(lx) || 1) * (hx - Math.abs(lx)); else pz = (Math.sign(lz) || 1) * (hz - Math.abs(lz));
    const wx = px * c + pz * s, wz = -px * s + pz * c;
    me.pos.x += wx; me.pos.z += wz;
    const l = Math.hypot(wx, wz) || 1, into = -(me.vel.x * wx + me.vel.z * wz) / l;
    if (into > 0) { me.vel.x += wx / l * into * 1.3; me.vel.z += wz / l * into * 1.3; if (into > 1.2) this.k.sound.bump(1.5 + into * 0.3); }
  },

  near(v, k) {
    const G = k.G;
    if (G.racing || G.race.cooling || G.held) return null;
    for (const S of SPOTS) {
      if (Math.abs(v.pos.y - S.fy) > 1) continue;
      const d = Math.hypot(v.pos.x - S.x, v.pos.z - S.z);
      if (d > NEAR && !S.cars.some(c => Math.hypot(v.pos.x - c.pos.x, v.pos.z - c.pos.z) < 1.6)) continue;
      const name = S.rivals.length > 1 ? `${S.rivals[0].name} and ${S.rivals[1].name}` : S.rivals[0].name, best = this.save.best[S.id];
      if (v.kind !== 'car') return { verb: 'RACE', card: [`RACE ${S.rivals[0].name.toUpperCase()}?`, 'Cars only: swap to the car', 'race'], act: () => k.say(`Cars only. ${G.input.pad ? 'X' : G.input.usedTouch ? 'SWAP' : 'V'} swaps to the car.`, 3) };
      return { verb: 'RACE', card: [`RACE ${S.rivals[0].name.toUpperCase()}?`, `${name} · ${S.laps} laps` + (best ? ` · best ${clockText(best)}` : ''), 'race'], act: () => this.go(S) };
    }
    return null;
  },

  spots() { return SPOTS.map(S => ({ kind: 'secret', id: 'race:' + S.id, name: `Race ${S.rivals[0].name}`, x: S.x, y: S.fy, z: S.z })); },

  // A new night: every rival back where it waits, the course put away.
  reset(k) {
    k.G.race.stop(); this.cur = null; this.done = false;
    for (const S of SPOTS) for (const v of S.cars) { v.place(v.park.x, v.park.z, v.park.yaw, S.fy); v.idle = true; v.body.rotation.set(0, 0, 0); }
    if (this.pad && this.pad.parent) this.pad.parent.remove(this.pad);
    if (this.cardEl) this.cardEl.hidden = true;
  },
  // A new game: nobody has been raced, nothing seen.
  fresh() {
    this.save = { seen: [], won: {}, best: {} }; this._store();
    for (const S of SPOTS) S.won = false;
  },
});
