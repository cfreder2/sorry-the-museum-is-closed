// Whiteboards the staff have left written on.
//
// src/furnish.js hangs the boards (low, where a toy on the floor can see them) and src/boardtext.js
// says what is on each. This file does the writing: each board's text is drawn in marker on a small
// canvas the first time the camera comes near and laid over the board, and thrown away again when
// the camera has gone. Pull up in front of one and the action button reads READ: that brings the
// camera goes and stands square in front of the board (src/stage.js), which is written out again
// finer for the occasion, and its words are put on the page as text for anyone who cannot see it.
//
// Reading is remembered ('after-hours.boards'), and each read is announced with
//   window.dispatchEvent(new CustomEvent('museum:board', { detail: { id, read } }))      read: how many different boards so far

import * as THREE from 'three';
import { once } from './budget.js';
import { BOARD, plainText } from './boardtext.js';

const KEY = 'after-hours.boards';
const FONT = '"Marker Felt", "Bradley Hand", "Segoe Print", "Chalkboard SE", "Comic Sans MS", "Comic Neue", cursive';
const INK = { blue: '#1d4fa8', black: '#23252b', green: '#1c7a3e', red: '#c0281c' };
const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

// ---- the marker ----

// Small drawings for the corner of a board, each in a box about 1 across and 1 down.
const DOODLES = {
  car(c) { c.strokeRect(0.1, 0.45, 0.8, 0.25); c.strokeRect(0.3, 0.25, 0.4, 0.2); for (const x of [0.28, 0.72]) { c.beginPath(); c.arc(x, 0.72, 0.11, 0, 7); c.stroke(); } c.beginPath(); c.moveTo(0.35, 0.25); c.lineTo(0.2, 0.02); c.stroke(); },
  button(c) { c.strokeStyle = INK.red; c.beginPath(); c.arc(0.5, 0.45, 0.3, 0, 7); c.stroke(); c.beginPath(); c.arc(0.5, 0.45, 0.18, 0, 7); c.stroke(); c.strokeStyle = INK.black; c.strokeRect(0.12, 0.78, 0.76, 0.14); },
  cards(c) { for (const [x, r] of [[0.2, -0.25], [0.42, 0], [0.64, 0.25]]) { c.save(); c.translate(x + 0.1, 0.5); c.rotate(r); c.strokeRect(-0.14, -0.26, 0.28, 0.5); c.restore(); } c.fillStyle = INK.red; c.beginPath(); c.arc(0.52, 0.5, 0.05, 0, 7); c.fill(); },
  tally(c) { for (let k = 0; k < 2; k++) { for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0.08 + k * 0.48 + i * 0.09, 0.2); c.lineTo(0.1 + k * 0.48 + i * 0.09, 0.75); c.stroke(); } c.beginPath(); c.moveTo(0.03 + k * 0.48, 0.65); c.lineTo(0.42 + k * 0.48, 0.3); c.stroke(); } },
  arrow(c) { c.beginPath(); c.moveTo(0.05, 0.55); c.bezierCurveTo(0.3, 0.2, 0.6, 0.8, 0.9, 0.45); c.stroke(); c.beginPath(); c.moveTo(0.72, 0.36); c.lineTo(0.92, 0.44); c.lineTo(0.78, 0.62); c.stroke(); },
  screen(c) { c.strokeRect(0.12, 0.15, 0.76, 0.52); c.strokeRect(0.36, 0.67, 0.28, 0.12); c.strokeStyle = INK.green; c.beginPath(); c.moveTo(0.22, 0.5); c.lineTo(0.5, 0.5); c.lineTo(0.5, 0.3); c.lineTo(0.72, 0.3); c.stroke(); c.fillStyle = INK.red; c.fillRect(0.74, 0.44, 0.06, 0.06); },
  flask(c) { c.beginPath(); c.moveTo(0.4, 0.1); c.lineTo(0.4, 0.4); c.lineTo(0.15, 0.85); c.lineTo(0.85, 0.85); c.lineTo(0.6, 0.4); c.lineTo(0.6, 0.1); c.stroke(); c.strokeStyle = INK.green; c.beginPath(); c.moveTo(0.27, 0.65); c.lineTo(0.73, 0.65); c.stroke(); for (const [x, y] of [[0.45, 0.72], [0.58, 0.77], [0.5, 0.55]]) { c.beginPath(); c.arc(x, y, 0.035, 0, 7); c.stroke(); } },
  brush(c) { c.beginPath(); c.moveTo(0.1, 0.85); c.lineTo(0.65, 0.3); c.stroke(); c.strokeStyle = INK.blue; c.beginPath(); c.moveTo(0.65, 0.3); c.bezierCurveTo(0.75, 0.1, 0.95, 0.2, 0.8, 0.4); c.closePath(); c.stroke(); },
  frame(c) { c.strokeRect(0.1, 0.18, 0.8, 0.62); c.strokeRect(0.2, 0.28, 0.6, 0.42); c.strokeStyle = INK.green; c.beginPath(); c.moveTo(0.22, 0.66); c.lineTo(0.42, 0.42); c.lineTo(0.56, 0.58); c.lineTo(0.66, 0.48); c.lineTo(0.78, 0.66); c.stroke(); },
  puck(c) { c.beginPath(); c.ellipse(0.5, 0.5, 0.42, 0.26, 0, 0, 7); c.stroke(); c.strokeRect(0.02, 0.38, 0.1, 0.24); c.strokeRect(0.88, 0.38, 0.1, 0.24); c.fillStyle = INK.red; c.beginPath(); c.arc(0.55, 0.5, 0.05, 0, 7); c.fill(); },
  ramp(c) { c.beginPath(); c.moveTo(0.05, 0.85); c.lineTo(0.75, 0.85); c.lineTo(0.75, 0.45); c.closePath(); c.stroke(); c.strokeStyle = INK.red; c.strokeRect(0.62, 0.12, 0.26, 0.12); c.beginPath(); c.moveTo(0.5, 0.5); c.quadraticCurveTo(0.62, 0.3, 0.7, 0.28); c.stroke(); },
  sun(c) { c.strokeStyle = INK.red; c.beginPath(); c.arc(0.5, 0.5, 0.2, 0, 7); c.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(0.5 + Math.cos(a) * 0.27, 0.5 + Math.sin(a) * 0.27); c.lineTo(0.5 + Math.cos(a) * 0.42, 0.5 + Math.sin(a) * 0.42); c.stroke(); } },
  star(c) { c.strokeStyle = INK.blue; c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; c[i ? 'lineTo' : 'moveTo'](0.5 + Math.cos(a) * 0.4, 0.5 + Math.sin(a) * 0.4); } c.closePath(); c.stroke(); },
  hoop(c) { c.strokeStyle = INK.red; c.beginPath(); c.ellipse(0.5, 0.42, 0.16, 0.34, 0, 0, 7); c.stroke(); c.strokeStyle = INK.black; c.beginPath(); c.moveTo(0.05, 0.5); c.lineTo(0.3, 0.46); c.moveTo(0.7, 0.4); c.lineTo(0.95, 0.36); c.stroke(); c.beginPath(); c.moveTo(0.5, 0.76); c.lineTo(0.5, 0.95); c.stroke(); },
  pipe(c) { c.beginPath(); c.moveTo(0.05, 0.3); c.lineTo(0.6, 0.3); c.lineTo(0.6, 0.9); c.moveTo(0.05, 0.48); c.lineTo(0.42, 0.48); c.lineTo(0.42, 0.9); c.stroke(); c.strokeStyle = INK.red; c.beginPath(); c.arc(0.3, 0.39, 0.13, 0, 7); c.stroke(); },
  parcel(c) { c.strokeRect(0.15, 0.3, 0.7, 0.5); c.beginPath(); c.moveTo(0.5, 0.3); c.lineTo(0.5, 0.8); c.moveTo(0.15, 0.55); c.lineTo(0.85, 0.55); c.stroke(); c.strokeStyle = INK.green; for (const k of [0, 1, 2]) { c.beginPath(); c.arc(0.5, 0.18, 0.08 + k * 0.07, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); } },
  snowman(c) { c.beginPath(); c.arc(0.5, 0.72, 0.22, 0, 7); c.stroke(); c.beginPath(); c.arc(0.5, 0.4, 0.15, 0, 7); c.stroke(); c.beginPath(); c.arc(0.5, 0.18, 0.1, 0, 7); c.stroke(); c.strokeStyle = INK.red; c.beginPath(); c.moveTo(0.5, 0.19); c.lineTo(0.66, 0.22); c.stroke(); },
  lion(c) { c.beginPath(); c.arc(0.5, 0.5, 0.2, 0, 7); c.stroke(); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.beginPath(); c.arc(0.5 + Math.cos(a) * 0.3, 0.5 + Math.sin(a) * 0.3, 0.08, 0, 7); c.stroke(); } c.fillStyle = INK.black; c.fillRect(0.41, 0.44, 0.04, 0.04); c.fillRect(0.55, 0.44, 0.04, 0.04); c.beginPath(); c.moveTo(0.44, 0.58); c.quadraticCurveTo(0.5, 0.64, 0.56, 0.58); c.stroke(); },
  alien(c) { c.strokeStyle = INK.green; c.beginPath(); c.moveTo(0.5, 0.92); c.bezierCurveTo(0.05, 0.6, 0.1, 0.05, 0.5, 0.08); c.bezierCurveTo(0.9, 0.05, 0.95, 0.6, 0.5, 0.92); c.stroke(); c.fillStyle = INK.black; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(0.5 + s * 0.17, 0.45, 0.12, 0.07, s * 0.5, 0, 7); c.fill(); } c.beginPath(); c.moveTo(0.44, 0.76); c.lineTo(0.56, 0.76); c.stroke(); },
};
// The big ones, which get the right-hand side of the board to themselves.
const BIG = {
  // Days since the last incident: 3 crossed out, 1 crossed out, 0.
  zero(c, W, H) {
    c.font = `${H * 0.2}px ${FONT}`; c.fillStyle = INK.black; c.textAlign = 'center';
    for (const [t, x] of [['3', 0.2], ['1', 0.36]]) { c.fillText(t, W * x, H * 0.44); c.strokeStyle = INK.red; c.lineWidth = H * 0.012; c.beginPath(); c.moveTo(W * (x - 0.06), H * 0.47); c.lineTo(W * (x + 0.06), H * 0.29); c.stroke(); }
    c.strokeStyle = INK.red; c.lineWidth = H * 0.014; c.strokeRect(W * 0.47, H * 0.2, W * 0.2, H * 0.3);
    c.font = `${H * 0.27}px ${FONT}`; c.fillStyle = INK.red; c.fillText('0', W * 0.57, H * 0.445);
    c.textAlign = 'left';
  },
  // The object, with labels and arrows.
  ufo(c, W, H) {
    const x = W * 0.74, y = H * 0.5, r = W * 0.17;
    c.strokeStyle = INK.black; c.lineWidth = H * 0.009;
    c.beginPath(); c.ellipse(x, y, r, r * 0.3, 0, 0, 7); c.stroke(); c.beginPath(); c.arc(x, y - r * 0.2, r * 0.42, Math.PI, 0); c.stroke();
    c.strokeStyle = INK.green; for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(x + i * r * 0.38, y + r * 0.08, r * 0.05, 0, 7); c.stroke(); }
    c.beginPath(); c.moveTo(x - r * 0.3, y + r * 0.3); c.lineTo(x - r * 0.7, y + r * 1.1); c.moveTo(x + r * 0.3, y + r * 0.3); c.lineTo(x + r * 0.7, y + r * 1.1); c.stroke();
    c.font = `${H * 0.05}px ${FONT}`; c.fillStyle = INK.blue; c.textAlign = 'center';
    c.fillText('dome', x, y - r * 0.82); c.fillText('lights (why?)', x, y + r * 0.62); c.fillStyle = INK.red; c.fillText('beam ??', x, y + r * 1.32);
    c.textAlign = 'left';
  },
  // Stars, joined up, and one of them ringed.
  chart(c, W, H) {
    const P = [[0.62, 0.2], [0.72, 0.34], [0.86, 0.26], [0.9, 0.5], [0.76, 0.62], [0.66, 0.78], [0.9, 0.82]];
    c.strokeStyle = INK.blue; c.lineWidth = H * 0.006; c.beginPath(); P.forEach(([x, y], i) => c[i ? 'lineTo' : 'moveTo'](W * x, H * y)); c.stroke();
    c.fillStyle = INK.black; for (const [x, y] of P) { c.beginPath(); c.arc(W * x, H * y, H * 0.012, 0, 7); c.fill(); }
    c.strokeStyle = INK.red; c.lineWidth = H * 0.01; c.beginPath(); c.arc(W * 0.76, H * 0.62, H * 0.05, 0, 7); c.stroke();
    c.font = `${H * 0.05}px ${FONT}`; c.fillStyle = INK.red; c.fillText('them', W * 0.8, H * 0.69); c.fillStyle = INK.green; c.fillText('us', W * 0.57, H * 0.17);
  },
};

// A line too long for the board is carried on to the rows below it (some boards are whole sentences, not jottings). A row that
// carries on comes back marked '+' before its line's own mark: the same ink and indent, no bullet or tick box of its own.
// The more rows there are the smaller the hand, so the hand is tried a row smaller at a time until the rows it makes fit the board:
// the rows come back with that count on them (`n`), for drawBoard to space them by.
function wrapLines(c, W, H, lines, doodle) {
  const big = BIG[doodle], mx = W * 0.055, head = H * 0.125;
  let n = Math.max(lines.length, 6), out = lines;
  for (let pass = 0; pass < 40; pass++, n++) {
    const step = Math.min(H * 0.118, (H * 0.9 - head) / (n - 0.4)); out = [];
    for (const raw of lines) {
      const k = raw[0], marked = /^[#\->!=\[]/.test(raw);
      if (!raw || k === '=' || k === '#') { out.push(raw); continue; }      // (a heading is one row: squeezed, never carried on)
      const mark = marked ? raw.slice(0, k === '[' && raw[1] === 'x' ? 2 : 1) : '', text = marked ? raw.slice(mark.length).trim() : raw;
      const size = k === '#' ? head : step * 0.66, indent = k === '>' ? W * 0.07 : k === '-' || k === '[' ? W * 0.04 : 0;
      c.font = `${k === '#' ? 'bold ' : ''}${size}px ${FONT}`;
      const room = i => W - 2 * mx - indent - (big && i > 0 ? W * 0.44 : !big && doodle && i < 2 ? W * 0.2 : 0), wide = t => c.measureText(t.replace(/=+/g, 'XXXXXX')).width;
      if (wide(text) <= room(out.length) * 1.04) { out.push(raw); continue; }
      let row = '', first = true;
      for (const word of text.split(/\s+/)) { const t = row ? row + ' ' + word : word; if (row && wide(t) > room(out.length)) { out.push((first ? '' : '+') + mark + row); first = false; row = word; } else row = t; }
      if (row) out.push((first ? '' : '+') + mark + row);
    }
    if (out.length <= n) break;
  }
  out.n = n; return out;
}

// Write `lines` (see src/boardtext.js for the marks at the start of each) on a board W by H.
export function drawBoard(c, W, H, lines, doodle, seed = 1, wrap = false) {
  c.fillStyle = '#f4f5f1'; c.fillRect(0, 0, W, H);
  // Somebody wiped it first, not very well.
  let s = seed; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  c.globalAlpha = 0.05; c.fillStyle = '#6a7a9a'; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(rnd() * W, rnd() * H, W * (0.12 + rnd() * 0.2), H * 0.06, rnd() * 3, 0, 7); c.fill(); } c.globalAlpha = 1;
  if (wrap) lines = wrapLines(c, W, H, lines, doodle);      // (a board of sentences says so, `wrap` in src/boardtext.js: the jotted ones are drawn as they always were)
  const big = BIG[doodle], mx = W * 0.055, n = Math.max(lines.length, 6, lines.n || 0), head = H * 0.125, step = Math.min(H * 0.118, (H * 0.9 - head) / (n - 0.4));
  let y = H * 0.14;
  c.textBaseline = 'alphabetic'; c.lineCap = 'round'; c.lineJoin = 'round';
  lines.forEach((raw, i) => {
    const cont = raw[0] === '+'; if (cont) raw = raw.slice(1);      // (a row carried on from the one above: wrapLines)
    const k = raw[0], text = /^[#\->!=\[]/.test(raw) ? raw.slice(k === '[' && raw[1] === 'x' ? 2 : 1).trim() : raw;
    const size = k === '#' ? head : step * 0.66, indent = k === '>' ? W * 0.07 : k === '-' || k === '[' ? W * 0.04 : 0;
    const room = W - 2 * mx - indent - (big && i > 0 ? W * 0.44 : !big && doodle && i < 2 ? W * 0.2 : 0);
    if (i) y += k === '#' ? head : lines.n && lines[i - 1][0] === '#' ? Math.max(step, head * 0.66) : step;      // (in a small hand, the row under a heading still clears its underline)
    if (!raw) return;
    c.save(); c.translate(mx + indent, y); c.rotate((rnd() - 0.5) * 0.022);
    if (k === '=') { c.fillStyle = '#16171a'; const w = room * (text ? Math.min(1, text.length / 24) : 0.45 + rnd() * 0.45); c.fillRect(0, -size * 0.8, w, size * 0.95); c.restore(); return; }
    let px = size; c.font = `${k === '#' ? 'bold ' : ''}${px}px ${FONT}`;
    const fit = c.measureText(text.replace(/=+/g, 'XXXXXX')).width; if (fit > room) { px *= room / fit; c.font = `${k === '#' ? 'bold ' : ''}${px}px ${FONT}`; }
    const ink = k === '#' ? INK.blue : k === '!' ? INK.red : k === '>' ? INK.green : INK.black;
    c.fillStyle = ink; c.strokeStyle = ink; c.lineWidth = Math.max(1.5, px * 0.07);
    if (k === '-' && !cont) { c.beginPath(); c.moveTo(-W * 0.032, -px * 0.3); c.lineTo(-W * 0.012, -px * 0.3); c.stroke(); }
    if (k === '[' && !cont) { c.strokeRect(-W * 0.036, -px * 0.72, px * 0.62, px * 0.62); if (raw[1] === 'x') { c.strokeStyle = INK.green; c.beginPath(); c.moveTo(-W * 0.034, -px * 0.4); c.lineTo(-W * 0.036 + px * 0.25, -px * 0.12); c.lineTo(-W * 0.036 + px * 0.8, -px * 0.95); c.stroke(); } }
    // A run of ==== inside a line is blacked out where it stands.
    let x = 0;
    for (const part of text.split(/(=+)/)) { if (!part) continue; if (part[0] === '=') { const w = c.measureText('XXXXXX').width; c.fillStyle = '#16171a'; c.fillRect(x, -px * 0.8, w, px * 0.95); c.fillStyle = ink; x += w; } else { c.fillText(part, x, 0); x += c.measureText(part).width; } }
    if (k === '!' || k === '#') { c.beginPath(); c.moveTo(0, px * 0.16); c.quadraticCurveTo(x * 0.5, px * (0.1 + rnd() * 0.14), x, px * 0.18); c.stroke(); }
    c.restore();
  });
  if (big) big(c, W, H);
  else if (DOODLES[doodle]) { const d = H * 0.2; c.save(); c.translate(W - mx - d, H * 0.035); c.scale(d, d); c.lineWidth = 0.035; c.strokeStyle = INK.black; DOODLES[doodle](c); c.restore(); }
  // The tray: two pens and the rubber.
  c.fillStyle = INK.red; c.fillRect(W * 0.42, H * 0.972, W * 0.07, H * 0.016); c.fillStyle = INK.blue; c.fillRect(W * 0.51, H * 0.972, W * 0.07, H * 0.016); c.fillStyle = '#3a3d42'; c.fillRect(W * 0.6, H * 0.966, W * 0.05, H * 0.024);
}

// ---- the boards in the building ----

export class Whiteboards {
  constructor(museum, plan) {
    this.plan = plan; this.on = null; this.read = new Set(); this.live = 0;
    try { for (const id of JSON.parse(localStorage.getItem(KEY) || '[]')) this.read.add(id); } catch { /* no storage */ }
    const g = this.group = new THREE.Group(); museum.group.add(g);
    this.blank = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.72, 0.73, 0.71) });
    this.list = (plan.marks || []).filter(m => m.kind === 'board' && m.text && BOARD[m.text]).map(m => {
      const def = BOARD[m.text], mesh = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), this.blank);
      mesh.position.set(m.x + m.fx * 0.004, m.y, m.z + m.fz * 0.004); mesh.rotation.y = Math.atan2(m.fx, m.fz);
      mesh.matrixAutoUpdate = false; mesh.updateMatrix(); mesh.visible = false;
      g.add(mesh);
      return { id: def.id, def, lines: def.lines, title: def.title, doodle: def.doodle, room: m.room, x: m.x, y: m.y, z: m.z, w: m.w, h: m.h, fx: m.fx, fz: m.fz, mesh, tex: null, secret: !!def.secret };
    });
    this.byId = Object.fromEntries(this.list.map(b => [b.id, b]));
    this._dom();
  }
  get total() { return this.list.filter(b => !b.secret).length; }

  // What a board says can be changed (the Director's is written from tonight's hang: src/secret.js).
  setLines(id, lines, title) { const b = this.byId[id]; if (!b) return; b.lines = lines; if (title) b.title = title; this._wipe(b); }

  // Where a board is, as src/stage.js wants it: the camera goes and stands square in front of it.
  surface(b) { return { x: b.x + b.fx * 0.004, y: b.y, z: b.z + b.fz * 0.004, nx: b.fx, ny: 0, nz: b.fz, w: b.w + 0.1, h: b.h + 0.1 }; }
  _wipe(b) { if (b.tex) { b.tex.dispose(); b.tex = null; b.mesh.material.dispose(); b.mesh.material = this.blank; this.live--; } }
  _write(b, px = 512) {
    const cv = document.createElement('canvas'); cv.width = px; cv.height = Math.round(px * b.h / b.w); b.px = px;
    drawBoard(cv.getContext('2d'), cv.width, cv.height, b.lines, b.doodle, hash(b.id), !!(b.def && b.def.wrap));
    const tex = new THREE.CanvasTexture(once(cv)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;      // (written once: a new canvas if it is written again. On a phone let go once it is on the card, budget.js)
    b.tex = tex; b.mesh.material = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.8, 0.8, 0.8) }); this.live++;
  }
  // Each frame: boards near the camera are shown, and written if they have not been (one a frame); those left behind are wiped.
  update(cam) {
    let wrote = false;
    for (const b of this.list) {
      const d2 = (cam.x - b.x) ** 2 + (cam.z - b.z) ** 2, dy = Math.abs(cam.y - b.y);
      const near = d2 < 30 * 30 && dy < 6;
      b.mesh.visible = near;
      if (near && !b.tex && !wrote && d2 < 22 * 22) { this._write(b); wrote = true; }
      else if (b.tex && b !== this.on && (d2 > 46 * 46 || dy > 9)) this._wipe(b);
    }
  }
  // The board this toy is pulled up in front of, if any.
  near(v) {
    if (this.on) return null;
    let best = null, bd = 2.9;
    for (const b of this.list) {
      const dy = v.pos.y - b.y;
      if (dy < -2.1 || dy > 1.6) continue;      // (b.y is the board's middle, 1.7 to 1.8 m up since the boards were raised off the floor: at -1.6 no car on the floor could read any of them)
      const dx = v.pos.x - b.x, dz = v.pos.z - b.z, out = dx * b.fx + dz * b.fz, d = Math.hypot(dx, dz);
      if (out < 0.25 || d > bd || Math.abs(dx * b.fz - dz * b.fx) > b.w / 2 + 0.7 || Math.hypot(v.vel.x, v.vel.z) > 4) continue;
      best = b; bd = d;
    }
    return best;
  }

  // ---- the card ----
  // The camera is about to stand in front of this one (main.js and src/stage.js do that): write it out again, finer, and say what it says.
  open(b) {
    this.on = b;
    if (b.px !== 1024) { this._wipe(b); this._write(b, 1024); }
    b.mesh.visible = true;
    const text = plainText(b.lines);
    this.el.querySelector('#bcTitle').textContent = b.title;
    this.el.querySelector('#bcText').textContent = text;
    this.el.hidden = false;
    this.el.querySelector('button').focus({ preventScroll: true });
    const fresh = !this.read.has(b.id);
    if (fresh) { this.read.add(b.id); try { localStorage.setItem(KEY, JSON.stringify([...this.read])); } catch { /* fine */ } }
    try { window.dispatchEvent(new CustomEvent('museum:board', { detail: { id: b.id, read: this.read.size, fresh } })); } catch { /* fine */ }
  }
  close() { this.on = null; this.el.hidden = true; }
  reset() { this.read.clear(); try { localStorage.removeItem(KEY); } catch { /* fine */ } }

  _dom() {
    const el = this.el = document.createElement('section');
    el.id = 'boardCard'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'bcTitle');
    el.innerHTML = '<div class="bc"><h2 id="bcTitle"></h2><p id="bcText" aria-live="polite"></p><button data-act="closeBoard">Back</button></div>';
    document.body.append(el);
  }
}
