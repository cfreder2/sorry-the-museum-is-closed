// A toy trick line down the Nichols Bridgeway (features.js): somebody has clipped a plastic track set onto the real
// bridge. Down the east half of the deck, from the top: a start gate, a tabletop jump, a loop-the-loop, and a launch
// ramp that climbs out over the east railing and throws the car off the bridge onto a landing ramp in the park below.
// The west half stays clear, so the walk (and the sprint up it, wingplay.js) is never in the way of any of it. Five
// rings for the drone, over, under and through it all.
//
// It is one kind of track throughout, an original design: an orange ribbon a little wider than the car, a low rail
// along each edge, a joint with a connector tab every metre, and where it leaves the deck it stands on slim graphite
// trestles. Nothing else is coloured. Each length is straight along the bridge, laid at the deck's own height
// (bridgeway.js, museum.mw.deck) and cut into short plan surfaces, top and rails each, drawn exactly as they are felt.
import * as THREE from 'three';
import { feature } from './features.js';
import { Geo } from './geo.js';

const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
// One metre of track, the width of its running surface: orange, a little lighter down the middle, two faint guide ribs,
// and at the joint a dark seam and the tab that clips one piece to the next.
const trackTex = () => tex(128, 256, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#d9561a'); g.addColorStop(0.5, '#f57226'); g.addColorStop(1, '#d9561a');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (const f of [0.28, 0.72]) { c.fillStyle = 'rgba(110,30,0,0.22)'; c.fillRect(W * f - 1, 0, 2, H); c.fillStyle = 'rgba(255,205,160,0.22)'; c.fillRect(W * f + 1, 0, 1, H); }
  c.fillStyle = 'rgba(60,16,0,0.8)'; c.fillRect(0, 0, W, 2);
  c.fillStyle = 'rgba(255,190,140,0.35)'; c.fillRect(0, 2, W, 1);
  // the tab: a dovetail of the next piece lying in this one
  c.fillStyle = '#c24a12'; c.beginPath(); c.moveTo(W / 2 - 11, 3); c.lineTo(W / 2 + 11, 3); c.lineTo(W / 2 + 15, 20); c.lineTo(W / 2 - 15, 20); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(70,18,0,0.7)'; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = 'rgba(255,200,150,0.3)'; c.fillRect(W / 2 - 14, 20, 28, 1);
});
const checks = () => { const t = tex(64, 16, (c) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#15171b' : '#f2f2ee'; c.fillRect(i * 8, j * 8, 8, 8); } }); t.repeat.set(1, 1); return t; };

const TW = 0.5, RW = 0.022, RH = 0.022, TH = 0.03, FLAT = 0.02;      // running width, rail width and height, plank, how far a piece lying on the deck stands proud
const ORANGE = new THREE.Color('#ef6820').toArray(), RAIL = new THREE.Color('#ff7f30').toArray(), UNDER = new THREE.Color('#c4501a').toArray(), GRAPHITE = new THREE.Color('#2c3038').toArray();

feature({
  id: 'bridgeplay',
  secrets: [['bridgeloop', 'Loop the loop on the Bridgeway'], ['bridgegap', 'Off the Bridgeway']],
  init(k) {
    const mw = k.museum.mw, D = mw && mw.deck; if (!D) return;
    const P = k.plan, O = P.obstacles, S = P.surfaces, cx = D.cx, h = D.h;
    this.D = D;
    const tt = trackTex();
    const track = new THREE.MeshStandardMaterial({ map: tt, roughness: 0.38, emissiveMap: tt, emissive: 0xffffff, emissiveIntensity: 0.26 });
    const plastic = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4 });
    plastic.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * 0.3;'); };
    plastic.customProgramCacheKey = () => 'bridgeplay-plastic';
    const topG = new Geo(), bodyG = new Geo();

    // A quad with a normal at each corner, so a curve of short flat pieces is shaded as one smooth sweep.
    const quadN = (g, v, n, uv, col) => {
      const e1 = v[1].map((x, i) => x - v[0][i]), e2 = v[3].map((x, i) => x - v[0][i]), m = n[0].map((x, i) => x + n[1][i] + n[2][i] + n[3][i]);
      const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      let o = [0, 1, 2, 3]; if (cr[0] * m[0] + cr[1] * m[1] + cr[2] * m[2] < 0) o = [0, 3, 2, 1];
      const i0 = g.p.length / 3;
      for (const j of o) { g.p.push(...v[j]); g.n.push(...n[j]); g.uv.push(...(uv ? uv[j] : [0, 0])); if (col) g.c.push(...col); else if (g.c.length) g.c.push(1, 1, 1); }
      g.idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
    };
    const box = (col, x0, x1, y0, y1, z0, z1) => { bodyG.col = col; bodyG.box(x0, x1, y0, y1, z0, z1); };
    // A strut of square section t from a to b, at any slant.
    const strut = (col, a, b, t) => {
      const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(), u = new THREE.Vector3(1, 0, 0).cross(d);
      if (u.lengthSq() < 1e-6) u.set(0, 0, 1).cross(d);
      u.normalize().multiplyScalar(t / 2); const v = d.clone().cross(u);
      const c = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([i, j]) => [u.x * i + v.x * j, u.y * i + v.y * j, u.z * i + v.z * j]);
      for (let k = 0; k < 4; k++) {
        const p = c[k], q = c[(k + 1) % 4], n = new THREE.Vector3(p[0] + q[0], p[1] + q[1], p[2] + q[2]).normalize().toArray(), nn = [n, n, n, n];
        quadN(bodyG, [[a[0] + p[0], a[1] + p[1], a[2] + p[2]], [a[0] + q[0], a[1] + q[1], a[2] + q[2]], [b[0] + q[0], b[1] + q[1], b[2] + q[2]], [b[0] + p[0], b[1] + p[1], b[2] + p[2]]], nn, null, col);
      }
    };

    // A straight length of track along z at x = xc, from za to zb (either way), its top `rel(t)` above the deck for t
    // from 0 at za to 1 at zb (or above the ground, `ground: true`). `v0` is how far along the set it starts, so the
    // joints keep their metre. Returns its running surfaces, in order.
    const run = (xc, za, zb, rel, o = {}) => {
      const L = Math.abs(zb - za), n = o.n || Math.max(1, Math.ceil(L / (o.step || 0.25))), w2 = (o.w || TW) / 2, hw = w2 + RW, base = o.ground ? () => 0 : h;
      const pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n, z = za + (zb - za) * t; pts.push({ z, y: base(z) + rel(t), v: (o.v0 || 0) + L * t }); }
      // each point's normal: across the slope either side of it
      for (let i = 0; i <= n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], dz = b.z - a.z, dy = b.y - a.y, l = Math.hypot(dz, dy), sg = Math.sign(dz); pts[i].n = [0, Math.abs(dz) / l, -dy * sg / l]; }
      const segs = [];
      for (let i = 0; i < n; i++) {
        const A = pts[i], B = pts[i + 1], lo = A.z < B.z ? A : B, hi = A.z < B.z ? B : A;
        const s = { skin: 'ply', toy: true, x0: xc - w2, x1: xc + w2, z0: lo.z, z1: hi.z, axis: 'z', h0: lo.y, h1: hi.y, thick: TH };
        S.push(s); segs.push(s);
        S.push({ skin: 'ply', toy: true, x0: xc - hw, x1: xc - w2, z0: lo.z, z1: hi.z, axis: 'z', h0: lo.y + RH, h1: hi.y + RH, thick: TH + RH },
          { skin: 'ply', toy: true, x0: xc + w2, x1: xc + hw, z0: lo.z, z1: hi.z, axis: 'z', h0: lo.y + RH, h1: hi.y + RH, thick: TH + RH });
        const up = [A.n, A.n, B.n, B.n], dn = up.map(q => q.map(x => -x)), u0 = A.v, u1 = B.v;
        quadN(topG, [[xc - w2, A.y, A.z], [xc + w2, A.y, A.z], [xc + w2, B.y, B.z], [xc - w2, B.y, B.z]], up, [[0, u0], [1, u0], [1, u1], [0, u1]]);
        for (const sg of [-1, 1]) {
          const xi = xc + sg * w2, xo = xc + sg * hw, side = [[sg, 0, 0], [sg, 0, 0], [sg, 0, 0], [sg, 0, 0]], inn = side.map(q => q.map(x => -x));
          quadN(bodyG, [[xi, A.y, A.z], [xi, B.y, B.z], [xi, B.y + RH, B.z], [xi, A.y + RH, A.z]], inn, null, RAIL);                 // the rail's inner face
          quadN(bodyG, [[xi, A.y + RH, A.z], [xo, A.y + RH, A.z], [xo, B.y + RH, B.z], [xi, B.y + RH, B.z]], up, null, RAIL);        // its top
          quadN(bodyG, [[xo, A.y - TH, A.z], [xo, B.y - TH, B.z], [xo, B.y + RH, B.z], [xo, A.y + RH, A.z]], side, null, ORANGE);   // the outer edge, plank and rail
        }
        quadN(bodyG, [[xc - hw, A.y - TH, A.z], [xc + hw, A.y - TH, A.z], [xc + hw, B.y - TH, B.z], [xc - hw, B.y - TH, B.z]], dn, null, UNDER);
      }
      // the two ends
      for (const [E, sg] of [[pts[0], Math.sign(za - zb)], [pts[n], Math.sign(zb - za)]]) {
        const f = [[0, 0, sg], [0, 0, sg], [0, 0, sg], [0, 0, sg]];
        quadN(bodyG, [[xc - hw, E.y - TH, E.z], [xc + hw, E.y - TH, E.z], [xc + hw, E.y, E.z], [xc - hw, E.y, E.z]], f, null, ORANGE);
        for (const s2 of [-1, 1]) quadN(bodyG, [[xc + s2 * w2, E.y, E.z], [xc + s2 * hw, E.y, E.z], [xc + s2 * hw, E.y + RH, E.z], [xc + s2 * w2, E.y + RH, E.z]], f, null, RAIL);
      }
      segs.at = t => { const z = za + (zb - za) * t; return { z, y: base(z) + rel(t) }; };
      return segs;
    };
    // A trestle under the track at z: two legs at its edges and a crossbar under the plank; one leg in the middle where
    // the far edge is out over the railing. Felt as it is drawn, up to a hand's breadth under the plank: a wheel on the
    // climb above reaches a trestle's line before its axle does, and must not be stopped by what holds it up.
    const trestle = (xc, z, yTop, o = {}) => {
      const hw = (o.w || TW) / 2 + RW, y1 = yTop - TH, y0 = o.ground ? 0 : h(z), t = 0.012, legs = o.single ? [xc] : [xc - hw + t, xc + hw - t], cap = Math.max(y0 + 0.01, yTop - 0.13);
      for (const x of legs) { box(GRAPHITE, x - t, x + t, y0, y1 - 0.02, z - t, z + t); box(GRAPHITE, x - 0.035, x + 0.035, y0, y0 + 0.012, z - 0.035, z + 0.035); O.push({ x0: x - t, x1: x + t, z0: z - t, z1: z + t, y0, y1: Math.min(y1, cap) }); }
      box(GRAPHITE, xc - hw, xc + hw, y1 - 0.02, y1, z - t, z + t); const yb = Math.min(cap, y1 - 0.02); O.push({ x0: xc - hw, x1: xc + hw, z0: z - t, z1: z + t, y0: yb, y1: yb });
    };
    const flat = () => FLAT;

    // ---- the start: a short straight and a little gate over it, a chequered board on two graphite posts
    {
      const za = D.z1 - 2.2, zb = za - 2.2, xc = cx((za + zb) / 2) + 0.82;
      run(xc, za, zb, flat, { n: 1 });
      const z = za - 0.5, y = h(z) + FLAT, hw = TW / 2 + RW + 0.03, bar = y + 0.4;
      for (const s of [-1, 1]) { const x = xc + s * hw; box(GRAPHITE, x - 0.014, x + 0.014, h(z), bar + 0.1, z - 0.014, z + 0.014); O.push({ x0: x - 0.016, x1: x + 0.016, z0: z - 0.016, z1: z + 0.016, y0: h(z), y1: bar + 0.1 }); }
      const ch = new Geo(); ch.box(xc - hw + 0.014, xc + hw - 0.014, bar, bar + 0.09, z - 0.008, z + 0.008);
      const ct = checks(); ct.repeat.set(1, 1);
      k.group.add(ch.mesh(new THREE.MeshStandardMaterial({ map: ct, roughness: 0.6, emissive: 0xffffff, emissiveMap: ct, emissiveIntensity: 0.3 })));
      O.push({ x0: xc - hw, x1: xc + hw, z0: z - 0.01, z1: z + 0.01, y0: bar, y1: bar + 0.09 });
      this.gate = { x: xc, z, y };
    }

    // ---- the tabletop: up, along and down on trestles, open underneath. The ramps are steepest at the top, so it is
    // a kicker whichever way you come at it, and a landing that runs out flat.
    {
      const H = 0.3, z0 = D.z1 - 5.4, xc = cx(z0 - 2.4) + 0.88;
      const lens = [0.5, 1.2, 0.8, 1.4, 0.5], prof = [t => FLAT, t => FLAT + (H - FLAT) * (1 - Math.cos(t * Math.PI / 2)), t => H, t => H - (H - FLAT) * Math.sin(t * Math.PI / 2), t => FLAT];
      let z = z0, v = 0; const parts = [];
      lens.forEach((L, i) => { parts.push(run(xc, z, z - L, prof[i], { step: 0.2, v0: v, n: i === 0 || i === 4 ? 1 : 0 })); z -= L; v += L; });
      const up = parts[1], top = parts[2], down = parts[3];
      for (const [seg, t] of [[up, 0.62], [top, 0], [top, 1], [down, 0.42]]) { const q = seg.at(t); trestle(xc, q.z, q.y); }
      this.table = parts.flat();
    }

    // ---- the loop, on the deck, run along the bridge: in by one lane, out by the other (vehicles.js runs the car round
    // it). A ribbon of the same track, rails and all, its ends lying on the deck as lengths of straight; held up by two
    // graphite stands, one either side, each clipped to the ribbon where it stands upright.
    {
      const z = D.z0 + 72, y = h(z) + FLAT, r = 1.15, shift = 0.56, wd = TW, x = cx(z) + 0.6;
      const L = this.loop = { x, z, y, dir: -1, r, shift, w: wd, axis: 'z' };
      P.loops.push(L);
      // the way in and the way out, each running on a hand's breadth under the foot of the ribbon, so a car is still on
      // the track when it crosses the line where the loop takes it (either way round)
      run(x, z + 2.0, z - 0.12, flat, { n: 1, v0: 0 });
      run(x + shift, z + 0.12, z - 1.6, flat, { n: 1, v0: 0 });
      const N = 72, hw = wd / 2, at = th => [L.x + shift * th / (Math.PI * 2), y + r - r * Math.cos(th), L.z + L.dir * r * Math.sin(th)];
      const inward = th => [0, Math.cos(th), -L.dir * Math.sin(th)];
      const arc = 2 * Math.PI * r;
      for (let i = 0; i < N; i++) {
        const t0 = Math.PI * 2 * i / N, t1 = Math.PI * 2 * (i + 1) / N, a = at(t0), b = at(t1), na = inward(t0), nb = inward(t1);
        const off = (p, nn, d) => [p[0], p[1] - nn[1] * d, p[2] - nn[2] * d];      // d out from the running face, away from the middle
        const inN = [na, na, nb, nb], outN = inN.map(q => q.map(v => -v)), v0 = arc * i / N, v1 = arc * (i + 1) / N;
        quadN(topG, [[a[0] - hw, a[1], a[2]], [a[0] + hw, a[1], a[2]], [b[0] + hw, b[1], b[2]], [b[0] - hw, b[1], b[2]]], inN, [[0, v0], [1, v0], [1, v1], [0, v1]]);
        const ao = off(a, na, TH), bo = off(b, nb, TH);
        quadN(bodyG, [[ao[0] - hw - RW, ao[1], ao[2]], [ao[0] + hw + RW, ao[1], ao[2]], [bo[0] + hw + RW, bo[1], bo[2]], [bo[0] - hw - RW, bo[1], bo[2]]], outN, null, UNDER);
        for (const sg of [-1, 1]) {
          const ai = off(a, na, -RH), bi = off(b, nb, -RH), xi = sg * hw, xo = sg * (hw + RW), sd = [[sg, 0, 0], [sg, 0, 0], [sg, 0, 0], [sg, 0, 0]], si = sd.map(q => q.map(v => -v));
          quadN(bodyG, [[a[0] + xi, a[1], a[2]], [b[0] + xi, b[1], b[2]], [bi[0] + xi, bi[1], bi[2]], [ai[0] + xi, ai[1], ai[2]]], si, null, RAIL);
          quadN(bodyG, [[ai[0] + xi, ai[1], ai[2]], [bi[0] + xi, bi[1], bi[2]], [bi[0] + xo, bi[1], bi[2]], [ai[0] + xo, ai[1], ai[2]]], inN, null, RAIL);
          quadN(bodyG, [[ao[0] + xo, ao[1], ao[2]], [bo[0] + xo, bo[1], bo[2]], [bi[0] + xo, bi[1], bi[2]], [ai[0] + xo, ai[1], ai[2]]], sd, null, ORANGE);
        }
      }
      // The stands: where the ribbon is upright, a quarter of the way round (the west edge) and three quarters (the east),
      // a post with two splayed feet along the bridge and a clip that takes hold of the ribbon's edge.
      for (const [th, sg] of [[Math.PI / 2, -1], [Math.PI * 1.5, 1]]) {
        const p = at(th), ex = p[0] + sg * (hw + RW), px = ex + sg * 0.05, pz = p[2], yb = h(pz), yt = p[1] + 0.1, t = 0.016, F = 0.3, K = 0.42;
        box(GRAPHITE, px - t, px + t, yb, yt, pz - t, pz + t);
        O.push({ x0: px - t, x1: px + t, z0: pz - t, z1: pz + t, y0: yb, y1: yt });
        for (const dz of [-F, F]) {
          const fy = h(pz + dz);
          strut(GRAPHITE, [px, fy + 0.01, pz + dz], [px, yb + K, pz], 0.022);
          box(GRAPHITE, px - 0.03, px + 0.03, fy, fy + 0.012, pz + dz - 0.04, pz + dz + 0.04);
          for (let i = 0; i < 3; i++) { const f0 = i / 3, f1 = (i + 1) / 3, za = pz + dz * (1 - f0), zb = pz + dz * (1 - f1); O.push({ x0: px - 0.012, x1: px + 0.012, z0: Math.min(za, zb), z1: Math.max(za, zb), y0: Math.min(fy, yb), y1: yb + K * f1 }); }
        }
        box(GRAPHITE, Math.min(ex, px) - 0.01, Math.max(ex, px) + 0.01, p[1] - 0.02, p[1] + 0.02, pz - 0.04, pz + 0.04);      // the clip
      }
    }

    // ---- the launch: a length of track that curves up off the deck into a steady climb and runs out over the east
    // railing, so the car leaves the bridge from above the handrail and flies on into the park. The deck veers west
    // under it as it climbs, so its last trestles stand on one leg at its inner edge.
    {
      const zs = D.z0 + 62, xc = cx(zs) + 1.1, rise = 0.42, a = 0.6, len = 0.3 + 1.76 / rise, zl = zs - len;
      run(xc, zs + 2.0, zs, flat, { n: 1, v0: 0 });
      const rel = t => { const d = t * len; return FLAT + (d < a ? rise * d * d / (2 * a) : rise * (d - a / 2)); };
      this.spur = run(xc, zs, zl, rel, { step: 0.25, v0: 2.0 });
      this.spurSet = new Set(this.spur);
      for (const d of [0.9, 1.7, 2.5, 3.3, 4.1]) {
        const z = zs - d, y = h(z) + rel(d / len), outer = xc + TW / 2 + RW - cx(z);
        trestle(xc, z, y, { single: outer > 1.62 });
      }
      this.spurAt = { x: xc, z: zs, y: h(zs) + FLAT };
      // Below in the park: the landing ramp, long and straight, facing north, on trestles; and the track runs on a little
      // over the snow, so the car comes off it on something with grip.
      const LW = 1.5, lz0 = zs - 29, lz1 = zs - 9, lh = 2.6;
      this.ramp = run(xc, lz1, lz0, t => lh * (1 - t) + 0.02 * t, { w: LW, n: 1, ground: true, v0: 0 });
      this.rampSet = new Set(this.ramp);
      for (let i = 1; i < 8; i++) { const t = i / 8, z = lz1 + (lz0 - lz1) * t, y = lh * (1 - t) + 0.02 * t; if (y > 0.2) trestle(xc, z, y, { w: LW, ground: true }); }
      const out = run(xc, lz0, lz0 - 3, flat, { w: LW, n: 1, ground: true, v0: 20 });
      for (const s of out) this.rampSet.add(s);
      this.rampAt = { x: xc, z: (lz0 + lz1) / 2, y: 0 };
    }

    k.group.add(topG.mesh(track), bodyG.mesh(plastic));

    // ---- rings for the drone: over the jump, under the span over Monroe Street, through the loop, out along the
    // launch (the car's jump goes through that one too), and low under the deck near the foot.
    {
      const L = this.loop, zM = (P.grounds.monroe.z0 + P.grounds.monroe.z1) / 2, zs = this.spurAt.z;
      const spec = [
        { x: cx(D.z1 - 7.5) + 0.88, y: h(D.z1 - 7.5) + 1.6, z: D.z1 - 7.5, axis: 'z', r: 0.6 },
        { x: cx(zM), y: 4.6, z: zM, axis: 'z', r: 1.2 },
        { x: L.x + L.shift / 2, y: L.y + L.r, z: L.z, axis: 'x', r: L.r - 0.18, hidden: true },
        { x: this.spurAt.x, y: h(zs - 10) + 1.9, z: zs - 10, axis: 'z', r: 1.1 },
        { x: cx(D.z0 + 22), y: 1.0, z: D.z0 + 22, axis: 'z', r: 0.6 },
      ];
      // (the same as the rings under the sunshade, wingplay.js: amber until flown through, then green)
      this.mOff = new THREE.MeshStandardMaterial({ color: 0xffcf6a, emissive: 0xffa63a, emissiveIntensity: 0.9, roughness: 0.4 });
      this.mOn = new THREE.MeshStandardMaterial({ color: 0x8cf0a0, emissive: 0x3fd06a, emissiveIntensity: 1.0, roughness: 0.4 });
      this.rings = spec.map(q => {
        let m = null;
        if (!q.hidden) { m = new THREE.Mesh(new THREE.TorusGeometry(q.r, 0.045, 8, 40), this.mOff); m.position.set(q.x, q.y, q.z); if (q.axis === 'x') m.rotation.y = Math.PI / 2; m.matrixAutoUpdate = false; m.updateMatrix(); k.group.add(m); }
        return { ...q, m, done: false, side: 0 };
      });
    }

    this.zone = { x0: Math.min(cx(D.z0), cx(D.z1)) - 12, x1: Math.max(cx(D.z0), cx(D.z1)) + 12, z0: D.z0 - 10, z1: D.z1 + 3 };
    this.at = { x: cx(D.z1 - 4), y: h(D.z1 - 4), z: D.z1 - 4 };
    this.gap = 0; this.onLoop = false; this.lastTh = 0;
  },
  active(k) { const p = k.pos, z = this.zone; return !!z && p.x > z.x0 && p.x < z.x1 && p.z > z.z0 && p.z < z.z1; },
  update(dt, k) {
    const v = k.v, p = k.pos, car = v.kind === 'car';
    if (car && k.close(this.at, 3, 1.2)) k.once('bridgeplay', 'Toy track down the east side: a jump, a loop, and a ramp off the bridge.', 5);
    // The loop: all the way round and down on the wheels.
    if (car) {
      const mine = !!(v.rail && v.rail.L === this.loop);
      if (mine) { this.onLoop = true; this.lastTh = v.rail.th; const L = this.loop; k.camClose = { at: { x: L.x - 2.9, y: L.y + 1.6, z: L.z + 1.2 }, look: { x: L.x + L.shift / 2, y: L.y + L.r, z: L.z } }; }
      else if (this.onLoop) { this.onLoop = false; if (!v.air && this.lastTh > 5) { if (k.find('bridgeloop')) k.callout('LOOP THE LOOP'); k.synth.chime([659, 880, 1175]); } }
      // The jump off the bridge: from the launch ramp, through the air, wheels down on the ramp in the park.
      const onSpur = !v.air && v.on && this.spurSet.has(v.on);
      if (onSpur) this.gap = 1;
      else if (this.gap === 1 && v.air) this.gap = 2;
      else if (this.gap === 2 && !v.air) {
        const clean = this.rampSet.has(v.on) && !(v.landed && v.landed.crash);
        this.gap = 0;
        if (clean) { if (k.find('bridgegap')) k.callout('OFF THE BRIDGEWAY'); k.synth.chime([523, 784, 1047]); }
        else if (v.landed && !v.landed.crash) k.say('Land it on the ramp below.', 2.5);
      } else if (this.gap === 1 && !v.air) this.gap = 0;
    }
    // Rings: through each one, either way. The drone counts them all; the car can only reach the one off the launch.
    for (const r of this.rings) {
      const ax = r.axis === 'x', d = ax ? p.x - r.x : p.z - r.z, side = Math.sign(d), off = ax ? Math.hypot(p.y - r.y, p.z - r.z) : Math.hypot(p.y - r.y, p.x - r.x);
      if (!r.done && r.side && side && side !== r.side && off < r.r - 0.1 && Math.abs(d) < 1.5) {
        r.done = true; if (r.m) r.m.material = this.mOn;
        const n = this.rings.filter(q => q.done).length;
        k.synth.chime([587 * (1 + n * 0.2)], { dur: 0.7 });
        if (n === this.rings.length) { k.synth.chime([587, 740, 880, 1175]); k.callout('ALL FIVE RINGS'); }
        else k.say(`${n} of ${this.rings.length} rings.`, 1.5);
      }
      r.side = Math.abs(d) < 3 && off < r.r + 1.5 ? side || r.side : 0;      // (exactly in the plane counts as still on the side it came from)
    }
  },
  spots() {
    if (!this.at) return [];
    return [{ kind: 'secret', id: 'bridgeloop', name: 'Loop the loop on the Bridgeway', x: this.loop.x, y: this.loop.y, z: this.loop.z }, { kind: 'secret', id: 'bridgegap', name: 'Off the Bridgeway (launch ramp to the ramp below)', ...this.spurAt }];
  },
  reset() { this.gap = 0; this.onLoop = false; for (const r of this.rings || []) { r.done = false; r.side = 0; if (r.m) r.m.material = this.mOff; } },
});
