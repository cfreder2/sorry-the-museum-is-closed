#!/usr/bin/env node
// The security desk's terminal (src/secterm.js) and its files (src/secfiles.js), checked without a browser:
//   node tools/check_secterm.mjs
// Both families of commands, the forgiving paths, the locked folder and its password, the editor's two files that
// can be saved, the building's switches present and absent, Tab, and a whole session done by the row of taps.
import assert from 'node:assert/strict';
import { VFS, FILES, HOME, LOCKED, checkPassword } from '../src/secfiles.js';
import { Term, EXPECTED } from '../src/secterm.js';

const kept = new Map(), log = [];
const env = { desk: 1, clock: '02:41', cam17: 'Bridge galleries, west', best: 420, bots: [{ id: 'BOT-00', level: '2', beat: '231-233 > 234e > 234' }], clearance: false };
const fs = new VFS({ store: { get: p => kept.get(p), set: (p, t) => kept.set(p, t) }, env: () => env });
let sys = null;
const T = new Term(fs, {
  systems: () => sys, bots: () => [{ id: 'BOT-00', level: '2', room: '231-233', state: 'PATROL' }, { id: 'BOT-04', level: '1', room: '127A', state: 'PURSUIT !', hot: true }],
  mice: () => [{ id: 'M1', wing: 'the old building, north', state: 'AT LARGE' }], clock: () => '02:41',
  edit: n => log.push('edit ' + n.path), app: a => log.push('app ' + a), exit: () => log.push('exit'), clear: () => log.push('clear'),
  read: n => log.push('read ' + n.path), unlock: () => log.push('unlock'), seen: () => [true, false], sound: s => log.push('sound ' + s),
});
const run = async l => (await T.run(l)).map(o => o.t).join('\n');
const has = (s, re) => assert.match(s, re);

// every line of every file fits a phone
let files = 0, longest = 0;
for (const [p, f] of Object.entries(FILES)) { files++; const t = typeof f.text === 'function' ? f.text(env) : f.text; for (const l of t.split('\n')) { longest = Math.max(longest, l.length); assert.ok(l.length <= 48, `${p}: line too long (${l.length}): ${l}`); } }
console.log(`${files} files, longest line ${longest}`);

// passwords
assert.equal(checkPassword('jar4waved'), 'ok'); assert.equal(checkPassword('JAR4 WAVED'), 'ok'); assert.equal(checkPassword('Jar4-Waved'), 'ok');
assert.equal(checkPassword('jar4'), 'half'); assert.equal(checkPassword('waved'), 'half'); assert.equal(checkPassword('wavedjar4'), 'half'); assert.equal(checkPassword('cheese'), 'no');

// looking and moving, both families
assert.equal(T.cwd, HOME);
has(await run('ls'), /handover\.txt/); has(await run('ls'), /mail\//); assert.doesNotMatch(await run('ls'), /\.history/);
has(await run('ls -a'), /\.history/);
has(await run('dir'), /Directory of \/home\/nightshift/); has(await run('DIR'), /<DIR>\s+mail\//);
has(await run('pwd'), /^\/home\/nightshift$/);
await run('cd ..'); assert.equal(T.cwd, '/home'); await run('cd..'); assert.equal(T.cwd, '/');
has(await run('ls'), /sublevel9\//); has(await run('ls'), /locked: CLEARANCE 9/);
await run('cd incidents'); assert.equal(T.cwd, '/incidents');
await run('cd ~'); assert.equal(T.cwd, HOME); await run('cd /'); assert.equal(T.cwd, '/'); await run('cd'); assert.equal(T.cwd, HOME);
await run('cd \\maintenance'); assert.equal(T.cwd, '/maintenance'); await run('cd C:\\cameras'); assert.equal(T.cwd, '/cameras');
await run('cd ../home/nightshift/mail'); assert.equal(T.cwd, HOME + '/mail'); await run('cd ~/mail/..'); assert.equal(T.cwd, HOME);
has(await run('cd nowhere'), /no such folder/); has(await run('cd handover.txt'), /that is a file/);
await run('CD /INCIDENTS'); assert.equal(T.cwd, '/incidents'); await run('cd ~');
await run('..'); assert.equal(T.cwd, '/home'); await run('nightshift'); assert.equal(T.cwd, HOME);

// reading
has(await run('cat handover.txt'), /sticky notes/); has(await run('type handover'), /HANDOVER/); has(await run('more /README.txt'), /SECDESK-01/);
has(await run('cat mail'), /that is a folder/); has(await run('cat nope.txt'), /no such file/); has(await run('cat'), /which file/);
has(await run('cat rota.txt'), /BOT-00\s+2\s+231-233/); has(await run('cat /cameras/camlist.txt'), /17 Bridge galleries, west\s+NO SIGNAL/);
has(await run('cat .donut_scores'), /best: 420/);
has(await run('handover.txt'), /Reading it/);

// the editor
log.length = 0;
has(await run('open notes.txt'), /Opening notes\.txt in the editor\.$/m); assert.ok(log.includes('edit ' + HOME + '/notes.txt'));
has(await run('nano handover.txt'), /read only/); has(await run('notepad /incidents/incident_log.txt'), /read only/); has(await run('vi notes.txt'), /Not really vi/);
has(await run('edit'), /open what/); has(await run('open mail'), /a folder/); assert.equal(T.cwd, HOME + '/mail'); await run('cd ~');
await run('open tracker'); assert.ok(log.includes('app tracker'));
// saving
const notes = fs.node(HOME, 'notes.txt'); assert.ok(fs.write(notes, 'the toy car is real')); assert.equal(fs.read(notes), 'the toy car is real'); has(await run('cat notes.txt'), /toy car is real/);
assert.equal(fs.write(fs.node(HOME, 'handover.txt'), 'x'), false);

// the locked folder, and the way in
has(await run('cd /sublevel9'), /Permission denied: CLEARANCE 9/); has(await run('cat /sublevel9/MANIFEST.txt'), /Permission denied/); has(await run('ls /sublevel9'), /Permission denied/);
has(await run('open /sublevel9/first_night.log'), /Permission denied/); has(await run('tree /'), /sublevel9\/\s+\[CLEARANCE 9\]/); assert.doesNotMatch(await run('tree /'), /MANIFEST/);
await run('cd /'); assert.doesNotMatch(await run('grep tarpaulin'), /first_night/); has(await run('grep tarpaulin'), /not searched: \/sublevel9/); await run('cd ~');
has(await run('login cheese'), /Wrong/); has(await run('login jar4'), /half of it/);
has(await run('login'), /Password\?/); assert.equal(T.mode, 'password'); assert.match(T.prompt, /password/);
assert.deepEqual(T.chips('').map(c => c.label), ['JAR4', 'cancel']);
has(await run(''), /cancelled/); assert.equal(T.mode, null);
await run('login'); log.length = 0; has(await run('Jar4 Waved'), /CLEARANCE 9 ACCEPTED/); assert.ok(fs.clearance && log.includes('unlock'));
has(await run('login'), /already have clearance 9/);
await run('cd /sublevel9'); assert.equal(T.cwd, LOCKED); has(await run('ls'), /first_night\.log/);
log.length = 0; has(await run('cat first_night.log'), /It sang\. Five notes/); assert.ok(log.includes('read ' + LOCKED + '/first_night.log'));
has(await run('whoami'), /clearance 9/); await run('cd /'); has(await run('grep tarpaulin'), /first_night\.log/); await run('cd ~');

// the rest
has(await run('help'), /grep <word>/); has(await run('whoami'), /nightshift/); has(await run('date'), /02:41/); has(await run('history'), /1  ls/);
log.length = 0; await run('clear'); await run('cls'); assert.equal(log.filter(l => l === 'clear').length, 2); await run('exit'); assert.ok(log.includes('exit'));
has(await run('grep Turner /incidents'), /0225_lobby_light\.txt: /); has(await run('grep zzzz'), /not a word/); has(await run('tree'), /`-- rota\.txt/);
has(await run('bots'), /BOT-04\s+1\s+127A\s+PURSUIT/); has(await run('mice'), /old building, north\s+AT LARGE/); has(await run('cams'), /NO SIGNAL/);
has(await run('sudo rm -rf /'), /sudoers/); has(await run('rm -rf /'), /delete evidence/); has(await run('format c:'), /Only joking/);
log.length = 0; has(await run('ping sublevel9'), /5 sent\. 5 answered/); assert.ok(log.includes('sound motif')); has(await run('ping lake'), /0 back/);
has(await run('shutdown -h now'), /does not end early/); has(await run('frobnicate'), /frobnicate/); has(await run('mkdir x'), /read-only night/);
assert.ok(fs.node('/', 'README.txt') && fs.node('/', 'incidents/incident_log.txt'), 'rm did nothing');

// the building's switches: absent, then present (and one that is slow)
has(await run('systems'), /link down/); for (const id of EXPECTED) has(await run(id), /system offline/);
sys = { list: () => [{ id: 'sprinklers', name: 'Sprinklers', usage: 'sprinklers <on|off|status> [zone]', about: 'Wet.' }, { id: 'lift', name: 'Lift', usage: 'lift <LL|1|2|3>', about: 'Up and down.' }],
  run: (id, args) => (id === 'lift' ? new Promise(r => setTimeout(() => r({ ok: true, lines: ['Lift called to ' + args[0] + '.'], sound: 'ding' }), 5)) : { ok: args[0] !== 'bad', lines: ['Sprinklers ' + (args[0] || 'status') + '.'] }) };
has(await run('systems'), /sprinklers <on\|off\|status>/); has(await run('sprinklers on lobby'), /Sprinklers on\./); has(await run('lift 3'), /Lift called to 3/); has(await run('run lift 2'), /Lift called to 2/);
has(await run('firetest'), /system offline/);
has(await run('help sprinklers'), /sprinklers <on\|off\|status> \[zone\]/); has(await run('help lift'), /Up and down/); has(await run('help'), /help <system>/);
sys.zones = () => ['lobby', { id: 'dock' }, 'lower level']; sys.wings = () => ['north'];
assert.deepEqual(T.chips('sprinklers ').map(c => c.label), ['enter', 'on', 'off', 'status', 'lobby', 'dock', 'lower level']); assert.equal(T.chips('sprinklers on lo').find(c => c.label === 'lower level').text, 'sprinklers on "lower level"');
has(await run('sprinklers on "lower level"'), /Sprinklers on\./);
assert.ok(T.commands().includes('sprinklers') && T.commands().includes('lift'));
sys = { list: () => { throw new Error('boom'); }, run: () => { throw new Error('boom'); } }; has(await run('systems'), /link down/);

// Tab, and the row to tap
assert.equal(T.complete('ca').text, 'ca'); assert.deepEqual(T.complete('ca').options, ['cat', 'cams']); assert.equal(T.complete('hel').text, 'help ');
assert.equal(T.complete('cat han').text, 'cat handover.txt '); assert.equal(T.complete('cd ma').text, 'cd mail/'); assert.equal(T.complete('cat mail/01').text, 'cat mail/01_lights_over_lake.eml ');
assert.equal(T.complete('cd /inc').text, 'cd /incidents/'); assert.ok(T.complete('cat /incidents/0').options.length >= 4); assert.equal(T.complete('cat /incidents/0').text, 'cat /incidents/0');
const lab = t => T.chips(t).map(c => c.label);
assert.deepEqual(lab('').slice(0, 5), ['ls', 'cd', 'cat', 'open', 'help']);
assert.deepEqual(lab('cd '), ['enter', '..', '/', 'mail/', 'rub out']);
assert.ok(lab('cat ').includes('handover.txt') && lab('cat ').includes('mail/')); assert.ok(lab('cat mail/').includes('02_heating_bill.eml'));
const tap = async label => { const c = T.chips(T.line || '').find(q => q.label === label); assert.ok(c, 'no chip ' + label + ' in ' + lab(T.line || '')); T.line = c.text; if (c.run) { const o = await run(T.line); T.line = ''; return o; } return null; };
// a whole session by taps: to the incident log, into the editor, and down to the locked folder
T.line = ''; await run('cd ~'); await tap('cd'); await tap('/'); assert.equal(T.cwd, '/'); await tap('cd'); await tap('incidents/'); assert.equal(T.cwd, '/incidents');
await tap('cat'); has(await tap('0340_lift.txt'), /ITEM 12/); log.length = 0; await tap('open'); await tap('incident_log.txt'); assert.ok(log.includes('edit /incidents/incident_log.txt'));
await tap('cd'); await tap('..'); await tap('cd'); await tap('sublevel9/'); assert.equal(T.cwd, LOCKED); await tap('cat'); has(await tap('if_asked.txt'), /sorry, the museum is closed/);
console.log('terminal: all good');
