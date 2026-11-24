// The computers in the security control rooms.
//
// Each control room (there are two, on the lower level, each beside a staff entrance) has a desk with a computer
// the night shift has left logged in. Pull up to it and USE it (the look button): its screen comes up over the
// game, a slightly dated security-office desktop. The building carries on behind (the robots keep walking, which
// is the point of the Tracker), but the toy stands still until you leave: Escape, or LEAVE, at once.
//
//   Terminal      a command prompt over a small made-up filesystem (src/secterm.js, src/secfiles.js): ls and dir, cd,
//                 cat, and open <file> for the editor. The files are the night shift's paperwork, and clues. The
//                 building's switches are commands too, by way of G.systems (src/systems.js). Everything can be
//                 done by tapping: a row of commands, then the names in the folder.
//   Tracker       the floor plan, live: every robot, the mice, the probe, you (src/tracker.js). Sub-level 9 is
//                 RESTRICTED. The same picture runs on the big screen on the room's wall.
//   Last Donut    a game (src/donut.js).
//   Incident Log  a shortcut to /incidents/incident_log.txt, in the editor.
//
// One folder wants CLEARANCE 9. The password is in two halves, on sticky notes: one on this room's monitor, one
// on the other room's (they are on the screen's edge here, and on the monitors in the building). In the folder
// is a page of the Green Cheese file (src/story.js, 'nightlog').
//
// Kept between visits ('after-hours.secdesk'): clearance, which notes have been seen, what was typed into the
// two files that can be changed, the donut game's best score. A new game forgets all but the score.
//
// Nothing is done per frame unless the toy is in or beside a control room (active): then the wall's screens
// (src/secroom.js) get their clock, and the tracker is redrawn three times a second.

import { feature } from './features.js';
import { story } from './story.js';
import { MOTIF, hz } from './motif.js';
import { VFS, HALVES } from './secfiles.js';
import { Term } from './secterm.js';
import { Tracker } from './tracker.js';
import { arenaFrom, Arena, LastDonut, Tune } from './donut.js';
import { dressRooms, DESK_U, LIVE_W, LIVE_H } from './secroom.js';
import * as SYS from './systems.js';

const KEY = 'after-hours.secdesk';
const HAND = '"Marker Felt", "Bradley Hand", "Segoe Print", "Chalkboard SE", "Comic Sans MS", cursive';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const ICON = {
  term: '<rect x="5" y="8" width="38" height="30" rx="3" fill="#04110a" stroke="#c9c3b2" stroke-width="3"/><path d="M12 18l7 5-7 5" fill="none" stroke="#9fe6a0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 29h11" stroke="#9fe6a0" stroke-width="3" stroke-linecap="round"/>',
  tracker: '<circle cx="24" cy="24" r="18" fill="#04110a" stroke="#c9c3b2" stroke-width="3"/><circle cx="24" cy="24" r="10" fill="none" stroke="#2f6a45" stroke-width="2"/><path d="M24 24L37 14" stroke="#9fe6a0" stroke-width="2.5" stroke-linecap="round"/><circle cx="17" cy="29" r="2.6" fill="#ff4636"/><circle cx="30" cy="31" r="2.2" fill="#9fe6a0"/>',
  donut: '<circle cx="24" cy="24" r="17" fill="#d9a35c"/><circle cx="24" cy="24" r="14.5" fill="#f08fb4"/><circle cx="24" cy="24" r="5.5" fill="#12333b"/><path d="M14 18l3 1M30 13l1 3M34 26l-3 1M17 31l2-2M27 34l1-3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  log: '<path d="M11 5h19l8 8v30H11z" fill="#efe8d8" stroke="#8f8876" stroke-width="2"/><path d="M30 5v8h8" fill="#cfc6b0" stroke="#8f8876" stroke-width="2"/><path d="M16 20h16M16 26h16M16 32h10" stroke="#a02c22" stroke-width="2.4" stroke-linecap="round"/>',
};
const APPS = [['term', 'Terminal'], ['tracker', 'Tracker'], ['donut', 'Last Donut'], ['log', 'Incident Log']];

const CSS = `
#secdesk { position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index: 35; display: flex; align-items: center; justify-content: center; background: rgba(3,5,8,.8); color: #d9d4c4; --fs: 13px; font: var(--fs)/1.35 var(--mono, ui-monospace, Menlo, Consolas, monospace); -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
#secdesk[hidden] { display: none; }
body.sd-open #rotate { display: none !important; }
body.bigtext #secdesk { --fs: 16px; }
#secdesk button { font: inherit; color: inherit; cursor: pointer; }
#secdesk .sd-case { position: relative; width: min(1180px, calc(100% - 28px)); height: min(780px, calc(100% - 28px)); box-sizing: border-box; padding: 16px 16px 30px; border-radius: 22px; background: linear-gradient(#d2cab5, #a39a84); box-shadow: 0 0 0 1px #6f6858, 0 30px 80px rgba(0,0,0,.6), inset 0 2px 0 rgba(255,255,255,.4), 0 0 110px rgba(125,255,154,.12); display: flex; }
#secdesk .sd-case::after { content: 'WATCHMAN'; position: absolute; left: 0; right: 0; bottom: 8px; text-align: center; font: 700 10px var(--mono, monospace); letter-spacing: .5em; color: rgba(60,54,40,.7); }
#secdesk .sd-lamp { position: absolute; right: 26px; bottom: 11px; width: 8px; height: 8px; border-radius: 50%; background: #5dff8a; box-shadow: 0 0 8px #5dff8a; }
#secdesk .sd-glass { position: relative; flex: 1; min-width: 0; min-height: 0; border-radius: 10px; overflow: hidden; background: #0c2228; box-shadow: 0 0 0 3px #19191b, 0 0 0 5px rgba(0,0,0,.25); display: flex; flex-direction: column; }
#secdesk .sd-bar { flex: none; display: flex; align-items: center; gap: 12px; height: 30px; padding: 0 4px 0 10px; background: #1d2a44; color: #e2cd94; font-weight: 700; letter-spacing: .1em; font-size: 12px; border-bottom: 2px solid #0e1626; }
#secdesk .sd-bar .sd-host { flex: 1; min-width: 0; font-weight: 400; color: #9fb0d0; letter-spacing: .04em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#secdesk .sd-btn { flex: none; min-width: 30px; height: 22px; padding: 0 9px; background: #c9c3b2; color: #1e2226; font-weight: 700; font-size: 12px; letter-spacing: .06em; border: 2px solid; border-color: #f4eedc #5b5648 #5b5648 #f4eedc; border-radius: 0; }
#secdesk .sd-btn:active { border-color: #5b5648 #f4eedc #f4eedc #5b5648; }
#secdesk .sd-btn:focus-visible, #secdesk .sd-icon:focus-visible, #secdesk .sd-chip:focus-visible { outline: 2px dotted #e2cd94; outline-offset: 1px; }
#secdesk .sd-desk { position: relative; flex: 1; min-height: 0; overflow: hidden; background: radial-gradient(ellipse at 28% 18%, #1b4a54 0%, #0f2c33 55%, #091b20 100%); }
#secdesk .sd-desk::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(45deg, rgba(255,255,255,.018) 0 2px, transparent 2px 9px); }
#secdesk .sd-mark { position: absolute; right: 22px; bottom: 16px; text-align: right; color: rgba(226,205,148,.3); font: 700 22px var(--serif, Georgia, serif); letter-spacing: .22em; text-transform: uppercase; line-height: 1.25; }
#secdesk .sd-mark small { display: block; font: 12px var(--mono, monospace); letter-spacing: .12em; color: rgba(159,230,160,.38); text-transform: none; }
#secdesk .sd-icons { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 12px 10px; width: 104px; box-sizing: border-box; }
#secdesk .sd-icon { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 84px; min-height: 76px; padding: 6px 2px; background: none; border: 1px dotted transparent; border-radius: 3px; color: #efe8d8; font-size: 12px; font-weight: 600; text-shadow: 0 1px 3px #000; }
#secdesk .sd-icon svg { width: 44px; height: 44px; filter: drop-shadow(0 2px 3px rgba(0,0,0,.5)); }
#secdesk .sd-icon:hover, #secdesk .sd-icon:active { background: rgba(255,255,255,.07); border-color: rgba(226,205,148,.6); }
#secdesk .sd-notes { position: absolute; left: 8px; bottom: 10px; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
#secdesk .sd-stick { width: 92px; min-height: 84px; box-sizing: border-box; padding: 12px 8px 8px; background: #f7e36a; color: #1f2b55; font: 15px/1.15 ${HAND}; box-shadow: 2px 4px 8px rgba(0,0,0,.45); transform: rotate(-3deg); background-image: linear-gradient(rgba(0,0,0,.07), rgba(0,0,0,0) 14px); }
#secdesk .sd-stick b { display: block; font-size: 22px; letter-spacing: .04em; margin-top: 2px; }
#secdesk .sd-stick:nth-child(2) { background-color: #ffb8d0; transform: rotate(2.5deg); margin-left: 6px; }
#secdesk .sd-wins { position: absolute; left: 0; right: 0; top: 32px; bottom: 0; pointer-events: none; }
#secdesk .sd-win { position: absolute; left: 112px; right: 12px; top: 10px; bottom: 12px; pointer-events: auto; display: flex; flex-direction: column; background: #c9c3b2; border: 2px solid; border-color: #f4eedc #4a463a #4a463a #f4eedc; box-shadow: 5px 7px 0 rgba(0,0,0,.35); }
#secdesk .sd-win[hidden] { display: none; }
#secdesk .sd-tb { flex: none; display: flex; align-items: center; gap: 8px; height: 26px; padding: 0 3px 0 8px; background: linear-gradient(90deg, #1d2a44, #35558c); color: #f3ead2; font-weight: 700; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
#secdesk .sd-tb span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#secdesk .sd-body { flex: 1; min-height: 0; display: flex; flex-direction: column; margin: 3px; border: 2px solid; border-color: #4a463a #f4eedc #f4eedc #4a463a; background: #04110a; }
#secdesk .sd-out { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 10px 4px; font-size: var(--fs); line-height: 1.42; color: #9fe6a0; white-space: pre-wrap; word-break: break-word; touch-action: pan-y; -webkit-overflow-scrolling: touch; -webkit-user-select: text; user-select: text; text-shadow: 0 0 5px rgba(125,255,154,.28); }
#secdesk .sd-out div { min-height: 1.42em; }
#secdesk .sd-out .e { color: #ff9a80; } #secdesk .sd-out .d { color: #5fa870; } #secdesk .sd-out .h { color: #e2cd94; } #secdesk .sd-out .w { color: #ffc23a; }
#secdesk .sd-out .g { color: #e6ffe8; text-shadow: 0 0 8px rgba(125,255,154,.75); } #secdesk .sd-out .p { color: #cfeed0; }
#secdesk .sd-line { flex: none; display: flex; align-items: center; padding: 2px 10px 6px; color: #e2cd94; font-size: var(--fs); white-space: pre; background: #04110a; }
#secdesk .sd-line input { flex: 1; min-width: 0; margin: 0; padding: 4px 0; background: transparent; -webkit-appearance: none; appearance: none; box-shadow: none; border: 0; outline: 0; border-radius: 0; color: #eaffea; font: inherit; caret-color: #9fe6a0; color-scheme: dark; -webkit-user-select: text; user-select: text; }
.touch #secdesk .sd-line input { font-size: 16px; }
#secdesk .sd-chips { flex: none; display: flex; flex-wrap: wrap; gap: 6px; max-height: 84px; overflow-y: auto; padding: 6px 8px; background: #0a1a12; border-top: 1px solid #1d3a28; touch-action: pan-y; }
#secdesk .sd-chip { flex: none; min-height: 32px; padding: 0 11px; border-radius: 3px; border: 1px solid #2f6a45; background: #0f2a1b; color: #b9ffc4; font-size: var(--fs); font-weight: 600; white-space: nowrap; }
#secdesk .sd-chip:active, #secdesk .sd-chip.on { background: #1d5a36; }
#secdesk .sd-chip.go { border-color: #e2cd94; color: #f7e6b4; }
#secdesk .sd-chip.dim { border-color: #24402e; color: #6fae82; }
.touch #secdesk .sd-chip { min-height: 42px; padding: 0 13px; }
.touch #secdesk .sd-chips { max-height: 100px; }
#secdesk .sd-edbar { flex: none; display: flex; align-items: center; gap: 10px; padding: 4px 8px; background: #c9c3b2; color: #3a362c; font-size: 12px; border-bottom: 1px solid #8f8876; }
#secdesk .sd-edbar i { flex: 1; min-width: 0; font-style: normal; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#secdesk .sd-edbar .ro { padding: 1px 6px; background: #a02c22; color: #fff; font-weight: 700; letter-spacing: .08em; font-size: 11px; }
#secdesk .sd-ed { flex: 1; min-height: 0; overflow: auto; display: flex; align-items: flex-start; background: #efe8d8; color: #1e2226; touch-action: pan-x pan-y; -webkit-overflow-scrolling: touch; }
#secdesk .sd-gut { flex: none; margin: 0; padding: 8px 6px 8px 8px; min-width: 2.2em; text-align: right; color: #8f8876; background: #e0d8c4; border-right: 1px solid #cfc6b0; font: var(--fs)/1.5 var(--mono, monospace); align-self: stretch; }
#secdesk .sd-ed textarea { flex: 1; min-width: 0; margin: 0; padding: 8px 10px; border: 0; outline: 0; resize: none; border-radius: 0; background: transparent; color: inherit; font: var(--fs)/1.5 var(--mono, monospace); white-space: pre; overflow: hidden; -webkit-user-select: text; user-select: text; }
.touch #secdesk .sd-ed textarea:not([readonly]) { font-size: 16px; line-height: 1.5; } .touch #secdesk .sd-ed.rw .sd-gut { font-size: 16px; }
#secdesk .sd-tabs { flex: none; display: flex; flex-wrap: wrap; gap: 6px; padding: 6px 8px; background: #0a1a12; border-bottom: 1px solid #1d3a28; }
#secdesk .sd-tabs .lock { border-color: #7a2a22; color: #ff9a80; }
#secdesk .sd-stage { position: relative; flex: 1; min-height: 0; background: #020a06; }
#secdesk .sd-stage canvas { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: block; touch-action: none; }
#secdesk .sd-key { flex: none; display: flex; flex-wrap: wrap; gap: 4px 14px; padding: 5px 10px; background: #0a1a12; border-top: 1px solid #1d3a28; color: #8fd4a0; font-size: 11px; }
#secdesk .sd-key i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; vertical-align: -1px; }
#secdesk .sd-push { position: absolute; right: 16px; bottom: 16px; width: 92px; height: 92px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); background: rgba(240,143,180,.28); color: #fff; font-weight: 700; font-size: 13px; letter-spacing: .08em; touch-action: none; display: none; }
.touch #secdesk .sd-push { display: block; }
#secdesk .sd-push:active { background: rgba(240,143,180,.6); }
#secdesk .sd-scan { position: absolute; inset: 0; pointer-events: none; z-index: 5; background: repeating-linear-gradient(to bottom, rgba(0,0,0,.13) 0 1px, rgba(0,0,0,0) 1px 3px), radial-gradient(ellipse at center, rgba(0,0,0,0) 62%, rgba(0,0,0,.3) 100%); animation: sdflick 7s linear infinite; }
@keyframes sdflick { 0%, 100% { opacity: 1; } 47% { opacity: 1; } 48% { opacity: .8; } 50% { opacity: 1; } 83% { opacity: .93; } 84% { opacity: 1; } }
@media (max-width: 900px), (max-height: 600px) {
  #secdesk { --fs: 12px; }
  #secdesk .sd-case { width: 100%; height: 100%; border-radius: 0; padding: max(5px, env(safe-area-inset-top)) max(5px, env(safe-area-inset-right)) max(5px, env(safe-area-inset-bottom)) max(5px, env(safe-area-inset-left)); }
  #secdesk .sd-case::after, #secdesk .sd-lamp { display: none; }
  #secdesk .sd-glass { border-radius: 6px; }
  #secdesk .sd-bar { height: 40px; } #secdesk .sd-btn { height: 32px; min-width: 44px; } #secdesk .sd-wins { top: 42px; }
  #secdesk .sd-win { left: 0; right: 0; top: 0; bottom: 0; border-width: 0; box-shadow: none; }
  #secdesk .sd-tb { height: 38px; } #secdesk .sd-body { margin: 0; border-width: 0; }
  #secdesk .sd-icons { flex-direction: row; flex-wrap: wrap; width: auto; padding: 12px; gap: 8px 6px; }
  #secdesk .sd-notes { position: relative; left: 0; bottom: 0; flex-direction: row; padding: 4px 18px; }
  #secdesk .sd-mark { font-size: 15px; right: 12px; bottom: 10px; }
}
@media (max-width: 480px) { #secdesk { --fs: 11.5px; } body.bigtext #secdesk { --fs: 13.5px; } #secdesk .sd-bar .sd-host { display: none; } #secdesk .sd-bar b { flex: 1; } }
@media (max-height: 480px) { #secdesk .sd-chips { max-height: 52px; } #secdesk .sd-mark { display: none; } #secdesk .sd-key { display: none; } }
`;

feature({
  id: 'secdesk',
  secrets: [['secdesk', 'The night shift’s computer'], ['lastdonut', 'The last donut']],

  init(k) {
    this.k = k; this.on = false; this.t = 0; this.vis = false; this.litK = 1; this.clockT = 0; this.liveT = 0; this.liveI = 0;
    const P = k.plan;
    this.save = { clearance: false, seen: [false, false], best: 0, files: {} };
    try { Object.assign(this.save, JSON.parse(localStorage.getItem(KEY) || '{}') || {}); } catch { /* a private window: it lasts the visit */ }
    // The desks the fit-out set down (src/furnish.js), each with the wall of screens in the same room.
    const mine = new Set((P.secDesks || []).map(d => d.room)), walls = (P.marks || []).filter(m => m.kind === 'monitorWall' && mine.has(m.room));      // (the base under the park has monitor walls too: those stay dark)
    const nameOf = id => String((P.byId[id] && P.byId[id].gallery) || id);
    this.desks = (P.secDesks || []).slice().sort((a, b) => (nameOf(a.room) < nameOf(b.room) ? -1 : 1)).map((d, n) => {
      const cx = d.x + DESK_U * d.fz, cz = d.z - DESK_U * d.fx;                    // the middle of the desk, at the wall
      return { ...d, n: n % 2, cx, cz, sx: cx + d.fx * 1.6, sz: cz + d.fz * 1.6 };
    });
    const ids = this.desks.map(d => d.room);
    this.rooms = ids.map(id => ({ id, desk: this.desks.find(d => d.room === id) || null, wall: walls.find(w => w.room === id) || null, H: (P.byId[id] && P.byId[id].h) || 4 }));
    this.ids = ids;
    if (!ids.length) return;
    this.tracker = new Tracker(k.G);
    this.R = dressRooms(this.rooms, { cam17: this._cam17(), clock: this.clock(true) });
    k.group.add(this.R.group);
    // the files, the prompt
    this.fs = new VFS({ store: { get: p => this.save.files[p], set: (p, t) => { this.save.files[p] = t; this._keep(); } }, env: () => ({ desk: this.cur ? this.cur.n + 1 : 1, clock: this.clock(), cam17: this._cam17(), best: this.save.best, clearance: this.fs.clearance, bots: this.tracker.bots().map(b => ({ id: b.id, level: b.level, beat: b.beat })) }) });
    this.fs.clearance = !!this.save.clearance;
    this.term = new Term(this.fs, {
      systems: () => k.G.systems || SYS.systems || null,
      bots: () => this.tracker.bots(), mice: () => this.tracker.mice(), clock: () => this.clock(),
      edit: n => this._edit(n), app: a => this._show(a), exit: () => this._shut('term'), clear: () => { if (this.out) this.out.textContent = ''; },
      read: n => { if (n.f.page && story.add(n.f.page)) this._after.push({ t: '[ A page for the Green Cheese file. ]', c: 'g' }); },
      unlock: () => { this.save.clearance = true; this._keep(); }, seen: () => this.save.seen, sound: (s, r) => this._blip(s, r),
    });
    this._after = [];
    story.enable('nightlog');
    this._onKey = e => this._key(e, true); this._onKeyUp = e => this._key(e, false);
    addEventListener('keydown', this._onKey, true); addEventListener('keyup', this._onKeyUp, true);
  },
  _keep() { try { localStorage.setItem(KEY, JSON.stringify(this.save)); } catch { /* fine */ } },
  _cam17() { const s = this.k.plan.secret; return (s && s.gallery) || 'Gallery 240'; },
  // The night's own clock: it was seven minutes past two when you came in.
  clock(secs) { const G = this.k.G, s = Math.max(0, Math.floor(2 * 3600 + 7 * 60 + (G.t || 0) - (G.startedAt || 0))), c = Math.min(s, 5 * 3600 + 59 * 60 + 59), p = n => String(n).padStart(2, '0'); return `${p(Math.floor(c / 3600))}:${p(Math.floor(c / 60) % 60)}${secs ? ':' + p(c % 60) : ''}`; },

  // ---------------------------------------------------------------- in the building
  active(k) {
    if (!this.R) return false;
    const near = k.inRoom(this.ids, 7);
    if (!near && this.vis) { this.vis = false; this.R.show(-1); }
    return near || this.on;
  },
  update(dt, k) {
    const R = this.R, G = k.G; this.t += dt;
    R.uniforms.uTime.value = this.t % 3600; R.uniforms.uCalm.value = G.set && G.set.reduce ? 1 : 0;
    let n = -1; for (let i = 0; i < this.ids.length; i++) if (k.inRoom(this.ids[i], 7)) n = i;
    R.show(n); this.vis = n >= 0;
    if (n < 0) return;
    const lit = G.lights && G.lights.isOn(this.ids[n]) ? 1 : 0; this.litK += (lit - this.litK) * Math.min(1, dt * 4); R.lit(this.litK);
    if ((this.clockT -= dt) <= 0) { this.clockT = 1; R.clocks(this.clock(true)); }
    if ((this.liveT -= dt) <= 0) {
      // the big screen goes round the levels by itself: the two the robots walk, then down here, then what is under that
      this.liveT = 0.34; const L = this.tracker.levels(), turn = ['1', '2', '1', '2', 'LL', L[0].id][Math.floor(this.t / 7) % 6], level = L.find(l => l.id === turn) || L[1];
      this.tracker.draw(R.live.ctx, LIVE_W, LIVE_H, { level, t: this.t, small: true, clearance: this.fs.clearance });
      R.live.tex.needsUpdate = true;
    }
  },
  near(v, k) {
    if (this.on || !this.R) return null;
    for (const d of this.desks) {
      const dy = v.pos.y - d.y; if (dy < -0.3 || dy > 2.2) continue;
      const dx = v.pos.x - d.sx, dz = v.pos.z - d.sz;
      if (dx * dx + dz * dz > 1.5 * 1.5 || (v.pos.x - d.cx) * d.fx + (v.pos.z - d.cz) * d.fz < 0.9 || Math.hypot(v.vel.x, v.vel.z) > 3) continue;
      const touch = k.G.input && k.G.input.usedTouch;
      return { verb: 'USE', hint: `The night shift’s computer, left logged in. ${touch ? 'USE' : 'E'} to sit down at it.`, card: ['The security desk', 'A computer, left logged in.', 'use it'], act: () => this.open(d) };
    }
    return null;
  },
  spots() { return (this.desks || []).map(d => ({ kind: 'secret', id: 'secdesk', name: `Security desk ${d.n + 1}`, x: d.sx, y: d.y, z: d.sz })); },
  fresh() { if (!this.save) return; this.save.clearance = false; this.save.seen = [false, false]; this.save.files = {}; this._keep(); if (this.fs) this.fs.clearance = false; if (this.term) { this.term.cwd = '/home/nightshift'; this.term.hist = []; this.term.tries = 0; } if (this.out) this.out.textContent = ''; this.booted = false; },

  // ---------------------------------------------------------------- sitting down, and getting up
  open(d) {
    const k = this.k, G = k.G; if (this.on) return;
    this.on = true; this.cur = d; this._dom();
    k.hold(() => {});                                         // the toy stands still; the building does not (the game stays in 'play': the sprinklers, the tests and the robots all carry on)
    this._listen();
    k.find('secdesk');
    if (!this.save.seen[d.n]) { this.save.seen[d.n] = true; this._keep(); }
    this.host.textContent = `SECDESK-0${d.n + 1} · nightshift`;
    this.sticky.innerHTML = ''; this.sticky.append(`CL9 pw`, el('br'), d.n ? '2nd half:' : '1st half:', el('b', '', HALVES[d.n]));
    this.sticky2.textContent = d.n ? 'donut: MINE. (counted)' : 'the red button is NOT a drill';
    for (const w of Object.values(this.W)) w.root.hidden = true; this.stack = [];
    this.root.hidden = false; this.root.style.visibility = ''; document.body.classList.add('sd-open');
    this._fit(); this.root.focus({ preventScroll: true });
    this.keys = {}; this.stick = null; this.last = performance.now();
    this._blip('on');
    try { if (G.tm && G.tm.event) G.tm.event('secdesk', 'desk' + (d.n + 1)); } catch { /* fine */ }
    const frame = now => { if (!this.on) return; requestAnimationFrame(frame); this._frame(now); };
    requestAnimationFrame(frame);
  },
  close() {
    if (!this.on) return;
    this._saveEdit(true); if (this.tune) this.tune.stop(); this._bank();
    this.on = false; this.root.hidden = true; document.body.classList.remove('sd-open');
    if (document.activeElement && this.root.contains(document.activeElement)) document.activeElement.blur();
    this.k.hold(null);
    const cv = document.getElementById('view'); if (cv) cv.focus({ preventScroll: true });
    // A phone turned upright to type on: the game itself is played sideways, so it waits, as it would have when the phone was turned (src/main.js).
    if (matchMedia('(orientation: portrait) and (pointer: coarse) and (max-width: 820px)').matches) { const b = document.querySelector('button[data-act="pause"]'); if (b) b.click(); }
  },
  get top() { return this.stack && this.stack.length ? this.stack[this.stack.length - 1] : null; },
  // Bring a window up ('term', 'tracker', 'donut', 'edit'; 'log' is the incident log in the editor).
  _show(id) {
    if (id === 'log') return this._edit(this.fs.node('/', 'incidents/incident_log.txt'));
    const w = this.W[id]; if (!w) return;
    this.stack = this.stack.filter(q => q !== id); this.stack.push(id);
    for (const [name, q] of Object.entries(this.W)) q.root.hidden = name !== id;
    this._blip('tick');
    if (id === 'term') { this._boot(); this._chips(); this._focusLine(); this.out.scrollTop = this.out.scrollHeight; }
    if (id === 'tracker') { this.view = null; if (!this.level) this.level = this.tracker.levels().find(l => l.id === '1') || this.tracker.levels()[1]; this._tabs(); this.trT = 1; }
    if (id === 'donut') { this._newGame(); }
  },
  _shut(id) {
    if (id === 'edit') this._saveEdit(true);
    if (id === 'donut') { if (this.tune) this.tune.stop(); this._bank(); this.game = null; }
    this.stack = this.stack.filter(q => q !== id); const t = this.top;
    for (const [name, q] of Object.entries(this.W)) q.root.hidden = name !== t;
    this._blip('tick');
    if (t === 'term') this._focusLine(); else if (!t) this.root.focus({ preventScroll: true });
  },
  // Every frame while it is up.
  _frame(now) {
    const G = this.k.G;
    if (G.held || (G.state !== 'play' && G.state !== 'paused')) return this.close();      // caught, or the game has gone somewhere else
    this.root.style.visibility = G.state === 'paused' ? 'hidden' : '';
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    if (G.state === 'paused') { if (this.tune) this.tune.stop(); return; }
    const c = this.clock(); if (c !== this.clockEl.textContent) this.clockEl.textContent = c;
    if (this.top === 'donut') this._donut(dt);
    else if (this.top === 'tracker' && (this.trT += dt) > 0.2) { this.trT = 0; this._tracker(); }
  },
  // The phone's keyboard, when it comes up, takes the bottom of the screen: the computer keeps to what is left.
  _fit() { const vv = window.visualViewport; if (!vv || !this.root) return; const full = Math.abs(vv.height - innerHeight) < 2 && vv.offsetTop < 1; this.root.style.height = full ? '' : vv.height + 'px'; this.root.style.top = full ? '' : vv.offsetTop + 'px'; if (this.out) this.out.scrollTop = this.out.scrollHeight; },

  // ---------------------------------------------------------------- keys
  _key(e, down) {
    if (!this.on || this.k.G.state !== 'play') return;
    if (!down) { if (this.keys) this.keys[e.code] = false; return; }                      // (let-go's go on to the game as well: it must know a key is up)
    e.stopPropagation();                                                                  // nothing typed here drives the toy
    if (e.code === 'Escape') { e.preventDefault(); return this.close(); }
    const top = this.top, typing = e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (top === 'donut') {
      if (/^(Arrow|Key[WASD]$|Space|Enter)/.test(e.code)) { e.preventDefault(); this.keys[e.code] = true; if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) this.kick = true; }
      else if (e.code === 'KeyR' && !e.repeat) this._newGame();
      return;
    }
    if (top === 'term') {
      const inp = this.line;
      if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.key === 'Enter') { e.preventDefault(); this._enter(); }      // (a phone's own keyboard gives the key's name and no code)
      else if (e.code === 'Tab') { e.preventDefault(); const r = this.term.complete(inp.value); if (r.options.length > 1) this._print([{ t: r.options.join('  '), c: 'd' }]); inp.value = r.text; this._chips(); }
      else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') { e.preventDefault(); const h = this.term.hist; if (!h.length) return; this.hi = Math.max(0, Math.min(h.length, (this.hi == null ? h.length : this.hi) + (e.code === 'ArrowUp' ? -1 : 1))); inp.value = h[this.hi] || ''; this._chips(); }
      else if (e.ctrlKey && e.code === 'KeyL') { e.preventDefault(); this.out.textContent = ''; }
      else if (e.ctrlKey && e.code === 'KeyC') { e.preventDefault(); inp.value = ''; this._chips(); }
      else if (typing && document.activeElement !== inp) inp.focus({ preventScroll: true });   // typing anywhere lands on the prompt
      return;
    }
    if (top === 'edit') { if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') { e.preventDefault(); this._saveEdit(false); } return; }
    if (top === 'tracker') {
      const L = this.tracker.levels(), i = L.findIndex(l => l.id === this.level.id), to = /^Digit[1-5]$/.test(e.code) ? +e.code.slice(5) - 1 : e.code === 'ArrowRight' || e.code === 'ArrowUp' ? i + 1 : e.code === 'ArrowLeft' || e.code === 'ArrowDown' ? i - 1 : -1;
      if (L[to]) { e.preventDefault(); this.level = L[to]; this.view = null; this._tabs(); this.trT = 1; }
      return;
    }
    if (!top && /^Digit[1-4]$/.test(e.code)) { e.preventDefault(); this._show(APPS[+e.code.slice(5) - 1][0]); }
  },

  // The building's systems say things later, by themselves (a valve timing out, a fire test ending): G.systems.onEvent
  // (src/systems.js). They are printed in the terminal as they come, as on any building management console; if the
  // terminal has never been opened they are kept for when it is.
  _listen() {
    const S = this.k.G.systems; if (!S || typeof S !== 'object') return;
    this.wired = this.wired || new WeakSet(); if (this.wired.has(S)) return; this.wired.add(S);
    const prev = typeof S.onEvent === 'function' ? S.onEvent : null;
    try { S.onEvent = (...a) => { if (prev) { try { prev(...a); } catch { /* theirs */ } } this._late(a[0]); }; } catch { /* not ours to set */ }
  },
  _late(ev) {
    const lines = typeof ev === 'string' ? [ev] : Array.isArray(ev) ? ev : ev && Array.isArray(ev.lines) ? ev.lines : ev && (ev.line || ev.text || ev.message) ? [ev.line || ev.text || ev.message] : [];
    if (!lines.length) return;
    const out = lines.map(t => ({ t: String(t), c: ev && ev.ok === false ? 'w' : 'h' }));
    if (!this.out || !this.booted) { this.lateBuf = (this.lateBuf || []).concat(out).slice(-20); return; }
    this._print(out); if (this.on && this.top === 'term') this._blip('key');
  },

  // ---------------------------------------------------------------- the terminal
  _boot() {
    if (this.booted) return; this.booted = true;
    this._print([{ t: `WATCHMAN 4.1 · SECDESK-0${this.cur.n + 1} · night profile`, c: 'h' }, { t: 'Last login: tonight 22:00, from this chair.', c: 'd' }, { t: 'You have 3 mails. None of them is good news.', c: 'd' }, { t: '' }, { t: `Type  help.  Or ${document.body.classList.contains('touch') ? 'tap' : 'click'} one of the words below.` }, { t: '' }]);
    if (this.lateBuf && this.lateBuf.length) this._print(this.lateBuf.splice(0));
  },
  _print(lines) {
    const o = this.out, f = document.createDocumentFragment();
    for (const l of lines) f.append(el('div', l.c || '', l.t));
    o.append(f); while (o.childElementCount > 400) o.firstChild.remove();
    o.scrollTop = o.scrollHeight;
  },
  _focusLine() { if (!document.body.classList.contains('touch')) this.line.focus({ preventScroll: true }); },      // (on glass the keyboard only comes when the line itself is tapped)
  async _enter(text) {
    if (this.busy) return;
    this._listen();
    const T = this.term, line = text != null ? text : this.line.value, secret = T.mode === 'password';
    this.line.value = ''; this.hi = null;
    this._print([{ t: T.prompt + (secret ? '•'.repeat(line.length) : line), c: 'p' }]);
    this.busy = true; let out;
    try { out = await T.run(line); } catch (e) { out = [{ t: 'The computer has had a turn. Try again.', c: 'e' }]; console.error('secdesk', e); }
    this.busy = false;
    if (!this.on) return;
    this._print(out.concat(this._after.splice(0)));
    this.prompt.textContent = T.prompt; this.line.type = T.mode === 'password' ? 'password' : 'text';
    this._chips(); if (this.top === 'term') this._focusLine();
  },
  _chips() {
    const box = this.chips, list = this.term.chips(this.line.value); box.textContent = '';
    for (const c of list.slice(0, 40)) {
      const b = el('button', 'sd-chip' + (c.label === 'enter' ? ' go' : c.label === 'rub out' || c.label === 'cancel' ? ' dim' : ''), c.label === 'enter' ? '⏎ enter' : c.label); b.type = 'button';
      b.addEventListener('click', () => { this._blip('key'); if (c.run) this._enter(c.text); else { this.line.value = c.text; this._chips(); this._focusLine(); } });
      box.append(b);
    }
    this.out.scrollTop = this.out.scrollHeight;                 // (the row may have grown a line, and pushed the last of the output out of sight)
  },

  // ---------------------------------------------------------------- the editor
  _edit(node) {
    if (!node || node.dir) return;
    this._saveEdit(true);
    const E = this.E, can = !!node.f.edit; this.editing = node; this.dirty = false;
    E.title.textContent = `${node.name} · editor`; E.path.textContent = node.path; E.ro.hidden = can; E.save.hidden = !can; E.state.textContent = can ? '' : 'You may look.';
    E.text.readOnly = !can; E.text.value = this.fs.read(node).replace(/\n$/, ''); E.wrap.classList.toggle('rw', can);
    this._show('edit'); this._gutter(); E.wrap.scrollTop = 0; E.wrap.scrollLeft = 0;
    if (can && !document.body.classList.contains('touch')) E.text.focus({ preventScroll: true });
  },
  _gutter() { const E = this.E, n = E.text.value.split('\n').length; E.gut.textContent = Array.from({ length: n }, (q, i) => i + 1).join('\n'); E.text.style.height = 'auto'; E.text.style.height = E.text.scrollHeight + 'px'; },
  _saveEdit(quiet) {
    const n = this.editing; if (!n || !n.f.edit || !this.dirty) { if (!quiet && n && n.f.edit) this.E.state.textContent = `Nothing to save. ${this.clock()}`; return; }
    this.fs.write(n, this.E.text.value + '\n'); this.dirty = false; this.E.state.textContent = `Saved at ${this.clock()}.`; if (!quiet) this._blip('ok');
  },

  // ---------------------------------------------------------------- the tracker
  _tabs() {
    const box = this.T.tabs, bots = this.tracker.bots(), L = this.tracker.levels();
    if (box.childElementCount !== L.length) {
      box.textContent = '';
      for (const l of L) { const b = el('button', 'sd-chip' + (l.restricted ? ' lock' : '')); b.type = 'button'; b.addEventListener('click', () => { this.level = l; this.view = null; this._tabs(); this.trT = 1; this._blip('key'); }); box.append(b); }
    }
    L.forEach((l, i) => { const b = box.children[i], n = bots.filter(q => q.level === l.id).length, text = l.restricted ? `${l.name} 9` : `${l.name}${n ? ' \u00b7 ' + n : ''}`; if (b.textContent !== text) b.textContent = text; b.classList.toggle('on', l.id === this.level.id); });
  },
  _size(cv) { const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight; if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); } return { w, h, dpr }; },
  _tracker() {
    const cv = this.T.cv, { w, h, dpr } = this._size(cv); if (!w || !h) return;
    this.tracker.draw(cv.getContext('2d'), w, h, { level: this.level, t: performance.now() / 1000, view: this.view, clearance: this.fs.clearance, dpr });
    if (Math.floor(this.t) !== this.tabT) { this.tabT = Math.floor(this.t); this._tabs(); }
  },

  // ---------------------------------------------------------------- the donut game
  _newGame() {
    const k = this.k;
    if (!this.arena) this.arena = new Arena(arenaFrom(k.plan));
    if (!this.tune) this.tune = new Tune(k.synth);
    this._bank(); this.tune.stop();
    this.game = new LastDonut(this.arena, { start: this.cur.room, best: this.save.best }); this.kick = false; this.stick = null;
  },
  _bank() { const g = this.game; if (g && g.score > this.save.best) { this.save.best = g.score; this._keep(); } },
  _donut(dt) {
    const g = this.game, K = this.keys, cv = this.D.cv, { w, h, dpr } = this._size(cv); if (!g || !w) return;
    let x = (K.ArrowRight || K.KeyD ? 1 : 0) - (K.ArrowLeft || K.KeyA ? 1 : 0), y = (K.ArrowDown || K.KeyS ? 1 : 0) - (K.ArrowUp || K.KeyW ? 1 : 0);
    if (this.stick) { x += this.stick.x; y += this.stick.y; }
    const kick = this.kick; this.kick = false;
    if (g.over) { if (kick && g.st > 1) this._newGame(); }
    else if (g.state === 'title') { if (kick || this.stick) g.begin(); }
    (this.game || g).update(dt, { x, y, kick });
    const G2 = this.game, c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); G2.draw(c, w, h);
    for (const f of G2.fx.splice(0)) this._blip('donut:' + f);
    if (G2.caught) this.k.find('lastdonut');
    if (G2.over && !this.banked) { this.banked = true; this._bank(); } else if (!G2.over) this.banked = false;
    this.tune.tick(G2.tempo);
  },

  // ---------------------------------------------------------------- sounds, small ones
  _blip(name, r) {
    const s = this.k.synth; if (typeof name === 'function') { try { name(); } catch { /* theirs */ } return; }
    const N = (f, d, o) => s.note(f, d, o);
    switch (name) {
      case 'on': N(220, 0.5, { type: 'sine', vol: 0.03 }); N(880, 0.09, { type: 'square', vol: 0.012, at: 0.12 }); break;
      case 'tick': s.noise(0.03, { vol: 0.03, lp: 3200 }); break;
      case 'key': s.noise(0.02, { vol: 0.025, lp: 4200 }); break;
      case 'ok': N(880, 0.08, { type: 'square', vol: 0.014 }); N(1320, 0.1, { type: 'square', vol: 0.012, at: 0.07 }); break;
      case 'no': N(150, 0.22, { type: 'square', vol: 0.02 }); break;
      case 'unlock': [523, 659, 784, 1047].forEach((f, i) => N(f, 0.5, { type: 'sine', vol: 0.04, at: i * 0.11 })); break;
      case 'motif': { let at = 0.2; for (const n of MOTIF) { N(hz(n.midi - 12), n.beats * 0.5, { type: 'sine', vol: 0.05, at }); at += n.beats * 0.36; } break; }      // from below, the call
      case 'donut:start': [392, 523, 659].forEach((f, i) => N(f, 0.12, { type: 'square', vol: 0.02, at: i * 0.08 })); break;
      case 'donut:kick': s.noise(0.09, { vol: 0.05, lp: 900 }); N(170, 0.1, { type: 'triangle', vol: 0.04 }); break;
      case 'donut:wallkick': s.noise(0.12, { vol: 0.07, lp: 700 }); N(120, 0.14, { type: 'triangle', vol: 0.06 }); N(660, 0.08, { type: 'square', vol: 0.016, at: 0.05 }); break;
      case 'donut:bonk': N(105, 0.14, { type: 'square', vol: 0.03 }); s.noise(0.06, { vol: 0.04, lp: 1200 }); break;
      case 'donut:coffee': [660, 880, 1320].forEach((f, i) => N(f, 0.16, { type: 'sine', vol: 0.04, at: i * 0.05 })); break;
      case 'donut:squeak': N(2600, 0.05, { type: 'sine', vol: 0.03 }); N(3100, 0.05, { type: 'sine', vol: 0.03, at: 0.06 }); break;
      case 'donut:mouse': N(2300, 0.04, { type: 'sine', vol: 0.012 }); break;
      case 'donut:latch': N(1900, 0.05, { type: 'sine', vol: 0.02 }); N(1500, 0.06, { type: 'sine', vol: 0.02, at: 0.05 }); break;
      case 'donut:bite': N(240, 0.06, { type: 'square', vol: 0.03 }); N(190, 0.07, { type: 'square', vol: 0.03, at: 0.08 }); break;
      case 'donut:catch': [523, 659, 784, 1047, 1319].forEach((f, i) => N(f, 0.3, { type: 'triangle', vol: 0.05, at: i * 0.07 })); break;
      case 'donut:radio': s.noise(0.18, { vol: 0.05, lp: 2600 }); N(700, 0.12, { type: 'square', vol: 0.025, at: 0.18 }); N(520, 0.16, { type: 'square', vol: 0.025, at: 0.32 }); break;
      case 'donut:tick': N(990, 0.05, { type: 'square', vol: 0.02 }); break;
      case 'donut:over': [392, 330, 262, 196].forEach((f, i) => N(f, 0.3, { type: 'triangle', vol: 0.05, at: i * 0.16 })); break;
      default: if (r && r.ok === false) this._blip('no'); else if (r) this._blip('ok');      // a system's own sound, by a name not known here
    }
  },

  // ---------------------------------------------------------------- the page, built the first time it is wanted
  _dom() {
    if (this.root) return;
    document.head.append(Object.assign(document.createElement('style'), { textContent: CSS }));
    const root = this.root = el('section'); root.id = 'secdesk'; root.hidden = true; root.tabIndex = -1; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'The security desk’s computer');
    const box = el('div', 'sd-case'), glass = el('div', 'sd-glass');
    const bar = el('header', 'sd-bar'); this.host = el('span', 'sd-host'); this.clockEl = el('span', 'sd-clock', this.clock());
    const leave = el('button', 'sd-btn', 'LEAVE ✕'); leave.type = 'button'; leave.addEventListener('click', () => this.close());
    bar.append(el('b', '', 'WATCHMAN 4.1'), this.host, this.clockEl, leave);
    const desk = el('div', 'sd-desk'), icons = el('div', 'sd-icons');
    for (const [id, name] of APPS) { const b = el('button', 'sd-icon'); b.type = 'button'; b.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true">${ICON[id]}</svg>`; b.append(el('span', '', name)); b.addEventListener('click', () => this._show(id)); icons.append(b); }
    const notes = el('div', 'sd-notes'); this.sticky = el('div', 'sd-stick'); this.sticky2 = el('div', 'sd-stick'); notes.append(this.sticky, this.sticky2);
    const mark = el('div', 'sd-mark'); mark.append('Museum Security', el('small', '', 'night desk · do not switch off'));
    desk.append(mark, icons, notes);
    const wins = el('div', 'sd-wins'); this.W = {};
    const win = (id, title) => {
      const w = el('div', 'sd-win'), tb = el('div', 'sd-tb'), name = el('span', '', title), x = el('button', 'sd-btn', '✕'), body = el('div', 'sd-body');
      x.type = 'button'; x.setAttribute('aria-label', 'Close ' + title); x.addEventListener('click', () => this._shut(id));
      tb.append(name, x); w.append(tb, body); w.hidden = true; wins.append(w); this.W[id] = { root: w, body, name }; return body;
    };
    // the terminal
    { const b = win('term', 'Terminal'); this.out = el('div', 'sd-out'); this.out.setAttribute('role', 'log'); this.out.setAttribute('aria-live', 'polite');
      const row = el('label', 'sd-line'); this.prompt = el('span', '', this.term.prompt); this.line = el('input'); Object.assign(this.line, { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: false, enterKeyHint: 'go' }); this.line.setAttribute('autocorrect', 'off'); this.line.setAttribute('aria-label', 'Command');
      this.line.addEventListener('input', () => this._chips());
      row.append(this.prompt, this.line); this.chips = el('div', 'sd-chips'); b.append(this.out, row, this.chips); }
    // the editor
    { const b = win('edit', 'Editor'), barE = el('div', 'sd-edbar'), wrap = el('div', 'sd-ed'), gut = el('pre', 'sd-gut'), text = el('textarea');
      const save = el('button', 'sd-btn', 'SAVE'), ro = el('span', 'ro', 'READ ONLY'), path = el('i'), state = el('span'); save.type = 'button';
      Object.assign(text, { spellcheck: false, autocapitalize: 'off', wrap: 'off' }); text.setAttribute('aria-label', 'The file');
      text.addEventListener('input', () => { this.dirty = true; this.E.state.textContent = 'Not saved.'; this._gutter(); });
      save.addEventListener('click', () => this._saveEdit(false));
      barE.append(save, ro, path, state); wrap.append(gut, text); b.style.background = '#efe8d8'; b.append(barE, wrap);
      this.E = { title: this.W.edit.name, path, state, ro, save, gut, text, wrap }; }
    // the tracker
    { const b = win('tracker', 'Tracker · live'), tabs = el('div', 'sd-tabs'), stage = el('div', 'sd-stage'), cv = el('canvas'), key = el('div', 'sd-key');
      for (const [col, name] of [['#7dffa0', 'robot'], ['#ffc23a', 'alert'], ['#ff4636', 'pursuit'], ['#b8ffcc', 'mouse'], ['#ffe08a', 'you']]) { const s = el('span'); const i = el('i'); i.style.background = col; s.append(i, name); key.append(s); }
      key.append(el('span', '', '◇ unknown contact'), el('span', '', '◌ on a wet floor'), el('span', '', 'tap the plan to look closer'));
      cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(), p = this.tracker.at(e.clientX - r.left, e.clientY - r.top); this.view = this.view || !p || this.level.restricted ? null : { cx: p.x, cz: p.z, zoom: 2.6 }; this.trT = 1; });
      stage.append(cv); b.append(tabs, stage, key); this.T = { tabs, cv }; }
    // the game
    { const b = win('donut', 'Last Donut'), stage = el('div', 'sd-stage'), cv = el('canvas'), push = el('button', 'sd-push', 'PUSH OFF'); push.type = 'button'; stage.style.background = '#090b10';
      let id = null, ox = 0, oy = 0;
      cv.addEventListener('pointerdown', e => { id = e.pointerId; ox = e.clientX; oy = e.clientY; this.stick = { x: 0, y: 0 }; try { cv.setPointerCapture(id); } catch { /* fine */ } const g = this.game; if (g && g.over && g.st > 1) this.kick = true; });
      cv.addEventListener('pointermove', e => { if (e.pointerId !== id || !this.stick) return; let dx = (e.clientX - ox) / 46, dy = (e.clientY - oy) / 46; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; ox = e.clientX - dx * 46; oy = e.clientY - dy * 46; } this.stick.x = dx; this.stick.y = dy; });
      for (const ev of ['pointerup', 'pointercancel']) cv.addEventListener(ev, e => { if (e.pointerId === id) { id = null; this.stick = null; } });
      push.addEventListener('pointerdown', () => { this.kick = true; });
      cv.addEventListener('contextmenu', e => e.preventDefault());
      stage.append(cv, push); b.append(stage); this.D = { cv }; }
    glass.append(bar, desk, wins, el('i', 'sd-scan')); box.append(glass, el('i', 'sd-lamp')); root.append(box); document.body.append(root);
    if (window.visualViewport) { const fit = () => { if (this.on) this._fit(); }; window.visualViewport.addEventListener('resize', fit); window.visualViewport.addEventListener('scroll', fit); }
  },
});
