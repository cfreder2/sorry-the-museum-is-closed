// Build dist/ and push it to itch.io as the browser build, with butler.
//
// The itch page is cfreder2/sorry-the-library-is-closed (its slug, which need not match the repo's
// name), channel `html`. Butler only knows win, linux and mac, so the channel name does not make
// the upload playable in the browser: that is the tick box "This file will be played in the
// browser" on the itch Edit game page, set once by hand after the first push.
//
// usage:
//   node tools/push_itch.mjs              build, push
//   node tools/push_itch.mjs --dry-run    everything but the upload
//   node tools/push_itch.mjs --no-build   push dist/ as it stands (what CI does)
//   node tools/push_itch.mjs --target cfreder2/some-other-page:html
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const DIST = path.join(ROOT, 'dist');
const arg = n => process.argv.includes(n);
const ti = process.argv.indexOf('--target');
const TARGET = ti > 0 ? process.argv[ti + 1] : 'cfreder2/sorry-the-library-is-closed:html';

const fail = msg => { console.error(`\npush stopped: ${msg}`); process.exit(1); };
const run = (cmd, args) => spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT }).status;

if (!arg('--no-build') && run(process.execPath, [path.join(ROOT, 'tools', 'build.mjs')])) fail('the build said no.');
if (!fs.existsSync(path.join(DIST, 'index.html'))) fail('dist/index.html is missing: itch plays the index.html at the root of the upload.');

const stamp = (fs.readFileSync(path.join(DIST, 'src', 'main.js'), 'utf8').match(/const BUILD = '([^']+)'/) || [])[1];
const cmd = ['push', DIST, TARGET, '--if-changed'];
if (stamp) cmd.push('--userversion', stamp.replace(/[^\w.-]+/g, '-'));
if (arg('--dry-run')) cmd.push('--dry-run');
console.log('  butler ' + cmd.join(' '));
// itch takes one build per channel at a time and refuses the next while the last is processing.
const TRIES = 8, WAIT = +(process.env.ITCH_WAIT || 60);
let code, out = '';
for (let i = 1; i <= TRIES; i++) {
  const r = spawnSync('butler', cmd, { cwd: ROOT, encoding: 'utf8' });
  if (r.error) fail('butler is not on PATH. https://itch.io/docs/butler/installing.html');
  out = (r.stdout || '') + (r.stderr || '');
  process.stdout.write(out);
  code = r.status;
  if (!code || !/still processing/i.test(out) || i === TRIES) break;
  console.log(`  itch is still processing the last build: trying again in ${WAIT} s (${i}/${TRIES})`);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, WAIT * 1000);
}
if (code && /still processing/i.test(out)) fail(`itch was still processing the last build after ${TRIES} tries. The next push to main will try again.`);
if (code && /invalid game/i.test(out)) fail(`the itch page for ${TARGET.split(':')[0]} does not exist: create it first, as Kind of project: HTML.`);
if (code) fail(`butler exited ${code}.`);
console.log(arg('--dry-run') ? '\ndry run: nothing was uploaded.' : `\npushed ${TARGET}.`);
