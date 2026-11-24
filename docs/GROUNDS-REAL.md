# What really stands on the grounds

A field guide to the outdoors around the Art Institute of Chicago, for dressing the game's winter night. Facts are from public descriptions and from OpenStreetMap; where something could not be confirmed it says "not confirmed".

Map data © OpenStreetMap contributors, ODbL

## Reading the coordinates

- Positions are game metres from the usual formula: `x = (lon + 87.623993587801) * 111320 * cos(41.879°) + 20`, `z = 212.3 - (lat - 41.8786621052) * 110950`. x grows east, z grows south.
- The map data is in `tools/survey/grounds-osm.json`, written by `node tools/fetch_grounds.mjs`.
- West of Columbus Drive the formula and the game agree. East of it the game is squeezed and the formula is not. On the real ground Butler Field runs x 298 to 553, Lake Shore Drive about x 553 to 590, the lakefront bike trail x 590 to 600, the running path x 618 to 635 and the harbour wall x 634 to 663. The game puts Lake Shore Drive at x 480 to 514 and the lake at 620.
- A workable squeeze (my inference from those bounds, not something the game defines): Butler Field `x' = 294 + (x - 298) * 0.73`; Lake Shore Drive `x' = 480 + (x - 553) * 0.92`; trail and harbour edge `x' = 514 + (x - 590) * 1.45`, which puts the wall near 580 to 620. All x values below are the unsqueezed formula values unless marked.
- OpenStreetMap is thorough for trees here and thin for benches, bins and lamps. A missing bench on the map is not a missing bench on the ground.

## 1. The Art Institute's gardens

### South Garden (x 11 to 91, z 170 to 240)

- Designed by Dan Kiley with Ian Tyndall and Joe Karr, built 1962 to 1967, about one acre, over a parking garage. It opens west onto Michigan Avenue; a balustraded terrace forms the north edge and a stone wall the south.
- The floor is sunken 18 inches below the street and is crushed stone, not paving slabs.
- Entrance: two long raised planters parallel to the avenue flank the way in. Each holds three staggered rows of honey locust over a low privet hedge, ivy and spring bulbs. Map: planters at x 12 to 25, z 178 to 194 and z 201 to 224; the gap between them (z 194 to 201) is the entrance on the pool's axis; 15 trees mapped in them.
- Pool: one low rectangular pool on the axis with a grid of low jets. Map: x 36.7 to 57.6, z 192.4 to 201.7 (about 21 by 9 m).
- Grove: cockspur hawthorns, low-branching, each in its own square raised planter 30 inches high with a wide marble edge that doubles as a seat, spaced 20 feet on centre. Planter beds hold ground cover and seasonal plants.
  - Map: 28 square planters about 3 m across, one tree in each. Columns at x 35.3, 42.9, 51.4, 59.1. Rows north of the pool at z 178.5, 185.0, 191.3; rows south at z 203.3, 209.6, 216.0, 222.5.
  - Conflict: The Cultural Landscape Foundation's Kiley page says sixteen hawthorns each side (32). The map shows 12 north and 16 south. Not confirmed which is right today.
- Fountain of the Great Lakes, Lorado Taft, 1913, bronze figures on granite, five women pouring water from shell to shell. It closes the axis against the blank west wall of the Morton Wing. Map: x 64.4 to 73.6, z 190 to 203. A long low hawthorn bed runs either side of it under wintercreeper (map: six trees at x 66 to 69, z 174 to 184 and z 210 to 222).
- South edge: long raised beds of honey locust over privet and bulbs. Map: bed x 25 to 91, z 223 to 240, with a row of 18 trees at z 232 to 236 (about 3.3 m apart) and six more at z 238.4.
- Seating on the map: four benches just inside the entrance planters at x 25.5 (z 181, 190, 204, 222) and three along the south bed at z 233 (x 39.5, 47.6, 55.8). The planter edges are the main seating.
- Winter: honey locust and hawthorn are bare; the hawthorns keep their flat, layered, thorny outline and some red fruit. Ivy, wintercreeper and privet stay partly green. Whether the pool is drained and the Taft fountain shut off for winter: not confirmed (likely, as Chicago's outdoor fountains are winterised).
- Sources: tclf.org South Garden page and Kiley microsite; ASLA 2015 Landmark Award page.

### North Garden, Stanley McCormick Memorial Court (x 6 to 63, z -16 to 53)

- A 1959 gift of Mrs Stanley McCormick, first laid out by Holabird, Root and Burgee, redesigned by Laurie Olin's firm (the firm gives 1990; the Park District says the first sculpture after the redesign came in 1991). The redesign enlarged the central lawn and made a sunny open court to contrast with the shady South Garden.
- A double row of honey locust veils the Ferguson Wing's façade. The map has two matching north-south lines on the east side: x 51 (z 10.6, 17.3, 23.6, 30.5, 36.7) and x 61 (z 20, 29, 36, 43).
- Other mapped trees: a row of seven along the Monroe Street side at z -12.3 (x 11.5 to 55.4, about 7.5 m apart), four at z -3.5 (x 29.5 to 53.6), and six along the south side at z 48.5 to 49. Species other than the honey locusts: not confirmed.
- Sculpture (map positions): Henry Moore, Large Interior Form, bronze, 16 ft 9 in tall, at (23.2, -0.8); David Smith, Cubi VII, stainless steel, 1963, at (35.8, 10.2); Alexander Calder, Flying Dragon, 1975, red-painted steel stabile, at (44.1, 31.8); Ulrich Rückriem, untitled stone, at x 58 to 58.7, z -12.1 to -7.7.
- Benches on the map: three with backs along the north edge (z -12; x 15, 30, 43.5), three backless at z 1 (x 30.5, 39.8, 50.4), two at x 19 (z 11.6, 33) and three at x 59.7 (z 24, 32, 39). Three flagpoles at x 64 to 65.5, z 6 to 14. A 24-space bike rack at x 62 to 65, z -13 to -1.
- Hedge and fence along the Michigan Avenue side at x 6 to 9, z 2 to 39, and a hedge along Monroe at z -15 to -4.
- Winter: open lawn under snow, bare locusts, the sculptures left in place. Planting detail beyond this: not confirmed.
- Sources: theolinstudio.com project page (as quoted in search results; the page itself would not load); Chicago Park District artwork pages.

### Other courts on the map

- McKinlock Court fountain (Carl Milles' Tritons; name not in the map data) at x 188.6 to 202.4, z 104 to 114, with clipped hedge blocks around it (x 180 to 207, z 96 to 122) and six trees.
- Pritzker Garden beside the Modern Wing, x 178 to 237, z 30.5 to 50.
- Chicago Stock Exchange Arch (Adler and Sullivan; brown terracotta, faces south) at x 247 to 260, z -12 to -10.
- Isamu Noguchi's bicentennial fountain at x 255.5 to 267, z 80 to 142, on the Columbus Drive side.

## 2. The Michigan Avenue front

- The lions: two bronzes by Edward Kemeys, cast 1893, unveiled 1894, about 10 feet long, over two tons each, green patina, on the knee walls of the entrance stair. North lion "on the prowl" at x 5.6 to 8.3, z 94; south lion "in an attitude of defiance" at x 6.1 to 8.9, z 131. The entrance axis is therefore z 112.5.
- Winter fact worth using: each winter the lions wear evergreen wreaths with bows. The "wreathing of the lions" began in 1991 and is held the day after Thanksgiving.
- Flagpoles: four in a north-south row at x 14, z 105.7, 110.6, 115.5, 120.5 (national, state, county, city, north to south).
- Frontage: hedges and low walls along the building's terrace at x 7 to 12 (z 45 to 70, 86 to 93, 132 to 174). The terrace balustrade's detail: not confirmed.
- Median planter: one long flower-bed median at x -15 to -7, z -13 to 95 (about 108 by 8 m) with seven trees about 12 m apart (z 0, 16, 26, 43, 55, 66, 76). South of z 95 no median planter is mapped.
- The avenue's medians run from Roosevelt Road to Oak Street: tulips in spring, perennials and grasses or tropicals in summer, chrysanthemums and ornamental kale in autumn. In winter the beds are covered with pine boughs to protect the bulbs, and sit under snow and road salt. Decorative winter arrangements (red-twig dogwood, birch poles) at this block: not confirmed. Planter wall material and height: not confirmed.
- Street lamps: the map has them on both kerbs about 19 m apart: west kerb x -26 to -22 (ten mapped, z -7.5 to 217) and east kerb x 0 to 6 (fourteen, z -8.6 to 231). Michigan Avenue's ornamental lamps are described as cast from a 1909 design with a halo of six round globes, with tall black davit-arm road lights added among them. Whether exactly that fixture stands on this block: not confirmed.
- Street trees and tree grates on the kerb: none mapped; species not confirmed.
- Other kerb furniture on the map: bus shelters at x -28 to -26, z 22 to 26 (west) and x 2 to 3, z 21 to 25 (east), two more at x -24 to -21, z 202 to 204 and z 224 to 228; small bike racks along the west kerb (ten, x -26 to -23); a Route 66 history board at (-27.5, 93.4); a black metal four-seat bench with back and arms at (-23.3, 233.7); bins at (-24.2, 124.2) and (-21, 239.4).
- Sources: Wikipedia "Lions (Kemeys)"; governing.com "Paris on the Prairie"; WBEZ and WTTW pieces on the medians; Chicago Star on the tulip beds.

## 3. The Beaux-Arts bones of Grant Park

- Edward Bennett's plan gave the park symmetrical "rooms" of lawn framed by trees. American elms were planted in allées and rectangular blocks in the 1920s, formalised in the 1930s, with crabapples and hawthorns as understory, lilac, and tightly clipped hedges (privet where named).
- Hundreds of the elms survive, to about 60 feet; Dutch elm disease hit hard in the late 1970s and hybrid elms fill the gaps. "One of the largest surviving stands": not confirmed by any source found.
- Classical furniture is ornamental pre-cast concrete: balustrades, pylons, rostral columns, fountains. Rostral columns are fluted, about one storey, with two ship prows halfway up each carrying two coach-style lamps, and a bronze lattice globe on top. They mark stairs and the pedestrian bridges.
- The railway: the Illinois Central tracks were dropped below grade from 1919 and bridged. Eight bridges cross the cut in the whole park.
  - Jackson Drive bridge: Beaux-Arts, four lanes and wide pavements, concrete balustrades of the same pattern as the Michigan Avenue promenade. Its tall flanking pylons were removed for the south garage.
  - Monroe Drive bridge: rebuilt 1939, Art Deco, steel with granite abutments; a long rail of five unbroken horizontal bands, supports in groups of three, small finned bronze cylinders on the abutments. Once silver and black, now all grey.
  - Van Buren (south of the game world): a pedestrian bridge about 40 feet wide with the same balustrade, marked by rostral columns rather than pylons.
  - For scale, the surviving Congress Drive pylons are 65 ft 6 in tall with garland swags and the city's Y symbol.
  - Baluster shape, urns and the walls of the cut itself: not confirmed. "Obelisk-like" pylons along the cut: not confirmed.
- Lamp posts inside the park: the historic twin-globe post could not be confirmed from any source found. The map has plain `street_lamp` points only.
- Benches: the Park District's standard bench style (concrete ends, slats) could not be confirmed. The one bench with tags is black metal with back and arms. The "huge concrete benches" in the record are garage vents on Michigan Avenue north of Monroe, about 8 feet tall and 15 long.
- Litter bins and drinking fountains: styles not confirmed; the map has three bins and no drinking fountain inside the game bounds.
- Sources: National Register nomination for Grant Park (1992); Wikipedia "Grant Park (Chicago)"; tclf.org Grant Park page.

## 4. Butler Field and the Petrillo Music Shell

- Butler Field is the block between Columbus Drive, Lake Shore Drive, Monroe and Jackson (map: x 298 to 553, z -27 to 237). It was built on three levels with ball fields in the sunken middle; in 1978 it was filled to street level, the old planting removed, and the shell built in the south-west corner. The double rows of elms were replaced with double rows of lindens. An internal walk survives without its changes of level.
- The shell is a staff-designed, demountable, "semi-permanent" band shell (1978, 235 S. Columbus Drive, roughly x 351, z 187) with a paved seating area in front and the open lawn beyond; about 5,000 reserved seats and 30,000 on the grass. Its shape and materials: not confirmed.
- What the map shows is a lawn inside a frame of trees on a strict grid of about 6.2 m (20 feet):
  - West, along Columbus: five north-south rows at x 307, 313, 319, 324, 330, from z 6 to 188, 21 to 28 trees a row (129 trees).
  - East, along Lake Shore Drive: five rows at x 518, 524, 530, 535, 541.5, from z 23 to 184, 23 to 27 a row (136 trees).
  - North, along Monroe: four east-west rows at z -15, -9, -3, +2.5, from x 306 to 538 (about 100 trees, with gaps).
  - South, along Jackson: five rows at z 202, 207, 212, 219, 225, from x 310 to 542 (118 trees).
  - Squeezed for the game (see top), the west rows fall near x 301 to 317 and the east rows near x 455 to 472.
- Corners: each has L-shaped flower beds and a small plaza. North-east plaza x 508 to 542, z -20 to 14, surfaced in fine gravel; south-east x 511 to 546, z 192 to 226. A monument to Edward B. Butler stands at (336, 16).
- Railings: x 335 to 345, z 27 to 85; x 347 to 405, z 14 to 24; and x 340 to 407, z 130 to 194 (the shell's enclosure).
- Lamps: 23 mapped inside the field along its diagonal and cross paths, plus six in the west band. Richard Serra's Reading Cones stands in the north band at (426, -3); its form is not described in the sources used here.
- Winter: an empty white lawn ringed by bare, evenly spaced trunks; the shell dark.
- Sources: National Register nomination; Wikipedia "Petrillo Music Shell".

## 5. North of Monroe: what shows from the south

- Maggie Daley Park (map: x 297 to 802, z -431 to -45; Michael Van Valkenburgh, opened 2014 to 2015). From Butler Field you look across Monroe at rolling planted hills with about 1,000 young trees.
  - Skating ribbon: a quarter-mile loop, 27,500 square feet of ice, lit and busy on winter nights.
  - Climbing walls: up to about 40 feet, inside the ribbon.
  - Light masts: tall tripod-like masts, reported as 50 feet and thirteen in number (one source each) giving a moonlit wash. These are the things most likely to be seen from the south at night.
  - Play Garden, 3 acres, map x 410 to 528, z -214 to -105.
- Cancer Survivors' Garden (1996), far north-east by Randolph Street: two 40-foot Corinthian columns from the 1905 Federal Building, a wrought-iron pergola and three pavilions. Too far north (about z -400) to read from the game world.
- Lurie Garden lies directly across Monroe from the Modern Wing (map: x 156 to 258, z -146 to -45). Its tall hedge is on its north and west sides, so the south side facing the museum is open.
- Sources: Wikipedia "Maggie Daley Park"; city press release of 13 December 2014 (via search); Park District "Federal Building Columns".

## 6. Lurie Garden in winter, as a planting reference

- Nothing is cut down in autumn. Perennials and grasses stand all winter in brown, gold and tan, and are mown to five inches in late winter while the ground is frozen.
- What it looks like, plant by plant (February): coneflower seed heads as dark dots; compass plant as tall skeletons; little bluestem still red-orange; switchgrass with airy pale seed heads that move; Russian sage with a trace of blue; rattlesnake master as spiky buttons; mountain mint tarnished silver; Arkansas bluestar golden; wild quinine dark and rigid.
- The Shoulder Hedge: about 14 to 15 feet tall, clipped to a curved profile on a permanent metal armature; arborvitae (evergreen), European beech (holds copper leaves through winter) and fastigiate hornbeam.
- A boardwalk of ipe wood runs along a water seam between the "Light Plate" and "Dark Plate".
- Sources: luriegarden.org (garden features; "It's time to cut down the garden"; plant pages); gardeninacity.com.

## 7. Columbus Drive, Lake Shore Drive, the trail and the harbour

- Columbus Drive was built at its present width and sits several feet higher than Lake Shore Drive. Trees on its west pavement beside the museum: 31 mapped at x 261 to 272, z 18 to 233. A double row at x 251 and 256, z 2 to 68 (5.6 m apart) stands beside the Modern Wing. Median planting on Columbus: not confirmed.
- Lake Shore Drive is an eight-lane boulevard. Its median and lamp type: not confirmed.
- Lakefront Trail, split since 2018 into two paths:
  - Bike trail: concrete, map x 590 to 600. City standard 12 feet wide.
  - Pedestrian trail: concrete, lit, map x 618 to 635, tagged 3 m wide and two lanes. City standard 20 feet (14 paved plus 3 feet of crushed stone each side).
  - Markers every half mile. Lane paint and sign wording: not confirmed.
  - Trees: fourteen along x 595 to 600 and a row of 21 at x 614 to 618 between the two paths (about 9 m apart, z 20 to 256).
- Harbour edge: a quay x 634 to 663 running south from z 0. The record describes a promenade on two levels, the upper at road level with double rows of elms, the lower several feet down along the water, with stairs at Jackson Drive. On the map: lamps along the edge about 61 m apart (x 633 to 638; z 39, 100, 161, 222), life rings at (640, 4) and (644, 188), a bench at (637, 178), a bin at (635.5, 70), a drinking fountain at (620.5, 196), a toilet block at x 638 to 648, z -8 to 0, and a small pier at x 644 to 653, z 202 to 207. Ladders: not mapped, not confirmed.
- Monroe Harbor: a mooring field, not slips. Boats hang on "cans" (buoys) and are reached by tender. The operator lists 392 cans; the Park District and Wikipedia say 1,000. The map has 246 buoys inside the fetched box, from x 641 east. Season 1 May to 31 October, so on a winter night the water is empty. Whether the cans themselves are lifted for winter: not confirmed.
- Chicago Yacht Club, Monroe station: a masonry-and-frame clubhouse (1947 in the record) on a small peninsula at the foot of Monroe. Its dock is mapped at x 684, z -180 to -94 with six pairs of finger piers 14 m apart. It is north of the game's edge and would be seen across the north-east corner.
- Columbia Yacht Club: the club's house is a ship, the former icebreaking rail ferry Abegweit, 372 feet long, in service 1947 to 1982, moored at the foot of Randolph Street since 1983. Dock mapped at x 938 to 991, z -357 to -238: a lit ship far to the north-east.
- Winter boat storage: the city's harbours store boats at 31st Street and Montrose harbours, not at Monroe. Haul-out is in October, launch in April; boats are blocked on stands, or sit on the owner's cradle or trailer, and are shrink-wrapped. A boatyard beside Monroe Harbor would be an invention.
- Sources: chicagoharbors.info (Monroe Harbor; winter storage); National Register nomination; Wikipedia "MV Abegweit (1947)"; Park District Lakefront Trail page; city press release of May 2018 (via search); Chicago Magazine (via search).

## 8. Trees and shrubs, and how each stands in winter

General habit, from standard horticultural description (Morton Arboretum); where each grows in the park is as stated above.

- American elm: tall vase, trunk dividing into arching limbs with fine drooping twigs; the park's allée tree.
- Honey locust: open, flat-topped, thin zigzag twigs, dark furrowed bark; a few long twisted brown pods may hang on.
- Cockspur hawthorn: low and wide with strongly horizontal tiers, dense twiggy crown, long thorns, persistent dark red fruit.
- Crabapple: small rounded tree, dense spurred branching, small red or yellow fruit held into winter.
- Littleleaf linden: neat dense pyramid or oval, many fine upswept twigs, smooth grey-brown bark.
- Ginkgo: stiff and sparse, a strong central leader with stubby spur shoots along the branches.
- River birch: often multi-stemmed, with salmon to cinnamon bark peeling in papery curls.
- Kentucky coffeetree: coarse and gaunt, very few thick twigs, scaly bark, fat dark pods.
- Hackberry: elm-like outline, grey bark with corky warts and ridges, often twiggy "witches' brooms".
- Spruce: dark dense cone to the ground. Yew: dark green, usually clipped low. Arborvitae: narrow green columns, bronzing a little in cold.
- Red-twig dogwood: thickets of bright red stems. Viburnum: dense rounded shrubs, some with dried fruit. Shrub roses: thorny mounds with orange-red hips. Hydrangea: tan dried flower heads left on. Ornamental grasses: buff upright clumps with feathery plumes.

Which of these are actually planted where in Grant Park, beyond the elms, lindens, crabapples, hawthorns, honey locusts, lilac and privet named above: not confirmed.

## Summary of OSM data

Counts inside the game bounds (x -28 to 620, z -42 to 262), from `tools/survey/grounds-osm.json`:

- Points: trees 725; street lamps 59; benches 19; bike racks 15 (plus one mapped as an outline); flagpoles 7; artworks 5 (plus four as outlines); bins 3; information boards 2; the city's bike-share docks 1 point and 1 outline.
- Lines and outlines: footways 173; steps 41; pedestrian areas 18; cycleways 3; gardens and beds 55; hedges 22; fences 22; walls 19; retaining walls 4; fountains and pools 4; shelters 4; parks 5; monument 1.
- None inside the bounds: tree rows, shrubs, drinking fountains, bollards, pitches, playgrounds, picnic tables, piers, life rings, harbour marks. (Life rings, piers and 246 mooring buoys lie just east, from x 634.)

Notable clusters:

- Butler Field's frame holds about 485 of the trees: west band x 307 to 330, z 6 to 188; east band x 518 to 542, z 23 to 184; north band z -15 to 3, x 306 to 538; south band z 202 to 225, x 310 to 542. All on a 6.2 m grid.
- South Garden: 76 trees, 28 square planters, 7 benches, two hedge-edged entrance planters (x 12 to 25).
- North Garden: 32 trees, 11 benches, 3 flagpoles, 4 sculptures.
- Michigan Avenue: 24 lamps in two kerb lines about 19 m apart; 7 median trees; 11 bike racks; 4 shelters.
- Columbus Drive, west pavement: 31 trees at x 261 to 272; double row of 25 at x 251 and 256, z 2 to 68.
- Monroe Street, south side by the Modern Wing: ten trees at z -16 to -18, x 160 to 233, behind a 106 m hedge.
- Lakefront: 38 trees between x 595 and 620; the city's bike-share docks at (601, 252) and at x 616 to 618, z -70 to -39.
- Between x 92 and x 146 (the railway cut and the buildings over it) the map has nothing in these categories.

## What the game took from this, and what it left

Where each thing is decided: `src/groundsplan.js` (it reads the map's positions from `src/groundsdata.js`, which `node tools/build_groundsdata.mjs` writes from the survey). Drawn by `src/trees.js` (everything that grows) and `src/parkdress.js` (what stands); the benches and bins go out with the streets' own (`src/streets.js`).

Taken as it is, at the real positions (west of Columbus Drive, wherever the game has open ground there):

- The map's trees: the Columbus Drive pavement trees and the double row beside them, the row along Monroe Street by the Modern Wing, the gardens' trees. The game's own grid of hawthorns in the South Garden already stood on Kiley's 20 ft spacing; the trees over the entrance beds and the south bed are now honey locusts, as he had them.
- The gardens' benches (each turned to face into its garden), the North Garden's flagpoles, the map's hedges (the privet round the South Garden's entrance beds, the long double hedge on the Monroe Street side, the Michigan Avenue frontage), and its planted beds, filled with grasses, seed heads and roses left standing as Lurie Garden's are, and privet under the South Garden's locusts.
- Small trees in the Michigan Avenue median's pits.

Taken as a pattern, not a position:

- Butler Field's frame of trees. The game's field is squeezed and most of it is given to the light show, the sled hill, the jump park and the diamonds, so the frame is one to three rows deep where the real one is five: elms outside, lindens inside (the lindens replaced the field's elms in 1978).
- The lakefront: honey locusts in the promenade's paving on the Drive's side, a life ring every so often along the wall, a mile post and the trail's signs, a drinking fountain, a dock of hire bicycles at the south end where the real one is.
- Rows of American elms either side of the railway cutting and lindens along the long path, on the game's lawns west of Columbus Drive. Those lawns are not real ground (galleries and the rail yards are there), so they are dressed in Grant Park's own vocabulary: elm rows, lindens, crabapples, a ginkgo or two, river birch in clumps, red-twig dogwood, viburnum, grasses.
- Urns on piers and runs of balustrade at the path's bridge over the railway, after the park's Beaux-Arts bridges.
- The park's twin-globe lamp, a cast foot on every plain lamp post, low posts and chain, boulders with a plaque (one remembers the field's elms), salt boxes, picnic tables, drinking fountains bagged for the winter.

Left out, and why:

- A boatyard. Monroe Harbor's boats winter at other harbours; the game has only three boats under shrink wrap and a rack of dinghies ashore by the promenade, as the few that stayed.
- Ladders down the harbour wall: the game's wall is a stepped revetment, which needs none.
- Lane paint on the trail: not confirmed for the real trail, and the promenade carries the harbour race's own marks.
- Maggie Daley Park, the Cancer Survivors' Garden, the yacht clubs: all north of Monroe Street, outside the game's world.
- The real courtyard's hedge blocks (the game has its rink there), the four flagpoles before the Michigan Avenue doors (the game starts there), the Michigan Avenue bike racks (the far pavement is the game's wall of shopfronts).
- Whatever would have stood on ground a feature, a race, a way in or a work of art needs: nothing is planted within 6 m of a sculpture or a fountain.

Counts as built: 508 trees (127 honey locust, 125 American elm, 115 linden, 75 cockspur hawthorn, 37 crabapple, 26 river birch stems in clumps, 3 ginkgo), of which 229 are new places; 798 shrubs and clumps (230 grass, 167 seed heads, 139 red-twig dogwood, 105 rose, 71 viburnum, 31 hydrangea, 22 yew, 18 arborvitae, 15 privet); 19 more lengths of clipped hedge; ivy and groundcover along 613 m of wall foot; 44 tree guards; 20 benches; 11 twin-globe lamps.

## Sources

- OpenStreetMap, via the Overpass API (overpass-api.de). Map data © OpenStreetMap contributors, ODbL
- The Cultural Landscape Foundation, South Garden: https://www.tclf.org/art-institute-chicago-south-garden
- The Cultural Landscape Foundation, Kiley legacy page: https://www.tclf.org/sites/default/files/microsites/kiley-legacy/ArtInstChicago.html
- ASLA 2015 Landmark Award, South Garden: https://www.asla.org/2015awards/95761.html
- OLIN, Stanley McCormick Memorial Court (page did not load; quoted from search results): https://www.theolinstudio.com/art-institute-of-chicago-stanley-mccormick-memorial-court
- Chicago Park District, Large Interior Form and Cubi VII: https://www.chicagoparkdistrict.com/parks-facilities/large-interior-form-artwork , https://www.chicagoparkdistrict.com/parks-facilities/cubi-vii-artwork
- Wikipedia, Lions (Kemeys): https://en.wikipedia.org/wiki/Lions_(Kemeys)
- Governing, "Paris on the Prairie" (street lamps): https://www.governing.com/archive/paris-prairie.html
- WBEZ, Michigan Avenue planters in winter: https://www.wbez.org/stories/what-happens-to-the-colorful-plants-along-the-mag-mile-in-the-winter/052473f9-1efe-4fff-b74a-6604d49dd6d3
- WTTW, Ask Geoffrey (medians): https://news.wttw.com/2015/05/20/ask-geoffrey-520
- National Register of Historic Places nomination, Grant Park (ref. 92001075), text: https://archive.org/stream/NationalRegisterNominationsForChicago/GrantPkNrNom_djvu.txt
- The Cultural Landscape Foundation, Grant Park: https://www.tclf.org/grant-park-il
- Wikipedia, Grant Park (Chicago): https://en.wikipedia.org/wiki/Grant_Park_(Chicago)
- Chicago Park District, Grant Park: https://www.chicagoparkdistrict.com/parks-facilities/grant-ulysses-park
- Wikipedia, Petrillo Music Shell: https://en.wikipedia.org/wiki/Petrillo_Music_Shell
- Wikipedia, Maggie Daley Park: https://en.wikipedia.org/wiki/Maggie_Daley_Park
- Chicago Park District, Federal Building Columns: https://www.chicagoparkdistrict.com/parks-facilities/federal-building-columns
- Lurie Garden, garden features: https://www.luriegarden.org/about/garden-features/
- Lurie Garden, "It's time to cut down the garden": https://www.luriegarden.org/its-time-to-cut-down-the-garden/
- Garden in a City, Lurie Garden in February: https://gardeninacity.com/2018/02/28/the-lurie-garden-in-february-2018/
- Chicago Harbors, Monroe Harbor: https://www.chicagoharbors.info/?p=172
- Chicago Harbors, winter storage: https://www.chicagoharbors.info/winter-storage/
- Chicago Yacht Club, history: https://www.chicagoyachtclub.org/history
- Wikipedia, MV Abegweit (1947): https://en.wikipedia.org/wiki/MV_Abegweit_(1947)
- Chicago Park District, Lakefront Trail: https://www.chicagoparkdistrict.com/lakefront-trail
- Wikipedia, Chicago Lakefront Trail: https://en.wikipedia.org/wiki/Chicago_Lakefront_Trail
- Morton Arboretum, trees and plants (winter habit): https://mortonarb.org/plant-and-protect/trees-and-plants/cockspur-hawthorn
