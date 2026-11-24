// The lit-route cases the plan itself knows where to find (run in the page by routeprobe.mjs and routedrive.mjs, with
// the building unlocked): [name, fx, fz, tx, tz, fy, ty] each. A hilltop, the sled hill's top, the lighthouse by the
// marked way and the floes, a floe, a table top by its ramp, the bridgeway's deck, a roof by the scaffold, the foot of
// the staff vent's duct and back up it, a room on another floor by the stairs, a room with kit in it, a jump indoors.
export async function moreCases() {
  const G = window.__ah, P = G.plan, plan = await import('./src/plan.js');
  const top = (x, z, y = 40) => { const u = P.under, g = plan.groundAt(P, x, z, y); P.under = u; return g; };
  const mid = id => { const r = P.byId[id]; return r ? [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, r.y] : null; };
  const L = [], add = (name, f, t) => { if (f && t) L.push([name, f[0], f[1], t[0], t[1], f[2] ?? top(f[0], f[1], 3), t[2] ?? top(t[0], t[1], 3)]); };
  const big = (P.hills || []).slice().sort((a, b) => b.H - a.H);
  if (big[1]) add('hilltop', [big[1].cx - big[1].rx - 20, big[1].cz], [big[1].cx + 3, big[1].cz + 1, top(big[1].cx + 3, big[1].cz + 1)]);
  if (big[0]) add('sled-hill-top', [big[0].cx - big[0].rx - 3, big[0].cz - big[0].rz - 14], [big[0].cx, big[0].cz, top(big[0].cx, big[0].cz)]);
  const K = P.lakefront;
  if (K && K.light) { add('lighthouse', [K.lsd.x0 - 10, 70], [K.light.x, K.light.z + 6, top(K.light.x, K.light.z + 6)]); const f = K.floes.filter(q => q.route)[1]; if (f) add('floe', [K.shore + 10, 100], [f.hx, f.hz, f.top]); }
  // a table of snow with a plain ramp up to it
  const tb = P.surfaces.find(s => s.skin === 'snow' && !s.axis && !s.hill && s.h0 > 1.5 && s.h0 < 2.5 && P.surfaces.some(q => q.skin === 'snow' && q.axis === 'x' && !q.curve && Math.abs(q.x1 - s.x0) < 0.05 && q.h1 === s.h0 && q.h0 === 0));
  if (tb) add('table-top', [tb.x0 - 16, tb.z0 - 6], [(tb.x0 + tb.x1) / 2, (tb.z0 + tb.z1) / 2, tb.h0]);
  const D = G.museum.mw && G.museum.mw.deck; if (D) { const z = (D.z0 + D.z1) / 2 + 4, x = D.cx(z); add('bridgeway-deck', [x - 3, P.bounds.z0 + 12], [x, z, top(x, z)]); }
  if (P.scaffold) add('roof', [P.scaffold.x - 12, P.scaffold.z + 26], [P.scaffold.x + 6, P.scaffold.z - 13, top(P.scaffold.x + 6, P.scaffold.z - 13)]);
  const V = P.staffVent; if (V) { add('duct-foot', [V.bin.land.x + 3, V.zc + 4], [V.x0 - 1.6, V.zc, V.y]); add('up-the-duct', [V.x0 - 4, V.zc + 1, V.y], [V.bin.land.x + 0.5, V.zc]); }
  const C = (P.heistConsoles || [])[0]; if (V && C) add('duct-to-button', [V.bin.land.x + 3, V.zc + 4], [C.x + 1.2, C.z, C.y]);
  add('upstairs', mid('G200'), mid('G283')); add('room-with-kit', mid('G150'), mid('G161'));
  if (P.locked) G.museum.setLocked(false, false);
  G.nav.goTo({ x: 300, y: 0, z: 100, label: 'warm' }); const nav = G.nav.nav;      // (a test aid on the map: the ways it has worked out)
  if (nav) for (const [key, J] of nav.jumps) { const [a, c] = key.split(':').map(Number), A = nav.nodes[a], B = nav.nodes[c]; if (A.place[0] !== 'R' || J.gap < 0.3) continue; const ux = B.x - A.x, uz = B.z - A.z, l = Math.hypot(ux, uz); add('jump-indoors', [A.x - ux / l * 1.2, A.z - uz / l * 1.2, A.y], [B.x + ux / l * 1.5, B.z + uz / l * 1.5, B.y]); break; }
  G.nav.clear();
  return L;
}
// The eight the route was first measured on (out of doors, on the ground at both ends).
export const FIRST = [['over-big-hill', 200, 224, 280, 224], ['sled-hill', 310, 163, 375, 163], ['field-banks', 300, 40, 460, 90], ['to-lighthouse', 470, 70, 590, 60], ['bin-yard', 140, 30, 99, 4], ['fence', 330, 60, 400, 100], ['jump-park', 240, 62, 290, 62], ['windrow-x', 470, 120, 520, 120]];
