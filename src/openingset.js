// The set for the opening (src/opening.js): a child's bedroom high over Monroe Street, looking out across Butler Field
// at the light show and the museum beyond; and the few things the opening adds to the night outside (penguins on the
// snow, lights that dance, a green glow in the museum's windows).
//
// The room is drawn without lamps of its own (a new lamp in the scene would recompile every material in the museum):
// one small shader, with every light the room has painted into each corner when the room is built, and a colour for
// each that opening.js turns up and down: the sky in the window, the hall beyond the door, the lamp on her bookcase,
// the string of bulbs round the window, and the colours of the light show coming up from the park onto the ceiling.
// Nothing here has a face.
//
//   const set = buildSet(G, { eye, aim });     eye: where the child's eyes are (world); aim: what the window faces
//   set.room       the bedroom (a Group, in the scene)       set.out      what is added out of doors
//   set.rig        her arms and the handset, held in front of the camera (opening.js puts it there each frame)
//   set.L(x,y,z)   a point of the room, in the world         set.dispose()

import * as THREE from 'three';
import { canvasTex } from './glowkit.js';
import { groundAt } from './plan.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// The room, in its own metres: the glass is the plane z = 0, the room is behind it (+z), x to the right as you look out.
export const ROOM = { x0: -1.9, x1: 2.0, z1: 3.8, h: 2.55, win: { x0: -0.6, x1: 0.6, y0: 0.92, y1: 2.15 }, eye: V(0, 1.2, 1.0) };
export const DOORWAY = { z0: 1.85, z1: 2.7, h: 2.04, ajar: -0.62 };
const SHELF = { x0: 1.42, x1: 2.0, z0: 0.34, z1: 1.76, y: 0.72 };          // the low bookcase by the window
const BED = { x0: -1.86, x1: -1.0, z0: 0.14, z1: 1.76 };
// Where its lights come from: the window, the door, the lamp; and three places far below, for the colours of the show.
const WIN = V(0, 1.55, 0.02), DOOR = V(-1.8, 1.15, 2.25), LAMP = V(1.74, SHELF.y + 0.3, 0.56);
const SHOW = [V(9, -4.5, -10), V(0, -9, -11), V(-9, -4.5, -10)];
// The string of bulbs round the window: up one side of the casing, across the top, down the other.
const BULB_HEX = [0xff3b30, 0xffc23a, 0x35d05a, 0x3b8cff, 0xff5fb0];
const BULBS = (() => {
  const W = ROOM.win, xl = W.x0 - 0.035, xr = W.x1 + 0.035, yb = W.y0 + 0.1, yt = W.y1 + 0.05, out = [];
  const legs = [[xl, yb, xl, yt], [xl, yt, xr, yt], [xr, yt, xr, yb]]; let i = 0, carry = 0.06;
  for (const [ax, ay, bx, by] of legs) {
    const len = Math.hypot(bx - ax, by - ay), up = ax === bx;
    for (let d = carry; d < len; d += 0.125, i++) {
      const u = d / len, wob = Math.sin(d * 23 + i) * 0.012;
      out.push({ p: V(ax + (bx - ax) * u + (up ? wob : 0), ay + (by - ay) * u - (up ? 0 : Math.sin(u * Math.PI * 4) ** 2 * 0.022), 0.082), c: new THREE.Color(BULB_HEX[i % BULB_HEX.length]) });
      carry = d + 0.125 - len;
    }
  }
  return out;
})();
// What stands on the floor, and so keeps the light off the boards and the wall behind it.
const BLOCKS = [{ ...BED, top: 0.32 }, { ...SHELF, top: SHELF.y }, { x0: -0.54, x1: 0.54, z0: 0, z1: 0.22, top: 0.74 }, { x0: 0.95, x1: 1.9, z0: 3.36, z1: 3.8, top: 0.86 }];

const M = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(sx, sy, sz));

// Darker where two of the room's surfaces meet.
function edge(p) {
  const { x0, x1, z1, h } = ROOM;
  if (p.x < x0 - 0.02 || p.x > x1 + 0.02 || p.z < -0.02 || p.z > z1 + 0.02 || p.y < -0.02 || p.y > h + 0.02) return 1;
  let a = 9, b = 9;
  for (const d of [p.x - x0, x1 - p.x, p.y, h - p.y, p.z, z1 - p.z]) { const v = Math.max(0, d); if (v < a) { b = a; a = v; } else if (v < b) b = v; }
  return 1 - 0.42 * Math.exp(-b / 0.2);
}
// Darker under the furniture, and round the foot of it.
function under(p) {
  let s = 1;
  for (const b of BLOCKS) {
    const dx = Math.max(b.x0 - p.x, 0, p.x - b.x1), dz = Math.max(b.z0 - p.z, 0, p.z - b.z1);
    s *= 1 - 0.62 * (1 - sm(0, 0.3, Math.hypot(dx, dz))) * (1 - sm(b.top, b.top + 0.25, p.y));
  }
  return s;
}
// How much of one of the show's colours reaches p: only by way of the window.
function showAt(p, nn, S, l) {
  const W = ROOM.win; l.copy(p).sub(S);
  if (l.z < 0.05) return 0;
  const t = -S.z / l.z; if (t > 1.001) return 0;
  const qx = S.x + l.x * t, qy = S.y + l.y * t, len = l.length(), dl = len * Math.max(0, 1 - t);
  const mask = sm(W.x0 - 0.1, W.x0 + 0.1, qx) * (1 - sm(W.x1 - 0.1, W.x1 + 0.1, qx)) * sm(W.y0 - 0.08, W.y0 + 0.1, qy) * (1 - sm(W.y1 - 0.1, W.y1 + 0.08, qy));
  return mask * (0.12 + 0.88 * Math.max(0, -nn.dot(l) / len)) / (1 + dl * dl * 0.1);
}

/** A piece of the room: its colour and the light that reaches it, painted in at each corner. With `bake` the piece is
 *  moved to where `m` puts it; without, it is only lit as if it stood there (things that are carried about).
 *  shell: the walls and the floor, which the furniture shades. uv: keep its picture's coordinates. */
function lit(geo, hex, { m = null, bake = true, self = 0, cool = 1, warm = 1, lamp = 1, glow = 1, shell = false, uv = false } = {}) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  const P = g.attributes.position, N = g.attributes.normal, n = P.count;
  const aC = new Float32Array(n * 3), aL = new Float32Array(n * 4), aB = new Float32Array(n * 3), aS = new Float32Array(n * 3), c = new THREE.Color(hex);
  const p = V(0, 0, 0), nn = V(0, 0, 0), l = V(0, 0, 0), nm = m ? new THREE.Matrix3().getNormalMatrix(m) : null;
  for (let i = 0; i < n; i++) {
    p.fromBufferAttribute(P, i); nn.fromBufferAttribute(N, i);
    if (m) { p.applyMatrix4(m); nn.applyMatrix3(nm).normalize(); if (bake) P.setXYZ(i, p.x, p.y, p.z); }
    const ao = edge(p) * (shell ? under(p) : 1);
    let d = l.copy(WIN).sub(p).length(), k = Math.max(0, nn.dot(l) / Math.max(0.001, d));
    const co = (0.2 + 0.8 * k) / (1 + d * d * 0.42) * cool * ao;
    d = l.copy(DOOR).sub(p).length(); k = Math.max(0, nn.dot(l) / Math.max(0.001, d));
    const wa = (0.16 + 0.84 * k) / (1 + d * d * 0.8) * warm * ao;
    d = l.copy(LAMP).sub(p).length(); k = Math.max(0, nn.dot(l) / Math.max(0.001, d));
    const la = (0.1 + 0.9 * k) / (1 + d * d * 1.25) * lamp * ao;
    let br = 0, bg = 0, bb = 0;
    if (glow) for (const b of BULBS) {
      const d2 = l.copy(b.p).sub(p).lengthSq(), w = (0.25 + 0.75 * Math.max(0, nn.dot(l) / Math.sqrt(Math.max(1e-6, d2)))) * (1 / (1 + d2 * 30) + 0.07 / (1 + d2 * 0.9));
      br += b.c.r * w; bg += b.c.g * w; bb += b.c.b * w;
    }
    const top = Math.max(br, bg, bb), gk = glow * ao / (1 + top * 1.25);          // (the white of the window frame, a hand from a bulb: not to glare)
    aC[i * 3] = c.r; aC[i * 3 + 1] = c.g; aC[i * 3 + 2] = c.b;
    aL[i * 4] = co; aL[i * 4 + 1] = wa; aL[i * 4 + 2] = self; aL[i * 4 + 3] = la;
    aB[i * 3] = br * gk; aB[i * 3 + 1] = bg * gk; aB[i * 3 + 2] = bb * gk;
    for (let j = 0; j < 3; j++) aS[i * 3 + j] = (showAt(p, nn, SHOW[j], l) + 0.05 * co) * gk;
  }
  g.setAttribute('aC', new THREE.BufferAttribute(aC, 3)); g.setAttribute('aL', new THREE.BufferAttribute(aL, 4));
  g.setAttribute('aB', new THREE.BufferAttribute(aB, 3)); g.setAttribute('aS', new THREE.BufferAttribute(aS, 3));
  g.deleteAttribute('normal'); if (!uv) g.deleteAttribute('uv');
  return g;
}
function merge(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const [name, size] of [['position', 3], ['aC', 3], ['aL', 4], ['aB', 3], ['aS', 3]]) {
    const a = new Float32Array(n * size); let o = 0;
    for (const g of list) { a.set(g.attributes[name].array, o); o += g.attributes[name].array.length; }
    out.setAttribute(name, new THREE.BufferAttribute(a, size));
  }
  for (const g of list) g.dispose();
  return out;
}
// Set one of a piece's lights by hand, whatever the falloff says (the hall beyond the door; the lampshade).
const force = (g, ch, v) => { const a = g.attributes.aL; for (let i = 0; i < a.count; i++) a.setComponent(i, ch, v); return g; };

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const ball = (rx, ry, rz, n = 14) => new THREE.SphereGeometry(1, n, Math.max(6, n - 4)).scale(rx, ry, rz);
const cyl = (r0, r1, h, n = 12) => new THREE.CylinderGeometry(r0, r1, h, n);
// A wall panel facing +z, from (x0,y0) to (x1,y1), cut fine enough for the light to fall off across it.
const panel = (x0, x1, y0, y1, step = 0.22) => new THREE.PlaneGeometry(x1 - x0, y1 - y0, Math.max(1, Math.ceil((x1 - x0) / step)), Math.max(1, Math.ceil((y1 - y0) / step))).translate((x0 + x1) / 2, (y0 + y1) / 2, 0);
// A five-pointed star, flat, facing +z.
const star = r => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + Math.PI / 2, q = i % 2 ? r * 0.45 : r; i ? s.lineTo(Math.cos(a) * q, Math.sin(a) * q) : s.moveTo(Math.cos(a) * q, Math.sin(a) * q); } return new THREE.ShapeGeometry(s); };

// ---- her arms: a mitten on a quilted sleeve, jointed at the elbow ----
export const ARM = { up: 0.27, fore: 0.25 };
const COAT = [0x2f808c, 0x2b7480];
// A mitten: the wrist at the origin, the fingers along +z, the back of the hand up. side: +1 the right hand.
function mittenParts(side) {
  return [
    [cyl(0.041, 0.039, 0.022, 14).rotateX(Math.PI / 2), 0xb9b09a, M(0, 0, -0.006)], [cyl(0.043, 0.041, 0.022, 14).rotateX(Math.PI / 2), 0xa9a08a, M(0, 0, 0.016)],
    [ball(0.044, 0.034, 0.05), 0xc5302c, M(0, 0, 0.066)], [ball(0.047, 0.03, 0.05), 0xc5302c, M(0, -0.002, 0.098)],
    [ball(0.019, 0.02, 0.04, 10), 0xb52a27, M(side * 0.05, -0.004, 0.07, 0, side * 0.62, 0)],
  ];
}
// A length of sleeve along +z from the joint at the origin: quilted, each roll a little fatter in its middle.
function sleeveParts(len, r0, r1, rolls) {
  const out = [];
  for (let i = 0; i < rolls; i++) {
    const h = len / rolls, ra = r0 + (r1 - r0) * i / rolls, rb = r0 + (r1 - r0) * (i + 1) / rolls;
    const g = new THREE.CylinderGeometry(rb, ra, h, 14, 5, true), P = g.attributes.position;
    for (let k = 0; k < P.count; k++) { const u = P.getY(k) / h + 0.5, f = 1 + 0.15 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, u)))), 0.7); P.setXYZ(k, P.getX(k) * f, P.getY(k), P.getZ(k) * f); }
    g.computeVertexNormals(); g.rotateX(Math.PI / 2);
    out.push([g, COAT[i % 2], M(0, 0, h * (i + 0.5))]);
  }
  return out;
}
// The handset: two sticks, an aerial, a lamp. Flat on its back, the aerial pointing along -z.
function remoteParts() {
  return [
    [box(0.17, 0.04, 0.1), 0x2c2f3a, M(0, 0.02, 0)],
    [box(0.05, 0.035, 0.07), 0x23252e, M(-0.075, 0.016, 0.03)], [box(0.05, 0.035, 0.07), 0x23252e, M(0.075, 0.016, 0.03)],
    [cyl(0.008, 0.01, 0.03, 8), 0x9aa0ae, M(-0.045, 0.052, 0)], [ball(0.012, 0.012, 0.012, 8), 0x1a1b20, M(-0.045, 0.07, 0)],
    [cyl(0.008, 0.01, 0.03, 8), 0x9aa0ae, M(0.045, 0.052, 0)], [ball(0.012, 0.012, 0.012, 8), 0x1a1b20, M(0.045, 0.07, 0)],
    [cyl(0.003, 0.004, 0.13, 6).rotateX(Math.PI / 2), 0xb9bfcc, M(0.06, 0.03, -0.115)],
  ];
}
// An emperor penguin, a little over a metre, facing +z. Self-lit colours (the park's lamps are not real lamps).
function penguinGeo() {
  const parts = [
    [ball(0.22, 0.42, 0.2), 0x232a3a, M(0, 0.5, 0)],
    [ball(0.17, 0.36, 0.1), 0xdfe6ee, M(0, 0.47, 0.115)],
    [ball(0.135, 0.135, 0.135), 0x1b2130, M(0, 0.97, 0.02)],
    [ball(0.05, 0.075, 0.07, 8), 0xe2b043, M(-0.105, 0.93, 0.03)], [ball(0.05, 0.075, 0.07, 8), 0xe2b043, M(0.105, 0.93, 0.03)],
    [new THREE.ConeGeometry(0.035, 0.15, 8).rotateX(Math.PI / 2), 0xc9792a, M(0, 0.96, 0.19)],
    [ball(0.075, 0.022, 0.11, 8), 0xd98a2b, M(-0.09, 0.02, 0.07)], [ball(0.075, 0.022, 0.11, 8), 0xd98a2b, M(0.09, 0.02, 0.07)],
    [ball(0.035, 0.27, 0.1, 8), 0x1b2130, M(-0.235, 0.55, 0, 0, 0, -0.14)], [ball(0.035, 0.27, 0.1, 8), 0x1b2130, M(0.235, 0.55, 0, 0, 0, 0.14)],
  ];
  let n = 0; const gs = parts.map(([g, hex, m]) => { const q = g.toNonIndexed().applyMatrix4(m); q.userData.c = new THREE.Color(hex); n += q.attributes.position.count; return q; });
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
  for (const g of gs) {
    pos.set(g.attributes.position.array, o * 3);
    const N = g.attributes.normal, c = g.userData.c;
    for (let i = 0; i < N.count; i++) { const k = 0.62 + 0.38 * Math.max(0, N.getY(i) * 0.6 + N.getZ(i) * 0.5 + 0.3); col[(o + i) * 3] = c.r * k; col[(o + i) * 3 + 1] = c.g * k; col[(o + i) * 3 + 2] = c.b * k; }
    o += N.count; g.dispose();
  }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return out;
}

const glowTex = () => canvasTex(128, 128, (c, w) => {
  const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.12, 'rgba(255,255,255,0.85)'); g.addColorStop(0.3, 'rgba(255,255,255,0.3)'); g.addColorStop(0.62, 'rgba(255,255,255,0.07)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, w);
});
const softTex = () => canvasTex(128, 128, (c, w) => {
  const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.45, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, w);
});
// Frost creeping in from the corners of the panes.
const frostTex = () => canvasTex(512, 512, (c, w, h) => {
  let s = 91; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  c.clearRect(0, 0, w, h);
  const rail = h * (1 - (1.56 - 0.92) / (2.15 - 0.92));          // the meeting rail of the sash, in the picture
  for (let i = 0; i < 5200; i++) {
    const x = rnd() * w, y = rnd() * h;
    const ex = Math.min(x, w - x) / w, ey = Math.min(y, h - y, Math.abs(y - rail) + 6) / h;
    const corner = Math.exp(-(ex + ey) / 0.085) * 2.4 + Math.exp(-Math.min(ex, ey) / 0.03) * 0.6 + (y > h * 0.86 ? 0.25 : 0);
    if (rnd() > corner) continue;
    const r = 2 + rnd() * 9, a = 0.05 + rnd() * 0.2;
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(235,244,255,${a})`); g.addColorStop(1, 'rgba(235,244,255,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    if (rnd() < 0.3) { c.strokeStyle = `rgba(240,248,255,${a * 1.3})`; c.lineWidth = 0.8; const n = 3 + (rnd() * 3 | 0), a0 = rnd() * TAU, len = 5 + rnd() * 13; for (let k = 0; k < n; k++) { const an = a0 + k * TAU / n; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(an) * len, y + Math.sin(an) * len); c.stroke(); } }
  }
});
const breathTex = () => canvasTex(256, 256, (c, w, h) => {
  let s = 17; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  c.clearRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {
    const a = rnd() * TAU, d = rnd() * rnd() * w * 0.2, x = w / 2 + Math.cos(a) * d * 1.25, y = h / 2 + Math.sin(a) * d * 0.9, r = w * (0.16 + rnd() * 0.16);
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0.2)'); g.addColorStop(0.6, 'rgba(255,255,255,0.09)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }
});
const scribbler = c => (col, lw, pts) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
// A drawing taped to the wall: a rocket and the moon, in crayon.
const drawingTex = () => canvasTex(256, 192, (c, w, h) => {
  c.fillStyle = '#e9e4d6'; c.fillRect(0, 0, w, h);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const scribble = scribbler(c);
  for (let i = 0; i < 9; i++) scribble('#27336b', 9, [[0, 14 + i * 20], [w, 8 + i * 21]]);
  c.fillStyle = '#f1e9a8'; c.beginPath(); c.arc(196, 52, 26, 0, TAU); c.fill();
  scribble('#d9d2c0', 10, [[108, 150], [112, 70], [128, 38], [144, 70], [148, 150], [108, 150]]); scribble('#d9d2c0', 22, [[128, 130], [128, 70]]);
  scribble('#c23a2c', 8, [[112, 70], [128, 38], [144, 70]]); scribble('#c23a2c', 8, [[104, 150], [92, 168]]); scribble('#c23a2c', 8, [[152, 150], [164, 168]]);
  scribble('#e08a2a', 7, [[120, 158], [128, 182], [136, 158]]);
  for (const [x, y] of [[30, 30], [66, 62], [40, 120], [220, 130], [84, 24], [230, 100]]) { scribble('#f4f0d0', 3, [[x - 5, y], [x + 5, y]]); scribble('#f4f0d0', 3, [[x, y - 5], [x, y + 5]]); }
});
// Another: the tree in the park, with its star, and the snow coming down.
const treeTex = () => canvasTex(192, 256, (c, w, h) => {
  c.fillStyle = '#ece7da'; c.fillRect(0, 0, w, h);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const scribble = scribbler(c);
  for (let i = 0; i < 6; i++) scribble('#c9d6ea', 10, [[0, 212 + i * 9], [w, 208 + i * 9]]);
  for (let i = 0; i < 9; i++) { const y = 70 + i * 16, hw = 10 + i * 7; scribble('#2f7d4a', 9, [[96 - hw, y + 10], [96, y - 6], [96 + hw, y + 10]]); }
  scribble('#6b4a32', 10, [[96, 214], [96, 232]]);
  scribble('#e6b422', 6, [[96, 30], [102, 48], [120, 48], [106, 58], [112, 76], [96, 64], [80, 76], [86, 58], [72, 48], [90, 48], [96, 30]]);
  for (const [x, y, col] of [[80, 110, '#d23c2e'], [112, 128, '#2f6fd0'], [70, 160, '#e6b422'], [118, 170, '#d23c2e'], [96, 142, '#e85fa8'], [60, 196, '#2f6fd0'], [130, 200, '#e6b422']]) { c.fillStyle = col; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); }
  for (const [x, y] of [[24, 40], [160, 60], [34, 120], [166, 130], [20, 180], [150, 22], [60, 20]]) { c.fillStyle = '#9fb2d2'; c.beginPath(); c.arc(x, y, 3.5, 0, TAU); c.fill(); }
});
// The poster over her bed: the planets, in a row from the sun.
const planetsTex = () => canvasTex(256, 352, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#141a3c'); g.addColorStop(1, '#27214f'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.6})`; c.beginPath(); c.arc(rnd() * w, rnd() * h, 0.6 + rnd() * 1.4, 0, TAU); c.fill(); }
  c.fillStyle = '#f6c544'; c.beginPath(); c.arc(-30, h * 0.5, 96, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 1.2;
  const P = [[92, 7, '#b9a48c'], [116, 10, '#e2b872'], [144, 11, '#4f8fe0'], [170, 9, '#d0603a'], [208, 26, '#d9a86a'], [258, 21, '#e6d08a'], [300, 14, '#8fd0d8'], [334, 13, '#4a6fd8']];
  P.forEach(([d, r, col], i) => {
    c.beginPath(); c.arc(-30, h * 0.5, d + 30, -1.1, 1.1); c.stroke();
    const a = (i % 2 ? 1 : -1) * (0.16 + 0.07 * i), x = -30 + Math.cos(a) * (d + 30), y = h * 0.5 + Math.sin(a) * (d + 30);
    c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    if (i === 5) { c.strokeStyle = '#f0e2b0'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, r * 1.8, r * 0.5, -0.4, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 1.2; }
  });
  c.strokeStyle = '#e9e4d6'; c.lineWidth = 8; c.strokeRect(0, 0, w, h);
});

export function buildSet(G, { eye, aim }) {
  const scene = G.scene, W = ROOM.win, tex = [], mats = [], geos = [];
  const keepT = t => (tex.push(t), t), keepM = m => (mats.push(m), m), keepG = g => (geos.push(g), g);

  // ---- the room ----
  const room = new THREE.Group(); room.name = 'opening-room';
  const yaw = Math.atan2(-(aim.x - eye.x), -(aim.z - eye.z));        // the room's -z looks at the aim
  room.rotation.y = yaw;
  room.position.set(eye.x, eye.y, eye.z).sub(ROOM.eye.clone().applyAxisAngle(V(0, 1, 0), yaw));
  room.updateMatrixWorld(true);
  const L = (x, y, z, out = V(0, 0, 0)) => out.set(x, y, z).applyMatrix4(room.matrixWorld);

  const C = (r, g, b) => ({ value: new THREE.Color(r, g, b) });
  const U = { uAmb: C(0.02, 0.024, 0.036), uCool: C(0.36, 0.5, 0.95), uWarm: C(1.5, 0.95, 0.5), uLamp: C(1.7, 1.2, 0.72), uShowA: C(0, 0, 0), uShowB: C(0, 0, 0), uShowC: C(0, 0, 0), uBulb: { value: 1 }, uGain: { value: 1 } };
  const VERT = `attribute vec3 aC; attribute vec4 aL; attribute vec3 aB; attribute vec3 aS;
      uniform vec3 uAmb, uCool, uWarm, uLamp, uShowA, uShowB, uShowC; uniform float uBulb, uGain; varying vec3 vC;
      #ifdef PICTURE
      varying vec2 vUv;
      #endif
      void main() {
        vC = aC * (uAmb + uCool * aL.x + uWarm * aL.y + vec3(aL.z) + uLamp * aL.w + aB * uBulb + uShowA * aS.x + uShowB * aS.y + uShowC * aS.z) * uGain;
        #ifdef PICTURE
        vUv = uv;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const FRAG = `varying vec3 vC;
      #ifdef PICTURE
      uniform sampler2D map; varying vec2 vUv;
      #endif
      void main() { gl_FragColor = vec4(vC, 1.0);
      #ifdef PICTURE
      gl_FragColor.rgb *= texture2D(map, vUv).rgb;
      #endif
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  const paint = keepM(new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG }));
  const paint2 = keepM(new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide }));      // the door, the lampshade: seen from both sides
  // A picture on the wall, lit as the wall is.
  const picture = (t, w, h, m) => {
    const mat = keepM(new THREE.ShaderMaterial({ uniforms: { ...U, map: { value: keepT(t) } }, defines: { PICTURE: 1 }, vertexShader: VERT, fragmentShader: FRAG }));
    const mesh = new THREE.Mesh(keepG(lit(new THREE.PlaneGeometry(w, h, 2, 2), 0xffffff, { m, uv: true })), mat); mesh.frustumCulled = false; room.add(mesh); return mesh;
  };

  const S = [], S2 = [];                                             // everything that never moves, to be one mesh (S2: seen from both sides)
  const put = (geo, hex, m, o = {}) => S.push(lit(geo, hex, { m, ...o }));
  const { x0, x1, z1, h } = ROOM, WALL = 0x8791b4, DADO = 0x6c779f, TRIM = 0xdcd8cc, WOOD = 0x8d6c4a, DARKWOOD = 0x6b4a32;
  const RAIL = 0.9, wall = (a, b, m, y1 = h) => { put(panel(a, b, 0, Math.min(RAIL, y1)), DADO, m, { shell: true }); if (y1 > RAIL) put(panel(a, b, RAIL, y1), WALL, m, { shell: true }); };
  const LEFT = M(x0, 0, 0, 0, Math.PI / 2, 0), RIGHT = M(x1, 0, 0, 0, -Math.PI / 2, 0);
  // the window wall, round the opening
  wall(x0, W.x0, M(0, 0, 0)); wall(W.x1, x1, M(0, 0, 0));
  wall(W.x0, W.x1, M(0, 0, 0), W.y0); put(panel(W.x0, W.x1, W.y1, h), WALL, M(0, 0, 0), { shell: true });
  // the left wall (the door in it), the right, the back
  const { z0: DZ0, z1: DZ1, h: DH } = DOORWAY;
  wall(-DZ0, 0, LEFT); wall(-z1, -DZ1, LEFT); put(panel(-DZ1, -DZ0, DH, h), WALL, LEFT, { shell: true });
  wall(0, z1, RIGHT);
  wall(-x1, -x0, M(0, 0, z1, 0, Math.PI, 0));
  // the rail between the two colours of the wall, and the skirting
  put(box(W.x0 - 0.08 - x0, 0.045, 0.018), TRIM, M((x0 + W.x0 - 0.08) / 2, RAIL, 0.009)); put(box(x1 - W.x1 - 0.08, 0.045, 0.018), TRIM, M((x1 + W.x1 + 0.08) / 2, RAIL, 0.009));
  put(box(0.018, 0.045, DZ0 - 0.07), TRIM, M(x0 + 0.009, RAIL, (DZ0 - 0.07) / 2)); put(box(0.018, 0.045, z1 - DZ1 - 0.07), TRIM, M(x0 + 0.009, RAIL, (z1 + DZ1 + 0.07) / 2));
  put(box(0.018, 0.045, z1), TRIM, M(x1 - 0.009, RAIL, z1 / 2));
  put(box(x1 - x0, 0.1, 0.016), TRIM, M((x0 + x1) / 2, 0.05, 0.008));
  put(box(0.016, 0.1, DZ0 - 0.07), TRIM, M(x0 + 0.008, 0.05, (DZ0 - 0.07) / 2)); put(box(0.016, 0.1, z1 - DZ1 - 0.07), TRIM, M(x0 + 0.008, 0.05, (z1 + DZ1 + 0.07) / 2));
  put(box(0.016, 0.1, z1), TRIM, M(x1 - 0.008, 0.05, z1 / 2));
  // floorboards, running to the window, no two quite the same brown
  { let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, bw = 0.13;
    for (let x = x0; x < x1 - 0.001; x += bw) {
      const k = 0.86 + rnd() * 0.26, col = new THREE.Color(0x6a5038).multiplyScalar(k).getHex(), xb = Math.min(x1, x + bw);
      put(panel(x + 0.004, xb, -z1, 0, 0.19), col, M(0, 0, 0, -Math.PI / 2, 0, 0), { shell: true });
      put(panel(x, x + 0.004, -z1, 0, 0.19), 0x2a1f16, M(0, -0.001, 0, -Math.PI / 2, 0, 0), { shell: true });
    } }
  put(panel(x0, x1, 0, z1, 0.19), 0xa9adb8, M(0, h, 0, Math.PI / 2, 0, 0));                  // ceiling
  put(cyl(0.17, 0.15, 0.05, 20), 0xd9d6cc, M(0.05, h - 0.025, 1.9));                         // the big light, off
  put(new THREE.CircleGeometry(1, 40).scale(1.25, 0.82, 1), 0x7c4a52, M(0.1, 0.006, 1.5, -Math.PI / 2, 0, 0), { shell: true });
  put(new THREE.RingGeometry(0.78, 0.9, 40).scale(1.25, 0.82, 1), 0xc9b48a, M(0.1, 0.008, 1.5, -Math.PI / 2, 0, 0), { shell: true });
  put(new THREE.RingGeometry(0.42, 0.47, 40).scale(1.25, 0.82, 1), 0xc9b48a, M(0.1, 0.008, 1.5, -Math.PI / 2, 0, 0), { shell: true });
  // the window: casing, the meeting rail of the sash, the board she leans on
  const wc = (W.x0 + W.x1) / 2, ww = W.x1 - W.x0, wh = W.y1 - W.y0;
  put(box(0.08, wh + 0.16, 0.07), TRIM, M(W.x0 - 0.04, W.y0 + wh / 2, 0.035)); put(box(0.08, wh + 0.16, 0.07), TRIM, M(W.x1 + 0.04, W.y0 + wh / 2, 0.035));
  put(box(ww + 0.16, 0.09, 0.07), TRIM, M(wc, W.y1 + 0.045, 0.035));
  put(box(ww, 0.05, 0.035), TRIM, M(wc, 1.56, 0.02)); put(box(ww, 0.045, 0.035), TRIM, M(wc, W.y0 + 0.022, 0.02));
  put(box(ww + 0.36, 0.035, 0.27), TRIM, M(wc, W.y0 - 0.018, 0.135)); put(box(ww + 0.2, 0.09, 0.025), TRIM, M(wc, W.y0 - 0.08, 0.013));
  // the radiator under it
  for (let i = 0; i < 13; i++) { put(box(0.052, 0.56, 0.13), 0xcdd1d6, M(-0.48 + i * 0.08, 0.42, 0.125)); put(ball(0.026, 0.03, 0.065, 8), 0xcdd1d6, M(-0.48 + i * 0.08, 0.7, 0.125)); }
  put(box(1.0, 0.035, 0.05), 0xb9bdc4, M(0, 0.2, 0.125)); put(box(1.0, 0.035, 0.05), 0xb9bdc4, M(0, 0.62, 0.125));
  put(box(0.03, 0.14, 0.1), 0xb9bdc4, M(-0.44, 0.07, 0.125)); put(box(0.03, 0.14, 0.1), 0xb9bdc4, M(0.44, 0.07, 0.125));
  put(cyl(0.016, 0.016, 0.2, 8).rotateZ(Math.PI / 2), 0x9a9ea6, M(0.6, 0.2, 0.125)); put(cyl(0.028, 0.028, 0.04, 10), 0x7c3a32, M(0.69, 0.2, 0.125)); put(cyl(0.014, 0.014, 0.2, 8), 0x9a9ea6, M(0.69, 0.1, 0.125));
  // curtains, pleated, and their rod
  for (const sx of [-1, 1]) {
    const g = new THREE.PlaneGeometry(0.5, 1.95, 22, 8), P = g.attributes.position;
    for (let i = 0; i < P.count; i++) P.setZ(i, Math.sin(P.getX(i) * 62) * 0.022 + Math.sin(P.getX(i) * 23 + 1) * 0.012);
    g.computeVertexNormals();
    S.push(lit(g, 0xb9544a, { m: M(sx * (W.x1 + 0.34), 1.37, 0.085), warm: 1.5 }));
    for (let k = 0; k < 9; k++) put(cyl(0.02, 0.02, 0.006, 8).rotateX(Math.PI / 2), 0x2b2b30, M(sx * (W.x1 + 0.34) - 0.22 + k * 0.055, 2.365, 0.085));
  }
  put(cyl(0.012, 0.012, ww + 1.4, 8).rotateZ(Math.PI / 2), 0x2b2b30, M(wc, 2.36, 0.085));
  put(ball(0.026, 0.026, 0.026, 8), 0x2b2b30, M(wc - ww / 2 - 0.7, 2.36, 0.085)); put(ball(0.026, 0.026, 0.026, 8), 0x2b2b30, M(wc + ww / 2 + 0.7, 2.36, 0.085));
  // things on the sill: a rocket, two books, a snow globe
  put(cyl(0.03, 0.034, 0.12, 10), 0xdedede, M(-0.4, W.y0 + 0.06, 0.14)); put(new THREE.ConeGeometry(0.031, 0.07, 10), 0xc5302c, M(-0.4, W.y0 + 0.155, 0.14));
  put(box(0.012, 0.05, 0.06), 0xc5302c, M(-0.435, W.y0 + 0.025, 0.14)); put(box(0.012, 0.05, 0.06), 0xc5302c, M(-0.365, W.y0 + 0.025, 0.14));
  put(box(0.17, 0.026, 0.12), 0x3f6ea8, M(0.38, W.y0 + 0.013, 0.14, 0, 0.2, 0)); put(box(0.15, 0.022, 0.11), 0xd8a03a, M(0.385, W.y0 + 0.037, 0.14, 0, -0.1, 0));
  put(cyl(0.04, 0.046, 0.025, 14), 0x5a3a2a, M(0.52, W.y0 + 0.012, 0.11)); put(ball(0.042, 0.042, 0.042), 0xa9c4e6, M(0.52, W.y0 + 0.06, 0.11), { self: 0.02 });
  // the low bookcase by the window, where the car is kept, and the lamp on it
  const SH = SHELF, sx = (SH.x0 + SH.x1) / 2, sz = (SH.z0 + SH.z1) / 2, sw = SH.x1 - SH.x0, sd = SH.z1 - SH.z0;
  put(box(sw + 0.02, 0.03, sd + 0.02), WOOD, M(sx - 0.01, SH.y - 0.015, sz));
  put(box(sw, SH.y, 0.03), WOOD, M(sx, SH.y / 2, SH.z0 + 0.015)); put(box(sw, SH.y, 0.03), WOOD, M(sx, SH.y / 2, SH.z1 - 0.015));
  put(box(sw, 0.03, sd), WOOD, M(sx, 0.36, sz)); put(box(sw, 0.05, sd), WOOD, M(sx, 0.025, sz));
  put(box(0.02, SH.y, sd), 0x3a2c22, M(SH.x1 - 0.2, SH.y / 2, sz));
  { let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, cols = [0xb8473c, 0x3f6ea8, 0xd8a03a, 0x4d8a5c, 0x8a5aa8, 0xd9d2c0, 0xc76a3a, 0x33607a];
    for (const y0 of [0.05, 0.375]) for (let z = SH.z0 + 0.05; z < SH.z1 - 0.09;) { const t = 0.028 + rnd() * 0.04, hh = 0.2 + rnd() * 0.09; put(box(0.16, hh, t), cols[rnd() * cols.length | 0], M(SH.x0 + 0.1, y0 + hh / 2, z + t / 2)); z += t + 0.004; if (rnd() < 0.12) z += 0.08; } }
  put(cyl(0.055, 0.065, 0.02, 16), 0x39405a, M(LAMP.x, SH.y + 0.01, LAMP.z)); put(cyl(0.009, 0.009, 0.2, 8), 0x39405a, M(LAMP.x, SH.y + 0.12, LAMP.z));
  S2.push(force(lit(new THREE.CylinderGeometry(0.07, 0.115, 0.17, 20, 1, true), 0xf3dcae, { m: M(LAMP.x, LAMP.y, LAMP.z), glow: 0.4 }), 3, 1.15));
  // her bed, along the wall: the pillow at the window end, a quilt of squares, and a bear with its back to the room, watching the lights
  { const B = BED, bx = (B.x0 + B.x1) / 2, bw = B.x1 - B.x0, bl = B.z1 - B.z0;
    put(box(bw, 0.2, bl), DARKWOOD, M(bx, 0.21, (B.z0 + B.z1) / 2));
    for (const [lx, lz] of [[B.x0 + 0.04, B.z0 + 0.04], [B.x1 - 0.04, B.z0 + 0.04], [B.x0 + 0.04, B.z1 - 0.04], [B.x1 - 0.04, B.z1 - 0.04]]) put(box(0.06, 0.12, 0.06), DARKWOOD, M(lx, 0.06, lz));
    put(box(bw, 0.78, 0.04), DARKWOOD, M(bx, 0.5, B.z0 + 0.02)); put(box(bw + 0.03, 0.04, 0.06), WOOD, M(bx, 0.9, B.z0 + 0.02));
    put(box(bw, 0.42, 0.04), DARKWOOD, M(bx, 0.33, B.z1 - 0.02)); put(box(bw + 0.03, 0.04, 0.06), WOOD, M(bx, 0.55, B.z1 - 0.02));
    put(box(bw - 0.04, 0.15, bl - 0.09), 0xe8e4d8, M(bx, 0.385, (B.z0 + B.z1) / 2));
    put(ball(0.27, 0.065, 0.16), 0xf4f1e8, M(bx, 0.5, B.z0 + 0.27));
    put(box(bw - 0.02, 0.05, 0.13), 0xf4f1e8, M(bx, 0.475, B.z0 + 0.55));
    let s = 29; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, cols = [0xb8473c, 0x3f6ea8, 0xd8a03a, 0x4d8a5c, 0xe0d8c4, 0x8a5aa8], q0 = B.z0 + 0.61, nz = 5, nx = 4, qd = (B.z1 - 0.05 - q0) / nz, qw = (bw + 0.02) / nx;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) put(ball(qw * 0.56, 0.024 + rnd() * 0.008, qd * 0.56, 8), cols[(i * 2 + j * 3 + (rnd() < 0.3 ? 1 : 0)) % cols.length], M(B.x0 - 0.01 + qw * (i + 0.5), 0.47, q0 + qd * (j + 0.5)));
    put(box(bw + 0.02, 0.03, nz * qd), 0x35557e, M(bx, 0.458, q0 + nz * qd / 2));
    for (let j = 0; j < nz; j++) put(box(0.022, 0.2 + (j % 2) * 0.03, qd - 0.008), cols[(j * 3 + 1) % cols.length], M(B.x1 + 0.012, 0.365 - (j % 2) * 0.015, q0 + qd * (j + 0.5)));
    const tx = bx - 0.08, ty = 0.5, tz = B.z0 + 0.62, FUR = 0xb08a5a;
    put(ball(0.09, 0.1, 0.08), FUR, M(tx, ty + 0.09, tz)); put(ball(0.074, 0.07, 0.07), FUR, M(tx, ty + 0.235, tz));
    put(ball(0.028, 0.028, 0.016, 8), FUR, M(tx - 0.056, ty + 0.295, tz)); put(ball(0.028, 0.028, 0.016, 8), FUR, M(tx + 0.056, ty + 0.295, tz));
    put(ball(0.03, 0.058, 0.03, 8), FUR, M(tx - 0.098, ty + 0.11, tz - 0.015, 0, 0, -0.3)); put(ball(0.03, 0.058, 0.03, 8), FUR, M(tx + 0.098, ty + 0.11, tz - 0.015, 0, 0, 0.3));
    put(ball(0.036, 0.03, 0.06, 8), FUR, M(tx - 0.055, ty + 0.03, tz - 0.08)); put(ball(0.036, 0.03, 0.06, 8), FUR, M(tx + 0.055, ty + 0.03, tz - 0.08));
    put(cyl(0.062, 0.066, 0.028, 12), 0xc5302c, M(tx, ty + 0.172, tz)); put(box(0.03, 0.09, 0.014), 0xc5302c, M(tx + 0.03, ty + 0.12, tz + 0.07, 0.2, 0, -0.15));
    // her slippers, where she stepped out of them
    put(ball(0.045, 0.03, 0.09, 10), 0x8a5aa8, M(B.x1 + 0.2, 0.03, 1.12, 0, 0.3, 0)); put(ball(0.045, 0.03, 0.09, 10), 0x8a5aa8, M(B.x1 + 0.33, 0.03, 1.2, 0, -0.15, 0));
  }
  // on the floor: blocks, a ball, a book left open
  put(box(0.075, 0.075, 0.075), 0xd8a03a, M(0.86, 0.0375, 2.3, 0, 0.3, 0)); put(box(0.075, 0.075, 0.075), 0x3f6ea8, M(0.95, 0.0375, 2.24, 0, -0.2, 0)); put(box(0.075, 0.075, 0.075), 0xb8473c, M(0.905, 0.1125, 2.27, 0, 0.6, 0)); put(box(0.075, 0.075, 0.075), 0x4d8a5c, M(1.1, 0.0375, 2.42, 0, 0.9, 0));
  put(ball(0.095, 0.095, 0.095, 16), 0xd8603a, M(1.3, 0.095, 2.1));
  put(box(0.15, 0.012, 0.2), 0xe9e4d6, M(0.79, 0.02, 0.98, 0, 0.5, 0.08)); put(box(0.15, 0.012, 0.2), 0xe9e4d6, M(0.65, 0.02, 0.9, 0, 0.5, -0.08)); put(box(0.31, 0.008, 0.21), 0x4d8a5c, M(0.72, 0.008, 0.94, 0, 0.5, 0));
  // bunting along the right wall, and stars that glow on the ceiling and over the bed
  { const cols = [0xc5302c, 0xd8a03a, 0x4d8a5c, 0x3f6ea8, 0xe0d8c4], n = 15, za = 0.2, zb = 3.5;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, z = za + (zb - za) * u, y = 2.3 - Math.sin(u * Math.PI) * 0.16, g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, -0.085, 0, 0, 0.085, 0, -0.19, 0]), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([-1, 0, 0, -1, 0, 0, -1, 0, 0]), 3));
      put(g, cols[i % cols.length], M(x1 - 0.012, y, z, Math.cos(u * Math.PI) * 0.16, 0, 0));
    }
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n; put(box(0.006, 0.008, (zb - za) / n + 0.01), 0xe9e4d6, M(x1 - 0.008, 2.3 - Math.sin(u * Math.PI) * 0.16, za + (zb - za) * u, Math.cos(u * Math.PI) * 0.16, 0, 0)); }
    let s = 41; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, GLOW = { self: 0.2, glow: 0.5 };
    for (let i = 0; i < 16; i++) put(star(0.03 + rnd() * 0.03), 0xd8ffb4, M(-1.75 + rnd() * 2.6, h - 0.004, 0.25 + rnd() * 2.3, Math.PI / 2, 0, rnd() * TAU), GLOW);
    for (let i = 0; i < 7; i++) put(star(0.028 + rnd() * 0.022), 0xd8ffb4, M(x0 + 0.004, 1.95 + rnd() * 0.45, 0.2 + rnd() * 1.5, rnd() * TAU, Math.PI / 2, 0, 1, 1, 1), GLOW);
  }
  // against the back wall: a chest of drawers, a globe on it; pegs, with a scarf, a hat and her school bag
  { const dx = 1.425, dz = 3.58, top = 0.86;
    put(box(0.95, top, 0.44), WOOD, M(dx, top / 2, dz)); put(box(0.99, 0.03, 0.47), DARKWOOD, M(dx, top + 0.015, dz - 0.005));
    for (const y of [0.17, 0.44, 0.71]) { put(box(0.87, 0.22, 0.02), 0x9a7752, M(dx, y, dz - 0.225)); for (const k of [-0.24, 0.24]) put(ball(0.02, 0.02, 0.02, 8), 0xb08d3c, M(dx + k, y, dz - 0.245)); }
    put(cyl(0.06, 0.075, 0.025, 14), 0x39405a, M(1.2, top + 0.042, 3.6)); put(cyl(0.008, 0.008, 0.07, 6), 0x39405a, M(1.2, top + 0.08, 3.6));
    put(ball(0.115, 0.115, 0.115, 18), 0x3f78b8, M(1.2, top + 0.215, 3.6)); put(ball(0.07, 0.05, 0.03, 8), 0x5a9a5c, M(1.17, top + 0.25, 3.5)); put(ball(0.04, 0.07, 0.03, 8), 0x5a9a5c, M(1.26, top + 0.17, 3.505)); put(ball(0.03, 0.03, 0.07, 8), 0x5a9a5c, M(1.095, top + 0.2, 3.57));
    put(box(0.2, 0.03, 0.15), 0xb8473c, M(1.62, top + 0.045, 3.58, 0, 0.2, 0)); put(box(0.18, 0.028, 0.14), 0xd8a03a, M(1.63, top + 0.074, 3.58, 0, -0.15, 0)); put(box(0.17, 0.024, 0.13), 0x3f6ea8, M(1.62, top + 0.1, 3.58, 0, 0.35, 0));
    const pz = z1 - 0.012;
    put(box(0.86, 0.075, 0.022), WOOD, M(-0.95, 1.5, pz)); for (let i = 0; i < 4; i++) put(cyl(0.012, 0.014, 0.08, 8).rotateX(Math.PI / 2), DARKWOOD, M(-1.28 + i * 0.22, 1.5, pz - 0.045));
    put(box(0.085, 0.62, 0.03), 0xc5302c, M(-1.3, 1.19, pz - 0.05, 0, 0, 0.03)); put(box(0.085, 0.5, 0.03), 0xc5302c, M(-1.24, 1.25, pz - 0.075, 0, 0, -0.04));
    for (const y of [0.92, 1.0]) put(box(0.089, 0.03, 0.034), 0xe9e0cc, M(-1.3, y, pz - 0.05, 0, 0, 0.03));
    put(ball(0.1, 0.085, 0.07, 12), 0xd8a03a, M(-1.06, 1.46, pz - 0.075)); put(ball(0.035, 0.035, 0.035, 8), 0xe9e0cc, M(-1.06, 1.56, pz - 0.085)); put(box(0.2, 0.03, 0.15), 0xe9e0cc, M(-1.06, 1.41, pz - 0.075));
    put(ball(0.15, 0.19, 0.085, 12), 0x4d8a5c, M(-0.62, 1.25, pz - 0.1)); put(box(0.16, 0.09, 0.03), 0x3d7049, M(-0.62, 1.2, pz - 0.185)); put(box(0.025, 0.22, 0.02), 0x3d7049, M(-0.67, 1.42, pz - 0.06, 0, 0, -0.15)); put(box(0.025, 0.22, 0.02), 0x3d7049, M(-0.57, 1.42, pz - 0.06, 0, 0, 0.15));
  }
  // the switch by the door
  put(box(0.012, 0.115, 0.075), TRIM, M(x0 + 0.006, 1.15, DZ0 - 0.2)); put(box(0.012, 0.03, 0.014), 0xa9a69c, M(x0 + 0.016, 1.16, DZ0 - 0.2));
  // the door, ajar, and the lit hall beyond it (the television is somewhere along there)
  put(box(0.09, DH + 0.06, 0.07), TRIM, M(x0 + 0.02, (DH + 0.06) / 2, DZ0 - 0.035)); put(box(0.09, DH + 0.06, 0.07), TRIM, M(x0 + 0.02, (DH + 0.06) / 2, DZ1 + 0.035)); put(box(0.09, 0.08, DZ1 - DZ0 + 0.14), TRIM, M(x0 + 0.02, DH + 0.04, (DZ0 + DZ1) / 2));
  const hall = (g, hex, m, v) => S.push(force(force(lit(g, hex, { m, cool: 0, warm: 0, lamp: 0, glow: 0 }), 1, v), 0, 0.03));
  hall(panel(-2.2, 2.2, 0, 2.6), 0xf2d9a8, M(x0 - 1.15, 0, (DZ0 + DZ1) / 2, 0, Math.PI / 2, 0), 1.25);
  hall(panel(-1.2, 0.05, -2.2, 2.2), 0x8a6a4a, M(x0, 0.001, (DZ0 + DZ1) / 2, -Math.PI / 2, 0, 0), 0.7);
  hall(panel(-1.2, 0.05, -2.2, 2.2), 0xcfc8b8, M(x0, 2.6, (DZ0 + DZ1) / 2, Math.PI / 2, 0, 0), 0.9);
  hall(box(0.02, 0.5, 0.38), 0x2f3a52, M(x0 - 1.13, 1.5, DZ0 + 0.3), 0.9); hall(box(0.03, 0.56, 0.44), 0xcaa14a, M(x0 - 1.14, 1.5, DZ0 + 0.3), 1.0);
  hall(box(0.016, 0.1, 4.4), 0xdcd8cc, M(x0 - 1.14, 0.05, (DZ0 + DZ1) / 2), 1.0);
  const fixed = new THREE.Mesh(keepG(merge(S)), paint); fixed.frustumCulled = false; room.add(fixed);
  const fixed2 = new THREE.Mesh(keepG(merge(S2)), paint2); fixed2.frustumCulled = false; room.add(fixed2);
  // (the door is lit as it hangs ajar; its handle on both faces)
  const dw = DZ1 - DZ0 - 0.01, hang = M(x0, 0, DZ1, 0, DOORWAY.ajar, 0), dp = (g, hex, m) => lit(g.applyMatrix4(m), hex, { m: hang, bake: false });
  const door = new THREE.Mesh(keepG(merge([
    dp(box(0.04, DH, dw), 0xd8d2c2, M(0.02, DH / 2, -dw / 2)),
    dp(box(0.012, 0.62, dw - 0.26), 0xcfc9b8, M(0.046, 1.5, -dw / 2)), dp(box(0.012, 0.72, dw - 0.26), 0xcfc9b8, M(0.046, 0.55, -dw / 2)),
    dp(cyl(0.012, 0.012, 0.11, 8).rotateZ(Math.PI / 2), 0xb08d3c, M(0.02, 1.0, -dw + 0.07)),
    dp(ball(0.03, 0.03, 0.03, 10), 0xb08d3c, M(0.085, 1.0, -dw + 0.07)), dp(ball(0.03, 0.03, 0.03, 10), 0xb08d3c, M(-0.045, 1.0, -dw + 0.07)),
  ])), paint2);
  door.position.set(x0, 0, DZ1); door.rotation.y = DOORWAY.ajar; room.add(door);

  // her drawings, taped up; the planets over her bed
  picture(drawingTex(), 0.46, 0.345, M(x1 - 0.004, 1.5, 1.05, 0, -Math.PI / 2, 0.04));
  picture(treeTex(), 0.3, 0.4, M(1.58, 1.52, 0.004, 0, 0, -0.05));
  picture(planetsTex(), 0.58, 0.8, M(x0 + 0.004, 1.42, 0.98, 0, Math.PI / 2, 0));

  // the string of bulbs round the window, and its flex
  const bulbGeo = keepG(new THREE.BufferGeometry()), bp = new Float32Array(BULBS.length * 3), bc = new Float32Array(BULBS.length * 3);
  BULBS.forEach((b, i) => { bp.set([b.p.x, b.p.y, b.p.z], i * 3); bc.set([b.c.r, b.c.g, b.c.b], i * 3); });
  bulbGeo.setAttribute('position', new THREE.BufferAttribute(bp, 3)); bulbGeo.setAttribute('color', new THREE.BufferAttribute(bc, 3));
  const glow = keepT(glowTex()), soft = keepT(softTex());
  const bulbs = new THREE.Points(bulbGeo, keepM(new THREE.PointsMaterial({ map: glow, size: 0.085, sizeAttenuation: true, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })));
  bulbs.frustumCulled = false; bulbs.renderOrder = 5; room.add(bulbs);
  const flex = new THREE.Line(keepG(new THREE.BufferGeometry().setFromPoints(BULBS.map(b => V(b.p.x, b.p.y + 0.012, b.p.z - 0.008)))), keepM(new THREE.LineBasicMaterial({ color: 0x0c1f12, fog: false })));
  flex.frustumCulled = false; room.add(flex);
  const twinkle = t => { const a = bulbGeo.attributes.color; BULBS.forEach((b, i) => { const k = 1.15 + 0.35 * Math.sin(t * (1.1 + (i % 7) * 0.23) + i * 2.4); a.setXYZ(i, b.c.r * k, b.c.g * k, b.c.b * k); }); a.needsUpdate = true; };

  // the glass: frost in the corners, and the patch her breath makes
  const frost = new THREE.Mesh(keepG(new THREE.PlaneGeometry(ww, wh)), keepM(new THREE.MeshBasicMaterial({ map: keepT(frostTex()), color: 0x7f97c8, transparent: true, depthWrite: false, fog: false, opacity: 0.85 })));
  frost.position.set(wc, W.y0 + wh / 2, 0.006); frost.renderOrder = 6; room.add(frost);
  const breath = new THREE.Mesh(keepG(new THREE.PlaneGeometry(0.62, 0.46)), keepM(new THREE.MeshBasicMaterial({ map: keepT(breathTex()), color: 0x9fb4d8, transparent: true, depthWrite: false, fog: false, opacity: 0 })));
  breath.position.set(0, 1.2, 0.009); breath.renderOrder = 7; breath.visible = false; room.add(breath);

  // the handset on the shelf
  // (what she holds has its own brightness, set.held: her arms are not always where the light was painted on them)
  const held = { value: 1 }, paintHeld = keepM(new THREE.ShaderMaterial({ uniforms: { ...U, uGain: held }, vertexShader: VERT, fragmentShader: FRAG }));
  const part = (list, rest, o = {}, mat = paintHeld) => { const m = new THREE.Mesh(keepG(merge(list.map(([g, hex, mm]) => lit(g.applyMatrix4(mm), hex, { m: rest, bake: false, ...o })))), mat); m.frustumCulled = false; return m; };
  const carSpot = V(1.72, SH.y, 1.02), remoteSpot = V(1.68, SH.y, 1.5);
  const remote = part(remoteParts(), M(remoteSpot.x, remoteSpot.y, remoteSpot.z, 0, -1.2, 0), { cool: 1.6 }, paint); remote.position.copy(remoteSpot); remote.rotation.y = -1.2; room.add(remote);

  // her arms and the handset in her hands: a rig that opening.js holds in front of the camera, in the camera's own
  // metres (x right, y up, -z ahead). Lit as things are a step back from the window.
  const rig = new THREE.Group(); rig.name = 'opening-rig'; rig.visible = false; scene.add(rig);
  const rest = M(0, 0.95, 0.85, -0.436, Math.PI, 0), HELD = { cool: 1.9, lamp: 0.5 };      // (lit from above and a little ahead)
  const arms = [-1, 1].map(side => {
    const a = { side, up: part(sleeveParts(ARM.up, 0.058, 0.053, 4), rest, HELD), fore: part(sleeveParts(ARM.fore, 0.052, 0.042, 4), rest, HELD), elbow: part([[ball(0.057, 0.057, 0.057, 12), COAT[1], M(0, 0, 0)]], rest, HELD), hand: part(mittenParts(side), rest, HELD) };
    for (const m of [a.up, a.fore, a.elbow, a.hand]) { m.visible = false; rig.add(m); }
    return a;
  });
  const handset = part(remoteParts(), rest, { cool: 2.2, lamp: 0.5 }); handset.visible = false; rig.add(handset);
  const led = new THREE.Mesh(keepG(new THREE.SphereGeometry(0.006, 8, 6)), keepM(new THREE.MeshBasicMaterial({ color: 0x551111, fog: false })));
  led.position.set(0, 0.044, -0.03); handset.add(led);
  // One arm, from the shoulder S to the wrist Wr (the camera's metres), the elbow bending towards `pole`; the mitten's
  // fingers along `fwd` (as the forearm runs, if not given) with the back of the hand towards `up`.
  const _d = V(0, 0, 0), _e = V(0, 0, 0), _p = V(0, 0, 0), _x = V(0, 0, 0), _y = V(0, 0, 0), _f = V(0, 0, 0), _sx = V(0, 0, 0), _sy = V(0, 0, 0), _mm = new THREE.Matrix4();
  // (a sleeve keeps its top uppermost, where its light was painted)
  const seg = (mesh, A, B, len) => {
    mesh.position.copy(A); _x.subVectors(B, A); const l = _x.length() || 1e-4; _x.divideScalar(l);
    _sx.crossVectors(_sy.set(0, 1, 0), _x); if (_sx.lengthSq() < 1e-6) _sx.set(1, 0, 0); _sx.normalize(); _sy.crossVectors(_x, _sx);
    mesh.quaternion.setFromRotationMatrix(_mm.makeBasis(_sx, _sy, _x)); mesh.scale.set(1, 1, l / len);
  };
  const poseArm = (a, S, Wr, pole, fwd = null, up = null) => {
    _d.subVectors(Wr, S); let len = _d.length() || 1e-4; _d.divideScalar(len);
    const A = ARM.up, B = ARM.fore; let x, hh;
    if (len >= (A + B) * 0.995) { x = len * A / (A + B); hh = 0; } else { len = Math.max(len, Math.abs(A - B) + 0.02); x = (A * A - B * B + len * len) / (2 * len); hh = Math.sqrt(Math.max(0, A * A - x * x)); }
    _p.copy(pole).addScaledVector(_d, -pole.dot(_d)).normalize();
    _e.copy(S).addScaledVector(_d, x).addScaledVector(_p, hh);
    seg(a.up, S, _e, A); seg(a.fore, _e, Wr, B); a.elbow.position.copy(_e);
    _f.copy(fwd || _x.subVectors(Wr, _e)).normalize(); _x.crossVectors(up || _y.set(0, 1, 0), _f).normalize(); _y.crossVectors(_f, _x);
    a.hand.position.copy(Wr); a.hand.quaternion.setFromRotationMatrix(_mm.makeBasis(_x, _y, _f));
    for (const m of [a.up, a.fore, a.elbow, a.hand]) m.visible = true;
  };
  const hideArm = a => { for (const m of [a.up, a.fore, a.elbow, a.hand]) m.visible = false; };

  // ---- out of doors ----
  const out = new THREE.Group(); out.name = 'opening-out'; scene.add(out);
  // three penguins, in a pool of lamplight
  const pg = keepG(penguinGeo()), pm = keepM(new THREE.MeshBasicMaterial({ vertexColors: true }));
  const penguins = [0, 1, 2].map(i => { const m = new THREE.Mesh(pg, pm); m.scale.setScalar([1, 0.86, 0.6][i]); m.visible = false; out.add(m); return m; });
  const pool = new THREE.Mesh(keepG(new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2)), keepM(new THREE.MeshBasicMaterial({ map: soft, color: 0xfff0c8, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending, fog: true })));
  pool.scale.setScalar(5.5); pool.visible = false; pool.renderOrder = 3; out.add(pool);
  // the lights that dance: each a bright head and a fading tail
  const TRAIL = 7, orbMats = Array.from({ length: TRAIL }, (_, j) => keepM(new THREE.SpriteMaterial({ map: glow, color: new THREE.Color(0.45, 1.0, 0.6).multiplyScalar(j ? 0.9 * Math.pow(0.7, j) : 1.6), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true })));
  const orbs = Array.from({ length: 5 }, () => Array.from({ length: TRAIL }, (_, j) => { const s = new THREE.Sprite(orbMats[j]); s.userData.k = j ? 2.3 * Math.pow(0.86, j) : 4.2; s.scale.setScalar(s.userData.k); out.add(s); return s; }));
  // the green in the museum's windows
  const glows = Array.from({ length: 6 }, () => { const s = new THREE.Sprite(keepM(new THREE.SpriteMaterial({ map: soft, color: 0x58ff8a, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true, opacity: 0 }))); s.visible = false; out.add(s); return s; });

  scene.add(room);
  const ground = (x, z) => groundAt(G.plan, x, z, 3);
  return {
    room, out, U, L, door, frost, breath, remote, held, rig, arms, handset, led, poseArm, hideArm, twinkle, penguins, pool, orbs, glows, carSpot, remoteSpot, ground, yaw,
    dispose() {
      scene.remove(room); scene.remove(out); scene.remove(rig);
      for (const g of geos) g.dispose(); for (const m of mats) m.dispose(); for (const t of tex) t.dispose();
    },
  };
}
