// After Hours. The Art Institute of Chicago, after closing, by remote control.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildPlan, roomAt, confine } from './plan.js';
import { loadCollection, loadLocalImages, pageUrl, imageUrl } from './collection.js';
import { Museum } from './museum.js';
import { FloorMirror } from './reflect.js';
import { Car, Drone } from './vehicles.js';
import { Input } from './input.js';
import { Sound } from './audio.js';
import { Race, LAPS, clockText } from './race.js';
import { Props } from './props.js';

const $ = id => document.getElementById(id);
const canvas = $('view');
const params = new URLSearchParams(location.search);

// ------------------------------------------------------------------ stage ---

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03040a);
scene.fog = new THREE.FogExp2(0x060912, 0.0055);
scene.add(new THREE.HemisphereLight(0x8ea6dc, 0x2a2018, 0.42));
const camera = new THREE.PerspectiveCamera(72, 1, 0.03, 1400);
camera.position.set(8, 0.5, -2);

const mirror = new FloorMirror(0.5);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), 0.62, 0.8, 1.0);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize() {
  const w = innerWidth, h = innerHeight, pr = Math.min(devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h, false);
  composer.setPixelRatio(pr);
  composer.setSize(w, h);
  mirror.setSize(w * pr, h * pr);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// ------------------------------------------------------------------- game ---

const input = new Input(canvas);
const sound = new Sound();
input.onGesture = () => sound.unlock();

// Settings, kept between visits. Reduced motion starts on if the system asks for it.
const SETTINGS = 'after-hours.settings';
const set = { master: 0.8, motor: 0.5, music: 0.8, reduce: matchMedia('(prefers-reduced-motion: reduce)').matches, slowmo: true, big: false, hold: false, mirror: true };
try { Object.assign(set, JSON.parse(localStorage.getItem(SETTINGS) || '{}')); } catch { /* no storage */ }

const G = {
  set,
  state: 'loading', mode: 'explore', toy: 'car', view: 'chase',
  t: 0, plan: null, museum: null, race: null, car: null, drone: null, vehicle: null,
  roomId: null, facing: null, study: null, camYaw: 0, lampOn: true,
  seen: [], told: new Set(), allLit: false, perched: new Set(), perchTotal: 0,
  input, sound, camera, renderer, scene, mirror,
};
window.__ah = G;
try { G.seen = JSON.parse(localStorage.getItem('after-hours.seen') || '[]'); } catch { /* no storage */ }

const camLook = new THREE.Vector3(60, 5, 120);
const want = new THREE.Vector3();
const tmp = new THREE.Vector3();
const angDiff = (a, b) => { const d = a - b; return Math.atan2(Math.sin(d), Math.cos(d)); };

async function boot() {
  // ?saved skips the live API; ?remote ignores any offline image copy, which is only looked for when run locally.
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || params.has('local');
  const [collection] = await Promise.all([loadCollection({ timeout: params.has('saved') ? 1 : 7000 }), local && !params.has('remote') ? loadLocalImages() : null]);
  const plan = G.plan = buildPlan();
  G.collection = collection;
  G.museum = new Museum(plan, collection, mirror, renderer.capabilities.getMaxAnisotropy());
  scene.add(G.museum.group);
  G.museum.onWake = art => sound.lamp(art);
  G.museum.onRoomLit = () => sound.roomChord();
  // Art is the point. Each work seen counts, each room finished is announced.
  G.museum.onSeen = (art, st, complete) => {
    if (G.state !== 'play' && G.state !== 'study') return;
    sound.seen();
    if (complete && G.mode === 'explore') {
      const r = st.room, name = r.kind === 'hall' ? 'GRIFFIN COURT' : r.kind === 'corridor' ? 'GALLERY 11' : r.gallery.replace(/^Galleries /, 'Gallery ').toUpperCase();
      callout(`${name} \u00b7 ALL ${st.arts.length} SEEN`); sound.finish();
    }
    if (G.museum.seenCount === G.museum.arts.length) say('You have seen every work on view tonight.', 2, 10);
  };
  G.perchTotal = new Set(plan.surfaces.filter(q => q.perch).map(q => q.perch + '@' + Math.round(q.x0) + ',' + Math.round(q.z0))).size;

  G.car = new Car(plan);
  G.drone = new Drone(plan);
  scene.add(G.car.group, G.car.shadow, G.drone.group, G.drone.shadow);
  // One real lamp, moved to whichever toy is in use, so swapping never recompiles a shader.
  G.lamp = G.car.lamp;
  G.drone.group.remove(G.drone.lamp, G.drone.lamp.target);
  G.race = new Race(scene, plan);
  G.props = new Props(plan);
  scene.add(G.props.group);
  G.props.onHit = (p, sp) => sound.knock(sp, p.def.type === 'sign');

  setVehicle('car');
  G.car.place(plan.spawn.x + 3, plan.spawn.z, plan.spawn.yaw);
  G.drone.group.visible = false; G.drone.shadow.visible = false;

  const when = new Date(collection.fetched);
  const n = G.museum.arts.length;
  $('status').textContent = '';
  $('source').innerHTML = (collection.live
    ? `Tonight's hang: ${n} works, as the Art Institute of Chicago's open collection API lists them on view today.`
    : `Tonight's hang: ${n} works from a copy of the Art Institute of Chicago's open collection data saved on ${when.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}${params.has('saved') ? '' : ', because the live API could not be reached'}.`)
    + ` Images are public domain; data is CC0. A fan project, not affiliated with the museum. Rooms stand where the museum's galleries really are, though the building is unfolded onto one level and their shapes are guessed.`;
  for (const b of document.querySelectorAll('button.big')) b.disabled = false;
  applySettings();
  // Come back with the toy you left with.
  const sv = saved();
  if (sv && sv.toy === 'drone' && pick.toy !== 'drone') choose('toy', 1);
  titleButtons();
  G.state = 'title';
  if (shown === 'title' && !params.get('mode')) show('title');       // puts focus on Start, so Enter begins
  if (params.get('mode')) { G.toy = params.get('toy') || 'car'; start(params.get('mode')); }
}

function setVehicle(kind) {
  const v = kind === 'drone' ? G.drone : G.car;
  G.vehicle = v;
  G.toy = kind;
  v.group.add(G.lamp, G.lamp.target);
  if (kind === 'drone') { G.lamp.position.set(0, 0, 0.1); G.lamp.target.position.set(0, -0.7, 4); G.lamp.color.set(0xe8f0ff); G.lamp.angle = 0.62; }
  else { G.lamp.position.set(0, 0.14, 0.2); G.lamp.target.position.set(0, 0.02, 4); G.lamp.color.set(0xfff0d0); G.lamp.angle = 0.5; }
  G.car.group.visible = kind === 'car';
  G.car.shadow.visible = kind === 'car';
  G.drone.group.visible = kind === 'drone';
  G.drone.shadow.visible = kind === 'drone';
  document.body.classList.toggle('flying', kind === 'drone');
  $('stickL').lastElementChild.textContent = input.usedTouch ? (kind === 'drone' ? 'fly' : 'steer') : kind === 'drone' ? 'climb · turn' : 'throttle';
  $('stickR').lastElementChild.textContent = kind === 'drone' ? 'fly' : 'steer';
}

function start(mode, fresh = false) {
  sound.unlock();
  G.mode = mode;
  G.museum.sleep();
  G.allLit = false;
  G.resultsAt = 0;
  endFlyby();
  G.props.reset();
  G.museum.showHoops(mode !== 'race');
  prev.set(0, -99, 0);
  G.study = null; G.facing = null;
  $('label').hidden = true; $('placard').hidden = true; $('hud').classList.remove('studying');
  setVehicle(G.toy);
  if (mode === 'race') {
    G.race.begin(G.vehicle, sound);
    sound.musicOn = false;
  } else {
    G.race.end();
    // Carry on from where you were, or begin again on the avenue.
    const sv = fresh ? null : saved(), sp = sv || G.plan.spawn;
    if (G.toy === 'drone') G.drone.place(sp.x, sp.z, sp.yaw, sv ? Math.max(0.9, sv.y || 0) : 0.9); else G.car.place(sp.x, sp.z, sp.yaw, sv ? sv.y || 0 : 0);
    resumed = !!sv;
    sound.musicOn = true;
    say(resumed ? `Back where you left off. ${G.museum.seenCount} of ${G.museum.arts.length} works seen.` : 'Michigan Avenue, long after closing. The door is open. Go on in.', 1.2, 6);
    if (input.usedTouch) say(G.toy === 'drone' ? 'Left thumb flies and turns. UP and DOWN on the right.' : 'Left thumb steers. GAS on the right: gently for slow, harder (or higher up it) for fast.', 7.5, 8);
    if (!input.usedTouch) say(G.toy === 'drone'
      ? 'W S to fly · A D to turn · arrows to climb and slide · E to look closer'
      : 'W A S D to drive · E to look closer · V to swap toys', 7.5, 7);
    if (G.toy === 'car') { say('Somebody has left ramps out. And a loop.', 16, 6); if (!input.usedTouch) say('Space to jump. Hold it in the air and steer for tricks. Land it square for a perfect landing.', 24, 8); }
  }
  G.camYaw = G.vehicle.yaw;
  G.roomId = null;
  G.startedAt = G.t;
  G.perched.clear();
  G.state = 'play';
  chase(0, true);
  show(null);
  $('hud').hidden = false;
  $('race').hidden = mode !== 'race';
  $('tally').hidden = mode === 'race';
  $('bSwap').hidden = mode === 'race';
  $('pRestart').hidden = mode !== 'race';
  canvas.focus();
}

// ---- one game at a time, kept between visits ----
// What is kept: the works seen, the rooms visited, the notebook, and where you were.
// A new game throws all of it away.
const SAVE = 'after-hours.save';
let resumed = false;
function saved() {
  try {
    const sv = JSON.parse(localStorage.getItem(SAVE) || 'null');
    if (sv && isFinite(sv.x) && isFinite(sv.z) && isFinite(sv.yaw)) return sv;
  } catch { /* no storage */ }
  return null;
}
function hasGame() { return G.museum && (G.museum.seenIds.size > 0 || G.museum.visited.size > 0 || !!saved()); }
let lastSave = 0;
function keep() {
  const v = G.vehicle;
  if (G.mode !== 'explore' || G.state !== 'play' || G.t - lastSave < 3 || v.air || v.rail) return;
  lastSave = G.t;
  try { localStorage.setItem(SAVE, JSON.stringify({ x: +v.pos.x.toFixed(2), y: +v.pos.y.toFixed(2), z: +v.pos.z.toFixed(2), yaw: +v.yaw.toFixed(3), toy: v.kind })); } catch { /* fine */ }
}
function newGame() {
  G.museum.forget();
  G.seen = []; bestAir = 0; G.perched.clear(); G.told.clear();
  try { for (const k of [SAVE, 'after-hours.seen', 'after-hours.air']) localStorage.removeItem(k); } catch { /* fine */ }
}
// The title screen offers Continue only when there is a game to continue.
function titleButtons() {
  const game = hasGame() && pick.mode === 'explore', m = G.museum;
  $('startLabel').textContent = game ? 'Continue' : 'Start';
  $('startSub').textContent = game ? `${m.seenCount} of ${m.arts.length} works seen` : '';
  $('bNew').hidden = !game;
  $('confirmNew').hidden = true;
}

function quit() {
  G.race.end();
  G.state = 'title';
  G.study = null;
  sound.musicOn = false;
  G.museum.sleep();
  setVehicle('car');
  G.car.place(G.plan.spawn.x + 3, G.plan.spawn.z, G.plan.spawn.yaw);
  endFlyby();
  titleButtons();
  $('hud').hidden = true;
  show('title');
}

// ---------------------------------------------------------------- screens ---

let shown = 'title';
function show(name) {
  for (const id of ['title', 'pause', 'results', 'notebook', 'settings', 'controls', 'about']) $(id).hidden = id !== name;
  shown = name;
  // Keyboard and switch users land on the first control of whatever just opened.
  if (name) { const first = $(name).querySelector('[data-first]:not([disabled])') || $(name).querySelector('button:not([disabled]), input'); if (first) first.focus({ preventScroll: true }); }
  else canvas.focus({ preventScroll: true });
}

function applySettings(save) {
  sound.setVolumes(set);
  document.body.classList.toggle('reduce', set.reduce);
  document.body.classList.toggle('bigtext', set.big);
  mirror.enabled = set.mirror;
  input.hold = set.hold;
  if (G.museum) G.museum.calm = set.reduce;
  if (G.race) G.race.calm = set.reduce;
  if (G.car) G.car.calm = set.reduce;
  for (const el of document.querySelectorAll('[data-set]')) {
    const k = el.dataset.set;
    if (el.type === 'checkbox') el.checked = !!set[k];
    else { el.value = Math.round(set[k] * 100); el.setAttribute('aria-valuetext', Math.round(set[k] * 100) + ' percent'); }
  }
  if (save) try { localStorage.setItem(SETTINGS, JSON.stringify(set)); } catch { /* fine */ }
}
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.set;
  if (!k) return;
  sound.unlock();
  set[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value / 100;
  applySettings(true);
  if (k === 'motor' || k === 'master') sound.preview('motor'); else if (k === 'music') sound.preview('music');
});
let settingsFrom = 'title';
addEventListener('keydown', e => {
  if (e.code !== 'Escape') return;
  if (shown === 'settings') act('closeSettings');
  else if (shown === 'controls' || shown === 'about') act('closeInfo');
  else if (shown === 'notebook') act('closeNotebook');
});
// The buttons under the right thumb are held, not tapped.
input.bind($('bGas'), 'gas'); input.bind($('bJump'), 'jump'); input.bind($('bUp'), 'up'); input.bind($('bDown'), 'down');
// A phone held upright is asked to turn; the game waits while it does.
const upright = matchMedia('(orientation: portrait) and (pointer: coarse) and (max-width: 820px)');
upright.addEventListener('change', () => { if (upright.matches && (G.state === 'play' || G.state === 'study')) pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && (G.state === 'play' || G.state === 'study')) pause(); });

const toasts = [];
function say(text, delay = 0, hold = 5) { toasts.push({ text, at: G.t + delay, hold }); }
function once(key, text, hold = 6) { if (G.told.has(key)) return; G.told.add(key); say(text, 0, hold); }
let toastUntil = 0;
function runToasts() {
  const el = $('toast');
  const i = toasts.findIndex(t => G.t >= t.at);
  if (i >= 0 && G.t > toastUntil - 0.2) {
    const t = toasts.splice(i, 1)[0];
    el.textContent = t.text; el.classList.add('on'); toastUntil = G.t + t.hold;
  }
  if (G.t > toastUntil) el.classList.remove('on');
}

let roomUntil = 0;
function announce(room) {
  const el = $('room'), set = room && G.collection.rooms[room.id];
  let num = '', names = '';
  if (!room) { num = 'Outside'; names = 'It is snowing.'; }
  else if (room.kind === 'corridor') { num = 'Gallery 11'; names = 'The Thorne Miniature Rooms'; }
  else if (room.kind === 'hall') { num = 'Griffin Court'; names = 'the Modern Wing'; }
  else { num = room.gallery.replace(/^Galleries /, 'Gallery '); names = set && set.names.length ? set.names.join('  ·  ') : room.gallery === 'Gallery 200' ? 'the Grand Staircase' : ''; }
  el.firstElementChild.textContent = num;
  el.lastElementChild.textContent = names;
  el.classList.add('on');
  roomUntil = G.t + 3.6;
}

document.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  sound.unlock();
  if (b.dataset.step) choose(b.closest('.sel').dataset.sel, +b.dataset.step);
  else if (b.dataset.act) act(b.dataset.act);
});

// The title screen's two choices. Car and Explore unless you say otherwise.
const CHOICES = {
  toy: [['car', 'RC Car', 'Fits under the benches. Leaves the floor if you find a ramp.'],
    ['drone', 'RC Drone', 'Goes up to the glass. Meets a painting eye to eye.']],
  mode: [['explore', 'Explore', 'Wander. Every lamp you reach comes on.'],
    ['race', 'Race', 'Two laps of the building against three other toys.']],
};
const pick = G.pick = { toy: 'car', mode: 'explore' };
function choose(key, step) {
  const list = CHOICES[key], i = (list.findIndex(c => c[0] === pick[key]) + step + list.length) % list.length;
  pick[key] = list[i][0];
  $(key + 'Val').textContent = list[i][1];
  $(key + 'Hint').textContent = list[i][2];
  if (G.museum) titleButtons();
}
choose('toy', 0); choose('mode', 0);
addEventListener('keydown', e => {
  if (shown !== 'title' || (e.code !== 'ArrowLeft' && e.code !== 'ArrowRight')) return;
  const row = document.activeElement && document.activeElement.closest('.sel');
  choose(row ? row.dataset.sel : 'toy', e.code === 'ArrowLeft' ? -1 : 1);
  e.preventDefault();
});

function act(a) {
  switch (a) {
    case 'start': if (G.state === 'title') { G.toy = pick.toy; start(pick.mode); } break;
    case 'newgame':
      $('confirmText').textContent = `A new game forgets the ${G.museum.seenCount} works you have seen and where you were. There is no getting it back.`;
      $('confirmNew').hidden = false; $('confirmNew').querySelector('button').focus();
      break;
    case 'newgameNo': $('confirmNew').hidden = true; $('bNew').focus(); break;
    case 'newgameYes': if (G.state === 'title') { newGame(); G.toy = pick.toy; start('explore', true); } break;
    case 'pause': if (G.state === 'play' || G.state === 'study') pause(); break;
    case 'resume': G.state = G.study ? 'study' : 'play'; show(null); break;
    case 'restart': case 'again': start('race'); break;
    case 'wander': start('explore'); break;
    case 'quit': quit(); break;
    case 'notebook': openNotebook(); break;
    case 'closeNotebook': show(G.state === 'title' ? 'title' : 'pause'); break;
    case 'settings': settingsFrom = G.state === 'title' ? 'title' : 'pause'; applySettings(); show('settings'); break;
    case 'closeSettings': show(settingsFrom); break;
    case 'controls': case 'about': settingsFrom = G.state === 'title' ? 'title' : 'pause'; controlsList(); show(a); break;
    case 'closeInfo': show(settingsFrom); break;
    case 'sound': sound.setMuted(!sound.muted); say(sound.muted ? 'Sound off.' : 'Sound on.', 0, 2); break;
    default: input.press(a);
  }
}

function pause() { G.state = 'paused'; show('pause'); }

function openNotebook() {
  const grid = $('nbGrid');
  grid.textContent = '';
  $('nbCount').textContent = `${G.museum.seenCount} of ${G.museum.arts.length} works seen`;
  if (!G.seen.length) {
    const d = document.createElement('div'); d.className = 'empty';
    d.textContent = 'Pull up to a work and look closer. It will be kept here.';
    grid.append(d);
  }
  for (const w of [...G.seen].reverse()) {
    const f = document.createElement('figure'), img = document.createElement('img'), c = document.createElement('figcaption');
    img.loading = 'lazy'; img.alt = w.t; img.src = imageUrl(w, 200);
    c.textContent = w.t + (w.a ? ', ' + w.a : '');
    f.append(img, c); grid.append(f);
  }
  show('notebook');
}

// The controls, as a short list for whatever is in your hands.
function controlsList() {
  const touch = input.usedTouch || matchMedia('(pointer: coarse)').matches;
  const rows = touch
    ? [['Car', 'Left thumb steers. Pull back to reverse.'], ['Gas', input.gasBy === 'pedal' ? 'Hold GAS. Low on the button is gentle, slide up for flat out.' : 'Hold GAS. Press lightly to go slowly, hard to go fast.'], ['Lights', 'LIGHTS'], ['Jump', 'JUMP. Hold it in the air and steer to trick.'], ['Drone', 'Left thumb flies and turns. UP and DOWN to climb.'], ['Look closer', 'LOOK, when a work is named.'], ['Camera', 'CAM'], ['Swap toy', 'SWAP']]
    : [['Drive', 'W A S D or the arrow keys'], ['Jump', 'Space. Hold it in the air and steer to trick.'], ['Fly', 'W S forward and back, A D turn, ← → slide, ↑ ↓ climb'], ['Look closer', 'E'], ['Camera', 'C'], ['Swap toy', 'V'], ['Lights', 'L'], ['Notebook', 'N'], ['Mute', 'M'], ['Pause', 'Esc'], ['Gamepad', 'Sticks to drive, RB to jump, A to look closer']];
  $('ctlList').replaceChildren(...rows.flatMap(([k, v]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = k; dd.textContent = v; return [dt, dd]; }));
}
for (const b of document.querySelectorAll('button.big')) b.disabled = true;
applySettings();

// ----------------------------------------------------------------- camera ---

function chase(dt, snap) {
  const v = G.vehicle, drone = v.kind === 'drone';
  G.camYaw += angDiff(v.yaw, G.camYaw) * (snap ? 1 : Math.min(1, dt * (drone ? 6 : 4.2)));
  if (G.view === 'fpv') {
    const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
    camera.position.set(v.pos.x + fx * (drone ? 0.12 : 0.25), v.pos.y + (drone ? 0.0 : 0.17), v.pos.z + fz * (drone ? 0.12 : 0.25));
    camLook.set(v.pos.x + fx * 3, v.pos.y + (drone ? -0.25 - v.pitch * 2 : 0.3), v.pos.z + fz * 3);
    camera.up.set(0, 1, 0);
    camera.lookAt(camLook);
    if (!set.reduce) camera.rotateZ(-(v.roll || 0) * (drone ? 0.9 : 1.4));
  } else {
    const fx = Math.sin(G.camYaw), fz = Math.cos(G.camYaw);
    const dist = drone ? 1.35 : 1.3, up = drone ? 0.34 : 0.46;
    want.set(v.pos.x - fx * dist, v.pos.y + up, v.pos.z - fz * dist);
    tmp.set(v.pos.x + Math.sin(v.yaw) * 2.2, v.pos.y + (drone ? 0.0 : 0.42), v.pos.z + Math.cos(v.yaw) * 2.2);
    let rate = 10;
    if (v.rail) {
      // On the loop: stand back and to one side, and watch it go round.
      const L = v.rail.L;
      want.set(L.x - v.rail.way * (L.r + 2.5), L.r * 1.05, L.z - 2.4);
      tmp.set((v.pos.x + L.x) / 2, (v.pos.y + L.r) / 2, v.pos.z);
      rate = 5;
    } else if (slow.cine > 0.02 && slow.art) {
      // Flying past a picture: get round the far side of the car, low, so the
      // work is what the car is seen against.
      const a = slow.art, k = slow.cine;
      let dx = a.x - v.pos.x, dz = a.z - v.pos.z;
      const D = Math.hypot(dx, dz) || 1; dx /= D; dz /= D;
      const sp = Math.hypot(v.vel.x, v.vel.z) || 1, ux = v.vel.x / sp, uz = v.vel.z / sp;
      const back = Math.min(2.6, 1.5 + D * 0.13), along = dx * ux + dz * uz;
      // Picture abeam: shoot across the car at it. Picture dead ahead or dead
      // astern: come off to one side instead, or the car is all you would see.
      let cx = -dx - ux * 0.45, cz = -dz - uz * 0.45, lift = -0.08;
      if (Math.abs(along) > 0.7) { cx = -dx * 0.75 - uz * 0.7; cz = -dz * 0.75 + ux * 0.7; lift = 0.3; }
      const cl = Math.hypot(cx, cz) || 1;
      cine.set(v.pos.x + cx / cl * back, Math.max(0.14, v.pos.y + lift), v.pos.z + cz / cl * back);
      want.lerp(cine, k);
      cine.set(v.pos.x + (a.x - v.pos.x) * 0.32, v.pos.y + (a.y - v.pos.y) * 0.32 + 0.04, v.pos.z + (a.z - v.pos.z) * 0.32);
      tmp.lerp(cine, k);
      rate = 7;
    }
    confine(G.plan, want, 0.14, true, null, true);
    if (want.y < 0.1) want.y = 0.1;
    camera.position.lerp(want, snap ? 1 : 1 - Math.exp(-dt * rate));
    camLook.lerp(tmp, snap ? 1 : 1 - Math.exp(-dt * 14));
    camera.up.set(0, 1, 0);
    camera.lookAt(camLook);
  }
  const fov = ((G.view === 'fpv' ? 84 : 70) + (set.reduce ? 0 : Math.min(14, Math.abs(v.speed) * 1.1))) * (1 - 0.34 * slow.cine);
  camera.fov += (fov - camera.fov) * (snap ? 1 : Math.min(1, dt * 5));
  camera.updateProjectionMatrix();
}

// ------------------------------------------------------------------- air ---

const movers = [], prev = new THREE.Vector3(0, -99, 0), here = new THREE.Vector3();

// A word or two in the middle of the screen when you pull something off.
let calloutUntil = 0;
function callout(text) {
  const el = $('trick');
  el.textContent = text; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  calloutUntil = G.t + 2.2;
}

function trickName(l) {
  const parts = [];
  if (l.flips) parts.push((Math.abs(l.flips) > 1 ? ['', '', 'DOUBLE ', 'TRIPLE ', 'QUAD '][Math.min(4, Math.abs(l.flips))] : '') + (l.flips < 0 ? 'BACKFLIP' : 'FRONT FLIP'));
  if (l.spins) parts.push(`${l.spins * 180}`);
  return parts.join(' + ');
}

// Slow motion. Leave a ramp with a picture alongside and the world drops to a
// fifth of its speed, the camera comes round, and that one work is lit up and
// named until the wheels are down again.
const slow = G.slow = { k: 1, target: 1, art: null, live: false, boost: 0, cine: 0, until: 0 };
const cine = new THREE.Vector3();
let bestAir = 0;
try { bestAir = +localStorage.getItem('after-hours.air') || 0; } catch { /* no storage */ }

// With slow motion off (or motion reduced) a jump still lights the work and names it; time and camera stay put.
const calmAir = () => set.reduce || !set.slowmo;

function endFlyby() {
  slow.k = slow.target = 1; slow.live = false; slow.boost = slow.cine = 0; slow.until = 0;
  if (slow.art && G.museum) G.museum.spotlight(slow.art, 0);
  slow.art = null;
  renderer.toneMappingExposure = 1.15;
  document.body.classList.remove('flyby', 'cine');
  sound.setSlow(1);
}

function flight(v, real, racing) {
  if (v.kind === 'car') {
    if (v.jumped) { v.jumped = false; sound.boing(); }
    // A hop off the flat is just a hop; it takes a ramp, or real height, to stop time.
    if (v.launched > 0.42 && (!v.fromHop || v.launched > 1.0)) {
      const art = G.museum.beside(v.pos, v.vel, v.launched, G.roomId);
      if (art) {
        if (slow.art && slow.art !== art) G.museum.spotlight(slow.art, 0);
        slow.art = art; slow.live = true; slow.target = !calmAir() ? (racing ? 0.5 : 0.2) : 1;
        const el = $('flyby');
        el.querySelector('.t').textContent = art.work.t;
        el.querySelector('.a').textContent = [art.work.a, art.work.d].filter(Boolean).join(', ');
        sound.swell();
      }
    }
    if (v.landed) {
      sound.bump(1.5 + v.landed.impact * 0.8);
      const trick = trickName(v.landed);
      if (v.landed.crash) callout('WRONG WAY UP');
      else if (v.landed.perfect) { callout('PERFECT LANDING!\n' + trick); sound.perfect(); }
      else if (trick) { callout(trick); sound.lap(); }
      else if (v.landed.air > 1.1) callout(`${v.landed.air.toFixed(1)} SECONDS OF AIR`);
      if (v.landed.air > 0.35) {
        const best = v.landed.air > bestAir + 0.005;
        if (best) { bestAir = v.landed.air; try { localStorage.setItem('after-hours.air', bestAir.toFixed(2)); } catch { /* fine */ } }
        G.airMsg = { text: `AIR ${v.landed.air.toFixed(2)} S  ${v.landed.dist.toFixed(1)} M${best ? ' *' : ''}`, until: G.t + 3.5 };
      }
      if (!racing && v.pos.y > 0.3) once('ontop', 'You are on the furniture. Nobody saw.');
      if (!racing && v.landed.air > 0.55 && G.roomId === 'G200' && v.landed.dist > 3.5) once('stairs', 'Down the Grand Staircase without touching a step.');
    }
    if (slow.live && !v.air) { slow.live = false; slow.until = G.t + 1.1; }
    if (v.rail) slow.target = v.rail.top && v.rail.th < Math.PI * 1.5 && !calmAir() ? 0.4 : 1;
    else if (!slow.live) slow.target = 1;
    if (v.looped) { v.looped = false; sound.lap(); if (!racing) once('loop', 'All the way round.'); G.airMsg = { text: 'LOOP', until: G.t + 3 }; }
    if (v.fellOff) { v.fellOff = false; if (!racing) once('fell', 'It wants a longer run at it.'); }
  } else if (slow.live) { slow.live = false; slow.target = 1; }
  slow.k += (slow.target - slow.k) * Math.min(1, real * (slow.target < slow.k ? 12 : 4));
  const on = slow.live ? 1 : 0;
  slow.boost += (on - slow.boost) * Math.min(1, real * (on ? 8 : 2.5));
  slow.cine += ((slow.live && !racing && G.view === 'chase' && !calmAir() ? 1 : 0) - slow.cine) * Math.min(1, real * 6);
  if (slow.art) {
    G.museum.spotlight(slow.art, slow.boost);
    if (!slow.live && slow.boost < 0.02) { G.museum.spotlight(slow.art, 0); slow.art = null; }
  }
  renderer.toneMappingExposure = 1.15 - 0.3 * slow.boost;
  const showing = slow.live || G.t < slow.until;
  document.body.classList.toggle('flyby', showing);
  document.body.classList.toggle('cine', showing && !racing && !calmAir());
  sound.setSlow(slow.k);
}

// Leave the toy where it is and stand in front of the work like a person.
function beginStudy(art) {
  endFlyby();
  G.study = { art, t: 0, from: camera.position.clone(), look: camLook.clone(), fov: camera.fov };
  G.lamp.intensity = G.lampOn ? 14 : 0;                  // dip the headlamp while you look
  toastUntil = 0; toasts.length = 0;
  G.state = 'study';
  art.focus = true;
  G.museum.see(art);
  // Nothing between you and the work: the toy and the stunt kit are put away while you look.
  G.vehicle.group.visible = false; G.car.shadow.visible = G.drone.shadow.visible = false; G.museum.kit.visible = false; G.props.group.visible = false;
  if (art.obj) { const dx = G.vehicle.pos.x - art.x, dz = G.vehicle.pos.z - art.z, d = Math.hypot(dx, dz) || 1; art.nx = dx / d; art.nz = dz / d; art.rot = Math.atan2(art.nx, art.nz); }
  if (art.wakeAt < 0) { art.wakeAt = G.museum.time; G.museum._waking.add(art); }
  const w = art.work;
  if (!G.seen.some(s => s.id === w.id)) {
    G.seen.push({ id: w.id, t: w.t, a: w.a, img: w.img });
    try { localStorage.setItem('after-hours.seen', JSON.stringify(G.seen)); } catch { /* fine */ }
  }
  const el = $('label');
  el.querySelector('.t').textContent = w.t;
  el.querySelector('.a').textContent = [w.a, w.d].filter(Boolean).join(', ');
  el.querySelector('.m').textContent = w.m;
  el.querySelector('.alt').textContent = w.alt || '';
  el.querySelector('.g').textContent = [w.g, art.mini ? 'one inch to the foot' : art.obj ? `${Math.round(art.h * 100)} cm tall` : `${Math.round(art.w * 100)} × ${Math.round(art.h * 100)} cm on the wall`].filter(Boolean).join(' · ');
  el.querySelector('a').href = pageUrl(w);
  el.hidden = false;
  $('placard').hidden = true;
  $('hud').classList.add('studying');
  sound.bell(293.66, 0, 0.05, 3.5);
}

function endStudy() {
  if (!G.study) return;
  G.study.art.focus = false;
  G.study = null;
  G.vehicle.group.visible = true; G.car.shadow.visible = G.vehicle.kind === 'car'; G.drone.shadow.visible = G.vehicle.kind === 'drone'; G.museum.kit.visible = true; G.props.group.visible = true;
  G.lamp.intensity = G.lampOn ? 70 : 0;
  G.state = 'play';
  $('label').hidden = true;
  $('hud').classList.remove('studying');
}

function studyCam(dt) {
  const s = G.study, a = s.art;
  s.t += dt;
  const fov = 46, tan = Math.tan(fov * Math.PI / 360);
  const wide = innerWidth > 720 ? 0.72 : 1;         // leave room for the label on a wide screen
  let dist = Math.max(a.h * 1.3 / (2 * tan), a.w * 1.3 / (2 * tan * camera.aspect * wide), a.mini ? 0.75 : a.obj ? a.half + 0.5 : 1.1);
  dist *= 1 - 0.07 * Math.min(1, s.t / 30);          // and drift in, very slowly
  // On a wide screen, stand a little to one side so the label does not cover the work,
  // but stay square to the wall.
  const side = wide < 1 ? a.w * 0.2 + 0.1 : 0, tx = Math.cos(a.rot), tz = -Math.sin(a.rot);
  want.set(a.x + a.nx * dist - tx * side, a.y, a.z + a.nz * dist - tz * side);
  confine(G.plan, want, 0.25, true, null, true);
  if (a.obj) want.y = a.y;
  const k = Math.min(1, s.t / 1.7), e = k * k * (3 - 2 * k);
  camera.position.lerpVectors(s.from, want, e);
  tmp.set(want.x - a.nx * dist, a.y, want.z - a.nz * dist);
  camLook.lerpVectors(s.look, tmp, e);
  camera.up.set(0, 1, 0);
  camera.lookAt(camLook);
  camera.fov = s.fov + (fov - s.fov) * e;
  camera.updateProjectionMatrix();
}

function attract(dt) {
  // Out on the avenue in the snow, drifting towards the front door and the lions.
  const sp = G.plan.spawn, k = 0.5 + 0.5 * Math.sin(G.t * 0.05 - 1.3);
  camera.position.set(sp.x - 9 + k * 5, 0.5 + 0.12 * Math.sin(G.t * 0.11), sp.z + 3.4 - k * 1.2);
  camLook.set(sp.x + 14, 3.6, sp.z - 0.6);
  camera.up.set(0, 1, 0);
  camera.lookAt(camLook);
  if (camera.fov !== 60) { camera.fov = 60; camera.updateProjectionMatrix(); }
  G.car.sync(dt);
}

// -------------------------------------------------------------------- HUD ---

const mapEl = $('map'), mctx = mapEl.getContext('2d');
function drawMap() {
  const c = mctx, v = G.vehicle, s = 4, W = 440, Hh = 250;
  const X = x => (x - v.pos.x) * s + W / 2, Z = z => (z - v.pos.z) * s + Hh / 2;
  c.clearRect(0, 0, W, Hh);
  c.fillStyle = 'rgba(10,12,18,.5)'; c.fillRect(0, 0, W, Hh);
  c.lineWidth = 1.5; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '600 21px ui-monospace, Menlo, monospace';
  // Three kinds of room: not yet visited (dark, dashed), visited with works still to see
  // (lighter, with a gold bar for how far through you are), and finished (gold).
  for (const st of Object.values(G.museum.rooms)) {
    const r = st.room;
    if (X(r.x1) < 0 || X(r.x0) > W || Z(r.z1) < 0 || Z(r.z0) > Hh) continue;
    const been = G.museum.visited.has(r.id), n = st.arts.length, f = n ? st.seen / n : 0, done = n ? st.done : been;
    const x = X(r.x0), z = Z(r.z0), w = (r.x1 - r.x0) * s, h = (r.z1 - r.z0) * s;
    c.fillStyle = done ? 'rgba(226,190,110,.95)' : been ? 'rgba(62,70,98,.95)' : 'rgba(14,16,24,.92)';
    c.fillRect(x, z, w, h);
    if (!done && f > 0) { c.fillStyle = 'rgba(240,200,110,.95)'; c.fillRect(x, z + h - 7, w * f, 7); }
    c.setLineDash(been ? [] : [5, 5]);
    c.strokeStyle = done ? 'rgba(255,235,170,1)' : been ? 'rgba(226,205,148,.75)' : 'rgba(150,150,165,.5)';
    c.strokeRect(x, z, w, h);
    c.setLineDash([]);
    if (w > 34) {
      const name = r.kind === 'hall' ? 'Court' : r.kind === 'corridor' ? '11' : r.gallery.replace(/^Galler(y|ies) /, '').slice(0, 7);
      c.fillStyle = done ? 'rgba(30,22,6,.95)' : been ? 'rgba(240,225,185,.95)' : 'rgba(150,150,165,.7)';
      c.font = '600 21px ui-monospace, Menlo, monospace';
      c.fillText(name, x + w / 2, z + h / 2 - (n && h > 46 ? 9 : 0));
      if (n && h > 46) { c.font = '500 16px ui-monospace, Menlo, monospace'; c.fillText(done ? 'all ' + n : `${st.seen}/${n}`, x + w / 2, z + h / 2 + 13); }
    }
  }
  c.fillStyle = 'rgba(226,205,148,.9)';
  for (const d of G.plan.doors) c.fillRect(X(d.x0), Z(d.z0), Math.max(2, (d.x1 - d.x0) * s), Math.max(2, (d.z1 - d.z0) * s));
  c.strokeStyle = 'rgba(255,140,60,.95)'; c.lineWidth = 2.5;
  for (const L of G.plan.loops) { c.beginPath(); c.arc(X(L.x), Z(L.z), 5.5, 0, 7); c.stroke(); }
  c.lineWidth = 1.5;
  if (G.mode === 'race' && G.race.active) {
    const R = G.race;
    c.strokeStyle = 'rgba(127,233,245,.6)'; c.lineWidth = 2; c.beginPath();
    R.route.pts.forEach((p, i) => (i % 4 === 0) && (i ? c.lineTo(X(p.x), Z(p.z)) : c.moveTo(X(p.x), Z(p.z))));
    c.closePath(); c.stroke();
    const g = R.gates[R.next];
    c.fillStyle = '#7fe9f5'; c.beginPath(); c.arc(Math.max(8, Math.min(W - 8, X(g.x))), Math.max(8, Math.min(Hh - 8, Z(g.z))), 6, 0, 7); c.fill();
    for (const b of R.bots) { c.fillStyle = '#' + b.colour.toString(16).padStart(6, '0'); c.beginPath(); c.arc(X(b.x), Z(b.z), 5, 0, 7); c.fill(); }
  }
  c.save();
  c.translate(W / 2, Hh / 2);
  c.rotate(Math.atan2(Math.cos(v.yaw), Math.sin(v.yaw)) - Math.PI / 2);
  c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(0, 11); c.lineTo(7, -8); c.lineTo(0, -3); c.lineTo(-7, -8); c.closePath(); c.stroke(); c.fill();
  c.restore();
}

const knobL = $('stickL').firstElementChild, knobR = $('stickR').firstElementChild;
let frame = 0;
function hud() {
  const v = G.vehicle, st = input.sticks, k = input.usedTouch ? 38 : 30;
  const th = input.thumb, sl = $('stickL');
  if (input.usedTouch) $('bGas').style.setProperty('--lvl', (input.btn.gas ? Math.round(input.gasLevel * 100) : 0) + '%');
  if (input.usedTouch) {
    // The thumbstick is drawn where the thumb came down.
    knobL.style.transform = `translate(${th.x * k}px,${-th.y * k}px)`;
    sl.classList.toggle('live', th.on);
    if (th.on) { sl.style.left = th.ox - 64 + 'px'; sl.style.top = th.oy - 64 + 'px'; sl.style.bottom = 'auto'; } else { sl.style.left = sl.style.top = sl.style.bottom = ''; }
  } else knobL.style.transform = `translate(${st.lx * k}px,${-st.ly * k}px)`;
  knobR.style.transform = `translate(${st.rx * k}px,${-st.ry * k}px)`;
  if (frame % 6 === 0) {
    document.body.classList.toggle('touch', input.usedTouch);
    const kmh = Math.round(Math.hypot(v.vel.x, v.vel.z) * 3.6);
    $('lcdA').textContent = `${v.kind === 'drone' ? 'DRONE' : 'CAR'}  ${String(kmh).padStart(2, ' ')} KM/H`;
    $('lcdB').textContent = v.kind === 'drone' ? `ALT ${(v.pos.y - (v.floor || 0.07) + 0.07).toFixed(1)} M`
      : G.airMsg && G.t < G.airMsg.until ? G.airMsg.text : (G.lampOn ? 'LIGHTS ON' : 'LIGHTS OFF');
    if (G.mode === 'explore') {
      const m = G.museum;
      const here = G.roomId && m.rooms[G.roomId], rooms = m.galleries;
      $('tally').innerHTML = `<span class="art">ART SEEN <b>${m.seenCount}</b> / ${m.arts.length}</span><br>`
        + (here && here.arts.length ? `THIS ROOM <b>${here.seen}</b> / ${here.arts.length}` : 'OUTSIDE') + ` \u00b7 ROOMS <b>${rooms.filter(r => r.done).length}</b> / ${rooms.length}<br>`
        + `<span class="minor">hoops ${m.hoopsDone} / ${m.hoops.length} \u00b7 high places ${G.perched.size} / ${G.perchTotal}</span>`;
    } else {
      const R = G.race;
      $('rLap').textContent = `LAP ${Math.min(R.lap, LAPS)}/${LAPS}`;
      $('rTime').textContent = clockText(Math.max(0, R.finished ? R.total : R.clock));
      $('rPlace').textContent = ['1ST', '2ND', '3RD', '4TH'][R.place - 1] || '';
    }
    $('fpv').hidden = G.view !== 'fpv' || G.state !== 'play';
    if (G.view === 'fpv') {
      const d = new Date();
      $('fpv').querySelector('.stamp').innerHTML = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).toUpperCase()
        + '<br>' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    }
    if (frame % 12 === 0) drawMap();
  }
  if (G.mode === 'race') {
    const R = G.race, b = R.bearing();
    $('arrow').firstElementChild.style.transform = `rotate(${b.angle}rad)`;
    $('rDist').textContent = R.finished ? '' : `${Math.round(b.dist)} m` + (R.flying && Math.abs(b.dy) > 0.8 ? (b.dy > 0 ? ' ▲' : ' ▼') : '');
    const c = $('count');
    if (R.state === 'countdown') { const n = Math.ceil(-R.clock); c.textContent = n <= 3 ? n : ''; c.style.opacity = n <= 3 ? 1 : 0; }
    else if (R.clock < 1) { c.textContent = 'Go'; c.style.opacity = 1 - R.clock; }
    else c.style.opacity = 0;
  } else $('count').style.opacity = 0;
  if (G.t > roomUntil) $('room').classList.remove('on');
  if (G.t > calloutUntil) $('trick').classList.remove('on');
  runToasts();
}

function results() {
  const R = G.race;
  $('resOver').textContent = `The Night Circuit · ${R.flying ? 'drone' : 'car'}`;
  $('resPlace').textContent = ['First', 'Second', 'Third', 'Fourth'][R.finalPlace - 1];
  const best = R.best[G.vehicle.kind];
  $('resTimes').innerHTML = R.lapTimes.map((t, i) => `LAP ${i + 1}  ${clockText(t)}`).join('<br>')
    + `<br><b>TOTAL  ${clockText(R.total)}</b><br>` + (R.record ? 'A NEW BEST' : `BEST  ${clockText(best)}`);
  show('results');
}

// ------------------------------------------------------------------- loop ---

function play(dt, real) {
  const v = G.vehicle, R = G.race, racing = G.mode === 'race';
  let inp = input.read(v.kind === 'drone');
  if (G.auto && racing) inp = autopilot(v, R);
  if (G.testInput) inp = G.testInput;
  if (racing && (R.locked || R.finished)) inp = v.kind === 'drone' ? { pitch: 0, roll: 0, yaw: 0, climb: 0 } : { throttle: 0, steer: 0 };
  v.update(dt, inp);
  if (v.bump > 1.2) sound.bump(v.bump);
  flight(v, real, racing);

  // Loose things, and whatever is ploughing into them.
  movers.length = 0;
  movers.push({ x: v.pos.x, y: v.pos.y - (v.kind === 'drone' ? 0.1 : 0), z: v.pos.z, vx: v.vel.x, vz: v.vel.z, r: v.radius });
  if (racing) for (const b of R.bots) movers.push({ x: b.x, y: b.y || 0, z: b.z, vx: (b.x - (b.px ?? b.x)) / Math.max(dt, 1e-3), vz: (b.z - (b.pz ?? b.z)) / Math.max(dt, 1e-3), r: 0.19 });
  if (racing) for (const b of R.bots) { b.px = b.x; b.pz = b.z; }
  G.props.update(dt, movers);

  // Hoops.
  here.set(v.pos.x, v.pos.y + (v.kind === 'car' ? 0.12 : 0), v.pos.z);
  if (!racing && prev.y > -50 && prev.distanceToSquared(here) < 4) {
    const h = G.museum.hoopHit(prev, here);
    if (h) {
      const n = G.museum.hoopsDone, all = G.museum.hoops.length;
      sound.hoop(n);
      callout(n === all ? 'EVERY HOOP' : `HOOP ${n} / ${all}`);
      if (n === all) say('Every hoop in the building. Show-off.', 1, 8);
    }
  }
  prev.copy(here);

  if (input.took('camera')) G.view = G.view === 'chase' ? 'fpv' : 'chase';
  if (input.took('lights')) { G.lampOn = !G.lampOn; G.lamp.intensity = G.lampOn ? 70 : 0; $('bLights').setAttribute('aria-pressed', G.lampOn); sound.tick(0.08, 2200, 0.03); }
  if (input.took('mute')) act('sound');
  if (input.took('notebook')) { pause(); openNotebook(); }
  if (input.took('pause')) pause();
  if (input.took('reset')) { if (racing) R.reset(); else { v.vel.set(0, 0, 0); } }
  if (input.took('swap') && !racing) {
    const to = v.kind === 'car' ? 'drone' : 'car', from = v;
    setVehicle(to);
    endFlyby();
    if (to === 'drone') G.drone.place(from.pos.x, from.pos.z, from.yaw, from.pos.y + 0.5); else G.car.place(from.pos.x, from.pos.z, from.yaw, from.pos.y);
    sound.tick(0.1, 1200, 0.08);
  }

  // Bump the rivals aside (they are on rails; you are not).
  if (racing) {
    R.update(dt, G.t);
    for (const b of R.bots) {
      const dx = v.pos.x - b.x, dz = v.pos.z - b.z, dy = v.pos.y - (b.y || 0), d = Math.hypot(dx, dz);
      if (d < 0.42 && d > 1e-4 && Math.abs(dy) < 0.3) {
        const k = (0.42 - d) / d;
        v.pos.x += dx * k; v.pos.z += dz * k; v.vel.x += dx / d * 1.5; v.vel.z += dz / d * 1.5;
        if (!b.hitT || G.t - b.hitT > 0.4) { sound.bump(2); b.hitT = G.t; }
      }
    }
    if (R.finished && !G.resultsAt) G.resultsAt = G.t + 2.2;
    if (G.resultsAt && G.t > G.resultsAt) { G.resultsAt = 0; G.state = 'results'; results(); }
  }

  const room = roomAt(G.plan, v.pos.x, v.pos.z);
  if ((room ? room.id : null) !== G.roomId) {
    G.roomId = room ? room.id : null;
    if (!racing && G.t - G.startedAt > 2) {
      announce(room);
      if (room && room.kind === 'corridor') once('thorne', 'The Thorne Miniature Rooms. Built at one inch to the foot: about your size.', 7);
    }
  }
  G.museum.update(dt, v.pos, G.roomId, camera.position);

  if (!racing) {
    const calm = Math.hypot(v.vel.x, v.vel.z) < 5 && !v.air && !v.rail;
    const art = calm ? G.museum.facing(v.pos, v.yaw, G.roomId) : null;
    if (art !== G.facing) {
      G.facing = art;
      const el = $('placard');
      el.hidden = !art; $('bLook').hidden = !art;
      if (art) {
        el.querySelector('.t').textContent = art.work.t;
        el.querySelector('.a').textContent = [art.work.a, art.work.d].filter(Boolean).join(', ');
      }
    }
    if (input.took('look') && G.facing) beginStudy(G.facing);
    if (v.kind === 'car' && v.under) once('bench', 'You fit under the benches. Nobody else in here ever has.');
    if (v.kind === 'drone' && v.pos.distanceTo(G.museum.balloonAt) < 3) once('balloon', 'A balloon, lost on somebody\u2019s field trip and never fetched down.', 7);
    if (v.kind === 'drone' && !room && v.pos.y > 14) once('roofs', 'The roofs of the museum under snow, and the city all round.', 7);
    // Somewhere high to stop and look from.
    const on = v.kind === 'car' && !v.air ? v.on : null;
    if (on && on.perch && Math.abs(v.speed) < 2.5) {
      const key = on.perch + '@' + Math.round(on.x0) + ',' + Math.round(on.z0);
      if (!G.perched.has(key)) { G.perched.add(key); callout('A VIEW FROM UP HERE'); sound.lap(); say(`The ${on.perch}. Look round: E works from here too.`, 0.5, 6); }
    }
  }
  keep();
  chase(real, false);
}

// A plain follow-the-line driver, for testing that a lap can be finished (?auto).
function autopilot(v, R) {
  R._progress();
  const look = R.at(R.sP + 1.6 + Math.abs(v.speed) * 0.32), here = R.at(R.sP + 2);
  let k = 0;
  for (let d = 0; d < 3 + Math.abs(v.speed); d += 1) k = Math.max(k, R.at(R.sP + d).k);
  const vt = Math.min(11.5, Math.sqrt(6.4 / Math.max(k, 0.004)));
  const a = angDiff(Math.atan2(look.x - v.pos.x, look.z - v.pos.z), v.yaw);
  const sp = Math.hypot(v.vel.x, v.vel.z);
  if (v.kind === 'drone') {
    const yawErr = angDiff(Math.atan2(here.tx, here.tz), v.yaw);
    return { pitch: sp < vt ? 1 : -0.4, roll: Math.max(-1, Math.min(1, -a * 2.2)), yaw: Math.max(-1, Math.min(1, -(a + yawErr) * 2.5)), climb: Math.max(-1, Math.min(1, (look.y - v.pos.y) * 2.5)) };
  }
  return { throttle: sp < vt ? 1 : sp > vt + 1.5 ? -0.6 : 0, steer: Math.max(-1, Math.min(1, -a * 3)) };
}
G.auto = params.has('auto');

// If the machine cannot keep up, give things back in order of how little they
// will be missed: sharpness first, then the glow, then the floor reflections.
const quality = { step: 0, slow: 0, since: 0 };
function govern(dt) {
  if (G.state !== 'play' || document.hidden) return;
  quality.since += dt;
  if (quality.since < 4) return;
  quality.slow = G.fps < 38 ? quality.slow + dt : 0;
  if (quality.slow < 3 || quality.step >= 3) return;
  quality.step++; quality.slow = 0; quality.since = 0;
  if (quality.step === 1) { renderer.setPixelRatio(1); composer.setPixelRatio(1); mirror.setSize(innerWidth * 0.8, innerHeight * 0.8); }
  else if (quality.step === 2) bloom.enabled = false;
  else { set.mirror = false; applySettings(); }
}

let last = performance.now();
function tick(now) {
  requestAnimationFrame(tick);
  G.fps = (G.fps || 60) * 0.95 + 0.05 * 1000 / Math.max(1, now - last);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  frame++;
  if (G.state === 'loading') { renderer.render(scene, camera); return; }
  if (G.state !== 'paused' && G.state !== 'results') G.t += dt;
  govern(dt);

  input.capture = G.state === 'play' || G.state === 'study';
  if (G.state === 'title') {
    attract(dt);
    G.museum.update(dt, camera.position, null, camera.position);
    sound.update(null, false);
  } else if (G.state === 'play') {
    play(dt * slow.k, dt);
    sound.update(G.vehicle, true);
    hud();
  } else if (G.state === 'study') {
    input.read(G.vehicle.kind === 'drone');
    const st = input.sticks;
    if (input.took('look') || input.took('pause') || Math.abs(st.ly) + Math.abs(st.rx) + Math.abs(st.lx) + Math.abs(st.ry) > 0.6 && G.study.t > 0.8) endStudy();
    else { studyCam(dt); G.museum.update(dt, G.vehicle.pos, G.roomId, camera.position); }
    sound.update(G.vehicle, false);
    hud();
  } else if (G.state === 'paused') {
    if (input.took('pause')) act('resume');
    sound.update(G.vehicle, false);
  }
  input.endFrame();
  if (G.state === 'paused' || G.state === 'results') { composer.render(); return; }
  mirror.render(renderer, scene, camera, G.museum.floors);
  composer.render();
}

// ?probe reports what loaded to the page's own server after a few seconds (a test aid).
if (params.has('probe')) setTimeout(() => {
  const t = [0, 0, 0, 0]; let remote = 0;
  for (const a of G.museum.arts) { t[a.tier]++; if (a.url && a.url.includes('artic.edu')) remote++; }
  fetch('/report', { method: 'POST', referrerPolicy: 'origin', body: JSON.stringify({ live: G.collection.live, works: G.museum.arts.length, tiers: t, fromMuseum: remote, fps: Math.round(G.fps), quality: quality.step, state: G.state, room: G.roomId, lit: G.museum.litCount, seen: G.museum.seenCount, rooms: G.plan.rooms.length }) }).catch(() => {});
}, 14000);

boot().then(() => requestAnimationFrame(tick)).catch(err => {
  console.error(err);
  $('status').textContent = 'The building would not open: ' + err.message;
});
