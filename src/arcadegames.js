// The games on the monitors. Ten small ones, each written here from scratch, one to a monitor.
//
// No DOM and no three.js in this file, so the rules can be tested on their own. Every game is a
// class with the same few handles, and src/arcade.js works them:
//
//   new Game(rnd)          a fresh game; rnd() is the dice (Math.random unless a test says otherwise)
//   update(dt, held)       time passes; held = { up, down, left, right, a } for games played by holding
//   press(k)               'up' 'down' 'left' 'right' 'a' (the main button) 'b' (the second one)
//   tap(x, y)              a finger or a click on the screen; hold(x, y) a long press; drag(x, y) a finger moving
//   draw(c, t)             paint a 320 x 240 screen
//   score, over, won, msg  how it is going
//   fx                     sounds wanted since last asked: 'blip' 'hit' 'good' 'bad', or a frequency
//
// and, on the class: id, title, keys and touch (how to play, in a line each), pad (which on-screen
// buttons it wants) and icon(c, t), which paints the 160 x 120 picture the monitor shows in the room.

const W = 320, H = 240;
const INK = { g: '#7dff9a', a: '#ffcf6a', c: '#7fe9f5', m: '#ff8ad0', r: '#ff6a5a', w: '#eef4e8', d: '#2c5a3c', bg: '#04100a' };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
function cls(c, w = W, h = H) { c.fillStyle = INK.bg; c.fillRect(0, 0, w, h); }
function text(c, s, x, y, col = INK.g, size = 10, align = 'center') { c.fillStyle = col; c.font = `bold ${size}px ui-monospace, Menlo, Consolas, monospace`; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y); }
function banner(c, a, b) { c.fillStyle = 'rgba(2,8,5,.82)'; c.fillRect(30, 84, 260, 72); c.strokeStyle = INK.g; c.lineWidth = 1; c.strokeRect(30.5, 84.5, 259, 71); text(c, a, 160, 108, INK.a, 18); if (b) text(c, b, 160, 136, INK.g, 10); }

// ------------------------------------------------------------------ snake --

export class Snake {
  static id = 'snake'; static title = 'Snake';
  static keys = 'Arrows or W A S D to turn'; static touch = 'Swipe, or tap where you want to go';
  static pad = { dirs: '4' };
  static icon(c, t) { const k = Math.floor(t * 3) % 6; c.fillStyle = INK.g; for (let i = 0; i < 7; i++) c.fillRect(30 + ((i + k) % 9) * 10, i < 4 ? 50 : 60, 9, 9); c.fillStyle = INK.r; c.fillRect(130, 60, 8, 8); }
  constructor(rnd = Math.random) {
    this.rnd = rnd; this.GW = 20; this.GH = 14; this.body = [[5, 7], [4, 7], [3, 7]]; this.dir = [1, 0]; this.turns = [];
    this.acc = 0; this.score = 0; this.over = false; this.won = false; this.started = false; this.msg = ''; this.fx = [];
    this._food();
  }
  _food() {
    const free = [];
    for (let y = 0; y < this.GH; y++) for (let x = 0; x < this.GW; x++) if (!this.body.some(b => b[0] === x && b[1] === y)) free.push([x, y]);
    if (!free.length) { this.food = null; this.over = this.won = true; this.msg = 'The whole screen!'; return; }
    this.food = free[Math.floor(this.rnd() * free.length) % free.length];
  }
  press(k) {
    const d = DIRS[k]; if (!d || this.over) return;
    const last = this.turns.length ? this.turns[this.turns.length - 1] : this.dir;
    if (d[0] === -last[0] && d[1] === -last[1]) return;              // not back down its own neck
    if (d[0] === last[0] && d[1] === last[1] && this.started) return;
    if (this.turns.length < 2) this.turns.push(d);
    this.started = true;
  }
  tap(x, y) {
    const h = this.body[0], dx = x / 16 - (h[0] + 0.5), dy = (y - 16) / 16 - (h[1] + 0.5);
    const horiz = this.dir[0] !== 0;                                 // a tap turns it towards the finger
    if (horiz && Math.abs(dy) > 0.5) this.press(dy < 0 ? 'up' : 'down'); else if (!horiz && Math.abs(dx) > 0.5) this.press(dx < 0 ? 'left' : 'right'); else this.started = true;
  }
  step() {
    if (this.over) return;
    if (this.turns.length) this.dir = this.turns.shift();
    const h = this.body[0], n = [h[0] + this.dir[0], h[1] + this.dir[1]], eat = this.food && n[0] === this.food[0] && n[1] === this.food[1];
    const hit = n[0] < 0 || n[1] < 0 || n[0] >= this.GW || n[1] >= this.GH || this.body.some((b, i) => (eat || i < this.body.length - 1) && b[0] === n[0] && b[1] === n[1]);
    if (hit) { this.over = true; this.msg = 'It bit something.'; this.fx.push('bad'); return; }
    this.body.unshift(n);
    if (eat) { this.score++; this.fx.push('good'); this._food(); } else this.body.pop();
  }
  update(dt) {
    if (this.over || !this.started) return;
    this.acc += dt;
    const period = Math.max(0.075, 0.17 - this.score * 0.003);
    while (this.acc >= period && !this.over) { this.acc -= period; this.step(); }
  }
  draw(c) {
    cls(c); c.strokeStyle = INK.d; c.strokeRect(0.5, 16.5, W - 1, H - 17);
    if (this.food) { c.fillStyle = INK.r; c.fillRect(this.food[0] * 16 + 4, 16 + this.food[1] * 16 + 4, 8, 8); }
    this.body.forEach((b, i) => { c.fillStyle = i ? INK.g : INK.w; c.fillRect(b[0] * 16 + 1, 16 + b[1] * 16 + 1, 14, 14); });
    text(c, 'LENGTH ' + this.body.length, 6, 8, INK.g, 10, 'left');
    if (!this.started && !this.over) text(c, 'TURN TO BEGIN', 160, 60, INK.a, 12);
  }
}

// ------------------------------------------------------------ minesweeper --

export class Mines {
  static id = 'mines'; static title = 'Minesweeper';
  static keys = 'Arrows move, Space digs, F flags'; static touch = 'Tap to dig. Hold, or switch to FLAG, to mark a mine';
  static pad = { dirs: '4', a: 'DIG', b: 'FLAG' };
  static icon(c, t) { for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const open = (i * 3 + j * 5) % 4 === 0; c.fillStyle = open ? INK.d : INK.g; c.fillRect(42 + i * 16, 36 + j * 16, 14, 14); if (open) text(c, String(1 + (i + j) % 3), 49 + i * 16, 44 + j * 16, INK.a, 10); } if (Math.floor(t * 2) % 2) text(c, '⚑', 49 + 32, 44 + 16, INK.r, 11); }
  constructor(rnd = Math.random, o = {}) {
    this.rnd = rnd; this.GW = o.w || 10; this.GH = o.h || 8; this.count = o.mines || 12; const n = this.GW * this.GH;
    this.mine = new Uint8Array(n); this.open = new Uint8Array(n); this.flag = new Uint8Array(n); this.near = new Uint8Array(n);
    this.laid = false; this.cx = Math.floor(this.GW / 2); this.cy = Math.floor(this.GH / 2); this.flagMode = false; this.time = 0;
    this.score = 0; this.over = false; this.won = false; this.msg = ''; this.fx = []; this.opened = 0; this.boom = -1;
  }
  around(i) { const x = i % this.GW, y = (i - x) / this.GW, out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const a = x + dx, b = y + dy; if ((dx || dy) && a >= 0 && b >= 0 && a < this.GW && b < this.GH) out.push(a + b * this.GW); } return out; }
  // The mines are laid after the first dig, and never under it or beside it.
  lay(safe, at) {
    const n = this.GW * this.GH, keep = new Set([safe, ...this.around(safe)]);
    if (at) for (const i of at) this.mine[i] = 1;
    else { let left = Math.min(this.count, n - keep.size); while (left > 0) { const i = Math.floor(this.rnd() * n) % n; if (!this.mine[i] && !keep.has(i)) { this.mine[i] = 1; left--; } } }
    for (let i = 0; i < n; i++) this.near[i] = this.around(i).filter(j => this.mine[j]).length;
    this.count = this.mine.reduce((a, b) => a + b, 0); this.laid = true;
  }
  dig(i) {
    if (this.over || this.flag[i] || this.open[i]) return;
    if (!this.laid) this.lay(i);
    if (this.mine[i]) { this.over = true; this.boom = i; this.msg = 'That was a mine.'; this.fx.push('bad'); return; }
    const q = [i]; this.open[i] = 1; this.opened++;
    while (q.length) { const k = q.pop(); if (this.near[k]) continue; for (const j of this.around(k)) if (!this.open[j] && !this.flag[j] && !this.mine[j]) { this.open[j] = 1; this.opened++; q.push(j); } }
    this.fx.push('blip');
    if (this.opened === this.GW * this.GH - this.count) { this.over = this.won = true; this.score = Math.max(10, 500 - Math.floor(this.time) * 2); this.msg = `Cleared in ${Math.floor(this.time)} seconds.`; this.fx.push('good'); }
  }
  mark(i) { if (this.over || this.open[i]) return; this.flag[i] ^= 1; this.fx.push('blip'); }
  cell(x, y) { const i = Math.floor((x - 40) / 24), j = Math.floor((y - 40) / 24); return i >= 0 && j >= 0 && i < this.GW && j < this.GH ? i + j * this.GW : -1; }
  press(k) {
    const d = DIRS[k];
    if (d) { this.cx = clamp(this.cx + d[0], 0, this.GW - 1); this.cy = clamp(this.cy + d[1], 0, this.GH - 1); return; }
    const i = this.cx + this.cy * this.GW;
    if (k === 'a') this.dig(i); else if (k === 'b') this.mark(i);
  }
  second() { this.flagMode = !this.flagMode; return this.flagMode ? 'FLAG ✓' : 'FLAG'; }       // the on-screen FLAG button is a switch
  tap(x, y) { const i = this.cell(x, y); if (i < 0) return; this.cx = i % this.GW; this.cy = (i - this.cx) / this.GW; if (this.flagMode) this.mark(i); else this.dig(i); }
  hold(x, y) { const i = this.cell(x, y); if (i >= 0) this.mark(i); }
  update(dt) { if (this.laid && !this.over) this.time += dt; }
  draw(c) {
    cls(c);
    const flags = this.flag.reduce((a, b) => a + b, 0);
    text(c, `MINES ${this.count - flags}`, 40, 20, INK.a, 12, 'left'); text(c, `TIME ${Math.floor(this.time)}`, 280, 20, INK.a, 12, 'right');
    if (this.flagMode) text(c, 'FLAGGING', 160, 20, INK.r, 11);
    const cols = [null, INK.c, INK.g, INK.r, INK.m, INK.a, INK.w, INK.w, INK.w];
    for (let i = 0; i < this.GW * this.GH; i++) {
      const x = 40 + (i % this.GW) * 24, y = 40 + Math.floor(i / this.GW) * 24, show = this.open[i] || (this.over && this.mine[i]);
      c.fillStyle = show ? '#0a2014' : '#1d6a40'; c.fillRect(x + 1, y + 1, 22, 22);
      if (this.over && this.mine[i]) { c.fillStyle = i === this.boom ? INK.r : INK.w; c.beginPath(); c.arc(x + 12, y + 12, 6, 0, 7); c.fill(); }
      else if (this.open[i] && this.near[i]) text(c, String(this.near[i]), x + 12, y + 13, cols[this.near[i]], 14);
      else if (this.flag[i]) text(c, '⚑', x + 12, y + 13, INK.r, 15);
    }
    c.strokeStyle = INK.w; c.lineWidth = 2; c.strokeRect(40 + this.cx * 24 + 1, 40 + this.cy * 24 + 1, 22, 22);
  }
}

// -------------------------------------------------------------- bat and ball --

export class Paddles {
  static id = 'paddles'; static title = 'Paddles';
  static keys = 'Up and Down (or W S) move your bat. First to 5'; static touch = 'Slide a finger up and down the screen. First to 5';
  static pad = { dirs: 'ud' };
  static icon(c, t) { c.fillStyle = INK.g; c.fillRect(34, 40 + Math.sin(t) * 12, 5, 26); c.fillRect(122, 52 - Math.sin(t * 1.3) * 12, 5, 26); c.fillRect(60 + ((t * 20) % 50), 50 + Math.sin(t * 2) * 10, 5, 5); for (let y = 28; y < 84; y += 10) c.fillRect(79, y, 2, 5); }
  constructor(rnd = Math.random) {
    this.rnd = rnd; this.you = 0; this.them = 0; this.py = 120; this.ay = 120; this.want = null; this.aim = 120;
    this.score = 0; this.over = false; this.won = false; this.msg = ''; this.fx = []; this.TO = 5;
    this.serve(1);
  }
  serve(dir) { this.bx = 160; this.by = 60 + this.rnd() * 120; const a = (this.rnd() - 0.5) * 0.9; this.speed = 150; this.vx = Math.cos(a) * this.speed * dir; this.vy = Math.sin(a) * this.speed; this.wait = 0.9; }
  drag(x, y) { this.want = clamp(y, 22, H - 22); }
  press() {}
  point(mine) {
    if (mine) this.you++; else this.them++;
    this.fx.push(mine ? 'good' : 'bad');
    this.score = this.you * 100 + (this.you >= this.TO ? (this.TO - this.them) * 20 : 0);
    if (this.you >= this.TO || this.them >= this.TO) { this.over = true; this.won = this.you > this.them; this.msg = this.won ? `You win, ${this.you} to ${this.them}.` : `The machine wins, ${this.them} to ${this.you}.`; }
    else this.serve(mine ? -1 : 1);
  }
  update(dt, held = {}) {
    if (this.over) return;
    const mv = (held.down ? 1 : 0) - (held.up ? 1 : 0);
    if (mv) { this.py += mv * 200 * dt; this.want = null; } else if (this.want != null) this.py += clamp(this.want - this.py, -260 * dt, 260 * dt);
    this.py = clamp(this.py, 22, H - 22);
    // The machine follows the ball when it is coming, a little late and not quite fast enough.
    if (this.vx > 0) this.aim += (this.by + (this.them > this.you ? 14 : 0) - this.aim) * Math.min(1, dt * 5); else this.aim += (120 - this.aim) * Math.min(1, dt);
    this.ay = clamp(this.ay + clamp(this.aim - this.ay, -105 * dt, 105 * dt), 22, H - 22);
    if (this.wait > 0) { this.wait -= dt; return; }
    let left = dt;
    while (left > 0) {                                                 // in small steps, so a fast ball cannot pass through a bat
      const h = Math.min(left, 0.008); left -= h;
      this.bx += this.vx * h; this.by += this.vy * h;
      if (this.by < 4) { this.by = 4; this.vy = Math.abs(this.vy); } else if (this.by > H - 4) { this.by = H - 4; this.vy = -Math.abs(this.vy); }
      const bat = (x, y, dir) => {
        if ((dir < 0 ? this.bx < x + 6 && this.bx > x - 4 : this.bx > x - 6 && this.bx < x + 4) && Math.abs(this.by - y) < 23 && this.vx * dir > 0) {
          this.speed = Math.min(330, this.speed + 12); const a = clamp((this.by - y) / 23, -1, 1) * 0.95;
          this.vx = -dir * Math.cos(a) * this.speed; this.vy = Math.sin(a) * this.speed; this.fx.push('hit');
        }
      };
      bat(14, this.py, -1); bat(306, this.ay, 1);
      if (this.bx < -6) { this.point(false); return; }
      if (this.bx > W + 6) { this.point(true); return; }
    }
  }
  draw(c) {
    cls(c); c.fillStyle = INK.d; for (let y = 4; y < H; y += 14) c.fillRect(159, y, 2, 8);
    text(c, String(this.you), 120, 24, INK.g, 26); text(c, String(this.them), 200, 24, INK.g, 26);
    c.fillStyle = INK.w; c.fillRect(11, this.py - 20, 6, 40); c.fillRect(303, this.ay - 20, 6, 40);
    if (!this.over) c.fillRect(this.bx - 3, this.by - 3, 6, 6);
  }
}

// ---------------------------------------------------------------- brick wall --

export class Bricks {
  static id = 'bricks'; static title = 'Brick Wall';
  static keys = 'Left and Right move the bat. Space serves'; static touch = 'Slide a finger along the screen. Tap to serve';
  static pad = { dirs: 'lr', a: 'SERVE' };
  static icon(c, t) { const cols = [INK.r, INK.a, INK.g, INK.c]; for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) if ((i + j * 2) % 7 !== Math.floor(t) % 7) { c.fillStyle = cols[j]; c.fillRect(36 + i * 15, 30 + j * 8, 13, 6); } c.fillStyle = INK.w; c.fillRect(60 + Math.sin(t) * 20, 84, 26, 4); c.fillRect(78 + Math.sin(t * 1.7) * 14, 72, 4, 4); }
  constructor(rnd = Math.random) {
    this.rnd = rnd; this.px = 160; this.want = null; this.lives = 3; this.bricks = [];
    for (let j = 0; j < 5; j++) for (let i = 0; i < 10; i++) this.bricks.push({ x: 10 + i * 30, y: 34 + j * 12, row: j, live: true });
    this.left = this.bricks.length; this.score = 0; this.over = false; this.won = false; this.msg = ''; this.fx = []; this.stuck = true; this.bx = 160; this.by = 214; this.vx = 0; this.vy = 0; this.speed = 150;
  }
  press(k) { if (k === 'a') this.launch(); }
  tap() { this.launch(); }
  drag(x) { this.want = clamp(x, 24, W - 24); }
  launch() { if (!this.stuck || this.over) return; this.stuck = false; const a = (this.rnd() - 0.5) * 0.8; this.vx = Math.sin(a) * this.speed; this.vy = -Math.cos(a) * this.speed; }
  update(dt, held = {}) {
    if (this.over) return;
    const mv = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    if (mv) { this.px += mv * 230 * dt; this.want = null; } else if (this.want != null) this.px += clamp(this.want - this.px, -420 * dt, 420 * dt);
    this.px = clamp(this.px, 24, W - 24);
    if (this.stuck) { this.bx = this.px; this.by = 214; return; }
    let left = dt;
    while (left > 0 && !this.over && !this.stuck) {
      const h = Math.min(left, 0.006); left -= h;
      this.bx += this.vx * h; this.by += this.vy * h;
      if (this.bx < 3) { this.bx = 3; this.vx = Math.abs(this.vx); } else if (this.bx > W - 3) { this.bx = W - 3; this.vx = -Math.abs(this.vx); }
      if (this.by < 19) { this.by = 19; this.vy = Math.abs(this.vy); }
      if (this.vy > 0 && this.by > 216 && this.by < 224 && Math.abs(this.bx - this.px) < 27) {
        const a = clamp((this.bx - this.px) / 27, -1, 1) * 1.05; this.vx = Math.sin(a) * this.speed; this.vy = -Math.cos(a) * this.speed; this.fx.push('hit');
      }
      for (const b of this.bricks) {
        if (!b.live || this.bx < b.x - 3 || this.bx > b.x + 31 || this.by < b.y - 3 || this.by > b.y + 13) continue;
        b.live = false; this.left--; this.score += 10 * (5 - b.row); this.speed = Math.min(300, this.speed + 2.5); this.fx.push('blip');
        const ox = Math.min(this.bx - (b.x - 3), b.x + 31 - this.bx), oy = Math.min(this.by - (b.y - 3), b.y + 13 - this.by);
        if (ox < oy) this.vx = -this.vx; else this.vy = -this.vy;
        break;
      }
      if (!this.left) { this.over = this.won = true; this.score += this.lives * 50; this.msg = 'The wall is down.'; this.fx.push('good'); }
      else if (this.by > H + 6) { this.lives--; this.fx.push('bad'); if (this.lives <= 0) { this.over = true; this.msg = 'Out of balls.'; } else this.stuck = true; }
    }
  }
  draw(c) {
    cls(c); const cols = [INK.r, INK.m, INK.a, INK.g, INK.c];
    text(c, 'BALLS ' + this.lives, 6, 9, INK.g, 10, 'left');
    for (const b of this.bricks) if (b.live) { c.fillStyle = cols[b.row]; c.fillRect(b.x + 1, b.y + 1, 28, 10); }
    c.fillStyle = INK.w; c.fillRect(this.px - 24, 220, 48, 5); c.fillRect(this.bx - 3, this.by - 3, 6, 6);
    if (this.stuck && !this.over) text(c, 'SERVE', 160, 150, INK.a, 12);
  }
}

// -------------------------------------------------------------------- blocks --

const SHAPES = [[[0, 0], [1, 0], [0, 1], [1, 1]], [[-1, 0], [0, 0], [1, 0], [2, 0]], [[-1, 0], [0, 0], [1, 0], [0, 1]], [[-1, 0], [0, 0], [1, 0], [1, 1]], [[-1, 0], [0, 0], [1, 0], [-1, 1]], [[-1, 0], [0, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [-1, 1], [0, 1]]];
const SHADE = ['#9a8cff', '#e8a36a', '#8ae86a', '#6ad8e8', '#f0f0e0', '#d8e86a', '#e86ab0'];      // this game's own colours

export class Blocks {
  static id = 'blocks'; static title = 'Blocks';
  static keys = 'Left, Right, Up turns, Down drops a row, Space drops'; static touch = 'Tap to turn. Swipe sideways to move, down to drop';
  static pad = { dirs: '4', a: 'DROP' };
  static repeat = true;
  static icon(c, t) { const k = Math.floor(t * 2) % 5; const put = (x, y, col) => { c.fillStyle = col; c.fillRect(56 + x * 10, 22 + y * 10, 9, 9); }; for (let i = 0; i < 5; i++) if (i !== 2) put(i, 7, SHADE[1]); put(0, 6, SHADE[4]); put(1, 6, SHADE[4]); put(4, 6, SHADE[3]); for (const [x, y] of SHAPES[2]) put(2 + x, k + y, SHADE[2]); }
  constructor(rnd = Math.random) {
    this.rnd = rnd; this.GW = 10; this.GH = 18; this.grid = new Int8Array(this.GW * this.GH).fill(-1);
    this.lines = 0; this.score = 0; this.over = false; this.won = false; this.msg = ''; this.fx = []; this.acc = 0;
    this.nextKind = Math.floor(rnd() * 7) % 7; this.spawn();
  }
  spawn() { this.kind = this.nextKind; this.nextKind = Math.floor(this.rnd() * 7) % 7; this.cells = SHAPES[this.kind].map(p => p.slice()); this.x = 4; this.y = 0; if (!this.fits(this.cells, this.x, this.y)) { this.over = true; this.msg = 'Stacked to the top.'; this.fx.push('bad'); } }
  fits(cells, x, y) { return cells.every(([a, b]) => { const i = x + a, j = y + b; return i >= 0 && i < this.GW && j < this.GH && (j < 0 || this.grid[i + j * this.GW] < 0); }); }
  move(dx) { if (this.fits(this.cells, this.x + dx, this.y)) { this.x += dx; return true; } return false; }
  turn() { if (this.kind === 0) return; const r = this.cells.map(([a, b]) => [-b, a]); for (const k of [0, -1, 1, -2, 2]) if (this.fits(r, this.x + k, this.y)) { this.cells = r; this.x += k; this.fx.push('blip'); return; } }
  down() { if (this.fits(this.cells, this.x, this.y + 1)) { this.y++; return true; } this.lock(); return false; }
  lock() {
    for (const [a, b] of this.cells) { const j = this.y + b; if (j >= 0) this.grid[this.x + a + j * this.GW] = this.kind; }
    let n = 0;
    for (let j = this.GH - 1; j >= 0; j--) {
      let full = true; for (let i = 0; i < this.GW; i++) if (this.grid[i + j * this.GW] < 0) { full = false; break; }
      if (!full) continue;
      this.grid.copyWithin(this.GW, 0, j * this.GW); this.grid.fill(-1, 0, this.GW); n++; j++;
    }
    if (n) { this.lines += n; this.score += [0, 40, 100, 300, 1200][n]; this.fx.push('good'); } else this.fx.push('hit');
    this.spawn();
  }
  press(k) { if (this.over) return; if (k === 'left') this.move(-1); else if (k === 'right') this.move(1); else if (k === 'up') this.turn(); else if (k === 'down') { this.down(); this.acc = 0; } else if (k === 'a') { while (this.down()) { /* all the way */ } this.acc = 0; } }
  tap() { if (!this.over) this.turn(); }
  update(dt) { if (this.over) return; this.acc += dt; const period = Math.max(0.09, 0.62 - this.lines * 0.022); while (this.acc >= period && !this.over) { this.acc -= period; this.down(); } }
  draw(c) {
    cls(c); const ox = 100, oy = 12, s = 12;
    c.strokeStyle = INK.d; c.strokeRect(ox - 1.5, oy - 1.5, this.GW * s + 3, this.GH * s + 3);
    for (let i = 0; i < this.grid.length; i++) if (this.grid[i] >= 0) { c.fillStyle = SHADE[this.grid[i]]; c.fillRect(ox + (i % this.GW) * s + 1, oy + Math.floor(i / this.GW) * s + 1, s - 2, s - 2); }
    if (!this.over) { c.fillStyle = SHADE[this.kind]; for (const [a, b] of this.cells) if (this.y + b >= 0) c.fillRect(ox + (this.x + a) * s + 1, oy + (this.y + b) * s + 1, s - 2, s - 2); }
    text(c, 'LINES', 50, 40, INK.g, 10); text(c, String(this.lines), 50, 56, INK.a, 16);
    text(c, 'NEXT', 270, 40, INK.g, 10); c.fillStyle = SHADE[this.nextKind]; for (const [a, b] of SHAPES[this.nextKind]) c.fillRect(262 + a * 10, 54 + b * 10, 9, 9);
  }
}

// ---------------------------------------------------------------- star guard --

export class StarGuard {
  static id = 'starguard'; static title = 'Star Guard';
  static keys = 'Left and Right to move, Space to fire'; static touch = 'Slide a finger to move. FIRE, or tap, to shoot';
  static pad = { dirs: 'lr', a: 'FIRE' };
  static icon(c, t) { const s = Math.floor(t * 2) % 2; c.fillStyle = INK.m; for (let j = 0; j < 2; j++) for (let i = 0; i < 5; i++) { const x = 40 + i * 18 + s * 4, y = 30 + j * 16; c.fillRect(x, y, 10, 6); c.fillRect(x - 2 + s * 2, y + 6, 3, 3); c.fillRect(x + 9 - s * 2, y + 6, 3, 3); } c.fillStyle = INK.g; c.fillRect(72, 86, 16, 5); c.fillRect(78, 82, 4, 4); c.fillStyle = INK.w; c.fillRect(79, 70 - ((t * 30) % 20), 2, 6); }
  constructor(rnd = Math.random) { this.rnd = rnd; this.px = 160; this.want = null; this.lives = 3; this.wave = 0; this.score = 0; this.over = false; this.won = false; this.msg = ''; this.fx = []; this.shot = null; this.bombs = []; this.cool = 0; this.newWave(); }
  newWave() { this.wave++; this.aliens = []; for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) this.aliens.push({ x: 40 + i * 28, y: 30 + j * 18, row: j, live: true }); this.dir = 1; this.left = this.aliens.length; this.bombs = []; this.shot = null; this.t = 0; }
  fire() { if (this.over || this.shot) return; this.shot = { x: this.px, y: 212 }; this.fx.push(880); }
  press(k) { if (k === 'a') this.fire(); }
  tap() { this.fire(); }
  drag(x) { this.want = clamp(x, 12, W - 12); }
  update(dt, held = {}) {
    if (this.over) return;
    this.t += dt;
    const mv = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    if (mv) { this.px += mv * 150 * dt; this.want = null; } else if (this.want != null) this.px += clamp(this.want - this.px, -260 * dt, 260 * dt);
    this.px = clamp(this.px, 12, W - 12);
    if (held.a) this.fire();
    // The ranks march faster the fewer of them are left.
    const speed = (14 + (32 - this.left) * 1.6 + this.wave * 4) * this.dir; let edge = false, low = 0;
    for (const a of this.aliens) if (a.live) { a.x += speed * dt; if (a.x < 12 || a.x > W - 12) edge = true; if (a.y > low) low = a.y; }
    if (edge) { this.dir = -this.dir; for (const a of this.aliens) { a.y += 8; a.x += this.dir * 2; } }
    if (low + 8 >= 206) { this.over = true; this.msg = 'They landed.'; this.fx.push('bad'); return; }
    this.cool -= dt;
    if (this.cool <= 0) { const live = this.aliens.filter(a => a.live); if (live.length) { const a = live[Math.floor(this.rnd() * live.length) % live.length]; this.bombs.push({ x: a.x, y: a.y + 6 }); } this.cool = Math.max(0.35, 1.3 - this.wave * 0.12) * (0.6 + this.rnd() * 0.8); }
    if (this.shot) {
      this.shot.y -= 270 * dt;
      for (const a of this.aliens) if (a.live && Math.abs(a.x - this.shot.x) < 9 && Math.abs(a.y - this.shot.y) < 8) { a.live = false; this.left--; this.score += 10 * (4 - a.row); this.shot = null; this.fx.push('blip'); break; }
      if (this.shot && this.shot.y < 14) this.shot = null;
    }
    for (const b of this.bombs) { b.y += 110 * dt; if (b.y > 208 && b.y < 222 && Math.abs(b.x - this.px) < 10) { b.y = 999; this.lives--; this.fx.push('bad'); if (this.lives <= 0) { this.over = true; this.msg = 'The guard is down.'; return; } } }
    this.bombs = this.bombs.filter(b => b.y < H);
    if (!this.left) { this.score += 100; this.fx.push('good'); this.newWave(); }
  }
  draw(c) {
    cls(c); const s = Math.floor(this.t * 2) % 2;
    text(c, 'SHIPS ' + this.lives, 6, 9, INK.g, 10, 'left'); text(c, 'WAVE ' + this.wave, 314, 9, INK.g, 10, 'right');
    for (const a of this.aliens) if (a.live) { c.fillStyle = [INK.m, INK.a, INK.c, INK.g][a.row]; c.fillRect(a.x - 7, a.y - 5, 14, 7); c.fillRect(a.x - 9 + s * 3, a.y + 2, 4, 4); c.fillRect(a.x + 5 - s * 3, a.y + 2, 4, 4); c.fillStyle = INK.bg; c.fillRect(a.x - 4, a.y - 3, 2, 2); c.fillRect(a.x + 2, a.y - 3, 2, 2); }
    c.fillStyle = INK.g; c.fillRect(this.px - 10, 216, 20, 6); c.fillRect(this.px - 2, 210, 4, 6);
    c.fillStyle = INK.w; if (this.shot) c.fillRect(this.shot.x - 1, this.shot.y - 5, 2, 8);
    c.fillStyle = INK.r; for (const b of this.bombs) c.fillRect(b.x - 1, b.y - 3, 3, 6);
    c.fillStyle = INK.d; c.fillRect(0, 226, W, 1);
  }
}

// --------------------------------------------------------------------- twice --

export class Twice {
  static id = 'twice'; static title = 'Twice';
  static keys = 'Arrows slide every tile. Two the same make one twice as big'; static touch = 'Swipe to slide every tile. Two the same make one twice as big';
  static pad = { dirs: '4' };
  static icon(c) { const v = [2, 4, 8, 16, 0, 2, 32, 4, 0]; for (let i = 0; i < 9; i++) { const x = 44 + (i % 3) * 25, y = 22 + Math.floor(i / 3) * 25; c.fillStyle = v[i] ? INK.d : '#0a2014'; c.fillRect(x, y, 23, 23); if (v[i]) text(c, String(v[i]), x + 11.5, y + 12.5, v[i] > 8 ? INK.a : INK.g, 11); } }
  constructor(rnd = Math.random, cells) { this.rnd = rnd; this.g = cells ? cells.slice() : new Array(16).fill(0); this.score = 0; this.over = false; this.won = false; this.msg = ''; this.fx = []; if (!cells) { this.add(); this.add(); } }
  add() { const free = []; this.g.forEach((v, i) => { if (!v) free.push(i); }); if (!free.length) return; this.g[free[Math.floor(this.rnd() * free.length) % free.length]] = this.rnd() < 0.9 ? 2 : 4; }
  // One row slid towards its start: [2, 2, 4, 0] becomes [4, 4, 0, 0]. A tile merges once a move.
  static slide(row) { const t = row.filter(Boolean), out = []; let gain = 0; for (let i = 0; i < t.length; i++) { if (t[i] === t[i + 1]) { out.push(t[i] * 2); gain += t[i] * 2; i++; } else out.push(t[i]); } while (out.length < row.length) out.push(0); return { out, gain }; }
  line(k, n) { return { left: [0, 1, 2, 3].map(i => n * 4 + i), right: [3, 2, 1, 0].map(i => n * 4 + i), up: [0, 1, 2, 3].map(i => i * 4 + n), down: [3, 2, 1, 0].map(i => i * 4 + n) }[k]; }
  can(k) { for (let n = 0; n < 4; n++) { const idx = this.line(k, n), row = idx.map(i => this.g[i]), { out } = Twice.slide(row); if (out.some((v, i) => v !== row[i])) return true; } return false; }
  press(k) {
    if (this.over || !DIRS[k]) return;
    let moved = false;
    for (let n = 0; n < 4; n++) { const idx = this.line(k, n), row = idx.map(i => this.g[i]), { out, gain } = Twice.slide(row); out.forEach((v, i) => { if (v !== row[i]) moved = true; this.g[idx[i]] = v; }); this.score += gain; if (gain) this.fx.push('blip'); }
    if (!moved) return;
    this.add();
    if (!this.won && this.g.includes(2048)) { this.won = true; this.fx.push('good'); }
    if (!['up', 'down', 'left', 'right'].some(d => this.can(d))) { this.over = true; this.msg = 'No moves left.'; this.fx.push('bad'); }
  }
  update() {}
  draw(c) {
    cls(c);
    for (let i = 0; i < 16; i++) {
      const x = 62 + (i % 4) * 50, y = 22 + Math.floor(i / 4) * 50, v = this.g[i], k = v ? Math.log2(v) : 0;
      c.fillStyle = v ? `hsl(${150 - k * 14}, 60%, ${14 + k * 4}%)` : '#0a2014'; c.fillRect(x, y, 46, 46);
      if (v) text(c, String(v), x + 23, y + 24, k > 6 ? INK.w : INK.g, v > 999 ? 14 : v > 99 ? 17 : 21);
    }
    if (this.won && !this.over) text(c, '2048! KEEP GOING', 160, 12, INK.a, 10);
  }
}

// ----------------------------------------------------------------- lamps out --

export class LampsOut {
  static id = 'lamps'; static title = 'Lamps Out';
  static keys = 'Arrows move, Space flips a lamp and its neighbours. Put them all out'; static touch = 'Tap a lamp: it and its neighbours flip. Put them all out';
  static pad = { dirs: '4', a: 'FLIP' };
  static icon(c, t) { const k = Math.floor(t) % 5; for (let i = 0; i < 9; i++) { const on = [1, 3, 4, 5, 7].includes(i) === (k % 2 === 0); c.fillStyle = on ? INK.a : '#1a2a1e'; c.beginPath(); c.arc(56 + (i % 3) * 24, 34 + Math.floor(i / 3) * 24, 9, 0, 7); c.fill(); } }
  constructor(rnd = Math.random) { this.rnd = rnd; this.N = 5; this.level = 0; this.score = 0; this.over = false; this.won = false; this.msg = ''; this.fx = []; this.cx = 2; this.cy = 2; this.pause = 0; this.moves = 0; this.next(); }
  next() { this.level++; this.g = new Uint8Array(25); this.moves = 0; const n = 2 + this.level; for (let k = 0; k < n || !this.g.some(Boolean); k++) this.flip(Math.floor(this.rnd() * 25) % 25); }       // scrambled by real moves, so it can always be undone
  flip(i) { const x = i % 5, y = (i - x) / 5; for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < 5 && b < 5) this.g[a + b * 5] ^= 1; } }
  play(i) { if (this.pause > 0) return; this.flip(i); this.moves++; this.fx.push('blip'); if (!this.g.some(Boolean)) { this.score++; this.won = true; this.pause = 1.4; this.fx.push('good'); } }
  press(k) { const d = DIRS[k]; if (d) { this.cx = clamp(this.cx + d[0], 0, 4); this.cy = clamp(this.cy + d[1], 0, 4); } else if (k === 'a') this.play(this.cx + this.cy * 5); }
  tap(x, y) { const i = Math.floor((x - 60) / 40), j = Math.floor((y - 28) / 40); if (i < 0 || j < 0 || i > 4 || j > 4) return; this.cx = i; this.cy = j; this.play(i + j * 5); }
  update(dt) { if (this.pause > 0) { this.pause -= dt; if (this.pause <= 0) this.next(); } }
  draw(c) {
    cls(c); text(c, `BOARD ${this.level}`, 6, 12, INK.g, 10, 'left'); text(c, `MOVES ${this.moves}`, 314, 12, INK.g, 10, 'right');
    for (let i = 0; i < 25; i++) { const x = 80 + (i % 5) * 40, y = 48 + Math.floor(i / 5) * 40; c.fillStyle = this.g[i] ? INK.a : '#14241a'; c.beginPath(); c.arc(x, y, 15, 0, 7); c.fill(); if (this.g[i]) { c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(x - 4, y - 4, 4, 0, 7); c.fill(); } }
    c.strokeStyle = INK.w; c.lineWidth = 2; c.strokeRect(62 + this.cx * 40, 30 + this.cy * 40, 36, 36);
    if (this.pause > 0) text(c, 'ALL OUT!', 160, 232, INK.a, 12);
  }
}

// ---------------------------------------------------------------------- echo --

export class Echo {
  static id = 'echo'; static title = 'Echo';
  static keys = 'Watch, then repeat it with the arrow keys'; static touch = 'Watch, then tap the pads in the same order';
  static pad = { dirs: '4' };
  static PADS = [['up', 160, 62, INK.g, 330], ['right', 232, 120, INK.r, 392], ['down', 160, 178, INK.a, 494], ['left', 88, 120, INK.c, 262]];
  static icon(c, t) { const k = Math.floor(t * 1.5) % 4; [[80, 36], [106, 60], [80, 84], [54, 60]].forEach(([x, y], i) => { c.globalAlpha = i === k ? 1 : 0.3; c.fillStyle = Echo.PADS[i][3]; c.fillRect(x - 11, y - 11, 22, 22); }); c.globalAlpha = 1; }
  constructor(rnd = Math.random) { this.rnd = rnd; this.seq = []; this.score = 0; this.over = false; this.won = false; this.msg = ''; this.fx = []; this.lit = -1; this.litT = 0; this.grow(); }
  grow() { this.seq.push(Math.floor(this.rnd() * 4) % 4); this.phase = 'show'; this.i = 0; this.t = -0.7; this.shown = -1; }
  hit(p) {
    if (this.over || this.phase !== 'input') return;
    this.lit = p; this.litT = 0.25;
    if (p !== this.seq[this.i]) { this.over = true; this.msg = `It was ${Echo.PADS[this.seq[this.i]][0]}.`; this.fx.push('bad'); return; }
    this.fx.push(Echo.PADS[p][4]); this.i++;
    if (this.i === this.seq.length) { this.score = this.seq.length; this.grow(); }
  }
  press(k) { const p = Echo.PADS.findIndex(q => q[0] === k); if (p >= 0) this.hit(p); }
  tap(x, y) { let best = -1, bd = 46 * 46; Echo.PADS.forEach((q, i) => { const d = (x - q[1]) ** 2 + (y - q[2]) ** 2; if (d < bd) { bd = d; best = i; } }); if (best >= 0) this.hit(best); }
  update(dt) {
    if (this.litT > 0) { this.litT -= dt; if (this.litT <= 0) this.lit = -1; }
    if (this.over || this.phase !== 'show') return;
    const step = Math.max(0.3, 0.62 - this.seq.length * 0.02);
    this.t += dt;
    if (this.t < 0) return;
    const now = Math.floor(this.t / step);
    if (now === this.shown) return;
    this.shown = now;
    if (now >= this.seq.length) { this.phase = 'input'; this.i = 0; this.lit = -1; return; }
    this.lit = this.seq[now]; this.litT = step * 0.7; this.fx.push(Echo.PADS[this.lit][4]);
  }
  draw(c) {
    cls(c);
    Echo.PADS.forEach(([, x, y, col], i) => { c.globalAlpha = this.lit === i ? 1 : 0.28; c.fillStyle = col; c.beginPath(); c.roundRect ? c.roundRect(x - 34, y - 26, 68, 52, 8) : c.rect(x - 34, y - 26, 68, 52); c.fill(); });
    c.globalAlpha = 1;
    text(c, this.over ? '' : this.phase === 'show' ? 'WATCH' : 'YOUR TURN', 160, 120, INK.w, 11); text(c, 'ROUND ' + this.seq.length, 160, 228, INK.g, 10);
  }
}

// ------------------------------------------------------- noughts and crosses --

const LINES3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export function winner3(g) { for (const [a, b, c] of LINES3) if (g[a] && g[a] === g[b] && g[a] === g[c]) return g[a]; return g.every(Boolean) ? 3 : 0; }      // 1 or 2 has a line; 3 is a draw; 0 is still going
// The best square for `who`, looking all the way to the end.
export function best3(g, who) {
  const go = (turn, depth) => { const w = winner3(g); if (w === who) return 10 - depth; if (w === 3) return 0; if (w) return depth - 10; let best = turn === who ? -99 : 99; for (let i = 0; i < 9; i++) if (!g[i]) { g[i] = turn; const v = go(3 - turn, depth + 1); g[i] = 0; best = turn === who ? Math.max(best, v) : Math.min(best, v); } return best; };
  let at = -1, top = -99;
  for (let i = 0; i < 9; i++) if (!g[i]) { g[i] = who; const v = go(3 - who, 1); g[i] = 0; if (v > top) { top = v; at = i; } }
  return at;
}

export class Noughts {
  static id = 'noughts'; static title = 'Noughts & Crosses';
  static keys = 'Arrows move, Space marks. You are X. Wins in a row count'; static touch = 'Tap a square. You are X. Wins in a row count';
  static pad = { dirs: '4', a: 'MARK' };
  static icon(c, t) { c.strokeStyle = INK.g; c.lineWidth = 2; c.beginPath(); for (const k of [1, 2]) { c.moveTo(44 + k * 24, 24); c.lineTo(44 + k * 24, 96); c.moveTo(44, 24 + k * 24); c.lineTo(116, 24 + k * 24); } c.stroke(); const m = ['X', 'O', '', '', 'X', '', 'O', '', Math.floor(t) % 2 ? 'X' : '']; m.forEach((s, i) => s && text(c, s, 56 + (i % 3) * 24, 37 + Math.floor(i / 3) * 24, s === 'X' ? INK.a : INK.c, 16)); }
  constructor(rnd = Math.random, o = {}) { this.rnd = rnd; this.slip = o.slip == null ? 0.38 : o.slip; this.score = 0; this.over = false; this.won = false; this.msg = ''; this.fx = []; this.cx = 1; this.cy = 1; this.round = 0; this.fresh(); }
  fresh() { this.g = new Array(9).fill(0); this.done = 0; this.wait = 0; this.round++; this.note = ''; }
  mark(i) {
    if (this.over) return;
    if (this.done) { if (this.pauseT <= 0) this.fresh(); return; }
    if (this.g[i] || this.wait > 0) return;
    this.g[i] = 1; this.fx.push('blip');
    if (!this.settle()) this.wait = 0.55;
  }
  settle() {
    const w = winner3(this.g); if (!w) return false;
    this.done = w; this.pauseT = 0.5;
    if (w === 1) { this.score++; this.won = true; this.note = 'YOU WIN. AGAIN?'; this.fx.push('good'); }
    else if (w === 3) this.note = 'A DRAW. AGAIN?';
    else { this.over = true; this.msg = this.score ? `Beaten, after ${this.score} in a row.` : 'The machine wins.'; this.fx.push('bad'); }
    return true;
  }
  // The machine plays the best square, except when its attention slips.
  reply() { const free = []; this.g.forEach((v, i) => { if (!v) free.push(i); }); const i = this.rnd() < this.slip ? free[Math.floor(this.rnd() * free.length) % free.length] : best3(this.g, 2); this.g[i] = 2; this.fx.push('hit'); this.settle(); }
  press(k) { const d = DIRS[k]; if (d) { this.cx = clamp(this.cx + d[0], 0, 2); this.cy = clamp(this.cy + d[1], 0, 2); } else if (k === 'a') this.mark(this.cx + this.cy * 3); }
  tap(x, y) { const i = Math.floor((x - 70) / 60), j = Math.floor((y - 24) / 60); if (i < 0 || j < 0 || i > 2 || j > 2) { if (this.done) this.mark(0); return; } this.cx = i; this.cy = j; this.mark(i + j * 3); }
  update(dt) { if (this.done) { this.pauseT -= dt; return; } if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) this.reply(); } }
  draw(c) {
    cls(c); c.strokeStyle = INK.g; c.lineWidth = 3; c.beginPath();
    for (const k of [1, 2]) { c.moveTo(70 + k * 60, 24); c.lineTo(70 + k * 60, 204); c.moveTo(70, 24 + k * 60); c.lineTo(250, 24 + k * 60); }
    c.stroke();
    this.g.forEach((v, i) => { if (v) text(c, v === 1 ? 'X' : 'O', 100 + (i % 3) * 60, 57 + Math.floor(i / 3) * 60, v === 1 ? INK.a : INK.c, 44); });
    c.strokeStyle = INK.w; c.lineWidth = 1.5; c.strokeRect(74 + this.cx * 60, 28 + this.cy * 60, 52, 52);
    text(c, this.note || 'IN A ROW: ' + this.score, 160, 224, this.note ? INK.a : INK.g, 11);
  }
}

// ------------------------------------------------------------- outpost nine --
//
// Not one of the ten, and not on a monitor anybody left on by accident (src/secret.js knows where it
// is). You are a star base in the middle of the screen. Saucers come at you from every side, in
// waves; turn the gun and shoot them before they reach you. Each one that gets through costs a
// shield, and the base has three.

export class Outpost {
  static id = 'outpost'; static title = 'Outpost Nine';
  static keys = 'Left and Right to turn the gun, Space to fire'; static touch = 'Touch where you want to shoot: the gun turns there and fires. Or the buttons';
  static pad = { dirs: 'lr', a: 'FIRE' };
  static CX = 160; static CY = 124;
  static KINDS = { scout: { r: 7, hp: 1, v: 26, pts: 10 }, dart: { r: 5, hp: 1, v: 46, pts: 20 }, hulk: { r: 10, hp: 3, v: 17, pts: 40 } };
  static icon(c, t) {
    c.fillStyle = INK.w; for (let i = 0; i < 14; i++) c.fillRect((i * 53 + 11) % 160, 20 + (i * 37) % 84, 1, 1);
    c.strokeStyle = INK.c; c.lineWidth = 1.5; c.beginPath(); c.arc(80, 62, 13, 0, 7); c.stroke();
    c.fillStyle = INK.g; c.beginPath(); c.arc(80, 62, 7, 0, 7); c.fill();
    const a = t * 1.4; c.strokeStyle = INK.w; c.lineWidth = 2; c.beginPath(); c.moveTo(80, 62); c.lineTo(80 + Math.cos(a) * 12, 62 + Math.sin(a) * 12); c.stroke();
    for (let i = 0; i < 4; i++) { const b = i * 1.7 + 0.4, d = 52 - ((t * 9 + i * 13) % 30), x = 80 + Math.cos(b) * d * 1.3, y = 62 + Math.sin(b) * d * 0.8; c.fillStyle = INK.m; c.fillRect(x - 6, y - 1, 12, 3); c.fillStyle = INK.c; c.fillRect(x - 3, y - 4, 6, 3); }
  }
  constructor(rnd = Math.random) {
    this.rnd = rnd; this.aim = -Math.PI / 2; this.shields = 3; this.wave = 0; this.score = 0; this.over = false; this.won = false; this.msg = ''; this.fx = [];
    this.ufos = []; this.shots = []; this.bangs = []; this.cool = 0; this.burst = 0; this.t = 0; this.flash = 0; this.rest = 1.2; this.queue = 0; this.gap = 0;
    this.stars = Array.from({ length: 40 }, (_, i) => [(i * 97 + 31) % W, (i * 61 + 17) % H, i % 3]);
  }
  // A wave: more of them each time, quicker, and from the third wave on some that take three hits.
  newWave() { this.wave++; this.queue = 4 + this.wave * 2; this.gap = 0.4; if (this.wave > 1) { this.score += 50; this.fx.push('good'); if (this.wave % 3 === 1 && this.shields < 3) this.shields++; } }
  // One saucer, on its way in from `dist` away at `angle` (a test may say exactly where and what).
  spawn(kind, angle = this.rnd() * Math.PI * 2, dist = 210) {
    const K = Outpost.KINDS[kind] || Outpost.KINDS.scout, k = 1 + Math.min(1.2, (this.wave - 1) * 0.09);
    const u = { kind: K === Outpost.KINDS[kind] ? kind : 'scout', x: Outpost.CX + Math.cos(angle) * dist, y: Outpost.CY + Math.sin(angle) * dist, r: K.r, hp: K.hp, v: K.v * k, pts: K.pts, wob: this.rnd() * 6 };
    this.ufos.push(u); return u;
  }
  fire() {
    if (this.over || this.cool > 0) return false;
    this.cool = 0.2; this.shots.push({ x: Outpost.CX + Math.cos(this.aim) * 14, y: Outpost.CY + Math.sin(this.aim) * 14, dx: Math.cos(this.aim), dy: Math.sin(this.aim) }); this.fx.push(880);
    return true;
  }
  press(k) { if (k === 'a') this.fire(); else if (k === 'left') this.aim -= 0.03; else if (k === 'right') this.aim += 0.03; }
  // A finger on the glass: the gun turns to it at once and fires, and goes on firing for a moment.
  point(x, y) { if (Math.hypot(x - Outpost.CX, y - Outpost.CY) > 6) this.aim = Math.atan2(y - Outpost.CY, x - Outpost.CX); this.fire(); this.burst = 0.3; }
  tap(x, y) { this.point(x, y); }
  drag(x, y) { this.point(x, y); }
  update(dt, held = {}) {
    if (this.over) return;
    this.t += dt; this.cool -= dt; this.burst -= dt; this.flash = Math.max(0, this.flash - dt);
    // The gun turns slowly at first and then quickly: a tap on a key is a fine adjustment, a held key swings it round.
    const turn = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    this.turning = turn && turn === this.turnWas ? this.turning + dt : 0; this.turnWas = turn;
    if (turn) this.aim += turn * (0.9 + 3.3 * Math.min(1, this.turning / 0.35)) * dt;
    if (held.a || this.burst > 0) this.fire();
    // The next of this wave, or the next wave once the sky is clear.
    if (this.queue > 0) {
      this.gap -= dt;
      if (this.gap <= 0) { const r = this.rnd(); this.spawn(this.wave >= 3 && r < 0.18 ? 'hulk' : this.wave >= 2 && r < 0.45 ? 'dart' : 'scout'); this.queue--; this.gap = Math.max(0.35, 1.5 - this.wave * 0.1) * (0.6 + this.rnd() * 0.8); }
    } else if (!this.ufos.length) { this.rest -= dt; if (this.rest <= 0) { this.newWave(); this.rest = 1.6; } }
    for (const s of this.shots) { s.x += s.dx * 270 * dt; s.y += s.dy * 270 * dt; }
    for (const u of this.ufos) {
      const dx = Outpost.CX - u.x, dy = Outpost.CY - u.y, d = Math.hypot(dx, dy) || 1;
      u.x += dx / d * u.v * dt; u.y += dy / d * u.v * dt;
      for (const s of this.shots) if (!s.dead && Math.hypot(s.x - u.x, s.y - u.y) < u.r + 4.5) { s.dead = true; u.hp--; if (u.hp <= 0) { u.dead = true; this.score += u.pts; this.fx.push('blip'); this.bangs.push({ x: u.x, y: u.y, t: 0.3 }); } else this.fx.push('hit'); break; }
      if (!u.dead && d < 15 + u.r * 0.5) {
        u.dead = true; this.shields--; this.flash = 0.35; this.fx.push('bad'); this.bangs.push({ x: u.x, y: u.y, t: 0.4 });
        if (this.shields <= 0) { this.over = true; this.msg = `The base is lost. Wave ${this.wave}.`; return; }
      }
    }
    this.ufos = this.ufos.filter(u => !u.dead);
    this.shots = this.shots.filter(s => !s.dead && s.x > -8 && s.x < W + 8 && s.y > -8 && s.y < H + 8);
    for (const b of this.bangs) b.t -= dt;
    this.bangs = this.bangs.filter(b => b.t > 0);
  }
  draw(c) {
    cls(c); const X = Outpost.CX, Y = Outpost.CY;
    for (const [x, y, k] of this.stars) { c.fillStyle = k ? INK.d : INK.w; c.fillRect(x, y, 1, 1); }
    text(c, 'SHIELDS ' + Math.max(0, this.shields), 6, 9, this.shields > 1 ? INK.g : INK.r, 10, 'left'); text(c, 'WAVE ' + Math.max(1, this.wave), 314, 9, INK.g, 10, 'right');
    for (let i = 0; i < this.shields; i++) { c.strokeStyle = this.flash > 0 ? INK.r : INK.c; c.globalAlpha = 0.35 + 0.2 * i; c.lineWidth = 1; c.beginPath(); c.arc(X, Y, 13 + i * 3, 0, 7); c.stroke(); }
    c.globalAlpha = 1;
    c.fillStyle = this.flash > 0 ? INK.r : INK.g; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + this.t * 0.3; c[i ? 'lineTo' : 'moveTo'](X + Math.cos(a) * 9, Y + Math.sin(a) * 9); } c.fill();
    c.strokeStyle = INK.w; c.lineWidth = 3; c.beginPath(); c.moveTo(X, Y); c.lineTo(X + Math.cos(this.aim) * 15, Y + Math.sin(this.aim) * 15); c.stroke();
    c.fillStyle = INK.bg; c.fillRect(X - 2, Y - 2, 4, 4);
    for (const u of this.ufos) {
      const r = u.r, wob = Math.sin(this.t * 6 + u.wob) * 1.2;
      c.fillStyle = u.kind === 'hulk' ? INK.r : u.kind === 'dart' ? INK.a : INK.m; c.beginPath(); c.ellipse(u.x, u.y + wob, r * 1.25, r * 0.45, 0, 0, 7); c.fill();
      c.fillStyle = INK.c; c.beginPath(); c.arc(u.x, u.y + wob - r * 0.25, r * 0.5, Math.PI, 0); c.fill();
      if (u.kind === 'hulk') { c.fillStyle = INK.bg; for (let i = 0; i < u.hp; i++) c.fillRect(u.x - 6 + i * 5, u.y + wob - 1, 3, 2); }
    }
    c.fillStyle = INK.w; for (const s of this.shots) c.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
    for (const b of this.bangs) { c.strokeStyle = INK.a; c.lineWidth = 1; c.beginPath(); c.arc(b.x, b.y, (0.42 - b.t) * 40, 0, 7); c.stroke(); }
    if (!this.wave && !this.over) text(c, 'THEY ARE COMING', 160, 60, INK.a, 12);
  }
}

// One to a monitor, in the order of ARCADE_ROOMS in src/furnish.js.
export const GAMES = [Snake, Mines, Paddles, Bricks, Blocks, StarGuard, Twice, LampsOut, Echo, Noughts];
export { banner, text, cls, INK };
