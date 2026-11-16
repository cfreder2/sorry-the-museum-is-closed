# After Hours

The Art Institute of Chicago after closing, driven through by a toy RC car or
flown through by a toy RC drone. Every work on the walls is real: public
domain, on view today, pulled from the museum's open API and hung at its true
size in a room carrying its real gallery number.

The floor plan is invented. The gallery numbers, the works and their
measurements are the museum's.

Play it: <https://cfreder2.github.io/after-hours/>

## Run it locally

It is plain ES modules with no build step, so it only needs a web server:

    python3 -m http.server 8791 --directory .

then open <http://localhost:8791>.

## What is in it

- **Explore.** The building starts dark. Lamps come on as you reach them, each
  with its own note. Pull up to a work and press `E` to leave the toy and stand
  in front of it like a person. Works you look at are kept in a notebook.
- **Race.** The Night Circuit: two laps through the south galleries, across the
  hall, down the miniature-rooms passage and back, against three other toys.
  Cones on the floor for the car, hoops in the air for the drone.
- **A stunt kit.** The car has real gravity (9.8 m/s²) and `Space` makes it
  hop; hold `Space` in the air and steer to flip and spin. Around the building:
  plywood ramps and funboxes with light strips, a curved launcher and a
  half-pipe in front of the window, a grand staircase to launch off, tables to
  drive along and land on, packing crates, a loop-the-loop that runs both ways,
  a skyway of orange track hung from the hall's glass roof with gaps to clear,
  and a catwalk hung at picture height round Gallery 220. There are 27 gold
  hoops to jump or fly through. Cones and wet-floor signs are loose and can be
  knocked about (by rivals too), and the mopped patch of floor is slippery.
  Leave a ramp with a work alongside and time slows, the camera comes round,
  and that work is lit and named until you land.
- **Frames.** Each picture gets a moulding to suit its date and school:
  tabernacle and gilt-and-bole for the earliest, carved Baroque gilt, ebonised
  Dutch, Neoclassical, swept Salon gilt, walnut, oak, thin modern strips, and
  the plain white Seurat wanted.
- **Ten galleries, a hall and a passage.** 201, 240, 241, 243, 248 on the north
  side; 211, 213, 220, 161, 273 on the south. The hall takes the largest
  canvases left over. The passage is Gallery 11, the Thorne Miniature Rooms.

The title screen has two choices, Vehicle and Game mode, set to RC Car and
Explore; press Start (or Enter).

Controls are two sticks, like a toy transmitter. Keys, a gamepad and touch all
drive the same two sticks; the title screen lists the keys.

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

`src/collection.js` asks `api.artic.edu` for public-domain works on view (seven
requests, answer cached for twelve hours) and sorts them into rooms by
`gallery_title`. If a gallery has been rehung and comes back with fewer than
four paintings, the room is filled from the best-stocked gallery not already
used. Images load from the museum's IIIF server at the sizes it recommends.

Three things the docs do not make obvious:

- The servers refuse any request that carries a `Referer` they do not know.
  `index.html` sets `<meta name="referrer" content="no-referrer">`; without it
  nothing loads.
- The docs ask for an `AIC-User-Agent` header with a project name and a contact
  email. It is sent with every API request; the address is `CONTACT` at the top
  of `src/collection.js`.
- Cloudflare turns away headless Chrome whatever it sends, so automated tests
  cannot load images from the museum. Use the offline copy below.

`node tools/fetch_collection.mjs` refreshes `data/collection.json`, the saved
copy the game falls back to when the API cannot be reached. Add `--images` to
also save every hung image to `data/img/` (about 48 MB, not in git); when the
game is run from localhost and that folder has images, it uses them instead of
the museum's server.

URL switches, for testing: `?saved` skips the live API, `?remote` ignores the
offline images, `?mode=explore|race&toy=car|drone` skips the title, `?auto`
lets a test driver run the race. The game object is `window.__ah`.

## Layout

    index.html, style.css     page and on-screen display
    src/plan.js               floor plan, stunt kit, collision, hanging, race route (no three.js)
    src/collection.js         API calls and sorting works into rooms
    src/museum.js             the building, the artworks, the lamps
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
Data is CC0; images used are those the museum marks public domain. This is a
fan project and is not affiliated with or endorsed by the museum.
