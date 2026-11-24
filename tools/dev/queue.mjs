#!/usr/bin/env node
// The queue of paintings still to be given a life, one helper each.
//   node tools/dev/queue.mjs status
//   node tools/dev/queue.mjs next <n>        picks the next n (highlights first, then spread over the rooms; never two in
//                                            flight in one room), marks them assigned, and prints one JSON line each:
//                                            { id, port, title, prompt }
//   node tools/dev/queue.mjs release <id>    hand one back (a helper that never finished)
//   node tools/dev/queue.mjs skip <id> <why> leave one without a show, with the reason
// A work is done when src/life/<id>-*.js exists. tools/dev/paintings.json is every hung public-domain painting
// (tools/dev/hung.mjs makes the list from the running game); tools/dev/queue-state.json is what is in flight or skipped.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '../..');
const all = JSON.parse(fs.readFileSync(path.join(here, 'paintings.json'), 'utf8'));
const statePath = path.join(here, 'queue-state.json');
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { assigned: {}, skipped: {}, port: 8920 };
const save = () => fs.writeFileSync(statePath, JSON.stringify(state, null, 1));
const lives = fs.readdirSync(path.join(root, 'src/life')).filter(f => /^\d+-.*\.js$/.test(f));
const fileOf = new Map(lives.map(f => [Number(f.split('-')[0]), f]));
const done = w => fileOf.has(w.id) || w.id === 27992;      // (27992: Seurat's Grande Jatte, the first, in src/l2-grandejatte.js)
for (const id of Object.keys(state.assigned)) if (fileOf.has(Number(id))) delete state.assigned[id];
const todo = all.filter(w => !done(w) && !state.skipped[w.id]);
const [cmd, a1, ...rest] = process.argv.slice(2);
if (cmd === 'release') { delete state.assigned[a1]; save(); console.log('released', a1); }
else if (cmd === 'skip') { state.skipped[a1] = rest.join(' ') || 'skipped'; delete state.assigned[a1]; save(); console.log('skipped', a1); }
else if (cmd === 'next') {
  const busy = new Set(Object.values(state.assigned).map(v => v.room)), out = [];
  const free = todo.filter(w => !state.assigned[w.id]);
  const perRoom = new Map(); for (const w of free) perRoom.set(w.room, (perRoom.get(w.room) || 0) + 1);
  // Works that need the most care come last (sacred subjects, violence and death, the nude), when the brief has the most
  // behind it: many of them will be light-only shows, or none. Then highlights first; then the rooms with most left, so
  // the big galleries fill steadily; a stable order within that.
  const GRAVE = /\b(Christ|Jesus|Virgin|Madonna|Saint|St\.|Holy|Crucifi|Lamentation|Entombment|Piet[aà]|Martyr|Flagellation|Mocked|Passion|Resurrection|Annunciation|Adoration|Nativity|Baptism|Assumption|Trinity|Apostle|Disciple|Tomb|Sepulch|Deposition|Descent|Calvary|Golgotha|Gethsemane|Agony|Supper|Epiphany|Magi|Pentecost|Ascension|Transfiguration|Coronation|Immaculate|Rosary|Penitent|Hermit|Ecstasy|Stigmat|Relic|Funeral|Burial|Grave|Mourning|Lament|Suicide|Murder|Kill|Slain|Slaying|Victim|Hunt|Angel|Magdalen|Salome|Judith|Head of|Beheading|Massacre|Death|Dead|Dying|Corpse|Skull|Execution|Battle|Combat|Rape|Abduction|Slave|Nude|Bather|Venus|Susanna|Lucretia|Bathsheba|Diana|Nymph|Triptych|Altarpiece|Vision|Miracle|Temptation|Last Judgment|Ecce Homo|Man of Sorrows|God|Cupid|Chastis|Beat|Punish|Wound|Blood|Prophet|Moses|Abraham|David|Samson|Job|Lot|Tehamana|Tahiti|Tahitian|metua|atua|Maori|Marquesas|Shoots?|Shooting|Gun|Maragato|Friar|Wrests|Clubs|Binds|Bandit|Robbers?|Duel|War|Soldiers?|Wounded|Prisoners?|Beggars?|Drunk\w*|Mad\w*|Asylum|Hospital|Sick|Dying)\b/i;      // (the last few: Gauguin in Polynesia, a child sitter and another people's sacred things; held for the owner and a community reader)
  const grave = w => (GRAVE.test(w.t || '') ? 1 : 0);
  free.sort((p, q) => (grave(p) - grave(q)) || (q.b - p.b) || (perRoom.get(q.room) - perRoom.get(p.room)) || (p.room < q.room ? -1 : p.room > q.room ? 1 : q.w * q.h - p.w * p.h));
  for (const w of free) {
    if (out.length >= Number(a1 || 1)) break; if (busy.has(w.room)) continue; busy.add(w.room);
    const port = state.port = state.port >= 8959 ? 8920 : state.port + 1;
    state.assigned[w.id] = { room: w.room, port, at: new Date().toISOString().slice(0, 16) };
    const near = all.filter(o => o.room === w.room && o.id !== w.id && done(o)).map(o => `${o.a}, ${o.t}${fileOf.has(o.id) ? ` (src/life/${fileOf.get(o.id)})` : ' (src/l2-grandejatte.js)'}`);
    const prompt = `Read your brief first and follow it exactly, including its Care rules: \`docs/PAINTING-HELPER-BRIEF.md\` in the repo you are in (a git worktree of "Sorry, the Museum is Closed"). Check your tree is current as the brief's first section says (\`git merge --ff-only main\` if \`tools/dev/queue.mjs\` is missing).

Your work: ${w.a}, ${w.t} (${w.d}), collection id ${w.id}. Medium: ${w.m || 'not given'}. Style or period: ${w.s || 'not given'}. Tonight it hangs in ${w.gallery} (room id \`${w.room}\`${w.floor ? ', floor ' + w.floor : ''}); the canvas is about ${w.w} m wide by ${w.h} m high and its bottom edge is about ${w.bottom} m above the floor. Your port: ${port}.

No starting word is given: **find it in the picture.** Look at the picture for a long time first, read what the museum says about it (its API entry and page), and choose one word that comes out of the work itself (what it is about, what moves or could move in it, its light), a word you could say in the room the work was made for. Say the word and why in your report. The idea must be from the work, not laid on it.

${near.length ? `Already alive in this room, so read their files and make yours a different idea that never collides with theirs: ${near.join('; ')}.` : 'Nothing else in this room is alive yet.'} Other helpers are making other works alive right now, in other rooms; merge main into your branch before your final render (\`git merge main\`) so you see any new neighbour.

The owner's standing instruction: **do not compromise on quality.** Thirty-one are done and each was reviewed and sent back until it was right; yours will be too. A quiet show (light, colour, one thing moving) made beautifully is better than a busy one, and for a sacred, grave or private subject it is the only right answer: make it excellent. If, after real thought, the Care rules mean this work should have no show at all, say so with your reasons instead of forcing one; that is an acceptable result.`;
    out.push({ id: w.id, port, title: `${w.a.split(' ').slice(-1)[0]} ${w.t}`.slice(0, 60), room: w.room, prompt });
  }
  save(); for (const o of out) console.log(JSON.stringify(o));
} else {
  const fl = Object.keys(state.assigned).length;
  console.log(`${all.length} paintings hung; ${all.filter(done).length} alive; ${todo.length} to do (${todo.filter(w => w.b).length} highlights); ${fl} in flight; ${Object.keys(state.skipped).length} skipped`);
  if (fl) console.log('in flight:', Object.entries(state.assigned).map(([id, v]) => `${id}@${v.room}:${v.port}`).join(' '));
}
