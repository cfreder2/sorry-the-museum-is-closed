// The finish: what makes the low-poly building read as a made thing, a lit toy diorama, rather than flat boxes.
//
//   * FinishPass, the last pass of the composer (it replaces OutputPass): tone mapping, then one grade over the whole
//     game (warm stays warm and cool stays cool, a little more contrast in the mids, a cool lift in the deepest shadow),
//     a light vignette, and the bloom added here rather than in its own pass, so it can be kept off the works.
//   * keepTrue(mat): a work of art writes 0 into the alpha of the frame. FinishPass shows those pixels exactly as the
//     plain tone mapping would, with no grade, no vignette and no bloom on them: a painting looks like the museum's image.
//   * roomShade(mat, room, k): the soft darkening where a room's walls meet its floor, its ceiling and each other, and a
//     faint unevenness in the plaster, worked out per pixel from the room's box (no extra geometry, no screen-space AO).
//   * relief(mat, k): a texture's own joints given depth (an emboss from the map itself: the lower lip of a joint
//     catches the light, the upper one is in shadow), and ground shade at the foot of a wall outdoors.
// Everything here costs a few instructions per pixel and no extra draw calls.

import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { plaster, softBox } from './textures.js';
import { snowDetail } from './snowtex.js';        // (the snow's own surface, for snowLook below)

// ------------------------------------------------------------------ the grade --

const FinishShader = {
  uniforms: {
    tDiffuse: { value: null }, tBloom: { value: null }, toneMappingExposure: { value: 1 },
    uBloom: { value: 1 }, uVig: { value: 0.2 }, uGrade: { value: 1 }, uDebug: { value: 0 },
  },
  vertexShader: /* glsl */`
    precision highp float;
    uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix;
    attribute vec3 position; attribute vec2 uv;
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform sampler2D tDiffuse; uniform sampler2D tBloom;
    uniform float uBloom; uniform float uVig; uniform float uGrade; uniform float uDebug;
    #include <tonemapping_pars_fragment>
    #include <colorspace_pars_fragment>
    varying vec2 vUv;
    // In display space (0..1, gamma 2.2), after tone mapping.
    vec3 grade(vec3 g) {
      float l = dot(g, vec3(0.2126, 0.7152, 0.0722));
      // warm and cool pulled apart: lamplight warmer, moonlit snow bluer, greys left grey
      float t = g.r - g.b;
      g += vec3(0.55, 0.08, -0.55) * t * 0.11;
      g = mix(vec3(l), g, 1.05);
      // the deepest shadows lean blue (night), never black-on-black
      float sh = 1.0 - smoothstep(0.0, 0.3, l);
      g += sh * vec3(-0.003, 0.005, 0.024);
      // mid-tone contrast, pivoting low so the shadows are not pushed down
      g += 0.55 * g * (1.0 - g) * (g - 0.22);
      return clamp(g, 0.0, 1.0);
    }
    void main() {
      vec4 src = texture2D(tDiffuse, vUv);
      float art = 1.0 - clamp(src.a, 0.0, 1.0);            // 1 on a work of art (keepTrue)
      vec3 hdr = src.rgb;
      vec3 plain = ACESFilmicToneMapping(hdr);
      vec3 lit = ACESFilmicToneMapping(hdr + texture2D(tBloom, vUv).rgb * uBloom);
      vec3 g = pow(max(lit, 0.0), vec3(1.0 / 2.2));
      g = mix(g, grade(g), uGrade);
      vec2 q = (vUv - 0.5) * vec2(1.0, 0.72);
      g *= 1.0 - uVig * smoothstep(0.32, 0.78, length(q) * 1.414);
      vec3 graded = pow(g, vec3(2.2));
      vec3 c = mix(graded, plain, art);
      if (uDebug > 0.5) c = mix(c * 0.35, vec3(1.0, 0.0, 0.3), art);
      gl_FragColor = sRGBTransferOETF(vec4(c, 1.0));
      // Dithered: the screen has 256 steps a colour, and the night is long slow ramps of dark blue (the sky, the fog, the
      // fall of a lamp's light), so without it each ramp shows as bands; and since the grade moves red and blue apart,
      // each colour's steps fall in different places and the bands come out tinted, like a rainbow (an iPhone's screen
      // shows it plainly). Less than one step of noise, the pattern different in each colour; never on a work of art.
      float n1 = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
      float n2 = fract(52.9829189 * fract(dot(gl_FragCoord.xy + vec2(17.0, 43.0), vec2(0.06711056, 0.00583715))));
      vec3 dn = vec3(n1 + n2 - 1.0, n2 - n1, n1 + n2 - 1.0) * vec3(1.0, 1.0, -1.0);
      gl_FragColor.rgb += dn * (1.0 / 255.0) * (1.0 - art);
    }`,
};

// `bloom`: the UnrealBloomPass ahead of this one. Its own additive blend onto the frame is switched off; its result is
// read here instead (renderTargetsHorizontal[0] holds the finished glow).
export class FinishPass extends Pass {
  constructor(bloom) {
    super();
    this.bloom = bloom;
    this.uniforms = THREE.UniformsUtils.clone(FinishShader.uniforms);
    this.material = new THREE.RawShaderMaterial({ name: 'FinishShader', uniforms: this.uniforms, vertexShader: FinishShader.vertexShader, fragmentShader: FinishShader.fragmentShader,
      defines: { SRGB_TRANSFER: '', ACES_FILMIC_TONE_MAPPING: '' } });
    this.fsQuad = new FullScreenQuad(this.material);
    if (bloom) bloom.blendMaterial.colorWrite = false;
    if (typeof location !== 'undefined' && /[?&]artmask\b/.test(location.search)) this.uniforms.uDebug.value = 1;      // a test switch: show which pixels are kept true
  }
  render(renderer, writeBuffer, readBuffer) {
    const u = this.uniforms, b = this.bloom;
    u.tDiffuse.value = readBuffer.texture;
    u.toneMappingExposure.value = renderer.toneMappingExposure;
    const on = !!(b && b.enabled && b.strength > 0);
    u.uBloom.value = on ? 1 : 0;
    u.tBloom.value = b ? b.renderTargetsHorizontal[0].texture : null;
    if (this.renderToScreen) renderer.setRenderTarget(null);
    else { renderer.setRenderTarget(writeBuffer); if (this.clear) renderer.clear(); }
    this.fsQuad.render(renderer);
  }
  dispose() { this.material.dispose(); this.fsQuad.dispose(); }
}

// ------------------------------------------------------------ works kept true --

// A work of art: written with alpha 0, which FinishPass reads as "show exactly as it is".
export function keepTrue(mat) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n\tgl_FragColor.a = 0.0;');
  };
  const key = 'art-true|' + (prev ? prev.toString() : '');
  mat.customProgramCacheKey = () => key;
  return mat;
}

// ------------------------------------------------------------ room shading --

let plasterTex = null;
const shared = () => plasterTex || (plasterTex = plaster());

// k: { floor: [strength, reach m], ceil: [strength, reach], corner: [strength, reach], grain: amount of plaster unevenness }
export function roomShade(mat, room, k = {}) {
  const f = k.floor || [0.42, 0.7], c = k.ceil || [0.36, 0.55], n = k.corner || [0.3, 0.5], grain = k.grain == null ? 0.1 : k.grain;
  const u = {
    uAoBox: { value: new THREE.Vector4(room.x0, room.x1, room.z0, room.z1) },
    uAoY: { value: new THREE.Vector2(room.y, room.h) },
    uAoF: { value: new THREE.Vector4(f[0], f[1], c[0], c[1]) },
    uAoC: { value: new THREE.Vector3(n[0], n[1], grain) },
    uPlaster: { value: shared() },
  };
  mat.userData.shade = u;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vAoW;\nvarying vec3 vAoN;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvAoW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvAoN = mat3(modelMatrix) * objectNormal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vAoW;\nvarying vec3 vAoN;\nuniform vec4 uAoBox;\nuniform vec2 uAoY;\nuniform vec4 uAoF;\nuniform vec3 uAoC;\nuniform sampler2D uPlaster;\nfloat aoFall(float d, float r) { float s = 1.0 - smoothstep(0.0, r, d); return s * s; }')
      .replace('#include <opaque_fragment>', `{
          vec3 p = vAoW, nn = normalize(vAoN);
          float wy = 1.0 - abs(nn.y), wx = 1.0 - abs(nn.x), wz = 1.0 - abs(nn.z);
          float ao = (1.0 - uAoF.x * wy * aoFall(p.y - uAoY.x, uAoF.y)) * (1.0 - uAoF.z * wy * aoFall(uAoY.x + uAoY.y - p.y, uAoF.w));
          float cn = wx * aoFall(min(p.x - uAoBox.x, uAoBox.y - p.x), uAoC.y) + wz * aoFall(min(p.z - uAoBox.z, uAoBox.w - p.z), uAoC.y);
          ao *= 1.0 - uAoC.x * min(cn, 1.0);
          vec2 pw = vec2(p.x * wx + p.z * wz, p.y * wy + p.z * (1.0 - wy));
          float pl = texture2D(uPlaster, pw * 0.29).r * 0.65 + texture2D(uPlaster, pw * 0.071 + 0.37).r * 0.35;
          outgoingLight *= ao * (1.0 + uAoC.z * (pl - 0.5) * 2.0);
        }
        #include <opaque_fragment>`);
  };
  const key = 'roomshade|' + (prev ? prev.toString() : ''); mat.customProgramCacheKey = () => key;
  return u;
}

// ----------------------------------------------------------- contact shade --

// Baked contact shadows: black decals with soft edges, lying 1 cm off the surface they darken. Where a wall meets
// the floor, round a door's stone surround and a picture's frame on the wall, under plinths, benches and furniture.
// Each is a soft box cut into nine (the corners and edges fade, the middle is solid), so the fade keeps its width
// whatever the size of the box. They are batched by level and 48 m patch, one mesh each, so what is off screen is
// culled, and they fade out with distance.
export function shadeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: softBox() }, uFar: { value: new THREE.Vector2(26, 46) }, uShadeK: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float shade; uniform vec2 uFar; uniform float uShadeK; varying vec2 vUv; varying float vK;
      void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vK = shade * uShadeK * (1.0 - smoothstep(uFar.x, uFar.y, -mv.z)); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      uniform sampler2D map; varying vec2 vUv; varying float vK;
      void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, texture2D(map, vUv).a * vK); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
}

export class ShadeSet {
  constructor(cell = 48) { this.cell = cell; this.chunks = new Map(); this.count = 0; }
  _at(x, y, z) {
    const key = Math.floor(x / this.cell) + ',' + Math.floor(z / this.cell) + ',' + Math.round(y / 4);
    let c = this.chunks.get(key); if (!c) this.chunks.set(key, c = { p: [], uv: [], k: [], idx: [] });
    return c;
  }
  // P: a point; U, V: unit axes of the plane through it. The solid box is u0..u1 by v0..v1 (in metres along U and V);
  // it fades out over mL, mR, mB, mT beyond each side (0: no fade that side). k: how dark at most.
  soft(P, U, V, u0, u1, v0, v1, mL, mR, mB, mT, k, centre = true) {
    if (u1 < u0 || v1 < v0 || k <= 0) return;
    const c = this._at(P[0] + U[0] * (u0 + u1) / 2 + V[0] * (v0 + v1) / 2, P[1] + U[1] * (u0 + u1) / 2 + V[1] * (v0 + v1) / 2, P[2] + U[2] * (u0 + u1) / 2 + V[2] * (v0 + v1) / 2);
    const us = [[u0 - mL, u0, 0, 0.25, mL], [u0, u1, 0.5, 0.5, u1 - u0], [u1, u1 + mR, 0.75, 1, mR]];
    const vs = [[v0 - mB, v0, 0, 0.25, mB], [v0, v1, 0.5, 0.5, v1 - v0], [v1, v1 + mT, 0.75, 1, mT]];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const a = us[i], b = vs[j];
      if (a[4] < 0.005 || b[4] < 0.005 || (!centre && i === 1 && j === 1)) continue;
      const n = c.p.length / 3;
      for (const [s, t] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
        const u = a[s], v = b[t];
        c.p.push(P[0] + U[0] * u + V[0] * v, P[1] + U[1] * u + V[1] * v, P[2] + U[2] * u + V[2] * v);
        c.uv.push(a[2 + s], b[2 + t]); c.k.push(k);
      }
      c.idx.push(n, n + 1, n + 2, n, n + 2, n + 3); this.count++;
    }
  }
  meshes(mat) {
    const out = [];
    for (const c of this.chunks.values()) {
      if (!c.idx.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(c.p, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(c.uv, 2));
      g.setAttribute('shade', new THREE.Float32BufferAttribute(c.k, 1));
      g.setIndex(c.idx); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat); m.matrixAutoUpdate = false; m.renderOrder = 1; out.push(m);
    }
    this.chunks.clear();
    return out;
  }
}

// ------------------------------------------------------------------- relief --

const MOON_GLSL = '#define MOON vec3(0.13, 0.18, 0.32)\n';

// k: { depth: emboss strength, foot: [strength, reach m] of the shade at the foot of an outside wall (0: none), y0: ground level,
//      rim: a rim of cool moonlight on faces seen at a glance (0: none) }
export function relief(mat, k = {}) {
  const map = mat.map; if (!map) return mat;
  const depth = k.depth == null ? 1.6 : k.depth, foot = k.foot || [0, 1], y0 = k.y0 || 0, px = k.px || 512;
  const u = { uRel: { value: new THREE.Vector4(depth, foot[0], foot[1], y0) }, uRelPx: { value: 1.5 / px }, uRim: { value: k.rim || 0 } };
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vRelY;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvRelY = (modelMatrix * vec4(transformed, 1.0)).y;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', MOON_GLSL + '#include <common>\nuniform vec4 uRel;\nuniform float uRelPx;\nuniform float uRim;\nvarying float vRelY;')
      .replace('#include <opaque_fragment>', `{
          vec2 ruv = vMapUv;
          vec3 w = vec3(0.299, 0.587, 0.114);
          float h0 = dot(texture2D(map, ruv).rgb, w);
          float hu = dot(texture2D(map, ruv + vec2(-0.5, 1.0) * uRelPx).rgb, w);
          float rel = clamp(1.0 + (h0 - hu) * uRel.x, 0.72, 1.22);
          float foot = 1.0 - uRel.y * pow(1.0 - smoothstep(0.0, uRel.z, vRelY - uRel.w), 2.0);
          outgoingLight *= rel * foot;
          float fres = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 3.0);
          outgoingLight += MOON * fres * uRim * rel;
        }
        #include <opaque_fragment>`);
  };
  const key = 'relief|' + (prev ? prev.toString() : '');
  mat.customProgramCacheKey = () => key;
  return mat;
}

// ---------------------------------------------------------------------- snow --

// Snow anywhere it is drawn with the museum's snow texture (src/look.js finds them): drifts, a slow unevenness over
// the ground in world space, so a field of snow is not one flat colour; and the cool sheen of moonlit snow towards
// the horizon, which is also what ties the far snow into the night sky.
const MOON_DIR = { value: new THREE.Vector3(0.83, 0.3, -0.33).normalize() };
export function setMoon(dir) { MOON_DIR.value.copy(dir).normalize(); }
//
// And the snow's own surface, from one small tile of wind-laid snow (src/snowtex.js) read twice, at 2 m and at 13 m,
// each turned a little from the other: ripples a hand apart and ridges a stride apart lying across the wind (it is off
// the lake: land.js WIND), each lit on the side it turns to the moon and in blue shade on the side it turns away, so
// they read from a toy's height; the hollows between them a little darker, the crests a little lighter; windcrust in
// patches, smoother and with more of a sheen, and loose powder between; and single grains that flash as the eye moves
// past them. All of it only on snow that faces up, and all of it gone to smooth snow far off (the tile is mip-mapped).
// Three texture reads in all (there were two before).
// opts: { drift: how uneven (0: none, for ice), moon: how strongly slopes are shaded from the moon, sheen: the glance,
//         ripple: the wind's ripples and ridges (0: none), glitter: the grains that flash (0: none) }
export function snowLook(mat, opts = {}) {
  if (mat.userData.snowLook) return mat;          // (once only: src/look.js also wraps every snow-mapped material, and a second wrap redefines its varyings)
  mat.userData.snowLook = true;
  const o = { drift: 2.4, moon: 0.9, sheen: 0.55, ...opts };
  if (o.ripple == null) o.ripple = o.drift ? 1 : 0;
  if (o.glitter == null) o.glitter = o.drift ? 1 : 0;
  const u = { uDrift: { value: shared() }, uSnowD: { value: snowDetail() }, uMoonDir: MOON_DIR, uSnowK: { value: new THREE.Vector3(o.drift, o.moon, o.sheen) }, uSnowQ: { value: new THREE.Vector2(o.ripple, o.glitter) } };
  mat.userData.snowUniforms = u;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vSnowW;\nvarying vec3 vSnowN;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvSnowW = (modelMatrix * vec4(transformed, 1.0)).xz;\nvSnowN = (vec4(transformedNormal, 0.0) * viewMatrix).xyz;');      // (in world space, with any instancing)
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', MOON_GLSL + '#include <common>\nuniform sampler2D uDrift;\nuniform sampler2D uSnowD;\nuniform vec3 uMoonDir;\nuniform vec3 uSnowK;\nuniform vec2 uSnowQ;\nvarying vec2 vSnowW;\nvarying vec3 vSnowN;')
      .replace('#include <opaque_fragment>', `{
          vec3 sn = normalize(vSnowN);
          float dr = texture2D(uDrift, vSnowW * 0.017 + 0.31).r;      // (one read where there were two: the finer unevenness is the ridges' now)
          // down the wind and across it; the tile at 13 m, then at 2 m, turned and nudged by the first so the two never line up
          vec2 wu = vec2(-0.9435 * vSnowW.x + 0.3313 * vSnowW.y, -0.3313 * vSnowW.x - 0.9435 * vSnowW.y);
          // (stretched and squeezed along the wind from place to place, so the ridges are closer here and wider there)
          vec2 wq = wu + vec2(3.2 * sin(wu.x * 0.11 + wu.y * 0.045) + 1.6 * sin(wu.y * 0.19), 1.4 * sin(wu.x * 0.15));
          vec4 d2 = texture2D(uSnowD, wq * vec2(0.077, 0.063) + 0.37);
          vec4 d1 = texture2D(uSnowD, mat2(0.9, 0.31, -0.31, 0.9) * (wu + (wq - wu) * 0.3) * 0.52 + (d2.xy - 0.5) * 0.05);
          float up = clamp(sn.y * 1.6 - 0.6, 0.0, 1.0), crust = smoothstep(0.44, 0.6, dr);
          // where there are ripples at all (in patches: smooth powder between), and how sharp: more on a face turned up
          // the wind, dying out in the lee of whatever the snow lies against
          float pm = sin(vSnowW.x * 0.093 + 2.0 * sin(vSnowW.y * 0.071)) * sin(vSnowW.y * 0.117 + 1.7 * sin(vSnowW.x * 0.053));
          float rip = smoothstep(-0.32, 0.38, pm + (dr - 0.5) * 1.6) * clamp(0.75 + dot(sn.xz, vec2(0.9435, -0.3313)) * 5.0, 0.12, 1.7) * up * uSnowQ.x;
          // how far each turns the snow's face to the moon (the moon's bearing, down the wind and across it)
          vec2 mu = vec2(-0.9435 * uMoonDir.x + 0.3313 * uMoonDir.z, -0.3313 * uMoonDir.x - 0.9435 * uMoonDir.z);
          float far = 1.0 - smoothstep(40.0, 110.0, length(vViewPosition));      // (from a drone's height the ridges would show their repeat: they go)
          float sl = -(dot(d2.xy - 0.5, mu) * 0.95 * far * rip + dot(d1.xy - 0.5, mat2(0.9, 0.31, -0.31, 0.9) * mu) * 0.85 * (1.0 - 0.5 * crust) * (0.25 * up * uSnowQ.x + 0.75 * rip));
          vec3 lit = outgoingLight * (mix(1.0, 0.93, step(0.01, uSnowK.x)) * (1.0 + (dr - 0.5) * uSnowK.x));
          // the moon low in the east: slopes that face it are brighter, slopes turned from it fall into blue shade (flat snow unchanged)
          float mo = clamp(dot(sn, uMoonDir) - uMoonDir.y, -0.5, 0.6) * uSnowK.y + sl;
          lit *= (1.0 + max(mo, 0.0)) * mix(vec3(1.0), vec3(0.52, 0.64, 0.9), clamp(-mo * 1.25, 0.0, 0.8));
          lit *= 1.0 + (d2.b * 0.6 * far + d1.b * 0.4 - 0.3) * 0.3 * rip;      // shadow in the hollows
          float fres = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 4.0);
          lit += MOON * fres * uSnowK.z * mix(0.8, 1.45, crust * up);
          // glitter: each grain shows only from certain directions
          vec3 ve = normalize(vViewPosition) * mat3(viewMatrix);
          float gate = fract(d1.a * 43.0 + dot(ve.xz, vec2(11.0, 7.0)) * (2.0 + d1.a * 6.0) + ve.y * 5.0);
          lit += vec3(0.85, 0.95, 1.2) * (d1.a * d1.a * smoothstep(0.72, 1.0, gate) * 2.6 * up * uSnowQ.y);
          outgoingLight = lit;
        }
        #include <opaque_fragment>`);
  };
  const key = 'snowlook|' + (prev ? prev.toString() : '');
  mat.customProgramCacheKey = () => key;
  return mat;
}
