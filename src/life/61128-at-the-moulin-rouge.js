// Henri de Toulouse-Lautrec, At the Moulin Rouge (1892-95), Gallery 242. The word: cabaret.
//
// Look at it and the gas comes up. A drum roll; a row of gas globes rises out of the floor along the front of the
// stage and lights, one after another, pop by pop, and the floor in front of the picture comes up in his two lights,
// the bar's green and the gas's orange, laid on in his long thin hatching. Behind, under the frame, the crowd rises
// up out of the floor as the poster crowd stands behind La Goulue: flat dark silhouettes, top hats and feathered hats.
// Then Offenbach's galop (the Galop infernal, 1858) strikes up and four dancers run out from under the bottom rail,
// made the way he made his posters: flat colour, a bold dark line round everything. They make a line at the front
// of the stage and dance the quadrille: kicks in unison, a ripple of kicks down the line, a spin with every skirt
// flaring out and the white froth of the petticoats showing, higher kicks, and on the last chord they jump and drop
// into the splits together, skirts spread round them like four flowers. A tall thin gentleman in a top hat (the
// poster's Valentin, the boneless one, and the tall figure in the picture's background) strolls out along the back,
// dances a few loose-limbed steps of his own at the end of the line, and sweeps off his hat to them. The crowd
// claps; they curtsey. While you keep looking the band vamps quietly, the dancers chat and fan themselves, and now
// and then the line kicks again. When you stop, they curtsey, run back in under the frame one after another, the
// gentleman tips his hat and follows them, the crowd sinks and the gas goes down.
//
// They are performers at work, and are shown as such: the dance as it was danced, nothing more.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture } from '../paintlife.js';
import { score, inked, Bones, hump, turnTo, noise, hz } from './stagecraft.js';

const LINE_OUT = 1.12, LINE_U = [-0.81, -0.27, 0.27, 0.81];
const HIP = 0.285, WAIST = 0.3, SHY = 0.395, SHX = 0.05, THIGH = 0.14, SHIN = 0.14, ARM = 0.155;
const V_HIP = 0.39, V_THIGH = 0.2, V_SHIN = 0.19, V_ARM = 0.23, V_SHY = 0.6;
const BAR = 0.652, BEAT = BAR / 2, T0 = 1.0, tb = n => T0 + (n - 1) * BAR;
const ENTER = i => 0.82 + 0.16 * [1, 0, 2, 3][i], RUN = 0.95;
const SPLIT = tb(12), IDLE0 = SPLIT + 2.2, REPRISE = 12;
const GLOBES = 7, CROWD = 9, GORES = 6;
// The Galop infernal (Offenbach, Orphee aux enfers, 1858): the can-can strain, in eighths, D major. 12 bars.
const GALOP = 'A4:4 | B4 D5 C#5 B4 | E5:2 E5:2 | E5 F#5 C#5 D5 | B4:2 B4:2 | B4 D5 C#5 B4 | A4 A5 G5 F#5 | E5 D5 C#5 B4 | B4:2 B4:2 | B4 D5 C#5 B4 | A4 E5 C#5 B4 | A4:2 R:2';
// The band under it: a chord to a bar, bass on the beats and the chord on the off-beats (an oom-pah).
const CHORDS = { D: [[38, 45], [54, 57, 62]], A7: [[45, 40], [52, 55, 61]], E7: [[40, 47], [50, 56, 59]] };
const HARM = ['D', 'D', 'A7', 'A7', 'E7', 'A7', 'D', 'A7', 'E7', 'A7', 'A7', 'D'];

lifeFor(61128, {
  title: /^At the Moulin Rouge/,
  word: 'cabaret',
  stage: { out: 1.75, half: 1.55, cam: { dist: 2.95, height: 0.92, side: 0.35, fov: 54, lookU: 0.05, lookOut: 0.9, lookH: 0.6 } },
  wake: 2, ret: 2.2,

  build(L) {
    const P = L.pal, col = (h, a = 0.45) => P.near(h, a);
    const ink = '#1b1611', INK = 0.0065, THIN = 0.0045;
    const B = this.B = new Bones();
    this.M = Array.from({ length: 8 }, () => new THREE.Matrix4());
    // ---------------------------------------------------------- shapes, each with its line
    const limb = (len, r0, r1, c, seg = 8) => shape.move(shape.cyl(r1, r0, len, seg, c), 0, -len / 2, 0);
    const two = (g, c1, c2, k = 0.15) => shape.paint(g, (cc, n) => (n.x * -0.5 + n.y * 0.6 + n.z * 0.62 > k ? c1 : c2));      // his flat colour, in a light and a shadow plane
    // A skirt panel (a gore): from the waistband (r0) to the hem (r1), `len` long, spanning the angle `half` either
    // side of +z; a thin slab, its outside in the skirt's colour and inside in the lining. Pivot: the middle of its
    // top edge, at the origin.
    const gore = (r0, r1, len, half, cOut, cIn) => {
      const NA = 4, NL = 6, th = 0.006, pos = [], colr = [], C = new THREE.Color();
      const pt = (a, l, inner) => { const r = r0 + (r1 - r0) * Math.pow(l, 0.85) - (inner ? th : 0); return [Math.sin(a) * r, -len * l, Math.cos(a) * r - r0]; };
      const quad = (p0, p1, p2, p3, c) => { pos.push(...p0, ...p1, ...p2, ...p0, ...p2, ...p3); C.set(c); for (let i = 0; i < 6; i++) colr.push(C.r, C.g, C.b); };
      for (let i = 0; i < NA; i++) for (let j = 0; j < NL; j++) {
        const a0 = -half + (2 * half * i) / NA, a1 = -half + (2 * half * (i + 1)) / NA, l0 = j / NL, l1 = (j + 1) / NL;
        quad(pt(a0, l0, 0), pt(a0, l1, 0), pt(a1, l1, 0), pt(a1, l0, 0), i === 0 || i === NA - 1 ? cOut[1] : cOut[0]);       // outside (faces out)
        quad(pt(a0, l0, 1), pt(a1, l0, 1), pt(a1, l1, 1), pt(a0, l1, 1), cIn);                                          // lining (faces in)
      }
      for (let j = 0; j < NL; j++) { const l0 = j / NL, l1 = (j + 1) / NL; quad(pt(-half, l0, 1), pt(-half, l1, 1), pt(-half, l1, 0), pt(-half, l0, 0), cOut[0]); quad(pt(half, l0, 0), pt(half, l1, 0), pt(half, l1, 1), pt(half, l0, 1), cOut[0]); }
      for (let i = 0; i < NA; i++) { const a0 = -half + (2 * half * i) / NA, a1 = -half + (2 * half * (i + 1)) / NA; quad(pt(a0, 1, 0), pt(a0, 1, 1), pt(a1, 1, 1), pt(a1, 1, 0), cIn); quad(pt(a0, 0, 1), pt(a0, 0, 0), pt(a1, 0, 0), pt(a1, 0, 1), cIn); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.computeVertexNormals();
      return inked(g, THIN, ink);
    };
    // The petticoat: tiers of white froth, scalloped, closed underneath; from the waist down (origin at the waist).
    const petticoat = (len, rHem) => {
      const NA = 28, NY = 7, pos = [], colr = [], C = new THREE.Color(), creams = [col('#f1ead8', 0.25), col('#e2dccb', 0.25), col('#cfc7c4', 0.3), col('#b9b2c2', 0.3)];
      const pt = (a, k) => { const y = -len * k, tier = Math.floor(k * 3.2) / 3.2, frill = 1 + 0.12 * Math.max(0, Math.sin(a * 14)) * Math.pow(k, 1.5) + 0.08 * ((k * 3.2) % 1); const r = (0.044 + (rHem - 0.044) * Math.pow(k, 0.7)) * frill + tier * 0.0; return [Math.sin(a) * r, y + 0.006 * Math.sin(a * 14) * k, Math.cos(a) * r]; };
      for (let i = 0; i < NA; i++) for (let j = 0; j < NY; j++) {
        const a0 = (i / NA) * Math.PI * 2, a1 = ((i + 1) / NA) * Math.PI * 2, k0 = j / NY, k1 = (j + 1) / NY;
        const p = [pt(a0, k0), pt(a0, k1), pt(a1, k1), pt(a1, k0)]; pos.push(...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[3]);
        C.copy(creams[(j % 2 ? 1 : 0) + (Math.sin(a0 * 14) < -0.3 ? 2 : 0)]); for (let q = 0; q < 6; q++) colr.push(C.r, C.g, C.b);
      }
      for (let i = 0; i < NA; i++) { const a0 = (i / NA) * Math.PI * 2, a1 = ((i + 1) / NA) * Math.PI * 2; pos.push(0, -len * 0.92, 0, ...pt(a1, 1), ...pt(a0, 1)); C.copy(creams[i % 2 ? 2 : 3]); for (let q = 0; q < 3; q++) colr.push(C.r, C.g, C.b); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.computeVertexNormals();
      return inked(g, THIN, ink);
    };
    const skin = col('#ecc9a8', 0.25), skinS = col('#c99a7c', 0.3), black = col('#1e1b18', 0.3), black2 = col('#2c2724', 0.3), red = col('#b8352a', 0.4);
    // ---------------------------------------------------------- the four dancers
    const LOOKS = [
      { skirt: ['#d9772b', '#c4652a'], lining: '#5f9070', bodice: '#23211d', hair: '#c4502a', hat: null },
      { skirt: ['#3f7d5f', '#336b52'], lining: '#e08a3a', bodice: '#b67f86', hair: '#e2b84f', hat: null },
      { skirt: ['#c27f86', '#ad6d76'], lining: '#6b2b33', bodice: '#3e7a5c', hair: '#4a2c1e', hat: '#2a3f36' },
      { skirt: ['#3c2b38', '#30222d'], lining: '#d9772b', bodice: '#d9772b', hair: '#8a3d22', hat: null },
    ];
    const body = (look) => {
      const bc = col(look.bodice, 0.35), bcS = new THREE.Color(bc).multiplyScalar(0.72), hair = col(look.hair, 0.35), hairS = new THREE.Color(hair).multiplyScalar(0.7);
      const bod = shape.lathe([[0, 0], [0.043, 0], [0.04, 0.025], [0.047, 0.07], [0.053, 0.093], [0.042, 0.108], [0.016, 0.116], [0, 0.118]], 14, bc);
      shape.move(bod, 0, 0, 0, 0, 0, 0, 1, 1, 0.78); two(bod, bc, bcS);
      const sleeves = [-1, 1].map(s => two(shape.move(shape.ball(0.022, bc, 1), s * SHX, SHY - WAIST + 0.002, 0, 0, 0, 0, 1, 0.9, 0.9), bc, bcS));
      const neck = shape.move(shape.cyl(0.011, 0.011, 0.03, 8, skin), 0, 0.127, 0);
      const choker = shape.move(shape.cyl(0.0125, 0.0125, 0.007, 8, black), 0, 0.13, 0);
      const head = shape.move(shape.ball(0.033, skin, 1), 0, 0.168, 0.003, 0, 0, 0, 0.95, 1.06, 1);
      shape.paint(head, (c, n) => (n.z > 0.55 && c.y < 0.158 && Math.abs(c.x) < 0.012 ? red : n.z < 0.1 && c.y > 0.15 ? hair : n.x * -0.5 + n.z * 0.7 + n.y * 0.4 < 0 ? skinS : null));
      const hairCap = shape.move(shape.ball(0.035, hair, 1), 0, 0.176, -0.006, 0, 0, 0, 1, 0.92, 1); shape.paint(hairCap, (c, n) => (n.z > 0.45 && c.y < 0.19 ? null : n.x * -0.5 + n.y * 0.7 > 0 ? hair : hairS));
      // (keep the face clear: the cap's front faces are dropped by pushing them inside the head)
      { const p = hairCap.attributes.position; for (let i = 0; i < p.count; i++) if (p.getZ(i) > 0.012 && p.getY(i) < 0.19) p.setZ(i, p.getZ(i) * 0.4); hairCap.computeVertexNormals(); }
      const bun = two(shape.move(shape.ball(0.021, hair, 1), 0, 0.212, -0.004), hair, hairS);
      const parts = [inked(shape.merge([bod, ...sleeves]), INK, ink), inked(shape.merge([neck, choker]), THIN, ink), inked(head, INK, ink), inked(hairCap, THIN, ink), inked(bun, INK, ink)];
      if (look.hat) { const hc = col(look.hat, 0.35); parts.push(inked(two(shape.merge([shape.move(shape.cyl(0.04, 0.04, 0.006, 14, hc), 0, 0.205, 0.004), shape.move(shape.cyl(0.024, 0.022, 0.026, 12, hc), 0, 0.22, 0.004)]), hc, new THREE.Color(hc).multiplyScalar(0.7)), THIN, ink)); parts.push(inked(shape.move(shape.cone(0.009, 0.07, 6, col('#e9dfc7', 0.3)), 0.02, 0.255, -0.01, 0, 0, -0.5), THIN, ink)); }
      parts.push(petticoat(0.15, 0.094));
      return shape.merge(parts);
    };
    const thigh = () => inked(shape.merge([limb(THIGH, 0.018, 0.0125, black), shape.move(shape.cyl(0.024, 0.02, 0.022, 10, col('#efe7d6', 0.25)), 0, -0.012, 0)]), THIN, ink);      // (the stocking, and the frill of her drawers at the top)
    const shin = () => inked(shape.merge([limb(SHIN, 0.0125, 0.0095, black), shape.move(shape.box(0.022, 0.018, 0.048, black2), 0, -SHIN - 0.004, 0.013), shape.move(shape.box(0.006, 0.014, 0.008, black2), 0, -SHIN - 0.01, -0.006)]), THIN, ink);
    // An arm from the shoulder: bare above the elbow, then his black evening glove to the fingers.
    const arm = () => inked(shape.merge([limb(0.07, 0.0115, 0.01, skin), shape.move(limb(0.085, 0.01, 0.008, black), 0, -0.07, 0), shape.move(shape.ball(0.011, black, 0), 0, -ARM - 0.004, 0.002)]), THIN, ink);
    // ---------------------------------------------------------- the gentleman: tall, thin, the top hat
    const coat = col('#3b3742', 0.35), coatS = new THREE.Color(coat).multiplyScalar(0.7), trs = col('#2b292e', 0.3), face = col('#e6cfae', 0.25), hatc = col('#141211', 0.2);
    const vBody = () => {
      const c = shape.lathe([[0, -0.06], [0.05, -0.06], [0.052, 0.0], [0.05, 0.08], [0.056, 0.17], [0.06, 0.205], [0.045, 0.22], [0.016, 0.228], [0, 0.23]], 14, coat);
      shape.move(c, 0, 0, 0, 0, 0, 0, 1, 1, 0.72); two(c, coat, coatS);
      { const p = c.attributes.position; for (let i = 0; i < p.count; i++) if (p.getZ(i) < 0 && p.getY(i) < 0.03) p.setZ(i, p.getZ(i) - 0.012 * (0.03 - p.getY(i)) / 0.09); c.computeVertexNormals(); }      // (the tails of the coat)
      const shirt = shape.move(shape.box(0.02, 0.06, 0.01, col('#efe9dc', 0.25)), 0, 0.19, 0.036);
      const tie = shape.move(shape.box(0.016, 0.008, 0.008, black), 0, 0.222, 0.036);
      const head = shape.move(shape.ball(0.03, face, 1), 0, 0.27, 0.004, 0, 0, 0, 0.9, 1.3, 1);
      shape.paint(head, (cc, n) => (n.z < -0.2 && cc.y > 0.25 ? black2 : n.x * -0.5 + n.z * 0.7 < -0.1 ? new THREE.Color(face).multiplyScalar(0.78) : null));
      const nose = shape.move(shape.cone(0.007, 0.022, 5, face), 0, 0.265, 0.036, Math.PI / 2);
      return shape.merge([inked(c, INK, ink), inked(shape.merge([shirt, tie]), THIN, ink), inked(shape.merge([head, nose]), INK, ink)]);
    };
    const vHat = () => inked(shape.merge([shape.move(shape.cyl(0.028, 0.031, 0.085, 14, hatc), 0, 0.0425, 0), shape.move(shape.cyl(0.05, 0.05, 0.005, 16, hatc), 0, 0.0025, 0), shape.move(shape.cyl(0.0285, 0.0285, 0.012, 14, col('#4a3f3a', 0.3)), 0, 0.012, 0)]), INK, ink);
    const vThigh = () => inked(limb(V_THIGH, 0.017, 0.013, trs), THIN, ink);
    const vShin = () => inked(shape.merge([limb(V_SHIN, 0.013, 0.01, trs), shape.move(shape.box(0.022, 0.016, 0.05, black), 0, -V_SHIN - 0.004, 0.014)]), THIN, ink);
    const vArm = (cane) => {
      const g = [limb(V_ARM, 0.012, 0.009, coat), shape.move(shape.ball(0.011, face, 0), 0, -V_ARM - 0.005, 0.003)];
      if (cane) g.push(shape.move(shape.cyl(0.0035, 0.0035, 0.38, 6, col('#2a1a10', 0.2)), 0, -V_ARM - 0.15, 0.02, 0, -0.08), shape.move(shape.ball(0.008, col('#d8b24a', 0.3), 0), 0, -V_ARM + 0.03, 0.02));
      return inked(shape.merge(g), THIN, ink);
    };
    // ---------------------------------------------------------- the crowd: the poster's band of silhouettes
    const shadowC = [col('#1f1c17', 0.3), col('#26221c', 0.3), col('#1b1916', 0.3), col('#2b2620', 0.3)];
    const person = (kind, h, ci) => {
      const c = shadowC[ci % 4], s = h / 0.48, parts = [];
      if (kind !== 'woman') {                    // a man in an overcoat, broad in the shoulder: a top hat or a bowler
        const coat = shape.lathe([[0, 0], [0.055, 0], [0.06, 0.16], [0.07, 0.27], [0.088, 0.325], [0.07, 0.355], [0.02, 0.362], [0, 0.364]], 12, c);
        shape.move(coat, 0, 0, 0, 0, 0, 0, 1, 1, 0.62); parts.push(coat, shape.move(shape.ball(0.034, c, 1), 0, 0.392, 0.004));
        if (kind === 'man') parts.push(shape.move(shape.cyl(0.03, 0.033, 0.08, 10, c), 0, 0.455, 0), shape.move(shape.cyl(0.056, 0.056, 0.006, 12, c), 0, 0.418, 0));
        else parts.push(shape.move(shape.ball(0.036, c, 1), 0, 0.42, 0, 0, 0, 0, 1, 0.75, 1), shape.move(shape.cyl(0.052, 0.052, 0.005, 12, c), 0, 0.414, 0));
        if (ci % 3 === 0) parts.push(shape.move(shape.cyl(0.004, 0.004, 0.3, 5, c), 0.075, 0.15, 0.04, 0, 0, -0.15));      // a cane
      } else {                                   // a woman: the bustle behind, a wide hat, its plumes
        const sk = shape.lathe([[0, 0], [0.085, 0], [0.075, 0.1], [0.05, 0.21], [0.045, 0.28], [0.05, 0.33], [0.03, 0.35], [0, 0.355]], 12, c);
        { const p = sk.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i), y = p.getY(i); if (z < 0) p.setZ(i, z - 0.06 * Math.exp(-(((y - 0.2) / 0.06) ** 2)) * (-z / 0.05)); } sk.computeVertexNormals(); }
        parts.push(sk, shape.move(shape.ball(0.032, c, 1), 0, 0.383, 0.004));
        parts.push(shape.move(shape.cyl(0.075, 0.07, 0.016, 12, c), 0, 0.41, 0, 0, 0, 0.12), shape.move(shape.cyl(0.03, 0.034, 0.03, 10, c), 0, 0.428, 0));
        parts.push(shape.move(shape.cone(0.012, 0.12, 5, c), 0.035, 0.47, -0.02, 0, 0, -0.5), shape.move(shape.cone(0.01, 0.1, 5, c), -0.015, 0.465, -0.03, 0, 0.2, 0.4));
      }
      const g = shape.merge(parts); shape.move(g, 0, 0, 0, 0, 0, 0, s); return g;
    };
    // ---------------------------------------------------------- the gas globes on their brass stems
    const globe = () => {
      const stem = shape.merge([shape.move(shape.cyl(0.004, 0.004, 0.13, 6, col('#9c7a3c', 0.3)), 0, 0.065, 0), shape.move(shape.cyl(0.022, 0.026, 0.01, 10, col('#7a5c2c', 0.3)), 0, 0.005, 0), shape.move(shape.cyl(0.012, 0.009, 0.014, 8, col('#b8944a', 0.3)), 0, 0.135, 0)]);
      const glass = shape.move(shape.ball(0.03, new THREE.Color(2.4, 2.0, 1.25), 2), 0, 0.17, 0);
      return shape.merge([inked(stem, 0.003, ink), glass]);
    };

    const rig = this.rig = L.rig(4 * (1 + GORES + 4 + 2) + 8 + CROWD + GLOBES, 120000, L.paint({ glow: 0.66, rough: 0.85, flat: true }));
    this.dancers = LOOKS.map((look, i) => {
      const gb = rig.geo(body(look)), gg = rig.geo(gore(0.05, 0.168, 0.286, 0.6, [col(look.skirt[0], 0.4), col(look.skirt[1], 0.4)], col(look.lining, 0.4)));
      const gt = rig.geo(thigh()), gs = rig.geo(shin()), ga = rig.geo(arm());
      return { body: rig.add(gb), gores: Array.from({ length: GORES }, () => rig.add(gg)), thighs: [rig.add(gt), rig.add(gt)], shins: [rig.add(gs), rig.add(gs)], arms: [rig.add(ga), rig.add(ga)], pose: newPose(), shown: true, i };
    });
    const vg = { body: rig.geo(vBody()), hat: rig.geo(vHat()), thigh: rig.geo(vThigh()), shin: rig.geo(vShin()), arm: rig.geo(vArm(false)), cane: rig.geo(vArm(true)) };
    this.val = { body: rig.add(vg.body), hat: rig.add(vg.hat), thighs: [rig.add(vg.thigh), rig.add(vg.thigh)], shins: [rig.add(vg.shin), rig.add(vg.shin)], arms: [rig.add(vg.cane), rig.add(vg.arm)], pose: newPose(), shown: true };
    const kinds = ['man', 'woman', 'bowler', 'man', 'woman', 'man', 'woman', 'bowler', 'man'], hts = [0.5, 0.45, 0.46, 0.53, 0.44, 0.48, 0.46, 0.47, 0.51];
    // two loose rows, bunched as a crowd is, the back row against the wall's foot, all of it under the frame
    this.crowd = kinds.map((k, i) => ({ inst: rig.add(rig.geo(person(k, hts[i], i))), u: (i - 4) * 0.31 + (L.rand() - 0.5) * 0.08, out: i % 2 ? 0.19 : 0.36, yaw: (L.rand() - 0.5) * 0.9, ph: L.rand() * 6 }));
    const gGlobe = rig.geo(globe());
    this.globes = Array.from({ length: GLOBES }, (_, i) => ({ inst: rig.add(gGlobe), u: (i / (GLOBES - 1) - 0.5) * 2.5, out: 1.62 + 0.05 * Math.cos((i / (GLOBES - 1) - 0.5) * Math.PI) }));
    // every instance a colour from the start (so the shader is built with them once), the globes' flicker rides on it
    this.cc = new THREE.Color(); for (let i = 0; i < rig.count; i++) rig.mesh.setColorAt(i, this.cc.setRGB(1, 1, 1));

    // ---------------------------------------------------------- the light: the bar's green and the gas's orange, hatched
    const hatch = canvasTexture(256, 256, (g, w, h) => {
      const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,0.6)'); r.addColorStop(0.8, 'rgba(255,255,255,0.15)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, w, h);
      // his long, thin, hatched strokes (oil thinned with turpentine, dragged across the boards)
      const c2 = document.createElement('canvas'); c2.width = w; c2.height = h; const q = c2.getContext('2d');
      q.fillStyle = 'rgba(255,255,255,0.5)'; q.fillRect(0, 0, w, h); q.lineCap = 'round';
      for (let i = 0; i < 260; i++) { const x = L.rand() * w * 1.4 - w * 0.2, y = L.rand() * h, len = 30 + L.rand() * 90, a = -0.35 + (L.rand() - 0.5) * 0.25; q.strokeStyle = `rgba(255,255,255,${0.35 + L.rand() * 0.65})`; q.lineWidth = 1 + L.rand() * 3.5; q.beginPath(); q.moveTo(x, y); q.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); q.stroke(); }
      g.globalCompositeOperation = 'destination-in'; g.drawImage(c2, 0, 0);
    }, false);
    const green = col('#2f9a74', 0.3), orange = col('#ec8a35', 0.4);
    this.light = L.glows([
      { w: 3.8, d: 2.1, u: -0.45, out: 0.9, color: green, strength: 0.95 },
      { w: 2.3, d: 1.3, u: 0.35, out: 1.2, color: orange, strength: 0.7 },
      ...this.globes.map(g => ({ w: 0.42, d: 0.36, u: g.u, out: g.out - 0.12, color: orange, strength: 0.55 })),
    ]);
    this.light.material.map = hatch;
    this.blobs = L.blobs(5);
    this.hideAll();
    this.band = this.makeScore(L);
    this.murmur = L.voice().loop({ lp: 650, hp: 160 });
    this.T = new THREE.Vector3();
  },

  // ---------------------------------------------------------- the band's part, on the show's clock
  makeScore(L) {
    const s = score(L), E = BAR / 4;      // an eighth
    // the drum roll as the gas comes up, swelling
    for (let t = 0.02; t < 0.92; t += 0.034 - t * 0.008) s.hit(t, { d: 0.05, vol: 0.006 + 0.03 * t, bp: 2600, q: 0.7 });
    s.hit(0.95, { d: 0.9, vol: 0.035, hp: 4500 });
    // the galop
    s.tune(GALOP, T0, 60 / E, { type: 'triangle', vol: 0.034, over: 2, overVol: 0.35, legato: 0.82 });
    s.tune(GALOP, T0, 60 / E, { type: 'sine', vol: 0.012, oct: -1, legato: 0.7 });
    HARM.forEach((h, b) => this.oompah(s, tb(b + 1), h, 1));
    s.hit(T0, { d: 1.1, vol: 0.03, hp: 5000 });
    for (let b = 0; b < 12; b++) for (let k = 0; k < 2; k++) s.hit(tb(b + 1) + k * BEAT + BEAT / 2, { d: 0.06, vol: 0.016, bp: 3000, q: 0.8 });
    // the splits: a cymbal and the last chord, held
    s.hit(SPLIT, { d: 1.8, vol: 0.05, hp: 3800 }); s.hit(SPLIT, { d: 0.25, vol: 0.05, lp: 160 });
    for (const m of [38, 50, 54, 57, 62, 66, 69]) s.note(SPLIT, hz(m), 1.4, { type: m < 45 ? 'triangle' : 'sawtooth', vol: m < 45 ? 0.04 : 0.006, attack: 0.01 });
    // applause from the crowd
    for (let i = 0; i < 70; i++) { const t = SPLIT + 0.25 + L.rand() * 1.9 * Math.sqrt(L.rand()); s.hit(t, { d: 0.035, vol: 0.012 + L.rand() * 0.012, bp: 1200 + L.rand() * 1800, q: 1.2 }); }
    // while you keep looking: the band vamps, quietly, and every so often strikes up again for a few kicks
    const vamp = []; ['D', 'A7'].forEach((h, b) => { const [bass, ch] = CHORDS[h]; for (let k = 0; k < 2; k++) { vamp.push({ t: b * BAR + k * BEAT, f: hz(bass[k]), d: 0.2, type: 'triangle', vol: 0.016 }); for (const m of ch) vamp.push({ t: b * BAR + k * BEAT + BEAT / 2, f: hz(m), d: 0.09, type: 'triangle', vol: 0.0045 }); } });
    s.loop(IDLE0 - 0.6, 2 * BAR, vamp);
    const rep = [];
    const mel = 'A4:4 | B4 D5 C#5 B4 | E5:2 E5:2 | E5 F#5 C#5 D5';
    const tmp = score(L); tmp.tune(mel, 0, 60 / E, { type: 'triangle', vol: 0.02, over: 2, overVol: 0.3, legato: 0.82 }); rep.push(...tmp.ev);
    for (let b = 0; b < 4; b++) for (let k = 0; k < 2; k++) rep.push({ t: b * BAR + k * BEAT + BEAT / 2, noise: true, d: 0.05, vol: 0.008, bp: 3000, q: 0.8 });
    s.loop(IDLE0 + 3 - BAR * 2, REPRISE, rep);
    return s.done();
  },
  oompah(s, t, h, k) {
    const [bass, ch] = CHORDS[h];
    for (let b = 0; b < 2; b++) {
      s.note(t + b * BEAT, hz(bass[b]), 0.22, { type: 'triangle', vol: 0.042 * k, attack: 0.005 });
      for (const m of ch) s.note(t + b * BEAT + BEAT / 2, hz(m), 0.1, { type: 'triangle', vol: 0.011 * k, attack: 0.004 });
    }
  },

  hideAll() {
    const r = this.rig;
    for (const d of this.dancers) { for (const i of [d.body, ...d.gores, ...d.thighs, ...d.shins, ...d.arms]) r.show(i, false); d.shown = false; }
    const v = this.val; for (const i of [v.body, v.hat, ...v.thighs, ...v.shins, ...v.arms]) r.show(i, false); v.shown = false;
    for (const c of this.crowd) r.show(c.inst, false);
    for (const g of this.globes) r.show(g.inst, false);
    for (let i = 0; i < 2 + GLOBES; i++) this.light.set(i, 0);
    this.blobs.count = 0;
  },

  start(L, resumed) {
    if (!resumed) this.hideAll();
    this.popped = [];
    this.band.from(L.t);
    if (!this.told && !L.quiet) { this.told = true; L.k.say('The gas comes up, and the band strikes up Offenbach’s galop.', 4); }
  },
  back(L) {
    // where everyone is, to take them home from there
    this.from = this.dancers.map(d => ({ u: d.pose.u, out: d.pose.out, yaw: d.pose.yaw, shown: d.shown }));
    this.vfrom = { u: this.val.pose.u, out: this.val.pose.out, yaw: this.val.pose.yaw, shown: this.val.shown };
    this.lightFrom = this.lightK || 0;
    if (!L.quiet) { const v = L.voice(); if (v.ctx) { v.note(98, 0.15, { vol: 0.05, type: 'sine', at: 1.25 }); v.note(98, 0.15, { vol: 0.05, type: 'sine', at: 1.45 }); noise(v, 1.45, { d: 0.9, vol: 0.03, hp: 4500 }); } }
  },
  end() { this.hideAll(); this.murmur.set(0); },
  reset() { this.hideAll(); this.murmur.set(0); this.told = false; },

  update(L, dt) {
    const t = L.t, ph = L.phase, showing = ph === 'wake' || ph === 'play', R = L.ret;
    // ---- the gas, the light, the crowd
    let lightK, crowdK, globeK = [];
    if (showing) {
      lightK = ease.smooth(ramp(t, 0.25, 1.5));
      crowdK = ease.out(ramp(t, 0.35, 1.25));
      for (let i = 0; i < GLOBES; i++) { const c = Math.abs(i - (GLOBES - 1) / 2), t0 = 0.08 + c * 0.2; globeK.push(ramp(t, t0, t0 + 0.28)); if (!this.popped) this.popped = []; if (t >= t0 + 0.2 && !this.popped[i]) { this.popped[i] = true; this.pop(L, i); } }
    } else {
      lightK = this.lightFrom * (1 - ease.smooth(ramp(R, 0.3, 1)));
      crowdK = 1 - ease.inOut(ramp(R, 0.35, 0.95));
      for (let i = 0; i < GLOBES; i++) globeK.push(1 - ease.inOut(ramp(R, 0.55 + Math.abs(i - 3) * 0.04, 0.95)));
      this.popped = null;
    }
    this.lightK = lightK;
    const flick = k => 0.94 + 0.06 * Math.sin(t * 13.1 + k * 2.3) * Math.sin(t * 7.3 + k);
    this.light.set(0, lightK * flick(0)); this.light.set(1, lightK * flick(1));
    const r = this.rig, B = this.B, M = this.M, beat = (t - T0) / BEAT;
    this.globes.forEach((g, i) => {
      const k = globeK[i], on = k > 0.001; r.show(g.inst, on); this.light.set(2 + i, ramp(k, 0.6, 1) * flick(i + 2));
      if (!on) return;
      const p = L.floor(g.u, g.out, this.T), rise = ease.outBack(k);
      B.set(M[0], p.x, L.y - 0.22 * (1 - rise), p.z, 0, 0, 0); r.mat(g.inst, M[0]);
      const b = ramp(k, 0.55, 1) * flick(i + 2); r.mesh.setColorAt(g.inst, this.cc.setRGB(0.25 + 0.75 * b, 0.25 + 0.75 * b, 0.3 + 0.7 * b));
    });
    this.crowd.forEach((c, i) => {
      const on = crowdK > 0.001; r.show(c.inst, on); if (!on) return;
      const p = L.floor(c.u, c.out, this.T), clap = t > SPLIT + 0.2 && t < SPLIT + 2.2 && showing ? Math.abs(Math.sin((t * 7 + c.ph) * Math.PI)) * 0.012 : 0;
      const sway = showing && t > T0 ? Math.sin(beat * Math.PI + c.ph) * 0.05 : 0, bob = showing && t > T0 ? Math.abs(Math.sin(beat * Math.PI * 0.5 + c.ph)) * 0.006 : 0;
      B.set(M[0], p.x, L.y - 0.55 * (1 - crowdK) + clap + bob, p.z, L.yawOut + c.yaw, 0, sway); r.mat(c.inst, M[0]);
    });
    // ---- the dancers and the gentleman
    let nb = 0;
    this.dancers.forEach((d, i) => {
      const P = d.pose;
      if (showing) this.dance(L, i, t, P);
      else this.home(L, i, R, P);
      this.place(L, d, P);
      if (P.vis) { const p = L.floor(P.u, P.out, this.T); this.blobs.set(nb++, p.x, p.z, P.split > 0.5 ? 0.2 : 0.13, 0.75); }
    });
    const V = this.val.pose;
    if (showing) this.stroll(L, t, V); else this.vhome(L, R, V);
    this.placeVal(L, V);
    if (V.vis) { const p = L.floor(V.u, V.out, this.T); this.blobs.set(nb++, p.x, p.z, 0.11, 0.65); }
    this.blobs.count = nb;
    // ---- the sound
    if (showing) this.band.play(t);
    const near = Math.max(0, 1 - Math.hypot(L.k.G.camera.position.x - L.cx, L.k.G.camera.position.z - L.cz) / 12);
    this.murmur.set(showing && !L.quiet ? 0.012 * crowdK * near : 0);
    L.voice().place();
  },

  pop(L, i) {
    if (L.quiet) return; const v = L.voice(); if (!v.ctx) return;
    v.note(260 + i * 18, 0.09, { vol: 0.02, type: 'sine', to: 120 }); noise(v, 0, { d: 0.18, vol: 0.012, hp: 2500 });
  },

  // ---------------------------------------------------------- the dance, as a function of show-time
  dance(L, i, t, P) {
    rest(P, L, LINE_U[i], LINE_OUT);
    const te = ENTER(i);
    if (t < te) { P.vis = false; return; }
    P.vis = true;
    const beatPh = q => q - Math.floor(q);
    if (t < te + RUN) {                                                  // running out from under the rail to her place
      const s = ease.inOut((t - te) / RUN), u0 = LINE_U[i] * 0.22, cu = LINE_U[i] * 0.75, a = 1 - s;
      P.u = a * a * u0 + 2 * a * s * cu + s * s * LINE_U[i]; P.out = a * a * -0.38 + 2 * a * s * 0.62 + s * s * LINE_OUT;
      const du = 2 * a * (cu - u0) + 2 * s * (LINE_U[i] - cu), dout = 2 * a * (0.62 + 0.38) + 2 * s * (LINE_OUT - 0.62);
      P.yaw = turnTo(L.yawOf(du, dout), L.yawOut, ramp(s, 0.7, 1));
      run(P, t * 2 * Math.PI * 3.4, 1 - ramp(s, 0.85, 1));
      return;
    }
    if (t < tb(3)) { bounce(P, t); return; }
    if (t < tb(5)) { const q = (t - tb(3)) / BEAT, k = Math.floor(q); kick(P, k % 2, beatPh(q), 2.15); return; }
    if (t < tb(7)) {                                                     // a ripple of kicks down the line and back
      const q = (t - tb(5)) / BEAT, s1 = i * 0.42, s2 = 2.05 + (3 - i) * 0.42;
      if (q >= s1 && q < s1 + 1) kick(P, 0, q - s1, 2.3); else if (q >= s2 && q < s2 + 1) kick(P, 1, q - s2, 2.3); else bounce(P, t);
      return;
    }
    if (t < tb(9)) {                                                     // the spin, skirts flaring
      const s = clamp01((t - tb(7) - 0.04) / (2 * BAR - 0.16)), w = Math.sin(Math.PI * s), turn = (i % 2 ? -1 : 1) * 4 * Math.PI * ease.inOut(s);
      P.spin = turn; P.dy = 0.008 * Math.abs(Math.sin(s * Math.PI * 8));
      for (let g = 0; g < GORES; g++) P.gores[g] = 0.28 + 1.0 * w + 0.12 * w * Math.sin(turn * 1.5 + g * 2.1);
      P.arms[0][0] = -2.75 * ease.smooth(s * 4); P.arms[0][1] = -0.25;          // one arm up
      P.arms[1][0] = -0.25; P.arms[1][1] = 0.4 + 0.8 * w;                         // the other holding the skirt out
      const st = Math.sin(s * Math.PI * 8); P.legs[0][0] = -0.25 * Math.max(0, st); P.legs[0][2] = 0.5 * Math.max(0, st); P.legs[1][0] = -0.25 * Math.max(0, -st); P.legs[1][2] = 0.5 * Math.max(0, -st);
      return;
    }
    if (t < tb(11)) { const q = (t - tb(9)) / BEAT, k = Math.floor(q); kick(P, (k + 1) % 2, beatPh(q), 2.65); return; }
    if (t < SPLIT) {                                                     // gather, jump, and down into the splits
      const q = (t - tb(11)) / BAR;
      if (q < 0.42) { const c = ease.smooth(q / 0.42); knees(P, 0.95 * c); P.arms[0][0] = P.arms[1][0] = 0.5 * c; P.lean = 0.18 * c; P.gores.fill(0.2); return; }
      const j = (q - 0.42) / 0.58;
      P.dy = 0.1 * Math.sin(Math.PI * Math.min(1, j / 0.75)) - (HIP - 0.022) * ease.in(ramp(j, 0.55, 1));
      const open = ease.out(ramp(j, 0.1, 1)); P.legs[0][1] = -1.52 * open; P.legs[1][1] = 1.52 * open;
      P.arms[0][1] = -2.3 * ease.out(j); P.arms[1][1] = 2.3 * ease.out(j); P.arms[0][0] = P.arms[1][0] = 0.5 * (1 - j);
      P.gores.fill(0.2 + 1.22 * ease.out(ramp(j, 0.2, 1))); P.split = open;
      return;
    }
    if (t < SPLIT + 0.75) { splits(P, 1, t); return; }
    if (t < SPLIT + 1.25) { const s = ease.inOut((t - SPLIT - 0.75) / 0.5); splits(P, 1 - s, t); return; }
    if (t < SPLIT + 2.05) { curtsey(P, hump((t - SPLIT - 1.25) / 0.8, 0, 1), i); return; }
    // ---- while you keep looking: chatting in pairs, fanning, a hand on a hip; now and then the line kicks again
    const it = t - IDLE0, rq = (t - (IDLE0 + 3)) / REPRISE, rk = rq - Math.floor(rq), rt = rk * REPRISE;
    if (rq >= 0 && rt < 4 * BEAT) { const q = rt / BEAT, k = Math.floor(q); kick(P, k % 2, beatPh(q), 2.0); return; }
    const face = (i % 2 ? -1 : 1) * 0.42 * ease.smooth(ramp(it, 0, 0.8)) * (1 - ease.smooth(ramp(rt, REPRISE - 0.6, REPRISE)));
    P.yaw = L.yawOut + face + 0.06 * Math.sin(t * 0.7 + i);
    P.dy = 0.003 * Math.sin(t * 1.3 + i * 2);
    const sw = Math.sin(t * 0.9 + i * 1.7); P.legs[0][2] = 0.12 * Math.max(0, sw); P.legs[1][2] = 0.12 * Math.max(0, -sw);
    if (i === 1 || i === 2) { P.arms[i === 1 ? 1 : 0][0] = -2.1; P.arms[i === 1 ? 1 : 0][1] = (i === 1 ? 1 : -1) * (0.15 + 0.18 * Math.sin(t * 9 + i)); }      // fanning herself
    else { P.arms[0][1] = -0.55; P.arms[1][1] = 0.55; P.arms[0][0] = P.arms[1][0] = 0.25; }                                                  // hands on hips
    P.gores.fill(0.1 + 0.02 * Math.sin(t * 2 + i));
  },
  // Going home: a bob of a curtsey where she stands, then a run back in under the rail.
  home(L, i, R, P) {
    const f = this.from && this.from[i]; rest(P, L, f ? f.u : LINE_U[i], f ? f.out : LINE_OUT);
    if (!f || !f.shown) { P.vis = false; return; }
    P.vis = true; P.yaw = f.yaw;
    const c = hump(R, 0, 0.2); if (R < 0.2) { curtsey(P, c * 0.8, i); return; }
    const s0 = 0.16 + 0.07 * [1, 0, 2, 3][i], s = ease.inOut(clamp01((R - s0) / 0.62));
    if (R < s0) return;
    const u1 = LINE_U[i] * 0.22, a = 1 - s, cu = f.u * 0.7;
    P.u = a * a * f.u + 2 * a * s * cu + s * s * u1; P.out = a * a * f.out + 2 * a * s * 0.55 + s * s * -0.4;
    const du = 2 * a * (cu - f.u) + 2 * s * (u1 - cu), dout = 2 * a * (0.55 - f.out) + 2 * s * (-0.4 - 0.55);
    P.yaw = turnTo(f.yaw, L.yawOf(du, dout), ramp(s, 0, 0.15));
    run(P, (R * 2.2) * 2 * Math.PI * 3.4, 1);
    if (s >= 1) P.vis = false;
  },

  // ---------------------------------------------------------- the gentleman
  stroll(L, t, V) {
    rest(V, L, -0.62, -0.4); V.hat = 1; V.vis = t > 1.25;
    if (!V.vis) return;
    const path = this.vpath || (this.vpath = vwalk([[-0.62, -0.4], [-0.6, 0.42], [-0.3, 0.62], [0.45, 0.62], [1.12, 0.78]]));
    const s = clamp01((t - 1.25) / (tb(9) - 0.3 - 1.25)), o = path.at(s);
    V.u = o.u; V.out = o.out;
    if (s < 1) { V.yaw = L.yawOf(o.du, o.dout); vwalkPose(V, (t - 1.25) * 2 * Math.PI * 1.15, 1); return; }
    V.yaw = turnTo(L.yawOf(o.du, o.dout), L.yawOut - 0.25, ramp(t, tb(9) - 0.3, tb(9)));
    if (t < tb(11)) {                                                    // the boneless one's steps
      const q = (t - tb(9)) / BEAT, w = q * Math.PI;
      V.legs[0][0] = -1.2 * Math.max(0, Math.sin(w)); V.legs[0][2] = 1.9 * Math.max(0, Math.sin(w)); V.legs[0][1] = -0.4 * Math.max(0, Math.sin(w));
      V.legs[1][0] = -1.2 * Math.max(0, -Math.sin(w)); V.legs[1][2] = 1.9 * Math.max(0, -Math.sin(w)); V.legs[1][1] = 0.4 * Math.max(0, -Math.sin(w));
      V.lean = -0.12 + 0.05 * Math.sin(w * 2); V.roll = 0.14 * Math.sin(w); V.dy = 0.03 * Math.abs(Math.sin(w)) - 0.015;
      V.arms[0][0] = -0.6 + 0.4 * Math.sin(w); V.arms[1][1] = 0.9 + 0.4 * Math.sin(w + 1); V.arms[1][0] = -0.4;
      return;
    }
    // the hat: up to the brim, off, swept round in a bow to them, held at his chest, and back on
    const d = t - tb(11), A = V.arms[1];
    if (d < 0.35) { const k = ease.smooth(d / 0.35); A[0] = -2.95 * k; V.hatUp = 0.125 * k; V.hatX = 0.05 * k; return; }
    if (d < 2.95) {
      V.hat = 0;
      const sweep = ease.inOut(ramp(d, 0.35, 0.95)), up = ease.inOut(ramp(d, 2.15, 2.6)), lift = ease.inOut(ramp(d, 2.6, 2.95));
      A[0] = lerp(lerp(-2.95, -0.9, sweep), -0.6, up); A[0] = lerp(A[0], -2.95, lift); A[1] = 0.9 * sweep * (1 - up) + 0.3 * up * (1 - lift);
      V.lean = 0.55 * sweep * (1 - up); V.legs[1][0] = 0.35 * sweep * (1 - up); V.legs[1][2] = 0.3 * sweep * (1 - up);
      return;
    }
    if (d < 3.3) { const k = ease.smooth((d - 2.95) / 0.35); A[0] = lerp(-2.95, -0.3, k); V.hatUp = 0.125 * (1 - k); V.hatX = 0.05 * (1 - k); return; }
    if (d > 3.3) {                                                       // and then at his ease, a hand on his cane
      const it = d - 3.3; V.yaw = L.yawOut - 0.25 + 0.08 * Math.sin(it * 0.5); V.arms[0][0] = -0.45 + 0.08 * Math.sin(it * 2.2); V.arms[0][1] = -0.2;
      V.legs[1][0] = 0.25; V.legs[1][1] = 0.1; V.dy = -0.004;
      const rq = (t - (IDLE0 + 3)) / REPRISE, rt = (rq - Math.floor(rq)) * REPRISE;
      if (rq >= 0 && rt < 4 * BEAT) { const w = rt / BEAT * Math.PI; V.legs[0][0] = -0.9 * Math.max(0, Math.sin(w)); V.legs[0][2] = 1.5 * Math.max(0, Math.sin(w)); V.roll = 0.08 * Math.sin(w); }
    }
  },
  vhome(L, R, V) {
    const f = this.vfrom; rest(V, L, f ? f.u : -0.62, f ? f.out : -0.4); V.hat = 1;
    if (!f || !f.shown) { V.vis = false; return; }
    V.vis = true; V.yaw = f.yaw;
    if (R < 0.22) { const k = hump(R, 0, 0.22); V.arms[1][0] = -2.3 * k; V.hatUp = 0.04 * k; V.hatX = 0.02 * k; return; }
    const s = ease.inOut(clamp01((R - 0.22) / 0.74)), a = 1 - s, ex = 0.62, cu = (f.u + ex) / 2;
    V.u = a * a * f.u + 2 * a * s * cu + s * s * ex; V.out = a * a * f.out + 2 * a * s * 0.45 + s * s * -0.42;
    const du = 2 * a * (cu - f.u) + 2 * s * (ex - cu), dout = 2 * a * (0.45 - f.out) + 2 * s * (-0.42 - 0.45);
    V.yaw = turnTo(f.yaw, L.yawOf(du, dout), ramp(s, 0, 0.12));
    vwalkPose(V, R * 2.2 * 2 * Math.PI * 1.4, 1);
    if (s >= 1) V.vis = false;
  },

  // ---------------------------------------------------------- putting the pieces where the pose says
  place(L, d, P) {
    const r = this.rig, B = this.B, M = this.M;
    if (!P.vis) { if (d.shown) { for (const i of [d.body, ...d.gores, ...d.thighs, ...d.shins, ...d.arms]) r.show(i, false); d.shown = false; } return; }
    if (!d.shown) { for (const i of [d.body, ...d.gores, ...d.thighs, ...d.shins, ...d.arms]) r.show(i, true); d.shown = true; }
    const p = L.floor(P.u, P.out, this.T), yaw = P.yaw + P.spin;
    B.set(M[0], p.x, L.y + 0.002 + P.dy, p.z, yaw, 0, 0);                         // the root, on the floor between her feet
    B.child(M[1], M[0], 0, WAIST, 0, 0, P.lean, 0); r.mat(d.body, M[1]);           // the body leans from the waist
    for (let g = 0; g < GORES; g++) { const a = (g / GORES) * Math.PI * 2; B.child(M[2], M[0], Math.sin(a) * 0.05, WAIST, Math.cos(a) * 0.05, a, -P.gores[g], 0); r.mat(d.gores[g], M[2]); }
    for (let s = 0; s < 2; s++) {
      const sx = s ? 0.028 : -0.028, Lg = P.legs[s];
      B.child(M[3], M[0], sx, HIP, 0, 0, Lg[0], Lg[1]); r.mat(d.thighs[s], M[3]);
      B.child(M[4], M[3], 0, -THIGH, 0, 0, Lg[2], 0); r.mat(d.shins[s], M[4]);
      const A = P.arms[s];
      B.child(M[5], M[1], s ? SHX : -SHX, SHY - WAIST, 0, A[2], A[0], A[1]); r.mat(d.arms[s], M[5]);
    }
  },
  placeVal(L, V) {
    const r = this.rig, B = this.B, M = this.M, v = this.val, all = [v.body, v.hat, ...v.thighs, ...v.shins, ...v.arms];
    if (!V.vis) { if (v.shown) { for (const i of all) r.show(i, false); v.shown = false; } return; }
    if (!v.shown) { for (const i of all) r.show(i, true); v.shown = true; }
    const p = L.floor(V.u, V.out, this.T);
    B.set(M[0], p.x, L.y + 0.002 + V.dy, p.z, V.yaw, 0, V.roll);
    B.child(M[1], M[0], 0, V_HIP, 0, 0, V.lean, 0); r.mat(v.body, M[1]);
    for (let s = 0; s < 2; s++) {
      const Lg = V.legs[s];
      B.child(M[3], M[0], s ? 0.03 : -0.03, V_HIP, 0, 0, Lg[0], Lg[1]); r.mat(v.thighs[s], M[3]);
      B.child(M[4], M[3], 0, -V_THIGH, 0, 0, Lg[2], 0); r.mat(v.shins[s], M[4]);
      const A = V.arms[s];
      B.child(M[5], M[1], s ? 0.058 : -0.058, V_SHY - V_HIP, 0, A[2], A[0], A[1]); r.mat(v.arms[s], M[5]);
      if (s === 1) M[6].copy(M[5]);
    }
    // the hat: on his head, or in his hand (upside down to the arm, so that with the arm up it sits as on his head)
    if (V.hat) { B.child(M[2], M[1], V.hatX, V_SHY - V_HIP + 0.105 + V.hatUp, 0.004, 0, -0.04, 0); }
    else B.child(M[2], M[6], 0, -V_ARM - 0.012, 0.01, 0, Math.PI, 0);
    r.mat(v.hat, M[2]);
  },
});

// ------------------------------------------------------------------ poses
function newPose() { return { u: 0, out: 0, yaw: 0, spin: 0, dy: 0, lean: 0, roll: 0, legs: [[0, 0, 0], [0, 0, 0]], arms: [[0, 0, 0], [0, 0, 0]], gores: new Float32Array(GORES), vis: false, split: 0, hat: 1, hatUp: 0, hatX: 0 }; }
// Standing, facing out of the picture, holding her skirt a little out from her sides.
function rest(P, L, u, out) {
  P.u = u; P.out = out; P.yaw = L.yawOut; P.spin = 0; P.dy = 0; P.lean = 0; P.roll = 0; P.split = 0; P.hatUp = 0; P.hatX = 0;
  for (const g of P.legs) g.fill(0); P.legs[0][1] = -0.05; P.legs[1][1] = 0.05;
  P.arms[0][0] = -0.3; P.arms[0][1] = -0.28; P.arms[0][2] = 0; P.arms[1][0] = -0.3; P.arms[1][1] = 0.28; P.arms[1][2] = 0;
  P.gores.fill(0.14); P.gores[0] = 0.3; P.gores[1] = P.gores[5] = 0.24;
}
// A little bounce on the beat, skirts held.
function bounce(P, t) { const q = ((t - T0) / BEAT) % 1, k = 0.2 * (1 - Math.sin(Math.PI * q)); knees(P, k); P.arms[0][0] = P.arms[1][0] = -0.55; P.gores[0] = 0.55; P.gores[1] = P.gores[5] = 0.42; }
// Both knees bent by k, the hips let down to match (the feet stay on the floor).
function knees(P, k) { for (const g of P.legs) { g[0] = -k * 0.5; g[2] = k; } P.dy += -(THIGH + SHIN) * (1 - Math.cos(k * 0.5)); P.lean += k * 0.12; }
// One kick, phase q 0..1 of a beat: the knee up, the leg out straight and high, down again; the hands lift the skirt
// with it, the body leans back against it, and she rises on the other foot.
function kick(P, leg, q, high) {
  const up = q < 0.42 ? ease.out(q / 0.42) : 1 - ease.inOut((q - 0.42) / 0.58), K = P.legs[leg], S = P.legs[1 - leg];
  K[0] = -high * up; K[2] = q < 0.2 ? 1.1 * ease.smooth(q / 0.2) : q < 0.42 ? 1.1 * (1 - ease.out((q - 0.2) / 0.22)) : 0.18 * Math.sin(Math.PI * (q - 0.42) / 0.58);
  K[1] = (leg ? 0.12 : -0.12) * up;
  const sk = 0.24 * (1 - Math.sin(Math.PI * q)); S[0] = -sk * 0.5; S[2] = sk; S[1] = leg ? -0.04 : 0.04;
  P.dy = -(THIGH + SHIN) * (1 - Math.cos(sk * 0.5)) + 0.014 * Math.sin(Math.PI * q);
  P.lean = -0.13 * up;
  const lift = 0.35 + 0.95 * up * (high / 2.3);
  P.gores[0] = lift; P.gores[leg ? 1 : 5] = lift * 0.9; P.gores[leg ? 5 : 1] = 0.5 + 0.3 * up; P.gores[leg ? 2 : 4] = 0.25 + 0.3 * up;
  P.arms[0][0] = P.arms[1][0] = -(0.3 + lift * 0.62); P.arms[0][1] = -0.32; P.arms[1][1] = 0.32;
}
function run(P, w, k) {
  P.legs[0][0] = 0.6 * Math.sin(w) * k; P.legs[1][0] = -0.6 * Math.sin(w) * k;
  P.legs[0][2] = 1.0 * Math.max(0, -Math.cos(w)) * k; P.legs[1][2] = 1.0 * Math.max(0, Math.cos(w)) * k;
  P.dy = 0.012 * Math.abs(Math.sin(w)) * k; P.lean = 0.12 * k;
  P.arms[0][0] = P.arms[1][0] = -0.75; P.gores[0] = 0.75; P.gores[1] = P.gores[5] = 0.55;
}
function splits(P, k, t) {
  P.legs[0][1] = -1.52 * k; P.legs[1][1] = 1.52 * k; P.dy = -(HIP - 0.022) * k; P.split = k;
  P.arms[0][1] = -2.35 * k - 0.28 * (1 - k); P.arms[1][1] = 2.35 * k + 0.28 * (1 - k); P.arms[0][0] = P.arms[1][0] = -0.1 + 0.05 * Math.sin(t * 3);
  P.gores.fill(0.14 + 1.28 * k); P.gores[0] = 0.14 + 1.24 * k + 0.03 * Math.sin(t * 4); P.lean = 0.03 * Math.sin(t * 2);
}
// A curtsey: one foot back, both knees bent, the skirt held out at the sides, a bow of the head.
function curtsey(P, c, i) {
  const back = i % 2;
  P.legs[back][0] = 0.5 * c; P.legs[back][2] = 0.75 * c; P.legs[1 - back][0] = -0.3 * c; P.legs[1 - back][2] = 0.6 * c;
  P.dy = -0.045 * c; P.lean = 0.42 * c;
  P.arms[0][0] = -0.25; P.arms[1][0] = -0.25; P.arms[0][1] = -(0.3 + 0.75 * c); P.arms[1][1] = 0.3 + 0.75 * c;
  P.gores[1] = P.gores[2] = P.gores[4] = P.gores[5] = 0.18 + 0.62 * c; P.gores[0] = 0.25; P.gores[3] = 0.15;
}
// The gentleman's stroll: long legs, a loose bounce in it, the cane swinging.
function vwalk(pts) {
  const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal'), v = new THREE.Vector3(), d = new THREE.Vector3();
  return { at(s) { s = clamp01(s); c.getPointAt(s, v); c.getTangentAt(s, d); return { u: v.x, out: v.z, du: d.x, dout: d.z }; } };
}
function vwalkPose(V, w, k) {
  V.legs[0][0] = 0.55 * Math.sin(w) * k; V.legs[1][0] = -0.55 * Math.sin(w) * k;
  V.legs[0][2] = 1.1 * Math.max(0, Math.sin(w - 1.4)) * k; V.legs[1][2] = 1.1 * Math.max(0, Math.sin(w + Math.PI - 1.4)) * k;
  V.dy = 0.018 * Math.abs(Math.cos(w)) * k - 0.01 * k; V.lean = -0.08 * k; V.roll = 0.04 * Math.sin(w) * k;
  V.arms[0][0] = -0.4 * Math.sin(w) * k - 0.25; V.arms[1][0] = 0.3 * Math.sin(w) * k; V.arms[1][1] = 0.12;
}
