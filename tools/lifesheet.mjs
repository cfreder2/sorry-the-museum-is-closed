#!/usr/bin/env node
// Paintings that come alive (src/paintlife.js): the checks and the pictures for review, for one work at a time.
//
//   node tools/lifesheet.mjs <id> [--port 8857] [--out ~/Desktop/Museum-life] [--video] [--no-sheet] [--phone]
//
// Serve the game first (any static server on --port, from the repo root, with data/img/ for the pictures). It boots
// the game headless, drives the toy into the work's room, looks at the work and then:
//   * runs the guarantee check (__life.check): the animation drawn alone from the look camera and seven others at
//     eight moments, and not one of its pixels may land on the canvas; prints the result;
//   * makes the contact sheet: the look camera at 0.5, 1.5, 3, 5 and 8 s, one low (the toy's eye) and one wide
//     room view, at <out>/<id>-<slug>-sheet.jpg;
//   * with --video, a ten-second film of the whole show, Wake to Return, on a fixed clock (30 frames a second),
//     at <out>/<id>-<slug>.mp4 (needs ffmpeg: $FFMPEG, ~/Desktop/Avara-trailer/ffmpeg, or on the PATH);
//   * with --phone, the frame cost in a phone-sized view (390 x 844 at 2x), with and without the show.
// Puppeteer: the copy inside mermaid-cli (see the memory note on headless testing), or $PUPPETEER.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2), opt = n => { const i = args.indexOf('--' + n); return i < 0 ? null : args[i + 1]; }, flag = n => args.includes('--' + n);
const id = Number(args.find(a => /^\d+$/.test(a)));
if (!id) { console.error('usage: node tools/lifesheet.mjs <work id> [--port 8857] [--out dir] [--video] [--no-sheet] [--phone]'); process.exit(1); }
const port = opt('port') || 8857, out = (opt('out') || path.join(os.homedir(), 'Desktop/Museum-life')).replace(/^~/, os.homedir());
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const FFMPEG = process.env.FFMPEG || [path.join(os.homedir(), 'Desktop/Avara-trailer/ffmpeg'), '/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg'].find(f => fs.existsSync(f)) || 'ffmpeg';
const puppeteer = (await import(PUP)).default;
fs.mkdirSync(out, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lifesheet-'));

const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const errors = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/artic\.edu|Failed to load resource/.test(m.text())) errors.push(m.text()); });      // (the museum's server refuses headless Chrome: not ours)
  await page.goto(`http://127.0.0.1:${port}/?mode=explore&saved&noopen`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction('window.__ah && window.__ah.state === "play" && window.__life', { timeout: 120000, polling: 500 });
  // Nothing on the screen but the world.
  await page.addStyleTag({ content: 'body > *:not(#view) { visibility: hidden !important; }' });
  const info = await page.evaluate(async id => {
    const G = window.__ah, L = window.__life.life(id);
    if (!L) return { error: 'that work is not hung tonight, or has no life (' + window.__life.list().map(l => l.id).join(', ') + ')' };
    // Drive the toy in: to the floor in front of the work, facing it.
    const p = L.floor(0.6, 2.2); G.vehicle.pos.set(p.x, L.y + 0.05, p.z); G.vehicle.vel.set(0, 0, 0);
    if ('yaw' in G.vehicle) G.vehicle.yaw = Math.atan2(-L.nx, -L.nz);
    await new Promise(r => setTimeout(r, 1200));
    await window.__life.ready(id);
    const a = L.art; for (let i = 0; i < 60 && a.tier < 2; i++) await new Promise(r => setTimeout(r, 250));      // the picture itself, loaded
    return { title: a.work.t, artist: a.work.a, room: a.room, tier: a.tier, palette: window.__life.palette(id), works: G.museum.arts.length };
  }, id);
  if (info.error) throw new Error(info.error);
  const slug = info.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').replace(/^(the|a|an)-/, '').split('-').slice(0, 4).join('-');
  console.log(`${id} ${info.title} (${info.artist}), ${info.room}; ${info.works} works hung; picture tier ${info.tier}; palette from ${info.palette.src}: ${info.palette.hex.join(' ')}`);

  // A real look, so the look camera is exactly the game's.
  const look = await page.evaluate(async id => {
    const G = window.__ah, L = window.__life.life(id);
    G.shell.look(L.art); window.__life.free(id); L.force = false;          // (the show waits, so the camera can settle)
    if (G.study) G.study.label = false;                                       // (the label away: the camera stands square to the work)
    await new Promise(r => setTimeout(r, 2600));
    const c = G.camera, d = new c.position.constructor(); c.getWorldDirection(d);
    return { at: c.position.toArray(), look: c.position.clone().addScaledVector(d, 3).toArray(), fov: c.fov };
  }, id);

  // The guarantee.
  const check = await page.evaluate((id, look) => window.__life.check(id, { look }), id, look);
  const rows = check.rows || []; delete check.rows;
  if (check.error) throw new Error(check.error);
  console.log('guarantee:', check.pass ? 'PASS' : 'FAIL', JSON.stringify(check));
  const byCam = {}; for (const r of rows) { const b = byCam[r.cam] || (byCam[r.cam] = { frames: 0, drawn: 0, others: 0, wouldBe: 0, wouldOthers: 0, visible: 0 }); b.frames++; b.drawn += r.drawn; b.others += r.drawnOthers; b.wouldBe += r.wouldBe; b.wouldOthers += r.wouldBeOthers; b.visible += r.visible; }
  console.log(`by camera: frames; animation px drawn on the work / on the room's other ${check.canvases - 1} canvases; px the guard cut there; animation px seen`);
  for (const [c, b] of Object.entries(byCam)) console.log(`  ${c.padEnd(8)} ${b.frames}  drawn ${b.drawn} / ${b.others}  cut ${b.wouldBe} / ${b.wouldOthers}  seen ${b.visible}`);

  const views = await page.evaluate(id => window.__life.cams(id), id);
  views.look = look;
  const shot = async (file, view, t, ret = null) => {
    await page.evaluate(async (id, view, t, ret) => {
      const G = window.__ah;
      await window.__life.pose(id, t, { ret });
      G.testEye = { at: view.at, look: view.look };
      if (view.fov && G.camera.fov !== view.fov) { G.camera.fov = view.fov; G.camera.updateProjectionMatrix(); }
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))));
    }, id, view, t, ret);
    await page.screenshot({ path: file, type: 'jpeg', quality: 88 });
  };
  const tiles = [];
  if (!flag('no-sheet')) {
    for (const t of [0.5, 1.5, 3, 5, 8]) { const f = path.join(tmp, `look-${t}.jpg`); await shot(f, views.look, t); tiles.push([f, `look camera, ${t} s`]); }
    { const f = path.join(tmp, 'low.jpg'); await shot(f, views.toy, 6); tiles.push([f, 'low, from the toy’s eye, 6 s']); }
    { const f = path.join(tmp, 'wide.jpg'); await shot(f, views.wide, 6); tiles.push([f, 'the room, 6 s']); }
    { const f = path.join(tmp, 'ret.jpg'); await shot(f, views.look, 8, 0.7); tiles.push([f, 'going back, 0.7 s after the look']); }
    const html = `<html><body style="margin:0;background:#15171b;font:15px/1.3 -apple-system,Helvetica,sans-serif;color:#e9e4d8">
      <div style="padding:14px 18px 6px"><b>${info.title}</b> · ${info.artist} · ${info.room} · work ${id} · guarantee ${check.pass ? 'PASS' : 'FAIL'}: ${check.frames} frames from ${check.cams} cameras, animation pixels on the work ${check.drawnOnCanvas}, on the room's ${check.canvases - 1} other pictures ${check.drawnOnOthers} (0 allowed); ${check.stats.calls} draw calls, ${check.stats.marks} marks</div>
      <div style="display:grid;grid-template-columns:repeat(4,480px);gap:8px;padding:8px 18px 18px">${tiles.map(([f, cap]) => `<figure style="margin:0"><img src="data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}" style="width:480px;display:block;border-radius:4px"><figcaption style="padding:4px 2px;color:#b9b3a6">${cap}</figcaption></figure>`).join('')}</div></body></html>`;
    const sp = await browser.newPage(); await sp.setViewport({ width: 4 * 480 + 3 * 8 + 36, height: 600 });
    await sp.setContent(html); const file = path.join(out, `${id}-${slug}-sheet.jpg`);
    await sp.screenshot({ path: file, type: 'jpeg', quality: 86, fullPage: true }); await sp.close();
    console.log('sheet:', file);
  }

  if (flag('phone')) {
    // A phone-sized view, with the processor slowed four times (as a mid-range phone's): frame times, draw calls and
    // triangles drawn per frame (the whole game's, every pass), without the show and with it; and the show's own update.
    // (in a page of its own, fresh: the checks and poses above leave the game in a state no player sees)
    const pp = await browser.newPage(); await pp.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await pp.goto(`http://127.0.0.1:${port}/?mode=explore&saved&noopen`, { waitUntil: 'domcontentloaded' });
    await pp.waitForFunction('window.__ah && window.__ah.state === "play" && window.__life', { timeout: 120000, polling: 500 });
    await pp.evaluate(async id => { const G = window.__ah, L = window.__life.life(id), q = L.floor(0.6, 2.2); G.vehicle.pos.set(q.x, L.y + 0.05, q.z); G.vehicle.vel.set(0, 0, 0); await new Promise(r => setTimeout(r, 1200)); await window.__life.ready(id); G.shell.look(L.art); await new Promise(r => setTimeout(r, 2500)); }, id);
    const cdp = await pp.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await new Promise(r => setTimeout(r, 1500));
    const cost = await pp.evaluate(async (id, view) => {
      const G = window.__ah, L = window.__life.life(id), r = G.renderer, wait = ms => new Promise(res => setTimeout(res, ms));
      r.info.autoReset = false;
      const sample = async secs => {
        const t = [], calls = [], tris = []; let last = performance.now(); const t0 = last; r.info.reset();
        await new Promise(res => { const f = now => { t.push(now - last); last = now; calls.push(r.info.render.calls); tris.push(r.info.render.triangles); r.info.reset(); if (now - t0 < secs * 1000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
        const med = a => { const b = a.slice(1).sort((x, y) => x - y); return b[b.length >> 1]; };
        const sorted = t.slice(1).sort((a, b) => a - b);
        return { medianMs: +med(t).toFixed(1), p95Ms: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1), calls: med(calls), tris: med(tris) };
      };
      G.testEye = { at: view.at, look: view.look };
      window.__life.free(id); L.reset(); L.force = false; await wait(1000);
      const off = await sample(4);
      L.force = true; await wait(5000);
      const on = await sample(4);
      const ms = L.ms; L.force = null; L.reset(); r.info.autoReset = true;
      return { off, on, updateMs: +ms.toFixed(3) };
    }, id, views.look);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await pp.close();
    console.log('phone view 390x844 at 2x, processor slowed 4x; per frame, the whole game: without the show', JSON.stringify(cost.off), 'with it', JSON.stringify(cost.on), '; the show\'s own update', cost.updateMs, 'ms');
  }
  if (flag('video')) {
    const frames = path.join(tmp, 'frames'); fs.mkdirSync(frames);
    await page.evaluate(async (id, view) => { await window.__life.pose(id, 0); window.__ah.testEye = { at: view.at, look: view.look }; }, id, views.look);
    let n = 0; const FPS = 30, SHOW = 8.5, BACK = 2.2;
    for (let i = 0; i < (SHOW + BACK) * FPS; i++) {
      await page.evaluate(async (id, dt, looking) => { window.__life.advance(id, dt, looking); if (!looking) window.__life.release(id); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, id, i === 0 ? 0 : 1 / FPS, i < SHOW * FPS);
      await page.screenshot({ path: path.join(frames, `f${String(n++).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 90 });
    }
    const file = path.join(out, `${id}-${slug}.mp4`);
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, 'f%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', file]);
    console.log('video:', file, `(${n} frames)`);
  }

} finally {
  if (errors.length) console.log('page errors:', errors.slice(0, 12));
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
