// What is on the security desk's computer: the files.
//
// A small made-up filesystem for the terminal in the security control rooms (src/secterm.js reads it,
// src/secdesk.js shows it). The night shift's own paperwork: incident reports, a handover, the rota,
// tickets Facilities keep closing, an email thread in which the Director denies everything. They are
// clues, and they point at things that are really in the building (the grate in the lobby, the mouse
// grilles, the harbour light, the rings on the ballfield, the green edge to a living picture's label,
// the vent by the dumpster). They never say what is going on: the night shift does not know.
//
// One folder is locked (/sublevel9, CLEARANCE 9). Its password is in two halves, one on a sticky note
// on each control room's monitor (src/secdesk.js draws the notes; the handover says where they are).
// Inside, three redacted papers and one whole one: a page of the Green Cheese file (src/story.js,
// 'nightlog').
//
// No DOM and no three.js here, so it can be tested in plain node. Lines are kept under 48 characters:
// that is what fits across a phone.
//
// A file: { text: string | (E) => string, edit?: true (may be changed and saved), page?: story page id,
// hidden?: true (a dot file) }. E is what the desk knows tonight: { desk (1 or 2), clock, bots: [{ id,
// level, beat }], cam17 (the room CAM 17 was in), best (the donut game's best score), clearance }.

export const HOME = '/home/nightshift';
export const LOCKED = '/sublevel9';
export const HALVES = ['JAR4', 'WAVED'];            // the password, a half to a control room (in that order)
const squash = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
// 'ok', 'half' (one of the two halves alone) or 'no'.
export function checkPassword(s) {
  const q = squash(s), a = squash(HALVES[0]), b = squash(HALVES[1]);
  return q === a + b ? 'ok' : q === a || q === b || q === b + a ? 'half' : 'no';
}

const pad = (s, n) => (String(s) + ' '.repeat(n)).slice(0, n);

export const FILES = {
  '/README.txt': { text: E => `SECDESK-0${E.desk || 1} · WATCHMAN 4.1 · night profile
==========================================
Logged in as: nightshift (clearance ${E.clearance ? '9 ?!' : '2'})

- Type  help  if you are new. Type it anyway.
- The Tracker shows the robots. The robots
  do not show you. Usually.
- Incident reports go in /incidents.
  Not on the whiteboard.
  (They go on the whiteboard.)
- /sublevel9 is Facilities' folder. It wants
  clearance 9. You have clearance 2.
  That is seven short.
- There is no donut game on this computer.

The coffee machine still owes me 75 cents.
` },

  // ------------------------------------------------------------ the night shift's own
  [HOME + '/handover.txt']: { text: `HANDOVER · days to nights
------------------------------------------
1. Robots charged. Unit 7 has a squeak.
   It is not a mouse. I checked.
2. Mice: five. They glow. Pest control say
   mice do not glow, and have stopped
   taking our calls.
3. The lobby floor grate is humming again.
   Same five notes. Engineers say it is
   "the pipes". Pipes cannot hold a tune.
4. Front doors LOCKED. The air vent beside
   them still is not. Ticket open since
   the autumn.
5. Facilities changed the clearance 9
   password AGAIN. Dave was in the room.
   Dave has written it on sticky notes
   "for safety": half on the monitor in
   Control 1, half on the one in
   Control 2. So nobody can read both.
   Except by walking.
6. If the lift goes to 3 by itself, let it.
7. One donut left in the box. It is MINE.
   I have counted it.
` },
  [HOME + '/notes.txt']: { edit: true, text: `things to tell days
-------------------
- camera 14: the toy car is back. it waved
  its aerial at me. (it did not. go home.)
- the LABELS. look at the labels,
  not the pictures.
- ask Dave what "do not feed" means
  on a luggage tag.
-
` },
  [HOME + '/rota.txt']: { text: E => `PATROL ROTA · tonight
------------------------------------------
unit    lvl  beat
${(E.bots && E.bots.length ? E.bots : [{ id: '(none)', level: '-', beat: 'all units docked' }]).map(b => `${pad(b.id, 7)} ${pad(b.level, 4)} ${b.beat}`).join('\n')}
(none)  LL   "not required": Facilities
(none)  --   below that: there is no
             below that

Walks at 1, 3 and 5. The robots do the
rest. The robots do not go downstairs.
Nobody has told us why. Nobody has told
the robots either: they just won't.
` },
  [HOME + '/donut_fund.txt']: { edit: true, text: `DONUT FUND · honesty box
------------------------------------------
name          owes
Dave          $4.50  (and an apology
                      to the sculpture)
the new one   $40    (lost at cards. on
                      the ROOF. to whom?)
me            $0
whoever took
two on Tuesday  ?    (left a poker chip.
                      fair enough.)
` },
  [HOME + '/.history']: { hidden: true, text: `ls
cd sublevel9
cd /sublevel9
cd /SUBLEVEL9
sudo cd /sublevel9
please
login
login password
login 12345
login director
login cheese
cat /dev/coffee
donut
donut
donut
` },
  [HOME + '/.donut_scores']: { hidden: true, text: E => `LAST DONUT · house record
best: ${E.best || 0}
(the day shift's best: 0. they have a
canteen.)
` },

  // ------------------------------------------------------------ mail
  [HOME + '/mail/01_lights_over_lake.eml']: { text: `From:    Night Security
To:      The Director
Subject: Light over the lake (4th report)

Director,
02:10 again. Green, falling, towards Butler
Field. No sound. The harbour keeper rang
the desk about it as well. She also asks
who moves crates at two in the morning.
I said nobody. She said then nobody has a
great many crates.
Do we log it?
------------------------------------------
From:    The Director
Subject: RE: Light over the lake

Planes.
------------------------------------------
From:    Night Security
Subject: RE: RE: Light over the lake

Planes go along. This went down.
------------------------------------------
From:    The Director
Subject: RE: RE: RE: Light over the lake

Then it was a plane landing. Please stop
counting them. And stop answering the
desk telephone to the harbour.     — D.
` },
  [HOME + '/mail/02_heating_bill.eml']: { text: `From:    Accounts
To:      Facilities
Cc:      Night Security (why?)
Subject: Heating bill, line 9

The bill lists heat for "SUB-LEVEL 9,
24 hours". We have a lower level. We do
not have nine of them. Please advise.
------------------------------------------
From:    Facilities
Subject: RE: Heating bill, line 9

There is no sub-level 9. It is a typing
error for the heating plant. Pay it.
------------------------------------------
From:    Accounts
Subject: RE: RE: Heating bill, line 9

The heating plant has a line already.
It is line 4.
------------------------------------------
From:    Facilities
Subject: RE: RE: RE: Heating bill, line 9

Then we have two heating plants. Pay it.
` },
  [HOME + '/mail/03_your_colleague.eml']: { text: `From:    Human Resources
To:      Night Security (all)
Subject: Your colleague's leave

Your colleague on the second-floor walk
has been given three weeks' leave, with
our thanks. For the record:

- paintings do not move.
- it does not rain indoors (Gallery 201).
- the suit of armour did not turn
  its head.
- wall labels do not glow. They are card.

If you see a painting move, you are tired.
Look at something else.
Do not look at the label.
` },

  // ------------------------------------------------------------ incidents
  '/incidents/incident_log.txt': { text: `INCIDENT LOG · nights · this week
------------------------------------------
01:15 Mouse, lobby. Green. Went down the
      floor grate.
      > none. It is a mouse.
02:10 Green light over the lake, falling.
      No sound.
      > logged (0210)
02:25 Lobby grate humming. Five notes.
      > told the engineers (0225)
02:26 The engineers hung up.
03:10 CAM 14: toy car in the galleries.
      > rebooted CAM 14
03:11 CAM 14: toy car still there.
      > rebooted myself. Coffee.
03:40 Lift called to 3. By nobody.
      > logged (0340)
04:19 2nd floor: "the pictures are moving"
      > colleague sent home (0419)
04:20 Labels beside the same pictures lit
      green at the edges. Card does not
      do that.
      > not logged. See HR.
05:02 Mice. All five. In a row. Looking
      at the lift.
      > logged (0502). Left quietly.
05:10 Snow on the ballfield melting.
      In rings.
      > groundskeeper's problem
05:30 Nothing. Suspicious.
      > logged
` },
  '/incidents/0210_lake_light.txt': { text: `INCIDENT 0210 · LIGHT OVER THE LAKE
------------------------------------------
Seen from: staff door, east side. Also
  CAM 22 (long lens), for one frame.
What: one green light, north-east, coming
  DOWN, in a curve. Not fast.
Where to: behind the trees on Butler
  Field. About where centre field would
  be, if anybody played ball in the snow.
Sound: none. Then, very faint, a tune.
  Five notes. I know it from somewhere.
  (The lobby. The grate.)

Fourth this month. Always after two.

Director's ruling: a plane.
My ruling: planes do not park under
  a ballfield.
` },
  '/incidents/0225_lobby_grate.txt': { text: `INCIDENT 0225 · LOBBY FLOOR GRATE
------------------------------------------
Just inside the front doors, in the floor.
Lit green from below. There is no lighting
circuit under the lobby. I looked it up.

It hums. Put an ear to it (I did; don't)
and it is not a hum. It is five notes,
a long way down, over and over.
Like somebody asking the same question.

Brass tag on the frame: "KEEP SHUT. — D."
It IS shut. It does not help.

The mice use it as a front door.
` },
  '/incidents/0340_lift.txt': { text: `INCIDENT 0340 · LIFT
------------------------------------------
03:40 Service lift called to level 3.
      Nobody on 3. Nobody anywhere.
03:41 Lift arrives. Doors open. Doors
      wait. Doors close.
03:44 Roof terrace: fairy lights ON.
      Sound of cards being shuffled.
03:50 Sent the new one up to look.
04:30 The new one came down $40 lighter
      and will not say who to.

Found on the lift floor: one poker chip.
One luggage tag, the kind Facilities use:

   ITEM 12. IF FOUND, RETURN TO SL9.
   DO NOT FEED.

Rang Facilities. They say there is no
item 12, and no SL9, and could they have
the tag back.
` },
  '/incidents/0419_pictures.txt': { text: `INCIDENT 0419 · "THE PICTURES ARE MOVING"
------------------------------------------
Reported by: second-floor walk
  (now on leave)

Statement, as given:
"The street in 201. It was raining IN the
 picture, and then the floor was wet."
"The apples in 248 rolled. I looked away
 and they had rolled back."
"It only does it while you LOOK. Go right
 up to one and look."
"Every one that does it has a green edge
 to its label. Like a lamp behind the
 card. That is how you tell. Check the
 labels."

Action: statement taken. Colleague taken
home.

Note: I went up and checked the labels.
I am not putting what I saw in a report.
` },
  '/incidents/0502_mice.txt': { text: `INCIDENT 0502 · RODENTS (LUMINOUS)
------------------------------------------
Count: five. One to a wing: old building
north, old building south, the Rice
building, the Modern Wing, and down here.

They glow. Their footprints glow. They are
afraid of nobody. They steal anything that
shines: two keys, a teaspoon, my lucky
quarter, and I think a page of something.

Each goes home through a little grille,
low on a wall. The grilles are shut. We
did not fit them.

Follow one all the way home and its grille
opens after it. So I am told. I have never
kept up.

Pest control's advice: "stop phoning".
` },

  // ------------------------------------------------------------ maintenance
  '/maintenance/ticket_4471_condensation.txt': { text: `TICKET 4471 · "CONDENSATION"
Raised by: Night Security
Status:    CLOSED (by Facilities)
------------------------------------------
Panel says: HUMIDITY HIGH, ZONE SL9.
Twelve metres down, it says. We have no
zone SL9. The panel disagrees, nightly.

Facilities: Condensation. Closed.
Security:   Condensation where? There is
            nothing under the lower level.
Facilities: Correct. Closed.
Security:   Then what is condensing?
Facilities: The heating plant. Closed.
Security:   The reading is green. The
            panel has no green lamp.
            It has one now.
Facilities: Do not tap the glass. Closed.
` },
  '/maintenance/ticket_4502_vent_cover.txt': { text: `TICKET 4502 · VENT COVER, LOADING SIDE
Raised by: Night Security
Status:    OPEN ("low priority")
------------------------------------------
Where: outside, back wall, low down,
  beside the dumpster.
Fault: the cover does not latch. Anything
  small could get in. Anything small
  could get OUT.

Note: the robots put intruders in that
dumpster. The intruder climbs out, sees
the vent, and is indoors again before the
robot is.

Asked for: one latch.
Facilities: Low priority.
` },
  '/maintenance/ticket_4533_ballfield.txt': { text: `TICKET 4533 · BUTLER FIELD, SNOW
Raised by: the groundskeeper
           (by telephone. cross.)
Status:    CLOSED (by Facilities)
------------------------------------------
Fault: the snow on centre field keeps
  melting. In rings. Five marks round the
  outside, five colours. He rakes it
  over. Next night: rings.

Also: "the ground hums when I stand
  on it."
Also: "it's hollow. Thirty years in this
  park. I know hollow."
Also: penguins. I did not ask.

Facilities: The field is not hollow.
            Closed.
` },
  '/maintenance/ticket_4540_coffee.txt': { text: `TICKET 4540 · COFFEE MACHINE
Raised by: Night Security
Status:    OPEN (nine weeks)
------------------------------------------
Fault: took 75 cents. Gave nothing.
       Made the noise. No cup.

Facilities: Have you tried another coin?
Security:   That is how it got to 75.
` },

  // ------------------------------------------------------------ cameras
  '/cameras/camlist.txt': { text: E => `CAMERAS · 24 fitted
------------------------------------------
01 Michigan Avenue lobby       OK
02 Lobby, floor grate          OK *
03 Coat check                  OK
04 Grand staircase             OK
05 Old building, north         OK
06 Old building, south         OK
07 Rice building               OK
08 Griffin Court               OK
09 Modern Wing, 2nd            OK
10 Modern Wing, 3rd            OK
11 Thorne Rooms                OK (small)
12 Lower level, corridor       OK
13 Lower level, lift           OK
14 2nd floor ring              OK **
15 Loading dock                OK
16 Dumpster, back wall         OK (filthy)
17 ${pad(E.cam17 || 'Gallery 240', 27)} NO SIGNAL
18 Director's corridor         "PRIVATE"
19 Security control 1          OK (me)
20 Security control 2          OK (not me)
21 Roof terrace                OK ***
22 Butler Field, long lens     OK (snow)
23 Harbour light, long lens    OK ****
24 SL9                         NOT FITTED

*    picture has a green cast. Lens fine.
**   toy car. Again.
***  fairy lights. Nobody up there. Cards?
**** keeper's hut dark since the autumn.
17:  no signal since March. See cam17.
24:  not fitted. Then why is it on the list.
` },
  '/cameras/cam17_no_signal.txt': { text: E => `CAM 17 · ${E.cam17 || 'Gallery 240'} · NO SIGNAL
------------------------------------------
Fitted January. Lost in March.

Cause: cable cut, inside the wall.
Cleanly. From the other side.
There is no other side. It is a wall.

X-ray booked that wall twice to find the
break. Facilities cancelled it twice.

Last frame before it went:
  a wall. A picture. The Director, alone,
  after hours, with one hand on the
  picture. Not on the frame.
  ON THE PICTURE.
Then: no signal.

I asked. The Director said the picture
was crooked.
` },

  // ------------------------------------------------------------ what needs clearance 9
  [LOCKED + '/MANIFEST.txt']: { text: `SL9 · HOLDINGS                 CLEARANCE 9
------------------------------------------
1-8  ████████ fragments. Alloy: ███████.
     Inert.
9    OBJECT 9. No engine. No fuel. No
     door. Follows whoever goes near.
     DO NOT SIT IN IT.
10   Crystals, green, ██████. LEAKING.
     See: rodents.
11   Jar 4. ████████████. It waves.
     Nobody is to wave back.
12   ██████ ████. AT LARGE. Likes the
     lift. Plays cards. Wins.
13   Star chart. 39 light years, give or
     take. Annotated: "they ask to see
     the picture".
14   Keycard, PROJECT █████ ██████.
     Opens the east door.
15   ████████████████████████████████
     ████████ under the ████field.
` },
  [LOCKED + '/access_log.txt']: { text: `SL9 · WHO WENT DOWN            CLEARANCE 9
------------------------------------------
date    who   in     out    carried
██ Jan  D.    02:04  03:30  nothing
██ Feb  D.    02:10  04:15  1 crate, down
██ Mar  D.    02:01  ██:██  3 crates, down
              (CAM 17 failed same night)
██ ███  D.    ██:██  ██:██  12 crates, down
██ ███  ████  ██:██  ██:██  ██ crates, down

Crates up: none. Ever.

Note from the lift engineer:
"Your lift stops at a floor that is not
 on the buttons. I do not want to know."
` },
  [LOCKED + '/if_asked.txt']: { text: `MEMO · IF ASKED                CLEARANCE 9
------------------------------------------
- Sub-level 9 is "the heating plant".
- The lights over the lake are planes.
- The mice are "a trick of the light".
  (They ARE a light. Do not say so.)
- The grate in the lobby stays shut.
- The pictures do not move. If one has
  moved, it was being cleaned.
- The harbour keeper is "on holiday".
  ████████████████ the five notes ████
  ██████ her window ███████████████.
- The staff may be told: nothing.
- The public may be told:
  sorry, the museum is closed.     — D.
` },
  [LOCKED + '/first_night.log']: { page: 'nightlog', text: `PROJECT GREEN CHEESE
NIGHT LOG · THE FIRST NIGHT · 19██
(security's copy. not to leave SL9.)
------------------------------------------
02:07 Light over the lake. Green. Coming
      down slowly, as if choosing.
02:11 It is down on Butler Field. No
      crater. No noise. The snow round it
      has melted, in rings.
02:30 The Director arrives, in a dressing
      gown. Says: tarpaulin. Says: nobody
      saw anything.
03:15 It will not be lifted. It does not
      need to be. It goes where the
      Director goes.
04:00 It is out of sight. Below. The
      Director had somewhere ready.
      Nobody asked how long it had
      been ready.
04:40 It sang. Five notes. We wrote them
      down. The Director hummed them back
      and it stopped, as if that was
      not it.
05:00 Orders: it stays below. Nobody goes
      down but the Director. If it sings,
      shut the grate.

      Signed for the night shift, ██████
      Countersigned,  — D.
` },
};

// ------------------------------------------------------------------ the tree --
// The filesystem as the terminal sees it. `store` keeps what has been edited ({ get(path), set(path, text) });
// `env()` gives tonight's facts to the files that want them; `clearance` opens the locked folder.
export class VFS {
  constructor({ store = null, env = () => ({}) } = {}) {
    this.store = store; this.env = env; this.clearance = false;
    this.root = { name: '', dir: true, kids: new Map(), path: '/' };
    for (const [path, f] of Object.entries(FILES)) {
      const parts = path.split('/').filter(Boolean); let at = this.root;
      for (const p of parts.slice(0, -1)) { if (!at.kids.has(p)) at.kids.set(p, { name: p, dir: true, kids: new Map(), path: (at.path === '/' ? '' : at.path) + '/' + p }); at = at.kids.get(p); }
      const name = parts[parts.length - 1]; at.kids.set(name, { name, dir: false, path, f });
    }
  }
  locked(node) { return !this.clearance && !!node && (node.path === LOCKED || node.path.startsWith(LOCKED + '/')); }
  // An absolute, tidy path from whatever was typed: ~, .., ., backslashes, a drive letter, a missing slash.
  norm(cwd, p) {
    p = String(p || '').replace(/\\/g, '/').replace(/^[a-zA-Z]:/, '').trim();
    if (p === '~' || p.startsWith('~/')) p = HOME + p.slice(1);
    const out = [];
    for (const s of (p.startsWith('/') ? p : cwd + '/' + p).split('/')) { if (!s || s === '.') continue; if (s === '..') out.pop(); else out.push(s); }
    return '/' + out.join('/');
  }
  // The node at a path, forgiving about capitals and a left-off ending (readme for README.txt). null if there is none.
  node(cwd, p) {
    let at = this.root;
    for (const s of this.norm(cwd, p).split('/').filter(Boolean)) {
      if (!at.dir) return null;
      let k = at.kids.get(s);
      if (!k) { const low = s.toLowerCase(), all = [...at.kids.values()]; k = all.find(q => q.name.toLowerCase() === low) || (m => (m.length === 1 ? m[0] : null))(all.filter(q => q.name.toLowerCase().startsWith(low))); }
      if (!k) return null;
      at = k;
    }
    return at;
  }
  // What is in a folder: folders first, then files, by name. Dot files only if asked for.
  list(node, all = false) { return [...node.kids.values()].filter(k => all || !(k.f && k.f.hidden)).sort((a, b) => (b.dir - a.dir) || (a.name < b.name ? -1 : 1)); }
  read(node) {
    if (!node || node.dir) return null;
    const kept = node.f.edit && this.store ? this.store.get(node.path) : null;
    if (typeof kept === 'string') return kept;
    return typeof node.f.text === 'function' ? node.f.text(this.env()) : node.f.text;
  }
  write(node, text) { if (!node || node.dir || !node.f.edit) return false; if (this.store) this.store.set(node.path, String(text).slice(0, 4000)); return true; }
  // Every file, as { path, lines } (for grep and tree); what is locked is left out.
  walk(node = this.root, out = []) { for (const k of this.list(node, true)) { if (this.locked(k)) continue; if (k.dir) this.walk(k, out); else out.push(k); } return out; }
}
