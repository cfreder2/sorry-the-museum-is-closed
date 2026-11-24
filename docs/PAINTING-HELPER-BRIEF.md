# Brief: make one painting come alive

For a helper (an agent) asked to make ONE painting come alive in "Sorry, the Museum is Closed" (Three.js r170, plain ES
modules, no build). Your work, its id, room, port and starting word are in your task message. Twenty are done; this is
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
6. From the work, never mocking it. Religious works are treated gently: light, a slow drift, never comic.

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
- **Lovely from one camera only**: check the low (toy's-eye) and wide room views too.
- Toy-like figures: stripes too bold and regular, flat cartoon faces. Model softly, as the painter did.

## How to work
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
