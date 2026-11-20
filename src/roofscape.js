// What is on the roofs, as it is from the air: pitched glass lanterns over the galleries, long
// monitors along the old building, the school's sawtooth north-lights, solar arrays on the long
// flat roofs, and the plant that keeps the place at 21 degrees. All of it modelled by hand.
//
// A lantern over a gallery sits on the pane that was already there and is low enough to drive
// over. Everything else that stands up is solid, and is only put where nothing else is.

import * as THREE from 'three';
import { Geo } from './geo.js';

function tex(w, h, draw, rx = 1, ry = 1) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t;
}

export function buildRoofscape(museum, plan) {
  const group = museum.group, O = plan.obstacles;
  const glassT = tex(64, 64, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#9cc4d6'); g.addColorStop(1, '#6f9db5'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.strokeStyle = '#e8eef0'; c.lineWidth = 5; c.strokeRect(0, 0, w, h); });
  const cellT = tex(64, 64, (c, w, h) => { c.fillStyle = '#16337a'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a55b8'; c.fillRect(3, 3, w - 6, h - 6); c.strokeStyle = '#17306c'; c.lineWidth = 1; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(i * 16, 3); c.lineTo(i * 16, h - 3); c.moveTo(3, i * 16); c.lineTo(w - 3, i * 16); c.stroke(); } });
  const ribT = tex(32, 8, (c, w, h) => { c.fillStyle = '#8f9bb0'; c.fillRect(0, 0, w, h); c.fillStyle = '#6f7b92'; c.fillRect(0, 0, 5, h); c.fillStyle = '#aab4c6'; c.fillRect(14, 0, 4, h); });
  const glass = new THREE.MeshStandardMaterial({ map: glassT, roughness: 0.25, metalness: 0.2, emissiveMap: glassT, emissive: new THREE.Color(0.32, 0.42, 0.55), emissiveIntensity: 0.75 });
  const solar = new THREE.MeshStandardMaterial({ map: cellT, roughness: 0.3, metalness: 0.3, emissiveMap: cellT, emissive: new THREE.Color(0.22, 0.3, 0.55), emissiveIntensity: 0.38, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const metal = new THREE.MeshStandardMaterial({ map: ribT, roughness: 0.6, metalness: 0.3, emissiveMap: ribT, emissive: new THREE.Color(0.3, 0.33, 0.42), emissiveIntensity: 0.55 });
  const frame = new THREE.MeshStandardMaterial({ color: 0xc9c6bd, roughness: 0.8, emissive: 0x4a4f60, emissiveIntensity: 0.55 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.7, emissive: 0x12151c, emissiveIntensity: 0.6 });
  const G = { glass: new Geo(), solar: new Geo(), metal: new Geo(), frame: new Geo(), dark: new Geo() };

  // Is this patch of roof free of the kit, the card table, the stall, and anything else solid up there?
  const busy = (x0, x1, z0, z1, y, m = 1.6) =>
    plan.surfaces.some(s => !s.hill && Math.max(s.h0 || 0, s.h1 || 0) > y - 1 && s.x0 < x1 + m && s.x1 > x0 - m && s.z0 < z1 + m && s.z1 > z0 - m)
    || plan.roofs.some(s => s.skin !== 'roof' && s.h0 > y - 1 && s.x0 < x1 + 0.3 && s.x1 > x0 - 0.3 && s.z0 < z1 + 0.3 && s.z1 > z0 - 0.3)
    || O.some(o => o.y1 > y + 0.1 && o.y0 < y + 3 && o.x0 < x1 + m && o.x1 > x0 - m && o.z0 < z1 + m && o.z1 > z0 - m)
    || (plan.props || []).some(p => p.x > x0 - m && p.x < x1 + m && p.z > z0 - m && p.z < z1 + m && (p.y || 0) > y - 1)
    || (plan.skylights || []).some(k => k.x0 < x1 + m && k.x1 > x0 - m && k.z0 < z1 + m && k.z1 > z0 - m)
    || (plan.terrace && Math.hypot(plan.terrace.x - (x0 + x1) / 2, plan.terrace.z - (z0 + z1) / 2) < 16);

  // A hipped glass roof on a rectangle: four slopes and a flat top.
  const hip = (g, x0, x1, z0, z1, y, rise, s = 0.9) => {
    const k = Math.min(x1 - x0, z1 - z0) * 0.36, a0 = x0 + k, a1 = x1 - k, b0 = z0 + k, b1 = z1 - k, t = y + rise, n = rise / Math.hypot(rise, k), m = k / Math.hypot(rise, k);
    const uv = (p, q) => [[0, 0], [p / s, 0], [(p - k) / s, q / s], [k / s, q / s]], sl = Math.hypot(rise, k);
    g.quad([x0, y, z0], [x0, y, z1], [a0, t, b1], [a0, t, b0], [-n, m, 0], uv(z1 - z0, sl));
    g.quad([x1, y, z1], [x1, y, z0], [a1, t, b0], [a1, t, b1], [n, m, 0], uv(z1 - z0, sl));
    g.quad([x1, y, z0], [x0, y, z0], [a0, t, b0], [a1, t, b0], [0, m, -n], uv(x1 - x0, sl));
    g.quad([x0, y, z1], [x1, y, z1], [a1, t, b1], [a0, t, b1], [0, m, n], uv(x1 - x0, sl));
    g.quad([a0, t, b0], [a0, t, b1], [a1, t, b1], [a1, t, b0], [0, 1, 0], [[0, 0], [(b1 - b0) / s, 0], [(b1 - b0) / s, (a1 - a0) / s], [0, (a1 - a0) / s]]);
  };
  const kerb = (x0, x1, z0, z1, y, hgt = 0.14, w = 0.16) => { G.frame.box(x0 - w, x1 + w, y, y + hgt, z0 - w, z0); G.frame.box(x0 - w, x1 + w, y, y + hgt, z1, z1 + w); G.frame.box(x0 - w, x0, y, y + hgt, z0, z1); G.frame.box(x1, x1 + w, y, y + hgt, z0, z1); };

  const done = [];
  for (const m of plan.masses) {
    const r = m.room; if (!r || r.kind === 'hall') continue;
    const top = m.top, w = m.x1 - m.x0, d = m.z1 - m.z0;
    // 1. Over a gallery's roof-light: a low glass lantern, on the pane.
    if (m.glass) { const g = m.glass; hip(G.glass, g.x0 + 0.05, g.x1 - 0.05, g.z0 + 0.05, g.z1 - 0.05, top + 0.33, 0.42); kerb(g.x0, g.x1, g.z0, g.z1, top, 0.36, 0.12); continue; }
    const whole = (m.roofs || []).length === 1 && Math.abs((m.roofs[0].x1 - m.roofs[0].x0) - w) < 0.2 && Math.abs((m.roofs[0].z1 - m.roofs[0].z0) - d) < 0.2;
    if (!whole || busy(m.x0, m.x1, m.z0, m.z1, top, 0.5)) continue;
    const long = Math.max(w, d), short = Math.min(w, d), east = m.x0 > plan.grounds.rail.x1;
    // 2. The school's sawtooth north-lights: long bays side by side, east of the railway.
    if (east && r.kind === 'room' && long > 28 && short > 7 && short < 12 && m.x0 > 210) {
      const H = 2.3, z0 = m.z0 + 0.25, z1 = m.z1 - 0.25, x0 = m.x0 + 0.3, x1 = m.x1 - 0.3, sl = Math.hypot(H, z1 - z0), ny = (z1 - z0) / sl, nz = -H / sl;
      G.metal.quad([x0, top + 0.12, z0], [x0, top + H, z1], [x1, top + H, z1], [x1, top + 0.12, z0], [0, ny, nz], [[0, 0], [0, sl / 0.5], [(x1 - x0) / 0.5, sl / 0.5], [(x1 - x0) / 0.5, 0]]);
      G.glass.quad([x0, top + 0.5, z1], [x1, top + 0.5, z1], [x1, top + H - 0.1, z1], [x0, top + H - 0.1, z1], [0, 0, 1], [[0, 0], [(x1 - x0) / 1.2, 0], [(x1 - x0) / 1.2, 1], [0, 1]]);
      G.frame.box(x0, x1, top, top + 0.5, z1 - 0.12, z1 + 0.02); G.frame.box(x0, x1, top + H - 0.1, top + H + 0.06, z1 - 0.2, z1 + 0.06);
      for (const x of [x0, x1]) G.frame.quad([x, top, z0], [x, top, z1], [x, top + H, z1], [x, top + 0.12, z0], [x === x0 ? -1 : 1, 0, 0]);
      O.push({ x0: m.x0, x1: m.x1, z0: m.z0, z1: m.z1, y0: top, y1: top + H });
      done.push(m); continue;
    }
    // 3. Solar arrays on the long flat bays south of that.
    if (east && r.kind === 'room' && long > 28 && short > 7 && short < 12) {
      const x0 = m.x0 + 1.4, x1 = m.x1 - 1.4, z0 = m.z0 + 1.1, z1 = m.z1 - 1.1, y = top + 0.05;
      G.solar.quad([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0], [0, 1, 0], [[0, 0], [0, (z1 - z0) / 1.6], [(x1 - x0) / 1.6, (z1 - z0) / 1.6], [(x1 - x0) / 1.6, 0]]);
      done.push(m); continue;
    }
    // 4. A long glass monitor down the middle of a long narrow roof: the old building's top-lit corridors.
    if (long > 30 && short >= 5 && short < 12) {
      const alongZ = d > w, c = alongZ ? (m.x0 + m.x1) / 2 : (m.z0 + m.z1) / 2, hw = Math.min(1.5, short * 0.24), e = 3, y = top + 0.3;
      const b = alongZ ? [c - hw, c + hw, m.z0 + e, m.z1 - e] : [m.x0 + e, m.x1 - e, c - hw, c + hw];
      G.frame.box(b[0] - 0.1, b[1] + 0.1, top, y, b[2] - 0.1, b[3] + 0.1); hip(G.glass, b[0], b[1], b[2], b[3], y, 0.75, 0.8);
      O.push({ x0: b[0] - 0.1, x1: b[1] + 0.1, z0: b[2] - 0.1, z1: b[3] + 0.1, y0: top, y1: y + 0.75 });
      done.push(m); continue;
    }
    // 5. On a big plain roof: rows of small lanterns, as on the Rice Building; or failing that, the plant.
    if (short >= 14) {
      const nx = Math.max(1, Math.floor(w / 9)), nz = Math.max(1, Math.floor(d / 9)), lw = 4.2, ld = 2.6;
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        const cx = m.x0 + (i + 0.5) * w / nx, cz = m.z0 + (j + 0.5) * d / nz, b = d > w ? [cx - ld / 2, cx + ld / 2, cz - lw / 2, cz + lw / 2] : [cx - lw / 2, cx + lw / 2, cz - ld / 2, cz + ld / 2];
        G.frame.box(b[0] - 0.08, b[1] + 0.08, top, top + 0.3, b[2] - 0.08, b[3] + 0.08); hip(G.glass, b[0], b[1], b[2], b[3], top + 0.3, 0.7, 0.7);
        O.push({ x0: b[0] - 0.08, x1: b[1] + 0.08, z0: b[2] - 0.08, z1: b[3] + 0.08, y0: top, y1: top + 1.0 });
      }
      done.push(m); continue;
    }
    // 6. Otherwise, now and then, a cooling unit with its fan.
    if (short >= 7 && ((Math.round(m.x0 * 7 + m.z0 * 13)) % 3 === 0)) {
      const cx = m.x0 + w * 0.5, cz = m.z0 + d * 0.5, b = [cx - 1.1, cx + 1.1, cz - 0.7, cz + 0.7];
      G.frame.box(b[0], b[1], top + 0.12, top + 1.25, b[2], b[3]); G.dark.box(b[0] + 0.15, b[1] - 0.15, top + 1.25, top + 1.3, b[2] + 0.12, b[3] - 0.12); G.dark.box(b[0] - 0.02, b[1] + 0.02, top + 0.45, top + 0.95, b[2] + 0.2, b[3] - 0.2);
      for (const sx of [-0.8, 0.8]) for (const sz of [-0.5, 0.5]) G.dark.box(cx + sx - 0.06, cx + sx + 0.06, top, top + 0.12, cz + sz - 0.06, cz + sz + 0.06);
      O.push({ x0: b[0], x1: b[1], z0: b[2], z1: b[3], y0: top, y1: top + 1.3 });
      done.push(m);
    }
  }
  const mats = { glass, solar, metal, frame, dark };
  for (const k in G) if (!G[k].empty) { const mesh = G[k].mesh(mats[k]); mesh.matrixAutoUpdate = false; mesh.updateMatrix(); group.add(mesh); }
  return { count: done.length };
}
