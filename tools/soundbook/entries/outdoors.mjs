// Sound book entries: the outdoor features (roofs, sled hill, ice fishing, harbour, trains, traffic, Butler Field, the ballpark...).
// Written for tools/soundbook/record.mjs (see sb-brief.md). The Home Run Derby (ballpark.js) is a game of its own: group Games.
export const entries = [
  // ---------------------------------------------------------------- src/rooftops.js
  {
    id: 'roof-snowman-ball-lands', group: 'Outdoors', title: 'Snowball lands on the snowman',
    when: 'On the roof, when you push a snowball up onto the one below it.',
    src: 'src/rooftops.js:67', secs: 1,
    trigger: async sb => { sb.k.synth.noise(0.18, { vol: 0.05, lp: 900 }); },
    note: 'Replayed from the source line (the hop lands inside update()).',
  },
  {
    id: 'roof-snowman-finished', group: 'Outdoors', title: 'Snowman finished',
    when: 'On the roof, when the third snowball lands on top and the snowman is done.',
    src: 'src/rooftops.js:111', secs: 3,
    setup: async sb => { sb.patch(sb.k, 'find', () => false); },
    trigger: async sb => { const f = sb.feat('roofsnowman'); sb.k.synth.noise(0.18, { vol: 0.05, lp: 900 }); f.finish(sb.k); },
    after: async sb => { const f = sb.feat('roofsnowman'); if (f && f.reset) f.reset(sb.k); },
    note: 'The landing thump and finish() together, as the head ball lands (the secret toast is held back).',
  },
  {
    id: 'roof-snowman-knocked', group: 'Outdoors', title: 'Snowman knocked down',
    when: 'On the roof, when you drive into the snowman and it bursts.',
    src: 'src/rooftops.js:116', secs: 1.5,
    trigger: async sb => { sb.feat('roofsnowman').knock(sb.k); },
  },
  {
    id: 'roof-vent-notes', group: 'Outdoors', title: 'Singing vents, one by one',
    when: 'On the north roof, when you drive over the five vent caps (C D E F G).',
    src: 'src/rooftops.js:166', secs: 3,
    trigger: async sb => { const f = sb.feat('roofjingle'); for (let i = 0; i < 5; i++) f.sound(sb.k, i, i * 0.45); },
    note: 'The five vents in turn, each as one hit sounds.',
  },
  {
    id: 'roof-vent-jingle-bells', group: 'Outdoors', title: 'Vents play Jingle Bells',
    when: 'On the north roof, after you play the first line on the vents: they play the whole chorus.',
    src: 'src/rooftops.js:176', secs: 10,
    setup: async sb => { sb.patch(sb.k, 'find', () => false); },
    trigger: async sb => { sb.feat('roofjingle').play(sb.k); },
    after: async sb => { const f = sb.feat('roofjingle'); f.reset(sb.k); },
  },
  {
    id: 'roof-wave-through', group: 'Outdoors', title: 'Through the snow wave',
    when: 'On the roof, when you drive end to end under the lip of the breaking snow wave.',
    src: 'src/rooftops.js:296', secs: 2.5,
    trigger: async sb => { sb.k.synth.chime([392, 523, 659, 784], { gap: 0.09 }); },
    note: 'Replayed from the source line (it sounds inside update()).',
  },
  {
    id: 'roof-run-start', group: 'Outdoors', title: 'Rooftop run: off you go',
    when: 'On the scaffold landing, when you leave it and the rooftop run clock starts.',
    src: 'src/rooftops.js:394', secs: 1.5,
    trigger: async sb => { sb.feat('roofrun').timer.o.onStart(); },
  },
  {
    id: 'roof-run-finish', group: 'Outdoors', title: 'Rooftop run: in time',
    when: 'At the checkered banner, when you finish the rooftop run under the target time.',
    src: 'src/rooftops.js:395', secs: 3,
    setup: async sb => { sb.patch(sb.k, 'find', () => false); },
    trigger: async sb => { sb.feat('roofrun').timer.o.onFinish(1); },
  },
  {
    id: 'roof-chimney-take-parcel', group: 'Outdoors', title: 'Parcel taken from the sack',
    when: 'By the sack near the card game, when you take a parcel for a chimney.',
    src: 'src/rooftops.js:468', secs: 1.5,
    trigger: async sb => { sb.k.synth.chime([659, 880], { gap: 0.08, dur: 0.5 }); },
    note: 'Replayed from the source line (taking it would put a parcel in the toy).',
  },
  {
    id: 'roof-chimney-parcel-down', group: 'Outdoors', title: 'Parcel down the chimney',
    when: 'On the roof, when the drone drops a parcel into a chimney pot.',
    src: 'src/rooftops.js:485', secs: 2,
    trigger: async sb => { sb.k.synth.chime([784, 659, 523, 392], { gap: 0.07, dur: 0.6 }); },
    note: 'Replayed from the source line (it sounds inside update()).',
  },
  // ---------------------------------------------------------------- src/rooftops-high.js
  {
    id: 'roofvane-spin', group: 'Outdoors', title: 'Weather vane creaks and spins',
    when: 'On the high roof, when the drone pushes the weather vane round: a creak as you push, a tick each half turn.',
    src: 'src/rooftops-high.js:58', secs: 2.5,
    trigger: async sb => {
      for (let i = 0; i < 4; i++) sb.k.synth.noise(0.12, { vol: 0.05, lp: 2200, at: i * 0.3 });
      for (let i = 0; i < 8; i++) sb.k.synth.note(1900, 0.05, { type: 'square', vol: 0.012, at: 0.1 + i * 0.22 });
    },
    note: 'Replayed from the source lines 58 and 62 (the creak every 0.3 s while pushed, the tick each half turn).',
  },
  {
    id: 'roofvane-spun', group: 'Outdoors', title: 'Weather vane spun three times',
    when: 'On the high roof, when the vane has gone three times round.',
    src: 'src/rooftops-high.js:65', secs: 2.5,
    trigger: async sb => { sb.k.synth.chime([523, 784, 1047]); },
    note: 'Replayed from the source line (it sounds inside update()).',
  },
  {
    id: 'roofscope-sighted', group: 'Outdoors', title: 'Telescope: a place found',
    when: 'At the rooftop telescope, when you bring one of the five named places into view.',
    src: 'src/rooftops-high.js:142', secs: 1.5,
    trigger: async sb => { sb.k.synth.chime([659, 988], { gap: 0.1, dur: 0.6 }); },
    note: 'Replayed from the source line (it sounds inside update() while you look).',
  },
  {
    id: 'roofstars-star', group: 'Outdoors', title: 'Star touched',
    when: 'Over the roof by the bridge, as the drone flies through each star of the figure in order (the notes climb).',
    src: 'src/rooftops-high.js:197', secs: 5,
    trigger: async sb => { [0, 2, 4, 7, 9, 12, 14, 12].forEach((s, i) => sb.k.synth.note(523.25 * Math.pow(2, s / 12), 0.9, { type: 'sine', vol: 0.06, at: i * 0.55 })); },
    note: 'Replayed from the source line: the eight notes in turn, as eight stars would sound.',
  },
  {
    id: 'roofstars-figure', group: 'Outdoors', title: 'Star figure joined',
    when: 'Over the roof by the bridge, when the last star of a figure is joined.',
    src: 'src/rooftops-high.js:202', secs: 3,
    trigger: async sb => { sb.k.synth.chime([523, 659, 784, 1047, 1319], { gap: 0.11, dur: 2 }); },
    note: 'Replayed from the source line (it sounds inside update()).',
  },
  {
    id: 'roofpigeons-fly', group: 'Outdoors', title: 'Pigeons take off',
    when: 'On the roofs, when you come close to a flock of pigeons and they flap up.',
    src: 'src/rooftops-high.js:258', secs: 1,
    trigger: async sb => { for (let i = 0; i < 5; i++) sb.k.synth.noise(0.06, { vol: 0.05, lp: 1400, at: i * 0.05 }); },
    note: 'Replayed from the source line (it sounds inside update()).',
  },
  {
    id: 'roofkite-caught', group: 'Outdoors', title: 'Kite freed',
    when: 'At the sunshade, when the drone reaches the stuck kite and takes it.',
    src: 'src/rooftops-high.js:335', secs: 2.5,
    trigger: async sb => { sb.k.synth.chime([523, 784], { gap: 0.1 }); },
    note: 'Replayed from the source line (it sounds inside update()).',
  },
  // ---------------------------------------------------------------- src/rooftops-east.js
  {
    id: 'roofrink-lap', group: 'Outdoors', title: 'Lap of the roof rink',
    when: 'On the rink on the roof of Gallery 161, when you go once round the tree on the ice.',
    src: 'src/rooftops-east.js:111', secs: 3,
    trigger: async sb => { sb.k.synth.chime([523, 659, 784, 1047]); },
    note: 'Replayed from the source line (it sounds inside update() when the lap closes).',
  },
  {
    id: 'roofbees-hum', group: 'Outdoors', title: 'Beehives humming',
    when: 'In the roof garden, near the wrapped beehives: a faint hum, growing as you stop still by a hive and listen.',
    src: 'src/rooftops-east.js:173', secs: 5,
    trigger: async sb => {
      const f = sb.feat('roofbees'), t0 = performance.now();
      const id = setInterval(() => { const s = (performance.now() - t0) / 1000, want = s < 1.2 ? 0.006 : Math.min(0.035, (s - 1.2) * 0.025); f.hum[0].set(want); f.hum[1].set(want * 0.8); }, 50);
      sb.later(() => { clearInterval(id); f.hum[0].set(0); f.hum[1].set(0); });
    },
    after: async sb => { const f = sb.feat('roofbees'); f.hum[0].set(0); f.hum[1].set(0); },
    note: 'The two hum loops driven as update() drives them: faint nearby, then rising while you keep still by a hive.',
  },
  {
    id: 'roofbees-angry', group: 'Outdoors', title: 'Bees disturbed',
    when: 'In the roof garden, when you bump a beehive too hard and the bees get up.',
    src: 'src/rooftops-east.js:172', secs: 3,
    trigger: async sb => {
      const f = sb.feat('roofbees');
      const id = setInterval(() => { f.hum[0].set(0.06); f.hum[1].set(0.06 * 0.8); }, 50);
      setTimeout(() => { clearInterval(id); f.hum[0].set(0); f.hum[1].set(0); }, 3000);
      sb.later(() => { clearInterval(id); f.hum[0].set(0); f.hum[1].set(0); });
    },
    after: async sb => { const f = sb.feat('roofbees'); f.hum[0].set(0); f.hum[1].set(0); },
    note: 'The hum loops at their angry level for the three seconds the bees stay up.',
  },
  {
    id: 'roofbees-hive-heard', group: 'Outdoors', title: 'A hive listened to',
    when: 'In the roof garden, when you have kept still by a beehive long enough to hear it.',
    src: 'src/rooftops-east.js:168', secs: 1.5,
    trigger: async sb => { sb.k.synth.chime([392, 494], { gap: 0.1, dur: 0.8, vol: 0.04 }); },
    note: 'Replayed from the source line (it sounds inside update()).',
  },
  {
    id: 'roofsolar-power-on', group: 'Outdoors', title: 'Solar panels cleared: power on',
    when: 'On the Rice Building roof, when you have cleared enough snow off the solar panels and the rink lights come on.',
    src: 'src/rooftops-east.js:230', secs: 2.5,
    trigger: async sb => { sb.k.synth.chime([392, 523, 659, 784, 1047], { gap: 0.1 }); },
    note: 'Replayed from the source line (finish() would switch the rink lights on for the rest of the session).',
  },
  // ---------------------------------------------------------------- src/sledhill.js
  {
    id: 'sled-get-on', group: 'Outdoors', title: 'Into the sled',
    when: 'At the gate on top of the sled hill, when you press E to sled.',
    src: 'src/sledhill.js:226', secs: 1,
    trigger: async sb => { sb.k.synth.note(330, 0.15, { type: 'triangle', vol: 0.05 }); },
    note: 'Replayed from the source line (_on() would put the toy in the sled and send a penguin out).',
  },
  {
    id: 'sled-run-start', group: 'Outdoors', title: 'Sled run: through the gate',
    when: 'On the sled hill, when you slide through the gate and the clock starts.',
    src: 'src/sledhill.js:161', secs: 1.5,
    trigger: async sb => { sb.feat('sledding').timer.o.onStart(); },
  },
  {
    id: 'sled-run-good-time', group: 'Outdoors', title: 'Sled run: under the time',
    when: 'At the bottom of the sled hill, when you cross the line in under 14 seconds.',
    src: 'src/sledhill.js:166', secs: 3,
    trigger: async sb => { sb.k.synth.chime([523, 659, 784, 1047]); },
    note: 'Replayed from the source line (onFinish() also settles the penguin race).',
  },
  {
    id: 'sled-beat-penguin', group: 'Outdoors', title: 'Beat the penguin (Jingle Bells)',
    when: 'At the bottom of the sled hill, when you cross the line before the racing penguin.',
    src: 'src/sledhill.js:165', secs: 5.5,
    trigger: async sb => { sb.k.tune('E5 E5 E5:2 | E5 E5 E5:2 | E5 G5 C5:1.5 D5:.5 | E5:4', { bpm: 190, type: 'triangle', vol: 0.06, at: 0.3 }); },
    note: 'The k.tune call from onFinish(), as it is written.',
  },
  {
    id: 'sled-landing', group: 'Outdoors', title: 'Sled lands in the snow',
    when: 'On the sled hill, when the sled comes down hard after a jump (louder the harder it lands).',
    src: 'src/sledhill.js:293', secs: 1.5,
    trigger: async sb => {
      sb.k.synth.noise(0.18, { vol: Math.min(0.06, 0.015 + 2 * 0.007), lp: 900 });
      sb.k.synth.noise(0.18, { vol: Math.min(0.06, 0.015 + 6 * 0.007), lp: 900, at: 0.7 });
    },
    note: 'Replayed from the source line: a light landing, then a hard one.',
  },
  {
    id: 'sled-pole-hit', group: 'Outdoors', title: 'Sled clips a marker pole',
    when: 'On the sled hill, when the sled hits one of the marker poles beside the run.',
    src: 'src/sledhill.js:802', secs: 1.5,
    trigger: async sb => {
      for (const [at, loud] of [[0, 0.3], [0.6, 1]]) {
        sb.k.synth.note(150 + Math.random() * 40, 0.12, { type: 'square', vol: 0.012 + 0.02 * loud, at });
        sb.k.synth.noise(0.14, { vol: 0.02 + 0.03 * loud, lp: 2200, at });
      }
    },
    note: 'Replayed from the source line: a slow knock, then a fast one.',
  },
  {
    id: 'sled-penguin-out', group: 'Outdoors', title: 'A penguin comes out',
    when: 'At the penguin shop by the sled hill, when a penguin pops out of the door to slide (or to race you).',
    src: 'src/sledhill.js:1000', secs: 1.5,
    trigger: async sb => {
      sb.k.synth.note(300, 0.08, { type: 'triangle', vol: 0.02, at: 0.45 });
      sb.k.synth.note(880, 0.07, { type: 'square', vol: 0.012, at: 0.5 }); sb.k.synth.note(700, 0.09, { type: 'square', vol: 0.012, at: 0.58 });
    },
    note: 'Replayed from the source lines 1000 and 1141 (the door swinging open, and the penguin\'s call).',
  },
  {
    id: 'sled-penguin-door', group: 'Outdoors', title: 'Penguin shop door',
    when: 'At the penguin shop by the sled hill, as its door swings open and, later, shut.',
    src: 'src/sledhill.js:1141', secs: 1.5,
    trigger: async sb => { sb.k.synth.note(300, 0.08, { type: 'triangle', vol: 0.02 }); sb.k.synth.note(220, 0.08, { type: 'triangle', vol: 0.02, at: 0.8 }); },
    note: 'Replayed from the source line: open, then shut.',
  },
  {
    id: 'sled-penguin-squawk', group: 'Outdoors', title: 'Penguin squawks',
    when: 'Around the penguin shop, when you bump into a penguin walking about.',
    src: 'src/sledhill.js:1011', secs: 1,
    trigger: async sb => { sb.k.synth.note(930, 0.06, { type: 'square', vol: 0.014 }); sb.k.synth.note(760, 0.08, { type: 'square', vol: 0.014, at: 0.07 }); },
    note: 'Replayed from the source line.',
  },
  {
    id: 'sled-penguin-flop', group: 'Outdoors', title: 'Penguin flops on its belly',
    when: 'At the top of the sled run, when a penguin hops down onto its front to slide.',
    src: 'src/sledhill.js:1047', secs: 1,
    trigger: async sb => { sb.k.synth.noise(0.12, { vol: 0.02, lp: 700 }); },
    note: 'Replayed from the source line.',
  },
  {
    id: 'sled-penguin-lands', group: 'Outdoors', title: 'Penguin lands a jump',
    when: 'On the sled run, when a sliding penguin comes down after a jump.',
    src: 'src/sledhill.js:1104', secs: 1,
    trigger: async sb => { sb.k.synth.note(820, 0.06, { type: 'square', vol: 0.01 }); },
    note: 'Replayed from the source line.',
  },
  {
    id: 'sled-penguin-wins', group: 'Outdoors', title: 'The penguin wins',
    when: 'At the bottom of the sled hill, when the racing penguin crosses the line before you.',
    src: 'src/sledhill.js:1121', secs: 1,
    trigger: async sb => { sb.k.synth.note(988, 0.08, { type: 'square', vol: 0.016 }); sb.k.synth.note(1318, 0.12, { type: 'square', vol: 0.016, at: 0.1 }); },
    note: 'Replayed from the source line.',
  },
  // ---------------------------------------------------------------- src/icefish.js
  {
    id: 'icefish-jiggle', group: 'Outdoors', title: 'Ice fishing: jiggle the jig',
    when: 'Ice fishing on Monroe Harbor, each time you jiggle the jig to tempt a fish.',
    src: 'src/icefish.js:384', secs: 1.5,
    trigger: async sb => { for (let i = 0; i < 4; i++) sb.k.synth.note(1400 + Math.random() * 300, 0.04, { type: 'triangle', vol: 0.015, at: i * 0.3 }); },
    note: 'Replayed from the source line: four jiggles (jiggle() only sounds with the fishing screen open).',
  },
  {
    id: 'icefish-nibble', group: 'Outdoors', title: 'Ice fishing: a nibble',
    when: 'Ice fishing, when a fish noses the jig: a nibble, not yet.',
    src: 'src/icefish.js:443', secs: 1.5,
    trigger: async sb => { sb.k.synth.note(900, 0.05, { type: 'triangle', vol: 0.03 }); sb.k.synth.note(900, 0.05, { type: 'triangle', vol: 0.03, at: 0.9 }); },
    note: 'Replayed from the source line: two nibbles.',
  },
  {
    id: 'icefish-bite', group: 'Outdoors', title: 'Ice fishing: the big tug',
    when: 'Ice fishing, when a fish takes the jig with a big tug and a "!" (yank now).',
    src: 'src/icefish.js:444', secs: 1,
    trigger: async sb => { sb.k.synth.noise(0.22, { vol: 0.08, lp: 900 }); sb.k.synth.note(220, 0.18, { type: 'sine', vol: 0.06 }); },
    note: 'Replayed from the source line.',
  },
  {
    id: 'icefish-yank', group: 'Outdoors', title: 'Ice fishing: yank on nothing',
    when: 'Ice fishing, when you yank the rod and nothing is on (or only a nibble).',
    src: 'src/icefish.js:391', secs: 1,
    trigger: async sb => { sb.k.synth.noise(0.12, { vol: 0.05, lp: 1800 }); },
    note: 'Replayed from the source line.',
  },
  {
    id: 'icefish-hooked', group: 'Outdoors', title: 'Ice fishing: hooked',
    when: 'Ice fishing, when you yank on the big tug and the fish is hooked.',
    src: 'src/icefish.js:394', secs: 1.5,
    trigger: async sb => { sb.k.synth.noise(0.12, { vol: 0.05, lp: 1800 }); sb.k.synth.chime([523, 784], { gap: 0.06, dur: 0.3, vol: 0.04 }); },
    note: 'Replayed from the source lines 391 and 394 (the yank and the hook together).',
  },
  {
    id: 'icefish-landed', group: 'Outdoors', title: 'Ice fishing: fish landed',
    when: 'Ice fishing, when the fish comes up through the hole onto the ice.',
    src: 'src/icefish.js:511', secs: 2,
    trigger: async sb => { sb.k.synth.noise(0.25, { vol: 0.06, lp: 2600 }); sb.k.synth.chime([660, 880, 1046], { gap: 0.08, dur: 0.6 }); },
    note: 'Replayed from the source line (_land() also pays chips).',
  },
  // ---------------------------------------------------------------- src/harbour.js
  {
    id: 'harbour-light-horn', group: 'Outdoors', title: 'Harbour light foghorn',
    when: 'At the harbour light, when you get there over the floes: it flashes and sounds its horn twice.',
    src: 'src/harbour.js:378', secs: 6,
    trigger: async sb => { const f = sb.feat('harbourlight'); f._horn(sb.k, 0); f._horn(sb.k, 3.2); },
    note: 'The two horns _arrive() sounds, without the secret and the callout.',
  },
  {
    id: 'harbour-splash', group: 'Outdoors', title: 'Into the harbour: splash',
    when: 'On Monroe Harbor, when you drive off the ice into the open water ("Brr! Too cold!").',
    src: 'src/harbour.js:389', secs: 1,
    trigger: async sb => { sb.feat('harbourlight')._splashSound(sb.k); },
  },
  {
    id: 'harbour-ice-sings', group: 'Outdoors', title: 'The ice sings',
    when: 'Near the broken edge of the harbour ice, now and then: the long falling "pew" of lake ice settling.',
    src: 'src/harbour.js:395', secs: 1.2,
    trigger: async sb => { sb.feat('harbourlight')._sing(sb.k); },
  },
  // ---------------------------------------------------------------- src/railway.js
  {
    id: 'railway-train-passes', group: 'Outdoors', title: 'A train goes through',
    when: 'Up beside the railway cutting, as a Metra train comes out of the tunnel and runs through: horn, bell, wheels and rumble.',
    src: 'src/railway.js#update(dt, G, sound, secrets)', secs: 18,
    setup: async sb => {
      const T = sb.G.museum.trains, C = T.C, s = C.open[C.open.length - 1];
      const L = { x: (C.x0 + C.x1) / 2, y: C.y + 6, z: (s.z0 + s.z1) / 2 };
      // Heard from a fixed spot on the edge of the last open stretch, not from the toy parked indoors.
      sb.patch(T, '_vol', function (G, t) {
        const tz = t.head - t.dir * t.len, z = Math.max(Math.min(t.head, tz), Math.min(Math.max(t.head, tz), L.z));
        const d = Math.hypot(L.x - t.x, L.z - z, L.y - (C.y + 2)); const k = Math.max(0, 1 - d / 95); return k * k;
      });
      for (const t of T.list) { if (t.on) { t.on = false; t.g.visible = false; t.ob.z0 = t.ob.z1 = 1e6; } t.wait = 1e9; }
    },
    trigger: async sb => {
      const T = sb.G.museum.trains, C = T.C, i = T.list.findIndex(t => t.dir < 0), t = T.list[i];
      T.depart(i); t.head = C.open[C.open.length - 1].z1 + 25; t.v = 9;
    },
    after: async sb => {
      const T = sb.G.museum.trains;
      T.list.forEach((t, i) => { if (t.on) { t.on = false; t.g.visible = false; t.ob.z0 = t.ob.z1 = 1e6; } t.wait = 15 + i * 20; });
      if (T.rumble) T.rumble.gain.setTargetAtTime(0, sb.now(), 0.15);
    },
    note: 'The northbound Metra sent off 25 m inside the tunnel; the game\'s own update() makes every sound. Loudness is worked out from a spot beside the cutting instead of from the parked toy.',
  },
  {
    id: 'railway-horn', group: 'Outdoors', title: 'Train horn',
    when: 'Beside the railway cutting, as a train\'s nose first comes out of the tunnel into the open.',
    src: 'src/railway.js:379', secs: 1.5,
    trigger: async sb => { sb.G.museum.trains._horn(sb.S, 1, 1.1); },
    note: 'At full loudness, as from right beside the track.',
  },
  {
    id: 'railway-honk-blocked', group: 'Outdoors', title: 'Train honks at the toy',
    when: 'Down on the tracks, when your toy stands in front of a train and it stops and honks every few seconds.',
    src: 'src/railway.js:348', secs: 4,
    trigger: async sb => { const T = sb.G.museum.trains; T._horn(sb.S, 1, 0.9); setTimeout(() => T._horn(sb.S, 1, 0.9), 2600); },
    note: 'Two honks, 2.6 s apart, as update() sounds them while blocked.',
  },
  {
    id: 'railway-bell', group: 'Outdoors', title: 'Train bell',
    when: 'Beside the railway cutting, the bell that rings all the while a train is out in the open (the Metra higher, the South Shore lower).',
    src: 'src/railway.js:362', secs: 4,
    trigger: async sb => {
      const t0 = sb.now();
      for (let i = 0; i < 4; i++) sb.S.bell(1568, t0 + i * 0.42, 0.035, 0.5, 0.5);
      for (let i = 0; i < 4; i++) sb.S.bell(1319, t0 + 2 + i * 0.42, 0.035, 0.5, 0.5);
    },
    note: 'At full loudness: four strokes of the Metra\'s bell, then four of the South Shore\'s.',
  },
  {
    id: 'railway-wheels', group: 'Outdoors', title: 'Train wheels on the rail joints',
    when: 'Beside the railway cutting, the clack-clack of a moving train\'s wheels.',
    src: 'src/railway.js:363', secs: 4,
    trigger: async sb => { const gap = 19.5 / 10 / 2; for (let i = 0; i < 4; i++) { sb.S.tick(0.07, 120, 0.05, i * gap); sb.S.tick(0.06, 105, 0.05, i * gap + 0.11); } },
    note: 'Replayed from the source line at full loudness, at 10 m/s.',
  },
  {
    id: 'railway-rumble', group: 'Outdoors', title: 'Train rumble',
    when: 'Near the railway cutting while a train is running: the low rumble, loudest close to it.',
    src: 'src/railway.js:386', secs: 5,
    trigger: async sb => {
      const T = sb.G.museum.trains, orig = sb.patch(T, '_rumble', () => {}), t0 = performance.now();
      const id = setInterval(() => { const s = (performance.now() - t0) / 1000; orig.call(T, sb.S, s < 4 ? 0.7 * Math.min(1, s / 1.5) : 0); }, 50);
      sb.later(() => { clearInterval(id); orig.call(T, sb.S, 0); });
    },
    note: 'The rumble loop driven by itself at a close train\'s level for four seconds (update() would otherwise hold it at the parked toy\'s level).',
  },
  {
    id: 'railway-shoved', group: 'Outdoors', title: 'Shoved aside by a train or a car',
    when: 'On the tracks or in the street, when a moving train, car or bus pushes your toy out of its way.',
    src: 'src/railway.js:344', secs: 1,
    trigger: async sb => { sb.S.bump(0.7); },
    note: 'traffic.js:427 makes the same sound (sound.bump(0.7)) when a car shoves the toy.',
  },
  // ---------------------------------------------------------------- src/traffic.js
  {
    id: 'traffic-car-horns', group: 'Outdoors', title: 'Car horns',
    when: 'In the street, when your toy has held up a car for a few seconds and it honks (each kind of car has its own horn).',
    src: 'src/traffic.js:528', secs: 5,
    trigger: async sb => {
      const T = sb.G.traffic, horns = [[440, 554], [494, 622], [392, 494], [349, 440], [466, 587]];
      horns.forEach((horn, i) => setTimeout(() => T._horn(sb.S, 0.9, { horn }), i * 1000));
    },
    note: 'Saloon, hatchback, SUV, pickup and taxi in turn, as loud as from just in front of the car. Each honks once or twice, at random, as in the game.',
  },
  {
    id: 'traffic-bus-horn', group: 'Outdoors', title: 'Night bus horn',
    when: 'On Michigan Avenue, when your toy holds up the night bus and it sounds its horn.',
    src: 'src/traffic.js:528', secs: 1.5,
    trigger: async sb => { sb.G.traffic._horn(sb.S, 0.9, { horn: [277, 330], bus: true }); },
    note: 'As loud as from just in front of the bus.',
  },
  {
    id: 'traffic-tyres', group: 'Outdoors', title: 'Tyres on the wet road',
    when: 'Out in the streets: the soft hiss of the nearest moving car or bus, louder as it passes close.',
    src: 'src/traffic.js:539', secs: 6,
    trigger: async sb => {
      const T = sb.G.traffic, orig = sb.patch(T, '_hush', () => {}), t0 = performance.now();
      // a car going by: up as it comes, full as it passes, down as it goes
      const id = setInterval(() => { const s = (performance.now() - t0) / 1000, k = s < 5 ? Math.max(0, 1 - Math.abs(s - 2.5) / 2.5) : 0; orig.call(T, sb.S, k * k); }, 50);
      sb.later(() => { clearInterval(id); orig.call(T, sb.S, 0); });
    },
    note: 'The hiss loop driven by itself as one car comes and goes past (update() would otherwise hold it at the parked toy\'s level).',
  },
  // ---------------------------------------------------------------- src/bridgeplay.js
  {
    id: 'bridge-loop-round', group: 'Outdoors', title: 'Round a loop on the bridge track',
    when: 'On the toy track down the Nichols Bridgeway, each time the car goes right round a loop (higher for the second in a row).',
    src: 'src/bridgeplay.js:236', secs: 2.5,
    trigger: async sb => { sb.k.synth.chime([523 * (1 + 1 * 0.25)], { dur: 0.5 }); setTimeout(() => sb.k.synth.chime([523 * (1 + 2 * 0.25)], { dur: 0.5 }), 900); },
    note: 'Replayed from the source line: the first loop, then the second straight after it.',
  },
  {
    id: 'bridge-triple-loop', group: 'Outdoors', title: 'Triple loop',
    when: 'On the bridge track, when the car takes all three loops one after another.',
    src: 'src/bridgeplay.js:235', secs: 2.5,
    trigger: async sb => { sb.k.synth.chime([659, 880, 1175, 1568]); },
    note: 'Replayed from the source line (it sounds inside update()).',
  },
  {
    id: 'bridge-jump-landed', group: 'Outdoors', title: 'Off the Bridgeway, landed',
    when: 'At the end of the bridge track, when the car flies off the launch ramp and lands clean on the ramp in the park below.',
    src: 'src/bridgeplay.js:246', secs: 2.5,
    trigger: async sb => { sb.k.synth.chime([523, 784, 1047]); },
    note: 'Replayed from the source line (it sounds inside update()).',
  },
  {
    id: 'bridge-ring', group: 'Outdoors', title: 'Through a ring',
    when: 'Over the Nichols Bridgeway, each time the drone goes through one of the five rings (a step higher for each).',
    src: 'src/bridgeplay.js:256', secs: 3,
    trigger: async sb => { for (let n = 1; n <= 4; n++) setTimeout(() => sb.k.synth.chime([587 * (1 + n * 0.2)], { dur: 0.7 }), (n - 1) * 600); },
    note: 'Replayed from the source line: rings one to four in turn.',
  },
  {
    id: 'bridge-all-rings', group: 'Outdoors', title: 'All five rings',
    when: 'Over the Nichols Bridgeway, when the drone goes through the fifth ring.',
    src: 'src/bridgeplay.js:257', secs: 2.5,
    trigger: async sb => { sb.k.synth.chime([587 * (1 + 5 * 0.2)], { dur: 0.7 }); sb.k.synth.chime([587, 740, 880, 1175]); },
    note: 'Replayed from the source lines 256 and 257 (the fifth ring\'s note and the four-note chime together).',
  },
  // ---------------------------------------------------------------- src/butlerfield.js
  {
    id: 'butler-snowman-down', group: 'Outdoors', title: 'Snowman knocked over',
    when: 'In the jump park on Butler Field, when you knock over one of the six snowmen.',
    src: 'src/butlerfield.js:164', secs: 1,
    trigger: async sb => { sb.k.synth.noise(0.3, { vol: 0.06, lp: 900 }); },
    note: 'Replayed from the source line (_snowmanDown() also counts it).',
  },
  {
    id: 'butler-home-run', group: 'Outdoors', title: 'Home run round the bases',
    when: 'On a snowy softball diamond on Butler Field, when you come home after first, second and third in under forty seconds.',
    src: 'src/butlerfield.js:231', secs: 2,
    trigger: async sb => { sb.k.synth.chime([392, 523, 659, 784], { gap: 0.1, dur: 0.6, vol: 0.05 }); },
    note: 'Replayed from the source line (it sounds inside update()).',
  },
  // ---------------------------------------------------------------- src/ballpark.js (the Home Run Derby: a game of its own)
  {
    id: 'derby-step-up', group: 'Games', title: 'Derby: step up to the plate',
    when: 'At the ballpark on Butler Field, when you pull into the batter\'s box and start the Home Run Derby.',
    src: 'src/ballpark.js:896', secs: 1.5,
    trigger: async sb => { sb.k.synth.chime([392, 523, 659], { gap: 0.12, dur: 0.5, vol: 0.04 }); },
    note: 'Replayed from the source line (_start() would take over the toy).',
  },
  {
    id: 'derby-windup-pitch', group: 'Games', title: 'Derby: the wind-up and the pitch',
    when: 'In the Home Run Derby, as the snowman on the mound winds up (a rising whirr) and lets the ball go.',
    src: 'src/ballpark.js:1038', secs: 2,
    trigger: async sb => {
      const wind = 1.15;                      // a straight pitch
      for (let i = 0; i < 6; i++) sb.k.synth.note(180 + i * 70, 0.16, { type: 'triangle', vol: 0.018, at: wind * (0.25 + 0.13 * i) });
      sb.k.synth.noise(0.22, { vol: 0.045, lp: 1500, at: wind });
    },
    note: 'Replayed from the source lines 1038 and 1049, for a straight pitch (the release comes as the wind-up ends).',
  },
  {
    id: 'derby-swing', group: 'Games', title: 'Derby: swing',
    when: 'In the Home Run Derby, when you swing the bat (Space or SWING).',
    src: 'src/ballpark.js:1124', secs: 1,
    trigger: async sb => { sb.k.synth.noise(0.16, { vol: 0.05, lp: 1300 }); },
    note: 'Replayed from the source line.',
  },
  {
    id: 'derby-crack', group: 'Games', title: 'Derby: bat meets ball',
    when: 'In the Home Run Derby, the crack as the bat hits the ball (loudest on the button).',
    src: 'src/ballpark.js:1161', secs: 1.5,
    trigger: async sb => {
      for (const [at, q] of [[0, 1], [0.8, 0.45]]) setTimeout(() => {
        sb.k.synth.noise(0.06, { vol: 0.25 * q, lp: 9000 }); sb.k.synth.note(2500, 0.04, { type: 'square', vol: 0.04 * q }); sb.k.synth.note(760, 0.12, { type: 'triangle', vol: 0.08 * q });
      }, at * 1000);
    },
    note: 'Replayed from the source line: a clean hit, then a mistimed one.',
  },
  {
    id: 'derby-strike', group: 'Games', title: 'Derby: strike',
    when: 'In the Home Run Derby, when a pitch goes by untouched into the backstop: a puff of snow and a low buzz.',
    src: 'src/ballpark.js:1062', secs: 1,
    trigger: async sb => { const f = sb.feat('ballpark'); f._burst(f.P.hx, 1, f.P.hz, 0.6); sb.k.synth.note(110, 0.3, { type: 'sawtooth', vol: 0.02 }); },
    note: 'The snowball burst from _burst(), with the buzz replayed from the source line.',
  },
  {
    id: 'derby-ball-bursts', group: 'Games', title: 'Derby: the ball comes down',
    when: 'In the Home Run Derby, when the hit snowball bursts where it lands: off the wall, foul, in the field, off the scoreboard (the bigger the louder).',
    src: 'src/ballpark.js:676', secs: 2.5,
    trigger: async sb => { const f = sb.feat('ballpark'); [0.8, 1, 1.4].forEach((big, i) => setTimeout(() => f._burst(f.P.hx, 1, f.P.hz, big), i * 800)); },
    note: 'Three bursts: a foul, one in the field, one off the scoreboard.',
  },
  {
    id: 'derby-organ', group: 'Games', title: 'Derby: home run organ',
    when: 'In the Home Run Derby, when the ball clears the wall: da-da-da-DAH, da-DAAH on the ballpark organ.',
    src: 'src/ballpark.js:1211', secs: 2.5,
    trigger: async sb => { [[392, 0], [523, 0.14], [659, 0.28], [784, 0.42], [659, 0.7], [784, 0.84]].forEach(([f, at], i) => sb.k.synth.note(f, i === 5 ? 0.9 : i === 3 ? 0.3 : 0.14, { type: 'square', vol: 0.022, at: at + 0.15 })); },
    note: 'Replayed from the source line (_homer() also scores it).',
  },
  {
    id: 'derby-firework', group: 'Games', title: 'Derby: a firework',
    when: 'At the ballpark after a home run, as each of the four fireworks bursts over the wall.',
    src: 'src/ballpark.js:974', secs: 2,
    trigger: async sb => { const f = sb.feat('ballpark'); f._firework(f.P.hx + 60, 18, f.P.hz + 60, 0); },
  },
  {
    id: 'derby-crowd-murmur', group: 'Games', title: 'Derby: the crowd waits',
    when: 'All through the Home Run Derby: the low murmur of the snowman fans.',
    src: 'src/ballpark.js:949', secs: 5,
    trigger: async sb => {
      const f = sb.feat('ballpark'), id = setInterval(() => f.crowd.set(0.012, 0.5), 50);
      sb.later(() => { clearInterval(id); f.crowd.set(0); });
    },
    after: async sb => { sb.feat('ballpark').crowd.set(0); },
    note: 'The crowd loop held at its level while you bat.',
  },
  {
    id: 'derby-crowd-cheer', group: 'Games', title: 'Derby: the crowd cheers',
    when: 'At the ballpark after a home run: the snowman fans roar and throw their hats, dying away over a few seconds.',
    src: 'src/ballpark.js:1207', secs: 5,
    setup: async sb => { sb.patch(sb.feat('ballpark'), 'active', () => true); },
    trigger: async sb => { const f = sb.feat('ballpark'); f.cheer = 1; f.hatsOff(); },
    after: async sb => { const f = sb.feat('ballpark'); f.cheer = 0; f.crowd.set(0); },
    note: 'The cheer set as _homer() sets it; the game\'s update() turns the crowd loop up and lets it die away.',
  },
  {
    id: 'derby-home-run', group: 'Games', title: 'Derby: a home run, all together',
    when: 'At the ballpark, the moment a hit clears the wall: the organ, the crowd, and four fireworks over the wall.',
    src: 'src/ballpark.js:1204', secs: 6,
    setup: async sb => { sb.patch(sb.feat('ballpark'), 'active', () => true); },
    trigger: async sb => {
      const f = sb.feat('ballpark'), th = Math.PI / 4;
      f.cheer = 1; f.hatsOff();
      [[392, 0], [523, 0.14], [659, 0.28], [784, 0.42], [659, 0.7], [784, 0.84]].forEach(([q, at], i) => sb.k.synth.note(q, i === 5 ? 0.9 : i === 3 ? 0.3 : 0.14, { type: 'square', vol: 0.022, at: at + 0.15 }));
      const r = f.wallR(th) + 2;
      for (let i = 0; i < 4; i++) { const a = th + (i % 2 ? 1 : -1) * (0.08 + 0.05 * i); f.fw.push([f.t + 0.3 + i * 0.38, f.P.hx + r * Math.cos(a), 15 + i * 2.2, f.P.hz + r * Math.sin(a), Math.floor(Math.random() * 6)]); }
    },
    after: async sb => { const f = sb.feat('ballpark'); f.cheer = 0; f.fw.length = 0; f.crowd.set(0); },
    note: '_homer()\'s sounds without its scoring: the organ replayed, the cheer and the fireworks queued as it queues them, played by the game\'s update().',
  },
  // ---------------------------------------------------------------- src/parkplay.js
  {
    id: 'park-target-down', group: 'Outdoors', title: 'Snowball target knocked down',
    when: 'On Butler Field, when you knock over one of the six snowball targets.',
    src: 'src/parkplay.js:38', secs: 1,
    trigger: async sb => { sb.k.synth.note(150 + Math.random() * 40, 0.25, { type: 'square', vol: 0.05 }); sb.k.synth.noise(0.2, { vol: 0.05, lp: 1200 }); },
    note: 'Replayed from the source line (hit() also counts the targets and pays chips).',
  },
  {
    id: 'park-targets-all-down', group: 'Outdoors', title: 'All six targets down',
    when: 'On Butler Field, when the last of the six snowball targets goes over.',
    src: 'src/parkplay.js:40', secs: 2.5,
    trigger: async sb => { sb.k.synth.note(150 + Math.random() * 40, 0.25, { type: 'square', vol: 0.05 }); sb.k.synth.noise(0.2, { vol: 0.05, lp: 1200 }); sb.k.synth.chime([523, 659, 784]); },
    note: 'Replayed from the source lines 38 and 40 (the last knock and the chime together).',
  },
  {
    id: 'park-skater-lap', group: 'Outdoors', title: 'A lap with the skater',
    when: 'At the park rink, when you have kept up with the skater for a whole lap.',
    src: 'src/parkplay.js:90', secs: 2.5,
    trigger: async sb => { sb.k.synth.chime([392, 523, 659, 784]); },
    note: 'Replayed from the source line (it sounds inside update()).',
  },
  // ---------------------------------------------------------------- src/warminghut.js
  {
    id: 'hut-stove-fire', group: 'Outdoors', title: 'The stove fire in the warming hut',
    when: 'In and around the warming hut on Butler Field: the low roar of the pot-bellied stove and its crackles, loudest beside it.',
    src: 'src/warminghut.js:744', secs: 6,
    trigger: async sb => {
      const f = sb.feat('warminghut'), k = sb.k, near = 1; let crack = 0, last = performance.now();
      const id = setInterval(() => {
        const now = performance.now(), dt = (now - last) / 1000; last = now;
        f.roar.set(0.028 * near);
        if ((crack -= dt) < 0) { crack = 0.06 + Math.random() ** 2 * 0.7; const big = Math.random() < 0.12; k.synth.noise(big ? 0.09 : 0.015 + Math.random() * 0.04, { vol: (big ? 0.07 : 0.03 + Math.random() * 0.03) * near, lp: big ? 1800 : 2600 + Math.random() * 3800 }); }
      }, 16);
      sb.later(() => { clearInterval(id); f.roar.set(0); });
    },
    after: async sb => { sb.feat('warminghut').roar.set(0); },
    note: 'The roar loop and the crackles driven as update() drives them with the toy right by the stove (the crackle code copied from the source line).',
  },
  {
    id: 'hut-warm-up', group: 'Outdoors', title: 'Warming up by the stove',
    when: 'In the warming hut, when you stop in front of the stove for a moment and the snow hisses off ("Toasty").',
    src: 'src/warminghut.js:751', secs: 2,
    trigger: async sb => { sb.k.synth.noise(1.6, { vol: 0.025, lp: 5000 }); },
    note: 'Replayed from the source line, without the fire around it.',
  },
  {
    id: 'hut-cat-purr', group: 'Outdoors', title: 'The hut cat purrs',
    when: 'In the warming hut, when you come up to the cat asleep by the stove.',
    src: 'src/warminghut.js:760', secs: 3,
    trigger: async sb => { for (let i = 0; i < 8; i++) sb.k.synth.noise(0.24, { vol: 0.05, lp: 240, at: i * 0.3 }); },
    note: 'Replayed from the source line.',
  },
  // ---------------------------------------------------------------- src/wingplay.js
  {
    id: 'bridgeway-sprint-start', group: 'Outdoors', title: 'Bridgeway sprint: off you go',
    when: 'At the foot of the Nichols Bridgeway, when you set off and the sprint clock starts.',
    src: 'src/wingplay.js:72', secs: 1.5,
    trigger: async sb => { sb.feat('bridgeway').timer.o.onStart(); },
  },
  {
    id: 'bridgeway-sprint-finish', group: 'Outdoors', title: 'Bridgeway sprint: in time',
    when: 'At the top of the Nichols Bridgeway, when you get there in under 25 seconds.',
    src: 'src/wingplay.js:73', secs: 3,
    setup: async sb => { sb.patch(sb.k, 'find', () => false); },
    trigger: async sb => { sb.feat('bridgeway').timer.o.onFinish(1); },
  },
  {
    id: 'lift-ride', group: 'Outdoors', title: 'The glass lift: a ride',
    when: 'At the glass lift up the face of the Modern Wing\'s west pavilion, when you call it or ride it: a chime, the doors, the ride, the ding-dong, the doors.',
    src: 'src/wingplay.js:250', secs: 14,
    trigger: async sb => { const f = sb.feat('goingup'), here = f._stopAt(); f.go(sb.k, here === f.stops.length - 1 ? 0 : here + 1); },
    note: 'go() is called as the RIDE/CALL button calls it; the game\'s update() then shuts the doors, moves the car, dings and opens the doors.',
  },
  {
    id: 'lift-call', group: 'Outdoors', title: 'Glass lift: called',
    when: 'At the glass lift, when you press E to call it or ride it.',
    src: 'src/wingplay.js:250', secs: 1.5,
    trigger: async sb => { sb.k.synth.chime([523, 659], { gap: 0.12, dur: 0.7, vol: 0.05 }); },
    note: 'Replayed from the source line (just the chime, without the ride).',
  },
  {
    id: 'lift-doors', group: 'Outdoors', title: 'Glass lift doors',
    when: 'At the glass lift, the soft rumble as its doors start to open or to shut.',
    src: 'src/wingplay.js:269', secs: 1,
    trigger: async sb => { sb.k.synth.noise(0.3, { vol: 0.012, lp: 900 }); },
    note: 'Replayed from the source line.',
  },
  {
    id: 'lift-ding-dong', group: 'Outdoors', title: 'Glass lift: ding-dong',
    when: 'At the glass lift, as the car arrives at a stop.',
    src: 'src/wingplay.js:278', secs: 2,
    trigger: async sb => { sb.k.synth.chime([1319, 1047], { gap: 0.3, dur: 1.1, vol: 0.05 }); },
    note: 'Replayed from the source line.',
  },
  {
    id: 'blades-ring', group: 'Outdoors', title: 'Through a ring under the sunshade',
    when: 'Under the Modern Wing\'s sunshade, each time the drone threads one of the three rings (a step higher for each).',
    src: 'src/wingplay.js:312', secs: 2.5,
    trigger: async sb => { for (let n = 1; n <= 2; n++) setTimeout(() => sb.k.synth.chime([523 * (1 + n * 0.25)], { dur: 0.8 }), (n - 1) * 700); },
    note: 'Replayed from the source line: the first ring, then the second.',
  },
  {
    id: 'blades-all-three', group: 'Outdoors', title: 'Threading the blades',
    when: 'Under the Modern Wing\'s sunshade, when the drone goes through the third ring.',
    src: 'src/wingplay.js:313', secs: 3,
    trigger: async sb => { sb.k.synth.chime([523 * (1 + 3 * 0.25)], { dur: 0.8 }); sb.k.synth.chime([523, 659, 784, 1047]); },
    note: 'Replayed from the source lines 312 and 313 (the third ring\'s note and the chime together).',
  },
  {
    id: 'restoration-wipe', group: 'Outdoors', title: 'Wiping off the old varnish',
    when: 'In the Ryan Learning Center, as you rub the old varnish off the painting on the easel.',
    src: 'src/wingplay.js:410', secs: 2.5,
    trigger: async sb => { for (let i = 0; i < 6; i++) sb.k.synth.noise(0.08, { vol: 0.02, lp: 3000, at: i * 0.18 + Math.random() * 0.12 }); },
    note: 'Replayed from the source line: a few rubs (the game makes the sound on about one stroke in five).',
  },
  {
    id: 'restoration-clean', group: 'Outdoors', title: 'The painting is clean',
    when: 'In the Ryan Learning Center, when the last of the varnish comes off the painting on the easel.',
    src: 'src/wingplay.js:420', secs: 3,
    trigger: async sb => { sb.k.synth.chime([523, 659, 784, 1047]); },
    note: 'Replayed from the source line.',
  },
];
