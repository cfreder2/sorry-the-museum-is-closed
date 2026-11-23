// Edgar Degas, The Millinery Shop (1879-86), Gallery 226. The word: flutter.
//
// In the shop the hats stand on their tall stands like birds on perches: the big pink froth of a bonnet with its
// ochre bow, a red-brown one behind it, a straw hat heaped with green and white flowers and trailing its long green
// ribbon, a little fluffy blue one with a bright blue bow on the counter, the orange one in her hands. Look at the
// picture and the shop bell rings, a warm pool of the shop's light comes up on the floor, dark wooden hat stands,
// turned like his, grow up out of it, and the hats come (each made the way he paints them: a soft body under a shell
// of loose, scumbled dabs; the froths frothy, the felt brushed, the straw plaited, an ostrich plume curling off the red)
// out from under the frame one by one, peeping out first, then dropping off like fledglings off a ledge, their bows
// beating like wings. They hop about the floor the way sparrows do, peck, look about; then all at once they are up and
// flying, a little flock in his warm colours wheeling round the gallery floor with their ribbons streaming, while a
// music box plays "Ah! vous dirai-je, maman" (a French air of the 1760s). One by one they come in to land on the stands,
// as the hats stand in the shop. The small blue one misses, bounces off, sits on the floor a moment, hops twice in a huff
// and makes it at the second go; then all of them fluff themselves up together. While you keep looking they preen and
// shuffle on their stands, and every so often two of them squabble and swap places. When you stop, they fly back in
// under the frame, one after another, and the stands go down into the floor.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture } from '../paintlife.js';
import { score, Bones, hump, turnTo, noise, hz } from './stagecraft.js';

const HATS = 5, SEG = 5, TAILS = 2, SEGL = 0.05, HS = 1.6;      // HS: the hats' size, half as big again as life, as a milliner's display hats are
// The stands, in the stage's terms (along, out, height of the top), as the shop's are: back ones taller.
const STANDS = [{ u: -0.9, out: 0.68, h: 0.6 }, { u: -0.45, out: 1.02, h: 0.44 }, { u: 0.02, out: 0.62, h: 0.68 }, { u: 0.48, out: 1.0, h: 0.46 }, { u: 0.92, out: 0.7, h: 0.58 }];
const HOME = [0, 2, 3, 1, 4];                      // which stand each hat goes to (pink, red, straw, blue, orange)
const ORDER = [3, 0, 2, 4, 1];                     // the order they come out
const EXIT = [-0.36, -0.12, 0.08, 0.3, 0.46];      // where along under the frame each comes out
const T_FLY = 4.0, LOOP = 2.6, T_LAND = 6.9, BLUE = 3, IDLE0 = 10.4, SWAP = 7.5;
// "Ah! vous dirai-je, maman" (a French air, printed 1761), on a music box.
const AIR = 'C6 C6 G6 G6 | A6 A6 G6:2 | F6 F6 E6 E6 | D6 D6 C6:2 | G6 G6 F6 F6 | E6 E6 D6:2 | G6 G6 F6 F6 | E6 E6 D6:2 | C6 C6 G6 G6 | A6 A6 G6:2 | F6 F6 E6 E6 | D6 D6 C6:2';

lifeFor(14572, {
  title: /^The Millinery Shop/,
  word: 'flutter',
  stage: { out: 1.6, half: 1.3, cam: { dist: 2.5, height: 0.8, side: -0.15, fov: 62, lookU: 0, lookOut: 0.6, lookH: 0.9, floorOut: 1.28 } },
  wake: 2, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.35) => P.near(h, a);
    this.B = new Bones(); this.M = [new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4()]; this.T = new THREE.Vector3(); this.U = new THREE.Vector3(); this.W = new THREE.Vector3();
    // ---------------------------------------------------------- his marks: soft dabs of paint, and a plain spot for solid things
    // One texture for the whole rig: the left half a soft, ragged dab with the canvas's grain broken through it (so the
    // dabs are a little see-through where they overlap, as his scumbled paint is), the right half plain.
    const tex = canvasTexture(128, 128, (g, W, H) => {
      const img = g.createImageData(W, H), d = img.data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (x >= 64) { d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = 255; continue; }
        const u = (x + 0.5) / 64 * 2 - 1, v = (y + 0.5) / H * 2 - 1, wob = 0.1 * Math.sin(v * 7 + 1) + 0.06 * Math.sin(v * 17);
        const r = Math.hypot(u / (0.92 + wob), v / 0.96), grain = L.rand(), drag = 0.5 + 0.5 * Math.sin(u * 9 + Math.sin(v * 5) * 2);
        const a = (1 - r) * 2.4 + (grain - 0.5) * 0.9 + (drag - 0.5) * 0.35;
        d[i] = d[i + 1] = d[i + 2] = 210 + 35 * drag + 10 * L.rand(); d[i + 3] = Math.max(0, Math.min(255, a * 255));
      }
      g.putImageData(img, 0, 0);
    });
    const mat = new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, alphaTest: 0.5, roughness: 0.85, emissive: 0xffffff, emissiveIntensity: 0.52, side: THREE.DoubleSide });
    mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= diffuseColor.rgb;'); };
    mat.customProgramCacheKey = () => 'millinery-dabs';
    // geometry helpers: a plain spot of the texture for solid parts; normals smoothed (no facets); merging with uvs
    const plain = g => { const n = g.attributes.position.count, uv = new Float32Array(n * 2); for (let i = 0; i < n; i++) { uv[i * 2] = 0.8; uv[i * 2 + 1] = 0.5; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g; };
    const smooth = g => {
      const p = g.attributes.position, nn = g.attributes.normal, acc = new Map(), key = i => `${Math.round(p.getX(i) * 1e4)},${Math.round(p.getY(i) * 1e4)},${Math.round(p.getZ(i) * 1e4)}`;
      for (let i = 0; i < p.count; i++) { const k = key(i), a = acc.get(k) || [0, 0, 0]; a[0] += nn.getX(i); a[1] += nn.getY(i); a[2] += nn.getZ(i); acc.set(k, a); }
      for (let i = 0; i < p.count; i++) { const a = acc.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1; nn.setXYZ(i, a[0] / l, a[1] / l, a[2] / l); }
      nn.needsUpdate = true; return g;
    };
    const merge = list => { let n = 0; for (const g of list) n += g.attributes.position.count; const out = new THREE.BufferGeometry(); for (const [name, k] of [['position', 3], ['normal', 3], ['color', 3], ['uv', 2]]) { const a = new Float32Array(n * k); let o = 0; for (const g of list) { a.set(g.attributes[name].array, o); o += g.attributes[name].array.length; } out.setAttribute(name, new THREE.BufferAttribute(a, k)); } return out; };
    const body = (g, c) => plain(smooth(shape.paint(g, () => c)));
    // Cards: [{ p (point), n (normal: the card lies across it), up (the way the dab runs), l, w, c, lift (its far end raised off the form) }]
    const V3 = THREE.Vector3;
    const cards = list => {
      const pos = [], nor = [], colr = [], uvs = [];
      for (const { p, n, up, l, w, c, lift = 0 } of list) {
        const u = up.clone().addScaledVector(n, -up.dot(n)).normalize(), sd = new V3().crossVectors(n, u).normalize();
        const base = p.clone().addScaledVector(n, 0.002), lo = base.clone().addScaledVector(u, -l * 0.5), hi = base.clone().addScaledVector(u, l * 0.5).addScaledVector(n, lift * l);
        const q = [lo.clone().addScaledVector(sd, -w / 2), lo.clone().addScaledVector(sd, w / 2), hi.clone().addScaledVector(sd, w / 2), hi.clone().addScaledVector(sd, -w / 2)], t = [[0, 0], [0.5, 0], [0.5, 1], [0, 1]];
        for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(q[k].x, q[k].y, q[k].z); nor.push(n.x, n.y, n.z); colr.push(c.r, c.g, c.b); uvs.push(t[k][0], t[k][1]); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      return g;
    };
    // Points on a body's surface, area-weighted, with their smoothed normals: where the shell of dabs is laid.
    const surface = (g, n, keep = () => true) => {
      const p = g.attributes.position, nn = g.attributes.normal, areas = [], A = new V3(), B = new V3(), C = new V3(); let tot = 0;
      for (let f = 0; f < p.count; f += 3) { A.fromBufferAttribute(p, f); B.fromBufferAttribute(p, f + 1); C.fromBufferAttribute(p, f + 2); tot += B.sub(A).cross(C.sub(A)).length() / 2; areas.push(tot); }
      const out = [];
      for (let tries = 0; out.length < n && tries < n * 6; tries++) {
        const r = L.rand() * tot; let lo = 0, hi = areas.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (areas[m] < r) lo = m + 1; else hi = m; }
        let a = L.rand(), b = L.rand(); if (a + b > 1) { a = 1 - a; b = 1 - b; } const f = lo * 3, c0 = 1 - a - b;
        const pt = new V3().fromBufferAttribute(p, f).multiplyScalar(c0).addScaledVector(new V3().fromBufferAttribute(p, f + 1), a).addScaledVector(new V3().fromBufferAttribute(p, f + 2), b);
        const nm = new V3().fromBufferAttribute(nn, f).multiplyScalar(c0).addScaledVector(new V3().fromBufferAttribute(nn, f + 1), a).addScaledVector(new V3().fromBufferAttribute(nn, f + 2), b).normalize();
        if (keep(pt, nm)) out.push({ p: pt, n: nm });
      }
      return out;
    };
    const LIGHT = new V3(-0.4, 0.75, 0.55).normalize();
    // a colour from a set by how the light falls there, drawn a little towards the set's middle so the dabs sit together
    const toned = (set, nm, q) => { const k = nm.dot(LIGHT); const c = set[Math.min(set.length - 1, Math.max(0, Math.floor((k * 0.5 + 0.5) * set.length + (q - 0.5) * 1.4)))]; return c.clone(); };
    const rnd = s => (L.rand() - 0.5) * s, anyUp = nm => new V3(rnd(2), rnd(2), rnd(2)).addScaledVector(nm, -1).normalize();
    // A froth of tulle: a soft squashed underbody, and over it a deep shell of dabs, many standing proud of it.
    const froth = (r, h, set, under, n) => {
      const g = shape.ball(1, under, 2), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), w = 1 + 0.08 * Math.sin(x * 7 + z * 5) * Math.cos(y * 6); p.setXYZ(i, x * r * w, (Math.max(-0.25, y) * h + h * 0.25) * w, z * r * w); }
      g.computeVertexNormals(); const b = body(g, under);
      const list = surface(b, n).map(({ p: pt, n: nm }) => ({ p: pt, n: nm, up: anyUp(nm), l: (0.04 + L.rand() * 0.03) * (r / 0.1), w: (0.038 + L.rand() * 0.025) * (r / 0.1), c: toned(set, nm, L.rand()), lift: 0.1 + L.rand() * 0.35 }));
      return merge([b, cards(list)]);
    };
    // A bow: two soft loops and a knot, in satin.
    const bowG = (c, s, at) => {
      const list = [];
      for (const side of [-1, 1]) for (let i = 0; i < 9; i++) { const t = i / 9 * Math.PI * 2, x = side * s * 0.5 * (1 - Math.cos(t)), y = s * 0.32 * Math.sin(t); const nxt = { x: side * s * 0.5 * (1 - Math.cos(t + 0.7)), y: s * 0.32 * Math.sin(t + 0.7) };
        list.push({ p: new V3(at[0] + x, at[1] + y, at[2]), n: new V3(0, 0, 1), up: new V3(nxt.x - x, nxt.y - y, 0).normalize(), l: s * 0.42, w: s * 0.36, c: c.clone().multiplyScalar(0.85 + 0.3 * Math.max(0, Math.sin(t))), lift: 0 }); }
      const knot = plain(smooth(shape.move(shape.ball(s * 0.16, c, 1), at[0], at[1], at[2] + 0.004)));
      return merge([knot, cards(list)]);
    };
    const pinks = [col('#b47c7c'), col('#c98c8a'), col('#d99e9a'), col('#e6b0aa'), col('#efc4bc'), col('#f5d8cf')], ochre = [col('#d79a3a'), col('#c4842e'), col('#e8b456')];
    const reds = [col('#6e2418'), col('#82301f'), col('#9b3a28'), col('#ad4a30'), col('#c0603c')], straw = [col('#a8864e'), col('#c9a465'), col('#d8b77a'), col('#e6cb92'), col('#f0dcaa')], greens = [col('#4e7a3e'), col('#6f9a52'), col('#8fb26a')];
    const blues = [col('#7f9eac'), col('#93b4c0'), col('#a8c6d0'), col('#bed6dc'), col('#d4e4e6')], bow = [col('#2f86b0', 0.25), col('#3b9ac4', 0.25)], oranges = [col('#b8642a'), col('#cf7a30'), col('#e08a3a'), col('#eaa452'), col('#f0c27a')];
    const hats = [
      // the pink bonnet: a big froth of tulle, its ochre bow at the front
      () => merge([froth(0.125, 0.085, pinks, pinks[1], 260), bowG(ochre[0], 0.07, [0, 0.03, 0.118])]),
      // the red-brown felt: smooth, brushed felt, and an ostrich plume curling up off it and back over the crown
      () => {
        const crown = body(shape.lathe([[0.092, 0], [0.09, 0.03], [0.078, 0.07], [0.045, 0.094], [0, 0.1]], 22, reds[1]), reds[1]), brim = body(shape.lathe([[0.075, -0.004], [0.122, 0.0], [0.126, 0.006], [0.12, 0.01], [0.075, 0.008]], 28, reds[2]), reds[2]);
        const felt = cards([...surface(crown, 70), ...surface(brim, 40)].map(({ p: pt, n: nm }) => ({ p: pt, n: nm, up: new V3(-pt.z, 0, pt.x).normalize(), l: 0.04, w: 0.03, c: toned(reds, nm, L.rand()), lift: 0.04 })));
        const spine = new THREE.CatmullRomCurve3([[-0.07, 0.06, 0.03], [-0.05, 0.14, -0.01], [0.0, 0.17, -0.06], [0.05, 0.14, -0.11], [0.08, 0.08, -0.12], [0.07, 0.045, -0.08]].map(a => new V3(...a)));
        const barbs = [], P0 = new V3(), T0 = new V3(), up = new V3(0, 1, 0);
        for (let i = 0; i < 30; i++) {
          const s = i / 29; spine.getPointAt(s, P0); spine.getTangentAt(s, T0);
          const side = new V3().crossVectors(T0, up).normalize(), nrm = new V3().crossVectors(side, T0).normalize(), len = 0.055 * (1 - 0.55 * s) + 0.012;
          for (const sd of [-1, 1]) for (let j = 0; j < 2; j++) {
            const out = side.clone().multiplyScalar(sd).addScaledVector(nrm, -0.55 - 0.25 * j).addScaledVector(T0, 0.3).normalize();
            barbs.push({ p: P0.clone().addScaledVector(out, len * 0.5), n: nrm.clone(), up: out, l: len, w: 0.022, c: [reds[4], col('#d98a5a'), col('#e8b07c')][Math.floor(L.rand() * 3)].clone(), lift: 0.25 });
          }
        }
        return merge([crown, brim, felt, cards(barbs)]);
      },
      // the straw: plaited, ring by ring, herringbone, a heap of flowers and leaves on the crown
      () => {
        const brim = body(shape.lathe([[0.07, 0.0], [0.152, 0.004], [0.155, 0.01], [0.15, 0.014], [0.07, 0.012]], 30, straw[1]), straw[1]), crown = body(shape.lathe([[0.075, 0], [0.072, 0.045], [0.06, 0.056], [0, 0.058]], 24, straw[2]), straw[2]);
        const plait = [];
        for (let ring = 0; ring < 7; ring++) { const r = 0.08 + ring * 0.011, n = Math.round(r * 2 * Math.PI / 0.011); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, t = new V3(-Math.sin(a), 0, Math.cos(a)), lean = ring % 2 ? 0.55 : -0.55, rad = new V3(Math.cos(a), 0, Math.sin(a)); plait.push({ p: new V3(Math.cos(a) * r, 0.0145, Math.sin(a) * r), n: new V3(0, 1, 0), up: t.clone().multiplyScalar(Math.cos(lean)).addScaledVector(rad, Math.sin(lean)), l: 0.022, w: 0.011, c: straw[1 + Math.floor(L.rand() * 4)].clone(), lift: 0 }); } }
        for (let ring = 0; ring < 4; ring++) { const y = 0.012 + ring * 0.011, r = 0.074 - ring * 0.001, n = 40; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rad = new V3(Math.cos(a), 0, Math.sin(a)), lean = ring % 2 ? 0.6 : -0.6; plait.push({ p: new V3(Math.cos(a) * r, y, Math.sin(a) * r), n: rad, up: new V3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(Math.cos(lean)).add(new V3(0, Math.sin(lean), 0)), l: 0.02, w: 0.011, c: straw[1 + Math.floor(L.rand() * 4)].clone(), lift: 0 }); } }
        const fl = [];
        for (let i = 0; i < 13; i++) {
          const a = L.rand() * 6.28, r = 0.02 + L.rand() * 0.06, cx = Math.cos(a) * r, cz = Math.sin(a) * r, cy = 0.058 + L.rand() * 0.025, white = L.rand() < 0.6, pc = white ? col('#f0ece0', 0.2) : col('#e6a0a8', 0.3);
          for (let k = 0; k < 5; k++) { const b = k / 5 * 6.28 + a, d = new V3(Math.cos(b), 0.35, Math.sin(b)).normalize(); fl.push({ p: new V3(cx, cy, cz).addScaledVector(d, 0.011), n: new V3(0, 1, 0), up: d, l: 0.022, w: 0.016, c: pc.clone().multiplyScalar(0.9 + 0.2 * L.rand()), lift: 0.35 }); }
          for (let k = 0; k < 2; k++) { const b = L.rand() * 6.28, d = new V3(Math.cos(b), 0.1, Math.sin(b)).normalize(); fl.push({ p: new V3(cx, cy - 0.006, cz).addScaledVector(d, 0.02), n: new V3(0, 1, 0), up: d, l: 0.035, w: 0.016, c: greens[Math.floor(L.rand() * 3)].clone(), lift: 0.2 }); }
        }
        return merge([brim, crown, cards(plait), cards(fl)]);
      },
      // the little blue froth and its bright blue bow
      () => merge([froth(0.075, 0.06, blues, blues[1], 170), bowG(bow[0], 0.055, [0, 0.03, 0.072])]),
      // the orange bonnet: a soft dome of dabs and a fluffy edge standing out round it
      () => {
        const dome = body(shape.lathe([[0.1, 0], [0.098, 0.035], [0.08, 0.075], [0.04, 0.095], [0, 0.1]], 24, oranges[2]), oranges[2]);
        const shell = surface(dome, 110).map(({ p: pt, n: nm }) => ({ p: pt, n: nm, up: anyUp(nm), l: 0.04, w: 0.032, c: toned(oranges, nm, L.rand()), lift: 0.12 }));
        const rim = []; for (let i = 0; i < 70; i++) { const a = i / 70 * 6.28 + rnd(0.05), rad = new V3(Math.cos(a), 0.1, Math.sin(a)).normalize(); rim.push({ p: new V3(Math.cos(a) * 0.104, 0.006 + rnd(0.01), Math.sin(a) * 0.104), n: new V3(0, 1, 0).addScaledVector(rad, 0.4).normalize(), up: rad, l: 0.04, w: 0.026, c: [oranges[3], oranges[4], col('#f6dcae', 0.3)][Math.floor(L.rand() * 3)].clone(), lift: 0.5 + L.rand() * 0.5 }); }
        return merge([dome, cards(shell), cards(rim)]);
      },
    ];
    // Wings: a ribbon's loop, from its knot out along +x (flapped about the hat's front-to-back line), in soft satin.
    const wing = (c, len) => {
      const list = []; for (let i = 0; i < 10; i++) { const t = i / 10 * Math.PI * 2, x = len * 0.5 * (1 - Math.cos(t)), y = len * 0.3 * Math.sin(t), t2 = t + 0.63, nx = len * 0.5 * (1 - Math.cos(t2)), ny = len * 0.3 * Math.sin(t2);
        list.push({ p: new V3(x, y, 0), n: new V3(0, 0, 1), up: new V3(nx - x, ny - y, 0).normalize(), l: len * 0.38, w: len * 0.34, c: c.clone().multiplyScalar(0.85 + 0.3 * Math.max(0, Math.sin(t))), lift: 0 }); }
      return cards(list);
    };
    const wingCols = [ochre[0], reds[3], greens[1], bow[1], col('#b8682c')], wingLen = [0.1, 0.085, 0.1, 0.075, 0.09];
    this.size = [{ top: 0.11, wx: 0.1, wy: 0.035, half: 0.13 }, { top: 0.1, wx: 0.09, wy: 0.04, half: 0.12 }, { top: 0.08, wx: 0.1, wy: 0.03, half: 0.15 }, { top: 0.08, wx: 0.06, wy: 0.03, half: 0.08 }, { top: 0.1, wx: 0.09, wy: 0.035, half: 0.11 }].map(z => ({ top: z.top * HS, wx: z.wx * HS, wy: z.wy * HS, half: z.half * HS }));
    // The stand: a turned pole, a knob for the hat, a weighted turned foot, dark polished wood.
    const wood = [col('#4a2c1c', 0.3), col('#5c3a24', 0.3), col('#3a2216', 0.3)];
    const stand = h => merge([
      body(shape.move(shape.cyl(0.014, 0.011, h - 0.07, 12, wood[1]), 0, (h - 0.07) / 2 + 0.06, 0), wood[1]),
      body(shape.move(shape.ball(0.03, wood[0], 1), 0, h - 0.016, 0, 0, 0, 0, 1, 0.6, 1), wood[0]), body(shape.move(shape.ball(0.02, wood[0], 1), 0, h * 0.55, 0, 0, 0, 0, 1, 0.7, 1), wood[0]),
      body(shape.lathe([[0.0, 0.0], [0.1, 0.0], [0.102, 0.012], [0.085, 0.02], [0.05, 0.03], [0.03, 0.05], [0.022, 0.075], [0, 0.078]], 20, wood[0]), wood[2])]);
    // A link of ribbon trailing behind: a soft card, both faces
    const tailG = c => cards([{ p: new V3(0, 0, 0), n: new V3(0, 1, 0), up: new V3(0, 0, 1), l: SEGL * 1.35, w: 0.03, c, lift: 0 }]);
    const tailCols = [ochre[1], reds[2], greens[1], bow[0], oranges[1]];

    const rig = this.rig = L.rig(HATS * (3 + TAILS * SEG) + STANDS.length, 60000, mat);
    this.stands = STANDS.map(s => ({ ...s, inst: rig.add(rig.geo(stand(s.h))) }));
    this.hats = hats.map((mk, k) => {
      const tg = rig.geo(tailG(tailCols[k])), wg = rig.geo(wing(wingCols[k], wingLen[k] * HS));
      const tails = Array.from({ length: TAILS }, (_, j) => ({ segs: Array.from({ length: SEG }, () => rig.add(tg)), p: Array.from({ length: SEG + 1 }, () => new THREE.Vector3()), q: Array.from({ length: SEG + 1 }, () => new THREE.Vector3()), side: j ? 1 : -1, len: k === 2 ? SEGL * 1.4 : SEGL, live: false }));
      const g = mk(); g.scale(HS, HS, HS);
      return { k, inst: rig.add(rig.geo(g)), wings: [rig.add(wg), rig.add(wg)], tails, s: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, flap: 0, squash: 0, vis: false, fly: 0 } };
    });
    // the shop's warm light on the floor, a pool under the stands, and a little more under each
    const warm = col('#f0a860', 0.25);
    this.light = L.glows([{ w: 2.7, d: 1.5, u: 0, out: 0.82, color: warm, strength: 0.55 }, ...STANDS.map(s => ({ w: 0.5, d: 0.42, u: s.u, out: s.out, color: warm, strength: 0.35 }))]);
    this.blobs = L.blobs(HATS);
    this.band = this.makeScore(L);
    this.flutter = L.k.loop({ lp: 1100, hp: 220 });
    this.hideAll();
  },

  makeScore(L) {
    const s = score(L);
    // the shop door's bell, on its spring
    [2637, 2093, 2637, 2349, 2637, 2093].forEach((f, i) => s.note(0.02 + i * 0.07, f, 0.9 - i * 0.08, { type: 'sine', vol: 0.022 - i * 0.002, attack: 0.002, over: 2.76, overVol: 0.4 }));
    s.hit(0.3, { d: 0.55, vol: 0.012, bp: 3200, q: 0.8 });                 // tissue paper
    // the music box (a comb of steel teeth: a bright tone, quick to fade)
    s.tune(AIR, T_FLY - 0.2, 168, { type: 'sine', vol: 0.02, legato: 1.6, over: 3, overVol: 0.35 });
    s.tune('C4:2 E4:2 | F4:2 E4:2 | D4:2 C4:2 | G3:2 C4:2 | E4:2 D4:2 | C4:2 B3:2 | E4:2 D4:2 | C4:2 B3:2 | C4:2 E4:2 | F4:2 E4:2 | D4:2 G3:2 | C4:4', T_FLY - 0.2, 168, { type: 'sine', vol: 0.011, legato: 1.4, oct: 1 });
    // while you keep looking, the air again, very softly, now and then
    const again = []; const tmp = score(L); tmp.tune(AIR, 0, 150, { type: 'sine', vol: 0.008, legato: 1.6, over: 3, overVol: 0.3 }); again.push(...tmp.ev);
    s.loop(IDLE0 + 6, 26, again);
    return s.done();
  },

  hideAll() {
    const r = this.rig;
    for (const s of this.stands) r.show(s.inst, false);
    for (let i = 0; i <= STANDS.length; i++) this.light.set(i, 0);
    for (const h of this.hats) { for (const i of [h.inst, ...h.wings]) r.show(i, false); for (const t of h.tails) { for (const i of t.segs) r.show(i, false); t.live = false; } h.s.vis = false; }
    this.blobs.count = 0;
  },
  start(L, resumed) {
    if (!resumed) this.hideAll();
    this.band.from(L.t); this.cues = new Set();
    if (!this.told && !L.quiet) { this.told = true; L.k.say('The bell over the shop door rings.', 3.5); }
  },
  back(L) { this.from = this.hats.map(h => ({ x: h.s.x, y: h.s.y, z: h.s.z, yaw: h.s.yaw, vis: h.s.vis })); },
  end() { this.hideAll(); this.flutter.set(0); },
  reset() { this.hideAll(); this.flutter.set(0); this.told = false; },

  update(L, dt) {
    const t = L.t, ph = L.phase, showing = ph === 'wake' || ph === 'play', R = L.ret, r = this.rig, B = this.B, M = this.M;
    // ---- the stands come up out of the floor, and go down again
    this.stands.forEach((s, i) => {
      const k = showing ? ease.outBack(ramp(t, 0.15 + i * 0.12, 0.6 + i * 0.12)) : 1 - ease.inOut(ramp(R, 0.55 + i * 0.05, 0.95));
      r.show(s.inst, k > 0.002); if (k <= 0.002) return;
      if (showing && !this.cues.has('s' + i) && k > 0.5) { this.cue('s' + i); this.tock(L, i); }
      const p = L.floor(s.u, s.out, this.T); B.set(M[0], p.x, L.y - (s.h + 0.05) * (1 - k), p.z, L.yawOut + i); r.mat(s.inst, M[0]);
    });
    const lk = showing ? ease.smooth(ramp(t, 0.05, 1.3)) : 1 - ease.smooth(ramp(R, 0.45, 1));
    this.light.set(0, lk * (0.96 + 0.04 * Math.sin(t * 1.7))); this.stands.forEach((s, i) => this.light.set(i + 1, lk * ramp(showing ? t : 9, 0.4 + i * 0.12, 1.0 + i * 0.12)));
    // ---- the hats
    let nb = 0, flying = 0;
    this.hats.forEach(h => {
      if (showing) this.fly(L, h, t); else this.homeward(L, h, R);
      this.place(L, h, dt);
      if (h.s.vis) { flying += h.s.fly; const gy = h.s.y - L.y; if (gy < 0.7) this.blobs.set(nb++, h.s.x, h.s.z, this.size[h.k].half * 0.9, 0.7 * clamp01(1 - gy / 0.7)); }
    });
    this.blobs.count = nb;
    if (showing) this.band.play(t);
    const near = Math.max(0, 1 - Math.hypot(L.k.G.camera.position.x - L.cx, L.k.G.camera.position.z - L.cz) / 10);
    this.flutter.set(L.quiet ? 0 : 0.02 * Math.min(2.5, flying) / 2.5 * near, 0.08);
    L.voice().place(L.cx + L.nx, L.cz + L.nz);
  },
  cue(id) { this.cues.add(id); },
  tock(L, i) { if (L.quiet) return; const v = L.voice(); v.note(820 - i * 40, 0.07, { vol: 0.025, type: 'sine', to: 420 }); noise(v, 0, { d: 0.05, vol: 0.01, bp: 1800 }); },
  chirp(L, k, kind = 0) {
    if (L.quiet) return; const v = L.voice(); if (!v.ctx) return;
    const base = [900, 2000, 2600, 3600, 1600][k];
    if (kind === 0) { v.chirp(base, base * 1.25, 0.07, { vol: 0.016 }); v.chirp(base * 1.1, base * 0.9, 0.06, { at: 0.09, vol: 0.013 }); }
    else if (kind === 1) for (let i = 0; i < 5; i++) v.chirp(base * (1 + 0.1 * (i % 2)), base * 1.2, 0.04, { at: i * 0.055, vol: 0.013 });       // a trill
    else { v.chirp(base * 1.2, base * 0.6, 0.18, { vol: 0.018, flutter: 30 }); }                                                               // indignant
  },
  flump(L, k) { if (L.quiet) return; const v = L.voice(); noise(v, 0, { d: 0.12, vol: 0.014, lp: 700 }); v.note(180 + k * 20, 0.08, { vol: 0.012, type: 'sine', to: 110 }); },

  // ---------------------------------------------------------- where each hat is at show-time t
  stage(L, u, out, hgt, S) { const p = L.floor(u, out, this.T); S.x = p.x; S.y = L.y + hgt; S.z = p.z; },
  standTop(L, k, t) { const st = STANDS[this.standOf(k, t)]; return { u: st.u, out: st.out, h: st.h }; },
  // Which stand hat k is on at time t, after the swaps of the idle so far.
  standOf(k, t) {
    const home = HOME.slice(); if (t < IDLE0 + SWAP) return home[k];
    const n = Math.floor((t - IDLE0) / SWAP), pairs = [[0, 1], [2, 3], [1, 2], [3, 4], [0, 2], [1, 3]];
    for (let i = 0; i < n; i++) { const [a, b] = pairs[i % pairs.length]; const x = home[a]; home[a] = home[b]; home[b] = x; }
    return home[k];
  },
  flock(L, k, t, S) {
    const c = this.path || (this.path = new THREE.CatmullRomCurve3([[0, 0.45, 0.74], [0.8, 0.6, 0.66], [1.05, 1.0, 0.5], [0.5, 1.24, 0.34], [-0.3, 1.27, 0.36], [-1.0, 1.06, 0.48], [-0.85, 0.6, 0.68]].map(p => new THREE.Vector3(...p)), true, 'catmullrom', 0.5));
    const s = ((t - T_FLY) / LOOP + k * 0.075) % 1, v = c.getPointAt((s + 1) % 1, this.U), d = c.getTangentAt((s + 1) % 1, this.W);
    const bob = Math.sin(t * 5 + k * 2) * 0.035, side = Math.sin(t * 2.3 + k * 1.3) * 0.07;
    this.stage(L, v.x + d.z * side, v.y - d.x * side, v.z + bob, S);
    S.yaw = L.yawOf(d.x, d.y); S.roll = -Math.sin((s - 0.25) * Math.PI * 2) * 0.25; S.pitch = -0.1;
  },
  fly(L, h, t) {
    const k = h.k, S = h.s, ord = ORDER.indexOf(k), te = 0.95 + ord * 0.3, sz = this.size[k];
    S.pitch = 0; S.roll = 0; S.squash = 0; S.flap = -0.35; S.fly = 0; S.vis = true; S.yaw = L.yawOut;
    if (t < te) { S.vis = false; return; }
    const rail = L.rail - L.y;
    if (t < te + 0.5) {                                                     // peeping out from under the frame
      const q = (t - te) / 0.5; this.stage(L, EXIT[k], lerp(-0.18, 0.08, ease.out(q * 1.6)), rail - sz.top - 0.03, S);
      S.yaw = L.yawOut + Math.sin(q * Math.PI * 4) * 0.35 * ramp(q, 0.4, 1); S.flap = -0.35 + 0.4 * hump(q, 0.6, 0.9);
      if (!this.cues.has('peep' + k) && q > 0.55) { this.cue('peep' + k); this.chirp(L, k, 0); }
      return;
    }
    const drop = te + 0.5, land0 = { u: EXIT[k] * 1.4, out: 0.34 };
    if (t < drop + 0.55) {                                                 // off the ledge, beating hard, down to the floor
      const q = (t - drop) / 0.55, h0 = rail - sz.top - 0.03;
      this.stage(L, lerp(EXIT[k], land0.u, q), lerp(0.08, land0.out, q), Math.max(0, h0 * (1 - q * q * 0.6 - q * 0.4)), S);
      S.flap = Math.sin(t * 42) * 0.9; S.fly = 1; S.pitch = 0.15; return;
    }
    if (!this.cues.has('land' + k)) { this.cue('land' + k); this.flump(L, k); }
    // hopping about the floor, sparrow-fashion, towards the front, pecking at nothing
    const tf = T_FLY + ord * 0.11;
    if (t < tf) {
      const tgt = { u: [-0.85, -0.3, 0.3, 0.75, -0.02][k], out: [0.98, 1.16, 1.12, 0.94, 1.2][k] }, H = 0.34, hops = Math.max(1, Math.floor((tf - drop - 0.55) / H));
      const q = (t - drop - 0.55) / H, i = Math.min(hops - 1, Math.floor(q)), f = Math.min(1, q - i);
      const at = j => { const a = j / hops, z = (j % 2 ? 1 : -1) * 0.05 * (j > 0 && j < hops ? 1 : 0); return { u: lerp(land0.u, tgt.u, a) + z, out: lerp(land0.out, tgt.out, a) }; };
      const a = at(i), b = at(i + 1), hopF = Math.min(1, f / 0.62), up = 4 * hopF * (1 - hopF) * 0.06;
      this.stage(L, lerp(a.u, b.u, ease.inOut(hopF)), lerp(a.out, b.out, ease.inOut(hopF)), up, S);
      S.yaw = turnTo(L.yawOf(b.u - a.u, b.out - a.out), L.yawOut + Math.sin(i * 2.1 + k) * 0.9, ramp(f, 0.62, 0.8));
      S.pitch = f > 0.66 ? 0.45 * hump(f, 0.66, 1) : -0.08 * hump(hopF, 0, 1); S.squash = hopF < 0.1 || f > 0.62 ? 0.12 * hump(f, 0.62, 0.85) : -0.06;
      S.flap = -0.35 + 0.5 * hump(hopF, 0, 0.5);
      if (!this.cues.has('hop' + k + '.' + i) && hopF > 0.95) { this.cue('hop' + k + '.' + i); if ((i + k) % 3 === 0) this.chirp(L, k, 0); }
      return;
    }
    // up, all together, and round the floor in a flock
    const tl = T_LAND + ord * 0.32 + (k === BLUE ? 0.25 : 0), st = this.standTop(L, k, t);
    if (t < tl) {
      this.flock(L, k, t, S); S.fly = 1; S.flap = Math.sin(t * (30 + k * 3)) * 0.95;
      const rise = ramp(t, tf, tf + 0.55); if (rise < 1) { const o = {}; const tgt = { u: [-0.85, -0.3, 0.3, 0.75, -0.02][k], out: [0.98, 1.16, 1.12, 0.94, 1.2][k] }; this.stage(L, tgt.u, tgt.out, 0, o); const e = ease.inOut(rise); S.x = lerp(o.x, S.x, e); S.y = lerp(o.y, S.y, e); S.z = lerp(o.z, S.z, e); }
      if (!this.cues.has('up' + k) && t > tf) { this.cue('up' + k); if (k === 0) this.chirp(L, 3, 1); }
      return;
    }
    // in to land on its stand: a glide, a flare, a bump and a wobble
    const LD = 0.85, q = (t - tl) / LD;
    if (q < 1) {
      const a = {}; this.flock(L, k, tl, a); const top = {}; this.stage(L, st.u + (k === BLUE ? 0.07 : 0), st.out, st.h + (k === BLUE ? 0.02 : 0), top);
      const ctl = { x: (a.x + top.x) / 2, y: Math.max(a.y, top.y) + 0.12, z: (a.z + top.z) / 2 }, e = ease.inOut(q), b = 1 - e;
      S.x = b * b * a.x + 2 * b * e * ctl.x + e * e * top.x; S.y = b * b * a.y + 2 * b * e * ctl.y + e * e * top.y; S.z = b * b * a.z + 2 * b * e * ctl.z + e * e * top.z;
      S.yaw = turnTo(a.yaw, L.yawOut, ramp(q, 0.4, 1)); S.pitch = -0.4 * ramp(q, 0.6, 1); S.flap = Math.sin(t * (q > 0.65 ? 50 : 26)) * (q > 0.65 ? 1 : 0.8); S.fly = 1;
      return;
    }
    let tp = t - tl - LD;                                                    // time since it came down on the stand
    if (k === BLUE && t < IDLE0 - 0.2) {
      // it misses: off the edge of the stand, a tumble to the floor, a sit, two cross hops, and up at the second go
      const top = { u: st.u + 0.07, out: st.out, h: st.h + 0.02 }, base = { u: st.u + 0.17, out: st.out + 0.08 };
      if (tp < 0.45) { const q2 = tp / 0.45; this.stage(L, lerp(top.u, base.u, q2), lerp(top.out, base.out, q2), top.h * (1 - q2 * q2) + 0.06 * Math.sin(Math.PI * q2), S); S.roll = -q2 * Math.PI * 1.4; S.flap = Math.sin(t * 40) * 0.9; S.fly = 1; if (!this.cues.has('miss')) { this.cue('miss'); this.chirp(L, k, 2); } return; }
      if (!this.cues.has('bump')) { this.cue('bump'); this.flump(L, k); }
      if (tp < 0.85) { this.stage(L, base.u, base.out, 0, S); S.roll = -Math.PI * 1.4 * (1 - ease.outBack(ramp(tp, 0.45, 0.75))) ; S.squash = 0.15 * hump(tp, 0.45, 0.65); return; }
      if (tp < 1.4) { const q2 = (tp - 0.85) / 0.55, i = Math.min(1, Math.floor(q2 * 2)), f = q2 * 2 - i; this.stage(L, base.u - 0.04 * (i + f), base.out + (i ? -0.03 : 0.03), 0.07 * 4 * f * (1 - f), S); S.yaw = L.yawOut + (i ? -0.6 : 0.6); S.squash = -0.08 * hump(f, 0, 1); if (!this.cues.has('huff' + i) && f > 0.5) { this.cue('huff' + i); this.chirp(L, k, 2); } return; }
      if (tp < 2.05) { const q2 = ease.inOut((tp - 1.4) / 0.65); const a = {}, b = {}; this.stage(L, base.u - 0.08, base.out, 0, a); this.stage(L, st.u, st.out, st.h, b); S.x = lerp(a.x, b.x, q2); S.z = lerp(a.z, b.z, q2); S.y = lerp(a.y, b.y, q2) + 0.14 * Math.sin(Math.PI * q2); S.flap = Math.sin(t * 48); S.fly = 1; S.pitch = -0.3 * q2; return; }
      tp -= 2.05;
      if (!this.cues.has('made')) { this.cue('made'); this.chirp(L, k, 1); }
    }
    // perched: settling, and, all together, a fluff when the little one is up; then preening, and the swaps
    this.stage(L, st.u, st.out, st.h, S);
    S.squash = 0.18 * Math.exp(-tp * 5) * Math.sin(tp * 20) + 0.14 * hump(t, IDLE0 - 0.6, IDLE0);
    S.yaw = L.yawOut + Math.sin(t * 0.6 + k * 1.7) * 0.25 * ramp(t, IDLE0, IDLE0 + 2);
    S.flap = -0.35 + 0.5 * hump(t, IDLE0 - 0.6, IDLE0) + 0.25 * Math.max(0, Math.sin(t * 1.3 + k * 2.4) - 0.92) * 12;
    if (!this.cues.has('fluff') && t > IDLE0 - 0.4) { this.cue('fluff'); this.chirp(L, 0, 1); this.chirp(L, 4, 0); }
    if (t >= IDLE0 + SWAP - 1.2) {
      // two of them swap stands, every so often, with words
      const n = Math.floor((t - IDLE0 + 1.2) / SWAP), tt = t - (IDLE0 + n * SWAP - 1.2);
      if (n >= 1 && tt < 1.2) {
        const was = this.standOf(k, IDLE0 + (n - 1) * SWAP + 0.01), will = this.standOf(k, IDLE0 + n * SWAP + 0.01);
        if (was !== will) {
          const a = STANDS[was], b = STANDS[will], q2 = ease.inOut(tt / 1.2), A = {}, Bp = {};
          this.stage(L, a.u, a.out, a.h, A); this.stage(L, b.u, b.out, b.h, Bp);
          S.x = lerp(A.x, Bp.x, q2); S.z = lerp(A.z, Bp.z, q2); S.y = lerp(A.y, Bp.y, q2) + 0.13 * Math.sin(Math.PI * q2) + (k % 2 ? 0.04 : -0.03) * Math.sin(Math.PI * q2);
          S.yaw = L.yawOf(b.u - a.u, b.out - a.out); S.flap = Math.sin(t * 34) * 0.9; S.fly = 1; S.squash = 0;
          const id = 'swap' + n + '.' + k; if (!this.cues.has(id) && tt > 0.05) { this.cue(id); this.chirp(L, k, 1); }
        }
      }
    }
  },
  // Home: up off wherever it is, and in under the frame where it came out.
  homeward(L, h, R) {
    const f = this.from && this.from[h.k], S = h.s, k = h.k;
    if (!f || !f.vis) { S.vis = false; return; }
    const ord = ORDER.indexOf(k), q = clamp01((R - ord * 0.08) / 0.62), e = ease.inOut(q), sz = this.size[k], rail = L.rail - L.y;
    const mouth = {}, inside = {}; this.stage(L, EXIT[k], 0.12, rail - sz.top - 0.04, mouth); this.stage(L, EXIT[k], -0.25, rail - sz.top - 0.04, inside);
    const ctl = { x: (f.x + mouth.x) / 2, y: Math.max(f.y, mouth.y) + 0.06, z: (f.z + mouth.z) / 2 };
    if (q < 0.85) { const s = e / ease.inOut(0.85), b = 1 - s; S.x = b * b * f.x + 2 * b * s * ctl.x + s * s * mouth.x; S.y = b * b * f.y + 2 * b * s * ctl.y + s * s * mouth.y; S.z = b * b * f.z + 2 * b * s * ctl.z + s * s * mouth.z; }
    else { const s = (q - 0.85) / 0.15; S.x = lerp(mouth.x, inside.x, s); S.y = mouth.y; S.z = lerp(mouth.z, inside.z, s); }
    S.yaw = turnTo(f.yaw, L.yawOut + Math.PI, ramp(q, 0, 0.3)); S.pitch = 0; S.roll = 0; S.squash = 0; S.flap = Math.sin(L.r * (32 + k * 3)) * 0.9; S.fly = 1; S.vis = q < 1;
  },

  // ---------------------------------------------------------- the hat, its bows beating, its ribbons trailing
  place(L, h, dt) {
    const r = this.rig, B = this.B, M = this.M, S = h.s, sz = this.size[h.k];
    if (!S.vis) { if (h.shown) { for (const i of [h.inst, ...h.wings]) r.show(i, false); for (const t of h.tails) { for (const i of t.segs) r.show(i, false); t.live = false; } h.shown = false; } return; }
    if (!h.shown) { for (const i of [h.inst, ...h.wings]) r.show(i, true); for (const t of h.tails) for (const i of t.segs) r.show(i, true); h.shown = true; }
    const sq = this.SQ || (this.SQ = new THREE.Vector3());
    sq.set(1 + S.squash * 0.6, 1 - S.squash, 1 + S.squash * 0.6);
    B.set(M[0], S.x, S.y, S.z, S.yaw, S.pitch, S.roll, sq); r.mat(h.inst, M[0]);
    for (let s = 0; s < 2; s++) { const sd = s ? 1 : -1; B.child(M[1], M[0], sd * sz.wx * 0.55, sz.wy, -0.01, s ? 0 : Math.PI, 0, S.flap * (s ? 1 : 1)); r.mat(h.wings[s], M[1]); }
    // ribbons: a few links hanging from the back of the hat, swinging and streaming behind it (a little Verlet chain)
    const dd = Math.min(dt, 1 / 30);
    h.tails.forEach((tl, j) => {
      const a = this.U.set(tl.side * sz.half * 0.35, sz.wy * 0.6, -sz.half * 0.8).applyMatrix4(M[0]);
      if (!tl.live) { for (let i = 0; i <= SEG; i++) { tl.p[i].set(a.x, a.y - i * tl.len, a.z); tl.q[i].copy(tl.p[i]); } tl.live = true; }
      tl.p[0].copy(a); tl.q[0].copy(a);
      for (let i = 1; i <= SEG; i++) {
        const p = tl.p[i], q = tl.q[i], vx = (p.x - q.x) * 0.9, vy = (p.y - q.y) * 0.9, vz = (p.z - q.z) * 0.9; q.copy(p);
        const fl = Math.sin(L.t * 17 + i * 1.3 + j * 2 + h.k) * 0.6 * S.fly;
        p.x += vx + fl * dd * dd * 4; p.y += vy - 3.2 * dd * dd; p.z += vz + fl * dd * dd * 4;
        if (p.y < L.y + 0.004) p.y = L.y + 0.004;
      }
      for (let it = 0; it < 3; it++) for (let i = 1; i <= SEG; i++) { const a0 = tl.p[i - 1], b0 = tl.p[i], d = b0.distanceTo(a0) || 1e-5, f = (d - tl.len) / d; if (i === 1) b0.lerp(a0, f); else { const m = this.W.subVectors(b0, a0).multiplyScalar(f * 0.5); a0.add(m); b0.sub(m); } }
      for (let i = 0; i < SEG; i++) {
        const a0 = tl.p[i], b0 = tl.p[i + 1], dx = b0.x - a0.x, dy = b0.y - a0.y, dz = b0.z - a0.z, hl = Math.hypot(dx, dz);
        B.set(M[2], (a0.x + b0.x) / 2, (a0.y + b0.y) / 2, (a0.z + b0.z) / 2, Math.atan2(dx, dz), -Math.atan2(dy, hl), 0.3 * Math.sin(L.t * 6 + i + j), tl.len / SEGL); r.mat(tl.segs[i], M[2]);
      }
    });
  },
});
