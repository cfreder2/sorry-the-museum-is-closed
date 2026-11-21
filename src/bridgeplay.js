// A toy trick line down the Nichols Bridgeway (features.js): somebody has clipped a plastic track set onto the real
// bridge. Down the east half of the deck, from the top: a start gantry, a kicker, a loop-the-loop, a launch ramp that
// pokes out through the railing and throws the car off the bridge onto a landing ramp in the park below, a second
// kicker, and a balance rail. The west half stays clear, so the walk (and the sprint up it, wingplay.js) is never in
// the way of any of it. Five rings for the drone, over, under and through it all.
//
// Everything stands on the bridge's own walking line (bridgeway.js, museum.mw.deck): the deck's height and centre at
// any z. Each piece's top is a plan surface laid on it, drawn exactly as it is felt.
import * as THREE from 'three';
import { feature } from './features.js';
import { Geo } from './geo.js';

const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
// Toy track: orange, with yellow chevrons pointing down the run and a white edge line.
const chevrons = () => tex(64, 64, (c, w, h) => {
  c.fillStyle = '#ff6a12'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ffd21f'; c.beginPath(); c.moveTo(8, 10); c.lineTo(32, 34); c.lineTo(56, 10); c.lineTo(56, 26); c.lineTo(32, 50); c.lineTo(8, 26); c.closePath(); c.fill();
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, 4, h); c.fillRect(w - 4, 0, 4, h);
});
const stripes = () => tex(32, 32, (c, w, h) => { c.fillStyle = '#f4f4f4'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8252b'; c.fillRect(0, 0, w, h / 2); });
const checks = () => tex(64, 16, (c, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#111' : '#fafafa'; c.fillRect(i * 8, j * 8, 8, 8); } });

feature({
  id: 'bridgeplay',
  secrets: [['bridgeloop', 'Loop the loop on the Bridgeway'], ['bridgegap', 'Off the Bridgeway']],
  init(k) {
    const mw = k.museum.mw, D = mw && mw.deck; if (!D) return;
    const P = k.plan, O = P.obstacles, S = P.surfaces, cx = D.cx, h = D.h;
    this.D = D;
    // Materials: one each, few draw calls. Bright, and lit a little from within so it all reads at night.
    const chevT = chevrons(), strT = stripes();
    const track = new THREE.MeshStandardMaterial({ map: chevT, roughness: 0.5, emissiveMap: chevT, emissive: 0xffffff, emissiveIntensity: 0.32 });
    const plastic = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, emissive: 0xffffff, emissiveIntensity: 0.0 });
    plastic.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * 0.38;'); };
    const striped = new THREE.MeshStandardMaterial({ map: strT, roughness: 0.5, emissiveMap: strT, emissive: 0xffffff, emissiveIntensity: 0.3 });
    const led = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 1.3, 1.6), side: THREE.DoubleSide });
    const topG = new Geo(), sideG = new Geo(), ledG = new Geo();
    const RED = [0.92, 0.12, 0.14], BLUE = [0.1, 0.35, 0.95], YEL = [1, 0.8, 0.1], WHITE = [0.95, 0.95, 0.97];

    // A piece of track: a plan surface (axis z, linear) drawn as a top with chevrons and coloured sides down to `bot(z)`.
    // solid: down to the deck (a wall from the side); otherwise a plank `thick` deep that can be driven under.
    const piece = (x0, x1, z0, z1, h0, h1, o = {}) => {
      const s = { skin: 'ply', x0, x1, z0, z1, axis: 'z', h0, h1, toy: true, ...o.surf };
      if (o.thick) s.thick = o.thick; else s.base = o.base != null ? o.base : Math.min(h(z0), h(z1)) - 0.05;
      S.push(s);
      const top = z => h0 + (h1 - h0) * (z - z0) / (z1 - z0), bot = o.bot || (o.thick ? z => top(z) - o.thick : z => Math.min(top(z), h(z)) - 0.01);
      const L = z1 - z0, rep = o.rep || 1.1;
      (o.topG || topG).quad([x0, top(z0), z0], [x1, top(z0), z0], [x1, top(z1), z1], [x0, top(z1), z1], [0, 1, 0], [[0, L / rep], [1, L / rep], [1, 0], [0, 0]]);
      sideG.col = o.col || RED;
      for (const [x, n] of [[x0, -1], [x1, 1]]) sideG.quad([x, bot(z0), z0], [x, bot(z1), z1], [x, top(z1), z1], [x, top(z0), z0], [n, 0, 0]);
      for (const [z, n] of [[z0, -1], [z1, 1]]) if (top(z) - bot(z) > 0.02) sideG.quad([x0, bot(z), z], [x1, bot(z), z], [x1, top(z), z], [x0, top(z), z], [0, 0, n]);
      if (o.thick) sideG.quad([x0, bot(z0), z0], [x1, bot(z0), z0], [x1, bot(z1), z1], [x0, bot(z1), z1], [0, -1, 0]);
      // LED edging down both sides, toy style
      for (const x of [x0, x1]) ledG.quad([x, top(z0) + 0.005, z0], [x, top(z1) + 0.005, z1], [x, top(z1) - 0.03, z1], [x, top(z0) - 0.03, z0], [x === x0 ? -1 : 1, 0, 0]);
      return s;
    };
    const post = (x, z, y0, y1, r = 0.05, col = BLUE, obst = true) => { sideG.col = col; sideG.box(x - r, x + r, y0, y1, z - r, z + r); if (obst) O.push({ x0: x - r, x1: x + r, z0: z - r, z1: z + r, y0, y1 }); };
    // On the deck: a lane down its east half, from `rel` metres right of the centre line, at z. A piece runs straight (axis-aligned)
    // while the bridge drifts across it, so each is placed by where the deck is at its middle.
    const lane = (zc, a, b) => [cx(zc) + a, cx(zc) + b];

    // ---- the start gantry, near the top: two posts on the railings and a chequered banner across
    {
      const z = D.z1 - 4.5, y = h(z), c = cx(z), bar = y + 2.5;
      for (const s of [-1, 1]) post(c + s * 1.86, z, y, bar + 0.32, 0.06, YEL, false);
      O.push({ x0: c - 1.92, x1: c + 1.92, z0: z - 0.06, z1: z + 0.06, y0: bar, y1: bar + 0.32 });
      sideG.col = YEL; sideG.box(c - 1.92, c + 1.92, bar + 0.28, bar + 0.32, z - 0.06, z + 0.06);
      const ch = new Geo(); ch.box(c - 1.86, c + 1.86, bar, bar + 0.28, z - 0.04, z + 0.04);
      const cm = ch.mesh(new THREE.MeshStandardMaterial({ map: checks(), roughness: 0.6, emissive: 0xffffff, emissiveMap: checks(), emissiveIntensity: 0.35 }));
      cm.material.map.repeat.set(3, 1); k.group.add(cm);
      this.gantry = { z, y };
    }

    // ---- kickers: a toy tabletop, up, across and down, so it is a jump whichever way you come at it
    const table = (zc, H = 0.36, run = 1.3, flat = 1.1) => {
      const [x0, x1] = lane(zc, 0.38, 1.46), za = zc - flat / 2, zb = zc + flat / 2;
      const out = [
        piece(x0, x1, za - run, za, h(za - run), h(za) + H),
        piece(x0, x1, za, zb, h(za) + H, h(zb) + H, { col: BLUE }),
        piece(x0, x1, zb, zb + run, h(zb) + H, h(zb + run)),
      ];
      return out;
    };
    this.kickers = [table(D.z1 - 12), table(D.z0 + 42)];

    // ---- the loop, on the deck, run along the bridge: in by one lane, out by the other (vehicles.js runs the car round it)
    {
      const z = D.z0 + 72, y = h(z), r = 1.15, shift = 0.62, wd = 0.56, x = cx(z) + 0.48;
      const L = this.loop = { x, z, y, dir: -1, r, shift, w: wd, axis: 'z' };
      P.loops.push(L);
      const N = 56, at = th => [L.x + shift * th / (Math.PI * 2), y + r - r * Math.cos(th), L.z + L.dir * r * Math.sin(th)], hw = wd / 2;
      const ribbon = new Geo();
      for (let i = 0; i < N; i++) {
        const t0 = Math.PI * 2 * i / N, t1 = Math.PI * 2 * (i + 1) / N, a = at(t0), b = at(t1), tm = (t0 + t1) / 2, inward = [0, Math.cos(tm), -L.dir * Math.sin(tm)];
        ribbon.quad([a[0] - hw, a[1], a[2]], [a[0] + hw, a[1], a[2]], [b[0] + hw, b[1], b[2]], [b[0] - hw, b[1], b[2]], inward, [[0, i * 0.5], [1, i * 0.5], [1, (i + 1) * 0.5], [0, (i + 1) * 0.5]]);
        for (const sg of [-1, 1]) { const f = 0.05; ledG.quad([a[0] + sg * hw, a[1], a[2]], [b[0] + sg * hw, b[1], b[2]], [b[0] + sg * hw, b[1] + inward[1] * f, b[2] + inward[2] * f], [a[0] + sg * hw, a[1] + inward[1] * f, a[2] + inward[2] * f], [sg, 0, 0]); }
      }
      const rmat = track.clone(); rmat.side = THREE.DoubleSide; k.group.add(ribbon.mesh(rmat));
      // The frame it hangs from: four posts on the deck and a rail over the top.
      const T = y + 2 * r + 0.16, xa = L.x - 0.38, xb = L.x + 1.0;      // just clear of the ribbon, and as much of the walk left as can be
      for (const zz of [z - 1.45, z + 1.45]) for (const xx of [xa, xb]) post(xx, zz, h(zz), T + 0.07, 0.04, BLUE);
      sideG.col = BLUE;
      for (const xx of [xa, xb]) sideG.box(xx - 0.035, xx + 0.035, T, T + 0.07, z - 1.45, z + 1.45);
      for (const zz of [z - 1.45, z + 1.45]) sideG.box(xa, xb, T, T + 0.07, zz - 0.035, zz + 0.035);
      sideG.box(xa, xb, T - 0.1, T, z - 0.03, z + 0.03);
      O.push({ x0: xa, x1: xb, z0: z - 1.5, z1: z + 1.5, y0: T - 0.1, y1: T + 0.07 });
    }

    // ---- the launch: a ramp that climbs out through the east railing, so the car leaves the bridge from above the rail
    // and flies on into the park. Solid while it is over the deck, then a plank held off the deck on posts and a strut.
    {
      const zs = D.z0 + 62, len = 4.2, rise = 0.42, xc = cx(zs) + 1.1, x0 = xc - 0.45, x1 = xc + 0.45, zl = zs - len, zm = zs - 1.54;
      const rel = z => rise * (zs - z);
      this.spur = [
        piece(x0, x1, zm, zs, h(zm) + rel(zm), h(zs), { col: RED }),
        piece(x0, x1, zl, zm, h(zl) + rel(zl), h(zm) + rel(zm), { thick: 0.15, col: RED }),
      ];
      for (const zz of [zm - 0.25, zl + 0.3]) post(x0 + 0.06, zz, h(zz), h(zz) + rel(zz) - 0.15, 0.04, BLUE);
      // a strut from the lip down to the railing post it is clipped to
      sideG.col = BLUE; { const zz = zl + 0.15, ya = h(zz) + rel(zz) - 0.15; sideG.box(x1 - 0.06, x1, ya - 0.5, ya, zz - 0.03, zz + 0.03); }
      this.spurAt = { x: xc, z: zs, y: h(zs) };
      // Below in the park: the landing ramp, long and gentle, facing north.
      const lx0 = xc - 1.2, lx1 = xc + 1.2, lz0 = zs - 29, lz1 = zs - 9, lh = 2.6;
      this.ramp = piece(lx0, lx1, lz0, lz1, 0, lh, { base: 0, bot: () => 0, col: RED, rep: 1.4 });
      this.rampAt = { x: xc, z: (lz0 + lz1) / 2, y: 0 };
      // and the track runs on a little over the snow, so the car comes off it on something with grip
      P.decals.push({ x0: lx0 + 0.3, x1: lx1 - 0.3, z0: lz0 - 6, z1: lz0, y: 0, axis: 'z', dir: -1 });
      const run = new Geo(); run.quad([lx0 + 0.3, 0.012, lz0 - 6], [lx1 - 0.3, 0.012, lz0 - 6], [lx1 - 0.3, 0.012, lz0], [lx0 + 0.3, 0.012, lz0], [0, 1, 0], [[0, 6 / 1.1], [1, 6 / 1.1], [1, 0], [0, 0]]);
      const rmat = track.clone(); rmat.polygonOffset = true; rmat.polygonOffsetFactor = -2; rmat.polygonOffsetUnits = -2; k.group.add(run.mesh(rmat));
    }

    // ---- the balance rail, near the foot: a striped beam a car's width wide, a step up off the deck, ramps at each end
    {
      const zb = D.z0 + 26, len = 7, xm = cx(zb) + 0.42, hw = 0.2, rh = 0.3, za = zb - len, ra = 1.1;
      const beamTop = new Geo();
      this.beam = [
        piece(xm - 0.3, xm + 0.3, zb, zb + ra, h(zb) + rh, h(zb + ra), { col: BLUE }),      // (the deck drifts west under it going down: the beam ends 1.3 m right of the centre line)
        piece(xm - hw, xm + hw, za, zb, h(za) + rh, h(zb) + rh, { topG: beamTop, col: WHITE, rep: 0.4 }),
        piece(xm - hw, xm + hw, za - ra, za, h(za - ra), h(za) + rh, { col: BLUE }),
      ];
      const bm = beamTop.mesh(striped); k.group.add(bm);
    }

    k.group.add(topG.mesh(track), sideG.mesh(plastic), ledG.mesh(led));

    // ---- rings for the drone: over the start, under the span over Monroe Street, through the loop, out along the
    // launch (the car's jump goes through that one too), and low under the deck near the foot.
    {
      const L = this.loop, zM = (P.grounds.monroe.z0 + P.grounds.monroe.z1) / 2, zs = this.spurAt.z;
      const spec = [
        { x: cx(D.z1 - 9), y: h(D.z1 - 9) + 3.0, z: D.z1 - 9, axis: 'z', r: 0.9 },
        { x: cx(zM), y: 4.6, z: zM, axis: 'z', r: 1.2 },
        { x: L.x + L.shift / 2, y: L.y + L.r, z: L.z, axis: 'x', r: L.r - 0.18, hidden: true },
        { x: this.spurAt.x, y: h(zs - 10) + 1.9, z: zs - 10, axis: 'z', r: 1.1 },
        { x: cx(D.z0 + 22), y: 1.0, z: D.z0 + 22, axis: 'z', r: 0.6 },
      ];
      this.mOff = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 0.35, 1.2) });
      this.mOn = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 1.5, 0.6) });
      this.rings = spec.map(q => {
        let m = null;
        if (!q.hidden) { m = new THREE.Mesh(new THREE.TorusGeometry(q.r, 0.05, 8, 40), this.mOff); m.position.set(q.x, q.y, q.z); if (q.axis === 'x') m.rotation.y = Math.PI / 2; m.matrixAutoUpdate = false; m.updateMatrix(); k.group.add(m); }
        return { ...q, m, done: false, side: 0 };
      });
    }

    this.zone = { x0: Math.min(cx(D.z0), cx(D.z1)) - 12, x1: Math.max(cx(D.z0), cx(D.z1)) + 12, z0: D.z0 - 10, z1: D.z1 + 3 };
    this.at = { x: cx(D.z1 - 6), y: h(D.z1 - 6), z: D.z1 - 6 };
    this.gap = 0; this.onLoop = false; this.lastTh = 0;
  },
  active(k) { const p = k.pos, z = this.zone; return !!z && p.x > z.x0 && p.x < z.x1 && p.z > z.z0 && p.z < z.z1; },
  update(dt, k) {
    const v = k.v, p = k.pos, car = v.kind === 'car';
    if (car && k.close(this.at, 3, 1.2)) k.once('bridgeplay', 'A toy trick line down the east side: kickers, a loop, and a ramp off the bridge.', 5);
    // The loop: all the way round and down on the wheels.
    if (car) {
      const mine = !!(v.rail && v.rail.L === this.loop);
      if (mine) { this.onLoop = true; this.lastTh = v.rail.th; const L = this.loop; k.camClose = { at: { x: L.x - 2.9, y: L.y + 1.6, z: L.z + 1.2 }, look: { x: L.x + L.shift / 2, y: L.y + L.r, z: L.z } }; }
      else if (this.onLoop) { this.onLoop = false; if (!v.air && this.lastTh > 5) { if (k.find('bridgeloop')) k.callout('LOOP THE LOOP'); k.synth.chime([659, 880, 1175]); } }
      // The jump off the bridge: from the launch ramp, through the air, wheels down on the ramp in the park.
      if (!v.air && v.on && (v.on === this.spur[0] || v.on === this.spur[1])) this.gap = 1;
      else if (this.gap === 1 && v.air) this.gap = 2;
      else if (this.gap === 2 && !v.air) {
        const clean = v.on === this.ramp && !(v.landed && v.landed.crash);
        this.gap = 0;
        if (clean) { if (k.find('bridgegap')) k.callout('OFF THE BRIDGEWAY'); k.synth.chime([523, 784, 1047]); }
        else if (v.landed && !v.landed.crash) k.say('Land it on the ramp below.', 2.5);
      } else if (this.gap === 1 && !v.air && v.on !== this.spur[0] && v.on !== this.spur[1]) this.gap = 0;
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
