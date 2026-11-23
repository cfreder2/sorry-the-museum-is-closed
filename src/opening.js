// The cold open: five or six seconds before a new game hands over the toy. The museum at night across Michigan Avenue,
// the lights in its windows going out one by one; the sign on the front door; then the camera swoops down to the toy on
// the front terrace, its headlights click on, and it is yours.
//
// New games only (main.js decides: never on Continue, never with ?mode, ?voyage or ?noopen). Any key, click or tap skips
// it. With Reduce motion the camera does not move: three still shots, cut together, and the lights fade rather than snap.
//
// Nothing here is part of the building: the lit panes are laid in front of the wings' dark windows (src/grounds.js draws
// those) for the length of the open, and taken away again after it.
//
//   const opening = new Opening(G, { THREE, scene, camera, sound });
//   opening.begin(done)      starts it; done(seconds it took) once control is handed over (or at once if it cannot run)
//   opening.frame(dt)        each frame while G.state === 'opening'
//   opening.hold = t         (tests) stop the clock at t seconds

const LEN = 5.6, CALM_LEN = 4.4;
const ease = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const lerp = (a, b, t) => a + (b - a) * t;

export class Opening {
  constructor(G, { THREE, scene, camera, sound }) {
    this.G = G; this.THREE = THREE; this.scene = scene; this.camera = camera; this.sound = sound;
    this.on = false; this.hold = null; this.t = 0;
    this._skip = e => {
      if (!this.on) return;
      if (e.type === 'keydown' && (e.repeat || ['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key))) return;
      // (No preventDefault: on a pointerdown it would cancel the focus a click gives, and in itch's frame the keys would never arrive.)
      if (e.type !== 'keydown' && !document.hasFocus()) window.focus();
      this.finish(true);
    };
  }

  /** Lit panes in front of every window of the two wings: [{ mesh, at }] in the order they go out. */
  _panes() {
    const THREE = this.THREE, F = this.G.plan.facade, g = new THREE.Group(); g.name = 'opening-panes';
    const geo = new THREE.PlaneGeometry(2.36, 3.66).rotateY(-Math.PI / 2);      // facing the avenue (-x)
    const list = [];
    for (const [a, b] of [[F.z0, F.cz - F.half], [F.cz + F.half, F.z1]]) {
      const n = Math.max(3, Math.round((b - a) / 5.0)), step = (b - a) / n;       // as the wings are drawn (src/grounds.js)
      for (let i = 0; i < n; i++) {
        const zc = a + step * (i + 0.5), warm = 0.85 + ((i * 7 + Math.round(a)) % 5) * 0.04;
        const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0 * warm, 0.62 * warm, 0.3 * warm).multiplyScalar(0.92), transparent: true, depthWrite: false, fog: true });
        const m = new THREE.Mesh(geo, mat); m.position.set(F.FX + 0.24, 4.05, zc); m.renderOrder = 2;      // 4 cm in front of the dark glass
        g.add(m); list.push({ mesh: m, z: zc });
      }
    }
    // Out from the far ends towards the door, the two wings in turn, as a guard going round would switch them off.
    list.sort((p, q) => Math.abs(q.z - F.cz) - Math.abs(p.z - F.cz));
    const calm = !!this.G.set.reduce, t0 = 0.35, t1 = 2.0;
    list.forEach((p, i) => { p.at = t0 + (t1 - t0) * i / Math.max(1, list.length - 1) + (calm ? 0 : (i % 3) * 0.03); p.off = false; });
    this.scene.add(g);
    this.group = g; this.geo = geo;
    return list;
  }

  _overlay() {
    if (this.el) return this.el;
    const st = document.createElement('style');
    st.textContent = `#opening { position: fixed; inset: 0; z-index: 30; pointer-events: none; }
#opening i { position: absolute; left: 0; right: 0; height: 9vh; background: #000; transition: transform .6s ease; }
#opening i.t { top: 0; } #opening i.b { bottom: 0; }
#opening.out i.t { transform: translateY(-100%); } #opening.out i.b { transform: translateY(100%); }
#opening .skip { position: absolute; right: max(18px, env(safe-area-inset-right)); bottom: calc(9vh + 10px); font: 11px var(--mono, monospace); letter-spacing: .14em; text-transform: uppercase; color: var(--gilt-dim, #a8966a); opacity: 0; transition: opacity .6s ease; text-shadow: 0 1px 4px #000; }
#opening .skip.on { opacity: .85; }
.reduce #opening i, .reduce #opening .skip { transition: none; }`;
    document.head.append(st);
    const el = this.el = document.createElement('div'); el.id = 'opening'; el.hidden = true; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<i class="t"></i><i class="b"></i><div class="skip"></div>';
    document.body.append(el);
    return el;
  }

  begin(done) {
    const G = this.G;
    if (this.on || !G.plan || !G.plan.facade || !G.vehicle) { done(0); return; }
    this.done = done; this.on = true; this.t = 0; this.last = 0;
    this.calm = !!G.set.reduce; this.len = this.calm ? CALM_LEN : LEN;
    this.panes = this._panes();
    const el = this._overlay(); el.hidden = false; el.classList.remove('out');
    const touch = G.input && G.input.usedTouch || matchMedia('(pointer: coarse)').matches;
    el.querySelector('.skip').textContent = touch ? 'Tap to skip' : 'Any key to skip';
    el.querySelector('.skip').classList.remove('on');
    G.lampOn = false; if (G.lamp) G.lamp.intensity = 0;
    // Where it all ends: exactly where the camera behind the toy will be (main.js, chase), so the hand-over does not jump.
    const v = G.vehicle, fx = Math.sin(v.yaw), fz = Math.cos(v.yaw), drone = v.kind === 'drone';
    this.endAt = new this.THREE.Vector3(v.pos.x - fx * (drone ? 1.35 : 1.3), v.pos.y + (drone ? 0.34 : 0.46), v.pos.z - fz * (drone ? 1.35 : 1.3));
    this.endLook = new this.THREE.Vector3(v.pos.x + fx * 2.2, v.pos.y + (drone ? 0 : 0.42), v.pos.z + fz * 2.2);
    this.toy = v.pos.clone();
    this._look = new this.THREE.Vector3(); this._at = new this.THREE.Vector3();
    for (const k of ['keydown', 'pointerdown']) addEventListener(k, this._skip, { capture: true });
    this.frame(0);
  }

  // The camera at time t: where it is, what it looks at, how wide.
  _shot(t) {
    const G = this.G, F = G.plan.facade, d = G.plan.front, cz = F.cz, sign = { x: d.x0 - 0.22, y: 2.0, z: (d.z0 + d.z1) / 2 };
    const A = { at: [-22, 6.4, cz + 4], look: [F.FX, 7.2, cz], fov: 56 };
    const A2 = { at: [-17.5, 5.6, cz + 2.5], look: [F.FX, 6.6, cz], fov: 56 };
    const S = { at: [sign.x - 2.4, 2.25, sign.z - 0.9], look: [sign.x, sign.y, sign.z], fov: 46 };
    const S2 = { at: [sign.x - 2.0, 2.2, sign.z - 0.7], look: [sign.x, sign.y, sign.z], fov: 46 };
    const T = this.toy, U = { at: [T.x - 3.0, T.y + 2.8, T.z - 1.0], look: [T.x + 0.6, T.y + 0.15, T.z], fov: 58 };
    const E = { at: this.endAt.toArray(), look: this.endLook.toArray(), fov: 70 };
    const mix = (p, q, k) => ({ at: p.at.map((v, i) => lerp(v, q.at[i], k)), look: p.look.map((v, i) => lerp(v, q.look[i], k)), fov: lerp(p.fov, q.fov, k) });
    if (this.calm) return t < 2.4 ? A : t < 3.6 ? S : E;                                          // three still shots, cut
    if (t < 2.4) return mix(A, A2, ease(t / 2.4) * 0.9 + t / 2.4 * 0.1);                         // a slow push in, the lights going out
    if (t < 3.5) { const k = ease((t - 2.4) / 1.1); const m = mix(A2, S, k); m.at[1] += Math.sin(k * Math.PI) * 4; return m; }       // across the avenue to the door, in an arc
    if (t < 4.1) return mix(S, S2, (t - 3.5) / 0.6);                                              // the sign
    if (t < 4.85) return mix(S2, U, ease((t - 4.1) / 0.75));                                      // up and over, looking down at the toy
    return mix(U, E, ease((t - 4.85) / 0.6));                                                     // and down behind it
  }

  frame(dt) {
    if (!this.on) return;
    // On the wall clock, not the game's (which is capped at 50 ms a frame): on a slow phone it still lasts five seconds.
    const now = performance.now(); this.t += Math.min(0.25, Math.max(dt, (now - (this.last || now)) / 1000)); this.last = now;
    const G = this.G, t = this.hold != null ? this.hold : this.t;
    // The lights go out.
    for (const p of this.panes) {
      const k = this.calm ? Math.max(0, Math.min(1, (t - p.at) / 0.35)) : t >= p.at ? Math.min(1, (t - p.at) / 0.09) : 0;
      p.mesh.material.opacity = 1 - k; p.mesh.visible = k < 1;
      if (k > 0 && !p.off) { p.off = true; if (this.hold == null) this.sound.tick(0.035, 240, 0.05); }
    }
    // The headlights, a moment before the hand-over.
    const lampT = this.len - (this.calm ? 0.5 : 0.6);
    if (t >= lampT && !G.lampOn) {
      G.lampOn = true; if (G.lamp) G.lamp.intensity = 70;
      const b = document.getElementById('bLights'); if (b) b.setAttribute('aria-pressed', 'true');
      if (this.hold == null) { this.sound.tick(0.08, 2200, 0.03); this.sound.tick(0.05, 1400, 0.03, 0.05); }
    }
    if (t > 0.6) this.el.querySelector('.skip').classList.add('on');
    if (t > this.len - 0.7) this.el.classList.add('out');
    const s = this._shot(t), cam = this.camera;
    cam.position.fromArray(s.at); cam.up.set(0, 1, 0); cam.lookAt(this._look.fromArray(s.look));
    if (Math.abs(cam.fov - s.fov) > 0.01) { cam.fov = s.fov; cam.updateProjectionMatrix(); }
    // The world goes on round it, as on the title screen.
    if (G.museum) { G.museum.update(dt, cam.position, null, cam.position); G.museum.winter.update(dt, G.t, cam.position, null, G.set.reduce); }
    if (G.vehicle) G.vehicle.sync(dt);
    this.sound.update(null, false);
    if (t >= this.len && this.hold == null) this.finish(false);
  }

  /** Hand over: skipped or run to the end. */
  finish(skipped) {
    if (!this.on) return;
    this.on = false;
    for (const k of ['keydown', 'pointerdown']) removeEventListener(k, this._skip, { capture: true });
    const G = this.G;
    if (!G.lampOn) { G.lampOn = true; if (G.lamp) G.lamp.intensity = 70; const b = document.getElementById('bLights'); if (b) b.setAttribute('aria-pressed', 'true'); if (skipped) this.sound.tick(0.08, 2200, 0.03); }
    if (this.group) { this.scene.remove(this.group); for (const p of this.panes) p.mesh.material.dispose(); this.geo.dispose(); this.group = null; this.panes = []; }
    this.el.hidden = true;
    this.skipped = skipped;
    const took = this.t, done = this.done; this.done = null;
    if (done) done(took);
  }
}
