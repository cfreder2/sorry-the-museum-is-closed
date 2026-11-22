// A toy trick line down the Nichols Bridgeway (features.js): somebody has clipped the museum's orange toy track onto
// the real bridge. Down the east half of the deck, from the top: a start gate, a triple loop, and a launch ramp that
// climbs out over the east railing and throws the car off the bridge onto a landing ramp in the park below. The west
// half stays clear, so the walk (and the sprint up it, wingplay.js) is never in the way of any of it. Five rings for the
// drone, over, under and through it all.
//
// It is the same track as the loop and the track pieces indoors (museum.js): the orange track texture, an orange lip
// along each edge, cyan light down the edges of a loop, dark steel under it. Each length is straight along the bridge,
// laid at the deck's own height (bridgeway.js, museum.mw.deck) or level on trestles, and cut into short plan surfaces,
// top and lips each, drawn exactly as they are felt.
import * as THREE from 'three';
import { feature } from './features.js';
import { Geo } from './geo.js';

import { track as trackTexture } from './textures.js';

const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
const checks = () => { const t = tex(64, 16, (c) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#15171b' : '#f2f2ee'; c.fillRect(i * 8, j * 8, 8, 8); } }); t.repeat.set(1, 1); return t; };

const TW = 0.5, RW = 0.02, RH = 0.05, TH = 0.03, FLAT = 0.02;      // running width, lip width and height, plank, how far a piece lying on the deck stands proud
// (the lip is museum.js's rail colour, the steel its steel, a shade lifted so it reads against the night)
const ORANGE = new THREE.Color(0xd8581c).toArray(), RAIL = new THREE.Color(0xc8501a).toArray(), UNDER = new THREE.Color(0xa8441a).toArray(), GRAPHITE = new THREE.Color(0x24272c).toArray();

feature({
  id: 'bridgeplay',
  secrets: [['bridgeloop', 'Triple loop on the Bridgeway'], ['bridgegap', 'Off the Bridgeway']],
  init(k) {
    const mw = k.museum.mw, D = mw && mw.deck; if (!D) return;
    const P = k.plan, O = P.obstacles, S = P.surfaces, cx = D.cx, h = D.h;
    this.D = D;
    const tt = trackTexture();
    const track = new THREE.MeshStandardMaterial({ map: tt, roughness: 0.45, emissiveMap: tt, emissive: 0xffffff, emissiveIntensity: 0.3 });      // museum.js's track
    const plastic = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4 });
    plastic.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * 0.3;'); };
    plastic.customProgramCacheKey = () => 'bridgeplay-plastic';
    const topG = new Geo(), bodyG = new Geo(), ledG = new Geo();

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
    // the far edge is out over the railing. Felt as it is drawn, up to a foot under the plank: a wheel on the
    // climb above reaches a trestle's line before its axle does (and a frame or two before the car has risen to
    // where it is), and must not be stopped by what holds it up.
    const trestle = (xc, z, yTop, o = {}) => {
      const hw = (o.w || TW) / 2 + RW, y1 = yTop - TH, y0 = o.ground ? 0 : h(z), t = 0.012, legs = o.single ? [xc] : [xc - hw + t, xc + hw - t], cap = Math.max(y0 + 0.01, yTop - 0.28);
      for (const x of legs) { box(GRAPHITE, x - t, x + t, y0, y1 - 0.02, z - t, z + t); box(GRAPHITE, x - 0.035, x + 0.035, y0, y0 + 0.012, z - 0.035, z + 0.035); O.push({ x0: x - t, x1: x + t, z0: z - t, z1: z + t, y0, y1: Math.min(y1, cap) }); }
      box(GRAPHITE, xc - hw, xc + hw, y1 - 0.02, y1, z - t, z + t); const yb = Math.min(cap, y1 - 0.02); O.push({ x0: xc - hw, x1: xc + hw, z0: z - t, z1: z + t, y0: yb, y1: yb });
    };
    const flat = () => FLAT;

    // ---- the triple loop: three loops in a row down the bridge, on a level run of track so a car comes out of one onto
    // the flat and straight into the next. The ways in and out swap lanes from loop to loop (vehicles.js takes a loop
    // in either lane, either way round), so the three sit in two lanes: in by the east lane, out of the first by the
    // west, out of the second by the east, out of the last by the west and down a ramp to the deck. The deck falls away
    // under the level run, so it stands on trestles and the last two loops on dark steel blocks. Each ribbon is the
    // track taken right round, lipped both sides, cyan light down its edges, its foot clamped to the run.
    {
      const r = 0.85, wd = 0.42, hw = wd / 2, s = 0.48, gapZ = 2 * r + 0.25, z1 = D.z0 + 90, x0 = cx(z1) + hw + RW + 0.04, y = h(z1) + FLAT;
      const zs = [z1, z1 - gapZ, z1 - 2 * gapZ], dirs = [1, -1, 1];
      this.loops = zs.map((z, i) => { const L = { x: x0, z, y, dir: dirs[i], r, shift: s, w: wd, axis: 'z' }; P.loops.push(L); return L; });
      this.loop = this.loops[1];
      const level = () => y, o = { w: wd, ground: true };
      // the way in (east lane, on the deck), the level runs between the loops (west, then east), the way out (west). Each
      // runs on half a metre under the foot of the loop it meets, so a fast car on a slow frame is still on the track
      // when it crosses the line where the loop takes it. (Not the first run's head: there the deck stands above the level.)
      run(x0 + s, z1 + 3, z1 - 0.5, flat, { w: wd, n: 1, v0: 0 });
      const runs = [];
      for (let i = 0; i < 2; i++) runs.push(run(i ? x0 + s : x0, zs[i] + (i ? 0.5 : 0.12), zs[i + 1] - 0.5, level, { ...o, n: 1, v0: 0 }));
      const zo = zs[2] - 0.7, zd = zo - 3.2;
      runs.push(run(x0, zs[2] + 0.5, zo, level, { ...o, n: 1, v0: 0 }));
      run(x0, zo, zd, t => { const z = zo + (zd - zo) * t; return y + (h(z) + FLAT - y) * t; }, { ...o, n: 1, v0: 0.82 });      // (straight: a crest part way up would throw a climbing car into the climb ahead)
      // what holds it up: trestles under the runs, a block under each raised loop's foot
      for (const seg of runs) for (const t of [0.25, 0.75]) { const z = seg[0].z0 + (seg[0].z1 - seg[0].z0) * t, xc = (seg[0].x0 + seg[0].x1) / 2; if (y - h(z) > 0.07) trestle(xc, z, y, { w: wd }); }
      { const z = zo - 0.9; if (y - h(z) > 0.07) trestle(x0, z, y + (h(z) + FLAT - y) * 0.9 / 3.2, { w: wd }); }
      for (const L of this.loops) {
        const xa = x0 - hw - RW, xb = x0 + s + hw + RW, yb = h(L.z), yt = y - TH, cap = Math.max(yb + 0.01, y - 0.28);
        box(GRAPHITE, xa, xb, yb, yt, L.z - 0.07, L.z + 0.07);
        if (yt - yb > 0.02) O.push({ x0: xa, x1: xb, z0: L.z - 0.07, z1: L.z + 0.07, y0: yb, y1: Math.min(yt, cap) });
      }
      // the ribbons, as a car going down the bridge rides them
      const N = 64, arc = 2 * Math.PI * r, led = 0.012;
      for (const L of this.loops) {
        const rev = L.dir > 0, at = th => { const f = th / (Math.PI * 2); return [L.x + s * (rev ? 1 - f : f), y + r - r * Math.cos(th), L.z - r * Math.sin(th)]; };
        const inward = th => [0, Math.cos(th), Math.sin(th)];
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
            // the cyan light along the lip, on its inner face, as on the loop indoors
            const la = off(a, na, -RH * 0.55), lb = off(b, nb, -RH * 0.55), lx = xi - sg * 0.002;
            quadN(ledG, [[ai[0] + lx, ai[1], ai[2]], [bi[0] + lx, bi[1], bi[2]], [lb[0] + lx, lb[1], lb[2]], [la[0] + lx, la[1], la[2]]], si, null);
          }
        }
      }
      // the start, at the head of the way in: a chequered board across it on two steel posts
      {
        const xc = x0 + s, z = z1 + 2.6, yb = h(z), y0 = yb + FLAT, gw = hw + RW + 0.03, bar = y0 + 0.4;
        for (const sg of [-1, 1]) { const x = xc + sg * gw; box(GRAPHITE, x - 0.014, x + 0.014, yb, bar + 0.1, z - 0.014, z + 0.014); O.push({ x0: x - 0.016, x1: x + 0.016, z0: z - 0.016, z1: z + 0.016, y0: yb, y1: bar + 0.1 }); }
        const ch = new Geo(); ch.box(xc - gw + 0.014, xc + gw - 0.014, bar, bar + 0.09, z - 0.008, z + 0.008);
        const ct = checks(); ct.repeat.set(0.75, 1);
        k.group.add(ch.mesh(new THREE.MeshStandardMaterial({ map: ct, roughness: 0.6, emissive: 0xffffff, emissiveMap: ct, emissiveIntensity: 0.3 })));
        O.push({ x0: xc - gw, x1: xc + gw, z0: z - 0.01, z1: z + 0.01, y0: bar, y1: bar + 0.09 });
        this.gate = { x: xc, z, y: y0 };
      }
      this.tripleAt = { x: x0 + s / 2, z: zs[1], y };
      void led;
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

    k.group.add(topG.mesh(track), bodyG.mesh(plastic), ledG.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.22, 1.25, 1.45), side: THREE.DoubleSide })));      // (museum.js's led)

    // ---- rings for the drone: over the top of the line, under the span over Monroe Street, through the loop, out along the
    // launch (the car's jump goes through that one too), and low under the deck near the foot.
    {
      const L = this.loops[1], zM = (P.grounds.monroe.z0 + P.grounds.monroe.z1) / 2, zs = this.spurAt.z;
      const spec = [
        { x: cx(D.z1 - 4) + 0.8, y: h(D.z1 - 4) + 1.4, z: D.z1 - 4, axis: 'z', r: 0.5 },
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
    this.at = { x: this.gate.x, y: this.gate.y, z: this.gate.z + 1.5 };
    this.gap = 0; this.cur = null; this.lastTh = 0; this.seq = []; this.seqT = 0; this.t = 0;
  },
  active(k) { const p = k.pos, z = this.zone; return !!z && p.x > z.x0 && p.x < z.x1 && p.z > z.z0 && p.z < z.z1; },
  update(dt, k) {
    const v = k.v, p = k.pos, car = v.kind === 'car';
    if (car && k.close(this.at, 3, 1.2)) k.once('bridgeplay', 'Toy track down the east side: a triple loop, and a ramp off the bridge.', 5);
    this.t += dt;
    // The loops: each all the way round and down on the wheels, and the three one after another for the secret.
    if (car) {
      const L = v.rail && this.loops.includes(v.rail.L) ? v.rail.L : null;
      if (L) { this.cur = L; this.lastTh = v.rail.th; const M = this.loops[1]; k.camClose = { at: { x: M.x - 3.3, y: M.y + 1.4, z: M.z + 0.6 }, look: { x: M.x + M.shift / 2, y: M.y + M.r * 0.8, z: M.z } }; }
      else if (this.cur) {
        const i = this.loops.indexOf(this.cur), q = this.seq;
        this.cur = null;
        if (!v.air && this.lastTh > 5) {
          if (q.length && Math.abs(q[q.length - 1] - i) === 1 && this.t - this.seqT < 2.5) q.push(i); else q.splice(0, q.length, i);
          this.seqT = this.t;
          if (q.length === 3) { if (k.find('bridgeloop')) k.callout('TRIPLE LOOP'); k.synth.chime([659, 880, 1175, 1568]); q.length = 0; }
          else k.synth.chime([523 * (1 + q.length * 0.25)], { dur: 0.5 });
        } else q.length = 0;
      }
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
    return [{ kind: 'secret', id: 'bridgeloop', name: 'Triple loop on the Bridgeway (all three in one go)', ...this.tripleAt }, { kind: 'secret', id: 'bridgegap', name: 'Off the Bridgeway (launch ramp to the ramp below)', ...this.spurAt }];
  },
  reset() { this.gap = 0; this.cur = null; if (this.seq) this.seq.length = 0; for (const r of this.rings || []) { r.done = false; r.side = 0; if (r.m) r.m.material = this.mOff; } },
});
