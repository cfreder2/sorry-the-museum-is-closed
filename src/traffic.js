// The traffic. It is late and there is not much of it: a few cars, a taxi or two, a pickup, the
// night bus down Michigan Avenue. They keep to their lanes and to the right, hold a gap to whatever
// is in front, slow for corners with an indicator going, and stop at the lights, which this file
// also runs. They stop for a toy car in the road, too, and after a while they say so.
//
// Every body here is made up: no make, no badge. Real size, though, which to a 46 cm toy is a lot.
//
// Streets, as plan.js lays them (north is -z, east is +x; everybody drives on the right):
//   Michigan Avenue and Lake Shore Drive run through, north to south, two lanes each way;
//   Monroe and Jackson run between them, one lane each way; Columbus Drive joins those two.

import * as THREE from 'three';
import { Geo } from './geo.js';
import { streetY } from './plan.js';
import * as TX from './textures.js';
import { trafficLanes, STOP_BACK, asphaltMaterial, paintMaterial } from './streetscape.js';

const CAP = 24, WANT = 15, NEAR = 235, FAR = 275;      // most there can be; how many we like; how far off they come and go
const EXT = 100;                                       // how far past the edge of the world the through roads carry on

// ------------------------------------------------------------------ bodies --

const GLASS = [0.07, 0.10, 0.15], DARK = [0.035, 0.037, 0.045], TRIM = [0.16, 0.17, 0.19], SNOW = [0.62, 0.68, 0.82], HUB = [0.42, 0.44, 0.48];
const LENS = [0.17, 0.18, 0.21], OFF = [0.2, 0.025, 0.02];        // a parked car's lamps, unlit
const HEAD = [2.6, 2.4, 1.9], TAIL = [0.5, 0.03, 0.02], STOP = [2.6, 0.12, 0.08], AMBER = [2.6, 1.3, 0.08], PLATE = [0.7, 0.7, 0.62];

// A solid with one outline (z along the car, y up) and a width that may change with height.
// `skin(i)` says which builder takes the face between corner i and the next, or null for none.
function prism(side, skin, prof, wAt) {
  const n = prof.length, P = (k, sx) => [sx * wAt(prof[k][1]), prof[k][1], prof[k][0]];
  let cz = 0, cy = 0; for (const p of prof) { cz += p[0] / n; cy += p[1] / n; }
  for (const sx of [-1, 1]) for (let i = 1; i < n - 1; i++) side.quad(P(0, sx), P(i, sx), P(i + 1, sx), P(i + 1, sx), [sx, 0, 0]);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, g = skin(i); if (!g) continue;
    let nz = prof[j][1] - prof[i][1], ny = -(prof[j][0] - prof[i][0]); const l = Math.hypot(nz, ny) || 1; nz /= l; ny /= l;
    if (nz * ((prof[i][0] + prof[j][0]) / 2 - cz) + ny * ((prof[i][1] + prof[j][1]) / 2 - cy) < 0) { nz = -nz; ny = -ny; }
    g.quad(P(i, -1), P(i, 1), P(j, 1), P(j, -1), [0, ny, nz]);
  }
}

// Two wheels on one axle, to be spun together. Light and dark wedges on the hub, so that the turning shows.
export function axle(r, hw) {
  const g = new Geo(), n = 12, w = 0.24;
  for (const sx of [-1, 1]) {
    const xo = sx * (hw + 0.02), xi = sx * (hw + 0.02 - w);
    for (let i = 0; i < n; i++) {
      const a0 = i / n * 6.2832, a1 = (i + 1) / n * 6.2832, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), am = (a0 + a1) / 2;
      g.col = DARK; g.quad([xi, r * s0, r * c0], [xo, r * s0, r * c0], [xo, r * s1, r * c1], [xi, r * s1, r * c1], [0, Math.sin(am), Math.cos(am)]);
      const h = r * 0.62;
      g.quad([xo, r * s0, r * c0], [xo, r * s1, r * c1], [xo, h * s1, h * c1], [xo, h * s0, h * c0], [sx, 0, 0]);
      g.col = i % 3 === 0 ? TRIM : HUB; g.quad([xo + sx * 0.004, 0, 0], [xo + sx * 0.004, h * s0, h * c0], [xo + sx * 0.004, h * s1, h * c1], [xo + sx * 0.004, h * s1, h * c1], [sx, 0, 0]);
    }
  }
  return g.build();
}

// What each kind is: its size, its outline, and its voice.
export const KINDS = {
  saloon: { len: 4.6, hw: 0.9, h: 1.43, r: 0.33, wb: [-1.42, 1.42], horn: [440, 554], acc: 2.0,
    body: [[-2.3, 0.3], [2.26, 0.3], [2.3, 0.56], [2.2, 0.76], [0.95, 0.93], [-1.35, 0.96], [-2.2, 0.9], [-2.3, 0.62]],
    cab: [[-1.75, 0.94], [1.0, 0.92], [0.3, 1.43], [-0.95, 1.43]], paints: [0x8b1e24, 0x1e3f6e, 0x4b5258, 0xb9bdc2, 0x1d1f24, 0x2f5a3c, 0x6d4a2a, 0xd8d8d2] },
  hatch: { len: 4.0, hw: 0.87, h: 1.47, r: 0.31, wb: [-1.22, 1.25], horn: [494, 622], acc: 2.2,
    body: [[-2.0, 0.3], [1.96, 0.3], [2.0, 0.55], [1.9, 0.76], [0.85, 0.93], [-1.9, 0.96], [-2.0, 0.7]],
    cab: [[-1.92, 0.95], [0.9, 0.92], [0.22, 1.47], [-1.6, 1.47]], paints: [0xc23a2a, 0x2a6f9e, 0xd9b23a, 0x8f969c, 0x3e7a4a, 0xe6e4dc, 0x7a3f8a] },
  suv: { len: 4.8, hw: 0.96, h: 1.78, r: 0.38, wb: [-1.45, 1.5], horn: [392, 494], acc: 1.8,
    body: [[-2.4, 0.36], [2.36, 0.36], [2.4, 0.7], [2.3, 0.98], [1.0, 1.1], [-2.3, 1.12], [-2.4, 0.8]],
    cab: [[-2.3, 1.1], [1.05, 1.08], [0.45, 1.78], [-2.05, 1.78]], paints: [0x23262b, 0x3b4a5c, 0x7a1f22, 0xa9adb1, 0x2e4a38, 0xe2e0d8] },
  pickup: { len: 5.4, hw: 0.98, h: 1.8, r: 0.4, wb: [-1.75, 1.75], horn: [349, 440], acc: 1.6,
    body: [[-2.7, 0.4], [2.66, 0.4], [2.7, 0.75], [2.6, 1.02], [1.35, 1.12], [-2.7, 1.12]],
    cab: [[-0.45, 1.1], [1.4, 1.1], [0.8, 1.8], [-0.35, 1.8]], bed: [-2.6, -0.55], paints: [0x8a1c1c, 0x2b3e57, 0xcfd0cc, 0x3a3d40, 0x1f5a66] },
  taxi: { like: 'saloon', horn: [466, 587], paints: [0xe0b21c], sign: true },
  bus: { len: 11.6, hw: 1.27, h: 3.1, r: 0.48, wb: [-3.4, 4.1], horn: [277, 330], acc: 1.1, bus: true,
    body: [[-5.8, 0.36], [5.7, 0.36], [5.8, 0.9], [5.72, 2.2], [5.5, 3.0], [5.2, 3.1], [-5.7, 3.1], [-5.8, 2.9]], paints: [0xe8e6de] },
};
for (const k in KINDS) if (KINDS[k].like) KINDS[k] = { ...KINDS[KINDS[k].like], ...KINDS[k] };

// The geometry of one kind: what is painted, everything else (glass, tyres, lamps, snow), and the lamps that come and go.
// `parked`: one standing in the street for the night (parked.js), lamps out, and no snow: it is under a blanket of its own.
export function build(K, { parked = false } = {}) {
  const paint = new Geo(), rest = new Geo(), stop = new Geo(), indL = new Geo(), indR = new Geo();
  const hw = K.hw, top = Math.max(...K.body.map(p => p[1])), zf = K.len / 2, zr = -K.len / 2;
  const wBody = y => hw - (y > top - 0.22 ? (y - top + 0.22) * 0.25 : 0) - (y < 0.45 ? 0.03 : 0);
  prism(paint, () => paint, K.body, wBody);
  // Bumpers, a grille, a number plate.
  rest.col = TRIM; rest.box(-hw + 0.02, hw - 0.02, 0.28, 0.5, zf - 0.06, zf + 0.07); rest.box(-hw + 0.02, hw - 0.02, 0.28, 0.5, zr - 0.07, zr + 0.06);
  rest.col = DARK; rest.box(-hw * 0.55, hw * 0.55, 0.5, K.bus ? 0.8 : 0.68, zf - 0.02, zf + 0.045);
  rest.col = PLATE; rest.box(-0.26, 0.26, 0.52, 0.66, zr - 0.045, zr - 0.02);
  // Lamps: two white at the front, two red at the back, amber at each corner.
  const ly = K.bus ? 0.95 : Math.min(top - 0.16, 0.8);
  for (const sx of [-1, 1]) {
    const x0 = sx * (hw - 0.36), x1 = sx * (hw - 0.07), a = Math.min(x0, x1), b = Math.max(x0, x1);
    rest.col = parked ? LENS : HEAD; rest.box(a, b, ly - 0.07, ly + 0.07, zf + 0.012, zf + 0.05);
    rest.col = parked ? OFF : TAIL; rest.box(a, b, ly - 0.03, ly + 0.11, zr - 0.05, zr - 0.012);
    stop.col = STOP; stop.box(a, b, ly - 0.03, ly + 0.11, zr - 0.062, zr - 0.05);
    const ind = sx > 0 ? indL : indR; ind.col = AMBER;
    const ia = Math.min(sx * (hw - 0.07), sx * (hw + 0.012)), ib = Math.max(sx * (hw - 0.07), sx * (hw + 0.012));
    ind.box(ia, ib, ly - 0.07, ly + 0.07, zf - 0.12, zf + 0.055); ind.box(ia, ib, ly - 0.03, ly + 0.11, zr - 0.062, zr + 0.1);
  }
  if (K.bus) { stop.col = STOP; stop.box(-0.3, 0.3, 2.86, 2.94, zr - 0.062, zr - 0.05); }
  // Arches over the wheels and a dark sill between them.
  rest.col = DARK;
  for (const z of K.wb) for (const sx of [-1, 1]) { const x = sx * (hw - 0.02), a = Math.min(x, x + sx * 0.035), b = Math.max(x, x + sx * 0.035); rest.box(a, b, 0.3, K.r * 2 + 0.1, z - K.r - 0.09, z + K.r + 0.09); }
  for (const sx of [-1, 1]) { const x = sx * (hw - 0.03), a = Math.min(x, x + sx * 0.03), b = Math.max(x, x + sx * 0.03); rest.box(a, b, 0.3, 0.42, K.wb[0] + K.r, K.wb[1] - K.r); }

  if (K.bus) {
    // A band of lit windows down each side, a windscreen, a destination blind, doors.
    const WARM = [0.95, 0.8, 0.5], y0 = 1.45, y1 = 2.5;
    for (const sx of [-1, 1]) {
      const x = sx * (hw + 0.004);
      rest.col = DARK; rest.quad([x, y0 - 0.06, zr + 0.5], [x, y0 - 0.06, zf - 1.2], [x, y1 + 0.06, zf - 1.2], [x, y1 + 0.06, zr + 0.5], [sx, 0, 0]);
      rest.col = WARM; for (let z = zr + 0.7; z < zf - 2.3; z += 1.45) rest.quad([x + sx * 0.004, y0, z], [x + sx * 0.004, y0, z + 1.25], [x + sx * 0.004, y1, z + 1.25], [x + sx * 0.004, y1, z], [sx, 0, 0]);
      rest.col = [0.1, 0.32, 0.75]; rest.box(Math.min(x, x + sx * 0.012), Math.max(x, x + sx * 0.012), 0.95, 1.14, zr + 0.3, zf - 0.6);        // a blue stripe
    }
    rest.col = GLASS; rest.quad([-hw + 0.12, 1.3, zf + 0.012], [hw - 0.12, 1.3, zf + 0.012], [hw - 0.2, 2.45, zf - 0.07], [-hw + 0.2, 2.45, zf - 0.07], [0, 0.07, 1]);
    rest.col = [1.8, 1.25, 0.25]; rest.quad([-0.8, 2.62, zf - 0.19], [0.8, 2.62, zf - 0.19], [0.8, 2.9, zf - 0.27], [-0.8, 2.9, zf - 0.27], [0, 0.25, 1]);
    rest.col = GLASS; for (const z of [zf - 1.9, -0.6]) rest.quad([-hw - 0.006, 0.5, z], [-hw - 0.006, 0.5, z + 0.95], [-hw - 0.006, 2.5, z + 0.95], [-hw - 0.006, 2.5, z], [-1, 0, 0]);     // doors, on the kerb side
    rest.col = SNOW; rest.box(-hw + 0.2, hw - 0.2, 3.1, 3.16, zr + 0.3, zf - 0.9);
    rest.col = TRIM; rest.box(-0.7, 0.7, 3.1, 3.3, -3.2, -1.4);                                                   // the unit on the roof
  } else {
    // The cabin: glass all round, pillars, a painted roof with snow on it.
    const cy0 = K.cab[0][1], cy1 = K.cab[2][1], wCab = y => hw - 0.08 - (y - cy0) / (cy1 - cy0) * 0.14;
    rest.col = GLASS; prism(rest, i => (i === 2 ? paint : i === 0 ? null : rest), K.cab, wCab);
    const zt0 = K.cab[3][0], zt1 = K.cab[2][0], wt = wCab(cy1);
    if (!parked) { rest.col = SNOW; rest.box(-wt + 0.07, wt - 0.07, cy1, cy1 + 0.05, zt0 + 0.08, zt1 - 0.08); }
    for (const sx of [-1, 1]) {                           // pillars: front, middle and back, leaning as the glass does
      const post = (za, zb, t) => paint.quad([sx * (wCab(cy0) + 0.006), cy0, za - t], [sx * (wCab(cy0) + 0.006), cy0, za + t], [sx * (wt + 0.006), cy1, zb + t], [sx * (wt + 0.006), cy1, zb - t], [sx, 0.2, 0]);
      post(K.cab[1][0] - 0.03, zt1 - 0.02, 0.05); post(K.cab[0][0] + 0.03, zt0 + 0.02, 0.06); post((K.cab[0][0] + K.cab[1][0]) / 2, (zt0 + zt1) / 2, 0.045);
      // door seams and a handle, a mirror
      const x = sx * (hw + 0.004), mz = (K.cab[0][0] + K.cab[1][0]) / 2;
      rest.col = DARK; for (const z of [mz, K.cab[1][0] - 0.25]) rest.quad([x, 0.44, z - 0.008], [x, 0.44, z + 0.008], [x, cy0 - 0.03, z + 0.008], [x, cy0 - 0.03, z - 0.008], [sx, 0, 0]);
      rest.col = TRIM; rest.quad([x, cy0 - 0.2, mz + 0.12], [x, cy0 - 0.2, mz + 0.3], [x, cy0 - 0.16, mz + 0.3], [x, cy0 - 0.16, mz + 0.12], [sx, 0, 0]);
      const ma = Math.min(sx * (hw - 0.06), sx * (hw + 0.16)), mb = Math.max(sx * (hw - 0.06), sx * (hw + 0.16)); paint.box(ma, mb, cy0, cy0 + 0.11, K.cab[1][0] - 0.2, K.cab[1][0] - 0.08);
    }
    // Snow that has stayed on the bonnet and the boot.
    if (!parked) { rest.col = SNOW; rest.box(-hw + 0.2, hw - 0.2, K.body[4][1] - 0.03, K.body[4][1] + 0.025, K.cab[1][0] + 0.25, K.cab[1][0] + 0.9); }
    if (K.bed) { rest.col = DARK; rest.box(-hw + 0.1, hw - 0.1, top - 0.02, top + 0.008, K.bed[0], K.bed[1]); if (!parked) { rest.col = SNOW; rest.box(-hw + 0.16, hw - 0.16, top + 0.008, top + 0.07, K.bed[0] + 0.1, K.bed[1] - 0.2); } paint.box(-hw, hw, top, top + 0.1, zr, zr + 0.06); for (const sx of [-1, 1]) paint.box(Math.min(sx * hw, sx * (hw - 0.07)), Math.max(sx * hw, sx * (hw - 0.07)), top, top + 0.1, zr, K.bed[1]); }
    if (K.sign) { rest.col = [2.2, 1.7, 0.3]; rest.box(-0.24, 0.24, cy1 + 0.05, cy1 + 0.19, (zt0 + zt1) / 2 - 0.09, (zt0 + zt1) / 2 + 0.09); rest.col = DARK; for (const sx of [-1, 1]) for (let z = -1.2; z < 0.9; z += 0.3) rest.quad([sx * (hw + 0.006), 0.62, z], [sx * (hw + 0.006), 0.62, z + 0.15], [sx * (hw + 0.006), 0.74, z + 0.15], [sx * (hw + 0.006), 0.74, z], [sx, 0, 0]); }
  }
  return { paint: paint.build(), rest: rest.build(), stop: stop.build(), indL: indL.build(), indR: indR.build(), axle: axle(K.r, hw - 0.02) };
}

// ------------------------------------------------------------------- roads --

// A way through: a line of points a couple of metres apart, with what is asked of a driver along it.
class Way {
  constructor() { this.x = []; this.z = []; this.cls = []; this.alt = []; this.cum = [0]; this.stops = []; this.turns = []; }
  get s() { return this.cum[this.cum.length - 1]; }
  _pt(x, z, cls, alt) { const n = this.x.length; if (n) this.cum.push(this.cum[n - 1] + Math.hypot(x - this.x[n - 1], z - this.z[n - 1])); this.x.push(x); this.z.push(z); this.cls.push(cls); this.alt.push(alt); }
  line(x, z, cls, alt = 0) {
    const n = this.x.length; if (!n) { this._pt(x, z, cls, alt); return; }
    const ax = this.x[n - 1], az = this.z[n - 1], d = Math.hypot(x - ax, z - az), k = Math.max(1, Math.ceil(d / 2.2));
    for (let i = 1; i <= k; i++) this._pt(ax + (x - ax) * i / k, az + (z - az) * i / k, cls, alt);
  }
  curve(cx, cz, x, z, side) {
    const n = this.x.length, ax = this.x[n - 1], az = this.z[n - 1], s0 = this.s;
    for (let i = 1; i <= 9; i++) { const t = i / 9, u = 1 - t; this._pt(u * u * ax + 2 * u * t * cx + t * t * x, u * u * az + 2 * u * t * cz + t * t * z, 2, 0); }
    this.turns.push({ s0, s1: this.s, side });
  }
  done() {
    for (const t of this.turns) for (let i = 0; i < this.x.length; i++) if (this.cum[i] > t.s0 - 38 && this.cum[i] < t.s1 + 12) this.alt[i] = 0;
    this.n = this.x.length; return this;
  }
}

// ----------------------------------------------------------------- traffic --

export class Traffic {
  constructor(museum, plan) {
    this.plan = plan; this.museum = museum; this.list = []; this.pool = {}; this.t = 0; this.spawnIn = 0; this.hornIn = 0; this.seed = 20261;
    this.stats = { spawned: 0, gone: 0, honks: 0, pushes: 0, ranRed: 0, late: 0, crossed: 0, unstuck: 0, held: 0 };
    const G = plan.grounds, B = plan.bounds, L = plan.lakefront, M = G.michigan;
    const bz0 = B.z0, bz1 = B.z1;
    this.ZN = bz0 - EXT; this.ZS = bz1 + EXT;
    // The lanes are streetscape.js's, so that the paint (streets.js) is laid where the traffic drives.
    const TL = trafficLanes(plan);
    this.NS = {
      mich: { x0: M.x0, x1: M.x1, z0: this.ZN, z1: this.ZS, thru: true, lanes: TL.ns.mich },
      col: { x0: G.columbus.x0, x1: G.columbus.x1, z0: G.monroe.z1, z1: G.jackson.z0, lanes: TL.ns.col },
    };
    if (L) this.NS.lsd = { x0: L.lsd.x0, x1: L.lsd.x1, z0: this.ZN, z1: this.ZS, thru: true, lanes: TL.ns.lsd };
    const ew = (id, q) => ({ id, z0: q.z0, z1: q.z1, zc: (q.z0 + q.z1) / 2, lanes: { 1: (q.z0 + q.z1) / 2 + TL.ew, [-1]: (q.z0 + q.z1) / 2 - TL.ew } });      // either side of the centre line: the kerbs have cars parked at them
    this.EW = [ew('monroe', G.monroe), ew('jackson', G.jackson)];
    for (const k in this.NS) { this.NS[k].id = k; this.NS[k].xc = (this.NS[k].x0 + this.NS[k].x1) / 2; }

    // ---- the lights: one set at every crossing, each with its own time
    this.sigs = {}; plan.signals = [];
    let k = 0;
    for (const n of Object.values(this.NS)) for (const w of this.EW) {
      const gNS = 18 + ((k * 5) % 9), gEW = 18 + ((k * 7 + 3) % 9), cyc = gNS + gEW + 9, off = (k * 11.7) % cyc, T = this;
      const sig = { id: `${n.id}-${w.id}`, x: n.xc, z: w.zc, gNS, gEW, cyc, off,
        phase() { return (T.t + off) % cyc; },
        state(key) { const p = this.phase(), a = key === 'ns' ? p : p - (gNS + 4.5), g = key === 'ns' ? gNS : gEW; return a < 0 ? 'red' : a < g ? 'green' : a < g + 3 ? 'amber' : 'red'; } };
      this.sigs[sig.id] = sig; plan.signals.push(sig); k++;
    }

    this.group = new THREE.Group(); this.group.name = 'traffic'; museum.group.add(this.group);
    this._roads(); this._heads();

    // ---- what the cars are made of
    this.geo = {}; for (const id in KINDS) if (!KINDS[id].like) this.geo[id] = build(KINDS[id]);
    this.geo.taxi = build(KINDS.taxi);
    this.restM = new THREE.MeshBasicMaterial({ vertexColors: true });
    this.lampM = new THREE.MeshBasicMaterial({ vertexColors: true });
    this.poolM = new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.5, 0.47, 0.36), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    this.poolG = new THREE.PlaneGeometry(1, 1); this.poolG.rotateX(-Math.PI / 2);
  }
  rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }

  // The through roads carried on past the edge of the world, so that nothing appears out of a snowfield.
  _roads() {
    const road = new Geo(), paint = new Geo(), P = this.plan, B = P.bounds;
    const flat = (g, x0, x1, z0, z1, y) => g.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, 1, 0], [[x0 / 4, z0 / 4], [x1 / 4, z0 / 4], [x1 / 4, z1 / 4], [x0 / 4, z1 / 4]]);
    for (const n of Object.values(this.NS)) {
      if (!n.thru) continue;
      const y = streetY(P, n.xc, 100);
      for (const [a, b] of [[this.ZN - 20, B.z0], [B.z1, this.ZS + 20]]) {
        flat(road, n.x0, n.x1, a, b, y + 0.004);          // (its lane lines are streets.js's, which paints them past the edge too)
      }
    }
    // Stop bars, fresh paint (UVs into the crisp half of streetscape.js's paint), short of the crosswalks.
    const bar = (x0, x1, z0, z1, y) => paint.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, 1, 0], [[0.05, x0 / 8], [0.05, x1 / 8], [0.45, x1 / 8], [0.45, x0 / 8]]);
    for (const a of this._approaches()) { const y = streetY(P, a.sx, a.sz) + 0.0062; if (a.key === 'ns') bar(a.l0 + 0.3, a.l1 - 0.3, a.sz - 0.22, a.sz + 0.22, y); else bar(a.sx - 0.22, a.sx + 0.22, a.l0 + 0.3, a.l1 - 0.3, y); }
    const rm = road.mesh(asphaltMaterial()), pm = paint.mesh(paintMaterial(false)); pm.renderOrder = -3;
    for (const m of [rm, pm]) { m.updateMatrix(); this.group.add(m); }
  }
  // Every way up to every crossing: where its stop line is, which lanes it spans, which way it faces.
  _approaches() {
    const out = [];
    for (const n of Object.values(this.NS)) for (const w of this.EW) {
      const sig = this.sigs[`${n.id}-${w.id}`];
      for (const d of [1, -1]) {                             // along the north-south street
        const entry = d > 0 ? w.z0 : w.z1; if ((entry - (d > 0 ? n.z0 : n.z1)) * d <= 1) continue;      // the street does not come from that side
        const xs = n.lanes[d], l0 = Math.min(n.xc, d > 0 ? n.x0 : n.x1), l1 = Math.max(n.xc, d > 0 ? n.x0 : n.x1);
        out.push({ sig, key: 'ns', d, sx: (xs[0] + xs[xs.length - 1]) / 2, sz: entry - d * STOP_BACK, l0, l1, hx: 0, hz: d, edge: d > 0 ? n.x0 : n.x1 });
      }
      for (const e of [1, -1]) {                             // along the cross street, which runs only between Michigan and the Drive
        if ((n.id === 'mich' && e > 0) || (n.id === 'lsd' && e < 0)) continue;
        const entry = e > 0 ? n.x0 : n.x1, l0 = Math.min(w.zc, e > 0 ? w.z1 : w.z0), l1 = Math.max(w.zc, e > 0 ? w.z1 : w.z0);
        out.push({ sig, key: 'ew', e, sx: entry - e * STOP_BACK, sz: w.lanes[e], l0, l1, hx: e, hz: 0, edge: e > 0 ? w.z1 : w.z0 });
      }
    }
    return out;
  }
  // A signal head for each approach: a black pole at the kerb, an arm out over the lanes, three lamps.
  _heads() {
    const P = this.plan, g = new Geo(), heads = [], grp = new THREE.Group(); grp.name = 'signals';
    for (const a of this._approaches()) {
      const ns = a.key === 'ns', out = ns ? Math.sign(a.edge - a.sx) : Math.sign(a.edge - a.sz);
      const px = ns ? a.edge + out * 0.7 : a.sx + a.hx * 1.2, pz = ns ? a.sz + a.hz * 1.2 : a.edge + out * 0.7, y = streetY(P, px, pz), H = 5.7;
      g.box(px - 0.09, px + 0.09, y, y + H + 0.3, pz - 0.09, pz + 0.09); g.box(px - 0.16, px + 0.16, y, y + 0.5, pz - 0.16, pz + 0.16);
      P.obstacles.push({ x0: px - 0.12, x1: px + 0.12, z0: pz - 0.12, z1: pz + 0.12, y0: y, y1: y + H });
      const hx = ns ? a.sx : px, hz = ns ? pz : a.sz;       // the head hangs over the middle of the lanes
      if (ns) g.box(Math.min(px, hx) - 0.05, Math.max(px, hx) + 0.05, y + H, y + H + 0.12, pz - 0.06, pz + 0.06); else g.box(px - 0.06, px + 0.06, y + H, y + H + 0.12, Math.min(pz, hz) - 0.05, Math.max(pz, hz) + 0.05);
      for (const [qx, qz, qy] of [[hx, hz, y + H - 1.05], [px + (ns ? -out * 0.3 : 0), pz + (ns ? 0 : -out * 0.3), y + 2.6]]) {
        g.box(qx - 0.24, qx + 0.24, qy - 0.06, qy + 1.16, qz - 0.24, qz + 0.24);
        if (ns) g.box(qx - 0.42, qx + 0.42, qy - 0.12, qy + 1.22, qz - a.hz * 0.2 - 0.02, qz - a.hz * 0.2 + 0.02); else g.box(qx - a.hx * 0.2 - 0.02, qx - a.hx * 0.2 + 0.02, qy - 0.12, qy + 1.22, qz - 0.42, qz + 0.42);      // a backboard, so the lamp shows against the city
        heads.push({ a, x: qx - a.hx * 0.25, y: qy, z: qz - a.hz * 0.25 });
      }
    }
    const pm = g.mesh(new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.5, emissive: 0x08090b, emissiveIntensity: 0.8 })); pm.updateMatrix(); grp.add(pm);
    const lamps = new THREE.InstancedMesh(new THREE.CircleGeometry(0.15, 14), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), heads.length * 3), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), c = new THREE.Color();
    heads.forEach((h, i) => { Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-h.a.hx, -h.a.hz)); for (let j = 0; j < 3; j++) { lamps.setMatrixAt(i * 3 + j, M.compose(new THREE.Vector3(h.x, h.y + 0.92 - j * 0.37, h.z), Q, one)); lamps.setColorAt(i * 3 + j, c.setRGB(0.05, 0.05, 0.05)); } });
    lamps.frustumCulled = false; grp.add(lamps);
    // A soft glow round whichever lamp is lit, and its colour thrown on the road beneath: what makes it read from a distance.
    const halo = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), heads.length * 2);
    halo.frustumCulled = false; halo.renderOrder = 6; grp.add(halo); this.halo = halo; this.group.add(grp);
    this.heads = heads; this.lamps = lamps; this.signalGroup = grp;
  }
  _lights() {
    const c = this._c || (this._c = new THREE.Color()); let dirty = false;
    const ON = [[2.6, 0.12, 0.08], [2.6, 1.5, 0.1], [0.15, 2.4, 0.6]], OFF = [[0.16, 0.02, 0.02], [0.16, 0.1, 0.02], [0.02, 0.14, 0.05]], IDX = { red: 0, amber: 1, green: 2 };
    this.heads.forEach((h, i) => {
      const st = h.a.sig.state(h.a.key); if (h.st === st) return; h.st = st; dirty = true;
      for (let j = 0; j < 3; j++) { const q = (IDX[st] === j ? ON : OFF)[j]; this.lamps.setColorAt(i * 3 + j, c.setRGB(q[0], q[1], q[2])); }
      if (this.halo) { const j = IDX[st], q = ON[j], M = this._hm || (this._hm = new THREE.Matrix4()), Q = this._hq || (this._hq = new THREE.Quaternion()), V = this._hv || (this._hv = new THREE.Vector3()), S = this._hs || (this._hs = new THREE.Vector3());
        Q.setFromAxisAngle(V.set(0, 1, 0), Math.atan2(-h.a.hx, -h.a.hz)); this.halo.setMatrixAt(i * 2, M.compose(V.set(h.x - h.a.hx * 0.03, h.y + 0.92 - j * 0.37, h.z - h.a.hz * 0.03), Q, S.set(1.5, 1.5, 1)));
        Q.setFromAxisAngle(V.set(1, 0, 0), -Math.PI / 2); const gy = streetY(this.plan, h.x, h.z) + 0.03; this.halo.setMatrixAt(i * 2 + 1, M.compose(V.set(h.x - h.a.hx * 2.2, gy, h.z - h.a.hz * 2.2), Q, S.set(h.y - gy > 3 ? 7 : 0.001, h.y - gy > 3 ? 7 : 0.001, 1)));
        this.halo.setColorAt(i * 2, c.setRGB(q[0] * 0.5, q[1] * 0.5, q[2] * 0.5)); this.halo.setColorAt(i * 2 + 1, c.setRGB(q[0] * 0.1, q[1] * 0.1, q[2] * 0.1)); this.halo.instanceMatrix.needsUpdate = true; if (this.halo.instanceColor) this.halo.instanceColor.needsUpdate = true; }
    });
    if (dirty && this.lamps.instanceColor) this.lamps.instanceColor.needsUpdate = true;
  }

  // ---- a route: in at one edge, a turn or two perhaps, out at another
  _route(bus) {
    const W = new Way(), R = () => this.rnd(), NS = this.NS, EWs = this.EW, cls = id => (id === 'col' ? 1 : 0);
    const starts = [['mich', 1], ['mich', -1]]; if (NS.lsd) starts.push(['lsd', 1], ['lsd', -1]);
    let [id, d] = bus ? starts[R() < 0.5 ? 0 : 1] : starts[Math.floor(R() * starts.length)];
    let turnsLeft = 4;
    // What somebody going d along street id from z will do next: nothing (run off the end), or turn at a cross street.
    const ahead = (id, d, z) => {
      const n = NS[id], cross = EWs.filter(w => (w.zc - z) * d > 0 && w.zc > n.z0 - 1 && w.zc < n.z1 + 1).sort((a, b) => (a.zc - b.zc) * d), pass = [];
      for (const w of cross) {
        const last = !n.thru && w === cross[cross.length - 1];
        const opts = id === 'mich' ? [1] : id === 'lsd' ? (d > 0 ? [-1] : []) : [1, -1];
        pass.push(w);
        if (last || (opts.length && !bus && turnsLeft > 0 && R() < 0.3)) { turnsLeft--; return { pass, at: w, e: opts[Math.floor(R() * opts.length)] }; }
      }
      return { pass, at: null };
    };
    const laneOf = (id, d, plan) => { const xs = NS[id].lanes[d]; return xs.length < 2 ? 0 : plan.at ? (plan.e === -d ? 0 : 1) : bus ? 0 : R() < 0.6 ? 0 : 1; };
    const altOf = (id, d, li) => { const xs = NS[id].lanes[d]; return xs.length < 2 ? 0 : (xs[1 - li] - xs[li]) * d; };
    let plan = ahead(id, d, d > 0 ? this.ZN : this.ZS), li = laneOf(id, d, plan), x = NS[id].lanes[d][li];
    W.line(x, d > 0 ? this.ZN : this.ZS, cls(id), altOf(id, d, li));
    for (let guard = 0; guard < 12; guard++) {
      // down the north-south street, through whatever crossings come first
      const n = NS[id], from = id; let turned = false;
      for (const w of plan.pass) {
        const entry = d > 0 ? w.z0 : w.z1;
        W.line(x, entry, cls(from), altOf(from, d, li));
        const st = { s: W.s - STOP_BACK, sig: this.sigs[`${from}-${w.id}`], key: 'ns', rect: null }; W.stops.push(st);
        if (w !== plan.at) continue;
        const e = plan.e, tz = w.lanes[e], left = e === d;
        if (left && n.thru) st.rect = { x0: Math.min(n.xc, d > 0 ? n.x1 : n.x0), x1: Math.max(n.xc, d > 0 ? n.x1 : n.x0), z0: d > 0 ? w.z0 : w.z0 - 48, z1: d > 0 ? w.z1 + 48 : w.z1 };
        W.curve(x, tz, e > 0 ? n.x1 : n.x0, tz, left ? 1 : -1);
        // along the cross street, to wherever it is left again
        const ex = e > 0 ? n.x1 : n.x0, nexts = Object.values(NS).filter(q => (q.xc - ex) * e > 1).sort((a, b) => (a.xc - b.xc) * e);
        for (const q of nexts) {
          const ent = e > 0 ? q.x0 : q.x1, end = q.thru;
          const d2 = q.id === 'col' ? (w.id === 'monroe' ? 1 : -1) : q.id === 'lsd' ? 1 : (R() < 0.5 ? 1 : -1);
          const take = end || (turnsLeft > 0 && R() < 0.4);
          W.line(ent, tz, 1, 0);
          const s2 = { s: W.s - STOP_BACK, sig: this.sigs[`${q.id}-${w.id}`], key: 'ew', rect: null }; W.stops.push(s2);
          if (!take) continue;
          if (!end) turnsLeft--;
          const left2 = d2 !== e;
          if (left2 && q.id === 'col') s2.rect = { x0: e > 0 ? q.x0 : q.x0 - 48, x1: e > 0 ? q.x1 + 48 : q.x1, z0: e > 0 ? w.z0 : w.zc, z1: e > 0 ? w.zc : w.z1 };
          id = q.id; d = d2; plan = ahead(id, d, w.zc); li = laneOf(id, d, plan); x = NS[id].lanes[d][li];
          W.curve(x, tz, x, d > 0 ? w.z1 : w.z0, left2 ? 1 : -1);
          turned = true; break;
        }
        if (!turned) return null;                            // nowhere to go: should not happen
        break;
      }
      if (!turned) { W.line(x, d > 0 ? NS[id].z1 : NS[id].z0, cls(id), altOf(id, d, li)); break; }
      if (W.stops.length > 14) return null;
    }
    if (W.x.length < 12) return null;
    return W.done();
  }

  // ---- one vehicle's worth of meshes, taken from the pool or made
  _body(kind) {
    const spare = (this.pool[kind] || (this.pool[kind] = [])).pop(); if (spare) return spare;
    const K = KINDS[kind], G = this.geo[kind], g = new THREE.Group(); g.rotation.order = 'YXZ';
    const paintM = new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.45, emissiveIntensity: 0.42 });
    const paint = new THREE.Mesh(G.paint, paintM), rest = new THREE.Mesh(G.rest, this.restM), stop = new THREE.Mesh(G.stop, this.lampM), indL = new THREE.Mesh(G.indL, this.lampM), indR = new THREE.Mesh(G.indR, this.lampM);
    const ax = K.wb.map(z => { const m = new THREE.Mesh(G.axle, this.restM); m.position.set(0, K.r, z); return m; });
    const pool = new THREE.Mesh(this.poolG, this.poolM); pool.scale.set(K.hw * 4.2, 1, 9); pool.position.set(0, 0.03, K.len / 2 + 3.6); pool.renderOrder = 4;
    g.add(paint, rest, stop, indL, indR, ...ax, pool);
    return { g, paintM, stop, indL, indR, ax, pool };
  }

  _pose(v, s, out) {
    const W = v.way; let i = v.i; if (i > W.n - 2) i = W.n - 2; while (i > 0 && W.cum[i] > s) i--; while (i < W.n - 2 && W.cum[i + 1] < s) i++;
    const seg = W.cum[i + 1] - W.cum[i] || 1, t = Math.max(0, Math.min(1, (s - W.cum[i]) / seg)), hx = (W.x[i + 1] - W.x[i]) / seg, hz = (W.z[i + 1] - W.z[i]) / seg;
    out.i = i; out.hx = hx; out.hz = hz; out.x = W.x[i] + (W.x[i + 1] - W.x[i]) * t + hz * v.off; out.z = W.z[i] + (W.z[i + 1] - W.z[i]) * t - hx * v.off;
    return out;
  }
  // Is there a vehicle within r of this spot (other than these)?
  _taken(x, z, r, skip) {
    for (const o of this.list) { if (o === skip) continue; for (let k = 0; k < o.nc; k++) { const dx = o.cx[k] - x, dz = o.cz[k] - z; if (dx * dx + dz * dz < (r + o.cr) * (r + o.cr)) return o; } }
    return null;
  }
  _circles(v) {
    const K = v.K, n = v.nc, span = K.len - 2 * v.cr;
    for (let k = 0; k < n; k++) { const a = n === 1 ? 0 : -span / 2 + span * k / (n - 1); v.cx[k] = v.x + v.hx * a; v.cz[k] = v.z + v.hz * a; }
  }

  // Put one on the road, if there is a place for it near enough to matter and far enough not to be seen arriving.
  spawn(px, pz, anywhere, forceKind) {
    if (this.list.length >= CAP) return null;
    const r = this.rnd(), kind = forceKind || (r < 0.07 ? 'bus' : r < 0.27 ? 'taxi' : r < 0.5 ? 'saloon' : r < 0.7 ? 'hatch' : r < 0.9 ? 'suv' : 'pickup');
    if (kind === 'bus' && this.list.some(o => o.kind === 'bus')) return null;
    const W = this._route(kind === 'bus'); if (!W) return null;
    // Places along it that will do: inside the circle, not in a corner, not just short of a light.
    const ok = i => { const s = W.cum[i]; if (W.cls[i] === 2 || i > W.n - 12) return false; for (const st of W.stops) if (s > st.s - 46 && s < st.s + 14) return false; return (W.x[i] - px) ** 2 + (W.z[i] - pz) ** 2 < NEAR * NEAR; };
    let at = -1;
    if (anywhere) { const c = []; for (let i = 2; i < W.n; i += 3) if (ok(i) && (W.x[i] - px) ** 2 + (W.z[i] - pz) ** 2 > 70 * 70) c.push(i); if (c.length) at = c[Math.floor(this.rnd() * c.length)]; }
    else for (let i = 2; i < W.n; i++) if (ok(i)) { at = i; break; }
    if (at < 0 || this._taken(W.x[at], W.z[at], 16, null)) return null;
    const K = KINDS[kind], B = this._body(kind);
    const v = { kind, K, way: W, i: at, s: W.cum[at], v: 0, off: 0, offT: 0, offEnd: 0, k: 0, x: 0, z: 0, y: 0, hx: 0, hz: 1, half: K.len / 2, cr: K.hw + 0.25, nc: K.bus ? 5 : 3, cx: [], cz: [], B,
      vBig: 9 + this.rnd() * 4, vSide: 7 + this.rnd() * 2, held: 0, heldP: 0, stuck: 0, horn: 2 + this.rnd() * 4, brake: false, spin: 0, age: 0, id: ++this.stats.spawned, lead: null, byPlayer: false, chain: false, ignore: null, ignoreT: 0 };
    if (K.bus) { v.vBig = 8.5; v.vSide = 7; }
    while (v.k < W.stops.length && W.stops[v.k].s < v.s + v.half) v.k++;
    const c = new THREE.Color(K.paints[Math.floor(this.rnd() * K.paints.length)]); B.paintM.color.copy(c); B.paintM.emissive.copy(c);
    const p = this._pose(v, v.s, {}); v.x = p.x; v.z = p.z; v.hx = p.hx; v.hz = p.hz; v.i = p.i; v.v = W.cls[at] === 0 ? v.vBig : v.vSide; this._circles(v);
    this.group.add(B.g); B.g.visible = true; this.list.push(v); this._place(v, 0);
    return v;
  }
  _remove(v) { const i = this.list.indexOf(v); if (i >= 0) this.list.splice(i, 1); v.B.g.visible = false; this.group.remove(v.B.g); this.pool[v.kind].push(v.B); this.stats.gone++; }
  clear() { for (const v of [...this.list]) this._remove(v); }

  _place(v, dt) {
    const P = this.plan, K = v.K, g = v.B.g, a = K.wb[1], b = K.wb[0];
    const rr = P.roadRelief || (() => 0);      // humps and washboard in the road (winterroads.js): the wheels ride over them
    const yf = streetY(P, v.x + v.hx * a, v.z + v.hz * a) + rr(v.x + v.hx * a, v.z + v.hz * a), yr = streetY(P, v.x + v.hx * b, v.z + v.hz * b) + rr(v.x + v.hx * b, v.z + v.hz * b);
    v.y = (yf + yr) / 2;
    g.position.set(v.x, v.y - (a + b) / 2 * (yf - yr) / (a - b), v.z);
    const yaw = Math.atan2(v.hx, v.hz); let dy = yaw - g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); g.rotation.y += dt > 0 ? dy * Math.min(1, dt * 9) : dy;
    g.rotation.x = -Math.atan2(yf - yr, a - b);
    v.spin += v.v * dt / K.r; for (const m of v.B.ax) m.rotation.x = v.spin;
    v.B.stop.visible = v.brake;
    const turn = v.way.turns.find(t => v.s > t.s0 - 42 && v.s < t.s1 + 1), side = turn ? turn.side : v.offT !== v.off ? Math.sign(v.offT - v.off) : 0, on = side !== 0 && (this.t * 1.5) % 1 < 0.55;
    v.B.indL.visible = on && side > 0; v.B.indR.visible = on && side < 0;
  }

  // The toy in the way of a vehicle: put it to one side if there is room, lift a drone over, or stop for it.
  _toy(v, G, sound) {
    const t = G.vehicle; if (!t || (G.state !== 'play' && G.state !== 'study')) return false;
    const p = t.pos, K = v.K, r = t.kind === 'drone' ? 0.34 : 0.3;
    if (p.y < v.y - 0.5 || p.y > v.y + K.h + 0.1) return false;
    const dx = p.x - v.x, dz = p.z - v.z, lz = dx * v.hx + dz * v.hz, lx = dx * v.hz - dz * v.hx;
    if (Math.abs(lx) >= K.hw + r || Math.abs(lz) >= v.half + r) return false;
    const moving = v.v > 0.6, free = (x, z) => {
      if (Math.abs(streetY(this.plan, x, z) - v.y) > 0.5) return false;
      for (const o of this.plan.obstacles) { if (p.y + 0.24 < o.y0 || p.y > o.y1) continue; if (x + r > o.x0 && x - r < o.x1 && z + r > o.z0 && z - r < o.z1) return false; }
      return !this._taken(x, z, r - 0.25, v);
    };
    const sideTo = sg => { const w = sg * (K.hw + r + 0.06) - lx; return [p.x + v.hz * w, p.z - v.hx * w]; };
    const endTo = sg => { const w = sg * (v.half + r + 0.06) - lz; return [p.x + v.hx * w, p.z + v.hz * w]; };
    const s0 = Math.sign(lx) || 1, e0 = Math.sign(lz) || 1;
    const sidePen = K.hw + r - Math.abs(lx), endPen = v.half + r - Math.abs(lz);
    const tries = moving || sidePen < endPen ? [sideTo(s0), sideTo(-s0), endTo(e0)] : [endTo(e0), sideTo(s0), sideTo(-s0)];
    for (const [x, z] of tries) if (free(x, z)) {
      const kx = x - p.x, kz = z - p.z, kl = Math.hypot(kx, kz) || 1;
      p.x = x; p.z = z;
      if (moving) { t.vel.x = kx / kl * 3.5 + v.hx * Math.min(3, v.v * 0.4); t.vel.z = kz / kl * 3.5 + v.hz * Math.min(3, v.v * 0.4); if (sound && sound.bump) sound.bump(0.7); this.stats.pushes++; }
      return false;
    }
    if (t.kind === 'drone') { p.y = v.y + K.h + 0.45; if (t.vel) t.vel.y = Math.max(t.vel.y || 0, 2.5); this.stats.pushes++; return false; }
    return lz > 0;                                         // nowhere to put it: if it is in front, wait
  }

  update(dt, G, sound, secrets) {
    const P = this.plan;
    if (!this.reg && secrets) { this.reg = true; secrets.add('traffic', 'Stopped the traffic on Michigan Avenue'); }
    dt = Math.min(dt, 0.1); this.t += dt; this._lights();
    const toy = G.vehicle, px = toy ? toy.pos.x : 0, pz = toy ? toy.pos.z : 0, py = toy ? toy.pos.y : 0;
    const live = toy && (G.state === 'play' || G.state === 'study') && !G.roomId;
    // Arrivals.
    if (!this.warm) { this.warm = true; for (let i = 0; i < 40 && this.list.length < 10; i++) this.spawn(px, pz, true); }
    this.spawnIn -= dt; if (this.spawnIn <= 0) { this.spawnIn = this.list.length < WANT ? 1.6 + this.rnd() * 2.5 : 5; if (this.list.length < WANT) this.spawn(px, pz, false); }
    this.hornIn -= dt;

    const q = this._q || (this._q = {}), ALT = 3.4;
    let near = 1e9, nearV = null, queued = 0;
    for (const v of [...this.list]) {
      const W = v.way, K = v.K; v.age += dt;
      // How fast the road lets it go, here and a little way on.
      let lim = W.cls[v.i] === 0 ? v.vBig : W.cls[v.i] === 1 ? v.vSide : 4.6;
      for (let i = v.i + 1; i < W.n && W.cum[i] - v.s < 46; i++) { const vm = W.cls[i] === 0 ? v.vBig : W.cls[i] === 1 ? v.vSide : (K.bus ? 3.6 : 4.6); const a = Math.sqrt(vm * vm + 2 * 2.2 * Math.max(0, W.cum[i] - v.s - v.half)); if (a < lim) lim = a; }
      let gap = 1e9, why = null;
      // The lights.
      const st = W.stops[v.k];
      if (st) {
        const d = st.s - (v.s + v.half), state = st.sig.state(st.key);
        if (d < -0.6) { this.stats.crossed++; if (state === 'red') { if (st.run) this.stats.late++; else { this.stats.ranRed++; this.lastRan = { id: v.id, sig: st.sig.id, key: st.key, v: v.v, d }; } } v.k++; }
        else {
          let go = state === 'green' || st.run;
          if (state === 'amber' && !st.run) { if (d < v.v * v.v / (2 * 3.4) - 0.5) { st.run = true; go = true; } }
          let giving = false;
          if (go && st.rect && !st.run && d < 30) { const R = st.rect; for (const o of this.list) if (o !== v && o.x > R.x0 && o.x < R.x1 && o.z > R.z0 && o.z < R.z1) { go = false; giving = true; break; } }
          if (go && state === 'green' && d < 3) st.run = true;          // over the line on green: carry on whatever happens next
          if (!go) { gap = Math.max(0, d - 0.4); why = giving ? 'yield' : 'light'; }
        }
      }
      // Whatever is in the way: another vehicle, or the toy.
      v.lead = null; v.byPlayer = false;
      const look = Math.min(48, Math.max(11, v.v * v.v / (2 * 3) + 9));
      if (v.ignoreT > 0) v.ignoreT -= dt;
      for (let a = v.half + 0.4; a < v.half + look; a += 2.1) {
        const p = this._pose(v, v.s + a, q); if (v.s + a > W.s) break;
        let o = this._taken(p.x, p.z, 0.95, v); if (o && v.ignoreT > 0 && o === v.ignore) o = null;
        if (o) { const g2 = a - v.half - 2.3; if (g2 < gap) { gap = Math.max(0, g2); why = 'car'; v.lead = o; } break; }
        if (live && (p.x - px) ** 2 + (p.z - pz) ** 2 < 1.3 * 1.3 && py > v.y - 0.6 && py < v.y + 1.7) { const g2 = a - v.half - 2.6; if (g2 < gap) { gap = Math.max(0, g2); why = 'toy'; v.byPlayer = true; } break; }
      }
      // And the toy, if it has been driven into the side of us.
      const blocked = this._toy(v, G, sound);
      if (blocked) { gap = 0; why = 'toy'; v.byPlayer = true; }
      const want = Math.min(lim, gap >= 1e8 ? 99 : Math.sqrt(2 * 3.2 * gap)), was = v.v;
      if (want > v.v) v.v = Math.min(want, v.v + (K.acc || 2) * dt); else v.v = Math.max(want, v.v - (gap < 2.5 ? 10 : 6.5) * dt);
      if (gap <= 0.05) v.v = 0;
      v.brake = v.v < 0.15 || was - v.v > 0.8 * dt;
      // Time spent waiting, and what comes of it.
      const stopped = v.v < 0.3;
      if (stopped && why === 'car') { v.held += dt; if (!(v.lead && v.lead.atLight)) v.stuck += dt; } else { v.held = 0; if (!stopped) v.stuck = 0; }
      if (stopped && why === 'toy') v.heldP += dt; else if (!v.byPlayer) v.heldP = 0;
      v.atLight = stopped && (why === 'light' || (why === 'car' && !!v.lead && !!v.lead.atLight));
      v.idle = stopped && !v.atLight ? (v.idle || 0) + dt : 0;                      // stood still with no light to blame
      v.chain = stopped && (why === 'toy' || (why === 'car' && v.lead && v.lead.chain));
      if (v.chain && v.x < this.NS.mich.x1 + 1) queued++;
      v.horn -= dt;
      if (stopped && v.horn <= 0 && this.hornIn <= 0 && ((why === 'toy' && v.heldP > 2.5) || (why === 'car' && v.held > 4 && v.lead && v.lead.idle > 3.5))) {
        v.horn = why === 'toy' ? 3.5 + this.rnd() * 2 : 7 + this.rnd() * 6; this.hornIn = 1.4; this.stats.honks++; this._horn(sound, this._vol(G, v), K);
      }
      // Round the toy, if there is another lane and it is empty.
      if (why === 'toy' && v.heldP > 8 && v.off === 0 && v.offT === 0 && W.alt[v.i] !== 0) {
        const al = Math.sign(W.alt[v.i]) * Math.min(Math.abs(W.alt[v.i]), 6.5); let clear = true;
        for (let a = -9; a <= 16 && clear; a += 2.5) { const p = this._pose(v, Math.max(0, v.s + a), q); if (this._taken(p.x + p.hz * al, p.z - p.hx * al, 1.3, v)) clear = false; }
        if (clear) { v.offT = al; v.offEnd = v.s + 26; this.stats.round = (this.stats.round || 0) + 1; }
      }
      if (v.offT !== 0 && v.s > v.offEnd && W.alt[v.i] !== 0) { let clear = true; const o0 = v.off; v.off = 0; for (let a = -6; a <= 12 && clear; a += 3) { const p = this._pose(v, v.s + a, q); if (this._taken(p.x, p.z, 1.2, v) || (live && (p.x - px) ** 2 + (p.z - pz) ** 2 < 4)) clear = false; } v.off = o0; if (clear) v.offT = 0; }
      if (v.off !== v.offT) { const dO = v.offT - v.off, stp = Math.min(Math.abs(dO), Math.max(0.4, v.v * 0.35) * dt); v.off += Math.sign(dO) * stp; if (v.off !== v.offT && v.v < 1.2 && why !== 'car') v.v = Math.min(1.6, v.v + 2 * dt); }
      // Two that have stopped for each other: the older gives way to nobody for a moment.
      if (v.stuck > 9 && v.lead && v.lead.lead === v && v.id < v.lead.id) { v.ignore = v.lead; v.ignoreT = 4; v.stuck = 0; this.stats.unstuck++; }
      if (v.stuck > 40 && (v.x - px) ** 2 + (v.z - pz) ** 2 > 60 * 60) { this._remove(v); continue; }
      // Along.
      v.s += v.v * dt;
      if (v.s >= W.s - 1) { this._remove(v); continue; }
      const p = this._pose(v, v.s, q); v.i = p.i; v.x = p.x; v.z = p.z; v.hx = p.hx; v.hz = p.hz; this._circles(v);
      const d2 = (v.x - px) ** 2 + (v.z - pz) ** 2;
      if (d2 > FAR * FAR && v.age > 3) { this._remove(v); continue; }
      this._place(v, dt);
      if (v.v > 1 && d2 < near) { near = d2; nearV = v; }
    }
    this.queued = queued;
    if (secrets && queued >= 3) secrets.find('traffic');
    this._hush(sound, nearV ? this._vol(G, nearV) * Math.min(1, nearV.v / 9) : 0);
  }

  // How loud a vehicle is to whoever is driving: nothing far off, little indoors, nothing indoors on another floor.
  _vol(G, v) {
    const p = G.vehicle ? G.vehicle.pos : null; if (!p || (G.state !== 'play' && G.state !== 'study')) return 0;
    let k = Math.max(0, 1 - Math.hypot(p.x - v.x, p.z - v.z, p.y - v.y) / 75); k *= k;
    if (G.roomId) k *= p.y > 3 || p.y < -2 ? 0 : 0.25;
    return k;
  }
  _horn(sound, vol, K) {
    this.lastHorn = { vol, hz: K.horn[0] };
    const c = sound && sound.ctx; if (!c || c.state !== 'running' || vol < 0.02) return;
    const t = c.currentTime, f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2300; const e = c.createGain(), dur = K.bus ? 0.7 : 0.32;
    const beats = K.bus || this.rnd() < 0.5 ? [[0, dur]] : [[0, 0.14], [0.2, 0.26]];
    e.gain.setValueAtTime(0, t);
    for (const [a, d] of beats) { e.gain.setValueAtTime(0, t + a); e.gain.linearRampToValueAtTime(0.085 * vol, t + a + 0.015); e.gain.setValueAtTime(0.085 * vol, t + a + d - 0.03); e.gain.linearRampToValueAtTime(0, t + a + d); }
    for (const hz of K.horn) { const o = c.createOscillator(); o.type = 'square'; o.frequency.value = hz; o.connect(f); o.start(t); o.stop(t + 0.8); }
    f.connect(e); e.connect(sound.dry); if (sound.send) e.connect(sound.send);
  }
  // Tyres on a wet road: one soft hiss, as loud as the nearest thing moving.
  _hush(sound, vol) {
    const c = sound && sound.ctx; if (!c || c.state !== 'running' || !sound.noise) return;
    if (!this.hush) { if (vol <= 0) return; const s = c.createBufferSource(); s.buffer = sound.noise; s.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.6; const e = c.createGain(); e.gain.value = 0; s.connect(f); f.connect(e); e.connect(sound.world || sound.dry); s.start(); this.hush = e; }      // (the world's: silent while a menu is up, audio.js quiet())
    this.hush.gain.setTargetAtTime(0.16 * vol, c.currentTime, 0.2);
  }
}
