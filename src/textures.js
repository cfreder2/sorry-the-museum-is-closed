// Every surface in the building is painted here on a canvas at start-up.
// Nothing is downloaded but the art.

import * as THREE from 'three';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function tex(c, { repeat = false, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

// Seeded, so the building is the same every night.
export function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Brightest at picture height, falling away into the dark near the ceiling.
export function wallGlow() {
  const [c, g] = canvas(4, 256);
  const grad = g.createLinearGradient(0, 256, 0, 0);
  grad.addColorStop(0, '#6a6a6a');
  grad.addColorStop(0.2, '#ffffff');
  grad.addColorStop(0.42, '#b0b0b0');
  grad.addColorStop(0.75, '#3a3a3a');
  grad.addColorStop(1, '#161616');
  g.fillStyle = grad; g.fillRect(0, 0, 4, 256);
  return tex(c, { srgb: false });
}

export function wood() {
  const [c, g] = canvas(1024, 1024);
  const r = rng(7);
  g.fillStyle = '#3d2716'; g.fillRect(0, 0, 1024, 1024);
  const rows = 16, ph = 1024 / rows;
  for (let j = 0; j < rows; j++) {
    let x = -r() * 300;
    while (x < 1024) {
      const len = 260 + r() * 260;
      const l = 22 + r() * 13, a = 20 + r() * 8;
      g.fillStyle = `hsl(${a}, ${42 + r() * 14}%, ${l}%)`;
      g.fillRect(x + 1, j * ph + 1, len - 2, ph - 2);
      g.globalAlpha = 0.10;
      for (let k = 0; k < 14; k++) {
        g.fillStyle = r() > 0.5 ? '#000' : '#c9905a';
        g.fillRect(x + 2, j * ph + 2 + r() * (ph - 4), len - 4, 1 + r() * 1.5);
      }
      g.globalAlpha = 1;
      x += len;
    }
  }
  return tex(c, { repeat: true });
}

// Pale stone with small dark squares where four tiles meet: the floor of
// every old public building you were ever walked through in a line.
export function marble() {
  const [c, g] = canvas(1024, 1024);
  const r = rng(11);
  const n = 2, s = 1024 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const l = 66 + r() * 8;
    g.fillStyle = `hsl(${38 + r() * 8}, ${10 + r() * 6}%, ${l}%)`;
    g.fillRect(i * s, j * s, s, s);
  }
  g.globalAlpha = 0.18;
  for (let k = 0; k < 60; k++) {
    g.strokeStyle = r() > 0.4 ? '#58524a' : '#f6f0e4';
    g.lineWidth = 0.6 + r() * 2.2;
    g.beginPath();
    let x = r() * 1024, y = r() * 1024;
    g.moveTo(x, y);
    for (let q = 0; q < 6; q++) { x += (r() - 0.5) * 260; y += (r() - 0.3) * 200; g.lineTo(x, y); }
    g.stroke();
  }
  g.globalAlpha = 1;
  g.strokeStyle = '#3e3a35'; g.lineWidth = 3;
  for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 1024); g.moveTo(0, i * s); g.lineTo(1024, i * s); g.stroke(); }
  g.fillStyle = '#1d2420';
  const d = 62;
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
    g.save(); g.translate(i * s, j * s); g.rotate(Math.PI / 4); g.fillRect(-d / 2, -d / 2, d, d); g.restore();
  }
  return tex(c, { repeat: true });
}

export function slate() {
  const [c, g] = canvas(512, 512);
  const r = rng(5);
  g.fillStyle = '#17181c'; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 2600; k++) {
    g.fillStyle = `rgba(${r() > 0.5 ? '120,125,140' : '0,0,0'},${0.05 + r() * 0.08})`;
    g.fillRect(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 3);
  }
  g.strokeStyle = '#0b0b0d'; g.lineWidth = 3;
  g.strokeRect(0, 0, 512, 512); g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 512); g.stroke();
  return tex(c, { repeat: true });
}

// One pane of the hall's glass vault, steel ribs round the edge, night behind.
export function vaultGlass() {
  const [c, g] = canvas(256, 256);
  const r = rng(3);
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#1b2b4d'); grad.addColorStop(1, '#22365e');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 500; k++) {
    g.fillStyle = `rgba(200,220,255,${r() * 0.07})`;
    g.fillRect(r() * 256, r() * 256, 1 + r() * 9, 1 + r() * 2);
  }
  g.strokeStyle = '#05070c'; g.lineWidth = 16; g.strokeRect(0, 0, 256, 256);
  g.strokeStyle = '#0c1220'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.stroke();
  return tex(c, { repeat: true });
}

export function laylight() {
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#93a8cf'; g.fillRect(0, 0, 512, 512);
  const grad = g.createRadialGradient(256, 256, 30, 256, 256, 360);
  grad.addColorStop(0, 'rgba(255,255,255,0.35)'); grad.addColorStop(1, 'rgba(0,0,20,0.45)');
  g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = '#0a0c12'; g.lineWidth = 7;
  for (let i = 0; i <= 5; i++) { const p = i * 512 / 5; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 512); g.moveTo(0, p); g.lineTo(512, p); g.stroke(); }
  return tex(c);
}

export function radial(inner = 0, power = 1) {
  const [c, g] = canvas(128, 128);
  const grad = g.createRadialGradient(64, 64, inner * 64, 64, 64, 64);
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, v = Math.round(255 * Math.pow(1 - t, power * 1.8));
    grad.addColorStop(t, `rgb(${v},${v},${v})`);
  }
  g.fillStyle = '#000'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return tex(c, { srgb: false });
}

// The wash a picture lamp throws down a wall: hottest just under the lamp.
export function lampWash() {
  const [c, g] = canvas(128, 256);
  g.fillStyle = '#000'; g.fillRect(0, 0, 128, 256);
  const grad = g.createRadialGradient(64, 26, 2, 64, 90, 150);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.25, '#9a9a9a'); grad.addColorStop(0.6, '#2e2e2e'); grad.addColorStop(1, '#000000');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 256);
  // Feather the sides so instances never show an edge.
  const side = g.createLinearGradient(0, 0, 128, 0);
  side.addColorStop(0, '#000'); side.addColorStop(0.22, 'rgba(0,0,0,0)'); side.addColorStop(0.78, 'rgba(0,0,0,0)'); side.addColorStop(1, '#000');
  g.fillStyle = side; g.fillRect(0, 0, 128, 256);
  return tex(c, { srgb: false });
}

// A shaft of moonlight seen from the side.
export function shaft() {
  const [c, g] = canvas(64, 256);
  g.fillStyle = '#000'; g.fillRect(0, 0, 64, 256);
  const v = g.createLinearGradient(0, 0, 0, 256);
  v.addColorStop(0, '#8f8f8f'); v.addColorStop(0.7, '#3c3c3c'); v.addColorStop(1, '#101010');
  g.fillStyle = v; g.fillRect(0, 0, 64, 256);
  const h = g.createLinearGradient(0, 0, 64, 0);
  h.addColorStop(0, '#000'); h.addColorStop(0.3, 'rgba(0,0,0,0)'); h.addColorStop(0.7, 'rgba(0,0,0,0)'); h.addColorStop(1, '#000');
  g.fillStyle = h; g.fillRect(0, 0, 64, 256);
  return tex(c, { srgb: false });
}

// Where the shaft lands: a soft rectangle crossed by the shadows of the ribs.
export function moonPatch() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
  const grad = g.createRadialGradient(128, 128, 20, 128, 128, 128);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.6, '#8a8a8a'); grad.addColorStop(1, '#000');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(0,0,0,0.75)'; g.lineWidth = 9;
  for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); }
  return tex(c, { srgb: false });
}

// The city beyond the east window. Nobody's skyline in particular.
export function skyline(moon = true) {
  const [c, g] = canvas(2048, 1024);
  const r = rng(1893);
  const sky = g.createLinearGradient(0, 0, 0, 1024);
  sky.addColorStop(0, '#04060f'); sky.addColorStop(0.55, '#0e1a36'); sky.addColorStop(0.8, '#2a3558'); sky.addColorStop(1, '#4a4a66');
  g.fillStyle = sky; g.fillRect(0, 0, 2048, 1024);
  for (let k = 0; k < 420; k++) {
    g.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.7})`;
    const s = r() < 0.06 ? 2.4 : 1.2;
    g.fillRect(r() * 2048, r() * 640, s, s);
  }
  // Moon, with the halo it gets on a cold night.
  const mx = 1240, my = 250;
  if (moon) {
  const halo = g.createRadialGradient(mx, my, 20, mx, my, 330);
  halo.addColorStop(0, 'rgba(210,225,255,0.55)'); halo.addColorStop(0.25, 'rgba(150,175,235,0.16)'); halo.addColorStop(1, 'rgba(120,150,220,0)');
  g.fillStyle = halo; g.fillRect(mx - 340, my - 340, 680, 680);
  g.fillStyle = '#f4f6ff'; g.beginPath(); g.arc(mx, my, 44, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(170,180,210,0.5)';
  for (const [dx, dy, s] of [[-12, -8, 11], [14, 6, 8], [-3, 18, 6], [16, -18, 5]]) { g.beginPath(); g.arc(mx + dx, my + dy, s, 0, Math.PI * 2); g.fill(); }
  }
  // Two ranks of buildings.
  for (const [base, dark, lit] of [[0.52, '#101728', 0.22], [0.36, '#070b14', 0.34]]) {
    let x = -20;
    while (x < 2048) {
      const w = 46 + r() * 110;
      const h = 1024 * (base * (0.45 + r() * 0.75));
      const top = 1024 - h;
      g.fillStyle = dark; g.fillRect(x, top, w, h);
      if (r() < 0.3) g.fillRect(x + w * 0.3, top - 26 - r() * 40, w * 0.4, 70);
      if (r() < 0.16) { g.fillRect(x + w / 2 - 2, top - 90, 4, 90); g.fillStyle = '#ff5040'; g.fillRect(x + w / 2 - 3, top - 94, 6, 6); }
      const cw = 6, ch = 9, gx = 12, gy = 17;
      for (let wy = top + 12; wy < 1010; wy += gy) for (let wx = x + 6; wx < x + w - cw - 3; wx += gx) {
        if (r() < lit) {
          g.fillStyle = r() < 0.8 ? `rgba(255,${190 + r() * 40},${110 + r() * 60},${0.5 + r() * 0.5})` : 'rgba(190,220,255,0.8)';
          g.fillRect(wx, wy, cw, ch);
        }
      }
      x += w + r() * 10;
    }
  }
  const haze = g.createLinearGradient(0, 700, 0, 1024);
  haze.addColorStop(0, 'rgba(60,70,110,0)'); haze.addColorStop(1, 'rgba(90,96,140,0.5)');
  g.fillStyle = haze; g.fillRect(0, 700, 2048, 324);
  return tex(c);
}

// Lettering cut over a doorway.
export function sign(title, sub) {
  const [c, g] = canvas(512, 96);
  g.scale(0.5, 0.5);
  g.clearRect(0, 0, 1024, 192);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#e9d7a8';
  g.font = '600 74px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
  const spaced = title.toUpperCase().split('').join('  ');
  g.fillText(spaced, 512, sub ? 66 : 96);
  if (sub) {
    g.font = 'italic 44px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
    g.fillStyle = '#c9b88c';
    g.fillText(sub, 512, 146);
  }
  const t = tex(c);
  return t;
}

export function caution() {
  const [c, g] = canvas(256, 384);
  g.fillStyle = '#f2c21a'; g.fillRect(0, 0, 256, 384);
  g.fillStyle = '#111'; g.textAlign = 'center';
  g.font = '900 44px Helvetica, Arial, sans-serif'; g.fillText('CAUTION', 128, 70);
  g.beginPath(); g.moveTo(128, 100); g.lineTo(206, 236); g.lineTo(50, 236); g.closePath(); g.fill();
  g.fillStyle = '#f2c21a'; g.font = '900 100px Helvetica, Arial, sans-serif'; g.fillText('!', 128, 222);
  g.fillStyle = '#111'; g.font = '900 38px Helvetica, Arial, sans-serif'; g.fillText('WET', 128, 292); g.fillText('FLOOR', 128, 336);
  return tex(c);
}

export function flat(r, g, b) {
  const d = new Uint8Array([r, g, b, 255]);
  const t = new THREE.DataTexture(d, 1, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------- the stunt kit ---

export function plywood() {
  const [c, g] = canvas(512, 512);
  const r = rng(77);
  g.fillStyle = '#c9a36a'; g.fillRect(0, 0, 512, 512);
  g.globalAlpha = 0.16;
  for (let k = 0; k < 150; k++) {
    g.strokeStyle = r() > 0.5 ? '#7a5426' : '#f1d6a2'; g.lineWidth = 0.6 + r() * 2;
    const y = r() * 512; g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= 512; x += 64) g.lineTo(x, y + Math.sin(x * 0.02 + k) * 6 + (r() - 0.5) * 4);
    g.stroke();
  }
  g.globalAlpha = 0.5; g.fillStyle = '#6b4520';
  for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(r() * 512, r() * 512, 5 + r() * 7, 3 + r() * 4, r() * 3, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  g.strokeStyle = '#5d3d1a'; g.lineWidth = 4; g.strokeRect(2, 2, 508, 508);
  g.fillStyle = '#3b2a17';
  for (const [x, y] of [[26, 26], [486, 26], [26, 486], [486, 486], [256, 26], [256, 486]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
  return tex(c, { repeat: true });
}

// Arrows of light that run up a ramp. Drawn white on black, used additively.
export function chevrons() {
  const [c, g] = canvas(128, 128);
  g.fillStyle = '#000'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#fff'; g.lineWidth = 13; g.lineJoin = 'miter';
  for (const y of [84, 148]) { g.beginPath(); g.moveTo(22, y); g.lineTo(64, y - 44); g.lineTo(106, y); g.stroke(); }
  g.beginPath(); g.moveTo(22, 20); g.lineTo(64, -24); g.lineTo(106, 20); g.stroke();
  return tex(c, { repeat: true, srgb: false });
}

// Toy-car track, the orange kind, scaled up to fit.
export function track() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#e8641a'; g.fillRect(0, 0, 256, 256);
  const sh = g.createLinearGradient(0, 0, 256, 0);
  sh.addColorStop(0, 'rgba(60,15,0,.55)'); sh.addColorStop(0.1, 'rgba(255,190,120,.35)'); sh.addColorStop(0.18, 'rgba(0,0,0,0)');
  sh.addColorStop(0.82, 'rgba(0,0,0,0)'); sh.addColorStop(0.9, 'rgba(255,190,120,.35)'); sh.addColorStop(1, 'rgba(60,15,0,.55)');
  g.fillStyle = sh; g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(90,30,0,.5)'; g.fillRect(0, 252, 256, 4);       // the joint between sections
  return tex(c, { repeat: true });
}

export function crate() {
  const [c, g] = canvas(512, 512);
  const r = rng(31);
  g.fillStyle = '#b08a55'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6; i++) {
    g.fillStyle = `hsl(34, ${32 + r() * 10}%, ${46 + r() * 9}%)`; g.fillRect(0, i * 85.4 + 1, 512, 83);
    g.fillStyle = 'rgba(50,30,10,.5)'; g.fillRect(0, i * 85.4, 512, 2);
  }
  g.fillStyle = '#8a6a3c';
  g.fillRect(0, 0, 44, 512); g.fillRect(468, 0, 44, 512); g.fillRect(0, 0, 512, 44); g.fillRect(0, 468, 512, 44);
  g.fillStyle = 'rgba(30,20,10,.82)'; g.textAlign = 'center';
  g.font = '900 54px "Courier New", Courier, monospace'; g.fillText('FRAGILE', 256, 210);
  g.font = '700 30px "Courier New", Courier, monospace'; g.fillText('WORKS OF ART', 256, 256);
  g.beginPath(); g.moveTo(256, 300); g.lineTo(300, 356); g.lineTo(274, 356); g.lineTo(274, 420); g.lineTo(238, 420); g.lineTo(238, 356); g.lineTo(212, 356); g.closePath(); g.fill();
  return tex(c, { repeat: true });
}

// ------------------------------------------------------------- outdoors ---

// Limestone in courses, for the outside of the building.
export function ashlar() {
  const [c, g] = canvas(512, 512);
  const r = rng(19);
  g.fillStyle = '#b9b2a2'; g.fillRect(0, 0, 512, 512);
  for (let j = 0; j < 8; j++) {
    const off = j % 2 ? 64 : 0;
    for (let i = -1; i < 4; i++) {
      const l = 64 + r() * 9;
      g.fillStyle = `hsl(${40 + r() * 8}, ${9 + r() * 5}%, ${l}%)`;
      g.fillRect(i * 128 + off + 2, j * 64 + 2, 124, 60);
    }
    g.fillStyle = 'rgba(40,36,30,.55)'; g.fillRect(0, j * 64, 512, 2);
  }
  for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,250,240' : '30,26,20'},${r() * 0.07})`; g.fillRect(r() * 512, r() * 512, 1 + r() * 4, 1 + r() * 3); }
  return tex(c, { repeat: true });
}

// Trodden snow under street lamps.
export function snow() {
  const [c, g] = canvas(512, 512);
  const r = rng(101);
  g.fillStyle = '#dfe6f1'; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 2600; k++) {
    g.fillStyle = r() > 0.5 ? `rgba(255,255,255,${r() * 0.5})` : `rgba(120,140,180,${r() * 0.16})`;
    const s = 1 + r() * 5; g.beginPath(); g.ellipse(r() * 512, r() * 512, s * 2, s, r() * 3, 0, 7); g.fill();
  }
  return tex(c, { repeat: true });
}

// The sign on the front door.
export function closedSign() {
  const [c, g] = canvas(768, 384);
  g.fillStyle = '#efe6cf'; g.fillRect(0, 0, 768, 384);
  g.strokeStyle = '#1f3a2e'; g.lineWidth = 14; g.strokeRect(16, 16, 736, 352);
  g.lineWidth = 3; g.strokeRect(34, 34, 700, 316);
  g.fillStyle = '#1f3a2e'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'italic 62px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
  g.fillText('Sorry,', 384, 104);
  g.font = '600 76px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
  g.fillText('THE MUSEUM', 384, 192);
  g.fillText('IS CLOSED', 384, 280);
  for (const x of [70, 698]) { g.beginPath(); g.arc(x, 64, 9, 0, 7); g.fill(); }
  return tex(c);
}

// The race track, painted on the floor: a line down each edge and arrows up the middle.
// White on black, laid on additively, so it shows on wood and marble alike.
export function raceLine() {
  const [c, g] = canvas(128, 256);
  g.fillStyle = '#000'; g.fillRect(0, 0, 128, 256);
  g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(8, 0, 112, 256);            // a faint wash between the lines
  g.fillStyle = '#fff'; g.fillRect(4, 0, 9, 256); g.fillRect(115, 0, 9, 256);
  g.strokeStyle = '#fff'; g.lineWidth = 9; g.lineJoin = 'miter';
  g.beginPath(); g.moveTo(40, 150); g.lineTo(64, 106); g.lineTo(88, 150); g.stroke();
  return tex(c, { repeat: true, srgb: false });
}
