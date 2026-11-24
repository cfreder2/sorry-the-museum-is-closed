// Project Green Cheese, phase 1: the base (docs/FINALE.md).
//
// In the Debriefing room on Sub-level 9, a keycard on a stand under a map of a tunnel; beside it a blast door that the
// card opens. The tunnel runs east about 190 m under the railway and Columbus Drive, its lights waking ahead of you, to
// a base under Butler Field: a checkpoint, labs, a robot bay, records, stores, a mess, a generator, an office, a
// situation room, a control room with a window onto the hangar, and in the hangar, under the ballfield's centre field,
// the craft: a saucer sixteen metres across on its launch platform, ramp down, with the silo shaft over it and two
// snow-covered doors at the top. The rooms are in the layout (tools/build_layout.mjs, 8a); what is not a room, and is
// solid or driven on, is in src/finaleplan.js; what stands in the rooms is src/finalefit.js. This file draws the rest.
//
// Only the silo doors (out on the field) and the blast door, card and map (in the Debriefing room) are built at the
// start. The tunnel and the base are built the first time they are needed (the card taken, the door open, the toy near
// them, or G.finale.hangar asked for), drawn only while the camera is down there (or looking down the open silo), and
// do nothing at all per frame otherwise.
//
// Saved ('after-hours.finale'): { state, card, door }. A new game puts it all back.
//
// ---- for the later phases: G.finale -------------------------------------------------------------------------------
//   G.finale.state            'locked' | 'found' | 'played' | 'launched' | 'landed' | 'opened'; set it to move on (saved).
//                             'found' is set here, the first time the toy gets into the base.
//   G.finale.found            state is past 'locked'.        G.finale.doorOpen, G.finale.hasCard
//   G.finale.open()           give the card and open the blast door (now), and build the base. Returns G.finale.
//   G.finale.build()          build the tunnel and the base now (they are otherwise built when first needed).
//   G.finale.hangar           (building the base if it has not been) {
//     saucer                  THREE.Group: the craft. Its origin is the foot of its legs, on the platform's top.
//     craft.set(lift)         lift the craft `lift` m off its platform; its collision goes with it (finaleplan.js).
//     platform: { group, lift, set(lift), top }   the launch pad, flush with the floor at lift 0; raised, a column.
//     doors: { k, open(secs = 6), close(secs = 6), set(k), moving }   the silo doors, 0 shut to 1 open, animated.
//     ramp: { group, down, lower(), raise(), moving }   the ramp is down (and drivable) to begin with.
//     beamOrigin              THREE.Vector3, kept up to date: the port under the craft the beam comes from.
//     easels: [{ art: { work, mesh, mat, w, h }, position: THREE.Vector3, normal, light(k) }]   the archive's pictures,
//                             public-domain works from data/collection.json; light(k) 0..1 brings one up.
//     rim: { lamps (InstancedMesh), colour(fn) }   the craft's rim lights; colour(i => THREE.Color|null) overrides the chase.
//     centre                  THREE.Vector3: the middle of the platform's top.   shaft: { x0, x1, z0, z1, top, bottom }
//     frames                  the merged gilt frames behind the easels' pictures (once the pictures are in).
//     archive, hangarRoom, controlRoom: plan rooms. }
//   G.finale.console          (building the base) { position (THREE.Vector3, where the toy stands to use it), near(v),
//                             pads: [{ colour, mesh, light(k) }] (five, left to right), screen (a canvas texture's
//                             context and texture: { ctx, tex, w, h }), onUse: null }. Set onUse to a function and the
//                             USE button at the console calls it; until then it only says the pads are dark.
//                             (Phase 3, src/finalelaunch.js, sets it: the five notes, the beam, the launch.)
//   G.finale.plan             plan.finale (src/finaleplan.js): silo, doors, shaft, pieces, setDoors/setPlatform/setCraft/setRamp.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature, features } from './features.js';
import { CRAFT, DOOR, hullY } from './finaleplan.js';
import { BLABELS } from './finalefit.js';
import { beat } from './guardplan.js';
import { Geo } from './geo.js';
import { outfield } from './ballpark.js';      // (the outfield's checker, for the doors' tops)
import * as TX from './textures.js';
import { imageUrl } from './collection.js';
import { MOTIF_COLOURS } from './motif.js';

const KEY = 'after-hours.finale';
export const STATES = ['locked', 'found', 'played', 'launched', 'landed', 'opened'];
const PAD_COLOURS = MOTIF_COLOURS;          // the call's own colours, a pad to a note (src/motif.js), so the console, the rim and the music agree
const ease = t => t * t * (3 - 2 * t);
const TAU = Math.PI * 2;
const self = (hex, k = 0.28, o = {}) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.7, metalness: 0.15, emissive: hex, emissiveIntensity: k, ...o });
const glow = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b) });
const canvas = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); draw(c, w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { tex: t, ctx: c, cv, w, h }; };

feature({
  id: 'finale',
  secrets: [['greencheese', 'Project Green Cheese']],

  init(k) {
    const F = k.plan.finale; if (!F) return;
    this.k = k; this.F = F; this.t = 0; this.built = false; this.seenRooms = new Set();
    this.save = { state: 'locked', card: false, door: false };
    try { Object.assign(this.save, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* no storage */ }
    if (!STATES.includes(this.save.state)) this.save.state = 'locked';
    this.root = new THREE.Group(); this.root.name = 'finale'; k.group.add(this.root);
    this.M = {
      steel: self(0x7c858c, 0.3, { metalness: 0.5, roughness: 0.45 }), steelD: self(0x30353a, 0.35, { metalness: 0.4, roughness: 0.5 }), black: self(0x16181b, 0.2),
      haz: new THREE.MeshStandardMaterial({ map: TX.hazard(), roughness: 0.7, emissiveMap: null, emissive: 0x6a5410, emissiveIntensity: 0.5 }),
      snow: new THREE.MeshStandardMaterial({ map: k.museum.snowTex, roughness: 0.95, emissiveMap: k.museum.snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5 }),
      glass: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.75, 0.9), transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide }),
      wood: self(0x7a5634, 0.25),
    };
    this._silo(k);
    this._brief(k);
    this.api = this._api(k); k.G.finale = this.api;
    if (this.save.door) this._blastAt(1);
    if (this.save.state !== 'locked') k.plan.levels.B = F.fl;
  },

  // ---------------------------------------------------------------- saving and the state
  _store() { try { localStorage.setItem(KEY, JSON.stringify(this.save)); } catch { /* fine */ } },
  setState(s) {
    if (!STATES.includes(s) || s === this.save.state) return;
    this.save.state = s; this._store();
    if (s !== 'locked') this.k.plan.levels.B = this.F.fl; else delete this.k.plan.levels.B;
    try { window.dispatchEvent(new CustomEvent('museum:finale', { detail: { state: s } })); } catch { /* fine */ }
  },

  _api(k) {
    const me = this;
    return {
      get state() { return me.save.state; }, set state(s) { me.setState(s); }, setState: s => me.setState(s),
      get found() { return me.save.state !== 'locked'; }, get doorOpen() { return me.save.door; }, get hasCard() { return me.save.card; },
      open() { me.save.card = true; me._openBlast(true); me._build(); return me.api; },
      build() { me._build(); return me.api; },
      get hangar() { me._build(); return me.hangar; },
      get console() { me._build(); return me.consoleApi; },
      plan: me.F, STATES,
    };
  },

  // ---------------------------------------------------------------- the silo doors (always)
  _silo(k) {
    const F = this.F, sq = F.silo, half = (sq.x1 - sq.x0) / 2, D = DOOR.thick, OF = outfield(k), g = this.siloG = new THREE.Group(); g.name = 'silo doors'; this.root.add(g);
    this.doorMeshes = ['w', 'e'].map(side => {
      const grp = new THREE.Group(), top = new Geo(), sides = new Geo(), seam = new Geo();
      const x0 = side === 'w' ? sq.x0 : sq.x0 + half, x1 = x0 + half, z0 = sq.z0, z1 = sq.z1;
      // Built where it lies shut, its top at y 0; the group is moved as it opens.
      // (its top is the outfield's checker, laid to the outfield's own lines, so the square cannot be told from the field round it)
      top.quad([x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1], [0, 1, 0], [OF.uv(x0, z0), OF.uv(x1, z0), OF.uv(x1, z1), OF.uv(x0, z1)]);
      sides.box(x0, x1, -D, -0.03, z0, z1);      // (3 cm under the snow top, so the two never flicker from afar)
      for (let z = z0 + 2; z < z1 - 1; z += 4) sides.box(x0 + 0.3, x1 - 0.3, -D - 0.35, -D, z - 0.15, z + 0.15);        // the ribs under it
      for (const x of [x0 + 1, x1 - 1]) sides.box(x - 0.15, x + 0.15, -D - 0.35, -D, z0 + 0.3, z1 - 0.3);
      const e = side === 'w' ? x1 : x0; seam.box(e - 0.012, e + 0.012, -0.004, 0.006, z0, z1);      // where the halves meet: a hairline in the snow
      grp.add(top.mesh(OF.mat), sides.mesh(this.M.steelD), seam.mesh(this.M.black));
      for (const m of grp.children) m.matrixAutoUpdate = false, m.updateMatrix();
      g.add(grp); grp.userData.side = side;
      return grp;
    });
    // A steel coaming round the square, just under the outfield's snow (which hides it), and its lip down into the shaft.
    const co = new Geo(), W = 0.22, CT = -0.004;
    co.box(sq.x0 - W, sq.x1 + W, -0.5, CT, sq.z0 - W, sq.z0); co.box(sq.x0 - W, sq.x1 + W, -0.5, CT, sq.z1, sq.z1 + W);
    co.box(sq.x0 - W, sq.x0, -0.5, CT, sq.z0, sq.z1); co.box(sq.x1, sq.x1 + W, -0.5, CT, sq.z0, sq.z1);
    g.add(co.mesh(this.M.steelD));
    this.doorsAnim = null;
    this._placeDoors();
  },
  _placeDoors() {
    const F = this.F, k = F.doorsK, half = (F.silo.x1 - F.silo.x0) / 2, sink = Math.min(1, k / 0.2), slide = Math.max(0, (k - 0.2) / 0.8);
    for (const grp of this.doorMeshes) { grp.position.set((grp.userData.side === 'w' ? -1 : 1) * half * slide, -DOOR.drop * sink, 0); grp.updateMatrixWorld(true); }
  },
  _doorsTo(target, secs) {
    const from = this.F.doorsK;
    if (!secs) { this.F.setDoors(target); this._placeDoors(); this.doorsAnim = null; return; }
    this.doorsAnim = { from, to: target, t: 0, dur: secs };
    if (target > from) this._build();
    this.k.sound.grind(Math.min(3, secs));
  },

  // ---------------------------------------------------------------- the Debriefing room (always)
  _brief(k) {
    const F = this.F, g = this.briefG = new THREE.Group(); g.name = 'debriefing'; this.root.add(g); g.visible = false;
    const marks = k.plan.marks || [];
    const card = marks.find(m => m.kind === 'keycard'), map = marks.find(m => m.kind === 'tunnelmap');
    // The map of the tunnel.
    if (map) {
      const { tex } = canvas(1024, 640, (c, w, h) => drawTunnelMap(c, w, h));
      const m = new THREE.Mesh(new THREE.PlaneGeometry(map.w, map.h), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.85, 0.9, 1) }));
      m.position.set(map.x + map.fx * 0.004, map.y, map.z + map.fz * 0.004); m.rotation.y = Math.atan2(map.fx, map.fz); g.add(m);
      this.mapAt = map;
    }
    // The card, on its stand.
    if (card) {
      const { tex } = canvas(256, 160, (c, w, h) => {
        c.fillStyle = '#e8eef2'; c.fillRect(0, 0, w, h); c.fillStyle = '#1d3a2c'; c.fillRect(0, 0, w, 40); c.fillStyle = '#9fd86a'; c.font = 'bold 26px sans-serif'; c.fillText('GREEN CHEESE', 12, 30);
        c.fillStyle = '#c8a23a'; c.fillRect(16, 60, 46, 36); c.fillStyle = '#111'; c.font = 'bold 22px sans-serif'; c.fillText('ACCESS: ALL', 76, 86); c.font = '16px sans-serif'; c.fillText('B1  B2  SILO', 76, 116); c.fillRect(16, 130, 224, 12);
      });
      const m = this.cardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.006, 0.11), [this.M.steel, this.M.steel, new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.2, 1.2, 1.2) }), this.M.steel, this.M.steel, this.M.steel]);
      m.position.set(card.x, card.y + 0.01, card.z); m.rotation.set(0, Math.atan2(card.fx, card.fz), 0); g.add(m);
      const halo = this.cardHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.radial(0, 1.5), color: new THREE.Color(0.6, 1.4, 0.7), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.position.copy(m.position).add(new THREE.Vector3(0, 0.06, 0)); halo.scale.set(0.55, 0.55, 1); g.add(halo);
      this.cardAt = { x: card.x, y: card.y - 0.36, z: card.z };
      m.visible = halo.visible = !this.save.card;
    }
    // The blast door: a slab of steel in the doorway, sliding north into the wall. And the reader beside it.
    const B = F.blast;
    if (B) {
      const d = B.door, slab = new THREE.Group(), h = d.h, w = d.z1 - d.z0, t = 0.28, xm = (d.x0 + d.x1) / 2;
      const { tex } = canvas(256, 384, (c, W, H) => {
        c.fillStyle = '#5d646a'; c.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += 48) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, y, W, 3); }
        c.fillStyle = 'rgba(255,255,255,.18)'; for (let x = 14; x < W; x += 40) for (let y = 14; y < H; y += 48) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); }
        c.save(); c.beginPath(); c.rect(0, H - 70, W, 70); c.clip(); c.fillStyle = '#f2c21a'; c.fillRect(0, H - 70, W, 70); c.fillStyle = '#141414'; for (let x = -80; x < W + 80; x += 56) { c.beginPath(); c.moveTo(x, H); c.lineTo(x + 28, H); c.lineTo(x + 98, H - 70); c.lineTo(x + 70, H - 70); c.fill(); } c.restore();
        c.fillStyle = '#e9e2c8'; c.font = 'bold 120px Impact, "Arial Black", sans-serif'; c.textAlign = 'center'; c.fillText('B', W / 2, 190); c.font = 'bold 26px Impact, "Arial Black", sans-serif'; c.fillText('AUTHORISED ONLY', W / 2, 246);
      });
      const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.4, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.32 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(t, h - 0.02, w - 0.02), [face, face, this.M.steelD, this.M.steelD, this.M.steelD, this.M.steelD]);
      box.position.set(0, h / 2, 0); slab.add(box);
      slab.position.set(xm, d.y, (d.z0 + d.z1) / 2); g.add(slab); this.slab = slab; this.slabZ = slab.position.z;
      // the reader: a small plate on the Debriefing room's side, north of the door
      const rx = d.x0 - 0.02, rz = d.z0 - 0.42;
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.2), this.M.black); plate.position.set(rx, d.y + 1.0, rz); g.add(plate);
      const led = this.led = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.05, 0.12), glow(2.4, 0.3, 0.2)); led.position.set(rx - 0.022, d.y + 1.1, rz); g.add(led);
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 0.14), glow(0.2, 0.3, 0.35)); slot.position.set(rx - 0.022, d.y + 0.95, rz); g.add(slot);
      this.readerAt = { x: d.x0 - 0.9, y: d.y, z: (d.z0 + d.z1) / 2 };
      this.blastK = 0;
    }
  },
  _blastAt(kk) {
    this.blastK = kk;
    if (this.slab) { this.slab.position.z = this.slabZ - (this.F.blast.door.z1 - this.F.blast.door.z0 + 0.1) * ease(kk); }
    if (this.led) this.led.material.color.setRGB(kk > 0 || this.save.card ? 0.3 : 2.4, kk > 0 || this.save.card ? 2.4 : 0.3, 0.3);
    if (this.F.blast) this.F.blast.gate.off = kk >= 0.98;
  },
  _openBlast(now) {
    if (!this.F.blast) return;
    this.save.door = true; this._store();
    if (this.cardMark) { this.k.G.mapMarks = (this.k.G.mapMarks || []).filter(m => m !== this.cardMark); this.cardMark = null; }
    if (now) { this._blastAt(1); return; }
    this.blastAnim = 0; this.k.sound.grind(2.6);
    this.k.callout('ACCESS GRANTED');
    this.k.say('The blast door rolls aside. A tunnel runs east, a long way.', 0.4, 6);
    this._build();
  },
  _takeCard() {
    const k = this.k;
    this.save.card = true; this._store();
    if (this.cardMesh) this.cardMesh.visible = this.cardHalo.visible = false;
    k.sound.bell(659.25, 0, 0.06, 1.6); k.sound.bell(987.77, (k.sound.ctx ? k.sound.ctx.currentTime : 0) + 0.12, 0.05, 1.8);      // (bell takes a time on the audio clock)
    k.callout('KEYCARD');
    k.say('A keycard. PROJECT GREEN CHEESE, it says. And a map of a tunnel, going east.', 0.3, 7);
    this._blastAt(this.blastK || 0);
    const B = this.F.blast;
    if (B && !this.save.door) { this.cardMark = { x: B.x, y: B.y, z: B.z, colour: '#9fd86a', ring: true }; k.G.mapMarks = [...(k.G.mapMarks || []), this.cardMark]; }
    this._build();
  },

  // ---------------------------------------------------------------- the button
  near(v, k) {
    if (!this.F || v.pos.y > -5) return null;
    const p = v.pos;
    if (this.cardAt && !this.save.card && k.close(this.cardAt, 1.6, 1.3)) return { verb: 'TAKE', hint: 'A keycard on a stand. TAKE it.', act: () => this._takeCard() };
    if (this.readerAt && !this.save.door && k.close(this.readerAt, 2.0, 1.5)) {
      if (this.save.card) return { verb: 'OPEN', hint: 'Swipe the card. OPEN.', act: () => this._openBlast(false) };
      k.once('finale-door', 'A blast door, and a card reader. It wants a card.', 5);
      return null;
    }
    const c = this.consoleApi;
    if (c && c.near(v)) return { verb: 'USE', hint: 'A console with five dark pads.', act: () => { if (typeof c.onUse === 'function') c.onUse(); else k.say('Five pads, dark. Nothing answers yet.', 4); } };
    return null;
  },

  // ---------------------------------------------------------------- each frame
  update(dt, k) {
    if (!this.F) return;
    this.t += dt;
    const F = this.F, cam = k.G.camera ? k.G.camera.position : k.pos, p = k.pos;
    if (this.doorsAnim) {
      const a = this.doorsAnim; a.t += dt; const u = Math.min(1, a.t / a.dur);
      F.setDoors(a.from + (a.to - a.from) * ease(u)); this._placeDoors();
      if (u >= 1) { this.doorsAnim = null; k.sound.bump(2); }
    }
    if (this.blastAnim != null) { this.blastAnim = Math.min(1, this.blastAnim + dt / 2.6); this._blastAt(this.blastAnim); if (this.blastAnim >= 1) { this.blastAnim = null; k.sound.bump(2.5); } }
    const deep = cam.y < -4.5;
    this.briefG.visible = deep && Math.abs(cam.x - 109) < 40 && Math.abs(cam.z - 75) < 40;
    if (this.briefG.visible && this.cardHalo && this.cardHalo.visible) this.cardHalo.material.opacity = 0.55 + 0.35 * Math.sin(this.t * 3);
    if (!this.built) {
      if (p.y < -6 && p.x > 112.9 && p.x < 470 && p.z > 40 && p.z < 200) this._build();           // (somebody got in some other way: a test, a teleport)
      else if (p.y < -6 && this.save.door && Math.abs(p.x - 110) < 30 && Math.abs(p.z - 75) < 30) this._build();
      if (!this.built) return;
    }
    // The ramp coming down or going up (whether or not anybody is watching).
    if (this.rampU !== this.rampTo && this.craft) {
      this.rampU += Math.sign(this.rampTo - this.rampU) * Math.min(Math.abs(this.rampTo - this.rampU), dt / 2.4);
      this.craft.setRamp(this.rampU);
      if (this.rampU === 0) F.setRamp(true);
    }
    const silo = F.silo, openSilo = F.doorsK > 0.001 && Math.abs(cam.x - silo.cx) < 120 && Math.abs(cam.z - silo.cz) < 120;
    this.tunnelG.visible = deep && cam.x > 100 && cam.x < 312 && Math.abs(cam.z - 74.6) < 30;
    this.baseG.visible = (deep && cam.x > 290 && cam.z > 30 && cam.z < 210) || openSilo;
    if (this.tunnelG.visible) this._tunnelTick(dt, p);
    if (!this.baseG.visible) return;
    this._baseTick(dt, k, p, cam);
  },

  // ---------------------------------------------------------------- building the rest
  _build() {
    if (this.built || !this.F) return;
    this.built = true;
    const k = this.k;
    this.tunnelG = new THREE.Group(); this.tunnelG.name = 'tunnel'; this.root.add(this.tunnelG);
    this.baseG = new THREE.Group(); this.baseG.name = 'base'; this.root.add(this.baseG);
    this._tunnel(k);
    this._rooms(k);
    this._hangar(k);
    this._archive(k);
    this._labels(k);
    this._robots(k);
    this.tunnelG.visible = this.baseG.visible = false;
  },

  // ---- the tunnel
  _tunnel(k) {
    const T = k.plan.byId['B-tunnel']; if (!T) return;
    const g = this.tunnelG, x0 = T.x0, x1 = T.x1, z0 = T.z0, z1 = T.z1, y = T.y, top = T.y + T.ceil, zm = (z0 + z1) / 2;
    this.tun = { x0, x1, z0, z1, y, zm };
    T.glow = 0.05;
    const conc = new Geo(), steel = new Geo(), sleeper = new Geo(), paint = new Geo(), pipe = [];
    for (let x = x0 + 6; x < x1 - 1; x += 6) {       // ribs: shallow, painted on more than built out
      conc.box(x - 0.2, x + 0.2, y, top - 0.02, z0 + 0.004, z0 + 0.07); conc.box(x - 0.2, x + 0.2, y, top - 0.02, z1 - 0.07, z1 - 0.004); conc.box(x - 0.2, x + 0.2, top - 0.1, top - 0.01, z0, z1);
      paint.box(x - 0.2, x + 0.2, y + 0.002, y + 0.004, z0 + 0.05, z0 + 0.35);
    }
    // a narrow-gauge track down the middle, nearly flush with the floor, and its sleepers
    for (const zz of [zm - 0.45, zm + 0.45]) steel.box(x0 + 0.6, x1 - 0.6, y, y + 0.016, zz - 0.025, zz + 0.025);
    for (let x = x0 + 0.9; x < x1 - 0.6; x += 0.9) sleeper.box(x - 0.08, x + 0.08, y, y + 0.006, zm - 0.7, zm + 0.7);
    for (let x = x0 + 1; x < x1 - 1; x += 3) paint.box(x, x + 1.6, y + 0.002, y + 0.004, z1 - 0.32, z1 - 0.22);         // a dashed line along the south side
    for (const [yy, r, zz] of [[top - 0.55, 0.11, z0 + 0.2], [top - 0.85, 0.07, z0 + 0.18], [top - 0.4, 0.05, z1 - 0.15]]) { const c = new THREE.CylinderGeometry(r, r, x1 - x0 - 0.4, 10, 1, true); c.rotateZ(Math.PI / 2); c.translate((x0 + x1) / 2, yy, zz); pipe.push(c); }
    g.add(conc.mesh(self(0x6e7378, 0.32)), steel.mesh(this.M.steel), sleeper.mesh(self(0x4a3a2a, 0.2)), paint.mesh(glow(0.75, 0.62, 0.15)), new THREE.Mesh(mergeGeometries(pipe), self(0x5a6a5a, 0.3, { side: THREE.DoubleSide })));
    // The lamps, one every six metres, each over a pool of light: dark until you come near.
    const n = Math.floor((x1 - x0 - 3) / 6), lamps = this.tLamps = new THREE.InstancedMesh(new THREE.BoxGeometry(1.3, 0.07, 0.24), new THREE.MeshBasicMaterial({ color: 0xffffff }), n);
    const pools = this.tPools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: false }), n);
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), one = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3(), c = new THREE.Color(0, 0, 0);
    this.tLampX = [];
    for (let i = 0; i < n; i++) {
      const x = x0 + 3 + i * 6; this.tLampX.push(x);
      lamps.setMatrixAt(i, M4.compose(V.set(x, top - 0.16, zm), one, S.set(1, 1, 1))); lamps.setColorAt(i, c.setRGB(0.05, 0.05, 0.06));
      pools.setMatrixAt(i, M4.compose(V.set(x, y + 0.012, zm), Q, S.set(4.2, 6.2, 1))); pools.setColorAt(i, c.setRGB(0, 0, 0));
    }
    for (const m of [lamps, pools]) { m.frustumCulled = false; g.add(m); } pools.renderOrder = 4;
    this.tWake = new Float32Array(n); this.tLit = new Float32Array(n); this.tLitT = 0;
    // Signs on the walls: how far, and what is overhead.
    const sign = (x, z, face, lines, w = 1.6, h = 0.7) => { const m = plate(lines, w, h); m.position.set(x, y + 1.5, z); m.rotation.y = face; g.add(m); };
    const N = 0, S2 = Math.PI;
    sign(x0 + 2.2, z1 - 0.02, S2, [['SUB-LEVEL 9', '#e9e2c8', 70], ['← WEST', '#9fd86a', 44]]);
    sign(x1 - 2.6, z0 + 0.02, N, [['CHECKPOINT', '#e9e2c8', 64], ['AHEAD →', '#ffb347', 44]]);
    for (let d = 50; d < x1 - x0 - 10; d += 50) sign(x0 + d, z0 + 0.02, N, [[`${d} m`, '#e9e2c8', 90]], 1.0, 0.5);
    const rail = k.plan.grounds && k.plan.grounds.rail, col = k.plan.grounds && k.plan.grounds.columbus;
    if (rail) sign((rail.x0 + rail.x1) / 2 + 3, z1 - 0.02, S2, [['RAILWAY', '#e9e2c8', 70], ['OVERHEAD', '#9aa4ad', 44]]);
    if (col) sign((col.x0 + col.x1) / 2, z1 - 0.02, S2, [['COLUMBUS DR', '#e9e2c8', 64], ['OVERHEAD', '#9aa4ad', 44]]);
    // under the railway, the roof weeps a little
    if (rail) { const wet = new Geo(); for (let i = 0; i < 6; i++) { const x = rail.x0 + 1 + i * 1.6, z = zm + ((i * 37) % 10 - 5) * 0.25; wet.box(x - 0.5, x + 0.5, y + 0.003, y + 0.005, z - 0.35, z + 0.35); } g.add(wet.mesh(new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.05, metalness: 0.6 }))); }
  },
  _tunnelTick(dt, p) {
    const t = this.tun; if (!t || !this.tLamps) return;
    const inside = p.y < t.y + 4 && p.y > t.y - 1 && p.x > t.x0 - 6 && p.x < t.x1 + 8 && Math.abs(p.z - t.zm) < 4;
    if (!inside && !this.tLitAny) return;
    const c = this._c || (this._c = new THREE.Color()), n = this.tLampX.length;
    let any = false, near = 0;
    for (let i = 0; i < n; i++) {
      const d = this.tLampX[i] - p.x;
      if (inside && d > -14 && d < 26 && !this.tWake[i]) { this.tWake[i] = this.t + Math.max(0, d) * 0.03; }      // the ones ahead first, a beat apart
      const on = this.tWake[i] && this.t >= this.tWake[i];
      if (on && this.tLit[i] === 0 && (this.t - (this._clunk || 0)) > 0.12) { this._clunk = this.t; this.k.synth.noise(0.06, { vol: 0.03, lp: 700 }); }
      const want = !inside ? 0 : on ? 1 : 0, was = this.tLit[i];
      this.tLit[i] += (want - was) * Math.min(1, dt * (want > was ? 5 : 0.6));
      if (Math.abs(this.tLit[i] - was) > 1e-4 || (on && was < 1)) {
        const f = this.tLit[i] * (on && this.t - this.tWake[i] < 0.35 ? (Math.sin((this.t - this.tWake[i]) * 70) > 0 ? 1 : 0.3) : 1);       // a flicker as it strikes
        this.tLamps.setColorAt(i, c.setRGB(0.05 + 2.4 * f, 0.05 + 2.5 * f, 0.06 + 2.7 * f)); this.tPools.setColorAt(i, c.setRGB(0.17 * f, 0.175 * f, 0.19 * f));
        this.tLamps.instanceColor.needsUpdate = this.tPools.instanceColor.needsUpdate = true;
      }
      if (this.tLit[i] > 0.01) { any = true; if (Math.abs(this.tLampX[i] - p.x) < 20) near++; }
    }
    if (!inside) for (let i = 0; i < n; i++) if (this.tLit[i] < 0.01) this.tWake[i] = 0;
    this.tLitAny = any;
    const T = this.k.plan.byId['B-tunnel']; if (T) T.glow = 0.05 + 0.04 * near;
    if (inside && !this.told('tunnel')) this.k.say('Under the railway, under Columbus Drive. The lights know you are coming.', 0.6, 6);
  },
  told(id) { if (this.seenRooms.has('told:' + id)) return true; this.seenRooms.add('told:' + id); return false; },

  // ---- the rooms: the checkpoint, the corridors, the crystals, the robots on their docks, the chair, the console, the plan table
  _rooms(k) {
    const P = k.plan, F = this.F, g = this.baseG, marks = (P.marks || []).filter(m => /^B-/.test(m.room));
    // Corridor lights and the line on the floor to the hangar.
    const lamp = new Geo(), line = new Geo();
    for (const id of ['B-conc', 'B-way']) {
      const r = P.byId[id]; if (!r) continue;
      const along = r.x1 - r.x0 > r.z1 - r.z0, top = r.y + r.ceil - 0.06;
      if (along) for (let x = r.x0 + 2; x < r.x1 - 1; x += 5) lamp.box(x - 0.6, x + 0.6, top - 0.05, top, (r.z0 + r.z1) / 2 - 0.1, (r.z0 + r.z1) / 2 + 0.1);
      else for (let z = r.z0 + 2; z < r.z1 - 1; z += 5) lamp.box((r.x0 + r.x1) / 2 - 0.1, (r.x0 + r.x1) / 2 + 0.1, top - 0.05, top, z - 0.6, z + 0.6);
    }
    const conc = P.byId['B-conc'], way = P.byId['B-way'];
    if (conc && way) {
      const zl = (conc.z0 + conc.z1) / 2 + 1.6, xl = (way.x0 + way.x1) / 2 - 1.6, y = conc.y + 0.003;
      line.box(conc.x0 + 0.3, xl + 0.1, y, y + 0.002, zl - 0.08, zl + 0.08); line.box(xl - 0.08, xl + 0.08, y, y + 0.002, zl, way.z1 - 0.2);
      for (let x = conc.x0 + 4; x < xl - 2; x += 8) for (const s of [-1, 1]) line.box(x, x + 0.5, y, y + 0.002, zl + s * 0.2 - 0.04, zl + s * 0.2 + 0.04);
    }
    g.add(lamp.mesh(glow(1.6, 1.7, 1.9)), line.mesh(glow(0.9, 0.7, 0.12)));
    // The checkpoint: a barrier across the room, the turnstile in its lane, the robot that was on duty.
    const C = F.check, ck = P.byId['B-check'];
    if (C && ck) {
      const b = new Geo(), gl = new Geo(), [l0, l1] = C.lane;
      for (const [za, zb] of [[ck.z0 + 0.05, l0], [l1, ck.z1 - 0.05]]) { b.box(C.x - 0.1, C.x + 0.1, ck.y, ck.y + 0.55, za, zb); gl.box(C.x - 0.03, C.x + 0.03, ck.y + 0.55, ck.y + 1.1, za, zb); for (let z = za + 1.5; z < zb; z += 1.5) b.box(C.x - 0.06, C.x + 0.06, ck.y + 0.55, ck.y + 1.12, z - 0.04, z + 0.04); }
      for (const z of [l0, l1]) b.box(C.x - 0.16, C.x + 0.16, ck.y, ck.y + 1.12, z - 0.06, z + 0.06);
      b.box(C.x - 0.04, C.x + 0.04, ck.y + 0.84, ck.y + 0.98, l0, l1);
      g.add(b.mesh(this.M.steel), gl.mesh(this.M.glass));
      const bot = robotMesh(this.M, false); bot.position.set(C.robot.x, ck.y, C.robot.z); bot.rotation.set(0.42, 2.2, 0.15); bot.position.y += 0.05; g.add(bot); this.deadBot = bot;
      const sg = plate([['CHECKPOINT', '#e9e2c8', 70], ['SHOW YOUR CARD', '#ffb347', 40]], 1.8, 0.8); sg.position.set(C.x + 0.12, ck.y + 1.6, (l0 + l1) / 2 + 2.2); sg.rotation.y = -Math.PI / 2; g.add(sg);
    }
    // Crystals in their jars (the source of the glowing mice), and the one that has been got into.
    const cr = marks.filter(m => m.kind === 'crystal');
    if (cr.length) {
      const glassG = new THREE.CylinderGeometry(1, 1, 1, 18, 1, true), xtal = new THREE.OctahedronGeometry(1, 0);
      const jars = new THREE.InstancedMesh(glassG, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 0.7, 0.55), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }), cr.length);
      const xm = this.xtalMat = new THREE.MeshBasicMaterial({ color: 0xffffff }), xs = new THREE.InstancedMesh(xtal, xm, cr.length * 3);
      const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(), V = new THREE.Vector3(), c = new THREE.Color();
      const COL = { green: [0.4, 2.2, 0.8], violet: [1.4, 0.7, 2.6], amber: [2.4, 1.4, 0.3] };
      cr.forEach((m, i) => {
        const h = m.cracked ? m.h * 0.45 : m.h;
        jars.setMatrixAt(i, M4.compose(V.set(m.x, m.y + h / 2, m.z), Q.identity(), S.set(m.r, h, m.r)));
        for (let j = 0; j < 3; j++) {
          const s = m.cracked ? 0 : m.r * (j ? 0.32 : 0.55), off = j ? (j === 1 ? 0.35 : -0.3) * m.r : 0;
          E.set(0.2 * j, i * 1.3 + j * 2, 0.15 * j); Q.setFromEuler(E);
          xs.setMatrixAt(i * 3 + j, M4.compose(V.set(m.x + off, m.y + m.h * (j ? 0.28 : 0.45), m.z + off * 0.6), Q, S.set(s, s * (j ? 1.6 : 2.2), s)));
          const k2 = COL[m.col] || COL.green; xs.setColorAt(i * 3 + j, c.setRGB(k2[0], k2[1], k2[2]));
        }
        if (m.cracked) this._prints(m);
      });
      jars.renderOrder = 6; for (const q of [jars, xs]) { q.frustumCulled = false; g.add(q); }
    }
    // The robots on their docks in the robot bay.
    const docked = marks.filter(m => m.kind === 'robot');
    for (const m of docked) { const r = robotMesh(this.M, !m.asleep); r.position.set(m.x, m.y, m.z); r.rotation.y = Math.atan2(m.fx, m.fz); g.add(r); }
    // The chair at the console, its back to the room. Somebody is sitting in it.
    const sw = marks.find(m => m.kind === 'swivel');
    if (sw) { const ch = this.chair = swivelChair(this.M); ch.position.set(sw.x, sw.y, sw.z); this.chairFace = Math.atan2(sw.fx, sw.fz); ch.rotation.y = this.chairFace; g.add(ch); this.chairTurn = 0; this.chairAt = sw; }
    // The console's five pads and its screen.
    const tc = marks.find(m => m.kind === 'toneconsole');
    if (tc) {
      const ux = tc.fz, uz = -tc.fx, pads = [];
      PAD_COLOURS.forEach((hex, i) => {
        const base = new THREE.Color(hex), mat = new THREE.MeshBasicMaterial({ color: base.clone().multiplyScalar(0.16) });
        const u = (i - 2) * 0.72, m = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.05, 24), mat);
        m.position.set(tc.x + ux * u + tc.fx * 0.1, tc.y + 0.03, tc.z + uz * u + tc.fz * 0.1); g.add(m);
        pads.push({ colour: hex, mesh: m, mat, light(k2) { mat.color.copy(base).multiplyScalar(0.16 + 2.2 * Math.max(0, Math.min(1, k2))); } });
      });
      const scr = canvas(512, 160, (c, w, h) => { c.fillStyle = '#04110a'; c.fillRect(0, 0, w, h); c.fillStyle = '#3cff8a'; c.font = 'bold 40px ui-monospace, Menlo, monospace'; c.fillText('CRAFT: ASLEEP', 22, 62); c.font = '28px ui-monospace, Menlo, monospace'; c.fillText('AWAITING TONES  _', 22, 116); });
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), new THREE.MeshBasicMaterial({ map: scr.tex, color: new THREE.Color(1.3, 1.3, 1.3) }));
      sm.position.set(tc.x - tc.fx * 0.52, tc.y + 0.3, tc.z - tc.fz * 0.52); sm.rotation.y = Math.atan2(tc.fx, tc.fz); sm.rotateX(-0.2); g.add(sm);
      const stand = new THREE.Vector3(tc.x + tc.fx * 1.6, tc.y - 0.86, tc.z + tc.fz * 1.6);      // in front of it, beside the chair
      this.consoleApi = { position: stand, pads, screen: scr, onUse: null, mark: tc, near: (v = k.G.vehicle) => !!v && Math.abs(v.pos.y - stand.y) < 1.5 && Math.hypot(v.pos.x - stand.x, v.pos.z - stand.z) < 2.3 };
      F.console = { x: stand.x, y: stand.y, z: stand.z };
    }
    // The plan table in the situation room.
    const pt = marks.find(m => m.kind === 'plantable');
    if (pt) {
      const { tex } = canvas(1024, 600, (c, w, h) => drawPlanTable(c, w, h));
      const geo = new THREE.PlaneGeometry(pt.w, pt.d); geo.rotateX(-Math.PI / 2); geo.rotateY(Math.PI / 2 - Math.atan2(pt.fz, pt.fx));      // its width across the table, its depth out from the back
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.1, 1.1, 1.1) })); m.position.set(pt.x, pt.y + 0.004, pt.z); g.add(m);
    }
    // The green cheese on the mess table is lit already. Some things want no explaining.
  },
  // Little glowing footprints from the cracked jar to a hole at the foot of the wall.
  _prints(m) {
    const r = this.k.plan.byId[m.room]; if (!r) return;
    const tx = r.x0 + 0.02, n = Math.max(4, Math.floor((m.x - tx) / 0.22)), dots = new THREE.InstancedMesh(new THREE.CircleGeometry(0.025, 8), glow(0.5, 2.4, 0.9), n * 2);
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), S = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3();
    for (let i = 0; i < n; i++) { const x = m.x - 0.4 - i * 0.22, w = Math.sin(i * 1.3) * 0.12; for (const s of [0, 1]) dots.setMatrixAt(i * 2 + s, M4.compose(V.set(x - s * 0.06, m.y + 0.004, m.z + w + (s ? 0.05 : -0.05)), Q, S)); }
    dots.frustumCulled = false; this.baseG.add(dots);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x020202 }));
    hole.position.set(r.x0 + 0.005, m.y, m.z); hole.rotation.y = Math.PI / 2; this.baseG.add(hole);
  },

  // ---- the hangar: the shaft, the platform, the craft, the window
  _hangar(k) {
    const P = k.plan, F = this.F, H = P.byId[F.hangar], g = this.baseG, sq = F.silo, cx = F.cx, cz = F.cz;
    // The shaft over the hangar: its walls from the hangar's ceiling to the doors, with bands, rails and a ladder.
    const yb = H.y + H.h, yt = -0.02, wallT = TX.wallStyle('concrete');
    const shaftM = new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.9, emissiveMap: wallT, emissive: new THREE.Color(0.4, 0.44, 0.52), emissiveIntensity: 0.55, side: THREE.DoubleSide });
    const sh = new Geo(), uv = (a, b, c, d) => [[a / 5.12, c / 5.12], [b / 5.12, c / 5.12], [b / 5.12, d / 5.12], [a / 5.12, d / 5.12]];
    sh.quad([sq.x0, yb, sq.z0], [sq.x1, yb, sq.z0], [sq.x1, yt, sq.z0], [sq.x0, yt, sq.z0], [0, 0, 1], uv(sq.x0, sq.x1, yb, yt));
    sh.quad([sq.x0, yb, sq.z1], [sq.x1, yb, sq.z1], [sq.x1, yt, sq.z1], [sq.x0, yt, sq.z1], [0, 0, -1], uv(sq.x0, sq.x1, yb, yt));
    sh.quad([sq.x0, yb, sq.z0], [sq.x0, yb, sq.z1], [sq.x0, yt, sq.z1], [sq.x0, yt, sq.z0], [1, 0, 0], uv(sq.z0, sq.z1, yb, yt));
    sh.quad([sq.x1, yb, sq.z0], [sq.x1, yb, sq.z1], [sq.x1, yt, sq.z1], [sq.x1, yt, sq.z0], [-1, 0, 0], uv(sq.z0, sq.z1, yb, yt));
    g.add(sh.mesh(shaftM));
    const trim = new Geo(), hz = new Geo(), lit = new Geo();
    for (const y of [yb + 1.5, yb + 3, yb + 4.5]) { trim.box(sq.x0, sq.x1, y, y + 0.12, sq.z0, sq.z0 + 0.1); trim.box(sq.x0, sq.x1, y, y + 0.12, sq.z1 - 0.1, sq.z1); trim.box(sq.x0, sq.x0 + 0.1, y, y + 0.12, sq.z0, sq.z1); trim.box(sq.x1 - 0.1, sq.x1, y, y + 0.12, sq.z0, sq.z1); }
    for (const [x, z] of [[sq.x0 + 0.3, sq.z0 + 0.3], [sq.x1 - 0.3, sq.z0 + 0.3], [sq.x0 + 0.3, sq.z1 - 0.3], [sq.x1 - 0.3, sq.z1 - 0.3]]) trim.box(x - 0.18, x + 0.18, H.y, yt, z - 0.18, z + 0.18);      // the platform's guide rails, floor to top
    for (let y = yb + 0.2; y < yt - 0.3; y += 0.35) trim.box(cx - 0.3, cx + 0.3, y, y + 0.04, sq.z1 - 0.18, sq.z1 - 0.1);       // a ladder up the south wall
    for (const x of [cx - 0.3, cx + 0.3]) trim.box(x - 0.03, x + 0.03, yb, yt, sq.z1 - 0.2, sq.z1 - 0.08);
    for (const [y0, y1] of [[yt - 0.7, yt - 0.35], [yb + 0.05, yb + 0.4]]) { hz.quad([sq.x0, y0, sq.z0 + 0.01], [sq.x1, y0, sq.z0 + 0.01], [sq.x1, y1, sq.z0 + 0.01], [sq.x0, y1, sq.z0 + 0.01], [0, 0, 1], [[0, 0], [32, 0], [32, 0.5], [0, 0.5]]); hz.quad([sq.x0, y0, sq.z1 - 0.01], [sq.x1, y0, sq.z1 - 0.01], [sq.x1, y1, sq.z1 - 0.01], [sq.x0, y1, sq.z1 - 0.01], [0, 0, -1], [[0, 0], [32, 0], [32, 0.5], [0, 0.5]]); hz.quad([sq.x0 + 0.01, y0, sq.z0], [sq.x0 + 0.01, y0, sq.z1], [sq.x0 + 0.01, y1, sq.z1], [sq.x0 + 0.01, y1, sq.z0], [1, 0, 0], [[0, 0], [32, 0], [32, 0.5], [0, 0.5]]); hz.quad([sq.x1 - 0.01, y0, sq.z0], [sq.x1 - 0.01, y0, sq.z1], [sq.x1 - 0.01, y1, sq.z1], [sq.x1 - 0.01, y1, sq.z0], [-1, 0, 0], [[0, 0], [32, 0], [32, 0.5], [0, 0.5]]); }
    for (const y of [yb + 2.2, yb + 3.8]) for (const s of [0.25, 0.5, 0.75]) { const x = sq.x0 + (sq.x1 - sq.x0) * s; lit.box(x - 0.5, x + 0.5, y, y + 0.08, sq.z0 + 0.02, sq.z0 + 0.06); lit.box(x - 0.5, x + 0.5, y, y + 0.08, sq.z1 - 0.06, sq.z1 - 0.02); }
    // the edge of the hole in the hangar's ceiling
    trim.box(sq.x0 - 0.4, sq.x1 + 0.4, yb - 0.3, yb - 0.15, sq.z0 - 0.4, sq.z0); trim.box(sq.x0 - 0.4, sq.x1 + 0.4, yb - 0.3, yb - 0.15, sq.z1, sq.z1 + 0.4); trim.box(sq.x0 - 0.4, sq.x0, yb - 0.3, yb - 0.15, sq.z0, sq.z1); trim.box(sq.x1, sq.x1 + 0.4, yb - 0.3, yb - 0.15, sq.z0, sq.z1);
    g.add(trim.mesh(this.M.steelD), hz.mesh(this.M.haz), lit.mesh(glow(1.8, 1.9, 2.1)));
    // The floor: a hazard ring round the platform, and the amber beacons on the walls.
    const ringT = TX.hazard(); ringT.repeat.set(40, 1);
    const ring = new THREE.Mesh(new THREE.RingGeometry(CRAFT.pad + 0.1, CRAFT.pad + 0.8, 72, 1), new THREE.MeshStandardMaterial({ map: ringT, roughness: 0.7, emissive: 0x6a5410, emissiveIntensity: 0.4, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(cx, H.y + 0.004, cz); g.add(ring);
    const beacons = this.beacons = [];
    for (const [x, z] of [[H.x0 + 0.15, H.z0 + 6], [H.x1 - 0.15, H.z1 - 6], [H.x0 + 0.15, H.z1 - 6], [H.x1 - 0.15, H.z0 + 26]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8, 0, TAU, 0, Math.PI / 2), glow(0.5, 0.3, 0.05)); b.position.set(x, H.y + 7.6, z); b.rotation.z = x < cx ? -Math.PI / 2 : Math.PI / 2; g.add(b); beacons.push(b); }
    // Light on the floor, under the lamps in the ceiling: the hangar and the archive.
    {
      const AR = P.byId['B-archive'], spots = [];
      for (const x of [H.x0 + 5, H.x1 - 5]) for (const z of [H.z0 + 9, (H.z0 + H.z1) / 2, H.z1 - 7]) spots.push([x, H.y, z, 7, 0.16]);
      if (AR) for (const x of [AR.x0 + 8, AR.x0 + 20, AR.x0 + 32]) for (const z of [AR.z0 + 8, AR.z1 - 8]) spots.push([x, AR.y, z, 6.5, 0.2]);
      const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: false }), spots.length);
      const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), S = new THREE.Vector3(), V = new THREE.Vector3(), c = new THREE.Color();
      spots.forEach(([x, y, z, r, kk], i) => { pools.setMatrixAt(i, M4.compose(V.set(x, y + 0.01, z), Q, S.set(r * 2, r * 2, 1))); pools.setColorAt(i, c.setRGB(kk, kk * 1.02, kk * 1.08)); });
      pools.frustumCulled = false; pools.renderOrder = 4; g.add(pools);
    }
    // A crane beam across the south end, high up (solid: a drone up there hits it).
    { const cb = new Geo(), zc = H.z1 - 3.5, yc = H.y + H.h - 1.6; cb.box(H.x0, H.x1, yc, yc + 0.6, zc - 0.3, zc + 0.3); cb.box(cx + 6, cx + 8, yc - 0.5, yc, zc - 0.5, zc + 0.5); const hk = new THREE.CylinderGeometry(0.02, 0.02, 3, 4); g.add(cb.mesh(self(0xc9a23a, 0.3))); const hm = new THREE.Mesh(hk, this.M.steel); hm.position.set(cx + 7, yc - 2, zc); g.add(hm);
      P.obstacles.push({ x0: H.x0, x1: H.x1, z0: zc - 0.3, z1: zc + 0.3, y0: yc, y1: yc + 0.6 }); }
    // The control room's window, and a rail at its foot.
    if (F.window) {
      const w = F.window, zm = (w.z0 + w.z1) / 2, gl = new Geo(), fr = new Geo();
      gl.box(w.x0, w.x1, w.y, w.y + w.h, zm - 0.012, zm + 0.012);
      for (let x = w.x0; x <= w.x1 + 1e-6; x += (w.x1 - w.x0) / 8) fr.box(x - 0.04, x + 0.04, w.y, w.y + w.h, zm - 0.05, zm + 0.05);
      fr.box(w.x0, w.x1, w.y, w.y + 0.12, zm - 0.06, zm + 0.06); fr.box(w.x0, w.x1, w.y + w.h - 0.08, w.y + w.h, zm - 0.06, zm + 0.06);
      g.add(gl.mesh(this.M.glass), fr.mesh(this.M.steelD));
    }
    // The platform, and the craft on it.
    const plat = this.platG = new THREE.Group(); plat.position.set(cx, F.fl, cz); g.add(plat);
    const padT = canvas(1024, 1024, (c, w, h) => drawPad(c, w, h)).tex;
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(CRAFT.pad, CRAFT.pad, 1, 64, 1), [self(0x3a4046, 0.3, { metalness: 0.5 }), new THREE.MeshStandardMaterial({ map: padT, roughness: 0.55, metalness: 0.35, emissiveMap: padT, emissive: 0xffffff, emissiveIntensity: 0.38 }), this.M.steelD]);
    pad.scale.y = 0.03; pad.position.y = 0.015; plat.add(pad); this.padMesh = pad;
    const edge = this.padLamps = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 0.03, 0.12), new THREE.MeshBasicMaterial({ color: 0xffffff }), 36);
    { const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), c = new THREE.Color(2.2, 1.3, 0.25); for (let i = 0; i < 36; i++) { const a = i / 36 * TAU; Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a); edge.setMatrixAt(i, M4.compose(V.set(Math.cos(a) * (CRAFT.pad - 0.3), 0.035, Math.sin(a) * (CRAFT.pad - 0.3)), Q, S)); edge.setColorAt(i, c); } }
    edge.frustumCulled = false; plat.add(edge);
    const craft = this.craft = buildCraft(this.M); craft.group.position.set(cx, F.platformTop, cz); g.add(craft.group);
    this.rampU = 0; this.rampTo = 0;
    const me = this, beam = new THREE.Vector3();
    this.hangar = {
      saucer: craft.group, rim: { lamps: craft.lamps, colour(fn) { me.rimFn = fn || null; } },
      get beamOrigin() { return beam.set(F.beam.x, F.beam.y, F.beam.z); },
      centre: new THREE.Vector3(cx, F.platformTop, cz),
      shaft: { x0: sq.x0, x1: sq.x1, z0: sq.z0, z1: sq.z1, top: 0, bottom: yb },
      hangarRoom: H, archive: P.byId['B-archive'], controlRoom: P.byId['B-ctrl'],
      craft: { group: craft.group, get lift() { return F.craftLift; }, set(l) { F.setCraft(l); me._placeCraft(); } },
      platform: { group: plat, get lift() { return F.platformLift; }, get top() { return F.platformTop + F.platformLift; }, set(l) { F.setPlatform(l); me._placeCraft(); } },
      doors: { get k() { return F.doorsK; }, get moving() { return !!me.doorsAnim; }, open(secs = 6) { me._doorsTo(1, secs); }, close(secs = 6) { me._doorsTo(0, secs); }, set(kk) { me._doorsTo(kk, 0); } },
      ramp: { group: craft.ramp, get down() { return me.rampU === 0 && me.rampTo === 0; }, get moving() { return me.rampU !== me.rampTo; }, lower() { me.rampTo = 0; me.k.sound.grind(2); }, raise() { me.rampTo = 1; F.setRamp(false); me.k.sound.grind(2); } },
      easels: [],
    };
    this._placeCraft();
  },
  _placeCraft() {
    const F = this.F;
    if (this.platG) { this.platG.position.y = F.fl + F.platformLift; this.padMesh.scale.y = Math.max(0.03, F.platformLift + 0.03); this.padMesh.position.y = 0.03 - this.padMesh.scale.y / 2; }
    if (this.craft) { this.craft.group.position.y = F.platformTop + F.platformLift + F.craftLift; this.craft.group.updateMatrixWorld(true); }
  },

  // ---- the archive: easels, and the pictures on them
  _archive(k) {
    const F = this.F, g = this.baseG, list = F.easels || [], me = this;
    if (!list.length) return;
    const legs = new Geo();
    for (const e of list) {
      const x = e.x, z = e.z, y = e.y;
      legs.box(x - 0.05, x + 0.05, y, y + 1.8, z - 0.42, z - 0.34); legs.box(x - 0.05, x + 0.05, y, y + 1.8, z + 0.34, z + 0.42);      // the front legs
      legs.box(x - 0.3, x - 0.22, y, y + 1.6, z - 0.04, z + 0.04);                                                                // the back leg
      legs.box(x + 0.02, x + 0.16, y + 0.78, y + 0.84, z - 0.5, z + 0.5);                                                         // the ledge
    }
    g.add(legs.mesh(this.M.wood));
    const unit = new THREE.PlaneGeometry(1, 1), blank = TX.flat(40, 36, 32), frameG = new Geo(), loader = new THREE.TextureLoader();
    const easels = this.hangar.easels;
    list.forEach((e, i) => {
      const mat = new THREE.MeshStandardMaterial({ color: 0x4c4c4c, map: blank, emissiveMap: blank, emissive: 0xffffff, emissiveIntensity: 0.22, roughness: 0.6 });
      const mesh = new THREE.Mesh(unit, mat); mesh.rotation.y = Math.PI / 2; mesh.visible = false; g.add(mesh);
      const art = { work: null, mesh, mat, w: 1, h: 1, obj: false, tex: null, tier: 0, url: null, busy: false };
      easels.push({ art, position: new THREE.Vector3(e.x + 0.14, e.y + 1.5, e.z), normal: new THREE.Vector3(1, 0, 0), light(k2) { mat.emissiveIntensity = 0.22 + 0.9 * Math.max(0, Math.min(1, k2)); } });
    });
    this.frameG = frameG;
    // Which pictures: public-domain paintings from the saved copy of the collection, not any hung upstairs tonight, chosen the same way each time.
    fetch('data/collection.json').then(r => r.json()).then(data => {
      const hung = new Set((k.museum.arts || []).map(a => a.work && a.work.id));
      const ok = w => w && !w.c && w.k === 'Painting' && w.img && w.w > 30 && w.h > 30 && w.w < 260 && w.h < 260;
      let pool = (data.works || []).filter(w => ok(w) && !hung.has(w.id));
      if (pool.length < easels.length) pool = (data.works || []).filter(ok);
      // (where there is an offline copy of the images, the works in it first: src/collection.js imageUrl)
      const here = w => !/artic\.edu/.test(imageUrl(w, 400));
      pool.sort((a, b) => (here(b) - here(a)) || a.id - b.id);
      const nHere = pool.filter(here).length; if (nHere >= easels.length) pool = pool.slice(0, nHere);
      const step = Math.max(1, Math.floor(pool.length / easels.length));
      const frames = new Geo();
      easels.forEach((E, i) => {
        const w = pool[(i * step + 3) % pool.length]; if (!w) return;
        const big = Math.max(w.w, w.h) / 100, s = Math.min(1.5 / (w.w / 100), 1.25 / (w.h / 100), Math.max(1, 0.9 / big)), W = w.w / 100 * s, Hh = w.h / 100 * s;      // its own size, but none smaller than 90 cm along its longer side, nor too big for an easel
        const a = E.art; a.work = w; a.w = W; a.h = Hh;
        const ex = list[i].x + 0.17, ey = list[i].y + 0.84 + Hh / 2, ez = list[i].z;
        a.mesh.position.set(ex, ey, ez); a.mesh.scale.set(W, Hh, 1); a.mesh.visible = true; E.position.set(ex, ey, ez);
        frames.box(ex - 0.04, ex - 0.005, ey - Hh / 2 - 0.06, ey + Hh / 2 + 0.06, ez - W / 2 - 0.06, ez + W / 2 + 0.06);
        if (w.lq) loader.load(w.lq, t => { if (a.tex) return; t.colorSpace = THREE.SRGBColorSpace; a.mat.map = a.mat.emissiveMap = t; a.mat.needsUpdate = true; });
        // and the picture itself, fetched and handed over the way the museum's are (src/museum.js: a worker, one a frame)
        try { k.museum._load(a, 1); } catch { /* the small one will do */ }
      });
      g.add(me.hangar.frames = frames.mesh(self(0xa8843a, 0.35, { metalness: 0.6, roughness: 0.4 })));      // (hangar.frames: the beam takes them with their pictures, src/finalelaunch.js)
    }).catch(() => { /* no pictures: the easels stand empty */ });
  },

  // ---- lettering on the crates and the signs
  _labels(k) {
    const marks = (k.plan.marks || []).filter(m => m.kind === 'blabel' && /^B-/.test(m.room) && BLABELS[m.k]);
    if (!marks.length) return;
    const { tex, cells } = labelSheet(), geo = new Geo();
    for (const m of marks) {
      const c = cells[m.k], asp = c.w / c.h; let w = m.w, h = w / asp; if (h > m.h) { h = m.h; w = h * asp; }
      const ux = m.fz, uz = -m.fx, P = (su, sy) => [m.x + ux * su * w / 2, m.y + sy * h / 2, m.z + uz * su * w / 2];
      geo.quad(P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), [m.fx, 0, m.fz], [[c.u0, c.v0], [c.u1, c.v0], [c.u1, c.v1], [c.u0, c.v1]]);
    }
    const lm = geo.mesh(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, color: new THREE.Color(0.85, 0.85, 0.85) }));
    lm.renderOrder = 3; this.baseG.add(lm);
  },

  // ---- a few security robots, on beats of their own (src/guards.js runs them, as it runs every other)
  _robots(k) {
    const G = features.find(f => f.id === 'guards');
    if (!G || !G.bots || !G._makeBot) return;
    for (const rooms of [['B-conc'], ['B-archive'], ['B-labB']]) {
      if (!rooms.every(id => k.plan.byId[id])) continue;
      try { const p = beat(k.plan, rooms, 'bot-' + rooms[0]); if (!p) continue; const b = G._makeBot(p, G.bots.length); G._home(b, Math.floor(p.n / 3)); b.base = true; G.bots.push(b); } catch (e) { console.warn('finale: no robot for', rooms, e); }
    }
  },

  // ---------------------------------------------------------------- in the base, each frame
  _baseTick(dt, k, p, cam) {
    const t = this.t, F = this.F;
    // The rim lights chase round; the beacons and the console's screen breathe.
    if (this.craft && Math.abs(cam.x - F.cx) < 90 && Math.abs(cam.z - F.cz) < 90) {
      const L = this.craft.lamps, c = this._c2 || (this._c2 = new THREE.Color());
      for (let i = 0; i < L.count; i++) { const o = this.rimFn && this.rimFn(i, t); if (o) L.setColorAt(i, o); else { const q = 0.5 + 0.5 * Math.sin(t * 2.2 - i * 0.55); L.setColorAt(i, c.setRGB(0.25 + 1.6 * q, 1.2 + 0.9 * q, 0.6 + 1.4 * (1 - q))); } }
      L.instanceColor.needsUpdate = true;
      this.craft.port.material.color.setRGB(0.15, 0.6 + 0.25 * Math.sin(t * 1.7), 0.4);
    }
    if (this.xtalMat) { const q = 0.8 + 0.2 * Math.sin(t * 1.4); this.xtalMat.color.setRGB(q, q, q); }
    // The chair: when you come up behind it, it turns round.
    if (this.chair) {
      const a = this.chairAt, d = Math.hypot(p.x - a.x, p.z - a.z);
      if (d < 3.6 && Math.abs(p.y - a.y) < 1.5 && !this.chairTurn) { this.chairTurn = 0.001; k.sound.creak(); }
      if (this.chairTurn && this.chairTurn < 1) {
        this.chairTurn = Math.min(1, this.chairTurn + dt / 2.2); this.chair.rotation.y = this.chairFace + Math.PI * ease(this.chairTurn);
        if (this.chairTurn >= 1) k.say('Oh. Only a mouse. A glowing one, in the big chair.', 0, 5);
      }
      if (this.chair.userData.mouse) this.chair.userData.mouse.material.color.setRGB(0.5, 1.8 + 0.4 * Math.sin(t * 3), 0.7);
    }
    // Arriving in each room, the first time.
    const id = k.G.roomId;
    if (id && /^B-/.test(id) && !this.seenRooms.has(id)) { this.seenRooms.add(id); this._arrive(id, k); }
    if (this.save.state !== 'locked' || !id || !/^B-/.test(id) || id === 'B-tunnel') return;
    this.setState('found');
  },
  _arrive(id, k) {
    const line = {
      'B-check': ['PROJECT GREEN CHEESE', 'A base, under Butler Field. The guard on duty has not moved in years.'],
      'B-labB': [null, 'Crystals in jars, glowing. One jar is empty, and something small chewed its way out.'],
      'B-labA': [null, 'A laboratory. Somebody left in a hurry.'],
      'B-bay': [null, 'Robots on their chargers. Most of them are asleep.'],
      'B-mess': [null, 'The mess. There is cheese. It is green.'],
      'B-power': [null, 'Whatever this runs on, it is still running.'],
      'B-office': [null, 'The Director had another office.'],
      'B-sit': [null, 'A table with the whole park on it, and a square in the ballfield marked SILO.'],
      'B-ctrl': [null, 'A console with five dark pads. A chair faces the window.'],
      'B-archive': [null, 'Pictures from upstairs, on easels. RECOVERED, say the crates.'],
      'B-hangar': ['THE HANGAR', 'It is real, and it is full size.'],
    }[id];
    if (!line) return;
    if (line[0]) k.callout(line[0]);
    k.say(line[1], line[0] ? 0.8 : 0.2, 6);
    if (id === 'B-hangar') { if (k.find('greencheese')) k.sound.finish(); }
  },

  spots() {
    const out = [], F = this.F; if (!F) return out;
    if (this.cardAt) out.push({ kind: 'thing', id: 'keycard', name: 'The keycard', ...this.cardAt });
    if (F.blast) out.push({ kind: 'thing', id: 'blastdoor', name: 'The blast door', x: F.blast.x, y: F.blast.y, z: F.blast.z });
    out.push({ kind: 'secret', id: 'greencheese', name: 'Project Green Cheese (the hangar)', x: F.cx, y: F.fl, z: F.cz });
    return out;
  },
  // A new game: the card back on its stand, the door shut, the silo shut, the base not found.
  fresh(k) {
    if (!this.F) return;
    this.save = { state: 'locked', card: false, door: false }; this._store();
    delete k.plan.levels.B;
    this._blastAt(0); this.blastAnim = null;
    if (this.cardMesh) this.cardMesh.visible = this.cardHalo.visible = true;
    this._doorsTo(0, 0);
    this.seenRooms.clear(); this.chairTurn = 0; if (this.chair) this.chair.rotation.y = this.chairFace;
  },
});

// ======================================================================= models

// A sign on a dark plate: lines of [text, colour, size].
function plate(lines, w, h) {
  const { tex } = canvas(512, Math.round(512 * h / w), (c, W, H) => {
    c.fillStyle = '#14191e'; c.fillRect(0, 0, W, H); c.strokeStyle = '#8a9096'; c.lineWidth = 6; c.strokeRect(8, 8, W - 16, H - 16);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    lines.forEach(([t, col, size], i) => { c.fillStyle = col; c.font = `bold ${size}px Impact, "Arial Narrow Bold", "Arial Black", sans-serif`; const m = c.measureText(t).width; if (m > W - 40) c.font = `bold ${size * (W - 40) / m}px Impact, "Arial Black", sans-serif`; c.fillText(t, W / 2, H * (lines.length === 1 ? 0.54 : 0.34 + i * 0.4)); });
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.95, 0.95, 0.95) }));
}

// A squat wheeled robot, like the ones upstairs (src/guards.js) but plainer: parked, or switched off for good.
function robotMesh(M, awake) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.62, 16), M.steel); body.position.y = 0.33; g.add(body);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.08, 16), M.black); skirt.position.y = 0.05; g.add(skirt);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 10, 0, TAU, 0, Math.PI / 2), M.steelD); head.position.y = 0.64; g.add(head);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), awake ? glow(0.4, 2.2, 0.8) : glow(0.05, 0.07, 0.09)); lens.position.set(0, 0.8, 0.245); lens.rotation.x = -0.35; g.add(lens);
  const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), M.steel); prong.position.set(0, 1.0, -0.03); g.add(prong);
  return g;
}

// The big chair: five feet, a column, a seat, a tall back. And the mouse in it.
function swivelChair(M) {
  const g = new THREE.Group(), leather = self(0x3a1612, 0.2, { roughness: 0.45 });
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU, f = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.36), M.steel); f.position.set(Math.sin(a) * 0.17, 0.05, Math.cos(a) * 0.17); f.rotation.y = a; g.add(f); }
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.42, 10), M.steel); col.position.y = 0.26; g.add(col);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.58), leather); seat.position.y = 0.52; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.66, 1.1, 0.16), leather); back.position.set(0, 1.1, -0.3); back.rotation.x = -0.12; g.add(back);
  for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.5), leather); arm.position.set(s * 0.34, 0.78, -0.02); g.add(arm); }
  // the mouse: sitting up, facing the window, very pleased with itself
  const mm = glow(0.5, 1.8, 0.7), mouse = new THREE.Group();
  const bd = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), mm); bd.scale.set(1, 1.2, 1.3); mouse.add(bd);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), mm); hd.position.set(0, 0.07, 0.05); mouse.add(hd);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.CircleGeometry(0.022, 10), mm); ear.position.set(s * 0.03, 0.105, 0.045); mouse.add(ear); }
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.006, 4, 12, Math.PI), mm); tail.position.set(0, -0.04, -0.09); tail.rotation.y = Math.PI / 2; mouse.add(tail);
  mouse.position.set(0, 0.66, 0.05); g.add(mouse); g.userData.mouse = bd;
  for (const m of mouse.children) m.material = mm;
  return g;
}

// The craft: the toy saucer (garage.js buildSaucer), sixteen metres across and done properly. Its origin is the foot of
// its legs; it faces its door, and its ramp, to -x. Shapes from CRAFT (src/finaleplan.js), where its collision is too.
function buildCraft(M) {
  const C = CRAFT, g = new THREE.Group(), body = new THREE.Group(); g.add(body); g.name = 'the craft';
  const panel = canvas(1024, 256, (c, w, h) => {
    c.fillStyle = '#c9d1d6'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(40,48,56,.55)'; c.lineWidth = 2; for (let i = 0; i <= 48; i++) { c.beginPath(); c.moveTo(i * w / 48, 0); c.lineTo(i * w / 48, h); c.stroke(); }
    for (const y of [h * 0.3, h * 0.62]) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.fillStyle = 'rgba(60,70,80,.5)'; for (let i = 0; i < 48; i++) for (const y of [h * 0.3 - 6, h * 0.62 - 6]) { c.beginPath(); c.arc(i * w / 48 + 10, y, 2, 0, 7); c.fill(); }
  }).tex;
  panel.wrapS = THREE.RepeatWrapping;
  const hull = new THREE.MeshStandardMaterial({ color: 0xc4ccd2, map: panel, roughness: 0.28, metalness: 0.7, emissive: 0x3e474f, emissiveIntensity: 0.75, side: THREE.DoubleSide });
  const dark = new THREE.MeshStandardMaterial({ color: 0x23282e, roughness: 0.45, metalness: 0.6, emissive: 0x15191d, emissiveIntensity: 0.6, side: THREE.DoubleSide });
  const door = Math.PI * 1.5, gap = C.door;
  const lathe = (pts, mat, cut = true) => { const geo = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 96, cut ? door + gap : 0, cut ? TAU - 2 * gap : TAU); const m = new THREE.Mesh(geo, mat); body.add(m); return m; };
  // underneath: the skirt from the belly out, then the lower hull to the rim
  lathe([[C.bellyR, C.belly], [4.6, C.belly + 0.38], [C.skirtR, C.skirtY]], hull, false);
  lathe([[C.skirtR, C.skirtY], [7.2, 2.2], [7.8, 2.36], [C.R, C.rimLow]], hull);
  lathe([[C.R, C.rimLow], [C.R + 0.08, C.rimLow + 0.05], [C.R + 0.08, C.rim - 0.05], [C.R, C.rim]], dark);
  const up = []; for (let i = 0; i <= 14; i++) { const r = C.R - (C.R - C.domeR) * i / 14; up.push([r, hullY(r)]); }
  lathe(up, hull);
  // the dome, glass, with a frame round its foot
  const dome = new THREE.Mesh(new THREE.SphereGeometry(C.domeR, 48, 20, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9fe8ff, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.24, emissive: 0x3fb6d8, emissiveIntensity: 0.3, depthWrite: false }));
  dome.scale.y = (C.top - C.domeY) / C.domeR; dome.position.y = C.domeY; dome.renderOrder = 5; body.add(dome);
  const foot = new THREE.Mesh(new THREE.TorusGeometry(C.domeR, 0.09, 8, 64), dark); foot.rotation.x = Math.PI / 2; foot.position.y = C.domeY + 0.02; body.add(foot);
  // the doorway's sides, and its sill
  for (const s of [-1, 1]) {
    const a = door + s * gap, j = new THREE.Mesh(new THREE.BoxGeometry(0.08, C.rim + 0.6 - C.rimLow, C.R - C.cabinR + 0.4), dark);
    j.position.set(Math.sin(a) * (C.R + C.cabinR) / 2, (C.rimLow + C.rim + 0.6) / 2, Math.cos(a) * (C.R + C.cabinR) / 2); j.rotation.y = a; body.add(j);
  }
  // the cabin: its floor, lit in rings, a pedestal of controls under the dome, two seats, a strip of light round the edge
  const floorT = canvas(512, 512, (c, w, h) => { c.fillStyle = '#20262c'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(120,255,190,.5)'; c.lineWidth = 3; for (const r of [0.2, 0.36, 0.5]) { c.beginPath(); c.arc(w / 2, h / 2, r * w, 0, 7); c.stroke(); } c.strokeStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 24; i++) { const a = i / 24 * 7; c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + Math.cos(a) * w / 2, h / 2 + Math.sin(a) * w / 2); c.stroke(); } }).tex;
  const fl = new THREE.Mesh(new THREE.CircleGeometry(C.cabinR + 0.4, 64), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.5, metalness: 0.4, emissiveMap: floorT, emissive: 0xffffff, emissiveIntensity: 0.5 }));
  fl.rotation.x = -Math.PI / 2; fl.position.y = C.floor + 0.004; body.add(fl);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 1.0, 24), dark); ped.position.y = C.floor + 0.5; body.add(ped);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.04, 6, 32), glow(0.4, 2.0, 1.3)); ring.rotation.x = Math.PI / 2; ring.position.y = C.floor + 1.0; body.add(ring);
  for (const a of [0.6, -0.6]) { const s = new THREE.Group(), seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.7), dark), bk = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.12), dark); seat.position.y = 0.5; bk.position.set(0, 0.95, -0.35); s.add(seat, bk); s.position.set(Math.sin(a) * 2.2, C.floor, Math.cos(a) * 2.2); s.rotation.y = a + Math.PI; body.add(s); }
  const strip = new THREE.Mesh(new THREE.TorusGeometry(6.4, 0.05, 6, 96), glow(0.3, 1.4, 1.6)); strip.rotation.x = Math.PI / 2; strip.position.y = hullY(6.4) - 0.3; body.add(strip);
  // the port underneath, where the beam comes from
  const port = new THREE.Mesh(new THREE.CircleGeometry(2.0, 40), glow(0.15, 0.7, 0.4)); port.rotation.x = Math.PI / 2; port.position.y = C.belly - 0.01; body.add(port);
  const portRim = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.08, 6, 48), dark); portRim.rotation.x = Math.PI / 2; portRim.position.y = C.belly - 0.02; body.add(portRim);
  // rim lamps
  const n = 30, lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), n);
  { const M4 = new THREE.Matrix4(), V = new THREE.Vector3(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), c = new THREE.Color(1, 1, 1); for (let i = 0; i < n; i++) { const a = door + gap + 0.12 + (TAU - 2 * gap - 0.24) * i / (n - 1); lamps.setMatrixAt(i, M4.compose(V.set(Math.sin(a) * (C.R + 0.24), (C.rimLow + C.rim) / 2, Math.cos(a) * (C.R + 0.24)), Q, S)); lamps.setColorAt(i, c); } }
  lamps.frustumCulled = false; body.add(lamps);
  // legs, clear of the doorway
  for (const a of [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]) {
    const fx = Math.cos(a), fz = Math.sin(a), top = new THREE.Vector3(fx * (C.legR - 1.1), C.belly + 0.6, fz * (C.legR - 1.1)), ft = new THREE.Vector3(fx * C.legR, 0.18, fz * C.legR);
    const len = top.distanceTo(ft), strut = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, len, 10), dark);
    strut.position.copy(top).add(ft).multiplyScalar(0.5); strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(ft).normalize()); g.add(strut);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.18, 16), dark); pad.position.copy(ft).setY(0.09); g.add(pad);
  }
  // the ramp: hinged at the sill; down, it lies at its slope to the floor; up, it is drawn level and slid into the hull
  const rampG = new THREE.Group(), Lr = Math.hypot(C.rampLen, C.floor - 0.02), th = Math.atan2(C.floor - 0.02, C.rampLen);
  rampG.position.set(-(C.R - 0.4), C.floor, 0); g.add(rampG);
  const plank = new THREE.Group(); rampG.add(plank);
  // its tread: ribs across it, as the flying craft's own ramp has (craft.js). Nothing on it points.
  const ribs = canvas(64, 64, (c, w, h) => { c.fillStyle = '#20242a'; c.fillRect(0, 0, w, h); c.fillStyle = '#9aa3ab'; c.fillRect(8, 5, 16, h - 10); c.fillStyle = '#0c0e11'; c.fillRect(24, 5, 5, h - 10); }).tex; ribs.wrapS = ribs.wrapT = THREE.RepeatWrapping; ribs.repeat.set(Math.round(Lr / 0.3), 1);
  const top = new THREE.Mesh(new THREE.BoxGeometry(Lr, 0.12, C.rampW), [dark, dark, new THREE.MeshStandardMaterial({ color: 0x8a949c, map: ribs, roughness: 0.6, metalness: 0.4, emissive: 0x2a3036, emissiveIntensity: 0.6 }), dark, dark, dark]);
  top.position.set(-Lr / 2, -0.06, 0); plank.add(top);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(Lr, 0.06, 0.08), glow(0.95, 0.72, 0.2)); e.position.set(-Lr / 2, 0.01, s * (C.rampW / 2 - 0.04)); plank.add(e); }
  const setRamp = u => {      // 0: down; 1: stowed
    const a = Math.min(1, u * 2), b = Math.max(0, u * 2 - 1);
    plank.rotation.z = th * (1 - a); plank.position.set(Lr * b, -0.3 * a, 0);
  };
  setRamp(0);
  return { group: g, body, lamps, port, ramp: rampG, setRamp, dome };
}

// ======================================================================= pictures drawn on canvases

function drawTunnelMap(c, w, h) {
  c.fillStyle = '#0d2238'; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(160,200,255,.12)'; c.lineWidth = 1; for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y < h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  c.strokeStyle = '#e8f0ff'; c.fillStyle = '#e8f0ff'; c.lineWidth = 4; c.font = 'bold 30px ui-monospace, Menlo, monospace';
  c.fillText('PROJECT GREEN CHEESE', 40, 56); c.font = '20px ui-monospace, Menlo, monospace'; c.fillText('ACCESS TUNNEL  ·  EYES ONLY', 40, 86);
  const y = 330;
  c.strokeRect(40, y - 60, 130, 120); c.fillText('SUB-LEVEL 9', 44, y + 92); c.fillText('YOU ARE HERE', 44, y + 120);
  c.fillStyle = '#ffd34d'; c.beginPath(); c.arc(150, y, 10, 0, 7); c.fill();
  c.setLineDash([18, 10]); c.strokeStyle = '#9fd86a'; c.lineWidth = 8; c.beginPath(); c.moveTo(170, y); c.lineTo(700, y); c.stroke(); c.setLineDash([]);
  c.strokeStyle = 'rgba(232,240,255,.6)'; c.lineWidth = 2; c.fillStyle = '#e8f0ff';
  for (const [x, t] of [[230, 'RAILWAY'], [610, 'COLUMBUS DR']]) { c.beginPath(); c.moveTo(x, 140); c.lineTo(x, 520); c.moveTo(x + 22, 140); c.lineTo(x + 22, 520); c.stroke(); c.fillText(t, x - 30, 130); }
  c.strokeStyle = '#e8f0ff'; c.lineWidth = 4; c.strokeRect(700, 150, 280, 380); c.fillText('BUTLER FIELD', 760, 140);
  c.lineWidth = 2; for (const [x0, y0, x1, y1] of [[700, 300, 760, 360], [760, 230, 980, 300], [760, 360, 980, 420], [880, 420, 980, 530]]) c.strokeRect(x0, y0, x1 - x0, y1 - y0);
  c.fillStyle = '#ffb347'; c.fillRect(890, 450, 70, 70); c.fillStyle = '#0d2238'; c.font = 'bold 18px ui-monospace, Menlo, monospace'; c.fillText('SILO', 902, 492);
  c.fillStyle = '#e8f0ff'; c.font = '20px ui-monospace, Menlo, monospace'; c.fillText('190 m', 400, y - 18);
}
function drawPlanTable(c, w, h) {
  c.fillStyle = '#071a14'; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(80,255,160,.15)'; c.lineWidth = 1; for (let x = 0; x < w; x += 25) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y < h; y += 25) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  c.strokeStyle = '#5dff9d'; c.fillStyle = '#5dff9d'; c.lineWidth = 3; c.font = 'bold 26px ui-monospace, Menlo, monospace';
  c.strokeRect(40, 80, 380, 440); c.fillText('THE MUSEUM', 120, 300);
  c.strokeRect(470, 60, 500, 480); c.fillText('BUTLER FIELD', 600, 50);
  c.setLineDash([12, 8]); c.beginPath(); c.moveTo(300, 250); c.lineTo(560, 250); c.lineTo(860, 250); c.lineTo(860, 420); c.stroke(); c.setLineDash([]);
  c.fillStyle = '#ffb347'; c.fillRect(820, 400, 90, 90); c.fillStyle = '#071a14'; c.font = 'bold 22px ui-monospace, Menlo, monospace'; c.fillText('SILO', 838, 452);
  c.fillStyle = '#5dff9d'; c.font = '22px ui-monospace, Menlo, monospace'; c.fillText('PHASE 3: UP', 520, 590 - 30);
}
function drawPad(c, w, h) {
  c.fillStyle = '#2c3238'; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#d8a418'; c.lineWidth = 18; for (const r of [0.47, 0.3]) { c.beginPath(); c.arc(w / 2, h / 2, r * w, 0, 7); c.stroke(); }
  c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 4; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * w * 0.3, h / 2 + Math.sin(a) * w * 0.3); c.lineTo(w / 2 + Math.cos(a) * w * 0.47, h / 2 + Math.sin(a) * w * 0.47); c.stroke(); }
  c.fillStyle = '#e9e2c8'; c.font = 'bold 54px Impact, "Arial Black", sans-serif'; c.textAlign = 'center'; c.fillText('LAUNCH PAD 1', w / 2, h * 0.12 + 40);
}

// The sheet of lettering for the base: every label once, and where each is on it.
function labelSheet() {
  const SW = 2048, SH = 1024, cv = document.createElement('canvas'); cv.width = SW; cv.height = SH;
  const c = cv.getContext('2d'), cells = [], F = 'Impact, "Arial Narrow Bold", "Helvetica Neue Condensed Bold", "Arial Black", sans-serif';
  let x = 0, y = 0, rowH = 0;
  BLABELS.forEach((L, k) => {
    const w = L.kind === 'sign' ? 384 : 512, h = L.kind === 'sign' ? 256 : 128;
    if (x + w > SW) { x = 0; y += rowH; rowH = 0; }
    rowH = Math.max(rowH, h);
    c.save(); c.translate(x, y); c.textAlign = 'center'; c.textBaseline = 'middle';
    const fit = (text, px, room) => { c.font = `bold ${px}px ${F}`; const m = c.measureText(text).width; if (m > room) c.font = `bold ${px * room / m}px ${F}`; };
    if (L.kind === 'stencil') { c.fillStyle = 'rgba(16,16,14,.88)'; fit(L.t, 84, w - 36); c.fillText(L.t, w / 2, h / 2 + 4); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; for (let i = 60; i < w; i += 74) c.fillRect(i, 0, 5, h); c.globalCompositeOperation = 'source-over'; }
    else if (L.kind === 'plate') { c.fillStyle = '#101214'; c.fillRect(4, 14, w - 8, h - 28); c.strokeStyle = '#8a8f94'; c.lineWidth = 4; c.strokeRect(8, 18, w - 16, h - 36); c.fillStyle = '#e9ecee'; fit(L.t, 62, w - 60); c.fillText(L.t, w / 2, h / 2 + 3); }
    else { c.fillStyle = '#e2ad1b'; c.fillRect(0, 0, w, h); c.strokeStyle = '#111'; c.lineWidth = 10; c.strokeRect(12, 12, w - 24, h - 24); c.fillStyle = '#111'; fit(L.t, 72, w - 56); c.fillText(L.t, w / 2, 100); if (L.s) { fit(L.s, 40, w - 60); c.fillText(L.s, w / 2, 176); } }
    c.restore();
    cells[k] = { u0: x / SW, u1: (x + w) / SW, v0: 1 - (y + h) / SH, v1: 1 - y / SH, w, h };
    x += w;
  });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return { tex, cells };
}
