#!/usr/bin/env node
// Makes data/pvs.json: for every room, and every square of the grounds, the bins (rooms, squares of the grid, big
// single things: see src/visible.js) that can be seen from anywhere in it. Run it again whenever the plan, or anything
// that stands in the world, changes: the table carries plan.made and the number of rooms, and src/visible.js hides
// nothing if they do not match.
//   node tools/dev/pvs.mjs <port> [out file, default data/pvs.json] [metres between sample points indoors, default 5]
// Serve the repo first with tools/dev/serve.py. Takes about twenty minutes (it is the reading back of some 130,000
// small pictures that takes the time).
//
// How. The park's features that are only built when the toy first comes near (features.js, `lazy`) are woken, so that
// everything stands. Whatever moves in three seconds of watching (trains, traffic) is left out. Then, from points all
// over each room (a grid, 0.4 m in from the walls, at a toy's camera height and up by the ceiling), in every doorway
// (counted for the rooms on both sides), and all over each square of the grounds, the world is drawn six ways with
// each thing in the flat colour of its bin, in two kinds:
//   solid     a plain solid mesh that was on show: it hides what is behind it, as in the game;
//   stipple   everything else: glass and other see-through things, textures with holes cut in them (railings, leaves),
//             lines and points, whatever was NOT on show when the table was made (a back room's fittings, drawn only
//             when you are near; a thing a feature brings out later), and each room's own inside faces (so a room seen
//             through a doorway counts even from where none of its furniture shows). These are tested against the solid
//             things but hide nothing: each is drawn on one pixel in nine, by its bin, so the solid thing behind a pane
//             of glass still shows through it and is still counted.
// Whatever moves about (userData.always) or is not under the museum's group is not drawn at all.
import fs from 'fs';
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const puppeteer = (await import(PUP)).default;
const [port, outFile = 'data/pvs.json', step = '5'] = process.argv.slice(2);
const b = await puppeteer.launch({ headless: 'new', protocolTimeout: 7200000, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 640, height: 400 });
p.on('pageerror', e => console.log('ERR', String(e).slice(0, 200)));
await p.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch {} });
await p.goto(`http://127.0.0.1:${port}/?saved&noopen&nofps`, { waitUntil: 'domcontentloaded' });
await p.waitForFunction('window.__ah && window.__ah.state === "title" && !document.querySelector(\'button[data-act="start"]\').disabled', { timeout: 300000, polling: 200 });
for (let i = 0; i < 80; i++) { if (await p.evaluate(() => window.__ah.state) === 'play') break; await p.evaluate(() => { const q = document.querySelector('button[data-act="start"]'); if (q && !q.disabled) q.click(); }); await new Promise(r => setTimeout(r, 250)); }
await new Promise(r => setTimeout(r, 4000));
const t0 = Date.now();
const out = await p.evaluate(async (STEP, QUICK) => {      // (PVS_QUICK=1: a dozen rooms, a few doors, one strip of the grounds: to try the tool, not to keep)
  const G = window.__ah, P = G.plan, R = G.renderer, T = await import('three'), { binOf, CELL } = await import('/src/visible.js'), { roomAt } = await import('/src/plan.js'), F = (await import('/src/features.js')).features;
  if (!P.stripped) throw new Error('the shut rooms have not left the plan yet: wait for play');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  G.museum.setLocked(false, true); G.set.guards = false;
  // ---- everything built: wake what is only built on first approach, then back to the start
  const woke = []; for (const f of F) if (f._pending && f.lazy) { G.vehicle.place(f.lazy.x, f.lazy.z, 0, 0.5); for (let k = 0; k < 12 && f._pending; k++) await wait(300); woke.push(f.id); }
  G.vehicle.place(P.spawn.x, P.spawn.z, P.spawn.yaw, 0.05); await wait(1500);
  // ---- what moves in three seconds is not part of the fixed world
  const SIZE = 384, HIDE = 9, box = new T.Box3();
  const always = o => { for (let q = o; q; q = q.parent) if (q.userData && q.userData.always) return true; return false; };
  const under = o => { for (let q = o; q; q = q.parent) if (q === G.museum.group) return true; return false; };
  const drawable = o => (o.isMesh || o.isLine || o.isPoints || o.isSprite) && o.geometry;
  const was = new Map(); G.museum.group.updateMatrixWorld(true); G.museum.group.traverse(o => { if (drawable(o)) { const e = o.matrixWorld.elements; was.set(o, [e[12], e[13], e[14]]); } });
  await wait(3000); G.museum.group.updateMatrixWorld(true);
  const movers = new Set(); for (const [o, q] of was) { const e = o.matrixWorld.elements; if ((e[12] - q[0]) ** 2 + (e[13] - q[1]) ** 2 + (e[14] - q[2]) ** 2 > 0.01) movers.add(o); }
  // ---- the game stands still from here
  const raf = window.requestAnimationFrame, held = []; window.requestAnimationFrame = cb => { held.push(cb); return 0; };
  await wait(150);
  // ---- every fixed thing, its bin (the same walk as src/visible.js), and its kind
  const bins = [], index = new Map(), binIx = name => { let i = index.get(name); if (i == null) { i = bins.length; bins.push(name); index.set(name, i); } return i; };
  for (const r of P.rooms) binIx(r.id);
  const mats = new Map(), stipples = [], saved = [], vis = [], count = { solid: 0, stipple: 0, notOnShow: 0, leftOut: 0, moving: movers.size };
  const matFor = (i, side, stipple) => {
    const k = i * 8 + side + (stipple ? 4 : 0); let m = mats.get(k); if (m) return m;
    const id = i + 1; m = new T.MeshBasicMaterial({ fog: false, toneMapped: false, side, depthWrite: !stipple }); m.color.setRGB((id & 255) / 255, ((id >> 8) & 255) / 255, ((id >> 16) & 255) / 255);
    // (stipple: one pixel in nine; one program for them all, the pattern a number each material carries. Two stipples one behind
    // the other on the same pattern would hide each other, so every bin is dealt a fresh pattern at each sample point: see look)
    if (stipple) { const u = m.userData.u = { value: i % 9 }; stipples.push([i, u]); m.onBeforeCompile = sh => { sh.uniforms.uPat = u; sh.fragmentShader = 'uniform float uPat;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n  if (mod(floor(gl_FragCoord.x), 3.0) + 3.0 * mod(floor(gl_FragCoord.y), 3.0) != uPat) discard;'); }; m.customProgramCacheKey = () => 'pvs-stipple'; }
    mats.set(k, m); return m;
  };
  const shownNow = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
  G.museum.group.updateMatrixWorld(true);
  const todo = [];
  G.scene.traverse(o => {
    if (!drawable(o)) return;
    const hide = () => { saved.push([o, o.material, o.layers.mask, o.renderOrder]); o.layers.set(HIDE); count.leftOut++; };
    if (!under(o) || always(o) || movers.has(o)) return hide();
    try { if (o.isInstancedMesh) { if (!o.boundingBox) o.computeBoundingBox(); box.copy(o.boundingBox).applyMatrix4(o.matrixWorld); } else { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); } } catch { return hide(); }
    if (box.isEmpty() || !isFinite(box.min.x)) return hide();
    const bin = binOf(P, box), ms = [].concat(o.material || []), on = shownNow(o);
    const solid = on && o.isMesh && ms.length > 0 && !ms.some(m => m.transparent || m.alphaTest > 0 || m.alphaHash || m.opacity < 1 || m.depthWrite === false || m.visible === false);
    todo.push([o, bin, solid, ms.length ? ms[0].side : T.FrontSide, on]);
  });
  const tinted = [];          // (a tint on each instance would multiply the bin's colour into some other bin's)
  for (const [o, bin, solid, side, on] of todo) {
    saved.push([o, o.material, o.layers.mask, o.renderOrder]);
    if (o.isInstancedMesh && o.instanceColor) { tinted.push([o, o.instanceColor]); o.instanceColor = null; }
    if (solid) { o.material = bin == null ? matFor(0xffffe, side, false) : matFor(binIx(bin), side, false); count.solid++; }      // (what is always drawn hides things like anything else, in a colour of its own)
    else if (bin == null) { o.layers.set(HIDE); count.leftOut++; }
    else { o.material = matFor(binIx(bin), T.DoubleSide, true); o.renderOrder = 10; count.stipple++; if (!on) count.notOnShow++; }
  }
  // everything under the museum's group on show for the drawing (what was not, is stipple: it hides nothing)
  G.museum.group.traverse(o => { if (!o.visible) { vis.push(o); o.visible = true; } });
  // ---- each room's own inside faces, in the room's colour, as stipple
  const proxies = new T.Group(), proxyOf = {}; G.scene.add(proxies); const unit = new T.BoxGeometry(1, 1, 1);
  for (const r of P.rooms) { const w = r.x1 - r.x0 - 0.12, h = r.top - r.y - 0.06, d = r.z1 - r.z0 - 0.12; if (w <= 0 || h <= 0 || d <= 0) continue; const m = new T.Mesh(unit, matFor(binIx(r.id), T.BackSide, true)); m.scale.set(w, h, d); m.position.set((r.x0 + r.x1) / 2, r.y + 0.03 + h / 2, (r.z0 + r.z1) / 2); m.renderOrder = 10; m.updateMatrixWorld(); proxies.add(m); proxyOf[r.id] = m; }
  // ---- the six-way camera
  const rt = new T.WebGLRenderTarget(SIZE, SIZE, { type: T.UnsignedByteType, depthBuffer: true, samples: 0, minFilter: T.NearestFilter, magFilter: T.NearestFilter });
  const cam = new T.PerspectiveCamera(90, 1, 0.05, 1400), px = new Uint8Array(SIZE * SIZE * 4), DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], UPS = [[0, 1, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, 1, 0]];
  const bg = G.scene.background, fog = G.scene.fog; G.scene.background = null; G.scene.fog = null;
  const prev = R.getRenderTarget(), pc = R.getClearColor(new T.Color()), pa = R.getClearAlpha();
  let renders = 0, salt = 0;
  const look = (x, y, z, into) => {
    salt++; for (const [i, u] of stipples) u.value = (Math.imul(i + 1, 2654435761) + Math.imul(salt, 40503) >>> 8) % 9;
    for (let f = 0; f < 6; f++) {
      cam.position.set(x, y, z); cam.up.fromArray(UPS[f]); cam.lookAt(x + DIRS[f][0], y + DIRS[f][1], z + DIRS[f][2]); cam.updateMatrixWorld();
      R.setRenderTarget(rt); R.setClearColor(0x000000, 0); R.clear(); R.render(G.scene, cam); R.readRenderTargetPixels(rt, 0, 0, SIZE, SIZE, px); renders++;
      let last = 0;
      for (let i = 0; i < px.length; i += 4) { const id = px[i] | (px[i + 1] << 8) | (px[i + 2] << 16); if (id && id !== last) { last = id; if (id <= bins.length) for (const s of into) s.add(id - 1); } }
    }
  };
  const from = {}, setOf = k => from[k] || (from[k] = new Set());
  const grid = (a0, a1, st) => { const lo = a0 + 0.4, hi = a1 - 0.4; if (hi <= lo) return [(a0 + a1) / 2]; const n = Math.max(1, Math.ceil((hi - lo) / st)); return Array.from({ length: n + 1 }, (_, i) => lo + (hi - lo) * i / n); };
  // ---- rooms
  let done = 0;
  for (const r of P.rooms) {
    const s = setOf(r.id), h = r.top - r.y, ys = h < 1.4 ? [r.y + h / 2] : h < 4 ? [r.y + 0.5, r.top - 0.4] : h < 9 ? [r.y + 0.5, r.y + 2.2, r.top - 0.4] : [r.y + 0.5, r.y + 2.2, r.y + h * 0.4, r.y + h * 0.7, r.top - 0.4];
    s.add(binIx(r.id));
    if (proxyOf[r.id]) proxyOf[r.id].visible = false;                  // (its own inside faces would only be in the way)
    for (const x of grid(r.x0, r.x1, STEP)) for (const z of grid(r.z0, r.z1, STEP)) for (const y of ys) look(x, y, z, [s]);
    if (proxyOf[r.id]) proxyOf[r.id].visible = true;
    if (++done % 10 === 0) { document.title = `pvs rooms ${done}/${P.rooms.length}`; await wait(0); }
    if (QUICK && done >= 12) break;
  }
  // ---- doorways: counted for the rooms on both sides, and for the square of the grounds outside an outer door
  const okey = (x, z) => `o:${Math.floor(x / CELL)}:${Math.floor(z / CELL)}`;
  let nd = 0;
  for (const d of P.doors) {
    if (d.shut || (QUICK && ++nd > 20)) continue;
    const a = P.byId[d.a], bb = P.byId[d.b], into = [], cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2;
    if (a) into.push(setOf(a.id)); if (bb) into.push(setOf(bb.id)); if (d.out || !a || !bb) into.push(setOf(okey(cx, cz)));
    if (a && bb) { setOf(a.id).add(binIx(bb.id)); setOf(bb.id).add(binIx(a.id)); }                  // (next door is always drawn)
    const top = d.y + Math.max(1, Math.min(d.h || 2.4, 6));
    for (const y of [d.y + 0.5, top - 0.3]) for (const [x, z] of [[cx, cz], [d.x0 + 0.1, d.z0 + 0.1], [d.x1 - 0.1, d.z1 - 0.1]]) look(x, y, z, into);
  }
  await wait(0);
  // ---- the grounds, near the ground: every square the things reach, from five points at two heights
  // (as far as the toy can go, plan.bounds, and a square beyond; not as far as the furthest thing, which is the moon)
  const B = P.bounds, x0 = Math.floor(B.x0 / CELL), x1 = Math.floor(B.x1 / CELL), z0 = Math.floor(B.z0 / CELL), z1 = Math.floor(B.z1 / CELL);
  const inMass = (x, z, y) => P.masses.some(m => x > m.x0 && x < m.x1 && z > m.z0 && z < m.z1 && y < m.top);
  let cells = 0;
  for (let ix = x0 - 1; ix <= x1 + 1; ix++) {
    for (let iz = z0 - 1; iz <= z1 + 1; iz++) {
      const cx = (ix + 0.5) * CELL, cz = (iz + 0.5) * CELL, q = CELL * 0.42; let s = null;
      for (const [dx, dz] of [[0, 0], [q, q], [-q, q], [q, -q], [-q, -q]]) for (const y of [0.7, 4.2]) {
        const x = cx + dx, z = cz + dz; if (inMass(x, z, y) || roomAt(P, x, z, y)) continue;
        s = s || setOf(`o:${ix}:${iz}`); look(x, y, z, [s]);
      }
      if (s) cells++;
    }
    document.title = `pvs grounds ${ix}/${x1}`; await wait(0);
    if (QUICK && ix >= x0 + 1) break;
  }
  // (a square of the grounds can see whatever the squares on either side of it can: the camera is seldom at the middle of one)
  { const o = Object.keys(from).filter(k => k.startsWith('o:')), copy = Object.fromEntries(o.map(k => [k, new Set(from[k])]));
    for (const k of o) { const [, ix, iz] = k.split(':').map(Number); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = copy[`o:${ix + dx}:${iz + dz}`]; if (n) for (const i of n) from[k].add(i); } } }
  // ---- put it all back
  R.setRenderTarget(prev); R.setClearColor(pc, pa); G.scene.background = bg; G.scene.fog = fog; G.scene.remove(proxies);
  for (const o of vis) o.visible = false;
  for (const [o, m, mask, ro] of saved) { o.material = m; o.layers.mask = mask; o.renderOrder = ro; }
  for (const [o, c] of tinted) o.instanceColor = c;
  for (const m of mats.values()) m.dispose(); unit.dispose(); rt.dispose();
  window.requestAnimationFrame = raf; for (const cb of held) raf(cb);
  const sizes = Object.values(from).map(s => s.size).sort((a, b) => a - b);
  return { pvs: { made: P.made, rooms: P.rooms.length, cell: CELL, step: STEP, bins, from: Object.fromEntries(Object.entries(from).map(([k, s]) => [k, [...s].sort((a, b) => a - b)])) },
    stats: { bins: bins.length, roomBins: P.rooms.length, places: Object.keys(from).length, groundSquares: cells, things: count, woke, renders, binsSeenMedian: sizes[sizes.length >> 1], binsSeenMost: sizes[sizes.length - 1], binsSeenLeast: sizes[0] } };
}, +step, !!process.env.PVS_QUICK);
fs.writeFileSync(outFile, JSON.stringify(out.pvs));
console.log(JSON.stringify(out.stats), 'in', Math.round((Date.now() - t0) / 1000), 's;', outFile, Math.round(fs.statSync(outFile).size / 1024), 'KB');
await b.close();
