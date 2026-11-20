// What is on no drawing.
//
// One picture in the building has something wrong with a part of it. The whiteboard in the
// Director's office says which picture and which part (src/whiteboards.js shows it; the words are
// written here, from tonight's hang, so the board and the picture always agree). Look closer at
// that picture and touch that part, and a piece of the wall of its room slides aside. Behind it a
// passage leads to a stair, and the stair goes down past every other floor to a store twelve
// metres under the street. (The rooms themselves are in the plan like any others, marked `secret`:
// tools/build_layout.mjs, section 8. Their furniture is src/secretfit.js.)
//
// This file is the rest of it: choosing the picture, the touch, the piece of wall that moves, and
// what cannot be made of painted boxes down below (the glass jars and what floats in them, the
// lettering, the saucer on its pedestal, the one more monitor with a game on it).
//
// Which picture: the first on the list in src/secretclue.js that is hung tonight, in its own room.
// The passage was built behind one particular room, though (plan.secret says which). If tonight's
// first choice hangs somewhere else, the clue falls back to a picture in the room the passage is
// behind; if that room has no picture at all, the whole thing is left out and the wall stays a wall.
//
// Kept between visits ('after-hours.secret'): that the wall is open, and that the clue has been
// read. A new game shuts it again. The trophies and the toy it unlocks are kept for good.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Geo } from './geo.js';
import { wallPoint } from './plan.js';
import { CLUES, isClue, CORNER } from './secretclue.js';
import { LABELS } from './secretfit.js';
import { buildSaucer } from './garage.js';
import { Outpost } from './arcadegames.js';

const KEY = 'after-hours.secret';
const SLIDE = 1.9;                    // seconds the wall takes to open
const ease = k => k * k * (3 - 2 * k);

export class Secret {
  // G: the game. ui: { say, callout, endStudy, trophies, boards, canvas }.
  constructor(G, ui) {
    this.G = G; this.ui = ui; this.plan = G.plan; this.museum = G.museum;
    const plan = this.plan;
    this.site = plan.secret; this.door = plan.doors.find(d => d.hidden) || null;
    this.open = false; this.clueRead = false; this.k = 0; this.tap = null; this.tapUntil = 0; this.t = 0; this.wobble = 0; this.arrived = false; this.told = false;
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) { this.open = !!s.open; this.clueRead = !!s.read; this.arrived = !!s.arrived; } } catch { /* no storage */ }
    this.clue = this._choose();
    this.enabled = !!(this.clue && this.door);
    if (!this.enabled) this.open = false;
    this.group = new THREE.Group(); this.museum.group.add(this.group);
    this.ray = new THREE.Raycaster(); this.ndc = new THREE.Vector2(); this.v3 = new THREE.Vector3();
    if (this.door) this._panel();
    this._deep();
    this._setOpen(this.open, true);
    if (ui.boards) ui.boards.setLines('clue', this.clueLines());
    addEventListener('museum:board', e => { if (e.detail && e.detail.id === 'clue' && !this.clueRead) { this.clueRead = true; this._save(); } });
    // Fingers and the mouse, while a picture is being looked at.
    const cv = ui.canvas;
    cv.addEventListener('pointerdown', e => this._down(e));
    cv.addEventListener('pointermove', e => { const p = this.tap; if (p && e.pointerId === p.id && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 14) this.tap = null; });
    cv.addEventListener('pointerup', e => this._up(e));
    cv.addEventListener('pointercancel', e => { if (this.tap && e.pointerId === this.tap.id) this.tap = null; });
  }
  _save() { try { localStorage.setItem(KEY, JSON.stringify({ open: this.open, read: this.clueRead, arrived: this.arrived })); } catch { /* fine */ } }

  // ---- which picture ----
  _choose() {
    const site = this.site, m = this.museum;
    if (!site || !this.door || !this.plan.byId[site.room]) return null;
    const hung = m.arts.filter(a => !a.obj && !a.mini && a.work && !a.work.lent);      // a picture lent to another room is not in its own, and is not chosen
    const make = (art, c) => ({ art, work: art.work, part: c.part, rect: c.rect, short: c.short || art.work.t, gallery: this.plan.byId[art.room].gallery, listed: c !== CORNER });
    let first = null;
    for (const c of CLUES) { const a = hung.find(x => isClue(c, x.work)); if (a) { first = make(a, c); break; } }
    if (first && first.art.room === site.room) return first;
    // Tonight's first choice hangs somewhere the passage was not built: use what is in the room it was built behind.
    const here = hung.filter(a => a.room === site.room);
    for (const c of CLUES) { const a = here.find(x => isClue(c, x.work)); if (a) return make(a, c); }
    const big = here.slice().sort((p, q) => q.w * q.h - p.w * p.h)[0];
    return big ? make(big, CORNER) : null;
  }
  // What the Director's whiteboard says (src/boardtext.js for the marks at the start of each line).
  clueLines() {
    const c = this.clue;
    if (!this.enabled) return ['#MEMO', '- spring hang: sign off by Friday', '- Facilities want a word about "the wall"', '>they did not say which wall', '- tyre marks on the rug. SMALL ones.'];
    const room = c.gallery.replace(/^Galleries /, 'Gallery ');
    return ['#MEMO  from Facilities', `- visitors keep stopping at “${c.short}”`, `>in ${room}. They point at it.`, '- it needs SPECIAL ATTENTION:', `!${c.part}`, '- do NOT send conservation.', '>we know why.     — Facilities'];
  }

  // ---- the touch ----
  // Where on the picture is this pointer? { u, v } across and down its image, each 0 to 1, or null if it is not on it.
  _uv(art, cx, cy) {
    const r = this.ui.canvas.getBoundingClientRect();
    this.ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this.G.camera.updateMatrixWorld();
    this.ray.setFromCamera(this.ndc, this.G.camera);
    art.mesh.updateMatrixWorld();
    const hit = this.ray.intersectObject(art.mesh, false)[0];
    return hit && hit.uv ? { u: hit.uv.x, v: 1 - hit.uv.y } : null;
  }
  inPart(p) { const q = this.clue.rect; return !!p && p.u >= q[0] && p.u <= q[2] && p.v >= q[1] && p.v <= q[3]; }
  // Where on the screen a point of the picture is just now (client pixels): a test aid, and nothing else uses it.
  screenOf(u, v) {
    const a = this.clue.art, r = this.ui.canvas.getBoundingClientRect();
    a.mesh.updateMatrixWorld(); this.G.camera.updateMatrixWorld();
    const p = a.mesh.localToWorld(this.v3.set(u - 0.5, 0.5 - v, 0)).project(this.G.camera);
    return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
  }
  get live() { const G = this.G; return this.enabled && G.state === 'study' && G.mode !== 'race' && G.study && G.study.art === this.clue.art; }
  // True while a finger is down on the picture and has not moved: main.js does not take that for a push on the stick.
  get tapping() { return !!this.tap || this.t < this.tapUntil; }
  _down(e) {
    if (!this.live || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const p = this._uv(this.clue.art, e.clientX, e.clientY);
    if (p) this.tap = { id: e.pointerId, x: e.clientX, y: e.clientY };
  }
  _up(e) {
    const p = this.tap;
    if (!p || e.pointerId !== p.id) return;
    this.tap = null; this.tapUntil = this.t + 0.25;
    if (!this.live) return;
    const at = this._uv(this.clue.art, e.clientX, e.clientY);
    if (!at) return;
    this.lastTap = at;
    if (this.inPart(at)) { if (!this.open) this.find(); }
    else if (this.clueRead && !this.open) { this.wobble = 0.5; this.G.sound.creak(); }       // nothing here: but the frame gives a little, so there is something to find
  }
  // Found it.
  find() {
    if (!this.enabled || this.open) return false;
    const G = this.G, d = this.door;
    this._setOpen(true, false);
    this._save();
    G.sound.bell(146.83, 0, 0.07, 4); G.sound.grind(SLIDE);
    this.ui.endStudy();
    this.ui.callout('SOMETHING IS MOVING');
    const side = (d.x0 + d.x1) / 2 < (this.pub.x0 + this.pub.x1) / 2 ? 'west' : 'east', wall = { n: 'north', s: 'south', w: 'west', e: 'east' }[this.wallSide];
    this.ui.say(`Stone on stone. A piece of the ${wall} wall is sliding aside${this.wallSide === 'n' || this.wallSide === 's' ? `, at its ${side} end` : ''}.`, 0.3, 8);
    this.ui.say('There is a way through, and it goes down.', SLIDE + 2.5, 7);
    const mark = this.mark = { x: (d.x0 + d.x1) / 2, y: d.y, z: (d.z0 + d.z1) / 2, colour: '#ff5a4d', ring: true };
    G.mapMarks = [...(G.mapMarks || []), mark];
    try { window.dispatchEvent(new CustomEvent('museum:secret', { detail: { event: 'found', work: this.clue.work.id } })); } catch { /* fine */ }
    return true;
  }
  _setOpen(on, now) {
    const plan = this.plan;
    this.open = on; plan.secretOpen = on;
    if (on) plan.levels.X = this.site.y; else delete plan.levels.X;
    if (now) this.k = on ? 1 : 0;
    if (this.G.nav) this.G.nav.reset();
    this._slide();
  }
  // A new game: the wall is a wall again.
  reset() {
    this.clueRead = false; this.arrived = false; this.told = false;
    if (this.mark) { this.G.mapMarks = (this.G.mapMarks || []).filter(m => m !== this.mark); this.mark = null; }
    this._setOpen(false, true);
    try { localStorage.removeItem(KEY); } catch { /* fine */ }
  }

  // ---- the piece of wall that moves ----
  _panel() {
    const plan = this.plan, d = this.door, sec = plan.byId[d.a].secret ? d.a : d.b, pubId = sec === d.a ? d.b : d.a, pub = this.pub = plan.byId[pubId];
    const g = this.panel = new THREE.Group(); this.group.add(g);
    const face = (roomId, trimmed) => {
      const w = plan.walls.find(q => q.room.id === roomId && q.openings.some(o => o.door === d));
      if (!w) return null;
      const r = w.room, o = w.openings.find(q => q.door === d), st = this.museum.rooms[roomId], geo = new Geo(), y0 = r.y + Math.max(0, o.y), y1 = r.y + o.y + o.h;
      const P = (u, y) => Object.values(wallPoint(w, u, y, -0.007));      // a hair behind the face of the wall, so that it slides behind it
      geo.quad(P(o.lo, y0), P(o.hi, y0), P(o.hi, y1), P(o.lo, y1), [w.nx, 0, w.nz], [[o.lo / 3, (y0 - r.y) / r.h], [o.hi / 3, (y0 - r.y) / r.h], [o.hi / 3, (y1 - r.y) / r.h], [o.lo / 3, (y1 - r.y) / r.h]]);
      g.add(geo.mesh(st.wallMat));
      if (trimmed) { const t = new Geo(); t.wallBox(wallPoint(w, (o.lo + o.hi) / 2, r.y), w.nx, w.nz, -(o.hi - o.lo) / 2, (o.hi - o.lo) / 2, 0, 0.236, 0, 0.031); g.add(t.mesh(st.trimMat)); }
      return { w, o };
    };
    const a = face(pubId, pub.floor !== 'LL' && pub.floor !== 'X' && pub.kind !== 'corridor'); face(sec, false);
    if (!a) return;
    const { w, o } = a;
    this.wallSide = w.side;
    // It slides along the wall, behind its face, towards whichever side has more wall to go behind.
    const dir = w.hi - o.hi >= o.lo - w.lo ? 1 : -1, len = o.hi - o.lo + 0.06;
    this.slideBy = w.horiz ? new THREE.Vector3(dir * len, 0, 0) : new THREE.Vector3(0, 0, dir * len);
    // The thickness of the wall it was hiding, either side of the opening and over it.
    const jamb = new Geo(), Y0 = d.y, Y1 = d.y + d.h, e = 0.004;
    if (d.along === 'z') { jamb.box(d.x0 - 0.3, d.x0, Y0, Y1, d.z0 + e, d.z1 - e); jamb.box(d.x1, d.x1 + 0.3, Y0, Y1, d.z0 + e, d.z1 - e); jamb.box(d.x0 - 0.3, d.x1 + 0.3, Y1, Y1 + 0.3, d.z0 + e, d.z1 - e); }
    else { jamb.box(d.x0 + e, d.x1 - e, Y0, Y1, d.z0 - 0.3, d.z0); jamb.box(d.x0 + e, d.x1 - e, Y0, Y1, d.z1, d.z1 + 0.3); jamb.box(d.x0 + e, d.x1 - e, Y1, Y1 + 0.3, d.z0 - 0.3, d.z1 + 0.3); }
    this.group.add(jamb.mesh(new THREE.MeshStandardMaterial({ color: 0x34383d, roughness: 0.9, emissive: 0x1a1d21, emissiveIntensity: 0.5 })));
  }
  _slide() {
    if (!this.panel || !this.slideBy) return;
    this.panel.position.copy(this.slideBy).multiplyScalar(ease(this.k));
    this.panel.updateMatrixWorld(true);
  }

  // ---- down below ----
  _deep() {
    const plan = this.plan, marks = plan.marks || [], deep = this.deep = new THREE.Group();
    this.group.add(deep); deep.visible = false;
    for (const r of plan.rooms) if (r.secret) r.glow = r.y < -6 && r.use === 'secret' ? 0.5 : 0.2;      // lit whether or not anybody has been in: there is no art down here to wake it
    const vault = plan.byId['X-vault'];
    this.centre = vault ? { x: (vault.x0 + vault.x1) / 2, y: vault.y, z: (vault.z0 + vault.z1) / 2 } : null;
    // One cold lamp for the whole store. It is always in the scene (so that no shader is ever rebuilt) and is turned up only when somebody is down there.
    if (vault) { const L = this.lamp = new THREE.PointLight(0xbfe8ff, 0, 34, 1.4); L.position.set(this.centre.x, vault.y + vault.h - 0.6, this.centre.z); this.group.add(L); }

    // The jars. Glass and the green in them: one instanced cylinder. What floats in them: one instanced figure. Bubbles: one cloud of points.
    const jars = this.jars = marks.filter(m => m.kind === 'jar');
    if (jars.length) {
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3();
      const glass = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 20, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 0.75, 0.32), transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }), jars.length * 2);
      jars.forEach((j, i) => {
        glass.setMatrixAt(i * 2, M.compose(V.set(j.x, j.y + j.h / 2, j.z), Q.identity(), S.set(j.r, j.h, j.r)));
        glass.setMatrixAt(i * 2 + 1, M.compose(V.set(j.x, j.y + j.h * 0.46, j.z), Q.identity(), S.set(j.r * 0.9, j.h * 0.92, j.r * 0.9)));      // the green stops short of the lid
      });
      glass.renderOrder = 6; glass.frustumCulled = false; deep.add(glass);
      const fig = this.figs = new THREE.InstancedMesh(alienGeometry(), new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(0.8, 1.05, 0.85) }), jars.length);
      fig.frustumCulled = false; fig.instanceMatrix.setUsage(THREE.DynamicDrawUsage); deep.add(fig);
      const N = 9, pos = new Float32Array(jars.length * N * 3);
      this.bub = jars.flatMap((j, i) => Array.from({ length: N }, (_, k) => ({ j, a: (i * 7 + k * 2.4) % 6.283, rr: j.r * (0.25 + 0.6 * ((k * 37 + i * 11) % 10) / 10), ph: ((k * 53 + i * 17) % 100) / 100, sp: 0.16 + ((k * 29 + i) % 10) * 0.02 })));
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = this.bubbles = new THREE.Points(pg, new THREE.PointsMaterial({ color: new THREE.Color(0.7, 1.3, 0.9), size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      pts.frustumCulled = false; pts.renderOrder = 7; deep.add(pts);
    }
    // The lettering: one sheet, one mesh.
    const labels = marks.filter(m => m.kind === 'label' && LABELS[m.k]);
    if (labels.length) {
      const { tex, cells } = labelSheet(), geo = new Geo();
      for (const m of labels) {
        const c = cells[m.k], asp = c.w / c.h; let w = m.w, h = w / asp; if (h > m.h) { h = m.h; w = h * asp; }
        const ux = m.fz, uz = -m.fx, P = (su, sy) => [m.x + ux * su * w / 2, m.y + sy * h / 2, m.z + uz * su * w / 2];
        geo.quad(P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), [m.fx, 0, m.fz], [[c.u0, c.v0], [c.u1, c.v0], [c.u1, c.v1], [c.u0, c.v1]]);
      }
      const lm = geo.mesh(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, color: new THREE.Color(0.85, 0.85, 0.85) }));
      lm.renderOrder = 3; deep.add(lm);
    }
    // The thing on the pedestal: the saucer the toy is a copy of, three times the size, turning slowly.
    const u = this.ufoAt = marks.find(m => m.kind === 'ufo') || null;
    if (u) {
      const s = this.saucer = buildSaucer(); s.group.scale.setScalar(3); s.group.position.set(u.x, u.y + 0.62, u.z); deep.add(s.group);
      const ring = this.ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.62, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 1.2, 0.6), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(u.x, vault.y + 0.012, u.z); ring.renderOrder = 4; deep.add(ring);
    }
    // And one more monitor, with a game nobody upstairs has.
    if (plan.bonusArcade && this.G.arcade && this.G.arcade.addBonus) this.monitor = this.G.arcade.addBonus(plan.bonusArcade, Outpost);
  }
  get taken() { const G = this.G; return (G.garage && G.garage.isOpen('ufo')) || !!(G.trophies && G.trophies.flags.ufo); }
  // Is this toy close enough to the pedestal to take what is on it?
  nearUfo(v) {
    const u = this.ufoAt;
    if (!u || !this.open || this.taken || this.G.mode === 'race') return false;
    return Math.hypot(v.pos.x - u.x, v.pos.z - u.z) < 2.3 && v.pos.y > this.centre.y - 0.5 && v.pos.y < this.centre.y + 3.2;
  }
  take() {
    if (this.taken) return false;
    const G = this.G;
    this.ui.trophies.flag('ufo');
    this.lift = 0.001;
    G.sound.finish();
    this.ui.callout('IT IS YOURS');
    this.ui.say('It lifts off the pedestal, turns once, and hangs there. There is one your size on the title screen now, with the other toys.', 0.6, 10);
    try { window.dispatchEvent(new CustomEvent('museum:secret', { detail: { event: 'ufo' } })); } catch { /* fine */ }
    return true;
  }

  // Every frame while the game is being played.
  update(dt, v, roomId, cam) {
    this.t += dt;
    if (this.open && this.k < 1) { this.k = Math.min(1, this.k + dt / SLIDE); this._slide(); if (this.k === 1) this.G.sound.bump(2.5); }
    if (this.mark && (this.k >= 1 && (roomId && this.plan.byId[roomId] && this.plan.byId[roomId].secret))) { this.G.mapMarks = (this.G.mapMarks || []).filter(m => m !== this.mark); this.mark = null; }
    // The picture gives a little when touched in the wrong place.
    if (this.wobble > 0 && this.clue) { this.wobble = Math.max(0, this.wobble - dt); const m = this.clue.art.mesh; m.rotation.z = Math.sin(this.wobble * 40) * 0.012 * (this.wobble / 0.5); m.updateMatrix(); }
    if (!this.centre) return;
    const c = this.centre, deepDown = cam.y < c.y + 6 && Math.abs(cam.x - c.x) < 60 && Math.abs(cam.z - c.z) < 60;
    this.deep.visible = deepDown;
    if (this.lamp) this.lamp.intensity += ((deepDown ? 26 : 0) - this.lamp.intensity) * Math.min(1, dt * 3);
    if (!deepDown) return;
    const room = roomId && this.plan.byId[roomId];
    if (room && room.secret && room.y < -6 && room.use === 'secret' && !this.arrived) {
      this.arrived = true; this._save();
      this.ui.trophies.flag('vault');
      try { window.dispatchEvent(new CustomEvent('museum:secret', { detail: { event: 'arrived' } })); } catch { /* fine */ }
      this.ui.callout('SUB-LEVEL 9'); this.G.sound.roomChord();
      this.ui.say('Twelve metres under the street, and on nobody’s drawings. Somebody has been keeping things down here.', 1.2, 9);
    }
    // Things in jars sway; bubbles rise; the saucer turns.
    const t = this.t;
    if (this.figs) {
      const M = _M, Q = _Q, S = _S, V = _V, E = _E;
      this.jars.forEach((j, i) => {
        const k = j.h * 0.58 / 0.92, sway = Math.sin(t * 0.6 + i * 1.7);
        E.set(Math.sin(t * 0.4 + i) * 0.06, Math.atan2(j.fx, j.fz) + sway * 0.5 + (i % 3 - 1) * 0.3, Math.cos(t * 0.5 + i * 2.1) * 0.08); Q.setFromEuler(E);
        this.figs.setMatrixAt(i, M.compose(V.set(j.x, j.y + j.h * 0.2 + Math.sin(t * 0.8 + i * 2.3) * j.h * 0.035, j.z), Q, S.set(k, k, k)));
      });
      this.figs.instanceMatrix.needsUpdate = true;
      const p = this.bubbles.geometry.attributes.position;
      this.bub.forEach((b, i) => { const f = (b.ph + t * b.sp) % 1, a = b.a + f * 2.5; p.setXYZ(i, b.j.x + Math.cos(a) * b.rr, b.j.y + 0.05 + f * b.j.h * 0.86, b.j.z + Math.sin(a) * b.rr); });
      p.needsUpdate = true;
    }
    if (this.saucer) {
      const s = this.saucer, u = this.ufoAt;
      s.anim(null, dt);
      if (this.lift) this.lift = Math.min(1, this.lift + dt * 0.5);
      const up = this.taken ? 1.5 * ease(this.lift || 1) : 0;
      s.group.position.y = u.y + 0.62 + up + Math.sin(t * 1.3) * 0.05;
      s.group.rotation.y = t * 0.5 + (this.lift && this.lift < 1 ? ease(this.lift) * Math.PI * 2 : 0);
      this.ring.material.opacity = this.taken ? 0.12 : 0.35 + 0.25 * Math.sin(t * 3);
      if (!this.taken && !this.told && Math.hypot(v.pos.x - u.x, v.pos.z - u.z) < 7 && room && room.id === 'X-vault') { this.told = true; this.ui.say('On the pedestal, turning by itself: a flying saucer, about the size of a dustbin lid. Go up to it.', 0, 8); }
    }
  }
}
const _M = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _S = new THREE.Vector3(), _V = new THREE.Vector3(), _E = new THREE.Euler();

// A grey, about 0.9 m from toe to crown: a big head, big black eyes, not much else. One geometry, coloured by vertex.
function alienGeometry() {
  const parts = [], skin = [0.5, 0.58, 0.5], dark = [0.02, 0.03, 0.02], pale = [0.6, 0.68, 0.58];
  const add = (geo, col, x, y, z, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) => {
    geo.scale(sx, sy, sz); if (rx) geo.rotateX(rx); if (rz) geo.rotateZ(rz); geo.translate(x, y, z);
    const n = geo.attributes.position.count, c = new Float32Array(n * 3); for (let i = 0; i < n; i++) c.set(col, i * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); parts.push(geo);
  };
  add(new THREE.SphereGeometry(0.17, 14, 10), pale, 0, 0.74, 0, 0, 0, 1, 1.2, 0.95);                 // the head
  add(new THREE.SphereGeometry(0.1, 10, 8), skin, 0, 0.6, 0.02, 0, 0, 0.9, 1, 0.85);                  // and its small chin
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.058, 10, 8), dark, s * 0.075, 0.73, 0.125, 0, s * 0.5, 1, 1.55, 0.5);
  add(new THREE.CylinderGeometry(0.028, 0.028, 0.1, 6), skin, 0, 0.5, 0);
  add(new THREE.CylinderGeometry(0.085, 0.055, 0.3, 8), skin, 0, 0.31, 0);
  for (const s of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.018, 0.014, 0.36, 5), skin, s * 0.13, 0.29, 0.02, 0, s * 0.35);                     // arms, hanging
    add(new THREE.SphereGeometry(0.03, 6, 5), pale, s * 0.19, 0.11, 0.02, 0, 0, 1, 1.4, 0.6);
    add(new THREE.CylinderGeometry(0.024, 0.018, 0.3, 5), skin, s * 0.045, 0.02, 0, 0, s * 0.08);                        // legs
  }
  const g = mergeGeometries(parts.map(p => { p.deleteAttribute('uv'); return p; }));
  g.translate(0, -0.33, 0);
  return g;
}

// The sheet of lettering: every label once, and where each is on it.
function labelSheet() {
  const SW = 2048, SH = 1024, cv = document.createElement('canvas'); cv.width = SW; cv.height = SH;
  const c = cv.getContext('2d'), cells = [], F = 'Impact, "Arial Narrow Bold", "Helvetica Neue Condensed Bold", "Arial Black", sans-serif';
  let x = 0, y = 0, rowH = 0;
  LABELS.forEach((L, k) => {
    const w = L.kind === 'sign' ? 384 : 512, h = L.kind === 'sign' ? 256 : 128;
    if (x + w > SW) { x = 0; y += rowH; rowH = 0; }
    rowH = Math.max(rowH, h);
    c.save(); c.translate(x, y); c.textAlign = 'center'; c.textBaseline = 'middle';
    const fit = (text, px, room) => { c.font = `bold ${px}px ${F}`; const m = c.measureText(text).width; if (m > room) c.font = `bold ${px * room / m}px ${F}`; };
    if (L.kind === 'stencil') { c.fillStyle = 'rgba(16,16,14,.88)'; fit(L.t, 84, w - 36); c.fillText(L.t, w / 2, h / 2 + 4); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; for (let i = 60; i < w; i += 74) c.fillRect(i, 0, 5, h); c.globalCompositeOperation = 'source-over'; }
    else if (L.kind === 'plate') { c.fillStyle = '#101214'; c.fillRect(4, 14, w - 8, h - 28); c.strokeStyle = '#8a8f94'; c.lineWidth = 4; c.strokeRect(8, 18, w - 16, h - 36); c.fillStyle = '#e9ecee'; fit(L.t, 62, w - 60); c.fillText(L.t, w / 2, h / 2 + 3); }
    else { c.fillStyle = '#e2ad1b'; c.fillRect(0, 0, w, h); c.strokeStyle = '#111'; c.lineWidth = 10; c.strokeRect(12, 12, w - 24, h - 24); c.fillStyle = '#111'; c.beginPath(); c.moveTo(w / 2, 30); c.lineTo(w / 2 + 34, 86); c.lineTo(w / 2 - 34, 86); c.closePath(); c.fill(); c.fillStyle = '#e2ad1b'; c.font = `bold 44px ${F}`; c.fillText('!', w / 2, 66); c.fillStyle = '#111'; fit(L.t, 72, w - 56); c.fillText(L.t, w / 2, 138); if (L.s) { fit(L.s, 40, w - 60); c.fillText(L.s, w / 2, 204); } }
    c.restore();
    cells[k] = { u0: x / SW, u1: (x + w) / SW, v0: 1 - (y + h) / SH, v1: 1 - y / SH, w, h };
    x += w;
  });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return { tex, cells };
}
