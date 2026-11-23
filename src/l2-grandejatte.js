// Gallery 240: Seurat's A Sunday on La Grande Jatte comes to life while you stand and look at it. Not on the canvas:
// nothing is ever drawn on or over a painting here (the user's rule: beside it, below it or in the room, never on it).
// Little strollers of my own, made of coloured dots, dance on the gallery floor in front of it, knee-high to a person:
// three couples waltzing round, the ladies' parasols twirling, a child spinning on her own and a little dog trotting
// round them all. A waltz plays, quietly (Johann Strauss II, The Blue Danube, 1866: the first strain, made up here,
// not recorded). They come up dot by dot as you look, and go the same way when you stop.
//
// And the monkey on the lead slips it. Only once the Director's passage has been found, though: until then the
// monkey is the clue to it (src/secret.js, src/secretclue.js), and must stay put to be tapped. After that it drops
// from the foot of the frame, a small monkey of my own, runs off into the gallery and hides in a corner: drive up to
// it to find it. The dancers are not solid, and they are only there while you are looking.
import * as THREE from 'three';
import { feature } from './features.js';

const rnd = (s => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646)(240);
const PAL = { navy: '#2b2f5e', orange: '#d8823a', cream: '#ecdfb4', pink: '#d77c7a', green: '#2f6b45', black: '#1e1b22', violet: '#6a4f8f', red: '#c2413a', white: '#f3eedf', ochre: '#c9a14a', brown: '#5a3a24' };
const COMP = { navy: '#d8a24a', orange: '#3b6bb5', cream: '#9a8fd0', pink: '#5f9a6a', green: '#d06a5a', black: '#3b3f7a', violet: '#c8b34a', red: '#3f9a8a', white: '#e0c87a', ochre: '#5a6fc0', brown: '#3b6bb5' };
const TAU = Math.PI * 2;
// The floor they dance on, in front of the picture: an ellipse this far along the wall and out from it (metres).
const ALONG = 1.15, OUT0 = 0.38, OUT1 = 1.2, DOT = 0.036;
const GATHER = 0.3, ease = q => (q <= 0 ? 0 : q >= 1 ? 1 : q * q * (3 - 2 * q));
const RIGID = 0, LEG_L = 1, LEG_R = 2, PARASOL = 3, TILT_C = Math.cos(0.45), TILT_S = Math.sin(0.45);

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
    // The monkey of my own, for when it gets away: brown, a red collar, a curl of a tail.
    const mk = this.monkey = new THREE.Group(), fur = new THREE.MeshLambertMaterial({ color: 0x6b4426, emissive: 0x3a2412 }), face = new THREE.MeshLambertMaterial({ color: 0xd6b48a, emissive: 0x6a5238 });
    const ball = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat); b.position.set(x, y, z); b.scale.set(sx, sy, sz); mk.add(b); return b; };
    ball(0.06, fur, 0, 0.07, 0, 1, 1.2, 0.9); ball(0.045, fur, 0, 0.16, 0.01); ball(0.03, face, 0, 0.155, 0.04, 1, 0.8, 0.6);
    for (const sx of [-1, 1]) { ball(0.016, face, sx * 0.042, 0.175, 0.005); ball(0.018, fur, sx * 0.05, 0.03, 0.02, 0.8, 1.4, 0.8); }
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 14), new THREE.MeshLambertMaterial({ color: 0xc0392b, emissive: 0x5a1010 })); collar.position.set(0, 0.12, 0.005); collar.rotation.x = Math.PI / 2; mk.add(collar);
    const tail = this.tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.04, -0.05), new THREE.Vector3(0, 0.02, -0.13), new THREE.Vector3(0, 0.1, -0.17), new THREE.Vector3(0, 0.14, -0.12)]), 12, 0.008, 5), fur);
    mk.add(tail); mk.visible = false; k.group.add(mk);
    // Where it can hide: three corners (not the one with the Director's door in it).
    const e = 0.32, hidden = k.plan.doors.find(d => d.hidden && (d.a === room.id || d.b === room.id));
    this.corners = [[room.x1 - e, room.z0 + e], [room.x1 - e, room.z1 - e], [room.x0 + e, room.z1 - e], [room.x0 + e, room.z0 + e]]
      .filter(([x, z]) => !k.plan.doorsOf(room.id).some(d => x > d.x0 - 1.2 && x < d.x1 + 1.2 && z > d.z0 - 1.2 && z < d.z1 + 1.2) && !(hidden && Math.hypot(x - (hidden.x0 + hidden.x1) / 2, z - (hidden.z0 + hidden.z1) / 2) < 3))
      .map(([x, z]) => ({ x, y: room.y, z }));
    if (!this.corners.length) this.corners = [{ x: room.x1 - e, y: room.y, z: room.z1 - e }];
    this.state = 'home'; this.look = 0; this.fade = 0; this.leap = 0; this.at = null; this.t = 0;
    this.wz = null;    // the waltz
  },
  active(k) { return !!this.art && (k.inRoom(this.roomId, 2) || this.fade > 0.001); },
  // The monkey goes only once the passage it points to has been found (or there is no passage this time).
  free(k) { const S = k.G.secret; return !S || !S.enabled || !S.clue || S.clue.work.id !== this.art.work.id || S.open; },
  update(dt, k) {
    const looking = k.looking === this.art;
    this.look = looking ? this.look + dt : 0;
    // How far out of the picture they are: 0 not at all, 0.3 every dot gathered, 0.45 the figures made, 0.75 all on the floor.
    // (They wait for the camera to come to rest in front of the picture: seen swinging past at a slant, a dot in front of
    // the frame could seem to cross the canvas.)
    const settled = looking && k.G.study && k.G.study.t > 1.6;
    this.fade = Math.max(0, Math.min(1, this.fade + (settled ? dt / 3.4 : looking ? 0 : -dt / 1.8)));
    const show = Math.min(this.N, Math.ceil(this.N * this.fade / GATHER));
    this.dots.visible = show > 0; this.dots.geometry.setDrawRange(0, show);
    if (show > 0) { this.t += dt; this.dance(dt, k, show); }
    this.waltz(k, looking);
    // The monkey: off the lead after a few seconds of looking, if it may go. It drops from the foot of the frame
    // (never across the picture) and runs off to a corner.
    if (this.state === 'home' && this.look > 4 && this.free(k)) {
      this.state = 'leaving'; this.leap = 0; k.synth.chime([1568, 1976, 2349], { gap: 0.07, dur: 0.3, vol: 0.04 });
      const a = this.art, R = a.work.id === 27992 && k.G.secret && k.G.secret.clue ? k.G.secret.clue.rect : [0.685, 0.755, 0.805, 0.9], u = (R[0] + R[2]) / 2 - 0.5;
      this.from = { x: a.x + this.tx * u * a.w + a.nx * 0.14, y: a.y - a.h / 2 - Math.max(0.05, a.frame || 0.1) - 0.24, z: a.z + this.tz * u * a.w + a.nz * 0.14 };      // hanging from the frame's foot, its head under it
      this.at = this.corners[Math.floor(Math.random() * this.corners.length)];
      this.monkey.position.set(this.from.x, this.from.y, this.from.z); this.monkey.visible = true;
    }
    if (this.state === 'leaving') {
      this.leap += dt;
      const f = Math.min(1, this.leap / 1.6), mk = this.monkey, F = this.from, A = this.at, y0 = this.y;
      if (f < 0.25) { const s = f / 0.25; mk.position.set(F.x + (F.x + (A.x - F.x) * 0.08 - F.x) * s, F.y + (y0 - F.y) * s * s, F.z + (A.z - F.z) * 0.08 * s); }      // down off the frame
      else { const s = 0.08 + 0.92 * (f - 0.25) / 0.75; mk.position.set(F.x + (A.x - F.x) * s, y0 + Math.abs(Math.sin(s * Math.PI * 7)) * 0.08, F.z + (A.z - F.z) * s); }     // and away, in bounds
      mk.rotation.y = Math.atan2(A.x - F.x, A.z - F.z);
      if (this.leap > 1.6) { this.state = 'out'; this.monkey.position.set(this.at.x, this.at.y, this.at.z); k.say('The monkey has slipped its lead. It is in here somewhere.', 5); }
    }
    if (this.state === 'out' || this.state === 'caught') {
      const mk = this.monkey, tt = performance.now() / 1000;
      mk.rotation.y = Math.atan2(k.pos.x - mk.position.x, k.pos.z - mk.position.z);
      this.tail.rotation.y = Math.sin(tt * 3) * 0.4;
      if (this.state === 'out') {
        mk.position.y = this.at.y + Math.abs(Math.sin(tt * 5)) * 0.015;
        if (k.close(this.at, 0.7, 1) && k.G.state === 'play') {
          this.state = 'caught'; this.leap = 0;
          for (let i = 0; i < 4; i++) k.synth.note(1400 + i * 260, 0.08, { type: 'square', vol: 0.025, at: i * 0.07 });
          if (k.find('monkey')) k.callout('THE MONKEY');
          k.say('Found. It chatters at you, and goes back to the picture, and its lead.', 5);
        }
      } else {
        this.leap += dt; mk.position.y = this.at.y + Math.max(0, Math.sin(this.leap * 9)) * 0.12; mk.scale.setScalar(Math.max(0.01, 1 - Math.max(0, this.leap - 1.2) * 1.5));
        if (this.leap > 2) { mk.visible = false; mk.scale.setScalar(1); this.state = 'back'; }
      }
    }
  },
  // Where everyone is this frame, and then the dots that are showing, moved to match.
  dance(dt, k, show) {
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
    // Each figure from its place in the row under the frame down to the floor: a hop out and down.
    const E = this.fade, y0 = this.y + 0.004;
    for (const f of F) {
      const h = Math.max(0, Math.min(1, (E - 0.45 - f.delay) / 0.25)), eh = h * h * (3 - 2 * h), Q = f.form;
      f.x = Q.x + (f.x - Q.x) * eh; f.z = Q.z + (f.z - Q.z) * eh; f.y = Q.y + (y0 - Q.y) * h * h;
      f.yaw = Q.yaw + Math.atan2(Math.sin(f.yaw - Q.yaw), Math.cos(f.yaw - Q.yaw)) * eh; f.bob *= h; f.leg *= h;
      f.c = Math.cos(f.yaw); f.s = Math.sin(f.yaw); f.pc = Math.cos(f.spin); f.ps = Math.sin(f.spin);
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
      let px = f.x + x * f.c + zz * f.s, py = f.y + f.bob + y, pz = f.z - x * f.s + zz * f.c;
      // Still on its way from the frame: down the rail, then across to its place in the figure.
      const g = (E - GATHER * i / this.N) / 0.15;
      if (g < 1) {
        const j = i * 3;
        if (g < 0.5) { const q = ease(g * 2); px = S[j] + (V[j] - S[j]) * q; py = S[j + 1] + (V[j + 1] - S[j + 1]) * q; pz = S[j + 2] + (V[j + 2] - S[j + 2]) * q; }
        else { const q = ease(g * 2 - 1); px = V[j] + (px - V[j]) * q; py = V[j + 1] + (py - V[j + 1]) * q; pz = V[j + 2] + (pz - V[j + 2]) * q; }
      }
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
  spots() { return this.art ? [{ kind: 'secret', id: 'monkey', name: 'The monkey off its lead', x: this.art.x, y: this.art.y - 1.6, z: this.art.z + this.art.nz * 1.5 }] : []; },
  reset() { if (!this.art) return; this.state = 'home'; this.monkey.visible = false; this.monkey.scale.setScalar(1); this.look = 0; },
});

// The Blue Danube, the first strain: [beat, midi note, beats long]. Three beats to the bar.
const WALTZ = [
  [0, 62, 1], [1, 66, 1], [2, 69, 1], [3, 69, 3], [7, 81, 1], [8, 81, 1], [10, 78, 1], [11, 78, 1],
  [12, 62, 1], [13, 66, 1], [14, 69, 1], [15, 69, 3], [19, 83, 1], [20, 83, 1], [22, 79, 1], [23, 79, 1],
  [24, 61, 1], [25, 64, 1], [26, 71, 1], [27, 71, 3], [31, 83, 1], [32, 83, 1], [34, 79, 1], [35, 79, 1],
  [36, 61, 1], [37, 64, 1], [38, 71, 1], [39, 71, 3], [43, 81, 1], [44, 81, 1], [46, 78, 1], [47, 78, 1],
];
