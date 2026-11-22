// The Green Cheese file: what draws a new player from the front door down to the base (docs/FINALE.md, "The hooks").
//
// The chain itself is older: the mice and their nests (src/nests.js), the Director's desk, the whiteboard, the painting,
// Sub-level 9 (src/secret.js), the keycard and the base (src/finale.js). This file adds what leads into it and along it:
//   * glowing pawprints on the front terrace, going in at the air vent ahead of you (the first ten seconds);
//   * a floor grate in the lobby, lit green from below and humming. A mouse dives through it as you come in. Pull up and
//     LISTEN: far down, five notes, the craft's call (src/motif.js). The mice squeak the same notes (src/mice.js);
//   * out of doors, now and then, a green light falling over the lake towards Butler Field;
//   * where it comes down, rings melted into the snow over the silo, five marks round them in the call's colours, and the
//     call again, from under your wheels;
//   * in the base, a last note from the Director, "— D.", on the floor of the office: why any of it matters;
//   * the file itself: each step found is a page, with a toast and as many notes of the call as pages so far (the tune
//     grows as the mystery does), and a faint "?" on the map where to look next. The pause menu opens it once it has a page.
//
// Nothing is drawn or done per frame far from these places: the grate only near the lobby, the sky only out of doors (and
// only a timer until a light falls), the rings are two flat meshes riding the silo doors, the note is built when first near.
//
// ---- the story API, for other modules (works before or after this feature starts) --------------------------------
//   import { story } from './story.js';      (also G.story once the game is running)
//   story.add(id)        a page found: true the first time. Shows the toast and plays the sting; saved ('after-hours.story').
//   story.has(id)        story.count, story.total        story.open() shows the file.
//   story.enable(id)     an optional page (the alien racer's) counts towards the total only once its module says it exists.
// The alien racer (being added alongside the race spots) should, at its init, call story.enable('alienracer'), and when
// beaten, story.add('alienracer'). Its page and words are already here (ENTRIES), and once it is found the map's faint "?"
// goes on the rings over the silo, as for the light over the lake.

import * as THREE from 'three';
import { feature, features } from './features.js';
import { groundAt } from './plan.js';
import { mice, mouseGeometry, pawTexture } from './mice.js';
import { MOTIF, MOTIF_COLOURS, motifVoice } from './motif.js';
import { toast } from './trophies.js';
import * as TX from './textures.js';

const KEY = 'after-hours.story';
const GREEN = new THREE.Color(0.32, 1, 0.42);
const NEST_ORDER = ['north', 'south', 'rice', 'modern', 'lower'];      // the order the chewed pages lead on (src/nests.js)

// The pages of the file, in the order a player usually meets them. `hint` is shown (dimly) for the first page not yet found.
export const ENTRIES = [
  { id: 'grate', title: 'Five notes from below', line: 'A grate in the lobby, lit green from underneath. Far down, five notes, over and over. Like a call.', hint: 'Listen at the glowing grate in the lobby.' },
  { id: 'lights', title: 'Lights over the lake', line: 'A green light fell towards the park. Not a sound.', hint: 'Watch the sky over the lake.' },
  { id: 'ring', title: 'Rings in the snow', line: 'Rings melted into Butler Field, five marks round them, five colours. The call again, under the snow.', hint: 'Where did the light come down?' },
  { id: 'nests', title: 'The chewed file', line: n => `TOP SECRET pages the mice carried up from somewhere. ${n} of 5 nests.`, hint: 'Follow a glowing mouse home.' },
  { id: 'desk', title: 'The Director’s desk', line: '“The way down is behind a painting.”  — D.', hint: 'The mice have the Director’s key.' },
  { id: 'passage', title: 'Behind the painting', line: 'Stone on stone. A way through, and it goes down.', hint: 'The Director’s whiteboard names a picture.' },
  { id: 'sublevel9', title: 'Sub-level 9', line: 'Twelve metres down and on nobody’s drawings. Jars. A star chart. A keycard.', hint: 'Behind the painting, a stair goes down.' },
  { id: 'alienracer', optional: true, title: 'The green racer’s charm', line: 'Dropped by a racer that glowed. Warm, and it hums when it faces the park.', hint: 'Something green races at night.' },
  { id: 'base', title: 'Project Green Cheese', line: 'A base under Butler Field. In the hangar, it is waiting.', hint: 'A keycard, a blast door, a tunnel east.' },
];
const BY = Object.fromEntries(ENTRIES.map(e => [e.id, e]));

// ---------------------------------------------------------------- what is kept
let st = load();
function load() {
  let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { s = null; }
  return { got: [], dove: false, note: false, ...(s || {}) };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* a private window: it lasts the visit */ } }
const live = new Set();          // optional pages whose module has said they exist (not saved: said again at every start)
const pending = [];              // pages added before the feature could show them
let me = null;                   // the feature, once started

export const story = {
  add(id, o = {}) {
    if (!BY[id] || st.got.includes(id)) return false;
    st.got.push(id); if (BY[id].optional) live.add(id); save();
    if (me && me.k) me._found(id, o.quiet); else pending.push(id);
    return true;
  },
  has: id => st.got.includes(id),
  enable(id) { if (BY[id]) live.add(id); },
  get entries() { return ENTRIES.filter(e => !e.optional || live.has(e.id) || st.got.includes(e.id)); },
  get count() { return this.entries.filter(e => st.got.includes(e.id)).length; },
  get total() { return this.entries.length; },
  // Has the player heard the call somewhere before the console? (src/finalelaunch.js says so when it plays.)
  get heard() { return ['grate', 'ring', 'lights'].some(id => st.got.includes(id)); },
  open() { if (me) me._openFile(); },
};

// ---------------------------------------------------------------- the Director's last note
// Cream paper, a hand in fountain pen, signed D.; a faint green paw print where a mouse sat on it.
const D_NOTE = ['It calls every night:', 'five notes, a question.', 'I never found the answer.', 'If you have, play it back', 'and take it home. Take the', 'pictures too. That is', 'what they came for.'];
function noteCard() {
  const W = 520, H = 600, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = '#efe7d2'; g.fillRect(16, 16, W - 32, H - 32);
  g.fillStyle = 'rgba(120,96,60,.07)'; for (let i = 0; i < 50; i++) g.fillRect(16 + (i * 97) % (W - 40), 16 + (i * 61) % (H - 40), 3 + (i * 13) % 40, 1);
  g.strokeStyle = 'rgba(60,90,140,.18)'; g.lineWidth = 1.5; for (let y = 120; y < H - 40; y += 52) { g.beginPath(); g.moveTo(40, y); g.lineTo(W - 40, y); g.stroke(); }
  g.font = '34px "Bradley Hand", "Segoe Print", "Marker Felt", "Comic Sans MS", cursive'; g.fillStyle = '#1f2b55';
  D_NOTE.forEach((l, i) => g.fillText(l, 48, 110 + i * 52));
  g.font = 'italic 40px "Bradley Hand", "Segoe Print", "Marker Felt", cursive'; g.fillText('— D.', W - 170, H - 64);
  g.save(); g.translate(W * 0.2, H - 80); g.fillStyle = 'rgba(110,255,140,.45)'; g.shadowColor = '#6eff8c'; g.shadowBlur = 10;
  g.beginPath(); g.ellipse(0, 8, 10, 8, 0, 0, 7); g.fill(); for (const [x, y] of [[-12, -8], [-4, -15], [5, -15], [13, -8]]) { g.beginPath(); g.ellipse(x, y, 4, 5, 0, 0, 7); g.fill(); } g.restore();
  return cv;
}

// The rings melted into the snow over the silo: three rings, a broken fourth, and five marks round it in the call's colours.
function ringTexture() {
  const S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'), c = S / 2;
  g.clearRect(0, 0, S, S); g.lineCap = 'round';
  const melt = (r, w, a0 = 0, a1 = Math.PI * 2) => { g.strokeStyle = 'rgba(58,82,112,.7)'; g.lineWidth = w; g.beginPath(); g.arc(c, c, r, a0, a1); g.stroke(); g.strokeStyle = 'rgba(120,255,160,.16)'; g.lineWidth = w * 0.35; g.beginPath(); g.arc(c, c, r, a0, a1); g.stroke(); };
  melt(110, 26); melt(230, 18); melt(330, 30);
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; melt(430, 14, a + 0.22, a + Math.PI * 2 / 5 - 0.22); }
  for (let i = 0; i < 5; i++) {        // the five marks, on the broken ring's gaps
    const a = -Math.PI / 2 + i * Math.PI * 2 / 5, x = c + Math.cos(a) * 430, y = c + Math.sin(a) * 430;
    const gr = g.createRadialGradient(x, y, 4, x, y, 52); gr.addColorStop(0, MOTIF_COLOURS[i]); gr.addColorStop(0.45, MOTIF_COLOURS[i] + '88'); gr.addColorStop(1, MOTIF_COLOURS[i] + '00');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, 52, 0, 7); g.fill();
    g.strokeStyle = 'rgba(70,96,128,.6)'; g.lineWidth = 10; g.beginPath(); g.moveTo(c + Math.cos(a) * 345, c + Math.sin(a) * 345); g.lineTo(c + Math.cos(a) * 395, c + Math.sin(a) * 395); g.stroke();
  }
  g.fillStyle = 'rgba(70,96,128,.5)'; g.beginPath(); g.arc(c, c, 36, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// The grate: iron bars over slots, the slots lit from beneath.
function grateTexture() {
  const W = 256, H = 160, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = '#1d2124'; g.fillRect(0, 0, W, H);
  const lit = g.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.6); lit.addColorStop(0, '#b8ffcc'); lit.addColorStop(0.5, '#4fe07a'); lit.addColorStop(1, '#173a22');
  g.fillStyle = lit; for (let x = 22; x < W - 22; x += 18) g.fillRect(x, 18, 9, H - 36);
  g.strokeStyle = '#3a4045'; g.lineWidth = 8; g.strokeRect(6, 6, W - 12, H - 12);
  g.fillStyle = '#b08a3a'; g.fillRect(W - 54, H - 30, 34, 14);            // the brass tag
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

feature({
  id: 'story',

  init(k) {
    this.k = k; me = this; this.t = 0; this.syncT = 0; this.synced = false; this.marks = []; this.cardAt = null;
    k.G.story = story;
    const P = k.plan;
    this.L = P.byId[P.front && P.front.a] || P.byId.lobby || null;
    this.root = new THREE.Group(); this.root.name = 'story'; k.group.add(this.root);
    this.radial = TX.radial(0, 1.2);
    if (this.L) this._lobby(k);
    this._sky(k);
    this.silo = P.grounds && P.grounds.silo;
    this.office = P.byId['B-office'] || null;
    this.hum = k.loop({ type: 'sine', freq: 73.4 });          // D, low: the grate's hum (the call is in D)
    this.ringHum = k.loop({ type: 'sine', freq: 55 });
    // the card on screen (the note)
    const el = this.cardEl = document.createElement('div'); el.id = 'storyCard';
    el.style.cssText = 'position:fixed;left:50%;top:44%;transform:translate(-50%,-50%) rotate(-1.5deg);width:min(70vmin,340px);pointer-events:none;opacity:0;transition:opacity .25s;z-index:30;filter:drop-shadow(0 10px 24px rgba(0,0,0,.55))';
    document.body.appendChild(el);
  },

  // ---------------------------------------------------------------- the front: pawprints and the grate
  _lobby(k) {
    const P = k.plan, L = this.L;
    const vents = P.doors.filter(d => (d.a === L.id && d.b === 'out') || (d.b === L.id && d.a === 'out'));
    const vent = vents.find(d => Math.min(d.x1 - d.x0, d.z1 - d.z0) < 2) || vents[0];
    if (!vent) return;
    const alongX = (vent.x1 - vent.x0) > (vent.z1 - vent.z0);       // the vent runs through the west wall, so along x
    const vz = (vent.z0 + vent.z1) / 2, vx0 = vent.x0, vx1 = vent.x1, y = L.y;
    void alongX;
    this.grate = { x: Math.min(L.x1 - 1, vx1 + 4), y, z: vz, w: 0.9, d: 0.6 };
    const G = this.grate, g = this.grateG = new THREE.Group(); g.name = 'story-grate'; this.root.add(g);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(G.w, G.d).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: grateTexture(), polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    face.position.set(G.x, y + 0.011, G.z); face.renderOrder = 2; g.add(face);
    this.gratePool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: this.radial, color: GREEN.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    this.gratePool.position.set(G.x, y + 0.013, G.z); this.gratePool.scale.set(2.6, 1, 2.2); this.gratePool.renderOrder = 3; g.add(this.gratePool);
    // light coming up through it: two crossed glowing sheets, fading upward
    const shaftTex = (() => { const cv = document.createElement('canvas'); cv.width = 32; cv.height = 128; const c = cv.getContext('2d'), gr = c.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 32, 128); const h = c.createLinearGradient(0, 0, 32, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = h; c.fillRect(0, 0, 32, 128); return new THREE.CanvasTexture(cv); })();
    this.shaftMat = new THREE.MeshBasicMaterial({ map: shaftTex, color: GREEN.clone().multiplyScalar(0.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    for (const r of [0, Math.PI / 2]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(r ? G.d : G.w, 1.4), this.shaftMat); s.position.set(G.x, y + 0.72, G.z); s.rotation.y = r; g.add(s); }
    // the pawprints: from the terrace in at the vent, through the wall and across to the grate
    const pts = [], add = (x, z) => pts.push([x, z]);
    const bez = (a, b, c, n) => { for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; add(u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]); } };
    bez([vx0 - 2.6, vz - 8.5], [vx0 - 3.4, vz - 0.4], [vx0 - 0.05, vz], 40);      // along the top of the steps from the north, and in
    for (let x = vx0 + 0.13; x < G.x - 0.3; x += 0.13) add(x, vz + Math.sin(x * 1.7) * 0.04);
    const prints = [], STEP = 0.13;
    let acc = 0, foot = 1;
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i], l = Math.hypot(bx - ax, bz - az);
      for (acc += l; acc > STEP; acc -= STEP) { const f = 1 - acc / l, x = ax + (bx - ax) * f, z = az + (bz - az) * f; foot = -foot; prints.push({ x, z, yaw: Math.atan2(bx - ax, bz - az), foot }); }
    }
    const pos = [], uv = [], col = [], idx = [];
    prints.forEach((q, i) => {
      const fx = Math.sin(q.yaw), fz = Math.cos(q.yaw), rx = -fz, rz = fx, s = q.foot * 0.026, cx = q.x + rx * s, cz = q.z + rz * s, hw = 0.042, hl = 0.05;
      const yy = (q.x < vx0 ? groundAt(P, cx, cz, 0.3) : y) + 0.012, b = 0.35 + 0.65 * (i / prints.length);      // brighter towards the grate: fresher
      for (const [a, c] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(cx + rx * hw * a + fx * hl * c, yy, cz + rz * hw * a + fz * hl * c); col.push(GREEN.r * b, GREEN.g * b, GREEN.b * b); }
      uv.push(0, 0, 1, 0, 1, 1, 0, 1); idx.push(i * 4, i * 4 + 2, i * 4 + 1, i * 4, i * 4 + 3, i * 4 + 2);
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
    const pm = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: pawTexture(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    pm.renderOrder = 3; pm.name = 'story-prints'; this.root.add(pm); this.prints = pm;
    this.ventAt = { x: vx0 - 1.2, y, z: vz };
    // the mouse that dives through the grate as you come in
    const MG = mouseGeometry(), body = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(0.9, 1.5, 0.95) });
    const m = this.diver = new THREE.Group(); m.name = 'story-mouse'; m.rotation.order = 'YXZ';
    const fig = this.diverFig = new THREE.Group(); fig.scale.setScalar(1.35); m.add(fig);
    fig.add(new THREE.Mesh(MG.body, body), new THREE.Mesh(MG.eyes, new THREE.MeshBasicMaterial({ color: 0x040604 })));
    const tail = new THREE.Mesh(MG.tail, body); tail.position.set(0, 0.022, -0.062); fig.add(tail); this.diverTail = tail;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.radial, color: GREEN, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); halo.position.y = 0.05; halo.scale.setScalar(0.5); m.add(halo); this.diverHalo = halo;
    const pool = this.diverPool = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: this.radial, color: GREEN.clone().multiplyScalar(0.8), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    pool.position.y = 0.004; pool.renderOrder = 3; m.add(pool);
    // until it has gone down, it sits on the grate, sniffing, facing the vent: you see it as you come through
    m.position.set(G.x - 0.18, y + 0.012, G.z); m.rotation.y = -Math.PI / 2; m.visible = !st.dove; this.root.add(m);
  },

  // ---------------------------------------------------------------- the sky: a light falling over the lake
  _sky(k) {
    const N = 64, P = this.trailPts = new Float32Array(N * 3).fill(-9999), C = new Float32Array(N * 3);
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(P, 3).setUsage(THREE.DynamicDrawUsage)); tg.setAttribute('color', new THREE.BufferAttribute(C, 3).setUsage(THREE.DynamicDrawUsage));
    const spot = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'), r = c.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(0.3, 'rgba(255,255,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = r; c.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv); })();
    this.trail = new THREE.Points(tg, new THREE.PointsMaterial({ size: 9, map: spot, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false, toneMapped: false }));
    this.head = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3)), new THREE.PointsMaterial({ size: 22, map: spot, color: new THREE.Color(0.75, 1.0, 0.8), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false, toneMapped: false }));
    for (const o of [this.trail, this.head]) { o.frustumCulled = false; o.visible = false; o.renderOrder = 8; this.root.add(o); }
    this.trailCol = C; this.trailN = N;
    this.skyT = 0; this.streak = null; this.nextFall = 7;
  },
  // Where the light falls: from high over the lake to the north-east, in a long curve down towards the park and the silo.
  _path() {
    const s = this.silo || { cx: 432, cz: 176 };
    return { a: new THREE.Vector3(s.cx + 210, 135, s.cz - 310), b: new THREE.Vector3(s.cx + 120, 95, s.cz - 120), c: new THREE.Vector3(s.cx + 12, 14, s.cz + 6) };      // (north to south across the view from the museum and the field, not at it)
  },
  _bez(p, t, out) { const u = 1 - t; return out.set(u * u * p.a.x + 2 * u * t * p.b.x + t * t * p.c.x, u * u * p.a.y + 2 * u * t * p.b.y + t * t * p.c.y, u * u * p.a.z + 2 * u * t * p.b.z + t * t * p.c.z); },
  // Can the camera see the middle of the fall? Facing it, and no building in the way (rooms are boxes in the plan).
  _canSee(k) {
    const cam = k.G.camera; if (!cam) return false;
    const p = this._path(), mid = this._bez(p, 0.55, this._v || (this._v = new THREE.Vector3())), at = cam.position;
    const d = this._d || (this._d = new THREE.Vector3()); d.copy(mid).sub(at); const len = d.length(); d.divideScalar(len);
    const f = this._f || (this._f = new THREE.Vector3()); cam.getWorldDirection(f);
    if (f.dot(d) < 0.72) return false;
    const rooms = k.plan.rooms;
    for (let s = 3; s < Math.min(len, 260); s += 6) {
      const x = at.x + d.x * s, y = at.y + d.y * s, z = at.z + d.z * s;
      for (const r of rooms) if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1 && y > r.y - 1 && y < r.y + (r.h || 4) + 1.5) return false;
    }
    return true;
  },
  _skyTick(dt, k) {
    const out = !k.room && !k.G.roofed && k.G.state === 'play';
    if (this.streak) {
      const S = this.streak; S.t += dt;
      const f = Math.min(1, S.t / S.dur), e = f * f * (3 - 2 * f), p = this._path(), h = this._bez(p, e, this._h || (this._h = new THREE.Vector3()));
      const hp = this.head.geometry.attributes.position; hp.setXYZ(0, h.x, h.y, h.z); hp.needsUpdate = true;
      const T = this.trailPts, N = this.trailN; T.copyWithin(3, 0, (N - 1) * 3); T[0] = h.x; T[1] = h.y; T[2] = h.z;
      const C = this.trailCol, fade = f > 0.92 ? (1 - f) / 0.08 : 1;
      for (let i = 0; i < N; i++) { const b = (1 - i / N) * fade; C[i * 3] = 0.25 * b; C[i * 3 + 1] = 0.95 * b; C[i * 3 + 2] = 0.45 * b; }
      this.trail.geometry.attributes.position.needsUpdate = true; this.trail.geometry.attributes.color.needsUpdate = true;
      this.head.material.opacity = fade;
      if (f >= 1) {
        this.trail.visible = this.head.visible = false; this.streak = null;
        this._call(k, { below: false, transpose: 12, gain: 0.018, beat: 0.5, at: 0.4, lp: 2400 });     // far off, the call, thin and high
        if (S.seen && story.add('lights')) k.say('A green light, falling towards the park. Not a sound.', 1.2, 6);
      }
      return;
    }
    if (!out) return;
    this.skyT += dt;
    if (this.skyT < this.nextFall) return;
    if (!this._canSee(k)) { this.nextFall = this.skyT + 0.5; return; }      // wait until the camera is turned that way
    this.skyT = 0; this.nextFall = story.has('lights') ? 70 + Math.random() * 60 : 25;
    this.streak = { t: 0, dur: 3.4, seen: true };
    this.trailPts.fill(-9999); this.trail.visible = this.head.visible = true;
  },

  // ---------------------------------------------------------------- the rings in the snow
  _rings(k) {
    if (this.ringsMade || !this.silo) return;
    const fin = features.find(f => f.id === 'finale'), doors = fin && fin.doorMeshes;
    if (!doors) return;
    this.ringsMade = true;
    const s = this.silo, half = (s.x1 - s.x0) / 2, mat = new THREE.MeshBasicMaterial({ map: ringTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, color: new THREE.Color(1.15, 1.15, 1.15) });
    // one half on each door, so the pattern parts when they open (they are built shut at y 0, in world x and z)
    for (const grp of doors) {
      const w = grp.userData.side === 'w', x0 = w ? s.x0 : s.x0 + half, geo = new THREE.PlaneGeometry(half, s.z1 - s.z0).rotateX(-Math.PI / 2);
      const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, (w ? 0 : 0.5) + uv.getX(i) * 0.5);
      const m = new THREE.Mesh(geo, mat); m.position.set(x0 + half / 2, 0.012, (s.z0 + s.z1) / 2); m.renderOrder = 2; m.name = 'story-rings';
      m.matrixAutoUpdate = false; m.updateMatrix(); grp.add(m);
    }
  },
  _ringTick(dt, k, p) {
    const s = this.silo; if (!s) return;
    const d = Math.hypot(p.x - s.cx, p.z - s.cz), on = !k.room && Math.abs(p.y) < 2.5 && d < 40;
    this.ringHum.set(on && d < 14 ? 0.022 * (1 - d / 14) : 0);
    if (!on || d > 12.5 || this.ringTold) return;
    const fin = features.find(f => f.id === 'finale'); if (fin && fin.F && fin.F.doorsK > 0.02) return;
    this.ringTold = true;
    if (!story.has('ring')) {
      k.say('Rings melted into the snow. Five marks round them, five colours.', 0.2, 6);
      this._call(k, { below: true, transpose: -12, gain: 0.05, beat: 0.55, at: 2.6 });
      k.say(story.has('grate') ? 'And under the snow, the same five notes.' : 'From under the snow: five notes, very faint.', 3.2, 6);
      setTimeout(() => story.add('ring'), 5600);
    }
  },

  // ---------------------------------------------------------------- the grate, each frame near the lobby
  _grateTick(dt, k, p) {
    const G = this.grate; if (!G) return;
    const d = Math.abs(p.y - G.y) < 2.5 ? Math.hypot(p.x - G.x, p.z - G.z) : 1e4;
    const near = d < 45;
    this.grateG.visible = this.prints.visible = near;
    if (!near) { this.hum.set(0); return; }
    const t = this.t, pulse = 0.5 + 0.5 * Math.sin(t * 2.1), fl = this.flare = Math.max(0, (this.flare || 0) - dt * 1.4);
    const col = this.grateCol || GREEN;
    this.gratePool.material.color.copy(col).multiplyScalar(0.55 + 0.35 * pulse + fl * 1.5);
    this.shaftK = Math.min(1, (this.shaftK || 0) + (st.dove ? dt * 0.5 : -1));          // the light comes up only once the mouse has gone down
    this.shaftMat.color.copy(col).multiplyScalar((0.24 + 0.14 * pulse + fl) * Math.max(0, this.shaftK));
    this.hum.set(d < 9 ? 0.03 * (1 - d / 9) : 0);
    // now and then, the call from below, faint, while you are near
    if (d < 10 && !this.calling && (this.ambT = (this.ambT || 0) + dt) > 15) { this.ambT = 0; this._call(k, { below: true, transpose: -12, gain: 0.022, beat: 0.6, colour: true }); }
    // the mouse, the first time you are in the lobby
    const L = this.L;
    if (!st.dove && !this.dive) {
      const m = this.diver; m.visible = true;
      // sniffing, looking round at you as you come
      const look = Math.atan2(p.x - m.position.x, p.z - m.position.z);
      m.rotation.y += Math.atan2(Math.sin(look - m.rotation.y), Math.cos(look - m.rotation.y)) * Math.min(1, dt * (d < 8 ? 5 : 1.5));
      m.rotation.x = -0.12 + Math.sin(t * 2.3) * 0.06 - (d < 8 ? 0.25 : 0); this.diverTail.rotation.y = Math.sin(t * 3) * 0.35;
      this.diverHalo.scale.setScalar(Math.min(1.8, 0.45 + d / 7) * (1 + 0.1 * Math.sin(t * 5)));      // a beacon, bigger from further off, as the mice are
      if (k.room && k.room.id === L.id && d < 3.6) {
        this.dive = { t: 0, phase: 'look' };
        const a = MOTIF[0], b = MOTIF[1]; k.synth.note(440 * Math.pow(2, (a.midi + 36 - 69) / 12), 0.05, { type: 'sine', vol: 0.02 }); k.synth.note(440 * Math.pow(2, (b.midi + 36 - 69) / 12), 0.06, { type: 'sine', vol: 0.018, at: 0.09 });
      }
    }
    if (this.dive) this._diveTick(dt, k);
  },
  _diveTick(dt, k) {
    const D = this.dive, G = this.grate, m = this.diver; D.t += dt;
    if (D.phase === 'look') {          // sits up, looks at you a moment, and turns for the slots
      m.rotation.x = -0.4; this.diverTail.rotation.y = Math.sin(D.t * 10) * 0.4;
      if (D.t > 0.7) { D.phase = 'duck'; D.t = 0; this.flare = 1.2; k.synth.noise(0.12, { vol: 0.03, lp: 3000 }); this._call(k, { below: true, transpose: -12, gain: 0.05, beat: 0.5, notes: 3, at: 0.6, colour: true }); }
    } else {
      const f = Math.min(1, D.t / 0.5); m.rotation.x = 0.5 * f; m.position.x += (G.x - m.position.x) * Math.min(1, dt * 8); this.diverFig.scale.setScalar(1.35 * (1 - f)); m.position.y = G.y + 0.012 - 0.05 * f;
      if (f >= 1) { m.visible = false; this.dive = null; st.dove = true; save(); k.say('A glowing mouse. It just went down through that grate.', 0.4, 6); }
    }
  },

  // ---------------------------------------------------------------- the call, from wherever
  // o: { below (through a low muffle, as if from far down), transpose, gain, beat, at, notes (how many), colour (the grate's
  // light takes each note's colour), lp }
  _call(k, o = {}) {
    const S = k.sound, c = S && S.ctx; if (!c || c.state !== 'running' || !S.master) return 0;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp || (o.below ? 650 : 4000); lp.connect(S.master);
    const beat = o.beat || 0.45, n = o.notes || 5, t0 = c.currentTime + (o.at || 0.05);
    let t = 0, end = 0;
    for (let i = 0; i < n; i++) {
      const N = MOTIF[i], dur = (i === n - 1 && n < 5 ? 1.5 : N.beats) * beat;
      end = motifVoice(c, lp, N.midi + (o.transpose || 0), t0 + t, dur, o.gain || 0.04);
      if (o.colour && this.grate) setTimeout(() => { this.grateCol = new THREE.Color(MOTIF_COLOURS[i]).lerp(GREEN, 0.25); this.flare = Math.max(this.flare || 0, 0.8); }, (t0 + t - c.currentTime) * 1000);
      t += N.beats * beat;
    }
    this.calling = true; this.callEnd = Math.max(this.callEnd || 0, end);
    setTimeout(() => { this.calling = false; this.grateCol = null; try { lp.disconnect(); } catch { /* gone */ } }, (end - c.currentTime) * 1000 + 200);
    return end - c.currentTime;
  },
  _listen() {
    const k = this.k, c = k.sound && k.sound.ctx;
    if (this.listening) return;
    const wait = c && this.calling ? Math.max(0, (this.callEnd || 0) - c.currentTime) + 0.3 : 0.05;      // (the grate may be in the middle of calling: after it)
    const secs = this._call(k, { below: true, transpose: -12, gain: 0.06, beat: 0.55, colour: true, at: wait });
    this.listening = true; setTimeout(() => { this.listening = false; }, Math.max(1, secs) * 1000);
    k.say('Far below, five notes. The same five, over and over. Like something calling.', 0.2, 6);
    setTimeout(() => { if (story.add('grate')) k.say('A brass tag on the grate: KEEP SHUT.  — D.', 0.3, 5); }, Math.max(1, secs) * 1000);
  },

  // ---------------------------------------------------------------- the Director's note, in the base office
  _office(k, p) {
    const O = this.office; if (!O) return;
    const near = Math.abs(p.y - O.y) < 3 && p.x > O.x0 - 20 && p.x < O.x1 + 20 && p.z > O.z0 - 20 && p.z < O.z1 + 20;
    if (!near) { if (this.noteG) this.noteG.visible = false; return; }
    if (!this.noteG) {
      const g = this.noteG = new THREE.Group(); g.name = 'story-note';
      this.noteAt = { x: O.x0 + 5, y: O.y, z: (O.z0 + O.z1) / 2 + 1.2 };
      const tex = new THREE.CanvasTexture(noteCard()); tex.colorSpace = THREE.SRGBColorSpace;
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.23).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.85, 0.85, 0.82), polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
      sheet.position.set(this.noteAt.x, O.y + 0.011, this.noteAt.z); sheet.rotation.y = 0.35; g.add(sheet);
      // a little saucer for a paperweight, on its corner
      const metal = new THREE.MeshStandardMaterial({ color: 0xc9ced6, metalness: 0.8, roughness: 0.3, emissive: 0x3a4a44, emissiveIntensity: 0.8 });
      const disc = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 6), metal); disc.scale.set(1, 0.28, 1); disc.position.set(this.noteAt.x + 0.06, O.y + 0.022, this.noteAt.z - 0.07); g.add(disc);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 1.7, 0.7) })); dome.position.set(this.noteAt.x + 0.06, O.y + 0.03, this.noteAt.z - 0.07); g.add(dome);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: this.radial, color: GREEN.clone().multiplyScalar(0.35), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
      pool.position.set(this.noteAt.x, O.y + 0.013, this.noteAt.z); pool.renderOrder = 3; g.add(pool);
      this.root.add(g);
    }
    this.noteG.visible = true;
    if (!st.note && Math.hypot(p.x - this.noteAt.x, p.z - this.noteAt.z) < 4) k.once('story-note', 'A note on the floor, under a little saucer.', 4);
  },
  _showNote(on) {
    this.cardEl.innerHTML = '';
    if (on) { const cv = noteCard(); cv.style.cssText = 'width:100%;height:auto;display:block'; this.cardEl.appendChild(cv); this.cardAt = { x: this.k.pos.x, z: this.k.pos.z, t: this.t }; } else this.cardAt = null;
    this.cardEl.style.opacity = on ? '1' : '0'; this.showing = on;
  },

  // ---------------------------------------------------------------- the file, kept in step with the rest of the game
  _feat(id) { return features.find(f => f.id === id); },
  // The older steps of the chain are noticed here rather than in their own files: what each has kept says how far you are.
  _sync(quiet) {
    const N = this._feat('nests'), S = this.k.G.secret, F = this._feat('finale');
    const ns = N && N.state, read = ns ? Object.keys(ns.read || {}).filter(w => ns.read[w]).length : 0;
    const add = id => story.add(id, { quiet });
    if (read) add('nests');
    if (ns && ns.desk) add('desk');
    if (S && S.open) add('passage');
    if (S && S.arrived) add('sublevel9');
    if (F && F.save && F.save.state !== 'locked') add('base');
    this.nestsRead = read;
    this._pointers();
  },
  // Where to look next: one faint "?" on the map for the next step of the chain, and one where the light came down.
  _pointers() {
    const k = this.k, G = k.G, out = [];
    if (story.count) {
      const s = this.silo;
      if (s && (story.has('lights') || story.has('alienracer')) && !story.has('ring')) out.push({ x: s.cx, y: 0, z: s.cz });
      const q = this._next(); if (q) out.push(q);
    }
    const key = out.map(q => `${q.x.toFixed(1)},${q.z.toFixed(1)}`).join('|');
    if (key === this.marksKey) return;
    this.marksKey = key;
    const keep = (G.mapMarks || []).filter(m => !m.story);
    this.marks = out.map(q => ({ x: q.x, y: q.y, z: q.z, glyph: '?', colour: '#9dffb0', story: true }));
    G.mapMarks = [...keep, ...this.marks];
  },
  _next() {
    const k = this.k, G = k.G, N = this._feat('nests'), S = G.secret, F = this._feat('finale');
    const ns = N && N.state, state = F && F.save ? F.save.state : 'locked';
    if (state !== 'locked') {
      if (state === 'found' && F.built && G.finale) { const c = G.finale.console; if (c && c.position) return { x: c.position.x, y: c.position.y, z: c.position.z }; }
      return null;
    }
    if (F && F.save && F.save.card && F.F && F.F.blast) return { x: F.F.blast.x, y: F.F.blast.y, z: F.F.blast.z };
    if (S && S.arrived) return F && F.cardAt ? { ...F.cardAt } : null;
    if (S && S.open) return null;                                   // (the wall has its own red mark until you are through)
    if (S && S.clueRead && S.clue && S.clue.art) { const a = S.clue.art; return { x: a.x, y: a.y, z: a.z }; }
    if (ns && ns.desk) { const b = G.boards && G.boards.byId && G.boards.byId.clue; return b ? { x: b.x, y: b.y - 1.6, z: b.z } : null; }
    if (ns && ns.key && N._desk) { const D = N._desk(); return D ? { x: D.at.x, y: D.at.y, z: D.at.z } : null; }
    if (!ns || !mice.list || !mice.list.length) return null;
    for (const w of NEST_ORDER) {
      if (ns.read[w]) continue;
      const m = mice.list.find(q => q.wing && q.wing.id === w); if (!m) continue;
      if (mice.seenHome(w)) return { x: m.hole.x, y: m.y, z: m.hole.z };
      return { x: m.pts[0].x, y: m.y, z: m.pts[0].z };
    }
    return null;
  },
  // A page found: the toast, and the call as far as the file has got (a note a page, the whole of it from five).
  _found(id, quiet) {
    this._pointers();
    if (quiet) return;
    const k = this.k, e = BY[id], n = story.count, of = story.total;
    const sting = () => this._call(k, { transpose: 12, gain: 0.03, beat: 0.17, notes: Math.min(5, n), lp: 5000 });
    setTimeout(() => toast({ head: `The Green Cheese file · ${n} of ${of}`, name: e.title, tier: 'file', icon: SAUCER, sound: sting, hold: 4600 }), id === 'grate' || id === 'lights' || id === 'ring' ? 200 : 1800);
    if (n === 1) k.say('A page for the Green Cheese file. It is in the pause menu.', 5.5, 5);
  },

  // ---------------------------------------------------------------- the file, on screen
  _openFile() {
    if (!this.el) {
      const css = document.createElement('style');
      css.textContent = `#greenFile { position: fixed; inset: 0; z-index: 40; display: flex; align-items: center; justify-content: center; background: rgba(3,8,6,.94); padding: max(12px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left)); box-sizing: border-box; font-family: var(--serif, Georgia, serif); color: var(--cream, #f1ead8); }
#greenFile[hidden] { display: none; }
#greenFile .box { width: min(620px, 100%); max-height: 100%; display: flex; flex-direction: column; gap: 10px; }
#greenFile h2 { margin: 0; font-size: 22px; letter-spacing: .14em; text-transform: uppercase; color: #9dffb0; }
#greenFile .n { font: 600 13px var(--mono, ui-monospace, monospace); letter-spacing: .08em; color: #9dffb0; opacity: .8; }
#greenFile ol { list-style: none; margin: 0; padding: 0; overflow: auto; display: flex; flex-direction: column; gap: 2px; }
#greenFile li { display: grid; grid-template-columns: 1.6em 1fr; gap: 2px 8px; padding: 6px 0; border-bottom: 1px solid rgba(157,255,176,.14); }
#greenFile li i { font-style: normal; color: #9dffb0; font: 600 13px var(--mono, ui-monospace, monospace); padding-top: 3px; }
#greenFile li b { font-weight: 600; font-size: 16px; }
#greenFile li span { grid-column: 2; font-size: 14px; color: #c9c3b2; line-height: 1.35; }
#greenFile li.no b { color: #6d6a60; letter-spacing: .25em; }
#greenFile li.no span { color: #7f9a86; font-style: italic; }
#greenFile button { height: 44px; border-radius: 8px; border: 1px solid rgba(157,255,176,.5); background: rgba(8,14,10,.66); color: #9dffb0; font: 700 12px var(--mono, ui-monospace, monospace); letter-spacing: .12em; }`;
      document.head.append(css);
      const el = this.el = document.createElement('section'); el.id = 'greenFile'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'The Green Cheese file');
      el.innerHTML = '<div class="box"><h2>The Green Cheese file</h2><div class="n"></div><ol></ol><button>Close</button></div>';
      document.body.append(el);
      el.querySelector('button').addEventListener('click', () => this._closeFile());
      addEventListener('keydown', e => { if (!this.el.hidden && e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); this._closeFile(); } }, true);
    }
    const ol = this.el.querySelector('ol'); ol.textContent = '';
    let hinted = false;
    story.entries.forEach((e, i) => {
      const got = story.has(e.id), li = document.createElement('li'), num = document.createElement('i'), b = document.createElement('b'), sp = document.createElement('span');
      num.textContent = String(i + 1);
      if (got) { b.textContent = e.title; sp.textContent = typeof e.line === 'function' ? e.line(this.nestsRead || 1) : e.line; }
      else { li.className = 'no'; b.textContent = '? ? ?'; if (!hinted && !e.optional) { hinted = true; sp.textContent = e.hint; } }
      li.append(num, b); if (sp.textContent) li.append(sp); ol.append(li);
    });
    this.el.querySelector('.n').textContent = `${story.count} OF ${story.total} FOUND`;
    this.back = document.activeElement; this.el.hidden = false; this.el.querySelector('button').focus({ preventScroll: true });
  },
  _closeFile() { if (!this.el || this.el.hidden) return; this.el.hidden = true; if (this.back && this.back.focus) this.back.focus({ preventScroll: true }); },

  // ---------------------------------------------------------------- the hooks into the game
  near(v, k) {
    if (k.G.mode === 'race') return null;
    const p = k.pos, G = this.grate;
    if (G && Math.abs(p.y - G.y) < 0.8 && Math.hypot(p.x - G.x, p.z - G.z) < 0.95) return { verb: 'LISTEN', hint: story.has('grate') ? null : 'A grate, glowing green. E to listen.', act: () => this._listen() };
    const A = this.noteAt;
    if (A && this.noteG && this.noteG.visible && Math.abs(p.y - A.y) < 0.8 && Math.hypot(p.x - A.x, p.z - A.z) < 0.9) return { verb: 'READ', hint: st.note ? null : 'A note, signed D. E to read it.', act: () => { if (this.showing) { this._showNote(false); return; } this._showNote(true); if (!st.note) { st.note = true; save(); k.say('The Director. Whoever D. was, they meant to send it home.', 0.6, 6); } } };
    return null;
  },
  active(k) { return k.G.mode !== 'race' && !k.plan.racing; },
  update(dt, k) {
    this.t += dt;
    const p = k.pos;
    if (pending.length) { const ids = pending.splice(0); for (const id of ids) this._found(id, false); }
    if ((this.syncT -= dt) <= 0) { this.syncT = 0.5; this._sync(!this.synced); this.synced = true; }
    this._grateTick(dt, k, p);
    this._skyTick(dt, k);
    this._rings(k);
    this._ringTick(dt, k, p);
    this._office(k, p);
    if (this.cardAt && (Math.hypot(p.x - this.cardAt.x, p.z - this.cardAt.z) > 1.2 || this.t - this.cardAt.t > 16)) this._showNote(false);
  },
  spots() {
    const out = [];
    if (this.grate) out.push({ kind: 'todo', id: 'story-grate', name: 'The glowing grate (the call)', ...this.grate });
    if (this.silo) out.push({ kind: 'todo', id: 'story-rings', name: 'Rings in the snow', x: this.silo.cx, y: 0, z: this.silo.cz });
    if (this.office) out.push({ kind: 'todo', id: 'story-note', name: 'The Director’s last note', x: this.office.x0 + 5, y: this.office.y, z: (this.office.z0 + this.office.z1) / 2 + 1.2 });
    return out;
  },
  reset() { if (this.cardEl) this._showNote(false); this._closeFile(); },
  // A new game: an empty file, the mouse not yet down the grate, no marks.
  fresh(k) {
    st = { got: [], dove: false, note: false }; save();
    this.ringTold = false; this.synced = false; this.skyT = 0; this.nextFall = 7; this.marksKey = null;
    if (k && k.G.mapMarks) k.G.mapMarks = k.G.mapMarks.filter(m => !m.story);
    this.marks = []; this.dive = null;
    if (this.diver && this.grate) { this.diver.visible = true; this.diverFig.scale.setScalar(1.35); this.diver.position.set(this.grate.x - 0.18, this.grate.y + 0.012, this.grate.z); }
    if (this.cardEl) this._showNote(false);
  },
});

const SAUCER = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M10 15.5a6 5.5 0 0 1 12 0z"/><ellipse cx="16" cy="18" rx="13" ry="4" fill="currentColor"/><circle cx="9" cy="18.3" r="1.1" fill="#0e1018"/><circle cx="16" cy="19" r="1.1" fill="#0e1018"/><circle cx="23" cy="18.3" r="1.1" fill="#0e1018"/><path fill="currentColor" opacity=".45" d="M12 22h8l3 7H9z"/></svg>';
