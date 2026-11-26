// The voyage: the finale's flight to the Moon and the museum that opens there (docs/FINALE.md, beats 7 to 10).
//
//   startVoyage(G, { cargo, toy })   takes over the game. cargo = { arts, books, items }: museum art (G.museum.arts
//                                    entries) or work records (with an image id), Open Library books (objects or
//                                    their keys in data/books.json), and lost property ({ kind, name }, kinds as in
//                                    src/lostfound.js). toy is 'car' (it rides along) or 'drone' (it docks).
//
// While it runs G.state is 'voyage' and main.js hands each frame to G.voyage.frame(dt). The city is not drawn, but
// nothing of it is touched: the voyage has its own two scenes (the sky, far away, and everything near), and the toy
// is lent to them with its plan swapped for the Moon's and its gravity for the Moon's. Flying home gives both back,
// puts the toy on Butler Field and throws the voyage's scenes away.
//
// It goes: the cabin, above the night side of the Earth, with the art on the walls; piloting with the drone's
// controls; DESTINATION, to the Moon (the autopilot's approach) or somewhere far away (a jump to a far galaxy and
// back); the landing beside the dome; the ramp; the toy out on the Moon at one-sixth gravity, the cargo floating
// after it; the cargo into the dome (pictures to the walls, books to the shelves, lost property to a cabinet); the
// visitors, the lights, the sign; the credits; the night in numbers; and after it, the Moon to keep, or home.
//
// Saved at each stage in localStorage ('after-hours.voyage'), so a reload goes back to the stage it was at, and
// 'after-hours.moon' is set for good once the museum has opened (voyageFinished(), for the title screen).

import * as THREE from 'three';
import { GRAVITY, confine, groundAt } from './plan.js';
import { imageUrl } from './collection.js';
import { loadBooks } from './books.js';
import { KINDS } from './lostfound.js';
import { buildCraft, framedArt, CRAFT } from './craft.js';
import { moonPlan, buildMoon, moonH, Visitors, Dust, DOME, SAUCER, MOON_G, HATCH } from './moon.js';
import { makeStarfield, makeSun, makeEarth, makeMoonBall, makePlanet, makeGalaxy, Streaks, dirAE, disposeAll } from './cosmos.js';
import { loadSpaceTextures, applySpaceTextures } from './spacetex.js';
import { CosmicMusic } from './cosmicmusic.js';
import { tonight } from './features.js';
import { MOTIF, motifVoice } from './motif.js';

const SAVE = 'after-hours.voyage', DONE = 'after-hours.moon';
const V3 = THREE.Vector3;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

// ---- the solar system, as laid out for the voyage (metres, in its own frame; the craft starts at the origin)
const EARTH_C = new V3(0, -3000, 0), EARTH_R = 2600;
const MOON_C = dirAE(0, 5).multiplyScalar(12000), MOON_R = 700;
const SUN_DIR = dirAE(78, -16);
const PLANETS = [['mercury', 88, -6, 15000, 140], ['venus', 56, -3, 9000, 240], ['mars', -58, 9, 7600, 170], ['jupiter', -112, 20, 24000, 1150], ['saturn', 148, 17, 30000, 900], ['uranus', -158, 31, 42000, 520], ['neptune', 118, 38, 52000, 500]];
// on the Moon: the Sun low in the east, the Earth over the dome
const MOON_SUN = dirAE(100, 13), MOON_EARTH = dirAE(-12, 31);

// ---------------------------------------------------------------- saving --
export function voyageSaved() { try { const s = JSON.parse(localStorage.getItem(SAVE) || 'null'); return s && ['space', 'landed', 'opened', 'home'].includes(s.stage) && s.cargo && typeof s.cargo === 'object' ? s : null; } catch { return null; } }      // (a stage the voyage itself writes, and a cargo: anything else truthy sent Continue straight into a voyage with nothing aboard)
export function voyageFinished() { try { return localStorage.getItem(DONE) === '1'; } catch { return false; } }
export function clearVoyage() { try { localStorage.removeItem(SAVE); } catch { /* fine */ } }
function save(stage, v) {
  // A work hung in the museum tonight is saved as its id; any other (the base's archive, src/finalelaunch.js) as the little
  // the voyage needs of its record, since a reload could not find it by id.
  const hung = new Set((v.G.museum ? v.G.museum.arts : []).map(a => a.work && a.work.id));
  const art = a => hung.has(a.id) ? a.id : { id: a.id, t: a.work.t, a: a.work.a, d: a.work.d, img: a.work.img, w: a.work.w, h: a.work.h, iw: a.work.iw, ih: a.work.ih, k: a.work.k, c: '' };
  try { localStorage.setItem(SAVE, JSON.stringify({ stage, toy: v.toy, cargo: { arts: v.cargo.arts.map(art), books: v.cargo.books.map(b => b.k), items: v.cargo.items.map(i => i.kind) }, at: Date.now() })); } catch { /* fine */ }
}

/** Pick the voyage back up after a reload, if one is under way. Returns true if it did. */
export function resumeVoyage(G) {
  const s = voyageSaved(); if (!s || s.stage === 'home' || G.voyage) return false;
  startVoyage(G, { cargo: s.cargo, toy: s.toy, stage: s.stage });
  return true;
}

/** A cargo to test with: a dozen public-domain paintings from tonight's hang, a few books, a few lost things. */
export async function testCargo(G) {
  const local = a => !/artic\.edu/.test(imageUrl(a.work, 843));
  const pd = (G.museum ? G.museum.arts : []).filter(a => !a.obj && !a.mini && !a.work.c && a.work.img && a.w > 0.3 && a.h > 0.3);
  const pick = [...pd.filter(local), ...pd.filter(a => !local(a))].slice(0, 12);
  const B = await loadBooks();
  return { arts: pick, books: B ? B.all.slice(0, 9) : [], items: KINDS.slice(0, 6).map(k => ({ kind: k.id, name: k.name })) };
}

/** Take the game over. Returns the voyage (also G.voyage). */
export function startVoyage(G, { cargo = {}, toy = 'car', stage = 'space' } = {}) {
  if (G.voyage) return G.voyage;
  const v = G.voyage = new Voyage(G, cargo, toy === 'drone' ? 'drone' : 'car', stage);
  return v;
}

// ---- the cargo, whatever form it came in
function cargoOf(G, c) {
  const arts = [], seen = new Set();
  for (const x of c.arts || []) {
    let work = null, w = 0, h = 0;
    if (typeof x === 'number' || typeof x === 'string') { const a = G.museum && G.museum.arts.find(q => String(q.work.id) === String(x)); if (a) { work = a.work; w = a.w; h = a.h; } }
    else if (x && x.work) { work = x.work; w = x.w; h = x.h; }
    else if (x && (x.img || x.url)) { work = x; }
    if (!work || work.c || seen.has(work.id)) continue;            // public domain only
    seen.add(work.id);
    if (!(w > 0 && h > 0)) { const ar = work.iw && work.ih ? work.iw / work.ih : work.w && work.h ? work.w / work.h : 0.8; h = work.h ? work.h / 100 : 0.8; w = work.w ? work.w / 100 : h * ar; if (!(w > 0)) w = h * ar; }
    arts.push({ id: work.id, work, w, h, url: x.url || null });
  }
  const books = [], bookKeys = [];
  for (const b of c.books || []) { if (typeof b === 'string') bookKeys.push(b); else if (b && b.t) books.push({ k: b.k || b.t, t: b.t, a: b.a || '', y: b.y || '' }); }
  const items = [];
  for (const it of c.items || []) { const id = typeof it === 'string' ? it : it && (typeof it.kind === 'string' ? it.kind : it.kind && it.kind.id); const k = KINDS.find(q => q.id === id); if (k) items.push({ kind: k.id, name: (it && it.name) || k.name, K: k }); }
  return { arts, books, bookKeys, items };
}

// ------------------------------------------------------------------ styles --
const CSS = `
body.voyaging #hud > :not(#tx):not(#drive):not(#toast) { display: none !important; }
body.voyaging #bLook { display: none !important; }
body.vcine #hud, body.vcine #voyage .vhint { display: none !important; }
#voyage { position: fixed; inset: 0; pointer-events: none; z-index: 20; font-family: var(--serif); color: var(--cream); }
#voyage[hidden] { display: none; }
#voyage button { pointer-events: auto; }
#voyage .vtop { position: absolute; top: max(14px, env(safe-area-inset-top)); left: max(14px, env(safe-area-inset-left)); right: max(14px, env(safe-area-inset-right)); display: flex; gap: 12px; align-items: center; }
#voyage .vstage { font: 12px/1.4 var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--gilt); text-shadow: 0 1px 8px #000; flex: 1; }
#voyage .vbtns { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
#voyage .vbtn { height: 40px; padding: 0 14px; border-radius: 8px; border: 1px solid rgba(226,205,148,.5); background: rgba(8,9,14,.62); color: var(--gilt); font: 700 12px var(--mono); letter-spacing: .12em; }
#voyage .vbtn.gold { background: rgba(226,205,148,.9); color: #14120c; border-color: #fff; box-shadow: 0 0 18px rgba(226,205,148,.45); }
#voyage .vbtn kbd { margin-left: 6px; font-size: 10px; padding: 1px 5px; }
.touch #voyage .vbtn kbd { display: none; }
#voyage .vcap { position: absolute; left: 0; right: 0; top: 24%; text-align: center; font-style: italic; font-size: clamp(18px, 2.6vw, 30px); text-shadow: 0 2px 18px #000, 0 0 3px #000; opacity: 0; transition: opacity 1.1s ease; padding: 0 20px; }
#voyage .vcap.on { opacity: 1; }
#voyage .vcall { position: absolute; left: 0; right: 0; top: 38%; text-align: center; font: 700 clamp(26px, 5vw, 60px) var(--serif); letter-spacing: .16em; color: var(--gilt); text-shadow: 0 0 34px rgba(226,205,148,.6), 0 2px 12px #000; opacity: 0; transition: opacity .8s ease; padding: 0 12px; }
#voyage .vcall.on { opacity: 1; }
#voyage .vhint { position: absolute; left: 0; right: 0; bottom: calc(max(16px, env(safe-area-inset-bottom)) + 130px); text-align: center; font: 12px var(--mono); letter-spacing: .08em; color: #cfc8b6; text-shadow: 0 1px 6px #000; opacity: 0; transition: opacity 1s; }
#voyage .vhint.on { opacity: .9; }
.touch #voyage .vhint { display: none; }
#voyage .vpanel { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(4,5,9,.72); pointer-events: auto; padding: 16px; }
#voyage .vpanel[hidden] { display: none; }
#voyage .vbox { width: min(560px, 100%); max-height: 100%; overflow: auto; background: rgba(10,12,18,.94); border: 1px solid rgba(226,205,148,.45); border-radius: 6px; padding: 22px 22px 18px; box-shadow: 0 10px 60px rgba(0,0,0,.6); }
#voyage .vbox h2 { margin: 0 0 4px; font-weight: 400; font-size: 24px; letter-spacing: .16em; text-transform: uppercase; color: var(--gilt); }
#voyage .vbox .over { font: 11px var(--mono); letter-spacing: .16em; text-transform: uppercase; color: var(--gilt-dim); margin-bottom: 14px; }
#voyage .vbox .col { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
#voyage .vbox .col button { text-align: left; padding: 12px 16px; border-radius: 4px; border: 1px solid rgba(226,205,148,.45); background: rgba(226,205,148,.1); }
#voyage .vbox .col button b { display: block; font-weight: 400; font-size: 19px; letter-spacing: .08em; color: var(--gilt); }
#voyage .vbox .col button span { display: block; font-size: 13px; color: #cfc8b6; margin-top: 3px; }
#voyage .vbox .col button:hover, #voyage .vbox .col button:focus-visible { background: rgba(226,205,148,.26); border-color: var(--gilt); }
#voyage .vbox dl { display: grid; grid-template-columns: 1fr auto; gap: 6px 18px; margin: 6px 0 4px; font-size: 15px; }
#voyage .vbox dt { color: #cfc8b6; } #voyage .vbox dd { margin: 0; text-align: right; font: 600 14px var(--mono); color: var(--cream); letter-spacing: .04em; }
#voyage .vbox .trophy { display: flex; gap: 10px; align-items: center; margin: 12px 0 2px; padding: 8px 12px; border-radius: 4px; background: rgba(241,200,75,.14); border: 1px solid rgba(241,200,75,.5); color: #f1c84b; font-size: 15px; }
#voyage .vfade { position: absolute; inset: 0; background: #000; opacity: 0; transition: opacity .7s ease; }
#voyage .vfade.white { background: #f6f8ff; }
#voyage .vcredits { position: absolute; inset: 0; overflow: hidden; background: linear-gradient(90deg, rgba(0,0,0,.55), rgba(0,0,0,0) 45%); }
#voyage .vcredits[hidden] { display: none; }
#voyage .roll { position: absolute; left: max(24px, 7vw); width: min(440px, 80vw); top: 100%; text-shadow: 0 2px 10px #000; }
#voyage .roll h3 { margin: 34px 0 6px; font: 11px var(--mono); letter-spacing: .2em; text-transform: uppercase; color: var(--gilt-dim); font-weight: 400; }
#voyage .roll h1 { margin: 0 0 10px; font-weight: 400; font-size: clamp(26px, 4vw, 40px); letter-spacing: .1em; color: var(--gilt); }
#voyage .roll p { margin: 3px 0; font-size: 16px; line-height: 1.4; }
#voyage .roll p i { color: #cfc8b6; }
#voyage .vskip { position: absolute; right: max(16px, env(safe-area-inset-right)); bottom: max(16px, env(safe-area-inset-bottom)); height: 40px; padding: 0 16px; border-radius: 8px; border: 1px solid rgba(226,205,148,.5); background: rgba(8,9,14,.62); color: var(--gilt); font: 700 12px var(--mono); letter-spacing: .12em; }
@media (max-width: 560px) { #voyage .vbtn { height: 36px; padding: 0 10px; font-size: 11px; } #voyage .vstage { font-size: 10px; } }
.reduce #voyage .roll { transition: transform 60s linear !important; }      /* (Reduce motion: the credits roll slowly, the 60 s _credits() asks for. It was 'none' here, which put the whole roll off the top of the screen at once: they could not be read at all.) */
/* Reduce motion: every fade here is a half-second dip to dark. Never a cut (style.css turns transitions off under .reduce, which made each one a hard flash), and never to white. */
.reduce #voyage .vfade { transition: opacity .5s linear !important; }
.reduce #voyage .vfade.white { background: #0a0c12; }
`;

// ---------------------------------------------------------------- voyage --
class Voyage {
  constructor(G, cargo, toy, stage) {
    this.G = G; this.toy = toy; this.t = 0; this.cargo = cargoOf(G, cargo);
    this.phase = 'boot'; this.view = 'cabin'; this.ph = 0;            // ph: seconds in this phase
    this.k = { pos: new V3(0, 0, 0), vel: new V3(), yaw: 0, yawRate: 0, bank: 0, tilt: 0 };
    this.v = toy === 'drone' ? G.drone : G.car;
    this.was = { state: G.state, plan: this.v.plan, music: G.sound.musicOn };
    this.music = new CosmicMusic(G.sound);
    this.stats = { maxAir: 0, earthAir: 0.62 };
    this.lastAir = null; this.trail = []; this.items = [];
    this._ui();
    this._fade(1, false, 0);                                           // black while the scenes are built
    G.state = 'voyage';
    document.body.classList.add('voyaging');
    G.sound.musicOn = false;
    if (G.galleryMusic && G.galleryMusic._switch) { try { G.galleryMusic._switch(null); G.galleryMusic.key = null; } catch { /* fine */ } }
    this._onKey = e => this._key(e); addEventListener('keydown', this._onKey);
    // build next frame, so the black is up first
    requestAnimationFrame(() => setTimeout(() => { try { this._build(stage); } catch (e) { console.error('voyage (building)', e); try { this.end(); } catch (e2) { console.error('voyage (ending)', e2); } } }, 0));      // (a throw in the building left a black screen, and Continue walked back into it: flown home instead, as a voyage that throws in flight is)
  }

  // ------------------------------------------------------------- building --
  _build(stage) {
    const G = this.G, R = G.renderer, px = R.getPixelRatio();
    this.sky = new THREE.Scene(); this.sky.background = new THREE.Color(0x000000);
    this.near = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 6000);
    this.skyCam = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 20, 1.2e6);
    // the sky
    this.stars = makeStarfield(800000, px); this.sky.add(this.stars);
    this.sun = makeSun(36000); this.sun.position.copy(SUN_DIR).multiplyScalar(300000); this.sky.add(this.sun);
    this.earth = makeEarth(EARTH_R, SUN_DIR); this.earth.position.copy(EARTH_C); this.sky.add(this.earth);
    this.moonBall = makeMoonBall(MOON_R); this.moonBall.position.copy(MOON_C); this.moonBall.rotation.y = 2.2; this.sky.add(this.moonBall);
    this.planets = PLANETS.map(([k, az, el, d, r]) => { const p = makePlanet(k, r); p.userData.kind = k; p.position.copy(dirAE(az, el)).multiplyScalar(d); p.userData.r = r; this.sky.add(p); return p; });
    this.skySun = new THREE.DirectionalLight(0xfff4e6, 3.2); this.skySun.position.copy(SUN_DIR); this.sky.add(this.skySun, new THREE.HemisphereLight(0x50607a, 0x101010, 0.55));
    this.galaxy = makeGalaxy(9000, px); this.galaxy.visible = false; this.sky.add(this.galaxy, this.galaxy.userData.far); this.galaxy.userData.far.visible = false;
    // what is near: the craft, its light, the streaks
    this.craft = buildCraft(); this.near.add(this.craft.group);
    this.sunLight = new THREE.DirectionalLight(0xfff4e6, 2.8); this.sunLight.position.copy(SUN_DIR); this.near.add(this.sunLight, this.sunLight.target);
    this.hemi = new THREE.HemisphereLight(0x5c6f90, 0x15161a, 0.45); this.near.add(this.hemi);
    this.streaks = new Streaks(); this.near.add(this.streaks.mesh);
    // the cargo aboard: pictures on the cabin wall, books strapped in, lost things in a net
    this._loadArt();
    this._cargoAboard();
    this._dockToy();
    // the generated pictures of the Earth, the Moon and the rest, if they are there (assets/space): they replace the
    // painted ones as they arrive
    loadSpaceTextures(this).catch(() => {});
    if (this.cargo.bookKeys.length) loadBooks().then(B => { if (!B) return; for (const k of this.cargo.bookKeys) { const b = B.all.find(q => q.k === k); if (b) this.cargo.books.push(b); } this._booksAboard(); }).catch(() => {});
    // and off
    if (stage === 'landed' || stage === 'opened') this._toMoon(stage);
    else this._space(stage === 'space' && voyageSaved());
    this._fade(0, false, 1.2);
  }

  _loadArt() {
    for (const a of this.cargo.arts) {
      const t = a.tex = new THREE.Texture(); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4;
      const put = img => { t.image = img; t.needsUpdate = true; };
      if (a.work.lq) { const q = new Image(); q.onload = () => { if (!a.full) put(q); }; q.src = a.work.lq; }
      const img = new Image(); img.crossOrigin = 'anonymous'; img.referrerPolicy = 'no-referrer';
      img.onload = () => { a.full = true; put(img); }; img.onerror = () => { a.failed = true; };
      img.src = a.url || imageUrl(a.work, 843);
    }
  }

  _cargoAboard() {
    const C = this.craft, arts = this.cargo.arts, spots = C.hangAt(Math.max(1, arts.length));
    arts.forEach((a, i) => {
      const s = spots[i], k = Math.min(1.45 / a.h, s.room / a.w, 1), obj = framedArt(a.tex, a.w * k, a.h * k);
      obj.position.set(s.x, s.y + 0.05, s.z); obj.rotation.y = s.rot; C.cabin.add(obj);
      this.items.push({ kind: 'art', a, obj, state: 'aboard', home: { obj: C.cabin, pos: obj.position.clone(), rot: s.rot }, i });
    });
    // the books, strapped in a rack at the back; the lost things in a net beside it
    const rack = this.rack = new THREE.Group(); rack.position.set(0, 0, CRAFT.IN - 0.8); C.cabin.add(rack);
    rack.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.5).translate(0, 0.62, 0), new THREE.MeshStandardMaterial({ color: 0x2b3138, metalness: 0.6, roughness: 0.4 })));
    rack.add(new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.04, 0.04).translate(0, 0.9, 0.22), new THREE.MeshStandardMaterial({ color: 0xe0b030, roughness: 0.5 })));
    const net = this.net = new THREE.Group(); net.position.set(-2.0, 0, CRAFT.IN - 1.1); C.cabin.add(net);
    net.add(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.5, 16, 1, true).translate(0, 0.25, 0), new THREE.MeshStandardMaterial({ color: 0x8a7a4a, wireframe: true })));
    this.cargo.items.forEach((it, i) => {
      const geo = this._itemGeo(it), obj = new THREE.Mesh(geo, ITEM_MAT);
      const bb = geo.boundingBox, size = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z, bb.max.y - bb.min.y);
      obj.scale.setScalar(Math.min(1.6, 0.36 / size)); obj.userData.base = obj.scale.x;
      obj.position.set(Math.cos(i * 2.4) * 0.2, 0.1 + (i % 3) * 0.08, Math.sin(i * 2.4) * 0.2); obj.rotation.y = i; net.add(obj);
      this.items.push({ kind: 'item', it, obj, state: 'aboard', home: { obj: net, pos: obj.position.clone(), rot: i }, i });
    });
    this._booksAboard();
  }
  _itemGeo(it) { const g = it.K._geo || (it.K._geo = mergeGeos(it.K.make())); g.computeBoundingBox(); return g; }
  _booksAboard() {
    const done = new Set(this.items.filter(q => q.kind === 'book').map(q => q.b.k));
    let n = done.size;
    for (const b of this.cargo.books) {
      if (done.has(b.k)) continue; done.add(b.k);
      const obj = bookMesh(b, n); obj.position.set(-0.7 + (n % 16) * 0.095, 0.65 + Math.floor(n / 16) * 0.32, 0); obj.rotation.y = Math.PI / 2;
      this.rack.add(obj);
      this.items.push({ kind: 'book', b, obj, state: 'aboard', home: { obj: this.rack, pos: obj.position.clone(), rot: Math.PI / 2 }, i: n });
      n++;
    }
    // (books that arrive once the craft has landed: to the shelves if the rest is there already, or out after the toy)
    if (this.moonW && this.where === 'moon') for (const q of this.items) if (q.kind === 'book' && q.state === 'aboard') { if (this.delivered) this._place(q, true); else if (this.trail) { q.state = 'wait'; q.wait = 0.3 + q.i * 0.1; } }
  }

  // the toy: parked in the cabin (the car), or docked on the console (the drone)
  _dockToy() {
    const v = this.v, C = this.craft;
    v.group.visible = true; if (v.shadow) v.shadow.visible = false;
    C.cabin.add(v.group);
    if (v.kind === 'drone') { v.group.position.set(-4.95, 0.98, -1.3); v.group.rotation.set(0, Math.PI / 2, 0); if (v.body) v.body.rotation.set(0, 0, 0); }
    else { v.group.position.set(2.3, 0, 1.4); v.group.rotation.set(0, Math.PI / 2, 0); }
    if (this.G.lamp) this.G.lamp.intensity = 0;
  }

  // ------------------------------------------------------------- the UI --
  _ui() {
    if (!document.getElementById('voyageCss')) { const st = document.createElement('style'); st.id = 'voyageCss'; st.textContent = CSS; document.head.append(st); }
    const el = this.el = document.createElement('div'); el.id = 'voyage';
    el.innerHTML = `<div class="vtop"><button class="chip" data-v="menu" aria-label="Menu">II</button><div class="vstage" role="status"></div><div class="vbtns">
      <button class="vbtn" data-v="view">VIEW<kbd>C</kbd></button><button class="vbtn gold" data-v="dest">DESTINATION<kbd>T</kbd></button><button class="vbtn" data-v="home" hidden>FLY HOME</button></div></div>
      <div class="vcap" role="status" aria-live="polite"></div><div class="vcall" aria-live="assertive"></div><div class="vhint"></div>
      <section class="vpanel vdest" hidden role="dialog" aria-modal="true" aria-label="Destination"><div class="vbox"><div class="over">Destination</div><h2>Where to?</h2><div class="col">
        <button data-v="moon" data-first><b>The Moon: Lunar Base</b><span>The way home for the art.</span></button>
        <button data-v="far"><b>Somewhere far away</b><span>A jump to hyperspace, and a long way out.</span></button>
        <button data-v="close"><b>Not yet</b><span>Keep flying.</span></button></div></div></section>
      <section class="vpanel vpause" hidden role="dialog" aria-modal="true" aria-label="Paused"><div class="vbox"><div class="over">Paused</div><h2>The voyage</h2><div class="col">
        <button data-v="resume" data-first><b>Carry on</b></button><button data-v="home"><b>Fly home</b><span>Back to Butler Field. The night carries on.</span></button><button data-v="new"><b>New game</b><span>Start the night over.</span></button></div></div></section>
      <div class="vcredits" hidden><div class="roll"></div><button class="vskip" data-v="skip">SKIP</button></div>
      <section class="vpanel vsum" hidden role="dialog" aria-modal="true" aria-label="Your night"><div class="vbox"></div></section>
      <div class="vfade"></div>`;
    document.body.append(el);
    el.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) this._act(b.dataset.v); });
    this.$ = s => el.querySelector(s);
  }
  _act(a) {
    const G = this.G;
    G.sound.unlock && G.sound.unlock();
    if (a === 'dest') { if (this.phase === 'space') this._menu('vdest'); }
    else if (a === 'close' || a === 'resume') this._menu(null);
    else if (a === 'menu') this._menu(this.open === 'vpause' ? null : 'vpause');
    else if (a === 'view') this.view = this.view === 'cabin' ? 'outside' : 'cabin';
    else if (a === 'moon') { this._menu(null); this._autoMoon(); }
    else if (a === 'far') { this._menu(null); this._hyper(); }
    else if (a === 'home') { if (!this.opened) return; this._menu(null); this._home(false); }      // (not before the Moon museum has opened: see _menu)
    else if (a === 'new') { this._menu(null); this._home(true); }
    else if (a === 'skip') { if (this.phase === 'credits') this._summary(); }
    else if (a === 'explore') { this.$('.vsum').hidden = true; this.open = null; this._setPhase('explore'); this._stage('The Moon · Lunar Base'); this.$('[data-v="home"]').hidden = false; this._cap('The Moon is yours. Fly home whenever you like.', 5); }
  }
  _menu(name) {
    for (const n of ['vdest', 'vpause']) this.$('.' + n).hidden = n !== name;
    // Fly home is offered once the museum on the Moon has opened, here as in the top bar. Taken sooner it saved the voyage as
    // over with the ending not reached, and nothing started one again.
    if (name === 'vpause') this.$('.vpause [data-v="home"]').hidden = !this.opened;
    this.open = name;
    if (name) { const f = this.$('.' + name + ' [data-first]'); if (f) f.focus({ preventScroll: true }); }
    else this.G.renderer.domElement.focus({ preventScroll: true });
  }
  _key(e) {
    if (!this.on() || e.repeat) return;
    if (e.code === 'KeyT' && this.phase === 'space') { e.preventDefault(); this._menu(this.open === 'vdest' ? null : 'vdest'); }
    else if (this.open === 'vdest' && (e.code === 'Digit1' || e.code === 'Digit2')) { e.preventDefault(); this._act(e.code === 'Digit1' ? 'moon' : 'far'); }
  }
  on() { return this.G.voyage === this; }
  _stage(text) { const s = this.$('.vstage'); if (s.textContent !== text) s.textContent = text; }
  _cap(text, hold = 4, at = 0) {
    clearTimeout(this._capT); clearTimeout(this._capT2);
    this._capT2 = setTimeout(() => { const c = this.$('.vcap'); c.textContent = text; c.classList.add('on'); this._capT = setTimeout(() => c.classList.remove('on'), hold * 1000); }, at * 1000);
  }
  _call(text, hold = 3.5) { const c = this.$('.vcall'); c.textContent = text; c.classList.add('on'); clearTimeout(this._callT); this._callT = setTimeout(() => c.classList.remove('on'), hold * 1000); }
  _hint(text) { const h = this.$('.vhint'); h.textContent = text || ''; h.classList.toggle('on', !!text); }
  // to black (or white) and back: k 1 covered, 0 clear, over `s` seconds
  _fade(k, white = false, s = 0.7) { const f = this.$('.vfade'); f.classList.toggle('white', white); f.style.transition = `opacity ${s}s ease`; f.style.opacity = k; }
  _setPhase(p) { this.phase = p; this.ph = 0; }

  // ---------------------------------------------------------------- space --
  _space(resumed) {
    const k = this.k; k.pos.set(0, 0, 0); k.vel.set(0, 0, -30); k.yaw = 0;
    this.where = 'space'; this._setPhase('space'); this.view = 'cabin';
    this._skyFor('space');
    this.music.setMode('space');
    this._stage('Over the Earth · night side');
    document.body.classList.add('flying');
    this._cap(resumed ? 'Back aboard. The art is safe on the walls.' : 'Clear of the Earth. The art is aboard.', 5, 1);
    this._hint('W S forward and back · A D turn · ↑ ↓ climb and dive · ← → slide · C view · T destination'); clearTimeout(this._hintT); this._hintT = setTimeout(() => { if (this.phase === 'space') this._hint(null); }, 20000);
    save('space', this);
  }
  _skyFor(where) {
    const solar = where === 'space';
    this.earth.visible = true; this.moonBall.visible = solar; for (const p of this.planets) p.visible = solar;
    this.galaxy.visible = this.galaxy.userData.far.visible = where === 'deep';
    this.sun.visible = where !== 'deep'; this.earth.visible = where !== 'deep';
    if (this.milkyBand) this.milkyBand.visible = where !== 'deep';
    const E = this.earth.userData;
    if (where === 'moon') {
      this.earth.position.copy(MOON_EARTH).multiplyScalar(60000); this.earth.scale.setScalar(2300 / EARTH_R);
      E.mat.uniforms.uSun.value.copy(MOON_SUN);
      this.sun.position.copy(MOON_SUN).multiplyScalar(300000);
      this.sunLight.position.copy(MOON_SUN); this.sunLight.intensity = 3.0; this.hemi.intensity = 0.75; this.hemi.color.set(0x6a7894);
      this.earth.userData.earth.rotation.x = -0.4;
    } else {
      this.earth.position.copy(EARTH_C); this.earth.scale.setScalar(1); E.mat.uniforms.uSun.value.copy(SUN_DIR);
      this.sun.position.copy(SUN_DIR).multiplyScalar(300000); this.sunLight.position.copy(SUN_DIR); this.sunLight.intensity = 2.8; this.hemi.intensity = 0.45;
    }
  }

  _pilot(dt, inp) {
    const k = this.k, s = Math.sin(k.yaw), c = Math.cos(k.yaw);
    const f = new V3(-s, 0, -c), r = new V3(c, 0, -s);
    k.vel.addScaledVector(f, inp.pitch * 70 * dt).addScaledVector(r, inp.roll * 45 * dt); k.vel.y += inp.climb * 40 * dt;
    k.vel.multiplyScalar(Math.exp(-0.12 * dt));
    if (k.vel.length() > 900) k.vel.setLength(900);
    k.yawRate += (-inp.yaw * 0.9 - k.yawRate) * Math.min(1, dt * 2.5); k.yaw += k.yawRate * dt;
    k.pos.addScaledVector(k.vel, dt);
    this._keepClear();
    k.bank += ((-k.yawRate * 0.35 - inp.roll * 0.14) - k.bank) * Math.min(1, dt * 3);
    k.tilt += ((-inp.pitch * 0.06 + inp.climb * 0.05) - k.tilt) * Math.min(1, dt * 3);
    this.thrust = Math.min(1, 0.3 + Math.abs(inp.pitch) * 0.5 + Math.abs(inp.climb) * 0.3 + Math.abs(inp.roll) * 0.2);
  }
  // Not into the Earth, the Moon or a planet: pushed out to just above it, and what was going inwards is lost.
  _keepClear() {
    const k = this.k, bodies = [[EARTH_C, EARTH_R + 120], ...this.planets.map(p => [p.position, p.userData.r * 1.15])];
    if (this.phase === 'space') bodies.push([MOON_C, MOON_R * 1.2]);
    for (const [c, R] of bodies) {
      const d = k.pos.clone().sub(c), l = d.length();
      if (l < R) { d.divideScalar(l || 1); k.pos.copy(c).addScaledVector(d, R); const into = k.vel.dot(d); if (into < 0) k.vel.addScaledVector(d, -into); }
    }
  }
  _placeCraftSpace() {
    const k = this.k, g = this.craft.group;
    g.position.copy(k.pos); g.rotation.set(k.tilt, k.yaw, k.bank, 'YXZ');
  }

  // Into the Moon's pull: the autopilot takes it in on a long curve, and the Moon comes up to fill the window.
  _autoMoon() {
    if (this.phase !== 'space' && this.phase !== 'back') return;
    const k = this.k, from = k.pos.clone(), dist = from.distanceTo(MOON_C);
    const n = from.clone().sub(MOON_C).normalize().lerp(new V3(0, 1, 0), 0.35).normalize();
    const Q = MOON_C.clone().addScaledVector(n, MOON_R * 1.22);
    const fwd = k.vel.lengthSq() > 100 ? k.vel.clone().normalize() : new V3(-Math.sin(k.yaw), 0, -Math.cos(k.yaw));
    this.path = { p0: from, p1: from.clone().addScaledVector(fwd, dist * 0.3), p2: Q.clone().addScaledVector(n, dist * 0.28), p3: Q, T: clamp(dist / 900, 8, 15) };
    this._setPhase('auto'); this._menu(null); this._hint(null);
    this._cap('Course set: Lunar Base.', 4);
    this._stage('Autopilot · to the Moon');
    G_bell(this, 2);
  }
  _bez(u, out, d) {
    const { p0, p1, p2, p3 } = this.path, a = 1 - u;
    out.set(0, 0, 0).addScaledVector(p0, a * a * a).addScaledVector(p1, 3 * a * a * u).addScaledVector(p2, 3 * a * u * u).addScaledVector(p3, u * u * u);
    if (d) d.set(0, 0, 0).addScaledVector(p1.clone().sub(p0), 3 * a * a).addScaledVector(p2.clone().sub(p1), 6 * a * u).addScaledVector(p3.clone().sub(p2), 3 * u * u);
  }

  // Somewhere far away: the stars stretch into streaks, a flash, a far spiral, and then the way back.
  _hyper() {
    if (this.phase !== 'space') return;
    this.jumpFrom = { pos: this.k.pos.clone(), yaw: this.k.yaw };
    this._setPhase('jump'); this._hint(null); this._stage('Hyperspace');
    this.music.setMode('hyper');
    this._cap('Hold on.', 2);
  }

  // ------------------------------------------------------------- the Moon --
  _toMoon(stage = 'landing') {
    const G = this.G;
    this.where = 'moon';
    if (!this.moonW) {
      const n = this.cargo.arts.length;
      this.P = G.moonPlan = moonPlan(n); this.moonW = buildMoon(this.P, n); this.near.add(this.moonW.group);
      this.visitors = new Visitors(10); this.near.add(this.visitors.group);
      this.dust = new Dust(900, G.renderer.getPixelRatio()); this.near.add(this.dust.points);
      applySpaceTextures(this);
    }
    this._skyFor('moon');
    const C = this.craft, g = C.group;
    g.rotation.set(0, SAUCER.yaw, 0, 'YXZ');
    this.music.setMode('moon');
    this.streaks.update(0, 0);
    document.body.classList.toggle('flying', this.v.kind === 'drone');
    if (stage === 'landing') {
      g.position.set(SAUCER.x + 40, CRAFT.LEG + 70, SAUCER.z + 30); C.setLegs(0); C.setRamp(0);
      this._setPhase('landing'); this._stage('Lunar Base');
      this._cap('The Moon. Lunar Base, and its museum, waiting.', 5, 1.5);
    } else {
      g.position.set(SAUCER.x, CRAFT.LEG, SAUCER.z); C.setLegs(1); C.setRamp(1); this.P.rampOn(true);
      this._outOnTheMoon(true);
      if (stage === 'opened') {
        for (const q of this.items) this._place(q, true);
        this.delivered = true; this.opened = true;
        this.moonW.setSign(1); this.moonW.setLights(1); this.visitors.settle(this.moonW.layout.slots);
        this._setPhase('explore'); this._stage('The Moon · Lunar Base'); this.$('[data-v="home"]').hidden = false;
        this._cap('The Museum is Open, and the Moon is yours.', 5, 0.5); this._hint(null);
        this.v.place(DOME.x + 3, DOME.z + DOME.OUT + DOME.PORCH + 4, Math.PI * 0.85);
      } else { this._cap('Back on the Moon. The art is waiting by the ramp.', 5, 0.5); this._stage('Lunar Base'); }
    }
    this.$('[data-v="dest"]').hidden = true; this.$('[data-v="view"]').hidden = true;
  }

  // The toy is let out: its plan and its gravity are the Moon's from now until it flies home.
  _outOnTheMoon(resumed) {
    const v = this.v, P = this.P, s = P.spawn;
    this.near.add(v.group); if (v.shadow) { this.near.add(v.shadow); v.shadow.visible = true; }
    v.group.rotation.set(0, 0, 0); v.group.scale.setScalar(1);
    v.plan = P; v.gravity = MOON_G;
    if (v.kind === 'drone') v.place(s.x, s.z, s.yaw, s.y + 0.6); else v.place(s.x, s.z, s.yaw, s.y);
    this.G.camYaw = v.yaw; this.camYaw = v.yaw;
    this._setPhase('moon'); this.trail = [];
    for (const q of this.items) if (q.state === 'aboard') { q.state = 'wait'; q.wait = 0.6 + this.items.indexOf(q) * (resumed ? 0.05 : 0.45); }
    this._hint(v.kind === 'drone' ? 'W S fly · A D turn · ↑ ↓ climb · drive into the dome' : 'W A S D drive · Space jump (hold it: higher) · R back to the ramp · take the art into the dome');
    save('landed', this);
    clearTimeout(this._hintT); this._hintT = setTimeout(() => this._hint(null), 14000);
  }

  // Into the dome, everything goes to its place: pictures to the wall, books to the shelves, lost things to the cabinet.
  _deliver() {
    if (this.delivered) return;
    this.delivered = true; this._setPhase('deliver');
    const L = this.moonW.layout; let delay = 0.3, note = 0;
    this._cap('Welcome to the Lunar Museum of Art.', 5);
    for (const q of this.items) {
      if (q.state === 'placed') continue;
      const to = this._slotFor(q);
      q.fly = { from: this._worldPos(q), to, t: -delay, T: q.kind === 'art' ? 2.4 : 1.6, note: q.kind === 'art' ? note++ : -1, fromQ: q.obj.getWorldQuaternion(new THREE.Quaternion()) };
      q.state = 'fly';
      if (q.obj.parent !== this.near) this.near.attach(q.obj);
      delay += q.kind === 'art' ? 0.55 : q.kind === 'book' ? 0.14 : 0.32;
    }
    void L;
  }
  _worldPos(q) { return q.obj.getWorldPosition(new V3()); }
  _slotFor(q) {
    const M = this.moonW, D = DOME;
    if (q.kind === 'art') {
      const s = M.layout.slots[q.i], a = q.a, k = Math.min(s.tall / a.h, s.room / a.w, 2.4);
      if (!q.scaled) { q.scaleTo = k / Math.min(1.45 / a.h, this.craft.hangAt(this.cargo.arts.length)[q.i].room / a.w, 1); q.scaled = true; }
      return { pos: new V3(s.x, s.y, s.z), rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s.rot, 0)), scale: q.scaleTo };
    }
    if (q.kind === 'book') {
      const spots = M.shelfSpots, per = 26, sp = spots[Math.floor(q.i / per) % spots.length], j = q.i % per;
      const p = new V3(-sp.w / 2 + 0.1 + j * 0.105, sp.y + 0.02, 0.02); sp.unit.localToWorld(p);
      const rot = new THREE.Quaternion(); sp.unit.getWorldQuaternion(rot); rot.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)));
      return { pos: p, rot, scale: 1 };
    }
    const spots = M.cabSpots, sp = spots[q.i % spots.length], j = Math.floor(q.i / spots.length), n = Math.ceil(this.cargo.items.length / spots.length);
    const p = new V3(D.x - sp.w / 2 + (j + 0.5) * sp.w / Math.max(1, n), sp.y, D.z);
    return { pos: p, rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.4 + q.i, 0)), scale: q.obj.userData.base ? Math.min(q.obj.userData.base * 1.25, 0.55 / Math.max(0.2, 1)) / q.obj.userData.base : 1 };
  }
  // Straight to its place (a game picked up later).
  _place(q, quick) {
    const to = this._slotFor(q);
    if (q.obj.parent !== this.near) this.near.attach(q.obj);
    q.obj.position.copy(to.pos); q.obj.quaternion.copy(to.rot); if (to.scale && to.scale !== 1) q.obj.scale.multiplyScalar(to.scale);
    q.state = 'placed'; void quick;
  }

  // The opening: lights, visitors, the sign, the motif in full, and then the credits.
  _open() {
    const G = this.G;
    this.opened = true;
    this.moonW.setSign(0);
    save('opened', this);
    try { localStorage.setItem(DONE, '1'); } catch { /* fine */ }
    try { G.trophies.flag('moonOpen'); G.trophies.check(G.trophies.snap(G, G.score)); } catch (e) { console.warn('trophy', e); }
    if (G.tm && G.tm.event) try { G.tm.event('moon', 'open'); } catch { /* fine */ }
    this.music.setMode('finale');
    this._call('THE MUSEUM IS OPEN', 5);
  }

  // ----------------------------------------------------------- the ending --
  _credits() {
    this._setPhase('credits');
    const c = this.$('.vcredits'), roll = this.$('.roll');
    const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    const arts = this.cargo.arts.map(a => `<p>${esc(a.work.t)}<br><i>${esc(a.work.a || 'Unknown maker')}${a.work.d ? ', ' + esc(a.work.d) : ''}</i></p>`).join('');
    const books = this.cargo.books.slice(0, 20).map(b => `<p>${esc(b.t)}<br><i>${esc(b.a || '')}</i></p>`).join('');
    const items = this.cargo.items.map(i => `<p>${esc(i.name.replace(/^(a|an|somebody’s) /i, s => s[0].toUpperCase() + s.slice(1)))}</p>`).join('');
    roll.innerHTML = `<h1>Sorry, the Museum<br>is Closed</h1><p><i>The Museum is Open.</i></p>
      <h3>The collection on the Moon</h3>${arts || '<p>The walls are waiting.</p>'}
      ${books ? `<h3>On the shelves</h3>${books}` : ''}${items ? `<h3>Curiosities from Earth</h3>${items}` : ''}
      <h3>The art</h3><p>The Art Institute of Chicago, from its open API.</p><p><i>Images are public domain; data is CC0.</i></p>
      <h3>The books</h3><p>Open Library</p>
      <h3>The city</h3><p><i>Streets and gardens</i> © OpenStreetMap contributors</p>
      <h3>The music</h3><p>Synthesised in the game, note by note.</p><p><i>The craft's five-note call is our own.</i></p>
      <h3>The visitors</h3><p>Themselves</p>
      <h3>&nbsp;</h3><p><i>A fan project, not affiliated with the museum.</i></p><p>Thank you for visiting.</p><p style="height:40vh"></p>`;
    c.hidden = false;
    const dur = this.G.set.reduce ? 60 : 44;
    roll.style.transition = 'none'; roll.style.transform = 'translateY(0)';
    void roll.offsetHeight;
    roll.style.transition = `transform ${dur}s linear`;
    roll.style.transform = `translateY(calc(-100% - 100vh))`;
    this.creditsT = dur;
  }

  _summary() {
    if (this.phase === 'summary') return;
    const G = this.G;
    this._setPhase('summary'); this.$('.vcredits').hidden = true;
    const m = G.museum, sc = G.secrets, F = G.finale && G.finale.stats || {};
    const row = (k, v) => `<dt>${k}</dt><dd>${v}</dd>`;
    const secs = Math.round((G.tm && G.tm.play) || G.t || 0), time = secs >= 3600 ? `${Math.floor(secs / 3600)} h ${Math.floor(secs % 3600 / 60)} min` : `${Math.floor(secs / 60)} min ${secs % 60} s`;
    const has = id => sc && sc.has && sc.has(id);
    // Tonight's ornaments and home runs (kept by lightshow.js and ballpark.js in features.js tonight()).
    const N = tonight();
    const orn = F.ornaments != null ? String(F.ornaments) : N.ornaments ? (N.ornamentsBest ? `${N.ornamentsBest} of ${N.ornamentsOf || 12} in one Light Run` : String(N.ornaments)) : has('ornaments') ? 'every one, in one run' : 'none yet';
    const hr = F.homeRuns != null ? String(F.homeRuns) : N.homeRuns ? `${N.homeRuns} (best round ${N.bestRound || N.homeRuns})` : has('derbyhr') || has('homerun') ? 'yes' : 'none yet';
    const a = this.cargo.arts.length, b = this.cargo.books.length, it = this.cargo.items.length;
    const box = this.$('.vsum .vbox');
    box.innerHTML = `<div class="over">The Lunar Museum of Art</div><h2>Your night</h2><dl>
      ${m ? row('Works seen', `${m.seenCount.toLocaleString()} of ${m.arts.length.toLocaleString()}`) : ''}
      ${G.score ? row('Looked at closely', G.score.looked.toLocaleString()) : ''}
      ${sc ? row('Secrets found', `${sc.count} of ${sc.total}`) : ''}
      ${row('Time', time)}${row('Ornaments', orn)}${row('Home runs', hr)}
      ${row('Art brought to the Moon', a)}${row('Books on its shelves', b)}${row('Curiosities in its cabinet', it)}
      ${this.stats.maxAir > 0 ? row('Longest air on the Moon', this.stats.maxAir.toFixed(1) + ' s') : ''}</dl>
      <div class="trophy">★ Trophy: <b>The Museum is Open</b></div>
      <div class="col"><button data-v="explore" data-first><b>Keep exploring the Moon</b><span>One-sixth gravity, a crater jump park, the visitors in the dome.</span></button>
      <button data-v="home"><b>Fly home</b><span>Back to Butler Field. The night carries on.</span></button>
      <button data-v="new"><b>New game</b><span>Start the night over.</span></button></div>`;
    this.$('.vsum').hidden = false; this.open = 'vsum';
    const f = box.querySelector('[data-first]'); if (f) f.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------- going home --
  _home(fresh) {
    if (this.leaving) return; this.leaving = true;
    this._cap(fresh ? '' : 'Home, then.', 2);
    this._fade(1, false, 0.8);
    setTimeout(() => { this.end(fresh); }, 850);
  }

  /** Give everything back: the city drawn again, the toy on Butler Field with Earth's plan and gravity. */
  end(fresh = false) {
    const G = this.G, v = this.v;
    if (!this.on()) return;
    if (!fresh) { const s = voyageSaved(); if (s) { s.stage = 'home'; try { localStorage.setItem(SAVE, JSON.stringify(s)); } catch { /* fine */ } } }
    removeEventListener('keydown', this._onKey);
    clearTimeout(this._capT); clearTimeout(this._capT2); clearTimeout(this._callT); clearTimeout(this._hintT);
    this.music.stop();
    for (const t of [G.car, G.drone]) { if (!t) continue; t.plan = G.plan; t.gravity = GRAVITY; G.scene.add(t.group); if (t.shadow) G.scene.add(t.shadow); t.group.scale.setScalar(1); }
    G.renderer.autoClear = true;
    document.body.classList.remove('voyaging', 'vcine');
    G.sound.musicOn = this.was.music !== false;
    G.voyage = null; G.moonPlan = null;
    G.state = 'play';
    if (G.shell && G.shell.setVehicle) G.shell.setVehicle(v.kind);
    if (G.lamp) G.lamp.intensity = G.lampOn ? 70 : 0;      // (put out while the toy was docked, _dockToy: back as the Lights button says)
    const L = G.plan.lakefront, S = G.plan.grounds && G.plan.grounds.silo;
    const at = S ? { x: (S.x0 + S.x1) / 2 - 22, z: (S.z0 + S.z1) / 2 } : L ? { x: 381, z: 110 } : G.plan.spawn;
    const yaw = S ? Math.PI / 2 : -Math.PI / 2;      // facing the silo, to watch it close
    if (v.kind === 'drone') v.place(at.x, at.z, yaw, 1.2); else v.place(at.x, at.z, yaw, 0);
    G.camYaw = v.yaw;
    if (G.shell && G.shell.chase) G.shell.chase();
    // the voyage's scenes go
    for (const s of [this.sky, this.near]) if (s) { disposeAll(s); s.clear(); }
    for (const a of this.cargo.arts) if (a.tex) a.tex.dispose();
    this.el.remove();
    if (fresh && G.shell && G.shell.newGame) { clearVoyage(); G.shell.newGame(); }
    else {
      // The craft is home below: the silo stands open beside you, and closes over it (src/finale.js hangar.doors).
      try { const h = G.finale && G.finale.hangar; if (h && h.doors) { h.doors.set(1); setTimeout(() => h.doors.close(6), 1200); } } catch (e) { console.warn('silo doors', e); }
      if (G.features && G.features.kit && G.features.kit.say) G.features.kit.say('Back on Butler Field. Below you, the silo closes.', 0.5, 6);
    }
  }

  // ------------------------------------------------------------- per frame --
  frame(dt) {
    const G = this.G; this.t += dt; this.ph += dt;
    if (G.tm) G.tm.play += dt;
    G.input.capture = !this.open;
    if (!this.near) { G.renderer.setRenderTarget(null); G.renderer.clear(); return; }
    const inp0 = G.input.read(this.where === 'moon' ? this.v.kind === 'drone' : true);
    let inp = G.testInput || inp0;
    if (G.input.took('pause')) { if (this.open === 'vsum') { /* stays */ } else this._menu(this.open ? null : 'vpause'); }
    if (G.input.took('camera') && this.where === 'space') this.view = this.view === 'cabin' ? 'outside' : 'cabin';
    if (this.open) inp = this.where === 'moon' && this.v.kind === 'car' ? { throttle: 0, steer: 0 } : { pitch: 0, roll: 0, yaw: 0, climb: 0 };
    const reset = G.input.took('reset');
    const k = this.k, C = this.craft;
    C.animate(this.t, this.lit != null ? this.lit : -1, this.phase === 'jump' ? 3 : 1);
    if (this.where === 'space') this._frameSpace(dt, inp);
    else this._frameMoon(dt, inp, reset);
    this.music.update();
    // the motor: the saucer's hum in space, the toy's own on the Moon
    const hum = this.where === 'space' || this.phase === 'landing' || this.phase === 'ramp';
    G.sound.update(hum ? { kind: 'drone', spec: { hum: 'ufo' }, thrust: this.thrust || 0.4, landed: false, vel: k.vel } : this.v, !this.open && this.phase !== 'summary');
    this._lcd(inp0);
    this._render();
    void V3;
  }

  _frameSpace(dt, inp) {
    const k = this.k, C = this.craft, G = this.G;
    const ph = this.phase;
    if (ph === 'space') {
      this._pilot(dt, inp);
      if (k.pos.distanceTo(MOON_C) < MOON_R * 1.9) this._autoMoon();
      this._stage(k.pos.distanceTo(MOON_C) < 5000 ? 'Nearing the Moon' : k.pos.distanceTo(EARTH_C) < EARTH_R + 1500 ? 'Over the Earth · night side' : 'Between the Earth and the Moon');
      if (this.ph > 14 && !this._told) { this._told = true; this._cap('DESTINATION when you are ready. Or fly out to the planets first.', 6); }
    } else if (ph === 'auto') {
      const P = this.path, u = ease(this.ph / P.T), d = new V3();
      this._bez(u, k.pos, d);
      if (d.lengthSq() > 1) { const yw = Math.atan2(-d.x, -d.z); k.yawRate = angDiff(yw, k.yaw) / Math.max(dt, 1e-3) * 0.1; k.yaw += angDiff(yw, k.yaw) * Math.min(1, dt * 3); }
      k.bank += (-clamp(k.yawRate, -1, 1) * 0.3 - k.bank) * Math.min(1, dt * 2); k.tilt += (clamp(-d.y / Math.max(1, d.length()), -0.3, 0.3) * 0.5 - k.tilt) * Math.min(1, dt * 2);
      k.vel.copy(d).divideScalar(P.T);
      this.thrust = 0.8;
      if (this.ph > P.T - 1.0 && !this._white) { this._white = true; this._fade(1, true, 0.9); }
      if (this.ph >= P.T) { this._white = false; this._toMoon('landing'); this._fade(0, true, 1.4); return this._placeCraftSpace && null; }
    } else if (ph === 'jump') {
      // the engines wind up, the stars stretch, a flash, and out
      const s = ease(this.ph / 2.8);
      this.streaks.update(dt, s);
      k.pos.addScaledVector(new V3(-Math.sin(k.yaw), 0, -Math.cos(k.yaw)), (60 + s * 2000) * dt);
      if (this.ph > 2.9 && !this._white) { this._white = true; this._fade(1, true, this.G.set.reduce ? 0.6 : 0.35); }
      if (this.ph > 3.4) { this._white = false; this._deep(); }
    } else if (ph === 'deep') {
      // a moment of awe; then the way back
      k.pos.addScaledVector(new V3(-Math.sin(k.yaw), 0, -Math.cos(k.yaw)), 25 * dt);
      this.galaxy.rotation.y += dt * 0.012;
      this.streaks.update(dt, Math.max(0, 1 - this.ph * 1.5));
      if (this.ph > 6.2 && !this._course) { this._course = true; this._cap('Course set: Lunar Base.', 4); G_bell(this, 4); }
      if (this.ph > 7) { const target = this.deepYaw + Math.PI, a = ease((this.ph - 7) / 2.4); k.yaw = this.deepYaw + Math.PI * a; k.bank = Math.sin(a * Math.PI) * 0.35; void target; }
      if (this.ph > 9.6) { this._setPhase('jumpBack'); this.music.setMode('hyper'); }
    } else if (ph === 'jumpBack') {
      const s = ease(this.ph / 2.2);
      this.streaks.update(dt, s);
      if (this.ph > 2.3 && !this._white) { this._white = true; this._fade(1, true, 0.35); }
      if (this.ph > 2.8) {
        this._white = false; this._course = false;
        this._skyFor('space'); k.pos.copy(this.jumpFrom.pos); k.vel.set(0, 0, 0);
        k.yaw = Math.atan2(-(MOON_C.x - k.pos.x), -(MOON_C.z - k.pos.z)); k.bank = 0;
        this.music.setMode('space'); this.streaks.update(0, 0);
        this._fade(0, true, 1.2);
        this._setPhase('back'); this._autoMoon();
      }
    }
    this._placeCraftSpace();
    this._camSpace(dt);
  }

  _deep() {
    const k = this.k;
    this._setPhase('deep'); this.deepYaw = k.yaw;
    this._skyFor('deep');
    const f = new V3(-Math.sin(k.yaw), 0, -Math.cos(k.yaw));
    this.galaxy.position.copy(k.pos).addScaledVector(f, 26000).add(new V3(0, 5000, 0));
    this.galaxy.rotation.set(0.95, 0.4, 0.15);
    this.galaxy.userData.far.position.copy(k.pos);
    this.music.setMode('deep');
    this._fade(0, true, 1.6);
    this._stage('Somewhere far away');
    this._cap('Somewhere far away. A spiral of a billion lights.', 5, 0.8);
  }

  _camSpace(dt) {
    const k = this.k, C = this.craft, cam = this.cam;
    C.group.updateMatrixWorld(true);
    const want = new V3(), look = new V3();
    if (this.view === 'cabin' && this.phase !== 'auto') {
      want.set(0, 1.55, 2.6); C.group.localToWorld(want);
      look.set(0, 1.05, -8); C.group.localToWorld(look);
      cam.position.copy(want); cam.up.set(0, 1, 0); cam.lookAt(look);
      cam.fov += (72 - cam.fov) * Math.min(1, dt * 3);
    } else {
      // outside: behind and above, swinging round the craft on the autopilot's curve
      const swing = this.G.set.reduce ? 0 : this.phase === 'auto' ? Math.sin(this.ph * 0.35) * 0.9 : this.phase === 'deep' ? 0.5 : 0;      // (Reduce motion: straight behind, no swing)
      const a = k.yaw + swing, back = this.phase === 'auto' ? 34 : 30;
      want.set(k.pos.x + Math.sin(a) * back, k.pos.y + 8, k.pos.z + Math.cos(a) * back);
      look.set(k.pos.x - Math.sin(k.yaw) * 14, k.pos.y + 1.5, k.pos.z - Math.cos(k.yaw) * 14);
      if (!this._camInit || this._snap) { cam.position.copy(want); this._camInit = true; this._snap = false; }
      else cam.position.lerp(want, 1 - Math.exp(-dt * 4));
      cam.up.set(0, 1, 0); cam.lookAt(look);
      cam.fov += (66 - cam.fov) * Math.min(1, dt * 3);
    }
    // the streaks are laid out in the camera's own frame
    this.streaks.mesh.position.copy(cam.position); this.streaks.mesh.quaternion.copy(cam.quaternion);
    this.skyAt = cam.position;
  }

  _frameMoon(dt, inp, reset) {
    const G = this.G, C = this.craft, v = this.v, M = this.moonW, ph = this.phase;
    if (ph === 'landing') {
      const T = 9, u = ease(this.ph / T), g = C.group;
      g.position.set(SAUCER.x + 40 * (1 - u) * (1 - u), CRAFT.LEG + 70 * Math.pow(1 - u, 1.6), SAUCER.z + 30 * (1 - u) * (1 - u));
      g.rotation.y = SAUCER.yaw + (1 - u) * 0.9; g.rotation.z = this.G.set.reduce ? 0 : Math.sin(this.ph * 1.7) * 0.03 * (1 - u);
      C.setLegs(ease((this.ph - 5) / 3));
      const alt = g.position.y - CRAFT.LEG;
      if (alt < 14 && this.dust) for (let i = 0; i < 6; i++) { const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 6, s = 3 + (14 - alt) * 0.6; this.dust.puff(g.position.x + Math.cos(a) * r, moonH(g.position.x, g.position.z) + 0.05, g.position.z + Math.sin(a) * r, Math.cos(a) * s, 0.4 + Math.random() * 1.5, Math.sin(a) * s, 0.25 + Math.random() * 0.3, 2.5); }
      this.thrust = 0.6;
      if (this.ph >= T) { G.sound.bump && G.sound.bump(5); this._setPhase('ramp'); save('landed', this); this._cap('The ramp is going down.', 3); G.sound.grind && G.sound.grind(3); }
      this._camShot(new V3(SAUCER.x + 42, 8, SAUCER.z + 52), C.group.position.clone().lerp(new V3(SAUCER.x, 0, SAUCER.z), 0.55), dt, 1.5);
    } else if (ph === 'ramp') {
      C.setRamp(ease(this.ph / 3.2));
      this._camShot(new V3(SAUCER.x + 14, 3.4, SAUCER.z - 12), new V3(SAUCER.x, 2, SAUCER.z - 6), dt, 1.2);
      if (this.ph > 3.4) { this.P.rampOn(true); this._outOnTheMoon(false); this._cap(v.kind === 'drone' ? 'One-sixth gravity. Fly out, and the art will follow.' : 'One-sixth gravity. Drive out, and the art will follow you in.', 6); }
    } else {
      // driving (or flying) on the Moon
      const cine = ph === 'ending' || ph === 'credits' || ph === 'summary';
      let i = inp;
      document.body.classList.toggle('vcine', cine);
      if (cine) { const vf = v.vel.x * Math.sin(v.yaw) + v.vel.z * Math.cos(v.yaw); i = v.kind === 'drone' ? { pitch: 0, roll: 0, yaw: 0, climb: 0 } : { throttle: Math.abs(vf) > 0.3 ? -Math.sign(vf) * 0.5 : 0, steer: 0 }; }
      else if (v.kind === 'car' && i.coast && !G.testInput) { const vf = v.vel.x * Math.sin(v.yaw) + v.vel.z * Math.cos(v.yaw); i = { ...i, throttle: vf > 0.4 ? -0.45 : 0 }; }
      if (reset && !cine) { const s = this.P.spawn; v.vel.set(0, 0, 0); if (v.kind === 'drone') v.place(s.x, s.z - 9, s.yaw, 1.5); else v.place(s.x, s.z - 9.5, s.yaw, 0); }
      v.update(dt, i);
      if (v.kind === 'car') {
        if (v.landed && v.landed.air > 0.25) {
          this.lastAir = v.landed; this.stats.maxAir = Math.max(this.stats.maxAir, v.landed.air); this.airShow = this.t + 3.5;
          if (v.landed.air > 3 && !this._bigAir) { this._bigAir = true; this._cap('One-sixth gravity: a hop here lasts as long as six at home.', 5); }
          if (this.dust) this.dust.burst(v.pos.x, v.pos.y, v.pos.z, Math.min(60, 12 + v.landed.impact * 10), 0.8 + v.landed.impact * 0.35, 0.12);
          if (v.landed.impact > 1.5) G.sound.bump(v.landed.impact * 0.5);
        }
        if (v.jumped) { v.jumped = false; G.sound.boing && G.sound.boing(); }
        const sp = Math.hypot(v.vel.x, v.vel.z);
        if (!v.air && sp > 1.2 && this.dust && !this._inDome(v.pos)) {
          const n = Math.min(4, sp * dt * 9 + Math.random()), fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
          for (let j = 0; j < n; j++) { const side = Math.random() < 0.5 ? -1 : 1; this.dust.puff(v.pos.x - fx * 0.16 + fz * side * 0.1, v.pos.y + 0.03, v.pos.z - fz * 0.16 - fx * side * 0.1, -v.vel.x * 0.25 + (Math.random() - 0.5) * 1.2, 0.6 + Math.random() * sp * 0.22, -v.vel.z * 0.25 + (Math.random() - 0.5) * 1.2, 0.05 + Math.random() * 0.06, 2.4); }
        }
      } else if (this.dust) {
        const h = v.pos.y - moonH(v.pos.x, v.pos.z);
        if (h < 1.4 && !this._inDome(v.pos) && Math.random() < 0.7) { const a = Math.random() * Math.PI * 2, s = 1.5 * (1.4 - h); this.dust.puff(v.pos.x, moonH(v.pos.x, v.pos.z) + 0.02, v.pos.z, Math.cos(a) * s, 0.3, Math.sin(a) * s, 0.06, 1.5); }
      }
      this._procession(dt);
      if (!this.delivered && this._inDome(v.pos, 1.2) && v.pos.y < 3) this._deliver();
      if (ph === 'deliver' && this.items.every(q => q.state === 'placed') && this.ph > 1) { this._setPhase('ending'); this.endT = 0; }
      if (ph === 'ending') this._ending(dt);
      else if (ph === 'credits') { this._creditsCam(dt); if (this.ph > this.creditsT + 1) this._summary(); }
      else if (ph === 'summary') this._creditsCam(dt);
      else this._camMoon(dt);
    }
    if (this.visitors) this.visitors.update(dt, this.t, this.where === 'moon' ? v.pos : null);
    if (this.dust) this.dust.update(dt);
    this.skyAt = ORIGIN;
  }
  _inDome(p, margin = 0) { return Math.hypot(p.x - DOME.x, p.z - DOME.z) < DOME.IN - margin; }

  // the cargo: out of the door one by one, then following the toy in a floating line
  _procession(dt) {
    const v = this.v, tr = this.trail, p = v.pos;
    if (!tr.length || tr[0].distanceTo(p) > 0.3) { tr.unshift(p.clone()); if (tr.length > 260) tr.pop(); }
    const at = d => { let acc = 0; for (let i = 1; i < tr.length; i++) { const s = tr[i].distanceTo(tr[i - 1]); if (acc + s >= d) return tr[i - 1].clone().lerp(tr[i], (d - acc) / s); acc += s; } const end = tr.length ? tr[tr.length - 1] : p; return new V3(end.x - Math.sin(v.yaw) * (d - acc), end.y, end.z - Math.cos(v.yaw) * (d - acc)); };      // past the end of the trail: on behind the toy
    let n = 0;
    for (const q of this.items) {
      if (q.state === 'wait') { q.wait -= dt; if (q.wait <= 0) { q.state = 'float'; this.near.attach(q.obj); } else continue; }
      if (q.state === 'float') {
        const idx = q.kind === 'art' ? n++ : n + 2 + (q.kind === 'book' ? q.i * 0.3 : 4 + q.i * 0.4);
        const t = at(2.6 + idx * 1.5).add(new V3(0, 1.6 + 0.25 * Math.sin(this.t * 1.3 + idx), 0));
        t.y = Math.max(t.y, moonH(t.x, t.z) + 1.2);
        q.obj.position.lerp(t, 1 - Math.exp(-dt * 1.8));
        const look = Math.atan2(p.x - q.obj.position.x, p.z - q.obj.position.z);
        const qq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, look, 0)); q.obj.quaternion.slerp(qq, 1 - Math.exp(-dt * 2));
      } else if (q.state === 'fly') {
        const f = q.fly; f.t += dt; if (f.t < 0) continue;
        const u = ease(f.t / f.T), pos = f.from.clone().lerp(f.to.pos, u); pos.y += Math.sin(u * Math.PI) * (q.kind === 'art' ? 2.4 : 1.2);
        q.obj.position.copy(pos); q.obj.quaternion.copy(f.fromQ).slerp(f.to.rot, u);
        if (f.to.scale && f.to.scale !== 1) { const s0 = q.s0 || (q.s0 = q.obj.scale.x); q.obj.scale.setScalar(s0 * (1 + (f.to.scale - 1) * u)); }
        if (u >= 1) { q.state = 'placed'; if (f.note >= 0) this._chime(f.note); else if (q.kind === 'item') this.G.sound.tick(0.05, 2600); }
      }
    }
  }
  _chime(i) {
    const m = this.music; this.lit = i % 5;
    if (m.ctx && m.out) { motifVoice(m.ctx, m.out, MOTIF[i % 5].midi + 12, m.ctx.currentTime + 0.02, 0.6, 0.045); m.played++; }
    clearTimeout(this._litT); this._litT = setTimeout(() => { this.lit = null; }, 500);
  }

  // The opening, as a little film: the lights, the line of visitors, the sign, the walls full.
  _ending(dt) {
    const M = this.moonW, t = this.ph, D = DOME;
    M.setLights(ease(t / 4));
    if (t > 1.2 && !this._filed) { this._filed = true; this.visitors.fileIn(M.layout.slots); this._cap('Somebody has noticed the lights.', 4); }
    const first = this.visitors.list.reduce((m, q) => Math.min(m, Math.hypot(q.x - D.x, q.z - (D.z + D.OUT + D.PORCH))), 99);
    if (!this.flipAt && t > 5 && (first < 3 || t > 14)) { this.flipAt = t; this._open(); }
    if (this.flipAt) M.setSign(ease((t - this.flipAt) / 1.8));
    const porch = new V3(D.x, D.DOOR_H + 1.3, D.z + D.OUT + D.PORCH);
    if (t < 5) this._camShot(new V3(D.x + 4, 2.1, D.z + 7), new V3(D.x - 6 + t, 1.8, D.z - 10), dt, 2);
    else if (!this.flipAt || t < this.flipAt + 4) { const lead = this.visitors.list[0]; this._camShot(new V3(D.x - 2, 1.6, D.z + 31), new V3(lead.x * 0.6 + D.x * 0.4, 1.2, lead.z * 0.6 + (D.z + 19) * 0.4), dt, 1.2); }
    else if (t < this.flipAt + 9) this._camShot(new V3(D.x + 3.5, 3.6, porch.z + 7), porch, dt, 2);
    else this._camShot(new V3(D.x - 5, 3, D.z + 6), new V3(D.x + 6, 1.6, D.z - 9), dt, 1.5);
    if (this.flipAt && t > this.flipAt + 14) this._credits();
  }
  _creditsCam(dt) {
    const D = DOME, a = 0.6 + this.ph * 0.03, r = 46 + Math.min(30, this.ph * 0.6), h = 9 + Math.min(22, this.ph * 0.4);
    this._camShot(new V3(D.x + Math.sin(a) * r, h, D.z + Math.cos(a) * r), new V3(D.x, 6, D.z), dt, 0.8);
  }
  _camShot(at, look, dt, rate = 2) {
    const cam = this.cam;
    if (!this._shot) { cam.position.copy(at); this._shotLook = look.clone(); this._shot = true; }
    cam.position.lerp(at, 1 - Math.exp(-dt * rate)); this._shotLook.lerp(look, 1 - Math.exp(-dt * rate * 1.5));
    cam.up.set(0, 1, 0); cam.lookAt(this._shotLook); cam.fov += (62 - cam.fov) * Math.min(1, dt * 2);
  }
  // behind the toy, a little further back than at home (the jumps are bigger), kept out of walls and off the ground
  _camMoon(dt) {
    const v = this.v, cam = this.cam, drone = v.kind === 'drone';
    this._shot = false;
    this.camYaw = (this.camYaw ?? v.yaw) + angDiff(v.yaw, this.camYaw ?? v.yaw) * Math.min(1, dt * (drone ? 6 : 4));
    const fx = Math.sin(this.camYaw), fz = Math.cos(this.camYaw), dist = drone ? 1.6 : 1.75 + (v.air ? 0.6 : 0), up = drone ? 0.42 : 0.55 + (v.air ? 0.25 : 0);
    const want = new V3(v.pos.x - fx * dist, v.pos.y + up, v.pos.z - fz * dist);
    const from = new V3(v.pos.x, v.pos.y + 0.22, v.pos.z), step = new V3(), hit = new V3();
    const D = from.distanceTo(want), n = Math.max(1, Math.ceil(D / 0.1)); let good = 0;
    for (let i = 1; i <= n; i++) { step.lerpVectors(from, want, i / n); hit.copy(step); if (confine(this.P, hit, 0.14, true, null, false) && hit.distanceToSquared(step) > 0.0009) break; good = i; }
    if (good < n) { want.lerpVectors(from, want, good / n); want.y += (1 - good / n) * 0.5; }
    const gy = groundAt(this.P, want.x, want.z, Math.max(want.y, v.pos.y) + 0.3, 0); if (want.y < gy + 0.12) want.y = gy + 0.12;
    const look = new V3(v.pos.x + Math.sin(v.yaw) * 2.2, v.pos.y + (drone ? 0 : 0.4), v.pos.z + Math.cos(v.yaw) * 2.2);
    if (!this._moonCam) { cam.position.copy(want); this._look = look.clone(); this._moonCam = true; }
    cam.position.lerp(want, 1 - Math.exp(-dt * 9)); this._look.lerp(look, 1 - Math.exp(-dt * 14));
    cam.up.set(0, 1, 0); cam.lookAt(this._look);
    const fov = 70 + Math.min(14, Math.abs(v.speed || 0) * 1.1); cam.fov += (fov - cam.fov) * Math.min(1, dt * 5);
  }

  _lcd(inp) {
    const G = this.G, a = document.getElementById('lcdA'), b = document.getElementById('lcdB');
    if (!a || this.G.t % 0.1 > 0.05) return;
    let A, B;
    if (this.where === 'space') { A = `SAUCER ${Math.round(this.k.vel.length() * 3.6).toLocaleString()} KM/H`; B = this.phase === 'space' ? `MOON ${Math.max(0, (this.k.pos.distanceTo(MOON_C) - MOON_R) / 1000).toFixed(1)} KM` : this.phase === 'auto' || this.phase === 'back' ? 'AUTOPILOT' : 'HYPERSPACE'; }
    else { const v = this.v; A = `${v.kind === 'drone' ? 'DRONE' : 'CAR'} ${Math.round(Math.hypot(v.vel.x, v.vel.z) * 3.6)} KM/H · 1/6 G`; B = this.lastAir && this.t < this.airShow ? `AIR ${this.lastAir.air.toFixed(2)} S  ${this.lastAir.dist.toFixed(1)} M` : v.kind === 'drone' ? `ALT ${(v.pos.y - moonH(v.pos.x, v.pos.z)).toFixed(1)} M` : 'LUNAR BASE'; }
    if (a.textContent !== A) a.textContent = A; if (b.textContent !== B) b.textContent = B;
    // the sticks drawn as they are held
    const st = G.input.sticks, kk = G.input.usedTouch ? 38 : 30, kl = document.querySelector('#stickL i'), kr = document.querySelector('#stickR i');
    if (kl) kl.style.transform = `translate(${st.lx * kk}px,${-st.ly * kk}px)`; if (kr) kr.style.transform = `translate(${st.rx * kk}px,${-st.ry * kk}px)`;
    void inp;
  }

  _render() {
    const R = this.G.renderer, cam = this.cam, sc = this.skyCam, w = innerWidth, h = innerHeight;
    cam.aspect = w / h; cam.near = this.where === 'space' && this.view === 'outside' ? 0.5 : 0.05; cam.far = this.where === 'space' ? 9000 : 6000; cam.updateProjectionMatrix();
    sc.aspect = cam.aspect; sc.fov = cam.fov; sc.position.copy(this.skyAt || ORIGIN); sc.quaternion.copy(cam.quaternion); sc.updateProjectionMatrix();
    this.stars.position.copy(sc.position);
    R.autoClear = false; R.setRenderTarget(null); R.clear();
    R.render(this.sky, sc); R.clearDepth(); R.render(this.near, cam);
  }
}
const ORIGIN = new V3();
const ITEM_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, emissive: 0x202020, emissiveIntensity: 0.4 });
function G_bell(v, n) { const m = v.music; if (!m.ctx || !m.out) return; const t = m.ctx.currentTime; for (let i = 0; i < n; i++) m.bell(MOTIF[i % 5].midi + 12, t + i * 0.18, 0.03, 1.6, 0.3); }
function mergeGeos(list) { return mergeGeometries(list.map(g => { const q = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(q.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') q.deleteAttribute(k); return q; })); }
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// A book: a cloth binding in one of a few colours, its title in gilt down the spine.
const CLOTH = ['#6b1f24', '#1f3b5a', '#2f4a2a', '#4a3423', '#3a2a4a', '#5a4a1a', '#20262e', '#7a5a2a'];
function bookMesh(b, i) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 384; const x = c.getContext('2d');
  x.fillStyle = CLOTH[i % CLOTH.length]; x.fillRect(0, 0, 64, 384);
  x.fillStyle = '#e2cd94'; x.fillRect(0, 18, 64, 3); x.fillRect(0, 363, 64, 3);
  x.save(); x.translate(32, 192); x.rotate(Math.PI / 2); x.textAlign = 'center'; x.textBaseline = 'middle';
  const t = (b.t || '').slice(0, 48); let s = 26; do { x.font = `600 ${s}px Georgia, serif`; s -= 1; } while (x.measureText(t).width > 320 && s > 10);
  x.fillText(t, 0, -6); x.font = `italic 15px Georgia, serif`; x.globalAlpha = 0.8; x.fillText((b.a || '').slice(0, 34), 0, 18); x.restore();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const h = 0.22 + (i * 37 % 9) / 100, w = 0.035 + (i * 13 % 4) / 100, d = 0.17;
  const cloth = new THREE.MeshStandardMaterial({ color: CLOTH[i % CLOTH.length], roughness: 0.85 }), paper = new THREE.MeshStandardMaterial({ color: 0xe9e1cc, roughness: 0.9 });
  const spine = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.15 });
  // the spine faces +x, so a book stood on a shelf (turned a quarter) shows it
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), [cloth, cloth, paper, paper, cloth, cloth]);
  const sp = new THREE.Mesh(new THREE.PlaneGeometry(d, h).rotateY(Math.PI / 2).translate(w / 2 + 0.001, h / 2, 0), spine);
  // (the plane's own +x along the book's depth: turn the texture to run up the spine)
  const uv = sp.geometry.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k), uv.getY(k));
  const g = new THREE.Group(); g.add(m, sp); return g;
}
