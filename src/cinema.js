// The late showing. Every auditorium and lecture room has a screen, and with the building shut the
// projector has been left running: go in and the film starts, leave and it stops.
//
// The programme is made here, by the game, a frame at a time on one canvas: tonight's hang, how a
// museum runs at night, how the building grew, and a few of the artists on the walls. Nothing is
// fetched for it. Only works with no copyright notice are ever put on a screen.
//
// FILMS is for real public-domain clips streamed from where they are kept (never stored here). It
// is empty: a clip goes in only when its file page has been read and its licence confirmed, and
// that could not be done when this was written. One that fails to load is skipped without a word.

import * as THREE from 'three';

// { title, url, page, licence, credit }: url must be served with CORS; page is where the licence was read.
export const FILMS = [];

const CW = 960, CH = 540, SERIF = 'Georgia, "Times New Roman", serif', MONO = 'ui-monospace, Menlo, monospace';
const CREAM = '#f1ead8', GILT = '#e2cd94', INK = '#0b0d14';
const ease = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const fade = (t, dur, f = 0.8) => Math.min(1, t / f, (dur - t) / f);

const STYLE = `
#cinema { position: fixed; inset: 0; z-index: 30; pointer-events: none; }
#cinema[hidden] { display: none; }
#cinema .bar { position: fixed; left: 50%; transform: translateX(-50%); bottom: max(10px, env(safe-area-inset-bottom)); display: flex; gap: 10px; pointer-events: auto; }
#cinema button { height: 44px; padding: 0 18px; border-radius: 8px; border: 1px solid rgba(226,205,148,.6); background: rgba(8,9,14,.72); color: #e2cd94; font: 700 12px ui-monospace, monospace; letter-spacing: .12em; }
@media (max-height: 460px) { #cinema .bar { left: auto; transform: none; right: max(8px, env(safe-area-inset-right)); bottom: 50%; translate: 0 50%; flex-direction: column; } #cinema button { padding: 0 10px; width: 104px; } }
#cinema .what { position: fixed; left: 50%; transform: translateX(-50%); top: max(10px, env(safe-area-inset-top)); font: 12px ui-monospace, monospace; letter-spacing: .12em; color: #e2cd94; background: rgba(4,5,9,.7); padding: 5px 12px; border-radius: 8px; white-space: nowrap; }
`;

export class Cinema {
  // deps: { museum, plan, sound, stage, resume(), onWatch() }
  constructor(G, deps) {
    Object.assign(this, deps); this.G = G;
    this.on = false; this.now = null; this.t = 0; this.acc = 0; this.frames = 0; this.slow = 0; this.index = 0; this.card = 0;
    this.screens = []; this.group = new THREE.Group(); this.museum.group.add(this.group);
    this.canvas = document.createElement('canvas'); this.canvas.width = CW; this.canvas.height = CH; this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.generateMipmaps = false; this.tex.minFilter = THREE.LinearFilter;
    this.lit = new THREE.MeshBasicMaterial({ map: this.tex, color: new THREE.Color(1.15, 1.12, 1.05) });
    this.blank = new THREE.MeshStandardMaterial({ color: 0xcfcbc0, roughness: 0.9, emissive: 0x30323a, emissiveIntensity: 0.5 });
    this.beamM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.55, 0.7), transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this._find();
    this._lq = new Map();
    this._dom();
  }

  // ---- where the screens are ----
  // The end of the room with no door in it, as the fit-out works it out (src/furnish.js, quietEnd).
  _find() {
    const P = this.plan, frame = new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.7 });
    const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
    for (const r of P.rooms) {
      const name = String(r.gallery || ''), lecture = /Lecture room/i.test(name), aud = !lecture && (r.use === 'auditorium' || /Auditorium/i.test(name)) && !/foyer|balcony|plant|green room/i.test(name);
      if (!lecture && !aud) continue;
      const longX = r.x1 - r.x0 >= r.z1 - r.z0, L = longX ? r.x1 - r.x0 : r.z1 - r.z0, W = longX ? r.z1 - r.z0 : r.x1 - r.x0, H = r.h - 0.15, ends = [0, 0], gaps = [[], []];
      for (const d of (P.doorsOf ? P.doorsOf(r.id) : P.doors.filter(q => q.a === r.id || q.b === r.id))) {
        if (Math.abs(d.y - r.y) > 0.3) continue;
        let e;
        if (d.along === 'x') { const west = (d.x0 + d.x1) / 2 < (r.x0 + r.x1) / 2; e = [(west ? r.x0 + 0.9 : r.x1 - 0.9), (d.z0 + d.z1) / 2]; }
        else { const north = (d.z0 + d.z1) / 2 < (r.z0 + r.z1) / 2; e = [(d.x0 + d.x1) / 2, north ? r.z0 + 0.9 : r.z1 - 0.9]; }
        const ea = longX ? e[0] - r.x0 : e[1] - r.z0, b0 = longX ? d.z0 - r.z0 : d.x0 - r.x0, b1 = longX ? d.z1 - r.z0 : d.x1 - r.x0;
        if (ea < 2) ends[0]++; if (ea > L - 2) ends[1]++;
        if (ea < 1.2) gaps[0].push([b0, b1]); if (ea > L - 1.2) gaps[1].push([b0, b1]);
      }
      // The quiet end if the screen can hang there clear of any doorway; failing that the other end; failing that, above the door.
      const quiet = ends[1] < ends[0] ? 1 : ends[0] < ends[1] ? 0 : hash(r.id) & 1;
      let end = quiet, bottom = aud ? 1.0 : 0.95, w = 0, mid = W / 2, found = false;
      const size = bt => Math.min(W - (aud ? 1.6 : 0.5), (H - bt - 0.25) * 16 / 9, aud ? 8.5 : 3.4);
      for (const e of [quiet, 1 - quiet]) {
        w = size(bottom);
        for (const off of [0, -1, 1, -2, 2, -3, 3, -4, 4]) { const m = W / 2 + off; if (m - w / 2 < 0.25 || m + w / 2 > W - 0.25) continue; if (gaps[e].some(([b0, b1]) => m + w / 2 > b0 - 0.3 && m - w / 2 < b1 + 0.3)) continue; end = e; mid = m; found = true; break; }
        if (found) break;
      }
      // No room for a full-width screen clear of the doors at either end: hang a smaller one in the widest stretch of wall
      // beside a doorway. (It used to go up over the door, and overlapped the top of it.)
      if (!found) {
        let best = null;
        for (const e of [quiet, 1 - quiet]) { let p = 0.25; for (const [b0, b1] of [...gaps[e]].sort((u, v) => u[0] - v[0]).concat([[W - 0.25 + 0.3, W]])) { const q = b0 - 0.3; if (q - p > (best ? best.len : 1.5)) best = { e, lo: p, len: q - p }; p = Math.max(p, b1 + 0.3); } }
        if (!best) continue;
        end = best.e; w = Math.min(size(bottom), best.len); mid = best.lo + best.len / 2;
      }
      const s = end ? -1 : 1, h = w * 9 / 16;      // s: which way the screen faces along the room
      if (w < 1.4) continue;
      const a = end ? L - 0.16 : 0.16, cx = longX ? r.x0 + a : r.x0 + mid, cz = longX ? r.z0 + mid : r.z0 + a, nx = longX ? s : 0, nz = longX ? 0 : s;
      const sc = { room: r, aud, x: cx, y: r.y + bottom + h / 2, z: cz, nx, nz, w, h, L, W, H };
      const g = new THREE.Group(), yaw = Math.atan2(nx, nz);
      const fr = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.05), frame); fr.position.z = -0.03; g.add(fr);
      sc.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.blank); g.add(sc.mesh);
      // The beam: from the back of the room, a little above the heads, to the four corners of the screen.
      const D = Math.min(L - 0.6, 16), by = Math.min(H - 0.3, bottom + h + 0.2) - (bottom + h / 2), pos = new Float32Array([0, by, D, -w / 2, -h / 2, 0.02, w / 2, -h / 2, 0.02, w / 2, h / 2, 0.02, -w / 2, h / 2, 0.02]);
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1]);
      sc.beam = new THREE.Mesh(bg, this.beamM); sc.beam.visible = false; sc.beam.renderOrder = 5; g.add(sc.beam);
      g.position.set(cx, sc.y, cz); g.rotation.y = yaw; g.traverse(o => { o.matrixAutoUpdate = false; o.updateMatrix(); }); g.updateMatrixWorld(true);
      this.group.add(g); this.screens.push(sc);
    }
  }

  /** Pulled up in front of the screen that is showing? */
  near(v) {
    const s = this.now; if (!s || this.on) return false;
    const dx = v.pos.x - s.x, dz = v.pos.z - s.z, out = dx * s.nx + dz * s.nz, side = Math.abs(dx * s.nz - dz * s.nx);
    return out > 0.8 && out < Math.min(9, s.L * 0.7) && side < s.w / 2 + 1 && Math.hypot(v.vel.x, v.vel.z) < 3;
  }

  // ---- the projector ----
  _start(sc) {
    this.now = sc; sc.mesh.material = this.lit; sc.beam.visible = true;
    this.t = 0; this.acc = 1; this.card = 0; this.slow = 0;
    this.programme = this._programme(); this.index = this.index % this.programme.length;
    this._whirr(true);
  }
  _stop() {
    const sc = this.now; if (!sc) return;
    sc.mesh.material = this.blank; sc.beam.visible = false; this.now = null; this.programme = null;
    if (this.video) { try { this.video.pause(); this.video.removeAttribute('src'); this.video.load(); } catch { /* gone */ } this.video = null; if (this.vtex) { this.vtex.dispose(); this.vtex = null; } this.lit.map = this.tex; this.lit.needsUpdate = true; }
    this._whirr(false);
  }
  next() { if (!this.programme) return; this.index = (this.index + 1) % this.programme.length; this.t = 0; this.card = 0; this.acc = 1; this._label(); }

  update(dt, G, sound) {
    if (sound) this.sound = sound;
    const id = this.on && this.now ? this.now.room.id : G.state === 'title' ? null : G.roomId, sc = id ? this.screens.find(s => s.room.id === id) : null;
    if (sc !== this.now) { this._stop(); if (sc) this._start(sc); }
    if (!this.now) return;
    // 24 frames a second; 12 when the game itself is struggling.
    this.slow += ((dt > 1 / 22 ? 1 : 0) - this.slow) * Math.min(1, dt * 2);
    const step = this.slow > 0.5 ? 1 / 12 : 1 / 24;
    this.t += dt; this.acc += dt;
    if (this.acc < step) return;
    this.acc = Math.min(this.acc - step, step);
    const film = this.programme[this.index], CARD = 4.5;
    if (this.t >= film.dur + CARD) { this.index = (this.index + 1) % this.programme.length; this.t = 0; if (this.on) this._label(); return; }
    const c = this.ctx;
    c.save(); c.globalAlpha = 1; c.fillStyle = INK; c.fillRect(0, 0, CW, CH);
    if (this.t < CARD) this._card(c, film, this.t, CARD); else film.draw(c, this.t - CARD, film.dur);
    c.restore(); this._grain(c);
    this.tex.needsUpdate = true; this.frames++;
  }

  // The card before each film: a leader counting down, then its name.
  _card(c, film, t, dur) {
    if (t < 1.8) {
      const n = 3 - Math.floor(t / 0.6), k = (t % 0.6) / 0.6;
      c.fillStyle = '#b9b3a2'; c.fillRect(0, 0, CW, CH); c.strokeStyle = '#2a2a2a'; c.lineWidth = 4;
      c.beginPath(); c.arc(CW / 2, CH / 2, 170, 0, 6.3); c.stroke(); c.beginPath(); c.arc(CW / 2, CH / 2, 150, 0, 6.3); c.stroke();
      c.beginPath(); c.moveTo(0, CH / 2); c.lineTo(CW, CH / 2); c.moveTo(CW / 2, 0); c.lineTo(CW / 2, CH); c.stroke();
      c.fillStyle = 'rgba(40,40,40,.28)'; c.beginPath(); c.moveTo(CW / 2, CH / 2); c.arc(CW / 2, CH / 2, 170, -Math.PI / 2, -Math.PI / 2 + k * 6.283); c.fill();
      c.fillStyle = '#1a1a1a'; c.font = `700 190px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(n), CW / 2, CH / 2 + 8);
      return;
    }
    const a = fade(t - 1.8, dur - 1.8, 0.5);
    c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.strokeStyle = GILT; c.lineWidth = 2; c.strokeRect(60, 50, CW - 120, CH - 100); c.strokeRect(70, 60, CW - 140, CH - 120);
    c.fillStyle = GILT; c.font = `13px ${MONO}`; c.fillText('T H E   L A T E   S H O W I N G', CW / 2, 150);
    c.fillStyle = CREAM; c.font = `italic 54px ${SERIF}`; this._wrap(c, film.title, CW / 2, 250, CW - 240, 62);
    c.fillStyle = GILT; c.font = `15px ${MONO}`; c.fillText(film.sub || '', CW / 2, 400);
  }
  _wrap(c, text, x, y, maxW, lh, maxLines = 3) {
    const words = String(text).split(' '), lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line); if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,3}$/, '…'); }
    const top = c.textBaseline === 'middle' ? y - (lines.length - 1) * lh / 2 : y;
    lines.forEach((l, i) => c.fillText(l, x, top + i * lh)); return lines.length;
  }
  // Old film: the light is never quite steady, there are scratches, and the corners are dark.
  _grain(c) {
    const f = this.frames;
    c.save(); c.globalAlpha = 0.04 + 0.03 * Math.sin(f * 1.7) * Math.sin(f * 0.31); c.fillStyle = '#fff'; c.fillRect(0, 0, CW, CH);
    c.globalAlpha = 0.16; c.fillStyle = '#e8e2d0';
    const r = (n => { let a = (n * 2654435761) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })(f + 1);
    if (r() < 0.3) c.fillRect(r() * CW, 0, 1, CH);
    for (let i = 0; i < 5; i++) c.fillRect(r() * CW, r() * CH, 1 + r() * 2, 1 + r() * 2);
    if (!this.vig) { this.vig = c.createRadialGradient(CW / 2, CH / 2, CH * 0.45, CW / 2, CH / 2, CW * 0.62); this.vig.addColorStop(0, 'rgba(0,0,0,0)'); this.vig.addColorStop(1, 'rgba(0,0,0,0.5)'); }
    c.globalAlpha = 1; c.fillStyle = this.vig; c.fillRect(0, 0, CW, CH); c.restore();
  }

  // ---- the films ----
  /** The works that may be shown: on the walls tonight, with no copyright notice. */
  eligible() {
    const seen = new Set(), out = [];
    for (const a of this.museum.arts || []) { const w = a.work; if (!w || w.c || !w.t || seen.has(w.id)) continue; seen.add(w.id); out.push(a); }
    return out;
  }
  // A picture for a work: the one the game has already loaded for the wall, or failing that the handful of pixels
  // that came with the list, which is enough for a ground of the right colours.
  _image(a) {
    const t = a.tex && a.tex.image; if (t && (t.width || t.videoWidth) > 16) return { img: t, real: true };
    const lq = a.work.lq; if (!lq) return null;
    let im = this._lq.get(a.work.id); if (!im) { im = new Image(); im.src = lq; this._lq.set(a.work.id, im); }
    return im.complete && im.naturalWidth ? { img: im, real: false } : null;
  }
  _picture(c, a, x, y, w, h, zoom = 1, px = 0, py = 0) {
    const p = this._image(a), wk = a.work, ar = wk.iw && wk.ih ? wk.iw / wk.ih : 0.8;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    if (!p) { c.fillStyle = '#2a2622'; c.fillRect(x, y, w, h); c.restore(); return; }
    if (p.real) {
      let dw = w, dh = w / ar; if (dh > h) { dh = h; dw = h * ar; }
      dw *= zoom; dh *= zoom; c.imageSmoothingEnabled = true;
      try { c.drawImage(p.img, x + (w - dw) / 2 + px * (dw - w) / 2, y + (h - dh) / 2 + py * (dh - h) / 2, dw, dh); } catch { c.fillStyle = '#2a2622'; c.fillRect(x, y, w, h); }
    } else {
      c.imageSmoothingEnabled = true; c.globalAlpha *= 0.85; c.drawImage(p.img, x - w * 0.15 * zoom, y - h * 0.15 * zoom, w * (1 + 0.3 * zoom), h * (1 + 0.3 * zoom));
    }
    c.restore();
  }
  _programme() {
    const pool = this.eligible(), rnd = (() => { let a = (Date.now() / 3600e3 | 0) * 2654435761 >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
    const shuffled = pool.map(a => [rnd() - (a.tex && a.tex.image ? 1 : 0), a]).sort((p, q) => p[0] - q[0]).map(p => p[1]);      // ones already loaded for the walls come first
    const hang = shuffled.slice(0, 8);
    const by = new Map(); for (const a of pool) { const n = String(a.work.a || '').split('\n')[0].trim(); if (!n || /unknown|anonymous|artist$/i.test(n)) continue; (by.get(n) || by.set(n, []).get(n)).push(a); }
    const artists = [...by].filter(([, l]) => l.length >= 2).map(p => [rnd(), p]).sort((p, q) => p[0] - q[0]).slice(0, 6).map(p => p[1]);
    this.shown = [...hang, ...artists.flatMap(([, l]) => l.slice(0, 2))].map(a => a.work.id);
    const list = [];
    if (hang.length) list.push({ id: 'hang', title: 'Tonight’s Hang', sub: `${hang.length} of the ${pool.length} works on the walls`, dur: hang.length * 8, draw: (c, t) => this._hang(c, t, hang) });
    list.push({ id: 'night', title: 'How a Museum Runs at Night', sub: 'in five short lessons', dur: 70, draw: (c, t) => this._night(c, t) });
    list.push({ id: 'building', title: 'Chicago, 1893 to Now', sub: 'how the building grew', dur: 56, draw: (c, t) => this._building(c, t) });
    if (artists.length) list.push({ id: 'artists', title: 'The Artists', sub: `${artists.length} of those on view tonight`, dur: artists.length * 9, draw: (c, t) => this._artists(c, t, artists) });
    for (const f of FILMS) list.push({ id: 'clip', title: f.title, sub: f.credit, dur: f.dur || 60, clip: f, draw: (c, t) => this._clip(c, t, f) });
    return list;
  }
  _caption(c, lines, a = 1) {
    c.save(); c.globalAlpha = a; c.fillStyle = 'rgba(6,7,11,.78)'; c.fillRect(0, CH - 128, CW, 128);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillStyle = CREAM; c.font = `italic 30px ${SERIF}`; c.fillText(this._clipText(c, lines[0], CW - 96), 48, CH - 84);
    c.fillStyle = GILT; c.font = `19px ${SERIF}`; c.fillText(this._clipText(c, lines[1] || '', CW - 96), 48, CH - 52);
    c.fillStyle = '#a8a08c'; c.font = `13px ${MONO}`; c.fillText(this._clipText(c, lines[2] || '', CW - 96), 48, CH - 24);
    c.restore();
  }
  _clipText(c, s, w) { s = String(s); if (c.measureText(s).width <= w) return s; while (s.length > 4 && c.measureText(s + '…').width > w) s = s.slice(0, -1); return s + '…'; }
  _hang(c, t, list) {
    const i = Math.min(list.length - 1, Math.floor(t / 8)), u = t - i * 8, a = list[i], w = a.work, k = u / 8, dirn = i % 2 ? -1 : 1;
    c.globalAlpha = fade(u, 8, 0.7);
    this._picture(c, a, 0, 0, CW, CH - 60, 1.06 + 0.16 * k, dirn * (1 - 2 * k) * 0.8, (i % 3 - 1) * (2 * k - 1) * 0.6);
    const where = [w.m, w.s || w.k, w.g].filter(Boolean).join('  ·  ');
    this._caption(c, [w.t, [String(w.a || '').split('\n')[0], w.d].filter(Boolean).join(', '), where], fade(u, 8, 0.7));
    c.globalAlpha = 1;
  }
  _artists(c, t, list) {
    const i = Math.min(list.length - 1, Math.floor(t / 9)), u = t - i * 9, [name, works] = list[i], a = fade(u, 9, 0.7);
    c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = GILT; c.font = `13px ${MONO}`; c.fillText('O N   V I E W   T O N I G H T', CW / 2, 54);
    c.fillStyle = CREAM; c.font = `44px ${SERIF}`; c.fillText(this._clipText(c, name, CW - 120), CW / 2, 108);
    works.slice(0, 2).forEach((w, j) => {
      const x = 70 + j * (CW / 2 - 20), bw = CW / 2 - 120, bh = 290, y = 140, k = u / 9;
      c.fillStyle = '#17150f'; c.fillRect(x - 8, y - 8, bw + 16, bh + 16); c.strokeStyle = GILT; c.lineWidth = 2; c.strokeRect(x - 8, y - 8, bw + 16, bh + 16);
      this._picture(c, w, x, y, bw, bh, 1 + 0.06 * k, 0, 0);
      c.fillStyle = CREAM; c.font = `italic 19px ${SERIF}`; c.fillText(this._clipText(c, w.work.t, bw + 10), x + bw / 2, y + bh + 44);
      c.fillStyle = '#a8a08c'; c.font = `13px ${MONO}`; c.fillText(this._clipText(c, [w.work.d, w.work.g].filter(Boolean).join('  ·  '), bw + 10), x + bw / 2, y + bh + 68);
    });
    c.globalAlpha = 1;
  }

  // Five lessons, fourteen seconds each, drawn as diagrams.
  _night(c, t) {
    const S = 14, i = Math.min(4, Math.floor(t / S)), u = t - i * S, k = u / S, a = fade(u, S, 0.7);
    const heads = ['1.  Conservation', '2.  The Air', '3.  The Registrar', '4.  The Hang', '5.  The Round'];
    const says = [
      'Old varnish yellows. It comes off a swab at a time, and the colour underneath is the painter’s.',
      'Paint and panel move with the weather. So there is none: about 21 °C and 50 % humidity, all night.',
      'Everything that moves, moves in a crate, with a number, and somebody signs for it at both ends.',
      'The middle of a picture hangs 57 inches from the floor: eye level, for most eyes.',
      'And one guard walks the lot, lamp by lamp, until the doors open again.'];
    c.globalAlpha = a; c.fillStyle = '#12151f'; c.fillRect(0, 0, CW, CH);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = GILT; c.font = `28px ${SERIF}`; c.fillText(heads[i], 48, 60);
    c.strokeStyle = 'rgba(226,205,148,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(48, 74); c.lineTo(CW - 48, 74); c.stroke();
    c.save(); c.translate(0, 0);
    if (i === 0) {
      // A landscape under brown varnish, and a swab wiping it clean from left to right.
      const x = 250, y = 110, w = 460, h = 290, wipe = ease((u - 1.5) / 9) * w;
      c.fillStyle = '#3a2a16'; c.fillRect(x - 14, y - 14, w + 28, h + 28); c.fillStyle = GILT; c.fillRect(x - 8, y - 8, w + 16, h + 16);
      const paint = (dull) => { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, dull ? '#8a7a4a' : '#7fb6e0'); g.addColorStop(0.55, dull ? '#9a8650' : '#d9e6c8'); g.addColorStop(0.56, dull ? '#5a5026' : '#4f8a3e'); g.addColorStop(1, dull ? '#4a3e1c' : '#2f6a34'); c.fillStyle = g; c.fillRect(x, y, w, h);
        c.fillStyle = dull ? '#a89858' : '#fff3c0'; c.beginPath(); c.arc(x + w * 0.72, y + h * 0.26, 26, 0, 6.3); c.fill();
        c.fillStyle = dull ? '#4a421e' : '#2a5a30'; for (const [tx, s] of [[0.18, 1], [0.3, 0.7], [0.86, 0.85]]) { c.beginPath(); c.arc(x + w * tx, y + h * 0.5, 44 * s, 0, 6.3); c.fill(); c.fillRect(x + w * tx - 5, y + h * 0.5, 10, 70 * s); }
        c.fillStyle = dull ? '#6a6030' : '#9fc4e6'; c.beginPath(); c.moveTo(x + w * 0.4, y + h); c.quadraticCurveTo(x + w * 0.5, y + h * 0.7, x + w * 0.62, y + h * 0.57); c.lineTo(x + w * 0.66, y + h * 0.57); c.quadraticCurveTo(x + w * 0.62, y + h * 0.75, x + w * 0.7, y + h); c.fill(); };
      paint(true); c.save(); c.beginPath(); c.rect(x, y, wipe, h); c.clip(); paint(false); c.restore();
      const sx = x + wipe, sy = y + h * (0.5 + 0.3 * Math.sin(u * 5));
      c.strokeStyle = '#c9b48a'; c.lineWidth = 5; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 90, sy - 120); c.stroke(); c.fillStyle = '#f4efe2'; c.beginPath(); c.ellipse(sx, sy, 13, 9, -0.9, 0, 6.3); c.fill();
      c.fillStyle = '#a8a08c'; c.font = `13px ${MONO}`; c.fillText('AFTER', x + 6, y + h + 34); c.textAlign = 'right'; c.fillText('BEFORE', x + w - 6, y + h + 34); c.textAlign = 'left';
    } else if (i === 1) {
      // Two dials that wobble and settle, and air going round a gallery.
      const dial = (cx, label, val, unit, wob) => { c.strokeStyle = CREAM; c.lineWidth = 3; c.beginPath(); c.arc(cx, 250, 92, Math.PI * 0.8, Math.PI * 2.2); c.stroke();
        for (let j = 0; j <= 10; j++) { const an = Math.PI * (0.8 + 1.4 * j / 10); c.beginPath(); c.moveTo(cx + Math.cos(an) * 80, 250 + Math.sin(an) * 80); c.lineTo(cx + Math.cos(an) * 92, 250 + Math.sin(an) * 92); c.stroke(); }
        c.strokeStyle = 'rgba(120,200,140,.8)'; c.lineWidth = 8; c.beginPath(); c.arc(cx, 250, 100, Math.PI * 1.42, Math.PI * 1.58); c.stroke();
        const an = Math.PI * (1.5 + wob); c.strokeStyle = '#e0563c'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx, 250); c.lineTo(cx + Math.cos(an) * 74, 250 + Math.sin(an) * 74); c.stroke(); c.fillStyle = CREAM; c.beginPath(); c.arc(cx, 250, 7, 0, 6.3); c.fill();
        c.textAlign = 'center'; c.fillStyle = CREAM; c.font = `38px ${SERIF}`; c.fillText(val + unit, cx, 330); c.fillStyle = '#a8a08c'; c.font = `13px ${MONO}`; c.fillText(label, cx, 356); c.textAlign = 'left'; };
      const settle = Math.exp(-u * 0.5);
      dial(250, 'TEMPERATURE', (21 + Math.sin(u * 3) * 1.6 * settle).toFixed(1), ' °C', Math.sin(u * 3) * 0.16 * settle); dial(520, 'RELATIVE HUMIDITY', Math.round(50 + Math.sin(u * 2.3 + 1) * 7 * settle), ' %', Math.sin(u * 2.3 + 1) * 0.16 * settle);
      c.strokeStyle = 'rgba(160,200,240,.7)'; c.lineWidth = 2; c.strokeRect(690, 150, 200, 190);
      for (let j = 0; j < 8; j++) { const p = ((u * 0.25 + j / 8) % 1) * 4, q = p % 1, side = Math.floor(p); const [px, py] = side === 0 ? [710 + q * 160, 170] : side === 1 ? [870, 170 + q * 150] : side === 2 ? [870 - q * 160, 320] : [710, 320 - q * 150]; c.fillStyle = 'rgba(160,200,240,.9)'; c.beginPath(); c.arc(px, py, 4, 0, 6.3); c.fill(); }
      c.fillStyle = '#a8a08c'; c.font = `13px ${MONO}`; c.fillText('SUPPLY →', 700, 142); c.fillText('← RETURN', 800, 362);
    } else if (i === 2) {
      // A crate comes along a line, gets its label and a tick.
      const cx = -140 + ease(u / 5) * 560, done = u > 6.5;
      c.strokeStyle = '#6a6252'; c.lineWidth = 4; c.beginPath(); c.moveTo(60, 372); c.lineTo(CW - 60, 372); c.stroke(); for (let x = 70 + (u * 40 % 40); x < CW - 60; x += 40) { c.beginPath(); c.arc(x, 382, 7, 0, 6.3); c.stroke(); }
      c.fillStyle = '#b08a52'; c.fillRect(cx, 190, 240, 180); c.strokeStyle = '#6e5026'; c.lineWidth = 6; c.strokeRect(cx, 190, 240, 180); c.beginPath(); c.moveTo(cx, 190); c.lineTo(cx + 240, 370); c.moveTo(cx + 240, 190); c.lineTo(cx, 370); c.stroke();
      c.fillStyle = '#f1ead8'; c.fillRect(cx + 60, 240, 120, 70); c.fillStyle = '#17150f'; c.font = `12px ${MONO}`; c.fillText('ACC. NO.', cx + 70, 262); c.font = `700 20px ${MONO}`; c.fillText('1926.224', cx + 70, 292);
      c.fillStyle = '#c8202b'; c.font = `700 15px ${MONO}`; c.fillText('FRAGILE  ↑ THIS WAY UP', cx + 24, 350);
      const lx = 640; c.fillStyle = '#f1ead8'; c.fillRect(lx, 130, 250, 220); c.fillStyle = '#17150f'; c.font = `15px ${MONO}`;
      ['OUT  Gallery 240', 'IN   Conservation', 'COURIER  signed', 'CONDITION  checked'].forEach((s, j) => { const on = u > 5 + j * 1.3; c.fillStyle = '#17150f'; c.fillText(s, lx + 46, 172 + j * 46); c.strokeStyle = '#17150f'; c.lineWidth = 2; c.strokeRect(lx + 16, 157 + j * 46, 18, 18); if (on) { c.strokeStyle = '#2a8a3c'; c.lineWidth = 4; c.beginPath(); c.moveTo(lx + 18, 166 + j * 46); c.lineTo(lx + 24, 173 + j * 46); c.lineTo(lx + 36, 154 + j * 46); c.stroke(); } });
      void done;
    } else if (i === 3) {
      // A wall, a figure, a picture sliding to its height, and the dimension line.
      const floor = 400, sc = 2.6, yc = floor - 57 * sc, drop = (1 - ease(u / 4)) * -90;
      c.fillStyle = '#1b2030'; c.fillRect(60, 100, CW - 120, floor - 100); c.fillStyle = '#3a3226'; c.fillRect(60, floor, CW - 120, 14);
      c.fillStyle = GILT; c.fillRect(420, yc - 70 + drop, 190, 140); c.fillStyle = '#4f7a9a'; c.fillRect(432, yc - 58 + drop, 166, 116); c.fillStyle = '#e8d8a0'; c.beginPath(); c.arc(560, yc - 20 + drop, 16, 0, 6.3); c.fill();
      c.strokeStyle = CREAM; c.lineWidth = 2; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(250, yc); c.lineTo(760, yc); c.stroke(); c.setLineDash([]);
      c.beginPath(); c.moveTo(700, floor); c.lineTo(700, yc); c.moveTo(692, floor - 8); c.lineTo(700, floor); c.lineTo(708, floor - 8); c.moveTo(692, yc + 8); c.lineTo(700, yc); c.lineTo(708, yc + 8); c.stroke();
      c.fillStyle = CREAM; c.font = `24px ${SERIF}`; c.fillText('57 in.', 716, (floor + yc) / 2); c.fillStyle = '#a8a08c'; c.font = `13px ${MONO}`; c.fillText('145 cm', 716, (floor + yc) / 2 + 22);
      const px = 250, eye = floor - 62 * sc; c.fillStyle = '#c9c2b0'; c.beginPath(); c.arc(px, eye - 2, 15, 0, 6.3); c.fill(); c.fillRect(px - 15, eye + 16, 30, 78); c.fillRect(px - 14, eye + 94, 11, floor - eye - 94); c.fillRect(px + 3, eye + 94, 11, floor - eye - 94);
      c.strokeStyle = 'rgba(241,234,216,.5)'; c.beginPath(); c.moveTo(px + 16, eye); c.lineTo(418, yc + drop); c.stroke();
    } else {
      // The plan of a floor, and a lamp going round it.
      const P = this.plan, rooms = P.rooms.filter(r => r.y === 0 && r.kind === 'gallery'), B = { x0: 15, x1: 260, z0: -10, z1: 240 }, sx = (CW - 120) / (B.z1 - B.z0), sy = 300 / (B.x1 - B.x0);
      const X = z => 60 + (z - B.z0) * sx, Y = x => 100 + (x - B.x0) * sy, lit = Math.floor(k * rooms.length * 1.15);
      rooms.forEach((r, j) => { c.fillStyle = j < lit ? 'rgba(226,205,148,.5)' : 'rgba(120,130,160,.2)'; c.fillRect(X(r.z0), Y(r.x0), (r.z1 - r.z0) * sx - 1, (r.x1 - r.x0) * sy - 1); });
      const g = rooms[Math.min(rooms.length - 1, lit)]; if (g) { const gx = X((g.z0 + g.z1) / 2), gy = Y((g.x0 + g.x1) / 2), gl = c.createRadialGradient(gx, gy, 2, gx, gy, 46); gl.addColorStop(0, 'rgba(255,240,190,.95)'); gl.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = gl; c.fillRect(gx - 46, gy - 46, 92, 92); }
      c.fillStyle = '#a8a08c'; c.font = `13px ${MONO}`; c.fillText(`${Math.min(rooms.length, lit)} / ${rooms.length} GALLERIES ON THIS FLOOR`, 60, 424);
    }
    c.restore();
    c.fillStyle = 'rgba(6,7,11,.82)'; c.fillRect(0, CH - 92, CW, 92); c.fillStyle = CREAM; c.font = `italic 22px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; this._wrap(c, says[i], CW / 2, CH - 46, CW - 110, 30, 2);
    c.globalAlpha = 1;
  }

  // The building, a part at a time, drawn from the plan the game is played on. (Which block belongs to which year
  // is by where it stands, roughly: this is a film, not a survey.)
  _building(c, t) {
    const P = this.plan, R = P.grounds ? P.grounds.rail : { x0: 113, x1: 123 };
    if (!this._parts) {
      const part = m => { const cx = (m.x0 + m.x1) / 2, cz = (m.z0 + m.z1) / 2; return m.x0 < R.x1 + 4 && m.x1 > R.x0 - 4 && cx > R.x0 - 14 && cx < R.x1 + 14 ? 1 : cx < R.x0 ? (cz > 163 ? 3 : 0) : cz < 58 ? 5 : cx > 150 && cz > 128 ? 4 : 2; };
      this._parts = (P.masses || []).filter(m => m.x0 < (P.bounds.cx1 || 300)).map(m => ({ m, p: part(m) }));
    }
    const steps = [
      ['1893', 'The building on Michigan Avenue', 'Put up for the World’s Columbian Exposition. The museum moved in when the fair closed.'],
      ['1916', 'Gunsaulus Hall', 'With the railway behind it, the only way to grow was over the tracks: so, a bridge of galleries.'],
      ['1924', 'East of the tracks', 'McKinlock Court, open to the sky, and the galleries round it.'],
      ['1958', 'The Morton Wing', 'South along the avenue.'],
      ['1988', 'The Rice Building', 'South again, on the far side of the railway.'],
      ['2009', 'The Modern Wing', 'North to Monroe Street, under a roof that lets the daylight in and keeps the sun out.']];
    const S = 56 / steps.length, i = Math.min(steps.length - 1, Math.floor(t / S)), u = t - i * S;
    const B = { x0: -10, x1: 290, z0: -30, z1: 250 }, sc = Math.min((CW - 100) / (B.x1 - B.x0), 330 / (B.z1 - B.z0)), ox = (CW - (B.x1 - B.x0) * sc) / 2, oy = 84;
    const X = x => ox + (x - B.x0) * sc, Y = z => oy + (z - B.z0) * sc;
    c.fillStyle = '#10141f'; c.fillRect(0, 0, CW, CH);
    c.fillStyle = 'rgba(90,100,130,.25)'; c.fillRect(X(-24), Y(B.z0), (25) * sc, (B.z1 - B.z0) * sc);       // Michigan Avenue
    c.fillStyle = 'rgba(140,120,90,.3)'; c.fillRect(X(R.x0), Y(B.z0), (R.x1 - R.x0) * sc, (B.z1 - B.z0) * sc);      // the railway
    c.fillStyle = '#6a7186'; c.font = `11px ${MONO}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.save(); c.translate(X(-12), Y(B.z1) - 6); c.rotate(-Math.PI / 2); c.fillText('MICHIGAN AVENUE', 0, 0); c.restore();
    c.save(); c.translate(X((R.x0 + R.x1) / 2) + 4, Y(B.z1) - 6); c.rotate(-Math.PI / 2); c.fillText('RAILWAY', 0, 0); c.restore();
    c.fillText('N ↑', X(B.x0) + 4, oy + 12);
    for (const { m, p } of this._parts) {
      if (p > i) continue;
      const a = p === i ? ease(u / 2.2) : 1;
      c.globalAlpha = a; c.fillStyle = p === i ? '#e2cd94' : '#8d93a6'; c.fillRect(X(m.x0), Y(m.z0), Math.max(1, (m.x1 - m.x0) * sc - 0.5), Math.max(1, (m.z1 - m.z0) * sc - 0.5));
    }
    c.globalAlpha = 1;
    if (i === 0 && u > 4) { c.fillStyle = '#4fa596'; for (const dz of [-13, 13]) { c.beginPath(); c.arc(X(6), Y(108.4 + dz), 5, 0, 6.3); c.fill(); } c.fillStyle = CREAM; c.font = `13px ${MONO}`; c.fillText('1894: the lions', X(6) - 40, Y(108.4 + 13) + 24); }
    c.fillStyle = GILT; c.font = `700 64px ${SERIF}`; c.textAlign = 'left'; c.fillText(steps[i][0], 48, 70);
    c.fillStyle = CREAM; c.font = `28px ${SERIF}`; c.fillText(steps[i][1], 230, 64);
    for (let j = 0; j < steps.length; j++) { c.fillStyle = j <= i ? GILT : '#3a4054'; c.fillRect(48 + j * 30, CH - 108, 22, 4); }
    c.fillStyle = 'rgba(6,7,11,.82)'; c.fillRect(0, CH - 92, CW, 92); c.fillStyle = CREAM; c.font = `italic 22px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.globalAlpha = fade(u, S, 0.6); this._wrap(c, steps[i][2], CW / 2, CH - 46, CW - 110, 30, 2); c.globalAlpha = 1;
  }

  // A real clip, streamed. If it will not play, the programme moves on.
  _clip(c, t, f) {
    if (!this.video || this.video._f !== f) {
      const v = document.createElement('video'); v.crossOrigin = 'anonymous'; v.muted = true; v.playsInline = true; v.loop = false; v.preload = 'auto'; v._f = f; v.src = f.url;
      v.addEventListener('error', () => { if (this.video === v) this.next(); }); v.addEventListener('ended', () => { if (this.video === v) this.next(); });
      v.play().catch(() => { if (this.video === v) this.next(); }); this.video = v;
    }
    const v = this.video;
    if (v.readyState >= 2) { try { const ar = v.videoWidth / v.videoHeight, h = Math.min(CH, CW / ar), w = h * ar; c.drawImage(v, (CW - w) / 2, (CH - h) / 2, w, h); } catch { this.next(); } }
    if (t < 6) { c.fillStyle = 'rgba(6,7,11,.7)'; c.fillRect(0, CH - 40, CW, 40); c.fillStyle = CREAM; c.font = `13px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(this._clipText(c, `${f.title}  ·  ${f.credit}  ·  ${f.licence}`, CW - 40), CW / 2, CH - 20); }
    if (t > 8 && v.readyState < 2) this.next();
  }

  // ---- the projector's noise ----
  _whirr(on) {
    const s = this.sound, ctx = s && s.ctx;
    if (!on) { if (this.noise) { try { this.noise.g.gain.setTargetAtTime(0, ctx.currentTime, 0.1); const n = this.noise; setTimeout(() => { try { n.src.stop(); n.lfo.stop(); } catch { /* stopped */ } }, 500); } catch { /* no audio */ } this.noise = null; } return; }
    if (!ctx || this.noise || !s.master) return;
    try {
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.8;
      const g = ctx.createGain(); g.gain.value = 0; const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 24; const lg = ctx.createGain(); lg.gain.value = 0.006;
      lfo.connect(lg); lg.connect(g.gain); src.connect(bp); bp.connect(g); g.connect(s.master); src.start(); lfo.start();
      g.gain.setTargetAtTime(0.012, ctx.currentTime, 0.4); this.noise = { src, g, lfo };
    } catch { this.noise = null; }
  }

  // ---- sitting down to watch ----
  _dom() {
    const st = document.createElement('style'); st.textContent = STYLE; document.head.append(st);
    const el = this.el = document.createElement('section'); el.id = 'cinema'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'The late showing');
    el.innerHTML = '<div class="what" role="status"></div><div class="bar"><button data-act="next">Next film</button><button data-act="sound" hidden>Sound</button><button data-act="leave">Leave</button></div>';
    document.body.append(el);
    const press = e => { const b = e.target.closest('button'); if (!b) return; e.preventDefault(); if (b.dataset.act === 'leave') this.close(); else if (b.dataset.act === 'next') this.next(); else if (b.dataset.act === 'sound' && this.video) { this.video.muted = !this.video.muted; b.textContent = this.video.muted ? 'Sound' : 'Sound off'; } };
    el.addEventListener('click', press);
    addEventListener('keydown', e => { if (!this.on) return; if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); } else if (e.code === 'ArrowRight' || e.code === 'KeyN') { e.preventDefault(); this.next(); } }, true);
  }
  _label() { if (!this.programme) return; const f = this.programme[this.index]; this.el.querySelector('.what').textContent = `${this.index + 1} / ${this.programme.length}  ·  ${f.title.toUpperCase()}`; this.el.querySelector('[data-act=sound]').hidden = !f.clip; }
  open() {
    const s = this.now; if (this.on || !s) return;
    this.on = true; this.G.state = 'paused'; this.el.hidden = false; this._label();
    if (this.stage) this.stage.enter({ x: s.x + s.nx * 0.02, y: s.y, z: s.z + s.nz * 0.02, nx: s.nx, ny: 0, nz: s.nz, w: s.w, h: s.h }, { fill: 0.84 });
    s.beam.visible = false;
    if (this.onWatch) this.onWatch();
    const b = this.el.querySelector('button'); if (b) b.focus({ preventScroll: true });
  }
  close() { if (!this.on) return; this.on = false; this.el.hidden = true; if (this.now) this.now.beam.visible = true; if (this.stage && this.stage.on) this.stage.leave(); this.resume(); }
}
