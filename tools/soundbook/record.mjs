#!/usr/bin/env node
// The sound book: every sound and piece of music the game makes, recorded to MP3, with a page to listen and mark them.
//
//   node tools/soundbook/record.mjs [--out ~/Desktop/Museum-sounds] [--port 8887] [--force] [--only id,id] [--group "Music"]
//                                   [--list] [--page-only] [--keep-webm]
//
// Serve the game first (a threaded static server on --port, from the repo root, with data/img/ for the pictures). It boots the
// game headless, unlocks the sound and, for each entry in catalogue.mjs (plus one per painting show, from __life.list()):
//   * hushes everything else (guards, gallery music, the slow chords, the carol, the room tone, the motor),
//   * runs the entry's setup (not recorded), then records while its trigger runs, for `secs` and a short tail,
//   * writes <out>/mp3/<id>.mp3 and <out>/wave/<id>.png, and measures the peak and the loudness (ffmpeg ebur128).
// Then it writes <out>/sounds.json and <out>/index.html (the review page, from page.html). Entries already recorded are
// skipped unless --force; --only and --group pick some to (re-)record. --page-only rebuilds the page from sounds.json.
//
// How it hears everything: before the game loads, AudioNode.prototype.connect is patched so that anything connected to a
// context's destination also feeds a tap (a MediaStreamAudioDestinationNode), which a MediaRecorder records as Opus. ffmpeg
// turns that into MP3. The levels are the game's defaults (master 0.8, music 0.8, motor 0.5) and nothing is normalised.
// Puppeteer: the copy inside mermaid-cli, or $PUPPETEER. ffmpeg: $FFMPEG, ~/Desktop/Avara-trailer/ffmpeg, or on the PATH.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { entries as CATALOGUE, lifeEntry, GROUPS } from './catalogue.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const args = process.argv.slice(2), opt = n => { const i = args.indexOf('--' + n); return i < 0 ? null : args[i + 1]; }, flag = n => args.includes('--' + n);
const port = Number(opt('port') || 8887);
const out = (opt('out') || '~/Desktop/Museum-sounds').replace(/^~/, os.homedir());
const only = opt('only') ? new Set(opt('only').split(',').map(s => s.trim())) : null, group = opt('group');
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const FFMPEG = process.env.FFMPEG || [path.join(os.homedir(), 'Desktop/Avara-trailer/ffmpeg'), '/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg'].find(f => fs.existsSync(f)) || 'ffmpeg';
const TAIL = 1.5;                         // seconds recorded after an entry's `secs`, for the room's echo
const CLIP = -1, SILENT = -60, OUTLIER = 10;   // peak dBFS above which it clips; loudest moment (LUFS) below which it is silent; LU from its group's median

fs.mkdirSync(path.join(out, 'mp3'), { recursive: true }); fs.mkdirSync(path.join(out, 'wave'), { recursive: true });
const metaFile = path.join(out, 'sounds.json');
const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};

// Where a source line is, for entries that name a pattern instead of a line ('src/audio.js#bump(' -> 'src/audio.js:217').
function where(src) {
  if (!src || !src.includes('#')) return src;
  const [file, pat] = src.split('#'); const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return file;
  const i = fs.readFileSync(p, 'utf8').split('\n').findIndex(l => l.includes(pat));
  return i < 0 ? file : `${file}:${i + 1}`;
}

// ------------------------------------------------------------------ the page side --
// Installed before any of the game's code runs.
function tapAudio() {
  const C = AudioNode.prototype.connect, D = AudioNode.prototype.disconnect;
  const buses = new Map();
  const bus = ctx => {
    let b = buses.get(ctx);
    if (!b) {
      const g = ctx.createGain(), tap = ctx.createMediaStreamDestination(), an = ctx.createAnalyser();
      an.fftSize = 2048; C.call(g, tap); C.call(g, an);
      b = { g, tap, an, ctx }; buses.set(ctx, b);
      if (buses.size > 1) console.warn('soundbook: a second AudioContext; only the first is recorded');
    }
    return b;
  };
  window.__sbBus = () => [...buses.values()][0] || null;
  // Every source still playing, and the line of game code that started it (to say what is still sounding).
  const live = window.__sbLive = new Set();
  for (const P of [AudioScheduledSourceNode.prototype, AudioBufferSourceNode.prototype]) {
    const S0 = P.start;
    P.start = function (...r) {
      const at = (new Error().stack || '').split('\n').slice(2).find(l => /\/src\//.test(l)) || '';
      this.__sbAt = at.replace(/^.*\/src\//, 'src/').replace(/\)$/, ''); live.add(this); this.addEventListener('ended', () => live.delete(this));
      return S0.apply(this, r);
    };
  }
  window.__sbLinks = [];
  AudioNode.prototype.connect = function (dst, ...r) {
    const res = C.call(this, dst, ...r);
    if (dst instanceof AudioDestinationNode) C.call(this, bus(this.context).g);
    if (window.__sbLinks && window.__sbLinks.length < 4000) window.__sbLinks.push([this, dst]);
    return res;
  };
  AudioNode.prototype.disconnect = function (dst, ...r) {
    if (dst instanceof AudioDestinationNode) { try { D.call(this, bus(this.context).g); } catch { /* was not */ } }
    return D.call(this, dst, ...r);
  };
}

// The helper every setup and trigger gets: window.__sb (see README.md for the list).
function installHelper() {
  const G = window.__ah, k = G.features.kit, S = k.sound, wait = s => new Promise(r => setTimeout(r, s * 1000));
  const restores = [];
  // The room tone: the looped noise into a 220 Hz low-pass into a gain of 0.05, made in Sound._build.
  let roomTone = null;
  for (const [a, b] of window.__sbLinks || []) {
    if (a instanceof AudioBufferSourceNode && a.loop && b instanceof BiquadFilterNode && b.type === 'lowpass' && Math.round(b.frequency.value) === 220) {
      const g = (window.__sbLinks.find(([x]) => x === b) || [])[1]; if (g instanceof GainNode) roomTone = g;
    }
  }
  window.__sbLinks = null;
  const sb = {
    G, k, S, wait, roomTone,
    features: null,
    feat(id) { return sb.features.find(f => f.id === id) || null; },
    mod: p => import('/src/' + p),
    now: () => S.ctx.currentTime,
    // Patch obj[name] for this entry only; put back when it is done.
    patch(obj, name, fn) { const had = Object.prototype.hasOwnProperty.call(obj, name), was = obj[name]; obj[name] = fn; restores.push(() => { if (had) obj[name] = was; else delete obj[name]; }); return was; },
    later(fn) { restores.push(fn); },
    // Put the toy somewhere: a room id (its middle), or x, y, z.
    place(x, y, z, yaw) {
      if (typeof x === 'string') { const r = G.plan.byId[x]; if (!r) throw new Error('no room ' + x); return sb.place((r.x0 + r.x1) / 2, r.y + 0.05, (r.z0 + r.z1) / 2, y); }
      const v = G.vehicle; v.pos.set(x, y, z); v.vel.set(0, 0, 0); if (yaw != null && 'yaw' in v) v.yaw = yaw;
      if (v.speed != null) v.speed = 0; if (v.throttle != null) v.throttle = 0;
    },
    room: id => G.plan.byId[id],
    // Set an AudioParam now, dropping anything scheduled on it (a plain .value can lose to an automation under way).
    hold(p, v) { p.cancelScheduledValues(0); p.setValueAtTime(v, S.ctx.currentTime); p.value = v; },
    // Everything else quiet. The quiet room is found once (the motor, the slow chords and the room tone off, nothing near).
    quiet() {
      G.set.guards = false; G.set.gallerymusic = false; S.musicOn = false;
      if (S.padGain) sb.hold(S.padGain.gain, 0);
      if (roomTone) sb.hold(roomTone.gain, 0);
      if (S.motorVol) sb.hold(S.motorVol.gain, 0);
      S.setSlow && S.setSlow(1); if (S.tone) S.tone.frequency.value = 20000;
      if (!S._sbCarol) { S._sbCarol = S.carol; S.carol = () => {}; }
      if (G.state === 'study') G.shell.endLook();
      if (G.racing && G.race) G.race.stop();
      if (sb.quietSpot) sb.place(...sb.quietSpot);
    },
    // The motor as if the toy were moving: v = { kind: 'car', speed, throttle, air } or a drone/saucer
    // ({ spec: { hum: 'ufo' }, thrust, landed }). Holds until the entry ends.
    motor(v) { sb.hold(S.motorVol.gain, S.vol.motor); const up = S.update; sb.patch(S, 'update', (_v, _a) => up.call(S, v, true)); },
    carol(on = true) { S.carol = on ? S._sbCarol : () => {}; },
    level() { const b = window.__sbBus(); if (!b) return -99; const a = new Float32Array(b.an.fftSize); b.an.getFloatTimeDomainData(a); let m = 0; for (const x of a) m = Math.max(m, Math.abs(x)); return m > 0 ? 20 * Math.log10(m) : -99; },
    async settle(max = 6, below = -58) { const t0 = performance.now(); let quietFor = 0; while (performance.now() - t0 < max * 1000) { await wait(0.1); quietFor = sb.level() < below ? quietFor + 0.1 : 0; if (quietFor >= 0.5) return true; } return false; },
    cleanup() { while (restores.length) { try { restores.pop()(); } catch (e) { console.error('soundbook cleanup', e); } } },
    // Record: start the recorder, run the trigger, stop after secs + tail; the Opus file comes back as base64.
    async record(trigger, secs, tail) {
      const b = window.__sbBus(); if (!b) return { error: 'no audio context' };
      const rec = new MediaRecorder(b.tap.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 }), chunks = [];
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      const done = new Promise(r => { rec.onstop = r; });
      rec.start(); await wait(0.15);
      let error = null, peakDb = -99;
      const meter = setInterval(() => { peakDb = Math.max(peakDb, sb.level()); }, 30);
      const p = (async () => { try { await trigger(sb); } catch (e) { error = String(e && e.stack || e); } })();
      await wait(secs + tail);
      clearInterval(meter); rec.stop(); await done;
      const buf = new Uint8Array(await new Blob(chunks, { type: 'audio/webm' }).arrayBuffer());
      let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      return { b64: btoa(s), error, peakDb };
    },
  };
  return import('/src/features.js').then(m => { sb.features = m.features; window.__sb = sb; return true; });
}

// ------------------------------------------------------------------ the node side --
function ff(argv) { return spawnSync(FFMPEG, argv, { encoding: 'utf8', maxBuffer: 64 << 20 }); }
function measure(file) {
  const r = ff(['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const log = r.stderr || '';
  let mmax = -120; for (const m of log.matchAll(/ M:\s*(-?[\d.]+|-inf)/g)) { const v = m[1] === '-inf' ? -120 : Number(m[1]); if (v > mmax) mmax = v; }
  const sum = log.slice(log.lastIndexOf('Summary:'));
  const I = Number((sum.match(/I:\s*(-?[\d.]+|-inf)\s*LUFS/) || [])[1]);
  const peak = Number((sum.match(/Peak:\s*(-?[\d.]+|-inf)\s*dBFS/) || [])[1]);
  const dur = Number((log.match(/Duration: (\d+):(\d+):([\d.]+)/) || []).slice(1).reduce((a, x, i) => a + Number(x) * [3600, 60, 1][i], 0));
  return { lufs: Number.isFinite(I) ? I : -70, momentary: mmax, peak: Number.isFinite(peak) ? peak : -120, dur };
}

function allEntries(lives) {
  const list = [...CATALOGUE];
  for (const L of lives) list.push(lifeEntry(L, ROOT));
  for (const e of list) { e.src = where(e.src); e.group = e.group || 'Other'; }
  return list;
}
function pick(e) { if (only) return only.has(e.id); if (group) return e.group === group; return true; }

function flags(list) {
  // Each recorded entry against its group's median loudest moment.
  const byGroup = {}, peaks = {};
  for (const e of list) { const m = meta[e.id]; if (m && m.mp3 && m.momentary >= SILENT) { (byGroup[e.group] ||= []).push(m.momentary); (peaks[e.group] ||= []).push(m.peak); } }
  const median = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; };
  for (const e of list) {
    const m = meta[e.id]; if (!m || !m.mp3) continue;
    const w = [];
    if (m.peak > CLIP) w.push({ kind: 'clip', text: `peaks at ${m.peak.toFixed(1)} dBFS` });
    if (m.momentary < SILENT && m.peak < -45) w.push({ kind: 'silent', text: `nearly silent (peak ${m.peak.toFixed(0)} dBFS, loudest ${m.momentary.toFixed(0)} LUFS): a broken trigger, or too quiet to hear` });
    else if (m.momentary < SILENT) w.push({ kind: 'quiet', text: `very quiet (loudest ${m.momentary.toFixed(0)} LUFS)` });
    const med = median(byGroup[e.group] || []);
    if (med != null && m.momentary >= SILENT && (byGroup[e.group] || []).length >= 4) {
      const d = m.momentary - med, dp = m.peak - median(peaks[e.group]);      // (both the loudest moment and the peak, so a short click is not called quiet for being short)
      if (d > OUTLIER && dp > OUTLIER) w.push({ kind: 'loud', text: `${d.toFixed(0)} LU louder than its group` });
      if (d < -OUTLIER && dp < -OUTLIER) w.push({ kind: 'quiet', text: `${(-d).toFixed(0)} LU quieter than its group` });
    }
    if (m.error) w.push({ kind: 'error', text: 'the trigger threw: ' + m.error.split('\n')[0].slice(0, 160) });
    m.warn = w;
  }
}

function writePage(list) {
  flags(list);
  const rows = list.map(e => ({ id: e.id, group: e.group, title: e.title, when: e.when, src: e.src, note: e.note || '', recorded: !!(meta[e.id] && meta[e.id].mp3), ...(meta[e.id] || {}), notRecordedWhy: e.trigger ? (meta[e.id] && meta[e.id].mp3 ? '' : 'not recorded yet') : (e.note || 'not recorded yet') }));
  for (const r of rows) delete r.b64;
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 1));
  const order = GROUPS.concat([...new Set(list.map(e => e.group))].filter(g => !GROUPS.includes(g)));
  const html = fs.readFileSync(path.join(HERE, 'page.html'), 'utf8')
    .replace('/*SOUNDS*/[]', JSON.stringify(rows).replace(/</g, '\\u003c'))
    .replace('/*GROUPS*/[]', JSON.stringify(order))
    .replace('/*BUILT*/""', JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')));
  fs.writeFileSync(path.join(out, 'index.html'), html);
  console.log('page:', path.join(out, 'index.html'));
}

// ------------------------------------------------------------------ run --
if (flag('page-only')) {
  const lives = Object.values(meta).filter(m => m.life).map(m => m.life);
  writePage(allEntries(lives)); process.exit(0);
}
if (flag('list')) { for (const e of allEntries([])) console.log(`${e.group.padEnd(28)} ${e.id.padEnd(30)} ${e.trigger ? (e.secs + 's').padStart(5) : ' none'}  ${e.title}`); process.exit(0); }

const puppeteer = (await import(PUP)).default;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'soundbook-profile-')), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'soundbook-'));
const browser = await puppeteer.launch({ headless: 'new', userDataDir: profile, protocolTimeout: 600000,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
let page, booted = 0;
const pageErrors = [];
async function boot() {
  if (page) await page.close().catch(() => {});
  page = await browser.newPage(); booted++;
  await page.setViewport({ width: 960, height: 540 });
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/artic\.edu|Failed to load resource/.test(t)) pageErrors.push(t); if (/^soundbook/.test(t)) console.log('  page:', t); });
  await page.evaluateOnNewDocument(tapAudio);
  await page.goto(`http://127.0.0.1:${port}/?mode=explore&saved&noopen`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForFunction('window.__ah && window.__ah.state === "play" && window.__ah.features && window.__life', { timeout: 180000, polling: 500 });
  await page.evaluate(() => { window.__ah.features.kit.sound.unlock(); });
  await page.waitForFunction('window.__ah.features.kit.sound.ctx && window.__ah.features.kit.sound.ctx.state === "running"', { timeout: 20000 });
  await page.evaluate(installHelper);
  // The quiet spot: the first gallery with no gallery music, no painting show and nothing playing, found by listening.
  const spot = await page.evaluate(async () => {
    const sb = window.__sb, G = sb.G, { themeFor } = await sb.mod('music.js');
    const lives = new Set(window.__life.list().map(l => l.room));
    const cands = G.plan.rooms.filter(r => r.kind === 'gallery' && r.y > 3 && r.y < 12 && !themeFor(r) && !lives.has(r.id) && (r.x1 - r.x0) > 6 && (r.z1 - r.z0) > 6);
    for (const r of cands.slice(0, 12)) {
      sb.quietSpot = [(r.x0 + r.x1) / 2, r.y + 0.05, (r.z0 + r.z1) / 2, 0]; sb.quiet();
      await sb.wait(2); await sb.settle(4); let loud = -99; for (let i = 0; i < 50; i++) { await sb.wait(0.1); loud = Math.max(loud, sb.level()); } if (loud < -66) return { room: r.id, at: sb.quietSpot };
    }
    return { room: null };
  });
  console.log(`booted (${booted}); quiet room ${spot.room}`);
}
async function run(e) {
  const t0 = Date.now();
  await page.evaluate(() => { window.__sb.cleanup(); window.__sb.quiet(); });
  const calm = await page.evaluate(() => window.__sb.settle(8));
  if (!calm) {
    const why = await page.evaluate(async () => { const sb = window.__sb, G = sb.G, S = sb.S, l = []; for (let i = 0; i < 10; i++) { l.push(Math.round(sb.level())); await sb.wait(0.2); } const src = {}; for (const n of window.__sbLive) { const key = n.__sbAt + (n instanceof OscillatorNode ? ' osc' : ` buf${n.loop ? ' loop' : ''} ${n.buffer ? n.buffer.duration.toFixed(1) : '?'}s`); src[key] = (src[key] || 0) + 1; } return { src, levels: l.join(' '), state: G.state, room: G.roomId, motor: S.motorVol.gain.value, tone: sb.roomTone && sb.roomTone.gain.value, pad: S.padGain.gain.value, music: S.musicOn }; });
    console.log('  (still sounding after the last entry: starting the game afresh)', JSON.stringify(why)); await boot(); await page.evaluate(() => window.__sb.quiet()); await page.evaluate(() => window.__sb.settle(8)); }
  if (e.setup) {
    const err = await page.evaluate(`(async () => { try { await Promise.race([(${e.setup.toString()})(window.__sb), window.__sb.wait(90).then(() => { throw new Error('setup took over 90 s'); })]); return null; } catch (x) { return String(x && x.stack || x); } })()`);
    if (err) return { error: 'setup: ' + err };
    await page.evaluate(() => window.__sb.settle(4));                      // (lamps waking as the toy arrived, and the like)
  }
  const r = await page.evaluate(`window.__sb.record(${e.trigger.toString()}, ${e.secs}, ${e.tail ?? TAIL})`);
  await page.evaluate(async () => { const sb = window.__sb; sb.cleanup(); if (sb.G.state === 'study') sb.G.shell.endLook(); });
  if (e.after) await page.evaluate(`(async () => { try { await Promise.race([(${e.after.toString()})(window.__sb), window.__sb.wait(30)]); } catch (x) { console.error('soundbook after', x); } })()`);
  if (r.error && !r.b64) return { error: r.error };
  const webm = path.join(tmp, e.id + '.webm'), mp3 = path.join(out, 'mp3', e.id + '.mp3'), png = path.join(out, 'wave', e.id + '.png');
  fs.writeFileSync(webm, Buffer.from(r.b64, 'base64'));
  // The recorder takes a moment to start: the silence before the first sound is cut (all but a tenth of a second).
  const wav = path.join(tmp, e.id + '.wav');
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', webm, '-af', 'silenceremove=start_periods=1:start_threshold=-70dB:start_silence=0.1', '-c:a', 'pcm_f32le', wav]);
  if (fs.statSync(wav).size < 48000) execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', webm, '-c:a', 'pcm_f32le', wav]);      // (nothing there at all: keep it whole)
  const m = measure(wav);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libmp3lame', '-q:a', '2', mp3]);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', wav, '-filter_complex', 'aformat=channel_layouts=mono,showwavespic=s=1200x140:colors=#6f8796:scale=sqrt', '-frames:v', '1', png]);
  if (flag('keep-webm')) fs.copyFileSync(webm, path.join(out, e.id + '.webm'));
  fs.rmSync(webm); fs.rmSync(wav);
  return { mp3: `mp3/${e.id}.mp3`, wave: `wave/${e.id}.png`, ...m, error: r.error, took: Math.round((Date.now() - t0) / 1000) };
}

try {
  await boot();
  const lives = await page.evaluate(() => window.__life.list().map(l => { const L = window.__life.life(l.id); return { id: l.id, title: l.title, artist: L.art.work.a, room: l.room, word: l.word, linger: L.spec.linger ? L.spec.linger.max : 0, ret: L.retDur || L.spec.ret || 1.5 }; }));
  const list = allEntries(lives);
  for (const L of lives) { const e = list.find(x => x.life && x.life.id === L.id); if (e) meta[e.id] = { ...(meta[e.id] || {}), life: L }; }
  const todo = list.filter(e => e.trigger && pick(e) && (flag('force') || only || !(meta[e.id] && meta[e.id].mp3)));
  console.log(`${list.length} entries (${list.filter(e => !e.trigger).length} with no trigger yet); recording ${todo.length}`);
  let n = 0;
  for (const e of todo) {
    n++;
    let r;
    try { r = await run(e); } catch (x) { r = { error: String(x && x.message || x) }; console.log('  (the page fell over: starting it afresh)'); try { await boot(); } catch (y) { console.log('  boot failed', y.message); } }
    meta[e.id] = { ...(meta[e.id] || {}), ...r, life: (meta[e.id] || {}).life, at: new Date().toISOString() };
    if (!r.mp3) delete meta[e.id].mp3;
    const w = r.mp3 ? `peak ${r.peak.toFixed(1)} dBFS, loudest ${r.momentary.toFixed(1)} LUFS, I ${r.lufs.toFixed(1)}` : 'FAILED';
    console.log(`[${n}/${todo.length}] ${e.id}: ${w}${r.error ? '  error: ' + r.error.split('\n')[0].slice(0, 200) : ''}`);
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 1));
  }
  writePage(list);
  const warn = list.filter(e => meta[e.id] && meta[e.id].warn && meta[e.id].warn.length);
  if (warn.length) { console.log('warnings:'); for (const e of warn) console.log(`  ${e.id} (${e.src}): ${meta[e.id].warn.map(w => w.text).join('; ')}`); }
  if (pageErrors.length) console.log('page errors:', [...new Set(pageErrors)].slice(0, 15));
} finally {
  await browser.close().catch(() => {});
  fs.rmSync(tmp, { recursive: true, force: true }); fs.rmSync(profile, { recursive: true, force: true });
}
