// The entrance hall, the first time you come in: the saucer, found at work.
//
// One picture hangs in the Michigan Avenue lobby, on the wall that faces the vent you come in by (src/plan.js
// entryPicture: the Turner, which has a life of its own in src/life/). Until you have been in, a small saucer hangs in
// front of it in a green glow (the probe of src/probe.js: the same one, borrowed, long before it comes up out of the
// grate), with its light on the floor under it and in the air round it.
//
// Come in through the vent and it plays out as a cutscene, sixteen seconds:
//   * the camera leaves your toy and crosses the hall to it;
//   * it scans the picture: a thin green beam plays along the bottom rail of the frame, and light climbs round the frame
//     on the wall behind it, closes over the top and runs down to the label. The picture's lamp comes on, its label takes
//     the green light every living work's has (src/paintlife.js expose), and its show begins, with nobody looking
//     (paintlife's wake: the same step() a look drives);
//   * the lobby's security robot comes in fast from the Grand Staircase (src/guards.js: its own robot, body, searchlight,
//     voice and bolt; none of them fly, so it rolls in at the speed it chases at), warms its prong and puts a bolt into it
//     (as the Turner's own thunder breaks);
//   * the saucer bolts for the front doors, which have just unlocked, and is gone over the avenue. The robot goes after
//     it as far as the doors, gives up, and goes back to its beat. The toy is yours again, and the mouse on the grate,
//     which has waited its turn (src/story.js), dives.
// SKIP (the button; Esc or P; a pad's B or Menu) ends it at once, behind a quick dip to black, with everything where the
// end would have left it. Nothing is written across the screen while it plays: the lines that were waiting wait (main.js
// runToasts), and YOU'RE IN, which main.js had just put up, is said when it is over.
//
// Nothing here is ever drawn on the picture. The beam and the light on the wall are added with probe.js's artSafe()
// (weighted by the frame's alpha, which is 0 on a work), and are staged clear of the canvas besides: the beam ends on the
// frame's bottom rail, below the canvas; the light on the wall lies behind the frame and the canvas; the saucer keeps
// below the line from the camera to the canvas's bottom edge; the robot, its bolt and its sparks (plain additive, not
// artSafe) keep to one side of it, by more than their own reach. G.entry.check() is the proof, run on every frame by the
// test that films it: the scene drawn with and without all of this, and the picture's pixels compared.
//
// Reduce motion: the camera stands still and cuts; no bolt (a steady ray), no sparks, no tumbling, no flicker; the
// robot's beacon is steady.
//
// Once, in a new game. Saved in 'after-hours.entry': 'wait' until then; 'done' from the moment it starts (leave in the
// middle and it does not play again); 'missed' if you first got in some other way (a skylight, a duct: it had gone by the
// time you reached the hall, and the label is green as it left it). A game from before this was made, that has been
// indoors already, counts as done. While it waits the lobby's robot is kept off its beat (it is the one that comes in).
// Nothing is done per frame once it is over.
//
// For tests: G.entry = { stage, busy, T, beat, begin(), skip(), sample(), check(), onFrame, rate }.

import * as THREE from 'three';
import { feature, features } from './features.js';
import { confine, groundAt, ENTRY_WORK } from './plan.js';
import { BOT, clearAt } from './guardplan.js';
import { GREEN, artSafe, beamMaterial } from './probe.js';
import * as TX from './textures.js';

const KEY = 'after-hours.entry';
const R = 0.4;                // the saucer's radius (src/probe.js)
const HOVER = 0.66;           // the height of its middle while it works: all of it under the bottom of the frame (1.07 m)
// The cutscene, in seconds from the moment it has you.
const T = {
  cross: 4.6,                 // the camera reaches the picture
  beam: 3.6, climb: 4.2, top: 5.9, label: 6.3, wake: 6.4,      // the scan: the beam on; the light starts up the frame; over the top; at the label; the show begins
  back: 7.9,                  // the saucer has drawn back to watch
  robot: 8.7, seen: 9.3, charge: 9.65, zap: 11.15, zapEnd: 11.75,      // the robot sets off; is heard; its prong warms; the bolt (as the Turner's own thunder breaks)
  flee: 11.95, cut: 12.0, chase: 12.15, gone: 15.15, quit: 14.9, end: 16.0,
};
const ease = q => { q = q < 0 ? 0 : q > 1 ? 1 : q; return q * q * (3 - 2 * q); };
const span = (t, a, b) => (t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a));
const TAU = Math.PI * 2;
const wrap = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const turn = (a, b, max) => a + Math.max(-max, Math.min(max, wrap(b - a)));

let st = load();
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.stage) return s;
    // A game from before this was made: if it has been indoors, the saucer is long gone.
    const been = localStorage.getItem('after-hours.in') === '1' || (JSON.parse(localStorage.getItem('after-hours.rooms') || '[]') || []).length > 0;
    return { stage: been ? 'done' : 'wait' };
  } catch { return { stage: 'wait' }; }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* a private window: it lasts the visit */ } }

const CSS = `
body.ecine #hud > :not(#eskip) { display: none !important; }
#eskip { position: absolute; right: max(18px, env(safe-area-inset-right)); top: max(18px, env(safe-area-inset-top)); z-index: 3; pointer-events: auto; cursor: pointer; font: clamp(12px, 1.1vw, 14px) var(--mono, monospace); letter-spacing: .14em; text-transform: uppercase; color: var(--gilt-dim, #a8966a); background: rgba(10,11,16,.5); border: 1px solid rgba(168,150,106,.4); border-radius: 3px; padding: 11px 16px; min-height: 40px; }
#eskip:hover { color: var(--gilt, #e2cd94); border-color: var(--gilt, #e2cd94); }
#eskip[hidden] { display: none; }
#efade { position: fixed; inset: 0; background: #000; opacity: 0; pointer-events: none; transition: opacity .2s ease; z-index: 24; }
`;

// The light that climbs round the frame: a sheet on the wall behind the picture, bigger than the frame all round. Each
// point of it knows how far it is outside the frame (a soft band hugging it) and how far round from the bottom middle
// to the top middle (uP: how far the light has got). And a spot where the label is (uLab), for when it gets there.
function surroundMaterial(hw, hh) {
  return artSafe(new THREE.ShaderMaterial({
    uniforms: { uHalf: { value: new THREE.Vector2(hw, hh) }, uP: { value: 0 }, uK: { value: 0 }, uLab: { value: new THREE.Vector3() }, uLabK: { value: 0 }, uTime: { value: 0 }, uCol: { value: GREEN.clone() } },
    vertexShader: 'varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`
      uniform vec2 uHalf; uniform float uP; uniform float uK; uniform vec3 uLab; uniform float uLabK; uniform float uTime; uniform vec3 uCol; varying vec2 vP;
      void main() {
        vec2 q = abs(vP) - uHalf; float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);       // metres outside the frame (less than 0: behind it)
        float band = exp(-d * d / 0.0065) * smoothstep(-0.06, 0.0, d);
        float s = atan(abs(vP.x) / uHalf.x, -vP.y / uHalf.y) / 3.14159265;                     // 0 at the bottom middle, 1 at the top middle
        float lit = 1.0 - smoothstep(uP - 0.035, uP + 0.01, s);
        float head = exp(-pow((s - uP) / 0.05, 2.0)) * step(0.001, uP) * (1.0 - step(1.04, uP));
        float shimmer = 0.85 + 0.15 * sin(s * 40.0 - uTime * 5.0);
        vec2 l = vP - uLab.xy; float lab = exp(-dot(l, l) / (uLab.z * uLab.z)) * uLabK;
        gl_FragColor = vec4(uCol * (band * (lit * 0.42 * shimmer + head * 0.9) * uK + lab), 1.0);
      }`,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
  }));
}

feature({
  id: 'entry',

  init(k) {
    this.k = k; this.run = null; this.shown = false; this.t = 0;
    const me = this, G = k.G, P = k.plan;
    G.entry = {
      get stage() { return st.stage; }, get busy() { return !me.off && (st.stage === 'wait' || !!me.run); },
      get T() { return me.run ? me.run.T : -1; }, get beat() { return me.run ? me.run.beat : null; },
      begin: () => (me.off || me.run ? false : (me._ready(k), me._begin(k), true)), skip: () => me.skip(),
      sample: () => me.sample(), check: o => me.check(o), onFrame: null, rate: 0,
    };
    const L = this.L = P.byId[P.front && P.front.a], vent = this.vent = P.vent, front = P.front;
    const art = this.art = k.museum.arts.find(a => a.work.id === ENTRY_WORK && a.entry) || null;
    const probe = this.probe = features.find(f => f.id === 'probe'), gd = this.gd = features.find(f => f.id === 'guards'), pl = this.pl = features.find(f => f.id === 'paintlife');
    const life = this.life = art && pl && pl.lifeOf ? pl.lifeOf(art) : null;
    // Without the hall, the picture alive in it, the saucer or the robots, there is no scene: everything is left as it was.
    if (!L || !vent || !front || front.along !== 'x' || !art || !life || !probe || probe.off || !probe.m || !gd || !gd.bots) { this.off = true; return; }
    // The doorway the robot comes in by: the one in the picture's own wall, nearest it on the side away from the vent.
    const dz = d => (d.z0 + d.z1) / 2 - art.z, fz = (front.z0 + front.z1) / 2, vz = (vent.z0 + vent.z1) / 2, side = Math.sign(fz - vz) || 1;
    const door = this.door = P.doors.filter(d => !d.out && !d.vent && !d.hidden && d.along === 'x' && (d.a === L.id || d.b === L.id) && Math.abs(d.x0 - L.x1) < 0.7 && d.h >= 1.3 && dz(d) * side > 1.2).sort((a, b) => Math.abs(dz(a)) - Math.abs(dz(b)))[0];
    if (!door || Math.abs(art.nx + 1) > 0.01) { this.off = true; return; }
    // Where things stand. u: along the wall from the middle of the picture, towards the front doors' side; out: into the room from the canvas.
    const y = this.y = L.y, at = (u, out, h) => new THREE.Vector3(art.x - out, y + h, art.z + u * side), du = dz(door) * side;
    this.at = at; this.side = side; this.xOut = front.x0;
    this.S1 = at(0, 1.42, HOVER); this.S2 = at(1.1, 3.3, 0.74);                    // the saucer: scanning; drawn back to watch
    this.RS = at(du, -4.2, 0); this.R1 = at(du - 0.7, 1.46, 0); this.RD = new THREE.Vector3(L.x0 + 1.1, y, fz);      // the robot: out of sight beyond the doorway; where it fires from; at the front doors
    this.lab = at(0, 0, 0);                                                        // (the label, found below)
    // The way out: across the hall, through the front doors, and up over the avenue.
    this.out = new THREE.CatmullRomCurve3([this.S2.clone(), new THREE.Vector3(L.x0 + 4.9, y + 0.85, fz - 1.5 * side), new THREE.Vector3(L.x0 + 2.1, y + 0.88, fz - 0.15 * side), new THREE.Vector3(front.x1 - 0.3, y + 0.84, fz),
      new THREE.Vector3(front.x0, y + 0.8, fz + 0.05 * side), new THREE.Vector3(front.x0 - 3.5, y + 1.7, fz + 0.5 * side),      // (low through the doorway: the CLOSED sign hangs in it, from 1.38 m up) new THREE.Vector3(front.x0 - 11, y + 7, fz + 2.1 * side), new THREE.Vector3(front.x0 - 24, y + 20, fz + 3.6 * side),
      new THREE.Vector3(Math.max(P.bounds.x0 + 6, front.x0 - 36), y + 34, fz + 4.6 * side)], false, 'centripetal');
    this.out.arcLengthDivisions = 300;
    // The cameras (in the same terms).
    this.CB = { at: at(-0.95, 3.36, 1.35), look: at(0.2, 0.0, 1.3), fov: 50 };
    this.CB2 = { at: at(-0.9, 3.05, 1.35), look: at(0.2, 0.0, 1.3), fov: 50 };
    this.CC = { at: at(-1.6, 4.0, 1.3), look: at(2.3, 1.5, 0.95), fov: 58 };
    this.CC2 = { at: at(-1.5, 3.8, 1.3), look: at(2.2, 1.7, 0.95), fov: 58 };
    this.CD = { at: at(1.7, 0.76, 1.3), look: new THREE.Vector3(front.x1 - 0.3, y + 1.25, fz + 0.2 * side), fov: 52 };
    this.CD2 = { at: at(1.9, 1.4, 1.3), look: new THREE.Vector3(front.x1 - 0.3, y + 1.35, fz + 0.2 * side), fov: 52 };
    this.eye = { at: new THREE.Vector3(), look: new THREE.Vector3(), fov: 50 };
    // What this draws of its own (the saucer and the robot are theirs): the beam, where it lands, the light round the frame.
    const g = this.group = new THREE.Group(); g.name = 'entry'; g.visible = false; g.userData.always = true; k.group.add(g);      // (always: src/stream.js leaves it alone)
    const cone = new THREE.CylinderGeometry(0.035, 0.012, 1, 20, 1, true).translate(0, 0.5, 0);
    this.beam = new THREE.Mesh(cone, beamMaterial(probe.m.U, { up: true, n: 8, m: 3, speed: 2.2, rings: 5, ringSpeed: 1.6, fall: 0.35 })); this.beam.renderOrder = 4; this.beam.frustumCulled = false; g.add(this.beam);
    this.ray = new THREE.Mesh(cone, beamMaterial(probe.m.U, { up: true, n: 8, m: 3, speed: 3.0, rings: 4, ringSpeed: 2.2, fall: 0.2 })); this.ray.renderOrder = 4; this.ray.frustumCulled = false; this.ray.visible = false; g.add(this.ray);      // (reduce motion: the robot's bolt, as a steady ray)
    this.spot = new THREE.Sprite(artSafe(new THREE.SpriteMaterial({ map: TX.radial(0, 1.4), color: GREEN.clone() }))); this.spot.scale.setScalar(0.09); this.spot.renderOrder = 4; g.add(this.spot);
    const m = 0.36, fw = Math.max(0.05, art.frame || 0.1), hw = art.w / 2 + fw, hh = art.h / 2 + fw;
    this.fr = { hw, hh, fw, bottom: art.y - art.h / 2 };
    this.wall = new THREE.Mesh(new THREE.PlaneGeometry(2 * (hw + m), 2 * (hh + m)), surroundMaterial(hw, hh));
    this.wall.position.set(art.x - art.nx * 0.028, art.y, art.z); this.wall.rotation.y = Math.atan2(art.nx, art.nz); this.wall.renderOrder = 4; g.add(this.wall);      // (a centimetre off the wall: the canvas hangs four off it)
    { // the label: where its card is, in the sheet's own terms (x: to the viewer's right, y: up)
      const M = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      if (k.museum.cards) { k.museum.cards.getMatrixAt(art.i, M); M.decompose(p, q, s); this.lab.copy(p); }
      this.wall.updateMatrixWorld(); const l = this.wall.worldToLocal(this.lab.clone());
      this.wall.material.uniforms.uLab.value.set(l.x, l.y, 0.11);
    }
    this.hum = k.loop({ type: 'sine', freq: 146.8 });      // D, an octave over the grate's
    this.v1 = new THREE.Vector3(); this.v2 = new THREE.Vector3(); this.v3 = new THREE.Vector3(); this.up = new THREE.Vector3(0, 1, 0);
    if (st.stage === 'wait') pl.expose(art, false);         // not touched yet: its label is like any other
  },

  // ---------------------------------------------------------------- while it waits
  active(k) { return !this.off && (st.stage === 'wait' || !!this.run) && k.G.mode !== 'race' && !k.plan.racing; },
  update(dt, k) {
    this.t += dt;
    if (this.run) return this._play(dt, k);
    const G = k.G, p = k.pos, L = this.L, V = this.vent, room = k.room;
    if (!this.bot && !this._ready(k)) return;
    // Indoors already, and not by the vent: it had gone by the time you got here.
    const zc = (V.z0 + V.z1) / 2, dzv = Math.abs(p.z - zc), dx = p.x - L.x0;
    if (room && !G.held && (room.id !== L.id || dx > 4.2 || dzv > 2.6)) return this._miss(k);
    if (!G.probe || G.probe.stage !== 'wait') return this._miss(k);       // (the probe has been and gone already: a game put together by hand)
    const near = Math.hypot(p.x - this.S1.x, p.z - this.S1.z) < 46 && Math.abs(p.y - L.y) < 8 && this.probe.phase === 'idle';
    if (!near) { if (this.shown) this._hideAll(); return; }
    if (this.t > 1.5) this._warm(k);          // (its shaders and the picture's show, made ready a moment into play: not on the first frame)
    this._hover(dt, k, this.t);
    this.hum.set(Math.max(0, 0.012 * (1 - Math.hypot(p.x - this.S1.x, p.z - this.S1.z) / 14)));
    // In through the vent, and clear of it: it begins.
    if (G.state === 'play' && !G.ride && !G.held && !G.study && room && room.id === L.id && dx > 1.0 && dx < 3.0 && dzv < 1.5 && p.y < L.y + 1.5) this._begin(k);
  },
  // The robot (the lobby's own), kept off its beat until it is wanted; and a check that the floor is as this was laid out for.
  _ready(k) {
    if (this.bot) return true;
    const gd = this.gd, b = gd._lobby(k);
    const ok = b && clearAt(b.g, this.RS.x, this.RS.z) >= BOT.r && clearAt(b.g, this.R1.x, this.R1.z) >= BOT.r && clearAt(b.g, this.RD.x, this.RD.z) >= BOT.r;
    if (!ok) { this.off = true; if (st.stage === 'wait') this.pl.expose(this.art, true); return false; }
    this.bot = b;
    if (st.stage === 'wait') this._park();
    return true;
  },
  _park() { const b = this.bot; if (!b) return; b.cut = true; b.near = false; b.x = this.RS.x; b.z = this.RS.z; b.yaw = b.look = -Math.PI / 2; b.v = 0; b.mode = 'patrol'; b.pn = 0; b.group.visible = false; b.pool.visible = false; },
  _warm(k) {
    const G = k.G, r = G.renderer; if (this.warmed || !r || !r.compileAsync || !G.camera) return;
    this.warmed = true; this.probe._warm(k); this.life.prepare();
    const v = this.group.visible; this.group.visible = true; r.compileAsync(this.group, G.camera, G.scene).catch(() => {}); this.group.visible = v;
  },
  _hideAll() { if (this.shown) this.probe._hide(); this.shown = false; this.group.visible = false; this.hum.set(0); },      // (only if it is this that has it out: later it is the probe's own)
  _hush() { this.hum.set(0, 0.1); setTimeout(() => this.hum.stop(), 900); },      // (its hum, let go for good: nothing will be here to turn it down again)
  _miss(k) {
    st = { stage: 'missed' }; save();
    this._hideAll(); this._hush(); this.pl.expose(this.art, true);
    const b = this.bot; if (b) { b.cut = false; this.gd._home(b, 0); }
  },

  // ---------------------------------------------------------------- the saucer, drawn where it is
  // (the probe's own drawing; then its glow turned up a little: in this scene the glow is the thing to see)
  _saucer(dt, k, pos, face, o) {
    const P = this.probe; this.shown = true;
    P.pos.copy(pos); P._show(dt, k, face, o);
    if (!o.wide) { P.m.halo.material.color.multiplyScalar(8); P.m.halo.scale.multiplyScalar(1.2); P.pool.material.uniforms.uK.value *= 1.8; P.m.field.material.uniforms.uK.value *= 2; }
    if (o.still) P.ribbon.mesh.visible = false;      // (its ribbon is for when it travels: hanging in the air it is a smear)
  },
  _hover(dt, k, t, tilt = 0) {
    const p = this.v1.copy(this.S1); p.y += Math.sin(t * 1.9) * 0.025; p.z += Math.sin(t * 0.8) * 0.03;
    this._saucer(dt, k, p, this.art, { floor: this.y, tilt, still: true });
  },

  // ---------------------------------------------------------------- it begins
  _begin(k) {
    const G = k.G, cam = G.camera, v = k.v;
    st = { stage: 'done' }; save();          // from here on it has been seen: leave now and it does not play again
    this._warm(k); this._ui();
    const s = this.side;
    const c0 = cam.position.clone(), l0 = cam.getWorldDirection(new THREE.Vector3()).multiplyScalar(7).add(c0);
    // The camera's way from the toy to the picture: out of the vent behind the toy, up and aside, and across.
    const L = this.L, ka = new THREE.Vector3(Math.max(L.x0 + 0.3, v.pos.x - 0.75), Math.max(c0.y, this.y + 0.6), v.pos.z), k1 = new THREE.Vector3(Math.max(L.x0 + 0.35, v.pos.x - 0.6), this.y + 1.15, v.pos.z - 0.85 * s);
    const calm = !!(G.set && G.set.reduce);
    this.run = {
      T: 0, beat: 'cross', calm, fired: {}, skip: null, fov0: cam.fov, K1: { at: k1, look: this.S1.clone().setY(this.y + 0.85), fov: 58 },
      camAt: new THREE.CatmullRomCurve3([c0, ka, k1, this.CB.at.clone()], false, 'centripetal'), camLook: new THREE.CatmullRomCurve3([l0, this.S1.clone().setY(this.y + 0.8), this.S1.clone().setY(this.y + 0.95), this.CB.look.clone()], false, 'centripetal'),
      face: new THREE.Vector3().copy(this.art), sau: this.S1.clone(), spin: 0, botOn: false, there: false, gave: false, wide: false,
    };
    this.held = k.hold(() => {});
    v.vel.set(0, 0, 0);
    G.cutscene = inp => { if (this.run && this.run.T > 0.5 && (inp.took('pause') || inp.took('back'))) this.skip(); inp.queue.clear(); };
    this.gd.grace = Math.max(this.gd.grace || 0, G.t + 1e6);          // (no robot takes the toy in the middle of this)
    document.body.classList.add('ecine'); this.skipEl.hidden = false;
    // (main.js has just put YOU'RE IN across the middle of the screen, where the picture is: it is said again when this is over)
    { const el = document.getElementById('trick'); if (el && el.classList.contains('on') && el.textContent) { this.run.said = el.textContent; el.classList.remove('on'); } }
    this._park(); this.group.visible = true;
  },
  _ui() {
    if (this.skipEl) return;
    const stl = document.createElement('style'); stl.textContent = CSS; document.head.append(stl);
    const b = this.skipEl = document.createElement('button'); b.id = 'eskip'; b.type = 'button'; b.tabIndex = -1; b.hidden = true; b.textContent = 'Skip';
    // (No preventDefault on the pointerdown: it would cancel the focus a click gives, and in itch's frame the keys would never arrive.)
    b.addEventListener('pointerdown', () => this.skip());
    (document.getElementById('hud') || document.body).append(b);
    const f = this.fadeEl = document.createElement('div'); f.id = 'efade'; document.body.append(f);
  },
  skip() { const r = this.run; if (!r || r.skip != null) return false; r.skip = 0; if (this.fadeEl) this.fadeEl.style.opacity = '1'; return true; },

  // ---------------------------------------------------------------- each frame of it
  _once(key, at, fn) { const r = this.run; if (r.T >= at && !r.fired[key]) { r.fired[key] = true; fn(); } },
  _play(dt, k) {
    const r = this.run, G = k.G; if (G.entry.rate) dt *= G.entry.rate;      // (rate: a test aid, the scene run slowly so that more moments of it are measured)
    r.T += dt;
    if (r.skip != null && (r.skip += dt) > 0.24) return this._end(k);
    const t = r.T;
    r.beat = t < T.beam ? 'cross' : t < T.wake ? 'scan' : t < T.robot ? 'alive' : t < T.zap ? 'robot' : t < T.flee ? 'zap' : t < T.gone ? 'chase' : 'after';
    this._fly(dt, k, t); this._scan(dt, k, t); this._robot(dt, k, t); this._camera(dt, k, t);
    if (G.entry.onFrame) G.entry.onFrame(t);
    if (t >= T.end) this._end(k);
  },

  // The scan: the beam on the bottom rail, the light up round the frame, the label, the show.
  _scan(dt, k, t) {
    const r = this.run, P = this.probe, F = this.fr, W = this.wall.material.uniforms, calm = r.calm;
    const on = ease(span(t, T.beam, T.beam + 0.35)) * (1 - ease(span(t, T.wake, T.wake + 0.35)));
    this.beam.visible = this.spot.visible = on > 0.002;
    if (this.beam.visible) {
      // from the lens in its dome to a point that plays along the rail, a little under the canvas
      const a = this.v1.copy(P.pos); a.y += 0.158;
      const u = (F.hw - 0.06) * Math.sin((t - T.beam) * (calm ? 1.6 : 3.4)), b = this.v2.set(this.art.x - 0.05, F.bottom - F.fw * 0.6, this.art.z + u * this.side);
      const d = this.v3.subVectors(b, a), len = d.length();
      this.beam.position.copy(a); this.beam.quaternion.setFromUnitVectors(this.up, d.divideScalar(len)); this.beam.scale.set(1, len, 1);
      const U = this.beam.material.uniforms; U.uCol.value.copy(GREEN); U.uK.value = 1.5 * on;
      this.spot.position.copy(b); this.spot.material.color.copy(GREEN).multiplyScalar(0.9 * on);
    }
    // the light round the frame, and the spot of it that reaches the label; then it sinks back into the wall
    const fade = 1 - ease(span(t, T.wake + 0.2, T.wake + 2.0));
    this.wall.visible = t > T.climb && fade > 0.002;
    W.uTime.value = t; W.uP.value = t < T.climb ? 0 : 1.08 * ease(span(t, T.climb, T.top)); W.uK.value = fade;
    W.uLabK.value = 0.7 * ease(span(t, T.top - 0.1, T.label)) * (1 - ease(span(t, T.label, T.label + 0.9)));
    // heard: a tick as the light climbs, then the label's note
    if (t > T.climb && t < T.top && (r.tick = (r.tick || 0) - dt) <= 0) { r.tick = 0.17; k.synth.note(880 + 900 * span(t, T.climb, T.top), 0.05, { type: 'sine', vol: 0.012 }); }
    this._once('lamp', T.top, () => k.museum.spotlight(this.art, 0));                  // the picture's own lamp comes on (no brighter than any other's)
    this._once('label', T.label, () => { this.pl.expose(this.art, true); P._note(4, { gain: 0.035, dur: 0.9 }); });
    this._once('wake', T.wake, () => { this.pl.wake(this.art, true); P._call(0.2, 0.022, 12); });
  },

  // The saucer: at work; drawn back; struck; away.
  _fly(dt, k, t) {
    const r = this.run, P = this.probe, calm = r.calm, pos = r.sau, y = this.y;
    if (t >= T.gone) { if (this.shown) { this.shown = false; P._hide(); } this.hum.set(0); return; }
    this._once('hello', 0.7, () => { P._note(0, { gain: 0.022, dur: 0.5 }); P._note(1, { gain: 0.022, dur: 0.5, at: 0.3 }); });
    const bob = Math.sin(this.t * 1.9) * 0.025;
    const o = { floor: y, tilt: 0, roll: 0, still: true };
    if (t < T.flee) {
      const e = ease(span(t, T.wake, T.back));
      pos.lerpVectors(this.S1, this.S2, e); pos.y += bob;
      if (t < T.wake) pos.z += Math.sin(this.t * 0.8) * 0.03; else o.tilt = -0.1 * Math.sin(Math.PI * e);
      // it turns to the robot when it hears it
      if (t > T.seen + 0.1) r.face.set(this.bot.x, 0, this.bot.z);
      this._once('startle', T.seen + 0.1, () => P._whoosh(false, 0.018));
      if (t >= T.zap) {
        // struck: knocked back from the robot, and shaken
        const q = span(t, T.zap, T.zapEnd), kx = pos.x - this.R1.x, kz = pos.z - this.R1.z, kl = Math.hypot(kx, kz) || 1, back = 0.35 * (1 - (1 - q) * (1 - q));
        pos.x += kx / kl * back; pos.z += kz / kl * back; pos.y -= 0.07 * Math.sin(Math.PI * Math.min(1, q * 1.3));
        const w = Math.max(0, 1 - span(t, T.zap, T.flee));
        if (calm) o.roll = 0.14 * w * Math.sin((t - T.zap) * 5);
        else { o.roll = 0.5 * w * Math.sin((t - T.zap) * 23); o.tilt = 0.35 * w * Math.cos((t - T.zap) * 19); r.spin += dt * 16 * w; if (t < T.zapEnd && (r.fl = (r.fl || 0) - dt) <= 0) { r.fl = 0.07; P.flashI = (Math.random() * 5) | 0; P.flash = 1; } }
      }
    } else {
      // away: across the hall, out of the front doors, up over the avenue
      this._once('whoosh', T.flee, () => { r.off = pos.clone().sub(this.S2); P._whoosh(true, 0.04); P._call(0.09, 0.03, 12); });
      const q = span(t, T.flee, T.gone), s = Math.pow(q, 1.87);
      this.out.getPointAt(s, pos).addScaledVector(r.off, 1 - ease(q / 0.12)); this.out.getPointAt(Math.min(1, s + 0.01), r.face);      // (from where the bolt left it)
      r.spin *= Math.max(0, 1 - dt * 6);
      const outside = pos.x < this.xOut;
      o.tilt = 0.3 * Math.min(1, q * 6); o.wide = outside && pos.y > y + 3; o.still = false;
      o.floor = outside ? (pos.y - groundAt(k.plan, pos.x, pos.z, pos.y) < 4 ? groundAt(k.plan, pos.x, pos.z, pos.y) : null) : y;
    }
    if (calm) P.flash = Math.min(P.flash || 0, 0.3);
    this._saucer(dt, k, pos, r.face, o);
    if (r.spin) P.m.body.rotation.y = r.spin; else P.m.body.rotation.y = 0;
    this.hum.set(t < T.flee ? 0.02 : 0.02 * (1 - span(t, T.flee, T.flee + 1.2)));
  },

  // The robot: in from the Grand Staircase, the bolt, after it to the doors, and back to its beat.
  _robot(dt, k, t) {
    const r = this.run, b = this.bot, gd = this.gd, G = k.G, calm = r.calm, P = this.probe;
    if (t < T.robot) return;
    if (!r.botOn) { r.botOn = true; this._park(); b.mode = 'chase'; b.mt = 0; gd._plan(b, this.R1.x, this.R1.z); }
    const cam = G.cineEye ? G.cineEye.at : G.camera.position, sx = P.pos.x, sz = P.pos.z;
    const drive = to => { const d = Math.hypot(to.x - b.x, to.z - b.z); if (d < 0.05) { b.v = 0; return true; } if (b.pk < b.pn) gd._follow(b, Math.min(BOT.run, Math.sqrt(2 * 9 * d) + 0.35), dt); return false; };
    const look = (x, z, rate) => { b.look = turn(b.look, Math.atan2(x - b.x, z - b.z), rate * dt); };
    this._once('seen', T.seen, () => { gd.sfx.spotted(); gd.sfx.speak('intruder-alert'); });      // (said, not written across the screen: the picture is in the shot)
    if (t < T.chase) {
      if (drive(this.R1)) b.yaw = turn(b.yaw, Math.atan2(sx - b.x, sz - b.z), 5 * dt);
      if (t > T.seen) look(sx, sz, 7); else b.look = b.yaw;
      if (t >= T.charge && t < T.zap) { b.mode = 'charge'; b.mt = t - T.charge; this._once('charge', T.charge, () => gd.sfx.charge()); }
      else if (t >= T.zap) b.mode = t < T.zapEnd ? 'hold' : 'chase';
      // the bolt, from its prong to the saucer
      if (t >= T.zap && t < T.zapEnd) {
        const e = gd._emitter(b, this.v1), hit = this.v2.copy(P.pos);
        this._once('bolt', T.zap, () => {
          gd.sparkFloor = this.y;
          if (calm) gd.sfx.crack(false); else { gd.bolt.fire(e, hit, T.zapEnd - T.zap); gd.sparks.burst(hit.x, hit.y, hit.z, 14, 1.2); gd.sfx.crack(true); gd.sfx.buzz(T.zapEnd - T.zap); }
          P._whoosh(false, 0.03);
        });
        if (calm) {
          const d = this.v3.subVectors(hit, e), len = d.length(), q = span(t, T.zap, T.zapEnd);
          this.ray.visible = true; this.ray.position.copy(e); this.ray.quaternion.setFromUnitVectors(this.up, d.divideScalar(len)); this.ray.scale.set(0.6, len, 0.6);
          const U = this.ray.material.uniforms; U.uCol.value.setRGB(0.5, 0.75, 1.5); U.uK.value = 1.6 * Math.sin(Math.PI * q);
        } else {
          gd.bolt.a.copy(e); gd.bolt.b.copy(hit);
          if ((r.sp = (r.sp || 0) - dt) <= 0) { r.sp = 0.12; gd.sparks.burst(hit.x, hit.y, hit.z, 5, 1.0); }
        }
      } else this.ray.visible = false;
    } else {
      // after it, as far as the doors
      this.ray.visible = false;
      this._once('after', T.chase, () => { b.mode = 'chase'; gd._plan(b, this.RD.x, this.RD.z); });
      if (!r.there) { r.there = drive(this.RD); look(b.x + Math.sin(b.yaw), b.z + Math.cos(b.yaw), 6); }
      else { b.v = 0; look(b.x - 3, b.z + 0.4 * this.side, 3); }
      if (t >= T.quit && !r.gave) { r.gave = true; b.mode = 'search'; b.mt = 0; gd.sfx.giveUp(); }
    }
    b.group.visible = true; b.pool.visible = true;
    gd._draw(b, dt, G.t, !!G.lampOn, false, cam);
    if (calm) { b.beacon.material.color.copy(b.glowMat.color).multiplyScalar(0.6); b.beacon.scale.set(0.42, 0.42, 1); if (b.mode === 'charge') b.spark.material.opacity = 0.4 + 0.6 * Math.min(1, b.mt / 1.5); }
    // (with the robots switched off in Settings nobody else is running its bolt and its sparks)
    if (!gd.wasOn) { gd.bolt.update(dt, cam); gd.sparks.update(dt, gd.sparkFloor); }
  },

  // The camera: from the toy across to the picture; back, to take in the doorway; then from beside the picture, down the hall to the doors.
  _camera(dt, k, t) {
    const r = this.run, e = this.eye, G = k.G;
    const mix = (a, b, q) => { e.at.lerpVectors(a.at, b.at, q); e.look.lerpVectors(a.look, b.look, q); e.fov = a.fov + (b.fov - a.fov) * q; };
    if (r.calm) {
      // standing still, and cutting
      const c = t < T.beam - 0.2 ? r.K1 : t < T.wake + 0.6 ? this.CB : t < T.cut ? this.CC : this.CD; mix(c, c, 0);
    } else if (t < T.cross) {
      const q = ease(t / T.cross); r.camAt.getPoint(q, e.at); r.camLook.getPoint(q, e.look); e.fov = r.fov0 + (this.CB.fov - r.fov0) * ease(span(t, 0.3, T.cross));
    } else if (t < T.wake) mix(this.CB, this.CB2, ease(span(t, T.cross, T.wake)));
    else if (t < T.robot + 0.5) mix(this.CB2, this.CC, ease(span(t, T.wake, T.robot + 0.5)));
    else if (t < T.cut) {
      mix(this.CC, this.CC2, ease(span(t, T.robot + 0.5, T.cut)));
      if (t > T.zap && t < T.zap + 0.3) { const a = 0.02 * (1 - span(t, T.zap, T.zap + 0.3)); e.at.x += (Math.random() - 0.5) * a; e.at.y += (Math.random() - 0.5) * a; }      // (the bolt lands)
    } else mix(this.CD, this.CD2, ease(span(t, T.cut, T.end)));
    G.cineEye = e;
  },

  // ---------------------------------------------------------------- it is over (played out, or skipped): everything where the end leaves it
  // (quiet: a new night or a new game has taken everything back; nothing more is said or moved)
  _end(k, quiet = false) {
    const G = k.G, b = this.bot, gd = this.gd, said = this.run && this.run.said;
    this.run = null; G.cineEye = null; G.cutscene = null;
    if (this.held) { k.hold(null); this.held = null; }
    document.body.classList.remove('ecine'); if (this.skipEl) this.skipEl.hidden = true; if (this.fadeEl) this.fadeEl.style.opacity = '0';
    this._hideAll(); this._hush(); this.ray.visible = false;
    this.pl.expose(this.art, true); k.museum.spotlight(this.art, 0); this.pl.wake(this.art, false);      // lit, its label green; its show goes back as any does when a look ends
    gd.bolt.on = 0; gd.bolt.mesh.visible = false; gd.bolt.glow.visible = false;
    if (!gd.wasOn) { gd.sparks.live = 0; gd.sparks.mesh.visible = false; }      // (nobody else is running them)
    if (b) {
      b.cut = false; b.v = 0; b.sus = 0; b.seen = false; b.lost = 0; b.cool = 0;
      if (G.set && G.set.guards === false) { b.group.visible = false; b.pool.visible = false; gd._home(b, 0); }
      else if (quiet) gd._home(b, 0);
      else gd._return(b);                       // from wherever it had got to (still out of sight, if it had not come in yet), back to its beat
    }
    gd.grace = G.t + (quiet ? 20 : 10);          // a moment to get your bearings before it can see you (a new night: as long as guards.js gives one)
    if (quiet) return;
    if (G.shell && G.shell.chase) G.shell.chase();
    if (G.renderer && G.renderer.domElement) G.renderer.domElement.focus({ preventScroll: true });
    if (said) k.callout(said);      // (YOU'RE IN, kept back from the start; no line of this scene's own: four are waiting their turn already)
  },

  // A new night (or back to the title) in the middle of it.
  reset(k) {
    if (this.off) return;
    if (this.run) this._end(k, true);
    this._hideAll();
    if (st.stage === 'wait') this._park();
  },
  // A new game: it has not been seen.
  fresh(k) {
    if (this.off) return;
    if (this.run) this._end(k, true);
    st = { stage: 'wait' }; save();
    this._hideAll(); this.pl.expose(this.art, false); this._park();
  },

  // ---------------------------------------------------------------- the proofs (test aids)
  // Where everything is this frame, and whether it is in the clear: the saucer against the plan's own walls and solids
  // (confine, with its full radius: `push` is how far it would have to be moved, 0 in the open), the robot against its
  // grid (`clr`: metres from its middle to the nearest thing it would hit; it is BOT.r wide).
  sample() {
    const r = this.run, P = this.probe, b = this.bot, out = { T: r ? +r.T.toFixed(3) : -1, beat: r ? r.beat : null, stage: st.stage, saucer: null, robot: null };
    if (!this.off && P.m.group.visible) { const p = P.pos, q = p.clone(); confine(this.k.plan, q, R, true); out.saucer = { x: p.x, y: p.y, z: p.z, push: q.distanceTo(p) }; }
    if (b && b.group.visible) out.robot = { x: b.x, z: b.z, mode: b.mode, clr: clearAt(b.g, b.x, b.z) };
    return out;
  },
  // The picture's pixels, with and without everything of this scene: the game drawn from the cutscene's own eye (and
  // again from the same spot turned to face the picture, which is what counts whatever the screen's shape) with all of
  // it hidden, then shown; which pixels are the canvas is found by painting it a flat colour, then another.
  //   canvas   how many pixels of the picture are in the view
  //   changed  of those, how many differ at all with the scene drawn (must be 0)
  //   hard     of those, how many the things not added with artSafe change: the saucer's hull, the robot, its light,
  //            its bolt and sparks (must be 0: these have nothing but where they are to keep them off the picture)
  //   gap      how near any pixel those change comes to the picture, in pixels of a W-wide view (null: not within 24)
  //   veiled   canvas pixels where the frame's alpha is not 0 with everything drawn: something see-through, of this
  //            scene or not, lies over the picture there (artSafe trusts that alpha; must be 0)
  // Floating point, no MSAA.
  check({ W = 480 } = {}) {
    const G = this.k.G, r = G.renderer, e = G.cineEye; if (this.off || !e) return null;
    const H = Math.round(W * 9 / 16), N = W * H * 4, rt = this._rt || (this._rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType }));
    if (rt.width !== W) { rt.setSize(W, H); this._buf = this._mask = null; }
    const B = this._buf || (this._buf = [0, 1, 2, 3, 4].map(() => new Float32Array(N))), [a, b, c, m1, m2] = B;
    const cam = this._cam || (this._cam = new THREE.PerspectiveCamera(50, W / H, 0.05, 400)), art = this.art, P = this.probe, gd = this.gd, bot = this.bot;
    const soft = [this.group, P.m.halo, P.m.field, P.ribbon.mesh, P.motes.mesh, P.pool, P.column], hard = [P.m.body, bot && bot.group, bot && bot.pool, gd.bolt.mesh, gd.bolt.glow, gd.sparks.mesh].filter(Boolean);
    const was = new Map([...soft, ...hard].map(o => [o, o.visible])), show = (list, on) => { for (const o of list) o.visible = on && was.get(o); };
    const prev = r.getRenderTarget(), flat = this._flat || (this._flat = new THREE.MeshBasicMaterial({ fog: false, toneMapped: false }));
    const shot = out => { r.setRenderTarget(rt); r.clear(); r.render(G.scene, cam); r.readRenderTargetPixels(rt, 0, 0, W, H, out); };
    const res = {}, GAP = 24;
    for (const view of ['screen', 'facing']) {
      cam.position.copy(e.at); cam.up.set(0, 1, 0);
      if (view === 'screen') { cam.fov = e.fov; cam.lookAt(e.look); }
      else { const d = Math.max(0.3, Math.hypot(e.at.x - art.x, e.at.y - art.y, e.at.z - art.z)); cam.fov = Math.max(12, Math.min(110, 2 * Math.atan((art.h / 2 + 0.6) / d) * 180 / Math.PI)); cam.lookAt(art.x, art.y, art.z); }
      cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      show(soft, false); show(hard, false); shot(a);
      const own = art.mesh.material; art.mesh.material = flat; flat.color.set(0xff00ff); shot(m1); flat.color.set(0x00ff00); shot(m2); art.mesh.material = own;
      show(hard, true); shot(c);
      show(soft, true); shot(b);
      const mask = this._mask || (this._mask = new Uint8Array(W * H));
      const df = (p, q, o) => Math.abs(p[o] - q[o]) + Math.abs(p[o + 1] - q[o + 1]) + Math.abs(p[o + 2] - q[o + 2]), eps = o => 1e-4 * (1 + a[o] + a[o + 1] + a[o + 2]);
      let canvas = 0, changed = 0, hardOn = 0, veiled = 0, x0 = W, x1 = -1, y0 = H, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x, o = i * 4;
        mask[i] = df(m1, m2, o) > 0.2 ? 1 : 0; if (!mask[i]) continue;
        canvas++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        if (df(a, b, o) > eps(o)) changed++;
        if (df(a, c, o) > eps(o)) hardOn++;
        if (b[o + 3] > 1e-6) veiled++;
      }
      let gap = null;
      if (canvas) for (let y = Math.max(0, y0 - GAP); y <= Math.min(H - 1, y1 + GAP); y++) for (let x = Math.max(0, x0 - GAP); x <= Math.min(W - 1, x1 + GAP); x++) {
        const i = y * W + x; if (mask[i] || df(a, c, i * 4) <= eps(i * 4)) continue;
        const g = Math.ceil(gap == null ? GAP : gap);
        for (let yy = Math.max(0, y - g); yy <= Math.min(H - 1, y + g); yy++) for (let xx = Math.max(0, x - g); xx <= Math.min(W - 1, x + g); xx++) if (mask[yy * W + xx]) { const d = Math.hypot(xx - x, yy - y); if (d <= GAP && (gap == null || d < gap)) gap = d; }
      }
      res[view] = { canvas, changed, hard: hardOn, veiled, gap: gap == null ? null : +gap.toFixed(1), high: canvas ? y1 - y0 + 1 : 0 };
    }
    for (const [o, v] of was) o.visible = v;
    r.setRenderTarget(prev);
    return res;
  },
});
