# Auditing what is drawn against what is open

Load the game with `?audit` in the address (for example `?mode=explore&saved&audit`). That switch only
keeps the geometry readable after it has gone to the graphics card (`src/museum.js`, `src/lights.js`),
so a test can cast rays at what is drawn. It changes nothing else.

The audit itself is a page script run from a headless browser. It gathers every opaque triangle in the
scene into a 3 m grid and then checks, against the plan (`G.plan`):

- **Doorways.** For every door, vent and hole: a 3 × 3 grid of rays along the passage, from half a metre
  before it to half a metre beyond. Anything hit inside the thickness of the wall is drawn across the
  opening. Unlock the outside doors first (`G.museum.setLocked(false, true)`), or their leaves count.
- **Doorways that cannot be driven.** Walk each door's centre line with `groundAt` and `wallAt`.
- **Wall gaps.** From just inside each wall of each room, look out: something must be there unless a door is.
- **Wells, lift shafts, ramps.** Vertical rays through each: nothing may be drawn across them, and the drawn
  surface of a flight must agree with `heightOf` along its length.
- **Floors and ceilings.** A grid over every room: a floor is drawn where `groundAt` says floor, a ceiling
  above it, and nothing else (but furniture and the stunt kit) inside the height of the room.

What it found, the first time: outside walls of stacked rooms drawn across interior doorways (each room is
a block from the street up); skirting and dado run across doorways with long passages; the snow sheets
lying across stairwells, a lift shaft and the lower level's westernmost rooms; and the back of the
pediment standing through four second-floor galleries.
