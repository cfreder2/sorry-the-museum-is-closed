# Sorry, the Museum is Closed

The Art Institute of Chicago after closing, driven through by a toy RC car or
flown through by a toy RC drone. Every work is real: public domain, on view
today, pulled from the museum's open API, shown at its true size in the gallery
the museum lists it in. The aim is to see as much of it as you can.

Play it: <https://cfreder2.github.io/sorry-the-museum-is-closed/>

(First called After Hours. Saved games still use that name internally.)

## Run it locally

It is plain ES modules with no build step, so it only needs a web server:

    python3 -m http.server 8791 --directory .

then open <http://localhost:8791>.

## How true the building is

The building has its four public levels, one over another at their real
heights: the lower level 4.6 m below the street, the first floor at street
level, the second 5.2 m up and the third (the top of the Modern Wing) at
11.3 m. Those heights are from the architect's section of the Modern Wing.

The rooms are the real ones. `tools/build_layout.mjs` builds the plan from the
survey in `survey/`: the Modern Wing traced from the architect's plans, the
older buildings from the museum's visitor maps fitted to the mapped outline,
and the offices, stores, workshops and plant assumed for the space that is
left (see `survey/README.md` for what each is drawn from and how far to trust
it). That is 436 rooms on four levels, about 65,000 m² of floor, in the
building's own 246 m square.

- **Public rooms** are where they are in the building and open into their
  neighbours.
- **Back-of-house** rooms are named for what they are assumed to be and open
  off service corridors. Their extent is real; their uses are a guess.

You get from one level to another the way a toy car would have to:

- **Stairs with planks on them.** Somebody has been in here with plywood. Every
  flight is real steps with a sheet laid up it, arrows running uphill, and a
  rail down each side so it can be taken at speed. None is steeper than about
  one in three.
- **The Grand Staircase** (Gallery 200) is one hall from the lobby floor to the
  skylight over the second floor. A wide flight goes up to a landing, two
  flights come back from the landing to the gallery that runs round the well,
  and the second-floor corridors open onto that gallery. A fourth flight goes
  down to the lower lobby.
- **Griffin Court** is three storeys, 97 m long and under 9 m wide. Its stair
  climbs the east wall to the second-floor balcony, and a bridge crosses its
  north end on each upper floor.
- **Stair towers** in the Modern Wing have switchback flights with a landing
  across each end, from the basement to the third floor.
- **The Sculpture Court** is two storeys, with Gallery 261 as the balcony
  round it.
- **Lifts** are open platforms in a cage of four posts. Drive on and it goes;
  wait at its gate on another floor and it comes for you. The gate at each
  stop is shut whenever the platform is somewhere else.
- **Floors are solid.** A car cannot jump through a ceiling and a drone cannot
  fly through a floor; the only ways through are the stair wells, the lift
  shafts and the open air of the two tall halls.

The round map in the corner turns with you and shows the level you are on,
with its stairs hatched and its lifts solid. Touch it (or press G) for the
whole building, a level at a time, opened on the level you are on with a
★ where you are. Tap a room there for its card (what is in it, how much of it
you have seen) and Show the way lights the way to it, on the big map and on the round one, across stairs and lifts. `node tools/check_layout.mjs` proves that every room on every
level can be driven to from the front door.

You start outside on Michigan Avenue, between the lions, and the doors are
locked: a sign on the front door says so. The way in is right at the door and
hard to miss: for the car, an aluminium air duct at the foot of the wall just
left of the doors, its grille swung open and arrows on the pavement running
into it; for the drone, the fanlight over the doors standing open (a pane of
the skylight over the Grand Staircase is open too). Both lead into the lobby
on the first floor, with the Grand Staircase straight ahead. Once you are in,
every outside door unlocks for good. Hints appear if you stay outside a while.

## Driving on a phone

On a phone the car drives for you. Hold a thumb down on the left and it goes
at an easy pace; slide the thumb to steer; let go and it pulls up. Push the
thumb forward for speed; pull it back to brake and then back up. When you are
near a work a gold LOOK button with an eye appears beside JUMP. Steering help
eases the car away from walls and backs it out when it is stuck nose-first
against one; it stands down on stairs, ramps and lifts. Both are switches
under Settings, Driving: with "Drive for me" off the stick is the throttle as
well. On a keyboard or a gamepad both start off.

## Secrets

Everything in the building that is not a room or a picture is a secret: the
card game, the toy stall, the picture on its easel, the hockey pond, the big
red button, the easel in the studio, every monitor somebody left switched on,
and a pedestal with four lit pads under the coloured roof of Griffin Court.
Nothing says where they are. The screen counts them, "secrets 3 / 21", and
each one found is announced. (The whiteboards count as one between them, and
three of the twenty-one this file is not going to describe.)

The pedestal plays a pattern of colours and you play it back; it adds one each
time. Get five right and the roof lets go: confetti in the colours of all 126
panes comes down the length of the court.

## Playing on the thing itself

A game on a monitor, the pads on the pedestal and the canvas on the easel are
played where they are. The camera goes and stands square in front of the
thing, as it does for a painting, with the building still round it, and what
you touch on the glass is the monitor's screen, the pad or the canvas. Only
the controls that have nowhere else to be (a direction pad, LEAVE, the paint
pots) stay on the page.

## The parcels under the tree

The five parcels under the tree in the yard can be opened: pull up to one and
the button says OPEN. The wrapping comes off and the box stands open. One has
a car in it, the Candy Cane Express: red trimmed in white, candy-cane bars,
a string of coloured bulbs down each side, a wreath on the grille and a small
lit tree in the bed. The others hold what parcels hold.

## Your own picture

One big gilt frame hangs in the Michigan Avenue lobby, where everybody comes
in, and it is empty: ARTWORK IN PROGRESS, it says, in a studio of the Ryan
Learning Center. Look at it and the way to the studio lights up. At the easel
there the button says PAINT, and you get a paint program of the old sort:
twenty colours, four brushes, a bucket, a rubber and undo. Give it a title,
press Hang it, and it hangs in the lobby frame. It is kept on your device and
goes nowhere else; a new game leaves it up.

## The toy stall

On the roof beside the card game somebody has set up a stall under a striped
awning. Two toys turn on their stands: a Supercar and a chrome flying wing
called the Manta. Each costs 2,000 chips, and the only chips there are are the
ones on the card table, where you sit down with 1,000. Pull up at the counter
and the button says SHOP. Nothing else unlocks them.

## The outside

The outside follows photographs of the building (Wikimedia Commons) and the
map (OpenStreetMap), placed in the same frame as the galleries:

- **The Michigan Avenue front.** One long wall of grey limestone with a banded
  lower storey and a row of arched niches above, the entrance pavilion stepping
  forward in the middle with three arches, columns, the museum's name across
  the top and banners between the doors. The two lions, green with verdigris,
  stand either side. The entrance is on the axis of Adams Street, where the
  real one is.
- **The block.** Michigan Avenue to the west, Monroe to the north, Columbus to
  the east and Jackson to the south, at their mapped positions.
- **The streets, from 40 cm up** (`src/streetscape.js`). Pavements of
  Chicago concrete in 1.5 m slabs with tooled joints and a broom finish,
  granite kerbs with a rounded nose and a concrete gutter, ramped with yellow
  tactile pads at every crosswalk; asphalt with its aggregate, tar seams,
  sealed cracks and patches; ladder crosswalks, double yellow lines and worn
  lane dashes laid to the lanes the traffic drives in; wet tyre tracks through
  the slush, snow ploughed into the gutters, salt, footprints, manhole covers,
  storm drains and iron tree grates. Every bench out of doors (the streets,
  Butler Field, the lakefront) is the same cast iron and slats with the
  night's snow on them, backless by the softball diamonds; a car fits under
  the seat between the ends, and a held hop puts it on the seat. The litter
  bins are the parks' green steel drums with a liner and a domed lid, snow
  heaped on it, and the lid is a top to land on.
- **Parked cars, snowed in** (`src/parked.js`), along the far side of
  Michigan Avenue and the kerbs of Monroe and Jackson: the traffic's own
  saloons, hatchbacks, SUVs and pickups under a thick rounded blanket of snow,
  drifted to one side, with the plough's heap half over the wheels, a
  windscreen or two scraped clear and a ticket under the wiper. They are solid
  as drawn: the body stops a car at the paint (and the heap at the heap), and
  the snow on top is a way to drive. Hop onto the bonnet, climb the
  windscreen, cross the roof, run down onto the boot and off.
- **The railway** runs north to south in its cutting and under the galleries
  that bridge it (240 to 249), with a commuter train stopped for the night.
- **The gardens.** The North Garden with its rows of trees and Calder's red
  *Flying Dragon*; the South Garden with its grid of hawthorns, the long pool
  (frozen, and slippery) and the Fountain of the Great Lakes against the Morton
  Wing.
- **The Modern Wing** has its flat sunshade on thin white columns, and the
  Nichols Bridgeway leaves its roof for Millennium Park.
- **From the air** every skylit gallery shows its skylight.

## Winter in the grounds

- **The snow.** It glitters as you move past it, and the car leaves its tyre
  tracks in it and throws a little up behind. Paths are shovelled through it:
  across both gardens, over the railway, into the courtyard and round to the
  skate park. Streets and paths grip; snow slides; the frozen pool does not
  hold at all.
- **The courtyard** that Griffin Court's south door opens on has the tree:
  eleven and a half metres of it, lit, with a star, and parcels underneath.
  The car fits under the lowest branches.
- **Fountains are off for the winter**, each with a board saying so: the
  Fountain of the Great Lakes, Carl Milles's Fountain of the Tritons in the
  courtyard, and a bowl fountain in the North Garden. Snow lies where the water
  was and ice hangs from the shells.
- **Sculpture outdoors.** With Calder's *Flying Dragon* in the North Garden
  stand Henry Moore's *Large Interior Form* and David Smith's *Cubi VII*; the
  entrance arch of Adler and Sullivan's Chicago Stock Exchange stands at the
  north-east corner, and can be driven or flown through; the lions wear their
  December wreaths. Each is named the first time you come up to it. The
  bronzes are modelled in `src/statues.js` the way a sculptor builds a figure,
  from lumps of clay run together (`src/sculpt.js` blends them and skins the
  result), so the lions have manes and muzzles, the five women of the Great
  Lakes sit on their rock holding their shells, and the Moore is pierced
  through. They are made from memory of the real things, not measured.
- **Snowmen.** Eleven of them, about the grounds. Drive through one and it
  comes apart. They are counted.
- **The skate park**, beside the loop: a swimming pool with the water let out,
  tiled blue, three of its walls curved to carve up and its shallow end open to
  roll in by, with a ramp up onto the side to drop in from; a plywood
  half-pipe; and humps of banked-up snow on the paths.

## Buildings, ways in, and the roof

- **Each building has its own wall.** The 1893 building is limestone in
  courses with tall arched windows; the galleries over the railway are riveted
  steel with a row of small lit windows; the buildings east of the tracks are
  smooth pale stone with dark strips of glass; the Modern Wing is tall narrow
  panels between white fins; the old first floor is brick. (The lower level
  is under the ground now and has no outside.) These are impressions, not
  surveys of the real elevations.
- **More ways in.** Besides the duct by the front doors there are five more
  low openings for a car, each a different thing left open: a delivery shutter
  not quite pulled down (on the Stock Exchange Trading Room), a second duct in
  the courtyard, a service door with its bottom panel kicked in, and two low
  windows propped open. Each is at street level and leads into a first-floor
  room. For anything that flies, three skylights stand open instead of one,
  each over a room with nothing but sky above it.
- **Every roof is a floor.** A drone can land on any of them. For the car a
  builders' scaffold goes up the south wall of Gallery 211, by the South
  Garden: four flights with guard rails, turn and turn about (the roof is two
  storeys up now, 13 m), and a landing level with the roof.
  Roofs of the same height run into one another; a taller neighbour is a wall
  and a lower one a drop. Skylight glass stands proud and can be hopped onto.
  Drive into an open skylight and you come down inside.
- **The card game.** On the roof at the top of the scaffold stands C. M.
  Coolidge's *A Friend in Need* (1903), the dogs at their poker, on an easel
  under strings of Christmas lights. In front of it three toy cars and two
  drones are playing no-limit Texas hold'em at a baize table, with one place
  empty. Pull up and press `E` (PLAY on a phone) to sit in. Everybody starts
  with $1,000; blinds are $10 and $20. `F` folds, `C` checks or calls, `R`
  raises (arrow keys change the amount), `A` is all in, `Esc` leaves. Stacks
  are kept between visits; if you are cleaned out the table stakes you again,
  and if you clean everybody else out they buy back in. The rules and the
  players are in `src/holdem.js`: each opponent deals out the rest of the hand
  a hundred and twenty times to see how often it would win, and has its own
  temper (one waits for a hand, one bets at everything). The painting is not
  the museum's; the image is from Wikimedia Commons and is in the public
  domain.
- **Jingle Bells** plays on bells from the courtyard tree, louder as you come
  nearer; it follows the music volume.
- **Hills.** The open ground is no longer flat: two big hills (one north of
  the building by the railway, one in the south-east corner) and eight low
  swells, wherever there is room clear of buildings, paths and streets. A hill
  pulls a car down its slope, so one left on the side of it rolls. Each big
  hill has a kicker of packed snow on its summit: go over the top with speed
  and you fly, and come down rolling on the far side. Tyre tracks and the
  glitter follow the slopes.
- **The lie of the land.** Between the paths the lawns are not levelled: the
  open ground of the block, the North Garden's lawn panels and the open
  lawn of Butler Field roll in long low swells and soft hollows, up to about
  a metre, never steeper than one in five. It is flat on and near anything
  that needs flat ground (streets, pavements, paths, plazas, the building,
  the railway, the ice, the kit, the hills, the lamps, the formal South
  Garden, the Modern Wing's forecourt, and the light show, the jump park, the
  sled hill and the ball field on Butler Field), and rises out of it over six
  metres. One height field (`src/land.js`) is what the wheels and the drone's
  floor follow and what the snow, the glitter and the tyre tracks are drawn
  on; trees stand on it. Anything new laid out flat on open ground at start-up
  goes in its `FLAT` list.
- **The ski jump.** A long bank of snow runs up against the north wall of the
  galleries over the railway and stands higher than their roof. Take it flat
  out and you land on the roof.
- **Ice is ice.** On the frozen pool and the pond the wheels spin, the brakes
  do little, and the car carries on the way it was going while it turns: from
  the same speed it takes five times as far to stop as on snow.
- **Pond hockey.** North of the building, between the garden and the railway,
  is a frozen pond with a goal at each end and a puck. A blue toy car waits in
  front of its goal; touch the puck and it wakes up. You shoot east, it shoots
  west, first to five. The score is kept in pegs of light on a board on the
  scorer's table on the north bank. The puck is bright orange and lights the
  ice round it. The blue car is slower than yours, lines its shots up roughly
  and stops to think after every touch. Leave the pond and the game is off:
  everything goes back to its place and the score to nothing.
- **The train** in the cutting is a diesel and two double-deck gallery cars
  standing on wheels on rails, with frames, tanks and bogies underneath; it is
  solid from the rail up.

Where this departs from the real thing: there is no flight of steps up to the
door (the first floor is at street level here); the front wall has a plain
attic over its cornice, to stand as high as the two storeys behind it; the
names on the frieze are a representative roll of old masters, not a
transcription; sculpture outdoors is suggested with simple shapes. No usable
close aerial photograph was found, so the roofs are from the map outline.

What is not true:

- **Doorways are placed by rule, not surveyed.** Rooms that stand wall to wall
  on a level get one, in the middle of the wall they share. The real building
  has fewer, and not always there.
- **The older buildings are good to about a metre**, not to a wall's
  thickness: they come from the visitor maps, not from an architect's plan.
  The first-floor rooms east of the railway are the roughest.
- **Back-of-house uses are assumed.** Which wing does what is known; which
  room is which is not on any public drawing.
- **Clear heights in the older buildings are guessed.** A room under another
  stops half a metre short of that room's floor.
- **Some ways between levels are invented**: where a group of rooms had no
  surveyed stair or lift, a lift or a flight is put where one room lies over
  another. The tool prints which.
- **McKinlock Court and the Bluhm Family Terrace are roofed**; the real ones
  are open to the sky. The Pritzker Garden is open ground.
- **Griffin Court's roof is from one photograph.** It has the real roof's 126
  panes, two abreast and sixty-three along, warm colours down the west side
  and cool down the east. The order at the south end is read from a
  photograph; further north it is carried on by repeating it.
- **Empty galleries borrow from their neighbours.** A gallery the museum
  lists nothing on view for is hung with works its nearest galleries have more
  of than they can show. Each borrowed work's label names the gallery it
  really hangs in.
- **Where things hang within a room is mine.** Paintings are arranged along
  the walls by importance and size; sculpture, armour and vessels stand in
  glass cases on the floor. In the Grand Staircase everything is on the
  first-floor level, under the gallery; nothing is hung on the gallery itself.
- **What is under the building is invented**, all of it: nothing below the
  lower level comes from any drawing or survey, and the survey in `survey/`
  does not have it. Neither does the real building have the one small extra
  tower that goes with it. It is there for the fun of finding it.
- **The polish on the floors** mirrors only on the level you are on. Floors
  seen on another level (down a stair well, across a tall hall) are matt.

## The sledding hill

The south-west quarter of Butler Field, between the cross path and the band
shell, is a sledding hill of the kind every Chicago park piles up: seven and a
half metres of snow with a flat top, a warming hut and a string of lights round
it, timber steps up the steep north face for people, a packed path up the west
flank for anything on wheels (lanterns along it), bare trees and buried bushes
on its sides, drifts the wind has laid on it, sled tracks down every face, and
toboggans and saucers left lying about. Down its south-east face winds a sled
run: a gate at the top, a drop, a banked hairpin, a kicker, a second hairpin,
a tunnel through a big drift (which can be driven over too), a banked turn, a
second kicker and the finish, with a snow fence across the run-out.

The run is ridden on a sled, not driven. A toy's toboggan waits at the gate:
pull up and press `E` (SLED on a phone) and the car, or the drone, sits in it.
The engine does nothing now. Gravity takes the sled down; packed snow lets it
run, the banks hold it round the turns, a crest throws it in the air, and a
stake or the fence knocks it about. Steering is leaning, left and right, a
little late and gentler the slower it goes; leaning back drags a heel; stopped
dead, a push forward shoves off. Over the line (or off the run) the toy hops off
and drives again, the sled left where it stopped and a fresh one at the gate.
The clock starts as the sled leaves the gate, and the best time is kept.

The hill is one heightfield (`src/sledland.js`): the run and the path are laid
in as ribbons with their own cross-sections, banks included, and a membrane is
stretched over them for the shoulders. The car drives on a smooth surface
through the same points the mesh is drawn from, so the two never part by more
than a centimetre or so on anything that is driven.

## Winter Wonderland on Butler Field

Across Columbus Drive from the Modern Wing, the north-west quarter of Butler
Field is a drive-through Christmas light show, made after the big ones
(Chicago's ZooLights, the botanic gardens' light walks, the drive-through
shows with a tunnel, a singing tree and a radio station of carols). One
ploughed way winds through it, packed snow with the snow banked up either side
and a rope light on stakes along it, and driving it against the clock is the
**Light Run**. The ground does nothing; what lights it is what stands round it:

- the **Grand Arch**, where the clock starts;
- the **Tunnel of Lights**, forty arches over the way, each wrapped in three
  strands of mini lights a hand's breadth apart: white, then every colour, then
  gold, as the long tunnels at the zoos go. Light chases round the arches and
  runs along with the car;
- three **Candy Cane Curves**, banked hairpins, with red and white lights along
  the crest to ride high on and giant canes round the outside;
- the **Snowflake Cathedral**, pointed arches six and a half metres high, a
  vault of lights that sparkle with the tune, icicles dripping light and
  snowflakes turning under the roof;
- the **Gift Box Jump**, a red present to take off from and a green one to
  land on;
- the **Nutcracker Guard**, six soldiers five metres tall, who salute as you
  pass;
- the **Light Bridge**, with a gap in the middle to jump;
- the **Candy Cane Tunnel**, red and white winding round its arches, past the
  **Ice Palace** and the **Penguin Slide** (the penguins slide down it and
  waddle back up), and round a hairpin through the **Kaleidoscope Tunnel**,
  whose colours turn mirrored about the top of each arch;
- round the **Singing Tree**, eighteen metres of lights with a face on it that
  sings the tune and looks at you, and a train going round its foot, to the
  finish.

Twelve glowing ornaments hang along the way (high on the curves, over the
gaps, in the tunnels, on the train): the screen counts them during a run. A
sleigh and four reindeer fly round over it all, and reindeer graze in the
middle. Two secrets: finish the run, and take every
ornament in one run. The best time is kept, for the car and for the drone.

The show plays a medley of carols, every one published before 1900, made in
the game note by note (nothing recorded), heard only near the field and as
loud as the music slider (Settings, Gallery music, turns it off with the
rest): *Jingle Bells* (Pierpont, 1857), *Deck the Hall* (Welsh air, these
words 1862), *We Wish You a Merry Christmas* (West Country carol), *Joy to
the World* (Watts 1719, Mason 1839), *Hark! The Herald Angels Sing*
(Mendelssohn 1840, Cummings 1855), *O Christmas Tree* (Anschütz 1824) and
*Good King Wenceslas* (Neale 1853, to a tune printed in 1582). Each is
written down as its melody and a chord chart (`src/carols.js`); the band (a
reed lead, glockenspiel, plucked bass, off-beat chords, a soft kick, sleigh
bells and a tubular bell) is laid on from those. Each tune counts in with a
bar of sleigh bells in the dark, and the lights come up together on its
first downbeat. Every light in the show keeps time with it: the tree's
patterns change every four bars, the tunnels pulse on the beat, the vault
sparkles more as the tune climbs. With *Reduce motion
and flashing* on, nothing flashes and everything moves slowly.

All of it is drawn by one instanced mesh of fifty thousand bulbs, each the
size of a real mini light (and never drawn smaller than about a pixel, so a far
string still reads as a line of light), and a few merged meshes of wire; each bulb's behaviour is worked out in its vertex
shader from a handful of numbers set once a frame (the beat, the bar, the
note, where the car is). Nothing is rebuilt or allocated per frame, and
none of it runs when you are not near.

### The ballpark and the Home Run Derby

The south-east quarter of Butler Field has four softball diamonds under the
snow. The north-west one is a ballpark, ploughed and lit for a night game
(`src/ballpark.js`):

- **Lit.** Six light towers, steel masts eighteen metres high with a bank of
  fifteen floodlights on each, aimed at the field, with a haze round each bank
  and a faint beam down through the falling snow. The light is drawn into the
  field's own ground, and a soft pool of it lies on the snow round about.
- **Ploughed.** The infield is cleared to frozen clay: the bases, the plate,
  a raised mound with its pitcher's plate, the batter's and catcher's boxes,
  the circle round the mound and the foul lines in chalk. The outfield snow
  is rolled in a checker, as a groundsman mows grass, out to a clay warning
  track.
- **Walled.** The outfield wall stands 40 m down the lines and 68 m out in
  centre field, 1.4 m high (a fantasy distance for a 46 cm toy: the derby's
  snowballs fly as far as they need to). It is padded, with the yellow
  home-run line along its top, the distances in feet on it, a yellow foul
  pole at each end and a string of twinkling mini lights all along it. It is
  solid; a car with a good jump can clear it.
- **Dugouts** down both lines (roofed: drive in under, or land on top), a
  backstop behind the plate, a bleacher of three tiers down the first-base
  line with ten snowman fans on it, and a lit scoreboard out past the wall.
- **The centre field square.** A flat, clear 32 m square in centre field,
  inside the wall, is kept free of everything (`plan.grounds.silo`, set in
  `plan.js` with the rest of the ballpark's place, `lakefront.ballpark`).

**The derby.** A snowman stands on the mound with a cap, a mitt and a ball.
Pull into the batter's box beside the plate and press `E` (BAT on a phone):
he pitches ten snowballs, underhand, windmill style. Some come straight,
some are slow lobs and some are snow-curves that swing out and come back.
Swing with the jump (`Space`, SWING on a phone, a bumper on a pad): the car
hops and whips round, and its tail bats the ball. What decides the hit is
how far the ball is from the plate when the tail comes round: right on it
and it goes out of the park; a little off, a fly ball; more, a line drive,
then a grounder; too far, and it is a strike. Early pulls it towards third,
late pushes it towards first, and far enough off either way it is foul.
Snowballs burst into powder where they land. A home run sets the lights on
the wall racing out from where it went over, the fans jump, the crowd
cheers, the organ plays and fireworks go up. The screen keeps it short:
PITCH 4/10 · HR 2. The scoreboard keeps the best round and the length of
the last homer. Two secrets: the first home run, and five in a round.

## What is in it

- **Explore.** The building starts dark. Lamps come on as you reach them, each
  with its own note. A work counts as seen once you are close to it (a couple
  of metres for a small picture, about five for the largest), in front of it,
  with its lamp on. The display shows works seen
  out of the total, for the room you are in and for the whole museum, and what
  you have seen is remembered between visits: on coming back the title screen
  offers Continue, which puts you where you left off, or New game, which
  throws the old one away at once, without asking. Place cards are dark until the
  work has been seen. The map shows each room as not visited, visited with more
  to see (and how many), or finished. Press `E` at any work to leave
  the toy and stand in front of it like a person.
- **Race.** Two laps of the real ring of galleries round the Grand Staircase,
  on the second floor, against three other toys. The circuit keeps to that one
  level. The course (`src/course.js`) is laid on a grid of where a toy can
  really go: square through the middle of each doorway, round every wall,
  column, case, bench, stair and lift shaft, eased into curves, and straight
  over a jump on the line or not at all. It is painted on the floor with arrows
  running the way to go, as wide as the room allows, and the rest of the stunt
  kit is cleared away. The rivals are real cars (or drones) driven by a simple
  driver: each keeps a lane, slows for bends, queues in a doorway, backs off
  when it is nose-in to something, and is put back on the line if it is stuck
  for five seconds. The display shows place (`2nd of 4`), lap and lap time;
  crossing the line says `LAP 2 — FINAL LAP` or `FINISH — 2nd` with the split,
  and a place won or lost flashes `↑ 2nd` / `↓ 3rd`. Leave the track and the
  arrow turns gold and points the way back; stay off it for 4.5 seconds and you
  are put back where you left it.
- **Rooms stay open.** Stunt pieces and cases together cover a few per cent of
  a room's floor. Each piece either stands hard against a wall or leaves 1.7 m
  of clear floor, a clear lane is kept between every pair of doors, and doors
  are 4 m wide.
- **Sculpture in cases.** The museum photographs objects against a plain
  backdrop; `cutPixels` in `src/museum.js` removes the backdrop so the piece
  stands in its case as a cut-out that turns to face you. It fits a smooth
  surface to the backdrop from the margins of the photograph (in Lab colour),
  grows the backdrop in from the edge only where a pixel matches it and lies on
  no edge, and settles the outline with a watershed on edge strength. Anything
  the backdrop cannot reach is the piece, so a pale cheek or the highlight on a
  plaster head is never punched through; an opening such as a jug's handle is
  cut out only where it is plainly backdrop with a strong outline all round.
  Soft shadows and light on the floor go with the backdrop. Where no plain
  backdrop can be found the photograph is shown whole on a rounded card. That
  function is the one to replace when real 3D models exist.
- **A stunt kit.** The car has real gravity (9.8 m/s²) and `Space` makes it
  hop; hold `Space` in the air and steer to flip and spin. Pieces are placed to
  suit each room and never in front of a doorway or on the racing line:
  tabletops, funboxes, packing crates, table runs, and half-pipes against the
  walls of the larger galleries. A work never hangs behind a ramp: anything
  above one is hung higher, so the top of your air is in front of a picture.
  Off the lip of a skate ramp the car goes up and comes back down in an arc,
  turned round to roll down the ramp it left; off a spine (two ramps back to
  back) it goes over the top and down the other side. Throw a flip or a spin
  and bring it round square for a perfect landing, which keeps your speed.
  Griffin Court has a skyway of toy track slung from its glass roof, curved
  like the real thing, with gaps to clear. The Grand Staircase has a kicker on
  its landing, aimed back down the middle flight, and a hoop hung over the
  steps. Outside there is a loop-the-loop
  (either way round) and a big curved launcher. Cones and wet-floor signs are
  loose, the mopped floor is slippery, and so is the snow.
- **High places.** Ledges at the top of every skate ramp, two beside the
  skyway, table tops and the staircase landing are somewhere to land and look
  from. Hoops are counted too, but art is the objective.
- **Slow motion.** Leave a ramp with a work alongside and time slows to half,
  and that work is lit and named until you land. The car keeps its speed.
- **Stunt Looks.** Art is the goal, and the tricks are a way of looking at
  it. While the car is in the air (off a ramp or a drop, a hop at speed, or
  with a flip or spin going), or while either toy goes through a hoop, a work
  that is close and plainly in view is caught: STUNT LOOK, its title, and
  points when the wheels are down. The camera stays with the car but swings
  round to keep the work in frame, and comes back behind once you land. It
  counts as seeing the work and as a look at it. See *Art Score* below for what it is worth.
- **Frames.** Each picture gets a moulding to suit its date and school:
  tabernacle and gilt-and-bole for the earliest, carved Baroque gilt, ebonised
  Dutch, Neoclassical, swept Salon gilt, walnut, oak, thin modern strips, and
  the plain white Seurat wanted.
- **The drone** can go outside and over the roofs.

The title screen has two choices, Vehicle and Game mode, set to RC Car and
Explore; press Start (or Enter). On a phone the whole menu is six things to
tap: the two choices, Continue, New game, Settings and Trophies.

## Art Score, view counts, trophies and the garage

- **View counts.** Every time you look closer at a work it is counted, on
  the device. Driving past a work is not a look, and nor is a Stunt Look. The label says "You have looked at this 3
  times", and so does the notebook. Where the server can be asked, the label
  adds "Seen N times by everyone". A new game keeps these.
- **Art Score**, beside ART SEEN. 10 for looking closer at a work, 50 more the
  first time you look at it, nothing for driving past, and for a Stunt Look a base by what the car
  was doing (jump 100; more than 1.1 s of air 200; a flip or spin landed 300;
  through a hoop 400), times 2 in slow motion, times 2 for a work never seen
  before, times 1.5 for a perfect landing, halved for landing wrong way up.
  Several different works in one air are a combo: the second is worth double,
  the third triple. The same work cannot score a Stunt Look again for 90
  seconds. The numbers are `POINTS` at the top of `src/score.js`. A new game
  starts the score again.
- **Trophies**, console fashion: bronze, silver, gold, and one platinum for
  earning all the others. Mostly for seeing art (the first work, 10 to 500
  works, a whole room, a whole floor, a work on every level, the famous
  pictures), some for places (the Grand Staircase, Griffin Court's roof, and
  hidden ones back of house), a few for Stunt Looks, hoops, snowmen, the card
  game and the pond. A card slides in at the top left when one is earned; the
  Trophies screen is on the title screen and the pause menu. A trophy for a
  picture that is not in tonight's hang is left off the list. They are kept on
  the device and a new game does not take them away. The list is `TROPHIES`
  in `src/trophies.js`.
- **The garage.** Five cars and four drones. The Vehicle choice on the title
  screen goes through all of them; a locked one is shown as a silhouette with
  what it needs ("Look closely at 12 more works"). They unlock at 15, 25, 40, 60 and 100
  works looked at closely (driving past does not count), and two for trophies. (There is one more place in the selector,
  shown only as "???". It is not for sale.) Each is a different body and handles a
  little differently (top speed, grip, steering, hop; for a drone, pull, climb
  and turn); none climbs worse than the first. SWAP still goes between car and
  drone: the last one chosen of each. They are `VEHICLES` in `src/garage.js`.

With keys or a gamepad the controls are two sticks, like a toy transmitter. On
a phone one thumbstick under the left thumb drives the car (forward to go, the
further the faster; back to brake and reverse; lean to steer) and JUMP is under
the right; the drone gets the stick to fly and turn, and UP and DOWN buttons.
On a phone a work's label appears only when you tap LOOK, to one side, and
fades after a few seconds; INFO brings it back. Phones are played sideways.
The Controls link on the title screen lists everything.

## Back of house, fitted out

The rooms that are not galleries (offices, stores, studios, workshops, plant,
kitchens, the school, the auditoria, the service corridors: about 270 of them)
are furnished according to what their names say they are. A curators' office
has desks, filing cabinets and bookcases; a painting store has rolling mesh
racks hung with canvases; a conservation studio has easels, work tables, lamps
on arms and extraction trunks; the boiler room has boilers; the loading dock
has two vans backed up to it.

**All of it is assumed, not surveyed.** The survey gives a room's outline and
(often itself a guess, marked `assumed`) its name; nothing records what stands
in it. Each room is fitted out the way a room of that name in a large museum
generally is, and no piece of furniture is where a real one is.

It is all in `src/furnish.js`. At the top is `FITOUT`, a list of name patterns
and the recipe each selects; below it the recipes, a few lines each ("desks
either side of the aisle, bookcases and filing cabinets round the walls");
below that the items, each drawn from boxes and cylinders. To furnish another
kind of room, add a line to the list.

- Every doorway has 1.6 m clear in front of it, an aisle 1.4 m wide (1.2 m in a
  service corridor) runs the length of each room, and every doorway, stair,
  ramp and lift is joined to that aisle. Nothing stands on a stair, a ramp, a
  deck, a lift or a well.
- What is solid goes into the same list of obstacles as the gallery benches
  and the display cases, so it stops the car, and the drone at that height. A
  table is four legs and a top: the car goes under it between the legs, the
  drone cannot go through the top. What hangs from a ceiling (pipes, ducts,
  cable trays, strip lights) is not solid.
- The same rooms get the same furniture every time: the dice are seeded from
  the room's id.
- It is drawn as one mesh per material, per level, per 32 m patch of the
  building, and a mesh is drawn only while the camera is within about 30 m of
  it and on its level or the one above.
- Ways through are left clear: stairs, lifts, lobbies, balconies and the
  public corridors.

## Arcades and the heist

- **Somebody has left the monitors on.** Ten old monitors on low trolleys,
  each with a different game on it: Snake, Minesweeper, a bat-and-ball game,
  a wall of bricks, falling blocks, a shooting gallery of invaders, sliding
  numbers, a lamps puzzle, a memory game and noughts and crosses. They are in
  the rooms behind the galleries, on all four levels and in more than one
  wing: the laboratories first, then wherever else a screen might be left
  running. In its room it is the one screen that is lit, and it throws a
  green light on the floor. Pull up in front of it (or hover there) and press
  `E`, or PLAY on a phone. Keys: arrows or `W A S D`, `Space`, `F` to flag a
  mine, `R` to start again, `Esc` to leave. On glass: swipe, tap, hold to
  flag, and buttons beside the screen. Best scores are kept, and the display
  counts the arcades found. The games are in `src/arcadegames.js`, one class
  each, with no drawing library and no page under them, so their rules can be
  tested alone; which room has which is `ARCADE_ROOMS` in `src/furnish.js`.
- **The heist.** Each security control room (there are two, on the lower
  level) has a plinth with a big red button. Press it and the building names
  a gallery and a picture in it; say yes and a clock starts, a toy-sized copy
  of the picture appears on a plinth in the middle of that gallery, and the
  room fills with laser beams: fixed ones with a gap low down for a car and a
  gap higher up for a drone, curtains that blink, curtains that slide, one
  that turns about the plinth like a lighthouse, and a net over the top. An
  arrow points the way. Touch a beam and the alarm goes and you are put back
  at the doorway; three alarms are forgiven and the fourth ends it. Take the
  copy (drive up to it) and the beams deal themselves again for the way out;
  get it back to the button before the clock runs out. Heists done, clean
  runs and the best time for each room are kept. The real picture never
  leaves the wall. Not in a race. Pause has *Abandon the heist*.
  Every pattern is built from a seed out of pieces with known gaps and then
  proven before it is switched on: `solve` in `src/heistplan.js` searches the
  floor and the clock for a way a slow toy car can get from the doorway to
  the plinth, and back, without coming near a beam, and a pattern that fails
  is dealt again.

## Security robots

At night a few security robots patrol the galleries: squat wheeled things in a
pale shell with a navy band, a searchlight in the head, a beacon on top and a
copper prong. Each has its own beat, out along a short chain of galleries on
one level and back, stopping in each room to sweep its light about. They keep
to the floor a toy can drive (the same walls, doorways, cases, benches, stairs
and ramps) and never wait in a doorway.

- **What it sees is where its light falls.** The pool on the floor stops at
  the walls, and that is the whole of what it can see. Walls, columns and
  cases hide you; a bench or a box hides a car tucked close behind it. Your
  headlamp gives you away: lights off, it sees you at 6 m; lights on, at
  9.5 m, and sooner.
- **? then !** Stay in the light and a **?** comes up while it makes up its
  mind. Still there, and it is **!**: the light goes red and it comes for you.
  It is a good deal slower than the car (5.6 m/s against 9.5) but turns
  quicker. Out of its sight for three seconds and it gives up, goes to look
  where it saw you last, and goes back to its beat.
- **The bolt reaches 1.5 m.** Within that, its prong glows for half a second
  before it fires: time to swerve, or get something between you. Caught, you
  are zapped, carried out, and wake up in the dumpster by a back door, which
  throws you out over its lid. It keeps 50 chips. Nothing else is lost.
- Two trophies: one for the dumpster, one for shaking a robot off five times.
- Explore only: never in a race, and not during a heist. They stand still
  while you look at a work. On a phone there are three, otherwise six.
  Settings, Driving, has a switch to turn them off.

Their beats, the floor they drive on, what blocks their sight and the way
they find are in `src/guardplan.js` (no three.js, no DOM: it runs in node);
the robots, the bolt and the dumpster are in `src/guards.js`.

## Light switches

Beside every doorway, inside the room, there is a light switch: a plate at
the height a person wants it, and under it, at skirting height, a big rocker
with an amber pilot lamp for people 46 cm long. Pull up to either (or hover
there) and the action button reads LIGHTS (E on a keyboard).

A gallery still lights itself the first time you drive in, lamp by lamp, with
its chime; after that its switch puts it out, picture lamps and all, and
brings it back. Every other room (offices, stores, plant, corridors) is dark
until its switch is thrown, and then properly lit: cooler and whiter than a
gallery, the ceiling fittings glowing. The toy's own headlamp has its own
button, the lamp-and-beams sign at the top of the screen. Which rooms you left
on or off is kept between visits; a new game forgets it. In a race the
switches are dead.

No lights are added to do this. Every surface in the building already glows
a little in its own colour, and a room's working light is one more term of
that glow, scaled by the room's level. A room's own walls, trim and boards
take it as a uniform; the merged floors, the door surrounds and all the
furniture carry the number of the room each vertex stands in and look the
level up in a 512 x 1 texture. The plates and ceiling panels are instanced
boxes, one mesh to a 32 m patch, drawn only near the camera. It is all in
`src/lights.js`. A switch plate keeps within half a metre of its door jamb
and never sits over a picture, a label, another doorway or furniture.

## The conservation line

In a conservation studio there is a long low table with a belt across the
top. Pull up to it and the button reads REPAIR. Like the other games it is
played on the thing itself: the camera stands over the table, paintings come
along the belt in gilded frames, and you tap their blemishes (a scratch, a
flake, a tear, fly specks, a water stain, yellowed varnish) before they reach
the far end. A missed blemish and a tap on a good bit both count against you.
Every repair makes the belt faster and the paintings busier; once ten
blemishes have been resolved, the moment your accuracy is under 90% the shift
is over and Human Resources asks you to return tomorrow for remedial
training. The score is blemishes repaired in one shift. Keys work too: the
arrows choose a blemish, Space repairs it.

The paintings are real works from tonight's hang, public domain only, drawn
from the tiny preview in the collection data and replaced by a 400 px image
if one loads. The rules are in `src/repairgame.js` (no page, no three.js;
they run in node) and the rest in `src/repair.js`. It is a secret, and it
announces itself with a `museum:repair` event (`start`, `end`).
## Whiteboards, and something under the building

- **The staff have left their whiteboards written on.** Twenty-three of them, in
  the offices, the conservation studios and laboratories, the security rooms,
  the canteen, the school's studios and elsewhere, on every level: rotas, lists,
  a conservation checklist, the lost-property tally, and a good deal of
  grumbling about tyre marks and plywood. They hang low, where a toy can read
  them. Pull up in front of one and press `E` (READ on a phone) and you are stood
  square in front of it, with its words on the page as text for a screen reader. They are worth reading: the staff have noticed more about what
  goes on in here at night than they let on, and one or two of them know
  something they should not have written down. What each says is in
  `src/boardtext.js`.
- **There is something under the building.** It is not on the map. That is all
  this file has to say about it.

## Settings and access

Settings are on the title screen and the pause menu, and are remembered.

- Three volume sliders: everything, the toy motor, music and lamp chimes. `M` mutes.
- **Reduce motion and flashing** (on by default when the system asks for
  reduced motion): no slow motion, no swinging camera or speed zoom, lamps fade
  up instead of flickering, nothing pulses or scrolls.
- **Slow motion on jumps** can be turned off on its own.
- **Larger text, stronger contrast** for every label on solid backgrounds.
- **Hold my speed**: push forward once to keep going, pull back once to stop,
  so one hand can steer.
- **Security robots** can be switched off.
- Menus work from the keyboard with visible focus; `Esc` backs out. The game
  pauses when its tab is hidden.
- Room names, artwork titles, messages and the race countdown are announced to
  screen readers, and the look-closer label carries the museum's own written
  description of the work where it has one. Every sound cue has a visual twin.

Not done: remapping keys, and any way to play without sight.

## Telemetry

The game sends anonymous play statistics, so that it can be seen whether people
find the way in, how far round they get and what they stop to look at.

- **What is sent:** one row per session (time played, car or drone, phone or
  desktop, how and how soon the player got in, rooms entered, works seen, the
  frame rate, counts of hoops, snowmen and the like, and the settings in use),
  and a row for each of a few events: a game started, the way in, a room
  entered for the first time, a work looked at closely, a race finished, a roof
  reached, a hand of cards left, a hockey goal, a Stunt Look, a trophy earned,
  a vehicle unlocked.
- **View counts.** Each look at a work also adds one to that work's count for
  everybody (`supabase/003-views.sql`): the museum's id for the work and
  its title. Nothing about who looked is kept
  with the count. The counts are the one thing the game reads back, to say
  "Seen N times by everyone" on a label. A test never adds to them, and with
  the switch off they are neither added to nor asked for.
- **What is not:** no name, no email, nothing typed (nothing is typed in this
  game), nothing about where the player really is. The only position sent is
  the toy's, inside the game, when the session ends. The player is an
  anonymous identifier made on the device.
- **Turning it off:** Settings has a switch, *Send anonymous play statistics*;
  the About screen says it is there. Off, nothing at all is sent.
- **Where it goes:** the `museum_*` tables of the Supabase project the author's
  other games report to (`supabase/001-telemetry.sql`). Clients can only call
  two functions that clamp every field; nothing can be read back without the
  service key, except the per-work view counts, through one function that
  gives back counts and titles only. `003-views.sql` has been written but is
  not applied by anything here: run it on the project before the counts will
  work. Until then the label simply leaves that line out.
- **Tests are kept out of the numbers.** A browser driven by automation, a
  page where anything touched the test handle `window.__ah`, and a start from a
  test switch are all flagged, and every summary leaves them out. On localhost
  nothing is sent unless the address has `?telemetry`.
- **Reading it:** `node tools/telemetry.mjs` (add `--days 7`, or `--synthetic`
  for the test rows). It needs the service key, from `VECTRENCH_SUPABASE_KEY`
  or the Mac keychain entry the other games' tools use.

`BUILD` at the top of `src/main.js` is recorded with every row: change it when
publishing something worth telling apart in the numbers.

## The plan, as data

`src/layout.js` is written by a tool, and the engine only ever reads it, so a
better plan is a better file. What is in it:

- `levels`: the floor elevation of each level, metres above the street.
- `rooms`: each with its rectangle, `floor` (`LL`, `1`, `2`, `3`), `y` (its
  floor elevation) and `h` (its clear height above its own floor). A room
  taller than a storey just has a large `h`. Rooms on different levels overlap
  in plan; nothing in the engine takes a height from the name of a floor, only
  from `y`. Walls between rooms may be any thickness: a door spans the gap.
- `doors`: each with `y`, its sill. A door joins two rooms whose floors are at
  that height there, or a room and a deck in a tall room. `b: 'out'` doors are
  at the street.
- `decks`: a floor slab inside a tall room (`x0..z1`, `y`, `thick`, `rails`).
  Drivable on top, passable underneath, solid from the side.
- `ramps`: a sloping way between levels (`axis`, `y0` at the low-coordinate
  end, `y1` at the high, `stairs`). One that goes down through a floor cuts
  its own well in it.
- `lifts`: a platform (`x0..z1`, `stops`).
- A room or a doorway may be marked `secret`, and one doorway `hidden`: what
  section 8 of `tools/build_layout.mjs` adds after everything else, without
  moving anything that was there. `tools/check_layout.mjs` checks that such
  rooms are reached through the hidden doorway and through nothing else, and
  that nothing else is reached through them.

## The museum's API

**Works in copyright.** Besides the public-domain works, the game shows what
is on view but still in copyright (most of the Modern Wing). The museum's API
terms allow its data to be used "for noncommercial educational and personal
use and for fair use", keeping copyright notices and citing author and
source. So these works are loaded only live from the museum's own server, at
the size it serves (843 pixels wide at most), with the copyright notice on
each label and a link to the museum's page. They are never saved in this
repository or in the offline copy, and when the API cannot be reached they are
not shown at all. This is a non-commercial hobby project; a rights holder who
wants a work removed need only ask, and `SHOW_IN_COPYRIGHT` at the top of
`src/collection.js` turns every one of them off.

`src/collection.js` asks `api.artic.edu` for public-domain works on view: all
the paintings, sculpture and armour, vessels, ceramics, metalwork, glass,
furniture, prints, textiles and miniature rooms (about twenty-five requests, answer cached for twelve hours, well
inside the 60-a-minute limit). Each work goes to the room whose gallery it is
listed in. Images load from the museum's IIIF server at the sizes it recommends.
They are fetched, decoded and (for sculpture) cut out in a worker, and handed to
the graphics card one a frame, so a roomful arriving together cannot stop the
game; from outdoors only works near a door are fetched at all.

Three things the docs do not make obvious:

- The servers refuse any request that carries a `Referer` they do not know.
  `index.html` sets `<meta name="referrer" content="no-referrer">`; without it
  nothing loads.
- The docs ask for an `AIC-User-Agent` header with a project name and a contact
  email. It is sent with every API request; the address is `CONTACT` at the top
  of `src/collection.js`.
- Cloudflare turns away headless Chrome whatever it sends, so automated tests
  cannot load images from the museum. Use the offline copy below.

`node tools/build_layout.mjs` regenerates `src/layout.js`, the floor plan, from
the survey in `survey/`. `node tools/check_layout.mjs` then checks
that the plan is sound: every room and deck reached from the front door, no
doorway opening onto nothing, no ramp too steep. `node tools/fetch_collection.mjs` refreshes
`data/collection.json`, the saved copy the game falls back to when the API
cannot be reached. Add `--images` to also save every image to `data/img/`
(about 190 MB, not in git); when the
game is run from localhost and that folder has images, it uses them instead of
the museum's server.

`node tools/books.mjs` refreshes `data/books.json`: real books on the makers
the game hangs and on the periods and places their works come from, found on
Open Library (a User-Agent naming the game, one request at a time, every answer
kept in `tools/.cache/`, not in git, so a rerun asks nothing twice). The
reading room's display and the "Further reading" line on a label read it; the
covers come live from covers.openlibrary.org, only when a book is in front of
you, and a book with no cover is a cloth binding with its title in gilt.

URL switches, for testing: `?saved` skips the live API, `?remote` ignores the
offline images, `?mode=explore|race&toy=car|drone` skips the title (`toy` may also be any id
in `src/garage.js`, such as `truck`, which opens that one), `?auto`
lets a test driver run the race. The game object is `window.__ah`; a test can
drive by setting its `testInput` (what the sticks would send) and look from
anywhere by setting `testEye` (`{ at: [x, y, z], look: [x, y, z] }`).

## Layout

    index.html, style.css     page and on-screen display
    src/layout.js             the rooms, doorways, decks, ramps and lifts (generated by tools/build_layout.mjs)
    tools/check_layout.mjs    proves the plan can be driven all the way round
    src/plan.js               levels, collision, stunt kit, hanging, cases, race route (no three.js)
    src/collection.js         API calls and sorting works into rooms
    src/books.js, reading.js  books from Open Library: the reading room's display, further reading on labels (tools/books.mjs)
    src/museum.js             the building inside and out, the artworks, the lamps, cut-outs
    src/grounds.js            the Michigan Avenue front, streets, railway, gardens, Modern Wing roof
    src/land.js               the lie of the land: the one height field the open lawns roll on (no three.js)
    src/winter.js             paths, the courtyard tree, glitter, tyre tracks
    src/statues.js            the lions, the fountains and the sculpture outdoors
    src/butlerfield.js        Butler Field: the plough-pile jump park, the softball diamonds, lamps, the warming hut
    src/ballpark.js           the lit ballpark on Butler Field and its Home Run Derby against a snowman
    src/lightshow.js          the Winter Wonderland light show on Butler Field and its Light Run
    src/sledhill.js           the sledding hill on Butler Field: its run, tunnel, hut, steps, trees, and the sled you ride down it
    src/sledland.js           the hill's ground: one heightfield the car drives on and the mesh is drawn from (no three.js)
    src/carols.js             the carols it plays: scores, chord charts, the band, the player (no three.js, no DOM)
    src/glowkit.js            lights out of doors: instanced bulbs, figures drawn in glowing wire
    src/sculpt.js             clay: lumps blended on a grid and skinned into a mesh
    src/furnish.js            what stands in the rooms that are not galleries (assumed, not surveyed)
    src/geo.js                the small mesh builder both use
    src/textures.js           every surface, painted on a canvas at start-up
    src/reflect.js            polished-floor reflections, on the level you are on
    src/vehicles.js           the car and the drone
    src/course.js             the race course, laid round what is really there, and its check (no three.js)
    src/race.js               gates, laps, rivals
    src/props.js              loose cones and signs, and snowmen
    src/arcade.js             the monitors with games on them: the screens in the rooms, and playing one
    src/arcadegames.js        the ten games (no three.js, no DOM)
    src/lights.js             a light switch by every door, and each room's working lights
    src/repair.js             the conservation line: the table in the studio, and playing it
    src/repairgame.js         its rules (no three.js, no DOM)
    src/heist.js              the heist: the button, the beams, the clock
    src/guards.js             the security robots, the bolt, the dumpster
    src/guardplan.js          their beats, the floor they can drive, what they can see, the way they find (no three.js, no DOM)
    src/whiteboards.js        the whiteboards: the writing on them, and reading one
    src/boardtext.js          what each of them says (no three.js, no DOM)
    src/secret.js, secretclue.js, secretfit.js   what the whiteboards are not telling you
    src/heistplan.js          its target rooms, routes and beam patterns, and the proof each can be passed (no three.js, no DOM)
    src/input.js, audio.js    two sticks; all sound is synthesised
    src/main.js               camera, modes, slow motion, settings, loop
    src/score.js              Art Score, view counts, Stunt Looks
    src/trophies.js           the trophies, their screen and the card that slides in
    src/garage.js             the other cars and drones, and what unlocks them
    src/telemetry.js          anonymous play statistics (see Telemetry)
    supabase/                 the tables they go to
    tools/telemetry.mjs       the report
    vendor/                   three.js r170 (MIT)

## How it was made

[prompts.md](prompts.md) lists the prompts that built it, verbatim.

## Credit

Artwork images and data: the Art Institute of Chicago, <https://api.artic.edu>.
Positions of streets, gardens and the railway: © OpenStreetMap contributors.
Data is CC0; images used are those the museum marks public domain. This is a
fan project and is not affiliated with or endorsed by the museum.

Films on the screens in the auditoriums and lecture rooms (`FILMS` in
`src/cinema.js`) are streamed from Wikimedia Commons, not kept here. Each is
public domain or openly licensed, as its Commons page says, and its credit and
licence show under it while it plays:

- *Corner Madison and State Streets, Chicago* (1897), Edison; Library of Congress Paper Print Collection. Public domain.
- *The Enchanted Drawing* (1900), J. Stuart Blackton, Edison. Public domain.
- *Humorous Phases of Funny Faces* (1906), J. Stuart Blackton, Vitagraph. Public domain.
- *Fantasmagorie* (1908), Émile Cohl. Public domain.
- *Little Nemo* (1911) and *Gertie the Dinosaur* (1914), Winsor McCay. Public domain.
- *Chicago Photographed from Ray Knabenshue's Dirigible Air Ship* (1914), National Archives; the enhanced copy with 1914 recordings. Public domain.
- *Achter de schermen van het Rijksmuseum* (1950), Polygoon Hollands Nieuws, Netherlands Institute for Sound and Vision (Open Images). CC BY-SA 3.0 NL.
- *Brooklyn Museum Conservation Lab: An Unknown Girl* (2015), Brooklyn Museum. CC BY 3.0.
- *Time Lapse of Rotunda Floor & Art Protection* (2015), Architect of the Capitol. Public domain (US government work).
