// Sound book entries for: story.js, secret.js, probe.js, presents.js, opening.js (Story and secrets); lights.js, repair.js,
// loose.js, vending.js, cinema.js, giftshop.js, guards.js synth (Galleries and lamps); heist.js (Games); guards.js clips (Recorded clips).
export const entries = [
  // ================================================================ Story and secrets: story.js (the Green Cheese file)
  {
    id: 'story-grate-hum', group: 'Story and secrets', title: 'Glowing grate hum',
    when: 'In the lobby, a low hum from the green-lit floor grate, louder as you pull up to it.',
    src: 'src/story.js:307', secs: 5,
    // The game sets the hum every frame from the toy's distance; its loop is driven here at the level heard at the grate
    // (d about 1 m: 0.03 * (1 - 1/9)), with the game's own per-frame setting held off for the entry.
    trigger: async sb => {
      const f = sb.feat('story'), real = f.hum;
      sb.patch(f, 'hum', { set() {}, stop() {} });
      const id = setInterval(() => real.set(0.027), 100); real.set(0.027);
      sb.later(() => { clearInterval(id); real.set(0); });
    },
    note: 'The grate’s own loop (73.4 Hz sine), held at the level heard standing at the grate.',
  },
  {
    id: 'story-mouse-dive', group: 'Story and secrets', title: 'Glowing mouse dives down the grate',
    when: 'The first time you come up to the lobby grate: two squeaks, then the mouse ducks through and three notes answer from below.',
    src: 'src/story.js:321', secs: 4.5,
    trigger: async sb => {
      const f = sb.feat('story'), k = sb.k, { MOTIF } = await sb.mod('motif.js');
      const a = MOTIF[0], b = MOTIF[1];
      k.synth.note(440 * Math.pow(2, (a.midi + 36 - 69) / 12), 0.05, { type: 'sine', vol: 0.02 });
      k.synth.note(440 * Math.pow(2, (b.midi + 36 - 69) / 12), 0.06, { type: 'sine', vol: 0.018, at: 0.09 });
      await sb.wait(0.7);
      k.synth.noise(0.12, { vol: 0.03, lp: 3000 });
      f._call(k, { below: true, transpose: -12, gain: 0.05, beat: 0.5, notes: 3, at: 0.6, colour: true });
    },
    note: 'Replayed from the source lines (story.js 321 and 330: the dive happens once a game), with the feature’s own _call.',
  },
  {
    id: 'story-grate-listen', group: 'Story and secrets', title: 'LISTEN at the grate: the call',
    when: 'Pulled up on the lobby grate, pressing LISTEN: five notes far below, the craft’s call.',
    src: 'src/story.js:359', secs: 5,
    trigger: sb => { sb.feat('story')._call(sb.k, { below: true, transpose: -12, gain: 0.06, beat: 0.55, colour: true, at: 0.05 }); },
    note: 'The call _listen() plays (its call, without the page being added, so no toast follows).',
  },
  {
    id: 'story-grate-ambient', group: 'Story and secrets', title: 'Faint call from the grate',
    when: 'Waiting near the lobby grate: every fifteen seconds or so the call comes up, faint.',
    src: 'src/story.js:309', secs: 5.5,
    trigger: sb => { sb.feat('story')._call(sb.k, { below: true, transpose: -12, gain: 0.022, beat: 0.6, colour: true }); },
  },
  {
    id: 'story-lights-call', group: 'Story and secrets', title: 'Green light over the lake: far call',
    when: 'Outdoors, after a green light has fallen over the lake towards the park: the call, thin and high, far off.',
    src: 'src/story.js:251', secs: 5,
    trigger: sb => { sb.feat('story')._call(sb.k, { below: false, transpose: 12, gain: 0.018, beat: 0.5, at: 0.4, lp: 2400 }); },
  },
  {
    id: 'story-ring-call', group: 'Story and secrets', title: 'Rings in the snow: the call underfoot',
    when: 'Driving onto the rings melted into the snow over the silo on Butler Field: the call from under your wheels.',
    src: 'src/story.js:289', secs: 5,
    trigger: sb => { sb.feat('story')._call(sb.k, { below: true, transpose: -12, gain: 0.05, beat: 0.55, at: 0.1 }); },
    note: 'In the game it starts 2.6 s after the words come up; the wait is cut here.',
  },
  {
    id: 'story-ring-hum', group: 'Story and secrets', title: 'Rings in the snow: low hum',
    when: 'On Butler Field near the middle of the rings over the silo: a very low hum.',
    src: 'src/story.js:283', secs: 5,
    trigger: async sb => {
      const f = sb.feat('story'), real = f.ringHum;
      sb.patch(f, 'ringHum', { set() {}, stop() {} });
      const id = setInterval(() => real.set(0.02), 100); real.set(0.02);
      sb.later(() => { clearInterval(id); real.set(0); });
    },
    note: 'The feature’s own 55 Hz loop, held at the level heard a metre off the middle (0.022 at the centre). Very low: needs headphones.',
  },
  {
    id: 'story-file-sting', group: 'Story and secrets', title: 'Green Cheese file: page found',
    when: 'With the toast for a new page of the Green Cheese file: the call, quick and high, as many notes as pages found.',
    src: 'src/story.js:451', secs: 2.5,
    trigger: sb => { sb.feat('story')._call(sb.k, { transpose: 12, gain: 0.03, beat: 0.17, notes: 5, lp: 5000 }); },
    note: 'The full five-note version (from the fifth page on); earlier pages play the first 1 to 4 notes. It is handed to the toast (trophies.js) as its sound.',
  },

  // ---------------------------------------------------------------- secret.js (the wall that moves, Sub-level 9)
  {
    id: 'secret-frame-creak', group: 'Story and secrets', title: 'Picture frame creaks',
    when: 'Looking closely at the clue picture and tapping the wrong part of it: the frame gives a little.',
    src: 'src/secret.js:122', secs: 1,
    trigger: sb => { sb.S.creak(); },
  },
  {
    id: 'secret-wall-opens', group: 'Story and secrets', title: 'The wall slides aside',
    when: 'Touching the right part of the clue picture: a low bell, stone grinding on stone, and a thud as the wall stops.',
    src: 'src/secret.js:130', secs: 4.5,
    trigger: async sb => { const S = sb.S; S.bell(146.83, 0, 0.07, 4); S.grind(1.9); await sb.wait(1.9); S.bump(2.5); },
    note: 'Replayed from the source lines (find() opens the wall for good): bell and grind at once, the bump when the slide ends 1.9 s later (line 262).',
  },
  {
    id: 'secret-sublevel9', group: 'Story and secrets', title: 'Arriving at Sub-level 9',
    when: 'Reaching the store twelve metres under the street the first time (SUB-LEVEL 9).',
    src: 'src/secret.js:276', secs: 4,
    trigger: sb => { sb.S.roomChord(); },
  },
  {
    id: 'secret-ufo-taken', group: 'Story and secrets', title: 'Taking the saucer',
    when: 'In Sub-level 9, taking the little saucer off its pedestal (IT IS YOURS).',
    src: 'src/secret.js:252', secs: 3.5,
    trigger: sb => { sb.S.finish(); },
    note: 'The Sound method take() calls; take() itself would unlock the toy for good.',
  },

  // ---------------------------------------------------------------- probe.js (the probe out of the grate)
  {
    id: 'probe-rise', group: 'Story and secrets', title: 'Probe rises out of the grate',
    when: 'Back in the lobby once the grate is armed: the probe comes up out of it in a column of green light, ringing two notes.',
    src: 'src/probe.js:305', secs: 2.5,
    trigger: async sb => {
      const f = sb.feat('probe');
      sb.k.synth.noise(0.5, { vol: 0.03, lp: 1200 }); f._whoosh(true, 0.025);
      await sb.wait(0.5);
      f._note(0, { gain: 0.03, dur: 0.6 }); f._note(1, { gain: 0.03, dur: 0.6, at: 0.32 });
    },
    note: 'Replayed with the feature’s own _whoosh and _note (lines 305 and 320): it rises once a game.',
  },
  {
    id: 'probe-pass', group: 'Story and secrets', title: 'Probe swoops past you',
    when: 'The probe flying through the lobby and past you before it turns to look.',
    src: 'src/probe.js:343', secs: 1.5,
    trigger: sb => { sb.feat('probe')._whoosh(false, 0.02); },
  },
  {
    id: 'probe-look-call', group: 'Story and secrets', title: 'Probe chimes the call at you',
    when: 'The probe hanging in front of you, curious, its rim chiming the five-note call.',
    src: 'src/probe.js:350', secs: 3.5,
    trigger: sb => { sb.feat('probe')._call(0.3, 0.035, 12); },
  },
  {
    id: 'probe-chime', group: 'Story and secrets', title: 'Probe chiming softly while it waits',
    when: 'Herding the probe to the vent: stop and it bobs, chiming one note of the call at a time.',
    src: 'src/probe.js:392', secs: 10,
    trigger: async sb => { const f = sb.feat('probe'); for (let i = 0; i < 5; i++) { f._note(i, { gain: 0.012, dur: 0.5 }); await sb.wait(2.4); } },
    note: 'The same single notes, a little louder (up to 0.016) and every 3.2 s, while it waits by the harbour light (line 445).',
  },
  {
    id: 'probe-takeoff', group: 'Story and secrets', title: 'Probe takes off for the harbour',
    when: 'Out on the front terrace with the probe: it whooshes up and away to the harbour light, chiming the call.',
    src: 'src/probe.js:410', secs: 2.5,
    trigger: sb => { const f = sb.feat('probe'); f._whoosh(true, 0.04); f._call(0.16, 0.03, 12); },
    note: 'The same rising whoosh, softer (0.015), plays when it first turns to be herded (line 366).',
  },
  {
    id: 'probe-gone', group: 'Story and secrets', title: 'Probe circles the light and is gone',
    when: 'At the harbour light: after one turn round the lantern, the whole call quick, then it streaks straight up.',
    src: 'src/probe.js:470', secs: 3,
    trigger: async sb => { const f = sb.feat('probe'); f._call(0.11, 0.04, 12); await sb.wait(0.7); f._whoosh(true, 0.05); },
    note: 'Call at 4.2 s into the finale, the whoosh up at 4.9 s (line 472).',
  },

  // ---------------------------------------------------------------- presents.js
  {
    id: 'presents-open', group: 'Story and secrets', title: 'Opening a parcel',
    when: 'Outside under the yard tree, opening one of the parcels (OPEN).',
    src: 'src/presents.js:66', secs: 3,
    trigger: sb => { sb.S.perfect(); },
    note: 'The first parcel also finds a secret: main.js’s secret toast then plays its own chime (sound.lap).',
  },

  // ---------------------------------------------------------------- opening.js (the cold open)
  {
    id: 'opening-windows-out', group: 'Story and secrets', title: 'Cold open: the windows going dark',
    when: 'Starting a new game: the museum across the avenue, its lit windows clicking off one by one.',
    src: 'src/opening.js:121', secs: 2.5,
    trigger: sb => {
      const F = sb.G.plan.facade; if (!F) throw new Error('no facade');
      const zs = [];
      for (const [a, b] of [[F.z0, F.cz - F.half], [F.cz + F.half, F.z1]]) { const n = Math.max(3, Math.round((b - a) / 5.0)), step = (b - a) / n; for (let i = 0; i < n; i++) zs.push(a + step * (i + 0.5)); }
      zs.sort((p, q) => Math.abs(q - F.cz) - Math.abs(p - F.cz));
      zs.forEach((z, i) => sb.S.tick(0.035, 240, 0.05, 0.35 + 1.65 * i / Math.max(1, zs.length - 1) + (i % 3) * 0.03));
    },
    note: 'Replayed from the source lines: one tick per window, at the times _panes() gives them (0.35 to 2.0 s).',
  },
  {
    id: 'opening-headlights', group: 'Story and secrets', title: 'Cold open: headlights click on',
    when: 'The end of the cold open (or skipping it): the toy’s headlights come on and it is yours.',
    src: 'src/opening.js:128', secs: 1,
    trigger: sb => { sb.S.tick(0.08, 2200, 0.03); sb.S.tick(0.05, 1400, 0.03, 0.05); },
    note: 'Skipping plays only the first tick (line 148).',
  },

  // ================================================================ Galleries and lamps
  // ---------------------------------------------------------------- lights.js
  {
    id: 'lights-switch-on', group: 'Galleries and lamps', title: 'Light switch: a dark room comes on',
    when: 'Throwing the switch by the door of an office, store or corridor: a click and a small ping as the lights catch.',
    src: 'src/lights.js:406', secs: 1.5,
    trigger: sb => { const s = sb.S; s.tick(0.16, 1500, 0.018); setTimeout(() => s.tick(0.1, 650, 0.035), 55); setTimeout(() => s.bell(1568, 0, 0.012, 0.5, 0.3), 260); },
    note: 'Replayed from the source lines (toggle() would also save the room and count it for a trophy).',
  },
  {
    id: 'lights-switch-click', group: 'Galleries and lamps', title: 'Light switch click',
    when: 'Throwing a switch to put a room out, or a gallery’s switch either way.',
    src: 'src/lights.js:406', secs: 1,
    trigger: sb => { const s = sb.S; s.tick(0.16, 1500, 0.018); setTimeout(() => s.tick(0.1, 650, 0.035), 55); },
    note: 'Replayed from the source lines. A gallery coming back on also rings each picture lamp as it wakes (the museum’s lamp chime, not this file).',
  },

  // ---------------------------------------------------------------- repair.js (the conservation line)
  {
    id: 'repair-fix', group: 'Galleries and lamps', title: 'Conservation line: blemish repaired',
    when: 'At the conservation line, touching a blemish on a painting: a little bell, a step higher each time.',
    src: 'src/repair.js:265', secs: 2.5,
    trigger: async sb => { for (let n = 1; n <= 5; n++) { sb.S.bell(880 + (n % 5) * 110, 0, 0.022, 0.45, 0.35); await sb.wait(0.35); } },
    note: 'Five repairs in a row, so the steps can be heard (880 to 1320 Hz, round again every five).',
  },
  {
    id: 'repair-spotless', group: 'Galleries and lamps', title: 'Conservation line: painting spotless',
    when: 'A painting leaving the belt with every blemish repaired.',
    src: 'src/repair.js:266', secs: 1.5,
    trigger: sb => { sb.S.bell(1760, 0, 0.016, 0.8, 0.5); },
  },
  {
    id: 'repair-miss', group: 'Galleries and lamps', title: 'Conservation line: blemish missed',
    when: 'A blemish going off the end of the belt untreated: a low buzz and the table shakes.',
    src: 'src/repair.js:267', secs: 0.8,
    trigger: sb => { sb.S.beep(110, 0.16, 0.04); },
  },
  {
    id: 'repair-stray', group: 'Galleries and lamps', title: 'Conservation line: dabbed good paint',
    when: 'Touching a painting where there is no blemish.',
    src: 'src/repair.js:268', secs: 0.6,
    trigger: sb => { sb.S.tick(0.1, 420, 0.07); },
  },
  {
    id: 'repair-end', group: 'Galleries and lamps', title: 'Conservation line: sent home',
    when: 'The end of a shift at the conservation line, when the notice from Human Resources comes up.',
    src: 'src/repair.js:231', secs: 3.5,
    trigger: sb => { const s = sb.S; s.bell(196, 0, 0.06, 2.4); setTimeout(() => s.bell(146.83, 0, 0.06, 3), 260); },
  },

  // ---------------------------------------------------------------- loose.js (café furniture)
  {
    id: 'loose-chair-knock', group: 'Galleries and lamps', title: 'Café chair knocked over',
    when: 'In the café, driving into a chair, stool or bin hard enough to send it flying (and again as it lands).',
    src: 'src/loose.js:161', secs: 0.8,
    trigger: sb => { sb.S.knock(3, false); },
  },
  {
    id: 'loose-table-knock', group: 'Galleries and lamps', title: 'Café table shoved',
    when: 'In the café, hitting a table hard enough to shift or tip it.',
    src: 'src/loose.js:161', secs: 0.8,
    trigger: sb => { sb.S.knock(3, true); },
  },

  // ---------------------------------------------------------------- vending.js
  {
    id: 'vending-hum', group: 'Galleries and lamps', title: 'Vending machine hum',
    when: 'Standing in front of a vending machine in the café (or behind the scenes).',
    src: 'src/vending.js:169', secs: 5,
    trigger: sb => {
      const V = sb.G.vending, m = V && V.list[0]; if (!m) throw new Error('no vending machine');
      const near = { pos: { x: m.front.x, y: m.y, z: m.front.z } };
      const orig = sb.patch(V, '_hum', function () { return orig.call(this, near); });
    },
    note: 'The machine’s own _hum, told the toy is at its front (the toy itself stays put).',
  },
  {
    id: 'vending-can-drop', group: 'Galleries and lamps', title: 'Spray can drops into the tray',
    when: 'Buying a can of spray paint: the clunk of the mechanism, then the can landing in the tray.',
    src: 'src/vending.js:251', secs: 1.5,
    trigger: sb => {
      const V = sb.G.vending, m = V && V.list[0]; if (!m || !V.fall) throw new Error('no vending machine');
      const s = m.spots.find(q => q.kind === 'paint') || m.spots[0];
      V._drop(m, s, s.paint ? s.paint.hex : 0xe8482a);
    },
    after: sb => { const V = sb.G.vending; if (V) { V.drop = null; if (V.fall) V.fall.visible = false; } },
    note: 'The machine’s own _drop: the game lands the can 0.75 s later (line 153). Nothing is bought.',
  },
  {
    id: 'vending-pop-fizz', group: 'Galleries and lamps', title: 'Can of pop: drop and fizz',
    when: 'Buying a can of pop: it drops, and a hiss as the car gets its fizz (it hops higher for 30 s).',
    src: 'src/vending.js:255', secs: 1.5,
    trigger: sb => {
      const V = sb.G.vending, m = V && V.list.find(q => q.spots.some(s => s.kind === 'pop')); if (!m || !V.fall) throw new Error('no machine with pop');
      const s = m.spots.find(q => q.kind === 'pop');
      V._drop(m, s, 0xe8482a); sb.S.tick(0.05, 5200, 0.5);
    },
    after: sb => { const V = sb.G.vending; if (V) { V.drop = null; if (V.fall) V.fall.visible = false; } },
    note: 'The drop is the machine’s own; the fizz hiss is replayed from _fizz() (line 255), which would change the car.',
  },
  {
    id: 'vending-coin', group: 'Galleries and lamps', title: 'Loose change picked up',
    when: 'Driving over a coin on the café floor (+5 CHIPS).',
    src: 'src/vending.js:137', secs: 1.2,
    trigger: sb => { const S = sb.S, now = S.ctx.currentTime; S.bell(1568, now, 0.05, 0.5, 0.4); S.bell(2093, now + 0.07, 0.05, 0.7, 0.4); },
    note: 'Replayed from the source lines (each coin can be picked up once).',
  },

  // ---------------------------------------------------------------- cinema.js
  {
    id: 'cinema-projector', group: 'Galleries and lamps', title: 'Projector whirr',
    when: 'In an auditorium or lecture room where the film is running: the projector’s flutter.',
    src: 'src/cinema.js:491', secs: 5,
    trigger: sb => { const C = sb.G.cinema; if (!C) throw new Error('no cinema'); C._whirr(true); sb.later(() => C._whirr(false)); },
  },
  {
    id: 'cinema-soundtrack', group: 'Galleries and lamps', title: 'Film soundtracks',
    when: 'Sitting down to WATCH a film and pressing Sound, for the clips that have one.',
    src: 'src/cinema.js:457', secs: 1, trigger: null,
    note: 'Not made by the game: real film clips streamed from Wikimedia Commons in a <video> element, outside WebAudio.',
  },

  // ---------------------------------------------------------------- giftshop.js
  {
    id: 'giftshop-globe-shake', group: 'Galleries and lamps', title: 'Shaking a snow globe',
    when: 'In the Museum Shop, shaking one of the snow globes along the front (SHAKE).',
    src: 'src/giftshop.js:332', secs: 2,
    trigger: sb => { const k = sb.k; k.synth.noise(0.35, { vol: 0.03, lp: 3000 }); k.synth.chime([1318, 1568, 1976], { gap: 0.09, dur: 0.9, vol: 0.025 }); },
    note: 'Replayed from the source lines (shake() also lights a route and counts the globe).',
  },
  {
    id: 'giftshop-buy-flag', group: 'Galleries and lamps', title: 'Shop: buying a flag',
    when: 'At the Museum Shop till, buying a flag for the car’s aerial.',
    src: 'src/giftshop.js:468', secs: 1,
    trigger: sb => { sb.k.synth.chime([660, 990], { gap: 0.07, dur: 0.4, vol: 0.04 }); },
  },
  {
    id: 'giftshop-hot-chocolate', group: 'Galleries and lamps', title: 'Shop: hot chocolate',
    when: 'At the Museum Shop till, buying a hot chocolate for a burst of speed.',
    src: 'src/giftshop.js:476', secs: 1,
    trigger: sb => { sb.k.synth.chime([523, 659, 784], { gap: 0.06, dur: 0.4, vol: 0.04 }); },
  },
  {
    id: 'giftshop-buy-shelf', group: 'Galleries and lamps', title: 'Shop: something for your shelf',
    when: 'At the Museum Shop till, buying a little thing for your shelf behind the counter.',
    src: 'src/giftshop.js:482', secs: 1,
    trigger: sb => { sb.k.synth.chime([784, 988], { gap: 0.07, dur: 0.4, vol: 0.04 }); },
  },
  {
    id: 'giftshop-buy-toy', group: 'Galleries and lamps', title: 'Shop: buying a toy from the showroom',
    when: 'In the Museum Shop showroom, buying one of the special toys.',
    src: 'src/giftshop.js:491', secs: 1.5,
    trigger: sb => { sb.k.synth.chime([523, 659, 784, 1046], { gap: 0.08, dur: 0.6, vol: 0.05 }); },
  },

  // ---------------------------------------------------------------- guards.js (the robots' own synth sounds)
  {
    id: 'guards-blip', group: 'Galleries and lamps', title: 'Security robot nearby: blip',
    when: 'With a security robot within 20 m: a soft blip, quicker (every 0.8 s) inside 10 m.',
    src: 'src/guards.js:525', secs: 3.5,
    trigger: async sb => { const s = sb.feat('guards').sfx; for (let i = 0; i < 4; i++) { s.blip(); await sb.wait(0.8); } },
  },
  {
    id: 'guards-query', group: 'Galleries and lamps', title: 'Robot: "?"',
    when: 'Caught in a robot’s searchlight: the "?" comes up while it makes up its mind.',
    src: 'src/guards.js:557', secs: 0.8,
    trigger: sb => { sb.feat('guards').sfx.query(); },
  },
  {
    id: 'guards-spotted', group: 'Galleries and lamps', title: 'Robot: "!" (gives chase)',
    when: 'A robot decides it has seen you and comes for you (INTRUDER ALERT; the spoken line is its own entry).',
    src: 'src/guards.js:587', secs: 1,
    trigger: sb => { sb.feat('guards').sfx.spotted(); },
  },
  {
    id: 'guards-give-up', group: 'Galleries and lamps', title: 'Robot gives up the chase',
    when: 'Out of a chasing robot’s sight for three seconds: it gives up.',
    src: 'src/guards.js:601', secs: 0.8,
    trigger: sb => { sb.feat('guards').sfx.giveUp(); },
  },
  {
    id: 'guards-charge', group: 'Galleries and lamps', title: 'Robot prong charging',
    when: 'A robot within a metre and a half: its prong glows and whines up for a second and a half before the bolt.',
    src: 'src/guards.js:599', secs: 2,
    trigger: sb => { sb.feat('guards').sfx.charge(); },
    note: 'With it the spoken "Warning, warning" (its own entry, under Recorded clips).',
  },
  {
    id: 'guards-bolt-miss', group: 'Galleries and lamps', title: 'Robot bolt misses',
    when: 'Swerving away in time: the bolt cracks into the floor where you were going to be.',
    src: 'src/guards.js:690', secs: 0.8,
    trigger: sb => { sb.feat('guards').sfx.crack(false); },
  },
  {
    id: 'guards-caught', group: 'Galleries and lamps', title: 'Zapped and thrown in the dumpster',
    when: 'Caught by a robot’s bolt: the zap, carried off in the dark, the dumpster jolts, the lid flies open and you tumble out, lid slams.',
    src: 'src/guards.js:701', secs: 6.5,
    trigger: async sb => {
      const s = sb.feat('guards').sfx;
      s.crack(true); s.buzz(1.05);
      await sb.wait(1.6); s.carried();
      await sb.wait(1.95); s.thump();
      await sb.wait(0.45); s.clang(); s.boing();
      await sb.wait(0.8); s.thump();
      await sb.wait(0.95); s.slam();
    },
    note: 'The robots’ own sound calls, on the timing of _sequence() (zap at 0, carried 1.6 s, jolt 3.55, lid open 4.0, landing 4.8, lid slam 5.75).',
  },

  // ================================================================ Games: heist.js
  {
    id: 'heist-start', group: 'Games', title: 'Heist: the heist is on',
    when: 'Pressing the big red button in the security control room (THE HEIST IS ON).',
    src: 'src/heist.js:197', secs: 1.5,
    trigger: sb => { sb.S.gate(); },
  },
  {
    id: 'heist-grab', group: 'Games', title: 'Heist: got it',
    when: 'Reaching the copy of the picture on its plinth among the lasers (GOT IT).',
    src: 'src/heist.js:263', secs: 3,
    trigger: sb => { sb.S.perfect(); },
  },
  {
    id: 'heist-alarm', group: 'Games', title: 'Heist: alarm',
    when: 'Touching a laser beam during a heist (ALARM!).',
    src: 'src/heist.js:280', secs: 1.5,
    trigger: sb => { sb.G.heist._alarm(); sb.later(() => { const el = document.getElementById('heistFlash'); if (el) el.classList.remove('on'); }); },
  },
  {
    id: 'heist-complete', group: 'Games', title: 'Heist complete',
    when: 'Getting the copy back to the button before the clock runs out (HEIST COMPLETE).',
    src: 'src/heist.js:291', secs: 3.5,
    trigger: sb => { sb.S.finish(); },
  },
  {
    id: 'heist-off', group: 'Games', title: 'Heist: the heist is off',
    when: 'The clock running out, or a fourth alarm (THE HEIST IS OFF).',
    src: 'src/heist.js:299', secs: 0.8,
    trigger: sb => { sb.S.bump(2); },
  },

  // ================================================================ Recorded clips: guards.js
  {
    id: 'clip-intruder-alert', group: 'Recorded clips', title: 'Robot voice: "Intruder alert"',
    when: 'A security robot spots you and gives chase (INTRUDER ALERT).',
    src: 'src/guards.js:588', secs: 7,
    trigger: sb => { sb.feat('guards').sfx.speak('intruder-alert'); },
    note: 'assets/sfx/intruder-alert.mp3 (6.5 s), played by the robots’ own speak(): fetched at start, decoded on first use into S.master.',
  },
  {
    id: 'clip-warning', group: 'Recorded clips', title: 'Robot voice: "Warning, warning"',
    when: 'A robot gets within reach and its prong charges (WARNING! WARNING!).',
    src: 'src/guards.js:599', secs: 2.5,
    trigger: sb => { sb.feat('guards').sfx.speak('warning'); },
    note: 'assets/sfx/warning.mp3 (1.7 s), played by the robots’ own speak(); skipped in the game if the robot is still saying "Intruder alert".',
  },
];
