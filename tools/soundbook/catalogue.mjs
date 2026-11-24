// The sound book's catalogue: every sound and piece of music the game makes, as entries record.mjs can play and record.
// The toy, the Sound class's own sounds and the painting shows are here; the rest, area by area, in entries/*.mjs.
//
// An entry:
//   { id, group, title,
//     when: 'One plain line: where and when a player hears it.',
//     src: 'src/audio.js:217' (or 'src/audio.js#bump(strength', and the line is looked up),
//     secs: how long to record from the trigger (a 1.5 s tail is added; `tail` to change it),
//     setup: async sb => {...}   optional, not recorded (move the toy, build things),
//     trigger: async sb => {...} recorded: make the sound now; null if it cannot be reached yet (say why in `note`),
//     after: async sb => {...}   optional, put things back,
//     note: 'shown on the page' }
// setup, trigger and after run in the page (Function.toString), so they use nothing from this file: only `sb`, the
// page helper record.mjs installs (see README.md).

import { entries as galleries } from './entries/galleries.mjs';
import { entries as story } from './entries/story.mjs';
import { entries as music } from './entries/music.mjs';
import { entries as outdoors } from './entries/outdoors.mjs';
import { entries as finale } from './entries/finale.mjs';
import { entries as games } from './entries/games.mjs';
import fs from 'node:fs';
import path from 'node:path';

export const GROUPS = ['Toy and driving', 'Galleries and lamps', 'Music', 'Carols and songs', 'Paintings that come alive',
  'Story and secrets', 'Outdoors', 'Finale', 'Race', 'Games', 'Recorded clips'];

const TOY = 'Toy and driving', GL = 'Galleries and lamps';

const core = [
  // ---------------------------------------------------------------- the motor (src/audio.js update)
  { id: 'motor-car-idle', group: TOY, title: 'Car motor, idle', when: 'The toy car standing still.', src: 'src/audio.js#vehicle.kind === \'car\'', secs: 4,
    trigger: sb => sb.motor({ kind: 'car', speed: 0, throttle: 0 }) },
  { id: 'motor-car-half', group: TOY, title: 'Car motor, half speed', when: 'The toy car cruising at half its top speed.', src: 'src/audio.js#vehicle.kind === \'car\'', secs: 4,
    trigger: sb => sb.motor({ kind: 'car', speed: 5.75, throttle: 0.5 }) },
  { id: 'motor-car-full', group: TOY, title: 'Car motor, flat out', when: 'The toy car at top speed, foot down.', src: 'src/audio.js#vehicle.kind === \'car\'', secs: 4,
    trigger: sb => sb.motor({ kind: 'car', speed: 11.5, throttle: 1 }) },
  { id: 'motor-car-rev', group: TOY, title: 'Car motor, pulling away', when: 'Driving off from standing to top speed and easing off again.', src: 'src/audio.js#vehicle.kind === \'car\'', secs: 6,
    trigger: async sb => { const v = { kind: 'car', speed: 0, throttle: 1 }; sb.motor(v); for (let i = 0; i < 50; i++) { v.speed = Math.min(11.5, v.speed + 0.35); await sb.wait(0.06); } v.throttle = 0; for (let i = 0; i < 40; i++) { v.speed *= 0.93; await sb.wait(0.06); } } },
  { id: 'motor-car-air', group: TOY, title: 'Car motor, in the air', when: 'Off a ramp with the throttle held: the wheels spin up.', src: 'src/audio.js#vehicle.air ? 220', secs: 3,
    trigger: sb => sb.motor({ kind: 'car', speed: 9, throttle: 1, air: true }) },
  { id: 'motor-car-slowmo', group: TOY, title: 'Car motor in slow motion', when: 'Flying off a ramp past a painting: the world slows, everything goes dull and low.', src: 'src/audio.js#setSlow(k)', secs: 5,
    trigger: async sb => { sb.motor({ kind: 'car', speed: 9, throttle: 1, air: true }); sb.S.setSlow(0.25); sb.S.swell(); await sb.wait(4); sb.S.setSlow(1); } },
  { id: 'motor-drone-landed', group: TOY, title: 'Drone, landed', when: 'The drone sitting on the floor, rotors ticking over.', src: 'src/audio.js#vehicle.landed ? 0.12', secs: 3,
    trigger: sb => sb.motor({ kind: 'drone', landed: true, thrust: 0 }) },
  { id: 'motor-drone-half', group: TOY, title: 'Drone, hovering', when: 'Flying the drone gently.', src: 'src/audio.js#vehicle.landed ? 0.12', secs: 4,
    trigger: sb => sb.motor({ kind: 'drone', landed: false, thrust: 0.5 }) },
  { id: 'motor-drone-full', group: TOY, title: 'Drone, full thrust', when: 'Climbing hard with the drone.', src: 'src/audio.js#vehicle.landed ? 0.12', secs: 4,
    trigger: sb => sb.motor({ kind: 'drone', landed: false, thrust: 1 }) },
  { id: 'motor-ufo-landed', group: TOY, title: 'Saucer, landed', when: 'The flying saucer toy (unlocked in the finale) sitting down.', src: 'src/audio.js#hum === \'ufo\'', secs: 3,
    trigger: sb => sb.motor({ kind: 'drone', spec: { hum: 'ufo' }, landed: true, thrust: 0 }) },
  { id: 'motor-ufo-half', group: TOY, title: 'Saucer, hovering', when: 'Flying the saucer gently.', src: 'src/audio.js#hum === \'ufo\'', secs: 4,
    trigger: sb => sb.motor({ kind: 'drone', spec: { hum: 'ufo' }, landed: false, thrust: 0.5 }) },
  { id: 'motor-ufo-full', group: TOY, title: 'Saucer, full thrust', when: 'The saucer climbing hard.', src: 'src/audio.js#hum === \'ufo\'', secs: 4,
    trigger: sb => sb.motor({ kind: 'drone', spec: { hum: 'ufo' }, landed: false, thrust: 1 }) },
  // ---------------------------------------------------------------- one-shots of the toy (src/audio.js, called from src/main.js)
  { id: 'toy-boing', group: TOY, title: 'Hop', when: 'Every hop of the car (the jump button).', src: 'src/audio.js#boing()', secs: 0.5, trigger: sb => sb.S.boing() },
  { id: 'toy-bump-soft', group: TOY, title: 'Bump, soft', when: 'Nudging a wall, or a soft landing.', src: 'src/audio.js#bump(strength)', secs: 0.6, trigger: sb => sb.S.bump(1.3) },
  { id: 'toy-bump-hard', group: TOY, title: 'Bump, hard', when: 'Hitting a wall at speed, or a heavy landing off a ramp.', src: 'src/audio.js#bump(strength)', secs: 0.6, trigger: sb => sb.S.bump(6) },
  { id: 'toy-bump-pushed', group: TOY, title: 'Shoved by a ball', when: 'A big ball in the galleries rolling into the toy (main.js, the balls).', src: 'src/main.js#sound.bump(2)', secs: 0.6, trigger: sb => sb.S.bump(2) },
  { id: 'toy-perfect', group: TOY, title: 'Perfect landing', when: 'Landing a jump square on all four wheels (PERFECT LANDING!). Also a trophy earned.', src: 'src/audio.js#perfect()', secs: 2.5, trigger: sb => sb.S.perfect() },
  { id: 'toy-lap', group: TOY, title: 'Trick / loop / secret', when: 'A named trick, a loop, getting on the roof, a perch, a vehicle unlocked, a secret found (the toast).', src: 'src/audio.js#lap()', secs: 1.8, trigger: sb => sb.S.lap() },
  { id: 'toy-swell', group: TOY, title: 'Time slows', when: 'Flying past a painting off a ramp: the moment slow motion begins.', src: 'src/audio.js#swell()', secs: 4.5, trigger: sb => sb.S.swell() },
  { id: 'toy-hoops', group: TOY, title: 'Hoops, one to ten', when: 'Flying through the hoops in the galleries: each a step higher up the scale (all ten here, a second apart).', src: 'src/audio.js#hoop(n)', secs: 11,
    trigger: async sb => { for (let n = 0; n < 10; n++) { sb.S.hoop(n); await sb.wait(1); } } },
  { id: 'toy-swap', group: TOY, title: 'Car to drone', when: 'Swapping between the car and the drone.', src: 'src/main.js#sound.tick(0.1, 1200, 0.08)', secs: 0.4, trigger: sb => sb.S.tick(0.1, 1200, 0.08) },
  { id: 'toy-headlights', group: TOY, title: 'Headlights switch', when: 'Turning the toy\'s headlights on or off.', src: 'src/main.js#sound.tick(0.08, 2200, 0.03)', secs: 0.3, trigger: sb => sb.S.tick(0.08, 2200, 0.03) },
  { id: 'toy-knock-cone', group: TOY, title: 'Cone knocked', when: 'Driving into a traffic cone.', src: 'src/audio.js#knock(speed, big)', secs: 0.5, trigger: sb => sb.S.knock(6, false) },
  { id: 'toy-knock-sign', group: TOY, title: 'Folding sign knocked', when: 'Driving into a folding wet-floor sign.', src: 'src/audio.js#knock(speed, big)', secs: 0.5, trigger: sb => sb.S.knock(6, true) },
  { id: 'toy-poof', group: TOY, title: 'Snowman burst', when: 'Driving through a snowman outside.', src: 'src/audio.js#poof(speed)', secs: 0.6, trigger: sb => sb.S.poof(8) },
  { id: 'toy-preview-motor', group: TOY, title: 'Settings: motor slider', when: 'Moving the Master or Motor slider in Settings.', src: 'src/audio.js#preview(group)', secs: 0.5, trigger: sb => { sb.S._prev = 0; sb.S.preview('motor'); } },
  { id: 'toy-preview-music', group: TOY, title: 'Settings: music slider', when: 'Moving the Music slider in Settings.', src: 'src/audio.js#preview(group)', secs: 1.4, trigger: sb => { sb.S._prev = 0; sb.S.preview('music'); } },
  // ---------------------------------------------------------------- the galleries
  { id: 'room-tone', group: GL, title: 'Room tone', when: 'Always, under everything: the hush of a big building with the heating on.', src: 'src/audio.js#Room tone', secs: 6,
    trigger: sb => sb.hold(sb.roomTone.gain, 0.05) },
  { id: 'lamp-chimes', group: GL, title: 'Lamps coming on', when: 'Driving into a dark gallery: each work\'s lamp comes on with its own note (six works here, big and small).', src: 'src/audio.js#lamp(art)', secs: 5,
    trigger: async sb => { const A = sb.G.museum.arts; const pick = [...A.filter(a => !a.mini).slice(0, 4), ...A.filter(a => a.mini).slice(0, 2)]; for (const a of pick.length ? pick : A.slice(0, 6)) { sb.S.lamp(a); await sb.wait(0.35); } } },
  { id: 'room-chord', group: GL, title: 'Gallery lit', when: 'The last lamp of a gallery coming on: the room\'s low chord.', src: 'src/audio.js#roomChord()', secs: 4, trigger: sb => sb.S.roomChord() },
  { id: 'work-seen', group: GL, title: 'A work seen', when: 'Each new work you see (a soft high note; five of the possible notes).', src: 'src/audio.js#seen()', secs: 5,
    trigger: async sb => { for (let i = 0; i < 5; i++) { sb.S.seen(); await sb.wait(0.8); } } },
  { id: 'gallery-all-seen', group: GL, title: 'Gallery complete', when: 'Every work in a gallery seen (ALL SEEN). Also YOU\'RE IN, the platinum trophy and the end of a race.', src: 'src/audio.js#finish()', secs: 3.5, trigger: sb => sb.S.finish() },
  { id: 'look-bell', group: GL, title: 'Stepping up to look', when: 'Pressing E to look at a work (or opening a label): one low bell.', src: 'src/main.js#sound.bell(293.66, 0, 0.05, 3.5)', secs: 3.5, trigger: sb => sb.S.bell(293.66, 0, 0.05, 3.5) },
  { id: 'work-caught', group: GL, title: 'A work caught', when: 'The toy\'s light catching a work as it passes (onCatch): a small high bell.', src: 'src/audio.js#gate()', secs: 1, trigger: sb => sb.S.gate() },
  { id: 'frame-creak', group: GL, title: 'Frame creak', when: 'Pressing on a picture frame that is not a secret door: nothing there.', src: 'src/audio.js#creak()', secs: 0.5, trigger: sb => sb.S.creak() },
  { id: 'wall-grind', group: GL, title: 'Stone wall sliding', when: 'A wall that turns out to be a door sliding open, and the thud as it stops.', src: 'src/audio.js#grind(dur', secs: 2.5, trigger: sb => sb.S.grind(1.8) },
  // ---------------------------------------------------------------- the carol from the tree
  { id: 'tree-jingle-bells', group: 'Carols and songs', title: 'Jingle Bells from the tree', when: 'Outside near the big Christmas tree: Jingle Bells on bells and sleigh bells, plain at ten metres, gone by forty-five.', src: 'src/audio.js#carol(dist)', secs: 19.5,
    trigger: sb => { const c = sb.S._sbCarol; sb.S._carolAt = 0; sb.patch(sb.S, 'carol', () => c.call(sb.S, 10)); } },
];

// One entry per painting show (src/life/*.js), from __life.list() when the game is up: the toy drives in, looks for
// LOOK seconds (the show from the real look camera), steps back, and the show's linger (things left out for the toy)
// and its return are recorded too.
const LOOK = 16;
export function lifeEntry(L, root) {
  let src = 'src/paintlife.js';
  try { const dir = path.join(root, 'src/life'), f = fs.readdirSync(dir).find(n => n.startsWith(L.id + '-')); if (f) src = `src/life/${f}#lifeFor(${L.id}`; } catch { /* fine */ }
  const linger = Math.min(L.linger || 0, 15), back = (L.ret || 1.5) + 1;
  return {
    id: 'life-' + L.id, group: 'Paintings that come alive', title: L.title + (L.artist ? ` (${L.artist})` : ''), life: L,
    when: `Stopping to look at ${L.title} in ${L.room.replace(/^G/, 'Gallery ')}: the painting comes alive${L.word ? ' (' + L.word + ')' : ''}.`,
    src, secs: 2.6 + LOOK + linger + back,
    note: `${LOOK} s of looking from the game's own look camera, then stepping back${linger ? `, ${linger.toFixed(0)} s of what it leaves out for the toy` : ''}, then the return into the frame. The look's own bell starts it.`,
    setup: new Function('sb', `return (async () => {
      const id = ${L.id}, G = sb.G, L = window.__life.life(id);
      const p = L.floor(0.6, 2.2); sb.place(p.x, L.y + 0.05, p.z, Math.atan2(-L.nx, -L.nz));
      await sb.wait(1.2); await window.__life.ready(id); window.__life.free(id); L.reset();
      for (let i = 0; i < 60 && L.art.tier < 2; i++) await sb.wait(0.25);
      await sb.settle(6);
    })()`),
    trigger: new Function('sb', `return (async () => {
      const id = ${L.id}, G = sb.G, L = window.__life.life(id);
      G.shell.look(L.art); await sb.wait(${2.6 + LOOK});
      G.shell.endLook(); await sb.wait(${linger});
      window.__life.release(id);
    })()`),
    after: new Function('sb', `return (async () => { const L = window.__life.life(${L.id}); window.__life.release(${L.id}); await sb.wait(${back}); L.reset(); })()`),
  };
}

export const entries = [...core, ...galleries, ...story, ...music, ...outdoors, ...finale, ...games];
