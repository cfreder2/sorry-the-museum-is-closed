// Gustave Caillebotte, Paris Street; Rainy Day (1877), Gallery 201. The word: puddle.
//
// Look at it and it rains in the gallery, out of the ceiling, in front of the picture (never in front of the canvas:
// from where you stand the rain falls everywhere but on it). The floor under the picture turns into Caillebotte's
// paving, setts laid one by one out from the wall, wet and shining, and puddles open in it that hold the room and the
// picture upside down. Then Parisians walk out from under the bottom rail, under their umbrellas, in the painting's
// smooth grey-blues: the couple first, arm in arm under one umbrella and walking towards you as they do in the
// picture, then a man in a frock coat, a woman, a man going about his business. They stroll the wet street, step
// round the puddles, and a gentleman raises his hat to the couple as they pass. When you stop looking they hurry
// back in under the frame out of the rain, the rain stops, and the street dries off the floor over half a minute
// (the toy can splash through the puddles meanwhile: they hold it back, as puddles do). The umbrellas on the hooks
// by the south wall open while it rains. Quiet rain, and drips into the puddles.
//
// This picture is also the second choice for the Director's secret (src/secretclue.js, src/secret.js: a touch on the
// lamp at the top of the lamp post opens the wall when it is the clue). Nothing here touches the picture or the
// pointer, so that still works exactly as it did.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, shape, canvasTexture, walk } from '../paintlife.js';

const OUT = 2.3, HALF = 2.2;           // the wet street: out from the wall, and either side of the middle (m)
const DROPS = 300, SPL = 24, RIPS = 16, SPLASH = 40, DRY = 32;
const S = 1.4, SC = 1.45;              // the Parisians' size: a man in his hat is 0.58 m, the toy's own height and a bit;
                                       // the couple, who walk towards you as in the picture, a little larger
// The puddles, in the stage's terms: [along, out, half length along the wall, half width out].
const PUDDLES = [[0.95, 1.05, 0.3, 0.16], [-1.05, 0.75, 0.34, 0.17], [1.45, 0.55, 0.26, 0.14], [-0.3, 1.25, 0.26, 0.13], [0.2, 0.75, 0.16, 0.09]];
// Who walks, and where: out of the wall under the frame, a pause to put the umbrella up, a stroll, and back in under
// the frame further along (along, out, and how long to stand at that point). The couple come towards you and stop.
const WALKS = [
  { who: 'couple', delay: 0.4, rest: 3, pts: [[0.36, -0.35], [0.36, 0.5, 0.9], [0.4, 1.25, 1.6], [0.1, 1.45], [-0.6, 1.4], [-1.4, 0.95], [-1.6, 0.3], [-1.6, -0.35]] },
  { who: 'man', delay: 1.3, rest: 2, pts: [[-0.85, -0.35], [-0.85, 0.5, 0.7], [-0.55, 0.95], [0.3, 1.02], [1.0, 1.38], [1.8, 1.2], [2.05, 0.5], [1.95, -0.35]] },
  { who: 'woman', delay: 2.1, rest: 4, pts: [[-1.55, -0.35], [-1.6, 0.5, 0.8], [-1.85, 1.0], [-1.5, 1.4], [-0.95, 1.45, 0.6], [-0.75, 0.98], [-0.5, 0.45], [-0.5, 0.1], [-0.5, -0.35]] },
  { who: 'walker', delay: 2.9, rest: 3, pts: [[1.05, -0.35], [1.05, 0.45, 0.6], [0.6, 0.42], [-0.6, 0.42], [-1.75, 0.45], [-2.05, 0.2], [-2.05, -0.35]] },
];

lifeFor(20684, {
  title: /^Paris Street; Rainy Day/,
  word: 'puddle',
  stage: { out: 1.7, half: 2.0, cam: { dist: 2.9, height: 1.3, side: 0.6, fov: 50, lookOut: 0.65, lookH: 0.55 } },
  wake: 2, ret: 2,
  secrets: [['rain', 'Rain indoors']],

  build(L) {
    const k = L.k, P = L.pal, room = L.room, y = L.y;
    const col = (hint, a = 0.45) => P.near(hint, a);
    // ---------------------------------------------------------- the street: setts, wet, with puddles in it
    const setts = canvasTexture(512, 512, (g, w, h) => {
      g.fillStyle = '#3a3c42'; g.fillRect(0, 0, w, h);                                                   // the joints
      const tones = ['#c4bab0', '#b3aaa2', '#a39b95', '#cdc3b8', '#9c9590', '#b8b0aa', '#a9a4a6'].map(c => col(c, 0.3).getStyle());
      const rows = 8, rh = h / rows, rects = [];
      for (let r = 0; r < rows; r++) {
        let x = -(r % 2) * 32 - L.rand() * 20;
        while (x < w) {
          const sw = 52 + L.rand() * 26, j = 4 + L.rand() * 2, R = [x + j / 2, r * rh + j / 2, sw - j, rh - j];
          g.fillStyle = tones[Math.floor(L.rand() * tones.length)]; g.beginPath(); g.roundRect(...R, 9); g.fill();
          g.fillStyle = 'rgba(255,255,255,0.16)'; g.beginPath(); g.roundRect(x + j + 2, r * rh + j, sw - 2 * j - 4, (rh - j) * 0.38, 7); g.fill();
          g.fillStyle = 'rgba(40,44,60,0.18)'; g.beginPath(); g.roundRect(x + j, r * rh + (rh - j) * 0.72, sw - 2 * j, (rh - j) * 0.24, 6); g.fill();
          rects.push(R); if (x + sw > w) rects.push([R[0] - w, R[1], R[2], R[3]]);          // (and its other half, round the edge)
          x += sw;
        }
      }
      // Each sett's own number in the alpha (the joints 1, last), so they can be laid, and dry, one at a time.
      const img = g.getImageData(0, 0, w, h), d = img.data;
      for (let i = 3; i < d.length; i += 4) d[i] = 255;
      for (const [x0, y0, rw, rh2] of rects) {
        const v = Math.round(255 * (0.35 + 0.6 * L.rand()));
        for (let py = Math.max(0, Math.ceil(y0 + 2)); py < Math.min(h, y0 + rh2 - 2); py++) for (let px = Math.max(0, Math.ceil(x0 + 2)); px < Math.min(w, x0 + rw - 2); px++) d[(py * w + px) * 4 + 3] = v;
      }
      g.putImageData(img, 0, 0);
    });
    setts.wrapS = setts.wrapT = THREE.RepeatWrapping; setts.repeat.set(2 * HALF / 0.85, OUT / 0.85); setts.anisotropy = 4;
    const origin = L.floor(0, 0);
    const u = this.u = {
      uSpread: { value: 0 }, uWet: { value: 0 }, uGrow: { value: 0 },
      uO: { value: origin }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uSize: { value: new THREE.Vector2(HALF, OUT) },
      uPud: { value: PUDDLES.map(p => new THREE.Vector4(...p)) }, uRip: { value: Array.from({ length: RIPS }, () => new THREE.Vector4(0, 0, 2, 0.1)) },
    };
    const street = new THREE.MeshStandardMaterial({ map: setts, transparent: true, depthWrite: false, roughness: 0.42, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    street.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform float uSpread, uWet, uGrow; uniform vec3 uO; uniform vec4 uAx; uniform vec2 uSize; uniform vec4 uPud[${PUDDLES.length}]; uniform vec4 uRip[${RIPS}];
uniform sampler2D tRefl; uniform mat4 reflMatrix; uniform float reflOn; uniform float reflY;
float lPud, lDry;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  float settN = sampledDiffuseColor.a;
  vec2 lq = lifeP.xz - uO.xz; float su = dot(lq, uAx.xy), so = dot(lq, uAx.zw);
  float rr = length(vec2(su / uSize.x, so / uSize.y));
  float laid = smoothstep(0.0, 0.03, uSpread * 1.2 - (rr * 0.82 + settN * 0.18));
  lDry = smoothstep(0.0, 0.05, uWet * 1.25 - (settN * 0.45 + rr * 0.55));
  float edge = 1.0 - smoothstep(0.84, 1.0, rr);
  lPud = 0.0;
  for (int i = 0; i < ${PUDDLES.length}; i++) { vec4 q = uPud[i]; vec2 d = vec2((su - q.x) / (q.z * uGrow + 1e-3), (so - q.y) / (q.w * uGrow + 1e-3)); float wob = 0.1 * sin(su * 11.0 + so * 7.0) + 0.06 * sin(so * 23.0 - su * 5.0); lPud = max(lPud, 1.0 - smoothstep(0.72, 1.0, length(d) + wob)); }
  lPud *= lDry;
  diffuseColor.a = opacity * laid * lDry * edge;
  diffuseColor.rgb *= mix(0.76, 0.22, lPud);
}`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.05, lPud);')
        .replace('#include <opaque_fragment>', `{
  float ring = 0.0; vec2 bend = vec2(0.0);
  for (int i = 0; i < ${RIPS}; i++) { vec4 R = uRip[i]; if (R.z >= 1.0) continue; vec2 dv = lifeP.xz - R.xy; float d = length(dv); float k = exp(-pow((d - R.z * R.w) / 0.006, 2.0)) * (1.0 - R.z); ring += k; bend += dv / max(d, 1e-3) * k; }
  vec4 rp = reflMatrix * vec4(lifeP, 1.0); vec2 ruv = rp.xy / rp.w + bend * 0.012;
  float on = reflOn * lDry * (1.0 - step(0.08, abs(lifeP.y - reflY)));
  vec3 sharp = min(texture2D(tRefl, ruv).rgb, vec3(2.5)), soft = min(texture2D(tRefl, ruv, 2.5).rgb, vec3(2.5));
  outgoingLight = (outgoingLight + diffuseColor.rgb * 0.16) * (1.0 - 0.5 * lPud) + mix(soft * 0.3, sharp * 0.9, lPud) * on + ring * vec3(0.3, 0.33, 0.37) * (0.25 + 0.75 * lPud) * lDry;
}
#include <opaque_fragment>`);
    };
    street.customProgramCacheKey = () => 'paris-street';
    this.street = L.decal({ w: 2 * HALF, d: OUT, u: 0, out: OUT / 2, material: street });
    Object.assign(u, L.mirrored(this.street));        // (the puddles hold the room upside down: the floor's own reflection)

    // ---------------------------------------------------------- rain, from the ceiling, in front of the picture
    const top = y + Math.min(room.ceil || 5, 5.2) - 0.25;
    this.top = top;
    this.drops = Array.from({ length: DROPS }, () => this.drop(L, { y: y + L.rand() * (top - y) }));
    // Each drop a streak drawn twice side by side (so it holds its width on a fine screen), brighter where it passes the
    // picture lights; and crowns of splashes where the heavier drops land; all one set of lines.
    const NSEG = SPL * 4 + DROPS * 2, rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NSEG * 6), 3).setUsage(THREE.DynamicDrawUsage));
    rg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(NSEG * 6), 3).setUsage(THREE.DynamicDrawUsage)); rg.setDrawRange(0, 0);
    this.rain = L.add(new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })));
    this.rainC = col('#c4d0dd', 0.2); this.splC = col('#d6e0ec', 0.2);
    this.lamps = k.museum.arts.filter(q => q.room === L.art.room && !q.obj && !q.mini).map(q => ({ x: q.x + q.nx * 0.25, y: q.y + q.h / 2 + (q.frame || 0.1) + 0.12, z: q.z + q.nz * 0.25 }));
    this.spl = Array.from({ length: SPL }, () => ({ age: 9, x: 0, y: 0, z: 0, a: 0 })); this.si = 0;
    this.rips = Array.from({ length: RIPS }, () => ({ age: 2, life: 0.6 })); this.ri = 0;

    // ---------------------------------------------------------- the Parisians
    const coat = col('#2f3439'), trouser = col('#8d8a85', 0.35), dark = col('#33373d'), skin = col('#d8b29a', 0.3), hatc = col('#1d1e21', 0.3), white = col('#e9e6df', 0.3);
    const dress = col('#4d443e'), fur = col('#2c2622', 0.3), dress2 = col('#3e4650'), canopy = [col('#323a37', 0.2), col('#3b4440', 0.2)], under = col('#1d211f', 0.2), umbBig = [col('#a9b2bb', 0.25), col('#97a1ab', 0.25)], umbPurple = [col('#2c2f33', 0.2), col('#363a3f', 0.2)], brown = col('#5a4632', 0.3), rib = col('#141615', 0.1);
    const limb = (a, b, r0, r1, c, seg = 7) => { const ax = new THREE.Vector3(...a), bx = new THREE.Vector3(...b), len = ax.distanceTo(bx), g = shape.cyl(r0, r1, len, seg, c); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), bx.clone().sub(ax).normalize()); g.applyQuaternion(q); const m = ax.clone().add(bx).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return g; };
    const head = (hy, r, hair) => { const h = shape.ball(r, skin, 1); shape.move(h, 0, hy, 0.002); shape.paint(h, (c, n) => (n.z < 0.2 && c.y > hy - r * 0.2 ? hair : n.z > 0.3 && c.y < hy - r * 0.35 && hair === brown ? brown : null)); return h; };
    const man = () => {
      const body = shape.lathe([[0, 0.112], [0.058, 0.112], [0.061, 0.155], [0.052, 0.21], [0.057, 0.268], [0.05, 0.298], [0.028, 0.314], [0, 0.318]], 12, coat);
      shape.move(body, 0, 0, 0, 0, 0, 0, 1, 1, 0.74);
      shape.paint(body, (c, n) => (n.z > 0.55 && Math.abs(c.x) < 0.017 && c.y > 0.2 ? (c.y > 0.268 ? white : dark) : null));
      const parts = [body, head(0.343, 0.029, brown), shape.move(shape.cyl(0.012, 0.013, 0.02, 6, skin), 0, 0.318, 0)];
      parts.push(limb([-0.056, 0.296, 0], [-0.064, 0.16, 0.012], 0.013, 0.012, coat));
      parts.push(limb([0.056, 0.296, 0], [0.04, 0.245, 0.07], 0.013, 0.012, coat));          // (the left hand, up, holding the umbrella)
      return shape.merge(parts);
    };
    const leg = trs => shape.merge([shape.move(shape.cyl(0.0125, 0.017, 0.19, 7, trs), 0, -0.095, 0), shape.move(shape.box(0.024, 0.014, 0.044, hatc), 0, -0.185, 0.008)]);
    const hat = shape.merge([shape.cyl(0.027, 0.029, 0.062, 10, hatc).translate(0, 0.031, 0), shape.cyl(0.045, 0.045, 0.004, 14, hatc).translate(0, 0.003, 0)]);
    const woman = (dc) => {
      const skirt = shape.lathe([[0, 0.004], [0.088, 0.004], [0.084, 0.05], [0.071, 0.12], [0.058, 0.17], [0.045, 0.2], [0, 0.2]], 14, dc);
      const p = skirt.attributes.position;          // the bustle, behind
      for (let i = 0; i < p.count; i++) { const z = p.getZ(i), yy = p.getY(i); if (z < 0) p.setZ(i, z - 0.032 * Math.exp(-(((yy - 0.16) / 0.05) ** 2)) * (-z / 0.07)); }
      skirt.computeVertexNormals();
      const bodice = shape.lathe([[0, 0.2], [0.046, 0.2], [0.042, 0.25], [0.047, 0.283], [0.034, 0.3], [0, 0.305]], 12, dc);
      shape.move(bodice, 0, 0, 0, 0, 0, 0, 1, 1, 0.76);
      shape.paint(bodice, c => (c.y > 0.275 ? fur : null));
      const h = head(0.328, 0.026, fur);
      const hatw = shape.move(shape.cyl(0.021, 0.019, 0.028, 10, fur), 0, 0.358, -0.004);
      return shape.merge([skirt, bodice, h, hatw, shape.move(shape.cyl(0.011, 0.012, 0.02, 6, skin), 0, 0.302, 0),
        limb([-0.045, 0.285, 0], [-0.05, 0.19, 0.03], 0.011, 0.01, dc), limb([0.045, 0.285, 0], [0.03, 0.235, 0.065], 0.011, 0.01, dc)]);
    };
    // An umbrella, from the hand up: its shaft, and a canopy of eight panels that sag a little between their ribs, two
    // shades of one colour, darker underneath; the ribs dark, with a tip at each end.
    const umbrella = (R, rise, cols) => {
      const prof = [[0.0005, 0.075], [0.05, 0.068], [0.1, 0.05], [0.145, 0.022], [0.165, 0]].map(([r, h]) => [r * R, h * R]);
      const sag = g => { const q = g.attributes.position; for (let i = 0; i < q.count; i++) { const x = q.getX(i), z = q.getZ(i), r = Math.hypot(x, z); if (r < 1e-4) continue; const ph = Math.atan2(x, z) / (Math.PI / 4), fr = Math.abs(ph - Math.round(ph)) * 2, k = Math.sin(fr * Math.PI / 2) * (r / (0.165 * R)); q.setXYZ(i, x * (1 - 0.06 * k), q.getY(i) - 0.012 * R * k, z * (1 - 0.06 * k)); } g.computeVertexNormals(); return g; };
      const topc = sag(shape.lathe(prof.slice().reverse(), 16, cols[0]));      // (rim to tip, so its faces look up) shape.paint(topc, (c, n, f) => (Math.floor(Math.atan2(c.x, c.z) / (Math.PI / 4) + 8) % 2 ? cols[1] : null));
      const und = sag(shape.lathe(prof.map(([r, h]) => [r * 0.985, h - 0.004]), 16, under));
      const parts = [topc, und];
      for (let k = 0; k < 8; k++) {
        const ang = k * Math.PI / 4, sx = Math.sin(ang), sz = Math.cos(ang);
        for (let j = 0; j < prof.length - 1; j++) parts.push(limb([prof[j][0] * sx, prof[j][1] + 0.0015, prof[j][0] * sz], [prof[j + 1][0] * sx, prof[j + 1][1] + 0.0015, prof[j + 1][0] * sz], 0.0016 * R, 0.0016 * R, rib, 3));
        parts.push(shape.move(shape.ball(0.003 * R, rib, 0), prof[4][0] * sx * 1.01, -0.002, prof[4][0] * sz * 1.01));
      }
      const can = shape.merge(parts); can.translate(0, rise, 0);
      return shape.merge([can, shape.cyl(0.0032, 0.0032, rise + 0.075 * R + 0.025, 5, rib).translate(0, (rise + 0.075 * R + 0.025) / 2 - 0.012, 0),
        shape.move(shape.cyl(0.005, 0.005, 0.028, 5, brown), 0.008, -0.014, 0, 0, 0, 0.9)]);
    };
    const big = (g, k = S) => shape.move(g, 0, 0, 0, 0, 0, 0, k);
    const rig = this.rig = L.rig(24, 26000, L.paint({ glow: 0.55, rough: 0.4 }));
    const G = { man: rig.geo(big(man())), legD: rig.geo(big(leg(dark))), hat: rig.geo(big(hat)), woman2: rig.geo(big(woman(dress2))), umb: rig.geo(big(umbrella(1, 0.22, canopy))), umbP: rig.geo(big(umbrella(1, 0.22, umbPurple))),
      man0: rig.geo(big(man(), SC)), leg0: rig.geo(big(leg(trouser), SC)), hat0: rig.geo(big(hat, SC)), woman0: rig.geo(big(woman(dress), SC)), big: rig.geo(big(umbrella(1.2, 0.24, umbBig), SC)) };
    const person = (kind) => kind === 'woman'
      ? { kind, body: rig.add(G.woman2) }
      : kind === 'm0' ? { kind, body: rig.add(G.man0), legs: [rig.add(G.leg0), rig.add(G.leg0)], hat: rig.add(G.hat0), tip: 0 }
      : { kind, body: rig.add(G.man), legs: [rig.add(G.legD), rig.add(G.legD)], hat: rig.add(G.hat), tip: 0 };
    this.walkers = WALKS.map(w => {
      const o = { ...w, S: w.who === 'couple' ? SC : S, path: walk(w.pts, { speed: 0.28, rest: w.rest }), at: {}, phase: L.rand() * 6, x: 0, z: 0, yaw: 0, shown: false, open: 0, popped: false };
      if (w.who === 'couple') { o.people = [person('m0'), { kind: 'f0', body: rig.add(G.woman0) }]; o.umb = rig.add(G.big); }
      else { o.people = [person(w.who === 'woman' ? 'woman' : 'man')]; o.umb = rig.add(w.who === 'woman' ? G.umbP : G.umb); }
      return o;
    });
    this.hideAll();

    // ---------------------------------------------------------- the toy's splash, and the umbrellas on the hooks
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SPLASH * 3), 3));
    this.splash = L.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xcfdcf0, size: 0.035, transparent: true, opacity: 0.9, depthWrite: false })), L.fixed);
    this.splash.visible = false; this.sv = Array.from({ length: SPLASH }, () => new THREE.Vector3()); this.st = 1;
    this.hooks(L);
    this.hiss = L.voice().loop({ lp: 5200, hp: 650 });
    this.amt = 0; this.spreadV = 0; this.wetV = 0; this.grow = 0; this.open = 0; this.was = false; this.plinkAt = 0;
  },

  // A raindrop somewhere over the street (in front of the picture, out into the room), given its height.
  drop(L, d = {}) {
    const u = (L.rand() * 2 - 1) * (HALF + 0.3), out = 0.12 + L.rand() * (OUT + 0.4), p = L.floor(u, out);
    d.x = p.x; d.z = p.z; d.u = u; d.o = out; if (d.y == null) d.y = this.top; d.s = 6.2 + L.rand() * 2.2;
    return d;
  },
  hideAll() { for (const w of this.walkers) { for (const p of w.people) { this.rig.show(p.body, false); if (p.legs) { this.rig.show(p.legs[0], false); this.rig.show(p.legs[1], false); this.rig.show(p.hat, false); } } this.rig.show(w.umb, false); w.shown = false; } },

  start(L) {
    const k = L.k;
    if (!this.found && !L.quiet) { this.found = true; if (k.find('rain')) k.callout('RAIN INDOORS'); k.say('It has started to rain. In here.', 4); }
    for (const w of this.walkers) w.back = null;
    this.spread0 = this.spreadV;                     // (still wet from last time: the street is already laid)
    const v = L.voice(); v.note(587.3, 1.6, { vol: 0.025, type: 'sine', attack: 0.3 }); v.note(440, 2.2, { at: 0.35, vol: 0.022, type: 'sine', attack: 0.4 }); v.note(349.2, 2.8, { at: 0.75, vol: 0.02, type: 'sine', attack: 0.5 });
  },
  back(L) {
    // Everyone hurries back in under the frame, out of the rain.
    for (const w of this.walkers) w.back = w.shown ? { u: w.at.u, out: w.at.out, to: Math.max(-L.hw + 0.15, Math.min(L.hw - 0.15, w.at.u)) } : null;
  },
  end() { this.hideAll(); },
  keep() { return this.wetV > 0.002; },
  reset() { this.amt = 0; this.spreadV = 0; this.wetV = 0; this.grow = 0; this.open = 0; this.hideAll(); this.u.uWet.value = 0; this.u.uSpread.value = 0; this.hiss.set(0); },

  update(L, dt) {
    const k = L.k, ph = L.phase, t = L.t, showing = ph === 'wake' || ph === 'play';
    // How hard it rains: starting through the Wake, heavier at three seconds, then coming and going; off as they go home.
    const want = showing ? Math.min(1, ramp(t, 0.1, 1.6) * 0.65 + ramp(t, 2.6, 3.6) * 0.35) * (0.82 + 0.18 * Math.sin(t * 0.7)) : 0;
    this.amt += (want - this.amt) * Math.min(1, dt * (showing ? 2.5 : 1.6));
    if (showing) { this.spreadV = Math.max(this.spread0 || 0, ease.out(ramp(t, 0.25, 2.8))); this.wetV = 1; this.grow = Math.max(this.grow, ease.smooth(ramp(t, 1.4, 4.2))); }
    else if (ph === 'after') this.wetV = Math.max(0, this.wetV - dt / DRY);
    const u = this.u; u.uSpread.value = this.spreadV; u.uWet.value = this.wetV; u.uGrow.value = this.grow * (0.6 + 0.4 * this.wetV);
    this.street.material.visible = this.wetV > 0.002 && this.spreadV > 0.001;      // (by its material: the mirror shows and hides the mesh)
    if (this.wetV <= 0.002) { this.spreadV = 0; this.grow = 0; }

    // The rain: streaks catching the picture lights as they fall past them; the heavier drops splash where they land.
    const n = Math.round(DROPS * this.amt), a = this.rain.geometry.attributes.position.array, cl = this.rain.geometry.attributes.color.array, wind = 0.035, w2 = 0.004;
    const RC = this.rainC, SCc = this.splC, ox = L.nx * 0.0 + L.tx * w2, oz = L.tz * w2;
    this.rain.visible = n > 0 || this.spl.some(q => q.age < 0.3); this.rain.geometry.setDrawRange(0, (SPL * 4 + n * 2) * 2);
    for (let i = 0; i < SPL; i++) {                // splashes: four droplets thrown up and out, a few hundredths of a second long
      const q = this.spl[i]; q.age += dt;
      for (let k2 = 0; k2 < 4; k2++) {
        const j = (i * 4 + k2) * 6, ang = q.a + k2 * Math.PI / 2, t1 = Math.min(q.age, 0.26), t0 = Math.max(0, t1 - 0.035), sp = 0.55;
        if (q.age > 0.26) { a.fill(-1e4, j, j + 6); continue; }
        const c = Math.cos(ang) * sp, sn = Math.sin(ang) * sp;
        a[j] = q.x + c * t0; a[j + 1] = q.y + 1.1 * t0 - 4.9 * t0 * t0; a[j + 2] = q.z + sn * t0; a[j + 3] = q.x + c * t1; a[j + 4] = q.y + 1.1 * t1 - 4.9 * t1 * t1; a[j + 5] = q.z + sn * t1;
        const f = 1 - q.age / 0.26; for (let v = 0; v < 2; v++) { cl[j + v * 3] = SCc.r * f; cl[j + v * 3 + 1] = SCc.g * f; cl[j + v * 3 + 2] = SCc.b * f; }
      }
    }
    for (let i = 0; i < n; i++) {
      const d = this.drops[i]; d.y -= d.s * dt;
      if (d.y < L.y) {
        if (d.o < OUT && Math.abs(d.u) < HALF) { if (L.rand() < 0.55) this.ripple(L, d.x, d.z, d.u, d.o); if (L.rand() < 0.16) { const q = this.spl[this.si = (this.si + 1) % SPL]; q.age = 0; q.x = d.x; q.y = L.y + 0.012; q.z = d.z; q.a = L.rand() * 6.3; } }
        this.drop(L, d); d.y = this.top - L.rand() * 0.6;
      }
      // how bright: the picture lights, each a little above its frame, light the drops that pass near them
      let lit = 0.62; for (const lp of this.lamps) { const dd = (d.x - lp.x) ** 2 + ((d.y - lp.y) * 0.6) ** 2 + (d.z - lp.z) ** 2; if (dd < 4) lit += 1.6 * Math.exp(-dd / 0.5); }
      lit = Math.min(2.2, lit);
      for (let h = 0; h < 2; h++) {
        const j = (SPL * 4 + i * 2 + h) * 6, sx = h ? ox : 0, sz = h ? oz : 0;
        a[j] = d.x + sx; a[j + 1] = d.y; a[j + 2] = d.z + sz; a[j + 3] = d.x + sx - L.tx * wind; a[j + 4] = d.y + 0.32; a[j + 5] = d.z + sz - L.tz * wind;
        cl[j] = RC.r * lit; cl[j + 1] = RC.g * lit; cl[j + 2] = RC.b * lit; cl[j + 3] = RC.r * lit * 0.25; cl[j + 4] = RC.g * lit * 0.25; cl[j + 5] = RC.b * lit * 0.25;
      }
    }
    if (this.rain.visible) { this.rain.geometry.attributes.position.needsUpdate = true; this.rain.geometry.attributes.color.needsUpdate = true; }
    for (let i = 0; i < RIPS; i++) { const r = this.rips[i]; r.age += dt / r.life; u.uRip.value[i].z = Math.min(2, r.age); }
    const near = Math.max(0, 1 - Math.hypot(k.G.camera.position.x - L.cx, k.G.camera.position.z - L.cz) / 14);
    this.hiss.set(0.06 * this.amt * near);

    // The walkers.
    const rig = this.rig, W = this.walkers, o = {};
    for (const w of W) {
      let u0, out0, du, dout, moving;
      if (ph === 'return' && w.back) {
        const e = ease.inOut(L.ret), b = w.back;
        u0 = b.u + (b.to - b.u) * e; out0 = b.out + (-0.35 - b.out) * e; du = b.to - b.u; dout = -0.35 - b.out; const l = Math.hypot(du, dout) || 1; du /= l; dout /= l; moving = L.ret < 0.98 ? 1.6 : 0;
      } else if (showing) {
        const tw = t - w.delay;
        if (tw < 0) { if (w.shown) this.hideWalker(w); continue; }
        w.path.at(tw, o); u0 = o.u; out0 = o.out; du = o.du; dout = o.dout; moving = o.moving;
      } else { if (w.shown) this.hideWalker(w); continue; }
      w.at.u = u0; w.at.out = out0;
      // Up goes the umbrella once clear of the frame, with a whump; down again on the way back in.
      const opening = out0 > 0.42 && (dout > -0.2 || out0 > 0.65) && !(ph === 'return' && out0 < 0.7);
      w.open = clamp01(w.open + (opening ? dt / 0.8 : -dt / 0.45));
      if (w.open > 0.6 && !w.popped) { w.popped = true; this.whump(L); } else if (w.open < 0.3) w.popped = false;
      const yaw = L.yawOf(du, dout), p = L.floor(u0, out0);
      w.phase += dt * moving * 0.28 * (Math.PI * 2 / (0.13 * w.S));
      this.place(L, w, p.x, p.z, yaw, moving);
    }
    // A gentleman raises his hat to the couple as they pass.
    const C = W[0], M = W[1];
    if (showing && C.shown && M.shown) {
      const d = Math.hypot(C.at.u - M.at.u, C.at.out - M.at.out), hp = M.people[0];
      if (d < 0.5 && !M.tipped) { M.tipped = true; hp.tip = 0.001; }
      if (d > 0.9) M.tipped = false;
    }
    for (const w of W) for (const p of w.people) if (p.tip > 0) { p.tip += dt / 1.4; if (p.tip >= 1) p.tip = 0; }

    // Drips into the puddles.
    if (showing && this.amt > 0.3 && t > this.plinkAt) { this.plinkAt = t + 0.18 + L.rand() * 0.5; if (this.grow > 0.3) L.voice().note(1600 + L.rand() * 1700, 0.12, { vol: 0.012 * near, type: 'sine', to: 900 + L.rand() * 400 }); }
    L.voice().place();

    // Umbrellas on the hooks open while it rains.
    this.open = Math.max(0, Math.min(1, this.open + (this.amt > 0.1 ? dt / 1.6 : -dt / 3)));
    const tt = performance.now() / 1000;
    for (const b of this.brollies) { const q = this.open; b.can.scale.set(0.16 + 0.84 * q, 1.25 - 0.35 * q, 0.16 + 0.84 * q); b.pivot.rotation.x = 0.5 * q + Math.sin(tt * 1.3 + b.ph) * 0.02 * q; }

    // The toy in a puddle (once it can move again): held back, and a splash.
    this.wade(L, dt);
  },

  ripple(L, x, z, su, so) {
    const r = this.rips[this.ri = (this.ri + 1) % RIPS], v = this.u.uRip.value[this.ri];
    r.age = 0; r.life = 0.45 + L.rand() * 0.3; v.set(x, z, 0, 0.07 + L.rand() * 0.08);
  },
  hideWalker(w) { const r = this.rig; for (const p of w.people) { r.show(p.body, false); if (p.legs) { r.show(p.legs[0], false); r.show(p.legs[1], false); r.show(p.hat, false); } } r.show(w.umb, false); w.shown = false; },
  // Stand a walker (one person, or the couple) at (x, z) facing yaw, legs going if moving.
  place(L, w, x, z, yaw, moving) {
    const r = this.rig, S = w.S, y = L.y + 0.002, rx = Math.cos(yaw), rz = -Math.sin(yaw), fx = Math.sin(yaw), fz = Math.cos(yaw);
    const swing = Math.sin(w.phase) * 0.42 * Math.min(1, moving), bob = Math.abs(Math.cos(w.phase)) * 0.006 * S * Math.min(1, moving);
    if (!w.shown) { for (const p of w.people) { r.show(p.body, true); if (p.legs) { r.show(p.legs[0], true); r.show(p.legs[1], true); r.show(p.hat, true); } } r.show(w.umb, true); w.shown = true; }
    const couple = w.people.length > 1;
    w.people.forEach((p, i) => {
      const side = (couple ? (i === 0 ? -0.056 : 0.056) : 0) * S, px = x + rx * side, pz = z + rz * side;
      if (p.legs) {
        r.put(p.body, px, y + bob, pz, yaw);
        for (let q = 0; q < 2; q++) { const sx = (q ? 0.022 : -0.022) * S; r.put(p.legs[q], px + rx * sx, y + 0.19 * S + bob, pz + rz * sx, yaw, (q ? 1 : -1) * swing); }
        const tip = p.tip > 0 ? Math.sin(Math.PI * Math.min(1, p.tip * 1.4)) : 0;
        r.put(p.hat, px + fx * 0.018 * S * tip, y + 0.368 * S + bob + 0.035 * S * tip, pz + fz * 0.018 * S * tip, yaw, 0.35 * tip);
      } else r.put(p.body, px, y + bob * 0.6, pz, yaw, 0, Math.sin(w.phase) * 0.035 * Math.min(1, moving));
    });
    // The umbrella, in the outside hand (between them, for the couple): furled, it is carried point down like a cane;
    // then swung up and opened, and tipped a little into the rain.
    const ux = (couple ? 0 : 0.04) * S, uf = (couple ? 0.045 : 0.07) * S, hy = (couple ? 0.25 : 0.245) * S;
    const up = ease.smooth(w.open / 0.62), pop = ease.outBack(ramp(w.open, 0.55, 1)), furl = Math.PI - 0.62;
    const pitch = furl + (-0.12 + Math.sin(w.phase) * 0.02 - furl) * up, sc = this._sc || (this._sc = new THREE.Vector3());
    sc.set(0.14 + 0.86 * pop, 1 - 0.12 * (1 - pop), 0.14 + 0.86 * pop);
    r.put(w.umb, x + rx * ux + fx * uf, y + hy + bob, z + rz * ux + fz * uf, yaw, pitch, 0.05 * up, sc);
  },
  whump(L) { const v = L.voice(); v.note(150, 0.16, { vol: 0.03, type: 'triangle', to: 70 }); L.k.synth.noise(0.12, { vol: 0.02, lp: 900 }); },

  // The puddles hold the toy back, and it splashes going in (as the old indoor rain did).
  wade(L, dt) {
    const k = L.k, v = k.v, p = k.pos;
    if (this.st < 1) {
      this.st += dt * 1.4; const a = this.splash.geometry.attributes.position.array;
      for (let i = 0; i < SPLASH; i++) { const s = this.sv[i]; s.y -= 9.8 * dt; a[i * 3] += s.x * dt; a[i * 3 + 1] = Math.max(L.y + 0.01, a[i * 3 + 1] + s.y * dt); a[i * 3 + 2] += s.z * dt; }
      this.splash.geometry.attributes.position.needsUpdate = true; this.splash.material.opacity = 0.9 * (1 - this.st); if (this.st >= 1) this.splash.visible = false;
    }
    if (k.G.state !== 'play' || !v || v.kind !== 'car' || Math.abs(p.y - L.y) > 0.3 || this.grow < 0.2) { this.was = false; return; }
    const q = L.local(p.x, p.z), g = this.grow * (0.6 + 0.4 * this.wetV);
    const inside = this.wetV > 0.15 && PUDDLES.some(([pu, po, ru, rz]) => ((q.u - pu) / (ru * g)) ** 2 + ((q.out - po) / (rz * g)) ** 2 < 1.1);
    const speed = Math.hypot(v.vel.x, v.vel.z);
    if (inside) {
      if (speed > 0.5) { const f = Math.exp(-dt * 4.5); v.vel.x *= f; v.vel.z *= f; }
      if (!this.was && speed > 0.9) {
        const a = this.splash.geometry.attributes.position.array;
        for (let i = 0; i < SPLASH; i++) { const ang = Math.random() * 6.28, s = 0.4 + Math.random() * speed * 0.4; a[i * 3] = p.x; a[i * 3 + 1] = L.y + 0.02; a[i * 3 + 2] = p.z; this.sv[i].set(Math.cos(ang) * s, 1.2 + Math.random() * 1.6, Math.sin(ang) * s); }
        this.splash.geometry.attributes.position.needsUpdate = true; this.splash.visible = true; this.st = 0;
        k.synth.noise(0.35, { vol: 0.08, lp: 2400 }); k.synth.noise(0.2, { vol: 0.04, lp: 5000, at: 0.05 });
      }
    }
    this.was = inside;
  },

  // The umbrellas on hooks along the south wall, between its two doors (from the old indoor rain, src/l2-gallery201.js).
  hooks(L) {
    const k = L.k, r = L.room, y = L.y, T = THREE;
    const lam = (color, glow = 0.5) => new T.MeshLambertMaterial({ color, emissive: new T.Color(color).multiplyScalar(glow) });
    const south = k.plan.doorsOf(r.id).filter(d => Math.abs(d.z0 - r.z1) < 0.05).sort((a, b) => a.x0 - b.x0);
    const ux0 = south.length >= 2 ? south[0].x1 + 0.75 : r.x0 + 1.5, ux1 = south.length >= 2 ? south[1].x0 - 0.75 : ux0 + 3.5;
    const n = Math.max(3, Math.min(6, Math.floor((ux1 - ux0) / 0.62) + 1)), cols = [0x1d1d22, 0x23402f, 0x1f2b4f, 0x5a1f24, 0x4a4a4e, 0x2e2a22];
    this.brollies = [];
    const brass = lam(0xb8964a, 0.4), handle = lam(0x4a2d18, 0.4), cone = new T.ConeGeometry(0.22, 0.2, 8, 1, true), pegG = new T.CylinderGeometry(0.008, 0.008, 0.07, 6), crookG = new T.TorusGeometry(0.028, 0.009, 6, 12, Math.PI), shaftG = new T.CylinderGeometry(0.008, 0.008, 0.5, 6);
    for (let i = 0; i < n; i++) {
      const x = ux0 + (ux1 - ux0) * (n === 1 ? 0.5 : i / (n - 1)), z = r.z1, hy = y + 0.82;
      const peg = new T.Mesh(pegG, brass); peg.rotation.x = Math.PI / 2; peg.position.set(x, hy, z - 0.035); L.add(peg, L.fixed);
      const pivot = new T.Group(); pivot.position.set(x, hy, z - 0.06);
      const crook = new T.Mesh(crookG, handle); crook.rotation.y = Math.PI / 2; crook.position.set(0, -0.005, 0.02); pivot.add(crook);
      const shaft = new T.Mesh(shaftG, handle); shaft.position.set(0, -0.25, 0.045); pivot.add(shaft);
      const can = new T.Mesh(cone, new T.MeshLambertMaterial({ color: cols[i % cols.length], emissive: new T.Color(cols[i % cols.length]).multiplyScalar(0.6), side: T.DoubleSide }));
      can.rotation.x = Math.PI; can.position.set(0, -0.42, 0.045); can.scale.set(0.16, 1.25, 0.16); pivot.add(can);
      L.add(pivot, L.fixed);
      this.brollies.push({ pivot, can, ph: L.rand() * 6 });
    }
    if (n) k.plan.obstacles.push({ x0: ux0 - 0.28, x1: ux1 + 0.28, z0: r.z1 - 0.48, z1: r.z1, y0: y + 0.04, y1: y + 0.86 });
  },
});
