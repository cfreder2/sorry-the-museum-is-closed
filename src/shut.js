// The rooms that are shut: every doorway into one of these is a door that does not open.
//
// Where the list came from: the audit of the empty rooms (build 2026.11.25.18, checked again at 2026.11.25.21). The rule:
// a room is on it if there is nothing in it (no work, nothing to do, nothing to find) AND it lies on no shortest way
// between two rooms that have something. So shutting it takes nothing away and makes no journey longer. Five empty
// rooms that pass that test are left open all the same, because a way in from outside (a duct, a dock shutter, a
// propped window, an outside door) opens into them or they are the only way on from one that does: the Rice east
// range, Auditorium foyer 2, the corridor B1-180, the Stock Exchange Trading Room 2, the West entrance passage.
// And one more is left open: the Stock Exchange Trading Room (B1-164), because the stair from Backstage down to the
// Café goes down through its floor: the stairwell is open to that room from below.
//
// To open a room again, delete its line. To shut another, add its id (src/layout.js), but only a room with nothing in
// it that no route needs: a doorway is shut when exactly one of its two rooms is on this list, and whatever is behind
// it can no longer be reached. A shut room is not built: no interior, no furniture, no lights, nothing in the lists things
// are bumped against. It is still dealt its share when things are placed, so that everything in the open rooms lands
// exactly where it did, and its block and roof still stand out of doors (src/plan.js: buildPlan marks them, stripShut
// takes them out once everything is placed; src/museum.js hangs the leaves and skips the insides).
export const SHUT_ROOMS = [
  // ---- The lower level: 82 rooms
  // Ferguson (staff block, north)
  'BLL-4',        // Staff lockers, west
  'BLL-5',        // Uniform store
  'BLL-7',        // Canteen kitchen
  'BLL-10',       // Chiller plant
  'BLL-11',       // Electrical switchroom
  'BLL-13',       // Staff entrance and security desk 2
  // Old building (Michigan Ave)
  'BLL-55',       // Prints and drawings storage
  'BLL-56',       // Photography cold store
  'BLL-57',       // Photography store
  'BLL-59',       // Library stacks 2
  'BLL-60',       // Library stacks 3
  'BLL-61',       // Rare books vault
  'BLL-63',       // Archives
  'BLL-64',       // Shop stock room
  'BLL-65',       // Auditorium green room
  'BLL-68',       // Plant room 1
  'BLL-69',       // Sprinkler valves
  'BLL-70',       // Housekeeping
  'BLL-72',       // Coat store
  'BLL-73',       // Chair store
  'BLL-74',       // Prints and drawings storage 2
  'BLL-75',       // Service corridor
  'BLL-76',       // Photography cold store 2
  'BLL-77',       // Photography store 2
  'BLL-78',       // Service corridor
  'BLL-80',       // Library stacks 4
  'BLL-82',       // Library stacks 1
  'BLL-83',       // Rare books vault 2
  'BLL-84',       // Archives 2
  'BLL-86',       // Auditorium green room 2
  'BLL-87',       // Projection booth 2
  'BLL-88',       // Plant room 2
  'BLL-89',       // Sprinkler valves 2
  'BLL-91',       // Coat store 2
  'BLL-93',       // Arms and armour store
  'BLL-94',       // Textile store
  'BLL-97',       // European decorative arts store
  'BLL-98',       // Furniture store
  // Rice Building
  'BLL-103',      // Receiving bay
  'BLL-104',      // Crate store
  'BLL-105',      // Packing room
  'BLL-106',      // Registrar's examination room
  'BLL-107',      // Quarantine room
  'BLL-108',      // Carpentry shop
  'BLL-109',      // Paint shop
  'BLL-111',      // American art store
  'BLL-112',      // Sculpture store
  'BLL-113',      // Contemporary art store
  'BLL-115',      // Oversize painting racks
  'BLL-119',      // Plant room 3
  // Columbus Drive (auditorium, school)
  'BLL-132',      // Cold room
  'BLL-134',      // Dish room
  'BLL-135',      // Catering office
  'BLL-136',      // Auditorium plant
  'BLL-137',      // Stage store
  'BLL-141',      // Plant room 5
  'BLL-144',      // Refuse room
  'BLL-146',      // Cold room 2
  'BLL-147',      // Dry goods store 2
  'BLL-148',      // Dish room 2
  'BLL-149',      // Catering office 2
  'BLL-150',      // Auditorium plant 2
  'BLL-151',      // Service corridor
  'BLL-152',      // Stage store 2
  'BLL-153',      // Egyptian and ancient art store 2
  'BLL-154',      // Service corridor
  'BLL-156',      // Plant room 6
  'BLL-157',      // Electrical substation 2
  'BLL-158',      // Refuse room 2
  'BLL-159',      // Café kitchen 3
  // McKinlock Court ring (east)
  'BLL-225',      // Asian art store
  'BLL-226',      // Asian paintings study room
  'BLL-227',      // Scroll mounting studio
  'BLL-228',      // Plant room 4
  'BLL-229',      // Service corridor
  'BLL-230',      // Asian art store 2
  'BLL-231',      // Asian paintings study room 2
  'BLL-232',      // Scroll mounting studio 2
  // Modern Wing
  'MW0-cor',      // Service corridor
  'MW0-lockers',  // Staff lockers, east
  'MW0-plant',    // Mechanical plant (two storeys deep)
  'MW0-storeS',   // Art storage
  // ---- The first floor: 19 rooms
  // Ferguson (staff block, north)
  'B1-16',        // Visitor services office
  'B1-17',        // Membership office
  'B1-19',        // Finance office
  'B1-20',        // Accounts
  'B1-23',        // Publications
  // Old building (Michigan Ave)
  'B1-92',        // Prints and drawings study room
  // Columbus Drive (auditorium, school)
  'B1-161',       // Auditorium foyer
  'B1-167',       // Group entrance
  'B1-169',       // School reception
  'B1-171',       // Seminar room
  'B1-172',       // Education office
  'B1-177',       // Backstage 2
  'B1-182',       // Columbus Drive entrance hall 2
  'B1-183',       // Group entrance 2
  'B1-184',       // School reception 2
  'B1-186',       // Seminar room 2
  // Rice Building
  'B1-riceS',     // Rice Building, south range (not public)
  // Modern Wing
  'MW1-core',     // Service core (risers, goods lift)
  'MW1-shop',     // Modern Shop
  // ---- The second floor: 42 rooms
  // Ferguson (staff block, north)
  'B2-26',        // Director's anteroom
  'B2-27',        // Board room
  'B2-28',        // Deputy directors
  'B2-30',        // Curators, prints and drawings
  'B2-31',        // Curators, photography
  'B2-32',        // Curators, arts of Asia
  'B2-33',        // Curators, arts of the Americas
  'B2-34',        // Curatorial library
  'B2-38',        // Director's anteroom 2
  // Rice Building
  'B2-121',       // Regenstein Hall, gallery B
  'B2-122',       // Regenstein Hall, gallery C
  'B2-123',       // Exhibition prep room
  'B2-126',       // Curators, modern and contemporary
  'B2-129',       // Lighting store, south
  'B2-130',       // Regenstein Hall, gallery A 2
  // Columbus Drive (auditorium, school)
  'B2-189',       // School print workshop
  'B2-191',       // School faculty offices
  'B2-192',       // School library annex
  'B2-194',       // Auditorium balcony
  'B2-196',       // School painting studio 2
  'B2-197',       // School drawing studio 2
  'B2-203',       // Projection booth 2
  'B2-204',       // Auditorium balcony 2
  'B2-205',       // School painting studio 3
  'B2-206',       // Service corridor
  'B2-208',       // School print workshop 3
  'B2-209',       // School critique room 3
  'B2-210',       // School faculty offices 3
  'B2-211',       // School library annex 3
  'B2-214',       // Auditorium balcony 3
  'B2-215',       // School painting studio 4
  'B2-217',       // School drawing studio 4
  'B2-218',       // School print workshop 4
  'B2-219',       // School critique room 4
  'B2-220',       // School faculty offices 4
  'B2-221',       // School library annex 4
  'B2-222',       // Projection booth 4
  'B2-223',       // Auditorium balcony 4
  'B2-224',       // School painting studio 5
  // McKinlock Court ring (east)
  'B2-234',       // Study room
  'B2-238',       // Curators, ancient art 2
  'B2-239',       // Study room 2
];
