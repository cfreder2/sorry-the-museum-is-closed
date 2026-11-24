// Back of house, fitted out.
//
// The survey says what the rooms behind the galleries ARE (a conservation studio, a crate store, a
// boiler room) but not what stands in them, so everything here is assumed: each room is furnished
// the way a room of that name in a big museum generally is. Nothing in this file was measured.
//
// How it works:
//   * FITOUT, just below, maps a room's name (and failing that its `use`) to a recipe.
//   * A recipe is a few lines that ask for ITEMS (a desk, a painting rack, a boiler) along the walls,
//     in a grid either side of the aisle, or scattered. It never has to think about doors: before it
//     runs, the room marks out what must stay clear, and anything that would not fit is not placed.
//   * What must stay clear: 1.6 m in front of every doorway, an aisle 1.4 m wide down the middle of
//     the room for its whole length, a leg of the same width from each doorway to that aisle, and
//     every stair, ramp, deck, lift and well, with room to get on and off it.
//   * An item draws itself out of boxes and cylinders in its own frame (u across, d out from its
//     back, y up from the floor) and says which parts are solid. Solid parts go into plan.obstacles,
//     the same list the benches, the display cases and the stunt kit's legs use, so a car is stopped
//     by them and so is a drone at that height. A table is legs and a top: the legs stop a car, the
//     top is over its head and stops only a drone.
//   * It is all deterministic: the dice are seeded from the room's id.
//
// No three.js in here. furnish(plan) returns plain arrays (one batch of triangles per material, per
// level, per patch of the building) and src/museum.js turns each batch into one mesh.

import { installSecretFit } from './secretfit.js';
import { assignBoards } from './boardtext.js';

// --------------------------------------------------------------- the map --
//
// First match wins. The pattern is tried against the room's name; `use:` entries at the bottom catch
// whatever is left by its `use`. To furnish a new kind of room, add a line here and, if it needs
// something new to stand in it, an item further down.

export const FITOUT = [
  // -- nothing: ways through, and the public rooms whose contents are the building's own business
  [/^Passage$|stair|^Lift$|Passenger lift|Lobby|^Lift lobby|balcony\)|Corridor South|Vestibule|corridor of the ring|entrance passage|between the restrooms|Learning centre/i, null],

  // -- offices
  [/^Restrooms and member services/i, 'restroom'],
  [/Director's office/i, 'directorsOffice'],
  [/Director's anteroom|School reception/i, 'reception'],
  [/Board room/i, 'boardRoom'],
  [/Seminar|Critique room/i, 'seminar'],
  [/Security control/i, 'securityControl'],
  [/Staff entrance/i, 'staffEntrance'],
  [/Mail room/i, 'mailRoom'],
  [/Curators|office|Registrar$|Finance|Accounts|Human resources|Information technology|Publications|Deputy directors|Membership|Building engineers|Conservation records|faculty/i, 'office'],
  [/Volunteers|Art handlers/i, 'messRoom'],
  [/Member Services/i, 'memberServices'],

  // -- books and paper
  [/Library stacks|Archives|Rare books/i, 'stacks'],
  [/Curatorial library|library annex/i, 'library'],
  [/study room/i, 'studyRoom'],

  // -- art in store
  [/Oversize painting racks|American art store|Contemporary art store|^Art storage$/i, 'paintingStore'],
  [/Prints and drawings storage|Photography store/i, 'flatStore'],
  [/Photography cold store|Cold room/i, 'coldStore'],
  [/Sculpture store|Egyptian|Asian art store/i, 'sculptureStore'],
  [/Arms and armour/i, 'armourStore'],
  [/Textile store/i, 'textileStore'],
  [/Furniture store|decorative arts store/i, 'furnitureStore'],
  [/Crate store/i, 'crateStore'],
  [/Quarantine/i, 'quarantine'],
  [/range \(not public\)|range, north/i, 'generalStore'],

  // -- conservation
  [/varnishing/i, 'varnishing'],
  [/Paintings conservation|Frame conservation|examination room/i, 'paintingsStudio'],
  [/X-ray/i, 'xray'],
  [/science laboratory|Dye laboratory|Microscopy/i, 'laboratory'],
  [/wet room/i, 'wetRoom'],
  [/Paper conservation|Photograph conservation|Scroll mounting|Textile conservation/i, 'paperStudio'],
  [/Ancient art conservation/i, 'objectsStudio'],

  // -- making and moving
  [/Carpentry/i, 'carpentry'],
  [/Paint shop/i, 'paintShop'],
  [/Plexiglas|Mount-making/i, 'plexiShop'],
  [/Exhibition prep|Regenstein Hall/i, 'exhibitionPrep'],
  [/lighting store/i, 'lightingStore'],
  [/Loading dock/i, 'loadingDock'],
  [/Receiving bay|Packing room/i, 'packing'],
  [/Goods lift lobby/i, 'liftLobby'],
  [/Refuse/i, 'refuse'],

  // -- plant
  [/Boiler/i, 'boilerRoom'],
  [/Chiller/i, 'chillerPlant'],
  [/Electrical|switchroom/i, 'switchRoom'],
  [/Server room/i, 'serverRoom'],
  [/Sprinkler/i, 'sprinklerValves'],
  [/Projection booth|Projection and plant/i, 'projectionBooth'],
  [/Plant room|Mechanical plant|Auditorium plant|Service core/i, 'plantRoom'],

  // -- staff
  [/lockers/i, 'lockers'],
  [/Uniform store|Coat store|Checkroom/i, 'coatStore'],
  [/Housekeeping/i, 'housekeeping'],
  [/Chair store|Stage store/i, 'chairStore'],
  [/stock room|Dry goods/i, 'stockRoom'],
  [/Staff canteen/i, 'canteen'],
  [/Dish room/i, 'dishRoom'],
  [/kitchen/i, 'kitchen'],

  // -- the school, and teaching
  [/painting studio/i, 'paintingClass'],
  [/drawing studio/i, 'drawingClass'],
  [/print workshop/i, 'printWorkshop'],
  [/Lecture room/i, 'lectureRoom'],
  [/Learning Center, family/i, 'familyRoom'],
  [/Learning Center/i, 'classroom'],

  // -- the auditoria and what serves them
  [/Auditorium balcony/i, 'auditoriumBalcony'],
  [/green room/i, 'greenRoom'],
  [/Auditorium foyer|entrance hall|Group entrance|Trading Room|Chagall/i, 'foyer'],
  [/Auditorium/i, 'auditorium'],
  [/Backstage/i, 'backstage'],
  [/^Stage/i, 'stage'],

  // -- the public rooms that are not galleries
  [/Restroom/i, 'restroom'],
  [/Shop/i, 'shop'],
  [/Restaurant/i, 'restaurant'],
  [/Café|Cafe/i, 'cafe'],
  [/Terrace/i, 'terrace'],
  [/Service corridor/i, 'serviceCorridor'],

  // -- and by use, for a room whose name says nothing
  ['use:corridor', 'serviceCorridor'], ['use:stair', null], ['use:lift', null], ['use:lobby', null], ['use:balcony', null], ['use:bridge', null],
  ['use:wc', 'restroom'], ['use:shop', 'shop'], ['use:cafe', 'cafe'], ['use:restaurant', 'restaurant'], ['use:kitchen', 'kitchen'],
  ['use:auditorium', 'auditorium'], ['use:education', 'classroom'], ['use:plant', 'plantRoom'], ['use:service', 'plantRoom'],
  ['use:store', 'generalStore'], ['use:lockers', 'lockers'], ['use:checkroom', 'coatStore'], ['use:terrace', 'terrace'], ['use:backofhouse', 'generalStore'],
];

export function fitoutOf(room) {
  if (room.kind !== 'room') return null;
  const name = String(room.gallery || '').replace(/ \d+$/, '');
  if (room.passage && !/Service corridor/i.test(name)) return null;        // a way through is left clear
  for (const [pat, recipe] of FITOUT) {
    if (typeof pat === 'string' ? pat === 'use:' + room.use : pat.test(name)) return recipe;
  }
  return null;
}

// ------------------------------------------------------------ the recipes --
//
// `R` is the room. What a recipe can ask of it:
//   R.walls(items, opts)   line items up with their backs to the walls ('all', 'long', 'short', 'end0', 'end1', 'side0', 'side1')
//   R.grid(item, opts)     rows either side of the aisle: `da` apart along the room, `db` apart across it
//   R.scatter(items, n)    here and there, wherever there is room
//   R.end(item, which)     one thing in the middle of an end wall
//   R.services(...)        what hangs from the ceiling: pipes, ducts, cable trays, strip lights
// An item is a name from ITEMS, or [name, width, options].

const RECIPES = {
  office(R) {
    R.grid('desk', { da: 2.3, db: 2.2, face: 'out', rows: 2 });
    R.walls(['bookcase', 'filing', 'filing', 'plant', 'noticeboard', 'printer', 'filing', 'coatstand', 'bookcase', 'whiteboard', 'filing', 'pictureWall'], { skip: 0.2, gap: 0.2 });
    R.scatter(['bin', 'bin', 'plant'], 3);
    R.services('lights');
  },
  directorsOffice(R) {
    const e = R.quietEnd();
    R.rug(e ? 0.72 : 0.28, 0.5, 4.2, 3);
    if (R.end(['desk', 2.2, { grand: true }], e, 1.0, true)) R.room.desk = R.last;      // where the Director's desk is, for its drawer (src/nests.js)
    R.walls(['bookcase', 'bookcase', 'pictureWall', 'sofa', 'plant', 'bookcase', 'sideboard', 'pictureWall'], { gap: 0.25 });
    R.scatter(['armchair', 'armchair', 'coffeeTable', 'plant'], 4);
    R.services('lights');
  },
  reception(R) {
    R.end('counter', R.quietEnd(), 1.4);
    R.walls(['sofa', 'plant', 'noticeboard', 'filing', 'sofa', 'brochures', 'plant', 'coatstand'], { gap: 0.3 });
    R.scatter(['coffeeTable', 'plant'], 2);
    R.services('lights');
  },
  boardRoom(R) {
    R.grid(['meetingTable', 2.4, { grand: true }], { da: 2.4, db: 4, face: 'b+', centre: true, ma: 1.8 });
    R.walls(['sideboard', 'pictureWall', 'plant', 'pictureWall', 'sideboard', 'screen'], { gap: 0.6 });
    R.services('lights');
  },
  seminar(R) {
    R.grid(['meetingTable', 2.0], { da: 2.0, db: 3.4, face: 'b+', centre: true, ma: 2.2 });
    R.walls(['whiteboard', 'pinboard', 'pinboard', 'bookcase', 'pinboard', 'stackedChairs', 'pinboard'], { gap: 0.4 });
    R.services('lights');
  },
  securityControl(R) {
    R.end('monitorWall', R.quietEnd(), 0);
    R.grid('console', { da: 2.0, db: 2.2, face: R.quietEnd() ? 'a-' : 'a+', rows: 1, max: 4, ...R.back(1.2, 2) });
    R.walls(['keyCabinet', 'lockerRun', 'radios', 'filing', 'serverRack', 'noticeboard', 'extinguisher'], { gap: 0.3 });
    R.services('lights', 'tray');
  },
  staffEntrance(R) {
    R.walls(['counter', 'turnstile', 'noticeboard', 'lockerRun', 'bench', 'extinguisher', 'keyCabinet', 'lockerRun', 'plant'], { gap: 0.4 });
    R.scatter(['stanchions', 'bin'], 2);
    R.services('lights', 'tray');
  },
  mailRoom(R) {
    R.walls(['pigeonholes', 'pigeonholes', 'workbench', ['shelf', 1.2, { k: 'boxes' }], 'pigeonholes', 'printer', ['shelf', 1.2, { k: 'boxes' }]], { gap: 0.1 });
    R.grid(['worktable', 2.2, { k: 'parcels' }], { da: 3, db: 2.4, face: 'a+', rows: 1 });
    R.scatter(['rollcage', 'trolley', 'parcels', 'bin'], 5);
    R.services('lights');
  },
  messRoom(R) {
    R.grid(['cafeTable', 1.9, { square: true }], { da: 2.6, db: 2.6, face: 'a+', rows: 1, max: 6 });
    R.walls(['lockerRun', 'kitchenette', 'fridge', 'sofa', 'noticeboard', 'lockerRun', 'toolchest', 'bin'], { gap: 0.2 });
    R.scatter(['trolley', 'aframe'], 2);
    R.services('lights');
  },
  memberServices(R) {
    R.end(['counter', 3.2], R.quietEnd(), 1.5);
    R.walls(['brochures', 'sofa', 'plant', 'pictureWall', 'brochures', 'sofa', 'plant'], { gap: 0.5 });
    R.scatter(['stanchions', 'stanchions', 'plant'], 3);
  },

  stacks(R) {
    const kind = /Archives/i.test(R.name) ? 'archive' : 'books';
    R.grid(['stack', 1, { k: kind, cage: /Rare/i.test(R.name) }], { da: 1.9, db: 0.95, face: 'a+', fit: true, mb: 0.05, ma: 0.6 });
    R.scatter(['booktrolley', 'kickstool', 'booktrolley'], 3);
    R.services('lights', 'pipes');
  },
  library(R) {
    R.walls(['bookcase', 'bookcase', 'bookcase', 'bookcase', 'cardcatalogue', 'bookcase', 'bookcase'], { gap: 0.02 });
    R.grid(['readingTable', 2.4], { da: 3.4, db: 2.6, face: 'a+', rows: 1 });
    R.scatter(['booktrolley', 'kickstool', 'armchair'], 3);
    R.services('lights');
  },
  studyRoom(R) {
    R.grid(['readingTable', 2.4, { study: true }], { da: 3.4, db: 2.6, face: 'a+', rows: 1 });
    R.walls(['planchest', 'planchest', 'bookcase', ['shelf', 1.2, { k: 'archive' }], 'planchest', 'easel', 'bookcase'], { gap: 0.15 });
    R.scatter(['booktrolley', 'armlamp'], 2);
    R.services('lights');
  },

  paintingStore(R) {
    R.walls([['rack', 3.2]], { walls: 'long', gap: 0.5 });
    R.walls([['shelf', 1.2, { k: 'boxes' }], 'planchest', 'crate'], { walls: 'short', gap: 0.2 });
    R.grid(['rack', 3.2], { da: 3.8, db: 4.4, face: 'in', mb: 3.4 });
    R.scatter(['aframe', 'trolley', 'ladder'], 3);
    R.services('lights', 'duct');
  },
  flatStore(R) {
    R.grid('planchest', { da: 2.3, db: 1.4, face: 'a+', ma: 0.8, mb: 0.65 });
    R.walls([['shelf', 1.2, { k: 'archive' }]], { gap: 0.03 });
    R.scatter(['booktrolley', 'kickstool'], 2);
    R.services('lights', 'duct');
  },
  coldStore(R) {
    R.walls([['shelf', 1.2, { k: /Photo/i.test(R.name) ? 'archive' : 'food', cold: true }]], { walls: 'long', gap: 0.03 });
    R.end('evaporator', R.quietEnd(), 0);
    R.scatter(/Photo/i.test(R.name) ? ['freezer', 'booktrolley', 'freezer'] : ['rollcage', 'crates', 'rollcage', 'trolley'], 4);
    R.services('coldlights');
  },
  sculptureStore(R) {
    R.grid('palletFigure', { da: 1.9, db: 1.6, face: 'in', rows: 2, skip: 0.12 });
    R.walls([['shelf', 1.2, { k: 'objects' }], ['shelf', 1.2, { k: 'objects' }], 'crate'], { gap: 0.1 });
    R.scatter(['pallettruck', 'crate', 'trolley'], 3);
    R.services('lights', 'duct');
  },
  armourStore(R) {
    R.grid('armourStand', { da: 1.3, db: 1.3, face: 'in', rows: 1 });
    R.walls([['shelf', 1.2, { k: 'objects' }], 'swordRack', 'planchest', ['shelf', 1.2, { k: 'boxes' }], 'swordRack'], { gap: 0.1 });
    R.scatter(['crate', 'trolley'], 2);
    R.services('lights');
  },
  textileStore(R) {
    R.walls(['rollRack', 'rollRack', 'planchest', ['shelf', 1.2, { k: 'linen' }]], { gap: 0.1 });
    R.grid('planchest', { da: 1.6, db: 1.2, face: 'in', rows: 1, skip: 0.2 });
    R.scatter(['mannequin', 'mannequin', 'trolley'], 3);
    R.services('lights');
  },
  furnitureStore(R) {
    R.walls([['shelf', 1.2, { k: 'objects' }], 'wrappedFurniture', 'wrappedFurniture', ['shelf', 1.2, { k: 'boxes' }], 'crate'], { gap: 0.2 });
    R.grid('wrappedFurniture', { da: 2.2, db: 1.8, face: 'in', rows: 1, skip: 0.2 });
    R.scatter(['trolley', 'crate'], 2);
    R.services('lights');
  },
  crateStore(R) {
    R.walls(['crates', 'crates', 'crate', 'crates', 'sheetRack'], { gap: 0.25 });
    R.grid('crates', { da: 2.6, db: 2, face: 'in', rows: 1, skip: 0.3 });
    R.scatter(['pallettruck', 'crate', 'pallets', 'ladder', 'pallettruck'], 5);
    R.services('lights', 'pipes');
  },
  quarantine(R) {
    R.walls(['freezer', 'freezer', 'crate', ['shelf', 1.2, { k: 'objects' }], 'sink', 'freezer'], { gap: 0.4 });
    R.grid(['worktable', 2.2, { k: 'wrapped' }], { da: 4.5, db: 2.4, face: 'a+', rows: 1 });
    R.scatter(['crate', 'palletFigure', 'trolley'], 4);
    R.services('lights', 'duct');
  },
  generalStore(R) {
    R.walls([['shelf', 1.2, { k: 'boxes' }], ['shelf', 1.2, { k: 'boxes' }], 'crates', ['shelf', 1.2, { k: 'objects' }], 'stackedChairs', 'crate', 'planchest', 'foldedTables', 'tempWall'], { gap: 0.3, skip: 0.3 });
    R.grid(['shelf', 1.2, { k: 'boxes' }], { da: 4.4, db: 1.2, face: 'a+', ma: 2, skip: 0.45, fit: true, rows: 5 });
    R.scatter(['crate', 'pallets', 'trolley', 'ladder', 'plinth', 'plinth', 'rollcage', 'palletFigure', 'pallettruck', 'wrappedFurniture'], 6 + Math.floor(R.L * R.W / 60));
    R.services('lights', 'pipes');
  },

  paintingsStudio(R) {
    R.grid('easel', { da: 3.2, db: 2.4, face: 'in', rows: 1, extra: { lamp: true }, mb: 0.05 });
    R.walls(['sink', ['worktable', 2.4, { k: 'conservation' }], 'fumecupboard', 'microscopeBench', ['shelf', 1.2, { k: 'tins' }], 'frameRack', ['worktable', 2.4, { k: 'painting' }], 'planchest'], { gap: 0.25 });
    R.scatter(['taboret', 'armlamp', 'stool', 'taboret'], 4);
    R.services('lights', 'extract');
  },
  varnishing(R) {
    R.end('sprayBooth', R.quietEnd(), 0);
    R.grid('easel', { da: 3.4, db: 2.4, face: 'in', rows: 1, max: 4, mb: 0.05, ...R.back(2.6) });
    R.walls([['shelf', 1.2, { k: 'tins' }], 'sink', 'gasBottles', ['worktable', 2.2, { k: 'conservation' }], 'frameRack'], { gap: 0.3 });
    R.scatter(['taboret', 'armlamp'], 2);
    R.services('lights', 'duct', 'extract');
  },
  xray(R) {
    R.end('xrayTable', R.quietEnd(), 1.7);
    R.walls(['leadScreen', 'lightbox', 'lightbox', 'filing', 'easel', 'planchest', 'coatstand'], { gap: 0.5 });
    R.scatter(['stool', 'trolley'], 2);
    R.services('lights');
  },
  laboratory(R) {
    R.walls(['fumecupboard', 'labBench', 'labBench', 'sink', 'fridge', 'microscopeBench', 'gasBottles', 'labBench'], { gap: 0.1 });
    R.grid('microscopeBench', { da: 2.6, db: 1.8, face: 'out', rows: 1 });
    R.scatter(['stool', 'stool', 'bin'], 3);
    R.services('lights', 'duct');
  },
  wetRoom(R) {
    R.walls(['washTank', 'sink', 'dryingRack', 'washTank', ['shelf', 1.2, { k: 'tins' }], 'dryingRack', 'sink'], { gap: 0.2 });
    R.grid(['worktable', 2.4, { k: 'sheets' }], { da: 3.2, db: 2.4, face: 'a+', rows: 1 });
    R.scatter(['dryingRack', 'stool', 'bucket'], 3);
    R.services('lights', 'pipes');
  },
  paperStudio(R) {
    R.grid(['worktable', 2.6, { k: 'sheets', lamp: true }], { da: 3.6, db: 2.5, face: 'a+', rows: 1 });
    R.walls(['planchest', 'press', 'lightTable', 'sink', 'boardRack', 'planchest', 'microscopeBench', ['shelf', 1.2, { k: 'archive' }], 'rollRack'], { gap: 0.2 });
    R.scatter(['stool', 'stool', 'booktrolley', 'armlamp'], 4);
    R.services('lights', 'extract');
  },
  objectsStudio(R) {
    R.grid(['worktable', 2.2, { k: 'objects', lamp: true }], { da: 3.2, db: 2.4, face: 'a+', rows: 1 });
    R.walls(['fumecupboard', 'sink', ['shelf', 1.2, { k: 'objects' }], 'microscopeBench', 'labBench', ['shelf', 1.2, { k: 'objects' }]], { gap: 0.2 });
    R.scatter(['palletFigure', 'stool', 'armlamp', 'trolley'], 4);
    R.services('lights', 'extract');
  },

  carpentry(R) {
    R.walls(['timberRack', 'workbench', 'bandsaw', 'workbench', 'sheetRack', 'pillarDrill', 'toolchest', 'workbench', 'dustExtractor', 'timberRack'], { gap: 0.3 });
    R.grid('tableSaw', { da: 7, db: 2.4, face: 'a+', rows: 1, side: 0 });
    R.grid(['workbench', 2.2, { island: true }], { da: 5, db: 2.4, face: 'a+', rows: 1, side: 1 });
    R.scatter(['sawhorses', 'plinth', 'bin', 'plinth', 'sawhorses'], 5);
    R.services('lights', 'duct');
  },
  paintShop(R) {
    R.end('sprayBooth', R.quietEnd(), 0);
    R.walls([['shelf', 1.2, { k: 'tins' }], ['shelf', 1.2, { k: 'tins' }], 'sink', 'workbench', 'dryingRack', 'sheetRack'], { gap: 0.2 });
    R.grid('plinth', { da: 2.2, db: 1.8, face: 'in', rows: 1, skip: 0.35, ...R.back(2.6) });
    R.scatter(['sawhorses', 'bucket', 'ladder', 'bucket', 'tempWall'], 5);
    R.services('lights', 'duct');
  },
  plexiShop(R) {
    R.walls([['sheetRack', 2, { plexi: true }], 'workbench', 'pillarDrill', 'workbench', ['shelf', 1.2, { k: 'boxes' }], 'bandsaw', 'toolchest', ['sheetRack', 2, { plexi: true }]], { gap: 0.3 });
    R.grid(['worktable', 2.4, { k: 'mounts' }], { da: 3.6, db: 2.4, face: 'a+', rows: 1 });
    R.scatter(['vitrine', 'plinth', 'vitrine', 'stool'], 4);
    R.services('lights', 'duct');
  },
  exhibitionPrep(R) {
    R.grid('tempWall', { da: 6.5, db: 2.6, face: 'in', rows: 1, skip: 0.35 });
    R.walls(['crates', 'plinth', 'crate', 'vitrine', 'plinth', 'crates', 'ladder', ['shelf', 1.2, { k: 'lights' }]], { gap: 1.2, skip: 0.3 });
    R.scatter(['scissorLift', 'aframe', 'plinth', 'bucket', 'trolley', 'vitrine', 'sawhorses'], 7);
    R.services('track');
  },
  lightingStore(R) {
    R.walls([['shelf', 1.2, { k: 'lights' }], ['shelf', 1.2, { k: 'lights' }], 'ladder', ['shelf', 1.2, { k: 'boxes' }], 'cableDrums'], { gap: 0.08 });
    R.grid(['shelf', 1.2, { k: 'lights' }], { da: 2.6, db: 1.2, face: 'a+', ma: 1.5, fit: true, skip: 0.2 });
    R.scatter(['lampStand', 'lampStand', 'cableDrums', 'scissorLift', 'lampStand'], 5);
    R.services('lights', 'tray');
  },
  loadingDock(R) {
    R.walls(['truck', 'dockDoor', 'truck', 'dockDoor'], { walls: 'long', gap: 2.2, once: true });
    R.walls(['crates', 'rollcage', 'rollcage', 'pallets', 'extinguisher', 'crate', 'noticeboard'], { gap: 0.5 });
    R.scatter(['forklift', 'pallettruck', 'bollard', 'crate', 'bollard', 'rollcage', 'pallets', 'pallettruck'], 8);
    R.services('lights', 'pipes', 'tray');
  },
  packing(R) {
    R.grid(['worktable', 2.8, { k: 'packing' }], { da: 4.2, db: 2.5, face: 'a+', rows: 1 });
    R.walls(['wrapRack', 'crates', ['shelf', 1.2, { k: 'boxes' }], 'foamStack', 'crate', 'wrapRack', 'sheetRack', 'scales'], { gap: 0.3 });
    R.scatter(['crate', 'rollcage', 'pallettruck', 'aframe', 'trolley', 'bin'], 6);
    R.services('lights', 'pipes');
  },
  liftLobby(R) {
    R.walls(['trolley', 'extinguisher', 'noticeboard', 'rollcage'], { gap: 1.2, once: true });
    R.services('lights');
  },
  refuse(R) {
    R.walls(['dumpster', 'dumpster', 'wheelieBins', 'baler', 'bales', 'wheelieBins'], { gap: 0.3 });
    R.scatter(['bales', 'pallets', 'bucket'], 3);
    R.services('lights', 'pipes');
  },

  boilerRoom(R) {
    R.grid('boiler', { da: 3.8, db: 2.2, face: 'a+', rows: 1, max: 4, mb: 0.05, ma: 1 });
    R.walls(['tank', 'pumpSet', 'switchgear', 'tank', 'pumpSet', 'gasBottles', 'extinguisher'], { gap: 0.4 });
    R.services('lights', 'pipes', 'pipes2');
  },
  chillerPlant(R) {
    R.grid('chiller', { da: 4.6, db: 2.0, face: 'in', rows: 1, max: 4, mb: 0.05 });
    R.walls(['pumpSet', 'tank', 'switchgear', 'pumpSet', 'ahu', 'extinguisher'], { gap: 0.4 });
    R.services('lights', 'pipes', 'pipes2');
  },
  switchRoom(R) {
    R.walls([['switchgear', 2.4], ['switchgear', 2.4], 'transformer', ['switchgear', 1.6], 'batteryRack', 'extinguisher'], { gap: 0.25 });
    R.scatter(['rubberMat'], 1);
    R.services('lights', 'tray', 'tray2');
  },
  serverRoom(R) {
    R.grid('serverRack', { da: 0.62, db: 2.5, face: 'in', rows: 1, ma: 1.6 });
    R.walls(['crac', 'batteryRack', 'crac', 'switchgear', 'extinguisher', ['shelf', 1.2, { k: 'boxes' }]], { gap: 0.5 });
    R.services('coldlights', 'tray', 'tray2');
  },
  sprinklerValves(R) {
    R.walls(['valveSet', 'valveSet', 'tank', 'pumpSet', 'valveSet', 'extinguisher', 'hoseReel'], { gap: 0.3 });
    R.services('lights', 'redpipes');
  },
  projectionBooth(R) {
    const e = R.quietEnd();
    R.walls(['projector', 'projector', 'spotlight'], { walls: e ? 'end1' : 'end0', gap: 0.6, once: true });
    R.walls(['ampRack', 'filmBench', 'ampRack', ['shelf', 1.2, { k: 'film' }], 'mixingDesk', 'stool', 'extinguisher'], { gap: 0.3 });
    R.scatter(['stool', 'flightcase', 'cableDrums'], 3);
    R.services('tray');
  },
  plantRoom(R) {
    const big = R.W > 12;
    R.grid('ahu', { da: 5.4, db: big ? 3.5 : 2.1, face: 'in', skip: 0.15, side: 0, mb: 0.05 });
    R.grid('tank', { da: big ? 3.2 : 2.2, db: big ? 3.2 : 1.7, face: 'in', skip: 0.2, side: 1, mb: 0.05 });
    if (big) R.grid('chiller', { da: 6, db: 14, face: 'in', side: 1, mb: 0.05, rows: 1, ma: 3 });
    R.walls(['pumpSet', 'switchgear', 'tank', 'pumpSet', 'valveSet', 'switchgear', 'extinguisher', 'riser'], { gap: 0.35 });
    R.services('lights', 'pipes', 'duct', 'pipes2');
  },

  lockers(R) {
    R.walls(['lockerRun'], { gap: 0.02 });
    R.grid('bench', { da: 2.4, db: 1.6, face: 'a+', rows: 1, turn: true });
    R.scatter(['bin'], 1);
    R.services('lights');
  },
  coatStore(R) {
    const counter = /Checkroom/i.test(R.name);
    if (counter) R.end(['counter', 4], R.quietEnd(), 1.6);
    R.grid('coatRail', { da: 1.9, db: 1.5, face: 'a+', fit: true, mb: 0.2, ...(counter ? R.back(4.2, 0.8) : { ma: 0.8 }) });
    R.walls([['shelf', 1.2, { k: 'linen' }], 'umbrellaStand', ['shelf', 1.2, { k: 'bags' }]], { gap: 0.2 });
    R.services('lights');
  },
  housekeeping(R) {
    R.walls([['shelf', 1.2, { k: 'supplies' }], ['shelf', 1.2, { k: 'supplies' }], 'sink', 'janitorCart', ['shelf', 1.2, { k: 'linen' }], 'wheelieBins'], { gap: 0.2 });
    R.scatter(['scrubber', 'mopBucket', 'janitorCart', 'mopBucket', 'vacuum', 'wetFloor'], 6);
    R.services('lights', 'pipes');
  },
  chairStore(R) {
    const stage = /Stage/i.test(R.name);
    R.grid('stackedChairs', { da: 0.75, db: 0.8, face: 'in', rows: stage ? 1 : 3, skip: 0.1 });
    R.walls(stage ? ['flightcase', 'musicStands', 'flightcase', 'risers', 'lectern', 'cableDrums'] : ['foldedTables', 'stackedChairs', 'risers', 'lectern'], { gap: 0.25 });
    R.scatter(stage ? ['flightcase', 'trolley', 'lampStand'] : ['trolley'], 3);
    R.services('lights');
  },
  stockRoom(R) {
    const k = /Dry goods/i.test(R.name) ? 'food' : 'boxes';
    R.walls([['shelf', 1.2, { k }]], { gap: 0.03 });
    R.grid(['shelf', 1.2, { k }], { da: 2.4, db: 1.2, face: 'a+', ma: 1.5, fit: true, skip: 0.15 });
    R.scatter(['rollcage', 'kickstool', 'parcels', 'trolley'], 4);
    R.services('lights');
  },
  canteen(R) {
    R.end('servery', R.quietEnd(), 0);
    R.grid(['cafeTable', 1.9, { square: true }], { da: 2.3, db: 2.0, face: 'a+', rows: 2, mb: 0.1, ...R.back(3.2) });
    R.walls(['vending', 'vending', 'trayRack', 'noticeboard', 'bin', 'waterCooler'], { gap: 0.4 });
    R.services('lights');
  },
  dishRoom(R) {
    R.walls(['dishwasher', 'sink', 'sink', ['shelf', 1.2, { k: 'crockery' }], 'dishwasher', ['shelf', 1.2, { k: 'crockery' }], 'wheelieBins'], { gap: 0.15 });
    R.scatter(['trayRack', 'trayRack', 'mopBucket', 'bin'], 4);
    R.services('lights', 'pipes', 'duct');
  },
  kitchen(R) {
    R.walls(['range', 'range', 'fryer', 'sink', 'fridge', 'fridge', ['prep', 2], ['shelf', 1.2, { k: 'pots' }], 'range', 'sink', ['prep', 2], 'fridge'], { gap: 0.06 });
    R.grid(['prep', 2.2, { island: true }], { da: 3.2, db: 2.3, face: 'a+', rows: 1 });
    R.scatter(['trayRack', 'bin', 'rollcage'], 3);
    R.services('lights', 'duct');
  },

  paintingClass(R) {
    R.grid('easel', { da: 1.9, db: 1.9, face: 'in', rows: 2, extra: { student: true }, skip: 0.1, mb: 0.05 });
    R.walls(['sink', 'canvasRack', 'lockerRun', ['shelf', 1.2, { k: 'tins' }], 'canvasRack', 'pinboard', 'sink', 'pinboard'], { gap: 0.25 });
    R.scatter(['modelStand', 'taboret', 'stool', 'taboret', 'stool', 'bin'], 6);
    R.services('lights');
  },
  drawingClass(R) {
    R.grid('drawingHorse', { da: 1.7, db: 1.8, face: 'in', rows: 2, skip: 0.1 });
    R.walls(['planchest', 'pinboard', 'plasterCast', 'pinboard', 'planchest', 'boardRack', 'plasterCast', 'sink'], { gap: 0.3 });
    R.scatter(['modelStand', 'stool', 'easel', 'armlamp'], 4);
    R.services('lights');
  },
  printWorkshop(R) {
    R.grid('etchingPress', { da: 4.2, db: 2.6, face: 'a+', rows: 1, side: 0 });
    R.grid(['worktable', 2.2, { k: 'inking' }], { da: 3.4, db: 2.4, face: 'a+', rows: 1, side: 1 });
    R.walls(['dryingRack', 'sink', 'planchest', 'press', ['shelf', 1.2, { k: 'tins' }], 'dryingRack', 'boardRack', 'pinboard'], { gap: 0.25 });
    R.scatter(['stool', 'bin', 'stool'], 3);
    R.services('lights', 'extract');
  },
  lectureRoom(R) {
    const e = R.quietEnd();
    R.end('screen', e, 0); R.end('lectern', e, 1.3);
    R.grid(['seatRow', 2, { loose: true }], { da: 1.0, db: 2, face: e ? 'a+' : 'a-', fit: true, mb: 0.5, ...R.back(3.6, 1.2) });
    R.walls(['stackedChairs', 'whiteboard'], { walls: e ? 'end0' : 'end1', gap: 0.5, once: true });
    R.services('lights');
  },
  classroom(R) {
    R.grid('kidsTable', { da: 2.6, db: 2.3, face: 'a+', rows: 2 });
    R.walls(['cubbies', 'sink', ['shelf', 1.2, { k: 'supplies' }], 'pinboard', 'whiteboard', 'cubbies', 'pinboard', 'dryingRack'], { gap: 0.3 });
    R.scatter(['easel', 'bin', 'blocks'], 3);
    R.services('lights');
  },
  familyRoom(R) {
    R.rug(0.3, 0.3, 4, 3); R.rug(0.72, 0.7, 4, 3);
    R.grid('kidsTable', { da: 3.2, db: 2.6, face: 'a+', rows: 1, skip: 0.3 });
    R.walls(['cubbies', 'bookcase', 'sofa', 'pinboard', 'cubbies', 'bookcase', 'sofa', 'pinboard'], { gap: 0.4 });
    R.scatter(['blocks', 'beanbag', 'beanbag', 'blocks', 'beanbag', 'easel'], 8);
    R.services('lights');
  },

  auditorium(R) { R.auditorium(true); },
  auditoriumBalcony(R) { R.auditorium(false); },
  greenRoom(R) {
    R.walls(['dressingTable', 'dressingTable', 'sofa', 'fridge', 'coatRail', 'sofa', 'kitchenette', 'plant'], { gap: 0.25 });
    R.scatter(['coffeeTable', 'armchair', 'armchair', 'bin'], 4);
    R.services('lights');
  },
  foyer(R) {
    R.walls(['pictureWall', 'bench', 'brochures', 'plant', 'bench', 'pictureWall', 'plant'], { gap: 1.6, skip: 0.2 });
    if (/entrance/i.test(R.name)) { R.end('counter', R.quietEnd(), 1.4); R.scatter(['stanchions', 'stanchions'], 2); }
  },
  backstage(R) {
    R.walls(['flightcase', 'coatRail', 'propsTable', 'flightcase', 'ropeRail', 'musicStands', 'dressingTable', 'extinguisher'], { gap: 0.3 });
    R.scatter(['flightcase', 'lampStand', 'cableDrums', 'risers', 'lampStand', 'trolley'], 6);
    R.services('tray');
  },
  stage(R) {
    const e = R.quietEnd();
    R.walls(['curtain'], { walls: e ? 'end1' : 'end0', gap: 0 });
    R.walls(['curtain'], { walls: 'long', gap: 2.5, skip: 0.45 });
    R.scatter(['piano', 'lectern', 'micStand', 'musicStands', 'micStand', 'stool'], 6);
    R.services('track');
  },

  // A restroom block, not one hall of cubicles: a corridor off the room's own doors, and walled off it a Women's, a Men's,
  // a family room or two, the cleaner's cupboard, and in what is left whatever a museum keeps next to its restrooms.
  restroom(R) {
    const { L, W, plan } = R, r = R.room, H = R.H, rnd = R.rnd, T = 0.1, TILE = 0xdfe6e4, BAND = 0x5f8794, PAINT = 0xc9cdca;
    const wall = (a0, a1, b0, b1, y0 = 0, y1 = H) => {
      if (a1 - a0 < 0.01 || b1 - b0 < 0.01) return;
      const seg = (ya, yb, hex) => { const p = Math.max(ya, y0), q = Math.min(yb, y1); if (q > p + 0.005) R.box(a0, a1, p, q, b0, b1, hex); };
      seg(0, 1.1, TILE); seg(1.1, 1.24, BAND); seg(1.24, 2.1, TILE); seg(2.1, H, PAINT);
      const q = R.rect(a0, a1, b0, b1); R.solid(q.x0, q.x1, y0, Math.min(y1, H), q.z0, q.z1);
    };
    const set = (name, a, b, face, w, o) => { const it = ITEMS[name], [fx, fz] = R.dir(FACES[face]), [ox, oz] = R.xz(a, b); it.draw(new Pen(R, ox, oz, fx, fz, it.d), w || it.w, rnd, o); R.placed++; };
    // where the ways in are
    const doors = plan.doorsOf(r.id).filter(d => Math.abs(d.y - r.y) <= 0.3).map(d => { const [a0, b0] = R.ab(d.x0, d.z0), [a1, b1] = R.ab(d.x1, d.z1), ca = (a0 + a1) / 2, cb = (b0 + b1) / 2, dist = [cb, W - cb, ca, L - ca], k = dist.indexOf(Math.min(...dist));
      return { wall: k, lo: k < 2 ? Math.min(a0, a1) : Math.min(b0, b1), hi: k < 2 ? Math.max(a0, a1) : Math.max(b0, b1) }; });
    // A small room is one restroom and needs no corridor: cubicles down one long wall, basins and the mirror down the other,
    // each broken where a door is, and the floor between them left clear from door to door.
    if (W < 7.5 && L < 20) {
      const use = /wcE$/.test(r.id) ? 'MEN' : 'WOMEN', tally = { room: r.id, use, len: +L.toFixed(2), depth: +W.toFixed(2), stalls: 0, urinals: 0, basins: 0, at: R.xz(L / 2, W / 2), out: R.xz(L / 2, W / 2) };
      const runs = k => { const out = []; let a = 0.12; for (const [p, q] of doors.filter(d => d.wall === k).map(d => [d.lo - 0.5, d.hi + 0.5]).sort((x, y) => x[0] - y[0])) { if (p - a > 0.9) out.push([a, p]); a = Math.max(a, q); } if (L - 0.12 - a > 0.9) out.push([a, L - 0.12]); return out.sort((x, y) => (y[1] - y[0]) - (x[1] - x[0])); };
      const ks = hash(r.id) & 1, kb = 1 - ks, fS = ks ? 'b-' : 'b+', fB = kb ? 'b-' : 'b+', bS = ks ? W : 0, bB = kb ? W : 0;
      const sr = runs(ks), br = runs(kb);
      // the cubicles: the wide one first, then as many as the wall takes, eight at the most
      let first = true;
      for (const [p, q] of sr) {
        let a = p;
        if (use === 'MEN' && !first) { const nu = Math.max(0, Math.min(5 - tally.urinals, Math.floor((q - a) / 0.75))); for (let i = 0; i < nu; i++) { set('urinal', a + 0.375, bS, fS); a += 0.75; tally.urinals++; } continue; }
        if (first && q - a > 1.5) { set('stall', a + 0.75, bS, fS, 1.5, { wide: true, door: 'ajar' }); a += 1.5; tally.stalls++; }
        const cap = use === 'MEN' ? 3 : first ? 5 : 8;
        while (a + 0.95 <= q && tally.stalls < cap) { set('stall', a + 0.475, bS, fS, 0.95, tally.stalls === 2 ? { door: 'open' } : undefined); a += 0.95; tally.stalls++; }
        if (use === 'MEN' && first) { a += 0.1; while (a + 0.75 <= q && tally.urinals < 2) { set('urinal', a + 0.375, bS, fS); a += 0.75; tally.urinals++; } }
        first = false;
      }
      // the basins under their mirror, and on the next stretch of wall what dries hands and changes babies
      br.forEach(([p, q], i) => {
        if (i === 0) { const k = Math.max(1, Math.min(6, Math.floor((q - p - 0.2) / 0.7))); set('basinRun', (p + q) / 2, bB, fB, k * 0.7); tally.basins += k; }
        else if (i === 1) { let a = p + 0.3; for (const name of ['handDryer', 'towels', 'babyChange', 'handDryer']) { const w = ITEMS[name].w; if (a + w > q - 0.1) break; set(name, a + w / 2, bB, fB); a += w + 0.45; } if (q - a > 1.9) set('bench', a + 0.9, bB, fB); }
      });
      { const [p, q] = br[0] || [L / 2 - 1, L / 2 + 1], [x, z] = R.xz((p + q) / 2, kb ? W - 0.012 : 0.012), [fx, fz] = R.dir(FACES[fB]); R.out.marks.push({ kind: 'wcsign', room: r.id, x, y: R.y + Math.min(2.5, H - 0.3), z, fx, fz, text: use, icon: use, w: 1.05, h: 0.3 }); }
      { const [x, z] = R.xz(L / 2 + 1.2, W / 2 + 0.3); R.out.marks.push({ kind: 'loose', room: r.id, type: 'wetfloor', x, y: R.y, z, yaw: rnd() * 6.28, col: 0xe2b21c }); }
      (R.out.wc || (R.out.wc = [])).push(tally);
      R.services('lights');
      return;
    }
    // the corridor: down the middle of a wide room, along the wall with the doors in a narrow one
    const narrow = W < 7.5, cw = narrow ? (W < 5.2 ? 1.6 : 1.9) : 2.2, n0 = doors.filter(d => d.wall === 0).length, n1 = doors.filter(d => d.wall === 1).length;
    const c0 = narrow ? (n1 > n0 ? W - cw : 0) : W / 2 - cw / 2, c1 = c0 + cw;
    const lobby = k => doors.some(d => d.wall === k && (d.lo < c0 + 0.05 || d.hi > c1 - 0.05)) ? 1.6 : 0, e0 = lobby(2), e1 = lobby(3);
    // each side of it: the stretches no door or stair needs
    const spaces = [];
    for (const s of [-1, 1]) {
      const D = s > 0 ? W - c1 : c0; if (D < 2.9) continue;
      const B0 = s > 0 ? c1 : 0, B1 = s > 0 ? W : c0, gaps = doors.filter(d => d.wall === (s > 0 ? 1 : 0)).map(d => [d.lo - 0.45, d.hi + 0.45]);
      for (const q of R.kept || []) { const [a0, b0] = R.ab(q.x0, q.z0), [a1, b1] = R.ab(q.x1, q.z1); if (Math.max(b0, b1) > B0 && Math.min(b0, b1) < B1) gaps.push([Math.min(a0, a1) - 0.2, Math.max(a0, a1) + 0.2]); }
      let a = e0; for (const [p, q] of gaps.sort((x, y) => x[0] - y[0])) { if (Math.min(p, L - e1) - a > 0.3) spaces.push({ s, D, p: a, q: Math.min(p, L - e1) }); a = Math.max(a, q); } if (L - e1 - a > 0.3) spaces.push({ s, D, p: a, q: L - e1 });
    }
    const WISH = { WOMEN: [5.4, 7.2, 8.2], MEN: [6.2, 6.6, 7.6], FAMILY: [2.3, 2.8, 3.3], CLEANER: [1.5, 1.8, 2.2], COAT: [3.6, 7, 9], MEMBER: [4, 7, 9], FIRSTAID: [3, 4.6, 4.8], PARENTS: [3.4, 4.4, 5.6], LOCKERS: [2.6, 5, 8], STAFF: [1.5, 3, 5] };
    const NAME = { WOMEN: 'WOMEN', MEN: 'MEN', FAMILY: 'FAMILY', CLEANER: 'CLEANER', COAT: 'COAT CHECK', MEMBER: 'MEMBER SERVICES', FIRSTAID: 'FIRST AID', PARENTS: 'PARENTS’ ROOM', LOCKERS: 'LOCKERS', STAFF: 'STAFF ONLY' };
    const bays = [], take = (use, least) => {
      const [mn, pf, mx] = WISH[use], m = least || mn, sp = spaces.filter(x => x.q - x.p >= m).sort((x, y) => (y.q - y.p) - (x.q - x.p))[0]; if (!sp) return false;
      let len = Math.min(pf, sp.q - sp.p); if (sp.q - sp.p - len < 1.5) len = Math.min(mx, sp.q - sp.p);
      bays.push({ use, s: sp.s, D: sp.D, a0: sp.p, a1: sp.p + len }); sp.p += len; return true;
    };
    // (The middle block on the lower level keeps the coats, and the long east one has the first-aid room: each is asked for
    // before the second family room and the lockers, which take what is left.)
    const coats = r.id === 'F0-wcM', aid = r.id === 'F0-wcE';
    if (coats) WISH.COAT = [3.6, 4.4, 4.6];             // room left beside it for a family room and the cleaner
    const first = coats ? ['WOMEN', 'MEN', 'COAT', 'FAMILY', 'CLEANER'] : aid ? ['WOMEN', 'MEN', 'FAMILY', 'FIRSTAID', 'CLEANER', 'FAMILY'] : ['WOMEN', 'MEN', 'FAMILY', 'CLEANER', 'FAMILY'];
    const more = /member/i.test(R.name) ? ['MEMBER', 'PARENTS', 'COAT', 'LOCKERS', 'FIRSTAID'] : coats ? ['FAMILY', 'PARENTS', 'FIRSTAID', 'LOCKERS'] : ['LOCKERS', 'FIRSTAID', 'PARENTS', 'COAT'];
    { const big = spaces.slice().sort((x, y) => (y.q - y.p) - (x.q - x.p)), l0 = big[0] ? big[0].q - big[0].p : 0, l1 = big[1] ? big[1].q - big[1].p : 0;
      if (first.includes('WOMEN') && first.includes('MEN') && l1 < 6.2 && l0 >= 11.6) {       // side by side on the one stretch that will take them
        const sp = big[0], wl = Math.max(5.4, Math.min(7.2, l0 - 6.6)), ml = Math.min(7.6, l0 - wl - (l0 - wl - 6.6 > 1.5 ? l0 - wl - 6.6 : 0));
        bays.push({ use: 'WOMEN', s: sp.s, D: sp.D, a0: sp.p, a1: sp.p + wl }, { use: 'MEN', s: sp.s, D: sp.D, a0: sp.p + wl, a1: sp.p + wl + ml }); sp.p += wl + ml;
        first.splice(first.indexOf('WOMEN'), 1); first.splice(first.indexOf('MEN'), 1);
      } }
    for (const u of first) if (!take(u) && (u === 'WOMEN' || u === 'MEN')) take(u, 4.4);
    for (const u of more) take(u);
    for (let i = 0; i < 12 && take('STAFF'); i++);
    const count = [];
    for (const sp of spaces) if (sp.q - sp.p > 0.05) { const b0 = sp.s > 0 ? c1 : 0, b1 = sp.s > 0 ? W : c0; wall(sp.p, sp.q, b0, b1); }      // what is left over is a riser, walled in

    for (const bay of bays) {
      const { use, s, D, a0, a1 } = bay, len = a1 - a0, bOf = t => s > 0 ? c1 + t : c0 - t, toCorr = s > 0 ? 'b-' : 'b+', away = s > 0 ? 'b+' : 'b-';
      const span = (t0, t1) => [Math.min(bOf(t0), bOf(t1)), Math.max(bOf(t0), bOf(t1))];
      const tw = (p, q, t0, t1, y0, y1) => wall(p, q, ...span(t0, t1), y0, y1);
      const shut = use === 'CLEANER' || use === 'STAFF', hatch = (use === 'COAT' || use === 'MEMBER') && len > 3.5, o0 = a0 + 0.4, o1 = o0 + 1.4;
      tw(a0, a0 + 0.06, 0, D); tw(a1 - 0.06, a1, 0, D);
      tw(a0, o0, 0, T); tw(o0, o1, 0, T, 2.1, H);
      if (hatch) {       // a counter in the wall, open above it
        tw(o1, o1 + 0.3, 0, T); tw(a1 - 0.3, a1, 0, T); tw(o1 + 0.3, a1 - 0.3, 0, T, 0, 1.0); tw(o1 + 0.3, a1 - 0.3, 0, T, 2.1, H);
        const [p, q] = span(-0.12, 0.42); R.box(o1 + 0.3, a1 - 0.3, 1.0, 1.045, p, q, C.woodL);
        const k = R.rect(o1 + 0.3, a1 - 0.3, p, q); R.solid(k.x0, k.x1, 0.9, 1.05, k.z0, k.z1);
        if (use === 'COAT') {       // on the counter: a bell to ring, a spike of ticket stubs, a tray of numbered tags
          const ca = o1 + 0.75, cb = bOf(0.16), bx = (da, db, w, d, y0, y1, hex, mat) => R.box(ca + da - w / 2, ca + da + w / 2, y0, y1, Math.min(cb + db - d / 2, cb + db + d / 2), Math.max(cb + db - d / 2, cb + db + d / 2), hex, mat);
          bx(0, 0, 0.13, 0.13, 1.045, 1.06, C.black); bx(0, 0, 0.1, 0.1, 1.06, 1.1, 0xc9a24a, 'metal'); bx(0, 0, 0.025, 0.025, 1.1, 1.125, C.black);
          bx(0.45, 0, 0.1, 0.1, 1.045, 1.055, C.woodD); bx(0.45, 0, 0.012, 0.012, 1.055, 1.26, C.steelL, 'metal'); for (let i = 0; i < 5; i++) bx(0.45 + (rnd() - 0.5) * 0.02, (rnd() - 0.5) * 0.02, 0.07, 0.045, 1.06 + i * 0.022, 1.064 + i * 0.022, i % 2 ? 0xf2e6b8 : 0xe8a8a0);
          if (a1 - 0.3 - (o1 + 0.3) > 1.9) { bx(1.05, 0, 0.3, 0.2, 1.045, 1.07, C.steelD); for (let i = 0; i < 4; i++) bx(0.95 + i * 0.07, 0, 0.045, 0.14, 1.07, 1.078, [0xd84a3a, 0x3a7ad8, 0xe2b21c, 0x3aa86a][i]); }
        }
      } else tw(o1, a1, 0, T);
      if (shut) {
        const [p, q] = span(0.03, 0.07); R.box(o0, o1, 0, 2.1, p, q, 0x5a626b);
        { const [p2, q2] = span(0.02, 0.08); R.box(o0, o1, 0, 0.25, p2, q2, C.steelL, 'metal'); }
        { const [p2, q2] = span(-0.03, 0.07); R.box(o1 - 0.18, o1 - 0.12, 0.98, 1.06, p2, q2, C.steelL, 'metal'); }
        const k = R.rect(o0, o1, p, q); R.solid(k.x0, k.x1, 0, 2.1, k.z0, k.z1);
      }
      // its name over the way in, on the corridor side
      { const [x, z] = R.xz((o0 + o1) / 2, bOf(-0.008)), [fx, fz] = R.dir(FACES[toCorr]); R.out.marks.push({ kind: 'wcsign', room: r.id, x, y: R.y + Math.min(2.34, H - 0.3), z, fx, fz, text: NAME[use], icon: use, w: use === 'MEMBER' || use === 'PARENTS' ? 1.3 : 1.05, h: 0.3 }); }
      const tally = { room: r.id, use, len: +len.toFixed(2), depth: +D.toFixed(2), stalls: 0, urinals: 0, basins: 0, at: R.xz((o0 + o1) / 2, bOf(1.0)), out: R.xz((o0 + o1) / 2, bOf(-0.8)) }; count.push(tally);
      if (shut) continue;
      const row = (list, from = a0 + 0.15, to = a1 - 0.15, gap = 0.12) => { let a = from; for (const [name, w, o] of list) { const ww = w || ITEMS[name].w; if (a + ww > to) continue; set(name, a + ww / 2, bOf(D), toCorr, ww, o); a += ww + gap; } return a; };
      const basins = (n, from = o1 + 0.25) => { const avail = a1 - 0.15 - from, k = Math.max(0, Math.min(n, Math.floor(avail / 0.7))); if (k) { set('basinRun', from + k * 0.35, bOf(T), away, k * 0.7); tally.mirror = R.xz(from + k * 0.35, bOf(T)); tally.eye = R.xz(from + k * 0.35 - 1.3, bOf(Math.min(D - 1.7, 2.2))); } tally.basins += k; return k; };
      const sideA1 = (name, t) => set(name, a1 - 0.06, bOf(t), 'a-'), sideA0 = (name, t) => set(name, a0 + 0.06, bOf(t), 'a+');
      if (use === 'WOMEN' || use === 'MEN') {
        let a = a0 + 0.1; set('stall', a + 0.75, bOf(D), toCorr, 1.5, { wide: true, door: 'ajar' }); a += 1.5; tally.stalls++;
        const n = use === 'MEN' ? 2 : Math.max(2, Math.min(7, Math.floor((a1 - 0.1 - a) / 0.95)));
        for (let i = 0; i < n; i++) { set('stall', a + 0.475, bOf(D), toCorr, 0.95, i === n - 1 && use === 'WOMEN' ? { door: 'open' } : undefined); a += 0.95; tally.stalls++; }
        if (use === 'MEN') { a += 0.12; const nu = Math.max(0, Math.min(5, Math.floor((a1 - 0.12 - a) / 0.75))); for (let i = 0; i < nu; i++) { set('urinal', a + 0.375, bOf(D), toCorr); a += 0.75; tally.urinals++; } }
        basins(6);
        const free = D - 1.5 - 0.7; if (free > 0.8) { sideA1('handDryer', 0.7 + free * 0.3); sideA1('towels', 0.7 + free * 0.75); }
        if (free > 1.0) sideA0('babyChange', 0.9 + free * 0.5);
        if (D > 4.4) set('bench', (a0 + a1) / 2, bOf(D - 2.6), toCorr);
        if (use === 'WOMEN') { const [x, z] = R.xz(o1 + 0.5, bOf(1.25)); R.out.marks.push({ kind: 'loose', room: r.id, type: 'wetfloor', x, y: R.y, z, yaw: rnd() * 6.28, col: 0xe2b21c }); }
      } else if (use === 'FAMILY') {
        set('pan', a1 - 0.6, bOf(D), toCorr); tally.stalls++; set('basinRun', a0 + Math.max(1.0, len / 2 - 0.3), bOf(D), toCorr, 0.7); tally.basins++;
        if (D > 3.1) sideA0('changeTable', D - 1.25);
        sideA1('towels', Math.min(D - 1.2, 1.4));
      } else if (use === 'COAT') {
        for (let a = a0 + 0.3; a + 1.5 < a1 - 0.2; a += 1.62) { set('coatRail', a + 0.75, bOf(D - 0.05), toCorr); if (D > 4.6) set('coatRail', a + 0.75, bOf(D - 1.75), toCorr); }
        if (len > 5) set('umbrellaStand', a1 - 0.6, bOf(0.9), toCorr);
      } else if (use === 'MEMBER') {
        row([['bookcase'], ['pigeonholes'], ['filing'], ['plant'], ['bookcase'], ['filing']]);
        if (D > 4.2) set('desk', (o1 + 0.3 + a1 - 0.3) / 2, bOf(2.6), toCorr);
      } else if (use === 'FIRSTAID') {
        // a couch under a paper sheet, the cabinet with the green cross, a basin, and a wheelchair folded against the wall
        const a = row([['aidCouch'], ['aidCabinet']]); if (a1 - 0.2 - a > 0.75) { set('basinRun', a + 0.35, bOf(D), toCorr, 0.7); tally.basins++; }
        sideA1('towels', Math.min(D - 1.3, 1.5)); if (D > 2.6) sideA0('wheelchair', Math.min(D - 0.8, 1.9));
      } else if (use === 'PARENTS') {
        row([['sofa'], ['armchair'], ['plant']]); basins(1);
        if (D > 3.1) { sideA1('changeTable', D - 1.6); if (D > 4.6) sideA1('changeTable', D - 2.8); }
      } else if (use === 'LOCKERS') {
        set('lockerRun', (a0 + a1) / 2, bOf(D), toCorr, Math.floor((len - 0.3) / 0.3) * 0.3);
        for (let a = a0 + 2.6; a + 0.9 < a1 - 0.3; a += 2.4) set('bench', a, bOf(D - 1.75), toCorr);
      }
    }
    (R.out.wc || (R.out.wc = [])).push(...count);
    R.services('lights');
  },
  shop(R) {
    if (R.room.id === 'F1-shop') return;                               // the main shop is fitted out by src/giftshop.js
    R.grid('displayTable', { da: 3, db: 2.6, face: 'a+', rows: 2 });
    R.walls([['shopShelf', 1.2, { k: 'books' }], ['shopShelf', 1.2, { k: 'merch' }], ['shopShelf', 1.2, { k: 'books' }], 'posterBin', ['shopShelf', 1.2, { k: 'merch' }], 'cardSpinner'], { gap: 0.05 });
    R.end(['counter', 3, { till: true }], R.quietEnd(), 1.6);
    R.scatter(['cardSpinner', 'posterBin', 'cardSpinner'], 3);
  },
  restaurant(R) {
    R.end('bar', R.quietEnd(), 0);
    R.grid(['cafeTable', 1.9, { cloth: true }], { da: 2.6, db: 2.4, face: 'a+', mb: 1.0, ...R.back(3.6, 1) });
    R.walls(['sideboard', 'plant', 'banquette', 'banquette', 'plant', 'sideboard'], { gap: 0.3 });
  },
  cafe(R) {
    if (R.L < 22 || R.W < 18) {                                         // a small one: a counter, a few tables
      R.end('servery', R.quietEnd(), 0);
      R.grid('cafeTable', { da: 2.5, db: 2.4, face: 'a+', mb: 1.0, skip: 0.06, ...R.back(3.8, 1) });
      R.walls(['banquette', 'banquette', 'plant', 'trayRack', 'bin', 'banquette', 'vending'], { gap: 0.3 });
      return;
    }
    // The big one, laid out the way a canteen is: a servery down one side, booths along the walls, long tables,
    // round and square ones in loose groups, high tables, and room to walk between. The chairs, stools, bins and
    // small tables are not fixed down (src/loose.js): here they are only noted. Same dice every night.
    const { L, W } = R, r = R.rnd, TAU = Math.PI * 2;
    R.clear.push(...R.clear.map(c => ({ x0: c.x0 - 0.35, x1: c.x1 + 0.35, z0: c.z0 - 0.35, z1: c.z1 + 0.35 })));       // the ways through, wide enough for two
    // (a, b, yaw) are the room's own: a along it, b across it, yaw 0 facing +b. The note is in the world's.
    const loose = (type, a, b, yaw, o = {}) => { const [x, z] = R.xz(a, b); R.out.marks.push({ kind: 'loose', room: R.room.id, type, x, y: R.y + (o.up || 0), z, yaw: R.longX ? yaw : Math.PI / 2 - yaw, ...o }); };
    const claim = (a, b, h) => { const q = R.rect(a - h, a + h, b - h, b + h); if (!R.free(q, 0.1)) return false; R.taken.push(q); R.placed++; return true; };
    const SEAT = [0x35465c, 0xa02c22, 0x19191b, 0x2c4f8a, 0x8a6a45, 0x3d6b3a, 0xc8641a, 0x6c7076];
    for (const fa of [1 / 8, 3 / 8, 5 / 8, 7 / 8]) for (const fb of [1 / 6, 0.5, 5 / 6]) R.putC('column', L * fa, W * fb + (fb === 0.5 ? 2.2 : 0), 'b+', 0.2);
    // the servery, along the long wall fewest come in by, with the fridges and the tray return beside it
    const far = R.doorsAt.filter(e => e[1] > W - 2).length <= R.doorsAt.filter(e => e[1] < 2).length, sb = far ? W : 0, sf = far ? 'b-' : 'b+', bf = far ? 'b+' : 'b-', bb = far ? 0 : W;
    let sa = L * 0.5; for (const t of [0.5, 0.6, 0.4, 0.68, 0.32]) if (R.put('cafeCounter', (sa = L * t), sb, sf, 0.3)) break;
    R.put('drinksFridge', sa + 6.6, sb, sf); R.put('drinksFridge', sa + 8.0, sb, sf); R.put('trayReturn', sa - 6.8, sb, sf); R.put('trayReturn', sa - 8.6, sb, sf); R.put('plant', sa + 9.2, sb, sf); R.put('plant', sa - 10, sb, sf);
    for (let a = sa - 4; a <= sa + 4.1; a += 2.7) { const b = far ? W - 4.7 : 4.7; if (claim(a, b, 0.25)) loose('post', a, b, 0); }       // the queue's posts
    // booths, end-on to the wall opposite and to one short wall
    for (let a = 1.3; a < L - 1.2; a += 2.35) R.put('booth', a, bb, bf, 0.12);
    for (let b = 4.2; b < W - 7; b += 2.35) R.put('booth', 0, far ? b : W - b, 'a+', 0.12);
    // the machines, in a row on the other short wall, with a plant, a rack of trays and the water
    let mb = far ? 3.4 : W - 3.4; const step = far ? 1.12 : -1.12;
    for (let k = 0, n = 0; k < 12 && n < 5; k++, mb += step) if (R.put('vending', L, mb, 'a-', 0.08)) n++;
    R.put('plant', L, mb + step * 0.4, 'a-'); R.put('trayRack', L, mb + step * 1.6, 'a-'); R.put('waterCooler', L, mb + step * 2.5, 'a-');
    // long tables: a rank of them, each with its chairs, some left pulled out
    const chairs = (n, at) => { for (let k = 0; k < n; k++) { const [a, b, yaw] = at(k); if (r() < 0.07) continue; const out = r() < 0.22 ? 0.18 + r() * 0.3 : 0, t = yaw + (out ? (r() - 0.5) * 1.1 : (r() - 0.5) * 0.16); loose('chair', a - Math.sin(yaw) * out + (r() - 0.5) * 0.06, b - Math.cos(yaw) * out + (r() - 0.5) * 0.06, t, { col: pick(r, SEAT) }); } };
    const zb0 = far ? 4.4 : 7.4, zb1 = far ? W - 7.4 : W - 4.4;                                    // the floor the loose tables have, between the booths and the queue
    for (let k = 0; k < 3; k++) {
      const a = L * 0.72 + (r() - 0.5) * 1.2, b = zb0 + 1.0 + k * 3.4;
      if (b > W / 2 - 3.0 || !R.put('refectory', a, b, 'b+', 0.9)) continue;
      chairs(5, i => [a - 1.7 + i * 0.85, b - 0.42, 0]); chairs(5, i => [a - 1.7 + i * 0.85, b + 1.32, Math.PI]);
      R.taken.push(R.rect(a - 2.3, a + 2.3, b - 0.9, b + 1.8));
    }
    // high tables with stools, towards the servery
    for (let k = 0; k < 5; k++) { const a = L * 0.56 + k * 2.6 + (r() - 0.5) * 0.5, b = (far ? W / 2 + 3.6 : W / 2 - 3.6) + (r() - 0.5) * 1.4; if (!R.putC('highTable', a, b, 'b+', 0.6)) continue; const n = 2 + (r() < 0.5 ? 1 : 0), t0 = r() * TAU; for (let i = 0; i < n; i++) { const t = t0 + i * TAU / n + (r() - 0.5) * 0.5, d = 0.52 + r() * 0.12; loose('stool', a + Math.cos(t) * d, b + Math.sin(t) * d, r() * TAU); } R.taken.push(R.rect(a - 0.95, a + 0.95, b - 0.95, b + 0.95)); }
    // round and square tables in loose groups, at whatever angle they were left
    let tables = 0, seats = 0;
    const group = (a0, a1, b0, b1, kinds, pitch) => {
      for (let b = b0 + pitch / 2; b < b1 - 0.8; b += pitch) for (let a = a0 + pitch / 2 + (Math.round((b - b0) / pitch) % 2) * pitch * 0.35; a < a1 - 0.8; a += pitch) {
        if (tables >= 42 || r() < 0.1) continue;
        const ta = a + (r() - 0.5) * pitch * 0.42, tb = b + (r() - 0.5) * pitch * 0.42, kind = pick(r, kinds), big = kind === 'round4', hh = big ? 1.22 : 1.02;
        if (!claim(ta, tb, hh)) continue;
        const yaw = kind === 'square' ? (r() < 0.6 ? 0 : (r() - 0.5) * 1.2) : r() * TAU, top = pick(r, [0xb89b6e, 0xdedcd4, 0x4a3222, 0xd8c8a0, 0x8a9098]), col = r() < 0.55 ? pick(r, SEAT) : null;
        loose(kind, ta, tb, yaw, { col: top }); tables++;
        const n = big ? 4 : kind === 'square' ? (r() < 0.5 ? 4 : 2) : 2 + Math.floor(r() * 2.4), rad = (big ? 0.62 : 0.4) + 0.3;
        for (let i = 0; i < n; i++) {
          if (seats >= 104 || r() < 0.06) continue;
          const t = (kind === 'square' ? yaw + Math.PI / 2 : yaw) + i * TAU / n, out = r() < 0.2 ? 0.2 + r() * 0.35 : 0, d = rad + out;
          loose('chair', ta + Math.cos(t) * d, tb + Math.sin(t) * d, Math.atan2(-Math.cos(t), -Math.sin(t)) + (out ? (r() - 0.5) * 1.4 : (r() - 0.5) * 0.2), { col: col || pick(r, SEAT), ...(r() < 0.03 ? { tip: 1 } : {}) }); seats++;
        }
        if (r() < 0.3) { const [x, z] = R.xz(ta + 0.27, tb + 0.2); R.out.marks.push({ kind: 'coin', room: R.room.id, x, y: R.y, z }); }      // somebody's change, under the table
      }
    };
    group(3.0, L * 0.47, zb0, W / 2 - 1.4, ['round', 'round', 'round4', 'square'], 2.55);
    group(L * 0.5, L - 2.2, W / 2 + 1.6, zb1, ['square', 'square', 'round'], 2.5);
    group(3.0, L * 0.47, W / 2 + 1.5, zb1, ['round', 'round4', 'round4', 'square'], 2.7);
    group(L * 0.47, L - 2.2, zb0, W / 2 - 1.4, ['round', 'square'], 2.5);
    // a stack of spare chairs by the wall, bins, a coffee cart, planters between the groups
    for (const [a, b] of [[2.6, zb1 + 0.9], [3.4, zb1 + 1.0]]) if (claim(a, b, 0.3)) for (let k = 0; k < 3; k++) loose('chair', a, b, 0.2, { col: SEAT[2], up: k * 0.13 });
    for (const [fa, fb] of [[0.3, 0.44], [0.72, 0.56], [0.12, 0.6], [0.9, 0.42]]) { const a = L * fa + (r() - 0.5), b = W * fb + (r() - 0.5); if (claim(a, b, 0.24)) loose('bin', a, b, 0); }
    for (const t of [0.2, 0.3, 0.12]) if (R.putC('coffeeCart', L * t, far ? W - 3.6 : 3.6, sf, 0.4)) break;
    for (const [fa, fb] of [[0.48, 0.3], [0.48, 0.72]]) R.putC('planter', L * fa, W * fb, 'a+', 0.3);
    // and loose change on the floor where it rolled
    for (let k = 0, n = 0; k < 80 && n < 10; k++) { const a = 1.5 + r() * (L - 3), b = 1.5 + r() * (W - 3), q = R.rect(a - 0.12, a + 0.12, b - 0.12, b + 0.12); if (R.taken.some(c => q.x0 < c.x1 && q.x1 > c.x0 && q.z0 < c.z1 && q.z1 > c.z0)) continue; const [x, z] = R.xz(a, b); R.out.marks.push({ kind: 'coin', room: R.room.id, x, y: R.y, z }); n++; }
  },
  terrace(R) {
    R.grid(['cafeTable', 1.9, { outdoor: true }], { da: 4.2, db: 3.4, face: 'a+', rows: 1, skip: 0.3 });
    R.walls(['planter', 'planter', 'bench', 'planter'], { gap: 1.5 });
  },
  serviceCorridor(R) {
    R.walls(['extinguisher', 'noticeboard', 'slimTrolley', 'panel', 'hoseReel', 'bumper', 'noticeboard', 'slimTrolley', 'panel', 'bumper'], { walls: 'long', gap: 3.2, jitter: 4 });
    R.services('striplights', 'pipes', 'tray');
  },
};
// What a recipe needs of the room before it starts: a narrower aisle, the aisle along one wall instead of
// down the middle (`side`), or so many metres kept back at the quiet end for a stage or a counter (`keepEnd`).
const OPTS = {
  serviceCorridor: { aisle: 0.6 }, liftLobby: { aisle: 0.9 }, boardRoom: { side: true }, seminar: { side: true }, loadingDock: { side: true },
  directorsOffice: { keepEnd: 2.8 }, reception: { keepEnd: 2.4 }, securityControl: { keepEnd: 0.5 }, memberServices: { keepEnd: 2.5 }, coldStore: { keepEnd: 0.6 },
  varnishing: { keepEnd: 2.4 }, paintShop: { keepEnd: 2.4 }, xray: { keepEnd: 4.8 }, projectionBooth: { keepEnd: 2.0 }, coatStore: { keepEnd: 2.6 }, canteen: { keepEnd: 2.6 },
  lectureRoom: { keepEnd: 2.0 }, auditorium: { keepEnd: 3.4 }, auditoriumBalcony: { keepEnd: 0.4 }, stage: { keepEnd: 0.4 }, shop: { keepEnd: 2.6 }, restaurant: { keepEnd: 2.6 }, cafe: { keepEnd: 2.6 }, foyer: { keepEnd: 2.4 },
};

// ----------------------------------------------------------------- finish --
//
// What makes a back room read as a room and not as the inside of a box: a ceiling of tiles in a darker tone than
// the walls, a shadow gap where it meets them, a skirting, and the lower wall painted a second colour up to a rail.
// (The lit panels in the ceiling are src/lights.js's; this sits a hair above them.) Everything is kept a few
// centimetres inside the room, so that every corner of it belongs to this room when the lights are worked out.
const NO_FINISH = /^(auditorium|auditoriumBalcony|stage|foyer|loadingDock|terrace|x[A-Z])/;
const DADO = [0xa3b0bc, 0xaebaa8, 0xc0ae96, 0x98acc2, 0xbcb39a, 0xb4a4b0];
function cut(rect, holes) {
  let out = [rect];
  for (const h of holes) {
    const next = [];
    for (const q of out) {
      if (h.x0 >= q.x1 || h.x1 <= q.x0 || h.z0 >= q.z1 || h.z1 <= q.z0) { next.push(q); continue; }
      if (h.x0 > q.x0) next.push({ x0: q.x0, x1: h.x0, z0: q.z0, z1: q.z1 }); if (h.x1 < q.x1) next.push({ x0: h.x1, x1: q.x1, z0: q.z0, z1: q.z1 });
      const a = Math.max(q.x0, h.x0), b = Math.min(q.x1, h.x1);
      if (h.z0 > q.z0) next.push({ x0: a, x1: b, z0: q.z0, z1: h.z0 }); if (h.z1 < q.z1) next.push({ x0: a, x1: b, z0: h.z1, z1: q.z1 });
    }
    out = next;
  }
  return out;
}
function finish(R, recipe) {
  const r = R.room, plan = R.plan;
  if (r.kind !== 'room' || r.secret || r.use === 'secret' || NO_FINISH.test(recipe) || r.h < 2.7 || r.h > 6 || r.x1 - r.x0 < 1.6 || r.z1 - r.z0 < 1.6) return;
  const I = 0.04, x0 = r.x0 + I, x1 = r.x1 - I, z0 = r.z0 + I, z1 = r.z1 - I, y = r.y, top = y + r.h, m = R.batch('matte');
  const lap = (q, g) => q.x0 - g < r.x1 && q.x1 + g > r.x0 && q.z0 - g < r.z1 && q.z1 + g > r.z0, grow = (q, g) => ({ x0: q.x0 - g, x1: q.x1 + g, z0: q.z0 - g, z1: q.z1 + g });
  const holes = [];
  for (const k of plan.wells || []) if (k.y > y + 1 && k.y < top + 1.7 && lap(k, 0)) holes.push(grow(k, 0.06));
  for (const s of plan.surfaces || []) { if (s.hill || !lap(s, 0)) continue; const lo = s.lift ? s.lift.stops[0] : Math.min(s.h0, s.h1) - (s.thick || 0), hi = s.lift ? s.lift.stops[s.lift.stops.length - 1] : Math.max(s.h0, s.h1); if (!(hi > top - 0.6 && lo < top)) continue;
    const q = grow(s, 0.06);
    if (!s.lift && (s.axis === 'x' || s.axis === 'z') && s.h0 !== s.h1) {              // a slope: from where it is within a car's height of the ceiling, up
      const a0 = s.axis === 'x' ? s.x0 : s.z0, a1 = s.axis === 'x' ? s.x1 : s.z1, t = Math.max(0, Math.min(1, (top - 1.1 - s.h0) / (s.h1 - s.h0))), at = a0 + (a1 - a0) * t;
      if (s.h1 > s.h0) q[s.axis + '0'] = at - 0.06; else q[s.axis + '1'] = at + 0.06;
    }
    holes.push(q); }
  // the ceiling, and the grid its tiles hang in
  const tone = [0x4b4f55, 0x53514c, 0x464c52][hash(r.id) % 3];
  for (const q of cut({ x0, x1, z0, z1 }, holes)) m.box(q.x0, q.x1, top - 0.012, top - 0.006, q.z0, q.z1, tone, true);
  const w = x1 - x0, d = z1 - z0, pitch = Math.max(1.2, Math.max(w, d) / 30);
  if (w * d > 9) {
    for (let x = x0 + (w % pitch) / 2 + pitch / 2; x < x1 - 0.3; x += pitch) for (const q of cut({ x0: x - 0.018, x1: x + 0.018, z0, z1 }, holes)) m.box(q.x0, q.x1, top - 0.02, top - 0.013, q.z0, q.z1, 0x8b9096, true);
    for (let z = z0 + (d % pitch) / 2 + pitch / 2; z < z1 - 0.3; z += pitch) for (const q of cut({ x0, x1, z0: z - 0.018, z1: z + 0.018 }, holes)) m.box(q.x0, q.x1, top - 0.02, top - 0.013, q.z0, q.z1, 0x8b9096, true);
  }
  // round the walls: the shadow at the top, and below it the skirting, the painted lower wall and its rail, broken at each doorway
  const doors = plan.doorsOf(r.id).filter(dd => dd.y < y + 1.2 && dd.y > y - 0.5), dado = DADO[(hash(r.id) >>> 3) % DADO.length], low = r.h > 3.2 ? 1.0 : 0.85;
  const runs = (lo, hi, spans) => { const out = []; let a = lo; for (const [p, q] of spans.sort((s, t) => s[0] - t[0])) { if (p - a > 0.05) out.push([a, Math.min(p, hi)]); a = Math.max(a, q); } if (hi - a > 0.05) out.push([a, hi]); return out; };
  for (const side of ['n', 's', 'w', 'e']) {
    const alongX = side === 'n' || side === 's', at = side === 'n' ? z0 : side === 's' ? z1 : side === 'w' ? x0 : x1, sg = side === 'n' || side === 'w' ? 1 : -1, lo = alongX ? x0 : z0, hi = alongX ? x1 : z1;
    const wall = side === 'n' ? r.z0 : side === 's' ? r.z1 : side === 'w' ? r.x0 : r.x1;
    const B = (a, b, ya, yb, dep, hex) => { const p = Math.min(at, at + sg * dep), q = Math.max(at, at + sg * dep); alongX ? m.box(a, b, y + ya, y + yb, p, q, hex, true) : m.box(p, q, y + ya, y + yb, a, b, hex, true); };
    B(lo, hi, r.h - 0.2, r.h - 0.02, 0.06, 0x1b1d21);
    const spans = doors.filter(dd => (alongX ? dd.along !== 'x' : dd.along === 'x') && (alongX ? dd.z0 <= wall + 0.06 && dd.z1 >= wall - 0.06 : dd.x0 <= wall + 0.06 && dd.x1 >= wall - 0.06))       /* the doorway meets this wall, however long the passage beyond it */.map(dd => (alongX ? [dd.x0 - 0.1, dd.x1 + 0.1] : [dd.z0 - 0.1, dd.z1 + 0.1]));
    // a mouse's grille low in this wall (plan.js addNests): the skirting and the lower wall stop either side of it, and go on over it
    const nests = (plan.nests || []).filter(n => n.room === r.id && n.side === side).map(n => [n.u - n.VW / 2 - 0.05, n.u + n.VW / 2 + 0.05, n.VH + 0.04]);
    for (const [a, b, h] of nests) { if (recipe === 'restroom') { B(a, b, h, 1.1, 0.045, 0xdfe6e4); B(a, b, 1.1, 1.24, 0.05, 0x5f8794); B(a, b, 1.24, 2.1, 0.045, 0xdfe6e4); B(a, b, 2.1, 2.14, 0.06, 0xb7b2a6); } else { B(a, b, h, low, 0.045, dado); B(a, b, low, low + 0.045, 0.065, 0xb7b2a6); } }
    { const V = plan.staffVent; if (V && V.room === r.id && V.side === side) nests.push([V.z0 - 0.05, V.z1 + 0.05, V.H + 0.04]); }      // and the same where the staff vent comes out (src/ventplan.js)
    spans.push(...nests.map(([a, b]) => [a, b]));
    for (const [a, b] of runs(lo, hi, spans)) { B(a, b, 0, 0.11, 0.07, 0x3c3f45);
      if (recipe === 'restroom') { B(a, b, 0.11, 1.1, 0.045, 0xdfe6e4); B(a, b, 1.1, 1.24, 0.05, 0x5f8794); B(a, b, 1.24, 2.1, 0.045, 0xdfe6e4); B(a, b, 2.1, 2.14, 0.06, 0xb7b2a6); }      // tiled to the height of the doors, with a darker band
      else { B(a, b, 0.11, low, 0.045, dado); B(a, b, low, low + 0.045, 0.065, 0xb7b2a6); } }      // (proud enough to stand clear of a wall that is itself built a little way in)
  }
}

// ---------------------------------------------------------------- colours --

const C = {
  steel: 0x8a9098, steelD: 0x3a3d42, steelL: 0xb4bac0, white: 0xdedcd4, cream: 0xcfc6b0, black: 0x19191b, grey: 0x6c7076, greyL: 0xa3a6a8,
  wood: 0x8a6a45, woodL: 0xb89b6e, woodD: 0x4a3222, ply: 0xc2a878, pine: 0xc9ad7c, card: 0xa98a5c, cardD: 0x8a6c42, archive: 0x6f7b85,
  red: 0xa02c22, redD: 0x5c1612, yellow: 0xd8a418, blue: 0x2c4f8a, blueL: 0x86a8c8, green: 0x3d6b3a, greenD: 0x23422a, orange: 0xc8641a,
  canvas: 0xd8cdb4, gilt: 0xa8843a, tissue: 0xe6e3da, terracotta: 0xa85c3c, bronze: 0x5a4a32, celadon: 0x8fae9c, plaster: 0xe2ded2,
  fabric: 0x35465c, leather: 0x45201b, velvet: 0x6e1620, rubber: 0x202124, glass: 0x9dbcc4, plexi: 0xb6d6dc, foam: 0xc8cfd4, pink: 0xd9a0a0,
  enamel: 0xe9e9e6, copper: 0xa8643c, lagging: 0xc9c9c4, galv: 0x9aa2a8,
  off: 0x07090c, screen: 0x4a7fb8, led: 0x30d060, ledA: 0xe8a020, ledR: 0xe03020, ledB: 0x3080ff, lamp: 0xffe2a8, tube: 0xdfe8ff,
};
const BOOKS = [0x6e2a22, 0x2a3c5c, 0x3c5a3a, 0x7a6a3c, 0x3a3030, 0x8a4a28, 0x4a2a4a, 0xa89878, 0x243a44];
const TINS = [0xdedcd4, 0xa02c22, 0x2c4f8a, 0xd8a418, 0x3d6b3a, 0x6c7076, 0xc8641a, 0x19191b];
const MERCH = [0xd8a418, 0xa02c22, 0x2c4f8a, 0xdedcd4, 0x3d6b3a, 0xc8641a, 0xd9a0a0, 0x86a8c8];
const PAINT = [0x7a3a2a, 0x2a4a6a, 0x8a7a3a, 0x3a5a3a, 0x6a5a7a, 0xa88a6a, 0x3a3a44, 0xb0a48a, 0x8a2a2a, 0x4a6a7a];
const COATS = [0x19191b, 0x2a3040, 0x5a4a3a, 0x6e1620, 0x3d4a3a, 0x7a7a7a, 0x2c4f8a, 0xa89878];
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];

// ------------------------------------------------------------------ items --
//
// def(name, width, depth, draw). The item's back is along d = 0 and it is centred on u = 0, so it
// covers u in [-w/2, w/2] and d in [0, depth]. In draw(g, w, r, o): g.b / g.q draw a box, g.c a
// cylinder, g.s marks a solid; the same with an `s` on the end draws and marks at once. `w` is the
// width it was given (some items stretch), `r` the room's dice, `o` its options.

const ITEMS = {};
const def = (name, w, d, draw) => { ITEMS[name] = { w, d, draw }; };

// Parts that several items share.
function chair(g, u, d, dir, c = C.fabric, h = 0.45) {                  // dir: +1 faces +d, -1 faces -d
  // Not drawn here and not fixed down: a note is left, and src/loose.js stands a chair there that can be knocked over.
  g.loose(h > 0.7 ? 'highchair' : 'chair', u, d, dir, c);
}
function stool(g, u, d, h = 0.62, c = C.steelD) {
  g.loose(h < 0.4 ? 'lowstool' : h > 0.7 ? 'barstool' : 'stool', u, d, 1, h < 0.56 && c === C.black ? c : C.wood);      // loose, like the chairs
}
function table(g, u0, u1, d0, d1, h, top = C.woodL, leg = C.steelD, o = {}) {
  g.b(u0, u1, h - 0.04, h, d0, d1, top, o.metal ? 'metal' : 'matte', true);
  const i = 0.07, t = 0.025;
  for (const u of [u0 + i, u1 - i]) for (const d of [d0 + i, d1 - i]) g.bs(u - t, u + t, 0, h - 0.04, d - t, d + t, leg, 'metal');
  if (o.shelf) g.b(u0 + i, u1 - i, 0.2, 0.23, d0 + i, d1 - i, top, o.metal ? 'metal' : 'matte', true);
  g.s(u0, u1, h - 0.06, h + (o.load || 0.02), d0, d1);
}
function lampArm(g, u, d, y0, reach = 0.5, dir = 1) {                   // a lamp on a jointed arm, standing at (u, d) from height y0
  g.c(u, y0 + 0.3, d, 0.012, 0.6, 'y', C.steelD, 'metal'); g.b(u - 0.012, u + 0.012, y0 + 0.58, y0 + 0.605, Math.min(d, d + dir * reach), Math.max(d, d + dir * reach), C.steelD, 'metal', true);
  g.c(u, y0 + 0.55, d + dir * reach, 0.09, 0.1, 'y', C.steelD, 'metal'); g.c(u, y0 + 0.497, d + dir * reach, 0.075, 0.006, 'y', C.lamp, 'glow');
}
function picture(g, axis, c0, c1, y0, y1, at, t, r, plain) {             // a framed canvas: axis 'd' hangs it facing +d (t > 0) at d = at
  const fr = plain ? C.pine : pick(r, [C.gilt, C.gilt, C.woodD, C.black]), f = plain ? 0.02 : 0.06, e = t > 0 ? 0.006 : -0.006;
  const B = (a0, a1, b0, b1, k, col) => (axis === 'd' ? g.b(a0, a1, b0, b1, Math.min(at, at + t + k * e), Math.max(at, at + t + k * e), col, 'matte', true) : g.b(Math.min(at, at + t + k * e), Math.max(at, at + t + k * e), b0, b1, a0, a1, col, 'matte', true));
  B(c0, c1, y0, y1, 0, fr);
  const base = pick(r, PAINT), w = c1 - c0 - 2 * f, h = y1 - y0 - 2 * f;
  B(c0 + f, c1 - f, y0 + f, y1 - f, 1, base);
  for (let i = 0; i < 2; i++) { const pw = w * (0.2 + r() * 0.4), ph = h * (0.2 + r() * 0.4), pu = c0 + f + r() * (w - pw), py = y0 + f + r() * (h - ph); B(pu, pu + pw, py, py + ph, 2 + i, pick(r, PAINT)); }
}
// Things on a shelf, from u0 to u1, standing on height y, no taller than hmax.
function fill(g, u0, u1, y, d0, d1, hmax, r, kind) {
  let u = u0 + 0.03;
  for (let n = 0; n < 24 && u < u1 - 0.1; n++) {
    let w = 0.3, h = 0.2, c = C.card, m = 'matte', dd = d1 - d0 - 0.06, round = false, gap = 0.02;
    switch (kind) {
      case 'books': w = 0.2 + r() * 0.4; h = hmax * (0.62 + r() * 0.3); c = pick(r, BOOKS); dd = Math.min(dd, 0.2 + r() * 0.04); gap = r() < 0.15 ? 0.1 : 0.004; break;
      case 'archive': w = 0.37; h = Math.min(hmax - 0.03, 0.27); c = r() < 0.88 ? C.archive : C.card; gap = 0.012; break;
      case 'tins': w = 0.17 + r() * 0.1; h = 0.15 + r() * 0.12; c = pick(r, TINS); round = true; dd = w; gap = 0.06 + r() * 0.16; break;
      case 'lights': w = 0.16 + r() * 0.08; h = 0.2 + r() * 0.12; c = r() < 0.8 ? C.black : C.steel; m = 'metal'; round = r() < 0.6; dd = Math.min(dd, w * 1.3); gap = 0.05 + r() * 0.08; break;
      case 'objects': w = 0.18 + r() * 0.24; h = Math.min(hmax - 0.03, 0.14 + r() * 0.34); c = pick(r, [C.tissue, C.terracotta, C.bronze, C.celadon, C.tissue, C.plaster, C.card]); round = r() < 0.5; dd = Math.min(dd, w); gap = 0.1 + r() * 0.2; break;
      case 'linen': w = 0.38; h = 0.06 + r() * Math.min(0.28, hmax - 0.1); c = pick(r, [C.white, C.white, C.blueL, C.fabric, C.cream, C.black]); gap = 0.04; break;
      case 'bags': w = 0.3 + r() * 0.2; h = 0.2 + r() * 0.18; c = pick(r, COATS); gap = 0.06; break;
      case 'food': w = 0.2 + r() * 0.3; h = 0.14 + r() * 0.22; c = pick(r, [C.card, C.white, C.red, C.yellow, C.blueL, C.steelL, C.green]); round = r() < 0.3; if (round) dd = w = Math.min(w, 0.3); gap = 0.03; break;
      case 'supplies': w = 0.16 + r() * 0.26; h = 0.18 + r() * 0.2; c = pick(r, [C.blue, C.white, C.yellow, C.card, C.blueL, C.green, C.pink]); round = r() < 0.35; if (round) dd = w = Math.min(w, 0.24); gap = 0.03; break;
      case 'crockery': w = 0.24; h = 0.08 + r() * 0.22; c = C.enamel; round = true; dd = w; gap = 0.04; break;
      case 'pots': w = 0.22 + r() * 0.16; h = 0.14 + r() * 0.16; c = pick(r, [C.steelL, C.steel, C.copper, C.steelL]); m = 'metal'; round = true; dd = Math.min(dd, w); gap = 0.05; break;
      case 'film': w = 0.05; h = 0.36; c = pick(r, [C.steel, C.steelL, C.grey, C.blue]); m = 'metal'; gap = 0.012; break;
      case 'merch': w = 0.12 + r() * 0.2; h = 0.1 + r() * 0.2; c = pick(r, MERCH); round = r() < 0.3; if (round) dd = w = Math.min(w, 0.16); gap = 0.04; break;
      default: w = 0.36 + r() * 0.4; h = Math.min(hmax - 0.03, 0.18 + r() * 0.26); c = pick(r, [C.card, C.card, C.cardD, C.white, C.card]); gap = 0.04 + r() * 0.1;
    }
    if (u + w > u1 - 0.02) break;
    if (r() < (kind === 'books' ? 0.06 : 0.24)) { u += w + gap; continue; }
    if (round) g.c(u + w / 2, y + h / 2, (d0 + d1) / 2, Math.min(w, dd) / 2, h, 'y', c, m, 6);
    else g.b(u, u + w, y, y + h, d0 + 0.03, d0 + 0.03 + dd, c, m);
    u += w + gap;
  }
}
function crateBox(g, u0, u1, y0, y1, d0, d1, r) {
  g.b(u0 + 0.02, u1 - 0.02, y0, y1 - 0.01, d0 + 0.02, d1 - 0.02, C.ply);
  const t = 0.07, c = C.pine;
  for (const u of [u0, u1 - t]) for (const d of [d0, d1 - t]) g.b(u, u + t, y0, y1, d, d + t, c);
  for (const y of [y0, y1 - t]) g.b(u0 + 0.008, u1 - 0.008, y, y + t, d0 + 0.008, d1 - 0.008, c);
  if (y1 - y0 > 0.5) { const mu = u0 + (u1 - u0) * (0.25 + r() * 0.3); g.b(mu, mu + 0.22, y1 - 0.42, y1 - 0.2, d1 - 0.022, d1 - 0.014, r() < 0.5 ? C.red : C.black); }
}
function pallet(g, u0, u1, d0, d1) {
  g.b(u0, u1, 0.1, 0.14, d0, d1, C.pine, 'matte', true);
  for (const f of [0, 0.5, 1]) { const u = u0 + (u1 - u0 - 0.1) * f; g.b(u, u + 0.1, 0, 0.1, d0, d1, C.pine); }
}
function castors(g, u0, u1, d0, d1, h = 0.1) { for (const u of [u0 + 0.06, u1 - 0.06]) for (const d of [d0 + 0.06, d1 - 0.06]) g.c(u, h / 2, d, h / 2, 0.04, 'u', C.rubber, 'matte', 6); }
function monitor(g, u, d, y, dir, r, big) {                             // dir: which way along d the screen faces
  const w = big ? 0.42 : 0.27, h = big ? 0.5 : 0.33;
  g.b(u - 0.03, u + 0.03, y, y + 0.14, d - 0.02, d + 0.02, C.black, 'matte', true); g.q(u, d, 0.2, 0.16, y, y + 0.012, C.black);
  g.b(u - w, u + w, y + 0.12, y + 0.12 + h, d - 0.015, d + 0.015, C.black, 'matte', true);
  r();                                                                   // switched off for the night: dark glass (the draw is kept so the rooms furnish as they did)
  g.b(u - w + 0.02, u + w - 0.02, y + 0.14, y + 0.1 + h, Math.min(d + dir * 0.016, d + dir * 0.019), Math.max(d + dir * 0.016, d + dir * 0.019), C.off, 'metal', true);
}
function figure(g, u, d, y, r, wrapped) {                               // somebody's statue, under tissue and polythene if `wrapped`
  const c = wrapped ? pick(r, [C.tissue, C.tissue, C.foam, C.white]) : pick(r, [C.plaster, C.bronze, C.terracotta, C.plaster, C.greyL]), h = 1.0 + r() * 0.7;
  g.c(u, y + h * 0.26, d, 0.2, h * 0.52, 'y', c, 'matte', 8); g.c(u, y + h * 0.66, d, 0.24, h * 0.3, 'y', c, 'matte', 8); g.c(u, y + h * 0.9, d, 0.12, h * 0.2, 'y', c, 'matte', 8);
  if (wrapped) for (const f of [0.3, 0.62]) g.c(u, y + h * f, d, 0.255, 0.03, 'y', C.blue, 'matte', 8);
  return h;
}

// ---- offices ----
def('desk', 1.6, 1.5, (g, w, r, o = {}) => {
  const top = o.grand ? C.woodD : pick(r, [C.woodL, C.white, C.woodL]), side = o.grand ? C.woodD : C.white, h = 0.74, e = w / 2;
  g.b(-e, e, h - 0.035, h, 0, 0.8, top, 'matte', true);
  g.bs(-e, -e + 0.03, 0, h - 0.035, 0.03, 0.77, side); g.bs(e - 0.03, e, 0, h - 0.035, 0.03, 0.77, side);
  const p = r() < 0.5 ? -1 : 1, pu = p * (e - 0.26);
  g.bs(pu - 0.21, pu + 0.21, 0.04, h - 0.035, 0.12, 0.76, o.grand ? C.woodD : C.greyL);
  for (const y of [0.26, 0.48]) g.b(pu - 0.2, pu + 0.2, y, y + 0.012, 0.76, 0.765, C.steelD);
  if (o.grand) { g.b(-e + 0.03, e - 0.03, 0.12, h - 0.035, 0.03, 0.06, C.woodD); g.s(-e, e, 0, h, 0.02, 0.07); }
  monitor(g, -p * 0.12, 0.24, h, 1, r, o.grand); if (r() < 0.4 && w > 1.5) monitor(g, -p * 0.12 + p * 0.58, 0.22, h, 1, r);
  g.q(-p * 0.12, 0.56, 0.42, 0.14, h, h + 0.015, C.black);
  g.q(pu, 0.36, 0.22, 0.3, h, h + 0.008 + r() * 0.05, C.white); if (r() < 0.6) g.c(-p * (e - 0.14), h + 0.05, 0.62, 0.04, 0.1, 'y', pick(r, MERCH), 'matte', 6);
  if (r() < 0.5) lampArm(g, -p * (e - 0.1), 0.1, h, 0.3);
  chair(g, -p * 0.1 + (r() - 0.5) * 0.3, 1.08 + r() * 0.12, -1, o.grand ? C.leather : pick(r, [C.fabric, C.black, C.fabric, C.greenD]));
  g.s(-e, e, h - 0.06, h + 0.5, 0, 0.8);
});
def('filing', 0.47, 0.62, (g, w, r) => {
  const h = r() < 0.6 ? 1.32 : 0.72, c = pick(r, [C.greyL, C.steel, C.cream]);
  g.bs(-0.23, 0.23, 0, h, 0, 0.62, c, 'metal');
  for (let y = 0.3; y < h; y += 0.3) { g.b(-0.2, 0.2, y - 0.012, y, 0.62, 0.624, C.steelD); g.b(-0.06, 0.06, y - 0.18, y - 0.16, 0.62, 0.64, C.steelL, 'metal', true); }
  if (r() < 0.5) g.q(0, 0.3, 0.3, 0.24, h, h + 0.04 + r() * 0.14, pick(r, [C.card, C.white, C.archive]));
});
def('bookcase', 1.0, 0.34, (g, w, r) => {
  const h = 2.1, e = w / 2, c = pick(r, [C.wood, C.woodD, C.woodL]);
  g.b(-e, -e + 0.03, 0, h, 0, 0.34, c); g.b(e - 0.03, e, 0, h, 0, 0.34, c); g.b(-e, e, 0, h, 0, 0.02, c); g.b(-e, e, h - 0.03, h, 0, 0.34, c, 'matte', true);
  for (let y = 0.08; y < h - 0.3; y += 0.38) { g.b(-e + 0.03, e - 0.03, y - 0.025, y, 0.02, 0.33, c, 'matte', true); fill(g, -e + 0.03, e - 0.03, y, 0.02, 0.33, 0.33, r, r() < 0.82 ? 'books' : 'archive'); }
  g.s(-e, e, 0, h, 0, 0.34);
});
def('plant', 0.6, 0.6, (g, w, r) => {
  g.c(0, 0.2, 0.3, 0.19, 0.4, 'y', pick(r, [C.terracotta, C.white, C.steelD]), 'matte', 8); g.c(0, 0.6, 0.3, 0.025, 0.5, 'y', C.woodD, 'matte', 5);
  const h = 0.9 + r() * 0.6;
  for (let i = 0; i < 4; i++) g.c((r() - 0.5) * 0.22, 0.55 + (h - 0.4) * (i / 3.4) + 0.1, 0.3 + (r() - 0.5) * 0.22, 0.2 + r() * 0.1 - i * 0.02, 0.24, 'y', i % 2 ? C.green : C.greenD, 'matte', 6);
  g.s(-0.19, 0.19, 0, h + 0.3, 0.11, 0.49);
});
def('bin', 0.32, 0.32, g => { g.c(0, 0.17, 0.16, 0.14, 0.34, 'y', C.steelD, 'metal', 8); g.s(-0.14, 0.14, 0, 0.34, 0.02, 0.3); });
def('printer', 0.7, 0.65, (g, w, r) => {
  g.bs(-0.33, 0.33, 0, 0.85, 0.02, 0.62, C.greyL); g.b(-0.33, 0.33, 0.85, 1.02, 0.02, 0.5, C.white, 'matte', true); g.b(-0.3, 0.3, 1.02, 1.06, 0.06, 0.46, C.grey);
  g.b(0.1, 0.28, 0.92, 0.97, 0.5, 0.504, C.off, 'metal'); for (const y of [0.25, 0.5]) g.b(-0.3, 0.3, y, y + 0.012, 0.62, 0.624, C.steelD);
  g.s(-0.33, 0.33, 0.85, 1.06, 0.02, 0.5);
});
def('coatstand', 0.5, 0.5, (g, w, r) => {
  g.c(0, 0.9, 0.25, 0.02, 1.8, 'y', C.woodD, 'matte', 6); g.c(0, 0.02, 0.25, 0.2, 0.04, 'y', C.woodD, 'matte', 8);
  if (r() < 0.7) g.q(0.08, 0.3, 0.14, 0.3, 0.8, 1.7, pick(r, COATS)); if (r() < 0.4) g.q(-0.09, 0.2, 0.12, 0.26, 1.0, 1.7, pick(r, COATS));
  g.s(-0.16, 0.16, 0, 1.8, 0.09, 0.45);
});
// A whiteboard. It is hung low, where a toy on the floor can read it, and it says where it is: the
// ones that have something written on them get their writing from src/whiteboards.js, which lays it
// over the board (the few strokes drawn here are what shows on a board nobody has written on).
def('whiteboard', 1.8, 0.08, (g, w, r, o = {}) => {
  // (Hung clear of the painted lower wall and its rail, which stand a little proud and would cover the bottom of it.)
  const e = w / 2, y0 = 1.12, y1 = y0 + (w - 0.06) * 2 / 3 + 0.06;
  g.b(-e, e, y0, y1, 0, 0.03, C.steelL, 'metal'); g.b(-e + 0.03, e - 0.03, y0 + 0.03, y1 - 0.03, 0.03, 0.035, C.white); g.b(-e, e, y0 - 0.02, y0, 0, 0.08, C.steelL, 'metal', true);
  if (!o.text) for (let i = 0; i < 5; i++) { const u = -e + 0.15 + r() * (w - 0.9), y = y0 + 0.2 + r() * 0.8; g.b(u, u + 0.2 + r() * 0.5, y, y + 0.012, 0.035, 0.037, pick(r, [C.blue, C.red, C.black, C.green])); }
  g.mark('board', 0, 0.04, (y0 + y1) / 2, { w: w - 0.06, h: y1 - y0 - 0.06, ...(o.text ? { text: o.text } : {}) });
});
def('noticeboard', 1.2, 0.05, (g, w, r) => {
  const e = w / 2; g.b(-e, e, 1.0, 1.9, 0, 0.03, C.wood); g.b(-e + 0.04, e - 0.04, 1.04, 1.86, 0.03, 0.034, 0x6a5038);
  for (let i = 0; i < 7; i++) { const u = -e + 0.08 + r() * (w - 0.42), y = 1.08 + r() * 0.5, c = pick(r, [C.white, C.white, C.yellow, C.pink, C.blueL, C.cream]); g.b(u, u + 0.16 + r() * 0.1, y, y + 0.2 + r() * 0.08, 0.034, 0.037 + i * 0.0006, c); }
});
def('pinboard', 2.0, 0.05, (g, w, r) => {
  const e = w / 2; g.b(-e, e, 0.7, 2.5, 0, 0.03, C.cream);
  for (let u = -e + 0.1; u < e - 0.5; ) { const pw = 0.35 + r() * 0.5, ph = 0.4 + r() * 0.8, y = 0.85 + r() * (1.5 - ph * 0.8); if (u + pw > e - 0.05) break; picture(g, 'd', u, u + pw, y, Math.min(2.45, y + ph), 0.03, 0.012, r, true); u += pw + 0.08 + r() * 0.2; }
});
def('pictureWall', 1.6, 0.08, (g, w, r) => { const pw = 0.7 + r() * 0.7, ph = 0.6 + r() * 0.7; picture(g, 'd', -pw / 2, pw / 2, 1.5 - ph / 2, 1.5 + ph / 2, 0, 0.05, r); });
def('screen', 3.0, 0.1, (g, w) => { const e = w / 2; g.b(-e, e, 2.75, 2.87, 0, 0.1, C.steelD, 'metal', true); g.b(-e + 0.05, e - 0.05, 0.95, 2.75, 0.03, 0.04, C.enamel); g.b(-e + 0.05, e - 0.05, 0.92, 0.95, 0.02, 0.05, C.black, 'matte', true); });
def('sofa', 1.9, 0.9, (g, w, r) => {
  const e = w / 2, c = pick(r, [C.leather, C.fabric, C.greenD, C.grey, C.velvet]);
  g.b(-e, e, 0.1, 0.42, 0.1, 0.9, c, 'matte', true); g.b(-e, e, 0.1, 0.85, 0, 0.22, c, 'matte', true); g.b(-e, -e + 0.18, 0.1, 0.62, 0.22, 0.9, c, 'matte', true); g.b(e - 0.18, e, 0.1, 0.62, 0.22, 0.9, c, 'matte', true);
  for (const u of [-e + 0.2, 0.01]) g.b(u, u + e - 0.21, 0.42, 0.5, 0.24, 0.88, c, 'matte', true);
  g.s(-e, e, 0, 0.85, 0, 0.9);
});
def('armchair', 0.85, 0.85, (g, w, r) => {
  const c = pick(r, [C.leather, C.fabric, C.greenD, C.velvet]);
  g.b(-0.42, 0.42, 0.1, 0.42, 0.08, 0.85, c, 'matte', true); g.b(-0.42, 0.42, 0.1, 0.9, 0, 0.2, c, 'matte', true); g.b(-0.42, -0.27, 0.1, 0.62, 0.2, 0.85, c, 'matte', true); g.b(0.27, 0.42, 0.1, 0.62, 0.2, 0.85, c, 'matte', true);
  g.s(-0.42, 0.42, 0, 0.9, 0, 0.85);
});
def('coffeeTable', 1.1, 0.6, (g, w, r) => { table(g, -0.55, 0.55, 0, 0.6, 0.42, C.woodD, C.woodD); g.q(0.1, 0.3, 0.3, 0.22, 0.42, 0.45, pick(r, BOOKS)); g.q(-0.25, 0.25, 0.22, 0.3, 0.42, 0.435, C.white); g.s(-0.55, 0.55, 0.1, 0.45, 0, 0.6); });
def('sideboard', 1.8, 0.5, (g, w, r) => {
  const e = w / 2; g.bs(-e, e, 0.08, 0.85, 0, 0.5, C.woodD); for (const u of [-e / 2, 0, e / 2]) g.b(u - 0.005, u + 0.005, 0.12, 0.8, 0.5, 0.503, C.black);
  if (r() < 0.6) g.c(-e + 0.3, 1.0, 0.25, 0.09, 0.3, 'y', pick(r, [C.celadon, C.terracotta, C.white]), 'matte', 8); if (r() < 0.6) lampArm(g, e - 0.25, 0.2, 0.85, 0.1);
});
def('counter', 2.6, 0.9, (g, w, r, o = {}) => {
  const e = w / 2; g.bs(-e, e, 0, 1.05, 0.5, 0.9, C.woodD); g.b(-e - 0.03, e + 0.03, 1.05, 1.09, 0.42, 0.95, C.cream, 'matte', true); g.b(-e, e, 0.72, 0.75, 0, 0.5, C.woodL, 'matte', true);
  g.bs(-e, -e + 0.04, 0, 0.72, 0, 0.5, C.woodD); g.bs(e - 0.04, e, 0, 0.72, 0, 0.5, C.woodD);
  monitor(g, -e * 0.4, 0.3, 0.75, -1, r); if (o.till || r() < 0.5) { g.q(e * 0.4, 0.28, 0.36, 0.34, 0.75, 0.9, C.black); g.b(e * 0.4 - 0.12, e * 0.4 + 0.12, 0.9, 1.08, 0.2, 0.23, C.off, 'metal', true); }
  g.s(-e, e, 0.7, 1.1, 0, 0.5);
});
def('brochures', 0.8, 0.3, (g, w, r) => { g.bs(-0.4, 0.4, 0, 1.5, 0, 0.06, C.steelD); for (let y = 0.3; y < 1.4; y += 0.3) { g.b(-0.38, 0.38, y, y + 0.02, 0.06, 0.2, C.steelD, 'metal', true); for (let u = -0.36; u < 0.3; u += 0.19) g.b(u, u + 0.15, y + 0.02, y + 0.24, 0.07, 0.1 + r() * 0.06, pick(r, MERCH), 'matte', true); } g.s(-0.4, 0.4, 0, 1.5, 0, 0.2); });
def('stanchions', 2.2, 0.3, g => { for (const u of [-1, 0, 1]) { g.c(u, 0.48, 0.15, 0.025, 0.96, 'y', C.gilt, 'metal', 6); g.c(u, 0.02, 0.15, 0.15, 0.04, 'y', C.gilt, 'metal', 8); g.s(u - 0.05, u + 0.05, 0, 0.96, 0.1, 0.2); } g.b(-1, 1, 0.84, 0.89, 0.135, 0.165, C.velvet, 'matte', true); });
def('meetingTable', 2.4, 3.0, (g, w, r, o = {}) => {                    // one bay of a long table: bays stand end to end
  const e = w / 2; g.b(-e, e, 0.71, 0.75, 0.9, 2.1, o.grand ? C.woodD : C.woodL, 'matte', true);
  for (const u of [-e + 0.3, e - 0.3]) g.bs(u - 0.04, u + 0.04, 0, 0.71, 1.1, 1.9, o.grand ? C.woodD : C.steelD);
  for (const u of [-e / 2, e / 2]) { chair(g, u, 0.5, 1, o.grand ? C.leather : C.fabric); chair(g, u, 2.5, -1, o.grand ? C.leather : C.fabric); if (r() < 0.5) g.q(u, 1.2 + r() * 0.6, 0.22, 0.3, 0.75, 0.756, C.white); }
  g.s(-e, e, 0.68, 0.78, 0.9, 2.1);
});
def('console', 2.0, 1.7, (g, w, r) => {
  const e = w / 2; g.b(-e, e, 0.7, 0.74, 0, 0.9, C.grey, 'matte', true); g.bs(-e, -e + 0.04, 0, 0.7, 0, 0.9, C.steelD); g.bs(e - 0.04, e, 0, 0.7, 0, 0.9, C.steelD); g.bs(-e, e, 0, 0.7, 0, 0.05, C.steelD);
  for (const u of [-0.6, 0, 0.6]) { g.b(u - 0.27, u + 0.27, 0.8, 1.14, 0.12, 0.15, C.black, 'matte', true); g.b(u - 0.25, u + 0.25, 0.82, 1.12, 0.15, 0.153, (pick(r, [C.screen, 0x285088, 0x3a6a5a, 0x505860]), C.off), 'metal'); }
  g.q(0, 0.6, 0.5, 0.16, 0.74, 0.76, C.black); g.q(0.7, 0.6, 0.2, 0.2, 0.74, 0.8, C.steelD); chair(g, (r() - 0.5) * 0.6, 1.35, -1, C.black);
  g.s(-e, e, 0.68, 1.14, 0, 0.9);
});
def('monitorWall', 4.4, 0.25, (g, w, r) => {
  const e = w / 2; g.b(-e, e, 0.9, 2.7, 0, 0.12, C.black);
  for (let u = -e + 0.08; u + 0.72 < e; u += 0.74) for (let y = 0.98; y < 2.5; y += 0.56) g.b(u, u + 0.68, y, y + 0.5, 0.12, 0.125, (pick(r, [0x1a2a3a, 0x24384a, 0x303840, 0x182a22, 0x2a3440, 0x0c1014]), C.off), 'metal');
  g.s(-e, e, 0.9, 2.7, 0, 0.14);
  g.mark('monitorWall', 0, 0.125, 0, { w });                          // src/secdesk.js lights the screens
});
def('keyCabinet', 0.8, 0.15, (g, w, r) => { g.b(-0.4, 0.4, 1.1, 1.9, 0, 0.12, C.steel, 'metal'); g.b(0.3, 0.33, 1.45, 1.55, 0.12, 0.14, C.steelD); });
def('radios', 0.9, 0.4, (g, w, r) => { table(g, -0.45, 0.45, 0, 0.4, 0.9, C.grey, C.steelD); for (let u = -0.36; u < 0.4; u += 0.14) { g.q(u, 0.2, 0.07, 0.05, 0.9, 1.08, C.black); g.q(u, 0.23, 0.02, 0.006, 1.02, 1.035, r() < 0.7 ? C.led : C.ledR, 'glow'); } });
def('turnstile', 1.8, 1.2, g => { for (const u of [-0.7, 0, 0.7]) { g.bs(u - 0.1, u + 0.1, 0, 1.0, 0.1, 1.1, C.steel, 'metal'); g.q(u, 1.0, 0.1, 0.01, 0.7, 0.76, C.led, 'glow'); } for (const u of [-0.35, 0.35]) g.b(u - 0.25, u + 0.25, 0.82, 0.86, 0.58, 0.62, C.steelL, 'metal', true); g.s(-0.7, 0.7, 0.8, 0.88, 0.56, 0.64); });
def('pigeonholes', 1.2, 0.35, (g, w, r) => {
  g.b(-0.6, 0.6, 0.8, 2.0, 0, 0.02, C.woodL); for (let i = 0; i <= 6; i++) g.b(-0.6 + i * 0.197, -0.582 + i * 0.197, 0.8, 2.0, 0, 0.35, C.woodL, 'matte', true); for (let y = 0.8; y < 2.01; y += 0.2) g.b(-0.6, 0.6, y, y + 0.015, 0, 0.35, C.woodL, 'matte', true);
  for (let i = 0; i < 6; i++) for (let y = 0.8; y < 1.9; y += 0.2) if (r() < 0.55) g.b(-0.57 + i * 0.197, -0.43 + i * 0.197, y + 0.015, y + 0.03 + r() * 0.08, 0.04, 0.3, pick(r, [C.white, C.card, C.cream]), 'matte', true);
  g.bs(-0.6, 0.6, 0, 0.8, 0, 0.35, C.woodL); g.s(-0.6, 0.6, 0.8, 2.0, 0, 0.35);
});
def('parcels', 1.0, 0.8, (g, w, r) => { let y = 0; for (let i = 0; i < 3; i++) { const s = 0.5 - i * 0.1 + r() * 0.2, h = 0.2 + r() * 0.25; g.q((r() - 0.5) * 0.2, 0.4 + (r() - 0.5) * 0.1, s, s * 0.8, y, y + h, pick(r, [C.card, C.cardD, C.card, C.white])); y += h; } g.s(-0.4, 0.4, 0, y, 0.1, 0.7); });
def('kitchenette', 1.8, 0.6, (g, w, r) => {
  g.bs(-0.9, 0.9, 0, 0.9, 0, 0.6, C.white); g.b(-0.92, 0.92, 0.9, 0.93, 0, 0.62, C.steelL, 'metal', true); g.b(-0.9, 0.9, 1.5, 2.1, 0, 0.32, C.white, 'matte', true);
  g.q(-0.5, 0.3, 0.44, 0.36, 0.93, 0.95, C.steel, 'metal'); g.c(-0.5, 1.05, 0.08, 0.015, 0.24, 'y', C.steelL, 'metal', 5); g.q(0.3, 0.3, 0.2, 0.22, 0.93, 1.2, C.black); g.q(0.65, 0.3, 0.42, 0.3, 0.93, 1.2, C.steelD);
  g.s(-0.9, 0.9, 1.5, 2.1, 0, 0.32);
});
def('fridge', 0.75, 0.75, (g, w, r) => { g.bs(-0.36, 0.36, 0, 1.95, 0, 0.72, C.steelL, 'metal'); g.b(-0.36, 0.36, 0.72, 0.735, 0.72, 0.724, C.steelD); for (const y of [0.9, 0.45]) g.b(0.26, 0.29, y, y + 0.4, 0.72, 0.76, C.steel, 'metal', true); });
def('toolchest', 0.9, 0.5, (g, w, r) => { g.bs(-0.45, 0.45, 0.1, 1.0, 0, 0.5, C.red, 'metal'); for (let y = 0.2; y < 0.98; y += 0.13) g.b(-0.4, 0.4, y, y + 0.02, 0.5, 0.51, C.steelL, 'metal'); castors(g, -0.45, 0.45, 0, 0.5); g.b(-0.45, 0.45, 1.0, 1.25, 0.05, 0.45, C.red, 'metal', true); g.s(-0.45, 0.45, 0, 1.25, 0, 0.5); });
def('waterCooler', 0.4, 0.4, g => { g.bs(-0.17, 0.17, 0, 1.0, 0.03, 0.37, C.white); g.c(0, 1.2, 0.2, 0.13, 0.4, 'y', C.blueL, 'matte', 8); g.s(-0.17, 0.17, 1, 1.4, 0.03, 0.37); });
// A vending machine. The cabinet is drawn here; what is in it (the cans, the glass, the name over the top) and
// what happens when you pull up to it are src/vending.js, which is told where each one stands.
def('vending', 0.95, 0.85, (g, w, r) => {
  const c = pick(r, [0xb3261e, 0x1f4f9a, 0x1c1d21, 0x1f6b4a, 0xd98a14]), d0 = 0.5, d1 = 0.8;
  g.b(-0.47, 0.47, 0.06, 1.85, 0, d0, c); g.b(-0.47, -0.42, 0.06, 1.85, d0, d1, c); g.b(0.18, 0.47, 0.06, 1.85, d0, d1, c);         // back, left cheek, the column the keypad is on
  g.b(-0.42, 0.18, 1.7, 1.85, d0, d1, c); g.b(-0.42, 0.18, 0.06, 0.52, d0, d1, c); g.b(-0.47, 0.47, 1.85, 1.88, -0.0, d1 + 0.02, C.steelD, 'metal', true);
  for (const u of [-0.4, 0.4]) for (const d of [0.08, 0.72]) g.b(u - 0.04, u + 0.04, 0, 0.06, d - 0.04, d + 0.04, C.black);       // feet
  g.b(-0.42, 0.18, 0.52, 1.7, d0, d0 + 0.006, 0x333a44, 'glow');                                                               // the lit back of the case
  for (const u of [-0.415, 0.172]) g.b(u, u + 0.008, 0.54, 1.68, d0 + 0.02, d1 - 0.03, 0xaab6c4, 'glow');                       // a tube up each side
  for (const y of [0.6, 0.97, 1.34]) { g.b(-0.42, 0.18, y - 0.02, y, d0, d1 - 0.05, C.steelL, 'metal', true); g.b(-0.42, 0.18, y - 0.05, y - 0.02, d1 - 0.06, d1 - 0.05, C.steelD, 'metal'); }
  g.b(-0.36, 0.12, 0.18, 0.4, d1, d1 + 0.004, C.black); g.b(-0.37, 0.13, 0.4, 0.43, d1, d1 + 0.02, C.steelL, 'metal', true);       // the flap it comes out of
  g.b(-0.3, 0.06, 0.2, 0.23, d1 + 0.004, d1 + 0.008, C.steelD, 'metal');
  g.b(0.22, 0.43, 1.42, 1.54, d1, d1 + 0.005, 0x1c5a3a, 'glow');                                                               // the little screen
  for (let i = 0; i < 12; i++) g.b(0.235 + (i % 3) * 0.065, 0.28 + (i % 3) * 0.065, 1.3 - Math.floor(i / 3) * 0.06, 1.34 - Math.floor(i / 3) * 0.06, d1, d1 + 0.008, i === 11 ? C.led : i === 9 ? C.ledR : C.steelL, 'metal');
  g.b(0.25, 0.4, 0.94, 1.04, d1, d1 + 0.006, C.steelL, 'metal'); g.b(0.315, 0.335, 0.955, 1.025, d1 + 0.006, d1 + 0.008, C.black);       // coins
  g.b(0.24, 0.41, 0.8, 0.86, d1, d1 + 0.006, C.black); g.b(0.25, 0.4, 0.822, 0.836, d1 + 0.006, d1 + 0.008, C.ledB, 'glow');             // notes
  g.b(0.26, 0.39, 0.6, 0.7, d1, d1 + 0.012, C.steelD, 'metal'); g.b(0.28, 0.37, 0.56, 0.6, d1, d1 + 0.03, C.steelL, 'metal', true);       // change
  g.s(-0.47, 0.47, 0, 1.88, 0, d1);
  g.mark('vending', 0, d1, 0, { colour: c });
});

// ---- the café ----
def('column', 0.56, 0.56, g => { g.bs(-0.26, 0.26, 0, g.H, 0.02, 0.54, 0xb9b6ad); g.b(-0.28, 0.28, 0, 0.14, 0, 0.56, C.steelD); g.b(-0.27, 0.27, 0.14, 1.0, 0.01, 0.55, 0x7c8690); g.b(-0.285, 0.285, 1.0, 1.04, -0.005, 0.565, C.steelL, 'metal'); g.b(-0.29, 0.29, g.H - 0.22, g.H, -0.01, 0.57, 0x8f8c84); });
def('booth', 2.1, 1.75, (g, w, r) => {                                  // two benches with high backs and a table between, end-on to the wall
  // Each bench: a panelled oak base with a black toe-kick, two seat cushions with chamfered edges, a back of four
  // buttoned channels on an oak board, and an oak cap rail. Leather has a sheen; the colour varies a shade cushion to cushion.
  const c = pick(r, [C.leather, C.velvet, C.greenD, 0x2c4460, 0x8a4a1c]), t = pick(r, [C.woodL, C.white, C.woodD]), lth = c === C.velvet ? 'matte' : 'sheen';
  const shade = k => [16, 8, 0].reduce((h, b) => h | Math.min(255, Math.round(((c >> b) & 255) * k)) << b, 0), btn = shade(0.55);
  for (const sg of [-1, 1]) {
    const u0 = sg < 0 ? -1.03 : 0.45, u1 = u0 + 0.58, bo = sg * 1.03, bi = sg * 0.97, ci = sg * 0.87;   // the seat; the back board; the back cushions
    g.b(u0 + 0.03, u1 - 0.03, 0, 0.07, 0.05, 1.57, C.black);                                                   // toe-kick
    g.b(u0, u1, 0.07, 0.33, 0.02, 1.6, C.woodD); for (const [d0, d1] of [[0.12, 0.76], [0.86, 1.5]]) g.b(sg < 0 ? u1 : u0 - 0.008, sg < 0 ? u1 + 0.008 : u0, 0.12, 0.28, d0, d1, 0x3a2618);      // fielded panels on its face
    for (const [d0, d1, k] of [[0.03, 0.805, 0.97], [0.815, 1.59, 1.03]]) g.cu(sg < 0 ? bi : u0 + 0.005, sg < 0 ? u1 - 0.005 : bi, 0.33, 0.47, d0, d1, 0.04, shade(k), lth);
    g.b(Math.min(bo, bi), Math.max(bo, bi), 0, 1.22, 0.02, 1.6, C.woodD);                                       // the back board
    for (let i = 0; i < 4; i++) {
      const d0 = 0.03 + i * 0.39, d1 = d0 + 0.38, k = 0.94 + (i % 2) * 0.08;
      g.cu(Math.min(bi, ci), Math.max(bi, ci), 0.47, 1.16, d0, d1, 0.03, shade(k), lth);
      for (const y of [0.7, 0.95]) g.c(sg < 0 ? ci + 0.002 : ci - 0.002, y, (d0 + d1) / 2, 0.011, 0.012, 'u', btn, 'matte', 8);
    }
    g.b(Math.min(bo, ci) - 0.01, Math.max(bo, ci) + 0.01, 1.22, 1.26, 0.01, 1.61, C.woodD, 'matte', true);          // cap rail
    g.s(u0, u1, 0, 0.47, 0.02, 1.6); g.s(Math.min(bo, ci), Math.max(bo, ci), 0, 1.26, 0.02, 1.6);
  }
  g.cu(-0.4, 0.4, 0.705, 0.75, 0.02, 1.45, 0.012, t); g.b(-0.385, 0.385, 0.69, 0.705, 0.035, 1.435, C.woodD, 'matte', true); g.c(0, 0.355, 0.75, 0.05, 0.69, 'y', C.steelD, 'metal', 12); g.b(-0.2, 0.2, 0, 0.03, 0.55, 0.95, C.steelD, 'metal'); g.s(-0.4, 0.4, 0.66, 0.78, 0.02, 1.45);
  g.b(-0.38, 0.38, 1.3, 1.7, 0, 0.02, pick(r, PAINT)); g.c(0, 1.98, 0.75, 0.16, 0.2, 'y', C.woodD, 'matte', 8); g.c(0, 1.875, 0.75, 0.13, 0.012, 'y', C.lamp, 'glow', 8); g.c(0, 2.08 + Math.max(0.1, g.H - 2.1) / 2, 0.75, 0.008, Math.max(0.1, g.H - 2.1), 'y', C.black, 'matte', 4);
  if (r() < 0.6) g.c(0.2 * (r() - 0.5), 0.8, 0.3 + r() * 0.8, 0.035, 0.1, 'y', C.white, 'matte', 6); if (r() < 0.4) g.q(-0.15, 1.0, 0.3, 0.22, 0.75, 0.765, C.orange);
});
def('refectory', 4.4, 0.9, (g, w, r) => {                               // a long table, too heavy to shift; the chairs along it are not
  const e = w / 2, t = pick(r, [C.woodL, C.pine, C.woodD]);
  g.b(-e, e, 0.69, 0.75, 0, 0.9, t, 'matte', true); g.b(-e + 0.2, e - 0.2, 0.6, 0.69, 0.1, 0.8, C.woodD, 'matte', true);
  for (const u of [-e + 0.35, e - 0.35]) { g.bs(u - 0.05, u + 0.05, 0, 0.69, 0.12, 0.78, C.woodD); g.b(u - 0.07, u + 0.07, 0, 0.05, 0.04, 0.86, C.woodD); }
  g.b(-e + 0.4, e - 0.4, 0.22, 0.28, 0.41, 0.49, C.woodD, 'matte', true); g.s(-e, e, 0.6, 0.78, 0, 0.9);
  for (let u = -e + 0.5; u < e - 0.3; u += 0.9 + r() * 0.5) { const k = r(); if (k < 0.3) g.c(u, 0.8, 0.3 + r() * 0.3, 0.035, 0.1, 'y', C.white, 'matte', 6); else if (k < 0.5) g.q(u, 0.45, 0.42, 0.3, 0.75, 0.765, pick(r, [C.orange, C.fabric, C.cream])); else if (k < 0.6) g.c(u, 0.83, 0.45, 0.05, 0.16, 'y', C.glass, 'matte', 6); }
});
def('highTable', 0.7, 0.7, (g, w, r) => { g.c(0, 1.05, 0.35, 0.33, 0.04, 'y', pick(r, [C.woodD, C.white, C.black]), 'matte', 12); g.c(0, 0.52, 0.35, 0.035, 1.02, 'y', C.steelL, 'metal', 6); g.c(0, 0.015, 0.35, 0.25, 0.03, 'y', C.steelD, 'metal', 10); g.c(0, 0.3, 0.35, 0.16, 0.02, 'y', C.steelL, 'metal', 8); g.s(-0.05, 0.05, 0, 1.03, 0.3, 0.4); g.s(-0.33, 0.33, 1.0, 1.1, 0.02, 0.68); });
def('cafeCounter', 11, 3.1, (g, w, r) => {                              // the servery: back counter, the counter you queue along with its tray rail, tills, a cold case, the menu overhead
  const e = w / 2, f0 = 1.9, f1 = 2.6;
  g.bs(-e, e, 0, 0.9, 0, 0.65, C.steelL, 'metal'); g.b(-e, e, 0.9, 0.93, 0, 0.68, C.steelD, 'metal', true); g.b(-e, e, 0.93, 1.5, 0, 0.02, C.enamel);
  for (let u = -e + 0.1; u < e - 0.5; u += 1.3) g.b(u, u + 1.2, 0.08, 0.84, 0.65, 0.655, C.steel, 'metal');
  g.b(-e, e, 1.55, 1.58, 0, 0.36, C.steelL, 'metal', true); fill(g, -e + 0.05, e - 0.05, 1.58, 0, 0.36, 0.34, r, 'crockery'); fill(g, -e + 0.05, e - 2.4, 0.93, 0.04, 0.6, 0.4, r, 'pots');
  g.qs(e - 1.6, 0.34, 0.5, 0.5, 0.93, 1.5, C.steelD, 'metal'); g.c(e - 1.6, 1.56, 0.34, 0.2, 0.12, 'y', C.steelL, 'metal', 10); for (const du of [-0.14, 0.14]) g.c(e - 1.6 + du, 1.12, 0.62, 0.02, 0.1, 'd', C.black, 'matte', 6);       // the coffee machine
  g.qs(e - 0.75, 0.34, 0.4, 0.4, 0.93, 1.38, C.black); g.c(e - 0.75, 1.5, 0.34, 0.14, 0.24, 'y', C.glass, 'matte', 8);                 // a grinder
  g.s(-e, e, 0.9, 1.95, 0, 0.4);
  g.bs(-e, e, 0, 0.9, f0, f1, C.woodD); for (let u = -e + 0.15; u < e - 0.2; u += 0.55) g.b(u, u + 0.42, 0.1, 0.82, f1, f1 + 0.012, C.wood);
  g.b(-e - 0.04, e + 0.04, 0.9, 0.94, f0 - 0.06, f1 + 0.06, 0x2b2d31, 'matte', true);
  for (const d of [f1 + 0.16, f1 + 0.26, f1 + 0.36]) g.b(-e, e, 0.84, 0.86, d - 0.012, d + 0.012, C.steelL, 'metal', true); for (let u = -e + 0.2; u < e; u += 1.5) g.b(u - 0.015, u + 0.015, 0.8, 0.84, f1, f1 + 0.38, C.steelD, 'metal', true);         // the tray rail
  g.b(-e + 0.3, -e + 4.3, 0.94, 1.42, f0 + 0.06, f1 - 0.06, C.glass, 'matte', true); g.b(-e + 0.3, -e + 4.3, 1.42, 1.45, f0 + 0.02, f1 - 0.02, C.steelL, 'metal', true); g.b(-e + 0.32, -e + 4.28, 1.4, 1.415, f0 + 0.08, f1 - 0.08, 0xf2f6ff, 'glow');
  g.b(-0.6, 1.9, 0.94, 0.99, f0 + 0.08, f1 - 0.08, C.steelL, 'metal', true); for (let u = -0.4; u < 1.8; u += 0.55) g.q(u, f0 + 0.35, 0.44, 0.4, 0.99, 1.0, pick(r, [0x8a4a1c, 0xc8a040, 0x5c7a3a, 0xa02c22]));      // the hot plates
  g.b(-0.6, 1.9, 1.5, 1.54, f0 + 0.1, f1 - 0.1, C.steelL, 'metal', true); for (const u of [-0.58, 1.88]) g.b(u - 0.02, u + 0.02, 0.99, 1.5, f0 + 0.32, f0 + 0.38, C.steelD, 'metal'); g.b(-0.5, 1.8, 1.47, 1.5, f0 + 0.2, f1 - 0.2, 0xffd9a0, 'glow');
  for (const u of [e - 2.6, e - 1.0]) { g.q(u, f0 + 0.35, 0.36, 0.34, 0.94, 1.08, C.black); g.b(u - 0.15, u + 0.15, 1.1, 1.34, f0 + 0.3, f0 + 0.33, C.black, 'matte', true); g.b(u - 0.13, u + 0.13, 1.12, 1.32, f0 + 0.33, f0 + 0.334, C.screen, 'glow'); g.q(u + 0.32, f0 + 0.5, 0.1, 0.16, 0.94, 1.0, C.steelD); }       // tills
  g.c(e - 0.2, 1.02, f0 + 0.35, 0.09, 0.16, 'y', C.woodL, 'matte', 8);
  g.s(-e, e, 0.9, 1.5, f0, f1);
  const my = Math.min(g.H - 0.95, 2.3); g.b(-e, e, my, my + 0.8, 0.0, 0.07, C.black);                                        // the menu, lit, over the back counter
  for (let u = -e + 0.25; u < e - 1.2; u += 1.55) { g.b(u, u + 1.35, my + 0.08, my + 0.72, 0.07, 0.075, 0x2a2c2e, 'glow'); for (let k = 0; k < 6; k++) g.b(u + 0.1, u + 0.5 + r() * 0.6, my + 0.14 + k * 0.095, my + 0.165 + k * 0.095, 0.075, 0.078, k === 5 ? 0xffc864 : 0xe8e4d8, 'glow'); }
});
def('drinksFridge', 1.3, 0.75, (g, w, r) => {
  g.bs(-0.63, 0.63, 0, 2.0, 0, 0.7, C.black); g.b(-0.58, 0.58, 0.14, 1.72, 0.7, 0.705, 0x66727e, 'glow'); g.b(-0.02, 0.02, 0.1, 1.76, 0.705, 0.72, C.steelD, 'metal'); g.b(-0.6, 0.6, 1.78, 1.96, 0.7, 0.705, 0x2a6ea8, 'glow');
  for (let y = 0.2; y < 1.6; y += 0.3) { g.b(-0.58, 0.58, y - 0.014, y, 0.705, 0.71, C.steelD, 'metal'); const c = pick(r, MERCH); for (let u = -0.54; u < 0.5; u += 0.085) if (Math.abs(u) > 0.04) g.b(u, u + 0.06, y, y + 0.17 + r() * 0.05, 0.706, 0.712, r() < 0.75 ? c : pick(r, MERCH)); }
  for (const u of [-0.08, 0.08]) g.b(u - 0.012, u + 0.012, 0.8, 1.2, 0.72, 0.745, C.steelL, 'metal');
});
def('trayReturn', 1.5, 0.7, (g, w, r) => {
  for (const u of [-0.72, 0.72]) for (const d of [0.04, 0.64]) g.q(u, d, 0.03, 0.03, 0.1, 1.85, C.steelL, 'metal'); g.b(-0.74, 0.74, 1.85, 1.88, 0.02, 0.66, C.steelL, 'metal', true);
  for (let y = 0.3; y < 1.8; y += 0.14) { g.b(-0.7, 0.7, y, y + 0.012, 0.05, 0.63, C.steelL, 'metal', true); if (r() < 0.65) { g.b(-0.66, -0.04, y + 0.012, y + 0.03, 0.08, 0.6, pick(r, [C.fabric, C.orange, C.cream])); if (r() < 0.6) g.c(-0.4, y + 0.05, 0.3, 0.09, 0.03, 'y', C.white, 'matte', 8); } if (r() < 0.5) g.b(0.04, 0.66, y + 0.012, y + 0.03, 0.08, 0.6, pick(r, [C.fabric, C.orange, C.cream])); }
  castors(g, -0.74, 0.74, 0.02, 0.66); g.b(-0.5, 0.5, 1.95, 2.2, 0, 0.02, C.green); g.s(-0.74, 0.74, 0, 1.88, 0.02, 0.66);
});
def('coffeeCart', 1.6, 0.9, (g, w, r) => {
  g.bs(-0.75, 0.75, 0.22, 0.95, 0.1, 0.8, 0x2a4a3a); g.b(-0.8, 0.8, 0.95, 0.99, 0.05, 0.85, C.woodL, 'matte', true); for (const u of [-0.6, 0.6]) { g.c(u, 0.22, 0.45, 0.22, 0.05, 'u', C.black, 'matte', 12); g.c(u, 0.22, 0.45, 0.06, 0.07, 'u', C.steelL, 'metal', 6); }
  g.q(-0.3, 0.45, 0.5, 0.4, 0.99, 1.4, C.steelL, 'metal'); g.c(0.35, 1.07, 0.4, 0.07, 0.16, 'y', C.white, 'matte', 6); g.c(0.52, 1.07, 0.45, 0.07, 0.16, 'y', C.white, 'matte', 6); g.q(0.4, 0.68, 0.3, 0.14, 0.99, 1.08, C.woodD);
  for (const u of [-0.76, 0.76]) g.c(u, 1.55, 0.45, 0.018, 1.12, 'y', C.steelD, 'metal', 5); g.b(-0.95, 0.95, 2.1, 2.14, -0.1, 1.0, 0x8a2a22, 'matte', true); g.b(-0.95, 0.95, 1.96, 2.1, 0.98, 1.0, C.cream); g.b(-0.4, 0.4, 0.4, 0.8, 0.8, 0.806, 0x1e1f22); g.s(-0.8, 0.8, 0.9, 2.14, 0.05, 0.85);
});

// ---- books and paper ----
def('shelf', 1.2, 0.5, (g, w, r, o = {}) => {                           // steel shelving, open both sides
  const e = w / 2, h = 2.25, c = o.cold ? C.steelL : pick(r, [C.steel, C.galv, C.steel]);
  for (const u of [-e + 0.02, e - 0.02]) for (const d of [0.02, 0.48]) g.q(u, d, 0.04, 0.04, 0, h, c, 'metal');
  for (const y of [0.15, 0.75, 1.35, 1.95]) { g.b(-e, e, y - 0.03, y, 0, 0.5, c, 'metal', y > 0.5); if (y < 1.9 || r() < 0.5) fill(g, -e + 0.04, e - 0.04, y, 0, 0.5, 0.55, r, o.k || 'boxes'); }
  g.s(-e, e, 0, h, 0, 0.5);
});
def('stack', 1.0, 0.62, (g, w, r, o = {}) => {                          // a library stack, books both faces
  const e = w / 2, h = 2.3, c = C.cream;
  g.b(-e, -e + 0.025, 0, h, 0, 0.62, c, 'metal'); g.b(e - 0.025, e, 0, h, 0, 0.62, c, 'metal'); g.b(-e, e, h - 0.03, h, 0, 0.62, c, 'metal', true); g.b(-e, e, 0, h, 0.3, 0.32, c, 'metal');
  for (let y = 0.1; y < h - 0.3; y += 0.36) { g.b(-e, e, y - 0.02, y, 0, 0.62, c, 'metal', true); fill(g, -e + 0.025, e - 0.025, y, 0.02, 0.3, 0.32, r, o.k || 'books'); fill(g, -e + 0.025, e - 0.025, y, 0.32, 0.6, 0.32, r, o.k || 'books'); }
  if (o.cage) for (const d of [0.005, 0.615]) { for (let u = -e; u <= e + 0.001; u += w / 5) g.b(u - 0.006, u + 0.006, 0, h, d - 0.005, d + 0.005, C.steelD, 'metal'); for (let y = 0.3; y < h; y += 0.4) g.b(-e, e, y, y + 0.012, d - 0.005, d + 0.005, C.steelD, 'metal'); }
  g.s(-e, e, 0, h, 0, 0.62);
});
def('booktrolley', 0.9, 0.45, (g, w, r) => {
  for (const u of [-0.43, 0.43]) g.b(u - 0.015, u + 0.015, 0.1, 1.05, 0.02, 0.43, C.steel, 'metal', true);
  for (const y of [0.2, 0.55, 0.9]) { g.b(-0.43, 0.43, y - 0.02, y, 0.02, 0.43, C.steel, 'metal', true); fill(g, -0.42, 0.42, y, 0.04, 0.4, 0.3, r, r() < 0.7 ? 'books' : 'archive'); }
  castors(g, -0.43, 0.43, 0.02, 0.43); g.s(-0.44, 0.44, 0, 1.2, 0.02, 0.43);
});
def('kickstool', 0.45, 0.45, g => { g.c(0, 0.13, 0.22, 0.2, 0.26, 'y', C.red, 'matte', 10); g.c(0, 0.3, 0.22, 0.15, 0.1, 'y', C.red, 'matte', 10); g.s(-0.2, 0.2, 0, 0.36, 0.02, 0.42); });
def('cardcatalogue', 1.1, 0.5, (g, w, r) => { g.bs(-0.55, 0.55, 0.3, 1.5, 0, 0.5, C.wood); for (const u of [-0.5, 0.45]) g.bs(u, u + 0.05, 0, 0.3, 0.05, 0.45, C.wood); for (let y = 0.36; y < 1.45; y += 0.14) for (let u = -0.5; u < 0.5; u += 0.2) g.b(u + 0.06, u + 0.14, y + 0.04, y + 0.07, 0.5, 0.515, C.gilt, 'metal', true); });
def('readingTable', 2.4, 2.2, (g, w, r, o = {}) => {
  const e = w / 2; table(g, -e, e, 0.6, 1.6, 0.75, C.wood, C.woodD);
  for (const u of [-e / 2, e / 2]) { chair(g, u, 0.3, 1, C.woodD); chair(g, u, 1.9, -1, C.woodD); }
  for (const u of [-e / 2, e / 2]) if (r() < 0.8) { g.c(u, 0.93, 1.1, 0.012, 0.36, 'y', C.gilt, 'metal', 5); g.b(u - 0.16, u + 0.16, 1.1, 1.16, 1.04, 1.16, C.green, 'matte', true); g.b(u - 0.14, u + 0.14, 1.094, 1.1, 1.05, 1.15, C.lamp, 'glow', true); }
  for (let i = 0; i < 3; i++) if (r() < 0.7) { const u = -e + 0.3 + r() * (w - 0.6), d = 0.8 + r() * 0.6; o.study && r() < 0.5 ? g.q(u, d, 0.6, 0.45, 0.75, 0.758, pick(r, [C.canvas, C.cream, C.white])) : g.q(u, d, 0.2, 0.28, 0.75, 0.78 + r() * 0.06, pick(r, BOOKS)); }
});
def('planchest', 1.35, 0.98, (g, w, r) => {
  const n = r() < 0.6 ? 2 : 1, h = 0.1 + n * 0.44, c = pick(r, [C.greyL, C.cream, C.steel, C.wood]);
  g.bs(-0.67, 0.67, 0.1, h, 0, 0.98, c, c === C.wood ? 'matte' : 'metal'); g.bs(-0.62, 0.62, 0, 0.1, 0.05, 0.93, C.steelD);
  for (let y = 0.21; y < h - 0.02; y += 0.11) { g.b(-0.65, 0.65, y, y + 0.006, 0.98, 0.984, C.steelD); g.b(-0.08, 0.08, y - 0.06, y - 0.045, 0.98, 0.995, C.steelL, 'metal'); }
  if (r() < 0.5) g.q((r() - 0.5) * 0.4, 0.5, 0.7, 0.5, h, h + 0.02 + r() * 0.04, pick(r, [C.archive, C.cream, C.canvas]));
});

// ---- art in store ----
def('rack', 3.2, 2.7, (g, w, r) => {                                    // rolling screens of mesh, hung with paintings
  const n = Math.max(1, Math.floor(w / 0.5)), p = w / n, h = Math.min(2.9, g.H - 0.5), len = 2.2;
  for (const d of [0.3, 1.9]) g.b(-w / 2, w / 2, h + 0.04, h + 0.14, d - 0.04, d + 0.04, C.steelD, 'metal', true);
  for (let i = 0; i < n; i++) {
    const u = -w / 2 + (i + 0.5) * p, out = r() < 0.2 ? r() * 0.4 : 0, d0 = 0.05 + out, d1 = d0 + len, t = 0.02;
    g.b(u - t, u + t, 0.1, h, d0, d0 + 0.04, C.steel, 'metal'); g.b(u - t, u + t, 0.1, h, d1 - 0.04, d1, C.steel, 'metal', true); g.b(u - t, u + t, h - 0.04, h + 0.04, d0, d1, C.steel, 'metal', true); g.b(u - t, u + t, 0.1, 0.14, d0, d1, C.steel, 'metal', true);
    for (let y = 1.0; y < h - 0.1; y += 0.9) g.b(u - 0.006, u + 0.006, y, y + 0.012, d0, d1, C.steel, 'metal');
    for (let d = d0 + 0.72; d < d1 - 0.1; d += 0.72) g.b(u - 0.006, u + 0.006, 0.14, h, d - 0.006, d + 0.006, C.steel, 'metal');
    g.b(u - 0.03, u + 0.03, 0.9, 1.3, d1, d1 + 0.03, C.steelD, 'metal', true);
    for (const side of [-1, 1]) {
      let d = d0 + 0.15 + r() * 0.3;
      while (d < d1 - 0.5) { const pw = Math.min(d1 - 0.1 - d, 0.5 + r() * 1.1), ph = 0.5 + r() * 1.1, y = 0.35 + r() * (h - 0.5 - ph); if (r() < 0.8) picture(g, 'u', d, d + pw, y, y + ph, u + side * 0.012, side * 0.05, r); d += pw + 0.1 + r() * 0.5; }
    }
  }
  g.s(-w / 2, w / 2, 0, h + 0.14, 0, 2.7);
});
def('palletFigure', 1.25, 1.05, (g, w, r) => {
  pallet(g, -0.6, 0.6, 0.02, 1.02); const k = r(); let h = 1.2;
  if (k < 0.35) h = figure(g, 0, 0.52, 0.14, r, true);
  else if (k < 0.55) { h = figure(g, 0, 0.52, 0.14, r, false) + 0.25; for (const u of [-0.5, 0.45]) for (const d of [0.1, 0.9]) g.b(u, u + 0.05, 0.14, 0.14 + h, d, d + 0.05, C.pine); for (const d of [0.1, 0.9]) g.b(-0.5, 0.5, 0.09 + h, 0.14 + h, d, d + 0.05, C.pine, 'matte', true); for (const u of [-0.5, 0.45]) g.b(u, u + 0.05, 0.09 + h, 0.14 + h, 0.1, 0.95, C.pine, 'matte', true); }
  else if (k < 0.75) { g.q(0, 0.52, 0.5, 0.5, 0.14, 0.7, C.ply); const c = pick(r, [C.plaster, C.bronze, C.tissue]); g.c(0, 0.85, 0.52, 0.2, 0.3, 'y', c, 'matte', 8); g.c(0, 1.12, 0.52, 0.14, 0.26, 'y', c, 'matte', 8); h = 1.2; }
  else if (k < 0.9) { g.c(0, 0.42, 0.52, 0.28, 0.56, 'y', C.terracotta, 'matte', 10); g.c(0, 0.8, 0.52, 0.2, 0.2, 'y', C.terracotta, 'matte', 10); g.c(0, 0.98, 0.52, 0.11, 0.16, 'y', C.terracotta, 'matte', 8); h = 1.0; }
  else { h = 0.5 + r() * 0.5; crateBox(g, -0.5, 0.5, 0.14, 0.14 + h, 0.12, 0.92, r); }
  g.s(-0.6, 0.6, 0, 0.14 + h, 0.02, 1.02);
});
def('crate', 1.3, 0.9, (g, w, r) => {
  const cw = 0.8 + r() * 0.5, cd = 0.5 + r() * 0.35, h = 0.6 + r() * 1.1; crateBox(g, -cw / 2, cw / 2, 0, h, 0.02, 0.02 + cd, r); let top = h;
  if (h < 1.1 && r() < 0.5) { const h2 = 0.3 + r() * 0.5; crateBox(g, -cw / 2 + 0.05, cw / 2 - 0.15, h, h + h2, 0.05, cd - 0.03, r); top = h + h2; }
  g.s(-cw / 2, cw / 2, 0, top, 0.02, 0.02 + cd);
});
def('crates', 2.4, 1.3, (g, w, r) => {                                  // a stack: painting crates on edge, and boxes on them
  let u = -1.2, top = 0;
  while (u < 0.9) { const cw = r() < 0.5 ? 0.3 + r() * 0.25 : 0.8 + r() * 0.5, h = 0.9 + r() * 1.2, cd = 0.9 + r() * 0.35; if (u + cw > 1.2) break; crateBox(g, u, u + cw, 0, h, 0.02, 0.02 + cd, r); top = Math.max(top, h); u += cw + 0.03; }
  g.s(-1.2, u, 0, top, 0.02, 1.3);
});
def('pallets', 1.25, 1.05, (g, w, r) => { const n = 2 + Math.floor(r() * 6); for (let i = 0; i < n; i++) { const y = i * 0.15; g.b(-0.6, 0.6, y + 0.1, y + 0.14, 0.02, 1.02, C.pine, 'matte', true); for (const f of [0, 0.5, 1]) { const u = -0.6 + 1.1 * f; g.b(u, u + 0.1, y, y + 0.1, 0.02, 1.02, C.pine); } } g.s(-0.6, 0.6, 0, n * 0.15, 0.02, 1.02); });
def('pallettruck', 0.7, 1.6, (g, w, r) => {
  const c = pick(r, [C.yellow, C.red, C.orange]);
  for (const u of [-0.2, 0.2]) g.bs(u - 0.08, u + 0.08, 0.05, 0.1, 0.4, 1.6, c, 'metal', true);
  g.bs(-0.27, 0.27, 0.05, 0.42, 0.18, 0.42, c, 'metal', true); g.c(0, 0.09, 0.2, 0.09, 0.14, 'u', C.rubber, 'matte', 8);
  g.b(-0.02, 0.02, 0.42, 1.15, 0.1, 0.14, C.black, 'matte', true); g.b(-0.18, 0.18, 1.12, 1.16, 0.06, 0.1, C.black, 'matte', true); g.s(-0.18, 0.18, 0.42, 1.16, 0.06, 0.2);
});
def('trolley', 0.7, 1.1, (g, w, r) => {
  g.bs(-0.33, 0.33, 0.14, 0.2, 0.05, 1.05, pick(r, [C.blue, C.steel, C.woodL]), 'matte', true); castors(g, -0.33, 0.33, 0.05, 1.05, 0.14);
  for (const u of [-0.3, 0.3]) g.b(u - 0.015, u + 0.015, 0.2, 0.95, 0.06, 0.09, C.steel, 'metal', true); g.b(-0.3, 0.3, 0.92, 0.95, 0.06, 0.09, C.steel, 'metal', true); g.s(-0.33, 0.33, 0.2, 0.95, 0.05, 0.1);
  if (r() < 0.6) { const h = 0.2 + r() * 0.4; g.qs(0, 0.6, 0.5, 0.6, 0.2, 0.2 + h, pick(r, [C.card, C.archive, C.foam, C.ply])); }
});
def('slimTrolley', 1.0, 0.34, (g, w, r) => {
  for (const u of [-0.48, 0.48]) g.b(u - 0.015, u + 0.015, 0.1, 1.2, 0.02, 0.32, C.steel, 'metal', true);
  for (const y of [0.16, 0.6, 1.02]) { g.b(-0.48, 0.48, y - 0.02, y, 0.02, 0.32, C.steel, 'metal', true); if (r() < 0.8) fill(g, -0.46, 0.46, y, 0.02, 0.32, 0.36, r, pick(r, ['boxes', 'supplies', 'linen', 'archive'])); }
  castors(g, -0.48, 0.48, 0.02, 0.32); g.s(-0.5, 0.5, 0, 1.3, 0.02, 0.32);
});
def('aframe', 1.5, 0.8, (g, w, r) => {                                  // the trolley paintings travel on
  g.bs(-0.75, 0.75, 0.14, 0.2, 0.02, 0.78, C.woodL, 'matte', true); castors(g, -0.75, 0.75, 0.02, 0.78, 0.14); g.bs(-0.75, 0.75, 0.2, 1.5, 0.36, 0.44, C.fabric);
  for (const s of [-1, 1]) if (r() < 0.75) { const pw = 0.7 + r() * 0.6, ph = 0.6 + r() * 0.6; picture(g, 'd', -pw / 2, pw / 2, 0.22, 0.22 + ph, 0.4 + s * 0.045, s * 0.06, r); }
  g.s(-0.75, 0.75, 0.2, 1.5, 0.3, 0.5);
});
def('ladder', 0.6, 0.35, (g, w, r) => { const h = 2.4; for (const u of [-0.22, 0.22]) g.b(u - 0.02, u + 0.02, 0, h, 0.02, 0.08, C.steelL, 'metal', true); for (let y = 0.28; y < h; y += 0.28) g.b(-0.22, 0.22, y, y + 0.025, 0.03, 0.07, C.steelL, 'metal', true); g.s(-0.24, 0.24, 0, h, 0.02, 0.1); });
def('rollcage', 0.85, 0.75, (g, w, r) => {
  g.b(-0.4, 0.4, 0.14, 0.18, 0.03, 0.72, C.steel, 'metal', true); castors(g, -0.4, 0.4, 0.03, 0.72, 0.14);
  for (const u of [-0.4, 0.4]) for (const d of [0.03, 0.72]) g.q(u, d, 0.025, 0.025, 0.18, 1.7, C.steelL, 'metal');
  for (let y = 0.5; y < 1.75; y += 0.3) { g.b(-0.4, 0.4, y, y + 0.012, 0.025, 0.035, C.steelL, 'metal', true); g.b(-0.405, -0.395, y, y + 0.012, 0.03, 0.72, C.steelL, 'metal', true); g.b(0.395, 0.405, y, y + 0.012, 0.03, 0.72, C.steelL, 'metal', true); }
  let y = 0.18; for (let i = 0; i < 3 && r() < 0.8; i++) { const h = 0.25 + r() * 0.3; g.q((r() - 0.5) * 0.1, 0.38, 0.6, 0.5, y, y + h, pick(r, [C.card, C.cardD, C.white, C.blueL])); y += h; }
  g.s(-0.41, 0.41, 0, 1.7, 0.03, 0.72);
});
def('freezer', 1.5, 0.75, (g, w, r) => { g.bs(-0.72, 0.72, 0.05, 0.9, 0.02, 0.72, C.enamel, 'metal'); g.b(-0.74, 0.74, 0.9, 0.95, 0, 0.74, C.white, 'matte', true); g.b(0.5, 0.56, 0.5, 0.56, 0.72, 0.724, C.led, 'glow'); g.b(-0.2, 0.2, 0.86, 0.89, 0.74, 0.77, C.steelD); });
def('evaporator', 1.6, 0.6, g => { const y = g.H - 0.55; g.b(-0.8, 0.8, y, g.H - 0.08, 0, 0.5, C.steelL, 'metal', true); for (const u of [-0.4, 0.4]) { g.c(u, y + 0.24, 0.51, 0.2, 0.03, 'd', C.black, 'matte', 10); } g.b(-0.6, -0.5, y + 0.05, y + 0.1, 0.5, 0.505, C.ledB, 'glow'); });
def('armourStand', 0.7, 0.7, (g, w, r) => {
  g.c(0, 0.02, 0.35, 0.25, 0.04, 'y', C.woodD, 'matte', 8); g.c(0, 0.55, 0.35, 0.03, 1.1, 'y', C.woodD, 'matte', 6);
  const c = pick(r, [C.steelL, C.steel, C.bronze]); g.c(0, 1.2, 0.35, 0.2, 0.5, 'y', c, 'metal', 10); g.c(0, 0.92, 0.35, 0.23, 0.12, 'y', c, 'metal', 10); g.b(-0.36, 0.36, 1.32, 1.44, 0.28, 0.42, c, 'metal', true); g.c(0, 1.64, 0.35, 0.12, 0.26, 'y', c, 'metal', 10);
  if (r() < 0.5) g.c(0, 1.8, 0.35, 0.03, 0.14, 'y', C.red, 'matte', 5);
  g.s(-0.3, 0.3, 0, 1.8, 0.1, 0.6);
});
def('swordRack', 1.6, 0.25, (g, w, r) => { g.b(-0.8, 0.8, 0.5, 2.0, 0, 0.03, C.woodD); for (const y of [0.7, 1.7]) g.b(-0.8, 0.8, y, y + 0.05, 0.03, 0.18, C.woodD, 'matte', true); for (let u = -0.7; u < 0.75; u += 0.13) if (r() < 0.8) { g.b(u - 0.015, u + 0.015, 0.75 + r() * 0.2, 1.72, 0.08, 0.1, C.steelL, 'metal', true); g.b(u - 0.06, u + 0.06, 1.75, 1.78, 0.07, 0.11, C.gilt, 'metal', true); g.b(u - 0.015, u + 0.015, 1.78, 1.92, 0.08, 0.1, C.woodD); } g.s(-0.8, 0.8, 0.5, 2, 0, 0.18); });
def('rollRack', 2.2, 0.6, (g, w, r) => {                                // rolled textiles, or rolls of paper, on arms
  for (const u of [-1.0, 1.0]) g.bs(u - 0.04, u + 0.04, 0, 2.2, 0, 0.08, C.steel, 'metal');
  for (let y = 0.35; y < 2.1; y += 0.3) { for (const u of [-1.0, 1.0]) g.b(u - 0.02, u + 0.02, y - 0.02, y, 0.08, 0.55, C.steel, 'metal', true); for (let d = 0.2; d < 0.5; d += 0.16) if (r() < 0.8) g.c((r() - 0.5) * 0.1, y + 0.07, d, 0.06 + r() * 0.015, 1.7 + r() * 0.3, 'u', pick(r, [C.tissue, C.canvas, C.white, C.velvet, C.blueL, C.cream, C.card]), 'matte', 7); }
  g.s(-1.05, 1.05, 0.3, 2.2, 0, 0.56);
});
def('mannequin', 0.6, 0.6, (g, w, r) => { g.c(0, 0.02, 0.3, 0.2, 0.04, 'y', C.steelD, 'metal', 8); g.c(0, 0.5, 0.3, 0.02, 1.0, 'y', C.steelD, 'metal', 5); const c = r() < 0.5 ? C.tissue : pick(r, COATS); g.c(0, 1.05, 0.3, 0.24, 0.7, 'y', c, 'matte', 8); g.c(0, 1.25, 0.3, 0.17, 0.5, 'y', C.canvas, 'matte', 8); g.c(0, 1.55, 0.3, 0.06, 0.1, 'y', C.canvas, 'matte', 6); g.s(-0.24, 0.24, 0, 1.6, 0.06, 0.54); });
def('wrappedFurniture', 1.4, 0.9, (g, w, r) => {
  const k = r(), c = pick(r, [C.tissue, C.foam, C.white, C.fabric]);
  if (k < 0.4) { g.bs(-0.6, 0.6, 0, 0.5 + r() * 0.5, 0.1, 0.8, c); g.b(-0.6, 0.6, 0.5, 1.1, 0.1, 0.3, c, 'matte', true); g.s(-0.6, 0.6, 0, 1.1, 0.1, 0.3); }
  else if (k < 0.7) { const h = 1.4 + r() * 0.7; g.bs(-0.5, 0.5, 0.06, h, 0.15, 0.7, r() < 0.5 ? C.woodD : c); for (const u of [-0.42, 0.42]) g.bs(u - 0.04, u + 0.04, 0, 0.06, 0.2, 0.65, C.woodD); for (const y of [0.5, h - 0.4]) g.b(-0.51, 0.51, y, y + 0.03, 0.14, 0.71, C.blue, 'matte', true); }
  else { table(g, -0.6, 0.6, 0.1, 0.8, 0.76, C.woodD, C.woodD); chair(g, -0.2, 0.45, 1, C.woodD, 0.86); g.q(0.3, 0.45, 0.4, 0.4, 0.76, 1.0, c); }
});
def('plinth', 0.7, 0.7, (g, w, r) => { const s = 0.4 + r() * 0.25, h = 0.7 + r() * 0.5; g.qs(0, 0.35, s, s, 0, h, pick(r, [C.white, C.white, C.greyL, C.ply])); });
def('vitrine', 0.9, 0.9, (g, w, r) => { g.qs(0, 0.45, 0.7, 0.7, 0, 0.9, C.white); for (const u of [-0.34, 0.34]) for (const d of [0.11, 0.79]) g.q(u, d, 0.015, 0.015, 0.9, 1.6, C.plexi); g.q(0, 0.45, 0.7, 0.7, 1.59, 1.6, C.plexi); for (const y of [0.9]) g.q(0, 0.45, 0.7, 0.7, y, y + 0.012, C.plexi); g.s(-0.35, 0.35, 0.9, 1.6, 0.1, 0.8); });
def('tempWall', 4.0, 0.7, (g, w, r) => {                                // a show wall on feet, waiting for its next exhibition
  const e = w / 2, h = Math.min(3.2, g.H - 0.8), c = pick(r, [C.white, C.greyL, 0x4a5a6a, 0x6a3a34, C.cream]);
  g.bs(-e, e, 0.02, h, 0.25, 0.45, c); for (const u of [-e + 0.3, e - 0.3]) g.bs(u - 0.06, u + 0.06, 0, 0.1, 0, 0.7, C.steelD, 'metal');
  if (r() < 0.4) picture(g, 'd', -0.6, 0.6, 1.1, 2.0, 0.45, 0.05, r);
  if (r() < 0.5) for (let i = 0; i < 4; i++) g.b(-e + 0.3 + i * 0.5, -e + 0.6 + i * 0.5, 1.4, 1.46, 0.45, 0.452, C.blue);
});
def('scissorLift', 1.0, 2.0, (g, w, r) => {
  g.bs(-0.45, 0.45, 0.12, 0.5, 0.1, 1.9, C.orange, 'metal'); for (const d of [0.4, 1.6]) for (const u of [-0.45, 0.45]) g.c(u, 0.15, d, 0.15, 0.1, 'u', C.rubber, 'matte', 8);
  g.b(-0.3, 0.3, 0.5, 0.75, 0.3, 1.7, C.steelD, 'metal'); g.b(-0.45, 0.45, 0.75, 0.82, 0.1, 1.9, C.steel, 'metal', true);
  for (const u of [-0.45, 0.45]) for (const d of [0.1, 1.0, 1.9]) g.q(u, d, 0.03, 0.03, 0.82, 1.85, C.orange, 'metal');
  for (const y of [1.35, 1.82]) { for (const u of [-0.45, 0.45]) g.b(u - 0.015, u + 0.015, y, y + 0.03, 0.1, 1.9, C.orange, 'metal', true); for (const d of [0.1, 1.9]) g.b(-0.45, 0.45, y, y + 0.03, d - 0.015, d + 0.015, C.orange, 'metal', true); }
  g.s(-0.47, 0.47, 0.5, 1.85, 0.1, 1.9);
});

// ---- conservation ----
def('easel', 1.2, 1.3, (g, w, r, o = {}) => {
  const c = C.wood, h = 2.0 + r() * 0.3;
  for (const u of [-0.3, 0.3]) { g.bs(u - 0.025, u + 0.025, 0, h, 0.3, 0.36, c); g.bs(u - 0.03, u + 0.03, 0, 0.06, 0.05, 0.75, c); }
  g.b(-0.03, 0.03, 0.3, h + 0.25, 0.3, 0.35, c, 'matte', true); g.b(-0.42, 0.42, 0.72, 0.77, 0.36, 0.48, c, 'matte', true); g.b(-0.3, 0.3, 0.3, 0.34, 0.3, 0.36, c, 'matte', true);
  const pw = o.student ? 0.5 + r() * 0.4 : 0.6 + r() * 0.5, ph = o.student ? 0.6 + r() * 0.4 : 0.7 + r() * 0.7;
  if (r() < 0.92) picture(g, 'd', -pw / 2, pw / 2, 0.77, 0.77 + ph, 0.36, 0.05, r, o.student || r() < 0.5);
  g.s(-0.45, 0.45, 0.7, h, 0.3, 0.48);
  if (o.student) stool(g, 0.1, 1.0); else if (o.lamp) { g.c(0.55, 0.02, 0.9, 0.16, 0.04, 'y', C.steelD, 'metal', 8); g.c(0.55, 0.9, 0.9, 0.015, 1.8, 'y', C.steelD, 'metal', 5); g.b(0.3, 0.56, 1.78, 1.8, 0.89, 0.91, C.steelD, 'metal', true); g.c(0.3, 1.72, 0.9, 0.1, 0.14, 'y', C.steelD, 'metal', 8); g.c(0.3, 1.648, 0.9, 0.085, 0.006, 'y', C.lamp, 'glow', 8); g.s(0.4, 0.7, 0, 1.8, 0.75, 1.05); }
});
def('armlamp', 0.5, 0.5, g => { g.c(0, 0.02, 0.25, 0.18, 0.04, 'y', C.steelD, 'metal', 8); g.c(0, 0.85, 0.25, 0.015, 1.7, 'y', C.steelD, 'metal', 5); g.b(-0.3, 0.01, 1.68, 1.7, 0.24, 0.26, C.steelD, 'metal', true); g.c(-0.3, 1.62, 0.25, 0.1, 0.14, 'y', C.steelD, 'metal', 8); g.c(-0.3, 1.548, 0.25, 0.085, 0.006, 'y', C.lamp, 'glow', 8); g.s(-0.1, 0.1, 0, 1.7, 0.15, 0.35); });
def('stool', 0.4, 0.4, g => stool(g, 0, 0.2));
def('taboret', 0.6, 0.45, (g, w, r) => { g.bs(-0.28, 0.28, 0.1, 0.8, 0.02, 0.43, pick(r, [C.wood, C.greyL, C.white])); castors(g, -0.28, 0.28, 0.02, 0.43); for (let i = 0; i < 5; i++) g.c(-0.2 + r() * 0.4, 0.86, 0.1 + r() * 0.25, 0.03, 0.12, 'y', pick(r, TINS), 'matte', 6); g.q(0, 0.22, 0.3, 0.2, 0.8, 0.81, C.white); });
def('worktable', 2.4, 1.2, (g, w, r, o = {}) => {
  const e = w / 2, h = o.k === 'inking' ? 0.9 : 0.86, top = o.k === 'packing' ? C.fabric : o.k === 'inking' ? C.glass : o.k === 'mounts' || o.k === 'parcels' ? C.woodL : C.white;
  table(g, -e, e, 0.05, 1.15, h, top, C.steel, { shelf: r() < 0.6 });
  const on = (u, d, a, b, hh, c, m) => g.q(u, d, a, b, h, h + hh, c, m || 'matte');
  switch (o.k) {
    case 'painting': case 'conservation': if (r() < 0.8) { const pw = 0.7 + r() * 0.6, pd = 0.5 + r() * 0.4, u = (r() - 0.5) * (w - pw - 0.4); on(u, 0.6, pw, pd, 0.04, C.pine); on(u, 0.6, pw - 0.1, pd - 0.1, 0.045, pick(r, PAINT)); on(u + pw * 0.15, 0.55, pw * 0.3, pd * 0.4, 0.05, pick(r, PAINT)); } for (let i = 0; i < 5; i++) g.c(-e + 0.15 + r() * 0.3, h + 0.06, 0.2 + r() * 0.8, 0.035, 0.12, 'y', pick(r, [C.glass, C.white, C.cream, C.blueL]), 'matte', 6); break;
    case 'sheets': for (let i = 0; i < 3; i++) on(-e + 0.5 + r() * (w - 1), 0.4 + r() * 0.4, 0.5 + r() * 0.4, 0.4 + r() * 0.3, 0.006 + i * 0.004, pick(r, [C.cream, C.white, C.canvas, C.tissue])); on(e - 0.3, 0.3, 0.3, 0.2, 0.1, C.archive); break;
    case 'objects': for (let i = 0; i < 4; i++) { const u = -e + 0.3 + r() * (w - 0.6), d = 0.3 + r() * 0.6, c = pick(r, [C.terracotta, C.bronze, C.celadon, C.plaster]); r() < 0.5 ? g.c(u, h + 0.12, d, 0.08 + r() * 0.05, 0.24, 'y', c, 'matte', 8) : on(u, d, 0.16, 0.16, 0.1 + r() * 0.2, c); } on(0, 0.6, 0.6, 0.4, 0.02, C.foam); break;
    case 'packing': on(-e + 0.5, 0.6, 0.7, 0.6, 0.3 + r() * 0.3, C.card); on(0.2, 0.6, 0.9, 0.7, 0.03, C.foam); on(0.2, 0.6, 0.5, 0.4, 0.12, C.tissue); g.c(e - 0.25, h + 0.06, 0.3, 0.06, 0.05, 'y', C.cardD, 'matte', 8); break;
    case 'parcels': for (let i = 0; i < 4; i++) on(-e + 0.3 + r() * (w - 0.6), 0.3 + r() * 0.6, 0.2 + r() * 0.3, 0.2 + r() * 0.2, 0.08 + r() * 0.2, pick(r, [C.card, C.cardD, C.white])); break;
    case 'wrapped': on(0, 0.6, w * 0.6, 0.6, 0.25 + r() * 0.2, C.tissue); on(0, 0.6, 0.06, 0.62, 0.46, C.blue); break;
    case 'mounts': for (let i = 0; i < 3; i++) { const u = -e + 0.4 + r() * (w - 0.8); on(u, 0.4 + r() * 0.4, 0.3, 0.3, 0.3 + r() * 0.2, C.plexi); } g.q(e - 0.3, 0.9, 0.16, 0.12, h, h + 0.14, C.steelD, 'metal'); break;
    case 'inking': for (let i = 0; i < 3; i++) on(-e + 0.4 + r() * (w - 0.8), 0.3 + r() * 0.6, 0.3, 0.25, 0.004, pick(r, [C.black, C.red, C.blue, C.yellow])); g.c(0, h + 0.05, 0.9, 0.04, 0.3, 'u', C.rubber, 'matte', 8); for (let i = 0; i < 4; i++) g.c(e - 0.2, h + 0.06, 0.2 + i * 0.2, 0.05, 0.12, 'y', pick(r, TINS), 'matte', 6); break;
  }
  if (o.lamp) lampArm(g, e - 0.15, 0.15, h, 0.45);
});
def('fumecupboard', 1.5, 0.85, (g, w, r) => {
  g.bs(-0.75, 0.75, 0, 0.9, 0, 0.85, C.cream, 'metal'); g.b(-0.75, 0.75, 0.9, 2.3, 0, 0.1, C.cream, 'metal'); g.b(-0.75, -0.68, 0.9, 2.3, 0.1, 0.8, C.cream, 'metal', true); g.b(0.68, 0.75, 0.9, 2.3, 0.1, 0.8, C.cream, 'metal', true); g.b(-0.75, 0.75, 2.0, 2.3, 0.1, 0.85, C.cream, 'metal', true);
  g.b(-0.68, 0.68, 1.5, 2.0, 0.78, 0.79, C.glass); for (let i = 0; i < 3; i++) g.c(-0.4 + i * 0.35, 1.02, 0.4 + r() * 0.2, 0.05, 0.22, 'y', pick(r, [C.glass, C.copper, C.white]), 'matte', 6);
  g.c(0, (2.3 + g.H) / 2, 0.4, 0.16, g.H - 2.3, 'y', C.galv, 'metal', 8); g.b(0.3, 0.6, 0.6, 0.66, 0.85, 0.855, C.led, 'glow'); g.s(-0.75, 0.75, 0.9, 2.3, 0, 0.85);
});
def('microscopeBench', 1.5, 1.3, (g, w, r) => {
  table(g, -0.75, 0.75, 0.02, 0.72, 0.76, C.white, C.steel); g.q(0, 0.4, 0.3, 0.32, 0.76, 0.79, C.steelD); g.c(-0.1, 1.0, 0.25, 0.025, 0.46, 'y', C.steelL, 'metal', 6);
  g.b(-0.12, 0.08, 1.12, 1.22, 0.2, 0.5, C.cream, 'metal', true); g.c(0.0, 0.98, 0.45, 0.05, 0.22, 'y', C.cream, 'metal', 8); for (const u of [-0.04, 0.04]) g.c(u, 1.27, 0.5, 0.018, 0.1, 'y', C.black, 'matte', 6);
  g.c(0, 0.795, 0.45, 0.07, 0.006, 'y', C.lamp, 'glow', 8); g.q(0.5, 0.3, 0.28, 0.3, 0.76, 0.9, C.archive); stool(g, 0, 1.0, 0.55); g.s(-0.75, 0.75, 0.72, 1.3, 0.02, 0.72);
});
def('sink', 1.3, 0.65, (g, w, r) => {
  const e = w / 2; g.bs(-e, e, 0, 0.82, 0.02, 0.65, C.steelL, 'metal'); g.b(-e, e, 0.82, 0.9, 0, 0.08, C.steelL, 'metal', true); g.b(-e, e, 0.82, 0.9, 0.57, 0.65, C.steelL, 'metal', true); g.b(-e, -e + 0.08, 0.82, 0.9, 0.08, 0.57, C.steelL, 'metal', true); g.b(e - 0.08, e, 0.82, 0.9, 0.08, 0.57, C.steelL, 'metal', true);
  g.b(-e + 0.08, e - 0.08, 0.82, 0.83, 0.08, 0.57, C.steelD, 'metal', true); g.c(0, 1.02, 0.06, 0.018, 0.26, 'y', C.steelL, 'metal', 6); g.b(-0.015, 0.015, 1.13, 1.15, 0.06, 0.26, C.steelL, 'metal', true); g.b(-e, e, 0.9, 1.4, 0, 0.012, C.enamel);
});
def('washTank', 1.8, 1.0, (g, w, r) => { table(g, -0.9, 0.9, 0.02, 0.98, 0.8, C.steelL, C.steel, { metal: true }); for (const d of [0.02, 0.92]) g.b(-0.9, 0.9, 0.8, 0.98, d, d + 0.06, C.white, 'matte', true); for (const u of [-0.9, 0.84]) g.b(u, u + 0.06, 0.8, 0.98, 0.08, 0.92, C.white, 'matte', true); g.b(-0.84, 0.84, 0.9, 0.905, 0.08, 0.92, C.blueL); g.c(0.7, 1.1, 0.1, 0.018, 0.28, 'y', C.steelL, 'metal', 6); g.s(-0.9, 0.9, 0.76, 1.0, 0.02, 0.98); });
def('dryingRack', 1.0, 0.8, (g, w, r) => { for (const u of [-0.48, 0.48]) for (const d of [0.03, 0.77]) g.q(u, d, 0.03, 0.03, 0.08, 1.9, C.steel, 'metal'); for (let y = 0.2; y < 1.9; y += 0.17) { g.b(-0.48, 0.48, y, y + 0.008, 0.03, 0.77, C.galv, 'metal', true); if (r() < 0.3) g.b(-0.4, 0.3, y + 0.008, y + 0.014, 0.1, 0.7, pick(r, [C.cream, C.white, ...PAINT.slice(0, 3)]), 'matte', true); } castors(g, -0.48, 0.48, 0.03, 0.77, 0.08); g.s(-0.5, 0.5, 0, 1.9, 0.02, 0.78); });
def('lightTable', 1.5, 1.0, (g, w, r) => { table(g, -0.75, 0.75, 0.02, 0.98, 0.9, C.steelD, C.steel); g.b(-0.7, 0.7, 0.9, 0.906, 0.07, 0.93, 0xb8c8d0, 'glow', true); g.q(0.1, 0.5, 0.5, 0.4, 0.906, 0.91, C.canvas); });
def('lightbox', 1.2, 0.12, (g, w, r) => { g.b(-0.6, 0.6, 1.2, 1.9, 0, 0.1, C.steelD); g.b(-0.56, 0.56, 1.24, 1.86, 0.1, 0.104, 0x9aa8b0, 'glow'); for (const u of [-0.5, 0.05]) if (r() < 0.8) g.b(u, u + 0.43, 1.3, 1.8, 0.104, 0.107, 0x1a1e24, 'matte'); });
def('press', 0.8, 0.7, (g, w, r) => { g.bs(-0.38, 0.38, 0, 0.7, 0.03, 0.67, C.woodD); g.b(-0.3, 0.3, 0.7, 0.76, 0.1, 0.6, C.steelD, 'metal', true); for (const u of [-0.26, 0.26]) g.c(u, 1.0, 0.35, 0.025, 0.5, 'y', C.steelD, 'metal', 6); g.b(-0.3, 0.3, 1.2, 1.28, 0.25, 0.45, C.steelD, 'metal', true); g.b(-0.28, 0.28, 0.82, 0.88, 0.12, 0.58, C.steelD, 'metal', true); g.c(0, 1.2, 0.35, 0.03, 0.6, 'y', C.steel, 'metal', 6); g.c(0, 1.5, 0.35, 0.18, 0.03, 'y', C.steelD, 'metal', 10); g.s(-0.38, 0.38, 0.7, 1.5, 0.1, 0.6); });
def('boardRack', 1.4, 0.9, (g, w, r) => { g.b(-0.7, 0.7, 0, 0.08, 0, 0.9, C.woodL, 'matte', true); for (let u = -0.7; u <= 0.71; u += 0.35) g.b(u - 0.012, u + 0.012, 0.08, 1.5, 0, 0.9, C.woodL, 'matte', true); for (let u = -0.66; u < 0.66; u += 0.045) if (r() < 0.6) g.b(u, u + 0.012 + r() * 0.02, 0.08, 0.9 + r() * 0.8, 0.04, 0.5 + r() * 0.36, pick(r, [C.cream, C.white, C.card, C.black, C.foam, C.ply]), 'matte', true); g.s(-0.7, 0.7, 0, 1.6, 0, 0.9); });
def('frameRack', 1.6, 0.6, (g, w, r) => { g.b(-0.8, 0.8, 0, 0.1, 0, 0.6, C.woodL, 'matte', true); let d = 0.06; for (let i = 0; i < 7 && d < 0.5; i++) { const fw = 0.7 + r() * 0.8, fh = 0.7 + r() * 0.9, u = (r() - 0.5) * (1.5 - fw), c = pick(r, [C.gilt, C.gilt, C.woodD, C.black, C.gilt]), t = 0.07; g.b(u - fw / 2, u + fw / 2, 0.1, 0.1 + t, d, d + 0.04, c, 'matte', true); g.b(u - fw / 2, u + fw / 2, 0.1 + fh - t, 0.1 + fh, d, d + 0.04, c, 'matte', true); g.b(u - fw / 2, u - fw / 2 + t, 0.1, 0.1 + fh, d, d + 0.04, c, 'matte', true); g.b(u + fw / 2 - t, u + fw / 2, 0.1, 0.1 + fh, d, d + 0.04, c, 'matte', true); d += 0.065; } g.s(-0.8, 0.8, 0, 1.6, 0, 0.56); });
def('canvasRack', 1.8, 0.8, (g, w, r) => { g.b(-0.9, 0.9, 0, 0.06, 0, 0.8, C.pine, 'matte', true); for (let u = -0.9; u <= 0.91; u += 0.45) { g.b(u - 0.02, u + 0.02, 0.06, 1.9, 0, 0.04, C.pine); g.b(u - 0.02, u + 0.02, 0.06, 1.9, 0.76, 0.8, C.pine, 'matte', true); } g.b(-0.9, 0.9, 1.0, 1.04, 0, 0.8, C.pine, 'matte', true); for (const y of [0.06, 1.04]) for (let u = -0.86; u < 0.84; u += 0.06) if (r() < 0.55) g.b(u, u + 0.03, y, y + 0.4 + r() * 0.45, 0.05, 0.35 + r() * 0.4, r() < 0.6 ? C.canvas : pick(r, PAINT), 'matte', true); g.s(-0.9, 0.9, 0, 1.9, 0, 0.8); });
def('labBench', 1.8, 0.75, (g, w, r) => {
  g.bs(-0.9, 0.9, 0, 0.86, 0, 0.72, C.white); g.b(-0.92, 0.92, 0.86, 0.9, 0, 0.75, C.steelD, 'matte', true); for (const u of [-0.45, 0, 0.45]) g.b(u - 0.004, u + 0.004, 0.08, 0.84, 0.72, 0.723, C.grey); g.b(-0.9, 0.9, 1.45, 1.48, 0, 0.3, C.white, 'matte', true); fill(g, -0.88, 0.88, 1.48, 0, 0.3, 0.3, r, 'tins');
  const u = -0.5 + r() * 0.3; g.q(u, 0.35, 0.45, 0.4, 0.9, 1.25, C.cream, 'metal'); g.b(u - 0.16, u + 0.1, 1.08, 1.2, 0.55, 0.553, C.off, 'metal'); g.q(0.5, 0.35, 0.3, 0.3, 0.9, 1.05, C.greyL); g.b(0.4, 0.44, 0.95, 0.97, 0.5, 0.503, C.led, 'glow'); g.s(-0.9, 0.9, 0.86, 1.8, 0, 0.75);
});
def('gasBottles', 0.9, 0.4, (g, w, r) => { for (const u of [-0.28, 0, 0.28]) { const c = pick(r, [C.blue, C.steelD, C.green, C.red, C.white]); g.c(u, 0.7, 0.2, 0.11, 1.4, 'y', c, 'metal', 8); g.c(u, 1.46, 0.2, 0.04, 0.12, 'y', C.gilt, 'metal', 6); } g.b(-0.42, 0.42, 0.9, 0.93, 0.05, 0.07, C.steelL, 'metal', true); g.s(-0.4, 0.4, 0, 1.5, 0.08, 0.32); });
def('xrayTable', 2.6, 3.0, (g, w, r) => {
  g.bs(-0.3, 0.3, 0, 0.7, 0.9, 2.1, C.steelD, 'metal'); g.b(-1.2, 1.2, 0.7, 0.78, 0.8, 2.2, C.grey, 'metal', true); g.q(0, 1.5, 1.2, 0.9, 0.78, 0.8, C.black); if (r() < 0.8) picture(g, 'u', 1.1, 1.9, 0.82, 0.83, 0, 0, r);
  g.bs(-1.25, -1.05, 0, 2.5, 1.4, 1.6, C.cream, 'metal'); g.b(-1.25, 0.1, 2.3, 2.5, 1.42, 1.58, C.cream, 'metal', true); g.c(0, 2.0, 1.5, 0.16, 0.5, 'u', C.cream, 'metal', 10); g.q(0, 1.5, 0.3, 0.3, 1.6, 1.84, C.steelD, 'metal'); g.c(0, 2.36, 1.5, 0.05, 0.3, 'y', C.cream, 'metal', 6);
  g.b(-0.1, 0.1, 2.52, 2.6, 1.42, 1.58, C.ledR, 'glow', true); g.s(-1.2, 1.2, 0.66, 0.84, 0.8, 2.2); g.s(-0.4, 0.4, 1.6, 2.5, 1.2, 1.8);
});
def('leadScreen', 1.6, 1.3, (g, w, r) => { g.bs(-0.8, 0.8, 0.02, 2.0, 0.9, 0.98, C.grey, 'metal'); g.b(-0.3, 0.3, 1.25, 1.65, 0.895, 0.985, C.glass); for (const u of [-0.75, 0.75]) g.bs(u - 0.03, u + 0.03, 0, 0.04, 0.6, 1.3, C.steelD); table(g, -0.6, 0.6, 0.05, 0.6, 0.74, C.grey, C.steelD); g.q(0, 0.3, 0.6, 0.35, 0.74, 0.9, C.cream, 'metal'); g.b(-0.2, 0.0, 0.9, 0.903, 0.2, 0.4, C.ledA, 'glow'); g.b(-0.2, 0.2, 2.02, 2.1, 0.92, 0.96, C.yellow); });
def('sprayBooth', 3.2, 2.2, (g, w, r) => {
  const e = w / 2, h = Math.min(2.7, g.H - 0.6); g.bs(-e, e, 0, h, 0, 0.3, C.galv, 'metal'); g.bs(-e, -e + 0.05, 0, h, 0.3, 2.2, C.galv, 'metal'); g.bs(e - 0.05, e, 0, h, 0.3, 2.2, C.galv, 'metal'); g.b(-e, e, h - 0.05, h, 0.3, 2.2, C.galv, 'metal', true);
  for (let u = -e + 0.15; u < e - 0.5; u += 0.62) for (let y = 0.3; y < h - 0.6; y += 0.62) g.b(u, u + 0.56, y, y + 0.56, 0.3, 0.32, C.cream);
  g.c(0, (h + g.H) / 2, 0.6, 0.25, g.H - h, 'y', C.galv, 'metal', 10); g.b(-e + 0.3, e - 0.3, h - 0.12, h - 0.06, 1.2, 1.3, C.tube, 'glow', true); g.s(-e, e, h - 0.1, h, 0.3, 2.2);
});

// ---- workshops ----
def('workbench', 2.0, 0.75, (g, w, r, o = {}) => {
  const e = w / 2; g.b(-e, e, 0.82, 0.9, 0, 0.75, C.wood, 'matte', true); for (const u of [-e + 0.08, e - 0.08]) for (const d of [0.08, 0.67]) g.qs(u, d, 0.09, 0.09, 0, 0.82, C.pine); g.b(-e + 0.08, e - 0.08, 0.2, 0.24, 0.08, 0.67, C.pine, 'matte', true);
  g.q(e - 0.25, 0.72, 0.2, 0.14, 0.76, 0.96, C.blue, 'metal'); fill(g, -e + 0.1, e - 0.5, 0.24, 0.1, 0.65, 0.4, r, 'boxes');
  if (!o.island) { g.b(-e, e, 1.1, 2.0, 0, 0.02, C.ply); for (let i = 0; i < 9; i++) { const u = -e + 0.1 + r() * (w - 0.3), y = 1.2 + r() * 0.6; g.b(u, u + 0.03 + r() * 0.12, y, y + 0.1 + r() * 0.25, 0.02, 0.04, pick(r, [C.steelL, C.red, C.woodD, C.yellow, C.black, C.blue]), 'metal'); } }
  for (let i = 0; i < 3; i++) g.q(-e + 0.3 + r() * (w - 0.8), 0.25 + r() * 0.3, 0.1 + r() * 0.3, 0.08 + r() * 0.1, 0.9, 0.94 + r() * 0.1, pick(r, [C.pine, C.steelD, C.yellow, C.red]));
  g.s(-e, e, 0.8, o.island ? 1.0 : 2.0, 0, o.island ? 0.75 : 0.1); g.s(-e, e, 0.8, 1.0, 0, 0.75);
});
def('tableSaw', 2.6, 2.0, (g, w, r) => {
  g.bs(-0.4, 0.4, 0, 0.86, 0.6, 1.4, C.green, 'metal'); g.b(-1.0, 1.0, 0.86, 0.9, 0.4, 1.6, C.steelL, 'metal', true); g.b(-0.005, 0.005, 0.9, 1.0, 0.75, 1.1, C.steel, 'metal', true); g.b(-0.03, 0.03, 1.0, 1.06, 0.7, 1.15, C.yellow, 'matte', true);
  g.b(0.45, 0.5, 0.9, 0.97, 0.4, 1.6, C.steelL, 'metal', true); g.b(-1.3, -1.0, 0.86, 0.9, 0.4, 1.6, C.ply, 'matte', true); g.b(0.25, 0.4, 0.5, 0.56, 0.595, 0.6, C.ledR, 'glow'); for (const u of [-1.25, 0.95]) g.bs(u - 0.02, u + 0.02, 0, 0.86, 1.5, 1.54, C.steelD); g.s(-1.3, 1.0, 0.84, 1.06, 0.4, 1.6);
  if (r() < 0.7) g.b(-0.9, -0.1, 0.9, 0.918, 0.5, 1.5, C.ply, 'matte', true);
});
def('bandsaw', 0.9, 0.8, (g, w, r) => { g.bs(-0.3, 0.3, 0, 0.9, 0.1, 0.7, C.green, 'metal'); g.b(-0.4, 0.4, 0.9, 0.94, 0.1, 0.75, C.steelL, 'metal', true); g.b(-0.3, -0.12, 0.94, 1.9, 0.15, 0.3, C.green, 'metal', true); g.b(-0.3, 0.3, 1.5, 1.95, 0.12, 0.34, C.green, 'metal', true); g.b(0.14, 0.15, 0.94, 1.5, 0.22, 0.24, C.steelL, 'metal'); g.s(-0.4, 0.4, 0.9, 1.95, 0.1, 0.75); });
def('pillarDrill', 0.6, 0.7, g => { g.bs(-0.22, 0.22, 0, 0.06, 0.1, 0.6, C.steelD, 'metal'); g.c(0, 0.85, 0.2, 0.04, 1.6, 'y', C.steelL, 'metal', 8); g.b(-0.18, 0.18, 0.95, 0.99, 0.25, 0.6, C.steelD, 'metal', true); g.b(-0.14, 0.14, 1.45, 1.75, 0.1, 0.6, C.blue, 'metal', true); g.c(0, 1.32, 0.45, 0.025, 0.26, 'y', C.steelL, 'metal', 6); g.s(-0.2, 0.2, 0, 1.75, 0.1, 0.6); });
def('timberRack', 3.0, 0.8, (g, w, r) => {
  const e = w / 2; for (const u of [-e + 0.3, 0, e - 0.3]) { g.bs(u - 0.04, u + 0.04, 0, 2.4, 0, 0.08, C.steelD, 'metal'); for (let y = 0.4; y < 2.3; y += 0.45) g.b(u - 0.03, u + 0.03, y - 0.04, y, 0.08, 0.75, C.steelD, 'metal', true); }
  for (let y = 0.4; y < 2.3; y += 0.45) { let d = 0.1, n = 0; while (d < 0.65 && n++ < 6) { const t = 0.04 + r() * 0.1, hh = 0.03 + r() * 0.1, L = w * (0.6 + r() * 0.38); if (r() < 0.85) g.b(-e + r() * (w - L), -e + r() * (w - L) * 0 + L, y, y + hh, d, d + t, pick(r, [C.pine, C.pine, C.woodL, C.wood, C.ply]), 'matte', true); d += t + 0.02; } }
  g.s(-e, e, 0.3, 2.4, 0, 0.75);
});
def('sheetRack', 2.0, 0.7, (g, w, r, o = {}) => {                       // sheets on edge: plywood and board, or acrylic
  const e = w / 2; g.b(-e, e, 0, 0.1, 0, 0.7, C.steelD, 'metal', true); for (const u of [-e, e - 0.05]) { g.b(u, u + 0.05, 0.1, 1.5, 0, 0.05, C.steelD, 'metal', true); g.b(u, u + 0.05, 0.1, 0.9, 0.65, 0.7, C.steelD, 'metal', true); }
  let d = 0.07; while (d < 0.6) { const t = o.plexi ? 0.01 + r() * 0.02 : 0.012 + r() * 0.03; g.b(-e + 0.06 + r() * 0.2, e - 0.06 - r() * 0.3, 0.1, 1.0 + r() * 0.5, d, d + t, o.plexi ? pick(r, [C.plexi, C.plexi, C.glass, C.white, C.black]) : pick(r, [C.ply, C.ply, C.pine, C.white, C.card, C.woodD]), 'matte', true); d += t + 0.012 + r() * 0.03; }
  g.s(-e, e, 0, 1.5, 0, 0.7);
});
def('dustExtractor', 0.9, 0.8, g => { g.bs(-0.4, 0.4, 0, 0.12, 0.05, 0.75, C.steelD, 'metal'); g.c(-0.12, 0.7, 0.4, 0.26, 0.5, 'y', C.blue, 'metal', 10); g.c(-0.12, 0.33, 0.4, 0.22, 0.4, 'y', C.foam, 'matte', 8); g.c(-0.12, 1.35, 0.4, 0.22, 0.8, 'y', C.canvas, 'matte', 8); g.c(0.28, 0.4, 0.4, 0.13, 0.3, 'u', C.steelD, 'metal', 8); g.c(0.1, (1.0 + g.H) / 2 + 0.4, 0.14, 0.07, g.H - 1.8, 'y', C.galv, 'metal', 6); g.s(-0.4, 0.4, 0, 1.75, 0.1, 0.7); });
def('sawhorses', 1.8, 1.0, (g, w, r) => { for (const u of [-0.6, 0.6]) { g.b(u - 0.04, u + 0.04, 0.68, 0.76, 0.1, 0.9, C.pine, 'matte', true); for (const d of [0.14, 0.86]) g.bs(u - 0.03, u + 0.03, 0, 0.68, d - 0.03, d + 0.03, C.pine); } const k = r(); if (k < 0.5) g.b(-0.85, 0.85, 0.76, 0.78 + r() * 0.04, 0.15, 0.85, pick(r, [C.ply, C.white, C.pine]), 'matte', true); else if (k < 0.8) { g.b(-0.3, 0.3, 0.76, 1.26, 0.2, 0.8, C.white, 'matte', true); } g.s(-0.85, 0.85, 0.66, 0.84, 0.1, 0.9); });
def('bucket', 0.4, 0.4, (g, w, r) => { g.c(0, 0.15, 0.2, 0.14, 0.3, 'y', pick(r, [C.white, C.steelL, C.yellow, C.blue]), 'matte', 8); g.s(-0.13, 0.13, 0, 0.3, 0.07, 0.33); });
def('lampStand', 0.7, 0.7, (g, w, r) => { g.c(0, 0.02, 0.35, 0.3, 0.04, 'y', C.black, 'metal', 8); const h = 1.8 + r() * 0.5; g.c(0, h / 2, 0.35, 0.02, h, 'y', C.black, 'metal', 6); g.c(0, h, 0.35, 0.13, 0.3, 'd', C.black, 'metal', 8); g.b(-0.2, 0.2, h - 0.2, h - 0.17, 0.33, 0.37, C.black, 'metal', true); g.s(-0.15, 0.15, 0, h + 0.14, 0.2, 0.5); });
def('cableDrums', 0.9, 0.7, (g, w, r) => { for (const u of [-0.22, 0.24]) { const rr = 0.2 + r() * 0.1; g.c(u, rr, 0.35, rr, 0.03, 'u', C.ply, 'matte', 10); g.c(u + 0.2, rr, 0.35, rr, 0.03, 'u', C.ply, 'matte', 10); g.c(u + 0.1, rr, 0.35, rr * 0.7, 0.17, 'u', pick(r, [C.black, C.orange, C.blue]), 'matte', 10); } g.s(-0.25, 0.47, 0, 0.6, 0.05, 0.65); });

// ---- the loading dock ----
def('truck', 3.0, 3.4, (g, w, r) => {                                   // the back of a box van, reversed up to the wall
  const h = Math.min(3.3, g.H - 0.35); g.b(-1.5, 1.5, 0, h + 0.2, 0, 0.12, C.steelD, 'metal'); for (const u of [-1.5, 1.38]) g.b(u, u + 0.12, 0, h + 0.2, 0.12, 0.3, C.yellow, 'matte', true);
  g.b(-1.25, 1.25, 1.0, h, 0.12, 3.2, C.enamel, 'metal', true); g.b(-1.15, 1.15, 1.1, h - 0.1, 3.2, 3.21, 0x0c0d10); g.b(-1.25, 1.25, 0.85, 1.0, 0.12, 3.25, C.steelD, 'metal', true);
  for (const u of [-1.2, 1.12]) g.b(u, u + 0.08, 1.0, h, 3.2, 3.26, C.steelL, 'metal', true); g.b(-1.25, 1.25, h - 0.08, h, 3.2, 3.26, C.steelL, 'metal', true);
  for (const u of [-1.05, 1.05]) for (const d of [1.2, 2.3]) g.c(u, 0.45, d, 0.45, 0.28, 'u', C.rubber, 'matte', 12);
  g.b(-1.2, 1.2, 0.45, 0.6, 3.2, 3.32, C.steelD, 'metal', true); for (const u of [-1.1, 0.9]) { g.b(u, u + 0.2, 0.68, 0.8, 3.25, 3.26, C.ledR, 'glow'); } g.b(-0.3, 0.3, 0.66, 0.8, 3.25, 3.255, C.white);
  for (let i = 0; i < 3; i++) if (r() < 0.8) { const u = -0.9 + i * 0.7; crateBox(g, u, u + 0.55, 1.0, 1.5 + r() * 1.0, 2.2, 3.0, r); }
  g.b(-1.3, 1.3, 0, 0.03, 3.4 - 0.9, 3.4, C.steelD, 'metal', true); for (let u = -1.3; u < 1.3; u += 0.4) g.b(u, u + 0.2, 0.03, 0.033, 3.3, 3.4, C.yellow);
  g.s(-1.3, 1.3, 0, h, 0.1, 3.3);
});
def('dockDoor', 3.2, 0.3, (g, w) => { const h = Math.min(3.3, g.H - 0.35); g.b(-1.5, 1.5, 0, h, 0, 0.06, C.steel, 'metal'); for (let y = 0.15; y < h; y += 0.15) g.b(-1.5, 1.5, y, y + 0.02, 0.06, 0.068, C.steelD, 'metal'); for (const u of [-1.6, 1.5]) g.b(u, u + 0.1, 0, h + 0.2, 0, 0.14, C.yellow, 'matte', true); g.b(-1.6, 1.6, h, h + 0.3, 0, 0.3, C.steelD, 'metal', true); for (const u of [-1.0, 0.9]) g.b(u, u + 0.12, 0.3, 0.7, 0.06, 0.2, C.rubber, 'matte', true); });
def('bollard', 0.3, 0.3, g => { g.c(0, 0.5, 0.15, 0.08, 1.0, 'y', C.yellow, 'matte', 8); g.c(0, 0.8, 0.15, 0.082, 0.1, 'y', C.black, 'matte', 8); g.s(-0.08, 0.08, 0, 1, 0.07, 0.23); });
def('forklift', 1.2, 2.6, (g, w, r) => {
  g.bs(-0.5, 0.5, 0.15, 0.9, 0.9, 2.5, C.yellow, 'metal'); g.bs(-0.5, 0.5, 0.9, 1.2, 1.9, 2.5, C.steelD, 'metal'); for (const u of [-0.5, 0.5]) for (const d of [1.15, 2.2]) g.c(u, 0.25, d, 0.25, 0.16, 'u', C.rubber, 'matte', 10);
  for (const u of [-0.45, 0.45]) for (const d of [0.95, 1.85]) g.q(u, d, 0.05, 0.05, 0.9, 2.1, C.steelD, 'metal'); g.b(-0.5, 0.5, 2.1, 2.15, 0.9, 1.9, C.steelD, 'metal', true); g.q(0, 1.6, 0.45, 0.4, 0.9, 1.0, C.black); g.q(0, 1.8, 0.45, 0.08, 1.0, 1.4, C.black); g.c(0, 1.25, 1.15, 0.015, 0.35, 'y', C.black, 'matte', 5);
  for (const u of [-0.3, 0.3]) { g.bs(u - 0.05, u + 0.05, 0.05, 2.3, 0.75, 0.88, C.steelD, 'metal'); g.bs(u - 0.06, u + 0.06, 0.04, 0.09, 0, 0.75, C.steelD, 'metal', true); } g.b(-0.4, 0.4, 0.1, 0.7, 0.7, 0.76, C.steelD, 'metal', true);
  g.c(0.35, 2.22, 1.7, 0.06, 0.12, 'y', C.ledA, 'glow', 8); g.s(-0.5, 0.5, 0.9, 2.15, 0.9, 1.9);
});
def('wrapRack', 1.8, 0.6, (g, w, r) => { for (const u of [-0.85, 0.85]) g.bs(u - 0.03, u + 0.03, 0, 1.9, 0.05, 0.55, C.steel, 'metal'); for (const [y, rr, c] of [[0.45, 0.28, C.foam], [1.05, 0.22, C.card], [1.55, 0.16, C.tissue]]) { g.c(0, y, 0.3, rr, 1.6, 'u', c, 'matte', 10); g.c(0, y, 0.3, 0.03, 1.7, 'u', C.steelD, 'metal', 5); } g.s(-0.85, 0.85, 0, 1.9, 0.05, 0.55); });
def('foamStack', 1.3, 1.0, (g, w, r) => { let y = 0; for (let i = 0; i < 9; i++) { const h = 0.03 + r() * 0.1; g.q((r() - 0.5) * 0.06, 0.5 + (r() - 0.5) * 0.06, 1.2, 0.9, y, y + h, pick(r, [C.foam, C.white, C.foam, C.blueL, C.rubber]), 'matte', true); y += h; } g.s(-0.6, 0.6, 0, y, 0.05, 0.95); });
def('scales', 1.0, 1.0, g => { g.bs(-0.45, 0.45, 0, 0.1, 0.1, 1.0, C.steelL, 'metal'); g.bs(-0.04, 0.04, 0.1, 1.2, 0.02, 0.1, C.steelD, 'metal'); g.b(-0.15, 0.15, 1.2, 1.4, 0.02, 0.1, C.steelD, 'metal', true); g.b(-0.1, 0.1, 1.25, 1.34, 0.1, 0.103, C.led, 'glow'); });
def('dumpster', 1.9, 1.2, (g, w, r) => { const c = pick(r, [C.green, C.blue, C.grey]); g.bs(-0.9, 0.9, 0.15, 1.2, 0.05, 1.15, c, 'metal'); g.b(-0.93, 0.93, 1.2, 1.26, 0.02, 1.18, C.black, 'matte', true); castors(g, -0.9, 0.9, 0.05, 1.15, 0.15); for (const u of [-0.95, 0.9]) g.b(u, u + 0.05, 0.8, 0.86, 0.3, 0.9, C.steelD, 'metal', true); });
def('wheelieBins', 1.9, 0.75, (g, w, r) => { for (const u of [-0.63, 0, 0.63]) { const c = pick(r, [C.green, C.blue, C.grey, C.yellow, C.red]); g.bs(u - 0.27, u + 0.27, 0.05, 1.0, 0.05, 0.68, c); g.b(u - 0.29, u + 0.29, 1.0, 1.06, 0.03, 0.72, c, 'matte', true); g.c(u, 0.1, 0.12, 0.1, 0.5, 'u', C.rubber, 'matte', 8); } });
def('baler', 1.4, 1.1, g => { g.bs(-0.6, 0.6, 0, 2.2, 0.05, 1.0, C.blue, 'metal'); g.b(-0.5, 0.5, 0.3, 1.2, 1.0, 1.02, C.steelD, 'metal'); g.b(-0.5, 0.5, 1.3, 1.7, 1.0, 1.02, C.yellow); g.b(0.3, 0.45, 1.85, 2.0, 1.0, 1.01, C.led, 'glow'); });
def('bales', 1.3, 0.9, (g, w, r) => { let y = 0; for (let i = 0; i < 1 + Math.floor(r() * 3); i++) { g.q(0, 0.45, 1.1, 0.75, y, y + 0.7, i % 2 ? C.cardD : C.card); for (const u of [-0.3, 0.3]) g.q(u, 0.45, 0.02, 0.77, y, y + 0.71, C.steelD); y += 0.72; } g.s(-0.56, 0.56, 0, y, 0.07, 0.83); });

// ---- plant ----
def('tank', 1.6, 1.6, (g, w, r) => {
  const rr = 0.55 + r() * 0.15, h = Math.min(g.H - 1.2, 1.9 + r() * 0.8), c = pick(r, [C.lagging, C.steelL, C.blue, C.green, C.lagging]);
  for (const a of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.q(a[0] * rr * 0.6, 0.8 + a[1] * rr * 0.6, 0.07, 0.07, 0, 0.3, C.steelD, 'metal');
  g.c(0, 0.3 + h / 2, 0.8, rr, h, 'y', c, 'metal', 14); g.c(0, 0.3 + h + 0.05, 0.8, rr * 0.7, 0.1, 'y', c, 'metal', 12);
  for (const y of [0.7, 0.3 + h - 0.3]) g.c(0, y, 0.8, rr + 0.012, 0.05, 'y', C.steelD, 'metal', 14);
  g.c(0.15, (0.4 + h + g.H) / 2, 0.8, 0.07, g.H - 0.4 - h, 'y', C.copper, 'metal', 6); g.c(-rr * 0.5, 0.5, 0.8 + rr + 0.06, 0.05, 0.3, 'd', C.steelD, 'metal', 6); g.c(-rr * 0.5, 0.5, 0.8 + rr + 0.2, 0.09, 0.03, 'd', C.red, 'matte', 8);
  g.q(rr * 0.5, 0.8 + rr, 0.12, 0.03, 1.2, 1.32, C.white); g.s(-rr, rr, 0, 0.4 + h, 0.8 - rr, 0.8 + rr);
});
def('boiler', 2.0, 3.0, (g, w, r) => {
  g.bs(-0.8, 0.8, 0, 0.15, 0.2, 2.8, C.steelD, 'metal'); g.c(0, 1.05, 1.5, 0.85, 2.3, 'd', C.blue, 'metal', 14); for (const d of [0.34, 2.66]) g.c(0, 1.05, d, 0.88, 0.06, 'd', C.steelD, 'metal', 14);
  g.q(0, 2.83, 0.5, 0.3, 0.6, 1.2, C.red, 'metal'); g.c(0, 0.9, 2.95, 0.12, 0.1, 'd', C.steelD, 'metal', 8); g.q(0.5, 2.7, 0.25, 0.04, 1.3, 1.6, C.cream, 'metal'); g.b(0.42, 0.58, 1.42, 1.52, 2.72, 2.724, C.ledA, 'glow');
  g.c(0, (1.9 + g.H) / 2, 0.6, 0.22, g.H - 1.9, 'y', C.galv, 'metal', 10); g.c(-0.5, (1.7 + g.H) / 2, 2.0, 0.07, g.H - 1.7, 'y', C.red, 'metal', 6); g.c(0.5, (1.7 + g.H) / 2, 2.0, 0.07, g.H - 1.7, 'y', C.lagging, 'metal', 6);
  g.c(0.3, 1.95, 1.4, 0.08, 0.1, 'y', C.white, 'matte', 8); g.s(-0.85, 0.85, 0, 1.9, 0.2, 2.9);
});
def('chiller', 3.6, 1.8, (g, w, r) => {
  g.bs(-1.7, 1.7, 0, 0.14, 0.1, 1.7, C.steelD, 'metal'); g.c(0, 0.6, 0.55, 0.42, 3.2, 'u', C.blueL, 'metal', 12); g.c(0, 0.6, 1.3, 0.38, 3.2, 'u', C.lagging, 'metal', 12);
  for (const u of [-1.63, 1.63]) { g.c(u, 0.6, 0.55, 0.45, 0.06, 'u', C.steelD, 'metal', 12); g.c(u, 0.6, 1.3, 0.41, 0.06, 'u', C.steelD, 'metal', 12); }
  g.c(-0.5, 1.45, 0.9, 0.38, 1.2, 'u', C.blue, 'metal', 12); g.q(0.6, 0.9, 0.5, 0.5, 1.05, 1.6, C.steelD, 'metal'); g.q(1.35, 1.72, 0.5, 0.08, 0.7, 1.6, C.cream, 'metal'); g.b(1.2, 1.5, 1.25, 1.45, 1.76, 1.764, C.off, 'metal'); for (const u of [1.2, 1.3, 1.4]) g.b(u, u + 0.04, 1.1, 1.14, 1.76, 1.764, pick(r, [C.led, C.led, C.ledA]), 'glow');
  for (const u of [-1.2, 1.0]) g.c(u, (1.0 + g.H) / 2, 0.55, 0.1, g.H - 1.0, 'y', C.blueL, 'metal', 8); g.s(-1.7, 1.7, 0, 1.85, 0.1, 1.7);
});
def('pumpSet', 1.4, 0.8, (g, w, r) => {
  g.bs(-0.65, 0.65, 0, 0.16, 0.05, 0.75, C.grey); const c = pick(r, [C.blue, C.green, C.red, C.orange]); g.c(-0.2, 0.42, 0.4, 0.2, 0.55, 'u', c, 'metal', 10); g.c(-0.5, 0.42, 0.4, 0.21, 0.06, 'u', C.steelD, 'metal', 10); g.c(0.3, 0.42, 0.4, 0.24, 0.22, 'u', C.steelD, 'metal', 10); g.c(0.12, 0.42, 0.4, 0.06, 0.16, 'u', C.steelL, 'metal', 6);
  g.c(0.3, (0.6 + g.H) / 2, 0.4, 0.07, g.H - 0.6, 'y', C.lagging, 'metal', 6); g.c(0.52, 0.42, 0.4, 0.07, 0.3, 'u', C.lagging, 'metal', 6); g.c(0.3, 1.3, 0.4, 0.12, 0.05, 'y', C.red, 'matte', 8); g.q(0.3, 0.46, 0.1, 0.02, 1.6, 1.7, C.white); g.s(-0.6, 0.65, 0, 0.7, 0.1, 0.7); g.s(0.2, 0.4, 0.7, g.H, 0.3, 0.5);
});
def('ahu', 4.0, 2.0, (g, w, r) => {                                     // an air handling unit
  const h = Math.min(2.2, g.H - 1.4); g.bs(-1.95, 1.95, 0.12, h, 0.05, 1.9, C.galv, 'metal'); g.bs(-1.9, 1.9, 0, 0.12, 0.1, 1.85, C.steelD, 'metal');
  for (let u = -1.95; u < 1.9; u += 0.98) { g.b(u + 0.06, u + 0.9, 0.25, h - 0.12, 1.9, 1.91, C.steelL, 'metal'); g.b(u + 0.78, u + 0.84, h / 2, h / 2 + 0.16, 1.91, 1.93, C.black, 'matte', true); }
  g.b(-1.7, -0.7, h, g.H, 0.4, 1.5, C.galv, 'metal'); g.b(0.8, 1.6, h, g.H, 0.5, 1.4, C.galv, 'metal'); g.q(1.6, 1.92, 0.4, 0.06, 1.0, 1.5, C.cream, 'metal'); g.b(1.5, 1.6, 1.3, 1.36, 1.95, 1.953, C.led, 'glow');
  for (const u of [-0.3, 0.2]) g.c(u, 0.6, 1.98, 0.05, 0.16, 'd', pick(r, [C.red, C.blue]), 'metal', 6);
});
def('switchgear', 2.4, 0.75, (g, w, r) => {
  const e = w / 2, n = Math.max(1, Math.round(w / 0.8)), p = w / n; g.bs(-e, e, 0.08, 2.15, 0, 0.7, pick(r, [C.greyL, C.cream, C.steel]), 'metal'); g.b(-e, e, 0, 0.08, 0.03, 0.67, C.steelD);
  for (let i = 0; i < n; i++) { const u = -e + i * p; g.b(u + 0.005, u + 0.012, 0.1, 2.13, 0.7, 0.703, C.steelD); g.b(u + p - 0.12, u + p - 0.09, 1.0, 1.25, 0.7, 0.72, C.steelD, 'metal', true); g.b(u + 0.15, u + 0.4, 1.65, 1.85, 0.7, 0.704, C.black); for (let k = 0; k < 3; k++) g.b(u + 0.16 + k * 0.1, u + 0.2 + k * 0.1, 1.5, 1.54, 0.7, 0.705, pick(r, [C.led, C.led, C.ledR, C.ledA]), 'glow'); g.b(u + 0.15, u + 0.45, 0.4, 0.8, 0.7, 0.703, C.steelD); if (r() < 0.5) g.b(u + 0.5, u + 0.62, 1.7, 1.86, 0.7, 0.703, C.yellow); }
  g.b(-e + 0.1, e - 0.1, 2.15, g.H, 0.25, 0.45, C.galv, 'metal');
});
def('transformer', 1.8, 1.5, (g, w, r) => { g.bs(-0.6, 0.6, 0.1, 1.5, 0.3, 1.2, C.grey, 'metal'); for (let u = -0.56; u < 0.58; u += 0.1) { g.b(u, u + 0.03, 0.3, 1.3, 0.12, 0.3, C.grey, 'metal', true); g.b(u, u + 0.03, 0.3, 1.3, 1.2, 1.38, C.grey, 'metal', true); } for (const u of [-0.35, 0, 0.35]) { g.c(u, 1.68, 0.75, 0.06, 0.36, 'y', C.terracotta, 'matte', 8); g.c(u, 1.88, 0.75, 0.02, 0.06, 'y', C.copper, 'metal', 5); } g.b(-0.2, 0.2, 0.7, 0.9, 1.2, 1.203, C.yellow); for (const u of [-0.9, 0.9]) for (const d of [0.02, 1.48]) g.q(u, d, 0.04, 0.04, 0, 1.9, C.yellow); for (const y of [0.6, 1.2, 1.86]) { g.b(-0.9, 0.9, y, y + 0.03, 1.46, 1.5, C.yellow, 'matte', true); for (const u of [-0.9, 0.9]) g.b(u - 0.02, u + 0.02, y, y + 0.03, 0.02, 1.48, C.yellow, 'matte', true); } g.s(-0.9, 0.9, 0, 1.9, 0, 1.5); });
def('batteryRack', 1.6, 0.6, (g, w, r) => { for (const u of [-0.78, 0.78]) g.bs(u - 0.02, u + 0.02, 0, 1.6, 0, 0.6, C.steelD, 'metal'); for (const y of [0.1, 0.6, 1.1]) { g.b(-0.78, 0.78, y - 0.03, y, 0, 0.6, C.steelD, 'metal', true); for (let u = -0.72; u < 0.6; u += 0.24) { g.b(u, u + 0.2, y, y + 0.32, 0.08, 0.52, C.black, 'matte', true); g.b(u + 0.03, u + 0.07, y + 0.32, y + 0.35, 0.2, 0.24, C.red, 'matte', true); g.b(u + 0.13, u + 0.17, y + 0.32, y + 0.35, 0.2, 0.24, C.blue, 'matte', true); } } g.s(-0.8, 0.8, 0, 1.6, 0, 0.6); });
def('serverRack', 0.6, 1.1, (g, w, r) => {
  g.bs(-0.3, 0.3, 0, 2.05, 0.02, 1.08, C.black, 'metal');
  for (const [d, t] of [[1.08, 0.003], [0.02, -0.003]]) for (let y = 0.15; y < 1.95; y += 0.15) { if (r() < 0.2) continue; g.b(-0.24, 0.24, y, y + 0.12, Math.min(d, d + t), Math.max(d, d + t), 0x24262a, 'metal'); for (let k = 0; k < 3; k++) if (r() < 0.6) { const u = -0.2 + r() * 0.36; g.b(u, u + 0.018, y + 0.025, y + 0.043, Math.min(d + t, d + t * 2), Math.max(d + t, d + t * 2), pick(r, [C.led, C.led, C.led, C.ledA, C.ledB]), 'glow'); } }
});
def('ampRack', 0.6, 0.7, (g, w, r) => { g.bs(-0.3, 0.3, 0.08, 1.8, 0.02, 0.68, C.black, 'metal'); castors(g, -0.3, 0.3, 0.02, 0.68, 0.08); for (let y = 0.2; y < 1.7; y += 0.21) { g.b(-0.25, 0.25, y, y + 0.17, 0.68, 0.684, 0x2a2c30, 'metal'); for (let k = 0; k < 4; k++) if (r() < 0.45) { const u = -0.2 + k * 0.1; g.b(u, u + 0.02, y + 0.04, y + 0.06, 0.684, 0.687, pick(r, [C.led, C.ledA, C.ledR, C.ledB]), 'glow'); } } });
def('crac', 1.8, 0.9, (g, w, r) => { g.bs(-0.9, 0.9, 0, 2.0, 0, 0.88, C.enamel, 'metal'); for (const u of [-0.45, 0.45]) { for (let y = 1.3; y < 1.9; y += 0.08) g.b(u - 0.38, u + 0.38, y, y + 0.03, 0.88, 0.885, C.steelD); } g.b(-0.15, 0.15, 0.95, 1.12, 0.88, 0.884, C.off, 'metal'); g.b(-0.005, 0.005, 0.05, 1.95, 0.88, 0.883, C.steelD); });
def('valveSet', 1.6, 0.6, (g, w, r) => {                                // sprinkler risers, each with its valve and gauge
  for (const u of [-0.5, 0, 0.5]) { g.c(u, g.H / 2, 0.25, 0.08, g.H, 'y', C.red, 'metal', 8); g.c(u, 1.0, 0.25, 0.14, 0.3, 'y', C.red, 'metal', 8); g.c(u, 1.0, 0.45, 0.14, 0.03, 'd', r() < 0.5 ? C.red : C.black, 'matte', 10); g.c(u, 1.0, 0.39, 0.02, 0.1, 'd', C.steelL, 'metal', 5); g.c(u + 0.14, 1.45, 0.3, 0.05, 0.02, 'd', C.white, 'matte', 8); g.s(u - 0.14, u + 0.14, 0, g.H, 0.1, 0.47); }
  g.c(0, 0.45, 0.25, 0.06, 1.3, 'u', C.red, 'metal', 8); g.q(-0.25, 0.02, 0.2, 0.01, 1.5, 1.62, C.white);
});
def('riser', 1.6, 0.5, (g, w, r) => { let u = -0.7; while (u < 0.5) { const rr = 0.04 + r() * 0.1; g.c(u + rr, g.H / 2, 0.08 + rr, rr, g.H, 'y', pick(r, [C.lagging, C.red, C.copper, C.galv, C.blueL, C.green]), 'metal', 8); u += rr * 2 + 0.05; } g.s(-0.7, u, 0, g.H, 0.05, 0.36); });
def('rubberMat', 3.0, 1.0, g => { g.b(-1.5, 1.5, 0, 0.012, 0, 1.0, C.rubber, 'matte', true); });

// ---- staff rooms, stores ----
def('lockerRun', 1.2, 0.5, (g, w, r) => {
  const e = w / 2, n = Math.max(1, Math.round(w / 0.3)), p = w / n, c = pick(r, [C.blue, C.grey, C.greyL, C.green, C.steel]);
  g.bs(-e, e, 0.08, 1.88, 0, 0.5, c, 'metal'); g.b(-e, e, 0, 0.08, 0.04, 0.46, C.steelD);
  for (let i = 0; i < n; i++) { const u = -e + i * p; g.b(u, u + 0.006, 0.08, 1.88, 0.5, 0.503, C.steelD); g.b(u + p - 0.07, u + p - 0.04, 1.0, 1.1, 0.5, 0.515, C.steelL, 'metal', true); for (const y of [1.6, 1.66, 1.72]) g.b(u + 0.07, u + p - 0.07, y, y + 0.02, 0.5, 0.503, C.steelD); }
  g.b(-e, e, 0.98, 0.986, 0.5, 0.503, C.steelD);
});
def('bench', 1.6, 0.4, (g, w, r) => { const e = w / 2; g.b(-e, e, 0.4, 0.45, 0, 0.4, C.woodL, 'matte', true); for (const u of [-e + 0.15, e - 0.15]) g.bs(u - 0.03, u + 0.03, 0, 0.4, 0.04, 0.36, C.steelD, 'metal'); g.s(-e, e, 0.38, 0.47, 0, 0.4); });
def('coatRail', 1.5, 0.6, (g, w, r) => {
  const e = w / 2; for (const u of [-e + 0.04, e - 0.04]) { g.bs(u - 0.02, u + 0.02, 0.1, 1.75, 0.28, 0.32, C.steelL, 'metal'); g.b(u - 0.02, u + 0.02, 0.06, 0.1, 0.02, 0.58, C.steelL, 'metal', true); } g.b(-e, e, 1.72, 1.75, 0.285, 0.315, C.steelL, 'metal', true); g.b(-e, e, 1.95, 1.97, 0.1, 0.5, C.steelL, 'metal', true); for (const u of [-e + 0.04, e - 0.04]) g.b(u - 0.015, u + 0.015, 1.75, 1.95, 0.29, 0.31, C.steelL, 'metal');
  for (let u = -e + 0.1; u < e - 0.12; u += 0.085) { g.b(u + 0.012, u + 0.038, 1.6, 1.7, 0.53, 0.534, C.white);       // a numbered tag on every hook
    if (r() < 0.6) { const l = 0.6 + r() * 0.5; g.b(u, u + 0.05, 1.7 - l, 1.7, 0.08, 0.52, pick(r, COATS), 'matte', true); } }
  g.b(-e + 0.1, e - 0.1, 1.99, 2.09, 0.5, 0.505, 0x1f2a44); for (let u = -e + 0.2; u < e - 0.2; u += 0.3) g.b(u, u + 0.12, 2.01, 2.07, 0.505, 0.508, C.cream);      // and the run of numbers over them
  for (let u = -e + 0.1; u < e - 0.3; u += 0.3) if (r() < 0.35) g.b(u, u + 0.24, 1.97, 2.05 + r() * 0.1, 0.12, 0.45, pick(r, COATS), 'matte', true);
  g.s(-e, e, 0.55, 1.97, 0.08, 0.52);
});
// First aid: an examination couch with a paper sheet drawn down it and a pillow; a wall cabinet with a green cross (drawn here
// as two bars); a wheelchair folded flat against the wall.
def('aidCouch', 1.95, 0.7, g => {
  for (const u of [-0.85, 0.85]) for (const d of [0.08, 0.6]) g.b(u - 0.025, u + 0.025, 0, 0.5, d - 0.025, d + 0.025, C.steelL, 'metal');
  g.b(-0.9, 0.9, 0.28, 0.31, 0.06, 0.62, C.steelL, 'metal', true); g.b(-0.95, 0.95, 0.5, 0.6, 0.02, 0.68, 0x2f5d56, 'matte', true);
  g.b(-0.93, 0.6, 0.6, 0.607, 0.07, 0.63, C.white, 'matte'); g.b(0.56, 0.93, 0.6, 0.69, 0.1, 0.6, C.white, 'matte', true);      // the sheet, and the pillow
  g.c(-0.99, 0.56, 0.35, 0.05, 0.56, 'u', C.white, 'matte', 8);                                                                   // the roll it comes off
  g.s(-0.95, 0.95, 0, 0.62, 0.02, 0.68);
});
def('aidCabinet', 0.8, 0.3, g => {
  g.b(-0.36, 0.36, 1.15, 1.95, 0, 0.22, C.white, 'matte', true); g.b(-0.005, 0.005, 1.17, 1.93, 0.22, 0.223, C.greyL);
  g.b(-0.25, -0.11, 1.5, 1.62, 0.22, 0.226, 0x1f9a55, 'glow'); g.b(-0.21, -0.15, 1.44, 1.68, 0.22, 0.227, 0x1f9a55, 'glow');     // the cross, on one door
  g.b(0.3, 0.32, 1.5, 1.6, 0.22, 0.24, C.steelL, 'metal'); g.b(-0.02, 0.0, 1.5, 1.6, 0.22, 0.24, C.steelL, 'metal');
  g.bs(-0.3, 0.3, 0, 0.75, 0.02, 0.28, C.greyL); g.b(-0.3, 0.3, 0.75, 0.78, 0, 0.3, C.steelL, 'metal', true);                    // a low unit under it
  g.b(-0.2, -0.02, 0.78, 0.9, 0.06, 0.22, 0xd84a3a, 'matte', true); g.b(-0.16, -0.06, 0.82, 0.86, 0.22, 0.223, C.white);         // the bag
});
def('wheelchair', 1.0, 0.35, g => {
  for (const d of [0.06, 0.26]) { g.c(-0.12, 0.3, d, 0.3, 0.035, 'd', C.rubber, 'matte', 14); g.c(-0.12, 0.3, d, 0.24, 0.04, 'd', C.steelL, 'metal', 10); g.c(0.36, 0.09, d, 0.09, 0.035, 'd', C.rubber, 'matte', 8); }
  g.b(-0.3, -0.26, 0.3, 0.95, 0.07, 0.25, C.steelL, 'metal', true); g.b(-0.3, -0.24, 0.5, 0.92, 0.09, 0.23, 0x24385a, 'matte', true);      // the back, folded in
  g.b(-0.28, 0.3, 0.48, 0.52, 0.09, 0.23, 0x24385a, 'matte', true); g.b(-0.4, -0.26, 0.9, 0.94, 0.07, 0.25, C.black, 'matte', true);      // the seat sling, the handles
  g.b(0.28, 0.32, 0.12, 0.5, 0.08, 0.24, C.steelL, 'metal', true); g.b(0.3, 0.46, 0.12, 0.15, 0.08, 0.24, C.black, 'matte', true);         // the footplates
  g.s(-0.42, 0.46, 0, 0.95, 0.03, 0.3);
});
def('umbrellaStand', 0.6, 0.4, (g, w, r) => { g.bs(-0.28, 0.28, 0, 0.5, 0.03, 0.37, C.steelD, 'metal'); for (let i = 0; i < 6; i++) g.c(-0.22 + i * 0.09, 0.55, 0.12 + r() * 0.16, 0.02, 0.8, 'y', pick(r, COATS), 'matte', 5); g.s(-0.28, 0.28, 0.5, 0.95, 0.03, 0.37); });
def('janitorCart', 1.1, 0.6, (g, w, r) => { g.bs(-0.5, 0.5, 0.12, 0.2, 0.03, 0.57, C.grey); castors(g, -0.5, 0.5, 0.03, 0.57, 0.12); g.bs(-0.5, -0.05, 0.2, 0.95, 0.05, 0.55, C.yellow); g.b(0.0, 0.48, 0.2, 0.55, 0.08, 0.52, C.grey, 'matte', true); for (let i = 0; i < 3; i++) g.c(0.1 + i * 0.14, 0.68, 0.3, 0.045, 0.26, 'y', pick(r, [C.blue, C.pink, C.green, C.white]), 'matte', 6); g.c(-0.45, 0.9, 0.3, 0.015, 1.5, 'y', C.woodL, 'matte', 5); g.s(-0.5, 0.5, 0.2, 1.65, 0.05, 0.55); });
def('mopBucket', 0.5, 0.7, g => { g.bs(-0.2, 0.2, 0.06, 0.42, 0.05, 0.6, C.yellow); castors(g, -0.2, 0.2, 0.05, 0.6, 0.06); g.b(-0.2, 0.2, 0.42, 0.56, 0.05, 0.3, C.yellow, 'matte', true); g.c(0, 0.85, 0.42, 0.015, 1.3, 'y', C.woodL, 'matte', 5); g.q(0, 0.42, 0.2, 0.1, 0.2, 0.3, C.tissue); g.s(-0.2, 0.2, 0.42, 1.5, 0.05, 0.5); });
def('scrubber', 0.8, 1.2, g => { g.bs(-0.33, 0.33, 0.1, 0.9, 0.3, 1.1, C.blue); g.c(0, 0.08, 0.3, 0.3, 0.1, 'y', C.steelD, 'matte', 12); g.c(0, 0.2, 0.3, 0.26, 0.14, 'y', C.blue, 'matte', 12); for (const u of [-0.34, 0.34]) g.c(u, 0.14, 0.9, 0.14, 0.06, 'u', C.rubber, 'matte', 8); g.b(-0.3, 0.3, 0.9, 1.05, 1.02, 1.1, C.black, 'matte', true); g.b(-0.3, 0.3, 0.02, 0.08, 1.1, 1.18, C.rubber, 'matte', true); g.s(-0.33, 0.33, 0, 0.9, 0.02, 1.18); });
def('vacuum', 0.45, 0.45, g => { g.c(0, 0.25, 0.22, 0.18, 0.4, 'y', C.red, 'matte', 10); g.c(0, 0.5, 0.22, 0.14, 0.1, 'y', C.black, 'matte', 10); g.c(0.1, 0.8, 0.22, 0.02, 0.9, 'y', C.steelL, 'metal', 5); g.s(-0.18, 0.18, 0, 1.25, 0.04, 0.4); });
def('wetFloor', 0.35, 0.4, g => { g.bs(-0.15, 0.15, 0, 0.62, 0.17, 0.23, C.yellow); g.b(-0.15, 0.15, 0, 0.3, 0.05, 0.35, C.yellow, 'matte', true); g.s(-0.15, 0.15, 0, 0.3, 0.05, 0.35); });
def('stackedChairs', 0.6, 0.65, (g, w, r) => { const n = 4 + Math.floor(r() * 7), c = pick(r, [C.fabric, C.velvet, C.black, C.steelL]); for (const u of [-0.2, 0.2]) for (const d of [0.1, 0.5]) g.q(u, d, 0.03, 0.03, 0, 0.42, C.steelL, 'metal'); for (let i = 0; i < n; i++) { const y = 0.42 + i * 0.09; g.b(-0.23, 0.23, y, y + 0.035, 0.08 + i * 0.012, 0.52 + i * 0.012, c); } g.b(-0.23, 0.23, 0.46, 0.82 + n * 0.09, 0.05, 0.11 + n * 0.012, c); g.s(-0.24, 0.24, 0, 0.9 + n * 0.09, 0.05, 0.65); });
def('foldedTables', 1.9, 0.5, (g, w, r) => { g.b(-0.95, 0.95, 0.12, 0.18, 0, 0.5, C.steelD, 'metal', true); castors(g, -0.95, 0.95, 0, 0.5, 0.12); for (let d = 0.04; d < 0.44; d += 0.055) g.b(-0.9, 0.9, 0.18, 0.95, d, d + 0.035, d * 40 % 2 < 1 ? C.woodL : C.white, 'matte', true); for (const u of [-0.95, 0.92]) g.b(u, u + 0.03, 0.18, 1.1, 0, 0.5, C.steelD, 'metal', true); g.s(-0.95, 0.95, 0, 1.1, 0, 0.5); });
def('risers', 2.0, 1.0, (g, w, r) => { const n = 2 + Math.floor(r() * 5); for (let i = 0; i < n; i++) { g.b(-1, 1, i * 0.12 + 0.02, i * 0.12 + 0.1, 0, 1.0, C.black, 'matte', true); g.b(-1, 1, i * 0.12 + 0.1, i * 0.12 + 0.12, 0, 1.0, C.steelL, 'metal', true); } g.s(-1, 1, 0, n * 0.12, 0, 1); });
def('flightcase', 1.2, 0.7, (g, w, r) => { const cw = 0.6 + r() * 0.55, h = 0.5 + r() * 0.6, e = cw / 2; g.bs(-e, e, 0.1, 0.1 + h, 0.05, 0.65, C.black); castors(g, -e, e, 0.05, 0.65); for (const u of [-e, e - 0.02]) for (const d of [0.05, 0.63]) g.b(u, u + 0.02, 0.1, 0.1 + h, d, d + 0.02, C.steelL, 'metal', true); for (const y of [0.1, 0.08 + h]) { g.b(-e, e, y, y + 0.02, 0.63, 0.652, C.steelL, 'metal', true); g.b(-e, e, y, y + 0.02, 0.048, 0.07, C.steelL, 'metal', true); } g.b(-0.08, 0.08, 0.1 + h * 0.5, 0.14 + h * 0.5, 0.65, 0.66, C.steelL, 'metal', true); if (r() < 0.4) crateBox(g, -e + 0.05, e - 0.05, 0.1 + h, 0.4 + h, 0.1, 0.6, r); });
def('musicStands', 1.4, 0.5, (g, w, r) => { for (let u = -0.55; u < 0.6; u += 0.37) { g.c(u, 0.55, 0.25, 0.012, 1.1, 'y', C.black, 'metal', 5); g.c(u, 0.015, 0.25, 0.14, 0.03, 'y', C.black, 'metal', 6); g.b(u - 0.22, u + 0.22, 1.05, 1.36, 0.26, 0.275, C.black, 'metal', true); g.s(u - 0.1, u + 0.1, 0, 1.36, 0.15, 0.35); } });
def('lectern', 0.7, 0.6, g => { g.bs(-0.3, 0.3, 0, 1.1, 0.1, 0.5, C.woodD); g.b(-0.34, 0.34, 1.1, 1.16, 0.05, 0.55, C.woodD, 'matte', true); g.c(0.15, 1.3, 0.2, 0.008, 0.3, 'y', C.black, 'metal', 5); g.b(-0.15, 0.1, 1.16, 1.17, 0.2, 0.45, C.lamp, 'glow', true); });
def('micStand', 0.4, 0.4, g => { g.c(0, 0.015, 0.2, 0.15, 0.03, 'y', C.black, 'metal', 8); g.c(0, 0.75, 0.2, 0.012, 1.5, 'y', C.steelL, 'metal', 5); g.c(0, 1.52, 0.2, 0.025, 0.14, 'd', C.black, 'matte', 6); g.s(-0.1, 0.1, 0, 1.55, 0.1, 0.3); });
def('piano', 1.6, 3.1, (g, w, r) => {
  // The straight side is on the player's left, as it is: the bass strings are the long ones. The keys themselves,
  // and the lid propped open, are made by src/piano.js, which is told here where the keyboard is.
  const k = 0.55;
  g.b(-0.75, 0.75, 0.7, 1.0, k + 0.3, k + 1.2, C.black, 'matte', true); g.b(-0.3, 0.75, 0.7, 1.0, k + 1.2, k + 2.0, C.black, 'matte', true); g.b(0.1, 0.75, 0.7, 1.0, k + 2.0, k + 2.5, C.black, 'matte', true);
  g.b(-0.75, 0.75, 0.6, 0.74, k + 0.1, k + 0.32, C.black, 'matte', true); for (const u of [-0.75, 0.72]) g.b(u, u + 0.03, 0.74, 0.8, k + 0.1, k + 0.32, C.black, 'matte', true);
  for (const [u, d] of [[-0.65, 0.4], [0.65, 0.4], [0.4, 2.35]]) g.qs(u, k + d, 0.1, 0.1, 0, 0.7, C.black);
  stool(g, 0, 0.3, 0.5, C.black); g.s(-0.75, 0.75, 0.6, 1.05, k + 0.1, k + 2.5);
  g.mark('piano', 0, k + 0.13, 0.74);
});
def('curtain', 1.2, 0.3, (g, w, r) => { const e = w / 2, h = g.H - 0.3; for (let u = -e; u < e - 0.01; u += 0.2) g.b(u, u + 0.2, 0.03, h, 0.05, 0.15 + (Math.round(u * 5) % 2 ? 0.08 : 0), C.velvet, 'matte', true); g.b(-e, e, h, h + 0.06, 0.05, 0.25, C.steelD, 'metal'); g.s(-e, e, 0, h, 0.05, 0.25); });
def('ropeRail', 2.0, 0.4, (g, w, r) => { g.b(-1, 1, 1.1, 1.2, 0.05, 0.25, C.woodD, 'matte', true); for (const u of [-0.95, 0.95]) g.bs(u - 0.04, u + 0.04, 0, 1.1, 0.1, 0.2, C.woodD); for (let u = -0.8; u < 0.85; u += 0.2) { g.c(u, 1.25, 0.15, 0.02, 0.3, 'y', C.woodL, 'matte', 5); g.c(u + 0.02, (1.4 + g.H) / 2, 0.15, 0.012, g.H - 1.4, 'y', C.canvas, 'matte', 4); } g.s(-1, 1, 1, 1.4, 0.05, 0.25); });
def('propsTable', 1.8, 0.7, (g, w, r) => { table(g, -0.9, 0.9, 0, 0.7, 0.76, C.ply, C.steelD); for (let i = 0; i < 6; i++) { const u = -0.75 + i * 0.3; r() < 0.5 ? g.c(u, 0.86, 0.3 + r() * 0.2, 0.05 + r() * 0.04, 0.2, 'y', pick(r, MERCH), 'matte', 7) : g.q(u, 0.35, 0.18, 0.2, 0.76, 0.82 + r() * 0.15, pick(r, MERCH)); } });
def('dressingTable', 1.3, 1.2, (g, w, r) => { table(g, -0.65, 0.65, 0, 0.5, 0.76, C.white, C.steelD); g.b(-0.55, 0.55, 0.9, 1.8, 0, 0.03, C.steelD); g.b(-0.5, 0.5, 0.95, 1.75, 0.03, 0.035, C.glass); for (let u = -0.52; u < 0.55; u += 0.26) for (const y of [0.92, 1.77]) g.c(u, y, 0.05, 0.03, 0.03, 'd', C.lamp, 'glow', 6); chair(g, 0, 0.85, -1, C.velvet); });
def('filmBench', 1.8, 0.7, (g, w, r) => { table(g, -0.9, 0.9, 0, 0.7, 0.9, C.grey, C.steelD); for (const u of [-0.5, 0.5]) { g.c(u, 1.25, 0.25, 0.012, 0.7, 'y', C.steelL, 'metal', 5); g.c(u, 1.5, 0.3, 0.2, 0.03, 'd', C.steel, 'metal', 12); } g.q(0, 0.35, 0.25, 0.3, 0.9, 1.0, C.steelD, 'metal'); g.b(-0.1, 0.1, 1.0, 1.003, 0.25, 0.45, C.tube, 'glow', true); });
def('mixingDesk', 1.6, 1.4, (g, w, r) => { table(g, -0.8, 0.8, 0, 0.8, 0.74, C.black, C.steelD); g.b(-0.7, 0.7, 0.74, 0.86, 0.1, 0.7, C.steelD, 'metal', true); for (let u = -0.64; u < 0.66; u += 0.08) { g.b(u, u + 0.02, 0.86, 0.875, 0.2 + r() * 0.3, 0.26 + r() * 0.3, C.white, 'matte', true); if (r() < 0.5) g.b(u, u + 0.02, 0.86, 0.864, 0.62, 0.64, pick(r, [C.led, C.ledR, C.ledA]), 'glow', true); } chair(g, 0, 1.12, -1, C.black); });
def('projector', 1.2, 1.9, (g, w, r) => {                               // throws through a port in the wall behind it
  g.b(-0.25, 0.25, 1.35, 1.75, 0, 0.03, C.black); g.b(-0.2, 0.2, 1.4, 1.7, 0.03, 0.036, 0x202838, 'glow');
  g.bs(-0.35, 0.35, 0, 1.1, 0.5, 1.6, C.steelD, 'metal'); g.b(-0.4, 0.4, 1.1, 1.75, 0.45, 1.7, C.grey, 'metal', true); g.c(0, 1.52, 0.35, 0.11, 0.24, 'd', C.black, 'metal', 10); g.c(0, 1.52, 0.228, 0.085, 0.006, 'd', 0x6a7ab0, 'glow', 10);
  g.c(0.2, (1.75 + g.H) / 2, 1.3, 0.1, g.H - 1.75, 'y', C.galv, 'metal', 8); for (const d of [0.9, 1.3]) g.c(-0.43, 1.45, d, 0.22, 0.04, 'u', C.steel, 'metal', 12); g.b(0.4, 0.404, 1.3, 1.36, 0.8, 1.0, C.led, 'glow'); g.s(-0.4, 0.4, 1.1, 1.75, 0.3, 1.7);
});
def('spotlight', 0.9, 1.2, g => { g.c(0, 0.02, 0.6, 0.35, 0.04, 'y', C.black, 'metal', 8); g.c(0, 0.7, 0.6, 0.03, 1.4, 'y', C.black, 'metal', 6); g.c(0, 1.5, 0.55, 0.16, 0.8, 'd', C.black, 'metal', 10); g.c(0, 1.5, 0.148, 0.12, 0.006, 'd', 0x8a8470, 'glow', 10); g.s(-0.16, 0.16, 0, 1.66, 0.15, 0.95); });
def('seatRow', 2.0, 0.95, (g, w, r, o = {}) => {                        // a row of seats, on a step if the floor is raked
  const y = o.rise || 0, e = w / 2, n = Math.max(1, Math.floor(w / 0.55)), p = w / n, c = o.loose ? C.fabric : C.velvet;
  if (y > 0.001) g.b(-e, e, 0, y, 0, 0.95, 0x3a2f2a, 'matte', true);
  for (let i = 0; i < n; i++) { const u = -e + (i + 0.5) * p; if (o.loose && r() < 0.06) continue; g.b(u - 0.22, u + 0.22, y + 0.4, y + 0.9, 0.08, 0.16, c, 'matte', true); o.loose || r() < 0.2 ? g.b(u - 0.22, u + 0.22, y + 0.4, y + 0.46, 0.16, 0.58, c, 'matte', true) : g.b(u - 0.22, u + 0.22, y + 0.3, y + 0.74, 0.16, 0.24, c, 'matte', true); if (o.loose) for (const su of [-0.2, 0.2]) for (const d of [0.12, 0.54]) g.q(u + su, d, 0.025, 0.025, y, y + 0.4, C.steelL, 'metal'); }
  if (!o.loose) for (let i = 0; i <= n; i++) { const u = -e + i * p; g.b(u - 0.025, u + 0.025, y, y + 0.58, 0.1, 0.5, C.woodD, 'matte', true); }
  g.s(-e, e, 0, y + 0.9, 0, o.rise ? 0.95 : 0.6);
});
def('stageDais', 6, 3.2, (g, w, r) => {
  const e = w / 2; g.bs(-e, e, 0, 0.5, 0, 3.0, C.woodD); g.b(-e, e, 0.5, 0.52, 0, 3.05, C.wood, 'matte', true);
  const sw = Math.min(w - 1, 5), st = Math.min(g.H - 0.15, 3.4); g.b(-sw / 2, sw / 2, st - 0.12, st, 0, 0.1, C.steelD, 'metal', true); g.b(-sw / 2 + 0.05, sw / 2 - 0.05, 1.1, st - 0.12, 0.03, 0.04, C.enamel);
  g.q(e - 1.0, 2.2, 0.6, 0.4, 0.52, 1.6, C.woodD); g.b(e - 1.34, e - 0.66, 1.6, 1.66, 1.95, 2.45, C.woodD, 'matte', true); g.s(e - 1.34, e - 0.66, 0.5, 1.66, 1.95, 2.45);
  for (const u of [-e + 0.3, e - 0.5]) for (let k = 0; k < 2; k++) g.b(u + k * 0.2 - 0.2, u + k * 0.2, 0.52, Math.min(g.H - 0.1, 3.6), 0.05, 0.2 + k * 0.06, C.velvet, 'matte', true);
});
def('balconyRail', 3, 0.15, (g, w) => { const e = w / 2; g.bs(-e, e, 0, 0.8, 0.02, 0.12, C.woodD); g.b(-e, e, 0.8, 0.86, 0, 0.15, C.gilt, 'metal', true); });

// ---- kitchens, cafes ----
def('range', 1.8, 0.85, (g, w, r) => {
  const e = w / 2; g.bs(-e, e, 0, 0.9, 0, 0.8, C.steelL, 'metal'); for (let u = -e + 0.25; u < e; u += 0.45) for (const d of [0.25, 0.6]) g.c(u, 0.91, d, 0.12, 0.02, 'y', C.black, 'matte', 8);
  for (let u = -e + 0.05; u < e - 0.4; u += 0.9) { g.b(u, u + 0.8, 0.12, 0.62, 0.8, 0.805, C.steelD, 'metal'); g.b(u + 0.1, u + 0.7, 0.64, 0.67, 0.8, 0.84, C.steel, 'metal', true); } for (let u = -e + 0.12; u < e - 0.05; u += 0.2) g.c(u, 0.78, 0.82, 0.03, 0.04, 'd', C.black, 'matte', 6);
  if (r() < 0.7) g.c(-e + 0.25, 1.04, 0.25, 0.14, 0.24, 'y', C.steel, 'metal', 10); if (r() < 0.5) g.c(e - 0.2, 0.96, 0.6, 0.13, 0.08, 'y', C.black, 'metal', 10);
  const hy = Math.min(2.05, g.H - 0.9); g.b(-e, e, hy, hy + 0.45, 0, 1.0, C.steelL, 'metal', true); g.b(-e + 0.3, e - 0.3, hy + 0.45, g.H, 0.2, 0.7, C.galv, 'metal'); g.b(-e, e, 0.9, hy, 0, 0.015, C.steelL, 'metal');
});
ITEMS.range.d = 1.0;
def('fryer', 0.8, 0.85, (g, w, r) => { g.bs(-0.38, 0.38, 0, 0.9, 0, 0.8, C.steelL, 'metal'); for (const u of [-0.19, 0.19]) { g.q(u, 0.4, 0.3, 0.5, 0.9, 0.91, C.steelD, 'metal'); g.b(u - 0.02, u + 0.02, 0.91, 1.15, 0.05, 0.08, C.steel, 'metal', true); } g.b(-0.3, -0.2, 0.7, 0.74, 0.8, 0.803, C.ledA, 'glow'); });
def('prep', 2.0, 0.75, (g, w, r, o = {}) => {
  const e = w / 2; table(g, -e, e, 0, 0.75, 0.9, C.steelL, C.steel, { metal: true, shelf: true }); fill(g, -e + 0.1, e - 0.1, 0.23, 0.08, 0.67, 0.5, r, 'pots');
  for (let i = 0; i < 3; i++) { const u = -e + 0.3 + r() * (w - 0.6); r() < 0.5 ? g.q(u, 0.4, 0.4, 0.28, 0.9, 0.925, pick(r, [C.white, C.green, C.red, C.woodL])) : g.c(u, 0.97, 0.35, 0.12, 0.14, 'y', C.steel, 'metal', 8); }
  if (!o.island) { g.b(-e, e, 1.5, 1.53, 0, 0.35, C.steelL, 'metal', true); fill(g, -e + 0.05, e - 0.05, 1.53, 0, 0.35, 0.35, r, 'crockery'); g.s(-e, e, 1.5, 1.8, 0, 0.35); }
  else { for (const u of [-e + 0.05, e - 0.05]) g.c(u, 1.4, 0.37, 0.015, 1.0, 'y', C.steel, 'metal', 5); g.b(-e, e, 1.88, 1.9, 0.3, 0.44, C.steel, 'metal', true); for (let u = -e + 0.2; u < e - 0.1; u += 0.28) { g.c(u, 1.68, 0.37, 0.1, 0.1, 'y', pick(r, [C.steelL, C.copper, C.black]), 'metal', 8); } g.s(-e, e, 1.55, 1.9, 0.3, 0.44); }
});
def('dishwasher', 1.6, 0.8, (g, w, r) => { g.bs(-0.4, 0.4, 0, 0.86, 0.02, 0.78, C.steelL, 'metal'); g.b(-0.36, 0.36, 1.3, 1.9, 0.06, 0.74, C.steelL, 'metal', true); for (const u of [-0.38, 0.38]) g.b(u - 0.015, u + 0.015, 0.86, 1.3, 0.38, 0.42, C.steel, 'metal'); g.b(-0.42, 0.42, 1.25, 1.29, 0.74, 0.8, C.steelD, 'metal', true); g.b(-0.8, -0.4, 0.82, 0.86, 0.02, 0.78, C.steelL, 'metal', true); g.b(0.4, 0.8, 0.82, 0.86, 0.02, 0.78, C.steelL, 'metal', true); for (const u of [-0.76, 0.76]) g.bs(u - 0.02, u + 0.02, 0, 0.82, 0.38, 0.42, C.steel, 'metal'); g.q(0.6, 0.4, 0.36, 0.36, 0.86, 0.96, C.blueL); g.b(0.2, 0.3, 1.5, 1.56, 0.74, 0.743, C.led, 'glow'); g.c(0, (1.9 + g.H) / 2, 0.4, 0.1, g.H - 1.9, 'y', C.galv, 'metal', 6); g.s(-0.8, 0.8, 0.8, 1.9, 0.02, 0.78); });
def('trayRack', 0.6, 0.75, (g, w, r) => { for (const u of [-0.27, 0.27]) for (const d of [0.04, 0.7]) g.q(u, d, 0.025, 0.025, 0.1, 1.75, C.steelL, 'metal'); for (let y = 0.25; y < 1.7; y += 0.1) if (r() < 0.75) g.b(-0.26, 0.26, y, y + 0.02, 0.05, 0.69, pick(r, [C.steelL, C.fabric, C.cream, C.orange]), 'matte', true); castors(g, -0.27, 0.27, 0.04, 0.7); g.s(-0.28, 0.28, 0, 1.75, 0.03, 0.72); });
def('cafeTable', 1.9, 1.9, (g, w, r, o = {}) => {
  const c = o.cloth ? C.enamel : o.outdoor ? C.steelL : pick(r, [C.woodL, C.white, C.woodD]), cc = o.outdoor ? C.steelL : o.cloth ? C.woodD : pick(r, [C.woodD, C.fabric, C.red, C.black]), m = 0.95;
  if (o.square || o.cloth) { g.b(-0.4, 0.4, 0.71, 0.75, m - 0.4, m + 0.4, c, 'matte', true); if (o.cloth) g.b(-0.42, 0.42, 0.5, 0.71, m - 0.42, m + 0.42, c, 'matte', true); } else g.c(0, 0.73, m, 0.42, 0.04, 'y', c, 'matte', 28); g.c(0, 0.706, m, 0.4, 0.008, 'y', C.woodD, 'matte', 28);
  g.c(0, 0.36, m, 0.04, 0.7, 'y', C.steelD, 'metal', 12); g.c(0, 0.015, m, 0.24, 0.03, 'y', C.steelD, 'metal', 20); g.s(-0.06, 0.06, 0, 0.7, m - 0.06, m + 0.06); g.s(-0.4, 0.4, 0.68, 0.78, m - 0.4, m + 0.4);
  if (r() < 0.9) chair(g, 0, m - 0.66, 1, cc); if (r() < 0.9) chair(g, 0, m + 0.66, -1, cc);
  if (o.cloth) { g.c(0, 0.82, m, 0.03, 0.14, 'y', C.glass, 'matte', 6); for (const d of [-0.22, 0.22]) g.c(0, 0.756, m + d, 0.11, 0.012, 'y', C.white, 'matte', 8); } else if (r() < 0.4) g.c(0.15, 0.8, m + 0.1, 0.035, 0.1, 'y', C.white, 'matte', 6);
});
def('servery', 5.0, 2.4, (g, w, r) => {                                 // the counter you queue along, and what is behind it
  const e = w / 2; g.bs(-e, e, 0, 0.9, 1.5, 2.2, C.woodD); g.b(-e, e, 0.9, 0.94, 1.45, 2.3, C.steelL, 'metal', true); g.b(-e, e, 0.86, 0.88, 2.3, 2.42, C.steelL, 'metal', true);
  g.b(-e + 0.2, -0.2, 0.94, 1.4, 1.6, 2.15, C.glass, 'matte', true); for (let u = -e + 0.3; u < -0.4; u += 0.3) g.q(u, 1.88, 0.2, 0.3, 0.96, 1.04 + r() * 0.1, pick(r, [C.cream, C.terracotta, C.pink, C.woodL, C.green]));
  g.q(0.5, 1.85, 0.6, 0.45, 0.94, 1.4, C.steelL, 'metal'); g.q(0.5, 1.85, 0.5, 0.3, 1.4, 1.5, C.steelD, 'metal'); g.q(e - 0.5, 1.85, 0.35, 0.35, 0.94, 1.1, C.black); g.b(e - 0.62, e - 0.38, 1.1, 1.3, 1.8, 1.83, C.off, 'metal', true);
  g.bs(-e, e, 0, 0.9, 0, 0.65, C.steelL, 'metal'); g.b(-e, e, 1.5, 1.53, 0, 0.35, C.steelL, 'metal', true); fill(g, -e + 0.05, e - 0.05, 1.53, 0, 0.35, 0.35, r, 'crockery'); fill(g, -e + 0.05, e - 0.05, 0.9, 0, 0.6, 0.4, r, 'pots');
  g.b(-e, e, 2.2, 2.6, 0, 0.06, C.black); for (let u = -e + 0.2; u < e - 0.8; u += 1.1) g.b(u, u + 0.9, 2.25, 2.55, 0.06, 0.064, 0x3a3830, 'glow'); g.s(-e, e, 0.9, 1.9, 0, 0.4);
});
def('bar', 5.0, 2.2, (g, w, r) => {
  const e = w / 2; g.bs(-e, e, 0, 1.08, 1.5, 2.0, C.woodD); g.b(-e, e, 1.08, 1.12, 1.4, 2.1, C.black, 'matte', true); for (let u = -e + 0.5; u < e - 0.2; u += 0.75) stool(g, u, 2.2 - 0.18 + 0.0, 0.75, C.steelL);
  g.bs(-e, e, 0, 0.9, 0, 0.5, C.woodD); for (const y of [1.3, 1.7, 2.1]) { g.b(-e, e, y, y + 0.03, 0, 0.3, C.glass, 'matte', true); for (let u = -e + 0.08; u < e - 0.08; u += 0.11) if (r() < 0.8) g.c(u, y + 0.03 + 0.13, 0.15, 0.035, 0.26, 'y', pick(r, [C.greenD, C.woodD, C.glass, C.copper, C.blueL, C.yellow]), 'matte', 6); } g.b(-e, e, 1.2, 2.5, 0, 0.02, 0x40342a, 'glow'); g.s(-e, e, 0.9, 2.5, 0, 0.32);
});
ITEMS.bar.d = 2.45;
def('banquette', 2.2, 0.75, (g, w, r) => { const e = w / 2, c = pick(r, [C.leather, C.velvet, C.greenD]); g.bs(-e, e, 0, 0.45, 0, 0.6, c); g.b(-e, e, 0.45, 1.05, 0, 0.14, c, 'matte', true); g.s(-e, e, 0.45, 1.05, 0, 0.14); });
def('planter', 2.0, 0.7, (g, w, r) => { g.bs(-1, 1, 0, 0.6, 0.05, 0.65, C.steelD, 'metal'); for (let u = -0.8; u < 0.85; u += 0.4) g.c(u, 0.85 + r() * 0.2, 0.35, 0.22 + r() * 0.08, 0.6, 'y', r() < 0.5 ? C.greenD : 0x3a4a34, 'matte', 7); g.b(-0.98, 0.98, 0.6, 0.66, 0.07, 0.63, C.enamel, 'matte', true); g.s(-1, 1, 0.6, 1.3, 0.1, 0.6); });

// ---- teaching ----
def('drawingHorse', 1.3, 1.4, (g, w, r) => {                            // a donkey: you sit astride it, the board leans on the far end
  g.b(-0.15, 0.15, 0.45, 0.5, 0.2, 1.3, C.pine, 'matte', true); for (const d of [0.25, 1.2]) g.bs(-0.25, 0.25, 0, 0.45, d - 0.03, d + 0.03, C.pine); g.bs(-0.15, 0.15, 0.5, 1.05, 0.2, 0.26, C.pine);
  if (r() < 0.85) { g.b(-0.35, 0.35, 0.55, 1.35, 0.26, 0.285, C.ply, 'matte', true); g.b(-0.3, 0.3, 0.62, 1.3, 0.285, 0.29, C.cream); for (let i = 0; i < 3; i++) g.b(-0.2 + r() * 0.3, 0.0 + r() * 0.25, 0.7 + r() * 0.4, 0.74 + r() * 0.5, 0.29, 0.292, 0x3a3836); }
  g.s(-0.35, 0.35, 0.44, 1.35, 0.2, 1.3);
});
def('modelStand', 2.0, 2.0, (g, w, r) => { g.bs(-0.9, 0.9, 0, 0.35, 0.1, 1.9, C.ply); g.b(-0.9, 0.9, 0.35, 0.36, 0.1, 1.9, C.velvet, 'matte', true); if (r() < 0.5) { chair(g, 0.2, 1.0, 1, C.woodD, 0.8); g.q(-0.4, 1.2, 0.5, 0.5, 0.36, 0.76, C.canvas); g.c(-0.4, 0.94, 1.2, 0.1, 0.36, 'y', C.celadon, 'matte', 8); g.c(-0.25, 0.81, 1.05, 0.05, 0.1, 'y', C.orange, 'matte', 6); } else { figure(g, 0, 1.0, 0.36, r, false); } });
def('plasterCast', 0.8, 0.8, (g, w, r) => { g.qs(0, 0.4, 0.55, 0.55, 0, 0.9, C.greyL); const k = r(); if (k < 0.5) { g.c(0, 1.05, 0.4, 0.16, 0.3, 'y', C.plaster, 'matte', 8); g.c(0, 1.32, 0.4, 0.13, 0.28, 'y', C.plaster, 'matte', 8); } else figure(g, 0, 0.4, 0.9, r, false); g.s(-0.25, 0.25, 0.9, 2.4, 0.15, 0.65); });
def('etchingPress', 1.8, 1.4, (g, w, r) => {
  for (const u of [-0.5, 0.5]) { g.bs(u - 0.05, u + 0.05, 0, 0.8, 0.3, 1.1, C.steelD, 'metal'); g.b(u - 0.05, u + 0.05, 0.8, 1.35, 0.55, 0.85, C.steelD, 'metal', true); } g.b(-0.42, 0.42, 0.82, 0.86, 0.0, 1.4, C.steelL, 'metal', true); g.b(-0.4, 0.4, 0.86, 0.875, 0.5, 1.1, C.fabric, 'matte', true);
  g.c(0, 1.0, 0.7, 0.12, 0.9, 'u', C.steelL, 'metal', 10); g.c(0, 0.7, 0.7, 0.1, 0.9, 'u', C.steelL, 'metal', 10); g.c(0.62, 1.0, 0.7, 0.03, 0.16, 'u', C.steelD, 'metal', 6); g.c(0.72, 1.0, 0.7, 0.4, 0.03, 'u', C.steelD, 'metal', 12);
  for (const u of [-0.5, 0.5]) g.c(u, 1.42, 0.7, 0.025, 0.16, 'y', C.steelL, 'metal', 6); g.s(-0.55, 0.75, 0.8, 1.45, 0.0, 1.4);
});
def('kidsTable', 1.8, 1.9, (g, w, r) => { table(g, -0.7, 0.7, 0.55, 1.35, 0.55, pick(r, [C.woodL, C.white, C.yellow, C.blueL]), C.steelL); for (const u of [-0.4, 0.4]) for (const [d, s] of [[0.28, 1], [1.62, -1]]) { g.qs(u + (r() - 0.5) * 0.1, d, 0.3, 0.3, 0, 0.32, pick(r, MERCH)); } for (let i = 0; i < 4; i++) g.q(-0.5 + r() * 1.0, 0.75 + r() * 0.4, 0.2, 0.15, 0.55, 0.556, pick(r, [C.white, C.cream, C.pink, C.blueL, C.yellow])); if (r() < 0.6) g.c(0, 0.6, 0.95, 0.06, 0.1, 'y', pick(r, TINS), 'matte', 7); });
def('cubbies', 1.6, 0.4, (g, w, r) => { g.b(-0.8, 0.8, 0, 1.2, 0, 0.02, C.woodL); for (let u = -0.8; u <= 0.81; u += 0.4) g.b(u - 0.012, u + 0.012, 0, 1.2, 0, 0.4, C.woodL, 'matte', true); for (let y = 0; y < 1.21; y += 0.4) g.b(-0.8, 0.8, Math.max(0, y - 0.02), Math.max(0.02, y + 0.004), 0, 0.4, C.woodL, 'matte', true); for (let u = -0.78; u < 0.7; u += 0.4) for (let y = 0.004; y < 1.1; y += 0.4) if (r() < 0.7) g.b(u + 0.04, u + 0.33, Math.max(0.02, y), y + 0.15 + r() * 0.18, 0.05, 0.36, pick(r, MERCH), 'matte', true); g.s(-0.8, 0.8, 0, 1.2, 0, 0.4); });
def('blocks', 0.9, 0.9, (g, w, r) => { for (let i = 0; i < 7; i++) { const s = 0.14 + r() * 0.14, u = (r() - 0.5) * 0.6, d = 0.45 + (r() - 0.5) * 0.6; g.q(u, d, s, s, 0, s, pick(r, MERCH)); g.s(u - s / 2, u + s / 2, 0, s, d - s / 2, d + s / 2); } });
def('beanbag', 0.9, 0.9, (g, w, r) => { const c = pick(r, MERCH); g.c(0, 0.16, 0.45, 0.4, 0.32, 'y', c, 'matte', 10); g.c(0, 0.4, 0.45, 0.28, 0.18, 'y', c, 'matte', 10); g.s(-0.38, 0.38, 0, 0.5, 0.07, 0.83); });

// ---- restrooms, shops ----
// A cubicle. Partitions clear of the floor, a door that is shut, pushed half in or standing open against the partition
// with the pan in view. `wide`: the accessible one, with a grab rail.
def('stall', 0.95, 1.5, (g, w, r, o = {}) => {
  const e = w / 2, c = C.greyL, x = r(), door = o.door || (x < 0.58 ? 'shut' : x < 0.8 ? 'ajar' : 'open'), dc = o.wide ? C.blue : r() < 0.25 ? C.steelD : C.blueL, dw = w - 0.2;
  g.bs(-e, -e + 0.03, 0.15, 2.0, 0, 1.5, c); g.bs(e - 0.03, e, 0.15, 2.0, 0, 1.5, c);
  for (const u of [-e, e - 0.1]) g.bs(u, u + 0.1, 0, 2.05, 1.46, 1.5, c);
  g.b(-e, e, 2.0, 2.05, 1.46, 1.5, C.steelL, 'metal', true);
  if (door === 'shut') { g.bs(-e + 0.1, e - 0.1, 0.15, 1.95, 1.465, 1.495, dc); g.b(e - 0.2, e - 0.16, 1.0, 1.06, 1.495, 1.52, C.steelL, 'metal', true); }
  else if (door === 'ajar') g.bs(-e + 0.1, -e + 0.1 + dw * 0.62, 0.15, 1.95, 1.3, 1.33, dc);
  else g.bs(-e + 0.04, -e + 0.07, 0.15, 1.95, 1.46 - dw, 1.46, dc);
  g.q(0, 0.42, 0.36, 0.5, 0, 0.4, C.enamel); g.q(0, 0.42, 0.38, 0.52, 0.4, 0.43, C.enamel); g.bs(-0.22, 0.22, 0, 0.8, 0, 0.17, C.enamel); g.s(-0.19, 0.19, 0, 0.43, 0.16, 0.68);
  g.c(e - 0.12, 0.7, 0.9, 0.06, 0.1, 'u', C.white, 'matte', 6);
  if (o.wide) { g.c(-e + 0.1, 0.8, 0.6, 0.02, 0.9, 'd', C.steelL, 'metal', 6); g.c(0.42, 0.8, 0.07, 0.02, 0.5, 'u', C.steelL, 'metal', 6); }
});
// A urinal, with a screen at its shoulder.
def('urinal', 0.75, 0.42, (g, w) => {
  const e = w / 2; g.b(-0.19, 0.19, 0.42, 1.2, 0, 0.06, C.enamel, 'matte', true); g.q(0, 0.2, 0.36, 0.3, 0.42, 0.62, C.enamel); g.q(0, 0.1, 0.3, 0.14, 0.62, 1.1, C.enamel);
  g.c(0, 1.3, 0.04, 0.018, 0.22, 'y', C.steelL, 'metal', 5); g.c(0, 0.25, 0.08, 0.025, 0.36, 'y', C.steelL, 'metal', 5);
  g.bs(e - 0.025, e, 0.4, 1.5, 0, 0.42, C.greyL); g.s(-0.19, 0.19, 0.4, 0.7, 0, 0.36);
});
// A run of basins set in a counter, and over it the mirror: framed, with a shelf under it and a strip light above. The
// glass is painted, not a true reflection: silver graded across its width, a bright streak, and the dim shapes of the
// cubicle doors on the wall behind you.
def('basinRun', 0.7, 0.5, (g, w, r) => {
  const e = w / 2, n = Math.max(1, Math.round(w / 0.7));
  g.b(-e, e, 0.8, 0.86, 0, 0.5, C.enamel, 'matte', true); g.b(-e, e, 0.66, 0.8, 0.42, 0.46, C.greyL, 'matte', true); g.b(-e, e, 0.3, 0.8, 0, 0.1, C.greyL, 'matte', true);
  for (const u of [-e + 0.02, e - 0.02]) g.b(u - 0.02, u + 0.02, 0, 0.8, 0.04, 0.44, C.greyL);
  g.s(-e, e, 0.5, 0.9, 0, 0.5);
  for (let i = 0; i < n; i++) { const u = -e + (i + 0.5) * w / n;
    g.q(u, 0.28, 0.42, 0.3, 0.855, 0.864, C.steelL, 'metal'); g.c(u, 0.93, 0.07, 0.014, 0.14, 'y', C.steelL, 'metal', 5); g.b(u - 0.012, u + 0.012, 0.98, 1.0, 0.06, 0.2, C.steelL, 'metal', true);
    g.c(u, 0.6, 0.26, 0.03, 0.4, 'y', C.steelL, 'metal', 5); g.b(u + 0.2, u + 0.28, 1.1, 1.26, 0.02, 0.09, C.white, 'matte', true); g.b(u + 0.225, u + 0.255, 1.06, 1.1, 0.05, 0.08, C.steelD, 'matte', true); }
  const y0 = 1.34, y1 = 2.0, k = Math.max(4, Math.round(w / 0.3));
  g.b(-e, e, y0 - 0.04, y1 + 0.04, 0, 0.018, C.steelD);
  for (let i = 0; i < k; i++) { const t = i / (k - 1 || 1), v = 0.5 + 0.5 * Math.cos((t - 0.3) * 3.4), c = (Math.round(0xb4 + 0x22 * v) << 16) | (Math.round(0xc3 + 0x1e * v) << 8) | Math.round(0xca + 0x1c * v);
    g.b(-e + 0.03 + (w - 0.06) * i / k, -e + 0.03 + (w - 0.06) * (i + 1) / k, y0, y1, 0.018, 0.024, c, 'metal'); }
  for (let u = -e + 0.2; u + 0.5 < e - 0.1; u += 0.62) { g.b(u, u + 0.5, y0, y0 + 0.4, 0.024, 0.0255, 0x93a5ae, 'metal'); g.b(u + 0.4, u + 0.43, y0 + 0.16, y0 + 0.22, 0.0255, 0.0265, 0xb9c6cc, 'metal'); }
  g.b(-e + 0.03, e - 0.03, y0 + 0.4, y0 + 0.425, 0.024, 0.0255, 0xa9b8bf, 'metal');
  { const u = -e + w * 0.22; for (let j = 0; j < 5; j++) g.b(u + j * 0.05, u + j * 0.05 + 0.07, y0 + 0.06 + j * 0.11, y0 + 0.2 + j * 0.11, 0.0265, 0.0275, 0xf1f6f7, 'metal'); }
  g.b(-e, e, y0 - 0.1, y0 - 0.08, 0, 0.12, C.steelL, 'metal', true);
  g.b(-e + 0.08, e - 0.08, y1 + 0.1, y1 + 0.17, 0, 0.09, C.steelD, 'matte', true); g.b(-e + 0.1, e - 0.1, y1 + 0.085, y1 + 0.1, 0.01, 0.08, C.tube, 'glow', true);
});
def('towels', 0.4, 0.16, g => { g.b(-0.15, 0.15, 1.3, 1.7, 0, 0.14, C.steelL, 'metal', true); g.b(-0.1, 0.1, 1.25, 1.3, 0.03, 0.11, C.white, 'matte', true); });
def('changeTable', 1.0, 0.6, g => { g.b(-0.47, 0.47, 0.9, 1.5, 0, 0.05, C.cream, 'matte', true); g.b(-0.45, 0.45, 0.86, 0.9, 0, 0.58, C.cream, 'matte', true); g.b(-0.4, 0.4, 0.9, 0.93, 0.05, 0.54, C.blueL, 'matte', true); g.s(-0.45, 0.45, 0.82, 0.95, 0, 0.58); });
def('pan', 0.9, 0.7, g => { g.q(0, 0.42, 0.36, 0.5, 0, 0.4, C.enamel); g.q(0, 0.42, 0.38, 0.52, 0.4, 0.43, C.enamel); g.bs(-0.22, 0.22, 0, 0.8, 0, 0.17, C.enamel); g.s(-0.19, 0.19, 0, 0.43, 0.16, 0.68);
  for (const u of [-0.42, 0.42]) { g.c(u, 0.8, 0.3, 0.02, 0.6, 'd', C.steelL, 'metal', 6); g.c(u, 0.4, 0.02, 0.02, 0.8, 'y', C.steelL, 'metal', 6); } });
def('handDryer', 0.4, 0.25, g => { g.b(-0.15, 0.15, 1.05, 1.5, 0, 0.2, C.steelL, 'metal', true); g.b(-0.1, 0.1, 1.05, 1.06, 0.05, 0.2, C.black, 'matte', true); });
def('babyChange', 1.0, 0.15, g => { g.b(-0.45, 0.45, 0.9, 1.45, 0, 0.12, C.cream, 'matte', true); });
def('displayTable', 2.0, 1.2, (g, w, r) => {
  g.bs(-0.95, 0.95, 0.1, 0.8, 0.08, 1.12, pick(r, [C.woodL, C.white, C.woodD])); g.b(-1, 1, 0.8, 0.84, 0.03, 1.17, C.woodL, 'matte', true); g.b(-0.9, 0.9, 0, 0.1, 0.13, 1.07, C.black);
  for (let u = -0.85; u < 0.7; ) { const bw = 0.2 + r() * 0.2, n = 1 + Math.floor(r() * 5); for (const d of [0.32, 0.86]) if (r() < 0.9) { const c = pick(r, r() < 0.5 ? BOOKS : MERCH); r() < 0.25 ? g.c(u + bw / 2, 0.84 + 0.06, d, 0.05, 0.12, 'y', c, 'matte', 7) : g.q(u + bw / 2, d, bw, 0.3, 0.84, 0.84 + n * 0.035, c); } u += bw + 0.08; }
  g.q(0, 0.6, 0.5, 0.2, 0.84, 1.2, C.woodL); g.q(0, 0.6, 0.4, 0.21, 0.9, 1.15, pick(r, MERCH)); g.s(-1, 1, 0.8, 1.2, 0.03, 1.17);
});
def('shopShelf', 1.2, 0.4, (g, w, r, o = {}) => { const e = w / 2; g.b(-e, e, 0, 2.2, 0, 0.02, C.woodL); for (const u of [-e, e - 0.025]) g.b(u, u + 0.025, 0, 2.2, 0, 0.4, C.woodL, 'matte', true); for (let y = 0.1; y < 2.0; y += 0.4) { g.b(-e, e, y - 0.025, y, 0, 0.4, C.woodL, 'matte', true); fill(g, -e + 0.03, e - 0.03, y, 0.02, 0.38, 0.34, r, o.k || 'merch'); } g.b(-e, e, 2.17, 2.2, 0, 0.4, C.woodL, 'matte', true); g.s(-e, e, 0, 2.2, 0, 0.4); });
def('posterBin', 0.8, 0.6, (g, w, r) => { g.bs(-0.38, 0.38, 0, 0.7, 0.03, 0.57, C.woodL); for (let i = 0; i < 12; i++) g.c(-0.3 + (i % 4) * 0.2, 0.75, 0.13 + Math.floor(i / 4) * 0.17, 0.04, 0.7 + r() * 0.3, 'y', r() < 0.6 ? C.white : pick(r, MERCH), 'matte', 6); g.s(-0.38, 0.38, 0.7, 1.25, 0.03, 0.57); });
def('cardSpinner', 0.6, 0.6, (g, w, r) => { g.c(0, 0.02, 0.3, 0.25, 0.04, 'y', C.steelD, 'metal', 8); g.c(0, 0.9, 0.3, 0.02, 1.8, 'y', C.steelL, 'metal', 5); for (let y = 0.5; y < 1.7; y += 0.22) for (const [du, dd, a, b] of [[0, 0.17, 0.24, 0.01], [0, -0.17, 0.24, 0.01], [0.17, 0, 0.01, 0.24], [-0.17, 0, 0.01, 0.24]]) g.q(du, 0.3 + dd, a, b, y, y + 0.18, pick(r, MERCH)); g.s(-0.18, 0.18, 0, 1.8, 0.12, 0.48); });

// ---- on the walls of a service corridor ----
def('extinguisher', 0.4, 0.2, g => { g.c(0, 0.75, 0.1, 0.07, 0.5, 'y', C.red, 'metal', 8); g.c(0, 1.03, 0.1, 0.025, 0.08, 'y', C.black, 'matte', 6); g.b(-0.12, 0.12, 1.5, 1.72, 0, 0.012, C.red); g.b(-0.06, 0.06, 1.55, 1.67, 0.012, 0.014, C.white); g.s(-0.07, 0.07, 0.5, 1.07, 0.02, 0.18); });
def('hoseReel', 0.8, 0.26, g => { g.c(0, 1.3, 0.13, 0.32, 0.18, 'd', C.red, 'metal', 14); g.c(0, 1.3, 0.24, 0.08, 0.04, 'd', C.steelD, 'metal', 8); g.s(-0.32, 0.32, 0.98, 1.62, 0, 0.22); });
def('panel', 0.8, 0.2, (g, w, r) => { g.b(-0.35, 0.35, 0.9, 1.9, 0, 0.16, C.greyL, 'metal', true); g.b(0.24, 0.27, 1.3, 1.5, 0.16, 0.18, C.steelD); g.b(-0.2, -0.05, 1.7, 1.78, 0.16, 0.163, C.yellow); g.c(0, (1.9 + g.H) / 2, 0.08, 0.03, g.H - 1.9, 'y', C.galv, 'metal', 5); for (let k = 0; k < 2; k++) g.b(-0.25 + k * 0.08, -0.21 + k * 0.08, 1.55, 1.59, 0.16, 0.164, r() < 0.7 ? C.led : C.ledR, 'glow'); g.s(-0.35, 0.35, 0.9, 1.9, 0, 0.16); });
def('bumper', 3.0, 0.08, g => { g.b(-1.5, 1.5, 0.28, 0.42, 0, 0.05, C.woodL, 'matte', true); g.b(-1.5, 1.5, 0.85, 0.99, 0, 0.05, C.woodL, 'matte', true); });

// --------------------------------------------------------------- the room --

const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
function dice(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const LIT = (on, col) => (on ? [col, 'glow'] : [0x8a8e92, 'matte']);
const AISLE = 0.7, DOOR_DEEP = 1.6, CELL = 32;
const lin = new Map();
function colour(hex) {
  let c = lin.get(hex);
  if (!c) { c = [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map(v => { const s = v / 255; return Math.max(1, Math.round(255 * (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4))); }); lin.set(hex, c); }
  return c;
}

// One batch of triangles: what becomes one mesh.
class Batch {
  constructor(mat, floor) { this.mat = mat; this.floor = floor; this.p = []; this.n = []; this.c = []; this.i = []; this.x0 = this.y0 = this.z0 = Infinity; this.x1 = this.y1 = this.z1 = -Infinity; this.boxes = 0; }
  grow(x0, x1, y0, y1, z0, z1) { if (x0 < this.x0) this.x0 = x0; if (x1 > this.x1) this.x1 = x1; if (y0 < this.y0) this.y0 = y0; if (y1 > this.y1) this.y1 = y1; if (z0 < this.z0) this.z0 = z0; if (z1 > this.z1) this.z1 = z1; }
  quad(ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, nx, ny, nz, col) {
    const k = this.p.length / 3;
    this.p.push(ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz);
    nx *= 127; ny *= 127; nz *= 127; this.n.push(nx, ny, nz, nx, ny, nz, nx, ny, nz, nx, ny, nz);
    this.c.push(col[0], col[1], col[2], col[0], col[1], col[2], col[0], col[1], col[2], col[0], col[1], col[2]);
    this.i.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  // A box. Something under 12 mm thick (a drawer line, a label, a wire of a mesh) is drawn as its two faces only.
  box(x0, x1, y0, y1, z0, z1, hex, under) {
    if (!(x1 > x0 && y1 > y0 && z1 > z0)) return;
    const c = colour(hex), T = 0.0125, fx = x1 - x0 < T, fz = !fx && z1 - z0 < T, fy = !fx && !fz && y1 - y0 < T;
    if (!fx && !fy) { this.quad(x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1, 0, 0, 1, c); this.quad(x1, y0, z0, x0, y0, z0, x0, y1, z0, x1, y1, z0, 0, 0, -1, c); }
    if (!fz && !fy) { this.quad(x1, y0, z1, x1, y0, z0, x1, y1, z0, x1, y1, z1, 1, 0, 0, c); this.quad(x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y1, z0, -1, 0, 0, c); }
    if (!fx && !fz) { this.quad(x0, y1, z1, x1, y1, z1, x1, y1, z0, x0, y1, z0, 0, 1, 0, c); if (under) this.quad(x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1, 0, -1, 0, c); }
    this.grow(x0, x1, y0, y1, z0, z1); this.boxes++;
  }
  // A cushion: a box whose top edges are chamfered by `r` (a hipped top), so a seat or a squab reads as upholstered
  // and not as a block. Its underside is never seen.
  cush(x0, x1, y0, y1, z0, z1, r, hex) {
    r = Math.min(r, (x1 - x0) / 2 - 1e-3, (z1 - z0) / 2 - 1e-3, y1 - y0 - 1e-3); if (!(r > 0)) return this.box(x0, x1, y0, y1, z0, z1, hex, false);
    const c = colour(hex), ym = y1 - r, a = Math.SQRT1_2;
    this.quad(x0, y0, z1, x1, y0, z1, x1, ym, z1, x0, ym, z1, 0, 0, 1, c); this.quad(x1, y0, z0, x0, y0, z0, x0, ym, z0, x1, ym, z0, 0, 0, -1, c);
    this.quad(x1, y0, z1, x1, y0, z0, x1, ym, z0, x1, ym, z1, 1, 0, 0, c); this.quad(x0, y0, z0, x0, y0, z1, x0, ym, z1, x0, ym, z0, -1, 0, 0, c);
    this.quad(x0, ym, z1, x1, ym, z1, x1 - r, y1, z1 - r, x0 + r, y1, z1 - r, 0, a, a, c); this.quad(x1, ym, z0, x0, ym, z0, x0 + r, y1, z0 + r, x1 - r, y1, z0 + r, 0, a, -a, c);
    this.quad(x1, ym, z1, x1, ym, z0, x1 - r, y1, z0 + r, x1 - r, y1, z1 - r, a, a, 0, c); this.quad(x0, ym, z0, x0, ym, z1, x0 + r, y1, z1 - r, x0 + r, y1, z0 + r, -a, a, 0, c);
    this.quad(x0 + r, y1, z1 - r, x1 - r, y1, z1 - r, x1 - r, y1, z0 + r, x0 + r, y1, z0 + r, 0, 1, 0, c);
    this.grow(x0, x1, y0, y1, z0, z1); this.boxes++;
  }
  // A cylinder of `seg` flat-shaded-smooth sides along world axis 0 (x), 1 (y) or 2 (z), centred on (cx, cy, cz).
  cyl(cx, cy, cz, rad, len, axis, hex, seg) {
    if (!(rad > 0 && len > 0)) return;
    const c = colour(hex), h = len / 2, k0 = this.p.length / 3, P = this.p, N = this.n, Cc = this.c;
    const put = (a, e1, e2, n1, n2, na) => {            // a along the axis, e1/e2 across it
      n1 = Math.round(n1 * 127); n2 = Math.round(n2 * 127); na *= 127;
      if (axis === 1) { P.push(cx + e1, cy + a, cz + e2); N.push(n1, na, n2); } else if (axis === 0) { P.push(cx + a, cy + e1, cz + e2); N.push(na, n1, n2); } else { P.push(cx + e2, cy + e1, cz + a); N.push(n2, n1, na); }
      Cc.push(c[0], c[1], c[2]);
    };
    for (let s = 0; s < seg; s++) { const t = (s / seg) * Math.PI * 2, co = Math.cos(t), si = Math.sin(t); put(-h, co * rad, si * rad, co, si, 0); put(h, co * rad, si * rad, co, si, 0); }
    const flip = axis !== 0;                             // keeps the outside facing out whichever way the axis runs
    for (let s = 0; s < seg; s++) { const a = k0 + s * 2, b = k0 + ((s + 1) % seg) * 2; flip ? this.i.push(a, a + 1, b + 1, a, b + 1, b) : this.i.push(a, b + 1, a + 1, a, b, b + 1); }
    for (const e of axis === 1 ? [1] : [-1, 1]) {            // nobody sees the underside of an upright one
      const k = this.p.length / 3;
      for (let s = 0; s < seg; s++) { const t = (s / seg) * Math.PI * 2; put(e * h, Math.cos(t) * rad, Math.sin(t) * rad, 0, 0, e); }
      for (let s = 1; s < seg - 1; s++) (e > 0) !== flip ? this.i.push(k, k + s, k + s + 1) : this.i.push(k, k + s + 1, k + s);
    }
    const ex = axis === 0 ? h : rad, ey = axis === 1 ? h : rad, ez = axis === 2 ? h : rad;
    this.grow(cx - ex, cx + ex, cy - ey, cy + ey, cz - ez, cz + ez); this.boxes++;
  }
}

// What an item draws with: its own frame, set down in the world.
class Pen {
  constructor(R, ox, oz, fx, fz, d) { this.R = R; this.ox = ox; this.oz = oz; this.fx = fx; this.fz = fz; this.y = R.y; this.H = R.H; this.d = d; }
  X(u, d) { return this.ox + u * this.fz + d * this.fx; }
  Z(u, d) { return this.oz - u * this.fx + d * this.fz; }
  // Leave a note of a spot in the world for whoever dresses it further (writing on a whiteboard, glass
  // round a jar): the kind of thing, where (u across, d out, y up, in the item's frame) and anything else worth saying.
  // Something that is not fixed down (src/loose.js): where it stands and which way it faces (dir: +1 out along d, -1 back).
  loose(type, u, d, dir, col) { this.R.out.marks.push({ kind: 'loose', room: this.R.room.id, type, x: this.X(u, d), y: this.y, z: this.Z(u, d), yaw: Math.atan2(this.fx * dir, this.fz * dir), col }); }
  mark(kind, u, d, y, more) { this.R.out.marks.push({ kind, room: this.R.room.id, x: this.X(u, d), y: this.y + y, z: this.Z(u, d), fx: this.fx, fz: this.fz, ...more }); }
  b(u0, u1, y0, y1, d0, d1, hex, mat = 'matte', under = false) {
    const H = this.H - 0.01; if (y1 > H) y1 = H; if (y0 < 0) y0 = 0; if (y1 <= y0) return;
    const xa = this.X(u0, d0), xb = this.X(u1, d1), za = this.Z(u0, d0), zb = this.Z(u1, d1);
    this.R.batch(mat).box(Math.min(xa, xb), Math.max(xa, xb), this.y + y0, this.y + y1, Math.min(za, zb), Math.max(za, zb), hex, under === true);
  }
  cu(u0, u1, y0, y1, d0, d1, r, hex, mat = 'matte') {
    const H = this.H - 0.01; if (y1 > H) y1 = H; if (y1 <= y0) return;
    const xa = this.X(u0, d0), xb = this.X(u1, d1), za = this.Z(u0, d0), zb = this.Z(u1, d1);
    this.R.batch(mat).cush(Math.min(xa, xb), Math.max(xa, xb), this.y + y0, this.y + y1, Math.min(za, zb), Math.max(za, zb), r, hex);
  }
  q(u, d, w, dp, y0, y1, hex, mat, under) { this.b(u - w / 2, u + w / 2, y0, y1, d - dp / 2, d + dp / 2, hex, mat, under); }
  s(u0, u1, y0, y1, d0, d1) {
    const xa = this.X(u0, d0), xb = this.X(u1, d1), za = this.Z(u0, d0), zb = this.Z(u1, d1);
    this.R.solid(Math.min(xa, xb), Math.max(xa, xb), Math.max(0, y0), Math.min(y1, this.H), Math.min(za, zb), Math.max(za, zb));
  }
  bs(u0, u1, y0, y1, d0, d1, hex, mat, under) { this.b(u0, u1, y0, y1, d0, d1, hex, mat, under); this.s(u0, u1, y0, y1, d0, d1); }
  qs(u, d, w, dp, y0, y1, hex, mat) { this.bs(u - w / 2, u + w / 2, y0, y1, d - dp / 2, d + dp / 2, hex, mat); }
  c(u, y, d, rad, len, axis, hex, mat = 'matte', seg) {
    if (axis === 'y') { const top = Math.min(this.H - 0.01, y + len / 2), bot = Math.max(0, y - len / 2); if (top <= bot) return; y = (top + bot) / 2; len = top - bot; }
    else if (y + rad > this.H - 0.01) return;
    const ax = axis === 'y' ? 1 : (axis === 'u') === (this.fz !== 0) ? 0 : 2;
    this.R.batch(mat).cyl(this.X(u, d), this.y + y, this.Z(u, d), rad, len, ax, hex, seg || (rad > 0.3 ? 12 : rad > 0.09 ? 8 : 6));
  }
}

const FACES = { 'a+': [1, 0], 'a-': [-1, 0], 'b+': [0, 1], 'b-': [0, -1] };

class Room {
  constructor(plan, room, out, o = {}) {
    this.plan = plan; this.room = room; this.out = out; this.name = String(room.gallery || '');
    this.longX = room.x1 - room.x0 >= room.z1 - room.z0;
    this.L = this.longX ? room.x1 - room.x0 : room.z1 - room.z0; this.W = this.longX ? room.z1 - room.z0 : room.x1 - room.x0;
    this.y = room.y; this.H = (room.ceil != null ? room.ceil : room.h - 0.15); this.rnd = dice(hash(room.id));
    this.aisle = o.aisle || AISLE; this.clear = []; this.taken = []; this.placed = 0; this.ends = [0, 0]; this.doorsAt = [];
    this.key = room.floor + '|' + Math.floor((room.x0 + room.x1) / 2 / CELL) + '|' + Math.floor((room.z0 + room.z1) / 2 / CELL);
    this._mark(o);
  }
  // Local (a along the room, b across it) to world.
  xz(a, b) { const r = this.room; return this.longX ? [r.x0 + a, r.z0 + b] : [r.x0 + b, r.z0 + a]; }
  ab(x, z) { const r = this.room; return this.longX ? [x - r.x0, z - r.z0] : [z - r.z0, x - r.x0]; }
  rect(a0, a1, b0, b1) { const [x0, z0] = this.xz(a0, b0), [x1, z1] = this.xz(a1, b1); return { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) }; }
  dir(f) { return this.longX ? [f[0], f[1]] : [f[1], f[0]]; }

  // What must stay clear: doorways, the aisle, the ways to it, and everything that joins the levels.
  _mark(o) {
    const { plan, room: r, L, W } = this, A = this.aisle, entries = [];
    for (const d of plan.doorsOf(r.id)) {
      if (Math.abs(d.y - r.y) > 0.3) continue;                    // a doorway a storey up the wall opens onto a deck, not this floor
      let zone, e;
      if (d.along === 'x') { const west = (d.x0 + d.x1) / 2 < (r.x0 + r.x1) / 2, x = west ? r.x0 : r.x1, s = west ? 1 : -1; zone = { x0: Math.min(x, x + s * DOOR_DEEP), x1: Math.max(x, x + s * DOOR_DEEP), z0: d.z0 - 0.25, z1: d.z1 + 0.25 }; e = [x + s * 0.9, (d.z0 + d.z1) / 2]; }
      else { const north = (d.z0 + d.z1) / 2 < (r.z0 + r.z1) / 2, z = north ? r.z0 : r.z1, s = north ? 1 : -1; zone = { z0: Math.min(z, z + s * DOOR_DEEP), z1: Math.max(z, z + s * DOOR_DEEP), x0: d.x0 - 0.25, x1: d.x1 + 0.25 }; e = [(d.x0 + d.x1) / 2, z + s * 0.9]; }
      this.clear.push(zone);
      const [ea, eb] = this.ab(e[0], e[1]); entries.push([ea, eb]); this.doorsAt.push([ea, eb]);
      if (ea < 2) this.ends[0]++; if (ea > L - 2) this.ends[1]++;
    }
    // Stairs, ramps, decks, lifts, wells; and whatever else already stands in the room.
    const y0 = r.y - 0.3, y1 = r.y + r.h, lap = (q, m) => q.x0 - m < r.x1 && q.x1 + m > r.x0 && q.z0 - m < r.z1 && q.z1 + m > r.z0;
    const keep = (q, m, way) => { this.clear.push({ x0: q.x0 - m, x1: q.x1 + m, z0: q.z0 - m, z1: q.z1 + m }); (this.kept || (this.kept = [])).push({ x0: q.x0 - m, x1: q.x1 + m, z0: q.z0 - m, z1: q.z1 + m }); if (way) { const [ea, eb] = this.ab(Math.max(r.x0 + 0.75, Math.min(r.x1 - 0.75, (q.x0 + q.x1) / 2)), Math.max(r.z0 + 0.75, Math.min(r.z1 - 0.75, (q.z0 + q.z1) / 2))); entries.push([ea, eb]); } };
    for (const s of plan.surfaces || []) {
      if (s.hill || !lap(s, 1.5)) continue;
      { const o = s.deck || s.ramp, of = o && plan.byId[o.room]; if (of && of.secret && of !== r) continue; }      // a stair nobody knows is there, the other side of the wall, moves nobody's furniture
      const lo = s.lift ? s.lift.stops[0] : Math.min(s.h0, s.h1) - (s.thick || 0), hi = s.lift ? s.lift.stops[s.lift.stops.length - 1] : Math.max(s.h0, s.h1);
      if (hi < y0 || lo > y1) continue;
      keep(s, s.deck ? 0.3 : s.fixed ? 1.5 : 0.6, !!(s.ramp || s.lift || s.vent));      // (s.vent: the foot of the staff vent, src/ventplan.js: a way in like any other)
    }
    for (const w of plan.wells || []) if (lap(w, 1.2) && w.y > y0 && w.y < y1 + 0.8) keep(w, 1.2, true);
    for (const ob of plan.obstacles) if (!ob.fit && lap(ob, 0.4) && ob.y1 > y0 && ob.y0 < y1) keep(ob, 0.4, false);
    for (const n of plan.nests || []) if (n.room === r.id) keep(n.keep, 0.2, true);       // a mouse's grille low on the wall (plan.js addNests): the floor before it stays clear
    // The aisle: down the middle, or (in a room with something big in the middle of it) along the
    // wall most of its doors are in. It runs the length of the room, less whatever a recipe keeps
    // back at the quiet end for a stage or a counter. Then a leg to it from each way in.
    let mid = W / 2;
    if (o.side) { const near = entries.filter(e => e[1] < W / 2).length, far = entries.length - near; mid = far > near ? W - A - 0.05 : A + 0.05; }
    this.mid = mid;
    const as = entries.map(e => e[0]), q = this.quietEnd(), kb = o.keepEnd || 0;
    this.spine = [Math.min(0.7 + (q === 0 ? kb : 0), ...as), Math.max(L - 0.7 - (q === 1 ? kb : 0), ...as)];
    if (this.spine[1] > this.spine[0]) this.clear.push(this.rect(this.spine[0] - A, this.spine[1] + A, mid - A, mid + A));
    for (const [ea, eb] of entries) this.clear.push(this.rect(ea - A, ea + A, Math.min(eb, mid) - A, Math.max(eb, mid) + A));
    this.entries = entries;
  }
  free(q, gap = 0.04) {
    const r = this.room, e = 1e-6;
    if (q.x0 < r.x0 - e || q.x1 > r.x1 + e || q.z0 < r.z0 - e || q.z1 > r.z1 + e) return false;
    for (const c of this.clear) if (q.x0 < c.x1 && q.x1 > c.x0 && q.z0 < c.z1 && q.z1 > c.z0) return false;
    for (const c of this.taken) if (q.x0 < c.x1 + gap && q.x1 > c.x0 - gap && q.z0 < c.z1 + gap && q.z1 > c.z0 - gap) return false;
    return true;
  }
  batch(mat) { const k = mat + '|' + this.key; return this.out.batches[k] || (this.out.batches[k] = new Batch(mat, this.room.floor)); }
  solid(x0, x1, y0, y1, z0, z1) { if (x1 - x0 > 0.005 && z1 - z0 > 0.005 && y1 > y0) this.out.solids.push({ x0, x1, z0, z1, y0: this.y + y0, y1: this.y + y1, fit: true }); }

  // Set an item down with its back at (a, b), facing `face`. False if there is no room for it there.
  put(spec, a, b, face, gap, extra) {
    const [name, w0, o] = typeof spec === 'string' ? [spec] : spec, it = ITEMS[name], f = typeof face === 'string' ? FACES[face] : face;
    if (!it) throw new Error('furnish: no item called ' + name);
    const w = w0 || it.w, d = it.d, [fx, fz] = this.dir(f), [ox, oz] = this.xz(a, b);
    const ux = fz, uz = -fx, xs = [ox - ux * w / 2, ox + ux * w / 2, ox - ux * w / 2 + fx * d, ox + ux * w / 2 + fx * d], zs = [oz - uz * w / 2, oz + uz * w / 2, oz - uz * w / 2 + fz * d, oz + uz * w / 2 + fz * d];
    const q = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
    if (!this.free(q, gap)) return false;
    this.taken.push(q); this.placed++; this.last = { ...q, fx, fz, y: this.room.y };      // (what was set down last, and which way it faces)
    it.draw(new Pen(this, ox, oz, fx, fz, d), w, this.rnd, extra ? { ...(o || {}), ...extra } : o);
    return true;
  }
  // Set it down by its middle whether or not the floor there was being kept clear (for the one thing a room is built round).
  // `keep`: how far from its middle nothing else may stand.
  force(spec, a, b, face, keep = 0, extra) {
    const [name, w0, o] = typeof spec === 'string' ? [spec] : spec, it = ITEMS[name], f = typeof face === 'string' ? FACES[face] : face, w = w0 || it.w;
    const [fx, fz] = this.dir(f), [ox, oz] = this.xz(a - f[0] * it.d / 2, b - f[1] * it.d / 2), m = Math.max(keep, Math.max(w, it.d) / 2), [cx, cz] = this.xz(a, b);
    this.taken.push({ x0: cx - m, x1: cx + m, z0: cz - m, z1: cz + m }); this.placed++;
    it.draw(new Pen(this, ox, oz, fx, fz, it.d), w, this.rnd, extra ? { ...(o || {}), ...extra } : o);
  }
  // The same, by its middle.
  putC(spec, a, b, face, gap, extra) { const it = ITEMS[typeof spec === 'string' ? spec : spec[0]], f = typeof face === 'string' ? FACES[face] : face; return this.put(spec, a - f[0] * it.d / 2, b - f[1] * it.d / 2, f, gap, extra); }

  // Which end of the room has no door in it (1 = the far end, 0 = the near): where the screen goes, or the big desk.
  quietEnd() { return this.ends[1] < this.ends[0] ? 1 : this.ends[0] < this.ends[1] ? 0 : hash(this.room.id) & 1; }

  walls(list, o = {}) {
    const { L, W } = this, sel = o.walls || 'all', gap = o.gap == null ? 0.1 : o.gap, rnd = this.rnd;
    const OFF = 0.02, all = [['side0', L, t => [t, OFF], 'b+'], ['side1', L, t => [t, W - OFF], 'b-'], ['end0', W, t => [OFF, t], 'a+'], ['end1', W, t => [L - OFF, t], 'a-']];      // (two centimetres off the wall: set flush, a back lay in the plane of the skirting's)
    const use = all.filter(w => sel === 'all' || sel === w[0] || (sel === 'long' && w[0][0] === 's') || (sel === 'short' && w[0][0] === 'e'));
    const width = spec => (typeof spec === 'string' ? 0 : spec[1]) || ITEMS[typeof spec === 'string' ? spec : spec[0]].w;
    const pending = list.slice();
    let k = Math.floor(rnd() * list.length), n = 0;
    for (const [, len, at, face] of use) {
      let t = 0.06 + (o.jitter ? rnd() * o.jitter : 0);
      while (t < len - 0.2 && pending.length) {
        if (o.skip && rnd() < o.skip) { t += 0.8 + rnd() * 1.6; continue; }
        // The next thing on the list that fits here; if nothing does, move along a little.
        let done = false;
        for (let j = 0; j < (o.once ? pending.length : list.length) && !done; j++) {
          const spec = o.once ? pending[j] : list[(k + j) % list.length], w = width(spec);
          if (t + w > len - 0.05) continue;
          const [a, b] = at(t + w / 2);
          if (!this.put(spec, a, b, face)) continue;
          if (o.once) pending.splice(j, 1); else k += j + 1;
          t += w + gap + (o.jitter ? rnd() * o.jitter : 0); n++; done = true;
        }
        if (!done) t += 0.3;
      }
    }
    return n;
  }
  // Rows either side of the aisle. `da` apart along the room, `db` apart across it, counted out from the aisle.
  // ma0 / ma1: how far to keep back from each end. fit: stretch the item to fill its place in the row.
  grid(spec, o = {}) {
    const { L, W } = this, name = typeof spec === 'string' ? spec : spec[0], it = ITEMS[name], rnd = this.rnd, mid = this.mid;
    const ma = o.ma == null ? 0.5 : o.ma, ma0 = o.ma0 == null ? ma : o.ma0, ma1 = o.ma1 == null ? ma : o.ma1, mb = o.mb == null ? 0.3 : o.mb, off = this.aisle + 0.06;
    const na = Math.floor((L - ma0 - ma1) / o.da); if (na < 1) return 0;
    const a0 = ma0 + (L - ma0 - ma1 - na * o.da) / 2;
    let n = 0;
    for (const side of o.centre ? [0] : [-1, 1]) {
      if (o.side != null && (side < 0 ? 0 : 1) !== o.side) continue;
      const room = o.centre ? 0 : (side < 0 ? mid : W - mid) - off - mb;
      let nb = o.centre ? 1 : Math.floor(room / o.db + 1e-6), db = o.db;
      if (nb < 1) continue;
      if (o.fit) db = room / nb;
      if (o.rows) nb = Math.min(nb, o.rows);
      for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) {
        if (o.max && n >= o.max) return n;
        if (o.skip && rnd() < o.skip) continue;
        const a = a0 + (i + 0.5) * o.da, b = o.centre ? W / 2 : mid + side * (off + (j + 0.5) * db);
        let face = o.face || 'a+';
        if (face === 'in') face = side < 0 ? 'b+' : 'b-'; else if (face === 'out') face = side < 0 ? 'b-' : 'b+';
        if (o.turn) face = rnd() < 0.5 ? 'b+' : 'b-';
        const w = o.fit ? (face[0] === 'a' ? db : o.da) : (typeof spec === 'string' ? 0 : spec[1]) || it.w;
        if (this.putC([name, w, typeof spec === 'string' ? undefined : spec[2]], a, b, face, 0.04, o.extra)) n++;
      }
    }
    return n;
  }
  scatter(list, n, o = {}) {
    const { L, W } = this, rnd = this.rnd; let done = 0;
    for (let i = 0; i < n; i++) {
      const spec = list[i % list.length], it = ITEMS[typeof spec === 'string' ? spec : spec[0]];
      for (let t = 0; t < 14; t++) {
        const face = ['a+', 'a-', 'b+', 'b-'][Math.floor(rnd() * 4)], m = Math.max(it.w, it.d) / 2 + 0.25;
        if (L < 2 * m || W < 2 * m) break;
        if (this.putC(spec, m + rnd() * (L - 2 * m), m + rnd() * (W - 2 * m), face, o.gap == null ? 0.35 : o.gap)) { done++; break; }
      }
    }
    return done;
  }
  // One thing in the middle of an end wall (which: 0 or 1), `out` metres from it; `turned` to face the wall.
  end(spec, which, out = 0, turned = false) {
    const name = typeof spec === 'string' ? spec : spec[0], it = ITEMS[name], { L, W } = this;
    const w = Math.min((typeof spec === 'string' ? 0 : spec[1]) || it.w, W - 0.4), s2 = [name, w, typeof spec === 'string' ? undefined : spec[2]];
    const off = turned ? out + it.d : out, face = (which === 1) !== turned ? 'a-' : 'a+';
    for (const db of [0, -0.8, 0.8, -1.6, 1.6, -2.6, 2.6]) if (this.put(s2, which ? L - off : off, W / 2 + db, face, 0.04)) return true;
    return false;
  }
  // Margins for a grid that keeps `big` metres back from the quiet end and `small` from the other.
  back(big, small = 0.6) { return this.quietEnd() ? { ma0: small, ma1: big } : { ma0: big, ma1: small }; }
  rug(fa, fb, la, lb) {
    const { L, W } = this, a = L * fa, b = W * fb; la = Math.min(la, L - 1); lb = Math.min(lb, W - 1);
    const q = this.rect(Math.max(0.4, a - la / 2), Math.min(L - 0.4, a + la / 2), Math.max(0.4, b - lb / 2), Math.min(W - 0.4, b + lb / 2)), m = this.batch('matte'), c = pick(this.rnd, [0x5a1c1c, 0x1c2c4a, 0x4a3c22, 0x2c3c2c]);
    for (const w of this.plan.wells || []) if (Math.abs(w.y - this.y) < 0.1 && q.x0 < w.x1 && q.x1 > w.x0 && q.z0 < w.z1 && q.z1 > w.z0) return;
    m.box(q.x0, q.x1, this.y, this.y + 0.012, q.z0, q.z1, c, false); m.box(q.x0 + 0.2, q.x1 - 0.2, this.y + 0.012, this.y + 0.014, q.z0 + 0.2, q.z1 - 0.2, 0xa8946a, false);
  }
  // A box or a pipe in the room's own frame, for what hangs from the ceiling. No footprint, nothing solid.
  box(a0, a1, y0, y1, b0, b1, hex, mat = 'matte') { const q = this.rect(a0, a1, b0, b1); this.batch(mat).box(q.x0, q.x1, this.y + y0, this.y + Math.min(y1, this.H - 0.005), q.z0, q.z1, hex, true); }
  pipe(a0, a1, y, b, rad, hex, mat = 'metal') { const [x, z] = this.xz((a0 + a1) / 2, b); if (y + rad < this.H) this.batch(mat).cyl(x, this.y + y, z, rad, a1 - a0, this.longX ? 0 : 2, hex, 8); }
  services(...kinds) {
    const { L, W, H } = this, rnd = this.rnd; if (L < 2.5 || H < 2.9) return;
    const lanes = W > 9 ? [0.25, 0.75] : [0.5], a0 = 0.15, a1 = L - 0.15;
    let side = rnd() < 0.5 ? 0.12 : 0.88;
    const flip = () => { side = 1 - side; return side; };
    for (const k of kinds) {
      if (k === 'lights' || k === 'coldlights' || k === 'striplights') {            // strip lights: every third one left on
        const on = k === 'coldlights' ? 1 : k === 'striplights' ? 0.4 : 0.22, col = k === 'coldlights' ? 0xa8c8ff : C.tube;
        for (const f of lanes) for (let a = 1.2; a < L - 1.0; a += 3.6) { const b = W * f; this.box(a - 0.62, a + 0.62, H - 0.1, H - 0.02, b - 0.08, b + 0.08, C.enamel); this.box(a - 0.58, a + 0.58, H - 0.115, H - 0.1, b - 0.05, b + 0.05, ...LIT(rnd() < on, col)); }
      } else if (k === 'track') {
        for (const f of [0.3, 0.7]) { this.box(a0 + 0.5, a1 - 0.5, H - 0.06, H - 0.02, W * f - 0.02, W * f + 0.02, C.black, 'metal'); for (let a = 1.5; a < L - 1.5; a += 2.2 + rnd() * 1.5) { const [x, z] = this.xz(a, W * f); this.batch('metal').cyl(x, this.y + H - 0.2, z, 0.06, 0.22, 1, C.black, 8); } }
      } else if (k === 'pipes' || k === 'pipes2' || k === 'redpipes') {
        const b = W * (k === 'pipes2' ? flip() : side) + (W < 3 ? 0 : 0), cols = k === 'redpipes' ? [C.red, C.red, C.red] : [C.lagging, C.copper, C.red, C.galv, C.blueL, C.green];
        let o = -0.3; for (let i = 0; i < (W < 3 ? 3 : 4); i++) { const rad = 0.035 + rnd() * 0.07; this.pipe(a0, a1, H - 0.14 - rad, b + o + rad, rad, pick(rnd, cols)); o += rad * 2 + 0.04; }
        for (let a = 1; a < L; a += 2.8) this.box(a - 0.02, a + 0.02, H - 0.4, H - 0.02, b - 0.34, b + 0.34, C.steelD, 'metal');
      } else if (k === 'duct') {
        const b = W * flip(), w = Math.min(0.9, W * 0.16), h = 0.4;
        this.box(a0, a1, H - 0.08 - h, H - 0.08, b - w / 2, b + w / 2, C.galv, 'metal'); for (let a = 1.5; a < L; a += 1.5) this.box(a - 0.03, a + 0.03, H - 0.1 - h, H - 0.06, b - w / 2 - 0.02, b + w / 2 + 0.02, C.steel, 'metal');
        for (let a = 2.5; a < L - 1; a += 5) this.box(a - 0.25, a + 0.25, H - 0.12 - h, H - 0.08 - h, b - 0.25, b + 0.25, C.enamel);
      } else if (k === 'tray' || k === 'tray2') {
        const b = W * flip(), w = 0.3;
        for (const e of [-1, 1]) this.box(a0, a1, H - 0.34, H - 0.26, b + e * w / 2 - 0.012, b + e * w / 2 + 0.012, C.galv, 'metal');
        for (let a = 0.4; a < L; a += 1.2) this.box(a - 0.012, a + 0.012, H - 0.34, H - 0.325, b - w / 2, b + w / 2, C.galv, 'metal');
        for (let i = 0; i < 4; i++) this.pipe(a0, a1, H - 0.305, b - 0.1 + i * 0.065, 0.016 + rnd() * 0.012, pick(rnd, [C.black, C.black, C.blue, C.orange, C.grey]), 'matte');
        for (let a = 1.2; a < L; a += 2.4) this.box(a - 0.01, a + 0.01, H - 0.34, H - 0.02, b - 0.01, b + 0.01, C.steelD, 'metal');
      } else if (k === 'extract') {                               // the flexible trunks a conservator pulls down over the work
        for (let a = 2.2; a < L - 1.5; a += 3.4) for (const f of [0.3, 0.7]) { if (rnd() < 0.3) continue; const [x, z] = this.xz(a, W * f), low = 2.1 + rnd() * 0.3; this.batch('metal').cyl(x, this.y + (H + low) / 2, z, 0.08, H - low, 1, C.galv, 8); this.batch('metal').cyl(x, this.y + low - 0.06, z, 0.2, 0.12, 1, C.steelL, 10); }
      }
    }
  }
  // Rows of seats, raked, facing a low stage at the quiet end (or, on a balcony, a rail).
  auditorium(stage) {
    const { L, W, H } = this, e = this.quietEnd(), face = e ? 'a+' : 'a-', A = this.aisle + 0.05;
    const front = stage ? 4.4 : 1.2, back = 1.9, pitch = 0.98, n = Math.floor((L - front - back) / pitch);
    if (stage) this.end(['stageDais', Math.min(W - 1.2, 9)], e, 0); else for (const s of [-1, 1]) { const w = W / 2 - A - 0.2; if (w > 1) this.put(['balconyRail', w], e ? L - 0.5 : 0.5, W / 2 + s * (A + w / 2), e ? 'a-' : 'a+'); }
    const sideAisle = W > 11 ? 1.35 : 0.12, w = W / 2 - A - sideAisle;
    if (w < 1 || n < 1) return;
    for (let i = 0; i < n; i++) {
      const rise = Math.min(i * 0.11, Math.max(0, H - 2.6)), a = e ? L - front - (i + 0.5) * pitch : front + (i + 0.5) * pitch;
      for (const s of [-1, 1]) this.putC(['seatRow', w, { rise }], a, W / 2 + s * (A + w / 2), face, 0.0);
    }
    this.walls(['extinguisher', 'pictureWall'], { walls: e ? 'end0' : 'end1', gap: 1.5, once: true });
  }
}

// ------------------------------------------------- the extras: arcades, heist --
//
// Two things stand in a few back rooms that are not furniture so much as something to do: an old
// monitor on a low trolley with a game on it (src/arcade.js lights the screen), and, in each
// security control room, a console with a big red button (src/heist.js). Each is set down before
// the room's own recipe runs, against a long wall, and keeps the floor clear from itself to the
// aisle, so a toy can always pull up in front of it.
//
// One game to a monitor: the rooms, in the order of the games in src/arcade.js. To move one, rename it here.
export const ARCADE_ROOMS = [
  'Conservation science laboratory', 'Microscopy', 'Conservation science laboratory 2', 'X-ray room 2', 'Information technology',
  'Server room', 'Dye laboratory', 'Photograph conservation', 'Projection booth 3', 'Curators, American art',
];
const EXTRA_W = 1.2;
const EXTRAS = {
  arcade(g) {                                             // a low AV trolley; the monitor itself is drawn by src/arcade.js
    g.b(-0.36, 0.36, 0.27, 0.3, 0.1, 0.62, C.black, 'matte', true); g.b(-0.36, 0.36, 0.08, 0.1, 0.1, 0.62, C.black, 'matte', true);
    for (const u of [-0.34, 0.34]) for (const d of [0.12, 0.6]) { g.b(u - 0.015, u + 0.015, 0.06, 0.3, d - 0.015, d + 0.015, C.steelD, 'matte'); g.c(u, 0.035, d, 0.035, 0.03, 'u', C.rubber, 'matte', 6); }
    g.q(0.12, 0.36, 0.3, 0.2, 0.1, 0.16, C.grey); g.q(-0.2, 0.36, 0.12, 0.16, 0.1, 0.2, C.black);                 // an old computer and a box of leads on the shelf
    g.q(0, 0.88, 0.34, 0.12, 0, 0.018, C.steelD); g.q(0.3, 0.86, 0.1, 0.1, 0, 0.03, C.redD);                      // the keyboard and a joystick, on the floor in front
    g.s(-0.37, 0.37, 0, 0.74, 0.08, 0.64);
  },
  heist(g) {                                              // a plinth with a slanted top, hazard stripes and the button
    g.bs(-0.3, 0.3, 0, 0.34, 0.08, 0.5, C.steelD, 'metal');
    g.b(-0.3, 0.3, 0.34, 0.37, 0.08, 0.5, C.black, 'matte', true);
    for (let k = 0; k < 6; k++) g.b(-0.3 + k * 0.1, -0.25 + k * 0.1, 0.345, 0.365, 0.5, 0.503, C.yellow);
    g.c(0, 0.385, 0.29, 0.13, 0.03, 'y', C.steelL, 'metal', 12);
    g.b(-0.3, 0.3, 0.04, 0.3, 0.5, 0.503, C.redD); g.b(-0.22, 0.22, 0.2, 0.26, 0.503, 0.506, C.yellow);
  },
};
// The security desk's computer (src/secdesk.js): a desk against the wall, 0.2 m left of the middle of its 2.2 m, with an old
// computer under it; and beside it, pushed back out of the way, a swivel chair (drawn there; solid here). What stands on the
// desk (the lit monitor, the keyboard, the mug, the donuts) is drawn by src/secdesk.js too.
EXTRAS.secdesk = g => {
  const u = -0.2, e = 0.8;
  g.cu(u - e, u + e, 0.7, 0.74, 0.04, 0.84, 0.012, C.greyL); g.b(u - e + 0.02, u + e - 0.02, 0.66, 0.7, 0.06, 0.82, C.steelD, 'metal', true);
  for (const s of [-1, 1]) g.b(u + s * (e - 0.02) - 0.02, u + s * (e - 0.02) + 0.02, 0, 0.66, 0.08, 0.8, C.steelD, 'metal');
  g.b(u - e + 0.04, u + e - 0.04, 0.2, 0.66, 0.06, 0.085, C.steelD, 'metal');                                    // the modesty panel
  g.b(u + 0.36, u + e - 0.04, 0.08, 0.66, 0.14, 0.8, C.grey, 'metal'); for (const y of [0.26, 0.46]) { g.b(u + 0.38, u + e - 0.06, y, y + 0.012, 0.8, 0.804, C.black); g.b(u + 0.5, u + 0.62, y + 0.08, y + 0.1, 0.8, 0.815, C.steelL, 'metal', true); }      // drawers
  g.cu(u - 0.7, u - 0.5, 0, 0.44, 0.24, 0.7, 0.015, C.greyL); g.b(u - 0.68, u - 0.52, 0.3, 0.4, 0.7, 0.703, C.grey); g.b(u - 0.66, u - 0.645, 0.2, 0.215, 0.7, 0.704, C.led, 'glow');      // the computer, beige, one green lamp
  g.s(u - e, u + e, 0, 0.78, 0.04, 0.84);
  g.s(0.6, 1.06, 0, 0.92, 0.98, 1.44);                                                                          // the chair
};
// Set one down in room R; returns where it is ({ x, z, y, fx, fz }: its middle at the wall, and which way it faces) or null.
function extra(R, kind) {
  const { L, W } = R, A = R.aisle, rnd = dice(hash(R.room.id + ':' + kind)), tries = [];
  for (let a = Math.max(1.2, R.spine[0]); a <= Math.min(L - 1.2, R.spine[1]); a += 0.4) for (const side of [0, 1]) tries.push([a, side, rnd()]);
  tries.sort((p, q) => p[2] - q[2]);
  for (const [a, side] of tries) {
    const b0 = side ? R.mid + A : 0, b1 = side ? W : R.mid - A;
    if (b1 - b0 < 1.9) continue;
    const q = R.rect(a - EXTRA_W / 2, a + EXTRA_W / 2, b0 + 0.01, b1 - 0.01);
    if (!R.free(q, 0.3)) continue;
    R.taken.push(q); R.placed++;
    const [fx, fz] = R.dir(side ? [0, -1] : [0, 1]), [ox, oz] = R.xz(a, side ? W : 0);
    EXTRAS[kind](new Pen(R, ox, oz, fx, fz, 0.7));
    return { room: R.room.id, x: ox, z: oz, y: R.y, fx, fz };
  }
  return null;
}

// The conservation line (src/repair.js): in the larger paintings conservation studio, a low conveyor
// bench with a few canvases standing on it, a lamp on an arm over them and a stool; and in any other
// paintings studio, a notice on a stand saying where the line is. Set down like the extras above,
// before the room's own recipe, with the floor kept clear from it to the aisle.
const LINE_ROOM = /^Paintings conservation studio( \d+)?$/i;
EXTRAS.repair = (g, r) => {
  for (const u of [-1.2, 0, 1.2]) for (const d of [0.14, 1.2]) g.b(u - 0.025, u + 0.025, 0, 0.24, d - 0.025, d + 0.025, C.steelD, 'metal');
  g.b(-1.28, 1.28, 0.24, 0.292, 0.08, 1.26, C.steelD, 'metal', true);                                   // the bed; its top is the belt, which src/repair.js draws
  for (const u of [-1.27, 1.27]) g.c(u, 0.262, 0.67, 0.036, 1.14, 'd', C.steelL, 'metal', 8);           // a roller at each end
  g.b(-1.28, 1.28, 0.292, 0.33, 0.08, 0.11, C.yellow); g.b(-1.28, 1.28, 0.292, 0.315, 1.235, 1.26, C.yellow);
  picture(g, 'd', -0.95, -0.45, 0.48, 0.86, 0, 0.03, r); picture(g, 'd', -0.25, 0.3, 0.46, 0.92, 0, 0.03, r); picture(g, 'd', 0.5, 0.92, 0.5, 0.84, 0, 0.03, r);      // waiting their turn, on the wall behind
  g.b(1.29, 1.4, 0, 0.3, 0.08, 0.2, C.steelD, 'metal', true); lampArm(g, 1.345, 0.14, 0.3, 0.42, 1);                                                                 // the lamp, at the end so it is not over the belt
  g.b(-1.4, -1.29, 0, 0.42, 0.3, 0.62, C.greyL, 'metal', true); g.b(-1.38, -1.34, 0.3, 0.34, 0.62, 0.623, C.led, 'glow'); g.b(-1.33, -1.29, 0.3, 0.34, 0.62, 0.623, C.ledA, 'glow');      // the motor's box
  for (let k = 0; k < 3; k++) g.c(-1.37 + k * 0.03, 0.47, 0.4, 0.01, 0.1, 'y', pick(r, PAINT), 'matte', 5);                                                           // brushes in a pot on it
  stool(g, 1.12, 1.52, 0.3);
  g.s(-1.4, 1.4, 0, 0.36, 0.06, 1.28);
};
EXTRAS.repairNote = g => {
  g.b(-0.26, 0.26, 0, 0.03, 0.1, 0.44, C.steelD, 'metal', true); g.b(-0.025, 0.025, 0.03, 0.22, 0.22, 0.27, C.steelD, 'metal');
  g.b(-0.3, 0.3, 0.2, 0.66, 0.24, 0.27, C.white, 'matte', true);
  g.s(-0.3, 0.3, 0, 0.66, 0.1, 0.44);
};
function extraWide(R, kind, width) {
  const { L, W } = R, A = R.aisle, rnd = dice(hash(R.room.id + ':' + kind)), tries = [], half = width / 2;
  for (let a = Math.max(half + 0.4, R.spine[0]); a <= Math.min(L - half - 0.4, R.spine[1]); a += 0.3) for (const side of [0, 1]) tries.push([a, side, rnd()]);
  tries.sort((p, q) => p[2] - q[2]);
  for (const [a, side] of tries) {
    const b0 = side ? R.mid + A : 0, b1 = side ? W : R.mid - A;
    if (b1 - b0 < 1.9) continue;
    const q = R.rect(a - half, a + half, b0 + 0.01, b1 - 0.01);
    if (!R.free(q, 0.3)) continue;
    R.taken.push(q); R.placed++;
    const [fx, fz] = R.dir(side ? [0, -1] : [0, 1]), [ox, oz] = R.xz(a, side ? W : 0);
    EXTRAS[kind](new Pen(R, ox, oz, fx, fz, 0.7), dice(hash(R.room.id + ':' + kind + ':look')));
    return { room: R.room.id, x: ox, z: oz, y: R.y, fx, fz };
  }
  return null;
}
// What stands in the rooms that are on no drawing has its own file (src/secretfit.js): it adds its
// items and recipes to the ones above.
installSecretFit({ def, RECIPES, FITOUT, OPTS, C, pick, LIT });

// Hang a whiteboard that says `id` (src/boardtext.js) on a wall of room R: as near the middle of a wall as there is room. It takes none of the room's dice.
function writtenBoard(R, id) {
  const { L, W } = R, w = 1.8, k = hash(R.room.id + ':board');
  const walls = [[L, t => [t, 0], 'b+'], [L, t => [t, W], 'b-'], [W, t => [0, t], 'a+'], [W, t => [L, t], 'a-']];
  for (let i = 0; i < 4; i++) {
    const [len, at, face] = walls[(i + k) % 4];
    for (let off = 0; off <= len / 2 - w / 2 - 0.1; off += 0.35) for (const sgn of off ? [1, -1] : [1]) { const [a, b] = at(len / 2 + sgn * off); if (R.put(['whiteboard', w, { text: id }], a, b, face, 0.3)) {
      // Nothing is to stand in front of it: the floor before the board, a good stride deep, is kept clear of furniture.
      const D = 1.9, h = w / 2 + 0.15; R.clear.push(face === 'b+' ? R.rect(a - h, a + h, 0, D) : face === 'b-' ? R.rect(a - h, a + h, W - D, W) : face === 'a+' ? R.rect(0, D, b - h, b + h) : R.rect(L - D, L, b - h, b + h));
      return true; } }
  }
  return false;
}

// ------------------------------------------------------------ the builder --

// Furnish every room that is not a gallery. Adds what is solid to plan.obstacles and returns the
// triangles: { batches: [{ mat, floor, position, normal, color, index, bounds }], rooms, items, solids }.
// Normals are signed bytes and colours unsigned bytes (linear), both to be read as normalised.
export function furnish(plan) {
  const out = { batches: {}, solids: [], marks: [] }, rooms = {}, arcades = [], consoles = [], desks = [];
  let items = 0;
  const lineRooms = plan.rooms.filter(r => LINE_ROOM.test(String(r.gallery || ''))).sort((p, q) => (q.x1 - q.x0) * (q.z1 - q.z0) - (p.x1 - p.x0) * (p.z1 - p.z0)); plan.repair = null; plan.repairNotes = [];      // where the conservation line goes (src/repair.js)
  const boards = assignBoards(plan.rooms, r => !!fitoutOf(r));       // which rooms have a whiteboard with something written on it (src/boardtext.js)
  for (const room of plan.rooms) {
    const recipe = fitoutOf(room);
    if (!recipe) continue;
    const R = new Room(plan, room, out, OPTS[recipe]);
    const slot = ARCADE_ROOMS.indexOf(room.gallery);
    if (slot >= 0) { const at = extra(R, 'arcade'); if (at) arcades.push({ slot, ...at }); }
    if (recipe === 'securityControl') { const at = extra(R, 'heist'); if (at) consoles.push(at); const dk = extraWide(R, 'secdesk', 2.2); if (dk) desks.push(dk); }
    if (lineRooms.includes(room)) { const first = !plan.repair && room === lineRooms.find(r => fitoutOf(r)), at = extraWide(R, first ? 'repair' : 'repairNote', first ? 2.8 : 1.0); if (at) { if (first) plan.repair = at; else plan.repairNotes.push(at); } }
    if (recipe === 'xBrief') { const at = extra(R, 'arcade'); if (at) plan.bonusArcade = at; }           // one more monitor, where nobody was meant to find it
    // A whiteboard with something written on it goes up before the furniture, in the middle of whichever wall has room, so that it is not behind a bookcase.
    if (!room.secret) for (const id of boards[room.id] || []) writtenBoard(R, id);
    finish(R, recipe);
    RECIPES[recipe](R);
    // A room somebody has left a whiteboard written on gets a board to carry it, if the recipe has not hung one (or enough) already.
    for (const id of boards[room.id] || []) {
      if (out.marks.some(m => m.kind === 'board' && m.text === id)) continue;
      const blank = () => out.marks.find(m => m.kind === 'board' && m.room === room.id && !m.text);
      let m = blank();
      if (!m) { for (const gap of [0.1, 0]) if (!m && R.walls([['whiteboard', gap ? 1.8 : 1.5]], { once: true, gap })) m = blank(); }
      if (m) m.text = id;
    }
    rooms[room.id] = { recipe, items: R.placed, clear: R.clear, entries: R.entries.map(([a, b]) => R.xz(a, b)), aisle: [R.xz(R.spine[0], R.mid), R.xz(R.spine[1], R.mid)] };
    items += R.placed;
    rooms[room.id].taken = R.taken;                       // every footprint, solid or not: src/lights.js keeps its switch plates off them
  }
  for (const s of out.solids) plan.obstacles.push(s);
  plan.fitout = rooms;
  plan.wc = out.wc || [];                                 // how each restroom block was divided, and what is in each part of it
  plan.marks = out.marks;                                 // spots the fit-out leaves for others to dress: whiteboards (src/whiteboards.js), and what is under the building (src/secret.js)
  plan.arcades = arcades.sort((p, q) => p.slot - q.slot); plan.heistConsoles = consoles; plan.secDesks = desks;      // where src/arcade.js, src/heist.js and src/secdesk.js will find their things
  const batches = Object.values(out.batches).filter(b => b.i.length).map(b => ({
    mat: b.mat, floor: b.floor, boxes: b.boxes,
    position: new Float32Array(b.p), normal: new Int8Array(b.n), color: new Uint8Array(b.c), index: b.p.length / 3 > 65535 ? new Uint32Array(b.i) : new Uint16Array(b.i),
    bounds: { x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, z0: b.z0, z1: b.z1 },
  }));
  return { batches, rooms, items, solids: out.solids.length };
}

// The three kinds of surface everything is made of. src/museum.js makes a material of each.
export const MATERIALS = {
  matte: { roughness: 0.85, metalness: 0, glow: 0.26 },
  metal: { roughness: 0.42, metalness: 0.55, glow: 0.24 },
  sheen: { roughness: 0.38, metalness: 0, glow: 0.26 },                    // leather and vinyl: the café's booths
  glow: { unlit: true, gain: 1.5 },
};
