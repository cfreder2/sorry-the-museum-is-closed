// The in-page half of tools/dev/cullcheck.mjs: does ?cull hide anything that can be seen? See cullcheck.mjs for how to run it.
//
// At each view the game is given two frames with the camera held there (G.testEye) and the toy put at the camera, so
// that the layers are exactly what the game itself set for that place. Then, without the game running on:
//   SOLID THINGS   every solid thing in the world is drawn in a flat colour of its own, at twice the window's size, by a
//                  camera that draws every layer. A thing with a pixel in that picture which the game's camera would not
//                  have drawn (its layer is hidden) is a FAULT.
//   SEE-THROUGH    (glass, ice, labels, glows, the light show, points, lines, sprites, anything with no depth) over the
//                  depth of that picture, only the see-through things the game's camera would NOT have drawn are drawn,
//                  as themselves, on plain grey. Any pixel that is no longer grey is something that should have been in
//                  the picture: a FAULT. (So a hidden label behind a wall is no fault, nor a hidden glow whose light
//                  comes to nothing where it shows; a hidden pane of glass in line of sight is.) They are then named by
//                  drawing them once more in flat colours.
//   THE REFLECTION the same solid test from the floor mirror's own camera, for what the mirror's camera would not have
//                  drawn, counted only where a floor that takes the reflection is in the picture (and as far round it as
//                  the polish smears).
// The pass mark is no fault of any kind in any view.
import * as T from 'three';
import { HIDDEN, MIRROR, onShow, ceilOf, CELL } from '/src/visible.js';
import { groundAt, streetY } from '/src/plan.js';

const frame = () => new Promise(r => requestAnimationFrame(() => r()));

// ---- the views: [kind, x, y, z, yaw, pitch] ----
export function views(P, opt = {}) {
  let seed = opt.seed || 7; const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const out = [], add = (kind, x, y, z, yaw, pitch) => out.push([kind, +x.toFixed(2), +y.toFixed(2), +z.toFixed(2), +(((yaw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).toFixed(3), +Math.max(-1.5, Math.min(1.5, pitch)).toFixed(3)]);
  const anyWay = () => [rnd() * Math.PI * 2, Math.asin(Math.max(-0.996, Math.min(0.996, rnd() * 2 - 1)))];      // any facing, any tilt (evenly over the sphere, short of straight up and down)
  const B = P.bounds, rooms = P.rooms.filter(r => r.x1 - r.x0 > 0.6 && r.z1 - r.z0 > 0.6), areas = rooms.map(r => (r.x1 - r.x0) * (r.z1 - r.z0)), total = areas.reduce((a, c) => a + c, 0);
  const massTop = (x, z) => { let t = null; for (const m of P.masses) if (x > m.x0 && x < m.x1 && z > m.z0 && z < m.z1 && (t == null || m.top > t)) t = m.top; return t; };
  const ground = (x, z) => { const t = massTop(x, z); if (t != null) return t; let g = 0; try { g = groundAt(P, x, z, 40); } catch { try { g = streetY(P, x, z); } catch {} } return isFinite(g) ? g : 0; };
  const yawTo = (dx, dz) => Math.atan2(dx, dz);
  // -- random: anywhere a camera can be, NOT the points the table was made from
  const N = opt.random == null ? 3000 : opt.random;
  for (let i = 0; i < N; i++) {
    const k = i % 20;
    if (k < 9) {            // in a room: half by floor area, half every room alike; any height from the floor to the ceiling (the last few centimetres too)
      let r; if (i % 2) r = rooms[Math.floor(rnd() * rooms.length)]; else { let t = rnd() * total, j = 0; while (j < rooms.length - 1 && t > areas[j]) t -= areas[j++]; r = rooms[j]; }
      const c = ceilOf(r), h = c - r.y, y = k % 3 === 0 ? r.y + 0.02 + rnd() * (h - 0.03) : r.y + 0.1 + rnd() * Math.min(h - 0.2, 2.6);
      add('random room', r.x0 + 0.15 + rnd() * (r.x1 - r.x0 - 0.3), y, r.z0 + 0.15 + rnd() * (r.z1 - r.z0 - 0.3), ...anyWay());
    } else if (k < 14) {    // on the grounds, up to 6 m over whatever is underfoot
      const x = B.x0 - 15 + rnd() * (B.x1 - B.x0 + 30), z = B.z0 - 15 + rnd() * (B.z1 - B.z0 + 30); if (massTop(x, z) != null) { i--; continue; }
      add('random grounds', x, ground(x, z) + 0.2 + rnd() * 5.8, z, ...anyWay());
    } else if (k < 17) {    // on a roof
      const m = P.masses[Math.floor(rnd() * P.masses.length)], x = m.x0 + rnd() * (m.x1 - m.x0), z = m.z0 + rnd() * (m.z1 - m.z0);
      add('random roof', x, massTop(x, z) + 0.2 + rnd() * 5, z, ...anyWay());
    } else {                // in the air
      const x = B.x0 - 10 + rnd() * (B.x1 - B.x0 + 20), z = B.z0 - 10 + rnd() * (B.z1 - B.z0 + 20);
      add('random air', x, Math.max(ground(x, z) + 6, 6) + rnd() * 40, z, ...anyWay());
    }
  }
  if (opt.directed === false) return out;
  const eye = r => Math.min(r.y + 1.0, ceilOf(r) - 0.2);
  // -- through every doorway and opening the plan knows, from both sides, and from in it
  for (const d of P.doors) {
    if (d.shut || d.gone) continue;
    const ax = d.along === 'x', cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2, h = d.h || 2.4, ys = [d.y + Math.min(0.9, h * 0.5), d.y + Math.max(0.15, h - 0.3)];
    for (const s of [-1, 1]) {
      const fx = ax ? s : 0, fz = ax ? 0 : s, edge = ax ? (s < 0 ? d.x0 : d.x1) : (s < 0 ? d.z0 : d.z1), yaw = yawTo(-fx, -fz);      // standing off on side s, looking back through
      for (const off of [1.2, 4]) { const x = ax ? edge + s * off : cx, z = ax ? cz : edge + s * off; for (const dy of off === 1.2 ? [-0.5, 0, 0.5] : [0]) add('door', x, ys[0], z, yaw + dy, 0); }
      add('door', ax ? edge + s * 0.6 : cx + (d.x1 - d.x0) * 0.3, ys[1], ax ? cz + (d.z1 - d.z0) * 0.3 : edge + s * 0.6, yaw + 0.35, -0.2);
      add('in a doorway', cx, ys[0], cz, yaw, 0);
    }
  }
  // -- along every long sight line: from each end of every room 20 m long or more, at three heights; and across the short way
  for (const r of rooms) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0, c = ceilOf(r), L = Math.max(w, d); if (L < 20) continue;
    const ys = [r.y + 0.6, r.y + (c - r.y) * 0.5, c - 0.4], mx = (r.x0 + r.x1) / 2, mz = (r.z0 + r.z1) / 2;
    for (const y of ys) for (const s of [-1, 1]) { if (w >= d) { add('long view', mx + s * (w / 2 - 0.5), y, mz, yawTo(-s, 0), 0); add('long view', mx + s * (w / 2 - 0.5), y, r.z0 + 0.4, yawTo(-s, 0.2), y === ys[2] ? -0.25 : 0.1); } else { add('long view', mx, y, mz + s * (d / 2 - 0.5), yawTo(0, -s), 0); add('long view', r.x0 + 0.4, y, mz + s * (d / 2 - 0.5), yawTo(0.2, -s), y === ys[2] ? -0.25 : 0.1); } }
  }
  // -- up and down every stair, ramp, lift shaft and well
  const upDown = (kind, x0, x1, z0, z1, ylo, yhi) => { const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2; for (const [x, z] of [[mx, mz], [x0 + 0.3, z0 + 0.3], [x1 - 0.3, z1 - 0.3]]) { add(kind, x, ylo + 0.4, z, 0.7, 1.3); add(kind, x, ylo + 0.4, z, 3.8, 0.9); add(kind, x, yhi + 0.5, z, 0.7, -1.3); add(kind, x, yhi + 0.5, z, 3.8, -0.9); add(kind, x, (ylo + yhi) / 2, z, 2.2, 1.2); add(kind, x, (ylo + yhi) / 2, z, 5.3, -1.2); } };
  for (const s of P.ramps || []) if (isFinite(s.x0 + s.x1 + s.z0 + s.z1)) { const a = Math.min(s.h0 ?? 0, s.h1 ?? 0), b = Math.max(s.h0 ?? 0, s.h1 ?? 0); if (b - a > 0.5) { upDown('stair or ramp', s.x0, s.x1, s.z0, s.z1, a, b); const ax = s.axis === 'x' || s.x1 - s.x0 > s.z1 - s.z0, mx = (s.x0 + s.x1) / 2, mz = (s.z0 + s.z1) / 2; for (const sgn of [-1, 1]) { const up = (s.h1 ?? 0) > (s.h0 ?? 0) ? 1 : -1, hi = sgn * up > 0; add('stair or ramp', ax ? (sgn < 0 ? s.x0 + 0.3 : s.x1 - 0.3) : mx, (sgn < 0 ? s.h0 ?? 0 : s.h1 ?? 0) + 0.7, ax ? mz : (sgn < 0 ? s.z0 + 0.3 : s.z1 - 0.3), ax ? yawTo(-sgn, 0) : yawTo(0, -sgn), hi ? -0.45 : 0.45); } } }
  for (const l of P.lifts || []) { const a = Math.min(...l.stops), b = Math.max(...l.stops); upDown('lift', l.x0, l.x1, l.z0, l.z1, a, b); for (const y of l.stops) for (let q = 0; q < 4; q++) add('lift', (l.x0 + l.x1) / 2, y + 1, (l.z0 + l.z1) / 2, q * Math.PI / 2, 0); }
  for (const w of P.wells || []) if (isFinite(w.x0 + w.x1 + w.z0 + w.z1)) upDown('well', w.x0, w.x1, w.z0, w.z1, (w.y0 ?? w.y ?? 0) - 4, w.y1 ?? w.y ?? 0);
  // -- through every skylight, from under it and from the roof over it
  for (const k of P.skylights || []) { const r = P.byId[k.room]; if (!r || !isFinite(k.x0 + k.x1 + k.z0 + k.z1)) continue; const mx = (k.x0 + k.x1) / 2, mz = (k.z0 + k.z1) / 2, top = massTop(mx, mz) ?? r.top + 0.6;
    for (const [x, z] of [[mx, mz], [k.x0 + 0.2, k.z0 + 0.2], [k.x1 - 0.2, k.z1 - 0.2]]) { add('skylight from below', x, eye(r), z, 1, 1.35); add('skylight from below', x + 1.5, r.y + 0.4, z + 1.5, yawTo(-1, -1), 1.0); add('skylight from the roof', x, top + 0.5, z, 2, -1.35); add('skylight from the roof', x + 2, top + 1.6, z - 2, yawTo(-1, 1), -0.75); add('skylight from the roof', x - 3, top + 3, z, yawTo(1, 0), -0.6); } }
  // -- every room: steeply up, steeply down from just over the floor (the audit's one bad view was down through a floor in the Modern Wing), and out through each wall from inside and in from outside
  for (const r of rooms) {
    const c = ceilOf(r), mx = (r.x0 + r.x1) / 2, mz = (r.z0 + r.z1) / 2, w = r.x1 - r.x0, d = r.z1 - r.z0;
    for (const [fx, fz] of [[0.25, 0.3], [0.75, 0.7]]) { const x = r.x0 + w * fx, z = r.z0 + d * fz; add('steeply down', x, r.y + 0.3, z, fx * 9, -1.2); add('steeply down', x, r.y + 1.4, z, fx * 9 + 2.5, -0.9); add('steeply up', x, r.y + 0.5, z, fx * 7, 1.25); add('steeply up', x, c - 0.3, z, fx * 7 + 3, -0.5); }
    for (const [nx, nz, len, half] of [[-1, 0, d, w / 2], [1, 0, d, w / 2], [0, -1, w, d / 2], [0, 1, w, d / 2]]) {
      const wx = mx + nx * half, wz = mz + nz * half, back = Math.min(2.5, half * 1.2), n = len > 14 ? 3 : 1;
      for (let q = 0; q < n; q++) { const t = n === 1 ? 0 : (q / (n - 1) - 0.5) * (len - 3), px = wx + (nz ? t : 0), pz = wz + (nx ? t : 0);
        add('out through a wall', px - nx * back, eye(r), pz - nz * back, yawTo(nx, nz), 0.05);
        add('in through a wall', px + nx * 6, r.y + 1.2, pz + nz * 6, yawTo(-nx, -nz), 0); }
    }
  }
  // -- the grounds at the building and the roofs at the grounds: a ring round every block, at three heights, looking in; from each roof's edges, looking out and down
  for (let i = 0; i < P.masses.length; i += 1) { const m = P.masses[i]; if (m.x1 - m.x0 < 6 || m.z1 - m.z0 < 6) continue; const mx = (m.x0 + m.x1) / 2, mz = (m.z0 + m.z1) / 2;
    if (i % 3 === 0) for (const [nx, nz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const x = mx + nx * ((m.x1 - m.x0) / 2 - 0.8), z = mz + nz * ((m.z1 - m.z0) / 2 - 0.8); add('from a roof', x, m.top + 0.8, z, yawTo(nx, nz), -0.4); add('from a roof', x, m.top + 2.5, z, yawTo(-nx, -nz), -0.3); } }
  for (let x = B.x0; x <= B.x1; x += 36) for (let z = B.z0; z <= B.z1; z += 36) { if (massTop(x, z) != null) continue; const g = ground(x, z); for (const [y, p] of [[0.5, 0.1], [2.5, 0], [5.5, -0.15]]) for (let q = 0; q < 4; q++) add('grounds', x, g + y, z, q * Math.PI / 2 + 0.3, p); }
  // -- the views the audit found wrong, and its thirteen spots
  for (const [x, y, z, yaw, p] of [[211.1, 5.5, 12.5, 5.86, -0.51], [77, -11.1, 75, 1.54, 0.51], [157.6, 2, 157.5, 4.85, -0.35], [137.6, 5.1, 19.8, 2.85, -0.12], [92.5, 4.8, 260.8, 0.99, -0.45], [99.1, 2.9, 287, 0.75, 0.4], [613.4, 4.7, -15.9, 3.9, -0.47], [141.4, 10.5, 110.3, 5.36, -0.41], [128.8, 1.5, 101.7, 2.44, 0.29], [112.7, 1.6, 106.1, 6.09, 0.44], [74.8, 1.5, 86.8, 2.96, 0.57], [153.2, 13.5, 19.8, 5.82, 0.17]]) add("the audit's faults", x, y, z, yaw, p);
  for (const [x, z, lx, lz, y] of [[26, 108, 60, 108, 0], [59, 97, 59, 117, 0], [-12, 108, 20, 108, 0], [171.6, 6, 171.6, 80, 0], [172, 160, 172, 230, 0], [92, 110, 140, 110, 5.2], [153.5, 150, 153.5, 230, -4.6], [75.5, 8, 75.5, 90, -4.6], [218, 74, 218, 130, 5.2], [212, 11, 180, 11, 11.3], [330, 60, 400, 100, 0], [330, 60, 200, 100, 0], [42, 108, 150, 108, 12.8]]) for (const dy of [0, Math.PI]) add("the audit's spots", x, y + 0.6, z, yawTo(lx - x, lz - z) + dy, -0.08);
  return out;
}

export async function check(list, opt = {}) {
  const G = window.__ah, R = G.renderer, P = G.plan, V = G.vis;
  if (!V || !V.ok) return { error: 'no G.vis: run with ?cull and a data/pvs.json for this plan (' + (V ? V.why : 'not made yet') + ')' };
  G.museum.setLocked(false, true); G.set.guards = false;
  const W2 = R.domElement.width * 2, H2 = R.domElement.height * 2, NPX = W2 * H2;
  const rt = new T.WebGLRenderTarget(W2, H2, { type: T.UnsignedByteType, depthBuffer: true, samples: 0, minFilter: T.NearestFilter, magFilter: T.NearestFilter, colorSpace: T.NoColorSpace });
  const px = new Uint8Array(NPX * 4), p32 = new Uint32Array(px.buffer), px2 = new Uint8Array(NPX * 4), q32 = new Uint32Array(px2.buffer);
  const eyeAll = new T.PerspectiveCamera(), eyeHid = new T.PerspectiveCamera(); eyeAll.layers.enableAll(); eyeHid.layers.set(HIDDEN); eyeHid.layers.enable(MIRROR);
  const like = (c, src) => { c.position.copy(src.position); c.quaternion.copy(src.quaternion); c.scale.copy(src.scale); c.projectionMatrix.copy(src.projectionMatrix); c.projectionMatrixInverse.copy(src.projectionMatrixInverse); c.updateMatrixWorld(true); };
  const none = new T.MeshBasicMaterial({ visible: false }), idMats = new Map(), things = [null];
  const idOf = o => { let e = idMats.get(o); if (!e) { const id = things.length; things.push(o); const first = Array.isArray(o.material) ? o.material[0] : o.material; e = { id, m: new T.MeshBasicMaterial({ fog: false, toneMapped: false, side: first ? first.side : T.FrontSide }), c: new T.MeshBasicMaterial({ fog: false, toneMapped: false, side: T.DoubleSide, depthWrite: false }) }; e.m.color.setRGB((id & 255) / 255, ((id >> 8) & 255) / 255, ((id >> 16) & 255) / 255, T.NoColorSpace); e.c.color.copy(e.m.color); idMats.set(o, e); } return e; };
  const solid = o => { if (!o.isMesh) return false; const ms = Array.isArray(o.material) ? o.material : [o.material]; if (!ms.length) return false; for (const m of ms) if (!m || m.transparent || m.alphaTest > 0 || m.alphaHash || m.opacity < 1 || m.depthWrite === false || m.depthTest === false || m.visible === false || m.colorWrite === false) return false; return true; };
  const drawable = o => (o.isMesh || o.isLine || o.isPoints || o.isSprite) && o.material;
  const count = new Uint32Array(1 << 16), box = new T.Box3();
  const name = o => { const n = []; for (let q = o; q && q !== G.scene && n.length < 4; q = q.parent) if (q.name) n.push(q.name); let size = ''; try { if (o.isInstancedMesh) { o.computeBoundingBox(); box.copy(o.boundingBox).applyMatrix4(o.matrixWorld); } else { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); } size = [box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z].map(q => +q.toFixed(1)).join(' x ') + ' at ' + [(box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, (box.min.z + box.max.z) / 2].map(q => Math.round(q)).join(', '); } catch {}
    const it = V.items.find(q => q.o === o), ms = [].concat(o.material || []);
    return { thing: (o.isInstancedMesh ? 'instanced x' + o.count + ' ' : '') + (o.isMesh ? 'mesh' : o.isSprite ? 'sprite' : o.isPoints ? 'points' : 'line') + (n.length ? ' "' + n.join(' < ') + '"' : ''), material: ms.map(m => m.type.replace('Mesh', '').replace('Material', '') + (m.transparent ? ' see-through' : '') + (m.alphaTest ? ' cut-out' : '') + (m.depthWrite === false ? ' no depth' : '')).slice(0, 2).join(', '), size, bin: it ? (it.bins ? `big thing in ${it.bins.length} squares` : V.pvs.bins[it.i]) : '?' }; };
  const out = { views: 0, covered: 0, everythingDrawn: 0, faultViews: 0, faults: [], byKind: {}, byFault: { solid: 0, seeThrough: 0, reflection: 0 }, callsOff: 0, callsOn: 0, thingsHidden: 0, ms: 0 };
  const t0 = performance.now(), saved = [], tinted = [], floorSet = new Set(G.museum.floors);
  // one drawing of the whole scene with stand-in materials. mode 'solid': every solid thing in its colour, the rest left out. 'clear': the see-through things `only` says, as themselves (or in their colours), the rest left out.
  const pass = (cam, mode, only, flat) => {
    saved.length = 0; tinted.length = 0;
    G.scene.traverse(o => { if (!drawable(o)) return; const s = solid(o); let m;
      if (mode === 'solid') m = s ? idOf(o).m : none; else m = !s && only(o) ? (flat ? idOf(o).c : null) : none;
      if (m) { saved.push(o, o.material); o.material = m; if (m !== none && o.isInstancedMesh && o.instanceColor) { tinted.push(o, o.instanceColor); o.instanceColor = null; } } });
    const bg = G.scene.background, fog = G.scene.fog; G.scene.background = null; if (mode === 'solid' || flat) G.scene.fog = null;
    try { R.render(G.scene, cam); } finally { G.scene.background = bg; G.scene.fog = fog; for (let i = 0; i < saved.length; i += 2) saved[i].material = saved[i + 1]; for (let i = 0; i < tinted.length; i += 2) tinted[i].instanceColor = tinted[i + 1]; }
  };
  const tally = buf => { count.fill(0, 0, things.length + 1); let last = 0, lastN = 0; for (let i = 0; i < NPX; i++) { const id = buf[i] & 0xffffff; if (id === last) { lastN++; continue; } if (last) count[last] += lastN; last = id; lastN = 1; } if (last) count[last] += lastN; };
  const prev = R.getRenderTarget(), pc = R.getClearColor(new T.Color()), pa = R.getClearAlpha(), auto = R.autoClear;
  const toy = () => [G.car, G.drone].flatMap(v => (v ? [v.group, v.shadow] : [])).filter(Boolean);
  try {
    for (let vi = 0; vi < list.length; vi++) {
      const [kind, x, y, z, yaw, pitch] = list[vi], dx = Math.sin(yaw) * Math.cos(pitch), dz = Math.cos(yaw) * Math.cos(pitch), dy = Math.sin(pitch);
      G.vehicle.place(x, z, yaw, y); if (G.vehicle.vel) G.vehicle.vel.set(0, 0, 0);
      G.testEye = { at: [x, y, z], look: [x + dx * 10, y + dy * 10, z + dz * 10] };
      await frame(); G.vehicle.place(x, z, yaw, y); if (G.vehicle.vel) G.vehicle.vel.set(0, 0, 0); await frame(); await frame();
      const all = V._all, bk = out.byKind[kind] || (out.byKind[kind] = { views: 0, covered: 0, faultViews: 0, faults: 0 });
      out.views++; bk.views++; if (all) out.everythingDrawn++; else { out.covered++; bk.covered++; out.thingsHidden += V.count - V.shown; }
      if (all && !opt.checkAll) { if (vi % 50 === 0) document.title = `cullcheck ${vi}/${list.length} faults ${out.faults.length}`; continue; }
      const hide = toy().filter(o => o.visible); for (const o of hide) o.visible = false;
      const found = [];
      try {
        // -- solid things
        like(eyeAll, G.camera); like(eyeHid, G.camera);
        R.setRenderTarget(rt); R.autoClear = true; R.setClearColor(0x000000, 0); R.clear(); pass(eyeAll, 'solid'); R.readRenderTargetPixels(rt, 0, 0, W2, H2, px); tally(p32);
        const floorPx = []; let anyFloor = false;
        for (let id = 1; id < things.length; id++) if (count[id]) { const o = things[id]; if (!(o.layers.mask & 1)) found.push({ fault: 'solid', px: count[id], ...name(o) }); if (floorSet.has(o)) anyFloor = true; }
        // -- see-through things the game's camera would not have drawn, over that depth, as themselves on grey
        const hid = o => !(o.layers.mask & 1) && onShow(o);
        R.autoClear = false; R.setClearColor(0x808080, 1); R.clear(true, false, false); pass(eyeHid, 'clear', hid, false); R.readRenderTargetPixels(rt, 0, 0, W2, H2, px2);
        const grey = q32[0]; let changed = 0; const g0 = grey & 255, g1 = (grey >> 8) & 255, g2 = (grey >> 16) & 255;
        for (let i = 0; i < NPX; i++) { const c = q32[i]; if (c !== grey && (Math.abs((c & 255) - g0) > 3 || Math.abs(((c >> 8) & 255) - g1) > 3 || Math.abs(((c >> 16) & 255) - g2) > 3)) { changed++; px2[i * 4 + 3] = 1; } else px2[i * 4 + 3] = 0; }
        if (changed) {      // which of them: once more, in flat colours, and counted where the picture changed
          R.setClearColor(0x000000, 0); R.clear(true, false, false); pass(eyeHid, 'clear', hid, true); R.readRenderTargetPixels(rt, 0, 0, W2, H2, px);
          count.fill(0, 0, things.length + 1); for (let i = 0; i < NPX; i++) if (px2[i * 4 + 3]) { const id = p32[i] & 0xffffff; if (id) count[id]++; }
          let named = 0; for (let id = 1; id < things.length; id++) if (count[id]) { found.push({ fault: 'seeThrough', px: count[id], ...name(things[id]) }); named += count[id]; }
          if (!named) found.push({ fault: 'seeThrough', px: changed, thing: '(not named)' });
        }
        // -- the reflection: what the mirror's camera would not have drawn, where a floor that takes it is in the picture
        if (G.mirror && G.mirror.enabled && G.mirror.strength.value > 0 && anyFloor && V.mirrorCam) {
          const lvl = G.mirror.level.value, mask = new Uint8Array(NPX); let any = false;
          for (let i = 0; i < NPX; i++) { const id = p32[i] & 0xffffff; if (id && floorSet.has(things[id])) { const o = things[id]; if (o._fy === undefined) { o.geometry.computeBoundingBox(); box.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); o._fy = box.max.y - box.min.y < 0.2 ? (box.min.y + box.max.y) / 2 : null; } if (o._fy == null || Math.abs(o._fy - lvl) < 0.1) { mask[i] = 1; any = true; } } }
          if (any) {
            // (as far round a floor's pixel as its polish reads: three taps 0.02 of the picture's height apart, from a picture half the size smeared over eight or nine of its own pixels)
            const RX = 44, RY = 44 + Math.round(H2 * 0.022), wide = new Uint8Array(NPX), tmp = new Uint8Array(NPX);
            for (let j = 0; j < H2; j++) { let run = -1e9; const row = j * W2; for (let i = 0; i < W2; i++) { if (mask[row + i]) run = i; if (i - run <= RX) tmp[row + i] = 1; } run = 1e9; for (let i = W2 - 1; i >= 0; i--) { if (mask[row + i]) run = i; if (run - i <= RX) tmp[row + i] = 1; } }
            for (let i = 0; i < W2; i++) { let run = -1e9; for (let j = 0; j < H2; j++) { if (tmp[j * W2 + i]) run = j; if (j - run <= RY) wide[j * W2 + i] = 1; } run = 1e9; for (let j = H2 - 1; j >= 0; j--) { if (tmp[j * W2 + i]) run = j; if (run - j <= RY) wide[j * W2 + i] = 1; } }
            like(eyeAll, G.mirror.cam); const fl = G.museum.floors.filter(m => m.visible); for (const m of fl) m.visible = false;
            try { R.autoClear = true; R.setClearColor(0x000000, 0); R.clear(); pass(eyeAll, 'solid'); R.readRenderTargetPixels(rt, 0, 0, W2, H2, px); } finally { for (const m of fl) m.visible = true; }
            count.fill(0, 0, things.length + 1); for (let i = 0; i < NPX; i++) if (wide[i]) { const id = p32[i] & 0xffffff; if (id) count[id]++; }
            for (let id = 1; id < things.length; id++) if (count[id] && !(things[id].layers.mask & (1 | (1 << MIRROR)))) found.push({ fault: 'reflection', px: count[id], ...name(things[id]) });
          }
        }
      } finally { for (const o of hide) o.visible = true; }
      if (found.length) {
        out.faultViews++; bk.faultViews++; bk.faults += found.length;
        for (const f of found) { out.byFault[f.fault]++; if (out.faults.length < 3000) out.faults.push({ view: [kind, x, y, z, yaw, pitch], from: V.sig, ...f, share: +(f.px / NPX * 100).toFixed(4) }); }
      }
      if (vi % 20 === 0) document.title = `cullcheck ${vi}/${list.length} faults ${out.faults.length}`;
    }
  } finally { R.setRenderTarget(prev); R.setClearColor(pc, pa); R.autoClear = auto; G.testEye = null; rt.dispose(); none.dispose(); for (const e of idMats.values()) { e.m.dispose(); e.c.dispose(); } }
  out.ms = Math.round(performance.now() - t0);
  out.meanThingsHidden = out.covered ? Math.round(out.thingsHidden / out.covered) : 0;
  return out;
}
