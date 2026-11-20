// Tonight's reading: real books about the works on view, from Open Library (see src/books.js and tools/books.mjs).
//
//   * In the Franke Reading Room (F1-library) a low display stands in the middle of the floor, two faces of books
//     propped up cover-out at a toy's eye height: the makers and the periods most hung tonight, and the museum's
//     own catalogues. Pull up to it and READ one: a card with the cover, title, author, year and a link to the
//     book on Open Library; ‹ › leafs through the rest of the display.
//   * Looking closer at a work, the label ends with one quiet line, "Further reading", one or two books on its
//     maker (or its period or place), linked out.
//
// Nothing is asked of the network until it is wanted: data/books.json when the toy comes near the reading room or
// a label wants a book, and each cover only while the toy is at the display or the card shows it. A cover that
// does not come (none on file, offline, blocked) leaves the book in a plain cloth binding with its title in gilt.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature } from './features.js';
import { loadBooks, booksFor, topicOf, coverUrl, bookUrl, nameKey, TOPICS } from './books.js';
import { blocked, freeFloor } from './placing.js';

const ROOM = 'F1-library';
const LEN = 2.7, DEP = 1.0, TOP = 0.4;                     // the display: a low plinth, books on both long faces
const COLS = 6, SP = 0.43, BW = 0.17, BH = 0.245, BT = 0.032;
const ROWS = [{ z: 0.37, y: 0.0, tilt: 0.87 }, { z: 0.11, y: 0.09, tilt: 0.2 }];   // front (leaning well back on a rest), back (upright, on a step)
const CLOTH = ['#6e2a22', '#2a3c5c', '#3c5a3a', '#7a6a3c', '#4a2a4a', '#8a4a28', '#243a44', '#5a2a2a', '#2e4a4a', '#3a3a52'];
const GILT = '#d9bf78';

// ---------------------------------------------------------------- the cloth binding (no cover, or not yet)
function cloth(b, i, W = 128, H = 192) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = CLOTH[i % CLOTH.length]; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 0, W * 0.06, H);                       // the hinge
  g.strokeStyle = GILT; g.lineWidth = Math.max(1, W / 70); g.strokeRect(W * 0.13, H * 0.05, W * 0.81, H * 0.9);
  if (!b) return c;
  g.fillStyle = GILT; g.textAlign = 'center'; g.textBaseline = 'top';
  const words = String(b.t).split(/\s+/), maxW = W * 0.7;
  for (let fs = Math.round(W * 0.14); fs >= Math.round(W * 0.075); fs--) {
    g.font = `italic ${fs}px "Iowan Old Style", Palatino, Georgia, serif`;
    const lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line);
    if (lines.length <= 6 && lines.every(l => g.measureText(l).width <= maxW * 1.05) || fs === Math.round(W * 0.075)) {
      lines.slice(0, 6).forEach((l, n) => g.fillText(l, W * 0.535, H * 0.17 + n * fs * 1.18));
      break;
    }
  }
  if (b.a) { g.font = `${Math.round(W * 0.065)}px "Iowan Old Style", Palatino, Georgia, serif`; g.fillText(b.a.length > 26 ? b.a.slice(0, 25) + '…' : b.a, W * 0.535, H * 0.83); }
  return c;
}

// Each cover is fetched once and shared by the display and the card.
const covers = new Map();      // key -> Promise<HTMLImageElement | null>
function cover(b) {
  if (!b || !b.c) return Promise.resolve(null);
  if (!covers.has(b.k)) covers.set(b.k, new Promise(res => {
    const img = new Image(); img.crossOrigin = 'anonymous'; img.decoding = 'async';
    img.onload = () => res(img.naturalWidth > 8 ? img : null); img.onerror = () => res(null);
    img.src = coverUrl(b, 'M');
  }));
  return covers.get(b.k);
}

// ---------------------------------------------------------------- the card on screen
const CSS = `
#bookCard{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;background:rgba(5,6,10,.45);touch-action:manipulation}
#bookCard[hidden]{display:none}
#bookCard .bc{display:flex;gap:18px;align-items:stretch;width:min(520px,calc(100vw - 32px));box-sizing:border-box;background:rgba(244,240,230,.97);color:#1b1a17;padding:16px 18px 12px;border-radius:2px;box-shadow:0 10px 40px rgba(0,0,0,.6);font-family:var(--serif)}
#bookCard .cv{flex:0 0 auto;width:150px;height:225px;position:relative;box-shadow:0 4px 14px rgba(0,0,0,.35);background:#3a3030}
#bookCard .cv canvas,#bookCard .cv img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
#bookCard .tx{flex:1;min-width:0;display:flex;flex-direction:column}
#bookCard .k{font:11px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:#7a7466}
#bookCard .t{font-style:italic;font-size:22px;line-height:1.25;margin-top:6px;overflow-wrap:anywhere}
#bookCard .a{font-size:14px;color:#44413a;margin-top:6px}
#bookCard .ln{margin-top:auto;padding-top:12px;font-size:14px}
#bookCard a{color:#7b2d1c}
#bookCard .ft{display:flex;gap:8px;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid #cfc8b6;font:11px var(--mono);color:#6a655a}
#bookCard .ft .n{min-width:52px;text-align:center}
#bookCard button{font:600 13px var(--mono);background:none;border:1px solid #cfc8b6;color:#44413a;border-radius:4px;padding:4px 10px;cursor:pointer}
#bookCard button.x{margin-left:auto}
#bookCard kbd{color:#1b1a17;border-color:#9a9484;background:#fff}
@media (max-width:520px){#bookCard .bc{gap:12px;padding:12px}#bookCard .cv{width:96px;height:144px}#bookCard .t{font-size:18px}}
#label .fr{margin-top:8px;font:10px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:#7a7466;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#label .fr[hidden]{display:none}
#label .fr a{font:italic 13px var(--serif);letter-spacing:0;text-transform:none;color:#7b2d1c;text-decoration:none;border-bottom:1px solid rgba(123,45,28,.35)}
`;
let styled = false;
const style = () => { if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = CSS; document.head.append(s); };

class Card {
  constructor(k) {
    style();
    this.k = k; this.on = false; this.list = []; this.i = 0;
    const el = this.el = document.createElement('div');
    el.id = 'bookCard'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'A book');
    el.innerHTML = `<div class="bc"><div class="cv"></div><div class="tx"><div class="k"></div><div class="t"></div><div class="a"></div>`
      + `<div class="ln"><a target="_blank" rel="noopener">Open in Open Library ↗</a></div>`
      + `<div class="ft"><button class="p" aria-label="Previous book">‹</button><span class="n"></span><button class="nx" aria-label="Next book">›</button><button class="x">Close <kbd>E</kbd></button></div></div></div>`;
    document.body.append(el);
    el.addEventListener('click', e => {
      if (e.target === el || e.target.closest('.x')) this.close();
      else if (e.target.closest('.p')) this.show(this.i - 1);
      else if (e.target.closest('.nx')) this.show(this.i + 1);
    });
    addEventListener('keydown', e => {
      if (!this.on) return;
      e.stopPropagation();
      const c = e.code;
      if (['Escape', 'KeyE', 'Enter', 'KeyP', 'Space', 'KeyF'].includes(c)) { e.preventDefault(); if (!e.repeat) this.close(); }
      else if (c === 'ArrowLeft' || c === 'KeyA') { e.preventDefault(); this.show(this.i - 1); }
      else if (c === 'ArrowRight' || c === 'KeyD') { e.preventDefault(); this.show(this.i + 1); }
    }, true);
  }
  open(list, i) {
    if (!list.length) return;
    this.list = list; this.on = true; this.el.hidden = false;
    this.k.G.state = 'paused';
    this.show(i);
    // If something else takes the game back (a menu, a resume), the card goes too.
    const watch = () => { if (!this.on) return; if (this.k.G.state !== 'paused') { this.close(true); return; } requestAnimationFrame(watch); };
    requestAnimationFrame(watch);
  }
  show(i) {
    const n = this.list.length; this.i = ((i % n) + n) % n;
    const s = this.list[this.i], b = s.b, q = sel => this.el.querySelector(sel);
    q('.k').textContent = s.why ? 'About ' + s.why : 'From Open Library';
    q('.t').textContent = b.t;
    q('.a').textContent = [b.a, b.y || ''].filter(Boolean).join(', ');
    q('a').href = bookUrl(b);
    q('.n').textContent = `${this.i + 1} / ${n}`;
    q('.p').hidden = q('.nx').hidden = n < 2;
    const cv = q('.cv'); cv.textContent = '';
    const c = cloth(b, s.slot != null ? s.slot : this.i, 240, 360); cv.append(c);
    const want = this.i;
    cover(b).then(img => { if (!img || !this.on || this.i !== want) return; const im = document.createElement('img'); im.alt = ''; im.crossOrigin = 'anonymous'; im.src = img.src; cv.append(im); });
  }
  close(quiet) {
    if (!this.on) return;
    this.on = false; this.el.hidden = true;
    if (!quiet && this.k.G.state === 'paused') this.k.resume();
  }
}

// ---------------------------------------------------------------- the feature
feature({
  id: 'reading',

  init(k) {
    this.k = k;
    const r = k.plan.byId[ROOM]; if (!r) return;
    const P = k.plan, hx = LEN / 2 + 0.3, hz = DEP / 2 + 0.3;
    const clear = q => q && !blocked(P, q.x - hx, q.x + hx, q.z - hz, q.z + hz, r.y - 0.05, r.y + 1.2)
      && !(P.hoops || []).some(h => h.y - h.r < r.y + 1.4 && Math.abs(h.x - q.x) < hx + h.r && Math.abs(h.z - q.z) < hz + h.r);     // nor under a hoop the stunt kit hangs
    // In the south half of the room, by the door to the shop, out of the way of the doors and the stunt kit; or else somewhere clear.
    const z = r.z0 + (r.z1 - r.z0) * 0.765;
    let at = [{ x: r.x0 + 4.1, z }, { x: r.x1 - 4, z }, { x: (r.x0 + r.x1) / 2, z }].find(clear);
    if (!at) { at = freeFloor(P, r, r.x0 + 4.1, z, Math.max(hx, hz), 1.8); if (!clear(at)) at = null; }
    if (!at) return;
    this.r = r; this.at = { x: at.x, y: r.y, z: at.z };
    P.obstacles.push({ x0: at.x - LEN / 2, x1: at.x + LEN / 2, z0: at.z - DEP / 2, z1: at.z + DEP / 2, y0: r.y, y1: r.y + TOP + 0.42 });
    this._build();
    this.card = new Card(k);
  },

  // The display's wood (one mesh) and its sign; the books are added once the list is in.
  _build() {
    const k = this.k, g = this.g = new THREE.Group(), at = this.at;
    g.position.set(at.x, at.y, at.z); g.visible = false; g.name = 'reading room books';
    const parts = [], box = (w, h, d, x, y, z, rx = 0) => { const b = new THREE.BoxGeometry(w, h, d); if (rx) b.rotateX(rx); b.translate(x, y, z); parts.push(b); };
    box(LEN, TOP - 0.03, DEP - 0.06, 0, (TOP - 0.03) / 2, 0);                  // the plinth
    box(LEN + 0.04, 0.03, DEP, 0, TOP - 0.015, 0);                            // its top
    box(LEN - 0.1, 0.3, 0.06, 0, TOP + 0.15, 0);                              // the spine the back rows lean on
    for (const s of [1, -1]) {
      box(LEN - 0.1, ROWS[1].y, 0.2, 0, TOP + ROWS[1].y / 2, s * 0.13);      // the step under the back row
      const t = ROWS[0].tilt, len = 0.22, back = BT + 0.007;                  // the rest the front row lies back on, just behind the books
      box(LEN - 0.1, len, 0.012, 0, TOP + Math.cos(t) * len / 2 - back * Math.sin(t), s * (ROWS[0].z - Math.sin(t) * len / 2 - back * Math.cos(t)), s * -t);
      box(LEN - 0.1, 0.02, 0.012, 0, TOP + 0.01, s * (ROWS[0].z + 0.012));   // the lip the books stand on
    }
    const wood = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ color: 0x7a5236, roughness: 0.6, emissive: 0x7a5236, emissiveIntensity: 0.22 }));
    wood.castShadow = false; wood.receiveShadow = true; g.add(wood);
    parts.forEach(p => p.dispose());
    // The sign on the spine, both ways.
    const c = document.createElement('canvas'); c.width = 512; c.height = 112; const x = c.getContext('2d');
    x.fillStyle = '#f2ecdc'; x.fillRect(0, 0, 512, 112); x.fillStyle = '#7b2d1c'; x.fillRect(0, 0, 512, 6); x.fillRect(0, 106, 512, 6);
    x.fillStyle = '#1b1a17'; x.textAlign = 'center'; x.font = 'italic 44px "Iowan Old Style", Palatino, Georgia, serif'; x.fillText('Tonight’s reading', 256, 56);
    x.font = '19px ui-monospace, Menlo, monospace'; x.fillStyle = '#6a655a'; x.fillText('BOOKS ON THE WORKS ON VIEW · OPEN LIBRARY', 256, 90);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const signMat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.3, roughness: 0.8 });
    for (const s of [1, -1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.136), signMat); m.position.set(0, TOP + 0.3 + 0.068 + 0.002, s * 0.032); m.rotation.y = s > 0 ? 0 : Math.PI; g.add(m); }
    k.group.add(g);
  },

  // Which books stand on the display tonight: the museum's own catalogues, then the makers and the periods most hung.
  _choose(d) {
    const arts = this.k.museum.arts || [], byA = new Map(), byT = new Map();
    for (const a of arts) {
      const w = a.work, ak = nameKey(w.a);
      if (d.artists.has(ak)) { const e = byA.get(ak) || { n: 0, name: w.a }; e.n++; byA.set(ak, e); }
      const t = topicOf(w); if (t && d.topics.has(t.id)) byT.set(t.id, (byT.get(t.id) || 0) + 1);
    }
    const out = [], seen = new Set(), add = (b, why) => { if (b && !seen.has(b.k) && out.length < COLS * 4) { seen.add(b.k); out.push({ b, why }); } };
    const topicName = id => (TOPICS.find(t => t.id === id) || {}).name || '';
    for (const b of (d.topics.get('aic') || []).slice(0, 2)) add(b, 'the Art Institute of Chicago');
    const A = [...byA.values()].sort((a, b) => b.n - a.n), T = [...byT].sort((a, b) => b[1] - a[1]);
    for (let i = 0, j = 0; out.length < COLS * 4 && (i < A.length || j < T.length);) {
      for (let n = 0; n < 2 && i < A.length; n++, i++) add(d.artists.get(nameKey(A[i].name))[0], A[i].name);
      if (j < T.length) { const [id] = T[j++]; add(d.topics.get(id)[0], topicName(id)); }
    }
    for (const b of d.all) add(b, '');
    return out;
  },

  // Put the books on the display: bodies as one instanced mesh, each cover its own little picture.
  _stock(d) {
    if (this.slots || !this.g) return;
    const list = d ? this._choose(d) : [];
    const n = COLS * 4, g = this.g, bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(BW, BH, BT), new THREE.MeshStandardMaterial({ roughness: 0.75, emissive: 0x2a2620, emissiveIntensity: 1 }), n);
    const plane = new THREE.PlaneGeometry(BW * 0.985, BH * 0.985), m4 = new THREE.Matrix4(), o = new THREE.Object3D(), col = new THREE.Color();
    this.slots = [];
    let i = 0;
    for (const s of [-1, 1]) for (const row of ROWS) for (let c = 0; c < COLS; c++, i++) {
      // the slot's frame: face s, column c, leaning back by the row's tilt; the cover faces out
      const lx = (c - (COLS - 1) / 2) * SP;
      o.position.set(s * lx, TOP + row.y, s * row.z); o.rotation.set(0, s > 0 ? 0 : Math.PI, 0); o.updateMatrix();
      const frame = o.matrix.clone().multiply(m4.makeRotationX(-row.tilt));
      const item = list[i] || null, slot = { i, face: s, col: c, front: row === ROWS[0], item };
      if (item) item.slot = i;
      bodies.setMatrixAt(i, frame.clone().multiply(m4.makeTranslation(0, BH / 2, -BT / 2)));
      bodies.setColorAt(i, col.set(CLOTH[i % CLOTH.length]));
      const tex = new THREE.CanvasTexture(cloth(item && item.b, i)); tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.28, roughness: 0.7 });
      const cv = new THREE.Mesh(plane, mat); cv.matrixAutoUpdate = false;
      cv.matrix.copy(frame).multiply(m4.makeTranslation(0, BH / 2, 0.0012)); cv.matrixWorldNeedsUpdate = true;
      g.add(cv); slot.mat = mat; this.slots.push(slot);
    }
    bodies.instanceMatrix.needsUpdate = true; if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
    g.add(bodies);
    // the card leafs through them in the order they stand
    this.items = this.slots.filter(s => s.item).map(s => s.item);
    this.queue = this.slots.filter(s => s.item && s.item.b.c);
  },

  // One cover a moment, only while the toy is at the display.
  _covers(dt) {
    if (!this.queue || !this.queue.length) return;
    this.wait = (this.wait || 0) - dt; if (this.wait > 0) return; this.wait = 0.15;
    const s = this.queue.shift();
    cover(s.item.b).then(img => {
      if (!img) return;                       // stays in cloth
      const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 2; tex.needsUpdate = true;
      const old = s.mat.map; s.mat.map = tex; s.mat.emissiveMap = tex; s.mat.needsUpdate = true; if (old) old.dispose();
    });
  },

  active(k) { return !!this.card && (this.card.on || !!this.fr || this.g.visible || k.inRoom(ROOM, 6)); },
  update(dt, k) {
    // The further-reading line goes when the look it was for is over.
    if (this.fr && (k.G.state !== 'study' || k.looking !== this.fr)) { this.fr = null; this._line(null); }
    const near = k.inRoom(ROOM, 6);
    this.g.visible = near;
    if (!near) return;
    if (!this.asked) { this.asked = true; loadBooks().then(d => this._stock(d)); }
    if (this.slots && k.close(this.at, 7, 2)) this._covers(dt);
    if (k.close(this.at, 4, 1.5)) k.once('reading', 'A display of books in the reading room: real ones, about what is on the walls tonight.', 5);
  },

  near(v, k) {
    if (!this.items || !this.items.length || this.card.on || k.G.state !== 'play') return null;
    const p = k.pos, dx = p.x - this.at.x, dz = p.z - this.at.z;
    if (Math.abs(p.y - this.at.y) > 1.2 || Math.abs(dx) > LEN / 2 + 0.35 || Math.abs(dz) < DEP / 2 - 0.05 || Math.abs(dz) > DEP / 2 + 1.1) return null;
    const s = dz > 0 ? 1 : -1, lx = dx * s, c = Math.max(0, Math.min(COLS - 1, Math.round(lx / SP + (COLS - 1) / 2)));
    const slot = this.slots.find(q => q.face === s && q.front && q.col === c && q.item) || this.slots.find(q => q.item);
    return { verb: 'READ', hint: 'Books about the works on view tonight. E to read one.', act: () => this.card.open(this.items, this.items.indexOf(slot.item)) };
  },

  // Looking closer at a work: one line of further reading at the foot of its label.
  onLook(art, k) {
    this.fr = art; this._line(null);
    loadBooks().then(d => { if (d && this.fr === art && k.looking === art) this._line(booksFor(art.work, 2)); });
  },
  _line(list) {
    if (!this.line) {
      const label = document.getElementById('label'); if (!label) return;
      style(); this.line = document.createElement('div'); this.line.className = 'fr'; label.append(this.line);
    }
    const el = this.line; el.textContent = ''; el.hidden = !list || !list.length;
    if (el.hidden) return;
    el.append('Further reading ');
    list.forEach((b, i) => {
      if (i) el.append(' · ');
      const a = document.createElement('a'); a.href = bookUrl(b); a.target = '_blank'; a.rel = 'noopener';
      a.textContent = b.t + ' ↗'; a.title = [b.t, b.a, b.y || ''].filter(Boolean).join(', ') + ' (Open Library)';
      el.append(a);
    });
  },

  spots() { return this.at ? [{ kind: 'todo', id: 'reading', name: 'Tonight’s reading (books from Open Library)', ...this.at }] : []; },
  reset() { if (this.card) this.card.close(true); },
});
