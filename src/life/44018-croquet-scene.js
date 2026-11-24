// Winslow Homer, Croquet Scene (1866), Gallery 273. The word: mallet.
//
// Look at it and a roll of his summer lawn comes out from under the picture and unrolls across the floor, olive and
// sunlit, laid in his short level strokes; tufts of grass spring up along its edges. Three white hoops pop up out of
// it, and the striped stake. The balls drop out from under the bottom rail one after another (the orange and the yellow
// lying in his grass, a striped one, and a blue one for the lady in blue), bounce on the turf, tock, and roll to their
// places. Then the players walk out from under the frame, little people of the painting's own: the lady in blue with
// her mallet, the lady in red over her white petticoats, the lady in brown, and the man in the straw boater, who goes
// down on one knee to sight the line, as he does in the picture. A soft plucked tune tiptoes along (the theme of the
// Andante of Haydn's "Surprise" Symphony, 1791) while she addresses the ball: two waggles, a glance at the hoop, the
// backswing, a held breath... and on Haydn's surprise chord, TOCK. The ball runs through the first hoop (a bell), the
// second (a higher bell) and clacks into the stake. The man jumps up and waves his boater, the ladies clap, the lady in
// blue curtseys. While you keep looking they idle on the lawn and she takes practice swings.
//
// And the toy can play. Stop looking and they stay while the toy is near: the players step to the edges of the lawn
// and watch, and the balls are free. Drive into one to knock it; put one through a hoop and the bell rings and the
// little crowd turns and claps (the first time is a secret). Drive over a hoop and it springs back, boing. Drive off,
// or wait a minute, and it all goes home: the players walk back in under the frame, the balls bounce back up into it,
// the hoops sink and the lawn rolls itself up and slides back under the picture.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, shape, canvasTexture } from '../paintlife.js';

const S = 1.18;                         // the players: the ladies 0.52 m tall, the man 0.54 in his boater
const R = 0.042;                        // a ball (larger than to scale, so it reads across the room)
const HALF = 1.38, LEN = 1.85;          // the lawn: either side of the middle, and out from the wall (m)
const NA = 14, NL = 44, TUFTS = 96;
const HW = 0.095, HH = 0.2, WIRE = 0.0065;   // a hoop: half its inner width, its height, its wire
// The line of play runs from the front left to the back right (on the slant, so the hoops show their arches to you).
const DU = 0.77, DO = -0.64;            // its way, along and out
const TEE = [-0.74, 1.3];              // where the blue ball is played from (along, out)
const along = d => [TEE[0] + DU * d, TEE[1] + DO * d];
const HOOPS = [[...along(0.45), DU, DO], [...along(0.9), DU, DO], [-0.98, 0.45, 0, 1]];      // along, out, and which way a ball goes through
const STAKE = along(1.4), RUN = 1.4 - R - 0.013;
const BALLS = [                         // colour, stripe, where it comes to rest, when it drops
  { c: '#3d6a9e', s: '#e8e2d0', rest: TEE, te: 1.5, u0: -0.12 },
  { c: '#cf6a2c', s: '#f0d8a8', rest: [-1.14, 0.82], te: 1.75, u0: 0.1 },
  { c: '#d8b44c', s: '#7a5a2a', rest: [1.12, 0.7], te: 2.0, u0: 0.18 },
  { c: '#e9e3d2', s: '#b8392e', rest: [0.18, 1.32], te: 2.25, u0: -0.2 },
];
const T_HIT = 5.42, V0 = 1.72, DEC = 1.05;      // the stroke, and how the ball runs from it
// The theme of the Andante of Haydn's Symphony No. 94, "Surprise" (1791), plucked, very soft, and the chord that
// made the audience jump, on the stroke. Then the next phrase, for the stake.
const BPM = 116, BEAT = 60 / BPM;
const THEME = 'G4:.5 G4:.5 B4:.5 B4:.5 | D5:.5 D5:.5 B4 | C5:.5 C5:.5 A4:.5 A4:.5 | F#4:.5 F#4:.5';
const THEME_BASS = 'G3:2 | G3:2 | D3:2 | D3';
const THEME2 = 'G4:.5 G4:.5 B4:.5 B4:.5 | D5:.5 D5:.5 G5:2';
const T_TUNE = T_HIT - 7 * BEAT;

// The players' moves: keyframes [time, along, out] (they glide or walk between them, easing in and out).
// (Only the first and last times count: they go along the whole route at an easy pace, round the hoops.)
const MOVES = {
  blue: [[2.1, -0.28, -0.32], [0, -0.55, 0.5], [0, -0.95, 1.05], [3.75, null, null]],     // (the last: her place by the tee, worked out)
  red: [[1.95, 0.22, -0.32], [0, 0.75, 0.25], [0, 0.95, 0.85], [3.1, 0.7, 1.28]],
  brown: [[2.55, -0.2, -0.32], [3.5, -0.48, 0.3]],
  man: [[2.4, 0.3, -0.32], [0, 0.6, -0.05], [3.55, 0.68, 0.16]],
};
// Where they stand to watch the toy play (along, out).
const WATCH = { blue: [-1.24, 1.25], red: [1.2, 1.25], brown: [-0.42, 0.24], man: [1.2, 0.4] };

lifeFor(44018, {
  title: /^Croquet Scene/,
  word: 'mallet',
  stage: { out: 1.75, half: 1.45, cam: { dist: 2.8, height: 0.75, side: 0.3, fov: 62, lookU: 0.0, lookOut: 0.8, lookH: 0.62, floorOut: 1.45 } },
  wake: 2, ret: 2.4,
  linger: { near: 5, max: 60 },
  secrets: [['croquet', 'Through Homer\'s hoop']],

  build(L) {
    const P = L.pal, col = (h, a = 0.25) => P.near(h, a);
    this.v = new THREE.Vector3(); this.w = new THREE.Vector3(); this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.qq = new THREE.Quaternion(); this.one = new THREE.Vector3(1, 1, 1); this.sc = new THREE.Vector3(); this.ax = new THREE.Vector3(); this.eu = new THREE.Euler(0, 0, 0, 'YXZ');

    // ---------------------------------------------------------- the lawn: a strip of his turf, unrolled out of the wall
    const greens = ['#5b6a30', '#4e5d29', '#66763a', '#73803f', '#43522a', '#808a45', '#596327', '#8c8b4a'].map(c => col(c, 0.3).getStyle());
    const lawnTex = canvasTexture(512, 512, (g, w, h) => {
      g.fillStyle = col('#56652d', 0.3).getStyle(); g.fillRect(0, 0, w, h);
      // his lawn: short level strokes, darker and cooler in the far shade, with the sun on it in front
      for (let i = 0; i < 2600; i++) {
        const x = L.rand() * w, y = L.rand() * h, len = 5 + L.rand() * 16, th = 1.5 + L.rand() * 2.5, a = (L.rand() - 0.5) * 0.35;
        g.strokeStyle = greens[Math.floor(L.rand() * greens.length)]; g.globalAlpha = 0.35 + L.rand() * 0.5; g.lineWidth = th; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + len * 0.5, y + Math.sin(a) * len * 0.5 - 1.2, x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
      }
      g.globalAlpha = 0.5; g.fillStyle = col('#a39a52', 0.3).getStyle();
      for (let i = 0; i < 260; i++) { const x = L.rand() * w, y = L.rand() * h; g.fillRect(x, y, 2 + L.rand() * 4, 1.5); }            // flecks of sun
      g.fillStyle = col('#3a4424', 0.3).getStyle(); g.globalAlpha = 0.25;
      for (let i = 0; i < 9; i++) { const x = L.rand() * w, y = L.rand() * h * 0.5; g.beginPath(); g.ellipse(x, y, 40 + L.rand() * 60, 10 + L.rand() * 14, 0, 0, Math.PI * 2); g.fill(); }
      // a ragged edge on three sides, as a painted lawn ends (the wall end, at the top, is straight: it runs under the wall)
      g.globalAlpha = 1; g.globalCompositeOperation = 'destination-in'; g.beginPath(); g.moveTo(0, 0);
      const jag = () => 6 + L.rand() * 16;
      for (let y = 0; y <= h; y += 10) g.lineTo(jag() * (0.4 + 0.6 * y / h), y);
      for (let x = 0; x <= w; x += 10) g.lineTo(x, h - jag());
      for (let y = h; y >= 0; y -= 10) g.lineTo(w - jag() * (0.4 + 0.6 * y / h), y);
      g.lineTo(w, 0); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over';
    });
    lawnTex.anisotropy = 4;
    const nTri = NA * NL * 2, pos = new Float32Array(nTri * 9), uv = new Float32Array(nTri * 6);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nTri * 9).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
    { let f = 0; const put = (i, j) => { uv[f++] = i / NA; uv[f++] = 1 - j / NL; }; for (let i = 0; i < NA; i++) for (let j = 0; j < NL; j++) { put(i, j); put(i + 1, j); put(i + 1, j + 1); put(i, j); put(i + 1, j + 1); put(i, j + 1); } }
    const lawnMat = new THREE.MeshStandardMaterial({ map: lawnTex, emissive: 0xffffff, emissiveMap: lawnTex, emissiveIntensity: 0.5, roughness: 0.95, alphaTest: 0.5, side: THREE.DoubleSide });
    this.sun = { uSunC: { value: L.floor(-0.1, 1.0) }, uSunAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) } };
    lawnMat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, this.sun);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uSunC; uniform vec4 uSunAx;')
        .replace('#include <dithering_fragment>', `#include <dithering_fragment>
  { vec2 d = lifeP.xz - uSunC.xz; float su = dot(d, uSunAx.xy) / 1.5, so = dot(d, uSunAx.zw) / 0.95;
    gl_FragColor.rgb *= 0.86 + 0.42 * exp(-(su * su + so * so));          // the summer sun on the middle of it
    if (!gl_FrontFacing) gl_FragColor.rgb *= vec3(0.62, 0.5, 0.34); }`);       // (the turf's underside, earthy, on the roll)
    };
    lawnMat.customProgramCacheKey = () => 'croquet-lawn';
    this.lawn = L.add(new THREE.Mesh(geo, lawnMat));
    this.lawnV = new Float32Array((NA + 1) * (NL + 1) * 3);
    this.S = -1; this.lay(L, 0);

    // ---------------------------------------------------------- everything else: one rig
    const rig = this.rig = L.rig(140, 26000, L.paint({ glow: 0.42, rough: 0.6 }));
    const limb = (a, b, r0, r1, c, seg = 7) => { const ax = new THREE.Vector3(...a), bx = new THREE.Vector3(...b), len = ax.distanceTo(bx), g = shape.cyl(r0, r1, len, seg, c); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), bx.clone().sub(ax).normalize())); const mm = ax.clone().add(bx).multiplyScalar(0.5); g.translate(mm.x, mm.y, mm.z); return g; };
    const puff = (a, b, r, c) => { const ax = new THREE.Vector3(...a), bx = new THREE.Vector3(...b), len = ax.distanceTo(bx), g = shape.ball(1, c, 1); shape.move(g, 0, 0, 0, 0, 0, 0, r, len / 2, r); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), bx.clone().sub(ax).normalize())); const mm = ax.clone().add(bx).multiplyScalar(0.5); g.translate(mm.x, mm.y, mm.z); return g; };
    const big = g => shape.move(g, 0, 0, 0, 0, 0, 0, S);
    const skin = col('#d9b08c'), white = col('#ece7da', 0.2), shade = col('#c9c3b4', 0.2);
    const blue = col('#3c74a0', 0.2), blueD = col('#2c5878', 0.2), red = col('#c43a2a', 0.2), redD = col('#982a20', 0.2), brownC = col('#6e4a30'), brownD = col('#2e2722'), auburn = col('#7a3a22'), dark = col('#2d2a28'), grey = col('#6e685c'), straw = col('#dcc48c', 0.2), band = col('#33261c'), hatBlue = col('#4b6f96', 0.2);
    // A crinoline: the great bell of the skirt, a trimmed hem, the bodice, the head; hair or a hat.
    const lady = ({ skirt, skirtD, hem, bodice, blouse, hair, hat, over }) => {
      const sk = shape.lathe([[0, 0.004], [0.132, 0.004], [0.136, 0.018], [0.1355, 0.026], [0.1345, 0.034], [0.131, 0.05], [0.117, 0.1], [0.094, 0.15], [0.07, 0.2], [0.047, 0.245], [0.035, 0.272], [0, 0.272]], 16, skirt);
      // (Homer's folds: darker panels down the bell, and the trimmed hem)
      const panel = c => ((Math.floor((Math.atan2(c.x, c.z) + Math.PI) / (Math.PI * 2) * 16) % 16) % 3 === 0);
      shape.paint(sk, c => (c.y < 0.026 ? hem[0] : c.y < 0.034 ? hem[1] : panel(c) && c.y > 0.04 && c.y < 0.26 ? skirtD : null));
      const bo = shape.lathe([[0, 0.27], [0.036, 0.27], [0.0345, 0.283], [0.033, 0.29], [0.04, 0.325], [0.043, 0.345], [0.03, 0.362], [0, 0.366]], 12, bodice);
      shape.move(bo, 0, 0, 0, 0, 0, 0, 1, 1, 0.76);
      shape.paint(bo, (c, n) => (c.y < 0.283 ? band : blouse && n.z > 0.45 && Math.abs(c.x) < 0.016 ? blouse : null));
      const parts = [sk, bo, shape.move(shape.cyl(0.011, 0.012, 0.022, 6, skin), 0, 0.366, 0)];
      const h = shape.move(shape.ball(0.027, skin, 1), 0, 0.396, 0.003);
      shape.paint(h, (c, n) => (n.z < 0.25 || c.y > 0.411 ? hair : null)); parts.push(h);
      if (!hat) parts.push(shape.move(shape.ball(0.017, hair, 1), 0, 0.402, -0.026));          // a bun
      else { const crown = shape.cyl(0.026, 0.024, 0.016, 12, hat[0]), brim = shape.cyl(0.044, 0.044, 0.004, 14, hat[0]); shape.paint(crown, (c, n, f) => (Math.floor(f / 2) % 2 ? hat[1] : null)); parts.push(shape.move(crown, 0, 0.428, -0.002, -0.2), shape.move(brim, 0, 0.42, 0.004, -0.2), shape.move(shape.box(0.012, 0.03, 0.004, hat[1]), 0.0, 0.405, -0.035)); }
      return shape.merge(parts);
    };
    // An arm for clapping, from the shoulder (0,0,0) down: a puffed sleeve, the forearm, the hand.
    const ladyArm = (sleeve, cuff) => shape.merge([puff([0, 0.004, 0], [0, -0.07, 0.006], 0.019, sleeve), limb([0, -0.065, 0.006], [0, -0.12, 0.012], 0.011, 0.009, cuff), shape.move(shape.ball(0.0105, skin, 1), 0, -0.13, 0.013)]);
    const G = this.G = {};
    G.blue = rig.geo(big(lady({ skirt: blue, skirtD: blueD, hem: [white, redD], bodice: blue, blouse: white, hair: auburn })));
    G.red = rig.geo(big(lady({ skirt: white, skirtD: shade, hem: [white, shade], bodice: white, hair: auburn, hat: [straw, hatBlue] })));
    G.brown = rig.geo(big(lady({ skirt: brownD, skirtD: dark, hem: [brownD, white], bodice: brownC, hair: brownD, hat: [white, hatBlue] })));
    G.armW = rig.geo(big(ladyArm(white, white))); G.armB = rig.geo(big(ladyArm(brownC, brownC)));
    // The red lady's overskirt: a shorter bell of red over the white, scalloped.
    { const os = shape.lathe([[0.127, 0.1], [0.119, 0.12], [0.1, 0.16], [0.078, 0.2], [0.052, 0.245], [0.037, 0.272], [0, 0.274]], 16, red); shape.paint(os, c => ((Math.floor((Math.atan2(c.x, c.z) + Math.PI) / (Math.PI * 2) * 16) % 16) % 3 === 1 ? redD : null)); shape.move(os, 0, 0, 0, 0, 0, 0, 1.012); G.over = rig.geo(big(os)); }
    // Her arms and her mallet, one piece, swinging from between the shoulders: the arms down to the grip, the shaft,
    // the head held level, across the way she will hit.
    const pivotY = 0.345, headY = (0.345 * S - R) / S, LH = 0.07;
    this.swing = { pivotY: pivotY * S, z: 0.072 * S, lh: LH * S };
    {
      const grip = [0, -0.13, 0.072], wood = col('#9a6a3a', 0.2), woodD = col('#6a4424', 0.2);
      const parts = [puff([-0.04, 0, 0], [-0.03, -0.07, 0.03], 0.019, white), puff([0.04, 0, 0], [0.03, -0.07, 0.03], 0.019, white),
        limb([-0.03, -0.07, 0.03], [-0.006, grip[1] + 0.01, grip[2]], 0.01, 0.009, white), limb([0.03, -0.07, 0.03], [0.006, grip[1] - 0.008, grip[2]], 0.01, 0.009, white),
        shape.move(shape.ball(0.011, skin, 1), 0, grip[1] + 0.012, grip[2]), shape.move(shape.ball(0.011, skin, 1), 0, grip[1] - 0.012, grip[2]),
        limb([0, grip[1] + 0.03, grip[2]], [0, -headY + 0.018, grip[2]], 0.0042, 0.0042, wood, 6)];
      const head = shape.move(shape.cyl(0.018, 0.018, LH, 10, wood), 0, -headY, grip[2], 0, 0, Math.PI / 2);
      shape.paint(head, (c) => (Math.abs(Math.abs(c.x) - 0.024) < 0.005 ? blueD : Math.abs(c.x) > 0.033 ? woodD : null));          // the blue rings of her set
      parts.push(head); G.mallet = rig.geo(big(shape.merge(parts)));
    }
    // The man: his body from the hips up (jacket, waistcoat, head, beard), each leg in two, his right arm, his boater.
    {
      const jacket = shape.lathe([[0, 0], [0.05, 0], [0.052, 0.04], [0.047, 0.09], [0.052, 0.14], [0.044, 0.165], [0.022, 0.178], [0, 0.18]], 12, dark);
      shape.move(jacket, 0, 0, 0, 0, 0, 0, 1, 1, 0.72);
      shape.paint(jacket, (c, n) => (n.z > 0.5 && Math.abs(c.x) < 0.014 && c.y > 0.09 ? (c.y > 0.15 ? white : grey) : null));
      const h = shape.move(shape.ball(0.028, skin, 1), 0, 0.208, 0.003);
      shape.paint(h, (c, n) => (n.z < 0 && c.y > 0.2 ? band : n.z > 0.2 && c.y < 0.2 ? col('#4a3424') : null));
      const armL = shape.merge([limb([-0.05, 0.16, 0], [-0.058, 0.09, 0.03], 0.013, 0.012, dark), limb([-0.058, 0.09, 0.03], [-0.04, 0.035, 0.07], 0.012, 0.011, dark), shape.move(shape.ball(0.011, skin, 1), -0.038, 0.028, 0.075)]);
      G.torso = rig.geo(big(shape.merge([jacket, shape.move(shape.cyl(0.012, 0.012, 0.03, 6, skin), 0, 0.185, 0), h, armL])));
      G.armR = rig.geo(big(shape.merge([limb([0, 0, 0], [0, -0.075, 0.01], 0.013, 0.012, dark), limb([0, -0.075, 0.01], [0, -0.13, 0.02], 0.012, 0.011, dark), shape.move(shape.ball(0.011, skin, 1), 0, -0.14, 0.022)])));
      G.thigh = rig.geo(big(limb([0, 0, 0], [0, -0.102, 0], 0.017, 0.014, grey)));
      G.shin = rig.geo(big(shape.merge([limb([0, 0, 0], [0, -0.092, 0], 0.014, 0.012, grey), shape.move(shape.box(0.024, 0.014, 0.046, dark), 0, -0.096, 0.01)])));
      const crown = shape.cyl(0.031, 0.03, 0.022, 14, straw); shape.paint(crown, c => (c.y < -0.003 ? band : null));
      G.hat = rig.geo(big(shape.merge([shape.move(crown, 0, 0.011, 0), shape.move(shape.cyl(0.054, 0.054, 0.004, 16, straw), 0, 0.002, 0)])));
    }
    this.hip = 0.205 * S;
    // Hoops, the stake, the balls, tufts of grass.
    {
      const pts = [new THREE.Vector3(-HW - WIRE, 0, 0)]; pts.push(new THREE.Vector3(-HW - WIRE, HH - HW, 0));
      for (let i = 1; i < 12; i++) { const a = Math.PI - (i / 12) * Math.PI; pts.push(new THREE.Vector3(Math.cos(a) * (HW + WIRE), HH - HW + Math.sin(a) * (HW + WIRE), 0)); }
      pts.push(new THREE.Vector3(HW + WIRE, HH - HW, 0), new THREE.Vector3(HW + WIRE, 0, 0));
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05), 40, WIRE, 5, false);
      G.hoop = rig.geo(shape.merge([(() => { const g = tube.toNonIndexed(); g.deleteAttribute('uv'); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3)); shape.paint(g, () => col('#ebe7da', 0.15)); return g; })()]));
      const stripes = ['#3d6a9e', '#c4402c', '#2a2622', '#d8b44c', '#3a7a4a'].map(c => col(c, 0.2));
      const stake = shape.cyl(0.013, 0.013, 0.3, 10, white); stake.translate(0, 0.15, 0);
      shape.paint(stake, c => { const k = Math.floor((c.y - 0.12) / 0.032); return k >= 0 && k < 5 && ((c.y - 0.12) % 0.032) > 0.008 ? stripes[k] : null; });
      G.stake = rig.geo(shape.merge([stake, shape.move(shape.ball(0.017, white, 1), 0, 0.302, 0), shape.move(shape.cone(0.013, 0.03, 8, white), 0, -0.012, 0, Math.PI)]));
      G.balls = BALLS.map(b => { const prof = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI; prof.push([Math.cos(a) * R, Math.sin(a) * R]); } const g = shape.lathe(prof, 14, col(b.c, 0.15)); shape.paint(g, c => (Math.abs(c.y) < R * 0.32 && Math.abs(c.y) > R * 0.1 ? col(b.s, 0.15) : null)); return rig.geo(g); });
      const tuft = (n, hgt) => { const parts = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + 0.4, bl = new THREE.BufferGeometry(); bl.setAttribute('position', new THREE.Float32BufferAttribute([-0.004, 0, 0, 0.004, 0, 0, 0.001, hgt * (0.7 + 0.5 * ((i * 37) % 5) / 5), 0.012], 3)); bl.computeVertexNormals(); bl.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(9), 3)); shape.paint(bl, () => (i % 3 ? greens[i % greens.length] : col('#8d8f4c', 0.3))); shape.move(bl, Math.cos(a) * 0.006, 0, Math.sin(a) * 0.006, 0, a, 0); parts.push(bl); } return shape.merge(parts); };
      G.tufts = [rig.geo(tuft(5, 0.05)), rig.geo(tuft(7, 0.07)), rig.geo(tuft(4, 0.04))];
    }
    // Put them together.
    const add = g => { const i = rig.add(g); rig.show(i, false); return i; };
    this.tufts = [];
    for (let i = 0; i < TUFTS; i++) {
      const edge = i < 60, side = i % 2 ? 1 : -1, s = L.rand();
      const u = edge ? (i < 48 ? side * (HALF - 0.03 - L.rand() * 0.07) : (L.rand() - 0.5) * 2 * HALF) : (L.rand() - 0.5) * 2 * (HALF - 0.1);
      const out = edge && i >= 48 ? LEN - L.wall - 0.04 - L.rand() * 0.06 : 0.12 + s * (LEN - 0.3);
      this.tufts.push({ inst: add(G.tufts[i % 3]), u, out, yaw: L.rand() * 6.3, s: 0.8 + L.rand() * 0.6, k: 0 });
    }
    this.hoops = HOOPS.map(([u, out, tu, to], i) => ({ inst: add(G.hoop), u, out, tu, to, te: 1.25 + i * 0.2, k: 0, flex: 0, fv: 0, i }));
    this.stake = { inst: add(G.stake), u: STAKE[0], out: STAKE[1], te: 1.85, k: 0, flex: 0, fv: 0 };
    this.roll = L.rollers(BALLS.length, { r: R, bounce: 0.38, roll: 0.42, onBounce: (b, sp) => this.knock(L, Math.min(1, sp * 0.8), b.i) });
    this.balls = BALLS.map((b, i) => { const it = this.roll.items[i]; it.i = i; return { ...b, inst: add(G.balls[i]), b: it, state: 'in', q0: new THREE.Quaternion().setFromEuler(new THREE.Euler(L.rand() * 6, L.rand() * 6, L.rand() * 6)) }; });
    const fig = (name, parts) => ({ name, ...parts, u: 0, out: -0.4, yaw: L.yawOut, shown: false, clap: 0, clapT: 0, look: 0, gu: 0, go: 0 });
    this.figs = {
      blue: fig('blue', { body: add(G.blue), mallet: add(G.mallet) }),
      red: fig('red', { body: add(G.red), over: add(G.over), arms: [add(G.armW), add(G.armW)] }),
      brown: fig('brown', { body: add(G.brown), arms: [add(G.armB), add(G.armB)] }),
      man: fig('man', { torso: add(G.torso), arm: add(G.armR), hat: add(G.hat), legs: [[add(G.thigh), add(G.shin)], [add(G.thigh), add(G.shin)]] }),
    };
    this.blobs = L.blobs(10);
    this.breeze = L.voice().loop({ lp: 900, hp: 180 });
    // Her place by the tee: the ball beside her left foot, in front of her (local +x is the viewer's right, facing out).
    // (she stands square to the line, facing out of the wall's side of it: the ball off her +x, in front of her by z)
    const off = this.swing.lh / 2 + R + 0.002, fu = -DO, fo = DU;            // her front: the line turned a quarter towards you
    const last = MOVES.blue[MOVES.blue.length - 1]; last[1] = TEE[0] - off * DU - this.swing.z * fu; last[2] = TEE[1] - off * DO - this.swing.z * fo;
    this.stance = L.yawOf(fu, fo);
    this.hideAll(L);
  },

  // ---------------------------------------------------------------- the lawn
  // Lay the turf out to S metres from the wall; the rest is still rolled up, in a roll at its front edge.
  lay(L, S) {
    if (Math.abs(S - this.S) < 1e-5) return;
    this.S = S; const V = this.lawnV, p = this.v, rest = LEN - S, R0 = 0.034 + 0.075 * Math.sqrt(rest / LEN), base = -L.wall + 0.004;
    for (let i = 0; i <= NA; i++) for (let j = 0; j <= NL; j++) {
      const u = (i / NA - 0.5) * 2 * HALF, l = (j / NL) * LEN;
      let out, y;
      if (l <= S) { out = base + l; y = 0.011; }
      else { const ph = (l - S) / R0, r = R0 * (1 - 0.07 * ph / 6.283); out = base + S + r * Math.sin(ph); y = 0.011 + R0 - r * Math.cos(ph); }
      L.floor(u, out, p); V[(i * (NL + 1) + j) * 3] = p.x; V[(i * (NL + 1) + j) * 3 + 1] = L.y + y; V[(i * (NL + 1) + j) * 3 + 2] = p.z;
    }
    const pos = this.lawn.geometry.attributes.position.array; let f = 0;
    const put = (i, j) => { const k = (i * (NL + 1) + j) * 3; pos[f++] = V[k]; pos[f++] = V[k + 1]; pos[f++] = V[k + 2]; };
    for (let i = 0; i < NA; i++) for (let j = 0; j < NL; j++) { put(i, j); put(i + 1, j); put(i + 1, j + 1); put(i, j); put(i + 1, j + 1); put(i, j + 1); }
    this.lawn.geometry.attributes.position.needsUpdate = true;
    this.lawn.visible = S > 0.002;
  },

  hideAll(L) {
    const r = this.rig;
    for (const t of this.tufts) { r.show(t.inst, false); t.k = 0; }
    for (const h of [...this.hoops, this.stake]) { r.show(h.inst, false); h.k = 0; h.flex = 0; h.fv = 0; }
    for (const b of this.balls) { r.show(b.inst, false); b.state = 'in'; b.b.on = false; b.placed = false; b.leapt = false; b.from = null; }
    for (const f of Object.values(this.figs)) this.hideFig(f);
    this.blobs.count = 0; this.free = false;
  },
  hideFig(f) { const r = this.rig; f.active = false; for (const k of ['body', 'mallet', 'over', 'torso', 'arm', 'hat']) if (f[k] != null) r.show(f[k], false); for (const a of f.arms || []) r.show(a, false); for (const l of f.legs || []) { r.show(l[0], false); r.show(l[1], false); } f.shown = false; },

  start(L, resumed) {
    if (resumed && this.free) return;                       // (still out from last time: carry on playing)
    this.hideAll(L); this.lay(L, 0); this.sfx = {}; this.passes = 0;
    this.hero = { s: 0, done: false };
    const v = L.voice();
    // the sting: two mallet heads knocked together, and a plucked chord going up
    this.knock(L, 0.8, 0, 0.05); this.knock(L, 0.6, 1, 0.2);
    ['G4', 'B4', 'D5', 'G5'].forEach((n, i) => v.tune(n + ':.5', { bpm: 200, type: 'triangle', vol: 0.03, at: 0.32 + i * 0.07, legato: 0.35 }));
    L.k.synth.noise(1.3, { vol: 0.016, lp: 1100, at: 0.25 });          // the turf unrolling
  },
  back(L) {
    this.retFrom = {};
    for (const [n, f] of Object.entries(this.figs)) this.retFrom[n] = { u: f.u, out: f.out, active: !!f.active };
    for (const b of this.balls) { b.from = b.state !== 'in' ? (b.from || new THREE.Vector3()).set(b.b.x, b.b.y, b.b.z) : null; b.b.on = false; }
    this.retS = this.S;
  },
  end(L) { this.hideAll(L); this.lay(L, 0); this.breeze.set(0); },
  reset(L) { this.hideAll(L); this.lay(L, 0); },

  // ---------------------------------------------------------------- every frame
  update(L, dt) {
    const ph = L.phase, t = L.t, showing = ph === 'wake' || ph === 'play';
    if (ph === 'linger' && !this.free) this.goFree(L);
    const near = Math.max(0, 1 - Math.hypot(L.k.G.camera.position.x - L.cx, L.k.G.camera.position.z - L.cz) / 12);
    this.breeze.set(ph === 'return' ? 0 : 0.007 * near);
    if (ph === 'return') this.goHome(L, dt);
    else if (this.free) this.play(L, dt);
    else if (showing) this.show(L, dt, t);
    this.draw(L, dt);
    // a bird now and then, in his summer trees
    this.clock = (this.clock || 0) + dt;
    if (ph !== 'return' && this.clock > (this.birdAt || 0)) { this.birdAt = this.clock + 2.5 + L.rand() * 4; if (t > 1) this.bird(L); }
    L.voice().place();
  },

  // The show, worked out from show-time t.
  show(L, dt, t) {
    this.lay(L, LEN * ease.out(ramp(t, 0.25, 1.75)));
    for (const tf of this.tufts) tf.k = ease.outBack(clamp01((this.S - L.wall - tf.out - 0.05) / 0.25));
    for (const h of [...this.hoops, this.stake]) { const was = h.k; h.k = clamp01((t - h.te) / 0.45); if (was === 0 && h.k > 0) this.boing(L, h === this.stake ? 0.8 : 1); }
    // The balls: out from under the rail, a drop and bounces on the turf, rolling to their places.
    this.balls.forEach((b, i) => {
      const bb = b.b, tt = t - b.te;
      if (tt < 0) { b.state = 'in'; return; }
      if (i === 0 && t >= T_HIT) return this.heroRun(L, t);
      b.state = 'out';
      const pop = 0.18, H = L.rail - L.y - R - 0.07;
      let u, out, y;
      if (tt < pop) { const q = ease.out(tt / pop); u = b.u0; out = -L.wall - R + q * (L.wall + 2 * R + 0.02); y = H; }      // (out from the wall just under the rail, never up beside the picture)
      else {
        const q = tt - pop, fall = 1.45, Q = clamp01(q / fall);
        y = H * ease.bounce(Q);
        const k = ease.out(clamp01(q / 2.1));
        u = b.u0 + (b.rest[0] - b.u0) * k; out = 2 * R + 0.02 + (b.rest[1] - 2 * R - 0.02) * k;
        // a tock on each bounce
        for (const [qi, s] of [[1 / 2.75, 1], [2 / 2.75, 0.45], [2.5 / 2.75, 0.2]]) { const key = 'b' + i + qi; if (Q >= qi && !this.sfx[key]) { this.sfx[key] = 1; this.knock(L, s, i); } }
      }
      this.moveBall(L, b, u, out, y);
    });
    // The players.
    const F = this.figs;
    for (const name of ['blue', 'red', 'brown', 'man']) {
      const f = F[name], mv = MOVES[name], o = this.track(mv, t);
      f.active = !!o; if (!o) continue;
      f.u = o.u; f.out = o.out; f.moving = o.moving;
      if (o.moving > 0.05) f.yaw = this.turnTo(f.yaw, L.yawOf(o.du, o.dout), dt * 10);
    }
    // the ladies watching follow the blue ball with their eyes (and so their whole selves)
    const hb = L.local(this.balls[0].b.x, this.balls[0].b.z);
    for (const f of [F.red, F.brown]) if (f.active && f.moving < 0.05 && this.balls[0].state !== 'in') f.yaw = this.turnTo(f.yaw, L.yawOf(hb.u - f.u, hb.out - f.out), dt * 4);
    // the lady in blue: turn to face out, set the mallet down, waggle, look at the hoop, swing
    const B = F.blue;
    B.roll = 0.18 * ease.smooth(1 - ramp(t, 3.7, 4.0)) * Math.sin(t * 7);                 // (carried, swinging, as she walks)
    if (t > 3.5) B.yaw = this.turnTo(B.yaw, this.stance + (t > 4.55 && t < 4.95 ? 0.42 * Math.sin(Math.PI * ramp(t, 4.55, 4.95)) : 0), dt * 6);
    if (t > 4.0 && t < 4.55) B.roll = 0.13 * Math.sin((t - 4.0) / 0.55 * Math.PI * 2) * Math.sin((t - 4.0) / 0.55 * Math.PI);            // two waggles
    if (t >= 4.95) {
      const back = -1.15;
      if (t < 5.28) B.roll = back * ease.inOut(ramp(t, 4.95, 5.28));                                                                   // the backswing
      else if (t < 5.34) B.roll = back;                                                                                                // held
      else if (t < T_HIT) B.roll = back * (1 - ease.in(ramp(t, 5.34, T_HIT)));                                                          // and down
      else if (t < 5.62) B.roll = 0.85 * ease.out(ramp(t, T_HIT, 5.62));                                                               // through
      else if (t < 6.4) B.roll = 0.85;
      else B.roll = 0.85 * (1 - ease.inOut(ramp(t, 6.4, 7.0)));
      B.lean = t < T_HIT ? -0.05 * ramp(t, 4.95, 5.28) : 0.07 * Math.exp(-(t - T_HIT) * 2);
    } else B.lean = 0;
    // the curtsey
    B.dip = t > 7.25 && t < 8.3 ? Math.sin(Math.PI * ramp(t, 7.25, 8.3)) : 0;
    if (t > 9.5) { const k = (t - 9.5) % 5.5; B.roll = k < 1.6 ? -0.5 * Math.sin(Math.PI * k / 1.6) * Math.sin(Math.PI * k / 0.8) : 0; }      // practice swings while you look
    // the man: down on one knee to sight the line; up, and his boater off and waved when it hits the stake
    const M = F.man, hitStake = T_HIT + this.heroTime(RUN);
    if (t > 3.45) M.yaw = this.turnTo(M.yaw, L.yawOf(-DU, -DO + 0.12), dt * 5);
    M.crouch = ease.inOut(ramp(t, 3.55, 3.95)) * (1 - ease.outBack(ramp(t, hitStake + 0.05, hitStake + 0.38)));
    M.wave = t > hitStake + 0.3 ? (t < hitStake + 2.6 ? 1 : 1 - ramp(t, hitStake + 2.6, hitStake + 3.0)) : 0;
    M.lean = 0.42 * M.crouch;
    // the ladies clap: a little for each hoop, and properly for the stake
    const passes = [T_HIT + this.heroTime(0.45), T_HIT + this.heroTime(0.9)];
    for (const f of [F.red, F.brown]) f.clap = (t > passes[0] + 0.08 && t < passes[0] + 0.5) || (t > passes[1] + 0.08 && t < passes[1] + 0.5) || (t > hitStake + 0.1 && t < hitStake + 1.7) ? 1 : 0;
    // music
    if (!this.sfx.tune && t >= T_TUNE) { this.sfx.tune = 1; const v = L.voice(); v.tune(THEME, { bpm: BPM, type: 'triangle', vol: 0.022, legato: 0.32 }); v.tune(THEME_BASS, { bpm: BPM, type: 'sine', vol: 0.02, legato: 0.25 }); }
    if (!this.sfx.hit && t >= T_HIT) { this.sfx.hit = 1; this.tock(L); }
    if (!this.sfx.h0 && t >= passes[0]) { this.sfx.h0 = 1; L.voice().bell(1318.5, 0, 0.045, 2.2); this.claps(L, 3); }
    if (!this.sfx.h1 && t >= passes[1]) { this.sfx.h1 = 1; L.voice().bell(1568, 0, 0.045, 2.2); this.claps(L, 3); }
    if (!this.sfx.st && t >= hitStake) { this.sfx.st = 1; this.clack(L); this.claps(L, 14); for (const [f, i] of [[784, 0], [987.8, 1], [1174.7, 2], [1568, 3]]) L.voice().bell(f, 0.05 + i * 0.07, 0.035, 2.6); }
    if (!this.sfx.t2 && t >= hitStake + 0.55) { this.sfx.t2 = 1; const v = L.voice(); v.tune(THEME2, { bpm: BPM, type: 'triangle', vol: 0.024, legato: 0.4 }); v.tune('G3:2 | D3 G2:2', { bpm: BPM, type: 'sine', vol: 0.02, legato: 0.5 }); }
  },
  // The blue ball after the stroke: off along the line, through both hoops, into the stake and back a little.
  heroTime(d) { const disc = V0 * V0 - 2 * DEC * d; return disc <= 0 ? 99 : (V0 - Math.sqrt(disc)) / DEC; },
  heroRun(L, t) {
    const b = this.balls[0], tt = t - T_HIT, D = RUN, tS = this.heroTime(D);
    let s;
    if (tt < tS) s = V0 * tt - 0.5 * DEC * tt * tt;
    else { const v1 = (V0 - DEC * tS) * 0.42, k = Math.min(tt - tS, v1 / 1.4); s = D - (v1 * k - 0.7 * k * k); }
    b.state = 'out'; this.moveBall(L, b, TEE[0] + DU * s, TEE[1] + DO * s, 0);
    if (tt >= tS && !this.sfx.flex) { this.sfx.flex = 1; this.stake.fv = 1.4; }
  },
  moveBall(L, b, u, out, y) {
    const bb = b.b, p = L.floor(u, out, this.w); p.y += R + y;
    const dx = p.x - bb.x, dz = p.z - bb.z, d = Math.hypot(dx, dz);
    if (b.placed && d > 1e-5 && d < 0.5) { this.ax.set(dz, 0, -dx).multiplyScalar(1 / d); bb.q.premultiply(this.qq.setFromAxisAngle(this.ax, d / R)); }
    bb.x = p.x; bb.y = p.y; bb.z = p.z; bb.vx = bb.vz = bb.vy = 0; b.placed = true;
  },
  // A keyframed move: { u, out, du, dout, moving } at t, or null before it starts.
  track(mv, t) {
    if (t < mv[0][0]) return null;
    const o = this._o || (this._o = {}), n = mv.length, T0 = mv[0][0], T1 = mv[n - 1][0];
    if (!mv.len) { mv.len = [0]; for (let i = 1; i < n; i++) mv.len.push(mv.len[i - 1] + Math.hypot(mv[i][1] - mv[i - 1][1], mv[i][2] - mv[i - 1][2])); }
    const q = clamp01((t - T0) / (T1 - T0)), d = ease.inOut(q) * mv.len[n - 1];
    let i = 1; while (i < n - 1 && mv.len[i] < d) i++;
    const a = mv[i - 1], b = mv[i], k = clamp01((d - mv.len[i - 1]) / Math.max(1e-6, mv.len[i] - mv.len[i - 1]));
    o.u = a[1] + (b[1] - a[1]) * k; o.out = a[2] + (b[2] - a[2]) * k; o.du = b[1] - a[1]; o.dout = b[2] - a[2];
    o.moving = q >= 1 ? 0 : Math.min(1, Math.sin(Math.PI * q) * 1.8);
    return o;
  },
  turnTo(a, b, k) { const d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * Math.min(1, k); },

  // ---------------------------------------------------------------- the toy's turn
  goFree(L) {
    this.free = true; this.lay(L, LEN);
    for (const tf of this.tufts) tf.k = 1;
    for (const h of [...this.hoops, this.stake]) h.k = 1;
    for (const b of this.balls) {
      if (b.state === 'in') { const p = L.floor(b.rest[0], b.rest[1]); b.b.x = p.x; b.b.z = p.z; b.b.y = L.y + R; b.state = 'out'; }
      b.b.on = true; b.b.vx = b.b.vz = b.b.vy = 0; b.c0 = b.c1 = b.c2 = null;
    }
    for (const [n, f] of Object.entries(this.figs)) { f.gu = WATCH[n][0]; f.go = WATCH[n][1]; f.from = { u: f.active ? f.u : MOVES[n][0][1], out: f.active ? f.out : -0.32, t: 0 }; f.active = true; f.crouch = 0; f.roll = 0; f.lean = 0; f.dip = 0; f.wave = 0; f.clap = 0; }
    this.freeT = 0;
  },
  play(L, dt) {
    this.freeT += dt; const k = L.k, G = k.G, toy = G.vehicle;
    const tl = toy ? L.local(toy.pos.x, toy.pos.z) : { u: 9, out: 9 };
    // the balls: knocked about by the toy (the kit's rollers), and off the hoops' legs and the stake
    this.roll.step(dt);
    for (const b of this.balls) {
      const bb = b.b, q = L.local(bb.x, bb.z);
      for (const h of this.hoops) {
        // in the hoop's own terms: a across it (between the legs), c along the way through
        const du = q.u - h.u, dout = q.out - h.out, a = -du * h.to + dout * h.tu, c = du * h.tu + dout * h.to;
        for (const s of [-1, 1]) {
          const la = s * (HW + WIRE), ea = a - la, dd = Math.hypot(ea, c), m = R + WIRE;
          if (dd < m && dd > 1e-5 && bb.y - L.y < R * 1.5) {
            const na = ea / dd, nc = c / dd, nu = -na * h.to + nc * h.tu, no = na * h.tu + nc * h.to;
            const wx = L.tx * nu + L.nx * no, wz = L.tz * nu + L.nz * no, vn = bb.vx * wx + bb.vz * wz;
            bb.x += wx * (m - dd); bb.z += wz * (m - dd);
            if (vn < 0) { bb.vx -= 1.6 * vn * wx; bb.vz -= 1.6 * vn * wz; if (vn < -0.15) { this.clink(L, Math.min(1, -vn)); h.fv += -vn * 0.6 * Math.sign(c || 1); } }
          }
        }
        // through? (low, between the legs, and across the line since last frame)
        const prev = b['c' + h.i];
        if (prev != null && Math.abs(a) < HW - R * 0.3 && bb.y - L.y < R * 2 && Math.sign(prev) !== Math.sign(c) && Math.abs(c - prev) < 0.3) this.through(L, h, b);
        b['c' + h.i] = c;
      }
      { // the stake
        const du = q.u - this.stake.u, dout = q.out - this.stake.out, dd = Math.hypot(du, dout), m = R + 0.013;
        if (dd < m && dd > 1e-5) {
          const nu = du / dd, no = dout / dd, wx = L.tx * nu + L.nx * no, wz = L.tz * nu + L.nz * no, vn = bb.vx * wx + bb.vz * wz;
          bb.x += wx * (m - dd); bb.z += wz * (m - dd);
          if (vn < 0) { bb.vx -= 1.7 * vn * wx; bb.vz -= 1.7 * vn * wz; if (vn < -0.12) { this.clack(L, Math.min(1, -vn)); this.stake.fv += 0.8 * Math.min(1, -vn); if (-vn > 0.3) { this.claps(L, 6); for (const [f, i] of [[784, 0], [987.8, 1], [1174.7, 2]]) L.voice().bell(f, i * 0.07, 0.03, 2); } } }
        }
      }
    }
    // the hoops and the stake spring when the toy runs over them
    for (const h of [...this.hoops, this.stake]) {
      const du = tl.u - h.u, dout = tl.out - h.out, d = Math.hypot(du, dout);
      if (d < 0.2 && toy) { const tu = h.tu == null ? 1 : h.tu, to = h.to || 0, sp = toy.vel.x * (L.tx * tu + L.nx * to) + toy.vel.z * (L.tz * tu + L.nz * to); if (!h.under) { h.under = true; h.fv += Math.max(-3, Math.min(3, sp * 2.2)) || 1.5; this.boing(L, 0.7); } }
      else h.under = false;
    }
    // the players: to the edges of the lawn to watch, out of the toy's way, turning to follow it
    const F = this.figs;
    for (const f of Object.values(F)) {
      f.from.t += dt; const e = ease.inOut(clamp01(f.from.t / 1.4));
      let u = f.from.u + (f.gu - f.from.u) * e, out = f.from.out + (f.go - f.from.out) * e;
      const du = u - tl.u, dout = out - tl.out, d = Math.hypot(du, dout);
      if (d < 0.55 && d > 1e-4) { const push = (0.55 - d) / d; f.ax = (f.ax || 0) + (du * push - (f.ax || 0)) * Math.min(1, dt * 5); f.ao = (f.ao || 0) + (dout * push - (f.ao || 0)) * Math.min(1, dt * 5); }
      else { f.ax = (f.ax || 0) * Math.exp(-dt * 2); f.ao = (f.ao || 0) * Math.exp(-dt * 2); }
      const nu = u + (f.ax || 0), no = out + (f.ao || 0);
      f.moving = Math.min(1, Math.hypot(nu - f.u, no - f.out) / Math.max(dt, 1e-3) / 0.25);
      if (f.moving > 0.3 && e < 1) f.yaw = this.turnTo(f.yaw, L.yawOf(nu - f.u, no - f.out), dt * 8);
      else f.yaw = this.turnTo(f.yaw, L.yawOf(tl.u - nu, tl.out - no), dt * 3);
      f.u = nu; f.out = no;
      if (f.clapT > 0) { f.clapT -= dt; f.clap = 1; } else f.clap = 0;
    }
    F.man.wave = F.man.clapT > 0 ? 1 : Math.max(0, (F.man.wave || 0) - dt * 2);
    F.blue.roll = (this.freeT % 7) < 1.6 ? -0.5 * Math.sin(Math.PI * (this.freeT % 7) / 1.6) * Math.sin(Math.PI * (this.freeT % 7) / 0.8) : 0;
  },
  through(L, h, b) {
    const sp = Math.hypot(b.b.vx, b.b.vz); if (sp < 0.05) return;
    L.voice().bell([1318.5, 1568, 1760][h.i], 0, 0.05, 2.4); L.voice().bell([1318.5, 1568, 1760][h.i] * 1.5, 0.12, 0.025, 1.8);
    this.claps(L, 8);
    for (const f of Object.values(this.figs)) f.clapT = 1.4;
    this.passes++;
    if (!this.foundIt && !L.quiet) { this.foundIt = true; if (L.k.find('croquet')) L.k.callout('THROUGH THE HOOP'); L.k.say('A lovely shot. The players are clapping.', 3.5); }
  },

  // ---------------------------------------------------------------- going home
  goHome(L, dt) {
    const r = L.ret, F = this.figs;
    for (const [n, f] of Object.entries(F)) {
      const fr = this.retFrom[n]; if (!fr || !fr.active) { f.active = false; continue; }
      const e = ease.inOut(ramp(r, 0, 0.5)), tu = Math.max(-0.28, Math.min(0.28, fr.u));
      f.u = fr.u + (tu - fr.u) * e; f.out = fr.out + (-0.34 - fr.out) * e; f.moving = r < 0.5 ? 1 : 0;
      f.yaw = this.turnTo(f.yaw, L.yawOf(tu - fr.u, -0.34 - fr.out), dt * 10);
      f.crouch = Math.max(0, (f.crouch || 0) - dt * 4); f.wave = 0; f.clap = 0; f.dip = 0; f.lean = 0; f.roll = 0.15 * Math.sin(r * 30);
      f.active = f.out > -0.3;
    }
    // the balls bounce back up into the frame, one after another, each a note higher
    this.balls.forEach((b, i) => {
      if (!b.from) return;
      const q = ramp(r, 0.06 + i * 0.085, 0.34 + i * 0.085);
      const mouth = L.at(BALLS[i].u0, L.rail - R - 0.07 - L.cy, q < 0.92 ? 0.03 : -L.wall - R, this.w);
      if (q >= 1) { b.state = 'in'; b.from = null; return; }
      // a bounce off the turf, then up into the wall under the rail like a film run backwards (never above the rail)
      const s = ease.inOut(q), lift = ease.in(ramp(q, 0.25, 1));
      const x = b.from.x + (mouth.x - b.from.x) * s, z = b.from.z + (mouth.z - b.from.z) * s, y = b.from.y + 0.12 * Math.sin(Math.PI * Math.min(1, q / 0.25)) + (mouth.y - b.from.y) * lift;
      const bb = b.b, d = Math.hypot(x - bb.x, z - bb.z); if (d > 1e-5) { this.ax.set(z - bb.z, 0, -(x - bb.x)).multiplyScalar(1 / d); bb.q.premultiply(this.qq.setFromAxisAngle(this.ax, d / R)); }
      bb.x = x; bb.y = y; bb.z = z;
      if (q > 0 && !b.leapt) { b.leapt = true; this.knock(L, 0.5, i); L.voice().note([392, 494, 587, 784][i], 0.25, { vol: 0.02, type: 'triangle', at: 0.02 }); }
    });
    for (const h of [...this.hoops, this.stake]) h.k = 1 - ease.in(ramp(r, 0.36, 0.55));
    for (const tf of this.tufts) tf.k = Math.min(tf.k, 1 - ramp(r, 0.4, 0.5));
    this.lay(L, this.retS * (1 - ease.inOut(ramp(r, 0.46, 0.98))));
    if (r > 0.46 && !this.sfx.rollup) { this.sfx.rollup = 1; L.k.synth.noise(1.2, { vol: 0.014, lp: 1000 }); }
  },

  // ---------------------------------------------------------------- drawing it all where it is
  draw(L, dt) {
    const r = this.rig; let nb = 0;
    for (const tf of this.tufts) { const on = tf.k > 0.01; r.show(tf.inst, on); if (on) { const p = L.floor(tf.u, tf.out, this.v); r.put(tf.inst, p.x, L.y + 0.008, p.z, tf.yaw, 0, 0, tf.s * tf.k); } }
    for (const h of [...this.hoops, this.stake]) {
      // up out of the turf with a spring, and a wobble; flexed by knocks and by the toy running over
      h.fv += (-h.flex * 160 - h.fv * 7) * dt; h.flex += h.fv * dt; h.flex = Math.max(-0.9, Math.min(0.9, h.flex));
      const on = h.k > 0.01; r.show(h.inst, on); if (!on) continue;
      const sy = ease.outBack(h.k), wob = h.k < 1 ? 0.3 * Math.sin(h.k * 18) * (1 - h.k) : 0, p = L.floor(h.u, h.out, this.v);
      const yaw = h === this.stake ? 0 : L.yawOf(h.tu, h.to);
      this.sc.set(1, sy, 1); r.put(h.inst, p.x, L.y + 0.004 - (1 - Math.min(1, h.k * 1.3)) * 0.05, p.z, yaw, h.flex + wob, 0, this.sc);
    }
    for (const b of this.balls) {
      const on = b.state !== 'in' || !!b.from; r.show(b.inst, on); if (!on) continue;
      const bb = b.b; r.mat(b.inst, this.m.compose(this.v.set(bb.x, bb.y, bb.z), this.q.copy(bb.q).multiply(b.q0), this.one));
      if (bb.y - L.y < 0.6) this.blobs.set(nb++, bb.x, bb.z, R * 1.2, 0.8 * clamp01(1 - (bb.y - L.y - R) / 0.5));
    }
    for (const f of Object.values(this.figs)) {
      if (!f.active) { if (f.shown) this.hideFig(f); continue; }
      this.placeFig(L, f, dt);
      if (f.out > -0.05) this.blobs.set(nb++, this.figX, this.figZ, f.name === 'man' ? 0.08 : 0.16, 0.6);
    }
    this.blobs.count = nb;
  },
  // A point in a player's own terms (x across, y up, z forward) into the world.
  fw(f, x, y, z, o) { const c = Math.cos(f.yaw), s = Math.sin(f.yaw); return o.set(this.figX + x * c + z * s, this.Ly + y, this.figZ - x * s + z * c); },
  placeFig(L, f, dt) {
    const r = this.rig, p = L.floor(f.u, f.out, this.v); this.figX = p.x; this.figZ = p.z; this.Ly = L.y;
    if (!f.shown) { for (const k of ['body', 'mallet', 'over', 'torso', 'arm', 'hat']) if (f[k] != null) r.show(f[k], true); for (const a of f.arms || []) r.show(a, true); for (const l of f.legs || []) { r.show(l[0], true); r.show(l[1], true); } f.shown = true; }
    f.ph = (f.ph || 0) + dt * (f.moving || 0) * 11;
    const mv = Math.min(1, f.moving || 0);
    if (f.name !== 'man') {
      // a lady glides, her crinoline swaying, a little bob with each hidden step
      const bob = Math.abs(Math.sin(f.ph)) * 0.006 * mv - (f.dip || 0) * 0.035, sway = Math.sin(f.ph) * 0.04 * mv, sq = 1 - (f.dip || 0) * 0.08;
      this.sc.set(1 + (f.dip || 0) * 0.04, sq, 1 + (f.dip || 0) * 0.04);
      r.put(f.body, p.x, L.y + bob, p.z, f.yaw, (f.lean || 0) + (f.dip || 0) * 0.12, sway, this.sc);
      if (f.over != null) r.put(f.over, p.x, L.y + bob, p.z, f.yaw, (f.lean || 0) + (f.dip || 0) * 0.12, sway, this.sc);
      const sh = 0.345 * S * sq + bob;
      if (f.mallet != null) { const pv = this.fw(f, 0, sh, (f.lean || 0) * 0.3 * 0.345 * S, this.w); r.put(f.mallet, pv.x, pv.y, pv.z, f.yaw, (f.lean || 0) * 0.6, f.roll || 0); }
      if (f.arms) {
        f.cp = (f.cp || 0) + dt * (f.clap ? 26 : 0);
        const c = f.clap ? 0.5 + 0.5 * Math.cos(f.cp) : 0, raise = f.clapK = (f.clapK || 0) + ((f.clap ? 1 : 0) - (f.clapK || 0)) * Math.min(1, dt * 9);
        for (const s of [-1, 1]) {
          const pv = this.fw(f, s * 0.041 * S, sh, 0, this.w);
          r.put(f.arms[s < 0 ? 0 : 1], pv.x, pv.y, pv.z, f.yaw - s * (0.42 * (1 - raise) + raise * (0.08 + 0.24 * c)), -0.38 - raise * 0.95, s * 0.12 * (1 - raise) + sway);
        }
      }
    } else {
      // the man walks; kneels (his left knee up, his right on the turf, leaning in to sight the line); jumps up
      const cr = f.crouch || 0, bob = Math.abs(Math.sin(f.ph)) * 0.006 * mv, hipY = this.hip * (1 - cr * 0.45) + bob, sw = Math.sin(f.ph) * 0.45 * mv;
      const lean = f.lean || 0;
      r.put(f.torso, p.x + 0, L.y + hipY, p.z, f.yaw, lean, 0);
      for (const s of [0, 1]) {
        const side = (s ? 0.026 : -0.026) * S, swing = s ? sw : -sw;
        const a = s ? cr * 1.45 + swing : swing * (1 - cr) + cr * 0.12, b = s ? swing * 0.4 * (1 - cr) : swing * 0.3 * (1 - cr) - cr * 1.5;
        const hp = this.fw(f, side, hipY, 0, this.w), tl = 0.102 * S;
        r.put(f.legs[s][0], hp.x, hp.y, hp.z, f.yaw, -a, 0);
        const kn = this.fw(f, side, hipY - Math.cos(a) * tl, Math.sin(a) * tl, this.v2 || (this.v2 = new THREE.Vector3()));
        r.put(f.legs[s][1], kn.x, kn.y, kn.z, f.yaw, -b, 0);
      }
      const up = 0.178 * S, shY = hipY + Math.cos(lean) * up * 0.92, shZ = Math.sin(lean) * up * 0.92;
      const wave = f.wave || 0, wv = Math.sin(performance.now() * 0.012) * 0.35 * wave;
      const sp = this.fw(f, 0.05 * S, shY, shZ, this.w);
      const armPitch = -(0.35 + cr * 0.5) * (1 - wave) - 2.75 * wave + lean * (1 - wave);
      r.put(f.arm, sp.x, sp.y, sp.z, f.yaw, armPitch, 0.12 * (1 - wave) + wv);
      // the boater: on his head, or in his hand, up and waving
      const headTop = this.fw(f, 0, hipY + Math.cos(lean) * 0.236 * S, Math.sin(lean) * 0.236 * S, this.v2);
      if (wave > 0.01) {
        const hl = 0.15 * S, ang = armPitch, hx = 0.05 * S, hand = this.fw(f, hx, shY - Math.cos(ang) * hl, shZ - Math.sin(ang) * hl, this.v3 || (this.v3 = new THREE.Vector3()));
        const k = ease.smooth(clamp01(wave * 1.6));
        r.put(f.hat, headTop.x + (hand.x - headTop.x) * k, headTop.y + (hand.y + 0.02 - headTop.y) * k, headTop.z + (hand.z - headTop.z) * k, f.yaw, lean * (1 - k) - 1.2 * k, wv * 1.5 * k);
      } else r.put(f.hat, headTop.x, headTop.y, headTop.z, f.yaw, lean, 0);
    }
  },

  // ---------------------------------------------------------------- sounds (all made here, through the work's voice)
  noise(L) {
    const c = L.voice().ctx; if (!c) return null;
    if (!this._nb || this._nb.sampleRate !== c.sampleRate) { const n = c.sampleRate, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; this._nb = b; }
    return this._nb;
  },
  burst(L, { at = 0, dur = 0.04, f = 1500, q = 1, vol = 0.03, type = 'bandpass' } = {}) {
    const v = L.voice(), c = v.ctx, out = v.out(), nb = this.noise(L); if (!c || !out || !nb) return;
    const t = c.currentTime + at, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = nb; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  // wood on wood: a ball on the turf, ball on ball (higher for the small knocks)
  knock(L, s = 1, i = 0, at = 0) { const v = L.voice(), f = [820, 900, 760, 980][i % 4]; v.note(f, 0.07, { at, vol: 0.03 * s, type: 'sine', attack: 0.002 }); v.note(f * 2.76, 0.03, { at, vol: 0.012 * s, type: 'sine', attack: 0.001 }); this.burst(L, { at, dur: 0.02, f: 2600, q: 1.5, vol: 0.02 * s }); },
  // the stroke: a full, dry TOCK, and Haydn's chord on it
  tock(L) {
    const v = L.voice();
    const c = L.calm ? 0.45 : 1, at = L.calm ? 0.02 : 0.001;                             // with Reduce motion on, no sudden loud sound
    v.note(640, 0.12, { vol: 0.07 * c, type: 'sine', attack: at, to: 560 }); v.note(1720, 0.05, { vol: 0.03 * c, type: 'sine', attack: at }); this.burst(L, { dur: 0.035, f: 2200, q: 0.9, vol: 0.06 * c });
    for (const n of [196, 246.9, 293.7, 392, 98]) v.note(n, 0.9, { vol: n < 100 ? 0.04 : 0.028, type: n < 100 ? 'sine' : 'triangle', attack: 0.004 });
  },
  clack(L, s = 1) { const v = L.voice(); v.note(520, 0.09, { vol: 0.05 * s, type: 'sine', attack: 0.001 }); v.note(1340, 0.05, { vol: 0.02 * s, type: 'sine', attack: 0.001 }); this.burst(L, { dur: 0.03, f: 1800, q: 1.2, vol: 0.04 * s }); },
  clink(L, s = 1) { const v = L.voice(); v.note(2400, 0.18, { vol: 0.018 * s, type: 'sine', attack: 0.001 }); v.note(3710, 0.1, { vol: 0.008 * s, type: 'sine', attack: 0.001 }); },
  boing(L, s = 1) { const v = L.voice(); v.note(240, 0.32, { vol: 0.03 * s, type: 'triangle', to: 470, attack: 0.004 }); v.note(470, 0.2, { at: 0.08, vol: 0.014 * s, type: 'sine', to: 380 }); },
  claps(L, n) { for (let i = 0; i < n; i++) this.burst(L, { at: i * 0.11 + L.rand() * 0.07, dur: 0.045, f: 1100 + L.rand() * 700, q: 0.7, vol: 0.022 + L.rand() * 0.01 }); },
  bird(L) { const v = L.voice(), f = 3200 + L.rand() * 900; for (let i = 0, n = 2 + Math.floor(L.rand() * 3); i < n; i++) v.chirp(f, f * 1.25, 0.07, { at: i * 0.11, vol: 0.006 }); v.chirp(f * 1.2, f * 0.8, 0.16, { at: 0.42, vol: 0.005, flutter: 40 }); },
});
