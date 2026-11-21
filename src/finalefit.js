// What stands in the base under Butler Field (docs/FINALE.md). Fitted out like everything else back of house, by
// src/furnish.js: the items and recipes here are added to that file's own (src/secretfit.js calls installFinaleFit),
// so they are drawn in the same merged meshes, keep the same aisles and doorways clear and are solid in the same way.
// What cannot be painted boxes (glass and the crystal in it, lettering, the console's pads, the swivel chair, the
// parked robots, the map of the tunnel and the card) is left as a `mark` for src/finale.js to finish.
//
// No three.js and no DOM in here.

// Lettering, by number: what src/finale.js paints into its own small sheet and sticks on at each 'blabel' mark.
export const BLABELS = [
  { t: 'AUTHORISED', s: 'PERSONNEL ONLY', kind: 'sign' }, { t: 'DO NOT FEED', s: 'THE MICE', kind: 'sign' }, { t: 'HIGH VOLTAGE', s: 'AND THEN SOME', kind: 'sign' }, { t: 'ROBOTS', s: 'CHARGE HERE', kind: 'sign' },
  { t: 'RECOVERED', kind: 'stencil' }, { t: 'GREEN CHEESE', kind: 'stencil' }, { t: 'NOT FOR HANGING', kind: 'stencil' }, { t: 'RETURN TO: NOBODY', kind: 'stencil' },
  { t: 'LAUNCH PAD 1', kind: 'stencil' }, { t: 'MIND THE CRAFT', s: 'IT IS VERY OLD', kind: 'sign' }, { t: 'KEEP OUT', s: 'OF THE SILO', kind: 'sign' }, { t: 'PROPERTY OF THE MUSEUM', kind: 'stencil' },
  { t: 'SIT HERE', s: 'AND LOOK OUT', kind: 'sign' }, { t: 'DESTINATION', kind: 'plate' }, { t: 'B2: HANGAR', kind: 'plate' }, { t: 'THIS WAY UP', kind: 'stencil' },
];

export function installFinaleFit({ def, RECIPES, FITOUT, OPTS, C, pick }) {
  const X = { olive: 0x4b5338, oliveD: 0x353b28, haz: 0xd8a418, black: 0x19191b, steel: 0x7c858c, steelD: 0x30353a, alloy: 0xaab4ba, green: 0x4dff8a, violet: 0xb07bff, amber: 0xffb347, red: 0xff4a3a, cyan: 0x6fe8ff, navy: 0x1c2638, cheese: 0x9fd86a };
  const hazard = (g, u0, u1, y0, y1, d) => { const n = Math.max(2, Math.round((u1 - u0) / 0.11)); for (let i = 0; i < n; i++) g.b(u0 + (u1 - u0) * i / n, u0 + (u1 - u0) * (i + 1) / n, y0, y1, d, d + 0.004, i % 2 ? X.black : X.haz); };

  // The tunnel's map on the wall, and the card on a stand in front of it (src/finale.js draws the map and the card).
  def('bMapStand', 1.8, 0.56, (g) => {
    g.b(-0.86, 0.86, 0.5, 1.6, 0, 0.03, X.steelD, 'metal'); g.b(-0.9, 0.9, 0.46, 0.5, 0, 0.05, X.black); g.b(-0.9, 0.9, 1.6, 1.64, 0, 0.05, X.black);
    g.mark('tunnelmap', 0, 0.036, 1.05, { w: 1.62, h: 1.0 });
    // the stand: a steel post and a sloping lid, low enough for a toy to reach
    g.bs(-0.16, 0.16, 0, 0.34, 0.24, 0.5, X.steelD, 'metal'); g.b(-0.24, 0.24, 0.34, 0.38, 0.18, 0.54, X.steel, 'metal');
    g.b(-0.2, 0.2, 0.38, 0.385, 0.22, 0.5, X.green, 'glow');
    g.mark('keycard', 0, 0.36, 0.39, {});
  });
  // The tone console: a long desk under the window, its top sloped towards whoever sits at it. The five pads on it are src/finale.js's.
  def('bToneConsole', 5.0, 1.0, (g, w, r) => {
    const e = w / 2;
    g.bs(-e, e, 0, 0.78, 0, 0.62, X.navy, 'metal'); g.b(-e, e, 0.78, 0.84, -0.02, 0.98, X.steelD, 'metal', true);
    g.s(-e, e, 0.78, 0.84, -0.02, 0.98);
    hazard(g, -e + 0.05, e - 0.05, 0.05, 0.13, 0.621);
    for (let i = 0; i < 9; i++) g.b(-e + 0.25 + i * 0.55, -e + 0.33 + i * 0.55, 0.5, 0.56, 0.62, 0.624, [X.green, X.amber, X.red, X.cyan][i % 4], 'glow');
    g.b(-e + 0.1, e - 0.1, 0.84, 1.3, 0.0, 0.08, X.black); for (let i = 0; i < 6; i++) g.b(-e + 0.2 + i * 0.78, -e + 0.9 + i * 0.78, 0.9, 1.24, 0.08, 0.084, pick(r, [0x1d3a5a, 0x183a2a, 0x2a2a44]), 'glow');
    g.mark('toneconsole', 0, 0.6, 0.86, { w });
  });
  // The chair at it: a footprint only, drawn and turned by src/finale.js.
  def('bSwivel', 0.9, 0.9, (g) => { g.s(-0.3, 0.3, 0, 0.5, 0.15, 0.75); g.mark('swivel', 0, 0.45, 0, {}); });
  // A crystal in a jar: the plinth it stands on and the lid; the glass and what glows in it are src/finale.js's.
  def('bCrystalJar', 1.2, 1.2, (g, w, r, o = {}) => {
    const big = !!o.big, rad = big ? 0.6 : 0.32, h = big ? 1.8 : 0.9 + r() * 0.3, base = 0.32, d = 0.6;
    g.c(0, base / 2, d, rad + 0.09, base, 'y', X.steelD, 'metal', 14); g.c(0, base - 0.02, d, rad + 0.11, 0.04, 'y', X.steel, 'metal', 14);
    hazard(g, -rad - 0.05, rad + 0.05, 0.04, 0.12, d + rad + 0.09);
    g.c(0, base + h + 0.06, d, rad + 0.06, 0.12, 'y', X.steelD, 'metal', 14); g.c(0, base + h + 0.15, d, rad * 0.45, 0.07, 'y', X.steel, 'metal', 10);
    g.c(0, base + 0.012, d, rad - 0.02, 0.02, 'y', o.col === 'violet' ? X.violet : X.green, 'glow', 14);
    g.s(-rad - 0.1, rad + 0.1, 0, base + h + 0.2, d - rad - 0.1, d + rad + 0.1);
    g.mark('crystal', 0, d, base, { r: rad, h, big, col: o.col || pick(r, ['green', 'green', 'violet', 'amber']), cracked: !!o.cracked });
  });
  // A crate of something recovered, stencilled; sometimes another on it.
  def('bCrate', 1.5, 1.0, (g, w, r, o = {}) => {
    const crate = (u0, u1, y0, y1, d0, d1, lab) => {
      const c = r() < 0.6 ? X.olive : C.pine, c2 = c === X.olive ? X.oliveD : C.cardD;
      g.b(u0, u1, y0, y1, d0, d1, c);
      for (const u of [u0, u1 - 0.06]) g.b(u, u + 0.06, y0, y1, d1, d1 + 0.02, c2); g.b(u0, u1, y0, y0 + 0.06, d1, d1 + 0.02, c2); g.b(u0, u1, y1 - 0.06, y1, d1, d1 + 0.02, c2);
      g.mark('blabel', (u0 + u1) / 2, d1 + 0.024, (y0 + y1) / 2, { k: lab, w: Math.min(0.95, u1 - u0 - 0.2), h: Math.min(0.24, (y1 - y0) * 0.4) });
    };
    const cw = 1.0 + r() * 0.4, h = 0.6 + r() * 0.5, cd = 0.6 + r() * 0.3; let top = h;
    crate(-cw / 2, cw / 2, 0, h, 0.02, 0.02 + cd, o.k != null ? o.k : pick(r, [4, 4, 5, 6, 7, 11, 15]));
    if (r() < 0.5) { const h2 = 0.35 + r() * 0.3; crate(-cw / 2 + 0.08, cw / 2 - 0.2, h, h + h2, 0.06, cd - 0.04, pick(r, [4, 6, 7, 15])); top = h + h2; }
    g.s(-cw / 2, cw / 2, 0, top, 0.02, 0.04 + cd);
  });
  // A warning plate on the wall at a toy's height.
  def('bSign', 1.2, 0.04, (g, w, r, o = {}) => { g.b(-0.5, 0.5, 0.45, 1.15, 0, 0.02, X.haz); g.b(-0.52, 0.52, 0.43, 0.45, 0, 0.025, X.black); g.b(-0.52, 0.52, 1.15, 1.17, 0, 0.025, X.black); g.mark('blabel', 0, 0.026, 0.8, { k: o.k != null ? o.k : 0, w: 0.94, h: 0.62 }); });
  // A robot's charging dock: a plate on the floor, a post with its lights; the robot on it is src/finale.js's.
  def('bDock', 1.3, 1.3, (g, w, r) => {
    g.b(-0.6, 0.6, 0, 0.03, 0.05, 1.25, X.steelD, 'metal'); hazard(g, -0.6, 0.6, 0.005, 0.03, 1.25);
    g.bs(-0.2, 0.2, 0, 1.4, 0.0, 0.18, X.steel, 'metal'); g.b(-0.12, 0.12, 1.1, 1.3, 0.18, 0.184, r() < 0.25 ? X.amber : X.green, 'glow');
    g.c(0, 0.6, 0.24, 0.05, 0.12, 'd', X.black, 'matte', 8);
    g.mark('robot', 0, 0.7, 0.03, { asleep: r() < 0.7 });
  });
  // A bunk: two berths in a steel frame, made up the army way.
  def('bBunk', 2.1, 0.95, (g) => {
    for (const u of [-1.0, 1.0]) for (const d of [0.05, 0.9]) g.bs(u - 0.025, u + 0.025, 0, 1.75, d - 0.025, d + 0.025, X.steelD, 'metal');
    for (const y of [0.35, 1.25]) { g.b(-1.0, 1.0, y - 0.05, y, 0.05, 0.9, X.steel, 'metal', true); g.b(-0.98, 0.98, y, y + 0.14, 0.07, 0.88, X.olive); g.b(0.55, 0.92, y + 0.14, y + 0.24, 0.15, 0.8, C.tissue); }
    g.s(-1.0, 1.0, 0.3, 1.75, 0.05, 0.9);
  });
  // What the base runs on: a tall drum in a cage, humming, lit from inside.
  def('bReactor', 3.2, 3.2, (g) => {
    const d = 1.6;
    g.c(0, 0.15, d, 1.5, 0.3, 'y', X.steelD, 'metal', 20); hazard(g, -1.5, 1.5, 0.02, 0.12, d + 1.5);
    g.c(0, 1.6, d, 1.0, 2.6, 'y', X.alloy, 'metal', 20);
    for (const y of [0.7, 1.4, 2.1, 2.8]) g.c(0, y, d, 1.04, 0.1, 'y', X.green, 'glow', 20);
    g.c(0, 3.0, d, 0.5, 0.3, 'y', X.steelD, 'metal', 12);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.c(Math.cos(a) * 1.35, 1.7, d + Math.sin(a) * 1.35, 0.05, 3.2, 'y', X.steel, 'metal', 6); }
    g.s(-1.5, 1.5, 0, 3.3, d - 1.5, d + 1.5);
  });
  // The plan table: the city, the park and the silo on it, lit from underneath (src/finale.js paints the top).
  def('bPlanTable', 4.2, 2.6, (g) => {
    for (const u of [-1.9, 1.9]) for (const d of [0.25, 2.35]) g.bs(u - 0.06, u + 0.06, 0, 0.82, d - 0.06, d + 0.06, X.steelD, 'metal');
    g.b(-2.1, 2.1, 0.82, 0.88, 0.05, 2.55, X.steelD, 'metal', true); g.s(-2.1, 2.1, 0.8, 0.9, 0.05, 2.55);
    g.mark('plantable', 0, 1.3, 0.885, { w: 4.0, d: 2.4 });
  });
  // A wheel of cheese on a little table. It is green.
  def('bCheese', 0.9, 0.9, (g) => { g.bs(-0.4, 0.4, 0, 0.5, 0.05, 0.85, C.woodL); g.c(0, 0.6, 0.45, 0.3, 0.2, 'y', X.cheese, 'glow', 16); g.b(0.05, 0.3, 0.5, 0.7, 0.4, 0.42, X.steelD); });

  // ---- the rooms ----
  RECIPES.bCheck = R => {
    R.walls(['counter', 'monitorWall', 'keyCabinet', ['bSign', 1.2, { k: 0 }], 'lockerRun', 'lockerRun', 'radios', 'extinguisher', 'noticeboard', 'filing'], { gap: 0.4, once: true });
    R.scatter(['stanchions', 'bin'], 2);
    R.services('coldlights', 'tray');
  };
  RECIPES.bLab = R => {
    R.walls(['fumecupboard', 'labBench', 'sink', 'labBench', 'xShelfJars', 'microscopeBench', 'gasBottles', ['bSign', 1.2, { k: 1 }], 'labBench', 'fridge', 'xShelfJars'], { gap: 0.15, once: true });
    R.grid(['xTable', 2.0], { da: 3.4, db: 2.6, face: 'a+', rows: 1 });
    R.scatter(['stool', 'stool', 'xDevice', 'xDevice'], 4);
    R.services('coldlights', 'duct');
  };
  RECIPES.bCrystal = R => {
    const { L, W } = R;
    R.force(['bCrystalJar', 1.6, { big: true, col: 'green' }], L / 2, W * 0.72, 'b-', 1.6);
    R.walls(['xShelfJars', ['bSign', 1.2, { k: 1 }], 'xShelfJars', 'xShelfJars', 'labBench', 'xShelfJars', 'gasBottles', 'xShelfJars'], { gap: 0.2, once: true });
    R.grid(['bCrystalJar', 1.2], { da: 2.6, db: 2.2, face: 'a+', rows: 1, ma: 2 });
    R.putC(['bCrystalJar', 1.2, { cracked: true, col: 'green' }], 2.2, W - 2.4, 'b-', 0.3);       // and one that has been got into
    R.services('coldlights', 'pipes');
  };
  RECIPES.bCrew = R => {
    R.walls(['bBunk', 'bBunk', 'lockerRun', 'bBunk', 'bBunk', 'lockerRun', 'coatstand', 'bBunk', 'bBunk', 'lockerRun'], { walls: 'long', gap: 0.35 });
    R.scatter(['armchair', 'coffeeTable', 'bin', 'armchair'], 4);
    R.services('lights');
  };
  RECIPES.bMess = R => {
    R.walls(['kitchenette', 'fridge', 'vending', 'waterCooler', 'noticeboard', 'kitchenette', 'trayReturn', 'bin'], { gap: 0.3, once: true });
    R.grid(['cafeTable', 1.9, { square: true }], { da: 3.0, db: 3.0, face: 'a+', rows: 2, max: 8 });
    R.scatter(['bCheese'], 1, { gap: 0.6 });
    R.services('lights');
  };
  RECIPES.bPower = R => {
    const { L, W } = R;
    R.force('bReactor', L / 2, W / 2 - 1.6, 'b+', 2.6);
    R.walls(['switchgear', 'transformer', ['bSign', 1.2, { k: 2 }], 'pumpSet', 'tank', 'batteryRack', 'switchgear', 'extinguisher', 'transformer'], { gap: 0.35, once: true });
    R.services('coldlights', 'pipes', 'pipes2', 'tray');
  };
  RECIPES.bBay = R => {
    R.walls([['bSign', 1.2, { k: 3 }], 'bDock', 'bDock', 'bDock', 'bDock', 'bDock', 'bDock', 'bDock', 'bDock'], { walls: 'side0', gap: 1.0, once: true });
    R.walls(['toolchest', 'workbench', 'batteryRack', 'serverRack', 'workbench', 'toolchest', 'extinguisher', 'bCrate'], { gap: 0.4, once: true });
    R.scatter(['trolley', 'rollcage'], 2);
    R.services('coldlights', 'tray');
  };
  RECIPES.bRecords = R => {
    R.grid(['stack', 1, { k: 'archive' }], { da: 1.9, db: 0.95, face: 'a+', fit: true, mb: 0.05, ma: 0.9 });
    R.walls(['filing', 'filing', 'filing', ['bSign', 1.2, { k: 0 }], 'filing', 'cardcatalogue', 'filing'], { gap: 0.1, once: true });
    R.scatter(['booktrolley', 'kickstool'], 2);
    R.services('lights', 'pipes');
  };
  RECIPES.bStores = R => {
    R.walls([['shelf', 1.2, { k: 'boxes' }], 'bCrate', 'crates', ['shelf', 1.2, { k: 'objects' }], 'bCrate', 'gasBottles', 'bCrate', 'crate', 'foldedTables'], { gap: 0.3, skip: 0.2 });
    R.grid('bCrate', { da: 3.4, db: 2.2, face: 'in', rows: 2, skip: 0.3 });
    R.scatter(['pallettruck', 'pallets', 'trolley', 'ladder'], 4);
    R.services('lights', 'pipes');
  };
  RECIPES.bOffice = R => {
    const e = R.quietEnd();
    R.rug(e ? 0.72 : 0.28, 0.5, 4.6, 3.2);
    R.end(['desk', 2.4, { grand: true }], e, 1.2, true);
    R.walls(['bookcase', 'bookcase', 'pictureWall', 'sideboard', 'plant', 'bookcase', 'filing', 'pictureWall', 'noticeboard'], { gap: 0.3, once: true });
    R.scatter(['armchair', 'armchair', 'coffeeTable', 'plant'], 4);
    R.services('lights');
  };
  RECIPES.bSit = R => {
    const { L, W } = R;
    R.force('bPlanTable', L / 2, W / 2 - 1.3, 'b+', 2.4);
    R.walls(['monitorWall', 'noticeboard', 'radios', 'filing', 'serverRack', 'screen', 'filing', ['bSign', 1.2, { k: 0 }]], { gap: 0.4, once: true });
    R.services('coldlights', 'tray');
  };
  RECIPES.bCtrl = R => {
    const { L, W } = R;
    // the console under the window, the chair at it with its back to the room
    for (const a of [L / 2 + 2, L / 2 - 4, L / 2 + 4]) if (R.put(['bToneConsole', 5.0], a, W - 1.75, 'b-')) { R.force('bSwivel', a, W - 3.55, 'b+', 0.5); break; }      // (clear of the way in to each door)
    R.walls(['monitorWall', 'serverRack', 'serverRack', 'radios', 'monitorWall', 'serverRack', 'keyCabinet', ['bSign', 1.2, { k: 12 }]], { walls: 'side0', gap: 0.4, once: true });
    R.walls(['serverRack', 'console', 'extinguisher'], { walls: 'short', gap: 0.4, once: true });
    R.services('coldlights', 'tray');
  };
  RECIPES.bHangar = R => {
    R.walls(['crates', ['bCrate', 1.5, { k: 5 }], 'gasBottles', 'toolchest', 'bCrate', 'tank', 'workbench', ['bSign', 1.2, { k: 9 }], 'sheetRack', 'bCrate', 'crates', 'rollcage', ['bSign', 1.2, { k: 10 }], 'scissorLift'], { gap: 1.4, once: true });
    // (no strip lights: they would run across the hole in the ceiling where the shaft goes up; src/finale.js lights the shaft)
  };
  RECIPES.bArchive = R => {
    R.walls([['rack', 3.2], ['bCrate', 1.5, { k: 4 }], 'crates', ['bCrate', 1.5, { k: 6 }], 'frameRack', ['shelf', 1.2, { k: 'boxes' }], ['bCrate', 1.5, { k: 7 }], 'canvasRack', 'wrappedFurniture', ['bCrate', 1.5, { k: 11 }], 'frameRack'], { gap: 0.5, once: true });
    R.services('lights');
  };
  // The Debriefing room also has the way on: the tunnel's map, and the card, beside the blast door.
  const brief = RECIPES.xBrief;
  RECIPES.xBrief = R => {
    const { W } = R;
    for (const a of [1.5, 1.2, 1.8, 7.5]) if (R.put('bMapStand', a, W, 'b-', 0.05)) break;
    brief(R);
  };
  FITOUT.unshift([/^Security checkpoint$/i, 'bCheck'], [/^Laboratory$/i, 'bLab'], [/^Crystal laboratory/i, 'bCrystal'], [/^Crew quarters/i, 'bCrew'], [/^Mess hall/i, 'bMess'], [/^Generator hall/i, 'bPower'],
    [/^Robot bay/i, 'bBay'], [/^Records room/i, 'bRecords'], [/^Stores$/i, 'bStores'], [/^Office of the Director, special/i, 'bOffice'], [/^Situation room/i, 'bSit'], [/^Control room$/i, 'bCtrl'], [/^Hangar$/i, 'bHangar'], [/^Archive$/i, 'bArchive']);
}
