# The finale: Project Green Cheese

The ending of *Sorry, the Museum is Closed*: a hidden base under Butler Field, a flying saucer, a launch out of
the ballfield, a flight to the Moon carrying the museum's art, and a museum on the Moon that finally opens.

Status: planned 2026-11-21; all four phases built and merged the same day (build 2026.11.21.25). Built in phases by separate helpers, each merged and tested before the next depends on it.

## The story, in one breath

The mice have been eating a secret file: *Project Green Cheese*. In 19▇▇ something came down over the lake and the
museum's Director hid it under the park. The file, the photo, the desk key, the whiteboard and the painting already
lead the player down to Sub-level 9. From there a sealed tunnel runs east, under the railway and Columbus Drive, to a
base as large as the museum itself, buried beneath Butler Field. In its hangar sits the craft. It answers to music.
Play its five notes back, and it wakes, gathers up the art, and takes you with it, out through the ballfield and up to
the Moon, where a museum is waiting for its collection. The game ends when that museum opens its doors: the title
card flips from *Sorry, the Museum is Closed* to *The Museum is Open*.

(Why the Moon: the project is called Green Cheese.)

## How it plays, beat by beat

1. **The way in (existing, extended).** Mouse nests, then the Director's desk, the whiteboard, the painting, the
   hidden passage and the stair to Sub-level 9, then the small saucer (the UFO toy) as now. New: in the Debriefing
   room, a keycard and a map of the tunnel. The blast door at the east end of Sub-level 9 opens with it.
2. **The tunnel.** About 200 m east at sub-level depth, under the railway and Columbus Drive, lit in sections that
   wake ahead of you. You can drive it or fly it.
3. **The base.** Roughly the footprint of the museum building, two storeys deep, under Butler Field:
   - Security: a checkpoint with a dead robot guard and a turnstile.
   - Labs: crystals in jars, alloy shards, the source of the radioactive mice.
   - The archive: crates of art "recovered" from the museum over the years, public-domain works only.
   - The control room: a big window onto the hangar, and the tone console.
   - The hangar: the saucer on its launch platform at the foot of a silo shaft.

   The base has its own small secrets and a few security robots, consistent with the museum's.
4. **The five notes.** At the control console the craft plays an original five-note motif. (The well-known film
   theme is copyrighted, so the motif is our own: a rising-then-falling call with a held last note.) Each note has a
   colour and a pad. The player echoes it, Simon-style, over three rising phrases, longer and faster each time.
   - **The craft answers:** each correct phrase, the hangar lights and the saucer's rim answer in colour.
   - **The art answers:** with every phrase, more of the archive's paintings light up one by one on their easels, in
     time with the notes.
   - **A miss:** a gentle sour chord, then the phrase repeats. No fail state.
5. **The tractor beam.** After the last phrase the saucer lifts off its cradle. A beam sweeps the archive and each lit
   artwork rises up the beam into the craft, followed by the books from the reading room and the lost property you
   handed in. One more cue, and the beam finds the toy and pulls you in too. If you're in the car, the car comes with
   you; the drone docks.
6. **The launch.** Third-person cinematic:
   - Sirens and amber lights. The ballfield's outfield splits and the two halves slide apart, snow pouring into the
     shaft.
   - The platform rises and the saucer climbs out over Butler Field, past the Light Run and the museum, the city
     glittering.
   - It hangs above the lake for a beat, then streaks up. The music swells.
7. **Space.**
   - **Inside:** you're in the cabin, windows all round. The art you brought hangs on the curved walls, and the books
     and cargo are strapped in.
   - **Outside:** Earth below, the Moon ahead, the planets laid out across the sky (stylised, made in the game).
   - **Flying:** you pilot it with the same controls as the drone, and you can drift past the planets.
   - **The DESTINATION button:**
     - **The Moon: Lunar Base.** The way home for the art.
     - **Somewhere far away.** A hyperspace trip to a distant galaxy: a spiral of a billion lights, a moment of awe,
       then "Course set: Lunar Base" as the craft swings back.
8. **The Moon.**
   - **Landing:** the saucer lands beside a domed lunar museum on a grey plain with Earth hanging in the black sky.
   - **Unloading:** the ramp lowers and you drive out in the car, in one-sixth gravity with huge floaty jumps and dust
     plumes. The cargo floats out after you into the dome.
   - **Inside the dome:** the paintings settle onto the walls, the books onto shelves, and the lost property into a
     cabinet of Curiosities from Earth.
9. **The ending.**
   - **The opening:** small, friendly lunar visitors (an original design) file in, the lights come up, and the dome's
     sign flips from *Sorry, the Museum is Closed* to *The Museum is Open*.
   - **Credits:** they roll over the lunar plain while the motif returns as a full arrangement.
   - **The night in numbers:** works seen, secrets found, time taken, ornaments and home runs, and the books and art
     you brought.
   - **A trophy:** *The Museum is Open*.
10. **After the ending.**
    - **Keep driving on the Moon:** one-sixth gravity, a crater jump park, the visitors wandering the dome.
    - **Fly home:** you return to Butler Field, the silo closes, and the night carries on.
    - **New game:** starts over as usual.

    The title screen remembers you've finished: a small Moon beside the title.

## Where it goes

| Piece | Where | Notes |
|---|---|---|
| Tunnel | Sub-level 9 east wall (about x 104, z 78, y −12) to the base's west end (x ≈ 300) | Under the railway cutting and Columbus Drive. One continuous drivable passage. |
| Base | Under Butler Field (x ≈ 300–470, z ≈ −20–240), sub-level depth | Never pokes above ground except the silo. Its rooms are plan rooms on a new level, so the map shows them once found. |
| Silo | Centre field of the ballfield on Butler Field's south-east quarter | A flat, clear 32 m square reserved by the ballfield work (`plan.grounds.silo`). The doors are drivable snow-covered surfaces when shut. The square is a permanent entry in `groundOpenings()`, and the doors cover it. |
| Saucer | The hangar floor, on a launch platform | A full-size craft (about 16 m across), so a toy car fits aboard. The same look as the small saucer toy (`buildSaucer` in garage.js), scaled and detailed. |
| Space and Moon | Separate scenes swapped in for the city | The city is hidden, not destroyed, so "Fly home" is instant. The Moon has its own plan (ground, surfaces, the dome) so the car drives on it with the usual physics at one-sixth gravity. |

## Rules it keeps

- **Music:** synthesised in the game, original or pre-1900 compositions only. The five-note motif is original. No
  film themes.
- **Art:** only public-domain works (collection entries with no copyright notice) are animated, beamed or hung on the
  Moon. In-copyright images are only ever loaded live, never saved.
- **Characters:** no copied characters, brands or film designs. The base can wink at a supervillain lair (the
  splitting field, the sirens, a swivel chair facing the window) but copies nothing.
- **Code habits:**
  - Collision matches what's drawn: no sinking (`tools/check_sinking.mjs`), no invisible walls.
  - Anything below the street is in `groundOpenings()`, and `tools/check_layout.mjs` stays *Sound*.
- **Phones:** merged geometry, instanced lights, scenes built only when reached, nothing per frame when idle.
- **Text:** short lines only.
- **Safe to quit:** progress is saved at each stage (base found, notes played, launched, landed, opened), so a reload
  never sends you back to the start of the sequence.

## Build phases

1. **The base** (helper A).
   - Keycard and blast door in Sub-level 9, the tunnel, the base's rooms and robots.
   - The hangar with the full-size saucer on its platform, and the silo shaft and doors under the ballfield.
   - The map level, `groundOpenings()` and `check_layout`.
   - Exposes `G.finale` with the hangar's parts (saucer, platform, doors, easels, beam origin) for phase 3.
2. **Space and the Moon** (helper B, alongside phase 1).
   - A standalone voyage module, `startVoyage(G, { cargo, toy })`, testable with a `?voyage` URL switch.
   - The cabin, the solar system, piloting, the Destination button, hyperspace.
   - The landing, the lunar museum and low gravity, the opening, the credits, the summary, and after the ending.
3. **The five notes and the launch** (helper C, after phase 1 merges).
   - The tone console and motif, the art lighting up, the tractor beam, the cargo list.
   - The cinematic out through the ballfield, then a hand-over to `startVoyage`.
4. **Joining up and polish** (me).
   - The whole sequence end to end, saves at each stage, title-screen Moon, trophy, README.
   - Phone checks, push to main and itch.

## Phase 1, as built

- **Rooms:** `tools/build_layout.mjs` section 8a, all `secret`, ids `B-`: the tunnel (x 113 to 300, z 72 to 77,
  y −12), the checkpoint, concourse, labs, crew quarters, mess, generator, robot bay, records, stores, an office, the
  situation room and the control room at y −12; the hangar (x 410 to 454, z 156 to 196, floor y −18, 12 m tall) and
  the archive beside it at y −18. The map shows the lower storey as Sub-level 10 once the base is found.
- **Silo:** `plan.grounds.silo` = x 416 to 448, z 160 to 192, straight over the hangar (`src/finaleplan.js` sets it
  from the hangar; the ballfield should lay centre field round it). It is in `groundOpenings()` and `plan.pits`; the
  two doors are surfaces; the shaft runs from the hangar's ceiling (y −6) to the doors.
- **Craft and platform:** on the hangar floor at (432, 176), the ramp facing west to the archive. Their collision is
  in `plan.finale.pieces` and moves with `setPlatform` / `setCraft`.
- **For phase 3:** `G.finale` (documented at the top of `src/finale.js`): `state`, `hangar` (saucer, platform, doors,
  ramp, beamOrigin, easels, rim lights), `console` (position, near, five pads, screen, `onUse`), `open()`.

## Phase 2, as built

- **`startVoyage(G, { cargo, toy, stage })`** in `src/voyage.js` takes over from the city: two scenes of its own (the
  far sky and the near world), so the city is simply not drawn. `stage` is `space`, `landed` or `opened`; `?voyage`,
  `?voyage=landed` or `?voyage=opened` starts there to test. Saved in `after-hours.voyage`; `after-hours.moon` is set
  for good when the museum opens (`voyageFinished()`).
- **The Moon** (`src/moon.js`) is a plan of its own that the toy borrows, with one-sixth gravity (`vehicles.js` reads
  `this.gravity`). Fly home gives Earth's plan and gravity back.
- **The motif** (`src/motif.js`): D G B A E, the last note held; colours and pads shared by the console, the rim and
  the music.
- **Pictures:** ten textures in `assets/space/`, made with Codex, loaded only when the voyage starts; the painted
  ones stay as a fallback.

## Phase 3, as built

- **`src/finalelaunch.js`** sets `G.finale.console.onUse`. Three phrases (3, 4, 5 notes), each answered by the
  craft, the hangar lights and three, then four, then five easels lighting (twelve in all). A miss is a sour chord and the
  phrase again. Keys 1–5, the 3D pads or five big buttons; Esc or LEAVE steps away.
- **The beam** lifts the twelve pictures with their frames, eight books chosen to match them, and the lost property
  handed in; then the toy, from the hangar floor. Skippable.
- **The launch** (about 27 s, skippable): sirens and amber, the silo doors open, snow down the shaft, the rise out
  of centre field, the craft over the lake, the streak up, then `startVoyage`. The hangar is put back while away.
- **Saves:** `played` resumes at the beam; `launched` resumes the voyage (cargo kept in `after-hours.launch` until
  the voyage's own save).
- **`G.cineEye`** (`main.js`): a feature can hold the camera exactly, like `testEye`.

## Phase 4, as built

- **Stages saved:** `found`, `played`, `launched` (the voyage's own `space`, `landed`, `opened`, `home`).
- **Fly home** lands the toy beside the silo, facing it; the doors stand open and slide shut over the craft.
- **Tonight's numbers:** `tonight()` in `src/features.js` keeps the ornaments (best in one Light Run) and the Home Run
  Derby's home runs (total and best round) in `after-hours.night` until New game, for the summary.
- **The title** shows a small Moon once `voyageFinished()`.
- **Where the silo is:** the ballpark was moved (home plate at 402, 146; 70 m to centre) so that centre field lies
  over the hangar; its outfield leaves the silo square open, and its light pool hides while the doors are open.

## The hooks: the Green Cheese file (added after the finale)

An audit from a new player's side found the chain sound but hard to start and easy to lose:

- **The first word of aliens** was a chewed page inside a mouse nest: a sixty-metre mouse chase, a grille and a crawl in.
  Before that, only back-of-house whiteboards hinted, in rooms most players never open.
- **No reason to care.** The craft was a prize, not a presence; the Director signed two notes and was otherwise a name.
- **Vague pointers.** "The mouse in the south galleries has more", "upstairs, back of house": no map help between steps.
- **Long dry stretches.** Nothing alien on the way in, between the five nests, or anywhere on the grounds (the silo doors
  were plain snow). The five-note call was first heard at the console, so it paid nothing off.

What was added (`src/story.js`, in the order a player meets it):

1. **Pawprints** glowing on the front terrace, going in at the air vent ahead of you (seconds in).
2. **The grate**, in the lobby on the way in: green light through the slats, a hum, and a glowing mouse sitting on it that
   looks at you and dives through. LISTEN: five notes from far below, the craft's call; a brass tag, "KEEP SHUT. — D."
   Now and then it calls again by itself. The first page of the file.
3. **The mice squeak the call** (`src/mice.js`): two notes of it at each stop, the next two at the next; the whole call as
   one goes in through its grille.
4. **The probe** (`src/probe.js`), once the grate's page is in the file, three more works have been looked at (or three
   minutes spent indoors since) and over a minute indoors in all: the grate hums louder and the `?` sits on it. Come near
   the lobby and a toy-sized saucer rises out of it in a column of green light, flies to you through the doorways, past
   you, and hangs in front of you, chiming the call. Then you herd it out: it keeps about 2.8 m ahead of you along its way
   to the vent (the floor grid of `guardplan.js`, through doorways, never a wall), eases away as you come, hurries if you
   rush it, stays put and chimes softly when you stop, never runs off. Out on the terrace it takes off on its own, over
   the roofs, Butler Field and the ballpark to the harbour light (a short camera beat watches it go), and waits there.
   Reach the light across the floes and it circles the lantern once, the light flickers green, and it streaks straight up.
   Saved in `after-hours.probe` (`flown` from the moment it rises, so a reload finds it waiting at the light; `gone`).
5. **Clarice's log**, on the step of the keeper's hut at the foot of the light (drawn in `harbour.js`, solid in
   `harbourplan.js` as `L.hut`). READ: the harbour keeper's last entries, the museum lit at two, "people" with crates
   going down not out, green light under Butler Field, five notes off the water, "They answered", something small at
   her window, "I'm going to", signed "— C." Pinned to the door, the new keeper: "We don't know what happened to
   Clarice. She kept saying the music came from under the ballfield." A scarf on the hook. The page `lighthouse`; the
   `?` then goes to the rings over the silo.
6. **A light over the lake**, out of doors now and then: a green streak falling towards Butler Field, then the call, far
   off and thin. It waits until the camera faces that way with no building in the way.
7. **Rings in the snow** over the silo, five marks round them in the call's colours (one half on each silo door, so the
   pattern parts at the launch). Drive onto them: the call again, from under the snow.
8. **The older chain** (nests, desk, painting, Sub-level 9, the base) is noticed by what each module already saves, and
   each step is a page.
9. **The Director's last note**, on the floor of the base office under a saucer paperweight: it calls every night; play it
   back, take it home, and the pictures, "that is what they came for. — D." The reason to care, just before the console.
10. **At the console**, if any of it was heard: "You know this tune."

Along the way:

- **The file**: each page is a toast with as many notes of the call as pages so far (the tune grows with the mystery),
  and a pause-menu button, *The Green Cheese file*, once there is a page: pages found, the rest as `? ? ?`, the next one
  with a one-line hint.
- **A faint `?` on the map** for the next step: the grate once the probe is due, the probe while it is to be followed,
  the keeper's log once it has gone (`G.probe.where()`, asked first); then the next mouse (or its vent), the desk, the whiteboard, the picture, the
  keycard, the blast door, the console; and the rings once the light has been seen. On the big map and the radar, not
  the radar's rim.
- **Whiteboards**: the incidents board logs the light over the lake, the engineers' board the humming grate, the
  volunteers' desk is told the lights are planes.
- **Saved** in `after-hours.story` (pages, the mouse gone down, the note read); New game clears it.

**The story API** (`import { story } from './story.js'`, also `G.story`): `story.add(id)` (true the first time; toast
and sting), `story.has(id)`, `story.count`, `story.total`, `story.open()`, `story.enable(id)`, `story.heard`. Page ids:
`grate`, `lighthouse`, `lights`, `ring`, `nests`, `desk`, `passage`, `sublevel9`, `alienracer`, `base`.

**For the alien racer** (the race spots): `alienracer` is an optional page, "The green racer's charm". At its init the
race module calls `story.enable('alienracer')` (until then the file counts 9 pages, after it 10); when the alien racer is
beaten, `story.add('alienracer')`. Its page says the charm hums when it faces the park, and once it is found the map's
`?` goes on the rings over the silo.

## Open choices (decided for now; easy to change)

- **Optional:** the finale doesn't block anything else, so the game can be explored without it.
- **Three saucers, one family:** the *probe* out of the lobby grate is a live scout, toy-sized and unmanned, that
  leads you to Clarice's log and leaves; the *UFO toy* in Sub-level 9 (`buildSaucer`) is a model of the craft someone
  made, and stays an unlock you can drive; the *craft* in the hangar (`craft.js`) is the real one, the one you ride.
- **Car or drone:** you can arrive with either; the car rides along, the drone docks, and both are on the Moon.
