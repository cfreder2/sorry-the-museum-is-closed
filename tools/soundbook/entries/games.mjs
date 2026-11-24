// Sound book entries: the races (src/race.js, src/racespots.js) and the games (poker, hockey, Simon, the arcade monitors, the piano).
// holdem.js makes no sound of its own (poker.js makes the poker sounds).
export const entries = [
  // ------------------------------------------------------------------ Race: src/race.js
  {
    id: 'race-countdown', group: 'Race', title: 'Countdown and go',
    when: 'At a race arch, after pressing E: three beeps, then the long high GO.',
    src: 'src/race.js:223', secs: 4,
    note: 'Replayed from the source lines (beep 440 Hz on 3, 2, 1 a second apart, then 880 Hz for GO), timed as Race.update times them.',
    trigger: async sb => {
      const S = sb.S;
      [0.1, 1.1, 2.1].forEach(at => S.beep(440, 0.16, 0.09, at));
      S.beep(880, 0.5, 0.11, 3.1);
    },
  },
  {
    id: 'race-gate', group: 'Race', title: 'Through a gate',
    when: 'In a race, each time you drive through one of the gates on the course.',
    src: 'src/race.js:292', secs: 1.5,
    trigger: async sb => { sb.S.gate(); },
  },
  {
    id: 'race-lap', group: 'Race', title: 'Lap',
    when: 'In a race, crossing the start line to begin another lap.',
    src: 'src/race.js:289', secs: 2,
    trigger: async sb => { sb.S.lap(); },
  },
  {
    id: 'race-final-lap', group: 'Race', title: 'Final lap',
    when: 'In a race, crossing the start line into the last lap: the lap bells and a high beep.',
    src: 'src/race.js:290', secs: 2,
    trigger: async sb => { sb.S.lap(); sb.S.beep(1175, 0.3, 0.07); },
  },
  {
    id: 'race-place', group: 'Race', title: 'Place gained, place lost',
    when: 'In a race, when you pass a rival (high blip) and, a second later here, when one passes you (low blip).',
    src: 'src/race.js:238', secs: 1.5,
    trigger: async sb => { sb.S.beep(990, 0.08, 0.05); await sb.wait(1); sb.S.beep(330, 0.08, 0.05); },
  },
  {
    id: 'race-finish', group: 'Race', title: 'Finish',
    when: 'Crossing the line at the end of the last lap, win or lose.',
    src: 'src/race.js:303', secs: 3.5,
    trigger: async sb => { sb.S.finish(); },
  },
  {
    id: 'race-cone', group: 'Race', title: 'Hitting a cone',
    when: 'In a race, when your car runs into one of the cones beside the course.',
    src: 'src/race.js:400', secs: 1,
    trigger: async sb => { sb.S.knock(2, false); },
  },

  // ------------------------------------------------------------------ Race: src/racespots.js
  {
    id: 'racespots-rev', group: 'Race', title: 'Rival revving',
    when: 'Near a race arch, now and then, as a waiting rival car revs its engine (louder the closer you are).',
    src: 'src/racespots.js:263', secs: 1.5,
    note: 'Played at the loudness heard about 4 m away, where the race is offered.',
    trigger: async sb => { sb.feat('racespots')._rev(false, 0.65); },
  },
  {
    id: 'racespots-rev-alien', group: 'Race', title: 'Zib revving',
    when: 'At the crop circle on Butler Field, now and then, as Zib the visitor gives its two soft notes.',
    src: 'src/racespots.js:263', secs: 1.5,
    note: 'Played at the loudness heard about 4 m away, where the race is offered.',
    trigger: async sb => { sb.feat('racespots')._rev(true, 0.65); },
  },
  {
    id: 'racespots-alien-hum', group: 'Race', title: 'Zib humming',
    when: 'Near the crop circle on Butler Field (louder nearer), and all through a race with Zib.',
    src: 'src/racespots.js:270', secs: 5.5,
    note: 'The feature’s update is stood in for by the two hum lines alone, at the level of a race with Zib, for 5 s.',
    trigger: async sb => {
      const f = sb.feat('racespots');
      let on = true;
      sb.patch(f, 'active', () => true);
      sb.patch(f, 'update', function (dt) {
        this.t += dt;
        const hum = on ? 0.8 : 0;
        this.hum.set(hum * 0.05); this.hum2.set(hum * 0.025 * (0.6 + 0.4 * Math.sin(this.t * 5)));
      });
      await sb.wait(5);
      on = false;
    },
    after: async sb => { const f = sb.feat('racespots'); f.hum.set(0); f.hum2.set(0); },
  },
  {
    id: 'racespots-boost', group: 'Race', title: 'Boost ring',
    when: 'In the race with Zib, driving over the ring of green light that throws you on faster.',
    src: 'src/racespots.js:296', secs: 1,
    note: 'Replayed from the source lines.',
    trigger: async sb => {
      sb.k.synth.note(330, 0.35, { type: 'sawtooth', vol: 0.04 });
      sb.k.synth.note(660, 0.4, { type: 'sine', vol: 0.05, at: 0.06 });
    },
  },
  {
    id: 'racespots-bump', group: 'Race', title: 'Bumping a parked rival',
    when: 'At a race arch, driving hard into one of the rival cars waiting there.',
    src: 'src/racespots.js:319', secs: 1,
    note: 'Replayed from the source line at a firm hit (into = 3 m/s).',
    trigger: async sb => { sb.S.bump(1.5 + 3 * 0.3); },
  },

  // ------------------------------------------------------------------ Games: src/poker.js
  {
    id: 'poker-deal', group: 'Games', title: 'Poker: the deal',
    when: 'At the card table on the roof, as each new hand is dealt.',
    src: 'src/poker.js:176', secs: 1,
    trigger: async sb => { sb.G.poker.sound.tick(0.07, 2400, 0.05); },
  },
  {
    id: 'poker-your-move', group: 'Games', title: 'Poker: your move',
    when: 'At the card table, when you fold, check, call or raise.',
    src: 'src/poker.js:196', secs: 1,
    trigger: async sb => { sb.G.poker.sound.tick(0.08, 3200, 0.04); },
  },
  {
    id: 'poker-their-move', group: 'Games', title: 'Poker: another player moves',
    when: 'At the card table, as each of the other players checks, calls or raises (bright) or folds (dull), second here.',
    src: 'src/poker.js:222', secs: 1.5,
    trigger: async sb => { const s = sb.G.poker.sound; s.tick(0.06, 3000, 0.04); await sb.wait(0.9); s.tick(0.06, 900, 0.04); },
  },
  {
    id: 'poker-win', group: 'Games', title: 'Poker: you win the hand',
    when: 'At the card table, when the pot is yours.',
    src: 'src/poker.js:206', secs: 2,
    trigger: async sb => { sb.G.poker.sound.lap(); },
  },
  {
    id: 'poker-lose', group: 'Games', title: 'Poker: beaten at the showdown',
    when: 'At the card table, when the cards are shown and yours lose.',
    src: 'src/poker.js:206', secs: 1,
    trigger: async sb => { sb.G.poker.sound.bump(2); },
  },

  // ------------------------------------------------------------------ Games: src/hockey.js
  {
    id: 'hockey-puck', group: 'Games', title: 'Hockey: hitting the puck',
    when: 'On the frozen pond, when your car or the blue car strikes the puck.',
    src: 'src/hockey.js:108', secs: 1,
    note: 'Played at a firm strike (puck speed 5 m/s); harder strikes are louder.',
    trigger: async sb => { sb.G.hockey.sound.knock(5, false); },
  },
  {
    id: 'hockey-bank', group: 'Games', title: 'Hockey: puck off the bank',
    when: 'On the frozen pond, when the puck hits the snow bank round the edge hard.',
    src: 'src/hockey.js:148', secs: 1,
    note: 'Played at a hit of 4 m/s into the bank.',
    trigger: async sb => { sb.G.hockey.sound.knock(4, true); },
  },
  {
    id: 'hockey-goal', group: 'Games', title: 'Hockey: goal',
    when: 'On the frozen pond, whenever either side scores.',
    src: 'src/hockey.js:83', secs: 3.5,
    note: 'Replayed from the source line (Hockey._goal would change the score and flag a trophy).',
    trigger: async sb => { sb.G.hockey.sound.finish(); },
  },

  // ------------------------------------------------------------------ Games: src/simon.js
  {
    id: 'simon-pads', group: 'Games', title: 'Colour pedestal: the four pads',
    when: 'At the colour pedestal in Griffin Court, as the pattern plays and as you press it back: yellow, blue, red, green here.',
    src: 'src/simon.js:107', secs: 2.5,
    trigger: async sb => {
      const s = sb.G.simon, gap = 440;
      for (const p of [0, 1, 2, 3]) { s._light(p, gap * 0.7); await sb.wait(gap / 1000); }
    },
  },
  {
    id: 'simon-win', group: 'Games', title: 'Colour pedestal: the roof lets go',
    when: 'In Griffin Court, after five patterns right, as the confetti comes down from the roof.',
    src: 'src/simon.js:167', secs: 3,
    trigger: async sb => { sb.G.simon.celebrate(); },
  },

  // ------------------------------------------------------------------ Games: src/piano.js
  {
    id: 'piano-notes', group: 'Games', title: 'Piano: playing the keys',
    when: 'At a grand piano in a recital room, playing it: a scale from middle C, then a low C and a high C.',
    src: 'src/piano.js:197', secs: 6,
    trigger: async sb => {
      const P = sb.G.piano;
      for (const m of [60, 62, 64, 65, 67, 69, 71, 72]) { P.press(m, 'sb'); await sb.wait(0.3); P.release(m, 'sb'); await sb.wait(0.04); }
      P.press(36, 'sb'); await sb.wait(1.4); P.release(36, 'sb');
      P.press(96, 'sb'); await sb.wait(0.9); P.release(96, 'sb');
    },
    after: async sb => { sb.G.piano.hush(); },
  },
  {
    id: 'piano-fur-elise', group: 'Games', title: 'Piano: Für Elise (playing by itself)',
    when: 'At a grand piano, after pressing LISTEN (or Enter): it plays the opening of Für Elise by itself.',
    src: 'src/piano.js:250', secs: 11.5,
    note: 'The piano is switched on without opening its screen, and its own LISTEN runs the tune.',
    trigger: async sb => {
      const P = sb.G.piano;
      P.auto = null; P.on = true; P.listen();
    },
    after: async sb => {
      const P = sb.G.piano;
      P.auto = null; P.hush(); P.on = false;
      const b = P.el && P.el.querySelector('[data-act=listen]'); if (b) b.classList.remove('on');
    },
  },

  // ------------------------------------------------------------------ Games: src/arcade.js, playing a game
  {
    id: 'arcade-blip', group: 'Games', title: 'Arcade: blip',
    when: 'Playing on an arcade monitor: a cell opened, a brick or alien hit, a block turned, tiles merged, a lamp switched (three here).',
    src: 'src/arcade.js:192', secs: 1,
    note: 'Replayed from the source line (Arcade.frame turns a game’s \'blip\' into this).',
    trigger: async sb => { for (let i = 0; i < 3; i++) { sb.S.tick(0.06, 2600, 0.03); await sb.wait(0.25); } },
  },
  {
    id: 'arcade-hit', group: 'Games', title: 'Arcade: hit',
    when: 'Playing on an arcade monitor: the ball off a bat, a block landing, the machine’s move in Noughts & Crosses.',
    src: 'src/arcade.js:192', secs: 1,
    note: 'Replayed from the source line (Arcade.frame turns a game’s \'hit\' into this).',
    trigger: async sb => { sb.S.beep(220, 0.05, 0.05); },
  },
  {
    id: 'arcade-good', group: 'Games', title: 'Arcade: good',
    when: 'Playing on an arcade monitor: food eaten, a line cleared, a wave beaten, a round won.',
    src: 'src/arcade.js:192', secs: 1,
    note: 'Replayed from the source line (Arcade.frame turns a game’s \'good\' into this).',
    trigger: async sb => { const s = sb.S; s.beep(660, 0.07, 0.05); await sb.wait(0.08); s.beep(990, 0.1, 0.05); },
  },
  {
    id: 'arcade-bad', group: 'Games', title: 'Arcade: bad',
    when: 'Playing on an arcade monitor: a life lost, a mine, a crash, game over.',
    src: 'src/arcade.js:192', secs: 1,
    note: 'Replayed from the source line (Arcade.frame turns a game’s \'bad\' into this).',
    trigger: async sb => { sb.S.beep(110, 0.3, 0.07); },
  },
  {
    id: 'arcade-shot', group: 'Games', title: 'Arcade: firing',
    when: 'Playing Star Guard or Outpost Nine, each shot fired (three here).',
    src: 'src/arcadegames.js:300', secs: 1.2,
    note: 'Replayed from the source line in src/arcade.js:192 (a game asking for 880 Hz).',
    trigger: async sb => { for (let i = 0; i < 3; i++) { sb.S.beep(880, 0.16, 0.05); await sb.wait(0.3); } },
  },
  {
    id: 'arcade-echo-pads', group: 'Games', title: 'Arcade: Echo pads',
    when: 'Playing Echo on its monitor: the four pads, up, right, down, left, as it shows the tune and as you repeat it.',
    src: 'src/arcadegames.js:400', secs: 2.5,
    note: 'Replayed from the source line in src/arcade.js:192 (each pad asks for its own frequency).',
    trigger: async sb => { for (const f of [330, 392, 494, 262]) { sb.S.beep(f, 0.16, 0.05); await sb.wait(0.56); } },
  },

  // ------------------------------------------------------------------ Games: src/arcade.js, each monitor's demo heard in its room
  // The game's own Arcade._ambient runs, for this one monitor, as if the camera stood where you pull up to play it.
  {
    id: 'arcade-demo-snake', group: 'Games', title: 'Snake monitor, from the room',
    when: 'In the back room with the Snake monitor, its demo heard as you come near: steps, and a gulp.',
    src: 'src/arcade.js:28', secs: 8,
    trigger: async sb => {
      const A = sb.G.arcade, it = A.list.find(i => i.Game.id === 'snake'); if (!it) throw new Error('no snake monitor');
      const orig = Object.getPrototypeOf(A)._ambient, cam = { x: it.sx, y: it.y + 1, z: it.sz }; it.snd = null;
      sb.patch(A, '_ambient', function () { const all = this.list; this.list = [it]; try { orig.call(this, cam); } finally { this.list = all; } });
    },
  },
  {
    id: 'arcade-demo-mines', group: 'Games', title: 'Minesweeper monitor, from the room',
    when: 'In the back room with the Minesweeper monitor: clicks, a flag now and then, the odd boom.',
    src: 'src/arcade.js:29', secs: 12,
    note: 'The boom is random (3 in 100 clicks): it may not come in this recording.',
    trigger: async sb => {
      const A = sb.G.arcade, it = A.list.find(i => i.Game.id === 'mines'); if (!it) throw new Error('no mines monitor');
      const orig = Object.getPrototypeOf(A)._ambient, cam = { x: it.sx, y: it.y + 1, z: it.sz }; it.snd = null;
      sb.patch(A, '_ambient', function () { const all = this.list; this.list = [it]; try { orig.call(this, cam); } finally { this.list = all; } });
    },
  },
  {
    id: 'arcade-demo-paddles', group: 'Games', title: 'Paddles monitor, from the room',
    when: 'In the back room with the Paddles monitor: bat, wall, bat, and a little fall when a point is won.',
    src: 'src/arcade.js:30', secs: 10,
    trigger: async sb => {
      const A = sb.G.arcade, it = A.list.find(i => i.Game.id === 'paddles'); if (!it) throw new Error('no paddles monitor');
      const orig = Object.getPrototypeOf(A)._ambient, cam = { x: it.sx, y: it.y + 1, z: it.sz }; it.snd = null;
      sb.patch(A, '_ambient', function () { const all = this.list; this.list = [it]; try { orig.call(this, cam); } finally { this.list = all; } });
    },
  },
  {
    id: 'arcade-demo-bricks', group: 'Games', title: 'Brick Wall monitor, from the room',
    when: 'In the back room with the Brick Wall monitor: bat, then a brick, each brick higher.',
    src: 'src/arcade.js:31', secs: 7,
    trigger: async sb => {
      const A = sb.G.arcade, it = A.list.find(i => i.Game.id === 'bricks'); if (!it) throw new Error('no bricks monitor');
      const orig = Object.getPrototypeOf(A)._ambient, cam = { x: it.sx, y: it.y + 1, z: it.sz }; it.snd = null;
      sb.patch(A, '_ambient', function () { const all = this.list; this.list = [it]; try { orig.call(this, cam); } finally { this.list = all; } });
    },
  },
  {
    id: 'arcade-demo-blocks', group: 'Games', title: 'Blocks monitor, from the room',
    when: 'In the back room with the Blocks monitor: turns, drops, and a run of notes when a line clears.',
    src: 'src/arcade.js:32', secs: 9,
    trigger: async sb => {
      const A = sb.G.arcade, it = A.list.find(i => i.Game.id === 'blocks'); if (!it) throw new Error('no blocks monitor');
      const orig = Object.getPrototypeOf(A)._ambient, cam = { x: it.sx, y: it.y + 1, z: it.sz }; it.snd = null;
      sb.patch(A, '_ambient', function () { const all = this.list; this.list = [it]; try { orig.call(this, cam); } finally { this.list = all; } });
    },
  },
  {
    id: 'arcade-demo-starguard', group: 'Games', title: 'Star Guard monitor, from the room',
    when: 'In the back room with the Star Guard monitor: the four-note march, shots, now and then a hit.',
    src: 'src/arcade.js:33', secs: 8,
    trigger: async sb => {
      const A = sb.G.arcade, it = A.list.find(i => i.Game.id === 'starguard'); if (!it) throw new Error('no starguard monitor');
      const orig = Object.getPrototypeOf(A)._ambient, cam = { x: it.sx, y: it.y + 1, z: it.sz }; it.snd = null;
      sb.patch(A, '_ambient', function () { const all = this.list; this.list = [it]; try { orig.call(this, cam); } finally { this.list = all; } });
    },
  },
  {
    id: 'arcade-demo-twice', group: 'Games', title: 'Twice monitor, from the room',
    when: 'In the back room with the Twice monitor: tiles sliding, a note when two merge.',
    src: 'src/arcade.js:34', secs: 9,
    trigger: async sb => {
      const A = sb.G.arcade, it = A.list.find(i => i.Game.id === 'twice'); if (!it) throw new Error('no twice monitor');
      const orig = Object.getPrototypeOf(A)._ambient, cam = { x: it.sx, y: it.y + 1, z: it.sz }; it.snd = null;
      sb.patch(A, '_ambient', function () { const all = this.list; this.list = [it]; try { orig.call(this, cam); } finally { this.list = all; } });
    },
  },
  {
    id: 'arcade-demo-lamps', group: 'Games', title: 'Lamps Out monitor, from the room',
    when: 'In the back room with the Lamps Out monitor: switches clicking, a little high note with each.',
    src: 'src/arcade.js:35', secs: 9,
    trigger: async sb => {
      const A = sb.G.arcade, it = A.list.find(i => i.Game.id === 'lamps'); if (!it) throw new Error('no lamps monitor');
      const orig = Object.getPrototypeOf(A)._ambient, cam = { x: it.sx, y: it.y + 1, z: it.sz }; it.snd = null;
      sb.patch(A, '_ambient', function () { const all = this.list; this.list = [it]; try { orig.call(this, cam); } finally { this.list = all; } });
    },
  },
  {
    id: 'arcade-demo-echo', group: 'Games', title: 'Echo monitor, from the room',
    when: 'In the back room with the Echo monitor: the tune it wants repeated, a note longer each round.',
    src: 'src/arcade.js:36', secs: 14,
    trigger: async sb => {
      const A = sb.G.arcade, it = A.list.find(i => i.Game.id === 'echo'); if (!it) throw new Error('no echo monitor');
      const orig = Object.getPrototypeOf(A)._ambient, cam = { x: it.sx, y: it.y + 1, z: it.sz }; it.snd = null;
      sb.patch(A, '_ambient', function () { const all = this.list; this.list = [it]; try { orig.call(this, cam); } finally { this.list = all; } });
    },
  },
  {
    id: 'arcade-demo-noughts', group: 'Games', title: 'Noughts & Crosses monitor, from the room',
    when: 'In the back room with the Noughts & Crosses monitor: X, O, and a rising three when a line is made.',
    src: 'src/arcade.js:42', secs: 11,
    trigger: async sb => {
      const A = sb.G.arcade, it = A.list.find(i => i.Game.id === 'noughts'); if (!it) throw new Error('no noughts monitor');
      const orig = Object.getPrototypeOf(A)._ambient, cam = { x: it.sx, y: it.y + 1, z: it.sz }; it.snd = null;
      sb.patch(A, '_ambient', function () { const all = this.list; this.list = [it]; try { orig.call(this, cam); } finally { this.list = all; } });
    },
  },
  {
    id: 'arcade-demo-outpost', group: 'Games', title: 'Outpost Nine monitor, from the room',
    when: 'Down in the secret rooms under the street, at the extra monitor (Outpost Nine): the gun, and now and then what it hits.',
    src: 'src/arcade.js:43', secs: 8,
    trigger: async sb => {
      const A = sb.G.arcade, it = A.list.find(i => i.Game.id === 'outpost'); if (!it) throw new Error('no outpost monitor');
      const orig = Object.getPrototypeOf(A)._ambient, cam = { x: it.sx, y: it.y + 1, z: it.sz }; it.snd = null;
      sb.patch(A, '_ambient', function () { const all = this.list; this.list = [it]; try { orig.call(this, cam); } finally { this.list = all; } });
    },
  },
];
