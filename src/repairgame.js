// The conservation line: the rules, and nothing but the rules. No page, no canvas, no three.js, so
// they can be run and tested in node. src/repair.js draws them and feeds them fingers.
//
// Paintings ride a belt from left to right. Each has blemishes; touch one and it is repaired. A
// blemish still there when it reaches the far end of the belt is missed, and a touch that lands on
// nothing is a stray dab. Both are errors.
//
//   accuracy = repaired / (repaired + missed + stray dabs)
//
// Once ten blemishes have been resolved (repaired or missed), the shift ends the moment accuracy is
// under 90%. There is nothing to win: every repair makes the belt run faster (speedAt), puts more
// blemishes on the next painting (blemishesAt) and closes the paintings up (gapAt). The first ten
// seconds are slow, with one blemish and then two, so the idea can be picked up.
//
// Lengths are in the belt's own units: the picture is 540 high and as wide as the screen makes it.
// The score is the number of blemishes repaired in the shift; paintings sent out spotless are
// counted as well, for the notice at the end.

export const H = 540;            // the height of the picture, in units
export const CY = 262;           // the height of the middle of the belt
export const FRAME = 16;         // how thick a frame is
export const EXIT = 44;          // the hood at the far end: a blemish that gets this close to the edge has gone
export const TEACH = 10;         // seconds of easy start
export const NEED = 10;          // blemishes resolved before anybody looks at your accuracy
export const KINDS = ['scratch', 'flake', 'tear', 'speck', 'stain', 'varnish'];
const RADIUS = { scratch: 20, flake: 17, tear: 21, speck: 14, stain: 23, varnish: 24 };

/** Belt speed, units a second, after n repairs: 70 to start, most of the way to 310 by fifty, and never quite level. */
export function speedAt(n) { return 70 + 240 * (1 - Math.exp(-n / 45)) + 0.6 * n; }
/** Blemishes on a new painting after n repairs (a fraction is a chance of one more), six at most. */
export function blemishesAt(n) { return Math.min(6, 1.5 + n / 18); }
/** The clear belt between one painting and the next after n repairs. */
export function gapAt(n) { return Math.max(70, 240 - 2.2 * n); }
/** Repairs over everything that counted. With nothing yet counted, 1. */
export function accuracy(repaired, missed, stray) { const all = repaired + missed + stray; return all ? repaired / all : 1; }
/** Is the shift over? At least NEED blemishes resolved, and accuracy under 90% (in whole numbers, so 9 in 10 is exactly a pass). */
export function shiftOver(repaired, missed, stray) { return repaired + missed >= NEED && repaired * 10 < (repaired + missed + stray) * 9; }

function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export class RepairGame {
  /**
   * width: how long the belt is, in units. minHit: the least radius a touch is allowed to land
   * within (the page sets it so a blemish is never a smaller target than a fingertip).
   * source(i): what the i-th painting is, { aspect, ... }; whatever it returns is kept on the painting as `src`.
   */
  constructor(o = {}) {
    this.W = o.width || 960; this.minHit = o.minHit || 30; this.rnd = rng(o.seed == null ? 1 : o.seed); this.source = o.source || null;
    this.t = 0; this.travel = 0;
    this.repaired = 0; this.missed = 0; this.stray = 0; this.spotless = 0; this.sent = 0;
    this.paintings = []; this.fx = []; this.over = false; this.serial = 0; this.sel = null;
    this._spawn(true);
  }
  get score() { return this.repaired; }
  get resolved() { return this.repaired + this.missed; }
  get accuracy() { return accuracy(this.repaired, this.missed, this.stray); }
  get teaching() { return this.t < TEACH; }
  get speed() { const s = speedAt(this.repaired); return this.teaching ? Math.min(80, s * 0.8) : s; }
  summary() { return { repaired: this.repaired, missed: this.missed, stray: this.stray, paintings: this.spotless, accuracy: this.accuracy, score: this.score, time: this.t }; }

  _spawn(first) {
    const r = this.rnd, src = this.source ? this.source(this.serial) : null;
    const aspect = Math.max(0.6, Math.min(1.7, (src && src.aspect) || 0.7 + r() * 0.8));
    let h = 204 + r() * 52, ch = h - 2 * FRAME, cw = ch * aspect;
    if (cw > 400) { cw = 400; ch = cw / aspect; h = ch + 2 * FRAME; }
    const w = cw + 2 * FRAME;
    const p = { id: this.serial++, x: first ? Math.min(110, this.W * 0.1) : -w, y: CY - h / 2, w, h, f: FRAME, src, blemishes: [], left: 0, lost: 0, complete: false, born: this.t };
    // How many: one, then two, while the idea is being picked up; after that, by how much has been repaired.
    const want = blemishesAt(this.repaired);
    let n = first ? 1 : this.teaching ? Math.min(2, Math.round(want)) : Math.floor(want) + (r() < want % 1 ? 1 : 0);
    n = Math.max(1, Math.min(n, Math.floor(cw * ch / 7000)));
    for (let i = 0; i < n; i++) {
      const kind = KINDS[Math.floor(r() * KINDS.length) % KINDS.length], rad = RADIUS[kind], m = FRAME + rad + 4;
      for (let k = 0; k < 40; k++) {
        const dx = m + r() * (w - 2 * m), dy = m + r() * (h - 2 * m);
        if (p.blemishes.some(b => Math.hypot(b.dx - dx, b.dy - dy) < 62)) continue;
        p.blemishes.push({ id: p.id + ':' + i, kind, dx, dy, r: rad, seed: Math.floor(r() * 1e6), fixed: false, missed: false, at: -9 });
        break;
      }
    }
    p.left = p.blemishes.length;
    this.paintings.push(p);
    return p;
  }

  /** One step of the belt. What happened is left in `fx` for whoever is drawing: { type, x, y, ... }. */
  update(dt) {
    if (this.over || !(dt > 0)) return;
    this.t += dt;
    const move = this.speed * dt, edge = this.W - EXIT;
    this.travel += move;
    for (const p of this.paintings) {
      p.x += move;
      for (const b of p.blemishes) {
        if (b.fixed || b.missed || p.x + b.dx < edge) continue;
        b.missed = true; p.left--; p.lost++; this.missed++;
        this.fx.push({ type: 'miss', x: p.x + b.dx, y: p.y + b.dy, kind: b.kind });
        if (this._check()) return;
      }
    }
    while (this.paintings.length && this.paintings[0].x > this.W + 4) { this.paintings.shift(); this.sent++; }
    const last = this.paintings[this.paintings.length - 1];
    if (!last || last.x >= gapAt(this.repaired)) this._spawn(false);
    if (this.sel && (this.sel.b.fixed || this.sel.b.missed)) this.sel = null;
  }

  _check() {
    if (!shiftOver(this.repaired, this.missed, this.stray)) return false;
    this.over = true; this.sel = null;
    this.fx.push({ type: 'over' });
    return true;
  }
  _fix(p, b) {
    b.fixed = true; b.at = this.t; p.left--; this.repaired++;
    this.fx.push({ type: 'fix', x: p.x + b.dx, y: p.y + b.dy, kind: b.kind });
    if (p.left === 0 && p.lost === 0) { p.complete = true; this.spotless++; this.fx.push({ type: 'spotless', x: p.x + p.w / 2, y: p.y, w: p.w, h: p.h }); }
    if (this.sel && this.sel.b === b) this.sel = null;
    this._check();
  }
  /** How near a touch must land to count for this blemish. */
  reach(b) { return Math.max(b.r * 1.3, this.minHit); }
  /** The blemish a touch at (x, y) would repair: the nearest one still to do within reach. */
  hit(x, y) {
    let best = null, bd = Infinity;
    for (const p of this.paintings) for (const b of p.blemishes) {
      if (b.fixed || b.missed) continue;
      const d = Math.hypot(p.x + b.dx - x, p.y + b.dy - y);
      if (d <= this.reach(b) && d < bd) { bd = d; best = { p, b }; }
    }
    return best;
  }
  /** A touch. Returns 'fix', 'stray', or 'again' (a second touch on a spot repaired a moment ago, which is forgiven). */
  tap(x, y) {
    if (this.over) return null;
    const h = this.hit(x, y);
    if (h) { this._fix(h.p, h.b); return 'fix'; }
    for (const p of this.paintings) for (const b of p.blemishes) if (b.fixed && this.t - b.at < 0.4 && Math.hypot(p.x + b.dx - x, p.y + b.dy - y) <= this.reach(b)) return 'again';
    this.stray++;
    this.fx.push({ type: 'stray', x, y });
    this._check();
    return 'stray';
  }

  // ---- for keys: a cursor that steps through what is left to do, the most urgent first ----
  /** Blemishes still to do that are on the belt, nearest the far end first. */
  targets() {
    const out = [];
    for (const p of this.paintings) for (const b of p.blemishes) if (!b.fixed && !b.missed && p.x + b.dx > 0) out.push({ p, b, x: p.x + b.dx, y: p.y + b.dy });
    return out.sort((a, c) => c.x - a.x);
  }
  /** The one the cursor is on: where it was left, or the most urgent. */
  selected() {
    const ts = this.targets();
    if (this.sel) { const s = ts.find(t => t.b === this.sel.b); if (s) return s; }
    return ts[0] || null;
  }
  /** Move the cursor: +1 to the next one back along the belt, -1 towards the far end. */
  cycle(dir) {
    const ts = this.targets(); if (!ts.length) { this.sel = null; return null; }
    const cur = this.selected(), i = ts.findIndex(t => t.b === cur.b);
    this.sel = ts[(i + dir + ts.length) % ts.length];
    return this.sel;
  }
  /** Repair whatever the cursor is on. With nothing on the belt to repair it is a stray dab, like any other. */
  dab() {
    if (this.over) return null;
    const s = this.selected();
    if (!s) return this.tap(-999, -999);
    this._fix(s.p, s.b);
    return 'fix';
  }
}
