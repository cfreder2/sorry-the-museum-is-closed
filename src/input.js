// Two sticks, however you hold them: keys, a gamepad, or thumbs on glass.
//
// Everything is reduced to a left stick and a right stick, laid out like a toy
// transmitter. Car: left stick up/down is the throttle, right stick left/right
// steers. Drone: left stick climbs and turns, right stick flies.

const KEYS = {
  look: ['KeyE', 'Enter', 'KeyF'], camera: ['KeyC'], swap: ['KeyV'], pause: ['Escape', 'KeyP'],
  reset: ['KeyR'], mute: ['KeyM'], notebook: ['KeyN'], lights: ['KeyL'],
};

export class Input {
  constructor(surface) {
    this.surface = surface;
    this.down = new Set();
    this.queue = new Set();          // actions pressed since the last frame
    this.touch = { l: null, r: null };
    this.sticks = { lx: 0, ly: 0, rx: 0, ry: 0 };
    this.usedTouch = false;
    this.capture = false;            // true while driving: arrows and space belong to the game, not the page
    this.hold = false;               // 'hold my speed' setting
    this.latched = false;
    this.onGesture = null;           // called on any lift or key, to unlock sound
    this._pad = {};

    addEventListener('keydown', e => {
      const ours = this.capture && (e.code.startsWith('Arrow') || e.code === 'Space');
      if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;      // a slider or tick box has the keys
      if (e.repeat) { if (ours) e.preventDefault(); return; }
      this.down.add(e.code);
      for (const [a, codes] of Object.entries(KEYS)) if (codes.includes(e.code)) this.queue.add(a);
      this.queue.add('any');
      if (ours) e.preventDefault();
      if (this.onGesture) this.onGesture();
    });
    addEventListener('keyup', e => this.down.delete(e.code));
    const release = () => { this.down.clear(); this.touch.l = this.touch.r = null; };
    addEventListener('blur', release);
    addEventListener('pagehide', release);
    document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });

    // Inside an iframe (itch.io) a click must be allowed to bring focus with it.
    addEventListener('pointerdown', () => { if (!document.hasFocus()) window.focus(); });
    addEventListener('pointerup', () => { if (this.onGesture) this.onGesture(); });

    // Thumbs. Touch events rather than pointer events, and not passive, so iOS
    // keeps its loupe and its scrolling to itself.
    const R = 58;
    const start = e => {
      e.preventDefault();
      this.usedTouch = true;
      for (const t of e.changedTouches) {
        const side = t.clientX < innerWidth / 2 ? 'l' : 'r';
        if (!this.touch[side]) this.touch[side] = { id: t.identifier, ox: t.clientX, oy: t.clientY, x: 0, y: 0 };
      }
      this._reconcile(e);
    };
    const move = e => {
      e.preventDefault();
      for (const t of e.changedTouches) for (const side of ['l', 'r']) {
        const s = this.touch[side];
        if (!s || s.id !== t.identifier) continue;
        let dx = (t.clientX - s.ox) / R, dy = (t.clientY - s.oy) / R;
        const l = Math.hypot(dx, dy);
        if (l > 1) { dx /= l; dy /= l; s.ox = t.clientX - dx * R; s.oy = t.clientY - dy * R; }
        s.x = dx; s.y = -dy;
      }
      this._reconcile(e);
    };
    const end = e => {
      e.preventDefault();
      for (const t of e.changedTouches) for (const side of ['l', 'r']) if (this.touch[side] && this.touch[side].id === t.identifier) this.touch[side] = null;
      this._reconcile(e);
      if (this.onGesture) this.onGesture();
    };
    const opt = { passive: false };
    surface.addEventListener('touchstart', start, opt);
    surface.addEventListener('touchmove', move, opt);
    surface.addEventListener('touchend', end, opt);
    surface.addEventListener('touchcancel', end, opt);
  }

  // A finger the system took without telling us is let go at the next event.
  _reconcile(e) {
    const live = new Set(Array.from(e.touches, t => t.identifier));
    for (const side of ['l', 'r']) if (this.touch[side] && !live.has(this.touch[side].id)) this.touch[side] = null;
  }

  press(action) { this.queue.add(action); }
  took(action) { const had = this.queue.has(action); this.queue.delete(action); return had; }
  endFrame() { this.queue.clear(); }

  _axis(neg, pos) {
    const d = this.down;
    return (pos.some(k => d.has(k)) ? 1 : 0) - (neg.some(k => d.has(k)) ? 1 : 0);
  }

  // Reads everything into the two sticks. `drone` picks the key layout.
  read(drone) {
    let lx = 0, ly = 0, rx = 0, ry = 0, trig = 0;
    if (drone) {
      ry = this._axis(['KeyS'], ['KeyW']);
      lx = this._axis(['KeyA'], ['KeyD']);
      rx = this._axis(['ArrowLeft', 'KeyQ'], ['ArrowRight']);
      ly = this._axis(['ArrowDown', 'ShiftLeft', 'ShiftRight'], ['ArrowUp', 'Space']);
    } else {
      ly = this._axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']);
      rx = this._axis(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']);
    }
    const dz = v => (Math.abs(v) < 0.14 ? 0 : (v - Math.sign(v) * 0.14) / 0.86);
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p || !p.connected) continue;
      const a = p.axes, b = p.buttons;
      const glx = dz(a[0] || 0), gly = -dz(a[1] || 0), grx = dz(a[2] || 0), gry = -dz(a[3] || 0);
      if (Math.abs(glx) > Math.abs(lx)) lx = glx;
      if (Math.abs(gly) > Math.abs(ly)) ly = gly;
      if (Math.abs(grx) > Math.abs(rx)) rx = grx;
      if (Math.abs(gry) > Math.abs(ry)) ry = gry;
      trig = (b[7] ? b[7].value : 0) - (b[6] ? b[6].value : 0);
      const map = { 0: 'look', 3: 'camera', 2: 'swap', 9: 'pause', 8: 'notebook', 1: 'reset' };
      for (const [i, act] of Object.entries(map)) {
        const on = b[i] && b[i].pressed;
        if (on && !this._pad[i]) { this.queue.add(act); this.queue.add('any'); if (this.onGesture) this.onGesture(); }
        this._pad[i] = on;
      }
      break;
    }
    const tl = this.touch.l, tr = this.touch.r;
    if (tl) { lx = tl.x; ly = tl.y; }
    if (tr) { rx = tr.x; ry = tr.y; }
    if (!drone) {
      if (Math.abs(trig) > Math.abs(ly)) ly = trig;
      if (Math.abs(lx) > Math.abs(rx) && !tl) rx = lx;       // pad players who steer on the left stick
      lx = 0; ry = 0;
    }
    // Hold my speed: push forward once and it stays pushed, pull back once to let go.
    if (this.hold) {
      const fwd = drone ? ry : ly;
      if (fwd > 0.6) this.latched = true; else if (fwd < -0.3) this.latched = false;
      if (this.latched && fwd === 0) { if (drone) ry = 0.8; else ly = 0.8; }
    } else this.latched = false;
    const s = this.sticks;
    s.lx = lx; s.ly = ly; s.rx = rx; s.ry = ry;
    return drone
      ? { pitch: ry, roll: rx, yaw: lx, climb: ly }
      : { throttle: ly, steer: rx };
  }
}
