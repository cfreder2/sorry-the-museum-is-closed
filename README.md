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

The API gives every gallery a latitude, a longitude and a floor.
`tools/build_layout.mjs` puts each gallery on its true spot and grows it until
it meets its neighbours, so the plan has the museum's real arrangement: the
ring of European painting galleries round the Grand Staircase, the
Impressionists running east along the bridge over the railway, medieval art and
arms and armour down the south arm, the Greek and Roman rooms round McKinlock
Court, the Modern Wing to the north-east. You start outside on Michigan Avenue,
between the lions, and the doors are locked: a sign on the front door says
so. There is a way in for the car (a ventilation grille has come off low on
the wall to the left of the entrance) and one for the drone (a pane of the
skylight over the Grand Staircase is propped open). Once you are in, every
outside door unlocks for good. Hints appear if you stay outside a while.

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
- **The railway** runs north to south in its cutting and under the galleries
  that bridge it (240 to 249), with a commuter train stopped for the night.
- **The gardens.** The North Garden with its rows of trees and Calder's red
  *Flying Dragon*; the South Garden with its grid of hawthorns, the long pool
  (frozen, and slippery) and the Fountain of the Great Lakes against the Morton
  Wing.
- **The Modern Wing** has its flat sunshade on thin white columns, and the
  Nichols Bridgeway leaves its roof for Millennium Park.
- **From the air** every skylit gallery shows its skylight.

Where this departs from the real thing: there is no flight of steps up to the
door (the galleries are on the ground here); the names on the frieze are a
representative roll of old masters, not a transcription; sculpture outdoors is
suggested with simple shapes; and the two unfolded floors stand where other
museum buildings really are (the first floor to the south-east, the lower level
at the Modern Wing's east end). No usable close aerial photograph was found, so
the roofs are from the map outline.

What is not true:

- **It is one level.** The second floor, where nearly all the paintings are,
  stays exactly where it is. First-floor and lower-level galleries that sit
  directly underneath it are moved out into two pavilions of their own, reached
  across the snow. Ground-floor rooms with nothing above them stay put.
- **Room shapes and doorways are guessed.** The API has a point for each
  gallery, not an outline. Rooms that end up wall to wall get a door.
- **Where things hang within a room is mine.** Paintings are arranged along
  the walls by importance and size; sculpture, armour and vessels stand in
  glass cases on the floor.
- **Two rooms are placed by hand:** Griffin Court (the API lists no art in it)
  and the passage the Thorne Miniature Rooms line.

## What is in it

- **Explore.** The building starts dark. Lamps come on as you reach them, each
  with its own note. A work counts as seen once you are close to it (a couple
  of metres for a small picture, about five for the largest), in front of it,
  with its lamp on. The display shows works seen
  out of the total, for the room you are in and for the whole museum, and what
  you have seen is remembered between visits: on coming back the title screen
  offers Continue, which puts you where you left off, or New game, which
  throws the old one away. Place cards are dark until the
  work has been seen. The map shows each room as not visited, visited with more
  to see (and how many), or finished. Press `E` at any work to leave
  the toy and stand in front of it like a person.
- **Race.** Two laps of the real ring of galleries round the Grand Staircase,
  against three other toys. The track is painted on the floor with arrows
  running the way to go, and the rest of the stunt kit is cleared away, leaving
  only the five jumps on the track. Leave the track and the arrow turns gold
  and points the way back; stay off it for 4.5 seconds and you are put back
  where you left it.
- **Rooms stay open.** Stunt pieces and cases together cover a few per cent of
  a room's floor. Each piece either stands hard against a wall or leaves 1.7 m
  of clear floor, a clear lane is kept between every pair of doors, and doors
  are 4 m wide.
- **Sculpture in cases.** The museum photographs objects against a plain
  backdrop; `cutOut` in `src/museum.js` removes the backdrop so the piece
  stands in its case as a cut-out that turns to face you. That function is the
  one to replace when real 3D models exist.
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
  like the real thing, with gaps to clear. The Grand Staircase room has a ramp,
  a landing and the steps to launch down. Outside there is a loop-the-loop
  (either way round) and a big curved launcher. Cones and wet-floor signs are
  loose, the mopped floor is slippery, and so is the snow.
- **High places.** Ledges at the top of every skate ramp, two beside the
  skyway, table tops and the staircase landing are somewhere to land and look
  from. Hoops are counted too, but art is the objective.
- **Slow motion.** Leave a ramp with a work alongside and time slows, the
  camera comes round, and that work is lit and named until you land.
- **Frames.** Each picture gets a moulding to suit its date and school:
  tabernacle and gilt-and-bole for the earliest, carved Baroque gilt, ebonised
  Dutch, Neoclassical, swept Salon gilt, walnut, oak, thin modern strips, and
  the plain white Seurat wanted.
- **The drone** can go outside and over the roofs.

The title screen has two choices, Vehicle and Game mode, set to RC Car and
Explore; press Start (or Enter).

With keys or a gamepad the controls are two sticks, like a toy transmitter. On
a phone one thumbstick under the left thumb drives the car (forward to go, the
further the faster; back to brake and reverse; lean to steer) and JUMP is under
the right; the drone gets the stick to fly and turn, and UP and DOWN buttons.
On a phone a work's label appears only when you tap LOOK, to one side, and
fades after a few seconds; INFO brings it back. Phones are played sideways.
The Controls link on the title screen lists everything.

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
- Menus work from the keyboard with visible focus; `Esc` backs out. The game
  pauses when its tab is hidden.
- Room names, artwork titles, messages and the race countdown are announced to
  screen readers, and the look-closer label carries the museum's own written
  description of the work where it has one. Every sound cue has a visual twin.

Not done: remapping keys, and any way to play without sight.

## The museum's API

`src/collection.js` asks `api.artic.edu` for public-domain works on view: all
the paintings, sculpture and armour, vessels, ceramics, metalwork, glass,
furniture, prints, textiles and miniature rooms (about twenty-five requests, answer cached for twelve hours, well
inside the 60-a-minute limit). Each work goes to the room whose gallery it is
listed in. Images load from the museum's IIIF server at the sizes it recommends.

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
the gallery records. `node tools/fetch_collection.mjs` refreshes
`data/collection.json`, the saved copy the game falls back to when the API
cannot be reached. Add `--images` to also save every image to `data/img/`
(about 190 MB, not in git); when the
game is run from localhost and that folder has images, it uses them instead of
the museum's server.

URL switches, for testing: `?saved` skips the live API, `?remote` ignores the
offline images, `?mode=explore|race&toy=car|drone` skips the title, `?auto`
lets a test driver run the race. The game object is `window.__ah`.

## Layout

    index.html, style.css     page and on-screen display
    src/layout.js             the rooms and doorways (generated by tools/build_layout.mjs)
    src/plan.js               collision, stunt kit, hanging, cases, race route (no three.js)
    src/collection.js         API calls and sorting works into rooms
    src/museum.js             the building inside and out, the artworks, the lamps, cut-outs
    src/grounds.js            the Michigan Avenue front, streets, railway, gardens, Modern Wing roof
    src/geo.js                the small mesh builder both use
    src/textures.js           every surface, painted on a canvas at start-up
    src/reflect.js            polished-floor reflections
    src/vehicles.js           the car and the drone
    src/race.js               gates, laps, rivals
    src/props.js              loose cones and signs
    src/input.js, audio.js    two sticks; all sound is synthesised
    src/main.js               camera, modes, slow motion, settings, loop
    vendor/                   three.js r170 (MIT)

## How it was made

[prompts.md](prompts.md) lists the prompts that built it, verbatim.

## Credit

Artwork images and data: the Art Institute of Chicago, <https://api.artic.edu>.
Positions of streets, gardens and the railway: © OpenStreetMap contributors.
Data is CC0; images used are those the museum marks public domain. This is a
fan project and is not affiliated with or endorsed by the museum.
