// The Tracker: the security desk's live floor plan.
//
// Every robot guard as a dot with its searchlight and the colour of its mood, the radioactive mice as green
// blips, the probe (while it is back in the building) as UNKNOWN CONTACT ?, and you, the toy. A level at a time.
// Below the lower level the plan is hatched and stamped RESTRICTED: CLEARANCE 9, and now and then something
// shows there and is gone.
//
// Nothing is worked out here that the game has not already got: the robots are src/guards.js's own list,
// the mice src/mice.js's, the probe src/probe.js's, and the floor plan is the map's own picture of a level
// (src/map.js: G.nav.picture), turned phosphor green. One 2D canvas; drawn a few times a second by whoever
// is showing it (the Tracker window, and the big screen on the control room's wall: src/secdesk.js).

import { features } from './features.js';

const TAU = Math.PI * 2;
const HALF = 0.62, REACH = 9;                 // the searchlight, as src/guards.js has it
const MOOD = { patrol: 0, scan: 0, return: 0, tend: 0, alert: 1, search: 1, chase: 2, charge: 2, hold: 2 };
const STATE = { patrol: 'PATROL', scan: 'SWEEPING', return: 'RETURNING', tend: 'SENDING HOME', alert: 'ALERT ?', search: 'SEARCHING', chase: 'PURSUIT !', charge: 'CHARGING !', hold: 'DETAINING' };
const TINT = ['#7dffa0', '#ffc23a', '#ff4636'];
const NAMES = { LL: 'SUB-LEVEL 1', 1: 'FIRST', 2: 'SECOND', 3: 'THIRD' };
export const RESTRICTED = 'SL9';
const feat = id => features.find(f => f.id === id);
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const roomName = (plan, id) => { const r = id && plan.byId[id]; if (!r) return 'corridor'; if (r.id === 'lobby' || /lobby/i.test(r.id)) return 'Lobby'; const g = String(r.gallery || r.id); return g.replace(/^Galler(y|ies) /, '').replace(/\s*\(.*\)$/, '').slice(0, 15); };
const beatName = id => String(id).replace(/^G(?=\d)/, '').replace(/^F\d-/, '').replace(/_/g, '-');

export class Tracker {
  constructor(G) { this.G = G; this.tinted = new Map(); }
  // The levels there are to look at, bottom to top, and the one nobody may.
  levels() { const L = this.G.plan.levels || { 1: 0 }; return [{ id: RESTRICTED, name: 'SUB-LEVEL', y: -12, restricted: true }, ...['LL', '1', '2', '3'].filter(k => L[k] != null).map(k => ({ id: k, name: NAMES[k] || k, y: L[k] }))]; }
  levelOf(y) { let best = null; for (const l of this.levels()) if (!l.restricted && (!best || Math.abs(l.y - y) < Math.abs(best.y - y))) best = l; return best; }
  get guardsOn() { const G = this.G; return G.mode === 'explore' && G.set && G.set.guards !== false; }

  // ---- who is where (also what the terminal's `bots` and `mice` print)
  bots() {
    const g = feat('guards'), P = this.G.plan; if (!g || !g.bots || !this.guardsOn) return [];
    return g.bots.map((b, i) => ({ id: b.lobby ? 'LOBBY' : 'BOT-' + String(i).padStart(2, '0'), x: b.x, z: b.z, y: b.fy, look: b.look, mode: b.mode, mood: MOOD[b.mode] || 0, level: this.levelOf(b.fy).id, room: roomName(P, b.room), state: STATE[b.mode] || String(b.mode).toUpperCase(), warm: MOOD[b.mode] === 1, hot: MOOD[b.mode] === 2, beat: b.lobby ? 'lobby, past the coat check' : b.P.rooms.map(beatName).join(' > ') }));
  }
  mice() {
    const m = feat('mice'); if (!m || !m.list) return [];
    // (the floor below has one name wherever it is read, the map's: the mice's own table, plan.js MOUSE_WINGS, still says "the lower level")
    return m.list.map((q, i) => ({ id: 'M' + (i + 1), wing: q.wing ? (q.wing.id === 'lower' ? 'Sub-level 1' : q.wing.name) : '?', x: q.px || 0, z: q.pz || 0, y: q.y, level: this.levelOf(q.y).id, out: q.px != null && q.state !== 'home' && q.state !== 'done', state: q.state === 'done' ? 'HOME' : q.state === 'home' ? 'IN ITS HOLE' : q.state === 'run' || q.state === 'duck' ? 'RUNNING' : 'AT LARGE' }));
  }
  // What is out of its painting (src/escapes.js): each by name, where it is, and the day's record of the ones sent home.
  escapes() {
    const e = this.G.escapes; if (!e || !e.list) return [];
    return e.list().map(q => ({ id: q.tag, name: q.name, from: q.from, x: q.x, z: q.z, y: q.y, level: this.levelOf(q.y).id, room: roomName(this.G.plan, q.room), state: q.state === 'going' ? 'GOING HOME' : q.lit ? 'IN THE LIGHT' : 'LOOSE' }));
  }
  escapeLog() { const e = this.G.escapes; return e && e.log ? e.log.slice() : []; }
  probe() { const p = feat('probe'); if (!p || !p.pos || p.phase === 'idle' || !p.m || !p.m.group.visible) return null; return { x: p.pos.x, y: p.pos.y, z: p.pos.z, level: this.levelOf(p.pos.y).id }; }

  // The map's picture of a level, in green: made again only when the map's own picture changes.
  plan(level) {
    const nav = this.G.nav, pic = nav && nav.picture ? nav.picture(level.y) : null; if (!pic) return null;
    let t = this.tinted.get(level.id);
    if (t && t.key === pic.key && t.w === pic.canvas.width) return t;
    const cv = (t && t.canvas) || document.createElement('canvas'), w = Math.ceil(pic.canvas.width / 2), h = Math.ceil(pic.canvas.height / 2); cv.width = w; cv.height = h;      // (half the map's size: it is looked at small, and there is one a level)
    const c = cv.getContext('2d');
    c.globalCompositeOperation = 'source-over'; c.drawImage(pic.canvas, 0, 0, w, h);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3; c.drawImage(pic.canvas, 0, 0, w, h); c.globalAlpha = 1;      // (the plan is drawn for a dark screen: lifted a little)
    c.globalCompositeOperation = 'color'; c.fillStyle = '#2fd27a'; c.fillRect(0, 0, w, h);                                 // its light and dark, in one green
    c.globalCompositeOperation = 'destination-in'; c.drawImage(pic.canvas, 0, 0, w, h);
    c.globalCompositeOperation = 'source-over';
    t = { key: pic.key, w: pic.canvas.width, canvas: cv, x0: pic.x0, z0: pic.z0, ppm: pic.ppm * w / pic.canvas.width }; this.tinted.set(level.id, t); return t;
  }

  // The part of the plan a level takes up (its rooms that are on a drawing), with a little room round it.
  bounds(level) {
    this.fits = this.fits || {}; if (this.fits[level.id]) return this.fits[level.id];
    const b = { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 };
    for (const r of this.G.plan.rooms) if (!r.secret && Math.abs(r.y - level.y) < 0.7) { b.x0 = Math.min(b.x0, r.x0); b.x1 = Math.max(b.x1, r.x1); b.z0 = Math.min(b.z0, r.z0); b.z1 = Math.max(b.z1, r.z1); }
    if (b.x0 > b.x1) Object.assign(b, { x0: 0, x1: 260, z0: 0, z1: 240 });
    b.x0 -= 8; b.x1 += 8; b.z0 -= 8; b.z1 += 8; return (this.fits[level.id] = b);
  }

  // ---- the picture. o: { level (an entry of levels()), t (seconds), view: { cx, cz, zoom } | null, clearance, small (the wall's screen), names }
  draw(c, W, H, o) {
    const G = this.G, t = o.t || 0, level = o.level, small = !!o.small, f = small ? 1 : Math.max(1, Math.min(1.5, W / 700));
    c.setTransform(o.dpr || 1, 0, 0, o.dpr || 1, 0, 0);
    c.fillStyle = '#020a06'; c.fillRect(0, 0, W, H);
    c.textBaseline = 'middle'; c.lineJoin = 'round';
    const mono = (n, w = 600) => `${w} ${Math.round(n * f)}px ui-monospace, Menlo, Consolas, monospace`;
    if (level.restricted) return this._restricted(c, W, H, o, mono);
    const P = this.plan(level), pad = small ? 6 : 14, top = small ? 22 : 8;
    if (!P) { c.fillStyle = '#7dffa0'; c.font = mono(12); c.textAlign = 'center'; c.fillText('NO PLAN ON FILE', W / 2, H / 2); return; }
    const pw = P.canvas.width / P.ppm, ph = P.canvas.height / P.ppm, B = this.bounds(level), fit = Math.min((W - 2 * pad) / (B.x1 - B.x0), (H - top - pad) / (B.z1 - B.z0));
    const zoom = o.view ? o.view.zoom : 1, s = fit * zoom, cx = o.view ? o.view.cx : (B.x0 + B.x1) / 2, cz = o.view ? o.view.cz : (B.z0 + B.z1) / 2;
    const ox = W / 2 - cx * s, oz = (H + top - pad) / 2 - cz * s, X = x => x * s + ox, Z = z => z * s + oz;
    this.last = { s, ox, oz, x0: P.x0, z0: P.z0, pw, ph };
    // a faint grid, every twenty metres, behind the plan
    c.strokeStyle = 'rgba(80,255,150,.07)'; c.lineWidth = 1; c.beginPath();
    for (let x = Math.ceil((0 - ox) / s / 20) * 20; X(x) < W; x += 20) { c.moveTo(X(x), 0); c.lineTo(X(x), H); } for (let z = Math.ceil((0 - oz) / s / 20) * 20; Z(z) < H; z += 20) { c.moveTo(0, Z(z)); c.lineTo(W, Z(z)); } c.stroke();
    c.imageSmoothingEnabled = true; c.globalAlpha = 0.72; c.drawImage(P.canvas, X(P.x0), Z(P.z0), pw * s, ph * s); c.globalAlpha = 1;
    // the robots: the light each throws, then the robot
    const bots = this.bots().filter(b => b.level === level.id), r0 = small ? 2.6 : Math.max(4.5, Math.min(8, s * 0.6)), reach = Math.max(REACH * s, r0 * (small ? 4 : 5.5));
    for (const b of bots) {                               // (every light first, so that no robot is under another's)
      const x = X(b.x), z = Z(b.z), a = Math.PI / 2 - b.look;
      c.fillStyle = b.mood === 2 ? 'rgba(255,70,54,.34)' : b.mood === 1 ? 'rgba(255,194,58,.3)' : 'rgba(170,255,200,.24)';
      c.beginPath(); c.moveTo(x, z); c.arc(x, z, reach, a - HALF, a + HALF); c.closePath(); c.fill();
      c.strokeStyle = b.mood === 2 ? 'rgba(255,70,54,.7)' : b.mood === 1 ? 'rgba(255,194,58,.6)' : 'rgba(170,255,200,.4)'; c.lineWidth = 1; c.stroke();
    }
    const S = G.systems, wet = S && typeof S.wetAt === 'function' ? (x, z, y) => { try { return !!S.wetAt(x, z, y); } catch { return false; } } : null;      // (src/systems.js: the sprinklers)
    const damp = (x, z, r) => { c.strokeStyle = '#6fc3ff'; c.lineWidth = 1.5; c.setLineDash([3, 3]); c.beginPath(); c.arc(x, z, r, 0, TAU); c.stroke(); c.setLineDash([]); };
    for (const b of bots) {
      const x = X(b.x), z = Z(b.z), col = TINT[b.mood];
      if (wet && wet(b.x, b.z, b.y)) damp(x, z, r0 * 2.6);
      if (b.mood) { c.strokeStyle = col; c.lineWidth = 1.5; c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 9); c.beginPath(); c.arc(x, z, r0 * 2.1, 0, TAU); c.stroke(); c.globalAlpha = 1; }
      c.fillStyle = '#020a06'; c.beginPath(); c.arc(x, z, r0 + 2, 0, TAU); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x, z, r0, 0, TAU); c.fill(); c.fillStyle = '#f4fff6'; c.beginPath(); c.arc(x, z, r0 * 0.4, 0, TAU); c.fill();
      if (!small && (zoom > 1.6 || W > 620)) { c.font = mono(10, 700); c.textAlign = 'left'; c.lineWidth = 3; c.strokeStyle = '#020a06'; const id = b.id.replace('BOT-', ''); c.strokeText(id, x + r0 + 4, z - r0 - 3); c.fillStyle = b.mood ? col : '#d6ffd9'; c.fillText(id, x + r0 + 4, z - r0 - 3); }
    }
    // the mice: a blip, and a ring going out from it
    for (const m of this.mice()) {
      if (!m.out || m.level !== level.id) continue;
      const x = X(m.x), z = Z(m.z), k = (t * 0.9 + hash(m.x)) % 1;
      c.strokeStyle = `rgba(110,255,140,${0.8 * (1 - k)})`; c.lineWidth = 1.2; c.beginPath(); c.arc(x, z, 2 + k * (small ? 7 : 12), 0, TAU); c.stroke();
      c.fillStyle = '#b8ffcc'; c.beginPath(); c.arc(x, z, small ? 1.6 : 2.4, 0, TAU); c.fill();
    }
    // what is out of a painting: a steady green dot in a soft halo, and its name
    for (const e of this.escapes()) {
      if (e.level !== level.id) continue;
      const x = X(e.x), z = Z(e.z), r = small ? 2 : 3;
      c.fillStyle = 'rgba(110,255,140,0.22)'; c.beginPath(); c.arc(x, z, r * 2.4, 0, TAU); c.fill();
      c.fillStyle = '#7dff9a'; c.beginPath(); c.arc(x, z, r, 0, TAU); c.fill();
      if (!small) { c.font = '9px monospace'; c.fillStyle = 'rgba(160,255,185,0.9)'; c.fillText(e.id, x + r + 3, z + 3); }
    }
    // the saucer, while it is back in the building
    const pr = this.probe();
    if (pr && pr.level === level.id) {
      const x = Math.max(12, Math.min(W - 12, X(pr.x))), z = Math.max(top + 10, Math.min(H - 12, Z(pr.z))), on = Math.floor(t * 3) % 2 === 0;
      c.strokeStyle = on ? '#ffffff' : '#7dffa0'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, z - 7); c.lineTo(x + 7, z); c.lineTo(x, z + 7); c.lineTo(x - 7, z); c.closePath(); c.stroke();
      c.font = mono(small ? 8 : 10, 700); c.textAlign = x > W * 0.6 ? 'right' : 'left'; c.fillStyle = on ? '#ffffff' : '#7dffa0'; c.fillText('UNKNOWN CONTACT ?', x + (x > W * 0.6 ? -11 : 11), z);
    }
    // you
    const v = G.vehicle;
    if (v && this.levelOf(v.pos.y).id === level.id) {
      const x = X(v.pos.x), z = Z(v.pos.z), r = small ? 4 : 6.5;
      if (wet && wet(v.pos.x, v.pos.z, v.pos.y)) damp(x, z, r * 2.2);
      c.save(); c.translate(x, z); c.rotate(Math.PI - (v.yaw || 0)); c.fillStyle = '#020a06'; c.beginPath(); c.arc(0, 0, r + 2.5, 0, TAU); c.fill();
      c.fillStyle = '#ffe08a'; c.beginPath(); c.moveTo(0, -r); c.lineTo(r * 0.72, r * 0.8); c.lineTo(0, r * 0.4); c.lineTo(-r * 0.72, r * 0.8); c.closePath(); c.fill(); c.restore();
      if (!small) { c.font = mono(9, 700); c.textAlign = 'left'; c.fillStyle = '#ffe08a'; c.fillText('TOY (NOT OURS)', x + r + 5, z + 1); }
    }
    // the corner: which level, how many about
    const hot = bots.filter(b => b.mood === 2).length, warm = bots.filter(b => b.mood === 1).length;
    if (small) {
      c.fillStyle = 'rgba(2,10,6,.8)'; c.fillRect(0, 0, W, 18); c.font = mono(10, 700); c.textAlign = 'left'; c.fillStyle = '#7dffa0'; c.fillText(`TRACKER · ${level.name}`, 6, 10);
      c.textAlign = 'right'; c.fillStyle = hot ? '#ff4636' : warm ? '#ffc23a' : '#7dffa0'; c.fillText(hot ? 'PURSUIT' : warm ? 'ALERT' : `${bots.length} UNITS`, W - 6, 10);
    } else {
      c.font = mono(10, 700); c.textAlign = 'left'; c.fillStyle = hot ? '#ff4636' : warm ? '#ffc23a' : 'rgba(125,255,160,.85)';
      c.fillText(!this.guardsOn ? 'ALL UNITS DOCKED' : `${bots.length} UNIT${bots.length === 1 ? '' : 'S'} ON THIS LEVEL${hot ? ' · PURSUIT' : warm ? ' · ALERT' : ''}`, 10, H - 12);
    }
    this._glass(c, W, H, t, small);
  }
  // What is under the building, as far as this desk is allowed to know.
  _restricted(c, W, H, o, mono) {
    const t = o.t || 0, small = !!o.small;
    c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip();
    c.strokeStyle = 'rgba(125,255,160,.16)'; c.lineWidth = small ? 3 : 5; c.beginPath(); for (let x = -H; x < W; x += small ? 12 : 20) { c.moveTo(x, H); c.lineTo(x + H, 0); } c.stroke();
    // the outline of something large, not on any drawing
    const bw = W * 0.5, bh = H * 0.34, bx = W * 0.25, by = H * 0.33;
    c.setLineDash([8, 6]); c.strokeStyle = 'rgba(125,255,160,.4)'; c.lineWidth = 1.5; c.strokeRect(bx, by, bw, bh); c.setLineDash([]);
    // now and then, something
    const slot = Math.floor(t / 6.5), k = t / 6.5 - slot;
    if (hash(slot) > 0.35 && k < 0.2) {
      const x = bx + bw * (0.12 + 0.76 * hash(slot + 9)), y = by + bh * (0.15 + 0.7 * hash(slot + 4)), a = 1 - k / 0.2;
      c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 3 + (1 - a) * 16, 0, TAU); c.stroke(); c.fillStyle = `rgba(190,255,210,${a})`; c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill();
      if (!small) { c.font = mono(9, 700); c.textAlign = 'left'; c.fillText(o.clearance ? 'ITEM 12 ?' : '?', x + 9, y - 8); }
    }
    c.translate(W / 2, H / 2); c.rotate(-0.14);
    const fs = Math.max(13, Math.min(W / 11, small ? 22 : 54));
    c.textAlign = 'center'; c.font = `800 ${fs}px ui-monospace, Menlo, Consolas, monospace`;
    const tw = c.measureText('RESTRICTED').width + fs * 1.2;
    c.fillStyle = 'rgba(2,10,6,.86)'; c.fillRect(-tw / 2, -fs * 1.25, tw, fs * 2.5);
    c.strokeStyle = '#ff4636'; c.lineWidth = Math.max(2, fs / 12); c.strokeRect(-tw / 2, -fs * 1.25, tw, fs * 2.5);
    c.fillStyle = '#ff4636'; c.fillText('RESTRICTED', 0, -fs * 0.42); c.font = `700 ${fs * 0.5}px ui-monospace, Menlo, Consolas, monospace`; c.fillText('CLEARANCE 9', 0, fs * 0.6);
    c.restore();
    c.font = mono(small ? 9 : 10, 700); c.textAlign = 'left'; c.fillStyle = 'rgba(125,255,160,.85)';
    if (small) { c.fillStyle = 'rgba(2,10,6,.8)'; c.fillRect(0, 0, W, 18); c.fillStyle = '#7dffa0'; c.fillText('TRACKER · SUB-LEVEL', 6, 10); }
    else c.fillText(o.clearance ? 'CLEARANCE 9 ACCEPTED · FEED CUT AT SOURCE (FACILITIES)' : 'NO FEED · "THERE IS NO SUB-LEVEL 9" (FACILITIES)', 10, H - 12);
    this._glass(c, W, H, t, small);
  }
  // The tube it is shown on: lines across it, and a slow bar going down.
  _glass(c, W, H, t, small) {
    if (small) return;                 // (the wall's screen gets its lines from the shader)
    c.fillStyle = 'rgba(0,0,0,.16)'; for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
    const y = (t * 38) % (H + 80) - 40, g = c.createLinearGradient(0, y - 40, 0, y + 40); g.addColorStop(0, 'rgba(125,255,160,0)'); g.addColorStop(0.5, 'rgba(125,255,160,.05)'); g.addColorStop(1, 'rgba(125,255,160,0)'); c.fillStyle = g; c.fillRect(0, y - 40, W, 80);
  }
  // A place on the floor from a place on the canvas (for zooming in where it was tapped).
  at(px, py) { const L = this.last; return L ? { x: (px - L.ox) / L.s, z: (py - L.oz) / L.s } : null; }
}
