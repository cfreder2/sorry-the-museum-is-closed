// A painter's floor, for the lives in this folder: a texture of short brush strokes in a work's own colours, laid the
// way that painter laid them, that wraps (so it can be tiled and drifted). Its alpha holds each stroke's own number
// (0.3 to 1), so a shader can make a surface appear, or dry, or break up at its edge one stroke at a time, as the
// Caillebotte's setts do (src/life/20684-paris-street.js).
//
//   strokes({ size: 512, base: '#5b6a8a', n: 2600, colors: [['#6f7fb0', 3], ['#9a8fc4', 2], ...], len: [10, 26],
//             width: [3, 7], angle: () => 0, bend: 0.25, seed: 7, lift: 0.18 })  ->  THREE.DataTexture (sRGB, mipmapped)
//
// angle(x, y, rand) is each stroke's direction in radians (0 runs across the texture); bend curls it; lift lays a lighter
// ridge along one edge of each stroke, as a loaded brush leaves.
import * as THREE from 'three';
import { rng } from '../paintlife.js';

export function strokes({ size = 512, base = '#777', n = 2400, colors = [['#999', 1]], len = [10, 26], width = [3, 7], angle = () => 0, bend = 0.25, seed = 1, lift = 0.16 } = {}) {
  const W = size, H = size, rand = rng(seed);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d', { willReadFrequently: true });
  const iv = document.createElement('canvas'); iv.width = W; iv.height = H; const gi = iv.getContext('2d', { willReadFrequently: true });
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  gi.fillStyle = 'rgb(90,90,90)'; gi.fillRect(0, 0, W, H);
  let total = 0; for (const c of colors) total += c[1];
  const pick = () => { let r = rand() * total; for (const c of colors) if ((r -= c[1]) <= 0) return c[0]; return colors[0][0]; };
  const light = new THREE.Color(), col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const x = rand() * W, y = rand() * H, a = angle(x / W, y / H, rand), l = len[0] + rand() * (len[1] - len[0]), w = width[0] + rand() * (width[1] - width[0]);
    const dx = Math.cos(a) * l / 2, dy = Math.sin(a) * l / 2, b = (rand() - 0.5) * bend * l, mx = -Math.sin(a) * b, my = Math.cos(a) * b;
    col.set(pick()); light.copy(col).lerp(new THREE.Color(1, 1, 1), 0.35);
    const id = 80 + Math.floor(rand() * 175);
    // every stroke drawn again across each edge it crosses, so the texture tiles
    for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) {
      if (x + ox < -l || x + ox > W + l || y + oy < -l || y + oy > H + l) continue;
      const x0 = x + ox - dx, y0 = y + oy - dy, x1 = x + ox + dx, y1 = y + oy + dy, cx = x + ox + mx, cy = y + oy + my;
      for (const [ctx, style, lw, off] of [[g, col.getStyle(), w, 0], [g, light.getStyle(), w * 0.32, w * 0.24], [gi, `rgb(${id},${id},${id})`, w, 0]]) {
        if (ctx === g && off && lift <= 0) continue;
        ctx.save(); if (off) { ctx.globalAlpha = lift * 2.2; ctx.translate(-Math.sin(a) * off, Math.cos(a) * off); }
        ctx.strokeStyle = style; ctx.lineWidth = lw; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke(); ctx.restore();
      }
    }
  }
  const c = g.getImageData(0, 0, W, H).data, d = gi.getImageData(0, 0, W, H).data, out = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H * 4; i += 4) { out[i] = c[i]; out[i + 1] = c[i + 1]; out[i + 2] = c[i + 2]; out[i + 3] = d[i]; }
  const t = new THREE.DataTexture(out, W, H, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.flipY = false;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

// A soft round spot for snow and spray (white, falling off to nothing), shared.
let _soft = null;
export function softDot() {
  if (_soft) return _soft;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,0.85)'); r.addColorStop(0.8, 'rgba(255,255,255,0.2)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return (_soft = new THREE.CanvasTexture(c));
}

// A vertex-coloured standard material that glows a little in its own colours (as the kit's L.paint does), with a uniform
// tint over it all (the light changing: uTint) and a uniform lift to the glow (a heartbeat: uPulse). Not yet guarded:
// hand it to L.rig() or L.add() and the kit guards it.
export function tintedPaint({ rough = 0.6, glow = 0.32, flat = false, side = THREE.FrontSide, key = 'tinted' } = {}) {
  const u = { uTint: { value: new THREE.Color(1, 1, 1) }, uPulse: { value: 0 } };
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rough, metalness: 0, flatShading: flat, emissive: 0xffffff, emissiveIntensity: glow, side });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uTint; uniform float uPulse;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb *= uTint;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb * uTint * (1.0 + uPulse);');
  };
  m.customProgramCacheKey = () => 'life-' + key;
  m.userData.u = u;
  return m;
}
