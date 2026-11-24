# The sound book

Every sound and piece of music the game makes, recorded to MP3, and a page to listen to them quickly and mark each one
Good, Fix or Cut. All the game's sound is synthesised live; this hears it the way a player would, at the default
slider levels (master 0.8, music 0.8, motor 0.5), with nothing normalised.

## Run it

```sh
# 1. serve the repo (a threaded server: python's plain http.server hangs the boot), with the offline pictures linked
ln -s <main checkout>/data/img data/img            # once, if data/img is missing
python3 serve.py 8887 .                           # any threaded static server on the port

# 2. record (skips what is already recorded)
node tools/soundbook/record.mjs                   # -> ~/Desktop/Museum-sounds/index.html
```

Open `~/Desktop/Museum-sounds/index.html` straight from disk. Verdicts and notes are kept in the browser (localStorage);
**Copy review** puts every Fix and Cut, with its notes and source line, on the clipboard to paste back to the developer.
Keys: space play/pause, j/k or the arrows next/previous, 1/2/3 good/fix/cut, n note, a auto-advance.

Options:

| | |
|---|---|
| `--out <dir>` | where it all goes (default `~/Desktop/Museum-sounds`) |
| `--port <n>` | the server's port (default 8887) |
| `--force` | record everything again |
| `--only id,id` | (re-)record just these (always re-records them) |
| `--group "Outdoors"` | (re-)record one group (add `--force` to redo what is already there) |
| `--list` | print the catalogue and stop |
| `--page-only` | rebuild index.html from `sounds.json` without a browser |
| `--keep-webm` | keep the raw Opus recordings too |

It takes about an hour and a half for everything. Puppeteer is the copy inside mermaid-cli (or `$PUPPETEER`); ffmpeg is
`$FFMPEG`, `~/Desktop/Avara-trailer/ffmpeg` or on the PATH. One browser at a time: it uses the GPU.

## What it writes

- `mp3/<id>.mp3` (LAME VBR, -q:a 2), `wave/<id>.png` (the waveform)
- `sounds.json`: per entry the peak (dBFS, true peak), the loudest moment (max momentary loudness, LUFS), the integrated
  loudness, the length, and any warnings
- `index.html`: the review page, everything inline but the MP3s and waveforms beside it

Warnings: **clipping** (peak above −1 dBFS), **nearly silent** (loudest moment below −60 LUFS and
peak below −45 dBFS: a broken trigger, or a sound too quiet to hear), **very quiet** (loudest moment below −60 LUFS but
a peak above that: short, low clicks), **louder/quieter than its group** (both the loudest moment and the peak 10 or more
from the group's medians), and **the trigger threw**.

## How it hears everything

`record.mjs` patches `AudioNode.prototype.connect` before the game loads, so anything connected to a context's
destination also feeds a tap (a `MediaStreamAudioDestinationNode`) and an analyser. A `MediaRecorder` records the tap as
Opus at 192 kbps; ffmpeg trims the silence before the first sound and makes the MP3, the waveform and the measurements.

Before each entry it hushes everything else: guards off, gallery music off, the slow chords off, the carol from the tree
stubbed out, the room tone and the motor muted, any look ended, the toy parked in a quiet gallery (found by listening when
the game boots). Then it runs the entry's `setup` (not recorded), waits for quiet, records `secs` plus a 1.5 s tail while
the `trigger` runs, runs `after`, and undoes anything patched. If something is still sounding after an entry, the game is
started afresh before the next.

## Add an entry

Entries live in `catalogue.mjs` (the toy, the Sound class's own sounds, the painting shows) and `entries/*.mjs` (by area).
A painting show needs nothing: there is one entry per show from `__life.list()`, so a new one is picked up by itself.

```js
{
  id: 'sled-whoosh',                       // unique; the file names come from it
  group: 'Outdoors',                       // one of GROUPS in catalogue.mjs
  title: 'Sled run',
  when: 'On the sled hill, riding down.',  // one plain line: where and when a player hears it
  src: 'src/sledhill.js:212',              // or 'src/sledhill.js#unique text on that line'
  secs: 4,                                 // recorded from the trigger, plus the tail
  setup: async sb => { sb.place('G201'); },          // optional, not recorded
  trigger: async sb => { sb.feat('sled').whoosh(sb.k); },
  after: async sb => { /* put things back */ },      // optional
  note: 'Shown on the page.',              // optional; with trigger: null, says why it is not recorded yet
}
```

`setup`, `trigger` and `after` run inside the page (they are sent as text), so they can use nothing from the file around
them: only `sb`, the helper:

| | |
|---|---|
| `sb.G`, `sb.k`, `sb.S` | the game (`window.__ah`), the features' kit, the `Sound` |
| `sb.feat(id)` | a registered feature (the live object) |
| `await sb.mod('carols.js')` | a game module's namespace (the same instance the game runs) |
| `sb.wait(s)`, `sb.now()` | a pause; the audio clock |
| `sb.place('G201')` / `sb.place(x, y, z, yaw)` | put the toy in a room's middle, or somewhere exact |
| `sb.patch(obj, name, fn)`, `sb.later(fn)` | change something for this entry only; run something after it |
| `sb.motor(v)` | the motor as if the toy were moving: `{ kind: 'car', speed, throttle, air }`, `{ kind: 'drone', thrust, landed }`, `{ spec: { hum: 'ufo' }, ... }` |
| `sb.carol(true)` | let the tree's Jingle Bells play |
| `sb.roomTone` | the room tone's gain (0 while recording; 0.05 in the game) |
| `sb.settle(max)` | wait until it is quiet |

Prefer calling the game's own code; else force the moment (set what `update()` checks: the game keeps running while it
records); else replay the source's own synth calls with its parameters, and say so in `note`. If a sound cannot be
reached yet, list it with `trigger: null` and a note, so the page shows it as not recorded rather than missing it.

## Re-record

After changing a sound in the game: `node tools/soundbook/record.mjs --only <id>` (or `--group <g> --force`). The page
is rebuilt at the end of every run, and verdicts already given stay (they are kept by id in the browser).
