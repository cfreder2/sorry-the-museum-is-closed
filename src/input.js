// Two sticks, however you hold them: keys or a gamepad. On glass it is simpler:
// one thumbstick under the left thumb drives, and JUMP is under the right.
//
// Everything is reduced to a left stick and a right stick, laid out like a toy
// transmitter. Car: left stick up/down is the throttle, right stick left/right
// steers. Drone: left stick climbs and turns, right stick flies.

const KEYS = {
  look: ['KeyE', 'Enter', 'KeyF'], info: ['KeyI'], camera: ['KeyC'], swap: ['KeyV'], pause: ['Escape', 'KeyP'],
  reset: ['KeyR'], notebook: ['KeyN'], lights: ['KeyL'], map: ['KeyM', 'Tab', 'KeyG'],      // (music is in Settings, not on a key)
};
// A gamepad's buttons while driving, by their numbers in the standard layout. A looks closer, B stops the toy (and steps
// back from a work or a board), X swaps toys, Y is the camera, View is the notebook, Menu pauses; on the D-pad, up is
// the map, down the lights, left a work's label. The bumpers jump and the triggers are the pedals (see read). The
// stick clicks do nothing: a thumb leaning hard on a stick presses them without meaning to.
// ('left' and 'right': the D-pad as it lies, for the one thing played with it while driving, the five pads of src/finalelaunch.js)
const PAD = { 0: ['look'], 1: ['reset', 'back'], 2: ['swap'], 3: ['camera'], 8: ['notebook'], 9: ['pause'], 12: ['map'], 13: ['lights'], 14: ['info', 'left'], 15: ['right'] };
// Anywhere else (a menu, a card table, an arcade cabinet) the pad is a keyboard, so whatever works with keys works with
// it: the D-pad or the left stick are the arrows, A is Enter, B and Menu are Escape, X and Y the two spare buttons.
const PADKEY = { 0: 'Enter', 1: 'Escape', 2: 'KeyF', 3: 'Space', 9: 'Escape', 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight' };

export class Input {
  constructor(surface) {
    this.surface = surface;
    this.down = new Set();
    this.at = new Map();             // when each key held was pressed: of two opposite keys, the later one wins
    this._n = 0;
    this.queue = new Set();          // actions pressed since the last frame
    this.touch = { l: null, r: null };
    this.sticks = { lx: 0, ly: 0, rx: 0, ry: 0 };
    // A phone or tablet is known for what it is from the start, and any touch anywhere confirms it.
    this.usedTouch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    this.pad = false;                // a gamepad is what was used last: the prompts name its buttons, and the glass controls go
    document.addEventListener('touchstart', () => { this.usedTouch = true; this.pad = false; document.body.classList.add('touch'); }, { passive: true, capture: true });
    if (this.usedTouch) document.body.classList.add('touch');
    this.capture = false;            // true while driving: arrows and space belong to the game, not the page
    this.hold = false;               // 'hold my speed' setting
    this.latched = false;
    this.autogo = false;             // 'drive for me' setting: on glass, a thumb on the stick is the throttle
    this.btn = { jump: false, up: false, down: false, brake: false };     // on-screen buttons being held
    this._ids = { jump: new Set(), up: new Set(), down: new Set(), brake: new Set() };
    this._btnAt = { jump: 0, up: 0, down: 0, brake: 0 };                  // when each was pressed (UP and DOWN both held: the later wins)
    this._mouse = { jump: false, up: false, down: false, brake: false };  // held with a mouse, not a finger
    this._live = {};                 // gamepad axes seen at rest, and so to be believed (see read)
    this.thumb = { x: 0, y: 0, ox: 0, oy: 0, on: false };                // where the thumbstick is, for drawing it
    this._jump = false;
    this.onGesture = null;           // called on any lift or key, to unlock sound
    this.padBtn = -1;
    this._pad = {};                  // which of the pad's buttons are down, and
    this._padKey = {};               // which of them is holding a key down (see poll)

    addEventListener('keydown', e => {
      if (!this._synth) this.pad = false;
      const ours = this.capture && (e.code.startsWith('Arrow') || e.code === 'Space' || e.code === 'Tab');      // (Tab opens the map, not the next button)
      if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;      // a slider or tick box has the keys
      if (!this._synth && this.usedTouch) { this.usedTouch = false; document.body.classList.remove('touch'); }      // a key takes the prompts back from the glass, as it does from a pad (one tap on a touch-screen laptop left the thumb controls up for the session); the next touch gives them back
      this._mods(e);
      if (e.repeat) { if (ours) e.preventDefault(); return; }
      this.down.add(e.code); this.at.set(e.code, ++this._n);
      for (const [a, codes] of Object.entries(KEYS)) if (codes.includes(e.code)) this.queue.add(a);
      this.queue.add('any');
      if (ours) e.preventDefault();
      if (this.onGesture) this.onGesture();
    });
    addEventListener('keyup', e => {
      this.down.delete(e.code);
      // On a Mac no key lets go while Command is held: whatever went down meanwhile is still 'down'. Let go of the lot.
      if (e.code === 'MetaLeft' || e.code === 'MetaRight') this.down.clear();
      this._mods(e);
    });
    // Shift is a key of its own here (the drone's DOWN), and its own let-go is easily lost to the system (a screenshot,
    // a shortcut, a dialog). Every key and pointer event says whether it is really held.
    addEventListener('pointermove', e => this._mods(e), { passive: true });
    addEventListener('pointerdown', e => this._mods(e), { passive: true });
    const release = () => {
      this.down.clear(); this.touch.l = this.touch.r = null;
      for (const k in this._ids) { this._ids[k].clear(); this._mouse[k] = false; this.btn[k] = false; }
    };
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
      this._reconcile(e);              // (first: a thumb the system took without a touchend is let go before the new one is looked at, or the new one was refused once)
      // One thumbstick, wherever the left thumb comes down. The right side of the glass is for the buttons.
      for (const t of e.changedTouches) {
        if (t.clientX < innerWidth * 0.6 && !this.touch.l) this.touch.l = { id: t.identifier, ox: t.clientX, oy: t.clientY, x: 0, y: 0 };
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
    // A button let go of anywhere on the page is let go of; and a finger the system took without telling us (no touchend
    // ever came) is let go of the next time any finger comes down or moves, not only when one lifts.
    const lift = e => {
      const live = new Set(Array.from(e.touches, t => t.identifier));
      for (const k in this._ids) { for (const id of this._ids[k]) if (!live.has(id)) this._ids[k].delete(id); this.btn[k] = this._ids[k].size > 0 || this._mouse[k]; }
    };
    const cap = { passive: true, capture: true };
    document.addEventListener('touchstart', lift, cap);
    document.addEventListener('touchmove', lift, cap);
    document.addEventListener('touchend', lift, opt);
    document.addEventListener('touchcancel', lift, opt);
    // And a mouse button let go of anywhere is let go of.
    addEventListener('mouseup', () => { for (const k in this._mouse) if (this._mouse[k]) { this._mouse[k] = false; this.btn[k] = this._ids[k].size > 0; } });
  }

  // What the modifier keys really are, from any event that says.
  _mods(e) {
    if (!e.shiftKey && e.code !== 'ShiftLeft' && e.code !== 'ShiftRight') { this.down.delete('ShiftLeft'); this.down.delete('ShiftRight'); }
  }

  // A finger the system took without telling us is let go at the next event.
  _reconcile(e) {
    const live = new Set(Array.from(e.touches, t => t.identifier));
    for (const side of ['l', 'r']) if (this.touch[side] && !live.has(this.touch[side].id)) this.touch[side] = null;
  }

  // Make an element a button that is held down: jump, up, down.
  bind(el, name) {
    const opt = { passive: false };
    el.addEventListener('touchstart', e => { e.preventDefault(); this.usedTouch = true; for (const t of e.changedTouches) this._ids[name].add(t.identifier); this.btn[name] = true; this._btnAt[name] = ++this._n; }, opt);
    el.addEventListener('touchend', e => { e.preventDefault(); for (const t of e.changedTouches) this._ids[name].delete(t.identifier); this.btn[name] = this._ids[name].size > 0 || this._mouse[name]; if (this.onGesture) this.onGesture(); }, opt);
    el.addEventListener('touchcancel', e => { for (const t of e.changedTouches) this._ids[name].delete(t.identifier); this.btn[name] = this._ids[name].size > 0 || this._mouse[name]; }, opt);
    el.addEventListener('mousedown', () => { this._mouse[name] = true; this.btn[name] = true; this._btnAt[name] = ++this._n; });
    for (const ev of ['mouseup', 'mouseleave']) el.addEventListener(ev, () => { this._mouse[name] = false; if (!this._ids[name].size) this.btn[name] = false; });
  }

  press(action) { this.queue.add(action); }
  took(action) { const had = this.queue.has(action); this.queue.delete(action); return had; }
  endFrame() { this.queue.clear(); }

  // Of two opposite keys both held, the one pressed later counts: a key whose let-go was lost never locks out the other.
  _axis(neg, pos) {
    let p = 0, n = 0;
    for (const k of pos) if (this.down.has(k)) p = Math.max(p, this.at.get(k) || 1);
    for (const k of neg) if (this.down.has(k)) n = Math.max(n, this.at.get(k) || 1);
    return p > n ? 1 : n > p ? -1 : 0;
  }

  // The left stick as it lies, for aiming rather than driving (the derby's bat, src/ballpark.js): the arrows or WASD, a
  // pad's stick, the thumb on glass. No throttle curve, no 'hold my speed', no 'drive for me'. (read() is called every
  // frame first, and it is what learns which pad axes can be believed.)
  aim() {
    let x = this._axis(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']), y = this._axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']);
    const dz = v => (Math.abs(v) < 0.14 ? 0 : (v - Math.sign(v) * 0.14) / 0.86);
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p || !p.connected) continue;
      const ax = i => (this._live[p.index + ':' + i] ? p.axes[i] || 0 : 0);
      for (const [gx, gy] of [[dz(ax(0)), -dz(ax(1))], [dz(ax(2)), -dz(ax(3))]]) { if (Math.abs(gx) > Math.abs(x)) x = gx; if (Math.abs(gy) > Math.abs(y)) y = gy; }
      break;
    }
    const t = this.touch.l; if (t) { x = t.x; y = t.y; }
    return { x, y };
  }

  // The pad to read: the first one laid out the standard way, or failing that the first there is.
  _first() {
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(p => p && p.connected) : [];
    return pads.find(p => p.mapping === 'standard') || pads[0] || null;
  }

  // An axis counts only once it has been seen at rest. Some things that call themselves gamepads (pedals, a wheel, a
  // flight stick's throttle, odd USB receivers) have axes that sit at one end: read as a stick, held down for ever.
  _ax(p, i) { const v = p.axes[i] || 0, key = p.index + ':' + i; if (Math.abs(v) < 0.3) this._live[key] = true; return this._live[key] ? v : 0; }

  // The pad's buttons, every frame, whatever is on the screen (main.js: tick). Driving, each is an action (PAD). Anywhere
  // else each is a key (PADKEY), and what a keyboard's own keys would then have done is done here: an arrow nothing
  // wanted moves on to the next thing that can be pressed, and A presses it.
  poll(driving) {
    const p = this._first();
    // (A pad unplugged with a button held in a menu: the key it was holding down is let go, or the car drove on resume until that key was tapped.)
    if (!p) { for (const i in this._padKey) if (this._padKey[i]) { this._padKey[i] = false; this._key('keyup', PADKEY[i < 17 ? i : i - 5]); } for (const i in this._pad) this._pad[i] = false; return; }
    const b = p.buttons, sx = this._ax(p, 0), sy = this._ax(p, 1);
    // (17 to 20: the left stick pushed up, down, left, right, as a second D-pad for the menus)
    const on = i => (i < 17 ? !!(b[i] && b[i].pressed) : i === 17 ? sy < -0.6 : i === 18 ? sy > 0.6 : i === 19 ? sx < -0.6 : sx > 0.6);
    // (Taken up, not held: a wheel or a throttle that calls itself a gamepad can sit with a button down for ever, and
    // must not go on taking the prompts back from somebody at the keyboard.)
    const busy = b.some(x => x && x.pressed) || [0, 1, 2, 3].some(i => Math.abs(this._ax(p, i)) > 0.5);
    if (busy && !this._busy) { this.pad = true; this.usedTouch = false; }
    this._busy = busy;
    for (let i = 0; i < 21; i++) {
      const is = on(i), code = PADKEY[i < 17 ? i : i - 5];
      if (is === !!this._pad[i]) continue;
      this._pad[i] = is;
      if (!is) { if (this._padKey[i]) { this._padKey[i] = false; this._key('keyup', code); } continue; }
      if (i < 17 && this.onGesture) this.onGesture();
      if (driving) { if (PAD[i]) { for (const a of PAD[i]) this.queue.add(a); this.queue.add('any'); } continue; }
      if (!code) continue;
      this._padKey[i] = true;
      const el = document.activeElement;
      if (!this._key('keydown', code, i)) continue;          // something took the key
      if (i === 0) { if (el && el.matches('button, a[href], input[type=checkbox]')) { el.click(); this.queue.delete('look'); } }      // (pressed a button: not also a look at whatever is near)
      else if (code.startsWith('Arrow')) this._move(el, code);
    }
  }

  // A key pressed without a keyboard. Says whether nothing took it. (padBtn: which of the pad's buttons it is, for the
  // one listener that cares: B and Menu are both Escape, and only Menu skips the opening, src/opening.js.)
  _key(type, code, btn = -1) {
    this._synth = true; this.padBtn = btn;
    const free = (document.activeElement || document.body).dispatchEvent(new KeyboardEvent(type, { code, key: code === 'Space' ? ' ' : code === 'KeyF' ? 'f' : code, bubbles: true, cancelable: true }));
    this._synth = false; this.padBtn = -1;
    return free;
  }

  // An arrow from the pad: left and right work a slider; otherwise on to the next button of whatever is open.
  _move(el, code) {
    const fwd = code === 'ArrowDown' || code === 'ArrowRight';
    if (el && el.type === 'range' && (code === 'ArrowLeft' || code === 'ArrowRight')) { if (fwd) el.stepUp(); else el.stepDown(); el.dispatchEvent(new Event('input', { bubbles: true })); return; }
    const open = [...document.querySelectorAll('.screen, [aria-modal="true"]')].filter(d => d.getClientRects().length).pop();
    const all = [...(open || document.body).querySelectorAll('button, input, select, a[href]')].filter(c => !c.disabled && c.getClientRects().length && (open || !c.closest('#hud')));
    const i = all.indexOf(el);
    if (all.length) all[i < 0 ? 0 : (i + (fwd ? 1 : all.length - 1)) % all.length].focus();
  }

  // Reads everything into the two sticks. `drone` picks the key layout.
  read(drone) {
    let lx = 0, ly = 0, rx = 0, ry = 0, trig = 0, coast = false;
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
    const p = this._first();
    if (p) {
      const b = p.buttons, a = [0, 1, 2, 3].map(i => this._ax(p, i));
      trig = (b[7] ? b[7].value : 0) - (b[6] ? b[6].value : 0);
      if (Math.abs(trig) < 0.06) trig = 0;
      // Driven like a driving game (a trigger pulled), the left stick only steers: a thumb steering hard is not also
      // asking for the brake. Driven like a transmitter (the right stick steering), the left stick is the throttle again.
      const grx = dz(a[2]);
      if (trig) this._pedals = true; else if (Math.abs(grx) > 0.5) this._pedals = false;
      const glx = dz(a[0]), gly = this._pedals && !drone ? 0 : -dz(a[1]), gry = -dz(a[3]);
      if (Math.abs(glx) > Math.abs(lx)) lx = glx;
      if (Math.abs(gly) > Math.abs(ly)) ly = gly;
      if (Math.abs(grx) > Math.abs(rx)) rx = grx;
      if (Math.abs(gry) > Math.abs(ry)) ry = gry;
    }
    // Glass: one thumbstick drives the car.
    // For the drone the stick flies and turns, and UP and DOWN are buttons.
    const tl = this.touch.l, b = this.btn;
    this.thumb.on = !!tl;
    if (tl) { this.thumb.x = tl.x; this.thumb.y = tl.y; this.thumb.ox = tl.ox; this.thumb.oy = tl.oy; } else this.thumb.x = this.thumb.y = 0;
    if (this.usedTouch) {
      const curve = v => Math.sign(v) * Math.pow(Math.abs(v), 1.35);
      if (drone) {
        if (tl) { ry = tl.y; lx = curve(tl.x); }
        if (b.up || b.down) ly = b.up && (!b.down || this._btnAt.up > this._btnAt.down) ? 1 : -1;
      } else {
        // The stick is the whole car: push it forward to go (the further, the faster), pull it
        // back to brake and then reverse, lean it to steer. Leaning hard does not count as pulling back.
        // Or, with 'drive for me' on: a thumb on the stick is the throttle. It goes while you hold, you
        // slide left and right to steer, it stops when you let go, and pulling back backs it up.
        if (this.autogo) {
          if (tl) { rx = curve(tl.x); ly = tl.y < -0.35 ? (tl.y + 0.35) / 0.65 : 0.45 + 0.55 * Math.max(0, (tl.y - 0.1) / 0.9); }       // thumb down is an easy pace; forward is faster; back brakes and then reverses
          coast = !tl && !ly && !trig;       // (no thumb on the glass, and nothing held on a keyboard or a pad either)
        } else if (tl) { rx = curve(tl.x); ly = tl.y > 0.15 ? (tl.y - 0.15) / 0.85 : tl.y < -0.4 ? (tl.y + 0.4) / 0.6 : 0; }
      }
    }
    let held = this.down.has('Space') || this.btn.jump;
    if (p) held = held || !!(p.buttons[5] && p.buttons[5].pressed) || !!(p.buttons[4] && p.buttons[4].pressed);
    const jump = held && !this._jump;
    this._jump = held;
    if (Math.abs(trig) > Math.abs(ly)) ly = trig;                        // the triggers: go and brake, or up and down
    if (!drone) {
      if (Math.abs(lx) > Math.abs(rx) && !this.usedTouch) rx = lx;       // pad players who steer on the left stick
      lx = 0; ry = 0;
    }
    // Hold my speed: push forward once and it stays pushed, pull back once to let go.
    if (this.hold && !(this.autogo && this.usedTouch && !drone)) {
      const fwd = drone ? ry : ly;
      if (fwd > 0.6) this.latched = true; else if (fwd < -0.3) this.latched = false;
      if (this.latched && fwd === 0) { if (drone) ry = 0.8; else ly = 0.8; }
    } else this.latched = false;
    const s = this.sticks;
    s.lx = lx; s.ly = ly; s.rx = rx; s.ry = ry;
    return drone
      ? { pitch: ry, roll: rx, yaw: lx, climb: ly }
      : { throttle: ly, steer: rx, jump, trick: held, coast };
  }
}
