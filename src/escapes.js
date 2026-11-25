// What gets out of a living painting (docs/ESCAPES.md). A living work is HOME or OUT: while it is out, one thing of
// its own (a creature, a few objects, a patch of weather) is somewhere in the building, and its label's green glow
// flutters. A security robot that holds it in its searchlight for a moment turns the lamp from its search colour to a
// warm gallery white, and it comes apart into its painter's strokes, flows along the floor and up under its own frame.
// The toy can bring it home first, like a sheepdog: come up to it and it sets off for its own wall, and goes in by
// itself. That pays a few chips; a robot's lamp pays nothing.
//
// The rules this file keeps (docs/ESCAPES.md, "Where this stands", and the review's twelve):
//   * No person is ever quarry: an escapee is a creature, a thing or weather. People in a plan only help (Goya's boy on
//     his ram fetches the lambs): they are not records here, so no robot can light, follow or send one home.
//   * A lamp, not a weapon: no bolt, no bang, no flinch. With "Reduce motion and flashing" it is a slow fade.
//   * Nothing is frightened, hurt or lost: sent home is home, and it can come out again.
//   * Nothing crosses a canvas: every material here goes through paintlife's guard on a roaming key (roamGuard), whose
//     canvases are picked every frame, the ones it could be seen in front of first. __esc.check() proves it.
//   * Nothing goes into a quiet room (QUIET: sacred, devotional, memorial, private), nor near a quiet work in a room it
//     shares (QUIET_WORKS), and no robot sends anything home in front of one.
//   * Nothing watches, follows or comes up to the player: it wanders its own way; herded, it goes home, not to you.
//   * Few at once: CAP_OUT out (3 where memory is short, else 6), CAP_BODY creatures drawn (6, else 20).
//
// Far from the toy an escapee is only a record that moves over the floor plan on a slow clock; near it has a body (one
// mesh if it can be, and what it carries of its world is one more). The marks every escapee leaves (a trail, the strokes
// it goes home as) are one instanced mesh for all of them.
//
//   window.__esc   list(), specs(), release(id), place(id, x, z), home(id, 'light' | 'toy' | 'now'), bots(), bot(i, x, z, look),
//                  check(id, views), cost(), tune (the numbers), on
//   ?escout        in the address: start with every one out (up to the cap); ?escout=keg,hats: those. For tests.
// Each escapee is a file in src/escape/ (escapeFor(id, spec), see src/escape/kit.js).

import * as THREE from 'three';
import { feature, features } from './features.js';
import { LOWMEM } from './budget.js';
import { roomAt } from './plan.js';
import { grid, path, cellAt, clearAt, lineClear, sight, nearestOpen } from './guardplan.js';
import { protectArt, palette, roamGuard, placeRoam, guardBlock, lifeOf, GUARD_MAX, rng } from './paintlife.js';
import { SPECS, atlas, TAU, CELL, CELLS } from './escape/kit.js';
import './escape/keg.js';
import './escape/hats.js';
import './escape/lambs.js';
import './escape/parasol.js';
import './escape/monkey.js';

const TUNE = {
  linger: 4,        // seconds of a work's show watched before something can get out
  off: 4,           // and then the toy this far from the work (metres): it gets out as you drive off
  hold: 1.4,        // seconds a robot's lamp rests on it before the lamp goes warm
  see: 8, half: 0.62,      // a robot's lamp: how far, and half its width (radians): src/guards.js's own
  near: 30, far: 38,       // a body within this of the toy; let go beyond that
  herd: 2.2, keep: 6,      // the toy this close sets it off home; it keeps going while the toy is within this
  hops: 2,          // how many rooms from its own it wanders
  quiet: 4.5,       // metres kept from a quiet work in a room it shares
};
const CAP_OUT = LOWMEM ? 3 : 6, CAP_BODY = LOWMEM ? 6 : 20, MARKS = LOWMEM ? 340 : 960, STROKES = LOWMEM ? 96 : 240;
const SAVE = 'after-hours.escapes';
// Rooms nothing roams into (docs/ESCAPES.md's "nothing" rows): 202 Jean Gros, 209 Claude's Delphi, 211 El Greco and Sánchez
// Cotán, 218 Reynolds and David, 222 Courbet, 223 Moreau and Beata Beatrix, 241 Gauguin's Arlésiennes, 247 Mahana no atua.
const QUIET = new Set(['G202', 'G209', 'G211', 'G218', 'G222', 'G223', 'G241', 'G247']);
// And one quiet work in a room that is another escapee's own (226, the Millinery Shop's): Degas's uncle and niece, in mourning.
const QUIET_WORKS = [14574];

const _v = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _s = new THREE.Vector3(), _m = new THREE.Matrix4(), _col = new THREE.Color(), _vp = new THREE.Vector4();
const UP = new THREE.Vector3(0, 1, 0);
const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x), smooth = x => { x = clamp01(x); return x * x * (3 - 2 * x); };
const wrap = a => { a = (a + Math.PI) % TAU; return (a < 0 ? a + TAU : a) - Math.PI; };

// ------------------------------------------------------------------ marks: trails, and the strokes it goes home as --
// One instanced mesh of marks for every escapee: some stay where they are put and fade (a trail), the rest are placed
// afresh each frame (the strokes on their way home). Each is in one painter's hand: a cell of the kit's atlas.
class Marks {
  constructor(n, key) {
    const g = new THREE.PlaneGeometry(1, 1), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.04 + uv.getX(i) * 0.92, 0.03 + uv.getY(i) * 0.94);
    this.cell = new THREE.InstancedBufferAttribute(new Float32Array(n), 1); this.cell.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aCell', this.cell);
    const m = new THREE.MeshBasicMaterial({ map: atlas(), alphaTest: 0.5, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => { sh.vertexShader = 'attribute float aCell;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n  vMapUv.x = (vMapUv.x + aCell) / ' + CELLS + '.0;'); };
    m.customProgramCacheKey = () => 'escapemarks';
    this.mesh = new THREE.InstancedMesh(g, protectArt(m, key, { soft: 0.05 }), n);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.renderOrder = 6; this.mesh.setColorAt(0, _col.set(0xffffff));
    this.n = n; this.kept = []; this.i = 0;
  }
  // A mark that stays: { x, y, z, nx, ny, nz (the way it faces), tx, ty, tz (its long way), w, h, color, cell, life, vx.. (drifts), spin }
  keep(o) { o.age = 0; if (this.kept.length >= this.n * 0.5) this.kept.shift(); this.kept.push(o); }
  // p: where; n: the way it faces; t: its long way; w, h: metres across and along; cell: whose hand (CELL.*)
  put(p, n, t, w, h, color, cell = 0) {
    if (this.i >= this.n) return;
    _s.crossVectors(t, n).normalize();
    _m.set(_s.x * w, t.x * h, n.x, p.x, _s.y * w, t.y * h, n.y, p.y, _s.z * w, t.z * h, n.z, p.z, 0, 0, 0, 1);
    this.mesh.setMatrixAt(this.i, _m); this.mesh.setColorAt(this.i, color); this.cell.array[this.i] = cell; this.i++;
  }
  begin(dt) {
    this.i = 0;
    for (let j = this.kept.length - 1; j >= 0; j--) {
      const o = this.kept[j]; o.age += dt; if (o.age >= o.life) { this.kept.splice(j, 1); continue; }
      if (o.vx !== undefined) { o.x += o.vx * dt; o.y += o.vy * dt; o.z += o.vz * dt; if (o.y < o.floor) { o.y = o.floor; o.vx = o.vy = o.vz = 0; o.nx = 0; o.ny = 1; o.nz = 0; o.spin = 0; } else if (o.spin) { const a = o.spin * dt, c = Math.cos(a), s = Math.sin(a), nx = o.nx * c - o.ny * s; o.ny = o.nx * s + o.ny * c; o.nx = nx; } }
      const f = Math.min(1, o.age / 0.25) * Math.min(1, (o.life - o.age) / (o.life * 0.35));
      _b.set(o.nx, o.ny, o.nz).normalize(); _c.set(o.tx, o.ty, o.tz); if (Math.abs(_c.dot(_b)) > 0.9) _c.set(_b.y, _b.z, _b.x); _c.addScaledVector(_b, -_c.dot(_b)).normalize();
      this.put(_v.set(o.x, o.y, o.z), _b, _c, o.w * f, o.h * f, o.color, o.cell || 0);
    }
  }
  end() { this.mesh.count = this.i; this.mesh.instanceMatrix.needsUpdate = true; this.cell.needsUpdate = true; if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true; this.mesh.visible = this.i > 0; }
}

// The shadows a robot's lamp throws: what stands in the light keeps the light off the floor behind it. Soft dark
// ovals lying on the floor, away from the lamp, as long as the lamp is low. On the floor only, and guarded like the marks.
class Shade {
  constructor(n, key) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.72)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const map = new THREE.CanvasTexture(c); map.userData.own = true;
    const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2);
    this.a = new THREE.InstancedBufferAttribute(new Float32Array(n), 1); this.a.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aA', this.a);
    const m = new THREE.MeshBasicMaterial({ map, color: 0x241a12, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    m.onBeforeCompile = sh => {
      sh.vertexShader = 'attribute float aA; varying float vA;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n  vA = aA;');
      sh.fragmentShader = 'varying float vA;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.a *= vA;');
    };
    m.customProgramCacheKey = () => 'escapeshade';
    this.mesh = new THREE.InstancedMesh(g, protectArt(m, key, { soft: 0.08 }), n);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.renderOrder = 5; this.mesh.visible = false; this.n = n; this.i = 0;
  }
  // One thing's shadow: a ball of radius r (ry up and down), its middle at (x, y, z), over a floor at fy; the lamp at (lx, ly, lz).
  put(x, y, z, r, ry, fy, lx, ly, lz, k) {
    if (this.i >= this.n || k <= 0.01) return;
    let dx = x - lx, dz = z - lz; const d = Math.hypot(dx, dz); if (d < 0.3) return; dx /= d; dz /= d;
    const hl = Math.max(0.25, ly - fy), lo = Math.max(0, y - ry - fy), hi = y + ry - fy;
    const s0 = lo < hl - 0.05 ? d * lo / (hl - lo) : 2.2, s1 = Math.min(2.4, hi < hl - 0.08 ? d * hi / (hl - hi) : 2.4) + r * 0.6;
    const a = Math.min(s0, s1) - r * 0.6, len = Math.max(r * 1.6, s1 - a), mid = a + len / 2, wide = r * 2 * (1 + mid / d) * 1.1;
    _m.set(dz * wide, 0, dx * len, x + dx * mid, 0, 1, 0, fy + 0.012, -dx * wide, 0, dz * len, z + dz * mid, 0, 0, 0, 1);
    this.mesh.setMatrixAt(this.i, _m); this.a.array[this.i] = k * Math.min(1, 0.55 + 0.6 * r / Math.max(0.2, len)); this.i++;
  }
  begin() { this.i = 0; }
  end() { this.mesh.count = this.i; this.mesh.visible = this.i > 0; if (this.i) { this.mesh.instanceMatrix.needsUpdate = true; this.a.needsUpdate = true; } }
}

// ------------------------------------------------------------------ the feature --
const F = {
  id: 'escapes',
  list0: [], log: [], on: false, ms: 0,
  init(k) {
    this.k = k; const G = k.G, P = k.plan; G.escapes = this;
    // The rooms and the ways between them an escapee may use: the robots' own doors, and never a quiet room.
    const same = (a, b) => Math.abs(a - b) < 0.06;
    this.adj = new Map(); this.floors = new Map(); this._front = [];
    for (const d of P.doors) {
      if (d.out || d.b === 'out' || d.vent || d.hidden || d.h < 1.3) continue;
      const a = P.byId[d.a], b = P.byId[d.b]; if (!a || !b || a.secret || b.secret || !same(a.y, d.y) || !same(b.y, d.y)) continue;
      for (const [u, w] of [[a, b], [b, a]]) { if (!this.adj.has(u.id)) this.adj.set(u.id, []); this.adj.get(u.id).push({ to: w.id, x: (d.x0 + d.x1) / 2, z: (d.z0 + d.z1) / 2 }); }
    }
    this.quietArts = k.museum.arts.filter(a => QUIET_WORKS.includes(a.work.id));
    for (const s of SPECS) {
      const art = k.museum.arts.find(a => a.work.id === s.id); if (!art || art.nx == null) continue;
      this.list0.push({ spec: s, id: s.id, art, state: 'home', x: art.x + art.nx * 0.9, z: art.z + art.nz * 0.9, y: art.fy != null ? art.fy : (P.byId[art.room] || { y: 0 }).y, room: art.room,
        yaw: Math.atan2(art.nx, art.nz), v: 0, t: 0, lit: 0, by: null, led: 0, n: s.count || 1, body: null, group: null, key: null, path: new Float32Array(512), pn: 0, pk: 0,
        rest: 0, grid: null, at: null, going: null, gone: 0, emerge: 1, watch: 0, armed: false, voiceT: 3, trailD: 0, slow: 0, rand: rng(s.id), outT: 0 });
    }
    this.key = roamGuard(); this.marks = new Marks(MARKS, this.key); this.marks.mesh.onBeforeRender = r => this._px(this.key, r); k.group.add(this.marks.mesh);
    this.shade = new Shade(24, this.key); this.shade.mesh.onBeforeRender = r => this._px(this.key, r); k.group.add(this.shade.mesh);
    this._restore();
    // (a test's way of starting with things out: ?escout lets every one out, up to the cap; ?escout=keg,hats those)
    const q = typeof location !== 'undefined' && /[?&]escout(?:=([^&]*))?(?:&|$)/.exec(location.search);
    if (q && k.G.mode === 'explore' && k.G.set.escapes !== false) { this.on = true; const want = q[1] ? decodeURIComponent(q[1]).toUpperCase().split(',') : null; for (const E of this.list0) if (!want || want.some(w => E.spec.tag.includes(w) || String(E.id) === w)) this.release(E, { quiet: true }); }
    this._switch();
    if (typeof window !== 'undefined') window.__esc = this._api();
  },
  active(k) { return k.G.mode === 'explore'; },
  get out() { return this.list0.filter(E => E.state !== 'home'); },
  // For the tracker and the security terminal: what is out, by name.
  list() { return this.out.map(E => ({ id: E.id, tag: E.spec.tag, name: E.spec.name, from: E.art.work.t, x: E.x, z: E.z, y: E.y, room: E.room, state: E.state, lit: E.lit > 0.05, led: E.led > 0, body: E.body === true })); },

  // ---------------------------------------------------------------- out, and home --
  release(E, { quiet = false, force = false } = {}) {
    if (E.state !== 'home') return 'out already';
    if (!this.on) return 'escapes are switched off';
    if (!force && this.out.length >= CAP_OUT) return 'the cap: ' + CAP_OUT + ' out at once';
    if (E.spec.may && E.spec.may(E, this.k) !== true) return 'not yet: ' + E.spec.name + ' may not go';      // (never forced: the monkey on its lead is a clue)
    const a = E.art;
    E.state = 'out'; E.x = a.x + a.nx * 0.55; E.z = a.z + a.nz * 0.55; E.room = a.room; E.yaw = Math.atan2(a.nx, a.nz); E.v = 0; E.t = 0; E.outT = 0; E.lit = 0; E.by = null; E.led = 0; E.pn = 0; E.rest = 1.6; E.gone = 0; E.going = null; E.emerge = 0; E.grid = null; E.armed = false; E.watch = 0;
    this._flutter(E, true); this.dirty = true;
    if (E.spec.onOut) E.spec.onOut(E, this.k);
    if (!quiet && E.spec.line) this.k.once('escape-' + E.id, E.spec.line, 6);
    this._log(E.spec.tag + ' out of ' + this._where(a.room));
    return true;
  },
  // how: 'light' (a robot's lamp: strokes), 'toy' (brought home: it goes in by itself, and pays), 'now' (at once, no show)
  home(E, how = 'light', b = null) {
    if (E.state === 'home') return false;
    if (how === 'now' || E.body !== true) { this._arrive(E, how, b); return true; }
    if (E.state === 'going') return false;
    const a = E.art, k = this.k, calm = !!(k.museum.calm || k.G.set.reduce), happy = how === 'toy';
    // The way: over the floor to the foot of its own wall, and up to just under the frame (never onto the picture).
    const pts = [new THREE.Vector3(E.x, E.y + 0.014, E.z)], foot = new THREE.Vector3(a.x + a.nx * 0.03, E.y + 0.014, a.z + a.nz * 0.03);
    let far = true;
    if (Math.abs((a.fy != null ? a.fy : E.y) - E.y) < 0.5) {
      const g = this._grid(E), h = this._spot(E), out = E.path; let n = 0;
      if (g && h && cellAt(g, E.x, E.z) >= 0) n = lineClear(g, E.x, E.z, h.x, h.z, 0.3) ? 0 : path(g, E.x, E.z, h.x, h.z, out, 0.3, 14000);
      if (g && h && (n > 1 || lineClear(g, E.x, E.z, h.x, h.z, 0.3))) { for (let i = 1; i < n; i++) pts.push(new THREE.Vector3(out[i * 2], E.y + 0.014, out[i * 2 + 1])); pts.push(new THREE.Vector3(h.x, E.y + 0.014, h.z)); far = false; }
    }
    if (far) pts.push(new THREE.Vector3(E.x + Math.sin(E.yaw) * 3.2, E.y + 0.014, E.z + Math.cos(E.yaw) * 3.2));      // (no way over this floor: the strokes run out and are gone)
    else { pts.push(foot); pts.push(new THREE.Vector3(foot.x, a.y - a.h / 2 - (a.frame || 0.08) - 0.05, foot.z)); }
    const len = [0]; for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const total = len[len.length - 1], R = E.rand, pal = E.pal, hexes = E.spec.colors || [], hues = E.hues && E.hues.length ? E.hues : null;
    // What it comes apart into: its painter's own strokes (spec.mark: whose hand, and no bigger than the strokes on its
    // body), in the colours of the body itself, of what it was painted with, and of its picture. Each is born on the
    // thing, where a stroke of it was, and runs off it onto the floor.
    const mk = E.spec.mark || {}, mw = mk.w || [0.03, 0.05], ml = mk.long || [1.2, 1.8], jit = mk.jit == null ? 0.8 : mk.jit;
    const parts = (!calm && E.spec.parts && E.spec.parts(E)) || [{ x: E.x, y: E.y + (E.spec.height || 0.4) * 0.5, z: E.z, r: Math.min(E.spec.radius || 0.4, E.spec.height || 0.4) * 0.45 }];
    const strokes = Array.from({ length: calm ? 0 : STROKES }, (_, i) => {
      const c = new THREE.Color(), q = R();
      if (hues && q < 0.62) c.copy(hues[Math.floor(R() * hues.length)]); else if (pal && q > 0.84) c.set(pal.hex[1 + Math.floor(R() * 6)]); else c.set(hexes[Math.floor(R() * hexes.length)] || '#bbb');
      if (happy) c.lerp(_col.set(0xfff0c8), 0.1); c.multiplyScalar(0.8);
      const P0 = parts[i % parts.length], th = R() * TAU, ny = Math.min(1, R() * 1.6 - 0.6), sq = Math.sqrt(1 - ny * ny), nx = Math.cos(th) * sq, nz = Math.sin(th) * sq, ry = P0.ry || P0.r;
      return { d: R() * 1.3, off: (R() - 0.5) * 0.36, bx: P0.x + nx * P0.r, by: Math.max(E.y + 0.02, P0.y + ny * ry), bz: P0.z + nz * P0.r, nx, ny, nz, c, cell: mk.cell || 0,
        w: mw[0] + R() * (mw[1] - mw[0]), l: ml[0] + R() * (ml[1] - ml[0]), ang: (mk.turn || 0) + (R() - 0.5) * 2 * jit, ph: R() * TAU, k: 0.8 + R() * 0.35, ly: (i % 16) * 0.0005, fall: 0.5 + 0.4 * R() };
    });
    const flow = calm ? 3.2 : Math.max(happy ? 1.8 : 2.8, Math.min(7, total / 2.6));
    E.going = { t: 0, T: calm ? flow + 1 : flow * 1.15 + 2.1, flow, pts, len, total, strokes, happy, calm, how, b, far, wallFrom: far ? 1e9 : len[len.length - 2] };
    E.state = 'going'; E.pn = 0; E.v = 0; E.led = 0; this.dirty = true;
    if (!calm) { const s = k.synth; if (happy) s.chime([523.25, 659.25, 783.99, 1046.5], { gap: 0.11, dur: 1.5, vol: 0.045 * this._vol(E) }); else s.chime([440, 554.37, 659.25], { gap: 0.22, dur: 1.8, vol: 0.035 * this._vol(E) }); }
    return true;
  },
  _arrive(E, how, b) {
    const k = this.k, was = E.state; E.state = 'home'; E.going = null; E.gone = 0; E.lit = 0; E.led = 0; E.pn = 0; E.by = null; E.watch = 0; E.armed = false;
    this._drop(E); this._flutter(E, false); this.dirty = true;
    if (E.spec.onHome) E.spec.onHome(E, how, k);
    if (was === 'home') return;
    if (how === 'toy') {
      const n = E.spec.chips || 20; k.chips(n);
      k.say(E.spec.back || (cap(E.spec.name) + ' is back in its painting.'), 5);
      this._log(E.spec.tag + ' brought home by the toy, +' + n + ' chips');
    } else if (how === 'light') this._log(E.spec.tag + ' sent home by ' + (b ? 'BOT-' + String(b.i).padStart(2, '0') : 'a robot') + "'s lamp");
    else if (how === 'far') this._log(E.spec.tag + ' sent home by a lamp, out of sight');
    k.synth.note(880, 0.5, { type: 'sine', vol: 0.02 * this._vol(E) });      // the label settles
  },
  _log(text) { const t = new Date(); this.log.push(String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0') + '  ' + text); if (this.log.length > 24) this.log.shift(); },
  _where(id) { const r = this.k.plan.byId[id]; return r ? (r.kind === 'hall' ? 'Griffin Court' : r.gallery || r.name || id) : '?'; },
  _flutter(E, on) { const f = features.find(q => q.id === 'paintlife'); if (f && f.flutter) f.flutter(E.art, on); const L = lifeOf(E.id); if (L) L.after = on && E.spec.hide ? Lf => E.spec.hide(Lf, Lf.spec, E) : null; },
  _vol(E) { const p = this.k.G.vehicle.pos, d = Math.hypot(p.x - E.x, p.z - E.z); return Math.abs(p.y - E.y) > 3 ? 0 : clamp01(1 - d / 20) ** 1.5; },

  // ---------------------------------------------------------------- the floor it knows --
  // Its rooms: within a few doors of where it is, the way back to its own room among them, and no quiet room.
  _grid(E) {
    if (E.grid && E.grid.rooms.includes(E.room)) return E.grid;
    const P = this.k.plan, start = E.room, r0 = P.byId[start]; if (!r0) return null;
    const ok = id => !QUIET.has(id) || id === E.art.room, seen = new Map([[start, 0]]), q = [start], from = new Map();
    while (q.length) { const id = q.shift(), n = seen.get(id); if (n >= 5) continue; for (const l of this.adj.get(id) || []) if (!seen.has(l.to) && ok(l.to)) { seen.set(l.to, n + 1); from.set(l.to, id); q.push(l.to); } }
    const set = new Set([...seen].filter(([, n]) => n <= TUNE.hops).map(([id]) => id).slice(0, 9));
    for (const w of E.spec.rooms || []) if (seen.get(w) <= TUNE.hops) for (let id = w; id && !set.has(id); id = from.get(id)) set.add(id);      // (a room it is known for, that the nine would have left out)
    for (let id = E.art.room; id && seen.has(id); id = from.get(id)) set.add(id);      // the way home, however it wandered here
    const ids = [...set].filter(id => Math.abs(P.byId[id].y - r0.y) < 0.06);
    E.grid = grid(P, ids, r0.y); E.homeSpot = undefined;
    return E.grid;
  },
  // The floor in front of its own picture, if this floor reaches it.
  _spot(E) {
    if (E.homeSpot !== undefined) return E.homeSpot;
    const g = this._grid(E), a = E.art; E.homeSpot = null;
    if (g && g.rooms.includes(a.room)) { const c = nearestOpen(g, a.x + a.nx * 0.8, a.z + a.nz * 0.8, 0.36, 2.5); if (c >= 0) E.homeSpot = { x: g.X0 + ((c % g.nx) + 0.5) * g.C, z: g.Z0 + (Math.floor(c / g.nx) + 0.5) * g.C }; }
    return E.homeSpot;
  },
  _quietNear(x, z, y) { for (const a of this.quietArts) if (Math.abs((a.fy != null ? a.fy : a.y - 1.5) - y) < 2.5 && Math.hypot(a.x - x, a.z - z) < TUNE.quiet) return true; return false; },
  _to(E, x, z, need = E.spec.need || 0.42) {
    const g = this._grid(E); E.pn = 0; if (!g) return false;
    if (clearAt(g, E.x, E.z) < need) { const c = nearestOpen(g, E.x, E.z, need, 3); if (c < 0) return false; E.x = g.X0 + ((c % g.nx) + 0.5) * g.C; E.z = g.Z0 + (Math.floor(c / g.nx) + 0.5) * g.C; }
    if (lineClear(g, E.x, E.z, x, z, need)) { E.path[0] = E.x; E.path[1] = E.z; E.path[2] = x; E.path[3] = z; E.pn = 2; }
    else E.pn = Math.min(256, path(g, E.x, E.z, x, z, E.path, need, 14000));
    E.pk = 1; return E.pn > 1;
  },
  // Somewhere to wander to: an open place in one of its rooms (its own room and the one it is in, most often).
  _wander(E) {
    const g = this._grid(E), P = this.k.plan, R = Math.random, V = this.k.G.vehicle.pos; if (!g) return;
    // (its own idea of where: a flock makes for a bench)
    if (E.spec.where && R() < 0.65) { const w = E.spec.where(E, this.k, g); if (w && !this._quietNear(w.x, w.z, E.y) && Math.hypot(w.x - V.x, w.z - V.z) > 3.5 && this._to(E, w.x, w.z)) return; }
    for (let n = 0; n < 24; n++) {
      const id = R() < 0.45 ? E.room : g.rooms[Math.floor(R() * g.rooms.length)], r = P.byId[id]; if (!r || (QUIET.has(id))) continue;
      const x = r.x0 + 0.8 + R() * Math.max(0.1, r.x1 - r.x0 - 1.6), z = r.z0 + 0.8 + R() * Math.max(0.1, r.z1 - r.z0 - 1.6);
      if (Math.hypot(x - E.x, z - E.z) > 26 || clearAt(g, x, z) < (E.spec.need || 0.42) + 0.2 || this._quietNear(x, z, E.y) || Math.hypot(x - V.x, z - V.z) < 3.5) continue;
      if (this._to(E, x, z)) return;
    }
  },
  // Is the toy square in the way it is going?
  _facing(E, p, d) { const i = Math.min(E.pk, E.pn - 1), nx = E.path[i * 2] - E.x, nz = E.path[i * 2 + 1] - E.z, nl = Math.hypot(nx, nz) || 1; return (nx * (p.x - E.x) + nz * (p.z - E.z)) / (nl * (d || 1)) > 0.75; },
  _move(E, dt, speed) {
    E.v = 0; if (!(E.pn > 1) || E.pk >= E.pn) return true;
    let left = speed * dt;
    while (left > 0 && E.pk < E.pn) {
      const tx = E.path[E.pk * 2], tz = E.path[E.pk * 2 + 1], dx = tx - E.x, dz = tz - E.z, d = Math.hypot(dx, dz);
      if (d < 1e-4) { E.pk++; continue; }
      const want = Math.atan2(dx, dz); E.yaw += wrap(want - E.yaw) * Math.min(1, dt * 7);
      const st = Math.min(d, left); E.x += dx / d * st; E.z += dz / d * st; left -= st; E.v = speed; if (st >= d - 1e-6) E.pk++;
    }
    return E.pk >= E.pn;
  },

  // ---------------------------------------------------------------- bodies --
  async _embody(E) {
    E.body = 'pending';
    try {
      const k = this.k, L = lifeOf(E.id); if (L && L.made !== true) await L.prepare();
      E.pal = await palette(E.art).catch(() => null);
      const g = new THREE.Group(), key = roamGuard(); E.build = {};
      await E.spec.build(E, L && L.made === true ? L : null, { group: g, k, pal: E.pal });
      if (E.body !== 'pending') { dispose(g); return; }      // (sent home, or switched off, while it was being made)
      E.mats = [];
      g.traverse(o => {
        for (const m of [].concat(o.material || [])) { protectArt(m, key, { soft: m.transparent ? 0.08 : 0.05 }); if (m.userData.u && m.userData.u.uGone && !m.userData.helper) E.mats.push(m); }
        o.frustumCulled = false; if (o.isMesh) { const was = o.onBeforeRender; o.onBeforeRender = (r, s, c, ...rest) => { this._px(key, r); was.call(o, r, s, c, ...rest); }; }
      });
      E.hues = hues(g); E.group = g; E.key = key; k.group.add(g); E.body = true;
    } catch (e) { console.error('escapes: ' + E.spec.name + ': ' + (e && e.stack || e)); E.body = 'broken'; }
  },
  _drop(E) { if (E.group) { E.group.removeFromParent(); dispose(E.group); } E.group = null; E.key = null; E.mats = null; E.build = null; if (E.body !== 'broken') E.body = null; },
  // the guard's pixel size, for the target and camera this is about to be drawn with
  _px(key, r) { r.getCurrentViewport(_vp); const cam = this._cam || this.k.G.camera; guardBlock(key).uLifePx.value = Math.max(1, _vp.w * cam.projectionMatrix.elements[5] * 0.5); },
  // The canvases a guard watches. Near ones always: those of the rooms about (the thing's, the toy's, and the rooms next
  // to those). And any other on this floor, however far down a run of doorways, that the thing could be seen in front
  // of from this eye, unless a wall stands between the eye and it. If that is more than a guard holds, the ones it
  // could be seen in front of come first, then the nearest.
  _arts(rooms) {
    const M = this.k.museum, out = [], seen = new Set();
    for (const id of rooms) for (const r of [id, ...(this.adj.get(id) || []).map(l => l.to)]) { if (seen.has(r)) continue; seen.add(r); for (const a of (M.rooms[r] && M.rooms[r].arts) || []) if (a.mesh && !a.obj) out.push(a); }
    return out;
  },
  // (the walls of a whole floor, and the works that hang on it: made once, the first time something is loose there)
  _floor(y) {
    const key = Math.round(y * 10); let W = this.floors.get(key);
    if (!W) {
      const P = this.k.plan, ids = P.rooms.filter(r => Math.abs(r.y - y) < 0.06).map(r => r.id), set = new Set(ids);
      const g = ids.length ? grid(P, ids, y) : null;
      // (for what a wall hides, a doorway is as wide as it is built: every cell it touches, not only those wholly in it.
      // A jamb taken for open guards a canvas for nothing; a jamb taken for wall would leave one unguarded.)
      const see = g ? g.floor.slice() : null;
      if (g) for (const d of P.doors) {
        if (d.out || d.vent || d.hidden || Math.abs(d.y - y) > 0.06 || !set.has(d.a) || !set.has(d.b)) continue;
        const ax = d.along === 'x', x0 = d.x0 - (ax ? 1 : 0), x1 = d.x1 + (ax ? 1 : 0), z0 = d.z0 - (ax ? 0 : 1), z1 = d.z1 + (ax ? 0 : 1);
        const i0 = Math.max(0, Math.floor((x0 - g.X0) / g.C)), i1 = Math.min(g.nx - 1, Math.ceil((x1 - g.X0) / g.C) - 1), j0 = Math.max(0, Math.floor((z0 - g.Z0) / g.C)), j1 = Math.min(g.nz - 1, Math.ceil((z1 - g.Z0) / g.C) - 1);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) see[j * g.nx + i] = 1;
      }
      W = g ? { X0: g.X0, Z0: g.Z0, C: g.C, nx: g.nx, nz: g.nz, floor: see, arts: this.k.museum.arts.filter(a => set.has(a.room)) } : { arts: [] };
      this.floors.set(key, W);
    }
    return W;
  },
  _watch(key, arts, eye, x, y, z, rad, fy) {
    const W = fy != null && rad > 0 ? this._floor(fy) : null;
    if (W && W.floor) {
      let near = null;
      for (const a of W.arts) {
        if (!a.mesh || a.obj || Math.abs(a.x - x) > FAR || Math.abs(a.z - z) > FAR || !inFront(a, eye, x, y, z, rad + 0.6)) continue;
        if (!near) near = new Set(arts);
        if (near.has(a)) { this._front.push(a); continue; }
        if (walled(W, eye.x, eye.z, a)) continue;
        arts.push(a); near.add(a); this._front.push(a);
      }
    }
    if (arts.length > GUARD_MAX) {
      const front = new Set();
      for (const a of arts) { const f = inFront(a, eye, x, y, z, rad + 0.6); if (f) front.add(a); a._eg = Math.hypot(a.x - x, a.z - z) - (f ? 1000 : 0); }
      arts = fit(arts.slice().sort((p, q) => p._eg - q._eg), front, eye);
    }
    placeRoam(key, arts);
  },
  // (what is laid on the floor and what flows home: the works about the toy and about everything with a body, and the
  // frames the going-home strokes climb to first of all)
  _watchMarks(eye) {
    const G = this.k.G, rooms = G.roomId ? [G.roomId] : [], first = [];
    for (const E of this.out) if (E.body === true) { if (!rooms.includes(E.room)) rooms.push(E.room); if (E.art.mesh && !first.includes(E.art)) first.push(E.art); }
    // (then the nearest few about the toy; then whatever a body could be seen in front of, however far, for its petals
    // and feathers fly about it; then the rest of the rooms about)
    const arts = this._arts(rooms), front = new Set(this._front), by = (p, q) => p._eg - q._eg;
    if (arts.length + first.length + front.size > GUARD_MAX) { for (const a of arts) a._eg = Math.hypot(a.x - eye.x, a.z - eye.z); for (const a of front) a._eg = Math.hypot(a.x - eye.x, a.z - eye.z); arts.sort(by); }
    const list = [...first]; for (const part of [arts.slice(0, 6), [...front].sort(by), arts]) for (const a of part) if (!list.includes(a)) list.push(a);
    placeRoam(this.key, fit(list, front, eye));
  },

  // ---------------------------------------------------------------- every frame --
  update(dt, k) {
    const G = k.G, t0 = performance.now(), on = G.set.escapes !== false;
    if (on !== this.on) { this.on = on; if (!on) for (const E of this.out) this._arrive(E, 'now'); }
    if (this._box && this._box.checked !== on) this._box.checked = on;
    if (!on) { this.marks.begin(dt); this.marks.end(); this.shade.begin(); this.shade.end(); return; }
    const p = G.vehicle.pos, eye = G.camera.position, play = G.state === 'play'; this._front.length = 0;
    // (a sheepdog works by moving: a toy that is parked herds nothing, and nothing loose comes up to it)
    if (this.px != null && Math.hypot(p.x - this.px, p.z - this.pz) > 0.4 * dt) this.still = 0; else this.still = (this.still || 0) + dt; this.px = p.x; this.pz = p.z;
    // How an escape begins: the toy has watched a living work's show for a few seconds, and drives off.
    for (const E of this.list0) {
      if (E.state !== 'home') continue;
      if (E.spec.watch) { if (E.spec.watch(E, dt, k) === true) this.release(E); continue; }
      const L = E.L || (E.L = lifeOf(E.id)); if (!L) continue;
      if (L.state === 'show' && k.looking === E.art) { E.watch += dt; if (E.watch >= TUNE.linger) E.armed = true; }
      else if (E.armed && play) { const d = Math.hypot(p.x - E.art.x, p.z - E.art.z); if (d > TUNE.off && d < 40) { if (this.release(E) !== true) E.armed = false; } else if (d >= 40) E.armed = false; }
      else if (!E.armed && L.state === 'off') E.watch = 0;
    }
    // Which have bodies: the nearest first, as many creatures as may be drawn.
    const out = this.out; let room = CAP_BODY;
    for (const E of out) E.d = Math.abs(p.y - E.y) > 3.2 ? 1e9 : Math.hypot(p.x - E.x, p.z - E.z);
    out.sort((a, b) => a.d - b.d);
    for (const E of out) {
      const want = E.d < (E.body ? TUNE.far : TUNE.near) && room > 0;
      if (want) { E.n = Math.min(E.spec.count || 1, room); room -= E.n; if (!E.body) this._embody(E); }
      else if (E.body === true || E.body === 'pending') { if (E.state === 'going') this._arrive(E, E.going.how, E.going.b); else this._drop(E); }
    }
    this.marks.begin(dt); this.shade.begin();
    const sacred = QUIET.has(G.roomId);
    for (const E of out) {
      if (E.state === 'home') continue;
      E.t += dt; E.outT += dt;
      if (E.spec.may && E.state === 'out' && (E.mayT = (E.mayT || 0) - dt) <= 0) { E.mayT = 0.5; if (E.spec.may(E, k) !== true) { this._arrive(E, 'now'); continue; } }      // (it may not be out: it is home, at once)
      if (E.body !== true) { this._slow(E, dt); continue; }
      E.emerge = Math.min(1, E.emerge + dt / 1.3);
      if (E.state === 'going') this._going(E, dt, k);
      else {
        // In a robot's lamp it answers in its own way; else the toy close by sets it off home; else it wanders.
        const lit = E.by && E.litNow; E.litNow = false;
        if (!lit) { E.lit = Math.max(0, E.lit - dt * 0.5); if (E.lit <= 0) E.by = null; }
        const d = E.d, spot = this._spot(E);
        if (play && !lit && d < TUNE.herd && !sacred && (this.still < 2 || E.led > 0)) { if (!E.led) E.pn = 0; E.led = 3; } else if (E.led > 0 && (d > TUNE.keep || lit)) { E.led = Math.max(0, E.led - dt); if (!E.led) E.pn = 0; }
        if (E.spec.helper) E.spec.helper(E, dt, k, this);
        if (lit && E.spec.react === 'still') E.v = 0;
        else if (lit && E.spec.react === 'off') { if (!(E.pn > 1 && E.pk < E.pn) || (E.goal !== 'off' && (E.offT = (E.offT || 0) - dt) <= 0)) { E.offT = 0.5; this._off(E, E.by); } this._move(E, dt, E.spec.speed * 0.8); }      // (whatever way it was going, it turns from the lamp)
        else if (E.led > 0) {
          if (spot) {
            if (!(E.pn > 1) || E.goal !== 'home') { this._to(E, spot.x, spot.z, Math.min(E.spec.need || 0.42, 0.36)); E.goal = 'home'; }
            // (never at the player: with the toy square in its way it waits for the way to clear)
            if (d < 1.5 && this._facing(E, p, d)) E.v = 0;
            else if (this._move(E, dt, E.spec.herd || E.spec.speed * 1.6) && Math.hypot(E.x - spot.x, E.z - spot.z) < 0.5) this.home(E, 'toy');
          } else { if (!(E.pn > 1 && E.pk < E.pn)) this._off(E, { x: p.x, z: p.z }); this._move(E, dt, E.spec.herd || E.spec.speed * 1.6); }
        } else {
          if (E.goal === 'home') { E.goal = null; E.pn = 0; } else if (E.goal === 'off') E.goal = null;
          if (E.pn > 1 && E.pk < E.pn && d < 2.4 && this._facing(E, p, d)) { E.v = 0; if ((E.balk = (E.balk || 0) + dt) > 2.5) { E.balk = 0; E.pn = 0; E.rest = 0.5; } }      // (the toy is in its way: it does not come up to it)
          else if (E.pn > 1 && E.pk < E.pn) { if (this._move(E, dt, E.spec.speed)) E.rest = E.spec.rest ? E.spec.rest[0] + Math.random() * (E.spec.rest[1] - E.spec.rest[0]) : 4; }
          else { E.v = 0; if ((E.rest -= dt) <= 0) { this._wander(E); if (!(E.pn > 1)) E.rest = 2; } }
        }
        if ((E.roomT = (E.roomT || 0) - dt) <= 0) { E.roomT = 0.25; const gg = this._grid(E); E.clear = gg ? clearAt(gg, E.x, E.z) : 1; const r = roomAt(k.plan, E.x, E.z, E.y + 0.5); if (r && r.id !== E.room && !QUIET.has(r.id)) { E.room = r.id; this.dirty = true; } }
        // what it leaves behind it, and its small sound
        if (E.v > 0.05 && E.spec.trail) { E.trailD += E.v * dt; const tr = E.spec.trail(E); if (tr && E.trailD > (tr.every || 0.3)) { E.trailD = 0; const a = E.yaw + (tr.turn || 0), s = tr.side ? (E.side = -(E.side || 1)) * tr.side : 0;
          this.marks.keep({ x: E.x + Math.cos(E.yaw) * s + (tr.dx || 0), y: E.y + 0.012 + Math.random() * 0.003, z: E.z - Math.sin(E.yaw) * s + (tr.dz || 0), nx: 0, ny: 1, nz: 0, tx: Math.sin(a), ty: 0, tz: Math.cos(a), w: tr.size, h: tr.size * (tr.long || 1.4), color: new THREE.Color(tr.color).multiplyScalar(0.8), cell: tr.cell || 0, life: tr.life || 14 }); } }
        if ((E.voiceT -= dt) <= 0) { E.voiceT = 2.5 + Math.random() * 4; const vol = this._vol(E); if (vol > 0.02 && E.spec.voice && play) E.spec.voice(E, k, vol); }
      }
      // Its body, where it is; and its guard, for this eye.
      const g = E.group; if (!g || E.state === 'home') continue;      // (it has just gone in)
      g.position.set(E.x, E.y, E.z); g.scale.setScalar(0.02 + 0.98 * smooth(E.emerge));
      for (const m of E.mats) m.userData.u.uGone.value = E.gone;
      E.marks = this.marks; E.calm = !!(k.museum.calm || G.set.reduce);
      try { E.spec.pose(E, dt, k); } catch (e) { console.error('escapes: ' + E.spec.name + ': ' + (e && e.stack || e)); this._arrive(E, 'now'); E.body = 'broken'; continue; }
      // what the lamp throws behind it
      const lb = E.lit > 0.02 ? E.by || (E.going && E.going.b) : null;
      if (lb && lb.fy != null && Math.abs(lb.fy - E.y) < 0.5) { const sk = Math.min(1, E.lit * 1.4) * (1 - E.gone) * 0.5, ps = (E.spec.parts && E.spec.parts(E)) || null; if (ps) for (const q of ps) this.shade.put(q.x, q.y, q.z, q.sr || q.r, q.ry || q.r, E.y, lb.x, lb.fy + LAMP_H, lb.z, sk); else { const hh = (E.spec.height || 0.4) * 0.5, rr = Math.min(E.spec.radius || 0.4, hh); this.shade.put(E.x, E.y + hh, E.z, rr, hh, E.y, lb.x, lb.fy + LAMP_H, lb.z, sk); } }
      this._watch(E.key, this._arts(E.room === G.roomId || !G.roomId ? [E.room] : [E.room, G.roomId]), eye, E.x, E.y + (E.spec.height || 0.4) / 2, E.z, E.spec.radius || 0.6, E.y);
    }
    this.marks.end(); this.shade.end();
    this._watchMarks(eye);
    if (this.dirty && (this.saveT = (this.saveT || 0) + dt) > 2) { this.saveT = 0; this.dirty = false; this._save(); }
    this.ms = this.ms * 0.95 + (performance.now() - t0) * 0.05;
  },
  // Away from something (a robot's lamp, the toy with no way home on this floor): a few metres off, unhurried.
  _off(E, from) {
    const g = this._grid(E); if (!g) return;
    const a0 = Math.atan2(E.x - from.x, E.z - from.z);
    for (let n = 0; n < 10; n++) { const a = a0 + (Math.random() - 0.5) * (0.6 + n * 0.3), d = 2.2 + Math.random() * 1.5, x = E.x + Math.sin(a) * d, z = E.z + Math.cos(a) * d; if (clearAt(g, x, z) >= 0.5 && !this._quietNear(x, z, E.y) && this._to(E, x, z)) { E.goal = 'off'; return; } }
  },
  // Out of sight it is only a record: it keeps to its ways on a slow clock, and a robot whose beat it is on sends it home.
  _slow(E, dt) {
    if (E.state === 'going') { this._arrive(E, E.going.how, E.going.b); return; }
    E.slow += dt; if (E.slow < 1) return; const step = E.slow; E.slow = 0;
    if (E.pn > 1 && E.pk < E.pn) { if (this._move(E, step, E.spec.speed)) E.rest = 6 + Math.random() * 14; }
    else if ((E.rest -= step) <= 0) { this._wander(E); if (!(E.pn > 1)) E.rest = 8; }
    const r = roomAt(this.k.plan, E.x, E.z, E.y + 0.5); if (r && r.id !== E.room && !QUIET.has(r.id)) { E.room = r.id; this.dirty = true; }
    const gf = this.gf || (this.gf = features.find(f => f.id === 'guards'));
    if (gf && gf.bots && this.k.G.set.guards !== false && E.outT > 90) for (const b of gf.bots) if (b.far && b.room === E.room && Math.random() < 0.06) { this._arrive(E, 'far', b); return; }
  },
  // Going home: it comes apart (specks of it go, and strokes of its colours take their place), the strokes run over the
  // floor and up under its frame, and it is home. Reduced motion: it fades where it is.
  _going(E, dt, k) {
    const Q = E.going; Q.t += dt; E.v = 0;
    E.gone = Q.calm ? smooth(Q.t / (Q.T - 0.3)) : smooth(Q.t / 1.5);
    const P = Q.pts, n = P.length, wall = E.art, HOLD = 0.22;
    for (const s of Q.strokes) {
      const age = Q.t - s.d; if (age <= 0) continue;
      const u = Math.max(0, age - HOLD) / (Q.flow * s.k); if (u >= 1) continue;
      const dist = (0.45 * u + 0.55 * smooth(u)) * Q.total; let i = 1; while (i < n - 1 && Q.len[i] < dist) i++;
      const f = (dist - Q.len[i - 1]) / Math.max(1e-4, Q.len[i] - Q.len[i - 1]); _v.lerpVectors(P[i - 1], P[i], f);
      _b.subVectors(P[i], P[i - 1]).normalize();      // the way it is going
      const up = !Q.far && dist > Q.wallFrom, size = Math.min(1, age / 0.15) * Math.min(1, (1 - u) / 0.08), wob = Math.sin(u * 14 + s.ph) * 0.03;
      if (up) { _a.set(wall.nx, 0, wall.nz); _c.set(wall.nz, 0, -wall.nx); _v.addScaledVector(_c, s.off * 0.7 + wob).addScaledVector(_a, 0.004 + s.ly); }
      else {
        _a.copy(UP); _c.set(_b.z, 0, -_b.x); const sp = 1 - smooth(u * 3);
        _v.addScaledVector(_c, s.off * (0.4 + 0.6 * smooth(u * 4)) + wob); _v.x += (s.bx - P[0].x) * sp; _v.z += (s.bz - P[0].z) * sp;
        _v.y += s.ly + (Q.happy ? Math.abs(Math.sin(u * 20 + s.ph)) * 0.03 * (1 - u) : 0);
        // (off the thing itself: it lies on it where a stroke of it was, then runs down to the floor)
        const e = (age - HOLD) / s.fall;
        if (e < 1) { const q = e <= 0 ? 0 : e, h = smooth(q); _v.x = s.bx + (_v.x - s.bx) * h; _v.z = s.bz + (_v.z - s.bz) * h; _v.y = s.by + (_v.y - s.by) * q * q; _a.set(s.nx, s.ny, s.nz).lerp(UP, h); if (_a.lengthSq() < 0.03) _a.copy(UP); else _a.normalize(); }
      }
      if (_v.y > wall.y - wall.h / 2 - 0.04 && Math.hypot(_v.x - wall.x, _v.z - wall.z) < wall.w) continue;      // (belt and braces: never as high as the picture)
      // its long way: along the way it is going, turned as that painter turns his hand
      _d.copy(_b).multiplyScalar(Math.cos(s.ang)).addScaledVector(_c, Math.sin(s.ang)); _d.addScaledVector(_a, -_d.dot(_a)); if (_d.lengthSq() < 1e-4) _d.copy(_c).addScaledVector(_a, -_c.dot(_a)); _d.normalize();
      this.marks.put(_v, _a, _d, s.w * size, s.w * s.l * size, s.c, s.cell);
    }
    // (a helper that came out after it may have its own way home to make first: Goya's boy on his ram)
    if (Q.t >= Q.T) { if (E.spec.linger && (Q.over = (Q.over || 0) + dt) < 40 && E.spec.linger(E, dt, k) === true) return; this._arrive(E, Q.how, Q.b); }
  },

  // ---------------------------------------------------------------- the robots (src/guards.js asks, for each of its robots) --
  // True: this robot is tending something and has been driven this time. look(a, rate) turns its lamp; p is the toy.
  guard(b, dt, gf, look, p) {
    if (!this.on || b.lobby) { if (b.tend) this._untend(b, gf, false); return false; }
    let T = b.tend;
    const dToy = Math.hypot(p.x - b.x, p.z - b.z), hunting = b.mode === 'chase' || b.mode === 'charge' || b.mode === 'hold';
    if (!T) {
      if ((b.ec = (b.ec || 0) - dt) > 0) return false; b.ec = 0.2;
      let best = null, bd = 1e9;
      for (const E of this.list0) { if (E.state !== 'out' || (E.by && E.by !== b) || E.emerge < 1) continue; const d = Math.hypot(E.x - b.x, E.z - b.z); if (d < bd && this._lit(b, E)) { best = E; bd = d; } }
      if (!best) return false;
      if ((hunting || b.mode === 'alert' || b.seen) && dToy < bd) return false;      // the toy is the nearer: it comes first
      if (b.far) { if (best.outT > 20) this._arrive(best, 'far', b); return false; }      // (out of sight: no show)
      T = b.tend = { E: best, k: 0, lost: 0, was: b.mode, done: 0 }; best.by = b; b.mode = 'tend'; b.mt = 0; b.sus = 0;
      this.k.synth.note(587.33, 0.5, { type: 'sine', vol: 0.03 * this._vol(best) });      // a soft note: found you
    }
    const E = T.E;
    // The toy, seen and nearer than what it is tending, comes first: it lets the thing be, and is the robot it always was.
    if (b.mode !== 'tend') { if (dToy < Math.hypot(E.x - b.x, E.z - b.z) && E.state !== 'going') { this._untend(b, gf, false); return false; } b.mode = 'tend'; }
    b.v = Math.max(0, b.v - dt * 4);
    const ang = Math.atan2(E.x - b.x, E.z - b.z);
    if (E.state === 'home' || T.done || (E.going && E.going.over)) {
      // It has gone home: the lamp rests where it was a moment, cools, and the robot goes back to its beat.
      T.done += dt; T.k = Math.max(0, T.k - dt * 0.7); look(T.ang, 2);
      if (T.done > 1.6) this._untend(b, gf, true);
      return true;
    }
    T.ang = ang; look(ang, 3.2);
    const lit = this._lit(b, E, 1.25);
    if (E.state === 'going') { T.k = Math.min(1, T.k + dt * 1.6); return true; }
    if (lit) { T.lost = 0; E.litNow = true; E.by = b; E.lit = Math.min(1, E.lit + dt / (E.spec.hold || TUNE.hold)); if (E.lit >= 1 && Math.abs(wrap(ang - b.look)) < 0.25) { this.home(E, 'light', b); if (E.state === 'home') T.done = 0.01; } }
    else if ((T.lost += dt) > 3) { this._untend(b, gf, true); return true; }
    T.k = Math.min(0.35, T.k + dt * 0.2 * (lit ? 1 : 0));      // (the lamp begins to warm as it holds)
    return true;
  },
  _untend(b, gf, back) { const T = b.tend; if (T && T.E.by === b) T.E.by = null; b.tend = null; if (b.mode === 'tend') { if (back && gf._return) gf._return(b); else { b.mode = 'patrol'; b.mt = 0; } } },
  // Is it in this robot's lamp? (Never in a quiet room, nor in front of a quiet work.)
  _lit(b, E, widen = 1) {
    if (Math.abs(E.y - b.fy) > 0.5 || QUIET.has(E.room) || QUIET.has(b.room)) return false;
    const dx = E.x - b.x, dz = E.z - b.z, d = Math.hypot(dx, dz);
    if (d > TUNE.see * widen) return false;
    if (d > 1.2 && Math.abs(wrap(Math.atan2(dx, dz) - b.look)) > TUNE.half * widen) return false;
    if (cellAt(b.g, E.x, E.z) < 0 || this._quietNear(E.x, E.z, E.y)) return false;
    if (E.spec.shield && E.body === true && E.spec.shield(E, b) === true) return false;      // (a helper in the way of the lamp: a person is never lit)
    return sight(b.g, b.x, b.z, E.x, E.z, !E.spec.tall);
  },

  // ---------------------------------------------------------------- kept between visits --
  _save() { try { localStorage.setItem(SAVE, JSON.stringify({ plan: this.k.plan.made, out: this.out.map(E => ({ id: E.id, x: +E.x.toFixed(2), z: +E.z.toFixed(2), y: E.y, room: E.room })), log: this.log.slice(-12) })); } catch { /* no storage: nothing is kept */ } },
  _restore() {
    let sv = null; try { sv = JSON.parse(localStorage.getItem(SAVE) || 'null'); } catch { sv = null; }
    if (!sv || sv.plan !== this.k.plan.made || this.k.G.mode !== 'explore' || this.k.G.set.escapes === false) return;
    this.on = true; this.log = (sv.log || []).slice(-12);
    for (const o of (sv.out || []).slice(0, CAP_OUT)) {
      const E = this.list0.find(q => q.id === o.id), r = this.k.plan.byId[o.room]; if (!E || !r || QUIET.has(o.room)) continue;
      const n = this.log.length; if (this.release(E, { quiet: true }) !== true) continue; this.log.length = n;
      E.x = o.x; E.z = o.z; E.y = r.y; E.room = o.room; E.emerge = 1; E.rest = 2; E.outT = 30;
    }
    this.dirty = false;
  },
  // A new night: everything is home. A new game: and nothing is remembered.
  // A run begun again (a reload, or back from the title): what is out stays out, where it was; what was on its way home is home.
  // Only a new game (fresh) calls everything in.
  reset() { for (const E of this.out) if (E.state === 'going') this._arrive(E, 'now'); },
  fresh() { for (const E of this.out) this._arrive(E, 'now'); this.log.length = 0; try { localStorage.removeItem(SAVE); } catch { /* */ } this.dirty = false; },
  // The switch, beside the robots' own in the settings (the page is not this file's: it is put there, as one of its kind).
  _switch() {
    if (typeof document === 'undefined') return;
    const g = document.querySelector('input[data-set="guards"]'), lab = g && g.closest('label'); if (!lab || document.querySelector('input[data-set="escapes"]')) return;
    const l = lab.cloneNode(true), i = l.querySelector('input'), s = l.querySelector('span');
    i.dataset.set = 'escapes'; i.checked = this.k.G.set.escapes !== false; if (i.id) i.removeAttribute('id');
    if (s) s.innerHTML = '<b>Things out of paintings</b>Something from a painting you have watched may get out and wander. A robot’s lamp, or your toy, sends it home. Off: nothing gets out.';
    lab.after(l); this._box = i;
  },

  // ---------------------------------------------------------------- tests --
  _api() {
    const self = this, by = id => self.list0.find(E => E.id === id || E.spec.tag === id);
    return {
      tune: TUNE, caps: { out: CAP_OUT, bodies: CAP_BODY, marks: MARKS, lowmem: LOWMEM }, quiet: [...QUIET],
      get on() { return self.on; },
      specs: () => self.list0.map(E => ({ id: E.id, tag: E.spec.tag, name: E.spec.name, work: E.art.work.t, room: E.art.room, state: E.state })),
      list: () => self.list().map(q => ({ ...q, x: +q.x.toFixed(2), z: +q.z.toFixed(2) })),
      get: by, log: () => self.log.slice(),
      release: (id, o) => { const E = by(id); return E ? self.release(E, o) : 'no such escapee'; },
      // Put one that is out somewhere (and on that floor): a test's way of setting a scene.
      place(id, x, z, y) { const E = by(id); if (!E || E.state === 'home') return false; const r = roomAt(self.k.plan, x, z, (y == null ? E.y : y) + 0.5); if (!r || QUIET.has(r.id)) return 'not there'; const ox = E.x, oz = E.z; E.x = x; E.z = z; E.y = r.y; E.room = r.id; E.grid = null; E.pn = 0; E.v = 0; E.rest = 1e9; E.emerge = 1; E.led = 0; E.lit = 0; E.by = null; E.roomT = 0;
        const g = self._grid(E), need = (E.spec.need || 0.42) + 0.1; if (g && clearAt(g, x, z) < need) { const c = nearestOpen(g, x, z, need, 4); if (c >= 0) { E.x = g.X0 + ((c % g.nx) + 0.5) * g.C; E.z = g.Z0 + (Math.floor(c / g.nx) + 0.5) * g.C; } }
        if (E.spec.onPlace) E.spec.onPlace(E, E.x - ox, E.z - oz); return r.id; },
      roam(id, rest = 0.5) { const E = by(id); if (E) E.rest = rest; },
      go(id, x, z) { const E = by(id); return E ? self._to(E, x, z) : false; },
      home: (id, how = 'light') => (id === 'all' ? self.out.map(E => self.home(E, 'now')) : by(id) ? self.home(by(id), how) : false),
      bots() { const gf = features.find(f => f.id === 'guards'); return gf && gf.bots ? gf.bots.map(b => ({ i: b.i, room: b.room, x: +b.x.toFixed(2), z: +b.z.toFixed(2), fy: b.fy, mode: b.mode, look: +b.look.toFixed(2), tend: b.tend ? b.tend.E.spec.tag : null, warm: b.tend ? +b.tend.k.toFixed(2) : 0, rooms: b.P ? b.P.rooms : [] })) : []; },
      // Stand robot i at (x, z), its lamp along `look` (radians, 0 = +z), sweeping a little: a test's way of bringing a lamp.
      bot(i, x, z, look, hold = 30) { const gf = features.find(f => f.id === 'guards'), b = gf && gf.bots[i]; if (!b) return false; b.x = x; b.z = z; b.yaw = b.look = look; b.v = 0; b.mode = 'scan'; b.mt = 0; b.dur = hold; b.heard = look; b.sus = 0; b.pn = 0; if (b.tend) self._untend(b, gf, false); return true; },
      // Bring a lamp to one that is out: a robot whose beat reaches it is stood where it has a clear line to it, its lamp
      // turned a little aside, so that its sweep finds it. -> { bot, x, z } or false (no robot's beat reaches there).
      lamp(id, { dist = 5, off = 0.85, bot = null } = {}) {
        const E = by(id), gf = features.find(f => f.id === 'guards'); if (!E || E.state === 'home' || !gf || !gf.bots) return false;
        for (const b of gf.bots) {
          if (b.lobby || (bot != null && b.i !== bot) || Math.abs(b.fy - E.y) > 0.5 || cellAt(b.g, E.x, E.z) < 0) continue;
          for (let n = 0; n < 60; n++) { const a = n * 2.39996, d = dist * (1 - 0.12 * Math.floor(n / 12)), x = E.x + Math.sin(a) * d, z = E.z + Math.cos(a) * d;
            if (cellAt(b.g, x, z) >= 0 && clearAt(b.g, x, z) >= 0.5 && sight(b.g, x, z, E.x, E.z, !E.spec.tall)) { this.bot(b.i, x, z, Math.atan2(E.x - x, E.z - z) + off); return { bot: b.i, x: +x.toFixed(2), z: +z.toFixed(2) }; } }
        }
        return false;
      },
      cost: () => ({ ms: +self.ms.toFixed(3), out: self.out.length, bodies: self.out.filter(E => E.body === true).length, marks: self.marks.mesh.count, calls: self.out.reduce((n, E) => n + (E.group ? count(E.group) : 0), 0) + (self.marks.mesh.visible ? 1 : 0), tris: self.out.reduce((n, E) => n + (E.group ? tris(E.group) : 0), 0) }),
      check: (id, views, W) => self._check(by(id), views, W),
    };
  },
  // The proof that nothing of it is drawn over a canvas. The building as it stands is drawn into the depth (so a wall
  // hides what a wall hides; glass does not), then every canvas within 60 m, on this floor and the next, as a mask in a
  // colour of its own; then the escapee and the marks alone, guard on and guard off, and the pixels on a canvas counted.
  _check(E, views, W = 480) {
    if (!E || E.body !== true) return { error: 'no body' };
    const k = this.k, G = k.G, r = G.renderer, H = Math.round(W * 9 / 16), rows = [];
    const arts = k.museum.arts.filter(a => a.mesh && !a.obj && Math.abs((a.fy != null ? a.fy : a.y) - E.y) < 8 && Math.hypot(a.x - E.x, a.z - E.z) < 60);
    const quads = new THREE.Scene(), white = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });
    // (each canvas in a colour of its own, so a pixel on one can be laid at that work's door)
    const tints = arts.map((a, i) => new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(((i + 1) & 255) / 255, ((i + 1) >> 8) / 255, 1, THREE.LinearSRGBColorSpace), side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    arts.forEach((a, i) => { a.mesh.updateMatrixWorld(); const m = new THREE.Mesh(a.mesh.geometry, tints[i]); m.matrixAutoUpdate = false; m.matrix.copy(a.mesh.matrixWorld); quads.add(m); });
    const over = new Map();
    quads.updateMatrixWorld(true);
    const near = arts.slice().sort((p, q) => Math.hypot(p.x - E.x, p.z - E.z) - Math.hypot(q.x - E.x, q.z - E.z)), h = E.y + (E.spec.height || 0.4) * 0.5;
    const V = views || {
      chase: { at: G.camera.position.toArray(), quat: G.camera.quaternion.toArray(), fov: G.camera.fov },
      low: { at: [E.x + 1.6, E.y + 0.16, E.z + 1.1], look: [E.x, h, E.z] },
      high: { at: [E.x - 2.4, E.y + 2.3, E.z - 2.0], look: [E.x, h, E.z] },
      // and the worst there is: from behind it, straight at each of the nearest canvases
      ...Object.fromEntries(near.slice(0, 2).map((a, i) => { const dx = E.x - a.x, dz = E.z - a.z, d = Math.hypot(dx, dz) || 1, back = 1.3; const ey = h + (h - a.y) * back / d; return ['across' + (i + 1), { at: [E.x + dx / d * back, Math.max(E.y + 0.05, ey), E.z + dz / d * back], look: [a.x, a.y, a.z], fov: 40 }]; })),
    };
    const rt = new THREE.WebGLRenderTarget(W, H), mask = new Uint8Array(W * H * 4), buf = new Uint8Array(W * H * 4);
    const prevRT = r.getRenderTarget(), cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha(), auto = r.autoClear;
    const keys = [E.key, this.key], objs = [E.group, this.marks.mesh, this.shade.mesh]; let scene = k.group; while (scene.parent) scene = scene.parent;
    // (what is not solid to the eye is left out of the depth: glass, water, light)
    const hid = [], walk = o => { if (!o.visible) return; const m = o.material; if (o === k.group || o.isSprite || o.isPoints || o.isLine || (m && [].concat(m).some(q => q.transparent || q.opacity < 1 || q.depthWrite === false))) { o.visible = false; hid.push(o); return; } for (const c of o.children) walk(c); }; walk(scene);
    const world = () => { const was = scene.overrideMaterial, bg = scene.background; scene.overrideMaterial = white; scene.background = null; r.autoClear = true; r.render(scene, cam0); scene.overrideMaterial = was; scene.background = bg; r.autoClear = false; };
    let cam0 = null;
    for (const [name, v] of Object.entries(V)) {
      const cam = new THREE.PerspectiveCamera(v.fov || 55, W / H, 0.03, 200); cam.position.fromArray(v.at);
      if (v.quat) cam.quaternion.fromArray(v.quat); else cam.lookAt(_v.fromArray(v.look)); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      this._cam = cam0 = cam;
      const arts2 = this._arts(E.room === G.roomId || !G.roomId ? [E.room] : [E.room, G.roomId]);
      this._front.length = 0; this._watch(E.key, arts2, cam.position, E.x, h, E.z, E.spec.radius || 0.6, E.y); this._watchMarks(cam.position);
      r.setRenderTarget(rt); r.setClearColor(0x000000, 0); world(); r.render(quads, cam); r.readRenderTargetPixels(rt, 0, 0, W, H, mask);
      const shot = off => {
        for (const key of keys) guardBlock(key).uLifeOff.value = off ? 1 : 0;
        world(); for (const o of objs) if (o.visible) r.render(o, cam);
        r.readRenderTargetPixels(rt, 0, 0, W, H, buf);
        let on = 0, all = 0; for (let i = 0; i < W * H; i++) { if (buf[i * 4 + 3] < 8) continue; all++; if (mask[i * 4 + 3] > 8) { on++; if (!off) { const w = mask[i * 4] + mask[i * 4 + 1] * 256 - 1; let o = over.get(w); if (!o) { const a = arts[w], Wf = this._floor(E.y); over.set(w, o = { n: 0, cam: name, seen: a ? inFront(a, cam.position, E.x, h, E.z, (E.spec.radius || 0.6) + 0.6) : null, wall: a && Wf.floor ? walled(Wf, cam.position.x, cam.position.z, a) : null, held: a ? guardBlock(E.key).arts.includes(a) : null, marks: a ? guardBlock(this.key).arts.includes(a) : null }); } o.n++; } } }
        return { on, all };
      };
      const g = shot(false), u = shot(true), row = { cam: name, drawn: g.on, wouldBe: u.on, visible: g.all };
      if (g.on) { const m = this.marks.mesh, was = m.visible, n0 = new Map([...over].map(([w, o]) => [w, o.n])); m.visible = false; row.body = shot(false).on; m.visible = was; for (const [w, o] of over) o.n = n0.get(w) || 0; }      // (whose pixels: the thing's own, or what it leaves about it)
      rows.push(row);
    }
    for (const key of keys) guardBlock(key).uLifeOff.value = 0;
    for (const o of hid) o.visible = true;
    this._cam = null; r.setRenderTarget(prevRT); r.setClearColor(cc, ca); r.autoClear = auto; rt.dispose(); white.dispose(); for (const m of tints) m.dispose();
    const kept = new Set(guardBlock(E.key).arts);
    return { over: [...over].map(([i, o]) => ({ work: arts[i] ? arts[i].work.id : i, room: arts[i] && arts[i].room, guarded: kept.has(arts[i]), px: o.n, cam: o.cam, seen: o.seen, wall: o.wall, held: o.held, marks: o.marks, far: arts[i] ? +Math.hypot(arts[i].x - E.x, arts[i].z - E.z).toFixed(1) : 0 })), id: E.id, tag: E.spec.tag, canvases: arts.length, guarded: guardBlock(E.key).arts.length, pass: rows.every(q => q.drawn === 0), drawn: rows.reduce((n, q) => n + q.drawn, 0), wouldBe: rows.reduce((n, q) => n + q.wouldBe, 0), visible: rows.reduce((n, q) => n + q.visible, 0), rows };
  },
};
feature(F);

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const LAMP_H = 1.08;      // a robot's lamp above its floor (src/guardplan.js's BOT.emitter)
// The colours a body is painted in, for the strokes it comes apart into: read off its own vertices (the dabs laid on
// it first, if it has them; a helper's are not its own). Linear, as they are drawn.
function hues(group, max = 160) {
  const dab = [], all = [], own = atlas();
  group.traverse(o => {
    const g = o.geometry, m = o.material; if (!o.isMesh || !g || !g.attributes.color || !m || Array.isArray(m) || !m.vertexColors || m.userData.helper) return;
    const c = g.attributes.color, uv = g.attributes.uv, n = c.count, step = Math.max(3, Math.floor(n / 1200) * 3);
    for (let i = 0; i < n; i += step) {
      const r = c.getX(i), gg = c.getY(i), b = c.getZ(i); if (r + gg + b < 0.012) continue;
      const q = new THREE.Color(r, gg, b); all.push(q); if (m.map === own && uv && Math.floor(uv.getX(i) * CELLS) !== CELL.solid) dab.push(q);
    }
  });
  const from = dab.length >= 12 ? dab : all, out = []; if (!from.length) return out;
  for (let i = 0; i < max; i++) out.push(from[Math.floor((i + 0.5) / max * from.length)]);
  return out;
}
function dispose(g) { g.traverse(o => { if (o.geometry) o.geometry.dispose(); for (const m of [].concat(o.material || [])) { for (const key in m) { const x = m[key]; if (x && x.isTexture && x.userData && x.userData.own) x.dispose(); } m.dispose(); } if (o.isBatchedMesh && o.dispose) o.dispose(); }); }
function count(g) { let n = 0; g.traverse(o => { if (o.isMesh && o.visible) n++; }); return n; }
function tris(g) { let n = 0; g.traverse(o => { if (o.isMesh && o.geometry && o.geometry.attributes.position) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); }); return Math.round(n); }
// Does a wall stand between this eye and a work's canvas (its middle and both its ends)? Only walls count: a case is
// glass, and a canvas guarded for nothing costs nothing. Off the map is not a wall.
const FAR = 100;      // (Griffin Court is a hundred metres of pictures)
function walled(W, ex, ez, a) {
  const m = Math.min(12, Math.max(2, Math.ceil(a.w / 0.35)));      // (a ray to every foot or so of it: a doorway may show only a strip)
  for (let q = 0; q <= m; q++) {
    const u = q / m - 0.5, bx = a.x - a.nz * a.w * u, bz = a.z + a.nx * a.w * u;      // (to the canvas itself, and the walk stops short of the wall it hangs on)
    const L = Math.hypot(bx - ex, bz - ez), n = Math.max(2, Math.ceil(L / (W.C * 0.5))), end = Math.floor(n * (1 - 0.5 / Math.max(L, 0.6))); let inside = false, hit = false, gone = 0;
    for (let s = 0; s <= end; s++) {
      const t = s / n, i = Math.floor((ex + (bx - ex) * t - W.X0) / W.C), j = Math.floor((ez + (bz - ez) * t - W.Z0) / W.C);
      if (i < 0 || j < 0 || i >= W.nx || j >= W.nz) continue;
      if (W.floor[j * W.nx + i]) { inside = true; gone = 0; } else if (inside && ++gone > 1) { hit = true; break; }      // (a camera hard against a wall starts in the wall's own cells; one cell clipped at a door jamb is not a wall)
    }
    if (!hit) return false;
  }
  return true;
}
// More canvases than a guard holds (the eye down among a flock in a great room, or low in a long hall of pictures).
// The first of them keep their own shapes. The rest that the thing could be seen in front of are guarded a slice of
// the view at a time: one shape, square to the eye and as far off as the farthest of them, that covers every picture
// in that slice. So against far walls the thing may be cut a little wider than the pictures there, and it is never
// drawn across one. (The shapes are grown by what the eye may move in a frame.)
const SLICES = 12;
function fit(arts, front, eye) {
  if (arts.length <= GUARD_MAX) return arts;
  const keep = arts.slice(0, GUARD_MAX - SLICES), rest = [];
  for (let i = GUARD_MAX - SLICES; i < arts.length; i++) if (front.has(arts[i])) rest.push(arts[i]);
  if (rest.length <= SLICES) { for (const a of rest) keep.push(a); for (let i = GUARD_MAX - SLICES; i < arts.length && keep.length < GUARD_MAX; i++) if (!front.has(arts[i])) keep.push(arts[i]); return keep; }
  const bins = new Map(), step = TAU / SLICES;
  for (const a of rest) {
    const b = Math.floor((Math.atan2(a.z - eye.z, a.x - eye.x) + Math.PI) / step) % SLICES, phi = -Math.PI + (b + 0.5) * step, dx = Math.cos(phi), dz = Math.sin(phi);
    let w = bins.get(b); if (!w) bins.set(b, w = { dx, dz, t0: 1e9, t1: -1e9, v0: 1e9, v1: -1e9, D: 0, d: 1e9, n: 0 });
    for (const e of [-0.5, 0.5]) {
      const cx = a.x - a.nz * a.w * e - eye.x, cz = a.z + a.nx * a.w * e - eye.z, dep = Math.max(cx * dx + cz * dz, 0.5), t = (cz * dx - cx * dz) / dep;
      w.t0 = Math.min(w.t0, t); w.t1 = Math.max(w.t1, t); w.v0 = Math.min(w.v0, (a.y - a.h / 2 - eye.y) / dep); w.v1 = Math.max(w.v1, (a.y + a.h / 2 - eye.y) / dep); w.D = Math.max(w.D, dep); w.d = Math.min(w.d, dep);
    }
    w.n++;
  }
  for (const w of bins.values()) {
    const D = w.D + 0.3, m = 0.05 + 0.12 * D / w.d, u0 = w.t0 * D - m, u1 = w.t1 * D + m, y0 = eye.y + w.v0 * D - m, y1 = eye.y + w.v1 * D + m, u = (u0 + u1) / 2;
    keep.push({ x: eye.x + w.dx * D - w.dz * u, z: eye.z + w.dz * D + w.dx * u, y: (y0 + y1) / 2, w: u1 - u0, h: y1 - y0, rot: Math.atan2(-w.dx, -w.dz), nx: -w.dx, nz: -w.dz, slice: w.n });
  }
  return keep;
}
// Could a ball of radius r at (x, y, z) be seen in front of this work's canvas from the eye? (By the angle between them,
// the canvas taken as a ball too: generous, and sound when the thing is beside the eye or the eye is inside it.)
function inFront(a, E, x, y, z, r) {
  if ((E.x - a.x) * a.nx + (E.z - a.z) * a.nz <= 0) return false;      // (seen from behind)
  const bx = x - E.x, by = y - E.y, bz = z - E.z, dB = Math.hypot(bx, by, bz), ax = a.x - E.x, ay = a.y - E.y, az = a.z - E.z, dA = Math.hypot(ax, ay, az), rho = Math.hypot(a.w, a.h) / 2 + 0.05;
  if (dA + rho < dB - r) return false;                                 // (the canvas is nearer than the thing)
  if (dB <= r || dA <= rho) return true;
  const c = (bx * ax + by * ay + bz * az) / (dB * dA);
  return Math.acos(c < -1 ? -1 : c > 1 ? 1 : c) < Math.asin(r / dB) + Math.asin(rho / dA);
}
