// Sound book entries: the finale (src/finale.js, src/finalelaunch.js, src/voyage.js) and, out of doors, the fireworks
// (src/fireworks.js) and the penguins' portal (src/tuxportal.js).
// The music modes of src/cosmicmusic.js (space, hyper, deep, moon, finale, credits) are covered elsewhere.
export const entries = [
  // ------------------------------------------------------------------ Finale: src/finale.js (the base)
  {
    id: 'finale-keycard', group: 'Finale', title: 'Keycard taken',
    when: 'Sub-level 9, the Debriefing room: taking the PROJECT GREEN CHEESE keycard off its stand.',
    src: 'src/finale.js#k.sound.bell(659.25', secs: 2.5,
    note: 'Replayed from the source line (taking the card for real would save it). Both bells sound at once: bell() takes an absolute time, so the 0.12 meant as a delay is in the past.',
    trigger: async sb => { const S = sb.S; S.bell(659.25, 0, 0.06, 1.6); S.bell(987.77, 0.12, 0.05, 1.8); },
  },
  {
    id: 'finale-blast-door', group: 'Finale', title: 'Blast door rolls aside',
    when: 'Sub-level 9: swiping the keycard at the blast door; it grinds open and thuds home.',
    src: 'src/finale.js#this.blastAnim = 0; this.k.sound.grind(2.6)', secs: 4,
    note: 'Replayed from _openBlast and update (opening it for real would save it): grind(2.6), then bump(2.5) as it finishes 2.6 s later.',
    trigger: async sb => { sb.S.grind(2.6); await sb.wait(2.6); sb.S.bump(2.5); },
  },
  {
    id: 'finale-tunnel-lamps', group: 'Finale', title: 'Tunnel lamps waking',
    when: 'In the tunnel east of Sub-level 9: the lamps ahead clunk on one after another as you come.',
    src: 'src/finale.js#this.k.synth.noise(0.06, { vol: 0.03, lp: 700 })', secs: 5,
    note: 'The toy is put in the middle of the tunnel and the game wakes the lamps. If the camera has not got down there within 3 s, the same clunks are replayed (lamps 6 m apart, 0.03 s a metre).',
    setup: async sb => { sb.G.finale.build(); },
    trigger: async sb => {
      const f = sb.feat('finale'), c0 = f._clunk || 0;
      sb.place('B-tunnel', 0);
      for (let i = 0; i < 30; i++) { await sb.wait(0.1); if ((f._clunk || 0) !== c0) return; }
      for (const at of [0, 0.18, 0.36, 0.54, 0.72]) sb.k.synth.noise(0.06, { vol: 0.03, lp: 700, at });
    },
  },
  {
    id: 'finale-chair-creak', group: 'Finale', title: 'The big chair turns',
    when: 'The base control room: coming up behind the swivel chair facing the window, it creaks round.',
    src: 'src/finale.js#this.chairTurn = 0.001; k.sound.creak()', secs: 1,
    trigger: async sb => { sb.S.creak(); },
  },
  {
    id: 'finale-hangar', group: 'Finale', title: 'The hangar found',
    when: 'Driving into the hangar for the first time (the Project Green Cheese secret): THE HANGAR.',
    src: 'src/finale.js#if (k.find(\'greencheese\')) k.sound.finish()', secs: 4,
    trigger: async sb => { sb.S.finish(); },
  },
  {
    id: 'finale-silo-doors', group: 'Finale', title: 'Silo doors part',
    when: 'The launch: the snow-covered doors in centre field sink and slide apart (and slide shut again when you fly home).',
    src: 'src/finale.js#this.k.sound.grind(Math.min(3, secs))', secs: 7,
    note: 'The game\'s own hangar.doors.open(6): grind for 3 s, a thud as they stop. The launch opens them over 5.2 s; flying home closes them over 6 s with the same sound. Put back shut, silently, afterwards.',
    setup: async sb => { sb.G.finale.build(); },
    trigger: async sb => { sb.G.finale.hangar.doors.open(6); },
    after: async sb => { sb.G.finale.hangar.doors.set(0); },
  },

  // ------------------------------------------------------------------ Finale: src/finalelaunch.js (the console, the beam, the launch)
  {
    id: 'finale-console-call', group: 'Finale', title: 'The craft calls',
    when: 'At the tone console: the craft plays its phrase for you to echo (here the third phrase, the whole five-note call).',
    src: 'src/finalelaunch.js#_note(i, dur, craft, answer = false)', secs: 4,
    note: 'The game\'s own _note(i, dur, true), timed as _call() times phrase 3 (0.42 s a beat). Phrases 1 and 2 are its first three and four notes, at 0.62 and 0.5 s a beat.',
    setup: async sb => { sb.G.finale.build(); },
    trigger: async sb => {
      const f = sb.feat('finalelaunch'), { MOTIF } = await sb.mod('motif.js'), beat = 0.42;
      let t = 0;
      for (let i = 0; i < 5; i++) { const dur = MOTIF[i].beats * beat, at = t; setTimeout(() => f._note(i, dur, true), at * 1000); t += Math.max(dur, beat); }
    },
  },
  {
    id: 'finale-console-pads', group: 'Finale', title: 'Your notes on the pads',
    when: 'At the tone console, echoing the call: each pad (or key 1 to 5) plays its note, the last one held.',
    src: 'src/finalelaunch.js#this._note(i, i === 4 ? 1.1 : 0.34, false)', secs: 4,
    note: 'The game\'s own _note(i, 0.34 or 1.1, false), the whole call pressed at an easy half-second pace.',
    setup: async sb => { sb.G.finale.build(); },
    trigger: async sb => {
      const f = sb.feat('finalelaunch');
      for (let i = 0; i < 5; i++) setTimeout(() => f._note(i, i === 4 ? 1.1 : 0.34, false), i * 500);
    },
  },
  {
    id: 'finale-console-sour', group: 'Finale', title: 'A wrong note',
    when: 'At the tone console, pressing the wrong pad: its note, then a soft sour chord, and the phrase again.',
    src: 'src/finalelaunch.js#_sour() {', secs: 2.5,
    note: 'The game\'s own _note(i, 0.3, false) and, 0.22 s later, _sour().',
    setup: async sb => { sb.G.finale.build(); },
    trigger: async sb => { const f = sb.feat('finalelaunch'); f._note(2, 0.3, false); await sb.wait(0.22); f._sour(); },
  },
  {
    id: 'finale-console-answer', group: 'Finale', title: 'The craft answers and wakes',
    when: 'At the tone console, the last phrase right: the craft plays the call back as the pictures light, then a bright chord.',
    src: 'src/finalelaunch.js#this.rim.mode = \'bands\'; k.sound.finish', secs: 8,
    note: 'The game\'s own _note(i, dur, true, true) (the call with an octave under it) timed as _answer() times the last phrase, then finish(). Phrases 1 and 2 are answered the same way, shorter, without the chord.',
    setup: async sb => { sb.G.finale.build(); },
    trigger: async sb => {
      const f = sb.feat('finalelaunch'), { MOTIF } = await sb.mod('motif.js'), beat = 0.42 * 1.15;
      let t = 0;
      for (let i = 0; i < 5; i++) { const dur = MOTIF[i].beats * beat, at = t; setTimeout(() => f._note(i, dur, true, true), at * 1000); t += Math.max(dur, beat); }
      setTimeout(() => sb.S.finish(), (t + 0.4) * 1000);
    },
  },
  {
    id: 'finale-craft-wakes', group: 'Finale', title: 'The craft wakes, the beam',
    when: 'After the five notes: the ramp grinds up, the craft hums as it lifts off its cradle, and the beam whooshes on.',
    src: 'src/finalelaunch.js#h.ramp.raise(); this._hum(1)', secs: 7,
    note: 'The game\'s own ramp.raise(), _hum(1) and, 4.3 s later as in startBeam(), _whoosh(). The hum goes on under the beam and the launch (left out of the other entries). Ramp put back down silently afterwards.',
    setup: async sb => { sb.G.finale.build(); },
    trigger: async sb => {
      const f = sb.feat('finalelaunch'), h = sb.G.finale.hangar;
      h.ramp.raise(); f._hum(1);
      await sb.wait(4.3); const out = f._out(); if (out) f._whoosh(out);
    },
    after: async sb => {
      const f = sb.feat('finalelaunch'); f._hum(0);
      const g = sb.S.grind; sb.S.grind = () => {}; try { sb.G.finale.hangar.ramp.lower(); } finally { sb.S.grind = g; }
    },
  },
  {
    id: 'finale-beam-cargo', group: 'Finale', title: 'Pictures up the beam',
    when: 'The tractor beam: each picture, then each book, chimes a note of the call as it vanishes into the craft.',
    src: 'src/finalelaunch.js#this._portFlash(); this._chime(f.note', secs: 16,
    note: 'The game\'s own _chime(note, gain) for twelve pictures (0.05) and eight books (0.025), at the times _artsUp() and _cargoIn() bring them in. Lost property handed in chimes like the books, after them. The craft\'s hum under it is left out.',
    setup: async sb => { sb.G.finale.build(); },
    trigger: async sb => {
      const f = sb.feat('finalelaunch'), lifts = [];
      let t = 0.9; for (let n = 0; n < 12; n++) { lifts.push([t + 3.3, n % 5, 0.05]); t += n < 4 ? 1.15 : 0.8; }
      const books = t + 1.4; for (let i = 0; i < 8; i++) lifts.push([books + i * 0.32 + 3.2, i % 5, 0.025]);
      const first = lifts[0][0];
      for (const [at, note, gain] of lifts) setTimeout(() => f._chime(note, gain), (at - first) * 1000);
    },
  },
  {
    id: 'finale-your-turn', group: 'Finale', title: 'Your turn',
    when: 'Everything aboard: the beam turns down to the hangar floor and the craft calls you with two notes. YOUR TURN.',
    src: 'src/finalelaunch.js#motifVoice(c, out, MOTIF[3].midi, c.currentTime + 0.05', secs: 2.5,
    note: 'Replayed from _cue() (calling it would also take the camera and mark the map): the A then the held E, in the craft\'s voice.',
    trigger: async sb => {
      const f = sb.feat('finalelaunch'), { MOTIF, motifVoice } = await sb.mod('motif.js'), out = f._out(), c = sb.S.ctx;
      motifVoice(c, out, MOTIF[3].midi, c.currentTime + 0.05, 0.42, 0.07); motifVoice(c, out, MOTIF[4].midi, c.currentTime + 0.47, 1.4, 0.07);
    },
  },
  {
    id: 'finale-beam-takes-car', group: 'Finale', title: 'The beam takes the car',
    when: 'Driving the car into the beam on the hangar floor: a click as it grips, and a thump as the car goes in.',
    src: 'src/finalelaunch.js#k.sound.tick(0.08, 900, 0.06)', secs: 4.5,
    note: 'Replayed from _take() and _launchTick(): tick(0.08, 900, 0.06), then bump(3.2) when the car reaches the port 3.9 s later.',
    trigger: async sb => { sb.S.tick(0.08, 900, 0.06); await sb.wait(3.9); sb.S.bump(3.2); },
  },
  {
    id: 'finale-beam-takes-drone', group: 'Finale', title: 'The drone docks',
    when: 'Flying the drone into the beam on the hangar floor: a click, then a thump and a bell as it docks.',
    src: 'src/finalelaunch.js#k.sound.bell && k.sound.bell(880, 0, 0.04, 1.2)', secs: 4,
    note: 'Replayed from _take() and _launchTick(): tick(0.08, 900, 0.06), then bump(2.4) and bell(880) 3.0 s later.',
    trigger: async sb => { sb.S.tick(0.08, 900, 0.06); await sb.wait(3.0); sb.S.bump(2.4); sb.S.bell(880, 0, 0.04, 1.2); },
  },
  {
    id: 'finale-sirens', group: 'Finale', title: 'Launch sirens',
    when: 'The launch: a slow two-note wail from the shaft while the silo doors open and the craft rises out of centre field.',
    src: 'src/finalelaunch.js#_sirens(on) {', secs: 9,
    note: 'The game\'s own _sirens(true), 6 s of it here (about 17 s in the launch), then _sirens(false) and its fade.',
    trigger: async sb => { const f = sb.feat('finalelaunch'); f._sirens(true); await sb.wait(6); f._sirens(false); },
    after: async sb => { sb.feat('finalelaunch')._sirens(false); },
  },
  {
    id: 'finale-call-over-lake', group: 'Finale', title: 'The call over the lake',
    when: 'The launch: the craft hangs over the lake and plays its call, slow, with an octave under it.',
    src: 'src/finalelaunch.js#_callOver() {', secs: 6,
    trigger: async sb => { sb.feat('finalelaunch')._callOver(); },
    after: async sb => { const f = sb.feat('finalelaunch'); if (!f.run) f.q.length = 0; },
  },
  {
    id: 'finale-streak', group: 'Finale', title: 'Up and away',
    when: 'The end of the launch: the craft streaks up off the lake, a chord swells and the hum climbs until the screen goes white.',
    src: 'src/finalelaunch.js#_swell() {', secs: 7,
    note: 'The game\'s own _swell(), and _humTo(55 + u * 300, 0.04) every frame for the 4.2 s of the streak, then _hum(0) as the voyage takes over. The hum is started before recording, as it is already going in the game.',
    setup: async sb => { sb.feat('finalelaunch')._hum(1); await sb.wait(3); },
    trigger: async sb => {
      const f = sb.feat('finalelaunch'); f._swell();
      const t0 = performance.now(), id = setInterval(() => f._humTo(55 + (performance.now() - t0) / 1000 * 300, 0.04), 16);
      await sb.wait(4.2); clearInterval(id); f._hum(0);
    },
    after: async sb => { sb.feat('finalelaunch')._hum(0); },
  },

  // ------------------------------------------------------------------ Finale: src/voyage.js (space and the Moon)
  {
    id: 'voyage-hum', group: 'Finale', title: 'The craft in space',
    when: 'Piloting the saucer between the Earth and the Moon: its throbbing hum, rising as you push it, and on the autopilot.',
    src: 'src/voyage.js#spec: { hum: \'ufo\' }, thrust: this.thrust || 0.4', secs: 9,
    note: 'The motor as the voyage drives it (the UFO toy\'s hum, at the voyage\'s thrust): 0.3 drifting, 1.0 at full stick, 0.8 on the autopilot.',
    trigger: async sb => {
      const v = { kind: 'drone', spec: { hum: 'ufo' }, thrust: 0.3, landed: false, vel: { x: 0, y: 0, z: 0 } };
      sb.motor(v); await sb.wait(3); v.thrust = 1; await sb.wait(3); v.thrust = 0.8; await sb.wait(3);
    },
  },
  {
    id: 'voyage-course-set', group: 'Finale', title: 'Course set: Lunar Base',
    when: 'In space, pressing DESTINATION, The Moon (or coming near it): two bells as the autopilot takes over.',
    src: 'src/voyage.js#function G_bell(v, n)', secs: 3.5,
    note: 'Replayed from G_bell(v, 2) on a CosmicMusic voice of its own (the voyage\'s is made only while it runs), its output at the music level as in the voyage. The space music under it is left out.',
    trigger: async sb => {
      const { CosmicMusic } = await sb.mod('cosmicmusic.js'), { MOTIF } = await sb.mod('motif.js'), m = new CosmicMusic(sb.S);
      if (!m._ensure()) throw new Error('no audio'); m.out.gain.value = 0.9 * sb.S.vol.music; sb.later(() => m.out.disconnect());
      const t = m.ctx.currentTime; for (let i = 0; i < 2; i++) m.bell(MOTIF[i % 5].midi + 12, t + i * 0.18, 0.03, 1.6, 0.3);
    },
  },
  {
    id: 'voyage-course-set-far', group: 'Finale', title: 'Course set, from far away',
    when: 'Somewhere far away, after the spiral galaxy: four bells, "Course set: Lunar Base", and the craft swings back.',
    src: 'src/voyage.js#G_bell(this, 4)', secs: 4,
    note: 'Replayed from G_bell(v, 4) on a CosmicMusic voice of its own, at the music level. The deep-space music under it is left out.',
    trigger: async sb => {
      const { CosmicMusic } = await sb.mod('cosmicmusic.js'), { MOTIF } = await sb.mod('motif.js'), m = new CosmicMusic(sb.S);
      if (!m._ensure()) throw new Error('no audio'); m.out.gain.value = 0.9 * sb.S.vol.music; sb.later(() => m.out.disconnect());
      const t = m.ctx.currentTime; for (let i = 0; i < 4; i++) m.bell(MOTIF[i % 5].midi + 12, t + i * 0.18, 0.03, 1.6, 0.3);
    },
  },
  {
    id: 'voyage-touchdown', group: 'Finale', title: 'Touchdown on the Moon',
    when: 'The saucer settles beside the lunar dome: a heavy thump, then the ramp grinding down.',
    src: 'src/voyage.js#G.sound.bump && G.sound.bump(5)', secs: 4.5,
    trigger: async sb => { sb.S.bump(5); sb.S.grind(3); },
  },
  {
    id: 'voyage-moon-hop', group: 'Finale', title: 'A hop in low gravity',
    when: 'Driving the car on the Moon: the spring of a jump, a long float, and the thump of landing in the dust.',
    src: 'src/voyage.js#if (v.jumped) { v.jumped = false; G.sound.boing', secs: 4,
    note: 'Replayed from _frameMoon: boing() on the jump, bump(impact * 0.5) on landing; here a typical hop, 3 s in the air, landing at 3.5 m/s.',
    trigger: async sb => { sb.S.boing(); await sb.wait(3); sb.S.bump(3.5 * 0.5); },
  },
  {
    id: 'voyage-dome-cargo', group: 'Finale', title: 'The art finds its walls',
    when: 'Inside the lunar dome: each picture chimes a note of the call as it settles on the wall; lost property clicks into its cabinet.',
    src: 'src/voyage.js#motifVoice(m.ctx, m.out, MOTIF[i % 5].midi + 12', secs: 9,
    note: 'Replayed from _chime() and the tick in _procession, timed as _deliver() sends them (twelve pictures 0.55 s apart, three lost things after; books are silent), on a CosmicMusic voice at the music level. The Moon music under it is left out.',
    trigger: async sb => {
      const { CosmicMusic } = await sb.mod('cosmicmusic.js'), { MOTIF, motifVoice } = await sb.mod('motif.js'), m = new CosmicMusic(sb.S);
      if (!m._ensure()) throw new Error('no audio'); m.out.gain.value = 0.9 * sb.S.vol.music; sb.later(() => m.out.disconnect());
      const c = m.ctx, t0 = c.currentTime + 0.05;
      for (let n = 0; n < 12; n++) motifVoice(c, m.out, MOTIF[n % 5].midi + 12, t0 + n * 0.55 + 0.02, 0.6, 0.045);
      for (let j = 0; j < 3; j++) sb.S.tick(0.05, 2600, 0.04, 0.05 + 5.8 + j * 0.32);
    },
  },

  // ------------------------------------------------------------------ Outdoors: src/fireworks.js (the Modern Wing roof terrace)
  {
    id: 'fireworks-plunger', group: 'Outdoors', title: 'Fireworks plunger',
    when: 'On the Modern Wing roof terrace: pushing the plunger on the fireworks box (LAUNCH).',
    src: 'src/fireworks.js#k.synth.noise(0.08, { vol: 0.08, lp: 900 })', secs: 1,
    note: 'Replayed from start() (calling it starts the whole show: see the next entries).',
    trigger: async sb => { sb.k.synth.noise(0.08, { vol: 0.08, lp: 900 }); sb.k.synth.note(110, 0.15, { type: 'square', vol: 0.03 }); },
  },
  {
    id: 'fireworks-shell', group: 'Outdoors', title: 'A shell goes up and bursts',
    when: 'The fireworks show: a shell thumps out of its tube, whistles up, and bursts with a bang a moment after the flash.',
    src: 'src/fireworks.js#_whistle(k, T) {', secs: 4.5,
    note: 'The game\'s own _launch() for a peony, heard from the plunger; its burst comes from the game a couple of seconds later. Only 6 shells in 10 whistle; this one is made to.',
    setup: async sb => { const f = sb.feat('fireworks'); sb.place(f.det.x, f.crate.y + 0.05, f.det.z + 0.9, Math.PI); },
    trigger: async sb => {
      const f = sb.feat('fireworks'), r = Math.random;
      Math.random = () => 0.5; try { f._launch(sb.k, [0, 'peony', 0, 60, 0]); } finally { Math.random = r; }
    },
  },
  {
    id: 'fireworks-salute', group: 'Outdoors', title: 'Salute',
    when: 'The fireworks finale: the white salutes that crack through the barrage.',
    src: 'src/fireworks.js#S.noise(sal ? 0.7', secs: 2,
    note: 'The game\'s own _burst() for a salute, over the park, heard from the plunger.',
    setup: async sb => { const f = sb.feat('fireworks'); sb.place(f.det.x, f.crate.y + 0.05, f.det.z + 0.9, Math.PI); },
    trigger: async sb => { const f = sb.feat('fireworks'), c = f.crate; f._burst(sb.k, { x: c.x + 30, y: c.y + 60, z: c.z - 85, kind: 'salute', ci: 5 }); },
  },
  {
    id: 'fireworks-willow', group: 'Outdoors', title: 'Gold willow crackle',
    when: 'The fireworks show: a gold willow bursts and droops, crackling as it falls.',
    src: 'src/fireworks.js#if (s.kind === \'willow\' || s.kind === \'brocade\')', secs: 3,
    note: 'The game\'s own _burst() for a willow, heard from the plunger.',
    setup: async sb => { const f = sb.feat('fireworks'); sb.place(f.det.x, f.crate.y + 0.05, f.det.z + 0.9, Math.PI); },
    trigger: async sb => { const f = sb.feat('fireworks'), c = f.crate; f._burst(sb.k, { x: c.x + 30, y: c.y + 60, z: c.z - 85, kind: 'willow', ci: 2 }); },
  },
  {
    id: 'fireworks-crown', group: 'Outdoors', title: 'The gold crown',
    when: 'The very end of the fireworks: the big gold crown opens over everything with a crack and a long crackle.',
    src: 'src/fireworks.js#[t2 + 0.45, \'brocade\'', secs: 4,
    note: 'The game\'s own _burst() for the brocade crown, heard from the plunger.',
    setup: async sb => { const f = sb.feat('fireworks'); sb.place(f.det.x, f.crate.y + 0.05, f.det.z + 0.9, Math.PI); },
    trigger: async sb => { const f = sb.feat('fireworks'), c = f.crate; f._burst(sb.k, { x: c.x + 30, y: c.y + 84, z: c.z - 85, kind: 'brocade', ci: 2 }); },
  },
  {
    id: 'fireworks-crossette', group: 'Outdoors', title: 'Crossette pop',
    when: 'The fireworks show: a crossette, a small soft pop before its stars split in four.',
    src: 'src/fireworks.js#big = s.kind !== \'crossette\'', secs: 1.5,
    note: 'The game\'s own _burst() for a crossette, heard from the plunger.',
    setup: async sb => { const f = sb.feat('fireworks'); sb.place(f.det.x, f.crate.y + 0.05, f.det.z + 0.9, Math.PI); },
    trigger: async sb => { const f = sb.feat('fireworks'), c = f.crate; f._burst(sb.k, { x: c.x + 30, y: c.y + 60, z: c.z - 85, kind: 'crossette', ci: 1 }); },
  },
  {
    id: 'fireworks-call', group: 'Outdoors', title: 'The call over the fireworks',
    when: 'The fireworks finale: the craft\'s five notes, faint and high, under the barrage (the welcome signal).',
    src: 'src/fireworks.js#_call(k) {', secs: 4,
    note: 'The game\'s own _call(), alone (in the show the bangs cover much of it).',
    trigger: async sb => { sb.feat('fireworks')._call(sb.k); },
  },
  {
    id: 'fireworks-show', group: 'Outdoors', title: 'The whole fireworks show',
    when: 'On the Modern Wing roof terrace, after LAUNCH: about 22 s of shells, pairs, a barrage, salutes and the gold crown.',
    src: 'src/fireworks.js#start(k) {', secs: 27,
    note: 'The game\'s own start(), heard from the plunger; each show is shuffled. The secret\'s toast at the end is held back (k.find stubbed) so it stays unfound.',
    setup: async sb => { const f = sb.feat('fireworks'); sb.place(f.det.x, f.crate.y + 0.05, f.det.z + 0.9, Math.PI); f.cool = 0; sb.patch(sb.k, 'find', () => false); },
    trigger: async sb => { sb.feat('fireworks').start(sb.k); },
  },

  // ------------------------------------------------------------------ Outdoors: src/tuxportal.js (the Tuxedo Shop on the sledding hill)
  {
    id: 'tuxportal-hum', group: 'Outdoors', title: 'The portal\'s hum',
    when: 'Inside the Tuxedo Shop on the sledding hill: the wormhole behind the tuxedos hums low, with a soft buzz close to it.',
    src: 'src/tuxportal.js#this.hum = this.k.loop(', secs: 7,
    note: 'The portal\'s own two loops (hum and buzz), set as update() sets them for a toy inside, 1.5 m from it, for 6 s.',
    trigger: async sb => {
      const P = sb.feat('sledding').portal, t0 = performance.now();
      const id = setInterval(() => { const t = (performance.now() - t0) / 1000, pulse = 0.5 + 0.5 * Math.sin(t * 2.3); P.hum.set(0.035 * (1 - 1.5 / 9)); P.buzz.set(0.008 * (1 - 1.5 / 6) * (0.6 + 0.4 * pulse)); }, 50);
      await sb.wait(6); clearInterval(id); P.hum.set(0); P.buzz.set(0);
    },
    after: async sb => { const P = sb.feat('sledding').portal; P.hum.set(0); P.buzz.set(0); },
  },
  {
    id: 'tuxportal-penguin', group: 'Outdoors', title: 'A penguin pops out',
    when: 'At the Tuxedo Shop: the portal flares with a chirp, and a penguin pops out of it.',
    src: 'src/tuxportal.js#_chirp() {', secs: 1.5,
    note: 'The portal\'s own _chirp(), then the pop 0.35 s later replayed from update() (it only runs with the toy beside the shop).',
    trigger: async sb => {
      sb.feat('sledding').portal._chirp();
      sb.k.synth.note(1046, 0.06, { type: 'square', vol: 0.012, at: 0.35 }); sb.k.synth.note(1318, 0.08, { type: 'square', vol: 0.012, at: 0.41 });
    },
  },
  {
    id: 'tuxportal-gulp', group: 'Outdoors', title: 'A penguin goes home',
    when: 'At the Tuxedo Shop: a penguin waddles back into the portal and it takes it with a gulp.',
    src: 'src/tuxportal.js#gulp(p) {', secs: 1,
    trigger: async sb => { const P = sb.feat('sledding').portal; P.gulp(P.at); },
  },
  {
    id: 'tuxportal-shut', group: 'Outdoors', title: 'Forced shut, and open again',
    when: 'At the Tuxedo Shop, now and then: the portal shrinks and flickers with the call falling, then bursts open again.',
    src: 'src/tuxportal.js#this.phase = \'closing\'; this.pt = 0; k.synth.noise(1.1', secs: 4,
    note: 'Replayed from update() (it runs only with the toy near the shop): the closing sounds, then 2.8 s later (1.3 s closing, 1.5 s shut) the burst as it reopens.',
    trigger: async sb => {
      const { MOTIF, hz } = await sb.mod('motif.js'), s = sb.k.synth;
      s.noise(1.1, { vol: 0.02, lp: 700 }); for (let i = 0; i < 5; i++) s.note(hz(MOTIF[4 - i].midi), 0.2, { type: 'sine', vol: 0.014, at: i * 0.2 });
      s.noise(0.25, { vol: 0.04, lp: 2600, at: 2.8 }); s.note(hz(MOTIF[0].midi + 12), 0.3, { type: 'sine', vol: 0.02, at: 2.8 });
    },
  },
  {
    id: 'tuxportal-jump', group: 'Outdoors', title: 'Through the portal',
    when: 'Driving into the portal (GO IN): a rising whirl, and you are spat out at the bottom of the sled run.',
    src: 'src/tuxportal.js#k.synth.note(180 * Math.pow(1.25, i)', secs: 1.5,
    note: 'Replayed from _jump() and _jumpStep() (calling them moves the toy and covers the screen): the whirl, then the pop 0.45 s later.',
    trigger: async sb => {
      const s = sb.k.synth;
      for (let i = 0; i < 8; i++) s.note(180 * Math.pow(1.25, i), 0.16, { type: 'sine', vol: 0.03, at: i * 0.05 });
      s.noise(0.6, { vol: 0.03, lp: 1600 });
      s.note(880, 0.1, { type: 'square', vol: 0.014, at: 0.46 }); s.noise(0.2, { vol: 0.04, lp: 1200, at: 0.46 });
    },
  },
];
