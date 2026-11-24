// Sound-book entries: gallery music (music.js), the light show's carols and the Light Run (carols.js, lightshow.js),
// Snow Ball (bandshell.js, snowballsongs.js), the voyage music (cosmicmusic.js, motif.js) and the slow chords (audio.js).
// Written by gen-music.mjs: edit that and run it again.
export const entries = [
  {
    id: 'music-koto', group: 'Music', music: true,
    title: 'Gallery music: Sakura Sakura (koto)',
    when: 'In the Japanese galleries (101-109, 130-143), with Gallery music on.',
    src: 'src/music.js:17', secs: 20,
    // The feature's own update() plays it: want() is made to answer 'koto' (as it does in that room with the music on),
    // without turning on S.musicOn, so the slow chords stay out of it. One time through; the game then rests 7 s and loops.
    trigger: async sb => { const f = sb.feat('music'); sb.patch(f, 'want', () => 'koto'); },
    note: 'One time through the tune (the game loops it with 7 s between).',
  },
  {
    id: 'music-lyre', group: 'Music', music: true,
    title: 'Gallery music: Seikilos epitaph (lyre)',
    when: 'In the ancient art galleries (150-159), with Gallery music on.',
    src: 'src/music.js:18', secs: 19,
    // The feature's own update() plays it: want() is made to answer 'lyre' (as it does in that room with the music on),
    // without turning on S.musicOn, so the slow chords stay out of it. One time through; the game then rests 7 s and loops.
    trigger: async sb => { const f = sb.feat('music'); sb.patch(f, 'want', () => 'lyre'); },
    note: 'One time through the tune (the game loops it with 7 s between).',
  },
  {
    id: 'music-clock', group: 'Music', music: true,
    title: 'Gallery music: Cambridge quarters (music box and ticking)',
    when: 'In the clock galleries (231-234), with Gallery music on.',
    src: 'src/music.js:19', secs: 20,
    // The feature's own update() plays it: want() is made to answer 'clock' (as it does in that room with the music on),
    // without turning on S.musicOn, so the slow chords stay out of it. One time through; the game then rests 7 s and loops.
    trigger: async sb => { const f = sb.feat('music'); sb.patch(f, 'want', () => 'clock'); },
    note: 'One time through the tune (the game loops it with 7 s between).',
  },
  {
    id: 'music-cancan', group: 'Music', music: true,
    title: 'Gallery music: the can-can (reed)',
    when: 'In Gallery 242, with Gallery music on (unless the room\'s own can-can is playing).',
    src: 'src/music.js:20', secs: 8,
    // The feature's own update() plays it: want() is made to answer 'cancan' (as it does in that room with the music on),
    // without turning on S.musicOn, so the slow chords stay out of it. One time through; the game then rests 7 s and loops.
    trigger: async sb => { const f = sb.feat('music'); sb.patch(f, 'want', () => 'cancan'); },
    note: 'One time through the tune (the game loops it with 7 s between).',
  },
  {
    id: 'music-nocturne', group: 'Music', music: true,
    title: 'Gallery music: Chopin Nocturne in E flat (piano)',
    when: 'In the other French rooms (200-249), with Gallery music on.',
    src: 'src/music.js:21', secs: 14,
    // The feature's own update() plays it: want() is made to answer 'nocturne' (as it does in that room with the music on),
    // without turning on S.musicOn, so the slow chords stay out of it. One time through; the game then rests 7 s and loops.
    trigger: async sb => { const f = sb.feat('music'); sb.patch(f, 'want', () => 'nocturne'); },
    note: 'One time through the tune (the game loops it with 7 s between).',
  },
  {
    id: 'music-susanna', group: 'Music', music: true,
    title: 'Gallery music: Oh! Susanna (banjo)',
    when: 'In the American art galleries (260-279), with Gallery music on.',
    src: 'src/music.js:22', secs: 16,
    // The feature's own update() plays it: want() is made to answer 'susanna' (as it does in that room with the music on),
    // without turning on S.musicOn, so the slow chords stay out of it. One time through; the game then rests 7 s and loops.
    trigger: async sb => { const f = sb.feat('music'); sb.patch(f, 'want', () => 'susanna'); },
    note: 'One time through the tune (the game loops it with 7 s between).',
  },
  {
    id: 'music-clock-tick', group: 'Music',
    title: 'Clock ticking',
    when: 'In the clock galleries (231-234), with Gallery music on: under the Cambridge quarters.',
    src: 'src/music.js:97', secs: 8,
    // music.js's own _tick, run on a bus like the one _switch builds for the clock theme (low-pass 6000, 0.35 to the
    // reverb, at the theme's volume), once a unit (0.4 s), with no tune over it.
    trigger: async sb => {
      const f = sb.feat('music'), S = sb.S, c = S.ctx;
      const gain = c.createGain(), lp = c.createBiquadFilter(), wet = c.createGain();
      gain.gain.value = 0.05 * S.vol.music; lp.type = 'lowpass'; lp.frequency.value = 6000; wet.gain.value = 0.35;
      gain.connect(lp); lp.connect(S.dry || S.master); lp.connect(wet); wet.connect(S.send || S.master);
      const t0 = c.currentTime + 0.1;
      for (let j = 0; j < 19; j++) f._tick.call({ k: f.k, cur: { gain } }, t0 + j * 0.4);
      sb.later(() => setTimeout(() => { try { gain.disconnect(); } catch { /* gone */ } }, 3000));
    },
    note: 'The ticking alone (in the game it runs under the tune, one tick a unit).',
  },
  {
    id: 'carols-jingle', group: 'Carols and songs', music: true,
    title: 'Light show: Jingle Bells',
    when: 'Near the light show on Butler Field with Gallery music on: tune 1 of the seven-carol medley the lights keep time with.',
    src: 'src/carols.js:15', secs: 63,
    // A CarolPlayer of the game's own (carols.js), set to this tune and driven as lightshow.js drives it, at the level it
    // gives right by the field (near = 1: vol.music * 0.8). It stops being driven once the tune is laid down, so the next
    // one in the medley does not start.
    trigger: async sb => {
      const { CarolPlayer } = await sb.mod('carols.js');
      const S = sb.S, p = new CarolPlayer(), N = 0;
      p.i = N;
      const level = (S.vol.music || 0) * 0.8;
      let iv = null;
      // (stop just before the tune's end, once the last notes are laid down: update() would move on to the next tune)
      const left = () => p.tune.total * p.tune.spb - (S.ctx.currentTime - p.start);
      const step = () => {
        if (p.i !== N || (p.base === 'ctx' && left() < 0.02)) { clearInterval(iv); return; }
        p.update(S, level);
        if (p.i !== N || left() < 0.3) clearInterval(iv);
      };
      iv = setInterval(step, 40); step();
      sb.later(() => { clearInterval(iv); const o = p.out; if (o) { o.gain.setTargetAtTime(0, S.ctx.currentTime, 0.3); setTimeout(() => { try { o.disconnect(); } catch { /* gone */ } }, 3000); } });
    },
  },
  {
    id: 'carols-deck', group: 'Carols and songs', music: true,
    title: 'Light show: Deck the Hall',
    when: 'Near the light show on Butler Field with Gallery music on: tune 2 of the seven-carol medley the lights keep time with.',
    src: 'src/carols.js:21', secs: 39,
    // A CarolPlayer of the game's own (carols.js), set to this tune and driven as lightshow.js drives it, at the level it
    // gives right by the field (near = 1: vol.music * 0.8). It stops being driven once the tune is laid down, so the next
    // one in the medley does not start.
    trigger: async sb => {
      const { CarolPlayer } = await sb.mod('carols.js');
      const S = sb.S, p = new CarolPlayer(), N = 1;
      p.i = N;
      const level = (S.vol.music || 0) * 0.8;
      let iv = null;
      // (stop just before the tune's end, once the last notes are laid down: update() would move on to the next tune)
      const left = () => p.tune.total * p.tune.spb - (S.ctx.currentTime - p.start);
      const step = () => {
        if (p.i !== N || (p.base === 'ctx' && left() < 0.02)) { clearInterval(iv); return; }
        p.update(S, level);
        if (p.i !== N || left() < 0.3) clearInterval(iv);
      };
      iv = setInterval(step, 40); step();
      sb.later(() => { clearInterval(iv); const o = p.out; if (o) { o.gain.setTargetAtTime(0, S.ctx.currentTime, 0.3); setTimeout(() => { try { o.disconnect(); } catch { /* gone */ } }, 3000); } });
    },
  },
  {
    id: 'carols-wish', group: 'Carols and songs', music: true,
    title: 'Light show: We Wish You a Merry Christmas',
    when: 'Near the light show on Butler Field with Gallery music on: tune 3 of the seven-carol medley the lights keep time with.',
    src: 'src/carols.js:27', secs: 33,
    // A CarolPlayer of the game's own (carols.js), set to this tune and driven as lightshow.js drives it, at the level it
    // gives right by the field (near = 1: vol.music * 0.8). It stops being driven once the tune is laid down, so the next
    // one in the medley does not start.
    trigger: async sb => {
      const { CarolPlayer } = await sb.mod('carols.js');
      const S = sb.S, p = new CarolPlayer(), N = 2;
      p.i = N;
      const level = (S.vol.music || 0) * 0.8;
      let iv = null;
      // (stop just before the tune's end, once the last notes are laid down: update() would move on to the next tune)
      const left = () => p.tune.total * p.tune.spb - (S.ctx.currentTime - p.start);
      const step = () => {
        if (p.i !== N || (p.base === 'ctx' && left() < 0.02)) { clearInterval(iv); return; }
        p.update(S, level);
        if (p.i !== N || left() < 0.3) clearInterval(iv);
      };
      iv = setInterval(step, 40); step();
      sb.later(() => { clearInterval(iv); const o = p.out; if (o) { o.gain.setTargetAtTime(0, S.ctx.currentTime, 0.3); setTimeout(() => { try { o.disconnect(); } catch { /* gone */ } }, 3000); } });
    },
  },
  {
    id: 'carols-joy', group: 'Carols and songs', music: true,
    title: 'Light show: Joy to the World',
    when: 'Near the light show on Butler Field with Gallery music on: tune 4 of the seven-carol medley the lights keep time with.',
    src: 'src/carols.js:32', secs: 46,
    // A CarolPlayer of the game's own (carols.js), set to this tune and driven as lightshow.js drives it, at the level it
    // gives right by the field (near = 1: vol.music * 0.8). It stops being driven once the tune is laid down, so the next
    // one in the medley does not start.
    trigger: async sb => {
      const { CarolPlayer } = await sb.mod('carols.js');
      const S = sb.S, p = new CarolPlayer(), N = 3;
      p.i = N;
      const level = (S.vol.music || 0) * 0.8;
      let iv = null;
      // (stop just before the tune's end, once the last notes are laid down: update() would move on to the next tune)
      const left = () => p.tune.total * p.tune.spb - (S.ctx.currentTime - p.start);
      const step = () => {
        if (p.i !== N || (p.base === 'ctx' && left() < 0.02)) { clearInterval(iv); return; }
        p.update(S, level);
        if (p.i !== N || left() < 0.3) clearInterval(iv);
      };
      iv = setInterval(step, 40); step();
      sb.later(() => { clearInterval(iv); const o = p.out; if (o) { o.gain.setTargetAtTime(0, S.ctx.currentTime, 0.3); setTimeout(() => { try { o.disconnect(); } catch { /* gone */ } }, 3000); } });
    },
  },
  {
    id: 'carols-hark', group: 'Carols and songs', music: true,
    title: 'Light show: Hark! The Herald Angels Sing',
    when: 'Near the light show on Butler Field with Gallery music on: tune 5 of the seven-carol medley the lights keep time with.',
    src: 'src/carols.js:38', secs: 52,
    // A CarolPlayer of the game's own (carols.js), set to this tune and driven as lightshow.js drives it, at the level it
    // gives right by the field (near = 1: vol.music * 0.8). It stops being driven once the tune is laid down, so the next
    // one in the medley does not start.
    trigger: async sb => {
      const { CarolPlayer } = await sb.mod('carols.js');
      const S = sb.S, p = new CarolPlayer(), N = 4;
      p.i = N;
      const level = (S.vol.music || 0) * 0.8;
      let iv = null;
      // (stop just before the tune's end, once the last notes are laid down: update() would move on to the next tune)
      const left = () => p.tune.total * p.tune.spb - (S.ctx.currentTime - p.start);
      const step = () => {
        if (p.i !== N || (p.base === 'ctx' && left() < 0.02)) { clearInterval(iv); return; }
        p.update(S, level);
        if (p.i !== N || left() < 0.3) clearInterval(iv);
      };
      iv = setInterval(step, 40); step();
      sb.later(() => { clearInterval(iv); const o = p.out; if (o) { o.gain.setTargetAtTime(0, S.ctx.currentTime, 0.3); setTimeout(() => { try { o.disconnect(); } catch { /* gone */ } }, 3000); } });
    },
  },
  {
    id: 'carols-tannenbaum', group: 'Carols and songs', music: true,
    title: 'Light show: O Christmas Tree',
    when: 'Near the light show on Butler Field with Gallery music on: tune 6 of the seven-carol medley the lights keep time with.',
    src: 'src/carols.js:45', secs: 28,
    // A CarolPlayer of the game's own (carols.js), set to this tune and driven as lightshow.js drives it, at the level it
    // gives right by the field (near = 1: vol.music * 0.8). It stops being driven once the tune is laid down, so the next
    // one in the medley does not start.
    trigger: async sb => {
      const { CarolPlayer } = await sb.mod('carols.js');
      const S = sb.S, p = new CarolPlayer(), N = 5;
      p.i = N;
      const level = (S.vol.music || 0) * 0.8;
      let iv = null;
      // (stop just before the tune's end, once the last notes are laid down: update() would move on to the next tune)
      const left = () => p.tune.total * p.tune.spb - (S.ctx.currentTime - p.start);
      const step = () => {
        if (p.i !== N || (p.base === 'ctx' && left() < 0.02)) { clearInterval(iv); return; }
        p.update(S, level);
        if (p.i !== N || left() < 0.3) clearInterval(iv);
      };
      iv = setInterval(step, 40); step();
      sb.later(() => { clearInterval(iv); const o = p.out; if (o) { o.gain.setTargetAtTime(0, S.ctx.currentTime, 0.3); setTimeout(() => { try { o.disconnect(); } catch { /* gone */ } }, 3000); } });
    },
  },
  {
    id: 'carols-wenceslas', group: 'Carols and songs', music: true,
    title: 'Light show: Good King Wenceslas',
    when: 'Near the light show on Butler Field with Gallery music on: tune 7 of the seven-carol medley the lights keep time with.',
    src: 'src/carols.js:50', secs: 41,
    // A CarolPlayer of the game's own (carols.js), set to this tune and driven as lightshow.js drives it, at the level it
    // gives right by the field (near = 1: vol.music * 0.8). It stops being driven once the tune is laid down, so the next
    // one in the medley does not start.
    trigger: async sb => {
      const { CarolPlayer } = await sb.mod('carols.js');
      const S = sb.S, p = new CarolPlayer(), N = 6;
      p.i = N;
      const level = (S.vol.music || 0) * 0.8;
      let iv = null;
      // (stop just before the tune's end, once the last notes are laid down: update() would move on to the next tune)
      const left = () => p.tune.total * p.tune.spb - (S.ctx.currentTime - p.start);
      const step = () => {
        if (p.i !== N || (p.base === 'ctx' && left() < 0.02)) { clearInterval(iv); return; }
        p.update(S, level);
        if (p.i !== N || left() < 0.3) clearInterval(iv);
      };
      iv = setInterval(step, 40); step();
      sb.later(() => { clearInterval(iv); const o = p.out; if (o) { o.gain.setTargetAtTime(0, S.ctx.currentTime, 0.3); setTimeout(() => { try { o.disconnect(); } catch { /* gone */ } }, 3000); } });
    },
  },
  {
    id: 'lightshow-ornament', group: 'Outdoors',
    title: 'Light show ornament',
    when: 'Driving through one of the twelve glowing ornaments along the light show way (each one a step higher).',
    src: 'src/lightshow.js:786', secs: 4.5,
    // lightshow.js's own _take, three times (the first three ornaments of a run: C, D, E), outside a Light Run.
    trigger: async sb => {
      const f = sb.feat('lightshow'); sb.patch(f, 'got', 0); sb.patch(f, 'run', null);
      for (let i = 0; i < 3; i++) { f._take({ got: false }, sb.k); await sb.wait(1.1); }
    },
    note: 'The first three ornaments in a row; the chime climbs a scale through all twelve.',
  },
  {
    id: 'lightshow-run-start', group: 'Outdoors',
    title: 'Light Run start',
    when: 'Driving through the Grand Arch on Butler Field: the Light Run clock starts.',
    src: 'src/lightshow.js:804', secs: 1.5,
    trigger: async sb => { sb.k.synth.chime([392, 523.25, 659.25], { gap: 0.08, dur: 0.6, vol: 0.045 }); },
    note: 'Replayed from the source lines (the moment needs the toy to cross the arch).',
  },
  {
    id: 'lightshow-run-finish', group: 'Outdoors',
    title: 'Light Run finish',
    when: 'Finishing the Light Run under the Singing Tree.',
    src: 'src/lightshow.js:826', secs: 2.5,
    trigger: async sb => { sb.k.synth.chime([523.25, 659.25, 783.99, 1046.5, 1318.5], { gap: 0.09, dur: 1.4, vol: 0.05 }); },
    note: 'Replayed from the source lines (the moment needs a whole run; calling _finish would also find the secret).',
  },
  {
    id: 'snowball-cancan', group: 'Carols and songs', music: true,
    title: 'Snow Ball: Can-can (Offenbach)',
    when: 'Dancing Snow Ball on the band shell stage on Butler Field, with this dance picked.',
    src: 'src/snowballsongs.js:24', secs: 59,
    // snowballsongs.js's own Band playing its own arrangement, at the level bandshell.js _start gives it
    // (0.9 * max(0.55, vol.music)), updated every 40 ms as the game does each frame.
    trigger: async sb => {
      const { DANCES, arrange, Band } = await sb.mod('snowballsongs.js');
      const S = sb.S, A = arrange(DANCES[0]), band = new Band();
      band.play(S, A, S.ctx.currentTime + 0.7, 0.9 * Math.max(0.55, S.vol.music != null ? S.vol.music : 0.8));
      const iv = setInterval(() => band.update(), 40); band.update();
      sb.later(() => { clearInterval(iv); band.stop(); });
    },
    note: 'The whole dance, count-in to the last chord.',
  },
  {
    id: 'snowball-danube', group: 'Carols and songs', music: true,
    title: 'Snow Ball: The Blue Danube (Strauss)',
    when: 'Dancing Snow Ball on the band shell stage on Butler Field, with this dance picked.',
    src: 'src/snowballsongs.js:27', secs: 71,
    // snowballsongs.js's own Band playing its own arrangement, at the level bandshell.js _start gives it
    // (0.9 * max(0.55, vol.music)), updated every 40 ms as the game does each frame.
    trigger: async sb => {
      const { DANCES, arrange, Band } = await sb.mod('snowballsongs.js');
      const S = sb.S, A = arrange(DANCES[1]), band = new Band();
      band.play(S, A, S.ctx.currentTime + 0.7, 0.9 * Math.max(0.55, S.vol.music != null ? S.vol.music : 0.8));
      const iv = setInterval(() => band.update(), 40); band.update();
      sb.later(() => { clearInterval(iv); band.stop(); });
    },
    note: 'The whole dance, count-in to the last chord.',
  },
  {
    id: 'snowball-open', group: 'Games',
    title: 'Snow Ball: on the pad',
    when: 'Pressing E on the Snow Ball dance pad: the song and level screen opens.',
    src: 'src/bandshell.js:487', secs: 1.2,
    trigger: async sb => { sb.k.synth.chime([523, 784], { gap: 0.08, dur: 0.5, vol: 0.04 }); },
    note: 'Replayed from the source lines (_select also takes hold of the toy).',
  },
  {
    id: 'snowball-menu', group: 'Games',
    title: 'Snow Ball: choosing',
    when: 'On the Snow Ball song and level screen: left/right changes the song (lower note), up/down the level (higher).',
    src: 'src/bandshell.js:501', secs: 1.2,
    trigger: async sb => {
      sb.k.synth.note(660, 0.12, { type: 'triangle', vol: 0.04 });
      sb.k.synth.note(880, 0.12, { type: 'triangle', vol: 0.04, at: 0.5 });
    },
    note: 'Replayed from the source lines: a song step, then a level step.',
  },
  {
    id: 'snowball-combo', group: 'Games',
    title: 'Snow Ball: combo milestone',
    when: 'Dancing Snow Ball: reaching a combo milestone (the toy spins, snow bursts from the lights).',
    src: 'src/bandshell.js:550', secs: 1.2,
    trigger: async sb => { sb.k.synth.chime([784, 988, 1175], { gap: 0.05, dur: 0.5, vol: 0.03 }); },
    note: 'Replayed from the source lines (_milestone needs a dance under way).',
  },
  {
    id: 'snowball-finish', group: 'Games',
    title: 'Snow Ball: dance over',
    when: 'The end of a Snow Ball dance, with some steps missed: the results come up.',
    src: 'src/bandshell.js:562', secs: 2,
    trigger: async sb => { sb.k.synth.chime([523, 659, 784], { gap: 0.09, dur: 1.1, vol: 0.045 }); },
    note: 'Replayed from the source lines (_finish needs a whole dance).',
  },
  {
    id: 'snowball-full-combo', group: 'Games',
    title: 'Snow Ball: full combo',
    when: 'The end of a Snow Ball dance with no step missed (FULL COMBO).',
    src: 'src/bandshell.js:562', secs: 2.2,
    trigger: async sb => { sb.k.synth.chime([523, 659, 784, 1047, 1319], { gap: 0.09, dur: 1.1, vol: 0.045 }); },
    note: 'Replayed from the source lines (_finish needs a whole dance without a miss).',
  },
  {
    id: 'voyage-space', group: 'Music', music: true,
    title: 'Voyage: space',
    when: 'On the voyage, out in space: slow chords, stray bells, now and then the call.',
    src: 'src/cosmicmusic.js:150', secs: 50,
    // A CosmicMusic of the game's own (as voyage.js makes it), set to 'space' and updated every 40 ms as the voyage does.
    trigger: async sb => {
      const { CosmicMusic } = await sb.mod('cosmicmusic.js');
      const m = new CosmicMusic(sb.S); m.setMode('space'); m.update();
      const iv = setInterval(() => m.update(), 40);
      sb.later(() => { clearInterval(iv); m.stop(); const o = m.out; if (o) setTimeout(() => { try { o.disconnect(); } catch { /* gone */ } }, 5000); });
    },
    note: "A representative 50 s (it loops for as long as you are out there): six turns of the chords, the call twice.",
  },
  {
    id: 'voyage-hyper', group: 'Music', music: true,
    title: 'Voyage: the jump to hyperspace',
    when: 'On the voyage, the jump to hyperspace (and the jump back).',
    src: 'src/cosmicmusic.js:166', secs: 9,
    // A CosmicMusic of the game's own (as voyage.js makes it), set to 'hyper' and updated every 40 ms as the voyage does.
    trigger: async sb => {
      const { CosmicMusic } = await sb.mod('cosmicmusic.js');
      const m = new CosmicMusic(sb.S); m.setMode('hyper'); m.update();
      const iv = setInterval(() => m.update(), 40);
      sb.later(() => { clearInterval(iv); m.stop(); const o = m.out; if (o) setTimeout(() => { try { o.disconnect(); } catch { /* gone */ } }, 5000); });
    },
  },
  {
    id: 'voyage-deep', group: 'Music', music: true,
    title: 'Voyage: the far galaxy',
    when: 'On the voyage, at the far galaxy after the jump: one held chord and the call, low and slow.',
    src: 'src/cosmicmusic.js:173', secs: 18,
    // A CosmicMusic of the game's own (as voyage.js makes it), set to 'deep' and updated every 40 ms as the voyage does.
    trigger: async sb => {
      const { CosmicMusic } = await sb.mod('cosmicmusic.js');
      const m = new CosmicMusic(sb.S); m.setMode('deep'); m.update();
      const iv = setInterval(() => m.update(), 40);
      sb.later(() => { clearInterval(iv); m.stop(); const o = m.out; if (o) setTimeout(() => { try { o.disconnect(); } catch { /* gone */ } }, 5000); });
    },
  },
  {
    id: 'voyage-moon', group: 'Music', music: true,
    title: 'Voyage: the Moon',
    when: 'On the voyage, on the Moon: the space chords, thinner and further apart.',
    src: 'src/cosmicmusic.js:150', secs: 60,
    // A CosmicMusic of the game's own (as voyage.js makes it), set to 'moon' and updated every 40 ms as the voyage does.
    trigger: async sb => {
      const { CosmicMusic } = await sb.mod('cosmicmusic.js');
      const m = new CosmicMusic(sb.S); m.setMode('moon'); m.update();
      const iv = setInterval(() => m.update(), 40);
      sb.later(() => { clearInterval(iv); m.stop(); const o = m.out; if (o) setTimeout(() => { try { o.disconnect(); } catch { /* gone */ } }, 5000); });
    },
    note: "A representative 60 s (it loops while you are on the Moon).",
  },
  {
    id: 'voyage-finale', group: 'Music', music: true,
    title: 'Voyage: the museum opens (finale)',
    when: 'On the Moon, when the museum there opens: the call three times, fuller each time, then home.',
    src: 'src/cosmicmusic.js:180', secs: 27,
    // A CosmicMusic of the game's own (as voyage.js makes it), set to 'finale' and updated every 40 ms as the voyage does.
    trigger: async sb => {
      const { CosmicMusic } = await sb.mod('cosmicmusic.js');
      const m = new CosmicMusic(sb.S); m.setMode('finale'); m.update();
      const iv = setInterval(() => m.update(), 40);
      sb.later(() => { clearInterval(iv); m.stop(); const o = m.out; if (o) setTimeout(() => { try { o.disconnect(); } catch { /* gone */ } }, 5000); });
    },
    note: "The whole finale (about 25 s); the credits loop just begins at the end.",
  },
  {
    id: 'voyage-credits', group: 'Music', music: true,
    title: 'Voyage: the credits',
    when: 'Under the end credits, after the finale.',
    src: 'src/cosmicmusic.js:150', secs: 50,
    // A CosmicMusic of the game's own (as voyage.js makes it), set to 'credits' and updated every 40 ms as the voyage does.
    trigger: async sb => {
      const { CosmicMusic } = await sb.mod('cosmicmusic.js');
      const m = new CosmicMusic(sb.S); m.setMode('credits'); m.update();
      const iv = setInterval(() => m.update(), 40);
      sb.later(() => { clearInterval(iv); m.stop(); const o = m.out; if (o) setTimeout(() => { try { o.disconnect(); } catch { /* gone */ } }, 5000); });
    },
    note: "A representative 50 s of the credits loop (the call every other turn).",
  },
  {
    id: 'motif-call', group: 'Music',
    title: 'The craft\'s call',
    when: 'The five-note call of the craft (D G B A, held E), as motif.js plays it; the voyage, the base console and the probe each play it in their own way.',
    src: 'src/motif.js:53', secs: 4.5,
    trigger: async sb => {
      const { playMotif } = await sb.mod('motif.js');
      const S = sb.S, c = S.ctx;
      playMotif(c, S.dry || S.master, c.currentTime + 0.05);
    },
    note: 'playMotif at its own defaults (0.42 s a beat, gain 0.06), straight into the room.',
  },
  {
    id: 'music-ambient-chords', group: 'Music', music: true,
    title: 'Slow chords and stray bells',
    when: 'Everywhere in the museum, with Music on: slow chords under everything and now and then a few bell notes.',
    src: 'src/audio.js:150', secs: 45,
    // Sound.musicOn on, with the next chord due now and the first bells in 3 s; the game's own _music does the rest.
    trigger: async sb => {
      const S = sb.S;
      sb.patch(S, 'duck', 0);
      S.nextChord = 0; S.nextTune = S.ctx.currentTime + 3; S.musicOn = true;
    },
    after: async sb => { sb.S.musicOn = false; },
    note: 'A representative 45 s: three chords and a few bell phrases (when the bells come is random).',
  },
];
