// Gallery 201: Caillebotte's Paris Street; Rainy Day, and Renoir's Woman at the Piano.
//
// Rain indoors (the Caillebotte) is one of the paintings that come alive now: src/life/20684-paris-street.js, on the
// shared kit in src/paintlife.js. It keeps the secret's id ('rain'), the puddles that hold the toy back and splash, and
// the umbrellas on the hooks by the south wall.
//
// A duet with Renoir: a small upright piano stands by the Renoir, Für Elise open on the desk (Beethoven, 1867). It is
// one more keyboard for the grand pianos' own class (src/piano.js): the same keys, sound and staged camera. Play the
// opening phrase and the piano answers with the next bars, and the lamp on it lights: a warm pool on the wall round the
// picture (behind it, so the frame and canvas hide that part) and on the floor. Nothing is ever drawn on or over a
// painting here (the user's rule): light goes beside it, below it, or in the room.
import * as THREE from 'three';
import { feature } from './features.js';

const lam = (color, glow = 0.5) => new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(glow) });
function tex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

// ---------------------------------------------------------------- a duet with Renoir
// A white key's width and length, a black key's length, how far the keys stand off the bed: as the grands have them.
const WW = 1.44 / 52, KL = 0.15, BL = 0.095, KH = 0.022, STEP7 = [0, 2, 3, 5, 7, 8, 10];
const whiteMidi = i => 21 + 12 * Math.floor(i / 7) + STEP7[i % 7], isBlack = m => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
const PHRASE = [4, 3, 4, 3, 4, 11, 2, 0, 9];              // E D♯ E D♯ E B D C A, in any octave
// And the answer: [semiquaver, note, how many], at the pace the grands play it.
const ANSWER = [[0, 45, 1], [1, 52, 1], [2, 57, 1], [3, 60, 1], [4, 64, 1], [5, 69, 1], [6, 71, 3], [6, 40, 1], [7, 52, 1], [8, 56, 1], [9, 64, 1], [10, 68, 1], [11, 71, 1], [12, 72, 3], [12, 45, 1], [13, 52, 1], [14, 57, 1], [15, 64, 1],
  [16, 76, 1], [17, 75, 1], [18, 76, 1], [19, 75, 1], [20, 76, 1], [21, 71, 1], [22, 74, 1], [23, 72, 1], [24, 69, 6], [24, 45, 2], [25, 52, 2], [26, 57, 3]];

feature({
  id: 'l2-duet201',
  secrets: [['duet', 'A duet with Renoir']],
  init(k) {
    const r = this.r = k.plan.byId.G201, Pn = k.G.piano; if (!r || !Pn) return;
    this.art = k.museum.arts.find(a => a.room === 'G201' && /^Woman at the Piano/.test(a.work.t || ''));
    if (!this.art || Math.abs(this.art.nx) < 0.5) { this.art = null; return; }
    const A = this.art, wx = A.nx > 0 ? r.x0 : r.x1, sgn = A.nx > 0 ? 1 : -1, y = r.y;
    // By the picture, on the same wall: the clear stretch beyond the next picture along, short of the door.
    const along = k.museum.arts.filter(a => a.room === r.id && Math.abs(a.x - A.x) < 0.1 && a.nx === A.nx && a.z > A.z).sort((a, b) => a.z - b.z);
    const door = k.plan.doorsOf(r.id).filter(d => Math.abs((sgn > 0 ? d.x1 : d.x0) - wx) < 0.05 && d.z0 > A.z).sort((a, b) => a.z0 - b.z0)[0];
    const z0 = (along[0] ? along[0].z + along[0].w / 2 : A.z + A.w / 2) + 0.12, z1 = door ? door.z0 - 0.35 : r.z1 - 0.5, CW = 1.56;
    // Clear of the light switches (the toy has to be able to pull up to one), or else under the picture itself.
    const L = k.G.lights, plates = ((L && L.list) || []).filter(s => s.room === r.id || (s.x > r.x0 - 0.5 && s.x < r.x1 + 0.5 && s.z > r.z0 - 0.5 && s.z < r.z1 + 0.5 && Math.abs((s.y || y) - y) < 2.5));
    const free = c => !plates.some(s => Math.abs(s.x - wx) < 1.3 && s.z > c - CW / 2 - 0.8 && s.z < c + CW / 2 + 0.8);
    const zc = [z1 - z0 >= CW ? (z0 + z1) / 2 : null, A.z].find(c => c != null && free(c)) ?? A.z;
    const D = 0.55, front = wx + sgn * D, H = 0.98;
    const G = this.group = new THREE.Group(); G.name = 'upright201'; k.group.add(G);
    const walnut = lam(0x4a2a17, 0.45), dark = lam(0x2c1a0f, 0.4), ivory = new THREE.MeshStandardMaterial({ color: 0xf2ecdc, roughness: 0.35, emissive: 0xb9b3a4, emissiveIntensity: 0.8 }), ebony = new THREE.MeshStandardMaterial({ color: 0x16161a, roughness: 0.3, emissive: 0x08080a, emissiveIntensity: 0.6 });
    const box = (w, h, d, m, x, yy, z) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); q.position.set(x, yy, z); G.add(q); return q; };
    box(D, H - 0.74 + 0.25, CW, walnut, wx + sgn * D / 2, y + 0.74 + (H - 0.74 + 0.25) / 2 - 0.25, zc);        // the upper case, over the keys
    box(D * 0.75, 0.5, CW, walnut, wx + sgn * D * 0.375, y + 0.25, zc);                                       // the lower case
    box(0.03, H - 0.02, CW, dark, wx + sgn * (D * 0.75 + 0.015), y + 0.42, zc).scale.y = 0.85;
    box(0.2, 0.06, CW, walnut, front - sgn * 0.02 + sgn * 0.08, y + 0.69, zc);                                   // the key bed
    for (const s of [-1, 1]) { box(0.2, 0.16, 0.05, walnut, front + sgn * 0.08, y + 0.74, zc + s * (CW / 2 - 0.025)); box(0.05, 0.69, 0.05, walnut, front + sgn * 0.13, y + 0.345, zc + s * (CW / 2 - 0.06)); }
    box(0.02, 0.2, 0.5, dark, front + sgn * 0.01, y + 0.9, zc);                                                // the music desk
    const sheet = tex(128, 96, (c, w, h) => { c.fillStyle = '#efe6cc'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a3226'; c.font = 'italic 13px Georgia, serif'; c.textAlign = 'center'; c.fillText('Für Elise', w / 2, 16);
      c.strokeStyle = '#6a5f4a'; c.lineWidth = 1; for (let s = 0; s < 3; s++) for (let l = 0; l < 5; l++) { const yy = 28 + s * 22 + l * 3; c.beginPath(); c.moveTo(6, yy); c.lineTo(w - 6, yy); c.stroke(); }
      const notes = [6, 5, 6, 5, 6, 3, 5, 4, 2]; notes.forEach((n, i) => { c.beginPath(); c.ellipse(16 + i * 11, 40 - n * 1.5, 2.4, 1.8, -0.3, 0, 7); c.fill(); }); });
    { const q = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.19), new THREE.MeshBasicMaterial({ map: sheet })); q.position.set(front + sgn * 0.022, y + 0.91, zc); q.rotation.y = sgn * Math.PI / 2; q.rotation.x = 0; G.add(q); }
    // The lamp on top, unlit.
    this.lampM = new THREE.MeshLambertMaterial({ color: 0xe9dcae, emissive: 0x000000, transparent: true, opacity: 0.85 });
    box(0.06, 0.02, 0.06, lam(0xb8964a, 0.4), wx + sgn * 0.28, y + H + 0.01, zc - CW / 2 + 0.2);
    { const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.12, 10), this.lampM); gl.position.set(wx + sgn * 0.28, y + H + 0.08, zc - CW / 2 + 0.2); G.add(gl); this.lampAt = gl.position; }
    const halo = tex(64, 64, (c, w) => { const gr = c.createRadialGradient(w / 2, w / 2, 1, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,214,130,1)'); gr.addColorStop(0.35, 'rgba(255,190,90,.45)'); gr.addColorStop(1, 'rgba(255,170,60,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, w); });
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); this.halo.position.copy(this.lampAt); this.halo.scale.set(0.28, 0.28, 1); G.add(this.halo);
    // The light it throws: a warm wash on the wall, laid 1.5 cm off it, so the picture and its frame (which hang 4 cm
    // out) stand in front of it and hide whatever part of it is behind them: it can only ever light the wall round
    // the picture, never the picture. And a pool on the floor in front of the piano.
    const pool = (w, h, m) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: halo, color: new THREE.Color(0.9, 0.62, 0.3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, ...m }));
    // (The wash is laid over the wall, not added to it: added to a pale wall it would only go white.)
    const soft = tex(64, 64, (c, w) => { const gr = c.createRadialGradient(w / 2, w / 2, 1, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,190,110,1)'); gr.addColorStop(0.5, 'rgba(255,175,90,.6)'); gr.addColorStop(1, 'rgba(255,160,70,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, w); });
    this.wash = pool(2.6, 2.1, { map: soft, blending: THREE.NormalBlending, color: new THREE.Color(1, 0.72, 0.45) }); this.wash.position.set(wx + sgn * 0.015, y + H + 0.18, this.lampAt.z); this.wash.rotation.y = sgn * Math.PI / 2; G.add(this.wash);
    this.floorPool = pool(1.5, 1.1, { polygonOffset: true, polygonOffsetFactor: -2 }); this.floorPool.rotation.x = -Math.PI / 2; this.floorPool.position.set(front + sgn * 0.45, y + 0.006, this.lampAt.z + 0.1); G.add(this.floorPool);
    this.wash.visible = this.floorPool.visible = false;
    k.plan.obstacles.push({ x0: Math.min(wx, front + sgn * 0.2), x1: Math.max(wx, front + sgn * 0.2), z0: zc - CW / 2, z1: zc + CW / 2, y0: y, y1: y + H + 0.3 });
    // The keyboard, as the grand pianos have it, entered in their list: they play it, stage it and sound it.
    const f = new THREE.Vector3(-sgn, 0, 0), up = new THREE.Vector3(0, 1, 0), rr = new THREE.Vector3().crossVectors(f, up).normalize();
    const O = new THREE.Vector3(front + sgn * 0.16, y + 0.74, zc);
    const kg = new THREE.Group(); kg.matrixAutoUpdate = false; kg.matrix.copy(new THREE.Matrix4().makeBasis(rr, up, f.clone().negate())).setPosition(O); kg.matrixWorldNeedsUpdate = true;
    const white = new THREE.InstancedMesh(new THREE.BoxGeometry(WW - 0.0022, KH, KL), ivory, 52), black = new THREE.InstancedMesh(new THREE.BoxGeometry(WW * 0.56, KH + 0.012, BL), ebony, 36);
    const slots = new Map(); let nb = 0;
    for (let i = 0; i < 52; i++) { const mw = whiteMidi(i); slots.set(mw, { mesh: white, i, x: (i - 25.5) * WW, y: KH / 2, z: -KL / 2 }); if (isBlack(mw + 1) && mw + 1 <= 108) slots.set(mw + 1, { mesh: black, i: nb++, x: (i - 25) * WW, y: KH / 2 + 0.006, z: -(KL - BL / 2) }); }
    white.frustumCulled = black.frustumCulled = false; kg.add(white, black); G.add(kg); kg.updateMatrixWorld(true);
    const P = this.P = { id: 'piano:G201-upright', name: 'corner by the Renoir', room: r.id, O, f, r: rr, group: kg, slots, dip: new Map(), seat: O.clone().addScaledVector(f, -0.5) };
    for (const [, s] of slots) Pn._set(s, 0);
    Pn.list.push(P);
    // Listen to what is played on it (by a person: not the piano playing by itself).
    const press = Pn.press.bind(Pn);
    Pn.press = (m, who = 'x', vel = 1) => { press(m, who, vel); if (Pn.cur === P && who !== 'auto' && who !== 'duet') this.heard(k, m); };
    this.notes = []; this.lit = 0; this.done = false;
    this.at = { x: P.seat.x, y, z: P.seat.z };
  },
  heard(k, m) {
    this.notes.push(((m % 12) + 12) % 12); if (this.notes.length > PHRASE.length) this.notes.shift();
    if (this.done || this.notes.length < PHRASE.length || this.notes.some((n, i) => n !== PHRASE[i])) return;
    this.done = true; this.notes = [];
    const Pn = k.G.piano, P = this.P, step = 200;
    for (const [t, note, len] of ANSWER) {
      setTimeout(() => { if (Pn.on && Pn.cur === P) Pn.press(note, 'duet', 0.75); }, 300 + t * step);
      setTimeout(() => { if (Pn.cur === P) Pn.release(note, 'duet'); }, 300 + (t + len) * step - 20);
    }
    setTimeout(() => { if (!(Pn.on && Pn.cur === P)) return; this.lighting = true; if (k.find('duet')) k.callout('A DUET WITH RENOIR'); k.say('The piano answers you, and its lamp comes up.', 6); }, 300 + 12 * step);      // (only if you are still at the piano to hear it, as the notes above)
  },
  active(k) { return !!this.P && k.inRoom('G201', 3); },
  update(dt) {
    if (!this.lighting) return;
    this.lit = Math.min(1, this.lit + dt / 2.5);
    const fl = 0.92 + 0.08 * Math.sin(performance.now() / 130) * Math.sin(performance.now() / 47);
    this.lampM.emissive.setRGB(1, 0.78, 0.4).multiplyScalar(this.lit * fl); this.halo.material.opacity = 0.85 * this.lit * fl;
    this.wash.visible = this.floorPool.visible = true; this.wash.material.opacity = 0.75 * this.lit * fl; this.floorPool.material.opacity = 0.75 * this.lit * fl;
  },
  spots() { return this.P ? [{ kind: 'secret', id: 'duet', name: 'A duet with Renoir', x: this.at.x, y: this.at.y, z: this.at.z }] : []; },
  reset() { if (!this.P) return; this.done = false; this.lighting = false; this.lit = 0; this.lampM.emissive.setRGB(0, 0, 0); this.halo.material.opacity = 0; this.wash.visible = this.floorPool.visible = false; },
});
