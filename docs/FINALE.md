# The finale: Project Green Cheese

The ending of *Sorry, the Museum is Closed*: a hidden base under Butler Field, a flying saucer, a launch out of
the ballfield, a flight to the Moon carrying the museum's art, and a museum on the Moon that finally opens.

Status: planned 2026-11-21. Built in phases by separate helpers, each merged and tested before the next depends on it.

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

## Open choices (decided for now; easy to change)

- **Optional:** the finale doesn't block anything else, so the game can be explored without it.
- **One saucer:** the small UFO toy from Sub-level 9 stays as an unlock. The big craft is the one you ride.
- **Car or drone:** you can arrive with either; the car rides along, the drone docks, and both are on the Moon.
