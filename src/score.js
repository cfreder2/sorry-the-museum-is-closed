// Art is the goal. This keeps count of it three ways:
//
//   views       how many times you have looked at each work (LOOK, or a Stunt Look), and, when the
//               server can be asked, how many times everybody has;
//   Art Score   a little for a look, more for a work never seen before, most for a Stunt Look;
//   Stunt Looks a work clearly in view and close by while the car is in the air, or while either
//               toy goes through a hoop. Worth more in slow motion, more for a new work, and more
//               again for each further work in the same air.
//
// Nothing here detects a jump, a trick, a hoop or slow motion for itself: main.js tells it what the
// car, the hoops and the slow motion are already doing.

const VIEWS = 'after-hours.views', SCORE = 'after-hours.score', ALL = 'after-hours.views.all';

export const POINTS = {
  look: 10,          // looking closer at a work
  fresh: 50,         // a work seen for the first time, however it was seen
  jump: 100,         // Stunt Look bases, by what the car was doing
  air: 200,          //   more than 1.1 seconds off the ground
  trick: 300,        //   a flip or a spin, landed
  hoop: 400,         //   through a hoop
  bullet: 2,         // multipliers: in slow motion
  unseen: 2,         //   a work never seen before
  perfect: 1.5,      //   a perfect landing
  crash: 0.5,        //   wrong way up
};
const BIG_AIR = 1.1, GAP = 0.6;      // seconds: big air; between two works in one air
const CAUGHT = 'after-hours.caught';      // works a Stunt Look has caught: each scores once a game, not again on every pass
const KIND = { jump: 'JUMP', air: 'BIG AIR', trick: 'TRICK', hoop: 'HOOP' };

export class Score {
  constructor({ tm, onCatch, onCall }) {
    this.tm = tm;
    this.onCatch = onCatch || (() => {});            // (art) a Stunt Look has caught a work: see it, note it
    this.onCall = onCall || (() => {});              // (lines, big) say so in the middle of the screen
    this.views = {};
    this.s = { score: 0, looks: 0, stunts: 0, bullet: 0, combo: 0, best: 0 };
    this.all = null; this.allAt = 0; this._asking = null;      // everybody's counts, when they can be had
    this.run = null;                                 // the air the car is in now
    this.caught = new Set();                         // work ids a Stunt Look has already scored this game
    this.looked1 = new Set();                        // work ids whose closer look has scored this game
    this.clock = 0;
    try {
      const v = localStorage.getItem(VIEWS);
      if (v) this.views = JSON.parse(v) || {};
      else {
        // A game saved before views were counted: every work in the notebook has been looked at once.
        for (const w of JSON.parse(localStorage.getItem('after-hours.seen') || '[]')) if (w && w.id) this.views[w.id] = 1;
        if (Object.keys(this.views).length) localStorage.setItem(VIEWS, JSON.stringify(this.views));
      }
      Object.assign(this.s, JSON.parse(localStorage.getItem(SCORE) || '{}'));
      const c = JSON.parse(localStorage.getItem(CAUGHT) || '{}'); this.caught = new Set(c.stunt || []); this.looked1 = new Set(c.look || []);
      const a = JSON.parse(localStorage.getItem(ALL) || 'null');
      if (a && a.at && Date.now() - a.at < 3600e3 && a.n) { this.all = new Map(Object.entries(a.n).map(([k, n]) => [+k, n])); this.allAt = a.at; }
    } catch { /* no storage */ }
    if (!this.views || typeof this.views !== 'object' || Array.isArray(this.views)) this.views = {};      // (a record of another shape: every look threw as it was counted)
    for (const k in this.s) if (!Number.isFinite(this.s[k])) this.s[k] = 0;
  }

  _save() {
    clearTimeout(this._t);
    this._t = setTimeout(() => { try { localStorage.setItem(VIEWS, JSON.stringify(this.views)); localStorage.setItem(SCORE, JSON.stringify(this.s)); localStorage.setItem(CAUGHT, JSON.stringify({ stunt: [...this.caught], look: [...this.looked1] })); } catch { /* fine */ } }, 400);
  }
  /** A new game: the score and its tallies go; how often you have looked at each work is kept. */
  reset() { this.s = { score: 0, looks: 0, stunts: 0, bullet: 0, combo: 0, best: 0 }; this.run = null; this.caught.clear(); this.looked1.clear(); this._save(); }

  get score() { return this.s.score; }
  add(n) { this.s.score += Math.round(n); this._save(); }
  viewsOf(id) { return this.views[id] || 0; }
  /** How many different works you have looked at closely. Driving past one does not count. */
  get looked() { let n = 0; for (const k in this.views) if (this.views[k] > 0 && k !== '0') n++; return n; }
  get totalViews() { let n = 0; for (const k in this.views) n += this.views[k]; return n; }

  // ---- views ----
  _view(work, stunt) {
    this.views[work.id] = (this.views[work.id] || 0) + 1;
    this._save();
    // Everybody's count: told to the server, which answers with the new total.
    const p = this.tm && this.tm.view ? this.tm.view(work.id, work.t, stunt) : null;
    if (p) p.then(n => { if (Number.isFinite(n) && n > 0) { if (!this.all) this.all = new Map(); this.all.set(work.id, n); } });
  }
  /** Looking closer at a work. */
  // Each look is counted (how often you, and everybody, have looked at it), but it scores once a game: looking again is not more credit.
  look(art) { const id = art.work.id, first = !this.views[id]; this._view(art.work, false); if (this.looked1.has(id)) return; this.looked1.add(id); this._save(); this.s.looks++; this.add(POINTS.look + (first ? POINTS.fresh : 0)); }      // the first look at a work is worth more; driving past one is worth nothing
  /** A work seen for the first time, by any means. */
  fresh() { this.add(POINTS.fresh); }

  /** How many times everybody has looked at this, or null if that cannot be known just now. Asked for once an hour at most. */
  async everyone(id) {
    if (!this.tm || !this.tm.topViews) return null;
    if ((!this.all || Date.now() - this.allAt > 3600e3) && Date.now() - (this._tried || 0) > 600e3) {
      if (!this._asking) this._asking = this.tm.topViews(2000).then(rows => {
        this._asking = null;
        if (!rows) { this._tried = Date.now(); return; }             // no answer: not asked again for ten minutes
        const m = new Map(); for (const r of rows) if (r && Number.isFinite(+r.artwork_id)) m.set(+r.artwork_id, +r.views || 0);
        if (this.all) for (const [k, n] of this.all) if ((m.get(k) || 0) < n) m.set(k, n);
        this.all = m; this.allAt = Date.now();
        try { localStorage.setItem(ALL, JSON.stringify({ at: this.allAt, n: Object.fromEntries(m) })); } catch { /* fine */ }
      }).catch(() => { this._asking = null; this._tried = Date.now(); });
      await this._asking;
    }
    return this.all && this.all.has(id) ? this.all.get(id) : null;
  }
  /** The line on a work's label. */
  yours(id) { const n = this.viewsOf(id); return n === 1 ? 'You have looked at this once' : `You have looked at this ${n} times`; }

  // ---- Stunt Looks ----
  /** The work a toy in the air here is plainly looking at, if any: the test LOOK uses, loosened for speed and height. */
  spot(museum, v, roomId, skip) {
    const s = museum.rooms[roomId];
    if (!s) return null;
    const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
    let best = null, score = Infinity;
    for (const a of s.arts) {
      if (skip && skip(a)) continue;
      const dx = a.x - v.pos.x, dz = a.z - v.pos.z, d = Math.hypot(dx, dz) || 1e-6;
      const reach = (a.mini || a.obj ? 3.2 : 5.5 + a.w * 0.6) * 1.15;                // a little further off than you would park
      if (d > reach || Math.abs(v.pos.y - (a.fy || 0)) > 4.5) continue;             // and from higher up
      // Clearly in view: from in front of it, not edge-on along its wall. (A thing in a case is seen from all round.)
      if (!a.obj && Number.isFinite(a.nx) && -(dx * a.nx + dz * a.nz) / d < 0.5) continue;
      const ahead = (dx * fx + dz * fz) / d;
      const sc = d - ahead * 1.1;                                                   // the car may be pointing anywhere by now
      if (sc < score) { score = sc; best = a; }
    }
    return best;
  }

  _free(a) { return !this.caught.has(a.work.id) && !(this.run && this.run.got.some(g => g.art === a)); }
  _catch(a, bullet) {
    const fresh = !a.seen;
    this.caught.add(a.work.id); this._save();
    this.onCatch(a, fresh);                              // a Stunt Look scores, but only a deliberate look is counted as a view
    return { art: a, bullet, fresh };
  }
  _worth(type, got, landed) {
    let base = POINTS[type];
    if (landed && landed.perfect) base *= POINTS.perfect;
    if (landed && landed.crash) base *= POINTS.crash;
    let total = 0;
    got.forEach((g, i) => { total += base * (g.bullet ? POINTS.bullet : 1) * (g.fresh ? POINTS.unseen : 1) * (i + 1); });
    return Math.round(total / 5) * 5;
  }
  _settle(type, got, landed) {
    if (!got.length) return 0;
    const pts = this._worth(type, got, landed), n = got.length;
    this.s.stunts += n; this.s.combo = Math.max(this.s.combo, n); this.s.best = Math.max(this.s.best, pts);
    if (got.some(g => g.bullet)) this.s.bullet++;
    this.add(pts);
    const tags = [KIND[type], got.some(g => g.bullet) ? 'BULLET TIME' : '', got.some(g => g.fresh) ? 'NEW' : '', landed && landed.perfect ? 'PERFECT' : ''].filter(Boolean).join(' · ');
    this.onCall({ head: n > 1 ? `STUNT LOOK ×${n}` : 'STUNT LOOK', title: n > 1 ? `${n} works in one air` : got[0].art.work.t, tags, pts }, true);
    if (this.tm) this.tm.event('stunt', got[0].art.work.id, { n, type, pts, bullet: got.some(g => g.bullet) });
    return pts;
  }

  /**
   * Once a frame while driving. `v` is the toy; `dt` game time (already slowed in slow motion);
   * `bullet` is whether slow motion has hold of this air.
   */
  update(museum, v, dt, roomId, bullet) {
    this.clock += dt;
    if (v.kind !== 'car') { this.run = null; return; }
    if (v.air && !v.rail) {
      const A = this.run || (this.run = { t: 0, got: [], last: -9, hoop: false });
      A.t += dt;
      // A hop off the flat is only a stunt at speed, or with a trick going; off a ramp or a drop it always is.
      const sp = Math.hypot(v.vel.x, v.vel.z);
      const stunt = A.t >= 0.25 && (!v.fromHop || sp >= 3.5 || Math.abs(v.flip) > 1.2 || Math.abs(v.spin) > 1.2 || A.hoop);
      if (stunt && A.t - A.last >= GAP) {
        const a = this.spot(museum, v, roomId, x => !this._free(x));
        if (a) {
          A.got.push(this._catch(a, !!bullet)); A.last = A.t;
          this.onCall({ head: A.got.length > 1 ? `STUNT LOOK ×${A.got.length}` : 'STUNT LOOK', title: a.work.t, tags: '', pts: 0 }, false);
        }
      }
    } else if (this.run) {
      const A = this.run, l = v.landed;
      this.run = null;
      const type = A.hoop ? 'hoop' : l && !l.crash && (l.flips || l.spins) ? 'trick' : (l ? l.air : A.t) >= BIG_AIR ? 'air' : 'jump';
      this._settle(type, A.got, l);
    }
  }

  /** Either toy has just gone through a hoop. In the air it lifts the whole air to a hoop's worth; otherwise it is a Stunt Look on its own. */
  hoop(museum, v, roomId) {
    if (v.kind === 'car' && this.run) { this.run.hoop = true; this.run.last = -9; return; }
    const a = this.spot(museum, v, roomId, x => !this._free(x));
    if (a) this._settle('hoop', [this._catch(a, false)], null);
  }
  /** The toy was swapped or the game left in mid-air: what was caught still counts, as a plain jump. */
  flush() { if (this.run) { const A = this.run; this.run = null; this._settle(A.hoop ? 'hoop' : 'jump', A.got, null); } }
}
