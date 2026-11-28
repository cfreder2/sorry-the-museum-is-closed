// Ice, looked into. One shader for every sheet of it out of doors (the harbour, the pond the hockey is played on):
// laid over a MeshStandardMaterial, so the headlamp, the fog and the tone mapping treat it as they treat everything.
//
//   * Black ice has depth. The cracks are white lines at the surface with the crack plane going down under them: the
//     same picture read three more times, each further along the line of sight as it is bent into the ice (Snell, 1.31)
//     and each softer, so a crack leans away under you as you drive over it. Bubbles hang at two depths the same way.
//   * It mirrors. The floor mirror the building's polished floors use (reflect.js) is already drawn every frame at
//     ground level: the ice reads it, by Fresnel, so from a toy's eye the far ice carries the skyline, the moon, the
//     harbour light and its beam. With the mirror off (settings, or a slow machine) it takes the sky's colour and a
//     moon road worked out in the shader instead.
//   * Snow lies on it: where, and how milky or shattered the ice is, comes from a zone map (the harbour's is
//     icefield.js's, the bytes the car's grip is read from). The drifts' edges are combed out down the wind and feather
//     to a dusting with the ice showing through; the side of a drift towards the moon is lit and the far side shaded,
//     which is what gives a few millimetres of snow its thickness.
//   * A pond that is skated on has none of that: no zone map, a constant instead, and its scratches turned up.
//
// Ten texture reads a pixel, no loops, no extra draw. The pictures are made once, here, by hand.

import * as THREE from 'three';
import { once } from './budget.js';      // (a canvas painted once: on a phone it is let go once it is on the graphics card)

const hash = (i, j, s) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

let CRACKS = null, NOISE = null;

// What is in the ice, one tile to TILE metres: red, the fractures (long thermal cracks that wander and fork, hairlines
// between them, and the hackle feathering off each); green, bubbles in clusters; blue, what has been done to its
// surface (the long arcs of skates and tyres, scuffs, and a grain of frost).
function cracks() {
  if (CRACKS) return CRACKS;
  const S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'), r = rng(4611);
  c.fillStyle = '#000'; c.fillRect(0, 0, S, S); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
  const wrap = (x0, y0, x1, y1, draw) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) if (x1 + ox > -4 && x0 + ox < S + 4 && y1 + oy > -4 && y0 + oy < S + 4) { c.save(); c.translate(ox, oy); draw(); c.restore(); } };
  const path = (pts, w, col) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    wrap(x0, y0, x1, y1, () => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }); };
  // a crack: it runs nearly straight, kinks now and then, forks, and thins towards its end
  const crack = (x, y, a, len, w, depth) => {
    let run = 0; const pts = [[x, y]];
    while (run < len) {
      const l = 10 + r() * 22; a += (r() - 0.5) * 0.2 + (r() < 0.12 ? (r() - 0.5) * 1.1 : 0);
      x += Math.cos(a) * l; y += Math.sin(a) * l; run += l; pts.push([x, y]);
      if (depth < 2 && r() < 0.07) crack(x, y, a + (r() < 0.5 ? 1 : -1) * (0.45 + r() * 0.8), len * (0.2 + r() * 0.35), w * 0.7, depth + 1);
      if (r() < 0.6) { const n = a + Math.PI / 2 * (r() < 0.5 ? 1 : -1) + (r() - 0.5) * 0.6, hl = 2 + r() * 7 * w; path([[x, y], [x + Math.cos(n) * hl, y + Math.sin(n) * hl]], 0.9, `rgba(255,0,0,${0.16 + r() * 0.2})`); }      // hackle
    }
    const k = Math.max(2, Math.floor(pts.length * 0.75));
    path(pts.slice(0, k + 1), w, 'rgba(255,0,0,0.92)'); path(pts.slice(k), w * 0.6, 'rgba(255,0,0,0.7)');
  };
  for (let i = 0; i < 5; i++) crack(r() * S, r() * S, r() * 6.283, 500 + r() * 800, 1.3 + r() * 0.9, 0);
  for (let i = 0; i < 22; i++) crack(r() * S, r() * S, r() * 6.283, 40 + r() * 150, 0.8 + r() * 0.5, 2);
  // bubbles: clusters where the gas came up while it froze, and loose ones
  const dot = (x, y, rad, a) => wrap(x - rad, y - rad, x + rad, y + rad, () => { c.fillStyle = `rgba(0,255,0,${a})`; c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill(); });
  for (let i = 0; i < 150; i++) { const cx = r() * S, cy = r() * S, sp = 8 + r() * 34, n = 5 + Math.floor(r() * 26); for (let k = 0; k < n; k++) { const a = r() * 6.283, d = sp * Math.sqrt(-Math.log(1 - r() * 0.98)) * 0.6; dot(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.8 + r() * r() * 3.2, 0.35 + r() * 0.5); } }
  for (let i = 0; i < 1300; i++) dot(r() * S, r() * S, 0.6 + r() * 1.3, 0.2 + r() * 0.4);
  // the surface: long shallow arcs, and scuffs
  for (let i = 0; i < 30; i++) { const x = r() * S, y = r() * S, a = r() * 6.283, R = 250 + r() * 900, sw = (0.25 + r() * 0.6) * (r() < 0.5 ? 1 : -1), pts = []; for (let k = 0; k <= 18; k++) { const t = a + sw * k / 18; pts.push([x + Math.cos(t) * R - Math.cos(a) * R, y + Math.sin(t) * R - Math.sin(a) * R]); } path(pts, 1 + r() * 0.8, `rgba(0,0,255,${0.4 + r() * 0.35})`); if (r() < 0.5) path(pts.map(([px, py]) => [px + 3.2, py + 2.1]), 0.9, `rgba(0,0,255,${0.25 + r() * 0.2})`); }
  for (let i = 0; i < 260; i++) { const x = r() * S, y = r() * S, a = r() * 6.283, l = 5 + r() * 28; path([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], 0.8, `rgba(0,0,255,${0.15 + r() * 0.3})`); }
  c.globalCompositeOperation = 'source-over';
  { const img = c.getImageData(0, 0, S, S), d = img.data; for (let i = 0, k = 0; i < S * S; i++, k += 4) { d[k + 2] = Math.min(255, d[k + 2] + hash(i % S, (i / S) | 0, 3) * 46); d[k + 3] = 255; } c.putImageData(img, 0, 0); }      // frost: a grain on the surface
  const t = new THREE.CanvasTexture(once(cv)); t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return (CRACKS = t);
}

// Three noises in one small tile, each smooth and each wrapping: red and green broad (two octaves, unlike each other),
// blue fine.
export function noises() {
  if (NOISE) return NOISE;
  const S = 256, d = new Uint8Array(S * S * 4);
  const val = (x, y, per, s) => { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = (a, b) => hash(((a % per) + per) % per, ((b % per) + per) % per, s);
    return (w(i, j) * (1 - u) + w(i + 1, j) * u) * (1 - v) + (w(i, j + 1) * (1 - u) + w(i + 1, j + 1) * u) * v; };
  const oct = (x, y, f, s) => val(x * f / S, y * f / S, f, s) * 0.55 + val(x * f * 2 / S, y * f * 2 / S, f * 2, s + 1) * 0.3 + val(x * f * 4 / S, y * f * 4 / S, f * 4, s + 2) * 0.15;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const k = (y * S + x) * 4; d[k] = oct(x, y, 4, 10) * 255; d[k + 1] = oct(x, y, 6, 20) * 255; d[k + 2] = (val(x * 32 / S, y * 32 / S, 32, 30) * 0.6 + val(x * 64 / S, y * 64 / S, 64, 31) * 0.4) * 255; d[k + 3] = 255; }
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return (NOISE = t);
}

// An ice field's look (icefield.js) as the shader's zone map.
export function zoneTexture(F) {
  const t = new THREE.DataTexture(F.data, F.nx, F.nz, THREE.RGBAFormat);
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}

const MOON = { value: new THREE.Vector3(631, 162, -90) };
/** Where the moon hangs (it is a real ball in the sky, not far off: museum.js moonAt; harbour.js passes it on). */
export function iceMoon(at) { MOON.value.copy(at); }

// o: { mirror: the FloorMirror (reflect.js) or nothing; field: an ice field (icefield.js) or nothing;
//      zone: [snow, milk, lead, shattered] where there is no field; rim: [x, z, rx, rz] an oval the snow is banked
//      round (the pond); tile: metres to one tile of cracks; scratch: how scored the surface is; gloss: how much it
//      mirrors; snow: how bright its snow (to sit beside the museum's snow texture) }
export function iceMaterial(o = {}) {
  const F = o.field || null, M = o.mirror || null;
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, emissive: 0xffffff, emissiveIntensity: 1, ...(o.params || {}) });
  const u = {
    uIceC: { value: cracks() }, uIceN: { value: noises() }, uIceZ: { value: F ? (F.texture || (F.texture = zoneTexture(F))) : null },
    uIceZB: { value: F ? new THREE.Vector4(F.x0, F.z0, 1 / (F.nx * 0.25), 1 / (F.nz * 0.25)) : new THREE.Vector4(...(o.rim || [0, 0, 1, 1])) },
    uIceZ0: { value: new THREE.Vector4(...(o.zone || [0.2, 0.3, 0, 0.4])) },
    uIceK: { value: new THREE.Vector4(o.scratch == null ? 0.1 : o.scratch, o.gloss == null ? 1 : o.gloss, o.crack == null ? 1 : o.crack, o.tile || 9) },
    uIceSnow: { value: o.snow == null ? 1 : o.snow },
    uIceRefl: { value: M ? M.rt.texture : null }, uIceRM: { value: M ? M.matrix : new THREE.Matrix4() }, uIceOn: M ? M.strength : { value: 0 }, uIceY: M ? M.level : { value: 0 },
    uIceMoon: MOON,
  };
  mat.userData.ice = u;
  mat.defines = { ...(mat.defines || {}), ...(F ? { ICE_ZONE: '' } : {}), ...(o.rim ? { ICE_RIM: '' } : {}), ...(M ? { ICE_MIRROR: '' } : {}) };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 uIceRM;\nvarying vec3 vIceW;\nvarying vec3 vIceN;\nvarying vec4 vIceR;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 iw = modelMatrix * vec4(transformed, 1.0); vIceW = iw.xyz; vIceR = uIceRM * iw; vIceN = normalize(mat3(modelMatrix) * objectNormal); }');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uIceC, uIceN, uIceZ, uIceRefl;
        uniform vec4 uIceZB, uIceZ0, uIceK;
        uniform float uIceSnow, uIceOn, uIceY;
        uniform vec3 uIceMoon;
        varying vec3 vIceW; varying vec3 vIceN; varying vec4 vIceR;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec2 ip = vIceW.xz;
        vec3 iV = cameraPosition - vIceW; float iDist = length(iV); iV /= iDist;
        float iCos = clamp(iV.y, 0.02, 1.0);
        vec3 iMoon = normalize(uIceMoon - vIceW); vec2 iMoonXZ = normalize(iMoon.xz);
        #ifdef ICE_ZONE
          vec2 zuv = (ip - uIceZB.xy) * uIceZB.zw;
          vec4 iz = texture2D(uIceZ, zuv);
          float izM = texture2D(uIceZ, zuv + iMoonXZ * 0.45 * uIceZB.zw).r;      // the snow a step towards the moon
        #else
          vec4 iz = uIceZ0; float izM = iz.r;
          #ifdef ICE_RIM
            { float rd = length((ip - uIceZB.xy) / uIceZB.zw); iz.r = max(iz.r, smoothstep(0.9, 0.985, rd)); izM = max(izM, smoothstep(0.9, 0.985, length((ip + iMoonXZ * 0.3 - uIceZB.xy) / uIceZB.zw))); }
          #endif
        #endif
        vec3 nA = texture2D(uIceN, ip * 0.021).rgb;                                        // broad: 48 m to the tile
        vec2 wp = vec2(dot(ip, vec2(0.9701, 0.2425)), dot(ip, vec2(-0.2425, 0.9701)));     // across the wind, and down it
        vec3 nB = texture2D(uIceN, wp * vec2(0.21, 0.058) + nA.xy * 0.4).rgb;             // combed out down the wind
        // the snow that lies on it, its edge feathered; a dusting beyond that
        float sv = iz.r + (nB.g - 0.5) * 0.24 + (nB.b - 0.5) * 0.12;
        float iSnow = smoothstep(0.47, 0.56, sv);
        float iDust = smoothstep(0.39, 0.5, sv) * (1.0 - iSnow);
        float iSide = clamp((iz.r - izM) * 5.0, -1.0, 1.0) * smoothstep(0.3, 0.5, sv) * (1.0 - smoothstep(0.7, 0.95, sv));      // lit towards the moon, shaded away from it
        // into the ice, along the line of sight as it is bent going in
        float sinR = sqrt(1.0 - iCos * iCos) / 1.31;
        vec2 par = -normalize(iV.xz + 1e-5) * (sinR / sqrt(1.0 - sinR * sinR)) / uIceK.w;
        vec2 cuv = ip / uIceK.w;
        vec3 c0 = texture2D(uIceC, cuv).rgb; float scr = max(c0.b - 0.2, 0.0) * 1.25;      // the scoring, without the frost's grain
        vec3 c1 = texture2D(uIceC, cuv + par * 0.028, 0.6).rgb;
        vec3 c2 = texture2D(uIceC, cuv + par * 0.07, 1.5).rgb;
        vec3 c3 = texture2D(uIceC, cuv + par * 0.135, 2.4).rgb;
        float frac = (0.2 + 1.0 * iz.a) * uIceK.z * (0.25 + 0.75 * smoothstep(0.3, 0.62, nA.b + iz.a * 0.4));      // shattered here, whole there
        float curtain = c1.r * 0.6 + c2.r * 0.5 + c3.r * 0.42;
        float bub = c1.g * 0.55 + c3.g * 0.6;
        float milk = clamp(iz.g + (nA.r - 0.5) * 0.5, 0.0, 1.0);
        vec3 body = mix(vec3(0.004, 0.015, 0.027), vec3(0.011, 0.04, 0.056), nA.g);        // black ice: the dark water under it
        body = mix(body, vec3(0.075, 0.11, 0.15), milk * milk * 0.85);                       // white ice: air frozen into it
        body *= 1.0 - 0.7 * iz.b;                                                           // a refrozen lead: thin and new
        vec3 iceCol = body + vec3(0.36, 0.56, 0.7) * (curtain * frac * 0.5 + bub * 0.2 * (0.3 + milk)) * (1.0 - 0.55 * milk);
        iceCol += vec3(0.62, 0.74, 0.86) * (c0.r * frac * 0.55 + scr * uIceK.x * (1.0 - 0.5 * iz.b));
        iceCol += vec3(0.085, 0.11, 0.16) * iDust * (0.3 + 0.9 * nB.b);
        float iRough = mix(0.04 + c0.b * 0.08 + scr * uIceK.x * 1.5 + 0.35 * iDust, 0.95, iSnow);
        // snow: the museum's blue-white by moonlight, rippled; a glint here and there, near to
        vec3 snowCol = vec3(0.165, 0.2, 0.285) * uIceSnow * (0.74 + 0.3 * nB.r + 0.3 * (nB.b - 0.5) + 0.12 * nA.b + 0.3 * c0.b);
        snowCol *= 1.0 + 0.5 * iSide + 1.5 * clamp(dot(normalize(vIceN), iMoon) - iMoon.y, -0.5, 0.6) + clamp((vIceW.y - 0.03) * 1.6, 0.0, 0.3);      // (a slope is shaded from the moon; a crest stands a little brighter)
        { vec2 gc = floor(ip * 210.0); float gl = fract(sin(dot(gc, vec2(12.9898, 78.233))) * 43758.5453);
          snowCol += vec3(0.5, 0.56, 0.7) * step(0.992, gl) * step(0.5, fract(gl * 57.0 + dot(iV.xz, vec2(7.0, 5.0)) * 3.0)) * (1.0 - smoothstep(1.5, 5.0, iDist)); }
        diffuseColor.rgb = mix(iceCol * 2.0, vec3(0.86, 0.9, 0.96), iSnow);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n\troughnessFactor = iRough;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance = mix(iceCol, snowCol, iSnow);')
      .replace('#include <opaque_fragment>', `{
          float fres = 0.02 + 0.98 * pow(1.0 - iCos, 5.0);
          float gloss = (1.0 - iSnow) * (1.0 - 0.55 * iDust) * (1.0 - 0.5 * milk * milk) * uIceK.y * step(0.9, vIceN.y);
          vec3 rdir = reflect(-iV, vec3(0.0, 1.0, 0.0));
          vec3 rc = mix(vec3(0.02, 0.03, 0.085), vec3(0.075, 0.085, 0.17), pow(1.0 - rdir.y, 3.0)) + vec3(1.5, 1.6, 1.9) * pow(max(dot(rdir, iMoon), 0.0), 500.0) * (0.4 + nB.b);
          #ifdef ICE_MIRROR
            float on = uIceOn * (1.0 - step(0.08, abs(vIceW.y - uIceY)));
            if (on > 0.0) {
              vec2 ruv = vIceR.xy / vIceR.w + (nB.rb - 0.5) * (0.003 + 0.03 * iRough);
              vec3 mr = texture2D(uIceRefl, ruv, 0.6 + 5.0 * iRough).rgb * 0.6 + texture2D(uIceRefl, ruv - vec2(0.0, 0.014), 2.2 + 5.0 * iRough).rgb * 0.4;
              rc = mix(rc, min(mr, vec3(3.0)), on);
            }
          #endif
          outgoingLight = outgoingLight * (1.0 - 0.6 * fres * gloss) + rc * fres * gloss;
        }
        #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => 'icelook|' + (F ? 'z' : '') + (o.rim ? 'r' : '') + (M ? 'm' : '');
  return mat;
}

// Ice that has been broken off and stood up: the slabs and plates along the edge and rafted on the ridges, the lumps
// thrown out beside them, the floes. The same family as the sheet (its cracks and bubbles, its snow), but seen from
// the side. The geometry says what each point is, in its colour: red, how far it is a top that snow lies on; green,
// how thin the ice is there (a broken lip: the light comes through it blue-green, strongest looked at towards the
// moon); blue, how far down towards its foot (darker and greener, and wet where it meets the sheet or the water).
// The pattern is laid in the piece's own space, so it rides with a floe as it turns.
// o: { foot: the height (in the piece's own space) of what it stands in; patch: how much of a top the wind has swept
//      bare (0 none, 1 about half); scale: the pattern's; snow: how bright its snow }
export function iceBlockMaterial(o = {}) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, emissive: 0xffffff, emissiveIntensity: 1, vertexColors: true, ...(o.params || {}) });
  const u = { uIceC: { value: cracks() }, uIceN: { value: noises() }, uIceMoon: MOON, uBlk: { value: new THREE.Vector4(o.foot == null ? 0 : o.foot, o.patch == null ? 0.3 : o.patch, o.scale || 1, o.snow == null ? 1 : o.snow) } };
  mat.userData.iceBlock = u;
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBlkP;\nvarying vec3 vBlkN;\nvarying vec3 vBlkW;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        { vBlkP = transformed; vec3 bn = objectNormal; vec4 bw = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            bn = mat3(instanceMatrix) * bn; bw = instanceMatrix * bw;
          #endif
          vBlkN = normalize(mat3(modelMatrix) * bn); vBlkW = (modelMatrix * bw).xyz; }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uIceC, uIceN;\nuniform vec3 uIceMoon;\nuniform vec4 uBlk;\nvarying vec3 vBlkP;\nvarying vec3 vBlkN;\nvarying vec3 vBlkW;')
      .replace('#include <color_fragment>', `
        vec3 bN = normalize(vBlkN) * (gl_FrontFacing ? 1.0 : -1.0), bV = normalize(cameraPosition - vBlkW), bMoon = normalize(uIceMoon - vBlkW), bA = abs(bN);
        vec2 bp = (bA.y > 0.55 ? vBlkP.xz : (bA.x > bA.z ? vBlkP.zy : vBlkP.xy)) * uBlk.z;
        vec3 bc = texture2D(uIceC, bp * 0.31 + 0.13).rgb, bn = texture2D(uIceN, bp * 0.27).rgb;
        float bTop = vColor.r, bThin = vColor.g, bDeep = vColor.b, bLie = smoothstep(0.35, 0.8, bN.y);
        float bSnow = smoothstep(0.42, 0.6, bTop * bLie - (1.0 - bn.g) * uBlk.y * 1.2 + (bn.b - 0.5) * 0.25);
        vec3 bIce = mix(vec3(0.042, 0.078, 0.108), vec3(0.01, 0.04, 0.055), bDeep);                               // a milky core, darker and greener towards its foot
        bIce = mix(bIce, vec3(0.085, 0.12, 0.155), bn.r * bn.r * 0.85 * (1.0 - 0.6 * bDeep));
        bIce += vec3(0.03, 0.15, 0.18) * bThin * (0.4 + 2.2 * pow(max(dot(-bV, bMoon), 0.0), 2.0)) * (0.5 + 0.95 * bn.b);      // thin: the light comes through, most of all looked at towards the moon
        bIce += vec3(0.42, 0.58, 0.7) * (bc.r * 0.4 + bc.g * 0.12 * (1.0 - bThin));                                 // its fractures, the air in it
        bIce *= 1.0 - 0.5 * bTop * bLie;                                                                           // a top swept bare: looked down into, it is dark
        bIce *= (1.0 + 0.55 * clamp(dot(bN, bMoon), -0.35, 0.7)) * (1.0 - 0.7 * (1.0 - smoothstep(0.0, 0.045, vBlkP.y - uBlk.x)) * (1.0 - bLie));      // faces to the moon lit; wet and dark at the foot
        float bFrost = (1.0 - bLie) * max(1.0 - smoothstep(0.08, 0.6, bDeep), smoothstep(0.1, 0.9, dot(bN, vec3(0.2425, 0.0, -0.9701)))) * (0.25 + 0.9 * bn.g);      // frost on the upper part of a broken face, and rime on the side the wind is from
        vec3 bSnowCol = vec3(0.165, 0.2, 0.285) * uBlk.w * (0.76 + 0.3 * bn.r + 0.3 * (bn.b - 0.5) + 0.25 * bc.b) * (1.0 + 1.3 * clamp(dot(bN, bMoon) - bMoon.y, -0.5, 0.6));
        bIce = mix(bIce, bSnowCol * 0.8, bFrost * 0.6);
        diffuseColor.rgb = mix(bIce * 2.0, vec3(0.86, 0.9, 0.96), bSnow);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n\troughnessFactor = mix(0.08 + 0.3 * bc.b, 0.95, bSnow);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance = mix(bIce, bSnowCol, bSnow);')
      .replace('#include <opaque_fragment>', `{
          float fr = 0.02 + 0.98 * pow(1.0 - clamp(dot(bV, bN), 0.0, 1.0), 5.0); vec3 rd = reflect(-bV, bN);
          outgoingLight += (mix(vec3(0.02, 0.03, 0.085), vec3(0.075, 0.085, 0.17), pow(1.0 - abs(rd.y), 3.0)) + vec3(1.5, 1.6, 1.9) * pow(max(dot(rd, bMoon), 0.0), 160.0)) * fr * (1.0 - bSnow) * 0.85;
        }
        #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => 'iceblock';
  return mat;
}
