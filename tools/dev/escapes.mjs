#!/usr/bin/env node
// What gets out of a living painting (src/escapes.js, docs/ESCAPES.md): the five first tests, filmed and measured.
//   node tools/dev/escapes.mjs <port> [lowmem]
// Serve the repo first with tools/dev/serve.py. One browser, one page, real time.
//
// For each of the five (Homer's keg float, Degas's hats, Goya's lambs and the boy who fetches them, Monet's parasol,
// Seurat's monkey) it lets the thing out the way a player would (the toy watches the show, then drives off; if that
// does not happen it says so and lets it out by the test hook), and records strips of stills of
//   loose   it out of its painting and about the rooms (and the show it left, playing without it)
//   lamp    a robot's lamp finding it, going from its search colour to warm white, and sending it home in strokes
//   herd    the toy behind it as a sheepdog, and it going home by itself
// into ~/Desktop/Museum-life/escapes/ (ESC_OUT=<dir> for somewhere else; lowmem runs go in a lowmem/ folder), each
// strip also as one contact sheet (python3 with PIL, if there is one). It prints for each: the guard (pixels of it on
// any canvas, which must be 0, from the chase camera and four others, in three places), what it costs with it out,
// and any page error. Then the rule itself: the cap, the save over a reload, the switch, the quiet rooms, the
// tracker's dots, reduced motion.
// A lamp is only filmed where one can come: where no robot's beat reaches the rooms a thing knows, it says so and
// takes no lamp strip (in play that thing is only ever herded home).
//   ESC_ONLY=keg,hats      only these (keg hats lambs parasol monkey)
//   ESC_SCENES=loose,lamp  only these scenes (loose lamp herd rules)
//   ESC_SCENES=film        instead of the stills: one short film of each, <key>.mp4 (getting out, about the rooms, a
//                          robot's lamp and the going home in strokes, the toy herding it home), 1280 x 720 at 30 a
//                          second on a clock of the test's own (every frame is drawn and kept, however slow the
//                          machine), put together by ffmpeg (FFMPEG=<path>). The frames are kept in the system's
//                          temporary folder while it works and removed after.
// The chrome of the screen (map, room name, buttons) is hidden by a style sheet of the test's own for stills and films
// alike; the captions are left, because they are part of it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const puppeteer = (await import(PUP)).default;
const [port = '8960', query = ''] = process.argv.slice(2);
const low = /lowmem/.test(query);
const OUT = path.resolve(process.env.ESC_OUT || path.join(os.homedir(), 'Desktop/Museum-life/escapes'), low ? 'lowmem' : '.');
fs.mkdirSync(OUT, { recursive: true });
const ONLY = process.env.ESC_ONLY ? process.env.ESC_ONLY.split(',') : null, SCENES = (process.env.ESC_SCENES || 'loose,lamp,herd,rules').split(',');
const FILM = SCENES.includes('film'), FFMPEG = process.env.FFMPEG || path.join(os.homedir(), 'Desktop/Avara-trailer/ffmpeg'), FPS = 30;

// The five. lampAt: where it is when a lamp is brought (in a robot's beat); herdAt: where the toy finds it; door: a
// point through a doorway it is sent to (the film of it crossing); roost: a bench for the hats, in another gallery.
const TESTS = [
  { key: 'keg', id: 25865, what: 'Homer, The Herring Net: the keg float on its patch of sea', lampAt: [166.5, 162], herdAt: [168.5, 166.5], doorFrom: [172.3, 153.5], door: [172.3, 144.5], eye: { d0: 2.3, h: 0.95, lift: 0.22 } },
  { key: 'hats', id: 14572, what: 'Degas, The Millinery Shop: the hats, a flock', lampAt: [66.0, 94.8], herdAt: [69.5, 93.5], roost: [68.0, 138.8], eye: { d0: 3.4, h: 1.3, lift: 0.95 } },
  { key: 'lambs', id: 111559, what: 'Goya, Boy on a Ram: three lambs stray, the boy on his ram fetches them', lampAt: [36, 72], herdAt: [22.5, 88.5], eye: { d0: 2.7, h: 0.95, lift: 0.3 } },
  { key: 'parasol', id: 14620, what: 'Monet, Cliff Walk at Pourville: the orange parasol on a gust', lampAt: [171.5, 44], herdAt: [172.5, 54], door: [161.5, 42.1], eye: { d0: 3.0, h: 1.2, lift: 0.75 } },
  { key: 'monkey', id: 27992, what: 'Seurat, A Sunday on La Grande Jatte: the monkey off its lead', lampAt: [95, 110], herdAt: [97.2, 108.6], eye: { d0: 2.0, h: 0.8, lift: 0.2 } },
].filter(t => !ONLY || ONLY.includes(t.key));

const b = await puppeteer.launch({ headless: 'new', protocolTimeout: 900000, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage(); await p.setViewport(FILM ? { width: 1280, height: 720 } : { width: 960, height: 540 });
// A clock of the test's own, for the films (asleep until started): the page's frames come when the test steps it, a
// thirtieth of a second each, and the page's own clock reads what the test says.
await p.evaluateOnNewDocument(() => {
  const raf = window.requestAnimationFrame.bind(window), now = performance.now.bind(performance);
  const V = window.__virt = { on: false, t: 0, q: [], sl: [], each: null };
  window.requestAnimationFrame = cb => { if (!V.on) return raf(cb); V.q.push(cb); return 0; };
  performance.now = () => (V.on ? V.t : now());
  V.start = () => { V.t = now(); V.on = true; };
  V.sleep = ms => new Promise(r => V.sl.push({ at: V.t + ms, r }));
  V.missed = 0;
  V.step = ms => new Promise(res => {
    let did = false; const go = late => { if (did) return; did = true; if (late) V.missed++;
      V.t += ms; if (V.each) try { V.each(ms / 1000); } catch (e) { console.error('film: ' + (e && e.stack || e)); }
      const q = V.q; V.q = []; for (const cb of q) try { cb(V.t); } catch (e) { console.error(e && e.stack || e); }
      const due = V.sl.filter(s => s.at <= V.t); V.sl = V.sl.filter(s => s.at > V.t); for (const s of due) s.r(); res(); };
    raf(() => go(false)); setTimeout(() => go(true), 400);      // (a frame the browser does not give is drawn all the same)
  });
});
let errs = [];
p.on('pageerror', e => errs.push('PAGE ' + String(e).slice(0, 300)));
p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/artic\.edu|Failed to load resource/.test(t)) errs.push(t.slice(0, 300)); });
const took = () => { const e = [...new Set(errs)]; errs = []; return e; };
// (a clean start: nothing out from a run before; a reload inside the run keeps what is out, to prove the save)
await p.evaluateOnNewDocument(() => { try { if (!sessionStorage.getItem('esc-keep')) localStorage.removeItem('after-hours.escapes'); } catch { /* fine */ } });
const files = {};      // strip name -> its stills
await p.exposeFunction('__shot', async (strip, name) => { const f = path.join(OUT, `${strip}-${name}.jpg`); await p.screenshot({ path: f, type: 'jpeg', quality: 86 }); (files[strip] || (files[strip] = [])).push(f); return true; });
await p.exposeFunction('__save', async (name, url) => { fs.writeFileSync(path.join(OUT, name), Buffer.from(url.split(',')[1], 'base64')); return true; });

const boot = async () => {
  await p.goto(`http://127.0.0.1:${port}/?mode=explore&saved&noopen${query ? '&' + query : ''}`, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction('window.__ah && window.__ah.state === "play" && window.__life && window.__esc', { timeout: 300000, polling: 500 });
  await new Promise(r => setTimeout(r, 3000));
  await p.addStyleTag({ content: '#room,#topleft,#map,#mapkey,#race,#fpv,#placard,#label,#studyBar,#tx,#drive,#pads,#trophyToast{display:none!important}' });
  // ---- the test's own kit, in the page
  await p.evaluate(async () => {
    const G = window.__ah, esc = window.__esc, F = G.escapes, gp = await import('/src/guardplan.js'), { features } = await import('/src/features.js');
    const TAU = Math.PI * 2, V = window.__virt, sleep = ms => (V.on ? V.sleep(ms) : new Promise(r => setTimeout(r, ms))), frame = () => new Promise(r => requestAnimationFrame(r));
    const T = window.__T = { G, esc, F, gp, sleep, frame, features };
    // (the game fetches its pictures for the room the toy is in. The test's eye often stands in another, with the toy
    // put out of the way, so while the eye is the test's the pictures are fetched for where it stands: what a player
    // there would see. Nothing else of the game is touched.)
    { const M = G.museum, was = M._stream; M._stream = function (pos, cam, room) { if (!G.testEye) return was.call(this, pos, cam, room); let best = null; for (const r of this.plan.rooms) { if (cam.x < r.x0 || cam.x > r.x1 || cam.z < r.z0 || cam.z > r.z1 || cam.y < r.y - 0.3 || cam.y > r.top + 0.3) continue; if (!best || r.y > best.y) best = r; } return best ? was.call(this, cam, cam, best.id) : was.call(this, pos, cam, room); }; }
    T.art = id => G.museum.arts.find(a => a.work.id === id);
    T.lights = (x, z, y, r = 40) => { for (const R of G.plan.rooms) if (Math.abs(R.y - y) < 0.2 && Math.hypot((R.x0 + R.x1) / 2 - x, (R.z0 + R.z1) / 2 - z) < r) try { if (!G.lights.isOn(R.id)) G.lights.set(R.id, true); } catch { /* a room with no switch */ } };
    T.open = (g, x, z, need = 0.5) => gp.cellAt(g, x, z) >= 0 && gp.clearAt(g, x, z) >= need;
    T.snap = (g, x, z, need = 0.5, within = 3) => { if (T.open(g, x, z, need)) return [x, z]; const c = gp.nearestOpen(g, x, z, need, within); return c < 0 ? null : [g.X0 + ((c % g.nx) + 0.5) * g.C, g.Z0 + (Math.floor(c / g.nx) + 0.5) * g.C]; };
    // The toy, set down on open floor (never blindly: a wall would throw it).
    T.toy = (g, x, z, y, face) => { const q = g ? T.snap(g, x, z, 0.5, 3) : [x, z]; if (!q) return false; G.vehicle.place(q[0], q[1], face ? Math.atan2(face[0] - q[0], face[1] - q[1]) : 0, y + 0.05); if (G.vehicle.vel) G.vehicle.vel.set(0, 0, 0); return q; };
    // A place for the toy in front of a work: in its room, well back, a little to one side.
    T.before = (E, min = 4.8) => { const a = E.art, g = F._grid(E), tx = -a.nz, tz = a.nx; for (const d of [6, 5, 4, 3, 2.2]) for (const s of [1.5, -1.5, 3.2, -3.2, 5.5, -5.5, 8, -8]) { const x = a.x + a.nx * d + tx * s, z = a.z + a.nz * d + tz * s; if (Math.hypot(x - a.x, z - a.z) >= min && T.open(g, x, z, 0.55) && gp.lineClear(g, x, z, a.x + a.nx * 0.6, a.z + a.nz * 0.6, 0.1)) return [x, z]; } return null; };
    // A place out of its sight and a robot's, a way off but near enough for it to have a body.
    T.hidden = (E, from = 11, to = 19) => { const g = F._grid(E); let best = null; for (let k = 0; k < g.nx * g.nz; k += 5) { const x = g.X0 + ((k % g.nx) + 0.5) * g.C, z = g.Z0 + (Math.floor(k / g.nx) + 0.5) * g.C, d = Math.hypot(x - E.x, z - E.z); if (d < from || d > to || !T.open(g, x, z, 0.6) || gp.lineClear(g, x, z, E.x, E.z, 0.05)) continue; let far = 1e9; for (const b of esc.bots()) if (Math.abs(b.fy - E.y) < 1) far = Math.min(far, Math.hypot(b.x - x, b.z - z)); let art = 1e9; for (const w of F.k.museum.arts) if (Math.abs(w.y - E.y - 1.6) < 2.5) art = Math.min(art, Math.hypot(w.x - x, w.z - z)); const sc = Math.min(far, 14) - d * 0.2 + Math.min(art, 4) * 1.5;      /* (and not up against a work: no card on the film) */ if (!best || sc > best.sc) best = { sc, x, z }; } return best ? [best.x, best.z] : null; };
    // An eye for a still: on open floor with a clear line to it, side on to the line from it to `also` (its wall, a
    // robot), so that both are in the picture.
    T.cam = (E, also = [], { d0 = 3.6, h = 1.35, lift = 0.45, at = null, lean = 0.45 } = {}) => {
      const g = F._grid(E); if (!g) return null; let best = null; const ex = at ? at[0] : E.x, ez = at ? at[1] : E.z;
      const ax = also[0] ? also[0][0] - ex : Math.sin(E.yaw), az = also[0] ? also[0][1] - ez : Math.cos(E.yaw), al = Math.hypot(ax, az) || 1;
      for (const d of [d0, d0 + 1, d0 - 0.8, d0 + 2, d0 - 1.5]) for (let i = 0; i < 24; i++) {
        const a = i / 24 * TAU, x = ex + Math.sin(a) * d, z = ez + Math.cos(a) * d;
        if (!T.open(g, x, z, 0.45) || !gp.lineClear(g, x, z, ex, ez, 0.05)) continue;
        let s = -Math.abs(d - d0) * 0.7; for (const q of also) if (gp.lineClear(g, x, z, q[0], q[1], 0.05)) s += 4;
        s += 2 * Math.abs(Math.sin(a) * az - Math.cos(a) * ax) / al - 0.8 * (Math.sin(a) * ax + Math.cos(a) * az) / al;
        if (!best || s > best.s) best = { s, x, z };
      }
      if (!best) return null;
      const q = also[0], dq = q ? Math.hypot(q[0] - ex, q[1] - ez) : 0, k = q ? Math.min(lean, 2.0 / (dq || 1)) : 0;
      const c = { x: best.x, z: best.z, at: [best.x, E.y + h, best.z], look: [ex + (q ? (q[0] - ex) * k : 0), E.y + lift, ez + (q ? (q[1] - ez) * k : 0)] };
      G.testEye = { at: c.at, look: c.look }; return c;
    };
    // (the same eye while it will do; another when the thing has gone out of its sight, or far off)
    T.follow = (E, c, also, o = {}) => { const g = F._grid(E), ex = o.at ? o.at[0] : E.x, ez = o.at ? o.at[1] : E.z, d = c ? Math.hypot(c.x - ex, c.z - ez) : 0; const wr = a => Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); if (!c || !gp.lineClear(g, c.x, c.z, ex, ez, 0.05) || d > 7.5 || d < 1.2 || (also && also.length && wr(Math.atan2(ex - c.at[0], ez - c.at[2]) - Math.atan2(c.look[0] - c.at[0], c.look[2] - c.at[2])) > 0.42)) return T.cam(E, also, o) || c; if (!also || !also.length) { c.look = [ex, c.look[1], ez]; G.testEye = { at: c.at, look: c.look }; } return c; };
    // The eye for a going home: first where it came apart, looking the way the strokes run; then before its own wall.
    T.homeward = (E, c, st, near = 1) => { const Q = E.going, a = E.art; if (!Q || Q.far) return c; const foot = [a.x + a.nx * 0.1, a.z + a.nz * 0.1], sp = F._spot(E) || { x: a.x + a.nx, z: a.z + a.nz };
      if (!st.one && Q.t > 1.3) { st.one = true; return T.cam(E, [foot], { d0: 4.2 * near, h: 1.0 + 0.5 * near }) || c; }
      if (!st.two && Q.t > Q.flow * 0.5) { st.two = true; return T.cam(E, [foot], { at: [sp.x, sp.z], d0: 3.0 * near, h: 1.2, lift: 0.75, lean: 0.8 }) || c; }
      return c; };
    T.shot = async (strip, name) => { await frame(); await frame(); await window.__shot(strip, name); };
    T.frames = async (n = 90) => { let last = await frame(), sum = 0, worst = 0; for (let i = 0; i < n; i++) { const t = await frame(), d = t - last; last = t; sum += d; worst = Math.max(worst, d); } return { avg: +(sum / n).toFixed(2), worst: +worst.toFixed(1) }; };
    T.pad = (i, n = 2) => String(i).padStart(n, '0');
    // Out, by the test hook, and standing somewhere, bodied.
    // (Seurat's monkey may only be out once the passage it points to has been found, and a fresh test page has not found it: the test says it has, and says that it did)
    T.gj = () => features.find(q => q.id === 'l2-grande-jatte');
    T.ungate = () => { const f = T.gj(); if (f && !f.free(F.k)) { f.free = () => true; return true; } return false; };
    // What is said on the screen, as it is said.
    T.said = []; for (const n of ['say', 'once']) { const was = F.k[n]; try { F.k[n] = (...q) => { const text = n === 'once' ? q[1] : q[0]; if (n !== 'once' || !G.told.has(q[0])) T.said.push(text); return was(...q); }; } catch { /* a kit that cannot be listened to */ } }
    // Does a robot's beat reach any room it knows from home? (If none does, no lamp can come to it in play.)
    T.beats = E => { const was = [E.room, E.grid]; if (E.state === 'home') { E.room = E.art.room; E.grid = null; } const rooms = F._grid(E).rooms; if (E.state === 'home') { E.room = was[0]; E.grid = was[1]; } return { rooms, bots: esc.bots().map((b, i) => [i, Math.abs(b.fy - E.y) < 0.5 ? (b.rooms || []).filter(r => rooms.includes(r)) : []]).filter(q => q[1].length).map(q => 'BOT-' + String(q[0]).padStart(2, '0') + ' in ' + q[1].join(' ')) }; };
    T.out = async (id, at) => { const E = esc.get(id); if (E.state !== 'home') esc.home(id, 'now'); await sleep(200); if (E.spec.may) T.ungate(); const r = esc.release(id, { force: true, quiet: true }); if (r !== true) return r; await sleep(2300); if (at) { const w = esc.place(id, at[0], at[1]); if (typeof w !== 'string' || w === 'not there') return 'place: ' + w; } for (let i = 0; i < 40 && E.body !== true; i++) await sleep(150); return E.body === true ? true : 'no body (' + E.body + ')'; };
  });
};
await boot();

const say = (...a) => console.log(...a);
const strips = () => {      // each strip as one sheet
  const py = `import sys\nfrom PIL import Image\nout, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]\nims = [Image.open(f).convert('RGB') for f in files]\nw, h = ims[0].width // 2, ims[0].height // 2\nrows = (len(ims) + cols - 1) // cols\nS = Image.new('RGB', (cols * w, rows * h))\nfor i, im in enumerate(ims): S.paste(im.resize((w, h), Image.LANCZOS), ((i % cols) * w, (i // cols) * h))\nS.save(out, quality=88)\n`;
  for (const [strip, list] of Object.entries(files)) {
    if (list.length < 2) continue;
    const r = spawnSync('python3', ['-c', py, path.join(OUT, `${strip}-sheet.jpg`), String(Math.min(4, list.length)), ...list], { encoding: 'utf8' });
    if (r.status !== 0) { say('  (no contact sheets: ' + String(r.stderr || r.error).trim().split('\n').pop() + ')'); return; }
  }
};

say(`escapes, ${low ? 'LOWMEM' : 'full'}: ${FILM ? 'films' : 'stills'} in ${OUT}`);
say('caps', JSON.stringify(await p.evaluate(() => window.__esc.caps)), ' specs', JSON.stringify(await p.evaluate(() => window.__esc.specs().map(s => s.tag + ':' + s.room))));

for (const t of FILM ? [] : TESTS) {
  say(`\n== ${t.key.toUpperCase()}  ${t.id}  ${t.what}`);
  // ------------------------------------------------------------ loose --
  if (SCENES.includes('loose')) {
    const r = await p.evaluate(async t => {
      const { G, esc, F, gp, sleep, features } = window.__T, T = window.__T, o = { rooms: [] }, strip = t.key + '-1-loose';
      G.set.guards = false; esc.home('all'); G.testEye = null; await sleep(300);
      const E = esc.get(t.id), a = E.art, L = window.__life.life(t.id), g = F._grid(E), y = E.y;
      T.lights(a.x, a.z, y);
      const back = (!E.spec.watch && T.before(E)) || [a.x + a.nx * 3, a.z + a.nz * 3];      // (the monkey's own way out wants the toy in its room)
      T.toy(E.spec.watch ? null : g, back[0], back[1], y, [a.x, a.z]); await sleep(1500);
      // The way a player lets it out: the toy watches the show a few seconds, and drives off.
      const t0 = performance.now(), secs = () => +((performance.now() - t0) / 1000).toFixed(1);
      G.shell.look(a); await sleep(2600);
      if (E.spec.watch) {      // (Seurat's monkey is the gallery's own: it slips its lead when its picture has been looked at, hides in a corner, and is loose in the building once the toy has left the room)
        const f = T.gj(), s0 = T.said.length;
        // (in the game it goes only once the passage it points to has been found; a fresh test page has not found it: first that it is refused, then the test lets it go as if it had, and says so)
        o.gated = !f.free(F.k); if (o.gated) { o.refused = String(esc.release(t.id, { force: true, quiet: true })); T.ungate(); }
        for (let i = 0; i < 120 && E.state !== 'out'; i++) await sleep(250);
        o.armed = E.state === 'out' ? secs() : null; o.life = 'the gallery’s monkey ' + f.state + ', looked ' + (f.look || 0).toFixed(1) + ' s, ' + G.state + ', toy in ' + G.roomId; await T.shot(strip, '00-show');
        G.shell.endLook(); await sleep(200);
        if (o.armed != null) {
          let c = T.cam(E, [[E.corner.x, E.corner.z]], { d0: 2.6, h: 1.0, lift: 0.25 }); await T.shot(strip, '01-off-its-lead');
          for (let i = 0; i < 40 && !E.cornered; i++) { await sleep(200); if (i === 2) await T.shot(strip, '01-to-its-corner'); }
          await sleep(900); T.cam(E, [], { d0: 1.9, h: 0.8, lift: 0.2 }); await T.shot(strip, '01-in-its-corner');
          o.hid = E.hid && E.cornered; o.one = G.t; await sleep(3000); o.stays = E.hid === true;      // (it stays while the toy is in the room)
          o.said = T.said.slice(s0); o.clue = G.secret && G.secret.clue ? G.secret.clue.work.id + ' ' + G.secret.clue.part + (G.secret.open ? ' (open)' : ' (shut)') : 'no secret';
          const link = (F.adj.get(a.room) || []).find(l => !esc.quiet.includes(l.to)), R = link && G.plan.byId[link.to];
          if (R) { const g2 = gp.grid(G.plan, [a.room, link.to], y); T.toy(g2, link.x + Math.sign((R.x0 + R.x1) / 2 - link.x) * Math.min(3, Math.abs((R.x0 + R.x1) / 2 - link.x)), link.z + Math.sign((R.z0 + R.z1) / 2 - link.z) * Math.min(3, Math.abs((R.z0 + R.z1) / 2 - link.z)), y); }
          for (let i = 0; i < 40 && E.hid; i++) await sleep(150); o.left = E.hid === false; o.gallery = f.state + (f.monkey && f.monkey.visible ? ', its own monkey showing' : ', its own monkey put away');
        }
      } else {
        for (let i = 0; i < 180 && !E.armed; i++) { await sleep(250); if (i === 16) await T.shot(strip, '00-show'); }
        o.armed = E.armed ? secs() : null; o.life = L ? L.state : 'no show';
        G.shell.endLook(); await sleep(300);
        const far = T.before(E, 5.2) || back; T.toy(g, far[0], far[1], y, [a.x, a.z]);
      }
      const t1 = performance.now(); for (let i = 0; i < 40 && E.state !== 'out'; i++) await sleep(150);
      o.natural = E.state === 'out'; o.after = +((performance.now() - t1) / 1000).toFixed(1);
      if (!o.natural) { o.release = esc.release(t.id, { force: true }); }
      for (let i = 0; i < 40 && E.body !== true; i++) await sleep(100);
      if (E.body !== true) return { ...o, error: 'no body: ' + E.body };
      // coming out from under its frame
      const foot = [a.x + a.nx * 0.1, a.z + a.nz * 0.1], EYE = { ...t.eye, d0: t.eye.d0 + 0.4 }; let c = T.cam(E, [foot], EYE);
      for (const [i, ms] of [[2, 350], [3, 600], [4, 800], [5, 1100]]) { await sleep(ms); await T.shot(strip, T.pad(i) + '-out'); }
      // about the rooms
      esc.roam(t.id, 0.3);
      for (let i = 6; i < 22; i++) { await sleep(1000); c = T.follow(E, c, [], EYE); await T.shot(strip, T.pad(i) + '-about'); if (!o.rooms.includes(E.room)) o.rooms.push(E.room); if (E.rest > 1e6) esc.roam(t.id, 0.3); }
      const checks = [];
      o.frame = await T.frames(90); o.cost = esc.cost(); o.n = E.n; const eyeM = G.testEye, toyM = [G.vehicle.pos.x, G.vehicle.pos.z];
      const near = G.museum.arts.filter(q => q !== a && q.room === a.room && q.nx != null && !q.obj).sort((p, q) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z))[0];
      const spots = [['before its own picture', [a.x + a.nx * 1.3, a.z + a.nz * 1.3]]]; if (near) spots.push(['by the next work (' + near.work.id + ')', [near.x + near.nx * 1.2, near.z + near.nz * 1.2]]);
      const guard = async (name, at) => {
        if (at) { const w = esc.place(t.id, at[0], at[1]); if (w === 'not there' || !w) { checks.push({ name, error: 'cannot stand there' }); return; } if (Math.hypot(G.vehicle.pos.x - E.x, G.vehicle.pos.z - E.z) > 25) T.toy(g, back[0], back[1], y, [a.x, a.z]); await sleep(900); }
        T.cam(E, [[a.x, a.z]]); await sleep(300);
        const k = esc.check(t.id), top = (E.spec.height || 0.4) * 0.8;
        const floor = Object.fromEntries([a, near].filter(Boolean).map((q, i) => { const dx = E.x - q.x, dz = E.z - q.z, d = Math.hypot(dx, dz) || 1, back = Math.max(0.3, Math.min(3.5, d * (top - 0.06) / Math.max(0.2, q.y - E.y - top))); return ['floor' + (i + 1), { at: [E.x + dx / d * back, E.y + 0.06, E.z + dz / d * back], look: [q.x, q.y, q.z], fov: 62 }]; }));
        const k2 = esc.check(t.id, floor), rows = [...(k.rows || []), ...(k2.rows || [])];
        checks.push({ name, pass: k.pass && k2.pass, drawn: (k.drawn || 0) + (k2.drawn || 0), wouldBe: (k.wouldBe || 0) + (k2.wouldBe || 0), guarded: k.guarded, canvases: k.canvases, rows: rows.map(q => q.cam + ' ' + q.drawn + '/' + q.wouldBe).join(', '), error: k.error || k2.error, over: [...(k.over || []), ...(k2.over || [])].length ? [...(k.over || []), ...(k2.over || [])] : undefined });
        if (at) await T.shot(t.key + '-3-guard', name.replace(/[^a-z]+/g, '-').slice(0, 24));
      };
      await guard('where it is, after wandering', null);
      // through a doorway
      if (t.door) {
        if (t.doorFrom) { esc.place(t.id, t.doorFrom[0], t.doorFrom[1]); await sleep(600); }
        const from = E.room; o.door = { go: esc.go(t.id, t.door[0], t.door[1]), from };
        c = T.cam(E, [t.door], EYE);
        for (let i = 0; i < 22; i++) { await sleep(700); c = T.follow(E, c, [], EYE); await T.shot(t.key + '-2-doorway', T.pad(i)); if (E.room !== from && !(E.pn > 1 && E.pk < E.pn)) break; }
        o.door.to = E.room;
      }
      // a roost on a bench (the hats), in another gallery
      if (t.roost) {
        const g3 = gp.grid(G.plan, [G.plan.rooms.find(R => Math.abs(R.y - y) < 0.2 && t.roost[0] > R.x0 && t.roost[0] < R.x1 && t.roost[1] > R.z0 && t.roost[1] < R.z1).id], y);
        T.lights(t.roost[0], t.roost[1], y); T.toy(g3, t.roost[0] - 4, t.roost[1] - 2.5, y, t.roost); await sleep(800);
        o.roost = esc.place(t.id, t.roost[0], t.roost[1]); c = T.cam(E, [], { d0: 3.2, h: 1.3, lift: 0.9 });
        for (let i = 0; i < 8; i++) { await sleep(1500); if (i === 3) c = T.cam(E, [], { d0: 2.1, h: 1.05, lift: 0.6 });      /* (and from close, once they are down) */ await T.shot(t.key + '-2-roost', T.pad(i)); }
        o.roosted = !!(E.build && E.build.roost); o.reach = T.beats(E).rooms.includes(o.roost) ? 'a room they know from home' : 'NOT a room they know: only by the test';
        T.toy(g, back[0], back[1], y, [a.x, a.z]); await sleep(600);
      }
      // the guard: nothing of it on any canvas, where it is, before its own picture, and by the next work along
      for (const [name, at] of spots) await guard(name, at);
      o.checks = checks;
      // the show it has left, playing without it
      esc.place(t.id, a.x + a.nx * 2.6 - a.nz * 2.2, a.z + a.nz * 2.6 + a.nx * 2.2); G.testEye = null; await sleep(300);
      G.shell.look(a); await sleep(2600); for (let i = 0; i < 60 && L && L.state !== 'show'; i++) await sleep(250); await sleep(3500);
      o.showOut = L ? L.state : 'no show'; await T.shot(strip, '30-the-show-without-it'); G.shell.endLook(); await sleep(400);
      o.flutter = features.find(q => q.id === 'paintlife').fluttering.has(a);
      esc.home(t.id, 'now'); await sleep(1500);
      o.settled = !features.find(q => q.id === 'paintlife').fluttering.has(a);
      T.toy(null, toyM[0], toyM[1], y, [a.x, a.z]); G.testEye = eyeM; await sleep(1500); o.home = await T.frames(90); G.testEye = null;      // (the same eye, the same place, and it home)
      return o;
    }, t);
    if (r.error) say('  loose: ' + r.error);
    else {
      say(`  let out by play: ${r.natural ? `yes (ready after ${r.armed} s of watching, out ${r.after} s after the toy went)${r.gated ? ` (the passage not yet found: let out by the hook it said "${r.refused}"; then the test said the passage was found, and it slipped its lead)` : ''}` : `NO (armed ${r.armed}, show ${r.life}); let out by the hook: ${r.release}`}`);
      if (r.said) say(`  one monkey, one caption: ${r.said.length === 1 ? 'PASS' : 'FAIL'} ${JSON.stringify(r.said)}; in its corner, hidden: ${r.hid}; still there 3 s on with the toy in the room: ${r.stays}; loose once the toy had left: ${r.left}; the gallery's feature: ${r.gallery}; the passage's clue: ${r.clue}`);
      say(`  loose: rooms ${r.rooms.join(' > ')}${r.door ? `; through a doorway ${r.door.from} > ${r.door.to} (${r.door.go ? 'went' : 'no way'})` : ''}${r.roost ? `; roost in ${r.roost} (${r.reach}): on the bench ${r.roosted}` : ''}; the show without it: ${r.showOut}; label flutters while out ${r.flutter}, settles when home ${r.settled}`);
      for (const k of r.checks) say(`  guard ${k.error ? 'ERROR ' + k.error : (k.pass ? 'PASS' : 'FAIL')}  ${k.name}: ${k.drawn} px on any canvas (${k.wouldBe} without the guard; ${k.guarded} of ${k.canvases} canvases guarded)  [${k.rows}]${k.over ? ' ' + JSON.stringify(k.over) : ''}`);
      say(`  cost with it out: ${r.cost.ms} ms a frame in the feature, ${r.cost.calls} draw calls, ${r.cost.tris} triangles, ${r.cost.marks} marks${r.n > 1 ? ', ' + r.n + ' bodies' : ''}; frame ${r.frame.avg} ms (worst ${r.frame.worst}) against ${r.home.avg} ms (worst ${r.home.worst}) with it home`);
    }
  }
  // ------------------------------------------------------------ a robot's lamp --
  const beats = SCENES.includes('lamp') || FILM ? await p.evaluate(t => window.__T.beats(window.__esc.get(t.id)), t) : null;
  if (beats) say(`  rooms it knows from home: ${beats.rooms.join(' ')}; robots whose beat comes into them: ${beats.bots.length ? beats.bots.join(', ') : 'NONE'}`);
  if (SCENES.includes('lamp') && !beats.bots.length) {
    say('  lamp: no robot’s beat reaches any room it knows, so in play no lamp ever finds it: it is only ever herded home (or, left out and far from the toy, goes home unseen). No lamp strip is taken.');
    for (const f of fs.readdirSync(OUT)) if (f.startsWith(t.key + '-4-lamp')) fs.rmSync(path.join(OUT, f), { force: true });
  } else if (SCENES.includes('lamp')) {
    let r = null;
    for (let go = 0; go < 3 && (!r || r.retry); go++) { if (r) { say('  lamp: ' + r.error + '; again'); for (const f of files[t.key + '-4-lamp'] || []) fs.rmSync(f, { force: true }); delete files[t.key + '-4-lamp']; }
    r = await p.evaluate(async t => {
      const { G, esc, F, sleep } = window.__T, T = window.__T, o = { log: [] }, strip = t.key + '-4-lamp'; window.__escDebug = t.debug;
      G.set.guards = true; esc.home('all'); G.testEye = null; await sleep(300);
      const E = esc.get(t.id), a = E.art, y = E.y;
      T.lights(t.lampAt[0], t.lampAt[1], y); T.lights(a.x, a.z, y);
      T.toy(null, t.lampAt[0], t.lampAt[1], y); await sleep(1200);      // (near, so that it has a body to place)
      const w = await T.out(t.id, t.lampAt); if (w !== true) return { error: w };
      const hid = T.hidden(E); if (hid) T.toy(null, hid[0], hid[1], y); o.toy = hid ? +Math.hypot(hid[0] - E.x, hid[1] - E.z).toFixed(1) : 'in sight';
      await sleep(t.key === 'lambs' ? 5200 : 2500);      // (the boy rides out to them)
      if (E.state !== 'out') return { error: 'gone before the lamp: ' + E.state + ' ' + JSON.stringify(esc.log().slice(-2)) };
      const l = esc.lamp(t.id, { dist: 4.4 }); if (!l) return { error: 'no robot’s beat reaches ' + E.room };
      o.bot = l.bot; const B = () => esc.bots()[l.bot], x0 = E.x, z0 = E.z;
      const LC = { d0: 3.2, h: 1.2, lean: 0.3 }; let c = T.cam(E, [[l.x, l.z]], LC); await T.shot(strip, '000');
      const t0 = performance.now(), secs = () => +((performance.now() - t0) / 1000).toFixed(1), boy = () => (E.build && E.build.boy && E.build.boy.x != null ? E.build.boy : null);
      let end = 0; o.boyAim = 9; o.moved = 0; const st = {}, foot = [a.x + a.nx * 0.1, a.z + a.nz * 0.1];
      for (let i = 1; i <= 170; i++) {
        await sleep(300); const bt = B(), s = secs();
        // (the robots treat the toy as ever: if one has found it and thrown it out, the film is spoiled and is taken again)
        if (E.state === 'out' && E.body !== true) { G.set.guards = false; esc.home('all'); return { retry: true, error: 'spoiled: a robot found the toy (now in ' + G.roomId + '), and the thing lost its body' }; }
        if (o.lit == null && E.lit > 0.05) o.lit = s;
        if (o.warm == null && bt.warm > 0.5) o.warm = s;
        if (o.going == null && E.state === 'going') o.going = s;
        if (E.state === 'out') o.moved = Math.max(o.moved, +Math.hypot(E.x - x0, E.z - z0).toFixed(1));
        // (a person is never quarry: how near the lamp's aim comes to the boy, while it is on his lambs)
        const by = boy(); if (by && bt.tend && by.state !== 'in' && by.state !== 'gone') { let d = Math.atan2(by.x - bt.x, by.z - bt.z) - bt.look; d = Math.abs(Math.atan2(Math.sin(d), Math.cos(d))); if (E.state === 'out' && E.lit > 0.05) { o.boyAim = Math.min(o.boyAim, +d.toFixed(2)); o.boyN = (o.boyN || 0) + 1; if (d < 0.62 && Math.hypot(by.x - bt.x, by.z - bt.z) < 8) o.boyIn = (o.boyIn || 0) + 1; let e = Math.atan2(E.x - bt.x, E.z - bt.z) - bt.look; o.aimErr = Math.max(o.aimErr || 0, +Math.abs(Math.atan2(Math.sin(e), Math.cos(e))).toFixed(2)); } }
        if (i % 6 === 0 || E.state !== 'out' && i % 3 === 0) o.log.push([s, E.state, 'lit ' + E.lit.toFixed(2), bt.mode, 'warm ' + bt.warm, window.__escDebug ? 'bot ' + bt.x + ',' + bt.z + ' look ' + bt.look + ' E ' + E.x.toFixed(1) + ',' + E.z.toFixed(1) + ' v ' + (E.v || 0).toFixed(2) : '', by ? 'boy ' + by.state + ' ' + by.x.toFixed(1) + ',' + by.z.toFixed(1) + (window.__escDebug ? ' pn ' + by.pn + ' pk ' + by.pk + ' halt ' + (by.halt || 0).toFixed(1) + ' way ' + by.way + ' v ' + by.v + ' Q ' + (E.going ? [E.going.far, E.going.pts.length, E.going.t.toFixed(1), E.going.T.toFixed(1), (E.going.over || 0).toFixed(1)].join('/') : '') : '') : ''].join(' '));
        if (E.state === 'out') c = T.follow(E, c, [[bt.x, bt.z]], LC);
        else if (E.state === 'going') {
          if (E.going.over && by && by.x != null && by.state !== 'gone') c = T.follow(E, c, [foot], { at: [by.x, by.z], d0: 3.4, h: 1.3 });      // (the lambs are in: the boy rides home after them)
          else c = T.homeward(E, c, st);
          // the guard again, as the strokes come to the wall and climb to the foot of the frame
          if (st.two && !o.climb && E.going.t > E.going.flow * 0.85) { const k = esc.check(t.id); o.climb = { pass: k.pass, drawn: k.drawn, wouldBe: k.wouldBe, error: k.error }; }
        }
        if (i < 14 || i % 2 === 0) await T.shot(strip, T.pad(i, 3));
        if (E.state === 'home') { o.home = o.home == null ? s : o.home; if (++end > 3) break; }
      }
      await sleep(2500); o.state = E.state; o.after = B().mode; o.line = esc.log().slice(-1)[0];
      o.toyAt = [G.vehicle.pos.x.toFixed(1), G.vehicle.pos.y.toFixed(2), G.vehicle.pos.z.toFixed(1), G.roomId, 'hid', hid && hid.map(v => v.toFixed(1)).join(','), 'body', String(E.body)].join(' ');
      G.set.guards = false; if (E.state !== 'home') esc.home(t.id, 'now');
      return o;
    }, { ...t, debug: !!process.env.ESC_DEBUG }); }
    if (r.error) say('  lamp: ' + r.error);
    else say(`  lamp: BOT-${String(r.bot).padStart(2, '0')} (toy ${r.toy} m off, out of sight: ${r.toyAt}): on it at ${r.lit} s, warm white at ${r.warm} s, going home at ${r.going} s, home at ${r.home} s${r.state !== 'home' ? ' (NOT HOME: ' + r.state + ')' : ''}; it moved ${r.moved} m in the light; the robot 2.5 s later: ${r.after}; the guard as the strokes climb the wall: ${r.climb ? (r.climb.error || (r.climb.pass ? 'PASS' : 'FAIL') + ' ' + r.climb.drawn + ' px (' + r.climb.wouldBe + ' without)') : 'not taken'}${r.boyAim < 9 ? `; the boy: while the lamp was on the lambs it was aimed at them (never more than ${r.aimErr} rad off) and its aim never came nearer him than ${r.boyAim} rad (the lamp's half-width is 0.62; no lamp is held on the lambs with him within 0.3); he was within the wide pool for ${((r.boyIn || 0) * 0.3).toFixed(1)} s of the ${((r.boyN || 0) * 0.3).toFixed(1)} s` : ''}\n        log: ${r.line}\n        ${r.log.join('\n        ')}`);
  }
  // ------------------------------------------------------------ the toy as sheepdog --
  if (SCENES.includes('herd')) {
    const r = await p.evaluate(async t => {
      const { G, esc, F, gp, sleep } = window.__T, T = window.__T, o = { log: [] }, strip = t.key + '-5-herd';
      G.set.guards = false; esc.home('all'); G.testEye = null; await sleep(300);
      const E = esc.get(t.id), a = E.art, y = E.y;
      T.lights(a.x, a.z, y); T.toy(F._grid(E), t.herdAt[0] + a.nx * 1.5, t.herdAt[1] + a.nz * 1.5, y); await sleep(1200);
      const w = await T.out(t.id, t.herdAt); if (w !== true) return { error: w };
      await sleep(t.key === 'lambs' ? 5200 : 1200);
      const chips = () => (G.poker && G.poker.chips ? G.poker.chips() : null), c0 = chips(), spot = F._spot(E) || { x: a.x + a.nx, z: a.z + a.nz };
      o.from = +Math.hypot(E.x - spot.x, E.z - spot.z).toFixed(1);
      const foot = [a.x + a.nx * 0.1, a.z + a.nz * 0.1]; let c = T.cam(E, [foot], { d0: 4.4, h: 1.5 }); await T.shot(strip, '000');
      const t0 = performance.now(), secs = () => +((performance.now() - t0) / 1000).toFixed(1), st = {}; let end = 0;
      for (let i = 1; i <= 200; i++) {
        await sleep(330); const g = F._grid(E), s = secs();
        // behind it, on the far side from home, and moving: as a sheepdog works
        if (E.state === 'out') {
          let dx, dz; if (E.led > 0 && E.v > 0.05) { dx = -Math.sin(E.yaw); dz = -Math.cos(E.yaw); } else { dx = E.x - spot.x; dz = E.z - spot.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d; }
          const q = T.snap(g, E.x + dx * 1.9 + (i % 2 ? 0.12 : -0.12) * dz, E.z + dz * 1.9 - (i % 2 ? 0.12 : -0.12) * dx, 0.4, 1.2); if (q && Math.hypot(q[0] - E.x, q[1] - E.z) > 1.3) { G.vehicle.place(q[0], q[1], Math.atan2(E.x - q[0], E.z - q[1]), y + 0.05); }
          if (o.led == null && E.led > 0) o.led = s;
        }
        if (o.going == null && E.state === 'going') o.going = s;
        if (i % 6 === 0) o.log.push([s, E.state, 'led ' + E.led.toFixed(1), E.room, E.build && E.build.boy ? 'boy ' + E.build.boy.state : ''].join(' '));
        const by = E.build && E.build.boy;
        if (E.state === 'out') c = T.follow(E, c, [foot], { d0: 4.4, h: 1.5 });
        else if (E.state === 'going') { if (E.going.over && by && by.x != null && by.state !== 'gone') c = T.follow(E, c, [foot], { at: [by.x, by.z], d0: 3.4, h: 1.3 }); else if (!st.two) { st.two = true; c = T.cam(E, [foot], { at: [spot.x, spot.z], d0: 3.0, h: 1.2, lift: 0.75, lean: 0.8 }) || c; } }
        if (E.state === 'out' ? i % 3 === 0 : i % 2 === 0) await T.shot(strip, T.pad(i, 3));
        if (E.state === 'home') { o.home = o.home == null ? s : o.home; if (++end > 3) break; }
      }
      o.state = E.state; o.chips = c0 == null ? null : chips() - c0; o.line = esc.log().slice(-1)[0];
      if (E.state !== 'home') esc.home(t.id, 'now');
      return o;
    }, t);
    if (r.error) say('  herd: ' + r.error);
    else say(`  herd: from ${r.from} m off, the toy behind it: it set off at ${r.led} s, went in at ${r.going} s, home at ${r.home} s${r.state !== 'home' ? ' (NOT HOME: ' + r.state + ')' : ''}; chips ${r.chips == null ? '?' : (r.chips >= 0 ? '+' : '') + r.chips}\n        log: ${r.line}\n        ${r.log.join('\n        ')}`);
  }
  const e = took(); say('  page errors: ' + (e.length ? '\n    ' + e.join('\n    ') : 'none'));
}

// ------------------------------------------------------------ the films --
if (FILM) {
  const TMP = path.join(os.tmpdir(), 'escapes-film-' + process.pid); fs.rmSync(TMP, { recursive: true, force: true });
  // ---- the film's own kit, in the page: an eye that stays put and turns with the thing (and moves only when it has
  // lost it), and the toy driven as a sheepdog, a little every frame
  await p.evaluate(() => {
    const T = window.__T, { G, esc, F, gp } = T, V = window.__virt;
    T.rec = name => { window.__rec = name || ''; }; T.track = null; T.dog = null;
    T.wait = async (ok, secs) => { for (let i = 0; i < secs * 20 && !ok(); i++) await T.sleep(50); return !!ok(); };
    // (a caption of its own is only read if nothing else is up: the screen is let fall quiet before each part)
    T.hush = async (secs = 14) => { const el = document.getElementById('toast'); for (let i = 0, off = 0; i < secs * 20 && off < 24; i++) { off = el.classList.contains('on') ? 0 : off + 1; await T.sleep(50); } };
    // Somewhere before its wall, d metres from the spot it goes home to, with clear floor beyond it for the toy.
    // (and the pictures the eye can see are let load: real seconds, whatever the film's clock says)
    T.sharp = async (secs = 25) => { const t0 = Date.now(); let ok = 0; while (Date.now() - t0 < secs * 1000 && ok < 6) { await T.sleep(100); await new Promise(r => setTimeout(r, 60)); ok = G.museum.arts.some(a => a.want > 0 && (a.busy || a.tier < a.want)) ? 0 : ok + 1; } return ok >= 6; };
    T.near = (E, spot, d = 5, beyond = 4) => { const a = E.art, g = F._grid(E); let best = null;
      for (const dd of [d, d - 1, d + 1, d - 2]) { for (let i = 0; i < 48; i++) { const an = i / 48 * Math.PI * 2, ux = Math.sin(an), uz = Math.cos(an), x = spot.x + ux * dd, z = spot.z + uz * dd, f = ux * a.nx + uz * a.nz;
        if (f < 0.3 || !T.open(g, x, z, 0.8) || !gp.lineClear(g, x, z, spot.x, spot.z, 0.3) || !T.open(g, x + ux * beyond, z + uz * beyond, 0.5) || !gp.lineClear(g, x, z, x + ux * beyond, z + uz * beyond, 0.3)) continue;
        const sc = -Math.abs(f - 0.8); if (!best || sc > best.sc) best = { sc, x, z }; } if (best) break; }
      return best && [best.x, best.z]; };
    V.each = dt => {
      const D = T.dog;
      if (D && D.E.state === 'out') {
        const E = D.E, g = F._grid(E); let dx, dz;
        if (E.led > 0 && E.v > 0.05) { dx = -Math.sin(E.yaw); dz = -Math.cos(E.yaw); } else { dx = E.x - D.spot.x; dz = E.z - D.spot.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d; }
        D.t += dt; const w = Math.sin(D.t * 4.5) * 0.16, q = T.snap(g, E.x + dx * D.off + w * dz, E.z + dz * D.off - w * dx, 0.4, 1.2);
        if (q) { const ex = q[0] - D.x, ez = q[1] - D.z, d = Math.hypot(ex, ez), s = Math.min(d, 2.6 * dt); if (d > 0.01) { D.x += ex / d * s; D.z += ez / d * s; } }
        const rx = D.x - E.x, rz = D.z - E.z, rd = Math.hypot(rx, rz) || 1, min = D.off * 0.7; if (rd < min) { D.x = E.x + rx / rd * min; D.z = E.z + rz / rd * min; }      // (round it, never through it)
        const want = Math.atan2(E.x - D.x, E.z - D.z); D.yaw += Math.atan2(Math.sin(want - D.yaw), Math.cos(want - D.yaw)) * Math.min(1, dt * 6);
        G.vehicle.place(D.x, D.z, D.yaw, D.y + 0.02); if (G.vehicle.vel) G.vehicle.vel.set(0, 0, 0);
      }
      const K = T.track; if (!K) return;
      const E = K.E, P = K.pt ? K.pt() : [E.x, E.z], g = F._grid(E); let c = K.c;
      const d = c ? Math.hypot(c.x - P[0], c.z - P[1]) : 99, ok = c && d < (K.max || (K.o && K.o.d0 || 3) + 1.9) && d > 1.0 && gp.lineClear(g, c.x, c.z, P[0], P[1], 0.05);
      K.bad = ok ? 0 : (K.bad || 0) + 1; K.age = (K.age || 0) + 1;
      if (!c || (K.bad > 9 && K.age > 36)) { const n = T.cam(E, K.also || [], { ...K.o, at: P }); if (n) { K.c = c = n; K.look = null; K.age = 0; K.bad = 0; } }
      if (!c) return;
      const L = K.lean ? K.lean() : null, k = K.k || 0.25, tg = [P[0] + (L ? (L[0] - P[0]) * k : 0), E.y + K.lift, P[1] + (L ? (L[1] - P[1]) * k : 0)];
      if (!K.look) K.look = tg; else for (let i = 0; i < 3; i++) K.look[i] += (tg[i] - K.look[i]) * 0.1;
      G.testEye = { at: c.at, look: K.look };
    };
  });
  await p.evaluate(() => window.__virt.start());
  // Something run in the page while the clock is stepped, and the frames it asks for kept.
  const drive = async (dir, fn, arg) => {
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); let done = false, n = 0;
    const run = p.evaluate(fn, arg).then(r => { done = true; return r; }, e => { done = true; return { error: String(e).slice(0, 300) }; });
    // (the step's promise is held in the page until it is answered: one nothing holds is collected, and never answers)
    while (!done) { const rec = await p.evaluate(ms => (window.__virt.held = window.__virt.step(ms).then(() => window.__rec || '')), 1000 / FPS); if (rec && !done) await p.screenshot({ path: path.join(dir, String(n++).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 93 }); }
    const r = await run, missed = await p.evaluate(() => { window.__rec = ''; window.__T.track = window.__T.dog = null; const m = window.__virt.missed; window.__virt.missed = 0; return m; }); return { ...(r || {}), frames: n, missed };
  };

  // getting out, and about the rooms
  const segOut = async t => {
    const T = window.__T, { G, esc, F, gp, sleep } = T, o = {};
    T.rec(''); T.track = T.dog = null; G.set.guards = false; esc.home('all'); G.testEye = null; await sleep(300); await T.hush();
    const E = esc.get(t.id), a = E.art, y = E.y, foot = [a.x + a.nx * 0.1, a.z + a.nz * 0.1], out = [a.x + a.nx * 0.7, a.z + a.nz * 0.7], s0 = T.said.length;
    T.lights(a.x, a.z, y); G.told.delete('escape-' + t.id); if (E.spec.may) o.ungated = T.ungate();
    const g = F._grid(E), back = T.before(E, 5.2) || [a.x + a.nx * 5, a.z + a.nz * 5];
    if (E.spec.watch) {      // (the monkey: its picture is looked at, it slips its lead, hides in its corner; the toy leaves the room, and it is loose)
      const f = T.gj(); T.toy(null, a.x + a.nx * 3, a.z + a.nz * 3, y, [a.x, a.z]); await sleep(900);
      T.cam(E, [foot], { ...t.eye, at: out, d0: t.eye.d0 + 1.4, lift: 0.5 }); await T.sharp();
      G.shell.look(a); await T.wait(() => f.look > 3.3 || E.state === 'out', 14);
      T.rec('1-out'); await T.wait(() => f.state === 'leaving' || E.state === 'out', 8); G.shell.endLook(); await T.wait(() => E.state === 'out' && E.body === true, 6);
      if (E.state !== 'out') return { error: 'the monkey did not slip its lead: the gallery’s is ' + f.state };
      T.track = { E, o: { ...t.eye, d0: t.eye.d0 + 0.5 }, lift: t.eye.lift, also: [[E.corner.x, E.corner.z]] };
      await T.wait(() => E.cornered, 9);
      { const n = T.cam(E, [], { ...t.eye, d0: Math.max(1.8, t.eye.d0 - 0.6) }); if (n) { T.track.c = n; T.track.look = null; T.track.age = 0; T.track.bad = 0; T.track.also = []; } }      // (a nearer eye on it in its corner)
      await sleep(1500);
      const link = (F.adj.get(a.room) || []).find(l => !esc.quiet.includes(l.to)), R = link && G.plan.byId[link.to];
      if (R) { const g2 = gp.grid(G.plan, [a.room, link.to], y); T.toy(g2, link.x + Math.sign((R.x0 + R.x1) / 2 - link.x) * Math.min(3, Math.abs((R.x0 + R.x1) / 2 - link.x)), link.z + Math.sign((R.z0 + R.z1) / 2 - link.z) * Math.min(3, Math.abs((R.z0 + R.z1) / 2 - link.z)), y); }
      await T.wait(() => !E.hid, 6); o.how = 'its own way: the picture looked at, the lead slipped, the corner, and loose when the toy had left the room';
    } else {
      T.toy(g, back[0], back[1], y, [a.x, a.z]); await sleep(900);
      const O = { ...t.eye, lift: t.eye.lift + 0.15 }, c = T.cam(E, [foot], { ...O, at: out });
      T.track = { E, c, o: O, lift: O.lift, also: [foot], pt: () => (E.state === 'out' && E.emerge >= 1 ? [E.x, E.z] : out) };
      await sleep(200); await T.sharp(); T.rec('1-out'); await sleep(500); const r = esc.release(t.id, { force: true }); if (r !== true) return { error: 'not let out: ' + r };
      await T.wait(() => E.body === true && E.emerge >= 1, 8); await sleep(700); o.how = 'by the hook (the stills run lets it out by play)';
    }
    T.rec('2-about'); T.track.also = []; T.track.pt = null; T.track.o = t.eye; T.track.lift = t.eye.lift;
    for (let i = 0; i < t.about * 10 && E.state === 'out'; i++) { if (!(E.pn > 1 && E.pk < E.pn) && E.rest > 0.4) esc.roam(t.id, 0.25); await sleep(100); }
    T.rec(''); o.said = T.said.slice(s0); o.room = E.room; o.state = E.state; return o;
  };
  // the hats: across a gallery to a bench, and down on it
  const segRoost = async t => {
    const T = window.__T, { G, esc, F, gp, sleep } = T, o = {};
    G.set.guards = false; const E = esc.get(t.id), y = E.y; if (E.state !== 'out') { const w = await T.out(t.id, null); if (w !== true) return { error: w }; }
    const R3 = G.plan.rooms.find(R => Math.abs(R.y - y) < 0.2 && t.roost[0] > R.x0 && t.roost[0] < R.x1 && t.roost[1] > R.z0 && t.roost[1] < R.z1), g3 = gp.grid(G.plan, [R3.id], y);
    T.lights(t.roost[0], t.roost[1], y); o.reach = T.beats(E).rooms.includes(R3.id);
    let from = null; for (const [dx, dz] of [[5, 0], [-5, 0], [0, -5], [0, 5], [3.5, 3.5], [-3.5, 3.5], [3.5, -3.5], [-3.5, -3.5]]) { const x = t.roost[0] + dx, z = t.roost[1] + dz; if (T.open(g3, x, z, 0.8) && gp.lineClear(g3, x, z, t.roost[0], t.roost[1], 0.3)) { from = [x, z]; break; } }
    if (!from) return { error: 'nowhere to set them down by the bench' };
    T.toy(g3, t.roost[0] - (from[0] - t.roost[0]) * 0.9 + 2.5, t.roost[1] - (from[1] - t.roost[1]) * 0.9 - 2.5, y, t.roost); await sleep(500);
    o.placed = esc.place(t.id, from[0], from[1]); await T.wait(() => E.body === true, 6);
    const O = { d0: 4.2, h: 1.4, lift: 0.95 }, c = T.cam(E, [t.roost], { ...O, at: [(from[0] + t.roost[0]) / 2, (from[1] + t.roost[1]) / 2] });
    T.track = { E, c, o: O, lift: 0.95, max: 9 }; await sleep(600); await T.sharp(); o.go = esc.go(t.id, t.roost[0], t.roost[1]); T.rec('3-roost');
    o.roosted = await T.wait(() => E.build && E.build.roost, 16); await sleep(900);
    T.track = null; T.cam(E, [], { d0: 2.1, h: 1.05, lift: 0.6 }); await sleep(2300); T.rec(''); o.room = E.room; return o;
  };
  // a robot's lamp: its search colour, warm white, and home in strokes
  const segLamp = async t => {
    const T = window.__T, { G, esc, F, sleep } = T, V = window.__virt, o = {};
    T.rec(''); T.track = T.dog = null; G.set.guards = true; esc.home('all'); G.testEye = null; await sleep(300); await T.hush();
    const E = esc.get(t.id), a = E.art, y = E.y, foot = [a.x + a.nx * 0.1, a.z + a.nz * 0.1];
    T.lights(t.lampAt[0], t.lampAt[1], y); T.lights(a.x, a.z, y); T.toy(null, t.lampAt[0], t.lampAt[1], y); await sleep(1200);
    const w = await T.out(t.id, t.lampAt); if (w !== true) return { error: w };
    const hid = T.hidden(E); if (hid) T.toy(null, hid[0], hid[1], y); T.cam(E, [], { ...t.eye, d0: Math.max(t.eye.d0, 2.6) }); await sleep(1800); await T.sharp(12);
    if (E.state !== 'out' || E.body !== true) { G.set.guards = false; return { retry: true, error: 'gone, or without a body, before the lamp: ' + E.state }; }
    const l = esc.lamp(t.id, { dist: 4.4 }); if (!l) { G.set.guards = false; return { error: 'no robot’s beat reaches ' + E.room }; }
    const B = () => esc.bots()[l.bot], O = { ...t.eye, d0: Math.max(t.eye.d0, 2.6), h: Math.max(t.eye.h, 1.1) }, c = T.cam(E, [[l.x, l.z]], { ...O, lean: 0.3 });
    T.track = { E, c, o: O, lift: t.eye.lift, also: [[l.x, l.z]], lean: () => { const b = B(); return [b.x, b.z]; }, k: 0.28 };
    const t0 = V.t; await sleep(1500); T.rec('4-lamp'); const secs = () => +((V.t - t0) / 1000).toFixed(1), st = {}; let c2 = c, end = 0;
    for (let i = 0; i < 450; i++) {
      await sleep(100); const bt = B(), s = secs();
      if (E.state === 'out' && E.body !== true) { G.set.guards = false; esc.home('all'); return { retry: true, error: 'spoiled: a robot found the toy, and the thing lost its body' };  }
      if (o.lit == null && E.lit > 0.05) o.lit = s; if (o.warm == null && bt.warm > 0.5) o.warm = s; if (o.going == null && E.state === 'going') o.going = s;
      if (E.state === 'going') { T.track = null; c2 = T.homeward(E, c2, st, t.eye.d0 > 3 ? 1 : 0.72); }
      if (E.state === 'going' && E.going.t > Math.max(E.going.flow * 1.15 + 0.5, E.going.T - 1.5)) break;      // (its last stroke is in: the wait after it, for the chime, is not filmed)
      if (E.state === 'home') break;
    }
    T.rec(''); await T.wait(() => E.state !== 'going', 8); o.home = secs(); o.state = E.state; o.bot = l.bot; G.set.guards = false; if (E.state !== 'home') esc.home(t.id, 'now'); return o;
  };
  // the toy as sheepdog
  const segHerd = async t => {
    const T = window.__T, { G, esc, F, sleep } = T, V = window.__virt, o = {};
    T.rec(''); T.track = T.dog = null; G.set.guards = false; esc.home('all'); G.testEye = null; await sleep(300);
    const E = esc.get(t.id), a = E.art, y = E.y, foot = [a.x + a.nx * 0.1, a.z + a.nz * 0.1];
    const spot = F._spot(E) || { x: a.x + a.nx, z: a.z + a.nz }, at = T.near(E, spot, t.from || 5) || t.herdAt;      // (near home, so the film is short: the stills run herds it from far off)
    T.lights(a.x, a.z, y); T.toy(F._grid(E), at[0] + a.nx * 1.5, at[1] + a.nz * 1.5, y); await sleep(1200); await T.hush();
    const w = await T.out(t.id, at); if (w !== true) return { error: w };
    await sleep(t.key === 'lambs' ? 5200 : 1000);
    const g = F._grid(E); o.from = +Math.hypot(E.x - spot.x, E.z - spot.z).toFixed(1);
    let dx = E.x - spot.x, dz = E.z - spot.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
    const off = Math.min(1.9, Math.max(1.6, (E.spec.herd || 1.5) * 0.2 + (E.spec.radius || 0.5) * 0.5 + 1.2)),      /* (it is led by a toy within 2.2 m of its middle) */ q = T.snap(g, E.x + dx * (off + 2.6), E.z + dz * (off + 2.6), 0.5, 2.5) || T.snap(g, E.x + dx * (off + 1), E.z + dz * (off + 1), 0.5, 2) || [E.x + dx * off, E.z + dz * off];
    T.toy(null, q[0], q[1], y, [E.x, E.z]);
    // (an eye on the side it is going to, near enough to see what it is, with the toy behind it in the picture)
    const O = { ...t.eye, d0: t.eye.d0 + 0.5, h: t.eye.h + 0.2 }, c = T.cam(E, [q], O);
    T.track = { E, c, o: O, lift: t.eye.lift, also: [q], max: O.d0 + 2.3, pt: () => { const v = G.vehicle.pos; return [E.x * 0.75 + v.x * 0.25, E.z * 0.75 + v.z * 0.25]; } };
    await T.sharp(12); T.rec('5-herd'); await sleep(500); T.dog = { E, spot, x: q[0], z: q[1], yaw: Math.atan2(E.x - q[0], E.z - q[1]), t: 0, y, off };
    const t0 = V.t, secs = () => +((V.t - t0) / 1000).toFixed(1), st = {}; let end = 0;
    for (let i = 0; i < 600; i++) {
      await sleep(100); const s = secs(), by = E.build && E.build.boy;
      if (o.led == null && E.led > 0) o.led = s; if (o.going == null && E.state === 'going') o.going = s;
      if (E.state === 'out' && T.track) T.track.also = [[G.vehicle.pos.x, G.vehicle.pos.z]];
      if (E.state === 'going') {
        if (E.going.over && by && by.x != null && by.state !== 'gone') { if (!st.boy) { st.boy = true; T.track = { E, o: { d0: 3.2, h: 1.25 }, lift: 0.55, also: [foot], pt: () => [by.x, by.z] }; } }
        else if (!st.two) { st.two = true; T.track = null; T.cam(E, [foot], { at: [spot.x, spot.z], d0: Math.max(2.4, t.eye.d0), h: 1.15, lift: 0.7, lean: 0.8 }); }
      }
      if (E.state === 'home') { o.home = o.home == null ? s : o.home; if (++end > 16) break; }
    }
    T.rec(''); o.state = E.state; o.said = T.said.slice(-2); if (E.state !== 'home') esc.home(t.id, 'now'); return o;
  };

  // (the game's own first hints are let go by before anything is filmed, and its said-once hints (the robots', a dark
  // room's, a racer's hello) are counted as told: what is read on the film is then the escape's own)
  await drive(path.join(TMP, '0'), async id => { const T = window.__T, { G, esc } = T, E = esc.get(id), a = E.art; G.told.has = key => !/^escape-/.test(String(key)) || Set.prototype.has.call(G.told, key); T.toy(null, a.x + a.nx * 4, a.z + a.nz * 4, E.y); await T.wait(() => G.t > 40, 90); await T.sleep(2500); await T.hush(40); return {}; }, TESTS[0].id);
  for (const t of TESTS) {
    say(`\n== ${t.key.toUpperCase()}  ${t.id}  the film`);
    const beats = await p.evaluate(t => window.__T.beats(window.__esc.get(t.id)), t), dir = path.join(TMP, t.key), parts = [];
    t.about = t.key === 'hats' ? 1.6 : 4; if (t.key === 'parasol') t.eye = { ...t.eye, d0: 2.5 }; if (t.key === 'lambs') t.eye = { ...t.eye, d0: 2.2, h: 0.85 };      // (small things, filmed from nearer than the stills are taken)
    let r = await drive(path.join(dir, '1'), segOut, t); parts.push(['1', r]);
    say(`  getting out and about: ${r.error || `${(r.frames / FPS).toFixed(1)} s; let out ${r.how}; said ${JSON.stringify(r.said)}; ended in ${r.room}`}`);
    if (t.roost) { r = await drive(path.join(dir, '2'), segRoost, t); parts.push(['2', r]); say(`  the roost: ${r.error || `${(r.frames / FPS).toFixed(1)} s; set down in ${r.placed} (${r.reach ? 'a room they know from home' : 'NOT a room they know: only by the test'}) and sent to the bench (${r.go ? 'went' : 'no way'}); down on it: ${r.roosted}`}`); }
    if (!beats.bots.length) say('  the lamp: not filmed. No robot’s beat reaches any room it knows (' + beats.rooms.join(' ') + '): in play it is only ever herded home.');
    else { for (let go = 0; go < 3; go++) { r = await drive(path.join(dir, '3'), segLamp, t); if (!r.retry) break; say('  the lamp: ' + r.error + '; again'); }
      parts.push(['3', r]); say(`  the lamp: ${r.error || `${(r.frames / FPS).toFixed(1)} s; BOT-${String(r.bot).padStart(2, '0')}: on it at ${r.lit} s, warm white at ${r.warm} s, going home at ${r.going} s, home at ${r.home} s${r.state !== 'home' ? ' (NOT HOME: ' + r.state + ')' : ''}`}`); }
    r = await drive(path.join(dir, '4'), segHerd, t); parts.push(['4', r]);
    say(`  herded: ${r.error || `${(r.frames / FPS).toFixed(1)} s; from ${r.from} m off: it set off at ${r.led} s, went in at ${r.going} s, home at ${r.home} s${r.state !== 'home' ? ' (NOT HOME: ' + r.state + ')' : ''}; said ${JSON.stringify(r.said)}`}`);
    // one film of the parts, in order
    const all = path.join(dir, 'all'); fs.mkdirSync(all, { recursive: true }); let n = 0;
    for (const [k, q] of parts) { if (q.error) continue; for (const f of fs.readdirSync(path.join(dir, k)).sort()) fs.renameSync(path.join(dir, k, f), path.join(all, String(n++).padStart(5, '0') + '.jpg')); }
    const mp4 = path.join(OUT, t.key + '.mp4'), ff = n ? spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(all, '%05d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], { encoding: 'utf8' }) : { status: 1, stderr: 'no frames' };
    say(ff.status === 0 ? `  film: ${mp4}  ${(n / FPS).toFixed(1)} s, ${(fs.statSync(mp4).size / 1e6).toFixed(1)} MB` : '  film: NOT MADE: ' + String(ff.stderr || ff.error).trim().split('\n').pop());
    if (!process.env.ESC_KEEP) fs.rmSync(dir, { recursive: true, force: true });
    const e = took(); say('  page errors: ' + (e.length ? '\n    ' + e.join('\n    ') : 'none'));
  }
  if (!process.env.ESC_KEEP) fs.rmSync(TMP, { recursive: true, force: true });
}

// ------------------------------------------------------------ the rule --
if (SCENES.includes('rules')) {
  say('\n== THE RULE');
  const r1 = await p.evaluate(async () => {
    const { G, esc, F, gp, sleep } = window.__T, T = window.__T, o = {};
    G.set.guards = false; esc.home('all'); G.testEye = null; await sleep(300); T.ungate();      // (the monkey counts among them as it would once its passage is found)
    // the cap: how many may be out at once
    o.cap = esc.caps; o.release = esc.specs().map(s => s.tag + ' ' + esc.release(s.id, { quiet: true })); o.out = esc.list().length;
    // bodies: a flock's creatures count, and what is far from the toy is only a record
    const H = esc.get('HATS'), La = esc.get('LAMBS');
    if (H && La && H.state === 'out' && La.state === 'out') { const a = H.art; T.lights(a.x, a.z, H.y); T.toy(F._grid(H), a.x + 6, a.z - 4.5, H.y); await sleep(600); esc.place('HATS', a.x + 3, a.z - 3); esc.place('LAMBS', a.x + 8, a.z - 6, H.y); await sleep(1500);
      o.bodies = esc.list().map(q => q.tag + (q.body ? ' body' + (esc.get(q.id).n > 1 ? ' x' + esc.get(q.id).n : '') : ' record')); o.cost = esc.cost(); o.frame = await T.frames(90);
      const c = T.cam(H, [[La.x, La.z]], { d0: 4.5, h: 1.6 }); await T.shot('rule', 'two-flocks'); }
    // far from the toy: a record that moves on a slow clock
    const far = esc.list().find(q => !q.body); if (far) { const E = esc.get(far.id), x = E.x, z = E.z, room = E.room; esc.roam(far.id, 0.5); await sleep(14000); o.record = far.tag + ' (no body) moved ' + Math.hypot(E.x - x, E.z - z).toFixed(1) + ' m in 14 s, ' + room + ' > ' + E.room; }
    // the tracker: green dots, by name
    const { Tracker } = await import('/src/tracker.js'), Tk = new Tracker(G);
    for (const yy of [0, 5.2]) { const cv = document.createElement('canvas'); cv.width = 1100; cv.height = 700; const lv = Tk.levelOf(yy); try { Tk.draw(cv.getContext('2d'), 1100, 700, { level: lv, t: 1.2, clearance: 1, dpr: 1 }); await window.__save('rule-tracker-' + lv.id + '.png', cv.toDataURL('image/png')); } catch (e) { o.trackerError = String(e).slice(0, 160); } }
    o.tracker = Tk.escapes().map(e => e.id + ' ' + e.level + ' ' + e.room + ' ' + e.state);
    // kept between visits
    await sleep(2600); try { o.saved = JSON.parse(localStorage.getItem('after-hours.escapes')).out.map(q => q.id + ' ' + q.room); sessionStorage.setItem('esc-keep', '1'); } catch (e) { o.saved = 'nothing saved: ' + e; }
    return o;
  });
  say(`  cap ${r1.cap.out} out at once (${r1.cap.bodies} bodies; lowmem ${r1.cap.lowmem}): ${r1.release.join('; ')}  -> ${r1.out} out`);
  if (r1.bodies) say(`  bodies: ${r1.bodies.join(', ')}; cost ${JSON.stringify(r1.cost)}; frame ${r1.frame.avg} ms (worst ${r1.frame.worst})`);
  if (r1.record) say(`  far from the toy: ${r1.record}`);
  say(`  tracker: ${r1.tracker.join('; ')}${r1.trackerError ? '  ERROR ' + r1.trackerError : ''}  (rule-tracker-*.png)`);
  say(`  saved: ${JSON.stringify(r1.saved)}`);
  await boot();
  const r2 = await p.evaluate(async () => {
    const { G, esc, F, gp, sleep, features } = window.__T, T = window.__T, o = {};
    try { sessionStorage.removeItem('esc-keep'); } catch { /* fine */ }
    o.restored = esc.list().map(q => q.tag + ' ' + q.room); G.set.guards = false;
    // the switch
    const box = document.querySelector('input[data-set="escapes"]'); o.box = box ? 'there, ' + (box.checked ? 'on' : 'off') : 'MISSING';
    G.set.escapes = false; await sleep(500); o.off = { out: esc.list().length, release: esc.release(25865), box: box ? box.checked : null };
    G.set.escapes = true; await sleep(500); o.on = esc.on;
    // the quiet rooms: nothing roams into them, nothing can be put in them, nothing is sent through them
    const M = esc.get('MONKEY'), a = M.art; T.lights(a.x, a.z, M.y); T.toy(F._grid(M), a.x + 3, a.z - 3, M.y); await sleep(800);
    await T.out(27992, [a.x + 3.5, a.z - 3]); const Q = G.plan.byId.G241, qx = (Q.x0 + Q.x1) / 2, qz = (Q.z0 + Q.z1) / 2;
    o.quiet = { rooms: esc.quiet, monkeyKnows: F._grid(M).rooms, go241: esc.go(27992, qx, qz), place241: esc.place(27992, qx, qz) };
    // the parasol, set down beside a quiet room and blown about for half a minute: where the gust takes it
    await T.out(14620, null); o.quiet.parasolUp = esc.place(14620, a.x + 3.5, a.z - 3.4, M.y); const P = esc.get(14620), seen = [P.room];
    T.cam(P, [], { d0: 4.5, h: 1.6 });
    for (let i = 0; i < 34; i++) { if (P.rest > 100) esc.roam(14620, 0.2); await sleep(1000); if (!seen.includes(P.room)) seen.push(P.room); const R = G.plan.rooms.find(R => Math.abs(R.y - P.y) < 0.2 && P.x > R.x0 && P.x < R.x1 && P.z > R.z0 && P.z < R.z1); if (R && esc.quiet.includes(R.id)) o.quiet.BROKE = R.id; if (i % 6 === 2) { T.cam(P, [], { d0: 4.5, h: 1.6 }); await T.shot('rule', 'parasol-upstairs-' + T.pad(i)); } }
    o.quiet.parasolWent = seen; o.quiet.parasolKnows = F._grid(P).rooms; esc.home('all');
    // reduced motion: home is a slow fade, no strokes, no flash
    G.set.guards = false; const K = esc.get(25865), ka = K.art; T.lights(ka.x, ka.z, K.y); T.toy(F._grid(K), ka.x + 7, ka.z + 5, K.y); await sleep(900);
    await T.out(25865, [ka.x + 4, ka.z + 2.5]); G.set.reduce = true; await sleep(600); T.cam(K, [[ka.x, ka.z]], { d0: 4, h: 1.5 });
    await T.shot('rule-reduced', '00'); esc.home(25865, 'light'); o.reduce = { strokes: K.going ? K.going.strokes.length : null, secs: K.going ? +K.going.T.toFixed(1) : null };
    for (let i = 1; i < 12 && K.state !== 'home'; i++) { await sleep(450); await T.shot('rule-reduced', T.pad(i)); }
    G.set.reduce = false; esc.home('all'); G.testEye = null;
    return o;
  });
  say(`  after a reload: ${JSON.stringify(r2.restored)}`);
  say(`  the switch: ${r2.box}; off: ${r2.off.out} out, release says "${r2.off.release}", box ${r2.off.box}; on again: ${r2.on}`);
  say(`  quiet rooms ${r2.quiet.rooms.join(' ')}: the monkey's rooms ${r2.quiet.monkeyKnows.join(' ')}; sent into 241: ${r2.quiet.go241}; put into 241: ${r2.quiet.place241}`);
  say(`  the parasol beside 241 (put in ${r2.quiet.parasolUp}) for 34 s: went ${r2.quiet.parasolWent.join(' > ')}; its rooms ${r2.quiet.parasolKnows.join(' ')}${r2.quiet.BROKE ? '  IN A QUIET ROOM: ' + r2.quiet.BROKE : '; never in a quiet room'}`);
  say(`  reduced motion: ${r2.reduce.strokes} strokes, a ${r2.reduce.secs} s fade`);
  const e = took(); say('  page errors: ' + (e.length ? '\n    ' + e.join('\n    ') : 'none'));
}
strips();
await b.close();
