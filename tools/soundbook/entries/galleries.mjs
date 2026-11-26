// Sound book entries: gallery set-pieces, little secrets and things to do indoors.
// Files: galleries1.js, latergalleries.js, feature-upstairs.js, l2-grandejatte.js, level3.js, level3-back.js,
// level3-terrace.js, thorne.js, mice.js, nests.js, notes.js, lostfound.js.
// (The upright piano in Gallery 246 plays through src/piano.js and is not listed here.)
const GL = 'Galleries and lamps', SS = 'Story and secrets';

export const entries = [
  // ================================================================ galleries1.js
  {
    id: 'shiva-ring-drone', group: GL, title: 'Ring of flames: drone and bells',
    when: 'Gallery 141, after looking at Shiva as Lord of the Dance, while the ring of flames burns on the floor.',
    src: 'src/galleries1.js:125', secs: 12,
    trigger: async sb => { const f = sb.feat('shiva141'), R = f.R; sb.place(R.x, R.y + 0.05, R.z); f.onLook(R.art, sb.k); },
    after: async sb => { const f = sb.feat('shiva141'); if (f.R) f._off(sb.k); },
    note: 'The low reed drone, with a small bell every few seconds (random notes), heard from the middle of the ring.',
  },
  {
    id: 'shiva-ring-broke', group: GL, title: 'Ring of flames: touched the edge',
    when: 'Gallery 141, driving the lap round Shiva\'s ring of flames and leaving the band part way round.',
    src: 'src/galleries1.js:134', secs: 1,
    trigger: async sb => { sb.S.tick(0.08, 900, 0.12); },
  },
  {
    id: 'shiva-ring-done', group: SS, title: 'The dance of Shiva',
    when: 'Gallery 141, finishing a whole lap inside Shiva\'s ring of flames.',
    src: 'src/galleries1.js:137', secs: 4,
    trigger: async sb => { const midi = n => 440 * Math.pow(2, (n - 69) / 12); sb.k.synth.chime([62, 69, 74, 81, 86].map(midi), { gap: 0.18, dur: 3, vol: 0.05 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'hours-koto', group: GL, title: 'Twelve hours: koto',
    when: 'Gallery 107, looking at one of Utamaro\'s prints of the hours.',
    src: 'src/galleries1.js:176', secs: 3,
    trigger: async sb => { sb.patch(sb.k, 'find', () => true); const f = sb.feat('hours107'); f.onLook(f.H.prints[0].art, sb.k); },
    note: 'Five koto plucks on a hirajoshi scale; which notes depends on the print\'s hour.',
  },
  {
    id: 'masks-pickup', group: GL, title: 'Noh mask picked up',
    when: 'Driving into the lost Noh mask in a back room, so it rides on the toy.',
    src: 'src/galleries1.js:251', secs: 1,
    trigger: async sb => { sb.S.tick(0.08, 2600, 0.05); },
  },
  {
    id: 'masks-home', group: SS, title: 'The missing mask, home',
    when: 'Gallery 103, when the carried mask flies back onto its empty stand.',
    src: 'src/galleries1.js:265', secs: 3,
    trigger: async sb => {
      const S = sb.S, c = S.ctx; if (!c || c.state !== 'running' || S.muted) return;
      const outs = S.dry && S.send ? [S.dry, S.send] : [S.master], music = (S.vol && S.vol.music) || 1;
      const midi = n => 440 * Math.pow(2, (n - 69) / 12), HIRA = [0, 2, 3, 7, 8, 12, 14, 15];
      const pluck = (freq, when, vol) => {
        const t = c.currentTime + when, o = c.createOscillator(), f = c.createBiquadFilter(), e = c.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(freq * 1.006, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
        f.type = 'lowpass'; f.Q.value = 2; f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.9);
        e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(vol, t + 0.004); e.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        o.connect(f); f.connect(e); for (const n of outs) e.connect(n); o.start(t); o.stop(t + 1.7);
      };
      const seed = 5; for (let i = 0; i < 5; i++) pluck(midi(62 + HIRA[(seed * 3 + i * (i % 2 ? 2 : 3)) % HIRA.length]), i * 0.24, 0.045 * music);
    },
    note: 'Replayed from the source lines (koto(k, 5): the module\'s pluck is not exported).',
  },
  {
    id: 'seasons-tile', group: GL, title: 'Mosaic tile settles',
    when: 'Gallery 154, pushing one of the four lifted mosaic squares back into its place.',
    src: 'src/galleries1.js:333', secs: 7,
    trigger: async sb => {
      const midi = n => 440 * Math.pow(2, (n - 69) / 12);
      for (let s = 0; s < 4; s++) { sb.S.tick(0.1, 700, 0.08); sb.k.synth.note(midi(69 + [0, 4, 7, 12][s]), 1.6, { type: 'sine', vol: 0.05 }); await sb.wait(1.6); }
    },
    note: 'Replayed from the source lines: spring, summer, autumn, winter in turn (each tile has its own note).',
  },
  {
    id: 'seasons-done', group: SS, title: 'The four seasons',
    when: 'Gallery 154, when the last of the four mosaic squares goes home.',
    src: 'src/galleries1.js:335', secs: 3.5,
    trigger: async sb => { const midi = n => 440 * Math.pow(2, (n - 69) / 12); sb.k.synth.chime([69, 73, 76, 81].map(midi), { gap: 0.2, dur: 2.4, vol: 0.05 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'herring-sea', group: GL, title: 'The Herring Net: the sea',
    when: 'Gallery 161, for half a minute after looking at Winslow Homer\'s The Herring Net: surf and gulls.',
    src: 'src/galleries1.js:379', secs: 14,
    trigger: async sb => {
      const f = sb.feat('herring161'), F = f.F, a = F.art, was = F.state;
      sb.later(() => { F.state = was; F.sea = 0; });
      F.state = 'caught';                     // (so only the sea plays: no fish this time)
      sb.place(a.x + a.nx * 3, F.y + 0.05, a.z + a.nz * 3);
      F.waveIn = 0; F.gullIn = 0;
      f.onLook(a, sb.k);
    },
    note: 'Heard from 3 m in front of the painting; the waves and gulls come at random intervals.',
  },
  {
    id: 'herring-flap', group: GL, title: 'Herring flapping on the floor',
    when: 'Gallery 161, when the herring lands on the floor and flaps about.',
    src: 'src/galleries1.js:391', secs: 5,
    trigger: async sb => {
      sb.S.tick(0.07, 1300, 0.05);
      const t0 = performance.now(); while (performance.now() - t0 < 4500) { await sb.wait(1 / 60); if (Math.random() < (1 / 60) * 1.2) sb.S.tick(0.03 * 0.85, 1500, 0.03); }
    },
    note: 'Replayed from the source lines: the landing tick, then the random flaps as heard from about 1.5 m away.',
  },
  {
    id: 'herring-hop', group: GL, title: 'Herring hops away',
    when: 'Gallery 161, coming near the herring on the floor, so it hops off.',
    src: 'src/galleries1.js:395', secs: 1.5,
    trigger: async sb => { sb.S.tick(0.06, 1800, 0.04); await sb.wait(0.56); sb.S.tick(0.07, 1300, 0.05); },
    note: 'Replayed from the source lines: the hop, and the landing a moment later.',
  },
  {
    id: 'herring-caught', group: SS, title: 'Caught the herring',
    when: 'Gallery 161, catching the herring once it has tired.',
    src: 'src/galleries1.js:393', secs: 1,
    trigger: async sb => { sb.k.synth.noise(0.5, { vol: 0.06, lp: 2500 }); },
    note: 'Replayed from the source lines.',
  },

  // ================================================================ latergalleries.js
  {
    id: 'monet-wheat-season', group: GL, title: 'Stacks of wheat: the light changes',
    when: 'Gallery 243, driving up to one of Monet\'s stacks of wheat: the room takes its season.',
    src: 'src/latergalleries.js:120', secs: 6,
    trigger: async sb => {
      const hz = m => 440 * Math.pow(2, (m - 69) / 12);
      for (const ch of [[72, 76, 79], [69, 72, 76], [76, 83, 88]]) { sb.k.synth.chime(ch.map(hz), { vol: 0.03, gap: 0.22 }); await sb.wait(2); }
    },
    note: 'Replayed from the source lines: summer (and sunset), autumn, snow.',
  },
  {
    id: 'monet-pond-open', group: GL, title: 'The lily pond opens',
    when: 'Gallery 243, after looking at the Water Lilies: a pond opens in the floor.',
    src: 'src/latergalleries.js:129', secs: 2,
    trigger: async sb => { const hz = m => 440 * Math.pow(2, (m - 69) / 12); sb.k.synth.chime([hz(67), hz(71), hz(74), hz(79)], { vol: 0.03, gap: 0.12 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'monet-splash', group: GL, title: 'Plop into the pond',
    when: 'Gallery 243, missing a lily pad and dropping into the pond.',
    src: 'src/latergalleries.js:137', secs: 1,
    trigger: async sb => { const hz = m => 440 * Math.pow(2, (m - 69) / 12); sb.k.synth.noise(0.5, { vol: 0.12, lp: 1400 }); sb.k.synth.note(hz(50), 0.25, { type: 'sine', vol: 0.06 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'monet-frog-croak', group: GL, title: 'Frog croaks',
    when: 'Gallery 243, the frog on the far lily pad, now and then (and loudly when you reach its pad).',
    src: 'src/latergalleries.js:152', secs: 1,
    trigger: async sb => { sb.feat('monet243')._croak(sb.k, 1); },
  },
  {
    id: 'lautrec-cancan-band', group: GL, title: 'Can-can band',
    when: 'Gallery 242, after looking at At the Moulin Rouge: the band plays Offenbach\'s galop over a floor of lit squares.',
    src: 'src/latergalleries.js:225', secs: 14,
    trigger: async sb => {
      const f = sb.feat('lautrec242'); sb.place(f.fc.x, f.fc.y + 0.05, f.fc.z);
      f._strike(sb.k); f.dance.wait = 1e9;      // (the band only: no round of steps starts)
    },
    after: async sb => { const f = sb.feat('lautrec242'); f._stop(sb.k); f.dance.want = false; },
    note: 'Two times through the 8-bar tune, from the middle of the dance floor. It loops for as long as you stay.',
  },
  {
    id: 'lautrec-cancan-step', group: GL, title: 'Can-can: a step in time',
    when: 'Gallery 242, landing on the lit square in time with the can-can.',
    src: 'src/latergalleries.js:240', secs: 7,
    trigger: async sb => {
      const hz = m => 440 * Math.pow(2, (m - 69) / 12);
      for (const m of [72, 76, 79, 84, 79, 76, 79, 84]) { sb.k.synth.note(hz(m), 0.25, { type: 'sine', vol: 0.05 }); await sb.wait(0.84); }
    },
    note: 'Replayed from the source lines: the eight steps of a round, one a bar (without the band).',
  },
  {
    id: 'lautrec-cancan-miss', group: GL, title: 'Can-can: out of step',
    when: 'Gallery 242, missing the lit square in time.',
    src: 'src/latergalleries.js:243', secs: 1,
    trigger: async sb => { sb.k.synth.noise(0.25, { vol: 0.06, lp: 600 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'lautrec-circus-ring', group: GL, title: 'Circus ring appears',
    when: 'Gallery 242, after looking at At the Circus: a sawdust ring is laid on the floor.',
    src: 'src/latergalleries.js:207', secs: 2,
    trigger: async sb => { const hz = m => 440 * Math.pow(2, (m - 69) / 12); sb.k.synth.chime([hz(67), hz(72), hz(76), hz(79)], { vol: 0.035, gap: 0.1 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'lautrec-circus-lap', group: GL, title: 'Circus ring: a lap',
    when: 'Gallery 242, each lap of the sawdust ring at a gallop: a double clap.',
    src: 'src/latergalleries.js:262', secs: 1,
    trigger: async sb => { sb.k.synth.noise(0.12, { vol: 0.07, lp: 3000 }); sb.k.synth.noise(0.12, { vol: 0.07, lp: 3000, at: 0.14 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'lautrec-circus-done', group: SS, title: 'Three times round the ring',
    when: 'Gallery 242, the third lap of the sawdust ring.',
    src: 'src/latergalleries.js:264', secs: 2.5,
    trigger: async sb => {
      const hz = m => 440 * Math.pow(2, (m - 69) / 12);
      sb.k.synth.noise(0.12, { vol: 0.07, lp: 3000 }); sb.k.synth.noise(0.12, { vol: 0.07, lp: 3000, at: 0.14 });
      sb.k.synth.chime([hz(72), hz(76), hz(79), hz(84)], { vol: 0.04, gap: 0.09 });
    },
    note: 'Replayed from the source lines: the lap clap and the chime together, as they come.',
  },
  {
    id: 'degas-barres-rise', group: GL, title: 'Practice barres rise',
    when: 'Gallery 226, rolling onto the pink mark by the west door: the Degas slalom barres come up.',
    src: 'src/latergalleries.js:325', secs: 1,
    trigger: async sb => { sb.k.synth.note(440 * Math.pow(2, (57 - 69) / 12), 0.4, { type: 'sine', vol: 0.04 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'degas-gates', group: GL, title: 'Degas slalom: through a gate',
    when: 'Gallery 226, weaving past each practice barre in the slalom: a rising scale.',
    src: 'src/latergalleries.js:304', secs: 5.5,
    trigger: async sb => { const f = sb.feat('degas226'); for (let i = 1; i <= 6; i++) { f.course.o.onPass(i, 7); await sb.wait(0.8); } },
    note: 'The game\'s own gate callback, for the five barres and the finish line, a gate every 0.8 s.',
  },
  {
    id: 'degas-done', group: SS, title: 'Pas de deux',
    when: 'Gallery 226, finishing the slalom through the barres clean.',
    src: 'src/latergalleries.js:305', secs: 2,
    trigger: async sb => { sb.patch(sb.k, 'find', () => true); sb.feat('degas226').course.o.onDone(14.2); },
  },
  {
    id: 'hammershoi-hum', group: GL, title: 'The Music Room hums',
    when: 'Gallery 246, near Hammershøi\'s Music Room: one note, held, very soft.',
    src: 'src/latergalleries.js:376', secs: 6,
    trigger: async sb => { const f = sb.feat('hammershoi246'); sb.place(f.hum.x, f.hum.y + 0.05, f.hum.z); },
    after: async sb => { const f = sb.feat('hammershoi246'); if (f._hush) f._hush(); },
    note: 'Heard standing right in front of the painting (it fades out within 5 m).',
  },

  // ================================================================ feature-upstairs.js
  {
    id: 'joust-charge', group: GL, title: 'Joust: charge!',
    when: 'Gallery 239, the knight\'s count down ends and he charges down the tilt.',
    src: 'src/feature-upstairs.js:167', secs: 1.5,
    trigger: async sb => { [392, 523, 659, 784].forEach((f, i) => sb.k.synth.note(f, i === 3 ? 0.7 : 0.18, { type: 'sawtooth', vol: 0.035, at: i * 0.16 })); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'joust-hit', group: SS, title: 'Joust: a hit!',
    when: 'Gallery 239, meeting the charging knight at a gallop with the lance level: he goes over.',
    src: 'src/feature-upstairs.js:177', secs: 1.5,
    trigger: async sb => { sb.k.synth.noise(0.35, { vol: 0.12, lp: 5000 }); sb.k.synth.note(1240, 0.6, { type: 'square', vol: 0.04 }); sb.k.synth.note(620, 0.9, { vol: 0.05 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'dragon-wakes', group: GL, title: 'The dragon gets out',
    when: 'Gallery 237, looking at Saint George and the Dragon, then stepping back: its shadow rises off the floor.',
    src: 'src/feature-upstairs.js:251', secs: 4,
    trigger: async sb => { sb.patch(sb.k, 'find', () => true); const f = sb.feat('dragon237'); f.onLook(f.art, sb.k); },
    after: async sb => { sb.feat('dragon237').reset(); },
    note: 'The low growl as you look, and the rush of air as it rises once the look is over (half a second later here).',
  },
  {
    id: 'dragon-breath', group: GL, title: 'Dragon breath',
    when: 'Upstairs, when the dragon\'s shadow catches up with the toy and blows it aside.',
    src: 'src/feature-upstairs.js:293', secs: 1.2,
    trigger: async sb => { sb.k.synth.noise(0.9, { vol: 0.12, lp: 900 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'clocks-set', group: GL, title: 'Setting a clock',
    when: 'Galleries 231-233, pressing E at a clock to wind it on to the hour; at twelve it strikes once.',
    src: 'src/feature-upstairs.js:434', secs: 2.5,
    trigger: async sb => {
      const click = () => { sb.k.synth.note(2400, 0.05, { type: 'square', vol: 0.025 }); sb.k.synth.note(1800, 0.05, { type: 'square', vol: 0.02, at: 0.09 }); };
      click(); await sb.wait(0.8); click(); sb.k.synth.note(523, 1.2, { type: 'sine', vol: 0.05 });
    },
    note: 'Replayed from the source lines: an ordinary turn, then a turn onto twelve with that clock\'s bell (each clock has its own).',
  },
  {
    id: 'clocks-midnight', group: SS, title: 'Midnight',
    when: 'Galleries 231-233, when all twelve clocks stand at twelve: they all strike, and the tall case clock tolls twelve.',
    src: 'src/feature-upstairs.js:441', secs: 14,
    trigger: async sb => { sb.patch(sb.k, 'find', () => true); sb.feat('clocks231').midnight(sb.k); },
    after: async sb => { sb.feat('clocks231').reset(sb.k); },
  },
  {
    id: 'lionhunt-found', group: GL, title: 'Lion found',
    when: 'Anywhere in the building during the lion hunt, coming up to one of the twelve lions.',
    src: 'src/feature-upstairs.js:564', secs: 1.5,
    trigger: async sb => { sb.k.synth.noise(0.8, { vol: 0.06, lp: 380 }); sb.k.synth.note(68, 0.9, { type: 'sawtooth', vol: 0.03, attack: 0.18 }); sb.k.synth.note(52, 1.1, { type: 'sawtooth', vol: 0.025, attack: 0.3, at: 0.2 }); },
    note: 'Replayed from the source lines.',
  },

  // ================================================================ l2-grandejatte.js
  {
    id: 'grandejatte-waltz', group: GL, title: 'Grande Jatte: the waltz',
    when: 'Gallery 240, looking at Seurat\'s A Sunday on La Grande Jatte: dot-people dance on the floor to The Blue Danube.',
    src: 'src/l2-grandejatte.js:460', secs: 19,
    trigger: async sb => {
      const f = sb.feat('l2-grande-jatte'), a = f.art, y = sb.G.plan.byId[f.roomId].y;
      sb.place(a.x + a.nx * 2, y + 0.05, a.z + a.nz * 2);
      sb.G.shell.look(a);
    },
    note: 'The first strain, once round (17 s), looking from 2 m. The look\'s own bell (and the lamp, the first time) come at the start.',
  },
  {
    id: 'grandejatte-monkey-chatter', group: GL, title: 'The monkey chatters',
    when: 'Gallery 240 and the way to the Director\'s office: the monkey out of Seurat\'s picture chatters. Quietly, now and then, from under the bench; louder when it has stopped to wait for you, from the bench when it sees you come back, and from the foot of the frame as it goes.',
    src: 'src/l2-grandejatte.js:306', secs: 1,
    trigger: async sb => { sb.feat('l2-grande-jatte').chatter(sb.k, 0.03); },
    note: 'The loudest it is (0.03). Under the bench it is at 0.014.',
  },
  {
    id: 'grandejatte-monkey-off', group: GL, title: 'The monkey bolts',
    when: 'Gallery 240, driving to within a metre and a half of the bench: the monkey bolts from under it, and the chase to the Director\'s whiteboard is on.',
    src: 'src/l2-grandejatte.js:285', secs: 1,
    trigger: async sb => { sb.k.synth.chime([1568, 1976, 2349], { gap: 0.07, dur: 0.3, vol: 0.04 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'grandejatte-monkey-feet', group: GL, title: 'The monkey running',
    when: 'On the chase, and on its way home: its feet on the floor while it runs, when it is within twelve metres.',
    src: 'src/l2-grandejatte.js:307', secs: 1.2,
    trigger: async sb => { for (let i = 0; i < 8; i++) { sb.k.synth.noise(0.03, { vol: 0.016, lp: 3000 }); await sb.wait(0.11); } },
    note: 'Replayed from the source lines: a dash of eight steps, as close as it gets.',
  },
  {
    id: 'grandejatte-monkey-found', group: SS, title: 'The monkey found',
    when: 'The Director\'s office, driving up to the monkey under the whiteboard: it chatters, and looks up at the board.',
    src: 'src/l2-grandejatte.js:230', secs: 1,
    trigger: async sb => { for (let i = 0; i < 4; i++) sb.k.synth.note(1400 + i * 260, 0.08, { type: 'square', vol: 0.03, at: i * 0.07 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'grandejatte-monkey-back', group: SS, title: 'The monkey back on its lead',
    when: 'Gallery 240, the next time you come in after finding it: it runs from the bench to the picture, jumps to the foot of the frame, and is gone.',
    src: 'src/l2-grandejatte.js:274', secs: 1,
    trigger: async sb => { sb.k.synth.chime([2349, 1976, 1568], { gap: 0.07, dur: 0.3, vol: 0.04 }); },
    note: 'Replayed from the source lines.',
  },

  // ================================================================ level3.js
  {
    id: 'l3-cubist-guitar', group: SS, title: 'The guitar, whole',
    when: 'Gallery 391, holding still on the eye in the floor so the floating shards line up into a guitar.',
    src: 'src/level3.js:120', secs: 2.5,
    trigger: async sb => { sb.k.synth.chime([392, 494, 587, 784], { gap: 0.12 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'l3-kandinsky-shapes', group: GL, title: 'Kandinsky shapes sing',
    when: 'Gallery 392, touching each of the seven floating Kandinsky shapes: each has its own voice.',
    src: 'src/level3.js:199', secs: 9,
    trigger: async sb => { const f = sb.feat('l3kandinsky'); for (const s of f.shapes) { f.sound(sb.k, s); await sb.wait(1.2); } },
    note: 'All seven in turn: yellow circle, blue circle, red triangle, green square, black wave (a low rumble), chequerboard, crescent.',
  },
  {
    id: 'l3-kandinsky-lohengrin', group: SS, title: 'Colours that sing: Lohengrin',
    when: 'Gallery 392, once all seven shapes have been touched: they play the Bridal Chorus from Lohengrin.',
    src: 'src/level3.js:201', secs: 19.5,
    trigger: async sb => { sb.patch(sb.k, 'find', () => true); sb.feat('l3kandinsky').finale(sb.k); },
  },
  {
    id: 'l3-mondrian-armed', group: GL, title: 'Mondrian: on the red square',
    when: 'Gallery 393, rolling onto the red start square of the black-lines floor.',
    src: 'src/level3.js:251', secs: 0.5,
    trigger: async sb => { sb.k.synth.note(523, 0.2, { type: 'sine', vol: 0.05 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'l3-mondrian-off', group: GL, title: 'Mondrian: off the line',
    when: 'Gallery 393, straying off the black lines on the way to the yellow square.',
    src: 'src/level3.js:255', secs: 0.6,
    trigger: async sb => { sb.k.synth.note(110, 0.35, { type: 'square', vol: 0.05 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'l3-mondrian-done', group: SS, title: 'Black lines only',
    when: 'Gallery 393, reaching the yellow square on the black lines alone.',
    src: 'src/level3.js:253', secs: 2.2,
    trigger: async sb => { sb.k.synth.chime([523, 659, 784, 1047, 1319], { gap: 0.09 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'l3-lemons-knock', group: GL, title: 'Lemon knocked',
    when: 'Gallery 394, bumping one of the lemons across the floor.',
    src: 'src/level3.js:289', secs: 2,
    trigger: async sb => { const f = sb.feat('l3lemons'); for (const l of f.lemons) { l.b.o.onHit(l.b, 1); await sb.wait(0.4); } },
    note: 'The four lemons in turn (each a little higher).',
  },
  {
    id: 'l3-lemons-plate', group: GL, title: 'Lemon back on the plate',
    when: 'Gallery 394, pushing a lemon back onto the pewter plate.',
    src: 'src/level3.js:305', secs: 2.5,
    trigger: async sb => { for (const home of [1, 2, 3]) { sb.k.synth.note(660 + home * 110, 0.3, { type: 'sine', vol: 0.05 }); await sb.wait(0.8); } },
    note: 'Replayed from the source lines: the second, third and fourth lemon on the plate (the note rises with the count).',
  },
  {
    id: 'l3-lemons-done', group: SS, title: 'Lemons on a plate',
    when: 'Gallery 394, when all four lemons are on the plate.',
    src: 'src/level3.js:306', secs: 2.2,
    trigger: async sb => { sb.k.synth.chime([523, 659, 784, 1047]); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'l3-bird-laps', group: GL, title: 'Brass egg: a lap',
    when: 'Gallery 395, each time round the brass egg.',
    src: 'src/level3.js:352', secs: 2.5,
    trigger: async sb => { for (const f of [392, 494, 587]) { sb.k.synth.note(f, 0.5, { type: 'sine', vol: 0.06 }); await sb.wait(0.8); } },
    note: 'Replayed from the source lines: laps one, two and three.',
  },
  {
    id: 'l3-bird-hatched', group: SS, title: 'Hatched',
    when: 'Gallery 395, the third lap round the brass egg: it opens and a bird flies out.',
    src: 'src/level3.js#k.synth.chime([587, 784, 988, 1175])', secs: 2.2,
    trigger: async sb => { sb.k.synth.note(587, 0.5, { type: 'sine', vol: 0.06 }); sb.k.synth.chime([587, 784, 988, 1175]); },
    note: 'Replayed from the source lines: the third lap\'s note with the opening chime.',
  },
  {
    id: 'l3-doors-through', group: GL, title: 'Through the door across the room',
    when: 'Gallery 396, driving through one free-standing door and out of the other.',
    src: 'src/level3.js:440', secs: 1,
    trigger: async sb => { sb.k.synth.note(880, 0.4, { type: 'sine', vol: 0.05 }); sb.k.synth.note(1320, 0.6, { type: 'sine', vol: 0.03, at: 0.08 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'l3-corpse-drum', group: GL, title: 'Exquisite corpse: a drum turns',
    when: 'Gallery 397, rolling onto one of the three plates, so its drum turns.',
    src: 'src/level3.js:532', secs: 2,
    trigger: async sb => { for (const f of [330, 262, 196]) { sb.k.synth.note(f, 0.25, { type: 'triangle', vol: 0.06 }); sb.k.synth.noise(0.12, { vol: 0.03, lp: 900 }); await sb.wait(0.6); } },
    note: 'Replayed from the source lines: the head, body and legs drums in turn.',
  },
  {
    id: 'l3-corpse-elise', group: SS, title: 'Exquisite corpse: Für Elise',
    when: 'Gallery 397, when the three drums make one creature.',
    src: 'src/level3.js:540', secs: 6,
    trigger: async sb => {
      sb.patch(sb.k, 'find', () => true);
      const f = sb.feat('l3corpse'), was = f.drums.map(d => d.rot), done = f.done;
      sb.later(() => { f.drums.forEach((d, i) => { d.rot = was[i]; }); f.done = done; });
      f.drums.forEach(d => { d.rot = 0; }); f.done = false; f.check(sb.k);
    },
  },
  {
    id: 'l3-bubbles-pop', group: GL, title: 'Soap bubble pops',
    when: 'Gallery 397, driving into one of the soap bubbles from the clay pipe.',
    src: 'src/level3.js:585', secs: 1.5,
    trigger: async sb => { for (let i = 0; i < 3; i++) { sb.k.synth.note(1400 + Math.random() * 600, 0.06, { type: 'sine', vol: 0.05 }); await sb.wait(0.4); } },
    note: 'Replayed from the source lines: three pops (each at a random pitch).',
  },
  {
    id: 'l3-bubbles-lullaby', group: SS, title: 'A dozen soap bubbles: Brahms\' Lullaby',
    when: 'Gallery 397, popping the twelfth soap bubble.',
    src: 'src/level3.js#k.tune(BRAHMS', secs: 15.5,
    trigger: async sb => { sb.k.tune('E4:.5 E4:.5 | G4:2 E4:.5 E4:.5 | G4:2 E4:.5 G4:.5 | C5 B4:1.5 A4:.5 | A4 G4 D4:.5 E4:.5 | F4 D4 D4:.5 E4:.5 | F4:2 D4:.5 F4:.5 | B4:.5 A4:.5 G4 B4 | C5:2', { bpm: 96, type: 'sine', vol: 0.07, at: 0.4 }); },
    note: 'Replayed from the source lines (the BRAHMS melody, copied).',
  },
  {
    id: 'l3-stars-step', group: GL, title: 'Big Dipper: a star lights',
    when: 'Gallery 398, rolling onto the stars of the Big Dipper in order, handle to bowl.',
    src: 'src/level3.js:629', secs: 6,
    trigger: async sb => { for (const f of [262, 294, 330, 392, 440, 523, 587]) { sb.k.synth.note(f, 0.8, { type: 'sine', vol: 0.07 }); await sb.wait(0.75); } },
    note: 'Replayed from the source lines: all seven stars in order.',
  },
  {
    id: 'l3-stars-done', group: SS, title: 'The Big Dipper',
    when: 'Gallery 398, lighting the seventh star of the Big Dipper.',
    src: 'src/level3.js:630', secs: 2.6,
    trigger: async sb => { sb.k.synth.chime([523, 659, 784, 1047, 1319, 1568]); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'l3-sprint-start', group: GL, title: 'Futurist sprint: off',
    when: 'Gallery 389, leaving the start of the long corridor: the clock starts.',
    src: 'src/level3.js:665', secs: 0.8,
    trigger: async sb => { sb.feat('l3sprint').timer.o.onStart(); },
  },
  {
    id: 'l3-sprint-done', group: SS, title: 'Lines of force',
    when: 'Gallery 389, reaching the far end of the corridor in under 3.9 seconds.',
    src: 'src/level3.js:666', secs: 2.2,
    trigger: async sb => { sb.patch(sb.k, 'find', () => true); sb.feat('l3sprint').timer.o.onFinish(3.5); },
  },
  {
    id: 'l3-forms-bump', group: GL, title: 'Soft forms give',
    when: 'Level 3, by Gallery 398: bumping the smooth plaster forms, which wobble and sound.',
    src: 'src/level3.js:720', secs: 3,
    trigger: async sb => { for (const f of [196, 147, 247, 175]) { sb.k.synth.note(f, 0.35, { type: 'sine', vol: 0.08 }); sb.k.synth.note(f * 0.75, 0.3, { type: 'sine', vol: 0.05, at: 0.06 }); await sb.wait(0.6); } },
    note: 'Replayed from the source lines: the four forms in turn.',
  },
  {
    id: 'l3-mobile-turns', group: GL, title: 'The mobile turns',
    when: 'Gallery 399, driving fast under the hanging mobile.',
    src: 'src/level3.js:747', secs: 2,
    trigger: async sb => { sb.k.synth.chime([880, 1175], { gap: 0.1, vol: 0.025 }); },
    note: 'Replayed from the source lines.',
  },

  // ================================================================ level3-back.js
  {
    id: 'l3back-xray', group: GL, title: 'X-ray light box',
    when: 'Level 3, the X-ray room behind the scenes: pressing E to look at the X-ray on its light box.',
    src: 'src/level3-back.js:61', secs: 0.8,
    trigger: async sb => { sb.k.synth.noise(0.4, { vol: 0.02, lp: 6000 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'l3back-candle-out', group: GL, title: 'Candle blown out',
    when: 'Level 3, the conservators\' office: driving fast past the birthday cake puts a candle out.',
    src: 'src/level3-back.js:156', secs: 0.5,
    trigger: async sb => { sb.k.synth.noise(0.15, { vol: 0.03, lp: 1500 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'l3back-cake-song', group: SS, title: 'Blow out the candles: Happy Birthday',
    when: 'Level 3, the conservators\' office, when the last candle on Ruth\'s cake goes out.',
    src: 'src/level3-back.js#k.tune(HILL', secs: 14,
    trigger: async sb => {
      sb.k.synth.noise(0.15, { vol: 0.03, lp: 1500 });
      sb.k.tune('G4:.75 G4:.25 | A4 G4 C5 | B4:2 G4:.75 G4:.25 | A4 G4 D5 | C5:2 G4:.75 G4:.25 | G5 E5 C5 | B4 A4 F5:.75 F5:.25 | E5 C5 D5 | C5:2', { bpm: 110, type: 'triangle', vol: 0.07, at: 0.4 });
    },
    note: 'Replayed from the source lines (the HILL melody, copied), with the last candle\'s puff.',
  },
  {
    id: 'l3back-fax', group: GL, title: 'The fax wakes and prints',
    when: 'Level 3, conservation records: coming near the fax on its cabinet, it warbles and prints a page.',
    src: 'src/level3-back.js:194', secs: 3,
    setup: async sb => { sb.feat('l3fax').reset(); },
    trigger: async sb => {
      const f = sb.feat('l3fax'), r = sb.G.plan.byId['B3-49'], cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
      const dx = cx - f.at.x, dz = cz - f.at.z, d = Math.hypot(dx, dz) || 1;
      sb.place(f.at.x + dx / d * 1.0, f.at.y + 0.05, f.at.z + dz / d * 1.0);
    },
    after: async sb => { sb.feat('l3fax').reset(); },
    note: 'The toy is put 1 m from the fax, towards the middle of the room, and the game does the rest.',
  },
  {
    id: 'l3back-frame', group: GL, title: 'Through the empty frame',
    when: 'Level 3, frame conservation: driving through the empty gilt frame standing in the room.',
    src: 'src/level3-back.js:217', secs: 1.2,
    trigger: async sb => { sb.k.synth.note(1760, 0.08, { type: 'square', vol: 0.025 }); sb.k.synth.chime([523, 784], { gap: 0.1, vol: 0.04 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'l3back-cooler', group: GL, title: 'Water cooler glugs',
    when: 'Level 3, the back corridor: bumping the water cooler.',
    src: 'src/level3-back.js:274', secs: 1,
    trigger: async sb => { for (let i = 0; i < 4; i++) sb.k.synth.note(180 + Math.random() * 120, 0.12, { type: 'sine', vol: 0.06, at: i * 0.18 }); },
    note: 'Replayed from the source lines (the glugs are at random pitches).',
  },
  {
    id: 'l3back-coatrack', group: GL, title: 'Coat rack rocks',
    when: 'Level 3, the back corridor: bumping the coat rack.',
    src: 'src/level3-back.js:278', secs: 0.5,
    trigger: async sb => { sb.k.synth.note(150, 0.2, { type: 'triangle', vol: 0.05 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'l3back-flasks', group: GL, title: 'Flasks bubble up',
    when: 'Level 3, the lab at the end of the corridor: driving into the shelf of glowing flasks.',
    src: 'src/level3-back.js:307', secs: 0.8,
    trigger: async sb => { for (let i = 0; i < 5; i++) sb.k.synth.note(500 + Math.random() * 500, 0.08, { type: 'sine', vol: 0.04, at: i * 0.09 }); },
    note: 'Replayed from the source lines (random pitches).',
  },

  // ================================================================ level3-terrace.js
  {
    id: 'terrace-heater', group: GL, title: 'Patio heater hiss',
    when: 'The Modern Wing terrace in the snow: standing close to one of the patio heaters.',
    src: 'src/level3-terrace.js:87', secs: 5,
    trigger: async sb => {
      const f = sb.feat('l3terrace'), id = setInterval(() => f.hum.set(0.02), 50);
      sb.later(() => { clearInterval(id); f.hum.set(0); });
      await sb.wait(4); clearInterval(id); f.hum.set(0);
    },
    after: async sb => { sb.feat('l3terrace').hum.set(0); },
    note: 'The heater\'s loop driven at the level heard half a metre from it (0.02), then let go.',
  },
  {
    id: 'terrace-ring', group: GL, title: 'Through the steel ring',
    when: 'The Modern Wing terrace: driving through the big steel ring.',
    src: 'src/level3-terrace.js:134', secs: 1.8,
    trigger: async sb => { sb.k.synth.chime([659, 988, 1319], { gap: 0.07, vol: 0.05 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'terrace-snowball-stack', group: GL, title: 'Snowball goes up on top',
    when: 'The terrace: pushing a smaller snowball into a bigger one, so it hops up onto it.',
    src: 'src/level3-terrace.js:198', secs: 0.6,
    trigger: async sb => { sb.k.synth.note(523, 0.15, { type: 'sine', vol: 0.05 }); sb.k.synth.noise(0.2, { vol: 0.04, lp: 1200 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'terrace-snowman-deck', group: SS, title: 'A snowman: Deck the Hall',
    when: 'The terrace, when the snowman gets his head (and his face).',
    src: 'src/level3-terrace.js:216', secs: 8,
    trigger: async sb => {
      sb.k.synth.note(523, 0.15, { type: 'sine', vol: 0.05 }); sb.k.synth.noise(0.2, { vol: 0.04, lp: 1200 });
      sb.k.tune('C5:1.5 Bb4:.5 A4 G4 | F4 G4 A4 F4 | G4:.5 A4:.5 Bb4:.5 G4:.5 A4:1.5 G4:.5 | F4 E4 F4:2', { bpm: 132, type: 'triangle', vol: 0.07, at: 0.6 });
    },
    note: 'Replayed from the source lines (the DECK melody, copied), with the head going on just before.',
  },
  {
    id: 'terrace-viewer', group: GL, title: 'Coin viewer',
    when: 'The terrace: pressing E at the coin viewer to look up the Bridgeway.',
    src: 'src/level3-terrace.js:257', secs: 0.8,
    trigger: async sb => { sb.patch(sb.k, 'find', () => false); sb.feat('l3viewer').start(sb.k); },
    after: async sb => { sb.feat('l3viewer').stop(); },
  },
  {
    id: 'terzo-service-bell', group: GL, title: 'Service bell',
    when: 'Terzo Piano\'s kitchen: pressing E at the pass to ring for service.',
    src: 'src/level3-terrace.js:339', secs: 1.5,
    trigger: async sb => { sb.k.synth.note(2093, 1.2, { type: 'sine', vol: 0.07 }); sb.k.synth.note(3136, 0.8, { type: 'sine', vol: 0.03, at: 0.01 }); },
    note: 'Replayed from the source lines (ring() also puts a plate on the toy).',
  },
  {
    id: 'terzo-service-verdi', group: SS, title: 'Service! La donna è mobile',
    when: 'Terzo Piano: the plate of spaghetti reaches the table for two before it goes cold.',
    src: 'src/level3-terrace.js:349', secs: 7,
    trigger: async sb => { sb.patch(sb.k, 'find', () => true); const f = sb.feat('l3service'); f.carrying = true; f.deliver(sb.k); },
    after: async sb => { sb.feat('l3service').reset(sb.k); },
  },
  {
    id: 'terzo-bucket-tip', group: GL, title: 'Champagne bucket goes over',
    when: 'Terzo Piano: knocking over the champagne bucket on its stand, ice and all.',
    src: 'src/level3-terrace.js:381', secs: 1.2,
    trigger: async sb => { const f = sb.feat('l3bucket'); f.b.axis.set(1, 0, 0); f.b.o.onTip(f.b, 2); },
    after: async sb => { sb.feat('l3bucket').reset(); },
  },
  {
    id: 'kitchen-pots-tip', group: GL, title: 'Pots knocked over',
    when: 'Terzo Piano\'s kitchen: knocking over the stacked pots and pans.',
    src: 'src/level3-terrace.js:409', secs: 3,
    trigger: async sb => { const f = sb.feat('l3pots'); for (const b of f.pots) { b.o.onTip(b, 2); await sb.wait(0.5); } },
    note: 'The five pots in turn (each rings at its own pitch).',
  },
  {
    id: 'kitchen-pots-bump', group: GL, title: 'Pots bumped',
    when: 'Terzo Piano\'s kitchen: bumping into the pots without knocking them over.',
    src: 'src/level3-terrace.js#if (into > 0.4) k.synth.note(900', secs: 2,
    trigger: async sb => { const f = sb.feat('l3pots'); for (const b of f.pots) { b.o.onHit(b, 1); await sb.wait(0.3); } },
    note: 'The five pots in turn.',
  },

  // ================================================================ thorne.js
  {
    id: 'thorne-room-inside', group: GL, title: 'Inside a miniature room',
    when: 'Gallery 11, driving into one of the Thorne Miniature Rooms: the fire crackles and the mantel clock ticks.',
    src: 'src/thorne.js:302', secs: 6,
    trigger: async sb => {
      let tick = 0, tock = false, last = performance.now();
      const id = setInterval(() => {
        const now = performance.now(), dt = (now - last) / 1000; last = now;
        if (Math.random() < dt * 9) sb.k.synth.noise(0.02 + Math.random() * 0.05, { vol: 0.015 + Math.random() * 0.03, lp: 1400 + Math.random() * 3000 });
        tick += dt; if (tick > 0.5) { tick -= 0.5; tock = !tock; sb.k.synth.note(tock ? 2400 : 2050, 0.03, { type: 'square', vol: 0.012 }); }
      }, 16);
      sb.later(() => clearInterval(id));
      await sb.wait(5.5); clearInterval(id);
    },
    note: 'Replayed from the source lines, frame by frame (three of the four rooms have both a fire and a clock; the chapel has neither).',
  },
  {
    id: 'thorne-find', group: SS, title: 'Found something in a miniature room',
    when: 'Gallery 11, picking up the small thing left in one of the Thorne rooms.',
    src: 'src/thorne.js:297', secs: 1.5,
    trigger: async sb => { sb.k.synth.chime([880, 1175, 1568], { gap: 0.09, dur: 0.9, vol: 0.05 }); },
    note: 'Replayed from the source lines.',
  },

  // ================================================================ mice.js
  {
    id: 'mouse-bolts', group: SS, title: 'Mouse bolts',
    when: 'Anywhere a glowing museum mouse sits sniffing: come within a few metres and it squeaks and runs.',
    src: 'src/mice.js:376', secs: 0.5,
    trigger: async sb => { sb.k.synth.note(2600, 0.05, { type: 'sine', vol: 0.02 }); sb.k.synth.note(3100, 0.04, { type: 'sine', vol: 0.02, at: 0.07 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'mouse-chirps', group: SS, title: 'Mouse chirps on its run',
    when: 'Following a mouse home: each time it stops and looks back it chirps two notes of the craft\'s call.',
    src: 'src/mice.js:477', secs: 6,
    trigger: async sb => { const f = sb.feat('mice'), m = { chirp: 0 }; for (let i = 0; i < 4; i++) { f._chirp(sb.k, m); await sb.wait(1.7); } },
    note: 'Four chirps 1.7 s apart, as heard following one mouse all the way (together they make the whole call).',
  },
  {
    id: 'mouse-home', group: SS, title: 'Mouse home through its grille',
    when: 'Seeing a mouse all the way home: it squeezes in through its grille with the whole call, and the count goes up.',
    src: 'src/mice.js:463', secs: 2,
    trigger: async sb => {
      const { MOTIF, hz } = await sb.mod('motif.js');
      MOTIF.forEach((n, i) => sb.k.synth.note(hz(n.midi + 36), i === 4 ? 0.16 : 0.05, { type: 'sine', vol: 0.016, at: i * 0.075 }));
      sb.k.synth.noise(0.12, { vol: 0.03, lp: 3000, at: 0.05 });
      sb.k.synth.chime([1568, 2093, 2637], { vol: 0.045, gap: 0.11, dur: 0.9 });
    },
    note: 'Replayed from the source lines (a mouse seen home for the first time; one that gets home alone only squeaks the call).',
  },

  // ================================================================ nests.js
  {
    id: 'nest-grille-open', group: SS, title: 'Mouse vent opens',
    when: 'At a mouse\'s grille once it has been seen home: E swings the vent open.',
    src: 'src/nests.js:418', secs: 0.8,
    trigger: async sb => { sb.k.synth.note(520, 0.08, { type: 'square', vol: 0.025 }); sb.k.synth.noise(0.25, { vol: 0.04, lp: 2500, at: 0.04 }); sb.k.synth.note(330, 0.3, { type: 'triangle', vol: 0.03, at: 0.12 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'nest-grille-stuck', group: SS, title: 'Mouse vent stuck',
    when: 'At a mouse\'s grille before its mouse has been seen home: it rattles and stays shut.',
    src: 'src/nests.js:468', secs: 0.4,
    trigger: async sb => { sb.k.synth.noise(0.1, { vol: 0.035, lp: 2600 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'nest-clue', group: SS, title: 'Something the mice kept',
    when: 'Inside a mouse nest, reading the chewed page, photograph or key the mice have carried off.',
    src: 'src/nests.js:428', secs: 1.5,
    trigger: async sb => { sb.k.synth.chime([1175, 1568, 2349], { vol: 0.045, gap: 0.1, dur: 1 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'nest-desk-locked', group: SS, title: 'Director\'s desk: locked',
    when: 'The Director\'s office, trying the desk drawer without its key.',
    src: 'src/nests.js:438', secs: 0.4,
    trigger: async sb => { sb.k.synth.noise(0.12, { vol: 0.04, lp: 1800 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'nest-desk-open', group: SS, title: 'Director\'s desk: unlocked',
    when: 'The Director\'s office, opening the desk drawer with the key from the mouse nest.',
    src: 'src/nests.js:440', secs: 0.6,
    trigger: async sb => { sb.k.synth.note(1400, 0.05, { type: 'square', vol: 0.02 }); sb.k.synth.noise(0.3, { vol: 0.03, lp: 900, at: 0.08 }); },
    note: 'Replayed from the source lines.',
  },

  // ================================================================ notes.js
  {
    id: 'guard-note-read', group: SS, title: 'Guard\'s note read',
    when: 'Pulling up beside one of the night guard\'s yellow sticky notes long enough to read it (the first time).',
    src: 'src/notes.js:174', secs: 0.4,
    trigger: async sb => { sb.k.synth.note(700, 0.12, { type: 'triangle', vol: 0.03 }); },
    note: 'Replayed from the source lines.',
  },

  // ================================================================ lostfound.js
  {
    id: 'lostfound-pickup', group: GL, title: 'Lost property picked up',
    when: 'Driving into something a visitor dropped (a glove, a ticket, a teddy bear), so it rides on the toy.',
    src: 'src/lostfound.js:122', secs: 0.3,
    trigger: async sb => { sb.k.synth.note(1500, 0.08, { type: 'square', vol: 0.03 }); },
    note: 'Replayed from the source lines.',
  },
  {
    id: 'lostfound-handin', group: GL, title: 'Lost property handed in',
    when: 'At the coat check in the lobby (or the canteen box), handing in what the toy is carrying.',
    src: 'src/lostfound.js:142', secs: 2,
    trigger: async sb => { sb.k.synth.chime([880, 1320, 1760], { vol: 0.05 }); },
    note: 'Replayed from the source lines.',
  },
];
