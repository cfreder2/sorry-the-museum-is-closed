// What players actually did: how many, for how long, how they got in, which rooms they reached,
// what they stopped to look at, and which of the side games they found.
//
//   node tools/telemetry.mjs                 everything, people only
//   node tools/telemetry.mjs --days 7        only the last week
//   node tools/telemetry.mjs --synthetic     the test rows instead (headless, the test handle, ?mode and friends)
//
// The rows live in the VECTRENCH Supabase project (supabase/001-telemetry.sql) and are closed to
// clients, so this needs that project's service-role key, the same one the other games' tools read:
//
//   export VECTRENCH_SUPABASE_KEY=...        (service_role, from the dashboard)
//
// or, on the Mac, the login-keychain entry vectrench already uses:
//
//   security add-generic-password -a vectrench -s vectrench-supabase-secret -w <key>
import { execSync } from 'node:child_process';

const URL_BASE = process.env.VECTRENCH_SUPABASE_URL || 'https://csicwkbfgmjtuharranh.supabase.co';
const args = process.argv.slice(2), days = Number(args[args.indexOf('--days') + 1]) || 0, synthetic = args.includes('--synthetic');

function key() {
  if (process.env.VECTRENCH_SUPABASE_KEY) return process.env.VECTRENCH_SUPABASE_KEY;
  try { return execSync('security find-generic-password -w -s vectrench-supabase-secret -a vectrench', { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' }).trim(); } catch { return ''; }
}
const KEY = key();
if (!KEY) { console.error('no service key: export VECTRENCH_SUPABASE_KEY, or park it in the keychain (see the header)'); process.exit(2); }

async function table(name, col) {
  const since = days > 0 ? `&${col}=gte.${new Date(Date.now() - days * 86400e3).toISOString()}` : '', out = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${URL_BASE}/rest/v1/${name}?select=*&order=${col}.desc${since}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Range: `${from}-${from + 999}` } });
    if (!r.ok) { console.error(`supabase said ${r.status}: ${await r.text()}`); process.exit(1); }
    const rows = await r.json(); out.push(...rows);
    if (rows.length < 1000) return out;
  }
}
const keep = r => (synthetic ? r.synthetic != null : r.synthetic == null);
const sessions = (await table('museum_sessions', 'started_at')).filter(keep), events = (await table('museum_events', 'created_at')).filter(keep);
const median = a => { const s = a.filter(v => v != null).sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
const tally = (rows, f) => { const m = new Map(); for (const r of rows) { const k = f(r); if (k != null) m.set(k, (m.get(k) || 0) + 1); } return [...m].sort((a, b) => b[1] - a[1]); };
const mins = s => (s == null ? '-' : s < 90 ? `${Math.round(s)} s` : `${(s / 60).toFixed(1)} min`);
const line = (label, v) => console.log(`  ${label.padEnd(34)} ${v}`);

console.log(`\nSorry, the Museum is Closed: ${synthetic ? 'test rows' : 'players'}${days ? `, last ${days} days` : ''}\n`);
const players = new Set(sessions.map(s => s.user_id)), fresh = sessions.filter(s => !s.resumed);
line('players', players.size); line('sessions', sessions.length);
line('time playing, median session', mins(median(sessions.map(s => s.play_secs))));
line('on a phone', `${sessions.filter(s => s.device === 'phone').length} of ${sessions.length}`);
line('by host', tally(sessions, s => s.host).map(([k, n]) => `${k} ${n}`).join(', ') || '-');
line('frame rate, median', median(sessions.map(s => s.stats && s.stats.fps)) ?? '-');
console.log('\nGetting in (new games only)');
line('got in', `${fresh.filter(s => s.got_in).length} of ${fresh.length}`);
for (const [how, n] of tally(fresh.filter(s => s.got_in), s => s.got_in)) line(`  by the ${how}`, `${n}, median ${mins(median(fresh.filter(s => s.got_in === how).map(s => s.got_in_secs)))}`);
console.log('\nHow far');
line('rooms entered, median session', median(sessions.map(s => s.rooms)) ?? '-');
line('works first seen, median session', median(sessions.map(s => s.works_new)) ?? '-');
line('most works seen on one device', Math.max(0, ...sessions.map(s => s.works_seen)));
console.log('\nRooms reached by most players');
const byRoom = new Map(); for (const e of events) if (e.kind === 'room') (byRoom.get(e.ref) || byRoom.set(e.ref, new Set()).get(e.ref)).add(e.user_id);
for (const [room, set] of [...byRoom].sort((a, b) => b[1].size - a[1].size).slice(0, 12)) line(`  ${room}`, set.size);
console.log('\nWorks looked at closely');
const looks = events.filter(e => e.kind === 'look');
for (const [ref, n] of tally(looks, e => e.ref).slice(0, 12)) line(`  ${((looks.find(e => e.ref === ref).data || {}).t || ref).slice(0, 32)}`, n);
console.log('\nThe rest');
line('got onto a roof', `${new Set(events.filter(e => e.kind === 'roof').map(e => e.user_id)).size} players (${tally(events.filter(e => e.kind === 'roof'), e => e.ref).map(([k, n]) => `${k} ${n}`).join(', ') || '-'})`);
line('sat down at the card table', `${new Set(events.filter(e => e.kind === 'poker').map(e => e.user_id)).size} players, median ${median(events.filter(e => e.kind === 'poker').map(e => e.data && e.data.hands)) ?? '-'} hands`);
line('hockey goals', `${events.filter(e => e.kind === 'hockey').length} (in ${new Set(events.filter(e => e.kind === 'hockey').map(e => e.session_id)).size} sessions)`);
line('races finished', events.filter(e => e.kind === 'race').length);
line('snowmen busted, total', sessions.reduce((a, s) => a + ((s.stats && s.stats.snowmen) || 0), 0));
line('where sessions ended', tally(sessions, s => s.stats && s.stats.at).slice(0, 6).map(([k, n]) => `${k} ${n}`).join(', ') || '-');
console.log('');
