// Project Green Cheese, on paper (docs/FINALE.md, phase 1): what of the base under Butler Field is not a room.
//
// The rooms are in the layout (tools/build_layout.mjs, section 8a: the tunnel, the base's two storeys, the hangar and
// the archive, all `secret`, all `B-`). This file is what stands in them and round them that the toy runs into or
// drives on, so that src/finale.js only has to draw it:
//   * the silo: a 32 m square in the ballfield's centre field (plan.grounds.silo), straight over the hangar. It is a
//     permanent hole in the snow (plan.js groundOpenings) and a pit (the street is no floor in it). Two snow-covered
//     doors lie over it, each a drivable surface; opened, they drop a little and slide apart under the field. Below
//     them the shaft, walled, drops to the hole in the hangar's ceiling.
//   * the blast door in the Debriefing room's east wall: solid until the card opens it (a gate, as the lifts have).
//   * the glass of the control room's window, the turnstiles and the dead robot at the checkpoint, the easels.
//   * the saucer on its launch platform, with its ramp: the platform, the cabin floor, the hull's walls and roof, the
//     legs. Every piece of it is kept with its height off the platform, so that it can be lifted with the platform
//     (setPlatform) or with the craft alone (setCraft).
//
// No three.js and no DOM in here: it runs in node (tools/check_layout.mjs builds the plan).

export const SILO_SIZE = 32;
// The craft, in metres off the top of its platform. R: across the rim; floor: the cabin floor; rim: the top of the
// rim band; dome: where the dome sits on the hull, and its radius; top: the crown. Its door and ramp face -x (west),
// towards the archive.
export const CRAFT = { R: 8, floor: 2.8, rim: 2.9, rimLow: 2.45, belly: 1.2, bellyR: 3.2, skirtR: 6.2, skirtY: 2.0, domeY: 3.95, domeR: 3.6, top: 7.4, cabinR: 7.0, legR: 5.6, rampLen: 8.6, rampW: 1.9, door: 0.125, pad: 9.5 };
// How far a door drops before it slides, and how far it slides (each its own half of the square, out under the field).
export const DOOR = { drop: 0.36, thick: 0.3 };

const hullY = r => { const C = CRAFT, t = Math.max(0, Math.min(1, (r - C.domeR) / (C.R - C.domeR))); return C.rim + (C.domeY - C.rim) * (1 - t * t); };
export { hullY };

export function addFinale(plan) {
  const H = plan.byId['B-hangar'], brief = plan.byId['X-brief'];
  if (!H || !plan.grounds) return;
  const S = plan.surfaces, O = plan.obstacles, fl = H.y;
  // The silo square: centred over the hangar. The ballfield (butlerfield.js) is laid round it; if it has already said where
  // its centre field is, that must be this square, since the hangar is in the layout.
  const cx = (H.x0 + H.x1) / 2, cz = (H.z0 + H.z1) / 2, h = SILO_SIZE / 2;
  const sq = { x0: cx - h, x1: cx + h, z0: cz - h, z1: cz + h };
  const G = plan.grounds;
  if (G.silo && (Math.abs(G.silo.x0 - sq.x0) > 0.5 || Math.abs(G.silo.z0 - sq.z0) > 0.5)) console.warn('plan.grounds.silo is not over the hangar: using the hangar\'s', G.silo, sq);
  G.silo = { ...sq, cx, cz, y: 0 };
  const F = plan.finale = { silo: G.silo, hangar: H.id, cx, cz, fl, doorsK: 0, platformLift: 0, craftLift: 0 };

  // ---- the silo doors: two halves, west and east, each sliding away from the middle
  F.doors = ['w', 'e'].map(side => {
    const s = { skin: 'silo', silo: side, fixed: true, slab: true, moves: true /* setDoors() slides it: in no square of the plan's grid */, axis: null, x0: side === 'w' ? sq.x0 : cx, x1: side === 'w' ? cx : sq.x1, z0: sq.z0, z1: sq.z1, h0: 0, h1: 0, thick: DOOR.thick };
    S.push(s); plan.slabs.push(s);
    return s;
  });
  plan.pits.push({ ...sq, silo: true });                // the street is no floor over it: only the doors are
  (plan.shafts = plan.shafts || []).push({ ...sq, room: H.id });      // and the hangar has no ceiling under it (museum.js)
  // The shaft: open air from the hangar's ceiling up to the underside of the doors (or the sky, once they open), its walls solid
  // (underground, outdoors is anywhere: the walls are what keep the toy in it).
  F.shaft = { ...sq, y0: H.y + H.h - 2.2, y1: -DOOR.thick - 0.02, silo: true };
  plan.boxes.push(F.shaft);
  const T = 0.3, wy0 = H.y + H.h - 0.6, wy1 = -0.06;
  for (const [x0, x1, z0, z1] of [[sq.x0 - T, sq.x1 + T, sq.z0 - T, sq.z0], [sq.x0 - T, sq.x1 + T, sq.z1, sq.z1 + T], [sq.x0 - T, sq.x0, sq.z0, sq.z1], [sq.x1, sq.x1 + T, sq.z0, sq.z1]]) O.push({ x0, x1, z0, z1, y0: wy0, y1: wy1, silo: true });
  F.setDoors = k => setDoors(plan, k);

  // ---- the blast door: shut, and solid, until the card opens it
  const bd = plan.doors.find(d => d.blast);
  if (bd) {
    const gate = { off: false };
    const o = { x0: bd.x0 - 0.05, x1: bd.x1 + 0.05, z0: bd.z0, z1: bd.z1, y0: bd.y, y1: bd.y + bd.h, gate, blast: true };
    O.push(o);
    F.blast = { door: bd, gate, solid: o, x: (bd.x0 + bd.x1) / 2, y: bd.y, z: (bd.z0 + bd.z1) / 2 };
  }
  // Somewhere for the card and the tunnel's map in the Debriefing room: the wall north of the blast door (src/finalefit.js stands them there).
  if (brief && bd) F.brief = brief.id;

  // ---- the control room's window: glass across the long opening, the gantry door beside it open
  const win = plan.doors.find(d => d.window && (d.a === 'B-ctrl' || d.b === 'B-ctrl'));
  if (win) { const zm = (win.z0 + win.z1) / 2; O.push({ x0: win.x0, x1: win.x1, z0: zm - 0.05, z1: zm + 0.05, y0: win.y, y1: win.y + win.h, glass: true }); F.window = win; }

  // ---- the checkpoint: a line of barriers across the room with a turnstile lane, and the robot that was on duty
  const ck = plan.byId['B-check'];
  if (ck) {
    const bx = ck.x1 - 4, lane = [74.4, 75.8];
    F.check = { x: bx, lane, robot: { x: ck.x0 + 6.2, z: ck.z1 - 7.5 } };
    O.push({ x0: bx - 0.1, x1: bx + 0.1, z0: ck.z0 + 0.05, z1: lane[0], y0: ck.y, y1: ck.y + 1.1, check: true }, { x0: bx - 0.1, x1: bx + 0.1, z0: lane[1], z1: ck.z1 - 0.05, y0: ck.y, y1: ck.y + 1.1, check: true });
    // (the turnstile's arm, over the lane, is above a toy car: it stops only a drone flying low through it)
    O.push({ x0: bx - 0.08, x1: bx + 0.08, z0: lane[0], z1: lane[1], y0: ck.y + 0.82, y1: ck.y + 1.0, check: true });
    const r = F.check.robot; O.push({ x0: r.x - 0.45, x1: r.x + 0.45, z0: r.z - 0.45, z1: r.z + 0.45, y0: ck.y, y1: ck.y + 0.9 });
  }

  // ---- the archive: twenty easels (the craft carries twenty pictures), in four rows facing the hangar, the middle of the
  // room left clear to drive down
  const ar = plan.byId['B-archive'];
  F.easels = [];
  if (ar) for (const x of [ar.x0 + 7, ar.x0 + 13, ar.x0 + 19, ar.x0 + 25, ar.x0 + 31]) for (const z of [ar.z0 + 5, ar.z0 + 10.5, ar.z1 - 10.5, ar.z1 - 5]) {
    F.easels.push({ x, z, y: ar.y, face: 1 });
    O.push({ x0: x - 0.32, x1: x + 0.32, z0: z - 0.5, z1: z + 0.5, y0: ar.y, y1: ar.y + 2.3, easel: true });
  }

  // ---- the platform and the craft on it
  const C = CRAFT, pieces = F.pieces = [];      // { o, kind: 'surface' | 'obstacle', on: 'platform' | 'craft', at: heights off the platform top }
  const surf = (s, on) => { s.fixed = true; s.slab = !!s.thick; S.push(s); if (s.slab) plan.slabs.push(s); pieces.push({ o: s, kind: 'surface', on, h0: s.h0 - fl, h1: s.h1 - fl }); return s; };
  const obst = (o, on) => { O.push(o); pieces.push({ o, kind: 'obstacle', on, y0: o.y0 - fl, y1: o.y1 - fl }); return o; };
  // A disc (or a ring, r0 to r1) as a few rectangles, a row every `step`, each as wide as the disc is across the row's middle.
  const disc = (r0, r1, step, make) => {
    const n = Math.max(1, Math.round(2 * r1 / step)), st = 2 * r1 / n;
    for (let i = 0; i < n; i++) {
      const za = -r1 + i * st, zb = za + st, zm = (za + zb) / 2, w1 = Math.sqrt(Math.max(0, r1 * r1 - zm * zm));
      if (w1 < 0.3) continue;
      const w0 = Math.abs(zm) < r0 ? Math.sqrt(r0 * r0 - zm * zm) : 0;      // (a ring leaves out what is inside r0)
      if (w0 > 0) { if (w1 - w0 > 0.2) { make(cx - w1, cx - w0, cz + za, cz + zb); make(cx + w0, cx + w1, cz + za, cz + zb); } }
      else make(cx - w1, cx + w1, cz + za, cz + zb);
    }
  };
  // The platform: a pad flush with the hangar floor (raised, a column down to the floor).
  disc(0, C.pad, 2.4, (x0, x1, z0, z1) => surf({ skin: 'pad', pad: true, x0, x1, z0, z1, axis: null, h0: fl + 0.03, h1: fl + 0.03, thick: 0.03 }, 'platform'));
  const P = fl + 0.03;      // the platform's top: everything of the craft is measured from it
  F.platformTop = P;
  // The cabin floor, its slab down to the belly; at the door a threshold out to the top of the ramp.
  disc(0, C.cabinR, 1.0, (x0, x1, z0, z1) => surf({ skin: 'craft', craft: 'floor', x0, x1, z0, z1, axis: null, h0: P + C.floor, h1: P + C.floor, thick: C.floor - C.belly }, 'craft'));
  surf({ skin: 'craft', craft: 'floor', x0: cx - C.R + 0.4, x1: cx - C.cabinR + 0.6, z0: cz - C.rampW / 2 - 0.1, z1: cz + C.rampW / 2 + 0.1, axis: null, h0: P + C.floor, h1: P + C.floor, thick: 0.5 }, 'craft');
  // The hull over the cabin's edge, where it comes down low: a ring of wall from the floor up, with the doorway left open.
  const ring = (rad, n, half, y0, y1, gap) => {
    for (let i = 0; i < n; i++) {
      const a = (i + 0.5) / n * Math.PI * 2, d = Math.abs(((a - Math.PI) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      if (gap && d < gap) continue;
      const x = cx + Math.cos(a) * rad, z = cz + Math.sin(a) * rad;
      obst({ x0: x - half, x1: x + half, z0: z - half, z1: z + half, y0, y1, craft: true }, 'craft');
    }
  };
  ring(C.cabinR + 0.35, 44, 0.55, P + C.rimLow - 0.15, P + C.floor + 0.7, C.door + 0.02);
  // The dome: its glass a ring of wall from the hull up, and its crown a roof (for a drone, inside or out).
  ring(C.domeR + 0.1, 28, 0.42, P + C.domeY - 0.05, P + C.top - 0.6, 0);
  disc(0, C.domeR, 1.2, (x0, x1, z0, z1) => surf({ skin: 'craft', craft: 'crown', x0, x1, z0, z1, axis: null, h0: P + C.top - 0.2, h1: P + C.top - 0.2, thick: 0.4 }, 'craft'));
  // The upper hull between the dome and the cabin's edge: a roof over the cabin floor, stepped to follow the hull.
  for (const [r0, r1] of [[C.domeR + 0.3, 5.0], [5.0, 6.2], [6.2, C.cabinR]]) {
    const top = P + hullY((r0 + r1) / 2);
    disc(r0, r1, 1.2, (x0, x1, z0, z1) => surf({ skin: 'craft', craft: 'hull', x0, x1, z0, z1, axis: null, h0: top, h1: top, thick: 0.22 }, 'craft'));
  }
  // Four legs, clear of the ramp.
  for (const a of [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]) { const x = cx + Math.cos(a) * C.legR, z = cz + Math.sin(a) * C.legR; obst({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3, y0: P - 0.03, y1: P + C.belly + 0.4, craft: true, leg: true }, 'craft'); }
  // The ramp, let down from the doorway to the floor (src/finale.js lowers and raises it: up, it is not there to drive on).
  const ramp = F.ramp = surf({ skin: 'craft', craft: 'ramp', moves: true /* setRamp() folds it away by its x0 */, x0: cx - C.R - C.rampLen + 0.4, x1: cx - C.R + 0.4, z0: cz - C.rampW / 2, z1: cz + C.rampW / 2, axis: 'x', h0: fl + 0.02, h1: P + C.floor, thick: 0.12 }, 'craft');
  F.rampDown = { x0: ramp.x0, h0: ramp.h0 };
  F.beam = { x: cx, z: cz, y: P + C.belly - 0.05 };      // the port under the craft the beam comes from
  F.console = null;                                    // where the tone console stands (src/finalefit.js leaves a mark; src/finale.js reads it)
  F.setPlatform = y => setPlatform(plan, y);
  F.setCraft = y => setCraft(plan, y);
  F.setRamp = down => setRamp(plan, down);
}

// The doors, k from 0 (shut) to 1 (open): for the first fifth of it they sink, then they slide apart under the field.
// What of each is still over the shaft is its surface; the shaft is open to the sky as soon as they move.
export function setDoors(plan, k) {
  const F = plan.finale; if (!F || !F.doors) return;
  k = Math.max(0, Math.min(1, k)); F.doorsK = k;
  const sq = F.silo, h = (sq.x1 - sq.x0) / 2, sink = Math.min(1, k / 0.2), slide = Math.max(0, (k - 0.2) / 0.8), top = -DOOR.drop * sink, off = h * slide;
  for (const s of F.doors) {
    s.h0 = s.h1 = top;
    if (s.silo === 'w') { s.x0 = sq.x0; s.x1 = sq.x0 + h - off; } else { s.x0 = sq.x0 + h + off; s.x1 = sq.x1; }
    if (s.x1 - s.x0 < 0.02) { s.x1 = s.x0 - 1; }       // gone: nothing is over the shaft
  }
  F.shaft.y1 = k > 0.001 ? 60 : -DOOR.thick - 0.02;
}

// The platform raised `lift` metres off the hangar floor (0: flush with it), and the craft on it, `craftLift` metres over it
// (0: standing on its legs). Every piece moves with them; a raised platform is solid down to the floor, like a lift's car.
export function setPlatform(plan, lift) {
  const F = plan.finale; if (!F) return;
  F.platformLift = lift;
  for (const p of F.pieces) if (p.on === 'platform') { p.o.h0 = F.fl + p.h0 + lift; p.o.h1 = F.fl + p.h1 + lift; p.o.thick = Math.max(0.03, lift + 0.03); }
  setCraft(plan, F.craftLift);
}
export function setCraft(plan, craftLift) {
  const F = plan.finale; if (!F) return;
  F.craftLift = craftLift;
  const up = F.platformLift + craftLift;
  for (const p of F.pieces) {
    if (p.on !== 'craft' || (p.o === F.ramp && F.rampUp)) continue;
    if (p.kind === 'obstacle') { p.o.y0 = F.fl + p.y0 + up; p.o.y1 = F.fl + p.y1 + up; } else { p.o.h0 = F.fl + p.h0 + up; p.o.h1 = F.fl + p.h1 + up; }
  }
  F.beam.y = F.platformTop + up + CRAFT.belly - 0.05;
}
// The ramp: down to the floor, or up into the hull, and then nothing to drive on. (Raise it before lifting the craft.)
export function setRamp(plan, down) {
  const F = plan.finale; if (!F || !F.ramp) return;
  F.rampUp = !down;
  if (down) { F.ramp.x0 = F.rampDown.x0; setCraft(plan, F.craftLift); }
  else F.ramp.x0 = F.ramp.x1 + 5;       // (an empty rectangle, x0 past x1: nothing is ever over it)
}
