# Painting animations: the framework

Status: draft for review, 2026-11-22. Nothing is built yet. This is the contract every animation follows, so that
roughly 900 of them, made by many agents, feel like one game.

## What it is

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
