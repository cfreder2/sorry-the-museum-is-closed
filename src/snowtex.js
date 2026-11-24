// What the snow shader (src/finish.js snowLook) reads: one small tile of wind-laid snow, worked out once at start-up.
//
// A height field that repeats without a seam: ripples lying across the wind (the tile's u runs down the wind), each with
// a long back and a short face, wandering and breaking up; a finer set between them; soft lumps; grain. Kept as its
// slope (red, green), its height (blue) and, in alpha, a thin scatter of single bright grains for the glitter. The
// shader lays it over the ground twice, at 2 m for the ripples a hand apart and at 13 m for the ridges a stride apart,
// each turned a little from the other, so the repeat does not show. Mip-mapped: far off it all averages away to
// smooth snow, and the scattered grains fade out with it.

import * as THREE from 'three';

// Smooth noise between -1 and 1 that repeats every P cells.
function pnoise(seed, P) {
  const at = (i, j) => { i = ((i % P) + P) % P; j = ((j % P) + P) % P; let n = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + seed) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 2147483648 - 1; };
  return (x, z) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz), a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
}
const ease = t => t * t * (3 - 2 * t);
const ridge = (t, peak) => t < peak ? ease(t / peak) : 1 - ease((t - peak) / (1 - peak));      // a long back, a short face

let made = null;
export function snowDetail() {
  if (made) return made;
  const S = 512, H = new Float32Array(S * S);
  const w1 = pnoise(3, 4), w2 = pnoise(5, 9), lump = pnoise(7, 6), g1 = pnoise(9, 48), g2 = pnoise(13, 128), amp = pnoise(17, 5), brk = pnoise(19, 14), amp2 = pnoise(23, 7), seg = pnoise(29, 63);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S, warp = 0.3 * w1(u * 4, v * 4) + 0.08 * w2(u * 9, v * 9);      // (gently: bent too far, a crest closes on itself into a ring)
    // (each crest runs a little way and gives out: where the ripples are at all, and then in lengths across the wind)
    const a = Math.max(0, Math.min(1, 0.45 + 0.9 * amp(u * 5, v * 5))) * Math.max(0, Math.min(1, 0.55 + 1.1 * seg(u * 3, v * 9))), a2 = Math.max(0, Math.min(1, 0.45 + 0.8 * amp2(u * 7, v * 7))) * Math.max(0, Math.min(1, 0.5 + 1.1 * seg(u * 9 + 4, v * 21)));
    const t1 = u * 11 + warp * 1.1 + 0.04 * brk(u * 14, v * 14), t2 = u * 29 + v * 3 + warp * 2.4;
    H[y * S + x] = 0.56 * a * ridge(t1 - Math.floor(t1), 0.72) + 0.16 * a2 * ridge(t2 - Math.floor(t2), 0.66) + 0.2 * (0.5 + 0.5 * lump(u * 6, v * 6)) + 0.05 * (0.5 + 0.5 * g1(u * 48, v * 48)) + 0.03 * (0.5 + 0.5 * g2(u * 128, v * 128));
  }
  const d = new Uint8Array(S * S * 4), byte = v => v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
  let seed = 90211; const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const k = y * S + x, xl = y * S + ((x + S - 1) % S), xr = y * S + ((x + 1) % S), yu = ((y + S - 1) % S) * S + x, yd = ((y + 1) % S) * S + x;
    d[k * 4] = byte(127.5 + (H[xr] - H[xl]) * 1700); d[k * 4 + 1] = byte(127.5 + (H[yd] - H[yu]) * 1700); d[k * 4 + 2] = byte(H[k] * 255);
    const r = rnd(); d[k * 4 + 3] = r > 0.989 ? byte(90 + rnd() * 165) : 0;
  }
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return made = t;
}
