// The map's data, read off the running game. dump.mjs boots the game (?noopen&saved&nofps), then runs this in the page
// as the body of an async function, with srctext.js's functions in scope and two things handed in: SHUT (the ids of
// the rooms that are shut) and LIFE (life.json: a sentence for each living painting). It returns { data, warnings }.
//
// Where things are, and what they say, come from the game: the plan, the hang, G.spots(), each feature's own state,
// and the game's source for the words that are only ever said (srctext.js reads them out of it). What cannot be read
// (what a thing is for, in a sentence) is in the tables below, keyed by the game's own ids; a thing the game has that
// a table does not know is still listed, with a plain sentence, and a warning is printed.

const G = window.__ah, P = G.plan;
const PL = await import('/src/plan.js');
const F = (await import('/src/features.js')).features, fb = Object.fromEntries(F.map(f => [f.id, f]));
const warnings = [], notFound = [];
// Every room, with those that are shut and no longer built: the plan keeps their outlines (plan.shutRooms, from the build that has src/shut.js).
const GONE = (P.shutRooms || []).filter(r => !P.rooms.includes(r)), RL = [...P.rooms, ...GONE], BY = Object.assign({}, P.byId, Object.fromEntries(GONE.map(r => [r.id, r])));
const warn = m => { if (!warnings.includes(m)) warnings.push(m); };
const r1 = v => Math.round(v * 10) / 10;
const kit = (fb.mice && fb.mice.k) || (fb.lostfound && fb.lostfound.k) || null;

// ------------------------------------------------------------------ the source, for the words
const SRC = {};
async function listing(dir) { try { const h = await (await fetch(dir)).text(); return [...h.matchAll(/href="([^"?/]+\.js)"/g)].map(m => dir + m[1]); } catch { return []; } }
const files = [...await listing('/src/'), ...await listing('/src/life/'), ...await listing('/src/escape/')];
if (files.length < 50) warn('could not list /src/ (' + files.length + ' files): the words read from the source will be missing');
await Promise.all(files.map(async f => { try { SRC[f.replace('/src/', '')] = await (await fetch(f)).text(); } catch { warn('could not read ' + f); } }));
const BLOCK = {};                 // feature id (or a work's id) -> { file, pre, body, K }
for (const [file, src] of Object.entries(SRC)) { const K = consts(src); for (const q of sections(src)) BLOCK[q.id] = { file, K, pre: q.pre, body: q.body }; }
const clean = list => { const seen = new Set(), out = []; for (const t of list) { const s = tidy(String(t)).trim(); if (s && !seen.has(s)) { seen.add(s); out.push(s); } } return out; };
// The words a feature can say (or those of them that match), in the order they are written.
const fill = (list, map) => list.map(t => t.replace(/\$\{([^{}]*)\}/g, (m, e) => (e.trim() in map && map[e.trim()] != null ? map[e.trim()] : m)));
// (a count the feature itself holds is written in: "of ${this.list.length}" becomes "of 29")
const own = id => { const f = fb[id] || {}, n = v => (Array.isArray(v) ? v.length : null); return { 'this.list.length': n(f.list), 'this.items.length': n(f.items), 'this.rooms.length': n(f.rooms), 'this.tally.total': f.tally && f.tally.total, 'this.set.total': f.set && f.set.total }; };
const W = (id, re) => { const b = BLOCK[id]; if (!b) { warn('no source found for the feature "' + id + '": its words are missing'); return []; } const w = fill(clean(words(b.body, b.K)), own(id)); return re ? w.filter(t => re.test(t)) : w; };
const FW = (file, re) => { const s = SRC[file]; if (!s) { warn('no source file ' + file); return []; } const w = clean(words(s)); return re ? w.filter(t => re.test(t)) : w; };
const ONCE = key => { const w = clean(onceText(SRC['main.js'] || '', key)); if (!w.length) warn('main.js no longer has once(\'' + key + '\')'); return w; };
const LIT = (file, name) => { const v = SRC[file] ? literal(SRC[file], name) : undefined; if (v === undefined) warn('could not read ' + name + ' from ' + file); return v; };

// ------------------------------------------------------------------ levels
const NAMES = LIT('map.js', 'NAMES') || {};
const LV = Object.entries(P.levels).filter(([id]) => id !== 'X' && id !== 'B').map(([id, y]) => ({ id, y }));
const levelOfY = y => { let best = LV[0]; for (const l of LV) if (Math.abs(l.y - y) < Math.abs(best.y - y)) best = l; return best.id; };
const roomAt = (x, z, y) => { const r = PL.roomAt(P, x, z, y); return r || null; };
// The room a thing on (or just above) a floor is in: tried at its own height, a little above and a little below.
const roomNear = (x, z, y = 0) => { const r = roomAt(x, z, y + 0.3) || roomAt(x, z, y + 0.05) || roomAt(x, z, y - 0.4) || roomAt(x, z, y + 1.2); return r && y > r.top - 0.25 ? null : r; };      // (on a room's ceiling is on the roof: out of doors)
const inBox = (r, x, z, e = 0) => x >= r.x0 - e && x <= r.x1 + e && z >= r.z0 - e && z <= r.z1 + e;
// The level a thing in a room is on: the secret levels are one; in a tall room, the deck it stands on.
function levelOf(room, x, z, y) {
  if (!room) return '1';
  if (room.floor === 'X' || room.secret) return 'X';
  if (y == null) return room.floor;
  let fy = room.y;
  for (const d of P.decks) if (d.room === room.id && d.y > fy && d.y <= y + 0.25 && x >= d.x0 - 0.3 && x <= d.x1 + 0.3 && z >= d.z0 - 0.3 && z <= d.z1 + 0.3) fy = d.y;
  return Math.abs(fy - room.y) < 0.7 ? room.floor : levelOfY(fy);
}
const used = new Set(RL.map(r => (r.floor === 'X' || r.secret ? 'X' : r.floor)));
const levels = [...(used.has('X') ? [{ id: 'X', name: 'Secret levels', y: r1(P.secret ? P.secret.y : -12) }] : []), ...LV.filter(l => used.has(l.id)).sort((a, b) => a.y - b.y).map(l => ({ id: l.id, name: NAMES[l.id] || l.id, y: r1(l.y) }))];
for (const r of RL) if (!(r.floor === 'X' || r.secret) && !LV.some(l => l.id === r.floor)) warn('room ' + r.id + ' is on a floor the plan does not list: ' + r.floor);

// ------------------------------------------------------------------ rooms
// The banner, as main.js announce() and roomTitle() write it.
function banner(r) {
  const set = G.collection && G.collection.rooms && G.collection.rooms[r.id];
  if (r.kind === 'corridor') return ['Gallery 11', 'The Thorne Miniature Rooms'];
  if (r.kind === 'hall') return ['Griffin Court', 'the Modern Wing'];
  return [String(r.gallery || 'This room').replace(/^Galleries /, 'Gallery '), set && set.names && set.names.length ? set.names.join(' · ') : r.gallery === 'Gallery 200' ? 'the Grand Staircase' : ''];
}
const title = r => (r ? banner(r)[0] : 'outdoors');
// The wing: the survey's own parts (survey/back-of-house.json `zone`, survey/old-buildings.json `piece`), as the audit named them.
const zone = {}, piece = {};
try { for (const r of (await (await fetch('/survey/back-of-house.json')).json()).rooms) zone[r.id] = r.zone; } catch { warn('survey/back-of-house.json not read: wings are by position only'); }
try { for (const r of (await (await fetch('/survey/old-buildings.json')).json()).rooms) piece[r.id] = r.piece; } catch { warn('survey/old-buildings.json not read: wings are by position only'); }
const WING = { ferguson: 'Ferguson (staff block, north)', allerton: 'Old building (Michigan Ave)', morton: 'Old building (Michigan Ave)', main: 'Old building (Michigan Ave)', eastrow: 'Old building (Michigan Ave)', south: 'Old building (Michigan Ave)', bridge: 'Bridge over the railway', mck: 'McKinlock Court ring (east)', east: 'McKinlock Court ring (east)', columbus: 'Columbus Drive (auditorium, school)', rice: 'Rice Building' };
function wingOf(r) {
  if (r.secret || r.floor === 'X') return 'Under the building (secret)';
  if (r.building === 'modern') return 'Modern Wing';
  if (WING[zone[r.id]]) return WING[zone[r.id]];
  if (WING[piece[r.id]]) return WING[piece[r.id]];
  const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
  return cx < 108 ? WING.main : cx < 128 ? WING.bridge : cz > 140 ? WING.rice : WING.mck;
}
const shut = new Set([...(SHUT || []), ...RL.filter(r => r.shut).map(r => r.id)]);
{ const lost = [...shut].filter(id => !BY[id]); if (lost.length) warn(lost.length + ' room(s) on the shut list are not in the plan, built or as an outline, and are left out: ' + lost.slice(0, 8).join(', ') + (lost.length > 8 ? '…' : '')); }
if (GONE.length) warn(GONE.length + ' shut rooms are not built in this game: they are listed from their outlines, with nothing in them');
const life = fb.paintlife, alive = a => !!(life && life.byArt && life.byArt.has(a));
const artist = w => String(w.a || '').split('(')[0].split('\n')[0].trim();
const workName = w => [artist(w), String(w.t || '').trim()].filter(Boolean).join(', ');
const artsOf = {};
for (const a of G.museum.arts) (artsOf[a.room] = artsOf[a.room] || []).push(a);
const rooms = RL.map(r => {
  const [name, sub] = banner(r), arts = (artsOf[r.id] || []).slice().sort((a, b) => a.i - b.i);
  return { id: r.id, name, sub, level: r.floor === 'X' || r.secret ? 'X' : r.floor, wing: wingOf(r), kind: r.kind || '', use: r.use || '', x0: r1(r.x0), x1: r1(r.x1), z0: r1(r.z0), z1: r1(r.z1), y: r1(r.y), shut: shut.has(r.id), secret: !!r.secret,
    works: arts.length, living: arts.filter(alive).length, worksList: arts.map(a => workName(a.work) + (alive(a) ? ' (comes alive)' : '')), needed: '' };
});
const roomOut = Object.fromEntries(rooms.map(r => [r.id, r]));

// ------------------------------------------------------------------ doors
const doors = P.doors.map(d => {
  const a = BY[d.a], b = d.b === 'out' ? null : BY[d.b], y = d.y != null ? d.y : a ? a.y : 0;
  const level = (a && (a.secret || a.floor === 'X')) || (b && (b.secret || b.floor === 'X')) ? 'X' : a && Math.abs(a.y - y) < 0.7 ? a.floor : b && Math.abs(b.y - y) < 0.7 ? b.floor : levelOfY(y);
  return { id: d.id, a: d.a, b: b ? d.b : null, level, x0: r1(d.x0), x1: r1(d.x1), z0: r1(d.z0), z1: r1(d.z1), out: !b, vent: !!d.vent, hidden: !!d.hidden, shut: !!d.shut || shut.has(d.a) || (!!b && shut.has(d.b)) };
});

// ------------------------------------------------------------------ items
const items = [], ids = new Set();
// One thing on the map. `room` may be a room, an id, or undefined (found from the place); `y` is its floor.
function add(o) {
  let room = o.room === null ? null : typeof o.room === 'string' ? BY[o.room] : o.room || roomNear(o.x, o.z, o.y);
  if (typeof o.room === 'string' && !room) { warn('item ' + o.id + ' names a room the plan does not have: ' + o.room); room = null; }
  let x = o.x, z = o.z;
  if (room && !inBox(room, x, z)) {
    // a thing on or in a wall of its room (a grille, a door in the wall) is put on the room's edge
    const far = Math.max(room.x0 - x, x - room.x1, room.z0 - z, z - room.z1);
    if (far > (o.reach || 0.8)) warn('item ' + o.id + ' is ' + far.toFixed(1) + ' m outside its room ' + room.id + ': moved to the edge');
    x = Math.min(room.x1, Math.max(room.x0, x)); z = Math.min(room.z1, Math.max(room.z0, z));
  }
  let id = String(o.id), n = 1; while (ids.has(id)) id = o.id + '~' + (++n);
  if (n > 1) warn('two items wanted the id ' + o.id);
  ids.add(id);
  const R = room ? roomOut[room.id] : null;
  let rx = r1(x), rz = r1(z); if (R) { rx = Math.min(R.x1, Math.max(R.x0, rx)); rz = Math.min(R.z1, Math.max(R.z0, rz)); }
  const it = { id, kind: o.kind, name: o.name, room: room ? room.id : null, level: o.level || levelOf(room, x, z, o.y), x: rx, z: rz, what: o.what || '', text: clean(o.text || []) };
  items.push(it); return it;
}
// Things of one kind in a room, numbered in the order of where they are (so the same thing has the same id every run).
const order = list => list.slice().sort((p, q) => p.x - q.x || p.z - q.z || (p.y || 0) - (q.y || 0));
function numbered(kind, list, make) {
  const by = {};
  for (const q of list) { const r = q.room !== undefined ? q.room : roomNear(q.x, q.z, q.fy != null ? q.fy : q.y); const key = r ? (r.id || r) : 'out'; (by[key] = by[key] || []).push({ ...q, _room: r ? (typeof r === 'string' ? BY[r] : r) : null }); }
  for (const key of Object.keys(by).sort()) order(by[key]).forEach((q, i) => make(q, `${kind}-${key}-${i + 1}`, q._room));
}
const spots = G.spots();
const spot = id => spots.find(s => s.id === id);
const done = new Set();      // spots already turned into an item (or covered by one)

// ---- whiteboards
{
  const BT = await import('/src/boardtext.js');
  for (const b of G.boards.list) {
    const clue = b.id === 'clue';
    add({ id: 'whiteboard-' + b.id, kind: 'whiteboard', name: clue ? 'The Director’s whiteboard (the clue board)' : b.title, room: typeof b.room === 'string' ? b.room : b.room && b.room.id, x: b.x, z: b.z, y: b.y - 1.7,
      what: clue ? 'Pull up and READ: it names the picture with the passage behind it, and the part of it to touch. It counts as a whiteboard read, like the rest.' : 'Pull up in front of it and READ: the camera stands square to the board and its words come up as text. The first one read is a secret; five is the trophy Read the Room.',
      text: BT.plainText(b.lines).split('\n') });
  }
  for (const s of spots) if (s.id === 'board' || s.id === 'boards') done.add(s);
}

// ---- the guard's notes
{
  const f = fb.notes, said = W('notes');
  for (const n of (f && f.list) || []) add({ id: n.id, kind: 'guard-note', name: 'Guard’s note' + (n.about ? ' (about ' + title(BY[n.about]) + ')' : ''), room: n.room, x: n.x, z: n.z, y: n.y - 0.36,
    what: 'A yellow sticky note low on the wall: stop beside it and it is read out. ' + (n.about ? 'A hint about ' + title(BY[n.about]) + '.' : 'One of the guard’s jokes.') + ' Ten read is the secret The guard’s notes.', text: [...n.text.split('\n'), '— G.'] });
  if (!f || !(f.list || []).length) notFound.push('guard-note: the notes feature has no list');
  for (const s of spots) if (/^note\d+$/.test(s.id)) done.add(s);
  void said;
}

// ---- lost property, the Lost & Found box and the coat check
{
  const f = fb.lostfound, b = BLOCK.lostfound, w = W('lostfound');
  const thanks = b ? (/thanks = (\[[^\]]*\])/.exec(b.body) || [])[1] : null; let thank = []; try { thank = thanks ? new Function('return ' + thanks)() : []; } catch { thank = []; }
  if (!thank.length) warn('lostfound.js: the thanks said on handing in were not found');
  const pick = w.filter(t => /^Picked up/.test(t)), back = w.filter(t => /RETURNED|Every .* is back|Every lost thing|hand in/.test(t));
  for (const it of (f && f.items) || []) add({ id: it.id, kind: 'lost-property', name: it.kind.name, room: it.room, x: it.x, z: it.z, y: it.y,
    what: `Drive into it and it rides on the toy (three at a time); hand it in at the coat check in the lobby or the Lost & Found box in the staff canteen for ${it.pay} chips.`,
    text: [...fill(pick, { 'it.kind.name': it.kind.name, 'it.pay': it.pay }), ...thank, ...back] });
  if (f && f.box) add({ id: 'lostfound-box', kind: 'other', name: 'Lost & Found box', room: f.box.room, x: f.box.x, z: f.box.z, y: f.box.y, what: 'With lost property on the toy, pull up and HAND IN: each thing pays 40 to 150 chips by how far it was from the lobby, with a bonus for every one of a kind and for all thirty.', text: ['LOST', 'PROPERTY', 'hand it in here', ...w.filter(t => /Lost & Found/.test(t)), ...thank] });
  if (P.coatCheck) add({ id: 'coat-check', kind: 'coat-check', name: 'Coat check (Lost & Found)', room: P.coatCheck.room, x: P.coatCheck.x, z: P.coatCheck.z, y: P.coatCheck.y, what: 'The lobby’s Lost & Found: hand in lost property here for chips. The gap behind the counter, under the coats, is where a toy hides from the lobby’s robot.', text: [...w.filter(t => /Lost & Found|RETURNED|Every lost thing/.test(t)), ...thank, ...W('guards', /coat check/)] });
  for (const s of spots) if (/^lost\d+$/.test(s.id) || s.id === 'lostfound' || s.id === 'coatcheck') done.add(s);
}

// ---- mice and their nests
const paths = [], areas = [];
const pathRooms = (pts, y) => { const seq = []; for (const [x, z] of pts) { const r = roomNear(x, z, y); if (r && seq[seq.length - 1] !== r.id) seq.push(r.id); } return seq; };
{
  const MN = { north: 'North mouse', south: 'South mouse', rice: 'Rice mouse', modern: 'Modern Wing mouse', lower: 'Lower-level mouse' };
  const said = W('mice'), nests = Object.fromEntries((P.nests || []).map(n => [n.wing, n]));
  for (const m of (fb.mice && fb.mice.list) || []) {
    const id = m.wing.id, pts = m.pts.map(p => [p.x, p.z]), seq = pathRooms(pts, m.y), n = nests[id], nr = n && BY[n.room];
    if (!MN[id]) warn('a mouse the table does not know: ' + id);
    add({ id: 'mouse-' + id, kind: 'mouse', name: MN[id] || 'Mouse (' + m.wing.name + ')', x: pts[0][0], z: pts[0][1], y: m.y,
      what: `Sits here in the open (${m.wing.name}). Come near and it runs home, ${Math.round(m.len)} m, through ${seq.map(q => title(BY[q])).join(', ')}, stopping to look back; see it in at its grille${nr ? ' in ' + title(nr) : ''} and that grille can be opened.`, text: said });
    paths.push({ id: 'mouse-run-' + id, kind: 'mouse-run', name: (MN[id] || id) + '’s run home', level: levelOf(roomNear(pts[0][0], pts[0][1], m.y), pts[0][0], pts[0][1], m.y), pts: pts.map(([x, z]) => [r1(x), r1(z)]) });
  }
  const live = Object.fromEntries(((fb.nests && fb.nests.list) || []).map(v => [v.n.wing, v])), said2 = W('nests', /nest|vent|Squeeze|Stuck|mice have kept/i).filter(t => !/DESK/.test(t));
  for (const n of P.nests || []) {
    const c = live[n.wing] && live[n.wing].clue;
    if (!c) warn('nest ' + n.id + ' has no clue at run time');
    add({ id: n.id, kind: 'nest', name: 'Mouse grille and nest: ' + n.name, room: n.room, x: n.vent.x, z: n.vent.z, y: n.y,
      what: `A little grille low on the wall: once its mouse has been seen home, E swings it open; squeeze in to the nest and read what the mice have kept (${c ? c.kind === 'key' ? 'the key to the Director’s desk' : c.kind === 'photo' ? 'a photograph' : 'a chewed page of the file' : '?'}).`,
      text: c ? [c.title, ...c.lines, c.say, ...said2] : said2 });
  }
  for (const s of spots) if (s.id === 'mice' || s.id === 'mouse-vent' || s.id === 'nests') done.add(s);
}

// ---- the Director's desk, and the other one
{
  const DESK = LIT('nests.js', 'DESK'), D = fb.nests && fb.nests._desk ? fb.nests._desk() : null, said = W('nests', /desk(?! key)|keyhole|folder/i);
  for (const r of P.rooms.filter(q => q.desk)) {
    const d = r.desk, mine = D && D.room === r;
    add({ id: 'desk-' + r.id, kind: 'desk', name: mine ? 'The Director’s desk' : 'The desk in ' + title(r), room: r, x: mine ? D.at.x : (d.x0 + d.x1) / 2, z: mine ? D.at.z : (d.z0 + d.z1) / 2, y: r.y,
      what: mine ? 'Locked until you have the key from the lower-level mouse’s nest; then OPEN, and READ the folder in the drawer, which sends you to the whiteboard in this room.' : 'A second Director’s desk, with the decoy whiteboard. Nothing answers here: the drawer that opens is in the office with the clue board.',
      text: mine ? [...(DESK ? [DESK.title, ...DESK.lines, 'DO NOT REMOVE FROM SUB-LEVEL 9', DESK.say] : []), ...said] : [] });
  }
  if (!D) notFound.push('desk: the Director’s desk was not found by src/nests.js');
  for (const s of spots) if (s.id === 'deskkey') done.add(s);
}

// ---- the pages of the Green Cheese file
{
  const ST = await import('/src/story.js'), E = Object.fromEntries(ST.ENTRIES.map(e => [e.id, e]));
  const page = (id, at, where, n) => { const e = E[id]; if (!e) { warn('story.js has no page ' + id); return; } if (!at) { notFound.push('story-page "' + e.title + '": ' + where); return; } add({ id: 'story-' + id + (n ? '-' + n : ''), kind: 'story-page', name: e.title, room: at.room, x: at.x, z: at.z, y: at.y, level: at.level, what: where, text: [e.hint, typeof e.line === 'function' ? e.line(5).replace('5 of 5', 'n of 5') : e.line] }); };
  const hut = fb.probe && fb.probe.hut, sv = spot('story-rings'), pn = fb.welcome && fb.welcome.noteAt, zib = spot('race:crop'), gc = spot('greencheese'), va = spot('vault');
  page('lighthouse', hut && hut.log ? { x: hut.log.x, z: hut.log.z, room: null } : null, 'Found by reading Clarice’s log on the step of the keeper’s hut at the harbour light, after herding the little saucer out of the building.');
  page('lights', sv ? { x: sv.x, z: sv.z, room: null } : null, 'Found by seeing a green light fall over the lake from anywhere out of doors; it is marked here where the light comes down, over the silo on Butler Field.');
  page('party', pn ? { x: pn.x, z: pn.z, room: null } : null, 'Found by reading the Director’s note propped against the cake at the welcome party, on the roof of the Modern Wing’s west pavilion.');
  page('ring', sv ? { x: sv.x, z: sv.z, room: null } : null, 'Found by driving onto the rings melted into the snow on Butler Field, over the silo.');
  const tux = Object.values(BLOCK).length && SRC['tuxportal.js'] ? null : null; void tux;
  notFound.push('story-page "The groundskeeper’s note" (portal): it is pinned up in the Tuxedo Shop at the top of the sled hill, out of doors (src/tuxportal.js, built by src/sledhill.js only when the toy first comes near), so the game had no place for it to read; not on the map');
  (P.secDesks || []).forEach((d, i) => page('nightlog', { x: d.x, z: d.z, y: d.y, room: d.room }, 'Found on the security desk’s computer: the folder /sublevel9 wants CLEARANCE 9 (the password is in two halves, one on a sticky note on each control room’s monitor), and the whole paper in it is this page.', i + 1));
  for (const n of P.nests || []) page('nests', { x: n.vent.x, z: n.vent.z, y: n.y, room: n.room }, 'Found by reading what is in any one of the five mouse nests; the page counts the nests read.', n.wing);
  const D = fb.nests && fb.nests.desk; if (D) page('desk', { x: D.at.x, z: D.at.z, y: D.at.y, room: D.room }, 'Found by opening the Director’s desk with the mice’s key.');
  const sd = G.secret && G.secret.door; if (sd) page('passage', { x: (sd.x0 + sd.x1) / 2, z: (sd.z0 + sd.z1) / 2, y: sd.y, room: P.secret && P.secret.room }, 'Found when the piece of wall slides aside: touch the part of the picture the Director’s whiteboard names.');
  page('sublevel9', va ? { x: va.x, z: va.z, y: va.y } : null, 'Found on first coming down the stair into Sub-level 9.');
  page('alienracer', zib ? { x: zib.x, z: zib.z, room: null } : null, 'Found by beating Zib, the racer that is not from round here, at the crop circle on Butler Field: it leaves its charm.');
  const chk = BY['B-check'];
  page('base', chk ? { x: (chk.x0 + chk.x1) / 2, z: (chk.z0 + chk.z1) / 2, y: chk.y, room: chk } : gc ? { x: gc.x, z: gc.z, y: gc.y } : null, 'Found on first getting into the base under Butler Field, past the tunnel: any of its rooms does it, and the checkpoint, marked here, is the first you come to.');
}

// ---- the works that come alive, and the four that get out
let LIFE_WHAT = {};
{
  // one sentence each, from the header of its file in src/life/ (keyed by the museum's id of the work)
  LIFE_WHAT = LIFE || {};
  const esc = Object.fromEntries(((fb.escapes && fb.escapes.list0) || []).map(E => [E.id, E]));
  const live = G.museum.arts.filter(alive);
  for (const a of live.slice().sort((p, q) => p.work.id - q.work.id)) {
    const L = life.byArt.get(a), b = BLOCK[String(a.work.id)], said = b ? clean(words(b.body, b.K)) : [];
    if (!LIFE_WHAT[a.work.id]) warn('a living work the table does not know: ' + a.work.id + ' ' + a.work.t);
    add({ id: 'living-' + a.work.id, kind: 'painting-living', name: workName(a.work), room: a.room, x: a.x, z: a.z, y: a.fy,
      what: (LIFE_WHAT[a.work.id] || 'Look at it and it comes alive' + (L && L.word ? ' (the word: ' + L.word + ')' : '') + '.') + (esc[a.work.id] ? ' One of the four that get out.' : ''), text: said });
  }
  for (const idw of Object.keys(LIFE_WHAT)) if (!live.some(a => String(a.work.id) === String(idw))) warn('the table has a living work that is not hung: ' + idw);
  for (const s of spots) if (s.id === 'rain' || s.id === 'croquet') done.add(s);      // secrets of two living works: the work's own item has their words
  // the escapees: what each does while it is out (from the head of its file in src/escape/), by the museum's id of its work
  const ESC = {
    25865: 'the net’s red keg float slides over the gallery floors on a patch of its own grey-green sea, nose first, its corks strung out behind it, and leaves the floor wet where it has been',
    14572: 'the five hats flutter from room to room on their bows at the height of a bench, ribbons streaming, and come down to roost in a row on a gallery bench',
    111559: 'three lambs skip off, graze, look up and skip on; the boy rides out on his ram a few seconds after them and works them back towards their own room',
    14620: 'a gust takes the orange parasol from room to room, turning as it flies, petals and blades of grass going round under it; when the gust drops it comes down like a dandelion seed',
  };
  const ES = fb.escapes;
  for (const E of (ES && ES.list0) || []) {
    const a = E.art, sp = E.spec; let allow = []; if (!ESC[E.id]) warn('an escapee the table does not know: ' + E.id + ' ' + sp.name);
    try { const c = Object.assign({}, E, { grid: null, room: a.room, y: BY[a.room].y }); ES._grid(c); allow = c.allow || []; } catch (e) { warn('escapes: could not work out where ' + sp.name + ' may go: ' + e); }
    add({ id: 'escape-' + (sp.tag || E.id).toLowerCase().replace(/\W+/g, '-'), kind: 'painting-escape', name: workName(a.work) + ': ' + sp.name, room: a.room, x: a.x, z: a.z, y: a.fy,
      what: `Watch its show for a few seconds and drive off, and ${sp.name} ${sp.count > 1 ? 'get' : 'gets'} out: ${ESC[E.id] || (sp.count > 1 ? 'they wander' : 'it wanders')}, in this room and the rooms a door off it, never more than ${(/reach:\s*(\d+)/.exec(SRC['escapes.js'] || '') || [0, 18])[1]} m from the picture. Come up to ${sp.count > 1 ? 'them' : 'it'} and ${sp.count > 1 ? 'they go' : 'it goes'} home to this wall (${sp.chips} chips); a robot’s lamp held on ${sp.count > 1 ? 'them' : 'it'} sends ${sp.count > 1 ? 'them' : 'it'} home for nothing.`,
      text: [sp.line, sp.back || (sp.name[0].toUpperCase() + sp.name.slice(1) + ' is back in its painting.')] });
    areas.push({ id: 'escape-' + (sp.tag || E.id).toLowerCase().replace(/\W+/g, '-'), kind: 'escape', name: 'Where ' + sp.name + ' may wander', rooms: allow });
  }
  if (!ES || !(ES.list0 || []).length) notFound.push('painting-escape: src/escapes.js has no list');
}

// ---- the picture with the passage behind it
{
  const S = G.secret, c = S && S.clue, sd = S && S.door, said = FW('secret.js', /MOVING|Stone on stone|way through/);
  if (c && c.art) add({ id: 'secret-painting', kind: 'painting-secret', name: workName(c.work), room: c.art.room, x: c.art.x, z: c.art.z, y: c.art.fy,
    what: `The picture the Director’s whiteboard names. Look closer at it and touch ${c.part}: a piece of the wall of this room slides aside, and behind it a passage leads to a stair down to Sub-level 9.`, text: [...(S.clueLines ? (await import('/src/boardtext.js')).plainText(S.clueLines()).split('\n') : []), ...said] });
  else notFound.push('painting-secret: src/secret.js has no clue tonight (the passage is left out)');
  if (sd) add({ id: 'way-hidden-door', kind: 'way-in', name: 'The hidden door (the passage behind the painting)', room: P.secret.room, x: (sd.x0 + sd.x1) / 2, z: (sd.z0 + sd.z1) / 2, y: sd.y, what: 'A piece of wall that slides aside when the right part of the picture is touched; behind it the passage, and the stair down past every floor to Sub-level 9. Shut again by a new game.', text: said });
  for (const s of spots) if (s.id === 'hidden-door') done.add(s);
}

// ---- pianos, vending machines, film screens, the monitors with games on, the heist buttons, the security rooms
{
  const pw = [...ONCE('piano')];
  for (const p of (G.piano && G.piano.list) || []) add({ id: p.id.replace(/[^\w-]+/g, '-'), kind: 'piano', name: /upright/.test(p.id) ? 'Upright piano' : /G246/.test(p.id) ? 'Upright piano (the music room)' : 'Grand piano', x: p.O.x, z: p.O.z, y: p.O.y - 0.6, room: roomAt(p.O.x, p.O.z, p.O.y - 0.5) || roomNear(p.O.x, p.O.z, p.O.y - 0.7),
    what: 'Pull up and PLAY: the camera stands over the keys, and fingers or the keyboard’s letter row play them. ' + (/upright/.test(p.id) ? 'The opening of Für Elise here is the duet with Renoir.' : /G246/.test(p.id) ? 'A chord here is the secret The music room.' : 'Each grand played is a secret.'), text: /upright/.test(p.id) ? W('l2-duet201') : /G246/.test(p.id) ? W('hammershoi246') : pw });
  for (const s of spots) if (/^piano:/.test(s.id)) done.add(s);
  const vw = ONCE('vend'), fizz = FW('vending.js', /FIZZ/);
  numbered('vending', (G.vending && G.vending.list) || [], (m, id, room) => add({ id, kind: 'vending', name: 'Vending machine' + (m.pop ? ' (this one also sells pop)' : ''), room, x: m.x, z: m.z, y: m.y, what: 'VEND: six colours of spray paint, a different six in each machine, 25 chips a can; a can bought is a colour kept for good.' + (m.pop ? ' This one also sells cans of pop.' : ''), text: m.pop ? [...vw, ...fizz] : vw }));
  for (const s of spots) if (s.id === 'vending') done.add(s);
  numbered('coin', P.marks.filter(m => m.kind === 'coin'), (m, id, room) => add({ id, kind: 'other', name: 'Loose change', room, x: m.x, z: m.z, y: m.y, what: 'A coin somebody dropped under a table: drive over it for 5 chips.', text: FW('vending.js', /\+5 CHIPS/) }));
  const cw = ONCE('film');
  for (const c of (G.cinema && G.cinema.screens) || []) add({ id: 'film-' + c.room.id, kind: 'film-screen', name: 'Film screen', room: c.room, x: c.x, z: c.z, y: c.room.y, what: 'The projector has been left running: go in and the film starts (the game’s own films and a few public-domain clips), leave and it stops. WATCH sits you down. Any screen is the secret The late showing.', text: cw });
  for (const s of spots) if (s.id === 'cinema') done.add(s);
  for (const a of (G.arcade && G.arcade.list) || []) add({ id: 'arcade-' + a.id, kind: 'arcade', name: 'Monitor: ' + (a.Game && a.Game.title || a.id), x: a.x, z: a.z, y: a.y, room: a.room && BY[a.room] ? a.room : undefined, what: `An old monitor left switched on with a game on it (${a.Game && a.Game.title || a.id}): pull up in front and PLAY. Each one found is a secret; all of them is the trophy Screen Time.` + (a.bonus ? ' This one is the extra, a long way down.' : ''), text: [] });
  for (const s of spots) if (/^arcade:/.test(s.id) || s.id === 'outpost') done.add(s);
  const hw = [...ONCE('heist'), ...FW('heist.js')];
  (P.heistConsoles || []).forEach((c, i) => add({ id: 'heist-' + c.room, kind: 'heist-console', name: 'Big red button (IN CASE OF HEIST)', room: c.room, x: c.x, z: c.z, y: c.y, what: 'Press it and the building picks a gallery and a picture in it and fills the room with laser beams: get the toy-sized copy off its plinth and back to this button before the clock runs out. One touch of a beam and the cage drops, and you wake in the dumpster.', text: hw }));
  for (const s of spots) if (s.id === 'heist') done.add(s);
  // the security desks: the computer, its terminal, and the wall of monitors
  const SF = await import('/src/secfiles.js'), FEEDS = LIT('secroom.js', 'FEEDS') || [], dw = W('secdesk');
  const env = n => ({ desk: n, clock: '02:10', bots: [], cam17: 'Bridge galleries, west', best: 0, clearance: false });
  const fileTitles = n => Object.entries(SF.FILES || {}).map(([path, f]) => { let t = ''; try { t = String(typeof f.text === 'function' ? f.text(env(n)) : f.text || '').split('\n')[0].trim(); } catch { t = ''; } return path + (t ? ': ' + t : ''); });
  (P.secDesks || []).forEach((d, i) => {
    const n = i + 1, half = (SF.HALVES || [])[i];
    add({ id: 'secdesk-' + d.room, kind: 'security-desk', name: 'Security desk ' + n + ' (the night shift’s computer)', room: d.room, x: d.x, z: d.z, y: d.y, what: 'USE the computer the night shift left logged in: a desktop with a Terminal, the live robot Tracker, the game Last Donut and the Incident Log. The toy stands still while you are at it.' + (half ? ' The sticky note on this monitor is half of the CLEARANCE 9 password.' : ''), text: [...dw, ...(half ? [half] : [])] });
    add({ id: 'terminal-' + d.room, kind: 'terminal', name: 'Terminal on security desk ' + n, room: d.room, x: d.x + 0.3, z: d.z, y: d.y, what: 'A command prompt over the night shift’s files (ls, cd, cat, open), and the building’s control panel: sprinklers, firetest, lights, lift, doors and pa are commands too. The folder /sublevel9 is locked until the two halves of the password are typed.', text: fileTitles(n) });
  });
  for (const s of spots) if (s.id === 'secdesk') done.add(s);
  const mine = new Set((P.secDesks || []).map(d => d.room));
  for (const m of P.marks.filter(q => q.kind === 'monitorWall')) {
    const lit = mine.has(m.room);
    add({ id: 'monitors-' + m.room + '-' + Math.round(m.x), kind: 'monitor', name: lit ? 'Wall of security monitors' : 'Wall of monitors (dark)', room: m.room, x: m.x, z: m.z, y: m.y,
      what: lit ? 'Ten camera feeds (still pictures of real places in the game, each with a clock that keeps time), one screen of green snow, and a big display with the robot tracker running live on it.' : 'A wall of monitors in the base under the park. They stay dark.',
      text: lit ? [...FEEDS.map(f => `CAM ${f[0]} ${f[1]}`), 'CAM 17 BRIDGE GALLERIES, WEST', 'NO SIGNAL', 'SINCE MARCH', 'The robot tracker, live'] : [] });
  }
  if (!FEEDS.length) notFound.push('monitor: the list of camera feeds (src/secroom.js FEEDS) could not be read');
}

// ---- races, robots
{
  const rw = W('racespots');
  for (const s of (G.raceSpots && G.raceSpots.spots) || []) {
    const r0 = s.rivals && s.rivals[0], room = roomNear(s.x, s.z, s.fy), way = (s.way || []).map(w => [r1(w[0]), r1(w[1])]);
    add({ id: 'race-' + s.id, kind: 'race', name: r0 ? r0.name : s.place, room: room || null, x: s.x, z: s.z, y: s.fy, what: `${s.rivals.map(r => r.name).join(' and ')} wait${s.rivals.length > 1 ? '' : 's'} under a lit arch at ${s.place}: drive up, E, and race ${s.laps} lap${s.laps > 1 ? 's' : ''} of the course that lights up on the floor. Cars only. Beating ${r0 ? r0.name : 'them'} is a secret.`, text: [...(r0 ? [r0.hello, r0.win, r0.lose].filter(Boolean) : []), ...rw] });
    if (way.length) paths.push({ id: 'race-' + s.id, kind: 'race', name: 'Race course: ' + s.place + (r0 ? ' (' + r0.name + ')' : ''), level: levelOf(room, s.x, s.z, s.fy), pts: [...way, way[0]] });
    for (const q of spots) if (q.id === 'race:' + s.id) done.add(q);
  }
  const g = fb.guards, gw = W('guards'), all = [...((g && g.patrols) || [])];
  if (g && g.lobbyBot && g.lobbyBot.P && !all.includes(g.lobbyBot.P)) all.push(g.lobbyBot.P);
  for (const Pt of all) {
    const pts = []; for (let i = 0; i < Pt.n; i++) pts.push([Pt.pts[i * 2], Pt.pts[i * 2 + 1]]);
    if (!pts.length) { warn('robot ' + Pt.id + ' has no beat'); continue; }
    const lobby = g.lobbyBot && g.lobbyBot.P === Pt, name = lobby ? 'Security robot (lobby)' : 'Security robot (' + Pt.rooms.join(', ') + ')', room = roomNear(pts[0][0], pts[0][1], Pt.fy);
    add({ id: Pt.id, kind: 'robot', name, room, x: pts[0][0], z: pts[0][1], y: Pt.fy, what: `Starts its beat here: out along ${Pt.rooms.map(q => title(BY[q])).join(', ')} and back, stopping to sweep its searchlight. Stay in the light and it comes for you; within a metre and a half it zaps you and you wake in the dumpster, 50 chips poorer.` + (lobby ? ' This is the one that sees the saucer off in the entrance hall.' : ''), text: gw });
    paths.push({ id: 'beat-' + Pt.id, kind: 'robot-beat', name: 'Beat of the s' + name.slice(1), level: levelOfY(Pt.fy), pts: pts.map(([x, z]) => [r1(x), r1(z)]) });
    areas.push({ id: 'beat-' + Pt.id, kind: 'robot-beat', name: name + ': the rooms on its beat', rooms: Pt.rooms.slice() });
    areas.push({ id: 'chase-' + Pt.id, kind: 'robot-chase', name: name + ': the rooms it will chase through', rooms: (Pt.area || Pt.rooms).slice() });
  }
  for (const s of spots) if (/^bot/.test(s.id)) done.add(s);
}

// ---- the monkey's dash
{
  const f = fb['l2-grande-jatte'];
  let Wy = null; try { Wy = f && kit ? f.chart(kit) : null; } catch (e) { warn('the monkey’s dash could not be charted: ' + e); }
  if (Wy && Wy.p) { const pts = []; for (let i = 0; i + 1 < Wy.p.length; i += 2) pts.push([r1(Wy.p[i]), r1(Wy.p[i + 1])]); paths.push({ id: 'monkey-dash', kind: 'monkey-dash', name: 'The monkey’s dash to the Director’s whiteboard', level: levelOfY(f.y), pts }); areas.push({ id: 'monkey-dash', kind: 'monkey-dash', name: 'The rooms the monkey runs through', rooms: (Wy.rooms || []).slice() }); }
  else notFound.push('path: the monkey’s dash (src/l2-grandejatte.js chart) gave no route');
  if (f && f.bench) add({ id: 'bench-monkey', kind: 'bench', name: 'The monkey’s bench', room: f.roomId, x: f.bench.x, z: f.bench.z, y: f.y, what: 'The short bench the monkey sits under at the start of every night, and on when it has come back from the Director’s whiteboard.', text: [] });
}

// ---- hoops, the stunt kit, cones, perches, benches the hats roost on
{
  numbered('hoop', P.hoops.map(h => ({ ...h, room: h.room ? BY[h.room] : (roomNear(h.x, h.z, h.y - 0.9) || roomNear(h.x, h.z, h.y - 2.5) || null) })), (h, id, room) => add({ id, kind: 'hoop', name: 'Hoop', room, x: h.x, z: h.z, y: room ? Math.max(room.y, h.y - 2.6) : 0, what: 'Go through it. Every hoop in the building in one visit is the trophy Every Hoop.', text: [] }));
  const kitOf = {}, where = s => roomAt((s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2, (s.base != null ? s.base : Math.min(s.h0, s.h1)) + 0.05);
  for (const s of P.surfaces) if (['ply', 'track', 'pad', 'crate'].includes(s.skin) && !s.hill) { const r = where(s); if (r && !r.secret) (kitOf[r.id] = kitOf[r.id] || []).push(s); }
  for (const idr of Object.keys(kitOf).sort()) { const L = kitOf[idr], n = L.length, cx = L.reduce((a, s) => a + (s.x0 + s.x1) / 2, 0) / n, cz = L.reduce((a, s) => a + (s.z0 + s.z1) / 2, 0) / n; add({ id: 'stunt-' + idr, kind: 'stunt-kit', name: `Stunt kit (${n} piece${n > 1 ? 's' : ''})`, room: idr, x: cx, z: cz, y: BY[idr].y, what: `Plywood ramps, track and crates left out in this room (${n} piece${n > 1 ? 's' : ''}): to jump off, for a Stunt Look at a work from mid-air, and on the way through the hoops.`, text: [] }); }
  const pk = {}; for (const p of P.props || []) { const r = roomNear(p.x, p.z, p.y || 0); if (!r) continue; (pk[r.id] = pk[r.id] || []).push(p); }
  for (const idr of Object.keys(pk).sort()) { const L = pk[idr], n = L.length, kinds = [...new Set(L.map(p => p.type))], cx = L.reduce((a, p) => a + p.x, 0) / n, cz = L.reduce((a, p) => a + p.z, 0) / n; add({ id: 'cones-' + idr, kind: 'cones', name: `${n} ${kinds.join('s and ')}${n > 1 ? 's' : ''}`, room: idr, x: cx, z: cz, y: BY[idr].y, what: 'Cones and WET FLOOR signs standing about: drive into them and they go over.', text: [] }); }
  const perchW = clean((SRC['main.js'].match(/callout\('A VIEW FROM UP HERE'\)/) ? ['A VIEW FROM UP HERE'] : []));
  numbered('perch', P.surfaces.filter(s => s.perch).map(s => ({ s, x: (s.x0 + s.x1) / 2, z: (s.z0 + s.z1) / 2, y: Math.max(s.h0, s.h1), room: roomAt((s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2, Math.max(s.h0, s.h1) - 0.3) || roomAt((s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2, Math.max(s.h0, s.h1) - 2.6) || roomAt((s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2, (s.base || 0) + 0.1) || null })), (q, id, room) => add({ id, kind: 'perch', name: 'High place: ' + q.s.perch, room, x: q.x, z: q.z, y: q.y, what: `Get the toy up onto the ${q.s.perch} and stop: it counts as one of the ${G.perchTotal} high places (the tally on the pause screen).`, text: [...perchW, `The ${q.s.perch}. Look round: E works from here too.`] }));
  // the benches the hats may come down on: a long bench in a room they may wander, within their reach of the picture
  const hats = ((fb.escapes && fb.escapes.list0) || []).find(E => /hats/.test(E.spec.name)), ha = areas.find(a => a.id === 'escape-hats');
  if (hats && ha) for (const b of order(P.benches.filter(b => !(b.half < 1.4)))) { const r = roomNear(b.x, b.z, b.y); if (r && ha.rooms.includes(r.id) && Math.hypot(b.x - hats.art.x, b.z - hats.art.z) <= 18) add({ id: 'bench-hats-' + r.id, kind: 'bench', name: 'Bench (where the hats roost)', room: r, x: b.x, z: b.z, y: b.y, what: 'A gallery bench within the hats’ reach of the Millinery Shop: when they are out they come down on it in a row.', text: [] }); }
}

// ---- out of doors: the hydrants
numbered('hydrant', (P.hydrants || []).map(h => ({ ...h, room: null })), (h, id) => add({ id, kind: 'other', name: 'Fire hydrant', room: null, x: h.x, z: h.z, what: 'A hydrant on the pavement. A bump leaves it standing; hit it hard and square and it shears off, the main lets go in a jet as high as a lamp post, and it freezes into a fountain of ice that stands for the rest of the night.', text: [] }));

// ---- trophies that are a room, or one work
{
  const T = Object.fromEntries(G.trophies.list.map(t => [t.id, t]));
  const ROOMS = { studio: r => /conservation/i.test(r.gallery || ''), dock: r => /loading dock/i.test(r.gallery || ''), boiler: r => /boiler/i.test(r.gallery || ''), office: r => /director.s office/i.test(r.gallery || ''), chagall: r => /chagall/i.test(r.gallery || ''), griffin: r => r.kind === 'hall', stairs: r => r.id === 'G200' };
  for (const [tid, test] of Object.entries(ROOMS)) {
    const t = T[tid]; if (!t) { warn('trophies.js no longer has the trophy ' + tid); continue; }
    const list = P.rooms.filter(r => !r.secret && test(r)); if (!list.length) notFound.push('trophy-room: no room answers to the trophy ' + t.name);
    for (const r of list) add({ id: 'trophy-' + tid + '-' + r.id, kind: 'trophy-room', name: 'Trophy: ' + t.name, room: r, x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, y: r.y, what: tid === 'stairs' ? 'Get to the top of the Grand Staircase for this trophy.' : 'Being in this room earns the trophy' + (list.length > 1 ? ' (any one of ' + list.length + ' rooms does)' : '') + '.', text: [t.name, t.desc] });
  }
  const WORKS = { jatte: /grande jatte/i, bedroom: /^the bedroom\b/i, lilies: /^water lilies/i };
  for (const [tid, re] of Object.entries(WORKS)) {
    const t = T[tid]; if (!t) { warn('trophies.js no longer has the trophy ' + tid); continue; }
    let list = G.museum.arts.filter(a => re.test(a.work.t || '')); if (tid === 'jatte' && list.some(a => !/sketch|study/i.test(a.work.t))) list = list.filter(a => !/sketch|study/i.test(a.work.t));
    if (!list.length) notFound.push('secret: the trophy ' + t.name + ' has no work hung tonight');
    for (const a of list) add({ id: 'trophy-' + tid + '-' + a.work.id, kind: 'secret', name: 'Trophy: ' + t.name, room: a.room, x: a.x, z: a.z, y: a.fy, what: 'Look closely at ' + workName(a.work) + ' for this trophy.', text: [t.name, t.desc] });
  }
}

// ---- ways in, and between levels
{
  const inW = FW('main.js', /YOU’RE IN/), v = P.vent;
  if (v) add({ id: 'way-front-vent', kind: 'way-in', name: 'The air vent beside the front doors', room: v.a, reach: 4, x: (v.x0 + v.x1) / 2, z: (v.z0 + v.z1) / 2, y: v.y, what: 'The way in on the first night: the front doors are locked and the air vent beside them is not. Coming in by it the first time plays the saucer scene.', text: inW });
  if (P.front) add({ id: 'way-front-doors', kind: 'way-in', name: 'The front doors', room: P.front.a, reach: 4, x: (P.front.x0 + P.front.x1) / 2, z: (P.front.z0 + P.front.z1) / 2, y: P.front.y, what: 'Locked, with every other outside door, until you have found a way in once; then they all swing open.', text: [] });
  const HK = { duct: ['Air duct', 'A duct through the wall, low enough for the toy: a way in from outside.'], inner: ['Duct from the court', 'A short duct between the court outside and this room.'], flap: ['Flap in a door', 'A flap low in a door: a way in from outside.'], window: ['Window propped open', 'A window propped open at the foot of the wall: a way in from outside.'], dock: ['Dock shutter, part raised', 'A loading shutter left a toy’s height off the ground: a way in from outside.'] };
  for (const h of P.holes || []) { const k = HK[h.kind]; if (!k) warn('a way in of a kind the table does not know: ' + h.kind); add({ id: 'way-' + h.id, kind: 'way-in', name: (k ? k[0] : 'Way in (' + h.kind + ')'), room: h.a, reach: 2.5, x: (h.x0 + h.x1) / 2, z: (h.z0 + h.z1) / 2, y: h.y, what: k ? k[1] : 'A way in from outside.', text: [] }); }
  for (const d of P.doors) if ((d.out || d.b === 'out') && !d.vent && d !== P.front) add({ id: 'way-door-' + d.id, kind: 'way-in', name: 'Outside door', room: d.a, reach: 2, x: (d.x0 + d.x1) / 2, z: (d.z0 + d.z1) / 2, y: d.y, what: 'A door to the outside. Locked until you have found a way in once; open after that.', text: [] });
  for (const k of P.skylights || []) { const r = BY[k.room]; add({ id: 'way-skylight-' + k.room, kind: 'way-in', name: 'Open skylight (drone)', room: r, x: (k.x0 + k.x1) / 2, z: (k.z0 + k.z1) / 2, y: r ? r.y : 0, what: 'A skylight left open in the roof over this room: the drone’s way in, and a place to peer down from on the roofs.', text: [] }); }
  const V = P.staffVent, bin = fb.guards && fb.guards.bin;
  if (V) add({ id: 'way-staff-vent', kind: 'way-in', name: 'The staff vent (the duct from the bin yard)', room: V.room, x: V.keep ? (V.keep.x0 + V.keep.x1) / 2 : V.x0, z: V.zc, y: V.y, what: 'Where the duct from the hood by the dumpster comes out, low in the wall: the way back in after a robot has thrown you out, and straight to security’s big red button.', text: W('guards', /vent hood/) });
  if (V && V.hood) add({ id: 'way-staff-vent-hood', kind: 'way-in', name: 'The vent hood by the dumpster', room: null, x: (V.hood.x0 + V.hood.x1) / 2, z: (V.hood.z0 + V.hood.z1) / 2, what: 'A galvanised hood over an air intake in the bin yard, its grille off: drive in and the duct slopes down under the wall to the staff entrance on the lower level.', text: [] });
  if (bin) add({ id: 'dumpster', kind: 'way-in', name: 'The dumpster', room: null, x: bin.x, z: bin.z, what: 'Where you wake up when a robot zaps you or a heist’s cage drops: thrown out, round the back. The vent hood in front of it is the way back in.', text: W('guards', /THROWN OUT|Dumped|binned|chips$/) });
  for (const s of spots) if (s.id === 'dumpster' || s.id === 'staffvent') done.add(s);
  for (const l of P.lifts || []) {
    const cx = (l.x0 + l.x1) / 2, cz = (l.z0 + l.z1) / 2, at = l.stops.map(y => roomAt(cx, cz, y + 0.3) || roomAt(cx, cz, y + 1) || BY[l.room]);
    const lv = y => (NAMES[levelOfY(y)] || levelOfY(y)), same = at.every(q => q === at[0]);
    l.stops.forEach((y, i) => add({ id: 'way-lift-' + l.id + '-' + (i + 1), kind: 'way-in', name: 'Lift', room: at[i], level: at[i] && (at[i].secret || at[i].floor === 'X') ? 'X' : levelOfY(y), x: cx, z: cz, y, what: (same ? `The lift in ${title(at[0])}, stopping at ${l.stops.map(lv).join(', ')}` : `A lift between ${l.stops.map((q, j) => title(at[j]) + ' (' + lv(q) + ')').join(' and ')}`) + ': drive on and it goes.', text: [] }));
  }
  const groups = {}; for (const q of P.ramps || []) { const g = q.id.replace(/-\d+$/, ''); (groups[g] = groups[g] || []).push(q); }
  for (const [g, L] of Object.entries(groups)) {
    // each flight's two ends: (y0 at its low-numbered end, y1 at the other); the stair goes from the lowest end to the highest
    const ends = L.flatMap(q => { const ax = q.axis === 'x', c = ax ? (q.z0 + q.z1) / 2 : (q.x0 + q.x1) / 2; return [{ y: q.y0, x: ax ? q.x0 : c, z: ax ? c : q.z0, dx: ax ? -1 : 0, dz: ax ? 0 : -1, q }, { y: q.y1, x: ax ? q.x1 : c, z: ax ? c : q.z1, dx: ax ? 1 : 0, dz: ax ? 0 : 1, q }]; }).sort((a, b) => a.y - b.y);
    const lo = ends[0], hi = ends[ends.length - 1], endRoom = e => roomAt(e.x + e.dx * 0.5, e.z + e.dz * 0.5, e.y + 0.2) || roomAt(e.x - e.dx * 0.5, e.z - e.dz * 0.5, e.y + 0.2) || BY[e.q.room], ra = endRoom(lo), rb = endRoom(hi);
    const lv = (r, y) => (r && (r.secret || r.floor === 'X') ? 'the secret levels' : (NAMES[levelOfY(y)] || levelOfY(y))), q0 = lo.q, mx = (q0.x0 + q0.x1) / 2, mz = (q0.z0 + q0.z1) / 2, r = roomAt(mx, mz, lo.y + 0.2) || ra;
    add({ id: 'way-stair-' + g, kind: 'way-in', name: 'Stairs', room: r, reach: 3, x: mx, z: mz, y: lo.y, level: r && (r.secret || r.floor === 'X') ? 'X' : levelOfY(lo.y), what: `A stair of ${L.length} flight${L.length > 1 ? 's' : ''} from ${title(ra)} (${lv(ra, lo.y)}, ${r1(lo.y)} m) up to ${title(rb)} (${lv(rb, hi.y)}, ${r1(hi.y)} m).`, text: [] });
  }
}

// ------------------------------------------------------------------ what the game's own list of spots has, by its ids
// kind, a sentence, and where the words are: a feature's id (f), a pattern to pick among them (re), a once() of main.js (once).
// `room`: the room it belongs to when its place is in a wall. A spot not here is still listed (and a warning printed).
const PZ = 'painting-puzzle';
const SPOT = {
  shiva141: { kind: PZ, what: 'Look at Shiva as Lord of the Dance and the ring of flames he dances in is lit on the floor: go once round inside it without touching its edges.' },
  hours107: { kind: PZ, what: 'Utamaro’s Twelve Hours of the Green Houses: look at the print for the hour it is now where you are, or at every one of them that is on view.' },
  masks103: { kind: PZ, what: 'Four stands of Noh masks that turn to watch you, and one stand empty: bring the missing mask home on the roof of the car.' },
  'masks103-lost': { kind: PZ, f: 'masks103', re: /MASK|belongs|hands are full/i, what: 'The missing Noh mask lies here: drive into it to pick it up, and carry it to the empty stand in Gallery 103.' },
  seasons154: { kind: PZ, what: 'A Roman floor of the four seasons with its four squares lifted out: push each tile back into its place.' },
  herring161: { kind: PZ, what: 'Look at Homer’s The Herring Net: you hear the sea, and a herring jumps from under the frame onto the floor. Catch it.' },
  wheat: { kind: PZ, re: /SEASONS/, lines: true, what: 'Monet’s stacks of wheat change the light of the room to their own hour and season as you look at each: see them all.' },
  lilypad: { kind: PZ, re: /frog|pond|Plop|RIBBIT/i, what: 'Looking at the Water Lilies opens a pond in the floor: hop from lily pad to lily pad to the frog on the far one.' },
  cancan: { kind: PZ, re: /can-can|CAN-CAN|Bravo|Out of step|No sound/i, what: 'Look at At the Moulin Rouge and the can-can strikes up over a floor of lit squares: drive onto each square as it lights, in time with the band.' },
  circus: { kind: PZ, re: /ring|lap|Two!|THREE TIMES/i, what: 'Looking at the circus picture lays a sawdust ring on the floor: three laps of it at a gallop, without leaving the ring.' },
  pasdedeux: { kind: PZ, what: 'From the mark by the west door the practice barres rise: weave through them to the line by the far door, clean and in time.' },
  musicroom: { kind: PZ, what: 'Hammershøi’s music room hums one held note; play a chord on the upright piano by the east wall.' },
  monkey: { kind: PZ, what: 'The monkey off the lead in La Grande Jatte sits under the bench. Drive up and it bolts, a dash at a time, to the Director’s whiteboard; find it there and it runs home, and jumps back into its picture when you next come in.' },
  duet: { kind: PZ, what: 'A small upright by the Renoir with Für Elise open on it: play the opening phrase and the piano answers with the next bars, and its lamp comes up.' },
  bedroom: { kind: PZ, room: 'G241', reach: 12, what: 'A gap no taller than the toy, low in the north wall under The Bedroom: drive through into Van Gogh’s bedroom, built at toy scale behind the wall with its floor running uphill.' },
  joust: { kind: PZ, what: 'The armour’s helmet follows you round the room. Bring its lance, accept the challenge, ride to the far doors, turn and meet the knight at a gallop down your side of the tilt with the lance level.', what2: 'The tilting lance lies here, put away behind the scenes: drive into it and carry it to the armour in Gallery 239.' },
  dragon: { kind: PZ, what: 'Look at Saint George and the dragon’s shadow comes out of the painting after you: get three rooms away, or hide in a doorway, to lose it.' },
  midnight: { kind: PZ, what: 'Twelve clocks that all disagree: pull up to each and put it on the hour. When all agree they strike midnight, a panel in the tall clock slides open and a small brass key drops out.', what2: 'A little locked cabinet: the brass key from the clocks of 231 opens it, for 150 chips the first time.' },
  // out of doors and on the roofs: a secret each, the sentence made from the game's own name for it
  ...Object.fromEntries(['bullseye', 'skater', 'sledding', 'penguinrace', 'bridgeway', 'blades', 'harbour', 'harbourlight', 'traffic', 'train', 'roofvane', 'roofscope', 'roofstars', 'roofpigeons', 'roofkite', 'roofrink', 'roofbees', 'roofsolar', 'roofsnowman', 'roofjingle', 'roofwave', 'roofpeek', 'roofrun', 'roofchimney', 'bridgeloop', 'bridgegap', 'icefish', 'derbyhr', 'derby5', 'hutcat', 'bigair', 'homerun', 'snowmen', 'wonderland', 'ornaments', 'snowball', 'snowstar'].map(id => [id, { kind: 'secret', outdoors: true }])),
  goingup: { kind: 'way-in', what: 'The glass lift up the face of the Modern Wing, out of doors: call it and ride from the ground to the third floor and the roof of the west pavilion.' },
  restoration: { kind: PZ, what: 'A painting half cleaned on the conservator’s easel in the Ryan Learning Center: E to carry on and finish the restoration.' },
  l3snowman: { kind: PZ, what: 'Snow has blown in across the terrace: roll it into balls and stack them into a snowman.' },
  l3viewer: { kind: PZ, what: 'A coin viewer on the terrace: look through it up the Bridgeway into Millennium Park.' },
  l3service: { kind: PZ, what: 'Ring at the kitchen pass for service, then run the plate to the table for two at the far end of the restaurant before it goes cold.' },
  l3xray: { kind: PZ, what: 'An X-ray on a light box: look at it for the guitar under the paint, a clue to Gallery 391.', drawn: true },
  l3cake: { kind: PZ, what: 'A birthday cake nobody has blown the candles out on: drive past it fast and they go out.', drawn: true },
  l3cubist: { kind: PZ, what: 'A Cubist still life of a guitar broken into shards hung in the air: from one spot on the floor, and only there, it is whole. Stand on that spot.' },
  l3kandinsky: { kind: PZ, what: 'Seven shapes that hum, each its own note: touch all seven.' },
  l3mondrian: { kind: PZ, what: 'A Mondrian laid out on the floor: drive from the red square to the yellow one on the black lines only.' },
  l3lemons: { kind: PZ, what: 'A pewter plate on the floor with one lemon on it and three rolled away across the room: nudge them home, all four on the plate.' },
  l3bird: { kind: PZ, what: 'A polished egg on a stack of base blocks: go round it three times and it opens, and a brass bird flies once round the skylight and comes back to sit on the shell.' },
  l3doors: { kind: PZ, what: 'Two doors stand open on their own in the middle of the floor, with the night in them: go in at one and you come out of the other, the far side of the room.' },
  l3corpse: { kind: PZ, what: 'A column of three drums, each painted with four heads, bodies or legs: roll onto a plate to turn its drum, and when all three show the same creature it wakes up.' },
  l3bubbles: { kind: PZ, what: 'A clay pipe still blowing soap bubbles: pop a dozen of them.' },
  l3stars: { kind: PZ, what: 'Seven stars let into the floor: drive over them in order, from the end of the handle to the bowl.' },
  l3sprint: { kind: PZ, what: 'The whole corridor of Gallery 389 end to end, flat out, under the time on the notice board downstairs.' },
  thorne: { kind: PZ, re: /Four of the miniature|SHOEBOX/, what: 'Four of the Thorne miniature rooms are built big enough to drive into, through a pane cracked out at the foot of each case.' },
  'thorne:all': { kind: PZ, re: /EVERY ROOM|FOUND/, f: 'thorne', what: 'Find the one small thing hidden in each of the four miniature rooms (a brass key, a silver thimble, a sealed letter, a church mouse).' },
  'thorne:key': { kind: PZ, f: 'thorne', re: /FOUND|rm\.def/, what: 'Hidden inside one of the miniature rooms: drive in and find it.' }, 'thorne:thimble': { kind: PZ, f: 'thorne', re: /FOUND|rm\.def/, what: 'Hidden inside one of the miniature rooms: drive in and find it.' }, 'thorne:letter': { kind: PZ, f: 'thorne', re: /FOUND|rm\.def/, what: 'Hidden inside one of the miniature rooms: drive in and find it.' }, 'thorne:mouse': { kind: PZ, f: 'thorne', re: /FOUND|rm\.def/, what: 'Hidden inside one of the miniature rooms: drive in and find it.' },
  'seasons154-spring': { kind: 'mosaic-tile', f: 'seasons154', what: 'One of the four lifted squares of the Roman floor: push it home to its place.' }, 'seasons154-summer': { kind: 'mosaic-tile', f: 'seasons154', what: 'One of the four lifted squares of the Roman floor: push it home to its place.' }, 'seasons154-autumn': { kind: 'mosaic-tile', f: 'seasons154', what: 'One of the four lifted squares of the Roman floor: push it home to its place.' }, 'seasons154-winter': { kind: 'mosaic-tile', f: 'seasons154', what: 'One of the four lifted squares of the Roman floor: push it home to its place.' },
  lionhunt: { kind: 'lion', what: 'One of the twelve lions loose about the building: come up to it and it is counted. The hunt is set going by the lion hunt painting in Gallery 220.' },
  easel: { kind: 'easel', once: 'easel', file: 'paint.js', what: 'An easel and paint in the studio: PAINT a picture of your own, and it is hung in the big frame in the Michigan Avenue lobby.' },
  simon: { kind: 'other', once: 'simon', what: 'The colour pedestal: four lit pads in four of the roof’s colours play a pattern and you play it back. Five patterns right and confetti in the colours of the roof comes down the length of the court.' },
  repair: { kind: 'other', once: 'repair', what: 'The Conservation Line: clock on and mend what you can of the paintings that come down the belt (50 blemishes in a shift is a trophy).', also: ['The Conservation Line', 'Paintings come down the belt. Mend what you can.'] },
  vault: { kind: 'scene', file: 'secret.js', re: /SUB-LEVEL 9|Twelve metres/, what: 'When you first come down the stair from the passage: Sub-level 9, twelve metres under the street. A secret, a trophy and a page of the file.' },
  ufo: { kind: 'other', file: 'secret.js', re: /IT IS YOURS|lifts off|On the pedestal/, once: 'ufo', what: 'A flying saucer the size of a dustbin lid, turning by itself on a pedestal: go up to it and TAKE it, and there is one your size among the toys on the title screen.' },
  keycard: { kind: 'other', f: 'finale', re: /KEYCARD|keycard|card/i, what: 'A keycard on a stand under a map of a tunnel going east: TAKE it. It opens the blast door beside it.' },
  blastdoor: { kind: 'way-in', room: 'X-brief', f: 'finale', re: /blast door|ACCESS GRANTED|Swipe/i, what: 'A blast door and a card reader: with the keycard it rolls aside, onto a tunnel that runs 190 m east under the railway and Columbus Drive to the base under Butler Field.' },
  greencheese: { kind: 'scene', f: 'finale', re: /^$/, arrive: 'B-hangar', what: 'The hangar under Butler Field, and the craft on its launch platform, ramp down, under the silo shaft: coming into it is the secret Project Green Cheese.' },
  'story-note': { kind: 'other', what: 'A note on the floor of the office under a little saucer, signed D.: READ it for why any of it matters.', f: 'story', re: /A note|The Director\./, lit: ['story.js', 'D_NOTE', '— D.'] },
  'story-rings': { kind: 'scene', f: 'story', re: /Rings|five notes|green light/i, what: 'Out on Butler Field, over the silo: rings melted into the snow with five marks round them, and the call from under your wheels. Driving onto them is a page of the file; the finale’s launch comes up through here.' },
  'party-note': { kind: 'scene', f: 'welcome', lit: ['welcome.js', 'NOTE', '— D.'], what: 'The welcome party on the roof of the Modern Wing’s west pavilion, laid out for visitors from the stars: READ the Director’s note propped against the cake (a page of the file).' },
  'party-book': { kind: 'other', f: 'welcome', re: /guest book|signature/i, book: true, what: 'The guest book on a stand by the lift at the welcome party: READ it. The last signature is in no alphabet at all.' },
  reading: { kind: 'other', what: 'A display of real books about the works on view tonight, propped cover-out at a toy’s eye height: READ one for its card and a link to it on Open Library.' },
  lobbymap: { kind: 'other', f: 'lobby', what: 'The museum map on a stand, turned to the front doors: drive up and MAP opens the big map.' },
  globes: { kind: 'gift-shop', f: 'giftshop', re: /globe|GLOBE|way is lit/i, what: 'Six snow globes along the front of the Museum Shop, each a working model of something far off (the can-can, the Thorne Rooms, ice fishing, the glass lift, the joust, the sledding run): shake one and the way there is lit. All six is a secret.' },
  shelf: { kind: 'gift-shop', f: 'giftshop', re: /till|Shop|SHELF|CHOCOLATE|chocolate/i, what: 'The till at the back of the Museum Shop: chips buy flags for the aerial, a hot chocolate for a burst of speed, and little things for your own shelf behind the counter. Buying every one is a secret.' },
  'keeper-log': { kind: 'other', f: 'probe', re: /hut|Clarice|logbook/i, log: true, what: 'The keeper’s hut at the foot of the harbour light: READ the logbook left open on the step.' },
  poker: { kind: 'other', once: 'poker', what: 'The card game on the roof of Gallery 211, under fairy lights: sit in at the empty place for Texas hold’em. The chips are the game’s money.' },
  dogs: { kind: 'easel', what: 'A Friend in Need on an easel by the card game: LOOK at it.' },
  stall: { kind: 'other', once: 'stall', what: 'A toy stall on the roof: two toys for sale at 2,000 chips each.' },
  hockey: { kind: 'other', once: 'pond', what: 'A pond frozen hard, out of doors, with a goal at each end and a puck in the middle: play the blue car at pond hockey (a goal and a win are trophies).' },
  presents: { kind: 'other', once: 'parcel', file: 'presents.js', what: 'Parcels under the tree, out of doors: OPEN one for what is in it (a car, chips, a map, a paper crown, coal).' },
};
// words kept in a table in the code and said from it: the line of each thing (line: '...'), what is said on first coming into
// each room of the base, and what the shop's till sells
const lineProps = src => [...src.matchAll(/\bline:\s*(?='|`)/g)].map(m => { const i = m.index + m[0].length, k = skip(src, i); return unesc(src.slice(i + 1, k - 1)); });
const ARRIVE = (() => { const src = SRC['finale.js'] || '', i = src.indexOf('_arrive('); const v = i > 0 ? literal(src.slice(i), 'line') : null; if (!v) warn('finale.js: what is said on coming into each room of the base was not found'); return v || {}; })();
const GOODS = [...(SRC['giftshop.js'] || '').matchAll(/name:\s*'((?:[^'\\]|\\.)*)',\s*price:\s*(\d+),\s*line:\s*'((?:[^'\\]|\\.)*)'/g)].map(m => `${unesc(m[1])} (${m[2]} chips): ${unesc(m[3])}`);
if (!GOODS.length) warn('giftshop.js: what the till sells was not found');
const LIONART = fb.lionhunt && fb.lionhunt.art;
if (LIONART) add({ id: 'lionhunt-painting', kind: PZ, name: workName(LIONART.work) + ' (starts the lion hunt)', room: LIONART.room, x: LIONART.x, z: LIONART.z, y: LIONART.fy, what: 'Look at this painting and the lion hunt begins: twelve lions are loose about the building, ten indoors and the two on the front steps.', text: W('lionhunt') });
else notFound.push('painting-puzzle: the painting that starts the lion hunt is not hung tonight');
const secretOf = id => F.find(f => (f.secrets || []).some(s => s[0] === id) && BLOCK[f.id]);
const featOf = s => { const f = F.find(q => BLOCK[q.id] && q.id === s.id) || secretOf(s.id) || secretOf(s.id.split(':')[0]) || F.find(q => BLOCK[q.id] && s.id.startsWith(q.id)); return f ? f.id : null; };
const seenSpot = {}, many = {}; for (const s of spots) many[s.id] = (many[s.id] || 0) + 1;
for (const s of spots) {
  if (done.has(s) || /^sys-/.test(s.id)) continue;
  const t = SPOT[s.id] || SPOT[s.id.replace(/\d+$/, '')], nth = (seenSpot[s.id] = (seenSpot[s.id] || 0) + 1), fid = t && t.f ? t.f : featOf(s);
  let text = [];
  if (t && t.once) text.push(...ONCE(t.once));
  if (t && t.also) text.push(...t.also);
  if (t && t.file) text.push(...FW(t.file, t.re));
  if (fid && !(t && t.file && !t.f)) text.push(...W(fid, t && t.re));
  if (t && t.lit) { const v = LIT(t.lit[0], t.lit[1]); if (v) text.push(...v, ...(t.lit[2] ? [t.lit[2]] : [])); }
  if (t && t.book) { const v = LIT('welcome.js', 'BOOK'); if (v) text.push('GUEST BOOK', 'please sign', ...v.flatMap(q => [q[0], q[1]])); }
  if (t && t.log) { const v = LIT('probe.js', 'LOG'), n = LIT('probe.js', 'NOTE'); if (v) text.push(...v.map(q => q[0] + ': ' + q[1])); if (n) text.push(...n); }
  if (t && t.drawn && fid && BLOCK[fid]) text.push(...drawn(BLOCK[fid].pre + BLOCK[fid].body));
  if (t && t.lines && fid && BLOCK[fid]) text.push(...lineProps(BLOCK[fid].pre + BLOCK[fid].body));
  if (t && t.arrive && ARRIVE[t.arrive]) text.push(...ARRIVE[t.arrive].filter(Boolean));
  if (s.id === 'shelf') text.push(...GOODS);
  if (s.id === 'lionhunt') text = fill(text, { 'L.name': s.name.replace(/^Lion \d+: /, '') });
  const room = t && t.room ? t.room : t && t.outdoors ? null : roomNear(s.x, s.z, s.y) || null, out = !room;
  let kind = t && t.kind ? t.kind : s.kind === 'secret' ? 'secret' : 'other', what = t && (nth > 1 && t.what2 ? t.what2 : t.what);
  if (!t) warn('a spot the table does not know: ' + s.id + ' "' + s.name + '"' + (out ? ' (out of doors)' : ' in ' + room.id));
  if (!what) what = (out ? (/^roof/.test(s.id) ? 'On the roofs: ' : 'Out of doors: ') : '') + s.name + (s.kind === 'secret' ? '. One of the secrets.' : '.');
  add({ id: (s.id === 'lionhunt' ? 'lion' : s.id.replace(/[^\w-]+/g, '-')) + (many[s.id] > 1 ? '-' + nth : ''), kind, name: s.name, room, reach: t && t.reach, x: s.x, z: s.z, y: s.y, what, text });
}

// ---- things the list of spots does not have: the frame in the lobby, the back offices' small stories, the scenes
{
  const pa = G.paint && G.paint.art;
  if (pa) add({ id: 'easel-lobby-frame', kind: 'easel', name: 'The big frame in the lobby', room: pa.room, x: pa.x, z: pa.z, y: 0, what: 'Empty until you have painted something at the easel in the Ryan Learning Center: LOOK at it, and it offers the way to the studio. What you paint hangs here.', text: FW('paint.js') });
  // level 3: what has no secret of its own
  const at = (f, k = 'at') => (fb[f] && fb[f][k] && fb[f][k].x != null ? fb[f][k] : null);
  const L3 = [
    ['l3slides', at('l3slides'), 'Slides on a light table', 'LOOK at the slides on the light table: a clue to the galleries upstairs in the Modern Wing.', true],
    ['l3fax', at('l3fax'), 'A fax for the restaurant', 'READ the fax: a table for two at eleven, hot, ring the bell at the pass. A clue to Service! in Terzo Piano.', true],
    ['l3corridor', at('l3corridor', 'board'), 'Notice board', 'READ the notice board in the conservation corridor: cards that are clues to things on the third floor (the sprint time for Gallery 389 among them). A water cooler stands by it.', false],
    ['l3flasks', at('l3flasks'), 'Flasks that bubble', 'Flasks on the bench in the laboratory at the end of the corridor, bubbling.', false],
    ['l3frame', fb.l3frame && fb.l3frame.x != null ? { x: fb.l3frame.x, z: fb.l3frame.z } : null, 'An empty frame on its stand', 'An empty frame in the frame conservation studio, to drive through.', false],
    ['l3bucket', at('l3bucket'), 'Ice bucket', 'A champagne bucket on its stand between the tables of Terzo Piano: knock it and it goes over, ice and all.', false],
    ['l3pots', at('l3pots'), 'Pots on the range', 'Pots in the restaurant kitchen, to knock over.', false],
    ['l3mobile', fb.l3mobile && fb.l3mobile.cx != null ? { x: fb.l3mobile.cx, z: fb.l3mobile.cz } : null, 'A mobile', 'Discs on wires hung from the ceiling: drive under it fast and it turns.', false],
    ['l3forms', fb.l3forms && fb.l3forms.forms && fb.l3forms.forms[0] ? (f0 => (f0.x != null ? f0 : f0.at || (f0.m && f0.m.position) || null))(fb.l3forms.forms[0]) : null, 'Soft forms', 'Four smooth plaster forms that give when you bump them.', false],
    ['l3ring', fb.l3ring && fb.l3ring.x != null ? { x: fb.l3ring.x, z: fb.l3ring.z, y: fb.l3ring.y } : null, 'Steel ring on the terrace', 'A steel ring standing on the terrace: drive through it.', false],
  ];
  for (const [fid, p, name, what, dr] of L3) {
    if (!fb[fid]) continue;
    if (!p) { notFound.push('other: ' + name + ' (' + fid + ') does not say where it is'); continue; }
    const b = BLOCK[fid], y = p.y != null ? p.y : P.levels[3];
    let text = [...W(fid), ...(dr && b ? drawn(b.pre + b.body) : [])];
    if (fid === 'l3corridor' && b) { const cards = [...(b.pre + b.body).matchAll(/card\([^[\]]*(\[[^\]]*\])/g)].flatMap(m => { try { return new Function('return ' + m[1])(); } catch { return []; } }); if (!cards.length) warn('level3-back.js: the notice board’s cards were not found'); text.push(...cards); }
    add({ id: fid, kind: 'other', name, x: p.x, z: p.z, y, what, text });
  }
  for (const f of F) if (/^l3/.test(f.id) && !L3.some(q => q[0] === f.id) && !spots.some(s => s.id === f.id) && !['l3terrace', 'l3snowfall'].includes(f.id)) warn('a third-floor feature the table does not know: ' + f.id);
  // the scenes
  const en = fb.entry, pr = fb.probe, fin = fb.finale, Fz = P.finale;
  if (en && en.S1) add({ id: 'scene-entry-saucer', kind: 'scene', name: 'The saucer in the entrance hall', room: en.L, x: en.S1.x, z: en.S1.z, y: 0, what: 'The first time you come in through the vent, a sixteen-second cutscene: a small saucer is scanning the Turner, the picture wakes, the lobby’s robot rolls in from the Grand Staircase and puts a bolt into it, and it bolts out through the front doors, which have just unlocked.', text: [] });
  else notFound.push('scene: the entrance-hall saucer (src/entry.js) has no place tonight');
  if (en && en.art) add({ id: 'scene-entry-picture', kind: 'scene', name: 'The picture the saucer scans: ' + workName(en.art.work), room: en.art.room, x: en.art.x, z: en.art.z, y: 0, what: 'The one picture in the entrance hall, facing the vent you come in by: in the first-night scene its lamp comes on, its label takes the green light of a living work and its show begins with nobody looking.', text: [] });
  if (pr && pr.spot) add({ id: 'scene-saucer-return', kind: 'scene', name: 'The saucer’s return', room: pr.L, x: pr.spot.x, z: pr.spot.z, y: 0, what: 'Once the first scene is over and you have looked at three more works (or been indoors three minutes), a faint "?" sits here: come back and the saucer slips in by the front doors, hangs in front of you, and is yours to herd out through the vent. Then it flies to the harbour light.', text: W('probe', /entrance hall|wants out|lake|gone/i) });
  const tc = P.marks.find(m => m.kind === 'toneconsole'), sw = P.marks.find(m => m.kind === 'swivel');
  if (tc) add({ id: 'scene-tone-console', kind: 'scene', name: 'The tone console (the finale)', room: tc.room, x: tc.x, z: tc.z, y: tc.y, what: 'The console with five pads in the control room: the craft plays its call and you play it back, three phrases, each longer. Then the beam takes the lit pictures, the books and the lost property you handed in up into the craft, and it is your turn: down to the hangar floor.', text: [...W('finale', /console|pads/i), ...W('finalelaunch')] });
  else notFound.push('scene: the finale’s tone console has no mark in the plan');
  if (sw) add({ id: 'scene-big-chair', kind: 'scene', name: 'The big chair in the control room', room: sw.room, x: sw.x, z: sw.z, y: sw.y, what: 'The swivel chair with its back to you as you come into the control room: it turns, and it is only a glowing mouse.', text: W('finale', /Only a mouse/) });
  if (Fz && Fz.beam) add({ id: 'scene-beam', kind: 'scene', name: 'The beam, and the launch', room: Fz.hangar, x: Fz.beam.x, z: Fz.beam.z, y: Fz.fl, what: 'After the five notes are played: drive onto the hangar floor into the tractor beam and the toy is taken up into the craft; the silo doors part, the platform carries the saucer up through Butler Field, and the voyage to the Moon begins.', text: W('finalelaunch', /beam|YOUR TURN|wakes/i) });
  for (const [idr, line] of Object.entries(ARRIVE)) { const r = BY[idr]; if (!r) { warn('finale.js speaks of a room the plan does not have: ' + idr); continue; } if (idr === 'B-hangar') continue; add({ id: 'arrive-' + idr, kind: 'scene', name: 'Arriving in ' + title(r), room: r, x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2 + 1, y: r.y, what: 'What is said the first time you come into this room of the base.', text: line.filter(Boolean) }); }
  for (const a of P.outdoorArt || []) if (a.text) add({ id: 'outdoor-art-' + Math.round(a.x) + '-' + Math.round(a.z), kind: 'other', name: a.text.replace(/\.$/, ''), room: null, x: a.x, z: a.z, what: 'A sculpture in the grounds: come near and it is named.', text: [a.text] });
  const tun = BY['B-tunnel']; if (tun) add({ id: 'scene-tunnel', kind: 'scene', name: 'The tunnel east', room: tun, x: tun.x0 + 3, z: (tun.z0 + tun.z1) / 2, y: tun.y, what: 'Beyond the blast door: about 190 m of tunnel under the railway and Columbus Drive, its lights waking ahead of you, to the base.', text: W('finale', /lights know/) });
  const fw = fb.fireworks; if (fw && fw.det) add({ id: 'button-fireworks', kind: 'button', name: 'The fireworks plunger', room: null, x: fw.det.x, z: fw.det.z, what: 'A crate of fireworks and a plunger at the welcome party on the roof: push the plunger for fireworks over the park (a secret).', text: W('fireworks') });
  for (const s of spots) if (s.id === 'l3service') { const f = fb.l3service; if (f && f.tableAt) add({ id: 'l3service-table', kind: PZ, name: 'Service!: the table for two', x: f.tableAt.x, z: f.tableAt.z, y: f.y, what: 'Where the plate from the kitchen pass has to be brought, before it goes cold.', text: W('l3service') }); }
  // the robots docked in the base, the specimen jars, the labels down below are furniture; what is written on the base's walls is not read here
}

// ------------------------------------------------------------------ what each room is needed for
{
  const adj = new Map([['out', new Set()], ...P.rooms.map(r => [r.id, new Set()])]), ind = new Map(P.rooms.map(r => [r.id, new Set()]));
  const link = (a, b, both = true) => { if (!a || !b || a === b || !adj.has(a) || !adj.has(b)) return; adj.get(a).add(b); adj.get(b).add(a); if (both && a !== 'out' && b !== 'out') { ind.get(a).add(b); ind.get(b).add(a); } };
  for (const d of P.doors) link(d.a, d.b === 'out' || d.out ? 'out' : d.b);
  for (const q of P.ramps || []) { const ax = q.axis === 'x', c = ax ? (q.z0 + q.z1) / 2 : (q.x0 + q.x1) / 2, lo = ax ? roomAt(q.x0 - 0.5, c, q.y0 + 0.2) : roomAt(c, q.z0 - 0.5, q.y0 + 0.2), hi = ax ? roomAt(q.x1 + 0.5, c, q.y1 + 0.2) : roomAt(c, q.z1 + 0.5, q.y1 + 0.2), inn = ax ? [roomAt(q.x0 + 0.5, c, q.y0 + 0.2), roomAt(q.x1 - 0.5, c, q.y1 + 0.2)] : [roomAt(c, q.z0 + 0.5, q.y0 + 0.2), roomAt(c, q.z1 - 0.5, q.y1 + 0.2)]; const a = lo || inn[0], b = hi || inn[1]; if (a && b) link(a.id, b.id); }
  for (const l of P.lifts || []) { const cx = (l.x0 + l.x1) / 2, cz = (l.z0 + l.z1) / 2, at = l.stops.map(y => roomAt(cx, cz, y + 0.3) || roomAt(cx, cz, y + 1)); for (let i = 1; i < at.length; i++) if (at[i - 1] && at[i]) link(at[i - 1].id, at[i].id); }
  const has = new Set(rooms.filter(r => r.works > 0).map(r => r.id)); for (const it of items) if (it.room && !['hoop', 'stunt-kit', 'cones', 'way-in'].includes(it.kind)) has.add(it.room);
  const reach = (g, from, skip) => { const seen = new Set([from]), q = [from]; while (q.length) { const a = q.shift(); for (const b of g.get(a) || []) if (b !== skip && !seen.has(b)) { seen.add(b); q.push(b); } } return seen; };
  const start = P.front ? P.front.a : 'lobby', all = reach(adj, start), inAll = reach(ind, start);
  const names = list => list.slice(0, 3).map(id => title(BY[id])).join(', ') + (list.length > 3 ? ' and ' + (list.length - 3) + ' more' : '');
  const ways = {}; for (const it of items) if (it.kind === 'way-in' && it.room) (ways[it.room] = ways[it.room] || []).push(it);
  const dash = (areas.find(a => a.id === 'monkey-dash') || { rooms: [] }).rooms;
  for (const r of RL) {
    const out = roomOut[r.id], why = []; if (GONE.includes(r)) continue;
    if (r.id !== start) {
      const lost = [...has].filter(id => id !== r.id && all.has(id) && !reach(adj, start, r.id).has(id));
      if (lost.length) why.push(`The only way to ${lost.length} room${lost.length > 1 ? 's' : ''} with something in ${lost.length > 1 ? 'them' : 'it'} (${names(lost)})`);
      else { const li = [...has].filter(id => id !== r.id && inAll.has(id) && !reach(ind, start, r.id).has(id)); if (li.length) why.push(`The only way indoors to ${li.length} room${li.length > 1 ? 's' : ''} with something in ${li.length > 1 ? 'them' : 'it'} (${names(li)}); they can still be reached from out of doors`); }
    } else why.push('Where everybody comes in');
    const w = ways[r.id] || [];
    const lifts = w.filter(q => /^way-(lift|stair)/.test(q.id)), ins = w.filter(q => !/^way-(lift|stair)/.test(q.id) && !/skylight|hidden/.test(q.id));
    if (ins.length && why.length < 2) why.push('A way in from outside opens here (' + [...new Set(ins.map(q => q.name.toLowerCase()))].slice(0, 2).join(', ') + ')');
    if (lifts.length && why.length < 2) why.push('Holds ' + (lifts.some(q => /lift/.test(q.id)) ? 'a lift' : 'a stair') + ' between levels');
    if (dash.includes(r.id) && why.length < 2) why.push('On the monkey’s dash to the Director’s whiteboard');
    if ((P.nests || []).some(n => n.room === r.id) && why.length < 2) why.push('A mouse’s grille and nest are in its wall');
    out.needed = why.length ? why.join('; ') + '.' : '';
  }
  for (const id of shut) { const o = roomOut[id]; if (o && /only way/i.test(o.needed)) warn('a room on the shut list is the only way to somewhere: ' + id + ' ' + o.needed); }
}

// ------------------------------------------------------------------ the kinds asked for, and whether each was found
const KINDS = ['whiteboard', 'guard-note', 'lost-property', 'mouse', 'nest', 'desk', 'story-page', 'painting-living', 'painting-escape', 'painting-puzzle', 'painting-secret', 'piano', 'monitor', 'security-desk', 'terminal', 'heist-console', 'film-screen', 'arcade', 'vending', 'lion', 'coat-check', 'gift-shop', 'race', 'button', 'easel', 'hoop', 'cones', 'stunt-kit', 'perch', 'mosaic-tile', 'trophy-room', 'bench', 'way-in', 'robot', 'scene', 'secret', 'other'];
for (const k of KINDS) if (!items.some(i => i.kind === k)) notFound.push(k + ': nothing of this kind was found in the running game');
for (const it of items) if (!KINDS.includes(it.kind)) warn('item ' + it.id + ' has a kind that is not on the list: ' + it.kind);
// the secrets on the game's own list that no item stands for
{
  const text = JSON.stringify(items.map(i => [i.id, i.name, i.text]));
  const NOPLACE = { lostfirst: 'the first lost thing picked up, wherever that is', notes: 'ten of the guard’s notes, as a set', mice: 'all five mice seen home', nests: 'all five nests read', boards: 'the whiteboards as a set', 'race:all': 'every rival beaten', lastdonut: 'the game Last Donut on the security desk’s computer', fireworks: 'the fireworks plunger (listed as a button)', vending: 'any vending machine', cinema: 'any film screen', 'thorne:all': 'the four finds in the Thorne rooms', train: 'watching a train from the footbridge', traffic: 'stopping the traffic on Michigan Avenue', lionhunt: 'the twelve lions as a set' };
  for (const [id, name] of [...G.secrets.list]) { const sid = id.replace(/[^\w-]+/g, '-'); const cover = { outpost: 'arcade-outpost', rain: 'living-20684', croquet: 'living-44018' }[id]; if (cover && ids.has(cover)) continue;
    if (ids.has(sid) || [...ids].some(q => q.startsWith(sid)) || text.includes(name) || /^(arcade|piano|race):/.test(id)) continue; if (NOPLACE[id]) continue; notFound.push(`secret "${name}" (${id}): no place for it was found`); }
}
notFound.push('Not listed as items, though the game has them: the light switches (one in most rooms behind the scenes; LIGHTS works them, and ten off and ten on are trophies), the 925 loose chairs and stools, and the sprinkler zones the security terminal can set off (G.spots() gives each a middle, not a thing to go to).');

return { data: { build: (/const BUILD = '([^']+)'/.exec(SRC['main.js'] || '') || [])[1] || '', levels, rooms, doors, items, paths, areas, notFound }, warnings };
