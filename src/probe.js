// The probe: a little saucer that comes up out of the lobby grate, and the keeper's log it leads you to (docs/FINALE.md,
// "The hooks"). One of three saucers in the game: this one is a toy-sized scout, nobody aboard; the Sub-level 9 toy
// (garage.js buildSaucer) is a model of the craft someone made; the craft itself waits in the hangar (craft.js, finale.js).
//
// How it goes:
//   * Not at once. Once the grate's page is in the file, and you have looked at three more works (or spent three minutes
//     indoors since), and been in the building over a minute in all, the grate hums louder and a faint "?" sits on it.
//   * Come back near the lobby and it rises out of the grate in a column of green light, flies to you through the doorways,
//     past you, turns, and hangs in front of you a moment, curious, its rim chiming the call (src/motif.js).
//   * Then you herd it out. It keeps a few metres ahead of you along its way out (doorways, then the vent: the floor grid of
//     guardplan.js, never through a wall), facing you. Drive at it and it eases away; rush it and it goes faster; stop and
//     it stops, bobbing and chiming softly. It never runs off by itself. Wander off and it waits, or drifts back to where
//     you can see it.
//   * Out through the vent and onto the terrace, it takes off on its own: up over the front, across the roofs, low over
//     Butler Field and the ballpark and out over the frozen harbour to the light. The camera watches it go, then it is yours
//     again. It waits by the light, chiming, with the "?" on it, while you find your way across the floes.
//   * Get there and it circles the lantern once, the light flickers green, and it streaks straight up and is gone.
//   * At the foot of the light, the keeper's hut (drawn by harbour.js, solid in harbourplan.js), and on its step the log:
//     READ it. Clarice's last entries, and the new keeper's note pinned to the door. A page of the file ('lighthouse'),
//     and the "?" moves on to the rings over the silo ("under the ballfield").
//
// Saved in 'after-hours.probe': once it has risen it counts as flown (quit in the middle and it is waiting at the light
// next time); 'gone' once it has left. Nothing is done per frame before it is due (a check twice a second), nor once it has
// gone, nor while it waits at the light and you are far away.
//
// For other modules: G.probe.where() is where the file's "?" should point while there is something here to follow (the
// grate, the probe, the log), or null. src/story.js asks it first.

import * as THREE from 'three';
import { feature, features } from './features.js';
import { groundAt, confine } from './plan.js';
import { grid, path } from './guardplan.js';
import { story } from './story.js';
import { MOTIF, MOTIF_COLOURS, motifVoice } from './motif.js';
import * as TX from './textures.js';

const KEY = 'after-hours.probe';
const GREEN = new THREE.Color(0.32, 1, 0.42);
const LEAD = 2.8;          // how far ahead of you it keeps, along its way out (metres)
const NEAREST = 1.5;       // and never nearer than this
const FLY = 0.55;          // its height over the floor indoors
const R = 0.15;            // its radius

let st = load();
function load() { let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { s = null; } return { stage: 'wait', ...(s || {}) }; }
function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* a private window: it lasts the visit */ } }

// ---------------------------------------------------------------- the probe itself
// A small saucer of the same family as the garage's: a pale metal hull, a glass dome with one glowing lens in it that
// turns to look at you (nobody aboard), a ring of lamps in the call's five colours that chase round, a soft glow beneath.
function buildProbe() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body); g.name = 'probe';
  const metal = new THREE.MeshStandardMaterial({ color: 0xc4ccd2, metalness: 0.8, roughness: 0.25, emissive: 0x3a464e, emissiveIntensity: 0.7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x23282e, metalness: 0.6, roughness: 0.5, emissive: 0x0a0d10, emissiveIntensity: 0.5 });
  const hull = new THREE.Mesh(new THREE.SphereGeometry(R, 20, 10), metal); hull.scale.set(1, 0.22, 1); body.add(hull);
  body.add(new THREE.Mesh(new THREE.CylinderGeometry(R + 0.003, R + 0.003, 0.01, 24), dark));
  const under = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.095, 0.024, 18), metal); under.position.y = -0.026; body.add(under);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.058, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xa8f0d0, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.42, emissive: 0x2fae7a, emissiveIntensity: 0.6, depthWrite: false }));
  dome.position.y = 0.022; dome.renderOrder = 3; body.add(dome);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 2.2, 1.2) })); eye.position.set(0, 0.04, 0.024); body.add(eye);
  // the ring of lamps, one mesh with the five colours in its vertices; its material's colour is how bright they are
  const lampGeo = [], ball = new THREE.SphereGeometry(0.013, 8, 6);
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2, b = ball.clone().translate(Math.sin(a) * (R - 0.012), -0.004, Math.cos(a) * (R - 0.012)), c = new THREE.Color(MOTIF_COLOURS[i % 5]), n = b.attributes.position.count, col = new Float32Array(n * 3);
    for (let j = 0; j < n; j++) col.set([c.r, c.g, c.b], j * 3);
    b.setAttribute('color', new THREE.BufferAttribute(col, 3)); lampGeo.push(b);
  }
  const merged = mergeAll(lampGeo), lampM = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(1.6, 1.6, 1.6) });
  const ring = new THREE.Mesh(merged, lampM); body.add(ring);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.radial(0, 1.2), color: GREEN.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  halo.scale.setScalar(0.7); g.add(halo);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 1.6, 0.8) })); glow.position.y = -0.039; body.add(glow);
  return { group: g, body, ring, lampM, halo, eye };
}
function mergeAll(list) {
  let n = 0; for (const g of list) n += g.index ? g.index.count : g.attributes.position.count;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
  for (const g0 of list) { const g = g0.index ? g0.toNonIndexed() : g0, p = g.attributes.position.array, c = g.attributes.color.array; pos.set(p, o * 3); col.set(c, o * 3); o += p.length / 3; }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('color', new THREE.BufferAttribute(col, 3)); return out;
}

// ---------------------------------------------------------------- the log and the note
const LOG = [
  ['Nov 28', 'Museum dark by six. Lights on again at two.'],
  ['Dec 2', 'Two “people” at the side door. A crate.'],
  ['Dec 5', 'More crates. Going down, not out.'],
  ['Dec 9', 'Green light under Butler Field. The snow glows.'],
  ['Dec 12', 'Five notes off the water. I hummed them back.'],
  ['Dec 13', 'They answered.'],
  ['Dec 14', 'Something small came to my window. It wants me to follow. I’m going to'],
];
const NOTE = ['We don’t know what happened to Clarice.', 'She kept saying the music came from under the ballfield.', 'Please leave her log where it is.'];
const HAND = '"Bradley Hand", "Segoe Print", "Marker Felt", "Comic Sans MS", cursive';
// Lines of `text` no wider than `w` in the canvas's current font.
function wrap(g, text, w) {
  const out = []; let line = '';
  for (const word of text.split(' ')) { const t = line ? line + ' ' + word : word; if (line && g.measureText(t).width > w) { out.push(line); line = word; } else line = t; }
  if (line) out.push(line); return out;
}
function logCard() {
  const W = 560, H = 760, X = 128, RW = W - X - 34, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = '#e8dfc6'; g.fillRect(12, 12, W - 24, H - 24);
  g.fillStyle = 'rgba(110,86,50,.08)'; for (let i = 0; i < 60; i++) g.fillRect(12 + (i * 89) % (W - 30), 12 + (i * 67) % (H - 30), 2 + (i * 11) % 36, 1);
  g.fillStyle = 'rgba(80,110,150,.85)'; g.font = '600 20px Georgia, serif'; g.fillText('HARBOUR LIGHT  ·  KEEPER’S LOG', 40, 56);
  g.strokeStyle = 'rgba(160,60,60,.45)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X - 10, 74); g.lineTo(X - 10, H - 30); g.stroke();
  g.strokeStyle = 'rgba(60,90,140,.2)'; for (let y = 104; y < H - 30; y += 42) { g.beginPath(); g.moveTo(30, y); g.lineTo(W - 30, y); g.stroke(); }
  g.fillStyle = 'rgba(40,60,90,.14)'; g.beginPath(); g.ellipse(W - 110, 170, 48, 32, 0.3, 0, 7); g.fill();        // a ring from a mug of something hot
  let y = 96; g.fillStyle = '#23305a';
  for (const [d, text] of LOG) {
    g.font = `21px ${HAND}`; g.fillText(d, 34, y);
    g.font = `24px ${HAND}`; for (const l of wrap(g, text, RW)) { g.fillText(l, X, y); y += 42; }
  }
  g.font = `italic 34px ${HAND}`; g.fillText('— C.', X + 150, y + 22);
  return cv;
}
function noteCard() {
  const W = 400, H = 360, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = '#f6f1c9'; g.fillRect(10, 10, W - 20, H - 20);
  g.fillStyle = '#b8342c'; g.beginPath(); g.arc(W / 2, 30, 9, 0, 7); g.fill();          // the drawing pin
  g.font = '600 23px "Courier New", ui-monospace, monospace'; g.fillStyle = '#1b1f2a';
  let y = 80; for (const para of NOTE) { for (const l of wrap(g, para, W - 64)) { g.fillText(l, 32, y); y += 32; } y += 18; }
  return cv;
}

feature({
  id: 'probe',

  init(k) {
    this.k = k; this.t = 0; this.checkT = 0; this.inT = 0; this.sinceGrate = 0; this.seenAt = null; this.phase = 'idle';
    const P = k.plan, L = this.L = P.byId[P.front && P.front.a] || P.byId.lobby, vent = this.vent = P.vent;
    const H = this.hut = P.lakefront && P.lakefront.hut, light = this.light = P.lakefront && P.lakefront.light;
    if (!L || !vent || !H || !light) { this.off = true; return; }
    this.grate = { x: Math.min(L.x1 - 1, vent.x1 + 4), y: L.y, z: (vent.z0 + vent.z1) / 2 };      // where story.js lays the grate
    this.wait = { x: light.x - 1.2, y: 4.3, z: light.z + 6.5 };                                   // where it waits by the light
    const me = this;
    k.G.probe = { where: () => me.where(), get stage() { return st.stage; }, get phase() { return me.phase; } };
    const M = this.m = buildProbe(); M.group.visible = false; k.group.add(M.group);
    // the trail it leaves, so it is easy to follow: specks in the call's colours, fading
    const N = this.trailN = 40, tp = this.trailP = new Float32Array(N * 3).fill(-9999), tc = this.trailC = new Float32Array(N * 3);
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3).setUsage(THREE.DynamicDrawUsage)); tg.setAttribute('color', new THREE.BufferAttribute(tc, 3).setUsage(THREE.DynamicDrawUsage));
    this.trail = new THREE.Points(tg, new THREE.PointsMaterial({ size: 0.09, map: TX.radial(0, 1.2), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false }));
    this.trail.frustumCulled = false; this.trail.visible = false; k.group.add(this.trail);
    this.trailCols = MOTIF_COLOURS.map(c => new THREE.Color(c)); this.lastDrop = new THREE.Vector3(-9999, 0, 0);
    // a pool of its light on the floor under it, indoors
    this.pool = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1.2), color: GREEN.clone().multiplyScalar(0.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    this.pool.renderOrder = 3; this.pool.visible = false; k.group.add(this.pool);
    // the column of green light it rises in
    const colTex = (() => { const cv = document.createElement('canvas'); cv.width = 4; cv.height = 64; const c = cv.getContext('2d'), gr = c.createLinearGradient(0, 64, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 4, 64); return new THREE.CanvasTexture(cv); })();
    this.column = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.46, 3, 20, 1, true).translate(0, 1.5, 0), new THREE.MeshBasicMaterial({ map: colTex, color: GREEN.clone().multiplyScalar(0.0), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    this.column.position.set(this.grate.x, L.y + 0.01, this.grate.z); this.column.visible = false; k.group.add(this.column);
    this.pos = new THREE.Vector3(); this.v3 = new THREE.Vector3(); this.v4 = new THREE.Vector3();
    // the card on screen when the log is read
    const el = this.cardEl = document.createElement('div'); el.id = 'keeperCard'; el.setAttribute('role', 'img');
    el.setAttribute('aria-label', 'The keeper’s log. ' + LOG.map(([d, t]) => d + ': ' + t).join(' ') + ' Signed C. A note pinned beside it: ' + NOTE.join(' '));
    el.style.cssText = 'position:fixed;left:50%;top:46%;transform:translate(-50%,-50%);width:min(92vw,620px);pointer-events:none;opacity:0;transition:opacity .25s;z-index:30;filter:drop-shadow(0 10px 24px rgba(0,0,0,.55))';
    document.body.appendChild(el);
    if (st.stage === 'flown') this._toLake();
  },

  // ---------------------------------------------------------------- where the "?" goes
  where() {
    if (this.off) return null;
    const ph = this.phase;
    if (ph === 'armed') return { x: this.grate.x, y: this.grate.y, z: this.grate.z };
    if (['rise', 'come', 'pass', 'look', 'herd'].includes(ph)) return { x: this.pos.x, y: this.L.y, z: this.pos.z };
    if (ph === 'takeoff' || ph === 'fly' || ph === 'lake' || ph === 'finale') return { x: this.wait.x, y: 0, z: this.wait.z };
    if (st.stage === 'gone' && !story.has('lighthouse')) return { x: this.hut.log.x, y: 0, z: this.hut.log.z };
    return null;
  },

  // ---------------------------------------------------------------- sounds
  _note(i, o = {}) {
    const S = this.k.sound, c = S && S.ctx; if (!c || c.state !== 'running' || !S.master) return;
    motifVoice(c, S.master, MOTIF[i].midi + (o.transpose == null ? 12 : o.transpose), c.currentTime + (o.at || 0), o.dur || 0.35, o.gain || 0.02);
    const ms = (o.at || 0) * 1000; setTimeout(() => { this.flashI = i; this.flash = 1; }, ms);
  },
  _call(beat = 0.28, gain = 0.03, transpose = 12) { let t = 0; MOTIF.forEach((n, i) => { this._note(i, { at: t, dur: n.beats * beat, gain, transpose }); t += n.beats * beat; }); return t; },
  _whoosh(up = true, vol = 0.035) {
    const S = this.k.sound, c = S && S.ctx; if (!c || c.state !== 'running' || !S.master) return;
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(up ? 320 : 1400, t); o.frequency.exponentialRampToValueAtTime(up ? 1800 : 260, t + 0.9);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
    o.connect(g); g.connect(S.master); o.start(t); o.stop(t + 1.05);
    this.k.synth.noise(0.7, { vol: vol * 0.6, lp: 2600 });
  },

  // ---------------------------------------------------------------- the probe, drawn where it is
  _show(dt, k, face, opts = {}) {
    const M = this.m, g = M.group, t = this.t;
    g.visible = true; g.position.copy(this.pos);
    if (face) { const want = Math.atan2(face.x - this.pos.x, face.z - this.pos.z); let d = want - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); g.rotation.y += d * Math.min(1, dt * 6); }
    M.body.rotation.x = Math.sin(t * 2.3) * 0.08 + (opts.tilt || 0); M.body.rotation.z = Math.cos(t * 1.9) * 0.08;
    M.ring.rotation.y = t * 1.6;
    this.flash = Math.max(0, (this.flash || 0) - dt * 2.2);
    const f = this.flash, base = 1.3 + 0.3 * Math.sin(t * 6);
    M.lampM.color.setScalar(base + f * 1.6);
    const hc = f > 0.02 ? this.trailCols[this.flashI || 0] : GREEN;
    M.halo.material.color.copy(GREEN).lerp(hc, f).multiplyScalar(0.55 + f * 0.6);
    M.halo.scale.setScalar(opts.halo || 0.7);
    // the trail
    if (opts.trail !== false) {
      const T = this.trailP, C = this.trailC, N = this.trailN;
      if (this.lastDrop.distanceToSquared(this.pos) > (opts.step || 0.05) ** 2) {
        T.copyWithin(3, 0, (N - 1) * 3); T[0] = this.pos.x; T[1] = this.pos.y - 0.02; T[2] = this.pos.z; this.lastDrop.copy(this.pos);
        this.trailI = ((this.trailI || 0) + 1) % 5;
        C.copyWithin(3, 0, (N - 1) * 3); const c = this.trailCols[this.trailI]; C[0] = c.r; C[1] = c.g; C[2] = c.b;
      }
      const k0 = Math.max(0, 1 - dt * (opts.fade || 1.6)); for (let i = 1; i < N; i++) { C[i * 3] *= k0; C[i * 3 + 1] *= k0; C[i * 3 + 2] *= k0; }
      this.trail.geometry.attributes.position.needsUpdate = true; this.trail.geometry.attributes.color.needsUpdate = true;
      this.trail.material.size = opts.size || 0.09; this.trail.visible = true;
    }
    if (opts.floor != null) { this.pool.visible = true; this.pool.position.set(this.pos.x, opts.floor + 0.014, this.pos.z); const h = Math.max(0.2, this.pos.y - opts.floor); this.pool.material.color.copy(GREEN).multiplyScalar(0.55 / (0.6 + h)); }
    else this.pool.visible = false;
  },
  _hide() { this.m.group.visible = false; this.trail.visible = false; this.pool.visible = false; this.column.visible = false; this.trailP.fill(-9999); this.lastDrop.set(-9999, 0, 0); },

  // ---------------------------------------------------------------- the way out: a line of points from you to the terrace
  _rooms(k) {
    const P = k.plan, L = this.L, ids = [L.id];
    for (const d of P.doors) {
      if (d.out || d.vent || d.hidden || d.h < 1.3 || Math.abs(d.y - L.y) > 0.06) continue;
      const o = d.a === L.id ? d.b : d.b === L.id ? d.a : null, r = o && P.byId[o];
      if (r && !r.secret && Math.abs(r.y - L.y) < 0.06 && !ids.includes(o)) ids.push(o);
    }
    return ids;
  },
  _near(k) {        // in the lobby or a room off it, on its floor, and not far from the grate
    const p = k.pos, r = k.room;
    return !!r && (this.ids || (this.ids = this._rooms(k))).includes(r.id) && Math.abs(p.y - this.L.y) < 1.2 && Math.hypot(p.x - this.grate.x, p.z - this.grate.z) < 34;
  },
  _grid(k) { return this.g || (this.g = grid(k.plan, this.ids || (this.ids = this._rooms(k)), this.L.y)); },
  _way(k, ax, az, bx, bz) {
    const out = this._buf || (this._buf = new Float32Array(256)), n = path(this._grid(k), ax, az, bx, bz, out, 0.3);
    const pts = []; for (let i = 0; i < n; i++) pts.push({ x: out[i * 2], z: out[i * 2 + 1] });
    return pts.length >= 2 ? pts : [{ x: ax, z: az }, { x: bx, z: bz }];
  },
  _buildRoute(k) {
    const p = k.pos, L = this.L, V = this.vent, vz = (V.z0 + V.z1) / 2, y = L.y;
    const pts = this._way(k, p.x, p.z, V.x1 + 0.8, vz).map(q => ({ x: q.x, y: y + FLY, z: q.z }));
    pts.push({ x: V.x1 + 0.15, y: y + 0.36, z: vz }, { x: V.x0 + 0.05, y: y + 0.36, z: vz });
    const ox = V.x0 - 2.6, gy = groundAt(k.plan, ox, vz, y + 0.5); pts.push({ x: ox, y: gy + 0.55, z: vz });
    const S = [0]; for (let i = 1; i < pts.length; i++) S.push(S[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
    this.route = { pts, S, len: S[S.length - 1] };
  },
  _at(s, out) {
    const { pts, S } = this.route; s = Math.max(0, Math.min(this.route.len, s));
    let i = 1; while (i < S.length - 1 && S[i] < s) i++;
    const a = pts[i - 1], b = pts[i], f = S[i] > S[i - 1] ? (s - S[i - 1]) / (S[i] - S[i - 1]) : 1;
    return out.set(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, a.z + (b.z - a.z) * f);
  },
  _project(x, z) {
    const { pts, S } = this.route; let best = Infinity, bs = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz || 1e-9;
      const f = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2)), px = a.x + dx * f, pz = a.z + dz * f, d = (x - px) ** 2 + (z - pz) ** 2;
      if (d < best) { best = d; bs = S[i - 1] + Math.sqrt(l2) * f; }
    }
    return { s: bs, d: Math.sqrt(best) };
  },

  // ---------------------------------------------------------------- each frame
  active(k) { return !this.off && k.G.mode !== 'race' && !k.plan.racing && (this.phase !== 'idle' || st.stage === 'wait'); },
  update(dt, k) {
    this.t += dt;
    const ph = this.phase, G = k.G;
    if (ph === 'idle' || ph === 'armed') return this._due(dt, k);
    if (ph === 'rise') return this._rise(dt, k);
    if (ph === 'come') return this._come(dt, k);
    if (ph === 'pass') return this._pass(dt, k);
    if (ph === 'look') return this._look(dt, k);
    if (ph === 'herd') return this._herd(dt, k);
    if (ph === 'takeoff' || ph === 'fly') return this._fly(dt, k);
    if (ph === 'lake') return this._lake(dt, k);
    if (ph === 'finale') return this._finale(dt, k);
    void G;
  },

  // Is it time? Twice a second: the grate's page, works seen since, time indoors. Then, when you are near the lobby, up it comes.
  _due(dt, k) {
    if (st.stage !== 'wait') { this.phase = 'idle'; return; }
    const G = k.G, play = G.state === 'play';
    if (play && k.room) { this.inT += dt; if (story.has('grate')) this.sinceGrate += dt; }
    if (this.phase === 'armed' && (this.pulseT = (this.pulseT || 0) - dt) <= 0) { this.pulseT = 2.4; const s = features.find(f => f.id === 'story'); if (s) s.flare = Math.max(s.flare || 0, 0.9); }
    if ((this.checkT -= dt) > 0) return;
    this.checkT = 0.5;
    if (!story.has('grate')) return;
    const seen = G.museum.seenCount;
    if (this.seenAt == null) this.seenAt = seen;
    if (this.phase === 'idle') {
      if (this.inT < 75 || (seen - this.seenAt < 3 && this.sinceGrate < 180)) return;
      this.phase = 'armed';
      if (k.room && !this._near(k)) k.say('Back in the lobby, the grate hums louder.', 0.5, 5);
    }
    if (play && !G.ride && !G.held && !G.study && this._near(k) && Math.hypot(k.pos.x - this.grate.x, k.pos.z - this.grate.z) > 1.4) this._start(k);
  },

  // ---------------------------------------------------------------- up out of the grate
  _start(k) {
    st.stage = 'flown'; save();          // from here on, a reload finds it waiting at the light
    this._buildRoute(k);
    this.phase = 'rise'; this.pt = 0;
    this.pos.set(this.grate.x, this.L.y - 0.2, this.grate.z);
    this.column.visible = true; this.held = k.hold(() => {});
    const s = features.find(f => f.id === 'story'); if (s) s.flare = 2.2;
    k.synth.noise(0.5, { vol: 0.03, lp: 1200 }); this._whoosh(true, 0.025);
    // the camera: over your shoulder if the grate is in sight, else in the lobby looking at it
    const p = k.pos, inLobby = k.room && k.room.id === this.L.id, dx = this.grate.x - p.x, dz = this.grate.z - p.z, d = Math.hypot(dx, dz) || 1;
    const at = inLobby ? { x: p.x - dx / d * 1.0, y: p.y + 0.7, z: p.z - dz / d * 1.0 } : { x: this.grate.x + 3, y: this.L.y + 1.3, z: this.grate.z + 2.6 };
    confine(k.plan, at, 0.12, true, null, true);
    this.riseCam = at;
  },
  _rise(dt, k) {
    this.pt += dt; const t = this.pt, G = this.grate, f = Math.min(1, t / 1.8), e = 1 - (1 - f) * (1 - f);
    this.pos.set(G.x, G.y - 0.2 + (FLY + 0.55) * e, G.z);
    const c = Math.min(1, t / 0.35) * (t > 1.9 ? Math.max(0, 1 - (t - 1.9) / 0.6) : 1);
    this.column.material.color.copy(GREEN).multiplyScalar(0.45 * c + 0.1 * Math.sin(t * 20) * c);
    this._show(dt, k, k.pos, { floor: G.y, trail: false });
    this.m.body.rotation.y += dt * 9 * (1 - f);
    k.camClose = { at: this.riseCam, look: { x: G.x, y: G.y + 0.4 + 0.8 * e, z: G.z } };
    if (t > 0.5 && !this.rang) { this.rang = true; this._note(0, { gain: 0.03, dur: 0.6 }); this._note(1, { gain: 0.03, dur: 0.6, at: 0.32 }); }
    if (t > 2.3) {
      this.rang = false; this.column.visible = false;
      this.come = this._way(k, G.x, G.z, k.pos.x, k.pos.z); this.ci = 1;
      this.phase = 'come'; this.pt = 0;
    }
  },
  // to you, through the doorways (the same floor grid as the way out)
  _come(dt, k) {
    this.pt += dt; const p = k.pos, y = this.L.y + FLY;
    const q = this.come[this.ci], dx = q.x - this.pos.x, dz = q.z - this.pos.z, d = Math.hypot(dx, dz), sp = 6 * dt;
    if (d <= sp) { this.pos.x = q.x; this.pos.z = q.z; this.ci++; } else { this.pos.x += dx / d * sp; this.pos.z += dz / d * sp; }
    this.pos.y += (y - this.pos.y) * Math.min(1, dt * 4);
    this._show(dt, k, q, { floor: this.L.y, tilt: 0.25 });
    if (this.ci >= this.come.length || Math.hypot(p.x - this.pos.x, p.z - this.pos.z) < 2.2 || this.pt > 12) this._startPass(k);
  },
  // past you, round behind, and in front of your nose
  _startPass(k) {
    const v = k.v, p = k.pos, fx = Math.sin(v.yaw), fz = Math.cos(v.yaw), sx = fz, sz = -fx;
    const A = this.pos.clone(), side = ((this.pos.x - p.x) * sx + (this.pos.z - p.z) * sz) > 0 ? 1 : -1;
    const C = new THREE.Vector3(p.x + sx * side * 0.7 - fx * 1.3, p.y + 0.5, p.z + sz * side * 0.7 - fz * 1.3);
    const H = new THREE.Vector3(p.x + fx * 0.9, p.y + 0.24, p.z + fz * 0.9);
    confine(k.plan, H, R + 0.02, true); confine(k.plan, C, R + 0.02, true);
    this.passP = { A, C, H }; this.phase = 'pass'; this.pt = 0; this._whoosh(false, 0.02);
  },
  _pass(dt, k) {
    this.pt += dt; const f = Math.min(1, this.pt / 1.5), e = f * f * (3 - 2 * f), u = 1 - e, { A, C, H } = this.passP;
    this.pos.set(u * u * A.x + 2 * u * e * C.x + e * e * H.x, u * u * A.y + 2 * u * e * C.y + e * e * H.y, u * u * A.z + 2 * u * e * C.z + e * e * H.z);
    confine(k.plan, this.pos, R, true);
    this._show(dt, k, f > 0.6 ? k.pos : H, { floor: this.L.y, tilt: 0.3 * (1 - f) });
    if (f >= 1) { this.phase = 'look'; this.pt = 0; this.callLen = this._call(0.3, 0.035, 12); }
  },
  // a moment face to face, chiming the call
  _look(dt, k) {
    this.pt += dt; const H = this.passP.H, p = k.pos, t = this.t;
    this.pos.set(H.x + Math.sin(t * 1.7) * 0.03, H.y + Math.sin(t * 2.6) * 0.03, H.z + Math.cos(t * 1.3) * 0.03);
    this._show(dt, k, p, { floor: this.L.y });
    this.m.body.rotation.z += Math.sin(this.pt * 3) * 0.12;       // a curious tilt, one way, the other
    const dx = H.x - p.x, dz = H.z - p.z, d = Math.hypot(dx, dz) || 1, at = { x: p.x - dx / d * 0.62 + dz / d * 0.22, y: p.y + 0.3, z: p.z - dz / d * 0.62 - dx / d * 0.22 };
    confine(k.plan, at, 0.1, true, null, true);
    k.camClose = { at, look: { x: this.pos.x, y: this.pos.y, z: this.pos.z }, fov: 58 };
    if (this.pt > Math.max(2.2, this.callLen || 0)) {
      k.hold(null); this.held = null;
      const pr = this._project(p.x, p.z);
      this.s = Math.min(this.route.len, pr.s + LEAD); this.blend = 1; this.blendFrom = this.pos.clone();
      this.phase = 'herd'; this.pt = 0; this.idleT = 0; this.chimeT = 1.2; this.chimeI = 0; this.awayT = 0;
      this._whoosh(true, 0.015);
      k.say('It wants out. Herd it to the vent.', 0.3, 4);
    }
  },

  // ---------------------------------------------------------------- herding it out
  _herd(dt, k) {
    this.pt += dt;
    const p = k.pos, pr = this._project(p.x, p.z), s0 = this.s, len = this.route.len;
    const here = this._at(this.s, this.v3), dist = Math.hypot(p.x - here.x, p.z - here.z);
    const onWay = pr.d < 7 && (k.room ? this._near(k) || (k.room.id === this.L.id) : pr.s > len - 6);
    if (onWay) {
      const target = Math.min(len, pr.s + LEAD);
      if (target > this.s) { const gap = target - this.s, v = Math.min(11, 0.8 + gap * 3.2); this.s = Math.min(target, this.s + v * dt); }
      else if (target < this.s - 1.5 && dist > LEAD + 2.5) this.s = Math.max(target, this.s - 1.4 * dt);       // gone back in: it comes back to where you can see it
      if (pr.d < 2.5) this.s = Math.max(this.s, Math.min(len, pr.s + NEAREST));                                   // and is never caught
    }
    this.s = Math.max(0, Math.min(len, this.s));
    const moving = Math.abs(this.s - s0) > 0.003;
    this._at(this.s, this.pos);
    this.pos.y += Math.sin(this.t * 2.4) * 0.035; this.pos.x += Math.sin(this.t * 1.3) * 0.025;
    if (this.blend > 0) { this.blend = Math.max(0, this.blend - dt * 2.5); this.pos.lerp(this.blendFrom, this.blend * this.blend); }
    const S = this.route.S, n = S.length, floor = this.s < S[n - 3] ? this.L.y : this.s > S[n - 2] ? this.route.pts[n - 1].y - 0.55 : null;      // (the last three points: into the vent, out of it, the terrace)
    this._show(dt, k, p, { floor, tilt: moving ? -0.18 : 0 });
    // still: it bobs and chimes softly, a note at a time
    if (moving) this.idleT = 0; else this.idleT += dt;
    if (this.idleT > 0.6 && (this.chimeT -= dt) <= 0) { this.chimeT = 2.4; this._note(this.chimeI, { gain: 0.012, dur: 0.5 }); this.chimeI = (this.chimeI + 1) % 5; }
    // out on the terrace with you: off it goes
    const V = this.vent, out = !k.room && !(p.x > V.x0 - 0.3 && p.x < V.x1 + 0.3 && p.z > V.z0 - 0.4 && p.z < V.z1 + 0.4);      // (out of the vent too, on the terrace)
    if (this.s >= len - 0.05 && out && dist < 8) return this._takeoff(k, true);
    // you went out some other way and are far off: it slips out of the vent and goes without you watching
    if (out && dist > 25) { this.awayT += dt; if (this.awayT > 15) { this.s = Math.min(len, this.s + 6 * dt); if (this.s >= len) return this._takeoff(k, false); } } else this.awayT = 0;
  },

  // ---------------------------------------------------------------- across the grounds to the light
  _takeoff(k, watched) {
    const a = this.pos.clone(), W = this.wait;
    const pts = [a, new THREE.Vector3(a.x - 3, a.y + 4, a.z - 0.5), new THREE.Vector3(a.x - 2, 25, a.z - 2), new THREE.Vector3(60, 30, 104), new THREE.Vector3(250, 30, 110),
      new THREE.Vector3(340, 14, 118), new THREE.Vector3(418, 10, 150), new THREE.Vector3(520, 8, 92), new THREE.Vector3(578, 5.5, 66), new THREE.Vector3(W.x - 4, W.y + 0.6, W.z + 4), new THREE.Vector3(W.x, W.y, W.z)];
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    this.flyLen = this.curve.getLength(); this.flyT = 0; this.flyDur = 22;
    this.phase = 'takeoff'; this.pt = 0; this.watched = watched;
    this.toy0 = k.pos.clone();
    if (watched) this.held = k.hold(() => {});
    this._whoosh(true, 0.04); this._call(0.16, 0.03, 12);
  },
  _fly(dt, k) {
    this.pt += dt; this.flyT += dt;
    // slow away, a long steady run, a slow arrival: speed ramps up over the first 8% of the time and down over the last 15%
    const f = Math.min(1, this.flyT / this.flyDur), a = 0.08, b = 0.85, vmax = 1 / (a / 2 + (b - a) + (1 - b) / 2);
    const u = f < a ? vmax * f * f / (2 * a) : f < b ? vmax * (a / 2 + (f - a)) : vmax * (a / 2 + (b - a) + ((1 - b) - (1 - f) ** 2 / (1 - b)) / 2);
    this.curve.getPointAt(Math.min(1, u), this.pos);
    const far = this.pos.distanceTo(k.pos);
    this._show(dt, k, this.curve.getPointAt(Math.min(1, u + 0.01), this.v4), { halo: Math.min(6, 0.7 + far * 0.04), size: Math.min(2.2, 0.09 + far * 0.012), step: 0.4, fade: 0.9, tilt: 0.35 });
    if (this.phase === 'takeoff') {
      const t = this.pt, p = this.toy0;
      if (this.watched) {
        // first from just behind the toy, looking up at it; then craning up high over the front, looking out after it
        const dx = this.pos.x - p.x, dz = this.pos.z - p.z, d = Math.hypot(dx, dz) || 1;
        const low = { x: p.x - dx / d * 1.4, y: p.y + 0.6, z: p.z - dz / d * 1.4 }, high = { x: p.x - 16, y: 36, z: p.z + 12 };
        const c = Math.min(1, Math.max(0, (t - 1.4) / 2.2)), e2 = c * c * (3 - 2 * c);
        k.camClose = { at: { x: low.x + (high.x - low.x) * e2, y: low.y + (high.y - low.y) * e2, z: low.z + (high.z - low.z) * e2 }, look: { x: this.pos.x, y: this.pos.y, z: this.pos.z } };
      }
      if (t > (this.watched ? 5.2 : 0)) {
        this.phase = 'fly'; if (this.held) { k.hold(null); this.held = null; }
        if (this.watched) k.say('Off to the lake. To the harbour light.', 0.2, 5);
      }
    }
    if (f >= 1) this._toLake();
  },
  _toLake() { this.phase = 'lake'; this.pos.set(this.wait.x, this.wait.y, this.wait.z); this.chimeT = 1; this.chimeI = 0; this.trailP.fill(-9999); this.trail.visible = false; this.pool.visible = false; this.m.group.visible = true; this.m.group.position.copy(this.pos); },

  // ---------------------------------------------------------------- waiting by the light
  _lake(dt, k) {
    const p = k.pos, W = this.wait, far = Math.hypot(p.x - W.x, p.z - W.z);
    if (far > 160) return;                                       // (nothing to do while you are a long way off)
    const t = this.t;
    this.pos.set(W.x + Math.sin(t * 0.7) * 0.25, W.y + Math.sin(t * 1.9) * 0.12, W.z + Math.cos(t * 0.6) * 0.2);
    this._show(dt, k, p, { halo: Math.min(3, 0.8 + far * 0.03), trail: false });
    if (far < 90 && (this.chimeT -= dt) <= 0) { this.chimeT = 3.2; this._note(this.chimeI, { gain: 0.016 * Math.max(0.3, 1 - far / 90), dur: 0.6 }); this.chimeI = (this.chimeI + 1) % 5; }
    // here: on the breakwater by the light (or flying up to it)
    const L = this.light, d = Math.hypot(p.x - L.x, p.z - (L.z + 3));
    if (k.G.state === 'play' && !k.G.held && !k.G.ride && ((k.v.kind === 'car' && p.y > 1.0 && d < 7) || (k.v.kind !== 'car' && d < 9 && p.y > 0.8))) this._startFinale(k);
  },

  // ---------------------------------------------------------------- once round the lantern, and up
  _startFinale(k) {
    this.phase = 'finale'; this.pt = 0; this.from = this.pos.clone();
    this.held = k.hold(() => {});
    const L = this.light, p = k.pos, dx = L.x - p.x, dz = L.z - p.z, d = Math.hypot(dx, dz) || 1;
    this.finCam = { x: p.x - dx / d * 1.6, y: p.y + 0.8, z: p.z - dz / d * 1.6 };
    this.a0 = Math.atan2(this.from.z - L.z, this.from.x - L.x);
    this.harbour = features.find(f => f.id === 'harbourlight');
    this.called = false;
  },
  _finale(dt, k) {
    this.pt += dt; const t = this.pt, L = this.light, cy = 5.5, r = 1.6;
    if (t < 1.0) {                    // to the lantern
      const f = t / 1.0, e = f * f * (3 - 2 * f); this.v3.set(L.x + Math.cos(this.a0) * r, cy, L.z + Math.sin(this.a0) * r); this.pos.lerpVectors(this.from, this.v3, e);
    } else if (t < 4.2) {             // once round it, the light gone green
      const f = (t - 1.0) / 3.2, a = this.a0 + f * Math.PI * 2; this.pos.set(L.x + Math.cos(a) * r, cy + Math.sin(f * Math.PI * 2) * 0.15, L.z + Math.sin(a) * r);
      if (this.harbour) this.harbour.green = Math.max(this.harbour.green || 0, 0.3);
    } else if (t < 4.9) {             // over the lantern a moment, the whole call, quick
      this.v3.set(L.x, cy + 1.4, L.z); this.pos.lerp(this.v3, Math.min(1, dt * 5));
      if (!this.called) { this.called = true; this._call(0.11, 0.04, 12); if (this.harbour) this.harbour.green = 0.6; }
    } else {                          // and up, faster and faster, gone
      if (!this.top) { this.top = this.pos.clone(); this._whoosh(true, 0.05); }
      const f = Math.min(1, (t - 4.9) / 2.2), e = Math.pow(f, 2.2); this.pos.set(this.top.x + 30 * e, this.top.y + 170 * e, this.top.z - 22 * e);
    }
    const far = this.pos.distanceTo(k.pos);
    this._show(dt, k, t < 4.2 ? { x: L.x, z: L.z } : k.pos, { halo: Math.min(8, 1.3 + far * 0.03), size: Math.min(3, 0.1 + far * 0.015), step: 0.15, fade: 1.2 });
    const look = t < 4.9 ? { x: L.x, y: cy, z: L.z } : { x: this.pos.x, y: Math.min(this.pos.y, this.finCam.y + 120), z: this.pos.z };
    k.camClose = { at: this.finCam, look, fov: t > 4.9 ? 62 : 55 };
    if (t > 7.6) {
      this.top = null; k.hold(null); this.held = null; this._hide();
      this.phase = 'idle'; st.stage = 'gone'; save();
      k.say('Up, and gone. Not a sound.', 0.1, 4);
      if (!story.has('lighthouse')) k.say('A hut at the foot of the light. Something on the step.', 4.2, 5);
    }
  },

  // ---------------------------------------------------------------- the keeper's log, on the hut's step
  _logMeshes(k) {
    if (this.logG) return;
    const H = this.hut, g = this.logG = new THREE.Group(); g.name = 'keeper-log';
    const tl = new THREE.CanvasTexture(logCard()); tl.colorSpace = THREE.SRGBColorSpace; tl.anisotropy = 4;
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.025, 0.28), new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.8, emissive: 0x140c08, emissiveIntensity: 0.6 }));
    book.position.set(H.log.x, H.log.y + 0.0125, H.log.z); book.rotation.y = 0.18; g.add(book);
    const page = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.27).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tl, roughness: 0.9, emissiveMap: tl, emissive: 0xffffff, emissiveIntensity: 0.35 }));
    page.position.set(H.log.x, H.log.y + 0.026, H.log.z); page.rotation.y = 0.18 - Math.PI / 2; g.add(page);
    const tn = new THREE.CanvasTexture(noteCard()); tn.colorSpace = THREE.SRGBColorSpace;
    const note = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.165), new THREE.MeshStandardMaterial({ map: tn, roughness: 0.9, emissiveMap: tn, emissive: 0xffffff, emissiveIntensity: 0.35 }));
    note.position.set(H.x1 + 0.024, H.y + 0.72, H.door.z - 0.12); note.rotation.set(0, Math.PI / 2, 0.06); g.add(note);
    k.group.add(g);
  },
  _showCard(on) {
    const el = this.cardEl; el.innerHTML = '';
    if (on) {
      const a = logCard(), b = noteCard();
      a.style.cssText = 'width:66%;height:auto;display:block;transform:rotate(-1.2deg)';
      b.style.cssText = 'position:absolute;right:0;top:44%;width:38%;height:auto;transform:rotate(3deg);filter:drop-shadow(0 6px 12px rgba(0,0,0,.5))';
      el.style.position = 'fixed'; const box = document.createElement('div'); box.style.position = 'relative'; box.append(a, b); el.append(box);
      this.cardAt = { x: this.k.pos.x, z: this.k.pos.z, t: this.t };
    } else this.cardAt = null;
    el.style.opacity = on ? '1' : '0'; this.showing = on;
  },
  _read(k) {
    if (this.showing) { this._showCard(false); return; }
    this._showCard(true);
    if (story.add('lighthouse')) k.say('Clarice. She watched the museum from out here.', 0.6, 5);
  },

  near(v, k) {
    if (this.off || k.G.mode === 'race') return null;
    const A = this.hut.log, p = k.pos;
    if (Math.abs(p.y - A.y) < 0.8 && Math.abs(p.x - A.x) < 2 && Math.abs(p.z - A.z) < 2) {
      this._logMeshes(k);
      if (Math.hypot(p.x - A.x, p.z - A.z) < 0.95) return { verb: 'READ', hint: story.has('lighthouse') ? null : 'A logbook, left open on the step. E to read it.', act: () => this._read(k) };
    }
    if (this.cardAt && (Math.hypot(p.x - this.cardAt.x, p.z - this.cardAt.z) > 1.2 || this.t - this.cardAt.t > 20)) this._showCard(false);
    if (!this.logG && Math.abs(p.x - A.x) < 60 && Math.abs(p.z - A.z) < 60) this._logMeshes(k);
    return null;
  },
  spots() { return this.off ? [] : [{ kind: 'todo', id: 'keeper-log', name: 'Clarice’s log (the keeper’s hut)', x: this.hut.log.x, y: this.hut.log.y, z: this.hut.log.z }]; },
  // A new night: anything in the middle of happening is put where it would be saved.
  reset(k) {
    if (this.off) return;
    if (this.held) { k.hold(null); this.held = null; }
    if (this.cardEl) this._showCard(false);
    if (st.stage === 'flown') this._toLake(); else { this._hide(); this.phase = 'idle'; }
    this.inT = 0; this.sinceGrate = 0; this.seenAt = null; this.top = null;
  },
  // A new game: it has not come up yet.
  fresh(k) {
    if (this.off) return;
    st = { stage: 'wait' }; save();
    if (this.held) { k.hold(null); this.held = null; }
    this._hide(); this.phase = 'idle'; this.inT = 0; this.sinceGrate = 0; this.seenAt = null; this.top = null;
    if (this.cardEl) this._showCard(false);
  },
});
