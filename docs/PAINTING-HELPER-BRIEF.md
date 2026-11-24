# Brief: make one painting come alive

For a helper (an agent) asked to make ONE painting come alive in "Sorry, the Museum is Closed" (Three.js r170, plain ES
modules, no build). Your work, its id, room, port and starting word are in your task message. Thirty-one are done; this is
what they taught.

## Before anything
You work in your own git worktree. Check it is current: `ls tools/dev/serve.py src/life/76571-view-of-cotopaxi.js`.
If either is missing, your tree is behind: run `git merge --ff-only main` (or `git reset --hard main` if you have changed
nothing) before you start.

## Read first
- `docs/PAINTING-ANIMATIONS.md`: the contract (the hard rules, the four parts and their timing, the budget) and, at the
  end, **How to make one** (the LOOK trigger, `lifeFor`, the stage, the kit).
- `src/paintlife.js`: the shared kit (stage and `stage.cam`, `protectArt`, `hides`, `palette`, shapes, brush marks,
  rollers, voice and sound, the checks). `src/life/stagecraft.js`, `brush.js`, `strokes.js`, `tunes.js`.
- Copy from the best in `src/life/`: `28560-bedroom.js` (a whole scene that builds itself; the strongest),
  `111559-boy-on-a-ram.js` (soft painted creatures and a figure), `109780-love-of-winter.js` (a crowd of figures in the
  painter's marks, the toy joins in), `8991-improvisation-30.js` (flat drawn shapes, music you can play),
  `76571-view-of-cotopaxi.js` (water, smoke, plants), `111436-basket-of-apples.js`, `20684-paris-street.js`,
  `44018-croquet-scene.js` (things the toy plays with), `109938-valley-of-aosta.js` (brushwork in motion).

## The bar (every one is reviewed and sent back if it misses)
1. **Reads instantly as THAT painting**: its subject, its palette (`palette(art)`), its own marks and manner. Look at
   the actual picture before designing (`data/img/` holds it; find the file through `data/collection.json`) and follow
   the picture, not the task message, if they disagree.
2. **Delightful motion**: one clear main moment, timed, with weight, anticipation and a payoff; music from before 1900
   where it helps (see `tunes.js`), checked against the real tune.
3. **Never over the canvas**, from any camera, at any moment: the guarantee check must PASS with 0 pixels on the work
   and 0 on the room's other pictures.
4. **Phone budget** (the doc's marks and draw calls; lazy build; nothing per frame when off).
5. **Routes stay open**; collision matches what is drawn (soft or none). If another work in the same room is alive,
   read its file so the two never collide (the kit sends a lingering show home when another begins).
6. From the work, never mocking it; and the **Care** rules below, which are not optional.

## Care (from two independent sensitivity reviews, of the first twenty-one and the next thirty-two; these are rules)
The game is played by children, classrooms and people of every background and faith, under real artists' names.
1. **Ask first: who is in this picture, and whose is it?** If the answer is a sacred figure, a people other than the
   artist's own, a child, a nude, a person at the edge of harm, or someone suffering, do not animate that figure. Find
   the thing beside them (the water, the light, the cloth, the bird, the tools) and animate that. It has never made a
   weaker show: Gauguin's shows only the pool, Cassatt's only the basin and bubbles, Breton's the lark and the dawn.
   **But do not leave everyone out by habit.** The second review found the rule over-learnt: almost no show has a
   person in it, and four hundred pictures must not teach a child that paintings are about things. A clothed adult who
   is not on the list above may come out, doing in the room the ordinary thing he or she does in the picture, modelled
   softly and well (Sargent's two painters, Turner's hucksters, the skaters and the strollers are the models). And
   when the person does stay in the picture, the show should send the eye back up to them (David's thread ends under
   her lifted hand; Moroni's dog looks up at the pointing finger).
2. **Sacred figures do not move, and sacred things are not toys.** No holy figure of any faith, angel, saint, deity,
   ancestor or spirit is built or moved, in any form, however stylised. No sacred object can be pushed, collected,
   scored with or driven through, and there is no `linger` play on a religious or funerary work. What may come out:
   light, colour, the picture's own marks, plants that are really in it, cloth, stars, a slow upward or outward drift.
3. **Sacred music stays in its place, at its own pace**: from the work's own tradition and time, quiet and straight;
   never on a music box, sped up, or as a sting; never one faith's music under another's picture.
4. **The word must fit the room the work was made for.** For a religious or grave work: rise, light, hush, breath.
5. **No stand-in for a people.** No music, costume, movement, prop or flower used because it "says" a place or a race.
   The rule is about unequal power and exoticising (a European painter's fantasy of "the East", Gauguin's Tahiti), not
   about a Frenchman painting Romans. A person of another culture than the artist's, if shown, does an ordinary thing
   in an ordinary way, modelled with the painter's care, never as the comic or the servant of the scene. Guard against
   the opposite failure too: when a picture shows a person of colour with dignity, the default is to show them,
   ordinary and careful (Cotopaxi's paddler), not to leave them out; say so in your report so a second reader can look.
6. **Children and bodies.** No unclothed or partly clothed figure is ever modelled, of any age, whatever the picture
   shows. No child alone with nothing to do but be looked at. Nothing a floor-level camera can see under. If the
   subject is a private moment (washing, dressing, sleeping, a girl at a window), the show is the room, not the person.
7. **Work and hardship keep their weight.** A labourer's show is the labour's world, not the labourer dancing. Nobody
   poor, old, disabled, drunk or foreign is the joke.
8. **Danger without injury.** Grand, even a little frightening, but nobody is shown hurt, falling, drowning, struck or
   killed. Monsters menace; they are not butchered, and they do not strike at the toy or the camera. **Common fears**
   (snakes, spiders, swarms, faces in the dark, anything that watches or follows the player): give distance, keep
   mouths shut once the timed show is over, and do not let such a thing linger with the toy.
9. **Animals** are never struck, whipped, hooked, netted, caged or killed on screen, nor frightened for fun.
10. **Check the whole tune**, not the phrase: title, words, origin, later use. Never a minstrel or "plantation" song
    (Camptown Races, Oh! Susanna, Dixie, Turkey in the Straw and their like), an anthem or hymn as a joke, or
    mock-"Oriental", mock-"Indian" or mock-"African" scales or drums. **Read the words even when no words are sung**:
    a wordless tune carries its title into the sound book and into a teacher's search. A lament under a portrait of an
    old man, or a song that daydreams of the East under a colonial picture, is a choice; make it knowingly or not at all.
11. **Words.** Captions describe what happens; no joke at anyone's expense and no second meaning (warmth is fine). No
    dialect, no nickname about a real person's body. Read each caption as the least charitable informed adult would.
    Give no sitter an identity the museum does not. **A caption is as sure as the museum is, and no surer**: its
    "probably" stays "probably", and if the show adds something that is not in the picture the caption must not
    present it as the picture's.
12. **Honour "Reduce motion and flashing".** When `L.calm` is true: no flash, no pulse of brightness faster than about
    one a second, spins and whirls at half speed, no sudden loud sound at any point. Build it in from the start, and
    read `L.calm` as the show runs, not only once when it starts, so a change of the setting takes effect at once.
13. **Say what you left out.** End your file's header comment with one sentence on what the show does not do, and why.
14. **A memorial to a real person does not act out the death.** No knell (a bell struck once, never repeating), no
    stopped clock with a caption that explains it, never the means of death.
15. **No stand-in for a missing person in a picture of grief or illness**: no empty chair, bed, cradle, shoes or
    clothes. (An empty chair under a portrait whose sitter is plainly there above it is not this.)
16. **Nothing weapon-like is ever aimed at, or fired toward, a picture** of a holy figure, a person at prayer, a
    memorial, a child or a private moment, by the show or by anything the show invites the player to do.

## What failed in review on the first twenty (avoid up front)
- **Faceted low-poly objects.** Use a smooth underbody with a shell of soft painted dab cards (the haystacks, the ram,
  Cotopaxi's rocks). Flat where the artist drew flat (Kandinsky's cannons became drawn cards, not 3D guns).
- **Floor patches that read as rugs or discs**: a hard ellipse of bright colour dominating the shot. Use the painting's
  own ground colour, a broken irregular edge, and only as big as the action needs.
- **Crowds standing in a line facing the camera.** People are never still: lean, drift, turn to each other.
- **Things hanging down the wall**, anything on the picture rail (the guard cuts it), cartoon clouds for smoke.
- **The look camera**: the work small or off-centre, a neighbour centred instead, a stray thing in shot (a stunt ramp's
  neon edge), the action too small to read, or the payoff above the top of the frame. Set `stage.cam` explicitly, check
  what is in frame at the payoff, and keep the whole work in view.
- **Point sprites** slip past the guard in the check: use quads.
- **A floor or wall mesh washed pale**: the gallery's own lamp pools and wall washes are additive at renderOrder 4,
  so a transparent mesh drawn at 4 or below is bleached by them. Draw yours at 5 or above.
- **Soft floor shadows**: `L.blobs(n, { fade: true })` if you want a blob's darkness to follow the `k` you pass to
  `set()` (without `fade` every blob is full strength). Blobs are guarded like everything added with `L.add`.
- **Neighbours hung low**: a tall portrait next door can come down to 0.8 m, and anything of yours in front of it
  from a low side camera is cut by the guard. Keep the scene small or to the clear side.
- **Lovely from one camera only**: check the low (toy's-eye) and wide room views too.
- Toy-like figures: stripes too bold and regular, flat cartoon faces. Model softly, as the painter did.
- **A device already used.** Before you design, read the words in `src/life/index.js` and the header comments of any
  show that sounds like yours. Do not repeat another show's main moment. Used so far and now closed unless the picture
  truly demands it: a small table with papers that a draught blows to the floor (Degas 14574, Manet 14591); a picture
  brushed in stroke by stroke as its whole show (Morisot, Degas); things simply sliding out from under the frame and
  standing there. Find what only this picture has.

## How to work
- To read what the museum says about your work: `curl -s -A "painting-notes/1.0" "https://api.artic.edu/api/v1/artworks/<id>?fields=title,artist_display,date_display,medium_display,description,short_description,subject_titles,style_title,term_titles"`
  (plain curl with that generic User-Agent and no personal details; the site refuses headless Chrome). Don't batch or loop it.
- Link the offline pictures (gitignored; do NOT copy):
  `ln -s /Users/cfreder2/Documents/personal/gamedev/sorry-the-museum-is-closed/data/img data/img`
- Serve your worktree on YOUR port with the threaded server, in the background (stop it when you finish):
  `python3 tools/dev/serve.py <port> .`
- Check a file parses: `node -e "import('./src/life/<file>.js').catch(e => console.log(e.message))"` ("Cannot find
  package 'three'" means it parsed; `node --check` is not trusted here).
- Render and judge your own work: `node tools/lifesheet.mjs <id> --port <port> --video` (contact sheet and a 10 s film
  to `~/Desktop/Museum-life/`). Look at the sheet and at frames from the film, critically, and iterate until you would
  ship it. `--phone` once at the end for the frame cost.
- Other helpers share the GPU: one browser at a time, generous timeouts. Delete the
  `$TMPDIR/puppeteer_dev_chrome_profile-*` folders your own runs leave (disk is limited).
- Add your import line to `src/life/index.js` in the same style (file, room, artist, title: word).
- Commit on your worktree branch, message ending `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`.
  Do NOT push, bump the build, or edit prompts.md, `src/paintlife.js` or `src/museum.js` (if the kit needs a change,
  say so in your report).
- A living work's label glows faint green automatically, and its sounds are picked up by the sound book: nothing to do.

## Report back (short)
What comes out and why (2 to 4 sentences), anything where you followed the picture against the task message, the
files, the guarantee result line, the phone frame cost, the sheet and film paths, the branch and commit, and what you
are unsure of.
