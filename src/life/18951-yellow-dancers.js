// Edgar Degas, Yellow Dancers (In the Wings) (1874-76), Gallery 226. The word: pirouette.
//
// In the picture three dancers in yellow wait in the wings, and to the left a painted flat of scenery stands with
// four pairs of feet showing under it. Look at it and the stage comes out into the room: a row of gas footlights
// rises out of the floor and lights, a pool of stage light comes up on the floor, and two flats of his scenery (its
// orange and teal foliage, scumbled) rise out of the floor either side of the stage, braced at the back as real flats
// are. The orchestra tunes (an oboe's A, the strings coming in under it), and under the flats you see feet, as in the
// picture, shifting, rising onto their points. Then the three dancers come out, drawn the way he drew them: every one
// of them made of soft, chalky pastel strokes in the picture's yellows and greens, its pinks, its dark hair and the
// black ribbon at the throat, their skirts layers of tarlatan petals in broken, chalky gauze (a soft bell to the knee
// that opens flat as they spin). Two bourree out from the wings; the third comes from the left in a chain of turns
// across the light to the middle, gathers in a plie, and spins: pirouettes, then fouettes, her skirt flaring, while
// the others turn in canon and hold arabesques either side; she ends en pointe, arms up, and all three curtsey, to
// the theme from Tchaikovsky's Swan Lake (1876) over a harp. While you keep looking they wait as they wait in the
// picture: one with her hands up at her hair, one setting her shoulder strap, and the soloist turns now and then.
// When you stop, they bourree back behind the flats (their feet showing under them again), and the stage goes down
// into the floor.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, canvasTexture } from '../paintlife.js';
import { score, Bones, hump, turnTo, noise, hz } from './stagecraft.js';

const NB = 13;                       // bones: pelvis, torso, head, upper and fore arm (R, L), thigh, shin, foot (R, L)
const PEL = 0, TOR = 1, HEAD = 2, UAR = 3, FAR = 4, UAL = 5, FAL = 6, THR = 7, SHR = 8, FTR = 9, THL = 10, SHL = 11, FTL = 12;
const THIGH = 0.112, SHIN = 0.106, FOOT = 0.032, UARM = 0.066, FARM = 0.062, TORSO = 0.1;
const SC = 1.55;                     // the dancers' size: 0.68 m, the toy's height and a half
const FLAT = { w: 0.5, h: 0.76, lift: 0.12 }, FLATS = [{ u: -0.84, out: 0.3, yaw: 0.85 }, { u: 0.86, out: 0.28, yaw: -0.85 }];
const LAMPS = 7, LAMP_OUT = 0.94;
const HOME = [{ u: -0.5, out: 0.56 }, { u: 0.5, out: 0.56 }, { u: 0, out: 0.66 }];          // A, B, the soloist
const WING = [{ u: -1.0, out: 0.14 }, { u: 1.02, out: 0.12 }, { u: -0.8, out: 0.04 }];
const BPM = 100, BT = 60 / BPM, M0 = 2.4;                                                         // the theme's first beat
// Swan Lake (Tchaikovsky, 1876), the swans' theme, B minor; and the harp under it.
const SWAN = 'F#5:2.5 B4:0.375 C#5:0.375 D5:0.375 E5:0.375 | F#5:1.5 D5:0.5 F#5:1.5 D5:0.5 | F#5:1.5 B4:0.5 D5:0.5 B4:0.5 G4:0.5 D5:0.5 | B4:4';
const HARP = [[47, 54, 59, 62, 66, 62, 59, 54], [47, 54, 59, 62, 66, 62, 59, 54], [43, 50, 55, 59, 62, 59, 55, 50], [47, 54, 59, 62, 66, 71, 66, 62]];

lifeFor(18951, {
  title: /^Yellow Dancers/,
  word: 'pirouette',
  stage: { out: 1.5, half: 1.15, cam: { dist: 2.0, height: 0.3, side: 0.05, fov: 62, lookU: 0.0, lookOut: 0.5, lookH: 0.95, floorOut: 1.0 } },
  wake: 2, ret: 2.2,

  build(L) {
    const P = L.pal, col = (h, a = 0.4) => P.near(h, a);
    this.B = new Bones(); this.T = new THREE.Vector3(); this.V = new THREE.Vector3(); this.N = new THREE.Vector3();
    this.mats = Array.from({ length: 3 }, () => Array.from({ length: NB }, () => new THREE.Matrix4()));
    this.R = new THREE.Matrix4(); this.tmpM = new THREE.Matrix4();
    // ---------------------------------------------------------- the pastel stroke: soft, grainy, the paper's tooth in it
    const chalk = canvasTexture(128, 128, (g, W, h) => {
      const w = 64;
      // a stick of pastel dragged down the paper: a broad mark with ragged sides and ends, broken by the paper's tooth
      // (fine streaks along the stroke where the chalk skips) and its grain, lighter and darker within it
      const img = g.createImageData(w, h), d = img.data, wob = Array.from({ length: h }, (_, y) => 0.12 * Math.sin(y * 0.21 + 1.3) + 0.08 * Math.sin(y * 0.57) + (L.rand() - 0.5) * 0.1);
      const tooth = Array.from({ length: w }, () => L.rand());
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const v = (y + 0.5) / h, ex = Math.abs(((x + 0.5) / w - 0.5) * 2 + wob[y] * 0.5), end = Math.min(1, v / 0.14, (1 - v) / 0.2);
        const side = 0.78 + wob[y] - ex, grain = L.rand(), skip = tooth[x] < 0.22 ? -0.5 : 0;
        const a = Math.min(side * 3.2, end * 2.2 - 0.25 + L.rand() * 0.5) + (grain - 0.5) * 0.9 + skip * (0.6 + 0.4 * Math.sin(y * 0.3 + x));
        const i = (y * w + x) * 4, lgt = 190 + 50 * tooth[x] + 15 * L.rand();
        d[i] = d[i + 1] = d[i + 2] = lgt; d[i + 3] = Math.max(0, Math.min(255, a * 255));
      }
      g.putImageData(img, 0, 0);
      // and a petal of tarlatan (the right half): a fan, narrow at the waist and wide and frilled at the hem, the chalk
      // laid on thin over it so it is broken all over, and the layers under it show through (as gauze does)
      const pet = g.createImageData(64, h), q = pet.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < 64; x++) {
        const v = 1 - (y + 0.5) / h, xn = ((x + 0.5) / 64 - 0.5) * 2, half = 0.22 + 0.78 * Math.pow(Math.sin(Math.min(1, v * 1.15) * Math.PI / 2), 0.8);
        const hem = 0.9 + 0.07 * Math.sin(xn * 9 + 1) + 0.03 * Math.sin(xn * 23), side = half - Math.abs(xn), end = Math.min(v / 0.08, (hem - v) / 0.06);
        const pleat = 0.12 * Math.sin(xn * 13 / Math.max(0.3, half)), grain = L.rand();
        const a = Math.min(side * 4, end) * 0.62 + (grain - 0.5) * 1.15 + pleat + (v > 0.55 ? 0.05 : 0);
        const i = (y * 64 + x) * 4, lgt = 205 + 40 * L.rand() + 10 * v;
        q[i] = q[i + 1] = q[i + 2] = lgt; q[i + 3] = Math.max(0, Math.min(255, a * 255));
      }
      g.putImageData(pet, 64, 0);
    });
    // ---------------------------------------------------------- the dancers, as strokes on their bones
    const cTutu = [col('#bdb860', 0.5), col('#a6a650', 0.5), col('#cfc985', 0.45), col('#8f9a4c', 0.5), col('#dcd6a0', 0.4)];
    const cSkin = [col('#d9ae8e', 0.3), col('#bf8f74', 0.3), col('#ecc9ab', 0.25)], cHair = [col('#3a2a20', 0.3), col('#4d3828', 0.3)];
    const cRib = col('#1d1916', 0.2), cBod = [col('#dcd58e', 0.3), col('#ece6b8', 0.25)], cTights = [col('#dcb09c', 0.3), col('#c49482', 0.3)], cShoe = col('#e2a898', 0.35), cFlower = col('#e07a8a', 0.4);
    this.strokes = [];
    const pick = a => a[Math.floor(L.rand() * a.length)];
    const add = (who, bone, p, dir, n, len, wid, c, tutu = 0) => this.strokes.push({ who, bone, p: new THREE.Vector3(...p), d: new THREE.Vector3(...dir).normalize(), n: new THREE.Vector3(...n).normalize(), len, wid, c: new THREE.Color(c), tutu });
    const jit = s => (L.rand() - 0.5) * s;
    for (let who = 0; who < 3; who++) {
      // the romantic tutu: layers of tarlatan petals from the waist, a soft bell to the knee, the top layer flatter and
      // shorter (a froth at the waist); each a broken, chalky gauze, so the layers under it show through
      for (const [n, len, wid, tilt, c0] of [[12, 0.145, 0.085, 1.2, 3], [13, 0.128, 0.08, 1.03, 1], [12, 0.098, 0.072, 0.82, 0], [9, 0.062, 0.066, 0.52, 2]]) {
        for (let k = 0; k < n; k++) { const a = (k + 0.5 * (n % 2)) / n * Math.PI * 2 + jit(0.3); this.strokes.push({ who, bone: PEL, petal: { a, tilt: tilt + jit(0.12), r0: 0.028 }, len: len * (0.9 + L.rand() * 0.2), wid: wid * (0.9 + L.rand() * 0.2), c: new THREE.Color(L.rand() < 0.65 ? cTutu[c0] : pick(cTutu)), tutu: 1, p: new THREE.Vector3(), d: new THREE.Vector3(), n: new THREE.Vector3() }); }
      }
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + jit(0.4); add(who, PEL, [Math.sin(a) * 0.05, -0.02, Math.cos(a) * 0.05], [Math.sin(a) * 0.8, -0.6, Math.cos(a) * 0.8], [Math.sin(a), 0.4, Math.cos(a)], 0.06, 0.02, pick([cTutu[2], cTutu[4]]), 0.5); }      // a few strokes of light over it
      // the bodice and the bare shoulders
      for (let k = 0; k < 8; k++) { const a = (k / 4) * Math.PI * 2 + (k > 3 ? 0.8 : 0), up = k > 3, r = up ? 0.021 : 0.013;      // the bodice: a narrow waist, the bust above it
        add(who, TOR, [Math.sin(a) * r, (up ? 0.066 : 0.028) + jit(0.008), Math.cos(a) * r * 0.7], [jit(0.4), 1, 0], [Math.sin(a), 0, Math.cos(a)], up ? 0.05 : 0.05, up ? 0.032 : 0.024, pick(cBod)); }
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; add(who, TOR, [Math.sin(a) * 0.024, 0.084, Math.cos(a) * 0.015], [1, jit(0.4), 0], [Math.sin(a), 0.5, Math.cos(a)], 0.046, 0.026, pick(cSkin)); }
      add(who, TOR, [0, 0.01, 0.012], [1, 0, 0], [0, 0, 1], 0.04, 0.01, cTutu[2]);       // the waist
      // the head: the face, the dark hair drawn back, the bun, the ribbon at the throat, a flower
      add(who, HEAD, [0, 0.0, 0.01], [0, 1, 0.1], [0, 0, 1], 0.047, 0.036, cSkin[2]); add(who, HEAD, [0.006, -0.006, 0.014], [0.2, 1, 0], [0.4, -0.3, 1], 0.03, 0.022, cSkin[1]);
      for (let k = 0; k < 4; k++) { const a = (k / 3 - 0.5) * 2.4 + Math.PI; add(who, HEAD, [Math.sin(a) * 0.014, 0.012, Math.cos(a) * 0.012], [Math.cos(a), 0.6, -Math.sin(a)], [Math.sin(a), 0.6, Math.cos(a)], 0.04, 0.024, pick(cHair)); }
      add(who, HEAD, [0, 0.022, -0.004], [1, 0, 0], [0, 1, 0], 0.036, 0.016, cHair[0]);
      add(who, HEAD, [0, 0.016, -0.022], [1, 0.3, 0], [0, 0.3, -1], 0.028, 0.026, cHair[1]);
      add(who, HEAD, [0.016, 0.014, -0.01], [0, 1, 0], [1, 0.3, 0], 0.012, 0.012, cFlower);
      add(who, TOR, [0, 0.112, 0.004], [1, 0, 0], [0, 0, 1], 0.03, 0.007, cRib);
      add(who, TOR, [0, 0.106, 0], [0, 1, 0], [0, 0, 1], 0.028, 0.019, cSkin[0]);       // the neck
      // arms, legs, feet: a few long strokes down each, a pale one on the lit side
      for (const [ua, fa] of [[UAR, FAR], [UAL, FAL]]) {
        add(who, ua, [0, -UARM * 0.5, 0], [0, -1, 0], [0, 0, 1], UARM * 1.35, 0.029, cSkin[0]); add(who, ua, [0, -UARM * 0.45, 0.004], [0, -1, 0.1], [0.3, 0.3, 1], UARM * 0.95, 0.014, cSkin[2]);
        add(who, fa, [0, -FARM * 0.5, 0], [0, -1, 0], [0, 0, 1], FARM * 1.4, 0.025, cSkin[1]); add(who, fa, [0, -FARM * 0.45, 0.003], [0, -1, 0], [0.3, 0.3, 1], FARM, 0.013, cSkin[2]);
        add(who, fa, [0, -FARM - 0.008, 0], [0, -1, 0], [0, 0, 1], 0.024, 0.018, cSkin[0]);
      }
      for (const [th, sh, ft] of [[THR, SHR, FTR], [THL, SHL, FTL]]) {
        add(who, th, [0, -THIGH * 0.55, 0], [0, -1, 0], [0, 0, 1], THIGH * 1.2, 0.036, cTights[0]); add(who, th, [0.004, -THIGH * 0.5, -0.006], [0, -1, 0], [0.5, 0, -1], THIGH, 0.03, cTights[1]);
        add(who, sh, [0, -SHIN * 0.3, 0], [0, -1, 0], [0, 0, 1], SHIN * 0.8, 0.03, cTights[0]); add(who, sh, [0, -SHIN * 0.72, 0], [0, -1, 0], [0, 0, 1], SHIN * 0.7, 0.024, cTights[1]);
        add(who, sh, [0.003, -SHIN * 0.5, 0.005], [0, -1, 0], [0.4, 0.2, 1], SHIN * 0.8, 0.01, cSkin[2]); add(who, sh, [-0.004, -SHIN * 0.45, -0.005], [0, -1, 0], [-0.5, 0, -1], SHIN * 0.85, 0.026, cTights[1]);
        add(who, ft, [0, -FOOT * 0.5, 0], [0, -1, 0], [0, 0, 1], FOOT * 1.5, 0.019, cShoe);
      }
    }
    const NS = this.strokes.length, geo = new THREE.PlaneGeometry(1, 1);
    this.aPos = new THREE.InstancedBufferAttribute(new Float32Array(NS * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aDir = new THREE.InstancedBufferAttribute(new Float32Array(NS * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aSide = new THREE.InstancedBufferAttribute(new Float32Array(NS * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aKind = new THREE.InstancedBufferAttribute(new Float32Array(NS), 1).setUsage(THREE.DynamicDrawUsage);
    const aSize = new THREE.InstancedBufferAttribute(new Float32Array(NS * 2), 2);
    this.strokes.forEach((s, i) => aSize.setXY(i, s.len * SC, s.wid * SC));
    geo.setAttribute('aPos', this.aPos); geo.setAttribute('aDir', this.aDir); geo.setAttribute('aSize', aSize); geo.setAttribute('aSide', this.aSide); geo.setAttribute('aKind', this.aKind);
    const mat = new THREE.MeshBasicMaterial({ map: chalk, alphaTest: 0.5, side: THREE.DoubleSide, fog: false });
    // Each stroke stands facing the camera, its length laid along the way its bone runs as the camera sees it.
    mat.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aPos; attribute vec3 aDir; attribute vec2 aSize; attribute vec3 aSide; attribute float aKind;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vMapUv.x = vMapUv.x * 0.5 + step(0.5, aKind) * 0.5;')
        .replace('#include <project_vertex>', `
  vec4 mvPosition;
  if (aKind > 0.5) {          // a petal of the tutu: a card lying in the world, out from the waist
    mvPosition = viewMatrix * vec4(aPos + aDir * position.y * aSize.x + aSide * position.x * aSize.y, 1.0);
  } else {                    // a stroke: facing the camera, along its bone as the camera sees it
    mvPosition = viewMatrix * vec4(aPos, 1.0);
    vec3 dv = (viewMatrix * vec4(aDir, 0.0)).xyz; vec2 ax = dv.xy; float al = length(ax);
    ax = al > 1e-4 ? ax / al : vec2(0.0, 1.0);
    float fore = mix(0.6, 1.0, clamp(al / max(length(dv), 1e-4), 0.0, 1.0));
    mvPosition.xy += ax * position.y * aSize.x * fore + vec2(-ax.y, ax.x) * position.x * aSize.y;
  }
  gl_Position = projectionMatrix * mvPosition;`);
    };
    mat.customProgramCacheKey = () => 'degas-pastel';
    const im = this.marks = new THREE.InstancedMesh(geo, mat, NS);
    for (let i = 0; i < NS; i++) im.setColorAt(i, this.strokes[i].c);
    im.instanceColor.setUsage(THREE.DynamicDrawUsage); im.count = 0;
    L.add(im);
    this.poses = [0, 1, 2].map(() => newPose());
    { const l = new THREE.Vector3(L.nx, -0.4, L.nz).normalize(); this.lx = l.x; this.ly = l.y; this.lz = l.z; }      // (the footlights: from in front and below, as he painted them)

    // ---------------------------------------------------------- the flats and the footlights (one atlas, one draw)
    const grey = new THREE.Color('#9c9488'), flatC = ['#c98e5a', '#5f8d82', '#c4ab72', '#86a07c', '#d9b07e', '#4f7068', '#a77a58'].map(c => col(c, 0.3).lerp(grey, 0.15).getStyle());      // his scenery, in pastel: muted teal, ochre, orange
    const atlas = canvasTexture(512, 512, (g) => {
      // the flat's face: his scenery, foliage in scumbled dabs, its top cut to a ragged leafy edge (a, the alpha)
      const edge = x => 40 + 26 * Math.sin(x * 0.05) + 14 * Math.sin(x * 0.13 + 1) + 8 * Math.sin(x * 0.31);
      const face = (x0, flip) => {
        g.save(); g.beginPath(); g.moveTo(x0, 512);
        for (let x = 0; x <= 256; x += 4) g.lineTo(x0 + x, edge(flip ? 256 - x : x));
        g.lineTo(x0 + 256, 512); g.closePath(); g.clip();
        g.fillStyle = flip ? '#cbbf9e' : flatC[5]; g.fillRect(x0, 0, 256, 512);
        if (!flip) { g.lineCap = 'round'; for (let i = 0; i < 1300; i++) { const y = L.rand() * 512, low = y / 512, a = -0.9 + (L.rand() - 0.5) * 0.7 + (L.rand() < 0.3 ? 1.6 : 0); g.strokeStyle = flatC[L.rand() < 0.3 + 0.3 * (1 - low) ? (L.rand() < 0.6 ? 0 : 4) : [1, 3, 5, 6, 2][Math.floor(L.rand() * 5)]]; g.globalAlpha = 0.3 + L.rand() * 0.45; g.lineWidth = 5 + L.rand() * 11; const x = x0 + L.rand() * 256, l = 14 + L.rand() * 34; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } }
        else { g.fillStyle = '#7a5a3a'; g.globalAlpha = 1; for (const x of [10, 246]) g.fillRect(x0 + x - 10, 0, 20, 512); g.fillRect(x0, 480, 256, 22); g.fillRect(x0, 250, 256, 16); for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(90,70,50,0.08)'; g.fillRect(x0 + L.rand() * 256, L.rand() * 512, 2, 12); } }
        g.restore(); g.globalAlpha = 1;
      };
      face(0, false); face(256, true);
      g.fillStyle = '#2e2a26'; g.fillRect(256, 0, 0, 0);
    });
    // (the footlights' tin and flame share the corner of the atlas that is plain: they take a solid colour from it)
    const plate = (w, h, u0, u1) => { const pg = new THREE.PlaneGeometry(w, h).toNonIndexed(), uv = pg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + (u1 - u0) * uv.getX(i)); return pg; };
    const colorize = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), C = new THREE.Color(c); for (let i = 0; i < n; i++) { a[i * 3] = C.r; a[i * 3 + 1] = C.g; a[i * 3 + 2] = C.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
    const solid = (g, c) => { g = g.index ? g.toNonIndexed() : g; const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.75, 0.7); return colorize(g, c); };      // (a plain spot of the flat's back, tinted)
    const merge = list => { let n = 0; for (const g of list) n += g.attributes.position.count; const out = new THREE.BufferGeometry(); for (const [name, k] of [['position', 3], ['normal', 3], ['color', 3], ['uv', 2]]) { const a = new Float32Array(n * k); let o = 0; for (const g of list) { a.set(g.attributes[name].array, o); o += g.attributes[name].array.length; } out.setAttribute(name, new THREE.BufferAttribute(a, k)); } return out; };
    const flatGeo = () => {
      const front = colorize(plate(FLAT.w, FLAT.h, 0, 0.5), '#ffffff'); front.translate(0, FLAT.h / 2, 0.004);
      const back = colorize(plate(FLAT.w, FLAT.h, 0.5, 1), '#bdb3a0'); back.rotateY(Math.PI); back.translate(0, FLAT.h / 2, -0.004);
      const brace = solid(new THREE.BoxGeometry(0.012, 0.62, 0.012), '#7a5a3a'); brace.rotateX(0.62); brace.translate(0, 0.17, -0.17);
      const weight = solid(new THREE.BoxGeometry(0.05, 0.03, 0.08), '#5a4232'); weight.translate(0, -FLAT.lift + 0.015, -0.33);
      const feet = [-1, 1].map(s => { const f = solid(new THREE.BoxGeometry(0.014, FLAT.lift + 0.01, 0.014), '#7a5a3a'); f.translate(s * (FLAT.w / 2 - 0.02), -FLAT.lift / 2, -0.008); return f; });
      return merge([front, back, brace, weight, ...feet]);
    };
    const lampGeo = () => {
      const hood = solid(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 10, 1, true, -Math.PI / 2, Math.PI), '#2e2924'); hood.rotateZ(Math.PI / 2); hood.rotateY(Math.PI / 2); hood.translate(0, 0.035, 0);
      const inner = solid(new THREE.CylinderGeometry(0.043, 0.043, 0.048, 10, 1, true, -Math.PI / 2, Math.PI), '#d8b070'); inner.scale(-1, 1, 1); inner.rotateZ(Math.PI / 2); inner.rotateY(Math.PI / 2); inner.translate(0, 0.035, 0);
      const flame = solid(new THREE.SphereGeometry(0.012, 8, 6), new THREE.Color(3.2, 2.5, 1.3)); flame.scale(1, 1.5, 1); flame.translate(0, 0.03, -0.012);
      const base = solid(new THREE.BoxGeometry(0.06, 0.012, 0.05), '#3a332c'); base.translate(0, 0.006, 0);
      return merge([hood, inner, flame, base]);
    };
    const sm = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, alphaTest: 0.5, side: THREE.FrontSide, fog: false });
    const rig = this.rig = L.rig(2 + LAMPS, 4000, sm);
    const fg = rig.geo(flatGeo()), lg = rig.geo(lampGeo());
    this.flats = FLATS.map(f => ({ ...f, inst: rig.add(fg) }));
    this.lamps = Array.from({ length: LAMPS }, (_, i) => ({ inst: rig.add(lg), u: (i / (LAMPS - 1) - 0.5) * 1.5, out: LAMP_OUT + 0.04 * Math.cos((i / (LAMPS - 1) - 0.5) * Math.PI) }));
    // ---------------------------------------------------------- the light: a pool on the stage, and each footlight's own glow
    const pool = canvasTexture(256, 256, (g, w, h) => {
      const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.5, 'rgba(255,255,255,0.55)'); r.addColorStop(0.85, 'rgba(255,255,255,0.12)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'destination-out';           // scumbled: the light laid on in broken strokes
      for (let i = 0; i < 380; i++) { g.strokeStyle = `rgba(0,0,0,${0.08 + L.rand() * 0.22})`; g.lineWidth = 3 + L.rand() * 7; const x = L.rand() * w, y = L.rand() * h, a = L.rand() * 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 26, y + Math.sin(a) * 26); g.stroke(); }
    }, false);
    const warm = col('#f2d27a', 0.3), gas = col('#ffb862', 0.25);
    this.light = L.glows([
      { w: 2.2, d: 1.15, u: 0, out: 0.55, color: warm, strength: 0.75 },
      { w: 0.75, d: 0.6, u: 0, out: 0.66, color: warm, strength: 0.5 },
      ...this.lamps.map(l => ({ w: 0.34, d: 0.3, u: l.u, out: l.out - 0.13, color: gas, strength: 0.6 })),
    ]);
    this.light.material.map = pool;
    this.band = this.makeScore(L);
    this.hideAll();
  },

  makeScore(L) {
    const s = score(L);
    // the orchestra tuning: the oboe's A, the strings coming in under it on A and E
    s.note(0.05, 440, 1.7, { type: 'triangle', vol: 0.03, attack: 0.15 }); s.note(0.05, 441.2, 1.7, { type: 'sine', vol: 0.014, attack: 0.2 });
    s.note(0.55, 220, 1.3, { type: 'sawtooth', vol: 0.004, attack: 0.3 }); s.note(0.7, 329.6, 1.2, { type: 'sawtooth', vol: 0.003, attack: 0.3 }); s.note(0.8, 110, 1.1, { type: 'triangle', vol: 0.012, attack: 0.3 });
    // a harp sweeps up as the dancers come out
    [47, 54, 59, 62, 66, 71, 74, 78].forEach((m, i) => s.note(1.95 + i * 0.045, hz(m), 1.2, { type: 'sine', vol: 0.02, attack: 0.003, over: 2, overVol: 0.25 }));
    // the theme, on an oboe-ish reed (two voices a hair apart), over the harp and a soft string chord
    s.tune(SWAN, M0, BPM, { type: 'triangle', vol: 0.032, legato: 0.95 });
    s.tune(SWAN, M0, BPM, { type: 'sine', vol: 0.012, oct: 1, legato: 0.9 });
    HARP.forEach((ch, b) => { ch.forEach((m, k) => s.note(M0 + (b * 4 + k * 0.5) * BT, hz(m), 0.9, { type: 'sine', vol: 0.016, attack: 0.003, over: 2, overVol: 0.2 })); s.note(M0 + b * 4 * BT, hz(ch[0] - 12), 4 * BT, { type: 'sine', vol: 0.014, attack: 0.2 }); });
    // and then the harp alone, quietly, while you keep looking
    const idle = []; HARP.forEach((ch, b) => ch.forEach((m, k) => idle.push({ t: (b * 4 + k * 0.5) * BT * 1.25, f: hz(m), d: 1.1, type: 'sine', vol: 0.009, attack: 0.003, over: 2, overVol: 0.2 })));
    s.loop(M0 + 16 * BT, 16 * BT * 1.25, idle);
    return s.done();
  },

  hideAll() {
    this.marks.count = 0; this.marks.visible = false;
    for (const f of this.flats) this.rig.show(f.inst, false);
    for (const l of this.lamps) this.rig.show(l.inst, false);
    for (let i = 0; i < 2 + LAMPS; i++) this.light.set(i, 0);
  },
  start(L, resumed) {
    if (!resumed) this.hideAll();
    this.band.from(L.t); this.creaked = false;
    if (!this.told && !L.quiet) { this.told = true; L.k.say('The orchestra is tuning. Someone is waiting in the wings.', 4); }
  },
  back(L) {
    this.from = this.poses.map(p => ({ u: p.u, out: p.out, yaw: p.yaw + p.spin, vis: p.vis }));
    this.lightFrom = this.lightK || 0;
    if (!L.quiet) { const v = L.voice(); if (v.ctx) [78, 74, 71, 66, 62, 59, 54, 47].forEach((m, i) => v.note(hz(m), 1.0, { at: i * 0.05, vol: 0.016, type: 'sine', attack: 0.003 })); }
  },
  end() { this.hideAll(); },
  reset() { this.hideAll(); this.told = false; },

  update(L, dt) {
    const t = L.t, ph = L.phase, showing = ph === 'wake' || ph === 'play', R = L.ret, r = this.rig, B = this.B, M = this.tmpM;
    // ---- the stage: footlights, flats, light
    let lightK, flatK; const lampK = [];
    if (showing) {
      lightK = ease.smooth(ramp(t, 0.35, 1.6)); flatK = ease.outBack(ramp(t, 0.15, 1.15));
      for (let i = 0; i < LAMPS; i++) { const t0 = 0.05 + Math.abs(i - 3) * 0.1; lampK.push(ramp(t, t0, t0 + 0.4)); }
      if (!this.creaked && t > 0.2) { this.creaked = true; if (!L.quiet) { const v = L.voice(); noise(v, 0, { d: 0.9, vol: 0.012, bp: 500, q: 2 }); } }
    } else {
      lightK = this.lightFrom * (1 - ease.smooth(ramp(R, 0.4, 1))); flatK = 1 - ease.inOut(ramp(R, 0.6, 1));
      for (let i = 0; i < LAMPS; i++) lampK.push(1 - ease.inOut(ramp(R, 0.6 + Math.abs(i - 3) * 0.04, 0.98)));
    }
    this.lightK = lightK;
    const fl = (k) => 0.95 + 0.05 * Math.sin(t * 11 + k * 1.7) * Math.sin(t * 5.3 + k);
    this.light.set(0, lightK * fl(0)); this.light.set(1, lightK * (showing ? 0.4 + 0.6 * ramp(t, 4.6, 5.2) : 1) * fl(1));
    this.flats.forEach(f => {
      const on = flatK > 0.002; r.show(f.inst, on); if (!on) return;
      const p = L.floor(f.u, f.out, this.T);
      B.set(M, p.x, L.y + FLAT.lift - (FLAT.h + FLAT.lift + 0.05) * (1 - flatK), p.z, L.yawOut + f.yaw); r.mat(f.inst, M);
    });
    this.lamps.forEach((l, i) => {
      const k = lampK[i], on = k > 0.002; r.show(l.inst, on); this.light.set(2 + i, ramp(k, 0.6, 1) * fl(i + 2)); if (!on) return;
      const p = L.floor(l.u, l.out, this.T); B.set(M, p.x, L.y - 0.1 * (1 - ease.out(k)), p.z, L.yawOut + Math.PI + l.u * 0.25); r.mat(l.inst, M);
    });
    // ---- the dancers
    for (let w = 0; w < 3; w++) { const P = this.poses[w]; if (showing) this.dance(L, w, t, P); else this.home(L, w, R, P); }
    this.draw(L);
    if (showing) this.band.play(t);
    L.voice().place(L.cx + L.nx, L.cz + L.nz);
  },

  // ---------------------------------------------------------- the choreography, by show-time
  dance(L, w, t, P) {
    stand(P, L, HOME[w]);
    const [A, Bd] = [0, 1];
    // in the wings, feet showing under the flats: shifting, rising onto their points, waiting
    const waitU = WING[w], go = [2.2, 2.35, 3.0][w];
    if (t < go) {
      P.vis = t > 0.9; P.u = waitU.u; P.out = waitU.out; P.yaw = L.yawOut + (w === 1 ? -1.2 : 1.2);
      const q = Math.sin(t * 5 + w * 2); P.rise = Math.max(0, q) * 0.9; P.legs[0][2] = 0.25 * Math.max(0, -q); P.arms[0][1] = -0.3; P.arms[1][1] = 0.3;
      return;
    }
    if (w !== 2) {
      // two bourree out of the wings, arms opening
      const s = clamp01((t - go) / 1.25);
      if (s < 1) { const e = ease.inOut(s); P.u = lerp(waitU.u, HOME[w].u, e); P.out = lerp(waitU.out, HOME[w].out, e); P.yaw = turnTo(L.yawOf(HOME[w].u - waitU.u, HOME[w].out - waitU.out), L.yawOut, ramp(s, 0.6, 1)); bourree(P, t, ease.smooth(s * 2)); return; }
      const t2 = t - go - 1.25;
      if (t < 5.0) { bourree(P, t, 1 - ease.smooth(ramp(t2, 0, 0.4))); const d = hump(t, 3.9, 4.9); const leg = w; P.legs[leg][1] = (leg ? 1 : -1) * 1.35 * d; P.legs[leg][0] = -0.2 * d; P.arms[0][1] = -1.35; P.arms[1][1] = 1.35; return; }
      // a pirouette each, in canon, then an arabesque, turned towards her
      const p0 = w === A ? 5.4 : 6.15;
      if (t < p0 + 0.9) { const s2 = clamp01((t - p0) / 0.9); if (t < p0) { P.arms[0][1] = -1.3; P.arms[1][1] = 1.3; return; } pirouette(P, s2, w ? -1 : 1, 1); return; }
      const ar = ease.smooth(ramp(t, p0 + 0.9, p0 + 1.4)) * (1 - ease.smooth(ramp(t, 8.6, 9.1)));
      if (t < 8.9) { arabesque(P, ar, w ? 1 : 0); P.yaw = L.yawOut + (w ? 1 : -1) * 0.75 * ar; return; }
      curtsey(P, hump(t, 8.9, 10.1), w); if (t < 10.2) return;
    } else {
      // the soloist: a chain of turns across the light to the middle
      const s = clamp01((t - go) / 1.6);
      if (s < 1) {
        const e = ease.inOut(s), a = 1 - e, cu = -0.3, co = 0.45;
        P.u = a * a * waitU.u + 2 * a * e * cu + e * e * HOME[2].u; P.out = a * a * waitU.out + 2 * a * e * co + e * e * HOME[2].out;
        P.rise = 1; P.spin = 3 * Math.PI * 2 * e; P.arms[0][0] = P.arms[1][0] = -0.7; P.arms[0][1] = -0.4; P.arms[1][1] = 0.4; P.arms[0][2] = P.arms[1][2] = 1.0;
        const st = Math.sin(e * Math.PI * 6); P.legs[0][2] = 0.15 * Math.max(0, st); P.legs[1][2] = 0.15 * Math.max(0, -st); P.flare = 0.5 * Math.sin(Math.PI * s);
        return;
      }
      if (t < 5.0) { const k = ease.smooth(ramp(t, 4.6, 5.0)); plie(P, 0.55 * k); P.legs[1][0] = 0.25 * k; P.arms[0][0] = -1.1 * k; P.arms[0][1] = -0.3; P.arms[1][1] = 1.3 * k; P.arms[0][2] = 1.0 * k; P.lean = 0.05 * k; return; }
      // pirouettes, then fouettes, faster and faster
      if (t < 5.9) { pirouette(P, (t - 5.0) / 0.9, 1, 2); return; }
      if (t < 8.0) {
        const n = 8, s2 = (t - 5.9) / 2.1, q = s2 * n, f = q - Math.floor(q), k = Math.floor(q);
        const whip = f < 0.35 ? Math.sin(Math.PI * f / 0.35) : 0, turning = f >= 0.35 ? ease.inOut((f - 0.35) / 0.65) : 0;
        P.spin = (k + turning) * Math.PI * 2; P.rise = f < 0.3 ? 0.2 : 1; plie(P, f < 0.3 ? 0.35 * Math.sin(Math.PI * f / 0.3) : 0);
        retire(P, 1 - whip); P.legs[1][1] = lerp(P.legs[1][1], 1.45, whip); P.legs[1][2] = lerp(P.legs[1][2], 0, whip); P.legs[1][0] = lerp(P.legs[1][0], -0.1, whip);
        P.arms[0][1] = lerp(-0.5, -1.35, whip); P.arms[1][1] = lerp(0.5, 1.35, whip); P.arms[0][0] = P.arms[1][0] = lerp(-0.75, -0.2, whip); P.arms[0][2] = P.arms[1][2] = lerp(1.1, 0.25, whip);
        P.flare = 0.4 + 0.6 * (f >= 0.35 ? 1 : 0.4);
        return;
      }
      if (t < 8.9) { const k = ease.outBack(ramp(t, 8.0, 8.35)); P.rise = 1; P.legs[1][0] = 1.1 * k; P.legs[1][2] = 0.6 * k; P.legs[1][3] = 1; P.lean = -0.08 * k; P.arms[0][1] = -2.6 * k; P.arms[1][1] = 2.6 * k; P.arms[0][2] = P.arms[1][2] = 0.6 * k; P.tilt = 0.03 * Math.sin(t * 6) * k; P.flare = 0.3 * (1 - ramp(t, 8.0, 8.5)); return; }
      curtsey(P, hump(t, 8.9, 10.1), 2); if (t < 10.2) return;
    }
    // ---- waiting, as in the picture
    const it = t - 10.2;
    if (w === A) { const k = ease.smooth(ramp(it, 0, 1)); P.arms[0][1] = -2.2 * k; P.arms[1][1] = 2.2 * k; P.arms[0][0] = P.arms[1][0] = -0.9 * k; P.arms[0][2] = P.arms[1][2] = 1.9 * k; P.head = 0.35 * k; P.yaw = L.yawOut - 0.5 * k; P.lean = 0.1 * k; P.arms[1][2] += 0.15 * Math.sin(t * 3) * k; }
    else if (w === Bd) { const k = ease.smooth(ramp(it, 0.5, 1.5)); P.arms[1][0] = -1.4 * k; P.arms[1][1] = -0.4 * k + 0.3 * (1 - k); P.arms[1][2] = 2.1 * k; P.head = 0.4 * k; P.tilt = 0.12 * k; P.yaw = L.yawOut + 0.55 * k; P.arms[1][2] += 0.12 * Math.sin(t * 4) * k; }
    else {
      const q = (it % 6) / 6, pir = q > 0.6 && q < 0.85 ? (q - 0.6) / 0.25 : -1;
      P.arms[0][1] = -0.35 - 0.9 * hump(q, 0, 0.6); P.arms[1][1] = 0.35 + 0.9 * hump(q, 0, 0.6); P.arms[0][0] = P.arms[1][0] = -0.3 - 0.4 * hump(q, 0, 0.6);
      if (pir >= 0) pirouette(P, pir, 1, 1);
    }
    P.rise = P.rise || 0; P.dy += 0.002 * Math.sin(t * 1.4 + w);
  },
  home(L, w, R, P) {
    const f = this.from && this.from[w]; stand(P, L, f || HOME[w]);
    if (!f || !f.vis) { P.vis = false; return; }
    const wing = WING[w], s = ease.inOut(clamp01((R - 0.05 * w) / 0.65));
    P.u = lerp(f.u, wing.u, s); P.out = lerp(f.out, wing.out, s);
    P.yaw = turnTo(f.yaw, L.yawOf(wing.u - f.u, wing.out - f.out), ramp(s, 0, 0.2));
    bourree(P, R * 2.2, 1);
    P.vis = R < 0.97;
  },

  // ---------------------------------------------------------- bones, then the strokes on them
  draw(L) {
    const B = this.B, S = this.strokes, aP = this.aPos.array, aD = this.aDir.array, V = this.V, N = this.N, col = this.marks.instanceColor, C = this._c || (this._c = new THREE.Color());
    let any = false;
    for (let w = 0; w < 3; w++) {
      const P = this.poses[w], Mx = this.mats[w]; if (!P.vis) continue; any = true;
      const p = L.floor(P.u, P.out, this.T);
      // the legs first, at the pelvis's own height, to find how high it must stand for the feet to reach the floor
      B.set(this.R, 0, 0, 0, 0, 0, 0);
      const legs = (root) => {
        for (const [s, th, sh, ft] of [[0, THR, SHR, FTR], [1, THL, SHL, FTL]]) {
          const g = P.legs[s], sx = s ? 0.018 : -0.018;
          B.child(Mx[th], root, sx, 0, 0, (s ? 1 : -1) * 0.35, g[0], g[1]);
          B.child(Mx[sh], Mx[th], 0, -THIGH, 0, 0, g[2], 0);
          B.child(Mx[ft], Mx[sh], 0, -SHIN, 0, 0, -Math.PI / 2 * (1 - Math.max(P.rise, g[3])), 0);
        }
      };
      legs(this.R);
      let low = Infinity;
      for (const ft of [FTR, FTL]) { V.set(0, -FOOT, 0).applyMatrix4(Mx[ft]); low = Math.min(low, V.y); }
      B.set(Mx[PEL], p.x, L.y + 0.003 + (P.dy - low) * SC, p.z, P.yaw + P.spin, 0, 0, SC);
      legs(Mx[PEL]);
      B.child(Mx[TOR], Mx[PEL], 0, 0.02, 0, P.twist, P.lean, P.tilt);
      B.child(Mx[HEAD], Mx[TOR], 0, TORSO + 0.042, 0.004, 0, P.head, 0);
      for (const [s, ua, fa] of [[0, UAR, FAR], [1, UAL, FAL]]) { const a = P.arms[s]; B.child(Mx[ua], Mx[TOR], s ? 0.03 : -0.03, TORSO - 0.012, 0, 0, a[0], a[1]); B.child(Mx[fa], Mx[ua], 0, -UARM, 0, 0, -a[2], 0); }
    }
    let n = 0;
    for (let i = 0; i < S.length; i++) {
      const s = S[i], P = this.poses[s.who]; if (!P.vis) continue;
      const Mx = this.mats[s.who][s.bone];
      if (s.petal) {
        // out from the waist ring and down, tipping up towards flat as she spins (and a breath of lift in it)
        const pt = s.petal, t = pt.tilt * (1 - 0.62 * P.flare) - 0.04 * Math.sin(L.t * 3 + pt.a * 2), ca = Math.cos(pt.a), sa = Math.sin(pt.a), ct = Math.cos(t), st = Math.sin(t);
        V.set(sa * (pt.r0 + ct * s.len * 0.5), 0.02 - st * s.len * 0.5, ca * (pt.r0 + ct * s.len * 0.5)).applyMatrix4(Mx);
        N.set(sa * ct, -st, ca * ct).transformDirection(Mx);
        const S2 = this.S2 || (this.S2 = new THREE.Vector3()); S2.set(ca, 0, -sa).transformDirection(Mx);
        aP[n * 3] = V.x; aP[n * 3 + 1] = V.y; aP[n * 3 + 2] = V.z; aD[n * 3] = N.x; aD[n * 3 + 1] = N.y; aD[n * 3 + 2] = N.z;
        this.aSide.setXYZ(n, S2.x, S2.y, S2.z); this.aKind.setX(n, 1);
        N.set(sa * st, ct, ca * st).transformDirection(Mx);
        const k = 0.66 + 0.36 * Math.max(0, N.x * this.lx + N.y * this.ly + N.z * this.lz) + 0.14 * Math.max(0, N.y);
        col.setXYZ(n, s.c.r * k, s.c.g * k, s.c.b * k);
        this.marks.geometry.attributes.aSize.setXY(n, s.len * SC, s.wid * SC);
        n++; continue;
      }
      this.aSide.setXYZ(n, 0, 0, 0); this.aKind.setX(n, 0);
      V.copy(s.p); N.copy(s.d);
      if (s.tutu) {                                 // the skirt flares out as she spins
        const f = P.flare * s.tutu, rr = Math.hypot(V.x, V.z) || 1;
        V.x += (V.x / rr) * f * 0.055; V.z += (V.z / rr) * f * 0.055; V.y += f * 0.055 * s.tutu; N.y += f * 1.2;
      }
      V.applyMatrix4(Mx); N.transformDirection(Mx);
      aP[n * 3] = V.x; aP[n * 3 + 1] = V.y; aP[n * 3 + 2] = V.z; aD[n * 3] = N.x; aD[n * 3 + 1] = N.y; aD[n * 3 + 2] = N.z;
      // lit from the footlights in front and below, and a little from above: the shade rides on the stroke's colour
      N.copy(s.n).transformDirection(Mx);
      const k = 0.62 + 0.42 * Math.max(0, N.x * this.lx + N.y * this.ly + N.z * this.lz) + 0.12 * Math.max(0, N.y);
      col.setXYZ(n, s.c.r * k, s.c.g * k, s.c.b * k);
      this.marks.geometry.attributes.aSize.setXY(n, s.len * SC, s.wid * SC);
      n++;
    }
    this.marks.count = n; this.marks.visible = any && n > 0;
    if (n) { this.aPos.needsUpdate = true; this.aDir.needsUpdate = true; this.aSide.needsUpdate = true; this.aKind.needsUpdate = true; col.needsUpdate = true; this.marks.geometry.attributes.aSize.needsUpdate = true; }
  },
});

// ------------------------------------------------------------------ poses
// arms: [pitch (forward, negative), roll (out to the side), elbow]; legs: [pitch (forward, negative), roll (out), knee, point]
function newPose() { return { u: 0, out: 0, yaw: 0, spin: 0, dy: 0, lean: 0, tilt: 0, twist: 0, head: 0, rise: 0, flare: 0, support: 2, vis: true, legs: [[0, 0, 0, 0], [0, 0, 0, 0]], arms: [[0, 0, 0], [0, 0, 0]] }; }
function stand(P, L, at) {
  P.u = at.u; P.out = at.out; P.yaw = L.yawOut; P.spin = 0; P.dy = 0; P.lean = 0; P.tilt = 0; P.twist = 0; P.head = 0; P.rise = 0; P.flare = 0; P.support = 2; P.vis = true;
  P.legs[0][0] = 0; P.legs[0][1] = -0.06; P.legs[0][2] = 0; P.legs[0][3] = 0; P.legs[1][0] = 0; P.legs[1][1] = 0.06; P.legs[1][2] = 0; P.legs[1][3] = 0;
  P.arms[0][0] = -0.25; P.arms[0][1] = -0.3; P.arms[0][2] = 0.5; P.arms[1][0] = -0.25; P.arms[1][1] = 0.3; P.arms[1][2] = 0.5;            // bras bas
}
function plie(P, k) { for (const g of P.legs) { g[0] -= k * 0.5; g[2] += k; } }
// Tiny quick steps on the points, the feet close together; arms opening to second.
function bourree(P, t, k) {
  P.rise = 1; const q = Math.sin(t * 2 * Math.PI * 6);
  P.legs[0][2] = 0.18 * Math.max(0, q) * k + 0.05; P.legs[1][2] = 0.18 * Math.max(0, -q) * k + 0.05; P.legs[0][1] = -0.02; P.legs[1][1] = 0.02;
  P.arms[0][1] = -1.25 * k - 0.3 * (1 - k); P.arms[1][1] = 1.25 * k + 0.3 * (1 - k); P.arms[0][0] = P.arms[1][0] = -0.25; P.arms[0][2] = P.arms[1][2] = 0.35;
}
// The working leg drawn up, its toe at the other knee, turned out.
function retire(P, k) { const g = P.legs[1]; g[0] = -0.55 * k; g[1] = 1.15 * k; g[2] = 2.1 * k; g[3] = 1; P.support = 0; }
// A pirouette (s 0..1, `turns` of them): up on the point from a plie, the leg in retire, arms rounded in front, spinning.
function pirouette(P, s, dir, turns) {
  const up = ease.smooth(ramp(s, 0, 0.12)) * (1 - ease.smooth(ramp(s, 0.9, 1)));
  P.rise = up; retire(P, up); plie(P, 0.4 * (1 - up));
  P.spin = dir * turns * Math.PI * 2 * ease.inOut(ramp(s, 0.08, 0.92));
  P.arms[0][0] = P.arms[1][0] = -0.75 * up - 0.25; P.arms[0][1] = -0.45; P.arms[1][1] = 0.45; P.arms[0][2] = P.arms[1][2] = 1.15 * up + 0.4;
  P.flare = 0.7 * Math.sin(Math.PI * s);
}
function arabesque(P, k, back) {
  const g = P.legs[back]; g[0] = 1.25 * k; g[2] = 0.05; g[3] = 1; P.support = 1 - back; P.rise = k;
  P.lean = 0.28 * k; P.arms[back ? 0 : 1][0] = -1.9 * k; P.arms[back ? 0 : 1][1] = (back ? -0.2 : 0.2) * k; P.arms[back][1] = (back ? 1.4 : -1.4) * k; P.arms[back][0] = -0.2;
  P.arms[0][2] = P.arms[1][2] = 0.25; P.head = -0.15 * k;
}
// The reverence: one foot behind, a deep bend, the arms opening and coming down, the head bowed.
function curtsey(P, c, w) {
  const b = w % 2; P.legs[b][0] = 0.35 * c; P.legs[b][2] = 0.9 * c; P.legs[1 - b][0] = -0.4 * c; P.legs[1 - b][2] = 0.75 * c;
  P.lean = 0.3 * c; P.head = 0.45 * c; P.arms[0][1] = -0.3 - 0.9 * c; P.arms[1][1] = 0.3 + 0.9 * c; P.arms[0][0] = P.arms[1][0] = -0.25 - 0.2 * c;
}
