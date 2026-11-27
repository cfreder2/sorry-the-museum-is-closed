# Escapes: what gets out of the paintings, and how the robots put it back

The plan, and where it stands. It covers the sixty paintings that were alive on 2026-11-24 (build 2026.11.24.50).
Nothing here changes the shows; it adds a second life to some of them. Four escapees are built and in the game
(`src/escapes.js`, one file each in `src/escape/`); the rest of this document is still the plan it was.

## Where this stands (2026-11-25): decided, four built

The owner has decided, after the independent reviewer's opinion (`~/Desktop/Museum-life/ESCAPES-REVIEW.md`):

1. **The robots send escapees home with light, not with the bolt.** A robot that finds an escaped thing in its
   searchlight turns the beam to the gallery's own warm white; the green washes off, the thing comes apart into its
   painter's brushstrokes and flows back along the floor and up under its frame. The painting on the wall never
   changes. The bolt stays for the toy.
2. **No person is ever quarry.** Creatures, objects, light, water and weather can be loose and move off from a robot.
   People from pictures are never chased, lit as a target or sent home by a machine. Goya's boy and ram ride out only
   to fetch strayed lambs; no robot points anything at the boy.
3. **The toy is the sheepdog.** Finding an escapee and leading it home itself is the win; the robot's light is the
   plain ending.
4. **The player has no weapon.** The "alien blaster" of `docs/PAINTING-ANIMATIONS.md` is dropped: a painting wakes by
   being looked at, as now.

So read rules 5, 6 and 8 below with those four in mind, and in the table treat every "People" row as releasing
nothing of the people (an object or effect of theirs at most), and test T4 as replaced.

**Built, and in the game: four.** Degas's hats (a flock that scatters, `src/escape/hats.js`); Homer's keg float on its
patch of sea (`keg.js`); Goya's lambs, with the boy on his ram fetching them (`lambs.js`); Monet's parasol blown from
room to room (`parasol.js`). The test that films and measures them is `tools/dev/escapes.mjs`.

**Seurat's monkey is not an escapee.** It was the fifth first test (`src/escape/monkey.js`, written against the old
secret in Gallery 240), but its getting-out is now the chase in `src/l2-grandejatte.js`: under the bench in 240 from
the start of the night, away to the Director's whiteboard, home, and back on its lead. There is one monkey, and it is
that one. `monkey.js` was imported by nothing and has been removed; the Seurat row in the table below is the old plan.

## The idea

Today a painting wakes when you look at it, plays its show beside the canvas, and goes home. The owner's idea: the
green goo does more than that. Some of what is in a woken painting **gets out** and goes about the museum, so the
building is alive when you are not looking. The security robots are the ones who clean it up: a robot **zaps** an
escaped thing and it goes back into its painting. Painted people and animals **run or scatter** from a robot.
Sometimes what is loose is not a creature but an **effect** (a window of moonlight, a patch of sea with a float on
it). When the thing is zapped, **the bit of world it carried fades away**.

This fits what the game already is. The robots already zap: their prong glows for half a second and a bolt sends the
toy to the dumpster. Living works' labels already glow green. What is new is that the museum has consequences that
last after a look ends, and the robots have a job other than you.

## The rule proposed (to be tested)

1. **Home, out, sent home.** Every living painting is in one of three states. *Home*: nothing is loose; looking at it
   plays the show as now. *Out*: its escapee is somewhere in the museum; looking at the painting plays a shorter show
   with the escapee missing from it, and the label's glow flutters. *Sent home*: a robot has zapped it; it streams back
   as paint, and the painting is home again.
2. **One escapee per painting**, and only from paintings on the list below. An escapee is small: one creature, a
   handful of objects, or one patch of weather, light or water. It is never the whole show.
3. **It carries a little of its world.** The ram walks on a moving patch of Goya's sandy path; the duck leaves wet
   prints; the skaters freeze a ribbon of ice ahead of them that melts behind. That patch is what "fades away" when the
   escapee is sent home, and it is how you find one: follow the yarn, the wet prints, the hoof-marks, the hiccups.
4. **How it gets out.** Not every look releases something. A painting lets its escapee go when the saucer's light has
   passed over it that night, or when the toy lingers and plays with the show for a while. At most a few are out at once
   (see Budget). Nothing escapes while a race or a heist is on.
5. **What it does when a robot comes.** Each escapee has one of five answers, written for it from the picture:
   *runs* (the ram, the horses), *scatters* (a crowd), *hides* (in fog, behind a bench, among the real furniture),
   *freezes* (Guardi's potted trees stand in a row and pretend to be decor), or *does not care* (apples roll where the
   floor takes them). Nobody is terrified. It is hide-and-seek and a chase, in the key of children caught out of bed.
6. **The zap sends home; it never hurts.** The robot's prong glows, a soft green-white bolt lands **at the escapee's
   feet or on the thing it carries** (the path, the float, the bell, the umbrella), and the escapee comes apart into
   its painter's own strokes and streams back along the floor and up under its frame. No flinch of pain, no fall, no
   cry. A zapped creature is home and well in its picture the next time you look.
7. **Some are not zapped at all.** Moroni's dog goes home when the robot's light points at the floor, as the sitter's
   finger does. Ruisdael's birds go home when their storm passes. The lark goes home at first light.
8. **The player is on nobody's side by rule.** The toy can follow an escapee, lead a robot to it, block the robot's
   line of sight so the escapee gets away, or herd it home itself (drive it back to its own wall and it goes in
   without a zap). Which of those earns anything is an open decision.
9. **Nothing ever crosses a canvas.** The existing guard still cuts anything that would be drawn over any painting
   from any camera. Escapees also keep off the picture rail and never touch, lean on, knock or climb a work of art.

## Care (these are limits, from the two sensitivity reviews)

- **Nothing gets out of** a sacred, devotional or memorial picture, a picture of a child's private moment, a
  picture of grief, or one held for a community reader. They are marked *nothing* below and the kit must refuse them.
- **No person is zapped in the body.** For people the bolt lands on the ground at their feet or on their prop, and
  they go home as paint. No child, no person of colour, no working person is ever shown chased in fear or struck.
- **A child among escapees** (Goya's boy, the child in red on the ice) stays with the animal or grown-up he is with
  in the picture, is never alone with a robot, and is never the one the robot aims at.
- **Animals are not frightened for fun**: an animal moves off from a robot the way an animal moves off from a
  stranger, and is never cornered. The cart-horse does not run at all.
- **Common fears do not roam**: nothing that watches or follows the player (the Hydra stays home).
- **"Chaos" is play, never damage.** Things roll, hop, flutter, splash, grow, hide and make noise. Nothing breaks,
  nothing dirties a work of art, and nobody is the joke.
- **Reduce motion** applies: no bolt flash (a slow glow), half-speed chases, softer sounds.

## How it would be built

- **Two layers.** Far from the player an escapee is only a record: which painting, which room, where on the room
  map, what it is doing, since when. It moves along the room graph on a slow clock and costs nothing to draw. Near
  the player it is given a body.
- **Budget.** Bodies drawn at once: 6 on a phone, 20 on a computer. Out at once across the museum: about 12. One
  escapee is one draw call, at most 6,000 triangles and one small texture, and under 0.1 ms a frame. This is separate
  from the shows, which keep their own limits (4 built on a phone, 10 elsewhere, let go after 20 s).
- **The kit.** `lifeFor(id, spec)` gains an optional `escape` part: `{ kind, build(), roam(E, dt), threat(E, robot),
  home(E, k), trail }`. The kit owns the states, the room-map movement, the guard, the cap, the save, and the going
  home as strokes (one shared effect, in the painting's palette). A show without `escape` behaves exactly as now.
- **The robots** (`src/guards.js`) already have a searchlight, "?" and "!", a pursuit, a prong and a bolt. They gain a
  second kind of target: an escapee in the light. They finish with an escapee before they notice the toy unless the
  toy is closer. The tracker in the security room shows escapees as green dots, and the terminal can list them.
- **Saved** with the game: which paintings are out and where. A reload does not reset the museum.
- **Settings**: one switch (`escapes`), like `guards`.
- **Sound**: each escapee has one small sound that gives it away (the bell, the hiccup, a quack, hooves, a hat's
  flutter), heard through walls a little, so the museum sounds inhabited.

## Five kinds of escapee

| Kind | What it is | With a robot | Sent home as |
|---|---|---|---|
| Creature | one animal, or an animal and rider | moves off, runs, doubles back | strokes, from the feet up |
| People | two to six clothed adults doing what they do in the picture | scatter, regroup two rooms on | strokes; the bolt lands on the ground or a prop |
| Objects | a few things that roll, hop, flutter or walk | mostly do not care; some hide or freeze | each one separately |
| Effect | a patch of weather, light, water or sound that wanders | drifts; some hide other escapees | thins away; the float or parasol in it is what is zapped |
| Nothing | the painting keeps everything | | |

## The sixty

"First tests" are marked **T1** to **T5**. "Later" means a good escapee that should wait for the rule.

| Room | Painting (word) | Kind | What gets out | With a robot | Notes |
|---|---|---|---|---|---|
| 201 | Caillebotte, Paris Street (puddle) | People + effect | The couple under one umbrella, with their own small shower and a trail of puddles | Hurry on, umbrella tilted toward the light | Bolt lands on a puddle; the rain stops, the puddles dry. Later |
| 201 | Renoir, Acrobats (juggle) | Objects | The oranges they juggle, rolling | Do not care | The two acrobats were girls of 14 and 17: they stay home |
| 201 | Renoir, Two Sisters (yarn) | Objects | Balls of wool that unroll through the rooms, leaving a strand | Roll on | The strand is a trail to follow; zap and it winds back. Later |
| 201 | Morisot, Woman at Her Toilette (powder) | Object | The swansdown puff, bouncing, leaving powder prints | Hides under a bench | The dressing table stays (a private moment) |
| 201 | Manet, Woman Reading (leaf) | Object | The loose leaf of the journal, blown about | Lifts away on the robot's own draught | Comic and harmless. Later |
| 184 | Cassatt, The Child's Bath (bubble) | Effect | A flight of soap bubbles into the next room | Drift; the robot pops them | Basin, jug and rug stay; nothing of the child or mother |
| 202 | van der Weyden, Jean Gros (thanks) | Nothing | | | A man at prayer |
| 206 | Moroni, Gian Lodovico Madruzzo (stay) | Creature | The dog, wandering and sniffing | Sits when the robot's light points down, then trots home | **Not zapped.** Proves rule 7. Later |
| 209 | Claude, View of Delphi (glow) | Nothing | | | A procession to a temple; the light belongs to it |
| 211 | El Greco, The Assumption (rise) | Nothing | | | Sacred |
| 211 | Sánchez Cotán, Game Fowl (still) | Nothing | | | Its subject is coming to rest |
| 213 | Ruisdael, Castle of Egmond (shelter) | Creatures | The two birds | Go up to a high ledge and wait | Go home when their storm passes, not by zap |
| 213 | Hobbema, The Watermill (turn) | Creatures | The three ducks, in file | Waddle off; make for any water another escapee has left | The keeper stays at her work |
| 215 | (Tiepolo, in progress) | | | | Decide when built |
| 216 | Fragonard, Man in Costume (flourish) | Effect | The brush's flourish: a ribbon of line drawing itself along walls and floor | Whips round a corner | Never on or behind a picture. Zap erases it |
| 217 | Goya, Boy on a Ram (bleat) | Creature + rider | The ram with the boy on its back, on a moving patch of Goya's path, bell clanking | Trots off, doubles back, butts the stunt ramp, stops broadside to look | **T1.** Bolt lands on the path at its feet; boy and ram go home together as strokes. The boy is never alone and never the target |
| 217 | Piazzetta, Pastoral Scene (paddle) | Creature | The duck, leaving wet prints | Flaps a few metres, shakes, carries on | The swimming dog needs its pool and stays |
| 217 | Guardi, Garden (parterre) | Objects | Potted trees walking two by two | **Freeze** in a row and pass for decor; zapped only if seen moving | Proves "freeze". Later |
| 218 | Robert, The Fountains (pour) | Effect | A thread of water running along the skirting to a small pool | None | Low priority |
| 218 | Reynolds, Lady Sarah Bunbury (wreath) | Nothing | | | A sacrifice; no play on it |
| 218 | David, Madame de Pastoret (thread) | Nothing | | | A sleeping baby |
| 220 | Turner, Fishing Boats (bargain) | Effect | Two voices calling a price to each other from different rooms | None | Sound only. The boats and crews stay |
| 220 | Constable, Stoke-by-Nayland (dew) | Creature | The cart-horse and cart, plodding | Stops and looks round; never runs | A working horse is not driven by fear. Heavy model: later |
| 221 | Blechen, Palm House (dapple) | Effect | Ferns and a palm sprouting in corners of other rooms, sun-dapple under them | None; the robot "prunes" | Plants only |
| 222 | Breton, Song of the Lark (song) | Creature | The lark, flying room to room, singing | Out of reach; sings from a door-head | Goes home at first light. Never perches on a frame |
| 222 | Courbet, Mère Grégoire (bouquet) | Nothing | | | Not one to draw attention to |
| 222 | Manet, Fish (gleam) | Object | The lemon, rolling; its gleam shows on anything shiny it passes, the robot's shell included | Rolls on | The fish stay |
| 223 | Moreau, Hercules and the Hydra (hiss) | Nothing | | | Common fear; nothing that watches the player roams |
| 223 | Rossetti, Beata Beatrix (hour) | Nothing | | | A memorial |
| 225 | Manet, Races at Longchamp (thunder) | Creatures | The five horses and their jockeys, galloping a loop of corridors | Swerve round it and come again | The best "chaos", and the dearest (five bodies). Later |
| 225 | Monet, Beach at Sainte-Adresse (ebb) | Objects | The two baskets, rolling | Do not care | |
| 226 | Degas, Yellow Dancers (pirouette) | Object | One stage flat shuffling along on the four pairs of feet under it | Sets itself down and is scenery | The dancers were children of the ballet school: only the flat |
| 226 | Degas, The Millinery Shop (flutter) | Objects | The hats, fluttering like birds, roosting on benches and on robots | Flutter up when the light swings to them | Later |
| 226 | Degas, Uncle and Niece (rustle) | Nothing | | | A house in mourning |
| 241 | van Gogh, Self-Portrait (swirl) | Effect | A small whirl of his strokes, wandering like a dust-devil | Spins away | Not his likeness |
| 241 | van Gogh, The Bedroom (tuck) | Object | One yellow chair, walking | Stands still against a wall | Folds flat like the pop-up when sent home |
| 241 | Gauguin, Arlésiennes (wrap) | Nothing | | | The women stay; the wind is Monet's gust already |
| 242 | Toulouse-Lautrec, Moulin Rouge (cabaret) | Effect | The galop itself: a line of gas globes lighting down a corridor, the tune ahead of you | Globes pop out one by one | The dancers stay (nothing a floor camera can see under) |
| 243 | Monet, Water Lilies (ripple) | Effect | One lily pad on its own small round of pond, sliding over the floors | Slides under a bench | |
| 243 | Monet, Stacks of Wheat, Snow (hiccup) | Object | The big stack, hopping, hiccuping, leaving a dusting of snow | Holds its breath and stands still; a hiccup gives it away | A natural. Later |
| 243 | Monet, Houses of Parliament (toll) | Effect | A bank of his lilac fog rolling from room to room | Robots lose sight in it; **other escapees hide in it** | Changes the whole game in that wing. Later |
| 243 | Monet, Stacks of Wheat, End of Summer (harvest) | Effect | Wheat coming up through a corridor floor | None; the robot reaps | |
| 245 | Munch, Girl by the Window (moonbeam) | Effect | The window of moonlight: four pale panes that slide along floors and up walls, room to room | Slips away from the searchlight; the two lights never overlap | **T2.** The show has no girl in it, by rule (a girl alone at night). The escapee is the light. Zap: the panes go out one by one |
| 245 | Böcklin, In the Sea (echo) | Effect | The echo: in that wing every beep, horn and bell is answered a beat late | None | Sound only; the harp stays |
| 247 | Gauguin, Mahana no atua (tide) | Nothing | | | Held for a community reader |
| 248 | Cézanne, Basket of Apples (tumble) | Objects | The apples, rolling wherever the floor falls, down the stairs, under cases | Do not care; the robot zaps them one at a time | **T5.** The cloth stays. Each apple goes home alone |
| 248 | Cézanne, Bay of Marseille (card) | Objects | Cards that deal themselves into little houses in odd corners | None | Gathered up, never knocked down |
| 248 | Cézanne, Yellow Chair (trace) | Object | The traced chair, a drawing in blue line, walking and leaning | Leans on a wall and is a drawing | Zap erases the line from one end |
| 272 | Bellows, Love of Winter (skate) | People | Four or five skaters on a ribbon of ice that freezes ahead of them and melts behind | **Scatter**, glide round it, link hands again two rooms on | **T4.** The child in red stays hand in hand with the woman in yellow. Bolt lands on the ice |
| 273 | Homer, Croquet Scene (mallet) | Objects | The balls, and a hoop or two that turn up down the corridor | Roll on | The players stay at first |
| 273 | Sargent, The Fountain (splash) | People | The two painters: she sets up her easel in front of other pictures and paints; he lounges | Pick up the easel and stroll on, unhurried | A painter loose in a museum. Never before a sacred work. Later |
| 391 | Matisse, Still Life with Geranium (bloom) | Objects | The red fruit, rolling | Do not care | Low priority |
| 392 | Kandinsky, Improvisation 30 (boom) | Effect | A few of his flat shapes and lines bouncing along the walls, each a note | Bounce off its light | The cannons stay. Zap makes a chord |
| 161 | Church, View of Cotopaxi (erupt) | Effect | A small cloud of the volcano's smoke drifting under the ceilings | Drifts on | The paddler stays: he is not to be chased by a machine |
| 161 | Homer, The Herring Net (haul) | Effect + object | A patch of his grey-green sea with the red keg float riding on it, sliding across the floors | Slides away; the swell hides the float | **T3.** The robot zaps the float; the water drains to nothing. The existing "catch the fish" secret is left alone |
| 161 | Inness, Tarpon Springs (daybreak) | Creature | The bird | Out of reach | Goes home at first light, like the lark |
| 161 | Johnson, Mrs. Beatty (strawberry) | Objects | Runners creeping along the skirting, a crown and a berry in the next room | None; zap withers it back to one berry | Berries are never picked or eaten |
| hall | Turner, Valley of Aosta (avalanche) | Effect | A small snow squall crossing Griffin Court, leaving a dusting | Blows past | No thunder, no flash |
| hall | Monet, Cliff Walk (gust) | Effect + object | A gust you only see by what it stirs, and the orange parasol bowling along in it | The parasol is what is zapped | It ruffles other escapees as it passes |
| hall | Rembrandt, Old Man (glint) | Object | The medal, rolling like a coin, glinting | Rolls into shadow and lies flat | |
| 240 | Seurat, La Grande Jatte | People + creature | The strollers, promenading; the monkey on its lead | Open their parasols and drift apart; the monkey looks back | The other crowd. After T4 |

Counts: 12 keep everything, 48 could release something. Of those, about a dozen are worth building first.

## The first tests, and what each one settles

| Test | Painting | Kind | What it settles |
|---|---|---|---|
| T1 | Goya, Boy on a Ram | Creature + rider | Running from a robot without fear; a child among escapees; the moving patch of world; going home as strokes |
| T2 | Munch, Girl by the Window | Effect (light) | An escapee with no body; how a robot "finds" and zaps light; whether a wandering light reads as something loose |
| T3 | Homer, The Herring Net | Effect (water) + object | "Zap the effect": the bolt on the float, the water draining; water crossing rooms and doorways |
| T4 | Bellows, Love of Winter | People | Painting people scattering and regrouping; where the bolt lands for people; a child kept with her grown-up |
| T5 | Cézanne, Basket of Apples | Objects | Things that do not flee; many small escapees from one painting; stairs and slopes; the robot's tidying as comedy |

Each test is built in its own wing and judged on five questions: does it read at once as that painting; is it fun
to find, follow and watch being sent home; does the robot look like a caretaker and not a hunter; does a phone hold
60 with six bodies drawn; would a teacher be glad to show it. The rule is then rewritten from what the five teach.

## Decisions for the owner

1. **Whose side is the toy on?** Recommended: neither by rule, but the toy is rewarded for herding an escapee
   home itself (chips, and a line in the security log), and the robots are simply faster at it.
2. **Does a zapped painting stay quiet for a while?** Recommended: yes, until the next night or the next pass of
   the saucer, so being sent home matters.
3. **Do robots still chase the toy while escapees are out?** Recommended: yes, but an escapee in the light comes
   first, so chaos is also cover.
4. **The alien blaster.** With the robots doing the zapping the player needs no weapon at all. Recommended: drop it.
5. **The twelve that keep everything.** Confirm the list, especially Courbet, Claude and the Arlésiennes, which
   are judgements and not rules.
