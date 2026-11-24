// The hills, drawn (winter.js adds what this makes). hillshape.js is their shape: this reads the same function the
// car does, so the mesh is the ground.
//
// A mesh a hill, as before, and one material between them all. What makes a hill read as
// a hill and not as a cone of icing is worked out once per corner of the mesh and carried in an attribute, then
// roughened per pixel with a shared noise texture (kitlook.js):
//   * scoured: the windward side and the crests, where the wind has taken the loose snow off and left a blue glaze
//     with sastrugi streaks, which catches the moon;
//   * hollow: the gullies and the lee, where it has settled deep and soft, in shade;
//   * packed: the sled chute, the kicker on the summit and the boot track up the easy side, pressed grey and shiny;
//   * bare: on the sharpest scoured ribs the frozen grass shows through.
// And a second small mesh, instanced: the tufts of dead grass that stand out of the bare patches.
//
// hillMap(): the same heights as a texture, for the glitter's vertex shader (winter.js), which used to work the old
// cosine out for itself.

import * as THREE from 'three';
import { kitNoise, moonDir } from './kitlook.js';

const smooth = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

// The boot track: from the foot on the side people come from, in two lazy switchbacks to the summit. In the oval's
// own (t, angle) terms, so it follows whatever shape the hill has.
function bootTrack(s) {
  const f = s.form, pts = [], a = Math.cos(f.dir) * f.lean, b = Math.sin(f.dir) * f.lean;
  const th0 = f.dir + Math.PI * 0.62;
  for (let i = 0; i <= 40; i++) {
    const u = i / 40, t = 1 - u * 0.97, th = th0 + 0.5 * Math.sin(u * Math.PI * 2.2) * (0.3 + 0.7 * t);
    pts.push([s.cx + (a * (1 - t) + t * Math.cos(th)) * s.rx, s.cz + (b * (1 - t) + t * Math.sin(th)) * s.rz]);
  }
  return pts;
}
const distTo = (pts, x, z) => {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], ex = bx - ax, ez = bz - az, k = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez)));
    const q = Math.hypot(x - ax - ex * k, z - az - ez * k); if (q < d) d = q;
  }
  return d;
};

// What the surface is like at (x, z): [scoured, hollow, packed, bare], each 0..1, and the normal.
function lookAt(s, track, x, z, out) {
  const f = s.form, fn = s.fn, e = 0.3, h = fn(x, z);
  const hx0 = fn(x - e, z), hx1 = fn(x + e, z), hz0 = fn(x, z - e), hz1 = fn(x, z + e);
  const gx = (hx1 - hx0) / (2 * e), gz = (hz1 - hz0) / (2 * e), slope = Math.hypot(gx, gz);
  const convex = -(hx0 + hx1 + hz0 + hz1 - 4 * h) / (e * e);                       // 1/m: a crest is positive, a gully negative
  const wx = Math.cos(f.wind), wz = Math.sin(f.wind), windward = gx * wx + gz * wz;      // climbing as the wind goes: it blows onto this
  const p = f.parts(x, z), t = p ? p.t : 1, cut = p ? p.cut : 0, lip = p ? p.lip : 0, kick = p ? p.kick : 0, dr = p ? p.dr : 0;
  const body = smooth((1 - t) * 5) * smooth(t * 6 + 0.4), big = f.big ? 1 : 0.6;
  let scour = clamp01(windward * 1.5 + convex * 2.2 - 0.12) * body * big;
  let hollow = clamp01(-convex * 2.6 - 0.06 + dr * 0.25 + clamp01(-windward * 0.9 - 0.25) * 0.5) * smooth((1 - t) * 6);
  const path = track ? 1 - smooth((distTo(track, x, z) - 0.22) / 0.5) : 0;
  let packed = clamp01(cut * 1.1 + kick * 0.9 + path * 0.8 + lip * 0.15);
  if (f.chute) {      // where the chute runs out at the foot: trampled, a fan of it
    const c = f.chute, dx = x - c.x, dz = z - c.z, ca = dx * c.ux + dz * c.uz, cs = Math.abs(-dx * c.uz + dz * c.ux);
    packed = Math.max(packed, smooth((ca - c.to + 3.5) / 3) * smooth((c.to + 2.6 - ca) / 2.5) * (1 - smooth((cs - 0.6) / 1.6)) * 0.85);
  }
  // where the frozen grass may show: the windward ribs, well clear of the chute and the track (the shader picks patches out of this)
  const bare = clamp01(windward * 1.6 + convex * 1.5 + 0.1) * body * (f.big ? 1 : 0.7) * (1 - packed) * (1 - clamp01(cut + lip * 2));
  scour *= 1 - packed * 0.7; hollow *= 1 - packed;
  const l = Math.hypot(gx, 1, gz);
  out[0] = scour; out[1] = hollow; out[2] = packed; out[3] = bare; out[4] = -gx / l; out[5] = 1 / l; out[6] = -gz / l; out[7] = h; out[8] = t;
  void slope;
}

// Every shaped hill in the list: a mesh each (so one out of sight is not drawn), all with the one material.
let HILL_MAT = null, BLADE = null;
export function buildHills(hills, snowTex, museum) {
  const group = new THREE.Group(); group.name = 'hills';
  const o = new Float32Array(9);
  const mat = HILL_MAT || (HILL_MAT = hillLook(new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.3, 0.36, 0.52), emissiveIntensity: 0.55 }), museum));
  for (const s of hills) {
    if (!s.form) continue;
    const P = [], N = [], UV = [], K = [], I = [], tufts = [];
    const step = s.form.big ? 0.4 : 0.5, nx = Math.ceil((s.x1 - s.x0) / step) + 2, nz = Math.ceil((s.z1 - s.z0) / step) + 2;
    const X0 = s.cx - nx * step / 2, Z0 = s.cz - nz * step / 2, W = nx + 1;
    const track = s.form.big ? bootTrack(s) : null, inside = new Uint8Array(W * (nz + 1));
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = X0 + i * step, z = Z0 + j * step, q = Math.hypot((x - s.cx) / s.rx, (z - s.cz) / s.rz);
      lookAt(s, track, x, z, o);
      inside[j * W + i] = q < 1 ? 1 : 0;
      P.push(x, q < 1 ? o[7] + 0.004 : -0.02, z); N.push(o[4], o[5], o[6]); UV.push(x / 6, z / 6); K.push(o[0], o[1], o[2], o[3]);
      // dead grass standing out of the barest of the bare (a few dozen on a big hill, none on most swells)
      if (o[3] > 0.8 && ((i * 7 + j * 13) % 4) === 0) { const r = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453, rr = r - Math.floor(r); tufts.push(x + (rr - 0.5) * step, o[7], z + ((rr * 7.13) % 1 - 0.5) * step, rr); }
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
      if (!(inside[a] || inside[b] || inside[c] || inside[d])) continue;
      I.push(a, c, b, b, c, d);
    }
    if (!I.length) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); geo.setAttribute('aHill', new THREE.Float32BufferAttribute(K, 4));
    geo.setIndex(I);
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'hill'; mesh.matrixAutoUpdate = false; group.add(mesh);
    // The tufts: three bent blades each, crossed, one instanced mesh a hill. No collision: it is dead grass.
    const n = tufts.length / 4;
    if (n) {
      if (!BLADE) {
        const blade = new THREE.BufferGeometry(), bp = [], bn = [], bi = [];
        for (let k = 0; k < 3; k++) {
          const a = k * 2.1, c = Math.cos(a), sn = Math.sin(a), w = 0.012, lean = 0.05 + k * 0.02, i0 = bp.length / 3;
          for (const [u, v] of [[-1, 0], [1, 0], [-0.7, 0.55], [0.7, 0.55], [0, 1]]) { const hh = v * (0.11 + k * 0.025), out = lean * v * v; bp.push(c * u * w + sn * out + (k - 1) * 0.02, hh, sn * u * w - c * out); bn.push(0, 1, 0); }
          bi.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2, i0 + 2, i0 + 3, i0 + 4);
        }
        blade.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); blade.setAttribute('normal', new THREE.Float32BufferAttribute(bn, 3)); blade.setIndex(bi);
        BLADE = { geo: blade, mat: new THREE.MeshStandardMaterial({ color: 0xb09a5c, roughness: 0.9, emissive: 0x5a4e2a, emissiveIntensity: 0.9, side: THREE.DoubleSide }) };
      }
      const im = new THREE.InstancedMesh(BLADE.geo, BLADE.mat, n), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < n; i++) { const r = tufts[i * 4 + 3], sc = 0.7 + r * 0.9; im.setMatrixAt(i, M.compose(V.set(tufts[i * 4], tufts[i * 4 + 1] - 0.01, tufts[i * 4 + 2]), Q.setFromAxisAngle(Y, r * 40), S.set(sc, sc, sc))); }
      im.name = 'hill-tufts'; im.matrixAutoUpdate = false; group.add(im);
    }
  }
  return group;
}

// The snow material, taught the four things above. (snowLook, finish.js, is wrapped round it afterwards by look.js, as
// round every material that uses the museum's snow texture: the names here are its own.)
export function hillLook(mat, museum) {
  const u = { uKitN: { value: kitNoise() }, uHillWind: { value: new THREE.Vector2(Math.cos(0.32), Math.sin(0.32)) }, uHillMoon: { value: moonDir(museum) } };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aHill;\nvarying vec4 vHill;\nvarying vec3 vHillW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvHill = aHill;\nvHillW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uKitN;\nuniform vec2 uHillWind;\nuniform vec3 uHillMoon;\nvarying vec4 vHill;\nvarying vec3 vHillW;\nfloat hillIce, hillPack, hillBare;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          vec4 nA = texture2D(uKitN, vHillW.xz * 0.19), nB = texture2D(uKitN, vHillW.xz * 1.45 + 0.37);
          vec2 wq = vec2(dot(vHillW.xz, uHillWind), dot(vHillW.xz, vec2(-uHillWind.y, uHillWind.x)));
          float streak = texture2D(uKitN, wq * vec2(0.06, 0.7)).b, fine = texture2D(uKitN, wq * vec2(0.5, 4.5) + 0.21).g;
          hillIce = smoothstep(0.22, 0.7, vHill.x + (streak - 0.5) * 0.9);
          hillPack = smoothstep(0.3, 0.72, vHill.z + (nB.g - 0.5) * 0.4);
          float thin = vHill.w * 0.42 + nA.r * 0.62 + (nA.b - 0.5) * 0.2;                     // where the snow is thin: patches, picked out of the exposed ground
          hillBare = smoothstep(0.74, 0.86, thin + (nB.g - 0.5) * 0.22) * smoothstep(0.25, 0.6, nB.a + (thin - 0.8) * 2.0);
          vec3 was = max(diffuseColor.rgb, vec3(0.001));
          vec3 c = mix(was, was * vec3(0.6, 0.74, 0.96) * (0.72 + 0.5 * streak) * (0.9 + 0.2 * fine), hillIce * 0.85);
          c = mix(c, was * vec3(0.74, 0.79, 0.9) * (0.86 + 0.22 * nB.b), hillPack * 0.8);
          c *= 1.0 - 0.34 * vHill.y * (1.0 - hillPack);
          c *= 1.0 + 0.1 * (1.0 - hillIce) * (1.0 - hillPack) * (nB.r - 0.5);
          c = mix(c, vec3(0.31, 0.27, 0.15) * (0.55 + 0.9 * nB.g), hillBare);
          totalEmissiveRadiance *= c / was;
          diffuseColor.rgb = c;
          roughnessFactor = mix(roughnessFactor, 0.3, max(hillIce, hillPack * 0.7) * (1.0 - hillBare));
        }`)
      .replace('#include <opaque_fragment>', `{
          vec3 md = normalize((viewMatrix * vec4(uHillMoon, 0.0)).xyz);
          float gl = pow(max(dot(reflect(-md, normal), normalize(vViewPosition)), 0.0), 22.0);
          outgoingLight += vec3(0.42, 0.55, 0.9) * gl * (hillIce * 0.9 + hillPack * 0.45) * (1.0 - hillBare);
        }
        #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => 'hilllook'; mat.userData.kit = 'hill';
  return mat;
}

// The hills' heights as a texture (half floats, metres, read between the points): { tex, box: (x0, z0, 1/w, 1/h) }.
export function hillMap(hills, heightOf) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const h of hills) if (h.H) { x0 = Math.min(x0, h.x0 != null ? h.x0 : h.cx - h.rx); x1 = Math.max(x1, h.x1 != null ? h.x1 : h.cx + h.rx); z0 = Math.min(z0, h.z0 != null ? h.z0 : h.cz - h.rz); z1 = Math.max(z1, h.z1 != null ? h.z1 : h.cz + h.rz); }
  if (!(x1 > x0)) { x0 = z0 = 0; x1 = z1 = 1; }
  x0 -= 1; z0 -= 1; x1 += 1; z1 += 1;
  const step = Math.max(0.5, Math.sqrt((x1 - x0) * (z1 - z0) / 420000)), W = Math.ceil((x1 - x0) / step) + 1, H = Math.ceil((z1 - z0) / step) + 1;
  const d = new Uint16Array(W * H);
  for (const h of hills) {
    if (!h.H) continue;
    const a0 = h.x0 != null ? h.x0 : h.cx - h.rx, a1 = h.x1 != null ? h.x1 : h.cx + h.rx, b0 = h.z0 != null ? h.z0 : h.cz - h.rz, b1 = h.z1 != null ? h.z1 : h.cz + h.rz;
    for (let j = Math.max(0, Math.floor((b0 - z0) / step)); j <= Math.min(H - 1, Math.ceil((b1 - z0) / step)); j++) for (let i = Math.max(0, Math.floor((a0 - x0) / step)); i <= Math.min(W - 1, Math.ceil((a1 - x0) / step)); i++) {
      const y = heightOf(h, x0 + i * step, z0 + j * step); if (y > 0) { const v = THREE.DataUtils.toHalfFloat(y), k = j * W + i; if (THREE.DataUtils.fromHalfFloat(d[k]) < y) d[k] = v; }
    }
  }
  const tex = new THREE.DataTexture(d, W, H, THREE.RedFormat, THREE.HalfFloatType);
  tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  // texel centres sit on the sample points: u = (x - x0) / step + 0.5, over W
  return { tex, box: new THREE.Vector4(x0 - step / 2, z0 - step / 2, 1 / (W * step), 1 / (H * step)) };
}
