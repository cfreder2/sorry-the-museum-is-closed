# Painting animations: the framework

Status: draft for review, 2026-11-22. This is the contract every animation follows, so that roughly 900 of them, made
by many agents, feel like one game.

**Built (2026-11-23):** the shared kit, `src/paintlife.js`, and the first three works on it, which are the ones to copy:
`src/life/20684-paris-street.js`, `src/life/111436-basket-of-apples.js`, `src/life/94841-song-of-the-lark.js`. For now
they wake while the player LOOKs at the work (as the Grande Jatte does), not with the blaster; see **How to make one**
at the end.

Also built on it: `src/life/44018-croquet-scene.js` (Homer: a lawn unrolls, players in crinolines play a stroke on
Haydn's surprise chord, and the toy can knock the balls through the hoops; the nearest to copy for anything the toy
plays with), `src/life/109938-valley-of-aosta.js` (Turner: his vortex of strokes round the frame, an avalanche from under
it, a whirlwind on the floor and a drift; strokes drawn as ribbons in one mesh, for brushwork in motion) and
`src/life/27943-mahana-no-atua.js` (Gauguin: a tide of flat shapes in three layers, all in one shader, with floating
flowers; for anything flat and patterned on the floor).

## What it is

> **Decided 2026-11-24: there is no blaster.** The owner dropped the weapon described in this section and in "In the
> game" below. A work wakes by being looked at (the LOOK trigger, as built). What gets loose afterwards, and how the
> security robots send it home with light, is in `docs/ESCAPES.md`. Read every "blast" below as "look".

An alien blaster, given to the player by the probe at the end of the UFO chase, wakes a work up. Blast a work and
what is in it comes out into the room for a few seconds: the Seurat's strollers step down and waltz on the floor; birds
leave a landscape and circle the gallery; a still life's fruit rolls across the floorboards. The work itself never
changes. Afterwards its wall label glows alien green instead of warm white, and the work stays a little alive.

The point is the game's point: to get people to look at the art. Each animation should send the eye back to the
work, never away from it.

## The rules (hard)

1. **Never on the canvas.** Nothing is drawn over, tinted, lit or glowed onto the work's image, at any moment. Things
   come *out of* it: they form in the air in front of or at the edge of the frame and move into the room. See the
   memory note "museum-never-draw-over-art".
2. **Public domain only.** Only works whose collection entry has no copyright notice (`c` empty) are animated. In-copyright
   works hung from the live API simply do not respond ("Nothing happens. This one is still under copyright.").
3. **From the work, not about it.** Each animation is made from what is actually in the work (its subject, its
   figures, its colours, its marks) and in its style. No jokes at the work's expense, nothing the artist would find
   mocking, nothing that changes its meaning. Religious and funerary works are treated gently (light, a slow drift of
   colour, a figure's halo of dots), never comically.
4. **Original.** The figures are our own, drawn in the manner of the work; no copied characters, film designs or
   brands. Music only from compositions published before 1900, synthesised.
5. **Collision matches what is drawn.** Animations are not solid, or push the toy aside softly. Nothing blocks a
   doorway or a route.
6. **Care.** Sacred figures do not move and sacred things are not toys; no unclothed figure is modelled; nobody is
   shown hurt; no people, faith or person is a prop or a joke; and a show honours "Reduce motion and flashing"
   (`L.calm`: no flash, no fast pulse, half-speed spins, no sudden bang). The full list is the Care section of
   `docs/PAINTING-HELPER-BRIEF.md`, from the independent sensitivity review of 2026-11-24.

## How long, and how it goes

Every animation has four parts, timed from the blast:

| Part | Time | What happens |
|---|---|---|
| **Wake** | 0 to 0.6 s | The blast hits the frame (a green crackle round the **frame**, not the canvas); the label starts to turn green. |
| **Emerge** | 0.6 to 2 s | The contents gather out of the work: dots, strokes or shapes forming in front of or beside the frame and stepping, flying or spilling out. |
| **Play** | 2 to 8 s | The scene in the room: the main moment. Up to about 6 s. |
| **Return** | 8 to 10 s | Everything drifts back to the frame and dissolves into it, or settles (petals stay on the floor for a while). |

- **Total:** 6 to 10 s. Short enough to do another; long enough to delight. The 10 s cap is hard.
- **Afterwards, "alive":** a tiny idle touch while the player is within about 4 m (a bird on the frame's top rail, a
  few dots drifting beneath it, a petal falling now and then). Optional, very cheap, never on the canvas.
- **Again:** blasting a woken work replays the full animation.
- **Skippable:** the player can drive away at any time; it finishes or fades without them.

## Where it happens (the stage)

Measured from the work, in the room:

- **Floor stage:** a rectangle on the floor in front of the work, as wide as the work plus 1 m and up to 2.5 m out.
  Most animations live here.
- **Air:** the space in front of the work up to 1.5 m out and up to the ceiling, for things that fly.
- **Frame edges:** the top rail, the sides and the bottom rail are where things emerge and where idle touches perch.
- **The room:** a few animations may roam the whole gallery (birds circling, rain), but must return to the frame.

**Scale:** sized for the 0.5 m toy, not for a person. Figures stand 0.25 to 0.6 m tall, so the toy can meet them
eye to eye.

**The camera:** when the player blasts, the camera eases back to frame both the work and the stage (a short
`k.camClose` hold, about 2 s, released on the Play part). The work must be fully visible in that shot.

## What it is made of (the shared kit)

Every animation is assembled from one shared kit (`src/paintlife/kit.js`), so they are cheap, consistent and quick
to make:

- **Palette:** the work's own colours, sampled once from its image (6 to 10 swatches), so every animation matches its
  work. A hand-picked palette may override it.
- **Marks:** how things are drawn, matching the work's technique:
  - dots (Pointillism);
  - short thick strokes (Impressionism, Van Gogh);
  - flat shapes (prints, Japanese woodblocks, Post-Impressionism);
  - fine lines (drawings, etchings);
  - smooth glazes (Old Masters);
  - blocks (Cubism and abstraction).
- **Actors:**
  - figures (standing, walking, dancing or bowing silhouettes built from marks);
  - animals (birds, dogs, horses, cats, fish);
  - objects (fruit, flowers, boats, umbrellas, hats);
  - weather (rain, snow, leaves, petals, fog, sunbeams);
  - water (ripples and waves on the floor);
  - light (candle glow, stars).
- **Motion:** paths and verbs:
  - walk, waltz, bow;
  - fly, circle, flock;
  - roll, tumble, scatter;
  - drift, fall;
  - sail, ripple, swirl;
  - return-to-frame.
- **Sound:** a short sting on wake, an optional quiet loop during Play (a waltz, birdsong, rain, waves), synthesised,
  pre-1900 music only.

## How one is written (the format)

Most animations are a small **data recipe**, one per work, keyed by the work's id. Code is only for the rare showpiece.

```js
// src/paintlife/works/27992.js: Seurat, A Sunday on La Grande Jatte (1884–86)
export default {
  id: 27992,
  marks: 'dots',
  palette: 'image',            // or ['#2b2f5e', '#d8823a', ...]
  sting: 'chime',
  loop: { kind: 'waltz', piece: 'blue-danube' },
  actors: [
    { kind: 'figure', shape: 'lady-parasol', count: 4, emerge: 'bottom-rail', path: 'waltz', stage: 'floor' },
    { kind: 'figure', shape: 'man-tophat', count: 3, emerge: 'bottom-rail', path: 'waltz', stage: 'floor' },
    { kind: 'animal', shape: 'small-dog', count: 1, emerge: 'side', path: 'trot-around', stage: 'floor' },
  ],
  idle: { kind: 'dots-drift', under: true },
  note: 'The strollers step down off the bank and waltz.',
};
```

A showpiece may add `custom(kit, ctx)` for anything the recipe cannot express.

**Archetypes as a fallback:** until a work has its own recipe, it uses an archetype chosen from its metadata (style,
type, medium, title and its written description): seascape, landscape, still life, flowers, portrait, figures,
city, interior, animals, religious, abstract, print. So every public-domain work responds from day one, and
hand-made recipes replace the archetypes one by one.

## Budget (per animation, phones in mind)

- At most 400 instanced marks on screen, and at most 3 draw calls beyond the kit's shared ones.
- At most 2 KB of recipe data. Shared geometry and textures come only from the kit.
- Nothing per frame unless it is playing or idling within 4 m.
- Only one animation plays at a time; a second blast fades the first.
- Each recipe file is loaded only when its work is first blasted.

## How agents make them, at scale

1. **Order:** the works in the galleries players reach first, then famous works, then the rest. Showpieces (custom
   code) are a short list chosen by hand.
2. **Batches:** about 20 to 30 works per agent, grouped by gallery or by style, so one agent keeps one look.
3. **Each agent, for each work:**
   - looks at the work's image and reads its title, date, medium, style and description;
   - writes the recipe (one line in `note` saying what comes out and why);
   - renders it in the browser and makes a contact sheet at 0.5, 1.5, 3, 5 and 8 s.
4. **The check:**
   - an automatic test: the canvas rectangle is never covered by any actor, the work is public domain, the time is
     under 10 s, and it fits the budget;
   - a look: the contact sheet is reviewed;
   - the gallery is driven through with the toy.
5. **Index:** `data/paintlife.json` lists every work with its status: archetype, recipe or showpiece, plus who made it
   and whether it was reviewed.

## In the game

- **The blaster:**
  - **Getting it:** the probe drops it at the lighthouse when it leaves, as the end of the UFO chase.
  - **Firing:** it fires with the same button as LOOK, when the toy faces a work within about 4 m; on a phone, BLAST.
  - **Sound:** it hums and has a short cool-down (about 1 s).
- **The label:** a woken work's wall label glows green and keeps glowing; the info card says "Brought to life".
  *Built now (LOOK trigger):* every work with a life has been touched by the visitors' light, and its label shows it
  from the start, before the work ever moves: a mint cast to the card and a faint green glow round its edges, slowly
  breathing (still when motion is reduced). `exposedCards` in src/paintlife.js; the card colours are `a.exposed` in
  `_paint` (src/museum.js). Only the label, never the work. Labels that would hang behind the next work along move
  to the left of their frame or under it (`_freeCards`), so no clue is hidden.
- **Collecting:**
  - "Paintings brought to life: 37 of 898" appears in the notebook.
  - The map can show green dots for woken works.
  - There are secrets and trophies at milestones (10, 50, every work in a gallery, every work in a wing, all of them).
- **Saving:** woken works are kept in localStorage; New game clears them.
- **Story:** the first blast adds a Green Cheese file page ("The blaster"), and the Director's notes can hint that the
  visitors came for the pictures, "to see them move".

## Open choices (for the user)

1. Does every work have a sound, or only some?
2. Should the "alive" idle touch exist, or is a still, green-labelled work cleaner?
3. Do sculptures and the Thorne Miniature Rooms respond too? (They are 3D, not images. A sculpture could
   turn its head, a miniature room's lamps could light.)
4. How many showpieces (custom code): 10, 25 or 50?
5. Should archetypes ship first so every work responds at once, or only hand-made ones?

## How to make one

The kit is `src/paintlife.js` (its header is the full reference). One work is one file, `src/life/<id>-<slug>.js`,
imported from `src/life/index.js`. Copy whichever of the three reference works is nearest to yours: the
**Caillebotte** for figures that walk out and back, weather and water on the floor; the **Cézanne** for things that fall,
roll and can be pushed about by the toy; the **Breton** for something that flies, and light.

```js
import * as THREE from 'three';
import { lifeFor, ease, ramp, shape, walk, flight } from '../paintlife.js';

lifeFor(111436, {                         // the museum's id; title: /^The Basket/ is the fallback
  title: /^The Basket of Apples/,
  word: 'tumble',                         // the one word it is about
  stage: { out: 1.2, half: 1.0,          // the floor in front of the work, in metres
           cam: { dist: 2.6, height: 0.9, side: 0.35, fov: 50, lookOut: 0.6, lookH: 0.52 } },      // the look camera
  wake: 2, ret: 2.4,                      // seconds: Wake/Emerge, and Return when the look ends
  linger: { near: 4, max: 30 },           // optional: stay out after the look while the toy is near (things to push)
  build(L) { },                           // once, when the toy first comes near the room: make everything, L.add() it
  start(L, resumed) { },                  // a show begins
  update(L, dt) { },                      // each frame while it shows: L.phase, L.t (show seconds), L.wake, L.ret
  back(L) { },                            // the look has ended: note where things are, to take them home
  end(L) { },                             // all home again
});
```

**The trigger and the timeline.** A show starts 1.3 s into a look at the work (the camera has come round) and runs
while the player keeps looking: **Wake/Emerge** (0 to `wake`, about 2 s; `L.wake` eases 0 to 1) has things gathering out
of the frame's edges; **Play** (from 2 s; make 2 to 8 s the main moment, then loop gently); **Return** (`ret`, about
1.5 s; `L.ret` runs 0 to 1) takes everything back into the frame when the look ends. `linger` keeps a show out after
the look while the toy is near, so the toy can play with it; `keep(L)` keeps `update` running after Return (puddles
drying). A second look during Return or linger simply carries on. Work everything out from `L.t` where you can (not by
adding up `dt`), so any moment can be posed for the checks; use `L.rand()` (seeded), never `Math.random()`.

**The look camera.** While a life shows, the look camera stands low, near and a little to one side (`stage.cam`:
`dist` out from the wall, `side` along it, `height` above the floor, `fov`, and the point looked at, `lookU`, `lookOut`,
`lookH`; the defaults are 2.2 m out, 0.4 m to the right, 0.8 m up, 48 degrees), so what comes out onto the floor fills
the view and the foot of the work is there above it; the top of a big work may crop. Frame the floor show and the bottom
third of the work. Keep fliers inside it for part of their flight. (`cam: false` keeps the old wide view of the whole
wall.) Check it on the contact sheet: the look camera frames are the ones that matter.

**Where things are.** `L.at(u, v, out)` is a point `u` metres along the wall from the canvas centre (to the viewer's
right), `v` up from it, `out` from the canvas plane into the room; `L.floor(u, out)` the same on the floor. The frame:
`L.hw`, `L.hh` (canvas half sizes), `L.fw` (frame width), `L.bottom`, `L.top`, `L.rail` (underside of the frame),
`L.crown` (top of the frame), `L.wall` (canvas plane to the wall: things out of sight at `out < -L.wall` are in the
wall, which is how figures and apples come out from under the bottom rail). `L.yawOut` faces out of the wall.

**The guarantee, built in.** Everything added with `L.add(object)` has every material put through `protectArt()`: a
shader guard that throws away any pixel which, seen from the camera drawing it, lies in front of the work's canvas,
**or any other picture's canvas in the same room**, with 3 cm to spare; within 5 to 8 cm of a canvas things dissolve
(solid) or fade (transparent) rather than stopping at a hard line. It works for meshes, instanced and batched meshes,
points (a point is hidden whole), lines, sprites and ShaderMaterials, from every camera, the floor's reflection included.
If you make a material yourself and add it some other way, pass it through `L.mat()`. On the CPU, `L.hides(x, y, z, r)`
asks the same question. Choreograph so the guard rarely acts: from the look camera it should cut next to nothing (the
check reports how much it cut). A pool of light on the floor, and a glow on the wall **behind** the canvas (the canvas and
frame hide it; `L.glows([{ wall: true, ... }])`), are fine; nothing ever tints, lights or covers the picture.

**The kit.** `L.pal` is the work's palette, sampled from its own image (`L.pal.near('#5b6a7a', 0.4)`: the swatch nearest
the colour you mean, mixed in that far). `L.paint({ flat, glow, rough })` is a vertex-coloured material that glows a little
in its own colours (the galleries are dark at night). `shape.lathe/ball/box/cyl/cone/move/paint/merge` make small
geometries with vertex colours, painted face by face (`shape.paint` is how the apples get Cézanne's planes).
`L.rig(n, verts)` is many rigid parts in one draw call (legs, hats, umbrellas, wings, apples): `rig.geo(g)`, `rig.add(id)`,
`rig.put(i, x, y, z, yaw, pitch, roll, scale)`, `rig.show(i, on)`. `walk(points)` is a stroll over the floor with pauses;
`flight(points)` a smooth path for a flier with heading and bank; `hop()` a jump. `L.rollers(n)` are balls on the floor
with bounces and rolling that the toy pushes about and that keep out of doorways (they never stop the toy). `L.decal()`,
`L.glows()` and `L.blobs()` are flat things on the floor or wall, pools of light, and soft contact shadows. `L.voice()` is
sound placed at the work (louder nearer, panned): `note`, `chirp` (birds), `tune` (carols.js notation; music published
before 1900 only), `bell`, `loop` (rain, wind).

**Budget.** Phones are half the players. At most about 400 marks or particles on screen, at most 3 draw calls of its own
while it shows (a rig is one; merge lights into one `glows`), geometry and textures shared, nothing allocated per frame,
nothing run per frame unless it shows. Nothing is built until the toy first comes into the work's room (or the next
room through a door), and its shaders are compiled then, off the main thread where the browser can.

**Test it, and make the contact sheet.** Serve the repo (with `data/img/` for the pictures) and run

    node tools/lifesheet.mjs <id> --video --phone

It boots the game headless, drives the toy into the room, looks at the work, and

- runs the guarantee check: the animation drawn alone from the look camera and eight others (the toy's eye looking up,
  low and to the side, slanted, close under the frame, grazing along the wall, high, across the room) at eight moments
  of the show and its Return; not one of its pixels may land on the work or on any other canvas in the room;
- writes `~/Desktop/Museum-life/<id>-<slug>-sheet.jpg`: the look camera at 0.5, 1.5, 3, 5 and 8 s, the toy's eye, the
  room, and the Return;
- with `--video`, a film of the whole show on a fixed clock, `<id>-<slug>.mp4`; with `--phone`, the frame cost in a phone
  sized view with and without the show.

In the browser, `?lifecheck` (or `?lifecheck=20684,111436`) runs the same check on every work once the game is up and
shows the result in the corner; `__life.check(id)`, `__life.pose(id, t)`, `__life.stats(id)` and `__life.palette(id)` are
there in the console.

`--show 10.5` films that many seconds of show before the look ends (8.5 by default), for a number that runs longer.
Check a work's file as a module: `node --check --input-type=module < src/life/<file>.js` (plain `node --check` on a
`.js` file passes some syntax errors that stop the whole game loading).

**Stagecraft** (`src/life/stagecraft.js`), shared by the Toulouse-Lautrec and the two Degas works: `score(L)`, a band on
the work's voice that plays to the show's own clock, a little ahead of it, so steps fall on the beat, any moment can be
posed and the music stops when the look does (tunes, notes, noise hits for drums and claps, loops for a vamp);
`inked(g)`, a lithograph's bold outline as an inverted hull in the same draw call; `Bones`, parent-child matrices for
figures in a rig. The Degas dancers (`18951-yellow-dancers.js`) show how to draw a figure in a painter's own marks:
camera-facing pastel strokes on bones, one instanced draw.
