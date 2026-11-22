// Where the races are: each spot's course, its look and its rivals. Plain data and a little geometry, no three.js, so
// that tools/check_layout.mjs can lay and check every course without a browser (src/racespots.js puts them in the world).
//
// way: the course's waypoints (course.js), the first the start line, gone through towards the second. arch: its width.
// park: where each rival waits, [across, back] from the middle of the start line in the arch's own terms (+across is to
// the right going through it; +back is behind the line), facing through. Every one is off the line and out of the way.
export const SPOTS = [
  {
    id: 'griffin', place: 'Griffin Court', fy: 0, laps: 4, arch: 3.4,
    area: { x0: 164, x1: 180, z0: 48, z1: 92 },
    way: [[169.4, 66], [169.4, 80, 'via'], [172, 87.6], [174.4, 80, 'via'], [174.4, 64], [174.2, 57, 'via'], [171.8, 54.4], [169.5, 57, 'via']],
    park: [[2.5, 0.9], [2.5, 2.1]],
    theme: { style: 'neon', line: 0xff2bd6, mark: 0x29f2ff, cone: 0xff2bd6, next: 0x29f2ff, start: 0xffffff, post: 0x29f2ff, bar: 0xff2bd6, text: '#0b0b18', glow: 1.9 },
    rivals: [
      { name: 'Volt', body: 'kart', colour: 0xff2bd6, skill: 0.9, lane: -0.25, wander: 0.2, pace: 0.33, look: 1.15, hello: 'Volt, under the coloured roof. Fast, and won’t shut up about it.', win: 'Volt flickers. Sulking.', lose: 'Volt does a lap of honour.' },
      { name: 'Glowstick', body: 'racer', colour: 0x29f2ff, skill: 0.84, lane: 0.3, wander: 0.25, pace: 0.27, look: 1.05 },
    ],
  },
  {
    id: 'regenstein', place: 'Regenstein Hall', fy: 0, laps: 3, arch: 3.2,
    area: { x0: 70, x1: 92, z0: 172, z1: 224 },
    way: [[75.2, 189], [75.2, 210, 'via'], [79.5, 219.5], [84, 210, 'via'], [83.6, 195], [80, 177.6], [75.6, 181, 'via']],
    park: [[-2.5, 1.2], [2.6, 1.2]],
    theme: { style: 'gilt', line: 0xe8b84a, mark: 0x9a1838, cone: 0xd8a838, next: 0xffe08a, start: 0xfff4d8, post: 0xd8a838, bar: 0x8a1030, text: '#ffe7a6', glow: 1.5 },
    rivals: [
      { name: 'The Duchess', body: 'super', colour: 0x6a0f24, skill: 0.88, lane: 0.25, wander: 0.15, pace: 0.2, look: 1.2, hello: 'The Duchess, in velvet, beneath the chandeliers. She has never once been overtaken.', win: 'The Duchess pretends she let you.', lose: 'The Duchess allows herself a small smile.' },
      { name: 'Sir Reginald', body: 'van', colour: 0x1b2a5a, skill: 0.82, lane: -0.3, wander: 0.18, pace: 0.24, look: 1.0 },
    ],
  },
  {
    id: 'cafe', place: 'The Café', fy: -4.6, laps: 3, arch: 3.0,
    area: { x0: 212, x1: 256, z0: 96, z1: 128 },
    way: [[235, 118.2], [225, 118.2], [218.6, 112.5, 'via'], [225.5, 108.8], [244, 107], [250.5, 112.5, 'via'], [244, 118.2]],
    park: [[-2.4, 1.3], [2.4, 1.3]],
    theme: { style: 'pixel', line: 0x39ff14, mark: 0xffe600, cone: 0xff3df0, next: 0xffe600, start: 0xffffff, post: 0xff3df0, bar: 0x39ff14, text: '#120018', glow: 1.7 },
    rivals: [
      { name: 'Pixel', body: 'buggy', colour: 0x39ff14, skill: 0.86, lane: -0.25, wander: 0.22, pace: 0.36, look: 1.1, hello: 'Pixel, among the café tables. Thinks in eight bits. Insert coin.', win: 'Pixel: GAME OVER. Continue?', lose: 'Pixel enters three letters on the high score.' },
      { name: 'Hi-Score', body: 'rally', colour: 0xff3df0, skill: 0.9, lane: 0.25, wander: 0.2, pace: 0.3, look: 1.15 },
    ],
  },
  {
    id: 'ballpark', place: 'The ballpark', fy: 0, laps: 2, arch: 3.6,
    area: { x0: 398, x1: 462, z0: 142, z1: 206 },
    way: [[418, 149.6], [437, 151, 'via'], [444, 154], [456.2, 171.2, 'via'], [450.6, 194.4], [427.3, 200, 'via'], [409.4, 188], [405.5, 168, 'via'], [409.5, 154.5, 'via']],
    park: [[2.8, 1.0], [2.8, 2.4]],
    theme: { style: 'candy', line: 0xe8202a, mark: 0xffffff, cone: 0xe8202a, next: 0x58ff9a, start: 0xffffff, post: 0xffffff, bar: 0xe8202a, text: '#ffffff', glow: 1.25, stripes: true },
    rivals: [
      { name: 'Peppermint', body: 'xmas', colour: 0xd8201c, skill: 0.88, lane: 0.3, wander: 0.25, pace: 0.3, look: 1.2, hello: 'Peppermint, on the warning track. All sugar, no brakes.', win: 'Peppermint takes it well. Mostly.', lose: 'Peppermint toots its little horn.' },
      { name: 'Sugarplum', body: 'truck', colour: 0x7a2ad0, skill: 0.84, lane: -0.3, wander: 0.2, pace: 0.25, look: 1.05 },
    ],
  },
  {
    id: 'harbour', place: 'The lakefront', fy: 0, laps: 2, arch: 3.6,
    area: { x0: 512, x1: 530, z0: 62, z1: 176 }, avoid: [{ x0: 470, x1: 515, z0: 0, z1: 250 }],          // (never out onto Lake Shore Drive)
    way: [[517.6, 120], [517.6, 150, 'via'], [518, 165], [521, 169.5, 'via'], [524.4, 165], [524.4, 120], [524.4, 85, 'via'], [524, 75], [521, 70.5, 'via'], [518, 75], [517.6, 90, 'via']],
    park: [[2.8, 1.0], [2.8, 2.4]],
    theme: { style: 'frost', line: 0x8fe6ff, mark: 0xffffff, cone: 0xbfefff, next: 0xffffff, start: 0xffffff, post: 0xd8f6ff, bar: 0x3aa8e8, text: '#e9fbff', glow: 1.3 },
    rivals: [
      { name: 'Frostbite', body: 'rally', colour: 0x8fd8ff, skill: 0.88, lane: 0.25, wander: 0.3, pace: 0.2, look: 1.3, hello: 'Frostbite, on the promenade by the frozen harbour. Quiet, cold, and very smooth.', win: 'Frostbite nods once. Respect.', lose: 'Frostbite glides off into the dark.' },
      { name: 'Floe', body: 'truck', colour: 0xf2fbff, skill: 0.83, lane: -0.3, wander: 0.25, pace: 0.22, look: 1.15 },
    ],
  },
  {
    id: 'crop', place: 'A circle in the snow', fy: 0, laps: 3, arch: 3.4, alien: true,
    area: { x0: 406, x1: 454, z0: 54, z1: 102 },
    way: [[412.6, 78], [413.6, 70, 'via'], [418.5, 64.5, 'via'], [430, 61], [442, 66, 'via'], [447, 78], [442, 90, 'via'], [430, 95], [419, 91, 'via'], [413.6, 85, 'via']],
    park: [[2.8, 1.4]],
    boost: [430, 95],
    theme: { style: 'glyph', line: 0x2fe02a, mark: 0x9dff5a, cone: 0x3aff7a, next: 0xd4ffa8, start: 0xffffff, post: 0x2a3a30, bar: 0x6dff4a, text: '#0a1a0a', glow: 1.0 },
    rivals: [
      { name: 'Zib', body: 'alien', colour: 0x6dff4a, skill: 0.93, lane: 0, wander: 0.3, pace: 0.4, look: 1.25, hello: 'Something small and green is humming in the middle of a circle in the snow. It wants to race.', win: 'Zib hums a low note and leaves you something warm.', lose: 'Zib zips round you twice. Showing off.' },
    ],
  },
];

// The arch over a spot's start line: where its posts stand and the boxes that make them (and the bar) solid, exactly as
// they are drawn. fx, fz: through it; rx, rz: across it.
export function archOf(S) {
  const [x0, z0] = S.way[0], [x1, z1] = S.way[1], d = Math.hypot(x1 - x0, z1 - z0), fx = (x1 - x0) / d, fz = (z1 - z0) / d, rx = fz, rz = -fx, half = S.arch / 2;
  const posts = [-1, 1].map(sg => ({ x: x0 + rx * sg * half, z: z0 + rz * sg * half }));
  const solids = posts.map(p => ({ x0: p.x - 0.06, x1: p.x + 0.06, z0: p.z - 0.06, z1: p.z + 0.06, y0: S.fy, y1: S.fy + 1.5 }));
  solids.push({ x0: Math.min(posts[0].x, posts[1].x) - 0.05, x1: Math.max(posts[0].x, posts[1].x) + 0.05, z0: Math.min(posts[0].z, posts[1].z) - 0.05, z1: Math.max(posts[0].z, posts[1].z) + 0.05, y0: S.fy + 1.3, y1: S.fy + 1.5 });
  return { x: x0, z: z0, fx, fz, rx, rz, yaw: Math.atan2(fx, fz), posts, solids };
}
