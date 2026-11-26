// The staff vent, on paper: the bin yard round the back, and the duct from it down to the staff entrance.
//
// Outside the east wall of the old building's north end, over the lower level's "Staff entrance and security desk"
// (BLL-1), is a small service yard: a concrete apron, a timber screen with the dumpster in front of it (the one the
// security robots throw you into, src/guards.js) and, between the dumpster and the wall, a steel hood over an air
// intake whose grille has come off. Through the hood a duct slopes down under the apron and under the wall, about 35
// degrees for 6.6 m, and comes out low in the staff entrance's east wall, pointing straight at the door to the
// corridor: thrown out, you land facing the hood, and it is one slide and a short drive back to the red button
// (src/heist.js). It can be driven up as well as down.
//
// None of it is in the layout and none of it is a room: like the mice's nests (plan.js addNests) it is a few volumes to
// be in, the slope under them, walls either side so that nothing leaves it underground, a lid over it, the hole in the
// plaster where it comes out and the hole in the snow where it goes in (plan.js groundOpenings). src/staffvent.js draws
// exactly this. No three.js and no DOM in here: it runs in node (tools/check_layout.mjs builds the plan).
//
//   plan.staffVent = { room, side, y, zc, z0, z1, W, H, tan, x0 (the room's wall), xf (the wall's outside face), x1 (the mouth),
//     floorAt(x), hood: { x0, x1, z0, z1, top }, hole, leaf, apron, plates, bin: { x, z, nx, nz, land: { x, z } }, screen: [rects], lamp }

export const VENT = { W: 1.1, H: 0.75, RUN: 6.6, HOOD: 0.82, WALL: 0.1, SCREEN: 1.5 };
const DW = 1.9, DD = 1.1;                  // the dumpster (src/guards.js draws it): along its front, and front to back

export function addStaffVent(plan) {
  const r = plan.byId['BLL-1'], T = 1;
  if (!r || !plan.grounds || r.y > -1) return;
  const same = (a, b) => Math.abs(a - b) < 0.03, { W, H, RUN, HOOD, WALL, SCREEN } = VENT;
  // Opposite the door to the corridor, which is the way on to the control room.
  const door = plan.doors.find(d => (d.a === r.id || d.b === r.id) && d.along === 'x' && same(d.x1, r.x0) && same(d.y, r.y));
  const zc = Math.max(r.z0 + 1.4, Math.min(r.z1 - 1.4, door ? (door.z0 + door.z1) / 2 : (r.z0 + r.z1) / 2)), z0 = zc - W / 2, z1 = zc + W / 2;
  const x0 = r.x1, xf = x0 + T, x1 = x0 + RUN, drop = -r.y, tan = drop / RUN, floorAt = x => r.y + (Math.max(x0, Math.min(x1, x)) - x0) * tan;
  const hx0 = x1 - H / tan - 0.14;         // as far back as the duct's lid is above the ground: the hood covers that much of it
  const hood = { x0: hx0, x1, z0: z0 - WALL, z1: z1 + WALL, top: HOOD };
  // The dumpster: facing the hood, so that what it throws out lands in front of the way back in. Its left lid is the one that opens.
  const land = { x: x1 + 1.9, z: zc }, bin = { x: land.x + 1.5 + DD / 2, z: zc + DW / 4, nx: -1, nz: 0, land };
  const sx = bin.x + DD / 2 + 0.32, screen = [
    { x0: sx, x1: sx + 0.08, z0: bin.z - DW / 2 - 0.75, z1: bin.z + DW / 2 + 1.55 },                        // behind it
    { x0: sx - 2.3, x1: sx + 0.08, z0: bin.z + DW / 2 + 1.47, z1: bin.z + DW / 2 + 1.55 },                  // the long return, on the side the bags are put out
    { x0: sx - 0.9, x1: sx + 0.08, z0: bin.z - DW / 2 - 0.75, z1: bin.z - DW / 2 - 0.67 },                  // and a short one
  ];
  const apron = { x0: xf, x1: sx + 0.6, z0: Math.min(z0 - 1.6, bin.z - DW / 2 - 1.3), z1: bin.z + DW / 2 + 2.1 };
  // The ground has to be there, and clear: open, level, nothing built on it.
  const yard = { x0: apron.x0 - 0.2, x1: apron.x1 + 0.4, z0: apron.z0 - 0.4, z1: apron.z1 + 0.4 }, lap = (a, b, m = 0) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.z0 < b.z1 + m && a.z1 > b.z0 - m;
  if (plan.masses.some(m => lap(m, { ...yard, x0: xf + 0.3 })) || plan.obstacles.some(o => o.y0 < 2 && lap(o, yard)) || plan.surfaces.some(s => !s.hill && !s.roof && Math.max(s.h0, s.h1) > -0.2 && lap(s, yard))) return;
  if (plan.rooms.some(q => q !== r && q.y < -0.5 && lap(q, { x0: xf - 0.2, x1: x1 + 0.5, z0: z0 - 0.5, z1: z1 + 0.5 }))) return;      // (nothing else down there in its way)
  if (plan.cut && x1 + 6 > plan.cut.x0) return;

  const S = plan.surfaces, O = plan.obstacles;
  // The slope, in two lengths: all but the top of it is well below the street, and so is nothing to the room over it.
  const xs = x0 + (drop - 0.4) / tan;
  S.push({ skin: 'vent', vent: true, fixed: true, x0, x1: xs, z0, z1, axis: 'x', h0: r.y, h1: floorAt(xs), thick: 0.12 });
  S.push({ skin: 'vent', vent: true, fixed: true, x0: xs, x1, z0, z1, axis: 'x', h0: floorAt(xs), h1: 0, thick: 0.12 });
  // The hood's lid: something to land on, and a ceiling from underneath.
  const lid = { skin: 'vent', fixed: true, slab: true, x0: hood.x0, x1: hood.x1 + 0.12, z0: hood.z0, z1: hood.z1, axis: null, h0: HOOD, h1: HOOD, thick: 0.06, base: HOOD - 0.06 };
  S.push(lid); plan.slabs.push(lid);
  // And the lid of the duct below ground: a ceiling only (it is under the apron, and nothing drives on it from above).
  plan.slabs.push({ vent: true, x0, x1: hood.x0, z0, z1, axis: 'x', h0: r.y + H + 0.1, h1: floorAt(hood.x0) + H + 0.1, thick: 0.1 });
  // Somewhere to be: the whole duct, a little way into the room and a little way out of the mouth (so that what flies can go from one to the other).
  // (In two lengths. Where it goes under the wall and the room above, it is only as high as the duct is: as one volume up to
  // the hood's lid it reached through the floor above, and a car on that floor, in Visitor services, was "in" it and drove
  // out through the wall over the duct, onto the yard.)
  { const xw = xf + 0.6; plan.boxes.push({ x0: x0 - 0.7, x1: xw, z0, z1, y0: r.y, y1: floorAt(xw) + H + 0.1, vent: true }, { x0: xw, x1: x1 + 0.7, z0, z1, y0: floorAt(xw), y1: HOOD - 0.06, vent: true }); }
  // The street is no floor under the hood: the slope is.
  const hole = { x0: hood.x0 - 0.03, x1, z0: z0 - 0.03, z1: z1 + 0.03 };      // (a little under the hood's own sheet all round, so that no edge of snow shows inside it)
  plan.pits.push({ ...hole, vent: true });
  // Its walls. Underground they stop short of the surface, so that nothing up there runs into them; the hood's stand on it.
  for (const [a, b] of [[z0 - WALL, z0], [z1, z1 + WALL]]) {
    O.push({ x0, x1: hood.x0, z0: a, z1: b, y0: r.y - 0.3, y1: -0.1, vent: true });
    O.push({ x0: hood.x0, x1: hood.x1, z0: a, z1: b, y0: floorAt(hood.x0) - 0.3, y1: HOOD, vent: true });
  }
  O.push({ x0: hood.x0 - WALL, x1: hood.x0, z0: hood.z0, z1: hood.z1, y0: 0, y1: HOOD, vent: true });       // the back of the hood (below it the duct goes on)
  // The grille that should be across the mouth: off, and leant against the side of the hood.
  const leaf = { x0: hood.x0 + 0.12, x1: hood.x1 - 0.1, z0: hood.z1 + 0.02, z1: hood.z1 + 0.3, y0: 0, y1: 0.62 };
  O.push({ ...leaf, vent: true });
  // The screen behind the dumpster.
  for (const q of screen) O.push({ ...q, y0: 0, y1: SCREEN, vent: true });
  // Where it comes out: a hole low in the plaster, and the wall either side of it is still wall.
  const wall = plan.walls.find(q => q.room === r && q.side === 'e');
  if (wall) {
    wall.openings.push({ lo: z0, hi: z1, h: H, y: 0, door: { id: 'staffvent', vent: true, nest: true } }); wall.openings.sort((p, q) => p.lo - q.lo);
    wall.segs = wall.segs.flatMap(g => (z1 <= g.lo || z0 >= g.hi ? [g] : [{ lo: g.lo, hi: Math.min(g.hi, z0) }, { lo: Math.max(g.lo, z1), hi: g.hi }].filter(q => q.hi - q.lo > 0.01)));
  }
  // The apron is swept: it grips like a street, the land does not roll under it, and nothing else is set down on it.
  plan.paved.push({ ...apron, yard: true });
  if (plan.reserved) plan.reserved.push(yard);
  plan.staffVent = { room: r.id, side: 'e', y: r.y, zc, z0, z1, W, H, tan, x0, xf, x1, floorAt, hood, hole, leaf, apron, yard, bin, screen,
    plates: { x0: xf + 0.25, x1: hood.x0 - 0.35, z0: z0 - 0.08, z1: z1 + 0.08 },
    keep: { x0: x0 - 1.6, x1: x0, z0: z0 - 0.25, z1: z1 + 0.25 } };
}
