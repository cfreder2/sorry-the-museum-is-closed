// Gallery 240: Seurat's A Sunday on La Grande Jatte comes to life while you stand and look at it. Not on the canvas:
// nothing is ever drawn on or over a painting here (the user's rule: beside it, below it or in the room, never on it).
// Little strollers of my own, made of coloured dots, dance on the gallery floor in front of it, knee-high to a person:
// three couples waltzing round, the ladies' parasols twirling, a child spinning on her own and a little dog trotting
// round them all. A waltz plays, quietly (Johann Strauss II, The Blue Danube, 1866: the first strain, made up here,
// not recorded). They come up dot by dot as you look, and go the same way when you stop.
//
// And the monkey on the lead is out of the picture again (the guard's note by the door says so: src/notes.js). A
// small monkey of my own sits under the bench in here (src/plan.js puts the bench there for it) from the start of
// every night. Drive up to it and it bolts: out of the room and away through the building, a dash at a time, always
// a little ahead, stopping to look back and chatter when you fall behind, to the Director's whiteboard (the one with
// the clue on it: src/secret.js). Find it there and it runs home; the next time you come into 240 it is sitting on
// the bench, and it runs to the picture, waits at the foot of the wall until you are looking its way, and jumps to
// the foot of the frame, under where the painted one sits, and is gone: back on its lead. Lose it for long enough and it goes back under the bench, to be chased again. It goes by
// the robots' own floor plan (src/guardplan.js), so never through a wall, a case or a bench; and like the dancers it
// is never seen in front of the canvas. The painted monkey is still the clue to the Director's passage, and still
// there to be tapped (src/secret.js, src/secretclue.js). The dancers are not solid, and only there while you look.
import * as THREE from 'three';
import { feature } from './features.js';
import { grid, path, nearestOpen } from './guardplan.js';
import { MOTIF } from './motif.js';

const rnd = (s => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646)(240);
const PAL = { navy: '#2b2f5e', orange: '#d8823a', cream: '#ecdfb4', pink: '#d77c7a', green: '#2f6b45', black: '#1e1b22', violet: '#6a4f8f', red: '#c2413a', white: '#f3eedf', ochre: '#c9a14a', brown: '#5a3a24' };
const COMP = { navy: '#d8a24a', orange: '#3b6bb5', cream: '#9a8fd0', pink: '#5f9a6a', green: '#d06a5a', black: '#3b3f7a', violet: '#c8b34a', red: '#3f9a8a', white: '#e0c87a', ochre: '#5a6fc0', brown: '#3b6bb5' };
const TAU = Math.PI * 2;
// The floor they dance on, in front of the picture: an ellipse this far along the wall and out from it (metres).
const ALONG = 1.15, OUT0 = 0.38, OUT1 = 1.2, DOT = 0.036;
const GATHER = 0.3, ease = q => (q <= 0 ? 0 : q >= 1 ? 1 : q * q * (3 - 2 * q));
const RIGID = 0, LEG_L = 1, LEG_R = 2, PARASOL = 3, TILT_C = Math.cos(0.45), TILT_S = Math.sin(0.45);
// The monkey: it bolts when the toy comes within BOLT metres; runs RUN m/s, or a third as fast again as the toy if
// that is more (so it is seen running, and is never caught), a HOP at a time, and stops to look back; goes home at
// DASH; goes on again when the toy is within NEAR; and gives the toy up after LOST seconds of it being
// more than AWAY off (further than its longest dash leaves it ahead, so a toy that is following is never 'away'), or
// twice that of waiting in one place. NEED is the room it keeps from walls and furniture, MK its size (the model is
// 21 cm tall at 1: at 1.3 it still sits under a bench seat, 37 cm clear), TALL its height.
// WATCH is how long it waits at the foot of the wall to be looked at before it jumps home anyway.
const BOLT = 1.5, NEAR = 3.4, AWAY = 18, HOP = 8, RUN = 9, DASH = 15, LOST = 45, WATCH = 12, NEED = 0.3, MK = 1.3, TALL = 0.21 * MK;
const swing = (a, b, f) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * Math.min(1, f);
// Off the bench seat (h above the floor) and down beside it, f from 0 to 1: level until it is clear of the seat's edge.
const hopDown = (h, f) => h * (1 - f * f * f) + Math.sin(f * Math.PI) * 0.15;

// A figure as dots: [x, y, z, colour, part] in metres, feet at y = 0, facing +z. Dots are scattered over each
// part's surface, as many as its area wants, so a figure reads from every side.
function figure(kind, col, H) {
  const out = [], sp = 0.0105 / H;                     // one dot to about a centimetre square of surface
  const put = (x, y, z, c, part = RIGID) => out.push([x * H, y * H, z * H, rnd() < 0.18 ? COMP[c] : PAL[c], part]);
  // A surface of revolution about the y axis, r(y) from y0 to y1 (bulge(a, y) adds to it towards angle a).
  const turn = (y0, y1, r, c, part = RIGID, ox = 0, bulge = null, oz = 0) => {
    const area = TAU * 0.5 * (r(y0) + r(y1) + 0.02) * (y1 - y0), n = Math.max(12, Math.round(area / (sp * sp)));
    for (let i = 0; i < n; i++) { const y = y0 + rnd() * (y1 - y0), a = rnd() * TAU, rr = r(y) + (bulge ? bulge(a, y) : 0); if (rr > 0) put(ox + Math.sin(a) * rr, y, oz + Math.cos(a) * rr, c, part); }
  };
  const ball = (cx, cy, cz, rad, c, sy = 1) => { const n = Math.max(10, Math.round(4 * Math.PI * rad * rad * sy / (sp * sp))); for (let i = 0; i < n; i++) { const u = rnd() * 2 - 1, a = rnd() * TAU, s = Math.sqrt(1 - u * u); put(cx + s * Math.cos(a) * rad, cy + u * rad * sy, cz + s * Math.sin(a) * rad, c); } };
  const disc = (cy, rad, c) => { const n = Math.max(8, Math.round(Math.PI * rad * rad / (sp * sp))); for (let i = 0; i < n; i++) { const rr = Math.sqrt(rnd()) * rad, a = rnd() * TAU; put(Math.sin(a) * rr, cy, Math.cos(a) * rr, c); } };
  if (kind === 'lady') {
    // The skirt, belled, with the bustle behind; the bodice; the face; a little hat.
    turn(0.01, 0.5, y => 0.075 + 0.2 * Math.pow(1 - y / 0.5, 0.75), col, RIGID, 0, (a, y) => Math.max(0, -Math.cos(a)) ** 2 * 0.11 * Math.exp(-(((y - 0.36) / 0.09) ** 2)));
    turn(0.5, 0.78, y => 0.072 - (y - 0.5) * 0.06, col);
    ball(0, 0.85, 0.005, 0.055, 'cream'); ball(0, 0.86, -0.02, 0.05, 'brown', 0.9);
    disc(0.915, 0.1, 'black'); turn(0.915, 0.96, () => 0.05, 'black');
  } else if (kind === 'man') {
    for (const s of [-1, 1]) turn(0.01, 0.42, () => 0.034, 'black', s < 0 ? LEG_L : LEG_R, s * 0.045);
    turn(0.4, 0.76, y => 0.1 - (y - 0.4) * 0.05, col, RIGID, 0, (a, y) => (Math.cos(a) < -0.3 && y < 0.5 ? 0.012 : 0));
    turn(0.28, 0.4, () => 0.085, col, RIGID, 0, a => (Math.cos(a) < -0.2 ? 0.01 : -0.2));          // the tails of the coat, behind
    ball(0, 0.82, 0.005, 0.05, 'cream');
    disc(0.875, 0.085, 'black'); turn(0.875, 1.0, () => 0.046, 'black'); disc(1.0, 0.046, 'black');
  } else if (kind === 'child') {
    turn(0.12, 0.55, y => 0.06 + 0.13 * (1 - (y - 0.12) / 0.43), col); for (const s of [-1, 1]) turn(0.01, 0.13, () => 0.025, 'cream', RIGID, s * 0.04);
    ball(0, 0.65, 0, 0.07, 'cream'); disc(0.71, 0.12, 'ochre'); turn(0.71, 0.76, () => 0.065, 'ochre');
  } else if (kind === 'dog') {        // (H is the dog's length)
    ball(0, 0.42, 0, 0.16, 'black'); for (let i = 0; i < 70; i++) { const z = (rnd() - 0.5) * 0.62, a = rnd() * TAU, r = 0.13 * Math.sqrt(1 - (2 * z / 0.7) ** 2); put(Math.sin(a) * r, 0.42 + Math.cos(a) * r * 0.9, z, 'black'); }
    ball(0, 0.58, 0.36, 0.1, 'black'); ball(0, 0.54, 0.47, 0.05, 'black');
    for (const [x, z] of [[-0.07, 0.2], [0.07, 0.2], [-0.07, -0.22], [0.07, -0.22]]) turn(0.01, 0.32, () => 0.03, 'black', (z > 0) === (x > 0) ? LEG_L : LEG_R, x, null, z);      // trotting: diagonal pairs together
    for (let i = 0; i < 14; i++) { const f = i / 13; put(0, 0.5 + f * 0.25, -0.3 - f * 0.12 + f * f * 0.05, 'black'); }        // the tail, up
  }
  return out;
}
// A parasol, in its own frame: the canopy round the y axis, its gores in two colours; the shaft down to the hand.
function parasol(cols, R) {
  const out = [], n = 150;
  for (let i = 0; i < n; i++) {
    const rr = Math.sqrt(rnd()), a = rnd() * TAU, gore = Math.floor((a / TAU) * 8) % 2;
    out.push([Math.sin(a) * rr * R, (1 - rr * rr) * R * 0.45, Math.cos(a) * rr * R, rnd() < 0.15 ? COMP[cols[gore]] : PAL[cols[gore]], PARASOL]);
  }
  for (let i = 0; i < 12; i++) out.push([0, -i * R * 0.12, 0, PAL.brown, PARASOL]);
  return out;
}
// A round, soft-edged dot.
function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, '#fff'); gr.addColorStop(0.7, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(16, 16, 16, 0, TAU); g.fill();
  const t = new THREE.CanvasTexture(c); return t;
}

feature({
  id: 'l2-grande-jatte',
  secrets: [['monkey', 'The monkey off its lead']],
  init(k) {
    this.k = k;
    const art = this.art = k.museum.arts.find(a => a.work.id === 27992) || k.museum.arts.find(a => /^A Sunday on La Grande Jatte/.test(a.work.t || ''));
    if (!art || art.work.c || art.nx == null) { this.art = null; return; }
    this.roomId = art.room; const room = k.plan.byId[art.room];
    this.y = room.y;
    // The floor in front of it, framed with the picture while you look (main.js, studyCam).
    art.floorFrame = { y: room.y, out: OUT1 + 0.15, half: ALONG + 0.25 };
    // Along the wall (t) and out from it (n): the dance floor's middle.
    this.tx = Math.cos(art.rot); this.tz = -Math.sin(art.rot);
    this.cx = art.x + art.nx * (OUT0 + OUT1) / 2; this.cz = art.z + art.nz * (OUT0 + OUT1) / 2; this.B = (OUT1 - OUT0) / 2;
    // The dancers: three couples, a child, the dog. Each a figure index into this.figs.
    this.figs = []; const pts = [];
    const add = (kind, col, H, extra = {}) => { const i = this.figs.length; this.figs.push({ kind, H, x: 0, z: 0, yaw: 0, bob: 0, leg: 0, spin: rnd() * TAU, ...extra }); for (const d of figure(kind, col, H)) pts.push([...d, i]); return i; };
    const COUPLES = [['navy', 'black', ['orange', 'cream']], ['pink', 'navy', ['white', 'red']], ['violet', 'black', ['cream', 'green']]];
    this.couples = COUPLES.map(([lc, mc, pc], c) => {
      const lady = add('lady', lc, 0.34 + rnd() * 0.03), man = add('man', mc, 0.38 + rnd() * 0.03);
      for (const d of parasol(pc, 0.11)) pts.push([...d, lady]);
      return { lady, man, th: c * TAU / 3 + 0.4, turn: rnd() * TAU, dir: 1 };
    });
    this.child = add('child', 'white', 0.24);
    this.dog = add('dog', 'black', 0.26);
    // Shuffled, so that they come up (and go) a dot at a time all over, as a pointillist would lay them on.
    for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
    const N = this.N = pts.length, col = new Float32Array(N * 3), c = new THREE.Color();
    this.local = new Float32Array(N * 3); this.fig = new Uint8Array(N); this.part = new Uint8Array(N);
    pts.forEach(([x, y, z, hex, part, f], i) => { this.local.set([x, y, z], i * 3); this.fig[i] = f; this.part[i] = part; c.set(hex).multiplyScalar(0.82); col.set([c.r, c.g, c.b], i * 3); });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setDrawRange(0, 0);
    const pm = new THREE.Points(geo, new THREE.PointsMaterial({ size: DOT, sizeAttenuation: true, vertexColors: true, map: dotTexture(), alphaTest: 0.5, transparent: false }));
    pm.frustumCulled = false; pm.visible = false; pm.name = 'grande-jatte-dancers'; k.group.add(pm); this.dots = pm;
    // Out of the picture, never across it. Each dot gathers from the frame (in front of its bottom rail, or of the foot
    // of a side rail, then down that rail), and they make up the figures in a row in the air just under the frame,
    // heads below the rail; then the figures hop down to the floor. Stop looking and it all runs backwards.
    // Every point on the way is below the canvas or outside its sides, and nearer the room than the frame, so
    // seen from the eye height of a look (above them all) nothing ever crosses the picture.
    const cb = art.y - art.h / 2, fw = Math.max(0.05, art.frame || 0.1), rail = cb - fw;      // the foot of the canvas; the bottom of the frame's rail
    this.src = new Float32Array(N * 3); this.via = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      let u, y, out = 0.09 + rnd() * 0.04, vy;
      if (rnd() < 0.75) { u = (rnd() - 0.5) * art.w; y = cb - fw * (0.2 + rnd() * 0.6); vy = rail - 0.03; }                  // the bottom rail
      else { const s = rnd() < 0.5 ? -1 : 1; u = s * (art.w / 2 + fw * (0.2 + rnd() * 0.6)); y = cb + rnd() * art.h * 0.12; vy = rail - 0.04; }      // the foot of a side rail, and down it
      this.src.set([art.x + this.tx * u + art.nx * out, y, art.z + this.tz * u + art.nz * out], i * 3);
      this.via.set([art.x + this.tx * u + art.nx * (out + 0.04), vy, art.z + this.tz * u + art.nz * (out + 0.04)], i * 3);
    }
    // The row under the frame: each figure's place, its feet low enough that its top (a parasol's, too) stays under the rail.
    this.figs.forEach((f, i, all) => {
      let top = 0; for (let j = 0; j < N; j++) if (this.fig[j] === i && this.part[j] !== PARASOL) top = Math.max(top, this.local[j * 3 + 1]);
      if (f.kind === 'lady') top = Math.max(top, 0.75 * f.H + 0.15 * TILT_C + 0.06);
      const u = ((i + 0.5) / all.length - 0.5) * art.w * 0.85;
      f.form = { x: art.x + this.tx * u + art.nx * 0.2, y: Math.max(room.y, rail - 0.03 - top), z: art.z + this.tz * u + art.nz * 0.2, yaw: Math.atan2(art.nx, art.nz) };
      f.delay = 0.05 * i / all.length;
    });
    // The monkey of my own: brown, a red collar, a curl of a tail. (Its own glow, as the robots have: no lamp is added for it.)
    const mk = this.monkey = new THREE.Group(), fur = new THREE.MeshLambertMaterial({ color: 0x6b4426, emissive: 0x3a2412 }), face = new THREE.MeshLambertMaterial({ color: 0xd6b48a, emissive: 0x6a5238 });
    const ball = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat); b.position.set(x, y, z); b.scale.set(sx, sy, sz); mk.add(b); return b; };
    ball(0.06, fur, 0, 0.07, 0, 1, 1.2, 0.9); ball(0.045, fur, 0, 0.16, 0.01); ball(0.03, face, 0, 0.155, 0.04, 1, 0.8, 0.6);
    for (const sx of [-1, 1]) { ball(0.016, face, sx * 0.042, 0.175, 0.005); ball(0.018, fur, sx * 0.05, 0.03, 0.02, 0.8, 1.4, 0.8); }
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 14), new THREE.MeshLambertMaterial({ color: 0xc0392b, emissive: 0x5a1010 })); collar.position.set(0, 0.12, 0.005); collar.rotation.x = Math.PI / 2; mk.add(collar);
    const tail = this.tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.04, -0.05), new THREE.Vector3(0, 0.02, -0.13), new THREE.Vector3(0, 0.1, -0.17), new THREE.Vector3(0, 0.14, -0.12)]), 12, 0.008, 5), fur);
    // always: it leaves the room, so the streamer (src/stream.js, on a phone) must not go by where it was built.
    // Without this it was hidden for the far end of the chase, from 85 m off its bench: the whiteboard is 105 m off.
    mk.add(tail); mk.rotation.order = 'YXZ'; mk.name = 'grande-jatte-monkey'; mk.userData.always = true; k.group.add(mk);
    // Where it lives while it is out: under the bench the plan put in this room for it, a little to the room's side of
    // the middle of the seat, in its shadow; and, later, on the seat. (No bench: the corner away from the Director's door.)
    const b = this.bench = k.plan.benches.find(q => q.room === room.id) || null, mx = (room.x0 + room.x1) / 2, mz = (room.z0 + room.z1) / 2;
    this.home = b ? { x: b.x + (b.alongX ? 0 : Math.sign(mx - b.x) * 0.1), y: room.y, z: b.z + (b.alongX ? Math.sign(mz - b.z) * 0.1 : 0) } : { x: room.x1 - 0.35, y: room.y, z: room.z0 + 0.35 };
    this.seat = b ? { x: b.x, y: room.y + 0.5, z: b.z } : this.home;
    this.buf = new Float32Array(512); this.K = new Float32Array(12); this.q = new THREE.Vector3(); this.fade = 0; this.t = 0;
    this.trail = null; this.charted = false; this.grid = null; this.clock = 0;
    this.hide();
    this.wz = null;    // the waltz
  },
  // (The monkey may be anywhere between here and the Director's office: it is moved wherever the toy is.)
  active(k) { return !!this.art && (k.inRoom(this.roomId, 2) || this.fade > 0.001 || (this.state !== 'bench' && this.state !== 'seat' && this.state !== 'back')); },
  update(dt, k) {
    const looking = k.looking === this.art, g = this.game;
    if (!looking) this.gone = false;
    // How far out of the picture they are: 0 not at all, 0.3 every dot gathered, 0.45 the figures made, 0.75 all on the floor.
    // (They wait for the camera to come to rest in front of the picture: seen swinging past at a slant, a dot in front of
    // the frame could seem to cross the canvas.) In the monkey's show (src/secretgame.js) they come out quicker, and go back
    // into the picture at the end of it; and stay there while the wall turns.
    const settled = looking && k.G.study && k.G.study.t > 1.6;
    if (g) this.fade = Math.max(0, Math.min(1, this.fade + (g.phase === 'home' ? -dt / (0.8 * g.slow) : settled || this.fade > 0 ? dt / (1.4 * g.slow) : 0)));
    else this.fade = Math.max(0, Math.min(1, this.fade + (settled && !this.gone ? dt / 3.4 : looking && !this.gone ? 0 : -dt / 1.8)));
    const show = Math.min(this.N, Math.ceil(this.N * this.fade / GATHER));
    this.dots.visible = show > 0; this.dots.geometry.setDrawRange(0, show);
    if (show > 0) { this.t += dt; this.dance(dt, k, show); }
    this.waltz(k, looking && !this.gone);
    if (g || this.gstate) this.apeShow(dt, k); else this.ape(dt, k);
  },

  // ---------------------------------------------------------------- the monkey
  // Under the bench, as at the start of every night; and after it has given the toy up (wary: then it will not bolt
  // again until the toy has been away from the bench, or a few seconds have gone by).
  hide(wary) {
    const m = this.monkey, h = this.home;
    this.state = 'bench'; this.lost = 0; this.rest = 0; this.chat = 3; this.seen = 0; this.go = false; this.wary = wary ? 4 : 0;
    m.position.set(h.x, h.y, h.z); m.rotation.set(0, 0, 0); m.scale.setScalar(MK); m.visible = true;
  },
  // What it does this frame.
  //   bench   under the bench, watching the toy: tail going, a chatter now and then. The toy within BOLT: it bolts.
  //   run     on the way to the whiteboard: a dash, then a stop to look back until the toy is near again.
  //   board   under the whiteboard, hopping, until the toy comes up to it: found.
  //   show    looking up at the board for a few seconds; then
  //   home    back the way it came, flat out: to hop onto the bench (found) or go under it again (it gave the toy up).
  //   up      the hop onto the seat.            seat    sitting there until the toy next comes into the room.
  //   toart   down, and across to the picture.  foot    at the foot of the wall there, until it is being looked at.
  //   leap    the jump to the foot of the frame.
  //   hang    hanging there a moment, and gone. back    on its lead in the picture, for the rest of the night.
  ape(dt, k) {
    const m = this.monkey, G = k.G, st = this.state;
    if (st === 'back') { m.visible = false; return; }
    const y0 = this.y, calm = !!(G.set && G.set.reduce), tt = (this.clock += dt), p = k.pos, v = k.v;
    const gap = Math.hypot(p.x - m.position.x, p.z - m.position.z), level = Math.abs(p.y - y0) < 4.5, play = G.state === 'play' && !G.racing && Math.abs(p.y - y0) < 1.6;      // (play: down at its height, too, not a drone up at the ceiling)
    const face = (x, z, rate) => { m.rotation.y = swing(m.rotation.y, Math.atan2(x - m.position.x, z - m.position.z), rate * dt); };
    this.tail.rotation.y = Math.sin(tt * 3) * 0.4 + (!calm && Math.sin(tt * 0.9) > 0.9 ? Math.sin(tt * 24) * 0.45 : 0);      // its tail swings, and now and then flicks
    if (st === 'bench') {
      const h = this.home; m.position.set(h.x, h.y + Math.abs(Math.sin(tt * 2.2)) * 0.006, h.z); m.rotation.x = 0; face(p.x, p.z, 5);
      if (k.inRoom(this.roomId) && G.state === 'play' && (this.chat -= dt) < 0) { this.chat = 5 + Math.random() * 5; this.chatter(k, 0.014); }      // (it keeps quiet while a picture is looked at: the waltz)
      if (this.wary > 0) this.wary = gap > 2.5 ? 0 : this.wary - dt; else if (play && level && gap < BOLT) this.bolt(k);
    } else if (st === 'run') {
      if (this.go) {
        // A dash: quicker than the toy whatever the toy is, so it is in front again by the time it stops.
        const sp = v && v.vel ? Math.hypot(v.vel.x, v.vel.z) : 0;
        this.s = Math.min(this.to, this.s + Math.max(RUN, sp * 1.35 + 2) * dt); this.pose(dt, k, 1, this.trail); this.patter(dt, k, gap);
        if (this.s >= this.to - 1e-3) { this.go = false; this.rest = 0; this.chat = 0.9; if (this.to >= this.trail.len - 1e-3) this.state = 'board'; }
      } else {
        // Stopped, looking back. On again as soon as the toy is close (at once, if it is nearly on top of it).
        this.rest += dt; m.position.y = y0 + this.fidget(dt, calm); m.rotation.x = 0; face(p.x, p.z, 12);
        if (level && gap < NEAR && this.rest > (gap < 2 ? 0 : 0.15)) this.dash(); else this.wait(dt, k, level ? gap : 99);
      }
    } else if (st === 'board') {
      // Under the whiteboard, hopping, looking round for the toy.
      this.rest += dt; m.position.y = y0 + Math.abs(Math.sin(tt * 7)) * (calm ? 0.025 : 0.07); m.rotation.x = 0; face(p.x, p.z, 12);
      if (play && level && gap < 2.4) {
        this.state = 'show'; this.rest = 0; this.chatter(k, 0.03);
        if (k.find('monkey')) k.callout('THE MONKEY');
        k.say('It chatters, and looks up at the whiteboard.', 0, 5, true);
      } else this.wait(dt, k, level ? gap : 99);
    } else if (st === 'show') {
      // It turns to the board and looks up at it; one more hop; and then it is off home.
      const bd = this.trail.board; this.rest += dt; face(bd.x, bd.z, 9);
      m.rotation.x += (-0.5 - m.rotation.x) * Math.min(1, dt * 6); m.position.y = y0 + (this.rest > 1.6 && this.rest < 1.95 ? Math.sin((this.rest - 1.6) / 0.35 * Math.PI) * (calm ? 0.03 : 0.09) : 0);
      if (this.rest > 3.4) { this.state = 'home'; this.then = 'seat'; this.said = false; }
    } else if (st === 'home') {
      const W = this.trail, end = this.then === 'seat' ? W.cum[1] : 0;
      this.s = Math.max(end, this.s - DASH * dt); this.pose(dt, k, -1, W); this.patter(dt, k, gap);
      if (this.then === 'seat' && !this.said && this.s < W.gone) { this.said = true; k.say('It has gone home to its picture.', 0, 4, true); }
      if (this.s <= end + 1e-3) { if (this.then === 'seat') { this.state = 'up'; this.rest = 0; } else this.hide(true); }
    } else if (st === 'up') {
      // From beside the bench up onto the seat.
      const W = this.trail, s = this.seat, f = Math.min(1, (this.rest += dt) / 0.34), ax = W.p[2], az = W.p[3];
      m.position.set(ax + (s.x - ax) * f, y0 + hopDown(s.y - y0, 1 - f), az + (s.z - az) * f); m.rotation.x = 0; face(s.x + (s.x - ax), s.z + (s.z - az), 20);
      if (f >= 1) { this.state = 'seat'; this.seen = 0; }
    } else if (st === 'seat') {
      // Sitting on the bench. The toy comes into the room: it sees it, chatters, hops once, and is off to its picture.
      const s = this.seat; m.position.set(s.x, s.y, s.z); m.rotation.x = 0;
      if (k.inRoom(this.roomId) && (G.state === 'play' || G.state === 'study')) {
        face(p.x, p.z, 8); if (!this.seen) this.chatter(k, 0.03);
        if ((this.seen += dt) > 0.35 && this.seen < 0.7) m.position.y = s.y + Math.sin((this.seen - 0.35) / 0.35 * Math.PI) * (calm ? 0.025 : 0.06);
        if (this.seen > 1.2) this.toArt(k, true);
      } else { this.seen = 0; face(this.art.x, this.art.z, 3); }
    } else if (st === 'toart') {
      const W = this.homing, c1 = W.cum[1];
      this.s = Math.min(W.len, this.s + (this.s < c1 ? 3.2 : 6) * dt); this.pose(dt, k, 1, W); this.patter(dt, k, gap);
      if (this.s < c1 && this.drop) m.position.y = y0 + hopDown(this.drop, this.s / c1);
      if (this.s >= W.len - 1e-3) { this.state = 'foot'; this.rest = 0; this.seen = 0; this.chat = 0.5; }
    } else if (st === 'foot') {
      // At the foot of the wall, under its place: hopping and chattering there until it is on the screen (for half a
      // second: a toy driven up to the bench has its back to the picture, and the jump was over before it had turned
      // round), or it has waited WATCH seconds. Then the jump.
      this.rest += dt; m.position.y = y0 + Math.abs(Math.sin(tt * 7)) * (calm ? 0.025 : 0.07); m.rotation.x = 0; face(p.x, p.z, 12);
      if (G.state === 'play' && (this.chat -= dt) < 0) { this.chat = 1.8; this.chatter(k, 0.03); }
      this.seen = m.visible && this.onScreen(k) ? this.seen + dt : 0;
      if (this.seen > 0.5 || this.rest > WATCH) { this.state = 'leap'; this.rest = 0; this.lx = m.position.x; this.lz = m.position.z; }
    } else if (st === 'leap') {
      // Up to the foot of the frame: rising all the way and never above where it will hang, its head under the rail.
      const F = this.from, a = this.art, f = Math.min(1, (this.rest += dt) / 0.42);
      m.position.set(this.lx + (F.x - this.lx) * f, y0 + (F.y - y0) * Math.sin(f * Math.PI / 2), this.lz + (F.z - this.lz) * f); m.rotation.x = 0;
      m.rotation.y = swing(m.rotation.y, Math.atan2(-a.nx, -a.nz), 20 * dt);
      if (f >= 1) { this.state = 'hang'; this.rest = 0; this.chatter(k, 0.025); }
    } else if (st === 'hang') {
      // It hangs there by its hands, its back to the room and its tail going, and is gone (smaller and smaller, up
      // against the rail it hangs from: into the foot of the frame, not onto the picture).
      const F = this.from, sc = Math.max(0.02, 1 - Math.max(0, (this.rest += dt) - 0.55) / 0.35);
      m.scale.setScalar(MK * sc); m.position.set(F.x, F.y + TALL * (1 - sc), F.z);
      if (this.rest > 0.9) {
        this.state = 'back'; m.visible = false; m.scale.setScalar(MK);
        k.synth.chime([2349, 1976, 1568], { gap: 0.07, dur: 0.3, vol: 0.04 }); k.say('Back on its lead.', 0, 4, true);
        return;
      }
    }
    m.visible = !this.over(k);
  },
  // Out from under the bench, and away. (No whiteboard to lead to, or no level way there: straight back to its picture.)
  // What is said about it, here and below, is said at once and not in its turn (k.say's last argument): each line is
  // about what is on the screen this moment, and behind a few hints in the queue it came up after the monkey had gone.
  bolt(k) {
    const W = this.chart(k);
    k.synth.chime([1568, 1976, 2349], { gap: 0.07, dur: 0.3, vol: 0.04 });
    if (!W) { if (k.find('monkey')) k.callout('THE MONKEY'); this.toArt(k, false); return; }
    this.state = 'run'; this.s = 0; this.lost = 0; this.told = false; this.dash();
    k.say('The monkey bolts from under the bench. After it.', 0, 3.5, true);
  },
  // Its next dash: a HOP along the way, or to just through the next doorway if that is about as far; the last one all the way.
  dash() {
    const W = this.trail; let to = Math.min(W.len, this.s + HOP);
    for (const d of W.stops) if (d > this.s + 1.5 && d < this.s + HOP * 1.6) { to = d; break; }
    this.to = W.len - to < 2.5 ? W.len : to; this.go = true;
  },
  // Stopped, and the toy is not coming: it chatters to be heard (less and less often; not while a picture is being
  // looked at), with a little hop; and after LOST seconds with the toy a long way off, or twice that of waiting here
  // at all, it gives the toy up, and goes home under its bench to be found again.
  wait(dt, k, gap) {
    this.lost = gap > AWAY ? this.lost + dt : 0;
    if (this.rest > 0.8 && (this.chat -= dt) < 0 && k.G.state === 'play') { this.chat = Math.min(8, 2.4 + this.rest * 0.15); this.chatter(k, 0.03 * Math.max(0.25, 1 - gap / 30)); this.hopT = 0.3; }
    if (!this.told && this.rest > 2.5 && this.state === 'run') { this.told = true; k.say('The monkey has stopped to wait for you. It is chattering.', 0, 4, true); }
    if (this.lost > LOST || this.rest > LOST * 2) { this.state = 'home'; this.then = 'bench'; k.say('The monkey has given you up. It will be back under its bench.', 0, 5, true); }
  },
  fidget(dt, calm) { if (!(this.hopT > 0)) return 0; this.hopT -= dt; return Math.sin(Math.max(0, this.hopT) / 0.3 * Math.PI) * (calm ? 0.02 : 0.05); },
  chatter(k, vol) { for (let i = 0; i < 4; i++) k.synth.note(1400 + i * 260, 0.08, { type: 'square', vol, at: i * 0.07 }); },
  patter(dt, k, gap) { if ((this.pat = (this.pat || 0) - dt) < 0 && gap < 12) { this.pat = 0.11; k.synth.noise(0.03, { vol: 0.016 * (1 - gap / 12), lp: 3000 }); } },
  // Stand it on a way, this.s metres along: bounding (a bound to about 0.8 m; a small one if motion is to be reduced; none
  // while it is still under the seat), leaning into it, turned the way it goes (dir -1: back along the way).
  pose(dt, k, dir, W) {
    const p = W.p, c = W.cum, n = c.length, s = this.s, m = this.monkey, calm = k.G.set && k.G.set.reduce;
    let i = Math.min(W.i || 0, n - 2); while (i < n - 2 && c[i + 1] < s) i++; while (i > 0 && c[i] > s) i--; W.i = i;
    const L = c[i + 1] - c[i], f = L > 1e-6 ? Math.max(0, Math.min(1, (s - c[i]) / L)) : 0, clear = W.under ? Math.max(0, Math.min(1, (s - c[1]) / 0.6)) : 1;
    m.position.set(p[i * 2] + (p[i * 2 + 2] - p[i * 2]) * f, this.y + Math.abs(Math.sin(s * 3.9)) * (calm ? 0.03 : 0.09) * clear, p[i * 2 + 1] + (p[i * 2 + 3] - p[i * 2 + 1]) * f);
    m.rotation.x = calm ? 0.1 : 0.3; if (L > 1e-6) m.rotation.y = swing(m.rotation.y, Math.atan2((p[i * 2 + 2] - p[i * 2]) * dir, (p[i * 2 + 3] - p[i * 2 + 1]) * dir), 24 * dt);
  },
  // A way over the robots' own floor plan (src/guardplan.js): open cells and clear lines only, so never through a wall, a
  // case or a bench. From a (which may be under or on the bench: its first step is then straight out to the open floor
  // beside it) to the open floor nearest b. { p: [x, z, ...], cum: metres along at each point, len }, or null.
  route(g, ax, az, bx, bz, under) {
    const spot = (x, z) => { const c = nearestOpen(g, x, z, NEED, 1.8); return c < 0 ? null : [g.X0 + ((c % g.nx) + 0.5) * g.C, g.Z0 + (Math.floor(c / g.nx) + 0.5) * g.C]; };
    const A = spot(ax, az), B = spot(bx, bz), n = A && B ? path(g, A[0], A[1], B[0], B[1], this.buf, NEED) : 0;
    if (!n) return null;
    const p = [ax, az], cum = [0]; for (let i = 0; i < n; i++) p.push(this.buf[i * 2], this.buf[i * 2 + 1]);
    for (let i = 1; i < p.length / 2; i++) cum.push(cum[i - 1] + Math.hypot(p[i * 2] - p[i * 2 - 2], p[i * 2 + 1] - p[i * 2 - 1]));
    return { p, cum, len: cum[cum.length - 1], under: !!under, i: 0 };
  },
  // The way to the Director's whiteboard, worked out once, the first time it bolts: the rooms between here and there
  // through level doorways a toy can use too (no stairs, no vents, not the hidden door: the robots' own rule,
  // src/guardplan.js), then the way across their floors, to the floor under the board.
  chart(k) {
    if (this.charted) return this.trail; this.charted = true;
    const P = k.plan, y = this.y, bd = k.G.boards && k.G.boards.byId && k.G.boards.byId.clue, flat = r => r && !r.secret && Math.abs(r.y - y) < 0.06;
    if (!bd || !flat(P.byId[bd.room])) return null;
    const ok = d => !d.out && d.b !== 'out' && !d.vent && !d.hidden && !d.shut && d.h >= 1.3 && Math.abs(d.y - y) < 0.06 && flat(P.byId[d.a]) && flat(P.byId[d.b]);
    const prev = new Map([[this.roomId, null]]), q = [this.roomId];
    while (q.length && !prev.has(bd.room)) { const id = q.shift(); for (const d of P.doorsOf(id)) if (ok(d)) { const n = d.a === id ? d.b : d.a; if (!prev.has(n)) { prev.set(n, [id, d]); q.push(n); } } }
    if (!prev.has(bd.room)) return null;
    const rooms = [], doors = []; for (let id = bd.room; id;) { rooms.unshift(id); const pr = prev.get(id); if (pr) doors.unshift(pr[1]); id = pr && pr[0]; }
    const g = this.grid = grid(P, rooms, y), W = this.route(g, this.home.x, this.home.z, bd.x + (bd.fx || 0) * 0.42, bd.z + (bd.fz || 0) * 0.42, !!this.bench);
    if (!W) return null;
    // Where it stops to look back whatever the toy is doing: just through each doorway on the way. And where, going home, it is out of the office and gone.
    const at = (x, z) => { let best = 0, bd2 = Infinity; for (let i = 0; i < W.cum.length - 1; i++) { const x0 = W.p[i * 2], z0 = W.p[i * 2 + 1], dx = W.p[i * 2 + 2] - x0, dz = W.p[i * 2 + 3] - z0, L2 = dx * dx + dz * dz, f = L2 > 0 ? Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / L2)) : 0, d2 = (x0 + dx * f - x) ** 2 + (z0 + dz * f - z) ** 2; if (d2 < bd2) { bd2 = d2; best = W.cum[i] + Math.sqrt(L2) * f; } } return best; };
    W.stops = doors.map(d => at((d.x0 + d.x1) / 2, (d.z0 + d.z1) / 2) + (d.along === 'x' ? d.x1 - d.x0 : d.z1 - d.z0) / 2 + 0.9).filter(s => s < W.len - 2.5);
    W.gone = W.stops.length ? W.stops[W.stops.length - 1] - 2.4 : W.len - 6; W.board = bd; W.rooms = rooms;
    return this.trail = W;
  },
  // Where it hangs from the foot of the frame, under where the painted one sits: out from the wall, its head a little
  // under the frame's bottom rail. Below the picture, never on it.
  perch(k) {
    const a = this.art, S = k.G.secret, R = S && S.clue && S.clue.work.id === a.work.id && S.clue.rect ? S.clue.rect : [0.685, 0.755, 0.805, 0.9], u = (R[0] + R[2]) / 2 - 0.5;
    return { x: a.x + this.tx * u * a.w + a.nx * 0.14, y: a.y - a.h / 2 - Math.max(0.05, a.frame || 0.1) - 0.06 - TALL, z: a.z + this.tz * u * a.w + a.nz * 0.14 };
  },
  // Back to its picture: off the bench (or out from under it), across the floor to under where the painted one sits; then the jump.
  toArt(k, seat) {
    const a = this.art, F = this.from = this.perch(k), o = seat ? this.seat : this.home, bx = F.x + a.nx * 0.4, bz = F.z + a.nz * 0.4;
    const g = this.grid || (this.grid = grid(k.plan, [this.roomId], this.y));
    this.homing = this.route(g, o.x, o.z, bx, bz, !seat && !!this.bench) || { p: [o.x, o.z, o.x, o.z, bx, bz], cum: [0, 0, Math.hypot(bx - o.x, bz - o.z)], len: Math.hypot(bx - o.x, bz - o.z), under: false, i: 0 };
    this.state = 'toart'; this.s = 0; this.drop = seat ? this.seat.y - this.y : 0;
  },
  // Is it on the screen just now, and near enough to be made out? (As the last frame was drawn.)
  onScreen(k) {
    const cam = k.G.camera, m = this.monkey; if (!cam) return true;
    const q = this.q.set(m.position.x, m.position.y + TALL / 2, m.position.z);
    if (q.distanceTo(cam.position) > 14) return false;
    q.project(cam); return Math.abs(q.x) < 0.85 && Math.abs(q.y) < 0.85 && q.z < 1;
  },
  // The dancers' guarantee, for the monkey. Would any of it be seen in front of the canvas from where the camera is just
  // now? Three balls hold all of it (its body and feet; its head; its tail, wherever that has swung to; all bigger when
  // it leans): is any inside the pyramid from the eye to the canvas's four corners (and a little to spare)? If so it
  // is not drawn this frame. Its way to the frame keeps
  // below the rail in any case; this is for a camera down on the floor, looking up past it.
  over(k) {
    const G = k.G, a = this.art, m = this.monkey, c = G.camera && G.camera.position; if (!c) return false;
    // (The eye is where this frame will be drawn from: the camera is in place by now, but a test's eye or a film's is put there later, src/main.js.)
    const te = G.testEye, ce = !te && G.cineEye && G.state === 'play' ? G.cineEye.at : null, ex = te ? te.at[0] : ce ? ce.x : c.x, ey = te ? te.at[1] : ce ? ce.y : c.y, ez = te ? te.at[2] : ce ? ce.z : c.z;
    if ((ex - a.x) * a.nx + (ez - a.z) * a.nz < 0.02) return false;                  // the eye is behind the wall (it is not, ever)
    const K = this.K, hw = a.w / 2 + 0.03, hh = a.h / 2 + 0.03, sc = m.scale.x, cy = Math.cos(m.rotation.y), sy = Math.sin(m.rotation.y), lean = Math.abs(m.rotation.x) * 0.22, tw = m.rotation.y + this.tail.rotation.y;
    for (let i = 0; i < 4; i++) { const su = i === 0 || i === 3 ? -1 : 1, sv = i < 2 ? -1 : 1; K[i * 3] = a.x + this.tx * hw * su - ex; K[i * 3 + 1] = a.y + hh * sv - ey; K[i * 3 + 2] = a.z + this.tz * hw * su - ez; }
    const ox = a.x - ex, oy = a.y - ey, oz = a.z - ez;
    for (let b = 0; b < 3; b++) {
      const by = b === 1 ? 0.16 : b ? 0.08 : 0.07, bz = b === 1 ? 0.012 : b ? -0.115 : 0, r = ((b === 1 ? 0.063 : b ? 0.078 : 0.092) + lean) * sc, s1 = b === 2 ? Math.sin(tw) : sy, c1 = b === 2 ? Math.cos(tw) : cy;
      const px = m.position.x + s1 * bz * sc - ex, py = m.position.y + by * sc - ey, pz = m.position.z + c1 * bz * sc - ez; let inside = true;
      for (let i = 0; i < 4 && inside; i++) {
        const j = (i + 1) % 4, ax = K[i * 3], ay = K[i * 3 + 1], az = K[i * 3 + 2], bx = K[j * 3], bY = K[j * 3 + 1], bZ = K[j * 3 + 2];
        const nx = ay * bZ - az * bY, ny = az * bx - ax * bZ, nz = ax * bY - ay * bx, L = Math.hypot(nx, ny, nz) || 1, way = nx * ox + ny * oy + nz * oz < 0 ? -1 : 1;
        if ((nx * px + ny * py + nz * pz) / L * way < -r) inside = false;
      }
      if (inside) return true;
    }
    return false;
  },
  // Where everyone is this frame, and then the dots that are showing, moved to match.
  dance(dt, k, show) {
    if (this.game) { this.poses(dt, k); this.place(k, show); return; }
    const F = this.figs, B = 0.36, z = this.wz, c = k.sound && k.sound.ctx;
    // The beat: the waltz's own when it is playing, so the steps fall on it; else a clock of our own.
    const beat = z && c ? (c.currentTime - z.t0) / B : this.t / B, bar = beat / 3, ph = bar - Math.floor(bar);
    const rise = 0.5 - 0.5 * Math.cos(Math.min(1, ph * 1.5) * Math.PI) * (ph < 0.67 ? 1 : 1 - (ph - 0.67) * 3);      // down on one, up through two and three
    const tx = this.tx, tz = this.tz, nx = this.art.nx, nz = this.art.nz, ALx = ALONG, Bn = this.B;
    const at = (th, s = 1, o = 0) => ({ x: this.cx + tx * Math.cos(th) * ALx * s + nx * Math.sin(th) * (Bn * s + o), z: this.cz + tz * Math.cos(th) * ALx * s + nz * Math.sin(th) * (Bn * s + o) });
    for (const C of this.couples) {
      C.th += dt * 0.034 * TAU; C.turn -= dt * TAU / (6 * B);           // round the floor, and a full turn every two bars
      const p = at(C.th), half = 0.075;
      const L = F[C.lady], M = F[C.man], ox = Math.cos(C.turn) * half, oz = Math.sin(C.turn) * half;
      L.x = p.x + ox; L.z = p.z + oz; M.x = p.x - ox; M.z = p.z - oz;
      L.yaw = Math.atan2(M.x - L.x, M.z - L.z); M.yaw = L.yaw + Math.PI;
      L.bob = M.bob = rise * 0.012; M.leg = Math.sin(beat * Math.PI) * 0.28; L.spin += dt * 2.6;
    }
    const ch = F[this.child]; ch.x = this.cx; ch.z = this.cz; ch.yaw = -this.t * 2.2; ch.bob = rise * 0.01;
    const dg = F[this.dog], dth = this.t * 0.16 * TAU, dp = at(dth, 1.18, 0.05), dn = at(dth + 0.05, 1.18, 0.05);
    dg.x = dp.x; dg.z = dp.z; dg.yaw = Math.atan2(dn.x - dp.x, dn.z - dp.z); dg.bob = Math.abs(Math.sin(this.t * 14)) * 0.012; dg.leg = Math.sin(this.t * 14) * 0.5;
    this.place(k, show);
  },
  // Each figure from its place in the row under the frame down to the floor: a hop out and down; then the dots that are
  // showing, moved to match.
  place(k, show) {
    const F = this.figs, tx = this.tx, tz = this.tz, nx = this.art.nx, nz = this.art.nz;
    const E = this.fade, y0 = this.y + 0.004;
    for (const f of F) {
      const h = Math.max(0, Math.min(1, (E - 0.45 - f.delay) / 0.25)), eh = h * h * (3 - 2 * h), Q = f.form;
      f.x = Q.x + (f.x - Q.x) * eh; f.z = Q.z + (f.z - Q.z) * eh; f.y = Q.y + (y0 - Q.y) * h * h;
      f.yaw = Q.yaw + Math.atan2(Math.sin(f.yaw - Q.yaw), Math.cos(f.yaw - Q.yaw)) * eh; f.bob *= h; f.leg *= h;
      f.c = Math.cos(f.yaw); f.s = Math.sin(f.yaw); f.pc = Math.cos(f.spin); f.ps = Math.sin(f.spin);
      f.tc = Math.cos(f.tilt || 0); f.ts = Math.sin(f.tilt || 0); f.rc = Math.cos(f.roll || 0); f.rs = Math.sin(f.roll || 0);      // (a bow, a stumble: about the feet)
    }
    const P = this.dots.geometry.attributes.position, a = P.array, l = this.local, S = this.src, V = this.via;
    // And the guarantee: a dot that, from wherever the camera is just now, would be seen in front of the canvas (with a
    // little to spare) is not drawn this frame. However the camera swings, nothing is ever seen on the picture.
    const art = this.art, cam = k.G.camera, cp = cam && cam.position, ax = art.x, ay = art.y, az = art.z;
    const cN = cp ? (cp.x - ax) * nx + (cp.z - az) * nz : 0, hw = art.w / 2 + 0.03, hh = art.h / 2 + 0.03;
    for (let i = 0; i < show; i++) {
      const f = F[this.fig[i]], pt = this.part[i];
      let x = l[i * 3], y = l[i * 3 + 1], zz = l[i * 3 + 2];
      if (pt === LEG_L || pt === LEG_R) {          // a leg swings from the hip
        const hip = f.kind === 'dog' ? 0.32 * f.H : 0.42 * f.H, sw = (pt === LEG_L ? 1 : -1) * f.leg, d = hip - y;
        zz += Math.sin(sw) * d; y = hip - Math.cos(sw) * d;
      } else if (pt === PARASOL) {                 // the canopy turns about its shaft, held up in the outside hand and tipped back over the shoulder
        const rx = x * f.pc - zz * f.ps, rz = x * f.ps + zz * f.pc;
        x = rx + 0.1 * f.H; zz = -y * TILT_S + rz * TILT_C - 0.15 * TILT_S; y = 0.75 * f.H + 0.15 * TILT_C + y * TILT_C + rz * TILT_S;
      }
      if (f.tilt) { const y2 = y * f.tc - zz * f.ts; zz = zz * f.tc + y * f.ts; y = y2; }
      if (f.roll) { const x2 = x * f.rc + y * f.rs; y = y * f.rc - x * f.rs; x = x2; }
      let px = f.x + x * f.c + zz * f.s, py = f.y + f.bob + y, pz = f.z - x * f.s + zz * f.c;
      // Still on its way from the frame: down the rail, then across to its place in the figure.
      const g = (E - GATHER * i / this.N) / 0.15;
      if (g < 1) {
        const j = i * 3;
        if (g < 0.5) { const q = ease(g * 2); px = S[j] + (V[j] - S[j]) * q; py = S[j + 1] + (V[j + 1] - S[j + 1]) * q; pz = S[j + 2] + (V[j + 2] - S[j + 2]) * q; }
        else { const q = ease(g * 2 - 1); px = V[j] + (px - V[j]) * q; py = V[j + 1] + (py - V[j + 1]) * q; pz = V[j + 2] + (pz - V[j + 2]) * q; }
      }
      if (f.hide) py = -1e4;
      if (cp) {
        const pN = (px - ax) * nx + (pz - az) * nz;
        if (cN > pN && pN > 0) {
          const q = cN / (cN - pN), hx = cp.x + (px - cp.x) * q, hz = cp.z + (pz - cp.z) * q, hy = cp.y + (py - cp.y) * q;
          if (Math.abs((hx - ax) * tx + (hz - az) * tz) < hw && Math.abs(hy - ay) < hh) py = -1e4;
        }
      }
      a[i * 3] = px; a[i * 3 + 1] = py; a[i * 3 + 2] = pz;
    }
    P.needsUpdate = true;
  },
  // The waltz, on the game's own sound, louder the nearer the picture, and only while it is being looked at.
  waltz(k, on) {
    const c = k.sound && k.sound.ctx;
    if (!c || c.state !== 'running' || !k.sound.master) return;
    const d = Math.hypot(k.pos.x - this.art.x, k.pos.z - this.art.z), want = on ? 0.9 * Math.max(0, 1 - d / 10) : 0;
    if (!this.wz) { if (!on) return; const bus = c.createGain(); bus.gain.value = 0; bus.connect(k.sound.master); this.wz = { bus, next: 0, t0: c.currentTime + 0.1 }; }
    const z = this.wz; z.bus.gain.setTargetAtTime(want * 0.6, c.currentTime, on ? 0.4 : 0.6);
    if (!on) { z.idle = (z.idle || 0) + 1; if (z.idle > 300) { z.bus.disconnect(); this.wz = null; } return; }
    z.idle = 0;
    const B = 0.36, SONG = WALTZ, len = 48;
    if (z.t0 + z.next * B < c.currentTime) { z.t0 = c.currentTime + 0.05; z.next = 0; }       // fell behind (a pause): pick up again
    while (z.t0 + z.next * B < c.currentTime + 0.35) {
      const beat = z.next % len, at = z.t0 + z.next * B;
      for (const [b, mnote, dur] of SONG) if (b === beat) this.voice(c, z.bus, mnote, at, dur * B, 'triangle', 0.09);
      const bar = Math.floor(beat / 3), ch = bar < 8 || bar === 15 ? [50, [54, 57, 62]] : [45, [55, 61, 64]];
      if (beat % 3 === 0) this.voice(c, z.bus, ch[0], at, B * 0.9, 'triangle', 0.07);
      else for (const n of ch[1]) this.voice(c, z.bus, n, at, B * 0.4, 'sine', 0.025);
      z.next++;
    }
  },
  voice(c, out, m, at, dur, type, vol) {
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + 0.015); g.gain.setTargetAtTime(0, at + dur * 0.6, dur * 0.35);
    o.connect(g); g.connect(out); o.start(at); o.stop(at + dur + 0.4);
  },
  // ---------------------------------------------------------------- the monkey's show (src/secretgame.js runs it)
  // Touch the monkey in the picture (src/secret.js) and it puts on a show on this floor: the figures out of the picture form a
  // line, the other two couples stand back at the ends to watch, and the five in the line (the lady with the parasol, her
  // gentleman, the girl in white, the little dog and, last, the monkey) step forward one at a time and turn. The game says who
  // is turning, how far round, and how it went (g.i, g.spin, g.phase, g.done); everyone is put where that says. A figure that
  // has held its pose stands on a ring of its own note's colour (src/motif.js). The monkey wears its lead, which runs back up
  // to the foot of the frame, under where the painted one sits: below the picture, never across it.
  promenade(g, won) {
    const k = this.k;
    if (g) {
      if (!this.lead) this._showKit(k);
      this.game = g; this.was = this.state; this.gstate = 'show'; this.from = this.perch(k);
      for (const r of this.rings) r.visible = false;
      this.cast = [this.couples[0].lady, this.couples[0].man, this.child, this.dog];
      k.synth.chime([1568, 1976, 2349], { gap: 0.07, dur: 0.3, vol: 0.04 }); this.chatter(k, 0.03);
      return;
    }
    this.game = null; this.gstate = null; this.lead.visible = false; for (const r of this.rings) r.visible = false;
    for (const f of this.figs) { f.tilt = f.roll = 0; f.hide = false; }
    if (won) this.gone = true;
    // The monkey goes back to wherever it was before the show: on its lead, or under its bench (wary, so that it does not bolt from a toy left beside it).
    if (this.was === 'back') { this.state = 'back'; this.monkey.visible = false; } else this.hide(true);
  },
  // Known already (src/secret.js): one chatter, and the wall turns.
  tug() { if (this.k) this.chatter(this.k, 0.03); },
  _showKit(k) {
    const lead = this.lead = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 1, 5, 1, true).translate(0, 0.5, 0).rotateX(Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x3b2416, emissive: 0x24140a }));
    lead.name = 'grande-jatte-lead'; lead.visible = false; lead.userData.always = true; k.group.add(lead);
    this.rings = MOTIF.map(n => { const r = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.135, 36).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(n.colour), transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); r.visible = false; r.renderOrder = 3; k.group.add(r); return r; });
  },
  // Where everyone is this moment of the show.
  poses(dt, k) {
    const g = this.game, F = this.figs, a = this.art, face = Math.atan2(a.nx, a.nz), calm = g.calm, ph = g.phase, pt = g.pt, t = this.t;
    const P = (u, n) => ({ x: a.x + this.tx * u + a.nx * n, z: a.z + this.tz * u + a.nz * n });
    // The two couples watching, at the ends of the floor, turned to the middle; a little bob as each figure holds.
    [this.couples[1], this.couples[2]].forEach((C, j) => {
      const sg = j ? 1 : -1, cheer = ph === 'hit' || ph === 'all' ? Math.abs(Math.sin(pt * (calm ? 6 : 12))) * (calm ? 0.004 : 0.012) : 0;
      [[F[C.lady], 0.45], [F[C.man], 0.78]].forEach(([f, n]) => { const p = P(sg * 1.34, n); f.x = p.x; f.z = p.z; f.yaw = face - sg * 1.15; f.bob = cheer; f.leg = 0; f.tilt = ph === 'all' ? 0.35 * Math.sin(Math.PI * Math.min(1, pt / 1.4)) : 0; f.roll = 0; f.hide = false; });
      F[C.lady].spin += dt * 1.1;
    });
    const MARK = [-0.95, -0.48, 0, 0.48], BACK = 0.62, FRONT = 0.98, mix = (p, q, e) => ({ x: p.x + (q.x - p.x) * e, z: p.z + (q.z - p.z) * e });
    this.cast.forEach((fi, i) => {
      const f = F[fi], mark = P(MARK[i], BACK), front = P(MARK[i] * 0.55, FRONT);
      let at = mark, yaw = face; f.tilt = 0; f.roll = 0; f.bob = 0; f.leg = 0; f.hide = false;
      if (i === g.i && ph === 'step') { const e = ease(pt / g.stepT); at = mix(mark, front, e); f.leg = Math.sin(pt * 16) * 0.32 * (1 - e); f.bob = Math.abs(Math.sin(pt * 9)) * 0.008; }
      else if (i === g.i && ph === 'spin') {
        // Once round on its toes, facing you again at the top of the turn (the gold); and on round into a bow, if nobody says when.
        at = front; const s = g.spin / g.top; yaw = face + Math.PI * 2 * s; f.bob = 0.022 * Math.sin(Math.PI * Math.min(1, s)); f.leg = Math.sin(s * Math.PI * 4) * 0.18;
        if (s > 1) f.tilt = Math.min(0.5, (s - 1) * 2.4);
        if (f.kind === 'lady') f.spin += dt * 9;
      } else if (i === g.i && ph === 'hit') { at = front; f.bob = pt < 0.18 ? Math.sin(pt / 0.18 * Math.PI) * (calm ? 0.015 : 0.035) : 0.004; if (f.kind === 'lady') f.spin += dt * 3; }
      else if (i === g.i && ph === 'bow') { const e = ease(Math.min(1, pt / g.bowT)); at = mix(front, mark, Math.max(0, (pt / g.bowT - 0.45) / 0.55)); f.tilt = 0.55 * Math.sin(Math.PI * Math.min(1, pt / (g.bowT * 0.55))); f.leg = e < 1 && pt > g.bowT * 0.45 ? Math.sin(pt * 16) * 0.25 : 0; }
      else if (i === g.i && ph === 'miss') {
        // A stumble: a wobble, a lurch to one side, a sit-down, and up again. (Reduce motion: a gentle sway.)
        at = front; const d = Math.exp(-pt * (calm ? 1.5 : 2.2));
        if (calm) { f.roll = 0.14 * Math.sin(pt * 5) * d; }
        else { f.roll = 0.45 * Math.sin(pt * 14) * d; f.tilt = pt > 0.45 && pt < 1.0 ? -0.3 * Math.sin((pt - 0.45) / 0.55 * Math.PI) : 0; f.bob = pt > 0.45 && pt < 1.0 ? -0.03 * Math.sin((pt - 0.45) / 0.55 * Math.PI) : 0; at = { x: at.x + this.tx * 0.08 * Math.sin(pt * 7) * d, z: at.z + this.tz * 0.08 * Math.sin(pt * 7) * d }; f.leg = Math.sin(pt * 22) * 0.5 * d; }
        yaw = face + 0.6 * Math.sin(pt * 3) * d;
      } else if (g.done[i]) { f.bob = 0.004 * Math.sin(t * 2 + i); if (f.kind === 'lady') f.spin += dt * 0.8; }
      if (ph === 'all') f.tilt = 0.5 * Math.sin(Math.PI * Math.min(1, pt / (1.4 * g.slow)));
      f.x = at.x; f.z = at.z; f.yaw = yaw;
      const r = this.rings[i]; r.visible = g.done[i] && ph !== 'home'; if (r.visible) { r.position.set(mark.x, this.y + 0.012, mark.z); r.material.opacity = ph === 'tug' ? 0.4 : 0.75; }
    });
    const r4 = this.rings[4], m4 = P(0.95, BACK); r4.visible = g.done[4] && ph !== 'home'; if (r4.visible) r4.position.set(m4.x, this.y + 0.012, m4.z);
    // The rest: hidden (nobody else is in the show).
    for (let i = 0; i < F.length; i++) if (!this.cast.includes(i) && !this.couples.slice(1).some(C => C.lady === i || C.man === i)) F[i].hide = true;
  },
  // The monkey in the show: out of the frame and down; in the line; its own turn, quickest; the bow; the tug; and home.
  apeShow(dt, k) {
    const g = this.game, m = this.monkey, a = this.art, y0 = this.y, F = this.from, calm = g ? g.calm : true, tt = (this.clock += dt);
    const P = (u, n) => ({ x: a.x + this.tx * u + a.nx * n, z: a.z + this.tz * u + a.nz * n }), face = Math.atan2(a.nx, a.nz);
    if (!g) { this.gstate = null; return; }
    const ph = g.phase, pt = g.pt, mark = P(0.95, 0.62), front = P(0.6, 0.98), foot = { x: F.x + a.nx * 0.18, z: F.z + a.nz * 0.18 };
    let x = mark.x, z = mark.z, y = y0, yaw = face, lean = 0, roll = 0, sc = MK;
    m.visible = true; this.tail.rotation.y = Math.sin(tt * (calm ? 2 : 4)) * 0.5;
    const toward = (p) => Math.atan2(p.x - x, p.z - z);
    if (ph === 'intro') {
      const s = g.slow, q = pt / s;
      if (q < 0.5) { x = F.x; z = F.z; y = F.y; sc = MK * Math.max(0.02, q / 0.5); yaw = face; }                       // out of the foot of the frame, under the painted one
      else if (q < 0.95) { const e = (q - 0.5) / 0.45; x = F.x + (mark.x - F.x) * e; z = F.z + (mark.z - F.z) * e; y = F.y + (y0 - F.y) * e + Math.sin(e * Math.PI) * (calm ? 0.06 : 0.16); }      // and down
      else if (q < 1.7) lean = 0.6 * Math.sin(Math.PI * (q - 0.95) / 0.75);                                         // a bow to you
      else y = y0 + Math.abs(Math.sin(tt * 7)) * (calm ? 0.015 : 0.05);
      if (q >= 0.95 && !this.saidHi) { this.saidHi = true; this.chatter(k, 0.03); }
    } else if (g.i === 4 && (ph === 'step' || ph === 'spin' || ph === 'hit' || ph === 'miss')) {
      if (ph === 'step') { const e = ease(pt / g.stepT); x = mark.x + (front.x - mark.x) * e; z = mark.z + (front.z - mark.z) * e; y = y0 + Math.abs(Math.sin(e * Math.PI * 2)) * (calm ? 0.02 : 0.06); }
      else {
        x = front.x; z = front.z;
        if (ph === 'spin') { const s = g.spin / g.top; yaw = face + Math.PI * 2 * s; y = y0 + Math.sin(Math.PI * Math.min(1, s)) * (calm ? 0.03 : 0.09); if (s > 1) lean = Math.min(0.6, (s - 1) * 3); }
        else if (ph === 'hit') y = y0 + (pt < 0.2 ? Math.sin(pt / 0.2 * Math.PI) * (calm ? 0.03 : 0.1) : 0);
        else { const d = Math.exp(-pt * 2); roll = (calm ? 0.2 : 0.7) * Math.sin(pt * (calm ? 5 : 15)) * d; yaw = face + (calm ? 0.3 : 1.2) * Math.sin(pt * 4) * d; if (!calm && pt > 0.5 && pt < 0.9) lean = -0.5 * Math.sin((pt - 0.5) / 0.4 * Math.PI); }
      }
    } else if (g.i === 4 && ph === 'bow') { const e = Math.max(0, (pt / g.bowT - 0.45) / 0.55); x = front.x + (mark.x - front.x) * e; z = front.z + (mark.z - front.z) * e; lean = 0.7 * Math.sin(Math.PI * Math.min(1, pt / (g.bowT * 0.55))); }
    else if (ph === 'all') { lean = 0.75 * Math.sin(Math.PI * Math.min(1, pt / (1.4 * g.slow))); if (pt > 1.5 * g.slow) y = y0 + Math.abs(Math.sin(tt * 8)) * (calm ? 0.02 : 0.06); }
    else if (ph === 'tug') {
      // To the foot of the wall under its place, its back to the room; and it pulls its lead, twice.
      const s = g.slow, q = pt / s, e = ease(Math.min(1, q / 0.4));
      x = mark.x + (foot.x - mark.x) * e; z = mark.z + (foot.z - mark.z) * e; yaw = Math.atan2(-a.nx, -a.nz);
      if (q > 0.4) { lean = -0.45; const j = Math.max(0, Math.sin((q - 0.4) / 0.3 * Math.PI * 2)); x -= a.nx * j * 0.04; z -= a.nz * j * 0.04; }
    } else if (ph === 'home') {
      // Up to the foot of the frame, and gone into it (as at the end of its run home: never onto the picture).
      const s = g.slow, q = pt / s, e = Math.min(1, q / 0.42);
      x = foot.x + (F.x - foot.x) * e; z = foot.z + (F.z - foot.z) * e; y = y0 + (F.y - y0) * Math.sin(e * Math.PI / 2); yaw = Math.atan2(-a.nx, -a.nz);
      if (q > 0.5) { const s2 = Math.max(0.02, 1 - (q - 0.5) / 0.35); sc = MK * s2; y = F.y + TALL * (1 - s2); }
    } else {
      // In the line, watching whoever is turning; chattering at a stumble.
      const c = this.figs[this.cast[Math.min(3, g.i)]]; yaw = c ? Math.atan2(c.x - x, c.z - z) * 0.6 + face * 0.4 : face;
      if (ph === 'miss') { y = y0 + Math.abs(Math.sin(pt * 10)) * (calm ? 0.02 : 0.07); if (!calm) roll = 0.2 * Math.sin(pt * 12); }
      if (g.done[4]) y = y0;
    }
    m.position.set(x, y, z); m.rotation.set(lean, yaw, roll); m.scale.setScalar(sc);
    // The lead: from its collar back to the foot of the frame.
    const rail = a.y - a.h / 2 - Math.max(0.05, a.frame || 0.1), A = this.v3 || (this.v3 = new THREE.Vector3()), B = this.v3b || (this.v3b = new THREE.Vector3());
    A.set(x - Math.sin(yaw) * 0.01 * sc / MK, y + 0.12 * sc, z - Math.cos(yaw) * 0.01 * sc / MK); B.set(F.x - a.nx * 0.08, rail - 0.012, F.z - a.nz * 0.08);
    const L = this.lead, len = A.distanceTo(B); L.visible = sc > 0.3 && len > 0.02; L.position.copy(A); L.lookAt(B); L.scale.set(1, 1, len);
    m.visible = !this.over(k);
    if (L.visible && !m.visible) L.visible = false;
  },
  spots() { return this.art ? [{ kind: 'secret', id: 'monkey', name: 'The monkey off its lead', x: this.home.x, y: this.home.y, z: this.home.z }] : []; },
  reset() { if (this.art) this.hide(); },      // a new night: it is out again, and under the bench
});

// The Blue Danube, the first strain: [beat, midi note, beats long]. Three beats to the bar.
const WALTZ = [
  [0, 62, 1], [1, 66, 1], [2, 69, 1], [3, 69, 3], [7, 81, 1], [8, 81, 1], [10, 78, 1], [11, 78, 1],
  [12, 62, 1], [13, 66, 1], [14, 69, 1], [15, 69, 3], [19, 83, 1], [20, 83, 1], [22, 79, 1], [23, 79, 1],
  [24, 61, 1], [25, 64, 1], [26, 71, 1], [27, 71, 3], [31, 83, 1], [32, 83, 1], [34, 79, 1], [35, 79, 1],
  [36, 61, 1], [37, 64, 1], [38, 71, 1], [39, 71, 3], [43, 81, 1], [44, 81, 1], [46, 78, 1], [47, 78, 1],
];
