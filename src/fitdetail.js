// The surface of back-of-house things (src/furnish.js): brushed steel, cardboard, plywood and pine, painted or laminated
// board. The fit-out has no texture coordinates (it is boxes and cylinders by the hundred thousand, merged by material),
// so the grain is laid on from the world: each of four small tiling canvases is projected along x, y and z and blended
// by the face's normal (a box face takes exactly one), at a true size, and it shades the vertex colour up and down a
// little rather than replacing it, so a red crate stays red. The canvases are painted once, 256 px, mipmapped.
import * as THREE from 'three';
import { rng } from './textures.js';

const N = 256;
function paint(draw) {
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, N, N); draw(g, rng(N + draw.length));
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
  return t;
}
// A stroke drawn three times over, so it runs off one edge and comes back in at the other: the tile has no seam.
const wrapped = (g, f) => { for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) { g.save(); g.translate(dx, dy); f(); g.restore(); } };

const KINDS = {
  // Brushed stainless: fine streaks all one way (along u), a few longer scuffs, the odd fingerprint haze.
  steel: { size: 0.45, amount: 0.5, make: () => paint((g, r) => {
    for (let i = 0; i < 1400; i++) { const y = r() * N, x = r() * N, l = 20 + r() * 160, v = r() < 0.5 ? 255 : 0; g.fillStyle = `rgba(${v},${v},${v},${0.04 + r() * 0.1})`; wrapped(g, () => g.fillRect(x, y, l, 0.6 + r() * 0.8)); }
    for (let i = 0; i < 6; i++) { const x = r() * N, y = r() * N, rad = 12 + r() * 26; wrapped(g, () => { const rg = g.createRadialGradient(x, y, 0, x, y, rad); rg.addColorStop(0, 'rgba(160,160,160,0.18)'); rg.addColorStop(1, 'rgba(160,160,160,0)'); g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }); }
  }) },
  // Corrugated board: fibres, mottling, and the flutes showing faintly through the liner as bands along u.
  card: { size: 0.6, amount: 0.55, make: () => paint((g, r) => {
    for (let y = 0; y < N; y += 4) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(0, y, N, 1.5); g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(0, y + 2, N, 1); }
    for (let i = 0; i < 40; i++) { const x = r() * N, y = r() * N, rad = 10 + r() * 40, v = r() < 0.5 ? '60,40,20' : '255,240,210'; wrapped(g, () => { const rg = g.createRadialGradient(x, y, 0, x, y, rad); rg.addColorStop(0, `rgba(${v},0.12)`); rg.addColorStop(1, `rgba(${v},0)`); g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }); }
    for (let i = 0; i < 1800; i++) { const x = r() * N, y = r() * N, a = r() * 3.14, l = 2 + r() * 6, v = r() < 0.5 ? 0 : 255; g.strokeStyle = `rgba(${v},${v},${v},${0.05 + r() * 0.08})`; g.lineWidth = 0.6; wrapped(g, () => { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }); }
    // a strip of brown tape, every so often, across the tile
    g.fillStyle = 'rgba(70,45,15,0.16)'; g.fillRect(0, 96, N, 26); g.fillStyle = 'rgba(255,230,190,0.12)'; g.fillRect(0, 98, N, 2);
  }) },
  // Plywood and pine: long wavering grain lines along u, knots now and then, and the tone drifting board to board.
  wood: { size: 0.6, amount: 0.55, make: () => paint((g, r) => {
    for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.04 + r() * 0.06})`; g.fillRect(0, i * N / 5, N, N / 5); }
    for (let i = 0; i < 120; i++) {
      const y = r() * N, amp = 1 + r() * 4, ph = r() * 6.28, f = (1 + Math.floor(r() * 3)) * 6.2832 / N, v = r() < 0.65 ? 0 : 255;
      g.strokeStyle = `rgba(${v},${v},${v},${0.06 + r() * 0.12})`; g.lineWidth = 0.6 + r() * 1.6;
      wrapped(g, () => { g.beginPath(); for (let x = 0; x <= N; x += 8) g.lineTo(x, y + Math.sin(x * f + ph) * amp); g.stroke(); });
    }
    for (let i = 0; i < 3; i++) { const x = r() * N, y = r() * N; wrapped(g, () => { g.fillStyle = 'rgba(40,20,5,0.28)'; g.beginPath(); g.ellipse(x, y, 5 + r() * 4, 2.5 + r() * 2, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(40,20,5,0.12)'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, 12, 5, 0, 0, 7); g.stroke(); }); }
  }) },
  // Paint on board, laminate, powder coat: an orange-peel tooth, soft blotches of wear, a few scuffs. Quiet.
  paint: { size: 0.6, amount: 0.32, make: () => paint((g, r) => {
    for (let i = 0; i < 2600; i++) { const x = r() * N, y = r() * N, s = 0.8 + r() * 2, v = r() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${v},${v},${v},${0.04 + r() * 0.07})`; wrapped(g, () => g.fillRect(x, y, s, s)); }
    for (let i = 0; i < 18; i++) { const x = r() * N, y = r() * N, rad = 14 + r() * 40; wrapped(g, () => { const rg = g.createRadialGradient(x, y, 0, x, y, rad); rg.addColorStop(0, 'rgba(0,0,0,0.1)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }); }
    for (let i = 0; i < 14; i++) { const x = r() * N, y = r() * N, a = r() * 3.14, l = 8 + r() * 30; g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 0.8; wrapped(g, () => { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }); }
  }) },
};
const made = {};
// Steel has a texture of its own. The matte surfaces share one: paint in its red channel, card in its green, wood in its
// blue, all at the same tile size (0.6 m), so a fragment takes three samples whatever it is and keeps the channel it needs.
function texFor(kind) {
  if (made[kind]) return made[kind];
  if (kind === 'steel') return (made.steel = KINDS.steel.make());
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d'), out = g.createImageData(N, N);
  ['paint', 'card', 'wood'].forEach((k, ch) => { const t = KINDS[k].make(), d = t.image.getContext('2d').getImageData(0, 0, N, N).data; for (let i = 0; i < d.length; i += 4) out.data[i + ch] = d[i + 1]; t.dispose(); });
  for (let i = 3; i < out.data.length; i += 4) out.data[i] = 255;
  g.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
  return (made.matte = t);
}

// The fit-out's palette (C in src/furnish.js) that is card or wood, as the vertex colour reaches the shader: furnish.js
// stores each colour linear, in bytes. A matte part of one of these colours takes that grain; any other, paint.
const lin = hex => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map(v => { const s = v / 255; return Math.max(1, Math.round(255 * (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4))) / 255; });
const CARD = [0xa98a5c, 0x8a6c42], WOOD = [0xc2a878, 0xc9ad7c, 0x8a6a45, 0xb89b6e, 0x4a3222];      // card, cardD; ply, pine, wood, woodL, woodD
const near = (list, name) => `float ${name} = 0.0;` + list.map(h => ` ${name} = max(${name}, step(distance(vColor.rgb, vec3(${lin(h).map(v => v.toFixed(5)).join(', ')})), 0.003));`).join('');

// Give a fit-out material (a MeshStandardMaterial with vertex colours) its grain: 'steel', or 'matte' (paint, with card
// and wood picked out by their colour). Whatever onBeforeCompile it already has runs first.
export function withDetail(mat, kind) {
  if (typeof document === 'undefined' || !(kind === 'steel' || kind === 'matte')) return mat;
  const tex = texFor(kind), before = mat.onBeforeCompile, steel = kind === 'steel', size = steel ? KINDS.steel.size : 0.6;
  const pick = steel ? `vec3 fitSel = vec3(0.0, 1.0, 0.0); float fitAmt = ${KINDS.steel.amount.toFixed(3)};`
    : `${near(CARD, 'fitCard')} ${near(WOOD, 'fitWood')}
        vec3 fitSel = fitCard > 0.5 ? vec3(0.0, 1.0, 0.0) : fitWood > 0.5 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
        float fitAmt = dot(fitSel, vec3(${KINDS.paint.amount.toFixed(3)}, ${KINDS.card.amount.toFixed(3)}, ${KINDS.wood.amount.toFixed(3)}));`;
  mat.onBeforeCompile = (sh, r) => {
    if (before) before.call(mat, sh, r);
    sh.uniforms.uFitTex = { value: tex };
    // The fit-out's meshes stand where they are drawn (no transform), so the vertex's own position and normal are the world's.
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vFitP;\nvarying vec3 vFitN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vFitP = position; vFitN = normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uFitTex;\nvarying vec3 vFitP;\nvarying vec3 vFitN;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        ${pick}
        vec3 fitW = pow(abs(normalize(vFitN)), vec3(4.0)); fitW /= (fitW.x + fitW.y + fitW.z);
        vec3 fitQ = vFitP * ${(1 / size).toFixed(3)};
        vec3 fitS = texture2D(uFitTex, fitQ.zy).rgb * fitW.x + texture2D(uFitTex, fitQ.xz).rgb * fitW.y + texture2D(uFitTex, fitQ.xy).rgb * fitW.z;
        float fitK = 1.0 + (dot(fitS, fitSel) - 0.5) * 2.0 * fitAmt;
        diffuseColor.rgb *= fitK;`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= fitK;');
  };
  const key = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.customProgramCacheKey = () => key() + '|fit-' + kind;
  return mat;
}
