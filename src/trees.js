// Everything that grows in the grounds, in winter: the trees, each of its own kind and no two alike, and the shrubs,
// grasses, seed heads and ivy under them (groundsplan.js says where each stands and what it is).
//
// Seven kinds of tree, each with the habit that tells it from the others across a park at night:
//   American elm     a tall vase: a clean trunk, a few great limbs that go up steeply, arch out and droop at their tips
//   honey locust     open and angular: few limbs, crooked, with last year's long pods still hanging in the twigs
//   littleleaf linden  a dense oval on a single leader, the limbs low and many, their ends turning up
//   ginkgo           gaunt: one straight leader, a few stiff limbs, every twig knobbed with short spurs
//   cockspur hawthorn  low and wide, the limbs nearly level, thorny, a few dark red haws left on
//   crabapple        a small round twiggy head, with red fruit the birds have not finished
//   river birch      two or three slender pale stems from one foot, leaning apart, their fine twigs hanging
// Every tree is grown from its own seed (a trunk, limbs in two orders, then sprays of twigs on cut-out cards), leans its
// own way, is lopsided its own way and carries its own load of snow: lying along the upper side of every limb and
// packed in the forks (worked out in the shader from which way the bark faces, so it costs nothing), plastered on the
// windward side of the trunk, and as frost on the twigs, heavy on one tree and light on the next. Bark is a picture
// per kind: furrowed, smooth, scaled, or the birch's peeling white.
//
// Shrubs are cut-out cards, three crossed to a clump, snow heaped at their feet (red-twig dogwood, viburnum, privet, roses with their hips,
// tall grasses left standing gold, the seed heads of perennials, dried hydrangea), or a smooth evergreen body with a
// fringe of sprays (yew, arborvitae). Ivy holds the foot of the building's walls. Street trees stand in iron guards.
//
// Cost: one picture and one material for all of it. The ground is cut into 128 m squares (fifteen or so with anything
// in them); each square is one mesh seen from near (about 500 triangles to a big tree) and a lighter one from beyond
// 130 m (about 150), so what is out of sight is not drawn and what is far is cheap: in every view measured it is
// fewer triangles than the one tree drawn 234 times that it replaces. Nothing here moves or is worked out after start-up.

import * as THREE from 'three';
import { streetY } from './plan.js';
import { SPECIES } from './groundsplan.js';
import { WIND } from './land.js';

const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const TAU = Math.PI * 2, AW = 2048, AH = 1536, CW = 256, CHT = 512, CHUNK = 128, FAR = 130;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

// ------------------------------------------------------------------ the picture
// Three rows of eight cards, each 256 x 512 with its foot at the bottom. Row 0: a spray of twigs for each tree, and
// one of clinging leaves. Row 1: four barks, snow, evergreen foliage, a tree guard, ivy. Row 2: the shrubs.
const TWIG = { elm: 0, locust: 1, linden: 2, ginkgo: 3, hawthorn: 4, crab: 5, birch: 6, leaves: 7 };
const BARK = { furrow: 0, smooth: 1, birch: 2, scaly: 3 }, SNOW = 4, FOLIAGE = 5, GUARD = 6, IVY = 7;
const SHRUB = { dogwood: 0, viburnum: 1, privet: 1, rose: 2, grass: 3, seed: 4, hydrangea: 5, yew: 6, cover: 7 };
function atlas() {
  const cv = document.createElement('canvas'); cv.width = AW; cv.height = AH; const c = cv.getContext('2d'); c.lineCap = 'round'; c.lineJoin = 'round';
  const cell = (row, col, fn) => { c.save(); c.beginPath(); c.rect(col * CW, row * CHT, CW, CHT); c.clip(); c.translate(col * CW, row * CHT); fn(rng(row * 97 + col * 13 + 5)); c.restore(); };
  const line = (x0, y0, x1, y1, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
  const dot = (x, y, rx, ry, col, rot = 0) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, 7); c.fill(); };
  const SN = a => `rgba(240,245,255,${a})`;
  // A spray: stems from the foot, each walked in short lengths that wander a little, with side twigs leaving it turn and
  // turn about along its length, finer and shorter, and theirs in turn (`depth` orders). a is the angle from straight up.
  // Each length may carry a line of snow on its upper side. node(x, y, a, r, w) is called at every joint, tip(x, y, a, r)
  // at the end of every twig of the last order.
  const spray = (r, o) => {
    const grow = (x, y, a, len, w, d) => {
      const steps = o.steps || 4, sl = len / steps; let px = x, py = y, aa = a, side = r() < 0.5 ? 1 : -1;
      for (let i = 0; i < steps; i++) {
        aa += (r() - 0.5) * (o.wob ?? 0.16) + (o.kink ? (i % 2 ? 1 : -1) * o.kink * (0.4 + r() * 0.6) : 0) + (o.droop || 0) * (i / steps) * Math.sign(Math.sin(aa) || 1) * 0.5 - aa * (o.lift || 0) * 0.3;
        const nx = px + Math.sin(aa) * sl, ny = py - Math.cos(aa) * sl, ww = Math.max(1, w * (1 - 0.5 * i / steps));
        line(px, py, nx, ny, ww, o.col(r));
        if (o.snow && r() < o.snow) line(px, py - ww * 0.5 - 0.5, nx, ny - ww * 0.5 - 0.5, Math.max(1.3, ww * 0.7), SN(1));
        if (o.node) o.node(nx, ny, aa, r, ww);
        px = nx; py = ny;
        if (d > 0 && i > 0 && r() < (o.bush ?? 0.75)) { grow(px, py, aa + side * o.spread * (0.6 + 0.6 * r()), len * (0.42 + 0.3 * r()) * (1 - 0.25 * i / steps), Math.max(1, w * 0.6), d - 1); side = -side; }
      }
      if (d <= 0 && o.tip) o.tip(px, py, aa, r);
    };
    for (let i = 0; i < o.stems; i++) grow(128 + (r() - 0.5) * (o.foot || 14), 510, (i - (o.stems - 1) / 2) * o.fan + (r() - 0.5) * 0.12, o.len * (0.85 + 0.3 * r()), o.w, o.depth);
  };
  const wood = (a, b, d) => r => { const v = 0.8 + r() * 0.4; return `rgb(${a * v | 0},${b * v | 0},${d * v | 0})`; };
  cell(0, TWIG.elm, r => spray(r, { stems: 5, fan: 0.2, len: 330, w: 4.5, depth: 3, spread: 0.55, droop: 0.35, wob: 0.2, bush: 0.85, col: wood(40, 34, 30), snow: 0.9 }));
  cell(0, TWIG.locust, r => spray(r, { stems: 3, fan: 0.4, len: 300, w: 5.5, depth: 2, spread: 0.9, kink: 0.32, bush: 0.7, col: wood(36, 30, 28), snow: 0.9,
    tip: (x, y, a, q) => { if (q() < 0.55) { const l = 46 + q() * 34, bx = x + (q() - 0.5) * 30; c.strokeStyle = `rgb(${62 + q() * 20 | 0},${34 + q() * 10 | 0},${22})`; c.lineWidth = 6.5; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (q() - 0.5) * 26, y + l * 0.5, bx, y + l); c.stroke(); } } }));
  cell(0, TWIG.linden, r => spray(r, { stems: 6, fan: 0.16, len: 320, w: 4, depth: 3, spread: 0.45, lift: 0.3, bush: 0.9, col: wood(44, 36, 32), snow: 0.9,
    tip: (x, y, a, q) => { if (q() < 0.25) { line(x, y, x + 3, y + 9, 1.2, 'rgb(120,104,70)'); dot(x + 3, y + 11, 2.4, 2.4, 'rgb(128,112,78)'); } } }));
  cell(0, TWIG.ginkgo, r => spray(r, { stems: 3, fan: 0.3, len: 380, w: 5.5, depth: 1, spread: 0.55, bush: 0.5, steps: 7, col: wood(58, 52, 46), snow: 0.8,
    node: (x, y, a, q, w) => { const s = q() < 0.5 ? 1 : -1; line(x, y, x + Math.cos(a) * s * (6 + w), y + Math.sin(a) * s * (6 + w) - 2.5, 3.2, 'rgb(52,46,42)'); line(x, y - 2, x + Math.cos(a) * s * (5 + w), y + Math.sin(a) * s * (5 + w) - 4.5, 1.6, SN(0.9)); } }));
  cell(0, TWIG.hawthorn, r => spray(r, { stems: 5, fan: 0.25, len: 270, w: 4.5, depth: 3, spread: 0.95, kink: 0.25, bush: 0.9, col: wood(42, 36, 34), snow: 0.9,
    node: (x, y, a, q) => { if (q() < 0.3) line(x, y, x + Math.cos(a) * 7 * (q() < 0.5 ? 1 : -1), y + Math.sin(a) * 7 - 2, 1.2, 'rgb(40,32,30)'); },
    tip: (x, y, a, q) => { if (q() < 0.2) dot(x, y + 3, 3.4, 3.4, `rgb(${120 + q() * 40 | 0},${18},${22})`); } }));
  cell(0, TWIG.crab, r => spray(r, { stems: 6, fan: 0.2, len: 280, w: 4, depth: 3, spread: 0.7, kink: 0.12, bush: 0.9, col: wood(44, 36, 34), snow: 0.9,
    tip: (x, y, a, q) => { if (q() < 0.42) for (let k = 0, n = 1 + (q() * 3 | 0); k < n; k++) { const fx = x + (q() - 0.5) * 12, fy = y + 4 + q() * 9; line(x, y, fx, fy - 3, 1, 'rgb(60,40,30)'); dot(fx, fy, 3.8, 3.8, `rgb(${170 + q() * 60 | 0},${30 + q() * 40 | 0},${24})`); dot(fx - 1, fy - 1.2, 1.2, 1.2, 'rgba(255,190,170,.7)'); } } }));
  cell(0, TWIG.birch, r => spray(r, { stems: 5, fan: 0.2, len: 330, w: 3, depth: 3, spread: 0.5, droop: 0.9, bush: 0.8, col: wood(60, 40, 42), snow: 0.8,
    tip: (x, y, a, q) => { if (q() < 0.35) { c.save(); c.translate(x, y + 7); c.rotate((q() - 0.5) * 0.6); dot(0, 0, 2.2, 8, 'rgb(118,96,70)'); c.restore(); } } }));
  cell(0, TWIG.leaves, r => spray(r, { stems: 5, fan: 0.25, len: 280, w: 4, depth: 2, spread: 0.75, kink: 0.15, col: wood(48, 38, 34), snow: 0.8,
    tip: (x, y, a, q) => { if (q() < 0.8) { c.save(); c.translate(x, y); c.rotate(q() * 6.3); c.fillStyle = ['rgb(128,82,40)', 'rgb(104,62,34)', 'rgb(146,100,48)', 'rgb(88,56,36)'][q() * 4 | 0]; c.beginPath(); c.moveTo(0, -9); c.bezierCurveTo(8, -5, 7, 6, 0, 11); c.bezierCurveTo(-7, 6, -8, -5, 0, -9); c.fill(); c.restore(); } } }));
  // Bark: each tiles from side to side (drawn again a card's width over), and is laid up a limb turn and turn about.
  const wrap = (x, fn) => { fn(x); fn(x - CW); fn(x + CW); };
  cell(1, BARK.furrow, r => { c.fillStyle = 'rgb(74,66,58)'; c.fillRect(0, 0, CW, CHT);
    for (let i = 0; i < 240; i++) { const x = r() * CW, y = r() * CHT, l = 50 + r() * 190, w = 2.5 + r() * 6, s = (r() - 0.5) * 16, dk = r() < 0.6; wrap(x, X => { c.strokeStyle = dk ? `rgba(16,13,11,${0.5 + r() * 0.4})` : `rgba(${118 + r() * 30 | 0},${108 + r() * 24 | 0},${96},${0.3 + r() * 0.3})`; c.lineWidth = dk ? w : w * 0.6; c.beginPath(); c.moveTo(X, y); c.bezierCurveTo(X + s, y + l * 0.3, X - s, y + l * 0.7, X + s * 0.4, y + l); c.stroke(); }); } });
  cell(1, BARK.smooth, r => { c.fillStyle = 'rgb(84,80,76)'; c.fillRect(0, 0, CW, CHT);
    for (let i = 0; i < 90; i++) { const x = r() * CW, y = r() * CHT, l = 80 + r() * 240; wrap(x, X => line(X, y, X + (r() - 0.5) * 10, y + l, 2 + r() * 5, r() < 0.5 ? 'rgba(30,28,26,.3)' : 'rgba(132,128,120,.25)')); }
    for (let i = 0; i < 150; i++) { const x = r() * CW, y = r() * CHT, w = 4 + r() * 12; wrap(x, X => line(X, y, X + w, y, 1.6, 'rgba(26,22,20,.5)')); } });
  cell(1, BARK.birch, r => { c.fillStyle = 'rgb(214,204,190)'; c.fillRect(0, 0, CW, CHT);
    for (let i = 0; i < 40; i++) { const x = r() * CW, y = r() * CHT, w = 30 + r() * 70, h = 18 + r() * 50; wrap(x, X => { c.fillStyle = `rgba(${196 + r() * 30 | 0},${150 + r() * 30 | 0},${118 + r() * 20 | 0},${0.35 + r() * 0.35})`; c.fillRect(X, y, w, h); c.fillStyle = 'rgba(70,46,34,.55)'; c.fillRect(X, y + h - 3, w, 3); c.fillStyle = 'rgba(246,240,230,.7)'; c.fillRect(X, y, w, 2); }); }
    for (let i = 0; i < 260; i++) { const x = r() * CW, y = r() * CHT, w = 5 + r() * 26; wrap(x, X => line(X, y, X + w, y + (r() - 0.5) * 2, 1.2 + r() * 1.8, `rgba(28,22,20,${0.5 + r() * 0.4})`)); }
    for (let i = 0; i < 9; i++) { const x = r() * CW, y = r() * CHT, s = 12 + r() * 16; wrap(x, X => { c.fillStyle = 'rgba(24,20,18,.85)'; c.beginPath(); c.moveTo(X - s, y); c.quadraticCurveTo(X, y - s * 1.3, X + s, y); c.quadraticCurveTo(X, y + s * 0.5, X - s, y); c.fill(); }); } });
  cell(1, BARK.scaly, r => { c.fillStyle = 'rgb(72,62,56)'; c.fillRect(0, 0, CW, CHT);
    for (let i = 0; i < 420; i++) { const x = r() * CW, y = r() * CHT, w = 9 + r() * 16, h = 14 + r() * 28, v = r(); wrap(x, X => { c.fillStyle = v < 0.2 ? `rgba(128,88,60,.5)` : `rgba(${60 + v * 60 | 0},${52 + v * 50 | 0},${46 + v * 44 | 0},.8)`; c.beginPath(); c.ellipse(X, y, w / 2, h / 2, (r() - 0.5) * 0.4, 0, 7); c.fill(); c.strokeStyle = 'rgba(18,14,12,.7)'; c.lineWidth = 1.4; c.stroke(); }); } });
  cell(1, SNOW, r => { c.fillStyle = 'rgb(236,241,250)'; c.fillRect(0, 0, CW, CHT); for (let i = 0; i < 300; i++) dot(r() * CW, r() * CHT, 4 + r() * 14, 3 + r() * 8, r() < 0.5 ? 'rgba(206,218,240,.25)' : 'rgba(255,255,255,.3)'); });
  cell(1, FOLIAGE, r => { c.fillStyle = 'rgb(20,40,28)'; c.fillRect(0, 0, CW, CHT);
    for (let i = 0; i < 2600; i++) { const x = r() * CW, y = r() * CHT, a = -1.57 + (r() - 0.5) * 1.6, l = 5 + r() * 9, g = 40 + r() * 60; wrap(x, X => line(X, y, X + Math.cos(a) * l, y + Math.sin(a) * l, 1.6 + r() * 1.6, `rgb(${g * 0.4 | 0},${g | 0},${g * 0.55 | 0})`)); }
    for (let i = 0; i < 500; i++) { const x = r() * CW, y = r() * CHT; wrap(x, X => dot(X, y, 1.5 + r() * 3.5, 1 + r() * 2, SN(0.5 + r() * 0.4))); } });
  cell(1, GUARD, () => { for (let i = 0; i < 8; i++) { const x = 16 + i * 32; line(x, 40, x, 508, 7, 'rgb(22,26,24)'); line(x - 2, 40, x - 2, 508, 1.6, 'rgba(110,120,116,.5)'); c.strokeStyle = 'rgb(22,26,24)'; c.lineWidth = 5; c.beginPath(); c.arc(x, 40, 16, Math.PI, 0); c.stroke(); dot(x, 22, 5, 5, 'rgb(30,34,32)'); }
    for (const y of [70, 300, 492]) { c.fillStyle = 'rgb(20,24,22)'; c.fillRect(0, y, CW, 12); c.fillStyle = SN(0.9); c.fillRect(0, y - 5, CW, 6); } });
  const leaf = (x, y, s, rot, col) => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.beginPath(); c.moveTo(0, -s); c.bezierCurveTo(s * 1.1, -s * 0.9, s * 1.0, s * 0.5, 0, s); c.bezierCurveTo(-s * 1.0, s * 0.5, -s * 1.1, -s * 0.9, 0, -s); c.fill(); c.strokeStyle = 'rgba(150,170,140,.35)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, -s * 0.8); c.lineTo(0, s * 0.8); c.stroke(); c.restore(); };
  cell(1, IVY, r => { for (let i = 0; i < 9; i++) { let x = 10 + r() * 236, y = 512; for (let k = 0; k < 9 && y > 60 + r() * 200; k++) { const nx = x + (r() - 0.5) * 50, ny = y - 30 - r() * 34; line(x, y, nx, ny, 2.2, 'rgb(50,40,32)'); x = nx; y = ny; } }
    for (let i = 0; i < 330; i++) { const t = Math.pow(r(), 0.6), y = 512 - t * 400 * (0.5 + 0.5 * r()), x = r() * CW, g = 34 + r() * 44; leaf(x, y, 8 + r() * 8, (r() - 0.5) * 2.4, `rgb(${g * 0.42 | 0},${g | 0},${g * 0.5 | 0})`); if (r() < 0.28) dot(x, y - 5, 6 + r() * 6, 3 + r() * 3, SN(0.9)); } });
  // The shrubs.
  cell(2, SHRUB.dogwood, r => { spray(r, { stems: 14, fan: 0.06, foot: 70, len: 400, w: 3.4, depth: 1, spread: 0.28, lift: 0.5, bush: 0.35, wob: 0.08, col: q => { const v = 0.8 + q() * 0.4; return `rgb(${150 * v | 0},${26 * v | 0},${30 * v | 0})`; }, snow: 0.3 }); });
  cell(2, SHRUB.viburnum, r => spray(r, { stems: 9, fan: 0.12, foot: 60, len: 300, w: 3.8, depth: 3, spread: 0.7, kink: 0.1, bush: 0.85, col: wood(64, 50, 40), snow: 0.9,
    tip: (x, y, a, q) => { if (q() < 0.12) for (let k = 0; k < 5; k++) dot(x + (q() - 0.5) * 12, y + q() * 8, 2.6, 2.6, `rgb(${96 + q() * 50 | 0},${14},${26})`); } }));
  cell(2, SHRUB.rose, r => { for (let i = 0; i < 12; i++) { const x0 = 128 + (r() - 0.5) * 60, dir = r() < 0.5 ? -1 : 1, reach = 30 + r() * 90, top = 120 + r() * 220, x1 = x0 + dir * reach, y1 = 512 - top + r() * 60; c.strokeStyle = `rgb(${64 + r() * 30 | 0},${70 + r() * 30 | 0},${44})`; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x0, 512); c.quadraticCurveTo(x0 + dir * reach * 0.3, 512 - top * 1.25, x1, y1); c.stroke();
      c.strokeStyle = SN(0.7); c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0, 510); c.quadraticCurveTo(x0 + dir * reach * 0.3, 510 - top * 1.25, x1, y1 - 2); c.stroke();
      for (let k = 0; k < 2; k++) { const hx = x1 + (r() - 0.5) * 22, hy = y1 + (r() - 0.3) * 26; line(x1, y1, hx, hy, 1.2, 'rgb(70,60,40)'); dot(hx, hy, 3.2, 4, `rgb(${170 + r() * 40 | 0},${50 + r() * 40 | 0},${20})`); dot(hx, hy + 4, 1.2, 1.4, 'rgb(40,30,20)'); } }
    for (let i = 0; i < 18; i++) dot(128 + (r() - 0.5) * 130, 507 - r() * 22, 9 + r() * 12, 5 + r() * 4, SN(0.95)); });
  cell(2, SHRUB.grass, r => { for (let i = 0; i < 120; i++) { const a = (r() - 0.5) * 1.5, l = 200 + r() * 250, x0 = 128 + (r() - 0.5) * 34, x1 = x0 + Math.sin(a) * l * 0.42, y1 = 512 - Math.cos(a) * l, v = 0.75 + r() * 0.4; c.strokeStyle = `rgb(${206 * v | 0},${166 * v | 0},${86 * v | 0})`; c.lineWidth = 1.5 + r() * 1.7; c.beginPath(); c.moveTo(x0, 512); c.quadraticCurveTo(x0 + Math.sin(a) * l * 0.1, 512 - l * 0.6, x1 + Math.sign(a) * r() * 26, y1 + r() * 30); c.stroke();
      if (r() < 0.2) { c.save(); c.translate(x1, y1); c.rotate(a * 0.7); for (let k = 0; k < 16; k++) dot((r() - 0.5) * 9, -k * 4.4 + 16, 4.2 - k * 0.14, 5, `rgba(${232 + r() * 20 | 0},${206 + r() * 20 | 0},${150},.9)`); c.restore(); } }
    for (let i = 0; i < 34; i++) dot(128 + (r() - 0.5) * 120, 506 - r() * 30, 9 + r() * 12, 5 + r() * 5, SN(0.95)); });
  cell(2, SHRUB.seed, r => { for (let i = 0; i < 26; i++) { const x0 = 128 + (r() - 0.5) * 150, h = 180 + r() * 290, x1 = x0 + (r() - 0.5) * 50; line(x0, 512, x1, 512 - h, 2.4, `rgb(${70 + r() * 30 | 0},${56 + r() * 20 | 0},${42})`);
      if (i % 3 === 0) { dot(x1, 512 - h, 10 + r() * 5, 5, 'rgb(74,52,40)'); dot(x1, 512 - h - 5, 9 + r() * 4, 4.5, SN(0.96)); }      // a flat head holding its cap of snow
      else if (i % 3 === 1) { dot(x1, 512 - h, 5, 7.5, 'rgb(40,30,26)'); dot(x1 - 1, 512 - h - 6, 4, 3, SN(0.9)); }
      else for (let k = 0; k < 7; k++) { const a = -1.57 + (k - 3) * 0.3; line(x1, 512 - h, x1 + Math.cos(a) * 20, 512 - h + Math.sin(a) * 20, 1.5, 'rgb(92,72,50)'); dot(x1 + Math.cos(a) * 21, 512 - h + Math.sin(a) * 21, 3.4, 3.4, 'rgb(110,86,58)'); } }
    for (let i = 0; i < 26; i++) dot(128 + (r() - 0.5) * 170, 507 - r() * 18, 10 + r() * 14, 5 + r() * 4, SN(0.95)); });
  cell(2, SHRUB.hydrangea, r => { for (let i = 0; i < 11; i++) { const x0 = 128 + (r() - 0.5) * 70, h = 220 + r() * 230, x1 = x0 + (r() - 0.5) * 130; c.strokeStyle = 'rgb(86,68,50)'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(x0, 512); c.quadraticCurveTo(x0, 512 - h * 0.6, x1, 512 - h); c.stroke(); const R = 17 + r() * 9;
      for (let k = 0; k < 46; k++) { const a = r() * 6.3, d = Math.sqrt(r()) * R, v = 0.7 + r() * 0.45; dot(x1 + Math.cos(a) * d, 512 - h + Math.sin(a) * d * 0.78, 5.2, 4.4, `rgb(${132 * v | 0},${114 * v | 0},${92 * v | 0})`, r() * 3); }
      dot(x1, 512 - h - R * 0.62, R * 0.8, R * 0.3, SN(0.96)); } });
  cell(2, SHRUB.yew, r => { for (let i = 0; i < 16; i++) { const a = (i - 7.5) * 0.15 + (r() - 0.5) * 0.1, l = 250 + r() * 220, x0 = 128 + (r() - 0.5) * 60; for (let k = 0; k < 44; k++) { const t = 0.08 + r() * 0.92, px = x0 + Math.sin(a) * l * t, py = 512 - Math.cos(a) * l * t, s = r() < 0.5 ? -1 : 1, g = 38 + r() * 58; line(px, py, px + s * (9 + r() * 12) * Math.cos(a) + Math.sin(a) * 9, py + s * (9 + r() * 12) * Math.sin(a) - 9, 3.2, `rgb(${g * 0.38 | 0},${g | 0},${g * 0.52 | 0})`); }
      line(x0, 512, x0 + Math.sin(a) * l, 512 - Math.cos(a) * l, 2.6, 'rgb(48,36,28)'); for (let k = 0; k < 7; k++) { const t = 0.3 + r() * 0.7; dot(x0 + Math.sin(a) * l * t, 512 - Math.cos(a) * l * t - 5, 9 + r() * 10, 4 + r() * 3, SN(0.94), a); } } });
  cell(2, SHRUB.cover, r => { for (let i = 0; i < 46; i++) { const x = r() * CW, y = 512 - Math.pow(r(), 1.6) * 250; leaf(x, y, 9 + r() * 7, r() * 6.3, ['rgb(118,78,40)', 'rgb(96,60,34)', 'rgb(132,96,48)'][r() * 3 | 0]); }
    for (let i = 0; i < 260; i++) { const x = r() * CW, y = 512 - Math.pow(r(), 1.3) * 300, g = 30 + r() * 50; leaf(x, y, 7 + r() * 7, (r() - 0.5) * 3, `rgb(${g * 0.5 | 0},${g | 0},${g * 0.46 | 0})`); if (r() < 0.3) dot(x, y - 3, 7 + r() * 9, 3 + r() * 3, SN(0.92)); } });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
}

function material() {
  const m = new THREE.MeshStandardMaterial({ map: atlas(), alphaTest: 0.36, side: THREE.DoubleSide, vertexColors: true, roughness: 0.95 });
  m.onBeforeCompile = sh => {
    sh.uniforms.uTreeWind = { value: new THREE.Vector2(-WIND[0], -WIND[1]).normalize() };      // where the weather comes from
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aSnow;\nvarying float vSnowK;\nvarying vec3 vTreeN;\nvarying vec3 vTreeP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSnowK = aSnow; vTreeN = normal; vTreeP = (modelMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec2 uTreeWind;\nvarying float vSnowK;\nvarying vec3 vTreeN;\nvarying vec3 vTreeP;')
      // (a card far off: its smaller copies average the twigs away below the cut, so the cut is eased as the copy shrinks: frost.js)
      .replace('#include <map_fragment>', `#include <map_fragment>
        #ifdef USE_MAP
        { vec2 tc = vMapUv * vec2(${AW}.0, ${AH}.0); vec2 ddx = dFdx(tc), ddy = dFdy(tc); float lod = max(0.0, 0.5 * log2(max(dot(ddx, ddx), dot(ddy, ddy)))); diffuseColor.a *= 1.0 + lod * 0.75; }
        #endif
        if (vSnowK < 0.0) {          // twigs: the frost drawn on them, heavy on one tree and light on the next
          float load = clamp(-vSnowK - 1.0, 0.0, 1.0), white = smoothstep(0.5, 0.8, min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b)));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2, 0.17, 0.15), white * (1.0 - load) * 0.7);
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        if (vSnowK >= 0.0) {         // wood and evergreen: snow on whatever faces up, more the more this one carries; and plastered to windward
          vec3 n = normalize(vTreeN); vec3 q = floor(vTreeP * 27.0);
          float sp = fract(sin(dot(q, vec3(12.9898, 78.233, 37.719))) * 43758.5453), br = sin(vTreeP.x * 3.1 + vTreeP.y * 2.3) * sin(vTreeP.z * 2.7 - vTreeP.y * 1.9);
          float th = mix(0.95, 0.12, vSnowK), s = smoothstep(th, th + 0.2, n.y + br * 0.2 + (sp - 0.5) * 0.16);
          float wd = dot(normalize(n.xz + vec2(1e-4)), uTreeWind) * (1.0 - abs(n.y));
          s = max(s, smoothstep(0.62, 0.95, wd + br * 0.25 + (sp - 0.5) * 0.5) * vSnowK * 0.7);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.84, 0.88, 0.97), s);
        }`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * 0.5;');      // (lit a little from within, as everything out of doors is here)
  };
  m.customProgramCacheKey = () => 'grounds-trees';
  return m;
}

// ------------------------------------------------------------------ growing one
// The habit of each kind. tf: how far up the trunk is clean. n: how many limbs. a: their angle from upright (for a
// leader, at the bottom and at the top). bend: how each length of a limb turns (out and down, or up). lf: a limb's
// length against the tree's height. sub: branches to a limb, and their angle off it. cl, cw: a spray's length (against
// the height) and its width against its length. thick: the trunk's radius against the height (a trunk is drawn no
// wider than it is solid: plan.js and groundsplan.js make each one a post some 35 to 40 cm across).
const HABIT = {
  elm: { tf: 0.34, n: [3, 5], a: [0.2, 0.42], bend: 0.21, segs: 4, lf: 0.62, sub: 3, sa: 0.5, sbend: 0.3, kink: 0.12, cl: 0.37, cw: 0.62, thick: 0.019, bark: BARK.furrow, droop: 0.55, tint: [0.62, 0.58, 0.56] },
  locust: { tf: 0.36, n: [2, 4], a: [0.42, 0.85], bend: 0.04, segs: 3, lf: 0.55, sub: 2, sa: 0.85, sbend: 0, kink: 0.5, cl: 0.39, cw: 0.62, thick: 0.02, bark: BARK.furrow, droop: 0.05, tint: [0.5, 0.45, 0.42] },
  hawthorn: { tf: 0.3, n: [4, 6], a: [1.0, 1.36], bend: -0.05, segs: 3, lf: 0.74, sub: 3, sa: 0.75, sbend: -0.12, kink: 0.42, cl: 0.49, cw: 0.82, thick: 0.03, bark: BARK.scaly, droop: 0, fill: 3, tint: [0.66, 0.6, 0.58] },
  crab: { tf: 0.32, n: [5, 7], a: [0.45, 0.95], bend: 0.05, segs: 3, lf: 0.46, sub: 3, sa: 0.7, sbend: -0.1, kink: 0.26, cl: 0.44, cw: 0.78, thick: 0.03, bark: BARK.scaly, droop: 0.1, fill: 3, tint: [0.7, 0.6, 0.56] },
  linden: { leader: 1, tf: 0.2, n: [10, 13], a: [1.2, 0.5], bend: -0.2, lf: 0.36, cl: 0.30, cw: 0.72, thick: 0.021, bark: BARK.smooth, droop: -0.2, side: 2, shape: 0.62, tint: [0.7, 0.66, 0.64] },
  ginkgo: { leader: 1, tf: 0.26, n: [5, 8], a: [1.0, 0.6], bend: -0.04, lf: 0.34, cl: 0.33, cw: 0.5, thick: 0.019, bark: BARK.smooth, droop: 0, side: 0, shape: 0.5, tint: [0.82, 0.78, 0.72] },
  birch: { leader: 1, tf: 0.3, n: [7, 10], a: [0.95, 0.5], bend: 0.22, lf: 0.24, cl: 0.32, cw: 0.6, thick: 0.014, bark: BARK.birch, droop: 0.8, side: 2, shape: 0.7, stems: [2, 3], tint: [1, 1, 1] },
};
const perp = d => { let ux = d[2], uy = 0, uz = -d[0], l = Math.hypot(ux, uz); if (l < 1e-4) { ux = 1; uz = 0; l = 1; } ux /= l; uz /= l; return [[ux, uy, uz], [d[1] * uz - d[2] * uy, d[2] * ux - d[0] * uz, d[0] * uy - d[1] * ux]]; };
const turn = (d, th, ps) => { const [u, v] = perp(d), c = Math.cos(th), s = Math.sin(th), cu = Math.cos(ps) * s, cv = Math.sin(ps) * s; const o = [d[0] * c + u[0] * cu + v[0] * cv, d[1] * c + u[1] * cu + v[1] * cv, d[2] * c + u[2] * cu + v[2] * cv], l = Math.hypot(o[0], o[1], o[2]); return [o[0] / l, o[1] / l, o[2] / l]; };
// A limb's path: `segs` lengths from `p` along `d`, each turned from upright by `bend` and thrown off line by `kink`.
function path(p, d, len, segs, r0, r1, bend, kink, r) {
  const pts = [[p[0], p[1], p[2], r0]]; let q = p, dd = d;
  for (let i = 1; i <= segs; i++) {
    const a = clamp(Math.atan2(Math.hypot(dd[0], dd[2]), dd[1]) + bend + (r() - 0.5) * kink, 0.04, 2.3), az = Math.atan2(dd[2], dd[0]) + (r() - 0.5) * kink * 1.6;
    dd = [Math.sin(a) * Math.cos(az), Math.cos(a), Math.sin(a) * Math.sin(az)]; const l = len / segs;
    q = [q[0] + dd[0] * l, q[1] + dd[1] * l, q[2] + dd[2] * l]; pts.push([q[0], q[1], q[2], r0 + (r1 - r0) * i / segs]);
  }
  return { pts, d: dd };
}
/** One tree in its own frame, 1 tall: limbs [{ pts: [[x, y, z, r]], order }], sprays [{ p, d, len, w, roll, col, droop }], bark, tint. */
function grow(sp, seed) {
  const H = HABIT[sp] || HABIT.linden, r = rng(seed), limbs = [], cards = [], lop = r() * TAU, lopK = 0.12 + r() * 0.22;
  const spray = (p, d, len, roll, col = TWIG[sp] ?? 2, droop = H.droop) => cards.push({ p, d, len, w: len * H.cw * (0.85 + r() * 0.3), roll, col, droop });
  const tips = (p, d, len, n = 2) => { const dd = turn(d, 0.12 + r() * 0.2, r() * TAU), ro = (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.35); for (let i = 0; i < n; i++) spray(p, dd, len * (0.85 + 0.3 * r()), ro + i * Math.PI / n); if (r() < 0.7) cards.push({ p, d: [dd[0], Math.max(-0.05, dd[1] * 0.35), dd[2]].map((v, _, a) => v / Math.hypot(a[0], a[1], a[2])), len: len * 1.1, w: len * H.cw * 1.15, roll: 0, col: TWIG[sp] ?? 2, droop: 0, flat: 1 }); };      // (two fans crossed, both aslant, and often a third lying level over them: the crown as the drone sees it)
  const extra = (sp === 'hawthorn' || sp === 'crab') && r() < 0.3 ? TWIG.leaves : null;      // some keep last year's leaves
  const stem = (ox, oz, lean, la, hk) => {
    const d0 = [Math.sin(lean) * Math.cos(la), Math.cos(lean), Math.sin(lean) * Math.sin(la)], R = H.thick * (0.85 + r() * 0.3) * (hk < 1 ? 0.8 : 1);
    if (H.leader) {
      const lead = path([ox, 0, oz], d0, hk * 0.92, 5, R, R * 0.14, -lean * 0.3, 0.07, r); lead.pts.unshift([ox - d0[0] * 0.03, -0.03, oz - d0[2] * 0.03, R * 1.25]); limbs.push({ pts: lead.pts, order: 0 });
      const at = t => { const f = clamp(t, 0, 1) * 5, i = Math.min(4, Math.floor(f)), k = f - i, a = lead.pts[i + 1], b = lead.pts[i + 2]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k]; };
      const n = H.n[0] + Math.floor(r() * (H.n[1] - H.n[0] + 1)); let az = r() * TAU;
      for (let i = 0; i < n; i++) {
        if (r() < 0.06) continue;
        const t = (i + r() * 0.6) / n, u = H.tf + (0.97 - H.tf) * t, p = at(u / 0.92), ang = H.a[0] + (H.a[1] - H.a[0]) * t + (r() - 0.5) * 0.2; az += 2.4 + (r() - 0.5) * 0.7;
        const prof = Math.pow(Math.sin(Math.PI * clamp(0.16 + t * 0.84, 0, 1) ** H.shape), 0.8) * (1 - 0.35 * t) + 0.12, len = H.lf * hk * prof * (0.8 + 0.4 * r()) * (1 + lopK * Math.cos(az - lop));
        const lb = path(p, [Math.sin(ang) * Math.cos(az), Math.cos(ang), Math.sin(ang) * Math.sin(az)], len, 2, p[3] * 0.5 + 0.0015, 0.0012, H.bend, 0.2, r); limbs.push({ pts: lb.pts, order: 1 });
        const e = lb.pts[2], cl = H.cl * hk * (0.6 + 0.5 * prof); tips(e, lb.d, cl, 2);
        for (let k = 0; k < H.side; k++) { const m = lb.pts[1]; spray(m, turn(lb.d, 0.7 + r() * 0.4, r() * TAU), cl * (0.7 + r() * 0.3), r() * 3); }
      }
      const top = lead.pts[lead.pts.length - 1]; tips(top, [lead.d[0] * 0.5, 1, lead.d[2] * 0.5], H.cl * hk * 0.8, 2);
      return;
    }
    const tk = path([ox, 0, oz], d0, H.tf * hk * (0.85 + r() * 0.3), 3, R, R * 0.74, -lean * 0.25, 0.1, r); tk.pts.unshift([ox, -0.03, oz, R * 1.25]); limbs.push({ pts: tk.pts, order: 0 });
    const fork = tk.pts[tk.pts.length - 1], below = tk.pts[tk.pts.length - 2], n = H.n[0] + Math.floor(r() * (H.n[1] - H.n[0] + 1)), a0 = r() * TAU, Rm = fork[3] * Math.min(0.78, 1.25 / Math.sqrt(n));
    for (let i = 0; i < n; i++) {
      const az = a0 + (i + (r() - 0.5) * 0.5) / n * TAU, ang = H.a[0] + r() * (H.a[1] - H.a[0]), k = r() * 0.5, st = [fork[0] + (below[0] - fork[0]) * k, fork[1] + (below[1] - fork[1]) * k, fork[2] + (below[2] - fork[2]) * k];
      const len = H.lf * hk * (0.78 + 0.4 * r()) * (1 + lopK * Math.cos(az - lop)), mb = path(st, [Math.sin(ang) * Math.cos(az), Math.cos(ang), Math.sin(ang) * Math.sin(az)], len, H.segs, Rm * (0.8 + 0.3 * r()), Rm * 0.24, H.bend, H.kink, r);
      limbs.push({ pts: mb.pts, order: 1 });
      for (let j = 2; j <= H.segs; j++) if (r() < 0.8) { const q = mb.pts[j - 1], e = mb.pts[j], m = [(q[0] + e[0]) / 2, (q[1] + e[1]) / 2, (q[2] + e[2]) / 2]; spray(m, turn([e[0] - q[0], e[1] - q[1] + 0.02, e[2] - q[2]].map(v => v / (Math.hypot(e[0] - q[0], e[1] - q[1], e[2] - q[2]) || 1)), 0.7 + r() * 0.5, r() * TAU), H.cl * hk * (0.75 + 0.3 * r()), (r() - 0.5) * 2); }      // twigs straight off the limb, along its outer lengths
      for (let j = 1; j <= H.segs; j++) {
        const node = mb.pts[j], tip = j === H.segs, cnt = tip ? 2 : (j === H.segs - 1 && r() < H.sub / 3 + 0.2 ? 1 : 0), pd = [node[0] - mb.pts[j - 1][0], node[1] - mb.pts[j - 1][1], node[2] - mb.pts[j - 1][2]], pl = Math.hypot(pd[0], pd[1], pd[2]) || 1, dir = [pd[0] / pl, pd[1] / pl, pd[2] / pl];
        for (let s = 0; s < cnt; s++) {
          const sd = turn(dir, H.sa * (0.6 + 0.6 * r()), r() * TAU), sl = len * (0.36 + 0.22 * r()) * (tip ? 1 : 1.1), sb = path(node, sd, sl, 2, node[3] * 0.72, 0.0012, H.sbend, H.kink, r); limbs.push({ pts: sb.pts, order: 2 });
          const cl = H.cl * hk * (0.8 + 0.4 * r()); tips(sb.pts[2], sb.d, cl, 2); spray(sb.pts[1], turn(sb.d, 0.6 + r() * 0.5, r() * TAU), cl * 0.85, r() * 3, extra != null && r() < 0.7 ? extra : undefined);
        }
      }
    }
    for (let i = 0; i < (H.fill || 0); i++) spray([fork[0], fork[1] - 0.02, fork[2]], turn([0, 1, 0], 0.25 + r() * 0.5, r() * TAU), H.cl * hk * 1.05, r() * 3);      // twigs filling the middle of a dense head
  };
  if (H.stems) { const n = H.stems[0] + Math.floor(r() * (H.stems[1] - H.stems[0] + 1)), a0 = r() * TAU; for (let i = 0; i < n; i++) { const la = a0 + i * TAU / n + (r() - 0.5) * 0.8; stem(Math.cos(la) * 0.012, Math.sin(la) * 0.012, 0.09 + r() * 0.14, la, i ? 0.72 + r() * 0.26 : 1); } }
  else stem(0, 0, r() * r() * 0.11, r() * TAU, 1);
  // Brought to a height of exactly 1 (radii with it).
  let top = 0.1; for (const l of limbs) for (const p of l.pts) top = Math.max(top, p[1]); for (const c of cards) top = Math.max(top, c.p[1] + c.d[1] * c.len * 0.9);
  const k = 1 / top; for (const l of limbs) for (const p of l.pts) { p[0] *= k; p[1] *= k; p[2] *= k; p[3] *= k; } for (const c of cards) { c.p = [c.p[0] * k, c.p[1] * k, c.p[2] * k]; c.len *= k; c.w *= k; }
  return { limbs, cards, bark: H.bark, tint: H.tint.map(v => v * (0.82 + r() * 0.36)), load: r() };
}

// ------------------------------------------------------------------ the meshes
class Buf {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.col = []; this.sn = []; this.idx = []; }
  get n() { return this.pos.length / 3; }
  v(x, y, z, nx, ny, nz, u, v, c, s) { this.pos.push(x, y, z); this.nor.push(nx, ny, nz); this.uv.push(u, v); this.col.push(c[0], c[1], c[2]); this.sn.push(s); }
  mesh(mat) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3)); g.setAttribute('aSnow', new THREE.Float32BufferAttribute(this.sn, 1)); g.setIndex(this.idx); g.computeBoundingSphere(); g.computeBoundingBox();
    const m = new THREE.Mesh(g, mat); m.matrixAutoUpdate = false; return m;
  }
}
const U = (col, f) => (col + 0.012 + f * 0.976) / 8, V = (row, f) => 1 - (row + 1 - 0.004 - f * 0.992) / 3;        // into a card of the picture: f across, f up from its foot
// A tube through points [x, y, z, r] (already in the mesh's frame), `sides` round, bark from card (1, col), laid turn and turn about.
function tube(b, pts, sides, col, tint, snow, tile = 1.1) {
  const base = b.n; let run = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], c = pts[Math.min(pts.length - 1, i + 1)], d = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], l = Math.hypot(d[0], d[1], d[2]) || 1, [u, v] = perp([d[0] / l, d[1] / l, d[2] / l]);
    if (i) run += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]);
    const t = run / tile, f = Math.floor(t) % 2 ? 1 - (t - Math.floor(t)) : t - Math.floor(t);
    for (let j = 0; j <= sides; j++) { const an = j / sides * TAU, cs = Math.cos(an), sn = Math.sin(an), nx = u[0] * cs + v[0] * sn, ny = u[1] * cs + v[1] * sn, nz = u[2] * cs + v[2] * sn; b.v(p[0] + nx * p[3], p[1] + ny * p[3], p[2] + nz * p[3], nx, ny, nz, U(col, j / sides), V(1, f), tint, snow); }
  }
  const N = sides + 1; for (let i = 0; i + 1 < pts.length; i++) for (let j = 0; j < sides; j++) { const a = base + i * N + j, c = a + N; b.idx.push(a, c, a + 1, a + 1, c, c + 1); }
}
// A card from `p` along `d`, `len` long and `w` wide, turned `roll` about its length, its far half hanging by `droop`.
function card(b, p, d, len, w, roll, row, col, tint, snow, droop = 0, rows = 2) {
  const [u, v] = perp(d), cs = Math.cos(roll), sn = Math.sin(roll), s = [u[0] * cs + v[0] * sn, u[1] * cs + v[1] * sn, u[2] * cs + v[2] * sn], base = b.n;
  for (let k = 0; k <= rows; k++) { const t = k / rows, sag = droop * len * t * t * 0.42, wk = w / 2;
    for (const e of [-1, 1]) b.v(p[0] + d[0] * len * t + s[0] * wk * e, p[1] + d[1] * len * t - sag + s[1] * wk * e, p[2] + d[2] * len * t + s[2] * wk * e, d[0] * 0.3, 0.92, d[2] * 0.3, U(col, 0.5 + e * 0.5), V(row, t), tint, snow); }
  for (let k = 0; k < rows; k++) { const a = base + k * 2; b.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
}
// A smooth body of revolution about a leaning axis: rings [y, r] from the ground up, bulged a little by `lump`.
function body(b, x, y0, z, rings, sides, row, col, tint, snow, lump, r, uTiles = 2) {
  const base = b.n, ph = r() * TAU;
  rings.forEach(([y, rad], i) => { const a = rings[Math.max(0, i - 1)], c = rings[Math.min(rings.length - 1, i + 1)], dr = c[1] - a[1], dy = c[0] - a[0], dl = Math.hypot(dr, dy) || 1, nh = dy / dl, ny = -dr / dl;
    for (let j = 0; j <= sides; j++) { const an = j / sides * TAU, k = 1 + lump * (Math.sin(an * 3 + y * 5 + ph) * 0.6 + Math.sin(an * 5 - y * 3 + ph * 2) * 0.4), cs = Math.cos(an), sn = Math.sin(an), t = j / sides * uTiles, f = Math.floor(t) % 2 ? 1 - (t % 1) : t % 1;
      b.v(x + cs * rad * k, y0 + y, z + sn * rad * k, cs * nh, ny, sn * nh, U(col, f), V(row, 0.05 + 0.9 * (i / (rings.length - 1))), tint, snow); } });
  const N = sides + 1; for (let i = 0; i + 1 < rings.length; i++) for (let j = 0; j < sides; j++) { const a = base + i * N + j, c = a + N; b.idx.push(a, c, a + 1, a + 1, c, c + 1); }
}

/** Build every tree and shrub of the plan into `group`. Returns what was made (counts, triangles). */
export function buildTrees(museum, plan, group = museum.group) {
  const G = plan.grounds, D = plan.dress || { shrubs: [], cover: [], guards: [], beds: [] }, mat = material(), chunks = new Map(), W = [1, 1, 1];
  const chunk = (x, z) => { const i = Math.floor(x / CHUNK), j = Math.floor(z / CHUNK), k = i + ',' + j; let c = chunks.get(k); if (!c) chunks.set(k, c = { cx: (i + 0.5) * CHUNK, cz: (j + 0.5) * CHUNK, near: new Buf(), far: new Buf() }); return c; };
  const stats = { trees: 0, shrubs: D.shrubs.length, kinds: {}, near: 0, far: 0, chunks: 0 };
  const hash = (x, z) => (Math.imul(Math.round(x * 10), 73856093) ^ Math.imul(Math.round(z * 10), 19349663)) >>> 0;
  const snowBand = (x, z) => 0.5 + 0.5 * Math.sin(x * 0.043 + 1.3) * Math.sin(z * 0.057 + 0.4);        // whole stretches of the park caught more of the fall than others

  const tree = (x, y0, z, sp, hgt, seed) => {
    const T = grow(sp, seed), c = chunk(x, z), ox = x - c.cx, oz = z - c.cz, load = clamp(0.38 + 0.4 * T.load + 0.35 * snowBand(x, z), 0.3, 1);
    const at = p => [ox + p[0] * hgt, y0 + p[1] * hgt, oz + p[2] * hgt, Math.max(0.006, p[3] * hgt)];
    for (const l of T.limbs) {
      const pts = l.pts.map(at), thin = l.order === 0 ? 1 : l.order === 1 ? 0.92 : 0.7;
      tube(c.near, pts, l.order === 0 ? (hgt > 6 ? 8 : 6) : l.order === 1 ? 4 : 3, T.bark, T.tint, load * thin);
      if (l.order < 2) tube(c.far, l.order === 0 ? pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1) : [pts[0], pts[pts.length - 1]], l.order === 0 ? 5 : 3, T.bark, T.tint, load * thin);
    }
    const tv = 0.92 + 0.16 * T.load, tw = [tv, tv, tv * 1.03];
    T.cards.forEach((k, i) => { const p = at(k.p); card(c.near, p, k.d, k.len * hgt, k.w * hgt, k.roll, 0, k.col, tw, -1 - load, k.droop, k.flat ? 1 : 2); if (i % 3 !== 2 || k.flat) card(c.far, p, k.d, k.len * hgt * 1.08, k.w * hgt * 1.15, k.roll, 0, k.col, tw, -1 - load, k.droop, 1); });
    stats.trees++; stats.kinds[sp] = (stats.kinds[sp] || 0) + 1;
  };
  for (const t of G.trees) {
    const sp = t.sp || (t.kind === 'hawthorn' ? 'hawthorn' : t.kind === 'elm' ? 'elm' : 'locust'), seed = hash(t.x, t.z), r = rng(seed ^ 0x5bd1), R = SPECIES[sp] || SPECIES.linden;
    tree(t.x, streetY(plan, t.x, t.z) - 0.02, t.z, sp, R[0] + (R[1] - R[0]) * r(), seed);
  }
  for (const t of G.medianTrees || []) { const seed = hash(t.x, t.z), r = rng(seed); tree(t.x, t.y - 0.02, t.z, r() < 0.5 ? 'crab' : 'hawthorn', 2.9 + r() * 0.9, seed); }

  // ---- shrubs
  const DARKG = [0.75, 0.82, 0.78];
  for (const s of D.shrubs) {
    const r = rng(s.seed), c = chunk(s.x, s.z), x = s.x - c.cx, z = s.z - c.cz, y = streetY(plan, s.x, s.z) - 0.03, load = clamp(0.35 + 0.6 * r(), 0, 1), a0 = r() * TAU, tint = [0.85 + r() * 0.3, 0.85 + r() * 0.3, 0.85 + r() * 0.3];
    if (s.k === 'yew' || s.k === 'arbor') {
      const rings = s.k === 'yew' ? [[0, 0.62], [0.14, 0.9], [0.4, 1], [0.66, 0.86], [0.86, 0.56], [0.97, 0.24], [1, 0.02]] : [[0, 0.5], [0.07, 0.84], [0.22, 1], [0.45, 0.9], [0.68, 0.66], [0.86, 0.38], [0.96, 0.16], [1, 0.02]];
      const R = rings.map(([v, k]) => [v * s.h, k * s.r]);
      body(c.near, x, y, z, R, 10, 1, FOLIAGE, DARKG, s.k === 'yew' ? 0.72 + 0.25 * load : 0.4 + 0.3 * load, s.k === 'yew' ? 0.1 : 0.06, r, s.k === 'yew' ? 4 : 2);
      body(c.far, x, y, z, R.filter((_, i) => i % 2 === 0 || i === R.length - 1), 6, 1, FOLIAGE, DARKG, 0.75, 0, r);
      if (s.k === 'yew') for (let i = 0; i < 7; i++) { const a = a0 + i * 0.9, d = turn([0, 1, 0], 0.5 + r() * 0.5, a); card(c.near, [x + Math.cos(a) * s.r * 0.45, y + s.h * 0.3, z + Math.sin(a) * s.r * 0.45], d, s.h * 0.95, s.r * 1.3, r() * 3, 2, SHRUB.yew, W, -1 - load, 0.2, 1); }
      else for (let i = 0; i < 5; i++) { const a = a0 + i * 1.26, hh = 0.25 + r() * 0.5; card(c.near, [x + Math.cos(a) * s.r * 0.5, y + s.h * hh, z + Math.sin(a) * s.r * 0.5], turn([0, 1, 0], 0.22, a), s.h * 0.4, s.r * 1.1, a + 1.57, 2, SHRUB.yew, W, -1 - load, 0, 1); }
      continue;
    }
    // (a card is as wide as its picture makes it: half its height, a little more for the bushier kinds; a wide clump is three of them side by side)
    if (s.k === 'grass') { tint[0] *= 0.72; tint[1] *= 0.72; tint[2] *= 0.72; }
    const col = SHRUB[s.k] ?? 1, n = 3, lean = s.k === 'rose' || s.k === 'grass' ? 0.1 : 0.05, w = clamp(s.r * 2.3, s.h * 0.5, s.h * 0.78), off = Math.max(0, s.r - w * 0.45);
    for (let i = 0; i < n; i++) { const a = a0 + i * Math.PI / n, d = turn([0, 1, 0], lean * r(), r() * TAU), ox = Math.cos(a * 2 + 1) * off, oz = Math.sin(a * 2 + 1) * off; card(c.near, [x + ox, y, z + oz], d, s.h * (0.88 + 0.24 * r()), w, a, 2, col, tint, -1 - load, 0, 1); if (i < 2) card(c.far, [x + ox, y, z + oz], [0, 1, 0], s.h, w * 1.1, a, 2, col, tint, -1 - load, 0, 1); }
  }
  // ---- ivy on the wall's foot, and groundcover before it
  for (const [wx, wz, nx, nz] of D.cover) {
    const c = chunk(wx, wz), x = wx - c.cx, z = wz - c.cz, r = rng(hash(wx, wz)), y = streetY(plan, wx + nx * 0.4, wz + nz * 0.4) - 0.02, w = 1.25, h = 0.55 + r() * 0.7, lo = 0.6 + r() * 0.4;
    if (r() < 0.75) card(c.near, [x + nx * 0.02, y, z + nz * 0.02], [nx * 0.05, 1, nz * 0.05], h, w, nx ? Math.PI / 2 : 0, 1, IVY, [0.9, 1, 0.9], -1 - lo, 0, 1);
    card(c.near, [x + nx * 0.05, y + 0.05, z + nz * 0.05], [nx * 0.96, 0.28, nz * 0.96], 0.5 + r() * 0.5, w, nx ? Math.PI / 2 : 0, 2, SHRUB.cover, [0.9, 1, 0.9], -1 - lo, 0, 1);
  }
  // ---- iron guards round the street trees; the steel edge of each planted bed
  for (const [gx, gz] of D.guards) { const c = chunk(gx, gz), y = streetY(plan, gx, gz); body(c.near, gx - c.cx, y, gz - c.cz, [[0, 0.3], [0.62, 0.3], [1.24, 0.3]], 10, 1, GUARD, [0.8, 0.85, 0.85], -1.9, 0, rng(1), 2); }
  for (const q of D.beds) { const c = chunk((q.x0 + q.x1) / 2, (q.z0 + q.z1) / 2), y = 0.045, e = [0.3, 0.3, 0.32];
    for (const [a, b2] of [[[q.x0, q.z0], [q.x1, q.z0]], [[q.x1, q.z0], [q.x1, q.z1]], [[q.x1, q.z1], [q.x0, q.z1]], [[q.x0, q.z1], [q.x0, q.z0]]]) { const mx = (a[0] + b2[0]) / 2, mz = (a[1] + b2[1]) / 2; if (plan.masses.some(m => mx > m.x0 - 0.3 && mx < m.x1 + 0.3 && mz > m.z0 - 0.3 && mz < m.z1 + 0.3)) continue; tube(c.near, [[a[0] - c.cx, y, a[1] - c.cz, 0.035], [b2[0] - c.cx, y, b2[1] - c.cz, 0.035]], 4, BARK.smooth, e, 0.9); } }

  for (const c of chunks.values()) {
    if (!c.near.n) continue;
    const lod = new THREE.LOD(), near = c.near.mesh(mat), far = c.far.n ? c.far.mesh(mat) : new THREE.Object3D();
    lod.addLevel(near, 0); lod.addLevel(far, FAR); lod.position.set(c.cx, 0, c.cz); lod.updateMatrix(); lod.matrixAutoUpdate = false; lod.name = 'trees'; group.add(lod);
    stats.near += c.near.idx.length / 3; stats.far += c.far.idx.length / 3; stats.chunks++;
  }
  museum.treeStats = stats;
  return stats;
}
