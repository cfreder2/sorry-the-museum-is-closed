// Inside the Tuxedo Shop (sledhill.js), and why there are penguins on the sledding hill at all.
//
// The shop is a cover. Behind its rack of tiny tuxedos, at the back of the room, a hole in the air turns and hums: a
// wormhole, green as everything of theirs is, its rim running through the five colours of the call (src/motif.js).
// When a penguin is due it flares and the penguin pops out of it, shakes itself, and waddles out of the door. Every
// so often the thing shrinks and flickers as if somebody were forcing it shut, and a moment later it opens again.
// Somebody has been: the groundskeeper's note is pinned to the wall beside it ("— G."), his shovel and broom propped
// under it and the boards he nailed over it lying on the floor. Reading it is a page of the Green Cheese file
// ('portal', src/story.js), and points on to the rings melted into the snow over the ballfield.
//
// The room: the toy can drive in (the door swings open as it comes, and stays open while it is inside; a plank ramp
// up to the sill), and everything in it is solid as drawn: the walls, the counter with its till and bell, the bow
// ties on shelves over it, the clothes rail (high enough to drive under its tuxedos), the long mirror, the shovel and
// broom; the ceiling is a ceiling for the drone. The bay window is real glass now, a tuxedo on a stand behind it, and
// the portal's light shows through it and lies on the snow. Drive into the portal (E) and it spits you out at the
// bottom of the sled run.
//
// Cheap on a phone: the portal is one quad and a short shader (no loops, no textures), its glow on the walls, floor
// and snow is painted on flat additive sheets, the room is one mesh lit from within, and nothing at all is done per
// frame unless the toy is within 40 m of the shop.
import * as THREE from 'three';
import { MOTIF, MOTIF_COLOURS, hz } from './motif.js';
import { canvasTex, C } from './glowkit.js';
import { FINISH_S } from './sledland.js';

const GREEN = new THREE.Color(0.32, 1, 0.45);
const WARM = new THREE.Color(0.5, 0.36, 0.24);
const FLY = 0.215;                   // the floor boards' top, over the shop's footing
const NEAR = 40;                     // metres: further off than this, nothing is done
const PR = 0.6;                      // the portal's radius

// The groundskeeper's note. The first line is his exactly; the rest in his voice.
export const G_NOTE = [
  'I don’t know what to do about these penguins.',
  'That thing in the back opened again. I shut it. It opens. More penguins.',
  'I’m used to dealing with worms, not wormholes.',
  'Worse when that tune plays. Five notes.',
  'Snow on the ballfield’s melting in rings, too.',
  'Told the Director. Director said keep the snow on the field.',
  'I don’t get paid enough for this.',
];

// ---------------------------------------------------------------- the card
function noteCanvas() {
  const W = 540, cv = document.createElement('canvas'), g = cv.getContext('2d'), font = '30px "Bradley Hand", "Segoe Print", "Marker Felt", "Comic Sans MS", cursive';
  // wrap first, to know how tall the sheet is
  g.font = font; const lines = [];
  for (const para of G_NOTE) {
    let line = '';
    for (const w of para.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > W - 100 && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line); lines.push(null);              // (a little gap between his lines)
  }
  lines.pop();
  const LH = 40, GAP = 14, body = lines.reduce((s, l) => s + (l === null ? GAP : LH), 0), H = 120 + body + 110;
  cv.width = W; cv.height = H;
  // a page torn off a work pad: squared paper, a smudge of grease, a strip of tape at the top
  g.fillStyle = '#ece6d2'; g.fillRect(14, 14, W - 28, H - 28);
  g.strokeStyle = 'rgba(70,110,150,.13)'; g.lineWidth = 1;
  for (let x = 30; x < W - 20; x += 24) { g.beginPath(); g.moveTo(x, 18); g.lineTo(x, H - 18); g.stroke(); }
  for (let y = 30; y < H - 20; y += 24) { g.beginPath(); g.moveTo(18, y); g.lineTo(W - 18, y); g.stroke(); }
  g.fillStyle = 'rgba(90,70,40,.09)'; g.beginPath(); g.ellipse(W - 120, H - 150, 70, 40, -0.4, 0, 7); g.fill();
  g.fillStyle = 'rgba(220,214,180,.8)'; g.save(); g.translate(W / 2, 18); g.rotate(-0.04); g.fillRect(-60, -12, 120, 30); g.restore();
  // penguin feet across the bottom corner, where one walked over it
  g.fillStyle = 'rgba(60,64,72,.35)';
  for (let i = 0; i < 4; i++) { const x = 46 + i * 34, y = H - 50 - (i % 2) * 14; for (const a of [-0.5, 0, 0.5]) { g.save(); g.translate(x, y); g.rotate(a - 0.25); g.fillRect(-2.5, -15, 5, 15); g.restore(); } }
  g.font = font; g.fillStyle = '#25304a';
  let y = 92; for (const l of lines) { if (l === null) { y += GAP; continue; } g.fillText(l, 46, y); y += LH; }
  g.font = 'italic 40px "Bradley Hand", "Segoe Print", "Marker Felt", cursive'; g.fillText('— G.', W - 160, H - 50);
  return cv;
}

// ---------------------------------------------------------------- the wormhole's shader
// A disc turning on itself: two sets of spiral arms wound tighter towards the middle, a deep dark throat with a point
// of light far down it, and a rim that runs through the call's five colours. uOpen scales it (1 open, 0 shut), uFlare
// brightens it, uFlick dims it unevenly while it is being forced shut.
const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FRAG = `
varying vec2 vUv;
uniform float uT, uOpen, uFlare, uFlick;
uniform vec3 uC0, uC1, uC2, uC3, uC4;
float w(float h, float k) { float d = abs(h - k); d = min(d, 5.0 - d); return max(0.0, 1.0 - d); }
void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float open = max(uOpen, 0.02), r = length(p) / open;
  if (r > 1.0) discard;
  float a = atan(p.y, p.x);
  float arms = smoothstep(0.3, 0.95, 0.5 + 0.5 * sin(a * 3.0 + 5.0 / (r + 0.2) - uT * 2.4));
  float fine = 0.5 + 0.5 * sin(a * 7.0 - 8.0 / (r + 0.3) + uT * 3.7);
  float h = fract(a / 6.2831853 + uT * 0.06) * 5.0;
  vec3 rimC = uC0 * w(h, 0.0) + uC1 * w(h, 1.0) + uC2 * w(h, 2.0) + uC3 * w(h, 3.0) + uC4 * w(h, 4.0);
  vec3 green = vec3(0.2, 0.95, 0.36);
  vec3 col = mix(vec3(0.0, 0.035, 0.02), green, arms * smoothstep(0.04, 0.6, r));
  col += vec3(0.45, 1.0, 0.55) * fine * 0.13 * smoothstep(0.3, 0.9, r);
  float rim = smoothstep(0.8, 0.95, r);
  col = mix(col, rimC * 1.15, rim * 0.9);
  float core = 1.0 - smoothstep(0.0, 0.1, r);
  col += vec3(0.7, 1.0, 0.8) * core * core * 1.2;
  col *= (0.8 + 0.9 * uFlare) * uFlick;
  float alpha = 1.0 - smoothstep(0.92, 1.0, r);
  gl_FragColor = vec4(col, alpha);
}`;

const ease = t => t * t * (3 - 2 * t);
const back = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };      // overshoots a little, then settles

export class TuxPortal {
  // hill: the sledding feature; s: the shop's measurements (sledhill.js _summit); kit: { Parts, M4, col, B }.
  constructor(hill, k, s, kit) {
    this.hill = hill; this.k = k; this.s = s; this.kit = kit; this.t = 0;
    this.g = new THREE.Group(); this.g.name = 'tuxportal'; hill.g.add(this.g);
    const { SX, SZ, fy, W, D, T } = s;
    this.ix0 = SX - W / 2 + T; this.ix1 = SX + W / 2 - T; this.iz0 = SZ - D / 2 + T; this.iz1 = SZ + D / 2 - T;
    this.floor = fy + FLY;
    this.at = { x: SX - 0.55, y: this.floor + 0.8, z: SZ - D / 2 + T + 0.18 };              // the portal's middle
    this.spawn = { x: SX - 0.22, z: this.at.z + 0.22 };                                      // where a penguin comes out of it
    this.noteAt = { x: SX + 0.5, y: this.floor, z: SZ - D / 2 + T + 0.36 };                 // where to stand to read the note
    this.mouth = { x: this.at.x + 0.15, y: this.floor, z: this.at.z + 0.3 };                // where to stand to go in
    this.phase = 'open'; this.pt = 0; this.nextShut = 14 + Math.random() * 10; this.open = 1; this.fl = 0; this.flick = 1;
    this.route = [this.spawn, { x: SX + 0.42, z: SZ - 0.3 }, { x: s.door.x, z: s.door.z - 0.5 }];      // a penguin's way from the portal to the door
    this._solid(); this._room(); this._portal(); this._note();
    import('./story.js').then(m => { this.story = m.story; m.story.enable('portal'); }).catch(() => {});
  }

  // ============================================================ the room
  _room() {
    const { SX, SZ, fy, W, D, T, DX, DW, BX, BW, BD, BY0, BY1, WH } = this.s, { Parts, M4, col, B } = this.kit;
    const P = new Parts(), at = (x, y, z, ry = 0, rx = 0, rz = 0) => M4(SX + x, fy + y, SZ + z, ry, rx, rz);
    const F = FLY, ix = W / 2 - T, iz = D / 2 - T;
    const board = col(0x8a6440), boardD = col(0x6e4c2e), pine = col(0xc9a274), green = col(0x1f4a36), gold = col(0xc9a24a), blk = col(0x15151a), wht = col(0xf2efe6), red = col(0xc8262a), iron = col(0x2a2a2e), steel = col(0x8c949e), cream = col(0xefe4c8);
    // floor boards (through the doorway too), a ceiling of pine boards
    for (let i = 0, n = 11; i < n; i++) { const x = -ix + (i + 0.5) * (2 * ix / n); P.box(2 * ix / n - 0.006, 0.015, D / 2 + 0.07 + iz, i % 2 ? board : boardD, at(x, F - 0.0075, (0.07 + D / 2 - iz) / 2)); }
    P.box(2 * ix, 0.06, 2 * iz, pine, at(0, WH - 0.13, 0));
    for (let z = -iz + 0.3; z < iz; z += 0.5) P.box(2 * ix, 0.05, 0.06, boardD, at(0, WH - 0.185, z));
    // the plank ramp up to the sill outside the door
    { const r = this.ramp, len = Math.hypot(r.z1 - r.z0, r.h0 - r.h1), ang = Math.atan2(r.h0 - r.h1, r.z1 - r.z0), cy = (r.h0 + r.h1) / 2 - 0.02 * Math.cos(ang);
      for (let i = 0; i < 4; i++) P.add(new THREE.BoxGeometry((r.x1 - r.x0) / 4 - 0.008, 0.04, len), i % 2 ? board : boardD, M4(r.x0 + (i + 0.5) * (r.x1 - r.x0) / 4, cy, (r.z0 + r.z1) / 2, 0, ang)); }
    // the counter along the east wall: panelled front, a top that overhangs, a brass till, a bell, a spool of red ribbon
    { const x0 = 0.98, x1 = ix, z0 = -iz, z1 = -0.12, h = 0.88, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      P.box(x1 - x0, h - 0.04, z1 - z0, boardD, at(cx, F + (h - 0.04) / 2, cz));
      for (let z = z0 + 0.18; z < z1 - 0.1; z += 0.34) P.box(0.012, h - 0.24, 0.26, board, at(x0 - 0.006, F + h / 2, z));
      P.box(x1 - x0 + 0.08, 0.04, z1 - z0 + 0.06, pine, at(cx - 0.04, F + h - 0.02, cz));
      P.box(0.3, 0.16, 0.26, gold, at(cx + 0.05, F + h + 0.08, z0 + 0.3)); P.box(0.24, 0.08, 0.14, col(0xa88838), at(cx + 0.02, F + h + 0.2, z0 + 0.3, 0, 0, -0.5));
      for (let i = 0; i < 6; i++) P.box(0.03, 0.012, 0.03, cream, at(cx - 0.02 + (i % 3) * 0.05, F + h + 0.165, z0 + 0.26 + Math.floor(i / 3) * 0.06));
      P.add(new THREE.SphereGeometry(0.05, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), gold, at(cx - 0.05, F + h, z1 - 0.22)); P.add(new THREE.SphereGeometry(0.012, 6, 4), gold, at(cx - 0.05, F + h + 0.055, z1 - 0.22));
      P.add(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 12), red, at(cx + 0.1, F + h + 0.035, z1 - 0.38));
      this._ob(SX + x0 - 0.04, SX + x1, SZ + z0, SZ + z1 + 0.03, this.floor - 0.1, this.floor + h);
      // shelves of bow ties over it, on the east wall
      for (const [k, y] of [[0, 1.3], [1, 1.58], [2, 1.86]]) {
        P.box(0.2, 0.025, z1 - z0 - 0.1, pine, at(x1 - 0.1, F + y, cz)); P.box(0.03, 0.08, 0.03, iron, at(x1 - 0.03, F + y - 0.05, z0 + 0.15)); P.box(0.03, 0.08, 0.03, iron, at(x1 - 0.03, F + y - 0.05, z1 - 0.15));
        for (let i = 0; i < 5; i++) this._tie(P, x1 - 0.1, F + y + 0.045, z0 + 0.2 + i * 0.19, [red, blk, col(0x2a6ad2), gold][(i + k) % 4], Math.PI / 2);
      }
      this._ob(SX + x1 - 0.21, SX + x1, SZ + z0, SZ + z1, this.floor + 1.2, this.floor + 1.95);
    }
    // the clothes rail, partly in front of the portal: penguin-sized tuxedos face out from it, hung high enough to drive under
    { const rx0 = -1.22, rx1 = -0.28, rz = -iz + 0.78, rh = 1.02;
      for (const x of [rx0, rx1]) { P.box(0.035, rh, 0.035, steel, at(x, F + rh / 2, rz)); P.box(0.05, 0.03, 0.42, steel, at(x, F + 0.015, rz)); this._ob(SX + x - 0.04, SX + x + 0.04, SZ + rz - 0.21, SZ + rz + 0.21, this.floor - 0.1, this.floor + rh); }
      P.add(new THREE.CylinderGeometry(0.014, 0.014, rx1 - rx0 + 0.06, 6).rotateZ(Math.PI / 2), steel, at((rx0 + rx1) / 2, F + rh, rz));
      for (let i = 0; i < 6; i++) {
        const x = rx0 + 0.095 + i * 0.15, z = rz + (i % 2 ? 0.012 : -0.012), top = F + rh - 0.06;
        P.add(new THREE.TorusGeometry(0.018, 0.004, 4, 8, Math.PI), steel, at(x, F + rh, z));
        P.box(0.13, 0.012, 0.012, col(0x6e4628), at(x, top, z));                                    // the hanger
        P.box(0.12, 0.05, 0.035, blk, at(x, top - 0.03, z)); P.box(0.105, 0.29, 0.03, blk, at(x, top - 0.19, z));      // shoulders, the jacket
        P.add(new THREE.ConeGeometry(0.026, 0.12, 3).rotateX(Math.PI), wht, at(x, top - 0.09, z + 0.016));            // its shirt front
        for (const sd of [-1, 1]) P.box(0.012, 0.13, 0.004, col(0x34343e), at(x + sd * 0.03, top - 0.1, z + 0.017, 0, 0, sd * 0.22));      // satin lapels
        this._tie(P, x, top - 0.035, z + 0.024, red, 0);
        P.box(0.01, 0.01, 0.01, wht, at(x, top - 0.17, z + 0.017)); P.box(0.01, 0.01, 0.01, wht, at(x, top - 0.21, z + 0.017));
      }
      this._ob(SX + rx0, SX + rx1, SZ + rz - 0.05, SZ + rz + 0.05, this.floor + 0.6, this.floor + rh + 0.05);
    }
    // the long mirror on the west wall, in a gilt frame
    { const z0 = 0.05, z1 = 0.72, y0 = 0.14, y1 = 1.7, x = -ix;
      P.box(0.05, y1 - y0 + 0.08, 0.05, gold, at(x + 0.03, F + (y0 + y1) / 2, z0)); P.box(0.05, y1 - y0 + 0.08, 0.05, gold, at(x + 0.03, F + (y0 + y1) / 2, z1));
      P.box(0.05, 0.05, z1 - z0, gold, at(x + 0.03, F + y0, (z0 + z1) / 2)); P.box(0.05, 0.08, z1 - z0 + 0.06, gold, at(x + 0.03, F + y1, (z0 + z1) / 2));
      const glass = canvasTex(128, 320, (c, w, h) => {
        const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#6f8796'); gr.addColorStop(0.5, '#2c3a44'); gr.addColorStop(1, '#4d6170'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
        c.fillStyle = 'rgba(255,255,255,.13)'; c.beginPath(); c.moveTo(w * 0.15, 0); c.lineTo(w * 0.42, 0); c.lineTo(w * 0.05, h * 0.55); c.lineTo(0, h * 0.4); c.fill();
        const gl = c.createRadialGradient(w * 0.7, h * 0.42, 2, w * 0.7, h * 0.42, w * 0.45); gl.addColorStop(0, 'rgba(140,255,170,.55)'); gl.addColorStop(1, 'rgba(80,255,130,0)'); c.fillStyle = gl; c.fillRect(0, 0, w, h);      // the portal, over your shoulder
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0 - 0.04, y1 - y0 - 0.04), new THREE.MeshBasicMaterial({ map: glass, color: new THREE.Color(0.9, 0.95, 1) }));
      m.position.set(SX + x + 0.032, fy + F + (y0 + y1) / 2, SZ + (z0 + z1) / 2); m.rotation.y = Math.PI / 2; m.matrixAutoUpdate = false; m.updateMatrix(); this.g.add(m);
      this._ob(SX + x, SX + x + 0.07, SZ + z0 - 0.03, SZ + z1 + 0.03, this.floor - 0.1, this.floor + y1 + 0.05);
    }
    // the groundskeeper's things by the portal: his snow shovel and broom against the wall, the boards he nailed over it
    // knocked off and lying on the floor, the hammer
    { const zw = -iz;
      const lean = (x, len, tilt) => { const a = new THREE.Vector3(SX + x, fy + F + 0.02, SZ + zw + Math.sin(tilt) * len), b = new THREE.Vector3(SX + x, fy + F + Math.cos(tilt) * len, SZ + zw + 0.03); return [a, b]; };
      const rod = (a, b, r, c) => { const d = new THREE.Vector3().subVectors(b, a), l = d.length(), g = new THREE.CylinderGeometry(r, r, l, 6); g.translate(0, l / 2, 0); P.add(g, c, new THREE.Matrix4().compose(a, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, 1, 1))); };
      { const [a, b] = lean(-1.5, 1.3, 0.2); rod(a, b, 0.016, col(0x8a6a3e)); P.box(0.3, 0.36, 0.02, col(0x2f6fb0), M4(a.x, a.y + 0.17, a.z - 0.02, 0, 0.2)); }      // the shovel, blade down
      { const [a, b] = lean(-1.3, 1.25, 0.16); rod(a, b, 0.014, col(0xb08850)); P.box(0.26, 0.2, 0.06, col(0xc8a85a), M4(a.x, a.y + 0.1, a.z - 0.02, 0, 0.16)); P.box(0.28, 0.04, 0.07, col(0x8a2a22), M4(a.x, a.y + 0.21, a.z - 0.02, 0, 0.16)); }      // the broom
      this._ob(SX - ix, SX - 1.14, SZ + zw, SZ + zw + 0.3, this.floor - 0.1, this.floor + 1.3);
      P.box(0.9, 0.022, 0.1, col(0x9a7a50), at(-0.62, F + 0.011, -iz + 0.55, 0.12)); P.box(0.85, 0.022, 0.1, col(0x86683f), at(-0.8, F + 0.033, -iz + 0.62, -0.35));      // the boards
      for (const [x, z] of [[-1.0, -iz + 0.5], [-0.25, -iz + 0.6], [-1.15, -iz + 0.75]]) P.box(0.006, 0.04, 0.006, steel, at(x, F + 0.06, z, 0, 0.6));      // their nails, bent
      P.box(0.03, 0.022, 0.26, col(0x6e4628), at(-0.05, F + 0.012, -iz + 0.85, 0.7)); P.box(0.12, 0.03, 0.04, iron, at(-0.13, F + 0.016, -iz + 0.75, 0.7));      // the hammer
    }
    // (the note, pinned to the wall right of the portal at a toy's eye level, is made in _note)
    // his coat on a hook by the door, a lamp on a cord from the ceiling, a rug in the middle
    P.box(0.04, 0.04, 0.12, iron, at(ix - 0.02, F + 1.6, iz - 0.25)); P.add(new THREE.SphereGeometry(0.03, 8, 6), iron, at(ix - 0.08, F + 1.62, iz - 0.25));
    P.box(0.05, 0.6, 0.22, col(0x3d5a3a), at(ix - 0.06, F + 1.28, iz - 0.25)); this._ob(SX + ix - 0.1, SX + ix, SZ + iz - 0.37, SZ + iz - 0.13, this.floor + 0.97, this.floor + 1.66);
    { const lx = 0.15, lz = 0.05; P.add(new THREE.CylinderGeometry(0.005, 0.005, 0.42, 4), iron, at(lx, WH - 0.37, lz)); P.add(new THREE.ConeGeometry(0.17, 0.14, 12, 1, true), green, at(lx, WH - 0.62, lz));
      B.add(SX + lx, fy + WH - 0.66, SZ + lz, C.warm, 0.4, 2, 0.06); this._ob(SX + lx - 0.17, SX + lx + 0.17, SZ + lz - 0.17, SZ + lz + 0.17, fy + WH - 0.72, fy + WH); }
    { const rug = canvasTex(256, 160, (c, w, h) => { c.fillStyle = '#7a2420'; c.fillRect(0, 0, w, h); c.strokeStyle = '#d8b048'; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20); c.strokeStyle = '#1f4a36'; c.lineWidth = 10; c.strokeRect(26, 26, w - 52, h - 52); c.fillStyle = '#d8b048'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(64 + i * 32, h / 2, 6, 0, 7); c.fill(); } });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.8).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: rug, roughness: 1, emissiveMap: rug, emissive: new THREE.Color(0.45, 0.4, 0.38) }));
      m.position.set(SX + 0.3, this.floor + 0.011, SZ + 0.45); m.matrixAutoUpdate = false; m.updateMatrix(); this.g.add(m); }
    // the bay window, seen from inside: its nook, and in it a tuxedo on a stand and shelves of bow ties either side
    { const bz = D / 2 + BD / 2 - 0.02, by = BY0 + 0.02;
      P.box(0.16, 0.012, 0.16, col(0x3a2412), at(BX, by + 0.006, bz)); P.add(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6), col(0x3a2412), at(BX, by + 0.21, bz));
      const torso = new THREE.CylinderGeometry(0.15, 0.12, 0.42, 10); torso.scale(1, 1, 0.55); P.add(torso, blk, at(BX, by + 0.62, bz));
      P.add(new THREE.ConeGeometry(0.05, 0.26, 3).rotateX(Math.PI), wht, at(BX, by + 0.7, bz + 0.07, 0, 0.12));
      this._tie(P, BX, by + 0.8, bz + 0.09, red, 0);
      P.add(new THREE.CylinderGeometry(0.03, 0.035, 0.06, 8), wht, at(BX, by + 0.86, bz));
      P.add(new THREE.CylinderGeometry(0.075, 0.075, 0.13, 12), blk, at(BX, by + 0.97, bz)); P.add(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 14), blk, at(BX, by + 0.905, bz));
      for (const sd of [-1, 1]) for (const [k, y] of [[0, 0.3], [1, 0.62]]) { const x = BX + sd * (BW / 2 - 0.2); P.box(0.3, 0.02, 0.2, pine, at(x, by + y, bz)); for (let i = 0; i < 3; i++) this._tie(P, x - 0.09 + i * 0.09, by + y + 0.035, bz + 0.03, [red, blk, col(0x2a6ad2), gold][(i + k + (sd > 0 ? 1 : 0)) % 4], 0); }
      void BY1;
    }
    void DX; void DW;
    const m = this.room = P.mesh(0.4); m.material.emissive.copy(WARM); this.g.add(m);
  }
  // a bow tie: two little triangles and a knot. ry: which way it faces (0: +z).
  _tie(P, x, y, z, c, ry) {
    const { SX, SZ, fy } = this.s, { M4 } = this.kit;
    for (const sd of [-1, 1]) { const g = new THREE.ConeGeometry(0.022, 0.04, 4); g.rotateZ(sd * Math.PI / 2); g.translate(sd * 0.02, 0, 0); P.add(g, c, M4(SX + x, fy + y, SZ + z, ry)); }
    P.add(new THREE.SphereGeometry(0.009, 5, 4), c, M4(SX + x, fy + y, SZ + z, ry));
  }
  _ob(x0, x1, z0, z1, y0, y1) { this.hill.O.push({ x0, x1, z0, z1, y0, y1 }); }

  // ============================================================ the walls, the floor, the ramp, the ceiling, for the toy
  _solid() {
    const { SX, SZ, fy, W, D, T, WH, DX, DW, DH } = this.s, k = this.k, L = this.hill.L, O = this.hill.O;
    const X0 = SX - W / 2 - 0.07, X1 = SX + W / 2 + 0.07, Z0 = SZ - D / 2 - 0.07, Z1 = SZ + D / 2 + 0.07, y0 = fy - 1, y1 = fy + WH;
    O.push({ x0: X0, x1: X1, z0: Z0, z1: SZ - D / 2 + T, y0, y1 });                                       // the back
    O.push({ x0: X0, x1: SX - W / 2 + T, z0: Z0, z1: Z1, y0, y1 });                                        // the west wall
    O.push({ x0: SX + W / 2 - T, x1: X1, z0: Z0, z1: Z1, y0, y1 });                                        // the east wall
    O.push({ x0: X0, x1: SX + DX - DW / 2, z0: SZ + D / 2 - T, z1: Z1, y0, y1 });                         // the front, either side of the door
    O.push({ x0: SX + DX + DW / 2, x1: X1, z0: SZ + D / 2 - T, z1: Z1, y0, y1 });
    O.push({ x0: SX + DX - DW / 2, x1: SX + DX + DW / 2, z0: SZ + D / 2 - T, z1: Z1, y0: fy + DH, y1 });   // over the door
    // the floor, out through the doorway to the sill; the ramp down from the sill to the snow
    this.floorS = { skin: 'plank', x0: this.ix0, x1: this.ix1, z0: this.iz0, z1: Z1, axis: null, h0: this.floor, h1: this.floor, thick: 0 };
    const rz0 = Z1, rz1 = Z1 + 1.25, low = L.heightAt(SX + DX, rz1);
    this.ramp = { skin: 'plank', x0: SX + DX - DW / 2, x1: SX + DX + DW / 2 + 0.12,      // (a little wider than the door, clear of the door's swing)
       z0: rz0, z1: rz1, axis: 'z', h0: this.floor, h1: low + 0.004, thick: 0 };
    k.plan.surfaces.push(this.floorS, this.ramp);
    // the ceiling: the underside of the pine boards, for the drone (headAt reads plan.slabs; it only counts a slab whose
    // top is well over the drone, so this one is taken up into the roof space: its underside is the boards')
    this.ceil = { skin: 'plank', x0: this.ix0, x1: this.ix1, z0: this.iz0, z1: this.iz1, axis: null, h0: fy + WH + 0.44, h1: fy + WH + 0.44, thick: 0.6 };
    if (k.plan.slabs) k.plan.slabs.push(this.ceil);
  }
  // The height of the ground a penguin walks on: the floor indoors, the ramp, else the snow.
  floorAt(x, z, hAt) {
    if (x > this.ix0 - 0.05 && x < this.ix1 + 0.05 && z > this.iz0 && z < this.floorS.z1) return this.floor;
    const r = this.ramp; if (x > r.x0 && x < r.x1 && z >= r.z0 && z < r.z1) return r.h0 + (r.h1 - r.h0) * (z - r.z0) / (r.z1 - r.z0);
    return hAt(x, z);
  }
  inside(p) { return p.x > this.ix0 && p.x < this.ix1 && p.z > this.iz0 && p.z < this.iz1 && p.y > this.floor - 0.3 && p.y < this.s.fy + this.s.WH; }
  // The door swings open for the toy as it comes up the ramp, and stays open while it is inside.
  wantsDoor(p) { const d = this.s.door; return this.inside(p) || (Math.abs(p.x - d.x) < 1.4 && p.z > d.z - 0.4 && p.z < d.z + 2.6 && Math.abs(p.y - this.floor) < 1.2); }

  // ============================================================ the portal
  _portal() {
    const a = this.at, cols = MOTIF_COLOURS.map(c => new THREE.Color(c));
    this.u = { uT: { value: 0 }, uOpen: { value: 1 }, uFlare: { value: 0 }, uFlick: { value: 1 }, uC0: { value: cols[0] }, uC1: { value: cols[1] }, uC2: { value: cols[2] }, uC3: { value: cols[3] }, uC4: { value: cols[4] } };
    const mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const disc = this.disc = new THREE.Mesh(new THREE.PlaneGeometry(2 * PR, 2 * PR), mat); disc.position.set(a.x, a.y, a.z); disc.renderOrder = 4; this.g.add(disc);
    // its light: on the wall behind it, on the floor in front, out of the window onto the snow
    const glow = canvasTex(128, 128, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
    const sheet = (w, h, flat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: glow, color: GREEN.clone(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, toneMapped: false })); if (flat) m.rotation.x = -Math.PI / 2; m.renderOrder = 3; this.g.add(m); return m; };
    this.wallGlow = sheet(2.6, 2.1); this.wallGlow.position.set(a.x, a.y + 0.15, this.iz0 + 0.012);
    this.floorGlow = sheet(2.4, 1.8, true); this.floorGlow.position.set(a.x + 0.1, this.floor + 0.013, a.z + 0.75);
    { const { SX, SZ, D, BX, BD } = this.s, x = SX + BX, z = SZ + D / 2 + BD + 1.1;
      this.snowGlow = sheet(2.4, 1.9, true); this.snowGlow.position.set(x, this.hill.L.heightAt(x, z) + 0.016, z); }
    this.sparks = this.k.puffs(90, { color: 0x9dffb0, size: 0.05 });
    this.hum = this.k.loop({ type: 'triangle', freq: hz(MOTIF[1].midi - 36), lp: 420 });      // a low G, the call's second note
    this.buzz = this.k.loop({ type: 'sine', freq: hz(MOTIF[0].midi - 12) });
  }
  // A penguin is due: the portal flares (and opens, if it was being shut), and in a moment out it comes.
  flare(k = 1) { this.fl = 1.4; if (this.phase !== 'open') { this.phase = 'reopen'; this.pt = 0; this.burst = true; } this.popAt = 0.35 * k; this._chirp(); }
  // A penguin going home: the portal takes it back with a gulp.
  gulp(p) { this.fl = Math.max(this.fl, 0.9); this.sparks.emit(p.x, p.y + 0.3, p.z, 16, { spread: 0.25, up: 0.3, life: 0.8, out: 0.4 }); this.k.synth.note(520, 0.12, { type: 'sine', vol: 0.025 }); this.k.synth.note(260, 0.18, { type: 'sine', vol: 0.025, at: 0.08 }); }
  _chirp() { const k = this.k; [0, 1, 2].forEach((i, n) => k.synth.note(hz(MOTIF[i].midi + 12), 0.22, { type: 'sine', vol: 0.02, at: n * 0.09 })); k.synth.noise(0.4, { vol: 0.02, lp: 2400 }); }

  // ============================================================ the note
  _note() {
    const { SX, SZ, fy, D, T } = this.s;
    const cv = noteCanvas(), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const w = 0.2, h = w * cv.height / cv.width;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.95, 0.93, 0.88) }));
    m.position.set(SX + 0.5, fy + FLY + 0.5, SZ - D / 2 + T + 0.012); m.rotation.z = 0.05; m.matrixAutoUpdate = false; m.updateMatrix(); this.g.add(m);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0xd8302a })); pin.position.set(SX + 0.5, fy + FLY + 0.5 + h / 2 - 0.02, SZ - D / 2 + T + 0.02); this.g.add(pin);
    const el = this.cardEl = document.createElement('div'); el.id = 'portalCard';
    el.style.cssText = 'position:fixed;left:50%;top:44%;transform:translate(-50%,-50%) rotate(1.2deg);width:min(72vmin,350px);pointer-events:none;opacity:0;transition:opacity .25s;z-index:30;filter:drop-shadow(0 10px 24px rgba(0,0,0,.55))';
    cv.style.cssText = 'width:100%;height:auto;display:block'; el.appendChild(cv); document.body.appendChild(el);
  }
  _showNote(on) { this.cardEl.style.opacity = on ? '1' : '0'; this.showing = on; this.cardAt = on ? { x: this.k.pos.x, z: this.k.pos.z, t: this.t } : null; }
  _read() {
    if (this.showing) { this._showNote(false); return; }
    this._showNote(true);
    const S = this.story || this.k.G.story;
    if (S && S.add('portal')) this.k.say('G. for groundskeeper. He has been shutting that thing for a while.', 0.8, 6);
  }

  // ============================================================ into the portal
  _jump() {
    if (this.jump) return;
    const k = this.k; this.jump = { t: 0, placed: false }; this.fl = 1.6;
    if (!this.swirl) {
      const el = this.swirl = document.createElement('div'); el.id = 'portalSwirl';
      el.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;z-index:25;transition:opacity .2s;background:radial-gradient(circle at 50% 50%, rgba(220,255,230,.95) 0, rgba(80,240,130,.85) 22%, rgba(10,60,30,.92) 60%, rgba(2,12,6,.97) 100%)';
      const s = document.createElement('div'); s.style.cssText = 'position:absolute;left:50%;top:50%;width:180vmax;height:180vmax;margin:-90vmax 0 0 -90vmax;border-radius:50%;background:repeating-conic-gradient(from 0deg, rgba(160,255,190,.0) 0deg 14deg, rgba(160,255,190,.28) 14deg 22deg);animation:portalSpin 1.1s linear infinite';
      const css = document.createElement('style'); css.textContent = '@keyframes portalSpin { to { transform: rotate(360deg); } }'; document.head.append(css);
      el.appendChild(s); document.body.appendChild(el);
    }
    this.swirl.style.opacity = '1';
    for (let i = 0; i < 8; i++) k.synth.note(180 * Math.pow(1.25, i), 0.16, { type: 'sine', vol: 0.03, at: i * 0.05 });
    k.synth.noise(0.6, { vol: 0.03, lp: 1600 });
  }
  _jumpStep(dt) {
    const J = this.jump, k = this.k, v = k.v, h = this.hill; J.t += dt;
    if (!J.placed && J.t > 0.45) {
      J.placed = true;
      // out at the bottom of the run, just past the finish line, looking back up the hill at the shop
      const L = h.L, r = L.run[Math.min(L.run.length - 1, Math.round((FINISH_S + 4) / 0.25))], x = r.x, z = r.z, y = L.heightAt(x, z), yaw = Math.atan2(-r.tx, -r.tz);
      if (v.kind === 'drone') v.place(x, z, yaw, y + 0.6); else v.place(x, z, yaw, y + 0.02);
      h.puffs.emit(x, y + 0.2, z, 24, { spread: 0.3, up: 0.9, life: 1.1, out: 0.8, color: 0x9dffb0 });
      k.synth.note(880, 0.1, { type: 'square', vol: 0.014 }); k.synth.noise(0.2, { vol: 0.04, lp: 1200 });
      if (!this.jumped) { this.jumped = true; k.say('Spat out at the bottom of the hill. So that is how it feels to be a penguin.', 0.5, 5); }
    }
    if (J.t > 0.95 && this.swirl.style.opacity !== '0') this.swirl.style.opacity = '0';      // (once the camera has caught up)
    if (J.t > 1.3) this.jump = null;
  }

  // ============================================================ the hooks (from sledhill.js)
  near(v, k) {
    const p = k.pos; if (Math.abs(p.y - this.floor) > 1.6) return null;
    const dn = Math.hypot(p.x - this.noteAt.x, p.z - this.noteAt.z), dm = Math.hypot(p.x - this.mouth.x, p.z - this.mouth.z);
    if (dn < 0.6 && dn <= dm) { const S = this.story || k.G.story; return { verb: 'READ', hint: S && S.has('portal') ? null : 'A note pinned by the portal. E to read it.', act: () => this._read() }; }
    if (dm < 0.55 && this.phase === 'open' && !this.jump) return { verb: 'GO IN', hint: 'A hole in the air, humming. E to go in.', act: () => this._jump() };
    return null;
  }
  update(dt, k) {
    const p = k.pos, d = Math.hypot(p.x - this.at.x, p.z - this.at.z), far = d > NEAR || Math.abs(p.y - this.floor) > 25;
    if (this.jump) this._jumpStep(dt);
    if (far) { if (!this.idle) { this.idle = true; this.g.visible = false; this.hum.set(0); this.buzz.set(0); if (this.showing) this._showNote(false); } return; }
    if (this.idle) { this.idle = false; this.g.visible = true; }
    const t = this.t += dt;
    // forced shut now and then, and open again a moment later (it keeps opening)
    this.pt += dt;
    if (this.phase === 'open') { this.open += (1 - this.open) * Math.min(1, dt * 4); this.flick = 1; if (this.pt > this.nextShut && this.fl < 0.05 && !this.jump) { this.phase = 'closing'; this.pt = 0; k.synth.noise(1.1, { vol: 0.02, lp: 700 }); for (let i = 0; i < 5; i++) k.synth.note(hz(MOTIF[4 - i].midi), 0.2, { type: 'sine', vol: 0.014, at: i * 0.2 }); } }
    else if (this.phase === 'closing') { const f = Math.min(1, this.pt / 1.3); this.open = 1 - 0.9 * ease(f); this.flick = 0.55 + 0.45 * Math.abs(Math.sin(t * 31 + Math.sin(t * 7) * 3)); if (f >= 1) { this.phase = 'shut'; this.pt = 0; } }
    else if (this.phase === 'shut') { this.open = 0.1 + 0.03 * Math.sin(t * 40); this.flick = 0.4 + 0.6 * (Math.sin(t * 23) > 0.2 ? 1 : 0.3); if (this.pt > 1.5) { this.phase = 'reopen'; this.pt = 0; this.burst = true; } }
    else if (this.phase === 'reopen') {
      if (this.burst) { this.burst = false; k.synth.noise(0.25, { vol: 0.04, lp: 2600 }); k.synth.note(hz(MOTIF[0].midi + 12), 0.3, { type: 'sine', vol: 0.02 }); this.sparks.emit(this.at.x, this.at.y, this.at.z + 0.05, 26, { spread: PR * 0.9, up: 0.2, life: 1.0, out: 0.7 }); }
      const f = Math.min(1, this.pt / 0.5); this.open = 0.1 + 0.9 * back(f); this.flick = 1; if (f >= 1) { this.phase = 'open'; this.pt = 0; this.nextShut = 18 + Math.random() * 16; }
    }
    this.fl = Math.max(0, this.fl - dt * 1.2);
    // a penguin due: out it comes, with a puff of sparkles
    if (this.popAt != null && (this.popAt -= dt) <= 0) { this.popAt = null; const s = this.spawn; this.sparks.emit(s.x, this.floor + 0.3, s.z, 22, { spread: 0.2, up: 0.5, life: 0.9, out: 0.6 }); k.synth.note(1046, 0.06, { type: 'square', vol: 0.012 }); k.synth.note(1318, 0.08, { type: 'square', vol: 0.012, at: 0.06 }); }
    // the look of it
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.3), glow = this.open * this.flick * (0.75 + 0.25 * pulse + this.fl * 0.8);
    this.u.uT.value = t; this.u.uOpen.value = this.open; this.u.uFlare.value = this.fl; this.u.uFlick.value = this.flick;
    this.disc.rotation.z = Math.sin(t * 0.4) * 0.05;
    this.wallGlow.material.opacity = Math.min(1, 0.38 * glow); this.floorGlow.material.opacity = Math.min(1, 0.36 * glow); this.snowGlow.material.opacity = Math.min(1, 0.22 * glow);
    this.room.material.emissive.copy(WARM).lerp(GREEN, Math.min(0.4, 0.05 + 0.1 * glow * glow));
    if (d < 14 && (this.sparkT = (this.sparkT || 0) - dt) < 0) {
      this.sparkT = 0.09 / Math.max(0.2, this.open);
      const a = Math.random() * Math.PI * 2, r = PR * this.open * (0.75 + Math.random() * 0.25);
      this.sparks.emit(this.at.x + Math.cos(a) * r, this.at.y + Math.sin(a) * r, this.at.z + 0.04, 1, { spread: 0.02, up: 0.12, life: 0.9, out: 0.15, color: MOTIF_COLOURS[(Math.random() * 5) | 0] });
    }
    this.sparks.update(dt);
    // the hum: inside, and at the door
    const ins = this.inside(p);
    this.hum.set(d < 9 ? (ins ? 0.035 : 0.014) * (1 - d / 9) * this.open : 0); this.buzz.set(d < 6 ? 0.008 * (1 - d / 6) * this.open * (0.6 + 0.4 * pulse) : 0);
    // indoors: no snow falls, and the camera keeps inside the room (as in the warming hut)
    if (ins) { k.museum.playerIndoors = true; this._indoors = true; }
    else if (this._indoors) { this._indoors = false; if (!k.G.roomId) k.museum.playerIndoors = false; }
    if (ins && k.G.view !== 'fpv' && !this.jump) {
      const v = k.v, drone = v.kind === 'drone', yaw = k.G.camYaw, dist = drone ? 1.35 : 1.25, up = drone ? 0.34 : 0.46, m = 0.16;
      const ax = p.x - Math.sin(yaw) * dist, az = p.z - Math.cos(yaw) * dist, cx = Math.max(this.ix0 + m, Math.min(this.ix1 - m, ax)), cz = Math.max(this.iz0 + m, Math.min(this.iz1 - m, az)), over = Math.hypot(ax - cx, az - cz);
      const ay = p.y + up + over * 0.45, lim = this.ceil.h0 - this.ceil.thick - 0.2;
      if (over > 0.001 || ay > lim) k.camClose = { at: { x: cx, y: Math.max(this.floor + 0.15, Math.min(ay, lim)), z: cz }, look: { x: p.x + Math.sin(v.yaw) * 2.2, y: p.y + (drone ? 0 : 0.36) - over * 0.15, z: p.z + Math.cos(v.yaw) * 2.2 } };
    }
    if (this.cardAt && (Math.hypot(p.x - this.cardAt.x, p.z - this.cardAt.z) > 1.2 || t - this.cardAt.t > 16)) this._showNote(false);
    if (ins) k.once('tux-portal', 'Behind the tuxedos, a hole in the air. Green, turning, humming.', 5);
  }
  reset() { if (this.cardEl) this._showNote(false); this.jump = null; if (this.swirl) this.swirl.style.opacity = '0'; this.phase = 'open'; this.open = 1; this.pt = 0; }
  spots() { return [{ kind: 'todo', id: 'tux-note', name: 'The groundskeeper’s note (the portal)', ...this.noteAt }]; }
}
