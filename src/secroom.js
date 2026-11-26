// What makes a security control room look like one: the screens, lit.
//
// src/furnish.js stands a wall of dead monitors at the quiet end of each control room, and a desk against a
// long wall. This file dresses them (src/secdesk.js decides when):
//
//   * the wall: ten camera feeds (still pictures of places that are really in the game, each with its own grain,
//     scan lines, a slow rolling bar and a clock that keeps time), one screen of green snow (CAM 17: NO SIGNAL), a
//     big display two screens by two with the robot tracker live on it, a rack of status lamps, and the cables;
//   * the desk: an old tube monitor showing a screen saver (a donut, bouncing), a keyboard, a mug, the box of
//     donuts with one left in it, sticky notes (one has half a password on it), and the swivel chair.
//
// Cheap: for both rooms together, ONE material and one texture for everything that glows (a fragment shader
// chooses by a per-vertex `kind`: feed, snow, tracker, screen saver, lamp, paper), one more mesh a room for
// the solid things (smooth, vertex coloured) and one for the pools of light on the floor. Three draw calls a
// room, and nothing is updated unless the toy is in the room: then the clocks once a second, the tracker
// three times a second, and the shader's one clock uniform.

import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import * as TX from './textures.js';
import { HALVES } from './secfiles.js';

const AW = 1024, AH = 512, TW = 192, TH = 128;         // the atlas, and a tile of it
const FONT = '"Marker Felt", "Bradley Hand", "Segoe Print", "Chalkboard SE", "Comic Sans MS", cursive';
const MONO = 'ui-monospace, Menlo, Consolas, monospace';
export const DESK_U = -0.2;                             // the desk's middle, along its wall, from the middle of the strip the fit-out gave it
export const LIVE_W = 384, LIVE_H = 288;

// ---------------------------------------------------------------- the atlas
// Fifteen tiles (five across, three down) and a strip of paper along the bottom.
const tile = i => ({ x: (i % 5) * TW, y: Math.floor(i / 5) * TH, w: TW, h: TH });
const STICKY = i => ({ x: i * 128, y: 384, w: 128, h: 128 });
const LID = { x: 768, y: 384, w: 256, h: 128 };
const uvOf = q => [q.x / AW, 1 - (q.y + q.h) / AH, q.w / AW, q.h / AH];

// A room seen from a camera in the corner of its ceiling: the far wall, and the lines back to us.
function hall(c, vx = 96, vy = 50, w = 70, h = 46, tone = '#27303a') {
  const g = c.createLinearGradient(0, 0, 0, TH); g.addColorStop(0, '#0b0f14'); g.addColorStop(0.55, tone); g.addColorStop(1, '#3a444e'); c.fillStyle = g; c.fillRect(0, 0, TW, TH);
  c.fillStyle = '#1a2129'; c.fillRect(vx - w / 2, vy - h / 2, w, h);
  c.strokeStyle = 'rgba(190,205,220,.5)'; c.lineWidth = 1; c.strokeRect(vx - w / 2, vy - h / 2, w, h);
  c.beginPath(); for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { c.moveTo(vx + sx * w / 2, vy + sy * h / 2); c.lineTo(sx < 0 ? 0 : TW, sy < 0 ? 0 : TH); } c.stroke();
  c.strokeStyle = 'rgba(190,205,220,.14)'; c.beginPath(); for (let k = 1; k < 5; k++) { const f = k / 5, y = vy + h / 2 + (TH - vy - h / 2) * f * f; c.moveTo(0, y); c.lineTo(TW, y); } c.stroke();
}
const glow = (c, x, y, r, col) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
const FEEDS = [
  ['02', 'LOBBY, TURNER', c => { hall(c, 110, 44); glow(c, 84, 92, 46, 'rgba(110,255,140,.55)'); c.fillStyle = '#2a2418'; c.fillRect(68, 58, 34, 24); c.strokeStyle = '#c9a24a'; c.lineWidth = 2; c.strokeRect(68, 58, 34, 24); c.fillStyle = '#9dffb4'; c.beginPath(); c.ellipse(85, 96, 11, 3.5, 0, 0, 7); c.fill(); }],      // (the picture in the entrance hall, and something small and green in front of it: src/entry.js)
  ['04', 'GRAND STAIR', c => { hall(c, 96, 40, 90, 40); c.strokeStyle = 'rgba(200,210,225,.5)'; for (let k = 0; k < 9; k++) { const y = 62 + k * 7.5, w = 46 + k * 13; c.strokeRect(96 - w / 2, y, w, 7.5); } }],
  ['14', '2ND FLOOR RING', c => { hall(c, 70, 48, 60, 40); c.fillStyle = 'rgba(255,236,170,.2)'; c.beginPath(); c.moveTo(118, 100); c.lineTo(60, 84); c.lineTo(66, 112); c.fill(); c.fillStyle = '#d4483a'; c.fillRect(118, 95, 15, 8); c.fillStyle = '#111'; c.fillRect(120, 102, 4, 3); c.fillRect(128, 102, 4, 3); c.fillStyle = '#ffeeb0'; c.fillRect(116, 97, 2, 3); }],
  ['12', 'LL CORRIDOR', c => { hall(c, 96, 56, 26, 34, '#232b33'); c.fillStyle = 'rgba(210,225,240,.5)'; for (let k = 0; k < 4; k++) c.fillRect(92 - k * 2, 6 + k * 9, 8 + k * 4, 2); glow(c, 62, 104, 16, 'rgba(110,255,140,.7)'); c.fillStyle = '#c9ffd6'; c.fillRect(60, 103, 5, 3); }],
  ['13', 'SERVICE LIFT', c => { hall(c, 96, 54, 96, 70); c.fillStyle = '#3d4854'; c.fillRect(66, 30, 29, 59); c.fillRect(97, 30, 29, 59); c.fillStyle = '#0a0d10'; c.fillRect(82, 16, 28, 10); c.fillStyle = '#ffb347'; c.font = `700 9px ${MONO}`; c.textAlign = 'center'; c.fillText('3', 96, 24.5); c.textAlign = 'left'; }],
  ['16', 'DUMPSTER', c => { hall(c, 60, 40, 150, 50, '#1d242b'); c.fillStyle = '#2f5a3a'; c.fillRect(104, 62, 58, 34); c.fillStyle = '#16191c'; c.fillRect(101, 58, 64, 6); c.fillStyle = '#0a0d10'; c.fillRect(40, 78, 22, 14); c.strokeStyle = 'rgba(200,210,225,.5)'; c.beginPath(); for (let x = 43; x < 62; x += 4) { c.moveTo(x, 79); c.lineTo(x, 91); } c.stroke(); c.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < 14; k++) c.fillRect((k * 53) % TW, (k * 37) % 60, 1.5, 1.5); }],
  ['21', 'ROOF TERRACE', c => { c.fillStyle = '#070a12'; c.fillRect(0, 0, TW, TH); c.fillStyle = '#1b222c'; c.fillRect(0, 78, TW, 50); c.fillStyle = '#10151c'; for (let k = 0; k < 9; k++) c.fillRect(k * 22, 52 - ((k * 7) % 5) * 5, 16, 30 + ((k * 7) % 5) * 5); for (let k = 0; k < 13; k++) { const x = 10 + k * 14, y = 40 + Math.sin(k / 12 * Math.PI) * 12; glow(c, x, y, 5, ['rgba(255,220,120,.9)', 'rgba(255,120,110,.9)', 'rgba(140,220,255,.9)'][k % 3]); } c.fillStyle = '#2f5a3a'; c.beginPath(); c.ellipse(96, 96, 30, 10, 0, 0, 7); c.fill(); }],
  ['22', 'BUTLER FIELD', c => { c.fillStyle = '#080b12'; c.fillRect(0, 0, TW, 46); c.fillStyle = '#aeb9c6'; c.fillRect(0, 46, TW, 82); c.strokeStyle = 'rgba(70,96,128,.75)'; c.lineWidth = 2; for (const r of [10, 22, 34]) { c.beginPath(); c.ellipse(104, 88, r * 1.6, r * 0.55, 0, 0, 7); c.stroke(); } c.fillStyle = '#10151c'; for (let k = 0; k < 7; k++) c.fillRect(k * 30, 30 - (k % 3) * 6, 22, 18 + (k % 3) * 6); }],
  ['23', 'HARBOUR LIGHT', c => { c.fillStyle = '#060911'; c.fillRect(0, 0, TW, TH); c.fillStyle = '#18222e'; c.fillRect(0, 84, TW, 44); c.fillStyle = 'rgba(200,220,240,.3)'; for (let k = 0; k < 9; k++) c.fillRect((k * 47) % TW, 90 + (k * 13) % 30, 18, 2); c.fillStyle = '#c9cdd2'; c.beginPath(); c.moveTo(90, 86); c.lineTo(94, 38); c.lineTo(104, 38); c.lineTo(108, 86); c.fill(); c.fillStyle = '#1a1d22'; c.fillRect(91, 30, 16, 9); glow(c, 99, 34, 26, 'rgba(160,255,190,.55)'); c.fillStyle = '#0d1117'; c.fillRect(112, 74, 22, 12); }],
  ['08', 'GRIFFIN COURT', c => { hall(c, 96, 30, 40, 50, '#2a323c'); c.fillStyle = 'rgba(200,215,235,.28)'; c.fillRect(0, 58, TW, 5); c.strokeStyle = 'rgba(200,215,235,.3)'; c.beginPath(); for (let x = 8; x < TW; x += 14) { c.moveTo(x, 0); c.lineTo(x + 6, 12); } c.stroke(); }],
];
function paintFeed(c, i, clock) {
  const f = FEEDS[i], q = tile(i);
  c.save(); c.translate(q.x, q.y); c.beginPath(); c.rect(0, 0, TW, TH); c.clip();
  f[2](c);
  c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, TW, 15);
  c.font = `700 10px ${MONO}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = '#e8eef4'; c.fillText(`CAM ${f[0]} ${f[1]}`, 5, 8);
  c.fillStyle = '#ff5040'; c.beginPath(); c.arc(TW - 9, 8, 3, 0, 7); c.fill();
  c.restore();
  paintClock(c, i, clock);
}
function paintClock(c, i, clock) {
  const q = tile(i); c.fillStyle = '#05070a'; c.fillRect(q.x, q.y + TH - 15, 78, 15);
  c.font = `700 10px ${MONO}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = '#e8eef4'; c.fillText(clock, q.x + 5, q.y + TH - 7);
}
function paintAtlas(c, cam17, clock) {
  c.fillStyle = '#000'; c.fillRect(0, 0, AW, AH);
  for (let i = 0; i < FEEDS.length; i++) paintFeed(c, i, clock);
  // 11: no signal
  { const q = tile(11); c.fillStyle = '#020503'; c.fillRect(q.x, q.y, TW, TH); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#7dffa0'; c.font = `800 22px ${MONO}`; c.fillText('NO SIGNAL', q.x + TW / 2, q.y + TH / 2 - 4); c.font = `700 10px ${MONO}`; c.fillText(`CAM 17 ${String(cam17 || '').toUpperCase()}`, q.x + TW / 2, q.y + TH / 2 + 20); c.fillText('SINCE MARCH', q.x + TW / 2, q.y + TH / 2 + 34); }
  // 12: the desk's own screen, locked
  { const q = tile(12); const g = c.createLinearGradient(0, q.y, 0, q.y + TH); g.addColorStop(0, '#0e2a30'); g.addColorStop(1, '#071418'); c.fillStyle = g; c.fillRect(q.x, q.y, TW, TH);
    c.textAlign = 'center'; c.fillStyle = '#e2cd94'; c.font = `800 15px ${MONO}`; c.fillText('WATCHMAN 4.1', q.x + TW / 2, q.y + 22); c.fillStyle = '#9fe6a0'; c.font = `700 10px ${MONO}`; c.fillText('nightshift · logged in', q.x + TW / 2, q.y + TH - 28); c.fillText('PRESS ANY KEY', q.x + TW / 2, q.y + TH - 13); }
  // paper: the two halves of the password, and what else gets written on a sticky note
  const notes = [[`CL9 pw\n1st half:\n${HALVES[0]}`, '#f7e36a'], [`CL9 pw\n2nd half:\n${HALVES[1]}`, '#f7e36a'], ['the red\nbutton is\nNOT a drill', '#ffb8d0'], ['donut:\nMINE.\n(counted)', '#b8f0c0'], ['if the lift\ngoes to 3\nLET IT', '#f7e36a'], ['machine\nowes me\n75c', '#bfe3ff']];
  notes.forEach(([text, col], i) => {
    const q = STICKY(i); c.fillStyle = col; c.fillRect(q.x, q.y, q.w, q.h); c.fillStyle = 'rgba(0,0,0,.07)'; c.fillRect(q.x, q.y, q.w, 16);
    c.fillStyle = '#1f2b55'; c.textAlign = 'left'; c.textBaseline = 'top'; const lines = text.split('\n');
    lines.forEach((l, k) => { const big = i < 2 && k === 2; c.font = `${big ? '700 38px' : i < 2 ? '19px' : '700 22px'} ${FONT}`; c.fillText(l, q.x + 10, q.y + (i < 2 ? 20 + k * 22 + (big ? 8 : 0) : 24 + k * 31)); });
  });
  // the lid of the box
  { const q = LID; c.fillStyle = '#e9a3bd'; c.fillRect(q.x, q.y, q.w, q.h); c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(q.x + 8, q.y + 8, q.w - 16, q.h - 16); c.fillStyle = '#7a2848'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `800 40px Georgia, serif`; c.fillText('DONUTS', q.x + q.w / 2, q.y + 52); c.font = `italic 17px Georgia, serif`; c.fillText('one dozen (was)', q.x + q.w / 2, q.y + 92); }
}

// ---------------------------------------------------------------- everything that glows: one shader
const VERT = `
attribute vec4 aTile; attribute vec2 aKind;
varying vec2 vUv; varying vec4 vTile; varying vec2 vKind;
void main() { vUv = uv; vTile = aTile; vKind = aKind; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = `
uniform sampler2D uAtlas, uLive; uniform float uTime, uLit, uCalm;
varying vec2 vUv; varying vec4 vTile; varying vec2 vKind;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 uv = vUv; float kind = vKind.x, seed = vKind.y, t = uTime * (1.0 - uCalm * 0.85);
  vec3 col;
  float lines = 0.86 + 0.14 * sin(uv.y * 3.14159 * 150.0);
  float bar = smoothstep(0.08, 0.0, abs(fract(uv.y * 0.5 - t * 0.045 - seed) - 0.5));          // a pale band, rolling slowly down
  float breathe = 0.93 + 0.07 * sin(t * (0.7 + seed * 1.3) + seed * 40.0);                      // each tube drifts, by itself
  if (kind < 0.5) {                                   // a camera
    float slip = step(0.993, hash(vec2(floor(t * 2.0), seed))) * 0.03;                          // now and then the picture slips sideways
    vec2 q = vec2(uv.x + slip * sin(uv.y * 30.0), uv.y);
    col = texture2D(uAtlas, vTile.xy + clamp(q, 0.004, 0.996) * vTile.zw).rgb;
    col = mix(vec3(dot(col, vec3(0.3, 0.5, 0.2))), col, 0.8) * vec3(0.9, 1.0, 1.08);
    col += (hash(floor(uv * vec2(160.0, 106.0)) + floor(t * 9.0) * 0.37 + seed * 17.0) - 0.5) * 0.07;      // grain, as coarse as the picture
    col = (col * lines * breathe + bar * 0.04) * 1.6;
  } else if (kind < 1.5) {                            // no signal: green snow, and the words
    vec3 words = texture2D(uAtlas, vTile.xy + uv * vTile.zw).rgb;
    float snow = hash(floor(uv * vec2(96.0, 64.0)) + floor(t * 14.0) * 1.3);
    col = vec3(0.1, 0.9, 0.35) * snow * snow * 0.4 + words * (0.75 + 0.25 * step(0.5, fract(t * 0.7))) * 1.5;
    col *= lines;
  } else if (kind < 2.5) {                            // the tracker
    col = texture2D(uLive, uv).rgb * 2.1 * lines * (0.96 + 0.04 * sin(t * 5.0)) + bar * vec3(0.01, 0.05, 0.02);
  } else if (kind < 3.5) {                            // the desk's screen: locked, and a donut going round it
    col = texture2D(uAtlas, vTile.xy + uv * vTile.zw).rgb * 0.8;
    vec2 p = vec2(uv.x * 1.33, uv.y), bx = vec2(t * 0.11 + 0.3, t * 0.083 + 0.1), c = vec2(0.17 + abs(fract(bx.x) * 2.0 - 1.0) * 0.99, 0.17 + abs(fract(bx.y) * 2.0 - 1.0) * 0.66);
    float d = length(p - c), ring = smoothstep(0.135, 0.125, d) * smoothstep(0.045, 0.055, d), glaze = smoothstep(0.118, 0.108, d) * smoothstep(0.058, 0.068, d);
    float turn = floor(bx.x * 2.0) + floor(bx.y * 2.0);                                         // a new glaze off every wall
    vec3 ice = mix(vec3(0.94, 0.4, 0.62), 0.5 + 0.5 * cos(6.2832 * (turn * 0.31 + vec3(0.0, 0.33, 0.67))), 0.55);
    col = mix(col, vec3(0.7, 0.46, 0.2), ring); col = mix(col, ice * 0.8, glaze);
    col = col * lines * breathe * 1.7 + bar * 0.04;
  } else if (kind < 4.5) {                            // a status lamp
    vec2 q = uv - 0.5; float d = length(q); if (d > 0.5) discard;
    float rate = 0.25 + fract(seed * 7.31) * 1.6, on = step(fract(seed * 3.7) * 0.5, hash(vec2(seed * 91.0, floor(t * rate))));
    float pick = fract(seed * 13.7); vec3 c = pick < 0.68 ? vec3(0.18, 1.0, 0.42) : pick < 0.9 ? vec3(1.0, 0.66, 0.12) : vec3(1.0, 0.2, 0.14);
    col = c * (0.1 + on * 1.9) * smoothstep(0.5, 0.15, d);
  } else {                                            // paper: lit by the room, not by itself
    col = texture2D(uAtlas, vTile.xy + uv * vTile.zw).rgb * mix(0.2, 0.86, uLit);
    gl_FragColor = vec4(col, 1.0); return;
  }
  float edge = length((vUv - 0.5) * vec2(1.0, 0.9)); col *= 1.0 - 0.45 * smoothstep(0.35, 0.75, edge);       // darker into the corners of the glass
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`;

// A rectangle w by h standing in the plane z = 0, facing +z, its middle at the origin; then moved by `m`.
function quad(list, w, h, m, tileUv, kind, seed) {
  const g = new THREE.PlaneGeometry(w, h); g.applyMatrix4(m);
  const n = g.attributes.position.count, t = new Float32Array(n * 4), k = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { t.set(tileUv, i * 4); k[i * 2] = kind; k[i * 2 + 1] = seed; }
  g.setAttribute('aTile', new THREE.BufferAttribute(t, 4)); g.setAttribute('aKind', new THREE.BufferAttribute(k, 2)); g.deleteAttribute('normal');
  list.push(g);
}

// ---------------------------------------------------------------- the solid things: smooth, and coloured by vertex
const paint = (g, hex) => { const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
const smooth = g => { g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-4); g.computeVertexNormals(); return g.toNonIndexed(); };
const bare = g => { g = g.index ? g.toNonIndexed() : g; if (g.attributes.uv) g.deleteAttribute('uv'); return g; };
// A box with its edges and corners rounded off.
function rbox(w, h, d, r = 0.008, seg = 3) {
  r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  const s = new THREE.Shape(), x = w / 2, y = h / 2;
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2); s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelOffset: -r, bevelSegments: seg, curveSegments: seg * 2 });
  g.translate(0, 0, -(d - 2 * r) / 2); return smooth(g);
}
const M = (x, y, z, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(s, s, s));

// What stands on and round the desk, in the desk's own frame: x along the wall, y up, z out from the wall.
function deskParts(solid, glowing, paper, which) {
  const add = (g, hex, m) => { g = bare(g); if (m) g.applyMatrix4(m); solid.push(paint(g, hex)); };
  const u = DESK_U, top = 0.74, BONE = 0xb9b19c, BONE_D = 0x8f8876, DARK = 0x1c1d21;
  // the monitor: a tube in a bone-coloured case, tipped back a little, on a round foot
  const mon = M(u - 0.06, top + 0.3, 0.36, -0.1, 0.06, 0);
  add(rbox(0.56, 0.46, 0.16, 0.035, 4), BONE, mon); add(rbox(0.42, 0.34, 0.26, 0.06, 4), BONE_D, mon.clone().multiply(M(0, 0.005, -0.17)));
  add(rbox(0.5, 0.385, 0.02, 0.012, 2), DARK, mon.clone().multiply(M(0, 0.014, 0.072)));
  add(new THREE.CylinderGeometry(0.05, 0.065, 0.09, 20), BONE_D, M(u - 0.06, top + 0.045, 0.33));
  add(smooth(new THREE.LatheGeometry([[0, 0.022], [0.12, 0.022], [0.15, 0.012], [0.155, 0], [0, 0]].map(p => new THREE.Vector2(p[0], p[1])), 28)), BONE, M(u - 0.06, top, 0.34));
  quad(glowing, 0.47, 0.355, mon.clone().multiply(M(0, 0.014, 0.0845)), uvOf(tile(12)), 3, 0.37);
  add(new THREE.SphereGeometry(0.006, 8, 6), 0x30d060, mon.clone().multiply(M(0.23, -0.2, 0.082)));
  // the keyboard, and its keys
  const kb = M(u - 0.08, top + 0.014, 0.66, 0.07, 0.04, 0);
  add(rbox(0.46, 0.022, 0.17, 0.008), BONE, kb);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) { if (r === 3 && k > 2 && k < 9) continue; add(new THREE.BoxGeometry(0.025, 0.008, 0.028), (r * 5 + k * 3) % 11 === 0 ? 0x8f8876 : 0xdcd6c6, kb.clone().multiply(M(-0.2 + k * 0.0308, 0.014, -0.058 + r * 0.036))); }
  add(new THREE.BoxGeometry(0.18, 0.008, 0.028), 0xdcd6c6, kb.clone().multiply(M(-0.03, 0.014, 0.05)));
  add(smooth(new THREE.SphereGeometry(0.034, 14, 10).scale(0.8, 0.5, 1.25)), BONE, M(u + 0.3, top + 0.012, 0.66, 0, 0.3, 0));
  // the mug
  const mug = M(u - 0.5, top, 0.6);
  add(smooth(new THREE.LatheGeometry([[0, 0.004], [0.036, 0.004], [0.041, 0.012], [0.043, 0.1], [0.038, 0.1], [0.036, 0.016], [0, 0.014]].map(p => new THREE.Vector2(p[0], p[1])), 24)), 0xe6e3da, mug);
  add(new THREE.TorusGeometry(0.026, 0.007, 8, 18, Math.PI * 1.15), 0xe6e3da, mug.clone().multiply(M(0.044, 0.056, 0, 0, 0, -Math.PI * 0.58)));
  add(new THREE.CylinderGeometry(0.037, 0.037, 0.004, 20), 0x2c1a10, mug.clone().multiply(M(0, 0.086, 0)));
  add(new THREE.CylinderGeometry(0.0432, 0.0432, 0.03, 24, 1, true), 0x1d2a44, mug.clone().multiply(M(0, 0.055, 0)));
  // the box of donuts: open, the lid standing up behind, one left
  const box = M(u + 0.52, top, 0.56, 0, -0.22, 0), PINK = 0xe9a3bd, CARD = 0xf2d9e2;
  add(rbox(0.3, 0.008, 0.24, 0.003, 1), CARD, box.clone().multiply(M(0, 0.004, 0)));
  for (const [x, z, w, d] of [[0, 0.118, 0.3, 0.006], [0, -0.118, 0.3, 0.006], [0.148, 0, 0.006, 0.24], [-0.148, 0, 0.006, 0.24]]) add(new THREE.BoxGeometry(w, 0.055, d), PINK, box.clone().multiply(M(x, 0.03, z)));
  const lid = box.clone().multiply(M(0, 0.055, -0.118, -1.9, 0, 0));                 // hinged along the back, and thrown right open
  add(new THREE.BoxGeometry(0.3, 0.006, 0.24), PINK, lid.clone().multiply(M(0, 0, 0.12)));
  quad(paper, 0.29, 0.23, lid.clone().multiply(M(0, -0.0036, 0.12, Math.PI / 2, 0, 0)), uvOf(LID), 5, 0);      // what it says inside the lid
  const donut = box.clone().multiply(M(0.06, 0.028, 0.02, Math.PI / 2, 0, 0.3));
  add(smooth(new THREE.TorusGeometry(0.043, 0.021, 12, 26)), 0xc98f4a, donut);
  add(smooth(new THREE.TorusGeometry(0.043, 0.0185, 10, 26).scale(1, 1, 0.75)), 0xf08fb4, donut.clone().multiply(M(0, 0, -0.011)));
  [0xffffff, 0xffd447, 0x7fe9f5, 0x9fe6a0, 0xffffff, 0xffd447, 0x7fe9f5, 0xff6fa8, 0x9fe6a0].forEach((c, i) => { const a = i * 0.71 + 0.2; add(new THREE.BoxGeometry(0.011, 0.003, 0.003), c, donut.clone().multiply(M(Math.cos(a) * 0.043, Math.sin(a) * 0.043, -0.027, 0, 0, a * 2.3))); });
  for (const [x, z] of [[-0.07, -0.05], [-0.05, 0.06], [0.1, -0.06]]) add(new THREE.CylinderGeometry(0.036, 0.036, 0.0015, 16), 0xe3bfd0, box.clone().multiply(M(x, 0.009, z)));      // greaseproof rings where the others sat
  // sticky notes: the half of the password under the monitor; the rest where they were stuck
  const N = 0.1, st = (i, m, n = N) => quad(paper, n, n, m, uvOf(STICKY(i)), 5, 0);
  st(which, mon.clone().multiply(M(-0.16, -0.27, 0.083, 0.14, 0, -0.05)));
  st(2 + which, mon.clone().multiply(M(0.31, 0.06, 0.02, 0, Math.PI / 2 - 0.12, 0.06)));
  st(which, M(u - 0.4, top - 0.075, 0.843, 0.08, 0, 0.06), 0.14); st(4 + which, M(u + 0.14, top - 0.062, 0.843, 0.06, 0, -0.05));      // and again on the front of the desk, where somebody small can read it
  // the swivel chair, pushed back and turned away
  const ch = M(0.83, 0, 1.21, 0, -0.7, 0), CH = 0x23262c, FAB = 0x2b3f6b;
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 0.4; add(rbox(0.27, 0.028, 0.045, 0.012, 2), CH, ch.clone().multiply(M(Math.sin(a) * 0.135, 0.075, Math.cos(a) * 0.135, 0, a + Math.PI / 2, 0))); add(new THREE.SphereGeometry(0.03, 12, 8), 0x111214, ch.clone().multiply(M(Math.sin(a) * 0.265, 0.03, Math.cos(a) * 0.265))); }
  add(new THREE.CylinderGeometry(0.024, 0.03, 0.34, 14), 0x8a9098, ch.clone().multiply(M(0, 0.25, 0)));
  add(rbox(0.46, 0.075, 0.44, 0.035, 4), FAB, ch.clone().multiply(M(0, 0.455, 0)));
  add(rbox(0.42, 0.44, 0.07, 0.034, 4), FAB, ch.clone().multiply(M(0, 0.8, -0.215, -0.14, 0, 0)));
  add(rbox(0.05, 0.3, 0.03, 0.012, 2), CH, ch.clone().multiply(M(0, 0.6, -0.225, -0.08, 0, 0)));
  for (const s of [-1, 1]) { add(rbox(0.045, 0.03, 0.26, 0.012, 2), CH, ch.clone().multiply(M(s * 0.255, 0.64, 0.0))); add(rbox(0.03, 0.2, 0.03, 0.01, 2), CH, ch.clone().multiply(M(s * 0.255, 0.54, -0.08))); }
}
// The wall of screens, in its own frame (x along the wall, y up from the floor, z out of the glass), `w` wide.
function wallParts(solid, glowing, w, H, rnd) {
  const add = (g, hex, m) => { g = bare(g); if (m) g.applyMatrix4(m); solid.push(paint(g, hex)); };
  const e = w / 2, cols = []; for (let u = -e + 0.08; u + 0.72 < e; u += 0.74) cols.push(u + 0.34);
  const rows = [0.98, 1.54, 2.1].map(y => y + 0.25), Z = 0.007;
  // the big display takes the top two rows of the second and third columns
  const big = cols.length >= 4 ? [1, 2] : [0, 1];
  quad(glowing, cols[big[1]] - cols[big[0]] + 0.68, rows[2] - rows[1] + 0.5, M((cols[big[0]] + cols[big[1]]) / 2, (rows[1] + rows[2]) / 2, Z + 0.004), [0, 0, 1, 1], 2, 0.5);
  add(rbox(cols[big[1]] - cols[big[0]] + 0.74, rows[2] - rows[1] + 0.56, 0.02, 0.008, 2), 0x15161a, M((cols[big[0]] + cols[big[1]]) / 2, (rows[1] + rows[2]) / 2, -0.004));
  let n = 0; const order = [0, 5, 2, 7, 4, 9, 11, 1, 6, 3, 8];
  cols.forEach((u, i) => rows.forEach((y, j) => {
    if (big.includes(i) && j > 0) return;
    const f = order[n++ % order.length];
    quad(glowing, 0.66, 0.48, M(u, y, Z), uvOf(tile(f)), f === 11 ? 1 : 0, rnd());
  }));
  // down the side there is room for the status rack; along the bottom, a strip of lamps
  const left = e - (cols[cols.length - 1] + 0.34);
  if (left > 0.4) {
    const x = e - left / 2 + 0.02, rw = Math.min(0.46, left - 0.14);
    add(rbox(rw, 1.62, 0.05, 0.012, 2), 0x1b1d22, M(x, 1.79, 0.02));
    for (let j = 0; j < 18; j++) for (let i = 0; i < 4; i++) quad(glowing, 0.026, 0.026, M(x - rw / 2 + 0.07 + i * (rw - 0.14) / 3, 1.05 + j * 0.087, 0.0465), [0, 0, 0, 0], 4, rnd());
    for (let j = 0; j < 3; j++) add(rbox(rw - 0.08, 0.012, 0.012, 0.004, 1), 0x3a3d42, M(x, 1.02 + 0.52 * j + 0.26, 0.047));
  }
  add(rbox(w - 0.1, 0.05, 0.03, 0.01, 2), 0x1b1d22, M(0, 0.93, 0.012));
  for (let i = 0; i < 46; i++) quad(glowing, 0.02, 0.02, M(-e + 0.14 + i * (w - 0.28) / 45, 0.93, 0.0285), [0, 0, 0, 0], 4, rnd());
  // cables: up from the top of the wall to the tray under the ceiling, and a loom along the skirting
  const tube = (pts, r, hex) => add(smooth(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2]))), 16, r, 7, false)), hex);
  const cols2 = [0x16171a, 0x16171a, 0x2c4f8a, 0x16171a, 0xd8a418, 0x16171a];
  for (let i = 0; i < 9; i++) { const x = -e + 0.3 + (w - 0.6) * (i / 8) + (rnd() - 0.5) * 0.12, top = Math.min(H - 0.12, 3.5), lean = (rnd() - 0.5) * 0.3; tube([[x, 2.66, -0.06], [x + lean * 0.3, 2.9, -0.1 + rnd() * 0.015], [x + lean, top - 0.2, -0.1], [x + lean * 1.1, top, -0.04 + rnd() * 0.1]], 0.011 + rnd() * 0.006, cols2[i % cols2.length]); }
  for (let i = 0; i < 4; i++) { const sag = 0.04 + rnd() * 0.05, y = 0.78 - i * 0.05; tube([[-e + 0.05, y, -0.108], [-e / 2, y - sag, -0.106 + i * 0.004], [0, y - sag * 0.3, -0.108 + i * 0.004], [e / 2, y - sag, -0.106 + i * 0.004], [e - 0.05, y, -0.108]], 0.012, cols2[(i + 2) % cols2.length]); }
  for (const x of [-e / 2, 0, e / 2]) add(rbox(0.07, 0.3, 0.04, 0.01, 1), 0x3a3d42, M(x, 0.7, -0.1));         // the clips that hold the loom
}

// ---------------------------------------------------------------- putting a room together
// rooms: [{ desk: { x, y, z, fx, fz } | null, wall: { x, y, z, fx, fz, w } | null, H }]. Returns what src/secdesk.js needs to keep it
// alive: { group, uniforms, live: { canvas, ctx, tex }, clocks(text), lit(k), show(on) }.
export function dressRooms(rooms, { cam17 = 'Bridge galleries, west', clock = '02:10:00', seed = 7 } = {}) {
  let s = seed >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const atlas = document.createElement('canvas'); atlas.width = AW; atlas.height = AH; const ac = atlas.getContext('2d');
  paintAtlas(ac, cam17, clock);
  const atex = new THREE.CanvasTexture(atlas); atex.colorSpace = THREE.SRGBColorSpace; atex.anisotropy = 4; atex.generateMipmaps = false; atex.minFilter = THREE.LinearFilter;
  const live = document.createElement('canvas'); live.width = LIVE_W; live.height = LIVE_H; const lc = live.getContext('2d'); lc.fillStyle = '#020a06'; lc.fillRect(0, 0, LIVE_W, LIVE_H);
  const ltex = new THREE.CanvasTexture(live); ltex.colorSpace = THREE.SRGBColorSpace; ltex.generateMipmaps = false; ltex.minFilter = THREE.LinearFilter;
  const uniforms = { uAtlas: { value: atex }, uLive: { value: ltex }, uTime: { value: 0 }, uLit: { value: 1 }, uCalm: { value: 0 } };
  const glass = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG });
  const body = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.05, emissive: 0xffffff, emissiveIntensity: 0.26 });
  body.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'); };      // (it glows a little in its own colour, as the furniture does: src/museum.js)
  body.customProgramCacheKey = () => 'secroom-body';
  const pool = new THREE.MeshBasicMaterial({ map: TX.radial(0, 1.3), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, fog: false });
  const group = new THREE.Group(); group.name = 'security rooms'; const meshes = [];
  rooms.forEach((R, n) => {
    const solid = [], glowing = [], paper = [], pools = [];
    const frame = at => new THREE.Matrix4().makeRotationY(Math.atan2(at.fx, at.fz)).setPosition(at.x, at.y, at.z);
    const lightPool = (m, w, d, x, z, hex) => { const g = new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2); g.translate(x, 0.012, z); g.applyMatrix4(m); g.deleteAttribute('normal'); pools.push(paint(g, hex)); };
    if (R.desk) {
      const a = [], b = [], c = [], m = frame(R.desk); deskParts(a, b, c, n % 2);
      for (const [from, to] of [[a, solid], [b, glowing], [c, glowing]]) for (const g of from) { g.applyMatrix4(m); to.push(g); }
      lightPool(m, 2.6, 2.4, DESK_U - 0.05, 1.5, new THREE.Color(0.1, 0.34, 0.26));
    }
    if (R.wall) {
      const a = [], b = [], m = frame(R.wall); wallParts(a, b, R.wall.w || 4.4, R.H || 4, rnd);
      for (const g of a) { g.applyMatrix4(m); solid.push(g); } for (const g of b) { g.applyMatrix4(m); glowing.push(g); }
      lightPool(m, (R.wall.w || 4.4) + 1.4, 4.2, 0, 1.9, new THREE.Color(0.1, 0.2, 0.26));
    }
    for (const [list, mat, order] of [[solid, body, 0], [glowing, glass, 0], [pools, pool, 3]]) {
      if (!list.length) continue;
      const mesh = new THREE.Mesh(mergeGeometries(list), mat); mesh.matrixAutoUpdate = false; mesh.renderOrder = order; mesh.visible = false; mesh.userData.room = n;
      if (mat === body) mesh.receiveShadow = true;
      for (const g of list) g.dispose();
      group.add(mesh); meshes.push(mesh);
    }
  });
  let shown = -2;
  return {
    group, uniforms, live: { canvas: live, ctx: lc, tex: ltex },
    // the clocks on the feeds, once a second
    clocks(text) { for (let i = 0; i < FEEDS.length; i++) paintClock(ac, i, text); atex.needsUpdate = true; },
    // the room's own lights, on (1) or off (0): the paper and the furniture dim with them
    lit(k) { uniforms.uLit.value = k; body.emissiveIntensity = 0.07 + 0.19 * k; },
    // draw room n's things (or none, -1): everything else stays undrawn
    show(n) { if (n === shown) return; shown = n; for (const m of meshes) m.visible = m.userData.room === n; },
  };
}
